/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Компонент Шторка                          *
 *                                                                  *
 *******************************************************************/


import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData, LAYERTYPE, GwtkMap, CURSOR_TYPE } from '~/types/Types';
import MapWindow from '~/MapWindow';
import { TileLayer } from '~/maplayers/TileLayer';
import { PixelBounds } from '~/geometry/PixelBounds';
import { DataChangedEvent } from '~/taskmanager/TaskManager';
import { WorkspaceValues, VIEW_SETTINGS_ZOOM_LEVEL } from '~/utils/WorkspaceManager';
import PixelPoint from '~/geometry/PixelPoint';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import GwtkShutterAction from '@/components/GwtkShutter/action/GwtkShutterAction';
import GwtkShutterWidget from '@/components/GwtkShutter/task/GwtkShutterWidget.vue';


export const SET_VERTICAL_MODE = 'gwtkshutter.setmode';
export const TOGGLE_ITEM = 'gwtkshutter.toggleitem';
export const SET_SHUTTER_POSITION = 'gwtkshutter.setshutterposition';
export const SHUTTER_POSITION_EDITOR_ACTION = 'gwtkshutter.shutterpositioneditoraction';
export const TOGGLE_SELECT_ALL = 'gwtkshutter.selectall';
export const ON_INPUT_SEARCH = 'gwtkshutter.oninputsearch';
export type GwtkShutterTaskState = {
    [ SET_VERTICAL_MODE ]: boolean;
    [ TOGGLE_ITEM ]: { xId: string, status: boolean };
    [ SET_SHUTTER_POSITION ]: ShutterPosition;
    [ TOGGLE_SELECT_ALL ]: { xIdList: string[], status: boolean };
    [ ON_INPUT_SEARCH ]: string;
}

type ShutterPosition = { left: number; top: number; }

type WidgetParams = {
    verticalMode: boolean;
    setState: GwtkShutterTask['setState'];
    layerList: ShutterLayerDescription[];
    searchValue: string;
}

export type ShutterLayerDescription = {
    active: boolean;
    xId: string;
    alias: string;
    type: LAYERTYPE;
}

/**
 * Компонент "Шторка"
 * @class GwtkShutterTask
 * @extends Task
 * @description
 */
export default class GwtkShutterTask extends Task {
    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private readonly canvas: HTMLCanvasElement;

    readonly shutter: ShutterPosition;

    private readonly wmsParams = {
        width: 0,
        height: 0
    };
    private readonly wmtsParams = {
        width: 0,
        height: 0
    };

    private readonly pixelBoundsCanvas = new PixelBounds();

    private readonly background: HTMLImageElement;

    private hoverFlag = false;

    /**
     * @constructor GwtkHeatMapTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        const layerList = [];
        for ( let i = 0; i < this.map.layers.length; i++ ) {
            const layer = this.map.layers[ i ];
            const type = layer.type();
            if ( layer.visible && (type !== LAYERTYPE.wms || !this.map.options.mergewmslayers) ) {
                layerList.push( {
                    xId: layer.xId,
                    alias: layer.alias,
                    active: false,
                    type
                } );
            }
        }

        this.background = new Image();
        this.background.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIIAAACCAQMAAACwzYK+AAAABlBMVEXy7+n08et0fG9hAAAAJklEQVR42mP4jwYOMGCKjGQ4Gj6j4TMaPqPhMxo+o+EzGj4jMnwAPkcgnaUSKgYAAAAASUVORK5CYII=';

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            setState: this.setState.bind( this ),
            verticalMode: true,
            layerList,
            searchValue: ''
        };

        const size = this.map.getWindowSize();
        this.canvas = document.createElement( 'canvas' );
        this.canvas.classList.add( 'wms-canvas' );
        this.canvas.style.top = '0px';
        this.canvas.style.left = '0px';
        this.canvas.width = size[ 0 ];
        this.canvas.height = size[ 1 ];

        this.shutter = {
            top: size[ 1 ] / 2,
            left: size[ 0 ] / 2
        };

        this.wmsParams.width = size[ 0 ];
        this.wmsParams.height = size[ 1 ];

        this.wmtsParams.width = this.wmsParams.width - parseInt( this.map.panes.tilePane.offsetLeft ) + 1000;
        this.wmtsParams.height = this.wmsParams.height + Math.abs( parseInt( this.map.panes.tilePane.offsetTop ) );

        this.map.disableMapRefresh( true );                               // отключить обновление в карте, здесь обновится

        this.onResize = this.onResize.bind( this );
        this.onWmsLoaded = this.onWmsLoaded.bind( this );

        window.addEventListener( 'resize', this.onResize );
        this.map.on( { type: 'wmsloaded' }, this.onWmsLoaded );

        this.actionRegistry.push( {
            getConstructor() {
                return GwtkShutterAction;
            },
            id: SHUTTER_POSITION_EDITOR_ACTION,
            active: false,
            enabled: true
        } );
    }

    setup() {
        super.setup();
        this.onWmsLoaded();
    }

    /**
     * регистрация Vue компонента
     */
    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkShutterWidget';
        const sourceWidget = GwtkShutterWidget;
        this.mapWindow.registerComponent( nameWidget, sourceWidget );

        // Создание Vue компонента
        this.mapWindow.createWidget( nameWidget, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    /**
     * Деструктор
     * @method quit
     */
    quit() {
        this.map.disableMapRefresh( false );
        window.removeEventListener( 'resize', this.onResize );
        this.map.off( { type: 'wmsloaded' }, this.onWmsLoaded );
        this.map.tiles._drawFilter = undefined;
        this.map.redraw();
        super.quit();
    }

    setState<K extends keyof GwtkShutterTaskState>( key: K, value: GwtkShutterTaskState[K] ) {
        switch ( key ) {
            case SET_VERTICAL_MODE:
                const newMode = value as boolean;
                if ( this.widgetProps.verticalMode !== newMode ) {
                    this.widgetProps.verticalMode = newMode;
                    this.onWmsLoaded();
                }
                break;
            case TOGGLE_ITEM:
                const toggledItem = value as { xId: string, status: boolean };
                if (toggledItem) {
                    const layerItem = this.widgetProps.layerList.find( item => item.xId === toggledItem.xId );
                    if ( layerItem ) {
                        layerItem.active = toggledItem.status;
                        if ( layerItem.type === LAYERTYPE.wms ) {
                            this.updateWmsImageBuffer();
                        }
                        this.redraw();
                    }
                }
                break;
            case SET_SHUTTER_POSITION:
                const { left, top } = value as ShutterPosition;
                let redrawFlag = false;
                if ( this.shutter.left !== left ) {
                    this.shutter.left = left;
                    redrawFlag = true;
                }
                if ( this.shutter.top !== top ) {
                    this.shutter.top = top;
                    redrawFlag = true;
                }

                if ( redrawFlag ) {
                    this.onWmsLoaded();
                }
                break;
            case TOGGLE_SELECT_ALL:
                const valueData = value as {xIdList: string[], status: boolean};

                if (valueData && valueData.xIdList && valueData.xIdList.length) {
                    valueData.xIdList.forEach(item => {
                        const layerItem = this.widgetProps.layerList.find(layer => layer.xId === item);
                        if (layerItem) {
                            layerItem.active = valueData.status;
                            if (layerItem.type === LAYERTYPE.wms) {
                                this.updateWmsImageBuffer();
                            }
                            this.redraw();
                        }
                    });
                }
                break;
            case ON_INPUT_SEARCH:
                if (value) {
                    this.widgetProps.searchValue = value as string;
                } else {
                    this.widgetProps.searchValue = '';
                }
                break;
            default:
                if ( this._action ) {
                    this._action.setState( key, value );
                }
        }
    }

    /**
     * Обработать событие карты
     * @method onDataChanged
     */
    onDataChanged( event: DataChangedEvent ) {
        if ( event.type === 'layercommand' && event.command === 'visibilitychanged' && event.layer ) {
            if ( event.layer.visible ) {
                const xId = event.layer.id;
                if ( !this.widgetProps.layerList.find( item => item.xId === xId ) ) {
                    this.addLayer( event.layer.id );
                }
            } else {
                this.removeLayer( event.layer.id );
            }
        } else if ( event.type === 'content' ) {
            this.map.layers.forEach( layer => {
                if ( !this.widgetProps.layerList.find( item => item.xId === layer.xId ) && layer.visible ) {
                    this.addLayer( layer.xId );
                }
                this.removeLayer( layer.xId );
            } );
        }
    }

    /**
     * Обработать событие карты
     * @method onWorkspaceChanged
     */
    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( type === VIEW_SETTINGS_ZOOM_LEVEL ) {
            setTimeout( () => {
                this.onWmsLoaded();// иначе карта зарисовывает все
            }, 800 );
        }
    }

    /**
     * Обработать событие wmsLoaded карты
     * @method onWmsLoaded
     */
    onWmsLoaded(): void {
        this.updateWmsImageBuffer();
        this.redraw();
    }

    onMouseMove( event: MouseDeviceEvent ) {
        let { left, top } = this.shutter;

        let delta;
        if ( this.widgetProps.verticalMode ) {
            delta = event.mousePosition.x - left;
        } else {
            delta = event.mousePosition.y - top;
        }

        this.hoverFlag = Math.abs( delta ) < 8;
        this.mapWindow.setCursor( this.hoverFlag ? CURSOR_TYPE.pointer : CURSOR_TYPE.default );
    }

    onMouseDown( event: MouseDeviceEvent ) {
        if ( this.hoverFlag ) {
            this.mapWindow.setCursor( CURSOR_TYPE.grab );
            this.doAction( SHUTTER_POSITION_EDITOR_ACTION );
        }
    }

    /**
     * Обновить размеры элементов
     * @method onResize
     */
    private onResize(): void {
        const windowSize = this.map.getWindowSize();
        this.wmsParams.width = windowSize[ 0 ];
        this.wmsParams.height = windowSize[ 1 ];

        this.wmtsParams.width = this.wmsParams.width - parseInt( this.map.panes.tilePane.offsetLeft ) + 1000;
        this.wmtsParams.height = this.wmsParams.height + Math.abs( parseInt( this.map.panes.tilePane.offsetTop ) );

        this.canvas.width = windowSize[ 0 ];
        this.canvas.height = windowSize[ 1 ];

        this.onWmsLoaded();
    }

    /**
     * Добавить слой в шторку
     * @method addLayer
     * @param xId {string} - идентификатор слоя карты
     */
    private addLayer( xId: string ): void {
        const layer = this.map.tiles.getLayerByxId( xId );
        if ( layer ) {
            this.widgetProps.layerList.push( {
                xId: layer.xId,
                alias: layer.alias,
                active: false,
                type: layer.type()
            } );
        }
    }

    /**
     * Удалить слой шторки
     * @param xId {string} - xid слоя карты
     * @method removeLayer
     * @return {boolean}
     */
    private removeLayer( xId: string ): void {
        const itemIndex = this.widgetProps.layerList.findIndex( item => item.xId === xId );
        if ( itemIndex !== -1 ) {
            this.widgetProps.layerList.splice( itemIndex, 1 ); // удалить из общего списка
        }
    }

    /**
     * Получить фильтр слоев карты
     * @method getLayerFilter
     * @return {Object} фильтр отображения карты по слоям, json {"wmts": [id слоев тайлов], "wms":[id слоев wms]}
     */
    private getLayerFilter(): GwtkMap['tiles']['_drawFilter'] | undefined {
        const wmts = [], wms = [],
            visibleLayerItems = this.map.tiles.getVisibleLayers();      // видимые слои в порядке отображения

        let count = 0;

        for ( let i = 0; i < visibleLayerItems.length; i++ ) {
            const visibleLayerItem = visibleLayerItems[ i ];
            const layerItem = this.widgetProps.layerList.find( item => item.xId === visibleLayerItem.xId );

            if ( layerItem && layerItem.active ) {
                count++;
                continue;
            }

            if ( visibleLayerItem.tiles ) {
                wmts.push( visibleLayerItem.xId );
            } else {
                const layer = this.map.tiles.getLayerByxId( visibleLayerItem.xId );
                if ( layer && layer.type() === LAYERTYPE.wms ) {
                    wms.push( visibleLayerItem.xId );
                }
            }
        }

        if ( wmts.length === 0 && wms.length === 0 && count !== visibleLayerItems.length ) {
            return undefined;
        }

        return { wmts, wms };
    }

    /**
     * Нарисовать шторку в карте
     * @method redraw
     */
    private redraw(): void {
        if ( this.widgetProps.layerList.length !== 0 ) {
            this.map.tiles._drawFilter = this.getLayerFilter();

            this.map.tiles.drawMapImage( true, false, true );                     // карта

            if ( this.widgetProps.verticalMode ) {
                this.drawShutterImageToMap( this.shutter.left, 0 );        // шторка вертикальная
            } else {
                this.drawShutterImageToMap( 0, this.shutter.top );         // шторка горизонтальная
            }
        }
    }

    /**
     * Обрезать изображение в шторке
     * @method drawShutterImageToMap
     * (для слоев wms и tile)
     * @param x {number} левое верхнее положение шторки в окне (пикселы)
     * @param y {number} левое верхнее положение шторки в окне (пикселы)
     */
    private drawShutterImageToMap( x: number, y: number ) {
        if ( this.widgetProps.layerList.length === 0 ) {
            return;
        }

        let enable = false;
        for ( let i = 0; i < this.widgetProps.layerList.length; i++ ) {
            if ( this.widgetProps.layerList[ i ].active ) {
                enable = true;
                break;
            }
        }

        const topLeft = new PixelPoint( x, y ),
            mapPixelBounds = this.map.getPixelMapBounds(),
            clipBounds = PixelBounds.toBounds( mapPixelBounds.min.add( topLeft ), mapPixelBounds.max ); // габариты шторки

        const begin = new PixelPoint( clipBounds.min.x, clipBounds.min.y ),              // left top пикселы матрицы начала шторки в окне
            clipSize = clipBounds.getSize(),
            ctx = this.map._getCanvas()?.getContext( '2d' );

        // clear shutter part
        if ( ctx ) {
            this.clearRect( ctx, x, y, clipSize );
        }


        // draw tiles to shutter part
        for ( let i = 0; i < this.widgetProps.layerList.length; i++ ) {
            const layerItem = this.widgetProps.layerList[ i ];
            if ( layerItem.active ) {
                const layer = this.map.tiles.getLayerByxId( layerItem.xId );
                if ( layer && (layer.type() === LAYERTYPE.tile || layer.type() === LAYERTYPE.tilewms) ) {
                    (layer as TileLayer).drawLayer( clipBounds, begin, false, topLeft );
                }
            }
        }

        // draw wms to shutter part
        if ( ctx ) {
            ctx.globalAlpha = 1;
            // draw shuttle wms
            const sx = Math.round( clipBounds.min.x - this.pixelBoundsCanvas.min.x ),
                sy = Math.round( clipBounds.min.y - this.pixelBoundsCanvas.min.y );

            ctx.drawImage( this.canvas, sx, sy, clipSize.x, clipSize.y, x, y, clipSize.x, clipSize.y );
        }

    }

    private clearRect( ctx: CanvasRenderingContext2D, x: number, y: number, clipSize: PixelPoint ) {
        let startY = y;
        let heightToFill = clipSize.y;
        if ( this.background.width && this.background.height ) {
            while ( heightToFill > 0 ) {
                let startX = x;
                let widthToFill = clipSize.x;
                while ( widthToFill > 0 ) {
                    ctx.drawImage( this.background, 0, 0, this.background.width, this.background.height, startX, startY, this.background.width, this.background.height );
                    widthToFill -= this.background.width;
                    startX += this.background.width;
                }
                heightToFill -= this.background.height;
                startY += this.background.height;
            }
        }
    }

    /**
     * Нарисовать шаблон шторки для wms слоев
     * @method updateWmsImageBuffer
     */
    private updateWmsImageBuffer(): void {
        const ctx = this.canvas.getContext( '2d' );

        if ( ctx ) {
            ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );
        }

        const filter = [];
        for ( let i = 0; i < this.widgetProps.layerList.length; i++ ) {
            const layerItem = this.widgetProps.layerList[ i ];
            if ( layerItem.type === LAYERTYPE.wms && layerItem.active ) {
                filter.push( layerItem.xId );
            }
        }
        if ( filter.length > 0 ) {
            this.map.drawWmsImageTo( this.canvas, filter );
        }

        this.pixelBoundsCanvas.fromBounds( this.map.getPixelMapBounds() );

        if ( ctx ) {
            ctx.beginPath();
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 4;
            ctx.setLineDash( [10, 10] );
            if ( this.widgetProps.verticalMode ) {
                ctx.moveTo( this.shutter.left, 0 );
                ctx.lineTo( this.shutter.left, this.canvas.height );
            } else {
                ctx.moveTo( 0, this.shutter.top );
                ctx.lineTo( this.canvas.width, this.shutter.top );
            }
            ctx.stroke();
        }
    }

}

