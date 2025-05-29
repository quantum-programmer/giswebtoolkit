/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Критерий идентификатора слоя                  *
 *                                                                  *
 *******************************************************************/

import { BaseSearchCriterion, SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';

export type LayerIdSearchCriterionType = {
    readonly name: SearchCriterionName.LayerId;
    data: string;
}

/**
 * Критерий идентификатора слоя
 * @class LayerIdSearchCriterion
 * @extends BaseSearchCriterion
 */
export class LayerIdSearchCriterion extends BaseSearchCriterion<LayerIdSearchCriterionType> {
    readonly name = SearchCriterionName.LayerId;

    protected value: string = '';

    /**
     * Установить значение
     * @method setValue
     * @param value {string} Идентификатор слоя
     */
    setValue( value: string ) {
        this.value = value;
    }

    getContent() {
        return this.value;
    }

    copy() {
        const result = new LayerIdSearchCriterion();
        result.value = this.value;
        return result;
    }

    join( criteria: LayerIdSearchCriterion ) {
        const newCreateSearchCriterion = this.copy();
        newCreateSearchCriterion.value = criteria.value;
        return newCreateSearchCriterion;
    }

    equals( other: LayerIdSearchCriterion ) {
        return this.value === other.value;
    }
}
