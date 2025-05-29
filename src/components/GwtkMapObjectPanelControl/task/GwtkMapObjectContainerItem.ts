/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Компонент "Объекты карты"                    *
 *                                                                  *
 *******************************************************************/
import { Component, Prop } from 'vue-property-decorator';
import { TaskDescription } from '~/taskmanager/TaskManager';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';


/**
 * Компонент "Объекты карты"
 * @class GwtkMapObjectContainerItem
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkMapObjectContainerItem extends BaseGwtkVueComponent {
    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;
}
