/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Виджет компонента                         *
 *                         "Масштаб карты"                          *
 *                                                                  *
 *******************************************************************/


import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import { CHANGE_MODE, GwtkMapScaleViewerTaskState } from '@/components/GwtkMapScaleViewer/task/GwtkMapScaleViewerTask';

/**
 * Виджет компонента
 * @class GwtkMapScaleViewerWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkMapScaleViewerWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapScaleViewerTaskState>( key: K, value: GwtkMapScaleViewerTaskState[K] ) => void;

    @Prop( { default: '' } )
    private readonly actionId!: string;

    @Prop( { default: 0 } )
    private readonly scale!: number;

    @Prop( { default: {} } )
    private readonly ruleroptions!: { width: string; text: string; };

    @Prop( { default: false } )
    private readonly rulermode!: boolean;

    private get scaleValue() {
        return '1 : ' + Math.round( this.scale );
    }

    private get rulerStyle() {
        return { width: this.ruleroptions.width };
    }

    private changeMode() {
        this.setState( CHANGE_MODE, undefined );
    }
}
