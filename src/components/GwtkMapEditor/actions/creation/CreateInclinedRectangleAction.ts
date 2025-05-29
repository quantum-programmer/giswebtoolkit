/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Обработчик нанесения наклонного прямоугольника          *
 *                                                                  *
 *******************************************************************/

import { CURSOR_TYPE } from '~/types/Types';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import Task from '~/taskmanager/Task';
import { LOCALE } from '~/types/CommonTypes';
import { MapPoint } from '~/geometry/MapPoint';
import { vec2 } from '~/3d/engine/utils/glmatrix';
import { Vector2D } from '~/3d/engine/core/Types';
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
 * Обработчик нанесения наклонного прямоугольника
 * @class CreateInclinedRectangleAction
 * @extends Action
 */
export default class CreateInclinedRectangleAction<T extends Task> extends CommonCreateAction<T> {

    private mousePixelPoint?: PixelPoint;

    private secondPoint?: MapPoint;

    /**
     * Обработчик события mousedown
     * @method onMouseDown
     * @param event {MouseDeviceEvent} объект события
     */
    onMouseDown( event: MouseDeviceEvent ) {
        this.updateCurrentPoint( event.mousePosition );
        if ( this.currentPoint ) {
            if ( !this.firstPoint ) {
                this.mousePixelPoint = event.mousePosition.clone();
                this.firstPoint = this.currentPoint;
                if ( this.currentObject.getContourPointsCount( 0, 0 ) === 0 ) {
                    this.currentObject.addPoint( this.firstPoint );
                    const newPoint = this.firstPoint.clone();
                    newPoint.x += 0.001;
                    this.currentObject.addPoint( newPoint );
                    newPoint.y += 0.001;
                    this.currentObject.addPoint( newPoint );
                    newPoint.x -= 0.001;
                    this.currentObject.addPoint( newPoint );
                } else {
                    this.updateRectangle();
                }
            } else if ( !this.secondPoint ) {
                this.secondPoint = this.currentPoint;
                this.mousePixelPoint = event.mousePosition.clone();
                this.updateRectangle();
            } else {
                if ( !this.mousePixelPoint ) {
                    this.updateRectangle();
                    this.firstPoint = undefined;
                    this.secondPoint = undefined;
                    this.hoverObject = undefined;
                } else if ( Math.abs( this.mousePixelPoint.x - event.mousePosition.x ) >= 6 || Math.abs( this.mousePixelPoint.y - event.mousePosition.y ) >= 6 ) {
                    this.mousePixelPoint = undefined;
                }
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
        if ( this.currentPoint ) {
            if ( this.firstPoint ) {
                this.currentObject.updatePoint( this.firstPoint, {
                    objectNumber: 0,
                    contourNumber: 0,
                    positionNumber: 0
                } );

                if ( !this.secondPoint ) {

                    this.currentObject.updatePoint( this.currentPoint, {
                        objectNumber: 0,
                        contourNumber: 0,
                        positionNumber: 1
                    } );

                    this.currentObject.updatePoint( this.currentPoint, {
                        objectNumber: 0,
                        contourNumber: 0,
                        positionNumber: 2
                    } );

                    this.currentObject.updatePoint( this.currentPoint, {
                        objectNumber: 0,
                        contourNumber: 0,
                        positionNumber: 3
                    } );

                } else {

                    this.currentObject.updatePoint( this.secondPoint, {
                        objectNumber: 0,
                        contourNumber: 0,
                        positionNumber: 1
                    } );

                    const mainSideVector: Vector2D = [this.secondPoint.x - this.firstPoint.x, this.secondPoint.y - this.firstPoint.y];

                    const orthoMainSideVector: Vector2D = [0, 0];
                    vec2.normalize( vec2.rotate( mainSideVector, Math.PI / 2, orthoMainSideVector ), orthoMainSideVector );

                    const currentPointVector: Vector2D = [this.currentPoint.x - this.firstPoint.x, this.currentPoint.y - this.firstPoint.y];

                    const projection = vec2.dot( currentPointVector, orthoMainSideVector );

                    const [deltaX, deltaY] = vec2.scale( orthoMainSideVector, projection, orthoMainSideVector );

                    this.currentObject.updatePoint( new MapPoint( this.secondPoint.x + deltaX, this.secondPoint.y + deltaY, 0, this.map.ProjectionId ), {
                        objectNumber: 0,
                        contourNumber: 0,
                        positionNumber: 2
                    } );

                    this.currentObject.updatePoint( new MapPoint( this.firstPoint.x + deltaX, this.firstPoint.y + deltaY, 0, this.map.ProjectionId ), {
                        objectNumber: 0,
                        contourNumber: 0,
                        positionNumber: 3
                    } );
                }
            }
        }
    }

    /**
     * Обработчик события mousemove
     * @method onMousemove
     * @param event {MouseDeviceEvent} объект события
     */
    onMouseMove( event: MouseDeviceEvent ) {
        const point = event.mousePosition.clone();
        this.updateCurrentPoint( point );

        if ( this.currentPoint && this.firstPoint ) {
            if ( this.mousePixelPoint && (Math.abs( this.mousePixelPoint.x - point.x ) >= 6 || Math.abs( this.mousePixelPoint.y - point.y ) >= 6) ) {
                this.mousePixelPoint = undefined;
            }
        }

        this.updateRectangle();

        this.mapWindow.setCursor( CURSOR_TYPE.crosshair );
    }

    onMouseUp( event: MouseDeviceEvent ) {
        if ( !this.mousePixelPoint ) {
            if ( !this.secondPoint ) {
                this.secondPoint = this.currentPoint;
                this.mousePixelPoint = event.mousePosition.clone();
            } else {
                this.updateRectangle();
                this.firstPoint = undefined;
                this.secondPoint = undefined;
                this.hoverObject = undefined;
            }
        }
        this.updateWidgetParams();
    }

}
