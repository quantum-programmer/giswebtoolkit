/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Класс Виртуальная папка                    *
 *                                                                  *
 *******************************************************************/

import { GwtkMap, Visibility } from '~/types/Types';
import { ContentTreeNode, TreeNodeType } from '~/utils/MapTreeJSON';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import {
    FolderResponseDescription,
    FolderResponseEndNode,
    FolderResponseNode
} from '~/services/RequestServices/RestService/Types';
import { GwtkLayerDescription } from '~/types/Options';
import { LogEventType } from '~/types/CommonTypes';
import Layer from '~/maplayers/Layer';
import { PROJECT_SETTINGS_LAYER_PARAMETERS_ARRAY } from '~/utils/WorkspaceManager';
import Utils from '~/services/Utils';
import { ServiceResponse } from '~/services/Utils/Types';
import GwtkError from '~/utils/GwtkError';


export type Node = ContentTreeNode & {
    folderLayerId?: string; // для хранения и использования внутри компонента
    nodes: Node[];
};

type LayerItem = {
    folderLayerId: string;
    id: string;
    text: string;
};

const DEFAULT_DATATYPES = ['MAP', 'SIT', 'SITX', 'MPT', 'MTW', 'MTL', 'MTQ', 'RSW'];


type LayerParams = {
    selectObject: boolean;               // Возможность выбора объектов карты (1/0)
    layerContainer: undefined,          // Контейнер слоя (не используется)
    visible: boolean;                 // Признак видимости слоя (1/0)
    classifier: undefined,
    token: undefined,
    legend: undefined,
    authtype?: 'pam';
    zIndex: number;
}

/**
 * Класс Виртуальная папка
 * API для доступа к слоям данных из виртуальной папки
 * @class VirtualFolder
 */
export default class VirtualFolder {

    readonly id: string = '';
    alias: string = '';
    readonly folder: string = '';
    readonly serviceUrl: string = '';

    private readonly map: GwtkMap;
    private readonly folderService: 'wms' | 'wmts' = 'wms';          // Сервис получения изображений слоев виртуальной папки

    private readonly hostName: string = '';
    private readonly layerAlias: string = '';
    private readonly name;                    // имя папки

    private readonly datatypes: string = DEFAULT_DATATYPES.join(',');               // типы данных из папки
    readonly nodes: Node[] = [];                   // настроенное дерево папки

    private readonly delimiter: '#' | '_' = '_';        // Разделитель идентификатора папки (новый содержит '#')

    private readonly layerParams: LayerParams = {
        selectObject: false,               // Возможность выбора объектов карты (1/0)
        layerContainer: undefined,          // Контейнер слоя (не используется)
        visible: false,                 // Признак видимости слоя (1/0)
        classifier: undefined,
        token: undefined,
        legend: undefined,
        authtype: undefined,
        zIndex: 1
    };

    private initialRequestPromise?: Promise<void>;

    private updatePromise?: Promise<void>;

    private updateIsInProgress: boolean = false;

    get updateProcess(): boolean {
        return this.updateIsInProgress;
    }

    get innerLayersAreEditable(): boolean {
        return !!this.map.options.settings_mapEditor && (this.map.options.settings_mapEditor.virtualfolders?.find(virtualfolder => virtualfolder.id === this.id) !== undefined);
    }

    private readonly enabled;

    /**
     * @constructor VirtualFolder
     * @param map {GwtkMap} Экземпляр карты
     * @param options {GwtkLayerDescription} Описание слоя
     */
    constructor(map: GwtkMap, options: GwtkLayerDescription) {
        this.map = map;                  // карта

        this.id = options.id;

        this.serviceUrl = (options.url || this.map.options.url);

        this.enabled = options.enabled || false;

        if (options.alias) {
            this.alias = options.alias;
        }

        if (options.folder) {
            this.folder = options.folder;
            if (this.folder.indexOf('#') !== -1) {
                this.delimiter = '#';
            }

            if (this.folder[this.folder.length - 1] === this.delimiter) {
                this.folder = this.folder.slice(0, this.folder.length - 1);
            }
        }

        this.folderService = options.service || 'wms';

        this.layerParams.selectObject = options.selectObject || false;
        this.layerParams.legend = options.legend || undefined;
        this.layerParams.token = options.token || undefined;
        this.layerParams.authtype = options.authtype || undefined;

        if (options.zIndex !== undefined) {
            this.layerParams.zIndex = options.zIndex;
        }

        if (options.datatype) {
            if (Array.isArray(options.datatype)) {
                this.datatypes = options.datatype.join(',').toUpperCase(); // типы слоев данных из папки ['sit', 'map', ...]
            } else if (options.datatype !== '*') {
                this.datatypes = options.datatype;//TODO: непредсказуемый администратор
            }
        }

        const folderLowerCase = this.folder.toLowerCase();

        if (folderLowerCase.indexOf('host') === 0) {

            const alias = this.delimiter + 'alias' + this.delimiter,
                arr = folderLowerCase.split(alias);

            let host = this.folder.slice(0, arr[0].length);
            const str = host.split(this.delimiter);
            host = str.join('#');
            this.hostName = host;
            const ii = folderLowerCase.indexOf(arr[1]);
            this.layerAlias = this.folder.slice(0, ii);
            this.name = this.folder.slice(ii);
        } else {
            const ii = folderLowerCase.indexOf(this.delimiter) + 1;
            this.layerAlias = this.folder.slice(0, ii);
            this.name = this.folder.slice(ii);
        }

        if (!this.name || this.datatypes.length === 0) {
            throw Error('VirtualFolder. ' + this.map.translate('Not defined a required parameter') + ' folderName or datatypes.');
        }

        // установить признак аутентификации
        //TODO: переделать через метод, а не напрямую в tiles
        if (this.layerParams.authtype === 'pam' && !this.map.tiles.authentication.pam.find(item => item.url === this.serviceUrl)) {
            this.map.tiles.authentication.pam.push({ url: this.serviceUrl });
        }


    }

    /**
     * Очистка параметров при удалении слоя
     * @method destroy
     */
    destroy(): void {

        const layerIdsToBeDeleted: string[] = [];

        this.nodes.forEach(node => VirtualFolder.fillIdList(node, layerIdsToBeDeleted));

        for (let i = 0; i < layerIdsToBeDeleted.length; i++) {
            const layer = this.map.tiles.getLayerByFilter({
                idLayer: layerIdsToBeDeleted[i],
                serviceUrl: this.serviceUrl
            });
            if (layer) {
                this.map.closeLayer(layer.xId);
            }
        }

        this.map.trigger({ type: 'layerlistchanged', maplayer: { 'id': this.id, 'act': 'remove' } });
    }

    async createUserLayer(alias: string, xsdName = 'service'): Promise<string[]> {
        const result: string[] = [];

        const url = this.serviceUrl;

        const restService = RequestServices.getService(url, ServiceType.REST);

        try {

            const response = await restService.createUserMap({
                XSDNAME: xsdName,
                LAYERNAME: alias,
                CRS: this.map.getCrsString(),
                VIRTUALFOLDER: '0',
                CREATEMAPSCALE: '2000000',
                SAVEDPATH: `${this.folder}/${alias}`
            });

            if (response.data) {
                await this.update();
                response.data.restmethod.createlayerlist.forEach(layerDescription => {
                    const layer = this.openLayer({ idLayer: layerDescription.id });
                    if (layer) {
                        this.map.setLayerVisibility(layer, true);
                        result.push(layer.xId);
                    }
                });
            } else if (response.error) {

                type ExceptionReport = {
                    ExceptionReport: {
                        code: string;
                        description: string;
                        locator: string;
                        text: string;
                    }
                };

                const error = response.error as unknown as ExceptionReport;

                let text = error.ExceptionReport.code;
                if (text === 'ErrorOpenOrCreateFile') {
                    text = this.map.translate('Error opening or creating file');
                } else if (text === 'OperationNotPermitted') {
                    text = this.map.translate('Operation not permitted');
                }


                this.map.writeProtocolMessage({
                    type: LogEventType.Error,
                    display: true,
                    text,
                    description: error.ExceptionReport.description || error.ExceptionReport.text
                });
            }
        } catch (error) {
            this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
        }
        return result;
    }

    /**
     * Открыть слой карты
     * @method createLayer
     * @param params {object} Параметры слоя
     * @return {Layer|undefined} Созданный или существующий слой
     */
    openLayer(params: { id?: string; idLayer?: string; }): Layer | undefined {
        let node;
        if (params.id !== undefined) {
            node = this.findNodeById(this.nodes, params.id);

        } else if (params.idLayer !== undefined) {
            const folderLayerId = params.idLayer.replace(this.layerAlias, '');
            node = this.findNodeByFolderLayerId(this.nodes, folderLayerId);
        }

        if (node && node.nodeType === TreeNodeType.Layer) {
            let mapLayer = this.map.tiles.getLayerByxId(node.id);
            if (mapLayer) {
                return mapLayer;
            }

            const idLayer = this.layerAlias + node.folderLayerId;

            const param: GwtkLayerDescription = {
                id: node.id,
                alias: node.text,
                url: this.createLayerUrl(idLayer),
                hidden: 1,
                token: this.layerParams.token,
                legend: this.layerParams.legend,
                selectObject: this.layerParams.selectObject || false,
                authtype: this.layerParams.authtype || undefined,
                zIndex: this.layerParams.zIndex
            };

            mapLayer = this.map.openLayer(param);

            if (mapLayer) {
                mapLayer.setOpacity(+mapLayer.initOpacity());

                // при выборе объектов чтобы отображалось название карты, добавим в список слой
                if (this.checkInnerLayerIsEditable(idLayer)) {
                    // добавить в список редактируемых слоев
                    if (this.map.options.settings_mapEditor && !this.map.options.settings_mapEditor.maplayersid.includes(param.id)) {
                        this.map.options.settings_mapEditor.maplayersid.push(param.id);
                    }
                }

                return mapLayer;
            } else {
                this.map.writeProtocolMessage({
                    type: LogEventType.Error,
                    display: true,
                    text: this.map.translate('Map layer creation error') + ': virtual folder:' +
                        this.name + ', id:' + param.id
                });
            }
        }
    }

    /**
     * Проверить есть ли возможность редактирования слоя
     * @method checkInnerLayersAreEditable
     * @param idLayer {string} Идентификатор слоя
     * @return {boolean}
     */
    checkInnerLayerIsEditable(idLayer: string): boolean {
        let result = false;
        const virtualFolder = this.map.options.settings_mapEditor?.virtualfolders?.find(virtualfolder => virtualfolder.id === this.id);
        if (virtualFolder) {
            result = true;
            if (virtualFolder.paths) {
                result = false;
                const idLayerWithUnderscore = idLayer.replaceAll('/', '_');
                for (let i = 0; i < virtualFolder.paths.length; i++) {
                    const pathWithUnderscore = virtualFolder.paths[i].replaceAll('/', '_');
                    if (idLayerWithUnderscore.includes(pathWithUnderscore)) {
                        result = true;
                        break;
                    }
                }
            }
        }
        return result;
    }

    /**
     * Удалить слой данных
     * @async
     * @method removeLayer
     * @param xId {string} Идентификатор слоя
     */
    async removeLayer(xId: string): Promise<void> {
        const url = this.serviceUrl;
        if (url) {
            const node = this.findNodeById(this.nodes, xId);
            if (node && node.folderLayerId) {
                this.updateIsInProgress = true;
                const idLayer = this.layerAlias + node.folderLayerId;

                // TODO: в идеале вызывать метод у слоя
                const httpParams = RequestServices.createHttpParams(this.map, { url });
                const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
                try {
                    if (this.hostName) {
                        await service.deleteLayerOnGISServer({ LAYER: idLayer });
                    } else {
                        await service.deleteLayer({ LAYERS: idLayer });
                    }
                    await this.update();
                } catch (error) {
                    if (error) {
                        const gwtkError = new GwtkError(error);
                        this.map.writeProtocolMessage({ text: gwtkError.message, type: LogEventType.Error });
                        throw error;
                    }
                    this.map.writeProtocolMessage({
                        type: LogEventType.Error,
                        display: true,
                        text: this.map.translate('Failed to delete data') + ': VirtualFolder - ' + idLayer
                    });
                }
                this.updateIsInProgress = false;
            }
        }
    }

    getLayerItemList(filter?: string): LayerItem[] {
        const result: LayerItem[] = [];
        let regExp;
        if (filter !== undefined) {
            if (filter.indexOf(this.name) !== 0) {
                if (filter[0] === '/') {
                    filter = filter.substring(1);
                }
                filter = this.name + '/' + filter;
            }
            filter = filter.split('/').join('[_/\\\\]');
            regExp = RegExp('^' + filter + '[_/\\\\]([^_/\\\\]+)[_/\\\\]');
        }

        this.fillLayerIdList(this.nodes, result, regExp);
        return result;
    }

    getVisibility(): Visibility {
        return this.getNodesVisibility(this.nodes, undefined) || 'hidden';
    }

    private getNodesVisibility(nodes: Node[], previousResult: Visibility | undefined): Visibility | undefined {

        let result: Visibility | undefined = undefined;

        for (let i = 0; i < nodes.length; i++) {

            const node = nodes[i];
            if (node.nodeType === TreeNodeType.Layer) {
                const layer = this.map.tiles.getLayerByxId(node.id);
                if (layer) {
                    if (layer.visible) {
                        if (previousResult === undefined) {
                            if (result === 'hidden') {
                                return 'half-visible';
                            }
                            result = 'visible';
                        } else if (previousResult === 'hidden') {
                            return 'half-visible';
                        }
                    } else {
                        if (previousResult === undefined) {
                            if (result === 'visible') {
                                return 'half-visible';
                            }
                            result = 'hidden';
                        } else if (previousResult === 'visible') {
                            return 'half-visible';
                        }
                    }
                } else {
                    result = (result === 'visible' || result === 'half-visible') ? 'half-visible' : 'hidden';
                }
            }

            if (node.nodes.length > 0) {
                const currentResult = this.getNodesVisibility(node.nodes, result);
                if (currentResult === 'half-visible') {
                    return 'half-visible';
                } else if (currentResult === 'visible') {
                    if (previousResult === undefined) {
                        if (result === 'hidden') {
                            return 'half-visible';
                        }
                        result = 'visible';
                    } else if (previousResult === 'hidden') {
                        return 'half-visible';
                    }
                } else if (currentResult !== undefined) {
                    if (previousResult === undefined) {
                        if (result === 'visible') {
                            return 'half-visible';
                        }
                        result = 'hidden';
                    } else if (previousResult === 'visible') {
                        return 'half-visible';
                    }
                }
            }

        }
        return result;
    }

    setVisibility(value: boolean) {
        this.setNodesVisibility(this.nodes, value);
    }

    private setNodesVisibility(nodes: Node[], value: boolean) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            if (node.nodeType === TreeNodeType.Layer) {
                const layer = this.map.tiles.getLayerByxId(node.id);
                if (layer) {
                    layer.setVisibility(value);
                } else {
                    const mapLayer = this.openLayer({ id: node.id });
                    if (mapLayer) {
                        mapLayer.setVisibility(value);
                    }
                }
            }

            if (node.nodes) {
                this.setNodesVisibility(node.nodes, value);
            }
        }
    }

    /**
     * Первичный запрос состава (выполняется только 1 раз)
     * @async
     * @method initialUpdate
     */
    initialUpdate(): Promise<void> {
        return this.initialRequestPromise ? this.initialRequestPromise : this.update();
    }

    /**
     * Обновить состав виртуальной папки
     * @async
     * @method update
     */
    async update(): Promise<void> {
        if (!this.updatePromise) {
            this.updatePromise = this.runUpdate();
        }

        if (!this.initialRequestPromise) {
            this.initialRequestPromise = this.updatePromise;
        }

        return this.updatePromise;
    }

    /**
     * Переименовать узел
     * @async
     * @method renameData
     * @param node {object} Узел для переименования
     * @param newName {string} Новое название
     */
    async renameData(node: { id: string; text: string }, newName: string): Promise<ServiceResponse | undefined> {

        if (this.hostName) {

            const currentNode = this.findNodeById(this.nodes, node.id);

            if (currentNode && currentNode.folderLayerId) {

                const folderName = currentNode.folderLayerId.substring(0, currentNode.folderLayerId.indexOf(node.text));

                const path = this.layerAlias + folderName + node.text;
                const newPath = this.layerAlias + folderName + newName;
                if (path !== newPath) {
                    const requestService = RequestServices.getService(this.serviceUrl, ServiceType.REST);

                    return await requestService.renameDataOnGISServer({
                        LAYER: path,
                        OUTPATHLIST: newPath
                    });

                }
            }
        } else {
            throw Error('Renaming is enabled only for GISServer folders');
        }
    }

    private fillLayerIdList(nodes: Node[], result: LayerItem[], regExp?: RegExp): void {
        nodes.forEach(node => {
            if (node.folderLayerId) {

                if (regExp === undefined) {
                    result.push({ id: node.id, folderLayerId: node.folderLayerId, text: node.text });
                } else {
                    let m;
                    if ((m = regExp.exec(node.folderLayerId)) !== null) {
                        // The result can be accessed through the `m`-variable.
                        if (m[1]) {
                            result.push({ id: node.id, folderLayerId: node.folderLayerId, text: m[1] });
                        }
                    }
                }
            }
            if (node.nodes) {
                this.fillLayerIdList(node.nodes, result, regExp);
            }
        });
    }

    private async runUpdate(): Promise<void> {
        this.updateIsInProgress = true;
        try {
            const result = await this.getFolderData();
            this.updateIsInProgress = false;

            if (!result) return;

            this.fillTree(result);

            await this.cleanWorkspace();

            let updateFlag = false;
            this.nodes.forEach(node => {
                if (this.applyNodeSettings(node)) {
                    updateFlag = true;
                }
            });
            if (updateFlag) {
                this.map.tiles.wmsUpdate();
            }

            // заполнить дерево
            if (this.enabled) {
                let update = false;
                for (let i = 0; i < this.nodes.length; i++) {
                    if (this.map.contentTreeManager.updateTreeNodeList(this.nodes[i])) {
                        update = true;
                    }
                }
                if (update) {
                    this.map.trigger({type: 'layerlistchanged', target: 'map'});
                }
            } else {
                this.map.trigger({type: 'layerlistchanged', target: 'map'});
            }
        } catch (error) {
            this.updateIsInProgress = false;
            throw error;
        } finally {
            this.updatePromise = undefined;
        }
    }

    private getWorkspaceParams() {
        return this.map.workspaceManager.getValue(PROJECT_SETTINGS_LAYER_PARAMETERS_ARRAY);
    }

    private cleanWorkspace() {
        const layerParameters = this.getWorkspaceParams();

        for (let i = layerParameters.length - 1; i >= 0; i--) {
            const id = layerParameters[i].id;
            if (id.indexOf(this.id) === 0 && !this.findNodeById(this.nodes, id)) {
                layerParameters.splice(i, 1);
            }
        }

        this.map.workspaceManager.setValue(PROJECT_SETTINGS_LAYER_PARAMETERS_ARRAY, layerParameters);
    }

    private applyNodeSettings(node: Node): boolean {
        let updateFlag = false;
        if (node.nodeType === TreeNodeType.Layer) {
            const layerParameters = this.getWorkspaceParams().find(layerParameters => layerParameters.id === node.id);
            if (layerParameters && !this.map.tiles.getLayerByxId(node.id)) {
                const mapLayer = this.openLayer({ id: node.id });
                if (mapLayer) {
                    if (layerParameters.hidden) {
                        mapLayer.hide();
                    } else {
                        mapLayer.show();
                        updateFlag = true;
                    }

                    if (layerParameters.opacity !== undefined) {
                        mapLayer.setOpacity(layerParameters.opacity);
                    }
                }
            }
        } else if (node.nodeType === TreeNodeType.Group) {
            node.nodes.forEach((node: Node) => {
                if (this.applyNodeSettings(node)) {
                    updateFlag = true;
                }
            });
        }
        return updateFlag;
    }

    /**
     * Сформировать Url-адрес для слоя
     * @method createLayerUrl
     * @param idLayer {string} Идентификатор слоя на сервисе
     * @return {string} Url-адрес для слоя
     */
    private createLayerUrl(idLayer: string) {
        // адрес запроса слоев из виртуальной папки
        let url = this.serviceUrl + '?service=' + this.folderService + '&request=';
        if (this.folderService == 'wms') {
            url += 'GetMap&VERSION=1.3.0&FORMAT=image/png&nopainterror=1&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt&LAYERS=' + encodeURIComponent(idLayer);
        } else {
            url += 'GetTile&VERSION=1.0.0&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png&LAYER=' + encodeURIComponent(idLayer);
        }
        return url;
    }

    /**
     * Получить данные папки
     * @async
     * @method getFolderData
     * @return {FolderResponseDescription| undefined} Состав виртуальной папки
     */
    private async getFolderData(): Promise<FolderResponseDescription | undefined> {

        const url = this.serviceUrl;

        let HOSTNAME;
        if (this.hostName) {
            HOSTNAME = encodeURIComponent(this.hostName);
        }

        const PATHNAME = this.name,
            DATATYPE = this.datatypes;

        const httpParams = RequestServices.createHttpParams(this.map, { url });

        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);

        try {
            const response = await service.getDataFromFolder({
                PATHNAME,
                DATATYPE,
                HOSTNAME
            }, httpParams);
            if (response.data) {

                const folderTree = response.data.folder.find(item => item.alias === this.name);

                if (!folderTree) {
                    this.map.writeProtocolMessage({
                        type: LogEventType.Error,
                        display: true,
                        text: this.map.translate('Failed to get data') + ': VirtualFolder - ' + this.name
                    });
                    return;
                }
                return folderTree;
            }
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                type: LogEventType.Error,
                text: gwtkError.message
            });

            this.map.writeProtocolMessage({
                type: LogEventType.Error,
                display: true,
                text: this.map.translate('Failed to get data') + ': VirtualFolder - ' + this.name
            });

        }
    }

    /**
     * Найти узел по идентификатору (с учетом вложенных узлов)
     * @method findNodeById
     * @param nodes {Node[]} Узлы для поиска
     * @param id {string} Идентификатор узла
     * @return {Node|undefined} Узел состава виртуальной папки
     */
    private findNodeById(nodes: Node[], id: string): Node | undefined {
        let result: Node | undefined;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.id === id) {
                result = node;
            } else if (node.nodes) {
                result = this.findNodeById(node.nodes, id);
            }
            if (result) {
                break;
            }
        }
        return result;
    }

    /**
     * Найти узел по названию (с учетом вложенных узлов)
     * @method findNodeById
     * @param nodes {Node[]} Узлы для поиска
     * @param folderLayerId {string} Имя узла
     * @return {Node|undefined} Узел состава виртуальной папки
     */
    private findNodeByFolderLayerId(nodes: Node[], folderLayerId: string): Node | undefined {
        let result: Node | undefined;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.folderLayerId === folderLayerId || (this.hostName && node.folderLayerId === folderLayerId.replaceAll('/', '_'))) {
                result = node;
            } else if (node.nodes) {
                result = this.findNodeByFolderLayerId(node.nodes, folderLayerId);
            }
            if (result) {
                break;
            }
        }
        return result;
    }

    /**
     * Заполнить узлы дерева (метод рекурсивно устанавливает идентификаторы и свойства узлов дерева папки)
     * @method fillTree
     * @param folderTree {FolderResponseDescription} Состав папки из ответа сервиса
     */
    private fillTree(folderTree: FolderResponseDescription): void {

        // Удаление существующих узлов, которых нет в ответе
        if (this.nodes.length) {
            let update = false;
            for (let i = this.nodes.length - 1; i >= 0; i--) {

                const nodeId = this.nodes[i].text;
                let foundNode;
                if (folderTree) {
                    let key: keyof FolderResponseDescription;
                    for (key in folderTree) {
                        if (key === 'alias') {
                            continue;
                        }
                        const folderTreeValue = folderTree[key] as FolderResponseNode;

                        if (folderTreeValue.comm) {
                            if (folderTreeValue.text === nodeId) {
                                foundNode = folderTreeValue;
                            }
                        } else {
                            //случай для карт в корне папки
                            foundNode = folderTreeValue.nodes.find(node => node.text === nodeId);
                        }

                        if (foundNode) {
                            break;
                        }
                    }
                }
                if (!foundNode) {
                    const [deletedNode] = this.nodes.splice(i, 1);
                    if (deletedNode) {
                        if (deletedNode.nodeType === TreeNodeType.Group) {
                            this.cleanNodeList(deletedNode.nodes, []);
                        } else {
                            this.map.closeLayer(deletedNode.id);
                        }
                    }
                    if (this.map.contentTreeManager.updateTreeNodeList({...deletedNode, remove: true})) {
                        update = true;
                    }
                } else if (VirtualFolder.isFolderNode(foundNode)) {
                    this.cleanNodeList(this.nodes[i].nodes, foundNode.nodes);
                    if (this.nodes[i].nodes.length === 0) {
                        const [deletedNode] = this.nodes.splice(i, 1);
                        if (deletedNode) {
                            if (this.map.contentTreeManager.updateTreeNodeList({...deletedNode, remove: true})) {
                                update = true;
                            }
                        }
                    }
                }
            }
            if (update) {
                this.map.trigger({type: 'layerlistchanged', target: 'map'});
            }
        }


        // Заполнение новых узлов, либо обновление существующих

        let key: keyof FolderResponseDescription;
        for (key in folderTree) {

            if (key === 'alias') {
                continue;
            }

            const folderTreeValue: FolderResponseNode | FolderResponseEndNode = folderTree[key];

            const node: Node = {
                id: this.id,
                text: '',
                parentId: this.id,
                nodeType: TreeNodeType.Group,
                nodes: []
            };
            VirtualFolder.fillNode(node, folderTreeValue);

            const index = this.nodes.findIndex((item) => item.text === node.text);
            if (index === -1) {
                if (node.nodeType === TreeNodeType.Group && !node.text) {   // из этого узла берем только слои данных из nodes
                    if (Array.isArray(node.nodes)) {
                        for (let i = 0; i < node.nodes.length; i++) {
                            const currentNode = node.nodes[i];
                            if (this.nodes.findIndex(node => node.text === currentNode.text) === -1) {
                                currentNode.parentId = this.id;
                                this.nodes.push(currentNode);
                            }
                        }
                    }
                } else {
                    this.nodes.push(node);
                }
            } else {
                this.nodes.splice(index, 1, VirtualFolder.updateNode(this.nodes[index], node));
            }
        }
        this.nodes.sort((nodeA, nodeB) => Utils.sortAlphaNum(nodeA.text, nodeB.text));
    }

    /**
     * Удалить лишние узлы (с учетом вложенных узлов)
     * @method cleanNodeList
     * @param nodes {Node[]} Текущие узлы
     * @param folderNodes {(FolderResponseNode | FolderResponseEndNode)[]} Узлы из ответа сервиса
     */
    private cleanNodeList(nodes: Node[], folderNodes: (FolderResponseNode | FolderResponseEndNode)[]): void {

        let update = false;

        for (let nodeIndex = nodes.length - 1; nodeIndex >= 0; nodeIndex--) {
            const nodeId = nodes[nodeIndex].text;
            let foundNode;
            for (let k = 0; k < folderNodes.length; k++) {
                const folderTreeValue = folderNodes[k];

                // Пропуск фиктивных узлов
                if (VirtualFolder.isFolderNode(folderTreeValue) && !folderTreeValue.comm) {
                    continue;
                }

                if (folderTreeValue.text === nodeId) {
                    foundNode = folderTreeValue;
                    break;
                }
            }

            if (!foundNode) {

                const [deletedNode] = nodes.splice(nodeIndex, 1);
                if (deletedNode) {
                    if (deletedNode.nodeType === TreeNodeType.Group) {
                        this.cleanNodeList(deletedNode.nodes, []);
                    } else {
                        this.map.closeLayer(deletedNode.id);
                    }
                }
                if (this.map.contentTreeManager.updateTreeNodeList({...deletedNode, remove: true})) {
                    update = true;
                }
            } else {
                if (VirtualFolder.isFolderNode(foundNode)) {
                    this.cleanNodeList(nodes[nodeIndex].nodes, foundNode.nodes);
                    if (nodes[nodeIndex].nodes.length === 0) {
                        const [deletedNode] = nodes.splice(nodeIndex, 1);
                        if (deletedNode) {
                            if (this.map.contentTreeManager.updateTreeNodeList({...deletedNode, remove: true})) {
                                update = true;
                            }
                        }
                    }
                }
            }
        }
        if (update) {
            this.map.trigger({type: 'layerlistchanged', target: 'map'});
        }
    }

    /**
     * Обновить узел (с учетом вложенных узлов)
     * @method updateNode
     * @param targetNode {Node} Текущий узел
     * @param sourceNode {Node} Узел из ответа сервиса
     * @return {Node} Обновленный узел
     */
    private static updateNode(targetNode: Node, sourceNode: Node): Node {

        let targetNodeKey: keyof Node;
        for (targetNodeKey in sourceNode) {
            if (targetNodeKey === 'nodes') {
                const nodes = (targetNode[targetNodeKey] as Node[]).slice();
                targetNode[targetNodeKey].splice(0);

                for (let i = 0; i < sourceNode[targetNodeKey].length; i++) {
                    const folderNode = sourceNode[targetNodeKey][i];
                    const existNode = nodes.find(item => item.text === folderNode.text && item.folderLayerId === folderNode.folderLayerId);
                    if (existNode) {
                        this.updateNode(existNode, folderNode);
                        targetNode[targetNodeKey][i] = existNode;
                    } else {
                        targetNode[targetNodeKey][i] = folderNode;
                    }
                }
            } else if (targetNodeKey !== 'id') {
                Reflect.set(targetNode, targetNodeKey, sourceNode[targetNodeKey]);
            }
        }
        return targetNode;
    }

    /**
     * Заполнить список названий узлов (с учетом вложенных узлов)
     * @method fillIdList
     * @param node {Node} Текущий узел
     * @param nameList {string{]}} Список названий узлов
     */
    private static fillIdList(node: Node, nameList: string[]): void {
        if (node.nodeType === TreeNodeType.Layer && node.folderLayerId) {
            nameList.push(node.folderLayerId);
        } else {
            (node.nodes as Node[]).forEach(currentNode => {
                this.fillIdList(currentNode, nameList);
            });
        }
    }

    /**
     * Заполнить узел папки
     * @method fillNode
     * @param node {Node} узел папки
     * @param sourceNode {Object} узел ответа сервиса
     */
    private static fillNode(node: Node, sourceNode: FolderResponseNode | FolderResponseEndNode): void {
        // изображение узла
        if (!sourceNode.comm) {
            if (VirtualFolder.isFolderNode(sourceNode)) {
                node.nodeType = TreeNodeType.Group; // такой узел пропустим, но его слои данных (если есть), выведем
            } else {
                node.id = node.parentId + sourceNode.name.replaceAll(/[/\\]/g, '_');
                node.nodeType = TreeNodeType.Layer;
                node.folderLayerId = sourceNode.name;
                node.text = sourceNode.text;
            }
        } else {
            node.id = node.id + sourceNode.text;
            node.nodeType = TreeNodeType.Group;
            node.text = sourceNode.text;
        }

        if (VirtualFolder.isFolderNode(sourceNode)) {

            sourceNode.nodes.forEach((snode, index) => {
                const childNode: Node = {
                    id: node.id + index,
                    text: '',
                    parentId: node.id,
                    nodeType: TreeNodeType.Group,
                    nodes: []
                };
                this.fillNode(childNode, snode);
                node.nodes.push(childNode);
            });
            node.nodes.sort((nodeA, nodeB) => Utils.sortAlphaNum(nodeA.text, nodeB.text));
        }
    }

    /**
     * Проверка, является ли узел промежуточным
     * @method isFolderNode
     * @param value {FolderResponseNode | FolderResponseEndNode} Текущий узел
     * @return {boolean} `true` - узел промежуточный
     */
    private static isFolderNode(value: FolderResponseNode | FolderResponseEndNode): value is FolderResponseNode {
        return 'nodes' in value;
    }

}
