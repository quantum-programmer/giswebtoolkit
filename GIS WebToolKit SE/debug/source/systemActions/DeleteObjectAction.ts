/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Обработчик удаления объекта                   *
 *                                                                  *
 *******************************************************************/

import MapObject from '~/mapobject/MapObject';
import Action, { PRIMARY_PANEL_ID, SAVE_PANEL_ID, ACTION_COMMIT, ACTION_CANCEL } from '~/taskmanager/Action';
import Task from '~/taskmanager/Task';
import { CURSOR_TYPE } from '~/types/Types';


/**
 * Обработчик удаления объекта
 * @class DeleteObjectAction
 * @extends Action<Task>
 */
export default class DeleteObjectAction<T extends Task = Task> extends Action<T> {

    /**
     * Редактируемый объект
     * @private
     * @readonly
     * @property [currentObject] {MapObject}
     */
    protected currentObject?: MapObject;

    /**
     * Параметры для виджета
     * @private
     * @readonly
     * @property widgetParams {WidgetParams}
     */
    private readonly widgetParams = {
        [ PRIMARY_PANEL_ID ]: {
            enabled: true,
            title: 'Delete mode',
            visible: false,
            buttons: []
        },
        [ SAVE_PANEL_ID ]: {
            enabled: true,
            visible: true,
            buttons: [
                {
                    id: ACTION_COMMIT,
                    active: false,
                    enabled: true,
                    options: {
                        title: 'mapeditor.Confirm',
                        label: 'mapeditor.Confirm',
                        theme: 'primary',
                    }
                },
                {
                    id: ACTION_CANCEL,
                    active: false,
                    enabled: true,
                    options: {
                        title: 'mapeditor.Cancel',
                        label: 'mapeditor.Cancel',
                        theme: 'secondary',
                    }
                }
            ]
        }
    };

    setup() {

        const activeObject = this.map.getActiveObject();
        if ( activeObject && !this.canSelectThisObject( activeObject ) ) {
            this.map.clearActiveObject();
        } else {
            this.selectObject( activeObject );
        }

        if ( !this.currentObject ) {
            this.parentTask.setPanelMessage( { text: 'Select map object' } );
        }
    }

    destroy() {
        this.parentTask.resetMessage();
        this.parentTask.removeModePanel();

        this.mapWindow.setCursor( CURSOR_TYPE.default );
    }

    canMapMove() {
        return true;
    }

    canSelectObject() {
        return !this.currentObject;
    }

    canSelectThisObject( mapObject: MapObject ): boolean {
        return mapObject.vectorLayer.isEditable;
    }

    selectObject( mapObject?: MapObject ) {
        if ( mapObject ) {
            this.currentObject = mapObject;
            this.parentTask.setPanelMessage( { text: 'Object to delete', value: ': ' + this.currentObject.gmlId } );
            this.parentTask.createModePanel( this.widgetParams );
        }
    }

    async commit() {
        if ( this.currentObject ) {
            await this.currentObject.delete();
            this.map.removeSelectedObject( this.currentObject );
            this.map.clearActiveObject();
            this.currentObject = undefined;
            this.parentTask.setPanelMessage( { text: 'Select map object' } );
            this.parentTask.removeModePanel();
        }
    }

    revert() {
        this.map.clearActiveObject();
        this.currentObject = undefined;
        this.parentTask.setPanelMessage( { text: 'Select map object' } );
        this.parentTask.removeModePanel();
    }
}
