/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Компонент "3D вид"                          *
 *                                                                  *
 *******************************************************************/

import MapWindow from '~/MapWindow';
import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import GwtkMap3dWidget from './GwtkMap3dWidget.vue';
import {
    LightSource,
    ViewMode,
    Params3d,
    WorkspaceValues,
    VIEW_SETTINGS_MAPCENTER,
    VIEW_SETTINGS_PARAMS3D
} from '~/utils/WorkspaceManager';
import { GwtkFreeFlight, GwtkFreeFlightMetaData } from '../plugins/GwtkFreeFlight';
import { GwtkMotionScenario, GwtkMotionScenarioMetaData } from '../plugins/GwtkMotionScenario';
import { GwtkLinearMeasurements, GwtkLinearMeasurementsMetaData } from '../plugins/measurements/GwtkLinearMeasurements';
import {
    GwtkLinearMeasurementsSurface,
    GwtkLinearMeasurementsSurfaceMetaData
} from '../plugins/measurements/GwtkLinearMeasurementsSurface';
import { GwtkAreaMeasurements, GwtkAreaMeasurementsMetaData } from '../plugins/measurements/GwtkAreaMeasurements';
import {
    GwtkAreaMeasurementsSurface,
    GwtkAreaMeasurementsSurfaceMetaData
} from '../plugins/measurements/GwtkAreaMeasurementsSurface';
import { TaskDescription } from '~/taskmanager/TaskManager';
import i18n from '@/plugins/i18n';
import { LogEventType } from '~/types/CommonTypes';
import Mediator from '~/3d/engine/utils/Mediator';


export const MAP3D_TOGGLE_UP = 'gwtkmap3d.toggleup';
export const MAP3D_TOGGLE_UP_STOP = 'gwtkmap3d.toggleupstop';
export const MAP3D_TOGGLE_DOWN = 'gwtkmap3d.toggledown';
export const MAP3D_TOGGLE_CW = 'gwtkmap3d.togglecw';
export const MAP3D_TOGGLE_CW_STOP = 'gwtkmap3d.togglecwstop';
export const MAP3D_TOGGLE_CCW = 'gwtkmap3d.toggleccw';
export const MAP3D_TOGGLE_COMPASS = 'gwtkmap3d.togglecompass';
export const MAP3D_TOGGLE_LIGHT_SOURCE = 'gwtkmap3d.togglelightsource';
export const MAP3D_TOGGLE_VIEW_MODE = 'gwtkmap3d.toggleviewmode';
export const MAP3D_TOGGLE_LINEAR_MEASUREMENTS = 'gwtkmap3d.togglelinearmeasurements';
export const MAP3D_TOGGLE_LINEAR_MEASUREMENTS_BY_SURFACE = 'gwtkmap3d.togglelinearmeasurementsbysurface';
export const MAP3D_TOGGLE_AREA_MEASUREMENTS = 'gwtkmap3d.toggleareameasurements';
export const MAP3D_TOGGLE_AREA_MEASUREMENTS_BY_SURFACE = 'gwtkmap3d.toggleareameasurementsbysurface';
export const MAP3D_TOGGLE_FREE_FLIGHT = 'gwtkmap3d.toggleareafreeflight';
export const MAP3D_TOGGLE_MOTION_SCENARIO = 'gwtkmap3d.togglemotionscenario';
export const MAP3D_TOGGLE_TASK = 'gwtkmap3d.toggletask';

export type GwtkMap3dTaskState = {
    [ MAP3D_TOGGLE_UP ]: undefined;
    [ MAP3D_TOGGLE_UP_STOP ]: undefined;
    [ MAP3D_TOGGLE_DOWN ]: undefined;
    [ MAP3D_TOGGLE_CW ]: undefined;
    [ MAP3D_TOGGLE_CW_STOP ]: undefined;
    [ MAP3D_TOGGLE_CCW ]: undefined;
    [ MAP3D_TOGGLE_COMPASS ]: undefined;
    [ MAP3D_TOGGLE_LIGHT_SOURCE ]: undefined;
    [ MAP3D_TOGGLE_VIEW_MODE ]: undefined;
    [ MAP3D_TOGGLE_LINEAR_MEASUREMENTS ]: undefined;
    [ MAP3D_TOGGLE_LINEAR_MEASUREMENTS_BY_SURFACE ]: undefined;
    [ MAP3D_TOGGLE_AREA_MEASUREMENTS ]: undefined;
    [ MAP3D_TOGGLE_AREA_MEASUREMENTS_BY_SURFACE ]: undefined;
    [ MAP3D_TOGGLE_FREE_FLIGHT ]: undefined;
    [ MAP3D_TOGGLE_MOTION_SCENARIO ]: undefined;
    [ MAP3D_TOGGLE_TASK ]: string;

}

/**
 * Компонент "3D вид"
 * @class GwtkMap3dTask
 * @extends Task
 */
export default class GwtkMap3dTask extends Task {

    private readonly map3d = this.map.mapTool( '3dMap' );

    private readonly inclineAngle = Math.PI / 144;
    private readonly rotateAngle = Math.PI * 0.5;

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & SimpleJson<any>}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & {
        setState: GwtkMap3dTask['setState'];
        params3d: Params3d;
        taskDescriptionList: TaskDescription[],
    };

    /**
     * @constructor GwtkMap3dTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        // Создание Vue компонента
        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            setState: this.setState.bind( this ),
            params3d: {
                active: false,
                incline: 0,
                rotate: 0,
                lightSource: LightSource.Projector,
                viewMode: ViewMode.Full
            },
            taskDescriptionList: [],
        };

        this.updateCameraView = this.updateCameraView.bind( this );
        this.updateLoadingScreen = this.updateLoadingScreen.bind( this );
    }

    createTaskPanel() {
        this.widgetProps.taskDescriptionList.push( GwtkLinearMeasurements( this.mapWindow ) );
        this.widgetProps.taskDescriptionList.push( GwtkLinearMeasurementsSurface( this.mapWindow ) );
        this.widgetProps.taskDescriptionList.push( GwtkAreaMeasurements( this.mapWindow ) );
        this.widgetProps.taskDescriptionList.push( GwtkAreaMeasurementsSurface( this.mapWindow ) );
        this.widgetProps.taskDescriptionList.push( GwtkFreeFlight( this.mapWindow ) );
        this.widgetProps.taskDescriptionList.push( GwtkMotionScenario( this.mapWindow ) );

        // регистрация Vue компонентов
        const name = 'GwtkMap3dWidget';
        const source = GwtkMap3dWidget;
        this.mapWindow.registerComponent( name, source );

        // Создание Vue компонента
        this.mapWindow.createMap3dPanel( name, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    private get map3dData() {
        const map3d = this.map3d;
        if ( map3d.initialized ) {
            return map3d.map3dData;
        }
        return undefined;
    }

    private get animation() {
        if ( this.map3dData ) {
            return this.map3dData.animation;
        }
        return undefined;
    }

    setup() {
        if ( this.map3d ) {

            this.widgetProps.params3d = this.map.workspaceManager.getValue( VIEW_SETTINGS_PARAMS3D );

            Mediator.subscribe( 'clearLoadingScreen', this.updateLoadingScreen );

            this.mapWindow.showOverlay();
            if ( this.map3d.initialized ) {
                this.map3d.map3dData.set3dMap();
                // Расчет центральной точки модели
                this.map3d._show3d();
            } else {
                this.map3d._init();
            }

            Mediator.subscribe( 'changeCameraView', this.updateCameraView );

        } else {
            this.map.writeProtocolMessage(
                {
                    text: i18n.tc( 'phrases.3D view' ) + ': ' + i18n.tc( 'phrases.Failed to get data' ),
                    type: LogEventType.Error
                }
            );
        }
    }

    private updateCameraView( data: {
        deltaRotateAngle: number | null,
        deltaInclineAngle: number | null
    } ) {
        const rotate = data.deltaRotateAngle;
        if ( rotate !== null ) {
            this.widgetProps.params3d.rotate += rotate;
        }
    }

    private updateLoadingScreen() {
        this.mapWindow.removeOverlay();
    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( type === VIEW_SETTINGS_PARAMS3D ) {
            this.widgetProps.params3d = this.map.workspaceManager.getValue( VIEW_SETTINGS_PARAMS3D );
        }

        if ( type === VIEW_SETTINGS_MAPCENTER ) {
            let dest = this.map3dData.getCenter();
            if ( dest ) {
                dest = [dest.y, dest.x, 0];
                Mediator.publish( 'moveToPoint', { point: dest } );
            }
        }
    }

    quit() {
        super.quit();
        if ( this.map3d.initialized ) {
            this.map3d._hide3d();
        }

        Mediator.unsubscribe( 'changeCameraView', this.updateCameraView );
        Mediator.unsubscribe( 'clearLoadingScreen', this.updateLoadingScreen );

        this.widgetProps.taskDescriptionList.forEach( item => {
            if ( item.active ) {
                this.mapWindow.getTaskManager().detachTask( item.id );
            }
        } );

    }

    setState<K extends keyof GwtkMap3dTaskState>( key: K, value: GwtkMap3dTaskState[ K ] ) {
        switch ( key ) {
            case MAP3D_TOGGLE_UP:
                if ( this.animation ) {
                    this.animation.animateIncline( this.inclineAngle );
                }
                break;

            case MAP3D_TOGGLE_UP_STOP:
                Mediator.publish( 'animationInclineReset' );
                break;

            case MAP3D_TOGGLE_DOWN:
                if ( this.animation ) {
                    this.animation.animateIncline( -this.inclineAngle );
                }
                break;

            case MAP3D_TOGGLE_CW:
                if ( this.animation ) {
                    this.animation.animateRotation( -this.rotateAngle );
                }
                break;

            case MAP3D_TOGGLE_CW_STOP:
                Mediator.publish( 'animationRotateReset' );
                break;

            case MAP3D_TOGGLE_CCW:
                if ( this.animation ) {
                    this.animation.animateRotation( this.rotateAngle );
                }
                break;

            case MAP3D_TOGGLE_COMPASS:
                if ( this.map3dData && this.animation ) {
                    const targetAngle = 0;

                    let rotateAngle = this.map3dData.getRotateAngle();

                    let delta = 0;
                    if ( rotateAngle > targetAngle ) {
                        delta = -Math.PI;
                    } else if ( rotateAngle < targetAngle ) {
                        delta = Math.PI;
                    }
                    this.animation.animateRotation( delta, targetAngle );
                }
                break;

            case MAP3D_TOGGLE_LIGHT_SOURCE:
                this.map3d.toggleLightSource();
                break;

            case MAP3D_TOGGLE_VIEW_MODE:
                this.map3d.toggleViewMode();
                break;

            case MAP3D_TOGGLE_TASK:
                const id = value as string;

                this.mapWindow.getTaskManager().toggleTaskOrAction( id );

                if ( id !== GwtkMotionScenarioMetaData.id && id !== GwtkFreeFlightMetaData.id ) {

                    this.widgetProps.taskDescriptionList.forEach( item => {

                        if ( (item.id === GwtkLinearMeasurementsMetaData.id
                                || item.id === GwtkLinearMeasurementsSurfaceMetaData.id
                                || item.id === GwtkAreaMeasurementsMetaData.id
                                || item.id === GwtkAreaMeasurementsSurfaceMetaData.id)
                            && item.id !== id ) {

                            this.mapWindow.getTaskManager().detachTask( item.id );

                        }

                    } );
                }

                break;
        }

    }


}
