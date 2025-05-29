/****************************************** Тазин В.О. 20/01/21  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Источник 3D тайлов                         *
 *                                                                  *
 *******************************************************************/
"use strict";
import Trigonometry from '~/3d/engine/core/trigonometry';
import WorkerManager from '~/3d/engine/worker/workermanager';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { ProjectionCollection } from '~/3d/engine/core/geometry/projection';
import { PrimitiveType } from '~/3d/engine/core/geometry/mesh';
import { MaterialIdentifier, TextureIdentifier } from '~/3d/engine/scene/terrain/db3dsource/tile3didentifier';
import GeodeticExtent from '~/3d/engine/core/geodeticextent';
import { MessageQueueCommand } from '~/3d/engine/worker/workerscripts/queue';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};

    /**
     * Класс источника 3D тайлов
     * @class GWTK.gEngine.Scene.Tile3dSource
     * @constructor GWTK.gEngine.Scene.Tile3dSource
     * @param params {object} Описание модели 3D тайлов
     */
    GWTK.gEngine.Scene.Tile3dSource = function(params) {

        this._prefix = "tile3dSourse" + Math.random() + "_";
        this._messageQueue = WorkerManager.getWorker();
        this._layerId = params.idLayer;
        this._layerAlias = params.alias;
        this._layerId_enc = encodeURIComponent(this._layerId);
        var dataUrl = params.url + "?METHOD=Get3DTiles&Layer=" + this._layerId_enc + "&Zoom=%z&mincol=%x&maxcol=%x&minrow=%y&maxrow=%y";
        this._data3dUrl = new GWTK.gEngine.Scene.RasterSourceUrl(params.url, dataUrl);

        this._id = params.id;
        this.hidden = params.hidden;

        this._maxZoom = params.mapMaxZoom;
        this._minZoom = params.mapMinZoom;

        this._published = !!params.published;

        this._textureFormat = GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8;
        this.mMeshQueue = {};
        this._mTiles3dCache = {};
        this.mMaterialLoadQueue = {};

        this.mRequestedTextureIdList = {};
        this.mRequestedMaterialIdList = {};
        this.mResponseMaterialUrlList = [];
        this.mRequestedTextureDataList = {};
        this.mRequestedMaterialDataList = {};
        this.mLoadedImageUrlCache = {};

        this.textureList = {};
        this.materialList = {};

        this._metadata = null;
        this._serviceVersion = null;

        this._tiledFrame = {};
        this._metadataLoadCallbackList = [];
        this._tile3dLoadHandler = this._tile3dLoadHandler.bind(this);
        this._onSetupHandler = this._onSetupHandler.bind(this);
        this._texturesLoadHandler = this._texturesLoadHandler.bind(this);
        this._materialsLoadHandler = this._materialsLoadHandler.bind(this);
        this.requestServiceVersion = this._requestServiceVersion.bind(this);
        this.onServiceVersionRecieve = this._onServiceVersionRecieve.bind(this);
        this.init = this._init.bind(this);

        this._isActive = true;
        this._metadataUrl = params.url + "?METHOD=GET3DMETADATA&Layer=" + this._layerId_enc;

        GWTK.gEngine.Mediator.subscribe("updateScene", this._onSceneUpdate.bind(this));
        if (!params.instant) {
            GWTK.gEngine.Mediator.subscribe('clearLoadingScreen', this.requestServiceVersion);
        }else{
            this.requestServiceVersion();
        }
    };
    GWTK.gEngine.Scene.Tile3dSource.prototype = {
        mTextureCounter: 0,
        mMaterialCounter: 0,
        /**
         * Запросить версию сервиса
         * @method _requestServiceVersion
         * @private
         */
        _requestServiceVersion: function() {
            GWTK.gEngine.Mediator.publish("requestServiceVersion", {
                serviceUrl: this._data3dUrl.getServer(),
                handler: this.onServiceVersionRecieve
            });
        },
        /**
         * Обработчик получения версии сервиса
         * @method _onServiceVersionRecieve
         * @private
         * @param version {number} Версия сервиса
         */
        _onServiceVersionRecieve: function(version) {
            if (version != null) {
                this._serviceVersion = version;
                this._init();
            }
            window.setTimeout(function() {
                GWTK.gEngine.Mediator.unsubscribe('clearLoadingScreen', this.requestServiceVersion)
            }.bind(this), 0);
        },
        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function() {

            var command = MessageQueueCommand.setupParser3dTiles;
            var requestData = {
                src: this._metadataUrl,
                layerId: this._layerId_enc,
                command
            };
            this._messageQueue.post(this._messageQueue.createMessageData(this._layerId + Math.random(), requestData, 0, GWTK.gEngine.GLOBAL_LIVETIME), { onLoad: this._onSetupHandler });

        },
        /**
         * Обработчик события обновления сцены
         * @method _onSceneUpdate
         * @private
         * @param timeUpdate {object} Время обновления
         */
        _onSceneUpdate: function(timeUpdate) {
            this._uploadTexturesAndMaterials(timeUpdate);
            this._textureRequestTicker();
        },
        /**
         * Обработчик загрузки метаданных модели
         * @method _onSceneUpdate
         * @private
         * @param message {object} Сообщение из второго потока
         */
        _onSetupHandler: function(message) {
            this._metadata = message.metadata || null;
            if (this._metadata !== null) {

                this._maxZoom = Math.min(this._maxZoom, this._metadata.MaxZoom);
                this._minZoom = Math.max(this._minZoom, this._metadata.MinZoom);

                this._projection = ProjectionCollection[this._metadata['Matrix']];
                var dFrame = this._metadata.DFRAME;
                var extent = new GeodeticExtent(dFrame[1], dFrame[0], dFrame[3], dFrame[2]);
                this._calcTileBorders(extent);
                for (var i = 0; i < this._metadataLoadCallbackList.length; i++) {
                    this._metadataLoadCallbackList[i](this._metadata);
                }
            }else{
                var errorHtml = GWTK.gEngine.Utils3d.parseServiceException(message.errorText);
                var protocolHtml = (errorHtml ? errorHtml + " " : "") + w2utils.lang("Server") + ": " + this._data3dUrl.getServer() + ". " + w2utils.lang("Layer identifier") + ": " + this._layerId;
                GWTK.gEngine.Mediator.publish('writeProtocol', { text: protocolHtml, displayFlag: false });

                GWTK.gEngine.Mediator.publish('writeProtocol', {
                    text: w2utils.lang("Failed to get DB3D metadata") + " (<i>" + w2utils.lang("Details in the event log") + "</i>)",
                    displayFlag: true
                });
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
            for (var i = this._minZoom; i <= this._maxZoom; i++) {
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
         * Вызов обработчика после получения метаданых
         * @method onMetadataLoad
         * @public
         * @param callback {function} Обработчик
         */
        onMetadataLoad: function(callback) {
            if (this._metadata !== null) {
                callback(this._metadata);
            }else{
                if (this._metadataLoadCallbackList.indexOf(callback) === -1) {
                    this._metadataLoadCallbackList.push(callback);
                }
            }
        },
        /**
         * Получить тип пирамиды тайлов
         * @method getTilematrixset
         * @public
         * @return {string} Тип пирамиды тайлов
         */
        getTilematrixset: function() {
            return this._projection.getTilematrixset();
        },
        /**
         * Получить проекцию модели
         * @method getProjection
         * @public
         * @return {GWTK.gEngine.Core.Projection} Проекция модели
         */
        getProjection: function() {
            return this._projection;
        },
        /**
         * Получить идентификатор модели
         * @method getId
         * @public
         * @return {string} Идентификатор модели
         */
        getId: function() {
            return this._id;
        },
        /**
         * Получить признак того, что слой опубликован автоматически,
         * а не добавлен администратором
         * @method getPublished
         * @public
         * @return {boolean} Слой опубликован автоматически
         */
        getPublished: function () {
            return this._published;
        },
        /**
         * Создать меш для узла
         * @method createNodeMesh
         * @public
         * @param node {GWTK.gEngine.Scene.Tile3dNode} Узел 3D тайлов
         */
        createNodeMesh: function(node) {
            var identifier = node.getIdentifier();
            if (this.checkTileFrame(identifier)) {
                var obb = node.getOBB();
                if (this._metadata.MaxObjectSizeInZoom[identifier.getLevel()] !== 0) {
                    var tile3d = this.requestMesh(identifier, obb);
                    if (tile3d === null) {
                        this._addToMeshQueue(this._prefix + identifier.toString(), node);
                    }
                }
            }else{
                //тайл вне модели
                node.createModelNodeList();
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
         * @method requestMesh
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @param obb {OrientedBoundingBox3D} Геометрия ограничивающего объема
         * @return {boolean|object|null} Результат `true` - пустой тайл,
         *                                         `object` - описание тайла,
         *                                         `null` - тайл не загружен
         */
        requestMesh: function(identifier, obb) {
            var queryString = this._getLoadingSource(identifier);
            var id = this._prefix + identifier.toString();
            var tile3d = this._mTiles3dCache[id] || null;
            if (tile3d === null) {
                var command = MessageQueueCommand.load3dTile;
                var data = {
                    src: this._data3dUrl.getServer(),
                    jsRpc: {
                        LAYER: this._layerId_enc,
                        ZOOM: identifier.getLevel(),
                        MINCOL: identifier.getX(),
                        MAXCOL: identifier.getX(),
                        MINROW: identifier.getY(),
                        MAXROW: identifier.getY()
                    },
                    tilematrixset: this.getTilematrixset(),// для пересчетов (временно)
                    obb: obb.toJSON(),
                    crs: this._metadata.Epsg,
                    serviceUrl: this._data3dUrl.getServer(),
                    serviceVersion: this._serviceVersion,
                    command
                };
                this._messageQueue.post(this._messageQueue.createMessageData(id, data, identifier.getLevel()), { onLoad: this._tile3dLoadHandler });
            }
            return tile3d;
        },
        /**
         * Обработчик загрузки меша
         * @method _onSceneUpdate
         * @private
         * @param message {object} Сообщение из второго потока
         */
        _tile3dLoadHandler: function(responseData, message) {
            this._mTiles3dCache[message.id] = responseData.tileMeshes[0] || true;
            this._updateMeshQueue();
        },
        /**
         * Добавить запрос меша в очередь
         * @method _addToMeshQueue
         * @private
         * @param id {string} Идентификатор запроса
         * @param node {GWTK.gEngine.Scene.Tile3dNode} Узел 3D тайлов
         */
        _addToMeshQueue: function(id, node) {
            if (this.mMeshQueue[id] == null) {
                this.mMeshQueue[id] = node;
            }
        },
        /**
         * Обновить очередь запросов
         * @method _updateMeshQueue
         * @private
         */
        _updateMeshQueue: function() {
            for (var id in this.mMeshQueue) {
                var curChunkedNode = this.mMeshQueue[id];
                var tile3d = this._mTiles3dCache[id];
                if (tile3d === true) {
                    curChunkedNode.createModelNodeList();
                    delete this.mMeshQueue[id];
                    delete this._mTiles3dCache[id];
                }else if (tile3d != null) {

                    var nodeOBB = curChunkedNode.getOBB();
                    var resultOBB = tile3d.obb;
                    if (resultOBB) {
                        nodeOBB.fromJSON(resultOBB);
                    }

                    if (tile3d.tileList) {
                        curChunkedNode.createModelNodeList();
                        for (var k in tile3d.tileList) {
                            var models = tile3d.tileList[k].items;
                            for (var modelId in models) {
                                var modelNode = new GWTK.gEngine.Scene.Tile3dNodeModel(modelId, curChunkedNode);
                                var primitives = models[modelId].items;
                                for (var pId in primitives) {
                                    var primitive = primitives[pId];
                                    var renderable = this._createRenderable(primitive);
                                    modelNode.addRenderable(renderable);
                                    renderable.setOBB(nodeOBB);
                                }
                                curChunkedNode.addModelNode(modelNode);
                            }
                        }
                        delete this.mMeshQueue[id];
                    }
                    delete this._mTiles3dCache[id];
                }
            }
        },
        /**
         * Загрузка текстур и материалов
         * @method _uploadTexturesAndMaterials
         * @private
         * @param timeUpdate {object} Время обновления
         */
        _uploadTexturesAndMaterials: function(timeUpdate) {
            var endTime = timeUpdate.targetTime;
            for (var materialFullId in this.mMaterialLoadQueue) {
                this._loadMaterial(materialFullId, this.mMaterialLoadQueue[materialFullId]);
                delete this.mMaterialLoadQueue[materialFullId];
            }

            for (var textureFullId in this.mLoadedImageUrlCache) {
                if (this.mLoadedImageUrlCache[textureFullId] !== true) {
                    this._loadTexture(textureFullId, this.mLoadedImageUrlCache[textureFullId]);
                    if (endTime - performance.now() <= 3) {
                        break;
                    }
                }
            }
        },
        /**
         * Загрузка изображения текстуры
         * @method _loadTexture
         * @private
         * @param textureFullId {string} Название текстуры
         * @param src {string} Внутренняя ссылка
         */
        _loadTexture: function(textureFullId, src) {
            if (!GWTK.gEngine.Renderer.TextureMap.hasEntry(textureFullId)) {
                this.mLoadedImageUrlCache[textureFullId] = true;
                var img = new Image();
                // После загрузки изображения преобразовать его в текстуру
                img.onload = function() {
                    if (this._isActive) {
                        var description = new GWTK.gEngine.Renderer.Texture2DDescription(img.width, img.height, GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8, true);
                        GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate(textureFullId, description, img, false, GWTK.gEngine.Renderer.TextureSamplers.linearMipmapRepeat);
                        window.URL.revokeObjectURL(src);

                        var textureIdentifier = TextureIdentifier.fromString(textureFullId);
                        var loadedTextureLevelList = this.mRequestedTextureIdList[textureIdentifier.getLevel()];
                        loadedTextureLevelList[textureIdentifier.getId()] = null;

                        delete this.mLoadedImageUrlCache[textureFullId];
                    }

                }.bind(this);
                img.src = src;
            }else{
                delete this.mLoadedImageUrlCache[textureFullId];
            }
        },
        /**
         * Загрузка материала
         * @method _loadTexture
         * @private
         * @param materialFullId {string} Название материала
         * @param material {object} Описание материала
         */
        _loadMaterial: function(materialFullId, material) {
            GWTK.gEngine.Renderer.MaterialMap.retrieveOrCreate(materialFullId, material);
        },
        /**
         * Отправить запрос изображений из очереди
         * @method _textureRequestTicker
         * @private
         */
        _textureRequestTicker: function() {
            var command = MessageQueueCommand.load3dTileTexture;
            for (var zoom in this.textureList) {
                var textureList = this.textureList[zoom];
                if (textureList.length > 0) {
                    var textureCounter = GWTK.gEngine.Scene.Tile3dSource.prototype.mTextureCounter++;
                    var id = "tile3dTextures_" + textureCounter + "_" + zoom;
                    var textures = textureList.join(",");
                    textureList.length = 0;
                    var jsRpc = {
                        "LAYER": this._layerId,
                        "ZOOM": zoom,
                        "TEXTUREID": textures
                    };
                    this.mRequestedTextureDataList[id] = {
                        src: this._data3dUrl.getServer(),
                        jsRpc: jsRpc,
                        serviceUrl: this._data3dUrl.getServer(),
                        command
                    };
                    break;
                }
            }

            for (id in this.mRequestedTextureDataList) {
                this._messageQueue.post(this._messageQueue.createMessageData(id, this.mRequestedTextureDataList[id], 0, GWTK.gEngine.GLOBAL_LIVETIME), { onLoad: this._texturesLoadHandler });
            }
            command = MessageQueueCommand.load3dTileMaterial;
            for (zoom in this.materialList) {
                var materialList = this.materialList[zoom];
                if (materialList.length > 0) {
                    var materialCounter = GWTK.gEngine.Scene.Tile3dSource.prototype.mMaterialCounter++;
                    id = "tile3dMaterials_" + materialCounter + "_" + zoom;
                    var materials = materialList.join(",");
                    materialList.length = 0;
                    jsRpc = {
                        "LAYER": this._layerId,
                        "ZOOM": zoom,
                        "MATERIALID": materials
                    };
                    this.mRequestedMaterialDataList[id] = {
                        src: this._data3dUrl.getServer(),
                        jsRpc: jsRpc,
                        serviceUrl: this._data3dUrl.getServer(),
                        command
                    };
                    break;
                }
            }

            for (id in this.mRequestedMaterialDataList) {
                this._messageQueue.post(this._messageQueue.createMessageData(id, this.mRequestedMaterialDataList[id], 0, GWTK.gEngine.GLOBAL_LIVETIME), { onLoad: this._materialsLoadHandler });
            }
        },
        /**
         * Добавить текстуы в очередь на загрузку
         * @method loadTextures
         * @public
         * @param textureIdentifierList {array} Массив идентификаторов текстур
         */
        loadModelTextures: function(textureIdentifierList) {
            for (var i = 0; i < textureIdentifierList.length; i++) {
                var textureIdentifier = textureIdentifierList[i];

                if (this.mLoadedImageUrlCache[textureIdentifier] || GWTK.gEngine.Renderer.TextureMap.hasEntry(textureIdentifier)) {
                    continue;
                }

                var textureIdentifierObject = TextureIdentifier.fromString(textureIdentifier);
                var level = textureIdentifierObject.getLevel();
                var textureId = textureIdentifierObject.getId();

                if (!this.mRequestedTextureIdList[level]) {
                    this.mRequestedTextureIdList[level] = {};
                }
                var requestedTextureIds = this.mRequestedTextureIdList[level];
                if (!requestedTextureIds[textureId]) {
                    if (!Array.isArray(this.textureList[level])) {
                        this.textureList[level] = [];
                    }
                    var textureList = this.textureList[level];
                    if (textureList.indexOf(textureId) === -1) {
                        textureList.push(textureId);
                    }
                    requestedTextureIds[textureId] = true;
                }
            }
        },
        /**
         * Добавить материалы в очередь на загрузку
         * @method loadTextures
         * @public
         * @param materialIdentifierList {array} Массив идентификаторов материалов
         */
        loadModelMaterials: function(materialIdentifierList) {
            for (var i = 0; i < materialIdentifierList.length; i++) {

                var materialIdentifier = materialIdentifierList[i];
                var materialIdentifierObject = MaterialIdentifier.fromString(materialIdentifier);
                var level = materialIdentifierObject.getLevel();
                var materialId = materialIdentifierObject.getId();

                if (this.mResponseMaterialUrlList[level] && this.mResponseMaterialUrlList[level][materialId]) {
                    this._addToLoadMaterialQueue(materialIdentifier, this.mResponseMaterialUrlList[level][materialId]);
                }
                if (this.mMaterialLoadQueue[materialIdentifier]) {
                    continue;
                }

                if (!this.mRequestedMaterialIdList[level]) {
                    this.mRequestedMaterialIdList[level] = {};
                }
                var loadedMaterialList = this.mRequestedMaterialIdList[level];

                if (!loadedMaterialList[materialId]) {
                    if (!Array.isArray(this.materialList[level])) {
                        this.materialList[level] = [];
                    }
                    var materialList = this.materialList[level];
                    if (materialList.indexOf(materialId) === -1) {
                        materialList.push(materialId);
                    }
                    loadedMaterialList[materialId] = true;
                }
            }
        },
        /**
         * Обработчик ответа с текстурами
         * @method _texturesLoadHandler
         * @private
         * @param message {object} Сообщение из другого потока
         */
        _texturesLoadHandler: function(responseData, message) {
            var id = message.id;
            if (this.mRequestedTextureDataList[id]) {
                delete this.mRequestedTextureDataList[id];
            }
            var structure = responseData.textures;
            if (structure != null) {
                var textureList = structure.TextureList;
                if (Array.isArray(textureList)) {
                    for (var i = 0, texture; (texture = textureList[i]); i++) {
                        var textureFullId = new TextureIdentifier(structure.Zoom, texture.Id).toString();
                        this.mLoadedImageUrlCache[this._id + "0" + textureFullId] = texture.imageUrl;
                    }
                }
            }
        },
        /**
         * Обработчик ответа с материалами
         * @method _materialsLoadHandler
         * @private
         * @param message {object} Сообщение из другого потока
         */
        _materialsLoadHandler: function(responseData, message) {
            var id = message.id;
            if (this.mRequestedMaterialDataList[id]) {
                delete this.mRequestedMaterialDataList[id];
            }
            var structure = responseData.materials;
            if (structure != null) {
                var materialList = structure.MaterialList;
                if (Array.isArray(materialList)) {
                    for (var i = 0, material; (material = materialList[i]); i++) {
                        var materialFullId = new MaterialIdentifier(structure.Zoom, material.Id).toString();
                        this._addToLoadMaterialQueue(this._id + "0" + materialFullId, material.Material);
                    }
                }
            }
        },

        /**
         * Добавить материал в очередь на загрузку в память
         * @method _addToLoadMaterialQueue
         * @private
         * @param materialFullId {string} Название материала
         * @param material {object} Описание материала
         */
        _addToLoadMaterialQueue: function(materialFullId, material) {
            this.mMaterialLoadQueue[materialFullId] = material;
        },

        /**
         * Создать объект отрисовки
         * @method _createRenderable
         * @private
         * @param primitive {object} Параметры объекта
         * @return {GWTK.gEngine.Scene.TexturedChunk|GWTK.gEngine.Scene.PointCloud
         * |GWTK.gEngine.Scene.MaterialChunk} Объект отрисовки
         */
        _createRenderable: function(primitive) {
            var type = -1;
            if (primitive.textureId != null) {
                type = 0;
            }else if (primitive.mesh.attributes && primitive.mesh.attributes.aVertexColor) {
                type = 1;
            }else if (primitive.materialId != null) {
                type = 2;
            }

            var renderable;
            switch (type) {
                case 0:
                    renderable = new GWTK.gEngine.Scene.TexturedChunk();
                    renderable.setMeshBuffers(primitive.mesh);

                    var textureIdentifier = TextureIdentifier.fromString(primitive.textureId);

                    renderable.setTextureId(this._id + "0" + textureIdentifier.toString());
                    break;
                case 1:
                    if (primitive.mesh.primitiveType === PrimitiveType.Points) {
                        renderable = new GWTK.gEngine.Scene.PointCloud();
                    }else{
                        renderable = new GWTK.gEngine.Scene.ColoredChunk();
                    }
                    renderable.setMeshBuffers(primitive.mesh);
                    break;
                case 2:
                    renderable = new GWTK.gEngine.Scene.MaterialChunk();
                    renderable.setMeshBuffers(primitive.mesh);
                    var materialIdentifier = MaterialIdentifier.fromString(primitive.materialId);
                    if (parseInt(materialIdentifier.getId()) === 0) {
                        var id = MaterialIdentifier.fromString(GWTK.gEngine.DEFAULT_MATERIAL).toString();
                    }else{
                        id = this._id + "0" + materialIdentifier.toString();
                    }
                    renderable.setMaterialId(id);
                    break;
                default:
                    renderable = new GWTK.gEngine.Scene.MaterialChunk();
                    renderable.setMeshBuffers(primitive.mesh);
                    renderable.setMaterialId(GWTK.gEngine.DEFAULT_MATERIAL);
            }
            return renderable;
        },
        /**
         * Получить ссылку на тайл
         * @method getLoadingSource
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @return {string} Ссылка на тайл
         */
        _getLoadingSource: function(identifier) {
            return this._data3dUrl.getUrl(identifier);
        },
        /**
         * Удаление объекта
         * @method destroy
         * @public
         */
        destroy: function() {
            this._messageQueue = null;
            this.mMeshQueue = null;
            this._mTiles3dCache = null;
            this.mMaterialLoadQueue = null;
            this.mRequestedTextureIdList = null;
            this.mRequestedMaterialIdList = null;
            this.mResponseMaterialUrlList = null;
            this.mRequestedTextureDataList = null;
            this.mRequestedMaterialDataList = null;
            this.mLoadedImageUrlCache = null;
            this.textureList = null;
            this.materialList = null;
            this._tiledFrame = null;
            this._metadataLoadCallbackList = null;
            this._isActive = false;
        }
    };
}
