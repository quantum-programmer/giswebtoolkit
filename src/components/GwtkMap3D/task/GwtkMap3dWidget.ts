/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Виджет панели инструментов "3D вид"         *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import { GwtkComponentPanel } from '~/MapWindow';
import { TaskDescription } from '~/taskmanager/TaskManager';
import GwtkCommonItem from '@/components/System/AppContainers/GwtkCommonItem';
import {
    GwtkMap3dTaskState,
    MAP3D_TOGGLE_TASK,
    MAP3D_TOGGLE_CCW,
    MAP3D_TOGGLE_COMPASS,
    MAP3D_TOGGLE_CW,
    MAP3D_TOGGLE_CW_STOP,
    MAP3D_TOGGLE_DOWN,
    MAP3D_TOGGLE_LIGHT_SOURCE,
    MAP3D_TOGGLE_UP,
    MAP3D_TOGGLE_UP_STOP,
    MAP3D_TOGGLE_VIEW_MODE
} from '../task/GwtkMap3dTask';
import { Params3d } from '~/utils/WorkspaceManager';


type Tools3dMenuItem = {
    active: boolean;
    enabled: boolean;
    id: string;
    options: {
        icon?: string;
        title?: string;
        pureTask?: boolean;
        specifiedToolbar?: GwtkComponentPanel;
        helpPage?: string;
    }
}

@Component
export default class GwtkMap3dWidget extends GwtkCommonItem {

    @Prop( { default: '' } )
    readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMap3dTaskState>( key: K, value: GwtkMap3dTaskState[ K ] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly params3d!: Params3d;

    @Prop( { default: () => [] } )
    private readonly taskDescriptionList!: TaskDescription[];

    private toggleUp() {
        this.setState( MAP3D_TOGGLE_UP, undefined );
    }

    private toggleUpStop() {
        this.setState( MAP3D_TOGGLE_UP_STOP, undefined );
    }

    private toggleDown() {
        this.setState( MAP3D_TOGGLE_DOWN, undefined );
    }

    private toggleCw() {
        this.setState( MAP3D_TOGGLE_CW, undefined );
    }

    private toggleCwStop() {
        this.setState( MAP3D_TOGGLE_CW_STOP, undefined );
    }

    private toggleCcw() {
        this.setState( MAP3D_TOGGLE_CCW, undefined );
    }

    private toggleCompass() {
        this.setState( MAP3D_TOGGLE_COMPASS, undefined );
    }

    private toggleLightSource() {
        this.setState( MAP3D_TOGGLE_LIGHT_SOURCE, undefined );
    }

    private toggleViewMode() {
        this.setState( MAP3D_TOGGLE_VIEW_MODE, undefined );
    }

    private toggleTools3d( item: Tools3dMenuItem ) {
        this.setState( MAP3D_TOGGLE_TASK, item.id );
    }

}
