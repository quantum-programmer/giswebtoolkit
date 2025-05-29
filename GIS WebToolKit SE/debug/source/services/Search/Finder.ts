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

import { GETFRAME, LATLONG, OBJCENTER, OUTTYPE } from '~/services/RequestServices/common/enumerables';
import { CountSearchCriterion, StartIndexSearchCriterion } from '~/services/Search/criteria/NumericSearchCriterion';
import {
    FilterComparisonOperators,
    SemanticSearchCriterion,
    TextSearchCriterion
} from '~/services/Search/criteria/SemanticSearchCriterion';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import {
    KeyListSearchCriterion,
    ObjectLocalSearchCriterion
} from '~/services/Search/criteria/StringArraySearchCriterion';
import {
    AreaSearchCriterion,
    FrameSearchCriterion,
    LatLongSearchCriterion,
    ObjectCenterSearchCriterion,
    OutTypeSearchCriterion
} from '~/services/Search/criteria/AdditionalSearchCriterion';
import { LayerIdSearchCriterion } from '~/services/Search/criteria/LayerIdSearchCriterion';
import GwtkMapper, { GwtkMapperResult } from '~/services/Search/mappers/GwtkMapper';
import { GwtkLayerDescription } from '~/types/Options';
import {
    BaseSearchCriterion,
    SearchCriterionData,
    SearchCriterionName
} from '~/services/Search/criteria/BaseSearchCriterion';
import Layer from '~/maplayers/Layer';

/**
 * Элемент управления Поиск
 * @class Finder
 */
export default class Finder {

    protected readonly mapper: GwtkMapper<any>;

    /**
     * Агрегатор общих критериев
     * @private
     * @readonly
     * @property commonCriteriaAggregator {CriteriaAggregator}
     */
    protected readonly commonCriteriaAggregator: CriteriaAggregator;

    private readonly criteriaAggregators: CriteriaAggregator[] = [];

    protected readonly layers?: Layer[];

    /**
     * Текст предыдущего запроса
     * @private
     * @property previousSearchText {string}
     */
    protected previousSearchText = '';

    private foundObjectCount: number = -1;
    private currentStartIndex = 0;

    protected static readonly defaultResultCount = 50;

    /**
     * @constructor Finder
     * @param mapper {GwtkMapper} Маппер для запросов
     * @param [layers] {GwtkLayerDescription} Экземпляр карты
     */
    constructor(mapper: GwtkMapper<any>, layers?: Layer[]) {

        this.mapper = mapper;

        this.layers = layers;

        const objCenterCriterion = new ObjectCenterSearchCriterion();
        objCenterCriterion.setValue(OBJCENTER.FirstPoint);

        const objLocalCriterion = new ObjectLocalSearchCriterion();
        objLocalCriterion.addValue('0', '1', '2', '3', '4');
        const areaCriterion = new AreaSearchCriterion();
        areaCriterion.setValue('1');

        const getFrameCriterion = new FrameSearchCriterion();
        getFrameCriterion.setValue(GETFRAME.AddObjectBounds);

        const outTypeCriterion = new OutTypeSearchCriterion();
        outTypeCriterion.setValue(OUTTYPE.JSON);

        const latLongCriterion = new LatLongSearchCriterion();
        latLongCriterion.setValue(LATLONG.LongitudeLatitude);

        const layerIdCriterion = new LayerIdSearchCriterion();
        layerIdCriterion.setValue('');

        this.commonCriteriaAggregator = new CriteriaAggregator('', [layerIdCriterion, objCenterCriterion, objLocalCriterion, areaCriterion, getFrameCriterion, outTypeCriterion, latLongCriterion]);
        this.criteriaAggregators.push(this.commonCriteriaAggregator);

        this.reset();

        if (layers) {

            //создание скелета запроса
            for (let i = 0; i < layers.length; i++) {
                const layer = layers[i];
                const defaultCriteria: BaseSearchCriterion<SearchCriterionData>[] = [];
                const layerIdCriterion = new LayerIdSearchCriterion();
                layerIdCriterion.setValue(layer.idLayer);
                defaultCriteria.push(layerIdCriterion);

                // if (layer.typeNames) {
                //     const typeNames = layer.typeNames.split(',') as string[];
                //     const typeNamesCriterion = new TypeNamesSearchCriterion();
                //     typeNamesCriterion.addValue(...typeNames);
                //     defaultCriteria.push(typeNamesCriterion);
                // }

                // if (layer.codeList) {
                //     const codeList = layer.codeList.split(',') as string[];
                //     const codeListCriterion = new CodeListSearchCriterion();
                //     codeListCriterion.addValue(...codeList);
                //     defaultCriteria.push(codeListCriterion);
                // }
                const keyList = layer.getKeysArray();
                if (keyList && keyList.length > 0) {              // фильтр объектов
                    const keyListCriterion = new KeyListSearchCriterion();
                    keyListCriterion.addValue(...keyList);
                    defaultCriteria.push(keyListCriterion);
                }

                // if (layer.idList) {
                //     const idList = layer.idList.split(',');
                //     const idListCriterion = new IdListSearchCriterion();
                //     idListCriterion.addValue(...idList);
                //     defaultCriteria.push(idListCriterion);
                // }

                const id = layer.id;
                if (layer.storedTextFilter) {

                    const filterCondition = Object.keys(layer.storedTextFilter.Filter)[0] as 'AND';

                    for (let i = 0; i < layer.storedTextFilter.Filter[filterCondition].length; i++) {
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
                this.criteriaAggregators.push(criteriaAggregator);
            }
        }
    }


    /**
     * Получить копию текущего состояния агрегатора критериев
     * @method getCriteriaAggregatorCopy
     * @return {CriteriaAggregator} Копия текущего состояния агрегатора критериев
     */
    getCriteriaAggregatorCopy(): CriteriaAggregator {
        return this.commonCriteriaAggregator.copy();
    }

    /**
     * Получить копию состояния агрегатора критериев для слоя
     * @method getLayerCriteriaAggregatorCopy
     * @param xId {string} xId слоя
     * @return {CriteriaAggregator} Копия состояния агрегатора критериев слоя
     */
    getLayerCriteriaAggregatorCopy(xId: string): CriteriaAggregator | undefined {
        let criteria;
        for (let i = 0; i < this.criteriaAggregators.length; i++) {
            const aggregator = this.criteriaAggregators[i];
            if (aggregator.id == xId) {
                criteria = aggregator.copy();
                break;
            }
        }
        return criteria;
    }

    /**
     * Установить состояние агрегатора критериев для слоя
     * @method setLayerCriteriaAggregator
     * @param criteria {CriteriaAggregator} Состояние агрегатора критериев для слоя
     */
    setLayerCriteriaAggregator(criteria: CriteriaAggregator) {
        for (let i = 0; i < this.criteriaAggregators.length; i++) {
            const aggregator = this.criteriaAggregators[i].copy();
            if (aggregator.id == criteria.id) {
                this.criteriaAggregators[i] = criteria.copy();
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
            const layerIdSearchCriterion = this.commonCriteriaAggregator.getLayerIdSearchCriterion();
            const layerIds = layerIdSearchCriterion.getContent();
            if (layerIds) {
                for (let i = 1; i < this.criteriaAggregators.length; i++) {
                    const criteriaAggregator = this.criteriaAggregators[i];
                    const layerIdSearch = criteriaAggregator.getCriterionContent(SearchCriterionName.LayerId);
                    if (layerIdSearch && layerIds.indexOf(layerIdSearch) === -1) {
                        this.criteriaAggregators.splice(i, 1);
                        i--;
                    }
                }
                this.commonCriteriaAggregator.removeCriterion(SearchCriterionName.LayerId);
            }
            this.resetSearch();
            return true;
        }
        return false;
    }

    /**
     * Установить индекс первого элемента
     * @method setStartIndex
     * @param value {number} Индекс первого элемента
     */
    setStartIndex(value: number): void {
        if (value >= 0) {
            this.currentStartIndex = value;
            if (this.commonCriteriaAggregator.hasStartIndexCriterion()) {
                const startIndexCriteria = this.commonCriteriaAggregator.getStartIndexSearchCriterion();
                startIndexCriteria.setValue(value);
                this.commonCriteriaAggregator.setStartIndexSearchCriterion(startIndexCriteria);
            }
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
            this.resetSearch();
        }
    }

    /**
     * Сбросить состояние поиска
     * @method resetSearch
     */
    resetSearch(): void {
        this.cancelSearch();
        this.setStartIndex(0);
        this.foundObjectCount = -1;
        this.previousSearchText = '';
    }

    /**
     * Выполнить поиск
     * @async
     * @method searchNext
     */
    async searchNext(): Promise<GwtkMapperResult | undefined> {
        if (this.foundObjectCount !== -1 && this.currentStartIndex >= this.foundObjectCount) {
            return;
        }

        const result = await this.mapper.search(this.criteriaAggregators);
        if (result) {
            this.foundObjectCount = result.foundObjectCount;
            this.setStartIndex(this.currentStartIndex + result.mapObjects.length);
            return result;
        }
    }

    /**
     * Сбросить состояние компонента
     * @method reset
     */
    reset(): void {
        this.commonCriteriaAggregator.clear();

        this.commonCriteriaAggregator.setStartIndexSearchCriterion(new StartIndexSearchCriterion());

        const countCriterion = new CountSearchCriterion();
        countCriterion.setValue(Finder.defaultResultCount);
        this.commonCriteriaAggregator.setCountSearchCriterion(countCriterion);

        this.resetSearch();
    }

    /**
     * Отменить поиск
     * @method cancelSearch
     */
    cancelSearch(): void {
        this.mapper.cancelRequest();
    }

    /**
         * Получить копию Finder`а
         * @method Finder
         * @returns {Finder}
         */
    clone(): Finder {
        return new Finder(this.mapper, this.layers);
    }

}
