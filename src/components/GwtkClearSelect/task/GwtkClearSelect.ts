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
 * @class GwtkClearSelect
 * @extends Task
 */
export default class GwtkClearSelect extends Task {

    /**
     * @constructor GwtkHelp
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );
    }

    setup() {

        // очистить список отобранных объектов
        if ( this.map.handlers.objectsPane_close_click ) {
            this.map.handlers.objectsPane_close_click();
        }
        if ( this.map.getActiveObject() ) {
            this.map.clearActiveObject();
        }
        this.map.clearSelectedObjects();

        this.mapWindow.getTaskManager().detachTask( this.id );
    }
}
