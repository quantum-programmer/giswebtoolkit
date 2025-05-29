/****************************************** Тазин В.О. 30/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Источник растровых тайлов                     *
 *                                                                  *
 *******************************************************************/
"use strict";
import WorkerManager from '~/3d/engine/worker/workermanager';
import TileIdentifier from '~/3d/engine/scene/terrain/tileidentifier';
import HeightTile from '~/3d/engine/scene/terrain/heightsource/heighttile';
import { MessageQueueCommand } from '~/3d/engine/worker/workerscripts/queue';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    
    /**
     * Класс источника тайлов высот
     * @class GWTK.gEngine.Scene.HeightSource
     * @constructor GWTK.gEngine.Scene.HeightSource
     * @param projection {Projection} Проекция слоя
     * @param [messageQueue] {WorkerManager} Очередь сообщений потока
     */
    GWTK.gEngine.Scene.HeightSource = function(projection, messageQueue) {
        
        this._t = Date.now();
        this._projection = projection;
        this._messageQueue = messageQueue || WorkerManager.getWorker();
        
        this._preloadedTiles = null;
        
        this._heightCache = new GWTK.gEngine.Scene.HeightCache();
        
        this._meshQueue = {};
        
        this._heightSourceUrl = new GWTK.gEngine.Scene.HeightDataSourceUrl(null, "");
        
        
        this._isReady = false;
        this._levelAccuracyLimit = null;
        this._tileWidth = this._projection.getTileWidth();
        this._tileHeight = this._projection.getTileHeight();
        
        this._heightLoadHandler = this._heightLoadHandler.bind(this);
        this._onTileHeadersLoad = this._onTileHeadersLoad.bind(this);
        
    };
    GWTK.gEngine.Scene.HeightSource.prototype = {
        /**
         * Стандартная ссылка на источник
         * @static
         * @property {object} mDefaultBaseUri
         */
        mDefaultBaseUri: {
            href: "%tilecol/%tilerow/%scale",
            protocol: "",
            origin: "//",
            pathname: ""
        },
        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function() {
            if (this._heightSourceUrl.getServer() !== null) {
                var fileName = this._heightSourceUrl.getServer() + "?COVERAGEID=" + encodeURIComponent(this._layerId) + "&REQUEST=DescribeCoverage&SERVICE=WCS&EPSGLIST=EPSG:" + this._projection.getCRS();
                GWTK.gEngine.TextFileLoader.loadTextFile(fileName, 0, this._onDescriptionLoad.bind(this));
            }else{
                this._initConfig();
            }
        },
        /**
         * Инициализация конфигурации
         * @method _initConfig
         * @private
         * @param [src] {string} Ссылка на слой высот
         * @param [id] {string} Идентификатор слоя
         */
        _initConfig: function(src, id) {
            id = id || Math.random();
            if (src) {
                var command = MessageQueueCommand.loadHeightTileHeaders;
                var data = {
                    src: src,
                    options: {
                        LAYER: this._layerId,
                        TILEMATRIXSET: this.getTilematrixset()
                        //,
                        // TILEROW: 0,
                        // TILECOL: 0,
                        // TILEMATRIX: 0
                    },
                    command
                };
                this._messageQueue.post(this._messageQueue.createMessageData("INIT_" + id, data, 0, 30000), { onLoad: this._onTileHeadersLoad });
            }else{
                this._heightSourceUrl.setBaseUri(this.mDefaultBaseUri.href);
                this._preloadedTiles = {};
                this._isReady = true;
            }
        },
        /**
         * Обработчик загрузки описания матрицы высот
         * @method _onDescriptionLoad
         * @private
         * @param filepath {String} Ссылка на описание
         */
        _onDescriptionLoad: function(filepath) {
            var reliefDescription = GWTK.gEngine.ResourceMap.retrieveAsset(filepath);
            var description = this._parseDescription(reliefDescription);
            if (description != null) {
                var minmax = description["interval"];
                this.MinHeight = parseFloat(minmax[0]);
                this.MaxHeight = parseFloat(minmax[1]);
                var left = description["lowerCorner"];
                var right = description["upperCorner"];
                this.bbox = [];
                this.bbox[0] = parseFloat(left[0]);
                this.bbox[1] = parseFloat(left[1]);
                this.bbox[2] = parseFloat(right[0]);
                this.bbox[3] = parseFloat(right[1]);
                
                var highGridEnvelope = description["highGridEnvelope"];
                
                var averageAccuracy = 0.5 * ((this.bbox[2] - this.bbox[0]) / parseFloat(highGridEnvelope[0]) + (this.bbox[3] - this.bbox[1]) / parseFloat(highGridEnvelope[1]));
                
                this._levelAccuracyLimit = this._projection.getLevelByDeltaMtr(averageAccuracy);
                
                
                var id = this._layerId + this._t;
                if (this._heightSourceUrl.getServer() !== null) {
                    var src = this._heightSourceUrl.getServer();
                }
                this._initConfig(src, id);
            }else{
                var errorMessage = w2utils.lang("Failed to get coverage description metadata, please try again later");
                if (reliefDescription) {
                    var errorHtml = GWTK.gEngine.Utils3d.parseServiceException(reliefDescription);
                    var protocolHtml = (errorHtml ? errorHtml + " " : "") + w2utils.lang("Server") + ": " + this._heightSourceUrl.getServer() + ". " + w2utils.lang("Layer identifier") + ": " + this._layerId;
                    GWTK.gEngine.Mediator.publish('writeProtocol', { text: protocolHtml, displayFlag: false });
                    errorMessage += " (<i>" + w2utils.lang("Details in the event log") + "</i>)";
                }
                GWTK.gEngine.Mediator.publish('writeProtocol', {
                    text: errorMessage,
                    displayFlag: true
                });
                this._heightSourceUrl.setServer(null);
                this._initConfig();
            }
        },
        /**
         * Разбор XML-описания матрицы высот
         * @method _parseDescription
         * @private
         * @param xml {Document} Пребразованный xml
         */
        _parseDescription: function(xml) {
            
            if (xml == null || xml.getElementsByTagName("wcs:CoverageDescription").length === 0) {
                return null;
            }
            var desc = xml.getElementsByTagName("wcs:CoverageDescription")[0];
            var interval = desc.getElementsByTagName("swe:interval")[0].textContent.split(" ");
            var boundedBy = desc.getElementsByTagName("gml:Envelope");
            for (var i = 0; i < boundedBy.length; i++) {
                var crs = this._projection.getCRS();
                var bounded = boundedBy[i];
                if (bounded.getAttribute("srsName") === "http://www.opengis.net/def/crs/EPSG/0/" + crs) {
                    var lowerCorner = bounded.getElementsByTagName("gml:lowerCorner")[0].textContent.split(" ");
                    var upperCorner = bounded.getElementsByTagName("gml:upperCorner")[0].textContent.split(" ");
                    break;
                }
            }
            var gridEnvelope = desc.getElementsByTagName("GridEnvelope")[0];
            // var low=gridEnvelope.getElementsByTagName("low")[0].textContent.split(" ");
            var high = gridEnvelope.getElementsByTagName("high")[0].textContent.split(" ");
            
            
            return {
                "interval": interval,
                "lowerCorner": lowerCorner,
                "upperCorner": upperCorner,
                "highGridEnvelope": high
            };
            
        },
        /**
         * Получить флаг активности источника
         * @method isActive
         * @public
         * @return {boolean} Флаг активности источника
         */
        isActive: function() {
            return this._isReady;
        },
        /**
         * Обработчик события получение предзагруженных тайлов
         * @method _onTileHeadersLoad
         * @private
         * @param message {object} Сообщение из второго потока
         */
        _onTileHeadersLoad: function(message) {
            this._preloadedTiles = message.heightTileHeadersJSON || {};
            this._isReady = true;
        },
        /**
         * Получить название проекции
         * @method getTilematrixset
         * @public
         * @return {string} Название проекции
         */
        getTilematrixset: function() {
            return this._projection.getTilematrixset();
        },
        /**
         * Получить проекцию слоя
         * @method getProjection
         * @public
         * @return {GWTK.gEngine.Core.Projection} Проекция слоя
         */
        getProjection: function() {
            return this._projection;
        },
        /**
         * Получить высоту в точке
         * @method getHeightInPoint
         * @public
         * @param geo {Geodetic3D} Геодезические координаты точки
         * @return {number|null} Высота в точке
         */
        getHeightInPoint: function(geo) {
            return this._heightCache.getHeight(geo);
        },
        /**
         * Получить интерполированную высоту в точке
         * @method getHeightAccurate
         * @public
         * @param geo {Geodetic3D} Геодезические координаты точки
         * @return {number|null} Высота в точке
         */
        getHeightAccurate: function(geo) {
            return this._heightCache.getHeightAccurate(geo);
        },
        /**
         * Получить тайл, вмещающий точки
         * @method getTileFromPoints
         * @public
         * @param geoPointList {array} Геодезические координаты точек
         * @return {HeightTile} Тайл высот
         */
        getTileFromPoints: function(geoPointList) {
            return this._heightCache.getTileFromPoints(geoPointList);
        },
        
        /**
         * Получить диапазон высот внутри тайла
         * @method getMinMaxEntireHeight
         * @public
         * @param heightTile {HeightTile} Тайл высот
         * @return {[number,number]} Диапазон высот внутри тайла ([min,max])
         */
        getMinMaxEntireHeight: function(heightTile) {
            var minMax = [heightTile._minHeight, heightTile._maxHeight];
            
            var identifier = new TileIdentifier(heightTile._level, heightTile._col, heightTile._row);
            
            var children = this._projection.getChildrenByIdentifier(identifier);
            for (var i = 0; i < children.length; i++) {
                var hTile = this._heightCache.getHeightTileByIdentifier(children[i]);
                if (hTile) {
                    var currentMinMax = this.getMinMaxEntireHeight(hTile);
                    minMax[0] = Math.min(minMax[0], currentMinMax[0]);
                    minMax[1] = Math.max(minMax[1], currentMinMax[1]);
                }
            }
            return minMax;
        },
        /**
         * Загрузить тайл высот
         * @method requestTile
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @return {HeightTile|null} Тайл высот
         */
        requestTile: function(identifier) {
            if (!this.isActive()) {
                return null;
            }
            var tileIdentifier = identifier;
            var id = tileIdentifier.toString();
            var heightTile = this._heightCache.getHeightTileByName(id) || null;
            if (heightTile === null) {
                var preLoadedTile = this._preloadedTiles[id];
                if (preLoadedTile != null) {
                    heightTile = new HeightTile(this._projection, preLoadedTile);
                    this._heightCache.addHeightTileWithIdentifier(tileIdentifier, heightTile);
                }else if (tileIdentifier.getLevel() > this._levelAccuracyLimit) {
                    var command = MessageQueueCommand.createHeightTile;
                    var parentTileIdentifier = this._projection.getParentByIdentifier(tileIdentifier);
                    var parentTile = this.requestTile(parentTileIdentifier);
                    if (parentTile != null) {
                        var data = {
                            hTile: parentTile.toJSON(true),
                            options: {
                                LAYER: this._layerId,
                                TILEMATRIXSET: this.getTilematrixset(),
                                TILEROW: tileIdentifier.getY(),
                                TILECOL: tileIdentifier.getX(),
                                TILEMATRIX: tileIdentifier.getLevel()
                            },
                            command
                        };
                        
                        this._messageQueue.post(this._messageQueue.createMessageData(id + this._t, data, 0), { onLoad: this._heightLoadHandler });
                    }
                }else{
                    if (this._heightSourceUrl.getServer() !== null) {
                        var queryString = this._getLoadingSource(tileIdentifier);
                    }
                    command = MessageQueueCommand.loadHeight;
                    var level = tileIdentifier.getLevel();
                    data = {
                        src: queryString,
                        options: {
                            LAYER: this._layerId,
                            FORMAT: 'WCS',
                            TILEMATRIXSET: this.getTilematrixset(),
                            TILEROW: tileIdentifier.getY(),
                            TILECOL: tileIdentifier.getX(),
                            TILEMATRIX: level
                        },
                        command
                    };
                    this._messageQueue.post(this._messageQueue.createMessageData(id + this._t, data, level), { onLoad: this._heightLoadHandler });
                }
            }
            return heightTile;
        },
        /**
         * Установить меш тайла
         * @method setMesh
         * @public
         * @param node {GWTK.gEngine.Scene.ChunkNode} Тайл поверхности
         */
        setMesh: function(node) {
            var id = node.getIdentifier();
            var heightTile = this.requestTile(id);
            if (heightTile === null || heightTile === true) {
                var tileIdentifier = this._getSourceTileIdentifier(id);
                this.addToMeshQueue(tileIdentifier.toString(), node);
            }else{
                this._createAndSetMesh(heightTile, node);
            }
        },
        /**
         * Добавить запрос меша в очередь
         * @method _addToMeshQueue
         * @private
         * @param id {string} Идентификатор запроса
         * @param node {GWTK.gEngine.Scene.ChunkNode} Тайл поверхности
         */
        addToMeshQueue: function(id, node) {
            if (this._meshQueue[id] === undefined) {
                this._meshQueue[id] = node;
            }
        },
        /**
         * Создать меш и загрузить в тайл
         * @method _createAndSetMesh
         * @private
         * @param heightTile {HeightTile} Тайл высот
         * @param node {GWTK.gEngine.Scene.ChunkNode} Тайл поверхности
         */
        _createAndSetMesh: function(heightTile, node) {
            var result = heightTile.prepareMesh();
            node.getRenderable().setMesh(result);
            node.setOBB(heightTile.getOBB());
        },
        /**
         * Обновить очередь запросов
         * @method _updateMeshQueue
         * @private
         */
        _updateMeshQueue: function() {
            for (var id in this._meshQueue) {
                var curChunkedNode = this._meshQueue[id];
                var heightTile = this._heightCache.getHeightTileByName(id);
                if (heightTile != null) {
                    this._createAndSetMesh(heightTile, curChunkedNode);
                    delete this._meshQueue[id];
                }
            }
        },
        /**
         * Обработчик события получение тайла высот
         * @method _heightLoadHandler
         * @private
         * @param message {object} Сообщение из второго потока
         */
        _heightLoadHandler: function(message) {
            
            // var hTile = new HeightTile(this._projection,message.heightTile[0]);
            // hTile.setHeights(new Uint8Array(message.heightTile[1]));
            var hTile = new HeightTile(this._projection);
            hTile.fromJSON(message.heightTileJSON || {});
            
            this._heightCache.addHeightTileWithIdentifier(hTile.getIdentifier(), hTile);
            this._updateMeshQueue();
        },
        /**
         * Установить адрес слоя высот
         * @method setUrl
         * @public
         * @param urlString {string} URL-адрес источника
         */
        setUrl: function(urlString) {
            if (urlString != null) {
                var urlStringArray = urlString.slice(urlString.indexOf("?") + 1).split("&");
                for (var i = 0; i < urlStringArray.length; i++) {
                    var param = urlStringArray[i];
                    if (param.slice(0, param.indexOf("=")).toLowerCase() === "layer") {
                        this._layerId = param.slice(param.indexOf("=") + 1);
                        break;
                    }
                }
                this._heightSourceUrl.setServer(urlString.slice(0, urlString.indexOf("?")));
                var string = urlString.replace(/%tilematrixset/g, '' + this.getTilematrixset());
                if (string.indexOf("&TILESIZE=") === -1) {
                    string += "&TILESIZE=" + this._projection.getPointsBySide(15);
                }
                this._heightSourceUrl.setBaseUri(string);
            }else{
                this._heightSourceUrl.setBaseUri(this.mDefaultBaseUri.href);
            }
            this._init();
        },
        /**
         * Установить описание слоя высот
         * @method setLayerDescription
         * @public
         * @param description {object} Описание слоя
         */
        setLayerDescription: function(description) {
            this._description = description || {};
            this.setUrl(this._description.url);
        },
        /**
         * Получить ссылку на тайл
         * @method getLoadingSource
         * @private
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @return {string} Ссылка на тайл
         */
        _getLoadingSource: function(identifier) {
            return this._heightSourceUrl.getUrl(identifier);
        },
        /**
         * Получить идентификатор тайла источника
         * @method getLoadingSource
         * @private
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @return {TileIdentifier} Ссылка на тайл
         */
        _getSourceTileIdentifier: function(identifier) {
            var level = identifier.getLevel();
            var tilecol = identifier.getX();
            var tilerow = identifier.getY();
            
            return new TileIdentifier(level, tilecol, tilerow);
        },
        /**
         * Освободить память
         * @method freeMemory
         * @public
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         */
        freeMemory: function(sceneState) {
            this._heightCache.clearHeightTilesByFrustum(sceneState);
        },
        /**
         * Очистить все данные
         * @method clearAll
         * @public
         */
        clearAll: function() {
            this._heightCache.clearAll();
        }
    };
    
    
    /**
     * Класс источника для загрузки тайлов высот
     * @class GWTK.gEngine.Scene.HeightDataSourceUrl
     * @extends GWTK.gEngine.Scene.RasterSourceUrl
     * @constructor GWTK.gEngine.Scene.HeightDataSourceUrl
     * @param serviceUrl {string|null} Строка адреса сервиса
     * @param urlString {string} Строка для запроса
     */
    GWTK.gEngine.Scene.HeightDataSourceUrl = function(serviceUrl, urlString) {
        GWTK.gEngine.Scene.RasterSourceUrl.call(this, serviceUrl, urlString);
        this._keyList = {
            '%tilecol': null,
            '%tilerow': null,
            '%scale': null
        };
    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Scene.HeightDataSourceUrl, GWTK.gEngine.Scene.RasterSourceUrl);
    /**
     * Параметр для замены строки
     * @property _re {string}
     * @static
     */
    GWTK.gEngine.Scene.HeightDataSourceUrl.prototype._re = /%tilecol|%tilerow|%scale/g;
    /**
     * Получить ссылку на тайл
     * @method getUrl
     * @public
     * @param identifier {TileIdentifier} Идентификатор тайла
     * @return {string} Ссылка на тайл
     */
    GWTK.gEngine.Scene.HeightDataSourceUrl.prototype.getUrl = function(identifier) {
        this._keyList['%tilecol'] = '' + identifier.getX();
        this._keyList['%tilerow'] = '' + identifier.getY();
        this._keyList['%scale'] = '' + identifier.getLevel();
        return this._baseUri.href.replace(this._re, this._replacer);
    };
}
