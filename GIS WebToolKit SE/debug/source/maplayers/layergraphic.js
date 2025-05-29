/*************************************** Соколова Т.О. 31/03/21  ****
 *************************************** Нефедьева О.  26/06/19  ****
 *************************************** Полищук Г.В.  14/01/19  ****
 *************************************** Тазин В.      18/08/17  ****
 *************************************** Помозов Е.В.  09/04/21  ****
 *************************************** Патейчук В.К. 19/03/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент локальный слой (карта)                 *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {

    /**
     * Утилиты графического слоя
     */
    GWTK.UtilGraphicLayer =  {

        /**
         * Создание json объекта для отображения данных локального слоя
         * @method createJSONforGraphicLayer
         * @param jsonIn - исходный json-объект
         * @returns {*} - выходной объект = {
         *     json: {},
         *     style: {},
         *     typeField : "objecttype", при отсутствии typeField
         * }
         */
        createJSONforGraphicLayer:function(jsonIn){
            var jsonOut;
            if (jsonIn) {
                if (jsonIn.json) {
                    jsonOut = {json: jsonIn.json};
                }
                else {
                    jsonOut = {json: jsonIn};
                }
                if (!jsonOut.json["type"] || jsonOut.json["type"] != "FeatureCollection") {
                    throw new SyntaxError("JSON type \"FeatureCollection\" required!");
                    return;
                }
            }

            if (!$.isEmptyObject(jsonIn.style) && $.isEmptyObject(jsonIn.style.style)) {
                jsonOut.style = {
                    'typeField': (jsonIn.typeField) ? jsonIn.typeField : 'objecttype',
                    'style':  JSON.parse(JSON.stringify(jsonIn.style)),
                    'defaultStyle': null };
             }
             else {
                jsonOut.style = jsonIn.style;
            }

            delete jsonOut.json.style;
            delete jsonOut.json.typeField;

            return jsonOut;
        },

        /**
         * Очистить и получить json с идентификаторами объектов без идентификатора слоя и добавить стили (классификатор), если они есть
         * @method clearIdJSON
         * @param json
         * @param styles (Object) - {style:{}, typeField:'objecttype'}
         * @returns {json}
         */
        clearIdJSON: function(json, styles) {
            if (!json) return;
            var len, oJson = json;
            if (!oJson.features || (len = oJson.features.length) == 0)
                return;
            var str, from, to, code,
                isstyle = styles && styles['style'] && styles['typeField'] ? true : false,
                newJson = JSON.parse(JSON.stringify(oJson));
            for(var i = 0; i < len; i++){
                if ( newJson.features[i] && newJson.features[i].properties && newJson.features[i].properties.id) {
                    str = newJson.features[i].properties.id;
                    from = str.indexOf('.');
                    if (from < 0) {
                        from = 0;
                    }
                    to = str.length;
                    newJson.features[i].properties.id = str.substring(from + 1, to);

                    // Удалить стили, если они были в loadedCss
                    if (isstyle) {
                        code = newJson.features[i].properties[styles['typeField']];
                        if (code && newJson.features[i].style) {
                            var style = styles['style'][code];
                            if (style){
                                for(var k in style){
                                    if (newJson.features[i].style.hasOwnProperty(k)){
                                        delete newJson.features[i].style[k];
                                    }
                                }
                            }
                        }
                        if (JSON.stringify(newJson.features[i].style) === JSON.stringify({})){
                            delete newJson.features[i].style;
                        }
                    }

                }
            }
            // Добавим стили, если они были
            if (isstyle){
                newJson.style = styles['style'];
                newJson.typeField = styles['typeField'];

            }
            return newJson;
        },

        /**
         * Расширить и получить json с идентификаторами объектов с названием слоя
         * @method expandIdJSON
         * @param json
         * @param layerid (string) - идентификатор слоя
         * @returns {json}
         */
        expandIdJSON: function(json, layerid) {
            if (!json || !layerid)
                return;
            var len, oJson = json;
            if (!oJson.features || (len = oJson.features.length) == 0)
                return;
            var str,
                newJson = JSON.parse(JSON.stringify(oJson));
            for(var i = 0; i < len; i++){
                if ( newJson.features[i] && newJson.features[i].properties && newJson.features[i].properties.id) {
                    str = newJson.features[i].properties.id.split( '.' );
                    if ( str.length > 1 && str[0] == layerid) {
                        continue;
                    }
                    newJson.features[i].properties.id = layerid + '.' + newJson.features[i].properties.id;
                }
            }
            return newJson;
        },

        /**
         * Заполнение списка выбранных объектов для панели выбора объектов
         * @method fillSelectedFeatures
         * @public
         * @param map {GWTK.map} Объект карты
         * @param selectedFeatures { GWTK.selectedFeatures} Объект набора объектов
         */
        fillSelectedFeatures: function (map, selectedFeatures) {
            if (!map && !selectedFeatures)
                return;
            var layers = [];
            // var pane_feature = document.createElement('div'); // контейнер результата
            var allLayers = map["layers"];
            for (var i = 0; i < allLayers.length; i++) {
                // if (allLayers[i] && allLayers[i] instanceof GWTK.graphicLayer && allLayers[i].selectedObjects && allLayers[i].selectedObjects.length > 0) {
                if (allLayers[i] && (allLayers[i] instanceof GWTK.graphicLayer) && allLayers[i].selectedObjects && allLayers[i].selectedObjects.length > 0) {
                    layers.push(allLayers[i].id);
                    for (var j = 0; j < allLayers[i].selectedObjects.length; j++) {
                        if (allLayers[i].selectObject == 1) {
                            // Обработает настройки hint
                            if (allLayers[i].markerhint){
                                var feature = JSON.parse(JSON.stringify(allLayers[i].GeoJSON.features[allLayers[i].selectedObjects[j]]));
                                if (feature.properties){
                                    for(var k in feature.properties){
                                        if (k !== allLayers[i].markerhint.propertiesname && k !== 'id'){
                                            delete feature.properties[k];
                                        }
                                    }
                                }
                                feature.properties['name'] = w2utils.lang("Marker");
                                feature.properties[w2utils.lang("Comment")] = feature.properties[allLayers[i].markerhint.propertiesname];
                                delete feature.properties[allLayers[i].markerhint.propertiesname];
                                selectedFeatures.addJsonObject(feature, null, allLayers[i]);
                            }
                            else {
                                selectedFeatures.addJsonObject(allLayers[i].GeoJSON, allLayers[i].selectedObjects[j], allLayers[i]);
                            }
                            if (selectedFeatures.mapobjects && selectedFeatures.mapobjects.length > 0) {
                                $(map.eventPane).trigger({
                                    type: 'mapobjectloadWfs',
                                    layer: selectedFeatures.mapobjects[0].maplayerid,
                                    gid: selectedFeatures.mapobjects[0].gid
                                });
                            }
                        }
                    }
                    allLayers[i].selectedObjects = [];
                }
            }
        },

        /**
         * Получить код состемы координат GeoJSON объекта
         * @method getCrsCode
         * @public
         * @param crsobject {object} GeoJSON CRS объект
         * @return {Number} код системы координат. При ошибке возвращает undefined или '-1'.
         */
        getCrsCode: function (crsobject) {

            if (!crsobject || $.isEmptyObject(crsobject)) {
                return undefined;
            }
            if (typeof crsobject.type == 'undefined' || typeof crsobject.properties == 'undefined') {
                console.log('Invalid GeoJSON CRS.');
                return undefined;
            }
            if (crsobject.type != 'name' && crsobject.type.toLowerCase() != 'epsg') {
                console.log('Invalid GeoJSON CRS type. Only named GeoJSON CRS type supported.');
                return crscode;
            }
            var name = crsobject.properties.name || crsobject.properties.code;
            if (!name){
                return -1;
            }
            var _name = name.toLowerCase();
            if (_name.indexOf(':crs84') > -1 || _name.indexOf(':4326') > -1) {
                return 4326;
            }
            if (name.indexOf(':3857') > -1) {
                return 3857;
            }
			if (name.indexOf(':900913') > -1) {
                return 900913;
            }
			if (name.indexOf(':102100') > -1) {
                return 102100;
            }
			if (name.indexOf(':102113') > -1) {
                return 102113;
            }
            if (name.indexOf(':3395') > -1) {
                return 3395;
            }
            console.log('Invalid GeoJSON CRS name value.' + ' ' + name);
            return -1;
        },

		/**
         * Преобразовать координаты в json из метрической системы в геодезические
         * @method coordsToGeo
         * @param json {object} geoJSON
         * @return {Object} преобразованный geoJSON
         */
		coordsToGeo: function (json) {
            if (typeof json.crs == 'undefined') {
                return json;
            }
            var len, i, crs = this.getCrsCode(json.crs);
            if (typeof crs == 'undefined' || crs == -1) {
                return null;
            }
			if ([3857, 900913, 102100, 102113].indexOf(crs) == -1) {
			  return json;
			}
			else {
			  crs = 3857;
			}
            if (!json.features || (len = json.features.length) == 0)
                return json;
			var geojson = $.extend({}, json);
			delete geojson.crs;

			if (typeof geojson.bbox !== 'undefined') {
			  geojson.bbox = Array.prototype.concat(GWTK.UtilGraphicLayer.metricsToLatLng([ geojson.bbox[0], geojson.bbox[1] ], crs), GWTK.UtilGraphicLayer.metricsToLatLng([ geojson.bbox[2], geojson.bbox[3] ], crs));
			}

			for (i = 0; i < len; i++) {
			  if (typeof geojson.features[i].bbox !== 'undefined') {
                geojson.features[i].bbox = Array.prototype.concat(GWTK.UtilGraphicLayer.metricsToLatLng([ geojson.features[i].bbox[0], geojson.features[i].bbox[1] ], crs), GWTK.UtilGraphicLayer.metricsToLatLng([ geojson.features[i].bbox[2], geojson.features[i].bbox[3] ], crs));
			  }
			  var geocoords = GWTK.UtilGraphicLayer.metricsToLatLngs(geojson.features[i].geometry.coordinates, crs);
              geojson.features[i].geometry.coordinates = geocoords;
            }
            return geojson;
        },

		/**
         * Преобразовать метрические координаты точки в геодезические
         * @method coordsToLatLng
         * @param coords {Array} координаты точки
		 * @param crs {Number} код системы координат
         * @return {Object} объект с геодезическими координатами точки
         */
		coordsToLatLng: function (coords, crs) {
            var geo = GWTK.projection.xy2geo(crs, coords[1], coords[0]);
	        return new GWTK.LatLng(geo[1], geo[0], coords[2]);
        },

        /**
         * Преобразовать массив метрических координат точек в геодезические
         * @method coordsToLatLngs
         * @param coords {Array} массив координат точки
		 * @param crs {Number} код системы координат
         * @return {Array} массив с геодезическими координатами точек
         */
        coordsToLatLngs:function (coords, levelsDeep, crs) {
	        var latlngs = [];
            for (var i = 0, len = coords.length, latlng; i < len; i++) {
                latlng = levelsDeep ?
			        GWTK.UtilGraphicLayer.coordsToLatLngs(coords[i], levelsDeep - 1, crs) :
			        GWTK.UtilGraphicLayer.coordsToLatLng(coords[i], crs);
                latlngs.push(latlng);
            }
		},

        /**
         * Преобразовать метрические координаты точки в геодезические
         * @method coordsToLatLng
         * @param coords {Array} координаты точки
		 * @param crs {Number} код системы координат
         * @return {Array} массив с геодезическими координатами точки
         */
        metricsToLatLng: function (coords, crs) {
			if (isNaN(coords[0]) || isNaN(coords[1])) {
              return false;
			}
			var geo = GWTK.projection.xy2geo(crs, coords[1], coords[0]);
			return [ geo[1], geo[0] ];
		},

        /**
         * Преобразовать массив метрических координат точек в геодезические
         * @method coordsToLatLngs
         * @param coords {Array} массив координат точки
		 * @param crs {Number} код системы координат
         * @return {Array} массив с геодезическими координатами точек
         */
		metricsToLatLngs: function (coords, crs) {
	        var latlngs = [];
			for (var i = 0, len = coords.length, latlng; i < len; i++) {
			  latlng = GWTK.UtilGraphicLayer.metricsToLatLng(coords[i], crs);
			  if (!latlng) {
				latlng = GWTK.UtilGraphicLayer.metricsToLatLngs(coords[i], crs);
			  }
              latlngs.push(latlng);
			}
            return latlngs;
        },

		/**
         * Ограничить геодезические координаты точки до указанной точности
         * @method latLngToCoords
         * @param latlng {Object} координаты точки
         * @param precision {Number} точность
         * @return {Array} массив с координатами точки
         */
		latLngToCoords:function (latlng, precision) {
	        precision = typeof precision === 'number' ? precision : 6;
            return latlng.alt !== undefined ?
		        [GWTK.Util.formatNum(latlng.lng, precision), Util.formatNum(latlng.lat, precision), Util.formatNum(latlng.alt, precision)] :
		        [GWTK.Util.formatNum(latlng.lng, precision), Util.formatNum(latlng.lat, precision)];
        },

		/**
         * Ограничить массив геодезических координат точек до указанной точности
         * @method latLngsToCoords
         * @param latlngs {Array} массив координат точек
         * @param levelsDeep {Number} глубина рекурсии
		 * @param closed {Boolean} добавить элементы вложенностью больше глубины рекурсии
		 * @param precision {Number} точность
         * @return {Array} массив с координатами точек
         */
		latLngsToCoords:function (latlngs, levelsDeep, closed, precision) {
	        var coords = [];
            for (var i = 0, len = latlngs.length; i < len; i++) {
                coords.push(levelsDeep ?
			        latLngsToCoords(latlngs[i], levelsDeep - 1, closed, precision) :
			        latLngToCoords(latlngs[i], precision));
            }
            if (!levelsDeep && closed) {
                coords.push(coords[0]);
            }
            return coords;
        },

        /**
         * Преобразовать геодезические координаты точки в метрические
         * @method latLngToCoords
         * @param latlng {Object} координаты точки
         * @param  crs {Number} код системы координат
         * @return {Array} массив с координатами точки
         */
		latLngToMetrics:function (latlng, crs) {
			if (isNaN(latlng[0]) || isNaN(latlng[1])) {
              return false;
			}
			var coords = GWTK.projection.geo2xy(crs, latlng[1], latlng[0]);
			return [ coords[1], coords[0] ];
		},

        /**
         * Преобразовать массив геодезических координат точек в метрические
         * @method latLngsToCoords
         * @param latlngs {Array} массив координат точек
		 * @param  crs {Number} код системы координат
         * @return {Array} массив с координатами точек
         */
		latLngsToMetrics:function (latlngs, crs) {
			var coords = [];
			for (var i = 0, len = latlngs.length, coord; i < len; i++) {
			  coord = GWTK.UtilGraphicLayer.latLngToMetrics(latlngs[i], crs);
			  if (!coord) {
				coord = GWTK.UtilGraphicLayer.latLngsToMetrics(latlngs[i], crs);
			  }
              coords.push(coord);
			}
            return coords;
		}
    };

    /**
     * Компонент локальный слой (svg-карта)
     * @class GWTK.graphicLayer
     * @constructor GWTK.graphicLayer
     * @param map {GWTK.Mаp} - Карта
     * @param options {Object} - Параметры слоя
     * @param editingParam {Object} - Параметры редактирования
     {
     "editing": true,  // слой подлежит редактированию
     "editingdata":    // маска: редактируемые данные (объекты, семантики объектов), при отсутствии - редактируются все объекты слоя
             {
                 "objects": [                                // список объектов
                     {
                         "code": "Line"                      // код объекта
                         , "semantics": ["0", "1"]           // список ключей семантик
                     }
                 ]
             }
     "selectlayer": true   // Cлой участвует в выборе объектов для привязки и топологии. При отсутствии параметра слой будет включен в обработку, если параметр слоя selectObject = 1
     }
     */

    GWTK.graphicLayer = function (map, options, editingParam) {
        this.map = null;
        this.id = "";                        // Уникальный идентификатор слоя
        this.xId = "";                       // Уникальный идентификатор экземпляра
        this.idLayer="";
        this.alias = "";                     // Название слоя
        this.url = "";                       // Шаблон запросов данных
        this.format = (options && options.type) ? options.type : "svg";  // Формат рисунков карты
        this.selectObject = 0;               // Возможность выбора объектов карты (1/0)
        this.parent = null;                  // Контейнер родителя
        this.layerContainer = null;          // Контейнер слоя
        this.visible = true;                 // Признак видимости слоя (1/0)
        this.classifier = null;
        this.loadedCss = null;               // Стили для отображения объектов
        this.crs;                            // Код системы координат GeoJSON по умолчанию - [longitude and latitude units of decimal degrees]
        if (!map) {
            console.log('GWTK.graphicLayer. ' + w2utils.lang("Map layer creation error") + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return this;
        }
        // Параметры редактирования слоя
        this.editingParam = editingParam;

        this.onSvgClick = GWTK.Util.bind(this.onSvgClick, this);
        this.onLayerCommand = GWTK.Util.bind(this.onLayerCommand, this);
        this.onOverlayRefresh = GWTK.Util.bind(this.onOverlayRefresh, this);

        this.timertick = GWTK.Util.bind(this.timertick, this);
		this.error = !this.init(map, options);    // Флаг ошибки

    };

    GWTK.graphicLayer.prototype = {

        /**
         * Инициализация
         * @method init
         * @private
         * @param map {Object} Объект карты
         * @param options {Object}  Параметры слоя
         */
        init: function (map, options) {

            this.map = map;

            this.options = options;

            // Если есть url, то назначим его
            if (this.options.url){
                this.url = this.options.url;
                // Добавим сервер к url слоя, если адрес относительный
                if (!GWTK.Util.formatUrl(this.map.options.url, this)) {                   // Не сформирован полный адрес
                    return;
                }
                // Запрашивать новые данные при смене изображения
                this.updateparameters = this.options.updateparameters || null;
                if(this.updateparameters && this.updateparameters.fn_filter) {
                   this.setFilter(this.updateparameters.fn_filter);
                }
            }

            this.defaultStyle = {
                "vector-effect": "non-scaling-stroke",
                "stroke": "green",
                "stroke-width": "2px",
                "stroke-opacity": "0.75",
                "fill": "blue",
                "fill-opacity": "0.75",
                "background": "",
                "background-size": "auto auto",
                "objName": "SEM99",
                "marker": {
                    "width": "32px",
                    "height": "32px",
                    "path": "M 2 16 a 7 7 0 0 0 28 0M 2 16 a 7 7 0 0 1 28 0",
                    "centerX": "16",
                    "centerY": "16"
                },
                "font-family": "Verdana",
                "font-size": "12px",
                "letter-spacing": "1",
                "startOffset": "2%",
                "stroke-dasharray": "none",
                "text": ""
            };
            this.typeField = "id";
            this.style = this.defaultStyle;

            if (this.options.parent) {
                var parent = $('#' + this.options.parent);
                if (parent.length > 0)
                    this.parent = parent[0];
                else {
                    this.parent = GWTK.DomUtil.create('div', 'svgdrawing-panel', this.map.mapPane);
                    this.parent.id = this.options.parent;
                    this.parent.style.zIndex = $(this.map.overlayPane).css('z-index') - 1;
                    this.parent.style.position = 'absolute';
                }
            }
            else
                this.parent = this.map.graphicPane;                           // Контейнер графического слоя карты

            this.errorImage = GWTK.imgEmpty;

            this.setOptions();                          // установить параметры слоя

            this.GeoJSON = {"type": "FeatureCollection", "bbox": [], "features": []};

            this.classifier = new GWTK.classifier(this);

            this.createSvg();

            this.semantic = this.getSemanticWithList();

            this.initEvents();

            this.onAdd();

			if (this.error) {
			  return;
			}

			return true;
        },

       /**
         * Получить тип слоя
         * @method getType
         * @public
         * @return {string} строка, 'svg' - слой svg графики
         */
        getType: function () {
            if (typeof this.options.type !== 'undefined') {
                return this.options.type;
            }
            return 'svg';
        },

        /**
         * Назначение обработчиков событий
         * @method initEvents
         * @private
         */
        initEvents: function () {
            $(this.map.eventPane).on('layercommand', this.onLayerCommand);

            // Запрашивать новые данные при смене изображения
            if (this.updateparameters){
                // Обновление данных при смене габаритов
                if (this.updateparameters.bbox) {
                  $(this.map.eventPane).on('overlayRefresh', this.onOverlayRefresh);
                }
            }
        },

        /**
         * Установить параметры слоя
         * @method setOptions
         * @public
         * @param param {Object} Параметры слоя
         */
        setOptions: function (param) {
            if (!this.map)
                return;
            if (param)
                this.options = param;
            this.server = this.options.url;
            this.xId = this.id = this.sheet = this.options.xId = this.options.id;
            // список имен листов слоя
            this.mapSheets = {"layerId": this.id, "sheets": [this.id]};
            this.alias = this.options.alias;
            this.selectObject = this.options.selectObject = this.options.selectObject || 0;

            this.map.options.layers.push(this.options);
        },

        /**
         * Проверить признак вспомогательного слоя
         * @method isUtility
         * @public
         */
        isUtility: function () {
            var is = false;
            if (this.options && this.options.utility) {
                is = Boolean(this.options.utility);
            }
            return is;
        },

        /**
         * Обновление данных по таймеру
         */
        timertick: function () {
            if (this.visible) {
                this.getData();
            }
        },

        /** Назначить функцию формирования фильтра для запроса
         * @param fn_filter - функция для формирования запроса по фильтру
         */
        setFilter: function(fn_filter){
            if (fn_filter) {
                this.fn_filter = fn_filter;
            }
        },

        /**
         * Обновление при изменении фильтра
         */
        updateDataByFilter: function(){
            this.timertick();
        },


        /**
         * Запросить данные с сервера
         * @method getData
         * @param frame {Array GWTK.toLatLng} Двухмерный массив области поиска
        */
        getData: function (callback) {

            var _that = this, bbox = null, url;
            if (this.updateparameters){
                if (this.updateparameters.bbox) {
                    // Запросим географические габариты текущего окна карты
                    var bboxGeo = this.map.getMapGeoBounds();
                    if (bboxGeo) {
                        bbox = [bboxGeo.SW.lat,bboxGeo.SW.lng, bboxGeo.NE.lat,  bboxGeo.NE.lng];
                    }
                }
                url = (this.updateparameters.fn_url) ? this.updateparameters.fn_url(bbox, this.fn_filter) : null;
            }

            url =  url || this.url;
            if (!url) {
                return;
            }

            $.ajax({
                async: true,
                // type: 'POST',
                // data: '', //'user_id='+user_id+'',
                url: url,
                dataType: "json",
                success: function (data) {
                    var jsondata;
                    if (data){
                        jsondata = GWTK.UtilGraphicLayer.createJSONforGraphicLayer(data);
                    }
                    if (jsondata) {
                        _that.loadFromGeoJson(jsondata.json, jsondata.style, true);
                        if (callback) {
                            callback(jsondata.json);
                        }
						else {
						  GWTK.Util.hideWait();
						}
                    }
                    else {
                        console.log( 'GWTK.graphicLayer.getData: ' + _that.url +  " - Data not found" );
						GWTK.Util.hideWait();
                    }
                },
                error: function(ret){
                    console.log( 'GWTK.graphicLayer.getData: ' + _that.url +  " - error" );
					GWTK.Util.hideWait();
                }
            });

            return true;
        },


        /**
         * Добавить слой в карту
         * @method onAdd
         * @public
         */
        onAdd: function () {
            if (!this.map)
                return;

            //this.setOptions(null);                         // установить параметры слоя
            this.map.layers.push(this);                     // добавить в список слоев карты

			var _that = this,
                callback = function(data) {
                    _that.map.tiles.viewOrder.push( _that.xId );
                    const layerDescription={
                        id: _that.xId ,
                        text: _that.alias
                    };
                    // if(_that.map.options.contenttree[1].nodes) {
                    //     _that.map.options.contenttree[1].nodes.push(layerDescription);
                    // }
			    
                    $(_that.map.eventPane).trigger({ type: 'layerlistchanged', maplayer: { 'id': _that.xId, 'act': 'add', 'editingParam': _that.editingParam } });
                    // скрыть, если слой выключен
                    if (typeof _that.options.hidden !== 'undefined' && _that.options.hidden == 1) {
                        _that.hide();
                    }
                    GWTK.Util.hideWait();
                };

            // Если есть url
            var getdata = false;
            if (this.url) {
                GWTK.Util.showWait();
                getdata = this.getData(callback);
            }

            if (!getdata) {
                if (this.options.jsondata) {
                  this.loadFromGeoJson(this.options.jsondata.json, this.options.jsondata.style, true);
                }
                if (!this.error) {
                    callback();
                }
                else {
                    GWTK.Util.falseFunction();
                }
            }

            // скрыть, если слой выключен
            if (typeof this.options.hidden !== 'undefined' && this.options.hidden == 1) {
                this.hide();
            }
        },

        /**
         * Удалить слой. Удаляет слой и его параметры в карте
         * @method onRemove
         * @public
         */
        onRemove: function () {
            this.remove();
        },

        /**
         *  Удаление данных слоя
         *  @method remove
         */
        remove: function(){

            // Очистить слой
            this.clearLayer();
            if (!this.map) return;

            $(this.map.eventPane).trigger({type: 'layerlistchanged', maplayer: {'id': this.xId, 'act': 'remove'}});

            return;
        },

        /**
         * Очистить слой (удаляет все объекты слоя)
         * @method clearLayer
         * @public
         */
        clearLayer: function () {
            // Остановить таймер
            clearInterval(this.timerId);

            $(this.map.eventPane).off("svgclick", this.onSvgClick);
            $(this.map.eventPane).off('layercommand', this.onLayerCommand);
            $(this.map.eventPane).off('overlayRefresh', this.onOverlayRefresh);

            if (this.layerContainer) {
                this.layerContainer.clearDraw();
                this.GeoJSON.features = [];
            }
        },

        /**
         * Обновить. Событие обновления слоев
         * @method update
         * @public
         */
        update: function () {
            if (this.visible) {
                // Для GWTK.svgDrawing не делать лишний overlayRefresh
                if (this.layerContainer && this.layerContainer.drawingMethod
                    && this.layerContainer.drawingMethod instanceof GWTK.svgDrawing)
                this.layerContainer.drawingMethod.overlayPaneEvent();
            }
            else {
                $(this.map.eventPane).trigger("overlayRefresh");
            }
        },

        /**
         * Отобразить слой
         * @method show
         * @public
         */
        show: function () {
            //if (!this.layerContainer || !this.layerContainer.drawingMethod.svgCanvas)
            //    return;
            //this.visible = true;
            var index = this.map.tiles.indexOfxIdInArray(this.map.layers, this.xId);
            this.visible = true;
            if (this.layerContainer && this.layerContainer.drawingMethod.svgCanvas)
                $(this.layerContainer.drawingMethod.svgCanvas).show();
        },

        /**
         * Скрыть слой
         * @method hide
         * @public
         */
        hide: function () {
            this.visible = false;
            //if (!this.layerContainer || !this.layerContainer.drawingMethod.svgCanvas)
            //    return;
            //this.visible = false;
            var index = this.map.tiles.indexOfxIdInArray(this.map.layers, this.xId);
            this.visible = false;
            if (this.layerContainer && this.layerContainer.drawingMethod && this.layerContainer.drawingMethod.svgCanvas)
                $(this.layerContainer.drawingMethod.svgCanvas).hide();
        },

        /**
         * Запросить видимость слоя
         * @method getVisibility
         * @public
         * @return {Boolean} `true`, если слой видимый;
         *                   `false`, если слой скрыт
         */
        getVisibility: function () {
            return this.visible;
        },

        /**
         * Сервисная функция обновления
         * @method redrawMosaic
         * @private
         */
        redrawMosaic: function () {
            //функцию вызывают другие классы (для всех слоев)
            return true;
        },


        /**
         * Обновление объекта локальной карты
         * @method updateObject
         * @param json {Object} Объект слоя в формате JSON
         * @deprecated Используйте updateFromGeoJson()
         * @return {Boolean} Возвращает `false` при ошибке в составе входных данных
         */
        updateObject: function (json) {
            var mapContent = GWTK.maphandlers.map.mapTool('mapcontent');
            if (mapContent) {
                mapContent.setChecked(this.id);
            }
            this.visible = true;
            var props = null;

            var jsonFeature;
            if (json["features"][0])
                jsonFeature = json["features"][0];
            else if (json["type"] == "Feature")
                jsonFeature = json;
            if (!jsonFeature)
                return false;
            if (!jsonFeature["style"])
                jsonFeature["style"] = {};

            for (var key in this.defaultStyle) {
                if (jsonFeature["style"][key] || jsonFeature["properties"][key])
                    jsonFeature["style"][key] = jsonFeature["style"][key] || jsonFeature["properties"][key];
            }

            // Подгрузим стили из loadedCss
            if (this.loadedCss) {
                if (jsonFeature['properties'][this.typeField]) {
                    jsonFeature['style'] = this.loadedCss[jsonFeature['properties'][this.typeField]] || jsonFeature['style'] || this.style;
                }
            }

            var j = null;
            if (jsonFeature["properties"] != null && jsonFeature["properties"]["id"] != null) {
                for (var i = 0; i < this.GeoJSON["features"].length; i++) {
                    if (this.GeoJSON["features"][i] == null)
                        continue;
                    if (this.GeoJSON["features"][i]["properties"]["id"] == jsonFeature["properties"]["id"]) {
                        j = i;
                        break;
                    }
                }
            }
            if (j != null) {
                props = this.GeoJSON["features"][j]["properties"];
                this.GeoJSON["features"].splice(j, 1);
            } else {
                jsonFeature["properties"]["id"] = this.id + "." + GWTK.Util.createGUID() + "";
            }
            if (props != null) {
                for (key in props) {
                    if (!jsonFeature["properties"][key] && !jsonFeature["style"][key])
                        jsonFeature["properties"][key] = props[key];
                }
            }
            for (i = 0; i < this.semantic[0]["reference"].length; i++) {
                if (jsonFeature["style"]["marker"] == this.semantic[0]["reference"][i]["value"]) {
                    jsonFeature["style"]["marker"] = this.semantic[0]["reference"][i]["attr"];
                    break;
                }
            }
            for (i = 0; i < this.semantic[1]["reference"].length; i++) {
                if (jsonFeature["style"]["stroke-dasharray"] == this.semantic[1]["reference"][i]["value"]) {
                    jsonFeature["style"]["stroke-dasharray"] = this.semantic[1]["reference"][i]["attr"];
                    break;
                }
            }

            if (jsonFeature["properties"]["ObjName"])
                jsonFeature["properties"]["name"] = jsonFeature["properties"]["ObjName"];
            var bbox = [];

            if (jsonFeature["geometry"] && jsonFeature["geometry"]["coordinates"]) {

                bbox = this.coordsArray(jsonFeature["geometry"]["coordinates"], bbox);

                jsonFeature["bbox"] = JSON.parse(JSON.stringify(bbox));
            }
            this.GeoJSON["features"].push(jsonFeature);
            if (bbox) {
                if (this.GeoJSON["bbox"].length == 0) {
                    this.GeoJSON["bbox"] = JSON.parse(JSON.stringify(bbox));
                } else {
                    this.GeoJSON["bbox"][0] = Math.min(this.GeoJSON["bbox"][0], bbox[0]);
                    this.GeoJSON["bbox"][1] = Math.min(this.GeoJSON["bbox"][1], bbox[1]);
                    this.GeoJSON["bbox"][2] = Math.max(this.GeoJSON["bbox"][2], bbox[2]);
                    this.GeoJSON["bbox"][3] = Math.max(this.GeoJSON["bbox"][3], bbox[3]);
                }
            }
            this.drawMap();
        },

        /**
         * Добавление объекта локальной карты
         * @method addFeature
         * @public
         * @param feature {Object} Feature-объект слоя в формате GeoJSON
         * @return {Boolean} Возвращает `false` при ошибке в составе входных данных
         */
        addFeature: function (feature) {
            //TODO architecture данная функция предназначена для доавления объекта ачем тут включение слоя непонятно
            var mapContent = GWTK.maphandlers.map.mapTool('mapcontent');
            if (mapContent) {
                mapContent.setChecked(this.id);
            }
            this.visible = true;
            var props = null;

            var jsonFeature = feature;
            if (!jsonFeature)
                return false;
            if (!jsonFeature["style"])
                jsonFeature["style"] = {};

            for (var key in this.defaultStyle) {
                if (jsonFeature["style"][key] || jsonFeature["properties"][key])
                    jsonFeature["style"][key] = jsonFeature["style"][key] || jsonFeature["properties"][key];
            }

            var j = null;
            if (jsonFeature["properties"] != null && jsonFeature["properties"]["id"] != null) {
                for (var i = 0; i < this.GeoJSON["features"].length; i++) {
                    if (this.GeoJSON["features"][i] == null)
                        continue;
                    if (this.GeoJSON["features"][i]["properties"]["id"] == jsonFeature["properties"]["id"]) {
                        j = i;
                        break;
                    }
                }
            }

            // Обновить text из title
            this.updatePropertiesText(jsonFeature["properties"], 'title');

            if (j != null) {
                props = this.GeoJSON["features"][j]["properties"];
                this.GeoJSON["features"].splice(j, 1);
            } else {
                jsonFeature["properties"]["id"] = jsonFeature["properties"]["id"] ? jsonFeature["properties"]["id"] : this.id + "." + GWTK.Util.createGUID() + "";
            }
            if (props != null) {
                for (key in props) {
                    if (!jsonFeature["properties"][key] && !jsonFeature["style"][key])
                        jsonFeature["properties"][key] = props[key];
                }
            }
            for (i = 0; i < this.semantic[0]["reference"].length; i++) {
                if (jsonFeature["style"]["marker"] == this.semantic[0]["reference"][i]["value"]) {
                    jsonFeature["style"]["marker"] = this.semantic[0]["reference"][i]["attr"];
                    break;
                }
            }
            for (i = 0; i < this.semantic[1]["reference"].length; i++) {
                if (jsonFeature["style"]["stroke-dasharray"] == this.semantic[1]["reference"][i]["value"]) {
                    jsonFeature["style"]["stroke-dasharray"] = this.semantic[1]["reference"][i]["attr"];
                    break;
                }
            }

            // Имя объекта
            if (jsonFeature["properties"]["ObjName"])
                jsonFeature["properties"]["name"] = jsonFeature["properties"]["ObjName"];

            // Подпись
            if (jsonFeature["properties"]["ObjCComm"])
                jsonFeature["properties"]["text"] = jsonFeature["properties"]["ObjCComm"];

            var bbox = [];

            if (jsonFeature["geometry"] && jsonFeature["geometry"]["coordinates"]) {

                bbox = this.coordsArray(jsonFeature["geometry"]["coordinates"], bbox);

                jsonFeature["bbox"] = JSON.parse(JSON.stringify(bbox));
            }
            this.GeoJSON["features"].push(jsonFeature);
            if (bbox) {
                if (this.GeoJSON["bbox"].length == 0) {
                    this.GeoJSON["bbox"] = JSON.parse(JSON.stringify(bbox));
                } else {
                    this.GeoJSON["bbox"][0] = Math.min(this.GeoJSON["bbox"][0], bbox[0]);
                    this.GeoJSON["bbox"][1] = Math.min(this.GeoJSON["bbox"][1], bbox[1]);
                    this.GeoJSON["bbox"][2] = Math.max(this.GeoJSON["bbox"][2], bbox[2]);
                    this.GeoJSON["bbox"][3] = Math.max(this.GeoJSON["bbox"][3], bbox[3]);
                }
            }
        },

        /**
         * Обновление объектов локальной карты из GeoJSON
         * @method updateFromGeoJson
         * @public
         * @param geojson {Object} Слой в формате GeoJSON
         * @return {Boolean} Возвращает `false` при ошибке в составе входных данных
         */
        updateFromGeoJson: function (geojson) {
            if (!geojson["features"])
                return false;
            this.updateFeatures(geojson["features"]);
        },

        // Обновить свойства text из title
        /**
         * Обновить свойства text из title во всех объектах
         * @param features
         * @param propFrom
         */
        updateFeaturesPropertiesText: function(features, propFrom){
            var len;
            if (features && (len = features.length > 0)) {
                for(var i = 0; i < len; i++ ) {
                    this.updatePropertiesText(features[i].properties, propFrom);
                }
            }
        },

        // Обновить свойства text из title
        /**
         * Обновить свойства text из title в одном атрибутах одного объекта
         * @param properties
         * @param propFrom
         */
        updatePropertiesText: function(properties, propFrom){
            var value;
            if (properties && (value = (properties[propFrom] || properties[propFrom.toLowerCase()]))) {
                properties['text'] = value;
            }
        },

        /**
         * Обновление объектов локальной карты
         * @method updateFeatures
         * @public
         * @param features {Object} Feature-объект в формате GeoJSON, либо массив "features"
         * @return {Boolean} Возвращает `false` при ошибке в составе входных данных
         */
        updateFeatures: function (features) {
            if (!features)
                return false;
            if (!Array.isArray(features))
                features = [features];

            var mapContent = this.map.mapTool('mapcontent');
            if (mapContent) {
                mapContent.setChecked(this.id);
            }
            this.visible = true;

            for (var j = 0, len = features.length; j < len; j++) {

                var jsonFeature = features[j];

                jsonFeature["style"] = jsonFeature["style"] || {};
                jsonFeature["properties"] = jsonFeature["properties"] || {};

                if (this.getType() === 'svg') {
                    //Заполнить стиль из properties (совместимость)
                    for (var key in this.defaultStyle) {
                        if (!jsonFeature["style"][key] && jsonFeature["properties"][key])
                            jsonFeature["style"][key] = jsonFeature["properties"][key];
                    }
                    // Обновить text из title
                    this.updatePropertiesText(jsonFeature["properties"], 'title');

                    // Подгрузим стили из loadedCss
                    if (this.loadedCss) {
                        if (jsonFeature['properties'][this.typeField]) {
                            jsonFeature['style'] = this.loadedCss[jsonFeature['properties'][this.typeField]] || jsonFeature['style'] || this.style;
                        }
                    }
                }

                //поиск элемента в существующем geoJSON
                if (jsonFeature["properties"]["id"] != null) {
                    for (i = 0; i < this.GeoJSON["features"].length; i++) {
                        if (this.GeoJSON["features"][i] == null)
                            continue;
                        if (this.GeoJSON["features"][i]["properties"]["id"] == jsonFeature["properties"]["id"]) {
                            //Добавляем отсутствующие параметры из найденного элемента geoJSON
                            var props = this.GeoJSON["features"][i]["properties"];
                            for (key in props) {
                                if (!jsonFeature["properties"][key] && !jsonFeature["style"][key])
                                    jsonFeature["properties"][key] = props[key];
                            }
                            this.GeoJSON["features"].splice(i, 1);
                            break;
                        }
                    }
                }

                if (jsonFeature["properties"]["id"] == null || jsonFeature["properties"]["id"] === "0")
                    jsonFeature["properties"]["id"] = this.id + "." + GWTK.Util.createGUID() + "";

                if (this.getType() === 'svg') {
                    for (var i = 0; i < this.semantic[0]["reference"].length; i++) {
                        if (jsonFeature["style"]["marker"] == this.semantic[0]["reference"][i]["value"]) {
                            jsonFeature["style"]["marker"] = this.semantic[0]["reference"][i]["attr"];
                            break;
                        }
                    }

                    for (i = 0; i < this.semantic[1]["reference"].length; i++) {
                        if (jsonFeature["style"]["stroke-dasharray"] == this.semantic[1]["reference"][i]["value"]) {
                            jsonFeature["style"]["stroke-dasharray"] = this.semantic[1]["reference"][i]["attr"];
                            break;
                        }
                    }
                }

                //Совместимость
                if (jsonFeature["properties"]["ObjName"])
                    jsonFeature["properties"]["name"] = jsonFeature["properties"]["ObjName"];

                var bbox = [];

                if (jsonFeature["geometry"] && jsonFeature["geometry"]["coordinates"]) {

                    bbox = this.coordsArray(jsonFeature["geometry"]["coordinates"], bbox);

                    jsonFeature["bbox"] = bbox.slice();
                }
                this.GeoJSON["features"].push(jsonFeature);
                if (bbox) {
                    if (this.GeoJSON["bbox"].length == 0) {
                        this.GeoJSON["bbox"] = bbox.slice();
                    } else {
                        this.GeoJSON["bbox"][0] = Math.min(this.GeoJSON["bbox"][0], bbox[0]);
                        this.GeoJSON["bbox"][1] = Math.min(this.GeoJSON["bbox"][1], bbox[1]);
                        this.GeoJSON["bbox"][2] = Math.max(this.GeoJSON["bbox"][2], bbox[2]);
                        this.GeoJSON["bbox"][3] = Math.max(this.GeoJSON["bbox"][3], bbox[3]);
                    }
                }
            }

            if (this.getType() === 'geomarkers') {
                this.GeoJSON  = this.expandIdJSON(this.GeoJSON);
            }

            this.drawMap(true);
        },

        /**
         * Удаление объекта локальной карты
         * @method deleteObject
         * @public
         * @param json {Object} Объект слоя для удаления в формате JSON
         */
        deleteObject: function (json) {
            var jsonFeature = json["features"][0];
            var type = (jsonFeature.geometry && jsonFeature.geometry.type) ? jsonFeature.geometry.type : jsonFeature.property.key;
            this.deleteObjectById(jsonFeature["properties"]["id"], type);
        },

        /**
         * Удаление объекта локальной карты
         * @method deleteObject
         * @public
         * @param gid {String} идентификатор объекта
         * @param type {String} тип объекта
         */
        deleteObjectById: function (gid, type) {
            this.layerContainer.deleteObject(gid, type);
            var i = this.getNumberById(gid);
            if (i != null)
                this.GeoJSON["features"].splice(i, 1);
        },

        /**
         * Запросить порядковый номер объекта локальной карты по идентификатору
         * @method getNumberById
         * @public
         * @param gid {Object} идентификатор объекта
         * @return {Int} Если не найдено, возвращает null
         */
         getNumberById: function (gid) {
            var j = null;
            for (var i = 0; i < this.GeoJSON["features"].length; i++) {
                if (this.GeoJSON["features"][i] == null)
                    continue;
                if (this.GeoJSON["features"][i]["properties"]["id"] == gid) {
                    j = i;
                    break;
                }
            }
            return j;
        },

        /**
         * Запросить объект локальной карты по идентификатору
         * @method getObjectById
         * @public
         * @param gid {Object} идентификатор объекта
         */
        getObjectById: function (gid) {
            var i = this.getNumberById(gid);
            if (i != null)
                return this.GeoJSON["features"][i];
        },

        /**
         * Создание SVG-контейнера локального слоя
         * @method createSvg
         * @private
         */
        createSvg: function () {
            this.layerContainer = new GWTK.objectDrawing(this.map, ["graphicPane", this.parent, this.id, this.options['eventSets'] || null], this.format);
            $(this.map.eventPane).on("svgclick", this.onSvgClick);
        },

        /**
         * Обработчик события `svgclick`
         * @method onSvgClick
         * @param event
         */
        onSvgClick: function(event){
            var clickX = false, clickY = false, map = this.map;
            if (event.dataobject.offsetX === undefined || event.dataobject.offsetY === undefined) {
                if (event.dataobject && event.dataobject.originalEvent) {
                    clickX = event.dataobject.originalEvent.layerX;
                    clickY = event.dataobject.originalEvent.layerY;
                }else{
                    clickX = event.dataobject.layerX;
                    clickY = event.dataobject.layerY;
                }
            } else {
                clickX = event.dataobject.offsetX;
                clickY = event.dataobject.offsetY;
            }
            this.deltaPoint = this.calcDeltaPoint(1);
            this.deltaLine = this.calcDeltaLine(1);
            for (var i = 0; i < map.layers.length; i++) {
                if (map.layers[i].getType() == 'svg') {
                    var bbox_gjson = map.layers[i].GeoJSON["bbox"];
                    if (!map.layers[i].visible || !map.layers[i].GeoJSON
                        || !bbox_gjson
                        || bbox_gjson.length == 0)
                        continue;

                    var gClick = map.layers[i].pixel2geoOffset(clickX, clickY);
                    if (!gClick || gClick.length < 2) {
                        continue;
                    }

                    gClick = GWTK.toLatLng([gClick[0], gClick[1]]);
                    while (gClick.lng > 180) {
                        gClick.lng -= 360;
                    }
                    while (gClick.lng < -180) {
                        gClick.lng += 360;
                    }

                    if (!this.checkBboxEntering(bbox_gjson, gClick))//Координаты и пиксели в разные напраления увеличиваются
                        continue;

                    map.layers[i].selectedObjects = [];
                    var num = 0;

                    for (var j = 0; j < map.layers[i].GeoJSON["features"].length; j++) {
                        var feature = map.layers[i].GeoJSON["features"][j];
                        var fbbox = feature["bbox"];

                        if (!fbbox || fbbox.length == 0) {
                            continue;
                        }

                        var inClick = false, edit;

                        if (fbbox[0] > 180 && fbbox[2] > 180) {
                            edit = -360
                        }
                        if (fbbox[0] < -180 && fbbox[2] < -180) {
                            edit = 360
                        }

                        if (this.checkBboxEntering(fbbox, gClick, edit)) {
                            inClick = true;
                            if (feature["geometry"]["type"].toLowerCase() != "point") {
                                //Более точное попадание
                                var a = [];

                                var coords = JSON.parse(JSON.stringify(feature["geometry"]))["coordinates"];

                                a = map.layers[i].coordsToLines(coords, a, edit);

                                inClick = map.layers[i].getEntering(a, gClick, feature["geometry"]["type"]);
                            }

                        }
                        if (inClick) {
                            num = j;
                            map.layers[i].selectedObjects.push(num);
                        }
                    }
                }
            }
        },

        /**
         * Обработчик события `layercommand`
         * @method onLayerCommand
         * @param event
         */
        onLayerCommand: function(event){
            if (!event || !event.maplayer || !event.maplayer.act || !event.maplayer.id || !event.maplayer.subtype)
                return;
            if (event.maplayer.subtype != this.xId)
                return;
            if (event.maplayer.act == 'save') {
				this.saveToFile(event, this.crs);
			}
        },

        /**
         * Обработчик события `overlayRefresh`
         * @method onOverlayRefresh
         * @param event
         */
        onOverlayRefresh: function(event){
            if (this.visible) {
                this.getData();
            }
        },

        /**
         * Обработчик события `svgclick`
         * @method onSvgClick
         * @param event
         */
        /**
         * Отображение объектов локального слоя
         * @method drawMap
         * @param clear {Boolean} Если значение `true`- чистит холст
         * @public
         */
        drawMap: function (clear) {

            if (clear === undefined)
                clear = false;

            if (this.layerContainer) {
                if (this.layerContainer.drawingMethod) {
                    var els = $(this.layerContainer.drawingMethod.svgCanvasGroup);
                    if (els.length > 0) {
                        for (var i = 0; i < els.length; i++) {
                            $(els[i]).empty();
                        }
                    }
                }

                this.layerContainer.draw(this.GeoJSON, !clear, {typeField: this.typeField});
            }
        },

        /**
         * Сервисная функция смещения
         * @method setShift
         * @private
         */
        setShift: function () {
            return true;
        },

        /**
         * Получение семантики по идентификатору
         * @method getSemByObjNumber
         * @public
         * @param gid {String} Идентификатор семантики
         * @return {Object} Объект семантики в формате JSON
         */
        getSemByObjNumber: function (gid) {
            var sample = {};
            for (var i = 0; i < this.GeoJSON["features"].length; i++) {
                if (this.GeoJSON["features"][i]["properties"]["id"] == gid) {
                    var feature = this.GeoJSON["features"][i];
                    sample = this.getSemByObjKey(feature["properties"]["code"]);
                    for (var j = 0; j < sample["rscsemantics"].length; j++) {
                        var attr = sample["rscsemantics"][j]["shortname"];
                        if (attr && (feature["style"] || feature["properties"])) {
                            var value = null;
                            if (feature["style"] && feature["style"][attr])
                                value = feature["style"][attr];
                            if (feature["properties"] && feature["properties"][attr])
                                value = feature["properties"][attr];
                            if (value) {
                                if (sample["rscsemantics"][j]['type'] && sample["rscsemantics"][j]['type'].toString() == 16) {
                                    var code = sample['code'].toLowerCase();
                                    switch(code) {
                                        case 'line':
                                        case 'polygon':
                                            code = '4';
                                            break;
                                        case 'marker':
                                            code = '7';
                                            break;
                                        case 'title':
                                            code = '12';
                                            break;
                                    }
                                    this.setRscSemanticaValue(sample["rscsemantics"][j], value, code);
                                }
                                else {
                                    sample["rscsemantics"][j]["textvalue"] = sample["rscsemantics"][j]["value"] = value.toString();
                                }
                                // //sample["rscsemantics"][j]["value"] = value.toString();
                                // sample["rscsemantics"][j]["textvalue"] = sample["rscsemantics"][j]["value"] = value.toString();
                            }
                        }
                    }
                    break;
                }
            }
            return sample;
        },


        /**
         * Найти значение семантики тип классификатор для объекта графического слоя
         * @param layer
         * @param editobject
         * @param code
         * @returns {null|*}
         */
        setRscSemanticaValue: function(rscsemantics, semantic_value,  code) {
            if (rscsemantics && code && semantic_value) {
                var semantics = this.getSemanticWithList();
                for (var i = 0; i < semantics.length; i++) {
                    if (semantics[i]['code'] == code) {
                        if (semantics[i].reference) {
                            for (var j = 0; j < semantics[i].reference.length; j++) {
                                if (semantics[i].reference[j]['attr']) {
                                    if (semantics[i].reference[j]['attr'] == semantic_value) {
                                        rscsemantics.value = semantics[i].reference[j]['value'];
                                        rscsemantics.textvalue = semantics[i].reference[j]['text']
                                        return rscsemantics;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },


        /**
         * Получение списка семантик
         * @method getSemanticWithList
         * @public
         * @return {Array} Массив объектов списка семантик в формате JSON
         */
        getSemanticWithList: function () {
            return [{
                "code": "7",
                "key": "marker",
                "reference": [{
                    "value": "001",
                    "text": w2utils.lang("Star"),
                    "attr": "M2 14L30 14L8 30L16 2L24 30 z"
                }, {
                    "value": "002",
                    "text": w2utils.lang("Triangle"),
                    "attr": "M16 2L2 30L30 30 z"
                }, {
                    "value": "003",
                    "text": w2utils.lang("Circle"),
                    "attr": "M 2 16 a 7 7 0 0 0 28 0M 2 16 a 7 7 0 0 1 28 0"
                }, {
                    "value": "004",
                    "text": w2utils.lang("Square"),
                    "attr": "M 4 4L28 4L28 28L4 28 z"
                }, {
                    "value": "005",
                    "text": w2utils.lang("Rhombus"),
                    "attr": "M 16 2L26 16L16 30L6 16 z"
                }]
            }, {
                "code": "4",
                "key": "stroke-dasharray",
                "reference": [{
                    "value": "000",
                    "text": w2utils.lang("Solid"),
                    "attr": "none"
                }, {
                    "value": "001",
                    "text": w2utils.lang("Dashed") + " 1",
                    "attr": "5 10"
                }, {
                    "value": "002",
                    "text": w2utils.lang("Dashed") + " 2",
                    "attr": "10 5"
                }, {
                    "value": "003",
                    "text": w2utils.lang("Dashed") + " 3",
                    "attr": "15 9"
                }, {
                    "value": "004",
                    "text": w2utils.lang("Dash-dot") + " 1",
                    "attr": "15 10 5 10"
                }, {
                    "value": "005",
                    "text": w2utils.lang("Dash-dot") + " 2",
                    "attr": "5 5 1 5"
                }]
            }, {
                "code": "12",
                "key": "font-family",
                "reference": [{
                    "value": "Times New Roman",
                    "text": "Times New Roman",
                    "attr": "Times New Roman"
                }, {
                    "value": "Georgia",
                    "text": "Georgia",
                    "attr": "Georgia"
                }, {
                    "value": "Arial",
                    "text": "Arial",
                    "attr": "Arial"
                }, {
                    "value": "Verdana",
                    "text": "Verdana",
                    "attr": "Verdana"
                }, {
                    "value": "Courier New",
                    "text": "Courier New",
                    "attr": "Courier New"
                }, {
                    "value": "Lucida Console",
                    "text": "Lucida Console",
                    "attr": "Lucida Console"
                }]
            }

            ];
        },

        /**
         * Получение описания возможных объектов
         * @method getCreateObjects
         * @public
         * @return {Array} Массив описаний возможных объектов
         */
        getCreateObjects: function () {
            var types = ["Line", "Polygon", "Point", "Title"];
            var semantic = [];
            for (var i = 0; i < types.length; i++) {
                semantic.push(this.getSemByObjKey(types[i]));
            }
            return semantic;
        },

        /**
         * Получение семантики указанного типа объекта
         * @method getSemByObjKey
         * @private
         * @param key {String} Тип объекта
         * @return {Object} Объект семантики в формате JSON
         */
        getSemByObjKey: function (key) {
            var sample = {
                "code": "",
                "local": "",
                "name": "",
                "key": "",
                "rscsemantics": [],
                "cssimage": ""
            };
            key = key.toLowerCase();
            switch (key) {
                case "line" :
                case "linestring":
                    sample["code"] = "Line";
                    sample["local"] = "0";
                    sample["name"] = w2utils.lang("Line");
                    sample["key"] = "Line";
                    sample["rscsemantics"].push({
                        code: "0",
                        decimal: "0",
                        defaultvalue: "",
                        enable: "1",
                        maximum: "0",
                        minimum: "0",
                        name: w2utils.lang("Name"),
                        reply: "0",
                        service: "0",
                        shortname: "ObjName",
                        size: "255"
                    }, {
                        code: "1",
                        decimal: "0",
                        defaultvalue: "2",
                        enable: "3",
                        maximum: "12",
                        minimum: "1",
                        name: w2utils.lang("Stroke width"),
                        reply: "0",
                        service: "0",
                        shortname: "stroke-width",
                        size: "18",
                        type: "1",
                        unit: "px",
                        value: "2",
                        textvalue: "2"
                    }, {
                        code: "2",
                        decimal: "2",
                        defaultvalue: "0.75",
                        enable: "3",
                        maximum: "1.0",
                        minimum: "0.0",
                        name: w2utils.lang("Stroke opacity"),
                        reply: "0",
                        service: "0",
                        shortname: "stroke-opacity",
                        size: "18",
                        type: "1",
                        unit: "",
                        value: "0.75",
                        textvalue: "0.75"
                    }, {
                        code: "3",
                        decimal: "0",
                        defaultvalue: "#7F7FFF",
                        enable: "3",
                        maximum: "0",
                        minimum: "0",
                        name: w2utils.lang("Stroke color"),
                        reply: "0",
                        service: "0",
                        shortname: "stroke",
                        size: "255",
                        type: "21",
                        unit: "",
                        value: "#7F7FFF",
                        textvalue: "#7F7FFF"
                    }, {
                        code: "4",
                        decimal: "0",
                        defaultvalue: "000",
                        enable: "3",
                        maximum: "3",
                        minimum: "1",
                        name: w2utils.lang("Stroke type"),
                        reply: "0",
                        service: "0",
                        shortname: "stroke-dasharray",
                        size: "18",
                        type: "16",
                        unit: "",
                        value: "000",
                        textvalue: "000"
                    });
                    break;
                case "polygon" :
                    sample["code"] = "Polygon";
                    sample["local"] = "1";
                    sample["name"] = w2utils.lang("Polygon");
                    sample["key"] = "Polygon";
                    sample["rscsemantics"].push({
                        code: "0",
                        decimal: "0",
                        defaultvalue: "",
                        enable: "1",
                        maximum: "0",
                        minimum: "0",
                        name: w2utils.lang("Name"),
                        reply: "0",
                        service: "0",
                        shortname: "ObjName",
                        size: "255"
                    }, {
                        code: "1",
                        decimal: "0",
                        defaultvalue: "2",
                        enable: "3",
                        maximum: "12",
                        minimum: "1",
                        name: w2utils.lang("Stroke width"),
                        reply: "0",
                        service: "0",
                        shortname: "stroke-width",
                        size: "18",
                        type: "1",
                        unit: "px",
                        value: "2",
                        textvalue: "2"
                    }, {
                        code: "2",
                        decimal: "2",
                        defaultvalue: "0.75",
                        enable: "3",
                        maximum: "1.0",
                        minimum: "0.0",
                        name: w2utils.lang("Stroke opacity"),
                        reply: "0",
                        service: "0",
                        shortname: "stroke-opacity",
                        size: "18",
                        type: "1",
                        unit: "",
                        value: "0.75",
                        textvalue: "0.75"
                    }, {
                        code: "3",
                        decimal: "0",
                        defaultvalue: "#7F7FFF",
                        enable: "3",
                        maximum: "0",
                        minimum: "0",
                        name: w2utils.lang("Stroke color"),
                        reply: "0",
                        service: "0",
                        shortname: "stroke",
                        size: "255",
                        type: "21",
                        unit: "",
                        value: "#7F7FFF",
                        textvalue: "#7F7FFF"
                    }, {
                        code: "4",
                        decimal: "0",
                        defaultvalue: "000",
                        enable: "3",
                        maximum: "3",
                        minimum: "1",
                        name: w2utils.lang("Stroke type"),
                        reply: "0",
                        service: "0",
                        shortname: "stroke-dasharray",
                        size: "18",
                        type: "16",
                        unit: "",
                        value: "000",
                        textvalue: "000"
                    }, {
                        code: "5",
                        decimal: "2",
                        defaultvalue: "0.3",
                        enable: "3",
                        maximum: "1.0",
                        minimum: "0.0",
                        name: w2utils.lang("Fill opacity"),
                        reply: "0",
                        service: "0",
                        shortname: "fill-opacity",
                        size: "18",
                        type: "1",
                        unit: "",
                        value: "0.3",
                        textvalue: "0.3"
                    }, {
                        code: "6",
                        decimal: "0",
                        defaultvalue: "0",
                        enable: "3",
                        maximum: "0",
                        minimum: "0",
                        name: w2utils.lang("Fill color"),
                        reply: "0",
                        service: "0",
                        shortname: "fill",
                        size: "255",
                        type: "21",
                        unit: "",
                        value: "#7F7FFF",
                        textvalue: "#7F7FFF"
                    });
                    break;
                case "point" :
                    sample["code"] = "Point";
                    sample["local"] = "2";
                    sample["name"] = w2utils.lang("Marker");
                    sample["key"] = "Point";
                    sample["rscsemantics"].push({
                        code: "0",
                        decimal: "0",
                        defaultvalue: "",
                        enable: "1",
                        maximum: "0",
                        minimum: "0",
                        name: w2utils.lang("Name"),
                        reply: "0",
                        service: "0",
                        shortname: "ObjName",
                        size: "255"
                    }, {
                        code: "1",
                        decimal: "0",
                        defaultvalue: "2",
                        enable: "3",
                        maximum: "12",
                        minimum: "1",
                        name: w2utils.lang("Stroke width"),
                        reply: "0",
                        service: "0",
                        shortname: "stroke-width",
                        size: "18",
                        type: "1",
                        unit: "px",
                        value: "2",
                        textvalue: "2"
                    }, {
                        code: "2",
                        decimal: "2",
                        defaultvalue: "0.75",
                        enable: "3",
                        maximum: "1.0",
                        minimum: "0.0",
                        name: w2utils.lang("Stroke opacity"),
                        reply: "0",
                        service: "0",
                        shortname: "stroke-opacity",
                        size: "18",
                        type: "1",
                        unit: "",
                        value: "0.75",
                        textvalue: "0.75"
                    }, {
                        code: "3",
                        decimal: "#7F7FFF",
                        defaultvalue: "0",
                        enable: "3",
                        maximum: "0",
                        minimum: "0",
                        name: w2utils.lang("Stroke color"),
                        reply: "0",
                        service: "0",
                        shortname: "stroke",
                        size: "255",
                        type: "21",
                        unit: "",
                        value: "#7F7FFF",
                        textvalue: "#7F7FFF"
                    }, {
                        code: "4",
                        decimal: "000",
                        defaultvalue: "1",
                        enable: "3",
                        maximum: "3",
                        minimum: "1",
                        name: w2utils.lang("Stroke type"),
                        reply: "0",
                        service: "0",
                        shortname: "stroke-dasharray",
                        size: "18",
                        type: "16",
                        unit: "",
                        value: "000",
                        textvalue: "000"
                    }, {
                        code: "5",
                        decimal: "2",
                        defaultvalue: "0.3",
                        enable: "3",
                        maximum: "1.0",
                        minimum: "0.0",
                        name: w2utils.lang("Fill opacity"),
                        reply: "0",
                        service: "0",
                        shortname: "fill-opacity",
                        size: "18",
                        type: "1",
                        unit: "",
                        value: "0.3",
                        textvalue: "0.3"
                    }, {
                        code: "6",
                        decimal: "0",
                        defaultvalue: "0",
                        enable: "3",
                        maximum: "0",
                        minimum: "0",
                        name: w2utils.lang("Fill color"),
                        reply: "0",
                        service: "0",
                        shortname: "fill",
                        size: "255",
                        type: "21",
                        unit: "",
                        value: "#7F7FFF",
                        textvalue: "#7F7FFF"
                    }, {
                        code: "7",
                        decimal: "0",
                        defaultvalue: "003",
                        enable: "3",
                        maximum: "3",
                        minimum: "1",
                        name: w2utils.lang("Marker"),
                        reply: "0",
                        service: "0",
                        shortname: "marker",
                        size: "18",
                        type: "16",
                        unit: "",
                        value: "003",
                        textvalue: "003"
                    });
                    break;
                case "title" :
                    sample["code"] = "Title";
                    sample["local"] = "3";
                    sample["name"] = w2utils.lang("Title");
                    sample["key"] = "Title";
                    sample["rscsemantics"].push({
                            code: "8",
                            decimal: "0",
                            defaultvalue: "0",
                            enable: "3",
                            maximum: "0",
                            minimum: "0",
                            name: w2utils.lang("Text"),
                            reply: "0",
                            service: "0",
                            shortname: "text",
                            size: "255"
                        }, {
                            code: "6",
                            decimal: "0",
                            defaultvalue: "0",
                            enable: "3",
                            maximum: "0",
                            minimum: "0",
                            name: w2utils.lang("Text color"),
                            reply: "0",
                            service: "0",
                            shortname: "fill",
                            size: "255",
                            type: "21",
                            unit: "",
                            value: "#7F7FFF",
                            textvalue: "#7F7FFF"
                        },
                        // { code: "5", decimal: "2", defaultvalue: "0.75", enable: "3", maximum: "0", minimum: "0", name: "Прозрачность текста", reply: "0", service: "0", shortname: "fill-opacity", size: "18", type: "1", unit: "", value: "0.75", textvalue: "0.75" },
                        // { code: "11", decimal: "0", defaultvalue: "0", enable: "1", maximum: "360", minimum: "-360", name: "Поворот текста", reply: "0", service: "0", shortname: "text-rotation", size: "18", type: "1", unit: "" },
                        {
                            code: "12",
                            decimal: "0",
                            defaultvalue: "Verdana",
                            enable: "3",
                            maximum: "72",
                            minimum: "1",
                            name: w2utils.lang("Font family"),
                            reply: "0",
                            service: "0",
                            shortname: "font-family",
                            size: "18",
                            type: "16",
                            unit: "",
                            value: "Verdana",
                            textvalue: "Verdana"
                        }, {
                            code: "13",
                            decimal: "0",
                            defaultvalue: "12",
                            enable: "3",
                            maximum: "72",
                            minimum: "1",
                            name: w2utils.lang("Font size"),
                            reply: "0",
                            service: "0",
                            shortname: "font-size",
                            size: "18",
                            type: "1",
                            unit: "",
                            value: "12",
                            textvalue: "12px"
                        }, {
                            code: "14",
                            decimal: "0",
                            defaultvalue: "1",
                            enable: "3",
                            maximum: "10",
                            minimum: "1",
                            name: w2utils.lang("Letter spacing"),
                            reply: "0",
                            service: "0",
                            shortname: "letter-spacing",
                            size: "18",
                            type: "1",
                            unit: "",
                            value: "1",
                            textvalue: "1"
                        }, {
                            code: "15",
                            decimal: "0",
                            defaultvalue: "2",
                            enable: "3",
                            maximum: "10",
                            minimum: "1",
                            name: w2utils.lang("Start offset"),
                            reply: "0",
                            service: "0",
                            shortname: "startOffset",
                            size: "18",
                            type: "1",
                            unit: "",
                            value: "2",
                            textvalue: "2%"
                        });
                    break;
            }
            sample["rscsemantics"].splice(1, 0, {
                code: "30",
                decimal: "",
                defaultvalue: "0",
                enable: "1",
                maximum: "0",
                minimum: "0",
                name: w2utils.lang("Comment"),
                reply: "0",
                service: "0",
                shortname: "ObjCComm",
                size: "255",
                type: "0",
                unit: ""
            });
            return sample;
        },

        /**
         * Добавление элементов слоя в панель объектов
         * @method addToObjectPane
         * @public
         * @param json {Object} Объект в формате JSON
         * @param layer {String} Идентификатор слоя
         * @return {Element} HTML-элемент для добавления
         */
        addToObjectPane: function (json, layer) {
            var feature = document.createElement('div');
            feature.className = 'panel-info-rowfeature';

            feature.id = json["properties"]["id"];
            // имя объекта (заголовок)
            var el = GWTK.DomUtil.create('div', '');
            var img = GWTK.DomUtil.create('img', 'panel-info-img-search');
            img.src = GWTK.imgMarkerBlankRed;
            $(img).attr('layerId', layer);
            $(img).attr('objId', feature.id);
            $(el).append(img);
            $(feature).append(el);

            var eltitle = document.createElement('span');
            eltitle.className = 'panel-info-title';

            var key = "";
            var name = "";
            if (json["properties"]["name"] != null) {
                name += json["properties"]["name"];
            }
            if (json["properties"]["key"] != null) {
                name += (name != "" ? ", " : "");
                key = json["properties"]["key"].toLowerCase();
                switch (key) {
                    case "line" :
                        name = w2utils.lang("Line");
                        break;
                    case "polygon" :
                        name = w2utils.lang("Polygon");
                        break;
                    case "point" :
                        name = w2utils.lang("Marker");
                        break;
                    case "title" :
                        name = w2utils.lang("Title");
                        break;
                }
            }

            if (name) {
                $(eltitle).html(name);
                $(el).append(eltitle);
            }

            $(feature).append(GWTK.DomUtil.create('div', 'panel-info-objname'));
            var row = null;
            if (json["properties"]["text"] != null) {
                row = GWTK.DomUtil.create('div', 'panel-info-text');
                row.id = 'panel_info_objname';
                el = GWTK.DomUtil.create('span', 'panel-info-text-title');
                $(el).html(w2utils.lang("Text") + ":");
                $(row).append(el);
                el = GWTK.DomUtil.create('span', 'panel-info-text');
                $(el).html(json["properties"]["text"]);
                $(row).append(el);
                $(feature).append(row);
            }
            if (json["properties"]["ObjCComm"] != null) {
                row = GWTK.DomUtil.create('div', 'panel-info-text');
                row.id = 'panel_info_objname';
                el = GWTK.DomUtil.create('span', 'panel-info-text-title');
                $(el).html(w2utils.lang("Comment") + ":");
                $(row).append(el);
                el = GWTK.DomUtil.create('span', 'panel-info-text');
                $(el).html(json["properties"]["ObjCComm"]);
                $(row).append(el);
                $(feature).append(row);
            }
            var options = {
                "vector-effect": "non-scaling-stroke",
                "stroke": "green",
                "stroke-width": "2px",
                "stroke-opacity": "0.75",
                "fill": "blue",
                "fill-opacity": "0.75",
                "background": "",
                "background-size": "auto auto",
                "objName": "SEM99",
                "marker": 'M2 14L30 14L8 30L16 2L24 30 z',
                "font-family": "Verdana",
                "font-size": "12px",
                "letter-spacing": "1",
                "startOffset": "2%",
                "stroke-dasharray": "none",
                //"text" : "Текст по умолчанию"
                "text": ""
            };
            for (key in json["properties"]) {
                if (["key", "name", "text", "ObjCComm", "id", "code", "schema"].indexOf(key) != -1 || options.hasOwnProperty(key) || json["properties"][key] == "")
                    continue;
                row = GWTK.DomUtil.create('div', 'panel-info-text');
                row.id = 'panel_info_objname';
                el = GWTK.DomUtil.create('span', 'panel-info-text-title');
                $(el).html(key + ":");
                $(row).append(el);
                el = GWTK.DomUtil.create('span', 'panel-info-text');
                $(el).html(json["properties"][key]);
                $(row).append(el);
                $(feature).append(row);
            }
            return feature;
        },

        /**
         * Получение объектов локального слоя для панели выбора объектов
         * @method getLocalObjects
         * @deprecated
         * @param shtml {Array} Массив HTML-элементов с выбранными объектами карты
         * @param map {GWTK.map} Объект карты
         * @return {Array} Массив с HTML-элемент для добавления в панель выбранных объектов
         */
        getLocalObjects: function (shtml, map) {
            var selectedFeatures = map.selectedObjects;                     // 16/02/17
            if (!shtml || shtml[0] == "exceptionreport") {
                shtml = ['wmts_getfeatureinfo', ""];
                selectedFeatures = GWTK.Util.clearselectedFeatures(map);
            }
            var layers = [];
            var pane_feature_main = document.createElement('div');
            pane_feature_main.id = "localmaps_container";

            var pane_feature = document.createElement('div'); // контейнер результата
            var allLayers = map["layers"];
            for (var i = 0; i < allLayers.length; i++) {
                if (allLayers[i].url == "" && allLayers[i].selectedObjects
                    && allLayers[i].selectedObjects.length > 0) {
                    layers.push(allLayers[i].id);
                    for (var j = 0; j < allLayers[i].selectedObjects.length; j++) {
                        if (allLayers[i].selectObject == 1) {
                            selectedFeatures.addJsonObject(allLayers[i].GeoJSON, allLayers[i].selectedObjects[j], allLayers[i]);
                            var json = allLayers[i].GeoJSON["features"][allLayers[i].selectedObjects[j]];
                            pane_feature.appendChild(GWTK.graphicLayer.prototype.addToObjectPane(json, allLayers[i].id));
                        }
                    }
                    allLayers[i].selectedObjects = [];
                }
            }

            $(pane_feature_main).append(pane_feature);
            if ($(pane_feature)[0].children.length > 0)
                if (shtml[1] == "")
                    shtml[1] = pane_feature_main;
                else
                    $(shtml[1]).prepend(pane_feature_main);
            return [shtml[0], shtml[1]];
        },

        /**
         * Заполнение списка выбранных объектов для панели выбора объектов
         * @method fillSelectedFeatures
         * @public
         * @param map {GWTK.map} Объект карты
         * @param selectedFeatures { GWTK.selectedFeatures} Объект набора объектов
         */
        fillSelectedFeatures: function (map, selectedFeatures) {
            GWTK.UtilGraphicLayer.fillSelectedFeatures(map, selectedFeatures);
        },


        /**
         * Преобразование многомерного массива координат в двухмерный
         * @method coordsToLines
         * @private
         * @param coordinates {Array} Многомерный массив координат
         * @param a {Array} Промежуточный двухмерный массив координат
         * @return {Array} Результирующий двухмерный массив координат
         */
        coordsToLines: function (coordinates, a, edit) {
            for (var i = 0; i < coordinates.length; i++) {
                if (typeof (coordinates[i]) == "object") {
                    this.coordsToLines(coordinates[i], a, edit);
                }
            }
            if (typeof (coordinates[0]) != "object") {
                a[a.length] = [null, null];

                if (edit) {
                    coordinates[0] += edit;
                }

                a[a.length - 1][0] = parseFloat(coordinates[0]);
                a[a.length - 1][1] = parseFloat(coordinates[1]);
            }
            return a;
        },


        /**
         * Проверить вхождение точки в объект
         * @method getEntering
         * @public
         * @param a {Array} Массив координат (простая последовательность точек)
         * @param point {Object} Географические координаты точки
         * @param type {String} Тип (если не polygon, то будет считаться линией)
         * @return {Boolean} Возвращает `true`, если точка принадлежит объекту
         */
        getEntering: function (a, point, type) {
            var x = point.lng;//записываем ее координаты в переменные х и у
            var y = point.lat;
            var first, second;

            //проверка принадлежности точки одной из сторон мн-ка
            for (var i = 0; i < a.length - 1; i++)//проверяем, лежит ли данная точка на какой-нибудь из сторон прямоугольника
            {
                first = a[i];
                second = a[i + 1];
                if (this.pointInSegment ([x,y], first, second, this.deltaLine)) {
                    return true;
                }

            }

            if (type.toLowerCase() != "polygon")//если точка не лежит на линии, то возвращаем false
                return false;
            //если данная точка не лежит ни на одной строне многоугольника, то выполняем следующее
            var ct = 0;//счетчик, в который записывается кол-во пересечений многоугольника лучом
            for (i = 0; i < a.length - 1; i++)//перебираем каждую сторону мн-ка
            {
                first = a[i];
                second = a[i + 1];
                //проверяем, пересекает ли прямая отрезок (сторону)
                if (((y - first[1]) * (y - second[1])) < 0) { //"<" означает, что мы не берем случай, когда прямая проходит через концы отрезка
                    //проверка с какой стороны точка
                    if (x < ((y - first[1]) * (second[0] - first[0]) / (second[1] - first[1]) + first[0])) {
                        ct++;//если справа - увеличиваем счетчик на единицу
                    }
                }
                //если данная сторона лежит на луче
                else if ((first[1] == second[1]) && (y == first[1])) {
                    var l, r;
                    if (i == 0)
                        l = a.length - 1;
                    else
                        l = i - 1;
                    if (i == a.length - 1)
                        r = 0;
                    else
                        r = i + 2;
                    //если \_   или  _/ , то добавляем к счетчику единицу
                    //       \      /
                    //                _
                    //если \_/  или  / \ , то добавляем к счетчику двойку
                    if (((y - a[l][1]) * (y - a[r][1])) < 0) {
                        ct++;
                    } else if (((y - a[l][1]) * (y - a[r][1])) > 0) {
                        ct += 2;
                    }
                }
                //если же прямая проходит через конец отрезка, тогда
                //проверяем, как расположены стороны относительно данной точки
                else if (y == first[1]) {
                    var h;
                    if (i == 0)
                        h = a.length - 1;
                    else
                        h = i - 1;
                    //если стороны расположены:
                    //  \ или /
                    //  /     \ ,то прибавляем к счетчику единицу

                    //если стороны расположены:
                    //  \/  или /\ ,
                    //то прибавляем к счетчику двойку
                    if (((y - a[h][1]) * (y - second[1])) < 0) {
                        ct++;
                    } else if (((y - a[h][1]) * (y - second[1])) > 0) {
                        ct += 2;
                    }
                }
            }
            return ct % 2 != 0;
        },

        /**
         * Вычисление границ объекта из массива координат
         * @method coordsArray
         * @private
         * @param coordinates {Array} Массив координат
         * @param bbox {Array} Текущие координаты границ объекта
         * @return {Array} Результирующие координаты границ объекта
         */
        coordsArray: function (coordinates, bbox) {
            for (var i = 0; i < coordinates.length; i++) {
                if (typeof (coordinates[i]) == "object") {
                    this.coordsArray(coordinates[i], bbox);
                }
            }
            if (typeof (coordinates[0]) != "object") {
                var coord = [];
                coord[0] = parseFloat(coordinates[0]);
                coord[1] = parseFloat(coordinates[1]);
                if (!bbox[0] || bbox[0] > coord[0])
                    bbox[0] = coord[0];
                if (!bbox[1] || bbox[1] > coord[1])
                    bbox[1] = coord[1];
                if (!bbox[2] || bbox[2] < coord[0])
                    bbox[2] = coord[0];
                if (!bbox[3] || bbox[3] < coord[1])
                    bbox[3] = coord[1];
            }
            return bbox;
        },

        /**
         * Добавить узел слоя в панель Состав карты (дерево слоев)
         * @method addLayerTo
         * @public
         * @param id {String}    Идентификатор слоя
         * @param alias {String} Название слоя
         * @param params {Object} Параметры родительской группы {id:"Идентификатор", text:"Название группы", "img":"icon-page"}
         * @param legendItems {Array} - Массив элементов легенды в виде w2ui.nodeItem {"id":'',"img":'', "text":''}
         */
        addLayerTo: function (id, alias, params, legendItems) {
            var data = {};
    
            // добавить node в группу
            data = {
                "id": id,
                "group": false,
                "clickable": true,
                "isLayer": true,
                // "gClickable": true,
                // "expanded": false,
                "img": params["img"] || "",
                "parentId": 'userlayers',
                "isLocalLayer": true,
                "nodeType": 4
            };
    
            data.text = alias;
            data.eventPanelId = params["eventPanelId"] || this.map.eventPane.id;
            data.showsettings = this.map.options.showsettings;
    
            this.map.onLayerListChanged(data);
        },

        /**
         * Обработка нажатия кнопки "Сохранить"
         * @method saveToFile
         * @private
         * @param event {Object} Событие
		 * @param crs {Number} Код системы координат
         */
        saveToFile: function (event, crs) {
            var id = event.maplayer.id;
            if (!id)
                return false;
            var el = $('#btsave_' + id);
            if (el.length == 0)
                return false;

            var filename = el.attr("name") + ".json",
                glayer = this.map.tiles.getLayerByxId(id),
                a = el.find("a");

            if (!glayer)
                return false;
            event.stopPropagation();
            
            var saveData = (function () {
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                return function (data, fileName) {
                    var json = JSON.stringify(data),
                        blob = new Blob([json], {type: "application/octet-stream"}),
                        url = window.URL.createObjectURL(blob);
                    var ua = navigator.userAgent;
                    if (ua.search(/Trident/) != -1) {
                        //IE
                        window.navigator.msSaveBlob(blob, filename);
                        return true;
                    }
                    a.setAttribute('href', url);
                    a.setAttribute('download', fileName);
                    a.click();
                    setTimeout(function(){
                       window.URL.revokeObjectURL(url);
                    }, 100);
                };
            }());

            // Сделаем копию GeoJSON, но идентификаторы объектов без названия слоя
            var styles = null;
            if (this.loadedCss && this.typeField){
                styles = {'style':this.loadedCss, 'typeField': this.typeField};
            }
            var newjson = this.clearIdJSON(glayer.GeoJSON, styles);
            if (newjson) {
			  if ([ 3857, 900913, 102100, 102113 ].indexOf(crs) !== -1) {
			    // преобразовать в геодезические координаты
			    if (typeof newjson.bbox !== 'undefined') {
				  var coord1 = GWTK.UtilGraphicLayer.latLngToMetrics([ newjson.bbox[0], newjson.bbox[1] ], 3857);
				  var coord2 = GWTK.UtilGraphicLayer.latLngToMetrics([ newjson.bbox[2], newjson.bbox[3] ], 3857);
				  newjson.bbox = Array.prototype.concat([ coord1[0], coord1[1] ], [ coord2[0], coord2[1] ]);
			    }
			    for (i = 0; i < newjson.features.length; i++) {
			      if (typeof newjson.features[i].bbox !== 'undefined') {
				    var coord1 = GWTK.UtilGraphicLayer.latLngToMetrics([ newjson.features[i].bbox[0], newjson.features[i].bbox[1] ], 3857);
				    var coord2 = GWTK.UtilGraphicLayer.latLngToMetrics([ newjson.features[i].bbox[2], newjson.features[i].bbox[3] ], 3857);
				    newjson.features[i].bbox = Array.prototype.concat([ coord1[0], coord1[1] ], [ coord2[0], coord2[1] ]);
			      }
			      var coords = GWTK.UtilGraphicLayer.latLngsToMetrics(newjson.features[i].geometry.coordinates, 3857);
                  newjson.features[i].geometry.coordinates = coords;
                }
			  }
			  if (typeof crs !== 'undefined') {
			    newjson.crs = {
                  "type": "name",
                  "properties": {
                    "name": "urn:ogc:def:crs:EPSG::" + crs
                  }
			    }
			  }
              saveData(newjson, filename);
            }
            return true;
        },


        /**
         * Удалить слой локальной карты
         * @method deleteMap
         * @private
         * @param event {Object} Событие
         */
        deleteMap: function (event) {
            var mapContent = GWTK.maphandlers.map.mapTool('mapcontent');
            var id = event.maplayer.id;
            if (!id)
                return;
            if (!event.maplayer.act || event.maplayer.act != 'remove')
                return;

            var glayer = this.map.tiles.getLayerByxId(id);
            if (!glayer)
                return;
            event.stopPropagation();

            // удалить из карты
            this.map.closeLayer(id);

            // удалить из дерева
            GWTK.Util.removeTreeNode(mapContent.name, id);
        },

        /**
         * Загрузка слоя из GeoJSON
         * @method loadFromGeoJson
         * @public
         * @param json {Object} Локальная карт в формате JSON
         * @param params {Object} Параметры в формате JSON
         * @param clear{boolean} - очищать слой или нет
         * @return {Boolean} Возврачает `true` в случае успешной загрузки,
         * иначе вернет `false`
         */
        loadFromGeoJson: function (json, params, clear) {
            // Остановить таймер
            clearInterval(this.timerId);

            if (!json)
                return false;

            this.crs = undefined;

            if (json.crs) {
                var crs = GWTK.UtilGraphicLayer.getCrsCode(json.crs);
                if (crs && crs > -1) {
					if ([ 4326, 3857, 900913, 102100, 102113 ].indexOf(crs) !== -1) {
					  // допустимые системы координат
					  this.crs = crs;
					  if ([ 3857, 900913, 102100, 102113 ].indexOf(crs) !== -1) {
						json = GWTK.UtilGraphicLayer.coordsToGeo(json);
					  }
					}
					else {
					  this.error = true;
					  console.log(w2utils.lang('Unsupported coordinate system!'));
					  w2alert(w2utils.lang('Unsupported coordinate system!'));
					  return false;
					}
                }
            }
			json = this.checkFields(json);

            // добавить в идентификатор объекта идентификатор слоя
            this.GeoJSON  = this.expandIdJSON(json);

            // Обновить text из title
            this.updateFeaturesPropertiesText(this.GeoJSON.features, 'title');

            if (params) {
                this.setStyle(params);
            }
            else {
                if (this.loadedCss) {
                    this.setStyle({
                        style: this.loadedCss
                    });
                }
            }

            this.drawMap(clear);

            this.setOpacity(this.initOpacity());

            // Если обновление по timeout
            if (this.updateparameters && this.updateparameters.updatetime){
                this.timerId = setInterval(this.timertick, this.updateparameters.updatetime);
            }

            return true;
        },

        /**
         * Загрузка стилей
         * @method setStyle
         * @public
         * @param params {Object} Параметры в формате json
         */
        setStyle: function (params) {
            if (!params || !params.style) {
                this.loadedCss = null;
                return;
            }

            this.typeField = params.typeField || 'objecttype';
            if (params.defaultStyle) {
                this.style = params.defaultStyle;
            }
            this.loadedCss = params.style;

            // Обновим данные
            if (this.GeoJSON) {
                for (var i in this.GeoJSON.features) {
                    if (this.GeoJSON.features.hasOwnProperty(i)) {
                        var options = null;
                        if (this.GeoJSON.features[i]['properties']) {
                            if (this.GeoJSON.features[i]['properties'][this.typeField]) {
                                options = this.loadedCss[this.GeoJSON.features[i]['properties'][this.typeField]];
                            }
                        }
                        this.GeoJSON.features[i]['style'] = options || this.GeoJSON.features[i]['style'] || this.style;

                        // Добавим стили к подписям
                        if (options) {
                            this.addTitlesStyle(this.GeoJSON.features[i], options);
                        }
                    }
                }
            }

        },

        /**
         * Создать легенду для загружаемого слоя.
         * @public
         * @method createLegend
         * @param GeoJSON {Object} объекты локального слоя в формате GeoJSON
         * @returns {object} список с легендой
         *                   или пустой список при ошибке
         */
        createLegend: function (GeoJSON) {

            var legend, objectCodes;

            legend = [];

            // Собрать легенду по стилям за исключением несуществующих объектов
            if (!$.isEmptyObject(this.loadedCss)) {

                objectCodes = this.collectGeoJSONCodes(GeoJSON, this.typeField);
                legend = this.getLegendFromStyle(this.loadedCss, objectCodes);

            } else if (!$.isEmptyObject(GeoJSON) && !$.isEmptyObject(GeoJSON.features)) {
                // Собрать легенду по известным объектам

                legend = this.getLegendFromFeatures(GeoJSON);

            }

            return legend;

        },

        /**
         * Собрать коды семантик у объектов из GeoJSON.
         * @method collectGeoJSONCodes
         * @param GeoJSON {object} GeoJSON локального слоя
         * @param typeField {string} параметр, по которому определяется код семантики
         * @returns {object} список кодов объектов в формате: "код" -> true
         */
        collectGeoJSONCodes: function (GeoJSON, typeField) {

            var codes, i, code;

            codes = {};
            for (i in GeoJSON.features) {
                code = GeoJSON.features[i].properties[typeField];
                codes[code] = true;
            }

            return codes;

        },

        /**
         * Получить элементы легенды на основе загруженных стилей (loadedCss).
         * @method getLegendFromStyle
         * @param styles {object} стили loadedCss
         * @param objectCodes {object} Список кодов семантик у объектов в формате: "код" -> true .
         *                              Если не указать, то фильтрации не будет.
         * @returns {object} список с легендой
         */
        getLegendFromStyle: function (styles, objectCodes) {

            var legend, k, style, name, svgImage, $svgIcon, svgElements, width, height;

            legend = [];

            for (k in styles) {
                if (!styles.hasOwnProperty(k) || (objectCodes && !objectCodes[k])) {
                    continue;
                }

                style = styles[k];
                name = style.name ? style.name : w2utils.lang('No name');

                // Проверить отметку
                if (!$.isEmptyObject(style.marker) && style.marker.image) {

                    // Добавить по изображению отметки
                    svgImage = style.marker.image;
                    $svgIcon = $(svgImage);

                } else {

                    // Создать изображение отметки по типу
                    svgElements = this.getSVGElementsFromType(style.type);
                    $svgIcon = this.getLegendSVGIcon(svgElements, style);

                }

                // Добавить дополнительные свойства
                width = $svgIcon.width() || parseInt($svgIcon.attr('width'), 10);
                height = $svgIcon.height() || parseInt($svgIcon.attr('height'), 10);
                if (width && height) {
                    $svgIcon.attr('viewBox', '0 0 ' + width + ' ' + height);
                    $svgIcon.css({ width: 16, height: 16 });
                }
                $svgIcon.css({ margin: '-3px 3px -3px -3px', verticalAlign: 'top' });
                $svgIcon.addClass('feather feather-flag info-svg');

                legend.push({
                    id: 'legend_graphic' + k + this.xId,
                    img: '',
                    text: this.getTextForLegendIcon($svgIcon, name)
                });

            }

            return legend;

        },

        /**
         * Получить элементы легенды на основе объектов (GeoJSON).
         * @method getLegendFromFeatures
         * @param GeoJSON {object} объекты локального слоя в формате GeoJSON
         * @returns {object} список с легендой
         */
        getLegendFromFeatures: function (GeoJSON) {

            var legend, i, feature, type, stroke, strokeOpacity, fill, fillOpacity, keyString, collector, name, p, skipFields,
                svgElements, $svgIcon;

            legend = [];
            collector = {};
            skipFields = [
                'id', 'mapid', 'schema', 'code', 'key', 'name',
                'objectcenterx', 'objectcentery', 'area', 'perimeter'
            ];

            for (i in GeoJSON.features) {
                if (GeoJSON.features.hasOwnProperty(i)) {

                    feature = GeoJSON.features[i];

                    if ($.isEmptyObject(feature)) {
                        continue;
                    }

                    // Пропустить элементы с признаком "не использовать"
                    if (!$.isEmptyObject(feature.properties) && feature.properties.skip) {
                        continue;
                    }

                    // Пропустить элементы без стилей
                    if ($.isEmptyObject(feature.style)) {
                        continue;
                    }

                    type = (!$.isEmptyObject(feature.geometry) ? feature.geometry.type : '').toString().trim();
                    stroke = (feature.style.stroke || '').toString().trim();
                    strokeOpacity = parseFloat(feature.style['fill-opacity'] || 1);
                    fill = (feature.style.fill || '').toString().trim();
                    fillOpacity = parseFloat(feature.style['fill-opacity'] || 1);

                    // Сформировать ключ для сборщика.
                    // Проверить существования данного стиля.
                    keyString = (type + stroke + fill).replace(/[\W]/g, '');
                    if (collector[keyString]) {
                        continue;
                    }
                    collector[keyString] = true;

                    // Создать подпись легенды
                    name = '';
                    // По названию в стилях
                    if (!$.isEmptyObject(feature.properties)) {
                        name = feature.properties.name;
                        // По ключам свойств
                        if (!name) {
                            for (p in feature.properties) {
                                if (feature.properties.hasOwnProperty(p) && typeof p === 'string') {
                                    if (skipFields.indexOf(p) !== -1) {
                                        name = feature.properties[p];
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    // Создать изображение отметки по типу
                    svgElements = this.getSVGElementsFromType(type);
                    $svgIcon = this.getLegendSVGIcon(svgElements, feature.style);

                    legend.push({
                        id: keyString + this.xId,
                        img: '',
                        text: this.getTextForLegendIcon($svgIcon, name)
                    });

                }
            }

            return legend;

        },

        /**
         * Получить элементы SVG-иконки на основании типа объекта:
         * - Polygon - прямоугольник со срезом;
         * - Line - диагональная линия;
         * - Point - жирная точка.
         *
         * @method getSVGElementsFromType
         * @param type
         * @returns {string}
         */
        getSVGElementsFromType: function (type) {

            var elementsHtml;

            type = (type + '').toLowerCase();
            if (type.indexOf('polygon') !== -1) {

                // Полигон
                elementsHtml = '<polyline points="2.5,2.5 13.5,2.5 13.5,8.5 8.5,13.5 2.5,13.5 2.5,2.5"/>';

            } else if (type.indexOf('line') !== -1) {

                // Линия
                elementsHtml = '<line x1="2.5" y1="13.5" x2="13.5" y2="2.5"/>';

            } else if (type.indexOf('point') !== -1) {

                // Точка
                elementsHtml = '<circle cx="7.5" cy="7.5" r="2.5"/>';

            } else {

                // Замещающая иконка (флажок)
                elementsHtml = '' +
                    '<path d="M0 10s1-1 4-1 3 2 6 2 4-1 4-0V2s-0 1-4 1-3-2-6-2-4 1-4 0z"></path>' +
                    '<line x1="0.5" y1="15.5" x2="0.5" y2="0.5"></line>';

            }

            return elementsHtml;

        },

        /**
         * Получить SVG-иконку для вставки в элемент легенды слоя.
         * @method getLegendFromFeatures
         * @param htmlInSvg {string} содержимое SVG
         * @param style {object} стили
         * @returns {string} вёрстка SVG-иконки
         */
        getLegendSVGIcon: function (htmlInSvg, style) {

            var $svg;

            $svg = $('' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"' +
                ' stroke="rgba(0,0,0,0.8)" stroke-width="1" fill="rgba(0,0,0,0.4)">' +
                htmlInSvg +
                '</svg>');
            $svg.attr(style);

            // Исправления
            if (style['stroke'] === 'transparent') {
                $svg.attr('stroke', 'gray');
            }
            if (style['stroke-width'] > 1) {
                $svg.attr('stroke-width', 1);
            }
            if (style['stroke-dasharray']) {
                $svg.attr('stroke-dasharray', '3 2');
            }

            return $svg;

        },

        /**
         * Создать вёрстку для элемента легенды из SVG-иконки и названия элемента.
         * @method getTextForLegendIcon
         * @param $svgIcon {object} JQuery-элемент иконки
         * @param name {string} название
         * @returns {string} вёрстка элемента легенды
         */
        getTextForLegendIcon: function ($svgIcon, name) {

            var svgHtml, text;

            svgHtml = $('<div></div>').append($svgIcon).html();
            text = '' +
                '<div style="white-space: nowrap;">' +
                svgHtml +
                '<span style="display: inline-block; white-space: normal;">' + name + '</span>' +
                '</div>';

            return text;

        },

        /**
         * Проверка полей JSON объектов, присвоение идентификатора
         * @method checkFields
         * @param json {Object} Локальная карта в формате JSON
         * @return {Object} Возвращает отредактированную карту в формате JSON
         * или `null` при ошибке в составе входных данных
         */
        checkFields: function (json) {
            if (!json)
                return null;
            if (!json['bbox']) {
                json['bbox'] = [];
            }
            var mapId = this.id;
            for (var i = 0; i < json["features"].length; i++) {
                var item = json["features"][i];
                if (!item["properties"])
                    item["properties"] = {};
                if (!item["properties"]["id"] || !/(.+)\./.exec(item["properties"]["id"])) {
                    var id = item["properties"]["id"] || GWTK.Util.createGUID();
                    item["properties"]["id"] = mapId + "." + id;
                }
                item["properties"]["code"] = item["geometry"]["type"];
                if (!item["bbox"] || item["bbox"].length < 4) {
                    var bbox = [];
                    item["bbox"] = this.coordsArray(item["geometry"]["coordinates"], bbox);
                }

                if (json["bbox"].length == 0) {
                    json["bbox"] = item["bbox"].slice();
                } else {
                    json["bbox"][0] = Math.min(json["bbox"][0], item["bbox"][0]);
                    json["bbox"][1] = Math.min(json["bbox"][1], item["bbox"][1]);
                    json["bbox"][2] = Math.max(json["bbox"][2], item["bbox"][2]);
                    json["bbox"][3] = Math.max(json["bbox"][3], item["bbox"][3]);
                }
            }
            return json;
        },

        /**
         * Перевод из координат экрана в геодезические координаты
         * @method pixel2geoOffset
         * @param x {int} координата по оси х
         * @param y {int} координата по оси y
         * @returns {array} Двухмерный массив [b, l]
         */
        pixel2geoOffset: function (x, y) {
            if (!x || !y) return;
            var p = GWTK.point(x, y);
            var coord = this.map.tiles.getLayersPointProjected(p);
            if (coord)
                return GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
        },

        /**
         * calcDeltaPoint - рассчитать дельту для получения габаритов точечных объектов
         * @param delta_px
         * @returns {number}
         */
        calcDeltaPoint: function(delta_px) {
            var geo1, geo2, coord, d = 0;
            if (!delta_px || !this.map)
                return d;

            coord = this.map.tiles.getLayersPointProjected(GWTK.point(0, 0));
            geo1 = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
            geo1 = new GWTK.LatLng(geo1[0], geo1[1]);
            coord = this.map.tiles.getLayersPointProjected(GWTK.point(0, delta_px));
            geo2 = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
            geo2 = new GWTK.LatLng(geo2[0], geo2[1]);
            d = geo1.distanceTo(geo2)/10000;
            if (!d) d = 0;
            return d;
        },


        /**
         * calcDeltaLine - рассчитать дельту для определения принадлежности точки отреку
         * @param delta_px
         * @returns {number}
         */
        calcDeltaLine: function(delta_px) {
            var geo1, geo2, coord, d = 0;
            if (!delta_px || !this.map)
                return d;

            coord = this.map.tiles.getLayersPointProjected(GWTK.point(0, 0));
            geo1 = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
            geo1 = new GWTK.Point(geo1[0], geo1[1]);
            coord = this.map.tiles.getLayersPointProjected(GWTK.point(0, delta_px));
            geo2 = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
            geo2 = new GWTK.Point(geo2[0], geo2[1]);
            d = geo1.distanceTo(geo2);
            if (!d) d = 0;
            return d;
        },

        /**
         * Проверка на попадание в границы объекта
         * @method checkBboxEntering
         * @param _bbox {Array} границы
         * @param point {GWTK.LatLng} координата по оси y
         * @returns {boolean} В случае попадания вернет `true`
         */
        checkBboxEntering: function (_bbox, point, edit) {
            var checked = true;
            var supLngs = {};

            var bbox = _bbox.slice(0);
            if (edit) {
                bbox[0] += edit;
                bbox[1] += edit;
            }
            var curBbox = bbox.slice(0);

            if (bbox[0] < -180) {
                curBbox[0] = -180;
                supLngs.max = [bbox[0] + 360, 180];
            }

            if (bbox[2] > 180) {
                curBbox[2] = 180;
                supLngs.min = [-180, bbox[2] - 360];
            }

            checked = this.pointInBox([point.lng, point.lat], [curBbox[0], curBbox[1]], [curBbox[2], curBbox[3]], this.deltaPoint || 0.005);



            return checked;
        },

        /**
         * Установить уровень прозрачности изображения
         * @method setOpacity
         * @param value {Number} значение прозрачности,
         * число из диапазона [0.0; 1.0], 0 - полная прозрачность
         */
        setOpacity: function (value) {
            if (isNaN(value) || !this.layerContainer) return;
            if (value > 1) value = 1.0;
            if (this.layerContainer.drawingMethod && this.layerContainer.drawingMethod.svgCanvas && this.layerContainer.drawingMethod.svgCanvas.style) {
                this.layerContainer.drawingMethod.svgCanvas.style.opacity = value;
            }
        },

       /**
         * Инициализировать прозрачность изображения по параметрам
         * @method initOpacity
         * @param opacity {Number} значение непрозрачности в % - от 0 до 100
         * @public
         */
        initOpacity: function (opacity) {
            if (!this.options ) {
                return;
            }

            if (!$.isNumeric(this.options.opacityValue)) { this.options.opacityValue = 100; }

            if ($.isNumeric(opacity)) {
                var new_opacity = parseInt(opacity);
                new_opacity > 100 ? new_opacity = 100 : {};
                new_opacity < 0 ? new_opacity = 0 : {};
                this.options.opacityValue = new_opacity;
            }

            return this.getOpacityCss();
        },

        /**
         * Получить непрозрачность css по параметрам
         * @method getOpacityCss
         * @param opacity {Number} значение непрозрачности в % - от 0 до 100
         * @return {Number} css значение непрозрачности
         * @public
         */
        getOpacityCss: function () {
            if (!this.options) return '';
            if (typeof this.options.opacityValue === 'undefined') {
                this.options.opacityValue = 100;
            }
            var opacity = this.options.opacityValue;
            if (window.localStorage) {
                var lstorage = JSON.parse(window.localStorage.getItem("opacitySettings"));
                if (lstorage) {
                    opacity = (lstorage[this.id] && lstorage[this.id]['value'] !== undefined) ? parseFloat(lstorage[this.id]['value']) : false;
                }
            }

            return (( Number(parseFloat(opacity) / 100.0)).toFixed(1));
            },

        /**
         * Добавление стилей к подписям, если есть классификатор
         * @method addTitlesStyle
         * @param feature {Object} - объект карты из geojson,
         * @param options {Object} - объект стилей из классификатора для geojson, например:
         *	"P0000030022": {                        // код стиля
		 *   "name": "Характеристика хранилища ХОО", // наименование стиля
		 *   "marker": {                             // описание точечного знака
		 *	    "width": "32px",
		 *	    "height": "32px",
		 *	    "image": "<svg width='50px' height='50px' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink= 'http://www.w3.org/1999/xlink'><image xlink:href='data/images/P0000030022.svg' x='0' y='0' height='50px' width='50px'/></svg>",
		 *	    "centerX": "16",
		 *	    "centerY": "16"
		 *    },
         *    "titles": {                             // описание подписи к знаку
         *       "SUBST_TYPE": {                      // ключ семантики
         *            "dx" : "-7.5",                  // смещение от левого верхнего угла по x (в пикселях)
         *            "dy" : "2",                     // смещение от левого верхнего угла по н (в пикселях)
         *            "style": "TITLE_ARIAL_BLACK_8"  // ссылка на описание стиля подписи в этом же файле (или объект, содержащий стили, например:
         *                    {
         *                    "font-family": "Arial",
         *                    "font-size": "8px",
         *                    "fill": "black",
         *                    "style":"text-decoration: underline;"
         *                    })
         *            },
         *       "MAX_NUMB": {
         *            "dx" : "-7.5",
         *            "dy" : "7",
         *            "style": "TITLE_ARIAL_BLACK_8"
         *            },
         *       "MAX_CONTENT": {
         *            "dx" : "0",
         *            "dy" : "7",
         *            "style": "TITLE_ARIAL_BLACK_8"
         *            }
         *     }
	     * }
         */
        addTitlesStyle: function (feature, options) {
            var text, options, style, refstyle;
            if (options && options.titles && feature && feature['properties'][this.typeField] && feature['properties'] && (text = feature['properties']['text'])) {
                if (text instanceof Array) {
                    for (var i = 0; i < text.length; i++) {
                        this._addTitleStyle(text[i], options);
                    }
                }
                    // если просто объект
                else {
                    this._addTitleStyle(text, options);
                }
            }
        },


        /**
         * Добавление стилей к подписи, если есть классификатор
         * @method addTitleStyle
         * @param feature {Object} - объект карты из geojson,
         * @param options {Object} - объект стилей из классификатора для geojson,
         */
        _addTitleStyle: function (text, options) {
            if (text && options) {
                if (!text.style) {
                    if (text['key'] && (style = options.titles[text['key']])) {
                        text.style = style;
                        // Добавим параметры из ссылки на стили
                        if (style.style) {
                            if (typeof (style.style) === 'string') {
                                refstyle = this.loadedCss[style.style];
                            }
                            else {
                                if (typeof (style.style) === 'object')
                                    refstyle = style.style;
                            }
                        }

                        // Допишем стили из ссылки на стили
                        if (refstyle) {
                            for (var key in refstyle) {
                                text.style[key] = refstyle[key];
                            }
                        }
                    }
                }
                else {
                    if (typeof (text.style) == 'string') {
                        options = this.loadedCss[text.style];
                        if (options) {
                            text['style'] = options;
                        }
                    }
                }
            }

        },

        /**
         * Очистить и получить json с идентификаторами объектов без идентификатора слоя и добавить стили (классификатор), если они есть
         * @method clearIdJSON
         * @param json
         * @param styles (Object) - {style:{}, typeField:'objecttype'}
         * @returns {json}
         */
        clearIdJSON: function(json, styles) {
            return GWTK.UtilGraphicLayer.clearIdJSON(json || this.GeoJSON, styles);
        },

        /**
         * Расширить и получить json с идентификаторами объектов с названием слоя
         * @method expandIdJSON
         * @param json
         * @param layerid (string) - идентификатор слоя
         * @returns {json}
         */
        expandIdJSON: function(json, layerid) {
            return GWTK.UtilGraphicLayer.expandIdJSON(json || this.GeoJSON, layerid || this.id);
        },

        /**
         * Принадлежность точки габаритам
         * @method pointInBox
         * @param t - Array - координаты точка
         * @param p1 - Array - координаты первой точки габаритов
         * @param p2 - Array - координаты второй точки габаритов
         * @param eps (Float) - допуск
         * @returns {boolean}
         */
        pointInBox: function(t, p1, p2, eps){
            return  (Math.abs (t[0] - Math.min(p1[0], p2[0])) <= eps || Math.min(p1[0], p2[0]) <= t[0]) &&
                (Math.abs (Math.max(p1[0], p2[0]) - t[0]) <= eps || Math.max(p1[0], p2[0]) >= t[0]) &&
                (Math.abs (t[1] - Math.min(p1[1], p2[1])) <= eps || Math.min(p1[1], p2[1]) <= t[1]) &&
                (Math.abs (Math.max(p1[1], p2[1]) - t[1]) <= eps || Math.max(p1[1], p2[1]) >= t[1]);
        },

        /**
         * Принадлежность точки отрезку
         * @method pointInSegment
         * @param t - Array - координаты точка
         * @param p1 - Array - координаты первой точки отрезка
         * @param p2 - Array - координаты второй точки отрезка
         * @param eps (Float) - допуск
         * @returns {boolean}
         */
        pointInSegment: function (t, p1, p2, eps) {
            var a = p2[1] - p1[1],
                b = p1[0] - p2[0],
                c = - a * p1[0] - b * p1[1];
            if (Math.abs(a * t[0] + b * t[1] + c) > eps)
                return false;
            return this.pointInBox (t, p1, p2, eps);
        }

    };
}
