/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Обработчик редактирования объекта                *
 *                                                                  *
 *******************************************************************/

import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import { CURSOR_TYPE } from '~/types/Types';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import VectorLayer from '~/maplayers/VectorLayer';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import SVGrenderer, {
    DEFAULT_SMALL_SVG_MARKER_ID,
    RED_CIRCLE_SVG_MARKER_ID,
    ROTATION_CENTER_SVG_MARKER_ID
} from '~/renderer/SVGrenderer';
import { vec2 } from '~/3d/engine/utils/glmatrix';
import Task from '~/taskmanager/Task';
import MarkerStyle from '~/style/MarkerStyle';
import { LOCALE } from '~/types/CommonTypes';
import PixelPoint from '~/geometry/PixelPoint';
import { MapPoint } from '~/geometry/MapPoint';
import PointEditAction, { ActivePoint } from '~/systemActions/PointEditAction';


const DELTA_PIX = 10;

/**
 * Обработчик редактирования объекта
 * @class QuickEditAction
 * @extends Action<Task>
 */
export default class QuickEditAction<T extends Task = Task> extends PointEditAction<T> {

    /**
     * Описание точки перемещения объекта
     * @private
     * @property [movePoint] {ActivePoint}
     */
    private movePoint?: ActivePoint;

    /**
     * Описание точки масштабирования объекта
     * @private
     * @property [scalePoint] {ActivePoint}
     */
    private scalePoint?: ActivePoint;
    /**
     * Описание точки поворота объекта
     * @private
     * @property [rotatePoint] {object}
     */
    private rotatePoint?: ActivePoint & { center: MapPoint; };

    /**
     * Объект штриховых линий редактора
     * @private
     * @readonly
     * @property dashedBboxObject {MapObject}
     */
    private readonly dashedBboxObject: MapObject;
    /**
     * Стиль объекта штриховых линий редактора
     * @private
     * @readonly
     * @property dashedBboxObjectStyle {Style}
     */
    private readonly dashedBboxObjectStyle = new Style( {
        stroke: new Stroke( {
            color: 'black',
            width: '1px',
            dasharray: '3, 3'
        } )
    } );

    /**
     * Объект точки вращения рамки редактора
     * @private
     * @readonly
     * @property rotationPoint {MapObject}
     */
    private readonly rotationPoint: MapObject;
    /**
     * Стиль объекта точки вращения рамки редактора
     * @private
     * @readonly
     * @property rotationPointStyle {Style}
     */
    private readonly rotationPointStyle = new Style( {
        marker: new MarkerStyle( {
            markerId: RED_CIRCLE_SVG_MARKER_ID
        } )
    } );

    /**
     * Объект центра вращения рамки редактора
     * @private
     * @readonly
     * @property rotationCenterObject {MapObject}
     */
    private readonly rotationCenterObject: MapObject;
    /**
     * Стиль объекта вращения рамки редактора
     * @private
     * @readonly
     * @property rotateCenterObjectStyle {Style}
     */
    private readonly rotateCenterObjectStyle = new Style( {
        marker: new MarkerStyle( {
            markerId: ROTATION_CENTER_SVG_MARKER_ID
        } )
    } );

    /**
     * Объект узлов линий редактора
     * @private
     * @readonly
     * @property multiPointBboxObject {MapObject}
     */
    private readonly multiPointBboxObject: MapObject;
    /**
     * Стиль объекта точек рамки редактора
     * @private
     * @readonly
     * @property multiPointBboxObjectStyle {Style}
     */
    private readonly multiPointBboxObjectStyle = new Style( {
        marker: new MarkerStyle( {
            markerId: DEFAULT_SMALL_SVG_MARKER_ID
        } )
    } );


    /**
     * @constructor QuickEditAction
     * @param task {Task} Экземпляр родительской задачи
     * @param id {string} Идентификатор обработчика
     */
    constructor( task: T, id: string ) {
        super( task, id );

        //создаем слой для построения
        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        //объект с пунктирной линией
        this.multiPointBboxObject = new MapObject( tempVectorLayer, MapObjectType.MultiPoint, { local: LOCALE.Point } );
        this.multiPointBboxObject.addStyle( this.multiPointBboxObjectStyle );

        this.dashedBboxObject = new MapObject( tempVectorLayer, MapObjectType.LineString, { local: LOCALE.Line } );
        this.dashedBboxObject.addStyle( this.dashedBboxObjectStyle );

        // объект маркера точки вращения
        this.rotationPoint = new MapObject( tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point } );
        this.rotationPoint.addStyle( this.rotationPointStyle );

        // объект маркера центра вращения
        this.rotationCenterObject = new MapObject( tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point } );
        this.rotationCenterObject.addStyle( this.rotateCenterObjectStyle );
    }

    canMapMove() {
        return super.canMapMove() && !this.rotatePoint && !this.scalePoint && !this.movePoint;
    }

    selectObject( mapObject?: MapObject ) {
        super.selectObject( mapObject );
        if ( this.currentObject ) {
            if ( this.currentObject.type !== MapObjectType.Point && this.currentObject.type !== MapObjectType.MultiPoint ) {
                if ( this.dashedBboxObject.getContourPointsCount( 0, 0 ) === 0 ) {
                    for ( let i = 0; i < 7; i++ ) {
                        this.dashedBboxObject.addPoint( new MapPoint( 0, 0, 0, this.map.ProjectionId ) );
                    }

                    for ( let i = 0; i < 8; i++ ) {
                        this.multiPointBboxObject.addPoint( new MapPoint( 0, 0, 0, this.map.ProjectionId ) );
                    }

                    this.rotationCenterObject.addPoint( new MapPoint( 0, 0, 0, this.map.ProjectionId ) );

                    this.rotationPoint.addPoint( new MapPoint( 0, 0, 0, this.map.ProjectionId ) );
                }
                this.updateRect();
            } else {
                this.multiPointBboxObject.removeAllPoints();
                this.rotationCenterObject.removeAllPoints();
                this.rotationPoint.removeAllPoints();
            }
        }
    }

    onPreRender( renderer: SVGrenderer ) {
        super.onPreRender( renderer );
        if ( this.multiPointBboxObject.isDirty || this.dashedBboxObject.isDirty ) {
            this.multiPointBboxObject.isDirty = false;
            this.dashedBboxObject.isDirty = false;
            this.map.requestRender();
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        super.onPostRender( renderer );

        if ( this.currentObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.dashedBboxObject );
            this.map.mapObjectsViewer.drawMapObject( renderer, this.rotationPoint );
            this.map.mapObjectsViewer.drawMapObject( renderer, this.multiPointBboxObject );
            this.map.mapObjectsViewer.drawMapObject( renderer, this.rotationCenterObject );
        }

    }

    onMouseDown( event: MouseDeviceEvent ) {
        if ( this.currentObject && !this.hoverPoint ) {
            this.onMouseMove( event );
        }

        if ( this.currentObject && this.hoverPoint ) {
            const mapPoint = this.map.pixelToPlane( event.mousePosition );
            switch ( this.hoverPoint.objectId ) {
                case this.currentObject.id:
                    this.editPoint = {
                        mapPoint,
                        info: this.hoverPoint.info
                    };
                    this.mapWindow.setCursor( CURSOR_TYPE.crosshair );

                    break;
                case this.rotationPoint.id:
                    const mapCenterPoint = this.currentObject.getCenter();
                    this.rotatePoint = {
                        mapPoint,
                        info: this.hoverPoint.info,
                        center: mapCenterPoint ? mapCenterPoint.copy() : new MapPoint( 0, 0, 0, this.map.ProjectionId )
                    };
                    break;
                case this.multiPointBboxObject.id:
                    this.scalePoint = {
                        mapPoint,
                        info: this.hoverPoint.info
                    };
                    break;
                case this.dashedBboxObject.id:
                    this.movePoint = { mapPoint, info: this.hoverPoint.info };
                    break;
            }
        }

    }

    onMouseUp() {
        if ( !this.editPoint ) {
            this.editPoint = this.rotatePoint || this.scalePoint || this.movePoint;
        }

        this.rotatePoint = undefined;
        this.scalePoint = undefined;
        this.movePoint = undefined;

        super.onMouseUp();
    }

    onMouseMove( event: MouseDeviceEvent ) {
        this.hoverObject = undefined;

        this.pointObject.removeAllPoints();

        this.editPointObject.removeAllPoints();

        if ( this.currentObject ) {

            const mousePoint = this.map.pixelToPlane( event.mousePosition );

            if ( this.editPoint ) {
                const info = this.editPoint.info;
                this.currentObject.updatePoint( mousePoint, info );

                const map = this.mapWindow.getMap(),
                    point = event.mousePosition.clone(),
                    pointXY = map.pixelToPlane( point );

                //смещаем точку в пикселах для вычисления допуска в метрах
                point.x += DELTA_PIX;
                point.y += DELTA_PIX;

                const pointXYSupport = this.map.pixelToPlane( point );

                //допуск попадания в точку
                const delta = Math.max( Math.abs( pointXYSupport.x - pointXY.x ), Math.abs( pointXYSupport.y - pointXY.y ) );

                for ( let i = 0; i < this.mapObjectsResult.length; i++ ) {
                    const mapObject = this.mapObjectsResult[ i ];
                    if ( mapObject.gmlId === this.currentObject.gmlId ) {
                        continue;
                    }

                    let nearestPoint;
                    let result;

                    result = mapObject.checkPointHover( mousePoint, delta );
                    if ( result ) {
                        nearestPoint = result.mapPoint;
                    } else {
                        result = mapObject.checkBorderHover( mousePoint, delta );
                        if ( result ) {
                            nearestPoint = result.mapPoint;
                        }
                    }

                    if ( nearestPoint ) {

                        this.pointObject.addPoint( nearestPoint );
                        this.hoverObject = mapObject.copy();
                        this.hoverObject.local = LOCALE.Template;
                        this.hoverObject.addStyle( this.hoverObjectStyle );
                        break;
                    }

                }

                //если объект редактирования был пустой при инициализации, то заполняем объект построения при первом клике
                const hoverPoint = this.pointObject.getPoint( {
                    positionNumber: 0,
                    contourNumber: 0,
                    objectNumber: 0
                } );

                if ( hoverPoint ) {
                    this.currentObject.updatePoint( hoverPoint, info );
                } else {
                    this.currentObject.updatePixelPoint( event.mousePosition, info );
                }
                //fixme: иначе стандартный обработчик mouseup меняет
                this.mapWindow.setCursor( CURSOR_TYPE.crosshair );

                const editPointObjectPoint = this.currentObject.getPoint( info );
                if ( editPointObjectPoint ) {
                    this.editPointObject.addPoint( editPointObjectPoint );
                }

                this.updateRect();

            } else if ( this.rotatePoint ) {
                const currentCenter = this.rotatePoint.center;
                const initPosition = vec2.create();
                vec2.setValues( initPosition, this.rotatePoint.mapPoint.x - currentCenter.x, this.rotatePoint.mapPoint.y - currentCenter.y );
                vec2.normalize( initPosition );

                const newPosition = vec2.create();
                vec2.setValues( newPosition, mousePoint.x - currentCenter.x, mousePoint.y - currentCenter.y );
                vec2.normalize( newPosition );

                let angleValue = vec2.angleBetween( initPosition, newPosition );
                const rotationDirection = vec2.rotationDirection( initPosition, newPosition );
                if ( !rotationDirection ) {
                    angleValue *= -1;
                }


                this.rotationPoint.rotate( angleValue, currentCenter );
                this.dashedBboxObject.rotate( angleValue, currentCenter );
                this.multiPointBboxObject.rotate( angleValue, currentCenter );
                this.currentObject.rotate( angleValue, currentCenter );
                this.currentMultiPointObject.rotate( angleValue, currentCenter );


                this.rotatePoint.mapPoint = mousePoint;

            } else if ( this.scalePoint ) {

                let selector = { objectNumber: 0, contourNumber: 0, positionNumber: 0 };
                const dirVector = vec2.create();

                //        |
                //        |
                // 0------1------2
                // |             |
                // 7             3
                // |             |
                // 6------5------4

                switch ( this.scalePoint.info.positionNumber ) {
                    case 0:
                        vec2.setValues( dirVector, 1, 1 );
                        selector.positionNumber = 4;
                        break;
                    case 1:
                        vec2.setValues( dirVector, 1, 0 );
                        selector.positionNumber = 6;
                        break;
                    case 2:
                        vec2.setValues( dirVector, 1, 1 );
                        selector.positionNumber = 6;
                        break;
                    case 3:
                        vec2.setValues( dirVector, 0, 1 );
                        selector.positionNumber = 6;
                        break;
                    case 4:
                        vec2.setValues( dirVector, 1, 1 );
                        selector.positionNumber = 0;
                        break;
                    case 5:
                        vec2.setValues( dirVector, 1, 0 );
                        selector.positionNumber = 2;
                        break;
                    case 6:
                        vec2.setValues( dirVector, 1, 1 );
                        selector.positionNumber = 2;
                        break;
                    case 7:
                        vec2.setValues( dirVector, 0, 1 );
                        selector.positionNumber = 2;
                        break;
                }

                const currentCenter = this.multiPointBboxObject.getPoint( selector )!;

                const initMultiplier = vec2.create();
                vec2.setValues( initMultiplier, 1 / Math.abs( this.scalePoint.mapPoint.x - currentCenter.x ), 1 / Math.abs( this.scalePoint.mapPoint.y - currentCenter.y ) );

                const scale = vec2.create();
                vec2.setValues( scale, Math.abs( mousePoint.x - currentCenter.x ), Math.abs( mousePoint.y - currentCenter.y ) );


                vec2.multiply( scale, initMultiplier );
                if ( dirVector[ 0 ] === 0 ) {
                    scale[ 0 ] = 1;
                }
                if ( dirVector[ 1 ] === 0 ) {
                    scale[ 1 ] = 1;
                }

                this.rotationPoint.scale( scale, currentCenter );
                this.rotationCenterObject.scale( scale, currentCenter );
                this.dashedBboxObject.scale( scale, currentCenter );
                this.multiPointBboxObject.scale( scale, currentCenter );
                this.currentObject.scale( scale, currentCenter );
                this.currentMultiPointObject.scale( scale, currentCenter );

                this.scalePoint.mapPoint = mousePoint;

            } else if ( this.movePoint ) {

                const point = this.movePoint.mapPoint;

                const move = {
                    deltaX: mousePoint.x - point.x,
                    deltaY: mousePoint.y - point.y
                };

                this.rotationPoint.move( move );
                this.rotationCenterObject.move( move );
                this.dashedBboxObject.move( move );
                this.multiPointBboxObject.move( move );
                this.currentObject.move( move );
                this.currentMultiPointObject.move( move );

                this.movePoint.mapPoint = mousePoint;

            } else {
                this.hoverPoint = undefined;

                const map = this.mapWindow.getMap(),
                    point = event.mousePosition.clone();

                //смещаем точку в пикселах для вычисления допуска в метрах
                point.x += DELTA_PIX;
                point.y += DELTA_PIX;

                const pointXYSupport = map.pixelToPlane( point );

                //допуск попадания в точку
                const delta = Math.max( Math.abs( pointXYSupport.x - mousePoint.x ), Math.abs( pointXYSupport.y - mousePoint.y ) );

                //проверка попадания в объект
                let pointInfo = this.currentObject.findNearestPointWithinRange( mousePoint, delta );
                if ( pointInfo ) {
                    this.hoverPoint = { info: pointInfo, objectId: this.currentObject.id };
                    const currentPoint = this.currentObject.getPoint( pointInfo );
                    if ( currentPoint ) {
                        this.editPointObject.addPoint( currentPoint );
                    }

                }

                if ( !this.hoverPoint ) {
                    pointInfo = this.multiPointBboxObject.findNearestPointWithinRange( mousePoint, delta );
                    if ( pointInfo ) {
                        this.hoverPoint = { info: pointInfo, objectId: this.multiPointBboxObject.id };
                    }
                }

                if ( !this.hoverPoint ) {
                    pointInfo = this.rotationPoint.findNearestPointWithinRange( mousePoint, delta );
                    if ( pointInfo ) {
                        this.hoverPoint = { info: pointInfo, objectId: this.rotationPoint.id };
                    }
                }


                if ( this.hoverPoint ) {
                    this.mapWindow.setCursor( CURSOR_TYPE.pointer );
                } else {
                    pointInfo = this.currentObject.checkHover( mousePoint, delta );
                    if ( pointInfo ) {
                        this.hoverPoint = { info: pointInfo, objectId: this.dashedBboxObject.id };
                        this.mapWindow.setCursor( CURSOR_TYPE.grab );
                    }
                }

                if ( !this.hoverPoint ) {
                    this.mapWindow.setCursor( CURSOR_TYPE.default );
                }
            }


        }
    }

    /**
     * Обновление линий построения редактора
     * @private
     * @method updateRect
     */
    protected updateRect() {
        super.updateRect();
        if ( this.currentObject ) {
            const origin = new PixelPoint( 0, 0 );

            const point = origin.clone();
            //смещаем точку в пикселах для вычисления допуска в метрах
            point.x += 15;
            point.y += 15;

            const originMapPoint = this.map.pixelToPlane( origin );
            const pointMapPoint = this.map.pixelToPlane( point );
            const deltaX = Math.abs( originMapPoint.x - pointMapPoint.x );
            const deltaY = Math.abs( originMapPoint.y - pointMapPoint.y );

            const bbox = this.currentObject.getBounds();
            const leftBottom = bbox.min.toOrigin();
            const rightTop = bbox.max.toOrigin();

            leftBottom[ 0 ] -= deltaX;
            leftBottom[ 1 ] -= deltaY;
            rightTop[ 0 ] += deltaX;
            rightTop[ 1 ] += deltaY;

            this.rotationCenterObject.updatePoint( MapPoint.fromOriginArray( [0.5 * (leftBottom[ 0 ] + rightTop[ 0 ]), 0.5 * (leftBottom[ 1 ] + rightTop[ 1 ])], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 0
            } );

            //        0
            //        |
            // 5-----1(6)----2
            // |             |
            // |             |
            // |             |
            // 4-------------3

            this.dashedBboxObject.updatePoint( MapPoint.fromOriginArray( [0.5 * (leftBottom[ 0 ] + rightTop[ 0 ]), rightTop[ 1 ] + 2 * deltaY], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 0
            } );
            this.dashedBboxObject.updatePoint( MapPoint.fromOriginArray( [0.5 * (leftBottom[ 0 ] + rightTop[ 0 ]), rightTop[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 1
            } );
            this.dashedBboxObject.updatePoint( MapPoint.fromOriginArray( [rightTop[ 0 ], rightTop[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 2
            } );
            this.dashedBboxObject.updatePoint( MapPoint.fromOriginArray( [rightTop[ 0 ], leftBottom[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 3
            } );
            this.dashedBboxObject.updatePoint( MapPoint.fromOriginArray( [leftBottom[ 0 ], leftBottom[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 4
            } );
            this.dashedBboxObject.updatePoint( MapPoint.fromOriginArray( [leftBottom[ 0 ], rightTop[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 5
            } );
            this.dashedBboxObject.updatePoint( MapPoint.fromOriginArray( [0.5 * (leftBottom[ 0 ] + rightTop[ 0 ]), rightTop[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 6
            } );

            //        0
            //        |
            // |------|------|
            // |             |
            // |             |
            // |             |
            // |-------------|

            this.rotationPoint.updatePoint( MapPoint.fromOriginArray( [0.5 * (leftBottom[ 0 ] + rightTop[ 0 ]), rightTop[ 1 ] + 2 * deltaY], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 0
            } );

            //        |
            //        |
            // 0------1------2
            // |             |
            // 7             3
            // |             |
            // 6------5------4
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [leftBottom[ 0 ], rightTop[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 0
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [0.5 * (leftBottom[ 0 ] + rightTop[ 0 ]), rightTop[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 1
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [rightTop[ 0 ], rightTop[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 2
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [rightTop[ 0 ], 0.5 * (leftBottom[ 1 ] + rightTop[ 1 ])], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 3
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [rightTop[ 0 ], leftBottom[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 4
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [0.5 * (leftBottom[ 0 ] + rightTop[ 0 ]), leftBottom[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 5
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [leftBottom[ 0 ], leftBottom[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 6
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [leftBottom[ 0 ], 0.5 * (leftBottom[ 1 ] + rightTop[ 1 ])], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 7
            } );
        }
    }

}
