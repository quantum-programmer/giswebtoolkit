/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент "Уменьшить изображение"                   *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';


/**
 * Компонент "Уменьшить изображение"
 * @class GwtkZoomOut
 * @extends Task
 */
export default class GwtkZoomOut extends Task {

    /**
     * @constructor GwtkZoomOut
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super( mapWindow, id );
    }

    setup() {
        this.mapWindow.getMap().trigger( { type: 'zoomOut', target: 'map' } );
        this.mapWindow.getTaskManager().detachTask( this.id );
    }

}
