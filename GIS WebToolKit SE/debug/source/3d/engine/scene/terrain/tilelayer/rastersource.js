/******************************************** Тазин В. 10/03/20  ****
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
import Trigonometry from '~/3d/engine/core/trigonometry';
import WorkerManager from '~/3d/engine/worker/workermanager';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import TileIdentifier from '~/3d/engine/scene/terrain/tileidentifier';
import GeodeticExtent from '~/3d/engine/core/geodeticextent';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};

    /**
     * Класс источника растровых тайлов
     * @class GWTK.gEngine.Scene.RasterSource
     * @constructor GWTK.gEngine.Scene.RasterSource
     * @param layerDescription {GWTK.LayerDescription} Описание слоя
     * @param projection {GWTK.gEngine.Core.Projection} Проекция
     * @param [requestQueue] Очередь запросов
     */
    GWTK.gEngine.Scene.RasterSource = function (layerDescription, projection, requestQueue) {
        this._layerDescription = layerDescription;
        this._id = layerDescription.xId;
        this._prefix = this.SOURCE_CLASS + this._id + "_" + this._layerDescription.getTilematrixset() + "_";
        this.zIndex = layerDescription.zIndex;
        this.visible = !layerDescription.hidden;
        this._tileWidth = layerDescription.tileWidth;
        this._tileHeight = layerDescription.tileHeight;

        this._chunkRateWidth = 1;
        this._chunkRateHeight = 1;

        this._loadingToTextureImageList = [];
        this._urlCreator = window.URL || window.webkitURL;

        // this._requestQueue = requestQueue || WorkerManager.getRequestQueue();
        this._threadRequestQueue = WorkerManager.getThreadRequestQueue();

        this._rasterUrlList = [];
        this._addRasterUrl(layerDescription);

        this._textureFormat = GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8;

        this.imageLoadHandler = this._imageLoadHandler.bind(this);

        GWTK.gEngine.Mediator.subscribe('changeLayerVisibility', this.setVisibility.bind(this));

        this._isActive = true;
        this._state = new GWTK.gEngine.Scene.RasterSourceState();

        this._textureParams = [0, 0, 1, 1];

        this._minZoom = layerDescription.minzoom;
        this._maxZoom = layerDescription.maxzoom;
        this._tiledFrame = [];

        if (layerDescription.bbox && layerDescription.bbox.length > 0) {
            var bbox = layerDescription.bbox;
        }else{
            bbox = [-90, -180, 90, 180];
        }
        var extent = new GeodeticExtent(bbox[1], bbox[0], bbox[3], bbox[2]);

        this._calcTileBorders(extent, projection);

        this._chromeOptions = {imageOrientation: 'flipY'};
    };
    GWTK.gEngine.Scene.RasterSource.prototype = {
        /**
         * Название компонента
         * @static
         * @property {array} SOURCE_CLASS
         */
        SOURCE_CLASS: "rasterSource_",
        /**
         * Получить состояние источника растровых тайлов
         * @method getState
         * @public
         * @return {GWTK.gEngine.Scene.RasterSourceState} Объект состояния источника растровых тайлов
         */
        getState: function () {
            this._state.visible = this.getVisibility();
            this._state.opacity = this.getOpacity();
            this._state.zIndex = this.getZindex();
            return this._state;
        },
        /**
         * Посчитать границы отображения модели
         * @method _calcTileBorders
         * @private
         * @param extent {GWTK.gEngine.Core.GeodeticExtent} Рамка в геодезических координатах
         * @param projection {GWTK.gEngine.Core.Projection} Проекция
         */
        _calcTileBorders: function (extent, projection) {
            var bottomLeft = projection.geo2xy(Trigonometry.toRadians(new Geodetic3D(extent.getWest(), extent.getSouth(), 0)));
            var topRight = projection.geo2xy(Trigonometry.toRadians(new Geodetic3D(extent.getEast(), extent.getNorth(), 0)));
            for (var i = this._minZoom; i <= this._maxZoom; i++) {
                var bottomLeftTileIdentifier = projection.xy2tile(bottomLeft[0], bottomLeft[1], i);
                var topRightTileIdentifier = projection.xy2tile(topRight[0], topRight[1], i);
                this._tiledFrame[i] = {
                    minCol: bottomLeftTileIdentifier.getX(),
                    maxCol: topRightTileIdentifier.getX(),
                    minRow: topRightTileIdentifier.getY(),
                    maxRow: bottomLeftTileIdentifier.getY()
                }
            }
        },
        /**
         * Проверить вхождение узла в габариты слоя
         * @method checkTileFrame
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @return {boolean} Флаг вхождения узла в габариты слоя
         */
        checkTileFrame: function (identifier) {
            var result = false;
            var tileIdentifier = this.calcTileIdentifier(identifier);
            var level = tileIdentifier.getLevel();
            var col = tileIdentifier.getX();
            var row = tileIdentifier.getY();
            var frame = this._tiledFrame[level];

            if (frame != null && col >= frame.minCol && col <= frame.maxCol && row >= frame.minRow && row <= frame.maxRow) {
                result = true;
            }

            return result;
        },
        /**
         * Получить уникальный идентификатор слоя
         * @method getId
         * @public
         * @return {string} Уникальный идентификатор слоя в приложении
         */
        getId: function () {
            return this._id;
        },
        /**
         * Получить zIndex
         * @method getZindex
         * @public
         * @return {number} zIndex слоя
         */
        getZindex: function () {
            return this._layerDescription.zIndex;
        },
        /**
         * Установить видимость слоя
         * @method setVisibility
         * @public
         * @param e {object} Объект события
         */
        setVisibility: function (e) {
            if (this._id === e.id) {
                if (e.visible) {
                    this._show();
                } else {
                    this._hide();
                }
            }
        },
        /**
         * Получить видимость слоя
         * @method getVisibility
         * @public
         * @return {boolean} Флаг видимости слоя
         */
        getVisibility: function () {
            return this.visible;
        },
        /**
         * Отобразить слой
         * @method _show
         * @private
         */
        _show: function () {
            this.visible = true;
        },
        /**
         * Скрыть слой
         * @method _hide
         * @private
         */
        _hide: function () {
            this.visible = false;
        },
        /**
         * Получить значение непрозрачности слоя
         * @method getOpacity
         * @public
         * @return {number} Значение непрозрачности слоя (от 0 до 1.0)
         */
        getOpacity: function () {
            return this._layerDescription.getOpacityValue();
        },
        /**
         * Получить описание слоя
         * @method getDescription
         * @public
         * @return {GWTK.LayerDescription} Описание слоя
         */
        getDescription: function () {
            return this._layerDescription;
        },
        /**
         * Создать идентификатор растрового изображения тайла поверхности
         * @method _createTileRasterId
         * @private
         * @return {string} Идентификатор растрового изображения тайла поверхности
         */
        _createTileRasterId: function (identifier) {
            return this._prefix + identifier.toString();
        },
        /**
         * Получить параметры текстуры
         * @method getTextureParams
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @return {array} Параметры текстуры [xOffset,yOddset,kWidth,kHeight]
         */
        getTextureParams: function (identifier) {
            var kW = this._chunkRateWidth;
            var kH = this._chunkRateHeight;
            var kLevel = Math.pow(2, identifier.getLevel());

            if (kLevel >= kW) {
                var kWidth = 1 / kW;
            } else {
                kWidth = 1 / kLevel;
            }

            if (kLevel >= kH) {
                var kHeight = 1 / kH;
            } else {
                kHeight = 1 / kLevel;
            }

            var x = identifier.getX() * kWidth;
            var y = identifier.getY() * kHeight;

            this._textureParams[2] = kWidth;
            this._textureParams[3] = kHeight;
            this._textureParams[0] = x - Math.floor(x);
            this._textureParams[1] = (1 - this._textureParams[3]) - (y - Math.floor(y));

            return this._textureParams;
        },
        /**
         * Запросить изображение тайла
         * @method requestTileTexture
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @return {string} Идентификатор растрового изображения тайла поверхности
         */
        requestTileTexture: function (identifier) {
            var tileIdentifier = this.calcTileIdentifier(identifier);
            var id = this._createTileRasterId(tileIdentifier);
            var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry(id);
            if (texture === undefined && this._loadingToTextureImageList.indexOf(id) === -1) {
                var rasterUrl = this.getRasterUrl(tileIdentifier.getX() + tileIdentifier.getY() + tileIdentifier.getLevel());
                var queryString = this._getLoadingSource(rasterUrl, tileIdentifier);
                // var requestParams = {};
                // requestParams['method'] = 'GET';
                // requestParams['src'] = queryString;
                // requestParams['sync'] = false;
                // requestParams['responseType'] = 'blob';
                // requestParams['onabort'] = requestParams['onerror'] = function () {
                // };
                //
                // var data = {
                //     requestParams: requestParams,
                //     serviceUrl: this._getLoadingService(rasterUrl)
                // };
                //
                // var requestData = this._requestQueue.createRequestData(id, data, tileIdentifier.getLevel());
                //
                // this._requestQueue.post(this.imageLoadHandler, requestData);

                const serviceUrl = this._getLoadingService(rasterUrl);
                let commonService = GWTK.RequestServices.retrieveOrCreate({ url: serviceUrl }, 'COMMON');

                const requestData = this._threadRequestQueue.createMessageData(id, {
                    serviceUrl:serviceUrl,
                    httpParams: { url: queryString, responseType: 'blob' },
                    requestMethod: commonService.commonGet.bind(commonService)
                }, tileIdentifier.getLevel());

                this._threadRequestQueue.post(requestData, {
                    onLoad: function(response) {
                        this.imageLoadHandler({ id, responseData: response.data });
                    }.bind(this),
                    onError: function(e) {
                        let isError = true;
                        if (e) {
                            const errorObject = JSON.parse(e);
                            if (errorObject && errorObject.exceptionCode === 'AbortRequest') {
                                isError = false;
                            }
                        }
                        if (isError) {
                            this.imageLoadHandler({id, responseData: null});
                        }
                    }.bind(this)
                });
            }
            return id;
        },
        /**
         * Проверить существование изображения тайла
         * @method checkTextureExistance
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @return {boolean} Флаг существования изображения тайла
         */
        checkTextureExistance: function (identifier) {
            var tileIdentifier = this.calcTileIdentifier(identifier);
            var id = this._createTileRasterId(tileIdentifier);
            var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry(id);
            return (texture !== undefined);
        },
        /**
         * Персчитать идентификатор тайла
         * @method calcTileIdentifier
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @return {TileIdentifier} Новый идентификатор тайла
         */
        calcTileIdentifier: function (identifier) {
            var kW = this._chunkRateWidth;
            var kH = this._chunkRateHeight;
            var col = Math.floor(identifier.getX() / kW);
            var row = Math.floor(identifier.getY() / kH);
            return new TileIdentifier(identifier.getLevel(), col, row);
        },
        /**
         * Установить ширину изображения тайла
         * @method setChunkTileWidth
         * @public
         * @param value {number} Ширина изображения тайла
         */
        setChunkTileWidth: function (value) {
            if (value) {
                this._chunkRateWidth = this._tileWidth / value;
            }
        },
        /**
         * Установить высоту изображения тайла
         * @method setChunkTileHeight
         * @public
         * @param value {number} Высота изображения тайла
         */
        setChunkTileHeight: function (value) {
            if (value) {
                this._chunkRateHeight = this._tileHeight / value;
            }
        },
        /**
         * Загрузить изображение в текстуру
         * @method postsToTexture
         * @private
         * @param id {string} Идентификатор текстуры
         * @param posts {object} Изображение
         */
        _postsToTexture: function (id, posts) {
            var description = new GWTK.gEngine.Renderer.Texture2DDescription(this._tileWidth, this._tileHeight, this._textureFormat, false);
            GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate(id, description, posts, false, GWTK.gEngine.Renderer.TextureSamplers.linearClamp);
            this._loadingToTextureImageList.splice(this._loadingToTextureImageList.indexOf(id), 1);
        },
        /**
         * Обработчик получения изображения через ссылку
         * @method _imageUrlCreatorLoadHandler
         * @private
         * @param id {string} Идентификатор запроса
         * @param imageSrc {string} Адрес изображения
         */
        _imageUrlCreatorLoadHandler: function (id, imageSrc) {
            var image = new Image(this._tileWidth, this._tileHeight);
            var that = this;
            image.onload = function () {
                if (that._isActive) {
                    that._postsToTexture(id, this);
                    that._urlCreator.revokeObjectURL(imageSrc);
                }
            };
            image.onerror = function () {
                that._postsToTexture(id, null);
                that._urlCreator.revokeObjectURL(imageSrc);
            };
            image.src = imageSrc;
        },
        /**
         * Обработчик получения изображения
         * @method _imageLoadHandler
         * @private
         * @param requestData {GWTK.gEngine.Core.RequestData} Данные запроса
         */
        _imageLoadHandler: function (requestData) {
            if (this._isActive) {
                var id = requestData.id;
                var blob = requestData['responseData'];
                var that = this;
                if (typeof createImageBitmap === 'function') {
                    var imageLoadHandler = function (value) {
                        if (that._isActive) {
                            that._postsToTexture(id, value);
                        }
                    };
                    var imageErrorHandler = function () {
                        that._postsToTexture(id, null);
                    };
                    createImageBitmap(blob, that._chromeOptions).then(imageLoadHandler)["catch"](imageErrorHandler);
                } else {
                    var imageSrc = this._urlCreator.createObjectURL(blob);
                    this._imageUrlCreatorLoadHandler(id, imageSrc);
                }
                this._loadingToTextureImageList.push(id);
            }
        },
        /**
         * Добавить источники для загрузки тайлов
         * @method _addRasterUrl
         * @private
         * @param layerDescription {GWTK.LayerDescription} Описание слоя
         */
        _addRasterUrl: function (layerDescription) {
            for (var i = 0; i < layerDescription.linkedUrls.length; i++) {
                var urlString = layerDescription.linkedUrls[i].href;
                var string = urlString.replace(/%tilematrixset/g, '' + layerDescription.getTilematrixset());
                this._rasterUrlList.push(new GWTK.gEngine.Scene.RasterSourceUrl(urlString.slice(0, urlString.indexOf("?")), string));
            }
        },
        /**
         * Получить источник для загрузки тайлов
         * @method getRasterUrl
         * @public
         * @param [n] {number} Число для определения номера источника из списка
         * @return {GWTK.gEngine.Scene.RasterSourceUrl} Источник для загрузки тайлов
         */
        getRasterUrl: function (n) {
            if (n === undefined) {
                n = Math.floor(Math.random() * 100);
            }
            return this._rasterUrlList[n % this._rasterUrlList.length];
        },
        /**
         * Получить ссылку на тайл
         * @method getLoadingSource
         * @public
         * @param rasterUrl {GWTK.gEngine.Scene.RasterSourceUrl} Источник для загрузки тайлов
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @return {string} Ссылка на тайл
         */
        _getLoadingSource: function (rasterUrl, identifier) {
            return rasterUrl.getUrl(identifier);
        },
        /**
         * Получить адрес сервиса
         * @method _getLoadingService
         * @public
         * @param rasterUrl {GWTK.gEngine.Scene.RasterSourceUrl} Источник для загрузки тайлов
         * @return {string} Адрес сервиса
         */
        _getLoadingService: function (rasterUrl) {
            return rasterUrl.getServer();
        },
        /**
         * Удаление компонента
         * @method destroy
         * @public
         */
        destroy: function () {
            this._urlCreator = null;
            this._messageQueue = null;
            this._rasterUrlList = null;
            this._loadingToTextureImageList = null;
            this._isActive = false;
        }
    };
    /**
     * Класс состояние источника растровых тайлов
     * @class GWTK.gEngine.Scene.RasterSourceState
     * @constructor GWTK.gEngine.Scene.RasterSourceState
     */
    GWTK.gEngine.Scene.RasterSourceState = function () {
        this.visible = false;
        this.opacity = 1;
        this.zIndex = -1;

        this.targetState = null;
    };
    GWTK.gEngine.Scene.RasterSourceState.prototype = {
        /**
         * Проверить равенство
         * @method equals
         * @public
         * @param other {GWTK.gEngine.Scene.RasterSourceState} Объект состояния источника растровых тайлов
         * @return {boolean} Флаг равенства состояний
         */
        equals: function (other) {
            return this.visible === other.visible && this.opacity === other.opacity && this.zIndex === other.zIndex;
        },
        /**
         * Установить целевое состояние
         * @method setTargetState
         * @public
         * @param rasterState {GWTK.gEngine.Scene.RasterSourceState} Объект состояния источника растровых тайлов
         */
        setTargetState: function (rasterState) {
            this.targetState = rasterState;
        },
        /**
         * Получить целевое состояние
         * @method getTargetState
         * @public
         * @return {GWTK.gEngine.Scene.RasterSourceState} Объект состояния источника растровых тайлов
         */
        getTargetState: function () {
            return this.targetState;
        },
        /**
         * Обновить в соответствии с целевым состоянием
         * @method clean
         * @public
         */
        clean: function () {
            this.visible = this.targetState.visible;
            this.opacity = this.targetState.opacity;
            this.zIndex = this.targetState.zIndex;
            this.targetState = null;
        }
    };
}