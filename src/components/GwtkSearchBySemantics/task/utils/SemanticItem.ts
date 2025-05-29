/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Класс для семантик                       *
 *                                                                  *
 *******************************************************************/

import { SemanticCriterion, SemanticOperator } from '~/services/Search/criteria/SemanticSearchCriterion';
import { RscSemantic } from '~/services/RequestServices/RestService/Types';
import { ClassifierTypeSemanticValue } from '~/classifier/Classifier';


/**
 * Класс для семантик
 * @class SemanticItem
 */
export default class SemanticItem {

    /**
     * @constructor SemanticFilterItem
     * @param semantic {RscSemantic} Описание из семантики слоя
     * @param classifierSemanticList {ClassifierTypeSemanticValue[]} Список семантик классификатора
     * @param [semanticSearchValue] {array} Заполненные значения семантик
     */
    constructor(
        private readonly semantic: RscSemantic,
        private readonly classifierSemanticList: ClassifierTypeSemanticValue[],
        public semanticSearchValue: (string | number | null)[] = []
    ) {

    }

    /**
     * Название семантики
     * @property semanticName {string}
     */
    get semanticName() {
        return this.semantic.name;
    }

    /**
     * Значение семантики
     * @property semanticValue {string}
     */
    get semanticValue() {
        return this.semantic.shortname;
    }

    /**
     * Максимальное значения семантики
     * @property semanticMaxValue {number}
     */
    get semanticMaxValue() {
        return Number( this.semantic.maximum );
    }

    /**
     * Минимальное значения семантики
     * @property semanticMinValue {number}
     */
    get semanticMinValue() {
        return Number( this.semantic.minimum );
    }

    /**
     * Тип семантики
     * @property semanticValue {SemanticOperator}
     */
    get semanticType() {

        let typeValue = SemanticOperator.ContainsValue;
        const semanticTypeValue = Number( this.semantic.type );

        if ( semanticTypeValue === 1 ) {
            typeValue = SemanticOperator.InRange;
        } else if ( semanticTypeValue === 16 ) {
            typeValue = SemanticOperator.InList;
        }

        return typeValue;
    }

    /**
     * Флаг текстовой семантики (вхождение)
     * @property isContainsType {boolean}
     */
    get isContainsType() {
        return this.semanticType === SemanticOperator.ContainsValue;
    }

    /**
     * Флаг цифровой семантики (диапазон)
     * @property isRangeType {boolean}
     */
    get isRangeType() {
        return this.semanticType === SemanticOperator.InRange;
    }

    /**
     * Флаг семантики типа классификатор
     * @property isListType {boolean}
     */
    get isListType() {
        return this.semanticType === SemanticOperator.InList;
    }

    /**
     * Значения для семантики типа классификатор
     * @property semanticTypeListValues {boolean}
     */
    get semanticTypeListValues() {
        let valuesList: { name: string; value: string }[] = [];

        if ( this.classifierSemanticList && this.semanticType === SemanticOperator.InList ) {
            valuesList = [...valuesList, ...this.classifierSemanticList];
        }

        return valuesList;
    }

    get checkFilled(): boolean {
        return !!(this.semanticSearchValue && (this.semanticSearchValue[0] || this.semanticSearchValue[0] === 0 || this.semanticSearchValue[1] || this.semanticSearchValue[1] === 0));
    }

    /**
     * Выбранные значения типа классификатор
     * @property selectedSemanticTypeListValues {boolean}
     */
    get selectedSemanticTypeListValues() {
        const semanticTypesValues: string[] = [];

        this.semanticTypeListValues.forEach( semanticTypeListValue => {

            if ( this.semanticSearchValue.includes( semanticTypeListValue.value ) ) {
                semanticTypesValues.push( semanticTypeListValue.name );
            }
        } );

        return semanticTypesValues;
    }

    /**
     * Критерий для выполнения поиска
     * @property semanticCriterion {SemanticCriterion}
     */
    get semanticCriterion() {
        let result: SemanticCriterion;

        switch ( this.semanticType ) {
            case SemanticOperator.ContainsValue:
                result = {
                    key: this.semanticValue,
                    operator: SemanticOperator.ContainsValue,
                    value: this.semanticSearchValue[ 0 ] as string
                };
                break;
            case SemanticOperator.InRange:
                let semanticMinValue: number | undefined = undefined;
                let semanticMaxValue: number | undefined = undefined;

                if ( this.semanticSearchValue[ 0 ] && this.semanticSearchValue[ 0 ] !== '' ) {
                    semanticMinValue = Number( this.semanticSearchValue[ 0 ] );
                }

                if ( this.semanticSearchValue[ 1 ] && this.semanticSearchValue[ 1 ] !== '' ) {
                    semanticMaxValue = Number( this.semanticSearchValue[ 1 ] );
                }

                result = {
                    key: this.semanticValue,
                    operator: SemanticOperator.InRange,
                    value: [semanticMinValue, semanticMaxValue]
                };
                break;
            case SemanticOperator.InList:

                result = {
                    key: this.semanticValue,
                    operator: SemanticOperator.InList,
                    value: this.selectedSemanticTypeListValues
                };
                break;
        }

        return result;
    }

    /**
     * Флаг выбора фильтра по семантике
     * @property selected {boolean}
     */
    get selected() {
        if ( this.semanticSearchValue.length === 0 ) {
            return false;
        }

        if ( this.isRangeType && (!this.semanticSearchValue[ 0 ] && !this.semanticSearchValue[ 1 ]) ) {
            return false;
        }

        if ( this.isContainsType && !this.semanticSearchValue[ 0 ] ) {
            return false;
        }

        return true;
    }

    /**
     * Проверить попадание в контекстный поиск
     * @method checkContextSearch
     * @param searchValue {string}
     * @return {boolean} Флаг попадания в контекстный поиск
     */
    checkContextSearch( searchValue: string ) {
        return !searchValue || this.semanticName.toLowerCase().includes( searchValue.toLowerCase() );
    }
}
