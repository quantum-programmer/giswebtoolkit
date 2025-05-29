/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Задача "Измерения площади по поверхности"            *
 *                                                                  *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkAreaMeasurementsSurfaceWidget from './GwtkAreaMeasurementsSurfaceWidget.vue';
import {
    Controller3d,
    MeasurementResults,
    MeasurementName,
    SegmentItem, SegmentItemData,
} from '../../../../Types';
import { ProjectionCollection } from '~/3d/engine/core/geometry/projection';
import { LogEventType } from '~/types/CommonTypes';
import Mediator from '~/3d/engine/utils/Mediator';
import {
    PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER,
    WorkspaceValues
} from '~/utils/WorkspaceManager';
import MeasurementUtils from '../../../../utils/MeasurementUtils';


export const TOGGLE_NEW_MEASUREMENT = 'gwtkareameasurementsurface.togglenewmeasurement';
export const TOGGLE_RESUME = 'gwtkareameasurementsurface.toggleresume';
export const TOGGLE_SEGMENT_DETAILS = 'gwtkareameasurementsurface.togglesegmentdetails';
export const TOGGLE_EXPORT_TO_CSV = 'gwtkareameasurementsurface.toggleexporttocsv';

export type GwtkAreaMeasurementsSurfaceTaskState = {
    [ TOGGLE_NEW_MEASUREMENT ]: undefined;
    [ TOGGLE_RESUME ]: undefined;
    [ TOGGLE_SEGMENT_DETAILS ]: number;
    [ TOGGLE_EXPORT_TO_CSV ]: undefined;
};


type WidgetParams = {
    setState: GwtkAreaMeasurementsSurfaceTask['setState'];

    measurementList: SegmentItemData[];
    segmentList: SegmentItem[];
    isResumeButtonDisabled: boolean;
}

/**
 * Задача "Измерения площади по поверхности"
 * @class GwtkAreaMeasurementsTaskSurface
 * @extends Task
 */
export default class GwtkAreaMeasurementsSurfaceTask extends Task {

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
        const nameWidget = 'GwtkAreaMeasurementsSurfaceWidget';
        const sourceWidget = GwtkAreaMeasurementsSurfaceWidget;
        this.mapWindow.registerComponent( nameWidget, sourceWidget );

        this.mapWindow.createWindowWidget( nameWidget, this.widgetProps );

        this.addToPostDeactivationList( this.widgetProps );
    }

    setup() {
        super.setup();
        Mediator.publish( 'tool3dMenuToggle', { id: this.id, isActive: true } );

        Mediator.subscribe( 'tool3dAreaMeasurementsSurface', this.updateMeasurements );
        Mediator.subscribe( 'tool3dMeasurementsInterrupt', this.updateResumeButton );
        Mediator.subscribe( 'tool3dMeasurementsResetView', this.resetView );

        this.activate();

    }

    private updateMeasurements( result: MeasurementResults ) {

        this.lastResults = result;

        this.widgetProps.measurementList.splice( 0 );
        this.widgetProps.segmentList.splice( 0 );

        const perimeter = MeasurementUtils.getDistanceValue( result.total.distance.value, this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER ) );

        this.widgetProps.measurementList.push( {
            name: MeasurementName.perimeter,
            value: perimeter.text,
            unit: perimeter.unitTitle
        } );

        const area = MeasurementUtils.getDistanceValue( result.total.area.value, this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA ) );

        this.widgetProps.measurementList.push( {
            name: MeasurementName.area,
            value: area.text,
            unit: area.unitTitle
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

            const interiorAngle = MeasurementUtils.getAngleValue( segment.angleValues.interiorAngle.value, this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE ) );
            segmentItem.push( {
                name: MeasurementName.angle,
                value: interiorAngle.text,
                unit: interiorAngle.unitTitle
            } );
            segmentItem.push( {
                name: MeasurementName.angle,
                value: interiorAngle.unit,
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
        if ( this.lastResults && ([PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER, PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE, PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA].indexOf( type ) !== -1) ) {
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

        Mediator.unsubscribe( 'tool3dAreaMeasurementsSurface', this.updateMeasurements );
        Mediator.unsubscribe( 'tool3dMeasurementsInterrupt', this.updateResumeButton );
        Mediator.unsubscribe( 'tool3dMeasurementsResetView', this.resetView );
    }

    setState<K extends keyof GwtkAreaMeasurementsSurfaceTaskState>( key: K, value: GwtkAreaMeasurementsSurfaceTaskState[K] ) {
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
            const matrixList = this.map.options.matrix;
            let matrixLayerId;
            if ( matrixList && matrixList[ 0 ] ) {
                const matrixUrl = matrixList[ 0 ].url;
                const regex = /(\w+)=([^&]+)/g;
                let m;
                while ( (m = regex.exec( matrixUrl )) !== null ) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if ( m.index === regex.lastIndex ) {
                        regex.lastIndex++;
                    }
                    if ( m && m[ 1 ].toUpperCase() === 'LAYER' ) {
                        matrixLayerId = m[ 2 ];
                    }
                }

                let serviceUrl = this.map.options.url;
                m = /(h[^?]+)/.exec( matrixUrl );
                if ( m && m[ 1 ] ) {
                    serviceUrl = m[ 1 ];
                }

                const model = new GWTK.gEngine.Plugins.PointMeasurementModel( projection.getGlobeShape(), {
                    closedLine: true,
                    allByRelief: true,
                    serviceUrl: serviceUrl,
                    matrixLayerId: matrixLayerId
                } );

                this._controller = new GWTK.gEngine.Plugins.PointMeasurementController( model, this.map, {
                    destroyHandler: () => {
                        Mediator.publish( 'deactivateToolbar3dComponent', { id: this.id } );
                    }
                } );

                this._controller.addView( new GWTK.gEngine.Plugins.MeasurementConstructionView( this.map, model.getOBB().getCenter(), { polygonMode: GWTK.gEngine.Plugins.enumPolygonMode.ShadowPolygon } ) );
                this._controller.addView( new GWTK.gEngine.Plugins.SurfaceAreaMeasurementInfoView( this._controller ) );
                // this._controller.addView( new GWTK.gEngine.Plugins.SurfaceAreaMeasurementPanelView( this._controller ) );//TODO показать старую панель

                this._activated = true;
            } else {
                this.map.writeProtocolMessage( {
                    display: true,
                    text: this.map.translate( 'Failed to get height data' ),
                    type: LogEventType.Error
                } );
            }

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
