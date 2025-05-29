/**************************************** Гиман Н.     30/11/17 *****
 **************************************** Соколова Т.  23/04/19 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент  управление клатеризацией             *
 *                                                                  *
 *                          GWTK SE                                 *
 *******************************************************************/
/**
 * Map Clusterizator
 * @author: Anatoly Kozhanov (skier2006@mail.ru)
 * @version: 1.1 - 04/11/2015
 * @version: 1.2 - 23/12/2015
 **/

//changes
//Kozhanov 23.12.2015 добавил анимацию + рефакторинг
//Kozhanov 25.12.2015 правил методы _readMarkers, clusterify, clusterifyFrom
//Kozhanov 27.12.2015 правил _animationSupported
//Kozhanov 31.12.2015 правил showConvexHull, getConvexHullMBR
//Kozhanov 11.01.2016 правил GWTK.markerhandlers.mouseenter, GWTK.markerhandlers.mouseleave
//                    добавил GWTK.mapclusterizator._addUnwrappedCluster,
//                    добавил GWTK.mapclusterizator._removeUnwrappedCluster, GWTK.mapclusterizator._wrapAllClusters

import GeoPoint from '~/geo/GeoPoint';

if (window.GWTK) {
    /**
     * Преобразование координат согласно проекции (базовый класс)
     * @class GWTK.Transformation
     * @param a - матрица преобразования
     * @param b - матрица преобразования
     * @param c - матрица преобразования
     * @param d - матрица преобразования
     * @constructor GWTK.Transformation
     */
    GWTK.Transformation = function(a, b, c, d) {
        this._a = a;
        this._b = b;
        this._c = c;
        this._d = d;
    };
    
    GWTK.Transformation.prototype = {
        /**
         * Преобразование и масштабирование точки
         * @method transform
         * @param point - преобразуемая точка
         * @param scale - масштаб
         * @return {*}
         */
        transform: function(point, scale) {
            scale = scale || 1;
            point.x = scale * (this._a * point.x + this._b);
            point.y = scale * (this._c * point.y + this._d);
            return point;
        },
        /**
         * "восстановить" точку после преобразований
         * @method untransform
         * @param point - преобразованная точка
         * @param scale - масштаб
         */
        untransform: function(point, scale) {
            scale = scale || 1;
            return new GWTK.Point(
                (point.x / scale - this._b) / this._a,
                (point.y / scale - this._d) / this._c);
        }
    };
    /**
     * Класс строит выпуклую оболочку построение выпуклой оболочки. (алгоритм Джарвиса)
     * @param markers - массив маркеров
     * @param zoom - масштаб
     * @constructor GWTK.ConvexHullHelper
     */
    GWTK.ConvexHullHelper = function(markers, zoom) {
        this._src = markers;
        this._zoom = zoom;
        this._dst = new Array(this._src.length);
        for (var i = 0; i < this._src.length; i++) {
            this._dst[i] = this._src[i];
        }
    };
    GWTK.ConvexHullHelper.prototype = {
        /**
         * Вычисление векторного произведения
         * @method _vect
         * @param a1
         * @param a2
         * @param b1
         * @param b2
         * @return {number}
         * @private
         */
        _vect: function(a1, a2, b1, b2) {
            return ((a2.x - a1.x) * (b2.y - b1.y) - (b2.x - b1.x) * (a2.y - a1.y));
        },
        /**
         * Вычисление расстояния
         * @method _dist2
         * @param a1 - точка
         * @param a2 - точка
         * @return {number}
         * @private
         */
        _dist2: function(a1, a2) {
            return (((a2.x - a1.x) * (a2.x - a1.x)) + ((a2.y - a1.y) * (a2.y - a1.y)));
        },
        /**
         * Построение выпуклой оболочки
         * @method _makeConvexHull
         * @param src - исходный массив маркеров
         * @param dst - буфер для вычислений
         * @return {Blob|ArrayBuffer|string|*}
         * @private
         */
        _makeConvexHull: function(src, dst) {
            var zoom = this._zoom;
            this.m = 0;
            //ищем правую нижнюю точку
            for (var i = 1; i < src.length; i++) {
                var srcXYi = src[i].getXY();
                var srcXYm = src[this.m].getXY();
                if (srcXYi.y < srcXYm.y) {
                    this.m = i
                }else if (srcXYi.y === srcXYm.y && srcXYi.x > srcXYm.x) {
                    this.m = i
                }
            }
            dst[0] = src[this.m];
            src[this.m] = src[0];
            src[0] = dst[0];
            
            this.k = 0;
            this.min = 1;
            
            var dst0XY = dst[0].getXY();
            do {
                var dstkXY = dst[this.k].getXY();
                //ищем очередную вершину оболочки
                for (var j = 1; j < src.length; j++) {
                    var srcMinXY = src[this.min].getXY();
                    var srcjXY = src[j].getXY();
                    if ((this._vect(
                            dstkXY,
                            srcMinXY,
                            dstkXY,
                            srcjXY) < 0) ||
                        (
                            (this._vect(
                                dstkXY,
                                srcMinXY,
                                dstkXY,
                                srcjXY) === 0) &&
                            (this._dist2(
                                    dstkXY,
                                    srcMinXY) <
                                this._dist2(
                                    dstkXY,
                                    srcjXY))
                        )) this.min = j;
                }
                this.k++;
                //записана очередная вершина
                dst[this.k] = src[this.min];
                this.min = 0;
                dstkXY = dst[this.k].getXY();
            }
                //пока ломаная не замкнется
            while (!((dstkXY.x === dst0XY.x) &&
                (dstkXY.y === dst0XY.y)))
            
            return dst.slice(0, this.k);
        },
        /**
         * Получить выпуклую оболочку
         * @method getConvexHull
         * @return {*}
         */
        getConvexHull: function() {
            if (this._src && this._src.length > 0) {
                return this._makeConvexHull(this._src, this._dst);
            }
            return [];
        }
    };
    
    
    
    /**
     * Вспомогательные функции кластеризатора
     * @type {{setCSSEvent: GWTK.ClusterizationUtils.setCSSEvent, _isNumber: GWTK.ClusterizationUtils._isNumber, _geo2pixelOffset: GWTK.ClusterizationUtils._geo2pixelOffset, _geoObj2pixelOffset: GWTK.ClusterizationUtils._geoObj2pixelOffset, _getTransformation3857: GWTK.ClusterizationUtils._getTransformation3857, _getTransformation3395: GWTK.ClusterizationUtils._getTransformation3395, _getTransformation4326: GWTK.ClusterizationUtils._getTransformation4326, _getTransformationSimple: GWTK.ClusterizationUtils._getTransformationSimple, _geoToPoint: GWTK.ClusterizationUtils._geoToPoint, _geoObjToPoint: GWTK.ClusterizationUtils._geoObjToPoint, _getScale: GWTK.ClusterizationUtils._getScale, _scale: GWTK.ClusterizationUtils._scale, getPlace: GWTK.ClusterizationUtils.getPlace, stamp}}
     */
    GWTK.ClusterizationUtils = {
        /**
         * Установить CSS события
         * @method setCSSEvent
         * @param element - элемент
         * @param type - тип
         * @param callback - функция обратного вызова
         */
        setCSSEvent: function(element, type, callback) {
            var pfx = ["webkit", "moz", "MS", "o", ""];
            for (var p = 0; p < pfx.length; p++) {
                if (!pfx[p]) type = type.toLowerCase();
                element.addEventListener(pfx[p] + type, callback, false);
            }
        },
        
        /**
         * Является ли n числом
         * @method _isNumber
         * @param n - число
         * @return {boolean}
         * @private
         */
        _isNumber: function(n) {
            var nb = parseFloat(n);
            return typeof nb === 'number' && isFinite(nb);
        },
        /**
         * Перевод гео координат в оконные
         * @method _geo2pixelOffset
         * @param map - карта
         * @param geo - гео точка (объект LatLng)
         * @param zoom - масштаб
         * @param cut  - округлять
         * @return {*}
         * @private
         */
        _geo2pixelOffset: function(map, geo, zoom, cut) {
            if (!geo) return;
            // var pixel = GWTK.tileView.geo2pixelOffset(map, geo);
            var pixel = map.geoToPixel(new GeoPoint(geo.lng, geo.lat, 0, map.ProjectionId), zoom);
            if (cut) {
                pixel.x = Math.floor(pixel.x);
                pixel.y = Math.floor(pixel.y);
            }
            return pixel;
        },
        /**
         * Перевод гео координат объекта в оконные
         * @method _geoObj2pixelOffset
         * @param object - собственно гео объект
         * @param zoom - масштаб
         * @return {*}
         * @private
         */
        _geoObj2pixelOffset: function(object, zoom) {
            var geo = object.getLatLng();
            if (!geo) return;
            var map = object.getMap();
            // var plane = GWTK.projection.geo2xy(map.options.crs, geo.lat, geo.lng);
            // var pos = GWTK.tileView.getTileLayerData(zoom, map, GWTK.point(plane[1], plane[0]));
            // var pixel = map.tiles.getLayersPointOffset(pos);
            // return pixel;
            return map.geoToPixel(new GeoPoint(geo.lng, geo.lat, 0, map.ProjectionId), zoom);
        },
        /**
         * Получить объект преобразования для проекции 3857
         * @method _getTransformation3857
         * @return {GWTK.Transformation}
         * @private
         */
        _getTransformation3857: function() {
            if (!this._transformation3857) {
                this._transformation3857 = new GWTK.Transformation(0.5 / Math.PI, 0.5, -0.5 / Math.PI, 0.5);
            }
            return this._transformation3857;
        },
        /**
         * Получить объект преобразования для проекции 3395
         * @method _getTransformation3395
         * @return {GWTK.Transformation}
         * @private
         */
        _getTransformation3395: function() {
            if (!this._transformation3395) {
                var r = 6378137;
                var scale = 0.5 / (Math.PI * r);
                this._transformation3395 = new GWTK.Transformation(scale, 0.5, -scale, 0.5);
            }
            return this._transformation3395;
        },
        /**
         * Получить объект преобразования для проекции 4326
         * @method _getTransformation4326
         * @return {GWTK.Transformation}
         * @private
         */
        _getTransformation4326: function() {
            if (!this._transformation4326) {
                this._transformation4326 = new GWTK.Transformation(1 / 360, 0.5, -1 / 360, 0.5);
            }
            return this._transformation4326;
        },
        /**
         * Получить "простой" объект преобразования
         * @method _getTransformationSimple
         * @return {GWTK.Transformation}
         * @private
         */
        _getTransformationSimple: function() {
            if (!this._transformationSimple) {
                this._transformationSimple = new GWTK.Transformation(1, 0, -1, 0);
            }
            return this._transformationSimple;
        },
        /**
         * Перевод гео координат в оконные (ускоренный)
         * @method _geoToPoint
         * @param map - карта
         * @param geo - гео точка (объект LatLng)
         * @param zoom - масштаб
         * @private
         */
        _geoToPoint: function(map, geo, zoom) {
            var CRS = map.options.crs;
            var planeArr = new GeoPoint(geo.lng, geo.lat, 0, map.ProjrctionId).toMapPoint().toOrigin();
            var plane = { x: planeArr[0] / 6378137.0, y: planeArr[1] / 6378137.0 }; //?
            var transformation = null;
            if (CRS === 3857 || CRS === '3857') transformation = this._getTransformation3857();
            if (CRS === 3395 || CRS === '3395') transformation = this._getTransformation3395();
            if (CRS === 4326 || CRS === '4326') transformation = this._getTransformation4326();
            if (!transformation) transformation = this._getTransformationSimple();
            return transformation.transform(plane, this._scale(map, zoom));
        },
        /**
         * Получить оконные координаты для объекта obj (ускоренный)
         * @method _geoObjToPoint
         * @param obj - собственно гео объект
         * @param zoom - масштаб
         * @private
         */
        _geoObjToPoint: function(obj, zoom) {
            var map = obj.getMap();
            var CRS = map.Translate.EpsgCode;
            var xy = obj.getXY();
            if (!xy) {
                var geo = obj.getLatLng();
                var planeArr = new GeoPoint(geo.lng, geo.lat, 0, map.ProjectionId).toMapPoint().toOrigin();
                xy = { x: planeArr[0], y: planeArr[1] };
                obj._planeXY = xy;
            }
            var plane = null;
            // var plane = { x: xy.x / 6378137.0, y: xy.y / 6378137.0 }; //?
            // var plane = { x: xy.x, y: xy.y }; //?
            var transformation = null;
            if (CRS === 3857 || CRS === '3857') {
                plane = { x: xy.x / 6378137.0, y: xy.y / 6378137.0 };
                transformation = this._getTransformation3857();
            }
            if (CRS === 3395 || CRS === '3395') {
                plane = { x: xy.x, y: xy.y }; //пересчет для 3395
                transformation = this._getTransformation3395();
            }
            if (CRS === 4326 || CRS === '4326') {
                transformation = this._getTransformation4326();
            }
            if (!transformation) transformation = this._getTransformationSimple();
            var scale = this._scale(map, zoom);
            var result = transformation.transform(plane, scale);
            return result;
        },
        /**
         * Получить коэфициент масштабирования для зума
         * @method _getScale
         * @param map - карта
         * @param zoom - зум
         * @return {*}
         * @private
         */
        _getScale: function(map, zoom) {
            if (!this._scales) {
                this._scales = [];
                this._scales.push(0); //stub;
                var maxZoom = map.options.maxzoom;
                if (!maxZoom)
                    maxZoom = 17;
                for (var z = 1; z <= maxZoom; z++) {
                    this._scales.push(0);
                    this._scales[z] = Math.pow(2, z) << 8;
                }
            }
            return this._scales[zoom];
        },
        /**
         * Получить коэфициент масштабирования для зума
         * @method _scale
         * @param map - карта
         * @param zoom - зум
         * @return {*}
         * @private
         */
        _scale: function(map, zoom) {
            return this._getScale(map, zoom);
        },
        /**
         * Получить оконные координаты для объекта
         * @method getPlace
         * @param object - собственно гео объект
         * @param zoom - масштаб
         * @return {*}
         */
        getPlace: function(object, zoom) {
            return GWTK.ClusterizationUtils._geoObjToPoint(object, zoom);
        },
        /**
         * Записать в поле объекта уникальный номер
         */
        stamp: (function() {
            var lastId = 0,
                key = '_GWTK_id';
            return function(obj) {
                obj[key] = obj[key] || ++lastId;
                return obj[key];
            };
        }())
        
    };
    /**
     * Кластеризатор
     * @constructor GWTK.mapclusterizator
     * @param map - карта
     * @param options - объект с параметрами {
     * icon: путь к изображению,
     * url: адрес сервера,
     * markerevents: {"mouseenter": false, "mouseleave": false} - обработчики наведения мыши (если = true при наведении мыши появляется всплывающий балун )
     * markerhint:  - пользовательская информация о маркере при всплывающем балуне ( при отстуствии выводиться ВСЯ информация об объекте из элемента 'properties')
     * {
     *     propertiesname:  - наименование ключа, в котором хранится hint (по умолчанию  '_clusterhint')
     * },
     * cellsize: - размер ячейки класстеризации (по умолчанию 80 (пиксел))
     * customimageclasters:  -  ссылки на пользовательские изображения для отображения кластеров
     * 	{
     * 	small: "http://...",		размер 40х40
     * 	medium: "http://...",		размер 40х40
     * 	large: "http://...",		размер 40х40
     * 	verylarge: "http://...",  	размер 46х46
     * 	huge: "http://..."		 	размер 52х52
     * 	}
     */
    GWTK.mapclusterizator = function(map, options) {
        this.id = "ctorCanvasPane";
        this._map = map;
        this.url = options['url'] || map.options["clusterifyURL"];
        this._options = options;
        this.setUseAnimation(options && options.useAnimation);
        this.maxZoom = this._map.tileMatrix.Ogc.ScaleDenominator.length - 1;
        this.scaleInit = this._map.getZoomScale(this.maxZoom);
        this.scaleCurr = this._map.getZoomScale(this._map.options.tilematrix);
        this._objects = [];
        this.markers = [];
        this._updateCount = 0;
        this._animPhaseDelay = 200;
        this._activeMarkerHandler = null;
        this._unwrappedClusters = [];
        if (!options.markerSize) {
            this._options.markerSize = GWTK.point(32, 32);
        }
        
        this.overlayPaneCss = "gwtk-tiles GWTK-ctor-overlay-pane";
        this.overlayPaneSelector = ".gwtk-tiles.GWTK-ctor-overlay-pane";
        this.overlayCanvasCss = "GWTK-ctor-overlay-canvas";
        this.init();
    };
    
    GWTK.mapclusterizator.prototype = {
        /**
         * Инициализация div-ов и обработчиков событий карты
         * @method init
         */
        init: function() {
            this.clusterizatorId = GWTK.Util.randomInt(300, 500);
            this._initPanes();
            this._initEvents();
            this._strategy = new GWTK.clusterstrategy(this);
            this._map.addListener(this, 'zoomchanged', 'zoomchanged');
            this._map.addListener(this, 'moveend', 'moveend');
        },
        /**
         * Инициализация событий
         * @method _initEvents
         * @private
         */
        _initEvents: function() {
            if (!this.handlers && this._panes.overlayPane) {
                this.handlers = new GWTK.mapclusterizatorhandlers(this);
                var tgt = this._panes.overlayPane;
                $(tgt).on("click", this.handlers.mapclick);
                $(tgt).on("mousewheel DOMMouseScroll wheel MozMousePixelScroll", this.handlers.mousewheel);
                $(tgt).on("mousedown", this.handlers.mapmousedown);
                $(tgt).on("mousemove", this.handlers.mapmousemove);
                $(tgt).on("mouseup", this.handlers.mapmouseup);
            }
            
            var rtime;
            var timeout = false;
            var delta = 200;
            var that = this;
            $(window).on("resize.clusterization", function() {
                rtime = new Date();
                if (timeout === false) {
                    timeout = true;
                    setTimeout(resizeend, delta);
                }
            });
            
            function resizeend() {
                if (new Date() - rtime < delta) {
                    setTimeout(resizeend, delta);
                }else{
                    timeout = false;
                    that.moveend({
                        oldBounds: that._map.handlers.movedrag.prevGeoBounds,
                        newBounds: that._map.handlers.movedrag.newGeoBounds
                    });
                }
            }
        },
        /**
         * Инициализация div-ов
         * @method _initPanes
         * @private
         */
        _initPanes: function() {
            this._panes = {};
            var panes = this._panes;
            // panes.overlayPane = this._createPane("GWTK-ctor-overlay-pane", this._map.overlayPane, true);
            // panes.overlayCanvas = this._createCanvas("GWTK-ctor-overlay-canvas", panes.overlayPane);
            panes.overlayPane = this._createPane(this.overlayPaneCss + this.clusterizatorId, this._map.overlayPane, false);
            panes.overlayCanvas = this._createCanvas(this.overlayCanvasCss + this.clusterizatorId, panes.overlayPane);
            panes.overlayCanvas.width = '1px';         // 19/12/16
            panes.overlayCanvas.height = '1px';        // 19/12/16
        },
        
        /**
         * Создать контейнер
         * @method _createPane
         * @param className - имя класса
         * @param container - родительский контейнер
         * @param animated - контейнер анимируется
         * @private
         */
        _createPane: function(className, container, animated) {
            return GWTK.maphandlers.map.createPane(className, container, animated);
        },
        /**
         * Инициализация канвы для отрисовки выпуклой оболочки границ кластера
         * @method _createCanvas
         * @param className - имя класса
         * @param container - родительский контейнер
         * @return {canvas}
         * @private
         */
        _createCanvas: function(className, container) {
            return GWTK.DomUtil.create('canvas', className, container);
        },
        /**
         * Перевод гео координат в оконные
         * @method _geo2pixelOffset
         * @param map - карта
         * @param geo - гео точка (объект LatLng)
         * @param zoom - масштаб
         * @return {*}
         * @private
         */
        _geo2pixelOffset: function(map, geo, zoom) {
            if (!geo) return;
            // var plane = GWTK.projection.geo2xy(map.options.crs, geo.lat, geo.lng);
            // var pos = GWTK.tileView.getTileLayerData(zoom, map, GWTK.point(plane[1], plane[0]));
            // return map.tiles.getLayersPointOffset(pos);
            return map.geoToPixel(new GeoPoint(geo.lng, geo.lat, 0, map.ProjectionId), zoom);
        },
        /**
         * Register unwrapped cluster
         * @method _addUnwrappedCluster
         * @param cluster
         * @private
         */
        _addUnwrappedCluster: function(cluster) {
            this._unwrappedClusters.push(cluster);
        },
        /**
         * Unregister unwrapped cluster
         * @method _removeUnwrappedCluster
         * @param cluster
         * @return {boolean}
         * @private
         */
        _removeUnwrappedCluster: function(cluster) {
            for (var i = 0; i < this._unwrappedClusters.length; i++) {
                if (this._unwrappedClusters[i] == cluster) {
                    this._unwrappedClusters.splice(i, 1);
                    return true;
                }
            }
            return false;
        },
        /**
         * Wrap all clusters
         * @method _wrapAllClusters
         * @private
         */
        _wrapAllClusters: function() {
            if (this._unwrappedClusters.length > 0) {
                for (var i = 0; i < this._unwrappedClusters.length; i++) {
                    this._unwrappedClusters[i].wrap(true);
                }
                this._unwrappedClusters = [];
            }
        },
        /**
         * Задать стратегию постоения кластеров.
         * @method setStrategy
         * @param newStrategy - стратегия
         */
        setStrategy: function(newStrategy) {
            this._strategy = newStrategy;
        },
        /**
         * Прочитать данные формата geoJSON и сформировать из них массив объектов (нам нужны гео коор-ты и свойства)
         * @method _readMarkers
         * @param geoJSON - готовый json или строка которая отправится на сервер в параметре path
         * @param backward  - способ чтения гео коор-нат
         * @param center - центр карты куда нужно переместиться после кластеризации
         * @param zoom - какой масштаб нужно установить после кластеризации
         * @param onbegin - callback на начало операции
         * @param onend - callback на окончание операции
         * @return {boolean}
         * @private
         */
        _readMarkers: function(geoJSON, backward, center, zoom, onbegin, onend) {
            if (!geoJSON) {
                throw 'geoJSON not defined';
            }
            var self = this;
            if (onbegin) {
                onbegin(self);
            }
            var items = null;
            var result = [];
            //если пришла строка выполняем запрос на сервер для получения JSON
            if (typeof geoJSON === 'string') {
                $.ajax({
                    url: this.url || this._options.url,
                    type: "POST",
                    data: { "request": "Markers", "name": "", "path": geoJSON },
                    dataType: "json",
                    xhr: function() {
                        var xhr = $.ajaxSettings.xhr();
                        xhr.upload.loadstart = function() {
                            //
                        }
                        xhr.upload.onprogress = function(e) {
                            //
                        };
                        xhr.onprogress =
                            function(e) {
                                //
                            };
                        return xhr;
                    },
                    success: function(data) {
                        items = data;
                        if (items && items["features"]) {
                            // var geometry;
                            // var props;
                            // var coords;
                            // for ( var f in items[ "features" ] ) {
                            //    geometry = items[ "features" ][ f ][ "geometry" ];
                            //    props = items[ "features" ][ f ][ "properties" ];
                            //    if ( geometry ) {
                            //        coords = geometry[ "coordinates" ];
                            //        if ( coords && Array.isArray( coords ) && coords.length > 1 ) {
                            //         if ( backward ) {
                            // 	        result.push( {
                            // 		        latLng: new GWTK.LatLng( coords[ 0 ], coords[ 1 ] ), data: props
                            // 	        } );
                            //         }
                            //         else {
                            // 	        result.push( {
                            // 		        latLng: new GWTK.LatLng( coords[ 1 ], coords[ 0 ] ), data: props
                            // 	        } );
                            //         }
                            //        }
                            //    }
                            // }
                            result = self.parseGeoJSONForCluster(data, backward);
                            self.clusterify(result, center, zoom, null, onend);
                            return true;
                        }
                    },
                    error: function(e) {
                        console.log(e.message);
                        if (onend) {
                            onend(self);
                        }
                    }
                });
            }
            //если пришел объект то проходим по нему и добавляем объекты к кластеризатор
            if (typeof geoJSON === 'object') {
                result = self.parseGeoJSONForCluster(geoJSON, backward);
                self.clusterify(result, center, zoom, null, onend);
                return true;
            }
            return false;
        },
        /**
         * Разобрать GeoJSON
         * @method parseGeoJSONForCluster
         * @param geoJSON - готовый json
         * @param backward - способ чтения гео коор-нат
         * @return {*}
         */
        parseGeoJSONForCluster: function(geoJSON, backward) {
            if (!geoJSON || !geoJSON['features']) return false;
            var items = geoJSON, geometry, props, coords,
                result = [];
            for (var f in items["features"]) {
                if (items['features'].hasOwnProperty(f)) {
                    geometry = items["features"][f]["geometry"];
                    props = items["features"][f]["properties"];
                    if (geometry) {
                        coords = geometry["coordinates"];
                        if (coords && Array.isArray(coords) && coords.length > 1) {
                            if (backward) {
                                result.push({
                                    latLng: new GWTK.LatLng(coords[0], coords[1]), data: props
                                });
                            }else{
                                result.push({
                                    latLng: new GWTK.LatLng(coords[1], coords[0]), data: props
                                });
                            }
                        }
                    }
                }
            }
            return result;
        },
        
        // showById: function(id){
        // 	var index = -1;
        // 	if (this._objects && _objects.length > 0){
        //
        // 		for(var i in this._objects) {
        //             if (this._objects[i]._closeMarker) {
        //                 index = i;
        //             	break;
        // 			}
        // 		}
        //     }
        //     if (index > 0) {
        // 		console.log(index);
        //     }
        // },
        
        /**
         * Запускаем построение кластеров из объектов (coords) прочитвнных из geoJSON (см. _readMarkers)
         * @method clusterify
         * @param coords - массив объектов ({latLng, data})
         * @param center - центр карты куда нужно переместиться после кластеризации
         * @param zoom - какой масштаб нужно установить после кластеризации
         * @param onbegin - callback на начало операции
         * @param onend - callback на окончание операции
         */
        clusterify: function(coords, center, zoom, onbegin, onend) {
            if (coords) {
                w2utils.lock(GWTK.maphandlers.map.mapPane, "Р—Р°РіСЂСѓР·РєР° РґР°РЅРЅС‹С…...", true);
                $(".w2ui-lock").css("pointer-events", "all");
                if (onbegin) {
                    onbegin(this);
                }
                this.beginUpdate();
                for (var coord in coords) {
                    if (coords.hasOwnProperty(coord)) {
                        var markerPt = new GWTK.markerPoint(
                            this._strategy, coords[coord].latLng,
                            undefined,
                            coords[coord].data,
                            /*this._options.icon,*/this.getIconForObject(coords[coord]),
                            this._options.markerevents,
                            this._options.markerSize
                        );//добавил изображение в конструктор
                        this.addObject(markerPt);
                    }
                }
                this.endUpdate(center, zoom);
                if (onend) {
                    onend(this);
                }
                w2utils.unlock(GWTK.maphandlers.map.mapPane);
            }
        },
        /**
         * Получить путь к иконке
         * @param obj - объект из json
         * @return {string}
         */
        getIconForObject: function(obj) {
            if (!obj || !this._options['styleSettings'] || !this._options['styleSettings']['typeField']) {
                //console.log( 'Style for cluster object not found' );
                return this._options.icon || '';
            }
            var type = this._options['styleSettings']['typeField'];
            var newSrc = '';
            if (obj['data'][type] !== undefined && this._options['styleSettings']['style'][obj['data'][type]]) {
                newSrc = this._options['styleSettings']['style'][obj['data'][type]]['marker']['image'];
            }else{
                // console.log( obj[ 'data' ][ type ] + ' is not found in styles [styleSettings]' );
                newSrc = this._options.icon
            }
            return newSrc;
        },
        /**
         * Запускаем построение кластеров, предварительно прочитав их из файла
         * @method clusterifyFrom
         * @param geoJSON - данные в формате geoJSON
         * @param backward - способ чтения гео коор-нат
         * @param center - центр карты куда нужно переместиться после кластеризации
         * @param zoom - какой масштаб нужно установить после кластеризации
         * @param onbegin - callback на начало операции
         * @param onend - callback на окончание операции
         */
        clusterifyFrom: function(geoJSON, backward, center, zoom, onbegin, onend) {
            this.clear();
            this._readMarkers(geoJSON, backward, center, zoom, onbegin, onend);
        },
        /**
         * "очистить" кластеризатор.
         * @method clear
         */
        clear: function() {
            this._strategy._clusters.clear();
            this._strategy._unclusteredItems.clear();
            this._objects = [];
            this._map.overlayPane.style.left = '0px';
            this._map.overlayPane.style.top = '0px';
        },
        
        destroy: function() {
            this.clear();
            // Если есть панель анимации, то удалить из нее
            // if (this._map.animatedLayers) {
            // 	for(var i = 0; i < this._map.animatedLayers.length; i++){
            //
            //     }
            // }
            
            // Удалить панели
            $(this._panes.overlayCanvas).remove();
            $(this._panes.overlayPane).remove();
            
        },
        
        /**
         * Отобразить кластерный слой
         */
        show: function() {
            $(this.overlayPaneSelector + this.clusterizatorId).show();
        },
        
        /**
         * Скрыть кластерный слой
         */
        hide: function() {
            $(this.overlayPaneSelector + this.clusterizatorId).hide();
        },
        
        /**
         * Запросить контейнер, содержащий изображения
         */
        getImageContainer: function() {
            var el = $(this.overlayPaneSelector + this.clusterizatorId);
            if (el.length > 0) {
                return el[el.length - 1];
            }
        },
        
        /**
         * Реакция на окончание движения карты
         * @method moveend
         * @param args - объект события
         */
        moveend: function(args) {
            var zoom = this._map.options.tilematrix;
            this._strategy.removeFromMap(zoom, zoom, args.oldBounds, args.newBounds);
            this._strategy.addToMap(zoom, zoom, args.oldBounds, args.newBounds);
        },
        /**
         * Реакция на окончание зумирования карты
         * @method zoomchanged
         * @param args - объект события
         */
        zoomchanged: function(args) {
            this._zooming = true;
            if (this._activeMarkerHandler) {
                $(this._activeMarkerHandler).hideBalloon();
            }
            this._wrapAllClusters();
            if (this.useAnimation()) {
                var self = this;
                var shrink = (args.from > args.to);
                setTimeout(function() {
                    self.currGB = self._map.getMapGeoBounds(false);
                    self._strategy.removeFromMap(args.from, args.to, args.oldBounds, null);
                    self._strategy.addToMap(args.to, args.from, null, args.newBounds);
                    var animateDurationVal = parseFloat($(".animated-obj").first().css("-webkit-transition-duration"));
                    var animateDuration = (isNaN(animateDurationVal)) ? 400 : animateDurationVal * 1000;
                    setTimeout(function() {
                        if (shrink) {
                            $(".animated-obj.to-delete-obj").each(
                                function(index, item) {
                                    if (item.cluster) {
                                        item.cluster.position(item.cluster.lastPlace);
                                    }else if (item.marker) {
                                        item.marker.position(item.marker.lastPlace);
                                    }
                                }
                            );
                        }else{
                            $(".animated-obj:not(.to-delete-obj)").each(
                                function(index, item) {
                                    item.style.opacity = "1";
                                    if (item.cluster) {
                                        item.cluster.position(item.cluster.lastPlace);
                                    }else if (item.marker) {
                                        item.marker.position(item.marker.lastPlace);
                                    }
                                }
                            );
                        }
                        setTimeout(function() {
                            $(".to-delete-obj").each(
                                function(index, item) {
                                    $(item).addClass("animated-obj");
                                    item.style.opacity = "0";
                                }
                            );
                            $(".to-add-obj").each(
                                function(index, item) {
                                    $(item).addClass("animated-obj");
                                    item.style.opacity = "1";
                                }
                            );
                            self._zooming = false;
                        }, self._animPhaseDelay);
                    }, animateDuration);
                }, 300); //200
            }else{
                this._strategy.removeFromMap(args.from, args.to, args.oldBounds, null);
                this._strategy.addToMap(args.to, args.from, null, args.newBounds);
            }
        },
        /**
         * Начало пакетной операции
         * @method beginUpdate
         */
        beginUpdate: function() {
            this._updateCount++;
        },
        /**
         * Окончание пакетной операции
         * @method endUpdate
         * @param center - центр карты
         * @param zoom - масштаб
         */
        endUpdate: function(center, zoom) {
            this._updateCount--;
            if (this._updateCount == 0) {
                this._clusterify(center, zoom);
            }
        },
        /**
         * Добавить объект, который будет обсчитываться кластеризатором
         * @method addObject
         * @param object - объект
         */
        addObject: function(object) {
            this._objects.push(object);
        },
        /**
         * Удалить объект из кластеризатора, т.е. объект object уже не будет обсчитываться кластеризатором
         * @method removeObject
         * @param object - объект
         */
        removeObject: function(object) {
            var index = -1;
            for (var i = 0; i < this._objects.length; i++) {
                if (this._objects[i] === object) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) {
                this._objects.splice(index, 1);
            }
        },
        /**
         * Запускаем построение кластеров
         * @method _clusterify
         * @param center - центр карты куда нужно переместиться после кластеризации
         * @param zoom - какой масштаб нужно установить после кластеризации
         * @private
         */
        _clusterify: function(center, zoom) {
            if (this._strategy) {
                this._strategy.clusterify(this._objects, center, zoom);
            }
        },
        /**
         * Получить кол-во кластеров для масштаба zoom
         * @method getClusterCount
         * @param zoom - масштаб
         * @return {*}
         */
        getClusterCount: function(zoom) {
            return this._strategy.getClusterCount(zoom);
        },
        /**
         * Получить кластер для масштаба zoom по индексу
         * @method getCluster
         * @param zoom - масштаб
         * @param index - индекс в массиве
         * @return {*}
         */
        getCluster: function(zoom, index) {
            return this._strategy.getCluster(zoom, index);
        },
        /**
         * Получить кол-во некластеризованных маркеров для масштаба zoom
         * @method getUnclusteredCount
         * @param zoom - масштаб
         * @return {*}
         */
        getUnclusteredCount: function(zoom) {
            return this._strategy.getUnclusteredCount(zoom);
        },
        /**
         * Получить некластеризованный маркер для масштаба zoom по индексу
         * @method getUnclustered
         * @param zoom - масштаб
         * @param index - индекс в массиве
         * @return {*}
         */
        getUnclustered: function(zoom, index) {
            return this._strategy.getUnclustered(zoom, index);
        },
        /**
         * Получить карту
         * @method getMap
         * @return {*}
         */
        getMap: function() {
            return this._map;
        },
        /**
         * Получить контейнер для кластеров и маркеров
         * @method getOverlayPane
         * @return {*|null}
         */
        getOverlayPane: function() {
            return this._panes.overlayPane;
        },
        /**
         * Получить опции (настройки) кластеризатора
         * @method getOptions
         * @return {*}
         */
        getOptions: function() {
            return this._options;
        },
        /**
         * Получить анимацию
         * @method useAnimation
         * @return {*}
         */
        useAnimation: function() {
            return this._useAnimation;
        },
        /**
         * Установить использование анимации
         * @method setUseAnimation
         * @param value
         */
        setUseAnimation: function(value) {
            this._useAnimation = (value && this._animationSupported());
        },
        /**
         * Определить поддержки анимации
         * @method _animationSupported
         * @return {boolean}
         * @private
         */
        _animationSupported: function() {
            if ('WebkitTransition' in document.body.style ||
                'MozTransition' in document.body.style ||
                'OTransition' in document.body.style ||
                'transition' in document.body.style
            ) {
                return true;
            }
            return false;
        }
        
    };
    /**
     * Обработчики событий кластеризатора
     * @param mapclusterizator
     */
    GWTK.mapclusterizatorhandlers = function(mapclusterizator) {
        this._mapclusterizator = mapclusterizator;
        this.init();
    };
    
    GWTK.mapclusterizatorhandlers.prototype = {
        
        init: function() {
        },
        
        mapclick: function(event) {
        
        },
        
        mapmousedown: function(event) {
        
        },
        
        mapmousemove: function(event) {
        
        },
        
        mapmouseup: function(event) {
        
        },
        
        mousewheel: function(event) {
        
        }
        
    };
    
    //http://habrahabr.ru/post/131714/
    function inherits(Child, Parent) {
        var F = function() {
        };
        F.prototype = Parent.prototype;
        var f = new F();
        for (var prop in Child.prototype) f[prop] = Child.prototype[prop];
        Child.prototype = f;
        Child.prototype.$super = Parent.prototype; // 20.01.2016 компилятор ругается на код: Child.prototype.super
    }
    
    /**
     * Объект (общий) на карте
     * @constructor GWTK.commonPoint
     * @param strategy - масштаб
     * @param latlng - гео координаты
     * @param zoom - зум
     * @param data - данные для маркера
     */
    GWTK.commonPoint = function(strategy, latlng, zoom, data) {
        this._strategy = strategy;
        this._latLng = latlng;
        this._data = data;
        this._zoom = zoom;
        this.options = {
            opacity: 1,
            cursor: "pointer"
        };
        this._planeXY = null;
        this.div = null;
        this._clusterizator = strategy.getClusterizator();
    };
    
    GWTK.commonPoint.prototype = {
        /**
         * Получить "хэш код" объекта
         * @method getHashCode
         * @return {*}
         */
        getHashCode: function() {
            return GWTK.ClusterizationUtils.stamp(this); //?
        },
        /**
         * получить объект карты
         * @method getMap
         * @return {*}
         */
        getMap: function() {
            return this._strategy.getMap();
        },
        /**
         * Получить контейнер
         * @method getOverlayPane
         * @return {*}
         */
        getOverlayPane: function() {
            return this._strategy.getOverlayPane();
        },
        /**
         * Получить максимальный зум карты
         * @method getMaxZoom
         * @return {*}
         */
        getMaxZoom: function() {
            //if (this.getMap()) { return this.getMap().options.maxzoom; }
            //return 17;
            if ((this.getMap()) && (this.getMap().options.maxzoom))
                return this.getMap().options.maxzoom;
            return 17;
        },
        /**
         * Получить гео координаты
         * @method getLatLng
         * @return {{lat: number, lng: number}|*|null}
         */
        getLatLng: function() {
            return this._latLng;
        },
        /**
         * Получить настройки
         * @method getOptions
         * @return {*}
         */
        getOptions: function() {
            return this._strategy.getOptions();
        },
        /**
         * Получить плоские координаты
         * @method getPlace
         * @param zoom
         * @return {*}
         */
        getPlace: function(zoom) {
            return GWTK.ClusterizationUtils.getPlace(this, zoom);
        },
        /**
         * Получить плоские координаты
         * @method getXY
         * @return {{x: number, y: number}|*|null}
         */
        getXY: function() {
            return this._planeXY;
        },
        /**
         * получить оконные координаты
         * @method getClientXY
         * @param zoom
         * @return {*}
         */
        getClientXY: function(zoom) {
            return GWTK.ClusterizationUtils._geoObj2pixelOffset(this, zoom);
        },
        /**
         * Получить зум маркера
         * @method getZoom
         * @return {*|string}
         */
        getZoom: function() {
            return this._zoom;
        },
        /**
         * Получить гео координаты
         * @method toPoint
         * @return {null}
         */
        toPoint: function() {
            if (this._latLng === null) return null;
            return GWTK.point(this._latLng.lat, this._latLng.lng);
        },
        /**
         * Есть гео координаты?
         * @method isgeopoint
         * @return {boolean}
         */
        isgeopoint: function() {
            if (this._latLng === null) return false;
            return true;
        },
        /**
         * Получить div объекта
         * @method geopoint
         * @return {string|*|null|Element}
         */
        geopoint: function() {
            return this.div;
        }
    };
    /**
     * Объект (маркер) на карте
     * @param strategy - масштаб
     * @param latlng - гео координаты
     * @param zoom - зум
     * @param data - данные для маркера
     * @param icon - путь к изображению
     * @param events - события
     * @param markersize - размеры маркера
     */
    GWTK.markerPoint = function(strategy, latlng, zoom, data, icon, events, markersize) {
        GWTK.commonPoint.apply(this, arguments);
        this._closeMarker = false; //fake marker of unwrapped clusters
        this._zoomClusters = {};
        this._unwrappedOffset = null;
        this.offset = GWTK.point(0, 0);
        this.size = markersize;
        this.icon = icon;
        this.events = events;
        this._hintpropertiesname = (this._strategy && this._strategy._clusterizator && this._strategy._clusterizator._options && this._strategy._clusterizator && this._strategy._clusterizator._options.markerhint && this._strategy._clusterizator._options.markerhint.propertiesname) ?
            this._strategy._clusterizator._options.markerhint.propertiesname : null;
        GWTK.ClusterizationUtils.stamp(this);
    };
    
    GWTK.markerPoint.prototype = {
        /**
         * Получить URL с изображением маркера.
         * @return {*}
         */
        getImageURL: function() {
            if (this._closeMarker) {
                return this.icon || GWTK.imgClusterMarkerClose;
            }else{
                if (this.isUnwrapped()) {
                    return this.icon || GWTK.imgClusterUnwrappedMarker;
                }else{
                    return this.icon || GWTK.imgClusterMarker;
                }
            }
        },
        /**
         * Получить хинт с информацией по объекту
         * @method getHint
         * @return {string}
         */
        getHint: function() {
            var res = "";
            if (this._data) {
                if (this._hintpropertiesname) {
                    res = this._data[this._hintpropertiesname];
                }else{
                    for (var i in this._data) {
                        res += i + ":" + this._data[i] + "<br>";
                    }
                }
            }
            return res;
        },
        /**
         * Установить кластер для маркера.
         * @method setCluster
         * @param zoom - масштаб на котором маркер входит в кластер
         * @param cluster - клатер
         * @param checkParent - проверить входит ли маркер в родительский кластер
         * @param checkKids - проверить входит ли маркер в подчиненные кластеры
         */
        setCluster: function(zoom, cluster, checkParent, checkKids) {
            this._zoomClusters[zoom] = cluster;
            if (checkParent) {
                for (var z = zoom - 1; z > 0; z--) {
                    var parentCluster = cluster.getParent();
                    if (!parentCluster) {
                        break;
                    }
                    this._zoomClusters[z] = parentCluster;
                }
            }
            if (checkKids) {
                for (var z = zoom; z <= this.getMaxZoom(); z++) {
                    this._zoomClusters[z] = cluster;
                }
            }
        },
        /**
         * Удалить маркер из родительского кластера начиная с масштаба fromZoom
         * @method removeFromParentCluster
         * @param fromZoom - масштаб
         */
        removeFromParentCluster: function(fromZoom) {
            for (let i = fromZoom; i > 0; i--) {
                if (this._zoomClusters[i]) {
                    if (this._zoomClusters[i].removeObject(this)) {
                        return;
                    }
                }
            }
        },
        /**
         * Получить кластер для опред. масштаба
         * @method getCluster
         * @param zoom - масштаб
         * @return {*}
         */
        getCluster: function(zoom) {
            return this._zoomClusters[zoom];
        },
        /**
         * Входит ли маркер в кластер на опред. масштабе
         * @method isClustered
         * @param zoom - масштаб
         * @return {boolean}
         */
        isClustered: function(zoom) {
            return (this._zoomClusters[zoom] != undefined && this._zoomClusters[zoom] != null);
        },
        /**
         * Получить уникальный идентификатор объекта
         * @method getUID
         * @return {*}
         */
        getUID: function() {
            return GWTK.ClusterizationUtils.stamp(this);
        },
        
        /**
         * Является ли маркер фиктивным (фиктивный маркер это изображение крестика для закрытия открытого кластера
         * @method isCloseMarker
         * @return {boolean}
         */
        isCloseMarker: function() {
            return this._closeMarker;
        },
        /**
         * Инициализировать обработчики событий для маркера (т.е. для div-а маркера)
         * @method _initEvents
         * @private
         */
        _initEvents: function() {
            if (!this.handlers && this.div) {
                this.handlers = new GWTK.markerhandlers(this);
                var tgt = this.div;
                $(tgt).on("click", this.handlers.mapclick);
                $(tgt).on("mousewheel DOMMouseScroll wheel MozMousePixelScroll", this.handlers.mousewheel);
                $(tgt).on("mousedown", this.handlers.mapmousedown);
                $(tgt).on("mousemove", this.handlers.mapmousemove);
                $(tgt).on("mouseup", this.handlers.mapmouseup);
                tgt = this.img;
                $(tgt).on("click", this.handlers.mapclick);
                $(tgt).on("mousewheel DOMMouseScroll wheel MozMousePixelScroll", this.handlers.mousewheel);
                $(tgt).on("mousedown", this.handlers.mapmousedown);
                $(tgt).on("mousemove", this.handlers.mapmousemove);
                $(tgt).on("mouseup", this.handlers.mapmouseup);
                // if ( !this.events ) {
                // 	$( tgt ).on( "onmouseenter mouseenter", this.handlers.mapmouseenter );
                // 	$( tgt ).on( "onmouseleave mouseleave", this.handlers.mapmouseleave );
                // }
                if (this.events) {
                    if (this.events['mouseenter'] !== undefined && this.events['mouseenter'] === true) {
                        $(tgt).on("onmouseenter mouseenter", this.handlers.mapmouseenter);
                    }
                    if (this.events['mouseleave'] !== undefined && this.events['mouseleave'] === true) {
                        $(tgt).on("onmouseleave mouseleave", this.handlers.mapmouseleave);
                    }
                }
            }
        },
        /**
         * Создать визуальный объект маркера, т.е.div в разметке html страницы
         * @method create
         * @param zoom - масштаб
         * @param refresh - пересоздать?
         * @param fromZoom
         * @param toZoom
         * @return {Element|*}
         */
        create: function(zoom, refresh, fromZoom, toZoom) {
            if (!this.div || refresh) {
                if (this.div && refresh) {
                    this.remove();
                }
                var shrink = (fromZoom > toZoom);
                this._zoom = zoom;
                var pane = this.getOverlayPane();
                var div = document.createElement('div');
                var img = document.createElement('img');
                img.src = this.getImageURL();
                img.xid = this._data && this._data['id'] ? this._data['id'] : '';
                //div.className = "marker" ;
                div.className = "marker zoom" + zoom;
                img.className = "marker-img";
                img.style.height = this.size && this.size.y ? this.size.y + 'px' : 0;
                img.style.width = this.size && this.size.x ? this.size.x + 'px' : 0;
                div.appendChild(img);
                this.div = div;
                this.img = img;
                this._initEvents();
                var map = this.getMap();
                var latLng = this.getLatLng();
                var place = GWTK.ClusterizationUtils._geo2pixelOffset(map, latLng, zoom, false);
                
                this.lastPlace = null;
                
                this.div.marker = this;
                this.img.marker = this;
                
                GWTK.ClusterizationUtils.setCSSEvent(div, "TransitionEnd",
                    function(e) {
                        if (e && e.target) {
                            $(e.target).removeClass('animated-obj');
                            $(e.target).removeClass('to-add-obj');
                            if ($(e.target).hasClass('to-delete-obj')) {
                                $(e.target).removeClass('to-delete-obj');
                                e.target.marker.remove(undefined, undefined, true);
                            }
                        }
                    }
                );
                
                var geo = this.getLatLng();
                if (this._clusterizator.useAnimation() && this._clusterizator._zooming &&
                    this._clusterizator.currGB.contains(new GeoPoint(geo.lng, geo.lat))) {
                    if (!shrink) {
                        var cluster = this.getCluster(zoom - 1);
                        if (cluster) {
                            this.lastPlace = place;
                            place = GWTK.ClusterizationUtils._geo2pixelOffset(this.getMap(), cluster.getLatLng(),
                                cluster.getZoom(), false);
                            this.position(place);
                            //this.position(cluster.vertex);
                            pane.appendChild(div);
                            div.style.opacity = "0";
                            $(div).addClass("animated-obj");
                        }else{
                            this.position(place);
                            pane.appendChild(div);
                        }
                    }else{
                        this.position(place);
                        pane.appendChild(div);
                    }
                }else{
                    this.position(place);
                    pane.appendChild(div);
                }
            }
            return this.div;
        },
        /**
         * Удалить визуальный объект маркера, т.е. из разметки html страницы
         * @method remove
         * @param fromZoom
         * @param toZoom
         * @param forced
         */
        remove: function(fromZoom, toZoom, forced) {
            if (this.div && this.getOverlayPane()) {
                var shrink = (fromZoom > toZoom);
                var pane = this.getOverlayPane();
                var geo = this.getLatLng();
                $(this.div).off();
                $(this.img).off();
                if (this._clusterizator.useAnimation() && this._clusterizator._zooming && !forced && shrink &&
                    this._clusterizator.currGB.contains(new GeoPoint(geo.lng, geo.lat))) {
                    var cluster = this.getCluster(toZoom);
                    if (cluster) {
                        var place = GWTK.ClusterizationUtils._geo2pixelOffset(this.getMap(), cluster.getLatLng(),
                            cluster.getZoom(), false);
                        this.lastPlace = place;
                        $(this.div).addClass("animated-obj");
                        $(this.div).addClass("to-delete-obj");
                        // console.log('Не удаляем', place);
                    }else{
                        pane.removeChild(this.div);
                        this.offset.x = 0;
                        this.offset.y = 0;
                        this.div = null;
                        this.handlers = null;
                        this._unwrappedOffset = null;
                        // console.log('удаляем 1', place);
                    }
                }else{
                    pane.removeChild(this.div);
                    this.offset.x = 0;
                    this.offset.y = 0;
                    this.div = null;
                    this.handlers = null;
                    this._unwrappedOffset = null;
                    // console.log('удаляем 2', place);
                }
            }
            
            //console.log($(this.div).children());
        },
        /**
         * Обновить позицию визуального объекта маркера
         * @method updatePosition
         * @param zoom - масштаб
         */
        updatePosition: function(zoom) {
            if (this.isUnwrapped()) {
                var cluster = this.getCluster(zoom);
                if (cluster) {
                    var place = GWTK.ClusterizationUtils._geo2pixelOffset(this.getMap(), cluster.getLatLng(), zoom, false);
                    place.x += this._unwrappedOffset.x;
                    place.y += this._unwrappedOffset.y;
                    this.position(place);
                }else{
                    this.remove();
                }
            }else{
                var place = GWTK.ClusterizationUtils._geo2pixelOffset(this.getMap(), this.getLatLng(), zoom, false);
                this.position(place);
            }
        },
        /**
         * Установить смещение для открытого маркера.
         * @method setUnwrappedOffset
         * @param offset - смещение
         */
        setUnwrappedOffset: function(offset) {
            this._unwrappedOffset = offset;
        },
        /**
         * Маркер открыт, т.е. маркер отображается в кластере на максимальном масштабе карты.
         * @method isUnwrapped
         * @return {boolean}
         */
        isUnwrapped: function() {
            return !(this._unwrappedOffset === undefined || this._unwrappedOffset === null);
        },
        /**
         * Установить позицию для div-а
         * @param coord - новая позиция
         * @return {*}
         */
        position: function(coord) {
            if (!coord) return coord;
            var point = null;
            if (GWTK.Util.isArray(coord) && coord.length > 1) {
                point = new GWTK.Point(coord[0], coord[1]);
            }else{
                point = new GWTK.Point(coord.x, coord.y)
            }
            if (!point) return coord;
            this.origin = new GWTK.Point(point.x, point.y);
            if (this.size !== undefined && this.size !== null) {
                this.offset.x = -Math.round(this.size.x / 2);
                this.offset.y = Math.round(this.size.y / 2);
            }
            point.x += this.offset.x;
            point.y -= this.offset.y;
            GWTK.DomUtil.setPosition(this.div, point);
            this.vertex = new GWTK.Point(point.x, point.y);
            return this.vertex;
        }
    };
    
    inherits(GWTK.markerPoint, GWTK.commonPoint);
    /**
     * Обработчики событий для объектов markerPoint
     * @constructor GWTK.markerhandlers
     * @param marker - объект класса markerPoint
     */
    GWTK.markerhandlers = function(marker) {
        this.marker = marker;
        this.dragFlag = false;
        this.init();
    };
    
    GWTK.markerhandlers.prototype = {
        init: function() {
        },
        mapclick: function(event) {
            if (this.marker._closeMarker && !this.dragFlag) {
                var cluster = this.marker.getCluster(this.marker.getMaxZoom());
                if (cluster) {
                    cluster.wrap();
                }
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            // Добавим информацию об объекте
            if (event) {
                event.data = this.marker._data;
            }
            GWTK.maphandlers.map.handlers.mapclick(event);
            this.dragFlag = false;
        },
        mapmousedown: function(event) {
            this.dragFlag = false;
            GWTK.maphandlers.map.handlers.mapmousedown(event);
            event.preventDefault();
        },
        mapmousemove: function(event) {
            if (GWTK.movedrag().isDragEnabled()) {
                this.dragFlag = true;
            }
            GWTK.maphandlers.map.handlers.mapmove(event);
            event.preventDefault();
        },
        mapmouseup: function(event) {
            GWTK.maphandlers.map.handlers.mapmouseup(event);
            event.preventDefault();
        },
        mousewheel: function(event) {
            GWTK.maphandlers.map.handlers.mousewheelscaling(event);
        },
        mapmouseenter: function(event) {
            if (this.marker._clusterizator.useAnimation() && this.marker._clusterizator._zooming) return;
            if (!this.marker._closeMarker) {
                this.marker._clusterizator._activeMarkerHandler = this;
                $(this).showBalloon({ contents: this.marker.getHint() }); //показать хинт для маркера
            }
            event.preventDefault();
        },
        mapmouseleave: function(event) {
            if (!this.marker._closeMarker) {
                $(this).hideBalloon();
                this.marker._clusterizator._activeMarkerHandler = null;
            }
            if (GWTK.movedrag().isDragEnabled()) return;
            event.preventDefault();
        }
    };
    /**
     * Объект кластера на карте
     * @param strategy
     * @param latlng
     * @param zoom
     * @param data
     */
    GWTK.clusterPoint = function(strategy, latlng, zoom, data) {
        GWTK.commonPoint.apply(this, arguments);
        this._objects = [];
        this._children = new GWTK.hashmap();
        this._parent = null;
        this.offset = GWTK.point(0, 0);
        this.size = GWTK.point(30, 50);
        this.hiddenPos = new GWTK.Point(-1000, -1000);
        this.vertex = null;
        this.origin = null;
        this._root = null;
        this._totalObjectCount = 0;
        this._convexHullVisible = false;
        this._convexHullMBR = null;
        this._chull = null;
        this._hidden = false;
        GWTK.ClusterizationUtils.stamp(this);
    };
    
    GWTK.clusterPoint.prototype = {
        /**
         * Инициализировать обработчики событий для кластера на карте.
         * @method _initEvents
         * @private
         */
        _initEvents: function() {
            if (!this.handlers && this.div) {
                this.handlers = new GWTK.clusterhandlers(this);
                var tgt = this.div;
                $(tgt).on("click", this.handlers.mapclick);
                $(tgt).on("mousewheel DOMMouseScroll wheel MozMousePixelScroll", this.handlers.mousewheel);
                $(tgt).on("mousedown", this.handlers.mapmousedown);
                $(tgt).on("mousemove", this.handlers.mapmousemove);
                $(tgt).on("mouseup", this.handlers.mapmouseup);
                $(tgt).on("onmouseenter mouseenter", this.handlers.mapmouseenter);
                $(tgt).on("onmouseleave mouseleave", this.handlers.mapmouseleave);
                
                
                tgt = this.spandiv;
                $(tgt).on("click", this.handlers.mapclick);
                $(tgt).on("mousewheel DOMMouseScroll wheel MozMousePixelScroll", this.handlers.mousewheel);
                $(tgt).on("mousedown", this.handlers.mapmousedown);
                $(tgt).on("mousemove", this.handlers.mapmousemove);
                $(tgt).on("mouseup", this.handlers.mapmouseup);
                
                tgt = this.span;
                $(tgt).on("click", this.handlers.mapclick);
                $(tgt).on("mousewheel DOMMouseScroll wheel MozMousePixelScroll", this.handlers.mousewheel);
                $(tgt).on("mousedown", this.handlers.mapmousedown);
                $(tgt).on("mousemove", this.handlers.mapmousemove);
                $(tgt).on("mouseup", this.handlers.mapmouseup);
            }
        },
        /**
         * Обновить кол-во объектов в родительском кластере (рекурсивно)
         * @method _updateParentObjCount
         * @private
         */
        _updateParentObjCount: function() {
            if (this._parent) {
                this._parent._totalObjectCount++;
                this._parent._updateParentObjCount();
            }
        },
        /**
         * Добавить объект в кластер
         * @param object
         * @param clear
         */
        addObject: function(object, clear) {
            var childCluster = object.getCluster(this.getZoom() + 1);
            var addedChild = null;
            var addedObj = null;
            this._totalObjectCount++;
            if (!childCluster) {
                this._objects.push(object);
                addedObj = object;
            }else{
                addedChild = childCluster;
            }
            this.addChild(childCluster, true);
            object.setCluster(this.getZoom(), this);
            this._updateCenter(addedChild, addedObj);
            this._updateParentObjCount();
        },
        /**
         * Удалить объект из кластера
         * @method removeObject
         * @param object
         * @return {boolean}
         */
        removeObject: function(object) {
            for (var i = 0; i < this._objects.length; i++) {
                if (this._objects[i] == object) {
                    this._objects.splice(i, 1);
                    this._updateCenter();
                    return true;
                }
            }
            return false;
        },
        /**
         * Добавить подчиненный кластер
         * @method addChild
         * @param child - подчиненный кластер
         * @param check - проверять вхождение
         */
        addChild: function(child, check) {
            if (check && (!(child instanceof GWTK.clusterPoint) || this.containsChild(child))) {
                return;
            }
            this._children.put(child.getHashCode(), child);
            if (!child._parent) {
                child._parent = this;
            }
        },
        /**
         * Удалить подчиненный кластер
         * @method removeChild
         * @param child - подчиненный кластер
         */
        removeChild: function(child) {
            this._children.del(child.getHashCode());
        },
        /**
         * Проверим есть ли уже такой подчиненный кластер
         * @method containsChild
         * @param child - подчиненный кластер
         * @return {boolean}
         */
        containsChild: function(child) {
            if (child) {
                if (this._children.has(child.getHashCode())) {
                    return true;
                }
                return false;
            }
            return true;
        },
        /**
         * Получить кол-во объектов в кластере
         * @method getObjectCount
         * @return {Number}
         */
        getObjectCount: function() {
            return this._objects.length;
        },
        /**
         * Получить объект в кластере по индексу
         * @method getObject
         * @param index - индекс в массиве
         * @return {*}
         */
        getObject: function(index) {
            return this._objects[index];
        },
        /**
         * Получить все объекты входящие в кластер
         * @method getAllObjects
         * @return {Array}
         */
        getAllObjects: function() {
            var res = [];
            if (this._objects.length > 0) {
                res = res.concat(this._objects);
            }
            if (this._children.count() > 0) {
                this._children.forEach(
                    function enumerate(value, key) {
                        if (value) {
                            var objs = value.getAllObjects();
                            res = res.concat(objs);
                        }
                    },
                    this
                );
            }
            return res;
        },
        /**
         * Получить выпуклую оболочку кластера
         * @method getConvexHull
         * @return {*}
         */
        getConvexHull: function() {
            var helper = new GWTK.ConvexHullHelper(this.getAllObjects(), this.getZoom());
            return helper.getConvexHull();
        },
        /**
         * Получить количество объектов в кластере
         * @method getAllObjectCount
         * @return {number}
         */
        getAllObjectCount: function() {
            return this._totalObjectCount;
        },
        /**
         * Получить центр кластера
         * @method getLatLng
         * @return {*}
         */
        getLatLng: function() {
            if (this._latLng) return this._latLng;
            if (this._objects.length > 0) return this._objects[0].getLatLng();
            return null;
        },
        /**
         * Получить оконные координаты кластера
         * @method getClientXY
         * @param zoom
         * @return {*}
         */
        getClientXY: function(zoom) {
            if (!zoom) zoom = this.getZoom();
            return GWTK.ClusterizationUtils._geoObj2pixelOffset(this, zoom);
        },
        /**
         * Обновить (пересчитать) координаты центра кластера
         * @method _updateCenter
         * @param addedChild - добавили подчиненный кластер
         * @param addedObj - добавили объект в кластер
         * @private
         */
        _updateCenter: function(addedChild, addedObj) {
            
            if (this._latLng && this._planeXY && (addedChild || addedObj)) {
                if (addedChild) {
                    this._latLng.lat += addedChild.getLatLng().lat;
                    this._latLng.lng += addedChild.getLatLng().lng;
                    this._latLng.lat /= 2;
                    this._latLng.lng /= 2;
                    
                    this._planeXY.x += addedChild.getXY().x;
                    this._planeXY.y += addedChild.getXY().y;
                    this._planeXY.x /= 2;
                    this._planeXY.y /= 2;
                }
                if (addedObj) {
                    this._latLng.lat += addedObj.getLatLng().lat;
                    this._latLng.lng += addedObj.getLatLng().lng;
                    this._latLng.lat /= 2;
                    this._latLng.lng /= 2;
                    
                    this._planeXY.x += addedObj.getXY().x;
                    this._planeXY.y += addedObj.getXY().y;
                    this._planeXY.x /= 2;
                    this._planeXY.y /= 2;
                }
                return;
            }
            
            var centerLat = 0;
            var centerLng = 0;
            
            var centerX = 0;
            var centerY = 0;
            
            
            if (this._children.count() > 0) {
                this._children.forEach(
                    function enumerate(value, key) {
                        if (value) {
                            centerLat += value.getLatLng().lat;
                            centerLng += value.getLatLng().lng;
                            
                            centerX += value.getXY().x;
                            centerY += value.getXY().y;
                        }
                    },
                    this
                );
            }
            
            if (this.getObjectCount() > 0) {
                for (var objIndex = 0; objIndex < this.getObjectCount(); objIndex++) {
                    if (this.getObject(objIndex)) {
                        centerLat += this.getObject(objIndex).getLatLng().lat;
                        centerLng += this.getObject(objIndex).getLatLng().lng;
                        
                        centerX += this.getObject(objIndex).getXY().x;
                        centerY += this.getObject(objIndex).getXY().y;
                    }
                }
            }
            
            if (centerLat === 0 && centerLng === 0) {
                this._latLng = null;
                this._planeXY = null;
            }else{
                this._latLng = {
                    lat: centerLat / (this._children.count() + this.getObjectCount()), lng: centerLng /
                        (this._children.count() + this.getObjectCount())
                };
                this._planeXY = {
                    x: centerX / (this._children.count() + this.getObjectCount()), y: centerY /
                        (this._children.count() + this.getObjectCount())
                }
            }
            
        },
        /**
         * Получить родительский кластер
         * @method getParent
         * @return {null|GWTK.clusterPoint|*}
         */
        getParent: function() {
            return this._parent;
        },
        /**
         * Получить имя класса (т.е. визуальные настройки из css) для кластера в зависимости от кол-ва объектов в кластере.
         * @method _getSubClassName
         * @return {*}
         * @private
         */
        _getSubClassName: function() {
            var options = this.getOptions();
            var smallLimit = (options && options.smallClusterLimit) ? options.smallClusterLimit : 10;
            var mediumLimit = (options && options.mediumClusterLimit) ? options.mediumClusterLimit : 100;
            var largeLimit = (options && options.largeClusterLimit) ? options.largeClusterLimit : 10000;
            var veryLargeLimit = (options && options.veryLargeClusterLimit) ? options.veryLargeClusterLimit : 100000;
            if (this._totalObjectCount < smallLimit) {
                return "small";
            }else if (this._totalObjectCount < mediumLimit) {
                return "medium";
            }else if (this._totalObjectCount < largeLimit) {
                return "large";
            }else if (this._totalObjectCount < veryLargeLimit) {
                return "verylarge";
            }else{
                return "huge";
            }
        },
        /**
         * Создать div для кластера в разметке html страницы.
         * @method create
         * @param refresh - пересоздать?
         * @param fromZoom
         * @param toZoom
         * @return {Element|*}
         */
        create: function(refresh, fromZoom, toZoom) {
            if (!this.div || refresh) {
                if (this.div && refresh) {
                    this.remove();
                }
                var shrink = (fromZoom > toZoom);
                var pane = this.getOverlayPane();
                var div = document.createElement('div');
                var spandiv = document.createElement('div');
                var span = document.createElement('span');
                var pointprefix = this._clusterizator.clusterizatorId + "_marker-cluster"
                // div.id = "marker-cluster" + "-" + this.getZoom() + "-" + this.getHashCode();
                // $(div).addClass("marker-cluster" + "-" + this._getSubClassName());
                div.id = pointprefix + "-" + this.getZoom() + "-" + this.getHashCode();
                var subclassname = this._getSubClassName();
                $(div).addClass("marker-cluster" + "-" + subclassname);
                // Добавим иконку, ксли есть в настройках
                if (this._clusterizator._options.customimageclasters) {
                    $(div).css('background-image', 'url(' + this._clusterizator._options.customimageclasters[subclassname] + ')');
                }
                
                div.appendChild(spandiv);
                spandiv.appendChild(span);
                this.div = div;
                this.spandiv = spandiv;
                this.span = span;
                if ('textContent' in this.span) this.span.textContent = this._totalObjectCount + '';
                else this.span.innerText = this._totalObjectCount + '';
                this._initEvents();
                this.div.cluster = this;
                this.spandiv.cluster = this;
                this.span.cluster = this;
                var map = this.getMap();
                var latLng = this.getLatLng();
                var zoom = this.getZoom();
                var place = GWTK.ClusterizationUtils._geo2pixelOffset(map, latLng, zoom, false);
                this.lastPlace = null;
                
                GWTK.ClusterizationUtils.setCSSEvent(div, "TransitionEnd",
                    function(e) {
                        if (e && e.target) {
                            $(e.target).removeClass('animated-obj');
                            $(e.target).removeClass('to-add-obj');
                            if ($(e.target).hasClass('to-delete-obj')) {
                                $(e.target).removeClass('to-delete-obj');
                                e.target.cluster.remove(undefined, undefined, true);
                            }
                        }
                    }
                );
                var geo = this.getLatLng();
                if (this._clusterizator.useAnimation() && this._clusterizator._zooming &&
                    this._clusterizator.currGB.contains(new GeoPoint(geo.lng, geo.lat))) {
                    var parent = this.getParent();
                    if (parent && !shrink) {
                        this.lastPlace = place;
                        place = GWTK.ClusterizationUtils._geo2pixelOffset(this.getMap(), parent.getLatLng(),
                            this.getZoom(), false);
                        this.position(place);
                        pane.appendChild(div);
                        div.style.opacity = "0";
                        $(div).addClass("animated-obj");
                    }else{
                        this.position(place);
                        pane.appendChild(div);
                        div.style.opacity = "0";
                        $(div).addClass("to-add-obj");
                    }
                }else{
                    this.position(place);
                    pane.appendChild(div);
                }
            }
            return this.div;
        },
        /**
         * Удалить div для кластера из разметки html страницы.
         * @method remove
         * @param fromZoom
         * @param toZoom
         * @param forced
         */
        remove: function(fromZoom, toZoom, forced) {
            if (this.div && this.getOverlayPane()) {
                var geo = this.getLatLng();
                var place;
                var shrink = (fromZoom > toZoom);
                $(this.div).off();
                $(this.span).off();
                $(this.spandiv).off();
                if (this._clusterizator.useAnimation() && this._clusterizator._zooming && !forced &&
                    this._clusterizator.currGB.contains(new GeoPoint(geo.lng, geo.lat))) {
                    
                    var parent = this.getParent();
                    if (parent && shrink) {
                        place = GWTK.ClusterizationUtils._geo2pixelOffset(this.getMap(), parent.getLatLng(),
                            parent.getZoom(), false);
                        this.lastPlace = place;
                        $(this.div).addClass("animated-obj");
                        $(this.div).addClass("to-delete-obj");
                    }else{
                        place = GWTK.ClusterizationUtils._geo2pixelOffset(this.getMap(), this.getLatLng(),
                            this.getZoom() + 1, false);
                        this.position(place);
                        $(this.div).addClass("to-delete-obj");
                    }
                    
                }else{
                    this.getOverlayPane().removeChild(this.div);
                    if (this._unwrapped) {
                        for (var i = 0; i < this._objects.length; i++) {
                            this._objects[i].setUnwrappedOffset(null);
                            this._objects[i].remove();
                        }
                        this.setCursor("pointer");
                        this.setOpacity(1);
                        this._hidden = false;
                        this._unwrapped = false;
                        if (this._objects[this._objects.length - 1]._closeMarker) {
                            this._objects.splice(this._objects.length - 1, 1);
                        }
                    }
                    this.offset.x = 0;
                    this.offset.y = 0;
                    this.div = null;
                    this.handlers = null;
                }
                
            }
        },
        /**
         * Обновить позицию кластера в разметке html
         * @method updatePosition
         * @param zoom - зум кластера
         */
        updatePosition: function(zoom) {
            if (!this._hidden) {
                var place = GWTK.ClusterizationUtils._geo2pixelOffset(this.getMap(), this.getLatLng(), zoom, false);
                this.position(place);
            }else{
                GWTK.DomUtil.setPosition(this.div, this.hiddenPos);
            }
            
            if (this._unwrapped && this._objects.length > 0) {
                for (var i = 0; i < this._objects.length; i++) {
                    this._objects[i].updatePosition(zoom);
                }
            }
        },
        /**
         * Установить позицию кластера в разметке html
         * @method position
         * @param coord - новая позиция
         * @return {*}
         */
        position: function(coord) {
            
            if (this._hidden) {
                GWTK.DomUtil.setPosition(this.div, this.hiddenPos);
                return;
            }
            
            if (!coord) return coord;
            
            var point = null;
            if (GWTK.Util.isArray(coord) && coord.length > 1) {
                point = new GWTK.Point(coord[0], coord[1]);
            }else{
                point = new GWTK.Point(coord.x, coord.y);
            }
            if (!point) return coord;
            
            this.origin = new GWTK.Point(point.x, point.y);
            if (this.size !== undefined && this.size !== null) {
                this.offset.x = -Math.round(this.size.x / 2);
                this.offset.y = -this.size.y;
            }
            point.x += this.offset.x;
            point.y += this.offset.y;
            GWTK.DomUtil.setPosition(this.div, point);
            this.vertex = new GWTK.Point(point.x, point.y);
            return this.vertex;
        },
        /**
         * Получить MBR (minimum bounding rectangle) для выпуклой оболочки
         * @method getConvexHullMBR
         * @param zoom - зум
         * @return {*}
         */
        getConvexHullMBR: function(zoom) {
            if (this._chull && this._chull.length > 2) {
                var mbr = {
                    left: Number.MAX_VALUE, top: Number.MAX_VALUE,
                    right: Number.MIN_VALUE, bottom: Number.MIN_VALUE
                };
                var chull = this._chull;
                for (var i = 0; i < chull.length; i++) {
                    var xy = chull[i].getClientXY(zoom);
                    xy.x = Math.floor(xy.x);
                    xy.y = Math.floor(xy.y);
                    if (xy.x < mbr.left) mbr.left = xy.x;
                    if (xy.y < mbr.top) mbr.top = xy.y;
                    if (xy.x > mbr.right) mbr.right = xy.x;
                    if (xy.y > mbr.bottom) mbr.bottom = xy.y;
                }
                return mbr;
            }
            return null;
        },
        /**
         * Получить максимальный зум для выпуклой оболочки
         * @method getConvexHullMaxZoom
         * @return {*|string}
         */
        getConvexHullMaxZoom: function() {
            var map = this.getMap();
            var maxZoom = map.options.maxzoom;
            if (!maxZoom)
                maxZoom = 17;
            var msize = map.getWindowSize();
            var zoom = this.getZoom();
            var mbr = this.getConvexHullMBR(zoom);
            while (zoom <= maxZoom && (mbr.right - mbr.left) <= msize[0] && (mbr.bottom - mbr.top) <= msize[1]) {
                zoom++;
                mbr = this.getConvexHullMBR(zoom);
            }
            return zoom;
        },
        /**
         * Показать выпуклую оболочку на канве
         * @method showConvexHull
         */
        showConvexHull: function() {
            var map = this._strategy._clusterizator.getMap();
            if (map.handlers.movedrag.drag) {
                return;
            }
            if (this._convexHullVisible) return;
            if (this._clusterizator.useAnimation() && this._clusterizator._zooming) return;
            // var canvas = document.getElementsByClassName( "GWTK-ctor-overlay-canvas" );
            var canvas = this._strategy._clusterizator._panes.overlayCanvas;
            var center;
            if (canvas /*&& canvas.length > 0*/) {
                var mbr = {
                    left: Number.MAX_VALUE, top: Number.MAX_VALUE,
                    right: Number.MIN_VALUE, bottom: Number.MIN_VALUE
                };
                var a = [];
                this._chull = this.getConvexHull();
                var chull = this._chull;
                if (chull && chull.length > 2) {
                    for (var i = 0; i < chull.length; i++) {
                        var xy = chull[i].getClientXY(this.getZoom());
                        xy.x = Math.floor(xy.x);
                        xy.y = Math.floor(xy.y);
                        if (xy.x < mbr.left) mbr.left = xy.x;
                        if (xy.y < mbr.top) mbr.top = xy.y;
                        if (xy.x > mbr.right) mbr.right = xy.x;
                        if (xy.y > mbr.bottom) mbr.bottom = xy.y;
                        a.push({ x: xy.x, y: xy.y });
                    }
                    if (mbr) {
                        this._convexHullMBR = { left: mbr.left, top: mbr.top, right: mbr.right, bottom: mbr.bottom };
                        var lineWidth = 3;
                        var c = canvas/*[ 0 ]*/;
                        c.style.position = "absolute";
                        
                        c.style.left = Math.floor(mbr.left) + "px";
                        c.style.top = Math.floor(mbr.top) + "px";
                        c.width = Math.floor(mbr.right - mbr.left) + 2 * lineWidth - 1;
                        c.height = Math.floor(mbr.bottom - mbr.top) + 2 * lineWidth - 1;
                        
                        var ctx = c.getContext("2d");
                        ctx.beginPath();
                        ctx.lineWidth = lineWidth;
                        
                        center = this.getClientXY(this.getZoom());
                        var centerX = center.x - Math.floor(mbr.left) + 3 + lineWidth / 2;
                        var centerY = center.y - Math.floor(mbr.top);
                        ctx.moveTo(a[0].x - Math.floor(mbr.left) + lineWidth - 1, a[0].y - Math.floor(mbr.top) + lineWidth - 1);
                        for (i = 1; i < a.length; i++) {
                            ctx.lineTo(a[i].x - Math.floor(mbr.left) + lineWidth - 1, a[i].y - Math.floor(mbr.top) + lineWidth - 1);
                        }
                        ctx.lineTo(a[0].x - Math.floor(mbr.left) + lineWidth - 1, a[0].y - Math.floor(mbr.top) + lineWidth - 1);
                        
                        ctx.closePath();
                        
                        // create radial gradient
                        var grd = ctx.createRadialGradient(centerX, centerY, mbr.right - mbr.left, centerX, centerY, 0);
                        
                        grd.addColorStop(1, 'rgba(0, 0, 255, 0.4)');
                        grd.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                        
                        ctx.fillStyle = grd;
                        
                        ctx.fill();
                        ctx.strokeStyle = 'blue';
                        ctx.stroke();
                        
                        c.style.left = Math.floor(mbr.left) + "px";
                        c.style.top = Math.floor(mbr.top - 30) + "px";
                        
                        this._convexHullVisible = true;
                    }
                }
            }
        },
        /**
         * Скрыть выпуклую оболочку кластера
         * @method hideConvexHull
         */
        hideConvexHull: function() {
            if (!this._convexHullVisible) return;
            // var canvas = document.getElementsByClassName( "GWTK-ctor-overlay-canvas" );
            var canvas = this._strategy._clusterizator._panes.overlayCanvas;
            if (canvas /*&& canvas.length > 0*/) {
                var c = canvas/*[ 0 ]*/;
                var ctx = c.getContext("2d");
                ctx.clearRect(0, 0, c.width, c.height);
                c.style.position = "absolute";
                c.style.left = "-1000px";
                c.style.top = "-1000px";
                this._convexHullVisible = false;
                this._convexHullMBR = null;
            }
        },
        /**
         * Развернуть кластер, т.е. показать объекты входящие в кластер, если установлен максимальный зум для карты.
         * @method unwrap
         */
        unwrap: function() {
            
            if (this._unwrapped) return;
            this._clusterizator._addUnwrappedCluster(this);
            var count = this.getAllObjectCount();
            var limitCount = 8;
            if (count > 0) {
                var closeButtonOffset = { x: 0, y: 0 };
                var cXY = this.getClientXY();
                var objs = this.getAllObjects();
                var shoulder = 50;
                var offset, i, r;
                this.hideConvexHull();
                if (count <= limitCount) {
                    r = shoulder - (3 * (limitCount - count));
                    var step = (360 / count) * (Math.PI / 180);
                    var angle = 0;
                    for (i = 0; i < objs.length; i++) {
                        offset = {
                            x: cXY.x - (cXY.x - r * Math.cos(angle)),
                            y: cXY.y - (cXY.y - r * Math.sin(angle))
                        };
                        objs[i].setUnwrappedOffset(offset);
                        objs[i].create(this.getZoom(), true);
                        objs[i].updatePosition(this.getZoom());
                        angle += step;
                    }
                    closeButtonOffset.x = 12;
                    closeButtonOffset.y = 12;
                }else{
                    //спираль Архимеда, а точнее её приближение методом Эйлера.
                    //thanks to Mercury13 (https://toster.ru/q/78264)
                    var dSafe = 40;
                    var rSafe = dSafe / 2;
                    var a = -0.3 * dSafe;
                    var x = 0;
                    var y = 0;
                    for (i = 0; i < objs.length; i++) {
                        if (i === 0) {
                            offset = { x: 0, y: 30 };
                        }else if (i === 1) {
                            offset = { x: dSafe - 5, y: 7 };
                            x += dSafe;
                        }else{
                            r = Math.sqrt(x * x + y * y);
                            var tx = a * x + r * y;
                            var ty = a * y - r * x;
                            var tLen = Math.sqrt(tx * tx + ty * ty);
                            var k = dSafe / tLen;
                            x += tx * k;
                            y += ty * k;
                            x = Math.floor(x + 0.5);
                            y = Math.floor(y + 0.5);
                            offset = { x: x, y: y };
                        }
                        objs[i].setUnwrappedOffset(offset);
                        objs[i].create(this.getZoom(), true);
                        objs[i].updatePosition(this.getZoom());
                    }
                    closeButtonOffset.x = 12;
                    closeButtonOffset.y = 0;
                }
                var zoom = this.getZoom();
                //create close button as fake marker
                var closeMarker = new GWTK.markerPoint(this._strategy, this.getLatLng(), undefined, null);
                closeMarker._closeMarker = true;
                closeMarker.setCluster(zoom, this, false);
                this._objects.push(closeMarker);
                closeMarker.create(zoom, true);
                closeMarker.setUnwrappedOffset(closeButtonOffset);
                closeMarker.updatePosition(zoom);
                this._unwrapped = true;
                this.hide();
            }
        },
        /**
         * Свернуть кластер. (см. unwrap)
         * @method wrap
         * @param ignore
         */
        wrap: function(ignore) {
            if (!ignore) {
                this._clusterizator._removeUnwrappedCluster(this);
            }
            var objs = this._objects;
            for (var i = 0; i < objs.length; i++) {
                objs[i].setUnwrappedOffset(null);
                objs[i].remove();
            }
            if (objs[objs.length - 1]._closeMarker) {
                objs.splice(objs.length - 1, 1);
            }
            this._unwrapped = false;
            this.show();
        },
        /**
         * Скрыть div кластера
         * @method hide
         */
        hide: function() {
            this.setCursor("default");
            this.setOpacity(0);
            this._hidden = true;
            GWTK.DomUtil.setPosition(this.div, this.hiddenPos);
        },
        /**
         * Показать div кластера
         * @method show
         */
        show: function() {
            this.setCursor("pointer");
            this.setOpacity(1);
            this._hidden = false;
            this.updatePosition(this.getZoom());
        },
        /**
         * Установить прозрачность
         * @method setOpacity
         * @param opacity
         */
        setOpacity: function(opacity) {
            this.options.opacity = opacity;
            this._updateOpacity();
        },
        /**
         * Установить курсор
         * @method setCursor
         * @param cursor
         */
        setCursor: function(cursor) {
            this.options.cursor = cursor;
            this._updateCursor();
        },
        /**
         * Обновить прозрачность
         * @method _updateOpacity
         * @private
         */
        _updateOpacity: function() {
            GWTK.DomUtil.setOpacity(this.div, this.options.opacity);
        },
        /**
         * Обновить курсор
         * @method _updateCursor
         * @private
         */
        _updateCursor: function() {
            if (this.div) {
                this.div.style.cursor = this.options.cursor;
            }
        }
    };
    
    inherits(GWTK.clusterPoint, GWTK.commonPoint);
    /**
     * Обработчики событий для кластера (т.е. для div-а кластера)
     * @constructor GWTK.clusterhandlers
     * @param cluster
     */
    GWTK.clusterhandlers = function(cluster) {
        this._cluster = cluster;
        this.init();
    };
    GWTK.clusterhandlers.prototype = {
        init: function() {
        },
        mapclick: function(event) {
            var map = this.cluster.getMap();
            map.handlers.mapclick(event);
        },
        mapmousedown: function(event) {
            var map = this.cluster.getMap();
            map.handlers.mapmousedown(event);
            event.preventDefault();
        },
        mapmousemove: function(event) {
            if (GWTK.movedrag().isDragEnabled()) {
                this.cluster.hideConvexHull();
            }
            var map = this.cluster.getMap();
            map.handlers.mapmove(event);
            event.preventDefault();
            
        },
        mapmouseup: function(event) {
            if (!GWTK.movedrag().isDragEnabled()) {
                if (this.cluster._convexHullVisible && this.cluster._convexHullMBR) {
                    var chMaxZoom = this.cluster.getConvexHullMaxZoom();
                    var cZoom = this.cluster.getZoom();
                    var scaleRatio = chMaxZoom - cZoom;
                    if (scaleRatio > 1) {
                        var map = this.cluster.getMap();
                        this.cluster.hideConvexHull();
                        map.zooming(scaleRatio, this.cluster.getClientXY());
                    }else{
                        if (this.cluster.getZoom() == this.cluster.getMaxZoom()) {
                            this.cluster.unwrap();
                        }
                    }
                }else if (this.cluster.getAllObjectCount() > 0) {
                    var curZoom = this.cluster.getZoom();
                    var maxZoom = this.cluster.getMaxZoom();
                    if (curZoom === maxZoom) {
                        this.cluster.unwrap();
                        return false;
                    }else{
                        var map = this.cluster.getMap();
                        map.zooming(1, this.cluster.getClientXY()); //?
                    }
                }
            }
            GWTK.maphandlers.map.handlers.mapmouseup(event);
            event.preventDefault();
        },
        mousewheel: function(event) {
            this.cluster.hideConvexHull();
            GWTK.maphandlers.map.handlers.mousewheelscaling(event);
        },
        mapmouseenter: function(event) {
            this.cluster.showConvexHull();
            event.preventDefault();
        },
        mapmouseleave: function(event) {
            if (GWTK.movedrag().isDragEnabled()) return;
            this.cluster.hideConvexHull();
            event.preventDefault();
        }
        
    };
    /**
     * Ячейка алгоритма grid-кластеризации
     * @constructor GWTK.gridcluster
     */
    GWTK.gridcluster = function(clusterizator) {
        this._clusterizator = clusterizator;
        this._cellSize = (this._clusterizator && this._clusterizator._options && this._clusterizator._options.cellsize) ?
            (this._clusterizator && this._clusterizator._options && this._clusterizator._options.cellsize) : 80;
//        this._cellSize = 80;
        this._cellSizeSquare = this._cellSize * this._cellSize;
        this._grid = {};
        this._objectPlaces = {};
    };
    
    GWTK.gridcluster.prototype = {
        /**
         * Получить ближайший объект в смежных ячейках
         * @method getClosestObj
         * @param place  - плоские координаты объекта
         * @return {{closestOne: null, nearOne: null}}
         */
        getClosestObj: function(place) {
            var res = { closestOne: null, nearOne: null };
            var c = this._getObjGridCoord(place);
            var i, j, k, row, cell, len, currObj, distance, DistanceSquare = this._cellSizeSquare;
            for (i = c.y - 1; i <= c.y + 1; i++) {
                row = this._grid[i];
                if (row) {
                    for (j = c.x - 1; j <= c.x + 1; j++) {
                        cell = row[j];
                        if (cell) {
                            for (k = 0, len = cell.length; k < len; k++) {
                                currObj = cell[k];
                                distance = this._calcDistanceSquare(this._objectPlaces[this._getObjId(currObj)], place);
                                if (distance < DistanceSquare) {
                                    DistanceSquare = distance;
                                    res.closestOne = currObj;
                                }
                            }
                        }
                    }
                }
            }
            return res;
        },
        /**
         * Получить объекты в ячейке.
         * @method getObjects
         * @return {Array}
         */
        getObjects: function() {
            var res = [];
            var row, cell, k, len;
            for (var i in this._grid) {
                if (this._grid.hasOwnProperty(i)) {
                    row = this._grid[i];
                    if (row) {
                        for (var j in row) {
                            if (row.hasOwnProperty(j)) {
                                cell = row[j];
                                if (cell) {
                                    for (k = 0, len = cell.length; k < len; k++) {
                                        if (cell[k]) {
                                            res.push(cell[k]);
                                        }
                                    }
                                }
                            }
                            
                        }
                    }
                }
            }
            return res;
        },
        /**
         * Вычислить квадрат расстояния между pt1 и pt2
         * @method _calcDistanceSquare
         * @param pt1 - точки на плоскости
         * @param pt2 - точки на плоскости
         * @return {number}
         * @private
         */
        _calcDistanceSquare: function(pt1, pt2) {
            var dx = pt2.x - pt1.x;
            var dy = pt2.y - pt1.y;
            return dx * dx + dy * dy;
        },
        /**
         * Добавить объект в ячейку
         * @method addObject
         * @param object - объект
         * @param place - плоские коор-ты объекта
         */
        addObject: function(object, place) {
            var c = this._getObjGridCoord(place);
            var grid = this._grid;
            var row = grid[c.y] = grid[c.y] || {};
            var cell = row[c.x] = row[c.x] || [];
            this._objectPlaces[this._getObjId(object)] = place;
            cell.push(object);
        },
        /**
         * Удалить объект из ячейки
         * @method removeObject
         * @param object - объект
         * @param place - плоские коор-ты объекта
         * @return {boolean}
         */
        removeObject: function(object, place) {
            var c = this._getObjGridCoord(place);
            var grid = this._grid;
            var row = grid[c.y] = grid[c.y] || {};
            var cell = row[c.x] = row[c.x] || [];
            var i, len;
            delete this._objectPlaces[this._getObjId(object)];
            for (i = 0, len = cell.length; i < len; i++) {
                if (cell[i] === object) {
                    cell.splice(i, 1);
                    if (len === 1) {
                        delete row[c.x];
                    }
                    return true;
                }
            }
        },
        /**
         * Получить кол-во объектов в ячейке
         * @method getObjectCount
         * @return {Number}
         */
        getObjectCount: function() {
            return this._objects.length;
        },
        /**
         * Получить объект в ячейке по индексу
         * @method getObject
         * @param index - индекс
         * @return {*}
         */
        getObject: function(index) {
            return this._objects[index];
        },
        /**
         * Получить координаты ячейки относительно размера ячейки
         * @method _getObjGridCoord
         * @param place - плоскиеи коор-ты
         * @return {{x: number, y: number}}
         * @private
         */
        _getObjGridCoord: function(place) {
            return { x: Math.floor(place.x / this._cellSize), y: Math.floor(place.y / this._cellSize) };
        },
        /**
         * Получить идент. объекта
         * @method _getObjId
         * @param object - объект
         * @return {*}
         * @private
         */
        _getObjId: function(object) {
            return GWTK.ClusterizationUtils.stamp(object);
        }
    };
    /**
     * Обсчитанные кластеры
     * @constructor GWTK.clusters
     * @param strategy
     */
    GWTK.clusters = function(strategy) {
        this._strategy = strategy;
        this._clusterizator = this._strategy.getClusterizator();
    };
    
    GWTK.clusters.prototype = {
        /**
         * Добавить div-ы кластеров на карту (вызывается при смене масштаба или окончании ролирования карты)
         * @method addToMap
         * @param toZoom - зум после окончания операции
         * @param fromZoom - зум до начала операции
         * @param prevGeoBounds - гео габариты до начала операции
         * @param newGeoBounds - гео габариты после окончания операции
         */
        addToMap: function(toZoom, fromZoom, prevGeoBounds, newGeoBounds) {
            var clusters = this[toZoom];
            if (clusters) {
                var cluster = null;
                var div = null;
                var geo = null;
                for (var i = 0; i < clusters.length; i++) {
                    cluster = clusters[i];
                    div = cluster.geopoint();
                    if (!div) {
                        geo = cluster.getLatLng();
                        if (geo === undefined) continue;
                        if (newGeoBounds && !newGeoBounds.contains(new GeoPoint(geo.lng, geo.lat))) continue;
                        div = cluster.create(false, fromZoom, toZoom);
                    }
                }
            }
        },
        /**
         * Удалить div-ы кластеров с карты (вызывается при смене масштаба или окончании ролирования карты)
         * @method removeFromMap
         * @param fromZoom - зум до начала операции
         * @param toZoom - зум после окончания операции
         * @param prevGeoBounds - гео габариты до начала операции
         * @param newGeoBounds - гео габариты после окончания операции
         */
        removeFromMap: function(fromZoom, toZoom, prevGeoBounds, newGeoBounds) {
            var clusters = this[fromZoom];
            if (clusters) {
                
                // var overlayPane = this._strategy.getOverlayPane();
                // if (overlayPane)  {
                //     $(overlayPane).find('.marker.zoom'+ fromZoom).remove();
                // }
                
                // var overlayPane = this._strategy.getOverlayPane();
                var cluster = null;
                var div = null;
                var geo = null;
                // var place = null;
                for (var i = 0; i < clusters.length; i++) {
                    cluster = clusters[i];
                    div = cluster.geopoint();
                    if (div) {
                        geo = cluster.getLatLng();
                        if (prevGeoBounds && newGeoBounds && geo) {
                            if (prevGeoBounds.contains(new GeoPoint(geo.lng, geo.lat)) && newGeoBounds.contains(new GeoPoint(geo.lng, geo.lat))) {
                                cluster.updatePosition(fromZoom);
                                //                               console.log('update', fromZoom, toZoom, '0');
                                continue;
                            }else{
                                if (prevGeoBounds.contains(new GeoPoint(geo.lng, geo.lat))) {
                                    cluster.remove(fromZoom, toZoom);
                                    //                                   console.log(fromZoom, toZoom, '1');
                                }
                            }
                        }else if (prevGeoBounds && geo) {
                            cluster.remove(fromZoom, toZoom);
                            // if (prevGeoBounds.contains(new GeoPoint(geo.lng,geo.lat))){
//                             console.log(fromZoom, toZoom, '2');
                            // }
                        }else{
                            cluster.remove(fromZoom, toZoom);
//                             console.log(fromZoom, toZoom, '3');
                        }
                    }
                }
            }
        },
        /**
         * Очистить(удалить все div-ы кластеров)
         * @method clear
         */
        clear: function() {
            for (var zoom in this) {
                if (GWTK.ClusterizationUtils._isNumber(zoom)) {
                    this.removeFromMap(zoom, zoom);
                    this[zoom] = null;
                }
            }
        }
        
    };
    /**
     * Обсчитанные объекты (маркеры) не входящие ни в какой кластер
     * @constructor GWTK.unclusters
     * @param strategy - стратегия
     */
    GWTK.unclusters = function(strategy) {
        this._strategy = strategy;
    };
    
    GWTK.unclusters.prototype = {
        /**
         * Добавить div-ы маркеров на карту (вызывается при смене масштаба или окончании ролирования карты)
         * @method addToMap
         * @param toZoom - зум после окончания операции
         * @param fromZoom - зум до начала операции
         * @param prevGeoBounds - гео габариты до начала операции
         * @param newGeoBounds - гео габариты после окончания операции
         */
        addToMap: function(toZoom, fromZoom, prevGeoBounds, newGeoBounds) {
            var unclusters = this[toZoom];
            if (unclusters) {
                var object = null;
                var div = null;
                var geo = null;
                for (var i = 0; i < unclusters.length; i++) {
                    object = unclusters[i];
                    div = object.geopoint();
                    if (!div) {
                        geo = object.getLatLng();
                        if (geo === undefined) continue;
                        if (newGeoBounds && !newGeoBounds.contains(new GeoPoint(geo.lng, geo.lat))) continue;
                        object.create(toZoom, false, fromZoom, toZoom);
                    }
                }
            }
        },
        /**
         * Удалить div-ы маркеров с карты (вызывается при смене масштаба или окончании ролирования карты)
         * @param fromZoom - зум до начала операции
         * @param toZoom - зум после окончания операции
         * @param prevGeoBounds - гео габариты до начала операции
         * @param newGeoBounds - гео габариты после окончания операции
         */
        removeFromMap: function(fromZoom, toZoom, prevGeoBounds, newGeoBounds) {
            var unclusters = this[fromZoom];
            if (unclusters) {
                // var overlayPane = this._strategy.getOverlayPane();
                // if (overlayPane)  {
                //     $(overlayPane).find('.marker.zoom'+ fromZoom).remove();
                // }
                var overlayPane = this._strategy.getOverlayPane();
                var object = null;
                var div = null;
                var geo = null;
                var place = null;
                for (var i = 0; i < unclusters.length; i++) {
                    object = unclusters[i];
                    div = object.geopoint();
                    if (div) {
                        geo = object.getLatLng();
                        if (prevGeoBounds && newGeoBounds && geo) {
                            if (prevGeoBounds.contains(new GeoPoint(geo.lng, geo.lat)) && newGeoBounds.contains(new GeoPoint(geo.lng, geo.lat))) {
                                object.updatePosition(fromZoom);
                                continue;
                            }else{
                                if (prevGeoBounds.contains(new GeoPoint(geo.lng, geo.lat))) {
                                    object.remove(fromZoom, toZoom);
                                }
                            }
                        }else if (prevGeoBounds && geo) {
                            if (prevGeoBounds.contains(new GeoPoint(geo.lng, geo.lat))) {
                                object.remove(fromZoom, toZoom);
                            }
                        }else{
                            object.remove(fromZoom, toZoom);
                        }
                    }
                }
            }
        },
        /**
         * Очистить (удалить все div-ы маркеров)
         * @method clear
         */
        clear: function() {
            for (var zoom in this) {
                if (GWTK.ClusterizationUtils._isNumber(zoom)) {
                    this.removeFromMap(zoom, zoom);
                    this[zoom] = null;
                }
            }
        }
    };
    /**
     * Стратегия "grid-кластеризация" (на будущее) см. паттерн "стратегия"
     * @constructor GWTK.clusterstrategy
     * @param clusterizator
     */
    GWTK.clusterstrategy = function(clusterizator) {
        this._clusterizator = clusterizator;
        this._initCenter = null;
        this._initZoom = null;
        this.chunkSize = 200;
        this.execDelay = 50;
        this._objectCount = 0;
        this._init();
    };
    
    GWTK.clusterstrategy.prototype = {
        
        _init: function() {
            this._clusters = new GWTK.clusters(this);
            this._unclusteredItems = new GWTK.unclusters(this);
            this._gridClustered = null;
            this._gridUnclustered = null;
        },
        
        _addCluster: function(zoom, cluster) {
            if (!this._clusters[zoom]) {
                this._clusters[zoom] = []
            }
            this._clusters[zoom].push(cluster);
        },
        
        _getDistanceLimit: function(zoom) {
            return this._cellSize;
        },
        
        _isHandled: function(zoom, objKey) {
            return (this._handledObjs[zoom].get(objKey));
        },
        
        _setAsHandled: function(zoom, objKey, obj) {
            this._handledObjs[zoom].put(objKey, obj);
        },
        /**
         * Получить максимальный масштаб
         * @method _getMaxZoom
         * @return {*}
         * @private
         */
        _getMaxZoom: function() {
            var map = this.getMap();
            if (map && map.options.maxzoom)
                return map.options.maxzoom;
            return 17;
        },
        /**
         * Обработать объект для масштаба zoom
         * @param object - объект
         * @param zoom - зум
         * @private
         */
        _clusterifyObj: function(object, zoom) {
            if (object) {
                var cluster1 = null;
                var currChild = null;
                var place;
                var closestObj = null;
                for (; zoom > 0; zoom--) {
                    place = object.getPlace(zoom);
                    closestObj = this._gridClustered[zoom].getClosestObj(place);
                    if (closestObj.closestOne) {
                        if (closestObj.closestOne instanceof GWTK.clusterPoint) {
                            closestObj.closestOne.addObject(object);
                            object.removeFromParentCluster(closestObj.closestOne.getZoom() - 1);
                        }
                        return;
                    }
                    closestObj = this._gridUnclustered[zoom].getClosestObj(place);
                    if (closestObj.closestOne) {
                        //add objects to new cluster
                        cluster1 = new GWTK.clusterPoint(this, null, zoom, null);
                        this._addCluster(zoom, cluster1);
                        cluster1.addObject(object);
                        cluster1.addObject(closestObj.closestOne);
                        object.removeFromParentCluster(cluster1.getZoom() - 1);
                        closestObj.closestOne.removeFromParentCluster(cluster1.getZoom() - 1);
                        place = cluster1.getPlace(zoom);
                        this._gridClustered[zoom].addObject(cluster1, place);
                        currChild = cluster1;
                        for (var z = zoom; z > 0; z--) {
                            place = closestObj.closestOne.getPlace(z);
                            if (!this._gridUnclustered[z].removeObject(closestObj.closestOne, place)) {
                                cluster1 = closestObj.closestOne.getCluster(z);
                                if (cluster1) {
                                    cluster1.addObject(object);
                                    object.removeFromParentCluster(cluster1.getZoom() - 1);
                                }
                                if (currChild && (zoom - 1 == z) && cluster1 && cluster1 != currChild) {
                                    cluster1.addChild(currChild, true);
                                }
                                break;
                            }
                            if (z < zoom) {
                                cluster1 = new GWTK.clusterPoint(this, null, z, null);
                                this._addCluster(z, cluster1);
                                cluster1.addObject(object);
                                cluster1.addObject(closestObj.closestOne);
                                if (currChild && cluster1 && currChild != cluster1) {
                                    cluster1.addChild(currChild, true);
                                    currChild = cluster1;
                                }
                                place = cluster1.getPlace(z);
                                this._gridClustered[z].addObject(cluster1, place);
                            }
                        }
                        return;
                    }
                    this._gridUnclustered[zoom].addObject(object, place);
                }
            }
        },
        /**
         * Асинхронная обработка объектов
         * @method _asyncClusterify
         * @param strategy - стратегия
         * @param offset - смещение относительно начала массива объектов objects
         * @param size - кол-во эл-тов для обработки
         * @param objects - массив объектов
         * @private
         */
        _asyncClusterify: function(strategy, offset, size, objects) {
            var maxZoom = strategy._getMaxZoom();
            for (var i = offset; i < offset + size; i++) {
                strategy._clusterifyObj(objects[i], maxZoom);
            }
            strategy._objectCount = strategy._objectCount + size;
        },
        /**
         * Окончание асинхронной обработки объектов
         * @param start - время начала обработки
         * @param strategy - стратегия
         * @param size - текущее общее кол-во обработанных эл-тов.
         * @private
         */
        _asyncEnd: function(start, strategy, size) {
            while (strategy._objectCount < size) {
                //do nothing;
            }
            var maxZoom = strategy._getMaxZoom();
            for (var zoom = 1; zoom <= maxZoom; zoom++) {
                strategy._unclusteredItems[zoom] = strategy._gridUnclustered[zoom].getObjects();
            }
            var zoom = strategy.getMap().options.tilematrix;
            var map = strategy.getMap();
            
            var initzoom = null;
            if (strategy._clusters || strategy._unclusteredItems) {
                var geoBounds = map.getMapGeoBounds(true);
                if (map && strategy._initCenter instanceof GWTK.LatLng) {
                    initzoom = strategy._initZoom;
                    if (!initzoom) {
                        initzoom = 11;
                    }
                    const mapCenter = new GeoPoint(strategy._initCenter.lng, strategy._initCenter.lat, 0, map.ProjectionId).toMapPoint();
                    map.setView(mapCenter, initzoom);
                }
                if (initzoom && initzoom != zoom) {
                    var newGeoBounds = map.getMapGeoBounds(true);
                    strategy.removeFromMap(zoom, zoom, geoBounds, null);
                    strategy.addToMap(initzoom, initzoom, null, newGeoBounds);
                }else{
                    if (initzoom && initzoom == zoom) {
                        var newGeoBounds = map.getMapGeoBounds(true);
                        strategy.removeFromMap(zoom, zoom, geoBounds, newGeoBounds);
                        strategy.addToMap(zoom, zoom, geoBounds, newGeoBounds);
                    }else{
                        strategy.removeFromMap(zoom, zoom);
                        strategy.addToMap(zoom, zoom, null, geoBounds);
                    }
                }
            }
        },
        /**
         * Обработка массива объектов (см. _asyncClusterify и _asyncEnd)
         * @method _clusterify
         * @param objects - массив объектов
         * @param center - центр карты куда нужно переместиться после кластеризации
         * @param zoom - какой масштаб нужно установить после кластеризации
         * @private
         */
        _clusterify: function(objects, center, zoom) {
            //init grid;
            var lastUpdate = Date.now();
            this._initCenter = center;
            this._initZoom = zoom;
            this._gridClustered = {};
            this._gridUnclustered = {};
            this._clusters = new GWTK.clusters(this);
            this._unclusteredItems = new GWTK.unclusters(this);
            this._objectCount = 0;
            for (var zoom = 1; zoom <= this._getMaxZoom(); zoom++) {
                this._gridClustered[zoom] = new GWTK.gridcluster(this._clusterizator);
                this._gridUnclustered[zoom] = new GWTK.gridcluster(this._clusterizator);
            }
            var self = this;
            if (objects) {
                var offset = 0;
                var size;
                for (var i = 0; i < objects.length; i++) {
                    if (i % this.chunkSize == 0) {
                        size = (objects.length - i < this.chunkSize) ? objects.length - i : this.chunkSize;
                        window.setTimeout(
                            self._asyncClusterify,
                            self.execDelay,
                            self,
                            offset,
                            size,
                            objects
                        );
                        offset = offset + size;
                    }
                }
                window.setTimeout(
                    self._asyncEnd,
                    self.execDelay,
                    lastUpdate,
                    self,
                    objects.length
                );
            }
            
        },
        /**
         * Удалить объекты (div-ы кластеров и маркеров) с карты (вызывается при смене масштаба или окончании ролирования карты)
         * @method removeFromMap
         * @param fromZoom - зум до начала операции
         * @param toZoom - зум после окончания операции
         * @param prevGeoBounds - гео габариты до начала операции
         * @param newGeoBounds - гео габариты после окончания операции
         */
        removeFromMap: function(fromZoom, toZoom, prevGeoBounds, newGeoBounds) {
            this._clusters.removeFromMap(fromZoom, toZoom, prevGeoBounds, newGeoBounds);
            this._unclusteredItems.removeFromMap(fromZoom, toZoom, prevGeoBounds, newGeoBounds);
        },
        /**
         * Добавить объекты (div-ы кластеров и маркеров) на карту (вызывается при смене масштаба или окончании ролирования карты)
         * @method addToMap
         * @param toZoom - зум после окончания операции
         * @param fromZoom - зум до начала операции
         * @param prevGeoBounds - гео габариты до начала операции
         * @param newGeoBounds - гео габариты после окончания операции
         */
        addToMap: function(toZoom, fromZoom, prevGeoBounds, newGeoBounds) {
            this._clusters.addToMap(toZoom, fromZoom, prevGeoBounds, newGeoBounds);
            this._unclusteredItems.addToMap(toZoom, fromZoom, prevGeoBounds, newGeoBounds);
        },
        /**
         * Обработка массива объектов
         * @method clusterify
         * @param objects - массив объектов
         * @param center - центр карты куда нужно переместиться после кластеризации
         * @param zoom - какой масштаб нужно установить после кластеризации
         */
        clusterify: function(objects, center, zoom) {
            this._clusterify(objects, center, zoom);
        },
        /**
         * Получить кол-во кластеров для масштаба zoom
         * @method getClusterCount
         * @param zoom
         * @return {number}
         */
        getClusterCount: function(zoom) {
            if (this._clusters[zoom]) {
                return this._clusters[zoom].length;
            }
            return 0;
        },
        /**
         * Получить кластер для масштаба zoom по индексу
         * @method getCluster
         * @param zoom - масштаб
         * @param index - индекс в массиве
         * @return {*}
         */
        getCluster: function(zoom, index) {
            return this._clusters[zoom][index];
        },
        /**
         * Получить кол-во некластеризованных маркеров для масштаба zoom
         * @method getUnclusteredCount
         * @param zoom - масштаб
         * @return {number}
         */
        getUnclusteredCount: function(zoom) {
            if (this._unclusteredItems[zoom]) {
                return this._unclusteredItems[zoom].length;
            }
            return 0;
        },
        /**
         * Получить некластеризованный маркер для масштаба zoom по индексу
         * @method getUnclustered
         * @param zoom - масштаб
         * @param index - индекс в массиве
         * @return {*}
         */
        getUnclustered: function(zoom, index) {
            return this._unclusteredItems[zoom][index];
        },
        /**
         * Получить карту
         * @method getMap
         * @return {*|Object}
         */
        getMap: function() {
            return this._clusterizator.getMap();
        },
        /**
         * Получить контейнер для кластеров и маркеров
         * @method getOverlayPane
         * @return {*|null}
         */
        getOverlayPane: function() {
            return this._clusterizator.getOverlayPane();
        },
        /**
         * Получить настройки
         * @method getOptions
         * @return {*}
         */
        getOptions: function() {
            return this._clusterizator.getOptions();
        },
        /**
         * Получить экземпляр клстеризатора
         * @method getClusterizator
         * @return {*}
         */
        getClusterizator: function() {
            return this._clusterizator;
        }
    };
    /**
     * Обычный hashmap
     */
    GWTK.hashmap = function() {
        this.clear();
    };
    GWTK.hashmap.prototype = {
        /**
         * Очистить
         * @method clear
         */
        clear: function() {
            this._data = {};
        },
        /**
         * Дополнить
         * @method put
         * @param key - ключ
         * @param value - значение
         */
        put: function(key, value) {
            this._data[this.hash(key)] = [key, value];
        },
        /**
         * Получить
         * @method get
         * @param key - ключ
         * @return {*}
         */
        get: function(key) {
            var data = this._data[this.hash(key)];
            return data && data[1];
        },
        /**
         * Получить ключи
         * @method keys
         * @return {Array}
         */
        keys: function() {
            var keys = [];
            this.forEach(function(value, key) {
                keys.push(key);
            });
            return keys;
        },
        /**
         * Получить массив значений
         * @method values
         * @return {Array}
         */
        values: function() {
            var values = [];
            this.forEach(function(value) {
                values.push(value);
            });
            return values;
        },
        /**
         * Удалить
         * @method del
         * @param key - ключ свойсвтва
         */
        del: function(key) {
            delete this._data[this.hash(key)];
        },
        /**
         * Обход всех свойств
         * @method forEach
         * @param func - функция обратного вызова
         * @param ctx - контекст
         */
        forEach: function(func, ctx) {
            for (var key in this._data) {
                if (this._data.hasOwnProperty(key)) {
                    var data = this._data[key];
                    func.call(ctx || this, data[1], data[0]);
                }
            }
        },
        /**
         * Получить первый элемент хэша
         * @method first
         * @return {*}
         */
        first: function() {
            for (var prop in this._data) {
                if (this._data.hasOwnProperty(prop)) {
                    var data = this._data[prop];
                    return data && data[1];
                }
            }
            return null;
        },
        /**
         * Получить длину хэша
         * @method count
         * @return {Number}
         */
        count: function() {
            return this.keys().length;
        },
        /**
         * Есть ли ключ в объекте
         * @method has
         * @param key - ключ
         * @return {boolean}
         */
        has: function(key) {
            return this.hash(key) in this._data;
        },
        /**
         * Хэш
         * @method hash
         * @param key - ключ
         * @return {string}
         */
        hash: function(key) {
            return key + '';
        }
    };

//Kozhanov + 30.10.2015
    GWTK.imgClusterMarker = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAGxklEQVRoQ9VYWWxbRRQ9M8/OnhIKTW23SFAoFYSKJUCV2GkrEIhsRSBVrEIgFrF8AEIVSEj8gAChiuUDEKJC4oNWokhFjZOqiCUQ2y1lX9IKKGtpnKSUQBbXefa7F81LnDre3nu2A+V9vrn33HNm7p25MwJl+o5s8NcbLLqI+TJB8nwwVpDGixS8JPob0H5mSV9Jlu9pGvUu2RmeKEdoUSrI7x2BszXgEQDXQ6LaFh4hxgLbXJrxdOPOPQdt+eQxKlrAoY0t1a649jgx3S8hXcWQICAB8PP6pPuxM/r748VgFCVgtGvtygTTDinQVEzQLB/iryXztUt3RX50iudYwOENay+UlNwNyCVOgxWyJ2DUBVy5NBj6ygmuIwFq5g0kw+UmnyJsijCo1clK2BYw1N1cw1S9r1DaMBgT0wlM6DriSQMGkclNkxJVLg31lRWor3BDoEBY4q/jMfcauzVhW0C0O7AZjIfyLe+4ruPI1DEkZ0nns3NJgcaaWtRXugtlyjPeYOhhO6lkS4DaKoWkwZy7DQMjsSn8FdftxJuzaaiqxNKaGuRaDLU7uQw6x04q2RIQ7Qi8BonbcjEcmXJOPoVjiqitySmcwVt8wfCdVrNiKeBo+5pFunAP5zqkVNpEJ6bmxSDgmAZ+EcDWqQZ9vxqsG3M3kZQ3wcC9kKhKd/DV16K+oiJ7Z4Ux5a6u9DRu758sJMJSwHB34AZmbM0EUQX709j4/Jxn/CYgrlq399sDuYK+7z+3Ccy7JMvTUuMuKXFmw0k5UwmCr/P2hN8sScBQl/9VAXFHJsj4tI7o5PHZN2eeRXM+8il/JUImxGfQUJn656tTRZ29CoLxiqc3dHdJAqIdbfsg+ZJMkMMTk5jUE3O/BXjzuj37N1nlrBrvb2l6FsCDKVuVQiqVMj8C9i4LhlpKE9De9gc0PiUT5Mexv+eljwBftG7P/i/sCHh/zepmKenTlK1b07CiwWxcM+tpdFkwtLQkAYe7AroEsjbt74+OgdOQYw3TVR27Dk7bERBpaanWMR5LWz6sWnxytitB9/aF5lItF7ZlER/uCBhSQmY6/xsCiMhY1hcp2OlaCoh2BY4CWGyVQpKpee3eA5/bWYEP/OddLIg/OZ5CEivUTpSdREe8wUhjSSkUbW/9DJq8yKqIIfDs+shg3lYj3f+DlnOfFxD3WxUxA/t8wdCakgQMdQa2CIHbM0GyDjFCnFx88WXh/YOFAn7Ysno1G/RJ+jbqravFooXaRoc7265nwdsySc0cZGonOl7KJOgQhGjPJ8Ikj0QfoC1P4RU8yCA2eoMDb5W0AoVaCdU6D01mnPSEOCReJpJvVMk6s5WYlhNNILpZGOLu9JlXY8vq61BXkd2ZEtOklqjzeN55Z36vkqHGsoiVfb7TWI2NTMXwV9zW7pk1kSdXVaIxTzMHppe8vZH7rDYFWwJG2lvPTGryQK7zQB0GIzHnIkzyedppgKaZsMrXF/m1LAJmViHwlJh5Psn5qVvYqK0LjTRb6FxpcxxYPO4NDjxmRV6N21oBU0B3c43g6u8AzBVgVgCGeZ2c0BOIGwYSZJgmbnWl1Fwm6UWqdS4UlehQspZXnbZ9z7GyClBgw13+GxniDTvAxdoIgRs9PaGsXS8fnu0VSAFE29si0Lhgh1gseQYivmDI78TfuYDu1kuI5cfSQfrZIUQAC+JLfX3huS7Vjp9jAQo02hV4HcAtdgLYthHidW/PwK227WcNixJwZIPfpxN9L6Fl30KcMgCgDq2KpHb2kt0DUafuRQmY2ZUCjwrGE04D5rIXLB719A48WQxW0QJ+Xr++qqI2cUAKcXoxgVM+xPyLPuU+x+5LXGasogWYtdAZ2AiBgq8G1uKsG7ZCGCUJMEV0+z8Ei7XWRHNYCP7I2xNeV5RvKUWcHlA9tyNJn+a6dhYiRgRiUPPyvsiX/6kAs6DzvB1ZLP2rnmDorlLIK9+SU0iBDF/T2mgk5A8SyH4bycGQgHHNTSs9OyKjJ4SAmcOtbRPAz9giJHiTtye82ZathVFZVkDFGNzYVLE4tngQgs8qGJPFwT9r/mxq2j7o7D0+D2jZBJip1N12NTO/XTD3ma/29IZ3lmP2y1YD6WSina3vQsjLcxFk8Lu+YPiKcpFfEAHDna3nGYwvpZRaOlH1yqYJXODpjXx7QguYKWj/S4C4Zx5Rm5d0p+LKWgOp4EPd60+Vhv4DS9kw84/GDHdy5fId+9QzZVm/BRGgGA51+h8QQjw3m6cPeIKhF8rKfBZswQRwc7N72Fv9DQjsiblWi/7+5P9KwGwtdECAvT3hXQtBXmH+AxvZoU9wQHmjAAAAAElFTkSuQmCC';
//Kozhanov + 01.11.2015
    GWTK.imgClusterUnwrappedMarker = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAJAklEQVRoQ7VZa5AU1RX+zu3ZBZSyoJTXPBTlIUpQYbt7pgcNG6NYeVghQYxJwJj8iCkfpAxWylKQFJKkLCPlMySpSiVgHkRITFJJGaiKkgjds9M7xiBUIipL2JlBKAOG18IufU+qb/ds2GVmp2d2vb9m+p77nfPde+65555LGKFWNM2LIfBpAi8A8RyALwfERQG8PAZQF5jeZKLtDO2PKcc5MhKqabgg5UzbPJB4iIHPAGiNiNcLwktgfjzhdP494piqYk0TOHjD3AleX2wdEZY2a4AEWAM2olc+GC8U3m8GpykCBy1jgQR+BWDKAKWMHAT9jgi2dpb2vn/ixFG//5KxY8d7MZ4JyfMZtAjg9IBxEmWC/Hy8o7CjURINEyhmjNuJ8MK57kKgLR68NSmn8GYUA4rXm9eS560GxGf75T2c4RgvTdqdW6JgVGQaIlDKGLdKli8JITS1NSUOawJfjjvunxtRWpEtZs1P8Vn+qdAwIcCTZ0nTFiXt/J+i4kUmUM5krvLIcwVwoQ/O4H9CaguTHR3FqMqqyZWvb7vU6xNbhcCsgASdIEZbMp/fGwU3EgFeskQrH9jXCSGu80HJw7saifmTOjoORVFST+awYUw+E5O2gLhcTQ6hkLBdkwBZb2wkAqWssRyMpwMw2aMRmZPtzt31wBvpV/uiz8tBiNFqHOHehO3+oB5GXQJd7e2jW88c7wLE5ACYHkrY+cdrARdNcyYJvheMWyCgZlRK7COBrQzvuZTz+js1x2aNlcR4LJyo0qlx/5024+V3zgxFoi6BclZfxkwbQ9DiB8dOT5u9Z0/vYFAGqJzRH5XMK4UQsRpK+5iwJmm7a6v1v/2J6aMuODJ+HwTiaq4YS+M59xfDItBt6VsFaGG92S9ljOdBuKfekgc4/GzC7lxeTbac0R9mou+ovQC8nHTcTzZNQLlPz/GjFb9kKVLVok4pq98BJv9gC3YJ8JpgrJEU26n19hLHaL4naLUGzK/IMPGSajG/nJ17GXNsf4jU88Gx0+OqrXgFZ0gX6s60pQWJXOjH/0p1uFdVc52SZbxDwBWqj7EpnnO/NDiCqEhW3PdLQNweGvd23ClcSWqiB7aS1bYXEDP8r4JgTrFdt9YqDEmgaJl3EnhDsOz4dcJ27xgMVMyaFjHboVFHWsXoqRN27jxeTeF/0umLTkPuh8B4NSksM6lcoWOwbNkyNzP4NqWWsCxuuz9vikDJMh4E8ETgtngynnP9/wNaKWPeD+JnApLyZwm78JVayvzvZUvfwKA7w0mpGirLWf1JZvqmWlCmFclcfl1TBIoZ8xEiVhGDGGvjOXfVeStgGasIWBN+fyzhuI8OSSBjPMaElco4wqpqEamc1dcy0yMhgZXJXF5t6mqtjgvpdxPoh+FsrU/Y7nlRptEVKFrmRgIvG2oFipbxIwK+FrrQ3XHb/XFTBEpp/WYI2qYGM3KJnGudtwLz0xmS0lHfJY6Ohph6cUfHsWoKu9qvG9fa09IFgXGBOKdTTmf+PMyMkSeCEajFTUnH/UtTBA63zx57pmf0Uf9g8jNF2TJm4mU7dqgcv9LUAWaZewGeHnyTL8aTV3yRNm/2Bsi1t8dKp09uIsLiYPbl3rhdmDU4CvlXUybvkJ/x+jpbevrGTd6162RTBPxBJdPYCQ1ZNRtMdyVz+SAqndOKlrmEwC/2f/Jgk0ZrxMnT6oIiLxx1AzNWg5CpyBBjcTzn/nYwVsnSvwrQT5Q+oh1JO39DLePVPAzV6feVLeMbDDwVyr2ScNyPVxtTyurPgOn+enjKMOCppOM+UE22aBnbCVig+piWJ3L5Z4dF4FA6PakXZ0tqSX1Ij2bVytWLQTLmR6GWGkp7Cfh23HG/V63/YDp9tRRyj1o13320UYnJtn14WAT8wUXL+A0BnwuBnk847n21QA9k26YJFvcx5ELhiWkgyRB4l6Bt0zR+btIOd1+tsWVLX8+grweuQVviTn5JvRWt60I+QHdGbxdEr6qZAU5pvfKyZqsItQx6L5ud6Hln/l3Ju4iwIG67fxsRAj7IAcsoaMC8cHN9N2nn1UEzUq07qz8umL7l43nA65c6blsU7EgroDZzVl/MTKpiIKU8DtE6daSqa+W2tku8mNYlBI9V7lMjQlUjFJmAH++LVttuAXF1AERPJJy8mrHhtrJlrmNwGJXknrhTmFMtSx0WAbWZs/ptxLQ5AJI9LGMzh1uVKBlGCkLu7ff9BmY/2OwNtpKluwDp4eANcce9q0GIAeLFjPFCpTxJQD7uuAOrdnXAGyZQzJo3ErPKTSQgBVhvtkBbnm/qnuS8CCdSMn8slevc3siENEzABy9Zxh8A3BqSeC3luB9tRGlFtpTWbQhSCaIE/T7l5Bc1itMUge50eoYITszgxCX+QsLu3NSI8nLWWMqsaqx+65XwZg9VcqmF3RSBcBX8m1pwQ5Mot4w5deXE7XtORCGhrpbi7Fv9taZhRLSmCfipdl/PBW/113CI18XtzhVRCJQyxtMghGUVWWoZdXpWVPKD8ZsmoFbhnHKKlNIjTehJ231jKBL+i47HyFcq3M2437n4wyLgAxWzxjZi3Oz/ZoabyLmZWkVZv7TSXdyfr6QkErwt5XTeEmXVRnwPVAD97FPzsLv/IAI/EHc6K/eHgTE/a6wgxveDj7InpomPDJWdRiE27BXwlZQtw3/kUzm+BE62eDRncj7fda4B3da86QK0CxBjgsg1dJE4ivEKJqrgUHLc3h4rnzqZh4a5odwrcce9qZLP+HlUyTJerdy0/GwzlZxqDr43N2PLiBAIwqo+V/qnaliZZsY9yZy7Puy7D6DK1dCvUJv1NntUMiNGQLnSOUUr35VaNVzT63kC0N6oPE0BWJNw3NVRDawnN6IE9sye3TruojF+sneNikpEOyQz9VelWf7jYB8MvVDoq2dY1P4RJaDCqnpCZb+aPPhi3yulMFIdHbuiGhdFbsQJBK70/0eKihEEPFyrGhHF0FoyHwqB8MD6a8V1fFdK2PkFUV4dGyXzoRDwjXjPNC/v0zyVVsS45dopuVz46tKoiUPLf2gElCtljaV+BbfeQ91wKP0P1WmkXsuOinkAAAAASUVORK5CYII=';
//Kozhanov + 01.11.2015
    GWTK.imgClusterMarkerClose = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAEDklEQVRIS7VWXWwUVRT+zrltY9zaxJSIvgj2zSIamlKEXSW7W02MUbeCpFqsUcGGB14QlSKGpilaUGNiTIS0itEitqHsVh400pmm2d2alpL618bE+K+IkmjiUhOXmXvMnWW222Vb5cF5u/Odc74z3/m5Q1jkGRxO1iimZgHCpGkFoJcYc818jiAzDNia1NGm8NrvFgpDpYD3R0dvcBw+wIT7tQYR0ScgmgLo15y9LCWNOg19CzOEoI45Ik9viAa/L453CUHcSj8spA+yZg3Gq1DOwdj69T+WSuTEydT1bhm2uYLtBi8jtN0XDh0ptJ1HkBhJPwNBtyaMCFTrhvCtPy0moY8ZogsK7zDodiHsbAoHX/axPIHJnAhvE3C0irKt4XDY+S/BfZtDk5Pl1/6Z7RPIJoBaYpF17xrMI/A0d/kLEI9fjeydlxu8kGRp5m8LLlYpkRX33BH6wSNIjKQH4OIuV6kbfVnON65dKXC6AJqqDE10Ugd04RdJB/h8qqETkJUQbr/KGp8xuJErqzCjRE7Eorc9SLlWxFcAd8ciwWf9IJnG1UMkdK93JjkcCJ3a4pOY4Jlk/WEGt+ZkkMGAdWqj75uw0t0g/ZQrXEMJO7Vba+nicr2ssFsyjQ0dJNibz/oiiTlnRhveZMYj+UIK9gTsiX3+edBKLyPR37LidorbqZMQVDdFQ3XFEsymVvdC6NFCktwYzL0ToZ5Ke7yNACn0P26nPmXQWUoMp88I44OmSPDx4q4xUlxCUmC0UHBjErfH3iLtRikxnMwKq5eaIut2l2rLhUgWC55rnNQLENnx/xMct9M/E/DhQhIVF3RenYDeSmviiWL950lkikyalsQag6uKi1zYil5thXpAQgRsmbPVbwSsya3FJAkr9RlEztCQnWp3tewrF1puJm9uDhq6SJCfC19zg89G63sAzjcFgfYGrPFO3zc+8vFycZ1viHkXmQOJ8zWIDsTCofZSg1ZcUAFoNtrQC+Cx3KDhWMCaeMD3HbLT+wV4UrlS462KIXus34G+u8JFrf8VmeiaWobuhNDUlfbE88USmO76K7lmj1kVrnKfq/ro9Jee9iZh15kBUzwWCbV4BGbyQDJNwOlzVVc0ttXXXyjVsv/2bmBguqKi+g9bC90sStWavZZf10MjqRYR6iPQwNmqis2XS2KCl1X/foSJN4KkORYO9V+Uby6vhDW2EyQvgpBUjmwuLPpi2XuyaLcPREFAdsQioVfye6rYMWGPPQQth1wWUkKvucDrpe5aX28WvU203q7BDivZ6me+IIEBvLuWZT8Im8ylD6bPCTxFpH/JzQNfR6LrtMhNzKwB6Ydyd5W6u0v+VfjspviK0QxBBFrXgnGNh2n8BmBamO0yV95bTMp/ADrBEHP8aTeuAAAAAElFTkSuQmCC';
    
    
}
