/****************************************** Тазин В.О. 19/03/21  ****
 *************************************** Патейчук В.К. 20/02/20  ****
 ************************************** Железнякова Ю. 12/05/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент 3d карта                             *
 *                                                                  *
 *******************************************************************/
"use strict";
import GeoJSON from '~/utils/GeoJSON';
import WorkerManager from '~/3d/engine/worker/workermanager';
import { ProjectionCollection } from '~/3d/engine/core/geometry/projection';
import { LOCALE } from '~/3d/engine/worker/workerscripts/parse3dobject';
import { VIEWTYPE } from '~/3d/engine/worker/workerscripts/object3dtemplate';
import { VIEW_SETTINGS_PARAMS3D, PROJECT_SETTINGS_VISIBLE_MODELS } from '~/utils/WorkspaceManager';
import { LightSource, ViewMode } from '../utils/WorkspaceManager';

if (window.GWTK) {
    
    /**
     * Компонент 3d карты
     * @class GWTK.Map3d
     * @constructor GWTK.Map3d
     */
    GWTK.Map3d = function(map) {
        this.map = map || GWTK.maphandlers.map; //Объект карты
        this.params = map.options['params3d'] || {};
        this.initialized = false;
        // Регистрация объекта
        this.toolname = "3dMap";
        this.map.maptools.push(this); //Доступ по map.mapTool("3dMap")
        
        this._clearState = new GWTK.gEngine.Renderer.ClearState();
        this._clearState.color = [1, 1, 1, 1];
        
        this._sceneState = new GWTK.gEngine.Renderer.SceneState();
        
        this.canvasId = null;
        // this.goToCenterThrottled = GWTK.gEngine.Utils3d.throttle(this._goToCenter.bind(this), 200);
        this._resetUserActivityDebounced = GWTK.gEngine.Utils3d.debounce(this._resetUserActivity.bind(this), 1000);
        
        this._drawScene = this._drawScene.bind(this);
        
        this.mCookieArray = [];
        this.mCookieIdsArray = [];
        
        this._layerList = [];
        this._pluginList = [];
        
        this._modelNumber = 1;
        
        this.BLACKCOLOR = [0, 0, 0, 1];
        this.WHITECOLOR = [1, 1, 1, 1];
        
        
        //TODO: временная не совсем адекватная мера (необходимо, пока не инициализирован компонент)
        this.updateLayerVisibilityInOptions = this.updateLayerVisibilityInOptions.bind(this);
        $(this.map.panes.eventPane).on('visibilitychanged', this.updateLayerVisibilityInOptions);
        
        GWTK.gEngine.Mediator.subscribe('showPlacemark', this._showPlaceMark.bind(this));
        GWTK.gEngine.Mediator.subscribe('clearPlaceMark', this._clearPlaceMark.bind(this));
        
        GWTK.gEngine.Mediator.subscribe('showViewMark', this._showViewMark.bind(this));
        GWTK.gEngine.Mediator.subscribe('clearViewMark', this._clearViewMark.bind(this));
        
        GWTK.gEngine.Mediator.subscribe('addModels', this._publicate3dLayer.bind(this));
        
        GWTK.gEngine.Mediator.subscribe('writeProtocol', this._writeProtocol.bind(this));
        this._modelLoadHandler = this._modelLoadHandler.bind(this);
        this._renderable = false;
        
    };
    
    GWTK.Map3d.prototype = {
        /**
         * Проверка активности компонента
         * @method isActive
         * @public
         * @return {boolean} Компонент активен
         */
        isActive: function() {
            return this.initialized && this.isVisible();
        },
        /**
         * Проверка видимости компонента
         * @method isVisible
         * @public
         * @return {boolean} Компонент виден
         */
        isVisible: function() {
            return GWTK.gEngine.Renderer.Context.getGL() && GWTK.gEngine.Renderer.Context.getGL().canvas.style.display !== 'none';
        },
        /**
         * Инициализация 3d карты
         * @method _init
         * @private
         */
        _init: function() {
            if (!this.map)
                return false;
            
            //Создание холста
            if (!this.initialized) {
                var id = this._createCanvas();
                GWTK.gEngine.Renderer.Context.initializeEngine(id);
                this.map3dData = new GWTK.Map3dData(this.map, this._sceneState.getCamera());
            }
            
            
            this.lastUpdateTime = 0;// Время последней перерисовки от начала работы
            this.lastCashCleaningTime = 0;// Время последней перерисовки от начала работы
            
            this.timeUpdate = {
                type: 'updateScene',
                currentDelay: 0,
                currentTime: 0
            };
            
            this.opacityMode = {
                currentDelay: this.timeUpdate.currentDelay,
                currentTime: this.timeUpdate.currentTime,
                ObserverFrame: this.map3dData.ObserverFrame,
                objectsVisibility: false,
                starsVisibility: false,
                logarithmicDepth: false,
                thau: this.thau,
                layersVisibility: null,
                transparentMode: false,
                sceneState: this._sceneState,
                userActivity: false
            };
            
            
            this.transparentMode = {
                currentDelay: null,
                ObserverFrame: this.map3dData.ObserverFrame,
                objectsVisibility: null,
                layersVisibility: null,
                transparentMode: true,
                sceneState: this._sceneState,
                userActivity: false
            };
            
            this.map3dData.set3dMap(this._sceneState);
            
            this._initDefaults();
            this._show3d();
            var mediator = GWTK.gEngine.Mediator;
            mediator.subscribe('userActivity', this._updateUserActivity.bind(this));
            
            mediator.subscribe('moveToPoint', function(e) {
                var dest = e.point;
                var map3dData = this.map3dData;
                var projection = map3dData.getMapProjection();
                var center = projection.geo2xy(map3dData.getGeoCenter());
                this._flyToPoint([center[1], center[0], center[2]], dest);
            }.bind(this));
            
            GWTK.gEngine.Renderer.KeyBoard.subscribe(function(event) {
                if (event.ctrlKey && event.shiftKey && event.clickedList.indexOf(GWTK.gEngine.Renderer.KeyboardCode["S"]) !== -1) {
                    this.toggleViewMode();
                }
            }.bind(this));
            GWTK.gEngine.Renderer.KeyBoard.subscribe(function(event) {
                if (event.ctrlKey && event.shiftKey && event.clickedList.indexOf(GWTK.gEngine.Renderer.KeyboardCode["L"]) !== -1) {
                    this.toggleLightSource();
                }
            }.bind(this));
            
            this.initialized = true;
        },
  
        /**
         * Инициализация начального вида 3d карты
         * @method _initDefaults
         * @private
         */
        _initDefaults: function() {
            this.thau = this.params.quality != null ? 1 + (100 - this.params.quality) / 100 : 1;
            this.map3dData.updateLayerDescriptionList();
            this._initLayers();
        },
        /**
         * Инициализация компонентов отображения 3d режима
         * @method _initLayers
         * @private
         */
        _initLayers: function() {
            //Слой данных точки на модели
            this.servicePointSource = new GWTK.gEngine.Scene.PointSource(this.map3dData.getMapProjection().getGlobeShape(), this.opacityMode);
            //Слой отрисовки сервисных объектов
            this.serviceObjectLayer = new GWTK.gEngine.Scene.ServiceObjectLayer(this.map);
            //Слой отрисовки сервисных объектов
            this.serviceGeolocation = new GWTK.gEngine.Scene.ServiceObjectLayer(this.map);
            //Слой отрисовки сервисных объектов
            this.serviceViewMark = new GWTK.gEngine.Scene.ServiceObjectLayer(this.map, true);
            
            this._initMapLayers();
            
            // Инициализация фона (звезды)
            this._layerList.push(new GWTK.gEngine.Scene.StarrySky());
            // Инициализация фона (созвездия)
            this._layerList.push(new GWTK.gEngine.Scene.Constellations());
            // Инициализация фона (небо)
            this._layerList.push(new GWTK.gEngine.Scene.Background3d());
        },
        /**
         * Инициализация слоев 3d режима
         * @method _initMapLayers
         * @private
         */
        _initMapLayers: function() {
            var projection = this.map3dData.getMapProjection();
            // Инициализация поверхности
            var heightSource = new GWTK.gEngine.Scene.HeightSource(projection);
            heightSource.setLayerDescription(this.map3dData.getWCSdescription());
            GWTK.heightSourceManager.addHeightSource(projection.getTilematrixset(), heightSource);
            
            var chunkTextureSource = new GWTK.gEngine.Scene.ChunkTextureSource(projection);
            var tiledLayersArray = this.map3dData.getTiledLayersArray();
            for (var i = 0; i < tiledLayersArray.length; i++) {
                var layer = tiledLayersArray[i];
                if (layer.service === "wmts") {
                    var rasterSource = new GWTK.gEngine.Scene.RasterSource(layer, projection);
                }else if (layer.service === "wms") {
                    rasterSource = new GWTK.gEngine.Scene.GisWebServiceSEWmsTile(layer, ProjectionCollection['EPSG:3857']);
                }
                if (rasterSource) {
                    chunkTextureSource.addRasterSource(rasterSource);
                }
                rasterSource = null;
            }
            this._layerList.push(new GWTK.gEngine.Scene.ChunkLayer(this.map3dData.getMapState(), chunkTextureSource));
            
            this._pluginList.push(GWTK.mapCreateUserControl('linearmeasurements3d', this.map, new GWTK.gEngine.Plugins.LinearMeasurementLayer(), true));
            this._pluginList.push(GWTK.mapCreateUserControl('surfacemeasurements3d', this.map, new GWTK.gEngine.Plugins.MeasurementBySurfaceLayer(), true));
            this._pluginList.push(GWTK.mapCreateUserControl('areameasurements3d', this.map, new GWTK.gEngine.Plugins.AreaMeasurementLayer(), true));
            this._pluginList.push(GWTK.mapCreateUserControl('surfaceareameasurements3d', this.map, new GWTK.gEngine.Plugins.SurfaceAreaMeasurementLayer(), true));
            
            this._pluginList.push(GWTK.mapCreateUserControl('lightsource3d', this.map, new GWTK.gEngine.Plugins.LightSourceControl(), true));
            this._pluginList.push(GWTK.mapCreateUserControl('viewmode3d', this.map, new GWTK.gEngine.Plugins.ViewModeControl(), true));
            
            // Инициализация слоев 3D тайлов
            var model3dArray = this.map3dData.getModels3dDescription();
            i = 0;
            for (var model3d; (model3d = model3dArray[i]); i++) {
                this._addTiles3dLayer(model3d);
            }
            this._modelNumber = 1;
            // Инициализация слоев с 3D объектами
            var collection = this.map3dData.getListDescObj();
            if (collection !== undefined) {
                for (i = 0; i < collection.listDescObj.length; i++) {
                    var descObj = collection.listDescObj[i];
                    
                    layer = this.map3dData.getLayerDescription(descObj.xId);
                    if (descObj.options) {
                        if (descObj.options.minzoom != null) {
                            var minzoom = descObj.options.minzoom;
                        }else{
                            minzoom = layer.minzoom;
                        }
                        if (descObj.options.maxzoom != null) {
                            var maxzoom = descObj.options.maxzoom;
                        }else{
                            maxzoom = layer.maxzoom;
                        }
                    }
                    layer.maxDistance = this.map3dData.getDistanceByLevel(minzoom);
                    layer.minDistance = this.map3dData.getDistanceByLevel(maxzoom);
                    var objectSource = new GWTK.gEngine.Scene.VectorDataWFSSource(layer, descObj);
                    this._layerList.push(new GWTK.gEngine.Scene.VectorDataLayer(this.map3dData.getMapState(), objectSource));
                }
            }
            
            
        },
        
        toggleLightSource() {
            const lightSourcePlugin = this._pluginList.find(item => item.toolname === 'lightsource3d');
            if (lightSourcePlugin) {
                
                const lightSourceResult = lightSourcePlugin._toggleHandler_new();
                
                const param3d = this.map.workspaceManager.getValue(VIEW_SETTINGS_PARAMS3D);
                this.map.workspaceManager.setValue(VIEW_SETTINGS_PARAMS3D, {
                    active: param3d.active,
                    incline: param3d.incline,
                    rotate: param3d.rotate,
                    viewMode: param3d.viewMode,
                    lightSource: lightSourceResult ? LightSource.Projector : LightSource.Sun
                });
                
            }
            
        },
        
        toggleViewMode() {
            this._sceneState.toggleViewMode();
            
            const param3d = this.map.workspaceManager.getValue(VIEW_SETTINGS_PARAMS3D);
            this.map.workspaceManager.setValue(VIEW_SETTINGS_PARAMS3D, {
                active: param3d.active,
                incline: param3d.incline,
                rotate: param3d.rotate,
                viewMode: this._sceneState.wireFrameMode ? ViewMode.Skeleton : ViewMode.Full,
                lightSource: param3d.lightSource
            });
            
        },
        
        _writeProtocol: function(e) {
            GWTK.mapWriteProtocolMessage(this.map, { 'text': e.text, 'display': e.displayFlag });
        },
        /**
         * Добавить слой 3D тайлов
         * @method _addTiles3dLayer
         * @private
         * @param options {object} Описание слоя 3D тайлов
         */
        _addTiles3dLayer: function(options) {
            var modelExistance = false;
            for (var i = 0; i < this._layerList.length; i++) {
                var layer = this._layerList[i];
                if (layer instanceof GWTK.gEngine.Scene.Tile3dLayer) {
                    if (layer.getModelId() === options.id) {
                        modelExistance = true;
                        break;
                    }
                }
            }
            if (!modelExistance) {
                var tiles3dSource = new GWTK.gEngine.Scene.Tile3dSource(options);
                var container = new GWTK.gEngine.Scene.Tiles3DcomponentUI(this.map3dData, options, {
                    'id': 'sqlLayers',
                    'text': this.map.translate("3D tile layers")
                });
                var layer3d = new GWTK.gEngine.Scene.Tile3dLayer(this.map3dData.getMapState(), tiles3dSource, container);
                this._layerList.push(layer3d);
                this._modelNumber++;
            }
        },
        /**
         * Опубликовать слой 3D тайлов на сервере
         * @method _publicate3dLayer
         * @private
         * @param description {object} Описание слоя из семантик объектов
         */
        _publicate3dLayer: function(description) {
            var prefix = description.serviceUrl + '_!_' + description.layerId + '_!_';
            var that = this;
            for (var i = 0; i < description.modelList.length; i++) {
                var modelPath = description.modelList[i];
                var modelResponseName = prefix + modelPath;
                if (!GWTK.gEngine.ResourceMap.isAssetLoaded(modelResponseName)) {
                    
                    GWTK.gEngine.Mediator.publish("requestServiceVersion", {
                        serviceUrl: description.serviceUrl,
                        handler: (function(modelResponseName, modelPath) {
                            return function(version) {
                                if (version > 130400) {
                                    var alias = that.map3dData.getLayerDescriptionByIdLayer(description.layerId).alias;
                                    var queryString = description.serviceUrl + '?Restmethod=Publicate3DLayer&Layer=' + description.layerId + '&FileName=' + encodeURIComponent(modelPath) + '&LAYERNAME=' + encodeURIComponent(alias);
                                    GWTK.gEngine.TextFileLoader.loadTextFile(queryString, 0, that._modelLoadHandler, modelResponseName);
                                }
                            }
                        })(modelResponseName, modelPath)
                    });
                    
                    
                }
            }
        },
        /**
         * Обновить описание слоя 3D тайлов в ресурсах
         * @method _updateResource
         * @private
         * @param rName {string} Название ресурса
         */
        _updateResource: function(rName) {
            var xml = GWTK.gEngine.ResourceMap.retrieveAsset(rName);
            if (xml !== null) {
                if (xml.getElementsByTagName("RestMethod").length > 0) {
                    var restMethod = xml.getElementsByTagName("RestMethod")[0];
                    var layerList = restMethod.getElementsByTagName("LayerList")[0];
                    var newLayer = layerList.getElementsByTagName("NewLayer")[0];
                    var layerId = newLayer.getAttribute("ID");
                    var layerName = newLayer.getAttribute("Name");
                }else if (xml.getElementsByTagName("methodResponse").length > 0) {
                    var methodResponse = xml.getElementsByTagName("methodResponse")[0];
                    var params = methodResponse.getElementsByTagName("params")[0];
                    var param = params.getElementsByTagName("param")[0];
                    var value = param.getElementsByTagName("value")[0];
                    var struct = value.getElementsByTagName("struct")[0];
                    var member = struct.getElementsByTagName("member")[0];
                    var valueMember = member.getElementsByTagName("value")[0];
                    layerId = valueMember.getElementsByTagName("string")[0].textContent;
                    
                    member = struct.getElementsByTagName("member")[1];
                    if (member) {
                        valueMember = member.getElementsByTagName("value")[0];
                        layerName = valueMember.getElementsByTagName("string")[0].textContent;
                    }else{
                        layerName = 'NewLayerName' + Math.floor(1000 * Math.random());
                    }
                }else{
                    GWTK.gEngine.ResourceMap.forceUpdate(rName, null);
                    return;
                }
                var names = rName.split("_!_");
                var url = names[0];
                var filePath = names[2];
                var regex = /[^\\\/]+$/gm;
                var fileName = filePath.match(regex)[0];
                var modelId = GWTK.gEngine.Utils3d.makeHtmlId(rName);
                var description = {
                    "id": modelId,
                    "alias": layerName + " (" + fileName.substring(0, fileName.indexOf(".")) + ")",
                    "url": url,
                    "hidden": 0,
                    "instant": true,
                    "idLayer": layerId,
                    "mapMinZoom": this.map3dData.getMapState().getMapMinimumTileLevel(),
                    "mapMaxZoom": this.map3dData.getMapState().getMapMaximumTileLevel(),
                    "published": true
                };
                GWTK.gEngine.ResourceMap.forceUpdate(rName, description);
            }
        },
        /**
         * Обработчик ответа на публикацию от сервиса
         * @method _modelLoadHandler
         * @private
         * @param rName {string} Название ресурса
         */
        _modelLoadHandler: function(rName) {
            this._updateResource(rName);
            var description = GWTK.gEngine.ResourceMap.retrieveAsset(rName);
            if (description !== null) {
                this._addTiles3dLayer(description);
            }
        },
        
        /**
         * Обновить видимость слоев в опциях карты
         * @method updateLayerVisibilityInOptions
         * @public
         * @param event {object} Событие обновления
         */
        updateLayerVisibilityInOptions: function(event) {
            // Видимость для 3d слоя
            var maplayer = event.maplayer;
            var layers = this.map.options.layers;
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                if (layer.id === maplayer.id) {
                    layer.hidden = maplayer.visible ? 0 : 1;
                    break;
                }
            }
        },
        /**
         * Функция отображения маркера местоположения
         * @method _showPlaceMark
         * @private
         * @param e {object} Объект события
         */
        _showPlaceMark: function(e) {
            var geo = e.geo;
            var feature = {
                "type": "Feature",
                "bbox": [-180, -90, 180, 90],
                "geometry": { "type": "Point", "coordinates": [geo.lng, geo.lat] },
                "properties": {
                    "id": "mark_geolocation",
                    "code": -1,
                    "key": "GeoPlacemark",
                    "viewtype": VIEWTYPE.Template,
                    "local": LOCALE.Point,
                    "name": "",
                    "ObjImportance": ""
                }
            };
            var geoJson = new GeoJSON();
            geoJson.addFeature(feature);
            this.serviceGeolocation.requestMesh(geoJson.json);
        },
        /**
         * Функция скрытия маркера местоположения
         * @method _clearPlaceMark
         * @private
         */
        _clearPlaceMark: function() {
            this.serviceGeolocation.clearServiceObject();
        },
        /**
         * Функция отображения маркера обзора
         * @method _showViewMark
         * @private
         * @param e {Object} Объект события
         */
        _showViewMark: function(e) {
            // var process = e.process;
            var geo = e.geo;
            if (geo) {
                var feature = {
                    "type": "Feature",
                    "bbox": [-180, -90, 180, 90],
                    "geometry": { "type": "Point", "coordinates": [geo.lng, geo.lat] },
                    "properties": {
                        "id": "mark_geolocation",
                        "code": -1,
                        "key": "GeoPlacemark",
                        "viewtype": VIEWTYPE.Template,
                        "local": LOCALE.Point,
                        "name": "",
                        "ObjImportance": ""
                    }
                };
                var geoJson = new GeoJSON();
                geoJson.addFeature(feature);
                this.serviceViewMark.requestMesh(geoJson.json);
            }
        },
        /**
         * Функция скрытия маркера обзора
         * @method _clearViewMark
         * @private
         */
        _clearViewMark: function(e) {
            if (e.destroy) {
                this.serviceViewMark && this.serviceViewMark.clearServiceObject();
            }
        },
        /**
         * Завершение работы 3d карты
         * @method destroy
         * @public
         */
        destroy: function() {
            if (this._renderable) {
                this._renderable = false;
            }
            if (this.map3dData) {
                this.map3dData.destroy();
            }
            if (this._navigationButtons) {
                this._navigationButtons.destroy();
            }
            var button = $('#panel_button-3dview');
            button.off();
            button.remove();
            WorkerManager.deactivate();
            //TODO: временная не совсем адекватная мера
            $(this.map.panes.eventPane).off('visibilitychanged', this.updateLayerVisibilityInOptions);
            GWTK.gEngine.Mediator.clear();
            
            
            if (this.serviceObjectLayer) {
                this.serviceObjectLayer.destroy();
                this.serviceObjectLayer = null;
            }
            if (this.serviceGeolocation) {
                this.serviceGeolocation.destroy();
                this.serviceGeolocation = null;
            }
            if (this.serviceViewMark) {
                this.serviceViewMark.destroy();
                this.serviceViewMark = null;
            }
            for (var i = 0; i < this._layerList.length; i++) {
                this._layerList[i].destroy();
            }
            this._layerList.length = 0;
            for (i = 0; i < this._pluginList.length; i++) {
                this._pluginList[i].destroy();
            }
            this._pluginList.length = 0;
            if (this.servicePointSource) {
                this.servicePointSource.destroy();
                this.servicePointSource = null;
            }
            GWTK.gEngine.Renderer.ShaderMap.unloadAll();
            GWTK.gEngine.Renderer.TextureMap.unloadAll();
            GWTK.gEngine.Renderer.MaterialMap.unloadAll();
            GWTK.gEngine.Renderer.Context.destroy();
            GWTK.heightSourceManager.clearAll();
            this._destroyCanvas();
            this.initialized = false;
            GWTK.gEngine.Renderer.KeyBoard.clean();
            
            this._modelNumber = 1;
        },
        /**
         * Создать холст в DOM
         * @method _createCanvas
         * @private
         * @return {string} Идентификатор элемента
         */
        _createCanvas: function() {
            var windowsize = this.map.getWindowSize();
            var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
            var canvas = document.createElement("CANVAS");
            canvas.id = "3dMap_" + Date.now();
            canvas.width = windowsize[0] * realToCSSPixels;
            canvas.height = windowsize[1] * realToCSSPixels;
            canvas.style.width = windowsize[0] + "px";
            canvas.style.height = windowsize[1] + "px";
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.position = "absolute";
            canvas.style["z-index"] = 705;
            canvas.setAttribute("unselectable", "on");
            canvas.oncontextmenu = (function() {
                return false;
            });
            $(this.map.mapPane).append(canvas);
            this.canvasId = canvas.id;
            return canvas.id;
        },
        /**
         * Удалить холст из DOM
         * @method _destroyCanvas
         * @private
         */
        _destroyCanvas: function() {
            var canvas = document.getElementById(this.canvasId);
            if (canvas) {
                canvas.width = 1;
                canvas.height = 1;
                $(canvas).remove();
                this.canvasId = null;
            }
        },
        /**
         * Создать cookie 3D карты
         * @method createCookieArray
         * @public
         * @return {array} Массив cookie 3D карты
         */
        createCookieArray: function() {
            if (this._renderable) {
                var inclineAngle = parseFloat(this.map3dData.getInclineAngle().toFixed(6));
                var rotateAngle = parseFloat(this.map3dData.getRotateAngle().toFixed(6));
                
                const viewMode = this._sceneState.wireFrameMode ? ViewMode.Skeleton : ViewMode.Full;
                
                const lightSourcePlugin = this._pluginList.find(item => item.toolname === 'lightsource3d');
                const lightSourceResult = (lightSourcePlugin._getMode() === 'icon-flashlight3d') ? LightSource.Projector : LightSource.Sun;
                
                this.map.workspaceManager.setValue(VIEW_SETTINGS_PARAMS3D, {
                    active: true,
                    incline: inclineAngle,
                    rotate: rotateAngle,
                    viewMode,
                    lightSource: lightSourceResult
                });
                // Слои 3D моделей
                var ids = this.mCookieIdsArray;
                ids.length = 0;
                var layers = this._layerList;
                if (Array.isArray(layers)) {
                    for (var i = 0; i < layers.length; i++) {
                        var layer = layers[i];
                        if (layer instanceof GWTK.gEngine.Scene.Tile3dLayer && layer.getVisibility() && !layer.isPublished()) {
                            ids.push(layer.getModelId());
                        }
                    }
                }
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_VISIBLE_MODELS, ids);
                
            }else{
                this.map.workspaceManager.setValue(VIEW_SETTINGS_PARAMS3D, {
                    active: false,
                    incline: 0,
                    rotate: 0
                });
            }
            
        },
        /**
         * Создать ссылку на 3D карту
         * @method createMapLink
         * @public
         * @return {string} Строка с параметрами 3D карты
         */
        createMapLink: function() {
            var str3d = "";
            if (this._renderable) {
                var angle = this.map3dData.getInclineAngle().toFixed(6);
                str3d += "&incline=" + angle;
                angle = this.map3dData.getRotateAngle().toFixed(6);
                str3d += "&rotate=" + angle;
                // Слои 3D моделей
                var ids = this.mCookieIdsArray;
                ids.length = 0;
                var layers = this._layerList;
                if (Array.isArray(layers)) {
                    for (var i = 0; i < layers.length; i++) {
                        var layer = layers[i];
                        if (layer instanceof GWTK.gEngine.Scene.Tile3dLayer && layer.getVisibility() && !layer.isPublished()) {
                            ids.push(layer.getModelId());
                        }
                    }
                }
                if (ids.length !== 0) {
                    str3d += "&models3d=" + ids.join(",");
                }
            }
            return str3d;
        },
        /**
         * Рисование модели
         * @method _drawScene
         * @private
         * @param [now] {number} Текущее время с момента запуска
         */
        _drawScene: function(now) {
            if (this._renderable) {
                requestAnimationFrame(this._drawScene);
                if (now - this.lastUpdateTime <= 33) {
                    return;
                }
                this.timeUpdate.currentDelay = now - this.lastUpdateTime;
                this.timeUpdate.currentTime = now;
                this.timeUpdate.targetTime = now + 34;
                this.lastUpdateTime = now;
                // Расчет сцены
                GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO = window['devicePixelRatio'] || 1;
                this._updateScene(this.timeUpdate);
                var mediator = GWTK.gEngine.Mediator;
                mediator.publish('preRenderScene', this.opacityMode);
                GWTK.gEngine.Renderer.Context.clear(this._clearState);
                mediator.publish('renderBackground', this.opacityMode);
                mediator.publish('renderGeometry', this.opacityMode);
                mediator.publish('renderAlphaTest', this.transparentMode);
                mediator.publish('renderTransparent', this.transparentMode);
                mediator.publish('renderOverlay', this.opacityMode);
                
                GWTK.gEngine.Renderer.Context.unsetAll();
                if (now - this.lastCashCleaningTime > 30000) {
                    GWTK.heightSourceManager.freeMemory(this._sceneState);
                    GWTK.gEngine.Renderer.TextureMap.freeMemory();
                    this.lastCashCleaningTime = now;
                }
            }
        },
        /**
         * Обновление компонентов
         * @method _updateScene
         * @private
         * @param timeUpdate {object} Время обновления
         */
        _updateScene: function(timeUpdate) {
            GWTK.gEngine.Renderer.KeyBoard.update(timeUpdate);
            this.map3dData.updateState(timeUpdate);
            this._sceneState.update(this.map3dData);
            this._updateStateMode(timeUpdate);
            GWTK.gEngine.Mediator.publish("updateScene", timeUpdate);
            GWTK.gEngine.Mediator.publish('mapmoveEvent', timeUpdate);
        },
        /**
         * Обновление состояний
         * @method _updateStateMode
         * @private
         * @param timeUpdate {object} Время обновления
         */
        _updateStateMode: function(timeUpdate) {
            var map3dData = this.map3dData;
            var tileMatrix = map3dData.getTilematrix();
            //-------------------- Рисование слоев -----------------
            var objectsVisibility = tileMatrix >= map3dData.MINOBJECTZOOM;
            this.opacityMode.currentTime = timeUpdate.currentTime;
            this.opacityMode.currentDelay = timeUpdate.currentDelay;
            this.opacityMode.objectsVisibility = objectsVisibility;
            this.opacityMode.starsVisibility = map3dData.isStarView();
            this.opacityMode.logarithmicDepth = (tileMatrix <= map3dData.LOGARITHMIC_DEPTH_BUFFER_SCALE);
            this.opacityMode.thau = this.thau;
            if (this.opacityMode.starsVisibility) {
                this.setBackgroundColor(this.BLACKCOLOR);
            }else{
                this.setBackgroundColor(this.WHITECOLOR);
            }
            this.transparentMode.currentTime = timeUpdate.currentTime;
            this.transparentMode.currentDelay = timeUpdate.currentDelay;
            this.transparentMode.logarithmicDepth = (tileMatrix <= map3dData.LOGARITHMIC_DEPTH_BUFFER_SCALE);
            this.transparentMode.objectsVisibility = objectsVisibility;
            this.transparentMode.thau = this.thau;
        },
        /**
         * Скрыть 3d карту
         * @method _hide3d
         * @private
         */
        _hide3d: function() {
            this._renderable = false;
            if (!this.isVisible())
                return;
            this.map3dData.hide3d();
            var mediator = GWTK.gEngine.Mediator;
            // Прекратить все анимации
            mediator.publish('animationStop');
            // Восстанавливаем состояние 2D карты
            this.map3dData.setMap();
            
            // Замена инструмента рисования для выделения объектов
            if (GWTK.objectDrawing != null) {
                var selectedFeatures = this.map3dData.getSelectedObjects();
                if (selectedFeatures != null) {
                    selectedFeatures.svgDrawSelected.setDrawingMethod("2d", null);
                    selectedFeatures.svgDraw.setDrawingMethod("2d", null);
                    this.map.selectedObjects.drawSelectedObjects(true, this.map.selectedObjects.drawcurrobject);
                }
            }
          
            // Спрятать 3D тайлы в дереве
            mediator.publish('hide3d', {});
            this.map.redraw();
            
            this.map.trigger({ type: 'toggle3d', target: '3dMap', active: false });
        },
        /**
         * Отобразить 3d карту
         * @method _show3d
         * @private
         */
        _show3d: function() {
            this._renderable = true;
            this.map3dData.show3d(!this.initialized);
            // Замена инструмента рисования для выделения объектов
            if (GWTK.objectDrawing != null) {
                var selectedFeatures = this.map3dData.getSelectedObjects();
                if (!(selectedFeatures.svgDrawSelected && selectedFeatures.svgDraw)) {
                    selectedFeatures.init("2d");
                    selectedFeatures.svgDrawSelected.setDrawingMethod("3d", null);
                    selectedFeatures.svgDraw.setDrawingMethod("3d", null);
                }else{
                    selectedFeatures.svgDrawSelected.setDrawingMethod("3d", null);
                    selectedFeatures.svgDraw.setDrawingMethod("3d", null);
                }
                this.map.selectedObjects.drawSelectedObjects(true, this.map.selectedObjects.drawcurrobject);
            }
            var mediator = GWTK.gEngine.Mediator;
            mediator.publish('writeCookie', { 'movement': true });
            
            this._drawScene(performance.now());
            this.map3dData.setCoordsPane();
   
            mediator.publish('show3d', {});
            
            this.map.trigger({ type: 'toggle3d', target: '3dMap', active: true }); // !!!
        },
        /**
         * Обновить активность пользователя
         * @method _updateUserActivity
         * @private
         */
        _updateUserActivity: function() {
            this._userIsActive = true;
            this.opacityMode.userActivity = this.transparentMode.userActivity = true;
            this._resetUserActivityDebounced();
        },
        /**
         * Сбросить активность пользователя
         * @method _resetUserActivity
         * @private
         */
        _resetUserActivity: function() {
            this.opacityMode.userActivity = this.transparentMode.userActivity = false;
        },
        /**
         * Перелет между двумя точками
         * @method _flyToPoint
         * @private
         * @param center {array} Координаты текущей точки
         * @param dest {array} Координаты точки назначения
         */
        _flyToPoint: function(center, dest) {
            if (!this.freeMove) {
                this.freeMove = new GWTK.FreeMove(this.map3dData);
            }else{
                this.freeMove.reset();
            }
            this.freeMove.flyToPoint(center, dest);
        },
        /**
         * Задать цвет фона
         * @method setBackgroundColor
         * @public
         * @param newColor {Array} Цвет в формате `[1,0,0.5,1]`
         */
        setBackgroundColor: function(newColor) {
            this._clearState.color = newColor;
        },
        /**
         * Получить панель событий 3D
         * @method getEventPane3d
         * @public
         * @return {HTMLElement} DOM-элемент
         */
        getEventPane3d: function() {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            return gl && gl.canvas;
        }
    };
}
