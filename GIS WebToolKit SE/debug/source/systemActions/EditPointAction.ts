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

import Action, { ACTION_CANCEL, ACTION_COMMIT, PRIMARY_PANEL_ID, SAVE_PANEL_ID } from '~/taskmanager/Action';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import Stroke from '~/style/Stroke';
import Style from '~/style/Style';
import SVGrenderer, { DEFAULT_SVG_MARKER_ID, GREEN_CIRCLE_SMALL_SVG_MARKER_ID, } from '~/renderer/SVGrenderer';
import VectorLayer from '~/maplayers/VectorLayer';
import { CURSOR_TYPE } from '~/types/Types';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { PointInfo } from '~/mapobject/geometry/BaseMapObjectGeometry';
import Task from '~/taskmanager/Task';
import Fill from '~/style/Fill';
import { GISWebServiceSEMode } from '~/services/Search/SearchManager';
import MarkerStyle from '~/style/MarkerStyle';
import { LOCALE, LogEventType } from '~/types/CommonTypes';
import { VIEW_SETTINGS_ZOOM_LEVEL, WorkspaceValues } from '~/utils/WorkspaceManager';
import { MapPoint } from '~/geometry/MapPoint';
import PixelPoint from '~/geometry/PixelPoint';
import Layer from '~/maplayers/Layer';
import { KeyboardCode, KeyboardDeviceEvent } from '~/input/KeyboardDevice';


const CAPTURING_POINT_MODE = 'gwtk.editpoint.nodemode';
const CAPTURING_LINE_MODE = 'gwtk.editpoint.contourmode';
const CLOSE_OBJECT = 'gwtk.editpoint.closeobject';
const DELETE_POINT = 'gwtk.editpoint.deletepoint';
const COMMON_POINTS = 'gwtk.editpoint.commonpoints';
const UNDO_ACTION = 'gwtk.editpoint.undoaction';
const INCREASE_POINT_RADIUS = 'gwtk.editpoint.increasepointradius';
const DECREASE_POINT_RADIUS = 'gwtk.editpoint.decreasepointradius';


type EditPointActionState = {
    [ CAPTURING_POINT_MODE ]: boolean;
    [ CAPTURING_LINE_MODE ]: boolean;
    [ CLOSE_OBJECT ]: boolean;
    [ DELETE_POINT ]: boolean;
    [ COMMON_POINTS ]: boolean;
    [ UNDO_ACTION ]: boolean;
    [ INCREASE_POINT_RADIUS ]: boolean;
    [ DECREASE_POINT_RADIUS ]: boolean;

};

type CommonPointObjectList = {
    object: MapObject,
    selector: PointInfo,
    initDelta: { x: number; y: number; }
}[];

/**
 * Обработчик правки точек объекта
 * @class EditPointAction
 * @extends Action
 */
export default class EditPointAction<T extends Task> extends Action<T> {


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
                    id: CLOSE_OBJECT,
                    active: false,
                    enabled: true,
                    options: {
                        icon: 'edit-closure-of-polygon',
                        title: 'phrases.Close object'
                    }
                }, {
                    id: DELETE_POINT,
                    active: false,
                    enabled: false,
                    options: {
                        icon: 'edit-delete',
                        title: 'phrases.Remove point'
                    }
                }, {
                    id: COMMON_POINTS,
                    active: false,
                    enabled: true,
                    options: {
                        icon: 'edit-common-points',
                        title: 'mapeditor.Common points'
                    }
                }, {
                    id: UNDO_ACTION,
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
                        label: 'phrases.Save',
                        theme: 'primary',
                    }
                },
                {
                    id: ACTION_CANCEL,
                    active: false,
                    enabled: true,
                    options: {
                        label: 'phrases.Cancel',
                        theme: 'secondary',
                    }
                }
            ]
        }
    };

    /**
     * Редактируемый объект
     * @private
     * @readonly
     * @property [currentObject] {MapObject}
     */
    protected currentObject?: MapObject;

    /**
     * Активный объект с точками привязки
     * @private
     * @property [hoverObject] {MapObject}
     */
    private hoverObject?: MapObject;

    /**
     * Объект выделения точки
     * @private
     * @readonly
     * @property pointObject {MapObject}
     */
    private readonly pointObject: MapObject;

    /**
     * Объект выбранной точки объекта
     * @private
     * @readonly
     * @property pointObject {MapObject}
     */
    private readonly currentPointObject: MapObject;

    /**
     * Массив объектов карты (для привязки точек)
     * @private
     * @property mapObjectsResult {MapObject[]}
     */
    private mapObjectsResult: MapObject[] = [];

    /**
     * Массив объектов карты (для топологии)
     * @private
     * @property mapObjectsForTopologyResult {MapObject[]}
     */
    private mapObjectsForTopologyResult: MapObject[] = [];

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
            opacity: 0
        } )
    } );

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
     * Стиль рисования выбранной точки объекта
     * @private
     * @readonly
     * @property currentPointObjectStyle {Style}
     */
    private readonly currentPointObjectStyle = new Style( {
        marker: new MarkerStyle( {
            markerId: DEFAULT_SVG_MARKER_ID
        } )
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

    private commonPointsMode: boolean = false;

    protected readonly commonPointObjectList: CommonPointObjectList = [];

    /**
     * Текущее значение области захвата точек привязки
     * @private
     * @property deltaPix {number}
     */
    private deltaPix = 10;

    /**
     * Флаг доступности записи следующего действия редактирования точки (срабатывает при первом перемещении)
     * @private
     * @property enableUserActionRecording {boolean}
     */
    private enableUserActionRecording = false;

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
     * @property [selectorOfSelectedPoint] {PointInfo}
     */
    private selectorOfSelectedPoint?: PointInfo;

    /**
     * Массив комманд для отката действий пользователя
     * @private
     * @readonly
     * @property undoUserActionCommands {array}
     */
    private readonly undoUserActionCommands: { execute: () => void; }[] = [];

    /**
     * Вид курсора
     * @private
     * @readonly
     * @property cursor {CURSOR_TYPE}
     */
    private readonly cursor: CURSOR_TYPE;

    private mouseDownPoint?: MapPoint;

    private layersForTopology: Layer[] = [];

    /**
     * @constructor EditPointAction
     * @param task {Task} Экземпляр родительской задачи
     * @param id {string} Идентификатор обработчика
     */
    constructor( task: T, id: string ) {
        super( task, id );
        this.cursor = this.mapWindow.setCursor( CURSOR_TYPE.default );

        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        this.pointObject = new MapObject( tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point } );

        this.pointObject.addStyle( this.pointObjectStyle );

        this.currentPointObject = new MapObject( tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point } );

        this.currentPointObject.addStyle( this.currentPointObjectStyle );
    }

    setup() {

        this.layersForTopology = this.map.vectorLayers.filter( layer => layer.isCommonPointsEditEnabled );

        const activeObject = this.map.getActiveObject();
        if ( activeObject && !this.canSelectThisObject( activeObject ) ) {
            this.map.clearActiveObject();
        } else {
            this.selectObject( activeObject );
        }

        if ( !this.currentObject ) {
            this.parentTask.setPanelMessage( { text: 'Select map object' } );
        }

        this.updateWidgetParams();
    }

    destroy() {
        this.commonPointObjectList.splice( 0 );

        this.mapWindow.setCursor( this.cursor );
        this.map.requestRender();

        this.parentTask.removeModePanel();
        this.parentTask.resetMessage();

    }

    canSelectObject() {
        return !this.currentObject;
    }

    canClose() {
        return true;
    }

    canMapMove() {
        return !this.selector;
    }

    canShowObjectPanel(): boolean {
        return !this.currentObject;
    }

    onPreRender( renderer: SVGrenderer ) {
        let flag = false;

        if ( this.pointObject.isDirty ) {
            this.pointObject.isDirty = false;
            flag = true;
        }

        if ( this.currentPointObject.isDirty ) {
            this.currentPointObject.isDirty = false;
            flag = true;
        }

        if ( this.currentObject && this.currentObject.isDirty ) {
            this.currentObject.isDirty = false;
            flag = true;
        }

        if ( flag ) {
            this.map.requestRender();
        }
    }

    onPostRender( renderer: SVGrenderer ) {

        this.map.mapObjectsViewer.drawMapObject( renderer, this.pointObject );
        this.map.mapObjectsViewer.drawMapObject( renderer, this.currentPointObject );

        if ( this.hoverObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.hoverObject, this.hoverObjectStyle );
        }

        if ( this.currentObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.currentObject, this.currentObjectStyle );
        }
    }

    onMouseUp( event: MouseDeviceEvent ) {
        this.selector = undefined;
        this.enableUserActionRecording = false;
        this.mapWindow.setCursor( CURSOR_TYPE.default );

        this.updateWidgetParams();
    }

    onMouseDown( event: MouseDeviceEvent ) {
        if ( this.currentObject && !this.selectorCandidate ) {
            this.onMouseMove( event );
        }

        this.enableUserActionRecording = true;
        this.selector = this.selectorCandidate;

        this.currentPointObject.removeAllPoints();
        this.selectorOfSelectedPoint = undefined;
        if ( this.selectorCandidate && this.currentObject ) {
            this.selectorOfSelectedPoint = this.selectorCandidate;
            this.currentPointObject.addPoint( this.currentObject.getPoint( this.selectorCandidate )! );

            this.mouseDownPoint = this.map.pixelToPlane( event.mousePosition );
            this.selectorCandidate = undefined;
        }

        if ( this.commonPointsMode ) {
            const delta = this.getDelta( event.mousePosition );
            this.fillCommonPointObjectList( delta );
        }

        this.updateWidgetParams();
    }

    /**
     * Получить допуск попадания в точку (в метрах)
     * @private
     * @param point {PixelPoint} Исходная точка в пикселах
     * @return {number} Допуск попадания в точку (в метрах)
     */
    private getDelta( point: PixelPoint ): number {
        const map = this.mapWindow.getMap();

        const pointXY = map.pixelToPlane( point );

        const pointSupport = point.clone();
        //смещаем точку в пикселах для вычисления допуска в метрах
        pointSupport.x += this.deltaPix;
        pointSupport.y += this.deltaPix;

        const pointXYSupport = map.pixelToPlane( pointSupport );

        return Math.max( Math.abs( pointXYSupport.x - pointXY.x ), Math.abs( pointXYSupport.y - pointXY.y ) );
    }

    onMouseMove( event: MouseDeviceEvent ) {

        let isPointCaptured: boolean = false;

        this.mapWindow.setCursor( CURSOR_TYPE.default );

        this.pointObject.removeAllPoints();
        this.hoverObject = undefined;
        this.selectorCandidate = undefined;

        if ( this.currentObject ) {

            const delta = this.getDelta( event.mousePosition );

            if ( this.enableUserActionRecording ) {
                if ( this.selector && this.currentObject ) {
                    const selector = { ...this.selector };
                    const mapPoint = this.currentObject.getPoint( this.selector )?.clone();

                    if ( mapPoint ) {
                        const objectListForUndo: { object: MapObject, point: MapPoint, selector: PointInfo }[] = [];
                        objectListForUndo.push( { object: this.currentObject, point: mapPoint, selector } );
                        this.commonPointObjectList.forEach(
                            commonPointObject => {

                                const point = mapPoint.clone();
                                // point.x += commonPointObject.initDelta.x;//TODO отключено для сливания общих точек в одну (1/3)
                                // point.y += commonPointObject.initDelta.y;

                                objectListForUndo.push( {
                                    object: commonPointObject.object,
                                    point,
                                    selector: commonPointObject.selector
                                } );
                            }
                        );

                        this.undoUserActionCommands.push( {
                            execute: () => {
                                objectListForUndo.forEach( item => item.object.updatePoint( item.point, item.selector ) );
                            }
                        } );
                    }
                }
                this.enableUserActionRecording = false;
            }

            const cursorMapPoint = this.map.pixelToPlane( event.mousePosition );

            if ( !this.selector ) {
                const result = this.currentObject.checkPointHover( cursorMapPoint, delta );
                if ( result ) {
                    this.pointObject.addPoint( this.currentObject.getPoint( result )! );
                    this.selectorCandidate = result;
                    //fixme: иначе стандартный обработчик mouseup меняет
                    this.mapWindow.setCursor( CURSOR_TYPE.pointer );
                }
            } else {

                if ( this.mode ) {

                    for ( let i = 0; i < this.mapObjectsResult.length; i++ ) {
                        const mapObject = this.mapObjectsResult[ i ];
                        if ( mapObject.gmlId === this.currentObject.gmlId ) {
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

                //если объект редактирования был пустой при инициализации, то заполняем объект построения при первом клике
                const hoverPoint = this.pointObject.getPoint( {
                    positionNumber: 0,
                    contourNumber: 0,
                    objectNumber: 0
                } );

                if ( hoverPoint ) {
                    this.currentObject.updatePoint( hoverPoint, this.selector );
                    this.currentPointObject.updatePoint( hoverPoint, {
                        objectNumber: 0,
                        contourNumber: 0,
                        positionNumber: 0
                    } );
                    this.commonPointObjectList.forEach(
                        commonPointObject => {
                            // let point = hoverPoint.copy();
                            // point.x += commonPointObject.initDelta.x;//TODO отключено для сливания общих точек в одну (2/3)
                            // point.y += commonPointObject.initDelta.y;

                            commonPointObject.object.updatePoint( hoverPoint, commonPointObject.selector );
                        }
                    );

                } else {
                    this.currentObject.updatePixelPoint( event.mousePosition, this.selector );
                    this.currentPointObject.updatePixelPoint( event.mousePosition, {
                        objectNumber: 0,
                        contourNumber: 0,
                        positionNumber: 0
                    } );

                    const pointResult = this.currentObject.getPoint( this.selector );

                    if ( pointResult ) {
                        this.commonPointObjectList.forEach(
                            commonPointObject => {

                                let point = pointResult.clone();
                                // point.x += commonPointObject.initDelta.x;//TODO отключено для сливания общих точек в одну (3/3)
                                // point.y += commonPointObject.initDelta.y;

                                commonPointObject.object.updatePoint( point, commonPointObject.selector );
                            }
                        );
                    }
                }
                //fixme: иначе стандартный обработчик mouseup меняет
                this.mapWindow.setCursor( CURSOR_TYPE.crosshair );
                isPointCaptured = true;
            }

            const mousePoint = this.map.pixelToPlane( event.mousePosition );

            if ( isPointCaptured && this.mouseDownPoint && ((Math.abs( this.mouseDownPoint.x - mousePoint.x ) > 0)
                || (Math.abs( this.mouseDownPoint.y - mousePoint.y ) > 0)) ) {

                this.setSaveButtonEnabled( true );

            }

        }

    }

    private setSaveButtonEnabled( status: boolean ) {
        const button = this.widgetParams[ SAVE_PANEL_ID ].buttons.find( item => item.id === ACTION_COMMIT );
        if ( button ) {
            button.enabled = status;
        }
    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( type === VIEW_SETTINGS_ZOOM_LEVEL ) {
            if ( this.mode !== undefined ) {
                this.loadMapObjects().then( result => {
                    if ( result ) {
                        this.mapObjectsResult = result;
                    }
                } ).catch( ( e ) => {
                    this.map.writeProtocolMessage( { text: e, type: LogEventType.Error } );
                    console.error( e );
                } );
            }

            if ( this.commonPointsMode ) {
                this.loadMapObjectsForTopology().catch( ( e ) => {
                    this.map.writeProtocolMessage( { text: e, type: LogEventType.Error } );
                    console.error( e );
                } );
            }
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
            case KeyboardCode.KeyL:
                this.setState( CLOSE_OBJECT, true );
                break;
            case KeyboardCode.Delete:
                this.setState( DELETE_POINT, true );
                break;
            case KeyboardCode.KeyA:
                this.setState( COMMON_POINTS, true );
                break;
            case KeyboardCode.ArrowLeft:
                this.setState( UNDO_ACTION, true );
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

    setState<K extends keyof EditPointActionState>( key: K, value: EditPointActionState[K] ) {
        let needUpdate = true;

        switch ( key ) {
            case CAPTURING_POINT_MODE:
                this.setCapturePointMode( value );
                break;
            case CAPTURING_LINE_MODE:
                this.setCaptureLineMode( value );
                break;
            case CLOSE_OBJECT:
                this.closeObject();
                break;
            case DELETE_POINT:
                this.deletePoint();
                break;
            case COMMON_POINTS:
                this.commonPointsMode = !this.commonPointsMode;

                if ( this.commonPointsMode ) {
                    this.loadMapObjectsForTopology().catch( ( e ) => {
                        this.map.writeProtocolMessage( { text: e, type: LogEventType.Error } );
                    } );
                }
                break;
            case UNDO_ACTION:
                this.undoAction();
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

    selectObject( mapObject?: MapObject ) {
        if ( !this.currentObject && mapObject ) {

            const canUpdate = mapObject.getEditFlag();
            if (!canUpdate) {
                this.mapWindow.addSnackBarMessage(this.map.translate('Selected object is not available for editing'));
                return;
            }

            //если у объекта редактирования есть точки, то построение рисуем с крайней точки
            this.currentObject = mapObject.copy();
            this.currentObject.isDirty = true;
            this.parentTask.resetMessage();
            this.parentTask.createModePanel( this.widgetParams );

            this.updateWidgetParams();
        }
    }

    commit() {
        if ( this.currentObject ) {
            const activeObject = this.map.getActiveObject();
            if ( activeObject && activeObject.gmlId === this.currentObject.gmlId ) {
                activeObject.updateFrom( this.currentObject );
            } else {
                this.map.setActiveObject( this.currentObject );
            }

            this.quit();
        }
    }

    revert() {
        this.quit();
    }

    /**
     * Обновить состояния кнопок виджета
     * @private
     * @method updateWidgetParams
     */
    private updateWidgetParams() {
        const primaryPanel = this.widgetParams[ PRIMARY_PANEL_ID ];
        primaryPanel.buttons[ 0 ].active = this.mode === CAPTURING_POINT_MODE;
        primaryPanel.buttons[ 1 ].active = this.mode === CAPTURING_LINE_MODE;
        primaryPanel.buttons[ 2 ].enabled = !!(this.currentObject && this.currentObject.getPointList().length > 1);
        primaryPanel.buttons[ 3 ].enabled = !!this.selectorOfSelectedPoint;
        primaryPanel.buttons[ 4 ].active = this.commonPointsMode;
        primaryPanel.buttons[ 4 ].enabled = !!(this.layersForTopology.length);
        primaryPanel.buttons[ 5 ].enabled = this.undoUserActionCommands.length > 0;//undo
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
     * Замкнуть объект
     * @private
     * @method closeObject
     */
    private closeObject() {
        if ( this.currentObject ) {
            if ( this.currentObject.closeObject() ) {
                this.undoUserActionCommands.push( {
                    execute: () => {
                        if ( this.currentObject ) {
                            this.currentObject.removeLastPoint();
                        }
                    }
                } );

                this.setSaveButtonEnabled( true );

            }
        }
    }

    /**
     * Удалить выбранную точку
     * @private
     * @method deletePoint
     */
    private deletePoint() {
        if ( this.currentObject && this.selectorOfSelectedPoint ) {
            const mapPoint = this.currentObject.getPoint( this.selectorOfSelectedPoint )!.clone();
            const selector = { ...this.selectorOfSelectedPoint };
            this.undoUserActionCommands.push( {
                execute: () => {
                    if ( this.currentObject ) {
                        this.currentObject.addPoint( mapPoint, selector );
                    }
                }
            } );

            this.currentObject.removePoint( selector );
            this.currentPointObject.removeAllPoints();
            this.selectorOfSelectedPoint = undefined;

            this.setSaveButtonEnabled( true );
        }
    }

    /**
     * Заполнить массив объектов с общей точкой
     * @private
     * @method fillCommonPointObjectList
     */
    private fillCommonPointObjectList( delta: number ): void {

        this.commonPointObjectList.splice( 0 );

        const currentObject = this.currentObject;

        if ( currentObject && this.selectorOfSelectedPoint ) {
            const selectedPoint = currentObject.getPoint( this.selectorOfSelectedPoint );

            if ( !selectedPoint ) {
                return;
            }

            this.mapObjectsForTopologyResult.forEach( mapObject => {
                const pointInfoResult: PointInfo | undefined = mapObject.checkPointHover( selectedPoint, delta );
                if ( pointInfoResult ) {

                    const initDelta = { x: 0, y: 0 };
                    const objectPoint = mapObject.getPoint( pointInfoResult );
                    if ( objectPoint ) {
                        initDelta.x = objectPoint.x - selectedPoint.x;
                        initDelta.y = objectPoint.y - selectedPoint.y;
                    }

                    this.commonPointObjectList.push( { object: mapObject, selector: pointInfoResult, initDelta } );
                }
            } );
        }
    }

    /**
     * Отменить предыдущее действие
     * @private
     * @method undoAction
     */
    private undoAction() {
        const userAction = this.undoUserActionCommands.pop();
        if ( userAction ) {
            userAction.execute();
            if ( this.currentObject ) {
                this.currentPointObject.removeAllPoints();
            }

            this.selectorOfSelectedPoint = undefined;

            if ( this.undoUserActionCommands.length === 0 ) {
                this.setSaveButtonEnabled( false );
            }
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

    private async loadMapObjectsForTopology() {
        const result = await this.map.searchManager.findWithinBounds( this.map.getWindowBounds(), GISWebServiceSEMode.All, this.layersForTopology );
        if ( result && result.mapObjects ) {
            this.mapObjectsForTopologyResult = MapObject.sortMapObjectsByType( result.mapObjects );
        }
    }
}
