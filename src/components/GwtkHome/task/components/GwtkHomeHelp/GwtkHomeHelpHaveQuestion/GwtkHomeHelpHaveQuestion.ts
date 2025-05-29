/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Компонент "Есть вопрос"                     *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import { SubCategory } from '@/components/GwtkHome/task/GwtkHomeTask';

/**
 * Компонент "Есть вопрос"
 * @class GwtkHomeHelpHaveQuestion
 * @extends Vue
 */
@Component
export default class GwtkHomeHelpHaveQuestion extends Vue {
    @Prop( { default: () => ({}) } )
    private readonly subCategory!: SubCategory;

    @Prop( { default: '' } )
    private readonly color!: string;

}
