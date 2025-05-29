
/*************************************** Нефедьева О. 07/07/21 *****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2022              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*              Расчетные функции для матриц тайлов                 *
*                                                                  *
*******************************************************************/

    GWTK.browserSafariForiOS = navigator.userAgent.match(/(iPhone|iPad|iPod|Android|BlackBerry|webOS|IEMobile|Opera Mini)/);

    GWTK.ScaleDenominatorGoogle = [559082264.0287178, 279541132.0143589, 139770566.0071794, 69885283.00358972, 34942641.50179486, 17471320.75089743, 8735660.375448715, 4367830.187724357, 2183915.093862179, 1091957.546931089, 545978.7734655447, 272989.3867327723, 136494.6933663862, 68247.34668319309, 34123.67334159654, 17061.83667079827, 8530.918335399136, 4265.459167699568, 2132.729583849784, 1066.364791924891, 533.1823959624459, 266.59119798122295, 133.295598990611475];
    GWTK.ScaleDenominatorPixel = [795139219.9519541, 397569609.9759771, 198784804.9879885, 132523203.3253257, 66261601.66266284, 33130800.83133142, 13252320.33253257, 6626160.166266284, 3313080.083133142, 1656540.041566571, 552180.0138555236, 331308.0083133142, 110436.0027711047, 55218.00138555237, 33130.80083133142, 11043.60027711047, 3313.080083133142, 1104.360027711047, 552.1800138555237];
    GWTK.ScaleDenominatorQuard = [559082264.0287178, 279541132.0143589, 139770566.0071794, 69885283.00358972, 34942641.50179486, 17471320.75089743, 8735660.375448715, 4367830.187724357, 2183915.093862179, 1091957.546931089, 545978.7734655447, 272989.3867327723, 136494.6933663862, 68247.34668319309, 34123.67334159654, 17061.83667079827, 8530.918335399136, 4265.459167699568, 2132.729583849784];
    GWTK.ScaleDenominatorScale = [500000000, 250000000, 100000000, 50000000, 25000000, 10000000, 5000000, 2500000, 1000000, 500000, 250000, 100000, 50000, 25000, 10000, 5000, 2500, 1000, 500];
    GWTK.ScaleListUI = [500000000, 250000000, 100000000, 50000000, 25000000, 10000000, 5000000, 2000000, 1000000, 500000, 200000, 100000, 50000, 25000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

    GWTK.TileMatrixSets = {
        "GoogleMapsCompatible": {
            "crs": "3857",
            "scales": [559082264.0287178, 279541132.0143589, 139770566.0071794, 69885283.00358972, 34942641.50179486,
                        17471320.75089743, 8735660.375448715, 4367830.187724357, 2183915.093862179, 1091957.546931089,
                        545978.7734655447, 272989.3867327723, 136494.6933663862, 68247.34668319309, 34123.67334159654,
                        17061.83667079827, 8530.918335399136, 4265.459167699568, 2132.729583849784, 1066.364791924891,
                        533.1823959624459, 266.59119798122295, 133.295598990611475],
            "max_latitude": 85.0511287798,
            "topleft": { "y": -20037508.34279000, "x": 20037508.34279000 }
        },

        "EPSG:3395": {
            "crs": "3395",
            "scales": [559082264.0287178, 279541132.0143589, 139770566.0071794, 69885283.00358972, 34942641.50179486,
                        17471320.75089743, 8735660.375448715, 4367830.187724357, 2183915.093862179, 1091957.546931089,
                        545978.7734655447, 272989.3867327723, 136494.6933663862, 68247.34668319309, 34123.67334159654,
                        17061.83667079827, 8530.918335399136, 4265.459167699568, 2132.729583849784, 1066.364791924891,
                        533.1823959624459, 266.59119798122295, 133.295598990611475],
            "max_latitude":85.0840591556,
            "topleft": { "y":-20037508.34279000, "x":20037508.34279000 }
        },
        "EPSG:3857": {
            "crs": "3857",
            "scales": [559082264.0287178, 279541132.0143589, 139770566.0071794, 69885283.00358972, 34942641.50179486,
                17471320.75089743, 8735660.375448715, 4367830.187724357, 2183915.093862179, 1091957.546931089,
                545978.7734655447, 272989.3867327723, 136494.6933663862, 68247.34668319309, 34123.67334159654,
                17061.83667079827, 8530.918335399136, 4265.459167699568, 2132.729583849784, 1066.364791924891,
                533.1823959624459, 266.59119798122295, 133.295598990611475],
            "max_latitude": 85.0511287798,
            "topleft": {"y": -20037508.34279000, "x": 20037508.34279000},
            "tileWidth": 1024,
            "tileHeight": 1024
        },
        "MILLER": {
            "crs": "54003",
            "scales": [559082264.0287178, 279541132.0143589, 139770566.0071794, 69885283.00358972, 34942641.50179486,
                        17471320.75089743, 8735660.375448715, 4367830.187724357, 2183915.093862179, 1091957.546931089,
                        545978.7734655447, 272989.3867327723, 136494.6933663862, 68247.34668319309, 34123.67334159654,
                        17061.83667079827, 8530.918335399136, 4265.459167699568, 2132.729583849784, 1066.364791924891,
                        533.1823959624459, 266.59119798122295, 133.295598990611475],
            "max_latitude":90,
            "topleft": { "y":-20003917.3569559, "x":14666851.8924712 }
        },

        "GlobalCRS84Scale": {
            "crs": "4326",
            "scales": [500000000, 250000000, 100000000, 50000000, 25000000, 10000000, 5000000, 2500000, 1000000, 500000,
                       250000, 100000, 50000, 25000, 10000, 5000, 2500, 1000, 500],
            "max_latitude": 90,
            "topleft": { "y":-180, "x":90 }
        }
    };

    GWTK.TileViewing = function(){

        this.screenScale = 100;
        this.screenPrecision= 4000;

        this.metersPerUnit = 111319.49079327358;

        this.originX =-20037508.342789244;
        this.originY = 20037508.342789244;                    // Mercator origin

        this.standardPixSizeOGC = 0.28;
        this.standardPixelSize = 0.00028;
        this.axisMajor = 6378137.0;                           // Mercator 3857, 3395
        this.axisMinor = 6356752.314245179;                   // Mercator 3395
        this.maxLatitude = 85.0511287798;                     // 85.0840591556 для 3395
    };

    GWTK.TileViewing.prototype = {

        /**
         * Запросить значение пискела в метрах на местности
         * @method getpixelSpan
         * @param scale {Float} значение масштаба
		 * @param geo {Boolean} признак географическая СК
         * @return {Float} значение пискела в метрах для масштаба scale
        */
        getpixelSpan: function (scale, geo, map) {
            var scale = scale;
            if (scale == null || scale <= 0) {
                if (!map) return null;
                scale = map.getZoomScale(map.options.tilematrix);
            }
            var pxspan;
            if (geo)                                                                // для 4326 !
                pxspan = scale * this.standardPixelSize / this.metersPerUnit;       // Если географическая СК
            else
                pxspan = scale * this.standardPixelSize;                            // Все остальные сервера

            return pxspan;
        },

        /**
         * Запросить номер тайла по координатам точки для матрицы тайлов
         * @method getTileLayerData
         * @param zoom {Number} номер матрицы тайлов
         * @param map {Object} ссылка на объект карты
         * @param topleftpoint {GWTK.Point} координаты точки в метрах
         * @return {Array} массив 6-ти значений:номер колонки, номер столбца матрицы,
         * смещение в тайле по x (пикселы), смещение в тайле по y (пикселы),
         * смещение точки от начала координат матрицы по Х (пикселы),
         * смещение точки от начала координат матрицы по Y (пикселы)
         */
        getTileLayerData: function (zoom, map, topleftpoint) {

            if (!map) return null;
            var geo = (map.options.crs == 4326);

            var matrix = GWTK.TileMatrixSets[map.options.tilematrixset];
            var scale = map.getZoomScale(zoom);

            var pixelSpan = this.getpixelSpan(scale, geo);
            if (pixelSpan == null) return null;

            var tileSpanX = pixelSpan * 256.0;         // tileWidth (m);
            var tileSpanY = pixelSpan * 256.0;         // tileHeight (m);

            var tileMatrixMinX = matrix.topleft.y;     // hor
            var tileMatrixMaxY = matrix.topleft.x;     // ver

            // Если сервер отдает координаты перевернутыми
            if (tileMatrixMinX === 90) {
                tileMatrixMinX = matrix.topleft.y;
                tileMatrixMaxY = matrix.topleft.x;
            }

            // расчет номера тайла
            var epsilon = 0.000001;
            var tileX, tileY;

            var tl = null;
            if (topleftpoint != undefined) tl = topleftpoint;
            else tl = map.getMapTopLeft();

            var planeMapLeft = tl.x;
            var planeMapTop = tl.y;

            if (geo) {

                var bl = GWTK.projection.xy2geo(map.options.crs, planeMapTop, planeMapLeft);
                planeMapTop = bl[1] * GWTK.projection.RAD_TO_DEG,
                planeMapLeft = bl[0] * GWTK.projection.RAD_TO_DEG;
                console.log('geo ', bl, planeMapLeft, planeMapTop);
                tileX = (planeMapLeft - tileMatrixMinX) / tileSpanX + epsilon;
                tileY = (tileMatrixMaxY - planeMapTop) / tileSpanY + epsilon;
                console.log(planeMapLeft, planeMapTop, tileX, tileY);
            }
            else {
                // Иначе - все остальные
                tileX = (planeMapLeft - tileMatrixMinX) / tileSpanX - epsilon;
                tileY = (tileMatrixMaxY - planeMapTop) / tileSpanY - epsilon;
            }

            var screenX = (planeMapLeft - tileMatrixMinX) / pixelSpan;
            var screenY = (tileMatrixMaxY - planeMapTop) / pixelSpan;

            // смещение точки в тайле, с которого надо отображать (номер пикселя)
            var pixX = 256.0 * (tileX - tileX);
            var pixY = 256.0 * (tileY - tileY);

            // tileY = parseInt(tileY, 10);

            // tileX = parseInt(tileX, 10);


            return [tileX, tileY, pixX, pixY, screenX, screenY];
        },

        /**
         * Запросить размер матрицы тайлов по номеру матрицы (масштабному уровню)
         * @method globalTileMatrixSizePixel
         * @param zoom {Number} номер матрицы тайлов
         * @param map {Object} ссылка на объект карты
         * @return {GWTK.Bounds} размер матрицы тайлов, пикселы
         */
        globalTileMatrixSizePixel: function (map, zoom) {
            var zoom = zoom !== undefined ? zoom : map.getZoom();
            var matrix = GWTK.TileMatrixSets[map.options.tilematrixset];
            var nw = GWTK.point(0, 0);
            var se = this.geo2pixel(map, [-matrix.max_latitude, 180], zoom);
            return GWTK.bounds(nw, se);
        },

        /**
         * Запросить количество колонок и строк матрицы тайлов по номеру матрицы (масштабному уровню)
         * @method globalTileMatrixCount
         * @param zoom {Number} номер матрицы тайлов
         * @param map {Object} ссылка на объект карты
         * @param tilesize {Number} размер тайла
         * @return {GWTK.Point} количество колонок (x) и строк (y) матрицы
         */
        globalTileMatrixCount: function (map, zoom, tilesize) {
            var bounds = this.globalTileMatrixSizePixel(map, zoom);
            var size = bounds.getSize(),
                coll = size.x / tilesize,
                row = size.y / tilesize;
            return GWTK.point(coll, row, true);
        },

        /**
         * Получить размер тайла по имени матрицы тайлов (ключу)
         * @method getTileSize
         * @param tilematrixset {string} ключ матрицы тайлов в списке матриц
         * @return {Number} размер тайла, пикселы
         */
        getTileSize: function (tilematrixset) {
            if (!tilematrixset || typeof GWTK.TileMatrixSets[tilematrixset] == 'undefined') return undefined;
            var matrix = GWTK.TileMatrixSets[tilematrixset],
                tileSize = 256;
            if (matrix.tileWidth != undefined) tileSize = parseInt(matrix.tileWidth);
            return tileSize;
        },

        /**
         * Получить текущий размер матрицы тайлов в карте
         * @method getTileMatrixSize
         * @param map {GWTK.Map} ссылка на объект карты
         * @return {Object} ширина,высота матрицы тайлов, { "width": число, "height": число }, пикселы
         */
        getTileMatrixSize: function (map) {
            if (!map) return undefined;
            var bounds = this.globalTileMatrixSizePixel(map, map.options.tilematrix),
                size = bounds.getSize();
            return { "width": Math.round(size.x), "height": Math.round(size.y) };
        },


        /**
         * Преобразовать геодезические координаты точки в пиксели матрицы
         * @method geo2pixel
         * @param geo {GWTK.LatLng или [Number, Number]} геодезические координаты точки, десятичные градусы
		 * @param map {GWTK.Map} ссылка на карту
         * @param zoom {Number} масштабный уровень
         * @return {GWTK.Point}, координаты точки {x,y}, пикселы от начала координат матрицы
        */
        geo2pixel: function (map, geo, zoom) {
            if (!geo || !map) return false;
            var geo = GWTK.toLatLng(geo);
            var coord = GWTK.projection.geo2xy(map.options.crs, geo.lat, geo.lng), point;

            if (map.options.crs != 3857 && map.options.crs != 3395) {
                point = GWTK.point(coord[0], coord[1]);
            }
            else {
                point = GWTK.point(coord[1], coord[0]);
            }
            var pixel = this.getTileLayerData(zoom, map, point);

            return GWTK.point(pixel[4], pixel[5]);
        },

        /**
         * Преобразовать координаты точки из пикселей в геодезические
         * @method pixel2geo
         * @param point {GWTK.Point} координаты точки в матрице, пиксели
		 * @param map {GWTK.Map} ссылка на карту
         * @param zoom {Number} масштабный уровень
         * @return {Array} геокоординаты точки [широта,долгота], десятичные градусы
        */
        pixel2geo: function (point, map, zoom) {
            return this.tile2geo(point, map, zoom);
        },

        /**
         * Преобразовать координаты точки из пикселей в СК матрицы
         * @method pixel2plane
         * @param point {GWTK.Point} координаты точки в матрице, пиксели
		 * @param map {GWTK.Map} ссылка на карту
         * @param zoom {Number} масштабный уровень
         * @param matrix {Object} описание матрицы
         * @return {GWTK.Point}, координаты точки {x,y}, метры от начала координат матрицы
        */
        pixel2plane: function (map, point, zoom, matrix) {
            if (!point || !map) return false;
            var _matrix = matrix !== undefined ? matrix : GWTK.TileMatrixSets[map.options.tilematrixset];
            if (zoom == undefined || zoom == null) {
                zoom = map.options.tilematrix;
            }
            var scale = _matrix.scales[zoom];

            var pixelSpan = this.getpixelSpan(scale, (map.options.crs == 4326));
            if (pixelSpan == null) return false;
            var left = _matrix.topleft.y,
                top = _matrix.topleft.x;

            var left = point.x * pixelSpan + left;
            var top = top - (point.y + 0.000001) * pixelSpan;

            return GWTK.point(left, top);
        },

        wrapCoordinate: function (map, point, zoom) {
            var crs = map.options.crs,
                matrixSize = this.getTileMatrixSize(map),
                matrix = GWTK.TileMatrixSets[map.options.tilematrixset],
                matrixMinX = matrix.topleft.y,                                     // hor min of matrix
                matrixMaxX = Math.abs(matrixMinX);                                 // hor max of matrix

            if (crs !== 4326) {
                if (point.x < matrixMinX) {
                    point.x = matrixMaxX - Math.abs((point.x - matrixMinX));
                }
                else if (point.x > matrixMaxX) {
                    point.x = matrixMinX + Math.abs(matrixMaxX - point.x);
                }
            }
            else {
                if (point.x < -180) { point.x += 360; }
                if (point.x > 180) { point.x -= 360; }
                var coord = GWTK.projection.geo2xy(crs, point.y, point.x);
                point.x = coord[0];
                point.y = coord[1];
            }
            return point;
        },

        /**
         * Преобразовать координаты из СК матрицы в градусы
         * @method plane2degrees
         * @param point {GWTK.Point} координаты точки, метры
		 * @param map {GWTK.Map} ссылка на карту
         * @return {GWTK.Point}, координаты точки {широта(x), долгота(y)}, градусы
        */
        plane2degrees: function (map, point) {
            if (map == undefined || point == undefined) return;
            var point = point.clone();
            var bl = GWTK.projection.xy2geo(map.options.crs, point.x, point.y);
            point.x = bl[1] * GWTK.projection.RAD_TO_DEG,
            point.y = bl[0] * GWTK.projection.RAD_TO_DEG;
            return point;
        },

        /**
         * Преобразовать координаты точки в тайлах матрицы (пикселы) в CRS
         * @method tile2unit
         * @param tilepos {Array} координаты точки, тайлы, пикселы:
         * массив 6-ти значений:номер колонки, номер столбца матрицы,
         * смещение в тайле по x (пикселы), смещение в тайле по y (пикселы),
         * смещение точки от начала координат матрицы по Х (пикселы),
         * смещение точки от начала координат матрицы по Y (пикселы)
         * Или tilepos {GWTK.Point} координаты точки в матрице, пикселы
	     * @param map {GWTK.Map} ссылка на карту
         * @return {GWTK.Point} координаты точки в СК матрицы тайлов
        */
        tile2unit: function (tilepos, map, zoom) {
            if ((!map) || (!tilepos)) {
                return null;
            }
            if ($.isArray(tilepos)){
                if (tilepos.length != 6) { return null; }
            }
            else if (!(tilepos instanceof GWTK.Point)) {
                return null;
            }
            var posX = $.isArray(tilepos) ? tilepos[4] : tilepos.x;
            var posY = $.isArray(tilepos) ? tilepos[5] : tilepos.y;

            if (posX < 0){
                var matrix = GWTK.tileView.getTileMatrixSize(map);
                posX = posX + matrix.width;
            }

            var matrix = GWTK.TileMatrixSets[map.options.tilematrixset];
            if (zoom == undefined || zoom == null) {
                zoom = map.getZoom();
            }
            var scale = matrix.scales[zoom];

            var pixelSpan = this.getpixelSpan(scale, (map.options.crs == 4326));
            if (pixelSpan == null) return null;

            var tileMatrixMinX = matrix.topleft.y;
            var tileMatrixMaxY = matrix.topleft.x;

            var planeMapLeft = posX * pixelSpan + tileMatrixMinX;
            var planeMapTop = tileMatrixMaxY - (posY + 0.000001) * pixelSpan;

            return new GWTK.Point(planeMapLeft, planeMapTop);
        },

        /**
          * Преобразовать  координаты точки в геодезические
          * @method tile2geo
          * @param tilepos {Array} Координаты точки: номер тайла, смещение точки в тайле или
          * @param tilepos {GWTK.Point} координаты точки в матрице, пикселы
          * @param map {Object} Объект карты
          * @param zoom {Number} масштабный коэффициент
          * @return {Array} Координаты точки [b,l]
         */
        tile2geo: function (tilepos, map, zoom) {
            if ((!map) || (!tilepos)) return null;
            var point = this.tile2unit(tilepos, map, zoom);
            if (point == null) return null;
            if (map.options.tilematrixset == 'GlobalCRS84Scale') {
                return [point.y, point.x];
            }
            return GWTK.projection.xy2geo(map.options.crs, point.y, point.x);
        },

        // преобразовать точку в тайлах в СК Меркатора (по типу матрицы и номеру матрицы)
        // tilepos - [col, row, pixelX, pixelY] - номер тайла и смещение в тайле
        _tile2Mercator: function (tilepos, zoom, matrix) {
            if (!tilepos || !zoom || !matrix) return null;

            var matrixObj = GWTK.TileMatrixSets[matrix];
            // начало координат
            var tileMatrixMinX = matrixObj.topleft.y;
            var tileMatrixMaxY = matrixObj.topleft.x;
            // размер тайла в zoom
            var tsize = 2 * Math.PI * this.axisMajor / (Math.pow(2, zoom));
            // координаты Меркатора (метры)
            var x = tileMatrixMinX + tilepos[0] * tsize;
            x += tsize * (tilepos[2] / 256.0);
            var y = tileMatrixMaxY - tilepos[1] * tsize;
            y -= tsize * (tilepos[3] / 256.0);
            return [x, y];
        },

        // смещение точки (geo) относительно начала матрицы
        geo2pixelOffset: function (map, geo) {
            if (!geo) return;
            var plane = GWTK.projection.geo2xy(map.options.crs, geo.lat, geo.lng);                             // метры в проекции матрицы
            var pos = this.getTileLayerData(map.options.tilematrix, map, GWTK.point(plane[1], plane[0]));      // пикселы рисунка
            return map.tiles.getLayersPointOffset(pos);                                                        // смещение точки geo
        },

        // смещение точки (geo) в окне
        geo2pixelOffsetMap: function (map, geo, param) {
            if (!geo) return;
            var place = this.geo2pixelOffset(map, GWTK.toLatLng(geo));
            var matrix = GWTK.tileView.getTileMatrixSize(map);
            var size = map.getSize(),
                count = Math.ceil(size.x / matrix.width),
                topleft = map.getPixelMapTopLeft().round();
            if (place.x < 0 && count > 1){
                place.x += matrix.width;
            }
            if (topleft.x < 0){
                if (place.x > matrix.width) place.x -= matrix.width;
            }
            if (count > 1){
                if (param){
                    param['count'] = count;
                    param['place'] = [];
                    param['place'].push(place.x);
                    for(var j=1; j<count; j++){
                        param['place'].push(place.x + matrix.width * j);
                    }
                }
            }

            return place; // смещение точки geo
        },

        /**
          * получить номер строки сервиса TMS
          * @method tmsRow
          * @param options {Object} json, options.row - номер строки текущей матрицы, options.z - масштаб
          * @return {Number} номер строки сервиса TMS, при ошибке возвращает `undefined`
         */
        tmsRow: function (options) {
            if (!options || isNaN(options.row) || isNaN(options.z)) {
                return undefined;
            }
            var Y = Math.pow(2, options.z) - options.row - 1;
            return Y;
        }


    };

    GWTK.tileViewing = function () {
        return new GWTK.TileViewing();
    };

