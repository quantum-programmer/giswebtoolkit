/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Обработчик редактирования атрибутов объекта        *
 *                                                                  *
 *******************************************************************/


import GwtkMapEditorTask from '../task/GwtkMapEditorTask';
import Action from '~/taskmanager/Action';
import MapObject from '~/mapobject/MapObject';
import i18n from '@/plugins/i18n';

/**
 * Обработчик редактирования атрибутов объекта
 * @class EditAttributesAction
 * @extends Action<Task>
 */
export default class EditAttributesAction<T extends GwtkMapEditorTask> extends Action<T> {

    setup() {
        this.selectObject( this.map.getActiveObject() );
    }

    canSelectObject(): boolean {
        return true;
    }

    selectObject(mapObject?: MapObject) {

        if ( mapObject ) {

            const canUpdate = mapObject.getEditFlag();
            if (!canUpdate) {
                this.mapWindow.addSnackBarMessage(i18n.tc('mapeditor.Selected object is not available for editing'));
                return;
            }

            this.parentTask.openAttributesEditor();

        } else {
            this.parentTask.setPanelMessage( { text: 'Select map object' } );
        }

    }
}