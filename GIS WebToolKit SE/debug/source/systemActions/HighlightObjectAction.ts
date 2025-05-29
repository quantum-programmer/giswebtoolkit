/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Обработчик выделения объекта                      *
 *                                                                  *
 *******************************************************************/

import Action from '~/taskmanager/Action';
import MapObject from '~/mapobject/MapObject';
import SVGrenderer, { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import { CURSOR_TYPE } from '~/types/Types';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import SearchManager from '~/services/Search/SearchManager';
import Style from '~/style/Style';
import Fill from '~/style/Fill';
import Stroke from '~/style/Stroke';
import MarkerStyle from '~/style/MarkerStyle';
import TextStyle from '~/style/TextStyle';
import { VIEW_SETTINGS_ZOOM_LEVEL, WorkspaceValues, VIEW_SETTINGS_MAPCENTER } from '~/utils/WorkspaceManager';
import { LogEventType } from '~/types/CommonTypes';
import Task from '~/taskmanager/Task';
import { DataChangedEvent } from '~/taskmanager/TaskManager';


const DELTA_PIX = 6;

/**
 * Обработчик выделения объекта
 * @class HighlightObjectAction
 * @extends Action
 */
export default class HighlightObjectAction<T extends Task> extends Action<T> {

    /**
     * Вид курсора
     * @private
     * @property cursor {CURSOR_TYPE}
     */
    private cursor?: CURSOR_TYPE;

    protected mapObjectList: MapObject[] = [];

    mapObject?: MapObject;
    /**
     * Флаг изменения состояния
     * @property {boolean} isRender
     */
    protected isRender = true;


    /**
     * Стиль рисования объекта
     * @private
     * @readonly
     * @property mergeObjectStyle {Style}
     */
    private readonly mapObjectStyle = new Style( {
        stroke: new Stroke( {
            color: 'green',
            width: '2px'
        } ),
        fill: new Fill( {
            opacity: 0.1
        } ),
        marker: new MarkerStyle( { markerId: DEFAULT_SVG_MARKER_ID } ),
        text: new TextStyle( { color: 'green' } )
    } );

    searchManager?: SearchManager;

    /**
     * @constructor HighlightObjectAction
     * @param task {Task} Экземпляр родительской задачи
     * @param id {string} Идентификатор обработчика
     */
    constructor( task: T, id: string ) {
        super( task, id );
    }

    destroy() {
        if ( this.cursor ) {
            this.mapWindow.setCursor( this.cursor );
            this.cursor = undefined;
        }
        this.mapObject = undefined;
        this.map.requestRender();
        if ( this.parentTask.id !== 'gwtkuserThematic.main' ) {
            this.mapWindow.getTaskManager().detachTask( this.parentTask.id, true );
        }
    }

    setup() {
        this.map.clearActiveObject();

        this.cursor = this.mapWindow.setCursor( CURSOR_TYPE.default );
        this.loadMapObjects().then( result => {
            if ( result ) {
                this.mapObjectList = result;
            }
        } ).catch( ( e ) => {
            this.map.writeProtocolMessage( { text: e, type: LogEventType.Error } );
            console.error( e );
        } );
    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if (type === VIEW_SETTINGS_ZOOM_LEVEL) {
            this.isRender = true;
            this.loadMapObjects().then(result => {
                if (result) {
                    this.mapObjectList = result;
                }
            }).catch((e) => {
                this.map.writeProtocolMessage({ text: e, type: LogEventType.Error });
                console.error(e);
            });
        } else if (type === VIEW_SETTINGS_MAPCENTER) {
            this.isRender = true;
        }
    }

    canClose() {
        return true;
    }

    canMapMove() {
        return true;
    }

    canShowObjectPanel(): boolean {
        return true;
    }

    onPreRender( renderer: SVGrenderer ) {
        if ( this.isRender ) {
            this.isRender = false;
            this.map.requestRender();
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        if ( this.mapObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.mapObject, this.mapObjectStyle );
        }
    }

    canSelectObject() {
        return false;
    }

    onMouseClick( event: MouseDeviceEvent ) {
        if ( this.mapObject ) {
            const existObject = this.map.getSelectedObjectById( this.mapObject.gmlId, this.mapObject.vectorLayer.serviceUrl, this.mapObject.vectorLayer.idLayer );
            if ( existObject ) {
                this.map.removeSelectedObject( existObject );
            } else {
                this.map.addSelectedObject( this.mapObject );
            }
        }
    }

    onMouseMove( event: MouseDeviceEvent ) {
        const previousMapObject = this.mapObject;

        this.mapObject = undefined;
        this.mapWindow.setCursor( CURSOR_TYPE.default );

        const map = this.mapWindow.getMap(),
            point = event.mousePosition.clone(),
            coord = map.pixelToPlane( point );

        //смещаем точку в пикселах для вычисления допуска в метрах
        point.x += DELTA_PIX;
        point.y += DELTA_PIX;

        const coordSupport = map.pixelToPlane( point );
        if ( coord ) {
            const cursorMapPoint = this.mapWindow.getMap().pixelToPlane( event.mousePosition );

            //допуск попадания в точку
            const delta = Math.max( Math.abs( coordSupport.x - coord.x ), Math.abs( coordSupport.y - coord.y ) );

            let hoverResult;

            for ( let i = 0; i < this.mapObjectList.length; i++ ) {
                const mapObject = this.mapObjectList[ i ];
                hoverResult = mapObject.checkHover( cursorMapPoint, delta );
                if ( hoverResult ) {
                    this.mapObject = mapObject;
                    if ( !previousMapObject || !previousMapObject.hasSameOriginTo( this.mapObject ) ) {
                        this.isRender = true;
                    }
                    this.mapWindow.setCursor( CURSOR_TYPE.pointer );
                    break;
                }
            }
        }
    }


    revert() {
        this.parentTask.quitAction( this.id );
    }


    onMouseDelayedClick( event: MouseDeviceEvent ) {
        super.onMouseDelayedClick( event );
    }

    onDataChanged( event: DataChangedEvent ) {
        if ( event.type === 'content' || (event.type === 'layercommand' && event.command === 'visibilitychanged') ) {
            //TODO: поверить слой на участие в загрузке объектов
            this.cursor = this.mapWindow.setCursor( CURSOR_TYPE.default );
            if ( this.map.tiles.getSelectableLayersArray().length > 0 ) {
                this.loadMapObjects().then( result => {
                    if ( result ) {
                        this.mapObjectList = result;
                    }
                } ).catch( ( e ) => {
                    this.map.writeProtocolMessage( { text: e, type: LogEventType.Error } );
                    console.error( e );
                } );
            }
            this.resetSelectedObjectList();
        }
    }

    protected async loadMapObjects(): Promise<MapObject[] | undefined> {
        if ( !this.searchManager ) {
            this.searchManager = new SearchManager( this.map );
        }
        const result = await this.searchManager.findWithinBounds( this.map.getWindowBounds() );
        if ( result && result.mapObjects ) {
            return MapObject.sortMapObjectsByType( result.mapObjects );
        }
    }

    private resetSelectedObjectList(): void {
        const allLayers = this.map.tiles.getSelectableLayersArray(); // видимые слои
        const xIds = allLayers.map( layer => layer.xId );

        const objectsToBeRemoved = this.map.getSelectedObjects().filter( mapObject => !xIds.includes( mapObject.vectorLayer.xId ) );

        this.map.removeSelectedObjects( objectsToBeRemoved );
    }

}
