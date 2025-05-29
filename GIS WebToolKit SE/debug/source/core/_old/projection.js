/*************************************** Тазин В.О.   27/06/17 *****
**************************************** Нефедьева О. 21/04/17 *****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2017              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                 Преобразования координат точки                   *
*                                                                  *
*******************************************************************/
GWTK.projections = function () {
    this.bigAxis = 6378137.0;
    this.DEG_TO_RAD = Math.PI / 180.0;
    this.RAD_TO_DEG = 180.0 / Math.PI;
    this.bigAxisMiddle = 6367444.65712259;
};

GWTK.projections.prototype = {

    /**
      * Преобразовать геодезические координаты точки в прямоугольные для указанной СК
      * @method geo2xy
      * @param crs {String} имя (код) системы координат
      * @param b {Number} значение широты
      * @param l {Number} значение долготы
    */
    // ===============================================================
    geo2xy: function (crs, b, l) {
        if (crs === 3857 || crs === '3857') return this.geo2xy3857(b, l);
        if (crs === 3395 || crs === '3395') return this.geo2xy3395(b, l);
        if (crs === 4326 || crs === '4326') return this.geo2xy4326(b, l);
        if (crs === 54003 || crs === '54003') return this.geo2xy54003(b, l);
        return null;
    },

    /**
     * Преобразовать прямоугольные координаты точки в геодезические в указанной системе координат
     * @method xy2geo
     * @param crs {String} имя (код) системы координат
     * @param x {Number} значение координаты x
     * @param y {Number} значение координаты y
   */
    // ===============================================================
    xy2geo: function (crs, x, y) {
        if (crs === '3857' || crs === 3857) return this.xy2geo3857(x, y);
        if (crs === '3395' || crs === 3395) return this.xy2geo3395(x, y);
        if (crs === '4326' || crs === 4326) return this.xy2geo4326(x, y);
        if (crs === '54003' || crs === 54003) return this.xy2geo54003(x, y);
        return null;
    },

    /**
     * Преобразовать геодезические координаты точки в прямоугольные для СК 4326
     * @method geo2xy4326
     * @param b {Number} значение широты
     * @param l {Number} значение долготы
     * @return {Array} прямоугольные координаты [x,y]
   */
    // ===============================================================
    geo2xy4326: function (b, l) {
        if (isNaN(b) || isNaN(l)) return null;
        var d = this.DEG_TO_RAD;
        b = b * d;
        l = l * d;
        return [(parseFloat(b) * this.bigAxis), (parseFloat(l) * this.bigAxis)];
    },

    /**
     * Преобразовать прямоугольные координаты точки в геодезические для СК 4326
     * @method xy2geo
     * @param x {Number} значение координаты x
     * @param y {Number} значение координаты y
     * @return {Array} геодезические координаты [b,l]
    */
    // ===============================================================
    xy2geo4326: function (x, y) {
        if (isNaN(x) || isNaN(y)) return null;
        return [(parseFloat(x) / this.bigAxis), (parseFloat(y) / this.bigAxis)];
    },

    /**
     * Преобразовать геодезические координаты точки в прямоугольные для СК 3857 (сферический Mеркатор)
     * @method geo2xy3857
     * @param b {Number} значение широты
     * @param l {Number} значение долготы
     * @return {Array} прямоугольные координаты [y,x] в СК 3857
    */
    // ===============================================================
    geo2xy3857: function (b, l) {
        if (isNaN(b) || isNaN(l)) return null;
        
        b = b * this.DEG_TO_RAD;
        l = l * this.DEG_TO_RAD;

        var temp = Math.tan(Math.PI / 4.0 + (b / 2.0));

        if ((temp < 0.000001) && (temp > -0.000001)) temp = 0.000001;

        var x = Math.log(temp) * this.bigAxis;
        var y = l * this.bigAxis;

        return [x, y];
    },

    /**
     * Преобразовать прямоугольные координаты точки в геодезические для СК 3857
     * @method xy2geo3857
     * @param x {Number} значение координаты x
     * @param y {Number} значение координаты y
     * @return {Array} геодезические координаты [b,l]
    */
    // ===============================================================
    xy2geo3857: function (x, y) {
        if (isNaN(x) || isNaN(y)) return null;
        var temp = parseFloat(-x) / this.bigAxis;
        var b = Math.PI / 2.0 - 2.0 * Math.atan(Math.exp(temp));
        var d = this.RAD_TO_DEG;
        b = b * d;
        var l = (parseFloat(y) / this.bigAxis) * d;
        return [b, l];
    },

    // Преобразования для epsg:3395 (эллиптический Меркатор)
    /**
     * Преобразовать геодезические координаты точки в прямоугольные для СК 3395
     * @method geo2xy3395
     * @param b {Number} значение широты
     * @param l {Number} значение долготы
     * @return {Array} прямоугольные координаты [y,x] в СК 3395
    */
    // ===============================================================
    geo2xy3395: function (b, l) {

        if (isNaN(b) || isNaN(l)) return null;
        var lat=b, lng=l;
        b = parseFloat(b), l = parseFloat(l);
        var rLat = b * this.DEG_TO_RAD;
        var rLong = l * this.DEG_TO_RAD;
        var minorAxis = 6356752.3142;

        var x = this.bigAxis * rLong;

        var ratio = minorAxis / this.bigAxis;
        var phi = rLat,
            sinphi = Math.sin(phi);
        var e = Math.sqrt(1.0 - (ratio * ratio));
        var com = 0.5 * e;
        var con = e * sinphi;
        con = Math.pow((1.0 - con) / (1.0 + con), com);
        var ts = Math.tan(0.5 * (Math.PI * 0.5 - phi)) / con;

        var y = 0 - this.bigAxis * Math.log(ts);

        return [y, x];
    },

    /**
     * Преобразовать прямоугольные координаты точки в геодезические для СК 3395
     * @method xy2geo3395
     * @param x {Number} значение координаты x
     * @param y {Number} значение координаты y
     * @return {Array} геодезические координаты [b,l]
    */
    // ===============================================================
    xy2geo3395: function (x, y) {

        if (isNaN(x) || isNaN(y)) return null;
        var Alfa = 1.0 / 298.257223563;
        var E2 = 2.0 * parseFloat(Alfa) - parseFloat(Alfa) * parseFloat(Alfa);
        var ExscMerid = Math.sqrt(E2);
        var E4 = parseFloat(E2) * parseFloat(E2);
        var E6 = parseFloat(E4) * parseFloat(E2);
        var E8 = parseFloat(E6) * parseFloat(E2);

        var va = parseFloat(E2) / 2.0 + parseFloat(E4) * 5.0 / 24.0 + parseFloat(E8) * 13.0 / 360.0;
        var vb = parseFloat(E4) * 7.0 / 48.0 + parseFloat(E6) * 290.0 / 240.0 + parseFloat(E8) * 811.0 / 11520.0;
        var vc = parseFloat(E6) * 7.0 / 120.0 + parseFloat(E8) * 81.0 / 1120.0;
        var vd = parseFloat(E8) * 4279.0 / 161280.0;

        var temp = Math.exp(parseFloat(-x) / this.bigAxis);
        var ksi = Math.PI / 2.0 - 2 * Math.atan(temp);
        var b = ksi + va * Math.sin(2.0 * ksi) + vb * Math.sin(4.0 * ksi) + vc * Math.sin(6.0 * ksi) + vd * Math.sin(8.0 * ksi);
        var l = parseFloat(y) / this.bigAxis;

        var d = this.RAD_TO_DEG;

        return [(b * d), (l * d)];
    },

    // Преобразования для epsg:54003 (цилиндрическая Миллера)
    /**
      * Преобразовать геодезические координаты точки в прямоугольные для СК 54003
      * @method geo2xy3395
      * @param b {Number} значение широты
      * @param l {Number} значение долготы
      * @return {Array} прямоугольные координаты [y,x] в СК 54003
    */
    // ===============================================================
    geo2xy54003: function (b, l) {
        if (isNaN(b) || isNaN(l))
            return null;
        b = parseFloat(b), l = parseFloat(l);
        b = b * this.DEG_TO_RAD;
        l = l * this.DEG_TO_RAD;
        
        var y = this.bigAxisMiddle * parseFloat(l);
        var temp = Math.tan(Math.PI / 4.0 + 0.4 * parseFloat(b));
        if (temp < 0.000001)
            temp = 0.000001;
        var x = 1.25 * this.bigAxisMiddle * Math.log(temp);
        return [y, x];
    },

    /**
      * Преобразовать прямоугольные координаты точки в геодезические для СК 54003 (цилиндрическая Миллера)
      * @method xy2geo54003
      * @param x {Number} значение координаты x
      * @param y {Number} значение координаты y
      * @return {Array} геодезические координаты [b,l]
    */
    // ===============================================================
    xy2geo54003: function (x, y) {
        
        var l = y / this.bigAxisMiddle;
        var b = Math.exp(0.8 * parseFloat(x) / this.bigAxisMiddle);
        b = 2.5 * Math.atan(b) - 0.625 * Math.PI;
        b = b * this.RAD_TO_DEG;
        l = l * this.RAD_TO_DEG;
        return [b, l];
    },

    // габариты гео --> метры (Меркатор)
    latLngBounds2Bounds: function (latlngbounds, crs) {
        if (latlngbounds == null || crs == null) { return null; }

        if (latlngbounds instanceof GWTK.LatLngBounds == false) {
            return null;
        }

        var xy1 = this.geo2xy(crs, latlngbounds.getSouth(), latlngbounds.getWest());
        if (xy1 == null) return xy1;

        var xy2 = this.geo2xy(crs, latlngbounds.getNorth(), latlngbounds.getEast());
        if (xy2 == null) return xy2;

        return GWTK.bounds(new GWTK.point(xy1[1], xy1[0]), new GWTK.point(xy2[1],xy2[0]));
    }

};
