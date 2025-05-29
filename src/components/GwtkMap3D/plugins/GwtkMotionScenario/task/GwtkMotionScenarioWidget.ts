/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Виджет задачи "Динамический сценарий"            *
 *                                                                  *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkMotionScenarioTaskState,
    TOGGLE_SCENARIO_ITEM,
    ON_INPUT_SEARCH,
    TOGGLE_CANCEL,
    TOGGLE_EXECUTE,
    TOGGLE_FINISH,
    TOGGLE_PAUSE,
    UPDATE_SCENARIO_SPEED,
} from './GwtkMotionScenarioTask';
import { ScenarioParams } from '~/services/RequestServices/RestService/Types';


@Component
export default class GwtkMotionScenarioWidget extends BaseGwtkVueComponent {
    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMotionScenarioTaskState>( key: K, value: GwtkMotionScenarioTaskState[K] ) => void;

    @Prop( { default: () => [] } )
    private readonly scenarioList!: ScenarioParams[];

    @Prop( { default: '' } )
    private readonly activeItemId!: string;

    @Prop( { default: false } )
    private readonly isScenarioStarted!: boolean;

    @Prop( { default: false } )
    private readonly isScenarioPaused!: boolean;

    @Prop( { default: [] } )
    private readonly tickList!: string[];

    private speedIndex: number = 0;

    private get tickLabels() {
        const labels: string[] = [];
        this.tickList.forEach( item => {
            labels.push( 'x' + item );
        } );
        return labels;
    }

    private toggleScenarioItem( itemId: string ) {
        this.setState( TOGGLE_SCENARIO_ITEM, itemId );
    }

    private onInputSearch( value: string ) {
        this.setState( ON_INPUT_SEARCH, value );
    }

    private toggleExecute() {
        this.setState( TOGGLE_EXECUTE, undefined );
    }

    private toggleCancel() {
        this.setState( TOGGLE_CANCEL, undefined );
    }

    private toggleFinish() {
        this.setState( TOGGLE_FINISH, undefined );
    }

    private togglePause() {
        this.setState( TOGGLE_PAUSE, undefined );
    }

    private get activeRouteItemTitle() {
        const scenarioItem = this.scenarioList.find( item => item.id === this.activeItemId );
        return scenarioItem ? scenarioItem.alias : '';
    }

    private updateSpeed( value: number ) {
        this.setState( UPDATE_SCENARIO_SPEED, value );
    }

    private get pauseButtonTooltip() {
        return this.isScenarioPaused ? 'phrases.Resume' : 'phrases.Pause';
    }

    private toggleStartOver() {
        this.setState( TOGGLE_FINISH, undefined );
        this.setState( TOGGLE_EXECUTE, undefined );
        this.setState( UPDATE_SCENARIO_SPEED, this.speedIndex );
    }

}
