/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Критерии формата ответа                        *
 *                                                                  *
 *******************************************************************/

import { BaseSearchCriterion, SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';
import { GETFRAME, OBJCENTER, OUTTYPE, METRIC } from '~/services/RequestServices/common/enumerables';
import { GetFeatureParams } from '~/services/RequestServices/RestService/Types';
import { Bounds } from '~/geometry/Bounds';

export type ObjectCenterSearchCriterionType = {
    readonly name: SearchCriterionName.ObjectCenter;
    data: OBJCENTER;
}

/**
 * Критерий определения центра объекта
 * @class ObjectCenterSearchCriterion
 * @extends BaseSearchCriterion
 */
export class ObjectCenterSearchCriterion extends BaseSearchCriterion<ObjectCenterSearchCriterionType> {
    readonly name = SearchCriterionName.ObjectCenter;

    protected value: OBJCENTER = OBJCENTER.ObjectCenter;

    /**
     * Установить значение
     * @method setValue
     * @param value {OBJCENTER} Задание центра объекта
     */
    setValue( value: OBJCENTER ) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new ObjectCenterSearchCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: ObjectCenterSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals( other: ObjectCenterSearchCriterion ) {
        return this.value === other.value;
    }
}

export type FrameCenterSearchCriterionType = {
    readonly name: SearchCriterionName.Frame;
    data: GETFRAME;
}

/**
 * Критерий вывода габаритов объекта
 * @class FrameSearchCriterion
 * @extends BaseSearchCriterion
 */
export class FrameSearchCriterion extends BaseSearchCriterion<FrameCenterSearchCriterionType> {
    readonly name = SearchCriterionName.Frame;

    protected value: GETFRAME = GETFRAME.AddObjectBounds;

    /**
     * Установить значение
     * @method setValue
     * @param value {GETFRAME} Флаг вывода габаритов
     */
    setValue( value: GETFRAME ) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new FrameSearchCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: FrameSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals( other: FrameSearchCriterion ) {
        return this.value === other.value;
    }
}

export type OutTypeCenterSearchCriterionType = {
    readonly name: SearchCriterionName.OutType;
    data: OUTTYPE;
}

/**
 * Критерий формата вывода
 * @class OutTypeSearchCriterion
 * @extends BaseSearchCriterion
 */
export class OutTypeSearchCriterion extends BaseSearchCriterion<OutTypeCenterSearchCriterionType> {
    readonly name = SearchCriterionName.OutType;

    protected value: OUTTYPE = OUTTYPE.JSON;

    /**
     * Установить значение
     * @method setValue
     * @param value {OUTTYPE} Формат результата
     */
    setValue( value: OUTTYPE ) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new OutTypeSearchCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: OutTypeSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals( other: OutTypeSearchCriterion ) {
        return this.value === other.value;
    }
}

export type AreaCenterSearchCriterionType = {
    readonly name: SearchCriterionName.Area;
    data: '1' | undefined;
}

/**
 * Критерий вывода площади объекта
 * @class AreaSearchCriterion
 * @extends BaseSearchCriterion
 */
export class AreaSearchCriterion extends BaseSearchCriterion<AreaCenterSearchCriterionType> {
    readonly name = SearchCriterionName.Area;

    protected value: AreaCenterSearchCriterionType['data'];

    /**
     * Установить значение
     * @method setValue
     * @param value {string} Флаг вывода площади
     */
    setValue( value: AreaCenterSearchCriterionType['data'] ) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new AreaSearchCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: AreaSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals( other: AreaSearchCriterion ) {
        return this.value === other.value;
    }
}

export type BboxSearchCriterionType = {
    readonly name: SearchCriterionName.Bbox;
    data: [number, number, number, number];
}


/**
 * Критерий ограничения по габаритам
 * @class BboxSearchCriterion
 * @extends BboxSearchCriterion
 */
export class BboxSearchCriterion extends BaseSearchCriterion<BboxSearchCriterionType> {
    readonly name = SearchCriterionName.Bbox;
    protected value = [0, 0, 0, 0] as BboxSearchCriterionType['data'];

    /**
     * Добавить значения
     * @method addValue
     * @param newValue {Bounds} Габариты
     */
    setValue( newValue: Bounds ) {

        const min = newValue.min.toOrigin();
        const max = newValue.max.toOrigin();

        this.value[ 0 ] = min[ 0 ];
        this.value[ 1 ] = min[ 1 ];
        this.value[ 2 ] = max[ 0 ];
        this.value[ 3 ] = max[ 1 ];
    }

    /**
     * Очистить критерий
     * @method clearValue
     */
    clearValue() {
        for ( let i = 0; i < this.value.length; i++ ) {
            this.value[ i ] = 0;
        }
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new BboxSearchCriterion();
        result.value = this.value.slice() as BboxSearchCriterionType['data'];
        return result;
    }

    join( criteria: BboxSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value.slice() as BboxSearchCriterionType['data'];
        return newCreateSearchCriterion;
    }

    equals( other: BboxSearchCriterion ) {
        let result = this.value.length === other.value.length;
        if ( result ) {
            for ( let i = 0; i < this.value.length; i++ ) {
                if ( this.value[ i ] !== other.value[ i ] ) {
                    result = false;
                    break;
                }
            }
        }
        return result;
    }

}


export type SrsNameSearchCriterionType = {
    readonly name: SearchCriterionName.SrsName;
    data: string;
}

/**
 * Критерий кода системы координат
 * @class SrsNameSearchCriterion
 * @extends BaseSearchCriterion
 */
export class SrsNameSearchCriterion extends BaseSearchCriterion<SrsNameSearchCriterionType> {
    readonly name = SearchCriterionName.SrsName;

    protected value = '';

    /**
     * Установить значение
     * @method setValue
     * @param value {string} Флаг вывода площади
     */
    setValue( value: string ) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new SrsNameSearchCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: SrsNameSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals( other: SrsNameSearchCriterion ) {
        return this.value === other.value;
    }
}

export type LatLongSearchCriterionType = {
    readonly name: SearchCriterionName.LatLong;
    data: GetFeatureParams['LATLONG'];
}

/**
 * Критерий порядка следования координат
 * @class LatLongSearchCriterion
 * @extends BaseSearchCriterion
 */
export class LatLongSearchCriterion extends BaseSearchCriterion<LatLongSearchCriterionType> {
    readonly name = SearchCriterionName.LatLong;

    protected value: LatLongSearchCriterionType['data'];

    /**
     * Установить значение
     * @method setValue
     * @param value {string} Флаг вывода площади
     */
    setValue( value: LatLongSearchCriterionType['data'] ) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new LatLongSearchCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: LatLongSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals( other: LatLongSearchCriterion ) {
        return this.value === other.value;
    }
}

export type FindDirectionCriterionType = {
    readonly name: SearchCriterionName.FindDirection;
    data: GetFeatureParams['FINDDIRECTION'];
}

/**
 * Критерий определения напрвления резульатов (по убыванию \ по возрастанию)
 * @class FindDirectionCriterion
 * @extends BaseSearchCriterion
 */
export class FindDirectionCriterion extends BaseSearchCriterion<FindDirectionCriterionType> {
    readonly name = SearchCriterionName.FindDirection;

    protected value: FindDirectionCriterionType['data'];

    /**
     * Установить значение
     * @method setValue
     * @param value {string} Флаг вывода площади
     */
    setValue(value: FindDirectionCriterionType['data']) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new FindDirectionCriterion();
        result.value = this.value;
        return result;
    }

    join(criteria: FindDirectionCriterion) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals(other: FindDirectionCriterion) {
        return this.value === other.value;
    }
}

export type SemSortKeyType = {
    readonly name: SearchCriterionName.SemSortKey;
    data: GetFeatureParams['SEMSORTKEY'];
}

/**
 * Критерий определения ключа фильтрации по семантике
 * @class SemSortKey
 * @extends BaseSearchCriterion
 */
export class SemSortKey extends BaseSearchCriterion<SemSortKeyType> {
    readonly name = SearchCriterionName.SemSortKey;

    protected value: SemSortKeyType['data'];

    /**
     * Установить значение
     * @method setValue
     * @param value {string} Флаг вывода площади
     */
    setValue(value: SemSortKeyType['data']) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new SemSortKey();
        result.value = this.value;
        return result;
    }

    join(criteria: SemSortKey) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals(other: SemSortKey) {
        return this.value === other.value;
    }
}

export type SortKeyType = {
    readonly name: SearchCriterionName.SortKey;
    data: {type: string, value: string} | undefined;
}

/**
 * Критерий определения ключа фильтрации
 * @class SortKey
 * @extends BaseSearchCriterion
 */
export class SortKey extends BaseSearchCriterion<SortKeyType> {
    readonly name = SearchCriterionName.SortKey;

    protected value: SortKeyType['data'];

    /**
     * Установить значение
     * @method setValue
     * @param value {string} Флаг вывода площади
     */
    setValue(value: SortKeyType['data']) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new SortKey();
        result.value = this.value;
        return result;
    }

    join(criteria: SortKey) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals(other: SortKey) {
        return this.value === other.value;
    }
}

export type FindInPointSearchCriterionType = {
    readonly name: SearchCriterionName.FindInPoint;
    data: '1' | undefined;
}

/**
 * Критерий поиска в точке
 * @class FindInPointSearchCriterion
 * @extends BaseSearchCriterion
 */
export class FindInPointSearchCriterion extends BaseSearchCriterion<FindInPointSearchCriterionType> {
    readonly name = SearchCriterionName.FindInPoint;

    protected value: FindInPointSearchCriterionType['data'];

    /**
     * Установить значение
     * @method setValue
     * @param value {string} Флаг уточненного поиска в точке
     */
    setValue( value: FindInPointSearchCriterionType['data'] ) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new FindInPointSearchCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: FindInPointSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals( other: FindInPointSearchCriterion ) {
        return this.value === other.value;
    }
}


export type MetricCriterionType = {
    readonly name: SearchCriterionName.Metric;
    data: METRIC | undefined;
}

/**
 * Критерий вывода метрики
 * @class MetricCriterion
 * @extends BaseSearchCriterion
 */
export class MetricCriterion extends BaseSearchCriterion<MetricCriterionType> {
    readonly name = SearchCriterionName.Metric;

    protected value: MetricCriterionType['data'];

    /**
     * Установить значение
     * @method setValue
     * @param value {string} Флаг вывода метрики
     */
    setValue( value: MetricCriterionType['data'] ) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new MetricCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: MetricCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals( other: MetricCriterion ) {
        return this.value === other.value;
    }
}


export type GetGraphObjectsCriterionType = {
    readonly name: SearchCriterionName.GetGraphObjects;
    data: '0' | '1' | undefined;
}

/**
 * Критерий вывода графических объектов
 * @class GetGraphObjectsCriterion
 * @extends BaseSearchCriterion
 */
export class GetGraphObjectsCriterion extends BaseSearchCriterion<GetGraphObjectsCriterionType> {
    readonly name = SearchCriterionName.GetGraphObjects;

    protected value: GetGraphObjectsCriterionType['data'];

    /**
     * Установить значение
     * @method setValue
     * @param value {string} Флаг вывода площади
     */
    setValue( value: GetGraphObjectsCriterionType['data'] ) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new GetGraphObjectsCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: GetGraphObjectsCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals( other: GetGraphObjectsCriterion ) {
        return this.value === other.value;
    }
}
