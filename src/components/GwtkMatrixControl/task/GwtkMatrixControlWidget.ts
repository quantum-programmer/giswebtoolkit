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

import { Component, Prop } from 'vue-property-decorator';
import { TaskDescription } from '~/taskmanager/TaskManager';
import { ServiceMatrixList } from './GwtkMatrixControlTask';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import GwtkMatrixControlContainerItem from './GwtkMatrixControlContainerItem.vue';


@Component({components: {GwtkMatrixControlContainerItem}})
export default class GwtkMatrixControlWidget extends BaseGwtkVueComponent {
    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ([]) } )
    private readonly serviceMatrixList!: ServiceMatrixList[];

    @Prop( { default: '' } )
    private readonly errorMessage!: string;

    @Prop( { default: false } )
    private readonly isWaiting!: boolean;
}
