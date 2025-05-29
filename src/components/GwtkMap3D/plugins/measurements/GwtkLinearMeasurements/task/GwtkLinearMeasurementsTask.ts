/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Задача "Линейные измерения"                  *
 *                                                                  *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkLinearMeasurementsWidget from './GwtkLinearMeasurementsWidget.vue';
import { ProjectionCollection } from '~/3d/engine/core/geometry/projection';
import {
    Controller3d,
    MeasurementResults,
    MeasurementName,
    SegmentItemData
} from '@/components/GwtkMap3D/Types';
import Mediator from '~/3d/engine/utils/Mediator';


export const TOGGLE_NEW_MEASUREMENT = 'gwtklinearmeasurement.togglenewmeasurement';

export type GwtkLinearMeasurementsTaskState = {
    [ TOGGLE_NEW_MEASUREMENT ]: undefined;
};

type WidgetParams = {
    setState: GwtkLinearMeasurementsTask['setState'];

    measurementList: SegmentItemData[];
}

/**
 * Задача "Линейные измерения"
 * @class GwtkLinearMeasurementsTask
 * @extends Task
 */
export default class GwtkLinearMeasurementsTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & SimpleJson<any>}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private _activated: boolean = false;

    private _controller: Controller3d = null;

    /**
     * @constructor
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            taskId: this.id,
            setState: this.setState.bind( this ),

            measurementList: []

        };

        this.updateMeasurements = this.updateMeasurements.bind( this );
    }

    createTaskPanel() {
        const nameWidget = 'GwtkLinearMeasurementsWidget';
        const sourceWidget = GwtkLinearMeasurementsWidget;
        this.mapWindow.registerComponent( nameWidget, sourceWidget );

        this.mapWindow.createWindowWidget( nameWidget, this.widgetProps );

        this.addToPostDeactivationList( this.widgetProps );
    }

    setup() {
        super.setup();
        Mediator.publish( 'tool3dMenuToggle', { id: this.id, isActive: true } );

        Mediator.subscribe( 'tool3dLinearMeasurements', this.updateMeasurements );

        this.activate();
    }

    private updateMeasurements( result: MeasurementResults ) {
        this.widgetProps.measurementList.splice( 0 );

        if ( !result.total || !result.segments ) {
            this.widgetProps.measurementList.push( {
                name: MeasurementName.directDistance,
                value: '',
                unit: ''
            } );
            this.widgetProps.measurementList.push( {
                name: MeasurementName.verticalDistance,
                value: '',
                unit: ''
            } );
            this.widgetProps.measurementList.push( {
                name: MeasurementName.horizontalDistance,
                value: '',
                unit: ''
            } );
            return;
        }

        this.widgetProps.measurementList.push( {
            name: MeasurementName.directDistance,
            value: result.total.distance.text,
            unit: result.total.distance.unit + ''
        } );

        if ( result.segments.length ) {

            this.widgetProps.measurementList.push( {
                name: MeasurementName.verticalDistance,
                value: result.segments[ 0 ].metricValues.deltaHeight.text,
                unit: result.segments[ 0 ].metricValues.deltaHeight.unit
            } );

            this.widgetProps.measurementList.push( {
                name: MeasurementName.horizontalDistance,
                value: result.segments[ 0 ].metricValues.planeDistance.text,
                unit: result.segments[ 0 ].metricValues.planeDistance.unit
            } );

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

        Mediator.unsubscribe( 'tool3dLinearMeasurements', this.updateMeasurements );
    }

    setState<K extends keyof GwtkLinearMeasurementsTaskState>( key: K, value: GwtkLinearMeasurementsTaskState[K] ) {
        switch ( key ) {

            case TOGGLE_NEW_MEASUREMENT:
                this.widgetProps.measurementList.splice( 0 );
                this.reset();
                this.activate();
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
            const model = new GWTK.gEngine.Plugins.PointMeasurementModel( projection.getGlobeShape(), { longByRelief: true } );

            this._controller = new GWTK.gEngine.Plugins.PointMeasurementController( model, this.map, {
                destroyHandler: () => {
                    Mediator.publish( 'deactivateToolbar3dComponent', { id: this.id } );
                }, maxPointCount: 2
            } );

            this._controller.addView( new GWTK.gEngine.Plugins.MeasurementConstructionView( this.map, model.getOBB().getCenter(), { constructionMode: GWTK.gEngine.Plugins.enumConsctuctionMode.AdditionalPoint } ) );
            this._controller.addView( new GWTK.gEngine.Plugins.LinearMeasurementValuesView() );
            // this._controller.addView( new GWTK.gEngine.Plugins.LinearMeasurementPanelView( this._controller ) );//TODO открывается старое окно измерений

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

}
