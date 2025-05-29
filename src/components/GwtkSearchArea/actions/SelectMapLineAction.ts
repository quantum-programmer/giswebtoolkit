/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Обработчик выбора линии на карте                 *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import { ACTION_COMMIT, SAVE_PANEL_ID } from '~/taskmanager/Action';
import VectorLayer from '~/maplayers/VectorLayer';
import { LOCALE } from '~/types/CommonTypes';
import { SELECT_POLYGON } from './SelectMapPolygonAction';
import AppendPointAction from '~/systemActions/AppendPointAction';

export const SELECT_OBJECT = 'selectsample.object';

/**
 * Обработчик выбора произвольного полигона
 * @class SelectMapLineAction
 * @extends SelectMapLineAction<Task>
 */
export default class SelectMapLineAction extends AppendPointAction<Task> {

    setup() {
        super.setup();

        const tempVectorLayer = VectorLayer.getEmptyInstance(this.map);

        this.currentObject = new MapObject(tempVectorLayer, MapObjectType.LineString, { local: LOCALE.Line });

        const button = this.widgetParams[SAVE_PANEL_ID].buttons.find(button => button.id === ACTION_COMMIT);
        if (button) {
            button.enabled = false;
            button.options.theme = 'secondary';
        }

        this.widgetParams[SAVE_PANEL_ID].buttons.length = 1;
    }

    /**
     * Применить данные
     * @method commit
     */
    commit() {
        if (!this.currentObject) {
            return;
        }
        if (this.currentObject.getPointList().length >= 2) {
            this.parentTask.setState(SELECT_POLYGON, this.currentObject);
            super.commit();
        }
    }

    revert() {
        this.parentTask.quitAction(this.id);
    }

}
