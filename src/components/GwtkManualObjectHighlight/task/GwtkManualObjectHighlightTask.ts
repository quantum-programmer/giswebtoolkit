/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Компонент "Выделить указанные"                     *
 *                                                                  *
 *******************************************************************/

import HighlightObjectAction from '~/systemActions/HighlightObjectAction';
import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import i18n from '@/plugins/i18n';
import MapObject from '~/mapobject/MapObject';

const HIGHLIGHT_MODE_ACTION = 'gwtkmanualobjecthighlight.highlightobject';

/**
 * Обработчик создания компонента
 * @class GwtkManualObjectHighlightTask
 * @extends Action
 */
export default class GwtkManualObjectHighlightTask extends Task {

    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );
        this.actionRegistry.push( {
            getConstructor() {
                return HighlightObjectAction;
            },
            id: HIGHLIGHT_MODE_ACTION,
            active: false,
            enabled: true
        } );
    }

    setup() {
        if ( this.map.tiles.getSelectableLayersArray().length !== 0 ) {
            this.doAction( HIGHLIGHT_MODE_ACTION );
        } else {
            this.map.writeProtocolMessage(
                {
                    text: <string>i18n.t( 'manualobjecthighlight.No layers to highlight objects' ),
                    display: true
                }
            );
            this.mapWindow.getTaskManager().detachTask( this.id );
        }
    }

    onSelectObjects( mapObjects?: MapObject[] ) {
        // this.mapWindow.getTaskManager().showObjectPanel( MapObjectPanelState.showSelectedObjects );
    }

}
