/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *       Обработчик нанесения горизонтального прямоугольника        *
 *                                                                  *
 *******************************************************************/

import { CURSOR_TYPE } from '~/types/Types';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import Task from '~/taskmanager/Task';
import { LOCALE } from '~/types/CommonTypes';
import { MapPoint } from '~/geometry/MapPoint';
import PixelPoint from '~/geometry/PixelPoint';
import CommonCreateAction from './CommonCreateAction';


const CAPTURING_POINT_MODE = 'gwtk.appendpoint.nodemode';
const CAPTURING_LINE_MODE = 'gwtk.appendpoint.contourmode';
const DELETE_LAST_POINT = 'gwtk.appendpoint.deletelastpoint';
const INCREASE_POINT_RADIUS = 'gwtk.appendpoint.increasepointradius';
const DECREASE_POINT_RADIUS = 'gwtk.appendpoint.decreasepointradius';


export type AppendPointActionState = {
    [ CAPTURING_POINT_MODE ]: boolean;
    [ CAPTURING_LINE_MODE ]: boolean;
    [ DELETE_LAST_POINT ]: boolean;
    [ INCREASE_POINT_RADIUS ]: boolean;
    [ DECREASE_POINT_RADIUS ]: boolean;
};

/**
 * Обработчик нанесения горизонтального прямоугольника
 * @class CreateRectangleAction
 * @extends Action
 */
export default class CreateRectangleAction<T extends Task> extends CommonCreateAction<T> {

    /**
     * Обработчик события mousedown
     * @method onMouseDown
     * @param event {MouseDeviceEvent} объект события
     */
    onMouseDown( event: MouseDeviceEvent ) {
        this.updateCurrentPoint( event.mousePosition );
        if ( this.currentPoint ) {
            if ( !this.firstPoint ) {
                this.startPixelPoint = event.mousePosition.clone();

                this.firstPoint = this.currentPoint;
                if ( this.currentObject.getContourPointsCount( 0, 0 ) === 0 ) {
                    this.currentObject.addPoint( this.firstPoint );
                    let newPoint = this.firstPoint.clone();
                    newPoint.x += 0.001;
                    this.currentObject.addPoint( newPoint );
                    newPoint.y += 0.001;
                    this.currentObject.addPoint( newPoint );
                    newPoint.x -= 0.001;
                    this.currentObject.addPoint( newPoint );
                } else {
                    this.updateRectangle();
                }
            } else {
                this.updateRectangle();
                this.firstPoint = undefined;
            }
        }
        this.updateWidgetParams();
    }


    private updateCurrentPoint( mousePosition: PixelPoint ) {
        this.hoverObject = undefined;

        const map = this.mapWindow.getMap();
        const point = mousePosition.clone();
        this.currentPoint = map.pixelToPlane( point );
        this.currentPointObject.removeAllPoints();

        if ( this.mode ) {
            //смещаем точку в пикселах для вычисления допуска в метрах
            point.x += this.deltaPix;
            point.y += this.deltaPix;

            const pointXYSupport = map.pixelToPlane( point );
            if ( this.currentPoint ) {
                const cursorMapPoint = this.map.pixelToPlane( mousePosition );
                //допуск попадания в точку
                const delta = Math.max( Math.abs( pointXYSupport.x - this.currentPoint.x ), Math.abs( pointXYSupport.y - this.currentPoint.y ) );
                for ( let i = 0; i < this.mapObjectsResult.length; i++ ) {
                    const mapObject = this.mapObjectsResult[ i ];

                    if ( !mapObject.checkPointWithin( cursorMapPoint ) ) {
                        continue;
                    }

                    let nearestPoint;

                    if ( this.mode === CAPTURING_POINT_MODE ) {
                        const result = mapObject.checkPointHover( cursorMapPoint, delta );
                        if ( result ) {
                            nearestPoint = result.mapPoint;
                        }
                    } else if ( this.mode === CAPTURING_LINE_MODE ) {
                        const result = mapObject.checkBorderHover( cursorMapPoint, delta );
                        if ( result ) {
                            nearestPoint = result.mapPoint;
                        }
                    }

                    if ( nearestPoint ) {

                        this.currentPoint.x = nearestPoint.x;
                        this.currentPoint.y = nearestPoint.y;

                        this.currentPointObject.addPoint( this.currentPoint );

                        this.hoverObject = mapObject.copy();
                        this.hoverObject.local = LOCALE.Template;
                        break;
                    }

                }
            }
        }
    }

    private updateRectangle() {
        if ( this.currentPoint && this.firstPoint ) {

            this.currentObject.updatePoint( this.firstPoint, {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 0
            } );

            this.currentObject.updatePoint( new MapPoint( this.firstPoint.x, this.currentPoint.y, 0, this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 1
            } );

            this.currentObject.updatePoint( this.currentPoint, {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 2
            } );

            this.currentObject.updatePoint( new MapPoint( this.currentPoint.x, this.firstPoint.y, 0, this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 3
            } );
        }
    }

    /**
     * Обработчик события mousemove
     * @method onMousemove
     * @param event {MouseDeviceEvent} объект события
     */
    onMouseMove( event: MouseDeviceEvent ) {
        const point = event.mousePosition;
        this.updateCurrentPoint( point );
        if ( this.currentPoint && this.firstPoint ) {
            if ( this.startPixelPoint && (Math.abs( this.startPixelPoint.x - point.x ) >= 6 || Math.abs( this.startPixelPoint.y - point.y ) >= 6) ) {
                this.startPixelPoint = undefined;
            }
        }
        this.updateRectangle();


        this.mapWindow.setCursor( CURSOR_TYPE.crosshair );
    }

    onMouseUp( event: MouseDeviceEvent ) {
        if ( !this.startPixelPoint ) {
            this.firstPoint = undefined;
        }
        this.updateWidgetParams();
    }

}
