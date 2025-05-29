/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Обработчик выбора произвольного полигона на карте       *
 *                                                                  *
 *******************************************************************/

import AppendPointAction from '~/systemActions/AppendPointAction';
import { SAVE_PANEL_ID, ACTION_COMMIT } from '~/taskmanager/Action';
import Task from '~/taskmanager/Task';
import VectorLayer from '~/maplayers/VectorLayer';
import { LOCALE } from '~/types/CommonTypes';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';

export const SELECT_POLYGON = 'selectsample.polygon';

/**
 * Обработчик выбора произвольного полигона
 * @class SelectMapPolygonAction
 * @extends AppendPointAction<Task>
 */
export default class SelectMapPolygonAction extends AppendPointAction<Task> {

    setup() {
        super.setup();

        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        this.currentObject = new MapObject( tempVectorLayer, MapObjectType.Polygon, { local: LOCALE.Plane } );

        const button = this.widgetParams[ SAVE_PANEL_ID ].buttons.find( button => button.id === ACTION_COMMIT );
        if ( button ) {
            button.enabled = false;
            button.options.theme = 'secondary';
        }

        this.widgetParams[ SAVE_PANEL_ID ].buttons.length = 1;
    }

    /**
     * Применить данные
     * @method commit
     */
    commit() {
        if ( !this.currentObject ) {
            return;
        }
        if ( this.currentObject.getPointList().length >= 4 ) {
            this.parentTask.setState( SELECT_POLYGON, this.currentObject );
            super.commit();
        }
    }

    revert() {
        this.parentTask.quitAction( this.id );
    }

}
