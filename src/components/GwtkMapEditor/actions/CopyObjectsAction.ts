/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Обработчик копирования объектов                  *
 *                                                                  *
 *******************************************************************/

import MapObject from '~/mapobject/MapObject';
import Action, {
    SECONDARY_PANEL_ID
} from '~/taskmanager/Action';
import { CURSOR_TYPE } from '~/types/Types';
import GwtkMapEditorTask from '../task/GwtkMapEditorTask';


export enum CopyObjectOperation {
    Yes,
    Skip,
    All,
    Finish
}

/**
 * Обработчик копирования объектов
 * @class CopyObjectsAction
 * @extends Action<Task>
 */
export default class CopyObjectsAction<T extends GwtkMapEditorTask> extends Action<T> {

    /**
     * Параметры для виджета
     * @private
     * @readonly
     * @property widgetParams {WidgetParams}
     */
    private readonly widgetParams = {
        [ SECONDARY_PANEL_ID ]: {
            enabled: true,
            visible: true,
            buttons: []
        }
    };

    setup() {
        this.map.clearActiveObject();

        if ( this.map.getSelectedObjects().length ) {
            this.onSelectObjects();
        }
        this.parentTask.createModePanel( this.widgetParams );
    }

    destroy() {
        this.parentTask.resetCopyObjectsPanel();
        this.parentTask.removeModePanel();

        this.map.requestRender();

        this.mapWindow.setCursor( CURSOR_TYPE.default );
    }

    canSelectObject(): boolean {
        return true;
    }

    canMapMove() {
        return true;
    }

    onSelectObjects( mapObjects?: MapObject[] ) {
        if ( !this.parentTask.isCopyPanelFinalSet ) {
            this.parentTask.updateObjectListForCopy();
        }
    }
}
