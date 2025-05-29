/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Нанесение произвольного полигона на карту               *
 *                                                                  *
 *******************************************************************/

import AppendPointAction from '~/systemActions/AppendPointAction';
import Task from '~/taskmanager/Task';
import VectorLayer from '~/maplayers/VectorLayer';
import {LOCALE} from '~/types/CommonTypes';
import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import {CURSOR_TYPE} from '~/types/Types';
import {COMMIT_OBJECT} from '../task/GwtkDrawTask';

/**
 * Обработчик выбора произвольного полигона
 * @class DrawPolygonAction
 * @extends AppendPointAction<Task>
 */
export default class DrawPolygonAction extends AppendPointAction<Task> {

    setup() {
        super.setup();

        const tempVectorLayer = VectorLayer.getEmptyInstance(this.map);

        this.currentObject = new MapObject(tempVectorLayer, MapObjectType.Polygon, {
            local: LOCALE.Plane,
            id: 'newobject.1'
        });
        this.mapWindow.setCursor(CURSOR_TYPE.crosshair);
    }

    /**
     * Применить данные
     * @method commit
     */
    commit() {
        if (!this.currentObject) {
            return;
        }
        if (this.currentObject.getPointList().length >= 4) {
            this.parentTask.setState(COMMIT_OBJECT, this.currentObject);
            super.commit();
            this.map.clearActiveObject();
        }
    }

    revert() {
        this.parentTask.quitAction(this.id);
    }

}
