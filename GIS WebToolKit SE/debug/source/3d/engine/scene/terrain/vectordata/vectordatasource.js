/****************************************** Тазин В.О. 17/09/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Источник векторных данных                     *
 *                                                                  *
 *******************************************************************/
"use strict";
import Trigonometry from '~/3d/engine/core/trigonometry';
import WorkerManager from '~/3d/engine/worker/workermanager';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { ProjectionCollection } from '~/3d/engine/core/geometry/projection';
import Mesh from '~/3d/engine/core/geometry/mesh';
import Interval from '~/3d/engine/core/interval';
import GeodeticExtent from '~/3d/engine/core/geodeticextent';
import { MessageQueueCommand } from '~/3d/engine/worker/workerscripts/queue';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};

    /**
     * Класс источника векторных данных
     * @class GWTK.gEngine.Scene.VectorDataWFSSource
     * @constructor GWTK.gEngine.Scene.VectorDataWFSSource
     * @param layerDescription {GWTK.LayerDescription} Описание слоя
     * @param objectsDescription {GWTK.ListDescObjByMap} Описание объектов, заданных для отображения
     * @param [messageQueue] Очередь сообщений потока
     */
    GWTK.gEngine.Scene.VectorDataWFSSource = function(layerDescription, objectsDescription, messageQueue) {

        this._messageQueue = messageQueue || WorkerManager.getWorker();

        this._vectorDataUrl = new GWTK.gEngine.Scene.VectorDataSourceUrl(layerDescription.server, layerDescription.server);

        this._layerId = layerDescription.idLayer;
        this._layerAlias = layerDescription.alias;
        this._id = layerDescription.xId;
        this.hidden = layerDescription.hidden;
        this._prefix = "vectorDataWFSSource_" + this._layerId + "_";

        var bbox = layerDescription.bbox || [-90, -180, 90, 180];
        this._extent = new GeodeticExtent(bbox[1], bbox[0], bbox[3], bbox[2]);

        this._meshQueue = {};
        this._vectorCache = {};
        this._tiledFrame = {};
        this._metadataLoadCallbackList = [];
        this._metricLoadHandler = this._metricLoadHandler.bind(this);
        this.loadDescObjects3DByXml = this._loadDescObjects3DByXml.bind(this);
        this._updateMeshQueue = GWTK.gEngine.Utils3d.throttle(this._updateMeshQueue.bind(this), 250);

        var tilematrixset = layerDescription.tilematrixset;
        this._minZoom = 16;
        this._maxZoom = 20;

        if (objectsDescription.options) {
            if (objectsDescription.options.minzoom != null) {
                this._minZoom = objectsDescription.options.minzoom;
            }else{
                this._minZoom = layerDescription.minzoom;
            }
            if (objectsDescription.options.maxzoom != null) {
                this._maxZoom = objectsDescription.options.maxzoom;
            }else{
                this._maxZoom = layerDescription.maxzoom;
            }
            if (objectsDescription.options.tilematrixset != null) {
                tilematrixset = objectsDescription.options.tilematrixset;
            }
        }

        this._projection = ProjectionCollection[tilematrixset];
        this._heightSource = GWTK.heightSourceManager.getHeightSource(tilematrixset);
        if (!this._heightSource) {
            // Инициализация поверхности
            this._heightSource = new GWTK.gEngine.Scene.HeightSource(this._projection);
            this._heightSource.setLayerDescription(GWTK.heightSourceManager.getHeightSource()._description);
            GWTK.heightSourceManager.addHeightSource(tilematrixset, this._heightSource);
        }

        this._meshInstancedIdArray = [];
        this._meshInstancedArray = [];
        this._textureArray = [];
        this._distanceLimits = new Interval(Number.MIN_VALUE, layerDescription["maxDistance"] || Number.MAX_VALUE);

        this.updateTextureQueue = this._updateTextureQueue.bind(this);
        this._init(objectsDescription);
    };
    GWTK.gEngine.Scene.VectorDataWFSSource.prototype = {
        /**
         * Инициализация
         * @method _init
         * @private
         * @param objectsDescription {GWTK.ListDescObjByMap} Описание объектов, заданных для отображения
         */
        _init: function(objectsDescription) {
            var codeList = [[], []];
            var keyTemplateList = [];
            this.descList = objectsDescription.getList();

            for (var i = 0; i < this.descList.length; i++) {
                var desc = this.descList[i];
                var code = desc.code;
                if (codeList[desc.cut].indexOf(code) === -1) {
                    codeList[desc.cut].push(code);
                }
                var key = desc.objectkey;
                if (parseInt(desc.viewtype) === 4) {
                    if (keyTemplateList.indexOf(key) === -1) {
                        keyTemplateList.push(key);
                    }
                }
            }
            this._codeListStringArray = [codeList[0].join(","), codeList[1].join(",")];
            this._keyTemplateListString = keyTemplateList.join(",");

            GWTK.gEngine.Mediator.subscribe('clearLoadingScreen', this.loadDescObjects3DByXml);
        },
        /**
         * Получить проекцию источника
         * @method getProjection
         * @public
         * @return {GWTK.gEngine.Core.Projection} Проекция источника
         */
        getProjection: function() {
            return this._projection;
        },
        /**
         * Загрузить 3D-описания объектов по классификатору
         * @method _loadDescObjects3DByXml
         * @private
         */
        _loadDescObjects3DByXml: function() {
            // Составление описаний xml-запроса в соответствии к слою(карте)
            var jsObj3D = {
                // "LAYER_ID": this._layerId,
                "LAYER": this._layerId,
                "OBJLOCAL": 2,//возможно 5?
                "KEYLIST": this._keyTemplateListString,
                "GETTEXTURES": '0',
                "GETOBJECTS": '1',
                "SERVICEVERSION": "13.02.00",
                "LEVELLIST": "0,1,2"
            };

            var command = MessageQueueCommand.setupParser3d;
            var data = {
                jsRpc: jsObj3D,
                descList: this.descList,
                serviceUrl: this._vectorDataUrl.getServer(),
                command
            };
            this._messageQueue.post(this._messageQueue.createMessageData(this._layerId, data, 0, 100000), { onLoad: this._onSetupHandler.bind(this) });

            window.setTimeout(function() {
                GWTK.gEngine.Mediator.unsubscribe('clearLoadingScreen', this.loadDescObjects3DByXml)
            }.bind(this), 0);

        },
        /**
         * Обработчик загрузки данных источника
         * @method _onSceneUpdate
         * @private
         * @param message {object} Сообщение из второго потока
         */
        _onSetupHandler: function(message) {
            if (message.success === true) {
                this._requestTextures(message.textureArray);
                this._calcTileBorders(this._extent);
                this._metadata = true;
                for (var i = 0; i < this._metadataLoadCallbackList.length; i++) {
                    this._metadataLoadCallbackList[i](this._metadata);
                }
            }else{
                var errorHtml = GWTK.gEngine.Utils3d.parseServiceException(message.errorText);
                var protocolHtml = (errorHtml ? errorHtml + " " : "") + w2utils.lang("Server") + ": " + this._vectorDataUrl.getServer() + ". " + w2utils.lang("Layer identifier") + ": " + this._layerId;
                GWTK.gEngine.Mediator.publish('writeProtocol', { text: protocolHtml, displayFlag: false });

                GWTK.gEngine.Mediator.publish('writeProtocol', {
                    text: w2utils.lang("Failed to get classifier 3D samples") + " (<i>" + w2utils.lang("Details in the event log") + "</i>)",
                    displayFlag: true
                });
            }
        },

        /**
         * Запрос текстур
         * @method _requestTextures
         * @private
         * @param textureArray {array} Массив описаний текстур
         */
        _requestTextures: function(textureArray) {
            var textureListDictionary = {};

            this._textureArrayKeys = {};

            var subsriptionFlag = false;

            for (var i = 0; i < textureArray.length; i++) {
                var texture = textureArray[i];
                if (texture.Texture) {
                    this._textureArray.push(texture);
                    subsriptionFlag = true;
                }else{
                    if (textureListDictionary[texture.Level] === undefined) {
                        textureListDictionary[texture.Level] = [];
                    }
                    if (textureListDictionary[texture.Level].indexOf(texture.Key) === -1) {
                        textureListDictionary[texture.Level].push(texture.Key);
                    }
                }
                if (this._textureArrayKeys[texture.Level] === undefined) {
                    this._textureArrayKeys[texture.Level] = {};
                }
                this._textureArrayKeys[texture.Level][texture.Key] = texture.Code;
            }
            for (var level in textureListDictionary) {
                if (textureListDictionary[level].length > 0) {
                    this._requestTexturesByLevel(level, textureListDictionary[level]);
                }
            }

            if (subsriptionFlag) {
                GWTK.gEngine.Mediator.subscribe("updateScene", this.updateTextureQueue);
            }

        },
        /**
         * Запрос текстур по уровню
         * @method _requestTexturesByLevel
         * @private
         * @param level {number} Уровень
         * @param textureList {array} Массив кодов текстур
         */
        _requestTexturesByLevel: function(level, textureList) {
            var jsObj3D = {
                // "LAYER_ID": this._layerId,
                "LAYER": this._layerId,
                "SERVICEVERSION": "13.02.00",
                "KEYLIST": textureList.join(','),
                "GETTEXTURES": '1',
                "GETOBJECTS": '0',
                "LEVELLIST": level
            };
            var command = MessageQueueCommand.loadParserTextures3d;
            var data = {
                jsRpc: jsObj3D,
                serviceUrl: this._vectorDataUrl.getServer(),
                command
            };
            this._messageQueue.post(this._messageQueue.createMessageData(this._layerId + level, data, 0, 100000), { onLoad: this._onTexturesLoadHandler.bind(this) });

        },

        /**
         * Обработчик загрузки текстур
         * @method _onTexturesLoadHandler
         * @private
         * @param message {object} Сообщение из второго потока
         */
        _onTexturesLoadHandler: function(message) {
            if (message.success === true) {
                this._textureArray = this._textureArray.concat(message.textureArray);
                GWTK.gEngine.Mediator.subscribe("updateScene", this.updateTextureQueue);
            }else{
                var errorHtml = GWTK.gEngine.Utils3d.parseServiceException(message.errorText);
                var protocolHtml = (errorHtml ? errorHtml + " " : "") + w2utils.lang("Server") + ": " + this._vectorDataUrl.getServer() + ". " + w2utils.lang("Layer identifier") + ": " + this._layerId;
                GWTK.gEngine.Mediator.publish('writeProtocol', { text: protocolHtml, displayFlag: false });

                GWTK.gEngine.Mediator.publish('writeProtocol', {
                    text: w2utils.lang("Failed to get classifier 3D samples") + " (<i>" + w2utils.lang("Details in the event log") + "</i>)",
                    displayFlag: true
                });
            }
        },
        /**
         * Обработчик обновления очереди загрузки текстур
         * @method _updateTextureQueue
         * @private
         */
        _updateTextureQueue: function() {
            if (this._textureArray.length === 0) {
                GWTK.gEngine.Mediator.unsubscribe("updateScene", this.updateTextureQueue);
            }else{
                var textureParams = this._textureArray.pop();
                var textureName = this._textureArrayKeys[textureParams.Level][textureParams.Key];
                var description = new GWTK.gEngine.Renderer.Texture2DDescription(textureParams.Texture.Width, textureParams.Texture.Height, GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8, true);
                GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate(textureName, description, new Uint8Array(textureParams.Texture.Image), true, GWTK.gEngine.Renderer.TextureSamplers.linearMipmapRepeat);
                delete this._textureArrayKeys[textureParams.Level][textureParams.Key];
            }
        },
        /**
         * Вызов обработчика после получения метаданых
         * @method onMetadataLoad
         * @public
         * @param callback {function} Обработчик
         */
        onMetadataLoad: function(callback) {
            if (this._metadata != null) {
                callback(this._metadata);
            }else{
                if (this._metadataLoadCallbackList.indexOf(callback) === -1) {
                    this._metadataLoadCallbackList.push(callback);
                }
            }
        },
        /**
         * Посчитать границы отображения модели
         * @method _calcTileBorders
         * @private
         * @param extent {GWTK.gEngine.Core.GeodeticExtent} Рамка в геодезических координатах
         */
        _calcTileBorders: function(extent) {
            var bottomLeft = this._projection.geo2xy(Trigonometry.toRadians(new Geodetic3D(extent.getWest(), extent.getSouth(), 0)));
            var topRight = this._projection.geo2xy(Trigonometry.toRadians(new Geodetic3D(extent.getEast(), extent.getNorth(), 0)));

            for (var i = 0; i <= this._maxZoom; i++) {
                var bottomLeftTileIdentifier = this._projection.xy2tile(bottomLeft[0], bottomLeft[1], i);
                var topRightTileIdentifier = this._projection.xy2tile(topRight[0], topRight[1], i);
                this._tiledFrame[i] = {
                    minCol: bottomLeftTileIdentifier.getX(),
                    maxCol: topRightTileIdentifier.getX(),
                    minRow: topRightTileIdentifier.getY(),
                    maxRow: bottomLeftTileIdentifier.getY()

                }
            }
        },
        /**
         * Получить границы удаленности
         * @method getDistanceLimits
         * @public
         * @return {Interval} Границы удаленности
         */
        getDistanceLimits: function() {
            return this._distanceLimits;
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
         * Установить меш для тайла
         * @method setMesh
         * @public
         * @param node {GWTK.gEngine.Scene.VectorDataNode} Тайл
         */
        setMesh: function(node) {
            var id = node.getIdentifier();
            var nodeId = this._prefix + id.toString();
            var heightTile = this._heightSource.requestTile(id);
            if (heightTile != null) {
                var obb = heightTile.getOBB();
                if (this.checkTileFrame(id)) {
                    var cutObjects = this._requestMesh(id, 1);

                    var uncutObjects = this._requestMesh(id, 0);


                    if (cutObjects === true && uncutObjects === true) {
                        node.createModelNodeList();
                        node.setOBB(obb);
                    }else{
                        if (cutObjects === null) {
                            if (!this._vectorCache[nodeId]) {
                                this._vectorCache[nodeId] = [];
                            }
                            this._vectorCache[nodeId][1] = null;
                        }
                        if (uncutObjects === null) {
                            if (!this._vectorCache[nodeId]) {
                                this._vectorCache[nodeId] = [];
                            }
                            this._vectorCache[nodeId][0] = null;
                        }

                        this._addToMeshQueue(nodeId, node);
                    }
                }else{
                    //тайл вне модели
                    node.createModelNodeList();
                    node.setOBB(obb);
                }
            }
        },
        /**
         * Проверить вхождение узла в габариты слоя
         * @method checkTileFrame
         * @public
         * @param identifier {TileIdentifier} Тайл
         * @return {boolean} Флаг вхождения узла в габариты слоя
         */
        checkTileFrame: function(identifier) {
            var level = identifier.getLevel();
            var col = identifier.getX();
            var row = identifier.getY();
            var frame = this._tiledFrame[level];
            if (frame != null) {
                if (col >= frame.minCol && col <= frame.maxCol && row >= frame.minRow && row <= frame.maxRow) {
                    return true;
                }
            }
        },
        /**
         * Запросить меш тайла
         * @method _requestMesh
         * @private
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @param cutByFrame {number} Флаг нарезаемых объектов (0 - ненарезаемые, 1 - нарезаемые)
         * @return {boolean|object|null} Результат `true` - пустой тайл,
         *                                         `object` - описание тайла,
         *                                         `null` - тайл не загружен
         */
        _requestMesh: function(identifier, cutByFrame) {
            var queryString = this._getLoadingSource();
            var id = this._prefix + identifier.toString();
            var vectorTile = this._vectorCache[id] || null;
            if (vectorTile === null || !this._vectorCache[id][cutByFrame]) {
                id += "_" + cutByFrame;
                if (identifier.getLevel() >= this._minZoom && identifier.getLevel() <= this._maxZoom) {
                    var jsRpc = this._createReqByTile(identifier, cutByFrame);
                }
                if (jsRpc != null) {
                    jsRpc.CUTBYFRAME = cutByFrame;
                    jsRpc.CheckObjectMiddleByFrame = cutByFrame ? "0" : "1";
                    var command = MessageQueueCommand.loadWFS;
                    var data = {
                        src: queryString,
                        tilematrixset: this.getTilematrixset(),
                        level: identifier.getLevel(),
                        identifier: identifier.toString(),
                        hTile: this._heightSource._heightCache.getHeightTileByIdentifier(identifier).toJSON(true),
                        jsRpc: jsRpc,
                        layerId: this._layerId,
                        serviceUrl: this._vectorDataUrl.getServer(),
                        cutByFrame: cutByFrame,
                        instancedMeshList: this._meshInstancedIdArray.join(","),
                        command
                    };
                    this._messageQueue.post(this._messageQueue.createMessageData(id, data, identifier.getLevel()), { onLoad: this._metricLoadHandler });
                }else{
                    vectorTile = true;
                }
            }
            return vectorTile;
        },
        /**
         * Добавить запрос меша в очередь
         * @method _addToMeshQueue
         * @private
         * @param id {string} Идентификатор запроса
         * @param node {GWTK.gEngine.Scene.VectorDataNode} Тайл векторных данных
         */
        _addToMeshQueue: function(id, node) {
            if (this._meshQueue[id] == null) {
                this._meshQueue[id] = node;
            }
        },
        /**
         * Получить данные XML-RPC запроса
         * @method _createReqByTile
         * @private
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @param index {number} Индекс списка кодов (0 - ненарезаемые, 1 - нарезаемые)
         * @return {object} Данные XML-RPC запроса
         */
        _createReqByTile: function(identifier, index) {
            if (this._codeListStringArray[index].length > 0) {
                var curParams = this._createGetFeatureRPC();
                curParams["LAYER"] = this._layerId;
                curParams["TILEMATRIXSET"] = this._projection.getTilematrixset();
                curParams["CODELIST"] = this._codeListStringArray[index];
                curParams["TILEROW"] = identifier.getY();
                curParams["TILECOL"] = identifier.getX();
                curParams["TILEMATRIX"] = identifier.getLevel();
                curParams["EPSG"] = this._projection.getCRS();
                curParams["OBJECTVIEWSCALE"] = parseInt(this._projection.getScaleByLevel(identifier.getLevel()));
                return curParams;
            }
        },
        /**
         * Получить шаблон XML-RPC запроса
         * @method _createGetFeatureRPC
         * @private
         * @return {object} Шаблон XML-RPC запроса
         */
        _createGetFeatureRPC: function() {
            return {
                "OUTTYPE": "JSON",
                "GETFRAME": "1",
                "MAPID": "1",
                "SEMANTIC": "1",
                "SCALERANGE": "1",
                "GETKEY": "1",
                "GETGRAPHOBJECTS": "0",
                "STARTINDEX": "0",
                "CUTBYFRAME": "1",
                "CheckObjectMiddleByFrame": "0",
                "LAYER_ID": "-1",
                "CODELIST": "-1",
                "TILEMATRIXSET": "-1",
                "TILEROW": "-1",
                "TILECOL": "-1",
                "OUTCRS": "4326",
                "OBJECTVIEWSCALE": "-1",
                "TypeNames": "*",
                "serviceversion": "12.06.01"
            };
        },
        /**
         * Обновить очередь запросов
         * @method _updateMeshQueue
         * @private
         */
        _updateMeshQueue: function() {
            for (var id in this._vectorCache) {
                var vectorCache = this._vectorCache[id];
                if (vectorCache[0] === null || vectorCache[1] === null) {
                    continue;
                }
                var curChunkedNode = this._meshQueue[id];
                for (var i = 0; i < vectorCache.length; i++) {
                    if (vectorCache[i]) {
                        this._updateNode(vectorCache[i], curChunkedNode);
                    }
                }
                delete this._vectorCache[id];
                delete this._meshQueue[id];
            }
        },

        _updateNode: function(response, curChunkedNode) {
            if (response === true) {
                curChunkedNode.createModelNodeList();
            }else if (response != null) {
                var obb = curChunkedNode.getOBB();
                var resultOBB = response.obb;
                if (resultOBB) {
                    obb.fromJSON(resultOBB);
                }
                if (response.objectMeshList) {
                    var objectMeshList = response.objectMeshList;
                    curChunkedNode.createModelNodeList();
                    for (var k = 0; k < objectMeshList.length; k++) {
                        var objectMesh = objectMeshList[k];
                        for (var j = 0; j < objectMesh.length; j++) {
                            var featureMeshCollection = objectMesh[j];
                            var features = featureMeshCollection && featureMeshCollection.features || [];
                            for (var i = 0; i < features.length; i++) {
                                var feature = features[i];
                                var modelId = feature.properties['code'];
                                var key = feature.properties['key'];
                                var modelNode = curChunkedNode.retrieveModelNode(modelId);
                                if (!modelNode) {
                                    modelNode = new GWTK.gEngine.Scene.ClassifierModel(modelId);
                                    curChunkedNode.addModelNode(modelNode);
                                }
                                var minDistance = Math.round(featureMeshCollection.minDistance);
                                var renderable = modelNode.getRenderable(key, minDistance);
                                if (renderable == null) {
                                    renderable = this._createRenderable(key, obb);
                                    modelNode.addRenderable(renderable, minDistance);
                                }
                                if (feature.meshInstanced && this._meshInstancedIdArray.indexOf(feature.description.guid) === -1) {
                                    if (feature.mesh) {
                                        var mesh = Mesh.fromJSON(feature.mesh);
                                    }
                                    this._meshInstancedIdArray.push(feature.description.guid);
                                    this._meshInstancedArray.push(mesh);
                                    feature.mesh = mesh;
                                }
                                if (!feature.mesh) {
                                    feature.mesh = this._meshInstancedArray[this._meshInstancedIdArray.indexOf(feature.description.guid)];
                                }
                                renderable.addFromGeoJSON(feature);
                            }
                        }
                    }
                }
            }
        },

        /**
         * Создать коллекцию примитивов
         * @method _createRenderable
         * @public
         * @param id {string} Идентификатор объекта
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         * @return {GWTK.gEngine.Scene.RenderableCollection} Коллекция примитивов
         */
        _createRenderable: function(id, obb) {
            return new GWTK.gEngine.Scene.RenderableCollection(id, obb);
        },
        /**
         * Обработчик загрузки меша
         * @method _metricLoadHandler
         * @private
         * @param message {object} Сообщение из внешнего потока
         */
        _metricLoadHandler: function(data, message) {
            var id = message.id;
            var nodeId = id.substr(0, id.length - 2);
            var cutByframe = id.charAt(id.length - 1);
            var tiledModelList = data.tiledModelList;
            if (data.objectMeshList.length === 0) {
                this._vectorCache[nodeId][cutByframe] = true;
            }else{
                this._vectorCache[nodeId][cutByframe] = data;
            }


            this._updateMeshQueue();

            if (tiledModelList.length > 0) {
                GWTK.gEngine.Mediator.publish("addModels", {
                    modelList: tiledModelList,
                    layerId: this._layerId,
                    serviceUrl: this._vectorDataUrl.getServer()
                });
            }
        },
        /**
         * Получить ссылку источника
         * @method getLoadingSource
         * @public
         * @return {string} Ссылка источника
         */
        _getLoadingSource: function() {
            return this._vectorDataUrl.getUrl();
        },
        /**
         * Удаление источника
         * @method destroy
         * @public
         */
        destroy: function() {
            this._projection = null;
            this._messageQueue = null;
            this._vectorDataUrl = null;
            this._extent = null;
            this._meshQueue = null;
            this._vectorCache = null;
            this._tiledFrame = null;
            this._metadataLoadCallbackList = null;
            this._meshInstancedIdArray = null;
            this._meshInstancedArray = null;
            this._distanceLimits = null;
            this.descList = null;
            this._codeListStringArray = null;
        }
    };


    /**
     * Класс источника для загрузки WFS тайлов
     * @class GWTK.gEngine.Scene.VectorDataSourceUrl
     * @extends GWTK.gEngine.Scene.RasterSourceUrl
     * @constructor GWTK.gEngine.Scene.VectorDataSourceUrl
     * @param serviceUrl {string} Строка адреса сервиса
     * @param urlString {string} Строка для запроса
     */
    GWTK.gEngine.Scene.VectorDataSourceUrl = function(serviceUrl, urlString) {
        GWTK.gEngine.Scene.RasterSourceUrl.call(this, serviceUrl, urlString);
    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Scene.VectorDataSourceUrl, GWTK.gEngine.Scene.RasterSourceUrl);
    /**
     * Получить ссылку на тайл
     * @method getUrl
     * @public
     * @return {string} Ссылка на тайл
     */
    GWTK.gEngine.Scene.VectorDataSourceUrl.prototype.getUrl = function() {
        return this._baseUri.href;
    };
}
