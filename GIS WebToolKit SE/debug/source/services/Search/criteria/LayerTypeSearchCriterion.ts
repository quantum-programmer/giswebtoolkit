/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Критерий типа слоя                       *
 *                                                                  *
 *******************************************************************/

import { BaseSearchCriterion, SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';

export type LayerTypeSearchCriterionType = {
    readonly name: SearchCriterionName.LayerType;
    data: number[];
}

/**
 * Критерий типа слоя
 * @class LayerTypeSearchCriterionType
 * @extends BaseSearchCriterion
 */
export class LayerTypeSearchCriterion extends BaseSearchCriterion<LayerTypeSearchCriterionType> {
    readonly name = SearchCriterionName.LayerType;

    protected value: number[] = [];

    /**
     * Установить значение
     * @method setValue
     * @param value {string} Тип слоя
     */
    setValue( value: number[] ) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new LayerTypeSearchCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: LayerTypeSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals( other: LayerTypeSearchCriterion ) {
        return JSON.stringify(this.value) === JSON.stringify(other.value);
    }
}
