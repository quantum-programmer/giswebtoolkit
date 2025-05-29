/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Компонент "Администратор"                   *
 *                                                                  *
 *******************************************************************/

import MapWindow from '~/MapWindow';
import Task from '~/taskmanager/Task';

/**
 * Компонент "Администратор"
 * @class GwtkAdminPanel
 * @extends Task
 */
export default class GwtkAdminPanel extends Task {

    /**
     * @constructor GwtkHelp
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );
        // BrowserService.downloadLink( window.location.href.slice( 0, window.location.href.lastIndexOf( '/' ) ) + (this.map.options.help || '/gwtkse/Help.pdf') );
    }

    setup() {
        this.mapWindow.getTaskManager().detachTask( this.id );
    }
}
