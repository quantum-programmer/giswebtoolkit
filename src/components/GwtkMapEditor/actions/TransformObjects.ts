/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *   Обработчик масштабирования, вращения и перемещения объектов    *
 *                                                                  *
 *******************************************************************/

import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import SVGrenderer, {
    DEFAULT_SMALL_SVG_MARKER_ID,
    RED_CIRCLE_SVG_MARKER_ID,
    ROTATION_CENTER_SVG_MARKER_ID
} from '~/renderer/SVGrenderer';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Action, { PRIMARY_PANEL_ID, SAVE_PANEL_ID, ACTION_COMMIT, ACTION_CANCEL } from '~/taskmanager/Action';
import { LOCALE } from '~/types/CommonTypes';
import { CURSOR_TYPE } from '~/types/Types';
import VectorLayer from '~/maplayers/VectorLayer';
import { PointInfo } from '~/mapobject/geometry/BaseMapObjectGeometry';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { MapPoint } from '~/geometry/MapPoint';
import PixelPoint from '~/geometry/PixelPoint';
import { Bounds } from '~/geometry/Bounds';
import { vec2 } from '~/3d/engine/utils/glmatrix';
import MarkerStyle from '~/style/MarkerStyle';
import { Vector2D } from '~/3d/engine/core/Types';
import GwtkMapEditorTask, { TRANSFORM_OBJECTS_ACTION } from '../task/GwtkMapEditorTask';
import i18n from '@/plugins/i18n';


type ActivePoint = {
    mapPoint: MapPoint;
    info: PointInfo;
}

const DELTA_PIX = 6;

export interface TransformParams {
    transformCenter?: MapPoint,
    scale?: Vector2D,
    rotate?: number,
    move?: { deltaX: number, deltaY: number }
}

/**
 * Обработчик масштабирования, поворота и перемещения объектов
 * @class TransformObjectsAction
 * @extends Action
 */
export default class TransformObjectsAction<T extends GwtkMapEditorTask> extends Action<T> {

    /**
     * Параметры для виджета
     * @private
     * @readonly
     * @property widgetParams {WidgetParams}
     */
    private readonly widgetParams = {
        [ PRIMARY_PANEL_ID ]: {
            enabled: true,
            title: 'Edition mode',
            visible: false,
            buttons: []
        },
        [ SAVE_PANEL_ID ]: {
            enabled: true,
            visible: true,
            buttons: [
                {
                    id: ACTION_COMMIT,
                    active: false,
                    enabled: false,
                    options: {
                        label: 'mapeditor.Save',
                        theme: 'primary',
                    }
                },
                {
                    id: ACTION_CANCEL,
                    active: false,
                    enabled: true,
                    options: {
                        label: 'mapeditor.Cancel',
                        theme: 'secondary',
                    }
                }
            ]
        }
    };

    /**
     * Точка под курсором
     * @private
     * @property [hoverPoint] {object}
     */
    private hoverPoint?: { info: PointInfo; objectId: string; };

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
            width: '2px',
            dasharray: '3, 3'
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
     * Вид курсора
     * @private
     * @readonly
     * @property cursor {CURSOR_TYPE}
     */
    private readonly cursor: CURSOR_TYPE;

    private rotateCurrent = 0;

    private readonly dashedBboxObjectInit: MapObject;
    private readonly multiPointBboxObjectInit: MapObject;
    private readonly multiPointBboxObjectCurrent: MapObject;

    private scalePointPositionNumber: number = 0;

    private transformParams: TransformParams = {};

    private mouseDownPoint?: MapPoint;

    /**
     * @constructor TransformObjectsAction
     * @param task {Task} Экземпляр родительской задачи
     * @param id {string} Идентификатор обработчика
     */
    constructor( task: T, id: string ) {
        super( task, id );
        this.cursor = this.mapWindow.setCursor( CURSOR_TYPE.default );
        this.mapWindow.setCursor( this.cursor );

        // создаем слой для построения
        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        //объект с пунктирной линией
        this.dashedBboxObject = new MapObject( tempVectorLayer, MapObjectType.LineString, { local: LOCALE.Plane } );
        this.dashedBboxObject.addStyle( this.dashedBboxObjectStyle );

        // объект маркеров по контуру
        this.multiPointBboxObject = new MapObject( tempVectorLayer, MapObjectType.MultiPoint, { local: LOCALE.Point } );
        this.multiPointBboxObject.addStyle( this.multiPointBboxObjectStyle );

        // объект маркера центра вращения
        this.rotationCenterObject = new MapObject( tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point } );
        this.rotationCenterObject.addStyle( this.rotateCenterObjectStyle );

        // исходный
        this.multiPointBboxObjectInit = new MapObject( tempVectorLayer, MapObjectType.MultiPoint, { local: LOCALE.Point } );
        this.multiPointBboxObjectCurrent = new MapObject( tempVectorLayer, MapObjectType.MultiPoint, { local: LOCALE.Point } );
        this.dashedBboxObjectInit = new MapObject( tempVectorLayer, MapObjectType.LineString, { local: LOCALE.Plane } );

        // объект маркера точки вращения
        this.rotationPoint = new MapObject( tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point } );
        this.rotationPoint.addStyle( this.rotationPointStyle );

    }

    revert() {
        super.revert();
        this.quit();
    }

    setup() {

        this.map.clearActiveObject();

        for ( let i = 0; i < 7; i++ ) {
            this.dashedBboxObject.addPoint( new MapPoint( 0, 0, i, this.map.ProjectionId ) );
        }

        for ( let i = 0; i < 9; i++ ) {
            this.multiPointBboxObject.addPoint( new MapPoint( 0, 0, 0, this.map.ProjectionId ) );
        }

        this.rotationCenterObject.addPoint( new MapPoint( 0, 0, 0, this.map.ProjectionId ) );

        this.rotationPoint.addPoint( new MapPoint( 0, 0, 0, this.map.ProjectionId ) );

        if ( this.map.getSelectedObjects().length === 0 ) {
            this.parentTask.setPanelMessage( { text: 'Select map objects' } );
        }

        this.onSelectObjects();

    }

    async onSelectObjects( mapObjects?: MapObject[] ) {

        const selectedObjects = this.map.getSelectedObjects();

        if (selectedObjects.length === 0) {
            return;
        }

        selectedObjects.forEach( item => {
            if ( !item.vectorLayer.isEditable ) {
                this.map.removeSelectedObjects( [item] );
            }
        } );

        let canNotUpdateCount = 0;
        const validObjects: MapObject[] = [];
        for ( const mapObject of selectedObjects ) {
            if ( mapObject.vectorLayer.isEditable ) {

                const canUpdate = mapObject.getEditFlag();
                if (!canUpdate) {
                    canNotUpdateCount++;
                } else {
                    validObjects.push(mapObject);
                }

            }
        }

        if (canNotUpdateCount > 0) {
            this.mapWindow.addSnackBarMessage(i18n.tc('mapeditor.Objects that are not editable have been excluded'));
        }

        // this.map.clearSelectedObjects();
        this.map.clearActiveObject();
        if (validObjects.length > 0) {
            const removeObjects = this.map.getSelectedObjects().filter(mapObject => !validObjects.includes(mapObject));
            this.map.removeSelectedObjects(removeObjects);
        } else {
            this.parentTask.setPanelMessage( { text: 'Select map objects' } );
        }

        if ( this.updateRect() ) {

            this.parentTask.setPanelMessage( {
                text: 'Number of objects to transform: ',
                value: this.map.getSelectedObjects().length + ''
            } );
            this.parentTask.createModePanel( this.widgetParams );

        }

    }

    canSelectObject(): boolean {
        return true;
    }

    canSelectThisObject( mapObject: MapObject ): boolean {
        return mapObject.vectorLayer.isEditable;
    }

    canMapMove() {
        return this.map.getSelectedObjects().length === 0;
    }

    destroy() {

        this.map.requestRender();
        this.parentTask.resetMessage();
        this.parentTask.removeModePanel();

        this.mapWindow.setCursor( CURSOR_TYPE.default );

    }

    async commit() {

        this.mapWindow.showOverlay();
        const layerList = new Set<VectorLayer>();
        let selectedObjects = this.map.getSelectedObjectsIterator();

        for ( const mapObject of selectedObjects ) {
            if ( !mapObject.hasGeometry() ) {
                if ( !layerList.has( mapObject.vectorLayer ) ) {
                    layerList.add( mapObject.vectorLayer );
                    mapObject.vectorLayer.startTransaction();
                }
                await mapObject.loadGeometry();
            }
        }

        try {
            for (const vectorLayer of layerList) {
                await vectorLayer.reloadTransaction({ geometry: true });
            }
        } catch (error) {
            console.log(error);
            this.mapWindow.removeOverlay();
            this.quit();
            return;
        }

        const vectorLayerList: VectorLayer[] = [];

        selectedObjects = this.map.getSelectedObjectsIterator();
        for ( const mapObject of selectedObjects ) {
            if (this.transformParams.scale && mapObject.hasGeometry() ) {
                mapObject.scale( this.transformParams.scale, this.transformParams.transformCenter );
            }

            if (this.transformParams.rotate && mapObject.hasGeometry()) {
                mapObject.rotate( this.transformParams.rotate, this.transformParams.transformCenter );
            }

            if (this.transformParams.move && mapObject.hasGeometry()) {
                mapObject.move( this.transformParams.move );
            }

            const vectorLayer = mapObject.vectorLayer;
            if ( !vectorLayerList.includes( vectorLayer ) ) {
                vectorLayer.startTransaction();
                vectorLayerList.push( vectorLayer );
            }

            mapObject.reload();

        }

        try {
            await this.parentTask.commitTransaction(vectorLayerList, TRANSFORM_OBJECTS_ACTION);

            for (let i = 0; i < vectorLayerList.length; i++) {
                const vectorLayer = vectorLayerList[i];
                await vectorLayer.reloadTransaction();
            }
        } catch (error) {
            console.log(error);
            this.mapWindow.removeOverlay();
            this.quit();
            return;
        }

        this.parentTask.setPanelMessage( {
            text: 'Objects transformed: ',
            value: this.map.getSelectedObjectsCount() + '',
            isSnackbar: true
        } );

        this.mapWindow.removeOverlay();

        this.quit();

    }

    onPreRender( renderer: SVGrenderer ) {
        if ( this.rotationPoint.isDirty || this.multiPointBboxObject.isDirty || this.dashedBboxObject.isDirty || this.rotationCenterObject.isDirty ) {
            this.rotationPoint.isDirty = false;
            this.multiPointBboxObject.isDirty = false;
            this.dashedBboxObject.isDirty = false;
            this.rotationCenterObject.isDirty = false;
            this.map.requestRender();
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        if ( this.map.getSelectedObjects().length ) {

            this.map.mapObjectsViewer.drawMapObject( renderer, this.rotationPoint );

            this.map.mapObjectsViewer.drawMapObject( renderer, this.multiPointBboxObject );

            this.map.mapObjectsViewer.drawMapObject( renderer, this.dashedBboxObject );

            this.map.mapObjectsViewer.drawMapObject( renderer, this.rotationCenterObject );

        }
    }

    onMouseDown( event: MouseDeviceEvent ) {
        if ( this.map.getSelectedObjects().length && !this.hoverPoint ) {
            this.onMouseMove( event );
        }

        if ( this.map.getSelectedObjects().length && !this.hoverPoint ) {
            this.onMouseMove( event );
        }

        if ( this.map.getSelectedObjects().length && this.hoverPoint ) {
            const mapPoint = this.map.pixelToPlane( event.mousePosition );
            switch ( this.hoverPoint.objectId ) {
                case this.multiPointBboxObjectCurrent.id:
                    if ( this.hoverPoint.info.positionNumber === 0 ) {
                        this.rotatePoint = {
                            mapPoint,
                            info: this.hoverPoint.info,
                            center: this.transformCenter
                        };
                    } else {
                        this.scalePoint = {
                            mapPoint,
                            info: this.hoverPoint.info
                        };
                        this.scalePointPositionNumber = this.scalePoint.info.positionNumber;
                    }
                    break;
                case this.dashedBboxObject.id :
                    this.movePoint = { mapPoint, info: this.hoverPoint.info };
                    break;
            }
            this.mouseDownPoint = mapPoint.copy();
            this.hoverPoint = undefined;
        }
    }

    onMouseUp() {
        this.rotatePoint = undefined;
        this.scalePoint = undefined;
        this.movePoint = undefined;
        this.hoverPoint = undefined;
    }

    onMouseMove( event: MouseDeviceEvent ) {
        if ( this.map.getSelectedObjects().length ) {
            const mousePoint = this.map.pixelToPlane( event.mousePosition );

            if ( this.movePoint ) {

                const point = this.movePoint.mapPoint;

                const move = {
                    deltaX: mousePoint.x - point.x,
                    deltaY: mousePoint.y - point.y
                };

                this.multiPointBboxObjectCurrent.move( move );

                this.movePoint.mapPoint = mousePoint;

            } else if ( this.rotatePoint ) {
                const rotationCenter = this.transformCenter;
                const initPosition = vec2.create();
                vec2.setValues( initPosition, this.rotatePoint.mapPoint.x - rotationCenter.x, this.rotatePoint.mapPoint.y - rotationCenter.y );
                vec2.normalize( initPosition );

                const newPosition = vec2.create();
                vec2.setValues( newPosition, mousePoint.x - rotationCenter.x, mousePoint.y - rotationCenter.y );
                vec2.normalize( newPosition );

                const angleBetween = vec2.angleBetween( initPosition, newPosition );
                const rotationDirection = vec2.rotationDirection( initPosition, newPosition );
                const rotate = rotationDirection ? angleBetween : -angleBetween;

                this.multiPointBboxObjectCurrent.rotate( rotate, rotationCenter );

                this.rotateCurrent += rotate;

                this.rotatePoint.mapPoint = mousePoint;

            } else if ( this.scalePoint ) {

                const scaleCenter = this.multiPointBboxObjectCurrent.getPoint( this.scaleCenterSelector );
                if ( scaleCenter ) {

                    const initMultiplier = vec2.create();
                    const x0 = 1 / (this.scalePoint.mapPoint.x - scaleCenter.x);
                    const y0 = 1 / (this.scalePoint.mapPoint.y - scaleCenter.y);

                    vec2.setValues( initMultiplier, x0, y0 );

                    const scale = vec2.create();
                    const x1 = (mousePoint.x - scaleCenter.x);
                    const y1 = (mousePoint.y - scaleCenter.y);

                    vec2.setValues( scale, x1, y1 );

                    const unitX = vec2.rotate( vec2.UNITY, this.rotateCurrent, vec2.create() );
                    const unitY = vec2.rotate( vec2.UNITX, this.rotateCurrent, vec2.create() );

                    const curVec = vec2.create( [(this.scalePoint.mapPoint.x - scaleCenter.x), (this.scalePoint.mapPoint.y - scaleCenter.y)] );

                    const initMultiplierProjectedX = 1 / vec2.dot( curVec, unitX );
                    const initMultiplierProjectedY = 1 / vec2.dot( curVec, unitY );
                    const initMultiplierProjected = vec2.create( [initMultiplierProjectedX, initMultiplierProjectedY] );

                    const scaleProjectedX = vec2.dot( scale, unitX );
                    const scaleProjectedY = vec2.dot( scale, unitY );
                    const scaleProjected = vec2.create( [scaleProjectedX, scaleProjectedY] );

                    vec2.multiply( scaleProjected, initMultiplierProjected, scale );

                    this.multiPointBboxObjectCurrent.scaleByAxis( scale, scaleCenter, { x: unitX, y: unitY } );

                    this.scalePoint.mapPoint = mousePoint;
                }

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

                if ( !this.hoverPoint ) {
                    let pointInfo = this.multiPointBboxObjectCurrent.findNearestPointWithinRange( mousePoint, delta );
                    if ( pointInfo ) {
                        this.hoverPoint = { info: pointInfo, objectId: this.multiPointBboxObjectCurrent.id };
                    }
                }

                if ( this.hoverPoint ) {
                    this.mapWindow.setCursor( CURSOR_TYPE.pointer );
                }

                if ( !this.hoverPoint ) {
                    const bbox = this.dashedBboxObject.getBounds();
                    const leftBottomXY = bbox.min;
                    const rightTopXY = bbox.max;

                    if (
                        mousePoint.x > leftBottomXY.x &&
                        mousePoint.x < rightTopXY.x &&
                        mousePoint.y > leftBottomXY.y &&
                        mousePoint.y < rightTopXY.y
                    ) {
                        this.hoverPoint = {
                            info: { objectNumber: 0, contourNumber: 0, positionNumber: 0 },
                            objectId: this.dashedBboxObject.id
                        };
                        this.mapWindow.setCursor( CURSOR_TYPE.grab );
                    }
                }

                if ( !this.hoverPoint ) {
                    this.mapWindow.setCursor( CURSOR_TYPE.default );
                }

            }

            this.updateObject();

            if ( this.mouseDownPoint && ((Math.abs( this.mouseDownPoint.x - mousePoint.x ) > 0)
                || (Math.abs( this.mouseDownPoint.y - mousePoint.y ) > 0)) ) {

                const button = this.widgetParams[ SAVE_PANEL_ID ].buttons.find( item => item.id === ACTION_COMMIT );
                if ( button ) {
                    button.enabled = true;
                }
            }

        }
    }

    adjustRectangle( rectangle: { x: number, y: number, width: number, height: number }, bottomRightX: number, bottomRightY: number, angle: number ) {

        const center = [
            rectangle.x + rectangle.width / 2,
            rectangle.y + rectangle.height / 2
        ];
        const rotatedA = this.rotate( rectangle.x, rectangle.y, center[ 0 ], center[ 1 ], angle );
        const newCenter = [
            (rotatedA[ 0 ] + bottomRightX) / 2,
            (rotatedA[ 1 ] + bottomRightY) / 2,
        ];
        const newTopLeft = this.rotate(
            rotatedA[ 0 ],
            rotatedA[ 1 ],
            newCenter[ 0 ],
            newCenter[ 1 ],
            -angle
        );
        const newBottomRight = this.rotate(
            bottomRightX,
            bottomRightY,
            newCenter[ 0 ],
            newCenter[ 1 ],
            -angle
        );

        rectangle.x = newTopLeft[ 0 ];
        rectangle.y = newTopLeft[ 1 ];
        rectangle.width = newBottomRight[ 0 ] - newTopLeft[ 0 ];
        rectangle.height = newBottomRight[ 1 ] - newTopLeft[ 1 ];
    }

    rotate( x: number, y: number, cx: number, cy: number, angle: number ) {
        return [
            (x - cx) * Math.cos( angle ) - (y - cy) * Math.sin( angle ) + cx,
            (x - cx) * Math.sin( angle ) + (y - cy) * Math.cos( angle ) + cy,
        ];
    }

    /**
     * Обновление линий построения редактора
     * @private
     * @method updateRect
     */
    private updateRect(): boolean {
        let result = false;

        if ( this.map.getSelectedObjectsCount() !== 0 ) {
            const origin = new PixelPoint( 0, 0 );

            const point = origin.clone();
            //смещаем точку в пикселах для вычисления допуска в метрах
            point.x += 15;
            point.y += 15;

            const originMapPoint = this.map.pixelToPlane( origin );
            const pointMapPoint = this.map.pixelToPlane( point );
            const deltaX = Math.abs( originMapPoint.x - pointMapPoint.x );
            const deltaY = Math.abs( originMapPoint.y - pointMapPoint.y );

            let pointMin: MapPoint = new MapPoint();
            pointMin.x = Number.MAX_VALUE;
            pointMin.y = Number.MAX_VALUE;
            pointMin.h = Number.MAX_VALUE;

            let pointMax: MapPoint = new MapPoint();
            pointMax.x = Number.MIN_VALUE;
            pointMax.y = Number.MIN_VALUE;
            pointMax.h = Number.MIN_VALUE;

            const selectedObjects = this.map.getSelectedObjectsIterator();
            for ( const mapObject of selectedObjects ) {

                const bounds = mapObject.getBounds();

                if ( bounds.min.x < pointMin.x ) {
                    pointMin.x = bounds.min.x;
                }

                if ( bounds.min.y < pointMin.y ) {
                    pointMin.y = bounds.min.y;
                }

                if ( bounds.min.h < pointMin.h ) {
                    pointMin.h = bounds.min.h;
                }

                if ( bounds.max.x > pointMax.x ) {
                    pointMax.x = bounds.max.x;
                }

                if ( bounds.max.y > pointMax.y ) {
                    pointMax.y = bounds.max.y;
                }

                if ( bounds.max.h > pointMax.h ) {
                    pointMax.h = bounds.max.h;
                }
            }

            const bbox: Bounds = new Bounds( pointMin, pointMax );

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
            // 1------2------3
            // |             |
            // 8             4
            // |             |
            // 7------6------5

            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [0.5 * (leftBottom[ 0 ] + rightTop[ 0 ]), rightTop[ 1 ] + 2 * deltaY], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 0
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [leftBottom[ 0 ], rightTop[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 1
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [0.5 * (leftBottom[ 0 ] + rightTop[ 0 ]), rightTop[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 2
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [rightTop[ 0 ], rightTop[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 3
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [rightTop[ 0 ], 0.5 * (leftBottom[ 1 ] + rightTop[ 1 ])], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 4
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [rightTop[ 0 ], leftBottom[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 5
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [0.5 * (leftBottom[ 0 ] + rightTop[ 0 ]), leftBottom[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 6
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [leftBottom[ 0 ], leftBottom[ 1 ]], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 7
            } );
            this.multiPointBboxObject.updatePoint( MapPoint.fromOriginArray( [leftBottom[ 0 ], 0.5 * (leftBottom[ 1 ] + rightTop[ 1 ])], this.map.ProjectionId ), {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 8
            } );

            this.multiPointBboxObjectInit.updateGeometryFrom( this.multiPointBboxObject );
            this.multiPointBboxObjectCurrent.updateGeometryFrom( this.multiPointBboxObject );

            this.dashedBboxObjectInit.updateGeometryFrom( this.dashedBboxObject );

            const selector = { objectNumber: 0, positionNumber: 0, contourNumber: 0 };
            const point_0 = this.multiPointBboxObjectCurrent.getPoint( selector );
            if ( point_0 ) {
                this.rotationPoint.updatePoint( point_0, selector );
            }

            result = true;
        }

        return result;
    }

    private get scaleCenterSelector() {
        const selector = { objectNumber: 0, positionNumber: 0, contourNumber: 0 };

        switch ( this.scalePointPositionNumber ) {
            case 1:
                selector.positionNumber = 5;
                break;
            case 2:
                selector.positionNumber = 7;
                break;
            case 3:
                selector.positionNumber = 7;
                break;
            case 4:
                selector.positionNumber = 7;
                break;
            case 5:
                selector.positionNumber = 1;
                break;
            case 6:
                selector.positionNumber = 3;
                break;
            case 7:
                selector.positionNumber = 3;
                break;
            case 8:
                selector.positionNumber = 3;
                break;
        }

        return selector;

    }

    private get transformCenter() {

        let selector = { positionNumber: 1, objectNumber: 0, contourNumber: 0 };
        const point_1 = this.multiPointBboxObjectInit.getPoint( selector );
        selector.positionNumber = 7;
        const point_7 = this.multiPointBboxObjectInit.getPoint( selector );
        selector.positionNumber = 5;
        const point_5 = this.multiPointBboxObjectInit.getPoint( selector );

        let center = this.multiPointBboxObjectInit.getCenter();

        if ( point_1 && point_5 && point_7 ) {
            const x = point_1!.distanceTo( point_7! ) / 2. + point_7!.x;
            const y = point_5!.distanceTo( point_7! ) / 2. + point_7!.y;

            center = new MapPoint( x, y, 0, this.map.ProjectionId );
        }

        return center;

    }

    /**
     * Обновление линий построения редактора после трансформирования
     * @private
     * @method updateObject
     */
    private updateObject() {

        if ( this.scalePoint || this.rotatePoint || this.movePoint ) {
            this.multiPointBboxObject.updateGeometryFrom( this.multiPointBboxObjectInit );
            this.dashedBboxObject.updateGeometryFrom( this.dashedBboxObjectInit );

            let selector = { positionNumber: 1, objectNumber: 0, contourNumber: 0 };
            const point_1_old = this.multiPointBboxObject.getPoint( selector );
            selector.positionNumber = 7;
            const point_7_old = this.multiPointBboxObject.getPoint( selector );
            selector.positionNumber = 5;
            const point_5_old = this.multiPointBboxObject.getPoint( selector );

            selector.positionNumber = 1;
            const point_1 = this.multiPointBboxObjectCurrent.getPoint( selector );
            selector.positionNumber = 7;
            const point_7 = this.multiPointBboxObjectCurrent.getPoint( selector );
            selector.positionNumber = 5;
            const point_5 = this.multiPointBboxObjectCurrent.getPoint( selector );

            if ( point_1 && point_5 && point_7 && point_1_old && point_5_old && point_7_old ) {

                const deltaX_old = point_1_old.x - point_7_old.x;
                const deltaY_old = point_5_old.y - point_7_old.y;

                const deltaX = point_1.distanceTo( point_7 );
                const deltaY = point_5.distanceTo( point_7 );

                const initMultiplier = vec2.create();
                vec2.setValues( initMultiplier, 1 / deltaX_old, 1 / deltaY_old );

                const resultMultiplier = vec2.create();
                vec2.setValues( resultMultiplier, deltaX, deltaY );

                const scale = vec2.multiply( initMultiplier, resultMultiplier, vec2.create() );

                const vector0 = vec2.create();
                vec2.setValues( vector0, point_1_old.x - point_7_old.x, point_1_old.y - point_7_old.y );

                const vector1 = vec2.create();
                vec2.setValues( vector1, point_1.x - point_7.x, point_1.y - point_7.y );

                const angleBetween = vec2.angleBetween( vector0, vector1 );
                const rotationDirection = vec2.rotationDirection( vector0, vector1 );
                const rotate = rotationDirection ? angleBetween : -angleBetween;
                const transformCenter = this.transformCenter;

                //TODO ========== scale ==========
                this.multiPointBboxObject.scale( scale, transformCenter );
                this.dashedBboxObject.scale( scale, transformCenter );

                //TODO ========== rotate ==========
                this.multiPointBboxObject.rotate( rotate, transformCenter );
                this.dashedBboxObject.rotate( rotate, transformCenter );

                //TODO ========== move ==========
                const centerCurrent = this.multiPointBboxObjectCurrent.getCenter();
                const center = this.multiPointBboxObject.getCenter();

                const move = { deltaX: centerCurrent.x - center.x, deltaY: centerCurrent.y - center.y };

                this.multiPointBboxObject.move( move );
                this.dashedBboxObject.move( move );

                selector = { objectNumber: 0, positionNumber: 0, contourNumber: 0 };
                const point_0 = this.multiPointBboxObjectCurrent.getPoint( selector );
                if ( point_0 ) {
                    this.rotationPoint.updatePoint( point_0, selector );
                }

                this.transformParams = { transformCenter, scale, rotate, move };
            }

        }
    }

}
