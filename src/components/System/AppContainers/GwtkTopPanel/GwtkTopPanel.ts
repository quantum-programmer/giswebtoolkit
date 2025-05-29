/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Панель сохранения объекта                         *
 *                для мобильной версии                              *
 *                                                                  *
 *******************************************************************/

import { Component } from 'vue-property-decorator';
import { ActionMode, ActionModePanel, MODE_PANEL_KEYS, SAVE_PANEL_ID } from '~/taskmanager/Action';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { SaveObjectPanelProps } from '~/MapWindow';

@Component
export default class GwtkTopPanel extends BaseGwtkVueComponent {

    activatePanel: boolean = false;
    objectCheck: boolean = false;
    modePanel: ActionModePanel = {};

    /**
     *
     */
    get getActivePanel() {
        return this.activatePanel;
    }

    get disabledSave() {
        return !this.objectCheck;
    }

    /**
     * Отобразить панель
     * @param panelProps
     */
    setParams( panelProps: SaveObjectPanelProps ) {
        this.activatePanel = panelProps.visiblePanel;
        this.modePanel = panelProps.modePanel;
        this.objectCheck = panelProps.saveActive;
    }

    get modePanelDescriptions() {
        const result: ActionMode[] = [];

        MODE_PANEL_KEYS.forEach( ( key ) => {
            let modePanel = this.modePanel[ key ];
            if ( modePanel !== undefined ) {
                if ( (key === SAVE_PANEL_ID) ) {
                    result.push( modePanel );
                }
            }
        } );
        return result;
    }


    buttonClick( buttonId: string ) {
        this.mapVue.getTaskManager().actionSetStateRun( buttonId );
    }

}

