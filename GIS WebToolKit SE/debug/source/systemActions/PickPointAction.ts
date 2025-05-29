/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Выбор точки на карте                        *
 *                                                                  *
 *******************************************************************/

import Action from '~/taskmanager/Action';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import Task from '~/taskmanager/Task';

export const SET_COORDINATE_IN_POINT = 'systemaction.setcoordinateinpoint';

/**
 * Пример обработчика получения точки с карты
 * @class PickPointAction
 * @extends Action<Task>
 */
export default class PickPointAction extends Action<Task> {

    /**
     * Обработчик события `onMouseClick`
     * @method onMouseClick
     * @param e {MouseDeviceEvent} Объект события
     */
    onMouseClick( e: MouseDeviceEvent ) {
        this.parentTask.setState( SET_COORDINATE_IN_POINT, e.mousePosition );
    }

    canMapMove() {
        return true;
    }
}
