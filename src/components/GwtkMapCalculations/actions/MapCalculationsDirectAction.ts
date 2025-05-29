/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Обработчик выбора полигона области поиска              *
 *                                                                  *
 *******************************************************************/

import GwtkMapCalculationsTask, { MAPCALCULATIONS_FIRST_POINT } from '@/components/GwtkMapCalculations/task/GwtkMapCalculationsTask';
import AppendPointAction from '~/systemActions/AppendPointAction';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import i18n from '@/plugins/i18n';
import { LogEventType } from '~/types/CommonTypes';


/**
 * Обработчик выбора первой точки для DirectGeodetic
 * @class MapCalculationsDirectAction
 * @extends AppendPointAction<GwtkMapCalculationsTask>
 */
export default class MapCalculationsDirectAction extends AppendPointAction<GwtkMapCalculationsTask> {

    /**
     * Применить данные
     * @method run
     */
    commit() {
        this.map.setActiveObject( this.parentTask.getObject() );
        const mapObject = this.map.getActiveObject();

        if ( mapObject && mapObject.getPointList().length >= 1 ) {
            this.parentTask.setState( MAPCALCULATIONS_FIRST_POINT, true );
            super.commit();
        } else {
            this.map.writeProtocolMessage( {
                text: i18n.tc( 'phrases.Map calculation' ) + '. ' + i18n.tc( 'phrases.Error' ) + '.',
                description: 'commit ' + mapObject?.getPointList().length,
                type: LogEventType.Error
            } );
        }
    }

    onMouseClick( event: MouseDeviceEvent ) {
        const mapObject = this.parentTask.getObject();
        const pointObject = this.parentTask.getPointObject();
        pointObject.removeAllPoints();
        mapObject.removeAllPoints();
        super.onMouseClick( event );
        const point = event.mousePosition;
        mapObject.addPixelPoint( point );
        pointObject.addPixelPoint( event.mousePosition );
        this.dashedObject.removeAllPoints();
        this.commit();
    }

    destroy() {
        this.parentTask.cancelWidgetAction( this.id );
        super.destroy();
    }

}
