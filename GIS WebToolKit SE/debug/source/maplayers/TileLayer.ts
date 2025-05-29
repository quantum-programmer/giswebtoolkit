/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Управление слоем тайлов карты                 *
 *                                                                  *
 *******************************************************************/

import TranslateList from '~/translate/TTranslateList';
import { GwtkMap, TileItem } from '~/types/Types';
import { LogEventType, SimpleJson, AUTH_HEADER } from '~/types/CommonTypes';
import { GwtkLayerDescription } from '~/types/Options';
import Layer from '~/maplayers/Layer';
import PixelPoint from '~/geometry/PixelPoint';
import TileCoord from '~/geometry/TileCoord';
import GeoPoint from '~/geo/GeoPoint';
import { PixelBounds } from '~/geometry/PixelBounds';
import { TileMatrix } from '~/translate/matrixes/TileMatrix';
import { BrowserService } from '~/services/BrowserService';


/**
 * Класс TileLayer - загрузка, отображение изображений и управление слоем тайлов.
 * Основным параметром слоя является адрес сервера тайлов (options.url).
 * Слои создаются динамически, хранятся в коллекции layers класса карты Map.
 * Конструктор TileLayer принимает два параметра – объект Map и объект параметров - layerdescription.
 * После создания объекта TileLayer необходимо добавить его в коллекцию слоев карты методом onAdd().
 *
 * @class TileLayer
 * @extends Layer
 */
export class TileLayer extends Layer {

    /**
     * Тип матрицы тайлов
     * @private
     * @property tilematrixset {string}
     */
    private tilematrixset: string = 'GoogleMapsCompatible';

    /**
     * Параметры матрицы тайлов
     */
    protected readonly tileMatrix: TileMatrix;
    /**
     * Высота окна карты
     * @private
     * @property windowHeight {number}
     */
    private windowHeight: number = 0;

    /**
     * Ширина окна карты
     * @private
     * @property windowWidth {number}
     */
    private windowWidth: number = 0;

    /**
     * Текущий уровень приближения тайлов (zoom)
     * @private
     * @property tileszoom {number}
     */
    private tileszoom: number = 0;

    /**
     * Общее количество строк в матрице текущего уровня приближения
     * @private
     * @property rowTotal {number}
     */
    private rowTotal: number = 0;

    /**
     * Общее количество столбцов в матрице текущего уровня приближения
     * @private
     * @property collTotal {number}
     */
    private collTotal: number = 0;

    /**
     * Количество строк тайлов в окне
     * @private
     * @property rowCount {number}
     */
    private rowCount: number = 0;

    /**
     * Количество колонок тайлов в окне
     * @private
     * @property collCount {number}
     */
    private collCount: number = 0;

    /**
     * Текущий кэш загруженных тайлов
     * @private
     * @property tiles {SimpleJson<any>}
     */
    private tiles: SimpleJson<any> = {};

    /**
     * Кэш свободных тайлов
     * @private
     * @property tileStock {SimpleJson<any>}
     */
    private tileStock: any[] = [];

    /**
     * Ширина тайла
     * @private
     * @property tileWidth {number}, пикселы
     */
    private tileWidth: number = 256;

    /**
     * Высота тайла
     * @private
     * @property tileHeight {number}, пикселы
     */
    private tileHeight: number = 256;

    /**
     * Размер тайла
     * @private
     * @property _tileSize {Point} (ширина, высота), пикселы
     */
    private _tileSize = new PixelPoint( 256, 256 );


    /**
     * Диапазон номеров столбцов текущего уровня приближения (zoom)
     * @private
     * @property limitX {number[]}
     */
    private limitX: number[] = [];

    /**
     * Элемент рисования графики
     * @private
     * @property _canvas {HTMLCanvasElement}
     */
    private _canvas: HTMLCanvasElement | null = null;

    /**
     * Габариты слоя (uperconer,lowerconer), номера тайлов
     * @private
     * @property bounds {SimpleJson<any>}, { 'colls': [], 'rows': [] }
     */
    private bounds: SimpleJson<any> = {};

    /**
     * Период обновления тайлов
     * @private
     * @property updateInterval {number}, msec
     */
    private readonly updateInterval = 250;

    /**
     * Время обновления тайлов
     * @private
     * @property updatetime {Date}, msec
     */
    private updatetime: number = 0;

    /**
     * Признак загрузки рисунков
     * @private
     * @property _loading {boolean}
     */
    private _loading: boolean = false;

    /**
     * Признак обновления тайлов
     * @private
     * @property _flag {boolean}
     */
    private _flag: boolean = false;
    private _revokeUrl: any[] = [];

    /**
     * Пустое изображение тайла
     * @private
     * @property errorImage {string}
     */
    readonly errorImage = GWTK.imgEmpty;

    /**
     * Признак использования XMLHttpRequest для получения изображений
     * @private
     * @property usexhr {boolean}
     * (Если сервер тайлов не поддерживает CORS запросы, XMLHttpRequest не используется)
     */
    private usexhr: boolean = true;

    /**
     * Признак протокола TMS
     * @private
     * @property isTMS {boolean}
     */
    private isTMS: boolean = false;

    /**
     * Признак прерывания загрузки рисунков
     * @private
     * @property _canselLoading {boolean}
     */
    private _canselLoading: boolean = false;

    /**
     * @constructor TileLayer
     * @param map {GwtkMap} экземпляр карты
     * @param layerdescription {GwtkLayerDescription} параметры слоя
     */
    constructor( map: GwtkMap, layerdescription: GwtkLayerDescription ) {

        super( map, layerdescription );

        if ( typeof this.options == 'undefined' ) {

            const text = this.map.translate( 'Map layer creation error' ) + '.' + this.map.translate( 'Not defined a required parameter Options' ) + '.';

            this.map.writeProtocolMessage( { text, type: LogEventType.Error } );
            throw Error( text );
        }


        this.tilematrixset = this.options.tilematrixset || this.map.options.tilematrixset;

        // размер тайла
        const Translate = TranslateList.getItem( this.tilematrixset );
        if ( !Translate ) {
            throw Error( 'Translate object not found' );
        }

        const tileMatrix = Translate.getTileMatix();
        if ( !tileMatrix ) {
            throw Error( 'tileMatrix object not found' );
        }

        this.server = GWTK.Util.getServerUrl( this.options.url );

        this.tileMatrix = tileMatrix;

        this.init();

        this.tileStock = [];

        this._canvas = null;

        this._revokeUrl = [];

        this._listIndex = -1;

        this.usexhr = this.testCORS();
    }

    /**
     * Название слоя
     * @property name
     * @returns {string} название слоя
     */
    get name() {
        return this.alias;
    }

    /**
     * Получить размер тайла
     * @property tileSize
     * @returns { Point } размер тайла
     * @public
     */
    get tileSize() {
        return this._tileSize;
    }

    set tileSize( size: PixelPoint ) {
        this._tileSize = size;
        this.tileHeight = size.y;
        this.tileWidth = size.x;
    }

    /**
     * Получить канву
     * @property canvas
     * @returns HTMLCanvasElement
     * @public
     */
    get canvas() {
        return this._canvas;
    }

    /**
     * Инициализировать
     * @method init
     * @private
     */
    init() {
        if ( !this.map ) return;
        this.tileHeight = this.tileMatrix.Ogc.TileSize;
        this.tileWidth = this.tileMatrix.Ogc.TileSize;
        this._tileSize = new PixelPoint( this.tileWidth, this.tileHeight );
    }

    /**
     * Получить элемент контейнера слоя
     * @method getContainer
     * @returns HTMLElement
     * @public
     */
    get getContainer(): HTMLDivElement | undefined {
        return this.layerContainer;
    }

    /**
     * Создать контейнер слоя
     * @method createContainer
     * @returns HTMLElement
     * @private
     */
    private createContainer() {
        const elem = document.getElementById( 'div_' + this.xId );
        if ( elem ) {
            return elem;
        }
        // Создаем контейнер слоя
        this.layerContainer = document.createElement( 'div' );
        this.layerContainer.id = 'div_' + this.xId;
        this.layerContainer.className = 'gwtk-tiles';
        return this.layerContainer;
    }

    /**
     * Создать канву
     * @method createCanvas
     * @private
     */
    private createCanvas() {
        if ( this.map ) {
            const canvas = this.map._getCanvas();
            if ( canvas ) {
                this._canvas = canvas;
            }
        }
    }

    /**
     * Идентификатор для xml-rpc
     * @property _idLayerXml
     * @returns { string } оригинальный идентификатор
     * @public
     */
    get _idLayerXml() {
        return GWTK.Util.decodeIdLayer( this.idLayer );
    }

    /**
     * Рисовать тайл
     * @method drawTile
     * @param tile { Object } объект тайла
     * @param offset { Point } пикселы начала рисунка (left,top в матрице)
     * @param context { Object } 2D контекст рисования карты, CanvasRenderingContext2D
     * @param origin { Point } точка отсчета, пикселы
     * @protected
     */
    protected drawTile( tile: TileItem, offset: PixelPoint, context: CanvasRenderingContext2D, origin?: PixelPoint ) {
        if ( typeof tile !== 'object' ) return 0;

        const begin = offset;                                    // left top пикселы начала в окне
        let tilePixels = tile.coords ? tile.coords.clone() : undefined;
        if ( !tilePixels ) return 0;
        tilePixels = tilePixels.multiply( this.tileSize );         // left top пикселы тайла
        if ( !tilePixels ) return 0;
        let delta = tilePixels.subtract( begin );
        delta.ceil( delta );
        let sx = 0,
            sy = 0,
            sw = tile.el.width,
            sh = tile.el.height,
            dw = this.tileSize.x,
            dh = this.tileSize.y,
            x = delta.x,
            y = delta.y,
            kx = sw / dw,
            ky = sh / dh;
        if (tilePixels.x < begin.x) {
            sx = Math.abs(delta.x) * kx;
            sw -= sx;
            dw -= sx / kx;
            x = 0;
        }
        if (tilePixels.y < begin.y) {
            sy = Math.abs(delta.y) * ky;
            sh -= sy;
            dh -= sy / ky;
            y = 0;
        }
        if (typeof origin !== 'undefined') {
            x += origin.x;
            y += origin.y;
        }
        if (dw < 0) {
            return 0;
        }
        let res = 1;
        try {
            context.globalAlpha = this.opacityAlpha;
            context.drawImage(tile.el, sx, sy, sw, sh, x, y, dw, dh);
        } catch (error) {
            res = 0;
        }
        return res;
    }

    /**
     * Рисовать слой
     * @method drawLayer
     * @param bounds { PixelBounds } габариты рисунка в пикселах матрицы текущего zoom
     * @param begin { Point } пикселы начала рисунка (left,top)
     * @param clear { boolean } признак очистки холста,`true` - очистить
     * @param topleft { Point } точка отсчета, пикселы
     * @public
     */
    drawLayer( bounds: PixelBounds, begin: PixelPoint, clear: boolean, topleft: PixelPoint ) {
        if ( !bounds || !this.map || !this.canvas ) return;

        let count = 0;

        var range = this.pixelBoundsToTileRange( bounds );

        const ctx = this.canvas.getContext( '2d' );

        if ( !ctx || typeof range.min == 'undefined' || typeof range.max == 'undefined' ) {
            return;
        }
        if ( clear ) {
            ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );
        }

        for ( let j = range.min.y; j <= range.max.y; j++ ) {
            for ( let i = range.min.x; i <= range.max.x; i++ ) {
                const z = this.tileszoom || this.map.getZoom();
                const coords = new TileCoord( i, j, z );
                if ( !this.isValidTile( coords ) ) {
                    continue;
                }
                const tile = this.tiles[ this.getTileKey( coords ) ];
                if ( tile && tile.el.classList.contains( 'tile-loaded' ) ) {
                    this.drawTile( tile, begin, ctx, topleft );
                    count++;
                }
            }
        }

        // const keys: string [] = [];
        // for ( let key in this.tiles ) {
        //     keys.push( key );
        // }
        //console.log('drawLayer', count, range, keys);
    }

    /**
     * Получить base64 слоя.
     * @method getLayerDataUrl
     * @public
     * @async
     */
    async getLayerDataUrl(): Promise<string> {
        if (!this._canvas) {
            return '';
        }

        const canvasBackup = this._canvas;
        this._canvas = document.createElement('canvas');
        const canvas = this._canvas;
        canvas.width = canvasBackup.width;
        canvas.height = canvasBackup.height;
        const bounds = this.map.getPixelMapBounds();
        const begin = new PixelPoint(bounds.min.x, bounds.min.y);
        this.drawLayer(bounds, begin, false, new PixelPoint());
        this._canvas = canvasBackup;
        return canvas.toDataURL();
    }

    /**
     * Получить общее количество тайлов в окне
     * @method getTotalTileCount
     * @returns { number } общее количество тайлов
     * @protected
     */
    protected getTotalTileCount(): number {
        const count = this.getTileCount();
        return (count.cols * count.rows);
    }

    /**
     * Получить количество строк и колонок тайлов в окне
     * @method getTileCount
     * @returns { Point } количество строк (y) и колонок (x) тайлов
     * @protected
     */
    getTileCount() {
        const size = this.map.getSize(),                               // размер карты
            tileSize = this.tileSize;                               // размер тайла
        this.windowWidth = Math.floor( size.x );
        this.windowHeight = Math.floor( size.y );
        this.rowCount = Math.ceil( size.y / tileSize.y );                // строк тайлов в окне
        this.collCount = Math.ceil( size.x / tileSize.x );               // колонок тайлов в окне
        return { cols: this.collCount, rows: this.rowCount };
    }

    /**
     * Получить размер матрицы тайлов для масштаба zoom
     * @method getGlobalPixelSize
     * @returns { PixelPoint } габариты матрицы тайлов, пикселы
     */
    protected getGlobalPixelSize( zoom: number ) {
        return this.map.tileMatrix.globalTileMatrixCount( zoom );
    }


    /**
     * Получить габариты фрагмента в пикселах матрицы для масштаба zoom
     * @method geo2PixelBounds
     * @param center { Array }, координаты центра, градусы, [широта, долгота]
     * @param zoom { Number } масштабный уровень, номер матрицы тайлов
     * @return { PixelBounds } {min:{x,y}, max:{x,y}}, габариты фрагмента в пикселах матрицы
     * @private
     */
    private geo2PixelBounds( center?: GeoPoint, zoom?: number ) {
        const mapzoom = zoom !== undefined ? zoom : this.map.getZoom();
        let pixelCenter: PixelPoint;
        if ( center ) {
            pixelCenter = this.map.geoToPixel( center, mapzoom );
        } else {
            pixelCenter = this.map.getCenterPixel( mapzoom );
        }
        const half = this.map.getSize().divideBy( 2 );

        return new PixelBounds( pixelCenter.subtract( half ).floor(), pixelCenter.add( half ).floor() );
    }


    /**
     * Обработка события окончания перемещения карты
     * @method onMapDragEnd
     * @public
     */
    onMapDragEnd() {
        this.updateView();
    }

    /**
     * Обработка при добавлении слоя в карту
     * @method onAdd
     * @public
     */
    onAdd() {
        if ( !this.map ) return;
        const center = this.map.getCenterPixel(),
            zoom = this.map.getZoom();
        this.tiles = [];                                       // текущие тайлы
        this.setOptions();                                     // параметры слоя
        this.createCanvas();                                   // холст
        this.setView( center, zoom, true );                      // параметры отображения
        this.setBounds();                                      // установить габариты слоя из параметров

        if ( this.options.hidden )
            this.hide();

        this.setOpacity( this.initOpacity() );

        this.map.layers.push( this );

        this.map.trigger( { type: 'layerlistchanged', maplayer: { 'id': this.xId, 'act': 'add' } } );

        this.onMapDragEnd = this.onMapDragEnd.bind( this );

        this.map.on( 'mapdragend', this.onMapDragEnd );
    }

    /**
     * Обработка при удалении слоя
     * @method onRemove
     * @public
     */
    onRemove() {
        this._removeAllTiles;

        this.removeObjectUrl();

        if ( this.layerContainer ) {
            //document.removeChild(this.layerContainer);
            this.layerContainer = undefined;
        }

        // удалить признак загрузки легенды в локальном хранилище
        GWTK.Util.removeLocalKey( 'legend_' + this.xId );

        // удалить легенду
        GWTK.Util.removeLegend( this.xId, this.map );

        // удалить классификатор
        // if ( this.map.classifiers ) {
        //     this.map.classifiers.remove( this );
        // }

        this.map.off( 'mapdragend', this.onMapDragEnd );

        this.map.trigger( { type: 'layerlistchanged', maplayer: { 'id': this.xId, 'act': 'remove' } } );

        this.removeTileStock();
    }

    hasLegend() {
        return false;
    }

    /**
     * Освободить кэш тайлов
     * @method removeTileStock
     * @private
     */
    private removeTileStock() {
        if ( this.tileStock.length == 0 ) {
            return;
        }
        let i, len;
        for ( i = 0; len = this.tileStock.length, i < len; i++ ) {
            this.tileStock[ i ].remove();
        }
        while ( this.tileStock.length > 0 ) {
            delete this.tileStock[ 0 ];
            this.tileStock.splice( 0, 1 );
        }

        this.tileStock = [];
    }

    /**
     * Показать слой
     * @method show
     * @public
     */
    show() {
        if ( this._visible ) {
            return;
        }
        this.visible = true;
        this.update();
    }

    /**
     * Скрыть слой
     * @method hide
     * @public
     */
    hide( notshow?: boolean ) {
        if ( !this._visible ) {
            return;
        }
        this.visible = false;
        if ( notshow ) return;
        this.map.onRefreshMap();
    }

    /**
     * Преобразовать габариты фрагмента в пикселах матрицы в диапазон номеров тайлов
     * @method pixelBoundsToTileRange
     * @param bounds {PixelBounds}, габариты фрагмента в пикселах матрицы
     * @return {PixelBounds} {Point, Point}, Point.x - номер колонки, Point.y - номер строки
     * @public
     */
    pixelBoundsToTileRange( bounds: PixelBounds ) {
        let pixBounds = bounds;
        const tileSize = this._tileSize;
        let min = pixBounds.min.divide( tileSize );
        let max = pixBounds.max.divide( tileSize );
        max.ceil( max );
        return new PixelBounds( min.floor(), max.subtract( new PixelPoint( 1, 1 ) ) );
    }

    /**
     * Установить параметры слоя
     * @method setOptions
     * @protected
     */
    protected setOptions() {
        if ( !this.options ) return;
        this.isTMS = !!this.options.tms;
        this._listIndex = 0;
    }

    /**
     * Установить глобальные параметры матрицы тайлов текущего уровня zoom
     * @method setGlobals
     * @private
     */
    private setGlobals() {
        const zoom = this.map.getZoom();
        const count = this.tileMatrix.globalTileMatrixCount( zoom );
        this.collTotal = Math.round( count.x );
        this.rowTotal = Math.round( count.y );
        this.limitX = [0, this.collTotal];
    }

    /**
     * Установить вид
     * @method setView
     * @param center {Point} координаты центра
     * @param zoom {number} масштабный уровень, номер матрицы тайлов
     * @param update {boolean} признак обновления
     */
    private setView( center: PixelPoint, zoom: number, update: boolean ) {

        if ( !this.map ) return;

        const tilezoom = this.checkViewZoom( zoom ) ? zoom : -1;             // новый зум

        if ( update || tilezoom !== this.tileszoom ) {

            this.tileszoom = tilezoom;                                     // текущий масштабный уровень

            if ( this.tileszoom !== -1 ) {
                this.setBounds();
            }

            if ( this._canselLoading ) {
                this.canselLoading();                                         // отменить текущую загрузку данных
            }

            this.setGlobals();                                               // параметры матрицы тайлов для текущего зума

            if ( tilezoom !== -1 ) {
                this.updateView( center );
            } else {
                for ( let key in this.tiles ) {
                    this.tiles[ key ].current = false;
                }
                this.resetTiles();
            }
        }
    }

    /**
     * Обновить с инициализацией
     * @method update
     * @public
     */
    update() {
        const mapzoom = this.map.getZoom(),
            size = this.map.getSize(),
            mapcenter = this.map.getCenterPixel();

        if ( this.tileszoom != -1 || this.tileszoom != mapzoom ) {
            for ( let key in this.tiles ) {
                this.tiles[ key ].current = false;
            }
            this._canselLoading = true;
            this.setView( mapcenter, mapzoom, true );
        } else {
            if ( this.windowWidth !== Math.floor( size.x ) || this.windowHeight !== Math.floor( size.y ) ) {
                this._canselLoading = true;
                this.setView( mapcenter, mapzoom, true );
            } else {
                this.updateView( mapcenter );
            }
        }

        return;
    }

    /**
     * Обновить вид
     * @method _update
     * @param centerpoint { Point } координаты центра фрагмента, пикселы матрицы
     * @public
     */
    updateView( centerpoint?: PixelPoint ) {

        if ( !this.map ) return;

        this.updatetime = +new Date();                                      // время начала обновления тайлов

        this.getTileCount();

        if ( this.tileszoom == -1 ) {
            return;
        }

        let center = centerpoint ? centerpoint : this.map.getCenterPixel();

        center.floor( center );

        let bounds = this.getTilePixelBounds( center );
        if ( !bounds || !bounds.min || !bounds.max ) {
            return;
        }

        let tileRange = this.pixelBoundsToTileRange( bounds );                // диапазон отображаемых номеров тайлов (строк, столбцов)
        //if (!tileRange.min || !tileRange.max) { return; }

        let tileCenter = tileRange.getCenter();
        if ( tileCenter ) {
            tileCenter = tileCenter.ceil( tileCenter );                                 // центральный тайл
        } else {
            return;
        }

        let list: any = [],                                                  // список координат тайлов
            count = 0;

        for ( let key in this.tiles ) {
            const c = this.tiles[ key ].coords;
            if ( c.z !== this.tileszoom || !this.isValidTile( c ) ) {
                this.tiles[ key ].current = false;
                this.tiles[ key ].el.id = '';
            }
        }

        for ( let j = tileRange.min.y; j <= tileRange.max.y; j++ ) {
            for ( let i = tileRange.min.x; i <= tileRange.max.x; i++ ) {
                let coord = new TileCoord( i, j, this.tileszoom );
                const key = this.getTileKey( coord );
                let tile = this.tiles[ key ];
                if ( tile ) {
                    tile.current = true;
                    coord = this.limitCoords( coord );
                    if ( tile.list_index !== undefined ) {
                        this._listIndex = tile.list_index;
                    }
                    tile.el.id = key;
                    const src = this.getTileUrl( coord );
                    if ( tile.src !== src ) {
                        tile.src = src;
                        tile.loaded = undefined;
                        this.sendRequest( tile );
                    }
                    count++;
                } else {
                    list.push( coord );
                    if ( i < 0 ) {
                        list.push( new TileCoord( i + this.collTotal, j, this.tileszoom ) );
                    }
                }
            }
        }
        if ( count == 0 && tileRange.min.x < 0 ) {              // если -180, заполним всю матрицу
            for ( let j = Math.max( tileRange.min.y, 0 ); j <= tileRange.max.y; j++ ) {
                for ( let i = tileRange.max.x + this.collTotal; i < this.collTotal; i++ ) {
                    let coord = new TileCoord( i, j, this.tileszoom );
                    const key = this.getTileKey( coord );
                    const tile = this.tiles[ key ];
                    if ( !tile ) {
                        list.push( coord );
                    }
                }
            }
        }

        list.sort( function ( a: TileCoord, b: TileCoord ) {
            return a.distanceTo( tileCenter ) - b.distanceTo( tileCenter );
        } );

        if ( list.length == 0 ) {
            if ( !count ) {
                this._removeAllTiles();
            }
            return;
        }

        this._loading = true;
        for ( let i = 0; i < list.length; i++ ) {
            this.addTile( list[ i ] );
        }

    }

    /**
     * Добавить тайл
     * @method addTile
     * @param coords { TileCoord } координаты тайла, {x:столбец,y:строка,z:зум}
     * @returns {HTMLImageElement} HTML элемент тайла, img
     * @private
     */
    private addTile( coords: TileCoord ) {
        const key = this.getTileKey( coords ),
            img = this.createTile( coords );

        this._initTile( img );

        img.setAttribute( 'id', key );

        const url = this.getTileUrl( this.limitCoords( coords ) ),
            index = this._listIndex;

        this.swapUrls();

        const tile = { el: img, coords: coords, current: true, src: url, xhr: false, list_index: index };

        this.tiles[ key ] = tile;

        this.sendRequest( tile );

        return img;
    }

    /**
     * Создать тайл
     * @method createTile
     * @param coords { Point } координаты тайла, {x:столбец,y:строка,z:зум}
     * @return { HTMLImageElement } HTML элемент тайла, img
     * @private
     */
    private createTile( coords: TileCoord ) {
        let elem: HTMLImageElement;
        if ( this.tileStock.length > 0 ) {
            elem = this.tileStock.pop();                           // берем элемент из кэша
        } else {
            elem = document.createElement( 'img' );                   // создаем новый элемент
        }

        this._initTile( elem );

        elem.onload = () => {
            const key = elem.getAttribute( 'id' );
            const coord = key ? this.getTileCoords( key ) : coords;
            this.onLoadTile( elem, coord );
        };

        elem.onerror = () => {
            this.onErrorTile( coords, elem );
        };

        return elem;
    }

    /**
     * Обработчик успешной загрузки рисунка элемента тайла
     * @method onLoadTile
     * @param img { HTMLImageElement } HTML элемент тайла
     * @param coords { TileCoord } координаты тайла
     * @private
     */
    private onLoadTile( img: HTMLImageElement, coords: TileCoord ) {
        const key = img.getAttribute( 'id' );
        const coord = key ? this.getTileCoords( key ) : coords;
        this._tileReady( coord, false, img );
    }

    /**
     * Обработчик ошибки загрузки рисунка тайла
     * @method onErrorTile
     * @private
     */
    private onErrorTile( coords: TileCoord, img: HTMLImageElement ) {
        if ( img.getAttribute( 'src' ) !== this.errorImage ) {
            img.src = this.errorImage;
        }
        this._tileReady( coords, true, img );
    }

    /**
     * Обработчик загрузки рисунка тайла
     * @method _tileReady
     * @param coords { TileCoord } координаты тайла
     * @param err { boolean } признак ошибки
     * @param elem { HTMLImageElement } HTML элемент тайла
     * @private
     */
    private _tileReady( coords: TileCoord, err: boolean, elem: HTMLImageElement ) {

        const key = this.getTileKey( coords );
        const tile = this.tiles[ key ];
        if ( !tile ) {
            elem.classList.add( 'tile-loaded' );
            return;
        }
        tile.loaded = +new Date();
        if ( !err ) {
            elem.classList.add( 'tile-loaded' );
        } else {
            elem.classList.remove( 'tile-loaded' );
        }

        if ( this.areAllLoaded() ) {
            this._loading = false;
            this._flag = true;
            this.resetTiles();
        } else {
            if ( typeof (this.updatetime) !== 'undefined' ) {
                if ( tile.loaded - this.updatetime > this.updateInterval && this._loading ) {
                    this.map.onRefreshMap( { 'cmd': 'draw', 'id': this.xId } );
                }
            }
        }
    }

    /**
     * Переустановить тайлы слоя
     * @method resetTiles
     * @private
     */
    private resetTiles() {
        if ( !this.map ) {
            return;
        }
        if ( this._flag && this.visible ) {
            this._flag = false;
            this.map.onRefreshMap( { 'cmd': 'draw', 'id': this.xId } );
        }
        let tile;
        const zoom = this.map.getZoom();
        if ( zoom > this.options.maxzoomview || zoom < this.options.minzoomview ) {
            this._removeAllTiles();
            this.removeObjectUrl();
            return;
        }
        for ( let key in this.tiles ) {
            tile = this.tiles[ key ];
            tile.hold = tile.current;
        }
        for ( let key in this.tiles ) {
            if ( !this.tiles[ key ].hold ) {
                this._removeTile( key );
            }
        }
    }

    /**
     * Прервать загрузку рисунков
     * @method canselLoading
     * @private
     */
    private canselLoading() {
        for ( let i in this.tiles ) {
            if ( this.tiles[ i ].coords.z !== this.tileszoom ) {
                const tile = this.tiles[ i ].el;
                tile.onload = GWTK.Util.falseFunction;
                tile.onerror = GWTK.Util.falseFunction;
                if ( !tile.current ) {
                    this.tiles[ i ].xhr && this.tiles[ i ].xhr.abort();
                    BrowserService.clearObjectURL( tile.src );
                    tile.src = this.errorImage;
                    this.tileStock.push( tile );
                    delete this.tiles[ i ];
                }
            }
        }
    }

    /**
     * Удалить тайл по ключу
     * @method _removeTile
     * @param key {string} ключ тайла в списке тайлов
     * @private
     */
    private _removeTile( key: string ) {
        const tile = this.tiles[ key ];
        if ( !tile ) {
            return;
        }
        this._revokeUrl.push( tile.el.src );
        tile.el.setAttribute( 'src', this.errorImage );
        tile.el.setAttribute( 'id', '' );
        this.tileStock.push( tile.el );
        //tile.el.remove();
        delete this.tiles[ key ];
    }

    /**
     * Удалить все тайлы слоя
     * @method _removeAllTiles
     * @private
     */
    private _removeAllTiles() {
        for ( let key in this.tiles ) {
            this._removeTile( key );
        }
        this.tiles = [];
    }

    /**
     * Инициализировать тайл
     * @method _initTile
     * @param elem { HTMLImageElement } элемент тайла
     * @private
     */
    private _initTile( elem: HTMLImageElement ) {
        elem.classList.add( 'gwtk-tile-elem' );
        const tileSize = this.tileSize;
        elem.style.width = tileSize.x + 'px';
        elem.style.height = tileSize.y + 'px';
        elem.onselectstart = GWTK.Util.falseFunction;
        elem.onmousemove = GWTK.Util.falseFunction;
        elem.alt = '';
    }

    /**
     * Нормализовать координаты тайла с ограничением по габаритам
     * @method limitCoords
     * @param coords { TileCoord } координаты тайла в матрице, {x:колонка, y:строка, z:zoom}
     * @returns { TileCoord } координаты тайла с учетом повтора в окне
     * @private
     */
    private limitCoords( coords: TileCoord ) {
        return new TileCoord( this.limitX ?
            GWTK.Util.wrapNum( coords.x, this.limitX ) :
            coords.x, coords.y, coords.z );
    }

    /**
     * Проверить загрузку рисунков тайлов
     * @method areAllLoaded
     * @returns { boolean } `true` - загружены все рисунки
     * @private
     */
    private areAllLoaded(): boolean {
        for ( let key in this.tiles ) {
            if ( !this.tiles[ key ].loaded ) {
                return false;
            }
        }
        return true;
    }

    /**
     * Получить ключ тайла по координатам
     * @method getTileKey
     * @param coords { TileCoord } координаты тайла в матрице
     * @protected
     */
    private getTileKey( coords: TileCoord ) {
        return coords.x + '__' + coords.y + '__' + coords.z;
    }


    /**
     * Получить координаты тайла по ключу
     * @method getTileCoords
     * @returns { TileCoord } координаты тайла в матрице
     * @private
     */
    private getTileCoords( key: string ) {
        const arr = key.split( '__' );
        return new TileCoord( +arr[ 0 ], +arr[ 1 ], +arr[ 2 ] );
    }

    /**
     * Получить габариты тайла по ключу
     * @method getTileBounds
     * @returns {GWTK.latLngBounds} геогабариты тайла
     * @private
     */
    private getTileBounds( key: string ) {
        return this.tileCoordToBounds( this.getTileCoords( key ) );
    }

    /**
     * Преобразовать координаты тайла в габариты
     * @method tileCoordToBounds
     * @param coords {TileCoord} {x:столбец, y:строка}
     * @returns {GWTK.latLngBounds} геогабариты тайла
     * @private
     */
    private tileCoordToBounds( coords: TileCoord ) {
        const tileSize = new PixelPoint( this.tileWidth, this.tileHeight );
        const tl = coords.multiply( tileSize );
        if ( !tl ) return;
        const br = tl.add( tileSize ),
            nw = this.map.pixelToGeo( tl, coords.z ),
            se = this.map.pixelToGeo( br, coords.z );
        return GWTK.latLngBounds( [nw, se] );
    }

    /**
     * Получить габариты отображения для центра окна
     * @method getTilePixelBounds
     * @param center {Point} координаты центра {x,y}, пикселы от начала координат матрицы текущего zoom
     * @returns {PixelBounds} габариты, {min:Point, max:Point}, пикселы матрицы текущего zoom
     */
    private getTilePixelBounds( center?: PixelPoint ) {
        if ( !this.map ) return;
        const pixcenter = center ? center : this.map.getCenterPixel(),
            half = this.map.getSize().divideBy( 2 );
        return (new PixelBounds( pixcenter.subtract( half ), pixcenter.add( half ) ));
    }

    /**
     * Проверить тайл
     * @method isValidTile
     */
    private isValidTile( coords: PixelPoint ) {
        return this.checkBounds();
    }

    /**
     * Установить габариты видимых тайлов
     * (диапазон рядов, диапазон колонок)
     * @method setBounds
     * @returns { Object } { 'colls': [], 'rows': [] };
     */
    private setBounds() {
        this.bounds = {};
        if ( !this.options ) return;
        if ( this.options.bbox.length != 4 ) return;

        // SW
        let plane = new GeoPoint( this.options.bbox[ 1 ], this.options.bbox[ 0 ], 0, this.map.ProjectionId ).toMapPoint();
        if ( !plane ) {
            return;
        }
        const upPos = this.map.tileMatrix.getTileNumberByPoint( this.map.options.tilematrix, plane );
        // NE
        plane = new GeoPoint( this.options.bbox[ 3 ], this.options.bbox[ 2 ], 0, this.map.ProjectionId ).toMapPoint();
        if ( !plane ) {
            return;
        }
        const lowPos = this.map.tileMatrix.getTileNumberByPoint( this.map.options.tilematrix, plane );

        if ( !lowPos || !upPos ) {
            return;
        }
        this.bounds = { 'colls': [], 'rows': [] };

        if ( upPos.col < lowPos.col )                          // диапазон колонок
            this.bounds.colls = [upPos.col, lowPos.col];
        else
            this.bounds.colls = [lowPos.col, upPos.col];

        if ( upPos.row < lowPos.row )                          // диапазон рядов
            this.bounds.rows = [upPos.row, lowPos.row];
        else
            this.bounds.rows = [lowPos.row, upPos.row];
    }

    /**
     * Проверить габариты тайлов
     * @method checkBounds
     * @returns { boolean } true/false
     */
    checkBounds(): boolean {

        if ( this.bounds.colls == undefined ) return true;

        if ( this.tileszoom == -1 ) {
            return false;
        }

        const center = this.map.getCenterPixel();
        center.floor();
        const bounds = this.getTilePixelBounds( center );
        if ( !bounds ) return true;
        const tileRange = this.pixelBoundsToTileRange( bounds );
        if ( !tileRange || !tileRange.min || !tileRange.max ) {
            return true;
        }
        const colls = [tileRange.min.x, tileRange.max.x];
        const rows = [tileRange.min.y, tileRange.max.y];

        if ( colls[ 1 ] < this.bounds.colls[ 0 ] ||
            colls[ 0 ] > this.bounds.colls[ 1 ] ||
            rows[ 1 ] < this.bounds.rows[ 0 ] ||
            rows[ 0 ] > this.bounds.rows[ 1 ] ) {
            return false;
        }

        return true;
    }

    /**
     * Сменить текущую ссылку для тайлов
     * @method swapUrls
     */
    private swapUrls() {
        if ( this.urlsList.length < 2 ) {
            return;
        }
        this._listIndex += 1;
        this._listIndex >= this.urlsList.length ? this._listIndex = 0 : this._listIndex;
    }

    /**
     * Получить ссылку для тайла по значению строки, столбца и масштаба
     * @method getTileUrl
     * @param coords {TileCoord} координаты тайла, x-номер строки, y-номер столбца, z - zoom
     * @returns {string} строка запроса рисунка тайла
     */
    getTileUrl( coords: TileCoord ) {
        return this.getFileName( coords.x, coords.y, coords.z );
    }

    /**
     * Получить ссылку для тайла по значению строки, столбца и масштаба
     * @method getFileName
     * @param r {Number}, номер строки матрицы тайлов
     * @param c {Number}, номер столбца матрицы тайлов
     * @param z {Number}, масштабный уровень
     */
    private getFileName( c: number, r: number, z: number ) {
        const zoom = z;
        if ( this.bounds.colls !== undefined ) {
            if ( r < this.bounds.rows[ 0 ] || r > this.bounds.rows[ 1 ] || c < this.bounds.colls[ 0 ] || c > this.bounds.colls[ 1 ] )
                return this.errorImage;
        } else if ( r < 0 || r >= this.rowTotal ) {
            return this.errorImage;
        }
        if ( !this.visible || !this.checkViewZoom( zoom ) ) {
            return this.errorImage;
        }
        let row = r;
        if ( this.isTMS ) {
            row = this.tmsRow( { 'row': r, 'z': zoom } );
        }
        let src = this.urlsList[ this._listIndex ].replace( /%y/, row.toString() );
        src = src.replace( /%x/, c.toString() );
        src = src.replace( /%z/, zoom.toString() );
        src = src.replace( /%tilematrixset/, encodeURIComponent( this.tilematrixset ) );
        return src;
    }

    /**
     * Значение непрозрачности
     * @property opacityAlpha
     * @returns {number} значение непрозрачности,
     * число в диапазоне [0.0,.. 1.0], 0 - полная непрозрачность
     */
    get opacityAlpha() {
        return parseFloat( this.getOpacityCss() );
    }

    /**
     * Установить уровень непрозрачности изображения
     * @method setOpacity
     * @param newvalue { number } значение непрозрачности,
     * число в диапазоне [0.0,.. 1.0], 0 - полная непрозрачность
     * @param show { boolean } признак обновления изображения
     */
    setOpacity( newvalue: number | string, show?: boolean ) {
        const opacity = typeof newvalue == 'string' ? parseFloat( newvalue ) : newvalue;
        super.setOpacity( opacity );
        if ( this.visible && show )
            this.map.onRefreshMap( { 'type': 'refreshmap', 'cmd': 'draw', 'id': this.xId } );
    }


    /**
     * Получить номер строки сервиса TMS
     * @method tmsRow
     * @param param {Object} json, param.row - номер строки матрицы, param.z - масштаб
     * @returns {Number} номер строки сервиса TMS, при ошибке возвращает `-1`
     */
    tmsRow( param: { 'row': number, 'z': number } ) {
        if (this.bounds.rows !== undefined && (param.row < this.bounds.rows[0] || param.row > this.bounds.rows[1])) {
            return -1;
        }
        return Math.pow( 2, param.z ) - param.row - 1;
    }

    /**
     * Запросить рисунок тайла
     * @method sendRequest
     * @param tile {JSON} описание тайла из массива tiles
     * @private
     */
    private sendRequest( tile: SimpleJson<any> ) {

        if ( typeof tile.el === 'undefined' ) {
            return;
        }
        if ( tile.src == this.errorImage ) {                        // запрос не требуется
            this.onErrorTile( tile.coords, tile.el );
            return;
        }
        if ( !this.usexhr ) {
            tile.el.src = tile.src;
            return;
        }

        const headers = this.getRequestHeaders( this.map );

        if ( tile.xhr && tile.xhr.url !== tile.src ) {
            tile.xhr.abort();
        } else {
            tile.xhr = new XMLHttpRequest();
        }
        const xhr = tile.xhr;

        xhr.tkey = this.getTileKey( tile.coords );                 // ключ тайла

        xhr.onerror = () => {
            this.onErrorXhr( xhr.tkey );
        };

        xhr.onload = () => {
            if ( xhr.response.type.search( 'image' ) == -1 ) {
                this.onErrorXhr( xhr.tkey );
            } else {
                this.onLoadXhr( xhr.response, xhr.tkey );
            }
        };

        xhr.onloadstart = function () {
            this.responseType = 'blob';
        };

        xhr.open( 'GET', tile.src, true );

        if ( headers.withCredentials ) {
            // внешняя авторизация на сервисе или pam
            if (this.map.options.authheader) {
                xhr.setRequestHeader(AUTH_HEADER, this.map.options.authheader);
            }
        } else if ( headers.token.length > 0 ) {
            xhr.setRequestHeader( GWTK.AUTH_TOKEN, headers.token );        // авторизация токеном
        }

        xhr.send();
    }


    /**
     * Обработчик ошибки запроса рисунка
     * @method onErrorXhr
     * @private
     */
    private onErrorXhr( key: string ) {
        const tile = this.tiles[ key ];
        if ( tile ) {
            this.onErrorTile( tile.coords, tile.el );
        }
    }

    /**
     * Загрузка рисунка тайла
     * @method onLoadXhr
     * @param response { Blob } рисунок
     * @param key {string} ключ тайла
     * @private
     */
    private onLoadXhr( response: Blob, key: string ) {
        const src = BrowserService.makeObjectURL( response );
        const tile = this.tiles[ key ];
        if ( !tile ) {

            const text = this.map.translate( 'Tile not found' ) + ': ' + key;

            this.map.writeProtocolMessage( { text, type: LogEventType.Error } );
            return;
        }
        if ( tile.el.src && tile.el.src.indexOf( 'blob:http:' ) > -1 ) {
            this._revokeUrl.push( tile.el.src );
        }
        tile.el.src = src;
    }


    /**
     * Удалить blob-объекты
     * @method removeObjectUrl
     * @private
     */
    private removeObjectUrl() {
        for ( let k in this._revokeUrl ) {
            if ( this._revokeUrl[ k ] == undefined ) {
                this._revokeUrl.shift();
                continue;
            }
            try {
                BrowserService.clearObjectURL(this._revokeUrl[k]);
                this._revokeUrl.shift();
            } catch (error:unknown) {
                this.map.writeProtocolMessage({
                    text: 'Tile layer Error!',
                    type: LogEventType.Warning,
                    display: false,
                    description: error as string
                });
            }
        }
    }

    /**
     * Проверить сервер
     * @method testCORS
     * @return {boolean} `false`- CORS запросы XMLHttpRequest не поддерживаются
     * @private
     */
    private testCORS() {

        return !this.options.corsNotAllowed;

        // let status = this.testPortals;
        // let src = '';
        // if ( !status ) {
        //     let zoom = this.map.getZoom();
        //     if (this.minZoomView) {
        //         zoom = Math.max(zoom, this.minZoomView);
        //     }
        //     if (this.maxZoomView) {
        //         zoom = Math.min(zoom, this.maxZoomView);
        //     }
        //
        //     const center = this.map.getCenterPixel(zoom);
        //     center.floor();
        //     const bounds = this.getTilePixelBounds( center );
        //     if ( bounds ) {
        //         const tileRange = this.pixelBoundsToTileRange( bounds );
        //         const tileCenter = tileRange.getCenter();
        //         tileCenter.ceil( tileCenter );
        //         let row = tileCenter.y, col=tileCenter.x;
        //         if ( this.options.tms ) {
        //             row = Math.pow( 2, zoom ) - row - 1;
        //         }
        //         const tileCount = this.tileMatrix.globalTileMatrixCount(zoom);
        //         row = Math.max(Math.min(tileCount.y - 1, row), 0);
        //         col = Math.max(Math.min(tileCount.x - 1, col), 0);
        //         src = this.options.url.replace(/%y/, '' + row);
        //         src = src.replace(/%x/, '' + col);
        //         src = src.replace( /%z/, zoom );
        //         src = src.replace( /%tilematrixset/, this.tilematrixset );
        //     }
        //     if ( src.length === 0 ) {
        //         status = true;
        //     }
        // }
        // if ( !status ) {
        //     status = true;
        //     const xhr = new XMLHttpRequest();
        //     xhr.onloadstart = () => xhr.responseType = 'blob';
        //
        //     xhr.open( 'GET', src, false );
        //
        //     if ( this.map.authTypeServer( src ) || this.map.authTypeExternal( src ) ) {
        //         xhr.withCredentials = true;
        //     }
        //
        //     try {
        //         xhr.send();
        //         if (xhr.status !== 200) {
        //             status = false;
        //         }
        //     } catch (error) {
        //         status = false;
        //     }
        // }
        //
        // return status;
    }

    /**
     * Проверить адрес порталов
     * @property testPortals
     * @private
     * @return {boolean} `false`- нет поддержки CORS
     */
    private get testPortals(): boolean {
        let test = false;

        if (this.map.getToken() && this.options.token) {
            test = true;
        }
        if (this.options.gis ||
            this.options.url.indexOf(this.map.options.url) != -1) {
            test = true;
        }
        const server = this.options.url.toLowerCase();
        if (server.includes('openstreetmap.') ||
            server.includes('google.') ||
            server.includes('maps.yandex.') ||
            //server.includes( 'rosreestr.' ) ||
            server.includes('arcgis')) {
            test = true;
        }
        return test;
    }

    /**
     * Признак использования протокола TMS
     * @public
     * @property isTmsLayer {boolean}
     */
    get isTmsLayer() {
        return this.isTMS;
    }

    /**
     * Габариты слоя (uperconer, lowerconer), номера тайлов
     * @public
     * @property bounds {SimpleJson<any>}, { 'colls': [], 'rows': [] }
     */
    get layerBounds() {
        return this.bounds;
    }

    /**
     * Общее количество строк в матрице текущего уровня приближения
     * @public
     * @property rowsTotal {number}
     */
    get rowsTotal() {
        return this.rowTotal;
    }

}
