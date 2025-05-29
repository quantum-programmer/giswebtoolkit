/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Компонент категории                       *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkHomeTaskState,
    Category,
    SELECT_SUB_CATEGORY,
    SELECT_CATEGORY
} from '@/components/GwtkHome/task/GwtkHomeTask';
import GwtkHomeSubCategory from '@/components/GwtkHome/task/components/GwtkHomeSubCategory/GwtkHomeSubCategory.vue';


/**
 * Компонент категории
 * @class GwtkHomeCategory
 * @extends Vue
 */
@Component({
    components:{GwtkHomeSubCategory}
})
export default class GwtkHomeCategory extends Vue {

    @Prop( { default: () => ({}) } )
    protected readonly setState!: <K extends keyof GwtkHomeTaskState>( key: K, value: GwtkHomeTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    protected readonly category!: Category;

    protected activeSubCategoryId: string | null = null;

    protected backClickHandler() {
        this.setState( SELECT_CATEGORY, 'main' );
    }

    /**
     * Выбрать подкатегорию
     * @private
     * @method selectSubCategory
     * @param subCategoryId {string} Идентификатор подкатегории
     */
    protected selectSubCategory( subCategoryId: string ) {
        this.setState( SELECT_SUB_CATEGORY, subCategoryId );
    }

}
