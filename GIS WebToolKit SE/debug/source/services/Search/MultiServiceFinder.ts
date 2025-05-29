/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Элемент управления "Поиск"                         *
 *                                                                  *
 *******************************************************************/

import { CountSearchCriterion, StartIndexSearchCriterion } from '~/services/Search/criteria/NumericSearchCriterion';
import {
    FilterComparisonOperators,
    SemanticSearchCriterion,
    TextSearchCriterion
} from '~/services/Search/criteria/SemanticSearchCriterion';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import {
    KeyListSearchCriterion
} from '~/services/Search/criteria/StringArraySearchCriterion';
import {
    BboxSearchCriterion
} from '~/services/Search/criteria/AdditionalSearchCriterion';
import { LayerIdSearchCriterion } from '~/services/Search/criteria/LayerIdSearchCriterion';
import GwtkMapper, { GwtkMapperResult } from '~/services/Search/mappers/GwtkMapper';
import { GwtkLayerDescription } from '~/types/Options';
import {
    BaseSearchCriterion,
    SearchCriterionData,
    SearchCriterionName
} from '~/services/Search/criteria/BaseSearchCriterion';
import Finder from '~/services/Search/Finder';
import GISWebServiceSEMapper, {
    StatisticList,
    StatisticLocal
} from '~/services/Search/mappers/GISWebServiceSEMapper';
import { GetFeatureParams } from '~/services/RequestServices/RestService/Types';
import PixelPoint from '~/geometry/PixelPoint';

export type SearchRequestParams = {
    params: GetFeatureParams[],
    server: string,
    idlist?: { mapid: string, gmlid: string }[]
}

/**
 * Элемент управления Поиск
 * @class MultiServiceFinder
 */
export default class MultiServiceFinder extends Finder {

    private readonly mapperDescriptions: {
        mapper: GwtkMapper;
        commonCriteriaAggregator: CriteriaAggregator;
        criteriaAggregators: CriteriaAggregator[];
        layers?: GwtkLayerDescription[];
        foundObjectCount: number;
        currentStartIndex: number;
    }[] = [];

    /**
     * Добавить мапперы
     * @param mappers {GwtkMapper[]} массив мапперов
     * @param point {PixelPoint}
     */
    addMappers(mappers: GwtkMapper[], point?: PixelPoint) {
        mappers.forEach(mapper => {
            this.mapperDescriptions.push({
                mapper,
                commonCriteriaAggregator: this.commonCriteriaAggregator.copy(),
                criteriaAggregators: [],
                foundObjectCount: -1,
                currentStartIndex: 0
            });
        });

        this.mapperDescriptions.forEach(mapperDescription => mapperDescription.criteriaAggregators.push(mapperDescription.commonCriteriaAggregator));

        this.reset();


        if (this.layers) {
            //создание скелета запроса
            for (let i = 0; i < this.layers.length; i++) {
                const layer = this.layers[i];

                const defaultCriteria: BaseSearchCriterion<SearchCriterionData>[] = [];

                const layerIdCriterion = new LayerIdSearchCriterion();
                layerIdCriterion.setValue(layer.idLayer);
                defaultCriteria.push(layerIdCriterion);
                //
                // if (layer.typeNames) {
                //     const typeNames = layer.typeNames.split(',') as string[];
                //     const typeNamesCriterion = new TypeNamesSearchCriterion();
                //     typeNamesCriterion.addValue(...typeNames);
                //     defaultCriteria.push(typeNamesCriterion);
                // }
                //
                // if (layer.codeList) {
                //     const codeList = layer.codeList.split(',') as string[];
                //     const codeListCriterion = new CodeListSearchCriterion();
                //     codeListCriterion.addValue(...codeList);
                //     defaultCriteria.push(codeListCriterion);
                // }

                if (layer.getKeysArray) {              // фильтр объектов
                    const keyList = layer.getKeysArray();
                    if (keyList && keyList.length > 0) {
                        const keyListCriterion = new KeyListSearchCriterion();
                        keyListCriterion.addValue(...keyList);
                        defaultCriteria.push(keyListCriterion);
                    }
                }

                // if (layer.idList) {
                //     const idList = layer.idList.split(',');
                //     const idListCriterion = new IdListSearchCriterion();
                //     idListCriterion.addValue(...idList);
                //     defaultCriteria.push(idListCriterion);
                // }

                if (point) {
                    const bounds = layer.getBboxForPoint(point);
                    if (bounds) {
                        const bboxCriterion = new BboxSearchCriterion();
                        bboxCriterion.setValue(bounds);
                        defaultCriteria.push(bboxCriterion);
                    }
                }

                const id = layer.id;

                if ( layer.storedTextFilter ) {

                    const filterCondition = Object.keys(layer.storedTextFilter.Filter)[0] as 'AND';

                    for (let i = 0; i < layer.storedTextFilter.Filter[filterCondition].length; i ++) {
                        const persistentSemanticFilter = new SemanticSearchCriterion();
                        persistentSemanticFilter.fromJSON(layer.storedTextFilter.Filter[filterCondition][i] as FilterComparisonOperators);
                        defaultCriteria.push(persistentSemanticFilter);
                    }

                }
                const criteriaAggregator = new CriteriaAggregator(id, defaultCriteria);

                if (layer.keysTextSearch && layer.keysTextSearch.length > 0) {
                    const textSearchCriterion = new TextSearchCriterion();
                    textSearchCriterion.addTextSearchKey(layer.keysTextSearch);
                    criteriaAggregator.setTextSearchCriterion(textSearchCriterion);
                }

                const mapper = this.mapperDescriptions.find(mapperDescription => layer.server && layer.server.includes(mapperDescription.mapper.vectorLayer.url));

                if (mapper) {
                    mapper.criteriaAggregators.push(criteriaAggregator);
                }
            }
        }
    }


    /**
     * Обновить состояние агрегатора критериев
     * @method updateCriteriaAggregator
     * @return {boolean} Флаг изменения состояния
     */
    updateCriteriaAggregator(criteriaAggregator: CriteriaAggregator): boolean {
        if (this.commonCriteriaAggregator.updateFrom(criteriaAggregator)) {

            this.mapperDescriptions.forEach(mapperDescription => {
                if (mapperDescription.commonCriteriaAggregator.updateFrom(this.commonCriteriaAggregator)) {
                    const layerIdSearchCriterion = mapperDescription.commonCriteriaAggregator.getLayerIdSearchCriterion();
                    const layerIds = layerIdSearchCriterion.getContent();
                    if (layerIds) {
                        for (let i = 1; i < mapperDescription.criteriaAggregators.length; i++) {
                            const criteriaAggregator = mapperDescription.criteriaAggregators[i];
                            const layerIdSearch = criteriaAggregator.getCriterionContent(SearchCriterionName.LayerId);
                            if (layerIdSearch && layerIds.indexOf(layerIdSearch) === -1) {
                                mapperDescription.criteriaAggregators.splice(i, 1);
                                i--;
                            }
                        }
                        mapperDescription.commonCriteriaAggregator.removeCriterion(SearchCriterionName.LayerId);
                    }
                }
            });

            this.resetSearch();
            return true;
        }
        return false;
    }

    /**
     * Получить копию списка критериев поиска для слоя
     * @method getLayerCriteriaAggregatorCopy
     * @param xId {string} xId слоя
     * @return {CriteriaAggregator | undefined}
     */
    getLayerCriteriaAggregatorCopy(xId: string): CriteriaAggregator | undefined {
        let criteria;
        for (let j = 0; j < this.mapperDescriptions.length; j++) {
            const criterionList = this.mapperDescriptions[j].criteriaAggregators;
            for (let i = 0; i < criterionList.length; i++) {
                const aggregator = this.mapperDescriptions[j].criteriaAggregators[i].copy();
                if (criterionList[i].id == xId) {
                    criteria = aggregator;
                    break;
                }
            }
        }

        // return { criteria, index: this.mapperDescriptions[0].criteriaAggregators.length };
        return criteria;
    }

    /**
     * Установить список критериев поиска для слоя
     * @method setLayerCriteriaAggregator
     * @param criteria {CriteriaAggregator} Список критериев поиска для слоя
     * @return {true}
     */
    setLayerCriteriaAggregator(criteria: CriteriaAggregator) {
        for (let j = 0; j < this.mapperDescriptions.length; j++) {
            const criterionList = this.mapperDescriptions[j].criteriaAggregators;
            for (let i = 0; i < criterionList.length; i++) {
                if (criterionList[i].id == criteria.id) {
                    this.mapperDescriptions[j].criteriaAggregators[i] = criteria;
                    return true;
                }
            }
        }
    }

    /**
     * Очистить результаты поиска
     * @method resetSearch
     */
    resetSearch(): void {
        this.cancelSearch();
        this.setStartIndex(0);
        this.mapperDescriptions.forEach(mapperDescription => {
            mapperDescription.foundObjectCount = -1;
        });
        this.previousSearchText = '';
    }

    /**
     * Установить индекс первого элемента
     * @method setStartIndex
     * @param value {number} Индекс первого элемента
     */
    setStartIndex(value: number): void {
        if (value >= 0) {
            this.mapperDescriptions.forEach(mapperDescription => {
                mapperDescription.currentStartIndex = value;

                mapperDescription.commonCriteriaAggregator.setStartIndexSearchCriterion(new StartIndexSearchCriterion());

                if (mapperDescription.commonCriteriaAggregator.hasStartIndexCriterion()) {
                    const startIndexCriteria = mapperDescription.commonCriteriaAggregator.getStartIndexSearchCriterion();
                    startIndexCriteria.setValue(value);
                    mapperDescription.commonCriteriaAggregator.setStartIndexSearchCriterion(startIndexCriteria);

                    mapperDescription.criteriaAggregators.forEach(criteriaAggregator => {
                        if (criteriaAggregator.hasStartIndexCriterion()) {
                            const startIndexCriterion = criteriaAggregator.getStartIndexSearchCriterion();
                            startIndexCriterion.setValue(value);
                            criteriaAggregator.setStartIndexSearchCriterion(startIndexCriterion);
                        }
                    });
                }
            });
        }
    }

    /**
     * Установить максимальное количество элементов в ответе
     * @method setCount
     * @param value {number} Максимальное количество элементов в ответе
     */
    setCount(value: number): void {
        if (value >= 0) {

            const countCriteria = this.commonCriteriaAggregator.getCountSearchCriterion();
            countCriteria.setValue(value);
            this.commonCriteriaAggregator.setCountSearchCriterion(countCriteria);

            this.mapperDescriptions.forEach(mapperDescription => {
                const countCriteria = mapperDescription.commonCriteriaAggregator.getCountSearchCriterion();
                countCriteria.setValue(value);
                mapperDescription.commonCriteriaAggregator.setCountSearchCriterion(countCriteria);
            });

            this.resetSearch();
        }
    }

    /**
     * Выполнить поиск
     * @async
     * @method searchNext
     */
    async searchNext(): Promise<GwtkMapperResult | undefined> {

        const resultTotal: GwtkMapperResult = {
            mapObjects: [],
            foundObjectCount: 0
        };

        for (let i = 0; i < this.mapperDescriptions.length; i++) {
            const mapperDescription = this.mapperDescriptions[i];

            if (!(mapperDescription.foundObjectCount !== -1 && mapperDescription.currentStartIndex >= mapperDescription.foundObjectCount)) {
                try {
                    const result = await mapperDescription.mapper.search(mapperDescription.criteriaAggregators);
                    if (result) {

                        result.mapObjects.forEach(mapObject => resultTotal.mapObjects.push(mapObject));
                        mapperDescription.foundObjectCount = result.foundObjectCount;

                        if (result.foundObjectCount !== -1) {
                            resultTotal.foundObjectCount += result.foundObjectCount;
                        }

                        const value = mapperDescription.currentStartIndex + result.mapObjects.length;

                        mapperDescription.currentStartIndex = value;

                        mapperDescription.commonCriteriaAggregator.setStartIndexSearchCriterion(new StartIndexSearchCriterion());

                        if (mapperDescription.commonCriteriaAggregator.hasStartIndexCriterion()) {
                            const startIndexCriteria = mapperDescription.commonCriteriaAggregator.getStartIndexSearchCriterion();
                            startIndexCriteria.setValue(value);
                            mapperDescription.commonCriteriaAggregator.setStartIndexSearchCriterion(startIndexCriteria);
                        }

                        if (result.statistic) {
                            if (!resultTotal.statistic) {
                                resultTotal.statistic = result.statistic;
                            } else {
                                MultiServiceFinder.mergeStatistics(result.statistic, resultTotal.statistic);
                            }
                        }
                    }
                } catch (error) {
                    error;
                }
            }
        }

        if (resultTotal.foundObjectCount !== 0) {
            return resultTotal;
        }
    }

    /**
     * Сбросить состояние компонента
     * @method reset
     */
    reset(): void {
        if (this.mapperDescriptions) {

            this.commonCriteriaAggregator.clear();
            this.commonCriteriaAggregator.setStartIndexSearchCriterion(new StartIndexSearchCriterion());

            const countCriterion = new CountSearchCriterion();
            countCriterion.setValue(Finder.defaultResultCount);
            this.commonCriteriaAggregator.setCountSearchCriterion(countCriterion);


            this.mapperDescriptions.forEach(mapperDescription => {
                mapperDescription.commonCriteriaAggregator.clear();
                mapperDescription.commonCriteriaAggregator.setStartIndexSearchCriterion(new StartIndexSearchCriterion());

                const countCriterion = new CountSearchCriterion();
                countCriterion.setValue(Finder.defaultResultCount);
                mapperDescription.commonCriteriaAggregator.setCountSearchCriterion(countCriterion);

            });

            this.resetSearch();
        }

    }

    /**
     * Отменить поиск
     * @method cancelSearch
     */
    cancelSearch(): void {
        this.mapperDescriptions.forEach(mapperDescription => {
            mapperDescription.mapper.cancelRequest();
        });
    }

    /**
     * Получить копию Finder`а
     * @method clone
     * @return {Finder}
     */
    clone(): Finder {
        const finder = new MultiServiceFinder(this.mapper, this.layers);

        finder.commonCriteriaAggregator.updateFrom( this.commonCriteriaAggregator );

        this.mapperDescriptions.forEach((mapperDescription, index) => {


            const criteriaAggregatorsCopy = mapperDescription.criteriaAggregators.map((criteriaAggregator, index) => {
                if(index===0) {
                    return finder.commonCriteriaAggregator;
                }
                const criteriaAggregatorCopy = criteriaAggregator.copy();
                if (criteriaAggregatorCopy.hasStartIndexCriterion()) {
                    criteriaAggregatorCopy.setStartIndexSearchCriterion(new StartIndexSearchCriterion());
                }
                return criteriaAggregatorCopy;
            });

            finder.mapperDescriptions[index] = {
                mapper: mapperDescription.mapper,
                commonCriteriaAggregator: finder.commonCriteriaAggregator,
                criteriaAggregators: criteriaAggregatorsCopy,
                layers: mapperDescription.layers?.slice(),
                foundObjectCount: mapperDescription.foundObjectCount,
                currentStartIndex: mapperDescription.currentStartIndex
            };


        });
        // todo: Для чего выставлять 0 ?
        // this.setStartIndex( 0 );
        return finder;
    }

    /**
     * Объединить статистику поиска
     * @method mergeStatistics
     * @param currentStatistic {StatisticList} текущая статистика
     * @param resultStatistic {StatisticList} новая статистика
     */
    private static mergeStatistics(currentStatistic: StatisticList, resultStatistic: StatisticList) {
        for (let j = 0; j < currentStatistic.layers.length; j++) {
            const layerStatistic = currentStatistic.layers[j];
            resultStatistic.layers.push(layerStatistic);
        }

        let localKey: keyof StatisticLocal;
        for (localKey in currentStatistic.local) {
            const count = parseInt(resultStatistic.local[localKey]) + parseInt(currentStatistic.local[localKey]);
            resultStatistic.local[localKey] = count + '';
        }

        for (let j = 0; j < currentStatistic.typenames.length; j++) {
            const typenamesStatistic = currentStatistic.typenames[j];
            const resultTypenamesStatistic = resultStatistic.typenames.find(typename => typename.value === typenamesStatistic.value);
            if (resultTypenamesStatistic) {
                const count = parseInt(resultTypenamesStatistic.count) + parseInt(typenamesStatistic.count);
                resultTypenamesStatistic.count = count + '';
            } else {
                resultStatistic.typenames.push(typenamesStatistic);
            }
        }

        for (let j = 0; j < currentStatistic.keys.length; j++) {
            const keysStatistic = currentStatistic.keys[j];
            const resultKeysStatistic = resultStatistic.keys.find(key => key.value === keysStatistic.value);
            if (resultKeysStatistic) {
                const count = parseInt(resultKeysStatistic.count) + parseInt(keysStatistic.count);
                resultKeysStatistic.count = count + '';
            } else {
                resultStatistic.keys.push(keysStatistic);
            }
        }


        for (let j = 0; j < currentStatistic.semantics.length; j++) {
            const semanticsStatistic = currentStatistic.semantics[j];
            const resultSemanticsStatistic = resultStatistic.semantics.find(key => key.value === semanticsStatistic.value);
            if (resultSemanticsStatistic) {
                const count = parseInt(resultSemanticsStatistic.count) + parseInt(semanticsStatistic.count);
                resultSemanticsStatistic.count = count + '';

                if (semanticsStatistic.classifier) {
                    if (!resultSemanticsStatistic.classifier) {
                        resultSemanticsStatistic.classifier = semanticsStatistic.classifier;
                    } else {
                        semanticsStatistic.classifier.forEach(classifierValue => {
                            if (!resultSemanticsStatistic.classifier?.includes(classifierValue)) {
                                resultSemanticsStatistic.classifier?.push(classifierValue);
                            }
                        });
                    }
                }
            } else {
                resultStatistic.semantics.push(semanticsStatistic);
            }
        }
    }

    /**
     * Получить описание текущего запроса
     * @method getFeatureRequestDescription
     * @return {Array} SearchRequestParams[], описание параметров запроса
     */
    getFeatureRequestDescription(): SearchRequestParams[] {
        const mapperParams: SearchRequestParams[] = [];

        this.mapperDescriptions.forEach(description => {
            const mapper = description.mapper;
            if (mapper instanceof GISWebServiceSEMapper) {
                const params = mapper.getRequestParams(description.criteriaAggregators);
                const server = mapper.vectorLayer.url;
                mapperParams.push({ server, params });
            }
        });

        return mapperParams;
    }
}
