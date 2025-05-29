/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Обработчик добавления точек объекта               *
 *                                                                  *
 *******************************************************************/

import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import GwtkMapEditorTask, {START_WAIT_CAPTURING, STOP_WAIT_CAPTURING} from '../../task/GwtkMapEditorTask';
import AppendPointAction from '~/systemActions/AppendPointAction';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import {LogEventType} from '~/types/CommonTypes';


/**
 * Обработчик редактирования объекта
 * @class CreateAnyContourAction
 * @extends AppendPointAction
 */
export default class CreateAnyContourAction extends AppendPointAction<GwtkMapEditorTask> {

    onMouseClick( event: MouseDeviceEvent ) {
        super.onMouseClick( event );
        if ( this.currentObject && this.currentObject.type === MapObjectType.Point && this.currentObject.getPointList().length !== 0 ) {
            this.mapWindow.getTaskManager().onCommit();
            return true;
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
