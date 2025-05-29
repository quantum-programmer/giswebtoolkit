/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 Виджет поиска пересечений                         *
 *               "Просмотр списков объектов"                        *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkFeatureSamplesState,
    SET_SEARCH_FIRST_ITEM_ID,
    SET_SEARCH_SECOND_ITEM_ID,
    SET_SEARCH_OPERATORS,
    RUN_SEARCH,
    DOWNLOAD_FILE,
    TOGGLE_LAYER_VISIBILITY,
    DOWNLOAD_LAYER,
    ABORT_SEARCH,
    SET_FILE_NAME,
    SET_LAYER_NAME,
    SET_TYPE_OF_SEARCH,
    SET_LENGTH_UNIT,
    SET_CONDITION_OPERATOR_ID,
    SET_DISTANCE_VALUE,
    GwtkFeatureSamplesTaskWidgetParams,
    CREATE_GROUP_FROM_SEARCH_RESULT,
    TypeOfSearch
} from '../../GwtkFeatureSamplesTask';
import { Unit, UnitText, MeasurementUnits } from '~/utils/WorkspaceManager';
import { Condition, Operator } from '~/services/RequestServices/RestService/Types';

/**
 * Виджет компонента
 * @class GwtkFeatureSamplesSearchWidget
 * @extends Vue
 */
@Component
export default class GwtkFeatureSamplesSearchWidget extends Vue {

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkFeatureSamplesState>(key: K, value: GwtkFeatureSamplesState[K]) => void;

    @Prop({ default: () => ({}) })
    private readonly searchProps!: GwtkFeatureSamplesTaskWidgetParams['searchProps'];

    @Prop({ default: () => ({}) })
    private readonly units!: MeasurementUnits;

    /**
     * Перечень единиц измерений при поиске по расстоянию
     * @readonly
     * @property lengthUnitList {[Unit]} Массив единиц измерения
     */
    readonly lengthUnitList = [Unit.Meters, Unit.Kilometers];

    /**
     * Перевод аббревиатур единиц измерения
     * к читаемому виду, например, MTR ---> M
     * @method getUnitText
     * @param unit {Unit} Единицы измерения
     */
    getUnitText(unit: Unit) {
        return this.$t('phrases.' + UnitText[unit]);
    }

    get firstSearchItemId() {
        return this.searchProps.firstSearchItemId;
    }

    get secondSearchItemId() {
        return this.searchProps.secondSearchItemId;
    }

    get selectedOperators() {
        return this.searchProps.selectedOperators;
    }

    get searchResult() {
        return this.searchProps.searchResult;
    }

    get searchProgress() {
        return this.searchProps.searchProgress;
    }

    get searchFirstItemGroupList() {
        return this.searchProps.searchFirstItemGroupList;
    }

    get searchSecondItemGroupList() {
        return this.searchProps.searchSecondItemGroupList;
    }

    get searchOperatorList() {
        return this.searchProps.searchOperatorList;
    }

    get csvCreation() {
        return this.searchProps.csvCreation;
    }

    get enabled(): boolean {
        if (this.isCrossTypeOfSearch) {
            return this.selectedOperators.length > 0 && this.firstSearchItemId !== -1 && this.secondSearchItemId !== -1;
        } else if (this.isDistanceTypeOfSearch) {
            return (
                this.selectedOperators.length === 0 &&
                this.firstSearchItemId !== -1 &&
                this.secondSearchItemId !== -1 &&
                Number(this.searchProps.distanceValue) > 0 &&
                !!this.searchProps.searchLengthUnit
            );
        } else {
            return this.firstSearchItemId !== -1 && this.secondSearchItemId !== -1;
        }
    }

    get searchLengthUnit() {
        return this.searchProps.searchLengthUnit;
    }

    get conditionOperatorId() {
        return this.searchProps.conditionOperatorId;
    }

    get distanceValue() {
        return this.searchProps.distanceValue;
    }

    setFirstSearchItemId(value: number | null): void {
        if (value !== null) {
            this.setState(SET_SEARCH_FIRST_ITEM_ID, value);
        } else {
            this.setState(SET_SEARCH_FIRST_ITEM_ID, -1);
        }
    }

    setSecondSearchItemId(value: number | null): void {
        if (value !== null) {
            this.setState(SET_SEARCH_SECOND_ITEM_ID, value);
        } else {
            this.setState(SET_SEARCH_SECOND_ITEM_ID, -1);
        }
    }

    /**
     * Обработчик для изменения значения единицы длины
     * @private
     * @method setSearchUnitId
     * @property value {String} значение поля
     */
    setSearchLengthUnit(value: string) {
        this.setState(SET_LENGTH_UNIT, value as Unit);
    }

    /**
     * Обработчик для изменения оператора сравнения
     * @method setConditionOperatorId
     * @property value {String} значение поля
     */
    setConditionOperatorId(value: string): void {
        if (value !== null) {
            this.setState(SET_CONDITION_OPERATOR_ID, value as Condition);
        } else {
            this.setState(SET_CONDITION_OPERATOR_ID, '0');
        }
    }

    /**
     * Обработчик для установки расстояния
     * @private
     * @method setDistanceValue
     * @property value {String} значение поля
     */
    setDistanceValue(value: string | null): void {
        if (value !== null) {
            this.setState(SET_DISTANCE_VALUE, value);
        } else {
            this.setState(SET_DISTANCE_VALUE, '');
        }
    }

    setSelectedOperators(value: Operator[]): void {
        this.setState(SET_SEARCH_OPERATORS, value);
    }

    removeOperator(id: Operator): void {
        const index = this.selectedOperators.indexOf(id);
        if (index !== -1) {
            const result = this.selectedOperators.slice();
            result.splice(index, 1);
            this.setSelectedOperators(result);
        }
    }

    runSearch(): void {
        this.setState(RUN_SEARCH, undefined);
    }

    abortSearch(): void {
        this.setState(ABORT_SEARCH, undefined);
    }

    toggleLayerVisibility(xId: string) {
        this.setState(TOGGLE_LAYER_VISIBILITY, xId);
    }

    downloadLayer(xId: string) {
        this.setState(DOWNLOAD_LAYER, xId);
    }

    downloadDocument() {
        this.setState(DOWNLOAD_FILE, undefined);
    }

    changeLayerName(value: string) {
        this.setState(SET_LAYER_NAME, value);
    }

    changeCSVFileName(value: string) {
        this.setState(SET_FILE_NAME, value);
    }

    createGroup() {
        this.setState(CREATE_GROUP_FROM_SEARCH_RESULT, null);
    }

    get conditionOperatorList() {
        return this.searchProps.conditionOperatorList;
    }

    get isCrossTypeOfSearch() {
        return this.searchProps.typeOfSearch === TypeOfSearch.Cross;
    }

    setCrossingOperator(): void {
        this.searchProps.searchResult = null;
        this.setState(SET_TYPE_OF_SEARCH, TypeOfSearch.Cross);
        this.setSelectedOperators([Operator.Cross]);
    }

    get isDistanceTypeOfSearch() {
        return this.searchProps.typeOfSearch === TypeOfSearch.Distance;
    }

    setSearchByDistance() {
        this.removeOperator(Operator.Cross);
        this.setState(SET_TYPE_OF_SEARCH, TypeOfSearch.Distance);
    }

    get isStartTypeOfSearch() {
        return this.searchProps.typeOfSearch === TypeOfSearch.Start;
    }

    setSearchByStart(): void {
        this.removeOperator(Operator.Cross);
        this.setState(SET_TYPE_OF_SEARCH, TypeOfSearch.Start);
    }

    get isEndTypeOfSearch() {
        return this.searchProps.typeOfSearch === TypeOfSearch.End;
    }

    setSearchByEnd(): void {
        this.removeOperator(Operator.Cross);
        this.setState(SET_TYPE_OF_SEARCH, TypeOfSearch.End);
    }
}
