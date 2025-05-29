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

import Action from '~/taskmanager/Action';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import { CURSOR_TYPE } from '~/types/Types';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { PointInfo } from '~/mapobject/geometry/BaseMapObjectGeometry';
import VectorLayer from '~/maplayers/VectorLayer';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import SVGrenderer, {
    RED_CIRCLE_SVG_MARKER_ID,
    DEFAULT_SMALL_SVG_MARKER_ID,
    DEFAULT_SVG_MARKER_ID,
    GREEN_CIRCLE_SMALL_SVG_MARKER_ID
} from '~/renderer/SVGrenderer';
import Fill from '~/style/Fill';
import Task from '~/taskmanager/Task';
import MarkerStyle from '~/style/MarkerStyle';
import { LOCALE, LogEventType } from '~/types/CommonTypes';
import { MapPoint } from '~/geometry/MapPoint';
import { VIEW_SETTINGS_ZOOM_LEVEL, WorkspaceValues } from '~/utils/WorkspaceManager';


const DELTA_PIX = 10;

export type ActivePoint = {
    mapPoint: MapPoint;
    info: PointInfo;
}

/**
 * Обработчик редактирования объекта
 * @class PointEditAction
 * @extends Action<Task>
 */
export default class PointEditAction<T extends Task = Task> extends Action<T> {

    /**
     * Точка под курсором
     * @protected
     * @property [hoverPoint] {object}
     */
    protected hoverPoint?: { info: PointInfo; objectId: string; };

    /**
     * Описание редактируемой точки объекта
     * @private
     * @property [editPoint] {ActivePoint}
     */
    protected editPoint?: ActivePoint;

    /**
     * Редактируемый объект
     * @protected
     * @readonly
     * @property [currentObject] {MapObject}
     */
    protected currentObject?: MapObject;

    /**
     * Стиль рисования редактируемого объекта
     * @protected
     * @property currentObjectStyle {Style}
     */
    protected currentObjectStyle = new Style( {
        stroke: new Stroke( {
            color: 'red',
            width: '3px',
            dasharray: '5, 5'
        } ),
        fill: new Fill( {
            opacity: 0
        } )
    } );

    /**
     * Объект узлов редактируемого объекта
     * @private
     * @readonly
     * @property [currentMultiPointObject] {MapObject}
     */
    protected readonly currentMultiPointObject: MapObject;
    /**
     * Стиль узлов метрики объекта
     * @private
     * @readonly
     * @property currentMultiPointObjectStyle {Style}
     */
    protected readonly currentMultiPointObjectStyle = new Style( {
        marker: new MarkerStyle( {
            markerId: DEFAULT_SMALL_SVG_MARKER_ID
        } )
    } );

    /**
     * Вид курсора
     * @protected
     * @readonly
     * @property cursor {CURSOR_TYPE}
     */
    protected readonly cursor: CURSOR_TYPE;

    /**
     * Массив объектов карты (для привязки точек)
     * @private
     * @property mapObjectsResult {MapObject[]}
     */
    protected mapObjectsResult: MapObject[] = [];

    /**
     * Объект выделения точки
     * @private
     * @readonly
     * @property pointObject {MapObject}
     */
    protected readonly pointObject: MapObject;

    /**
     * Стиль рисования точки
     * @private
     * @readonly
     * @property pointObjectStyle {Style}
     */
    private readonly pointObjectStyle = new Style( {
        marker: new MarkerStyle( {
            markerId: DEFAULT_SVG_MARKER_ID
        } )
    } );

    /**
     * Активный объект с точками привязки
     * @private
     * @property [hoverObject] {MapObject}
     */
    protected hoverObject?: MapObject;

    /**
     * Стиль активного объекта с точками привязки
     * @private
     * @readonly
     * @property hoverObjectStyle {Style}
     */
    protected readonly hoverObjectStyle = new Style( {
        stroke: new Stroke( { color: 'green', opacity: 0.7 } ),
        marker: new MarkerStyle( { markerId: GREEN_CIRCLE_SMALL_SVG_MARKER_ID } )
    } );

    /**
     * Объект редактируемой точки
     * @private
     * @readonly
     * @property editPointObject {MapObject}
     */
    protected readonly editPointObject: MapObject;
    /**
     * Стиль объекта редактируемой точки
     * @private
     * @readonly
     * @property hoverPointStyle {Style}
     */
    protected readonly hoverPointStyle = new Style( {
        marker: new MarkerStyle( {
            markerId: RED_CIRCLE_SVG_MARKER_ID
        } )
    } );

    /**
     * @constructor QuickEditAction
     * @param task {Task} Экземпляр родительской задачи
     * @param id {string} Идентификатор обработчика
     */
    constructor( task: T, id: string ) {
        super( task, id );
        this.cursor = this.mapWindow.setCursor( CURSOR_TYPE.default );
        this.mapWindow.setCursor( this.cursor );

        //создаем слой для построения
        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        this.currentMultiPointObject = new MapObject( tempVectorLayer, MapObjectType.MultiPoint, { local: LOCALE.Point } );
        this.currentMultiPointObject.addStyle( this.currentMultiPointObjectStyle );

        this.pointObject = new MapObject( tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point } );

        // объект текущей редактируемой точки
        this.editPointObject = new MapObject( tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point } );
        this.editPointObject.addStyle( this.hoverPointStyle );
    }

    setup() {

        const mapObject = this.map.getActiveObject();
        if ( mapObject && !this.mapWindow.getTaskManager().canSelectThisObject( mapObject ) ) {
            this.map.clearActiveObject();
        } else {
            this.selectObject( mapObject );
        }

        if ( !this.currentObject ) {
            this.parentTask.setPanelMessage( { text: 'Select map object' } );
        }
    }

    destroy() {
        this.mapWindow.setCursor( this.cursor );
        if ( this.currentObject ) {
            this.map.setActiveObject( this.currentObject );
        }
        this.map.requestRender();
        this.parentTask.resetMessage();
    }

    canMapMove() {
        return !this.editPoint;
    }

    canSelectObject() {
        return !this.currentObject;
    }

    selectObject( mapObject?: MapObject ) {
        if ( !this.currentObject && mapObject ) {

            const canUpdate = mapObject.getEditFlag();
            if (!canUpdate) {
                this.mapWindow.addSnackBarMessage(this.map.translate('Selected object is not available for editing'));
                return;
            }

            const pointList = mapObject.getPointList();
            for ( let pointIndex = 0; pointIndex < pointList.length; pointIndex++ ) {
                this.currentMultiPointObject.addPoint( pointList[ pointIndex ] );
            }

            this.currentObject = mapObject;
            if(!this.currentObject.hasGeometry()) {
                this.currentObject.loadGeometry();
            }
            this.currentObject.isDirty = true;

            this.parentTask.resetMessage();

            this.map.clearActiveObject();

            this.loadMapObjects().then( result => {
                if ( result ) {
                    this.mapObjectsResult = result;
                }
            } ).catch( ( e ) => {
                this.map.writeProtocolMessage( { text: e, type: LogEventType.Error } );
                console.error( e );
            } );
        }
    }

    onPreRender( renderer: SVGrenderer ) {
        if ( this.currentObject && this.currentObject.isDirty ) {
            this.currentObject.isDirty = false;
            this.map.requestRender();
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        if ( this.currentObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.currentObject, this.currentObjectStyle );

            this.map.mapObjectsViewer.drawMapObject( renderer, this.currentMultiPointObject );

            if ( this.hoverObject ) {
                this.map.mapObjectsViewer.drawMapObject( renderer, this.hoverObject, this.hoverObjectStyle );
            }

            this.map.mapObjectsViewer.drawMapObject( renderer, this.editPointObject );
        }

    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( type === VIEW_SETTINGS_ZOOM_LEVEL ) {
            this.updateRect();
            this.loadMapObjects().then( result => {
                if ( result ) {
                    this.mapObjectsResult = result;
                }
            } ).catch( ( e ) => {
                this.map.writeProtocolMessage( { text: e, type: LogEventType.Error } );
                console.error( e );
            } );
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
            }
        }

    }

    onMouseUp() {
        if ( this.editPoint ) {
            this.mapWindow.getTaskManager().onCommit();
        }
        this.editPoint = undefined;
        this.hoverPoint = undefined;

        this.mapWindow.setCursor( CURSOR_TYPE.pointer );
    }

    async commit() {
        if ( this.currentObject ) {
            await this.currentObject.commit();
            this.updateRect();
        }

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
                    if ( mapObject.gmlId === this.currentObject.gmlId || !mapObject.checkPointWithin( mousePoint ) ) {
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

                if ( this.hoverPoint ) {
                    this.mapWindow.setCursor( CURSOR_TYPE.pointer );
                } else {
                    this.mapWindow.setCursor( CURSOR_TYPE.default );
                }
            }


        }
    }

    revert() {
        this.parentTask.quitAction( this.id );
    }

    /**
     * Обновление линий построения редактора
     * @protected
     * @method updateRect
     */
    protected updateRect() {
        if ( this.currentObject ) {
            this.currentMultiPointObject.removeAllPoints();
            const pointList = this.currentObject.getPointList();
            for ( let pointIndex = 0; pointIndex < pointList.length; pointIndex++ ) {
                this.currentMultiPointObject.addPoint( pointList[ pointIndex ] );
            }
        }
    }
}
