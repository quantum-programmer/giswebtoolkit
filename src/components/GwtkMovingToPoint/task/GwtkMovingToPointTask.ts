/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент перемещения в точку                   *
 *                                                                  *
 *******************************************************************/


import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkMovingToPointWidget from '@/components/GwtkMovingToPoint/task/GwtkMovingToPointWidget.vue';
import i18n from '@/plugins/i18n';
import PickPointAction, { SET_COORDINATE_IN_POINT } from '~/systemActions/PickPointAction';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import {
    CursorCoordinateUnit,
    VIEW_SETTINGS_MAPCENTER,
    WorkspaceValues,
    PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM
} from '~/utils/WorkspaceManager';
import Trigonometry from '~/geo/Trigonometry';
import GeoPoint from '~/geo/GeoPoint';
import BrowserService from '~/services/BrowserService/BrowserService';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import SVGrenderer, { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import { PointSelector } from '~/mapobject/geometry/BaseMapObjectGeometry';
import { LOCALE } from '~/types/CommonTypes';
import Style from '~/style/Style';
import MarkerStyle from '~/style/MarkerStyle';
import PixelPoint from '~/geometry/PixelPoint';
import { MapPoint } from '~/geometry/MapPoint';

export const COPY_COORDINATE = 'gwtkmovingtopoint.copycoordinate';
export const SELECT_POINT_ACTION = 'gwtkmovingtopoint.selectpointaction';
export const MOVING_TO_POINT = 'gwtkmovingtopoint.movingtopoint';
export const SET_MOVE_TO_POINT_ACTIVE = 'gwtkmovingtopoint.setmovetopointactive';
export const SET_SELECT_POINT_ACTIVE = 'gwtkmovingtopoint.setselectpointactive';
export const SET_LATITUDE_COORDINATE = 'gwtkmovingtopoint.setlatitudecoordinate';
export const SET_LONGITUDE_COORDINATE = 'gwtkmovingtopoint.setlongitudecoordinate';
export const MOVING_TO_POINT_PLANE = 'gwtkmovingtopoint.movingtopointplane';
export const SET_X_PLANE = 'gwtkmovingtopoint.setxplane';
export const SET_Y_PLANE = 'gwtkmovingtopoint.setyplane';

export type GwtkMovingToPointTaskState = {
    [ SELECT_POINT_ACTION ]: boolean;
    [ MOVING_TO_POINT ]: GeoPoint;
    [ SET_COORDINATE_IN_POINT ]: PixelPoint;
    [ COPY_COORDINATE ]: WidgetParams['coordinateString'];
    [ SET_MOVE_TO_POINT_ACTIVE ]: WidgetParams['moveToPointActive'];
    [ SET_SELECT_POINT_ACTIVE ]: WidgetParams['selectPointActive'];
    [ SET_LATITUDE_COORDINATE ]: WidgetParams['coordinateLatitude'];
    [ SET_LONGITUDE_COORDINATE ]: WidgetParams['coordinateLongitude'];
    [ MOVING_TO_POINT_PLANE ]: MapPoint;
    [ SET_X_PLANE ]: WidgetParams['coordinateX'];
    [ SET_Y_PLANE ]: WidgetParams['coordinateY'];
}

type WidgetParams = {
    setState: GwtkMovingToPointTask['setState'];
    coordinateString: string;
    coordinateDisplayFormat: CursorCoordinateUnit;
    moveToPointActive: boolean;
    selectPointActive: boolean;
    coordinateLatitude: string;
    coordinateLongitude: string;
    coordinateX: string;
    coordinateY: string;
}


/**
 * Компонент "Перемещение в точку"
 * @class GwtkMovingToPointTask
 * @extends Task
 * @description
 */
export default class GwtkMovingToPointTask extends Task {

    private blockMoveCoordinate = false;

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private readonly pointSelector: PointSelector = { objectNumber: 0, positionNumber: 0, contourNumber: 0 };
    private readonly pointObject: MapObject;
    private clearTimeout?: number;

    coordinate?: GeoPoint = new GeoPoint( 0, 0 );
    coordinatePlane?: MapPoint = new MapPoint( 0, 0 );

    /**
     * @constructor GwtkMovingToPointTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        this.actionRegistry.push( {
            getConstructor() {
                return PickPointAction;
            },
            id: SELECT_POINT_ACTION,
            active: false,
            enabled: true
        } );

        const geoPoint = this.map.getCenterGeoPoint();
        if ( geoPoint ) {
            this.coordinate = new GeoPoint( parseFloat( geoPoint.getLongitude().toFixed( 6 ) ), parseFloat( geoPoint.getLatitude().toFixed( 6 ) ) );
        }
        const planePoint = this.map.getCenter();
        if ( planePoint ) {
            this.coordinatePlane = planePoint.clone();
        }

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            setState: this.setState.bind( this ),
            coordinateString: '',
            coordinateDisplayFormat: this.cursorCoordinatesSystem(),
            moveToPointActive: false,
            selectPointActive: false,
            coordinateLatitude: '',
            coordinateLongitude: '',
            coordinateX: '',
            coordinateY: ''
        };

        // Установить значение по умолчанию для координат
        this.getLatitudeAndLongitudeCoordinates( 'lat' );
        this.getLatitudeAndLongitudeCoordinates( 'long' );
        this.getPlaneCoordinates();

        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        this.pointObject = new MapObject( tempVectorLayer, MapObjectType.MultiPoint, { local: LOCALE.Point } );

    }

    protected destroy() {
        super.destroy();
        this.map.requestRender();
    }

    canShowTooltip(): boolean {
        return true;
    }

    /**
     * Система координат курсора
     * @method cursorCoordinatesSystem
     * @returns {CursorCoordinateUnit} метры / градусы /...
     */
    cursorCoordinatesSystem() {
        let coordinatesUnit = this.map.Translate.IsGeoSupported > 0 ?
            CursorCoordinateUnit.Degrees :
            CursorCoordinateUnit.Meter;
        const restored = this.map.workspaceManager.getValue( PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM );
        if ( restored ) {
            coordinatesUnit = restored;
        } else {
            this.map.workspaceManager.setValue( PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM, coordinatesUnit );
        }
        return coordinatesUnit;
    }

    /**
     * Обработчик события `onMouseMove`
     * @method onMouseMove
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseMove( event: MouseDeviceEvent ) {
        super.onMouseMove( event );
        if (!this.blockMoveCoordinate && !this.map.is3dActive() ) {
            this.coordinate = this.convertCoordinateToFormat( event.mousePosition );
            if (this.widgetProps.coordinateDisplayFormat !== CursorCoordinateUnit.Meter && this.widgetProps.coordinateDisplayFormat !== CursorCoordinateUnit.MeterSk42 ) {
                // Обновить значение для широты и долготы
                this.getLatitudeAndLongitudeCoordinates( 'lat' );
                this.getLatitudeAndLongitudeCoordinates( 'long' );
            } else {
                this.coordinatePlane = this.map.pixelToPlane( event.mousePosition );
                this.getPlaneCoordinates();
            }
        }
    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( type === PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM ) {
            this.widgetProps.coordinateDisplayFormat = this.map.workspaceManager.getValue( PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM );
            // Обновить значение по умолчанию для широты и долготы
            this.getLatitudeAndLongitudeCoordinates( 'lat' );
            this.getLatitudeAndLongitudeCoordinates( 'long' );
            this.getPlaneCoordinates();
        }

        if ( !this.blockMoveCoordinate ) {
            if ( type === VIEW_SETTINGS_MAPCENTER ) {
                const geoPoint = this.map.getCenterGeoPoint();
                if ( geoPoint ) {
                    this.coordinate = new GeoPoint( parseFloat( geoPoint.getLongitude().toFixed( 6 ) ), parseFloat( geoPoint.getLatitude().toFixed( 6 ) ) );
                }

                // Обновить значение по умолчанию для широты и долготы
                this.getLatitudeAndLongitudeCoordinates( 'lat' );
                this.getLatitudeAndLongitudeCoordinates( 'long' );
                this.getPlaneCoordinates();
            }
        }
    }

    onWorkspaceReset() {
        this.widgetProps.coordinateDisplayFormat = this.map.workspaceManager.getValue( PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM );
        // Обновить значение по умолчанию для широты и долготы
        this.getLatitudeAndLongitudeCoordinates( 'lat' );
        this.getLatitudeAndLongitudeCoordinates( 'long' );
        this.getPlaneCoordinates();
    }

    /**
     * регистрация Vue компонента
     */
    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkMovingToPointWidget';
        const sourceWidget = GwtkMovingToPointWidget;
        this.mapWindow.registerComponent( nameWidget, sourceWidget );

        // Создание Vue компонента
        this.mapWindow.createFooterWidget( nameWidget, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    setState<K extends keyof GwtkMovingToPointTaskState>( key: K, value: GwtkMovingToPointTaskState[ K ] ) {

        switch ( key ) {
            case SELECT_POINT_ACTION:
                if ( value ) {
                    this.mapWindow.addSnackBarMessage( i18n.tc( 'phrases.' + 'Pick a point on the map' ) );
                } else {
                    this.blockMoveCoordinate = false;
                }
                this.setAction( key, value as boolean );
                break;
            case SET_COORDINATE_IN_POINT:
                this.blockMoveCoordinate = true;
                this.selectCoordinate( value as PixelPoint );
                break;
            case COPY_COORDINATE:
                return this.copyCoordsToBuffer( value as WidgetParams['coordinateString'] );
            // break;
            case MOVING_TO_POINT:
                const geo = value as GeoPoint;
                const mapPoint = geo.toMapPoint();
                if ( mapPoint ) {
                    this.movingToPoint( mapPoint );
                }
                break;
            case MOVING_TO_POINT_PLANE:
                this.movingToPoint( value as MapPoint );
                break;
            case SET_MOVE_TO_POINT_ACTIVE:
                this.onMoveToPointActive( value as boolean );
                break;
            case SET_SELECT_POINT_ACTIVE:
                this.onSelectPointActive( value as boolean );
                break;
            case SET_LATITUDE_COORDINATE:
                this.widgetProps.coordinateLatitude = value as string;
                break;
            case SET_LONGITUDE_COORDINATE:
                this.widgetProps.coordinateLongitude = value as string;
                break;
            case SET_X_PLANE:
                this.widgetProps.coordinateX = value as string;
                break;
            case SET_Y_PLANE:
                this.widgetProps.coordinateY = value as string;
                break;
            default:
                if ( this._action ) {
                    this._action.setState( key, value );
                }
        }
    }


    selectCoordinate( pixelpoint: PixelPoint ) {

        this.showLabel( pixelpoint );
        this.coordinate = this.convertCoordinateToFormat( pixelpoint );
        this.coordinatePlane = this.map.pixelToPlane( pixelpoint );

        // Обновить значения координат
        this.getPlaneCoordinates();
        this.getLatitudeAndLongitudeCoordinates( 'lat' );
        this.getLatitudeAndLongitudeCoordinates( 'long' );
    }

    convertCoordinateToFormat( coordinate: PixelPoint ): GeoPoint | undefined {
        const geo = this.map.pixelToGeo( coordinate );
        if ( geo ) {
            return new GeoPoint( parseFloat( geo.getLongitude().toFixed( 6 ) ), parseFloat( geo.getLatitude().toFixed( 6 ) ) );
        }
    }

    /**
     *
     * @param id
     * @param active
     */
    private setAction( id: string, active: boolean ) {
        if ( active ) {
            this.doAction( id );
        } else {
            this.quitAction( id );
        }
    }


    /**
     * Копировать координаты точки в буфер обмена
     * @async
     * @method copyCoordsToBuffer
     */
    async copyCoordsToBuffer( coordinateString: string ) {
        let result = false;
        let tooltipText = 'Copy failed'; // копирование не удалось

        if ( coordinateString.length > 0 ) {
            try {
                await BrowserService.copyToClipboard(coordinateString);
                tooltipText = 'Coordinates copied to clipboard'; // копирование проведено успешно
                result = true;
            } catch (error) {
                result = false;
            }
        }
        this.mapWindow.addSnackBarMessage( i18n.tc( 'phrases.' + tooltipText ) );

        return result;
    }

    /**
     * Перейти в точку
     */
    movingToPoint( mapPoint: MapPoint ) {
        this.map.setViewport( mapPoint );
        this.map.overlayRefresh( 'transittopoint' );
        this.showLabel();
    }

    /**
     * Отобразить отметку точки
     * @method showLabel
     */
    showLabel( topLeft?: PixelPoint ) {
        let x: number = 0;
        let y: number = 0;
        if ( topLeft ) {
            x = topLeft.x;
            y = topLeft.y;
        } else {
            const wh: number[] = this.map.getWindowSize();
            if ( wh.length >= 2 ) {
                x = parseInt( wh[ 0 ] / 2 + '', 10 );
                y = parseInt( wh[ 1 ] / 2 + '', 10 );
            }
        }

        window.clearTimeout( this.clearTimeout );
        this.pointObject.removeAllPoints();

        this.pointObject.addPixelPoint( new PixelPoint( x, y ), this.pointSelector );
        this.pointObject.addStyle( new Style( {
            marker: new MarkerStyle( {
                markerId: DEFAULT_SVG_MARKER_ID
            } )
        } ) );

        this.clearTimeout = window.setTimeout( () => {
            this.pointObject.removeAllPoints();
        }, 1000 );

    }


    onPreRender() {
        if ( this.pointObject.isDirty ) {
            this.pointObject.isDirty = false;
            this.map.requestRender();
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        if ( this.pointObject.hasPoints() ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.pointObject );
        }
    }

    /**
     * Обработчик активации перемещения в точке
     * @method onMoveToPointActive
     */
    onMoveToPointActive( active: boolean ) {
        this.widgetProps.moveToPointActive = active;
    }

    /**
     * Обработчик активации выбора точки
     * @method onSelectPointActive
     */
    onSelectPointActive( active: boolean ) {
        this.widgetProps.selectPointActive = active;
    }

    /**
     * Получить координаты по широте и по долготе
     * @method getLatitudeAndLongitudeCoordinates
     */
    getLatitudeAndLongitudeCoordinates( type: string ) {
        const typesList = ['lat', 'long'];
        if ( typesList.indexOf( type ) === -1 )
            return;

        if ( !this.widgetProps.moveToPointActive ) {
            if ( this.coordinate ) {
                let coordinate = this.coordinate.getLatitude();

                if ( type === 'long' )
                    coordinate = this.coordinate.getLongitude();

                let coordinateString = coordinate.toString( 10 );

                if ( this.widgetProps.coordinateDisplayFormat === CursorCoordinateUnit.DegreesMinutesSeconds ) {
                    coordinateString = GeoPoint.degrees2DegreesMinutesSeconds( coordinate );

                    if ( coordinate !== 0 ) {
                        coordinateString = coordinateString
                            .replace( /^-/, '' )
                            .replace( /^0+/, '' );
                    } else {
                        coordinateString = coordinateString
                            .replace( /^0+/, '0' );
                    }

                    if ( coordinate < 0 )
                        coordinateString = '-' + coordinateString;
                } else if ( this.widgetProps.coordinateDisplayFormat === CursorCoordinateUnit.Radians ) {
                    coordinateString = Trigonometry.toRadians( coordinate ).toFixed( 6 );
                }

                if ( type === 'lat' ) {
                    this.widgetProps.coordinateLatitude = coordinateString;
                } else if ( type === 'long' ) {
                    this.widgetProps.coordinateLongitude = coordinateString;
                }
            } else {
                //TODO: заглушка, надо добавить поддержку метров
                if ( type === 'lat' ) {
                    this.widgetProps.coordinateLatitude = '-';
                } else if ( type === 'long' ) {
                    this.widgetProps.coordinateLongitude = '-';
                }
            }
        }

    }

    getPlaneCoordinates() {
        if (!this.widgetProps.moveToPointActive) {
            if (this.coordinatePlane) {
                if (this.widgetProps.coordinateDisplayFormat === CursorCoordinateUnit.MeterSk42) {
                    this.coordinatePlane = this.coordinatePlane.toMapPoint('EPSG:28400');
                }
                this.widgetProps.coordinateX = this.coordinatePlane.y.toFixed(2);
                this.widgetProps.coordinateY = this.coordinatePlane.x.toFixed(2);
            } else {
                this.widgetProps.coordinateX = '-';
                this.widgetProps.coordinateY = '-';
            }
        }
    }
}
