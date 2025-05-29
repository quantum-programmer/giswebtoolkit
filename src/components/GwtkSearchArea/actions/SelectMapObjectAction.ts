/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Обработчик выбора объекта на карте                *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import MapObject from '~/mapobject/MapObject';
import { SHOW_SELECT_OBJECT_MESSAGE } from '../task/GwtkSearchAreaTask';
import Action from '~/taskmanager/Action';

export const SELECT_OBJECT = 'selectsample.object';

/**
 * Обработчик выбора произвольного полигона
 * @class SelectMapObjectAction
 * @extends SelectMapObjectAction<Task>
 */
export default class SelectMapObjectAction extends Action<Task> {

    setup(): void {
        const mapObject = this.map.getActiveObject();
        if (mapObject !== undefined) {
            this.selectObject(mapObject);
        } else {
            this.parentTask.setState(SHOW_SELECT_OBJECT_MESSAGE, undefined);
        }
    }

    canSelectObject() {
        return true;
    }

    canMapMove() {
        return true;
    }

    selectObject(mapObject?: MapObject) {
        if (mapObject) {
            this.parentTask.setState(SELECT_OBJECT, mapObject);
        }
    }

}
