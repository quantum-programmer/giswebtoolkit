/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Компонент "Показать начальный экстент"                 *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import { PROJECT_SETTINGS_INITIAL_EXTENT_RESTORE_MAP_CONTENT } from '~/utils/WorkspaceManager';

/**
 * Компонент "Показать начальный экстент"
 * @class GwtkInitialExtentTask
 * @extends Task
 */
export default class GwtkInitialExtentTask extends Task {

    /**
     * @constructor GwtkInitialExtentTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );
    } 

    setup() {
        this.map.restoreView();
        if (this.map.workspaceManager.getValue(PROJECT_SETTINGS_INITIAL_EXTENT_RESTORE_MAP_CONTENT)) {
            this.map.restoreMapContent();
        }
        this.mapWindow.getTaskManager().detachTask(this.id);
    }  
}
