/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Критерии поиска в виде массивов строк              *
 *                                                                  *
 *******************************************************************/

import { BaseSearchCriterion, SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';

export type StringArrayCriterionName = SearchCriterionName.ObjectLocal
    | SearchCriterionName.TypeNames
    | SearchCriterionName.CodeList
    | SearchCriterionName.KeyList
    | SearchCriterionName.IdList
    | SearchCriterionName.SemList;

export type StringArraySearchCriterionType<T extends StringArrayCriterionName> = {
    readonly name: T;
    data: string[];
}

/**
 * Базовый критерий поиска в виде массивов строк
 * @abstract
 * @class StringArraySearchCriterion
 * @extends BaseSearchCriterion
 */
export abstract class StringArraySearchCriterion<T extends StringArrayCriterionName> extends BaseSearchCriterion<StringArraySearchCriterionType<T>> {
    abstract readonly name: T;

    protected value: string[] = [];

    /**
     * Добавить значения
     * @method addValue
     * @param newValue {string...} Набор строк
     */
    addValue( ...newValue: string[] ) {
        for ( let i = 0; i < newValue.length; i++ ) {
            if ( this.value.indexOf( newValue[ i ] ) === -1 ) {
                this.value.push( newValue[ i ] );
            }
        }
    }

    /**
     * Удалить значение
     * @method removeValue
     * @param value {string} Строка для удаления
     */
    removeValue( value: string ) {
        const index = this.value.indexOf( value );
        if ( index !== -1 ) {
            this.value.splice( index, 1 );
        }
    }

    /**
     * Очистить критерий
     * @method clearValue
     */
    clearValue() {
        this.value.length = 0;
    }

    getContent() {
        return this.value;
    }

    equals( other: StringArraySearchCriterion<T> ) {
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

    abstract copy(): StringArraySearchCriterion<T>;

    abstract join( criteria: StringArraySearchCriterion<T> ): StringArraySearchCriterion<T>;
}

/**
 * Критерий ограничения по локализацияям
 * @class ObjectLocalSearchCriterion
 * @extends StringArraySearchCriterion
 */
export class ObjectLocalSearchCriterion extends StringArraySearchCriterion<SearchCriterionName.ObjectLocal> {
    readonly name = SearchCriterionName.ObjectLocal;

    copy() {
        const result = new ObjectLocalSearchCriterion();
        result.value = this.value.slice();
        return result;
    }

    join( criteria: ObjectLocalSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value.slice();
        return newCreateSearchCriterion;
    }
}

/**
 * Критерий ограничения по слоям классификатора
 * @class TypeNamesSearchCriterion
 * @extends StringArraySearchCriterion
 */
export class TypeNamesSearchCriterion extends StringArraySearchCriterion<SearchCriterionName.TypeNames> {
    readonly name = SearchCriterionName.TypeNames;

    copy() {
        const result = new TypeNamesSearchCriterion();
        result.value = this.value.slice();
        return result;
    }

    join( criteria: TypeNamesSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value.slice();
        return newCreateSearchCriterion;
    }
}

/**
 * Критерий ограничения по значению семантики
 * @class SemListSearchCriterion
 * @extends StringArraySearchCriterion
 */
export class SemListSearchCriterion extends StringArraySearchCriterion<SearchCriterionName.SemList> {
    readonly name = SearchCriterionName.SemList;

    copy() {
        const result = new SemListSearchCriterion();
        result.value = this.value.slice();
        return result;
    }

    join( criteria: SemListSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value.slice();
        return newCreateSearchCriterion;
    }
}

/**
 * Критерий ограничения по кодам из классификатора
 * @class CodeListSearchCriterion
 * @extends StringArraySearchCriterion
 */
export class CodeListSearchCriterion extends StringArraySearchCriterion<SearchCriterionName.CodeList> {
    readonly name = SearchCriterionName.CodeList;

    copy() {
        const result = new CodeListSearchCriterion();
        result.value = this.value.slice();
        return result;
    }

    join( criteria: CodeListSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value.slice();
        return newCreateSearchCriterion;
    }
}

/**
 * Критерий ограничения по ключам из классификатора
 * @class KeyListSearchCriterion
 * @extends StringArraySearchCriterion
 */
export class KeyListSearchCriterion extends StringArraySearchCriterion<SearchCriterionName.KeyList> {
    readonly name = SearchCriterionName.KeyList;

    copy() {
        const result = new KeyListSearchCriterion();
        result.value = this.value.slice();
        return result;
    }

    join( criteria: KeyListSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value.slice();
        return newCreateSearchCriterion;
    }
}

/**
 * Критерий ограничения по номеру объекта
 * @class IdListSearchCriterion
 * @extends StringArraySearchCriterion
 */
export class IdListSearchCriterion extends StringArraySearchCriterion<SearchCriterionName.IdList> {
    readonly name = SearchCriterionName.IdList;

    copy() {
        const result = new IdListSearchCriterion();
        result.value = this.value.slice();
        return result;
    }

    join( criteria: IdListSearchCriterion) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value.slice();
        return newCreateSearchCriterion;
    }
}
