/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Маппер для GISWebService SE                    *
 *                                                                  *
 *******************************************************************/

import { GetFeatureParams } from '~/services/RequestServices/RestService/Types';
import { ServiceResponse } from '~/services/Utils/Types';
import GeoJSON, { FeatureProperties, FeatureSemanticItem, GeoJsonType } from '~/utils/GeoJSON';
import MapObject from '~/mapobject/MapObject';
import { SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';
import { SemanticCriterion, SemanticOperator } from '~/services/Search/criteria/SemanticSearchCriterion';
import CriteriaAggregator, { SemanticFilterCriterion } from '~/services/Search/CriteriaAggregator';
import RestService from '~/services/RequestServices/RestService/RestService';
import GwtkMapper from './GwtkMapper';
import RequestService from '~/services/RequestServices/common/RequestService';
import VectorLayer from '~/maplayers/VectorLayer';
import { GwtkMap } from '~/types/Types';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import { MapPoint } from '~/geometry/MapPoint';
import { LayerTextFilter, FilterCondition } from '~/types/LayerOptions';
import { METRIC, SORTTYPE } from '~/services/RequestServices/common/enumerables';
import { MeasureCriterion, MeasureCriterionType } from '~/services/Search/criteria/MeasureSearchCriterion';
import GwtkError from '~/utils/GwtkError';

export type StatisticList = {
    keys: StatisticKey[],
    layers: StatisticLayer[],
    local: StatisticLocal,
    semantics: StatisticSemantic[],
    typenames: StatisticType[],
}

export type StatisticType = {
    count: string,
    value: string,
    name: string,
};

export type StatisticKey = StatisticType & {
    locale: string,
    typename: string,
}

export type StatisticSemantic = StatisticType & {
    classifier?: string[];
}

export type StatisticLayer = {
    id: string,
    keys: StatisticKey[],
    local: StatisticLocal,
    semantics: StatisticSemantic[],
    typenames: StatisticType[]
}

export type StatisticLocal = {
    LineCount: string,
    PointCount: string,
    SquareCount: string,
    TextCount: string,
    VectorCount: string
}


/**
 * Класс поиска на сервисе GISWebServiceSE
 * @class GISWebServiceSEMapper
 * @extends GwtkMapper
 */
export default class GISWebServiceSEMapper extends GwtkMapper<GetFeatureParams[]> {

    /**
     * Активный запрос с возможностью отмены
     * @private
     * @property activeRequest {object|undefined}
     */
    private activeStatisticsRequest?: { abortXhr: () => void; promise: Promise<ServiceResponse<JSON>> };

    /**
     * @constructor GISWebServiceSEMapper
     * @param vectorLayer {VectorLayer} Слой для объектов
     * @param requestService {RestService} Сервис запросов
     * @param map {GwtkMap} Экземпляр карты
     */
    constructor(vectorLayer: VectorLayer, requestService: RestService, private readonly map: GwtkMap) {
        super(vectorLayer, requestService.getFeature.bind(requestService));
    }

    async search(criteriaAggregators: CriteriaAggregator[]) {

        const statisticResult = await this.getStatistic(criteriaAggregators);

        if (statisticResult.foundObjectCount === undefined) {
            return Promise.reject('Request has been cancelled');
        }

        const httpParams = RequestServices.createHttpParams(this.map, { url: this.vectorLayer.serviceUrl || this.vectorLayer.server || this.map.options.url });

        let postResult = await super.search(criteriaAggregators, httpParams);

        if (postResult.dataFilePath) {
            const restService = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
            const results = await restService.getFile<GeoJsonType | { restmethod: { outparams: { value: string; }[] } }>({ FILEPATH: postResult.dataFilePath }, {
                url: this.map.options.url
            });
            postResult = this.onDataLoaded(results);
        }

        postResult.statistic = statisticResult.statistic;
        postResult.foundObjectCount = statisticResult.foundObjectCount;

        return postResult;
    }

    cancelRequest() {
        this.activeStatisticsRequest?.abortXhr();
        super.cancelRequest();
    }

    private async getStatistic(criteriaAggregators: CriteriaAggregator[]) {
        const requestParams = this.prepareStatisticsRequestParams(criteriaAggregators) as GetFeatureParams[];

        const httpParams = RequestServices.createHttpParams(this.map, { url: this.vectorLayer.serviceUrl || this.vectorLayer.server || this.map.options.url });

        if (this.activeStatisticsRequest) {
            this.activeStatisticsRequest.abortXhr();
        }

        this.activeStatisticsRequest = RequestService.sendCancellableRequest(this.request, requestParams, httpParams);

        let statistic: StatisticList | undefined = undefined,
            foundObjectCount = undefined;

        try {
            const result = await this.activeStatisticsRequest.promise;
            if (!result.error && result.data) {
                statistic = (result.data as any).statistic;
                foundObjectCount = +(result.data as any).properties.numberMatched;

                if (statistic) {
                    const statisticSemantic: StatisticSemantic[] = [];
                    statistic.layers.forEach(layer => {
                        const vectorLayer = this.map.getVectorLayer(layer.id, this.vectorLayer.serviceUrl || this.vectorLayer.server || this.map.options.url);
                        const filterExist = vectorLayer && vectorLayer.options.semanticfilter && vectorLayer.options.semanticfilter.length > 0;

                        layer.semantics.forEach(semantic => {
                            if (!filterExist || (vectorLayer && vectorLayer.options.semanticfilter.includes(semantic.value))) {
                                statisticSemantic.push(semantic);
                            }
                        });
                    });

                    statistic.semantics.splice(0, statistic.semantics.length, ...statisticSemantic);
                }
            }
        } catch (error) {
            if (error) {
                const gwtkError = new GwtkError(error);
                const message = gwtkError.message;
                try {
                    const msg = JSON.parse(message);
                    if (msg.exceptionCode === 'InvalidResponseDataError' || msg.exceptionCode === 'ObjectsNotFound') {
                        foundObjectCount = 0;
                    }
                } catch (error) {
                    foundObjectCount = undefined;
                }
            }
        } finally {
            this.activeStatisticsRequest = undefined;
        }
        return {
            mapObjects: [],
            statistic,
            foundObjectCount
        };
    }

    protected prepareRequestParams(criteriaAggregators: CriteriaAggregator[]) {
        const requestParams = [];

        let commonKeyList, commonTextFilter;
        for (let i = 0; i < criteriaAggregators.length; i++) {
            const criteriaAggregator = criteriaAggregators[i];
            const LAYER = criteriaAggregator.getCriterionContent(SearchCriterionName.LayerId) || '';
            if (LAYER === '') {
                commonKeyList = criteriaAggregator.getCriterionContent(SearchCriterionName.KeyList);
                const commonTextFilterContent = criteriaAggregator.getSemanticSearchCriteriaContent();
                if (commonTextFilterContent) {
                    commonTextFilter = GISWebServiceSEMapper.createSemanticFilter(commonTextFilterContent).Filter.AND;
                }
                break;
            }

        }

        // параметры поиска для каждого слоя карты, где поиск выполняется
        for (let i = 0; i < criteriaAggregators.length; i++) {

            const criteriaAggregator = criteriaAggregators[i];

            const AREA = criteriaAggregator.getCriterionContent(SearchCriterionName.Area);

            const BBOX = criteriaAggregator.getCriterionContent(SearchCriterionName.Bbox)?.join(',');

            const CODELIST = criteriaAggregator.getCriterionContent(SearchCriterionName.CodeList)?.join(',');


            const numericCount = criteriaAggregator.getCriterionContent(SearchCriterionName.Count);
            const COUNT = (numericCount !== undefined) ? ('' + numericCount) : undefined;

            const GETFRAME = criteriaAggregator.getCriterionContent(SearchCriterionName.Frame);

            let KEYLIST = criteriaAggregator.getCriterionContent(SearchCriterionName.KeyList)?.join(',');

            const IDLIST = criteriaAggregator.getCriterionContent(SearchCriterionName.IdList)?.join(',');

            const LATLONG = criteriaAggregator.getCriterionContent(SearchCriterionName.LatLong);

            const LAYER = criteriaAggregator.getCriterionContent(SearchCriterionName.LayerId) || '';

            if (KEYLIST && LAYER !== '' && commonKeyList) {
                const keyListArray = KEYLIST?.split(',');
                const keyListArrayNew = [];
                for (let j = 0; j < commonKeyList.length; j++) {
                    if (keyListArray?.includes(commonKeyList[j])) {
                        keyListArrayNew.push(commonKeyList[j]);
                    }
                }
                if (keyListArrayNew.length === 0) {
                    continue;
                } else {
                    KEYLIST = keyListArrayNew.join(',');
                }
            }

            if (!this.checkLayer(LAYER)) {
                continue;
            }

            const OBJCENTER = criteriaAggregator.getCriterionContent(SearchCriterionName.ObjectCenter);


            const numericScale = criteriaAggregator.getCriterionContent(SearchCriterionName.ObjectScale);
            const OBJECTVIEWSCALE = (numericScale !== undefined) ? ('' + numericScale) : undefined;

            const numericGeometryScale = criteriaAggregator.getCriterionContent(SearchCriterionName.MultyLevelGeometry);
            const MULTYLEVELGEOMETRY = (numericGeometryScale !== undefined) ? ('' + numericGeometryScale) : undefined;

            const OBJLOCAL = criteriaAggregator.getCriterionContent(SearchCriterionName.ObjectLocal)?.join(',');

            const OUTTYPE = criteriaAggregator.getCriterionContent(SearchCriterionName.OutType);

            const SRSNAME = criteriaAggregator.getCriterionContent(SearchCriterionName.SrsName);
            const OUTCRS = criteriaAggregator.getCriterionContent(SearchCriterionName.SrsName);

            const numericStartIndex = criteriaAggregator.getCriterionContent(SearchCriterionName.StartIndex);
            const STARTINDEX = (numericStartIndex !== undefined) ? ('' + (numericStartIndex + 1)) : undefined;

            const numericGetGraphObject = criteriaAggregator.getCriterionContent(SearchCriterionName.GetGraphObjects);
            const GETGRAPHOBJECTS = (numericGetGraphObject !== undefined) ? numericGetGraphObject : undefined;

            let metric;
            if (LAYER === '') {
                const numericMetric = criteriaAggregator.getCriterionContent(SearchCriterionName.Metric);
                metric = (numericMetric !== undefined) ? numericMetric : METRIC.RemoveMetric;
            }

            let TEXTFILTER;
            const semanticsCriteriaContent = criteriaAggregator.getSemanticSearchCriteriaContent();

            if (semanticsCriteriaContent) {
                TEXTFILTER = GISWebServiceSEMapper.createSemanticFilter(semanticsCriteriaContent, commonTextFilter);
            }

            const TYPENAMES = criteriaAggregator.getCriterionContent(SearchCriterionName.TypeNames)?.join(',');

            const SEMLIST = criteriaAggregator.getCriterionContent(SearchCriterionName.SemList)?.join(',');

            let CROSSMETHOD = criteriaAggregator.getCriterionContent(SearchCriterionName.CrossMethod);

            let FILEDATA;
            let fileDataContent = criteriaAggregator.getCriterionContent(SearchCriterionName.FileData);
            if (fileDataContent && CROSSMETHOD) {
                FILEDATA = fileDataContent;
            }

            let MEASUREFILTER;
            let measureCriterionContent = criteriaAggregator.getCriterionContent(SearchCriterionName.MeasureFilter);
            if (measureCriterionContent) {
                MEASUREFILTER = GISWebServiceSEMapper.createMeasureFilter(measureCriterionContent.measureCriterionList, measureCriterionContent.disjunction);
            }

            const FINDINPOINT = criteriaAggregator.getCriterionContent(SearchCriterionName.FindInPoint);

            // TODO: временно
            if (SEMLIST) {
                TEXTFILTER = undefined;
            }

            const SORTKEY = criteriaAggregator.getCriterionContent(SearchCriterionName.SortKey);
            let sortKey = SORTKEY?.type as string || 'FINDDIRECTION';
            let sortValue = SORTKEY?.value;
            let SEMSORTKEY = undefined;
            if (sortKey === SORTTYPE.SortBysemanticValue) {
                SEMSORTKEY = criteriaAggregator.getCriterionContent(SearchCriterionName.SemSortKey);
                if (!SEMSORTKEY) {
                    sortValue = undefined;
                    SEMSORTKEY = undefined;
                }
            }

            const STRINGFORSEARCHINRESULT = criteriaAggregator.getCriterionContent(SearchCriterionName.StringForSearchInResult);

            const rpclayer: GetFeatureParams = {
                AREA,
                BBOX,
                CODELIST,
                COUNT,
                GETFRAME,
                KEYLIST,
                IDLIST,
                LATLONG,
                LAYER,
                OBJCENTER,
                OBJECTVIEWSCALE,
                MULTYLEVELGEOMETRY,
                OBJLOCAL,
                OUTTYPE,
                SRSNAME,
                STARTINDEX,
                TEXTFILTER,
                TYPENAMES,
                CROSSMETHOD,
                FINDINPOINT,
                FILEDATA,
                OUTCRS,
                GETGRAPHOBJECTS,
                METRIC: metric,
                MEASUREFILTER,
                SEMLIST,
                [sortKey]: sortValue,
                SEMSORTKEY,
                STRINGFORSEARCHINRESULT
            };

            requestParams.push(rpclayer);
        }

        if (requestParams.length === 1) {
            return [];
        }
        return requestParams;
    }

    protected onDataLoaded(results: ServiceResponse<GeoJsonType | { restmethod: { outparams: { value: string; }[] } }>) {
        const mapObjects = [];
        let dataFilePath;
        let foundObjectCount = 0;
        if (!results.error && results.data) {

            // const data = {
            //     restmethod: {
            //         outparams: [{
            //             name: 'FILE',
            //             value: 'USERFOLDER/UserData/temp19182262600c7bc3e447f0000.xml',
            //             type: 'string'
            //         }]
            //     }
            // };

            if (Reflect.has(results.data, 'restmethod')) {
                dataFilePath = (results.data as { restmethod: { outparams: { value: string; }[] } }).restmethod.outparams[0].value;
            } else {
                const geoJSON = new GeoJSON(results.data as GeoJsonType);
                const featureCollection = geoJSON.featureCollection;
                if (featureCollection.properties) {
                    foundObjectCount = +featureCollection.properties.numberMatched;
                }

                const projectionId = this.vectorLayer.map.ProjectionId;//TODO: есть шанс, что пока запрашивали - поменялась проекция у карты
                for (let i = 0, feature; (feature = featureCollection.getFeature(i)); i++) {
                    const geometry = feature.getGeometry();
                    const vectorLayer = this.map.getVectorLayer('' + feature.properties.mapid) || this.vectorLayer;
                    const mapObject = new MapObject(vectorLayer, geometry.type, feature.properties as FeatureProperties);
                    if (feature.properties.semantics) {
                        mapObject.addSemanticList(feature.properties.semantics as FeatureSemanticItem[]);
                    }

                    const objects = geometry.getMultiPolygonCoordinates();
                    objects.forEach((contours, objectNumber) => {
                        contours.forEach((coordinates, contourNumber) => {
                            coordinates.forEach(coord => {
                                const mapPoint = MapPoint.fromOriginArray(coord, projectionId);
                                mapObject.addPoint(mapPoint, { objectNumber, contourNumber });
                            });
                        });
                    });

                    if (feature.bbox) {
                        mapObject.setBBox(feature.bbox);
                    }

                    mapObjects.push(mapObject);

                }
            }
        }

        return { mapObjects, foundObjectCount, dataFilePath };
    }


    private checkLayer(layerId: string) {

        let result = true;
        if (layerId && this.map.strictEditorMode) {
            const layer = this.map.getLayer(layerId);
            if (layer) {
                result = layer.isEditable;
            } else {
                result = false;
            }
        }

        return result;
    }

    /**
     * Подготовить строку фильтра по семантикам
     * @private
     * @static
     * @method createSemanticFilter
     * @param semanticCriterion { SemanticFilterCriterion[]} Массив фильтров по семантике
     * @param commonTextFilter { LayerTextFilter['Filter']['AND']} Массив общих фильтров
     * @return {LayerTextFilter} Фильтр по семантикам
     */
    private static createSemanticFilter(semanticCriterion: SemanticFilterCriterion[], commonTextFilter:LayerTextFilter['Filter']['AND']=[]) {
        const result: LayerTextFilter = { Filter: { AND: [...commonTextFilter] } };
        for (let i = 0; i < semanticCriterion.length; i++) {
            const semanticCriteria = semanticCriterion[i].semanticCriteria;
            const disjunction = semanticCriterion[i].disjunction;
            const index = semanticCriteria.filter((x) => x.value !== '');
            if (index.length === 0) {
                return result;
            }

            let conditionRules: FilterCondition[] = [];

            if (disjunction) {
                result.Filter.AND.push({ OR: conditionRules });
            } else {
                result.Filter.AND.push({ AND: conditionRules });
            }

            for (let semanticCriterionIndex = 0; semanticCriterionIndex < semanticCriteria.length; semanticCriterionIndex++) {
                const semanticCriterionRule = semanticCriteria[semanticCriterionIndex];
                if (semanticCriterionRule.key == undefined) {
                    result.Filter.AND.pop();
                    return result;
                }
                switch (semanticCriterionRule.operator) {
                    case SemanticOperator.ContainsValue:

                        const PropertyIsLike = [];
                        const Literal = semanticCriterionRule.value === '*' ? '*' : semanticCriterionRule.value;
                        PropertyIsLike.push({
                            PropertyName: semanticCriterionRule.key,
                            Literal
                        });
                        conditionRules.push({ PropertyIsLike });

                        break;

                    case SemanticOperator.InList:
                        const PropertyIsEqualTo = [];

                        for (let valueIndex_R = 0; valueIndex_R < semanticCriterionRule.value.length; valueIndex_R++) {
                            PropertyIsEqualTo.push({
                                PropertyName: semanticCriterionRule.key,
                                Literal: semanticCriterionRule.value[valueIndex_R]
                            });
                        }

                        conditionRules.push({ PropertyIsEqualTo });
                        break;

                    case SemanticOperator.InRange:
                        if (semanticCriterionRule.value[0] !== undefined) {
                            const PropertyIsGreaterThanOrEqualTo = [];

                            PropertyIsGreaterThanOrEqualTo.push({
                                PropertyName: semanticCriterionRule.key,
                                Literal: '' + semanticCriterionRule.value[0]
                            });

                            conditionRules.push({ PropertyIsGreaterThanOrEqualTo });
                        }

                        if (semanticCriterionRule.value[1] !== undefined) {
                            const PropertyIsLessThanOrEqualTo = [];

                            PropertyIsLessThanOrEqualTo.push({
                                PropertyName: semanticCriterionRule.key,
                                Literal: '' + semanticCriterionRule.value[1]
                            });

                            conditionRules.push({ PropertyIsLessThanOrEqualTo });
                        }
                        break;
                }
            }
        }
        return result;
    }

    private static createMeasureFilter(measureCriteria: MeasureCriterion[], disjunction: boolean) {
        let operand = '(OR)';
        if (!disjunction) {
            operand = '(AND)';
        }

        const measures: string[] = [];
        for (const criterion of measureCriteria) {
            let expression = '';
            if (criterion.type == MeasureCriterionType.Range) {
                let data = [criterion.operator[0] + criterion.value[0]];
                data.push(criterion.operator[1] + criterion.value[1]);
                expression = data.join(',');
            } else {
                expression = criterion.operator + criterion.value;
            }
            measures.push('(' + criterion.name + expression + ')');
        }
        const measureList = measures.join(',');
        return `(${measureList}${operand})`;
    }

    /**
     * Подготовить параметры запроса статистики
     * @private
     * @static
     * @method prepareStatisticsRequestParams
     * @param criteriaAggregators { CriteriaAggregator[]} Массив аггрегаторов критериев
     * @return {object} Параметры запроса
     */
    private prepareStatisticsRequestParams(criteriaAggregators: CriteriaAggregator[]) {
        const requestParams = [];
        let text: string | undefined = undefined;

        let commonKeyList, commonTextFilter;
        for (let i = 0; i < criteriaAggregators.length; i++) {
            const criteriaAggregator = criteriaAggregators[i];
            const LAYER = criteriaAggregator.getCriterionContent(SearchCriterionName.LayerId) || '';
            if (LAYER === '') {
                commonKeyList = criteriaAggregator.getCriterionContent(SearchCriterionName.KeyList);
                const commonTextFilterContent = criteriaAggregator.getSemanticSearchCriteriaContent();
                if (commonTextFilterContent) {
                    commonTextFilter = GISWebServiceSEMapper.createSemanticFilter(commonTextFilterContent).Filter.AND;
                }
                break;
            }
        }

        // параметры поиска для каждого слоя карты, где поиск выполняется
        for (let i = 0; i < criteriaAggregators.length; i++) {

            const criteriaAggregator = criteriaAggregators[i];

            const BBOX = criteriaAggregator.getCriterionContent(SearchCriterionName.Bbox)?.join(',');

            const CODELIST = criteriaAggregator.getCriterionContent(SearchCriterionName.CodeList)?.join(',');

            let KEYLIST = criteriaAggregator.getCriterionContent(SearchCriterionName.KeyList)?.join(',');

            const IDLIST = criteriaAggregator.getCriterionContent(SearchCriterionName.IdList)?.join(',');

            const LATLONG = criteriaAggregator.getCriterionContent(SearchCriterionName.LatLong);

            const LAYER = criteriaAggregator.getCriterionContent(SearchCriterionName.LayerId) || '';


            if (!this.checkLayer(LAYER)) {
                continue;
            }

            if (KEYLIST && LAYER !== '' && commonKeyList) {
                const keyListArray = KEYLIST?.split(',');
                const keyListArrayNew = [];
                for (let j = 0; j < commonKeyList.length; j++) {
                    if (keyListArray?.includes(commonKeyList[j])) {
                        keyListArrayNew.push(commonKeyList[j]);
                    }
                }
                if (keyListArrayNew.length === 0) {
                    continue;
                } else {
                    KEYLIST = keyListArrayNew.join(',');
                }
            }

            const numericScale = criteriaAggregator.getCriterionContent(SearchCriterionName.ObjectScale);
            const OBJECTVIEWSCALE = (numericScale !== undefined) ? ('' + numericScale) : undefined;

            const numericGeometryScale = criteriaAggregator.getCriterionContent(SearchCriterionName.MultyLevelGeometry);
            const MULTYLEVELGEOMETRY = (numericGeometryScale !== undefined) ? ('' + numericGeometryScale) : undefined;

            const numericGetGraphObject = criteriaAggregator.getCriterionContent(SearchCriterionName.GetGraphObjects);
            const GETGRAPHOBJECTS = (numericGetGraphObject !== undefined) ? numericGetGraphObject : undefined;

            const OBJLOCAL = criteriaAggregator.getCriterionContent(SearchCriterionName.ObjectLocal)?.join(',');

            const OUTTYPE = criteriaAggregator.getCriterionContent(SearchCriterionName.OutType);

            const SRSNAME = criteriaAggregator.getCriterionContent(SearchCriterionName.SrsName);
            const OUTCRS = criteriaAggregator.getCriterionContent(SearchCriterionName.SrsName);

            let TEXTFILTER;
            let textCriterionContent = criteriaAggregator.getCriterionContent(SearchCriterionName.Text);

            if (textCriterionContent) {
                if (LAYER === '') {
                    text = textCriterionContent.semanticCriterionList[0]?.value as string;
                }

                if (text) {
                    for (let j = 0; j < textCriterionContent.semanticCriterionList.length; j++) {
                        textCriterionContent.semanticCriterionList[j].value = text;
                    }
                }
            }

            const semanticsCriterionContent = criteriaAggregator.getCriterionContent(SearchCriterionName.Semantic);

            let allSemanticsCriterionContent: SemanticCriterion[] = [];
            if (textCriterionContent) {
                allSemanticsCriterionContent = [...allSemanticsCriterionContent, ...textCriterionContent.semanticCriterionList];
            }

            if (semanticsCriterionContent) {
                allSemanticsCriterionContent = [...allSemanticsCriterionContent, ...semanticsCriterionContent.semanticCriterionList];
            }

            const semanticsCriteriaContent = criteriaAggregator.getSemanticSearchCriteriaContent();
            if (semanticsCriteriaContent) {
                TEXTFILTER = GISWebServiceSEMapper.createSemanticFilter(semanticsCriteriaContent, commonTextFilter);
            }

            const FINDINPOINT = criteriaAggregator.getCriterionContent(SearchCriterionName.FindInPoint);

            const TYPENAMES = criteriaAggregator.getCriterionContent(SearchCriterionName.TypeNames)?.join(',');

            const SEMLIST = criteriaAggregator.getCriterionContent(SearchCriterionName.SemList)?.join(',');

            let CROSSMETHOD = criteriaAggregator.getCriterionContent(SearchCriterionName.CrossMethod);

            let FILEDATA;
            let fileDataContent = criteriaAggregator.getCriterionContent(SearchCriterionName.FileData);
            if (fileDataContent && CROSSMETHOD) {
                FILEDATA = fileDataContent;
            }

            let MEASUREFILTER;
            let measureCriterionContent = criteriaAggregator.getCriterionContent(SearchCriterionName.MeasureFilter);
            if (measureCriterionContent) {
                MEASUREFILTER = GISWebServiceSEMapper.createMeasureFilter(measureCriterionContent.measureCriterionList, measureCriterionContent.disjunction);
            }

            // TODO: временно
            if (SEMLIST) {
                TEXTFILTER = undefined;
            }


            const STRINGFORSEARCHINRESULT = criteriaAggregator.getCriterionContent(SearchCriterionName.StringForSearchInResult);

            const rpclayer: GetFeatureParams = {
                BBOX,
                CODELIST,
                KEYLIST,
                IDLIST,
                LATLONG,
                LAYER,
                OBJECTVIEWSCALE,
                MULTYLEVELGEOMETRY,
                OBJLOCAL,
                OUTTYPE,
                SRSNAME,
                TEXTFILTER,
                TYPENAMES,
                CROSSMETHOD,
                FINDINPOINT,
                FILEDATA,
                OUTCRS,
                GETGRAPHOBJECTS,
                MEASUREFILTER,
                SEMLIST,
                GETSTATISTICS: '1',
                STRINGFORSEARCHINRESULT
            };

            requestParams.push(rpclayer);
        }

        if (requestParams.length === 1) {
            return [];
        }
        return requestParams;
    }

    /**
     * Получить параметры текущего запроса
     * @method getRequestParams
     * @param criteriaAggregators { CriteriaAggregator[]} Массив аггрегаторов критериев
     * @return {Array} GetFeatureParams[] параметры запроса
     */
    getRequestParams(criteriaAggregators: CriteriaAggregator[]): GetFeatureParams[] {
        return this.prepareRequestParams(criteriaAggregators);
    }
}

