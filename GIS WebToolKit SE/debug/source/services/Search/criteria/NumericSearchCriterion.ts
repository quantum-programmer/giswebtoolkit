/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Числовые критерии поиска                      *
 *                                                                  *
 *******************************************************************/

import { BaseSearchCriterion, SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';

export type NumericCriterionName =
    SearchCriterionName.Count
    | SearchCriterionName.StartIndex
    | SearchCriterionName.ObjectScale
    | SearchCriterionName.GetGraphObjects
    | SearchCriterionName.MultyLevelGeometry;
export type NumericSearchCriterionType<T extends NumericCriterionName> = {
    readonly name: T;
    data: number;
}

/**
 * Базовый числовой критерий поиска
 * @abstract
 * @class NumericSearchCriterion
 * @extends BaseSearchCriterion
 */
export abstract class NumericSearchCriterion<T extends NumericCriterionName> extends BaseSearchCriterion<NumericSearchCriterionType<T>> {
    abstract readonly name: T;

    protected value = 0;

    /**
     * Установить значение
     * @method setValue
     * @param value {number} Числовое значение
     */
    setValue( value: number ) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    equals( other: NumericSearchCriterion<T> ) {
        return this.value === other.value;
    }

    abstract copy(): NumericSearchCriterion<T>;

    abstract join( criteria: NumericSearchCriterion<T> ): NumericSearchCriterion<T>;
}

/**
 * Критерий ограничения количества записей в ответе
 * @class CountSearchCriterion
 * @extends NumericSearchCriterion
 */
export class CountSearchCriterion extends NumericSearchCriterion<SearchCriterionName.Count> {
    readonly name = SearchCriterionName.Count;

    copy() {
        const result = new CountSearchCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: CountSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = Math.min( newCreateSearchCriterion.value, criteria.value );
        return newCreateSearchCriterion;
    }
}

/**
 * Критерий начального индекса элемента в ответе
 * @class StartIndexSearchCriterion
 * @extends NumericSearchCriterion
 */
export class StartIndexSearchCriterion extends NumericSearchCriterion<SearchCriterionName.StartIndex> {
    readonly name = SearchCriterionName.StartIndex;

    copy() {
        const result = new StartIndexSearchCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: StartIndexSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }
}

/**
 * Критерий масштаба видимости объектов
 * @class ObjectScaleSearchCriterion
 * @extends NumericSearchCriterion
 */
export class ObjectScaleSearchCriterion extends NumericSearchCriterion<SearchCriterionName.ObjectScale> {
    readonly name = SearchCriterionName.ObjectScale;

    copy() {
        const result = new ObjectScaleSearchCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: ObjectScaleSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }
}

/**
 * Критерий масштаба видимости объектов
 * @class MultiLevelGeometrySearchCriterion
 * @extends NumericSearchCriterion
 */
export class MultiLevelGeometrySearchCriterion extends NumericSearchCriterion<SearchCriterionName.MultyLevelGeometry> {
    readonly name = SearchCriterionName.MultyLevelGeometry;

    copy() {
        const result = new MultiLevelGeometrySearchCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: MultiLevelGeometrySearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }
}
