/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Компонент "Узнать больше"                    *
 *                                                                  *
 *******************************************************************/

import { Component } from 'vue-property-decorator';
import GwtkHomeCategory from '@/components/GwtkHome/task/components/GwtkHomeCategory/GwtkHomeCategory';


/**
 * Компонент "Узнать больше"
 * @class GwtkHomeLearnMore
 * @extends Vue
 */
@Component
export default class GwtkHomeLearnMore extends GwtkHomeCategory {

    get title() {
        const title = this.category.items.find( item => item.id === 'title' );
        return title && title.alias;
    }

    get description() {
        const title = this.category.items.find( item => item.id === 'description' );
        return title && title.alias;
    }
}
