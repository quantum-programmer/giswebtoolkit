/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Пример команды получения точки с карты                *
 *                                                                  *
 *******************************************************************/

import { MouseDeviceEvent } from '~/input/MouseDevice';
import GeoPoint from '~/geo/GeoPoint';
import GwtkMapRouteTask from '@/components/GwtkMapRoute/task/GwtkMapRouteTask';
import Action from '~/taskmanager/Action';


/**
 * Пример команды получения точки с карты
 * @class PickPointAction
 * @extends Action<GwtkMapRouteTask>
 */
export default class PickPointAction extends Action<GwtkMapRouteTask> {

    canShowObjectPanel(): boolean {
        return false;
    }

    canMapMove(): boolean {
        return true;
    }

    /**
     * Обработчик события `onMouseClick```
     * @method onMouseClick
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseClick( event: MouseDeviceEvent ) {
        const cursorGeoPoint = this.mapWindow.getMap().pixelToGeo( event.mousePosition ) as GeoPoint;
        this.parentTask.findInPointAndSetRoutePoint( event.mousePosition, cursorGeoPoint );
    }

}
