/******************************************** Тазин В. 23/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Класс вершинного атрибута шейдера                    *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};




    /**
     * Класс вершинного атрибута шейдера
     * @class GWTK.gEngine.Renderer.ShaderVertexAttribute
     * @constructor GWTK.gEngine.Renderer.ShaderVertexAttribute
     * @param name {string} Имя атрибута в шейдере
     * @param location {GLint} Локация атрибута
     * @param type {number} Тип значения атрибута в шейдере
     */
    GWTK.gEngine.Renderer.ShaderVertexAttribute = function (name, location, type) {
        this._location = location;
        this.mName = name;
        this.mType = type;
    };

    GWTK.gEngine.Renderer.ShaderVertexAttribute.prototype = {
        /**
         * Получить локацию атрибута
         * @method getLocation
         * @public
         * @return {GLint} Локация атрибута
         */
        getLocation: function () {
            return this._location;
        }
    }
}