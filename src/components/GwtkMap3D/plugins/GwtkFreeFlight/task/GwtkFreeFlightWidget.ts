/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Виджет задачи "Свободный полёт"                  *
 *                                                                  *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import { TaskDescription } from '~/taskmanager/TaskManager';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {
    GwtkFreeFlightTaskState,
    RouteItem,
    ON_INPUT_SEARCH,
    TOGGLE_CANCEL,
    TOGGLE_EXECUTE,
    TOGGLE_FINISH,
    TOGGLE_LOOP_ROUTE,
    TOGGLE_OPEN_FILE,
    TOGGLE_PAUSE,
    TOGGLE_ROUTE_ITEM,
    TOGGLE_START_OVER,
    UPDATE_FLIGHT_SPEED
} from './GwtkFreeFlightTask';


@Component
export default class GwtkFreeFlightWidget extends BaseGwtkVueComponent {
    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkFreeFlightTaskState>( key: K, value: GwtkFreeFlightTaskState[K] ) => void;

    @Prop( { default: () => [] } )
    private readonly routeList!: RouteItem[];

    @Prop( { default: '' } )
    private readonly activeItemId!: string;

    @Prop( { default: false } )
    private readonly isFreeFlightStarted!: boolean;

    @Prop( { default: 0 } )
    private readonly flightSpeed!: number;

    @Prop( { default: false } )
    private readonly isFlightPaused!: boolean;

    @Prop( { default: false } )
    private readonly isLoopRoute!: boolean;

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

    private openFile() {
        this.setState( TOGGLE_OPEN_FILE, undefined );
    }

    private onInputSearch( value: string ) {
        this.setState( ON_INPUT_SEARCH, value );
    }

    private toggleRouteItem( itemId: string ) {
        this.setState( TOGGLE_ROUTE_ITEM, itemId );
    }

    private toggleLoopRoute( status: boolean ) {
        this.setState( TOGGLE_LOOP_ROUTE, status );
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

    private toggleStartOver() {
        this.setState( TOGGLE_START_OVER, undefined );
        this.setState( UPDATE_FLIGHT_SPEED, this.speedIndex );
    }

    private get activeRouteItemTitle() {
        const routeItem = this.routeList.find( item => item.id === this.activeItemId );
        return routeItem ? routeItem.alias : '';
    }

    private updateSpeed( value: number ) {
        this.setState( UPDATE_FLIGHT_SPEED, value );
    }

    private get pauseButtonTooltip() {
        return this.isFlightPaused ? 'phrases.Resume' : 'phrases.Pause';
    }

}
