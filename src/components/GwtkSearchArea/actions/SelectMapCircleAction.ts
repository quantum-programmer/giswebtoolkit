/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Выбор фрагмента карты в радиусе от точки              *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import AppendPointAction from '~/systemActions/AppendPointAction';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import PixelPoint from '~/geometry/PixelPoint';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import { LOCALE } from '~/types/CommonTypes';
import SVGrenderer, { RED_CIRCLE_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import Style from '~/style/Style';
import MarkerStyle from '~/style/MarkerStyle';
import Stroke from '~/style/Stroke';
import { CURSOR_TYPE } from '~/types/Types';
import { VIEW_SETTINGS_ZOOM_LEVEL, WorkspaceValues } from '~/utils/WorkspaceManager';

export const SELECT_CIRCLE = 'selectsample.circle';


/**
 * Обработчик выбора области-радиус
 * @class SelectMapCircleAction
 * @extends AppendPointAction<GwtkSearchAreaTask>
 */
export default class SelectMapCircleAction extends AppendPointAction<Task> {

    private readonly container: HTMLDivElement;
    /**
     * Координаты центра объекта поиска
     * @private
     */
    private circleCenter?: PixelPoint;

    /**
     * Объект центр области поиска
     * @private
     */
    private readonly pointObjectCenter: MapObject;

    /**
     * Объект области поиска
     * @private
     * @property mapObject {MapObject|undefined}
     */
    private readonly circleObject: MapObject;

    /**
     *
     * @param task
     * @param id
     */
    constructor( task: Task, id: string ) {
        super( task, id );

        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        this.pointObjectCenter = new MapObject( tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point } );

        this.circleObject = new MapObject( tempVectorLayer, MapObjectType.Polygon, { local: LOCALE.Plane } );

        this.mapWindow.setCursor( CURSOR_TYPE.crosshair );
        this.container = this.map.drawPane;
    }

    /**
     * @method setup
     */
    setup() {
        const ws = this.map.getSize();
        this.container.style.width = ws.x + 'px';
        this.container.style.height = ws.y + 'px';
        this.currentObject = this.circleObject;
    }

    /**
     * @method destroy
     */
    destroy() {
        super.destroy();
        this.mapWindow.setCursor( CURSOR_TYPE.default );
        this.removeLabel();
        this.pointObjectCenter.removeAllPoints();
        this.circleCenter = undefined;
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
     * @method commit
     */
    commit() {
        if ( this.circleCenter && this.circleObject.getPointList().length > 0 ) {
            this.parentTask.setState( SELECT_CIRCLE, this.circleObject );
            super.commit();
        }
    }

    /**
     * @method onMouseMove
     * @param event
     */
    onMouseMove( event: MouseDeviceEvent ) {
        if ( this.circleCenter ) {
            this.getCircle( event.mousePosition );
        }
    }

    /**
     * @method onMouseDown
     * @param event
     */
    onMouseDown( event: MouseDeviceEvent ) {
        if ( !this.circleCenter ) {
            this.pointObjectCenter.removeAllPoints();

            const map = this.mapWindow.getMap();
            const pointXY = map.pixelToPlane( event.mousePosition.clone() );

            if ( pointXY ) {
                this.pointObjectCenter.addPoint( pointXY );
                this.circleCenter = event.mousePosition.clone();
            }
        }
    }

    /**
     * @method onMouseUp
     * @param event
     */
    onMouseUp( event: MouseDeviceEvent ) {
        super.onMouseUp( event );
        this.commit();
    }

    /**
     * Получить координаты кривой окружности
     * @method getCircle
     * @param point {Point} координаты точки отпускания мыши
     */
    private getCircle( point: PixelPoint ) {
        if ( this.circleCenter ) {
            this.circleObject.removeAllPoints();

            const pointXY = this.mapWindow.getMap().pixelToPlane( point.clone() );

            let centerPlane = this.mapWindow.getMap().pixelToPlane( this.circleCenter );
            let radius = this.circleCenter.distanceTo( point ) || 0;
            radius = radius < 6 ? 6 : radius;

            if ( pointXY ) {
                for ( let numberPoint = 0; numberPoint < 361; numberPoint = numberPoint + 10 ) {
                    let xPoint = Math.cos( Math.PI * numberPoint / 180 ) * radius + this.circleCenter.x;
                    let yPoint = Math.sin( Math.PI * numberPoint / 180 ) * radius + this.circleCenter.y;
                    if ( xPoint && yPoint ) {
                        const pointXYCircle = new PixelPoint( xPoint, yPoint );
                        const pointXYPlace = this.mapWindow.getMap().pixelToPlane( pointXYCircle );
                        if ( pointXYPlace ) {
                            this.circleObject.addPoint( pointXYPlace );
                        }
                    }
                }
            }

            let radius_meter = 0;
            const firstCirclePoint = this.circleObject.getPoint( {} );
            if ( firstCirclePoint ) {
                radius_meter = centerPlane.realDistanceTo( firstCirclePoint );
            }

            this.circleObject.closeObject();

            // Показать значение радиуса
            this.showLabel( point.x, point.y, radius_meter );
        }
    }


    /**
     * Показать значение радиуса
     * @method showLabel
     */
    private showLabel( x: number, y: number, r: number ) {

        let elem = this.container.querySelector( '.info-label' );
        if ( !elem ) {
            elem = GWTK.DomUtil.create( 'div', 'ruler-point-hint selectcircle-label info-label', this.container ) as HTMLDivElement;
        } else elem = elem as HTMLDivElement;

        if ( elem ) {
            let label = elem as HTMLDivElement;
            if ( label ) {
                label.style.left = x.toString() + 'px';
                label.style.top = y.toString() + 'px';
                let radius = Math.floor(r);
                let units = ' м';
                if (radius > 1000) {
                    radius = radius / 1000.0;
                    units = ' км';
                }
                label.innerHTML = ('R = ' + GWTK.Util.formatting( radius, units ));
            }
        }
    }

    /**
     * Удалить отметку радиуса
     * @method removeLabel
     */
    private removeLabel() {
        const elem = this.container.querySelector( '.info-label' );
        if ( elem ) this.container.removeChild( elem );
    }

    /**
     * Обработчик события перед рисованием карты
     * @method onPreRender
     */
    onPreRender( renderer: SVGrenderer ) {
        if ( this.pointObjectCenter.isDirty || this.circleObject.isDirty ) {
            this.pointObjectCenter.isDirty = false;
            this.circleObject.isDirty = false;
            this.map.requestRender();
        }
    }

    /**
     * Обработчик события после отрисовки карты
     * @method onPostRender
     */
    onPostRender( renderer: SVGrenderer ) {
        let style = new Style( { marker: new MarkerStyle( { markerId: RED_CIRCLE_SVG_MARKER_ID } ) } );
        this.map.mapObjectsViewer.drawMapObject( renderer, this.pointObjectCenter, style );
        let styleLine = new Style( { stroke: new Stroke( { color: 'red', opacity: 1, dasharray: '5 5' } ) } );
        this.map.mapObjectsViewer.drawMapObject( renderer, this.circleObject, styleLine );
    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( type === VIEW_SETTINGS_ZOOM_LEVEL ) {
            if ( this.circleCenter ) {
                let centerPoint = this.pointObjectCenter.getPointList()[ 0 ];
                let centerPointGeo = centerPoint.toGeoPoint();
                if ( centerPointGeo ) {
                    this.circleCenter = this.mapWindow.getMap().geoToPixel( centerPointGeo, this.mapWindow.getMap().getZoom() );
                }
            }
        }
    }

    revert() {
        this.parentTask.quitAction( this.id );
    }

}
