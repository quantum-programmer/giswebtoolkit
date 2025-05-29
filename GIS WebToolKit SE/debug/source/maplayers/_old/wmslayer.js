/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Управление WMS-слоем карты                   *
 *                                                                  *
 *******************************************************************/

import LegendClass from '~/classifier/Legend';
import { Cartesian2D } from '~/geometry/Cartesian2D';
import GeoPoint from '~/geo/GeoPoint';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import {
    //PROJECT_SETTINGS_LAYERS_VIEW_ORDER,
    PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_LINE_COLOR
} from '~/utils/WorkspaceManager';

if (window.GWTK) {
    GWTK.ImagePartDescriptor = {
        'src': '',
        'width': '',
        'string_bbox': ''
    };
    
    GWTK.WmsRequestDescriptor = {
        'url': '',
        'layer': GWTK.WmsLayer,
        'xdata': '',
        'xdata2': '',
        'img': null
    };
    
    GWTK.userLayerLegendItem = {
        'id': '',
        'text': '',
        'img': ''
    };
    
    /**
     * Конструктор
     * @param map {GWTK.Map}
     * @param options {JSON} параметры слоя
     * @public
     */
    GWTK.WmsLayer = function(map, options) {
        if (!map) {
            console.log(w2utils.lang("Map layer creation error") + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        if (!options) {
            console.log(w2utils.lang("Map layer creation error") + ". " + w2utils.lang("Not defined a required parameter") + " Options.");
            return;
        }
        this.map = null;
        this.options = null;
        this.parent = null;            // Контейнер wms-слоев
        this.layerContainer = null;    // Контейнер слоя
        
        this.alias = "";               // Название слоя
        this.server = "";              // Адрес wms-сервера
        this.xId = "";                 // Уникальный идентификатор слоя в карте
        this.url = "";                 // Шаблон запросов изображений карты
        this.wms = false;              // признак wms слоя
        this.typeNames = false;        // типы объектов в запросе
        this.codeList = false;         // список кодов объектов в запросе
        this.idList = false;           // список идентификаторов объектов
        this.paintSelectList;          // список идентификаторов объектов для выделения
        
        // операции на слое
        this.selectObject = 0;         // Возможность выбора объектов карты (1/0)
        this.keysTextSearch = "";      // Параметры фильтра объектов по названию (имена характеристик).
        this.areaSeek = 0;             // Возможность использования для поиска по области (1/0)
        
        this.visible = true;            // Признак видимости слоя (1/0)
        
        // параметры работы с сервером
        this.id = "";                   // id слоя карты wms-сервиса
        this.idLayer = "";              // id слоя карты wms-сервиса
        this.style = "default";         // Имя стиля карты. default по умолчанию
        
        this.classifier = null;         // классификатор карты
        
        this._urlParam = {};            // Параметры url
        
        this._queryParam = {};          // Параметры текущего запроса
        
        this._filter = null;            // фильтр отображения слоя
        
        this.dataState = 0;             // состояние данных на сервере
        
        this._bounds360 = false;        // габариты слоя не в пределах (-180, 180), признак
        this._maxPlaneX = undefined;    // Xmax в метрах для указанных габаритов слоя
        this.DELTA_BOUNDS = 2.;
        
        this.userLegendItems;           // описание элементов легенды пользовательского слоя
        
        // инициализация слоя
        this.init(map, options);
        
        // список имен листов слоя
        // this.mapSheets = { "layerId": this.idLayer, "sheets": [] };
        
        this._revoked = [];
        
        this._compositeDrawing = null;    // GWTK.CompositeDrawing, композиция wms-фрагментов
        
        return;
    }
    
    GWTK.WmsLayer.prototype =
        {
            /**
             * Инициализировать
             * @method init
             */
            init: function(map, options) {
                this.map = map;
                
                this.options = options;
                
                // Контейнер wms-слоев
                this.parent = this.map.getPanels().wms;
                
                this.errorImage = GWTK.imgEmpty;
                
                // Возможность отбора объектов
                this.selectObject = this.options.selectObject;
                if (this.selectObject == undefined)
                    this.selectObject = 0;
                
                // Возможность поиска по области
                this.areaSeek = this.selectObject;
                
                this.objNameSemantic = options.objnamesemantic ? options.objnamesemantic : 'ObjName';
                
                // параметры МСК
                this.setLocalCoordinateSystemOriginOffset();
                
                // параметры слоя
                this.setOptions();
                
                // установить габариты слоя
                this.setBounds();
                
                if (!this.wms) return;
                
                this._setUrlParam();
                
                this.createContainer();
                
                this.wmsManager = this.map.tiles.wmsManager;
                
                this.wmsManager.registerLayer(this);
                
                this.map.layers.push(this);
                
                this.map.tiles.setAuthTypeServer(this);
                
                // параметры фильтра отображения слоя
                this._filter = GWTK.layerFilter(this);
            },
            
            
            async getSheetNameList() {
                if (this.mapSheets) {
                    return this.mapSheets;
                }
                
                return this.requestSheetName();
            },
            
            
            requestSheetName() {
                if (this.activeSheetNameRequest) {
                    return this.activeSheetNameRequest;
                }
                
                this.activeSheetNameRequest = new Promise((resolve, reject) => {
                    const requestService = RequestServices.retrieveOrCreate({ url: this.serviceUrl }, ServiceType.REST);
                    requestService.getSheetName({ LAYER: this.idLayer }).then(response => {
                        this.mapSheets = [];
                        if (response.data) {
                            response.data.restmethod.outparams.forEach(sheet => this.mapSheets.push(sheet.value));
                        }
                        return resolve(this.mapSheets);
                    }).catch(e => reject(e)).finally(() => {
                        this.activeSheetNameRequest = undefined;
                    });
                });
                return this.activeSheetNameRequest;
            },
            
            /**
             * Получить тип слоя
             * @method getType
             * @public
             * @returns {string} строка, 'wms' - слой
             */
            getType: function() {
                if (this.wms) {
                    return 'wms';
                }
                return '';
            },
            
            /**
             * Установить параметры Url
             * @method setUrlParam
             * @protected
             */
            _setUrlParam: function() {
                this._urlParam = {};
                if (typeof this.options === "undefined" || this.getType() == '') {
                    return;
                }
                
                var prm = GWTK.Util.getParamsFromURL(this.options.url),
                    keys = Object.keys(prm), i, len = keys.length;
                
                this._urlParam["server"] = GWTK.Util.getServerUrl(this.options.url);
                this._urlParam["param"] = {};
                
                for (i = 0; i < len; i++) {
                    this._urlParam["param"][keys[i].toLowerCase()] = prm[keys[i]];
                }
                
                if (this.useXmlRpc()) {
                    delete this._urlParam["param"]["request"];
                    this._urlParam["param"]["restmethod"] = "GetImage";
                }
                
                return;
            },
            
            /**
             * Получить параметр Url
             * @method _getUrlParam
             * @param {string} имя параметра Url
             * @returns {string} значение параметра.
             * При отсутствии параметра возвращает пустую строку
             * @protected
             */
            _getUrlParam: function(param) {
                if (Object.keys(this._urlParam).length === 0) {
                    this._setUrlParam();
                }
                return this._urlParam[param] || '';
            },
            
            /**
             * Создать контейнер слоя
             * @method createContainer
             */
            createContainer: function() {
                var container = this.layerContainer = GWTK.DomUtil.create('div', 'wms-panel', this.parent),
                    img = this._image = document.createElement('img');
                img.className = "wms-image";
                img.id = "img_wms_" + this.xId;
                container.id = "div_wms_" + this.xId;
                container.appendChild(img);
                //img.onload = GWTK.Util.falseFunction;
                img.onload = this._onLoadImage.bind(this)
                this.$layerContainer = $(this.layerContainer);
                if (typeof this.options.zIndex !== "undefined") {
                    this.layerContainer.style.zIndex = this.options.zIndex;
                }
            },
            
            /**
             * Добавление слоя
             * @method onAdd
             */
            onAdd: function() {
                
                if (this.options.hidden) this.hide(true);
                
                if (this.layerContainer)
                    $(this.map.eventPane).trigger({ type: 'layerlistchanged', maplayer: { 'id': this.xId, 'act': 'add' } });
                
                // Запросить список имен листов карты для слоя
                // if (this.selectObject) {
                //     GWTK.Util.getSheetNameForLayer(this);
                // }
                // Загрузить классификатор
                // if (this.map.classifiers) {
                this.classifier = this.map.classifiers.createByLayer(this);
                // }
                // else {
                //     this.classifier = new GWTK.classifier(this);
                // }
                
                this.legendInstance = new LegendClass({
                    serviceUrl: this.serviceUrl,
                    layerId: this.idLayer,
                    filters: { BYXSD: '0' }
                });
                
                this.setLayerDataState();
                
                return true;
            },
            
            /**
             * Удаление слоя
             * @method onRemove
             */
            onRemove: function() {
                if (!this.layerContainer) return;
                
                var temp = document.getElementById(this.layerContainer.id + "_temp");
                if (temp) $(temp).remove();
                $(this.layerContainer).remove();
                this.layerContainer = null;
                
                // удалить признак загрузки легенды в локальном хранилище
                GWTK.Util.removeLocalKey('legend_' + this.xId);
                
                // удалить легенду
                GWTK.Util.removeLegend(this.xId, this.map);
                
                // // удалить список листов карты
                // if (this.mapSheets.sheets.length > 0) {
                //     this.map.tiles.sheetNamesList.remove(this);
                //     this.mapSheets.sheets.splice(0, this.mapSheets.sheets.length);
                // }
                
                // Удалим классификатор
                if (this.map.classifiers) {
                    this.map.classifiers.removeByLayer(this);
                }
                
                // Удалим фильтр
                if (this._filter) {
                    this._filter.destroy();
                    this._filter = null;
                }
                
                $(this.map.eventPane).trigger({ type: 'layerlistchanged', maplayer: { 'id': this.xId, 'act': 'remove' } });
                
                return;
            },
            
            onReset: function() {
            },
            
            /**
             * Получить ошибочное изображение
             * @method getErrorSrc
             */
            getErrorSrc: function() {
                return GWTK.imgEmpty;
            },
            
            /**
             * Загрузить рисунок
             * @method _preloadImage
             */
            _preloadImage: function() {
                if (!this._image)
                    return;
                this._image.src = this.buildGetMap();
                
                $(this._image).one('load', function(e) {
                    this._image._rid = +new Date();
                    if (!this.visible) {
                        return;
                    }
                    $(this.map.eventPane).trigger({ type: 'refreshmap', 'cmd': 'draw' });
                }.bind(this));
            },
            
            /**
             * Установить параметры слоя
             * @method setOptions
             */
            setOptions: function(param) {
                if (!this.map || !this.options) return;
                if (param) this.options = param;
                
                if (!this.options.url || this.options.url.length == 0)
                    return;
                
                this.server = GWTK.Util.getServerUrl(this.options.url);
                
                var urlparam = GWTK.Util.getParamsFromURL(this.options.url);
                if (!urlparam['service']) return;
                urlparam['service'] = urlparam['service'].toLowerCase();
                if (urlparam['service'] == "wms")
                    this.wms = true;
                else this.wms = false;
                
                if (!this.wms) return;
                
                if (!this.options.legend) {
                    this.options.legend = "";
                }
                
                this.id = urlparam["layers"];
                this.idLayer = decodeURIComponent(this.id);
                
                if (urlparam['format']) {
                    this.format = urlparam['format'];
                }
                
                if (urlparam['typenames']) {
                    this.typeNames = urlparam['typenames'];
                }
                if (urlparam['codelist']) {
                    if (urlparam['codelist'].length > 0) {
                        this.codeList = urlparam['codelist'];
                        this.codeArray = this.codeList.split(',');
                    }
                }
                
                this.xId = this.options.id;
                this.alias = this.options.alias;
                
                if (this.options.additionalInfo !== undefined) {
                    this.additionalInfo = this.options.additionalInfo;
                }
                
                this.selectObject = this.options.selectObject;
                this.selectsearch = this.options.selectsearch;               // возможность выделения найденных объектов карты
                this.keysTextSearch = this.options.keyssearchbyname;
                
                if (this.options.hidden) {
                    this.visible = false;
                }
                
                if (!this.options.minzoomview) {
                    this.options.minzoomview = 2;
                }
                
                if (!this.options.maxzoomview) {
                    this.options.maxzoomview = 23;
                }
                
                if (typeof this.options.norpc != 'undefined') {
                    this.options.norpc = parseInt(this.options.norpc);
                }else{
                    this.options.norpc = 0;
                }
                
                if (this.options.bbox && this.options.bbox.length == 4) {
                    var l1 = parseFloat(this.options.bbox[1]) - 180.,
                        l2 = parseFloat(this.options.bbox[3]) - 180.;
                    //if (l1 > 180.0 || l2 > 180.0){
                    if (l1 > this.DELTA_BOUNDS || l2 > this.DELTA_BOUNDS) {
                        this._bounds360 = true;
                        var geoPoint = new GeoPoint(this.options.bbox[3], -this.options.bbox[2], 0, this.map.ProjectionId);
                        var coord = geoPoint.toMapPoint();
                        this._maxPlaneX = coord.x;
                    }
                }
                
                // var arr = GWTK.version.split('.');
                // arr.pop();
                // var check_ver = parseFloat(arr.join('.'));
                // if (check_ver < 5.9) {
                //     this.options.watch = 1;
                // }
                
                this.setOpacity(this.initOpacity());
            },
            
            /**
             * Установить смещение местной системы координат
             * @method setLocalCoordinateSystemOriginOffset
             */
            setLocalCoordinateSystemOriginOffset: function() {
                
                if (typeof this.options.lcs === 'undefined') {
                    return;
                }
                if (!this.options.lcs.hor && !this.options.lcs.ver) {
                    return;
                }
                try {
                    this.options.lcs.hor = parseFloat(this.options.lcs.hor);
                    this.options.lcs.ver = parseFloat(this.options.lcs.ver);
                } catch (e) {
                    this.options.lcs = {};
                }
                return;
            },
            
            /**
             * Запросить смещение местной системы координат в метрах
             * @method getLocalCoordinateSystemOriginOffset
             * @returns {Object} {"hor":число, "ver":число} или `false` при ошибке
             */
            getLocalCoordinateSystemOriginOffset: function() {
                if (typeof this.options.lcs === 'undefined' || $.isEmptyObject(this.options.lcs)) {
                    return false;
                }
                if (!this.options.lcs.hor && !this.options.lcs.ver) {
                    return false;
                }
                return this.options.lcs;
            },
            
            /**
             * Использовать xmlRpc протокол для запросов
             * @method useXmlRpc
             * При options.norpc = 1 не используются xmlRpc запросы
             */
            useXmlRpc: function() {
                if (typeof this.options.norpc != 'undefined' && this.options.norpc == 1) {
                    return false;
                }
                return true;
            },
            
            /**
             * Минимальный масштаб видимости слоя
             * @method minZoomView
             * @returns {Number} options.minzoomview или -1
             */
            minZoomView: function() {
                if (!this.options || !this.options.minzoomview) return 2;
                return this.options.minzoomview;
            },
            
            /**
             * Максимальный масштаб видимости слоя
             * @method maxZoomView
             * @returns {Number} options.maxzoomview или -1
             */
            maxZoomView: function() {
                if (!this.options || this.options.maxzoomview == null ||
                    this.options.maxzoomview == undefined) return 23;
                return this.options.maxzoomview;
            },
            
            /**
             * Проверить отображение слоя по границам видимости
             * @method checkViewZoom
             * @returns {Boolean} `true`- отображать
             */
            checkViewZoom: function() {
                if (this.maxZoomView() == this.minZoomView()) {
                    if (this.map.options.tilematrix == this.maxZoomView())
                        return true;
                    else
                        return false;
                }
                if (this.map.options.tilematrix <= this.maxZoomView() && this.map.options.tilematrix >= this.minZoomView()) {
                    return true;
                }
                return false;
            },
            
            /**
             * Установить фильтр объектов для рисунка по gmlid
             * @method setGmlList
             * @param gmllist {String} список идентификаторов объектов через запятую
             * (при установленном фильтре объектов в рисунке отображаются только эти объекты)
             */
            setGmlList: function(gmllist) {
                if (typeof gmllist !== 'string') {
                    this.clearGmlList();
                    return false;
                }
                this.idList = gmllist;      // !!!!!!!!!!!!?
                if (this._filter)
                    this._filter.setIdList(gmllist);
                return true;
            },
            
            /**
             * Сбросить фильтр объектов для рисунка
             * @method setGmlList
             */
            clearGmlList: function() {
                this.idList = false;
                if (this._filter)
                    this._filter.idList = false;
            },

        /**
        * Установить фильтр выделения объектов в рисунке
        * @method setLayerMarkFilter
        * @param idlist { string } список идентификаторов объектов
        * @return { string } список идентификаторов объектов
        */
         setLayerMarkFilter: function( idlist ) {
            if ( typeof idlist !== 'string' || idlist.length == 0) {
                return;
            }
            this.paintSelectList = idlist;
            return this.paintSelectList; 
        },

        /**
         * Сбросить фильтр выделения объектов в рисунке
         * @method clearLayerMarkFilter
         */
        clearLayerMarkFilter: function() {
            this.paintSelectList = '';
        },
        
        /**
         * Проверить наличие фильтра выделения объектов
         * @method isLayerMarkFilter
         * @return {boolean} `true` - фильтр установлен
         */
        isLayerMarkFilter: function() {
            return !(!this.paintSelectList || this.paintSelectList.length == 0);
        },

        /**
         * Получить параметры стиля выделения объектов
         * @method getMarkedStyleParam
         * @return { string } 
         */
        getMarkedStyleParam: function() {
            if ( !this.paintSelectList || this.paintSelectList.length == 0) {
                return '';
            }
            return ( 'Color=' + this.map.getLineColorMarkedObjects(true) + 
                    '&PaintSelectList=' + this.paintSelectList );    
        },

            
            /**
             * Проверить необходимость запроса изображения по частям
             * @method isGetMapByParts
             * @returns {Boolean} `true`- выводить рисунок частями
             */
            isGetMapByParts: function() {
                if (!this.map.Translate.IsGeoSupported || this.map.tileMatrix.Ogc.NormalFrame.min.y > -180. ||
                    this.map.tileMatrix.Ogc.NormalFrame.max.y < 180.)
                    return false;
                
                // проверить по габаритам
                var matrix = this.map.tileMatrix.getTileMatrixSize(this.map.getZoom());
                if (this.map.getWindowSize()[0] >= matrix.y) {                  // размер окна больше ширины матрицы
                    return true;
                }
                // проверить по координатам
                var bbox_geo = this.map.getMapGeoBounds();
                // геодезии нет
                if (!bbox_geo) {
                    return false;
                }
                
                if (bbox_geo.min.y >= 0 && bbox_geo.max.y < 0) {
                    return true;
                }
                if (bbox_geo.min.y < 0) {
                    if (this._bounds360) {
                        var sw = bbox_geo.min.y + 360.;
                        if (sw < this.options.bbox[3])
                            return true;
                    }
                }
                if (bbox_geo.max.y < 0 && bbox_geo.min.y < 0) {
                    if (bbox_geo.min.y > bbox_geo.max.y) {
                        return true;
                    }
                }
                if (bbox_geo.max.y > 0 && bbox_geo.min.y > 0) {
                    if (bbox_geo.max.y < bbox_geo.min.y) {
                        return true;
                    }
                }
                return false;
            },
            
            /**
             * Получить параметры запроса рисунка частями
             * @method _getBBox2Param
             * @protected
             * @param bbox {{ "min": [], "max": [] }} область рисования
             * @returns {JSON} {src:src, width:wh[0], string_bbox:sbbox}
             */
            _getBBox2Param: function(bbox) {
                if (!this.isGetMapByParts(bbox)) {
                    return {};
                }
                var wh = this.map.getWindowSize(),
                    w = wh[0],                                                     // ширина окна
                    src = this.options.url,
                    bbox2 = { "min": [], "max": [] }, minX = -180, minPlane,
                    sbbox = "",
                    matrix = this.map.Translate.getTileMatix(),
                    matrixSize = matrix.getTileSize(),
                    matrixMinX = matrix.Ogc.getPointX(),
                    matrixMaxX = Math.abs(matrixMinX),
                    ind = 0,
                    metertopix = matrix.getPixelSpan(this.map.options.tilematrix);
                if (this.map.Translate.EpsgCode === 54003) {
                    ind = 1;
                }
                if (this._bounds360 && this.bounds.max[0] !== undefined) {
                    minX = this.options.bbox[3] - 360.;                           // начало координат по габаритам
                    var xy = new GeoPoint(minX, 0, 0, this.map.ProjectionId).toMapPoint();
                    minPlane = xy.x;
                }
                if (w < matrixSize) {              // ширина окна < ширины матрицы
                    if (bbox.max[ind] < 0 || (bbox.max[ind] < bbox.min[ind]) || (bbox.min[ind] < 0 && bbox.max[ind] > 0)) {
                        bbox2.max = bbox.max.slice(0);
                        bbox2.min = bbox.min.slice(0);
                        bbox2.min[ind] = matrixMinX;
                        bbox.max[ind] = matrixMaxX;
                        if (minX !== -180) {
                            bbox.max[ind] = this.bounds.max[0];
                            bbox2.min[ind] = minPlane;
                            if (bbox.min[ind] < minPlane && bbox.min[ind] > matrixMinX) {
                                bbox.min[ind] = matrixMaxX + bbox.min[ind] - matrixMinX;
                            }
                        }
                        src += "&bbox2=" + bbox2.min.toString() + "," + bbox2.max.toString() + "&parts=2";
                        sbbox = bbox.min.toString() + "," + bbox.max.toString();
                        var ww2 = (bbox.max[ind] - bbox.min[ind]) / metertopix;     // ширина рисунка до 180
                        wh[0] = parseInt(ww2 + 0.5);
                    }
                }else{
                    wh[0] = matrixSize;                                 // ширина матрицы в текущем zoom < ширины окна
                    bbox.min[ind] = matrixMinX;
                    bbox.max[ind] = matrixMaxX;
                    if (this._bounds360 && this.bounds.max[0] !== undefined) {
                        bbox.max[ind] = this.bounds.max[0];
                        bbox.min[ind] = minPlane;
                    }
                    bbox2.max = bbox.max.clone();
                    var points = {};
                    //TODO:???
                    // bbox2.min = GWTK.tileView.geo2pixelOffsetMap(this.map, [56., minX], points); // смещение в окне карты
                    bbox2.min = this.map.geoToPixel(new GeoPoint(minX, 56., 0, this.map.ProjectionId)); // смещение в окне карты
                    bbox2.min = [bbox2.min.x, bbox2.min.y];
                    src += "&parts=1&bbox2=" + bbox2.min.toString() + "," + bbox2.max.toString();
                    sbbox = bbox.min.toString() + "," + bbox.max.toString();
                }
                src += "&w=" + w;                                                         // ширина окна карты
                
                return { src: src, width: wh[0], string_bbox: sbbox };
            },
            
            /**
             * Подготовить координаты для посылки в запрос
             * @param {Bounds} bbox
             */
            prepareBbox: function(bbox) {
                if (this.map.Translate.isGeoSys()) {
                    bbox.fromBounds(this.map.tileMatrix.getGeoDegreeFrameFromPlaneFrame(bbox));
                }
            },
            
            /**
             * Формировать url запроса getmap
             * @method buildGetMap
             * @param idlayers {string} список id слоев через запятую
             * @returns {String} строка запроса. Если слой невидим, возвращает пустую строку
             */
            buildGetMap: function(idlayers) {
                if (!idlayers) {
                    if (!this.map || !this.options) return;
                    if (!this.visible || !this.checkViewZoom()) return '';
                }
                
                if (this.options.token && !this.map.getToken()) {
                    return '';
                }
                
                this.setBounds();
                
                var bbox = this.map.getWindowBounds();                      // bbox рисунка
                
                if (this.getLocalCoordinateSystemOriginOffset()) {
                    bbox.min.x -= this.options.lcs.hor;
                    bbox.max.x -= this.options.lcs.hor;
                    bbox.min.y -= this.options.lcs.ver;
                    bbox.max.y -= this.options.lcs.ver;
                }
                var sbbox = '',
                    wh = this.map.getSize(),                                   // размер окна
                    src = this.options.url.slice(0, this.options.url.length);  // url
                
                if (wh.x == 0 || wh.y == 0)
                    return "";
                
                if (!this.checkBounds(bbox) && (!idlayers || idlayers == this.idLayer))
                    return "";
                
                var parts = this._getBBox2Param(bbox);          // параметры второй части рисунка (при захвате 180,-180)
                
                this.prepareBbox(bbox);
                //if (!$.isEmptyObject(parts)){
                if (parts.hasOwnProperty('src')) {
                    wh.x = parts.width;                         // ширина рисунка
                    if (parts.string_bbox.length > 0)
                        sbbox = parts.string_bbox;
                    src = parts.src;
                }else{
                    sbbox = bbox.min.toOrigin().slice(0, 2).join(',') + ',' + bbox.max.toOrigin().slice(0, 2).join(',');
                }
                
                src = this.setKeysFilterUrl(src);
                
                if (idlayers && idlayers !== this.idLayer) {
                    src = src.replace(this.idLayer, idlayers);
                }
                
                src = src.replace(/%bbox/, sbbox);
                src = src.replace(/%w/, wh.x);
                src = src.replace(/%h/, wh.y);
                src = src.replace(/%crs/, encodeURIComponent(this.map.getCrsString()));
                
                var drawstyle = this.getMarkedStyleParam();
                if ( drawstyle.length > 0) {
                    src += '&' + drawstyle;
                }
                if (typeof this.idList == 'string' && this.idList.length > 0) {
                    src += '&idlist=' + this.idList;
                }

                src = src.replace(/%size/, wh.x + ',' + wh.y);
                
                return src;
            },
            
            /**
             * Формировать параметры rest-запроса getImage
             * @method buildGetImage
             * @param idlayers {string} список id слоев через запятую
             * @returns {String} ссылка запроса. Если слой невидим возвращает пустую строку
             */
            buildGetImage: function(idlayers, skipfilter) {
                
                var url = this.buildGetMap(idlayers);
                
                if (url.length == 0) return [{ 'srv': url }];
                
                var urlparam = GWTK.Util.getParamsFromURL(url),
                    parms = '';
                if (skipfilter) {
                    delete urlparam.typenames;
                    delete urlparam.codelist;
                    delete urlparam.keylist;
                    delete urlparam.idlist;
                }else{
                    if (urlparam.keylist && urlparam.keylist.length > 0) {
                        delete urlparam.typenames;
                        delete urlparam.codelist;
                    }
                }
                for (var key in urlparam) {
                    var val = urlparam[key];
                    if (key == 'service' || key == 'request' || key == 'version' ||
                        key == 'bbox2' || key == 'w') {
                        continue;
                    }
                    if (typeof val !== 'undefined') {
                        parms += "&" + key + "=" + val;
                    }
                }
                var resturl = this._urlParam.server + '?RESTMETHOD=GETIMAGE',
                    srv = resturl + parms;
                parms = '';
                
                if (urlparam['parts'] && urlparam['parts'] == '2') {                 // параметры для второй части рисунка
                    var w = parseFloat(urlparam['w']);
                    w = w - parseFloat(urlparam['width']);
                    for (var key in urlparam) {
                        var val = urlparam[key];
                        if (key == 'service' || key == 'request' || key == 'version' ||
                            key == 'idlist' || key == 'width' || key == 'bbox' || key == 'bbox2') {
                            continue;
                        }
                        if (typeof val !== 'undefined')
                            parms += "&" + key + "=" + val;
                    }
                    // запрос второй части рисунка, изменяем bbox и ширину
                    parms += '&bbox=' + urlparam['bbox2'] + '&width=' + w;
                    return [
                        { 'srv': srv, 'parm': '' },
                        {
                            'srv': resturl + parms,
                            'parm': '&width=' + urlparam['width'] + '&height=' + urlparam['height'] +
                                '&bbox2=' + urlparam['bbox2'] +
                                '&w=' + urlparam['w'] + '&parts=2'
                        }
                    ];
                }else if (urlparam['parts'] && urlparam['parts'] == '1') {
                    parms += '&bbox2=' + urlparam['bbox2'] + '&width=' + urlparam['width'] + '&parts=1';
                }
                
                return [{ 'srv': srv, 'parm': parms }];
            },
            
            /**
             * Получить текущий фильтр объектов
             * @method clearKeysFilter
             */
            getFilter: function() {
                if (!this._filter) {
                    return false;
                }
                return this._filter.curretnFilter();
            },
            
            /**
             * Очистить фильтр объектов
             * @method clearKeysFilter
             */
            clearKeysFilter: function() {
                if (!this._filter) {
                    return;
                }
                this._filter.clear();
            },
            
            /**
             * Установить фильтр объектов по ключам rsc
             * @method setKeysFilter
             * @param filter {array/string} список строк ключей объектов
             * @returns {Array} массив строк
             */
            setKeysFilter: function(filter) {
                if (!filter || !this._filter) return;
                this._filter.setKeysArray(filter);
                $(this.map.eventPane).trigger({ 'type': 'filterchanged', 'layer': this });
                this.wmsManager._setStoredFilterValue();
                return;
            },
            
            /**
             * Получить текущий фильтр объектов по ключам
             * @method getKeysFilter
             * @returns {Array} массив строк
             */
            getKeysFilter: function() {
                return this._filter.getKeyList();
            },
            
            getKeysArray: function() {
                return this._filter.getKeysArray();
            },
            
            /**
             * Получить текущий фильтр объектов в виде строки
             * @method getKeyListParamString
             * @returns {Object} {"keylist": строка, ключи объектов через запятую}
             */
            getKeyListParamString: function() {
                if (!this._filter) return '';
                var keys = this._filter.getKeyList();
                if (keys === undefined)
                    return '';
                return { "keylist": keys };
            },
            
            /**
             * Установить параметр список ключей в url
             * @method setKeysFilterUrl
             * @param url {string} строка запроса изображения
             * @returns {string} строка запроса изображения
             */
            setKeysFilterUrl: function(url) {
                var keys = this.getKeyListParamString();
                if (typeof keys != 'object') return url;
                
                var url = url,
                    param = GWTK.Util.getParamsFromURL(url);
                param["keylist"] = keys.keylist;
                url = this._urlParam.server + '?' + GWTK.Util.urlParamString(param);
                return url;
            },
            
            /**
             * Обновить слой
             * @method update
             */
            update: function() {
                var list = [];
                if (this.visible) {
                    list.push(this.xId);
                }
                this.map.tiles.wmsManager.wmsDrawing(list);
            },
            
            /**
             * Получить id слоя на сервисе
             * @method _idLayerXml
             * @returns {string} id слоя на сервисе (для Xml-запроса без EncodeUri)
             */
            _idLayerXml: function() {
                return GWTK.Util.decodeIdLayer(this.idLayer);
            },
            
            /**
             * Регенерировать слой
             * @method refresh
             */
            refresh: function() { /*this.update();*/
            },
            
            /**
             * Показать слой
             * @method show
             */
            show: function() {
                if (this.visible) {
                    return;
                }
                this.visible = true;
                if (this._image) {
                    this._image.style.display = '';
                }
                this.update();
                return;
            },
            
            /**
             * Скрыть слой
             * @method hide
             */
            hide: function(notshow) {
                if (!this.visible) {
                    return;
                }
                this.visible = false;
                if (!this._image) {
                    return;
                }
                this._image.style.display = 'none';
                if (notshow || this.map.options.mergewmslayers) {
                    if (!this._bounds360) {
                        this.update();
                        return;
                    }
                }
                this.map.tiles.drawMapImage(true, false, true);
            },
            
            /**
             * Получить признак видимости
             * @method getVisibility
             * @returns {boolean} true/false, видимый/нет
             */
            getVisibility: function() {
                return this.visible;
            },
            
            /**
             * Получить признак слежения за слоем
             * @method getWatch
             * @returns {boolean} true/false, отслеживаемый/нет
             */
            getWatch: function() {
                var watch = 0;
                if (this.getVisibility() && this.checkViewZoom()) {
                    if (typeof this.options.watch !== 'undefined') {
                        watch = this.options.watch;
                    }
                }
                return (watch == 1);
            },
            
            /**
             * Деструктор
             * @method destroy
             */
            destroy: function() {
                this._clearObjectURL();
                return;
            },
            
            setShift: function(dx, dy) {
            },
            
            /**
             * Проверить возможность поиска по названию для слоя
             * @method isTextSearch
             * @returns {Boolean} true/false, возможен/нет
             */
            isTextSearch: function() {
                if (!this.getVisibility()) return false;
                if (GWTK.Util.isArray(this.keysTextSearch) && this.keysTextSearch.length > 0 && this.keysTextSearch[0].length > 0)
                    return true;
                return false;
            },
            
            /**
             * Установить габариты слоя
             * @method setBounds
             */
            setBounds: function() {
                this.bounds = null;
                if (this.options == null || this.options == undefined)
                    return;
                if ("bbox" in this.options == false || this.options.bbox.length != 4)
                    return;
                
                this.bounds = { 'min': [], 'max': [] };
                
                // нижний угол
                
                var plane = new GeoPoint(this.options.bbox[1], this.options.bbox[0], 0, this.map.ProjectionId).toMapPoint();
                this.bounds.min = [plane.y, plane.x];
                
                // верхний угол
                plane = new GeoPoint(this.options.bbox[3], this.options.bbox[2], 0, this.map.ProjectionId).toMapPoint();
                this.bounds.max = [plane.y, plane.x];
            },
            
            /**
             * Проверить габариты слоя
             * @method checkBounds
             */
            checkBounds: function(bounds) {
                if (this.bounds == null || this._bounds360) return true;
                
                if (bounds.max.y < this.bounds.min.y || bounds.min.y > this.bounds.max.y ||
                    bounds.max.x < this.bounds.min.x || bounds.min.x > this.bounds.max.x)
                    return false;
                return true;
            },
            
            /**
             * Установить css непрозрачность изображения
             * @method setOpacity
             * @param value {Number} css значение прозрачности,
             * число из диапазона [0.0; 1.0], 0 - полная прозрачность
             */
            setOpacity: function(value, show) {
                if (isNaN(value) || !this.layerContainer || this.options.duty) {
                    return;
                }
                if (value > 1) value = 1;
                this.layerContainer.style.opacity = value;
                if (show) {
                    $(this.map.eventPane).trigger({ 'type': 'refreshmap', 'cmd': 'draw' });
                }
            },
            
            /**
             * Инициализировать параметры непрозрачности изображения
             * @method initOpacity
             * @param opacity {Number} значение непрозрачности в % - от 0 до 100
             * @returns {Number} css значение непрозрачности
             * @public
             */
            initOpacity: function(opacity) {
                if (!this.options) {
                    return;
                }
                
                //if (!$.isNumeric(this.options.opacityValue)) { this.options.opacityValue = 100; }
                if (typeof this.options.opacityValue == 'undefined' || isNaN(this.options.opacityValue)) {
                    this.options.opacityValue = 100;
                }
                
                //if ($.isNumeric(opacity)) {
                if (!isNaN(opacity)) {
                    var new_opacity = parseInt(opacity);
                    if (new_opacity > 100) {
                        new_opacity = 100;
                    }else if (new_opacity < 0) {
                        new_opacity = 0;
                    }
                    this.options.opacityValue = new_opacity;
                }
                
                return this.getOpacityCss();
            },
            
            /**
             * Получить css непрозрачность по параметрам
             * @method getOpacityCss
             * @param opacity {Number} значение непрозрачности в % - от 0 до 100
             * @returns {Number} css значение непрозрачности
             * @public
             */
            getOpacityCss: function() {
                if (!this.options) return '';
                if (typeof this.options.opacityValue === 'undefined') {
                    this.options.opacityValue = 100;
                }
                
                return ((Number(parseFloat(this.options.opacityValue) / 100.0)).toFixed(1));
            },
            
            /**
             * Наличие класса фильтра
             * @method hasFilter
             * @returns {Boolean} `true` - имеется
             * @public
             */
            hasFilter: function() {
                if (!this._filter) return false;
                return true;
            },
            
            /**
             * Наличие легенды
             * @method hasLegend
             * @returns {Boolean} `true` - имеется
             * @public
             */
            hasLegend: function() {
                var has = false;
                this.options.legend ? has = (this.options.legend.length > 0) : has = false;
                return has;
            },
            
            /**
             * Получить значение фильтра для хранения
             * @method getStoredFilter
             * @returns {String} значение фильтра для хранения
             * @public
             */
            getStoredFilter: function() {
                if (!this.hasLegend()) return '';
                var sf = { 'xid': this.xId, 'param': this._filter.getStoredFilterParameter() };
                if (sf.param.length == 0) return '';
                return JSON.stringify(sf);
            },
            
            getLayerDataState: function() {
                return this.dataState;
            },
            
            setLayerDataState: function(statekey) {
                if (typeof statekey == 'undefined') {
                    return;
                }
                this.dataState = statekey;
            },
            
            checkLayerDataState: function(statekey) {
                return (this.dataState === statekey);
            },
            
            /*******************************************
             ****  Методы получения изображений     ****
             *******************************************/
            /**
             * Создать объект запросов
             * @method createXhr
             * @returns {Object} XMLHttpRequest
             */
            createXhr: function() {
                var XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : window.XDomainRequest;
                
                var xhr = new XHR();
                
                xhr.context = this;
                
                // установить тип данных ответа
                xhr.onloadstart = function() {
                    this.responseType = "blob";
                }
                // изображение загружено
                xhr.onload = function() {
                    this.context._onLoad(this);
                };
                
                // обработать ошибку
                xhr.onerror = function() {
                    this.context._onError(this);
                };
                
                return xhr;
                
            },
            
            /**
             * Запросить изображение
             * @method requestImage
             * @param param {GWTK.WmsRequestDescriptor} параметры запроса рисунка
             * @public
             */
            requestImage: function(param, rid) {
                if (param.xdata2 || param.url.indexOf('part') !== -1) {
                    if (this._compositeDrawing == null) {
                        this._compositeDrawing = new GWTK.CompositeDrawing(this);
                    }
                    this._compositeDrawing.requestImage(param, rid);
                    return;
                }
                var xhr = this.createXhr();
                xhr._rid = rid;                  // id текущего запроса
                if (this._image._xhr) {
                    this._image._xhr.abort();
                    this._image._rid = undefined;
                    delete this._image._xhr;
                }
                this._image._xhr = xhr;
                this._image.classList.remove('img-loaded');
                
                if (param.xdata && param.xdata.length > 0) {
                    xhr.open('POST', param.url, true);
                    this._setRequestHeaders(xhr, param.url);
                    xhr.send(param.xdata);
                }else{
                    xhr.open('GET', param.url, true);
                    this._setRequestHeaders(xhr, param.url);
                    xhr.send();                               // 19/02/21
                }
            },
            
            /**
             * Получить флаг авторизации
             * @method _getCredentialsFlag
             * @param url {string} адрес
             * @returns {boolean}
             * @private
             */
            _getCredentialsFlag: function(url) {
                var flag = this.map.authTypeServer(url) || this.map.authTypeExternal(url);
                return flag;
            },
            
            /**
             * Установить заголовок запроса
             * @method _setRequestHeaders
             * @param xhr {XMLHttpRequest} объект запроса
             * @param url {string} адрес
             * @private
             */
            _setRequestHeaders: function(xhr, url) {
                if (!xhr || !url) {
                    return;
                }
                if (this._getCredentialsFlag(url)) {
                    xhr.withCredentials = true;
                }
                if (this.options.token) {
                    xhr.setRequestHeader(GWTK.AUTH_TOKEN, this.map.getToken());
                }
            },
            
            /**
             * Анализ ошибки
             * @method _onError
             * @param xhr {XMLHttpRequest} объект запроса
             * @private
             */
            _onError: function(xhr) {
                if (this._image) {
                    this._image.onload = GWTK.Util.falseFunction;
                    this._image.src = GWTK.imgEmpty;
                    if (xhr._rid == this.wmsManager._lastdraw) {
                        this._setImageReady(xhr);
                        this.wmsManager._renderLayers(this._image);
                    }
                }
            },
            
            /**
             * Инициализировать элемент img
             * @method _initImageElement
             * @private
             */
            _initImageElement: function() {
                if (this._image) {
                    this._image.onload = GWTK.Util.falseFunction;
                    this._image.src = GWTK.imgEmpty;
                }
            },
            
            /**
             * Прервать запрос
             * @method _cancelRequest
             * @private
             */
            _cancelRequest: function() {
                if (this._image._xhr) {
                    this._image._xhr.abort();
                    this._image._xhr = undefined;
                }
                this._image._rid = undefined;
                this._image.loaded = +new Date();
            },
            
            /**
             * Установить признак готовности изображения
             * @method _setImageReady
             * @private
             */
            _setImageReady: function(xhr) {
                if (!xhr || !xhr._rid) {
                    return;
                }
                this._image.loaded = +new Date();
                this._image._rid = xhr._rid;
            },
            
            /**
             * Анализ ответа
             * @method _onLoad
             * @param xhr {XMLHttpRequest} объект запроса
             * @private
             */
            _onLoad: function(xhr) {
                if (xhr.response && xhr.response.type.search('image') > -1) {
                    this._fetchData(xhr);
                }else{
                    this._onError(xhr);
                }
            },
            
            /**
             * Получить данные ответа
             * @method _fetchData
             * @param xhr {XMLHttpRequest} объект запроса
             * @private
             */
            _fetchData: function(xhr) {
                if (!xhr || xhr.status != 200 || !this.wmsManager._testUpdateTime(xhr._rid)) {
                    this._onError(xhr);
                }else{
                    if (xhr._rid == xhr.context.wmsManager._lastdraw) {
                        var urlCreator = window.URL || window.webkitURL;
                        this._setImageUrl(xhr, urlCreator.createObjectURL(xhr.response));
                    }
                }
            },
            
            /**
             * Нарисовать в img
             * @method _setImageUrl
             * @param xhr {XMLHttpRequest} объект запроса
             * @param src {string} рисунок
             * @private
             */
            _setImageUrl: function(xhr, src) {
                if (!src) {
                    this._onError(xhr);
                    return;
                }
                this._revoked.push(this._image.src);
                this._image.onload = this._onLoadImage.bind(this);
                this._setImageReady(xhr);
                this._image.src = src;
            },
            
            /**
             * Вывести изображение
             * @method _onLoadImage
             * @private
             */
            _onLoadImage: function() {
                this._image.classList.add('img-loaded');
                if (this._image._rid == this.wmsManager._lastdraw) {
                    this.wmsManager._renderLayers(this._image);
                }
            },
            
            /**
             * Очистить старые изображения
             * @method _clearObjectURL
             * @private
             */
            _clearObjectURL: function() {
                var urlCreator = window.URL || window.webkitURL;
                while (this._revoked.length > 0) {
                    urlCreator.revokeObjectURL(this._revoked[0]);
                    this._revoked.splice(0, 1);
                }
            },
            
            async getLegend() {
                try {
                    const legend = await this.legendInstance.getLegend();
                    $(this.map.eventPane).trigger({ type: 'loadclassifier', legend: this.legendInstance, layer: this });
                    return legend;
                } catch (error) {
                    $(this.map.eventPane).trigger({ type: 'loadclassifierError', layer: this });
                    throw error;
                }
            },
            
            get serviceUrl() {
                return this.server;
            },
            
            cancelRequests() {
                this.legendInstance.cancelRequest();
            }
            
        };
    
    GWTK.wmslayer = function(map, options) {
        return new GWTK.WmsLayer(map, options);
    };
    
    
    /********************************* Нефедьева О.А. **** 23/10/20 ****
     *                                                                  *
     *              Copyright (c) PANORAMA Group 1991-2020              *
     *                       All Rights Reserved                        *
     *                                                                  *
     ********************************************************************
     *                                                                  *
     *              Управление фрагментами wms-рисунков                 *
     *                                                                  *
     *******************************************************************/
    /**
     * class GWTK.CompositeDrawing
     * @constructor GWTK.CompositeDrawing
     * @param wmslayer {GWTK.WmsLayer}
     * @public
     */
    GWTK.CompositeDrawing = function(wmslayer) {
        if (!(wmslayer instanceof GWTK.WmsLayer)) {
            return;
        }
        this._layer = wmslayer;
        this._queue = {
            'xhr1': { el: null, url: '', img: null },
            'xhr2': { el: null, url: '', img: null },
            'param': {}
        };
    }
    
    GWTK.CompositeDrawing.prototype =
        {
            /**
             * Запросить фрагменты изображения
             * @method requestImage
             * @param param {GWTK.WmsRequestDescriptor} параметры запроса фрагментов рисунка
             * @public
             */
            requestImage: function(param, rid) {
                this._layer._image.classList.remove('img-loaded');
                this._layer._image._rid = undefined;
                this._clearQueue();
                this._queue.param = GWTK.Util.extend({}, param);
                this._addToQueue('xhr1');
                if (param.xdata2 && param.xdata2.length > 0) {
                    this._addToQueue('xhr2');
                }else{
                    this._queue.param.xdata2 = undefined;
                }
                
                this._postRequest(rid);
            },
            
            /**
             * Отправить запрос
             * @method _postRequest
             * @returns {String} значение фильтра для хранения
             * @private
             */
            _postRequest: function(rid) {
                for (var key in this._queue) {
                    if (this._queue[key].el) {
                        this._queue[key].el._rid = rid;
                        this._queue[key].el.open('POST', this._queue.param.url, true);
                        this._layer._setRequestHeaders(this._queue[key].el);
                        if (key == 'xhr2')
                            this._queue[key].el.send(this._queue.param.xdata2);
                        else
                            this._queue[key].el.send(this._queue.param.xdata);
                    }
                }
            },
            
            /**
             * Получить данные ответа
             * @method _fetchData
             * @param xhr {XMLHttpRequest} объект запроса
             * @param name {string} имя элемента
             * @private
             */
            _fetchData: function(xhr, name) {
                if (xhr.status !== 200 ||
                    (xhr.response && xhr.response.type.search('image') == -1)) {
                    this._onError(xhr, name);
                    return;
                }
                if (xhr._rid !== this._layer.wmsManager._lastdraw) {
                    this._onError(xhr, name);
                    return;
                }
                var urlCreator = window.URL || window.webkitURL;
                this._queue[name].url = urlCreator.createObjectURL(xhr.response);
                if (this._areAllReady()) {
                    this._employ();
                }
            },
            
            /**
             * Анализ ошибки
             * @method _onError
             * @param xhr {XMLHttpRequest} объект запроса
             * @param name {string} имя элемента
             * @private
             */
            _onError: function(xhr, name) {
                this._queue[name].url = 'error';
                this._queue[name].img = null;
                if (this._areAllReady()) {
                    this._employ(xhr);
                }
            },
            
            /**
             * Анализ готовности ответа
             * @method _areAllReady
             * @returns {boolean} `true` - данные получены, `false` - нет
             * @private
             */
            _areAllReady: function() {
                if (this._queue.xhr1.el == null && this._queue.xhr2.el == null) {
                    return false;
                }
                if (this._queue.xhr1.el && this._queue.xhr1.url.length == 0) {
                    return false;
                }
                if (this._queue.xhr2.el == null) {
                    return true;
                }else if (this._queue.xhr2.url.length > 0) {
                    return true;
                }
                return false;
            },
            
            /**
             * Выполнить объединение
             * @method _employ
             * @param xhr {XMLHttpRequest} объект запроса
             * @private
             */
            _employ: function(xhr) {
                if (!this._areAllReady()) {
                    return;
                }
                
                var count = 1, i = 1;                          // сколько фрагментов
                var loaded = 0;                                // сколько загружено
                if (this._queue.param.xdata2 && this._queue['xhr2'].url !== 'error') {
                    count = 2;
                }
                
                if (this._queue['xhr1'].url === 'error') {      // что имеем?
                    if (count == 1) {
                        this._layer._onError(xhr);             // ошибка...
                        return;
                    }
                }
                
                while (i <= count) {                            // загружаем рисунки
                    var name = 'xhr' + i.toString();
                    if (this._queue[name].url == 'error') {
                        if (i == count) {
                            this._compose();                    // комбинируем
                            break;
                        }
                    }else{
                        this._queue[name].img = document.createElement('img');
                        var img = this._queue[name].img;
                        img.style.display = 'none';
                        img.src = this._queue[name].url;
                        img.onload = function() {
                            if (i == count) {
                                this._compose();                // комбинируем
                            }
                        }.bind(this);
                    }
                    if (i == count) {
                        break;
                    }
                    i++;
                }
            },
            
            /**
             * Составить общий рисунок из частей
             * @method _compose
             * @private
             */
            _compose: function() {
                if (!this._queue['xhr1'].img && !this._queue['xhr2'].img) {
                    return;
                }
                var dim = this._layer.map.getSize(),
                    w = dim.x, h = dim.y,
                    canvas = document.createElement('canvas'),
                    ctx = canvas.getContext('2d'),
                    param = GWTK.Util.getParamsFromURL(this._queue.param.url),
                    bbox2 = [];
                
                if (this._queue.xhr2.el == null) {                        // изображение (-180, 180) одним рисунком
                    canvas.width = w;
                    canvas.height = h;
                    bbox2 = param['bbox2'].split(',');
                    var w1 = parseInt(param['width']),                    // ширина рисунка (-180, 180)
                        w2 = parseInt(bbox2[0]),                          // piх.x начала матрицы в окне
                        offset_x = w1 - Math.abs(w2);                     // смещение начального фрагмента в окне
                    // начало рисунка в соответствии с bbox2
                    ctx.drawImage(this._queue.xhr1.img, offset_x, 0, w2, h, 0, 0, w2, h);
                    // заполняем все окно изображением матрицы
                    while (w2 < canvas.width) {
                        ctx.drawImage(this._queue.xhr1.img, w2, 0, w1, h);
                        w2 += w1;
                    }
                }else{
                    canvas.width = parseInt(w);                               // комбинируем 2 или рисуем 1
                    canvas.height = parseFloat(param["height"]);
                    var w1 = parseInt(param["width"]);                        // ширина первой части
                    if (this._queue.xhr1.img !== null) {
                        ctx.drawImage(this._queue.xhr1.img, 0, 0, w1, h, 0, 0, w1, h);
                    }
                    if (this._queue.xhr2.img !== null) {
                        w2 = parseFloat(w) - w1;                              // ширина второй части
                        ctx.drawImage(this._queue.xhr2.img, 0, 0, w2, h, w1, 0, w2, h);
                    }
                }
                if (this._layer._image._xhr) {
                    this._layer._image._xhr._rid = this._queue.xhr1.el._rid;
                }
                
                this._layer._setImageUrl(this._queue.xhr1.el, canvas.toDataURL('image/png'));
            },
            
            /**
             * Создать объект запросов
             * @method _createXhr
             * @returns XMLHttpRequest
             * @private
             */
            _createXhr: function() {
                var XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : window.XDomainRequest;
                var xhr = new XHR();
                xhr.onloadstart = function() {
                    this.responseType = "blob";
                }
                return xhr;
            },
            
            /**
             * Добавить в очередь запросов
             * @method _addToQueue
             * @param name {string} имя элемента
             * @returns XMLHttpRequest
             * @private
             */
            _addToQueue: function(name) {
                var context = this;
                this._queue[name].el = this._createXhr();
                var xhr = this._queue[name].el;
                xhr.onload = function() {
                    context._fetchData(this, name);
                };
                xhr.onerror = function() {
                    context._onError(this, name);
                }
                return this._queue[name].el;
            },
            
            /**
             * Очистить очередь запросов
             * @method _clearQueue
             * @private
             */
            _clearQueue: function() {
                for (var key in this._queue) {
                    if (this._queue[key].el) {
                        this._queue[key].el.abort();
                    }
                    this._queue[key].el = null;
                    this._queue[key].url = '';
                    this._queue[key].img = null;
                }
                this._queue.param = {};
            },
            
            /**
             * Установить пользовательскую легенду
             * @method setUserLegend
             * @param legenditems {Array} массив элементов легенды, GWTK.userLayerLegendItem
             * @public
             */
            setUserLegend: function(legenditems) {
                if (!Array.isArray(legenditems) || legenditems.length == 0) {
                    return;
                }
                if (this.userLegendItems) {
                    this.userLegendItems.splice(0, this.userLegendItems.length);
                }
                this.userLegendItems = JSON.parse(JSON.stringify(legenditems));
            }
            
            
            
        }
}