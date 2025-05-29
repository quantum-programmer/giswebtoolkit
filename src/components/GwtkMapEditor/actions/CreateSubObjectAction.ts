/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Обработчик создания подобъектов                  *
 *                                                                  *
 *******************************************************************/

import GwtkMapEditorTask, {
    CREATE_SUBOBJECT_ACTION,
    START_WAIT_CAPTURING,
    STOP_WAIT_CAPTURING
} from '../task/GwtkMapEditorTask';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import { CURSOR_TYPE } from '~/types/Types';
import AppendPointAction from '~/systemActions/AppendPointAction';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import MarkerStyle from '~/style/MarkerStyle';
import { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import {LogEventType} from '~/types/CommonTypes';


/**
 * Обработчик создания подобъектов
 * @class CreateSubObjectAction
 * @extends AppendPointAction<GwtkMapEditorTask>
 */
export default class CreateSubObjectAction extends AppendPointAction<GwtkMapEditorTask> {

    /**
     * Редактируемый объект
     * @private
     * @property [originObject] {MapObject}
     */
    private originObject?: MapObject;

    setup() {
        this.currentObjectStyle.marker = new MarkerStyle( { markerId: DEFAULT_SVG_MARKER_ID } );

        const activeObject = this.map.getActiveObject();

        if ( activeObject && this.canSelectThisObject( activeObject ) ) {
            this.selectObject( activeObject );
        }

        if ( !this.originObject ) {
            this.parentTask.setPanelMessage( { text: 'Select map object' } );
        }
    }

    destroy() {
        this.currentObject = undefined;
        this.originObject = undefined;
        this.parentTask.resetMessage();

        super.destroy();
    }

    canShowObjectPanel(): boolean {
        return true;
    }

    canSelectObject(): boolean {
        return !this.originObject;
    }

    canSelectThisObject( mapObject: MapObject ): boolean {
        const vectorLayer = this.parentTask.vectorLayer;
        return !!vectorLayer && vectorLayer.isEditable && vectorLayer.id === mapObject.vectorLayer.id;
    }

    selectObject( mapObject?: MapObject ) {
        if ( mapObject ) {
            this.originObject = mapObject;

            this.currentObject = new MapObject( this.originObject.vectorLayer, CreateSubObjectAction.getResultObjectType( this.originObject.type ) );

            this.map.clearActiveObject();

            this.parentTask.setPanelMessage( { text: 'Subobject for', value: ': ' + this.originObject.gmlId } );
            this.parentTask.createModePanel( this.widgetParams );
        }
    }

    updateCriteriaAggregator( criteriaAggregator: CriteriaAggregator ) {
        this.parentTask.updateCriteriaAggregator( criteriaAggregator );
    }

    revert() {
        super.revert();
        this.quit();
    }

    async commit() {
        if ( this.originObject && this.currentObject ) {
            const appendContourPoints = this.currentObject.getPointList();

            if ( appendContourPoints.length === 0 ) {
                this.quit();
                return;
            }

            const vectorLayer = this.originObject.vectorLayer;
            const resultObjectType = CreateSubObjectAction.getResultObjectType( this.originObject.type );

            const resultObject = new MapObject( vectorLayer, resultObjectType );
            resultObject.updateFrom( this.originObject );

            if ( this.originObject.type !== resultObjectType ) {
                resultObject.removeAllPoints();

                const originObjectContoursCount = this.originObject.getObjectContoursCount( 0 );

                for ( let contourNumber = 0; contourNumber < originObjectContoursCount; contourNumber++ ) {
                    const contourPoints = this.originObject.getContourPoints( 0, contourNumber );
                    contourPoints.forEach( ( point, positionNumber ) => {
                        resultObject.addPoint( point, { objectNumber: 0, contourNumber, positionNumber } );
                    } );
                }
            }

            const newContourNumber = this.originObject.getObjectContoursCount( 0 );
            appendContourPoints.forEach( ( point, positionNumber ) => {
                resultObject.addPoint( point, {
                    objectNumber: 0,
                    contourNumber: newContourNumber,
                    positionNumber
                } );
            } );

            vectorLayer.startTransaction();
            await resultObject.commit();

            await this.parentTask.commitTransaction( [vectorLayer], CREATE_SUBOBJECT_ACTION );

            this.map.removeSelectedObject( this.originObject );
        }

        this.quit();

        super.commit();
    }

    onMouseMove( event: MouseDeviceEvent ) {
        super.onMouseMove( event );

        if ( !this.originObject ) {
            this.mapWindow.setCursor( CURSOR_TYPE.default );
        }
    }

    onMouseClick( event: MouseDeviceEvent ) {
        super.onMouseClick( event );
        if ( this.originObject && (this.originObject.type === MapObjectType.Point || this.originObject.type === MapObjectType.MultiPoint) ) {
            this.dashedObject.removeAllPoints();
        }
    }

    private static getResultObjectType( type: MapObjectType ): MapObjectType {
        switch ( type ) {
            case MapObjectType.LineString:
                return MapObjectType.MultiLineString;
            case MapObjectType.Point:
                return MapObjectType.MultiPoint;
            default:
                return type;
        }
    }

    protected async loadMapObjects(): Promise<MapObject[] | undefined> {
        let result = undefined;
        this.parentTask.setState(START_WAIT_CAPTURING);
        try {
            result = await super.loadMapObjects();
        } catch (e) {

            this.map.writeProtocolMessage( { text: e as string, type: LogEventType.Error } );
            console.error( e );

        } finally {
            this.parentTask.setState(STOP_WAIT_CAPTURING);
        }

        if (!result) {
            this.resetCapturingMode();
        }

        return result;
    }

    protected setCapturePointMode( value: boolean ) {
        if ( value ) {
            super.setCapturePointMode(value);
        } else {
            this.parentTask.setState(STOP_WAIT_CAPTURING, undefined);
            this.resetCapturingMode();
        }
    }

    protected setCaptureLineMode( value: boolean ) {
        if ( value ) {
            super.setCaptureLineMode(value);
        } else {
            this.parentTask.setState(STOP_WAIT_CAPTURING, undefined);
            this.resetCapturingMode();
        }
    }
}
