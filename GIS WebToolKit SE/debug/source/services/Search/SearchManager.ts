/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Класс управления поиском                     *
 *                                                                  *
 *******************************************************************/

import { GwtkMap } from '~/types/Types';
import GISWebServiceSEMapper, { StatisticList } from '~/services/Search/mappers/GISWebServiceSEMapper';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import Finder from '~/services/Search/Finder';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import RosreestrMapper from '~/services/Search/mappers/RosreestrMapper/RosreestrMapper';
import YandexMapper from '~/services/Search/mappers/YandexMapper';
import PanoramaAddressBaseMapper from '~/services/Search/mappers/PanoramaAddressBaseMapper';
import OsmMapper from '~/services/Search/mappers/OsmMapper';
import VectorLayer from '~/maplayers/VectorLayer';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';
import Utils from '~/services/Utils';
import MapObject from '~/mapobject/MapObject';
import {
    PROJECT_SETTINGS_SERVICE_URL,
    PROJECT_SETTINGS_OBJECT_SELECTION_SIGNATURES_SELECTION,
    PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS,
    SignaturesSelection,
    PROJECT_SETTINGS_SEARCH_FILTER_TYPE,
    PROJECT_SETTINGS_SEARCH_FILTER_SEMANTIC,
    PROJECT_SETTINGS_SEARCH_FILTER_DIRECTION
} from '~/utils/WorkspaceManager';
import Layer from '~/maplayers/Layer';
import { SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';
import { GwtkMapperResult } from '~/services/Search/mappers/GwtkMapper';
import PixelPoint from '~/geometry/PixelPoint';
import MultiServiceFinder from '~/services/Search/MultiServiceFinder';
import { Bounds } from '~/geometry/Bounds';
import { LogEventType } from '~/types/CommonTypes';
import { METRIC, SORTTYPE } from '~/services/RequestServices/common/enumerables';
import GwtkError from '~/utils/GwtkError';
import { AddressServiceType } from '~/types/Options';
import NspdMapper from './mappers/NspdMapper/NspdMapper';

/**
 * Тип поискового сервиса
 */
export enum SourceType {
    GISWebServiceSE,
    Osm,
    PanoramaAddressBase,
    Rosreestr,
    Yandex,
    Nspd
}

/**
 * Режим поиска
 */
export enum GISWebServiceSEMode {
    All,
    TextSearch,
    AreaSearch,
    StrictSearch,
    TooltipLayers
}

export const COMMON_VECTOR_LAYER_ID = Utils.generateGUID();

/**
 * Класс управления поиском
 * @class SearchManager
 */
export default class SearchManager {

    private activeFinder!: Finder;

    readonly mapObjects: MapObject[] = [];
    responseStatistic?: StatisticList;
    responseMapObjectCount: number = 0;

    private criteriaAggregatorOriginal!: CriteriaAggregator;

    constructor(private readonly map: GwtkMap, private readonly triggerEventFlag = false) {
        this.activateSource(SourceType.GISWebServiceSE);
        this.stopSearch = this.stopSearch.bind(this);
    }

    /**
     * Создать маппер для запросов
     * @param sourceType {SourceType} Тип источника
     * @param url {string} url сервиса
     * @param fullSearch {boolean} управление полнотой запроса
     * @private
     */
    private createMapper(sourceType: SourceType, url?: string, fullSearch?: boolean ) {
        let mapper;
        let vectorLayer: VectorLayer = new VectorLayer(this.map, {
            alias: 'Common layer',
            id: COMMON_VECTOR_LAYER_ID,
            url: url || this.map.workspaceManager.getValue(PROJECT_SETTINGS_SERVICE_URL)
        });
        let sourceUrl: string;
        const address = this.map.options.search_options?.address;
        switch (sourceType) {
            case SourceType.GISWebServiceSE:
                const serviceUrl = vectorLayer.url;
                const httpParams = RequestServices.createHttpParams(this.map, { url: serviceUrl });
                mapper = new GISWebServiceSEMapper(vectorLayer, RequestServices.retrieveOrCreate(httpParams, ServiceType.REST), this.map);
                break;
            case SourceType.Osm:
                sourceUrl = 'https://nominatim.openstreetmap.org/search';
                const osmSource = address?.sources.find(item => item.type === AddressServiceType.Osm);
                if (osmSource) {
                    sourceUrl = osmSource.url;
                }

                mapper = new OsmMapper(vectorLayer, RequestServices.retrieveOrCreate({
                    url: sourceUrl,
                    responseType: 'json'
                }, ServiceType.COMMON));
                break;
            case SourceType.PanoramaAddressBase:
                sourceUrl = 'https://address.gisserver.info/address/fias/address_fias.php';
                const panoramaSource = address?.sources.find(item => item.type === AddressServiceType.PanoramaAddressBase);
                if (panoramaSource) {
                    sourceUrl = panoramaSource.url;
                }
                mapper = new PanoramaAddressBaseMapper(vectorLayer, RequestServices.retrieveOrCreate({
                    url: sourceUrl,
                    responseType: 'json'
                }, ServiceType.COMMON));
                break;
            case SourceType.Rosreestr:

                sourceUrl = 'https://pkk.rosreestr.ru/api/features';
                const rosreestrParams = this.map.options.remoteServices?.find(item => item.type === 'Rosreestr');
                if (rosreestrParams) {
                    sourceUrl = rosreestrParams.url;
                }
                mapper = new RosreestrMapper(vectorLayer, RequestServices.retrieveOrCreate({
                    url: sourceUrl,
                    responseType: 'json'
                }, ServiceType.COMMON), fullSearch);
                break;
            case SourceType.Nspd:

                sourceUrl = 'https://nspd.gov.ru/api/geoportal/v2/search/geoportal';
                const nspdService = this.map.options.remoteServices?.find((item) => item.type === 'Rosreestr');
                if (nspdService) {
                    sourceUrl = nspdService.url;
                }

                mapper = new NspdMapper(vectorLayer, RequestServices.retrieveOrCreate({
                    url: sourceUrl,
                    responseType: 'json'
                }, ServiceType.COMMON));
                break;
            case SourceType.Yandex:

                let apikey = 'default';
                sourceUrl = 'https://geocode-maps.yandex.ru/1.x';
                const yandexParams = this.map.options.remoteServices?.find(item => item.type === 'Yandex');
                if (yandexParams) {
                    apikey = yandexParams.apikey;
                }
                const yandexSource = address?.sources.find(item => item.type === AddressServiceType.Yandex);
                if (yandexSource) {
                    sourceUrl = yandexSource.url;
                }

                mapper = new YandexMapper(vectorLayer, RequestServices.retrieveOrCreate({
                    url: sourceUrl,
                    responseType: 'json'
                }, ServiceType.COMMON), { apikey });
                break;
        }

        return mapper;
    }

    /**
     * Активировать поисковый сервис
     * @param sourceType {SourceType} Тип источника
     * @param mode {GISWebServiceSEMode} Режим поиска
     * @param allLayers {Layer[]} Слои для поиска
     * @param point
     * @param zoomViewCheck
     * @param fullSearch{boolean} управление полнотой запроса
     */
    activateSource(sourceType: SourceType, mode: GISWebServiceSEMode = GISWebServiceSEMode.All, allLayers?: Layer[], point?: PixelPoint, zoomViewCheck?: boolean, fullSearch: boolean = false) {
        this.stopSearch();
        let finderLayers;
        if (sourceType === SourceType.GISWebServiceSE) {
            finderLayers = [];

            if (!allLayers) {
                allLayers = this.map.tiles.getSelectableLayersArray(); // поиск только по видимым слоям
            }

            const serviceUrls: string[] = [];
            allLayers.forEach(layer => {
                if (!serviceUrls.includes(layer.serviceUrl)) {
                    serviceUrls.push(layer.serviceUrl);
                }
            });

            const mappers = [];

            for (let i = 0; i < serviceUrls.length; i++) {
                const serviceUrl = serviceUrls[i];

                switch (mode) {
                    case GISWebServiceSEMode.TextSearch:
                        for (let i = 0; i < allLayers.length; i++) {
                            const layer = allLayers[i];
                            if (layer.server === serviceUrl
                                && !(layer instanceof GWTK.graphicLayer)
                                && layer.isTextSearch
                            ) {
                                finderLayers.push(layer);
                            }
                        }
                        break;

                    case GISWebServiceSEMode.AreaSearch:
                        for (let i = 0; i < allLayers.length; i++) {
                            const layer = allLayers[i];
                            if (layer.server === serviceUrl && layer.areaSeek) {
                                finderLayers.push(layer);
                            }
                        }
                        break;
                    case GISWebServiceSEMode.StrictSearch:
                        for (let i = 0; i < allLayers.length; i++) {
                            const layer = allLayers[i];
                            if (layer.server === serviceUrl && layer.visible) {
                                finderLayers.push(layer);
                            }
                        }
                        break;

                    case GISWebServiceSEMode.TooltipLayers:
                        for (let i = 0; i < allLayers.length; i++) {
                            const layer = allLayers[i];
                            if (layer.server === serviceUrl && layer.options.tooltip && layer.checkViewZoom(this.map.getZoom())) {
                                finderLayers.push(layer);
                            }
                        }
                        break;

                    case GISWebServiceSEMode.All:
                    default:
                        for (let i = 0; i < allLayers.length; i++) {
                            const layer = allLayers[i];
                            if (layer.server === serviceUrl) {
                                finderLayers.push(layer);
                            }
                        }
                        break;
                }

                mappers.push(this.createMapper(sourceType, serviceUrl));
            }

            if (zoomViewCheck) {
                const zoom = this.map.getZoom();
                for (let i = 0; i < finderLayers.length; i++) {
                    const layer = finderLayers[i];
                    const minZoom = layer.options.minzoomview;
                    const maxZoom = layer.options.maxzoomview;
                    if (zoom > maxZoom || zoom < minZoom) {
                        finderLayers.splice(i, 1);
                        i--;
                    }
                }
            }

            const finder = new MultiServiceFinder(this.createMapper(sourceType), finderLayers);
            finder.addMappers(mappers, point);
            this.activeFinder = finder;
        } else {
            this.activeFinder = new Finder(this.createMapper(sourceType, undefined, fullSearch));
        }

        const textObjectSelection = this.map.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SELECTION_SIGNATURES_SELECTION);
        if (textObjectSelection !== SignaturesSelection.Always) {
            if (textObjectSelection === SignaturesSelection.Never || !this.map.textObjectSelection) {
                const criteriaAggregator = this.activeFinder.getCriteriaAggregatorCopy();
                const objectLocalSearchCriterion = criteriaAggregator.getObjectLocalSearchCriterion();
                objectLocalSearchCriterion.clearValue();
                objectLocalSearchCriterion.addValue('0', '1', '2', '4');
                this.activeFinder.updateCriteriaAggregator(criteriaAggregator);
            }
        }
        this.criteriaAggregatorOriginal = this.activeFinder.getCriteriaAggregatorCopy();
    }

    /**
     * Получить копию списка критериев поиска
     * @method getSearchCriteriaAggregatorCopy
     * @return {CriteriaAggregator}
     */
    getSearchCriteriaAggregatorCopy() {
        const aggregator = this.activeFinder.getCriteriaAggregatorCopy();
        const type = this.map.workspaceManager.getValue(PROJECT_SETTINGS_SEARCH_FILTER_TYPE);
        const semantic = this.map.workspaceManager.getValue(PROJECT_SETTINGS_SEARCH_FILTER_SEMANTIC);
        const direction = this.map.workspaceManager.getValue(PROJECT_SETTINGS_SEARCH_FILTER_DIRECTION);

        aggregator.getSortKey().setValue({ type, value: direction });
        if (type === SORTTYPE.SortBysemanticValue) {
            if (semantic) {
                aggregator.getSemSortKey().setValue(semantic);
            }
        } else {
            aggregator.getSemSortKey().setValue(undefined);
        }

        return aggregator;
    }

    /**
     * Получить копию списка критериев поиска для слоя
     * @method getLayerCriteriaAggregatorCopy
     * @param layerId {layerId} Идентификатор слоя
     * @return {CriteriaAggregator } Критерии поиска
     */
    getLayerCriteriaAggregatorCopy(layerId: string) {
        return this.activeFinder.getLayerCriteriaAggregatorCopy(layerId);
    }

    /**
     * Установить список критериев поиска для слоя
     * @method setLayerCriteriaAggregator
     * @param criteria {CriteriaAggregator} Критерий поиска
     * @return {CriteriaAggregator} Критерии поиска
     */
    setLayerCriteriaAggregator(criteria: CriteriaAggregator) {
        return this.activeFinder.setLayerCriteriaAggregator(criteria);
    }

    /**
     * Установить список критериев поиска
     * @method setSearchCriteriaAggregator
     * @param  criteriaAggregator {CriteriaAggregator} Список критериев поиска
     * @return {boolean} Флаг обновления состояния поиска
     */
    setSearchCriteriaAggregator(criteriaAggregator: CriteriaAggregator) {
        if (this.activeFinder.updateCriteriaAggregator(criteriaAggregator)) {
            this.mapObjects.splice(0);
            this.map.clearSelectedFeatures();
            return true;
        }
        return false;
    }

    /**
     * Обновить критерии поиска
     * @method updateSearchCriteriaAggregator
     * @param  criteriaAggregator {CriteriaAggregator} Список критериев поиска
     * @return {boolean} Флаг обновления состояния поиска
     */
    updateSearchCriteriaAggregator(criteriaAggregator: CriteriaAggregator) {
        if (this.activeFinder) {
            return this.activeFinder.updateCriteriaAggregator(criteriaAggregator);
        }
        return false;
    }

    /**
     * Установить стартовый индекс для поиска
     * @method setStartIndex
     * @param value {number} Индекс
     */
    setStartIndex(value: number) {
        this.activeFinder.setStartIndex(value);
    }

    /**
     * Очистить список критериев поиска
     * @method clearSearchCriteriaAggregator
     */
    clearSearchCriteriaAggregator() {
        this.activeFinder.updateCriteriaAggregator(this.criteriaAggregatorOriginal);
        this.mapObjects.splice(0);

        this.responseStatistic = undefined;
        this.responseMapObjectCount = 0;
    }

    /**
     * Выполнить поиск
     * @async
     * @method findNext
     */
    async findNext() {

        this.responseMapObjectCount = 0;

        let result: GwtkMapperResult | undefined;

        try {
            result = await this.activeFinder.searchNext();

            if (result) {
                if (result.mapObjects.length > 0) {
                    for (let i = 0; i < result.mapObjects.length; i++) {
                        const mapObject = result.mapObjects[i];
                        this.mapObjects.push(mapObject);
                    }
                    this.responseStatistic = result.statistic;
                    this.responseMapObjectCount = result.foundObjectCount;
                }
            }
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: this.map.translate('Search') + ': ' + gwtkError.message,
                type: LogEventType.Error
            });
        }

        if (this.triggerEventFlag) {
            window.setTimeout(() => {
                this.map.trigger({ type: 'featureinforefreshed', target: 'map', searchResults: true }); //TODO: для работы плагинов
                this.map.trigger({ type: 'searchcomplete', target: 'map' });
            }, 300);

        }

        return result;

    }


    /**
     * выполнить поиск в точке
     * @deprecated
     * @method findInPoint
     * @param point {Point} Координаты точки в пикселах
     * @param [mode] {GISWebServiceSEMode} Режим поиска
     */
    async findInPoint(point: PixelPoint, mode = GISWebServiceSEMode.All) {

        this.map.clearActiveObject();

        const radius = this.map.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS);

        const leftBottomPoint = point.clone();
        leftBottomPoint.x -= radius;
        leftBottomPoint.y += radius;
        const leftBottomPlanePoint = this.map.pixelToPlane(leftBottomPoint);

        const rightTopPoint = point.clone();
        rightTopPoint.x += radius;
        rightTopPoint.y -= radius;
        const rightTopPlanePoint = this.map.pixelToPlane(rightTopPoint);

        this.activateSource(SourceType.GISWebServiceSE, mode, undefined, point, true);

        this.clearSearchCriteriaAggregator();
        const criteriaAggregatorCopy = this.getSearchCriteriaAggregatorCopy();

        const bboxSearchCriterion = criteriaAggregatorCopy.getBboxSearchCriterion();
        bboxSearchCriterion.clearValue();
        const bounds = new Bounds(leftBottomPlanePoint, rightTopPlanePoint);
        bboxSearchCriterion.setValue(bounds);
        criteriaAggregatorCopy.setBboxSearchCriterion(bboxSearchCriterion);

        const findInPointSearchCriterion = criteriaAggregatorCopy.getFindInPointSearchCriterion();
        findInPointSearchCriterion.setValue('1');
        criteriaAggregatorCopy.setFindInPointSearchCriterion(findInPointSearchCriterion);

        // для вхождения в результаты поиска кластеризованных объектов необходимо подать текущий масштаб
        const scale = this.map.getZoomScale(this.map.getZoom());
        if (scale) {
            const objScaleCriterion = criteriaAggregatorCopy.getObjectScaleSearchCriterion();
            objScaleCriterion.setValue(scale);
            criteriaAggregatorCopy.setObjectScaleSearchCriterion(objScaleCriterion);
        }

        const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
        srsNameSearchCriterion.setValue(this.map.getCrsString());

        this.map.trigger({ type: 'updatecriteriaaggregator', target: 'map', item: criteriaAggregatorCopy });

        this.setSearchCriteriaAggregator(criteriaAggregatorCopy);

        const localResult: GwtkMapperResult = { mapObjects: [], foundObjectCount: 0 };
        // сначала выполним поиск по локальным слоям
        const geoJsonLayers = this.map.vectorLayers.filter(layer => (layer instanceof GeoJsonLayer && layer.visible)) as GeoJsonLayer[];
        geoJsonLayers.forEach((layer) => {
            const pointSupport = point.clone();
            const pointXY = this.map.pixelToPlane(pointSupport);

            //смещаем точку в пикселах для вычисления допуска в метрах
            pointSupport.x += radius;
            pointSupport.y += radius;
            const pointXYSupport = this.map.pixelToPlane(pointSupport);
            //допуск попадания в точку
            const delta = Math.max(Math.abs(pointXYSupport.x - pointXY.x), Math.abs(pointXYSupport.y - pointXY.y));
            const pixelPoint = this.map.pixelToPlane(point);

            const mapObjectsIterator = layer.getMapObjectsIterator();
            for (const mapObject of mapObjectsIterator) {
                if (mapObject.checkHover(pixelPoint, delta)) {
                    localResult.mapObjects.push(mapObject);
                    localResult.foundObjectCount++;
                }
            }

        });
        localResult.mapObjects.forEach(mapObject => this.mapObjects.push(mapObject));

        let result = await this.findNext();
        if (result) {
            result.foundObjectCount += localResult.foundObjectCount;
            //Дописываем объекты в конец (быстрее, чем сдвигать весь массив, закидывая объекты в начало)
            const mapObjects = result.mapObjects;

            result.mapObjects = localResult.mapObjects;
            for (const mapObject of mapObjects) {
                result.mapObjects.push(mapObject);
            }
        } else {
            result = localResult;
        }

        this.responseMapObjectCount = result.foundObjectCount;

        return result;
    }

    async findByIdList(layer: Layer, idList: string[],) {
        let layers=[layer];

        this.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.All, layers);
        this.clearSearchCriteriaAggregator();
        const criteriaAggregatorCopy = this.getSearchCriteriaAggregatorCopy();

        if (layer.idLayer) {
            const layerIdSearchCriterion = criteriaAggregatorCopy.getLayerIdSearchCriterion();
            layerIdSearchCriterion.setValue(layer.idLayer);
        }

        const idListSearchCriterion = criteriaAggregatorCopy.getIdListSearchCriterion();
        for (const objectId of idList) {
            idListSearchCriterion.addValue(objectId);
        }

        const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
        srsNameSearchCriterion.setValue(this.map.ProjectionId);

        this.setSearchCriteriaAggregator(criteriaAggregatorCopy);

        const localResult: GwtkMapperResult = { mapObjects: [], foundObjectCount: 0 };
        // сначала выполним поиск по локальным слоям
        const geoJsonLayers = this.map.vectorLayers.filter(layer => (layer instanceof GeoJsonLayer && layer.visible)) as GeoJsonLayer[];
        for (let i = 0; i < geoJsonLayers.length; i++) {
            const geoJsonLayer = geoJsonLayers[i];
            if (layer.idLayer !== geoJsonLayer.idLayer) {
                continue;
            }
            const mapObjectsIterator = geoJsonLayer.getMapObjectsIterator();
            for (const mapObject of mapObjectsIterator) {
                if (idList.includes(mapObject.gmlId)) {
                    localResult.mapObjects.push(mapObject);
                    localResult.foundObjectCount++;
                }
            }
        }

        localResult.mapObjects.forEach(mapObject => this.mapObjects.push(mapObject));

        let result = await this.findNext();
        if (result) {
            result.foundObjectCount += localResult.foundObjectCount;
            //Дописываем объекты в конец (быстрее, чем сдвигать весь массив, закидывая объекты в начало)
            const mapObjects = result.mapObjects;

            result.mapObjects = localResult.mapObjects;
            for (const mapObject of mapObjects) {
                result.mapObjects.push(mapObject);
            }
        } else {
            result = localResult;
        }

        this.responseMapObjectCount = result.foundObjectCount;

        return result;
    }

    /**
     * Поиск по границам
     * @method findWithinBounds
     * @param  bounds {Bounds} Границы для поиска (координаты)
     * @param  mode {GISWebServiceSEMode} Режим поиска
     * @param  layers {Layer} Список слоев
     * @param  flags {{ withoutMetric?: boolean; noGraphicObjects?: boolean; }} Флаги поиска
     * @return {Promise<GwtkMapperResult | undefined>} Флаг обновления состояния поиска
     */
    async findWithinBounds(bounds: Bounds, mode = GISWebServiceSEMode.All, layers?: Layer[], flags?: { withoutMetric?: boolean; noGraphicObjects?: boolean; }) {

        this.activateSource(SourceType.GISWebServiceSE, mode, layers);

        this.clearSearchCriteriaAggregator();
        const criteriaAggregator = this.getSearchCriteriaAggregatorCopy();
        criteriaAggregator.getObjectLocalSearchCriterion().clearValue();
        criteriaAggregator.getObjectLocalSearchCriterion().addValue('0', '1', '2', '4');
        criteriaAggregator.getBboxSearchCriterion().clearValue();

        criteriaAggregator.getBboxSearchCriterion().setValue(bounds);

        criteriaAggregator.removeCriterion(SearchCriterionName.Count);
        criteriaAggregator.removeCriterion(SearchCriterionName.StartIndex);

        const srsNameSearchCriterion = criteriaAggregator.getSrsNameSearchCriterion();
        srsNameSearchCriterion.setValue(this.map.getCrsString());

        if (flags && flags.withoutMetric) {
            criteriaAggregator.getMetricCriterion().setValue(METRIC.RemoveMetric);
        } else {
            criteriaAggregator.getMetricCriterion().setValue(METRIC.AddMetric);
        }

        if (flags && flags.noGraphicObjects) {
            const graphObjectsCriterion = criteriaAggregator.getGetGraphObjectsCriterion();
            graphObjectsCriterion.setValue('0');
            criteriaAggregator.setGetGraphObjectsCriterion(graphObjectsCriterion);
        } else {
            criteriaAggregator.removeCriterion(SearchCriterionName.GetGraphObjects);
        }

        const scale = this.map.getZoomScale(this.map.getZoom());
        const scaleCriterion = criteriaAggregator.getObjectScaleSearchCriterion();
        scaleCriterion.setValue(scale);

        this.setSearchCriteriaAggregator(criteriaAggregator);

        // сначала выполним поиск по локальным слоям
        const geoJsonLayers = this.map.vectorLayers.filter(layer => (layer instanceof GeoJsonLayer && layer.visible)) as GeoJsonLayer[];
        geoJsonLayers.forEach(layer => {
            const mapObjectsIterator = layer.getMapObjectsIterator();
            for (const mapObject of mapObjectsIterator) {
                if (bounds.contains(mapObject.getBounds())) {
                    this.mapObjects.push(mapObject);
                }
            }
        });

        return this.findNext();
    }

    /**
     * Выполнить поиск всех объектов
     * @method findAllObjects
     * @param layers {Layer[]} Массив слоев для поиска
     * @param [loadAllFlag] {boolean} Флаг получения всех объектов 1 запросом
     */
    async findAllObjects(layers: Layer[], loadAllFlag: boolean = false,  flags?: { withoutMetric?: boolean; noGraphicObjects?: boolean; }) {

        const localResult: GwtkMapperResult = { mapObjects: [], foundObjectCount: 0 };
        // сначала выполним поиск по локальным слоям
        const geoJsonLayers = layers.filter(layer => (layer instanceof GeoJsonLayer)) as GeoJsonLayer[];
        geoJsonLayers.forEach(layer => {
            const mapObjectsIterator = layer.getMapObjectsIterator();
            for (const mapObject of mapObjectsIterator) {
                localResult.mapObjects.push(mapObject);
                localResult.foundObjectCount++;
            }
        });

        const serviceLayers = layers.filter(layer => !(layer instanceof GeoJsonLayer));

        let remoteResult;
        if (serviceLayers.length > 0) {
            this.clearSearchCriteriaAggregator();
            this.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.All, serviceLayers);

            const criteriaAggregator = this.getSearchCriteriaAggregatorCopy();

            criteriaAggregator.getObjectLocalSearchCriterion().clearValue();
            criteriaAggregator.getObjectLocalSearchCriterion().addValue('0', '1', '2', '4');

            criteriaAggregator.removeCriterion(SearchCriterionName.Bbox);

            const srsNameSearchCriterion = criteriaAggregator.getSrsNameSearchCriterion();
            srsNameSearchCriterion.setValue(this.map.getCrsString());

            if (loadAllFlag) {
                criteriaAggregator.removeCriterion(SearchCriterionName.Count);
                criteriaAggregator.removeCriterion(SearchCriterionName.StartIndex);
            }

            if (flags && flags.withoutMetric) {
                criteriaAggregator.getMetricCriterion().setValue(METRIC.RemoveMetric);
            } else {
                criteriaAggregator.getMetricCriterion().setValue(METRIC.AddMetric);
            }

            if (flags && flags.noGraphicObjects) {
                const graphObjectsCriterion = criteriaAggregator.getGetGraphObjectsCriterion();
                graphObjectsCriterion.setValue('0');
                criteriaAggregator.setGetGraphObjectsCriterion(graphObjectsCriterion);
            } else {
                criteriaAggregator.removeCriterion(SearchCriterionName.GetGraphObjects);
            }

            this.setSearchCriteriaAggregator(criteriaAggregator);

            remoteResult = await this.findNext();
        }

        if (remoteResult) {
            localResult.foundObjectCount += remoteResult.foundObjectCount;

            for (const mapObject of remoteResult.mapObjects) {
                localResult.mapObjects.push(mapObject);
            }
            localResult.statistic = remoteResult.statistic;
            localResult.dataFilePath = remoteResult.dataFilePath;
        }

        this.mapObjects.splice(0);
        localResult.mapObjects.forEach(mapObject => this.mapObjects.push(mapObject));
        this.responseMapObjectCount = localResult.foundObjectCount;

        return localResult;
    }

    /**
     * Остановить поиск
     * @method stopSearch
     */
    stopSearch() {
        this.activeFinder?.cancelSearch();
    }

    /**
     * Получить копию finder`а
     * @method getFinderCopy
     */
    getFinderCopy() {
        return this.activeFinder?.clone();
    }
}
