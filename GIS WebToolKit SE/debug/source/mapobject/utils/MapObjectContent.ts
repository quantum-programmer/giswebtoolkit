/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Класс расширенного описания объекта карты          *
 *                                                                  *
 *******************************************************************/

import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import MapObjectSemanticContent from '~/mapobject/utils/MapObjectSemanticContent';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import BrowserService from '~/services/BrowserService/BrowserService';
import {LogEventType} from '~/types/CommonTypes';
import {RscSemantic} from '~/services/RequestServices/RestService/Types';
import {ClassifierTypeSemantic} from '~/classifier/Classifier';
import {
    PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER,
    Unit,
    UnitText
} from '~/utils/WorkspaceManager';
import Utils from '~/services/Utils';
import Layer from '~/maplayers/Layer';


const CREATE_OBJECT_ACTION = 'gwtkmapobjectcontent.createobject';
const DELETE_OBJECT_ACTION = 'gwtkmapobjectcontent.deleteobject';

export type ClassifierSemantic = {
    code: string;
    key: string;
    reference: {
        name: string;
        text: string;
        value: string;
    }[];
}

/**
 * Класс расширенного описания объекта карты
 * @class MapObjectContent
 * @extends MapObject
 */
export default class MapObjectContent extends MapObject {

    /**
     * Список семантик классификатора
     */
    readonly classifierSemanticList: ClassifierTypeSemantic[] = [];

    readonly semanticOfObjectSemanticsList: RscSemantic[] = [];

    private showAllSemantics = false;

    private commonForAllObjects = false;

    readonly objectAllSemanticList: { key: string; items: MapObjectSemanticContent[] }[] = [];

    /**
     * Экземпляр карты
     * @private
     * @property layer {Layer}
     */
    private readonly layer: Layer;

    get imageCache() {
        return this.mapObject.objectImages;
    }

    getImageFromCache(path: string) {
        const item = this.imageCache.find(item => item.path === path);
        if (item && item.path === path) {
            return item.src;
        }
    }


    /**
     * @constructor MapObjectContent
     * @param mapObject {MapObject} Объект карты
     * @param [classifierSemanticList] {ClassifierTypeSemantic[]} Массив слоев классификатора с семантиками
     * @param [objectSemanticList] {RscSemantic[]} Массив семантик
     */
    constructor(readonly mapObject: MapObject, classifierSemanticList?: ClassifierTypeSemantic[], objectSemanticList?: RscSemantic[]) {
        super(mapObject.vectorLayer, mapObject.type, undefined, mapObject.isValidGisObject );


        const layers = this.vectorLayer.map.tiles.getSelectableLayersArray();
        let result: Layer | undefined;
        for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
            const layer = layers[layerIndex];
            if (layer.idLayer === this.mapId) {
                result = layer;
                break;
            }
        }


        this.layer = result || this.vectorLayer;


        this.updateFrom(mapObject);

        if (classifierSemanticList) {
            this.classifierSemanticList.splice(0, 0, ...classifierSemanticList);
        } else if (this.layer?.classifier) {
            this.layer.classifier.getClassifierSemantics().then(semanticList => {
                this.classifierSemanticList.splice(0, 0, ...semanticList);
                this.fillObjectAllSemanticList();
            });
        }

        if (objectSemanticList) {
            this.semanticOfObjectSemanticsList.splice(0, 0, ...objectSemanticList);
        } else if (this.layer?.classifier) {

            if (this.key !== undefined) {
                //загрузка семантик объекта классификатора
                this.layer.classifier.getObjectSemantics(this.key).then(async objectSemanticList => {
                    if (objectSemanticList) {
                        const list = objectSemanticList.filter(item => this.semanticOfObjectSemanticsList.find(existItem => existItem.shortname === item.shortname) === undefined);
                        this.semanticOfObjectSemanticsList.splice(0, 0, ...list);
                        this.fillObjectAllSemanticList();
                    }
                });
            } else {
                const semantics = mapObject.getSemantics();
                let list: RscSemantic[] = [];
                for (let i = 0; i < semantics.length; i++) {
                    const semantic = semantics[i];
                    list.push({
                        code: semantic.code ? semantic.code + '' : '',
                        decimal: '',
                        defaultvalue: '',
                        enable: '1',
                        maximum: '',
                        minimum: '',
                        name: semantic.name,
                        reply: '',
                        service: '',
                        shortname: semantic.key,
                        size: '',
                        textvalue: semantic.value,
                        type: semantic.type ? semantic.type + '' : '',
                        unit: '',
                        value: semantic.value
                    });
                }
                this.semanticOfObjectSemanticsList.splice(0, 0, ...list);

                this.fillObjectAllSemanticList();
            }
        }

        if (objectSemanticList || classifierSemanticList) {
            this.fillObjectAllSemanticList();
        }

    }

    setShowAllSemanticsFlag(value: boolean): void {
        this.showAllSemantics = value;

        if (!this.showAllSemantics && this.commonForAllObjects) {
            this.setCommonForAllObjectsFlag(false);
        } else {
            this.fillObjectAllSemanticList();
        }
    }

    setCommonForAllObjectsFlag(value: boolean): void {
        this.commonForAllObjects = value;

        this.fillObjectAllSemanticList();
    }

    fillObjectAllSemanticList() {
        this.objectAllSemanticList.splice(0);

        this.objectAllSemantics.forEach(item => this.objectAllSemanticList.push(item));
    }

    /**
     * Название карты
     * @property layerName {string}
     */
    get layerName() {
        return this.layer ? this.layer.alias : this.mapObject.layerName;
    }

    /**
     * Параметры объекта карты
     * @property objectMainProps {array}
     */
    get objectMainProps() {
        let mainProps: { name: string; value: string; show: boolean } [] = [];
        let prop: { name: string; value: string; show: boolean } = {
            name: 'phrases.Object number',
            value: this.objectNumber + '',
            show: this.showObjectNumber
        };
        mainProps.push(prop);

        if (this.mapObject.type === MapObjectType.Polygon || this.mapObject.type === MapObjectType.MultiPolygon) {
            prop = {
                name: 'phrases.Area',
                value: this.objectAreaString,
                show: this.showObjectArea
            };
            mainProps.push(prop);

            prop = {
                name: 'phrases.Perimeter',
                value: this.objectPerimeterString,
                show: this.showObjectPerimeter
            };
            mainProps.push(prop);
        }

        if (this.mapObject.type === MapObjectType.LineString || this.mapObject.type === MapObjectType.MultiLineString) {
            prop = {
                name: 'phrases.Length',
                value: this.objectPerimeterString,
                show: this.showObjectPerimeter
            };
            mainProps.push(prop);
        }

        return mainProps;
    }

    get objectAreaString(): string {

        if (this.objectArea === undefined) {
            return '-';
        }

        const sel_unit = this.vectorLayer.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA); // установленные единицы измерения площади
        let area_num = Utils.squareMetersToUnits(this.objectArea, sel_unit);
        let unitText = ' ' + this.vectorLayer.map.translate(UnitText[sel_unit]);
        switch (sel_unit) {
            case Unit.SquareKilometers:
                if (area_num.value < 0.001) {
                    area_num.value *= 1000000;
                    unitText = ' ' + this.vectorLayer.map.translate(UnitText[Unit.SquareMeters]);
                }
                break;
        }
        return Number(Number(area_num.value).toFixed(3)).toLocaleString() + ' ' + unitText;
    }

    get objectPerimeterString(): string {

        const units: Unit = this.vectorLayer.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER);
        let perimeter = Utils.linearMetersToUnits(this.objectPerimeter || 0, units);
        let d = Number(perimeter.value.toFixed(3)).toString();
        let unitsText = this.vectorLayer.map.translate(UnitText[units]);
        switch (units) {
            case Unit.Foots:
                d = Number(perimeter.value.toFixed(3)).toString();
                break;
            case Unit.NauticalMiles:
                d = Number(perimeter.value.toFixed(3)).toString();
                break;
            case Unit.Meters:
                d = Number(perimeter.value.toFixed(2)).toString();
                break;
            case Unit.Kilometers:
                if (perimeter.value >= 0.001) {
                    d = Number(perimeter.value.toFixed(3)).toString();
                } else {
                    d = Number((perimeter.value * 1000).toFixed(3)).toString();
                    unitsText = this.vectorLayer.map.translate(UnitText[Unit.Meters]);
                }
                break;
        }

        return d + ' ' + unitsText;
    }

    /**
     * Массив семантик объекта карты
     * @method objectSemantics {array}
     */
    get objectSemantics(): { key: string; items: MapObjectSemanticContent[] }[] {
        const result: { key: string; items: MapObjectSemanticContent[] }[] = [];
        const semanticKeys = this.getSemanticUniqKeys();
        const classifierSemanticList = this.classifierSemanticList;
        for (let semanticKey of semanticKeys) {

            if (!this.checkSemanticFilter(semanticKey)) {
                continue;
            }

            const semantics = this.getRepeatableSemantics(semanticKey);
            const layerSemantic = this.semanticOfObjectSemanticsList.find((semanticItem: { shortname: string }) => {
                return semanticItem.shortname === semanticKey;
            });

            const items: MapObjectSemanticContent[] = [];

            semantics.forEach(semantic => {

                if (!this.isImageSemantic(semantic.key, semantic.value)) {
                    items.push(new MapObjectSemanticContent(semantic, layerSemantic, classifierSemanticList));
                }

            });

            if (items.length > 0) {
                result.push({key: semanticKey, items});
            }
        }

        return result;
    }


    get documentSemantics(): { key: string; items: MapObjectSemanticContent[] }[] {
        const result: { key: string; items: MapObjectSemanticContent[] }[] = [];
        const semanticKeys = this.getSemanticUniqKeys();
        const classifierSemanticList = this.classifierSemanticList;


        for (let semanticKey of semanticKeys) {

            if (!this.checkSemanticFilter(semanticKey)) {
                continue;
            }

            const semantics = this.getRepeatableSemantics(semanticKey);
            const layerSemantic = this.semanticOfObjectSemanticsList.find((semanticItem: { shortname: string }) => {
                return semanticItem.shortname === semanticKey;
            });

            const items: MapObjectSemanticContent[] = [];

            semantics.forEach(semantic => {

                const item = new MapObjectSemanticContent(semantic, layerSemantic, classifierSemanticList);

                if (item.isDownloadFile || item.isImageSemantic || item.isVideoSemantic || item.isBimSemantic || item.isPdfSemantic) {
                    items.push(item);
                }

            });

            if (items.length > 0) {
                result.push({key: semanticKey, items});
            }
        }

        return result;
    }

    checkIfEditable(semanticKey: string) {
        let isEditable = true;
        const editingData = this.vectorLayer.editingData;
        if (editingData) {
            isEditable = false;
            for (let i = 0; i < editingData.length; i++) {
                const editingDataItem = editingData[i];
                const code = +editingDataItem.code;
                const semantics = editingDataItem.semantics;
                if (code === this.code) {
                    if (Array.isArray(semantics) && semantics.length > 0) {
                        isEditable = semantics.includes(semanticKey);
                    } else {
                        isEditable = true;
                    }
                }
            }
        }
        return isEditable;
    }

    /**
     * Массив всех семантик объекта карты
     * @method objectAllSemantics {array}
     */
    get objectAllSemantics(): { key: string; items: MapObjectSemanticContent[] }[] {
        const result: { key: string; items: MapObjectSemanticContent[] }[] = [];

        const objectSemanticList = this.semanticOfObjectSemanticsList;
        const classifierSemanticList = this.classifierSemanticList;

        objectSemanticList.forEach(objectSemantic => {
            const semantics = this.getRepeatableSemantics(objectSemantic.shortname);

            const items: MapObjectSemanticContent[] = [];

            let isReplyFlag = false;
            if (semantics.length > 0) {
                semantics.forEach(currentSemantic => {
                    const semantic = new MapObjectSemanticContent(currentSemantic, objectSemantic, classifierSemanticList);
                    if (!this.checkSemanticFilter(semantic.key) || !this.checkIfEditable(semantic.key)) {
                        return;
                    }
                    const value = semantic.value;
                    if (value == undefined || value === '') {
                        if (!this.showAllSemantics || (!this.commonForAllObjects && semantic.isService)) {
                            return;
                        }
                    } else if (semantic.isReply && (this.showAllSemantics && (!semantic.isService || this.commonForAllObjects))) {
                        isReplyFlag = true;
                    }
                    items.push(semantic);
                });
            } else {
                const semantic = new MapObjectSemanticContent(undefined, objectSemantic, classifierSemanticList);
                if (this.showAllSemantics && (!semantic.isService || this.commonForAllObjects)) {
                    items.push(semantic);
                }
            }

            if (items.length > 0) {
                if (isReplyFlag) {
                    const lastItem = items[items.length - 1];
                    items.push(new MapObjectSemanticContent({
                        key: lastItem.key,
                        name: lastItem.name,
                        value: ''
                    }, objectSemantic, classifierSemanticList));
                }
                result.push({key: objectSemantic.shortname, items});
            }

        });

        return result;
    }


    /**
     * Проверка доступности семантики для вывода пользователю
     * @method checkSemanticFilter
     * @param key {string} ключ семантики
     * @return {boolean} Флаг доступности семантики для вывода пользователю
     */
    private checkSemanticFilter(key: string): boolean {
        const semanticFilter = this.layer.options.semanticfilter;
        return !semanticFilter || semanticFilter.length === 0 || semanticFilter.indexOf(key) !== -1;
    }

    /**
     * Изменить значение семантики слоя
     * @method setSemanticValue
     * @param semantic {MapObjectSemanticContent} описание семантики
     * @param index {number} порядковый номер повторяемой семантики
     * @param [semanticValue] {String} значение семантики
     */
    setSemanticValue(semantic: MapObjectSemanticContent, index: number, semanticValue: string = '') {
        if (semanticValue === null) {
            this.removeRepeatableSemantic(semantic.key, index);
            return;
        }
        const semanticList = this.getRepeatableSemantics(semantic.key);
        if (semanticList.length >= index + 1) {
            this.updateRepeatableSemantic(semantic.key, index, semanticValue);
        } else {
            this.addRepeatableSemantic({key: semantic.key, value: semanticValue, name: semantic.name});
        }
        // иначе даты не обновляются(
        this.fillObjectAllSemanticList();
    }

    validateSemantics() {
        const semantics = this.objectAllSemantics;
        for (let i = 0; i < semantics.length; i++) {
            if (semantics[i].items.findIndex(item => {
                if (item.isMandatory) {
                    const semantic = this.getSemantic(item.key);
                    if (!semantic || semantic.value === '') {
                        return true;
                    }
                }
            }) !== -1) {
                return false;
            }
        }
        return true;
    }

    /**
     * Добавить/обновить объект в слое
     * @method commit
     */
    async commit() {
        this.mapObject.updateFrom(this);
        if (this.mapObject.getSemantics().find(semantic => semantic.view === '1')) {
            this.mapObject.resetKey();
        }
        const response = await this.mapObject.commit();
        if (response) {
            let transactionNumber = '';
            const outParams = response.outparams;
            const index = outParams.findIndex((item) => item.name === 'TransactionNumber');
            if (index > -1) {
                transactionNumber = outParams[index].value;
            }

            const commitList = [{xId: this.vectorLayer.xId, transactionNumber}];

            this.vectorLayer.map.getTaskManager().addTransaction({
                id: Utils.generateGUID(),
                commitList,
                timeStamp: Date.now(),
                actionId: CREATE_OBJECT_ACTION
            });
        }

        const wmsLayer = this.vectorLayer.map.tiles.getLayerByxId(this.vectorLayer.xId);
        if (wmsLayer) {
            if (!wmsLayer.visible) {
                this.vectorLayer.map.setLayerVisibility(wmsLayer, true);
            }
        }

        // Запрашиваем с сервиса измененный объект
        await this.mapObject.reload();

        const objectDescription = `{ id: ${this.mapObject.gmlId}, type: ${this.mapObject.type}, pointCount: ${this.mapObject.getPointCount()}}`;
        const description = `${MapObjectContent.name} -> commit() -> ${objectDescription}`;

        this.vectorLayer.map.writeDebugLog(description);

        return response;
    }

    async delete() {
        const response = await this.mapObject.delete();
        if (response) {
            let transactionNumber = '';
            const outParams = response.outparams;
            const index = outParams.findIndex((item) => item.name === 'TransactionNumber');
            if (index > -1) {
                transactionNumber = outParams[index].value;
            }

            const commitList = [{xId: this.vectorLayer.xId, transactionNumber}];

            this.vectorLayer.map.getTaskManager().addTransaction({
                id: Utils.generateGUID(),
                commitList,
                timeStamp: Date.now(),
                actionId: DELETE_OBJECT_ACTION
            });
        }

        return response;
    }

    /**
     *  Получить индексы для отображения периметра, площади и номера объекта
     *  @method objectInfoShowFilters
     */
    get objectInfoShowFilters() {
        if (this.vectorLayer.map.options.objectinfo)
            return this.vectorLayer.map.options.objectinfo;
        return {area: true, number: true, semantic: true};
    }

    /**
     * Показать информацию о площади объекта
     * @method showObjectArea
     */
    get showObjectArea() {
        return this.objectInfoShowFilters.area;
    }

    /**
     * Показать информацию о длине объекта
     * @method showObjectPerimeter
     */
    get showObjectPerimeter() {
        return this.objectInfoShowFilters.area;
    }

    /**
     * Показать информацию о номере объекта
     * @method showObjectNumber
     */
    get showObjectNumber() {
        if (this.objectNumber === 0)
            return false;
        return this.objectInfoShowFilters.number;
    }

    /**
     * Показать информацию о семантике объекта
     * @method showObjectSemantic
     */
    get showObjectSemantic() {
        return this.objectInfoShowFilters.semantic;
    }

    /**
     * Показать информацию о площади, длине и номере объекта
     * @method showObjectMainProps
     */
    get showObjectMainProps() {
        return this.showObjectArea || this.showObjectPerimeter || this.showObjectNumber;
    }

    /**
     * Загрузить файл документа с ГИС Сервера из семантики
     * @method getFileDownload
     * @param semanticValue {String} - Значения семантики
     */
    getFileDownload(semanticValue: string) {
        const layerID = this.mapId;
        let semanticFileName = this.getFileNameFromSemantic(semanticValue);
        semanticFileName = semanticFileName.replace(/,/g, '_');

        if (layerID && this.layer) {
            const serviceUrl = this.layer.server;
            const getFileDocumentParam = {
                LAYER: layerID,
                ALIAS: semanticValue
            };
            if (serviceUrl) {
                const httpParams = {
                    url: serviceUrl
                };
                const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
                const promise = service.getFileFromSemantic(getFileDocumentParam);
                promise.then((result) => {
                    if (result.data) {
                        if (result.data.restmethod) {
                            if (result.data.restmethod.outparams) {
                                if (Array.isArray(result.data.restmethod.outparams) && result.data.restmethod.outparams.length > 0) {
                                    // Получаем нулевой элемент из массива
                                    const filePath = result.data.restmethod.outparams[0].value;
                                    let lastPosition = semanticFileName.lastIndexOf('/') + 1;
                                    let extensionIndex = semanticFileName.lastIndexOf('.');

                                    if (extensionIndex === -1) {
                                        extensionIndex = semanticFileName.length;
                                    }

                                    semanticFileName = semanticFileName.substring(lastPosition, extensionIndex);

                                    const downloadUrl = serviceUrl +
                                        '?SERVICE=WFS&Method=GetFile&FilePath=' +
                                        encodeURIComponent(filePath) + '&RENAME=' +
                                        encodeURIComponent(semanticFileName);
                                    // Скачать файл
                                    try {
                                        BrowserService.openLink(downloadUrl, '_blank');
                                    } catch (error) {
                                        this.vectorLayer.map.writeProtocolMessage({
                                            text: error as string,
                                            type: LogEventType.Error,
                                            display: false
                                        });
                                    }
                                }
                            }
                        }
                    }
                }).catch((e) => {
                    this.vectorLayer.map.writeProtocolMessage({text: e, type: LogEventType.Error});
                });
            }
        }
    }

    /**
     * Запросить имя файла из алиаса документа ГИС Сервера
     * @method getFileNameFromSemantic
     * @param semanticValue {String} значение семантики - алиас документа ГИС Сервера
     */
    getFileNameFromSemantic(semanticValue: string) {
        let result = '';
        if (!semanticValue)
            return result;

        const semanticValueToLower = semanticValue.toLowerCase();

        if (semanticValueToLower.indexOf('doc#') === -1) {
            result = semanticValue;
        } else {
            const pos = semanticValue.lastIndexOf('#') + 1;
            result = semanticValue.substring(pos);
        }

        return result;
    }

    /**
     * Преобразовать в Html
     * @method toHtmlTable
     * @param shortInfo {boolean},`true`- краткая информация об объекте
     */
    async toHtmlTable(shortInfo?: boolean): Promise<HTMLDivElement> {
        const container = document.createElement('div');
        container.setAttribute('xid', this.mapObject.id);
        container.classList.add('pa-4');
        container.classList.add('mt-15');

        const table = document.createElement('table');
        container.appendChild(table);
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        tr.appendChild(td);
        const imageDiv = document.createElement('div');
        imageDiv.style.width = '64px';
        imageDiv.style.height = '64px';
        //const imgSrc = await this.getImageSrc(); !
        const imgSrc = this.mapObject.mapObjectIconUrl;
        if (imgSrc.length > 0) {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.width = 50;
            img.height = 50;
            imageDiv.appendChild(img);
        }
        td.appendChild(imageDiv);
        td = document.createElement('td');
        tr.appendChild(td);
        const objname = this.objectNameBySemantic || '';
        const layername = this.layerName || '';
        let innerHtml: string[] = [];
        innerHtml.push('<span>');
        innerHtml.push(objname);
        innerHtml.push('</span><br>');
        innerHtml.push('<span>');
        innerHtml.push(layername);
        innerHtml.push('</span>');
        if (this.showObjectNumber && shortInfo) {
            const textNumber = this.vectorLayer.map.translate('Object number');
            const valueNumber = '' + this.objectNumber || '';
            innerHtml.push('<br><span>');
            innerHtml.push(textNumber + ' : ');
            innerHtml.push('</span>');
            innerHtml.push('<span>');
            innerHtml.push(valueNumber);
            innerHtml.push('</span>');
        }
        td.innerHTML = innerHtml.join('');
        table.appendChild(tr);

        if (shortInfo) {
            return container;
        }

        if (this.showObjectNumber) {
            const valueNumber = '' + this.objectNumber || '';
            tr = document.createElement('tr');
            td = document.createElement('td');
            td.textContent = this.vectorLayer.map.translate('Object number') + ' ';
            tr.appendChild(td);
            td = document.createElement('td');
            td.textContent = valueNumber;
            tr.appendChild(td);
            table.appendChild(tr);
        }

        if (this.showObjectArea) {
            tr = document.createElement('tr');
            td = document.createElement('td');
            tr.appendChild(td);
            td.textContent = this.vectorLayer.map.translate('Area');
            td = document.createElement('td');
            tr.appendChild(td);
            td.textContent = this.objectAreaString;
            table.appendChild(tr);
        }

        if (this.showObjectPerimeter) {
            tr = document.createElement('tr');
            td = document.createElement('td');
            tr.appendChild(td);
            td.textContent = this.vectorLayer.map.translate('Perimeter');
            td = document.createElement('td');
            tr.appendChild(td);
            td.textContent = this.objectPerimeterString;
            table.appendChild(tr);
        }

        if (this.showObjectSemantic) {
            const semantics = this.objectSemantics;

            for (const semanticItem of semantics) {
                for (const semantic of semanticItem.items) {
                    tr = document.createElement('tr');
                    td = document.createElement('td');
                    td.textContent = semantic.name;
                    tr.appendChild(td);
                    td = document.createElement('td');
                    td.textContent = semantic.value || null;
                    tr.appendChild(td);
                    table.appendChild(tr);
                }
            }
        }

        return container;
    }

    /**
     * Преобразовать в текстовый формат
     * @method toTextString
     * @param shortInfo {boolean},`true`- краткая информация об объекте
     */
    toTextString(shortInfo?: boolean): string {
        const lines: string[] = ['\r\n'];

        const objname = this.objectNameBySemantic || '';
        const layername = this.layerName || '';
        lines.push(...[objname, layername]);

        if (this.showObjectNumber) {
            const textNumber = this.vectorLayer.map.translate('Object number') + ': ';
            const valueNumber = '' + this.objectNumber || '';
            lines.push(textNumber + valueNumber);
        }

        if (!shortInfo) {
            if (this.showObjectArea) {
                const textArea = this.vectorLayer.map.translate('Area') + ': ' + this.objectAreaString;
                lines.push(textArea);
            }

            if (this.showObjectPerimeter) {
                const textPerimeter = this.vectorLayer.map.translate('Perimeter') + ': ' + this.objectPerimeterString;
                lines.push(textPerimeter);
            }

            if (this.showObjectSemantic) {
                const semantics = this.objectSemantics;
                for (const semanticItem of semantics) {
                    for (const semantic of semanticItem.items) {
                        if (semantic.value) {
                            const semanticText = semantic.name + ': ' + semantic.value;
                            lines.push(semanticText);
                        }
                    }
                }
            }
        }

        return lines.join('\r\n');
    }

}
