/*************************************** Соколова Т.О. 23/04/19 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Компонент слой геомаркеров (карта)                    *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {
    /**
     * Компонент слой геомаркеров
     * @class GWTK.GeoMarkersLayer
     * @constructor GWTK.GeoMarkersLayer
     * @param map {GWTK.Mаp} - Карта
     * @param options {Object} - Параметры слоя
     * @param editingParam {Object} - Параметры редактирования
     {
     "editing": true,  // слой подлежить редактированию
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
     }    */

    GWTK.GeoMarkersLayer = function (map, options, editingParam) {
        this.isClusterizator = (options.type == 'geomarkers') ? true : false;
        this.format = this.type = "geomarkers";                 // Формат рисунков карты
        this.clusteroptions = (options && options.cluster) ? options.cluster :  {
            'useAnimation': true,
            'smallClusterLimit': 10,
            'mediumClusterLimit': 100,
            'largeClusterLimit': 1000,
            'veryLargeClusterLimit': 10000
        };
        this.markerhint = this.clusteroptions.markerhint || null;
        // Настроим hint
        if (this.markerhint) {
            if (this.markerhint.keys && !this.markerhint.propertiesname) {
                this.markerhint.propertiesname = '_clusterhint';
            }
            if (!this.markerhint.keys && this.markerhint.propertiesname) {
                this.markerhint = null;
            }
        }

        if (options) {
            this.merge = options.merge;
        }

        GWTK.graphicLayer.call(this, map, options, editingParam );

    };

    GWTK.GeoMarkersLayer.prototype = {

        /**
         * Получить тип слоя
         * @method getType
         * @public
         * @return {string} строка, 'geomarkers' - слой геомаркеров
         */
        getType: function () {
            if (typeof this.options.type !== 'undefined') {
                return this.options.type;
            }
            return this.type;
        },

        /**
         * Создание SVG-контейнера локального слоя
         * @method createSvg
         * @private
         */
        createSvg: function () {
            $(this.map.eventPane).on("svgclick", this.onSvgClick);
        },

        /**
         * Обработчик события `svgclick`
         * @method onSvgClick
         * @param event
         */
        onSvgClick: function(event){
            if (event && event.dataobject && event.dataobject.data) {
                // Поместим в список выделеннных объектов
                if (!this.options.merge) {   // Если объединенные слои, то пока не ищем !!!
                    this.selectedObjects = [];
                    var num = this.getNumberById(event.dataobject.data['id']);
                    if (num != null) {
                        this.selectedObjects.push(num);
                    }
                }
            }
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
            if (!json)
                return false;
            json = this.checkFields(json);
            if (params) {
                this.setStyle(params);
            }

            this.GeoJSON  = this.expandIdJSON(json);

            this.map.tiles.addMergeClusterizatorLayer(this);
            this.drawMap(clear);
            return true;
        },

        /**
         * Добавление properties hint
         * @method addHint
         * @returns GeoJSON слоя
         */
        addHint: function(hintPpropertiesName){
            if (this.markerhint){
                hintPpropertiesName = hintPpropertiesName || this.markerhint.propertiesname;
                for(var i in this.GeoJSON.features){
                    if (this.GeoJSON.features.hasOwnProperty(i)) {
                        if (this.GeoJSON.features[i]['properties']) {
                            for(var j in this.GeoJSON.features[i]['properties']){
                                this.GeoJSON.features[i]['properties'][hintPpropertiesName] = this.getHint(i);
                            }
                        }
                    }
                }
            }
            return this.GeoJSON;
        },

        /**
         * Удаление properties hint
         * @method deleteHint
         * @returns GeoJSON слоя
         */
        deleteHint: function(hintPpropertiesName){
            if (this.markerhint){
                hintPpropertiesName = hintPpropertiesName || this.markerhint.propertiesname;
                for(var i in this.GeoJSON.features){
                    if (this.GeoJSON.features.hasOwnProperty(i)) {
                        if (this.GeoJSON.features[i]['properties']) {
                            for(var j in this.GeoJSON.features[i]['properties']){
                                delete this.GeoJSON.features[i]['properties'][hintPpropertiesName];
                            }
                        }
                    }
                }
            }
            return this.GeoJSON;
        },

        /**
         * Получить хинт с информацией по объекту
         * @method getHint
         * @returns {string}
         */
        getHint: function(index){
            var res = "";
            if (index >= 0 ) {
                var feature = this.GeoJSON.features[index];
                if (feature.properties) {
                    var res = "";
                    for (var i in feature.properties) {
                        if (this.markerhint.keys) {
                            for (var j in this.markerhint.keys) {
                                if (i === j) {
                                    if (this.markerhint.keys[j]) {
                                        res += this.markerhint.keys[j] + ": " + feature.properties[i] + "<br>";
                                    }
                                    else {
                                        res += feature.properties[i] + "<br>";
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            return res;
        },
        /**
         * Отображение объектов локального слоя
         * @method drawMap
         * @param clear {Boolean} Если значение `true`- чистит холст
         * @public
         */
        drawMap: function (clear) {
            if (this.isClusterizator) {
                if (this.options.merge) {
                    this.map.tiles.clusterizatorMergeLayers = this.map.tiles.drawClusterizator(null);
                }
                else {
                    this.clusterizator = this.map.tiles.drawClusterizator(this);
                }
            }
        },

        /**
         * Удалить слой. Удаляет слой и его параметры в карте
         * @method onRemove
         * @public
         */
        onRemove: function () {
            if (this.options.merge){
                this.visible = false;
                this.map.tiles.showMergeClusterizatorLayers();
            }
            else {
                if (this.clusterizator) {
                    // this.clusterizator.clear();
                    this.clusterizator.destroy();
                    this.clusterizator = null;
                }
            }
            this.remove();
        },

        /**
         * Отобразить слой
         * @method show
         * @public
         */
        show: function () {
            var index = this.map.tiles.indexOfxIdInArray(this.map.layers, this.xId);
            this.visible = this.map.layers[index].visible = true;
            if (this.options.merge){
                this.map.tiles.showMergeClusterizatorLayers();
            }
            else {
                if (this.clusterizator) {
                    this.clusterizator.show();
                }
            }
        },

        /**
         * Скрыть слой
         * @method hide
         * @public
         */
        hide: function () {
            this.visible = false;
            var index = this.map.tiles.indexOfxIdInArray(this.map.layers, this.xId);
            this.visible = this.map.layers[index].visible = false;
            if (this.options.merge){
                this.map.tiles.showMergeClusterizatorLayers();
            }
            else {
                if (this.clusterizator) {
                    this.clusterizator.hide();
                }
            }
        },

        /**
         * Запросить контейнер изображений
         * @returns {*|void}
         */
        getLayerContainer: function(){
            if (this.clusterizator) {
                return this.clusterizator.getImageContainer();
            }
        },

        /**
         * Отобразить объект карты по идентификатору (Спозиционировать)
         * @method showObjectById
         * @public
         * @param gid {Object} идентификатор объекта
         */
        showObjectById: function (gid) {
            var feature = this.getObjectById(gid);
            if (this.options.merge){
                this.map.tiles.showMergeObjectById();
            }
            else {
                if (this.clusterizator) {
                    // this.clusterizator.showById();
                }
            }

        },

        /**
         * Очистить и получить json с идентификаторами объектов (без слоя)
         * @method clearIdJSON
         * @param json
         * @returns {json}
         */
        clearIdJSON: function(json, styles) {
            this.GeoJSON = GWTK.UtilGraphicLayer.clearIdJSON(json || this.GeoJSON, styles);
            return this.deleteHint();
        },

        /**
         * Расширить и получить json с идентификаторами объектов с названием слоя
         * @method expandIdJSON
         * @param json
         * @param layerid (string) - идентификатор слоя
         * @returns {json}
         */
        expandIdJSON: function(json, layerid) {
            this.GeoJSON = GWTK.UtilGraphicLayer.expandIdJSON(json || this.GeoJSON, layerid || this.id);
            return this.addHint();
        }

    };

    GWTK.Util.inherits( GWTK.GeoMarkersLayer, GWTK.graphicLayer);


    GWTK.geomarkerslayer = function (map, options, editingParam) {
        var geomarkerslayer = new GWTK.GeoMarkersLayer(map, options, editingParam);
        if (geomarkerslayer.error) {
            geomarkerslayer = null;
            return false;
        }
        return geomarkerslayer;
    };
}