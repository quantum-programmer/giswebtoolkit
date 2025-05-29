/*************************************** Соколова Т.О.02/08/18 *****
/*************************************** Нефедьева О. 17/02/17 *****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2017              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                      Менеджер объектов карты                     *
*                                                                  *
*******************************************************************/
/**
  * Класс Менеджер объектов карты
  * Конструктор GWTK.ObjectManager
  * @param map {GWTK.Map} Компонент карты, ссылка
*/
if (window.GWTK) {

    GWTK.ObjectManager = function (map) {

        this.map = map;                                                          // Карта
        if (!this.map) {                                                         
            console.log("ObjectManager." + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.selectedFeatures = null;                                            // Класс Отобранные объекты 
        this.clickData = null;                                                   // Класс доступа к объектам в точке
        this.featureRequest = null;                                              // Класс получения объектов по координатам точки

        this.init();
        return;
    };

    GWTK.ObjectManager.prototype = {
        /**
         * Инициализация класса
         * @method init
         */
        // ===============================================================
        init: function () {
            if (!this.map) return;

            this.selectedFeatures = new GWTK.selectedFeatures(this.map);
            
            this.clickData = new GWTK.MapClickFeatureInfo(this.map, this.selectedFeatures);

            this.featureRequest = new GWTK.FeatureInfoRequest(this.map);

            return;
        },

        /**
        * Запросить данные объекта в точке
        * @method getObjectInfo
        * @param point {GWTK.Point} координаты клика мыши в карте (пикселы)
        * @return {Object} объект в точке point или `null` при ошибке
        */
        // ===============================================================
        getFeatureInfo: function (point) {
            if (!point || !this.clickData) return false;
            return this.clickData.pickObject(point);
        },

        /**
         * Установить точку выбора объектов
         * @method setPickPoint
         * @param point {GWTK.Point} координаты клика мыши в карте (пикселы)
         */
        // ===============================================================
        setPickPoint: function (point) {
            if (!point || !this.clickData) return;
            this.clickData.setPickPoint(point);
            return;
        },

        /**
         * Запросить точку выбора объектов
         * @method getPickPoint
         * @return {GWTK.Point} координаты точку выбора объектов, (пикселы)
         */
        // ===============================================================
        getPickPoint: function () {
            if (!this.clickData) return null;
            return this.clickData.getPickPoint();
        },

        /**
         * Выбрать объект в точке из списка
         * @method pickFeature
         * @param point {GWTK.Point} координаты клика мыши в карте (пикселы)
         * @return {Object} выбранный объект в точке point или `null` при ошибке
        */
        // ===============================================================
        pickFeature: function (point) {
            if (point instanceof GWTK.Point == false || !this.clickData)
                return null;
            return this.clickData.getPickedObject(point);
        },

        /**
         * Установить локализации для выбора объектов
         * @method getRequestLocals
         * @param locals {String} строка с перечислением локализаций ("0,1,2,4")
         */
        // ===============================================================
        getRequestLocals: function () {
            return this.featureRequest.objlocal;
        },

        /**
         * Установить локализации для выбора объектов
         * @method setRequestLocals
         * @param locals {string} строка с перечислением локализаций ("0,1,2,4")
         */
        // ===============================================================
        setRequestLocals: function (locals) {
            if (!locals || typeof(locals) !== "string")
                return;
            this.featureRequest.objlocal = locals;
        }

    }

}