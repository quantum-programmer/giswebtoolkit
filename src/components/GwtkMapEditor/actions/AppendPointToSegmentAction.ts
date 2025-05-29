/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Обработчик добавления точек сегмента               *
 *                                                                  *
 *******************************************************************/

import AppendPointAction from '~/systemActions/AppendPointAction';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import GwtkMapEditorTask, {
    SEGMENT_ADD_POINT_ACTION_COMMIT,
    START_WAIT_CAPTURING,
    STOP_WAIT_CAPTURING
} from '../task/GwtkMapEditorTask';
import { PRIMARY_PANEL_ID, SAVE_PANEL_ID } from '~/taskmanager/Action';
import {LogEventType} from '~/types/CommonTypes';

/**
 * Обработчик добавления точек сегмента
 * @class AppendPointToSegmentAction
 * @extends Action
 */
export default class AppendPointToSegmentAction extends AppendPointAction<GwtkMapEditorTask> {

    /**
     * Параметры для виджета
     * @protected
     * @readonly
     * @property widgetParams {WidgetParams}
     */
    protected readonly widgetParams = {
        [ PRIMARY_PANEL_ID ]: {
            enabled: true,
            title: 'Edition mode',
            visible: true,
            buttons: super.getPrimaryPanelButtons()
        },
        [SAVE_PANEL_ID]: {
            enabled: true,
            visible: true,
            buttons: super.getSavePanelButtons()
        }
    };

    protected updateWidgetParams() {
        super.updateWidgetParams();
        const primaryPanel = this.widgetParams[PRIMARY_PANEL_ID];
        primaryPanel.buttons[2].enabled = !!(this.currentObject && this.currentObject.getPointList().length > 2);
    }

    protected getLineToFirstPointFlag() {
        return true;
    }

    setup() {
        super.setup();

        const tempVectorLayer = VectorLayer.getEmptyInstance(this.map);

        //заменяем объект на линию построения
        this.currentObject = new MapObject( tempVectorLayer, MapObjectType.LineString );

        this.currentObject.addPoint( this.dashedObject.getPoint( {
            contourNumber: 0,
            positionNumber: 0,
            objectNumber: 0
        } )! );
        this.currentObject.addPoint( this.dashedObject.getPoint( {
            contourNumber: 0,
            positionNumber: 2,
            objectNumber: 0
        } )! );
        this.selector.positionNumber = 1;
    }

    onMouseClick( event: MouseDeviceEvent ) {
        super.onMouseClick( event );
        //добавляем точки перед крайней
        this.selector.positionNumber = this.selector.positionNumber! + 1;
    }

    commit() {
        super.commit();
        if (this.currentObject) {
            this.map.setActiveObject(this.currentObject);
        }
        this.parentTask.setState(SEGMENT_ADD_POINT_ACTION_COMMIT, undefined);
    }

    /**
     * Удалить предыдущую точку
     * @private
     * @method deleteLastPoint
     */
    protected deleteLastPoint() {
        if (this.currentObject && this.currentObject.getPointList().length > 2) {
            this.currentObject.removePoint({ positionNumber: this.currentObject.getPointList().length - 2 });
            this.updateWidgetParams();
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
