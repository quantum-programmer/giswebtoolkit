/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Обработчик правки точек объекта                 *
 *                                                                  *
 *******************************************************************/

import Action from '~/taskmanager/Action';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import Stroke from '~/style/Stroke';
import Style from '~/style/Style';
import SVGrenderer, { RED_CIRCLE_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import VectorLayer from '~/maplayers/VectorLayer';
import { CURSOR_TYPE } from '~/types/Types';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { PointInfo } from '~/mapobject/geometry/BaseMapObjectGeometry';
import Fill from '~/style/Fill';
import GwtkMapEditorTask, { SEGMENT_ADD_POINT_ACTION } from '../task/GwtkMapEditorTask';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import MarkerStyle from '~/style/MarkerStyle';
import i18n from '@/plugins/i18n';


/**
 * Обработчик правки точек объекта
 * @class SelectSegmentAction
 * @extends Action
 */
export default class SelectSegmentAction<T extends GwtkMapEditorTask> extends Action<T> {

    /**
     * Редактируемый объект
     * @private
     * @readonly
     * @property [currentObject] {MapObject}
     */
    private currentObject?: MapObject;

    /**
     * Объект выбранной точки объекта
     * @private
     * @readonly
     * @property pointObject {MapObject}
     */
    private readonly currentPointObject: MapObject;

    /**
     * Стиль рисования редактируемого объекта
     * @private
     * @readonly
     * @property currentObjectStyle {Style}
     */
    private readonly currentObjectStyle = new Style( {
        stroke: new Stroke( {
            color: 'black',
            width: '1px'
        } ),
        fill: new Fill( {
            color: 'red',
            opacity: 0
        } )
    } );

    /**
     * Стиль рисования выбранной точки объекта
     * @private
     * @readonly
     * @property currentPointObjectStyle {Style}
     */
    private readonly currentPointObjectStyle = new Style( { marker: new MarkerStyle( { markerId: RED_CIRCLE_SVG_MARKER_ID } ) } );

    /**
     * Текущее значение области захвата точек привязки
     * @private
     * @property deltaPix {number}
     */
    private deltaPix = 10;

    /**
     * Селектор редактируемой точки
     * @private
     * @property [selector] {PointInfo}
     */
    private selector?: PointInfo;

    /**
     * Селектор точки под курсором
     * @private
     * @property [selectorCandidate] {PointInfo}
     */
    private selectorCandidate?: PointInfo;

    /**
     * Селектор выбранной точки объекта
     * @private
     * @property pointSelectors {PointInfo[]}
     */
    private readonly pointSelectors: PointInfo[] = [];

    /**
     * Вид курсора
     * @private
     * @readonly
     * @property cursor {CURSOR_TYPE}
     */
    private readonly cursor: CURSOR_TYPE;

    /**
     * @constructor SelectSegmentAction
     * @param task {Task} Экземпляр родительской задачи
     * @param id {string} Идентификатор обработчика
     */
    constructor( task: T, id: string ) {
        super( task, id );
        this.cursor = this.mapWindow.setCursor( CURSOR_TYPE.default );

        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        this.currentPointObject = new MapObject( tempVectorLayer, MapObjectType.MultiPoint );

    }

    destroy() {
        this.mapWindow.setCursor( this.cursor );

        this.map.requestRender();
    }

    setup() {
        this.selectObject( this.map.getActiveObject() );
    }

    canSelectObject() {
        return !this.currentObject;
    }

    selectObject( mapObject?: MapObject ) {
        if ( !this.currentObject && mapObject ) {

            const canUpdate = mapObject.getEditFlag();
            if (!canUpdate) {
                this.mapWindow.addSnackBarMessage(i18n.tc('mapeditor.Selected object is not available for editing'));
                return;
            }

            if ( this.mapWindow.getTaskManager().canSelectThisObject( mapObject ) ) {
                //если у объекта редактирования есть точки, то построение рисуем с крайней точки
                this.currentObject = mapObject;
            }

            this.map.clearActiveObject();
        }

        if ( !this.currentObject ) {
            this.parentTask.setPanelMessage( { text: 'Select map object' } );
        } else {
            if ( this.pointSelectors.length === 0 ) {
                this.parentTask.setPanelMessage( { text: 'Select start point' } );
            }
        }
    }

    canClose() {
        return true;
    }

    canMapMove() {
        return true;
    }

    onPreRender( renderer: SVGrenderer ) {
        if ( this.currentPointObject.isDirty || this.currentObject && this.currentObject.isDirty ) {
            this.currentPointObject.isDirty = false;
            if ( this.currentObject ) {
                this.currentObject.isDirty = false;
            }
            this.map.requestRender();
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        this.map.mapObjectsViewer.drawMapObject( renderer, this.currentPointObject, this.currentPointObjectStyle );

        if ( this.currentObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.currentObject, this.currentObjectStyle );
        }
    }

    onMouseUp( event: MouseDeviceEvent ) {
        //fixme: иначе стандартный обработчик mouseup меняет
        this.mapWindow.setCursor( CURSOR_TYPE.default );
        this.selectorCandidate = undefined;
    }

    onMouseDown( event: MouseDeviceEvent ) {
        if ( this.currentObject && !this.selectorCandidate ) {
            this.onMouseMove( event );
        }
    }

    onMouseClick( event: MouseDeviceEvent ) {
        if ( this.currentObject && !this.selectorCandidate ) {
            this.onMouseMove( event );
        }

        if ( this.selectorCandidate && this.currentObject ) {
            this.pointSelectors.push( this.selectorCandidate );
            this.currentPointObject.addPoint( this.currentObject.getPoint( this.selectorCandidate )! );
            this.selectorCandidate = undefined;
        }

        if ( this.pointSelectors.length === 1 ) {
            this.parentTask.setPanelMessage( { text: 'Select middle point' } );
        } else if ( this.pointSelectors.length === 2 ) {
            this.parentTask.setPanelMessage( { text: 'Select end point' } );
        } else if ( this.pointSelectors.length === 3 ) {
            if ( this.currentObject ) {
                this.map.setActiveObject( this.currentObject );
            }
            this.parentTask.resetMessage();
            this.parentTask.setState( SEGMENT_ADD_POINT_ACTION, this.pointSelectors );
        }
    }

    onMouseMove( event: MouseDeviceEvent ) {

        this.mapWindow.setCursor( CURSOR_TYPE.default );

        this.selectorCandidate = undefined;

        if ( this.currentObject ) {
            const map = this.mapWindow.getMap();
            const point = event.mousePosition.clone(),
                pointXY = map.pixelToPlane( point );

            //смещаем точку в пикселах для вычисления допуска в метрах
            point.x += this.deltaPix;
            point.y += this.deltaPix;

            const pointXYSupport = map.pixelToPlane( point );

            const cursorMapPoint = map.pixelToPlane( event.mousePosition );
            //допуск попадания в точку
            const delta = Math.max( Math.abs( pointXYSupport.x - pointXY.x ), Math.abs( pointXYSupport.y - pointXY.y ) );

            const result = this.currentObject.checkPointHover( cursorMapPoint, delta );
            if ( result ) {
                this.selectorCandidate = result;
                //fixme: иначе стандартный обработчик mouseup меняет
                this.mapWindow.setCursor( CURSOR_TYPE.pointer );
            }
        }
    }

    updateCriteriaAggregator( criteriaAggregator: CriteriaAggregator ) {
        this.parentTask.updateCriteriaAggregator( criteriaAggregator );
    }

    canSelectThisObject( mapObject: MapObject ): boolean {
        const vectorLayer = this.parentTask.vectorLayer;
        return !!this.currentObject || (!!vectorLayer && vectorLayer.isEditable && vectorLayer.id === mapObject.vectorLayer.id);
    }

}
