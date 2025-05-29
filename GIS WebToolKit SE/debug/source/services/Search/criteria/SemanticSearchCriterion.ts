/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Критерии поиска по семантике                      *
 *                                                                  *
 *******************************************************************/

import { SimpleJson } from '~/types/CommonTypes';
import { BaseSearchCriterion, SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';

export enum SemanticOperator {
    ContainsValue,  //текстовый
    InRange,        //цифровой
    InList          //классификатор
}

export type SemanticCriterion =
    {
        key: string;
        operator: SemanticOperator.ContainsValue;
        value: string;
    } |
    {
        key: string;
        operator: SemanticOperator.InRange;
        value: [number | undefined, number | undefined];
    } |
    {
        key: string;
        operator: SemanticOperator.InList;
        value: string[];
    };

export type SemanticSearchCriterionType = {
    readonly name: SearchCriterionName.Semantic;
    data: {
        semanticCriterionList: SemanticCriterion[];
        disjunction: boolean;
    };
}

enum LogicalOperator {
    OR = 'OR',
    AND = 'AND'
}

export type FilterComparisonOperators = {
    [ logic: string ]: SimpleJson<SimpleJson[]>[];
};

export type SemanticFilters = {
    Filter: FilterComparisonOperators;
};

/**
 * Критерий поиска по семантике
 * @class SemanticSearchCriterion
 * @extends BaseSearchCriterion
 */
export class SemanticSearchCriterion extends BaseSearchCriterion<SemanticSearchCriterionType> {

    readonly name = SearchCriterionName.Semantic;

    private readonly semanticCriterionList: { [ key: number ]: SemanticCriterion } = {};

    criteriaCount = 0;

    private disjunction = false;

    /**
     * Установить признак объединения условий
     * @method setLogicalDisjunction
     * @param value {boolean} Признак объединения результатов (`true` = ИЛИ )
     */
    setLogicalDisjunction( value: boolean ) {
        this.disjunction = value;
    }

    /**
     * Добавить критерий семантики
     * @method addSemanticCriterion
     * @param value {string} Значение семантики
     * @return {number} Идентификтатор доступа к критерию семантики
     */
    addSemanticCriterion(value: SemanticCriterion | SemanticCriterion[] ) {
        const criteriaIdentifier = this.criteriaCount;

        if (!Array.isArray(value)) {
            this.semanticCriterionList[criteriaIdentifier] = value;
        }

        this.criteriaCount++;

        return criteriaIdentifier;
    }

    fromJSON(filter: FilterComparisonOperators ) {
        let key = '';

        if (filter.AND) {
            this.disjunction = false;
            key = LogicalOperator.AND;
        } else if (filter.OR) {
            this.disjunction = true;
            key = LogicalOperator.OR;
        }
        if (key === '') {
            return;
        }
        for (let j = 0; j < filter[key].length; j++) {
            let semanticOperator = SemanticOperator.ContainsValue;
            let semanticOperatorText = Object.keys(filter[key][j])[0];
            for (let k = 0; k < filter[key][j][semanticOperatorText].length; k++) {
                const semanticKey = filter[key][j][semanticOperatorText][k].PropertyName;
                const semanticValue = filter[key][j][semanticOperatorText][k].Literal;
                const semanticCriterion: SemanticCriterion = {
                    key: semanticKey,
                    operator: semanticOperator,
                    value: semanticValue
                };
                this.addSemanticCriterion(semanticCriterion);
            }
        }
    }

    /**
     * Удалить критерий семантики
     * @method removeSemanticCriterion
     * @param criteriaId {number} Идентификатор доступа к критерию семантики
     */
    removeSemanticCriterion( criteriaId: number ) {
        delete this.semanticCriterionList[ criteriaId ];
    }

    getContent() {

        const semanticCriterionList: SemanticCriterion[] = [];

        for ( const index in this.semanticCriterionList ) {
            const semanticCriterion = this.semanticCriterionList[ index ];
            semanticCriterionList.push( semanticCriterion );
        }

        return { semanticCriterionList, disjunction: this.disjunction };
    }

    join( criteria: SemanticSearchCriterion ) {
        const newSemanticSearchCriterion = this.copy();
        for ( const key in criteria.semanticCriterionList ) {
            const semanticCriterion = criteria.semanticCriterionList[ key ];
            const existSemanticCriterion = newSemanticSearchCriterion.semanticCriterionList[ key ];
            if ( existSemanticCriterion ) {
                if ( semanticCriterion.key === existSemanticCriterion.key
                    || semanticCriterion.operator === existSemanticCriterion.operator
                    || semanticCriterion.value === existSemanticCriterion.value ) {
                    continue;
                }
            }
            newSemanticSearchCriterion.addSemanticCriterion( semanticCriterion );
        }

        return newSemanticSearchCriterion;
    }

    copy() {
        const result = new SemanticSearchCriterion();
        for ( const key in this.semanticCriterionList ) {
            const semanticCriterion = this.semanticCriterionList[ key ];
            result.semanticCriterionList[ key ] = { ...semanticCriterion };
        }
        result.disjunction = this.disjunction;
        result.criteriaCount = this.criteriaCount;

        return result;
    }

    equals( other: SemanticSearchCriterion ) {

        let result = (this.disjunction === other.disjunction) && (this.criteriaCount === other.criteriaCount);
        if ( result ) {
            for ( const key in this.semanticCriterionList ) {
                const semanticCriterion = this.semanticCriterionList[ key ];
                const otherSemanticCriterion = other.semanticCriterionList[ key ];
                if ( !otherSemanticCriterion ||
                    semanticCriterion.key !== otherSemanticCriterion.key ||
                    semanticCriterion.operator !== otherSemanticCriterion.operator ||
                    semanticCriterion.value !== otherSemanticCriterion.value
                ) {
                    result = false;
                    break;
                }

            }
        }

        return result;
    }
}

export type TextSearchCriterionType = {
    readonly name: SearchCriterionName.Text;
    data: SemanticSearchCriterionType['data'];
}

/**
 * Критерий текстового поиска
 * @class TextSearchCriterion
 * @extends BaseSearchCriterion
 */
export class TextSearchCriterion extends BaseSearchCriterion<TextSearchCriterionType> {

    readonly name = SearchCriterionName.Text;

    private semanticSearchCriterion = new SemanticSearchCriterion();

    private readonly textSearchKeys: SimpleJson<{ index: number; text: string }> = {};

    private textSearchKeysCount = 0;

    /**
     * Добавить семантику текстового поиска
     * @method addTextSearchKey
     * @param keys {string[]} Массив ключей семантик
     * @param [text] {string} Значение для поиска
     */
    addTextSearchKey( keys: string[], text: string = '' ) {
        for ( let i = 0; i < keys.length; i++ ) {
            const key = keys[ i ];

            if ( this.textSearchKeys[ key ] === undefined ) {
                const index = this.semanticSearchCriterion.addSemanticCriterion( {
                    key,
                    operator: SemanticOperator.ContainsValue,
                    value: text
                } );
                this.textSearchKeys[ key ] = { index, text };
                this.textSearchKeysCount++;
                this.semanticSearchCriterion.setLogicalDisjunction( this.textSearchKeysCount > 1 );
            } else {
                this.textSearchKeys[ key ].text = text;
            }
        }
    }

    /**
     * Удалить семантику текстового поиска
     * @method removeTextSearchKey
     * @param key {string} Ключ семантики текстового поиска
     */
    removeTextSearchKey( key: string ) {
        if ( this.textSearchKeys[ key ] !== undefined ) {
            this.semanticSearchCriterion.removeSemanticCriterion( this.textSearchKeys[ key ].index );
            delete this.textSearchKeys[ key ];
            this.textSearchKeysCount--;
            this.semanticSearchCriterion.setLogicalDisjunction( this.textSearchKeysCount > 1 );
        }
    }

    getContent() {
        return this.semanticSearchCriterion.getContent();
    }

    copy() {
        const result = new TextSearchCriterion();
        result.semanticSearchCriterion = this.semanticSearchCriterion.copy();
        result.textSearchKeysCount = this.textSearchKeysCount;
        for ( const key in this.textSearchKeys ) {
            result.textSearchKeys[ key ] = this.textSearchKeys[ key ];
        }
        return result;
    }

    join( criteria: TextSearchCriterion ) {
        const result = this.copy();
        for ( const key in criteria.textSearchKeys ) {
            const { text } = criteria.textSearchKeys[ key ];
            result.addTextSearchKey( [key], text );
        }
        return result;
    }

    equals( other: TextSearchCriterion ) {

        let result = this.semanticSearchCriterion.equals( other.semanticSearchCriterion ) && this.textSearchKeysCount === other.textSearchKeysCount;
        if ( result ) {
            for ( const key in this.textSearchKeys ) {
                if ( this.textSearchKeys[ key ] !== other.textSearchKeys[ key ] ) {
                    result = false;
                    break;
                }
            }
        }
        return result;
    }
}

export type StringForSearchInResultType = {
    readonly name: SearchCriterionName.StringForSearchInResult;
    data: string;
}

export class StringForSearchInResultCriterion extends BaseSearchCriterion<StringForSearchInResultType> {
    readonly name = SearchCriterionName.StringForSearchInResult;

    protected value = '';

    getContent() {
        return this.value;
    }

    /**
     * Установить значение
     * @method setValue
     * @param value {string} Значение для поиска
     */
    setValue( value: string ) {
        this.value = value;
    }

    copy() {
        const result = new StringForSearchInResultCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: StringForSearchInResultCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals(other: StringForSearchInResultCriterion ) {
        return this.value === other.value;
    }
}
