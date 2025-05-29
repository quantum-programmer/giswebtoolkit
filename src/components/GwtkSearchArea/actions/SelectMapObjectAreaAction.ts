/*******************************************************************
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2024              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*              Выбор объекта карты для поиска по области           *
*                                                                  *
*******************************************************************/

import Action from '~/taskmanager/Action';
import MapObject from '~/mapobject/MapObject';
import GwtkSearchAreaTask, { AREA_SEARCH, AREA_SET_MAPOBJECT, SHOW_SELECT_OBJECT_MESSAGE } from '@/components/GwtkSearchArea/task/GwtkSearchAreaTask';

/**
 * Обработчик карты Выбор области 'объект карты'
 * @class SelectMapObjectAreaAction
 * @constructor SelectMapObjectAreaAction
 */
export default class SelectMapObjectAreaAction extends Action<GwtkSearchAreaTask> {

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
            this.parentTask.setState(AREA_SET_MAPOBJECT, mapObject);
            this.parentTask.setState(AREA_SEARCH, true);
        }
    }
}

