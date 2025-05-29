/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент "Полезные телефоны"                  *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import { SubCategory } from '@/components/GwtkHome/task/GwtkHomeTask';


/**
 * Компонент "Полезные телефоны"
 * @class GwtkHomeHelpUsefulTelephones
 * @extends Vue
 */
@Component
export default class GwtkHomeHelpUsefulTelephones extends Vue {
    @Prop( { default: () => ({}) } )
    private readonly subCategory!: SubCategory;

    @Prop( { default: '' } )
    private readonly color!: string;
}
