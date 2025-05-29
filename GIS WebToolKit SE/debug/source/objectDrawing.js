/**************************************** Соколова Т.О.30/03/18 *****
 **************************************** Тазин В.     31/01/18 *****
 **************************************** Нефедьева О. 19/01/17 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2018              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Компонент рисования объектов                      *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {
    /**
     * Компонент рисования выделения объектов
     * @class GWTK.objectDrawing
     * @constructor GWTK.objectDrawing
     */
    GWTK.objectDrawing = function (map, params, method) {
        this.map = map;

        this.style={};
        
        if (!this.map) {                                                         // 19/01/17
            console.log("GWTK.objectDrawing. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        //if (!this.map)
        //    this.map = GWTK.maphandlers.map;
        this.params = {
            "2d": [],
            "3d": []
        };

        this.mOptions = {};
        this.options = null;

        this.currentMethod = method || (this.map.drawingLayer ? this.map.drawingLayer.layerContainer.currentMethod : null) || "2d";

        this.setDrawingMethod(this.currentMethod, params);

    };

    GWTK.objectDrawing.prototype = {

        /**
         * Инициализация
         * @method init
         * @private
         */
        // ===============================================================
        init: function (params) {
            this.initView = this.drawingMethod.initView ? this.drawingMethod.initView.bind(this.drawingMethod) : this.initView;
            this.draw = this.drawingMethod.draw ? this.drawingMethod.draw.bind(this.drawingMethod) : this.draw;
            this.clearDraw = this.drawingMethod.clearDraw ? this.drawingMethod.clearDraw.bind(this.drawingMethod) : this.clearDraw;
            this.deleteObject = this.drawingMethod.deleteObject ? this.drawingMethod.deleteObject.bind(this.drawingMethod) : this.deleteObject;
            this.viewObjects = this.drawingMethod.drawObjects ? this.drawingMethod.drawObjects.bind(this.drawingMethod) : this.viewObjects;
            this.destroy = this.drawingMethod.destroy ? this.drawingMethod.destroy.bind(this.drawingMethod) : this.destroy;
            // if (this.drawingMethod.destroy)
            //     this.destroy = this.drawingMethod.destroy.bind(this.drawingMethod);
        },

        /**
         * Рисование
         * @method draw
         * @public
         * @param geoJSON {Object} Объекты в формате geoJSON
         * @param addSvg {Boolean} Если значение `true`, добавляет объекты к существующим; если `false` - чистит холст
         * @param params {Object} Праметры стиля отображения объектов
         * @returns {Object} В случае ошибки возвращает ее описание
         */
        // ===============================================================
        draw: function (geoJSON, addSvg, params) {
        },

        /**
         * Очищает панель рисования
         * @method clearDraw
         * @public
         */
        // ===============================================================
        clearDraw: function () {
        },

        /**
         * Удаление объекта
         * @method deleteObject
         * @public
         * @param {String} id Идентификатор элемента
         */
        // ===============================================================
        deleteObject: function (id) {
        },

        /**
         * Отображение объектов
         * @method viewObjects
         * @public
         */
        // ===============================================================
        viewObjects: function () {
        },

        /**
         * Инициализация текущих параметров отображения карты
         * @method initView
         * @public
         */
        // ===============================================================
        initView: function () {
        },

        /**
         *  Разрушить компонент
         */
        destroy: function(){
        },

        /**
         * Установка текущего метода рисования
         * @method setDrawingMethod
         * @public
         * @param method {String} Наименование метода рисования
         * @param params {Array} Параметры рисования
         */
        setDrawingMethod: function (method, params) {
            if (params)
                this.params[method] = params;

            this.currentMethod = method;

            switch (method) {
                case "2d":
                case "svg":
                    this.initSvgDrawing(this.params[method]);
                    break;
                case "3d":
                    this.init3dDrawing(this.params["3d"]);
                    break;
             }

            if (this.drawingMethod) {
                this.options = this.mOptions[method] || this.drawingMethod.options;
                this.mOptions[method] = this.options;

                this.drawingMethod.options = this.options;
            }

        },

        /**
         * Инициализация svg-рисования
         * @method initSvgDrawing
         * @private
         * @param params {Array} Параметры рисования
         */
        initSvgDrawing: function (params) {
            this.drawingMethod = new GWTK.svgDrawing(this.map, params[0], params[1], params[2], params[3]);
            this.init();
        },
        /**
         * Инициализация рисования в 3d
         * @method init3dDrawing
         * @private
         * @param params {Array} Параметры рисования
         */
        init3dDrawing: function (params) {
            this.drawingMethod = new GWTK.Drawing3d(this.map.mapTool("3dMap").serviceObjectLayer, params[0], params[1], params[2]);
            this.init();
        }

    }
    ;
}
