/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Критерии поиска по области                      *
 *                                                                  *
 *******************************************************************/

import { BaseSearchCriterion, SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';
import { SimpleJson } from '~/types/CommonTypes';

export type CrossMethodSearchCriterionType = {
    readonly name: SearchCriterionName.CrossMethod;
    data: string;
}

export type  FileDataSearchCriterionType = {
    readonly name: SearchCriterionName.FileData;
    data: SimpleJson<any>;
}

/**
 * Критерий определения пересечения фильтрации
 * @class CrossMethodSearchCriterion
 * @extends BaseSearchCriterion
 */
export class CrossMethodSearchCriterion extends BaseSearchCriterion<CrossMethodSearchCriterionType> {

    readonly name = SearchCriterionName.CrossMethod;

    private readonly methods = ['AREASEEKCROSSSQUARE', 'AREASEEKCROSSLINE'];

    private readonly defaultMethod = this.methods[0];

    protected value: string = '';

    setValue( value: string ) {
        if (this.methods.includes(value)) {
            this.value = value;
        } else {
            this.value = this.defaultMethod;
        }
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new CrossMethodSearchCriterion();
        result.value = this.value;
        return result;
    }

    join( other: CrossMethodSearchCriterion ) {
        const newCriterion = this.copy();
        newCriterion.value = other.value;
        return newCriterion;
    }

    equals( other: CrossMethodSearchCriterion ) {
        return this.value === other.value;
    }

}

/**
 * Критерий определения данных файла
 * @class FileDataSearchCriterion
 * @extends BaseSearchCriterion
 */
export class FileDataSearchCriterion extends BaseSearchCriterion<FileDataSearchCriterionType> {

    readonly name = SearchCriterionName.FileData;

    protected value: SimpleJson<any> = {};

    setValue( value: SimpleJson<any> ) {
        this.value = this.copyJSON(value);
    }

    getContent() {
        return this.value;
    }

    copyJSON(json: SimpleJson<any>) {
        return JSON.parse(JSON.stringify( json ));
    }

    copy() {
        const result = new FileDataSearchCriterion();
        result.value = this.copyJSON( this.value );
        return result;
    }

    join( other: FileDataSearchCriterion ) {
        const newone = this.copy();
        newone.value = this.copyJSON(other.value);
        return newone;
    }

    equals( other: FileDataSearchCriterion ) {
        const first = JSON.stringify(this.value);
        const second = JSON.stringify(other.value);
        return first === second;
    }

}
