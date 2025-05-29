/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Создать рамку для масштабирования                   *
 *                                                                  *
 *******************************************************************/

import { CURSOR_TYPE } from '~/types/Types';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import { LOCALE } from '~/types/CommonTypes';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import PixelPoint from '~/geometry/PixelPoint';
import SVGrenderer from '~/renderer/SVGrenderer';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import { VIEW_SETTINGS_ZOOM_LEVEL, WorkspaceValues } from '~/utils/WorkspaceManager';
import { MapPoint } from '~/geometry/MapPoint';
import Action, { ACTION_CANCEL, ACTION_COMMIT } from '~/taskmanager/Action';
import Task from '~/taskmanager/Task';


/**
 * Обработчик выбора области-полигона
 * @class SelectScalingFrameAction
 * @extends Action<Task>
 */
export default class SelectScalingFrameAction extends Action<Task> {

    private firstPoint: PixelPoint | undefined;
    private oldCursor: CURSOR_TYPE = CURSOR_TYPE.default;

    /**
     * Объект рамки масштабирования
     * @private
     * @property frameObject {MapObject|undefined}
     */
    private readonly frameObject: MapObject;

    constructor( task: Task, id: string ) {
        super( task, id );
        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        this.frameObject = new MapObject( tempVectorLayer, MapObjectType.Polygon, { local: LOCALE.Plane } );
    }

    destroy() {
        this.mapWindow.setCursor( this.oldCursor );
        this.map.requestRender();
    }

    /**
     * Запретить перемещение карты
     * @method canMapMove
     */
    canMapMove(): boolean {
        return false;
    }

    /**
     * Применить данные
     * @method run
     */
    commit() {
        if ( this.frameObject && this.frameObject.getPointList().length >= 4 ) {
            this.firstPoint = undefined;
            this.frameObject.isDirty = false;
            this.parentTask.setState( ACTION_COMMIT, this.frameObject.getBounds() );
        }
    }

    revert() {
        this.parentTask.setState( ACTION_CANCEL, undefined );
    }

    /**
     * @method onMouseMove
     * @param event
     */
    onMouseMove( event: MouseDeviceEvent ) {
        this.oldCursor = this.mapWindow.setCursor( CURSOR_TYPE.crosshair );
        if ( this.firstPoint ) {
            this.getRectangle( event.mousePosition );
        }
    }

    /**
     * @method onMouseDown
     * @param event
     */
    onMouseDown( event: MouseDeviceEvent ) {
        if ( !this.firstPoint ) {
            this.firstPoint = event.mousePosition.clone();
        }
    }

    /**
     * @method onMouseUp
     * @param event
     */
    onMouseUp( event: MouseDeviceEvent ) {
        this.commit();
    }

    /**
     * Получить координаты прямоугольной области
     * @method getRectangle
     * @param point {Point} координаты точки отпускания мыши
     */
    private getRectangle( point: PixelPoint ) {
        if ( this.firstPoint ) {
            this.frameObject.removeAllPoints();

            const firstPointPlace = this.mapWindow.getMap().pixelToPlane( this.firstPoint );
            let newPointXYPlace1 = new MapPoint( firstPointPlace.x, firstPointPlace.y );
            this.frameObject.addPoint( newPointXYPlace1 );

            const pointXYPlace = this.mapWindow.getMap().pixelToPlane( point.clone() );

            let newPointXYPlace: MapPoint = new MapPoint( firstPointPlace.x, pointXYPlace.y );
            this.frameObject.addPoint( newPointXYPlace );

            newPointXYPlace = new MapPoint( pointXYPlace.x, pointXYPlace.y );
            this.frameObject.addPoint( newPointXYPlace );

            newPointXYPlace = new MapPoint( pointXYPlace.x, firstPointPlace.y );
            this.frameObject.addPoint( newPointXYPlace );

            this.frameObject.addPoint( newPointXYPlace1 );

            this.frameObject.closeObject();
        }
    }

    /**
     * Обработчик события перед рисованием карты
     * @method onPreRender
     */
    onPreRender( renderer: SVGrenderer ) {
        if ( this.frameObject.isDirty ) {
            this.frameObject.isDirty = false;
            this.map.requestRender();
        }
    }

    /**
     * Обработчик события после отрисовки карты
     * @method onPostRender
     */
    onPostRender( renderer: SVGrenderer ) {
        if ( this.firstPoint ) {
            let styleLine = new Style( { stroke: new Stroke( { color: 'red', opacity: 1, dasharray: '5 5' } ) } );
            this.map.mapObjectsViewer.drawMapObject( renderer, this.frameObject, styleLine );
        }
    }

    /**
     *
     * @param type
     */
    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( type === VIEW_SETTINGS_ZOOM_LEVEL ) {
            if ( this.firstPoint ) {
                let firstPointGeo = this.frameObject.getPointList()[ 0 ].toGeoPoint();
                if ( firstPointGeo ) {
                    this.firstPoint = this.mapWindow.getMap().geoToPixel( firstPointGeo, this.mapWindow.getMap().getZoom() );
                }
            }
            this.mapWindow.setCursor( CURSOR_TYPE.crosshair );
        }
    }

}

