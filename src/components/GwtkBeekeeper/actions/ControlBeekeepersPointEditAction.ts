/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Обработчик редактирования объекта                *
 *                                                                  *
 *******************************************************************/


import Task from '~/taskmanager/Task';
import PointEditAction from '~/systemActions/PointEditAction';
import MapObject from '~/mapobject/MapObject';

/**
 * Обработчик редактирования объекта
 * @class ControlBeekeepersPointEditAction
 * @extends Action<Task>
 */
export default class ControlBeekeepersPointEditAction <T extends Task = Task> extends PointEditAction<T> {

    protected async loadMapObjects(): Promise<MapObject[] | undefined> {
        return undefined;
    }
}
