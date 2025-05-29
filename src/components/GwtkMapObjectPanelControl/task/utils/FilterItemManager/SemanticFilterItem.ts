/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Класс фильтра по семантикам                   *
 *                                                                  *
 *******************************************************************/

import { StatisticSemantic } from '~/services/Search/mappers/GISWebServiceSEMapper';
import Layer from '~/maplayers/Layer';
import { SemanticCriterion, SemanticOperator } from '~/services/Search/criteria/SemanticSearchCriterion';
import { RscSemantic } from '~/services/RequestServices/RestService/Types';
import { ClassifierTypeSemantic, ClassifierTypeSemanticValue } from '~/classifier/Classifier';

/**
 * Класс фильтра по семантикам
 * @class SemanticFilterItem
 */
export default class SemanticFilterItem {

    /**
     * Список семантик слоя классификатора
     * @private
     * @readonly
     * @property layerSemanticList {array}
     */
    private readonly layerSemanticList: { name: string; alias: string; rscsemantic: RscSemantic[] }[] = [];

    /**
     * Cписок семантик классификатора
     * @private
     * @readonly
     * @property classifierSemanticList {object|undefined}
     */
    private readonly classifierSemanticList: ClassifierTypeSemantic[] = [];


    /**
     * Текст заполненного значения
     * @private
     * @property semanticFilledValue {string}
     */
    private get semanticFilledValue() {
        let semanticFilledValue = '';

        switch ( this.semanticType ) {
            case SemanticOperator.ContainsValue:
                semanticFilledValue = this.semanticSearchValue[ 0 ] as string;
                break;
            case SemanticOperator.InRange:
                let semanticSearchDataMinValue = '--';
                let semanticSearchDataMaxValue = '--';

                if ( this.semanticSearchValue[ 0 ] && this.semanticSearchValue[ 0 ] !== '' ) {
                    semanticSearchDataMinValue = this.semanticSearchValue[ 0 ] as string;
                }
                if ( this.semanticSearchValue[ 1 ] && this.semanticSearchValue[ 1 ] !== '' ) {
                    semanticSearchDataMaxValue = this.semanticSearchValue[ 1 ] as string;
                }
                // semanticFilledValue = semanticSearchDataMinValue + ' ' + this.$t( 'phrases.to' ) + ' ' + semanticSearchDataMaxValue;
                semanticFilledValue = semanticSearchDataMinValue + ' ' + 'до' + ' ' + semanticSearchDataMaxValue;
                break;
            case SemanticOperator.InList:
                semanticFilledValue = this.selectedSemanticTypeListValues.join( ',' );
                break;
        }

        return semanticFilledValue;
    }

    /**
     * Видимость фильтра
     * @property visible {boolean}
     */
    visible = true;

    /**
     * Полное название семантики
     * @property name {string}
     */
    get name() {
        return this.semanticName + ': ' + this.semanticFilledValue;
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
        return this.semantic.value;
    }

    /**
     * Список слоев классификатора с данной семантикой
     * @property semanticValue {string[]}
     */
    get semanticObjectsTypes() {
        const typesList: string[] = [];

        if ( this.layerSemanticList ) {
            this.layerSemanticList.forEach( layerSemantic => {
                for ( let semanticIndex = 0; semanticIndex < layerSemantic.rscsemantic.length; semanticIndex++ ) {
                    if ( layerSemantic.rscsemantic[ semanticIndex ].shortname === this.semanticValue ) {
                        typesList.push( layerSemantic.name );
                        break;
                    }
                }
            } );
        }

        return typesList;
    }

    /**
     * Тип семантики
     * @property semanticValue {SemanticOperator}
     */
    get semanticType() {
        let typeValue = SemanticOperator.ContainsValue;

        if ( this.layerSemanticList ) {
            for ( let layerSemanticsListIndex = 0; layerSemanticsListIndex < this.layerSemanticList.length; layerSemanticsListIndex++ ) {
                const layerSemantics = this.layerSemanticList[ layerSemanticsListIndex ];

                const rscsemantic = layerSemantics.rscsemantic.find( semantic => semantic.shortname === this.semanticValue );

                if ( rscsemantic ) {
                    const layerSemanticTypeValue = Number( rscsemantic.type );

                    if ( layerSemanticTypeValue === 1 ) {
                        typeValue = SemanticOperator.InRange;
                    } else if ( layerSemanticTypeValue === 16 ) {
                        typeValue = SemanticOperator.InList;
                    }
                    break;
                }
            }
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
        let valuesList: ClassifierTypeSemanticValue[] = [];

        if ( this.classifierSemanticList && this.semanticType === SemanticOperator.InList ) {
            const classifierSemantics = this.classifierSemanticList.find( ( classifierSemantic: ClassifierTypeSemantic ) => classifierSemantic.key === this.semanticValue );

            if ( classifierSemantics ) {
                valuesList = [...valuesList, ...classifierSemantics.reference];
            }
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

        this.semanticTypeListValues.forEach( ( semanticTypeListValue: { name: string; }, index: number ) => {
            if ( this.semanticSearchValue.includes( index ) ) {
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
     * @property selected {booleean}
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
        //
        // return !(((this.semanticSearchValue.length > 0 && this.isRangeType && this.semanticSearchValue[ 0 ] === '' && this.semanticSearchValue[ 1 ] === '') ||
        //     (this.semanticSearchValue.length > 0 && this.isContainsType && this.semanticSearchValue[ 0 ] === '') ||
        //     (this.semanticSearchValue.length === 0 && this.isListType)) || this.semanticSearchValue.length === 0);
    }

    set selected( value: boolean ) {
        if ( !value ) {
            switch ( this.semanticType ) {
                case SemanticOperator.ContainsValue:
                    this.semanticSearchValue[ 0 ] = '';
                    break;
                case SemanticOperator.InRange:

                    this.semanticSearchValue[ 0 ] = '';
                    this.semanticSearchValue[ 1 ] = '';
                    break;
                case SemanticOperator.InList:
                    this.semanticSearchValue.splice( 0 );
                    break;
            }
        }
    }

    /**
     * @constructor SemanticFilterItem
     * @param semantic {StatisticSemantic} Описание из статистики
     * @param layerIds {string} Список идентификаторов карт в виде строки
     * @param layerNames {string} Список названий карт в виде строки
     * @param selectableLayerList {Layer[]} Список карт доступных для выброа объектов
     * @param [semanticSearchValue] {array} Заполненные значения семантик
     */
    constructor(
        private readonly semantic: StatisticSemantic,
        public readonly layerIds: string,
        public readonly layerNames: string,
        selectableLayerList: Layer[],
        public semanticSearchValue: (string | number | null)[] = []
    ) {

        for ( let selectableLayerListNumber = 0; selectableLayerListNumber < selectableLayerList.length; selectableLayerListNumber++ ) {
            const classifier = selectableLayerList[ selectableLayerListNumber ].classifier;
            if ( classifier ) {
                //TODO: ???? что делать, если несколько классификаторов? пока что добавляем все, что есть
                classifier.getClassifierLayerSemanticsList().then( layerSemanticList => this.layerSemanticList.splice( 0, 0, ...layerSemanticList ) );
                classifier.getClassifierSemantics().then( classifierSemanticList => this.classifierSemanticList.splice( 0, 0, ...classifierSemanticList ) );
            }
        }
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

    /**
     * Переключить состояние видимости
     * @method toggleVisible
     * @param value {boolean} Флаг состояния
     */
    toggleVisible( value: boolean ) {
        this.visible = value;
        if ( !value ) {
            this.selected = false;
        }
    }

}
