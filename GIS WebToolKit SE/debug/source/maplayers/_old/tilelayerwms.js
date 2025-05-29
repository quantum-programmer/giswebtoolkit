/********************************** Нефедьева О.А. *** 22/07/20 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2019              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                   Управление тайловым wms слоем карты            *
*                                                                  *
*******************************************************************/
/*
  Класс TileLayerWms - загрузка, отображение изображений и управление слоем wms-тайлов.
  Класс TileLayerWms наследует класс TileLayer, описание прототипа - объект proto_tiledwms. 
  Изображения тайлов динамически формируются на сервере через wms-запрос.  
  Основным параметром слоя является адрес сервера wms (options.url). 
  Слои создаются динамически, хранятся в коллекции layers класса карты Map. 
  Конструктор TileLayerWms принимает два параметра – объект GWTK.Map и объект параметров - options. 
  После создания объекта TileLayerWms необходимо добавить его в коллекцию слоев карты методом onAdd().
*/
if (window.GWTK) {

    var proto_tiledwms = {
        /**
         * Инициализация 
         * @method init
         */
        init: function (map, options) {

            GWTK.TileLayerOld.prototype.init.call(this, map, options);

            var type = this.options.pkkmap || this.options.tilewms;
            if (typeof type === "undefined") {
                return;
            }
            this._tiledWms = parseInt(type);
            this.tileWidth = 1024;
            this.tileHeight = 1024;
            
            var params = GWTK.Util.getParamsFromURL(this.options.url);
            if (params.height !== undefined && params.width !== undefined) {
                this.tileWidth = parseInt(params.width);
                this.tileHeight = parseInt(params.height);
            }
            this._tileSize = GWTK.point(this.tileWidth, this.tileHeight);
            this._getTileCount();
            this.map.tiles.viewOrder.push(options.id);
        },

        getType: function () {
            return 'tile';
        },

        /**
         * Установить параметры слоя 
         * @method setOptions
         */
        setOptions: function () {
            GWTK.TileLayerOld.prototype.setOptions.call(this);
            if (!this._tiledWms) { return; }
            if (this.tileWidth == 1024 && typeof this.options["tilematrixset"] === "undefined") {
                this.options["tilematrixset"] = "EPSG:3857";
            }
            var param = GWTK.Util.getParamsFromURL(this.serverUrl);
            this.layers = param['layers'];                                  // ids слоев Росреестра
            this.idLayer = "";                                              // id giswebservicese
            if (param.srs !== undefined && param.srs == "EPSG:900913") {
                this.options["tilematrixset"] = "GoogleMapsCompatible";
            }
        },

        /**
         * Получить ссылку по координатам тайла
         * @method getTileUrl
         * @param coords {GWTK.Point} координаты тайла, x-номер строки, y-номер столбца, z - zoom
         * @return {string} строка запроса рисунка тайла
         */
        getTileUrl: function (coords) {
            if (this.bounds != null) {
                if (coords.y < this.bounds.rows[0] || coords.y > this.bounds.rows[1] || coords.x < this.bounds.colls[0] || coords.x > this.bounds.colls[1])
                    return this.errorImage;
            }
            if (!this.visible || !this.checkViewZoom()) {
                return this.errorImage;
            }
            
            if (this.getRowFunction) {
                var r = this.getRowFunction({ "row": coords.y, "z": this.map.options.tilematrix });
                coords.y = r;
            }
 
            var box = this._tileCoordsToSeNw(coords);
            
            var bbox = this._getBboxOfTile(box);

            if (!bbox) {
                return this.errorImage;
            }

            //var src = this.serverUrl.replace(/%bbox/, "3913575.8482124396%2C7514065.628538927%2C4070118.8821405396%2C7670608.662467029");
            
            return this.serverUrl.replace(/%bbox/, bbox);
        },

        /**
          * Получить параметр bbox
          * @method _getBboxOfTile
          * @param box {Array} массив координат, габариты тайла (se,nw)
          * @return {string} строка bbox
          */
        _getBboxOfTile: function (box) {

            if (!$.isArray(box) || box.length != 4) {
                return false;
            }
            return box.join(',');
        },

        /**
          * Преобразовать координаты тайла в матрице в метры
          * @method _getBboxOfTile
          * @param coords {GWTK.Point} координаты, x-номер строки, y-номер столбца, z - zoom 
          * @return {Array} массив координат, габариты тайла (se,nw), метры
          */
        _tileCoordsToSeNw: function (coords) {
            var nwPixels = coords.scaleBy(this._tileSize),
                sePixels = nwPixels.add(this._tileSize),
                matrix = GWTK.TileMatrixSets[this.options.tilematrixset],
                nw = GWTK.tileView.pixel2plane(this.map, nwPixels, coords.z, matrix),
                se = GWTK.tileView.pixel2plane(this.map, sePixels, coords.z, matrix);

            return [nw.x.toFixed(9), se.y.toFixed(9), se.x.toFixed(9), nw.y.toFixed(9)];
        }
    };

    /**
     * Класс TileLayerWms - тайловый wms-слой
     * @class GWTK.TileLayerWms, базовый класс GWTK.TileLayer
     * @constructor GWTK.TileLayerWms
     * @param map {GWTK.Map} карта
     * @param options {Object} параметры слоя
    */
    GWTK.TileLayerWms = function (map, options) {
        var type = options.pkkmap || options.tilewms;
        if (!type) {
            console.log(w2utils.lang("TileLayerWms creation error") + ". " + w2utils.lang("Not defined a required parameter") + " pkkmap or tilewms.");
            return;
        }
        var twms = $.extend(true, new GWTK.TileLayerOld(map, options), proto_tiledwms);

        twms.init(map, options);

        return twms;
    };

    GWTK.tileLayerWms = function (map, options) {
        return new GWTK.TileLayerWms(map, options);
    };
};