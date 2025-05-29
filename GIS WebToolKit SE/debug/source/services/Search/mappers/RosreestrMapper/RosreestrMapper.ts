/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Маппер для Rosreestr                         *
 *                                                                  *
 *******************************************************************/

import { ServiceResponse } from '~/services/Utils/Types';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import CommonService from '~/services/RequestServices/common/CommonService';
import { SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';
import GwtkMapper, { GwtkMapperResult } from '~/services/Search/mappers/GwtkMapper';
import VectorLayer from '~/maplayers/VectorLayer';
import {
    RosreestrInfoItems,
    RosreestrRequestParams,
    RosreestrSearchTextFeature
} from '~/services/Search/mappers/RosreestrMapper/Types';
import RosreestrSearcherBase from '~/services/Search/mappers/RosreestrMapper/Searchers/RosreestrSearcherBase';
import RosreestrCadnumberSearcher from '~/services/Search/mappers/RosreestrMapper/Searchers/RosreestrCadnumberSearcher';
import RosreestrCoordSearcher from '~/services/Search/mappers/RosreestrMapper/Searchers/RosreestrCoordSearcher';
import RosreestrTextSearcher from '~/services/Search/mappers/RosreestrMapper/Searchers/RosreestrTextSearcher';
import { MapPoint } from '~/geometry/MapPoint';
import { SemanticCriterion, SemanticOperator } from '~/services/Search/criteria/SemanticSearchCriterion';
import RosreestrAPISearcher from '~/services/Search/mappers/RosreestrMapper/Searchers/RosreestrAPISearcher';

export enum RosreestrQueryType {
    CCO = 5,                            // ОКСы
    LAND_LOT = 1,                       // Земельные участки
    LAND_QUARTER = 2,                   // Кварталы
    LAND_AREA = 3,                      // Районы
    LAND_DISTRICT = 4,                  // Округи
    BOUNDARY = 7,                       // Границы
    USE_RESTRICTED_ZONE = 10,           // ЗОУИТы
    TERRITORIAL_AREA = 6,               // Территориальные зоны
    FORESTRY = 12,                      // Лесничества и лесопарки
    FREE_ECONOMIC_ZONE = 16,            // Свободные экономические зоны
    SPECIALLY_NATURAL_AREA = 20         // Особо охраняемые природные территории
}


/**
 * Класс поиска на сервисе Росреестра
 * @class RosreestrMapper
 * @extends GwtkMapper
 */
export default class RosreestrMapper extends GwtkMapper<RosreestrRequestParams, RosreestrInfoItems> {

    protected requestService!: CommonService;

    protected searcher!: RosreestrSearcherBase;
    protected fullSearch!: boolean;

    /**
     * @constructor RosreestrMapper
     * @param vectorLayer {VectorLayer} Слой для объектов
     * @param requestService {RestService} Сервис запросов
     */
    constructor(vectorLayer: VectorLayer, requestService: CommonService, fullSearch:boolean = false) {
        super(vectorLayer, requestService.commonGet.bind(requestService));
        this.requestService = requestService;
        this.fullSearch = fullSearch;
    }

    protected detectSearcher(params: RosreestrRequestParams): RosreestrSearcherBase {
        if(params.rosreestrType) {
            return new RosreestrAPISearcher(params.text, this.requestService.getDefaults().url, params, this.fullSearch);
        }

        if (RosreestrMapper.isCadastrNumber(params.text)) {
            return new RosreestrCadnumberSearcher(params.text, this.requestService.getDefaults().url, params, this.fullSearch);
        }
        const coords = RosreestrMapper.parseCoords(params.text);
        if (coords) {
            return new RosreestrCoordSearcher(coords, this.requestService.getDefaults().url, params, this.fullSearch);
        }
        return new RosreestrTextSearcher(params.text, this.requestService.getDefaults().url, params, this.fullSearch);
    }

    private static isCadastrNumber(cadNumber: string): boolean {
        return /^\d+(:\d+)?(:\d+)?(:\d+)?($|\n)/.test(cadNumber);
    }

    private static parseCoords(coords: string) {
        const result = coords.trim().split(/[,\s]+/);
        const reg = /^[+-]?\d+(\.\d+)?$/;
        if (result.length === 2 && reg.test(result[1]) && reg.test(result[0])) {
            return result[1] + '+' + result[0];
        }
    }

    async search(criteriaAggregators: CriteriaAggregator[]) {
        if (this.activeRequest) {
            this.activeRequest.abortXhr();
        }
        const requestParams = this.prepareRequestParams(criteriaAggregators);
        this.searcher = this.detectSearcher(requestParams);
        // const result = await this.searcher.search();
        const result = {data: []};//TODO: отключаем запросы к росреестру
        return this.onDataLoaded(result);
    }

    private getCadasterTypeString(cadasterType: number) {
        let result = '';
        switch (cadasterType) {
            case RosreestrQueryType.LAND_LOT:
                result = 'Sector';
                break;
            case RosreestrQueryType.LAND_QUARTER:
                result = 'Quarter';
                break;
            case RosreestrQueryType.LAND_AREA:
                result = 'Region';
                break;
            case RosreestrQueryType.LAND_DISTRICT:
                result = 'County';
                break;
            case RosreestrQueryType.CCO:
                result = 'OCC';
                break;
            case RosreestrQueryType.BOUNDARY:
                result = 'Border';
                break;
            case RosreestrQueryType.USE_RESTRICTED_ZONE:           // ЗОУИТы
                result = 'Zone_10';
                break;
            case RosreestrQueryType.TERRITORIAL_AREA:               // Территориальные зоны
                result = 'Zone_6';
                break;
            case RosreestrQueryType.FORESTRY:                      // Лесничества и лесопарки
                result = 'Zone_12';
                break;
            case RosreestrQueryType.FREE_ECONOMIC_ZONE:           // Свободные экономические зоны
                result = 'Zone_16';
                break;
            case RosreestrQueryType.SPECIALLY_NATURAL_AREA:       // Особо охраняемые природные территории
                result = 'Zone_20';
                break;
        }

        if (result !== '') {
            return this.vectorLayer.map.translate(result);
        } else {
            return '';
        }
    }

    protected onDataLoaded(results: ServiceResponse<RosreestrSearchTextFeature[]>): GwtkMapperResult {
        const mapObjects = [];
        let foundObjectCount = 0;
        if (!results.error && results.data) {
            const featureCollection = results.data;
            foundObjectCount = featureCollection.length;
            for (let i =0; i<foundObjectCount; i++) {
                const item=featureCollection[i];
                const mapObject = new MapObject(this.vectorLayer, MapObjectType.Point, {
                    id: item.attrs.id,
                    layer: this.getCadasterTypeString(item.type),
                    code: 0,
                    layerid: '' + item.type,
                    mapid: '',
                    name: item.attrs.name ? item.attrs.name : item.attrs.acnum,
                    schema: '',
                    topscale: 17062
                });

                const semantics = this.searcher.getMapObjectSemantics(item);
                mapObject.addSemanticList(semantics);
                if(item.center) {
                    mapObject.addPoint(MapPoint.fromOriginArray([item.center.x, item.center.y], 'GoogleMapsCompatible'));
                } else {
                    mapObject.isValidGisObject = false;
                }
                mapObjects.push(mapObject);
            }
        }
        return { mapObjects, foundObjectCount };
    }

    protected prepareRequestParams(criteriaAggregators: CriteriaAggregator[]): RosreestrRequestParams {
        let limit, text = '';
        let typeRosreestrObject = '';
        let rosreestrType = '';
        // параметры поиска для каждого слоя карты, где поиск выполняется
        for (let i = 0; i < criteriaAggregators.length; i++) {
            const criteriaAggregator = criteriaAggregators[i];

            const numericCount = criteriaAggregator.getCriterionContent(SearchCriterionName.Count);
            limit = (numericCount !== undefined) ? ('' + Math.min(numericCount, 11)) : undefined;

            const semanticFilter = criteriaAggregator.getCriterionContent(SearchCriterionName.Text);
            if (semanticFilter) {
                text = GwtkMapper.getSearchText(semanticFilter.semanticCriterionList);
                typeRosreestrObject = RosreestrMapper.getTypeRosreestrObject(semanticFilter.semanticCriterionList);
            }

            const rosreestrTypeFilter = criteriaAggregator.getCriterionContent(SearchCriterionName.LayerType);
            if (rosreestrTypeFilter) {
                rosreestrType = rosreestrTypeFilter.join(',');
            }
        }
        return { text, limit, tolerance: '1', typeRosreestrObject, rosreestrType };
        // return { text, limit, tolerance: '16', typeRosreestrObject };
    }

    /**
     * Получить Тип объекта росреестра
     * @static
     * @method getTypeRosreestrObject
     * @return {string} тип объекта росреестра
     */
    protected static getTypeRosreestrObject(semanticCriterionList: SemanticCriterion[]): string {
        let result = '';
        if (semanticCriterionList[1] && semanticCriterionList[1].operator === SemanticOperator.ContainsValue) {
            result = semanticCriterionList[1].value;
        }
        return result;
    }
}

