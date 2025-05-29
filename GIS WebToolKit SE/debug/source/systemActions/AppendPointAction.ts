/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Обработчик добавления точек объекта               *
 *                                                                  *
 *******************************************************************/

import Action, { ACTION_CANCEL, ACTION_COMMIT, PRIMARY_PANEL_ID, SAVE_PANEL_ID } from '~/taskmanager/Action';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import Stroke from '~/style/Stroke';
import Style from '~/style/Style';
import SVGrenderer, { DEFAULT_SVG_MARKER_ID, GREEN_CIRCLE_SMALL_SVG_MARKER_ID, } from '~/renderer/SVGrenderer';
import VectorLayer from '~/maplayers/VectorLayer';
import { CURSOR_TYPE } from '~/types/Types';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { PointSelector } from '~/mapobject/geometry/BaseMapObjectGeometry';
import Task from '~/taskmanager/Task';
import Fill from '~/style/Fill';
import MarkerStyle from '~/style/MarkerStyle';
import { LOCALE, LogEventType } from '~/types/CommonTypes';
import { VIEW_SETTINGS_ZOOM_LEVEL, WorkspaceValues } from '~/utils/WorkspaceManager';
import { KeyboardCode, KeyboardDeviceEvent } from '~/input/KeyboardDevice';


export const CAPTURING_POINT_MODE = 'gwtk.appendpoint.nodemode';
export const CAPTURING_LINE_MODE = 'gwtk.appendpoint.contourmode';
const DELETE_LAST_POINT = 'gwtk.appendpoint.deletelastpoint';
const INCREASE_POINT_RADIUS = 'gwtk.appendpoint.increasepointradius';
const DECREASE_POINT_RADIUS = 'gwtk.appendpoint.decreasepointradius';


export type AppendPointActionState = {
    [CAPTURING_POINT_MODE]: boolean;
    [CAPTURING_LINE_MODE]: boolean;
    [DELETE_LAST_POINT]: boolean;
    [INCREASE_POINT_RADIUS]: boolean;
    [DECREASE_POINT_RADIUS]: boolean;
};


/**
 * Обработчик добавления точек объекта
 * @class AppendPointAction
 * @extends Action
 */
export default class AppendPointAction<T extends Task> extends Action<T> {

    /**
     * Параметры для виджета
     * @protected
     * @readonly
     * @property widgetParams {WidgetParams}
     */
    protected readonly widgetParams = {
        [ PRIMARY_PANEL_ID ]: {
            enabled: true,
            title: 'Creation mode',
            visible: true,
            buttons: [
                {
                    id: CAPTURING_POINT_MODE,
                    active: false,
                    enabled: true,
                    options: {
                        icon: 'edit-capture-and-copy-object-node',
                        title: 'phrases.Capturing points'
                    }
                }, {
                    id: CAPTURING_LINE_MODE,
                    active: false,
                    enabled: true,
                    options: {
                        icon: 'edit-capture-and-copy-point-of-object-contour',
                        title: 'phrases.Capturing lines'
                    }
                }, {
                    id: DELETE_LAST_POINT,
                    active: false,
                    enabled: false,
                    options: {
                        icon: 'edit-undo',
                        title: 'phrases.Undo recent changes'
                    }
                }, {
                    id: INCREASE_POINT_RADIUS,
                    active: false,
                    enabled: true,
                    options: {
                        icon: 'edit-enlarge-capture-zone',
                        title: 'phrases.Increase capture radius'
                    }
                }, {
                    id: DECREASE_POINT_RADIUS,
                    active: false,
                    enabled: true,
                    options: {
                        icon: 'edit-reduce-capture-zone',
                        title: 'phrases.Decrease capture radius'
                    }
                }
            ]
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
                        theme: 'primary',
                        label: 'phrases.Finish',
                    }
                },
                {
                    id: ACTION_CANCEL,
                    active: false,
                    enabled: true,
                    options: {
                        theme: 'secondary',
                        label: 'phrases.Cancel',
                    }
                }
            ]
        }
    };

    /**
     * Редактируемый объект
     * @protected
     * @property [currentObject] {MapObject}
     */
    protected currentObject?: MapObject;

    /**
     * Объект карты (штриховая линия (одна или две) к курсору)
     * @protected
     * @readonly
     * @property dashedObject {MapObject}
     */
    protected readonly dashedObject: MapObject;

    /**
     * Активный объект с точками привязки
     * @private
     * @property [hoverObject] {MapObject}
     */
    private hoverObject?: MapObject;

    /**
     * Объект точки привязки
     * @private
     * @readonly
     * @property pointObject {MapObject}
     */
    private readonly pointObject: MapObject;

    /**
     * Массив объектов карты (для привязки точек)
     * @private
     * @property mapObjectsResult {MapObject[]}
     */
    private mapObjectsResult: MapObject[] = [];

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
     * Стиль объекта штриховой линии к курсору
     * @private
     * @readonly
     * @property dashedObjectStyle {Style}
     */
    private readonly dashedObjectStyle = new Style( {
        stroke: new Stroke( {
            color: 'black',
            width: '1px',
            dasharray: '5, 5'
        } )
    } );
    /**
     * Стиль объекта точки
     * @private
     * @readonly
     * @property pointObjectStyle {Style}
     */
    private readonly pointObjectStyle = new Style( {
        marker: new MarkerStyle( { markerId: DEFAULT_SVG_MARKER_ID } )
    } );

    /**
     * Стиль активного объекта с точками привязки
     * @private
     * @readonly
     * @property hoverObjectStyle {Style}
     */
    private readonly hoverObjectStyle = new Style( {
        stroke: new Stroke( { color: 'green', opacity: 0.7 } ),
        marker: new MarkerStyle( { markerId: GREEN_CIRCLE_SMALL_SVG_MARKER_ID } )
    } );

    /**
     * Текущий режим точек привязки
     * @private
     * @property [mode] {string}
     */
    private mode?: typeof CAPTURING_POINT_MODE | typeof CAPTURING_LINE_MODE;

    /**
     * Текущее значение области захвата точек привязки
     * @private
     * @property deltaPix {number}
     */
    private deltaPix = 10;

    /**
     * Селектор точки добавления
     * @protected
     * @readonly
     * @property selector {PointSelector}
     */
    protected readonly selector: PointSelector = { objectNumber: 0, contourNumber: 0 };

    /**
     * Вид курсора
     * @protected
     * @readonly
     * @property cursor {CURSOR_TYPE}
     */
    protected readonly cursor: CURSOR_TYPE;

    /**
     * @constructor AppendPointAction
     * @param task {Task} Экземпляр родительской задачи
     * @param id {string} Идентификатор обработчика
     */
    constructor( task: T, id: string ) {
        super( task, id );

        this.cursor = this.mapWindow.setCursor( CURSOR_TYPE.crosshair );

        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        //объект с пуктирной линией
        this.dashedObject = new MapObject( tempVectorLayer, MapObjectType.LineString, { local: LOCALE.Line } );
        this.dashedObject.addStyle( this.dashedObjectStyle );

        this.pointObject = new MapObject( tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point } );

        this.pointObject.addStyle( this.pointObjectStyle );
    }

    destroy() {
        this.mapWindow.setCursor( this.cursor );

        this.map.requestRender();

        this.parentTask.removeModePanel();

    }

    setup() {
        const mapObject = this.map.getActiveObject();
        if ( mapObject ) {
            //если у объекта редактирования есть точки, то построение рисуем с крайней точки
            const points = mapObject.getPointList();
            if ( points.length > 0 ) {
                const point = points[ points.length - 1 ];
                this.dashedObject.addPoint( point );
                this.dashedObject.addPoint( point );
                //если указан флаг, то добавляем пунктир построения к первой точке объекта редактирования
                if ( this.getLineToFirstPointFlag( mapObject ) ) {
                    this.dashedObject.updatePoint( points[ points.length - 2 ], {
                        objectNumber: 0,
                        contourNumber: 0,
                        positionNumber: 0
                    } );
                    this.dashedObject.updatePoint( points[ points.length - 2 ], {
                        objectNumber: 0,
                        contourNumber: 0,
                        positionNumber: 1
                    } );
                    this.dashedObject.addPoint( points[ 0 ] );
                }
            }

            this.currentObject = mapObject;
            this.currentObject.isDirty = true;

            this.map.clearActiveObject();

        }
        this.parentTask.createModePanel( this.widgetParams );
    }

    canClose() {
        return true;
    }

    canMapMove() {
        return true;
    }


    canShowObjectPanel(): boolean {
        return false;
    }

    onPreRender( renderer: SVGrenderer ) {
        let flag = false;

        if ( this.currentObject && this.currentObject.isDirty ) {
            this.currentObject.isDirty = false;
            flag = true;
        }

        if ( this.dashedObject.isDirty ) {
            this.dashedObject.isDirty = false;
            flag = true;
        }

        if ( this.pointObject.isDirty ) {
            this.pointObject.isDirty = false;
            flag = true;
        }


        if ( flag ) {
            this.map.requestRender();
        }
    }

    onPostRender( renderer: SVGrenderer ) {

        if ( this.hoverObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.hoverObject, this.hoverObjectStyle );
        }

        if ( this.currentObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.currentObject, this.currentObjectStyle );
        }

        this.map.mapObjectsViewer.drawMapObject( renderer, this.dashedObject );

        this.map.mapObjectsViewer.drawMapObject( renderer, this.pointObject );
    }

    onMouseClick( event: MouseDeviceEvent ) {
        if ( this.currentObject ) {
            const hoverPoint = this.pointObject.getPoint({ positionNumber: 0, contourNumber: 0, objectNumber: 0 });

            //если объект редактирования был пустой при инициализации, то заполняем объект построения при первом клике
            if ( this.dashedObject.getPointList().length === 0 ) {
                this.dashedObject.addPixelPoint( event.mousePosition );
                this.dashedObject.addPixelPoint( event.mousePosition );
                if ( this.getLineToFirstPointFlag( this.currentObject ) ) {
                    this.dashedObject.addPixelPoint( event.mousePosition );
                }

                if (hoverPoint) {
                    const positionLast = this.dashedObject.getPointList().length - 1;
                    if (positionLast > 0) {
                        this.dashedObject.updatePoint(hoverPoint, {
                            positionNumber: positionLast,
                            objectNumber: 0,
                            contourNumber: 0
                        });
                    }
                }
            } else {
                this.dashedObject.updatePixelPoint( event.mousePosition, {
                    positionNumber: 0,
                    objectNumber: 0,
                    contourNumber: 0
                } );
            }

            if ( hoverPoint ) {
                this.currentObject.addPoint( hoverPoint, this.selector );

                this.dashedObject.updatePoint( hoverPoint, {
                    positionNumber: 0,
                    objectNumber: 0,
                    contourNumber: 0
                } );
            } else {
                this.currentObject.addPixelPoint( event.mousePosition, this.selector );
            }

            //fixme: иначе стандартный обработчик mouseup меняет
            this.mapWindow.setCursor( CURSOR_TYPE.crosshair );

            this.updateWidgetParams();
        }
    }

    onMouseMove( event: MouseDeviceEvent ) {

        this.pointObject.removeAllPoints();
        this.hoverObject = undefined;

        if ( this.currentObject ) {
            if ( this.dashedObject.getPointList().length > 0 ) {
                const secondGeoPoint = this.dashedObject.getPoint( { positionNumber: 1 } );
                if ( secondGeoPoint ) {
                    this.dashedObject.updatePixelPoint( event.mousePosition, {
                        positionNumber: 1,
                        objectNumber: 0,
                        contourNumber: 0
                    } );
                }
            }
            //fixme: иначе стандартный обработчик mouseup меняет
            this.mapWindow.setCursor( CURSOR_TYPE.crosshair );
        }

        if ( this.mode ) {
            const map = this.mapWindow.getMap(),
                point = event.mousePosition.clone(),
                pointXY = map.pixelToPlane( point );

            //смещаем точку в пикселах для вычисления допуска в метрах
            point.x += this.deltaPix;
            point.y += this.deltaPix;

            const pointXYSupport = map.pixelToPlane( point );
            if ( pointXY ) {
                const cursorMapPoint = this.map.pixelToPlane( event.mousePosition );
                //допуск попадания в точку
                const delta = Math.max( Math.abs( pointXYSupport.x - pointXY.x ), Math.abs( pointXYSupport.y - pointXY.y ) );
                for ( let i = 0; i < this.mapObjectsResult.length; i++ ) {
                    const mapObject = this.mapObjectsResult[ i ];

                    if ( !mapObject.checkPointWithin( cursorMapPoint ) ) {
                        continue;
                    }

                    let nearestPoint;

                    if ( this.mode === CAPTURING_POINT_MODE ) {
                        const result = mapObject.checkPointHover( cursorMapPoint, delta );
                        if ( result ) {
                            nearestPoint = result.mapPoint;
                        }
                    } else if ( this.mode === CAPTURING_LINE_MODE ) {
                        const result = mapObject.checkBorderHover( cursorMapPoint, delta );
                        if ( result ) {
                            nearestPoint = result.mapPoint;
                        }
                    }

                    if ( nearestPoint ) {
                        this.pointObject.addPoint( nearestPoint );
                        this.hoverObject = mapObject.copy();
                        this.hoverObject.local = LOCALE.Template;
                        break;
                    }

                }
            }
        }
    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( this.mode !== undefined && type === VIEW_SETTINGS_ZOOM_LEVEL ) {
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

    onKeyDown( e: KeyboardDeviceEvent ) {
        super.onKeyDown( e );

        const primaryPanel = this.widgetParams[ PRIMARY_PANEL_ID ];

        switch ( e.activeKeyCode ) {
            case KeyboardCode.KeyK:
                this.setState( CAPTURING_POINT_MODE, !primaryPanel.buttons[ 0 ].active );
                break;
            case KeyboardCode.KeyJ:
                this.setState( CAPTURING_LINE_MODE, !primaryPanel.buttons[ 1 ].active );
                break;
            case KeyboardCode.ArrowLeft:
                this.setState( DELETE_LAST_POINT, true );
                break;
            case KeyboardCode.NumpadAdd:
                this.setState( INCREASE_POINT_RADIUS, true );
                break;
            case KeyboardCode.NumpadSubtract:
                this.setState( DECREASE_POINT_RADIUS, true );
                break;
            default:
                break;
        }
    }

    setState<K extends keyof AppendPointActionState>( key: K, value: AppendPointActionState[K] ) {
        let needUpdate = true;

        switch ( key ) {
            case CAPTURING_POINT_MODE:
                this.setCapturePointMode( value as boolean );
                break;
            case CAPTURING_LINE_MODE:
                this.setCaptureLineMode( value as boolean );
                break;
            case DELETE_LAST_POINT:
                this.deleteLastPoint();
                break;
            case INCREASE_POINT_RADIUS:
                this.increasePointRadius();
                break;
            case DECREASE_POINT_RADIUS:
                this.decreasePointRadius();
                break;
            default:
                needUpdate = false;
        }

        if ( needUpdate ) {
            this.updateWidgetParams();
        }
    }


    commit() {
        if ( this.currentObject && this.currentObject.getPointList().length !== 0 ) {
            this.map.setActiveObject( this.currentObject );
        }
        this.updateWidgetParams();
    }

    revert() {
        this.currentObject = undefined;
        this.updateWidgetParams();
    }

    /**
     * Обновить состояния кнопок виджета
     * @private
     * @method updateWidgetParams
     */
    protected updateWidgetParams() {
        const primaryPanel = this.widgetParams[ PRIMARY_PANEL_ID ];
        primaryPanel.buttons[ 0 ].active = this.mode === CAPTURING_POINT_MODE;
        primaryPanel.buttons[ 1 ].active = this.mode === CAPTURING_LINE_MODE;
        primaryPanel.buttons[ 2 ].enabled = !!(this.currentObject && this.currentObject.getPointList().length > 0);
        primaryPanel.buttons[ 3 ].enabled = this.deltaPix < 20;
        primaryPanel.buttons[ 4 ].enabled = this.deltaPix > 5;

        const savePanel = this.widgetParams[ SAVE_PANEL_ID ];
        const button = savePanel.buttons.find( button => button.id === ACTION_COMMIT );
        if ( button ) {
            if ( this.currentObject ) {
                let pointCount = 0;
                //TODO: поправить количество точек
                switch ( this.currentObject.type ) {
                    case MapObjectType.LineString:
                    case MapObjectType.MultiLineString:
                        pointCount = 2;
                        break;
                    case MapObjectType.Polygon:
                    case MapObjectType.MultiPolygon:
                        pointCount = 4;
                        break;
                    case MapObjectType.Point:
                    case MapObjectType.MultiPoint:
                        pointCount = 0;
                        break;
                }

                button.enabled = this.currentObject.getPointList().length >= pointCount;
            } else {
                button.enabled = false;
            }
        }
    }

    /**
     * Установить режим захвата узловых точек
     * @private
     * @method setCapturePointMode
     * @param value {boolean} Значение
     */
    protected setCapturePointMode( value: boolean ) {
        if ( value ) {
            this.mode = CAPTURING_POINT_MODE;
            this.loadMapObjects().then( result => {
                if ( result ) {
                    this.mapObjectsResult = result;
                }
            } ).catch( ( e ) => {
                this.map.writeProtocolMessage( { text: e, type: LogEventType.Error } );
                console.error( e );
            } );
        } else {
            this.mode = undefined;
        }
    }

    /**
     * Установить режим захвата точек на линии
     * @private
     * @method setCaptureLineMode
     * @param value {boolean} Значение
     */
    protected setCaptureLineMode( value: boolean ) {
        if ( value ) {
            this.mode = CAPTURING_LINE_MODE;
            this.loadMapObjects().then( result => {
                if ( result ) {
                    this.mapObjectsResult = result;
                }
            } ).catch( ( e ) => {
                this.map.writeProtocolMessage( { text: e, type: LogEventType.Error } );
                console.error( e );
            } );
        } else {
            this.mode = undefined;
        }
    }

    resetCapturingMode() {
        this.mode = undefined;
        this.updateWidgetParams();
    }

    /**
     * Удалить предыдущую точку
     * @private
     * @method deleteLastPoint
     */
    protected deleteLastPoint() {
        if ( this.currentObject ) {
            this.currentObject.removeLastPoint();

            if ( this.currentObject.getPointList().length === 0 ) {
                this.dashedObject.removeAllPoints();
            } else {
                this.dashedObject.updatePoint( this.currentObject.getPointList()[ this.currentObject.getPointList().length - 1 ], {
                    positionNumber: 0,
                    objectNumber: 0,
                    contourNumber: 0
                } );
            }
            this.updateWidgetParams();
        }
    }

    /**
     * Увеличить значение области захвата точек привязки
     * @private
     * @method increasePointRadius
     */
    private increasePointRadius() {
        this.deltaPix = Math.min( this.deltaPix + 1, 20 );
    }

    /**
     * Уменьшить значение области захвата точек привязки
     * @private
     * @method decreasePointRadius
     */
    private decreasePointRadius() {
        this.deltaPix = Math.max( this.deltaPix - 1, 5 );
    }

    /**
     * Получить признак отображения линии построения к первой точке объекта
     * @protected
     * @method getLineToFirstPointFlag
     * @param mapObject {object} Объект карты
     * @return {boolean} Признак отображения линии построения к первой точке объекта
     */
    protected getLineToFirstPointFlag( mapObject: any ) {
        return mapObject.type === MapObjectType.Polygon || mapObject.type === MapObjectType.MultiPolygon;
    }

    getPrimaryPanelButtons() {
        return this.widgetParams[ PRIMARY_PANEL_ID ].buttons;
    }

    getSavePanelButtons() {
        return this.widgetParams[ SAVE_PANEL_ID ].buttons;
    }
}
