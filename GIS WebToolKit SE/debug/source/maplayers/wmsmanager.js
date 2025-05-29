/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2023              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Управление WMS-слоями карты                  *
 *                                                                  *
 *******************************************************************/

import RequestServices, { ServiceType } from '~/services/RequestServices';
import { GroupLayer } from '~/maplayers/GroupLayer';
import { LogEventType } from '~/types/CommonTypes';
import SelectedObjectsDrawManager from '~/maplayers/SelectedObjectsDrawManager';
import Utils from '../services/Utils';

if (window.GWTK) {

    GWTK.WmsServerListDescriptor = {
        'serv': '',             // url
        'scene': '',            // id
        'list': []              // элементы WmsElementDescriptor, описание слоя/слоев
    };

    GWTK.WmsElementDescriptor = {
        'id': '',               // id сервиса
        'xId': '',              // id слоя в карте
        'layer': null           // слой
    };

    /**
     * Класс Менеджер WMS-слоев
     * Управление WMS-слоями, отображение, обновление, объединение запросов
     * @class GWTK.WmsManager
     * @constructor GWTK.WmsManager
     * @param map {GWTK.Map} ссылка на карту
     */
    GWTK.WmsManager = function(map) {

        if ( !map ) {
            const text = "GWTK.WmsManager error. " + w2ui.lang("Not defined a required parameter") + " Map.";
            console.log( text );
            this.map.writeProtocolMessage( { text, type: LogEventType.Error } );
            return;
        }
        this.map = map;                             // карта
        this.panel;                                 // контейнер wms изображений
        this.tempContainer;                         // контейнер временных изображений wms
        this.tempCanvas;                            // временные изображения wms
        this.timerDrag = 0;                         // идентификатор таймера
        this._updateInterval = 300;                 // интервал обновления
        this._loading = false;                      // признак выполнения загрузки рисунков
        this._lastdraw = 0;                         // время последнего  рисования, msec
        this.requestNumber = 1;

        this._states = [];                          // массив объектов-состояний запросов
        this.keys = ['current', 'temp'];            // имена состояний

        this.createWmsContainer();                  // создать контейнер wms изображений
        this.createTempContainer();                 // создать контейнер временных изображений
        this.initEvents();

        this.run = Utils.debounce(this.run.bind(this), 50);
    };

    GWTK.WmsManager.prototype = {
            /**
             * Инициализация событий
             * @method initEvents
             */
            initEvents: function() {

                this.onMapDragStart = this.onMapDragStart.bind(this);
                this.onMapDragEnd = this.onMapDragEnd.bind(this);
                this.map.on( { type: 'mapdragend', target: 'map' }, this.onMapDragEnd );
                this.map.on( { type: 'mapdragstart', target: 'map' }, this.onMapDragStart );

            },

            /**
             * Деструктор
             * @method destroy
             */
            destroy: function() {
                this.map.off( 'mapdragstart', this.onMapDragStart );
                this.map.off( 'mapdragend', this.onMapDragEnd );
            },

            /**
             * Создать контейнер wms изображений
             * @method createWmsContainer
             */
            createWmsContainer: function() {
                if (typeof this.panel === 'undefined') {
                    this.panel = document.createElement( 'div' );
                    this.panel.className = 'wms-panel';
	                this.panel.id = 'wms_pane';
                }
            },

            /**
             * Создать контейнер временных изображений
             * @method createTempContainer
             * (используется для вывода рисунков при движении карты)
             */
            createTempContainer: function() {
                if (typeof this.tempContainer !== 'undefined') {
                    return;
                }
                this.tempContainer = document.createElement( 'div' );
                this.tempContainer.className = 'wms-panel';
                this.tempContainer.id = "wms_image_temp";
                this.map.panes.tilePane.appendChild( this.tempContainer );
                this.tempContainer.style.display = 'none';

                const windowsize = this.map.getSize();
                this.tempCanvas = document.createElement( 'canvas' );
                this.tempCanvas.className = 'wms-canvas';
                this.tempContainer.appendChild( this.tempCanvas );
                this.tempCanvas.id = "wms_canvas_temp";
                this.tempCanvas.width = windowsize.x;
                this.tempCanvas.height = windowsize.y;
            },

            /**
             * Установить состояние
             * @method setState
             * @param key {string} имя
             * @param srclist {GropLayer[] | undefined} источники данных
             */
            setState: function(key, srclist) {

                if (!key || this.keys.indexOf(key) === -1) {
                    return;
                }
                this._states[ key ] = {
                    'id': '',
                    'pixelBounds': this.map.getPixelMapBounds(),
                    'size': this.map.getSize(),
                    'zoom': this.map.getZoom(),
                    'sources': srclist,
                    'active': false,
                    'selectsources':[],
                    'updatetime': +new Date()
                };
            },

            /**
             * Обработчик события начала движения карты `mapdragstart`
             * @method onMapDragStart
             * @param event {Object} объект события
             */
            onMapDragStart: function(event) {
                this._clearTimer();
                this.setUpdate();
                const timenow = +new Date();
                if (!this._states['temp']) {
                    this.resizeTempImage();
                    this.drawTempImage();
                    this.setTempState( timenow );
                }else{
                    this._states[ 'temp' ].updatetime = timenow;
                }

                if (!this._states['current']) {
                    this.setState('current');
                }
                this._states['current'].updatetime = timenow;
            },

            /**
             * Обработчик события окончания движения карты `mapdragend`
             * @method onMapDragEnd
             * @param event {Object} объект события
             */
            onMapDragEnd: function(event) {
                this._update();
            },

            /**
             * Обновить изображение
             * @method _update
             * @private
             */
            _update: function() {
                const now = +new Date();
                this._clearTimer();
                if ( this._states['current'] ) {
                    const timespan = now - this._states['current'].updatetime;
                    if (timespan < this._updateInterval) {
                        this._states['current'].updatetime = now;
                        this.timerDrag = window.setTimeout( () => this._update(), this._updateInterval );
                        return;
                    }
                }

                this.run();                       // запросить рисунки
            },

            /**
             * Удалить таймер
             * @method _clearTimer
             * @private
             */
            _clearTimer: function() {
                if (this.timerDrag) {
                    clearTimeout(this.timerDrag);
                    this.timerDrag = false;
                }
            },

            /**
             * Установить временные параметры состояния
             * @method setTempState
             * @private
             */
            setTempState(time) {
                this.setState('temp');
                this._states['temp'].updatetime = time;
                this._states['temp'].pixelBounds = this.map.getPixelMapBounds();
            },

            /**
             * Нарисовать временный рисунок
             * @method drawTempImage
             * @private
             */
            drawTempImage() {
                const mapcanvas = this.map._getCanvas();
                const ctx = this.tempCanvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
                    ctx.drawImage( mapcanvas, 0, 0 );
                }
            },

            /**
             * Размеры временных изображений
             * @method resizeTempImage
             */
            resizeTempImage: function() {
                if (this.tempCanvas) {
                    const windowsize = this.map.getSize();
                    if (this.tempCanvas.width !== windowsize.x || this.tempCanvas.height !== windowsize.y) {
                        this.tempCanvas.width = windowsize.x;
                        this.tempCanvas.height = windowsize.y;
                    }
                }
            },

            /**
             * Прикрепить временный wms-рисунок
             * @method clipImageTemp
             * @param bounds {GWTK.Bounds} область карты, пикселы текущего вида
             * @param context {Object} 2D контекст рисования карты, CanvasRenderingContext2D
             * (в канве tempCanvas - временный рисунок карты,
             * this._states['temp'].pixelBounds - габариты (пикселы) рисунка в матрице
             */
            clipImageTemp: function(bounds, context) {
                if (!bounds || !this._states['temp'] || !this._states['temp'].pixelBounds) {
                    return;
                }
                if (!bounds.intersects(this._states['temp'].pixelBounds)) {
                    return;
                }
                var tempBounds = this._states['temp'].pixelBounds;
                var begin = GWTK.point(bounds.min.x, bounds.min.y);        // left top текущие пикселы начала в окне
                var delta = tempBounds.min.subtract(begin),                // left top пикселы начала wms
                    size = this.map.getSize();

                var pixelTop = tempBounds.min.clone();

                var sx = 0,
                    sy = 0,
                    sw = size.x,
                    sh = size.y,
                    x = Math.round(delta.x),
                    y = Math.round(delta.y);
                if (pixelTop.x < begin.x) {
                    sx = Math.abs(delta.x);
                    sw -= sx;
                    x = 0;
                }
                if (pixelTop.y < begin.y) {
                    sy = Math.abs(delta.y);
                    sh -= sy;
                    y = 0;
                }

                if (context) {
                    context.globalAlpha = 1.0;
                    context.drawImage(this.tempCanvas, sx, sy, sw, sh, x, y, sw, sh);
                }

                return { 'sx': sx, 'sy': sy, 'w': sw, 'h': sh, 'x': x, 'y': y };
            },

            /**
             * Регистрация wms-слоя
             * @method registerLayer
             * @param layer {WmsLayer} wms-слой
             */
            registerLayer: function(layer) {
                if (!layer || !layer.wms)
                    return;
                layer.onLayerRender = ( id ) => this.renderLayers( id );
            },

            /**
             * Идентификатор запроса
             * @method requestId
             * @returns {number}
             * @private
             */
            requestId: function() {
                return this.requestNumber;
            },

            /**
             * Идентификатор следующего запроса
             * @method requestIdNext
             * @returns {number}
             * @private
             */
            requestIdNext: function() {
                this.requestNumber++;
                return this.requestNumber;
            },

            /**
             * Получить список wms серверов
             * @method getWmsList
             * @param idlist {string[]} массив идентификаторов слоев
             * @returns {GroupLayer[]} массив объектов групповых слоев
             */
            getWmsList: function( idlist ) {
                // все wms-слои в порядке отображения
                const layers = this.map.tiles.getWmsLayers();
                if ( layers.length == 0 || this.map.tiles.getWmsLayersVisible().length == 0 ) {
                    return [];
                }
                if ( Array.isArray( idlist ) && idlist.length > 0 && !this.map.mergeWmsLayers()) {
                    let i = layers.length;  // !!! TODO
                    i--;
                    while ( i >= 0 ) {
                        if ( !idlist.includes( layers[i].xId ) ) {
                            layers.splice( i, 1 );
                        }
                        i--;
                    }
                }
                const records = [];
                while ( layers.length >= 1 ) {
                    const servergroup = new GroupLayer( layers[0].serverDescriptor );
                    layers.splice( 0, 1 );
                    const merged = servergroup.fillList( layers );
                    if ( servergroup.isGroupVisible ) {
                        records.push( servergroup );
                    }
                    if ( merged ) {
                        for ( const layer of merged ) {
                            layers.splice( layers.indexOf( layer ), 1 );
                        }
                    }
                }
                return records;
            },

            /**
             * Проверить выполнение обновления
             * @method isUpdate
             * @returns {boolean}, true - выполняется
             */
            isUpdate: function() {
                if (this.tempContainer) {
                    return this.tempContainer.classList.contains('wms-update');
                }
                return false;
            },

            /**
             * Вывести wms-слои
             * @method run
             * @param list {Array} список id слоев для вывода
             */
            run: function( list ) {
                const requestlist = this.getSources( list );
                const requestSelectedList = this.getSelectedObjectsSources();

                if ( !requestlist || requestlist.length === 0 ) {
                    if ( requestSelectedList.length === 0 ) {
                        this._lastdraw = +new Date();
                        this._loading = false;
                        this.map.trigger( { type: 'wmsloaded' } );
                        this.map.tiles.drawMapImage( true, false, false );
                        return;
                    }
                }
                const rid = this.requestIdNext();

                this.setCurrentRequestState( requestlist, rid, requestSelectedList );

                if ( requestSelectedList.length > 0 ) {
                    this.requestDataSelectedObject( requestSelectedList, rid );
                }

                this.requestData( requestlist, rid );

                this.map.trigger({ type: 'postwmsupdate' });

            },

            wmsDrawing: function( list ) {
                this.run( list );
            },

            /**
             * Установить состояние текущего запроса
             * @method setCurrentRequestState
             * @param requestlist {Array} массив GroupLayer изображений
             * @param rid {number} id запроса
             * @param requestselectedlist {Array} массив слоев GroupLayer выделения объектов
             * @private
             */
            setCurrentRequestState: function( requestlist, rid, requestselectedlist ) {

                this._lastdraw = +new Date();
                if (!this._states['current']) {
                    this.setState('current');
                }
                this._states['current'].id = rid;

                this._states['current'].sources = requestlist;
                this._states['current'].lastdraw = this._lastdraw;
                if ( requestselectedlist && requestselectedlist.length > 0 ) {
                    this._states['current'].selectsources = requestselectedlist;
                } else {
                    this._states['current'].selectsources = [];
                }
            },

            /**
             * Получить источники изображений
             * @method getSources
             * @param idlayers {Array} список id слоев для обновления
             * @returns {Array} массив объектов GroupLayer
             */
            getSources: function( idlayers ) {
                let ids = [];
                if ( Array.isArray( idlayers ) ) {
                    ids = idlayers.slice( 0 );
                } else if ( typeof idlayers == 'string' ) {
                    ids = idlayers.split( ',' );
                }
                let sources = this.getWmsList( ids );
                if ( ids.length > 0 && this.map.mergeWmsLayers() ) {
                    let i = sources.length;
                    i--;
                    while ( i >= 0 ) {
                        if ( !sources[i].contains( ids ) ) {
                            sources.splice( i, 1 );
                        }
                        i--;
                    }
                }
                this.sources = sources;
                return sources;
            },

            /**
             * Запросить данные (изображения)
             * @method requestData
             * @param sources {Array} GroupLayer массив
             * @param rid {number} идентификатор запроса
             * @returns {Array} массив объектов GroupLayer
             * @private
             */
            requestData: function( sources, rid ) {
                if ( sources && rid ) {
                    this._loading = true;
                    let done = false;
                    sources.forEach( source => { if ( source.request( rid ) ) { done = true; } });
                    return done;
                }
            },

            /**
             * Запросить данные (изображения) для выделения объектов
             * @method requestDataSelectedObject
             * @param sources {GroupLayer[]} GroupLayer массив
             * @param rid {string} идентификатор запроса
             * @returns {Array} массив объектов GroupLayer
             * @private
             */
            requestDataSelectedObject: function(sources, rid) {
                if (sources && rid) {
                    const nowLoading = this._loading;
                    this._loading = true;
                    let done = false;
                    sources.forEach(source => {
                        if (source.requestWithSearchParam( rid )) {
                            done = true;
                        }
                    });
                    if (!done && !nowLoading) {
                        this._loading = false;
                    }
                }
            },

            /**
             * Вывести изображения
             * @method _drawing
             * @param rid { string } идентификатор запроса
             */
            renderLayers: function( rid ) {
                if ( !rid || !this._loading ) {
                    return;
                }
                if ( !this.areAllLoaded() ) {
                    if ( this.canDrawImage() ) {
                        this.map.tiles.drawMapImage( false, false, true );
                    }
                    return;
                }
                this.map.setCursor('default');
                this.clearUpdate();

                if ( +rid === this.requestId() ) {
                    this.map.tiles.drawMapImage( true, false, true );
                    this.map.trigger( { type: 'wmsloaded', target: 'map' } );
                }
                this.clearState();
                this._loading = false;
            },

           /**
             * Анализ готовности рисования
             * @method canDrawImage
             * @returns {boolean}
             * @private
             */
            canDrawImage: function() {
                let lastdraw = this._states['current'].lastdraw;
                if ( lastdraw === undefined ) {
                    lastdraw = 0;
                }
                const timenow = +new Date();
                const drawnow = ( timenow - lastdraw ) > this._updateInterval;
                if ( drawnow ) {
                    this._states['current'].lastdraw = timenow;
                }
                return drawnow;
            },

            /**
             * Анализ готовности ответа
             * @method areAllLoaded
             * @returns {boolean} `true` - данные получены, `false` - нет
             * @private
             */
            areAllLoaded: function() {
                const sources = this._states['current'].sources;
                let total = 0;
                let loaded = 0;
                sources.forEach( (source) => {
                    if ( source.isGroupVisible ) {
                        total++;
                    }
                    if ( source.layer.isImageReady) {
                        loaded++;
                    }
                } );

                let count = 0;
                const selectsources = this.getSelectObjectSources();
                if ( selectsources && selectsources.length > 0 ) {
                    selectsources.forEach( ( source) => {
                        if ( source.layer.isImageReady ) {
                            count++;
                        }
                    });
                }
                return ( total === loaded && count === selectsources.length );
            },

            /**
             * Получить текущие источники выделения объектов
             * @method getSelectObjectSources
             * @returns {Array} массив объектов GroupLayer
             * @private
             */
            getSelectObjectSources() {
                if ( this._states['current'] ) {
                    return this._states['current'].selectsources;
                }
            },

            /**
             * Сбросить текущее состояние запроса
             * @method clearState
             * @private
             */
            clearState: function() {
                if (this._states['temp']) {
                    delete this._states['temp'];
                }
            },

            /**
             * Установить признак обновления
             * @method setUpdate
             */
            setUpdate: function() {
                this.tempContainer.classList.add('wms-update');
                return true;
            },

            /**
             * Сбросить признак обновления
             * @method clearUpdate
             */
            clearUpdate: function() {
                this.tempContainer.classList.remove('wms-update');
            },

            /**
             * Перерисовать
             * @method redraw
             * @param canvas {HTMLCanvasElement} холст рисования
             * @param filter {Array} список идентификаторов слоев
             * @param pos {Point} координаты начала изображения, пикселы
             */
            redraw: function( canvas, pos, filter ) {
                if ( !canvas ) {
                    return;
                }
                const layers = this.getReadyLayers();
                if ( layers.length === 0 ) {
                    return;
                }
                let origin = pos;
                const ctx = canvas.getContext( '2d' );
                const alpha = ctx.globalAlpha || 1.0;
                ctx.globalAlpha = 1.0;
                if (typeof origin === 'undefined') {
                    origin = new GWTK.Point( 0, 0 );
                }
                for ( let i = 0; i < layers.length; i++ ) {
                    if ( filter && filter.indexOf( layers[i].xId ) === -1 ) {
                        continue;
                    }
                    layers[i].drawLayer( canvas, false, origin );
                }

                this.map.trigger({ type: 'postwmsdrawing' });

                ctx.globalAlpha = alpha;
            },

            /**
             * Получить список слоев, готовых для рисования
             * @method getReadyLayers
             * @return {Array} массив слоев WmsLayer
             */
            getReadyLayers() {
                let sources = [];
                const readyLayers = [];
                const rid = this.currentRequestId();
                if ( rid === 0 ) {
                    return readyLayers;
                }
                if ( this._states.current['sources'] ) {
                    sources = this._states.current['sources'];
                }

                sources.forEach( function( source ) {
                    if ( source.layer.isImageReady && source.isGroupVisible ) {
                        readyLayers.push( source.layer );
                    }
                } );

                const selectsources = this.getSelectObjectSources();
                if ( selectsources && selectsources.length > 0 ) {
                    selectsources.forEach( ( source) => {
                        if ( source.layer.isImageReady ) {
                            readyLayers.push( source.layer );
                        }
                    });
                }
                return readyLayers;
            },

            /**
             * Идентификатор текущего запроса
             * @method currentRequestId
             * @return {number} идентификатор текущего запроса
             */
            currentRequestId: function() {
                if ( this._states['current'] ) {
                    return this._states['current'].id;
                }
                return 0;
            },

            /**
             * Установить прозрачность изображения слитых слоев
             * @method setMergedLayersOpacity
             * функция синхронизирует значение прозрачности слитых слоев
             * при изменении прозрачности любого их них.
             * Слитые слои отображаются одним рисунком.
             * @param layer {WmsLayer} wms-слой
             * @param opacity {number} css-прозрачность
             * @protected
             */
            setMergedLayersOpacity: function( layer, opacity ) {
                if ( !layer || opacity === undefined || !this.map.mergeWmsLayers() ) {
                    return;
                }
                const serviceUrl = layer.serviceUrl.toLowerCase();
                let sources = [];

                if ( this._states['current'] ) {
                    sources = this._states.current['sources'] || [];
                }
                sources.forEach( ( source ) => {
                    if ( source.serviceUrl.toLowerCase() !== serviceUrl ) {
                        return;
                    }
                    if ( source.contains( [ layer.xId ] ) ) {
                        source.setOpacity( opacity );
                    }
                } );
            },

        /**
         * Получить состояние данных слоев
         * @method retrieveLayerDataState
         * @param ids {Array} идентификаторы слоев
         * @return {Array} идентификаторы слоев
         */
        retrieveLayerDataState: function(ids) {
            return new Promise((resolve, reject) => {

                const result = [];

                // отобранные по ids GroupLayer
                var sources = this.getSources( ids );
                if (sources.length === 0) {
                    resolve(result);
                }

                for (const source of sources) {
                    source.list.map((layerDescription) => {
                        layerDescription.id = GWTK.Util.decodeIdLayer(layerDescription.id);
                    })
                }

                const updatedIdList = [];

                let promiseCount = 0;

                const restService = RequestServices.getService(this.map.options.url, ServiceType.REST);
                for (const source of sources) {

                    restService.getLayerState({
                        LAYER: source.getList.map(layerDescription => layerDescription.id).join(',')
                    }, { url: source.serviceUrl }).then((result) => {
                        if (result.data) {
                            result.data.restmethod.outparams.forEach(params => {
                                const layerDescription = source.list.find(layerDescription => layerDescription.id === params.name);
                                if (layerDescription) {
                                    if (!layerDescription.layer.checkLayerDataState(params.value)) {
                                        updatedIdList.push(layerDescription.xId);
                                        layerDescription.layer.setLayerDataState(params.value);
                                    }
                                }
                            })
                        }
                        promiseCount--;

                        if( promiseCount===0 ){
                            resolve(updatedIdList);
                        }
                    }).catch((e) => {
                        source.list.forEach(layerDescription => updatedIdList.push(layerDescription.xId));
                        promiseCount--;
                        if(promiseCount===0){
                            resolve(updatedIdList);
                        }
                    });
                    promiseCount++;
                }
            })
        },

        /**
         * Получить источники изображений для выделения объектов
         * @method getSelectedObjectsSources
         * @returns {Array} массив объектов GroupLayer
         */
        getSelectedObjectsSources: function( ) {

            const sources = this.map.getSelectedObjectsLayersParameters();

            if ( sources ) {
                const layers = sources.layers;

                layers.forEach( layer => layer.setVisibility( true ) );

                return this.setSelectedObjectGroupLayers( sources.searchRequestParam, layers );
            }
        },

        /**
         * Получить фильтр поиска для слоя выделения объектов
         * @method getSelectedObjectsLayerFilter
         * @param xid {string} xid слоя выделения объектов
         * @returns {string} фильтр keylist
         */
        getSelectedObjectsLayerFilter( xid ) {
            const xId = SelectedObjectsDrawManager.xIdOriginal( xid );
            let keylist = '';
            const layer = this.map.tiles.getLayerByxId( xId );
            if ( layer ) {
                keylist = layer.getKeyListFilter();
                if ( !keylist ) keylist = '';
            }
            return keylist;
        },

        /**
         * Установить группы слоев для выделения объектов
         * @method setSelectedObjectGroupLayers
         * @param searchRequestParams {SearchRequestParams} параметры выделения объектов
         * @param layers [WmsLayer] слои выделения объектов
         * @returns {Array} массив объектов GroupLayer
         */
        setSelectedObjectGroupLayers( searchRequestParams, layers ) {
            const groupList = [];
            while ( layers.length >= 1 ) {
                const grouplayer = new GroupLayer( layers[0].serverDescriptor );
                const searchParams = searchRequestParams.find( params => params.server === grouplayer.serviceUrl );
                layers.splice( 0, 1 );
                const merged = grouplayer.fillCommonList( layers );
                grouplayer.searchParameters = searchParams;
                groupList.push( grouplayer );
                if ( merged ) {
                    for ( const layer of merged ) {
                        layers.splice( layers.indexOf( layer ), 1 );
                    }
                }
            }
            return groupList;
        }
    }
}