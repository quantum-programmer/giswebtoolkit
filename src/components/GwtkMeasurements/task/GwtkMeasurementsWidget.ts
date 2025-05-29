/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Виджет задачи измерений                     *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import { GwtkMeasurementTaskState } from '@/components/GwtkMeasurements/task/GwtkMeasurementsTask';
import { ActionMode, ActionModePanel, MODE_PANEL_KEYS, SAVE_PANEL_ID } from '~/taskmanager/Action';


/**
 * Виджет компонента
 * @class GwtkMeasurementsWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkMeasurementsWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly buttons!: TaskDescription[];

    @Prop( { default: () => ({}) } )
    private readonly modePanel!: ActionModePanel;

    @Prop( { default: () => ({ components: [] }) } )
    private readonly linkPanel!: {
        components: TaskDescription[];
        result?: string;
    };

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMeasurementTaskState>( key: K, value: GwtkMeasurementTaskState[K] ) => void;


    get modePanelDescriptions() {
        const result: ActionMode[] = [];

        MODE_PANEL_KEYS.forEach( ( key ) => {
            let modePanel = this.modePanel[ key ];
            if ( modePanel !== undefined ) {
                if ( !(!this.$vuetify.breakpoint.smAndUp && key === SAVE_PANEL_ID) ) {
                    result.push( modePanel );
                }
            }
        } );
        return result;
    }

    get result() {
        if ( this.linkPanel && this.linkPanel.result ) {
            return this.linkPanel.result;
        }
        return '';
    }

    activateAction( button: TaskDescription ) {
        this.setState( button.id as keyof GwtkMeasurementTaskState, !button.active );
    }
}
