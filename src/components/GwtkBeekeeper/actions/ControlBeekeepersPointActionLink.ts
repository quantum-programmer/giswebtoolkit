/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *   Обработчик устоновки и редактирования пчеловодов в виде точок  *
 *                                                                  *
 *******************************************************************/


import ActionLink from '~/taskmanager/ActionLink';
import GwtkBeekeeperTask, {
    CREATE_MODE_ACTION, CREATE_MODE_BY_GEOLOCATION_ACTION,
    DELETE_MODE_ACTION, EDIT_APIARY_POSITION_BY_GEOLOCATION_ACTION,
    EDIT_MODE_ACTION, GwtkBeekeeperTaskState
} from '@/components/GwtkBeekeeper/task/GwtkBeekeeperTask';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import Style from '~/style/Style';
import MarkerStyle from '~/style/MarkerStyle';
import SVGrenderer, { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { BrowserService } from '~/services/BrowserService';
import GeoPoint from '~/geo/GeoPoint';
import i18n from '@/plugins/i18n';
import { GISWebServiceSEMode } from '~/services/Search/SearchManager';


/**
 * Обработчик устоновки и редактирования пчеловодов в виде точок
 * @class ControlBeekeepersPointActionLink
 * @extends ActionLink<GwtkBeekeeperTask>
 */
export default class ControlBeekeepersPointActionLink extends ActionLink<GwtkBeekeeperTask> {

    /**
     * Редактируемый объект
     * @private
     * @readonly
     * @property mapObject {MapObject}
     */
    private readonly mapObject = new MapObject(
        this.parentTask.vectorLayer, MapObjectType.Point,
        {
            key: 'P0790005000',
            layerid: 'BeeKeeping',
            code: 790005000,
            name: 'Пасека',
            layer: 'ПЧЕЛОВОДСТВО',
            schema: 'agro10t'
        }
    );

    /**
     * Стили отображения объекта карты
     * @private
     * @readonly
     * @property mapObjectStyle {Style}
     */
    private readonly mapObjectStyle = new Style( {
        marker: new MarkerStyle( {
            markerId: DEFAULT_SVG_MARKER_ID
        } )
    } );

    /**
     * Параметры для виджета
     * @private
     * @readonly
     * @property widgetParams {WidgetParams}
     */
    private readonly widgetParams = [
        CREATE_MODE_ACTION, EDIT_MODE_ACTION, DELETE_MODE_ACTION,
        CREATE_MODE_BY_GEOLOCATION_ACTION,
        EDIT_APIARY_POSITION_BY_GEOLOCATION_ACTION
    ];

    private readonly MAX_POINT_COUNT = 1;

    destroy() {
        super.destroy();
        this.toggleGwtkMapObjectPanel(true);
        this.parentTask.removeLinkPanel();
        this.mapObject.removeAllPoints();
        this.map.clearActiveObject();
        this.map.requestRender();
    }

    setup() {
        this.map.setActiveObject( this.mapObject );
        this.parentTask.createLinkPanel( this.widgetParams );
        if ( this.mapObject.getPointList().length > 0 ) {
            this.mapObject.removeAllPoints();
        }
        this.setLinkAction( CREATE_MODE_ACTION );
    }

    onPreRender( renderer: SVGrenderer ) {
        if ( this.mapObject ) {
            super.onPreRender( renderer );
            this.map.requestRender();
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        if ( this.mapObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.mapObject );
            super.onPostRender( renderer );
        }
    }

    commit() {
        if ( this.action && this.action.id === CREATE_MODE_ACTION ) {
            this.setLinkAction();
            this.map.setActiveObject( this.mapObject );
            this.parentTask.newMapObject = this.mapObject;
            this.parentTask.getObjectPropsFromDB().then();
            if ( this.mapObject.getPointList().length === this.MAX_POINT_COUNT ) {
                this.setLinkAction( EDIT_MODE_ACTION );
            } else {
                this.setLinkAction( CREATE_MODE_ACTION );
            }
        } else if ( this.action && this.action.id === EDIT_MODE_ACTION ) {
            if ( this.parentTask.getWidgetPropsCurrentMapObject() ) {
                //this.action.commit();
                this.run();
            }
        } else {
            this.setLinkAction();
        }
    }

    revert() {
        this.setLinkAction();
    }

    run() {
        if ( this.action && this.action.id === EDIT_MODE_ACTION ) {
            if ( this.map.getSelectedObjects().length >= 1 ) {
                const selectedMapObjects = this.map.getSelectedObjects();
                this.parentTask.setWidgetPropsCurrentMapObject( selectedMapObjects[ 0 ] );
                this.parentTask.getObjectPropsFromDB().then();
                this.parentTask.selectedActionType( this.action.id );
            }

            if ( this.MAX_POINT_COUNT === this.mapObject.getPointList().length ) {
                this.parentTask.selectedActionType( this.action.id );
            }
        }
    }

    onMouseClick( event: MouseDeviceEvent ) {
        super.onMouseClick( event );
        if ( this.action && this.action.id === CREATE_MODE_ACTION ) {
            if ( this.MAX_POINT_COUNT <= this.mapObject.getPointList().length ) {
                this.parentTask.quitAction( this.action.id );
            }
        }

        if ( typeof this.parentTask.selectedMapObjectInMap === 'undefined' && this.parentTask.newMapObject === null ) {
            this.mapWindow.getTaskManager().showOverlayPanel();
            this.map.searchManager.findInPoint( event.mousePosition, GISWebServiceSEMode.StrictSearch ).then( () => {
            } ).catch( () => {
            } ).finally(
                () => {
                    this.mapWindow.getTaskManager().removeOverlayPanel();
                }
            );
        }
    }

    canSelectObject(): boolean {
        return false;
    }

    selectObject( mapObject?: MapObject ): void {
        super.selectObject( mapObject );
        if ( this.action && this.action.id === EDIT_MODE_ACTION ) {
            this.run();
        }
    }

    setState<K extends keyof GwtkBeekeeperTaskState>( key: K, value: GwtkBeekeeperTaskState[K] ) {
        switch ( key ) {
            case CREATE_MODE_ACTION:
                if ( this.mapObject.getPointList().length === 0 ) {
                    this.changeActionActive( CREATE_MODE_ACTION );
                    this.parentTask.setResult( 'To add an apiary, select its location on the map' );
                    this.parentTask.setLinkPanelActiveState('add');
                    this.setLinkAction( CREATE_MODE_ACTION );
                } else {
                    super.setState( key, value );
                }
                this.toggleGwtkMapObjectPanel(false);
                this.parentTask.selectedMapObjectInMap = undefined;
                this.setup();
                break;
            case EDIT_MODE_ACTION:
                if ( this.mapObject.getPointList().length === 0 ) {
                    this.changeActionActive( EDIT_MODE_ACTION );
                    this.parentTask.setResult( 'Select the apiary on the map to edit' );
                    this.parentTask.setLinkPanelActiveState('edit');
                    this.parentTask.getBeeKeeperMapObjectsList(false);
                    this.setLinkAction( EDIT_MODE_ACTION );
                } else {
                    super.setState( key, value );
                }
                this.toggleGwtkMapObjectPanel(false);
                this.parentTask.selectedMapObjectInMap = undefined;
                break;
            case DELETE_MODE_ACTION:
                this.mapObject.removeAllPoints();
                this.map.setActiveObject( this.mapObject );
                this.setLinkAction( CREATE_MODE_ACTION );
                if ( this.action ) {
                    this.parentTask.selectedActionType( this.action.id );
                }
                this.setState( EDIT_MODE_ACTION, true );
                this.toggleGwtkMapObjectPanel(false);
                this.parentTask.selectedMapObjectInMap = undefined;
                break;
            case CREATE_MODE_BY_GEOLOCATION_ACTION:
                this.getGeolocationAndCreateApiary();
                break;
            case EDIT_APIARY_POSITION_BY_GEOLOCATION_ACTION:
                this.getGeolocationAndUpdateApiaryLocation();
                break;
            default:
                super.setState( key, value );
                break;
        }
    }


    /**
     * Изменить активность кнопок линкования
     */
    changeActionActive( value: string ) {
        this.widgetParams.forEach( ( paramName: string ) => {
            const actionModeDescription = this.parentTask.getActionDescription( paramName );
            if ( actionModeDescription && actionModeDescription.id === value ) {
                actionModeDescription.active = true;
            } else if ( actionModeDescription ) {
                actionModeDescription.active = false;
            }
        } );
    }

    /**
     * Включить или выключить отображения панеля объекты карты
     * @method toggleGwtkMapObjectPanel
     * @param toggle {Boolean}
     */
    private toggleGwtkMapObjectPanel(toggle: boolean) {
        const taskDescription= this.parentTask.mapWindow.getTaskManager().getTaskDescription('gwtkmapobject.main');
        if ( taskDescription ) {
            taskDescription.enabled = toggle;
        }
    }

    /**
     * Запросить координаты и создать новую пасеку
     * @private
     * @method getGeolocationAndCreateApiary
     */
    private getGeolocationAndCreateApiary() {
        // Запрасить координаты
        let watchUserNumber = BrowserService.watchUserPosition( (result)=>{
            const coords = result.coords;
            const mapPoint = new GeoPoint( coords.longitude, coords.latitude, coords.altitude || 0, this.map.ProjectionId).toMapPoint();
            if ( mapPoint ) {
                this.mapObject.addPoint( mapPoint, {
                    positionNumber: 0,
                    contourNumber: 0,
                    objectNumber: 0
                } );
                this.map.setViewport( mapPoint );
                this.map.overlayRefresh();
                this.map.requestRender();
            }
            if ( watchUserNumber !== undefined ) {
                BrowserService.stopWatchUserPosition(watchUserNumber);
            }
            if ( this.action ) {
                this.parentTask.quitAction( this.action.id );
            }
        }, (reason: GeolocationPositionError) =>{
            if ( reason.code === reason.PERMISSION_DENIED ) {
                this.map.writeProtocolMessage({
                    text: i18n.t( 'geolocation.Permission for geolocation denied' ) as string,
                    display: true
                });
            } else if ( reason.code === reason.POSITION_UNAVAILABLE ) {
                this.map.writeProtocolMessage({
                    text: i18n.t( 'geolocation.Position unavailable' ) as string,
                    display: true
                });
            } else if ( reason.code === reason.TIMEOUT ) {
                this.map.writeProtocolMessage({
                    text: i18n.t( 'geolocation.Geolocation activation time exceeded' ) as string,
                    display: true
                });
            }
            if ( watchUserNumber !== undefined ) {
                BrowserService.stopWatchUserPosition(watchUserNumber);
            }
        });
    }

    /**
     * Запросить координаты и обновить местонахождения пасеки
     * @private
     * @method getGeolocationAndUpdateApiaryLocation
     */
    private getGeolocationAndUpdateApiaryLocation() {
        // Запрасить координаты
        let watchUserNumber = BrowserService.watchUserPosition( (result)=>{
            const coords = result.coords;
            const mapPoint = new GeoPoint( coords.longitude, coords.latitude, coords.altitude || 0, this.map.ProjectionId).toMapPoint();
            if ( mapPoint ) {
                const editedMapObject = this.parentTask.getWidgetPropsCurrentMapObject();
                const newMapPoint=new GeoPoint( coords.longitude, coords.latitude ).toMapPoint(mapPoint.getProjectionId());
                if(editedMapObject&&newMapPoint) {
                    editedMapObject.updatePoint(newMapPoint, {
                        positionNumber: 0,
                        contourNumber: 0,
                        objectNumber: 0
                    });
                }
                this.map.setViewport( mapPoint );
                this.map.overlayRefresh();
                this.map.requestRender();
            }
            if ( watchUserNumber !== undefined ) {
                BrowserService.stopWatchUserPosition( watchUserNumber );
            }
            if ( this.action ) {
                this.action.commit();
            }
        }, (reason: GeolocationPositionError) =>{
            if ( reason.code === reason.PERMISSION_DENIED ) {
                this.map.writeProtocolMessage({
                    text: i18n.t( 'geolocation.Permission for geolocation denied' ) as string,
                    display: true
                });
            } else if ( reason.code === reason.POSITION_UNAVAILABLE ) {
                this.map.writeProtocolMessage({
                    text: i18n.t( 'geolocation.Position unavailable' ) as string,
                    display: true
                });
            } else if ( reason.code === reason.TIMEOUT ) {
                this.map.writeProtocolMessage({
                    text: i18n.t( 'geolocation.Geolocation activation time exceeded' ) as string,
                    display: true
                });
            }
            if ( watchUserNumber !== undefined ) {
                BrowserService.stopWatchUserPosition( watchUserNumber );
            }
        });
    }
}
