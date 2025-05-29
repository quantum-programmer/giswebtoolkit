/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Обработчик нанесения окружности                 *
 *                                                                  *
 *******************************************************************/

import { CURSOR_TYPE } from '~/types/Types';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import Task from '~/taskmanager/Task';
import { LOCALE } from '~/types/CommonTypes';
import { MapPoint } from '~/geometry/MapPoint';
import PixelPoint from '~/geometry/PixelPoint';
import { vec2 } from '~/3d/engine/utils/glmatrix';
import { Vector2D } from '~/3d/engine/core/Types';
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

const POINT_COUNT = 36;

/**
 * Обработчик нанесения горизонтального прямоугольника
 * @class CreateCircleAction
 * @extends Action
 */
export default class CreateCircleAction<T extends Task> extends CommonCreateAction<T> {

    private centerPixelPoint?: PixelPoint;

    private centerPoint?: MapPoint;

    /**
     * Обработчик события mousedown
     * @method onMouseDown
     * @param event {MouseDeviceEvent} объект события
     */
    onMouseDown( event: MouseDeviceEvent ) {
        this.updateCurrentPoint( event.mousePosition );
        if ( this.currentPoint ) {
            if ( !this.centerPoint ) {
                this.centerPixelPoint = event.mousePosition.clone();
                this.centerPoint = this.currentPoint;
                this.rebuildCircle();
            } else {
                this.rebuildCircle();
                this.centerPoint = undefined;
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

    /**
     * Обработчик события mousemove
     * @method onMousemove
     * @param event {MouseDeviceEvent} объект события
     */
    onMouseMove( event: MouseDeviceEvent ) {
        const point = event.mousePosition;
        this.updateCurrentPoint( point );

        if ( this.centerPoint ) {
            if ( this.centerPixelPoint && (Math.abs( this.centerPixelPoint.x - point.x ) >= 6 || Math.abs( this.centerPixelPoint.y - point.y ) >= 6) ) {
                this.centerPixelPoint = undefined;
            }
            this.rebuildCircle();
        }

        this.mapWindow.setCursor( CURSOR_TYPE.crosshair );
    }

    onMouseUp( event: MouseDeviceEvent ) {
        if ( !this.centerPixelPoint ) {
            this.centerPoint = undefined;
        }
        this.updateWidgetParams();
    }

    /**
     * Получить координаты кривой окружности
     * @method rebuildCircle
     */
    private rebuildCircle() {
        if ( this.centerPoint && this.currentPoint ) {
            const radius = this.centerPoint.distanceTo( this.currentPoint );
            if ( radius ) {
                this.currentObject.removeAllPoints();
                const vector: Vector2D = [1, 0];
                vec2.scale( vector, radius, vector );
                const [deltaX, deltaY] = vector;
                const circlePoint = new MapPoint( this.centerPoint.x + deltaX, this.centerPoint.y + deltaY, 0, this.map.ProjectionId );
                this.currentObject.addPoint( circlePoint );
                for ( let numberPoint = 1; numberPoint < POINT_COUNT; numberPoint += 1 ) {

                    vec2.rotate( vector, 2 * Math.PI / POINT_COUNT );

                    const [deltaX, deltaY] = vector;

                    const circlePoint = new MapPoint( this.centerPoint.x + deltaX, this.centerPoint.y + deltaY, 0, this.map.ProjectionId );

                    this.currentObject.addPoint( circlePoint );
                }
                this.currentObject.closeObject();
            }
        }
    }

}
