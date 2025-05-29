/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Задача "Линейные измерения по поверхности"          *
 *                                                                  *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkLinearMeasurementsSurfaceWidget from './GwtkLinearMeasurementsSurfaceWidget.vue';
import { ProjectionCollection } from '~/3d/engine/core/geometry/projection';
import {
    Controller3d,
    MeasurementName,
    MeasurementResults,
    SegmentItem,
    SegmentItemData
} from '../../../../Types';
import Mediator from '~/3d/engine/utils/Mediator';
import {
    PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER,
    WorkspaceValues
} from '~/utils/WorkspaceManager';
import MeasurementUtils from '../../../../utils/MeasurementUtils';
import { LogEventType } from '~/types/CommonTypes';


export const TOGGLE_NEW_MEASUREMENT = 'gwtklinearmeasurementsurface.togglenewmeasurement';
export const TOGGLE_RESUME = 'gwtklinearmeasurementsurface.toggleresume';
export const TOGGLE_SEGMENT_DETAILS = 'gwtklinearmeasurementsurface.togglesegmentdetails';
export const TOGGLE_EXPORT_TO_CSV = 'gwtklinearmeasurementsurface.toggleexporttocsv';

export type GwtkLinearMeasurementsSurfaceTaskState = {
    [ TOGGLE_NEW_MEASUREMENT ]: undefined;
    [ TOGGLE_RESUME ]: undefined;
    [ TOGGLE_SEGMENT_DETAILS ]: number;
    [ TOGGLE_EXPORT_TO_CSV ]: undefined;
};

type WidgetParams = {
    setState: GwtkLinearMeasurementsSurfaceTask['setState'];

    measurementList: SegmentItemData[];
    segmentList: SegmentItem[];
    isResumeButtonDisabled: boolean;
}

/**
 * Задача "Линейные измерения по поверхности"
 * @class GwtkLinearMeasurementsSurfaceTask
 * @extends Task
 */
export default class GwtkLinearMeasurementsSurfaceTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & SimpleJson<any>}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private _activated: boolean = false;

    private _controller: Controller3d = null;

    private lastResults?: MeasurementResults;

    /**
     * @constructor
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        // Создание Vue компонента
        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            taskId: this.id,
            setState: this.setState.bind( this ),

            measurementList: [],
            segmentList: [],
            isResumeButtonDisabled: true,
        };

        this.updateMeasurements = this.updateMeasurements.bind( this );
        this.updateResumeButton = this.updateResumeButton.bind( this );
        this.resetView = this.resetView.bind( this );

    }

    createTaskPanel() {
        const nameWidget = 'GwtkLinearMeasurementsSurfaceWidget';
        const sourceWidget = GwtkLinearMeasurementsSurfaceWidget;
        this.mapWindow.registerComponent( nameWidget, sourceWidget );

        this.mapWindow.createWindowWidget( nameWidget, this.widgetProps );

        this.addToPostDeactivationList( this.widgetProps );
    }

    setup() {
        super.setup();
        Mediator.publish( 'tool3dMenuToggle', { id: this.id, isActive: true } );

        Mediator.subscribe( 'tool3dLinearMeasurementsSurface', this.updateMeasurements );
        Mediator.subscribe( 'tool3dMeasurementsInterrupt', this.updateResumeButton );
        Mediator.subscribe( 'tool3dMeasurementsResetView', this.resetView );

        this.activate();
    }

    private updateMeasurements( result: MeasurementResults ) {

        this.lastResults = result;

        this.widgetProps.measurementList.splice( 0 );
        this.widgetProps.segmentList.splice( 0 );

        const totalLength = MeasurementUtils.getDistanceValue( result.total.distance.value, this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER ) );

        this.widgetProps.measurementList.push( {
            name: MeasurementName.totalLength,
            value: totalLength.text,
            unit: totalLength.unitTitle
        } );

        result.segments.forEach( ( segment, index ) => {

            const segmentItem: SegmentItemData[] = [];

            const distance = MeasurementUtils.getDistanceValue( segment.metricValues.distance.value, this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER ) );
            segmentItem.push( {
                name: MeasurementName.length,
                value: distance.text,
                unit: distance.unitTitle
            } );
            segmentItem.push( {
                name: MeasurementName.units,
                value: distance.unit,
                unit: ''
            } );

            const deltaHeight = MeasurementUtils.getDeltaHeightValue( segment.metricValues.deltaHeight.value, this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER ) );
            segmentItem.push( {
                name: MeasurementName.excess,
                value: deltaHeight.text,
                unit: deltaHeight.unitTitle
            } );
            segmentItem.push( {
                name: MeasurementName.units,
                value: deltaHeight.unit,
                unit: ''
            } );

            const slope = MeasurementUtils.getAngleValue( segment.angleValues.slope.value, this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE ) );
            segmentItem.push( {
                name: MeasurementName.slope,
                value: slope.text,
                unit: slope.unitTitle
            } );
            segmentItem.push( {
                name: MeasurementName.units,
                value: slope.unit,
                unit: ''
            } );

            const azimuth = MeasurementUtils.getAngleValue( segment.angleValues.azimuth.value, this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE ) );
            segmentItem.push( {
                name: MeasurementName.azimuth,
                value: azimuth.text,
                unit: azimuth.unitTitle
            } );
            segmentItem.push( {
                name: MeasurementName.units,
                value: azimuth.unit,
                unit: ''
            } );

            const rotation = MeasurementUtils.getAngleValue( segment.angleValues.rotation.value, this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE ) );
            segmentItem.push( {
                name: MeasurementName.angle,
                value: rotation.text,
                unit: rotation.unitTitle
            } );
            segmentItem.push( {
                name: MeasurementName.units,
                value: rotation.unit,
                unit: ''
            } );

            const startPoint = MeasurementUtils.getComboPointCoordsString( result.geometry.points[ index ], this.map.workspaceManager.getValue( PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM ) );
            segmentItem.push( {
                name: MeasurementName.startPoint,
                value: startPoint.value,
                unit: startPoint.unitTitle
            } );
            segmentItem.push( {
                name: MeasurementName.units,
                value: startPoint.unit,
                unit: ''
            } );

            this.widgetProps.segmentList.push( { data: segmentItem, active: segment.auxiliaryValues.active } );
        } );

    }

    private updateResumeButton() {
        this.widgetProps.isResumeButtonDisabled = false;
    }

    private resetView() {
        this.setState( TOGGLE_NEW_MEASUREMENT, undefined );
        this.widgetProps.isResumeButtonDisabled = true;
    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( this.lastResults && ([PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER, PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE].indexOf( type ) !== -1) ) {
            this.updateMeasurements( this.lastResults );
        }
    }

    /**
     * Завершить работу компонента
     * @method destroy
     * @public
     */
    destroy() {
        this.reset();

        super.destroy();
        Mediator.publish( 'tool3dMenuToggle', { id: this.id, isActive: false } );

        Mediator.unsubscribe( 'tool3dLinearMeasurementsSurface', this.updateMeasurements );
        Mediator.unsubscribe( 'tool3dMeasurementsInterrupt', this.updateResumeButton );
        Mediator.unsubscribe( 'tool3dMeasurementsResetView', this.resetView );
    }

    setState<K extends keyof GwtkLinearMeasurementsSurfaceTaskState>( key: K, value: GwtkLinearMeasurementsSurfaceTaskState[K] ) {
        switch ( key ) {

            case TOGGLE_NEW_MEASUREMENT:
                this.widgetProps.measurementList.splice( 0 );
                this.widgetProps.segmentList.splice( 0 );
                this.reset();
                this.activate();
                break;

            case TOGGLE_RESUME:
                this.resume();
                break;

            case TOGGLE_SEGMENT_DETAILS:
                Mediator.publish( 'setActiveSegment', value as number );
                break;

            case TOGGLE_EXPORT_TO_CSV:
                try {
                    MeasurementUtils.exportToCsv(this.widgetProps.segmentList);
                } catch(error) {
                    this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
                }
                break;

        }

    }

    /**
     * Активация компонента
     * @method activate
     * @private
     */
    private activate() {
        if ( !this._activated ) {
            const projection = ProjectionCollection[ this.map.options.tilematrixset ];
            const model = new GWTK.gEngine.Plugins.PointMeasurementModel( projection.getGlobeShape(), {
                allByRelief: true
            } );

            this._controller = new GWTK.gEngine.Plugins.PointMeasurementController( model, this.map, {
                destroyHandler: () => {
                    Mediator.publish( 'deactivateToolbar3dComponent', { id: this.id } );
                }
            } );

            this._controller.addView( new GWTK.gEngine.Plugins.MeasurementConstructionView( this.map, model.getOBB().getCenter() ) );
            this._controller.addView( new GWTK.gEngine.Plugins.MeasurementBySurfaceInfoView( this._controller ) );
            // this._controller.addView( new GWTK.gEngine.Plugins.MeasurementBySurfacePanelView( this._controller ) );//TODO отображение старой панели

            this._activated = true;
        }
    }

    /**
     * Сброс компонента
     * @method reset
     * @private
     */
    private reset() {
        if ( this._activated ) {
            this._controller.destroy();
            this._controller = null;
            this._activated = false;
        }
    }

    /**
     * Продолжить выбор точки
     * @method resume
     * @private
     */
    private resume() {
        this._controller.proceed();
        this.widgetProps.isResumeButtonDisabled = true;
    }

}
