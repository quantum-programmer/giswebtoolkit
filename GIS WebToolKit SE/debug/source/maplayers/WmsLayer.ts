/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        WMS-слой карты                            *
 *                                                                  *
 *******************************************************************/

import {GwtkMap, GwtkMapLegendItemReduced, LAYERTYPENAME, SldBuildObject} from '~/types/Types';
import {GetMapImageParams} from '~/services/RequestServices/RestService/Types';
import {GwtkLayerDescription} from '~/types/Options';
import Layer from '~/maplayers/Layer';
import {WmsFilter} from '~/maplayers/WmsFilter';
import LayerOptions, {LayerTextFilter, PermanentLayerFilter} from '~/types/LayerOptions';
import {AUTH_HEADER, LogEventType, SimpleJson} from '~/types/CommonTypes';
import {Point} from '~/geometry/Point';
import {Bounds} from '~/geometry/Bounds';
import Utils from '~/services/Utils';
import GeoPoint from '~/geo/GeoPoint';
import {PixelBounds} from '~/geometry/PixelBounds';
import {BrowserService} from '~/services/BrowserService';
import {PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL} from '~/utils/WorkspaceManager';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import {OUTTYPE} from '~/services/RequestServices/common/enumerables';


const DELTA_BOUNDS = 2;

type RequestDescriptor = {
    id: string;               // id запроса
    xhr: XMLHttpRequest;      // Http запрос
    multiple: number;         // составной
    x?: number;
    y?: number;
    w?: number;
    img?: HTMLImageElement;
}

export type GetImageRequestParams = {
    url: string;
    data?: GetImageRestMethodJson;
    xdata?: string;
    w?: number;
    x?: number;
    y?: number;
}

export type GetImageRestMethodJson = {
    restmethod: GetImageRestParams;
}

export type GetImageRestParams = {
    name: 'GETIMAGE';
    layerlist: LayerRequestParams[];
    common: LayerParamsItem[];
}

export type LayerRequestParams = {
    id: string;
    params?: LayerParamsItem[];
}

export type LayerParamsItem = {
    name: string;
    value: string | SimpleJson<any>;
    type: string;
}

/**
 * Класс WmsLayer - загрузка изображений, отображение и управление WMS слоем.
 * Основным параметром слоя является адрес WMS сервера(options.url).
 * Слои создаются динамически, хранятся в коллекции layers класса карты Map.
 * Конструктор WmsLayer принимает два параметра – объект Map и объект параметров - layerdescription.
 * После создания объекта WmsLayer необходимо добавить его в коллекцию слоев карты методом onAdd().
 *
 * @class WmsLayer
 * @extends Layer
 */
export default class WmsLayer extends Layer {

    /**
     * Cостояние данных на сервере
     * @property dataState {number}
     */
    private dataState = '';

    // Параметры url
    private urlParam: { server?: string; param?: SimpleJson } = {};

    // габариты слоя
    private bounds?: Bounds;

    private readonly revoked: string[] = [];

    // фильтр объектов слоя
    private filter?: WmsFilter;

    // активный запрос
    private readonly activeRequest: RequestDescriptor[] = [];

    // HTMLCanvasElement
    private readonly canvas;

    /**
     * Пустое изображение
     * @readonly
     * @property emptyImage {string}
     */
    readonly emptyImage: string = GWTK.imgEmpty;

    /**
     * Габариты слоя не в пределах (-180, 180), признак
     * @private
     * @property bounds360  {boolean}
     */
    private bounds360 = false;

    parent?: HTMLDivElement;

    private readonly image = document.createElement('img');

    onLayerRender?: (id: string) => void;

    /**
     * @constructor WmsLayer
     * @param map {GwtkMap} экземпляр карты
     * @param layerdescription {GwtkLayerDescription} параметры слоя
     */
    constructor(map: GwtkMap, layerdescription: GwtkLayerDescription) {

        super(map, layerdescription);

        // if ( this.isError ) {
        //     const text = this.map.translate( 'Map layer creation error' ) + '. ' +
        //         this.map.translate( 'Not defined a required layer parameter id or url' ) + '.';
        //     this.map.writeProtocolMessage( { text, type: LogEventType.Error } );
        // }

        this.canvas = this.map._getCanvas();

        this.parent = this.map.getPanels().wms;

        // параметры слоя
        this.setOptions();

        // установить габариты слоя
        this.setBounds();

        if (this.wms) {

            this.setUrlParam();

            this.disableDeprecatedURLParam();

            this.createContainer();

            this.map.layers.push(this);

            this.map.tiles.setAuthTypeServer(this);

            this.filter = new WmsFilter(this);
        }

        this.triggerLayerListChanged = Utils.debounce(this.triggerLayerListChanged.bind(this), 50);

    }

    /**
     * Установить параметры слоя
     * @method setOptions
     */
    protected setOptions() {
        if (this.isError || !this.wms) {
            return;
        }

        if (this.options.minzoomview < LayerOptions.defaultZoomView.minzoom) {
            this.options.minzoomview = LayerOptions.defaultZoomView.minzoom;
        }
        if (this.options.maxzoomview > LayerOptions.defaultZoomView.maxzoom) {
            this.options.maxzoomview = LayerOptions.defaultZoomView.maxzoom;
        }
        this.setBounds360();

        this.setOpacity(this.initOpacity());

    }

    /**
     * Признак WMS слоя
     * @property wms {boolean}
     */
    get wms() {
        return super.getType() === LAYERTYPENAME.wms;
    }

    /**
     * Параметры url
     * @property urlParams {object}, json
     */
    get urlParams() {
        return this.urlParam;
    }

    /**
     * Признак imageActive
     * @property imageActive {boolean}
     */
    get imageActive() {
        return this.image.src !== '';
    }

    /**
     * Признак габаритов карты более 180 град
     * @property isBounds360 {boolean}
     */
    get isBounds360() {
        return this.bounds360;
    }

    /**
     * Элемент описания слоя
     * @property serverItem {object}
     */
    get serverItem() {
        return {'layer': this, 'id': this.idLayer, 'xId': this.xId};
    }

    /**
     * Элемент описания сервера слоя
     * @property serverItem {object}
     */
    get serverDescriptor() {
        return {'server': this.serviceUrl, 'scene': this.xId, list: [this.serverItem]};
    }

    /**
     * Признак 'простой', не группируется
     * @property isSimple {boolean}
     */
    get isSimple() {
        return (!this.useXmlRpc || this.isBounds360);
    }

    async getLayerStatus() {
        const httpParams = RequestServices.createHttpParams(this.map, {url: this.serviceUrl});
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
        const response = await service.getLayerState({
            LAYER: this.idLayer,
            OUTTYPE: OUTTYPE.JSON
        });

        if (response.data) {
            return response.data.restmethod.outparams[0]?.value;
        } else {
            throw Error('Cannot get layer status');
        }
    }

    /**
     * Признак наличия легенды
     * @property isLegend {boolean}
     */
    isLegend() {
        return super.hasLegend();
    }

    /**
     * Признак видимости с учетом масштабов
     * @property isVisible {boolean}
     */
    get isVisible() {
        return this.getVisibility() && this.checkViewZoom(this.map.getZoom());
    }

    /**
     * Признак готовности рисунка
     * @property isImageReady {boolean}
     */
    get isImageReady() {
        if (this.image.src !== '') {
            return this.image.classList.contains('img-loaded');
        }
        return false;
    }

    /**
     * Получить имя типа слоя
     * @method getType
     * @public
     * @returns {string} 'wms' или '' при ошибке
     */
    getType() {
        return this.wms ? LAYERTYPENAME.wms : LAYERTYPENAME.undefined;
    }

    /**
     * Добавление слоя
     * @method onAdd
     */
    onAdd() {

        if (this.options.hidden) {
            super.hide();
        }

        if (this.layerContainer) {         // fix ???
            this.map.trigger({type: 'layerlistchanged', maplayer: {'id': this.xId, 'act': 'add'}, target: 'map'});
        }

        // Состояние данных на сервере
        this.setLayerDataState('');

        // Инициализировать классификатор
        this.classifier = this.map.classifiers.createByLayer(this);

        return true;
    }

    /**
     * Удаление слоя
     * @method onRemove
     */
    onRemove() {
        if (!this.layerContainer) {
            return;
        }
        const temp = document.getElementById(this.layerContainer.id + '_temp');
        if (temp) {
            temp.remove();
        }
        this.layerContainer.remove();
        this.layerContainer = undefined;

        // Удалить классификатор
        if (this.map.classifiers) {
            this.map.classifiers.removeByLayer(this);
        }

        // Очистить активный запрос
        this.cancelRequest();

        // Удалить фильтр
        if (this.filter) {
            this.filter.destroy();
            this.filter = undefined;
        }

        this.triggerLayerListChanged();
    }

    private triggerLayerListChanged() {
        this.map.trigger({type: 'layerlistchanged', maplayer: {'id': this.xId, 'act': 'remove'}, target: 'map'});
    }

    /**
     * Фильтр слоя
     * @method getFilter
     * @returns { LayerParamsItem[] | undefined }
     */
    getFilter(): LayerParamsItem[] | undefined {
        if (this.filter) {
            return this.filter.toJson();
        }
        return undefined;
    }

    /**
     * Фильтр слоя
     * @method setFilter
     * @returns { LayerParamsItem[] | undefined }
     */
    setFilter(): LayerParamsItem[] | undefined {
        if (this.filter) {
            return this.filter.toJson();
        }
        return undefined;
    }


    /**
     * Проверить видимость по уровеню масштабирования
     * @method checkViewZoom
     * @param zoom {number} уровень масштабирования
     * @returns {boolean} `true` - слой видим на уровне zoom
     */
    checkViewZoom(zoom: number) {
        if (this.maxZoomView == this.minZoomView) {
            return zoom == this.maxZoomView;
        }
        return super.checkViewZoom(zoom);
    }

    /**
     * Состояние данных на сервере
     * @method getLayerDataState
     */
    getLayerDataState() {
        return this.dataState;
    }

    /**
     * Сохранить текущее состояние данных на сервере
     * @method getLayerDataState
     */
    setLayerDataState(statekey: string) {
        this.dataState = statekey;
    }

    /**
     * Проверить изменение состояния данных на сервере
     * @method getLayerDataState
     * @param statekey {string} текущий код состояния на сервере
     * @return {boolean} `false` - изменилось
     */
    checkLayerDataState(statekey: string) {
        return (this.dataState === statekey);
    }

    /**
     * Установить фильтр объектов для рисунка по gmlid
     * @method setGmlList
     * @param gmllist {String} список идентификаторов объектов через запятую
     * (при установленном фильтре объектов в рисунке отображаются только эти объекты)
     */
    setGmlList(gmllist?: string) {
        if (!gmllist) {
            this.clearGmlList();
            return '';
        }
        if (this.filter) {
            this.filter.setIdListFilter(gmllist);
        }
        return gmllist;
    }

    /**
     * Сбросить фильтр объектов для рисунка
     * @method setGmlList
     */
    clearGmlList() {
        if (this.filter) {
            this.filter.clearIdListFilter();
        }
    }

    /**
     * Доступность по фильтру
     * @property enabledByFilter
     * @return {boolean}
     */
    get enabledByFilter() {
        if (this.filter) {
            return !this.filter.disabledAllFilters;
        }
        return true;
    }

    /**
     * Проверить на запрос изображения частями
     * @method isMultiPicture
     * @returns {boolean} `true`- выводить рисунок частями
     * @private
     */
    private isMultiPicture(pixelbounds: PixelBounds) {
        if (!this.map.Translate.IsGeoSupported ||
            this.map.tileMatrix.Ogc.NormalFrame.min.y > -180 ||
            this.map.tileMatrix.Ogc.NormalFrame.max.y < 180) {
            return false;
        }

        // проверить по габаритам
        const matrix = this.map.tileMatrix.getTileMatrixSize(this.map.getZoom());
        if (this.map.getWindowSize()[0] >= matrix.x) {  // размер окна больше ширины матрицы
            return true;
        }

        return pixelbounds.min.x < 0 || pixelbounds.max.x > matrix.x;
    }

    /**
     * Подготовка параметров запроса рисунка частями
     * @method prepareMultiBboxParameter
     * @protected
     * @param pixbounds {PixelBounds} область окна карты
     * @returns { GetMapImageParams[] }
     */
    private prepareMultiBboxParameter(pixbounds: PixelBounds): GetMapImageParams[] | undefined {
        if (!this.isMultiPicture(pixbounds)) {
            return;
        }
        const param = this.prepareGetMapParameters();
        const param2 = this.prepareGetMapParameters();
        param2.WIDTH = '0';
        const winX = +param.WIDTH;                                    // ширина окна, pix
        let w1 = winX,                                                // ширина рисунка, pix
            w2 = 0;
        const zoom = this.map.getZoom();
        const matrix = this.map.Translate.getTileMatix();
        const pixelSpan = matrix.getPixelSpan(zoom);
        const matrixSize = matrix.getTileMatrixSize(zoom);          // global размер матрицы
        const matrixFrame = matrix.Ogc.NormalFrame;                   // габариты матрицы
        const windowBounds = this.map.getWindowBounds();              // координаты окна карты
        const windowPixelBounds = pixbounds;                          // габариты окна карты, pix матрицы

        const pixBox1 = windowPixelBounds.clone();
        const pixBox2 = windowPixelBounds.clone();

        const frame1 = matrixFrame.clone();
        frame1.min.x = windowBounds.min.x;
        frame1.max.x = windowBounds.max.x;
        const frame2 = frame1.clone();

        let minLongitude = -180;
        let maxLongitude = 180;
        if (this.bounds360 && this.bounds) {
            minLongitude = this.options.bbox[3] - 360;
            maxLongitude = this.options.bbox[3];             // 200 deg!
        }

        const minPoint = new GeoPoint(minLongitude, 30, 0, this.map.ProjectionId).toMapPoint();
        const maxPoint = new GeoPoint(maxLongitude, 30, 0, this.map.ProjectionId).toMapPoint();

        let xMin = 0;
        if (minPoint) {
            const xyPixel = minPoint.toPixelPoint(zoom);
            if (xyPixel) {
                xMin = xyPixel.x;
            }
        }

        const xMax = matrixSize.x;
        const matrixFrameY = matrixFrame.max.y - matrixFrame.min.y;

        if (winX < xMax) {                                       // ширина окна меньше ширины матрицы
            if (windowPixelBounds.min.x < 0) {
                pixBox1.min.x = pixBox1.min.x + xMax;
                pixBox1.max.x = xMax;
                w1 = pixBox1.getSize().x;
                pixBox2.min.x = xMin;
                w2 = pixBox2.getSize().x;
                frame2.max.y = windowBounds.max.y;
                if (this.bounds360 && maxPoint && minPoint) {
                    frame1.min.y = windowPixelBounds.min.x * pixelSpan + maxPoint.y;
                    frame1.max.y = maxPoint.y;
                    frame2.min.y = minPoint.y;

                } else {
                    frame1.min.y = windowPixelBounds.min.x * pixelSpan + matrixFrame.max.y;
                    frame1.max.y = matrixFrame.max.y;
                    frame2.min.y = matrixFrame.min.y;
                }
            }
            if (windowPixelBounds.max.x > xMax) {
                pixBox1.max.x = xMax;
                w1 = pixBox1.getSize().x;
                pixBox2.min.x = xMin;
                pixBox2.max.x = pixBox2.max.x - xMax;
                w2 = pixBox2.getSize().x;

                frame1.min.y = windowBounds.min.y;

                if (this.bounds360 && maxPoint && minPoint) {
                    frame1.max.y = maxPoint.y;
                    frame2.min.y = minPoint.y;
                    frame2.max.y = windowBounds.max.y - matrixFrameY;
                } else {
                    frame1.max.y = matrixFrame.max.y;
                    frame2.min.y = matrixFrame.min.y;
                    frame2.max.y = windowBounds.max.y - matrixFrameY;
                }
            }
        } else {
            w1 = xMax;                                             // вся матрица в окне
            w2 = 0;
            pixBox1.min.x = xMin;
            pixBox1.max.x = xMax;

            pixBox2.max.x = pixBox2.max.x - xMax;
        }
        let bbox2;
        if (w2 > 0) {
            bbox2 = this.prepareBboxParameter(frame2);          // два рисунка в окне
        } else {                                                  // один рисунок с нарезкой
            bbox2 = [pixBox2.min.x, pixBox2.min.y, pixBox2.max.x, pixBox2.max.y].join();  // bbox2 - смещение рисунка в окне, pix
        }

        param.WIDTH = '' + w1;
        param.BBOX = this.prepareBboxParameter(frame1);
        param2.WIDTH = '' + w2;
        param2.BBOX = bbox2;
        return [param, param2];
    }

    /**
     * Формировать запрос GetMap
     * @method buildGetMap
     * @returns {string| undefined} строка запроса или undefined
     */
    buildGetMap() {
        if (!this.checkViewState()) {
            return;
        }
        const size = this.map.getSize();
        const sbbox = this.prepareBboxParameter(this.map.getWindowBounds());
        let src = this.serverUrl.slice(0);
        src = src.replace(/%bbox/, sbbox);
        src = src.replace(/%w/, size.x.toFixed(0));
        src = src.replace(/%h/, size.y.toFixed(0));
        src = src.replace(/%crs/, encodeURIComponent(this.map.getCrsString()));

        return src;
    }

    /**
     * Формировать запрос GetImage
     * @method buildGetImage
     * @returns {string | undefined} строка запроса или undefined
     */
    buildGetImage(): Promise<GetImageRequestParams[]> | undefined {
        if (this.checkViewState()) {
            return this.getParamsGetImage();
        }
    }

    async addDynamicLabelToData(data: GetImageRestMethodJson) {
        const dynamicLabelData = this.map.workspaceManager.getValue(PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL);
        const index = dynamicLabelData.findIndex((data) => data.id === this.id);
        if (index !== -1 && dynamicLabelData[index] && dynamicLabelData[index].dynamicLabel && this.map.dynamicLabelList) {
            const dynamicLabelData = await this.map.dynamicLabelList.getDynamicLabelData(this);
            if (dynamicLabelData) {
                data.restmethod.layerlist[0].params = [{
                    name: 'dynamicLabelRecodList',
                    value: dynamicLabelData,
                    type: 'string'
                }];
            }
        }
    }

    /**
     * Получить параметры запроса GetImage
     * @method getParamsGetImage
     * @returns {GetImageRequestParams[]} параметры запроса
     * @private
     */
    protected async getParamsGetImage(): Promise<GetImageRequestParams[]> {

        const zoom = this.map.getZoom();
        const params = this.prepareMultiBboxParameter(this.map.getPixelMapBounds(zoom));

        if (params && params.length === 2) {
            return await this.getMultiParameters(params);
        }

        const url = this.restMethodGetImageUrl;
        const param = this.prepareGetMapParameters();
        param.BBOX = this.prepareBboxParameter(this.map.getWindowBounds());
        const data = this.toJson(param);
        await this.addDynamicLabelToData(data);

        //if ( this.filter ) {                  // проверить!
        //    data.restmethod.layerlist[0].params?.push(...this.filter.toJson());
        //}
        const xdata = JSON.stringify(data);

        return [{url, xdata, data}];

    }

    get restMethodGetImageUrl() {
        return this.urlParam.server + '?SERVICE=WMS&RESTMETHOD=GETIMAGE&FORMAT=' + this.format;
    }


    /**
     * Получить параметры запроса GetImage частями
     * @method getParamsGetImage
     * @returns {GetImageRequestParams[]} массив, параметры запроса
     * @private
     */
    private async getMultiParameters(params: GetMapImageParams[]): Promise<GetImageRequestParams[]> {

        const url = this.restMethodGetImageUrl;
        const result = [];
        for (const parm of params) {
            if (+parm.WIDTH !== 0) {
                const data = this.toJson(parm);
                await this.addDynamicLabelToData(data);
                const xdata = JSON.stringify(data);
                let x = 0;
                const y = 0;
                const w = +parm.WIDTH;
                if (params.indexOf(parm) === 1) {
                    x = +params[0].WIDTH;
                }
                result.push({url, xdata, data, w, x, y});
            } else {
                const [x, y] = parm.BBOX.split(',');
                result[0].w = +params[0].WIDTH;
                result[0].x = +x;
                result[0].y = +y;
            }
        }
        return result;
    }

    /**
     * Получить параметр bbox запроса
     * @param {Bounds} bbox, метры
     * @returns {string} строка значений параметра bbox
     */
    protected prepareBboxParameter(bbox: Bounds) {
        if (this.map.Translate.isGeoSys()) {
            const geobounds = this.map.tileMatrix.getGeoDegreeFrameFromPlaneFrame(bbox);
            if (geobounds) {
                const geobbox = geobounds.toBBox();
                return geobbox.join();
            }
            return '';
        }
        const bboxPlane = [];
        bboxPlane.push(...bbox.min.toOrigin().slice(0, 2));
        bboxPlane.push(...bbox.max.toOrigin().slice(0, 2));
        return bboxPlane.join(',');
    }


    /**
     * Получить параметры запроса изображения слоя
     * @method getLayerImageRequestParams
     * @param force {boolean} формировать принудительно
     * @returns {GetImageRequestParams[] | undefined} параметры
     */
    getLayerImageRequestParams(force?: boolean): Promise<GetImageRequestParams[]> | undefined {
        if (!this.isVisible && !force) {
            return;
        }
        if (this.useXmlRpc && force) {
            return this.getParamsGetImage();
        } else {
            return this.buildGetImage();
        }
    }

    /**
     * Инициализировать параметры запроса
     * @method prepareGetMapParameters
     * @returns {GetMapImageParams} параметры
     * @private
     */
    private prepareGetMapParameters(): GetMapImageParams {
        const size = this.map.getSize();
        return {
            LAYER: this.idLayer,
            CRS: this.map.getCrsString(),
            BBOX: '',
            WIDTH: size.x.toFixed(0),
            HEIGHT: size.y.toFixed(0),
            FORMAT: this.format,
            NOPAINTERROR: '1'
        };
    }

    /**
     * Преобразовать параметры в формат запроса
     * @method toJson

     * @param param {GetMapImageParams} параметры
     * @returns {GetImageRestMethodJson} параметры в форматe запроса
     * @private
     */
    private toJson(param: GetMapImageParams) {

        const layerParams = this.filter ? [...this.filter.toJson()] : [];

        const result: GetImageRestMethodJson = {
            'restmethod': {
                'name': 'GETIMAGE',
                'layerlist': [{'id': param.LAYER, 'params': layerParams}],
                'common': []
            }
        };


        result.restmethod.common.push({'name': 'bbox', 'value': param['BBOX'], 'type': 'string'});
        result.restmethod.common.push({'name': 'width', 'value': param['WIDTH'], 'type': 'string'});
        result.restmethod.common.push({'name': 'height', 'value': param['HEIGHT'], 'type': 'string'});
        result.restmethod.common.push({'name': 'crs', 'value': param['CRS'], 'type': 'string'});
        result.restmethod.common.push({'name': 'format', 'value': param['FORMAT'], 'type': 'string'});
        result.restmethod.common.push({
            'name': 'nopainterror',
            'value': param['NOPAINTERROR'] || '1',
            'type': 'string'
        });

        return result;
    }

    /**
     * Проверить габариты слоя
     * @method checkBounds
     */
    checkBounds(bbox: Bounds) {
        if (!this.bounds || this.bounds360) {
            return true;
        }
        if (bbox.max.y < this.bounds.min.y || bbox.min.y > this.bounds.max.y ||
            bbox.max.x < this.bounds.min.x || bbox.min.x > this.bounds.max.x) {
            return false;
        }
        return true;
    }

    /**
     * Проверить состояние просмотра
     * @method checkViewState
     * @return {boolean} `true` - просмотр слоя возможен
     */
    checkViewState() {
        if ((!this.isVisible || !this.enabledByFilter) ||
            (this.options.token && !this.map.getToken())) {
            return false;
        }
        this.setBounds();
        return this.checkBounds(this.map.getWindowBounds());
    }

    /**
     * Установить css непрозрачность изображения
     * @method setOpacity
     * @public
     * @param value {number/string} css непрозрачности,
     * число в диапазоне [0.0,.. 1.0], 0 - полная непрозрачность
     * @param refresh { boolean } признак обновления изображения
     */
    setOpacity(value: number | string, refresh?: boolean) {
        const opacity = (typeof value == 'string') ? parseFloat(value) : value;
        super.setOpacity(opacity);

        if (this.visible && refresh) {
            this.map.onRefreshMap({'type': 'refreshmap', 'cmd': 'draw', 'id': this.xId});
        }
    }

    private setUrlParam() {

        if (!this.wms || this.serverUrl.length == 0) {
            this.urlParam = {};
        } else {
            const parsedUrl = Utils.parseUrl(this.serverUrl);
            this.urlParam['server'] = parsedUrl.origin + '/' + parsedUrl.pathname;
            this.urlParam['param'] = Utils.getParamsFromURL(this.serverUrl.toLowerCase());
        }
    }

    /**
     * Получить параметр Url
     * @method getUrlParam
     * @param name {string} имя параметра Url
     * @returns {string} значение параметра или пустая строка, если параметра нет
     */
    getUrlParam(name: string): string {
        if (Object.keys(this.urlParam).length === 0) {
            this.setUrlParam();
        }

        if (this.urlParam.param) {
            return this.urlParam.param[name] || '';
        }
        return '';
    }

    /**
     * Удалить из url параметры фильтра, если в нем они есть
     * @method disableDeprecatedURLParam
     * @private
     */
    private disableDeprecatedURLParam() {
        if (this.getUrlParam('keylist').length > 0 ||
            this.getUrlParam('typenames').length > 0 ||
            this.getUrlParam('codelist').length > 0 ||
            this.getUrlParam('textfilter').length > 0) {

            const currentParams = this.urlParam.param;
            if (currentParams) {
                delete currentParams['typenames'];
                delete currentParams['codelist'];
                delete currentParams['textfilter'];
                delete currentParams['keylist'];


                let params = '?';
                for (const key in Object.keys(currentParams)) {
                    params += key + '=' + currentParams[key];
                }
                if (params.length > 1) {
                    this.url = this.urlParam.server + params;
                }
            }

            const text = 'Deprecated parameters removed from URL, layerId=' + this.xId + ' (codelist, or typenames, or keylist)';
            this.map.writeProtocolMessage({text, type: LogEventType.Error});
        }
    }

    /**
     * Установить габариты слоя
     * @method setBounds
     * @private
     */
    private setBounds() {
        this.bounds = undefined;

        if (this.options.bbox.length != 4) {
            return;
        }
        const sw = new GeoPoint(this.options.bbox[1], this.options.bbox[0], 0, this.map.ProjectionId).toMapPoint();
        const ne = new GeoPoint(this.options.bbox[3], this.options.bbox[2], 0, this.map.ProjectionId).toMapPoint();

        this.bounds = new Bounds(sw, ne);
    }

    /**
     * Установить габариты слоя c рамкой больше 180 град
     * @method setBounds360
     * @private
     */
    private setBounds360() {
        this.bounds360 = false;
        if (this.options.bbox.length == 4) {
            const l1 = this.options.bbox[1] - 180;
            const l2 = this.options.bbox[3] - 180;
            if (l1 > DELTA_BOUNDS || l2 > DELTA_BOUNDS) {
                this.bounds360 = true;
            }
        }
    }

    /**
     * Создать контейнер слоя
     * @method createContainer
     * @private
     */
    private createContainer() {
        const container = this.layerContainer = GWTK.DomUtil.create('div', 'wms-panel', this.parent);
        this.image.className = 'wms-image';
        this.image.id = 'img_wms_' + this.xId;
        container.id = 'div_wms_' + this.xId;
        container.appendChild(this.image);
        this.image.onload = () => this.onLoadImage('');
    }

    /**
     * Признак использования XmlRpc
     * @property useXmlRpc
     */
    get useXmlRpc() {
        return this.options.norpc !== 1;
    }

    /**
     * Очистить фильтр объектов
     * @method clearKeysFilter
     */
    clearKeysFilter() {
        if (this.filter) {
            this.filter.clear();
        }
    }

    /**
     * Установить фильтр объектов по ключам rsc
     * @method setKeysFilter
     * @param keylist { array } массив строк ключей объектов
     */
    setKeysFilter(keylist: string[]) {
        if (this.filter) {
            this.filter.setKeyListArray(keylist);
        }
    }

    /**
     * Установить пользовательский фильтр
     * @method setUserFilter
     * @param filter {PermanentLayerFilter} Фильтр слоя
     */
    setUserFilter(filter: PermanentLayerFilter) {
        if (this.filter) {
            this.filter.addTemporaryFilter(filter);
        }
    }

    /**
     * Удалить пользовательский фильтр
     * @method resetUserFilter
     */
    resetUserFilter() {
        if (this.filter) {
            this.filter.removeTemporaryFilter();
        }
    }

    /**
     * Флаг наличия пользовательского фильтра
     * @readonly
     * @property hasUserFilter {boolean}
     */
    get hasUserFilter() {
        return !!(this.filter?.hasTemporaryFilter);
    }

    get storedTextFilter(): LayerTextFilter | undefined {
        if (this.filter) {
            return this.filter.textFilter;
        }
        return undefined;
    }

    /**
     *Формирование дополнительных стилей для WMS слоя
     * @private
     * @method createStyleFilter
     * @param objectList {GwtkMapLegendItemReduced[]} Массив объектов для применения стиля
     * @param style {SldBuildObject} Объект SLD стиля
     */
    createStyleFilter(objectList: GwtkMapLegendItemReduced[], style: SldBuildObject) {
        if (this.filter) {
            this.filter.createStyleFilter(objectList, style);
        }
    }

    /**
     * Получить текущий фильтр объектов по ключам
     * @method getKeysFilter
     * @returns { string | undefined } список ключей объектов
     */
    getKeyListFilter() {
        if (this.filter) {
            return this.filter.getKeyList;
        }
        return undefined;
    }

    /**
     * Получить массив ключей объектов фильтра
     * @method getKeysArray
     * @returns { string[] | undefined } массив ключей или undefined
     */
    getKeysArray() {
        if (this.filter) {
            return this.filter.getKeyListArray;
        }
        return undefined;
    }

    /**
     * Очистить image элемент
     * @method clearImageSrc
     */
    clearImageSrc() {
        this.image.alt = '';
        this.image.src = '';
    }

    /**
     * Запросить изображение
     * @method requestImage
     * @param params {GetImageRequestParams[]} параметры запроса
     * @param id {string} идентификатор запроса
     */
    requestImage(params: GetImageRequestParams[], id: string) {

        let multiple = 0;

        if (params.length > 1) {
            multiple = 2;
        } else {
            if (params[0].w !== undefined) {
                multiple = 1;
            }
        }

        this.cancelRequest();

        for (const param of params) {
            if (param.url === '') {
                continue;
            }
            const xhr = this.createXhr(id);

            this.activeRequest.push(
                {xhr, id, multiple, 'x': param.x, 'y': param.y, 'w': param.w}
            );
            if (param.xdata && param.xdata.length > 0) {
                xhr.open('POST', param.url, true);
                this.setRequestHeaders(xhr);
                xhr.send(param.xdata);
            } else {
                xhr.open('GET', param.url, true);
                this.setRequestHeaders(xhr);
                xhr.send();
            }
            this.image.classList.remove('img-loaded');
        }
    }

    /**
     * Создать XMLHttpRequest
     * @method createXhr
     * @param id {string} идентификатор запроса
     * @returns { XMLHttpRequest } объект запроса
     */
    private createXhr(id: string) {

        const xhr = new XMLHttpRequest();

        // установить тип данных ответа
        xhr.onloadstart = () => xhr.responseType = 'blob';

        // ответ загружен
        xhr.onload = () => {
            this.xhrLoad(xhr);
        };

        // обработать ошибку
        xhr.onerror = () => {
            this.onError(xhr);
        };

        return xhr;
    }

    /**
     * Установить заголовки
     * @private
     * @method setRequestHeaders
     * @param xhr {XMLHttpRequest} объект XMLHttpRequest
     */
    private setRequestHeaders(xhr: XMLHttpRequest) {
        if (super.getCredentialsFlag(this.map)) {
            if (this.map.options.authheader) {
                xhr.setRequestHeader(AUTH_HEADER, this.map.options.authheader);
            }
        }
        if (this.options.token) {
            xhr.setRequestHeader(GWTK.AUTH_TOKEN, this.map.getToken());
        }
    }

    /**
     * Прервать текущий запрос
     * @method cancelRequest
     * @private
     */
    private cancelRequest() {
        this.image.alt = '';
        this.image.classList.remove('img-loaded');
        if (this.activeRequest.length > 0) {
            this.activeRequest.forEach((item) => item.xhr.abort());
            this.activeRequest.splice(0, this.activeRequest.length);
        }
    }

    /**
     * Анализ ответа сервера
     * @method xhrLoad
     * @param xhr {XMLHttpRequest} объект запроса
     * @private
     */
    private xhrLoad(xhr: XMLHttpRequest) {
        if (xhr.status === 200 && xhr.response && xhr.response.type.search('image') > -1) {
            this.loadData(xhr);
        } else {
            this.onError(xhr);
        }
    }

    /**
     * Получить активный запрос для xhr
     * @method getActiveHttpRequest
     * @param xhr {XMLHttpRequest} активный XMLHttpRequest
     * @return {RequestDescriptor} описатель запроса
     * @private
     */
    private getActiveHttpRequest(xhr: XMLHttpRequest) {
        for (let i = 0; i < this.activeRequest.length; i++) {
            if (this.activeRequest[i].xhr === xhr) {
                return this.activeRequest[i];
            }
        }
    }

    /**
     * Получить активный запрос по идентификатору запроса
     * @method getActiveRequestById
     * @param id { string } идентификатор запроса
     * @return { [RequestDescriptor] } активный запрос(запросы для 180,-180)
     * @private
     */
    private getActiveRequestById(id: string) {
        const records = [];
        for (let i = 0; i < this.activeRequest.length; i++) {
            if (this.activeRequest[i].id === id) {
                records.push(this.activeRequest[i]);
            }
        }
        return records;
    }

    /**
     * Загрузить данные ответа
     * @method loadData
     * @param xhr {XMLHttpRequest} активный XMLHttpRequest
     * @private
     */
    private loadData(xhr: XMLHttpRequest) {
        const request = this.getActiveHttpRequest(xhr);
        if (!request) {
            return;
        }
        if (request.multiple === 0) {
            this.setImageSrc(request.id, BrowserService.makeObjectURL(xhr.response));
        } else {
            this.setMultiImageSrc(request, BrowserService.makeObjectURL(request.xhr.response));
        }
    }

    /**
     * Обработка изображений мультизапроса
     * @private
     * @method setMultiImageSrc
     * @param request {RequestDescriptor} описание запроса
     * @param src {string} имя изображения
     */
    private setMultiImageSrc(request: RequestDescriptor, src: string) {
        request.img = document.createElement('img');
        const img = request.img;
        img.onload = () => {
            img.classList.add('img-loaded');
            if (request.multiple === 2) {
                this.composition(request.id);
            } else {
                this.pattern(request);
            }
        };
        img.src = src;
    }

    /**
     * Составить изображение окна из одного рисунка
     * @method pattern
     * @request {RequestDescriptor} описание запроса
     * @private
     */
    private pattern(request: RequestDescriptor) {
        const size = this.map.getSize();
        const canvas = document.createElement('canvas');
        canvas.width = size.x;
        canvas.height = size.y;
        const w = request.w || size.x;
        const dh = canvas.height;
        const x = request.x || 0;
        let offset_x = x;
        let dw = w - x;
        if (x < 0) {
            offset_x += w;
            dw = Math.abs(x);
        }
        const ctx = canvas.getContext('2d');
        if (ctx && request.img) {                                          // изображение (-180, 180) одним рисунком
            ctx.drawImage(request.img, offset_x, 0, dw, dh, 0, 0, dw, dh);
            while (dw < canvas.width) {
                ctx.drawImage(request.img, dw, 0, w, dh);
                dw += w;
            }
            this.setImageSrc(request.id, canvas.toDataURL('image/png'));
        } else {
            this.drawErrorImage(request.id);
        }
    }

    /**
     * Составить изображение окна по id запроса
     * @method composition
     * @param id { string } идентификатор запроса
     * @private
     */
    private composition(id: string) {
        const requests = this.getActiveRequestById(id);
        if (requests.length < 2 || !requests[0].img || !requests[1].img) {
            return;
        }
        const size = this.map.getSize();
        const canvas = document.createElement('canvas');
        canvas.width = size.x;
        canvas.height = size.y;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            for (const request of requests) {
                if (request.img) {
                    const dx = request.x || 0;
                    const dy = request.y || 0;
                    ctx.drawImage(request.img, dx, dy);
                }
            }
            this.setImageSrc(id, canvas.toDataURL('image/png'));
        } else {
            this.drawErrorImage(id);
        }
    }

    /**
     * Обработка ошибки получения данных
     * @method drawErrorImage
     * @param id { string } идентификатор запроса
     * @private
     */
    drawErrorImage(id: string) {
        this.image.onload = () => {
            return false;
        };
        this.image.src = this.emptyImage;
        this.image.alt = id;
        if (this.onLayerRender)
            this.onLayerRender(id);
    }

    /**
     * Обработка ошибки при получении нескольких рисунков
     * @method onErrorMultiRequest
     * @param xhr { XMLHttpRequest } XMLHttpRequest запрос
     * @param id { string } идентификатор запроса
     */
    onErrorMultiRequest(xhr: XMLHttpRequest, id: string) {
        const requests = this.getActiveRequestById(id);
        for (const request of requests) {
            if (request.xhr === xhr) {
                const img = document.createElement('img');
                request.img = img;
                img.onload = () => {
                    img.classList.add('img-loaded');
                    if (request.multiple === 2) {
                        this.composition(request.id);
                    } else {
                        this.pattern(request);
                    }
                };
                this.image.src = this.emptyImage;
            }
        }
    }

    /**
     * Обработка ошибки запроса
     * @method onError
     * @param xhr { XMLHttpRequest } объект запроса
     * @private
     */
    onError(xhr: XMLHttpRequest) {
        const request = this.getActiveHttpRequest(xhr);
        if (!request) {
            return;
        }
        if (request.multiple !== 0) {
            return this.onErrorMultiRequest(xhr, request.id);
        }
        if (this.image) {
            this.image.onload = () => {
                return false;
            };
            this.image.src = this.emptyImage;
            this.image.alt = request.id;
            this.image.classList.add('img-loaded');
            if (this.onLayerRender)
                this.onLayerRender(request.id);
        }
    }

    /**
     * Установить src изображения
     * @private
     * @method setImageSrc
     * @param id {string} идентификатор изображения
     * @param src {string} источник изображения
     */
    private setImageSrc(id: string, src: string) {
        if (this.activeRequest.length > 0 && this.activeRequest[0].id === id) {
            this.revoked.push(this.image.src);
            this.image.onload = () => this.onLoadImage(id);
            this.image.alt = id;
            this.image.src = src;
        }
    }

    /**
     * Обработка загрузки изображения
     * @method onLoadImage
     * @private
     */
    private onLoadImage(id: string) {
        this.image.classList.add('img-loaded');
        if (this.onLayerRender) {
            this.onLayerRender(id);
        }
    }

    /**
     * Идентификатор активного запроса
     * @property activeRequestId
     * @returns {string}
     */
    get activeRequestId() {
        if (!this.activeRequest || this.activeRequest.length === 0) {
            return '';
        }
        return this.activeRequest[0].id;
    }

    /**
     * Непрозрачность
     * @property opacityAlpha
     * @returns {number}
     */
    get opacityAlpha() {
        return parseFloat(this.getOpacityCss());
    }

    /**
     * Нарисовать изображение слоя
     * @method drawLayer
     * @param canvas {HTMLCanvasElement}
     * @param clear {boolean} признак очистки фона
     * @param offset {Point} координаты начала в канве
     */
    drawLayer(canvas?: HTMLCanvasElement, clear?: boolean, offset?: Point) {
        const c = canvas || this.canvas;
        if (!c) {
            return;
        }
        const ctx = c.getContext('2d');
        if (!ctx) {
            return;
        }
        if (this.image.alt == '' || this.image.src == '') {
            return;
        }
        if (clear) {
            ctx.clearRect(0, 0, c.width, c.height);
        }
        let x = 0,
            y = 0;
        if (offset) {
            x = offset.x;
            y = offset.y;
        }
        ctx.globalAlpha = this.opacityAlpha;
        ctx.drawImage(this.image, x, y);
    }

    /**
     * Получить признак слежения за слоем
     * @method getWatch
     * @returns {boolean} true/false, отслеживаемый/нет
     */
    getWatch() {
        if (this.isVisible) {
            return this.options.watch;
        }
        return 0;
    }

    /**
     * Скрыть слой
     * @method hide
     */
    hide() {
        if (this._visible) {
            super.hide();
            this.clearImageSrc();
        }
    }

    /**
     * Показать слой
     * @method show
     */
    show() {
        if (!this._visible) {
            super.show();
        }
    }

    /**
     * Обновить рисунок
     * @method update
     */
    update() {
        this.map.tiles.wmsUpdate();
    }

    getLegend() {
        this.legendInstance.serviceUrl = this.serviceUrl;
        return super.getLegend();
    }

}
