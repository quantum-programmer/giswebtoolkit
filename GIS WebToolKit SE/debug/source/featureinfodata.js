/*************************************** Нефедьева О. 29/06/20 *****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                   Перебор объектов в точке из списка             *
*                                                                  *
*******************************************************************/

if (window.GWTK) {
    /**
      * Выбор объектов в точке из списка
      * @param map {Object}  компонент карты
      * @param selectedfeatures {Object} GWTK.selectedFeatures, класс объектов
    */
    GWTK.MapClickFeatureInfo = function (map, selectedfeatures) {
        this.map = map;                                                         // Карта
        if (!this.map) {                                                         
            console.log("ObjectManager." + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.selectedFeatures = selectedfeatures;                              // Отобранные объекты карты
        this._point = null;
        this.delta = 0;                                                        // допуск на отклонение значений координат точки
        this.init();
        return;
    };

    GWTK.MapClickFeatureInfo.prototype = {
        /**
         * Инициализация класса
         * @method init
        */
        // ===============================================================
        init: function () {
            if (!this.map) return;
            this.delta = 4;
            this.number = -1;
            return;
        },

        /**
         * Установить точку выбора
         * @method setPickPoint
         * @param point {GWTK.Point} координаты точки, пикселы
        */
        // ===============================================================
        setPickPoint: function (point) {
            this._point = point;
            this.number = -1;
        },

        /**
         * Запросить точку выбора
         * @method getPickPoint
         * @return point {GWTK.Point} координаты точки, пикселы
        */
        // ===============================================================      
        getPickPoint: function () {
            if (this.number == -1)
                return null;
            return this._point;
        },

        /**
         * Очистить точку выбора
         * @method clearPickPoint
        */
        // =============================================================== 
        clearPickPoint: function () {
            this.number = -1;
            this._point = null;
        },

        /**
         * Выбрать объект по координатам точки из списка выбранных
         * @method pickObject
         * @param point {GWTK.Point} координаты точки, пикселы
        */
        // ===============================================================
        pickObject: function (point) {
            if (!this.selectedFeatures.mapobjects || this.selectedFeatures.mapobjects.length == 0) {
                return false;
            }
            if (!point || !this._point) {
                return false;
            }
            if (this._point.distanceTo(point) > this.delta) {
                this.number = -1;
                return false;
            }
            else if (this.number == -1){
                this.number = 0;
            }
            
            this.number++;
            if (this.number >= parseInt(this.selectedFeatures.mapobjects.length)) {
                this.number = 0;
            }
 
            return this.selectedFeatures.mapobjects[this.number];
        },

        /**
         * Запросить выбранный объект по координатам точки
         * @method getPickedObject
         * @param point {GWTK.Point} координаты точки, пикселы
        */
        // ===============================================================
        getPickedObject: function (point) {
            if (point instanceof GWTK.Point == false || this.number < 0)
                return null;
            if (this._point.distanceTo(point) > this.delta   ||
                this.selectedFeatures.mapobjects.length == 0 ||
                this.number >= this.selectedFeatures.mapobjects.length ) 
            {
                return null;
            }
            return this.selectedFeatures.mapobjects[this.number];
        }
    }
}