/************************************ Нефедьева О. **** 13/05/21 ****
 ************************************ Полищук Г.В. **** 15/12/20 ****
 ************************************ Соколова Т.  **** 10/10/19 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Управление слоями карты                        *
 *                          GWTK SE                                 *
 *******************************************************************/

import {
    PROJECT_SETTINGS_LAYERS_OPACITY,
    PROJECT_SETTINGS_REFRESH_INTERVAL,
    PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_LIST,
    PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_STYLE_OPTION
} from '~/utils/WorkspaceManager';
import Utils from '~/services/Utils';
import { Bounds } from '~/geometry/Bounds';
import PixelPoint from '~/geometry/PixelPoint';
import { PixelBounds } from '~/geometry/PixelBounds';
import { TileLayer } from '~/maplayers/TileLayer';
import WmsLayer from '~/maplayers/WmsLayer';

if (window.GWTK) {

    // Элемент легенды карты: "id" - id слоя карты
    GWTK.legendItem = {
        'id': '',
        'text': '',
        'img': '',
        'expanded': '',
        'nodes': [],
        'code': '',
        'local': '',
        'key': ''
    };

    // Легенда карты: "id" - id слоя карты, "items" - массив элементов GWTK.legendItem
    GWTK.legend = { 'id': '', 'url': '', 'items': [] };

    // Типы слоев карты
    GWTK.layerTypes = { 'tile': 1, 'wms': 2, 'svg': 3, 'geomarkers': 4, 'folder': 5 };

    // JSON-данные пространственных объектов
    GWTK.jsonSource = {
        'type': 'geojson',                   // тип данных
        'json': {},                          // geojson коллекция объектов
        'style': {                           // структура описания стилей для отображения geojson
            'typeField': 'objecttype',       // имя ключа в GWTK.jsonSource.json.features[i].properties, по которому будет идентифицироваться ключ стилz объекта GWTK.jsonSource.style
            'style': {}                      // объект кодов(ключей), содержащих стили изображений объектов (классификатор объектов слоя)
        }
    };

    GWTK.AUTH_TOKEN = 'AUTHORIZATION-TOKEN';

    /**
     * Класс Управление слоями карты
     * Доступ к слоям данных, управление слоями
     * @class GWTK.LayersControl
     * @constructor GWTK.LayersControl
     * @param map {GWTK.Map} ссылка на карту
     */
    GWTK.LayersControl = function(map) {
        if (map == undefined || map == null) {
            console.log('GWTK.LayersControl. ' + w2utils.lang('Not defined a required parameter') + ' Map.');
            return;
        }
        this.map = map;
        this.wmsManager = undefined;    // управление wms-слоями
        this._origin = {};              // точка привязки отображения, глобальные пикселы матрицы (изменяется для каждого уровня zoom)
        this.count = 0;
        this.scaleChange = false;       // Признак изменения масштаба
        this.xOffset = 0;               // смещение рисунка карты по горизонтали при mousemove
        this.yOffset = 0;               // смещение рисунка карты по вертикали при mousemove

        this.oldScale = 0;

        this.timerMosaicRedraw = null;   // Таймер для отложенного запуска подрисовки тайлов при MouseMove
        this.timerMosaicRedrawInterval = 10;

        this.freeTileObjects = [];       // Свободные объекты-тайлы

        this.viewOrder = [];             // порядок отображения слоев
        this.legends = [];               // легенды карт, массив объектов GWTK.legend
        this.legendWfs = [];
        this.svgLegendColors = {};       // цвета для легенды тематических карт (для текущего сеанса)

        this.sheetNamesList = null;      // список имен листов слоев

        this.authentication = { 'pam': [] };// список адресов серверов с авторизованным доступом pam

        this.refreshTimer;
        this.showBorderMessage = Utils.debounce(this.showBorderMessage.bind(this), 1000);
        this.init();
    };

    GWTK.LayersControl.prototype =
        {
            /**
             * Инициализация
             * @method init
             */
            init: function() {
                this.oldScale = this.map.options.tilematrix;
                this.mapmove = this.map.handlers.movedrag;
                this._moveMap = GWTK.Util.bind(this._moveMap, this);
                this._origin = this.map.getPixelMapTopLeft().round();
                this.tileScreen = {};
                this._createCanvas();
                this.$eventPane = $(this.map.eventPane);
                this.sheetNamesList = new GWTK.SheetNamesList(this.map);
            },

            /**
             * Получить список всех wms-слоев
             * @method getWmsLayers
             * @return {Array} массив объектов Wms-слоев карты
             */
            getWmsLayers: function() {
                var wmsLayers = [], i,
                    len = this.map.layers.length,
                    orderBy = (Array.isArray(this.viewOrder) && this.viewOrder.length > 0) ? true : false;

                for (i = 0; i < len; i++) {
                    var layer = this.map.layers[i];
                    if (typeof layer !== 'undefined' && layer.wms) {
                        wmsLayers.push({ 'layer': layer, 'zIndex': $.inArray(layer.xId, this.viewOrder) });
                    }
                }
                if (orderBy) {
                    wmsLayers.sort(this._compareOrder);
                }
                const arr = [];
                for (i = 0; len = wmsLayers.length, i < len; i++) {
                    arr.push(wmsLayers[i].layer);
                }

                wmsLayers.length = 0;

                return arr;
            },


            /**
             * Получить список видимых wms-слоев
             * @method getWmsLayersVisible
             * @return {Array} массив объектов видимых Wms-слоев карты
             */
            getWmsLayersVisible: function() {
                const wmsVisibled = [];
                const wmsLayers = [];
                for (let i = 0; i < this.map.layers.length; i++) {
                    const layer = this.map.layers[i];
                    if (typeof layer === 'undefined' || layer.getType() !== 'wms')
                        continue;
                    if (layer.visible) {
                        if (layer.checkViewZoom(this.map.getZoom())) {
                            wmsVisibled.push({
                                'xId': layer.xId,
                                'alias': layer.alias,
                                'zIndex': this.viewOrder.indexOf(layer.xId),
                                'layer': layer
                            });
                        }
                    }
                }
                wmsVisibled.sort(this._compareOrder);

                for (let i = 0; i < wmsVisibled.length; i++) {
                    wmsLayers.push(wmsVisibled[i].layer);
                }
                return wmsLayers;
            },

            /**
             * Получить слой по идентификатору слоя в карте
             * @method getLayerByxId
             * @param xId {String} идентификатор слоя в карте
             * @return {Object} объект слоя карты или `null`
             */
            getLayerByxId: function(xId) {
                // Проверяем входные параметры
                if (typeof xId === 'undefined')
                    return null;
                // Поиск слоя по xId
                return this.map.layers.find(layer => layer.xId === xId);
            },

            /**
             * Получить индекс слоя в массиве слоев по его идентификатору
             * @method indexOfxIdInArray
             * @param array {Array} массив слоев карты
             * @param xid {String} идентификатор слоя в карте
             * @return {Number} индекс слоя или -1
             */
            indexOfxIdInArray: function(array, xid) {
                // Проверяем входные параметры
                if (!Array.isArray(array) || array.length == 0) return -1;
                if (typeof xid === 'undefined') return -1;
                var i, len = array.length;
                // Поиск индекса по ID
                for (i = 0; i < len; i++) {
                    if (typeof array[i] === 'undefined') continue;
                    if (array[i].xId === xid) return i;
                }
                return -1;
            },

            /**
             * Получить легенду слоя по идентификатору
             * @method getLayerLegendByxId
             * @param xid {String} идентификатор слоя в карте
             * @param obj {Object} параметр для индекса элемента легенды
             * @return {Object} легенда слоя или `null`
             */
            getLayerLegendByxId: function(xid, obj) {
                if (!xid || xid == '' || this.legends.length == 0) return null;
                var i, len = this.legends.length;
                for (i = 0; i < len; i++) {
                    if (this.legends[i].id === xid) {
                        if (obj && typeof (obj) == 'object')
                            obj.index = i;
                        return this.legends[i];
                    }
                }
                return null;
            },

            /**
             * Получить слой виртуальной папки по идентификатору в карте
             * @method getVirtualFolderByxId
             * @param xid {String} идентификатор слоя в карте
             * @return {Object} слой папки или `null`
             */
            getVirtualFolderByxId: function(xid) {
                if (!xid) return null;
                if (this.map.virtualfolders) {
                    var i, len;
                    for (i = 0; len = this.map.virtualfolders.length, i < len; i++) {
                        if (this.map.virtualfolders[i].id === xid) {
                            return this.map.virtualfolders[i];
                        }
                    }
                }
                return null;
            },


            /**
             * Получить слой виртуальной папки по названию папки и адресу сервиса
             * @method getVirtualFolderByFolderName
             * @param folder {String} название виртуальной папки
             * @param url {String} URL адрес сервиса
             * @return {Object} слой папки или `null`
             */
            getVirtualFolderByFolderName: function(folder, url) {
                if (folder && this.map.virtualfolders) {
                    var i, len;
                    for (i = 0; len = this.map.virtualfolders.length, i < len; i++) {
                        const virtualFolder = this.map.virtualfolders[i];
                        if (virtualFolder.folder === folder && virtualFolder.serviceUrl === url) {
                            return virtualFolder;
                        }
                    }
                }
            },

            /**
             * Скрыть все слои карты
             * @method hide
             */
            hide: function() {
                for (var n = 0; n < this.map.layers.length; n++) {
                    if (this.map.layers[n] == null) continue;
                    this.map.layers[n].hide();
                }
            },

            /**
             * Отобразить все слои карты
             * @method show
             */
            show: function() {
                for (var n = 0; n < this.map.layers.length; n++) {
                    if (this.map.layers[n] == null) continue;
                    this.map.layers[n].show();
                }
            },

            /**
             * Проверить наличие авторизованного доступа по PAM для слоя
             * @method authTypePAM
             * @param layerid {String} идентификатор слоя на сервисе
             * @return {Boolean} `true` / `false` есть / нет
             */
            authTypePAM: function(layerid) {
                var lay = this.getLayerByIdService(layerid);
                if (lay === '' || !lay.options.authtype) {
                    return false;
                }
                return (lay.options.authtype == 'pam');
            },

            /**
             * Проверить наличие авторизованного доступа к сервису карты
             * @method authTypeExternal
             * @param url {String} url запроса
             * @return {Boolean} `true` / `false` есть / нет
             */
            authTypeExternal: function(url) {
                if (typeof url !== 'string' || !this.map.options.url) {
                    return false;
                }
                if (this.map.options.extauth && url.indexOf(this.map.options.url) != -1) {
                    return true;
                }
                return false;
            },

            /**
             * Установить наличие авторизованного доступа для слоя
             * @method setAuthTypeServer
             * @param layer {object} слой карты
             * @return {Number} индекс в списке серверов слоев
             */
            setAuthTypeServer: function(layer) {
                if (typeof layer == 'undefined' ||
                    !layer.options ||
                    !layer.options.authtype) {
                    return;
                }
                var index = -1;
                switch (layer.options.authtype) {
                    default:
                        break;
                    case 'pam':
                        index = this._addToAuthTypePAM(layer);
                        break;
                }

                return index;
            },

            /**
             * Получить наличие доступа с pam авторизацией для url
             * @method getAuthTypeServer
             * @param url {string} ссылка запроса
             * @return {Boolean} `true` / `false` есть / нет
             */
            getAuthTypeServer: function(url, type) {
                if (typeof url !== 'string' || url.length == 0) {
                    return false;
                }
                var type = type, i, index = -1;
                if (typeof type == 'undefined') {
                    type = 'pam';
                } else if (typeof type !== 'string') {
                    return false;
                }

                for (i = 0; i < this.authentication.pam.length; i++) {
                    if (this.authentication.pam[i].url == url ||
                        url.indexOf(this.authentication.pam[i].url) == 0) {
                        index = i;
                        break;
                    }
                }
                return (index !== -1);
            },

            /**
             * Добавить в список серверов с авторизованным доступом pam
             * @method _addToAuthTypePAM
             * @param layer {object} ссылка на слой карты
             * @return {Number} индекс в списке серверов слоев
             */
            _addToAuthTypePAM: function(layer) {
                if (typeof layer !== 'object' || !layer.options.url ||
                    !layer.options.authtype || layer.options.authtype != 'pam') {
                    return false;
                }
                var server = GWTK.Util.getServerUrl(layer.options.url),
                    index = -1, i;
                for (i = 0; i < this.authentication.pam.length; i++) {
                    if (this.authentication.pam.url == server) {
                        index = i;
                        break;
                    }
                }
                if (index < 0) {
                    this.authentication.pam.push({ 'url': server, 'layerid': layer.idLayer });
                    index = this.authentication.pam.length - 1;
                }
                return index;
            },


            /**
             * Деструктор
             * @method destroy
             */
            destroy: function() {
                if (this.sheetNamesList) {
                    this.sheetNamesList.destroy();
                }
                this.sheetNamesList = null;
                if (this.wmsManager) {
                    this.wmsManager.destroy();
                    this.wmsManager = null;
                }
            },

            /**
             * Вывести слои WMS
             * @method drawWmsLayers
             */
            drawWmsLayers: function() {
                this.wmsUpdate();
            },

            /**
             * Обновить слои карты
             * @method update
             */
            update: function(forсe) {
                // масштаб отображения до обновления
                if (this.oldScale != this.map.options.tilematrix)
                    this.scaleChange = true;

                this.resizeCanvas();
                this.wmsUpdate();
                // обновить tiles
                for (var i = 0; i < this.map.layers.length; i++) {
                    if (this.map.layers[i].getType() !== 'tile') {
                        continue;
                    }
                    this.map.layers[i].update(forсe);
                }

                this.scaleChange = false;
                this.oldScale = parseInt(this.map.options.tilematrix);
                this.map._writeCookie();
            },

            /**
             * Обновить wms слои карты
             * @method update
             * @param idlist {Array} список id слоев
             */
            wmsUpdate: function(idlist) {
                if (!this.wmsManager) return;
                if (this.map.is3dActive())
                    return;
                this.wmsManager.wmsDrawing(idlist);
            },

            /**
             * Обновить слои карты принудительно
             * @method forceupdate
             */
            forceupdate: function() {
                this.scaleChange = true;
                this.update(true);
            },

            /**
             * Установить управление слоями WMS
             * @method setWms
             */
            setWms: function() {
                if (this.wmsManager === null || typeof this.wmsManager === 'undefined') {
                    this.wmsManager = new GWTK.WmsManager(this.map);
                }
            },

            /**
             * Получить видимые слои карты
             * @method getVisibleLayers
             * @return {Array} массив JSON объектов {xId: xid, alias: имя_слоя, tiles: `true`-слой тайлов}
             */
            getVisibleLayers: function() {
                // Список видимых слоев
                var visibleLayers = [];

                var len = this.map.layers.length, layer, i;
                for (i = 0; i < len; i++) {
                    // Получаем слой по порядку в карте
                    layer = this.map.layers[i];
                    if (typeof this.map.layers[i] == 'undefined' || !this.map.layers[i].visible)
                        continue;
                    // xId слоя, алиас - имя_слоя, tiles - признак слой тайлов
                    visibleLayers.push({
                        'xId': this.map.layers[i].xId, 'alias': this.map.layers[i].alias,
                        'tiles': this.map.layers[i].tilematrixset ? true : false,
                        'zIndex': $.inArray(this.map.layers[i].xId, this.viewOrder)
                    });
                }

                visibleLayers.sort(this._compareOrder);  // сортируем по порядку отображения

                return visibleLayers;
            },

            /**
             * Установить признак скрытого слоя по списку идентификаторов
             * @method setHiddenLayersOptions
             * @param ids {Array} массив идентификаторов слоев карты
             */
            setHiddenLayersOptions: function(ids) {
                if (!$.isArray(ids) || ids.length == 0 || !this.map)
                    return;

                var layers = this.map.options.layers, i, len;

                for (i = 0; len = layers.length, i < len; i++) {
                    if ($.inArray(layers[i].id, ids) != -1) {
                        layers[i].hidden = 1;
                    } else {
                        layers[i].hidden = 0;
                    }
                }
                return;
            },

            /**
             * Получить параметры непрозрачности слоев
             * @method getLayersOpacity
             * @returns {array}
             */
            getLayersOpacity: function() {
                const param = [];
                for (let i = 0; i < this.map.layers.length; i++) {
                    const layer = this.map.layers[i];
                    if (layer.options.duty) {
                        continue;
                    }
                    param.push({ id: layer.xId, opacity: layer.options.opacityValue / 100 });
                }
                return param;
            },

            /**
             * Сохранить параметры непрозрачности слоев
             * @method saveLayersOpacity
             */
            saveLayersOpacity: function() {
                // if (localStorage) {
                //     localStorage.setItem(GWTK.Util.appkey + 'opacitySettings', JSON.stringify(this.getLayersOpacity()));
                // }
                this.map._writeCookie();
            },

            /**
             * Установить параметры непрозрачности слоев
             * @method setOpacityLayersOptions
             * функция восстанавливает параметр непрозрачности из хранимого
             * значения в localStorage, ключ - appkey + "opacitySettings".
             */
            setOpacityLayersOptions: function() {
                if (!this.map.options.layers)
                    return;

                const layers = this.map.options.layers;
                const layersOpacity = this.map.workspaceManager.getValue(PROJECT_SETTINGS_LAYERS_OPACITY);

                if (layersOpacity) {
                    for (let i = 0; i < layers.length; i++) {
                        for (let j = 0; j < layersOpacity.length; j++) {
                            if (layersOpacity[j].id === layers[i].id) {
                                layers[i].opacityValue = layersOpacity[j].opacity * 100;
                                break;
                            }
                        }
                    }
                }

                // len = layers.length, i,
                // sparam = GWTK.Util.getStoredParameter(GWTK.Util.appkey + 'opacitySettings');
                //
                // if (!sparam) { return; }
                //
                // try {
                //     var param = JSON.parse(sparam);
                //     for (i = 0; i < len; i++) {
                //         if (param[layers[i].id]) {
                //             var opacity = parseInt(param[layers[i].id]['value']);
                //             layers[i].opacityValue = opacity;
                //         }                }
                // }
                // catch (e) {}
            },


        setSelectedLegendObjectList: function () {
            if (!this.map.options.layers)
                return;
            const layers = this.map.options.layers;
            const layersSelectedLegendObjectList = this.map.workspaceManager.getValue(PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_LIST);
            if (layersSelectedLegendObjectList) {
                for (let i = 0; i < layers.length; i++) {
                    for (let j = 0; j < layersSelectedLegendObjectList.length; j++) {
                        if (layersSelectedLegendObjectList[j].id === layers[i].id) {
                            if (layers[i].hasOwnProperty('legend')) {
                                layers[i].selectedLegendObjectList = layers[i].selectedLegendObjectList || [];
                                if (layersSelectedLegendObjectList[j]?.selectedLegendObjectList && layersSelectedLegendObjectList[j]?.selectedLegendObjectList.length) {
                                    layers[i].selectedLegendObjectList.splice(0);
                                    layers[i].selectedLegendObjectList.push(...layersSelectedLegendObjectList[j]?.selectedLegendObjectList);
                                    break;
                                }
                            };
                        }
                    }
                }
            }
        },

        setSelectedLegendObjectStyleOptions: function () {
            if (!this.map.options.layers)
                return;
            const layers = this.map.options.layers;
            const layersSelectedLegendObjectStyleOptions = this.map.workspaceManager.getValue(PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_STYLE_OPTION);
            if (layersSelectedLegendObjectStyleOptions) {
                for (let i = 0; i < layers.length; i++) {
                    for (let j = 0; j < layersSelectedLegendObjectStyleOptions.length; j++) {
                        if (layersSelectedLegendObjectStyleOptions[j].id === layers[i].id) {
                            if (layers[i].hasOwnProperty('legend')) {
                                layers[i].selectedLegendObjectStyleOptions = layers[i].selectedLegendObjectStyleOptions || { line: [], polygon: [], text: [], marker: [] };
                                ['line', 'polygon', 'marker', 'text'].forEach(styleType => {
                                    if (layersSelectedLegendObjectStyleOptions[j].selectedLegendObjectStyleOptions?.[styleType]) {
                                        layers[i].selectedLegendObjectStyleOptions[styleType].splice(0);
                                        layers[i].selectedLegendObjectStyleOptions[styleType].push(...layersSelectedLegendObjectStyleOptions[j].selectedLegendObjectStyleOptions[styleType]);
                                    }
                                });
                                break;
                            }
                        }
                    }
                }
            }
        },

            /**
             * Установить видимость слоев по списку идентификаторов
             * @method setVisibleLayers
             * @param ids {Array} массив идентификаторов слоев карты
             * @param view {Boolean} `true` показать слой, `false` - скрыть
             */
            setVisibleLayers: function(ids, view) {
                if (!$.isArray(ids) || ids.length == 0) return;

                var visible = Boolean(view);

                if (!visible) {
                    this.show();
                    for (var i = 0; i < ids.length; i++) {
                        var layer = this.getLayerByxId(ids[i]);
                        if (layer != null) layer.hide();
                    }
                    return;
                }

                this.hide();
                for (var i = 0; i < ids.length; i++) {
                    var layer = this.getLayerByxId(ids[i]);
                    if (layer != null) layer.show();
                }
            },

            /**
             * Получить видимые слои тайлов
             * @method getTileLayersVisible
             * @return {Array} массив JSON объектов {xId: xid, alias: имя_слоя}
             */
            getTileLayersVisible: function() {
                // Список видимых слоев
                var visibleLayers = [];

                // Если есть порядок следования слоев (идентификация по xId), будем следовать заданному порядку
                var useOrder = ($.isArray(this.viewOrder) && this.viewOrder.length > 0) ? true : false,
                    len = this.map.layers.length, layer, alias = '', i, jj = 0;

                for (i = 0; i < len; i++) {
                    layer = this.map.layers[i];
                    if (!layer) {
                        continue;
                    }
                    if (layer.visible && layer.getType() === 'tile') {
                        // xId слоя, алиас - имя_слоя, признак - слой тайлов
                        visibleLayers[jj] = {
                            'xId': layer.xId,
                            'alias': layer.alias,
                            'zIndex': this.viewOrder.indexOf(layer.xId),
                            'layer': layer
                        };
                        jj++;
                    }
                }
                visibleLayers.sort(this._compareOrder);
                return visibleLayers;
            },

            /**
             * Получить первый тайловый слой из списка открытых слоев
             * @method getTileLayer
             * @return {Object} тайловый слой или null
             */
            getTileLayer: function() {
                if (this.map == null) return null;
                var i, len = this.map.layers.length;
                for (i = 0; i < len; i++) {
                    if (this.map.layers[i].getType() === 'tile' && this.map.layers[i].tileHeight == 256.0) {
                        return this.map.layers[i];
                    }
                }
                return null;
            },

            /**
             * Получить список идентификаторов слоев сервиса для выбора объектов
             * @method getSelectableLayers
             * @return {Array} массив идентификаторов слоев сервиса
             */
            getSelectableLayers: function() {
                var layerslist = [];
                if (this.map == null) return layerslist;
                var i;
                for (i = 0; i < this.map.layers.length; i++) {
                    if (!this.map.layers[i].visible) {
                        if (!this.map.layers[i].options.duty)
                            continue;
                    }
                    var ltype = this.map.layers[i].getType();
                    if (ltype == 'wms' || ltype == 'tile') {
                        if (this.map.layers[i].selectObject == 1) {
                            var id = this.map.layers[i].idLayer;
                            if (GWTK.Util.indexOf(layerslist, id, 0) == -1)
                                layerslist.push(id);
                        }
                    }
                }
                return layerslist.toString();
            },

            /**
             * Получить параметры слоев сервиса для запроса информации об объектах
             * @method getSelectableLayersEx
             * @return {Array} массив JSON объектов {xId: id слоя в карте, alias: имя слоя}
             */
            getSelectableLayersEx: function() {
                var layerslist = [];
                if (this.map == null) return layerslist;
                var i, ii, id, len = this.map.layers.length;
                for (i = 0; i < len; i++) {
                    if (!this.map.layers[i].visible && !this.map.layers[i].options.duty) continue;                                     // 12/02/16

                    if (this.map.layers[i].selectObject == 1) {
                        layerslist.push({ 'id': this.map.layers[i].xId, 'alias': this.map.layers[i].alias });
                    }
                }
                return layerslist;
            },

            /**
             * Получить массив слоев для выбора объектов
             * @method getSelectableLayersEx
             * @return {Array} массив видимых слоев, где разрешен выбор объектов
             */
            getSelectableLayersArray: function() {
                const layers = [];
                if (!this.map) {
                    return layers;
                }

                this.map.layers.forEach((layer) => {
                    if (layer.selectObject && (layer.visible || layer.options.duty)) {
                        layers.push(layer);
                    }
                });

                return layers;
            },


            /**
             * Получить массив слоев для выбора объектов без учета их видимости
             * @method getAllSelectableLayers
             * @return {Array} массив видимых слоев, где разрешен выбор объектов
             */
            getAllSelectableLayers: function() {
                var layers = [];
                if (!this.map) return layers;
                var i;
                for (i = 0; i < this.map.layers.length; i++) {
                    if (this.map.layers[i].selectObject) {
                        layers.push(this.map.layers[i]);
                    }
                }
                return layers;
            },

            /**
             * Получить параметры отбора объектов для серверов слоев
             * @method getSelectableServers
             * @param {boolean} viewfilter - признак фильтрации объектов
             * @param {boolean} countfilter - признак ограничения числа объектов,
             * countfilter используется совместно с параметром `areaSearchLimit` для вывода указанного числа объектов слоя(!)
             * @return {object} - JSON вида: { "srv": адрес, "layerid": [список id],
             *                                 "rpclayerslist": [{ layerid: id, typenames:typenames, codelist: codelist }] }
             */
            getSelectableServers: function(viewfilter, countfilter) {
                var list = this.getSelectableLayersArray();
                if (list.length == 0) {
                    return [];
                }
                // формируем параметры слоев по серверам
                var i, len = list.length,
                    servers = [];

                for (i = 0; i < len; i++) {
                    if (!list[i]) continue;

                    if (list[i].getType() == 'svg' || list[i].getType() == 'geomarkers')            // графические слои пропустим
                        continue;

                    var srv = list[i].options.url,
                        el = false;
                    var question = list[i].options.url.indexOf('?');
                    if (question > -1) {
                        srv = srv.slice(0, question);
                        for (var n = 0; n < servers.length; n++) {
                            if (servers[n].srv == srv) {
                                el = servers[n];
                                break;
                            }
                        }
                    }
                    var rpclayer = {};
                    rpclayer.layerid = list[i].idLayer;
                    if (list[i].typeNames)
                        rpclayer.typenames = list[i].typeNames;
                    if (list[i].codeList)
                        rpclayer.codelist = list[i].codeList;
                    if (countfilter && list[i].options.areaSearchLimit) {             // ограничение по числу объектов для слоя
                        rpclayer.feature_count = list[i].options.areaSearchLimit.toString();
                    }
                    if (viewfilter && list[i].getKeyListParamString) {
                        // фильтр объектов
                        var objkeys = list[i].getKeyListParamString();
                        if (objkeys.hasOwnProperty('keylist') && objkeys['keylist'])
                            rpclayer['keylist'] = objkeys['keylist'];
                    }
                    if (!el) {
                        servers.push({ 'srv': srv, 'layerid': [list[i].idLayer], 'rpclayerslist': [rpclayer] });
                    } else {
                        el.layerid.push(list[i].idLayer);                                // список id слоев сервера
                        el.rpclayerslist.push(rpclayer);
                    }
                }

                return servers;
            },

            /**
             * Получить список слоев сервиса для поиска по области
             * @method getAreaSeekLayers
             * @return {Array} массив идентификаторов слоев сервиса
             */
            getAreaSeekLayers: function() {
                var layerslist = [];
                if (this.map == null) return layerslist;
                var i;
                for (i = 0; i < this.map.layers.length; i++) {
                    if (!this.map.layers[i].visible && !this.map.layers[i].options.duty) continue;
                    if (this.map.layers[i].areaSeek != null && this.map.layers[i].areaSeek == 1) {
                        if (GWTK.Util.indexOf(layerslist, this.map.layers[i].idLayer, 0) == -1)
                            layerslist.push(this.map.layers[i].idLayer);
                    }
                }
                return layerslist.toString();
            },

            /**
             * Получить список слоев карты для поиска по области
             * @method getAreaSeekLayersxId
             * @return {Array} массив идентификаторов слоев карты
             */
            getAreaSeekLayersxId: function() {
                var layerslist = [];
                if (!this.map) return layerslist;
                var i, ii, id;
                for (i = 0; i < this.map.layers.length; i++) {
                    if (!this.map.layers[i].visible && !this.map.layers[i].options.duty) continue;
                    if (this.map.layers[i].areaSeek != null && this.map.layers[i].areaSeek == 1) {
                        layerslist.push(this.map.layers[i].xId);
                    }
                }

                return layerslist.toString();
            },

            /**
             * Получить список слоев сервиса по списку идентификаторов слоев карты
             * @method getIdLayersByxId
             * @return {Array} массив идентификаторов слоев сервиса
             */
            getIdLayersByxId: function(xidlist) {
                if (!xidlist || xidlist.length == 0)
                    return [];
                var xidArray = xidlist.split(','), i, len = xidArray.length, result = [], lay;
                for (i = 0; i < len; i++) {
                    lay = this.getLayerByxId(xidArray[i]);
                    if (!lay) continue;
                    result.push(lay.idLayer);
                }
                return result.toString();
            },

            /**
             * Получить rpc параметры слоев по списку идентификаторов слоев карты
             * @method getRpcLayersByxId
             * @return {Array} массив JSON-объектов {layerid:'', typenames:'', codelist:''}
             * При ошибке возвращает пустой массив
             */
            getRpcLayersByxId: function(xidlist) {
                if (!xidlist) return [];
                var lays = xidlist.split(','), len = lays.length, i, objlay, rpclayerslist = [], in1 = [], in2 = [],
                    res = [];
                for (i = 0; i < len; i++) {
                    var rpclayer = {};
                    objlay = this.getLayerByxId(lays[i]);
                    if (!objlay) continue;

                    if (!objlay.idLayer) continue;

                    rpclayer.layerid = objlay.idLayer;

                    if (objlay.typeNames) {
                        rpclayer.typenames = objlay.typeNames.split(',');
                    }
                    if (objlay.codeList) {
                        rpclayer.codelist = objlay.codeList.split(',');
                    }
                    // исключение дублирования для более быстрого выполнения запросов и уменьшения объема передаваемых параметров
                    var ii, ind = -1, len2 = rpclayerslist.length;
                    for (ii = 0; ii < len2; ii++) {
                        if (rpclayerslist[ii].layerid == objlay.idLayer) {
                            ind = ii;
                            break;
                        }
                    }
                    if (ind == -1) { // нет такого слоя
                        rpclayerslist.push(rpclayer);
                    } else {
                        if (rpclayerslist[ind].typenames) {
                            in1 = rpclayerslist[ind].typenames;
                            in2 = rpclayer.typenames;
                            res = in1.concat(in2.filter(function(item) {
                                return in1.indexOf(item) < 0;
                            }));
                            rpclayerslist[ind].typenames = res;
                        }

                        if (rpclayerslist[ind].codeList) {
                            in1 = rpclayerslist[ind].codelist;
                            in2 = rpclayer.codeList;
                            res = in1.concat(in2.filter(function(item) {
                                return in1.indexOf(item) < 0;
                            }));
                            rpclayerslist[ind].codelist = res;
                        }
                    }
                }
                return rpclayerslist;
            },

            /**
             * Получить список слоев сервиса для поиска по названию
             * @method getTextSearchLayers
             * @return {Array} массив идентификаторов слоев сервиса
             */
            getTextSearchLayers: function() {
                var layerslist = [];
                if (!this.map) return layerslist;
                var i, len = this.map.layers.length;
                for (i = 0; i < len; i++) {
                    if (!this.map.layers[i].isTextSearch || !this.map.layers[i].idLayer) {
                        continue;
                    }
                    if ($.inArray(this.map.layers[i].idLayer, layerslist) == -1) {
                        layerslist.push(this.map.layers[i].idLayer);
                    }
                }
                return layerslist.toString();
            },

            /**
             * Получить параметры текстового поиска
             * @method getTextSearchOptions
             * @return {Object} JSON-параметры для текстового поиска по слоям
             */
            getTextSearchOptions: function() {
                var options = { 'list': [] };
                if (this.map == null) return options;
                var i, ii, in1 = [], in2 = [], res = [], len = this.map.layers.length;

                for (i = 0; i < len; i++) {
                    if (!(this.map.layers[i] instanceof GWTK.graphicLayer)) {
                        if ((typeof this.map.layers[i].isTextSearch === 'function' && this.map.layers[i].isTextSearch())
                            || (typeof this.map.layers[i].isTextSearch !== 'function' && this.map.layers[i].isTextSearch)) {
                            var laycurrent = { 'layer': '', 'keys': [] };

                            laycurrent['layer'] = this.map.layers[i].idLayer;
                            laycurrent['keys'] = this.map.layers[i].keysTextSearch;

                            if (this.map.layers[i].typeNames) {
                                laycurrent['typenames'] = this.map.layers[i].typeNames;
                            }

                            if (this.map.layers[i].codeList) {
                                laycurrent['codelist'] = this.map.layers[i].codeList;
                            }

                            if (this.map.layers[i].getKeyListParamString) {              // фильтр объектов
                                var objkeys = this.map.layers[i].getKeyListParamString();
                                if (objkeys.hasOwnProperty('keylist') && objkeys['keylist'])
                                    laycurrent['keylist'] = objkeys['keylist'];
                            }

                            if (options.list.length == 0) {
                                options.list.push(laycurrent);
                            } else {
                                var ind = -1, len;
                                var len2 = options.list.length;
                                for (ii = 0; ii < len2; ii++) {
                                    if (options.list[ii].layer == laycurrent.layer) {
                                        ind = ii;
                                        break;
                                    }
                                }

                                if (ind == -1) {
                                    options.list.push(laycurrent);
                                } else {
                                    in1 = laycurrent.keys;
                                    in2 = options.list[ind].keys;
                                    res = in1.concat(in2.filter(function(item) {
                                        return in1.indexOf(item) < 0;
                                    }));
                                    options.list[ind].keys = res;

                                    if (laycurrent.typeNames) {
                                        in1 = laycurrent.typeNames;
                                        in2 = options.list[ind].typeNames;
                                        res = in1.concat(in2.filter(function(item) {
                                            return in1.indexOf(item) < 0;
                                        }));
                                        options.list[ind].typeNames = res;
                                    }

                                    if (laycurrent.codelist) {
                                        in1 = laycurrent.codelist;
                                        in2 = options.list[ind].codelist;
                                        res = in1.concat(in2.filter(function(item) {
                                            return in1.indexOf(item) < 0;
                                        }));
                                        options.list[ind].codelist = res;
                                    }
                                }
                            }
                        }
                    }

                }
                return options;
            },

            /**
             * Получить слой карты по идентификатору слоя сервиса
             * @method getLayerByIdService
             * @param idlayer {String} идентификатор слоя сервиса,
             * @param maplayer {Object} объект слоя карты, от которого ищем.
             * @return {Object} объект слоя карты
             */
            getLayerByIdService: function(idlayer, maplayer) {
                if (typeof this.map == 'undefined' || !idlayer || idlayer.length == 0)
                    return '';
                var idlayer = idlayer;
                if (idlayer.indexOf('#') > -1) {                             // 11/07/19
                    idlayer = encodeURIComponent(idlayer);
                }
                var i, len = this.map.layers.length, f = 0;
                for (i = 0; i < len; i++) {
                    if (maplayer && this.map.layers[i].xId == maplayer.xId) {
                        f = 1;
                        continue;
                    }
                    if (idlayer == this.map.layers[i].idLayer) {
                        if (!maplayer) return this.map.layers[i];
                        else if (f) return this.map.layers[i];
                    }
                }
                return '';
            },

            /**
             * Получить первый слой карты, удовлетворяющий фильтру
             * @method getLayerByFilter
             * @param filter {object} Объект фильтра
             * @return {Object} объект слоя карты
             */
            getLayerByFilter: function(filter) {

                const { idLayer, serviceUrl } = filter;

                for (let i = 0; i < this.map.layers.length; i++) {
                    const layer = this.map.layers[i];

                    // Проверка по идентификатору слоя на сервисе
                    if (idLayer !== undefined && decodeURIComponent(layer.idLayer) !== idLayer) {
                        continue;
                    }

                    // Проверка по адресу сервиса
                    if (serviceUrl !== undefined) {
                        //TODO: пока WMSlayer не переписали на TS
                        if (layer.serviceUrl !== undefined) {
                            if (layer.serviceUrl.replace('?', '') !== serviceUrl) {
                                continue;
                            }
                        } else if (layer.serverUrl !== undefined) {
                            if (layer.serverUrl.replace('?', '') !== serviceUrl) {
                                continue;
                            }
                        } else if (layer.server !== undefined) {
                            if (layer.server.replace('?', '') !== serviceUrl) {
                                continue;
                            }
                        }
                    }

                    return layer;
                }
            },

            getLayersWithIdService: function(idlayer) {
                var layers = [];
                if (typeof idlayer === 'undefined' || !this.map) {
                    return layers;
                }
                var idlayer = idlayer, i, len = this.map.layers.length;
                ;
                if (idlayer.indexOf('#') > -1) {
                    idlayer = encodeURIComponent(idlayer);
                }
                for (i = 0; i < len; i++) {
                    if (idlayer == this.map.layers[i].idLayer) {
                        layers.push(this.map.layers[i]);
                    }
                }
                return layers;
            },

            /**
             * Получить слой карты по идентификатору объекта gmlid
             * @method getLayerByGmlId
             * @param gmlid {String} идентификатор объекта gmlid,
             * @return {Object} объект слоя карты или `null`
             */
            getLayerByGmlId: function(gmlid) {
                if (!this.map || !gmlid || gmlid.length == 0)
                    return null;
                var gmldata = GWTK.Util.parseGmlId(gmlid),
                    i, len = this.map.layers.length;
                if (!gmldata.sheet)
                    return null;

                for (i = 0; i < len; i++) {
                    if (!this.map.layers[i].mapSheets) continue;
                    if ($.inArray(gmldata.sheet, this.map.layers[i].mapSheets.sheets) > -1)
                        return this.map.layers[i];
                }
                var text = w2utils.lang('No layer found for object') + ' ' + gmlid;
                GWTK.mapWriteProtocolMessage(this.map, { text: text, display: false, icon: 'warning' });
                return null;
            },

            /**
             * Получить слои карты по идентификатору объекта gmlid
             * @method getLayersByGmlId
             * @param gmlid {String} идентификатор объекта gmlid
             * @return {Array} массив объектов слоя карты или `null`
             * (несколько wms-слоев могут запрашиваться с одного слоя сервиса)
             */
            getLayersByGmlId: function(gmlid) {
                if (!this.map || !gmlid || gmlid.length == 0)
                    return [];
                var gmldata = GWTK.Util.parseGmlId(gmlid),
                    i, len = this.map.layers.length;
                if (!gmldata.sheet)
                    return null;
                var layers_array = [];
                for (i = 0; i < len; i++) {
                    if (!this.map.layers[i].mapSheets) continue;
                    if ($.inArray(gmldata.sheet, this.map.layers[i].mapSheets.sheets) > -1)
                        layers_array.push(this.map.layers[i]);
                }
                return layers_array;
            },

            /**
             * Получить идентификатор слоя сервиса
             * @method getIdServiceByLayer
             * @param layer {Object} слой карты
             * @return {String} идентификатор слоя сервиса или ` `
             */
            getIdServiceByLayer: function(layer) {
                if (!layer) return '';
                if (!(layer instanceof WmsLayer) && !(layer instanceof TileLayer))
                    return '';

                return layer.idLayer;
            },

            /**
             * Получить список идентификаторов слоев карты по списку идентификаторов объектов
             * @method getIdServiceByGmlIds
             * @param gmlid {Array} массив gmlid объектов карты
             * @return {Array} массив id слоев карты
             */
            getIdServiceByGmlIdList: function(gmlid) {
                var sheets = [];                         // список листов карт
                if (!gmlid || !$.isArray(gmlid))
                    return sheets;
                var i, len = gmlid.length, j;
                for (i = 0; i < len; i++) {
                    var gml = GWTK.Util.parseGmlId(gmlid[i], '.');
                    if (gml.sheet == undefined) continue;
                    if (GWTK.Util.indexOf(sheets, gml.sheet, 0) == -1)
                        sheets.push(gml.sheet);
                }

                len = sheets.length;
                var layers_array = [];

                // заполняем список id слоев
                for (i = 0; i < len; i++) {
                    for (j = 0; j < this.map.layers.length; j++) {
                        if (!this.map.layers[j].mapSheets) continue;
                        if ($.inArray(sheets[i], this.map.layers[j].mapSheets.sheets) > -1) {
                            if (GWTK.Util.indexOf(layers_array, sheets[i], 0) == -1) {
                                layers_array.push(this.map.layers[j].idLayer);
                            }
                        }
                    }
                }
                return layers_array;
            },

            /**
             * Проверить вхождение точки в габариты карты
             * @method _testPointByMaxBounds
             * @param point {GWTK.Point} координаты точки в панели событий eventPane
             * @return {boolean} `true`/`false`,
             * `true` - если точка в пределах габаритов или габариты не установлены
             */
            _testPointByMaxBounds: function(point) {
                if (typeof this.map.maxBounds === 'undefined') {
                    return true;
                }
                if (typeof point === 'undefined' || !(point instanceof GWTK.Point)) return false;
                if (point.x < 0 || point.y < 0) return false;
                var coord = this.map.pixelToPlane(point);
                if (this.map.maxBounds.contains(coord) || this.map.maxBounds.intersects(new Bounds(coord, coord))) {
                    return true;
                }
                return false;
            },

            /**
             * Получить габариты рисунка карты
             * @method _getMaxFramePicture
             * @return {GWTK.Вounds} габариты рисунка, пиксели.
             * Если maxBounds в карте не установлены возвращает undefined
             */
            _getMaxFramePicture: function() {
                if (typeof this.map.maxBounds == 'undefined') {
                    return undefined;
                }

                var pixelframe = new PixelBounds();
                if (this.map.tileMatrix.getTilePixelByFrame(this.map.maxBounds, this.map.options.tilematrix, pixelframe) == 0)
                    return 0;
                return pixelframe;
            },

            /**
             * Проверить возможность перемещения карты
             * @method _testShift
             * @param dx, dy {Number} размер смещения карты по горизонтали и вертикали
             * @return {Array} [dx, dy] проверенные размеры смещения
             */
            _testShift: function(dx, dy) {
                if (!this.tileScreen || typeof (dx) == 'undefined' || typeof (dy) == 'undefined') {
                    return dx;
                }

                var dy = dy, mapsize = this.map.getSize(),
                    pixeltopleft = this.map.getPixelMapTopLeft().round(),
                    picY = pixeltopleft.y,
                    end = this.tileScreen.pictureH - picY;
                if (dy < 0) {                                            // идем к последнему ряду матрицы
                    if (end <= mapsize.y) {
                        dy = 0;
                    }
                } else {                                                   // идем к начальному ряду матрицы
                    if (picY < 0.0) {
                        if (end > mapsize.y) {
                            dy = 0;
                        }
                    }
                }

                if (typeof this.tileScreen.pictureframe !== 'undefined') {                      // установлены максимальные габариты карты
                    var new_bounds = {},
                        new_top = new PixelPoint(pixeltopleft.x - dx, pixeltopleft.y - dy),
                        new_bottom = new_top.clone();
                    new_bottom.add(new PixelPoint(mapsize.x, mapsize.y), new_bottom);
                    new_bounds = Bounds.toBounds(new_top, new_bottom);

                    if (this.tileScreen.pictureframe.contains(new_bounds)) {
                        return [dx, dy];
                    }
                    let message;
                    if (dx > 0) {
                        if (this.tileScreen.pictureframe.min.x > new_bounds.min.x) {              // предел слева
                            if (this.tileScreen.pictureframe.max.x > new_bounds.max.x) {
                                dx = 0;
                                message = 'The left border of the map has been reached';
                            }
                        }
                    }
                    if (dx < 0) {
                        if (this.tileScreen.pictureframe.max.x < new_bounds.max.x) {              // предел справа
                            if (this.tileScreen.pictureframe.min.x < new_bounds.min.x) {
                                dx = 0;
                                message = 'The right border of the map has been reached';
                            }
                        }
                    }
                    if (dy < 0) {                                                                  // предел снизу
                        if (new_bounds.max.y - this.tileScreen.pictureframe.max.y > 15) {
                            if (this.tileScreen.pictureframe.min.y - new_bounds.min.y < 0) {
                                dy = 0;
                                message = 'The bottom border of the map has been reached';
                            }
                        }
                    }
                    if (dy > 0) {                                                                  // предел сверху (min)
                        if (this.tileScreen.pictureframe.min.y > new_bounds.min.y) {
                            if (this.tileScreen.pictureframe.max.y > new_bounds.max.y) {
                                dy = 0;
                                message = 'The top border of the map has been reached';
                            }
                        }
                    }
                    if (message) {
                        this.showBorderMessage(message);
                    }

                }

                return [dx, dy];
            },

            showBorderMessage: function(message) {
                console.log(this.map.translate(message));
                this.map.writeProtocolMessage({ text: this.map.translate(message) });
            },

            /**
             * Обработчик события нажатия мыши (mousedown) в карте
             * @method _onMouseDown
             */
            _onMouseDown: function(e) {
                //onMouseDown(e);
                this.xOffset = 0;
                this.yOffset = 0;
                if (typeof this.wmsManager !== 'undefined') {
                    this.wmsManager.xOffset = 0;
                    this.wmsManager.yOffset = 0;
                    //this.wmsManager.reset();
                }

                var matrixSizePixel = this.map.tileMatrix.getTileMatrixSize(this.map.getZoom());
                this.tileScreen = {
                    'pictureW': matrixSizePixel.x,
                    'pictureH': matrixSizePixel.y,
                    'pictureframe': this._getMaxFramePicture()
                };

                return false;
            },

            /**
             * Обработчик события отпускания мыши (mouseup) в карте
             * @method _onMouseUp
             */
            _onMouseUp: function(e) {
                return false;
            },

            /**
             * Обработчик события движения мыши (mousemove) в карте
             * @method _onMouseMove
             * @param dx {Number} приращение положения курсора мыши по горизонтали
             * @param dy {Number} приращение положения курсора мыши по вертикали
             */
            _onMouseMove: function(dx, dy) {

                this.xOffset = dx;
                this.yOffset = dy;

                if (!GWTK.browserSafariForiOS)
                    this._moveMap();
                else {
                    if (this.timerMosaicRedraw != null) {
                        clearTimeout(this.timerMosaicRedraw);
                        this.timerMosaicRedraw = null;
                    }
                    this.timerMosaicRedraw = setTimeout(this._moveMap, this.timerMosaicRedrawInterval);
                }

                return false;
            },

            _moveMap: function() {
                if (this.mapmove == undefined)
                    this.mapmove = this.map.handlers.movedrag;

                this.shift();

                this.xOffset = 0;
                this.yOffset = 0;
            },

            /**
             * Сдвиг изображения слоев
             * @method shift
             * @return {Boolean} `true` сдвиг выполнен, `false` - нет
             */
            shift: function() {
                var map = this.map;
                if (!map || !map.layers) {
                    return false;
                }
                for (var i = 0; i < map.layers.length; i++) {
                    if (!map.layers[i] || map.layers[i].wms) continue;
                    if (typeof map.layers[i].updateView == 'function') {
                        map.layers[i].updateView();
                    }
                }

                this.drawMapImage(true);

                return;
            },

            /**
             * Создать канву
             * @method _createCanvas
             */
            _createCanvas: function() {
                if (!this.map || this._canvas) {
                    return;
                }
                var size = this.map.getSize();
                var $c = $('<canvas width="' + size.x + '" height="' + size.y + '" class="map-canvas" ></canvas>');
                $c.addClass('map-canvas-main');
                $c.insertBefore(this.map.tilePane);
                $c.css({ 'top': '0px', 'left': '0px' });
                var $mc = $(this.map.mapPane).find('.map-canvas-main');
                if ($mc.length > 0) {
                    this._canvas = $mc[0];
                } else {
                    this._canvas = undefined;
                }
                return;
            },

            /**
             * Получить канву
             * @method _getCanvas
             */
            _getCanvas: function() {
                if (this._canvas) {
                    return this._canvas;
                }
                var $c = $(this.map.mapPane).find('canvas.map-canvas');
                if ($c.length > 0) {
                    return $c[0];
                }
                return undefined;
            },

            /**
             * Изменить размер канвы
             * @method resizeCanvas
             */
            resizeCanvas: function() {
                if (!this._canvas) {
                    return;
                }
                var $tc = $(this.map.mapPane).find('canvas .temp_canvas'),
                    size = this.map.getSize();
                if (size.x === this._canvas.width && size.y === this._canvas.height) {
                    return;
                }

                this._canvas.width = size.x;
                this._canvas.height = size.y;

                if ($tc.length !== 0) {
                    $tc[0].width = this._canvas.width;
                    $tc[0].height = this._canvas.height;
                }
            },

            /**
             * Очистить канву
             * @method _clearCanvas
             */
            _clearCanvas: function() {
                if (!this._canvas) return;
                var ctx = this._canvas.getContext('2d');
                if (!ctx) return;
                ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            },

            /**
             * Нарисовать карту
             * @method drawMapImage
             * @param clear {Boolean} флаг 'стереть'
             * @param draw {Boolean} флаг `рисовать wms`, `true` - обновить все wms-рисунки и отобразить
             * @param redraw {Boolean} флаг `перерисовать wms`, `true` - wms-рисунки вывести из ранее полученных изображений
             */
            drawMapImage: function(clear, draw, redraw) {
                if (!this._canvas) {
                    return;
                }

                if ($.isEmptyObject(this._drawFilter)) {
                    var filter = undefined;
                } else {
                    var filter = this._drawFilter;
                }

                var layers = this.getVisibleLayers(), i, len,                      // видимые слои в порядке отображения
                    wmsfilter = filter ? filter.wms : undefined,
                    bounds = this.map.getPixelMapBounds(),
                    begin = new PixelPoint(bounds.min.x, bounds.min.y);


                var ctx = this._canvas.getContext('2d');
                if (clear) {
                    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
                }
                if (!redraw || clear) {
                    for (i = 0; len = layers.length, i < len; i++) {
                        var layer = this.getLayerByxId(layers[i].xId);
                        if (!layer) continue;
                        if (layer.getType() === 'tile') {
                            if (filter && $.inArray(layer.xId, filter.wmts) == -1) {
                                continue;
                            }
                            layer.drawLayer(bounds, begin, false);
                        }
                    }
                }
                if (this.map._wmsEnabled()) {
                    if (this.wmsManager.isUpdate()) {
                        this.wmsManager.clipImageTemp(bounds, ctx);
                    } else {
                        if (draw) {
                            this.wmsManager.run();
                        } else if (redraw) {
                            this.wmsManager.redraw(this._canvas, undefined, wmsfilter);
                        }
                    }
                }

                return ctx;
            },


            /**
             * Получить координаты точки в тайлах текущей матрицы
             * @method getLayersPointTile
             * @param point {GWTK.Point} координаты точки в окне карты, пиксели
             * @return {Array} координаты точки в текущей матрице тайлов [col,row,x,y,screenX,screenY]
             */
            getLayersPointTile: function(point/*GWTK.Point*/) {
                if (this.map == null)
                    return null;

                var tilesize = this.map.tileMatrix.getTileSize();
                var matrixSize = this.map.tileMatrix.getTileMatrixSize(this.map.options.tilematrix);

                var pixel = this.map.getPixelMapTopLeft();
                pixel.add(point, pixel);

                if (pixel.x > matrixSize.y) {
                    pixel.x -= matrixSize.y;
                }

                return this._getPixelTile(pixel, tilesize);
            },

            /**
             * Получить координаты тайла в точке
             * @method _getPixelTile
             * @param point {GWTK.Point} координаты точки в матрице, пиксели
             * @param tilesize {Number} размер тайла, пиксели
             * @return {Array} координаты тайла [колонка, строка, x в тайле, y в тайле, point.x, point.y]
             */
            _getPixelTile: function(point, tilesize) {
                if (!point) {
                    return undefined;
                }
                var tilesize = tilesize != undefined ? tilesize : 256;
                var coll = parseFloat(point.x) / tilesize,
                    row = parseFloat(point.y) / tilesize,
                    x = (coll - parseInt(coll, 10)) * tilesize,
                    y = (row - parseInt(row, 10)) * tilesize;

                return [parseInt(coll, 10), parseInt(row, 10), Math.round(x), Math.round(y), point.x, point.y];
            },

            /**
             * Получить координаты точки в системе координат матрицы тайлов
             * @method getLayersPointProjected
             * @param point {GWTK.Point} координаты точки в окне карты, пиксели
             * @return {MapPoint} координаты точки в CRS матрицы
             */
            getLayersPointProjected: function(point/*GWTK.Point*/) {
                var tilepos = this.getLayersPointTile(point);             // тайл в точке point
                if (!tilepos) return null;
                const ppoint = new PixelPoint(tilepos[4], tilepos[5]);
                return this.map.tileMatrix.getPointByPixel(ppoint, this.map.getZoom());        // прямоугольные координаты точки
            },


            /**
             * Получить смещение точки относительно начала отображения карты
             * @method getLayersPointOffset
             * @param pos {Array} координаты точки в матрице тайлов
             * @return {GWTK.Point} относительные координаты точки, пикселы
             */
            getLayersPointOffset: function(pos) {
                if (this.map == null)
                    return null;
                var topleft = this.map.getPixelMapTopLeft().round();
                var point = new PixelPoint(pos[4], pos[5]).subtract(topleft);
                return point;
            },

            /**
             * Порядок отображения слоев по параметрам карты
             * @method _viewOrderParam
             * @return {Array} порядок отображения в options.layers карты, идентификаторы слоев в порядке следования
             */
            _viewOrderParam: function() {
                if (typeof (this.map) == 'undefined' || typeof (this.map.options.layers) == 'undefined') {
                    return [];
                }
                var order = [],
                    i;

                for (i = 0; i < this.map.options.layers.length; i++) {
                    if (this.map.options.layers[i].folder && this.map.options.layers[i].folder.length > 0) {
                        continue;
                    }
                    if (!this.findNode({ nodes: this.map.options.contenttree }, this.map.options.layers[i].id)) {
                        continue;
                    }
                    order.push(this.map.options.layers[i].id);
                }
                return order;
            },

            findNode(treenode, id) {
                let resultNode;
                if (treenode.id == id) {
                    resultNode = treenode;
                } else if (treenode.nodes && treenode.nodes.length !== 0) {
                    for (let i = 0; i < treenode.nodes.length; i++) {
                        const currentNode = treenode.nodes[i];
                        const currentResult = this.findNode(currentNode, id);
                        if (currentResult) {
                            resultNode = currentResult;
                            break;
                        }
                    }
                }
                return resultNode;
            },

            /**
             * Установить порядок отображения слоев
             * @method _setLayersViewOrderParam
             * @param vieworder {Array} порядок отображения, идентификаторы слоев в порядке следования
             *
             */
            _setLayersViewOrderParam: function(vieworder) {

                this.map.options.layers.sort((layerA, layerB) => (layerA.zIndex || 0) - (layerB.zIndex || 0));

                var param_order = this._viewOrderParam(),    // порядок слоев по options карты
                    i, len, count,
                    order = vieworder.filter(xId => {
                        const node = this.findNode({ nodes: this.map.options.contenttree }, xId);
                        if (node) {
                            const layer = this.map.options.layers.find(layer => layer.id === xId);
                            if (layer) {
                                return !layer.folder;
                            }
                        }
                    });
                if (param_order.length == 0) {
                    return param_order;
                }
                if (typeof order == 'undefined' || order.length !== param_order.length) {
                    order = param_order;
                }

                count = 0;
                // проверяем order
                for (i = 0; i < order.length; i++) {
                    if ($.inArray(order[i], param_order) > -1) {
                        count++;
                    }
                }
                if (count !== order.length) {
                    order = param_order;
                }
                // применяем порядок order
                for (i = 0; len = this.map.options.layers.length, i < len; i++) {
                    if (this.map.options.layers[i].folder && this.map.options.layers[i].folder.length > 0) {
                        //this.map.options.layers[i].zIndex = -1;
                        continue;
                    }
                    // this.map.options.layers[i].zIndex = order.indexOf(this.map.options.layers[i].id);
                }

                this.map.options.layers.sort(this._compareOrder);

                // return order;
                return param_order;
            },

            moveLayerToTop(xId) {

                const currentIndex = this.viewOrder.indexOf(xId);

                if (currentIndex === this.viewOrder.length - 1) {
                    return;
                }

                if (currentIndex !== -1) {
                    this.viewOrder.splice(currentIndex, 1);
                }

                const layer = this.getLayerByxId(xId);

                const lastXId = this.viewOrder[this.viewOrder.length - 1];
                const topLayer = this.getLayerByxId(lastXId);

                if (layer && topLayer) {
                    layer.zIndex = topLayer.zIndex + 1;
                    this.insertByZIndex(xId);
                }
            },

            insertInFirstFreePlace(xId) {
                const layer = this.getLayerByxId(xId);
                if (!layer) {
                    return;
                }
                layer.zIndex = 1;

                this.insertByZIndex(xId);
            },

            insertByZIndex(xId) {
                const layer = this.getLayerByxId(xId);
                if (!layer) {
                    return;
                }

                let targetZIndex = layer.zIndex;
                let position;

                for (let i = 0; i < this.viewOrder.length; i++) {

                    const xIdCurrent = this.viewOrder[i];
                    const layerCurrent = this.getLayerByxId(xIdCurrent);

                    if (layerCurrent) {
                        if (layerCurrent.zIndex === targetZIndex) {
                            targetZIndex++;
                        } else if (layerCurrent.zIndex > targetZIndex) {
                            position = i;
                            break;
                        }
                    }
                }

                if (position === undefined) {
                    position = this.viewOrder.length;
                }

                this.viewOrder.splice(position, 0, xId);

                layer.zIndex = targetZIndex;
                if (layer.layerContainer) {
                    layer.layerContainer.style.zIndex = '' + layer.zIndex;
                }

            },

            validateViewOrder() {
                for (let i = 0; i < this.viewOrder.length; i++) {

                    const xIdCurrent = this.viewOrder[i];
                    const xIdNext = this.viewOrder[i + 1];

                    const layerCurrent = this.getLayerByxId(xIdCurrent);
                    const layerNext = this.getLayerByxId(xIdNext) || undefined;

                    if (layerCurrent && layerNext && layerCurrent.zIndex >= layerNext.zIndex) {
                        layerNext.zIndex = layerCurrent.zIndex + 1;
                        if (layerNext.layerContainer) {
                            layerNext.layerContainer.style.zIndex = '' + layerNext.zIndex;
                        }
                    }
                }
            },

            /**
             * Установить порядок отображения слоев
             * @method setLayersInViewOrder
             */
            setLayersInViewOrder() {
                if (!this.map || !this.map.layers || this.map.layers.length === 0) {
                    return;
                }

                this.validateViewOrder();

                this.wmsUpdate();

                this.drawMapImage(true, false, true);
                this.map._writeCookie();
            },

            /**
             * Установить порядок отображения слоев по списку
             * @method setLayerViewOrderByList
             * @param newViewOrder {String[]} идентификатор слоя в карте
             */
            setLayersInViewOrderByList: function(newViewOrder) {
                const viewOrderRest = this.viewOrder.filter(item => !newViewOrder.includes(item));

                this.viewOrder = newViewOrder;
                this.setLayersInViewOrder();

                viewOrderRest.forEach(item => this.insertByZIndex(item));

                $(this.map.eventPane).trigger({ type: 'layerlistchanged', maplayer: {} });
                this.map.trigger({ type: 'layerlistchanged', target: 'map' });
            },

            /**
             * Получить идентификатор самого верхнего видимого слоя тайлов
             * @method getTopmostTileLayerxId
             * @return {String} идентификатор слоя тайлов или `false`
             */
            getTopmostTileLayerxId: function() {
                var viewLayers = this.getVisibleLayers(),
                    len = viewLayers.length, i;
                if (len == 0) {
                    return false;
                }
                for (i = len - 1; i >= 0; i--) {
                    if (viewLayers[i].tiles) {
                        return viewLayers[i].xId;
                    }
                }
                return false;
            },

            /**
             * Установить непрозрачность изображения слоев по параметрам
             * @method setLayersOpacity
             */
            setLayersOpacity: function() {
                if (!this.map) return;
                var i, len = this.map.layers.length,
                    layers = this.map.layers;
                for (i = 0; i < len; i++) {
                    if (layers[i].options.opacityValue === undefined) {
                        layers[i].options.opacityValue = 100;
                    }
                    var opacity = layers[i].options.opacityValue,
                        css = layers[i].initOpacity(opacity);
                    layers[i].setOpacity(css);
                    //this.layersOpacity[layers[i].xId] = { id: layers[i].xId, value: opacity };
                }
                return;
            },


            // ОТОБРАЖЕНИЕ СЛОЕВ, ПОСТРОЕННЫХ ПО ПРАВИЛАМ КЛАСТЕРИЗАЦИИ

            /**
             * Показать слои кластеризации, имеющие признак merge
             * @method showMergeClusterizatorLayers
             */
            showMergeClusterizatorLayers: function() {
                if (this.clusterizatorMergeLayers) {
                    this.clusterizatorMergeLayers.clear();
                    this.clusterizatorMergeLayers = null;
                }
                this.setMergeClusterizatorLayers();
                this.clusterizatorMergeLayers = this.drawClusterizator();
            },

            /**
             * Назначить слои кластеризации, имеющие признак merge
             * @method setMergeClusterizatorLayers
             */
            setMergeClusterizatorLayers: function() {
                this.clusterizatorMergeJSON = null;
                for (var i = 0; i < this.map.layers.length; i++) {
                    this.addMergeClusterizatorLayer(this.map.layers[i]);
                }
            },

            /**
             * Добавить слой кластеризации, имеющий признак merge
             * @method addMergeClusterizatorLayer
             * @param layer - объект GWTK.GeoMarkersLayer
             */
            addMergeClusterizatorLayer: function(layer) {
                if (!layer || layer.type !== 'geomarkers' || !layer.merge || !layer.GeoJSON || !layer.visible ||
                    !layer.GeoJSON.features || layer.GeoJSON.features.length == 0)
                    return;

                if (!this.clusterizatorMergeJSON) {
                    this.clusterizatorMergeJSON = {
                        'type': 'FeatureCollection',
                        'bbox': [],
                        'features': []
                    };
                }
                var bbox;
                for (var i in layer.GeoJSON.features) {
                    this.clusterizatorMergeJSON.features.push(layer.GeoJSON.features[i]);
                    // Пересчитать габариты
                    bbox = layer.GeoJSON.features[i].bbox;
                    if (this.clusterizatorMergeJSON['bbox'].length == 0) {
                        this.clusterizatorMergeJSON['bbox'] = JSON.parse(JSON.stringify(bbox));
                    } else {
                        this.clusterizatorMergeJSON['bbox'][0] = Math.min(this.clusterizatorMergeJSON['bbox'][0], bbox[0]);
                        this.clusterizatorMergeJSON['bbox'][1] = Math.min(this.clusterizatorMergeJSON['bbox'][1], bbox[1]);
                        this.clusterizatorMergeJSON['bbox'][2] = Math.max(this.clusterizatorMergeJSON['bbox'][2], bbox[2]);
                        this.clusterizatorMergeJSON['bbox'][3] = Math.max(this.clusterizatorMergeJSON['bbox'][3], bbox[3]);
                    }
                }

                // Объединить настройки кластеризатора
                var styleSettings;
                if (layer.loadedCss) {
                    styleSettings = {
                        'typeField': layer.typeField, // geoJSON.typeField,
                        'style': GWTK.Util.parseGraphicLayerStylesForCLuster(layer.loadedCss),
                        'defaultStyle': null
                    };
                }

                if (!this.clusterizatorMergeOptions) {
                    this.clusterizatorMergeOptions = {
                        'useAnimation': false,
                        'smallClusterLimit': 10,
                        'mediumClusterLimit': 100,
                        'largeClusterLimit': 1000,
                        'veryLargeClusterLimit': 10000
                    };
                }

                // Смержим опции
                if (layer.clusteroptions) {
                    for (var i in layer.clusteroptions) {
                        if (layer.clusteroptions.hasOwnProperty(i)) {
                            if (!this.clusterizatorMergeOptions[i]) {
                                this.clusterizatorMergeOptions[i] = layer.clusteroptions[i];
                            }
                        }
                    }
                }

                // Смержим стили
                if (!this.clusterizatorMergeOptions.styleSettings) {
                    if (styleSettings) {
                        this.clusterizatorMergeOptions.styleSettings = styleSettings;
                    }
                } else {
                    for (var i in layer.loadedCss) {
                        if (layer.loadedCss.hasOwnProperty(i)) {
                            if (!this.clusterizatorMergeOptions.styleSettings.style[i]) {
                                this.clusterizatorMergeOptions.styleSettings.style[i] = layer.loadedCss[i];
                            }
                        }
                    }
                }

            },

            /**
             * Отрисовать слой по правилам кластеризации
             * @method drawClusterizator
             * @param layer  - объект GWTK.GeoMarkersLayer (при отсутствии отображается объект кластеризации карты clusterizatorLayers)
             * @returns {GWTK.mapclusterizator}
             */
            drawClusterizator: function(layer) {

                var clusterizator, geoJSON, settings;
                if (layer) {
                    clusterizator = layer.clusterizator;
                    geoJSON = layer.GeoJSON;
                    settings = layer.clusteroptions;
                    if (layer.loadedCss) {
                        settings.styleSettings = {
                            'typeField': layer.typeField, // geoJSON.typeField,
                            'style': GWTK.Util.parseGraphicLayerStylesForCLuster(layer.loadedCss),
                            'defaultStyle': null
                        };
                    }
                } else {
                    clusterizator = this.clusterizatorMergeLayers;
                    geoJSON = this.clusterizatorMergeJSON;
                    settings = this.clusterizatorMergeOptions;
                }

                if (clusterizator) {
                    clusterizator.clear();
                    clusterizator = null;
                }
                if (!geoJSON) {
                    return;
                }

                settings.json = geoJSON;
                clusterizator = new GWTK.mapclusterizator(this.map, settings);
                var center = this.map.getCenterGeoPoint();
                center = new GWTK.LatLng(center.getLatitude(), center.getLongitude());
                var zoom = this.map.options.tilematrix;
                clusterizator.clusterifyFrom(geoJSON, false, center, zoom, null, null);
                return clusterizator;
            },

            _compareOrder: function(a, b) {
                if (typeof a == 'undefined' || typeof b == 'undefined') {
                    return 0;
                }
                if (typeof a.zIndex == 'undefined' || typeof b.zIndex == 'undefined') {
                    return 0;
                }
                if (a.zIndex < b.zIndex) {
                    return -1;
                }
                if (a.zIndex > b.zIndex) {
                    return 1;
                }
                return 0;
            },

            /**
             * Установить период обновления карты
             * @method setRefreshInterval
             * @param seconds {Number} период обновления динамических слоев карты, секунды
             * функция принудительно выполняет запросы изображений wms-слоев через промежуток времени seconds
             * Если seconds = 0 или undefined, обновление прекращается
             */
            setRefreshInterval: function(seconds) {
                var delay = 0;
                if (!isNaN(seconds)) {
                    delay = parseInt(seconds) * 1000;
                }

                this.map.workspaceManager.setValue(PROJECT_SETTINGS_REFRESH_INTERVAL, delay / 1000);

                this.stopRefreshInterval();

                if (delay) {
                    this.refreshTimer = setInterval(() => {
                        this._getUpdatableLayers().then((idList) => {
                            if (idList.length > 0 && !this.wmsManager.isUpdate()) {
                                this.wmsUpdate();
                            }
                        }).catch(e => {
                            console.log(e);
                        });
                    }, delay);

                    GWTK.mapWriteProtocolMessage(this.map, {
                        text: w2utils.lang('Layers refresh interval') + ' ' + seconds + ' ' + w2utils.lang('seconds'),
                        display: false
                    });
                } else {
                    GWTK.mapWriteProtocolMessage(this.map, {
                        text: w2utils.lang('Map refresh period disabled'),
                        display: false
                    });
                }
            },

            /**
             * Остановить обновление карты
             * @method  stopRefreshInterval
             * @param seconds {Number} период обновления динамических слоев карты, секунды
             * функция принудительно выполняет запросы изображений wms-слоев через промежуток времени seconds
             * Если seconds = 0 или undefined, обновление прекращается
             */
            stopRefreshInterval: function() {
                if (!this.refreshTimer) {
                    return;
                }
                clearInterval(this.refreshTimer);
                this.refreshTimer = undefined;
            },

            /**
             * Получить обновляемые слои
             * @method _getUpdatableLayers
             * @returns {Promise} идентификаторы слоев с разрешением на обновление
             */
            _getUpdatableLayers: function() {
                var ids = [],
                    i, len = this.map.layers.length;
                if (!this.wmsManager) {
                    return Promise.reject('No WMS layers');
                }
                for (i = 0; i < len; i++) {
                    if (typeof this.map.layers[i] === 'undefined')
                        continue;
                    if (this.map.layers[i].wms && this.map.layers[i].getWatch()) {
                        ids.push(this.map.layers[i].xId);
                    }
                }

                return this.wmsManager.retrieveLayerDataState(ids);
            }
        };

    GWTK.layersControl = function(map) {
        return new GWTK.LayersControl(map);
    };

}
