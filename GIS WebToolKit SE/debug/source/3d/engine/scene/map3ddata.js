/****************************************** Тазин В.О. 12/03/21  ****
 *************************************** Патейчук В.К.  20/02/20 ****
 ************************************* Железнякова Ю.  12/05/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Класс параметров трехмерной модели              *
 *                                                                  *
 *******************************************************************/
'use strict';
import Trigonometry from '~/3d/engine/core/trigonometry';
import WorkerManager from '~/3d/engine/worker/workermanager';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { ProjectionCollection } from '~/3d/engine/core/geometry/projection';
import ColorMethods from '~/3d/engine/utils/colormethods';
import { MessageQueueCommand } from '~/3d/engine/worker/workerscripts/queue';
import GeoPoint from '~/geo/GeoPoint';


if (window.GWTK) {
    /**
     * Компонент 3d параметров карты
     * @class GWTK.Map3dData
     * @constructor GWTK.Map3dData
     * @param map {GWTK.Map} Экземпляр карты
     * @param camera {GWTK.gEngine.Renderer.Camera} Объект камеры
     */
    GWTK.Map3dData = function(map, camera) {
        if (!map || !map.options)
            return;
        this.map = map; //Объект карты
        
        this._mapState = new GWTK.MapState(map);
        
        this._cameraLookAtPoint = new GWTK.gEngine.Scene.CameraLookAtPoint(camera, this.getMapEllipsoid());
        
        this.DistanceFromObsForUnit = 1.0 / Math.tan(camera.getViewAngleY() * 0.5);
        
        this.layerDescriptionList = {};
        
        this.wmtsIndex = null;
        this.wmtsId = null;
        this.visibleLayers = null;
        this.geometryType = null;
        
        this.visible = false;
        
        this.buffering = false;
        
        // this.builtCenter3d = new GWTK.Center3d(this.getCRS(), this.getCenter(true));// Экземпляр для работы с центорм модели
        // Массив списков описаний объектов по картам(слоям)
        this.listDescObj = new GWTK.CollectionListDesc();
        // Объект анимации
        this.animation = new GWTK.gEngine.AnimationClass(this);
        
        // Прямоугольник видимости объектов от точки положения ориентира
        // (в метрах в системе координат карты)
        this.ObserverFrame = [[0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0]];
        
        this.mapBbox = { 'min': [], 'max': [] };
        
        this.bounObj = GWTK.latLngBounds(new GWTK.LatLng(0, 0), new GWTK.LatLng(0, 0));
        
        this.solaceLightDirection = [];
        
        this.writeCookie = GWTK.gEngine.Utils3d.debounce(this._writeCookie.bind(this), 200);
        
        // Угол наклона модели в радианах
        this.InclineAngle = 0.0;
        // Угол поворота модели в радианах
        this.RotateAngle = 0.0;
        
        this.updateLayersVisibilityDebounced = this._updateLayersVisibility.bind(this);
        this.updatePrimitiveLayersVisibilityDebounced = this._updatePrimitiveLayersVisibility.bind(this);
        this.updateLayersOpacity = this._updateLayersOpacity.bind(this);
        this.featureListClick = this._featureListClick.bind(this);
        this.layerCommandHandler = this._layerCommandHandler.bind(this);
        this.maprefreshHandler = this._maprefreshHandler.bind(this);
        this.resizeWindow = this._resizeWindow.bind(this);
        this.clearLoadingScreen = this._clearLoadingScreen.bind(this);
        
        this.updateLayerOptions = this._updateLayerOptions.bind(this);
        
        this.mButtonHandlers = {
            zoomIn: this._cameraLookAtPoint.zoomIn3d,
            zoomOut: this._cameraLookAtPoint.zoomOut3d,
            showMark: this._showPlaceMark.bind(this),
            clearMark: this._clearPlaceMark.bind(this)
        };
        
        this.mObjects3dList = [];
        this.mTile3dList = [];
        this.mTiledLayerArray = [];
        this.mSupportList = [];
        
        this._serviceVersionList = {};
        this._serviceVersionRequestList = {};
        
        this._startTimeout = null;
        
        this._initConst();
        
        this._messageQueue = WorkerManager.getWorker();
        
        this._init();
        
    };
    GWTK.Map3dData.prototype = {
        /**
         * Инициализация констант
         * @method _initConst
         * @private
         */
        _initConst: function() {
            
            this.LOADING_SCREEN_TIMEOUT = 7000;
            
            this.SCREEN_PIXEL_SIZE = 0.0254 / 96;
            // 0.000264583
            // в 1 дюйме 96 css пикселей
            
            //в 2D standardPixelSize = 0.00028;
            
            var DEG_TO_RAD = Math.PI / 180;
            
            // Радиус Земли (в метрах)
            this.EARTHRADIUS = 6378137;
            // Mаксимальный возможный угол наклона модели в радианах
            this.MAXINCLINEANGLE = 90 * DEG_TO_RAD;              //75 град., было 78.26 град.
            this.MININCLINEANGLE = 10 * DEG_TO_RAD;
            // Изменение угла наклона модели при превышении высоты
            this.DELTAINCLINEANGLE = DEG_TO_RAD;           // 1 град.
            
            this.PIXEL_PER_TILE = 256; // Стандартный размер тайла (px)
            
            this.MINOBJECTZOOM = 0;// Минимальное приближение по-умолчанию, с которого возможно отображение 3d объектов
            this.MINLAYERZOOM = 3;// Минимальное приближение, с которого возможно отображение тайловых слоев
            
            this.MAX_DISTANCE = this.getHalfHeightWinMtr() * this.getZoomScale(this._mapState.getMapMinimumTileLevel()) * this.getDistanceFromObsForUnit();
            this.MIN_DISTANCE = this.getHalfHeightWinMtr() * this.getZoomScale(this._mapState.getMapMaximumTileLevel()) * this.getDistanceFromObsForUnit();
            
            
            this.DELTANULL = 0.000000001; // Точность обработки координат при визуализации. ((double)(1e-3))
            this.DOUBLENULL = 0.000000000001; // Точность обработки координат при выполнении расчетов. ((double)(1e-12))
            
            this.MINSQUARETILEMATRIX = 11;// Минимальное приближение, с которого возможно отображение плоской 3d модели
            this.MAXSTARSSCALE = 10;// Максимальное приближение, до которого возможно отображение звезд
            this.MAXSHADOWSCALE = 4;// Максимальное приближение, до которого возможно отображение тени от Солнца
            
            this.LOGARITHMIC_DEPTH_BUFFER_SCALE = 15;
            
            //Маршруты по умолчанию GWTKSE
            this._DEFAULT_ROUTES = [
                {
                    'id': '1',
                    'alias': 'Бесконечность',
                    'url': './gwtkse/3d/freeflight1.json',
                    'enableloop': true,
                    'description': 'Маршрут по умолчанию'
                },
                {
                    'id': '2',
                    'alias': 'Окружность',
                    'url': './gwtkse/3d/freeflight2.json',
                    'enableloop': true,
                    'description': 'Маршрут по умолчанию'
                },
                {
                    'id': '3',
                    'alias': 'Вдоль экватора',
                    'url': './gwtkse/3d/freeflight3.json',
                    'enableloop': true,
                    'description': 'Маршрут по умолчанию'
                }
            ];
            
        },
        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function() {
            var coordsPane = this._mapState.getMapCoordPane();
            if (coordsPane) {
                this.coordsPane = new GWTK.CoordsPaneUI(coordsPane);
            }
            var scalePane = this._mapState.getMapScalePane();
            if (scalePane) {
                this.scalePane = new GWTK.ScalePaneUI(scalePane);
            }
            
            
            var rulerElement = document.getElementById('rulercontrol-id');
            if (rulerElement != null) {
                this.rulerPane = new GWTK.RulerPaneUI(rulerElement);
            }
            this._setTilematrix(this._mapState.getMapTileLevel());
            
            
            this._initCamera();
            
            this.resizeWindow();
            
            this.setTurnModel(this._mapState.getMapInclineAngle(), this._mapState.getMapRotateAngle());
            
            this.updateLayerDescriptionList();
            
            // this.updateVisibleLayers();
            
            // this._fillObjects3dList();
            
            var requestOptions = this._mapState.getRequestOptions();
            if (requestOptions !== null) {
                GWTK.RequestServices.createNew(requestOptions, 'REST', true);
                // WorkerManager.getRequestQueue().setOptions(requestOptions);
                GWTK.gEngine.TextFileLoader.setOptions(requestOptions);
                this._messageQueue.post(this._messageQueue.createMessageData(Date.now() + Math.random(), {
                    httpParams: requestOptions,
                    command: MessageQueueCommand.updateSettings
                }, 0, GWTK.gEngine.GLOBAL_LIVETIME));
            }
            
            this._$mapEventPane = $(this._mapState.getMapEventPane());
            
            this._initHandlers();
            
            
            // this._requestQueue = WorkerManager.getRequestQueue();
            
            // this.ObserverBboxPix = [0, 0, 0, 0];
        },
        /**
         * Инициализация камеры
         * @method _init
         * @private
         */
        _initCamera: function() {
            var center = this.getCenter(true);
            var curPoint = Trigonometry.toRadians(new Geodetic3D(center.lng, center.lat, 0));
            this._cameraLookAtPoint.setGeoCenterPoint(curPoint);
            var distance = this.getDistanceByLevel(this.getTilematrix());
            this.setDistanceFromObs(distance);
        },
        /**
         * Инициализация обработчиков
         * @method _initHandlers
         * @private
         */
        _initHandlers: function() {
            var mediator = GWTK.gEngine.Mediator;
            
            mediator.subscribe('requestServiceVersion', this._sendServiceVersionRequest.bind(this));
            
            mediator.subscribe('clearLoadingScreen', this.clearLoadingScreen);
            mediator.subscribe('changeCameraView', this._updateCameraTurnModel.bind(this));
            mediator.subscribe('writeCookie', this.writeCookie);
            mediator.subscribe('cursorPoint', this.setCoordsPane.bind(this));
            mediator.subscribe('cameraDistance', function(e) {
                if (e.distance !== null) {
                    var distance = e.distance;
                }else if (e.range !== null) {
                    distance = e.range / Math.cos(this.getGeoCenter().getLatitude());
                }
                
                this.setDistanceFromObs(distance);
            }.bind(this));
            
            mediator.publish('mouseEventSubscription', {
                type: 'leftclick',
                handler: function(event) {
                    this._mapState.getFeatureInfoInPoint(event.data.geo, this.getTilematrix());
                }.bind(this)
            });
            mediator.publish('mouseEventSubscription', {
                type: 'leftclick',
                handler: function(event) {
                    var tool = this._mapState.getMapTool('transitionToPoint');
                    if (tool !== null && tool.mode) {
                        var geo = Trigonometry.toDegrees(event.data.geo);
                        var point = [geo.getLatitude(), geo.getLongitude()];
                        tool.saveSelectedCoords({ 'type': 'mapclick', 'point': null, 'coord': null, 'geo': point });
                    }
                }.bind(this)
            });
            
            var eventPane = this.getEventPane();
            eventPane.on('maprefresh', this.maprefreshHandler);
            eventPane.on('layercommand', this.layerCommandHandler);
            eventPane.on('visibilitychanged', this.updateLayersVisibilityDebounced);
            eventPane.on('primitivevisibilitychanged', this.updatePrimitiveLayersVisibilityDebounced);
            eventPane.on('layercommand', this.updateLayersOpacity);
            eventPane.on('featurelistclick', this.featureListClick);
            eventPane.on('refreshmap', this.updateLayerOptions);
            
            
            $(window).on('resize', this.resizeWindow);//Обработчик изменения размеров окна
            
        },
        /**
         * Удаление обработчиков
         * @method destroy
         * @public
         */
        destroy: function() {
            var eventPane = this.getEventPane();
            eventPane.off('maprefresh', this.maprefreshHandler);
            eventPane.off('layercommand', this.layerCommandHandler);
            eventPane.off('visibilitychanged', this.updateLayersVisibilityDebounced);
            eventPane.off('primitivevisibilitychanged', this.updatePrimitiveLayersVisibilityDebounced);
            eventPane.off('layercommand', this.updateLayersOpacity);
            eventPane.off('featurelistclick', this.featureListClick);
            eventPane.off('refreshmap', this.updateLayerOptions);
            
            $(window).off('resize', this.resizeWindow);//Обработчик изменения размеров окна
            
            this._cameraLookAtPoint.setMouseEnable(false);
        },
        /**
         * Скрыть режим 3D
         * @method hide3d
         * @public
         */
        hide3d: function() {
            this.visible = false;
            this._mapState.unsetMapButtonHandlers(this.mButtonHandlers);
            this.setTurnModel(null, -this.getRotateAngle());
            
            $(GWTK.gEngine.Renderer.Context.getGL().canvas).hide();
            
        },
        /**
         * Отобразить режим 3D
         * @method show3d
         * @public
         */
        show3d: function(firstStart) {
            this.visible = true;
            this._mapState.setMapButtonHandlers(this.mButtonHandlers);
            if (firstStart === true) {
                $(GWTK.gEngine.Renderer.Context.getGL().canvas).hide();
            }else{
                $(GWTK.gEngine.Renderer.Context.getGL().canvas).show();
                this.map.redrawAndWmsLock(true);
            }
            
            var timeOut = this.LOADING_SCREEN_TIMEOUT;
            this._startTimeout = setTimeout(function() {
                GWTK.gEngine.Mediator.publish('clearLoadingScreen');
            }, timeOut);
            
        },
        /**
         * Сбросить загрузочный экран
         * @method _clearLoadingScreen
         * @private
         */
        _clearLoadingScreen: function() {
            if (this._startTimeout !== null) {
                window.clearTimeout(this._startTimeout);
                $(GWTK.gEngine.Renderer.Context.getGL().canvas).show();
                // обновить рисунок карты, скрыть wms-изображение
                this.map.redrawAndWmsLock(true);
                this._startTimeout = null;
                window.setTimeout(function() {
                    GWTK.gEngine.Mediator.unsubscribe('clearLoadingScreen', this.clearLoadingScreen);
                }.bind(this), 0);
                
            }
        },
        /**
         * Обновить размеры окна
         * @method _resizeWindow
         * @private
         */
        _resizeWindow: function() {
            var windowsize = this._mapState.getWindowSize();
            var canvas = GWTK.gEngine.Renderer.Context.getGL().canvas;
            var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
            canvas.width = windowsize[0] * realToCSSPixels;
            canvas.height = windowsize[1] * realToCSSPixels;
            
            canvas.style.width = windowsize[0] + 'px';
            canvas.style.height = windowsize[1] + 'px';
            
            // Изменение размеров и проекции поля 3D-рисования
            this._resizeProjection(canvas.width, canvas.height);
        },
        /**
         * Изменение размеров и проекции поля 3D-рисования
         * @method _resizeProjection
         * @private
         * @param width {Number} Ширина окна рисования в пикселах
         * @param height {Number} Высота окна рисования в пикселах
         */
        _resizeProjection: function(width, height) {
            if (width !== 0 && height !== 0) {
                this._cameraLookAtPoint.getCamera().setAspectRatio(width / height);
                this._cameraLookAtPoint.updateParametersFromCamera();
                
                GWTK.gEngine.Renderer.Context.setViewPort([0, 0, width, height]);
            }
        },
        /**
         * Обработчик для обновления параметров слоев
         * @method _updateLayerOptions
         * @private
         */
        _updateLayerOptions: function() {
            var layerDescriptionList = this.getLayerDescriptionList();
            var viewOrder = this._mapState.getViewOrder();
            for (var i = 0; i < viewOrder.length; i++) {
                var layerId = viewOrder[i];
                var layerDescription = layerDescriptionList[layerId];
                if (layerDescription) {
                    layerDescription.zIndex = i;
                }
            }
        },
        /**
         * Обработчик события обновления карты
         * @method _maprefreshHandler
         * @private
         */
        _maprefreshHandler: function() {
            this.updateLayerDescriptionList();
            // this.updateVisibleLayers();
            GWTK.gEngine.Mediator.publish('maprefresh');
        },
        /**
         * Обработчик команды для слоя
         * @method _layerCommandHandler
         * @private
         * @param e {object} Событие
         */
        _layerCommandHandler: function(e) {
            GWTK.gEngine.Mediator.publish('layercommand', e);
        },
        /**
         * Обработчик для обновления видимости слоев
         * @method _updatePrimitiveLayersVisibility
         * @private
         * @param event {object} Событие
         */
        _updatePrimitiveLayersVisibility: function(event) {
            // Видимость для 3d слоя
            var layer = event.maplayer;
            if (layer) {
                this.getEventPane().trigger({
                    type: 'visibilitychanged',
                    maplayer: { 'id': layer.id, 'visible': layer.visible }
                });
            }
        },
        /**
         * Обработчик для обновления прозрачности слоев
         * @method _updateLayersOpacity
         * @private
         * @param event {object} Событие
         */
        _updateLayersOpacity: function(event) {
            // Видимость для 3d слоя
            var layer = event.maplayer;
            if (layer && layer.act === 'opacitychanged') {
                GWTK.gEngine.Mediator.publish('changeLayerOpacity', {
                    id: layer.id,
                    value: layer.value / 100.0
                });
            }
        },
        /**
         * Обработчик выбора объекта в списке
         * @method _featureListClick
         * @private
         */
        _featureListClick: function() {
            var dest = this.getCenter();
            dest = [dest.x, dest.y, 0];
            GWTK.gEngine.Mediator.publish('moveToPoint', { point: dest });
            // $(this._mapState.getMapEventPane()).trigger({ type: 'featurelistclick', layer: mapObject.maplayerid, gid: gid });
        },
        /**
         * Обработчик обновления карты
         * @method _overlayfunc
         * @private
         * @param e {object} Событие
         */
        _overlayfunc: function(e) {
            if (this.visible) {
                $('#' + this.map.divID + '_overlayPane').css('display', 'none');
            }
            
            if ($('#panel_button-3dview').hasClass('control-button-active')) {
                if (e.cmd === 'zoom') {
                    // this._refreshZoom();
                }else if (e.cmd === 'transittopoint') {
                    var dest = this.getCenter();
                    dest = [dest.x, dest.y, 0];
                    GWTK.gEngine.Mediator.publish('moveToPoint', { point: dest });
                }
            }
        },
        
        /**
         * Обработчик для обновления видимости слоев
         * @method _updateLayersVisibility
         * @private
         * @param event {Object} Событие
         */
        _updateLayersVisibility: function(event) {
            // Видимость для 3d слоя
            var layer = event.maplayer;
            if (layer) {
                GWTK.gEngine.Mediator.publish('changeLayerVisibility', {
                    id: layer.id,
                    visible: layer.visible
                });
            }
            
            GWTK.gEngine.Mediator.publish('writeCookie');
        },
        
        /**
         * Получить панель событий
         * @method getEventPane
         * @public
         * @return {object} Панель событий
         */
        getEventPane: function() {
            return this._$mapEventPane;
        },
        /**
         * Обновить состояние параметров карты
         * @method updateState
         * @public
         * @param timeUpdate {object} Время обновления
         */
        updateState: function(timeUpdate) {
            var requestOptions = this._mapState.getRequestOptions();
            if (requestOptions !== null) {
                GWTK.RequestServices.createNew(requestOptions, 'REST', true);
                // WorkerManager.getRequestQueue().setOptions(requestOptions);
                GWTK.gEngine.TextFileLoader.setOptions(requestOptions);
                this._messageQueue.post(this._messageQueue.createMessageData(Date.now() + Math.random(), {
                    httpParams: requestOptions,
                    command: MessageQueueCommand.updateSettings
                }, 0, GWTK.gEngine.GLOBAL_LIVETIME));
            }
            
            this._cameraLookAtPoint.update(timeUpdate);
            
            this._updateCameraFrustumVolume();
            
            this._updateTilematrix();
            
            if (this.coordsPane) {
                this.coordsPane.update();
            }
            if (this.scalePane) {
                this.scalePane.update();
            }
            
            if (this.rulerPane) {
                // this._updateRuler();
                this.rulerPane.update();
            }else{
                var rulerElement = document.getElementById('rulercontrol-id');
                if (rulerElement != null) {
                    this.rulerPane = new GWTK.RulerPaneUI(rulerElement);
                }
            }
        },
        /**
         * Обновить плоскости отсечения камеры
         * @method _updateCameraFrustumVolume
         * @private
         */
        _updateCameraFrustumVolume: function() {
            var camera = this._cameraLookAtPoint.getCamera();
            
            var farDistance = this.getFarDistance();
            camera.perspectiveNearPlane = Math.max(farDistance / 1000, 1);
            camera.perspectiveFarPlane = farDistance;
            camera.updateFrustumVolume();
        },
        /**
         * Установить состояние карты
         * @method setMap
         * @public
         */
        setMap: function() {
            this._updateMapTilematrix();
            this._updateCenter();
            this._mapState.setMapView();
        },
        /**
         * Обновить Cookies
         * @method _writeCookie
         * @private
         * @param e {object} Событие
         */
        _writeCookie: function(e) {
            this._updateMapTilematrix();
            if (e && e.movement === true) {
                this._updateCenter();
            }
            this._mapState.writeMapCookie();
        },
        /**
         * Обновить уровень матрицы тайлов карты
         * @method _updateMapTilematrix
         * @private
         */
        _updateMapTilematrix: function() {
            this._mapState.setMapTileLevel(this.getTilematrix());
        },
        /**
         * Обновить положение центра отображаемого фрагмента карты
         * @method _updateCenter
         * @private
         */
        _updateCenter: function() {
            this._mapState.setMapCenter(this._cameraLookAtPoint.getGeoCenterPoint());
        },
        /**
         * Получить положение центра отображаемого фрагмента двухмерной карты
         * @method getCenter
         * @public
         * @param [geo] {boolean} Если `true`, вернет геодезические координаты, иначе вернет mapcenter
         * @param [heightFlag] {boolean} Если `true`, вернет геодезические координаты с обновленной высотой
         * @return {object} Координаты центра
         */
        getCenter: function(geo, heightFlag) {
            if (geo) {
                return this._mapState.getMapGeoCenter(heightFlag);
            }else{
                return this._mapState.getMapCenter();
            }
        },
        /**
         * Получить объект состояния карты
         * @method getMapState
         * @public
         * @return {GWTK.MapState} Объект состояния карты
         */
        getMapState: function() {
            return this._mapState;
        },
        /**
         * Получить проекцию карты
         * @method getMapProjection
         * @public
         * @return {GWTK.gEngine.Core.Projection} Проекция карты
         */
        getMapProjection: function() {
            return this._mapState.getMapProjection();
        },
        /**
         * Получить эллипсоид карты
         * @method getMapEllipsoid
         * @public
         * @return {GWTK.gEngine.Core.Ellipsoid} Эллипсоид
         */
        getMapEllipsoid: function() {
            return this._mapState.getMapProjection().getGlobeShape();
        },
        /**
         * Установить параметры карты
         * @method set3dMap
         * @public
         */
        set3dMap: function() {
            var tilematrix = this._mapState.getMapTileLevel();
            this._setTilematrix(tilematrix);
            var centerGeo = this.getCenter(true);
            var curPoint = Trigonometry.toRadians(new Geodetic3D(centerGeo.lng, centerGeo.lat, 0));
            this._cameraLookAtPoint.setGeoCenterPoint(curPoint);
            var distance1 = this.getHalfHeightWinMtr() * this.getZoomScale(this.getTilematrix()) * this.getDistanceFromObsForUnit();
            this.setDistanceFromObs(distance1);
        },
        /**
         * Обновить наклон и поворот камеры
         * @method _updateCameraTurnModel
         * @private
         * @param e {Object} Событие вращения
         */
        _updateCameraTurnModel: function(e) {
            this.setTurnModel(e.deltaInclineAngle, e.deltaRotateAngle);
        },
        /**
         * Обновить уровень масштаба карты
         * @method _updateTilematrix
         * @private
         */
        _updateTilematrix: function() {
            var scaleCur = this.getDistanceFromObs() / (this.getHalfHeightWinMtr() * this.getDistanceFromObsForUnit());
            
            if (this.scalePane) {
                this.scalePane.setValue(scaleCur);
            }
            
            var minzoom = this._mapState.getMapMinimumTileLevel();
            var maxzoom = this._mapState.getMapMaximumTileLevel();
            
            var newTm = minzoom;
            for (var i = maxzoom; i >= minzoom; i--) {
                var scale = this.getZoomScale(i);
                var delta = scale - scaleCur;
                if (delta > 0) {
                    newTm = i + 1;
                    break;
                }
            }
            this._setTilematrix(newTm);
        },
        
        /**
         * Обновить центр карты в геодезических координатах
         * @method getGeoCenter
         * @public
         * @return {Geodetic3D} Геодезические координаты точки наблюжения
         */
        getGeoCenter: function() {
            return this._cameraLookAtPoint.getGeoCenterPoint();
        },
        /**
         * Получить текущий центр карты в прямоугольных координатах
         * @method getTargetPosition
         * @public
         * @return {array} Центр карты [y, x, h]
         */
        getTargetPosition: function() {
            var projection = this.getMapProjection();
            return projection.geo2xy(this.getGeoCenter());
        },
        /**
         * Получить маршруты полета по умолчанию
         * @method getDefaultFlightRoutes
         * @public
         * @return {array} Массив маршрутов по умолчанию
         */
        getDefaultFlightRoutes: function() {
            var routes = this._DEFAULT_ROUTES;
            if (Array.isArray(this._mapState.getMapFlightRotes())) {
                routes = routes.concat(this._mapState.getMapFlightRotes());
            }
            return routes;
        },
        
        /**
         * Получить список сценариев движущихся объектов
         * @method getScenarioList
         * @public
         * @return {array} Массив сценариев по умолчанию
         */
        getScenarioList: function() {
            var scenarios = [];
            if (Array.isArray(this.map.options.scenario3d)) {
                scenarios = this.map.options.scenario3d;
            }
            return scenarios;
        },
        /**
         * Получить URL сервиса
         * @method getServiceURL
         * @public
         * @return {String} URL сервиса
         */
        getServiceURL: function() {
            return this._mapState.getMapServiceURL();
        },
        /**
         * Получить массив описаний шаблонов 3D карты
         * @method _getObject3dTemplates
         * @private
         * @return {array} Массив описаний шаблонов 3D карты
         */
        _getObject3dTemplates: function() {
            var objlist = this.mObjects3dList;
            objlist.length = 0;
            var objects3d = this._mapState.getMapOptionsFor3d();
            if (Array.isArray(objects3d)) {
                for (var i = 0; i < objects3d.length; i++) {
                    if (objects3d[i].hasOwnProperty('obj') && objects3d[i].hasOwnProperty('id')) {
                        var layerDescriptionList = this.getLayerDescriptionList();
                        if (layerDescriptionList.hasOwnProperty(objects3d[i]['id'])) {
                            objlist.push(objects3d[i]);
                        }
                    }
                }
            }
            return objlist;
        },
        /**
         * Получить массив описаний моделей 3d тайлов
         * @method getModels3dDescription
         * @public
         * @return {array} Массив описаний моделей 3d тайлов
         */
        getModels3dDescription: function() {
            var tilelist = this.mTile3dList;
            tilelist.length = 0;
            var objects3d = this._mapState.getMapOptionsFor3d();
            if (Array.isArray(objects3d)) {
                for (var i = 0, objects3dItem; (objects3dItem = objects3d[i]); i++) {
                    if (objects3dItem.hasOwnProperty('url') && objects3dItem.hasOwnProperty('id')) {
                        objects3dItem.id = objects3dItem['id'].replace(/[#_:/.]/g, '');
                        objects3dItem.mapMaxZoom = this.getMapState().getMapMaximumTileLevel();
                        objects3dItem.mapMinZoom = this.getMapState().getMapMinimumTileLevel();
                        tilelist.push(objects3dItem);
                    }
                }
            }
            return tilelist;
        },
        /**
         * Установить уровень матрицы тайлов
         * @method _setTilematrix
         * @param tilematrix {number} Уровень матрицы тайлов
         * @private
         */
        _setTilematrix: function(tilematrix) {
            if (!isNaN(tilematrix)) {
                tilematrix = this._mapState.zoomLimit(tilematrix);
                if (tilematrix !== this.tilematrix) {
                    this.tilematrix = tilematrix;
                    this._updateMapTilematrix();
                    // this.updateVisibleLayers();
                    GWTK.gEngine.Mediator.publish('zoomEvent', { 'tilematrix': tilematrix });
                    GWTK.gEngine.Mediator.publish('writeCookie');
                }
            }
        },
        /**
         * Получить уровень матрицы тайлов
         * @method getTilematrix
         * @public
         * @return {int} Уровень матрицы тайлов
         */
        getTilematrix: function() {
            return this.tilematrix;
        },
        /**
         * Получить текущий масштаб отображения карты
         * @method getCurrentScale
         * @public
         * @return {number} Масштаб карты
         */
        getCurrentScale: function() {
            return this.getDistanceFromObs() / (this.getHalfHeightWinMtr() * this.getDistanceFromObsForUnit());
        },
        /**
         * Обновить линейку масштаба
         * @method _updateRuler
         * @private
         */
        _updateRuler: function() {
            var bounObj = this._getMapGeoBounds();
            var centerLat = bounObj.getCenter().lat;
            var halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180);
            var dist = halfWorldMeters * (bounObj.getNorthEast().lng - bounObj.getSouthWest().lng) / 180;
            var size = this._mapState.getWindowSize();
            
            var MAX = 100;
            var maxMeters = 0;
            if (size[0] > 0) {
                maxMeters = dist * (MAX / size[0]);
            }
            
            if (maxMeters) {
                var pow10 = Math.pow(10, (Math.floor(maxMeters) + '').length - 1),
                    d = maxMeters / pow10;
                d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;
                var meters = pow10 * d;
                this.rulerPane.setValue(meters, MAX, maxMeters);
            }
        },
        /**
         * Запросить географические габариты текущего окна карты
         * @method _getMapGeoBounds
         * @private
         * @return {Object} { "SW": [lat, lng], "NE": [lat, lng]}, географические координаты углов окна
         */
        // ===============================================================
        _getMapGeoBounds: function(expanded) {
            var pBounds = this._getMapBBox();
            var min = GWTK.projection.xy2geo('' + this.getCRS(), pBounds.min[1], pBounds.min[0]);
            var max = GWTK.projection.xy2geo('' + this.getCRS(), pBounds.max[1], pBounds.max[0]);
            var latDelta = 0;
            var lngDelta = 0;
            var mobile = false;
            if (expanded) {
                latDelta = mobile ? 0 : Math.abs(min[0] - max[0]);
                lngDelta = mobile ? 0 : Math.abs(min[1] - max[1]);
                
            }
            var bounObj = this.bounObj;
            
            bounObj._southWest.lat = min[0] - latDelta;
            bounObj._southWest.lng = min[1] - lngDelta;
            
            bounObj._northEast.lat = max[0] + latDelta;
            bounObj._northEast.lng = max[1] + lngDelta;
            
            return bounObj;
        },
        
        /**
         * Запросить габариты текущего окна карты (BBox)
         * @method _getMapBBox
         * @private
         * @return {Object} { "min": [x, y], "max": [x, y]}, прямоугольные координаты углов
         */
        // ===============================================================
        _getMapBBox: function() {
            var projection = this.getMapProjection();
            var matrixMinX = projection.getTopLeft().y,                                     // hor min of matrix
                matrixMaxX = Math.abs(matrixMinX);
            
            var scale = this.getCurrentScale();
            
            var pixelSpan = this._mapState.getPixelSpan(scale);
            var size = this._mapState.getWindowSize();
            
            var w = size[0] * pixelSpan / 2,
                h = size[1] * pixelSpan / 2;
            
            var curPoint = this._cameraLookAtPoint.getCenterPoint();
            
            var mapcenter = projection.geo2xy(projection.getGlobeShape().toGeodetic3d(curPoint));
            
            var bbox = this.mapBbox;
            
            if (this.getCRS() === 3857 || this.getCRS() === 3395) {
                // выдаем (hor,vert)
                bbox.min[0] = mapcenter[1] - w;
                bbox.min[1] = mapcenter[0] - h;
                bbox.max[0] = mapcenter[1] + w;
                bbox.max[1] = mapcenter[0] + h;
                if (bbox.max[0] > matrixMaxX) {
                    bbox.max[0] = (bbox.max[0] - matrixMaxX) + matrixMinX;
                }
                if (bbox.min[0] < matrixMinX) {
                    bbox.min[0] = (bbox.min[0] - matrixMinX) + matrixMaxX;
                }
                if (bbox.max[0] < bbox.min[0]) {
                    var d = bbox.min[0];
                    bbox.min[0] = bbox.max[0];
                    bbox.max[0] = d;
                }
                
                
            }else{
                // для MILLER выдаем (vert,hor)
                bbox.min[0] = mapcenter[0] - h;
                bbox.min[1] = mapcenter[1] - w;
                bbox.max[0] = mapcenter[0] + h;
                bbox.max[1] = mapcenter[1] + w;
                
                if (bbox.max[1] > matrixMaxX) {
                    bbox.max[1] = matrixMaxX - bbox.max[1];
                }
                if (bbox.min[1] < matrixMinX) {
                    bbox.min[1] = matrixMinX + Math.abs(bbox.min[1]);
                }
            }
            
            return bbox;
        },
        /**
         * Получить масштаб отображения карты для уровня матрицы тайлов
         * @method getZoomScale
         * @param tilematrix {Number} Уровень матрицы тайлов
         * @public
         * @return {int} Масштаб карты
         */
        getZoomScale: function(tilematrix) {
            return this._mapState.getZoomScale(tilematrix);
        },
        /**
         * Получить проекцию карты
         * @method getCRS
         * @public
         * @return {number} Проекция карты
         */
        getCRS: function() {
            return this._mapState.getMapCrs();
        },
        
        /**
         * Получить массив источников тайлов
         * @method getTiledLayersArray
         * @public
         * @return {Array} Массив источников тайлов
         */
        getTiledLayersArray: function() {
            var layerDescriptionList = this.getLayerDescriptionList(),
                tiledLayerArray = this.mTiledLayerArray;
            tiledLayerArray.length = 0;
            // Если не прочитался список источников - выход из функции
            if (layerDescriptionList) {
                // Если в списке есть источники получаем их
                for (var id in layerDescriptionList) {
                    var currentLayerDescription = layerDescriptionList[id];
                    if (currentLayerDescription.isTiled) {
                        tiledLayerArray.push(currentLayerDescription);
                    }
                }
            }
            return tiledLayerArray;
        },
        /**
         * Получить описание слоя матрицы высот
         * @method getWCSdescription
         * @public
         * @return {String} URL адрес матрицы высот
         */
        getWCSdescription: function() {
            var xWmsList = this._mapState.getMapMatrixes(),
                wcsDescription;
            if (xWmsList && xWmsList.length > 0) {
                //жестко задано
                wcsDescription = xWmsList[0];
            }
            return wcsDescription;
        },
        /**
         * Получить версию сервиса
         * @method getServiceVersion
         * @public
         * @param serviceUrl {serviceUrl} URL адрес сервиса
         * @param [callback] {function} Обработчик
         * @return {number|undefined} Версия сервиса
         */
        getServiceVersion: function(serviceUrl, callback) {
            var initRequest = false;
            if (typeof callback === 'function') {
                if (!Array.isArray(this._serviceVersionRequestList[serviceUrl])) {
                    this._serviceVersionRequestList[serviceUrl] = [];
                    initRequest = true;
                }
                this._serviceVersionRequestList[serviceUrl].push(callback);
            }
            
            if (this._serviceVersionList[serviceUrl] === undefined) {
                if (initRequest) {
                    this._requestServiceVersion(serviceUrl);
                }
            }else if (typeof callback === 'function') {
                this._checkServiceVersionRequestQueue(serviceUrl);
            }
            return this._serviceVersionList[serviceUrl];
        },
        
        /**
         * Проверить очередь обработчиков ответа версии сервиса
         * @method _checkServiceVersionRequestQueue
         * @private
         * @param serviceUrl {serviceUrl} URL адрес сервиса
         */
        _checkServiceVersionRequestQueue: function(serviceUrl) {
            var handlerList = this._serviceVersionRequestList[serviceUrl];
            var versionValue = this._serviceVersionList[serviceUrl];
            while (handlerList.length > 0) {
                handlerList.pop()(versionValue);
            }
        },
        
        /**
         * Отправить запрос версии сервиса
         * @method _sendServiceVersionRequest
         * @private
         * @param requestParams {object} Параметры запроса
         */
        _sendServiceVersionRequest: function(requestParams) {
            this.getServiceVersion(requestParams.serviceUrl, requestParams.handler);
        },
        
        /**
         * Запросить версию сервиса
         * @method _requestServiceVersion
         * @private
         * @param serviceUrl {serviceUrl} URL адрес сервиса
         */
        _requestServiceVersion: function(serviceUrl) {
            var requestParams = {};
            requestParams['method'] = 'GET';
            requestParams['src'] = serviceUrl + '?RESTMETHOD=GETVERSION';
            requestParams['sync'] = false;
            requestParams['responseType'] = 'text';
            
            // var requestData = this._requestQueue.createRequestData('serviceVersionRequest_' + Math.random(), {requestParams: requestParams}, 0, GWTK.gEngine.GLOBAL_LIVETIME);
            //
            // this._requestQueue.post(function (response) {
            //     this._onServiceVersionRecieve(response.responseData, serviceUrl);
            // }.bind(this), requestData);
            
            const restService = GWTK.RequestServices.retrieveOrCreate(GWTK.RequestServices.createHttpParams(this.map), 'REST');
            var requestData = WorkerManager.getThreadRequestQueue().createMessageData("serviceVersionRequest_" + Math.random(), {
                httpParams: { url: serviceUrl },
                requestMethod: restService.getVersion.bind(restService)
            }, 0, GWTK.gEngine.GLOBAL_LIVETIME);
            
            WorkerManager.getThreadRequestQueue().post(requestData, {
                onLoad: function(response) {
                    this._onServiceVersionRecieve(response, serviceUrl)
                }.bind(this)
            });
            
        },
        /**
         * Обработчик получения версии сервиса
         * @method _onServiceVersionRecieve
         * @private
         * @param originServiceVersion {string} Версия сервиса
         * @param serviceUrl {serviceUrl} URL адрес сервиса
         */
        _onServiceVersionRecieve: function(originServiceVersion, serviceUrl) {
            if (typeof originServiceVersion === 'string') {
                this._serviceVersionList[serviceUrl] = +originServiceVersion;
            }else{
                GWTK.gEngine.Mediator.publish('writeProtocol', {
                    text: this.map.translate('Failed to get version number') + '. ' + this.map.translate('Server') + ': ' + serviceUrl,
                    displayFlag: true
                });
                this._serviceVersionList[serviceUrl] = null;
            }
            this._checkServiceVersionRequestQueue(serviceUrl);
        },
        
        /**
         * Установить угол наклона модели в радианах
         * @method _setInclineAngle
         * @param angle {number} Угол наклона модели в радианах
         * @private
         */
        _setInclineAngle: function(angle) {
            angle = Math.max(angle, this.MININCLINEANGLE);
            this.InclineAngle = angle;
            
            this._cameraLookAtPoint.setElevation(angle);
        },
        /**
         * Получить угол наклона модели в радианах
         * @method getInclineAngle
         * @public
         * @return {number} Угол наклона модели в радианах
         */
        getInclineAngle: function() {
            return this._cameraLookAtPoint.getElevation();
        },
        /**
         * Наклон модели (делаем в минус)
         * @method _setInclineModel
         * @private
         * @param deltaInclineAngle {number} Текущее приращение угла наклона (в радианах)
         */
        _setInclineModel: function(deltaInclineAngle) {
            if (isNaN(deltaInclineAngle))
                return;
            var incline = this.getInclineAngle() + deltaInclineAngle;
            
            if ((incline >= 0.0) && (incline <= this.MAXINCLINEANGLE)) {
                this._setInclineAngle(incline);
            }
        },
        /**
         * Установить угол поворота модели в радианах
         * @method _setRotateAngle
         * @param angle {number} Угол поворота модели в радианах
         * @private
         */
        _setRotateAngle: function(angle) {
            while (angle > Math.PI) {
                angle -= Math.PI * 2;
            }
            while (angle < -Math.PI) {
                angle += Math.PI * 2;
            }
            
            this.RotateAngle = angle;
            
            this._cameraLookAtPoint.setAzimuth(this.RotateAngle);
            
        },
        /**
         * Получить угол поворота модели в радианах
         * @method getRotateAngle
         * @public
         * @return {number} Угол поворота модели в радианах
         */
        getRotateAngle: function() {
            return this._cameraLookAtPoint.getAzimuth();
        },
        /**
         * Поворот модели (делаем в минус)
         * @method _setRotateModel
         * @private
         * @param deltaRotateAngle {number} Текущее приращение угла поворота (в радианах)
         */
        _setRotateModel: function(deltaRotateAngle) {
            if (isNaN(deltaRotateAngle))
                return;
            this._setRotateAngle(this.RotateAngle + deltaRotateAngle);
        },
        /**
         * Изменить угол наклона и поворота модели
         * @method setTurnModel
         * @public
         * @param deltaInclineAngle {number|null} Текущее приращение угла наклона (в радианах)
         * @param deltaRotateAngle {number|null} Текущее приращение угла поворота (в радианах)
         */
        setTurnModel: function(deltaInclineAngle, deltaRotateAngle) {
            // Наклон
            if (!isNaN(deltaInclineAngle)) {
                this._setInclineModel(deltaInclineAngle);
            }
            // Поворот
            if (!isNaN(deltaRotateAngle)) {
                this._setRotateModel(deltaRotateAngle);
                $('#rotate3d_button-center').css('transform', 'rotate3d(0, 0, 1, ' + this.getRotateAngle() + 'rad)');//Поворот компаса
            }
            
            //TODO вызвать для вращения стрелки компаса
            const map3d = this.map.mapTool("3dMap");
            if (map3d) {
                map3d.createCookieArray();
            }
            
        },
        /**
         * Получить направление света прожектора
         * @method getSearchlightDirection
         * @public
         * @return {Array} Вектор направления света
         */
        getSearchlightDirection: function(sceneState) {
            return sceneState.getCamera().getCameraVector();
        },
        /**
         * Получить расстояние от наблюдателя до центра модели в условных единицах
         * @method getDistanceFromObsForUnit
         * @public
         * @return {number} Значение расстояния от наблюдателя до центра модели в условных единицах
         */
        getDistanceFromObsForUnit: function() {
            return this.DistanceFromObsForUnit;
        },
        /**
         * Получить расстояние от наблюдателя до центра модели по уровню матрицы тайлов
         * @method getDistanceByLevel
         * @public
         * @return {number} Значение расстояния от наблюдателя до центра модели
         */
        getDistanceByLevel: function(level) {
            return this.getHalfHeightWinMtr() * this.getZoomScale(level) * this.getDistanceFromObsForUnit();
        },
        /**
         * Получить половинную высоту окна в метрах
         * @method getHalfHeightWinMtr
         * @public
         * @return {Number} Высота окна в метрах
         */
        getHalfHeightWinMtr: function() {
            // var halfScreenHeight = this._mapState.getWindowSize()[1] * 0.5;
            var halfScreenHeight = parseInt(GWTK.gEngine.Renderer.Context.getGL().canvas.style.height) * 0.5;
            return halfScreenHeight * this.SCREEN_PIXEL_SIZE;
        },
        /**
         * Получить расстояние от наблюдателя до точки наблюдения
         * @method getDistanceFromObs
         * @public
         * @return {number} Значение расстояния от наблюдателя до точки наблюдения
         */
        getDistanceFromObs: function() {
            return this._cameraLookAtPoint.getRange() / Math.cos(this.getGeoCenter().getLatitude());
        },
        /**
         * Установить расстояние от наблюдателя до центра модели
         * @method setDistanceFromObs
         * @param dist {number} Расстояние от наблюдателя до центра модели
         * @public
         */
        setDistanceFromObs: function(dist) {
            dist = Math.max(dist, this.MIN_DISTANCE);
            dist = Math.min(dist, this.MAX_DISTANCE);
            
            var center = this.getGeoCenter();
            dist *= Math.cos(center.getLatitude());
            this._cameraLookAtPoint.setRange(dist);
        },
        /**
         * Получить отобранные объекты карты
         * @method getSelectedObjects
         * @public
         * @return {GWTK.selectedFeatures} Отобранные объекты карты
         */
        getSelectedObjects: function() {
            return this._mapState.getMapSelectedObjects();
        },
        /**
         * Установить текст панели координат
         * @method setCoordsPane
         * @public
         * @param [params] {Object} JSON-объект параметров
         */
        setCoordsPane: function(params) {
            if (!this.coordsPane) {
                return;
            }
            var geo;
            var widthoutHeight;
            if (params) {
                geo = params.geo;
                widthoutHeight = params.widthoutHeight;
            }
            if (!geo) {
                geo = this.getGeoCenter();
                if (params && params.height != null) {
                    geo.setHeight(params.height);
                }
            }
            this.coordsPane.setValue(geo, widthoutHeight);
        },
        /**
         * Активно отображение звезд
         * @method isStarView
         * @public
         * @return {boolean}
         */
        isStarView: function() {
            return this.getTilematrix() <= this.MAXSTARSSCALE;
        },
        /**
         * Получить коллекцию списков описаний объектов по слоям
         * @method getListDescObj
         * @public
         * @return {GWTK.CollectionListDesc|undefined} Коллекция списков описаний объектов по слоям
         */
        getListDescObj: function() {
            var object3dTemplateArray = this._getObject3dTemplates();
            var listDescObj;
            if (object3dTemplateArray) {
                listDescObj = new GWTK.CollectionListDesc();
                for (var i = 0, object3dTemplate; (object3dTemplate = object3dTemplateArray[i]); i++) {
                    var idLayer = this.getLayerDescription(object3dTemplate['id'])['idLayer'];
                    var obj = object3dTemplate.obj;
                    var objLen = obj.length;
                    // Если нет описаний объектов, пропускаем
                    if (!idLayer || objLen === 0)
                        continue;
                    
                    var newListDesc = this.listDescObj.getListByLayerName(idLayer);
                    
                    if (!newListDesc) {
                        newListDesc = new GWTK.ListDescObjByMap(idLayer, object3dTemplate['id'], object3dTemplate.options);
                        for (var j = 0; j < objLen; j++) {                                 // 15/12/16
                            var objDesc = new GWTK.DescObj(obj[j]);
                            newListDesc.addDesc(objDesc);
                        }
                        this.listDescObj.addItem(newListDesc);
                    }
                    listDescObj.addItem(newListDesc);
                }
            }
            return listDescObj;
        },
        /**
         * Обновиление списка описаний слоев
         * @method updateLayerDescriptionList
         * @public
         */
        updateLayerDescriptionList: function() {
            var idList = this.mSupportList;
            idList.length = 0;
            var layerOptionsList = this._mapState.getMapLayerOptions();
            var mapOptions = this._mapState.getMapOptions();
            
            for (var i = 0, layerOptions; (layerOptions = layerOptionsList[i]); i++) {
                var id = layerOptions['id'];
                if (!this.layerDescriptionList.hasOwnProperty(id)) {
                    const layer = this._mapState.getMapLayerByxId(id);
                    if (!layer) {
                        continue;
                    }
                    const tileLayerOptions = layer.options;
                    this.layerDescriptionList[id] = new GWTK.LayerDescription(tileLayerOptions, mapOptions);
                }
                idList.push(id);
            }
            
            this._updateLayerOptions();
            
            for (var k in this.layerDescriptionList) {
                if (idList.indexOf(k) === -1) {
                    delete this.layerDescriptionList[k];
                }
            }
        },
        /**
         * Получить список описаний слоев
         * @method getLayerDescriptionList
         * @public
         * @return {Array} Массив описаний слоев
         */
        getLayerDescriptionList: function() {
            return this.layerDescriptionList;
        },
        /**
         * Получить описание слоя
         * @method getLayerDescription
         * @public
         * @param id {string} Идентификатор слоя
         * @return {GWTK.LayerDescription} Описание слоя
         */
        getLayerDescription: function(id) {
            return this.getLayerDescriptionList()[id];
        },
        /**
         * Получить описание слоя по идентификатору сервиса
         * @method getLayerDescription
         * @public
         * @param idLayer {string} Идентификатор слоя на сервисе
         * @return {GWTK.LayerDescription} Описание слоя
         */
        getLayerDescriptionByIdLayer: function(idLayer) {
            var result = null;
            
            for (var id in this.layerDescriptionList) {
                var layerDescription = this.layerDescriptionList[id];
                if (layerDescription.idLayer === idLayer) {
                    result = layerDescription;
                    break;
                }
            }
            return result;
        },
        /**
         * Получить расстояние до дальней плоскости отсечения
         * @method getFarDistance
         * @public
         * @return {number} Расстояние до дальней плоскости отсечения
         */
        getFarDistance: function() {
            var camera = this._cameraLookAtPoint.getCamera();
            var target = camera.getTargetGeodeticPosition(this.getMapEllipsoid());
            var alpha = camera.getViewAngleY() * 0.5;
            var elevation = Math.max(this._cameraLookAtPoint.getElevation(), alpha);
            var beta = Math.PI - elevation;
            var gamma = Math.max(Math.PI - alpha - beta, 0.075);
            var range = this._cameraLookAtPoint.getRange() + Math.abs(target.getHeight()) / Math.sin(elevation);
            if (this.isStarView()) {
                range *= 2;
            }
            
            return 1.1 * range * Math.cos(alpha) * Math.sin(beta) / Math.sin(gamma);
            
            // return Math.sqrt(Math.pow(range, 2) + 2 * radius * range * Math.cos(Math.PI / 2 - elevation));
        },
        /**
         * Функция отображения маркера местоположения
         * @method _showPlaceMark
         * @private
         * @param e {Object} Объект события
         */
        _showPlaceMark: function(e) {
            var process = e.originalEvent.process;
            var geo = e.originalEvent.geo;
            GWTK.gEngine.Mediator.publish('showPlacemark', { process: process, geo: geo });
            
            var dest = this.getCenter();
            GWTK.gEngine.Mediator.publish('moveToPoint', { point: [dest.x, dest.y, 0] });
            
            e.stopPropagation();
            e.preventDefault();
            e.returnValue = false;
            return false;
        },
        /**
         * Функция скрытия маркера местоположения
         * @method _clearPlaceMark
         * @private
         */
        _clearPlaceMark: function() {
            GWTK.gEngine.Mediator.publish('clearPlaceMark');
        }
    };
    
    /**
     * Компонент состояния 2D карты
     * @class GWTK.MapState
     * @constructor GWTK.MapState
     * @param map {GWTK.Map} Экземпляр карты
     */
    GWTK.MapState = function(map) {
        this.map = map;
        this._panes = this.map.panes || {};
        this._projection = ProjectionCollection[this.map.options.tilematrixset];
        this.mCenter = new GWTK.LatLng(0, 0, 0);
        this._requestOptions = {
            extauth: false,
            url: null,
            token: false,
            pamUrls: []
        };
    };
    GWTK.MapState.prototype = {
        
        /**
         * Получить параметры запроса
         * @method getRequestOptions
         * @public
         * @return {object|null} Параметры запроса (если требуют обновления, иначе - `null`)
         */
        getRequestOptions: function() {
            var result = null;
            // var extauth = this.map.options.extauth;
            // if (extauth !== this._requestOptions.extauth) {
            //     this._requestOptions.extauth = extauth;
            //     this._requestOptions.url = this.getMapServiceURL();
            //     result = this._requestOptions;
            // }
            // var token = this.map.getToken();
            // if (token !== this._requestOptions.token) {
            //     this._requestOptions.token = token;
            //     result = this._requestOptions;
            // }
            var extauth = this.map.options.extauth;
            var token = this.map.getToken();
            if (extauth !== this._requestOptions.extauth || token !== this._requestOptions.token) {
                this._requestOptions.extauth = extauth;
                this._requestOptions.token = token;
                this._requestOptions.url = this.getMapServiceURL();
                result = GWTK.RequestServices.createHttpParams(this.map);
            }
            
            if (this._requestOptions.pamUrls !== this.map.tiles.authentication.pam) {
                this._requestOptions.pamUrls = this.map.tiles.authentication.pam;
                result = this._requestOptions;
            }
            
            return result;
        },
        /**
         * Обновить Cookies
         * @method writeMapCookie
         * @public
         */
        writeMapCookie: function() {
            this.map._writeCookie();
        },
        /**
         * Установить вид для карты
         * @method setMapView
         * @public
         */
        setMapView: function() {
            this.map.setView();
        },
        /**
         * Установить положение центра отображаемого фрагмента карты
         * @method setMapCenter
         * @public
         * @param geo {Geodetic3D} Центр карты
         */
        setMapCenter: function(geo) {
            this.mCenter.lat = Trigonometry.toDegrees(geo.getLatitude());
            this.mCenter.lng = Trigonometry.toDegrees(geo.getLongitude());
            this.mCenter.alt = geo.getHeight();
            
            this.map.setViewport(new GeoPoint(this.mCenter.lng, this.mCenter.lat, this.mCenter.alt, this.map.ProjectionId).toMapPoint());
        },
        /**
         * Получить положение центра отображаемого фрагмента двухмерной карты в геодезических координатах
         * @method getMapGeoCenter
         * @public
         * @param [heightFlag] {boolean} Если `true`, вернет координаты с обновленной высотой
         * @return {GWTK.LatLng} Координаты центра
         */
        getMapGeoCenter: function(heightFlag) {
            
            var centerGeoPoint = this.map.getCenterGeoPoint();
            var curPoint = new Geodetic3D(centerGeoPoint.getLongitude(), centerGeoPoint.getLatitude(), centerGeoPoint.getHeight());
            if (heightFlag) {
                var curPointRad = Trigonometry.toRadians(new Geodetic3D(curPointRad.getLongitude(), curPointRad.getLatitude(), curPointRad.getHeight()));
                const alt = GWTK.heightSourceManager.getHeightInPoint(curPointRad);
                curPoint.setHeight(alt);
            }
            return { lat: curPoint.getLatitude(), lng: curPoint.getLongitude(), alt: curPoint.getHeight() };
        },
        /**
         * Получить положение центра отображаемого фрагмента двухмерной карты
         * @method getMapCenter
         * @public
         * @return {object} Координаты центра
         */
        getMapCenter: function() {
            return this.map.mapcenter;
        },
        /**
         * Получить отобранные объекты карты
         * @method getMapSelectedObjects
         * @public
         * @return {GWTK.selectedFeatures} Отобранные объекты карты
         */
        getMapSelectedObjects: function() {
            return this.map.selectedObjects;
        },
        /**
         * Границы масштабирования изображения карты
         * @method zoomLimit
         * @public
         * @param zoom {Number} масштабный коэффициент (уровень матрицы тайлов)
         */
        zoomLimit: function(zoom) {
            return this.map.zoomLimit(zoom);
        },
        /**
         * Получить масштаб отображения карты для уровня матрицы тайлов
         * @method getZoomScale
         * @param tilematrix {Number} Уровень матрицы тайлов
         * @param tilematrixset {String} Тип матрицы тайлов
         * @public
         * @return {int} Масштаб карты
         */
        getZoomScale: function(tilematrix, tilematrixset) {
            var scales = this.map.Translate.getTileMatix().Ogc.ScaleDenominator;
            return scales[Math.min(tilematrix, scales.length - 1)];
        },
        /**
         * Получить массив слоев карты
         * @method getMapLayers
         * @public
         * @return {array} Массив слоев карты
         */
        getMapLayers: function() {
            return this.map.layers;
        },
        /**
         * Получить массив описаний слоев
         * @method getMapLayerOptions
         * @public
         * @return {array} Массив описаний слоев
         */
        getMapLayerOptions: function() {
            return this.map.options.layers;
        },
        /**
         * Получить слой по идентификатору слоя в карте
         * @method getMapLayerByxId
         * @public
         * @param xId {string} Идентификатор слоя в карте
         * @return {object} Слой карты
         */
        getMapLayerByxId: function(xId) {
            return this.map.tiles.getLayerByxId(xId);
        },
        /**
         * Получить слой карты по идентификатору слоя на GIS WebService SE (параметр layer в url)
         * @method getLayerById
         * @param idlayer {String} Идентификатор слоя на GIS WebService SE
         * @public
         * @return {object} Слой карты
         */
        getLayerById: function(idlayer) {
            return this.map.tiles.getLayerByIdService(idlayer);
        },
        /**
         * Получить опции карты
         * @method getMapOptions
         * @public
         * @return {object} Опции карты
         */
        getMapOptions: function() {
            return this.map.options;
        },
        /**
         * Получить очередь отображения слоев
         * @method getViewOrder
         * @public
         * @return {array} Очередь отображения слоев
         */
        getViewOrder: function() {
            return this.map.tiles.viewOrder;
        },
        /**
         * Получить URL сервиса
         * @method getMapServiceURL
         * @public
         * @return {String} URL сервиса
         */
        getMapServiceURL: function() {
            return this.map.options.url;
        },
        /**
         * Получить опции карты для 3D
         * @method getMapOptionsFor3d
         * @public
         * @return {object} Опции карты для 3D
         */
        getMapOptionsFor3d: function() {
            return this.map.options.objects3d;
        },
        /**
         * Получить массив матриц высот
         * @method getMapMatrixes
         * @public
         * @return {array} Массив матриц высот
         */
        getMapMatrixes: function() {
            return this.map.options.matrix;
        },
        /**
         * Получить систему координат карты
         * @method getMapCrs
         * @public
         * @return {number} Система координат карты
         */
        getMapCrs: function() {
            return parseInt(this.map.Translate.EpsgCode);
        },
        /**
         * Установить уровень масштаба карты
         * @method setMapTileLevel
         * @public
         * @param tileLevel {number} Уровень масштаба карты
         */
        setMapTileLevel: function(tileLevel) {
            if (this.map.options.tilematrix !== tileLevel) {
                this.map.options.tilematrix = tileLevel;
                if (this.map.tiles) {
                    this.map.tiles._origin = this.map.getPixelMapTopLeft().round();
                }
                this.map.tilePane.style.left = '0px';
                this.map.tilePane.style.top = '0px';
            }
        },
        /**
         * Получить уровень масштаба карты
         * @method getMapTileLevel
         * @public
         * @return {number} Уровень масштаба карты
         */
        getMapTileLevel: function() {
            return parseInt(this.map.options.tilematrix);
        },
        /**
         * Получить минимально возможный уровень масштаба карты
         * @method getMapMinimumTileLevel
         * @public
         * @return {number} Минимально возможный уровень масштаба карты
         */
        getMapMinimumTileLevel: function() {
            return this.map.options.minzoom || 0;
        },
        /**
         * Получить максимально возможный уровень масштаба карты
         * @method getMapMaximumTileLevel
         * @public
         * @return {number} Максимально возможный уровень масштаба карты
         */
        getMapMaximumTileLevel: function() {
            return this.map.options.maxzoom || 22;
        },
        /**
         * Получить пирамиду тайлов карты
         * @method getMapTilematrixset
         * @public
         * @return {string} Пирамида тайлов карты
         */
        getMapTilematrixset: function() {
            return this.map.options.tilematrixset;
        },
        /**
         * Получить угол наклона карты
         * @method getMapInclineAngle
         * @public
         * @return {number} Угол наклона карты в радианах
         */
        getMapInclineAngle: function() {
            var value;
            if (this.map.options.params3d && this.map.options.params3d.incline !== undefined) {
                value = this.map.options.params3d.incline;
            }else{
                value = Math.PI / 2;
            }
            return value;
        },
        /**
         * Получить угол поворота карты
         * @method getMapRotateAngle
         * @public
         * @return {number} Угол поворота карты в радианах
         */
        getMapRotateAngle: function() {
            var value;
            if (this.map.options.params3d && this.map.options.params3d.rotate !== undefined) {
                value = this.map.options.params3d.rotate;
            }else{
                value = 0;
            }
            return value;
        },
        /**
         * Получить маршруты полета
         * @method getMapFlightRotes
         * @public
         * @return {array} Массив маршрутов полета
         */
        getMapFlightRotes: function() {
            return this.map.options.flightroutes || null;
        },
        /**
         * Получить объект инструмента (контрола) карты по его имени
         * @method getMapTool
         * @param toolName {string} имя контрола карты
         * @return {object|number|null}
         */
        getMapTool: function(toolName) {
            return this.map.mapTool(toolName);
        },
        /**
         * Получить размер окна карты
         * @method getWindowSize
         * @return {array} Размер окна карты в пикселах [w, h]
         */
        getWindowSize: function() {
            return this.map.getWindowSize();
        },
        /**
         * Получить текущий размер пиксела в метрах
         * @method getPixelSpan
         * @public
         * @param scale {number} Значение масштаба
         * @return {number} Размер пиксела в метрах
         */
        getPixelSpan: function(scale) {
            return this.map.Translate.getTileMatix().getPixelSpan(this.map.getScaleZoom(scale));
        },
        /**
         * Получить проекцию карты
         * @method getMapProjection
         * @public
         * @return {GWTK.gEngine.Core.Projection} Проекция карты
         */
        getMapProjection: function() {
            return this._projection;
        },
        /**
         * Получить панель карты
         * @method getMapPane
         * @public
         * @param paneName {string} Название панели
         * @return {object} Панель карты
         */
        getMapPane: function(paneName) {
            return this._panes[paneName];
        },
        /**
         * Получить панель событий карты
         * @method getMapEventPane
         * @public
         * @return {object} Панель событий карты
         */
        getMapEventPane: function() {
            return this._panes.eventPane;
        },
        /**
         * Получить панель координат карты
         * @method getMapCoordPane
         * @public
         * @return {object} Панель координат карты
         */
        getMapCoordPane: function() {
            return this._panes.coordPane;
        },
        /**
         * Получить панель масштаба карты
         * @method getMapScalePane
         * @public
         * @return {object} Панель масштаба карты
         */
        getMapScalePane: function() {
            return this._panes.scalePane;
        },
        /**
         * Получить панель линейки масштаба карты
         * @method getMapScalerPane
         * @public
         * @return {object} Панель линейки масштаба карты
         */
        getMapScalerPane: function() {
            return this._panes.controlsPaneOld;
        },
        /**
         * Получить добавить панель карты
         * @method addMapPane
         * @public
         * @param paneName {string} Название панели
         * @param className {string} Класс панели
         * @param container {string} Контейнер панели
         * @return {object} Панель карты
         */
        addMapPane: function(paneName, className, container) {
            return this._panes[paneName] = this.map.createPane(className, container);
        },
        /**
         * Запросить информацию об объектах в точке
         * @method getFeatureInfoInPoint
         * @public
         * @param geo {Geodetic3D} Геодезические координаты точки
         * @param tileLevel {number} Уровень масштаба карты
         */
        getFeatureInfoInPoint: function(geo, tileLevel) {
            // var map = this.map;
            // var coords = this.getMapProjection().geo2xy(geo);
            //
            // var pos = GWTK.tileView.getTileLayerData(tileLevel, map, GWTK.point(coords[1], coords[0]));      // пикселы рисунка
            // var pixels = map.tiles.getLayersPointOffset(pos);
            // var container = this.getMapEventPane();
            // var rect = container.getBoundingClientRect();
            // var pointEvent = {
            //     clientX: pixels.x + rect.left + container.clientLeft,
            //     clientY: pixels.y + rect.top + container.clientTop
            // };
            // var point = GWTK.DomEvent.getMousePosition(pointEvent, container);
            // map.getFeatureInfo(point);
        },
        /**
         * Установить обработчики событий 2D карты
         * @method setMapButtonHandlers
         * @public
         * @param handlers {object} Коллекция обработчиков
         */
        setMapButtonHandlers: function(handlers) {
            var map = this.map;
            // Нажатия на кнопки масштабирования
            map.on({ phase: 'before', type: 'zoomIn', target: 'map' }, handlers.zoomIn);
            map.on({ phase: 'before', type: 'zoomOut', target: 'map' }, handlers.zoomOut);
            map.on({ type: 'showMark', target: 'geolocation' }, handlers.showMark);
            map.on({ type: 'clearMark', target: 'geolocation' }, handlers.clearMark);
        },
        /**
         * Удалить обработчики событий 2D карты
         * @method unsetMapButtonHandlers
         * @public
         * @param handlers {object} Коллекция обработчиков
         */
        unsetMapButtonHandlers: function(handlers) {
            var map = this.map;
            // Нажатия на кнопки масштабирования
            map.off({ phase: 'before', type: 'zoomIn', target: 'map' }, handlers.zoomIn);
            map.off({ phase: 'before', type: 'zoomOut', target: 'map' }, handlers.zoomOut);
            map.off({ type: 'showMark', target: 'geolocation' }, handlers.showMark);
            map.off({ type: 'clearMark', target: 'geolocation' }, handlers.clearMark);
        }
    };
    
    /**
     * Компонент панели координат
     * @class GWTK.CoordsPaneUI
     * @constructor GWTK.CoordsPaneUI
     * @param element {object} Элемент панели в DOM
     */
    GWTK.CoordsPaneUI = function(element) {
        this._element = $(element);
        this._dirty = false;
        this._html = '';
        this._curValue = null;
        this._curHeightValue = null;
        this.update = GWTK.gEngine.Utils3d.throttle(this._update.bind(this), 200);
        this._withoutHeightSymbol = '--';
    };
    GWTK.CoordsPaneUI.prototype = {
        /**
         * Установить значение
         * @method setValue
         * @public
         * @param geo {Geodetic3D} Геодезические координаты точки
         * @param withoutHeight {boolean} Флаг отсутствия высоты
         */
        setValue: function(geo, withoutHeight) {
            if (withoutHeight) {
                var height = this._withoutHeightSymbol;
            }else{
                height = Math.round(geo.getHeight() * 10) / 10;
            }
            let lang = this.map.translate.bind(this.map);
            var degreesValue = geo.toDegreesMinutesSecondsString(lang);
            if (this._curValue !== degreesValue || this._curHeightValue !== height) {
                this._html = geo.toDegreesMinutesSecondsString(lang) + ' H = ' + height + ' m';
                this._curHeightValue = height;
                this._curValue = degreesValue;
                this._dirty = true;
            }
        },
        /**
         * Обновить состояние объекта
         * @method _update
         * @private
         */
        _update: function() {
            if (this._dirty) {
                this._element.html(this._html);
                this._dirty = false;
            }
        }
    };
    /**
     * Компонент панели масштаба
     * @class GWTK.ScalePaneUI
     * @constructor GWTK.ScalePaneUI
     * @param element {object} Элемент панели в DOM
     */
    GWTK.ScalePaneUI = function(element) {
        this._element = $(element);
        this._dirty = false;
        this._html = '';
        this._curValue = null;
        this.update = GWTK.gEngine.Utils3d.throttle(this._update.bind(this), 200);
    };
    GWTK.ScalePaneUI.prototype = {
        /**
         * Установить значение
         * @method setValue
         * @public
         * @param scale {number} Масштаб карты
         */
        setValue: function(scale) {
            scale = Math.floor(scale);
            if (this._curValue !== scale) {
                this._curValue = scale;
                this._html = '1 : ' + GWTK.Util.formatting(scale, '');
                this._dirty = true;
            }
        },
        /**
         * Обновить состояние объекта
         * @method _update
         * @private
         */
        _update: function() {
            if (this._dirty) {
                this._element.html(this._html);
                this._dirty = false;
            }
        }
    };
    /**
     * Компонент панели линейки масштаба
     * @class GWTK.RulerPaneUI
     * @constructor GWTK.RulerPaneUI
     * @param element {object} Элемент панели в DOM
     */
    GWTK.RulerPaneUI = function(element) {
        this._element = $(element);
        this._dirty = false;
        this._html = '';
        this._width = 0;
        this.update = GWTK.gEngine.Utils3d.throttle(this._update.bind(this), 200);
    };
    GWTK.RulerPaneUI.prototype = {
        /**
         * Установить значение
         * @method setValue
         * @public
         * @param meters {number} Метры
         * @param MAX {number} Максимальный размер панели в пикселах
         * @param maxMeters {number} Максимальный размер панели в метрах
         */
        setValue: function(meters, MAX, maxMeters) {
            var html = meters < 1000 ? meters + ' ' + this.map.translate.lang('m') : (meters / 1000) + ' ' + this.map.translate.lang('km');
            if (this._html !== html) {
                this._html = html;
                this._dirty = true;
            }
            var width = Math.round(MAX * meters / maxMeters);
            if (this._width !== width) {
                this._width = width;
                this._dirty = true;
            }
        },
        /**
         * Обновить состояние объекта
         * @method _update
         * @private
         */
        _update: function() {
            if (this._dirty) {
                this._element.css('width', this._width + 'px');
                this._element.html(this._html);
                this._dirty = false;
            }
        }
    };
    
    /**
     * Коллекция списков описаний объектов
     * @class GWTK.CollectionListDesc
     * @constructor GWTK.CollectionListDesc
     */
    GWTK.CollectionListDesc = function() {
        this.listDescObj = [];
        this._count = 0;
        this.nameIndexes = [];
    };
    GWTK.CollectionListDesc.prototype = {
        /**
         * Получить количество элементов
         * @method count
         * @public
         * @returns {Number} Количество элементов
         */
        count: function() {
            return this._count;
        },
        /**
         * Добавление списка описаний
         * @method addItem
         * @public
         * @param listDesc {GWTK.ListDescObjByMap} Лист описаний объектов
         */
        addItem: function(listDesc) {
            if (listDesc) {
                this.listDescObj.push(listDesc);
                this.nameIndexes.push(listDesc.idMapLayer);
                this._count++;
            }
        },
        /**
         * Получение списка описаний
         * @method getItem
         * @public
         * @param ind {Number} Индекс списка описаний
         * @returns {GWTK.ListDescObjByMap|undefined} Список описаний
         */
        getItem: function(ind) {
            var result;
            if (!isNaN(ind) && ind < this._count) {
                result = this.listDescObj[ind];
            }
            return result;
        },
        /**
         * Получение списка описаний объектов по имени слоя
         * @method getListByLayerName
         * @public
         * @param layerName {String} Название слоя
         * @returns {GWTK.ListDescObjByMap|undefined} Список описаний
         */
        getListByLayerName: function(layerName) {
            var ind = this.nameIndexes.indexOf(layerName);
            return this.listDescObj[ind];
        }
    };
    
    /**
     * Класс-описание объектов, заданных для отображения
     * @class GWTK.ListDescObjByMap
     * @constructor GWTK.ListDescObjByMap
     * @param layerId {String} Идентификатор слоя на сервисе
     * @param id {String} Идентификатор слоя в приложении
     * @param options {object} Параметры слоя
     */
    GWTK.ListDescObjByMap = function(layerId, id, options) {
        /**
         * Название слоя
         * @property idMapLayer
         * @type String
         * @default NULL
         * @public
         */
        this.idMapLayer = null;
        
        this.options = null;
        
        /**
         * Описания объектов
         * @property arrayDescObj
         * @type Object
         * @default {}
         * @public
         */
        this.arrayDescObj = {};
        
        /**
         * Количество описаний объектов
         * @property _count
         * @type Number
         * @default 0
         * @private
         */
        this._count = 0;
        
        this.mList = [];
        this.mKeyList = [];
        
        this.init(layerId, id, options);
    };
    GWTK.ListDescObjByMap.prototype = {
        /**
         * Инициализация
         * @method init
         * @private
         * @param layerId {String} Идентификатор слоя на сервисе
         * @param id {String} Идентификатор слоя в приложении
         * @param options {object} Параметры слоя
         */
        init: function(layerId, id, options) {
            this.idMapLayer = layerId;
            this.xId = id;
            this.options = options;
        },
        /**
         * Получить количество элементов
         * @method count
         * @public
         * @returns {Number} Количество элементов
         */
        count: function() {
            return this._count;
        },
        /**
         * Получение описания объекта
         * @method getDesc
         * @public
         * @param code {Number} Код описания 3d-объекта по классификатору
         * @param objKey {String|Boolean} Ключ описания 3d-объекта по классификатору
         */
        getDesc: function(code, objKey) {
            var desc = null;
            if (objKey == null) {
                objKey = true;
            }
            var descList = this.arrayDescObj[code];
            if (descList != null) {
                for (var i = 0, currentDesc; (currentDesc = descList[i]); i++) {
                    if (currentDesc.objectkey === objKey || objKey === true) {
                        desc = currentDesc;
                        break;
                    }
                }
            }
            return desc;
        },
        /**
         * Получение массива описаний объектов
         * @method getList
         * @public
         * @returns {Array} Описания объектов в виде массива
         */
        getList: function() {
            var list = this.mList;
            list.length = 0;
            for (var k in this.arrayDescObj) {
                if (this.arrayDescObj.hasOwnProperty(k)) {
                    var currentArrayDescObj = this.arrayDescObj[k];
                    for (var i = 0, currentArrayDescObjItem; (currentArrayDescObjItem = currentArrayDescObj[i]); i++) {
                        list.push(currentArrayDescObjItem);
                    }
                }
            }
            return list;
        },
        /**
         * Получение массива ключей описаний объектов с видом из классификатора
         * @method getObjectKeyList
         * @public
         * @returns {array} Массив ключей описаний объектов с видом из классификатора
         */
        getObjectKeyList: function() {
            var keyList = this.mKeyList;
            keyList.length = 0;
            for (var k in this.arrayDescObj) {
                if (this.arrayDescObj.hasOwnProperty(k)) {
                    var currentArrayDescObj = this.arrayDescObj[k];
                    for (var i = 0, currentDescObj; (currentDescObj = currentArrayDescObj[i]); i++) {
                        if (currentDescObj.viewtype === '4' && keyList.indexOf(currentDescObj.objectkey) === -1) {
                            keyList.push(currentDescObj.objectkey);
                        }
                    }
                }
            }
            return keyList;
        },
        /**
         * Добавление описания объекта
         * @method addDesc
         * @public
         * @param desc {GWTK.DescObj} Описание 3d-объектов по классификатору для одной карты
         */
        addDesc: function(desc) {
            if (!desc || desc['code'] == null)
                return;
            if (this.arrayDescObj[desc['code']]) {
                this.arrayDescObj[desc['code']].push(desc);
            }else{
                this.arrayDescObj[desc['code']] = [desc];
            }
            this._count++;
        }
    };
    
    /**
     * Класс-описание 3d-объектов, заданных для отображения
     * @class GWTK.DescObj
     * @constructor GWTK.DescObj
     * @param dObj {Object} Описание объекта
     */
    GWTK.DescObj = function(dObj) {
        this.code = -1;
        this.local = -1;
        this.objectkey = -1;
        this.semlist = [];
        this.viewtype = '-1';
        this.cut = -1;
        this.color = null;
        this.opacity = null;
        this.height = null;
        this.relativeHeight = null;
        
        this.init(dObj);
    };
    GWTK.DescObj.prototype = {
        /**
         * Инициализация объекта
         * @method init
         * @private
         * @param dObj {Object} Описание 3d-объектов для одной карты
         */
        init: function(dObj) {
            if (!dObj)
                return;
            
            this.code = dObj.code;
            this.local = dObj.local;
            this.objectkey = dObj.objectkey;
            
            var semlist = dObj.semlist;
            for (var i = 0, sem; (sem = semlist[i]); i++) {
                this.semlist.push(sem);
            }
            
            this.viewtype = dObj.viewtype + '';
            this.cut = dObj.cut;
            
            this.color = dObj.color;
            this.opacity = dObj.opacity;
            if (typeof dObj.height != 'object' && dObj.height != null)
                this.height = { 'heightDef': dObj.height };
            else
                this.height = dObj.height;
            this.relativeHeight = dObj.relativeHeight;
        }
    };
    
    /**
     * Класс описания слоя
     * @class GWTK.LayerDescription
     * @constructor GWTK.LayerDescription
     * @param options{Object} Параметры слоя
     * @param defaults{Object} Параметры карты по умолчанию
     */
    GWTK.LayerDescription = function(options, defaults) {
        this.tilematrixset = (options['tilematrixset'] && options['tilematrixset'] !== '') ? options['tilematrixset'] : defaults['tilematrixset'];
        this.tileparams = {};
        
        this.linkedUrls = [];
        this.zIndex = null;
        this.bbox = null;
        this._initOptions(options, defaults);
        this.waterColors = null;
        
    };
    GWTK.LayerDescription.prototype = {
        /**
         * Инициализация параметров слоя
         * @method _initOptions
         * @private
         * @param options{Object} Параметры слоя
         * @param defaults{Object} Параметры карты по умолчанию
         */
        _initOptions: function(options, defaults) {
            
            this.origin = options;
            this.zIndex = 0;
            this.waterColors = null;
            this.xId = options['id'];
            this.waterColorList = options['waterColors'];
            
            this.alias = options['alias'];
            if (options['url'].indexOf('S') === 0) {
                options['url'] = '?' + options['url'];
            }
            
            var link = parseUrl(options.url || '');
            
            this.linkedUrls.push(link);
            if (Array.isArray(options.linkedUrls)) {
                for (var i = 0; i < options.linkedUrls.length; i++) {
                    this.linkedUrls.push(parseUrl(options.linkedUrls[i]));
                }
            }
            
            this.service = 'wms';
            var url = options.url.toLowerCase();
            if (url.indexOf('%z') >= 0 && url.indexOf('%x') >= 0 && url.indexOf('%y') >= 0) {
                this.service = 'wmts';
            }
            if (options.folder && options.folder.length > 0) {
                this.service = 'folder';
            }
            
            this.isTiled = (this.service === 'wmts') || options['pkkmap'] || options['tilewms'];
            
            // TODO: безобразие 2
            this.maxzoom = (options['maxzoomview'] != null && options['maxzoomview'] < 23) ? options['maxzoomview'] : defaults['maxzoom'];
            this.minzoom = (options['minzoomview'] != null && options['minzoomview'] > -1) ? options['minzoomview'] : defaults['minzoom'];
            
            //TODO: безобразие
            if (this.minzoom === 2 && options['minzoomview'] == null) {
                this.minzoom = 0;
            }
            
            this.bbox = (options['bbox'] && options['bbox'].length > 0) ? options['bbox'] : [-90, -180, 90, 180];
            
            this.selectObject = options['selectObject'] || 0;
            this.keyssearchbyname = options['keyssearchbyname'] || [];
            
            this.hidden = options['hidden'] || 0;
            
            this.crs = this.tileparams.crs;
            this.topLeft = this.tileparams.topleft;
            this.tileWidth = this.tileparams.tileWidth || 256.0;
            this.tileHeight = this.tileparams.tileHeight || 256.0;
            
            this.server = link.origin + '/' + link.pathname;
            
            var params = GWTK.Util.getParamsFromURL(link.href);
            if (params.hasOwnProperty('layer')) {
                this.idLayer = params['layer'];
            }else if (params.hasOwnProperty('layers')) {
                this.idLayer = params['layers'];
            }
            
            function parseUrl(url) {
                var link = url.split('?');
                var server = link[0].split(/\/+/);
                var path = '';
                if (server.length > 2) {
                    path = server.slice(2).join('/');
                }
                return {
                    href: url,
                    protocol: server[0],
                    origin: server[0] + '//' + server[1],
                    pathname: path
                };
            }
            
        },
        /**
         * Получить количество строк тайлов в пределах экрана
         * @method getRowCount
         * @public
         * @param screenHeight {Number} Высота экрана в px
         * @return {Number} Количество строк тайлов в пределах экрана
         */
        getRowCount: function(screenHeight) {
            return Math.ceil(screenHeight / this.tileHeight);
        },
        /**
         * Получить количество столбцов тайлов в пределах экрана
         * @method getCollCount
         * @public
         * @param screenWidth {Number} Ширина экрана в px
         * @return {Number} Количество столбцов тайлов в пределах экрана
         */
        getCollCount: function(screenWidth) {
            return Math.ceil(screenWidth / this.tileWidth);
        },
        /**
         * Получить значение непрозрачности слоя
         * @method getOpacityValue
         * @public
         * @return {Number} Значение непрозрачности слоя (от 0 до 1.0)
         */
        getOpacityValue: function() {
            return this.origin.opacityValue / 100;
        },
        /**
         * Получить тип пирамиды тайлов
         * @method getTilematrixset
         * @public
         * @return {string} Тип пирамиды тайлов
         */
        getTilematrixset: function() {
            return this.tilematrixset;
        },
        /**
         * Получить систему координат слоя
         * @method getCRS
         * @public
         * @return {number} Систему координат слоя
         */
        getCRS: function() {
            return this.crs;
        },
        /**
         * Получить параметры тайлов
         * @method getTileParams
         * @public
         * @return {Object} Параметры для данного типа матрицы тайлов
         */
        getTileParams: function() {
            return this.tileparams;
        },
        /**
         * Загрузить цвета водной поверхности
         * @method _loadWaterColorTexture
         * @private
         */
        _loadWaterColorTexture: function() {
            if (Array.isArray(this.waterColorList)) {
                this.waterColors = [];
                var waterColors = this.waterColors;
                for (var i = 0; i < this.waterColorList.length; i++) {
                    if (this.waterColorList[i] !== 1) {
                        var color = ColorMethods.RGBA(this.waterColorList[i], 1.0, null);
                        color.length = 3;
                        waterColors.push(color);
                    }else if (this.linkedUrls[0]) {
                        var src = this.linkedUrls[0].href;
                        var tilematrixset = this.tilematrixset;
                        src = src.replace(/%z/g, 10);
                        src = src.replace(/%tilematrixset/g, tilematrixset);
                        if (tilematrixset === 'EPSG:3857') {
                            src = src.replace(/%x/g, '182');
                            src = src.replace(/%y/g, '25');
                        }else{
                            src = src.replace(/%x/g, '730');
                            src = src.replace(/%y/g, '100');
                        }
                        
                        var image = new Image();
                        image.crossOrigin = 'anonymus';
                        image.onload = function() {
                            var canvasWidth = 1;
                            var canvasHeight = 1;
                            // Создание изображения с текстом
                            var c = $('<canvas width="' + canvasWidth + '" height="' + canvasHeight + '"</canvas>')[0];
                            var ctx = c.getContext('2d');
                            ctx.drawImage(this, 0, 0);
                            var canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
                            var color = [
                                canvasData.data[0] / 255,
                                canvasData.data[1] / 255,
                                canvasData.data[2] / 255
                            ];
                            waterColors.push(color);
                        };
                        image.src = src;
                    }
                }
            }
        },
        /**
         * Получить цвета водной поверхности
         * @method getWaterColors
         * @public
         * @return {array} Массив цветов водной поверхности
         */
        getWaterColors: function() {
            if (this.waterColors == null) {
                this._loadWaterColorTexture();
            }
            return this.waterColors;
        }
    };
}
