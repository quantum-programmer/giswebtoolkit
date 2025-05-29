/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Задача "Свободный полёт"                     *
 *                                                                  *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkFreeFlightWidget from './GwtkFreeFlightWidget.vue';
import { BrowserService } from '~/services/BrowserService';
import i18n from '@/plugins/i18n';
import { LogEventType } from '~/types/CommonTypes';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { Projection } from '~/3d/engine/core/geometry/projection';
import GeoJSON, { FeatureGeometry, FeatureProperties } from '~/utils/GeoJSON';
import { Vector2or3 } from '~/3d/engine/core/Types';
import Utils from '~/services/Utils';
import Mediator from '~/3d/engine/utils/Mediator';
import GwtkError from '~/utils/GwtkError';


export const TOGGLE_ROUTE_ITEM = 'gwtkfreeflight.togglerouteitem';
export const TOGGLE_LOOP_ROUTE = 'gwtkfreeflight.togglelooproute';
export const TOGGLE_EXECUTE = 'gwtkfreeflight.toggleexecute';
export const TOGGLE_FINISH = 'gwtkfreeflight.togglefinish';
export const TOGGLE_PAUSE = 'gwtkfreeflight.togglepause';
export const TOGGLE_CANCEL = 'gwtkfreeflight.togglecancel';
export const TOGGLE_OPEN_FILE = 'gwtkfreeflight.toggleopenfile';
export const TOGGLE_START_OVER = 'gwtkfreeflight.togglestartover';
export const ON_INPUT_SEARCH = 'gwtkfreeflight.oninputsearch';
export const UPDATE_FLIGHT_SPEED = 'gwtkfreeflight.updateflightspeed';

export type GwtkFreeFlightTaskState = {
    [ TOGGLE_ROUTE_ITEM ]: string;
    [ TOGGLE_LOOP_ROUTE ]: boolean;
    [ TOGGLE_EXECUTE ]: undefined;
    [ TOGGLE_FINISH ]: undefined;
    [ TOGGLE_PAUSE ]: undefined;
    [ TOGGLE_CANCEL ]: undefined;
    [ TOGGLE_OPEN_FILE ]: undefined;
    [ ON_INPUT_SEARCH ]: string;
    [ UPDATE_FLIGHT_SPEED ]: number;
    [ TOGGLE_START_OVER ]: undefined;
};

export type RouteItem = {
    id: string;
    alias: string;
    description: string;
    url: string;
    enableloop: boolean
}

export enum FreeFlightMode {
    ACTIVE,
    PAUSED,
    TURNED_ON,
    TURNED_OFF
}

type WidgetParams = {
    setState: GwtkFreeFlightTask['setState'];

    routeList: RouteItem[];
    activeItemId: string | undefined;
    isLoopRoute: boolean;
    isFreeFlightStarted: boolean;
    flightSpeed: number;
    isFlightPaused: boolean;
    tickList: number[];
}

/**
 * Задача "Свободный полёт"
 * @class GwtkFreeFlightTask
 * @extends Task
 */
export default class GwtkFreeFlightTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & SimpleJson<any>}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private readonly map3d = this.map.mapTool( '3dMap' );
    private readonly freeMove = new GWTK.FreeMove( this.map3dData );

    private defCoords = [];
    private _routeCollection: { geoJSON: GeoJSON, id: string }[] = [];
    private speedMult: number | null = 0;

    private _activeRoute: number | null = null;
    private _mode: FreeFlightMode = FreeFlightMode.TURNED_OFF;

    private mCoordinates: Geodetic3D[ ] = [];

    private defProperties: FeatureProperties | null = null;

    private defaultRoutes: RouteItem[] = [];

    /**
     * @constructor GwtkFreeFlightTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        this._forceMoveHandler = this._forceMoveHandler.bind( this );

        // Создание Vue компонента
        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            taskId: this.id,
            setState: this.setState.bind( this ),

            routeList: [],
            activeItemId: undefined,
            isLoopRoute: false,
            isFreeFlightStarted: false,
            flightSpeed: 1,
            isFlightPaused: false,
            tickList: [
                0.25,
                0.5,
                1,
                3,
                5,
                7,
                10
            ]
        };

    }

    private get map3dData() {
        const map3d = this.map3d;
        if ( map3d.initialized ) {
            return map3d.map3dData;
        }
        return undefined;
    }

    setup() {
        super.setup();

        this.defaultRoutes.push( ...this.map3dData.getDefaultFlightRoutes() );

        if ( this.defaultRoutes ) {
            for ( let i = 0; i < this.defaultRoutes.length; i++ ) {
                this._uploadRemoteRoute( this.defaultRoutes[ i ] );
            }
        }

        this.fillRouteList();

        Mediator.subscribe( 'forceMove', this._forceMoveHandler );

        Mediator.publish( 'tool3dMenuToggle', { id: this.id, isActive: true } );

        this.speedMult = this.widgetProps.tickList[ 0 ];
    }

    private fillRouteList( searchValue?: string ) {
        this.widgetProps.routeList.splice( 0 );
        if ( searchValue ) {
            for ( let i = 0; i < this.defaultRoutes.length; i++ ) {

                const item = this.defaultRoutes[ i ];

                if ( item.alias.toLowerCase().includes( searchValue.toLowerCase() ) ) {
                    this.widgetProps.routeList.push( item );
                }

            }
        } else {
            this.widgetProps.routeList.push( ...this.defaultRoutes );
        }
    }

    /**
     * Завершить работу компонента
     * @method destroy
     * @public
     */
    destroy() {
        super.destroy();
        this._setMode( FreeFlightMode.TURNED_OFF );
        this.defCoords = [];
        this._routeCollection = [];

        Mediator.unsubscribe( 'forceMove', this._forceMoveHandler );

        Mediator.publish( 'tool3dMenuToggle', { id: this.id, isActive: false } );
    }

    createTaskPanel() {
        const nameWidget = 'GwtkFreeFlightWidget';
        const sourceWidget = GwtkFreeFlightWidget;
        this.mapWindow.registerComponent( nameWidget, sourceWidget );

        this.mapWindow.createWindowWidget( nameWidget, this.widgetProps );

        this.addToPostDeactivationList( this.widgetProps );
    }

    setState<K extends keyof GwtkFreeFlightTaskState>( key: K, value: GwtkFreeFlightTaskState[K] ) {
        switch ( key ) {
            case TOGGLE_ROUTE_ITEM:
                if ( this.widgetProps.activeItemId === value as string ) {
                    this.widgetProps.activeItemId = undefined;
                } else {
                    this.widgetProps.activeItemId = value as string;
                }
                this.widgetProps.flightSpeed = 1;
                break;

            case TOGGLE_LOOP_ROUTE:
                this.widgetProps.isLoopRoute = value as boolean;
                break;

            case TOGGLE_EXECUTE:
                if ( this.widgetProps.activeItemId && this.setUpRoute( this.widgetProps.activeItemId ) ) {
                    this.widgetProps.isFreeFlightStarted = true;
                }
                break;

            case TOGGLE_FINISH:
                this.widgetProps.isFreeFlightStarted = false;
                this.widgetProps.isFlightPaused = false;
                this._setMode( FreeFlightMode.TURNED_OFF );
                break;

            case TOGGLE_PAUSE:
                this.widgetProps.isFlightPaused = !this.widgetProps.isFlightPaused;
                this._toggleMode();
                break;

            case TOGGLE_CANCEL:
                this.map.getTaskManager().detachTask( this.widgetProps.taskId );
                // this.quit();
                break;

            case TOGGLE_OPEN_FILE:
                this.openDataFile( ['.json'] ).then( ( result ) => {
                    try {

                        const geoJSON = GwtkFreeFlightTask._createGeoJSONroute(JSON.parse(result));
                        const id = Utils.generateGUID();
                        this._routeCollection.push({ geoJSON, id });

                        const alias = geoJSON.getFeature(0)?.properties.name;
                        const description = geoJSON.getFeature(0)?.properties.description;

                        this.defaultRoutes.push({
                            id,
                            url: '',
                            enableloop: true,
                            description: description ? description : 'unknown',//TODO
                            alias: alias ? alias : 'unknown'
                        });

                        this.fillRouteList();

                    } catch (error) {
                        const gwtkError = new GwtkError(error);
                        this.map.writeProtocolMessage({
                            text: i18n.t('phrases.Free flight') + '. ' + i18n.t('phrases.File open error'),
                            description: gwtkError.message,
                            type: LogEventType.Error,
                            display: true
                        });
                    }
                } );
                break;

            case ON_INPUT_SEARCH:
                this.fillRouteList( value as string );
                break;

            case UPDATE_FLIGHT_SPEED:
                const tickIndex = value as number;
                if ( tickIndex >= 0 && this.widgetProps.tickList[ tickIndex ] ) {
                    this.widgetProps.flightSpeed = this.widgetProps.tickList[ tickIndex ];
                    this._setSpeedValue( this.widgetProps.flightSpeed );
                }
                break;

            case TOGGLE_START_OVER:
                this.freeMove.resetPosition();
                if ( this.widgetProps.isFlightPaused ) {
                    this.setState( TOGGLE_PAUSE, undefined );
                }
                break;
        }
    }

    private async openDataFile( accept?: string[] ) {
        const fileResult = await BrowserService.openFileDialog( accept );

        if ( fileResult && fileResult[ 0 ] ) {
            const file = fileResult[ 0 ];
            return this.fromFile( file );
        }

        return Promise.reject( 'Cannot open file' );
    }

    private fromFile( file: File ) {
        return new Promise<string>( ( resolve, reject ) => {
            const reader = new FileReader();
            reader.readAsText( file );
            reader.onload = event => {
                if ( event.target && event.target.result ) {
                    const resultData = event.target.result as string;

                    const fileName = file.name.split( '.' );
                    const extension = fileName[ fileName.length - 1 ].toLowerCase();

                    if ( extension === 'json' ) {
                        resolve( resultData );
                    }
                }
            };
            reader.onerror = () => {
                reject( 'Cannot read file' );
            };
        } );
    }

    /**
     * Смена состояния (движения/паузы)
     * @method _toggleMode
     * @public
     */
    private _toggleMode() {
        if ( this._mode === FreeFlightMode.ACTIVE ) {
            this._setMode( FreeFlightMode.PAUSED );
        } else if ( this._mode === FreeFlightMode.PAUSED ) {
            this._setMode( FreeFlightMode.ACTIVE );
        }
    }

    /**
     * Установить режим работы
     * @method _setMode
     * @private
     * @param mode {FreeFlightMode} Режим
     */
    private _setMode( mode: FreeFlightMode ) {
        if ( mode != null && this._mode !== mode ) {
            this._mode = mode;
            switch ( mode ) {
                case FreeFlightMode.TURNED_ON:
                    this._turnOn();
                    break;
                case FreeFlightMode.TURNED_OFF:
                    this._turnOff();
                    break;
                case FreeFlightMode.ACTIVE:
                    this._resumeFlight();
                    break;
                case FreeFlightMode.PAUSED:
                    this._pauseFlight();
                    break;
            }
        }
    }

    /**
     * Обработчик смещения карты
     * @method _forceMoveHandler
     * @private
     */
    private _forceMoveHandler() {
        if ( this._mode === FreeFlightMode.ACTIVE ) {
            this._setMode( FreeFlightMode.PAUSED );
            this.widgetProps.isFlightPaused = true;
        }
    }

    /**
     * Включить режим
     * @method _turnOn
     * @private
     */
    private _turnOn() {
        this._setSpeedValue( 1. );
    }

    /**
     * Выключить режим
     * @method _turnOff
     * @private
     */
    private _turnOff() {
        this.freeMove.reset();
        this._activeRoute = null;
        this._resetSpeedValue();
    }

    /**
     * Продолжить полет по маршруту
     * @method _resumeFlight
     * @private
     */
    private _resumeFlight() {
        this.freeMove.activate();
    }

    /**
     * Прервать полет по маршруту
     * @method _pauseFlight
     * @private
     */
    private _pauseFlight() {
        this.freeMove.deactivate();
    }

    /**
     * Установить маршрут
     * @method setUpRoute
     * @private
     */
    private setUpRoute( recid: string ): boolean {

        this.defCoords.length = 0;
        const routeCollectionItem = this._routeCollection.find( item => item.id === recid );
        if ( routeCollectionItem ) {
            const geoJson = routeCollectionItem.geoJSON;
            if ( geoJson != null ) {
                const firstFeature = geoJson.getFeature(0);//TODO index?
                if (firstFeature) {
                    this.defProperties = firstFeature.properties;
                    this.defCoords = firstFeature.getGeometry().clone().coordinates;

                    this._updateFreeMove();

                    if (this.mCoordinates.length > 0) {
                        const mapParams = {
                            height: this.defProperties.height,
                            center: this.mCoordinates[0],
                            force: true
                        };

                        this._startFlight(mapParams);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Запустить полет по маршруту
     * @method _startFlight
     * @private
     * @param mapParams{object} Параметры для карты
     */
    private _startFlight( mapParams: Object ) {
        this.freeMove.setMapParams( mapParams );
        this._setMode( FreeFlightMode.ACTIVE );
    }

    /**
     * Обновить маршрут
     * @method _updateFreeMove
     * @public
     */
    private _updateFreeMove() {
        if ( this._mode !== null ) {
            const coordinates = this.defCoords;
            const mapState = this.freeMove.getMapState();
            this.mCoordinates.length = 0;
            if ( this.defProperties && this.defProperties.relative ) {
                this._recalcCoords( coordinates, mapState );
            } else {
                for ( let i = 0; i < coordinates.length; i++ ) {
                    const point = coordinates[ i ];
                    this.mCoordinates[ i ] = new Geodetic3D( point[ 0 ] * Math.PI / 180, point[ 1 ] * Math.PI / 180, point[ 2 ] );
                }
            }
            if ( this.mCoordinates.length > 0 ) {
                const properties = Object.create( this.defProperties );
                if ( mapState.starViewFlag ) {
                    properties.height = null;
                }
                this.freeMove.setProperties( properties );
                this.freeMove.setPath( this.mCoordinates );
            }

        }
    }

    /**
     * Пересчет относительных координат на текущий масштаб
     * @method _recalcCoords
     * @private
     * @param coordinates {array} Массив координат
     * @param mapState {object} Параметры состояния карты
     */
    private _recalcCoords( coordinates: number[][], mapState: {
        scale?: number,
        center?: number[],
        starViewFlag?: boolean,
        projection: Projection,
        distanceFromObs: number
    } ) {
        if ( !Array.isArray( coordinates ) ||
            !mapState ||
            mapState.scale === undefined ||
            mapState.center === undefined ||
            mapState.starViewFlag === undefined ) {
            return;
        }
        const scale = mapState.scale;
        const center = mapState.center;
        const starViewFlag = mapState.starViewFlag;
        this.mCoordinates.length = 0;
        if ( !starViewFlag ) {
            for ( let i = 0; i < coordinates.length; i++ ) {
                const x = coordinates[ i ][ 0 ] * scale + center[ 1 ];
                const y = coordinates[ i ][ 1 ] * scale + center[ 0 ];
                const height = center[ 2 ] || 0;
                this.mCoordinates[ i ] = mapState.projection.xy2geo( y, x, height );
            }
        } else {
            Mediator.publish( 'writeProtocol', {
                text: i18n.t( 'Scale should be under' ) + ' 8 000 000',
                displayFlag: false
            } );
            const deltaRad = 8 * Math.PI / 180;
            const height = mapState.distanceFromObs;
            const geoEx = mapState.projection.xy2geo( center[ 0 ], center[ 1 ], height );
            const lat0 = geoEx.getLatitude();
            const lng0 = geoEx.getLongitude();
            for ( let i = 0; i < 45; i++ ) {
                this.mCoordinates[ i ] = new Geodetic3D( deltaRad * i + lng0, lat0, height );
            }
        }
    }

    /**
     * Установить значение скорости
     * @method _setSpeedValue
     * @private
     * @param value{number} Новое значение скокрости
     */
    private _setSpeedValue( value: number ) {
        if ( value !== this.speedMult ) {
            this.speedMult = value;
            this.freeMove.setAnimationSpeedValue( this.speedMult );
        }
    }

    /**
     * Сбросить значение скорости
     * @method _resetSpeedValue
     * @private
     */
    private _resetSpeedValue() {
        this._setSpeedValue( 1. );
        this.speedMult = null;
    }

    /**
     * Обработчик загрузки маршрута
     * @method _onLoad
     * @private
     */
    private _onLoad( filepath: string, routeParams: RouteItem ): void {
        if ( this._mode === null ) {
            return;
        }
        const freeflight = GWTK.gEngine.ResourceMap.retrieveAsset( filepath );

        if ( freeflight == null || !freeflight.features || freeflight.features.length < 1 ) {
            Mediator.publish( 'writeProtocol', {
                text: i18n.t( 'The file is not in the format GeoJSON' ) + ':' + filepath,
                displayFlag: true
            } );
        } else {
            const geoJSON = GwtkFreeFlightTask._createGeoJSONroute( freeflight );
            this._routeCollection.push( { geoJSON, id: routeParams.id } );

        }
        GWTK.gEngine.ResourceMap.unloadAsset( filepath );
    }

    /**
     * Загрузить маршрут по ссылке
     * @method _uploadRemoteRoute
     * @private
     * @param routeParams {object} Параметры маршрута
     */
    private _uploadRemoteRoute( routeParams: RouteItem ) {
        GWTK.gEngine.TextFileLoader.loadTextFile(
            routeParams.url, GWTK.gEngine.Resources.enumTextFileType.eJSONFile, ( filePath: string ) => {
                this._onLoad( filePath, routeParams );
            } );
    }

    /**
     * Сформировать GeoJSON-объект маршрута
     * @private
     * @static
     * @method _createGeoJSON
     * @param json{object} JSON-объект
     * @return {GeoJSON} GeoJSON-объект маршрута
     */
    private static _createGeoJSONroute( json: string ) {
        const routeGeoJSON = new GeoJSON();

        const geoJson = new GeoJSON(JSON.stringify(json));
        const vector2or3List: Vector2or3[] = [];
        const geometry = geoJson.getFullLineGeometry(vector2or3List);
        const feature = geoJson.getFeature(0);
        if (feature) {
            const properties = feature.properties;
            properties.relative = (properties.type != null && properties.type.toLowerCase() === 'relative');
            properties.targetMode = !(properties['cameraHeightsMode']);

            const feature1 = GeoJSON.createFeature(properties, geometry as FeatureGeometry);
            routeGeoJSON.addFeature(feature1);
        }
        return routeGeoJSON;
    }

}
