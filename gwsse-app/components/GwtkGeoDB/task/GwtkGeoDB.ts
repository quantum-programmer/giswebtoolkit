/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Компонент "Помощь"                          *
 *                                                                  *
 *******************************************************************/

import MapWindow from '~/MapWindow';
import Task from '~/taskmanager/Task';


/**
 * Компонент "Помощь"
 * @class GwtkGeoDB
 * @extends Task
 */
export default class GwtkGeoDB extends Task {

    /**
     * @constructor
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );
    }

    setup() {
        this.mapWindow.getTaskManager().detachTask( this.id );
    }
}
