/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Объект карты                             *
 *                                                                  *
 *******************************************************************/

import {LOCALE, LogEventType, SimpleJson} from '~/types/CommonTypes';
import Style from '~/style/Style';
import BaseMapObjectGeometry, {
    ContourSelector,
    ObjectSelector,
    PointInfo,
    PointSelector,
    NearestInterpolatedPointResult
} from '~/mapobject/geometry/BaseMapObjectGeometry';
import MultiPolygonGeometry from '~/mapobject/geometry/MultiPolygonGeometry';
import PolygonGeometry from '~/mapobject/geometry/PolygonGeometry';
import MultiLineGeometry from '~/mapobject/geometry/MultiLineGeometry';
import LineGeometry from '~/mapobject/geometry/LineGeometry';
import MultiPointGeometry from '~/mapobject/geometry/MultiPointGeometry';
import PointGeometry from '~/mapobject/geometry/PointGeometry';
import Utils from '~/services/Utils';
import VectorLayer from '~/maplayers/VectorLayer';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import {Vector2D, Vector2or3} from '~/3d/engine/core/Types';
import {Bbox, FeatureProperties, FeatureSemanticItem, FeatureType} from '~/utils/GeoJSON';
import {OUTTYPE} from '~/services/RequestServices/common/enumerables';
import MapObjectSemantics from '~/mapobject/MapObjectSemantics';
import {
    CalculateLengthResponse,
    FileByLinkParams,
    GetAreaParams,
    GetAreaResponse,
    RscSemantic
} from '~/services/RequestServices/RestService/Types';
import {HttpParams} from '~/services/RequestServices/common/RequestService';
import {ServiceResponse} from '~/services/Utils/Types';
import PixelPoint from '~/geometry/PixelPoint';
import {Bounds} from '~/geometry/Bounds';
import {MapPoint} from '~/geometry/MapPoint';
import GeoPoint from '~/geo/GeoPoint';
import {BrowserService} from '~/services/BrowserService';
import UndefinedGeometry from '~/mapobject/geometry/UndefinedGeometry';
import {ClassifierSemantic} from '~/mapobject/utils/MapObjectContent';


/**
 * Список типов объектов карты
 * @enum MapObjectType
 */
export enum MapObjectType {
    Undefined = 'Undefined',
    Point = 'Point',
    MultiPoint = 'MultiPoint',
    LineString = 'LineString',
    MultiLineString = 'MultiLineString',
    Polygon = 'Polygon',
    MultiPolygon = 'MultiPolygon'
}

export type HoverResult = {
    mapObjectId: string;
    mapPoint?: MapPoint;
} & PointInfo;

export type TooltipDescription = {
    objectName?: string;
    layerName?: string;
    image?: string;
    semantics?: FeatureSemanticItem[];
};

export type TransactionType = 'insert' | 'replace' | 'delete';

export type CalcAngleResultType = {
    angle1: number;
    angle2: number;
    resultAngle: number;
};

export type TransactionFeature = FeatureType & { transaction: TransactionType; id: string; };


type MapObjectMetadata = FeatureProperties & {
    id: string;
    objectNumber: number;
    sheetName?: string;
    type: MapObjectType;
}


type DocumentItemRequest = { promise: Promise<ServiceResponse<Blob | string>>, documentPath: string };

/**
 * Объект карты
 * @class MapObject
 */
export default class MapObject {

    /**
     * Область захвата в метрах по умолчанию
     * @property {number} deltaDefault
     */
    private readonly deltaDefault = 5;

    /**
     * Флаг изменения состояния объекта
     * @property {boolean} isDirty
     */
    isDirty = true;

    /**
     * Флаг валидности ГИС объекта
     * @property {boolean} isValidGisObject
     */
    isValidGisObject:boolean;

    /**
     * Флаг нового объекта
     * @property {boolean} newFlag
     */
    get newFlag() {
        return this.metaData.objectNumber <= 0;
    }

    /**
     * Метка удаления объекта
     * @private
     * @property {true|undefined} removed
     */
    private removed?: true;

    /**
     * Флаг удаленного объекта
     * @property {boolean} removeFlag
     */
    get removeFlag(): boolean {
        return !!this.removed;
    }

    /**
     * Границы объекта
     * @private
     * @property {Bounds|undefined} bounds
     */
    private bounds?: Bounds;

    /**
     * Геометрия объекта карты
     * @private
     * @readonly
     * @property {BaseMapObjectGeometry} geometry
     */
    private geometry: BaseMapObjectGeometry;

    /**
     * Список семантик объекта карты
     * @private
     * @readonly
     * @property {MapObjectSemantics} mapObjectSemantics
     */
    private readonly mapObjectSemantics: MapObjectSemantics = new MapObjectSemantics();

    /**
     * Url загруженного изображения объекта из легенды (классификатора)
     * @private
     * @property {string|null} mapObjectLegendImageUrl
     */
    private mapObjectLegendImageUrl: string | null = null;

    /**
     * Изображение объекта из легенды
     * @private
     * @property {string} legendImgUrl
     */
    private get legendImgUrl(): string {
        if (this.mapObjectLegendImageUrl === null && this.mapId) {
            this.vectorLayer.getLegendImageUrl(this)
                .then(result => this.mapObjectLegendImageUrl = result)
                .catch(() => this.mapObjectLegendImageUrl = '')
                .finally(() => this.imageUrlPromiseResolve && this.imageUrlPromiseResolve(this.mapObjectLegendImageUrl || ''));
            // if ( this.mapObjectLegendImageUrl === null ) {
            //     this.mapObjectLegendImageUrl = '';
            // }
        }
        return this.mapObjectLegendImageUrl || '';
    }

    /**
     * Идентификатор объекта карты
     * @private
     * @property {string} guid
     */
    private guid = 'object' + '_' + Utils.generateGUID();

    /**
     * Идентификатор объекта карты
     * @property {MapObjectType} id
     */
    get id(): string {
        return this.guid;
    }

    /**
     * Адрес (по семантике)
     * @property {string|undefined} address
     */
    get address(): string | undefined {
        return this.getSemanticValue('address');
    }

    /**
     * Название (по семантике)
     * @property {string} objectNameBySemantic
     */
    get objectNameBySemantic(): string {
        const objNameSemantics = this.vectorLayer.objNameSemantic;
        if (objNameSemantics) {
            for (const semantic of objNameSemantics) {
                const semValue = this.getSemanticValue(semantic);
                if (semValue) {
                    return semValue;
                }
            }
        }
        return '';
    }

    /**
     * Список изображений объекта (по семантике)
     * @readonly
     * @property {object} objectImages
     */
    readonly objectImages: { src: string; path: string; }[];

    /**
     * Изображение объекта из семантики
     * @property mapObjectPictureUrl {string|undefined}
     */
    get mapObjectPictureUrl(): string | undefined {
        if (this.objectImages.length === 0) {
            this.reloadImages(1);
        }
        return this.objectImages[0] ? this.objectImages[0].src : undefined;
    }

    /**
     * Иконка объекта (из семантики, если нет, то из легенды)
     * @property mapObjectIconUrl {string}
     */
    get mapObjectIconUrl(): string {
        if (this.isEmptyClusterObject && this.metaData.ClusterViewPath && this.mapId) {
            return this.vectorLayer.serviceUrl + '?SERVICE=WFS&METHOD=GetLegend&LAYER=' + encodeURIComponent(this.mapId) + '&FILEPATH=' + encodeURIComponent(this.metaData.ClusterViewPath);
        } else {
            return this.legendImgUrl;
        }
    }

    private imageUrlPromise?: Promise<string>;
    private imageUrlPromiseResolve?: (value: string) => void;


    /**
     * Метаданные объекта
     * @private
     * @readonly
     * @property {MapObjectMetadata} metaData
     */
    private readonly metaData: MapObjectMetadata = {
        id: '',
        objectNumber: 0,
        type: MapObjectType.Point
    };

    /**
     * Тип объекта карты
     * @property {MapObjectType} type
     */
    get type(): MapObjectType {
        return this.metaData.type;
    }

    /**
     * Площадь объекта
     * @property {number|undefined} objectArea
     */
    get objectArea(): number | undefined {
        return this.metaData.area;
    }

    /**
     * Периметр объекта
     * @property {number|undefined} objectPerimeter
     */
    get objectPerimeter(): number | undefined {
        return this.metaData.perimeter;
    }

    /**
     * Номер объекта
     * @property {number} objectNumber
     */
    get objectNumber(): number {
        return this.metaData.objectNumber;
    }

    set objectNumber(number) {
        this.metaData.objectNumber = number;
        this.metaData.id = this.metaData.sheetName + '.' + this.metaData.objectNumber;
    }

    /**
     * Наименование объекта (может быть многострочным)
     * @property { string | string[] | undefined } title
     */
    get title(): string | string[] | undefined {
        let result = this.metaData.title;
        if (!result) {
            result = this.getSemanticValue('title') || this.getSemanticValue('ObjName');
        }

        return result;
    }

    /**
     * Идентификатор карты на сервисе
     * @property {string|undefined} mapId
     */
    get mapId(): string | undefined {
        return this.metaData.mapid;
    }

    /**
     * Название листа карты
     * @property {string|undefined} sheetName
     */
    get sheetName(): string | undefined {
        return this.metaData.sheetName;
    }

    /**
     * Получить локализацию объекта (запрос через легенду)
     * @async
     * @method getLocal
     * @return {LOCALE}
     */
    async getLocal(): Promise<LOCALE> {
        let result = this.metaData.local;
        if (result === undefined && this.mapId) {
            const legend = await this.vectorLayer.getLegend();
            if (legend) {
                const legendLayer = legend.nodes.find(layer => layer.key === this.layerId);
                if (legendLayer) {
                    const legendObject = legendLayer.nodes?.find(object => object.key === this.key);
                    if (legendObject) {
                        result = legendObject.local;
                    }
                }
            }
        }

        if (result === undefined) {
            switch (this.type) {
                case MapObjectType.LineString:
                case MapObjectType.MultiLineString:
                    result = LOCALE.Line;
                    break;
                case MapObjectType.MultiPolygon:
                case MapObjectType.Polygon:
                    result = LOCALE.Plane;
                    break;
                case MapObjectType.MultiPoint:
                case MapObjectType.Point:
                    result = LOCALE.Point;
                    break;
                case MapObjectType.Undefined:
                default:
                    result = LOCALE.Undefined;
            }
        }

        return result;
    }

    set local(value: LOCALE) {
        this.metaData.local = value;
    }

    /**
     * GML-идентификатор объекта
     * @property {string} gmlId
     */
    get gmlId(): string {
        return this.metaData.id;
    }

    set gmlId(gmlId: string) {
        const splitResult = gmlId.split(/[:\\.]/);

        const objectNumber = splitResult.pop();
        if (objectNumber) {
            this.metaData.objectNumber = +objectNumber;
        }

        const sheetName = splitResult.pop();
        if (sheetName) {
            this.metaData.sheetName = sheetName;
        }
        this.metaData.id = this.metaData.sheetName + '.' + this.metaData.objectNumber;
    }

    /**
     * Ключ объекта в таблице хранилища
     * @property {string} storageKey
     */
    get storageKey(): string {
        return this.gmlId + this.vectorLayer.serviceUrl + this.vectorLayer.idLayer;
    }

    /**
     * Код объекта в классификаторе
     * @property {number|undefined} code
     */
    get code(): number | undefined {
        return this.metaData.code;
    }

    /**
     * Ключ объекта в классификаторе
     * @property {string|undefined} key
     */
    get key(): string | undefined {
        return this.metaData.key;
    }

    /**
     * Идентификатор слоя классификатора
     * @property {string|undefined} layerId
     */
    get layerId(): string | undefined {
        return this.metaData.layerid;
    }

    /**
     * Название слоя классификатора
     * @property {string|undefined} layerName
     */
    get layerName(): string | undefined {
        return this.metaData.layer;
    }

    /**
     * Название объекта классификатора
     * @property {string|undefined} objectName
     */
    get objectName(): string | undefined {
        return this.metaData.name;
    }

    /**
     * Название XSD схемы классификатора
     * @property {string|undefined} schema
     */
    get schema(): string | undefined {
        return this.metaData.schema;
    }

    /**
     * Флаг "пустого" объекта кластера
     * @property {boolean} isEmptyClusterObject
     */
    get isEmptyClusterObject(): boolean {
        return !!this.metaData.ClusterId;
    }

    /**
     * Идентификатор кластера для группы ("пустого" объекта)
     * @property {string | undefined} clusterId
     */
    get clusterId(): string | undefined {
        return this.metaData.ClusterId || undefined;
    }

    /**
     * Флаг объекта кластера
     * @property {boolean}  isClusterObject
     */
    get isClusterObject(): boolean {
        return !!this.metaData.ClusterIdRef;
    }

    /**
     * Идентификатор кластера объекта
     * @property {string | undefined} clusterIdRef
     */
    get clusterIdRef(): string | undefined {
        return this.metaData.ClusterIdRef || undefined;
    }

    get topScale(): number | undefined {
        return this.metaData.topscale;
    }

    get bottomScale(): number | undefined {
        return this.metaData.bottomscale;
    }

    /**
     * Сбросить идентификатор кластера объекта
     */
    resetClusterRef(): void {
        delete this.metaData.ClusterIdRef;
    }

    /**
     * Проверка наличия общего источника
     * @method hasSameOriginTo
     * @param object {MapObject} Объект карты
     * @return {boolean}
     */
    hasSameOriginTo(object: MapObject): boolean {
        return this.vectorLayer.serviceUrl === object.vectorLayer.serviceUrl
            && this.vectorLayer.idLayer === object.vectorLayer.idLayer
            && this.gmlId === object.gmlId;
    }

    classifierSemantics: ClassifierSemantic[] = [];

    semanticOfObjectSemanticsList: RscSemantic[] = [];

    /**
     * @constructor MapObject
     * @param vectorLayer {VectorLayer} Экземпляр слоя для объекта
     * @param type {MapObjectType} Тип геометрии объекта карты
     * @param properties {FeatureProperties} Свойства объекта
     */
    constructor(readonly vectorLayer: VectorLayer, type: MapObjectType = MapObjectType.Undefined, properties?: FeatureProperties, isValidGisObject = true) {
        this.metaData.type = type;

        if (properties) {
            this.updateProperties(properties);
        }

        this.geometry = MapObject.createGeometry(type);

        this.objectImages = this.vectorLayer.getObjectImages(this.metaData.id);
        this.isValidGisObject = isValidGisObject;

    }

    /**
     * Обновить свойства объекта
     * @private
     * @method updateProperties
     * @param properties {FeatureProperties} Свойства
     */
    private updateProperties(properties: FeatureProperties): void {
        this.gmlId = properties.id || '';
        this.metaData.id = properties.id || '';
        this.metaData.area = properties.area;
        this.metaData.code = properties.code;
        this.metaData.layer = properties.layer;
        this.metaData.layerid = properties.layerid;
        this.metaData.mapid = properties.mapid;
        this.metaData.name = properties.name;
        this.metaData.perimeter = properties.perimeter;
        this.metaData.schema = properties.schema;
        this.metaData.title = Array.isArray(properties.title) ? properties.title.join(' ') : properties.title;
        this.metaData.key = properties.key;
        this.metaData.local = properties.local;
        this.metaData.sld = properties.sld;
        this.metaData.ClusterId = properties.ClusterId;
        this.metaData.ClusterIdRef = properties.ClusterIdRef;
        this.metaData.ClusterViewPath = properties.ClusterViewPath;
        this.metaData.topscale = properties.topscale;
        this.metaData.bottomscale = properties.bottomscale;

        if (properties.semantics) {
            this.addSemanticList(properties.semantics);
        }
    }

    resetKey() {
        this.metaData.key = undefined;
    }

    /**
     * Запросить документ по семантике
     * @private
     * @method requestDocument
     * @param semantics {string[]} Список ключей семантик
     * @param fileExtensions {string[]} Массив допустимых расширений документа
     * @param [limit] {number} Ограничение по количеству элементов
     * @return {object} Описание документа
     */
    private requestDocument(semantics: string[], fileExtensions: string[], limit?: number): (DocumentItemRequest | undefined)[] | undefined {

        const result: (DocumentItemRequest | undefined)[] = [];

        for (let i = 0; i < semantics.length; i++) {

            const imageSemantic = semantics[i];

            const documentSemantics = this.mapObjectSemantics.getRepeatableSemantics(imageSemantic);

            if (documentSemantics && documentSemantics.length > 0) {
                const httpParams = {url: this.vectorLayer.serviceUrl};

                let count = documentSemantics.length;
                if (limit !== undefined) {
                    count = Math.min(limit, count);
                }

                for (let i = 0; i < count; i++) {
                    const documentSemantic = documentSemantics[i];
                    if (!this.objectImages.find(item => item.path === documentSemantic.value)) {
                        result.push(this.requestDocumentItem(documentSemantic.value, fileExtensions, httpParams));
                    }
                }
            }
        }

        return result;
    }

    /**
     * Запросить документ
     * @private
     * @method requestDocument
     * @param documentSemanticValue {string} Путь к файлу
     * @param fileExtensions {string[]} Массив допустимых расширений документа
     * @param httpParams {HttpParams} Параметры запроса
     * @return {DocumentItemRequest | undefined} Объект запроса документа
     */
    private requestDocumentItem(documentSemanticValue: string, fileExtensions: string[], httpParams: HttpParams): DocumentItemRequest | undefined {
        const documentExtension = documentSemanticValue.slice(documentSemanticValue.lastIndexOf('.') + 1);
        if (!this.mapId || !documentExtension || !fileExtensions.includes(documentExtension)) {
            return;
        }

        const fileByLinkParam: FileByLinkParams = {
            ALIAS: documentSemanticValue,
            LAYER: this.mapId
        };

        let requestPromise: Promise<ServiceResponse<Blob | string>>;

        if (Utils.isValidUrl(documentSemanticValue)) {
            requestPromise = Promise.resolve<ServiceResponse>({data: fileByLinkParam.ALIAS});
        } else {
            const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
            requestPromise = service.getFileByLink(fileByLinkParam);
        }

        return {promise: requestPromise, documentPath: fileByLinkParam.ALIAS};

    }

    /**
     * Составить и отправить запрос площади и периметра объекта
     * @private
     * @method getAreaRequest
     * @return {Promise} Запрос
     */
    private getAreaRequest(options?: GetAreaParams): Promise<ServiceResponse<GetAreaResponse>> {
        const service = RequestServices.retrieveOrCreate({url: this.vectorLayer.map.options.url}, ServiceType.REST);

        const geoJSONFeature = this.toJSON();

        geoJSONFeature.properties.sld = undefined;  //fixme: иначе ошибка на сервисе!!!
        const jsonFeatureCollection = {
            type: 'FeatureCollection',
            crs: {type: 'name', properties: {name: this.vectorLayer.map.getCrsString()}},
            features: [geoJSONFeature]
        };

        return service.getArea(options || {}, {data: jsonFeatureCollection});
    }

    /**
     * Запросить азимут
     * @private
     * @method getAzimuthRequest
     * @param point1 {MapPoint} Первая точка
     * @param point2 {MapPoint} Вторая точка
     * @return {XMLElement} XML-элемент
     */
    private getAzimuthRequest(point1: MapPoint, point2: MapPoint) {
        const service = RequestServices.retrieveOrCreate({url: this.vectorLayer.map.options.url}, ServiceType.REST);

        const pointOrigin1 = point1.toOrigin();
        const pointOrigin2 = point2.toOrigin();

        const options = {
            POINT1: pointOrigin1[0] + ',' + pointOrigin1[1],
            POINT2: pointOrigin2[0] + ',' + pointOrigin2[1],
            CRS: this.vectorLayer.map.getCrsString(),
            CalculateEpsg: this.vectorLayer.map.getCrsString()
        };

        return service.sideAzimuth(options);
    }

    /**
     * Получить адрес изображения объекта
     * @private
     * @method getImageSrc
     * @return {Promise<string>} Promise адреса изображения объекта
     */
    protected getImageSrc(): Promise<string> {
        if (!this.imageUrlPromise) {

            this.reloadImages();

            this.imageUrlPromise = new Promise<string>((resolve, reject) => {
                this.imageUrlPromiseResolve = () => {
                    if (this.objectImages.length !== 0) {
                        if (this.mapObjectPictureUrl) {
                            this.imageUrlPromiseResolve = undefined;
                            resolve(this.mapObjectPictureUrl!);
                        } else {
                            reject('');
                        }
                    } else if (this.legendImgUrl) {
                        resolve(this.legendImgUrl);
                    } else {
                        reject('');
                    }
                };
                const url = this.mapObjectIconUrl;
                if (url) {
                    this.imageUrlPromiseResolve && this.imageUrlPromiseResolve(url);
                }
            });
        }
        return this.imageUrlPromise;
    }

    /**
     * Принудительное выставление флага изменения состояния
     * @method forceUpdate
     */
    forceUpdate(): void {
        this.isDirty = true;
    }

    /**
     * SLD-Стили отображения объекта карты
     * @property {Style[]|undefined} styles
     */
    get styles(): Style[] | undefined {
        const result = [];
        if (this.metaData.sld) {
            for (let i = 0; i < this.metaData.sld.length; i++) {
                const style = Style.fromServiceSVG(this.metaData.sld[i]);
                if (style) {
                    result.push(style);
                }
            }
        }

        return result.length !== 0 ? result : undefined;
    }

    /**
     * Добавить SLD стили
     * @method addStyle
     */
    addStyle(style: Style): void {
        if (!Array.isArray(this.metaData.sld)) {
            this.metaData.sld = [];
        }
        this.metaData.sld.push(...style.toServiceSVG());
    }

    /**
     * Очистить SLD стили
     * @method clearStyles
     */
    clearStyles(): void {
        this.metaData.sld = undefined;
    }

    /**
     * Добавление семантик
     * @method addSemanticList
     * @param semantics
     */
    addSemanticList(semantics: FeatureSemanticItem[]): void {
        this.mapObjectSemantics.addUniqueSemantics(semantics);
    }

    /**
     * Добавление семантики
     * @method addSemantic
     * @param semantic
     */
    addSemantic(semantic: FeatureSemanticItem): void {
        this.mapObjectSemantics.addUniqueSemantic(semantic);
    }

    /**
     * Добавление семантики
     * @method addRepeatableSemantic
     * @param semantic
     */
    addRepeatableSemantic(semantic: FeatureSemanticItem): void {
        this.mapObjectSemantics.addRepeatableSemantic(semantic);
    }

    /**
     * Обновить значения неповторяемой семантики
     * @method updateSemantic
     * @param semantic {FeatureSemanticItem} Параметры семантики
     */
    updateSemantic(semantic: FeatureSemanticItem): void {
        this.mapObjectSemantics.setFirstSemanticValue(semantic.key, semantic.value);
    }

    /**
     * Обновить значения семантики
     * @method updateRepeatableSemantic
     * @param key {string} Ключ семантики
     * @param index {number} Порядковый номер повторяемой семантики (для неповторяемых 0)
     * @param value {string} Значение семантики
     */
    updateRepeatableSemantic(key: string, index: number, value: string): void {
        this.mapObjectSemantics.setRepeatableSemanticValue(key, index, value);
    }

    /**
     * Получить семантику по ключу
     * @method getSemantic
     * @param key {string} Ключ семантики
     * @return {FeatureSemanticItem | undefined} Семантика объекта с указанным ключом
     */
    getSemantic(key: string): FeatureSemanticItem | undefined {
        return this.mapObjectSemantics.getFirstSemantic(key);
    }

    /**
     * Получить список всех семантик
     * @method getSemantics
     * @return {FeatureSemanticItem[]} Массив семантик объекта
     */
    getSemantics(): FeatureSemanticItem[] {
        return this.mapObjectSemantics.getSemantics();
    }

    /**
     * Получить список семантик с учётом фильтра
     * @method getSemanticsFiltered
     * @return {FeatureSemanticItem[]} Массив семантик объекта
     */
    getSemanticsFiltered(): FeatureSemanticItem[] {
        const semanticList = this.getSemantics();
        const filterExist = this.vectorLayer && this.vectorLayer.options.semanticfilter && this.vectorLayer.options.semanticfilter.length > 0;

        const semanticListResult: FeatureSemanticItem[] = [];
        semanticList.forEach(item => {
            if (!filterExist || this.vectorLayer.options.semanticfilter.includes(item.key)) {
                semanticListResult.push(item);
            }
        });

        return semanticListResult;
    }

    /**
     * Получить список повторяющихся семантик по ключу
     * @method getRepeatableSemantics
     * @param key {string} Ключ семантики
     * @return {FeatureSemanticItem[]} Массив повторяющихся семантик объекта с указанным ключом
     */
    getRepeatableSemantics(key: string): FeatureSemanticItem[] {
        return this.mapObjectSemantics.getRepeatableSemantics(key);
    }

    /**
     * Получить значение семантики с указанным ключом
     * @method getSemanticValue
     * @param key {string} Ключ семантики
     * @return {string|undefined} Значение семантики объекта с указанным ключом
     */
    getSemanticValue(key: string): string | undefined {
        return this.mapObjectSemantics.getUniqueSemanticValue(key);
    }

    /**
     * Получить список значений повторяющихся семантик с указанным ключом
     * @method getRepeatableSemanticValues
     * @param key {string} Ключ семантики
     * @return {string|undefined} Массив значений повторяющихся семантик объекта с указанным ключом
     */
    getRepeatableSemanticValues(key: string): string[] {
        return this.mapObjectSemantics.getRepeatableSemanticValues(key);
    }

    getServiceImageSemantics(): FeatureSemanticItem[] {
        return this.mapObjectSemantics.getRepeatableSemanticsByCode('32768');
    }

    /**
     * Получить список ключей семантик
     * @method getSemanticUniqKeys
     * @return {string[]} Массив ключей семантик
     */
    getSemanticUniqKeys(): string[] {
        return this.mapObjectSemantics.getSemanticUniqKeys();
    }

    /**
     * Удалить семантику по ключу
     * @method removeSemantic
     * @param key {string} Ключ семантики
     */
    removeSemantic(key: string): void {
        this.mapObjectSemantics.removeUniqueSemantic(key);
    }

    /**
     * Удалить повторяющуюся семантику по ключу и индексу
     * @method removeRepeatableSemantic
     * @param key {string} Ключ семантики
     * @param index {number} Индекс семантики в массиве повторяющихся семантик с указанным ключом
     */
    removeRepeatableSemantic(key: string, index: number): void {
        this.mapObjectSemantics.removeRepeatableSemantic(key, index);
    }

    /**
     * Удалить семантику по ключу и значению
     * @method removeExactSemantic
     * @param key {string} Ключ семантики
     * @param value {number} Значение семантики
     */
    removeExactSemantic(key: string, value: string): void {
        this.mapObjectSemantics.removeExactSemantic(key, value);
    }

    /**
     * Удалить все семантики
     * @method removeAllSemantics
     */
    removeAllSemantics(): void {
        this.mapObjectSemantics.clear();
        this.isDirty = true;
    }

    /**
     * Получить точку
     * @method getPoint
     * @param selector {PointSelector} Селектор точки
     * @return {MapPoint} Точка
     */
    getPoint(selector: PointSelector): MapPoint | undefined {
        return this.geometry.getPoint(selector);
    }

    /**
     * Получить все точки в виде одномерного массива
     * @method getPointList
     * @return {MapPoint[]} Массив точек
     */
    getPointList(): MapPoint[] {
        return this.geometry.getPointList();
    }

    /**
     * Получить количество точек геометрии
     * @method getPointCount
     * @return {number} Количество точек
     */
    getPointCount(): number {
        return this.geometry.getPointCount();
    }

    /**
     * Флаг наличия загруженной метрики
     * @method hasGeometry
     * @return {boolean}
     */
    hasGeometry(): boolean {
        return this.type !== MapObjectType.Undefined;
    }

    /**
     * Флаг наличия точек в метрике
     * @method hasPoints
     * @return {boolean}
     */
    hasPoints(): boolean {
        return this.geometry.hasPoints();
    }

    /**
     * Получить координаты для рисования
     * @method getPointListForDrawing
     * @return {Vector2or3[][]|Vector2or3[][][]} Массив координат в метрах
     */
    getPointListForDrawing(): Vector2or3[] | Vector2or3[][] {
        return this.geometry.getPointListForDrawing();
    }

    /**
     * Добавить точку
     * @method addPoint
     * @param mapPoint {MapPoint} Точка
     * @param selector {PointSelector} Селектор точки
     */
    addPoint(mapPoint: MapPoint, selector?: PointSelector): void {
        this.geometry.addPoint(mapPoint, selector);
        this.isDirty = true;
        this.bounds = undefined;
    }

    /**
     * Добавить точку в градусах
     * @method addGeoPoint
     * @param geoPoint {GeoPoint} Точка в градусах
     * @param selector {PointSelector} Селектор точки
     */
    addGeoPoint(geoPoint: GeoPoint, selector?: PointSelector): void {
        const mapPoint = geoPoint.toMapPoint();
        if (mapPoint) {
            this.addPoint(mapPoint, selector);
        }
    }


    /**
     * Добавить точку в пикселах
     * @method addPixelPoint
     * @param point {PixelPoint} Точка в пикселах
     * @param selector {PointSelector} Селектор точки
     */
    addPixelPoint(point: PixelPoint, selector?: PointSelector): void {
        const mapPoint = this.vectorLayer.map.pixelToPlane(point);
        this.addPoint(mapPoint, selector);
    }

    /**
     * Обновить точку в пикселах
     * @method updatePixelPoint
     * @param point {PixelPoint} Точка в пикселах
     * @param selector {PointSelector} Селектор точки
     */
    updatePixelPoint(point: PixelPoint, selector: PointInfo): void {
        const mapPoint = this.vectorLayer.map.pixelToPlane(point) as MapPoint;
        this.updatePoint(mapPoint, selector);
    }

    /**
     * Обновить точку
     * @method updatePoint
     * @param mapPoint {MapPoint} Точка
     * @param selector {PointSelector} Селектор точки
     */
    updatePoint(mapPoint: MapPoint, selector: PointSelector): void {
        this.geometry.updatePoint(mapPoint, selector);
        this.isDirty = true;
        this.bounds = undefined;
    }

    /**
     * Удалить точку
     * @method removePoint
     * @param selector {PointSelector} Селектор точки
     */
    removePoint(selector: PointSelector): void {
        this.geometry.removePoint(selector);
        this.isDirty = true;
        this.bounds = undefined;
    }

    /**
     * Удалить крайнюю точку метрики
     * @method removeLastPoint
     */
    removeLastPoint(): void {
        this.geometry.removeLastPoint();
        this.isDirty = true;
        this.bounds = undefined;
    }

    /**
     * Удалить все точки
     * @method removeAllPoints
     */
    removeAllPoints(): void {
        if (this.geometry.hasPoints()) {
            this.geometry.clear();
            this.isDirty = true;
            this.bounds = undefined;
        }
    }

    /**
     * Замкнуть метрику объекта
     * @method closeObject
     * @return {boolean} Флаг изменения метрики
     */
    closeObject(): boolean {
        this.bounds = undefined;
        const result = this.geometry.closeObject();
        this.isDirty = result || this.isDirty;
        return result;
    }

    /**
     * Получить границы объекта
     * @method getBounds
     * @return {Bounds} Границы объекта
     */
    getBounds(): Bounds {
        return this.bounds || this.geometry.getBounds();
    }

    /**
     * Получить центр объекта
     * @method getCenter
     * @return {MapPoint} Центр объекта
     */
    getCenter(): MapPoint {
        return this.getBounds().getCenter();
    }

    /**
     * Задать параметр Bbox для объекта
     * @method setBBox
     * @param value{Bbox}
     */
    setBBox(value: Bbox) {
        this.bounds = new Bounds(new MapPoint(0, 0, 0, this.vectorLayer.map.ProjectionId));
        this.bounds.fromBBox(value, this.vectorLayer.projectionId, this.vectorLayer.map.ProjectionId);
        this.isDirty = true;
    }

    /**
     * Повернуть объект
     * @method rotate
     * @param angleValue {number} Угол поворота
     * @param [center] {MapPoint} Центр поворота
     */
    rotate(angleValue: number, center?: MapPoint): void {
        this.geometry.rotate(angleValue, center);
        this.bounds = undefined;
        this.isDirty = true;
    }

    /**
     * Масштабирование объекта
     * @method scale
     * @param scale {Vector2D} Коэффициенты масштабирования по осям
     * @param [center] {MapPoint} Центр масштабирования
     */
    scale(scale: Vector2D, center?: MapPoint): void {
        this.geometry.scale(scale, center);
        this.bounds = undefined;
        this.isDirty = true;
    }

    /**
     * Масштабирование объекта по осям
     * @method scaleByAxis
     * @param scale {Vector2D} Коэффициенты масштабирования по осям
     * @param [center] {MapPoint} Центр масштабирования
     * @param [axis] {{x: Vector2D; y: Vector2D;}} Оси масштабирования
     */
    scaleByAxis(scale: Vector2D, center?: MapPoint, axis?: any): void {
        this.geometry.scaleByAxis(scale, center, axis);
        this.bounds = undefined;
        this.isDirty = true;
    }

    /**
     * Переместить объект
     * @method move
     * @param move {object} Метры перемещения по осям
     */
    move(move: { deltaX: number; deltaY: number; }): void {
        this.geometry.move(move);
        this.bounds = undefined;
        this.isDirty = true;
    }

    /**
     * Получить описание для всплывающего окна
     * @async
     * @method getTooltip
     * @return {TooltipDescription | undefined} Описание для всплывающего окна
     */
    async getTooltip(): Promise<TooltipDescription | undefined> {
        let result: TooltipDescription | undefined = undefined;
        const template = this.vectorLayer.tooltipTemplate;
        if (template) {
            result = {};
            if (template.objectName) {
                result.objectName = this.objectName;
            }
            if (template.layerName) {
                result.layerName = this.vectorLayer.alias;
            }

            if (template.image && this.mapId) {
                try {
                    result.image = await this.vectorLayer.getLegendImageUrl(this);
                } catch (e) {
                    result.image = undefined;
                }
            }

            if (template.semanticKeys && template.semanticKeys.length > 0) {
                const mapObjectSemantics = this.getSemantics();
                const semantics = [];

                for (let i = 0; i < template.semanticKeys.length; i++) {
                    const key = template.semanticKeys[i];
                    const foundSemantic = mapObjectSemantics.find(item => item.key === key);
                    if (foundSemantic) {
                        semantics.push(foundSemantic);
                        this.vectorLayer.getClassifierSemanticValuesByKey(key);
                    }
                }

                if (semantics.length > 0) {
                    result.semantics = semantics;
                }
            }

        }
        return result;
    }

    /**
     * Сравнение объектов карты
     * @method equals
     * @param other {MapObject} Объект карты
     * @return {boolean} Если `true`, то объекты карты одинаковые
     */
    equals(other: MapObject): boolean {
        if (this.guid !== other.guid) {
            return false;
        }

        if (this.isDirty !== other.isDirty) {
            return false;
        }

        if (!this.mapObjectSemantics.equals(other.mapObjectSemantics)) {
            return false;
        }

        return this.geometry.equals(other.geometry);
    }

    /**
     * Получить копию объекта карты
     * @method copy
     * @return {MapObject} Копия объекта карты
     */
    copy(): MapObject {
        const result = new MapObject(this.vectorLayer, this.type);
        result.guid = this.guid;
        result.updateFrom(this);
        result.isDirty = this.isDirty;
        return result;
    }

    /**
     * Копировать объект на другой слой
     * @method copyTo
     * @param layer {VectorLayer} Векторный слой
     * @return {MapObject} Копия объекта карты
     */
    copyTo(layer: VectorLayer): MapObject {
        const result = new MapObject(layer, this.type);
        result.guid = this.guid;
        result.updateFrom(this);
        result.isDirty = true;
        return result;
    }

    /**
     * Обновить геометрию и семантики из другого объекта карты
     * @method updateFrom
     * @param other {MapObject} Объект карты
     * @param [preventGeometryUpdate] {boolean} Флаг предотвращения обновления геометрии
     */
    updateFrom(other: MapObject, preventGeometryUpdate?: boolean): void {

        this.isDirty = !this.equals(other);

        let key: keyof MapObjectMetadata;
        for (key in other.metaData) {
            if (key === 'sld' && preventGeometryUpdate) {
                continue;
            }
            Reflect.defineProperty(this.metaData, key, {
                value: other.metaData[key],
                configurable: true,
                enumerable: true,
                writable: true
            });
        }

        this.mapObjectSemantics.updateFrom(other.mapObjectSemantics);
        if (!preventGeometryUpdate) {
            this.updateGeometryFrom(other);
        }

        this.removed = other.removed;

        this.classifierSemantics = other.classifierSemantics;
        this.semanticOfObjectSemanticsList = other.semanticOfObjectSemanticsList.slice();
    }

    /**
     * Обновить геометрию из другого объекта карты
     * @method updateGeometryFrom
     * @param other {MapObject} Объект карты
     */
    updateGeometryFrom(other: MapObject): void {

        if(this.type===MapObjectType.Undefined) {
            this.metaData.type=other.type;
            this.geometry=MapObject.createGeometry(other.type);
            this.geometry.updateFrom(other.geometry);
            this.isDirty=true;
        } else if(this.type===other.type) {
            this.isDirty = !this.equals(other);
            this.geometry.updateFrom(other.geometry);
        }

        this.bounds = undefined;
    }

    /**
     * Получить количество подобъектов метрики объекта
     * @method getObjectSubObjectsCount
     */
    getObjectSubObjectsCount(): number {
        return this.geometry.getObjectSubObjectsCount();
    }

    /**
     * Получить количество контуров в полигоне
     * @method getObjectContoursCount
     * @param objectNumber {Number} Номер полигона
     */
    getObjectContoursCount(objectNumber: number): number {
        return this.geometry.getObjectContoursCount(objectNumber);
    }

    /**
     * Получить список координат из контура в полигоне
     * @method getContourPoints
     * @param objectNumber {number} номер полигона в массиве координат
     * @param contourNumber {number} номер контура в полигоне
     */
    getContourPoints(objectNumber: number, contourNumber: number): MapPoint[] {
        return this.geometry.getContourPoints(objectNumber, contourNumber);
    }

    /**
     * Получить количество точек контура в полигоне
     * @method getContourPointsCount
     * @param objectNumber {number} номер полигона в массиве координат
     * @param contourNumber {number} номер контура в полигоне
     * @return number
     */
    getContourPointsCount(objectNumber: number, contourNumber: number): number {
        return this.geometry.getContourPoints(objectNumber, contourNumber).length;
    }

    /**
     * Добавить новый подобъект в метрику объекта
     * @method addEmptySubObject
     */
    addEmptySubObject(): ObjectSelector {
        return this.geometry.addEmptySubObject();
    }

    /**
     * Добавить пустой контур в объект геометрии
     * @method addEmptyContour
     * @param objectNumber {ObjectSelector}
     */
    addEmptyContour(objectNumber: number): ContourSelector | undefined {
        return this.geometry.addEmptyContour(objectNumber);
    }

    /**
     * Удалить контур
     * @method removeContour
     * @param contourSelector
     */
    removeContour(contourSelector: ContourSelector) {
        this.geometry.removeContour(contourSelector);
    }

    /**
     * Удалить подобъект
     * @method removeSubObject
     * @param objectSelector {ObjectSelector} Номер подобъекта
     */
    removeSubObject(objectSelector: ObjectSelector) {
        this.geometry.removeObject(objectSelector);
    }

    /**
     * Изменение порядка точек контура
     * @method reverseContour
     * @param contourSelector {ContourSelector}
     */
    reverseContour(contourSelector: ContourSelector): void {
        this.geometry.reverseContour(contourSelector);
    }

    /**
     * Проверить нахождение точки внутри геометрии
     * @method checkHover
     * @param mapPoint {MapPoint} Точка
     * @param [delta] {number} Область захвата в метрах
     * @return {boolean} Флаг попадания в геометрию
     */
    checkHover(mapPoint: MapPoint, delta: number): HoverResult | undefined {
        let result: HoverResult | undefined;

        if (this.type === MapObjectType.Point || this.checkPointWithin(mapPoint)) {
            const nearestPoint = this.geometry.checkHover(mapPoint, delta);
            if (nearestPoint) {
                result = {...nearestPoint, mapObjectId: this.guid};
            }
        }
        return result;
    }

    /**
     * Поиск точки в пределах области захвата от указанной
     * @method findNearestPointWithinRange
     * @param mapPoint {MapPoint} Точка
     * @param delta {number} Область захвата в метрах
     * @return {PointInfo|undefined} Номер найденной точки
     */
    findNearestPointWithinRange(mapPoint: MapPoint, delta: number): PointInfo | undefined {
        return this.geometry.findNearestPointWithinRange(mapPoint, delta);
    }

    /**
     * Найти ближайшую точку к указанной (не только узловые)
     * @method findNearestInterpPoint
     * @param mapPoint {MapPoint} Точка поиска
     * @param [polygonNumber] {number} Номер полигона для поиска
     * @return {MapPoint|undefined} Точка
     */
    findNearestInterpPoint(mapPoint: MapPoint, polygonNumber = 0): NearestInterpolatedPointResult | undefined {
        return this.geometry.findNearestInterpolatedPoint(mapPoint, polygonNumber);
    }

    /**
     * Найти расстояние от начала объекта до точки
     * @method getDistanceFromStartToPoint
     * @param mapPoint {MapPoint} Точка
     * @param [delta] {number} Область захвата в метрах
     * @return {number|undefined} Расстояние
     */
    getDistanceFromStartToPoint(mapPoint: MapPoint, delta = this.deltaDefault): number | undefined {
        return this.geometry.getDistanceFromStartToPoint(mapPoint, delta);
    }

    /**
     * Найти точку по расстоянию от начала объекта
     * @method getPointFromStartByDistance
     * @param dist {number} Расстояние
     * @return {MapPoint|undefined} Точка
     */
    getPointFromStartByDistance(dist: number): MapPoint | undefined {
        return this.geometry.getPointFromStartByDistance(dist);
    }

    /**
     * Проверить нахождение точки в области узла геометрии
     * @method checkPointHover
     * @param mapPoint {MapPoint} Точка
     * @param [delta] {number} Область захвата в метрах
     * @return {PointInfo}  Описание точки
     */
    checkPointHover(mapPoint: MapPoint, delta: number): HoverResult | undefined {
        let result: HoverResult | undefined;
        const nearestPoint = this.geometry.checkPointHover(mapPoint, delta);
        if (nearestPoint) {
            result = {...nearestPoint, mapObjectId: this.guid, mapPoint: this.geometry.getPoint(nearestPoint)};
        }
        return result;
    }

    /**
     * Проверить нахождение точки в области контура геометрии
     * @method checkBorderHover
     * @param mapPoint {MapPoint} Точка
     * @param delta {number} Область захвата в метрах
     * @param [selector] {PointInfo} Селектор
     * @return {object} Ближайшая точка на контуре
     */
    checkBorderHover(mapPoint: MapPoint, delta: number, selector?: PointInfo): { mapPoint?: MapPoint } {
        return {mapPoint: this.geometry.checkBorderHover(mapPoint, delta, selector)};
    }

    /**
     * Проверить нахождение точки внутри границ объекта
     * @method checkPointWithin
     * @param mapPoint {MapPoint} Точка
     * @return {boolean} Флаг нахождения точки внутри границ объекта
     */
    checkPointWithin(mapPoint: MapPoint): boolean {
        const bounds = this.getBounds();

        return bounds.contains(mapPoint);
    }

    /**
     * Сохранить/обновить объект в слое
     * @async
     * @method commit
     */
    commit() {
        return this.vectorLayer.commitMapObject(this);
    }

    reload(params: { geometry?: boolean; properties?: boolean; } = {geometry: true, properties: true}): Promise<void> {
        return this.vectorLayer.reloadMapObject(this, params);
    }

    /**
     * Сохранить объект в слое в качестве нового
     * @method commitAsNew
     */
    commitAsNew() {
        const newObject = new MapObject(this.vectorLayer, this.type);
        newObject.updateFrom(this);
        return newObject.commit();
    }

    /**
     * Удалить объект из слоя (выставить метку удаления)
     * @method delete
     */
    delete() {
        this.removed = true;
        return this.commit();
    }

    /**
     * Запросить длину метрики объекта
     * @async
     * @method calcLength
     * @return {CalculateLengthResponse} Периметр и длины участков метрики
     */
    async calcLength(options?: GetAreaParams): Promise<CalculateLengthResponse> {
        let response: CalculateLengthResponse = {
            perimeter: 0,
            linesLength: []
        };
        if (this.getPointList().length === 0) {
            return response;
        }

        const result = await this.getAreaRequest(options);

        if (result && result.data && result.data.features.length > 0) {
            response = {
                perimeter: result.data.features[0].properties.perimeter || 0,
                linesLength: result.data.features[0].properties.LinesLength === undefined ? [] : result.data.features[0].properties.LinesLength
            };
        }
        return response;
    }

    /**
     * Запросить площадь метрики объекта
     * @async
     * @method calcArea
     * @return {number|undefined} Площадь объекта
     */
    async calcArea(): Promise<number | undefined> {
        if (this.getPointList().length === 0) {
            return;
        }

        const result = await this.getAreaRequest();

        if (result && result.data && result.data.features.length > 0) {
            return result.data.features[0].properties.area;
        }
    }

    /**
     * Запросить угол поворота в градусах
     * @async
     * @method calcAngle
     * @return {CalcAngleResultType | undefined} Азимуты первого и второго отрезка и угол между ними
     */
    async calcAngle(): Promise<CalcAngleResultType | undefined> {
        const pointList = this.getPointList();
        if (pointList.length < 3) {
            return;
        }

        let angle1 = 0, angle2 = 0;

        const result1 = await this.getAzimuthRequest(pointList[0], pointList[1]);

        if (result1 && result1.data) {
            const sideAzimuth = result1.data.restmethod.outparams.find(param => param.name === 'SIDEAZIMUTH');
            if (sideAzimuth) {
                angle1 = +sideAzimuth.value;
            }
        }

        const result2 = await this.getAzimuthRequest(pointList[2], pointList[1]);
        if (result2 && result2.data) {
            const sideAzimuth = result2.data.restmethod.outparams.find(param => param.name === 'SIDEAZIMUTH');
            if (sideAzimuth) {
                angle2 = +sideAzimuth.value;
            }
        }

        let resultAngle = 360 - (angle2 - angle1);

        if (resultAngle > 360) {
            resultAngle -= 360;
        }

        return {
            angle1,
            angle2,
            resultAngle
        };
    }

    /**
     * Составить транзакцию для отправки на сервис
     * @method getTransactionJson
     * @return {JSON} JSON-объект
     */
    getTransactionJson(transaction: TransactionType): TransactionFeature {
        const geoJSONFeature = this.toJSON();
        return {
            ...geoJSONFeature,
            transaction,
            id: this.gmlId
        };
    }

    /**
     * Запросить сшивку объектов
     * @async
     * @method mergeWith
     * @param mapObject {MapObject} Объект для сшивки
     */
    async mergeWith(mapObject: MapObject): Promise<FeatureType> {

        const service = RequestServices.retrieveOrCreate({
            url: this.vectorLayer.map.options.url
        }, ServiceType.REST);

        const IDLIST = this.gmlId + ',' + mapObject.gmlId;

        const result = await service.union({
            LAYER: this.vectorLayer.idLayer,
            IDLIST,
            OUTTYPE: OUTTYPE.JSON,
            OUTCRS: this.vectorLayer.map.getCrsString()
        });

        if (result.data && Array.isArray(result.data.features) && result.data.features.length > 0) {
            return {
                type: 'Feature',
                properties: this.toJSON().properties,
                geometry: result.data.features[0].geometry
            };
        } else {
            if (result.error) {
                this.vectorLayer.map.writeProtocolMessage({
                    text: typeof result.error === 'string' ?
                        result.error : JSON.stringify(result.error), type: LogEventType.Error
                });
            }
            throw new Error('Invalid data from server');
        }

        //             , "Precision": (this.mapeditorTask.options.topology.limit).toString()
    }

    private loadGeometryPromise?: Promise<boolean>;

    /**
     * Обновить метрику объекта с источника
     * @async
     * @method loadGeometry
     * @return {boolean} Флаг успешного обновления
     */
    loadGeometry(): Promise<boolean> {
        if (!this.loadGeometryPromise) {
            this.loadGeometryPromise = new Promise<boolean>((resolve, reject) => {
                this.vectorLayer.loadGeometry(this).then(() => {
                    resolve(true);
                }).catch((e) => reject(e));
            });
        }
        return this.loadGeometryPromise;
    }

    updateGeometryFromJSON(feature: FeatureType): void {
        if (this.type === MapObjectType.Undefined) {
            this.metaData.type = feature.geometry.type;
            this.geometry = MapObject.createGeometry(feature.geometry.type);
        }
        if (this.geometry) {
            this.geometry.fromJSON(feature.geometry, this.vectorLayer.projectionId, this.vectorLayer.map.ProjectionId);
            this.isDirty = true;
        }
    }

    /**
     * Удалить документ из семантик объекта
     * @async
     * @method removeDocument
     * @param path {string} Путь документа для удаления
     * @param [key] {string} Ключ семантики
     */
    async removeDocument(path: string, key?: string): Promise<void> {
        const semanticKeys = new Set<string>();

        this.vectorLayer.options.imageSemantics.forEach(item => semanticKeys.add(item));

        const result = this.getServiceImageSemantics();
        if (result[0] && result[0].key) {
            semanticKeys.add(result[0].key);
        }

        if (key !== undefined) {
            this.mapObjectSemantics.removeExactSemantic(key, path);
        } else {
            semanticKeys.forEach(item => {
                this.mapObjectSemantics.removeExactSemantic(item, path);
            });
        }

        try {
            await this.commit();
            this.vectorLayer.removeObjectImage(this.metaData.id, path);

            await this.reload();
            this.reloadImages();
        } catch (error) {
            throw Error(String(error));
        }
    }

    /**
     * Обновить изображения с источника
     * @method reloadImages
     * @param [limit] {number} Ограничение количества изображений
     */
    reloadImages(limit?: number): void {
        const imageFileExtensions = ['bmp', 'gif', 'jpeg', 'jpg', 'png'];

        const semanticKeys = new Set<string>();

        this.vectorLayer.options.imageSemantics.forEach(item => semanticKeys.add(item));

        const result = this.getServiceImageSemantics();
        if (result[0] && result[0].key) {
            semanticKeys.add(result[0].key);
        }

        const requests = this.requestDocument(Array.from(semanticKeys), imageFileExtensions, limit);
        if (requests && requests.length > 0) {
            requests.forEach((request) => {
                if (request) {
                    const objectImageItem = {src: '', path: request.documentPath};
                    this.vectorLayer.addObjectImage(this.gmlId, objectImageItem);
                    request.promise.then((result) => {
                        if (result.data) {
                            if (typeof result.data === 'string') {
                                objectImageItem.src = result.data;
                            } else {
                                const type = 'image/' + objectImageItem.path.slice(objectImageItem.path.lastIndexOf('.') + 1);
                                const blob = new Blob([result.data], {type});
                                objectImageItem.src = BrowserService.makeObjectURL(blob);
                            }

                            this.imageUrlPromiseResolve && this.imageUrlPromiseResolve(objectImageItem.src);
                        }
                    }).catch((e) => {
                        this.vectorLayer.map.writeProtocolMessage({text: e, type: LogEventType.Error});
                    });

                }
            });
        }
    }

    isImageSemantic(semanticKey: string, semanticValue: string): boolean {
        const imageFileExtensions = ['bmp', 'gif', 'jpeg', 'jpg', 'png'];

        const imageSemanticKeys = new Set<string>();

        this.vectorLayer.options.imageSemantics.forEach(item => imageSemanticKeys.add(item));

        const result = this.getServiceImageSemantics();
        if (result[0] && result[0].key) {
            imageSemanticKeys.add(result[0].key);
        }

        if (imageSemanticKeys.has(semanticKey)) {
            for (let i = 0; i < imageFileExtensions.length; i++) {
                if (semanticValue.includes(imageFileExtensions[i])) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Получить сериализуемый JSON объект (GeoJSON Feature)
     * @method toJSON
     * @return {FeatureType} Сериализуемый JSON объект (GeoJSON Feature)
     */
    toJSON(originProjection?: true): FeatureType {

        const projectionId = originProjection ? this.vectorLayer.projectionId : this.vectorLayer.map.ProjectionId;
        const geometry = this.geometry.toJSON(projectionId) || {type: MapObjectType.LineString, coordinates: []};

        const excludedKeys = ['objectNumber', 'sheetName', 'type'];

        if (!this.metaData.title) {
            excludedKeys.push('title');
        }

        const metaDataAsArray = Object.entries(this.metaData);

        const fromEntriesFiltered: SimpleJson = {};

        metaDataAsArray.forEach(([key, value]) => {
            if (!excludedKeys.includes(key)) {
                fromEntriesFiltered[key] = value as string;
            }
        });

        const properties = {...this.mapObjectSemantics.toJSON(), ...fromEntriesFiltered} as FeatureProperties;

        if (!Array.isArray(properties.semantics) || properties.semantics.length === 0) {
            delete properties.semantics;
        }

        if (properties.id === '' || properties.id === null) {
            delete properties.id;
        }

        const bbox = this.geometry.getOriginBounds(projectionId, this.bounds);

        return {
            type: 'Feature',
            bbox,
            geometry,
            properties
        };
    }

    /**
     * Забрать данные из JSON объекта (GeoJSON Feature)
     * @method fromJSON
     * @param json {FeatureType} JSON объект (GeoJSON Feature)
     */
    fromJSON(json: FeatureType): void {

        if (json.geometry.type) {
            this.updateGeometryFromJSON(json);
        }

        if (json.bbox) {
            this.setBBox(json.bbox);
        } else {
            this.bounds = new Bounds();
            this.bounds.fromBounds(this.geometry.getBounds());
        }

        this.mapObjectSemantics.clear();

        this.updateProperties(json.properties);

    }

    /**
     * Проверка нахождения точки в объекте карты
     * @private
     * @static
     * @method createGeometry
     * @param type {MapObjectType} Тип геометрии
     * @return {BaseMapObjectGeometry} Экземпляр геометрии объекта карты
     */
    private static createGeometry(type: MapObjectType): BaseMapObjectGeometry {
        switch (type) {
            case MapObjectType.MultiPolygon:
                return new MultiPolygonGeometry();
            case MapObjectType.Polygon:
                return new PolygonGeometry();
            case MapObjectType.MultiLineString:
                return new MultiLineGeometry();
            case MapObjectType.LineString:
                return new LineGeometry();
            case MapObjectType.MultiPoint:
                return new MultiPointGeometry();
            case MapObjectType.Point:
                return new PointGeometry();
            case MapObjectType.Undefined:
                return new UndefinedGeometry();
        }
    }

    /**
     * Создание объекта на векторном слое
     * @static
     * @method fromJSON
     * @param layer {VectorLayer} Векторный слой
     * @param jsonFeature {FeatureType} JSON объект (GeoJSON Feature)
     * @return {MapObject} Объект карты
     */
    static fromJSON(layer: VectorLayer, jsonFeature: FeatureType): MapObject {
        const mapObject = new MapObject(layer, jsonFeature.geometry.type);
        mapObject.fromJSON(jsonFeature);
        mapObject.metaData.mapid = layer.idLayer;
        return mapObject;
    }

    /**
     * Сортировка массива объектов по типу (чтобы проверка курсора начиналась с точечных (или наименьших по габаритам) объектам)
     * @method mapObjectsToCsv
     * @static
     * @property mapObjects {MapObject[]} Список объектов
     * @return {MapObject[]} Отсортированный список объектов
     */
    static sortMapObjectsByType(mapObjects: MapObject[] | Set<MapObject>): MapObject[] {

        const pointList: MapObject[] = [];
        const lineList: MapObject[] = [];
        const polygonList: MapObject[] = [];

        mapObjects.forEach((mapObject: MapObject) => {
            if (mapObject.type === MapObjectType.Point || mapObject.type === MapObjectType.MultiPoint) {
                pointList.push(mapObject);
            } else if (mapObject.type === MapObjectType.LineString || mapObject.type === MapObjectType.MultiLineString) {
                lineList.push(mapObject);
            } else {
                polygonList.push(mapObject);
            }
        });

        polygonList.sort((a, b) => {
            return a.getBounds().getRadius() - b.getBounds().getRadius();
        });

        const result: MapObject[] = [];
        pointList.forEach(mapObject => result.push(mapObject));
        lineList.forEach(mapObject => result.push(mapObject));
        polygonList.forEach(mapObject => result.push(mapObject));

        return result;
    }

    getEditFlag() {
        return true;
    }
}
