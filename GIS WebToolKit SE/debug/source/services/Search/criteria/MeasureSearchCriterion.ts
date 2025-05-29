/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Критерии поиска по измерениям                     *
 *                                                                  *
 *******************************************************************/

import { BaseSearchCriterion, SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';

export enum MeasureOperator {
    NotEquals = '!=',
    Equals = '=',
    More = '>',
    NotLess = '>=',
    Less = '<',
    NotMore = '<='
}

export enum MeasureRangeOperators {
    More = '>',
    NotLess = '>=',
    Less = '<',
    NotMore = '<='
}

export enum MeasureName {
    Length = 'LENGTH',
    Square = 'SQUARE',
    Height = 'HEIGHT',
    Perimeter = 'PERIMETER'
}

export enum MeasureCriterionType {
    Simple,
    Range
}

export enum LogicOperation {
    Or,
    And
}

export type MeasureCriterion =
    {
        name: MeasureName;
        type: MeasureCriterionType.Simple;
        operator: MeasureOperator;
        value: number;
    } |
    {
        name: MeasureName;
        type: MeasureCriterionType.Range;
        operator: MeasureOperator[];
        value: number[];
    };

export type MeasureSearchCriterionType = {
    readonly name: SearchCriterionName.MeasureFilter;
    data: {
        measureCriterionList: MeasureCriterion[];
        disjunction: boolean;
    };
}

/**
 * Критерий поиска по измерениям
 * @class SemanticSearchCriterion
 * @extends BaseSearchCriterion
 */
export class MeasureSearchCriterion extends BaseSearchCriterion<MeasureSearchCriterionType> {

    readonly name = SearchCriterionName.MeasureFilter;

    private readonly measureCriterionList: MeasureCriterion[] = [];

    private disjunction = true;

    /**
     * Установить признак объединения условий
     * @property setLogicOperation
     * @param value {LogicOperation.Or/LogicOperation.And} Операнд объединения условий
     */
    setLogicOperation( value: LogicOperation ) {
        this.disjunction = (value === LogicOperation.Or);
    }

    /**
     * Количество условий в списке
     * @property criteriaCount
     * @returns {number}
     */
    get criteriaCount() {
        return this.measureCriterionList.length;
    }

    /**
     * Добавить критерий поиска
     * @method addCriterion
     * @param criterion {MeasureCriterion} Значение критерия
     * @return {number} Номер критерия в списке
     */
    addCriterion( criterion: MeasureCriterion ) {
        const existence = this.measureCriterionList.filter( item => item.name === criterion.name && item.type === criterion.type );
        if ( existence ) {
            for ( const exist of existence ) {
                if ( MeasureSearchCriterion.isCriterionEqualTo( exist, criterion ) ) {
                    return this.measureCriterionList.indexOf( exist );
                }
            }
        }
        this.measureCriterionList.push( criterion );
        return (this.criteriaCount - 1);
    }

    /**
     * Удалить критерий
     * @method removeCriterion
     * @param index {number} номер критерия в списке
     */
    removeCriterion( index: number ) {
        if ( index < this.criteriaCount ) {
            this.measureCriterionList.splice( index, 1 );
        }
    }

    getContent() {
        const measureCriterionList: MeasureCriterion[] = [];
        measureCriterionList.push( ...this.measureCriterionList );
        let disjunction = true;
        if ( this.criteriaCount > 1 ) {
            disjunction = this.disjunction;
        }
        return { measureCriterionList, disjunction };
    }

    join( criteria: MeasureSearchCriterion ) {

        const union = new Set<MeasureCriterion>( this.measureCriterionList );
        for ( const listItem of criteria.measureCriterionList ) {
            union.add( listItem );
        }
        const result = this.copy();
        result.measureCriterionList.splice( 0 );
        result.measureCriterionList.push( ...Array.from( union ) );
        return result;
    }

    copy() {
        const result = new MeasureSearchCriterion();
        result.measureCriterionList.push( ...this.measureCriterionList );
        result.disjunction = this.disjunction;

        return result;
    }

    equals( other: MeasureSearchCriterion ) {

        let result = (this.criteriaCount === other.criteriaCount) && (this.disjunction === other.disjunction);
        if ( result ) {
            const union = this.join( other );
            result = (union.criteriaCount === this.criteriaCount);
        }

        return result;
    }

    private static isCriterionEqualTo( src: MeasureCriterion, target: MeasureCriterion ) {
        if ( src.name !== target.name || src.type !== target.type ) {
            return false;
        }
        let srcValue = '';
        let targetValue = '';
        switch ( src.type ) {
            case MeasureCriterionType.Range:
                srcValue = src.value.join( ',' );
                if ( Array.isArray( target.value ) ) {
                    targetValue = target.value.join( ',' );
                }
                break;
            case MeasureCriterionType.Simple:
                targetValue = '' + target.operator + ' ' + target.value;
                srcValue = '' + src.operator + ' ' + src.value;
                break;
        }
        return (srcValue === targetValue);
    }
}
