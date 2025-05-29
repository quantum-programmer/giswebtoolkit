/********************************** Нефедьева О.А. *** 07/02/22 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2022              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                    Управление слоем тайлов карты                 *
*                                                                  *
*******************************************************************/
/*
    Класс TileLayer - загрузка, отображение изображений и управление слоем тайлов. 
    Основным параметром слоя является адрес сервера тайлов (options.url). 
    Слои создаются динамически, хранятся в коллекции layers класса карты Map. 
    Конструктор TileLayer принимает два параметра – объект Map и объект параметров - options. 
    После создания объекта TileLayer необходимо добавить его в коллекцию слоев карты методом onAdd().
*/

if (window.GWTK)
{
    GWTK.TileLayerOld = function (map, options)
    {
        if (map == undefined || map == null) {
            console.log(w2utils.lang("Map layer creation error") + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        if (options == undefined || options == null) {
            console.log(w2utils.lang("Map layer creation error") + ". " + w2utils.lang("Not defined a required parameter") + " Options.");
            return;
        }

        this.map = map;
        this.alias = "";                 // Название слоя
        this.xId = "";                   // Уникальный идентификатор слоя в карте
        this.id = "";                    // Уникальный идентификатор слоя в карте
        this.idLayer = "";               // Идентификатор слоя на сервере тайлов 
        this.options = null;             // Объект описания параметров слоя
        this.serverUrl = "";             // Адрес сервера тайлов (шаблон)
        this.tilematrixset = "";         // Тип матрицы тайлов
        this.url = "";                   // Адрес сервера тайлов
        this.format = "png";             // Формат рисунков тайлов карты (png/jpg)
        this.style = "default";          // Имя стиля карты. default по умолчанию.
 
        this.panel = map.tilePane;       // Контейнер слоев тайлов
        this.layerContainer = null;      // Контейнер тайлов

        this.windowHeight = 0;           // Высота окна карты
        this.windowWidth = 0;            // Ширина окна карты
        this._tilezoom;                  // текущй zoom слоя
        this._origin = {};               // точка привязки вывода изображения, глобальные пиксели, NW
        this.rowTotal = 0;               // Общее количество строк в матрице текущего уровня приближения
        this.collTotal = 0;              // Общее количество столбцов в матрице текущего уровня
        this.rowCount = 0;               // строк тайлов в окне  
        this.collCount = 0;              // колонок тайлов в окне 
        this.bounds = null;              // габариты слоя (uperconer,lowerconer), номера тайлов (row, col, i, j) 

        this.visible = true;             // Признак видимости слоя 
        this.selectObject = 0;           // Возможность выбора объектов карты (1/0)
        this.areaSeek = 0;               // Возможность использования для поиска по области (1/0)
        this.keysTextSearch = "";        // Параметры фильтра объектов по названию (имена характеристик).

        this.errorImage = GWTK.imgEmpty; // Пустое изображение тайла 

        this.classifier = null;          // Классификатор карты 
        
        this.init(map, options);
        
        this.map.layers.push(this);

        this.zIndex = this.map.tiles.indexOfxIdInArray(this.map.layers, this.xId);

        this.mapSheets = { "layerId": this.idLayer, "sheets": [] };   // список имен листов карты слоя

        this.browser = GWTK.getBrowser();

        this._tileStock = [];              // Кэш свободных тайлов

        this._canvas = null;

        this._updateInterval = 200;

        this.XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : window.XDomainRequest;

        this._revokeUrl = [];

        this._urlsList = [];

        this._listIndex = -1;

        this._usexhr = this._xhrTest();
    };

    GWTK.TileLayerOld.prototype =
    {
        /**
         * Инициализация 
         * @method init
         */
        init: function (map, options)
        {
            this.map = map;
            this.options = options;

            this.tilematrixset = this.options.tilematrixset || this.map.options.tilematrixset;

            // размер тайла
            var matrix = GWTK.TileMatrixSets[this.tilematrixset] || {};
            this.tileWidth = matrix["tileWidth"] || 256.0;
            this.tileHeight = matrix["tileHeight"] || 256.0;
            this._tileSize = GWTK.point(this.tileWidth, this.tileHeight);
            
            // размер сетки тайлов в окне
            this._getTileCount();
            
            // обработчики перемещения карты
            this.onMapDragStart = GWTK.Util.bind(this.onMapDragStart, this);
            this.onMapDragEnd = GWTK.Util.bind(this.onMapDragEnd, this);
            $(this.map.eventPane).on('mapdragstart', this.onMapDragStart);
            $(this.map.eventPane).on('mapdragend', this.onMapDragEnd);

            // параметры cмещения слоя
            this.setLocalCoordinateSystemOriginOffset();

            // не рисовать тайл при загрузке 
            this._nodrawing = true;
            
            // зарегистрировать для pam-аутентификации 
            this.map.tiles.setAuthTypeServer(this);
            
            return;
        },

        /**
         * Получить тип слоя
         * @method getType
         * @public
         * @return {string} строка 'tile' - слой тайлов 
         */
        getType: function () {
            return 'tile';
        },

        /**
         * Получить элемент контейнера слоя
         * @method getContainer
         * @return HTMLElement
         */
        getContainer: function () {
            return this.layerContainer;
        },

        /**
         * Создать контейнер слоя
         * @method screateContainer
         * @return HTMLElement
         */
        createContainer: function () {
            if (this.panel == null || $(this.panel).find('#div_' + this.xId).length > 0) {
                return;
            }

            // Создаем контейнер слоя
            this.layerContainer = document.createElement('div');
            this.layerContainer.id = 'div_' + this.xId;
            this.layerContainer.className = 'gwtk-tiles';
            this.$container = $(this.layerContainer);

            // z-index контейнера
            this.layerContainer.style.zIndex = this.options.zIndex;

            // Добавляем к контейнеру слоев
            this.panel.appendChild(this.layerContainer);

            return this.layerContainer;
        },

        /**
         * Создать канву
         * @method _createCanvas
         */
        _createCanvas: function () {
            this._canvas = this.map._getCanvas();
        },

       _idLayerXml: function () {
            return GWTK.Util.decodeIdLayer(this.idLayer);
        },
        
     
       /**
         * Рисовать тайл
         * @method _drawTile
         * @param tile {Object} объект тайла
         * @param offset {GWTK.Point} пикселы начала рисунка (left,top)
         * @param context {Object} 2D контекст рисования карты, CanvasRenderingContext2D
         * @param origin {GWTK.Point} точка отсчета, пикселы 
         */    
        _drawTile: function (tile, offset, context, origin) {
            if (!this._canvas || !tile) return 0;
            
            var begin = offset,                                    // left top пикселы начала в окне
                tilePixels = tile.coords.clone(),
                delta = 0;
            
            tilePixels = tilePixels.scaleBy(this._tileSize);       // left top пикселы тайла
            delta = tilePixels.subtract(begin);
            delta._ceil();

            var sx = 0,                        
                sy = 0,
                sw = this._tileSize.x,
                sh = this._tileSize.y,
                x = delta.x,
                y = delta.y;
            if (tilePixels.x < begin.x) {
                sx = Math.abs(delta.x);
                sw -= sx;
                x = 0;
            }
            if (tilePixels.y < begin.y) {
                sy = Math.abs(delta.y);
                sh -= sy;
                y = 0;
            }
            if (typeof origin !== "undefined") {
                x += origin.x;
                y += origin.y;
            }
            var ctx = context ? context : this._canvas.getContext("2d");
            if (!context) {
                ctx.globalAlpha = this.getOpacityCss();
            }
            if (sw < 0) {
                return;
            }
            try{
            ctx.drawImage(tile.el, sx, sy, sw, sh, x, y, sw, sh);
            }
            catch(e){}
            return 1;
        },

        /**
         * Рисовать слой
         * @method _drawLayer
         * @param range {GWTK.Bounds} габариты рисунка в пикселах матрицы текущего zoom
         * @param begin {GWTK.Point} пикселы начала рисунка (left,top)
         * @param context {Object} 2D контекст рисования карты, CanvasRenderingContext2D
         * @param clear {Boolean} признак очистки холста,`true` - очистить 
         */
        drawLayer: function (bounds, begin, clear, topleft) {
            if (typeof bounds == 'undefined') return;
            var ctx = this._canvas.getContext("2d"), 
                count = 0, i, j;

            if (clear) {
                ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            }
            
            var tileRange = this._pixelBoundsToTileRange( bounds );

            ctx.globalAlpha = this.getOpacityCss();
           
            for (j = tileRange.min.y; j <= tileRange.max.y; j++) {
                for (i = tileRange.min.x; i <= tileRange.max.x; i++) {
                    var coords = GWTK.point(i, j);
                    coords.z = this._tilezoom || this.map.getZoom();
                    if (!this.isValidTile(coords)) { continue; }
                    var tile = this._tiles[this._getTileKey(coords)];
                    if (tile) {
                        if ($(tile.el).hasClass('tile-loaded')){
                           this._drawTile(tile, begin, ctx, topleft);
                           count++;
                        }
                    }
                }
            }

            return;
        },

        /**
         * Установить смещение местной системы координат 
         * @method setLocalCoordinateSystemOriginOffset
         */
        setLocalCoordinateSystemOriginOffset: function () {

            if (typeof this.options.lcs === 'undefined') {
                return;
            }
            if (!this.options.lcs.hor && !this.options.lcs.ver) {
                return;
            }
            if (typeof (this.options.lcs.hor) == 'undefined') {
                this.options.lcs.hor = 0;
            }
            if (typeof (this.options.lcs.ver) == 'undefined') {
                this.options.lcs.ver = 0;
            }
            try {
                this.options.lcs.hor = parseFloat(this.options.lcs.hor);
                this.options.lcs.ver = parseFloat(this.options.lcs.ver);
            }
            catch (e) {
                this.options.lcs = {'hor':0, 'ver':0};
            }
            return;
        },

        /**
         * Запросить смещение местной системы координат в метрах 
         * @method getLocalCoordinateSystemOriginOffset
         * @return {Object}, смещение в метрах по осям {"hor":, "ver":} 
         */
        getLocalCoordinateSystemOriginOffset: function () {
            if (typeof this.options.lcs === 'undefined' || $.isEmptyObject(this.options.lcs)) {
                return false;
            }
            if (!this.options.lcs.hor && !this.options.lcs.ver) {
                return false;
            }
 
            return this.options.lcs;
        },

        /**
         * запросить смещение рисунка для местной системы координат в пикселах
         * @method getPictureOffsetsCurrent
         * @return {Object} смещение {"left": pixel, "top": pixel} пикселы для текущего масштаба
         * При ошибке возвращает `false`
         */
        getPictureOffsetsCurrent: function () {
            var lcsOrigin = this.getLocalCoordinateSystemOriginOffset();
            if (!lcsOrigin || !this.map) { return false; }

            var isgeo = (this.map.options.crs == 4326);
            var pixelSpan = GWTK.tileView.getpixelSpan(0, isgeo, this.map);
            if (pixelSpan == null) { return false; }
            var left = parseInt(lcsOrigin.hor / pixelSpan),
                 top = parseInt(lcsOrigin.ver / pixelSpan);

            return { "left": -left, "top": -top };
        },

        setPictureOffsetsCurrent: function () {
            var lcsOffset = this.getPictureOffsetsCurrent();
            if (!lcsOffset) {
                return;
            }

            if (this.tileWidth != 256) {
                var top = parseInt($(this.layerContainer).css('top')) + lcsOffset.ver,
                    left = parseInt($(this.layerContainer).css('left')) + lcsOffset.hor;
                $(this.layerContainer).css('top', top + 'px');
                $(this.layerContainer).css('left', left + 'px');
            }
            else {
                $(this.layerContainer).css('top', lcsOffset.top + 'px');
                $(this.layerContainer).css('left', lcsOffset.left + 'px');
            }

            return;
        },

        /**
         * Запросить x-координату вывода рисунка карты (пикселы) 
         * @method getPicX
         */
        _getPicX: function () {
            var lcs = this.getPictureOffsetsCurrent();
            var origin = this.map.getPixelMapTopLeft().round();
            if (!lcs) { return origin.x; }
            return (origin.x - lcs.ver);
         },

        /**
         * Запросить н-координату вывода рисунка карты (пикселы) 
         * @method getPicY
         */
        _getPicY: function () {
            var lcs = this.getPictureOffsetsCurrent(),
                origin = this.map.getPixelMapTopLeft().round();
            if (!lcs) { return origin.y; }
            return (origin.y - lcs.top);
        },

        /**
         * Обработчик события начала перемещения карты 
         * @method onMapDragStart
         * @param e {Event} объект события, e.offset.left, e.offset.top -
         * координаты матрицы тайлов (пикселы)
         */
        onMapDragStart: function (e) {
            this._nodrawing = false;           
            return;
        },

        /**
         * Обработчик события окончания перемещения карты 
         * @method onMapDragEnd
         * @param e {Event} объект события, e.offset.left, e.offset.top -
         * координаты матрицы тайлов (пикселы)
         */
        onMapDragEnd: function (e) {
            this._update();
            this._nodrawing = true;
            return;
        },

        /**
         * Настроить класс при добавлении слоя в карту 
         * @method onAdd
         */
        onAdd: function ()
        {
            this.options.onlyset = 0;

            var center = this.map.getCenterPixel(),
                zoom = this.map.getZoom();

            this._tiles = [];                                       // текущие тайлы

            this.setOptions();                                      // параметры слоя

            this.createContainer();                                 // контейнер слоя

            this._createCanvas();                                   // холст

            this._setView(center, zoom, true);                      // параметры отображения
 
            this.setBounds();                                       // установить габариты слоя из параметров

            if (this.map.classifiers) {                             // создать классификатор
                this.classifier = this.map.classifiers.get(this);
            }
            else {
                this.classifier = new GWTK.classifier(this);
            }
            
            if (this.selectObject) {                                   // запросить список имен листов карты для слоя
                //GWTK.Util.getSheetNameForLayer(this.serverUrl, this.idLayer, this.map);
                GWTK.Util.getSheetNameForLayer(this);
            }
             
            if (this.options.hidden)                                                
                this.hide(true);

            this.setOpacity(this.initOpacity());

            if (this.layerContainer !== null)
                $(this.map.eventPane).trigger({ type: 'layerlistchanged', maplayer: { 'id': this.xId, 'act': 'add' } });

            return;
        },

        /**
         * Освобождение ресурсов при удалении слоя 
         * @method onRemove
         */
        onRemove: function ()
        {
            if (this.panel == null) return;
            if (this.getContainer() == null) return;
            
            this._removeAllTiles();

            this._removeObjectUrl();
            
            // удалить список листов карты
            if (this.mapSheets.sheets.length > 0){
                this.map.tiles.sheetNamesList.remove(this);
                this.mapSheets.sheets.splice(0, this.mapSheets.sheets.length);
            }

            this.$container.remove();
            
            this.layerContainer = null;

            this._removeTempElem();
 
            // удалить признак загрузки легенды в локальном хранилище
            GWTK.Util.removeLocalKey('legend_' + this.xId);

            // удалить легенду
            GWTK.Util.removeLegend(this.xId, this.map);

            // удалить классификатор
            if (this.map.classifiers) {
                this.map.classifiers.remove(this);
            }
            
            $(this.map.eventPane).trigger({ type: 'layerlistchanged', maplayer: { 'id': this.xId, 'act': 'remove' } });

            // отключить обработчики события перемещения карты
            $(this.map.eventPane).off('mapdragstart', this.onMapDragStart);
            $(this.map.eventPane).off('mapdragend', this.onMapDragEnd);

            this._removeTileStock();
 
            return;
        },

        /**
         * Удалить элемент клона
         * @method _removeTempElem
         */
        _removeTempElem: function () {
            var temp = this.map.mapClone.find('#div_' + this.xId);
            temp.remove();
         },

        /**
         * Освободить кэш тайлов 
         * @method _removeTileStock
         */
        _removeTileStock: function () {
            if (this._tileStock.length == 0) {
                return;
            }
            var i, len;
            for (i = 0; len = this._tileStock.length, i < len; i++) {
                $(this._tileStock[i]).off().remove();
            }
            while (this._tileStock.length > 0) {
                delete this._tileStock[0];
                this._tileStock.splice(0, 1);
            }
 
            this._tileStock = [];
        },


        /**
         * Показать слой 
         * @method show
         */
        show: function ()
        {
            if (this.visible) {
                return;
            }
            this.visible = true;
            var container = $(this.getContainer());
            container.show();
            var origin = this.map.getPixelMapTopLeft().round();
            this._nodrawing = true;                       // не рисовать каждый тайл при загрузке
            this.update();
            this._nodrawing = false;
        },

        /**
         * Скрыть слой 
         * @method hide
         */
        hide: function (notshow)
        {
            if (!this.visible) {
                return;
            }
            var container = $(this.getContainer());
            container.hide();
            this.visible = false;
            if (notshow) return;
            this.map.tiles.drawMapImage(true, false, true);
        },

        /**
         * Получить признак отображения слоя
         * @method getVisibility
         */
        getVisibility: function () { return this.visible; },

        /**
         * Проверить видимость слоя по границам видимости слоя
         * @method checkViewZoom
         * @return {Boolean} true/false, да/нет
         */
        checkViewZoom: function () {
            if (this.maxZoomView() == this.minZoomView()) {
                if (this.map.options.tilematrix == this.maxZoomView())
                    return true;
                else
                    return false;
            }
            if (this.map.options.tilematrix <= this.maxZoomView() && this.map.options.tilematrix >= this.minZoomView()){
                   return true;
            }
            return false;
        },

        getTotalTileCount: function () {
            var count = this._getTileCount();
            return (count.x * count.y);
        },

        /**
         * Получить количественные параметры фрагмента карты в окне
         * @method _getTileCount
         * @return {GWTK.Point}, {x:число колонок, y:число строк}
         */
        _getTileCount: function () {
            var size = this.map.getSize(),                               // размер карты
                tileSize = this.getTileSize();                           // размер тайла
            this.windowWidth = parseInt(size.x);
            this.windowHeight = parseInt(size.y);
            this.rowCount = Math.ceil(size.y / tileSize.y);              // строк тайлов в окне
            this.collCount = Math.ceil(size.x / tileSize.x);             // колонок тайлов в окне

            return GWTK.point(this.collCount, this.rowCount);
        },

        /**
         * Получить размер тайла
         * @method getTileSize
         * @return {GWTK.Point}, {x:ширина, y:высота}
         */
        getTileSize: function () {
            return this._tileSize;
        },

        /**
         * Получить размер матрицы тайлов для масштаба zoom
         * @method _getGlobalPixelSize
         * return {GWTK.Bounds} габариты матрицы тайлов, пикселы
         */
        _getGlobalPixelSize: function (zoom) {
            return GWTK.tileView.globalTileMatrixSizePixel(this.map, zoom);
        },

        /**
         * Получить число колонок и строк в матрице тайлов уровня zoom
         * @method _getGlobalCount
         * return {GWTK.Point} число колонок(x), число строк (y) в матрице для уровня zoom
         */
         _getGlobalCount: function (zoom) {
             var gcount = this._getGlobalPixelSize(zoom);
            if (isFinite(gcount)) return;
            this.rowTotal = gcount;              // Всего строк в матрице 
            this.collTotal = gcount;             // Всего столбцов в матрице
            return GWTK.point(this.collTotal, this.rowTotal);
        },

        /**
         * Получить габариты фрагмента в пикселах матрицы для масштаба zoom
         * @method _geo2PixelBounds
         * @param center {Array}, координаты центра, градусы, [широта, долгота] 
         * @param zoom {Number} масштабный уровень, номер матрицы тайлов  
         * return {GWTK.Bounds} {min:{x,y}, max:{x,y}}, габариты фрагмента в пикселах матрицы 
         */
        _geo2PixelBounds: function (center, zoom) {
            var zoom = zoom !== undefined ? zoom : this.map.getZoom(),
                pixelCenter = {};
            if (center) {
                pixelCenter = GWTK.tileView.geo2pixel(this.map, center, zoom);
            }
            else {
                pixelCenter = this.map.getCenterPixel(zoom);
            }
            var half = this.map.getSize().divideBy(2);

            return new GWTK.Bounds(pixelCenter.subtract(half).floor(), pixelCenter.add(half).floor());
        },

        /**
         * Преобразовать габариты фрагмента в пикселах матрицы в диапазон номеров тайлов
         * @method _pixelBoundsToTileRange
         * @param bounds {GWTK.Bounds}, габариты фрагмента в пикселах матрицы 
         * return {GWTK.Bounds} {min:{x,y}, max:{x,y}}, x - номер колонки, y - номер строки
         */
        _pixelBoundsToTileRange: function (bounds) {
            var pixBounds = bounds,
                tileSize = this.getTileSize();
            var min = pixBounds.min.unscaleBy( tileSize );
            var max = pixBounds.max.unscaleBy( tileSize ).ceil();    
            return new GWTK.Bounds(
                min.floor(),
                max.subtract(new GWTK.Point( 1, 1 )));
        },

        /**
         * Установить параметры слоя по значениям в переменной options 
         * @method setOptions
         */
        setOptions: function ()
        {
            this.xId = this.id = this.options.id;
            this.alias = this.options.alias;
            this.name = this.options.alias;
            this.serverUrl = this.options.url;
            this.url = this.serverUrl;
            this._urlsList = [];
            this._urlsList.push(this.options.url);
            this._listIndex = 0;

            var params = GWTK.Util.getParamsFromURL(this.options.url);
            this.idLayer = params['layer'];                                             // id слоя на сервисе, может отсутствовать
            if (params["format"])
                this.format = params["format"];                                         // формат изображений 

            this.getRowFunction = null;
            if (this.options.rowfunction && $.isFunction(this.options.rowfunction)) {   // param deprecated !
                this.getRowFunction = this.options.rowfunction;
            }
            else {
                if (this.options.tms && this.options.tms == 1) {
                    this.getRowFunction = GWTK.tileView.tmsRow;
                }
            }
            
            // Возможность получения информации об объектах карты
            this.selectObject = typeof this.options.selectObject !== undefined ? this.options.selectObject : 0;

            // Возможность выделения найденных объектов карты 
            this.selectsearch = this.options.selectsearch;

            // Возможность поиска по области
            this.areaSeek = this.selectObject;

            // Ключи семантик для текстового поиска
            this.keysTextSearch = [];
            if (this.options.keyssearchbyname != undefined && this.options.keyssearchbyname.length != 0) {
                for (var i = 0; i < this.options.keyssearchbyname.length; i++) {
                    if (this.options.keyssearchbyname[i].length != 0) {
                        this.keysTextSearch.push(this.options.keyssearchbyname[i]);
                    }
                }
            }

            if (typeof this.options.hidden !== 'undefined' && this.options.hidden == 1) {
                this.visible = false;
            }

            if ($.isArray(this.options.linkedUrls)){
                for (var i = 0; i < this.options.linkedUrls.length; i++) {
                    if (this.options.linkedUrls[i] && this.options.linkedUrls[i].length > 0){
                       this._urlsList.push(this.options.linkedUrls[i]);
                    }
                }
            } 

            return true;
        },

        /**
         * Установить общие параметры матрицы тайлов для текущего уровня zoom 
         * @method _setGlobals
         */
        _setGlobals: function () {
            var zoom = this.map.getZoom(),
                tilesize = this.tileWidth,
                count = GWTK.tileView.globalTileMatrixCount(this.map, zoom, tilesize); 
            this._globalTileRange = GWTK.bounds(GWTK.point(0,0), count);
            this.collTotal = count.x;
            this.rowTotal = count.y;
            this._limitX = [0, this.collTotal];
            this._limitY = [0, this.rowTotal];
        },

        /**
         * Установить вид 
         * @method _setView
         */
        _setView: function (center, zoom, update) {

            var tilezoom = this.checkViewZoom(zoom) ? zoom : undefined;           // новый зум
            
            if (update || tilezoom !== this._tilezoom) {
                var old_zoom = this._tilezoom;

                this._tilezoom = tilezoom;                                        // текущий масштабный уровень

                if (this._tilezoom !== undefined) {
                    this.setBounds();
                }

                if (this._canselLoading) {
                    this.canselLoading();                                         // отменить текущую загрузку данных
                }

                this._setGlobals();                                               // параметры матрицы тайлов для текущего зума

                this._origin = this.map.getPixelMapTopLeft().round();             // начало отображаемого фрагмента, пикселы матрицы

                if (tilezoom !== undefined) {
                    this._update(center);                                         // вывести изображение
                }
                else {
                    for (var key in this._tiles) {
                        this._tiles[key].current = false;
                    }
                    this._resetTiles();
                }
            }
            // !this._setZoomTransfomations(center);
            return;
        },

        /**
         * Обновить с инициализацией
         * @method update
         */
        update: function (force) {

            if (!this.getContainer() || !this.map) {
                return;
            }

            var mapzoom = this.map.getZoom(),
                size = this.map.getSize();

            if (this._tilezoom != undefined || this._tilezoom != mapzoom ) {
                for (var key in this._tiles) {
                    this._tiles[key].current = false;
                }

                this._canselLoading = true;

                this._setView(this.map.getCenterPixel(), mapzoom, true);
            }
            else {
                if (this.windowWidth !== parseInt(size.x) || this.windowHeight !== parseInt(size.y)) {
                    this._canselLoading = true;
                    this._setView(this.map.getCenterPixel(), mapzoom, true);
                }
                else {
                    this._update(this.map.getCenterPixel());
                }
            }

            return;
        },

        updateView: function() {
            this._update();
        },

        /**
         * Обновить  
         * @method _update
         * @param center {GWTK.Point} координаты центра фрагмента, пикселы матрицы
         */
        _update: function (center) {
            if (!this.map) return;

            this._updatetime = +new Date();                                      // время начала обновления тайлов                       
            var zoom = this.map.getZoom(),
                count = this._getTileCount(),
                center = center !== undefined ? center : this.map.getCenterPixel();
            center._floor();

            if (this._tilezoom == undefined) { return; }

            var bounds = this._getTilePixelBounds(center),
                tileRange = this._pixelBoundsToTileRange(bounds),                // диапазон отображаемых номеров тайлов (строк, столбцов)
                tileCenter = tileRange.getCenter()._ceil(),                      // центральный тайл
                list = [],                                                       // список координат тайлов
                count = 0,
                begin = GWTK.point(bounds.min.x, bounds.min.y);
            begin.z = this._tilezoom;

            for (var key in this._tiles) {
                var c = this._tiles[key].coords;
                if (c.z !== this._tilezoom || !this.isValidTile(c)) {
                    this._tiles[key].current = false;
                }
            }

            for (var j = tileRange.min.y; j <= tileRange.max.y; j++) {
                for (var i = tileRange.min.x; i <= tileRange.max.x; i++) {
                    var coord = GWTK.point(i, j);
                    coord.z = this._tilezoom;
                    var tile = this._tiles[this._getTileKey(coord)];
                    if (tile) {
                        tile.current = true;
                        coord = this._limitCoords(coord);
                        if (tile.list_index !== undefined){
                           this._listIndex = tile.list_index; 
                        }
                        var src = this.getTileUrl(coord);
                        if (tile.src !== src) {
                            tile.src = src;
                            tile.loaded = undefined;                   // 28/09/20
                            this.sendRequest(tile);
                        }
                        count++;
                    }
                    else {
                        list.push(coord);
                    }
                }
            }

            list.sort(function (a, b) {
                return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
            });

            if (list.length == 0) {
                if (!count) {
                    this._removeAllTiles();
                }
                return;
            }
            
            if (!this._loading) {
                this._loading = true;
            }
            var fragment = document.createDocumentFragment();
            for (i = 0; i < list.length; i++) {
                this._addTile(list[i], fragment);
            }
            
            return;
        },

        /**
         * Добавить тайл 
         * @method _addTile
         * @param coords {GWTK.Point} координаты тайла, {x:столбец,y:строка,z:зум}
         * @param parent {DOM object}, родительский элемент
         * @return {DOM object} HTML элемент тайла, img
         */
        _addTile: function (coords, parent) {
            var parent = parent ? parent : this.layerContainer;
            var pos = this._getTilePos(coords),
                key = this._getTileKey(coords),
                img = this.createTile(coords);

            this._initTile(img);

            // 06/02/20 GWTK.DomUtil.setPosition(img, pos);

            var url = this.getTileUrl(this._limitCoords(coords)), index = this._listIndex;

            this._swapUrls();

            var item = { el: img, coords: coords, current: true, src: url, xhr: false, list_index: index };

            this._tiles[key] = item;

            this.sendRequest(item);

            return img;
        },

        /**
         * Создать тайл 
         * @method createTile
         * @param coords {GWTK.Point} координаты тайла, {x:столбец,y:строка,z:зум}
         * @return {DOM object} HTML элемент тайла, img
         */
        createTile: function (coords) {
            var elem = null,
                layer = this,
                coord = coords;

            if (this._tileStock.length > 0) {
                elem = this._tileStock.pop();                           // берем элемент из кэша
            }
            else {
                elem = document.createElement('img');                   // создаем новый элемент                 
            }
            this._initTile(elem);

            if (this._nodrawing) {
                $(elem).addClass('tile-nodrawing');
            }

            elem.onload = function (event) { layer._onLoadTile(coords, this); };

            $(elem).on('error', function (e) { layer._onErrorTile(coords, this); });

            elem.alt = '';

            //var url = this.getTileUrl(this._limitCoords(coords));

            //elem.src = url;

            return elem;
        },

        /**
         * Обработчик успешной загрузки рисунка элемента тайла
         * @method _onLoadTile
         */
        _onLoadTile: function (coords, elem) {
            this._tileReady(coords, false, elem);
        },

        /**
         * Обработчик ошибки загрузки рисунка тайла
         * @method _onErrorTile
         */
        _onErrorTile: function (coords, elem) {
            if (elem.getAttribute('src') !== this.errorImage) {
                elem.src = this.errorImage;
            }
            this._tileReady(coords, true, elem);
        },

        /**
         * Обработчик загрузки рисунка тайла
         * @method _tileReady
         */
        _tileReady: function (coords, err, elem) {
            if (!elem) return;
            if (!coords) {
                var $img = $(elem),
                coords = GWTK.point($img.attr('_x'), $img.attr('_y'));
                coords.z = $img.attr('_z');
            }
            var key = this._getTileKey(coords),
            tile = this._tiles[key];
            if (!tile) {
                $(elem).addClass('tile-loaded')
                return;
            }
            tile.loaded = +new Date();     
            if (!err) {
                $(tile.el).addClass('tile-loaded');
                if ($(tile.el).hasClass('tile-nodrawing')) {
                    $(tile.el).removeClass('tile-nodrawing');
                }
                // else {
                //     this._drawTile(tile, this.map.getPixelMapTopLeft());
                // }
            }
            else {
                $(tile.el).removeClass('tile-loaded');
                $(tile.el).removeClass('tile-nodrawing');
            }
            
            if (this._areAllLoaded()) {
                this._loading = false;
                this._flag = true;
                this._resetTiles();
            }
            else {
                if (typeof (this._updatetime) !== "undefined"){
                    if (tile.loaded - this._updatetime >= 250 && this._loading) {
                        $(this.map.eventPane).trigger({ 'type': 'refreshmap', 'cmd': 'draw', 'id': this.xId });
                        //this._updatetime = +new Date();
                        
                    }
                }
            }
 
        },

        /**
         * Переустановить тайлы слоя
         * @method _resetTiles
         */
        _resetTiles: function () {
            if (!this.map) {
                return;
            }
            if (this._flag && this.visible) {
                this._flag = false;
                $(this.map.eventPane).trigger({ 'type': 'refreshmap', 'cmd': 'draw', 'id': this.xId });
            }
            var key, tile;
            var zoom = this.map.getZoom();
            if (zoom > this.options.maxzoomview || zoom < this.options.minzoomview) {
                this._removeAllTiles();
                this._removeObjectUrl();
                return;
            }
            for (key in this._tiles) {
                tile = this._tiles[key];
                tile.hold = tile.current;
            }
            for (key in this._tiles) {
                if (!this._tiles[key].hold) {
                    this._removeTile(key);
                }
            }
            // ??? this._removeObjectUrl();
        },

        /**
         * Прервать загрузку рисунков 
         * @method canselLoading
         */
        canselLoading: function () {
            var urlCreator = window.URL || window.webkitURL;
            for (var i in this._tiles) {
                if (this._tiles[i].coords.z !== this._tileZoom) {
                    var tile = this._tiles[i].el;
                    tile.onload = GWTK.Util.falseFunction;
                    tile.onerror = GWTK.Util.falseFunction;
                    if (!tile.current) {
                        urlCreator.revokeObjectURL(tile.src);
                        tile.src = this.errorImage;
                        this._tileStock.push(tile);
                        $(tile).remove();
                        delete this._tiles[i];
                    }
                }
            }

            return false;
        },

        /**
         * Удалить тайл по ключу 
         * @method _removeTile
         * @param key {string} ключ тайла в списке тайлов
         */
        _removeTile: function (key) {
            var tile = this._tiles[key];
            if (!tile) { return; }
            this._revokeUrl.push(tile.el.src);
            tile.el.setAttribute('src', this.errorImage);
            $(tile.el).off();
            this._tileStock.push(tile.el);
            $(tile.el).remove();
            delete this._tiles[key];
        },

        /**
         * Удалить все тайлы слоя
         * @method _removeAllTiles
         */
        _removeAllTiles: function () {
            if (this.layerContainer == null || !this.map) return;
            for (var key in this._tiles) {
                this._removeTile(key);
            }
            this._tiles = [];
            return;
        },

        /**
         * Инициализировать тайл
         * @method _initTile
         * @param tile {Object} DOM-объект тайла
         */
        _initTile: function (tile) {
            $(tile).addClass('gwtk-tile-elem');
            var tileSize = this.getTileSize();
            tile.style.width = tileSize.x + 'px';
            tile.style.height = tileSize.y + 'px';

            tile.onselectstart = GWTK.Util.falseFunction;
            tile.onmousemove = GWTK.Util.falseFunction;
            return;
        },

        /**
         * Нормализовать координаты тайла с ограничением по габаритам
         * @method _limitCoords
         * @param coords {GWTK.Point} координаты тайла в матрице, {x:колонка, y:строка,z:zoom}
         * @return {GWTK.Point} координаты тайла с учетом повторения в окне
         */
        _limitCoords: function (coords) {
            var newCoords = GWTK.point(
                this._limitX ? GWTK.Util.wrapNum(coords.x, this._limitX) : coords.x, coords.y);
                //this._limitY ? GWTK.Util.wrapNum(coords.y, this._limitY) : coords.y);
            newCoords.z = coords.z;
            return newCoords;
        },

        /**
         * Проверить загрузку рисунков тайлов 
         * @method _areAllLoaded
         * @return {Boolean} `true` - загружены все рисунки
         */
        _areAllLoaded: function () {
            for (var key in this._tiles) {
                if (!this._tiles[key].loaded) { return false; }
            }
            return true;
        }, 

        /**
         * Получить ключ тайла по координатам
         * @method _getTileKey
         */
        _getTileKey: function (coords) {
            return coords.x + '__' + coords.y + '__' + coords.z;
        },

        /**
         * Получить координаты тайла по ключу 
         * @method _getTileKey
         */
        _getTileCoords: function (key) {
            var arr = key.split('__'),
                coords = GWTK.point(+arr[0], +arr[1]);
            coords.z = +arr[2];
            return coords;
        },

        /**
         * Получить габариты тайла по ключу 
         * @method _getTileBounds
         * @return {GWTK.latLngBounds} геогабариты тайла
         */
        _getTileBounds: function (key) {
            return this._tileCoordToBounds(this._getTileCoords(key));
        },

        /**
         * Преобразовать координаты тайла в габариты 
         * @method _tileCoordToBounds
         * @param coords {GWTK.Point} {x:столбец, y:строка}
         * @return {GWTK.latLngBounds} геогабариты тайла
         */
        _tileCoordToBounds: function (coords) {
            var tileSize = GWTK.point(this.tileWidth, this.tileHeight);
            var tl = coords.scaleBy(tileSize),
                br = tl.add(tileSize),
                nw = GWTK.tileView.pixel2geo(tl, this.map, coords.z),
                se = GWTK.tileView.pixel2geo(br, this.map, coords.z),
                bounds = GWTK.latLngBounds([nw, se]);
            // bounds = this.map.wrapLatLngBounds(bounds);            // !!!!!!!!!!!!!!!!!!!!
            return bounds;

        },

        /**
         * Получить габариты отображения для центра окна  
         * @method _getTilePixelBounds
         * @param center {GWTK.Point} координаты центра {x,y}, пикселы от начала координат матрицы текущего zoom
         * @return {GWTK.Bounds} габариты, {min:GWTK.Point,max:GWTK.Point}, пикселы матрицы
         */
        _getTilePixelBounds: function (center) {
            var pixcenter = center !== undefined ? center : this.map.getCenterPixel(),
                half = this.map.getSize().divideBy(2);
            return GWTK.bounds(pixcenter.subtract(half), pixcenter.add(half));
        },

        isValidTile: function (coords) {
            return this.checkBounds();
        },

        /**
         * Получить положение элемента тайла от начала отображения  
         * @method _getTilePos
         * @param coords {GWTK.Point} координаты тайла, пикселы
         * @return {GWTK.Point} координаты, пикселы
         */
        _getTilePos: function (coords) {
            return coords.scaleBy(this._tileSize).subtract(this._origin);
        },

        /**
          * Запросить параметры тайла для точки 
          * @method getTileForPoint
          * @param point {GWTK.Point} координаты точки, пикселы
          */
         getTileForPoint: function (point) {
            if (!(point instanceof GWTK.Point)) {
                return false;
            }
            var matrixW = GWTK.tileView.globalTileMatrixSizePixel(this.map, this.map.getZoom).max.x; //Math.pow(2, this.map.options.tilematrix) * 256.0,
                t = [];
            if (point.x < 0 || point.x >= matrixW) { return false; }
            var tx = point.x / 256.0, ty = point.y / 256.0;
            t[0] = parseInt(tx, 10);
            t[1] = parseInt(ty, 10);
            t[2] = point.x % 256.0;
            t[3] = point.y % 256.0;
            t[4] = point.x;
            t[5] = point.y;

            return t;
        },

        /**
         * Установить габариты видимых тайлов 
         * (диапазон рядов, диапазон колонок)
         * @method setBounds
         */
        setBounds: function () {
            this.bounds = null;
            if (this.options == null || this.options == undefined)
                return;
            if ("bbox" in this.options == false || this.options.bbox.length != 4)
                return;
            
            // SW
            var plane = GWTK.projection.geo2xy(this.map.options.crs, this.options.bbox[0], this.options.bbox[1]);
            plane = GWTK.point(plane[1], plane[0]);
            var upPos = GWTK.tileView.getTileLayerData(this.map.options.tilematrix, this.map, plane);
            // NE
            plane = GWTK.projection.geo2xy(this.map.options.crs, this.options.bbox[2], this.options.bbox[3]);
            plane = GWTK.point(plane[1], plane[0]);
            var lowPos = GWTK.tileView.getTileLayerData(this.map.options.tilematrix, this.map, plane);
            this.bounds = { "colls": [], "rows": [] };
            
            if (upPos[0] < lowPos[0])                          // диапазон колонок
                this.bounds.colls = [upPos[0], lowPos[0]];
            else
                this.bounds.colls = [lowPos[0], upPos[0]];

            if (upPos[1] < lowPos[1])                          // диапазон рядов
                this.bounds.rows = [upPos[1], lowPos[1]];
            else
                this.bounds.rows = [lowPos[1], upPos[1]];
            return;
         },

        /**
         * Проверить габариты тайлов
         * @method checkBounds
         * @return {Boolean} true/false
         */
        checkBounds: function () {
            if (this.bounds == null) return true;
            
            if (this._tilezoom == undefined) { return false; }
            var center = this.map.getCenterPixel(); center._floor();
            var bounds = this._getTilePixelBounds(center), 
                tileRange = this._pixelBoundsToTileRange(bounds),     
                colls = [tileRange.min.x, tileRange.max.x],
                rows = [tileRange.min.y, tileRange.max.y];
            
            if (colls[1] < this.bounds.colls[0] || colls[0] > this.bounds.colls[1] ||
                rows[1] < this.bounds.rows[0] || rows[0] > this.bounds.rows[1]) {
                return false;
            }

            return true;
        },

        /** deprecated !
         * Проверить отображение слоя по границам видимости 
         * @method checkVisibility
         */
        checkVisibility: function ()
        {
            var visible = true;

            if (this.minZoomView() != -1 || this.maxZoomView() < 23)
            {
                // Если текущий масштаб не попадает в границы видимости слоя
                if (this.map.options.tilematrix < this.minZoomView())
                    visible = false;
                else if (this.map.options.tilematrix > this.maxZoomView())
                    visible = false;
                if (visible) {
                    if (this.getVisibility()) {
                        this.show();
                    }
                }
                else {
                    this.hide();
                }
            }
            
            return;
        },

        /**
         * Запросить минимальный масштабный коэффициент видимости слоя
         * @method minZoomView
         * @return {Number} options.minzoomview или -1 
         */
        minZoomView: function () {
            if (!this.options || !this.options.minzoomview) return -1;
            return this.options.minzoomview;
        },

        /**
         * Запросить максимальный масштабный коэффициент видимости слоя
         * @method maxZoomView
         * @return {Number} options.maxzoomview или -1 
         */
        maxZoomView: function () {
            if (!this.options || !this.options.maxzoomview) return 22;
            return this.options.maxzoomview;
        },

        /**
         * Получить ссылку для тайла по значению строки, столбца и масштаба
         * @method getTileUrl
         * @param coords {GWTK.Point} координаты тайла, x-номер строки, y-номер столбца, z - zoom
         * @return {string} строка запроса рисунка тайла
         */
        getTileUrl: function (coords) {
            return this.getFileName(coords.x, coords.y);
        },

        /**
         * Получить ссылку для тайла по значению строки, столбца и масштаба
         * @method getFileName
         * @param r {Number}, номер строки матрицы тайлов
         * @param c {Number}, номер столбца матрицы тайлов
         */
        getFileName: function (c, r)
        {
            if (this.bounds != null) {
                if (r < this.bounds.rows[0] || r > this.bounds.rows[1] || c < this.bounds.colls[0] || c > this.bounds.colls[1])
                    return this.errorImage;
            }
            if (!this.visible || !this.checkViewZoom()) {
                return this.errorImage;
            }
            if (this._limitY && (r < this._limitY[0] || r >= this._limitY[1])) {
                return this.errorImage;
            }
            var r = r;  
            if (this.getRowFunction) {
                r = this.getRowFunction({ "row": r, "z": this.map.options.tilematrix });
            }
            //var src = this.options.url.replace(/%y/, r);
            var src = this._urlsList[this._listIndex].replace(/%y/, r);
            src = src.replace(/%x/, c);
            src = src.replace(/%z/, this.map.getZoom());
            src = src.replace(/%tilematrixset/, this.tilematrixset);
            return src;
        },

        _swapUrls: function(){
            if (this._urlsList.length < 2){
                return;
            }
            //this._urlsList.push(this._urlsList[0]);
            //this._urlsList.splice(0, 1);
            this._listIndex += 1;
            this._listIndex >= this._urlsList.length ? this._listIndex = 0 : this._listIndex;
        },

        /**
         * Проверить возможность поиска по названию для слоя
         * @method isTextSearch
         * @return {Boolean} true/false, возможен/нет
         */
        isTextSearch: function () {
            if (!this.getVisibility()) return false;
            if (GWTK.Util.isArray(this.keysTextSearch) && this.keysTextSearch.length > 0 && this.keysTextSearch[0].length > 0)
                return true;
            return false;
        },

        /**
         * Запросить параметры поиска по названию для слоя
         * @method getTextFilterKeys
         * @return {String} список ключей семантик через запятую или пустая строка
         */
        getTextFilterKeys: function () {
            if (!this.isTextSearch)
                return "";
            var res = [];
            var j = 0;
            for (var i=0; i < this.keysTextSearch.length; i++)
            {
                if (this.keysTextSearch[i] != undefined && this.keysTextSearch[i] != null && this.keysTextSearch[i].length > 0)
                    res[j] = this.keysTextSearch[i]; j++;
            }
  
            return res.toString();
        },

        /**
         * Установить уровень прозрачности изображения
         * @method setOpacity
         * @param value {Number} значение прозрачности,
         * число из диапазона [0.0; 1.0], 0 - полная непрозрачность
         */
        setOpacity: function (value, show) {
            if (this.options.duty) { return; }
            if (isNaN(value) || !this.$container) return;
            if (value > 1) value = 1;
            this.$container.css('opacity', value);
            if (show && this.visible) {
                $(this.map.eventPane).trigger({ 'type': 'refreshmap', 'cmd': 'draw', 'id': this.xId });
            }
        },

        /**
         * Инициализировать параметры непрозрачности изображения
         * @method initOpacity
         * @param opacity {Number} значение непрозрачности в % - от 0 до 100
         * @return {Number} css значение непрозрачности
         * @public
         */
        initOpacity: function (opacity) {
            if (!this.options) {
                return;
            }

            if (!$.isNumeric(this.options.opacityValue)) {
                this.options.opacityValue = 100;
            }

            if ($.isNumeric(opacity)) {
                var new_opacity = parseInt(opacity);
                if (new_opacity > 100){ new_opacity = 100; } 
                if (new_opacity < 0) { new_opacity = 0; }
                this.options.opacityValue = new_opacity;
            }

            return this.getOpacityCss();
        },

        /**
         * Получить непрозрачность css по параметрам
         * @method getOpacityCss
         * @param opacity {Number} значение непрозрачности в % - от 0 до 100
         * @return {Number} css значение непрозрачности
         * @public
         */
        getOpacityCss: function () {
            if (!this.options) return '';
            if (typeof this.options.opacityValue === 'undefined') {
                this.options.opacityValue = 100;
            }

            return ((Number(parseFloat(this.options.opacityValue) / 100.0)).toFixed(2));
        },

        /**
         * Запросить рисунок тайла
         * @method sendRequest
         * @param tile {JSON} описание тайла из массива _tiles
         * @public
         */
        sendRequest: function (tile) {
            if (typeof tile === "undefined" || typeof tile.el === "undefined") return;
            if (tile.src == this.errorImage){                        // запрос не требуется
                this._onErrorTile(tile.coords, tile.el);
                return;
            }
            if (!this._usexhr){
                tile.el.src = tile.src;
                return;
            }
            if (tile.xhr && tile.xhr.url !== tile.src) {
                tile.xhr.abort();
            }
            else {
                tile.xhr = new this.XHR();
            }
            var xhr = tile.xhr;
            xhr.context = this;                                       // контекст запроса
            xhr.tkey = this._getTileKey(tile.coords);                 // ключ тайла
            xhr.onerror = this._onErrorXhr;  
            xhr.onload = this._onLoadXhr;
            
            xhr.onloadstart = function(ev) {
                xhr.responseType = "blob";
            }

            xhr.open('GET', tile.src, true);
                       
            if (this.map.authTypeServer(tile.src) || this.map.authTypeExternal(tile.src)){    
                xhr.withCredentials = true;                            // внешняя авторизация на сервисе или pam
            } else {
                var token = this.map.getToken();                       // авторизация токеном
                if (token && this.options.token) {
                    xhr.setRequestHeader(GWTK.AUTH_TOKEN, token);
            }
        }
            
            xhr.send();
        },

        /**
         * Обработчик ошибки запроса рисунка 
         * @method _onErrorXhr
         */
        _onErrorXhr: function (e) {
            // if (this.status == 0){
            //     var tile = this.context._tiles[this.tkey];
            //     tile.el.src = tile.src;
            //     return;
            // }
            if (typeof this.context === 'undefined') return;
            var tile = this.context._tiles[this.tkey];
            if (tile) {
                this.context._onErrorTile(tile.coords, tile.el);
            }
        },

        /**
         * Обработчик успешного запроса рисунка 
         * @method _onErrorXhr
         */
        _onLoadXhr: function (e) {
            var urlApi = window.URL || window.webkitURL;
            if (typeof this.context === 'undefined') return;
            if (this.response && this.response.type.search('image') == -1) {
                this.onerror(e);
            }
            else {
                var src = urlApi.createObjectURL(this.response),
                tile = this.context._tiles[this.tkey];
                if (tile) {
                    if (tile.el.src && tile.el.src.indexOf('blob:http:') > -1) {
                        this.context._revokeUrl.push(tile.el.src);
                    }
                    tile.el.src = src;
                }
            }
            return;
        },
          
        /**
         * Удалить blob-объекты 
         * @method _removeObjectUrl
         */
        _removeObjectUrl: function () {

            var urlApi = window.URL || window.webkitURL;
            for (var k in this._revokeUrl) {
                if (this._revokeUrl[k] == undefined) {
                    this._revokeUrl.shift();
                    continue;
                }
                try {
                    urlApi.revokeObjectURL(this._revokeUrl[k]);
                    this._revokeUrl.shift();
                }
                catch (msg) { }
            }
        },

        /**
         * Проверить запрос тайла через xhr 
         * @method _xhrTest
         * @returns {Boolean} 'true'-запрос успешно выполнился 
         */
        _xhrTest: function () {
            this._usexhr = true;
            if (!this.map) return;
            var token = this.map.getToken();                       
            if (token && this.options.token) {
                return true;
            }
            
            if (this.options.gis) { return true; }
            if (this.options.url.indexOf(this.map.options.url) != -1){ return true; }

            var server = GWTK.Util.getServerUrl(this.options.url).toLowerCase();
            if (server.indexOf('openstreetmap.') > -1){
                return true;
            }
            else{
                if (server.indexOf('google.') > -1 
                    || server.indexOf('rosreestr.') > -1
                    || server.indexOf('arcgis') > -1){
                        return true;
                }
            }

            var zoom = this.map.getZoom(),
            center = this.map.getCenterPixel();
            center._floor();
            var bounds = this._getTilePixelBounds(center),
                tileRange = this._pixelBoundsToTileRange(bounds),  
            tileCenter = tileRange.getCenter()._ceil();
            var r = tileCenter.y;  
            if (this.getRowFunction) {
                r = this.getRowFunction({ "row": r, "z": zoom });
            }
            var src = this.options.url.replace(/%y/, r);
            src = src.replace(/%x/, tileCenter.x);
            src = src.replace(/%z/, zoom);
            src = src.replace(/%tilematrixset/, this.tilematrixset);
            
            var xhr = new this.XHR();
            xhr.onloadstart = function() {
                xhr.responseType = "blob";
            }
            
            xhr.open('GET', src, false);

            if (this.map.authTypeServer(src) || this.map.authTypeExternal(src)){    
                xhr.withCredentials = true;                            
            }
            var status = true;
            try {
                xhr.send();
                if (xhr.status !== 200) {
                    status = false;
                } 
            } catch(err) { 
                status = false;
            }
            return status;
        } 
    };

    GWTK.tileLayer = function (map, options)
    {
        return new GWTK.TileLayerOld(map, options);
    };

};
