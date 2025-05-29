/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Компонент "Дороги"                        *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    SubCategory,
    GwtkHomeTaskState,
    TOGGLE_ALL_FILTER_ITEMS,
    TOGGLE_FILTER_ITEM
} from '@/components/GwtkHome/task/GwtkHomeTask';

/**
 * Компонент "Дороги"
 * @class GwtkHomeSubCategory
 * @extends Vue
 */
@Component
export default class GwtkHomeSubCategory extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkHomeTaskState>( key: K, value: GwtkHomeTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly subCategory!: SubCategory;

    @Prop( { default: '' } )
    private readonly color!: string;

    private changeHandler( value: { id: string; itemId: string; } ) {
        this.setState( TOGGLE_FILTER_ITEM, value );
    }

    private toggleAllHandler() {
        this.setState( TOGGLE_ALL_FILTER_ITEMS, { id: this.subCategory.id, selectAll: this.selectAllMode } );
    }

    private get selectAllMode() {
        let result = true;
        if ( this.subCategory.filter ) {
            result = false;
            for ( let i = 0; i < this.subCategory.filter.length; i++ ) {
                if ( !this.subCategory.filter[ i ].selected ) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    }

}
