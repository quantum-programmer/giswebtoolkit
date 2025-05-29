/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент "Значения матриц в точке"              *
 *                                                                  *
 *******************************************************************/

import {Component, Prop} from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';


/**
 * Компонент "Значения матриц в точке"
 * @class GwtkMatrixControlContainerItem
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkMatrixControlContainerItem extends BaseGwtkVueComponent {
    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;
}
