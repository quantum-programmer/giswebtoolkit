/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Виджет поиска по измерениям                    *
 *                                                                  *
 *******************************************************************/


import {Component, Prop, Vue} from 'vue-property-decorator';
import {
    ADD_SELECTED_SEARCH_MEASUREMENT,
    DELETE_SELECTED_SEARCH_MEASUREMENT,
    GwtkSearchBySemanticsTaskState,
    MeasurementSearchItemType,
    MeasurementSearchParams,
    SearchMeasurement,
    SelectableItems,
    SET_MEASUREMENT_SEARCH_PARAMS
} from '@/components/GwtkSearchBySemantics/task/GwtkSearchBySemanticsTask';
import {MeasureOperator} from '~/services/Search/criteria/MeasureSearchCriterion';
import {Unit, UnitText} from '~/utils/WorkspaceManager';

/**
 * Виджет компонента
 * @class GwtkSearchByMeasurements
 * @extends Vue
 */
@Component
export default class GwtkSearchByMeasurements extends Vue {

    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkSearchBySemanticsTaskState>(key: K, value: GwtkSearchBySemanticsTaskState[K]) => void;

    @Prop({ default: '' })
    readonly selectedLayerId!: string;

    @Prop({ default: () => ({}) })
    readonly measurementSearchParams!: MeasurementSearchParams;

    /**
     * Индексы для условия поиска
     * @property searchConditionList {SelectableItems[]}
     */
    readonly searchConditionList: SelectableItems[] = [
        { value: 'OR', text: this.$t('phrases.At least one') as string },
        { value: 'AND', text: this.$t('phrases.All') as string }
    ];



    get availableMeasurementType() {
        return this.measurementSearchParams.measurementItemTypes.filter(item =>
            this.measurementSearchParams.selectedSearchMeasurementList.findIndex(measurement => measurement.value === item.id) === -1);
    }

    get disabled() {
        return (!this.selectedLayerId && !this.measurementSearchParams.byAllLayersFlag) || (this.availableMeasurementType.length === 0);
    }

    /**
     * Получить значения "Условие поиска"
     * @method selectSearchCondition
     * @param value {string}
     */
    selectSearchCondition(value: string) {
        this.setState(SET_MEASUREMENT_SEARCH_PARAMS, { searchCondition: value });
    }

    /**
     * Изменить тип единицы измерения в выбранном измерении
     * @method setSelectedSearchMeasurementUnit
     * @param measurement {SearchMeasurement}
     * @param value {String}
     */
    setSelectedSearchMeasurementUnit(measurement: SearchMeasurement, value: Unit) {
        this.setState(SET_MEASUREMENT_SEARCH_PARAMS, { measurementsItem: { ...measurement, searchUnitsList: { ...measurement.searchUnitsList, selected: value } } });
    }

    /**
     * Получить текстовое название единицы измерения
     * @method getUnitText
     * @param unit {Unit}
     */
    getUnitText(unit: Unit) {
        return this.$t('phrases.' + UnitText[unit]);
    }

    /**
     * Изменить тип выбранного условия
     * @method setSelectedSearchMeasurementOperator
     * @param measurement {SearchMeasurement}
     * @param value {String}
     */
    setSelectedSearchMeasurementOperator(measurement: SearchMeasurement, value: MeasureOperator) {

        const measurementsItem: SearchMeasurement = { ...measurement, searchOperatorsList: { ...measurement.searchOperatorsList, selected: value } };

        const searchValue = measurementsItem.searchValue.slice();
        if (!this.isRangeOperator(measurementsItem)) {
            searchValue.length = 1;
        } else if (searchValue.length === 1) {
            searchValue.push('');
        }
        measurementsItem.searchValue = searchValue;

        this.setState(SET_MEASUREMENT_SEARCH_PARAMS, { measurementsItem });
    }

    /**
     * Исключить измерения из списка измерений
     * @method deleteSelectedSearchMeasurement
     * @param measurement {SearchMeasurement}
     */
    deleteSelectedSearchMeasurement(measurement: SearchMeasurement) {
        this.setState(DELETE_SELECTED_SEARCH_MEASUREMENT, measurement);
    }

    /**
     * Проверить тип выбранного условия сравнения
     * @method isRangeOperator
     * @param measurement {SearchMeasurement}
     */
    isRangeOperator(measurement: SearchMeasurement) {
        return measurement.searchOperatorsList.isRange;
    }

    /**
     * Установить диапазон для условия сравнения
     * @method setRangeOperator
     * @param measurement {SearchMeasurement}
     * @param value boolean
     */
    setRangeOperator(measurement: SearchMeasurement, value: boolean) {
        this.setState(SET_MEASUREMENT_SEARCH_PARAMS, { measurementsItem: { ...measurement, searchOperatorsList: { ...measurement.searchOperatorsList, isRange: value } } });

        if(value) {
            this.setSelectedSearchMeasurementOperator(measurement, MeasureOperator.NotLess);
        } else {
            this.setSelectedSearchMeasurementOperator(measurement, MeasureOperator.Equals);
        }
    }

    /**
     * Обновить список выбранных видов измерения
     * @method addSelectedSearchMeasurement
     * @param measurementType {MeasurementSearchItemType}
     */
    addSelectedSearchMeasurement(measurementType: MeasurementSearchItemType) {
        this.setState(ADD_SELECTED_SEARCH_MEASUREMENT, measurementType);
    }


    /**
     * Обработчик для изменения флага поиска по всем картам
     * @method selectSearchByAll
     * @param value {boolean}
     */
    selectSearchByAll(value: boolean) {
        this.setState(SET_MEASUREMENT_SEARCH_PARAMS, { byAllLayersFlag: value });
    }


    updateFirstValue(measurement: SearchMeasurement, value: string) {
        const searchValue = measurement.searchValue.slice();
        searchValue[0] = value;
        this.setState(SET_MEASUREMENT_SEARCH_PARAMS, { measurementsItem: { ...measurement, searchValue } });
    }

    updateSecondValue(measurement: SearchMeasurement, value: string) {
        const searchValue = measurement.searchValue.slice();
        searchValue[1] = value;
        this.setState(SET_MEASUREMENT_SEARCH_PARAMS, { measurementsItem: { ...measurement, searchValue } });
    }

}
