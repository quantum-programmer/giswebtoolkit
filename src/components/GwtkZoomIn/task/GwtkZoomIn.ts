/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент "Увеличить изображение"                   *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';


/**
 * Компонент "Увеличить изображение"
 * @class GwtkZoomIn
 * @extends Task
 */
export default class GwtkZoomIn extends Task {

    /**
     * @constructor GwtkZoomIn
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );
    }

    setup() {
        this.mapWindow.getMap().trigger( { type: 'zoomIn', target: 'map' } );
        this.mapWindow.getTaskManager().detachTask( this.id );
    }
}
