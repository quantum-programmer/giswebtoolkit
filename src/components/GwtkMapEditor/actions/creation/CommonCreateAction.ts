/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *       Обработчик нанесения объектов - общий функционал           *
 *                                                                  *
 *******************************************************************/

import Action, { PRIMARY_PANEL_ID, SAVE_PANEL_ID, ACTION_COMMIT, ACTION_CANCEL } from '~/taskmanager/Action';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import Stroke from '~/style/Stroke';
import Style from '~/style/Style';
import SVGrenderer, {
    GREEN_CIRCLE_SMALL_SVG_MARKER_ID,
    RED_CIRCLE_SVG_MARKER_ID,
} from '~/renderer/SVGrenderer';
import VectorLayer from '~/maplayers/VectorLayer';
import { CURSOR_TYPE } from '~/types/Types';
import Task from '~/taskmanager/Task';
import Fill from '~/style/Fill';
import MarkerStyle from '~/style/MarkerStyle';
import { LOCALE, LogEventType } from '~/types/CommonTypes';
import { MapPoint } from '~/geometry/MapPoint';
import PixelPoint from '~/geometry/PixelPoint';
import {START_WAIT_CAPTURING, STOP_WAIT_CAPTURING} from '@/components/GwtkMapEditor/task/GwtkMapEditorTask';
import {KeyboardCode, KeyboardDeviceEvent} from '~/input/KeyboardDevice';

const CAPTURING_POINT_MODE = 'gwtk.appendpoint.nodemode';
const CAPTURING_LINE_MODE = 'gwtk.appendpoint.contourmode';
const DELETE_LAST_POINT = 'gwtk.appendpoint.deletelastpoint';
const INCREASE_POINT_RADIUS = 'gwtk.appendpoint.increasepointradius';
const DECREASE_POINT_RADIUS = 'gwtk.appendpoint.decreasepointradius';


export type AppendPointActionState = {
    [ CAPTURING_POINT_MODE ]: boolean;
    [ CAPTURING_LINE_MODE ]: boolean;
    [ DELETE_LAST_POINT ]: boolean;
    [ INCREASE_POINT_RADIUS ]: boolean;
    [ DECREASE_POINT_RADIUS ]: boolean;
};

export default class CommonCreateAction<T extends Task> extends Action<T> {

    /**
     * Массив объектов карты (для привязки точек)
     * @private
     * @property mapObjectsResult {MapObject[]}
     */
    protected mapObjectsResult: MapObject[] = [];

    /**
     * Текущее значение области захвата точек привязки
     * @private
     * @property deltaPix {number}
     */
    protected deltaPix = 10;

    /**
     * Текущий режим точек привязки
     * @private
     * @property [mode] {string}
     */
    protected mode?: typeof CAPTURING_POINT_MODE | typeof CAPTURING_LINE_MODE;

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
     * Объект карты (штриховая линия)
     * @private
     * @readonly
     * @property currentObject {MapObject}
     */
    protected readonly currentObject: MapObject;

    /**
     * Стиль объекта штриховой линии к курсору
     * @private
     * @readonly
     * @property currentObjectStyle {Style}
     */
    private readonly currentObjectStyle = new Style( {
        stroke: new Stroke( {
            color: 'black',
            width: '1px',
            dasharray: '5, 5'
        } ), fill: new Fill( {
            color: 'black',
            opacity: 0.05
        } )
    } );

    protected startPixelPoint?: PixelPoint;

    protected firstPoint?: MapPoint;

    protected currentPoint?: MapPoint;

    protected currentPointObject: MapObject;

    /**
     * Стиль объекта точки
     * @private
     * @readonly
     * @property pointObjectStyle {Style}
     */
    private readonly currentPointObjectStyle = new Style( {
        marker: new MarkerStyle( { markerId: RED_CIRCLE_SVG_MARKER_ID } )
    } );

    /**
     * Активный объект с точками привязки
     * @private
     * @property [hoverObject] {MapObject}
     */
    protected hoverObject?: MapObject;

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

    constructor( task: T, id: string ) {
        super( task, id );

        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        //объект с пунктирной линией
        this.currentObject = new MapObject( tempVectorLayer, MapObjectType.Polygon );
        this.currentObject.isDirty = false;

        this.currentPointObject = new MapObject( tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point } );
        this.currentPointObject.isDirty = false;
    }

    setup() {
        this.mapWindow.setCursor( CURSOR_TYPE.crosshair );
        this.parentTask.createModePanel( this.widgetParams );
    }

    destroy() {
        this.currentObject.removeAllPoints();
        this.mapWindow.setCursor( CURSOR_TYPE.default );
        this.parentTask.removeModePanel();
        this.map.requestRender();
    }

    canSelectObject() {
        return false;
    }

    onPreRender( renderer: SVGrenderer ) {
        if ( this.currentObject.isDirty || this.currentPointObject.isDirty ) {
            this.currentObject.isDirty = false;
            this.currentPointObject.isDirty = false;
            this.map.requestRender();
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        this.map.mapObjectsViewer.drawMapObject( renderer, this.currentObject, this.currentObjectStyle );

        this.map.mapObjectsViewer.drawMapObject( renderer, this.currentPointObject, this.currentPointObjectStyle );

        if ( this.hoverObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.hoverObject, this.hoverObjectStyle );
        }
    }

    commit() {

        const mapObject = this.map.getActiveObject();
        if ( mapObject ) {
            mapObject.removeAllPoints();
            //если у объекта редактирования есть точки, то построение рисуем с крайней точки
            const points = this.currentObject.getPointList();
            points.forEach( point => mapObject.addPoint( point ) );
        }

        this.updateWidgetParams();
    }

    revert() {
        this.updateWidgetParams();
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

    /**
     * Обновить состояния кнопок виджета
     * @private
     * @method updateWidgetParams
     */
    protected updateWidgetParams() {
        const primaryPanel = this.widgetParams[ PRIMARY_PANEL_ID ];
        primaryPanel.buttons[ 0 ].active = this.mode === CAPTURING_POINT_MODE;
        primaryPanel.buttons[ 1 ].active = this.mode === CAPTURING_LINE_MODE;
        primaryPanel.buttons[ 2 ].enabled = this.deltaPix < 20;
        primaryPanel.buttons[ 3 ].enabled = this.deltaPix > 5;

        const savePanel = this.widgetParams[ SAVE_PANEL_ID ];
        const button = savePanel.buttons.find( button => button.id === ACTION_COMMIT );
        if ( button ) {
            if ( this.currentObject ) {
                button.enabled = this.currentObject.getPointList().length > 0 && !this.firstPoint;
            } else {
                button.enabled = false;
            }
        }
    }

    /**
     * Увеличить значение области захвата точек привязки
     * @private
     * @method increasePointRadius
     */
    protected increasePointRadius() {
        this.deltaPix = Math.min( this.deltaPix + 1, 20 );
    }

    /**
     * Уменьшить значение области захвата точек привязки
     * @private
     * @method decreasePointRadius
     */
    protected decreasePointRadius() {
        this.deltaPix = Math.max( this.deltaPix - 1, 5 );
    }

    protected async loadMapObjects(): Promise<MapObject[] | undefined> {
        let result = undefined;
        this.parentTask.setState(START_WAIT_CAPTURING, undefined);
        try {
            result = await super.loadMapObjects();
        } catch (e) {

            this.map.writeProtocolMessage( { text: e as string, type: LogEventType.Error } );
            console.error( e );

        } finally {
            this.parentTask.setState(STOP_WAIT_CAPTURING, undefined);
        }

        if (!result) {
            this.resetCapturingMode();
        }

        return result;
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
            this.parentTask.setState(STOP_WAIT_CAPTURING, undefined);
            this.resetCapturingMode();
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
            this.parentTask.setState(STOP_WAIT_CAPTURING, undefined);
            this.resetCapturingMode();
        }
    }

    resetCapturingMode() {
        this.mode = undefined;
        this.updateWidgetParams();
    }

}