/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                             Карта                                *
 *                                                                  *
 *******************************************************************/
/**
 * Компонент Карта.
 * Доступ к пространственным данным, отображение,
 * масштабирование, перемещение изображения, управление слоями.
 *
 * @class GWTK.Map
 * @constructor GWTK.Map
 * @param id {String} идентификатор контейнера карты (div'а)
 * @param param {Object} параметры карты, json
 */
import TranslateList from '~/translate/TTranslateList';
import KeyboardDevice, { KeyboardEventType } from '~/input/KeyboardDevice';
import MouseDevice, { MouseEventType } from '~/input/MouseDevice';
import SearchManager from '~/services/Search/SearchManager';
import SVGrenderer, { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import Trigonometry from '~/geo/Trigonometry';
import { MapPoint } from '~/geometry/MapPoint';
import { ProjectionCollection } from '~/3d/engine/core/geometry/projection';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import MarkerStyle from '~/style/MarkerStyle';
import SVGrenderable from '~/renderer/SVGrenderable';
import Rectangle from '~/geometry/Rectangle';
import GISWebServiceVectorLayer from '~/maplayers/GISWebServiceVectorLayer';
import TouchScreenDevice from '~/input/TouchScreenDevice';
import WorkspaceManager, {
    INITIAL_EXTENT_SETTINGS,
    PROJECT_SETTINGS_HIDDEN_LAYERS,
    PROJECT_SETTINGS_LAYER_PARAMETERS_ARRAY,
    PROJECT_SETTINGS_LAYERS_OPACITY,
    PROJECT_SETTINGS_LAYERS_VIEW_ORDER,
    PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_LINE_COLOR,
    PROJECT_SETTINGS_REFRESH_INTERVAL,
    PROJECT_SETTINGS_VISIBLE_MODELS,
    VIEW_SETTINGS_MAPCENTER,
    VIEW_SETTINGS_PARAMS3D,
    VIEW_SETTINGS_ZOOM_LEVEL,
    PROJECT_SETTINGS_ACTIVE_TASK_LIST,
    PROJECT_SETTINGS_CONTENT_TREE_DISABLED_ARRAY,
    PROJECT_SETTINGS_MAP_LOG_DEBUG_MODE
} from '~/utils/WorkspaceManager';
import MapTreeJSON from '~/utils/MapTreeJSON';
import MapEventLog from './utils/MapEventLog';
import { OUTTYPE } from '~/services/RequestServices/common/enumerables';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import { BrowserService } from '~/services/BrowserService';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import MapProject from '~/mapproject/MapProject';
import BoundingBox2D from '~/3d/engine/core/boundingvolumes/bbox2d';
import GeoJsonLayer from './maplayers/GeoJsonLayer';
import { GwtkMap } from './types/Types';
import {GwtkLayerDescription} from './types/Options';
import TextStyle from '~/style/TextStyle';
import Utils from '~/services/Utils';
import GeoPoint from '~/geo/GeoPoint';
import { TileLayerWms } from '~/maplayers/TileLayerWms';
import ClassifierCollection from '~/classifier/ClassifierCollection';

import { Bounds } from '~/geometry/Bounds';
import PixelPoint from '~/geometry/PixelPoint';
import { Cartesian2D } from '~/geometry/Cartesian2D';
import { PixelBounds } from '~/geometry/PixelBounds';
import { TileLayer } from '~/maplayers/TileLayer';
import VectorLayer from '~/maplayers/VectorLayer';
import VirtualFolder from '~/maplayers/VirtualFolder';
import HTMLrenderer from '~/renderer/HTMLrenderer';
import WmsLayer from '~/maplayers/WmsLayer';
import RosreestrSelectLayer from '~/maplayers/RosreestrSelectLayer';

import SelectedObjectsDrawManager from '~/maplayers/SelectedObjectsDrawManager';
import { LogEventType } from '~/types/CommonTypes';

import ruRU from '../locale_new/ru-ru.json';
import uaUA from '../locale_new/ua-ua.json';
import enUS from '../locale_new/en-us.json';
import HtmlLayer from '~/maplayers/HtmlLayer';
import ObjectStorage from '~/mapobject/ObjectStorage';
import { geoJsonToMapObjects } from '~/api/MapApi';
import {COMMON_VECTOR_LAYER_ID, GISWebServiceSEMode, SourceType} from './services/Search/SearchManager';
import DynamicLabelList from '~/classifier/DynamicLabelList';
import GwtkError from './utils/GwtkError';
import {
    PROJECT_SETTINGS_LAYERS_BACKGROUND_ACTIVE,
    PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS
} from './utils/WorkspaceManager';
import {METRIC} from './services/RequestServices/common/enumerables';
import GeoJSON, {GeoJsonType} from './utils/GeoJSON';
import {SemanticOperator} from './services/Search/criteria/SemanticSearchCriterion';
import {MapObjectPanelState} from "./taskmanager/TaskManager";


//Ограничение длины строки с информацией о слоях
const MAX_NUMBER_OF_LAYERS_IN_URL = 15;
const MAP_OBJECT_PANEL_COMPONENT = 'gwtkmapobject.main';

if (window.GWTK) {
    GWTK.Map = function(id, param, workspaceJson) {
        this.divID = id;                       // id контейнера карты
        this.container = {};                   // контейнер карты
        this.options = $.extend(true, {}, param); // параметры карты
        this.mapLatLngBounds;                  // географические габариты карты
        this.mapBounds = null;                 // прямоугольные габариты карты
        this.mapcenter = new MapPoint();       // прямоугольные координаты центра карты (метры )
        this.mapCenterPoint = new MapPoint();  // прямоугольные координаты центра карты (метры )
        this.layers = [];                      // слои карты
        this.tiles = null;                     // управление слоями карты
        this.handlers = null;                  // обработчики событий
        this.animatedLayers = [];              // слои, зарегистрированные для анимации кластеризации
        this.virtualfolders = [];              // виртуальные папки
        this.panes = {};                       // панели карты
        this.maptools = [];                    // инструменты карты (шторка и др.)
        this.param_version = '';               // версия параметров карты (в зависимости от их кол-ва и значений)
        this.placemarks = [];                  // маркеры (отметки)
        this.markVisible = true;               // видимость маркера при выборе объекта на карте (из списка)

        this.taskManagerNew = null;            // управление интерактивными задачами карты (новый)
        this.vectorLayers = [];                // список векторных слоев (новый)
        this.activeObject = undefined;         // выбранный объект (новый)
        this.selectedObjectsStorage = new ObjectStorage();   // набор селекторов выделенных объектов
        this.objectManager = null;             // управление выбором объектов карты
        this.selectedObjects = null;           // отобранные объекты карты
        this.classifiers = null;               // классификаторы слоев карты
        this.contentTreeManager = null;
        this.mapProject = null;
        this.objectSelectionManager = undefined;

        this.oldTaskButtons = [];
        this.Translate = null;                  // параметры пересчета карты
        this.tileMatrix = null;                 // текущая матрица тайлов карты
        this.maxBounds = undefined;

        this.textObjectSelection = false;

        this.strictEditorMode = false;          // режим работы только с редактируемыми слоями

        this.dynamicLabelList = null;

        this._writeCookie = Utils.debounce(this._writeCookie.bind(this), 50);

        this.initialize(workspaceJson);

        this.defaultMapOptions;
        this.rosreestrLayer = null;
    };

    GWTK.Map.prototype = {
        /**
         * Инициализация класса карты
         * @method initialize
         */
        initialize: function(workspaceJson) {
            if (!this.divID) return this;

            this.initContainer(this.divID);

            var str = JSON.stringify(this.options);
            this.param_version = (str.length).toString();                        // размер входных параметров

            this.defaultMapOptions = JSON.parse(JSON.stringify(this.options));

            this._observer = new GWTK.Observable();                              // управление событиями кластеризации

            this.classifiers = new ClassifierCollection();                       // классификаторы слоев карты

            if (!this.setOptions()) return this;                                 // параметры карты

            this.mapCenterPoint = new MapPoint(this.mapCenterPoint.x, this.mapCenterPoint.y, this.mapCenterPoint.h, this.ProjectionId);

            this.setWindowSize();                                                // размер карты

            this.locale();                                                       // локализация языка

            this.initPanes();                                                    // панели карты

            this.mapLatLngBounds = undefined;

            this.setBounds();

            if ('maxbounds' in this.options) {
                this.setMaxBounds(this.options.maxbounds);                       // максимальные габариты карты
                delete this.options['maxbounds'];
            }

            this.initEvents();                                                    // назначить обработчики событий карты

            this.workspaceManager = new WorkspaceManager(this, workspaceJson);

            this.contentMapEventLog = new MapEventLog(this.workspaceManager);

            this.initContentTree();

            this.mapProject = new MapProject(this);

            this.restoreMapWorkspace();

            this._validateCenterByMaxBounds();                                    // при установленных габаритах карты проверить положение центра

            this.setView(this.mapCenterPoint, this.options.tilematrix);           // положение и масштаб

            //this.fixView();

            if (this.tiles == null) {
                this.tiles = GWTK.layersControl(this);                             // класс управления слоями карты
            }

            this._disableMapRefresh = false;

            this.initAccessToken();

            this.objectSelectionManager = new SelectedObjectsDrawManager(this);    // отображение выделенных объектов

            this.setLayers();                                                      // настроить слои

            this.objectManager = new GWTK.ObjectManager(this);                     // класс управления отбором объектов

            this.selectedObjects = this.objectManager.selectedFeatures;            // класс отобранных объектов карты

            this.scaleManager = new GWTK.ScalingManager(this);                     // класс масштабирования

            this.tiles.setLayersOpacity();                                         // установить прозрачность по параметрам

            this.setSelectedObjectsDrawOptions();                                  // установить выделения объектов

            this.layers.forEach(layer => {
                const treenode = this.getContentTreeNode(layer.xId);
                if (treenode && treenode.text) {
                    layer.alias = treenode.text;                  // TODO! layer.setAlias
                    layer.options.alias = treenode.text;
                }
            });

            this.virtualfolders.forEach(folder => {
                const treenode = this.getContentTreeNode(folder.id);
                if (treenode && treenode.text) {
                    const item = this.options.layers.find(item => item.id === folder.id);
                    if (item) {
                        item.alias = treenode.text;
                    }
                    folder.alias = treenode.text;                  // TODO! folder.setAlias
                }
            });

            if (this._wmsEnabled()) {
                this.tiles.wmsUpdate();
            }

            if (this.options.mapobject) {                                     // выделить объект карты
                GWTK.mapSearchObjectsByIdList(this, this.options.mapobject.layer_id, this.options.mapobject.id, true);
                this.options.mapobject = undefined;
            }

            // отрисовщик векторных данных
            this.getVectorRenderer();
            this.mapObjectsViewer = new SVGrenderable();
            this.htmlRenderer = new HTMLrenderer(this);

            this.drawFrame = this.drawFrame.bind(this);
            window.requestAnimationFrame(this.drawFrame);

            // менеждер поиска
            this.searchManager = new SearchManager(this, true);

            $(this.eventPane).on('overlayRefresh', () => this.requestRender());

            this.loadingStreams = [];

            this.formats = this.exportFormats();

            this.dynamicLabelList = new DynamicLabelList(this);
        },

        setRefreshInterval() {
            const refreshInterval = this.workspaceManager.getValue(PROJECT_SETTINGS_REFRESH_INTERVAL);
            // установить обновление карты
            if (this._wmsEnabled() && refreshInterval) {
                if (!this.is3dActive()) {
                    this.tiles.setRefreshInterval(refreshInterval);
                }
            }
        },

        /**
         * Запросить строку параметров проекции
         */
        getCrsString: function() {
            if (this.Translate.EpsgCode)
                return 'EPSG:' + this.Translate.EpsgCode.toString();
            else
                return this.Translate.ProjectionId;
        },


        initContentTree: function() {
            this.contentTreeManager = new MapTreeJSON(this);
        },

        /**
         * Очистить список выделенных объектов
         * @method clearSelectedFeatures
         */
        clearSelectedFeatures: function() {
            this.objectManager.selectedFeatures.clear();
        },

        /**
         * Локализовать язык интерфейса
         * @method locale
         */
        locale: function() {
            if (window.w2utils) {
                if (this.options.localepath) {
                    window.w2utils.locale(this.options.localepath);
                    try {
                        this.options.locale = this.options.localepath.slice(-10, -5);
                    } catch (e) {
                        this.options.locale = '';
                    }
                }else{
                    window.w2utils.locale(this.options.locale);
                }
            }
            this.initTranslate();
        },

        initTranslate() {
            let locale;
            switch (this.options.locale) {
                case 'ru-ru':
                    locale = ruRU;
                    break;
                case 'ua-ua':
                    locale = uaUA;
                    break;
                case 'en-us':
                default:
                    locale = enUS;
            }

            this.dictionary = locale || {};
        },

        translate(value) {
            return this.dictionary[value] || value;
        },

        /**
         * Форматы данных для экспорта
         * @method exportFormats
         * @returns {Array} json-описания форматов данных
         */
        exportFormats() {
            return [
                {
                    outType: OUTTYPE.GML,
                    contentType: 'text/xml',
                    ext: 'gml',
                    text: 'GML',
                    enabled: false
                },
                {
                    outType: OUTTYPE.JSON,
                    contentType: 'text/plain',
                    ext: 'json',
                    text: 'JSON',
                    enabled: false
                },
                {
                    outType: OUTTYPE.SXF,
                    contentType: 'text/plain',
                    ext: 'zip',
                    text: 'SXF',
                    enabled: false
                },
                {
                    outType: OUTTYPE.TXF,
                    contentType: 'text/plain',
                    ext: 'zip',
                    text: 'TXF',
                    enabled: false
                },
                {
                    outType: OUTTYPE.CSV,
                    contentType: 'text/csv',
                    ext: 'csv',
                    text: 'CSV',
                    enabled: false
                },
                {
                    outType: OUTTYPE.SITX,
                    contentType: 'text/sitx',
                    ext: 'sitx',
                    text: 'SITX',
                    enabled: false
                },
                {
                    outType: OUTTYPE.MTQ,
                    contentType: 'text/mtq',
                    ext: 'mtq',
                    text: 'MTQ',
                    enabled: false
                },
                {
                    outType: OUTTYPE.SHP,
                    contentType: 'text/plain',
                    ext: 'zip',
                    text: 'SHP',
                    enabled: false
                },
                {
                    outType: OUTTYPE.TAB,
                    contentType: 'text/tab',
                    ext: 'tab',
                    text: 'TAB',
                    enabled: false
                },
                {
                    outType: OUTTYPE.KML,
                    contentType: 'text/plain',
                    ext: 'zip',
                    text: 'KML',
                    enabled: false
                },
                {
                    outType: OUTTYPE.MIF,
                    contentType: 'text/plain',
                    ext: 'zip',
                    text: 'MIF',
                    enabled: false
                },
                {
                    outType: OUTTYPE.DWG,
                    contentType: 'text/dwg',
                    ext: 'dwg',
                    text: 'DWG',
                    enabled: false
                },
                {
                    outType: OUTTYPE.DXF,
                    contentType: 'text/plain',
                    ext: 'zip',
                    text: 'DXF',
                    enabled: false
                },
            ];
        },

        /**
         * Инициализировать токен доступа
         * @method initAccessToken
         */
        initAccessToken: function() {
            if (this.options.usetoken === false) {
                return;
            }
            this.setCursor('progress');
            this.options.tokens = new GWTK.Token(this);
            this.options.tokens.getToken(this, false);
            this.setCursor('default');
        },

        /**
         * Получить экземпляр менеджера задач
         * @deprecated
         * @method getTaskManager
         * @return {TaskManager} Менеджер задач
         */
        getTaskManager() {
            //TODO: удалить, после того, как уберем старый taskManager
            return this.taskManagerNew;
        },

        /**
         * Получить векторный слой
         * @method getVectorLayer
         * @param idLayer {string} Идентификатор слоя на сервисе
         * @param [serviceUrl] {string} Адрес сервиса
         * @return {VectorLayer|undefined} Экземпляр векторного слоя на сервисе
         */
        getVectorLayer(idLayer, serviceUrl) {
            for (let i = 0; i < this.vectorLayers.length; i++) {
                const vectorLayer = this.vectorLayers[i];
                if (vectorLayer.idLayer === idLayer && (serviceUrl === undefined || vectorLayer.serviceUrl === serviceUrl)) {
                    return vectorLayer;
                }
            }
        },

        getLayer(idLayer, serviceUrl) {
            for (let i = 0; i < this.layers.length; i++) {
                const layer = this.layers[i];
                if (layer.idLayer === idLayer && (serviceUrl === undefined || layer.serviceUrl === serviceUrl)) {
                    return layer;
                }
            }
        },

        getVectorLayerByxId(xId) {
            return this.vectorLayers.find(layer => layer.xId === xId);
        },

        /**
         * Получить выбранный объект
         * @method getActiveObject
         * @return {MapObject} Выбранный объект
         */
        getActiveObject() {
            return this.activeObject;
        },

        /**
         * Установить выбранный объект
         * @method setActiveObject
         * @param mapObject {MapObject} Объект карты
         */
        setActiveObject(mapObject) {

            if (mapObject && !this.getTaskManager().canSelectThisObject(mapObject)) {
                return;
            }

            this.activeObject = mapObject || undefined;
            this.trigger({ type: 'featureinforefreshed', target: 'map', phase: 'before' });
            this.trigger({ type: 'selectobject', target: 'map' });
            this.requestRender();
        },

        /**
         * Очистить выбранный объект
         * @method clearActiveObject
         */
        clearActiveObject() {
            if (this.activeObject) {
                this.activeObject = undefined;
                this.trigger({ type: 'featureinforefreshed', target: 'map', phase: 'before' });
                this.trigger({ type: 'selectobject', target: 'map' });
                this.requestRender();
            }
        },

        /**
         * Получить выделенные объекты
         * @method getSelectedObjects
         * @return {MapObject[]} Массив выделенных объектов
         */
        getSelectedObjects() {
            return this.selectedObjectsStorage.array;
        },

        /**
         * Получить выделенные объекты
         * @method getSelectedObjects
         * @return {IterableIterator} Массив выделенных объектов
         */
        getSelectedObjectsIterator() {
            return this.selectedObjectsStorage.iterator;
        },

        /**
         * Получить количество выделенных объектов
         * @method getSelectedObjectsCount
         * @return {number} количество объектов в массиве
         */
        getSelectedObjectsCount() {
            return this.selectedObjectsStorage.count;
        },

        /**
         * Добавить выделенный объект
         * @method addSelectedObject
         * @param mapObject {MapObject} Объект карты
         */
        addSelectedObject(mapObject) {
            if (!this.getTaskManager().canSelectThisObject(mapObject)) {
                return;
            }

            if (this.selectedObjectsStorage.addObject(mapObject)) {
                this.setServiceObjectsSelection();
                this.requestRender();

                this.trigger({ type: 'featureinforefreshed', target: 'map', phase: 'before' });
                this.trigger({ type: 'selectobjects', target: 'map' });
            }
        },

        /**
         * Добавить выделенные объекты
         * @method addSelectedObjects
         * @param mapObjects {MapObject[]} Массив объектов карты
         */
        addSelectedObjects(mapObjects) {
            let updateFlag = false;
            for (let i = 0; i < mapObjects.length; i++) {
                const mapObject = mapObjects[i];
                if (!this.getTaskManager().canSelectThisObject(mapObject)) {
                    continue;
                }

                if (this.selectedObjectsStorage.addObject(mapObject)) {
                    updateFlag = true;
                }
            }

            if (updateFlag) {
                this.requestRender();
                this.trigger({ type: 'featureinforefreshed', target: 'map', phase: 'before' });
                this.trigger({ type: 'selectobjects', target: 'map' });
            }
            this.setServiceObjectsSelection();
        },

        /**
         * Получить выделенный объект по идентификатору
         * @param gmlId {string} Идентификатор объекта (в карте)
         * @param serviceUrl {string} Url сервиса
         * @param idLayer {string} Идентификатор слоя (на сервисе)
         * @return {MapObject|undefined} Объект карты
         */
        getSelectedObjectById(gmlId, serviceUrl, idLayer) {
            const storageKey = ObjectStorage.generateStorageKey({ gmlId, serviceUrl, idLayer });
            return this.selectedObjectsStorage.getObject(storageKey)
        },

        /**
        * Получить список объектов по идентификатору
        * @method getObjectsByIdList
        * @param idLayer {string} Идентификатор слоя на сервисе
        * @param idList {string[]} Массив идентификаторов объектов (в карте)
        * @return {Promise<GwtkMapperResult>} Объекты карты
        */
        getObjectsByIdList(idLayer,idList ) {
            const layer = this.tiles.getLayerByxId(idLayer);
            return this.searchManager.findByIdList(layer, idList);
        },

        /**
         * Удалить выделенный объект
         * @method removeSelectedObject
         * @param mapObject {MapObject} Объект карты
         */
        removeSelectedObject(mapObject) {
            if (this.selectedObjectsStorage.removeObject(mapObject.storageKey)) {
                this.requestRender();
                this.setServiceObjectsSelection();
                this.trigger({ type: 'featureinforefreshed', target: 'map', phase: 'before' });
                this.trigger({ type: 'selectobjects', target: 'map' });
            }
        },

        /**
         * Удалить выделенные объекты
         * @method removeSelectedObjects
         * @param mapObjects {IterableIterator<MapObject>} Массив объектов карты
         */
        removeSelectedObjects(mapObjects) {
            let updateFlag = false;
            for (const mapObject of mapObjects) {
                if (this.selectedObjectsStorage.removeObject(mapObject.storageKey)) {
                    updateFlag = true;
                }
            }
            if (updateFlag) {
                this.requestRender();
                this.setServiceObjectsSelection();
                this.trigger({ type: 'featureinforefreshed', target: 'map', phase: 'before' });
                this.trigger({ type: 'selectobjects', target: 'map' });
            }
        },

        /**
         * Очистить выделенные объекты
         * @method clearSelectedObjects
         */
        clearSelectedObjects() {
            if (this.selectedObjectsStorage.clear()) {
                this.clearServiceObjectsSelection();
                this.requestRender();

                this.trigger({ type: 'featureinforefreshed', target: 'map', phase: 'before' });
                this.trigger({ type: 'selectobjects', target: 'map' });
            }
        },

        //fixme: selectObjects
        serviceObjectsSelection() {
            return this.objectSelectionManager.paintSelectedObjectsFlag;
        },

        setServiceObjectsSelection() {
            this.objectSelectionManager.paintSelectedObjectsFlag = true;
            this.tiles.wmsUpdate();
        },

        clearServiceObjectsSelection() {
            const totalflag = this.serviceObjectsSelection();
            this.objectSelectionManager.paintSelectedObjectsFlag = false;
            if (totalflag !== this.serviceObjectsSelection()) {
                this.tiles.wmsUpdate();
            }
        },
        hasObjectsSelection() {
            return (this.getSelectedObjects().length !== 0) || !!this.getActiveObject();
        },

        /**
         * Получить экземпляр отрисовщика SVG
         * @method getVectorRenderer
         * @return {SVGrenderer} Отрисовщик SVG
         */
        getVectorRenderer() {
            if (!this.vectorRenderer) {
                this.vectorRenderer = new SVGrenderer(this);
            }
            return this.vectorRenderer;
        },

        /**
         * Получить токен доступа
         * @method getToken
         * @returns {string} токен
         */
        getToken: function() {
            if (typeof this.options.tokens === "undefined") {
                return false;
            }
            return this.options.tokens.token();
        },

        /**
         * Получить токен доступа для слоя
         * @method getToken
         * @returns {string} токен
         */
        getLayerToken: function(id) {
            var layer = this.tiles.getLayerByxId(id);
            if (layer === null) {
                return false;
            }
            if (layer.options["token"] !== undefined && layer.options["token"]) {
                return this.getToken();
            }
            return false;
        },

        /**
         * Получить признак объединения wms-запросов
         * @method mergeWmsLayers
         * @return {boolean} `true` - изображения слоев с одного сервера получаются в одном запросе,
         *                   'false' - для каждого слоя выполнится отдельный запрос.
         * @public
         */
        mergeWmsLayers: function() {
            return this.options.mergewmslayers || false;
        },

        /**
         * Установить курсор карты
         * @method setCursor
         * @param cursor {String} новый курсор
         * @return {String} старый курсор
         */
        setCursor: function(cursor) {
            if (!this.options) return "";
            this.options.oldcursor = $(this.mouseDevicePane).css('cursor');
            $(this.mouseDevicePane).css('cursor', cursor);
            return this.options.oldcursor;
        },

        /**
         * Установить вид карты
         * @method setView
         * @param center {MapPoint} координаты центра отображаемого фрагмента, [широта, долгота]
         * @param zoom {Number} масштабный коэффициент (уровень матрицы тайлов)
         */
        setView: function(center, zoom) {
            if (center != null) {
                this._toLatLngCenter(center);
            }

            if (zoom != null && !isNaN(zoom) && zoom >= 0) {
                var z = this.zoomLimit(zoom);
                if (z !== this.options.tilematrix) {
                    this.options.tilematrix = z;
                }
            }

            this._setMapCenter();

            this.showMap();
        },

        /**
         * Установить координаты центра
         * @method _toLatLngCenter
         * @param center {MapPoint} координаты центра фрагмента, [широта, долгота]
         * @return {Boolean} `true`/`false`, выполнено/не выполнено
         */
        _toLatLngCenter: function(center) {
            if (!center && !(center instanceof MapPoint)) {
                return false;
            }
            if (!this.options) {
                return false;
            }

            this.setMapCenter(center);

            return true;
        },


        /**
         * Установить положение просмотра
         * @method setViewport
         * @param center {MapPoint} координаты центра отображаемого фрагмента, [широта, долгота]
         */
        setViewport: function(center) {

            if (!center || this.mapCenterPoint.equals(center)) {
                this._setMapCenter();
                return;
            }

            // Проверка на выход за пределы max габаритов карты
            if (this.maxBounds && !this.maxBounds.contains(center)) {
                return;
            }

            this._toLatLngCenter(center);

            this._setMapCenter();

            this.showMap();

            this.overlayRefresh('move');
        },

        /**
         * Установить положение центра отображаемого фрагмента карты
         * @method setMapCenter
         * @param center {MapPoint} прямоугольные координаты центра отображаемого фрагмента (x,y), метры
         * @param [refresh] {bool} признак обновления рисунка карты
         */
        setMapCenter: function(center, refresh) {
            if (!center) return;
            this.tileMatrix.fitPointToMatrixSystem(center);

            const newMapCenter = center.toMapPoint(this.ProjectionId);
            this.mapCenterPoint.x = newMapCenter.x;
            this.mapCenterPoint.y = newMapCenter.y;
            this.mapCenterPoint.h = newMapCenter.h;

            this._setMapCenter();
            if (refresh)
                this.showMap();
        },

        /**
         * Установить положение центра отображаемого фрагмента карты по значениям координат центра в параметрах карты
         * @method _setMapCenter
         * @return {MapPoint} прямоугольные координаты центра отображаемого фрагмента (x,y)
         */
        _setMapCenter: function() {
            if (!this.options) {
                return null;
            }

            if (this.maxBounds) {
                this.maxBounds.fitPoint(this.mapCenterPoint);
            }

            this.mapcenter = this.mapCenterPoint;

            this.workspaceManager.setValue(VIEW_SETTINGS_MAPCENTER, this.mapCenterPoint);
        },

        /**
         * Установить масштаб отображения карты
         * @method setZoom
         * @param zoom {Number} масштабный коэффициент (уровень матрицы тайлов)
         */
        setZoom: function(zoom) {

            if (this.objectManager) {
                this.objectManager.clickData.clearPickPoint();
            }

            if (typeof (zoom) == 'undefined') {
                return;
            }

            zoom = this.zoomLimit(zoom);

            // var ratio = this.getZoomingRatio(zoom);

            //Kozhanov	+ 29.10.2015
            var prevGeoBounds = this.getMapGeoBounds(true),
                oldZoom = this.options.tilematrix;

            //this.options.tilematrix = zoom;

            this.setView(null, zoom);

            //Kozhanov	+ 29.10.2015
            var newGeoBounds = this.getMapGeoBounds(true);

            //Kozhanov	+ 12.11.2015
            if (oldZoom && this.options.tilematrix && oldZoom !== this.options.tilematrix) {
                this._invoke('zoomchanged',
                    {
                        from: oldZoom,
                        to: this.options.tilematrix,
                        oldBounds: prevGeoBounds,
                        newBounds: newGeoBounds
                    }
                );
            }

            this.overlayRefresh('zoom');
        },

        /**
         * Вывести в панель масштаб отображения карты
         * @method setScaleUI
         */
        setScaleUI: function() {
            // if (this.panes.scalePane) {
            //     var scale = parseInt(this.getZoomScale(this.options.tilematrix), 10);
            //     this.panes.scalePane.innerHTML = '1 : ' + GWTK.Util.formatting(scale, '');
            // }
        },

        /**
         * Запросить масштаб отображения карты для уровня матрицы тайлов
         * @method getZoomScale
         * @return {number} масштаб карты
         */
        getZoomScale: function(zoom) {
            var scale = 0;
            if (zoom === undefined) return scale;
            zoom = this.zoomLimit(zoom);

            if (zoom < this.tileMatrix.Ogc.ScaleDenominator.length)
                scale = this.tileMatrix.Ogc.ScaleDenominator[zoom];
            return scale;
        },

        /**
         * Запросить масштабный коэффициент (уровень матрицы тайлов) для масштаба
         * @method getScaleZoom
         * @param scale {Number} масштаб
         * @return {Number} масштабный коэффициент (уровень матрицы тайлов)
         */
        getScaleZoom: function(scale) {
            // var zoom = 1;
            if (!scale) return -1;
            var i, len = this.tileMatrix.Ogc.ScaleDenominator.length;
            for (i = 0; i < len; i++) {
                if (this.tileMatrix.Ogc.ScaleDenominator[i] > scale) continue;
                return i;
            }
            return -1;
        },

        /**
         * Выполнить масштабирование в точке с указанным приращением масштаба
         * @method zooming
         * @param delta {Number} приращение масштаба (шаг)
         * @param pos {GWTK.Point} координаты точки в окне карты (pixel)
         */
        zooming: function(delta, pos) {
            if (this.tiles === undefined) return;

            if (!delta)
                delta = 1;

            if (!pos) {
                return this.setZoom(parseInt(this.options.tilematrix, 10) + delta);
            }

            // масштабирование, сохраняем положение карты в точке (pos)
            var point = pos;                                               // координаты точки в окне карты (pixel)
            var coord = this.pixelToPlane(point);         // координаты точки point в проекции карты

            var zoom = parseInt(this.getZoom()) + delta;
            zoom = this.zoomLimit(zoom);                                       // новый масштаб
            if (zoom === this.getZoom()) {
                return;
            }

            var mapCord = coord.clone();

            var tiles = this.tileMatrix.getPixelInMatrixByPoint(zoom, mapCord);     // пикселы в точке coord в приближении zoom
            Cartesian2D.swapAxis(tiles, tiles);
            var size = this.getSize().divideBy(2),
                center = size.subtract(point);   // смещение точки point от центра (пиксели)

            center.add(tiles, center);                        // пикселы центра (на расстоянии delta от point)

            // установить центр, масштаб
            this.setMapCenter(this.tileMatrix.getPointByPixel(center, zoom));

            this.setZoom(zoom);

            this.tiles._getMaxFramePicture();
        },


        /**
         * Запросить коэффициент изменения текущего масштаба
         * @method getZoomingRatio
         * @param zoomto {Number} уровень приближения матрицы тайлов
         */
        getZoomingRatio: function(zoomto) {
            if (!zoomto) return 1;
            var scaleCurr = this.getZoomScale(this.options.tilematrix);
            var scaleTo = this.getZoomScale(zoomto);
            if (scaleCurr > 0)
                return parseFloat(scaleCurr) / parseFloat(scaleTo);
            return 1;
        },

        /**
         * Увеличить изображение карты
         * @method zoomIn
         * @param delta {Number} шаг увеличения
         */
        zoomIn: function(delta) {
            return this.setZoom(parseInt(this.options.tilematrix, 10) + parseInt((delta || 1), 10));
        },

        /**
         * Уменьшить изображение карты
         * @method zoomOut
         * @param delta {Number} шаг уменьшения
         */
        zoomOut: function(delta) {
            return this.setZoom(parseInt(this.options.tilematrix, 10) - parseInt((delta || 1), 10));
        },

        /**
         * Границы масштабирования изображения карты
         * @method zoomLimit
         * @param zoom {Number} масштабный коэффициент (уровень матрицы тайлов)
         */
        zoomLimit: function(zoom) {
            if (!this.options) return null;

            var max = this.tileMatrix.Ogc.ScaleDenominator.length,
                min;
            this.options.maxzoom !== undefined ? max = this.options.maxzoom : max--;
            this.options.minzoom !== undefined ? min = this.options.minzoom : min = 2;

            if (zoom > max) zoom = max;
            if (zoom < min) zoom = min;

            return zoom;
        },

        /**
         * Изменить размер окна карты
         * @method resizing
         */
        resizing: function() {

            this._sizeChanged = true;

            if (this._sizeTimer) {
                clearTimeout(this._sizeTimer);
                this._sizeTimer = undefined;
            }
            this._sizeTimer = setTimeout(this.onResizeEnd, 100);

            // размер изображений
            this.tiles.resizeCanvas();

            // обновить тайлы
            for (var i = 0; i < this.layers.length; i++) {
                if (this.layers[i].getType() !== 'tile') {
                    continue;
                }
                this.layers[i].updateView();
            }

            // нарисовать
            this.tiles.drawMapImage(false, true, false);
        },

        /**
         * Окончане изменения размера окна карты
         * @method onResizeEnd
         */
        onResizeEnd: function() {
            this._sizeTimer = false;
            if (this._wmsEnabled()) {
                this.tiles.wmsManager._update();
            }
            this.overlayRefresh('resize');
            this._sizeChanged = false;
        },

        /**
         * Начало изменения размера окна карты
         * @method onResizeStart
         */
        onResizeStart: function() {
            if (this._sizeChanged || !this.tiles || !this.tiles.wmsManager) {
                return;
            }
            this.tiles.wmsManager.onMapDragStart();
        },

        // /**
        //  * Установить тип матрицы тайлов
        //  * @method setMatrix
        //  * @param tilematrixset {String} имя матрицы тайлов
        //  */
        // setMatrix: function(tilematrixset) {
        //     if (!tilematrixset) return;
        //     // if (!(tilematrixset in GWTK.TileMatrixSets)) return;
        //     var tmsValue = GWTK.TileMatrixSets[tilematrixset];
        //     this.options.tilematrixset = tilematrixset;
        //     this.options.crs = parseInt(tmsValue.crs);
        //     return;
        // },

        /**
         * Отобразить карту
         * @method showMap
         */
        showMap: function() {
            if (this.tiles) this.tiles.forceupdate();
            return true;
        },

        /**
         * Отобразить экстент карты в текущем окне
         * @method showMapExtent
         * @param  a,b {Number,Number} геодезичесие координаты юго-западного угла экстента, (lat,lng, градусы)
         * @param  c,d {Number,Number} геодезичесие координаты северо-восточного угла экстента (lat,lng, градусы)
         * @param roundedup {bool} признак округления масштаба в большую сторону.
         * Функция масштабирует карту, чтобы вписать экстент в окно.
         * Если для карты установлен максимальный масштаб отображения, он не превышается.
         * @return {Number} 1 -выполнено, 0 -ошибка параметров, -1 -экстент вне габаритов карты
         */
        // ==============================================================
        showMapExtent: function(a, b, c, d, roundedup) {
            var max_latitude = 85.1;

            const matrix = this.Translate.getTileMatix();

            if (matrix) {
                const frameMaxPoint = matrix.Ogc.NormalFrame.max;

                const mapPoint = new MapPoint(frameMaxPoint.x, frameMaxPoint.y, 0, this.ProjectionId);
                const geoPoint = mapPoint.toGeoPoint();
                if (geoPoint) {
                    max_latitude = geoPoint.getLatitude();
                }
            }
            var tilesize = matrix.getTileSize();

            var sign;
            a < 0 ? sign = -1 : sign = 1;
            if (Math.abs(a) > max_latitude) a = max_latitude * sign;
            c < 0 ? sign = -1 : sign = 1;
            if (Math.abs(c) > max_latitude) c = max_latitude * sign;

            var sw = new GeoPoint(b, a, 0, this.ProjectionId).toMapPoint();
            var ne = new GeoPoint(d, c, 0, this.ProjectionId).toMapPoint();
            if (!sw || !ne) return 0;

            var xyBounds = new Bounds(sw, ne);

            if (this.maxBounds) {               // проверить входит ли фрагмент в макс. габариты карты
                if (!this.maxBounds.contains(xyBounds)) {
                    return -1;
                }
            }
            var center = xyBounds.getCenter(), zoom,              // центр фрагмента
                maxzoom = matrix.Ogc.ScaleDenominator.length - 1;
            if (this.options.maxzoom) maxzoom = this.options.maxzoom;     // предел масштабирования


            // максимальное значение из размера окна карты (w, h)
            var wh = this.getWindowSize(),
                pix_win_H = parseInt(wh[1], 10),                          // высота окна (пиксел)
                pix_win_W = parseInt(wh[0], 10);                          // ширина окна


            // const boundsMin = xyBounds.min

            // габариты экстента в метрах
            var dx = Math.abs(xyBounds.max.x - xyBounds.min.x),     // ширина фрагмента (m)
                dy = Math.abs(xyBounds.max.y - xyBounds.min.y);     // высота фрагмента (m)

            // zoom = 0;
            var equator = 2 * Math.PI * this.Translate.BigAxis,
                pixel_size = equator / tilesize,                     // m/pix, zoom=0
                m_zoom_W = pixel_size * pix_win_W,                   // m в окне по горизонтали при zoom=0
                m_zoom_H = pixel_size * pix_win_H;                   // m в окне по вертикали при zoom=0

            zoom = Math.max(m_zoom_W / dx, m_zoom_H / dy);
            if (roundedup)
                zoom = Math.floor(Math.log(zoom) / Math.log(2) + 1);
            else
                zoom = Math.floor(Math.log(zoom) / Math.log(2) - 1);

            if (zoom < 2) zoom = 2;
            if (zoom > maxzoom) zoom = maxzoom;                 // берем максимально возможный, если превышение

            const mapCenter = new MapPoint(center.x, center.y, 0, this.ProjectionId);

            this.setView(mapCenter, zoom);                // отобразить

            this.overlayRefresh('zoom');                        // обновить оверлеи

            return 1;
        },

        /**
         * Отобразить экстент карты в текущем окне
         * @method showMapExtentPlane
         * @param  boundsMapLeft {MapPoint} координаты юго-западного угла экстента, (метры)
         * @param  boundsMapRight {MapPoint} координаты северо-восточного угла экстента , (метры)
         * Функция масштабирует карту, чтобы вписать экстент в окно.
         * Если для карты установлен максимальный масштаб отображения, он не превышается.
         * @return {number} 1 -выполнено, -1 -экстент вне габаритов карты
         */
        showMapExtentPlane: function(boundsMapLeft, boundsMapRight) {
            const matrix = this.Translate.getTileMatix();
            const xyBounds = new Bounds(boundsMapLeft, boundsMapRight);

            if (this.maxBounds && !this.maxBounds.contains(xyBounds)) {   // проверить входит ли фрагмент в макс. габариты карты
                return -1;
            }
            const center = xyBounds.getCenter();               // центр фрагмента
            let maxZoom = matrix.Ogc.ScaleDenominator.length - 1;
            if (this.options.maxzoom) {
                maxZoom = this.options.maxzoom;     // предел масштабирования
            }

            // максимальное значение из размера окна карты (w, h)
            const wh = this.getWindowSize();
            const pix_win_H = parseInt(wh[1], 10);                          // высота окна (пиксел)
            const pix_win_W = parseInt(wh[0], 10);                          // ширина окна

            // габариты экстента в метрах
            const dxFrame = Math.abs(xyBounds.max.x - xyBounds.min.x);
            const dyFrame = Math.abs(xyBounds.max.y - xyBounds.min.y);

            let zoom = 2;
            for (let numberScale = maxZoom; numberScale > 1; numberScale--) {
                const w = dxFrame / this.tileMatrix.getPixelSpan(numberScale);
                const h = dyFrame / this.tileMatrix.getPixelSpan(numberScale);
                if (w < pix_win_W && h < pix_win_H) {
                    // оставляем zoom
                    zoom = numberScale;
                    break;
                }
            }
            const mapCenter = new MapPoint(center.x, center.y, 0, this.ProjectionId);

            this.setView(mapCenter, zoom);

            this.overlayRefresh('zoom');

            return 1;
        },

        /**
         * Вписать прямоугольник в окно карты
         * @method fitBounds
         * @param  bounds {Bounds} Ограничивающий прямоугольник (градусы)
         * Функция масштабирует карту, чтобы вписать прямоугольник в окно.
         * Если для карты установлен максимальный масштаб отображения, он не превышается.
         * @return {Number} 1 -выполнено, 0 -ошибка параметров, -1 -экстент вне габаритов карты
         */
        fitBounds(bounds) {

            const viewData = this.getGeoCenterAndZoom(bounds);

            this.setView(viewData.center, viewData.zoom);                // отобразить

            this.overlayRefresh('zoom');                        // обновить оверлеи

            return 1;
        },


        /**
        * Вписать объект карты в окно карты
        * @method fitMapObject
        * @param  mapObject {MapObject} объект карты
        * Функция масштабирует карту, чтобы вписать прямоугольник в окно.
        */
        async fitMapObject(mapObject, force = false) {
            this.writeDebugLog();
            if (!mapObject.newFlag) {
                await mapObject.loadGeometry().catch(e => {
                    this.writeProtocolMessage({
                        type: LogEventType.Error,
                        text: this.translate('mapeditor.Error getting object geometry'),
                        description: e || mapObject.objectName || mapObject.gmlId
                    });
                })
            }

            if(!force) {
                const scale = this.getZoomScale(this.getZoom());
                if ((mapObject.bottomScale !== undefined && scale < mapObject.bottomScale) || (mapObject.topScale !== undefined && scale > mapObject.topScale)) {
                    force = true;
                }
            }

            if (force || !this.getWindowBounds().contains(mapObject.getBounds())) {
                const pointTargetZoom = Math.max(18, this.options.tilematrix);
                const viewData = this.getGeoCenterAndZoom(mapObject.getBounds());

                if (mapObject.type === MapObjectType.Point) {
                    viewData.zoom = pointTargetZoom;
                }

                let scale = this.getZoomScale(viewData.zoom);

                if (mapObject.bottomScale) {
                    scale = Math.max(scale, mapObject.bottomScale);
                }

                if (mapObject.topScale) {
                    scale = Math.min(scale, mapObject.topScale);
                }

                const validZoom = this.getScaleZoom(scale);

                this.setView(viewData.center, validZoom);

                this.overlayRefresh('zoom');
            }
        },

        /**
         * Выделить объекты полученные по идентификаторам
         * @method selectMapObjectsByIdList
         * @param idLayer {string} Идентификатор слоя на сервисе
         * @param objectIds {string[]} Идентификаторы объектов
         * @return mapObjects {mapObject[]} Массив mapObject
         */
        async selectMapObjectsByIdList(idLayer, objectIds) {
            const result = await this.getObjectsByIdList(idLayer, objectIds);
            if (result) {
                this.addSelectedObjects(result.mapObjects);
                return result.mapObjects;
            }
        },

        /**
         * Найти объект по семантическому фильтру
         * @async
         * @method findMapObjectByFilter
         * @param filter {{layerId: string, attrKey: string, attrValue:string}} Фильтр объекта
         */
        async findMapObjectByFilter(filter) {
            const layers = [];
            const layer = this.tiles.getLayerByxId(filter.layerId);
            if (layer) {
                layers.push(layer);
            }
            if (layers.length > 0) {

                if (filter.attrKey==='id') {
                    const result = await this.searchManager.findByIdList(layer, [filter.attrValue]);
                    if (result.mapObjects && result.mapObjects.length) {
                        return result.mapObjects[0];
                    }
                } else {

                    this.searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.All, layers);
                    this.searchManager.clearSearchCriteriaAggregator();


                    // Создать копию критериев
                    const criteriaAggregatorCopy = this.searchManager.getSearchCriteriaAggregatorCopy();

                    const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
                    srsNameSearchCriterion.setValue(this.getCrsString());

                    const semanticsCriterion = criteriaAggregatorCopy.getSemanticSearchCriterion();

                    semanticsCriterion.addSemanticCriterion({
                        key: filter.attrKey,
                        operator: SemanticOperator.ContainsValue,
                        value: filter.attrValue
                    });

                    // Отправить запрос для получения отфильтрованного ответа
                    this.searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);
                    try {
                        const result = await this.searchManager.findNext();
                        if (result && result.mapObjects && result.mapObjects.length) {
                            return result.mapObjects[0];
                        }
                    } catch (e) {
                        this.writeProtocolMessage({
                            type: LogEventType.Error,
                            text: this.translate('Error getting object'),
                            description: e
                        });
                    }
                }
            } else {
                this.writeProtocolMessage({
                    type: LogEventType.Error,
                    text: this.translate('Map layers not found'),
                    description: filter.layerId
                });
            }
        },

        /**
         * Вписать выделенные объекты карты
         * @method fitSelectedObjects
         */
        fitSelectedObjects() {
            const mapObjects = this.getSelectedObjects();

            if (mapObjects.length === 1 && mapObjects[0].type === MapObjectType.Point) {
                this.fitMapObject(mapObjects[0]);
            } else {
                let bounds;
                for (let mapObject of mapObjects) {
                    if (!bounds) {
                        bounds = mapObject.getBounds();
                    } else {
                        const boundsObject = mapObject.getBounds();

                        bounds.extend(boundsObject.min);
                        bounds.extend(boundsObject.max);
                    }
                }
                if (bounds) {
                    this.fitBounds(bounds);
                }
            }
        },

        selectGeoJSON(json) {

            const layer = new GeoJsonLayer(this, {
                alias: 'External source',
                id: Utils.generateGUID(),
                url: ''
            }, {crs: {type: 'name', properties: {name: 'OGC:CRS84'}}, ...json});

            const mapObjects = layer.getAllMapObjects();
            this.addSelectedObjects(mapObjects.slice());

            this.requestRender();
        },

        /**
         * Отобразить окно "Информация об объекте"
         * @method showObjectInfoFromGeoJSON
         * @param geoJson {GeoJsonType} описание объекта в формате GeoJSON
         * @param [action] {'opencard' | 'fitmapobject' | 'opencardandfitobject'} Ограничение действий:
         * 'opencard' - только открыть карточку и выделить объект;
         * 'fitmapobject' - только выделить и перейти к объекту;
         * 'opencardandfitobject' - открыть карточку, выделить и перейти к объекту
         * @param [force] {boolean} Принудительное масштабирование к объекту и позиционирование в его центре
         */
        showObjectInfoFromGeoJSON(geoJson, action='', force = false) {
            const taskManager = this.getTaskManager();
            if (taskManager) {
                const tempVectorLayer = VectorLayer.getEmptyInstance(this);
                const mapObject = MapObject.fromJSON(tempVectorLayer, geoJson.features[0]);
                mapObject.isValidGisObject = geoJson.features.length > 0 && geoJson.features[0].geometry?.coordinates?.length > 0;
                this.showObjectInfo(mapObject, action, force);
            }
        },

        /**
         * Отобразить окно "Информация об объекте"
         * @method showObjectInfoByFilter
         * @param filter {{layerId: string, attrKey: string, attrValue:string}} Фильтр объекта
         * @param [action] {'opencard' | 'fitmapobject' | 'opencardandfitobject'} Ограничение действий:
         * 'opencard' - только открыть карточку и выделить объект;
         * 'fitmapobject' - только выделить и перейти к объекту;
         * 'opencardandfitobject' - открыть карточку, выделить и перейти к объекту
         * @param [force] {boolean} Принудительное масштабирование к объекту и позиционирование в его центре
         */
        showObjectInfoByFilter(filter, action='', force = false) {
            this.findMapObjectByFilter(filter).then(mapObject=>{
                if(mapObject){
                    this.showObjectInfo(mapObject, action, force)
                }
            });
        },



        /**
         * Отобразить окно "Информация об объекте"
         * @method showObjectInfo
         * @param mapObject {MapObject} Объект карты
         * @param [action] {'opencard' | 'fitmapobject' | 'opencardandfitobject'} Ограничение действий:
         * 'opencard' - только открыть карточку и выделить объект;
         * 'fitmapobject' - только выделить и перейти к объекту;
         * 'opencardandfitobject' - открыть карточку, выделить и перейти к объекту
         * @param [force] {boolean} Принудительное масштабирование к объекту и позиционирование в его центре
         */
        async showObjectInfo(mapObject, action= '', force = false){
            if(!mapObject.hasGeometry()){
                await mapObject.loadGeometry();
            }
            switch (action.toLowerCase()) {
                case 'opencard':
                    this.hideObjectInfo();
                    this.getTaskManager().showObjectPanelInfo(mapObject);
                    break;
                case 'fitmapobject':
                    this.addSelectedObject(mapObject);
                    this.fitMapObject(mapObject, force);
                    break;
                case 'opencardandfitobject':
                    this.hideObjectInfo();
                    this.getTaskManager().showObjectPanelInfo(mapObject);
                    this.addSelectedObject(mapObject);
                    this.fitMapObject(mapObject, force);
                    break;
                default:
                    this.setActiveObject(mapObject);
                    this.getTaskManager().showObjectPanel(MapObjectPanelState.showInfo, true);
                    break;
            }
        },

        /**
         * Отобразить окно "Редактирование объекта"
         * @method showObjectEdit
         * @param mapObject {MapObject} Объект карты
         * @param [action] {'opencard' | 'fitmapobject' | 'opencardandfitobject'} Ограничение действий:
         * 'opencard' - только открыть карточку и выделить объект;
         * 'fitmapobject' - только выделить и перейти к объекту;
         * 'opencardandfitobject' - открыть карточку, выделить и перейти к объекту
         * @param [force] {boolean} Принудительное масштабирование к объекту и позиционирование в его центре
         */
        async showObjectEdit(mapObject, action= '', force = false){
            if(!mapObject.hasGeometry()){
                await mapObject.loadGeometry();
            }

            switch (action.toLowerCase()) {
                case 'opencard':
                    this.hideObjectInfo();
                    this.getTaskManager().showObjectPanelEdit(mapObject);
                    break;
                case 'fitmapobject':
                    this.addSelectedObject(mapObject);
                    this.fitMapObject(mapObject, force);
                    break;
                case 'opencardandfitobject':
                    this.hideObjectInfo();
                    this.getTaskManager().showObjectPanelEdit(mapObject);
                    this.addSelectedObject(mapObject);
                    this.fitMapObject(mapObject, force);
                    break;
                default:
                    this.setActiveObject(mapObject);
                    this.getTaskManager().showObjectPanel(MapObjectPanelState.showEditor, true);
                    break;
            }
        },

        /**
         * Скрыть окно "Информация об объекте"
         * @method hideObjectInfo
         */
        hideObjectInfo() {
            this.taskManagerNew.hideObjectPanel();
        },

        /**
         * Найти объекты на карте по строке
         * @method searchInMapByText
         * @param text {string} строка
         */
        async searchInMapByText( text) {
            const visibleByScale = true;

            const sourceType = SourceType.GISWebServiceSE;

            const searchManager = this.searchManager;

            let geoPoint;
            const regex = /(\d+\.\d*)[,\s](\d+\.\d*)/gm;
            const m = regex.exec(text);
            if (m && m[1] !== undefined && m[2] !== undefined) {
                geoPoint = new GeoPoint(parseFloat(m[1]), parseFloat(m[2]));
            }

            if (sourceType === SourceType.GISWebServiceSE && geoPoint) {
                const point = this.geoToPixel(geoPoint);
                searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.StrictSearch, undefined, point);

            } else {
                searchManager.activateSource(sourceType, GISWebServiceSEMode.TextSearch);
            }

            searchManager.clearSearchCriteriaAggregator();
            const criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();


            if (sourceType === SourceType.GISWebServiceSE && geoPoint) {

                const point = this.geoToPixel(geoPoint);

                const radius = this.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS);

                const leftBottomPoint = point.clone();
                leftBottomPoint.x -= radius;
                leftBottomPoint.y += radius;
                const leftBottomPlanePoint = this.pixelToPlane(leftBottomPoint);

                const rightTopPoint = point.clone();
                rightTopPoint.x += radius;
                rightTopPoint.y -= radius;
                const rightTopPlanePoint = this.pixelToPlane(rightTopPoint);

                const bboxSearchCriterion = criteriaAggregatorCopy.getBboxSearchCriterion();
                bboxSearchCriterion.clearValue();
                const bounds = new Bounds(leftBottomPlanePoint, rightTopPlanePoint);
                bboxSearchCriterion.setValue(bounds);
                criteriaAggregatorCopy.setBboxSearchCriterion(bboxSearchCriterion);
            } else {
                const textSearchCriterion = criteriaAggregatorCopy.getTextSearchCriterion();
                textSearchCriterion.addTextSearchKey(['Text'], text);
                criteriaAggregatorCopy.setTextSearchCriterion(textSearchCriterion);
            }

            if (visibleByScale) {
                const scale = this.getZoomScale(this.getZoom());
                if (scale) {
                    const scaleCriterion = criteriaAggregatorCopy.getObjectScaleSearchCriterion();
                    scaleCriterion.setValue(scale);
                    criteriaAggregatorCopy.setObjectScaleSearchCriterion(scaleCriterion);
                }
            }

            criteriaAggregatorCopy.getMetricCriterion().setValue(METRIC.AddMetric);

            const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
            srsNameSearchCriterion.setValue(this.getCrsString());

            const countSearchCriterion = criteriaAggregatorCopy.getCountSearchCriterion();
            countSearchCriterion.setValue(0);

            searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

            let result;
            try {
                const data = await searchManager.findNext();
                const geoJson = new GeoJSON({ type: 'FeatureCollection', crs: { type: 'name', properties: { name: this.getCrsString() } }, features: [] });
                if (data) {
                    for (const feature of data.mapObjects) {
                        geoJson.addFeature(feature.toJSON());
                    }
                }
                result = geoJson.featureCollection;
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.writeProtocolMessage({
                    text: this.translate('Search') + ': ' + gwtkError.message,
                    type: LogEventType.Error
                });
            }

            return result;
        },

        /**
         * Найти объекты на карте по GeoJSON
         * @function searchInMapByGeoJSON
         * @param geojson {GeoJsonType} GeoJSON области
         */
         async searchInMapByGeoJSON(geojson) {
            const visibleByScale = true;

            const searchManager = this.searchManager;

            searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.AreaSearch);
            searchManager.clearSearchCriteriaAggregator();
            const criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();

            const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
            srsNameSearchCriterion.setValue(this.getCrsString());

            const areaCrossMethod = criteriaAggregatorCopy.getCrossMethodSearchCriterion();
            areaCrossMethod.setValue('AREASEEKCROSSSQUARE');
            criteriaAggregatorCopy.setCrossMethodSearchCriterion(areaCrossMethod);

            if (visibleByScale) {
                const scale = this.getZoomScale(this.getZoom());
                if (scale) {
                    const scaleCriterion = criteriaAggregatorCopy.getObjectScaleSearchCriterion();
                    scaleCriterion.setValue(scale);
                    criteriaAggregatorCopy.setObjectScaleSearchCriterion(scaleCriterion);
                }
            }

            const searchAreaDataCriterion = criteriaAggregatorCopy.getFileDataCriterion();
            searchAreaDataCriterion.setValue(geojson);
            criteriaAggregatorCopy.setFileDataCriterion(searchAreaDataCriterion);

            criteriaAggregatorCopy.getMetricCriterion().setValue(METRIC.AddMetric);

            searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

            const countSearchCriterion = criteriaAggregatorCopy.getCountSearchCriterion();
            countSearchCriterion.setValue(0);

            searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

            let result;
            try {
                const data = await searchManager.findNext();
                const geoJson = new GeoJSON({ type: 'FeatureCollection', crs: { type: 'name', properties: { name: this.getCrsString() } }, features: [] });
                if (data) {
                    for (const feature of data.mapObjects) {
                        geoJson.addFeature(feature.toJSON());
                    }
                }
                result = geoJson.featureCollection;
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.writeProtocolMessage({
                    text: this.translate('Search') + ': ' + gwtkError.message,
                    type: LogEventType.Error
                });
            }

            return result;
        },

        getGeoCenterAndZoom(bounds) {
            let max_latitude = 85.1;
            const matrix = this.Translate.getTileMatix();

            if (matrix) {
                const frameMaxPoint = matrix.Ogc.NormalFrame.max;

                const mapPoint = new MapPoint(frameMaxPoint.x, frameMaxPoint.y, 0, this.ProjectionId);
                const geoPoint = mapPoint.toGeoPoint();
                if (geoPoint) {
                    max_latitude = geoPoint.getLatitude();
                }
            }

            const minPoint = bounds.min;
            const minGeoPoint = minPoint.toGeoPoint();
            const maxPoint = bounds.max;
            const maxGeoPoint = maxPoint.toGeoPoint();


            if (!minGeoPoint || !maxPoint) {
                return;
            }

            // let [minLongitude, minLatitude] = bbox.getMinimum();
            // let [maxLongitude, maxLatitude] = bbox.getMaximum();

            let minLongitude = minGeoPoint.getLongitude();
            let minLatitude = minGeoPoint.getLatitude();

            let maxLongitude = maxGeoPoint.getLongitude();
            let maxLatitude = maxGeoPoint.getLatitude();

            // проверка широты
            if (Math.abs(minLatitude) > max_latitude) {
                minLatitude = minLatitude < 0 ? -max_latitude : max_latitude;
            }

            if (Math.abs(maxLatitude) > max_latitude) {
                maxLatitude = maxLatitude < 0 ? -max_latitude : max_latitude;
            }

            // Проверка по габаритам карты
            const sw = GWTK.toLatLng(minLatitude, minLongitude);
            const ne = GWTK.toLatLng(maxLatitude, maxLongitude);
            if (!sw || !ne) return 0;

            const latLngBounds = new GWTK.LatLngBounds(sw, ne);                   // габариты фрагмента
            if (!latLngBounds) return 0;

            if (this.maxBounds) {               // проверить входит ли фрагмент в макс. габариты карты
                const swMapPoint = new GeoPoint(sw.lng, sw.lat, 0, this.ProjectionId).toMapPoint();
                const neMapPoint = new GeoPoint(ne.lng, ne.lat, 0, this.ProjectionId).toMapPoint();

                if (!this.maxBounds.contains(new Bounds(swMapPoint, neMapPoint))) {
                    return -1;
                }
            }

            //вычисление удовлетворяющего масштаба
            const minGeo = new GeoPoint(minLongitude, minLatitude);
            const maxGeo = new GeoPoint(maxLongitude, maxLatitude);

            const wh = this.getWindowSize();

            let zoom = this.options.tilematrix;

            for (let i = matrix.Ogc.ScaleDenominator.length - 1; i >= 0; i--) {
                const minPixel = this.geoToPixel(minGeo, i);
                const maxPixel = this.geoToPixel(maxGeo, i);
                if (wh[0] > (maxPixel.x - minPixel.x) && wh[1] > (minPixel.y - maxPixel.y)) {
                    zoom = i
                    break;
                }
            }

            // Проверка по допустимым масштабам
            if (this.options.maxzoom && zoom > this.options.maxzoom) {
                zoom = this.options.maxzoom;                 // берем максимально возможный, если превышение
            }

            if (zoom < 2) {
                zoom = 2;
            }

            const center = latLngBounds.getCenter();
            const geoCenter = new GeoPoint(center.lng, center.lat, center.alt, this.ProjectionId);

            return { center: geoCenter.toMapPoint(), zoom};
        },

        /**
         * Сохранить положение карты в cookie
         * @method fixView
         */
        fixView: function() {
            const initialExtentValue = {
                mapCenter: {
                    x: this.mapCenterPoint.x,
                    y: this.mapCenterPoint.y,
                    h: this.mapCenterPoint.h
                },
                zoomLevel: this.options.tilematrix
            };

            this.workspaceManager.setValue(INITIAL_EXTENT_SETTINGS, initialExtentValue);
        },

        /**
         * Восстановить положение карты
         * @method restoreView
         */
        restoreView: function() {
            const param = this.workspaceManager.getValue(INITIAL_EXTENT_SETTINGS);
            if (param) {
                this.setView(param.mapCenter, param.zoomLevel);
                this.overlayRefresh('zoom');
            }
        },

        /**
         * Восстановить состав карты
         * @method restoreMapContent
         */
        restoreMapContent() {
            const contentTree = this.contentTreeManager.contentTree;

            this.contentTreeManager.enableNodes(contentTree);
            for (let i = 0; i < this.layers.length; i++) {
                const layer = this.layers[i];

                if (this.contentTreeManager.isBackgroundLayer(layer.id)) {
                    continue;
                }

                const layerInitial = this.defaultMapOptions.layers.find((lay) => lay.id === layer.id);
                if (layerInitial && !layerInitial.hidden) {
                    this.setLayerVisibility(layer, true);
                    layer.options.opacity = layerInitial.opacityValue;
                } else {
                    this.setLayerVisibility(layer, false);
                    layer.options.opacity = 100;
                }
            }
            this.getTaskManager().onDataChanged({ type: 'resetlayersvisibility' });
            this.workspaceManager.setValue(PROJECT_SETTINGS_CONTENT_TREE_DISABLED_ARRAY, []);
            this.workspaceManager.writeProjectSettings();
        },

        /**
         * Восстановить картографические подложки
         * @method restoreBackgroundLayers
         */
        restoreBackgroundLayers() {
            const contentTree = this.contentTreeManager.contentTree;

            this.contentTreeManager.enableNodes(contentTree);
            for (let i = 0; i < this.layers.length; i++) {
                const layer = this.layers[i];

                if (this.contentTreeManager.isBackgroundLayer(layer.id)) {

                    const layerInitial = this.defaultMapOptions.layers.find((lay) => lay.id === layer.id);
                    if (layerInitial) {
                        this.setLayerVisibility(layer, true);
                        layer.options.opacity = layerInitial.opacityValue;
                    } else {
                        this.setLayerVisibility(layer, false);
                        layer.options.opacity = 100;
                    }

                }
            }

            const activeBackgroundId = this.contentTreeManager.getActiveBackGroundId();
            if (activeBackgroundId) {
                this.workspaceManager.setValue(PROJECT_SETTINGS_LAYERS_BACKGROUND_ACTIVE, activeBackgroundId);
            }

            this.getTaskManager().onDataChanged({ type: 'resetlayersvisibility' });
            this.workspaceManager.setValue(PROJECT_SETTINGS_CONTENT_TREE_DISABLED_ARRAY, []);
            this.workspaceManager.writeProjectSettings();
        },

        getShareLocation() {
            return window.location.toString().split('?')[0];
        },

        /**
         * Запросить ссылку на карту
         * @method getMapLink
         */
        getMapLink: function() {
            var objcard, objcardact, selectedObjectsByLayers;
            var zoom = '&z=' + this.options.tilematrix;
            var geoPoint = this.getCenterGeoPoint();
            var bl = "b=" + geoPoint.getLatitude().toFixed(6) + '&l=' + geoPoint.getLongitude().toFixed(6);
            var par = '?';
            var href = this.getShareLocation();
            var url = href + par + bl + zoom;
            var slay = this.tiles.getVisibleLayers(), i, lay = [],
                len = slay.length;
            var activeTask = this.workspaceManager.getValue(PROJECT_SETTINGS_ACTIVE_TASK_LIST);
            //выбор действия с несколькими выделенными объектами
            //все выделенные объекты
            if (this.getSelectedObjects().length) {
                objcardact = 'fitmapobject';
                selectedObjectsByLayers = this.getSelectedObjectsByLayers(this.getSelectedObjects());
                objcard = encodeURI(JSON.stringify(selectedObjectsByLayers));
            }

            const componentsDataForLink = this.getTaskManager().getComponentsDataForLink();
            //все выделенные объекты компонента Объекты карты
            if (componentsDataForLink) {
                for (const taskId in componentsDataForLink) {
                    const componentData = componentsDataForLink[taskId];
                    if (componentData.highlighted || componentData.selected) {
                        objcardact = 'opencard';
                        selectedObjectsByLayers = {};
                        if (componentData.highlighted) {
                            const highlightedObject = componentData.highlighted;
                            selectedObjectsByLayers[highlightedObject.vectorLayer.id] = [];
                            const cadastrNumber = highlightedObject.getSemanticValue('cn') || highlightedObject.getSemanticValue('number_zone') || highlightedObject.getSemanticValue('brd_id');
                            selectedObjectsByLayers[highlightedObject.vectorLayer.id].push(cadastrNumber || highlightedObject.objectNumber);
                        } else if (componentData.selected) {
                            const selectedObjectsFromMapObjectComponent = componentData.selected;
                            selectedObjectsByLayers = this.getSelectedObjectsByLayers(selectedObjectsFromMapObjectComponent);
                        }
                        objcard = encodeURI(JSON.stringify(selectedObjectsByLayers));
                    }
                }
            }
            //видимые слои
            for (i = 0; i < len; i++) {
                lay.push(encodeURIComponent(slay[i].xId));      // для кириллицы
            }
            if (this.options.id) {
                url += '&projectid=' + this.options.id;
            }
            if (this.selectedObjects.drawselobject && this.selectedObjects.drawselobject.gid) {
                var ol = this.tiles.getLayerByxId(this.selectedObjects.drawselobject.maplayerid);
                if (ol && ol.idLayer && ol.idLayer.length > 0) {
                    url += '&objid=' + encodeURIComponent(this.selectedObjects.drawselobject.gid);
                    url += '&ol=' + encodeURIComponent(ol.idLayer);
                }
            }
            var map3d = this.mapTool("3dMap");
            if (map3d) {
                url += map3d.createMapLink();
            }
            if (activeTask) {
                url += '&activetask=' + activeTask;
            }
            if (objcard) {
                url += '&objcard=' + objcard+'&objcardact=' + objcardact;
            }
            //ограничим длину строки со слоями
            let layerDisabledCount = 0;
            while (lay.toString().length + url.length > 2048 && lay.length > MAX_NUMBER_OF_LAYERS_IN_URL) {
                lay.pop();
                layerDisabledCount++;
            }
            lay = '&layers=' + lay.toString();
            url += lay;
            //если при допустимом числе слоев длина URL превышает 2048 символов,
            //то удалим часть выделенных объектов
            if (url.length > 2048) {
                var objectDisabledCount = 0;
                const urlParts = url.split('&');
                const resultParts = [];
                for (let i = 0; i < urlParts.length; i++) {
                    if (!urlParts[i].startsWith('objcard=')) {
                        resultParts.push(urlParts[i]);
                    }
                }
                url = resultParts.join('&');
                if (selectedObjectsByLayers) {
                    let selectedLayers = Object.keys(selectedObjectsByLayers);
                    for (let i = 0; i < selectedLayers.length; i++) {

                        while (url.length + encodeURI(JSON.stringify(selectedObjectsByLayers)).length + '&objcard='.length > 2048 && selectedObjectsByLayers[selectedLayers[i]].length) {
                            selectedObjectsByLayers[selectedLayers[i]].pop();
                            objectDisabledCount++
                        }

                        if (!selectedObjectsByLayers[selectedLayers[i]].length) {
                            delete selectedObjectsByLayers[selectedLayers[i]]
                        }
                    }
                    var objcardEdit = encodeURI(JSON.stringify(selectedObjectsByLayers))
                }
                url += '&objcard=' + objcardEdit;
            }

            if (url.length <= 2048) {
                if (layerDisabledCount > 0 || objectDisabledCount > 0) {
                    this.getTaskManager().showSnackBarMessage({ text: this.translate('The length of the URL exceeds 2048 characters') }, 3000)
                }
                if (layerDisabledCount > 0) {
                    this.getTaskManager().showSnackBarMessage({ text: this.translate('Removed layers from the URL') + ': ' + layerDisabledCount }, 3000)
                }
                if (objectDisabledCount > 0) {
                    this.getTaskManager().showSnackBarMessage({ text: this.translate('Removed objects from the URL') + ': ' + objectDisabledCount }, 3000)
                }
                return url;
            } else {
                this.getTaskManager().showSnackBarMessage({ text: this.translate('It is not possible to shorten a string to 2048 characters') })
                return '';
            }
        },

    /**
     * Получить разбивку выделенных объектов по слоям
     * @method getSelectedObjectsByLayers
     * @param selectedObjects {MapObject[]} Список объектов карты
     */
    getSelectedObjectsByLayers: function(selectedObjects) {
        return selectedObjects.reduce((layerMap, mapObject) => {
            const cadastrNumber = mapObject.getSemanticValue('cn') || mapObject.getSemanticValue('number_zone') || mapObject.getSemanticValue('brd_id');
            const layerId = mapObject.vectorLayer.id;
            if (!layerMap[layerId]) {
                layerMap[layerId] = [];
                layerMap[layerId].push(cadastrNumber || mapObject.objectNumber);
            } else {
                layerMap[layerId].push(cadastrNumber || mapObject.objectNumber);
            }
            return layerMap;
        },  {});
    },
        /**
         * Установить габариты карты
         * @method setBounds
         * @param  latlngbounds {GWTK.latLngBounds} габариты
         */
        setBounds: function(latlngbounds) {
            if (typeof latlngbounds === 'undefined') {
                if (this.mapLatLngBounds) {
                    latlngbounds = this.mapLatLngBounds;
                }
            }else{
                this.mapLatLngBounds = new GWTK.LatLngBounds(latlngbounds);
            }

            if (latlngbounds) {
                const mapPointSW = new GeoPoint(latlngbounds.getWest(), latlngbounds.getSouth(), 0, this.ProjectionId).toMapPoint();
                const mapPointNE = new GeoPoint(latlngbounds.getEast(), latlngbounds.getNorth(), 0, this.ProjectionId).toMapPoint();
                // габариты в метрах
                this.mapBounds = new Bounds(mapPointSW, mapPointNE);
            }else
                this.mapBounds = null;

            return this.mapBounds;
        },

        getBbox() {
            const bbox = new BoundingBox2D();

            const northWest = this.pixelToPlane(new PixelPoint(0, 0));
            const windowRect = this.getWindowRect();
            const southEast = this.pixelToPlane(new PixelPoint(windowRect.width, windowRect.height));

            bbox.fitPoints([[northWest.y, northWest.x], [southEast.y, southEast.x]]);
            return bbox;
        },

        /**
         * Установить максимальные габариты карты
         * @method setMaxBounds
         * @param  maxbounds {Array} габариты [Number, Number, Number, Number]
         */
        setMaxBounds: function(maxbounds) {
            if (!Array.isArray(maxbounds) || maxbounds.length !== 4) {
                this.maxBounds = undefined;
            }else{
                if (this.options.isgeocenter === undefined || this.options.isgeocenter) {
                    const min = new GeoPoint(maxbounds[1], maxbounds[0], 0, this.ProjectionId).toMapPoint(),
                        max = new GeoPoint(maxbounds[3], maxbounds[2], 0, this.ProjectionId).toMapPoint();
                    if (min && max) {
                        this.maxBounds = new Bounds(min, max);
                    }
                }else{
                    const min = MapPoint.fromOriginArray([maxbounds[0], maxbounds[1]], this.ProjectionId),
                        max = MapPoint.fromOriginArray([maxbounds[2], maxbounds[3]], this.ProjectionId);
                    this.maxBounds = new Bounds(min, max);
                }
            }
        },

        /**
         * Проверить параметр 'центр карты' по максимальным габаритам
         * @method _validateCenterByMaxBounds
         * Если значение центра вне максимальных габаритов,
         * в качестве центра карты используется значение центра габаритов
         */
        _validateCenterByMaxBounds: function() {
            if (!this.maxBounds) {
                return;
            }
            if (this.mapCenterPoint) {
                const mapPoint = this.getCenter();
                if (!this.maxBounds.contains(mapPoint)) {
                    const center = this.maxBounds.getCenter();
                    const newMapCenter = new MapPoint(center.x, center.y, 0, this.ProjectionId);
                    this.mapCenterPoint.x = newMapCenter.x;
                    this.mapCenterPoint.y = newMapCenter.y;
                    this.mapCenterPoint.h = newMapCenter.h;
                }
            }
        },

        /**
         * Установить параметры карты
         * @method setOptions
         */
        setOptions: function() {

            if (this.options == null) return false;

            if (typeof this.options.url === 'undefined') {
                this.options.url = '';
            }
            if (typeof this.options.tilematrix === 'undefined') {
                this.options.tilematrix = 15;
            }
            if (!this.options.layers) {
                this.options.layers = [];
            }

            this.ProjectionId = this.options.tilematrixset;
            this.Translate = TranslateList.getItem(this.ProjectionId);
            if (!this.Translate) {
                throw Error('Translate object not found');
            }
            this.tileMatrix = this.Translate.getTileMatix();
            if (!this.tileMatrix) {
                throw Error('tileMatrix object not found');
            }

            var test = ('url' in this.options
                && 'tilematrixset' in this.options
                && 'tilematrix' in this.options
                && 'layers' in this.options
                && 'id' in this.options);

            if (!test) return false;


            if (typeof this.options.usetoken === "undefined" || this.options.usetoken !== true) {
                this.options.usetoken = false;
            }

            //this.fixView();                                           // 26/05/20

            // this.initMeasurementUnits();

            this.initMarkingOfObjects();
            this.initMeasurementStyle();

            if (typeof (this.options.minzoom) != 'undefined') {
                if (this.options.minzoom < 2) this.options.minzoom = 2;
            }else{
                this.options.minzoom = 2;
            }

            // Проверить масштаб отображения
            if (this.options.tilematrix > 0) {
                if (typeof (this.options.maxzoom) != 'undefined' && this.options.maxzoom > 0) {
                    if (this.options.tilematrix > this.options.maxzoom) {
                        this.options.tilematrix = this.options.maxzoom;
                    }
                }else if (typeof (this.options.minzoom) != 'undefined' && this.options.minzoom > 0) {
                    if (this.options.tilematrix < this.options.minzoom) {
                        this.options.tilematrix = this.options.minzoom;
                    }
                }
            }
            if (typeof this.options.mergewmslayers != 'undefined') {
                if (typeof this.options.mergewmslayers === 'string') {
                    if (this.options.mergewmslayers.toLowerCase() === 'true')
                        this.options.mergewmslayers = true;
                    else
                        this.options.mergewmslayers = false;
                }
                if (typeof this.options.mergewmslayers !== 'boolean')
                    this.options.mergewmslayers = false;
            }else{
                this.options.mergewmslayers = false;       // true
            }

            if (typeof this.options.showsettings != 'undefined') {
                var settings = GWTK.Util.parseBoolean(this.options.showsettings);
                if (settings === undefined) {
                    settings = parseInt(this.options.showsettings);
                    if (isNaN(settings)) settings = false;
                    if (settings === 1) settings = true;
                    else settings = false;
                }
                this.options.showsettings = settings;
            }



            return true;
        },


        /**
         * Запросить центр карты
         * @method getCenter
         * @return {MapPoint}, координаты центра, метры
         */
        getCenter: function() {
            return this.mapCenterPoint;
        },
        /**
         * Запросить центр карты в градусах
         * @method getCenterGeoPoint
         * @return {GeoPoint}, координаты центра, градусы
         */
        getCenterGeoPoint: function() {
            return this.mapCenterPoint.toGeoPoint(this.mapCenterPoint.getProjectionId())
        },

        /**
         * Запросить уровень масштабирования
         * @method getZoom
         * @return {Number}, уровень масштабирования матрицы тайлов
         */
        getZoom: function() {
            return this.options.tilematrix;
        },

        /**
         * Запросить координаты центра карты в матрице указанного уровня масштабирования
         * @method getCenterPixel
         * @return {PixelPoint}, координаты центра {x,y}, пикселы от начала координат матрицы
         */
        getCenterPixel: function(zoom) {
            var currentZoom = zoom !== undefined ? zoom : this.getZoom();
            return this.getCenter().toPixelPoint(currentZoom);
        },

        /**
         * Запросить пикселы текущего верхнего левого угла карты в матрице
         * @method getPixelMapTopLeft
         * @return {PixelPoint}, {x,y}, пикселы от начала координат матрицы
         */
        getPixelMapTopLeft: function() {
            var pixelCenter = this.getCenterPixel(),
                half = this.getSize().divideBy(2);
            return pixelCenter.subtract(half, pixelCenter);
        },

        /**
         * Запросить габариты текущего вида в пикселах матрицы
         * @method getPixelMapBounds
         * @param zoom {Number}, масштабный уровень матрицы
         * @return {Bounds}, {GWTK.Point,GWTK.Point}, габариты, {min,max} пикселы
         */
        getPixelMapBounds: function(zoom) {
            var center = this.getCenterPixel(zoom),
                half = this.getSize().divideBy(2);
            return new PixelBounds(center.subtract(half), center.add(half));
        },

        /**
         * Запросить прямоугольные координаты верхнего левого угла отображаемого фрагмента карты
         * @method getMapTopLeft
         * @return {GWTK.point} прямоугольные координаты (x, y)
         */
        getMapTopLeft: function() {
            var pixelCenter = this.getCenterPixel(),
                offset = this.getSize().divideBy(2),
                pixelTopleft = pixelCenter.subtract(offset, pixelCenter).floor(pixelCenter);

            var point = this.pixelToPlane(pixelTopleft, this.getZoom());    // для 4326 - градусы !

            var matrix = this.tileMatrix,
                matrixMinX = matrix.Ogc.getPointY(),                                     // hor min of matrix
                matrixMaxX = Math.abs(matrixMinX);                                 // hor max of matrix

            if (this.Translate.EpsgCode !== 4326) {
                if (point.x < matrixMinX) {
                    point.x = matrixMaxX - Math.abs((point.x - matrixMinX));
                }else if (point.x > matrixMaxX) {
                    point.x = matrixMinX + Math.abs(matrixMaxX - point.x);
                }
            }else{
                // var f = false;
                if (point.x < -180) {
                    point.x += 360;
                    // f = true;
                }
                if (point.x > 180) {
                    point.x -= 360;
                    // f = true;
                }
                var coord = new GeoPoint(point.x, point.y, 0, this.ProjectionId).toMapPoint();
                point.x = coord.x;
                point.y = coord.y;
            }
            return point;
        },

        // /**
        //  * Запросить координаты новой точки по координатам точки и приращению
        //  * @method getPointPixelOrbital
        //  * @return {GWTK.Point} прямоугольные координаты точки в матрице (пикселы)
        //  */
        // getPointPixelOrbital: function(point, dx, dy) {
        //     if (!point || !(point instanceof GWTK.Point)) {
        //         return;
        //     }
        //     var bounds = GWTK.tileView.globalTileMatrixSizePixel(this, this.getZoom()),  // ширина матрицы в текущем масштабе, пикселы
        //         size = bounds.getSize(),
        //         pixW = size.x;
        //     var x1 = point.x + dx, y1 = point.y + dy;
        //     if (x1 < 0) {
        //         x1 = pixW + x1;
        //     }else if (x1 > pixW) {
        //         x1 = x1 - pixW;
        //     }
        //     return new PixelPoint(x1, y1);
        // },

        /**
         * Запросить габариты текущего окна карты (Bounds)
         * @method getWindowBounds
         * @return {Bounds} Координаты окна карты в метрах
         */
        getWindowBounds() {

            const windowRect = this.getWindowRect();
            const leftBottom = this.pixelToPlane(new PixelPoint(0, windowRect.height));
            const rightTop = this.pixelToPlane(new PixelPoint(windowRect.width, 0));

            return new Bounds(leftBottom, rightTop);
        },

        /**
         * Запросить географические габариты текущего окна карты
         * @method getMapGeoBounds
         * @return {GeoBounds|undefined} географические координаты углов окна
         */
        getMapGeoBounds() {
            if (this.Translate.IsGeoSupported) {
                const pBounds = this.getWindowBounds();
                return this.tileMatrix.getGeoDegreeFrameFromPlaneFrame(pBounds);
            }
        },

        /**
         * Запросить габариты текущего окна карты (PixelBounds)
         * @method getWindowPixelBounds
         * @return {PixelBounds} Координаты окна карты в пикселах
         */
        getWindowPixelBounds() {
            const pixcenter = this.getCenterPixel();

            const [x, y] = this.getWindowSize();
            const halfPoint = new PixelPoint(x, y);
            halfPoint.divideBy(2, halfPoint);

            return new PixelBounds(pixcenter.subtract(halfPoint), pixcenter.add(halfPoint));
        },


        /**
         * Запросить географические габариты текущего окна карты (BBox)
         * @method getMapBboxGeo
         * @return {GWTK.latLngBounds} географические координаты углов
         */
        getMapBboxGeo: function() {
            const pixbounds = this.getWindowBounds();

            const minGeoPoint = this.pixelToGeo(pixbounds.min);
            const maxGeoPoint = this.pixelToGeo(pixbounds.max);

            const min = GWTK.toLatLng([minGeoPoint.getLatitude(), minGeoPoint.getLongitude()]);
            const max = GWTK.toLatLng([maxGeoPoint.getLatitude(), maxGeoPoint.getLongitude()]);

            return GWTK.latLngBounds(min, max);
        },



        /**
         * Запросить географические габариты текущего окна карты
         * @method getMapGeoBounds
         * @return {Object} { "SW": [lat, lng], "NE": [lat, lng]}, географические координаты углов окна

         getMapGeoBounds: function(expanded) {
            var pBounds = this.getWindowBounds();
            if (!this.Translate.IsGeoSupported)
                return;
            this.tileMatrix.getGeoDegreeFrameFromPlaneFrame()
            var min = GWTK.projection.xy2geo(this.options.crs, pBounds.min[1], pBounds.min[0]);
            var max = GWTK.projection.xy2geo(this.options.crs, pBounds.max[1], pBounds.max[0]);
            var latDelta = 0;
            var lngDelta = 0;
            var mobile = false;
            if (expanded) {
                latDelta = mobile ? 0 : Math.abs(min[0] - max[0]),
                    lngDelta = mobile ? 0 : Math.abs(min[1] - max[1]);

            }
            var gBounds = {
                SW: { lat: min[0] - latDelta, lng: min[1] - lngDelta },
                NE: { lat: max[0] + latDelta, lng: max[1] + lngDelta }
            };
            gBounds.contains = function(lat, lng) {
                return (lat >= this.SW.lat) && (lat <= this.NE.lat) &&
                    (lng >= this.SW.lng) && (lng <= this.NE.lng);
            };
            return gBounds;
        },
         */
        //Kozhanov + 12.11.2015
        /**
         * Добавить слушателя
         * @method addListener
         */
        addListener: function(object, event, callback) {
            this._observer.addListener(object, event, callback);
        },

        //Kozhanov + 12.11.2015
        /**
         * Удалить слушателя
         * @method removeListener
         */
        removeListener: function(object, event, callback) {
            this._observer.removeListener(object, event, callback);
        },

        //Kozhanov + 12.11.2015
        /**
         * Создать событие в карте
         * @method _invoke
         */
        _invoke: function(event, args) {
            if (this._observer && this._observer.invoke) {
                this._observer.invoke(event, args);
            }
        },

        /**
         * Запросить координаты события мыши
         * @method getEventPointCoordinates
         * @param event {Object} объект события
         * @return {Object} координаты мыши в пикселах, прямоугольной СК и географические,
         *         { 'point':point, 'coord': coord, 'geo': geo }
         */
        getEventPointCoordinates: function(event) {
            if (!event) return false;
            var point = GWTK.DomEvent.getMousePosition(event, this.eventPane);
            var coord = this.tiles.getLayersPointProjected(point);
            var geo = coord.toGeoPoint();
            return { point, coord, geo };
        },

        /**
         * Установить размер окна карты
         * @method setWindowSize
         * @param  width {Number} ширина, пиксел
         * @param  height {Number} высота, пиксел
         */
        setWindowSize: function(width/*number*/, height/*number*/) {
            if (!this.panes.eventPane || !this.panes.mapPane) {
                return false;
            }
            if (width === undefined && height === undefined) {
                $(this.panes.eventPane).css({ height: '100%', width: '100%' });
                $(this.panes.mouseDevicePane).css({ height: '100%', width: '100%' });
                $(this.panes.mapPane).css({ height: '100%', width: '100%' });
            }else{
                $(this.panes.eventPane).width(width).height(height);
                $(this.panes.mouseDevicePane).width(width).height(height);
                $(this.panes.mapPane).width(width).height(height);
            }
        },

        /**
         * Запросить размер окна карты
         * @method getWindowSize
         * @return {Array}, [ширина, высота] (пикселы)
         */
        getWindowSize: function() {
            if (!this.container) return null;

            const boundingRect = this.container.getBoundingClientRect();

            let width = boundingRect.right - boundingRect.left;
            if (!width) {
                width = parseInt(this.container.style.width || '0');
            }

            let height = boundingRect.bottom - boundingRect.top;
            if (!height) {
                height = parseInt(this.container.style.height || '0');
            }

            return [width, height];
        },

        /**
         * Запросить размер карты
         * @method getSize
         * @return {PixelPoint}, {x:ширина, y:высота} (пикселы)
         */
        getSize: function() {
            var ws = this.getWindowSize();
            return new PixelPoint(ws[0], ws[1]);
        },


        /**
         * Установить слои карты по списку слоев в параметрах карты
         * @method setLayers
         */
        setLayers: function() {
            if (!this.options || !this.options.layers || this.options.layers.length === 0) {
                throw new Error(this.translate("Map layers not found"));
            }
            // создать слои карты по параметрам
            var i, count = this.options.layers.length;

            GWTK.Util.formatLayersUrl(this.options);



            // признак отображения слоя в параметры из cookie
            const ids = this.workspaceManager.getValue(PROJECT_SETTINGS_HIDDEN_LAYERS);
            this.tiles.setHiddenLayersOptions(ids);
            this.tiles.setOpacityLayersOptions();
            this.tiles.setSelectedLegendObjectList();
            this.tiles.setSelectedLegendObjectStyleOptions();

            const layerParametersArray = this.workspaceManager.getValue(PROJECT_SETTINGS_LAYER_PARAMETERS_ARRAY);
            for (let j = 0; j < layerParametersArray.length; j++) {
                const layerParameters = layerParametersArray[j];
                if (layerParameters.zIndex !== undefined) {
                    const currentLayerOptions = this.options.layers.find(params => params.id === layerParameters.id);
                    if (currentLayerOptions) {
                        currentLayerOptions.zIndex = layerParameters.zIndex || 1;
                    }
                }

            }

            // восстановить параметры порядка слоев
            // this.tiles.viewOrder = this.tiles._setLayersViewOrderParam(this.workspaceManager.getValue(PROJECT_SETTINGS_LAYERS_VIEW_ORDER));
            for (i = 0; i < count; i++) {
                this.addLayer(this.options.layers[i]);
            }

            this.setCursor('default');

            $(this.eventPane).off('wmsloaded.gwtkmap');
        },

        /**
         * Добавить слой в карту
         * @method addLayer
         * @param  layparam {Object} параметры слоя, layparam должен содержаться параметрах карты
         * @return {Object}, класс управления слоем карты, при ошибке возвращает `null`
         */
        addLayer: function(layparam) {
            if (!layparam) return null;

            if (!this.getLayerOptionsById(layparam.id)) {
                if (window.console) {
                    console.log("ERROR: Map.AddLayer: Layer parameters are missing in the parameters of the map. Layer is not added, Id=" + layparam.id);
                    console.log(layparam);
                }
                return null;                                    // параметры слоя (layparam) отсутствуют в параметрах карты !
            }

            if (this.tiles) {
                if (this.tiles.getLayerByxId(layparam.id)) {     // слой с идентификатором "id" уже содержится в карте !
                    if (window.console) {
                        console.log("ERROR: Map.AddLayer: Layer already exists in the map. Layer is not added, Id=" + layparam.id);
                        console.log(layparam);
                    }
                    return null;
                }
            }

            // добавить слой svg-графики
            if (layparam.type && (layparam.type in GWTK.layerTypes)) {
                const typeValue = GWTK.layerTypes[layparam.type];
                if (typeValue === 3 || typeValue === 4) {               // svg или geomarkers
                    return this.addGraphicLayer(layparam);
                }
            }

            // добавить виртуальную папку
            if (layparam.folder) {
                return this.addVirtualFolder(layparam);
            }

            // добавить слой wms тайлов (Росреестр)
            if ((("pkkmap" in layparam) && parseInt(layparam.pkkmap) === 1) ||
                (("tilewms" in layparam) && parseInt(layparam.tilewms) === 1)) {
                const lay = new TileLayerWms(this, layparam);
                if (lay) {
                    lay.onAdd();
                    if (!lay.zIndex) {
                        lay.zIndex = 1;
                    }
                    this.tiles.insertByZIndex(layparam.id);
                }
                return lay;
            }

            const url = layparam.url.toLowerCase();
            let service = "wms";
            let index = url.indexOf("userfolder#") > -1 ? url.indexOf("userfolder#") : url.indexOf("host#");
            if (index === -1) {
                index = url.indexOf("folder#")
            }
            if (index > -1) {
                layparam.url = GWTK.Util.encodeIdLayerUrl(layparam.url);
            }

            if (layparam.selectObject) {
                let vectorLayer = this.getVectorLayerByxId(layparam.id);
                if (!vectorLayer) {
                    vectorLayer = new GISWebServiceVectorLayer(this, layparam);
                    this.vectorLayers.push(vectorLayer);
                }
            }

            if (url.indexOf("%z") >= 0 && url.indexOf("%x") >= 0 && url.indexOf("%y") >= 0)
                service = "wmts";
            let layer;
            if (service === 'wms') {
                this.tiles.setWms();
                layer = new WmsLayer(this, layparam);
                this.tiles.wmsManager.registerLayer(layer);
                layer.onAdd();
            }else {
                layer = new TileLayer(this, layparam);
                layer.onAdd();
            }

            // добавить в массив порядка отображения
            index = this.tiles.viewOrder.indexOf(layer.xId);
            // if (index === -1 && this.tiles.findNode({ nodes: this.options.contenttree }, layer.xId)) {
            if (index === -1) {
                this.tiles.insertByZIndex(layer.xId);
            }

            if (layer.layerContainer) {
                layer.layerContainer.style.zIndex = '' + layer.zIndex;
            }

            this.openSelectedObjectsLayer(layer);

            return layer;
        },

        openVectorLayer(params) {
            let vectorLayer = this.getVectorLayerByxId(params.id);
            if (!vectorLayer) {
                vectorLayer = new VectorLayer(this, {
                    id: params.id,
                    url: params.url,
                    alias: params.alias,
                    selectObject: params.selectObject,
                    legend: params.legend
                });

                this.vectorLayers.push(vectorLayer);
            }
            return vectorLayer;
        },

        /**
         * Открыть слой.
         * Добавляет слой и параметры слоя в карту.
         * @method openLayer
         * @param  param { Object } параметры слоя
         * @param treenode { ContentTreeNode } параметры узла слоя в дереве состава слоев
         * @return { Layer | number }, слой карты, при ошибке возвращает `-1`.
         * Если слой с идентификатором param.id уже существует в карте, возвращает `0`
         */
        openLayer: function(param, treenode) {
            if (!param || !param.id) return -1;
            var lay = this.tiles.getLayerByxId(param.id);
            if (lay) return 0;

            GWTK.Util.formatUrl(this.options.url, param);

            var layparam = JSON.parse(JSON.stringify(param));
            this._adjustLayerAlias(layparam);
            // сначала параметры слоя в map.options.layers, потом - в map.layers,
            // потому что в addLayer проверяется наличие параметров слоя в map.options.layer
            if (!this.getLayerOptionsById(layparam.id))
                this.options.layers.push(layparam);

            lay = this.addLayer(layparam);

            if (!lay) {
                var index = -1, i;
                for (i = 0; i < this.options.layers.length; i++) {
                    if (!this.options.layers[i]) continue;
                    if (this.options.layers[i].id === layparam.id) {
                        index = i;
                        break;
                    }
                }
                if (index > -1)
                    this.options.layers.splice(index, 1);
            }else{
                if (treenode && treenode.id === layparam.id) {
                    this.onLayerListChanged(treenode);
                }
                if (lay.getType() === 'wms' && !lay.options.hidden) {
                    this.tiles.wmsUpdate();
                }else{
                    $(this.eventPane).trigger({ type: 'refreshmap', 'cmd': 'draw' });
                }
            }

            return lay;
        },

        /**
         * Открыть слой выделения объектов
         * @method openSelectedObjectsLayer
         * @param  layer {Layer} слой карты
         * @return { WmsLayer|undefined }, слой карты для выделения объектов или undefined
         * Созданный слой добавляется в массив objectSelectionManager.selectedObjectsLayers
         */
        openSelectedObjectsLayer(layer) {
            if (!layer) {
                return;
            }
            this.tiles.setWms();

            const coloringlayer = this.objectSelectionManager.openSelectionLayer(layer);

            if (coloringlayer) {
                this.layers.splice(this.layers.length - 1, 1);
            }

            return coloringlayer;
        },

        /**
         * Получить слои выделения объектов
         * @method getSelectedObjectsLayers
         * @return { WmsLayer[] }, массив слоев или undefined
         */
        getSelectedObjectsLayers() {
            if (this.objectSelectionManager) {
                return this.objectSelectionManager.selectedObjectsLayers;
            }
            return [];
        },

        /**
         * Получить параметры слоев и параметры выделения объектов
         * @method getSelectedObjectsLayersParameters
         * @return { layers: WmsLayer[], searchRequestParam:[SearchParameters] }, слои и параметры объектов для выделения
         */
        getSelectedObjectsLayersParameters: function() {
            if (this.objectSelectionManager) {
                const searchRequestParam = this.getSearchObjectParameters();
                const layers = this.objectSelectionManager.getSelectedObjectsLayers(searchRequestParam);
                return { layers: layers, searchRequestParam: searchRequestParam };
            }
        },

        /**
         * Получить текущие параметры поиска и выделения объектов
         * @method getSearchObjectParameters
         * @return { [SearchParameters] }, массив параметров SearchParameters (по серверам,GroupLayer.ts)
         */
        getSearchObjectParameters: function() {
            if (this.objectSelectionManager) {
                return this.objectSelectionManager.getSearchObjectParameters();
            }
        },

        /**
         * Закрыть слой.
         * Удаляет слой и его параметры из карты.
         * @method closeLayer
         * @param  xid {String} уникальный идентификатор слоя в карте
         * @return {Number}, 1 - успешно выполнено, при ошибке возвращает `-1`.
         */
        closeLayer: function(xid) {
            var result = this._removeLayer(xid);
            if (result === 1) {
                // удалить из дерева состава
                const updateFlag = this.contentTreeManager.updateTreeNodeList({ remove: true, id: xid, text: '' });
                if (updateFlag) {
                    this.trigger({ type: 'refreshmap', target: 'map', cmd: 'draw' });
                    $(this.eventPane).trigger({ type: 'refreshmap', 'cmd': 'draw' });
                    this.trigger({ type: 'layerlistchanged', target: 'map' });
                }

                // удалить из списка редактируемых слоев
                if (this.options.settings_mapEditor) {
                    const index = this.options.settings_mapEditor.maplayersid.indexOf(xid);
                    if (index !== -1) {
                        this.options.settings_mapEditor.maplayersid.splice(index, 1);
                    }
                }

                //удалить из личного кабинета
                const layerParametersArray = this.workspaceManager.getValue(PROJECT_SETTINGS_LAYER_PARAMETERS_ARRAY);
                const index = layerParametersArray.findIndex(layerParameters => layerParameters.id === xid);
                if (index !== -1) {
                    layerParametersArray.splice(index, 1);
                    this.workspaceManager.setValue(PROJECT_SETTINGS_LAYER_PARAMETERS_ARRAY, layerParametersArray);
                }
            }
            return result;
        },

        /**
         * Удалить слой.
         * Удаляет слой и его параметры из карты.
         * @method _removeLayer
         * @param  xid {String} уникальный идентификатор слоя в карте
         * @return {Number}, 1 - успешно выполнено, при ошибке возвращает `-1`.
         */
        _removeLayer: function(xid) {
            if (xid === undefined)
                return -1;
            let lay = this.tiles.getLayerByxId(xid), index = -1;

            // проверка vectorLayer
            if (!lay) {
                lay = this.vectorLayers.find(item => item.id === xid);
                if (lay) {
                    this.vectorLayers.splice(this.vectorLayers.indexOf(lay), 1);
                }
            }

            if (!lay) {
                lay = this._removeVirtualFolder(xid);
            }
            if (!lay) {
                return 0;
            }

            if (lay.getType() === 'wms') {
                this.setLayerVisibility(lay, false);
            }

            // удалить слой
            lay.onRemove();
            // удалить из карты
            index = GWTK.Util.indexOf(this.layers, lay);
            if (index > -1)
                this.layers.splice(index, 1);
            // удалить из параметров
            index = -1;
            for (var i in this.options.layers) {
                if (this.options.layers[i] && this.options.layers[i].id === xid) {
                    index = i;
                    break;
                }
            }
            if (index > -1)
                this.options.layers.splice(index, 1);

            index = $.inArray(xid, this.tiles.viewOrder);
            if (index > -1) {
                this.tiles.viewOrder.splice(index, 1);
                this._writeCookie();
            }

            this.objectSelectionManager.removeSelectionLayer(xid);

            return 1;
        },

        /**
         * Удалить слой виртуальной папки
         * @method _removeVirtualFolder
         * @param xid {String} уникальный идентификатор слоя в карте
         */
        _removeVirtualFolder: function(xid) {
            let i, index = -1;
            let virtualFolder;
            for (i = 0; i < this.virtualfolders.length; i++) {
                if (this.virtualfolders[i].xId === xid) {
                    index = i;
                    break;
                }
            }
            if (index > -1) {
                [virtualFolder] = this.virtualfolders.splice(index, 1);
                virtualFolder.destroy();
            }
            return virtualFolder;
        },

        /**
         * Добавить слой виртуальной папки
         * @method addVirtualFolder
         * @param  layparam {Object} параметры слоя виртуальной папки
         */
        addVirtualFolder: function(layparam) {
            if (!layparam) return;
            if (!layparam.folder || layparam.folder.length === 0)
                return;
            var i, len = this.virtualfolders.length, pos = -1;
            for (i = 0; i < len; i++) {
                if (this.virtualfolders[i].xId === layparam.id) {
                    pos = i;
                    break;
                }
            }
            if (pos === -1) {
                this.virtualfolders.push(new VirtualFolder(this, layparam));
                pos = this.virtualfolders.length - 1;
            }
            return this.virtualfolders[pos];
        },

        /**
         * Добавить графический слой svg
         * @method addGraphicLayer
         * @param  layparam {Object} параметры слоя, json, параметр layparam['type'] должен иметь значение 'svg'
         * @param  optionsEditing {Object} параметры для редактора карты { "editing": true }
         * @return {GWTK.graphicLayer} or `undefined` при ошибке
         */
        addGraphicLayer: function(layparam, optionsEditing) {
            if (!layparam) return;
            if (!layparam.type || typeof GWTK.layerTypes[layparam.type] === 'undefined') {
                return;
            }

            var layer,
                type = GWTK.layerTypes[layparam.type];
            if (type === 3 || type === 4) {
                if (layparam.jsondata) {
                    layparam.jsondata = GWTK.UtilGraphicLayer.createJSONforGraphicLayer(layparam.jsondata);
                    if (!layparam.jsondata)
                        return;
                }
                if (type === 3) {
                    layer = new GWTK.graphicLayer(this, layparam, optionsEditing);
                }else{
                    layer = new GWTK.GeoMarkersLayer(this, layparam);
                }
                if (layer.error) {
                    return;
                }
                return layer;
            }
        },

        /**
         * Добавить локальный слой
         * @param  map {GwtkMap}
         * @param  options {GwtkLayerDescription}
         * @return {GeoJsonLayer} or `undefined` при ошибке
         */
        addLocalLayer(options, json = '', param) {

            const layer = new GeoJsonLayer(this, options, json, param);

            if (layer) {
                this.vectorLayers.push(layer);
                return layer;
            }
        },
        /**
         * Открыть локальный слой
         * @param  map {GwtkMap}
         * @param  options {GwtkLayerDescription}
         * @param  json {string}
         * @return {GeoJsonLayer} or `undefined` при ошибке
         */
        openLocalLayer(map, options, json = '', param) {

            const layer = new GeoJsonLayer(map, options, json, param);

            if (layer) {
                this.vectorLayers.push(layer);
                layer.onAdd();
                return layer;
            }
        },

        /**
         * Создать слой без отображения. Создается объект слоя, добавляется в список слоев карты с признаком "onlyset":1.
         * DOM-элементы слоя не создаются и не добавляются к карте
         * @method createLayer
         * @param  layparam {Object} параметры слоя
         */
        createLayer: function(layparam) {
            if (!layparam || !layparam.url)
                return;

            // Добавим сервер к url слоя, если адрес относительный
            if (!GWTK.Util.formatUrl(this.options.url, layparam)) { // Не удалось получить полный адрес
                return;
            }

            var url = layparam.url.toLowerCase(),
                service = "wms";
            if (url.indexOf("%z") >= 0 && url.indexOf("%x") >= 0 && url.indexOf("%y") >= 0)
                service = "wmts";
            if (layparam.folder && layparam.folder.length > 0) {
                service = "folder";
            }
            var lay = null;
            layparam.onlyset = 1;
            // создать слой
            if (service === "wms") {
                this.tiles.setWms();
                lay = new WmsLayer(this, layparam);                   // wms-layer
            }
            if (service === "wmts") {
                lay = new TileLayer(this, layparam);                  // wmts-layer
            }else if (service === "folder") {                                // слой виртуальной папки
                this.addVirtualFolder(layparam);
            }
            // добавить в список слоев карты
            if (lay) {
                if (layparam.hidden) lay.hide();
                this.tiles.viewOrder.push(lay.xId);
            }
        },

        /**
         * Согласовать параметр названия слоя
         * @method _adjustLayerAlias
         * @param  layparam {JSON} параметры слоя
         */
        _adjustLayerAlias(layparam) {
            if (!this.contentTreeManager) {
                return;
            }
            const treenode = this.getContentTreeNode(layparam.id);
            if (treenode) {
                if (treenode.text && treenode.text.length > 0) {
                    layparam.alias = treenode.text;
                }
            }
        },

        /**
         * Запросить параметры слоя по его идентификатору
         * @method getLayerOptionsById
         * @param  id {String} идентификатор слоя
         * @return {Object} возвращает JSON-параметры слоя, при ошибке возвращает `null`
         */
        getLayerOptionsById: function(id) {
            if (id === null || id === undefined || id.length === 0 || !this.options.layers)
                return null;
            var i, len = this.options.layers.length;
            for (i = 0; i < len; i++) {
                if (this.options.layers[i].id === id)
                    return this.options.layers[i];
            }
            return null;
        },

        /**
         * Получить параметры редактируемых слоев
         * @method getEditableLayersOptions
         * @return {Object} параметры редактируемых слоев или undefined
         */
        getEditableLayersOptions: function() {
            const editorOptions = this.options.settings_mapEditor;
            if (editorOptions && Array.isArray(editorOptions.maplayersid)) {
                return JSON.parse(JSON.stringify(this.options.settings_mapEditor));
            }
        },

        // отобразить слои карты эксклюзивно (только указанные в списке layerid)
        // layerid - список id слоев карты
        showLayersExclusively: function(layerid) {

            var mapContent = this.mapTool('mapcontent');


            if (!layerid) return;
            var lay = [], j, i;
            if (GWTK.Util.isArray(layerid))
                lay = lay.concat(layerid);
            else{
                lay = layerid.split(',');
            }
            if (lay.length === 0) return;

            for (i = 0; i < this.layers.length; i++) {
                if (this.layers[i] == null) continue;

                this.layers[i].hide();

                if ((mapContent)) {
                    mapContent.setUnChecked(this.layers[i].xId);
                }

                for (j = 0; j < lay.length; j++) {
                    if (this.layers[i].xId === lay[j]) {
                        this.layers[i].show();

                        if (mapContent) {
                            mapContent.setChecked(this.layers[i].xId);
                        }
                    }
                }
            }
            this.tiles.forceupdate();
        },


        // map legends loading methods
        /**
         * Запросить легенду слоя карты по id слоя
         * @method setLayerLegendById
         * @param xid {String} идентификатор слоя карты
         */
        setLayerLegendById: function(xid) {
            if (!xid) return;
            var lay = this.tiles.getLayerByxId(xid);
            if (lay == null) return;
            this.setLayerLegend(lay);
        },

        /**
         * Запросить легенду слоя карты
         * @method setLayerLegend
         * @param layer {Object}, слой карты
         */
        setLayerLegend: function(layer) {

            if (!layer || !this.options || !this.options.layers) return;
            var i, len = this.options.layers.length,
                mapcontent = this.mapTool('mapcontent'), tree;
            if (!mapcontent || !(tree = window.w2ui ? window.w2ui[mapcontent.name] : mapcontent.name))
                return;
            // проверить наличие легенды в дереве
            if (mapcontent.resetLegend(layer.xId)) {
                return true;
            }

            // запрашиваем легенду
            for (i = 0; i < len; i++) {
                if (!this.options.layers[i].legend) continue;
                if (layer.xId !== this.options.layers[i].id) continue;

                // Если графический слой
                if (layer instanceof GWTK.graphicLayer) {
                    var legend = layer.createLegend(layer.GeoJSON);
                    if (legend !== false) {
                        tree.remove('legendholder_' + layer.xId);
                        tree.add(layer.xId, legend);
                        return true;
                    }
                    return false;
                }
                var types = this.options.layers[i].legend;          // в легенде

                if (layer.typeNames && layer.typeNames.length > 0) { // в слое
                    types = layer.typeNames;
                    this.options.layers[i].legend = layer.typeNames; // по слою
                }
                if ((layer.codeList && layer.codeList.length > 0) ||
                    (layer._filter && layer._filter.getKeyList().length > 0)) {
                    this.options.layers[i].legend = '*';
                    types = '*';
                }

                var srv = GWTK.Util.getServerUrl(layer.options.url);

                // получить значение ширины рисунка из стиля legend_img
                var el = document.createElement('div');
                //el.className = "legend_img";
                $(el).addClass("legend_img");
                var width = parseInt($(el).width());
                if (!width) width = 24;

                var query = new WfsQueries(srv, this), map = this;
                this.tiles.legendWfs.push(query);
                query.context = this.options.layers[i].id;
                query.onDataLoad = function(response, context) {
                    GWTK.Util.onLegendDataLoaded(response, context, map);
                };
                var xlay = GWTK.Util.getIdLayerXml(layer.idLayer);
                if (types !== "*")
                    query.sendRequest({
                        "restmethod": "createLegend",
                        "layer": xlay,
                        "width": width,
                        "objlocal": "0,1,2,4",
                        "typenames": types
                    });
                else
                    query.sendRequest({ "restmethod": "createLegend", "layer": xlay, "width": width, "objlocal": "0,1,2,4" });

                if (mapcontent)
                    mapcontent._removeLegendHolder(layer.xId);

                return true;
            }
            return false;
        },

        // map initialization methods

        /**
         * Инициализация контейнера карты
         * @method initContainer
         * @param id {String}, идентификатор HTML-элемента
         */
        initContainer: function(id) {
            var cont = this.container = document.getElementById(id);
            if (!cont) {
                throw new Error(this.translate("Map container not found"));
            }

            $("#" + id).addClass('none-select');

            $(this.container).addClass('gwtk-container');
            $(this.container).addClass('gwtk-touch-zoom');
            $(this.container).addClass('gwtk-touch-drag');
        },

        /**
         * Деструктор
         *
         * @method destroy
         */
        destroy: function() {

            $(this.eventPane).off();
            $(document).off(GWTK.mousemove);
            $(document).off(GWTK.keydown);
            $(document).off(GWTK.mouseup);
            $(document).off(GWTK.mousedown);
            $(window).off('resize');

            var i, len = this.layers.length;
            for (i = 0; i < len; i++) {                       // удалить слои
                if ($.isFunction(this.layers[i].onRemove)) {
                    this.layers[i].onRemove();
                }
            }

            if (this.tiles.sheetNamesList) {
                this.tiles.sheetNamesList.destroy();          // удалить списки листов карты
                this.tiles.sheetNamesList = null;
            }

            GWTK.Util.clearselectedFeatures(this);

            this.clearTools();

            this.tiles.destroy();

            $(this.panes.toolbarPane).empty();

            $(this.mapClone).remove();
            this.mapClone = null;

            // удалить все компоненты карты
            var objs = $(this.mapPane).children();
            objs.remove();

            $(this.mapPane).remove();
            this.mapPane = null;

            this.workspaceManager.closeConnection();
        },

        /**
         * Инициализация панелей карты
         * @method initPanes
         */
        initPanes: function() {
            var panes = this.panes = {};
            this.mapPaneOld = panes.mapPaneOld = document.getElementsByClassName('gwtk-map-panel')[0];
            this.mapFlexRow = this.container;

            // карта (основной контейнер)
            var mp = $(this.container).find('.map-pane-main');
            if (mp.length > 0) {
                this.mapPane = panes.mapPane = mp[0];
                $(this.mapPane).addClass('map-panel');
            }
            if (!this.mapPane) {
                this.createMapPanel();
            }

            // тайлы
            this.tilePane = panes.tilePane = this.createPane('tile-panel', this.mapPane);
            this.tilePane.id = this.divID + '_tilePane';
            GWTK.DomUtil.setPosition(this.tilePane, new PixelPoint(0, 0));

            // панель событий
            this.eventPane = panes.eventPane = this.createPane('event-panel', this.mapPane);
            this.eventPane.id = this.divID + '_eventPane';
            this.eventPane.setAttribute("unselectable", "on");
            this.eventPane.style.zIndex = 0;

            // панель событий мыши
            this.mouseDevicePane = panes.mouseDevicePane = this.createPane('event-panel', this.mapPane);
            this.mouseDevicePane.id = this.divID + '_mouseDevicePane';
            this.mouseDevicePane.setAttribute("unselectable", "on");

            // панель элементов управления
            this.controlsPaneOld = panes.controlsPaneOld = this.createPane('controls-panel', this.mapPane);
            this.controlsPane = panes.controlsPane = this.container.querySelector('.gwtk-controls-panel') || document.getElementsByClassName('gwtk-controls-panel')[0];

            // панель тулбара (кнопки инструментов)
            // panes.toolbarPane = this.createPane('toolbar-panel', this.controlsPane);
            panes.toolbarPane = this.controlsPane;

            // панель отображения масштаба, координат курсора, линейки
            this.tableScaleContainer = this.panes.scaleTable = this.createPane('scale-pane-table', this.mapPane);
            this.tableScaleContainer.id = this.divID + '_scaleTable';

            // панель оверлеев
            this.overlayPane = panes.overlayPane = this.createPane('overlay-panel', panes.mapPane);
            this.overlayPane.id = this.divID + '_overlayPane';

            this.htmlRendererPanel = panes.htmlRendererPanel = this.createPane('tooltip-panel', panes.mapPane);

            // панель рисования
            this.drawPane = this.createPane('draw-panel', panes.mapPane);
            this.drawPane.id = this.divID + '_drawPane';

            // панель рисования векторных объектов
            this.vectorPane = this.createPane('draw-panel svgdrawing-panel', panes.mapPane);
            this.vectorPane.id = this.divID + '_vectorPane';
            this.vectorPane.style.left = 0 + 'px';
            this.vectorPane.style.top = 0 + 'px';
            this.vectorPane.style.width = 100 + '%';
            this.vectorPane.style.height = 100 + '%';
            this.vectorPane.style.pointerEvents = 'none';

            // панель рисования
            this.underlayPane = panes.underlayPane = this.createPane('underlay-panel', panes.mapPane);
            this.underlayPane.id = this.divID + '_underlayPane';

            // панель для локальных карт
            this.graphicPane = panes.graphicPane = this.createPane('svgdrawing-panel', this.mapPane);
            this.graphicPane.id = this.divID + '_graphicPane';
            this.graphicPane.style.zIndex = parseInt($(panes.overlayPane).css('z-index')) - 1;
            this.graphicPane.style.position = 'absolute';
            this.graphicPane.style.top = '0px';
            this.graphicPane.style.left = '0px';
        },

        /**
         * Получить элементы панелей карты
         * @method getPanels
         * @return {Object}, {'map': mapPane, 'event': eventPane, toolbar': toolbarPane, 'overlay': overlayPane, 'draw': drawPane, 'wms': wmsPane}
         */
        getPanels: function() {
            var wmsPane = undefined;
            if (this.tiles.wmsManager) wmsPane = this.tiles.wmsManager.panel;
            return {
                'map': this.mapPane, 'event': this.eventPane,
                'toolbar': this.panes.toolbarPane, 'overlay': this.overlayPane,
                'draw': this.drawPane, 'wms': wmsPane
            };
        },

        /**
         * Создать панель div
         * @method createPane
         * @param className {String} имя css класса
         * @param container {Object} родительский элемент
         * @param animated {bool} признак, что панель используется при анимации
         */
        createPane: function(className, container, animated) {
            var pane = GWTK.DomUtil.create('div', className, container || this.panes.mapPane);
            if (animated) {
                this.animatedLayers.push({ layer: pane, clone: null });
            }
            return pane;
        },

        clearPanes: function() {
            this.container.removeChild(this.mapPane);
        },

        test: function(event) {
            //event.stopPropagation();
            console.log('Test DONE!');
            return false;
        },

        test2: function(event) {
            console.log('Test2 DONE!');
            //event.stopPropagation();
            return false;
        },

        onClick: function(event) {
            if (this.handlers) {
                this.handlers.mapclick(event.originalEvent);
            }
        },

        onMousewheel: function(eventData) {
            if (this.handlers) {
                var event = eventData;
                if (event.originalEvent && event.originalEvent.originalEvent) {
                    event = event.originalEvent;
                }

                this.handlers.mousewheelscaling(event);
            }
        },

        onMousedown: function(eventData) {
            if (this.handlers) {
                this.handlers.mapmousedown(eventData.originalEvent);
            }
        },

        onMouseup: function(eventData) {
            if (this.handlers) {
                this.handlers.mapmouseup(eventData.originalEvent);
            }
        },

        onMousemove: function(eventData) {
            if (this.handlers) {
                this.handlers.mapmove(eventData.originalEvent);
            }
        },

        onDocumentMousedown: function(eventData) {
        },

        onDocumentMouseup: function(eventData) {
        },

        onDocumentmousemove: function(eventData) {
        },

        onKeydown: function(eventData) {
        },

        // map events

        /**
         * Назначение обработчиков событий карты
         * @method initEvents
         */
        initEvents: function() {
            if (this.handlers != null) return;

            if (!GWTK.maphandlers) {
                this.handlers = GWTK.handlers(this);
            }else{
                this.handlers = new GWTK.Handlers(this);
            }

            // очередь установленных обработчиков событий
            this.maphandlers = [];

            var ep = this.panes.eventPane;

            if (ep == null) return;

            var map = this, $ep = $(ep);
            KeyboardDevice.subscribe(KeyboardEventType.KeyUp, (e) => {
                map.trigger({ type: 'keyup', target: 'map', originalEvent: e });
            });
            KeyboardDevice.subscribe(KeyboardEventType.KeyDown, (e) => {
                map.trigger({ type: 'keydown', target: 'map', originalEvent: e });
            });



            this.inputDevice = new MouseDevice(this.mouseDevicePane, ep);
            this.touchDevice = new TouchScreenDevice(this.mouseDevicePane, ep);
            this.inputDevice.subscribe(MouseEventType.DoubleClick, (e) => {
                map.trigger({ phase: 'before', type: 'dblclick', target: 'map', originalEvent: e.originalEvent });
            });

            // выбор объектов
            $ep.on('click', function(e) {
                map.trigger({ phase: 'before', type: 'click', target: 'map', originalEvent: e });
            });

            // масштабирование колесом мыши        (The DOMMouseScroll event is used in FF)

            document.addEventListener('wheel',
                function() {
                }.bind(this), { passive: false }); // fix Chrome passive:true
            $ep.on("mousewheel DOMMouseScroll wheel MozMousePixelScroll", function(e) {
                map.trigger({ type: 'mousewheel', target: 'map', originalEvent: e });
            });

            $(document).on(GWTK.mousemove, function(e) {
                map.trigger({ phase: 'before', type: 'documentmousemove', target: 'map', originalEvent: e });
            });

            $(document).on(GWTK.mouseup, function(e) {
                map.trigger({ type: 'documentmouseup', target: 'map', originalEvent: e });
            });
            $(document).on(GWTK.mousedown, function(e) {
                map.trigger({ type: 'documentmousedown', target: 'map', originalEvent: e });
            });

            // перемещение карты
            $ep.on(GWTK.mousedown, function(e) {
                map.trigger({ type: 'mousedown', target: 'map', originalEvent: e });
            });
            $ep.on(GWTK.mouseup, function(e) {
                map.trigger({ type: 'mouseup', target: 'map', originalEvent: e });
            });
            $ep.on(GWTK.mousemove, function(e) {
                map.trigger({ type: 'mousemove', target: 'map', originalEvent: e });
            });

            // совместимость JQuery
            $ep.on('svgclick', function(e) {
                this.trigger({ type: e.type, dataobject: e });
            }.bind(this));

            $(this.overlayPane).on('mapclick', function(e) {
                this.trigger({ type: e.type, point: e.point, coord: e.coord, geo: e.geo });
            }.bind(this));

            $ep.on('mapdragstart', function(e) {
                this.trigger({ type: e.type, offset: e.offset, target: 'map' });
            }.bind(this));

            $ep.on('mapdragend', function(e) {
                this.trigger({ type: e.type, offset: e.offset, target: 'map' });
            }.bind(this));

            $ep.on('mapdrag', function(e) {
                this.trigger({ type: e.type, offset: e.offset, target: 'map' });
            }.bind(this));

            $ep.on('layerlistchanged', function(e) {
                this.trigger({ type: e.type, maplayer: e.maplayer, target: 'map' });
            }.bind(this));

            $ep.on('featureinforefreshed', function(e) {
                var data = { type: e.type, layers: e.layers, centering: e.centering };
                if (e.rest_context) data['rest_context'] = e.rest_context;
                if (e.gid) data['gid'] = e.gid;
                if (e.showinfo) data['showinfo'] = e.showinfo;
                this.trigger(data)
            }.bind(this));

            $ep.on('showfeatureinfo', function(e) {
                this.trigger({ type: e.type, mapobject: e.mapobject, centering: e.centering })
            }.bind(this));

            $ep.on('featurelistclick', function(e) {
                this.trigger({ type: e.type, layer: e.layer, gid: e.gid })
            }.bind(this));

            $ep.on('getsembyobjnumber', function(e) {
                this.trigger({ type: e.type, answer: e.answer })
            }.bind(this));

            $ep.on('featurelistcanceled', function(e) {
                this.trigger({ type: e.type, target: this })
            }.bind(this));

            $ep.on('overlayRefresh', function(e) {
                this.trigger({ type: e.type, target: this, cmd: e.cmd })
            }.bind(this));

            $ep.on('resizecontrolspanel', function(e) {
                this.trigger({ type: e.type, target: this })
            }.bind(this));

            $ep.on('visibilitychanged', function(e) {
                this.trigger({ type: e.type, target: this, maplayer: e.maplayer });
            }.bind(this));

            $ep.on('closeaction', function(e) {
                this.trigger({ type: e.type, action: e.action })
            }.bind(this));

            $ep.on('loadClassifier', function(e) {
                this.trigger({ type: e.type, legend: e.legend, layer: e.layer })
            }.bind(this));

            map.on({ type: 'zoomIn', target: 'map' }, this.handlers.zoominclick);
            map.on({ type: 'zoomOut', target: 'map' }, this.handlers.zoomoutclick);

            this.setWindowSize();                                               // установить ширину и высоту окна - 100%

            this.onResize = GWTK.Util.throttle(GWTK.Util.bind(this.resizing, this), 150);

            this.onResizeEnd = GWTK.Util.bind(this.onResizeEnd, this);
            this.onResizeStart = GWTK.Util.bind(this.onResizeStart, this);

            $(window).resize(function() {                                     // изменение размера окна
                if (!map._sizeChanged) {
                    if (map._wmsEnabled()) {
                        map.tiles.wmsManager.onMapDragStart();
                    }
                }
                map.onResize();
            });


            this.onRefreshMap = GWTK.Util.debounce(function(event) {
                if (map._disableMapRefresh || map.is3dActive()) {
                    return;
                }
                if (event && event.wms) {
                    map.refresh();
                }else{
                    map.redraw();
                }
            }, 200);

            $ep.on('refreshmap.map', this.onRefreshMap);

            this.on('loadclassifierError', function(e) {

                const errorText = this.translate('Error getting legend of layer') + ' ' + e.layer.idLayer;
                this.writeProtocolMessage({ text: errorText, type: LogEventType.Error, display: true, description: e.error });

            }.bind(this));

        },

        /**
         * Отключить обновление карты для события `refreshmap`
         * @method disableMapRefresh
         */
        disableMapRefresh: function(flag) {
            return (this._disableMapRefresh = flag);
        },

        /**
         * Обновить изображение карты
         * @method refresh
         */
        refresh: function() {
            if (this.tiles) {
                this.tiles.drawMapImage(true, true, false);
            }
        },

        /**
         * Перерисовать изображение карты из полученных рисунков
         * @method refresh
         */
        redraw: function() {
            if (this.tiles) {
                this.tiles.drawMapImage(true, false, true);
            }
        },

        /**
         * Перевод из пиксельных координат в геодезические
         * @method pixelToGeo
         * @param point {PixelPoint} Координаты точки в пикселах
         * @return {GeoPoint} Координаты точки в градусах
         */
        pixelToGeo(point, zoom) {
            return this.pixelToPlane(point, zoom).toGeoPoint();
        },

        /**
         * Получить габариты окна в пикселах
         * @method getPixelBounds
         * @return {Rectangle} Габариты окна в пикселах
         */
        getPixelBounds: function() {
            if (!this.container) return;

            const boundingRect = this.container.getBoundingClientRect();

            return new Rectangle(boundingRect.left, boundingRect.bottom, boundingRect.right, boundingRect.top);
        },

        /**
         * Перевод из пиксельных координат окна в метры
         * @method pixelToPlane
         * @param point {PixelPoint} Координаты точки в пикселах
         * @param zoom {number} Уровень пирамиды тайлов
         * @return {MapPoint} Координаты точки в метрах
         */
        pixelToPlane(point, zoom = this.options.tilematrix) {
            const windowRect = this.getWindowRect();
            const halfHeight = 0.5 * windowRect.height;
            const halfWidth = 0.5 * windowRect.width;

            const matrix = this.Translate.getTileMatix();
            const metersPerPixel = matrix.getPixelSpan(zoom);
            return new MapPoint((halfHeight - point.y) * metersPerPixel + this.mapcenter.x, (point.x - halfWidth) * metersPerPixel + this.mapcenter.y, 0, this.Translate.ProjectionId);
        },

        /**
         * Необходимо ли переворачивать координаты
         * @method needTurnCoordinate
         * @return {number}
         */
        needTurnCoordinate: function() {
            return this.Translate.needTurnCoordinate();
        },

        /**
         * Получить габариты окна
         * @method getGeoBounds
         * @return {Rectangle} Габариты окна в градусах
         */
        getGeoBounds: function() {
            const leftBottomGeo = this.pixelToGeo(new PixelPoint(0, 0));
            const windowRect = this.getWindowRect();
            const rightTopGeo = this.pixelToGeo(new PixelPoint(windowRect.width, windowRect.height));

            return new Rectangle(
                leftBottomGeo.getLongitude(),
                leftBottomGeo.getLatitude(),
                rightTopGeo.getLongitude(),
                rightTopGeo.getLatitude()
            );
        },

        getBounds() {
            const windowRect = this.getWindowRect();
            const leftBottom = this.pixelToPlane(new PixelPoint(0, windowRect.height)).toOrigin();
            const rightTop = this.pixelToPlane(new PixelPoint(windowRect.width, 0)).toOrigin();

            return new Rectangle(
                leftBottom[0],
                leftBottom[1],
                rightTop[0],
                rightTop[1]
            );
        },
        /**
         * Перевод из геодезических координат в пиксельные
         * @method geoToPixel
         * @param geoPoint {GeoPoint} Координаты точки в градусах
         * @param [zoom] {number} Масштаб для перевода
         * @return {PixelPoint} Координаты точки в пикселах
         */
        geoToPixel(geoPoint, zoom) {
            const pointXY = geoPoint.toMapPoint();                             // метры в проекции матрицы
            return this.planeToPixel(pointXY, zoom)
        },

        /**
         * Перевод из метров в пиксельные координаты экрана
         * @method planeToPixel
         * @param planePoint {MapPoint} Координаты точки в метрах
         * @return {PixelPoint} Координаты точки в пикселах
         */
        planeToPixel: function(planePoint, zoom = this.options.tilematrix) {
            const windowRect = this.getWindowRect();
            const halfHeight = 0.5 * windowRect.height;
            const halfWidth = 0.5 * windowRect.width;

            const matrix = this.Translate.getTileMatix();
            const metersPerPixel = matrix.getPixelSpan(zoom);
            return new PixelPoint((planePoint.y - this.mapcenter.y) / metersPerPixel + halfWidth, halfHeight - (planePoint.x - this.mapcenter.x) / metersPerPixel);
        },

        getCenterPixelNew() {
            return this.geoToPixel(Trigonometry.toDegrees(ProjectionCollection[this.options.tilematrixset].xy2geo(this.mapcenter.y, this.mapcenter.x)));
        },

        /**
         * Запросить перерисовку
         * @method requestRender
         */
        requestRender() {
            this.redrawFlag = true;
        },

        /**
         * Отрисовка кадра
         * @method drawFrame
         */
        drawFrame() {
            window.requestAnimationFrame(this.drawFrame);

            this.trigger({ type: 'prerender', target: 'map' });

            if (this.redrawFlag) {
                if (this.vectorRenderer) {
                    this.mapObjectsViewer.clear();
                    this.vectorRenderer.clear();
                    this.htmlRenderer.clear();

                    for (let i = 0; i < this.vectorLayers.length; i++) {
                        const layer = this.vectorLayers[i];
                        if (layer instanceof GeoJsonLayer) {
                            layer.drawLayer(this.vectorRenderer);
                        }else if (layer instanceof HtmlLayer) {
                            layer.drawLayer(this.htmlRenderer);
                        }
                    }

                    this.redrawSelectedObjects();

                    if (this.activeObject) {
                        this.mapObjectsViewer.drawMapObject(this.vectorRenderer, this.activeObject, new Style({
                            stroke: new Stroke({ color: '#EA9899', width: '2px' }),
                            fill: new Fill({ color: '#CC0814', opacity: 0.3 }),
                            marker: new MarkerStyle({ markerId: DEFAULT_SVG_MARKER_ID }),
                            text: new TextStyle({ color: '#CC0814', contour: { color: '#EA9899', width: '2px' } })
                        }));
                    }

                    this.trigger({ type: 'postrender', target: 'map' });
                    this.mapObjectsViewer.drawRenderable(this.vectorRenderer);

                }

                this.redrawFlag = false;
            }
        },

        redrawSelectedObjects: function() {

            const lineColor = this.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_LINE_COLOR);

            const selectedObjectsIterator = this.getSelectedObjectsIterator();
            for (const selectedObject of selectedObjectsIterator) {
                if (selectedObject.vectorLayer instanceof GeoJsonLayer || selectedObject.vectorLayer.id === COMMON_VECTOR_LAYER_ID) {
                    this.mapObjectsViewer.drawMapObject(this.vectorRenderer, selectedObject, new Style({
                        stroke: new Stroke({ color: lineColor, width: 2 + 'px' }),
                        fill: undefined,
                        marker: new MarkerStyle({ markerId: DEFAULT_SVG_MARKER_ID }),
                        text: new TextStyle({ contour: { color: lineColor, width: 2 + 'px' } })
                    }));
                }
            }
        },

        /**
         * Обновить изображение карты с очисткой wms-изображений
         * @method redrawAndWmsLock
         * @param draw {Boolean} `true` - карта перерисовывается
         * независимо от значения draw устанавливаются пустые рисунки wms-слоям
         */
        redrawAndWmsLock: function(draw) {
            if (draw) {
                this.tiles.drawMapImage(true, false, false);
            }
        },

        /**
         * Создать элемент Canvas карты
         * @method _createCanvas
         */
        _createCanvas: function() {
            this.tiles._createCanvas();
        },

        /**
         * Получить элемент Canvas карты
         * @method _getCanvas
         * @return {HTMLCanvasElement}, HTML Canvas
         */
        _getCanvas: function() {
            return this.tiles && this.tiles._getCanvas();
        },

        /**
         * Запросить размер окна карты в пикселах
         * @method getWindowRect
         * @return {Rectangle}, Прямоугольник окна карты в пикселах
         */
        getWindowRect() {
            let width = 0, height = 0;
            const canvas = this._getCanvas();
            if (canvas) {
                width = canvas.width;
                height = canvas.height;
            }
            return new Rectangle(0, height, width, 0);
        },

        /**
         * Отрисовать карту на холсте
         * @method drawMapImageTo
         * @param bounds {{top: number, left: number, width: number, height: number}} фрагмент карты {left, top, width, height}
         * @param canvas {HTMLCanvasElement} Холст для отрисовки
         */
        drawMapImageTo: function(bounds, canvas) {
            const context = canvas.getContext('2d');
            if (context) {

                context.drawImage(
                    this._getCanvas(),
                    bounds.left,
                    bounds.top,
                    bounds.width,
                    bounds.height,
                    0,
                    0,
                    bounds.width,
                    bounds.height
                );
            }
        },

        /**
         * Установить холст для рисования по размеру
         * @method setCanvas
         * @param bounds {{top: number, left: number, width: number, height: number}} размер холста {left, top, width, height}
         * @param canvas {HTMLCanvasElement} Холст для отрисовки
         */
        setCanvasByBounds: function(bounds, canvas) {
            if (canvas !== undefined) {
                canvas.width = bounds.width;
                canvas.height = bounds.height;
                let context = canvas.getContext('2d');
                if (context) {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
        },

        drawWmsImageTo(canvas, filter) {
            if (this.tiles.wmsManager) {
                this.tiles.wmsManager.redraw(canvas, undefined, filter);
            }
        },

        /**
         * Доcтупность wms
         * @method _wmsEnabled
         * @return {boolean}, `true` wms доступен
         */
        _wmsEnabled: function() {
            return this.tiles && !!this.tiles.wmsManager;
        },

        /**
         * Настройка состава инструментов карты
         * @method initTools
         */
        initTools: function() {

            if (!this.options || !this.options.controls)
                return;

            // Редактор карты создается всегда, но отображается при наличии параметров инструмента,
            // параметры редактирования всегда добавляются в параметры карты
            if (!this.options.settings_mapEditor) {
                if (typeof settings_mapEditor != 'undefined' && !$.isEmptyObject(settings_mapEditor) &&
                    settings_mapEditor.maplayersid && settings_mapEditor.maplayersid.length > 0) {
                    this.options.settings_mapEditor = JSON.parse(JSON.stringify(settings_mapEditor));
                }
            }

            this.maptools.push(new GWTK.MapTaskBarControl(this));

            if (this.options.controls !== undefined && this.options.controls.length > 0 && this.options.controls[0] === '*') {
                this.options.controls = [
                    "mapscale", "mapcoordinates", "scaleupdown", "scalebyrect", "search", "searchSem", "selectrect",
                    "areasearch", "selectobjects", "clearselect", "objectslayer", "content", "map3d", "mapeditor", "ruler",
                    "polygonarea", "anglemeter", "builderofzone", "mapcalculations", "featuresamplescontrol", "rosreestr", "localmapcontrol",
                    "clusterizator", "addressatcoord", "geolocation", "scalerulercontrol", "routecontrol", "matrixcontrol",
                    "thematicmapcontrol", "exportLayer", "thematicmap", "userthematic", "objectPanel", "buildheatmap", "shutter",
                    "maplink", "viewoptions", "map2img", "viewentirelayer", "transitiontopoint"
                ];
            }

            if (this.getSize().x < 600) {
                this.tableScaleContainer.style.display = 'none';
            }
            // кластеризатор    ( Kozhanov )
            if (this.options.controls.includes('clusterizator') && this.options.cluster) {
                this.options.cluster.toolbarButton = true;
                new GWTK.ClusterControl(this, this.options.cluster || {});
            }

            // Анализ данных с bpla
            if ($.inArray("routebpla", this.options.controls) >= 0) {
                if (typeof this.options.settings_routeBPLA == 'undefined') {
                    if (typeof settings_routeBPLA !== 'undefined') {
                        this.options.settings_routeBPLA = settings_routeBPLA;
                    }
                }
                if (typeof this.options.settings_routeBPLA !== 'undefined') {
                    new GWTK.maproutes(this, this.options.settings_routeBPLA);
                }
            }

            // Cтатус бар
            this.statusbar = new GWTK.StatusBarControl(this);
        },

        /**
         * Проверить наличие параметра меню
         * @method hasMenu
         * @return {boolean} `true` - параметр имеется
         */
        hasMenu: function() {
            // if (typeof this.options.menubar !== "undefined" && this.options.menubar === 1) {
            //     return true;
            // }
            // if (this.options.controls && this.options.controls.length > 0) {
            //     if (this.options.controls[0] == '*' || this.options.controls.indexOf('mapmenu') > -1) {
            //         return true;
            //     }
            // }
            return false;
        },

        /**
         * Проверить наличие параметров dbm-слоев
         * @method hasMapDBLayers
         * @return {boolean} `true` - параметров dbm-слоев имеются
         */
        hasMapDbmLayers: function() {
            if (!this.options) {
                return false;
            }
            for (let i = 0; i < this.options.layers.length; i++) {
                if (this.options.layers[i]['mapdb']) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Проверить наличие таблиц dbm
         * @method hasMapDataBase
         * @return {boolean} `true` - таблицы имеются
         */
        hasMapDataBase: function() {
            return typeof GWTK['mapdbm'] !== 'undefined';
        },

        /**
         * Прочитать сообщения протокола событий
         * @method readProtocolMessages
         * @return {LogRecord[]} Массив сообщений
         */
        readProtocolMessages: function() {
            return this.contentMapEventLog.getMessages();
        },

        /**
         * Записать сообщение в протокол событий
         * @method writeProtocolMessage
         * @param message {LogMessage} Сообщение
         */
        writeProtocolMessage: function(message) {

            if (this.workspaceManager.getValue(PROJECT_SETTINGS_MAP_LOG_DEBUG_MODE) && !message.stack) {
                const stack = BrowserService.getCurrentStack();
                message.stack = stack.reverse().join('->');
            }

            this.contentMapEventLog.addMessage(message);
            this.trigger({ type: 'logmessage', target: 'map', message });
        },

        /**
         * Записать сообщение в протокол отладки
         * @method writeDebugLog
         * @param [description] {string} Сообщение
         */
        writeDebugLog (description) {
            if (this.workspaceManager.getValue(PROJECT_SETTINGS_MAP_LOG_DEBUG_MODE)) {
                const stack = BrowserService.getCurrentStack();
                const stackStr=stack.reverse().join('->');

                const message={
                    text: stack[0] || 'Undefined stack',
                    description: description || stackStr,
                    type: LogEventType.Debug,
                    display: false,
                    stack: stackStr
                };

                this.contentMapEventLog.addMessage(message);
                this.trigger({ type: 'logmessage', target: 'map', message });
            }
        },

        /**
         * Очистить протокол событий
         * @method clearProtocol
         */
        clearProtocol: function() {
            this.contentMapEventLog.clear();
            this.trigger({
                type: 'logmessage',
                target: 'map',
                message: {
                    text: this.translate('All event log entries have been deleted'),
                    type: LogEventType.Info,
                    display: true
                }
            });
        },

        /**
         * Запросить объект инструмента (контрола) карты по его имени
         * @method mapTool
         * @param toolname {String} имя контрола карты
         * @param getIndex {Boolean} признак вернуть индекс в массиве
         * @return {Object} или {Number} или null
         */
        mapTool: function(toolname, getIndex) {
            if (!this.maptools || this.maptools.length === 0) return null;
            var returnIndex = false, i, len = this.maptools.length;
            if (typeof getIndex != 'undefined' && getIndex === true) {
                returnIndex = true;
            }
            for (i = 0; i < len; i++) {
                if (typeof this.maptools[i].toolname !== 'undefined') {
                    if (this.maptools[i].toolname === toolname) {
                        if (returnIndex) {
                            return i;
                        }
                        return this.maptools[i];
                    }
                }
            }
            return null;
        },

        /**
         * Запросить объект инструмента (контрола) карты по его имени
         * @method getMapTool
         * @param toolname {String} имя контрола карты
         * @param getIndex {Boolean} признак вернуть индекс в массиве
         * @return {Object} или {Number} или null
         */
        getMapTool: function(toolname, getIndex) {
            return this.mapTool(toolname, getIndex);
        },

        /**
         * Запросить панель задач карты
         * @method getMapTaskBar
         * @return {Object} контрол Панель задач карты
         */
        getMapTaskBar: function() {
            return this.mapTool('maptaskbar');
        },

        /**
         * Очистить инструменты (контролы) карты
         * @method clearTools
         * метод вызывает destroy и удаляет все открытые контролы
         */
        clearTools: function() {
            var i, len = this.maptools.length;
            for (i = 0; i < len; i++) {
                if (!this.maptools[i]) continue;
                if (typeof this.maptools[i].destroy == 'function') {
                    this.maptools[i].destroy();
                    if (len === this.maptools.length) {
                        this.maptools.splice(i, 1);
                    }
                    len = this.maptools.length;
                    if (len === 0) break;
                    i--;
                }
            }

            this.maptools = [];
            $(this.panes.scalerPane).html('');
            $(this.tableScaleContainer).html('');
        },

        /**
         * Удалить инструмент
         * @method deleteUserControl
         */
        deleteUserControl: function(name) {
            if (typeof GWTK[name] !== 'undefined') {
                if ($.isFunction(GWTK[name].destroy))
                    GWTK[name].destroy();
                delete GWTK[name];
            }
            GWTK[name] = undefined;
        },

        /**
         * Проверить доступность localStorage.
         * @method _checkLocalStorageAvailability
         */
        _checkLocalStorageAvailability: function() {
            try {
                localStorage;
            } catch (e) {
                console.log(this.translate('Browser security policy does not allow use of local data storage. Application may not work correctly. ' +
                    'Unblock access in your browser settings or add to list of trusted sites: ') + location.host);
            }
        },

        /**
         * Восстановить параметры сеанса карты
         * @method restoreMapWorkspace
         */
        restoreMapWorkspace() {
            if (!this.workspaceManager) {
                return;
            }
            const newMapCenterPoint = this.workspaceManager.getValue(VIEW_SETTINGS_MAPCENTER);
            this.mapCenterPoint.x = newMapCenterPoint.x;
            this.mapCenterPoint.y = newMapCenterPoint.y;
            this.mapCenterPoint.h = newMapCenterPoint.h;

            this.options.tilematrix = this.workspaceManager.getValue(VIEW_SETTINGS_ZOOM_LEVEL);

            this.options.params3d = this.workspaceManager.getValue(VIEW_SETTINGS_PARAMS3D);

            if (this.options.objects3d) {
                var ids = this.workspaceManager.getValue(PROJECT_SETTINGS_VISIBLE_MODELS);
                if (ids.length > 0) {
                    var models3d = this.options.objects3d;
                    for (var j = 0; j < models3d.length; j++) {
                        var model3d = models3d[j];
                        if (ids.indexOf(model3d.id) !== -1) {
                            model3d.hidden = 0;
                        }else{
                            model3d.hidden = 1;
                        }
                    }
                }
            }
        },

        /**
         * Восстановить параметры карты из cookie
         * @method _readCookie
         * @param filter {String} имя ключа в cookie
         */
        _readCookie: function(filter) {
            if (!this.options) return;
            var param = GWTK.cookie(GWTK.cookies.getKey(), GWTK.cookies.converter);
            if (param === undefined) return;

            var json_prm = {};
            $.each(param, function(index, value) {
                var key = value.shift();
                var key_value = value.length > 0 ? value.shift() : '';
                if (key === 'id') {
                    json_prm.id = key_value;
                }else{
                    if (key === 'center') {
                        json_prm.center = GWTK.toLatLng(key_value.split(','));
                    }else if (key === 'z') {
                        json_prm.tilematrix = parseInt(key_value);
                    }else if (key === 'layers') {
                        json_prm.ids = key_value.split(',');
                    }else if (key === 'vieworder') {
                        json_prm.viewOrder = key_value.split(',');
                    }else if (key === 'marking') {
                        try {
                            json_prm[key] = JSON.parse(key_value);
                        } catch (e) {
                        }
                    }else if (key === 'measurementstyle') {
                        try {
                            json_prm[key] = JSON.parse(key_value);
                        } catch (e) {
                            console.log(e);
                        }
                    }else if (key === 'param_version') {
                        json_prm.param_version = key_value;
                    }else if (key === 'incline') {
                        json_prm.incline = parseFloat(key_value);
                    }else if (key === 'rotate') {
                        json_prm.rotate = parseFloat(key_value);
                    }else if (key === 'models3d') {
                        json_prm.models3d = key_value.split(',');
                    }else{
                        json_prm[key] = key_value;
                    }
                }
            });

            // проверка изменения параметров карты
            if (typeof this.onVerifyState === 'function') {
                if (!this.onVerifyState(filter, json_prm)) {
                    return;
                }
            }else{
                if (!json_prm.param_version || (json_prm.param_version !== this.param_version)) {
                    this._clearCookie();
                    return;
                }
            }

            if (!json_prm.id || json_prm.id !== this.options.id) return;

            if (filter === 'layersorder') {                          // restore layers view order
                var order;
                if (json_prm.viewOrder) {
                    order = json_prm.viewOrder.slice();
                    return order;
                }
                return order;
            }

            if (filter === 'layersprm') {                           // restore layers hidden key & opacityValue key in options
                this.tiles.setHiddenLayersOptions(json_prm.ids);
                this.tiles.setOpacityLayersOptions();
                return;
            }

            if (!filter || filter !== 'layers') {
                if ('tilematrix' in json_prm) this.options.tilematrix = this.zoomLimit(json_prm.tilematrix);
                if ('center' in json_prm) {
                    this.options.center = json_prm.center;
                }
                if ('marking' in json_prm) {
                    this.setSelectedMarkingOfObjects(json_prm.marking.fill);
                    if (json_prm.marking.fill && json_prm.marking.fill === "fill") {
                        this._restoreMarkingOfObjects(json_prm.marking);
                    }
                }
                if ('measurementstyle' in json_prm) {
                    this._restoreMeasurementStyle(json_prm["measurementstyle"]);
                }
                //Для режима 3D
                if ('incline' in json_prm) {
                    if (!this.options.params3d) {
                        this.options.params3d = {};
                    }
                    this.options.params3d.active = true;
                    this.options.params3d.incline = json_prm.incline;
                }
                if ('rotate' in json_prm) {
                    if (!this.options.params3d) {
                        this.options.params3d = {};
                    }
                    this.options.params3d.active = true;
                    this.options.params3d.rotate = json_prm.rotate;
                }
                if ('models3d' in json_prm && this.options.objects3d) {
                    var ids = json_prm.models3d;
                    if (ids.length > 0) {
                        var models3d = this.options.objects3d;
                        for (var j = 0; j < models3d.length; j++) {
                            var model3d = models3d[j];
                            if (ids.indexOf(model3d.id) !== -1) {
                                model3d.hidden = 0;
                            }else{
                                model3d.hidden = 1;
                            }
                        }
                    }
                }

            }


        },

        /**
         * Восстановить из cookie видимые панели карты deprecated!
         * @method _readCookiePanels
         */
        _readCookiePanels: function() {
        },

        /**
         * Записать в cookie видимые панели карты
         * @method _writeCookiePanels
         */
        _writeCookiePanels: function() {
        },

        /**
         * Очистить cookie карты.
         * @method _clearCookie
         */
        _clearCookie: function() {
            GWTK.cookie('', '', { expires: 0, path: '/' });
        },

        /**
         * Записать cookie карты
         * @method _writeCookie
         */
        _writeCookie: function() {
            const ids = [];

            for (let i = 0; i < this.layers.length; i++) {
                if (this.layers[i].getVisibility()) continue;
                ids.push(this.layers[i].xId);
            }

            //Для карт виртуальных папок (могут быть не созданы слои, а настройки были)
            const currentIdList = this.workspaceManager.getValue(PROJECT_SETTINGS_HIDDEN_LAYERS);
            currentIdList.forEach(id => {
                if (!this.layers.find(layer => layer.xId === id)) {
                    ids.push(id);
                }
            })

            this.workspaceManager.setValue(PROJECT_SETTINGS_HIDDEN_LAYERS, ids);

            const map3d = this.mapTool("3dMap");
            if (map3d) {
                map3d.createCookieArray();
            }

            this.workspaceManager.setValue(PROJECT_SETTINGS_LAYERS_OPACITY, this.tiles.getLayersOpacity());
            this.workspaceManager.setValue(PROJECT_SETTINGS_LAYERS_VIEW_ORDER, this.tiles.viewOrder);


            this.workspaceManager.setValue(VIEW_SETTINGS_ZOOM_LEVEL, this.options.tilematrix);



            // if (this.options == null) return;
            // список невидимых слоев
            // var i, len = this.layers.length, ids = [];
            // for (i = 0; i < len; i++) {
            //     if (this.layers[i].getVisibility()) continue;
            //     ids.push(this.layers[i].xId);
            // }
            // if (ids.length > 0) {
            //     ids = ids.join(',');
            // }else{
            //     ids = '-1';
            // }

            // var order = '-1',
            //     refresh = 0;
            // if ($.isArray(this.tiles.viewOrder) && this.tiles.viewOrder.length > 0) {
            //     order = this.tiles.viewOrder.join(',');
            // }

            // if (typeof this.options.refresh != 'undefined') {
            //     if (this.options.refresh > 0) {
            //         refresh = this.options.refresh;
            //     }
            // }

            // var s_marking = this.cookieValueMarkingOfObjects();
            // var s_measurementstyle = this.cookieValueMeasurementStyle();

            var value = [
                'param_version=' + this.param_version.toString(),
            ];
            //Если включен режим 3D
            // var map3d = this.mapTool("3dMap");
            // if (map3d) {
            //     var cookie3d = map3d.createCookieArray();
            //     for (var j = 0; j < cookie3d.length; j++) {
            //         value.push(cookie3d[j]);
            //     }
            // }
            // value = value.join('&');

            GWTK.cookie('', value, { expires: 5, path: '/' });
        },

        /**
         * Получить информацию об объектах карты по координатам точки
         * @method getFeatureInfo
         * @param point {GWTK.Point} координаты точки в окне карты (x,y), пикселы
         */
        getFeatureInfo: function(point) {
            // var list = this.tiles.getSelectableLayersEx(),
            //     xids = [];
            // if (list.length === 0 && this.selectedObjects) {
            //     this.placemarkRemove(this.selectedObjects.id);
            //     return;
            // }
            // var i, len = list.length;
            // for (i = 0; i < len; i++) {
            //     xids.push(list[i].id);
            // }
            //
            // if (!this.getTaskManager().canSelectObject())                                                     // выбор объектов запрещен
            //     return false;
            //
            // if (!this.objectManager) {                                                       // Fatal error!
            //     const errorMessage = 'Error of Map.getFeatureInfo. ' + 'Выбор объектов невозможен !';
            //     if (window.w2alert) {
            //         window.w2alert(errorMessage);
            //     }else{
            //         alert(errorMessage);
            //     }
            //     console.log(errorMessage);
            //     return;
            // }
            //
            // var objinfo = this.objectManager.getFeatureInfo(point);                      // перебор уже отобранных в точке объектов по клику
            // if (objinfo) {
            //     this.placemarkRemove(this.selectedObjects.id);
            //     // if (this.canShowFeatureInfo()) {
            //     //     $(this.eventPane).trigger({ type: 'showfeatureinfo', mapobject: objinfo.gid, centering: 0 }); // вывести информацию об объекте
            //     // }else{
            //     this.selectedObjects.drawcontour(objinfo, false, false);             // нарисовать
            //     // }
            //     return objinfo;
            // }else{
            //     this.objectManager.setPickPoint(point);                                            // не удалось, запоминаю точку
            // }
            //
            // var gfi = this.objectManager.featureRequest;
            // if (!gfi) {
            //     const errorMessage = 'Error of Map.getFeatureInfo. ' + 'Выбор объектов невозможен !';
            //     if (window.w2alert) {
            //         window.w2alert(errorMessage);
            //     }else{
            //         alert(errorMessage);
            //     }
            //     console.log(errorMessage);
            // }else{
            //
            //     // gfi.getFeatureInfo(point, null);               // запросить данные объектов в точке
            //     // this.searchManager.findInPoint(point).then((result) => {
            //     //     this.setActiveObject(result.mapObjects[0]);
            //     // });
            // }

        },

        // оверлеи карты
        /**
         * Добавить отметку в оверлей карты
         * @method overlayAppend
         * @param geo {GWTK.LatLng} географические координаты отметки
         * @param point {GWTK.Point} координаты отметки в окне карты
         * @param view {bool} показать/скрыть отметку
         * @param id {String} идентификатор отметки
         * @param type {bool} изменить размер отметки
         * @param size {Array} размер рисунка отметки [ширина, высота]
         * @param parentid {String} идетификатор родителя, которому принадлежить placemark
         * @param hint {String} подпись placemark
         */
        overlayAppend: function(geo, point, view, id, type, size, parentid, hint) {
            var mark = new GWTK.placemark(geo, hint, null, null, null, parentid, this);
            if (type)
                mark.setImage(point, type, size);
            //else mark.position(point);
            mark.position(point);
            if (view !== undefined && view) {
                if (this.overlayPane != null)
                    this.overlayPane.appendChild(mark.geopoint());
            }
            if (id !== undefined && id.length !== 0)
                mark.id = id;
            this.placemarks.push(mark);
        },

        /**
         * Удалить все отметки с панели оверлеев
         * @method overlayClear
         */
        overlayClear: function() {
            if (!this.overlayPane) return;
            var $child;
            for (var i = 0; i < this.overlayPane.childNodes.length; i++) {
                $child = $(this.overlayPane.childNodes[i]);
                if ($child.hasClass('placemark')) {
                    this.overlayPane.removeChild(this.overlayPane.childNodes[i]);
                    i--;
                }
            }
            this.panes.overlayPane.style.left = '0px';
            this.panes.overlayPane.style.top = '0px';
            this.drawPane.style.left = '0px';                                          // 18/11/16
            this.drawPane.style.top = '0px';
        },

        /**
         * Обновить объекты на оверлее
         * @method overlayRefresh
         */
        overlayRefresh: function(command) {

            this.overlayClear();
            if (this.placemarks && this.placemarks.length !== 0) {
                for (var i in this.placemarks) {
                    var geo = this.placemarks[i].latlong;
                    if (geo === undefined) continue;
                    var place = this.geoToPixel(new GeoPoint(geo.lng, geo.lat, 0, this.ProjectionId));
                    this.placemarks[i].position(place);
                }
                $(this.overlayPane).slideDown();
                if (this.markVisible === true) {
                    for (i in this.placemarks) {
                        this.overlayPane.appendChild(this.placemarks[i].geopoint());
                    }
                }
            }

            // Вызвать событие 'overlayRefresh', обновление оверлеев карты
            $(this.eventPane).trigger({ type: 'overlayRefresh', cmd: command });
        },

        /**
         * Удалить отметки на оверлее и в списке в карте
         * @method placemarkRemove
         * @param parentid {String} идетификатор родителя, которому принадлежить placemark
         */
        placemarkRemove: function(parentid) {
            var $child;
            for (var i = 0; i < this.overlayPane.childNodes.length; i++) {
                $child = $(this.overlayPane.childNodes[i]);
                if ((parentid && $child.hasClass(parentid)) || (!parentid && $child.hasClass('placemark'))) {
                    this.overlayPane.removeChild(this.overlayPane.childNodes[i]);
                    i--;
                }
            }
            if (this.placemarks) {
                for (i = this.placemarks.length - 1; i >= 0; i--) {
                    if ((parentid && this.placemarks[i].parentid === parentid) ||
                        (!parentid && !this.placemarks[i].parentid))
                        this.placemarks.splice(i, 1);
                }
            }
        },

        /**
         * Удалить все отметки на оверлее и в списке в карте
         * @method placemarkRemoveAll
         */
        placemarkRemoveAll: function() {
            var $child;
            for (var i = 0; i < this.overlayPane.childNodes.length; i++) {
                $child = $(this.overlayPane.childNodes[i]);
                if ($child.hasClass('placemark')) {
                    this.overlayPane.removeChild(this.overlayPane.childNodes[i]);
                    i--;
                }
            }
            if (this.placemarks) {
                this.placemarks.splice(0, this.placemarks.length);
            }
        },

        /**
         * Отобразить отметку в центре окна карты по индексу
         * @method viewPlacemark
         * @param index {Number} индекс отметки в массиве placemarks
         */
        viewPlacemark: function(index) {
            if (this.placemarks.length === 0 || index >= this.placemarks.length) return;
            var geo = this.placemarks[index].latlong;
            this.setViewport(geo);
            this.overlayRefresh();
        },

        /**
         * Переместить изображение карты
         * @method move
         * @param dx {Number} размер смещения по горизонтали, пиксел
         * @param dy {Number} размер смещения по вертикали, пиксел
         */
        move: function(dx, dy) {
            if (!this.tiles.tileScreen) {
                return;
            }
            //var coord = this.tiles._testShift(dx, dy),
            //    dx = coord[0],
            //    dy = coord[1];

            // тайловая панель
            var x0 = parseInt(this.tilePane.style.left, 10);
            var y0 = parseInt(this.tilePane.style.top, 10);
            this.tilePane.style.left = x0 + dx + 'px';
            this.tilePane.style.top = y0 + dy + 'px';
            this._updateCenter(dx, dy);

            // оверлеи
            if (this.panes.overlayPane) {
                x0 = parseInt(this.panes.overlayPane.style.left, 10);
                if (isNaN(x0)) x0 = 0;
                y0 = parseInt(this.panes.overlayPane.style.top, 10);
                if (isNaN(y0)) y0 = 0;
                this.panes.overlayPane.style.left = x0 + dx + 'px';
                this.panes.overlayPane.style.top = y0 + dy + 'px';
            }
            if (this.drawPane) {
                x0 = parseInt(this.drawPane.style.left, 10);
                if (isNaN(x0)) x0 = 0;
                y0 = parseInt(this.drawPane.style.top, 10);
                if (isNaN(y0)) y0 = 0;
                this.drawPane.style.left = x0 + dx + 'px';
                this.drawPane.style.top = y0 + dy + 'px';
            }

            x0 = parseInt(this.mapClone[0].style.left, 10);
            if (isNaN(x0)) x0 = 0;
            y0 = parseInt(this.mapClone[0].style.top, 10);
            if (isNaN(y0)) y0 = 0;
            this.mapClone[0].style.left = x0 + dx + 'px';
            this.mapClone[0].style.top = y0 + dy + 'px';

            this.tiles._onMouseMove(dx, dy);

            if (this.objectManager) {
                this.objectManager.clickData.clearPickPoint();
            }

        },

        /**
         * Инициализировать новый центр (временный)
         * @method _initNewCenterPixel
         */
        _initNewCenterPixel: function() {
            this.options.newCenterPixel = this.getCenterPixel().clone();
        },

        /**
         * Обновить новый центр (временный)
         * @method _updateNewCenterPixel
         */
        _updateNewCenterPixel: function(dx, dy) {
            if (typeof dx == 'undefined' || typeof dy == 'undefined' ||
                !this.options.newCenterPixel) {
                return;
            }
            this.options.newCenterPixel.add(new PixelPoint(-dx, -dy), this.options.newCenterPixel);
            return this.options.newCenterPixel;
        },

        /**
         * Получить новый центр (временный)
         * @method _updateNewCenterPixel
         */
        getNewCenterPixel: function() {
            return this.options.newCenterPixel;
        },

        /**
         * Обновить центр карты
         * @method _updateCenter
         * @param dx, dy {Number, Number} приращение координат, пикселы
         */
        _updateCenter: function(dx, dy) {
            var newcenter = this._updateNewCenterPixel(dx, dy);
            if (newcenter) {
                this.setMapCenter(this.tileMatrix.getPointByPixel(newcenter, this.getZoom()));
            }
        },

        /**
         * Проверить перемещение карты
         * @method isDrag
         * @return {Boolean} `true`/`false`, да/нет
         */
        isDrag: function() {
            return this.handlers.movedrag.drag;
        },

        /**
         * Проверить активность 3D режима (кнопка)
         * @method is3dActive
         * @return {Boolean} `true`/`false`, да/нет
         */
        is3dButtonActive: function() {
            return $("#panel_button-3dview").hasClass("control-button-active");
        },
        /**
         * Проверить активность 3D режима (кнопка)
         * @method is3dActive
         * @return {Boolean} `true`/`false`, да/нет
         */
        is3dActive: function() {
            var map3dTool = this.mapTool("3dMap");
            return map3dTool && map3dTool.isActive();
        },

        //Kozhanov+ 20.10.2015
        //окончание движения карты
        moveEnd: function(prevGeoBounds, newGeoBounds) {
            this._invoke('moveend', { oldBounds: prevGeoBounds, newBounds: newGeoBounds });
        },

        /**
         * Обработка изменения состава слоев карты
         * @method onLayerListChanged
         * @param treeitem { ContentTreeNode }, узел слоя дерева состава для добавления / удаления
         */
        onLayerListChanged: function(treeitem) {
            // обновить параметры дерева состава
            const updateFlag = this.contentTreeManager.updateTreeNodeList(treeitem);
            if (updateFlag) {
                // уведомить задачи карты
                this.trigger({ type: 'layerlistchanged', target: 'map' });
            }
        },

        saveDisabledNodes(nodeIds) {
            this.workspaceManager.setValue(PROJECT_SETTINGS_CONTENT_TREE_DISABLED_ARRAY, nodeIds);
        },

        loadDisabledNodes() {
            return this.workspaceManager.getValue(PROJECT_SETTINGS_CONTENT_TREE_DISABLED_ARRAY);
        },

        /**
         * Обновить параметры дерева слоев карты
         * @method updateContentTree
         * @public
         * @param treeoptions { ContentTreeNode или [ContentTreeNode] }, параметры дерева
         */
        updateContentTree: function(treeoptions) {
            if (typeof treeoptions !== 'string' || treeoptions.length === 0) {
                return;
            }
            const error_message = 'ContentTree update. Invalid contenttree options of the map.';
            try {
                const contenttree = JSON.parse(treeoptions);
                if (Array.isArray(contenttree.nodes) && contenttree.nodes.length > 0) {
                    this.options.contenttree = contenttree.nodes;
                }else{
                    if (Array.isArray(contenttree) && contenttree.length > 0) {
                        this.options.contenttree = contenttree;
                    }else{
                        console.log(error_message + contenttree);
                    }
                }
            } catch (e) {
                console.log(error_message);
            }
        },

        getContentTreeNode: function(id) {
            return this.contentTreeManager.getNode(id);
        },

        /**
         * Зарегистрировать подключаемый плагин
         * @method registerMapPlugin
         * @public
         * @param pluginDescription {PluginDescription} Описание плагина
         */
        registerMapPlugin: function(pluginDescription) {
            this.oldTaskButtons.push(
                {
                    id: pluginDescription.id,
                    icon: pluginDescription.icon ? pluginDescription.icon : 'address-in-point',
                    title: pluginDescription.title
                }
            );
            this.trigger({ type: 'registerplugin', target: 'map', plugin: pluginDescription });
        },

        /**
         * Скачать слой карты по указанному идентификатору в заданном формате
         * @async
         * @method downLoadLayer
         * @param layer {Layer} Слой
         * @param outType {OUTTYPE} Формат скачивания
         */
        async downLoadLayer(layer, outType) {
            const formatOptions = this.formats.find((format) => format.outType === outType);
            if (!formatOptions) {
                throw ('Format is not supported.');
            }

            const loadingId = layer.xId + outType;
            if (this.loadingStreams.includes(loadingId)) {
                return;
            }

            this.loadingStreams.push(loadingId);
            try {
                let blob;
                if (layer instanceof VectorLayer) {
                    blob = await layer.download(formatOptions);
                }else if (layer.idLayer) {
                    if (outType === OUTTYPE.CSV) {
                        const result = await this.searchManager.findAllObjects([layer], true);

                        if (result !== undefined && result.mapObjects) {
                            const headersList = this.generateHeadersListForCsv(result.mapObjects);
                            // Сформировать csv файл
                            blob = Utils.mapObjectsToCsv(result.mapObjects, headersList);
                        }
                    } else if (outType === OUTTYPE.MTQ) {
                        const service = RequestServices.retrieveOrCreate({ url: layer.server || '' }, ServiceType.REST);
                        const response = await service.getFile({ FILEPATH: layer.idLayer }, { responseType: 'blob' });
                        BrowserService.downloadContent(response.data, layer.alias.replace(/\s/g, '_') + '.' + outType.toLowerCase());
                    }else{
                        const service = RequestServices.retrieveOrCreate({ url: layer.server || '' }, ServiceType.REST);
                        const requestParams = {
                            LAYER: layer.idLayer,
                            OUTTYPE: formatOptions.outType,
                            OUTCRS: this.getCrsString()
                        };

                        const response = await service.getFeature([requestParams], {
                            responseType: 'blob'
                        });
                        if (response !== undefined && response.data) {
                            blob = response.data;
                        }
                    }
                }

                if (blob) {
                    const filename = layer.alias.replace(/\s/g, '_') + '.' + formatOptions.ext;
                    BrowserService.downloadContent(blob, filename);
                }
            } catch (err) {
                const errMessage = JSON.parse(err.message);
                console.log(errMessage);//fixme
            } finally {
                const index = this.loadingStreams.indexOf(loadingId);

                if (index !== -1) {
                    this.loadingStreams.splice(index, 1);
                }
            }

        },

        async downLoadLayerByPath(path, outType) {
            const formatOptions = this.formats.find((format) => format.outType === outType);
            if (!formatOptions) {
                throw ('Format is not supported.');
            }

            const loadingId = path + outType;
            if (this.loadingStreams.includes(loadingId)) {
                return;
            }

            this.loadingStreams.push(loadingId);
            try {
                let blob;
                if (path) {
                    if (outType === OUTTYPE.MTQ) {
                        const service = RequestServices.retrieveOrCreate({ url: this.options.url }, ServiceType.REST);
                        const response = await service.getFile({ FILEPATH: path }, { responseType: 'blob' });
                        BrowserService.downloadContent(response.data, layer.alias.replace(/\s/g, '_') + '.' + outType.toLowerCase());
                    }else{
                        const service = RequestServices.retrieveOrCreate({ url: this.options.url }, ServiceType.REST);
                        const requestParams = {
                            LAYER: path,
                            OUTTYPE: formatOptions.outType,
                            OUTCRS: this.getCrsString()
                        };

                        const response = await service.getFeature([requestParams], {
                            responseType: 'blob'
                        });
                        if (response !== undefined && response.data) {
                            blob = response.data;
                        }
                    }
                }

                if (blob) {
                    let suffix = '';
                    if (formatOptions.ext === 'zip') {
                        suffix = '(' + formatOptions.text + ')';
                    }
                    const filename = 'layer'.replace(/\s/g, '_') + suffix + '.' + formatOptions.ext;
                    BrowserService.downloadContent(blob, filename);
                }
            } catch (err) {
                const errMessage = JSON.parse(err.message);
                console.log(errMessage);//fixme
            } finally {
                const index = this.loadingStreams.indexOf(loadingId);

                if (index !== -1) {
                    this.loadingStreams.splice(index, 1);
                }
            }
        },

        /**
         * Формировать список заголовков полей для формирования csv файла
         * @method generateHeadersListForCsv
         * @param mapObjectsList {MapObject[]} Список объектов карты
         */
        generateHeadersListForCsv(mapObjectsList) {
            const headersKeysList = [];

            // заголовок "Имя объекта"
            const objectNameKeyValue = {
                key: '__objectName',
                value: this.translate('Object name')
            };
            headersKeysList.push(objectNameKeyValue);

            // заголовок "Имя слоя"
            const objectMapNameKeyValue = {
                key: '__layerAlias',
                value: this.translate('Layer name')
            };
            headersKeysList.push(objectMapNameKeyValue);

            // заголовок "Название листа"
            const objectSheetNameKeyValue = {
                key: '__sheetName',
                value: this.translate('Sheet name')
            };
            headersKeysList.push(objectSheetNameKeyValue);

            // заголовок "Номер объекта"
            const objectNumberKeyValue = {
                key: '__gmlId',
                value: this.translate('Object number')
            };
            headersKeysList.push(objectNumberKeyValue);

            // заголовок "Периметр объекта"
            const objectPerimeterKeyValue = {
                key: '__objectPerimeter',
                value: this.translate('Perimeter')
            };
            headersKeysList.push(objectPerimeterKeyValue);

            // заголовок "Площадь объекта"
            const objectAreaKeyValue = {
                key: '__objectArea',
                value: this.translate('Area')
            };
            headersKeysList.push(objectAreaKeyValue);

            // заголовки для семантик объекта
            mapObjectsList.forEach((mapObject) => {
                const semanticsList = mapObject.getSemanticsFiltered();
                semanticsList.forEach((semantic) => {
                    const index = headersKeysList.findIndex(item => item.key === semantic.key && item.value === semantic.name);
                    if (index === -1) {
                        headersKeysList.push({
                            key: semantic.key,
                            value: semantic.name
                        });
                    }
                });
            });

            return headersKeysList;
        },

        /**
         * Установить видимость слоя
         * @method setLayerVisibility
         * @param layer {Layer} Слой
         * @param value {boolean} Флаг видимости слоя
         */
        setLayerVisibility(layer, value) {
            if (layer) {
                this.tiles.wmsManager.clearState();
                const fn_refresh = layer.refresh ? layer.refresh : layer.update;
                const _visibility = layer.visible;

                if (value) {
                    layer.show();
                }else{
                    layer.hide();
                }

                if (typeof fn_refresh === 'function' && (_visibility !== layer.visible)) {
                    fn_refresh.call(layer);
                }
                // уведомить задачи карты
                this.trigger({ type: 'visibilitychanged', target: 'map', maplayer: { id: layer.xId, visible: value } });
                this._writeCookie();

                //fixme: для 3D пока что
                $(this.panes.eventPane).trigger({
                    type: 'visibilitychanged',
                    target: 'map',
                    maplayer: { id: layer.xId, visible: value }
                });

            }
        },

        /**
         * Переустановить карту
         * @method resetMap
         * @param mapoptions {Object} параметры карты, mapoptions.layers - параметры добавляемых слоев (новых)
         * @param remove {String} список идентификаторов слоев (через запятую), которые необходимо закрыть.
         *        При remove = '*' удаляются все имеющиеся слои карты.
         * @param skipcontenttree {bool} признак "Пропустить настройку дерева данных":
         *        `true`  - дерево данных не обновляется;
         *        `false` - дерево данных обновляется. Если в options есть параметр contenttree - по его
         *                  описанию, иначе обновление автоматически по списку слоев в карте.
         */
        resetMap: function(mapoptions, remove, skipcontenttree) {
        },

        /**
         * Создать панель карты
         * @method createMapPanel
         * если указано options.controlspanel также создается
         * боковая панель для инструментов карты
         */
        createMapPanel: function() {

            if (this.options.controlspanel) { // создать панель карты и боковую панель для контролов (компонентов карты)

                switch (this.options.controlspanel) {
                    case 'flex-left': { // боковая панель слева
                        // создать общую панель
                        this.mapFlexRow = this.createPane('mapflex-row', this.container);
                        // создать панель контролов (левую)
                        this.mapFlexControls = this.createPane('mapflex-controls-left', this.mapFlexRow);
                        this.mapControls = this.createPane('mapflex-controls', this.mapFlexControls);
                        // создать разделитель
                        this.mapFlexSplitter = this.createPane('mapflex-splitter', this.mapFlexRow);
                        // создать панель с картой (правую)
                        this.mapFlexMap = this.createPane('mapflex-map-right', this.mapFlexRow);
                        this.mapPane = this.panes.mapPane = this.createPane('map-panel map-pane-main', this.mapFlexMap);
                        // настроить разделитель панелей
                        this.initSplitter();
                        // свернуть панель контролов
                        this.hideControlsPanel();
                        break;
                    }
                    default: { // панель для инструментария в указанном контейнере
                        // создать панель контролов
                        var containerControls = document.getElementById(this.options.controlspanel);
                        if (containerControls) {
                            this.mapControls = this.createPane('mapflex-controls', containerControls);
                        }else{
                            console.log('[createMapPanel] Control container id="' + this.options.controlspanel + '" not found!');
                            return;
                        }
                        // создать панель карты
                        this.mapPane = this.panes.mapPane = this.createPane('map-panel', this.container);
                        $(this.mapPane).addClass('map-pane-main');
                        break;
                    }
                }

            }else{ // создать только панель карты (все контролы будут в ней)
                this.mapPane = this.panes.mapPane = this.createPane('map-panel', this.container);
                $(this.mapPane).addClass('map-pane-main');
            }
        },

        /**
         * Показать панель контролов
         * @method showControlsPanel
         */
        showControlsPanel: function() {

            if (!this.options.controlspanel)
                return;

            var currW = $(this.mapFlexControls).width(); // текущее значение ширины
            if (currW > 0)
                return; // панель уже свернута, выходим

            $(this.mapFlexControls).css({ width: this.mapControlsWidthLast }); // восстановить предыдущее значение ширины
            $(this.mapFlexSplitterButton).removeClass('mapflex-splitter-button-right'); // изменить картинку кнопки
            $(this.mapFlexSplitterButton).addClass('mapflex-splitter-button-left');

            // выдать триггер об изменении размеров панели контролов (должен обрабатываться в каждом контроле)
            $(this.eventPane).trigger({
                type: 'resizecontrolspanel'
            });
        },

        /**
         * Запросить список идентификаторов слоев карты
         * @method getLayersId
         */
        getLayersId: function() {
            var list = [], i, len = this.layers.length;
            if (len === 0) return '';

            for (i = 0; i < len; i++) {
                list.push(this.layers[i].xId);
            }

            return list.toString();
        },

        /**
         * Наличие авторизованного доступа по PAM для слоя
         * @method authTypeServer
         * @param url {String} url слоя
         * @return {Boolean} `true` / `false` есть / нет
         */
        authTypeServer: function(url) {
            return this.tiles.getAuthTypeServer(url);
        },

        /**
         * Наличие авторизованного доступа к основному сервису
         * @method authTypeExternal
         * @param url {String} url слоя, если слой основного сервиса,
         * авторизация выполняется
         * @return {Boolean} `true` / `false` есть / нет
         */
        authTypeExternal: function(url) {
            return this.tiles.authTypeExternal(url);
        },

        //  Единицы измерения пространсвенных характеристик объектов
        // ===============================================================
        /**
         * Инициализация параметров Единиц измерения
         * @method initMeasurementUnits
         */
        initMeasurementUnits: function() {
            if (!this.options)
                return;
            // var measurement = {
            //     "perimeter": { 'm': 1, 'km': 1, 'ft': 1, 'Nm': 1 },
            //     "area": { 'sq m': 1, 'ha': 1, 'sq km': 1 },
            //     "angle": { 'grad': 1, 'grad min sec': 1, 'rad': 1 },
            //     "selected": { "perimeter": "km", "area": "sq km", "angle": "grad" },
            //     "show": 0
            // };

            this.options.measurement = {
                "perimeter": { 'm': 1, 'km': 1, 'ft': 1, 'Nm': 1 },
                "area": { 'sq m': 1, 'ha': 1, 'sq km': 1 },
                "angle": { 'grad': 1, 'grad min sec': 1, 'rad': 1 },
                "selected": { "perimeter": "km", "area": "sq km", "angle": "grad" },
                "show": 0
            };

            if (this.options.measurementunit) {
                var units = this.options.measurement;
                if ('perimeter' in this.options.measurementunit) {
                    if (units.perimeter[this.options.measurementunit['perimeter']] !== undefined) {
                        units.selected.perimeter =
                            this.options.measurementunit['perimeter'];
                    }
                }
                if ('area' in this.options.measurementunit) {
                    if (units.area[this.options.measurementunit['area']] !== undefined) {
                        units.selected.area = this.options.measurementunit['area'];
                    }
                }
            }

        },

        /**
         * Инициализация параметров выделения объектов
         * @returns {boolean}
         */
        initMarkingOfObjects: function() {
            if (!this.options) return false;
            this.options.markingofobjects = {
                fill: {
                    name: "Paint",
                    style: {
                        color: "cc0814",                                   // цвет заливки
                        linecolor: 'ea9899',                               // цвет контура
                        opacity: "0.3",                                    // непрозрачность
                        linewidth: [                                       // толщина линии контура
                            { id: '1px', text: '1', selected: false },
                            { id: '2px', text: '2', selected: true },
                            { id: '3px', text: '3', selected: false },
                            { id: '4px', text: '4', selected: false }
                        ]
                    },
                    filltype: {                                            // тип рисования:
                        filling: { name: "Filling", selected: true },      // заливка
                        outline: { name: "Contour", selected: false }      // контур
                    }
                },
                marker: {
                    name: "Marker"                                          // имя маркера
                },
                selected: { fill: true, marker: false }  // выделение объектов: рисование/маркер

            }
            if (this.options.highlightmode && this.options.highlightmode === "marker") {
                this.options.markingofobjects.selected.fill = false;
                this.options.markingofobjects.selected.marker = true;
            }
        },
        /**
         * Инициализация стилей измерения
         * @method initMeasurementStyle
         * @returns {boolean}
         */
        initMeasurementStyle: function() {
            if (this.options) {
                this.options.measurementstyle = {
                    fillcolor: "fffd59",                               // цвет заливки
                    linecolor: 'da4447',                               // цвет контура
                    opacity: "0.7"                                     // непрозрачность
                }
            }
        },

        /**
         * Восстановить параметры выделения объектов из куки-значения
         * @method _restoreMarkingOfObjects
         * @param param {Object} параметры выделения из cookie,
         * {fill:'fill'/'marker', color:'', colorline:'', opacity:'0.3', filltype:'fill'/'contour', lw:'1px' }
         */
        _restoreMarkingOfObjects: function(param) {
            if (!param || $.isEmptyObject(param)) {
                return;
            }
            this.toggleFillType(param.filltype);
            this.setColorDrawingLayer(param.color);
            this.setColorLineDrawingLayer(param.colorline);
            this.setOpacityDrawingLayer(param.opacity);
            if (param.lw && param.lw.id !== undefined)
                this.toggleStrokeWidth(param.lw.id);
            if (this.selectedObjects) {
                if (param.filltype === 'outline') {
                    this.selectedObjects.drawoptionsSelected.fill = 'none';
                }else{
                    this.selectedObjects.drawoptionsSelected.fill = '#' + this.options.markingofobjects.fill.style.color;
                }
                this.selectedObjects.drawoptionsSelected['fill-opacity'] = this.options.markingofobjects.fill.style.opacity;
                this.selectedObjects.drawoptionsSelected.stroke = '#' + this.options.markingofobjects.fill.style.linecolor;
                this.selectedObjects.drawoptionsSelected['stroke-opacity'] = 0.75;
                var getSelectedStrokeWidth = this.getSelectedStrokeWidth();
                if (getSelectedStrokeWidth) {
                    this.selectedObjects.drawoptionsSelected['stroke-width'] = this.getSelectedStrokeWidth().id;
                }
            }
        },

        /**
         * Куки-значение параметров выделения объектов
         * @method cookieValueMarkingOfObjects
         */
        cookieValueMarkingOfObjects: function() {
            if (!this.options || typeof this.options.markingofobjects === 'undefined') {
                return false;
            }
            var marking;
            var paint = this.getSelectedMarking();
            if (paint.id !== "fill") {
                marking = { fill: paint.id };
            }else{
                marking = {
                    fill: paint.id,
                    color: this.options.markingofobjects.fill.style.color,
                    colorline: this.options.markingofobjects.fill.style.linecolor,
                    opacity: this.options.markingofobjects.fill.style.opacity,
                    filltype: this.getSelectedFillType().id
                };
                var getSelectedStrokeWidth = this.getSelectedStrokeWidth();
                if (getSelectedStrokeWidth) {
                    marking.lw = getSelectedStrokeWidth;
                }
            }

            if (marking) {
                return JSON.stringify(marking);
            }
            return marking;
        },


        /**
         * Восстановить стили измерений из куки-значения
         * @method _restoreMeasurementStyle
         * @param param {object} Стили измерения из cookie `{fillcolor:'', linecolor:'', opacity:'0.3'}`
         */
        _restoreMeasurementStyle: function(param) {
            this._updateMeasurementDrawingStyle(param);
        },
        /**
         * Куки-значение стилей измерения
         * @method cookieValueMeasurementStyle
         * @return {object|undefined} Стили измерения для cookie `{fillcolor:'', linecolor:'', opacity:'0.3'}`
         */
        cookieValueMeasurementStyle: function() {
            var result;
            if (this.options && this.options.measurementstyle) {
                result = JSON.stringify(this.options.measurementstyle);
            }
            return result;
        },

        /**
         * Установить способ выделения объектов
         * @param {String} propName - название свойства
         */
        setSelectedMarkingOfObjects: function(propName) {
            for (var i in this.options.markingofobjects.selected) {
                if (i === propName) {
                    this.options.markingofobjects.selected[i] = true;
                }else{
                    this.options.markingofobjects.selected[i] = false;
                }
            }
        },

        /**
         * Установить параметры выделения отобранных объектов
         * @method setSettingsDrawingLayer
         * @param options {Object} Параметры выделения
         * @returns {boolean}
         */
        setSettingsDrawingLayer: function(options) {
            // тип выделения объектов
            var fillType = 'filling';
            if (options.fillType === 'Contour')
                fillType = 'outline';
            // цвет заливки
            var color;
            if (options.fillColor)
                color = options.fillColor.replace('#', '').toLowerCase();
            // цвет рамки
            var colorLine;
            if (options.lineColor)
                colorLine = options.lineColor.replace('#', '').toLowerCase();
            // прозрачность
            var opacity = options.opacity;
            // ширина рамки
            var lineWidth;
            if (options.strokeWidth)
                lineWidth = options.strokeWidth + 'px';

            if (!fillType || !color || !opacity || !lineWidth || !colorLine || !this.options.markingofobjects)
                return false;
            this.toggleFillType(fillType);
            this.setColorDrawingLayer(color);
            this.setColorLineDrawingLayer(colorLine);
            this.setOpacityDrawingLayer(opacity);
            this.toggleStrokeWidth(lineWidth);

            if (this.selectedObjects) {
                if (fillType === 'outline') {
                    this.selectedObjects.drawoptionsSelected.fill = 'none';
                }else{
                    this.selectedObjects.drawoptionsSelected.fill = '#' + this.options.markingofobjects.fill.style.color;
                }
                this.selectedObjects.drawoptionsSelected['fill-opacity'] = this.options.markingofobjects.fill.style.opacity;
                this.selectedObjects.drawoptionsSelected.stroke = '#' + this.options.markingofobjects.fill.style.linecolor;
                this.selectedObjects.drawoptionsSelected['stroke-opacity'] = 0.75;
                this.selectedObjects.drawoptionsSelected['stroke-width'] = this.getSelectedStrokeWidth().id;
            }
            //this._writeCookie();
        },

        /**
         * Установить стили отображения измерений
         * @method setMeasurementDrawingStyle
         * @param options {object} Параметры рисования
         * @returns {boolean} Флаг изменения стилей
         */
        setMeasurementDrawingStyle: function(options) {
            var updateFlag = this._updateMeasurementDrawingStyle(options);
            if (updateFlag) {
                //this._writeCookie();
            }
            return updateFlag;
        },

        /**
         * Установить стили отображения измерений
         * @method setMeasurementDrawingStyle
         * @private
         * @param options {object} Параметры рисования
         * @returns {boolean} Флаг изменения стилей
         */
        _updateMeasurementDrawingStyle: function(options) {
            var updateFlag = false;
            if (options && this.options && this.options.measurementstyle) {
                for (var key in options) {
                    var lowercaseKey = key.toLowerCase();
                    if (this.options.measurementstyle[lowercaseKey] !== undefined && this.options.measurementstyle[lowercaseKey] !== options[key]) {
                        if (typeof options[key] === 'string') {
                            this.options.measurementstyle[lowercaseKey] = options[key].replace('#', '').toLowerCase();
                        }else{
                            this.options.measurementstyle[lowercaseKey] = options[key];
                        }
                        updateFlag = true;
                    }
                }
            }
            return updateFlag;
        },

        /**
         * Установить параметры выделения в класс отобранных объектов
         * @method setSelectedObjectsDrawOptions
         */
        setSelectedObjectsDrawOptions: function() {
            if (!this.selectedObjects) {
                return;
            }
            this.selectedObjects._setDrawOptionsSelected();
        },

        /**
         * Отобразить (выделить цветом) отобранные объекты
         */
        drawSelectedFeatures: function() {
            if (this.selectedObjects)
                this.selectedObjects.drawSelectedObjects();
        },

        /**
         * Получить цвет линий для выделения объектов
         * @method getLineColorMarkedObjects
         * @param hex {boolean} при hex = true выдается без '#'
         * @returns {string} цвет линий, в hex формате
         */
        getLineColorMarkedObjects: function(hex) {
            let lineColor = this.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_LINE_COLOR);
            if (hex && lineColor[0] === '#') {
                lineColor = lineColor.slice(1, lineColor.length);
            }
            return lineColor;
        },


        /**
         * Запросить способ выделения объектов
         * @returns {Object}
         */
        getSelectedMarking: function() {
            if (this.options.markingofobjects.selected.fill) {
                return { id: 'fill', text: this.translate(this.options.markingofobjects.fill.name) };
            }else{
                return { id: 'marker', text: this.translate(this.options.markingofobjects.marker.name) };
            }
        },

        /**
         * Получить список параметров выделения объектов
         * @returns {Array}
         */
        getMarkingList: function() {
            var arr = [];
            for (var i in this.options.markingofobjects) {
                if (this.options.markingofobjects.hasOwnProperty(i) && i !== 'selected') {
                    arr.push({ id: i, text: this.translate(this.options.markingofobjects[i]['name']) })
                }
            }
            return arr;
        },

        /**
         * Получить список доступных параметров
         */
        getFillTypeList: function() {
            var arr = [];
            for (var i in this.options.markingofobjects.fill.filltype) {
                if (this.options.markingofobjects.fill.filltype.hasOwnProperty(i)) {
                    arr.push({
                        id: i,
                        text: this.translate(this.options.markingofobjects.fill.filltype[i]['name'])
                    });
                }
            }
            return arr;
        },

        /**
         * Получить тип выделения объекта
         * @returns {{id: string, text: *}}
         */
        getSelectedFillType: function() {
            for (var i in this.options.markingofobjects.fill.filltype) {
                if (this.options.markingofobjects.fill.filltype.hasOwnProperty(i) && this.options.markingofobjects.fill.filltype[i]['selected']) {
                    return {
                        id: i,
                        text: this.translate(this.options.markingofobjects.fill.filltype[i]['name'])
                    }
                }
            }
        },

        /**
         * Получить выбранную толщину линии
         * @returns {*}
         */
        getSelectedStrokeWidth: function() {
            for (var i = 0; i < this.options.markingofobjects.fill.style.linewidth.length; i++) {
                if (this.options.markingofobjects.fill.style.linewidth[i].selected) {
                    return this.options.markingofobjects.fill.style.linewidth[i];
                }
            }
            this.options.markingofobjects.fill.style.linewidth[0].selected = true;
            return this.options.markingofobjects.fill.style.linewidth[0];
        },

        /**
         * Установить выбранную толщину линии
         * @param {String} newId - идентификатор толщины линии
         */
        toggleStrokeWidth: function(newId) {
            if (newId === undefined) return;
            for (var i = 0; i < this.options.markingofobjects.fill.style.linewidth.length; i++) {
                this.options.markingofobjects.fill.style.linewidth[i].selected = this.options.markingofobjects.fill.style.linewidth[i].id === newId;
            }
        },

        /**
         * Изменить тип заливки объектов
         * @param {String} newFillType - идентиФикатор параметра
         * @returns {boolean}
         */
        toggleFillType: function(newFillType) {
            if (!newFillType) return false;
            for (var i in this.options.markingofobjects.fill.filltype) {
                this.options.markingofobjects.fill.filltype[i]['selected'] = !!(newFillType === i || newFillType === this.options.markingofobjects.fill.filltype[i]['name']);
            }
            return true;
        },

        /**
         * Установить новый цвет для выделенных объектов
         * @param {String} color - цвет
         * @returns {boolean}
         */
        setColorDrawingLayer: function(color) {
            if (!color || !this.options) return false;
            this.options.markingofobjects.fill.style.color = color;
            return true;
        },
        /**
         * Установить цвет обводки
         * @param {String} color - цвет
         * @returns {boolean}
         */
        setColorLineDrawingLayer: function(color) {
            if (!color || !this.options) return false;
            this.options.markingofobjects.fill.style.linecolor = color;
            return true;
        },

        /**
         * Установить прозрачность для выделенных объектов
         * @param {String} newValue - значение прозрачности
         * @returns {boolean}
         */
        setOpacityDrawingLayer: function(newValue) {
            if (!newValue || !this.options) return false;
            this.options.markingofobjects.fill.style.opacity = newValue;
        },

        /**
         * Запросить признак подсчета суммарной площади и периметра отборанных объектов
         * @method getMeasurementShow
         */
        getMeasurementShow: function() {
            if (this.options.measurement && this.options.measurement.show)
                return true;
            return false;
        },

        /**
         * Установить признак подсчета суммарной площади и периметра отборанных объектов
         * @method setMeasurementShow
         * @returns {boolean}
         */
        setMeasurementShow: function(newValue) {
            if (!this.options.measurement || !!this.options.measurement.show)
                return false;
            this.options.measurement.show = newValue;
        },

        /**
         * Запросить текущие Единицы измерения площади
         * @method getAreaUnits
         * @return {String} название единицы ('sq m' или 'ha' или 'sq km') или null
         */
        getAreaUnits: function() {
            if (this.options.measurement && this.options.measurement.selected && this.options.measurement.selected.area)
                return this.options.measurement.selected.area;
            return null;
        },

        /**
         * Установить Единицы измерения площади
         * @method setAreaUnits
         * @return {boolean}
         */
        setAreaUnits: function(newValue) {
            if (!this.options.measurement || !this.options.measurement.selected || !this.options.measurement.selected.area)
                return false;
            this.options.measurement.selected.area = newValue;
        },

        /**
         * Запросить текущие Единицы измерения длины
         * @method getLinearUnits
         * @return {String} название единицы ('m' или 'km') или null
         */
        getLinearUnits: function() {
            if (this.options.measurement && this.options.measurement.selected && this.options.measurement.selected.perimeter)
                return this.options.measurement.selected.perimeter;
            return null;
        },

        /**
         * Установить Единицы измерения длины
         * @method setLinearUnits
         * @return {boolean}
         */
        setLinearUnits: function(newValue) {
            if (!this.options.measurement && !this.options.measurement.selected && !this.options.measurement.selected.perimeter)
                return false;
            this.options.measurement.selected.perimeter = newValue;
        },

        /**
         * Запросить текущие Единицы измерения углов
         * @method getAngleUnits
         * @return {String} название единицы ('ggad', 'grad min sec' или 'rad') или null
         */
        getAngleUnits: function() {
            if (this.options.measurement && this.options.measurement.selected && this.options.measurement.selected.angle)
                return this.options.measurement.selected.angle;
            return null;
        },

        /**
         * Установить Единицы измерения углов
         * @method setAngleUnits
         * @return {boolean}
         */
        setAngleUnits: function(newValue) {
            if (!this.options.measurement && !this.options.measurement.selected && !this.options.measurement.selected.angle)
                return false;
            this.options.measurement.selected.angle = newValue;
        },

        /**
         * Преобразовать значение площади в кв м в текущие единицы площади
         * @method squareMetersToUnits
         * @param area площадь, кв м
         * @return {Object} или `null` при ошибке
         * {'area': площадь, 'unit': название единицы ('sq m'/'ha'/'sq km'), 'str_area': area & unit}
         */
        squareMetersToUnits: function(area) {
            if (typeof area === 'undefined')
                return null;
            var area_num = parseFloat(area), sarea,
                unit = ' m²';
            var sel_unit = this.getAreaUnits();                        // установленные единицы измерения площади
            if (!sel_unit) {
                if (area_num > 1000000.0) {
                    area_num = area_num / 1000000.0;
                    unit = ' km²';
                }
                sarea = 3 ? Number(area_num).toFixed(3) : area_num;
                if (window.w2utils) {
                    sarea = window.w2utils.formatNumber(sarea, ' ') + unit;
                }
            }else{
                if (sel_unit === 'sq m') {
                    unit = ' m²';
                }else if (sel_unit === 'ha') {
                    unit = ' ha';
                    area_num = area_num / 10000.0;
                }else if (sel_unit === 'sq km') {
                    area_num = area_num / 1000000.0;
                    unit = ' km²';
                }
                sarea = 3 ? Number(area_num).toFixed(3) : area_num;
                if (window.w2utils) {
                    sarea = window.w2utils.formatNumber(sarea, ' ') + unit;
                }
            }

            return { 'area': area_num, 'unit': sel_unit, 'text': sarea };
        },

        /**
         * Преобразовать значение площади в кв м в текущие единицы площади
         * @method squareMetersToUnits
         * @return {Object} или `null` при ошибке
         * {'perimeter': длина, 'unit': название единицы ('m'/'ft'/'km'/'Nm'), 'str_perimeter': perimeter & unit}
         */
        linearMetersToUnits: function(length) {
            if (length == null)
                return null;
            var perimeter = parseFloat(length), d;
            if (this.getLinearUnits()) {                                               // установленные единицы измерения длины
                var units = this.getLinearUnits();
                switch (units) {
                    case 'm':
                        d = perimeter.toFixed(3) + ' m';
                        break;
                    case 'km':
                        if (perimeter < 1000) {
                            d = perimeter.toFixed(3) + ' m';
                            units = 'm';
                        }else{
                            perimeter = perimeter / 1000.;
                            d = perimeter.toFixed(3) + ' km';
                        }
                        break;
                    case 'ft':
                        perimeter = GWTK.Util.m2feet(perimeter);
                        d = perimeter.toFixed(3) + ' ft';
                        break;
                    case 'Nm':
                        perimeter = GWTK.Util.m2Nmile(perimeter);
                        d = perimeter.toFixed(3) + ' Nm';
                        break;
                    default:
                        d = perimeter.toFixed(2) + ' m';
                        break;
                }
            }else{
                if (perimeter >= 1000.0) {
                    perimeter = perimeter / 1000.;
                    units = 'km';
                    d = perimeter.toFixed(3)
                }else d = perimeter.toFixed(2);
                d += ' ' + units;
            }

            return { 'perimeter': perimeter, 'unit': units, 'text': d };
        },

        /**
         * Преобразовать текущие единицы изменения в метры
         * @param length - значение
         * @method currentUnitsToMeters
         * @return {Object} или `null` при ошибке
         * {'perimeter': perimeter}
         */
        currentUnitsToMeters: function(length) {
            if (!length) return null;
            var perimeter = parseFloat(length);
            if (this.getLinearUnits()) {                                               // установленные единицы измерения длины
                var units = this.getLinearUnits();
                switch (units) {
                    case 'm':
                        break;
                    case 'km':
                        perimeter = perimeter * 1000.;
                        break;
                    case 'ft':
                        perimeter = GWTK.Util.feet2m(perimeter);
                        break;
                    case 'Nm':
                        perimeter = GWTK.Util.nmile2m(perimeter);
                        break;
                    default:
                        break;
                }
            }
            return { 'perimeter': perimeter }
        },

        /**
         * Преобразовать значение угла из радиан в текущие единицы измерения углов
         * @method angleRadToUnits
         * @param angle угол в радианах
         * @return {Object} или `null` при ошибке
         * {'angle': угол, 'unit': название единицы ('grad'/'grad min sec'/'rad'), 'str_angle': angle & unit}
         */
        angleRadToUnits: function(angle) {
            if (angle == null)
                return null;
            var d, val = parseFloat(angle), grad = (val * 180) / Math.PI;
            var units = this.getAngleUnits();
            if (units) {                                               // установленные единицы измерения длины
                switch (units) {
                    case 'grad':
                        d = (Math.round(grad * 10000) / 10000).toString() + "°";
                        break;
                    case 'grad min sec':
                        d = GWTK.LatLng.prototype.Degrees2DegreesMinutesSeconds(grad);
                        break;
                    case 'rad':
                        d = val.toFixed(6);
                        break;
                }
            }
            return { 'angle': val, 'unit': units, 'text': d };

        },

        /**
         * Создать панель карты
         * @method createMapPanel
         */
        // createMapPanel: function() {
        //     this.mapPane = this.panes.mapPane = this.createPane('map-panel', this.container);
        //     this.mapPane.classList.add('map-pane-main');
        // },

        // FIX для контролов карты                 // TODO - убрать при миграции контролов во Vuejs

        onSearchDataLoaded: function(response) {
            let mapObjects = [];
            let filePath;
            let result;
            if (response && response.data) {
                const restmethod = response.data.restmethod;
                if (restmethod) {
                    filePath = restmethod.outparams[0].value;
                }else{
                    result = response.data;
                    if (typeof result.features == 'undefined') {
                        return { mapObjects, filePath };
                    }
                    const mapobjects = geoJsonToMapObjects(this, result);
                    if (mapobjects) mapObjects = mapobjects.splice(0);
                }
            }
            return { mapObjects, filePath };
        },

        onFileDataLoaded: function(response) {
            if (!response || !response.type || 'FeatureCollection' !== response.type) {
                return;
            }
            let mapObjects = geoJsonToMapObjects(this, response);
            if (!mapObjects) {
                return;
            }
            return { mapObjects: mapObjects.splice(0), filePath: '' };
        },
        //
        // _jsonToMapObjects: function(json) {
        //     if (!json || !json.type || 'FeatureCollection' !== json.type) {
        //         return;
        //     }
        //     const features = json.features;
        //     const mapObjects = [];
        //     if (!Array.isArray(features)) {
        //         return;
        //     }
        //     for (var i = 0; i < features.length; i++) {
        //         var layerId = features[i].properties.mapid;
        //         var layer = this.tiles.getLayerByIdService(layerId);
        //         if (layer) {
        //             mapObjects.push(MapObject.fromJSON(layer, features[i]));
        //         }
        //     }
        //     return mapObjects;
        // },

        _setSearchManager: function(mapObjects) {
            if (!Array.isArray(mapObjects)) {
                return;
            }
            this.searchManager.mapObjects.splice(0);
            this.searchManager.responseMapObjectCount = 0;
            mapObjects.forEach(mapObject => this.searchManager.mapObjects.push(mapObject));
            this.searchManager.responseMapObjectCount = this.searchManager.mapObjects.length;
        },

        setFoundObject: function(mapObjects, show) {
            this.clearSelectedFeatures();
            this.clearSelectedObjects();
            this._setSearchManager(mapObjects);
            if (show) {
                for (let i = 0; i < this.searchManager.mapObjects.length; i++) {
                    const mapObject = this.searchManager.mapObjects[i];
                    this.selectedObjectsStorage.replaceObject(mapObject);
                }
            }
            if (this.searchManager.mapObjects.length > 0) {
                this.trigger({ type: 'searchreasultsforceupdate', target: 'map' });
            }
        },

        initOldComponents: function() {

            this.initTools();                                               // создать инструменты

            const controls = this.options.controls;

            const oldTaskButtons = [];

            if (controls.includes('clusterizator') && this.options.cluster) {
                oldTaskButtons.push({
                    id: 'panel_button-clusterizator',
                    icon: 'clusters',
                    title: 'phrases.Clustered data'
                });
            }

            if (controls.includes('thematicmap')) {
                if (this.options.sectionsURL !== undefined && this.options.sectionsFname !== undefined) {
                    //const mt = new GWTK.MapThematic(this);
                    //mt.init();
                    console.log('The ThematicMap component is deprecated and no longer used!');
                }
            }

            for (let numberButton = 0; numberButton < oldTaskButtons.length; numberButton++) {
                this.registerMapPlugin(oldTaskButtons[numberButton]);
            }

        },

        setStrictEditorMode(flag){
          this.strictEditorMode=flag;
          this.searchManager.mapObjects.splice(0);
          this.searchManager.setStartIndex(0);
          this.searchManager.findNext();
        },
        /**
         * Установить для WMS слоя дополнительные стили (styleFilter)
         * @method setWmsStyleFilter
         * @param layerNodeId {string} Идентификатор слоя
         * @param selectedLegendObjectList {array} Выбранные элементы легенды слоя
         * @param styleOptions {object} Набор SLD
         */
        setWmsStyleFilter(layerNodeId, selectedLegendObjectList, styleOptions) {
            const wmsLayer = this.tiles.getLayerByxId(layerNodeId);
            if (!wmsLayer) {
                this.writeProtocolMessage({
                    description: layerNodeId,
                    text: this.translate('WMS layer not found'),
                    type: LogEventType.Info
                });
                return;
            }
            try {
                wmsLayer.createStyleFilter(selectedLegendObjectList, styleOptions);
                wmsLayer.update();
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.writeProtocolMessage({
                    description: gwtkError.message,
                    text: this.translate('Error setup WMS layer style filter'),
                    type: LogEventType.Error
                });
            }
        },
        /**
         * Получить фильтр для WMS слоя
         * @method getWmsStyleFilter
         * @param layerNodeId {string} Идентификатор слоя
         * @return {{ keylist: string; sld: CommonServiceSVG[] }[] | undefined}
         */
        getWmsStyleFilter(layerNodeId) {
            const wmsLayer = this.tiles.getLayerByxId(layerNodeId);
            if (!wmsLayer) {
                this.writeProtocolMessage({
                    description: layerNodeId,
                    text: this.translate('WMS layer not found'),
                    type: LogEventType.Info
                });
                return;
            }
            if (!wmsLayer?.filter) {
                this.writeProtocolMessage({
                    description: layerNodeId,
                    text: this.translate('WMS filter not found'),
                    type: LogEventType.Info
                });
                return;
            }
            if (!wmsLayer?.filter?.styleFilter) {
                this.writeProtocolMessage({
                    description: layerNodeId,
                    text: this.translate('WMS style filter not found'),
                    type: LogEventType.Info
                });
                return;
            }
            return wmsLayer.filter.styleFilter;
        },

        /**
         * Найти объекты текстовым поиском с использованием Яндекса
         * @method searchViaYandex
         * @param {string} text
         * @return {Promise<{features: FeatureType[], type: string} | undefined>}
         */
        async searchViaYandex(text) {
            const regex = /(\d+\.\d*)[,\s](\d+\.\d*)/gm;
            const match = regex.exec(text);
            if (match && match[1] !== undefined && match[2] !== undefined) {
                text = `${match[2]},${match[1]}`;
            }
            const searchManager = new SearchManager(this);
            searchManager.activateSource(SourceType.Yandex, GISWebServiceSEMode.TextSearch);

            const criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();
            (criteriaAggregatorCopy.getTextSearchCriterion()).addTextSearchKey(['Text'], text);
            (criteriaAggregatorCopy.getSrsNameSearchCriterion()).setValue(this.getCrsString());
            searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

            const result = await searchManager.findNext().catch(console.error.bind(console));
            if (result) {
                return {
                    type: 'FeatureCollection',
                    features: result.mapObjects.map(mapObject => mapObject.toJSON())
                };
            }
        },

        async searchViaNspdRequest(text, searchType) {
            const searchManager = new SearchManager(this);
            searchManager.activateSource(SourceType.Nspd, GISWebServiceSEMode.TextSearch);
            const criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();
            (criteriaAggregatorCopy.getTextSearchCriterion()).addTextSearchKey(['Text'], text);
            (criteriaAggregatorCopy.getSrsNameSearchCriterion()).setValue(this.getCrsString());
            (criteriaAggregatorCopy.getTextSearchCriterion()).addTextSearchKey(['thematicSearchId'], searchType);
            searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

            const result = await searchManager.findNext().catch(console.error.bind(console));
            if (result) {
                return result.mapObjects
            }
        },

        async searchViaNspd(text, searchTypes) {
            const mapObjects = [];
            if (Array.isArray(searchTypes) && searchTypes.length) {
                for (let i = 0; i < searchTypes.length; i++) {
                    const requestMapObjects = await this.searchViaNspdRequest(text, searchTypes[i]);
                    if (requestMapObjects) {
                        for (let j = 0; j < requestMapObjects.length; j++) {
                            mapObjects.push(requestMapObjects[j]);
                        }
                    }
                }
            } else {
                const requestMapObjects = await this.searchViaNspdRequest(text, searchTypes);
                if (requestMapObjects) {
                    for (let i = 0; i < requestMapObjects.length; i++) {
                        mapObjects.push(requestMapObjects[i]);
                    }
                }
            }

            if (mapObjects && mapObjects.length) {
                return {
                    type: 'FeatureCollection',
                    features: mapObjects.map(mapObject => mapObject.toJSON())
                };
            }
        },

        
        async searchViaNspdReturnMapObject(text, searchTypes) {
            const mapObjects = [];
            if (Array.isArray(searchTypes) && searchTypes.length) {
                for (let i = 0; i < searchTypes.length; i++) {
                    const requestMapObjects = await this.searchViaNspdRequest(text, searchTypes[i]);
                    if (requestMapObjects) {
                        for (let j = 0; j < requestMapObjects.length; j++) {
                            mapObjects.push(requestMapObjects[j]);
                        }
                        break;
                    }
                }
            } else {
                const requestMapObjects = await this.searchViaNspdRequest(text, searchTypes);
                if (requestMapObjects) {
                    for (let i = 0; i < requestMapObjects.length; i++) {
                        mapObjects.push(requestMapObjects[i]);
                    }
                }
            }

            if (mapObjects && mapObjects.length) {
                return mapObjects[0];
            }
        },

        /**
         * Найти объекты текстовым поиском с использованием Росреестра
         * @param {string} text
         * @param {number[] | undefined} searchTypes
         * @param {boolean} onlyMainProps
         * @return {Promise<{features: FeatureType[], type: string} | undefined>}
         */
        async searchViaRosreestr(text, searchTypes, onlyMainProps = false) {
            const searchManager = new SearchManager(this);
            searchManager.activateSource(SourceType.Rosreestr, GISWebServiceSEMode.TextSearch, undefined, undefined, undefined, !onlyMainProps);
            const criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();
            (criteriaAggregatorCopy.getTextSearchCriterion()).addTextSearchKey(['Text'], text);
            (criteriaAggregatorCopy.getSrsNameSearchCriterion()).setValue(this.getCrsString());
            if (Array.isArray(searchTypes) && searchTypes.length) {
                (criteriaAggregatorCopy.getLayerTypeCriterion()).setValue(searchTypes);
            }
            searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

            const result = await searchManager.findNext().catch(console.error.bind(console));
            if (result) {
                return {
                    type: 'FeatureCollection',
                    features: result.mapObjects.map(mapObject => mapObject.toJSON())
                };
            }
        },
        /**
         * Найти объекты текстовым поиском по адресной базе Панорамы
         * @param text {string} Строка поиска
         * @return {Promise<{features: FeatureType[], type: string} | undefined>}
         */
        async searchViaPanoramaAddressBase(text) {
            const regex = /(\d+\.\d*)[,\s](\d+\.\d*)/gm;
            const match = regex.exec(text);
            if (match && match[1] !== undefined && match[2] !== undefined) {
                text = `${match[2]},${match[1]}`;
            }
            const searchManager = new SearchManager(this);
            searchManager.activateSource(SourceType.PanoramaAddressBase, GISWebServiceSEMode.TextSearch);
            const criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();
            criteriaAggregatorCopy.getTextSearchCriterion().addTextSearchKey(['Text'], text);
            criteriaAggregatorCopy.getSrsNameSearchCriterion().setValue(this.getCrsString());
            searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);
            const result = await searchManager.findNext().catch(console.error.bind(console));
            if (result) {
                return {
                    type: 'FeatureCollection',
                    features: result.mapObjects.map(mapObject => mapObject.toJSON())
                };
            }
        },
        /**
         * Найти объект текстовым поиском с использованием Росреестра
         * @param {string} text
         * @param {number[] | undefined} searchTypes
         * @param {boolean} onlyMainProps
         * @return {Promise<MapObject | undefined>}
         */
        async searchViaRosreestrReturnMapObject(text, searchTypes, onlyMainProps = false ) {
            const rosreestrSearchManager = new SearchManager(this, false);
            rosreestrSearchManager.activateSource(SourceType.Rosreestr, GISWebServiceSEMode.TextSearch, undefined, undefined,undefined, !onlyMainProps);

            const criteriaAggregatorCopy = rosreestrSearchManager.getSearchCriteriaAggregatorCopy();
            (criteriaAggregatorCopy.getTextSearchCriterion()).addTextSearchKey(['Text'], text);
            (criteriaAggregatorCopy.getSrsNameSearchCriterion()).setValue(this.getCrsString());
            if (Array.isArray(searchTypes) && searchTypes.length) {
                (criteriaAggregatorCopy.getLayerTypeCriterion()).setValue(searchTypes);
            }
            rosreestrSearchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

            const result = await rosreestrSearchManager.findNext().catch(console.error.bind(console));
            if (result) {
                return result.mapObjects[0];
            }
        },
        /**
         * Перезаписать параметры из строки запроса
         * @method applyForcedParams
         * @param forcedParams {ForcedParameters} Принудительные параметры (из адресной строки)
         */
        async applyForcedParams(forcedParams) {

            if (!forcedParams || Reflect.ownKeys(forcedParams).length === 0) {
                return;
            }

            const {b, l, z, layers, rotate, incline, models3d, activetask, idLayerObjectNumberKey, objcard, objcardact} = forcedParams;

            if (b !== undefined && l !== undefined) {
                // широта, долгота
                const point = new GeoPoint(parseFloat(l), parseFloat(b), 0, this.options.tilematrixset);
                const mapCenter = point.toMapPoint() || new MapPoint(0, 0, 0, this.options.tilematrixset);

                this.mapCenterPoint.x = mapCenter.x;
                this.mapCenterPoint.y = mapCenter.y;
                this.mapCenterPoint.h = mapCenter.h;

                this._setMapCenter();
            }

            if (z !== undefined) {
                this.options.tilematrix = +z;
                if(this.workspaceManager) {
                    this.workspaceManager.setValue(VIEW_SETTINGS_ZOOM_LEVEL, this.options.tilematrix);
                }
            }

            if (rotate !== undefined) {
                this.options.params3d.rotate = parseFloat(rotate);
            }

            if (incline !== undefined) {
                this.options.params3d.incline = parseFloat(incline);
            }

            if(this.workspaceManager) {
                this.workspaceManager.setValue(VIEW_SETTINGS_PARAMS3D, this.options.params3d);
            }

            if (models3d !== undefined && this.options.objects3d) {
                const hiddenModelIds = models3d.split(',');
                const visibleModels=[];
                for (let i = 0; i < this.options.objects3d.length; i++) {
                    const model3d = this.options.objects3d[i];

                    if (Reflect.has(model3d, 'idLayer')) {
                        const hiddenModelIdsIndex = hiddenModelIds.indexOf(model3d.id);

                        model3d.hidden = hiddenModelIdsIndex !== -1 ? 1 : 0;

                        if(hiddenModelIdsIndex===-1){
                            visibleModels.push(model3d.id);
                        }
                    }
                }

                if(this.workspaceManager) {
                    this.workspaceManager.setValue(PROJECT_SETTINGS_VISIBLE_MODELS, visibleModels);
                }
            }

            if (layers !== undefined) {

                // отображение слоев
                const visibleLayerIds = layers.split(',');
                const hiddenLayers=[];

                for (let i = 0; i < this.options.layers.length; i++) {
                    const layer = this.options.layers[i];
                    const visibleLayerIdsIndex = visibleLayerIds.indexOf(layer.id);
                    layer.hidden = (visibleLayerIdsIndex === -1) ? 1 : 0;
                }

                for (let i = 0; i < this.layers.length; i++) {
                    const layer = this.layers[i];

                    if (visibleLayerIds.find(item => item === layer.id)) {
                        this.setLayerVisibility(layer, true);
                    } else {
                        this.setLayerVisibility(layer, false);
                        hiddenLayers.push(layer.id);
                    }
                }
                if(this.workspaceManager) {
                    this.workspaceManager.setValue(PROJECT_SETTINGS_HIDDEN_LAYERS, hiddenLayers);
                }

            }

            if (activetask !== undefined) {
                if(this.workspaceManager) {
                    this.workspaceManager.setValue(PROJECT_SETTINGS_ACTIVE_TASK_LIST, activetask);
                    this.taskManagerNew.restartActiveTask();
                }
            }

            //@deprecated
            if (idLayerObjectNumberKey !== undefined) {

                const [layerId, objectNumber] = idLayerObjectNumberKey.split(':');

                const layer = this.layers.find(layer => layer.idLayer === layerId);
                if (layer) {
                    if(!layer){
                        this.writeProtocolMessage({
                            text: this.translate('No object selected'),
                            description: this.translate('Layer not found') + ' ' + layerId,
                            type: LogEventType.Error,
                            display: false
                        });
                    } else if (!layer.selectObject) {
                        this.writeProtocolMessage({
                            text: this.translate('No object selected'),
                            description: this.translate('Object selection disabled for layer') + ' ' + layer.alias,
                            type: LogEventType.Error,
                            display: false
                        });
                    } else {
                        this.selectMapObjectsByIdList(layer.idLayer, [objectNumber]);
                    }
                }
            }


            if (objcard !== undefined) {
                const objectSelected = JSON.parse(decodeURIComponent(objcard));
                const layersIdList = Object.keys(objectSelected);
                //если в ссылке один слой с одним объектом
                if (layersIdList.length === 1 && objectSelected[layersIdList[0]].length === 1) {
                    //проверим на принадлежность номера к Росреестру
                    if (String(objectSelected[layersIdList[0]][0]).includes(':')) {
                        const cadastrNumber = objectSelected[layersIdList[0]][0];
                        this.getTaskManager().showSnackBarMessage({ text: this.translate('Search object in the Rosreestr') })
                        const mapObject = await this.searchViaRosreestrReturnMapObject(cadastrNumber);
                        if (mapObject) {
                            this.addSelectedObject(mapObject);
                            switch (objcardact) {
                                case 'opencard':
                                    this.getTaskManager().showObjectPanelInfo(mapObject);
                                    break;
                                case 'fitmapobject':
                                    if (mapObject.hasGeometry()) {
                                        this.fitMapObject(mapObject);
                                    }
                                    break;
                                default:
                                    this.getTaskManager().showObjectPanelInfo(mapObject);
                                    break;
                            }
                        } else {
                            this.getTaskManager().showSnackBarMessage({ text: this.translate('Object not found') })
                         }
                    } else {
                         const mapObjects =  await this.selectMapObjectsByIdList(layersIdList[0], objectSelected[layersIdList[0]])
                         if (mapObjects && mapObjects.length) {
                             this.showObjectInfo(mapObjects[0], objcardact);
                         } else {
                            this.getTaskManager().showSnackBarMessage({ text: this.translate('Object not found') })
                         }
                    }
                } else {
                    //если в ссылке несколько слоев с множеством объектов
                    for (let i = 0; i < layersIdList.length; i++) {
                        //проверим на принадлежность номер к Росреестру
                        if (objectSelected[layersIdList[i]].some(objNumber => String(objNumber).includes(':'))) {
                            for (let j = 0; j < objectSelected[layersIdList[i]].length; j++) {
                                this.getTaskManager().showSnackBarMessage({ text: this.translate('Search object in the Rosreestr') })
                                const cadastrNumber = objectSelected[layersIdList[i]][j];
                                const mapObject = await this.searchViaRosreestrReturnMapObject(cadastrNumber, [], true);
                                if (mapObject) {
                                    this.addSelectedObject(mapObject);
                                } else {
                                    this.getTaskManager().showSnackBarMessage({ text: this.translate('Object not found') })
                                 }
                            }
                        } else {
                            const mapObjects = await this.selectMapObjectsByIdList(layersIdList[i], objectSelected[layersIdList[i]])
                            if (!mapObjects || !mapObjects.length) {
                                this.getTaskManager().showSnackBarMessage({ text: this.translate('Object not found') })
                            }
                        }
                    }
                    switch (objcardact) {
                        case 'opencard':
                            this.fitSelectedObjects();
                            //компоненты не успевают перестроиться на компактный вид
                            window.setTimeout(() => { this.getTaskManager().openSelectedObjectViewer() }, 2000);
                            break;
                        case 'fitmapobject':
                            this.fitSelectedObjects();
                            break;
                        default:
                            this.fitSelectedObjects();
                            break;
                    }

                }
            }

            this.showMap();
            this.overlayRefresh('move');
        },
        /**
         * Добавление на карту слоя Росреестра
         * @method addRosreestrLayer
         * @return {RosreestrSelectLayer}
         */
        addRosreestrLayer() {
            if(!this.rosreestrLayer){
                this.rosreestrLayer = new RosreestrSelectLayer(this, { id: Utils.generateGUID(), alias: 'rosreestr', url: '' });
            }
            this.rosreestrLayer.onAdd();
            return this.rosreestrLayer;
        },

        /**
         * Подсветить объект на карте
         * @private
         * @method highlightObject
         * @param mapObject {MapObject}
         */
        async highLightObject(mapObject) {
            if (mapObject.isValidGisObject) {
                const mapBbox = this.getWindowBounds();
                if (!mapBbox.intersects(mapObject.getBounds())) {
                    // переход в центр объекта
                    const mapPoint = mapObject.getCenter();
                    this.setMapCenter(mapPoint, true);
                    this.overlayRefresh();
                }
            }

            if (!mapObject.hasGeometry()) {
                await mapObject.loadGeometry();

                if (!mapObject.hasGeometry()) {
                    return;
                }

            }
            const semantics = mapObject.getSemanticUniqKeys();
            //у ЗОУИТов, особо охраняемых природных территорий нет в семантике 'cn', есть 'number_zone'.
            //у границ есть свойство brd_id 
            if (semantics?.includes('cn') || semantics?.includes('number_zone') || semantics?.includes('brd_id')) {
                const taskDescription = this.getTaskManager().getTaskDescription(MAP_OBJECT_PANEL_COMPONENT);
                const objectPanelTask = this.getTaskManager().getActiveTask(taskDescription.id);
                if (objectPanelTask) {
                    objectPanelTask.widgetProps.showProgressBar = true;
                    const mapObjectUpd = await this.searchViaRosreestrReturnMapObject(mapObject.metaData.id);
                    if (mapObjectUpd) {
                        mapObject.updateFrom(mapObjectUpd);
                    }
                    this.setActiveObject(mapObject);
                    if (mapObject.isValidGisObject) {
                        this.rosreestrLayer = this.addRosreestrLayer();
                        this.rosreestrLayer.rosreestrObject = mapObject.gmlId;
                        this.rosreestrLayer.update();
                        if (this.getZoom() < this.rosreestrLayer.minZoomView) {
                            this.setZoom(this.rosreestrLayer.minZoomView);
                        }
                    }
                    objectPanelTask.widgetProps.showProgressBar = false;
                    return mapObject;

                } else {
                    if (mapObject.isValidGisObject) {
                        this.setActiveObject(mapObject);
                        this.rosreestrLayer = this.addRosreestrLayer();
                        this.rosreestrLayer.rosreestrObject = mapObject.gmlId;
                        this.rosreestrLayer.update();
                        if (this.getZoom() < this.rosreestrLayer.minZoomView) {
                            this.setZoom(this.rosreestrLayer.minZoomView);
                        }
                    }
                }
            }
            return mapObject;
        },
        /**
         * Очистить подсвеченный объект
         * @private
         * @method clearHighLightObject
         */
        clearHighLightObject() {
            if (this.rosreestrLayer && this.rosreestrLayer.id) {
                this._removeLayer(this.rosreestrLayer.id);
                this.rosreestrLayer = null;
            }
            this.refresh();
        },

        /**
         * Установить для WMS слоя пользовательский фильтр
         * @method setWmsLayerFilter
         * @param layerId {string} Идентификатор слоя
         * @param filter {PermanentLayerFilter} Фильтр слоя
        */
        setWmsLayerFilter(layerId, filter) {
            const wmsLayer = this.tiles.getLayerByxId(layerId);
            if (!wmsLayer || !(wmsLayer instanceof WmsLayer)) {
                this.writeProtocolMessage({
                    description: layerId,
                    text: this.translate('WMS layer not found'),
                    type: LogEventType.Info
                });
                return;
            }
            try {
                wmsLayer.setUserFilter(filter);
                wmsLayer.update();
                this.trigger({ type: 'layerlistchanged', target: 'map', maplayer: { layer: wmsLayer, act: 'setUserFilter' } });
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.writeProtocolMessage({
                    description: gwtkError.message,
                    text: this.translate('Error setup WMS layer semantic filter'),
                    type: LogEventType.Error
                });
            }
        },

        /**
         * Сбросить пользовательский фильтр для WMS слоя
         * @method resetWmsLayerFilter
         * @param layerId {string} Идентификатор слоя
         */
        resetWmsLayerFilter(layerId) {
            const wmsLayer = this.tiles.getLayerByxId(layerId);
            if (!wmsLayer || !(wmsLayer instanceof WmsLayer)) {
                this.writeProtocolMessage({
                    description: layerId,
                    text: this.translate('WMS layer not found'),
                    type: LogEventType.Info
                });
                return;
            }
            try {
                wmsLayer.resetUserFilter();
                wmsLayer.update();
                this.trigger({ type: 'layerlistchanged', target: 'map', maplayer: { layer: wmsLayer, act: 'resetUserFilter' } });
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.writeProtocolMessage({
                    description: gwtkError.message,
                    text: this.translate('Error setup WMS layer semantic filter'),
                    type: LogEventType.Error
                });
            }
        }
    };

    $.extend(GWTK.Map.prototype, GWTK.Util.event);

    GWTK.map = function(id, options) {
        return new GWTK.Map(id, options);
    };
}
