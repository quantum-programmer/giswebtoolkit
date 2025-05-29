/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Обработчик перемещения объектов                  *
 *                                                                  *
 *******************************************************************/

import MapObject from '~/mapobject/MapObject';
import SVGrenderer, { RED_CIRCLE_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import Action, { PRIMARY_PANEL_ID, SAVE_PANEL_ID, ACTION_COMMIT, ACTION_CANCEL } from '~/taskmanager/Action';
import { CURSOR_TYPE } from '~/types/Types';
import { PointInfo } from '~/mapobject/geometry/BaseMapObjectGeometry';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { MapPoint } from '~/geometry/MapPoint';
import VectorLayer from '~/maplayers/VectorLayer';
import GwtkMapEditorTask, { MOVE_OBJECTS_ACTION } from '../task/GwtkMapEditorTask';
import MarkerStyle from '~/style/MarkerStyle';
import i18n from '@/plugins/i18n';


type ActivePoint = {
    mapPoint: MapPoint;
    info: PointInfo;
}

/**
 * Обработчик перемещения объектов
 * @class MoveObjectsAction
 * @extends Action<Task>
 */
export default class MoveObjectsAction<T extends GwtkMapEditorTask> extends Action<T> {

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
     * Описание точки перемещения объекта
     * @private
     * @property [movePoint] {ActivePoint}
     */
    private movePoint?: ActivePoint;

    /**
     * Редактируемые объекты
     * @private
     * @readonly
     * @property [currentObjects] {MapObject[]}
     */
    private currentObjects: MapObject[] = [];

    /**
     * Стиль рисования редактируемого объекта
     * @protected
     * @property currentObjectStyle {Style}
     */
    protected currentObjectStyle = new Style( {
        stroke: new Stroke( { color: 'red', width: '3px', dasharray: '5, 5' } ),
        fill: new Fill( {
            opacity: 0
        } ),
        marker: new MarkerStyle( { markerId: RED_CIRCLE_SVG_MARKER_ID } )
    } );

    private mouseDownPoint: MapPoint = new MapPoint();


    setup() {
        this.map.clearActiveObject();

        if ( !this.currentObjects.length ) {
            this.parentTask.setPanelMessage( { text: 'Select map objects' } );
        }

        this.onSelectObjects();
    }

    destroy() {
        this.currentObjects.splice( 0 );

        this.map.requestRender();
        this.parentTask.resetMessage();
        this.parentTask.removeModePanel();

        this.mapWindow.setCursor( CURSOR_TYPE.default );

    }

    canSelectObject(): boolean {
        return true;
    }

    canMapMove() {
        return this.currentObjects.length === 0;
    }

    async onSelectObjects( mapObjects?: MapObject[] ) {

        const validObjects: MapObject[] = [];

        if ( this.map.getSelectedObjectsCount() === 0 ) {
            return;
        }

        let selectedObjectsIterator = this.map.getSelectedObjectsIterator();

        let canNotUpdateCount = 0;
        for ( const mapObject of selectedObjectsIterator ) {
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

        if ( validObjects.length > 0 ) {
            const removeObjects = this.map.getSelectedObjects().filter(mapObject => !validObjects.includes(mapObject));
            this.map.removeSelectedObjects(removeObjects);

            this.parentTask.loadGeometryForMapObjects( validObjects ).then( ( result ) => {
                if ( result ) {
                    this.currentObjects.splice( 0 );
                    result.forEach( mapObject => this.currentObjects.push( mapObject.copy() ) );
                    this.parentTask.setPanelMessage( {
                        text: 'Number of objects to transform: ',
                        value: this.currentObjects.length + ''
                    } );
                    this.parentTask.createModePanel( this.widgetParams );
                } else {
                    this.quit();
                }
            } );
        }

    }

    onPreRender( renderer: SVGrenderer ) {
        this.currentObjects.forEach( mapObject => {
            if ( mapObject.isDirty ) {
                this.map.requestRender();
                mapObject.isDirty = false;
            }
        } );
    }

    onPostRender( renderer: SVGrenderer ) {
        this.currentObjects.forEach( item => {
            if (item.hasGeometry()) {
                this.map.mapObjectsViewer.drawMapObject(renderer, item, this.currentObjectStyle);
            }
            
        } );
    }

    onMouseDown( event: MouseDeviceEvent ) {
        const mapPoint = this.map.pixelToPlane( event.mousePosition );
        this.movePoint = { mapPoint, info: { objectNumber: 0, contourNumber: 0, positionNumber: 0 } };

        this.mouseDownPoint = mapPoint.copy();
    }

    onMouseUp() {
        this.movePoint = undefined;
    }

    onMouseMove( event: MouseDeviceEvent ) {
        if ( this.currentObjects.length ) {

            this.mapWindow.setCursor( CURSOR_TYPE.crosshair );

            const mousePoint = this.map.pixelToPlane( event.mousePosition );
            if ( this.movePoint ) {

                const point = this.movePoint.mapPoint;

                const move = {
                    deltaX: mousePoint.x - point.x,
                    deltaY: mousePoint.y - point.y
                };

                this.currentObjects.forEach((item) => {
                    if (item.hasGeometry()) {
                        item.move(move);
                    }
                });

                this.movePoint.mapPoint = mousePoint;

                if ( (Math.abs( this.mouseDownPoint.x - mousePoint.x ) > 0)
                    || (Math.abs( this.mouseDownPoint.y - mousePoint.y ) > 0) ) {

                    const button = this.widgetParams[ SAVE_PANEL_ID ].buttons.find( item => item.id === ACTION_COMMIT );
                    if ( button ) {
                        button.enabled = true;
                    }
                }

            }

        }

    }


    async commit() {

        const vectorLayerList: VectorLayer[] = [];

        this.currentObjects.forEach( ( object ) => {
            const vectorLayer = object.vectorLayer;

            if ( !vectorLayerList.includes( vectorLayer ) ) {
                vectorLayer.startTransaction();
                vectorLayerList.push( vectorLayer );
            }
        } );

        this.currentObjects.forEach( object => object.commit() );

        await this.parentTask.commitTransaction( vectorLayerList, MOVE_OBJECTS_ACTION );

        vectorLayerList.forEach( layer => layer.startTransaction() );

        this.currentObjects.forEach( object => object.reload() );

        for ( let i = 0; i < vectorLayerList.length; i++ ) {
            const vectorLayer = vectorLayerList[ i ];
            await vectorLayer.reloadTransaction();
        }

        this.parentTask.setPanelMessage( {
            text: 'Objects transformed: ',
            value: this.currentObjects.length + '',
            isSnackbar: true
        } );

        const selectedObjects = this.map.getSelectedObjects();
        // TODO: Заменить на HashMap
        selectedObjects.forEach( selectedObj => {
            const mapObject = this.currentObjects.find( currentObj => currentObj.gmlId === selectedObj.gmlId );
            if ( mapObject ) {
                selectedObj.updateGeometryFrom( mapObject );
            }
        } );

        this.quit();
    }


    revert() {
        this.quit();
    }


}
