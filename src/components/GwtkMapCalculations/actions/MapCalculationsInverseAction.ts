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

import GwtkMapCalculationsTask, {
    MAPCALCULATIONS_FIRST_POINT,
    MAPCALCULATIONS_INVERSE_ACTION
}
    from '@/components/GwtkMapCalculations/task/GwtkMapCalculationsTask';
import AppendPointAction from '~/systemActions/AppendPointAction';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import PixelPoint from '~/geometry/PixelPoint';


/**
 * Обработчик выбора первой точки для DirectGeodetic
 * @class MapCalculationsDirectAction
 * @extends AppendPointAction<GwtkMapCalculationsTask>
 */
export default class MapCalculationsInverseAction extends AppendPointAction<GwtkMapCalculationsTask> {

    private lastPoint: PixelPoint | undefined;

    /**
     * Применить данные
     * @method run
     */
    commit() {
        this.map.setActiveObject( this.parentTask.getObject() );
        const mapObject = this.map.getActiveObject();
        if ( mapObject && mapObject.getPointList().length == 2 ) {
            this.lastPoint = undefined;
            this.dashedObject.removeAllPoints();
            this.parentTask.setState( MAPCALCULATIONS_FIRST_POINT, true );
            super.commit();
        }
    }

    onMouseClick( event: MouseDeviceEvent ) {

        const mapObject = this.parentTask.getObject();
        const pointObject = this.parentTask.getPointObject();
        const count = mapObject.getPointList().length;
        pointObject.removeAllPoints();
        if ( count == 2 ) {
            mapObject.removeAllPoints();
            this.lastPoint = undefined;
            this.dashedObject.removeAllPoints();
        }
        super.onMouseClick( event );
        const points = mapObject.getPointList();
        if ( points.length == 1 && !this.lastPoint ) {
            this.lastPoint = event.mousePosition.clone();
            this.dashedObject.addPoint( points[ 0 ] );
        }
        points.forEach( ( point, index ) => {
            pointObject.addPoint( point, { objectNumber: 0, contourNumber: index } );
        } );

        if ( points.length == 2 ) {
            this.commit();
        } else {
            this.parentTask.setState( MAPCALCULATIONS_FIRST_POINT, true );
        }

    }

    onMouseMove( event: MouseDeviceEvent ) {
        super.onMouseMove( event );
        if ( this.lastPoint ) {
            const delta = event.mousePosition.subtract( this.lastPoint );
            if ( Math.abs( delta.x ) > 1 || Math.abs( delta.y ) > 1 ) {
                this.lastPoint = event.mousePosition.clone();
                const mapPoints = this.dashedObject.getPointList();
                if ( mapPoints.length >= 2 ) {
                    const geoPoint = mapPoints[ 1 ].toGeoPoint();
                    if ( geoPoint ) {
                        // обновить виджет
                        this.parentTask.setState( MAPCALCULATIONS_INVERSE_ACTION, geoPoint );
                    }
                }
            }
        }

    }

    destroy() {
        // сбросить виджет
        this.dashedObject.removeAllPoints();
        this.parentTask.cancelWidgetAction( this.id );
        super.destroy();
    }
}
