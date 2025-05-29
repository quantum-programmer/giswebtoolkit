import GwtkSingleLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkSingleLayerItem';
import GwtkMapContentTask, { GwtkMapContentTaskState } from '@/components/GwtkMapContent/task/GwtkMapContentTask';
import { ProgressParameters } from '@/components/GwtkMapContent/Types';
import i18n from '@/plugins/i18n';
import AppWindow from 'gwsse-app/AppWindow';
import GISWebServerSEService from '../../../../gwsse-app/service/GISWebServerSEService';
import { AddingUserMap } from 'gwsse-app/service/GISWebServerSEService/Types';
import Layer from '~/maplayers/Layer';
import VirtualFolder from '~/maplayers/VirtualFolder';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import RequestService from '~/services/RequestServices/common/RequestService';
import RestExecutor from '~/services/RequestServices/RestService/RestExecutor';
import { CopyMap, CopyMapResponse, DeleteDataParams, DeleteLayerParams, GetLoadDataResponse, LoadData, RestExecuteStage } from '~/services/RequestServices/RestService/Types';
import { ServiceResponse } from '~/services/Utils/Types';
import { LogEventType } from '~/types/CommonTypes';
import { GwtkLayerDescription } from '~/types/Options';
import { ContentTreeNode, TreeNodeType } from '~/utils/MapTreeJSON';

export const SELECT_VIRTUAL_FOLDER = 'gwtkmapcomponent.selectvirtualfolder';
export const COPY_USER_MAP_TO_OTHER_STORAGE = 'gwtkmapcontent.copyusermaptootherstorage';
export const DELETE_USER_MAP_FROM_STORAGE = 'gwtkmapcontent.deleteusermapfromstorage';
export const SET_PROGRESS = 'gwtkmapcontent.setprogress';
export const MAPS_PUBLIC = 'maps-public';
export const MAPS_USER = 'maps-user';
export const USER_LAYERS = 'userlayers';

type GwtkMapContentTaskStateGwsse = GwtkMapContentTaskState & {
    [SELECT_VIRTUAL_FOLDER]: VirtualFolder;
    [COPY_USER_MAP_TO_OTHER_STORAGE]: GwtkSingleLayerItem;
    [DELETE_USER_MAP_FROM_STORAGE]: GwtkSingleLayerItem;
    [SET_PROGRESS]: ProgressParameters;
}


export default class GwtkMapContentTaskGwsse extends GwtkMapContentTask {

    private appParams = (this.mapWindow as AppWindow).appParams;

    get selectedVirtualFolderIsPublicStore(): boolean {
        return this.selectedVirtualFolder?.alias === i18n.t('mapcontent.Public maps');
    }

    get selectedVirtualFolderIsUserStore(): boolean {
        return this.selectedVirtualFolder?.alias === i18n.t('mapcontent.User maps');
    }

    get createMapPath(): string {
        let path = '';
        let subPath = '';
        if (this.appParams.loggedInFlag) {
            subPath = this.appParams.userName + '/';
        }
        if (this.selectedVirtualFolder?.folder) {
            path = this.selectedVirtualFolder.folder + '/' + subPath + this.widgetProps.publishMapObject.publishMapName;
        }
        return path;
    }


    setState<K extends keyof GwtkMapContentTaskStateGwsse>(key: K, value: GwtkMapContentTaskStateGwsse[K]) {
        super.setState(key as keyof GwtkMapContentTaskState, value as GwtkMapContentTaskState[keyof GwtkMapContentTaskState]);
        switch (key) {
            case SELECT_VIRTUAL_FOLDER:
                this.selectedVirtualFolder = value as VirtualFolder;
                break;
            case COPY_USER_MAP_TO_OTHER_STORAGE:
                this.copyUserMapToOtherStorage(value as GwtkSingleLayerItem).then();
                break;
            case DELETE_USER_MAP_FROM_STORAGE:
                this.deleteUserMapFromStorage(value as GwtkSingleLayerItem).then();
                break;
            case SET_PROGRESS:
                this.widgetProps.progress = value as ProgressParameters;
                break;
        }
    }

    get isAdmin() {
        return (this.mapWindow as AppWindow).appParams.isAdmin;
    }

    fillMenuListItems() {
        super.fillMenuListItems();
        
        this.widgetProps.menuListItems.push({
            vIf: (layerTreeItem: GwtkSingleLayerItem) => {
                return layerTreeItem instanceof GwtkSingleLayerItem && layerTreeItem.layer?.options.ownerLogin === this.map.options.username;
            },
            title: i18n.tc('mapcontent.Delete from storage'),
            icon: 'mdi-trash-can-outline',
            iconSize: '18',
            click: (layerTreeItem: GwtkSingleLayerItem) => {
                if (layerTreeItem instanceof GwtkSingleLayerItem) {
                    this.setState(DELETE_USER_MAP_FROM_STORAGE, layerTreeItem);
                }
            }
        });

        this.widgetProps.menuListItems.push({
            vIf: (layerTreeItem: GwtkSingleLayerItem) => {
                if (layerTreeItem instanceof GwtkSingleLayerItem) {
                    if (layerTreeItem.layer?.options.isPublic) {
                        return true;
                    }

                    if (!this.isAdmin) {
                        return false;
                    }

                    if (layerTreeItem.layer?.options.ownerLogin === this.map.options.username) {
                        return true;
                    }
                }
                return false;
            },
            title: (layerTreeItem: GwtkSingleLayerItem) => {
                const nodeName = (layerTreeItem instanceof GwtkSingleLayerItem && layerTreeItem.layer?.options.isPublic ? i18n.tc('mapcontent.User maps') : i18n.tc('mapcontent.Public maps')) + '';
                return i18n.tc('mapcontent.Into') + ' ' + nodeName.toLowerCase();
            },
            icon: (layerTreeItem: GwtkSingleLayerItem) => {
                return layerTreeItem instanceof GwtkSingleLayerItem && layerTreeItem.layer?.options.isPublic ? 'mdi-folder-account-outline' : 'mdi-share-variant-outline';
            },
            iconSize: '18',
            click: (layerTreeItem: GwtkSingleLayerItem) => {
                if (layerTreeItem instanceof GwtkSingleLayerItem) {
                    this.setState(COPY_USER_MAP_TO_OTHER_STORAGE, layerTreeItem);
                }
            }
        });
    }


    /**
    * Добавить созданную карту в пользовательские карты.
    * @protected
    * @async
    * @method addMapCreatedToUserMaps
    * @param {AddingUserMap} addingMap Данные для добавления
    */
    protected async addMapCreatedToUserMaps(addingMap: AddingUserMap): Promise<void> {
        const requestService = new GISWebServerSEService();
        const result = await requestService.addUserMap(addingMap).catch(() => { });
        if (result?.data?.data) {

            const layerId = result.data.data;

            this.addUserMapToTree(layerId, addingMap);
            this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Map added to storage'));

            this.map.options.settings_mapEditor?.maplayersid.push(layerId);

        } else {
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Error executing query'),
                display: true,
                type: LogEventType.Error
            });
        }
    }

    /**
    * Добавить пользовательскую карту в дерево.
    * @method addUserMapToTree
    * @param {string} layerId
    * @param {AddingUserMap} addingMap
    * @protected
    */
    protected addUserMapToTree(layerId: string, addingMap: AddingUserMap): void {
        const parentId = addingMap.isPublic ? MAPS_PUBLIC : MAPS_USER;
        const parentName = addingMap.isPublic ? i18n.tc('mapcontent.Public maps') : i18n.tc('mapcontent.User maps');
        const treeGroupNode: ContentTreeNode = {
            id: parentId,
            nodeType: TreeNodeType.Group,
            text: parentName,
            parentId: USER_LAYERS
        };
        this.map.onLayerListChanged(treeGroupNode);

        const options: GwtkLayerDescription = {
            id: layerId,
            alias: addingMap.alias,
            url: this.map.options.url + '?service=WMS&request=GetMap&version=1.3.0&format=image/png&bBox=%bbox&height=%h&width=%w&crs=%crs&layers=' + encodeURIComponent(addingMap.path),
            schemename: addingMap.scheme,
            ownerLogin: this.appParams.userName,
            selectObject: addingMap.selectObject,
        };
        if (addingMap.isPublic) {
            options.isPublic = 1;
        }
        const treeItem: ContentTreeNode = {
            id: layerId,
            nodeType: TreeNodeType.Layer,
            text: addingMap.alias,
            parentId,
        };
        this.map.openLayer(options, treeItem);
    }


    loadData() {
        const serviceUrl = GWTK.Util.getServerUrl(this.selectedVirtualFolder?.serviceUrl || this.map.options.url);
        const httpParams = RequestServices.createHttpParams(this.map, { url: serviceUrl });
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);

        let request, cancellableRequest;

        const options: LoadData = {
            XSDNAME: this.widgetProps.publishMapObject.publishMapExtension === '.zip' ? '' : this.widgetProps.publishMapObject.xsdList.select,
            LAYERNAME: this.widgetProps.publishMapObject.publishMapName,
            CRS: (this.getCrsName() != '') ? this.getCrsName() : this.map.getCrsString(),
            CREATEMAPSCALE: this.widgetProps.publishMapObject.publishMapScale + '',
            EXTENSION: this.widgetProps.publishMapObject.publishMapExtension,
            SAVEDPATH: this.createMapPath,
            FILENAME: this.widgetProps.uploadLink
        };

        if (this.selectedVirtualFolder && this.selectedVirtualFolder.folder === '') {
            delete options.SAVEDPATH;
        }
        if ((this.widgetProps.publishMapObject.xsdList.select === i18n.tc('mapcontent.By template'))) {
            options.XSDNAME = 'service';
        }
        if (this.widgetProps.publishMapObject.publishMapExtension === '.csv') {
            options.DELIMITERSYMBOL = ';';
        }
        request = service.loadData.bind(service);
        cancellableRequest = RequestService.sendCancellableRequest(request, options, httpParams);
        cancellableRequest.promise.then(response => {
            this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Publishing a map'));
            if (response.data) {
                const status = response.data.restmethod.outparams.status;
                if (status === 'Accepted') {
                    this.jobId = response.data.restmethod.outparams.jobId;
                }
            }
            if (this.jobId !== undefined) {
                this.getStatusResponse(this.jobId, serviceUrl);

            }
        }).catch((error) => {
            this.widgetProps.publishMapObject.uploadProgress = -1;
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Error executing query'),
                display: true,
                description: error,
                type: LogEventType.Error
            });
        });
    }


    getVirtualFolder() {
        this.widgetProps.publishMapObject.virtualFolderList.splice(0);
        this.widgetProps.publishMapObject.virtualFolderList.push({
            alias: `(${i18n.t('mapcontent.Empty').toString().toLowerCase()})`,
            folder: ''
        } as VirtualFolder);
        if (this.appParams.loggedInFlag && this.map.options.storageFolders?.publicStorage && this.map.options.storageFolders?.userStorage) {
            if (this.isAdmin) {
                this.widgetProps.publishMapObject.virtualFolderList.push({
                    alias: i18n.t('mapcontent.Public maps'),
                    folder: this.map.options.storageFolders.publicStorage,
                    serviceUrl: this.map.options.storageFolders.serviceUrl || this.map.options.url
                } as VirtualFolder);
            }
            this.widgetProps.publishMapObject.virtualFolderList.push({
                alias: i18n.t('mapcontent.User maps'),
                folder: this.map.options.storageFolders.userStorage,
                serviceUrl: this.map.options.storageFolders.serviceUrl || this.map.options.url
            } as VirtualFolder);
        }
        const virtualFolders = this.map.options.layers.filter(layer => Object.prototype.hasOwnProperty.call(layer, 'folder'))
            .map(layer => this.map.tiles.getVirtualFolderByxId(layer.id)) as VirtualFolder[];
        if (virtualFolders) {
            this.widgetProps.publishMapObject.virtualFolderList.push(...virtualFolders);
            this.selectedVirtualFolder = this.widgetProps.publishMapObject.virtualFolderList[0];
        }
    }


    async copyUserMapToOtherStorage(layerItem: GwtkSingleLayerItem): Promise<void> {
        if (!layerItem.layer) {
            return;
        }

        const storagePath = layerItem.layer.options.isPublic ? this.map.options.storageFolders?.userStorage : this.map.options.storageFolders?.publicStorage;
        const options: CopyMap = {
            LAYER: layerItem.layer.idLayer,
            SAVEDPATH: '' + storagePath + '/' + this.appParams.userName + '/' + layerItem.layer.alias + '/' + Date.now()
        };
        const httpParamsWms = RequestServices.createHttpParams(this.map, { url: this.map.options.storageFolders?.serviceUrl || this.map.options.url });
        const restExecutor = new RestExecutor<CopyMapResponse>(httpParamsWms, 'COPYMAP', options);
        this.setState(SET_PROGRESS, {
            visible: true,
            indeterminate: true
        });
        while (!await restExecutor.do()) {
            this.setState(SET_PROGRESS, {
                visible: true,
                percent: restExecutor.status.percent
            });
        }

        if (restExecutor.status.result) {
            await this.addMapCreatedToUserMaps({
                alias: layerItem.layer.alias,
                path: restExecutor.status.result.restmethod.createlayerlist[0].id,
                scheme: layerItem.layer.options.schemename.replace('.rsc', ''),
                isPublic: !layerItem.layer.options.isPublic,
                selectObject: true
            });
            this.setState(SET_PROGRESS, {
                visible: false
            });
        } else {
            this.setState(SET_PROGRESS, {
                visible: false
            });
        }
        if (restExecutor.status.error && restExecutor.status.stage !== RestExecuteStage.Cancelled) {
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Error executing query'),
                display: true,
                description: restExecutor.status.error.message,
                type: LogEventType.Error
            });
        }
    }

    async deleteUserMapFromStorage(layerItem: GwtkSingleLayerItem): Promise<void> {
        const layer = layerItem.layer;
        if (!layer) {
            return;
        }

        this.setState(SET_PROGRESS, {
            visible: true,
            indeterminate: true
        });

        await this.deleteUserMapFromTree(layer.id) &&
            await this.deleteLayerFromStorage(layer) &&
            await this.deleteDataFromStorage(layer) &&
            this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Map deleted from storage'));

        this.setState(SET_PROGRESS, {
            visible: false
        });
    }

    /**
     * Удалить пользовательскую карту из хранилища.
     * @protected
     * @async
     * @method deleteUserMapFromTree
     * @param id {Layer['id']} Слой
     * @return boolean
     */
    async deleteUserMapFromTree(id: Layer['id']): Promise<boolean> {
        const requestService = new GISWebServerSEService();
        const result = await requestService.deleteUserMap({ id }).catch(() => { });
        if (result?.data?.data) {
            this.map.closeLayer(id);
            return true;
        }

        this.map.writeProtocolMessage({
            text: i18n.tc('mapcontent.Error executing query'),
            display: true,
            type: LogEventType.Error
        });
        return false;
    }

    async deleteLayerFromStorage(layer: Layer): Promise<boolean> {
        const options: DeleteLayerParams = {
            LAYERS: layer.idLayer
        };
        const httpParamsWms = RequestServices.createHttpParams(this.map, { url: this.map.options.storageFolders?.serviceUrl || this.map.options.url });
        const restExecutor = new RestExecutor<string>(httpParamsWms, 'DELETELAYER', options);
        while (!await restExecutor.do()) { /* empty */ }

        if (restExecutor.status.error && restExecutor.status.stage !== RestExecuteStage.Cancelled) {
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Error executing query'),
                display: true,
                description: restExecutor.status.error.message,
                type: LogEventType.Error
            });
            return false;
        }

        return true;
    }

    async deleteDataFromStorage(layer: Layer): Promise<boolean> {
        const path = this.getLayerFolderPath(layer.idLayer);
        if (!path) {
            return false;
        }

        const httpParamsWms = RequestServices.createHttpParams(this.map, { url: this.map.options.storageFolders?.serviceUrl || this.map.options.url });
        const service = RequestServices.retrieveOrCreate(httpParamsWms, ServiceType.REST);

        const options: DeleteDataParams = {
            LAYER: path
        };

        const result = await service.deleteData(options);
        if (!result.data) {
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Error executing query'),
                display: true,
                description: result.error?.toString(),
                type: LogEventType.Error
            });
            return false;
        }

        return true;
    }

    getLayerFolderPath(idLayer: string): string {
        const parts = idLayer.split(/[\\/_]/);
        if (parts.length < 4) {
            return '';
        }
        parts.pop();
        return parts.join('/');
    }



    processResponse(processId: string, serviceUrl: string, statusMessage: string): void {
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);
        const request = service.getAsyncResultData.bind(service) as () => Promise<ServiceResponse<GetLoadDataResponse>>;
        const cancellableRequest = RequestService.sendCancellableRequest(request, { PROCESSNUMBER: processId });
        cancellableRequest.promise.then(result => {
            if (statusMessage === 'Failed') {
                this.widgetProps.publishMapObject.uploadProgress = -1;
                if (result.error && typeof result.error !== 'string'
                ) {
                    this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Could not publish map'));
                    this.map.writeProtocolMessage({
                        text: result.error.ExceptionReport.text,
                        display: false,
                        type: LogEventType.Error
                    });
                }
            } else if (result.data) {
                this.widgetProps.publishMapObject.publishedFolder = result.data.restmethod.createlayerlist[0].id;
                if (this.selectedVirtualFolderIsPublicStore || this.selectedVirtualFolderIsUserStore) {
                    this.addMapCreatedToUserMaps({
                        alias: this.widgetProps.publishMapObject.publishMapName,
                        path: this.widgetProps.publishMapObject.publishedFolder,
                        scheme: this.widgetProps.publishMapObject.xsdList.select === i18n.tc('mapcontent.By template') ? '' : this.widgetProps.publishMapObject.xsdList.select,
                        isPublic: this.selectedVirtualFolderIsPublicStore,
                        selectObject: true
                    }).then();
                }
                this.widgetProps.publishMapObject.isPublished = true;
                if (this.widgetProps.publishMapObject.xsdList.select === i18n.tc('mapcontent.By template')) {
                    this.createThematicMapFromPublishedMap(this.widgetProps.publishMapObject.publishedFolder);
                } else {
                    this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.The map has been published'));
                    if (this.selectedVirtualFolder && this.selectedVirtualFolder.folder === '') {
                        this.openPublishMapInUsersLayersFolder(this.widgetProps.publishMapObject.publishedFolder);
                    } else {
                        this.openPublishMap(this.widgetProps.publishMapObject.publishedFolder);
                    }
                    this.map.writeProtocolMessage({
                        text: i18n.tc('mapcontent.The map has been published'),
                        display: false,
                        type: LogEventType.Info
                    });
                }
            }
        }).catch((error) => {
            this.widgetProps.publishMapObject.uploadProgress = -1;
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Could not publish map'),
                display: true,
                description: error,
                type: LogEventType.Error
            });
        });
    }


}