/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Класс Слой карты                         *
 *                            GWTK SE                               *
 *                                                                  *
 *******************************************************************/
import {GwtkLayerDescription, LayerTooltip} from '~/types/Options';
import LayerOptions, {LayerTextFilter} from '~/types/LayerOptions';
import {GwtkMap, GwtkMapLegendItemReduced, Legend, SldBuildObject} from '~/types/Types';
import Classifier from '~/classifier/Classifier';
import LegendClass from '~/classifier/Legend';
import {BYXSD_VALUE} from '~/services/RequestServices/common/enumerables';
import Utils from '~/services/Utils';
import PixelPoint from '~/geometry/PixelPoint';
import {Bounds} from '~/geometry/Bounds';
import MapSheet from '~/classifier/MapSheet';
import { PROJECT_SETTINGS_MAP_LEGEND } from '~/utils/WorkspaceManager';


export default abstract class Layer {

    /**
     * Экземпляр карты
     * @property map {GwtkMap}
     */
    readonly map!: GwtkMap;

    options: LayerOptions;
    url: string = '';
    id: string = '';
    idLayer: string = '';

    alias: string = '';
    selectObject: boolean = false;
    keysTextSearch: string[] = [];
    classifier?: Classifier;
    layerContainer: HTMLDivElement | undefined = undefined;
    format: string = '';
    areaSeek: boolean = false;
    urlsList: string[] = [];
    _listIndex: number = -1;
    isTiled: boolean = false;
    server?: string;
    enabled?: boolean = false;
    objNameSemantic?: string[];
    protected _visible: boolean = true;

    refresh?: () => void;

    zIndex = 1;

    private mapSheetsInstance: MapSheet;

    protected legendInstance: LegendClass;

    protected constructor(map: GwtkMap, layerdescription: GwtkLayerDescription) {

        Reflect.defineProperty(this, 'map', {
            enumerable: true,
            get: function () {
                return map;
            }.bind(this)
        });

        this.options = new LayerOptions(layerdescription);
        if (this.isError) {
            throw Error('Map layer creation error:' + JSON.stringify(layerdescription));
        }

        this.alias = this.options.alias;
        this.id = this.options.id;
        this.idLayer = this.options.idLayer ? this.options.idLayer : '';
        this.visible = !this.options.hidden;
        this.zIndex = this.options.zIndex;
        this.url = this.options.url;
        this.selectObject = this.options.selectObject;
        this.keysTextSearch = this.options.keyssearchbyname.slice(0, this.options.keyssearchbyname.length);
        this.classifier = undefined;
        this.format = this.options.format;
        this.areaSeek = this.selectObject;
        this.urlsList = this.options.linkedUrls.slice(0, this.options.linkedUrls.length);
        this.urlsList.unshift(this.options.url);
        this._listIndex = 0;
        if (this.url.length > 0) {
            const uri = Utils.parseUrl(this.url);
            this.server = uri.origin + '/' + uri.pathname;
        }
        this.legendInstance = new LegendClass({
            serviceUrl: this.serviceUrl,
            layerId: this.idLayer,
            filters: {
                BYXSD: BYXSD_VALUE.ByLayer,
                KEYLIST: this.options.filter?.keylist
            }
        }, this.map, this.map);

        this.mapSheetsInstance = new MapSheet({
            serviceUrl: this.serviceUrl,
            layerId: this.idLayer
        });

        if (this.options.objnamesemantic) {
            this.objNameSemantic = this.options.objnamesemantic.slice();
        }

        this.initOpacity();
    }

    /**
     * @property xId
     * @deprecated Use 'id' instead
     */
    get xId() {
        return this.id;
    }

    /**
     * @property xId
     * @deprecated
     */
    set xId(value: string) {
        this.id = value;
    }

    set visible(value: boolean) {
        this._visible = value;
        this.options.hidden = !value;
    }

    get visible() {
        return this._visible && !(this.map.contentTreeManager?.checkNodeIsDisabled(this.id) || false);
    }

    get visibleFlag() {
        return this._visible;
    }

    /**
     * Идентификатор проекции (тайловой матрицы)
     * @property projectionId {string}
     */
    get projectionId(): string {
        return this.options.tilematrixset || this.map.ProjectionId;
    }

    /**
     * URL-адрес источника
     * @property serviceUrl {string}
     */
    get serviceUrl() {
        return this.server || '';
    }

    /**
     * URL-адрес получения данных
     * @property serverUrl {string}
     */
    get serverUrl() {
        return this.url;
    }

    /**
     * Получить название типа слоя
     * @method getType
     * @public
     * @returns {string} название типа слоя ( LAYERTYPENAME )
     */
    getType() {
        return this.typeName;
    }

    get typeName() {
        return this.options.getLayerTypeName;
    }

    /**
     * Получить шаблон всплывающего окна
     * @property tooltipTemplate {LayerTooltip | undefined}
     */
    get tooltipTemplate(): LayerTooltip | undefined {
        return this.options.tooltip;
    }

    /**
     * Получить тип слоя
     * @method getTypeValue
     * @public
     * @returns {number} тип слоя ( LAYERTYPE )
     */
    type() {
        return this.options.getLayerType;
    }

    /**
     * Наличие ошибки
     * @method isError
     * @public
     * @returns {boolean} `true` - ошибка имеется
     */
    get isError() {
        let error = false;
        if (this.options.isError)
            error = true;
        return error;
    }

    get legendLayerKeysFilter() {
        return this.options.legendLayerKeys;
    }

    get legendTextKeysFilter() {
        return this.options.legendTextKeys;
    }

    /**
     * Признак служебного слоя
     * @method duty
     * @public
     * @returns {boolean} `true` - слой служебный
     */
    get duty() {
        if (this.isError) {
            return false;
        }
        return this.options.duty;
    }

    /**
     * Радиус выбора объектов в точке
     * @property areaPixel
     * @public
     * @returns {number} радиус области отбора объектов операции GetFeature, пикселы
     */
    get areaPixel() {
        return this.options.areapixel;
    }

    /**
     * Получить признак видимости
     * @method getVisibility
     * @public
     * @returns {boolean} `true` - слой видимый
     */
    getVisibility() {
        return this.visible;
    }

    setVisibility(value: boolean) {
        this.visible = value;
    }

    /**
     * Минимальный масштаб видимости
     * @method minZoomView
     * @public
     * @returns {number} уровень масштабирования
     */
    get minZoomView() {
        return this.options.minzoomview;
    }

    /**
     * Максимальный масштаб видимости
     * @method maxZoomView
     * @public
     * @returns {number} максимальный масштаб видимости, уровень масштабирования
     */
    get maxZoomView() {
        return this.options.maxzoomview;
    }

    /**
     * Проверить видимость по уровню масштабирования
     * @method checkViewZoom
     * @param zoom {number} уровень масштабирования
     * @public
     * @returns {boolean} `true` - слой видим на уровне zoom
     */
    checkViewZoom(zoom: number) {
        return zoom <= this.maxZoomView && zoom >= this.minZoomView;
    }

    /**
     * Показать слой
     * @method show
     * @public
     */
    show() {
        this.visible = true;
    }

    /**
     * Скрыть слой
     * @method hide
     * @public
     */
    hide() {
        this.visible = false;
    }

    /**
     * Обновить слой
     * @method update
     * @public
     */
    update(): void {
    }

    /**
     * Установить параметры
     * @method setOptions
     * @public
     */
    protected setOptions() {
    }

    /**
     * Обработка при добавлении в карту
     * @method onAdd
     * @public
     */
    onAdd() {
    }

    /**
     * Обработка при удалении из карты
     * @method onAdd
     * @public
     */
    onRemove() {
    }

    /**
     * Проверить возможность поиска по названию для слоя
     * @method isTextSearch
     * @public
     * @returns {Boolean} true/false, возможен/нет
     */
    get isTextSearch() {
        if (!this.getVisibility) return false;
        return (this.keysTextSearch.length > 0 && this.keysTextSearch[0].length > 0);
    }

    /**
     * Проверить наличие легенды у слоя
     * @method hasLegend
     * @public
     * @return {Boolean} true/false
     */
    hasLegend() {
        return this.options.legend.length > 0;
    }

    get isStoredFilter() {
        return (this.options.filter !== undefined);
    }

    get enabledByFilter() {
        return true;
    }

    get isLayersMerge() {
        return this.map.mergeWmsLayers();
    }

    getLayerStatus() {
        return Promise.resolve('1');
    }

    /**
     * Запросить параметры поиска по названию для слоя
     * @method getTextFilterKeys
     * @return {String} список ключей семантик через запятую или пустая строка
     */
    getTextFilterKeys() {
        if (!this.isTextSearch)
            return '';
        const res: string[] = [];
        for (let i = 0; i < this.keysTextSearch.length; i++) {
            if (this.keysTextSearch[i] && this.keysTextSearch[i].length > 0)
                res.push(this.keysTextSearch[i]);
        }

        return res.toString();
    }

    /**
     * Деструктор
     * @method destroy
     * @public
     */
    destroy() {
    }

    /**
     * Инициализировать непрозрачность
     * @method initOpacity
     * @param value {string | number} непрозрачность
     * @returns {string} css значение непрозрачности
     * @public
     */
    initOpacity(value?: string | number): string {
        if (typeof value == 'string') {
            this.options.opacity = parseInt(value);
        } else if (typeof value == 'number') {
            this.options.opacity = value;
        } else this.options.opacity = +this.options.opacityValue;

        return this.getOpacityCss();
    }

    /**
     * Установить непрозрачность
     * @method setOpacity
     * @param newvalue {number} css непрозрачность
     * @public
     */
    setOpacity(newvalue: number) {
        if (this.options.duty) return;
        let value = newvalue;
        if (value > 1) value = 1;
        this.options.opacity = value * 100;
    }

    /**
     * Получить непрозрачность css по параметрам
     * @method getOpacityCss
     * @return {string} css значение непрозрачности
     * @public
     */
    getOpacityCss(): string {
        if (!this.options) return '1.0';
        return (this.options.opacity / 100.0).toFixed(2);
    }

    /**
     * Получить флаг авторизации
     * @method _getCredentialsFlag
     * @param map {GwtkMap} карта
     * @returns {boolean}
     * @private
     */
    protected getCredentialsFlag(map: GwtkMap) {
        return map.authTypeServer(this.url) || map.authTypeExternal(this.url);
    }

    /**
     * Получить параметры заголовков запроса
     * @method getRequestHeaders
     * @param map {GwtkMap} карта
     * @returns {SimpleJson} параметры
     * @private
     */
    protected getRequestHeaders(map: GwtkMap) {
        let header = {withCredentials: this.getCredentialsFlag(map), token: ''};
        if (this.options.token) {
            const token = map.getToken();
            header.token = token ? token : '';
        }
        return header;
    }

    getKeysArray(): string[] | undefined {
        return;
    }

    setKeysFilter(value: string[]) {
    }
    createStyleFilter ( objectList: GwtkMapLegendItemReduced[], style: SldBuildObject) {
    }

    private legendRequestPromise?: Promise<Legend>;

    private updatedLegend = false;

    async getLegend(): Promise<Legend> {

        if (this.legendRequestPromise === undefined || this.map.workspaceManager.getValue(PROJECT_SETTINGS_MAP_LEGEND) || !this.updatedLegend) {
            this.updatedLegend = false;
            this.legendRequestPromise = this.requestLegend();
            if (!this.map.workspaceManager.getValue(PROJECT_SETTINGS_MAP_LEGEND) && this.legendRequestPromise !== undefined) {
                this.updatedLegend = true;
            }
        }
        return this.legendRequestPromise;
    }

    private async requestLegend() {
        try {
            const legend = await this.legendInstance.getLegend();
            this.map.trigger({type: 'loadclassifier', legend: this.legendInstance, layer: this, target: 'map'});
            return legend;
        } catch (error) {
            this.map.trigger({type: 'loadclassifierError', layer: this, target: 'map', error: '' + error});
            throw error;
        }
    }

    clearLegend(): void {
        this.legendRequestPromise = undefined;
        this.legendInstance.clear();
    }

    cancelRequests() {
        this.legendInstance.cancelRequest();
    }

    getSheetNameList(): Promise<string[]> {
        return this.mapSheetsInstance.getMapSheetNames();
    }

    get isEditable(): boolean {
        let result = false;

        const editorOptions = this.map.getEditableLayersOptions();
        if (editorOptions) {
            result = editorOptions.maplayersid && editorOptions.maplayersid.includes(this.id);
            if (result) {
                const functions = editorOptions.functions;
                if (functions) {
                    result = functions.includes('*') || functions.includes('edit') || functions.includes('create') || functions.includes('delete');
                } else {
                    result = false;
                }
            }
        }

        return result;
    }


    get isCommonPointsEditEnabled(): boolean {
        let result = false;

        if (this.isEditable) {
            const editorOptions = this.map.getEditableLayersOptions();
            if (editorOptions && editorOptions.selectlayersid) {
                result = editorOptions.selectlayersid && editorOptions.selectlayersid.includes(this.id);
            }
        }

        return result;
    }

    /**
     * Получение фильтра слоя
     * @readonly
     * @property storedTextFilter { LayerTextFilter | undefined }
     */
    get storedTextFilter(): LayerTextFilter | undefined {
        if (this.options.filter) {
            return this.options.filter.textfilter;
        }
        return undefined;
    }

    get storedFilterKeyList(): string | undefined {
        if (this.options.filter && this.options.filter.keylist) {
            if (this.options.filter.keylist.length > 0) {
                return this.options.filter.keylist;
            }
        }
        return undefined;
    }

    get storedFilterIdList(): string | undefined {
        return undefined;
    }

    /**
     * Получить Bbox для точки
     * @method getBboxForPoint
     * @param point {PixelPoint} координаты точки, пикселы
     * @returns {Bounds | undefined} габариты по координатам точки и радиусу отбора объектов areaPixel
     */
    getBboxForPoint(point: PixelPoint): Bounds | undefined {
        const radius = this.areaPixel;
        if (radius > 0) {
            const leftBottom = point.clone();
            leftBottom.x -= radius;
            leftBottom.y += radius;

            const rightTop = point.clone();
            rightTop.x += radius;
            rightTop.y -= radius;

            const leftBottomPlane = this.map.pixelToPlane(leftBottom);
            const rightTopPlane = this.map.pixelToPlane(rightTop);
            return new Bounds(leftBottomPlane, rightTopPlane);
        }
    }

}
