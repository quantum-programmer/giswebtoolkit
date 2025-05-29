/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент Построение профиля рельефа             *
 *                                                                  *
 *******************************************************************/

import {Component, Prop} from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {TaskDescription} from '~/taskmanager/TaskManager';


/**
 * Компонент "Построение профиля рельефа "
 * @class GwtkReliefLineDiagramContainerItem
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkReliefLineDiagramContainerItem extends BaseGwtkVueComponent {
    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;
}
