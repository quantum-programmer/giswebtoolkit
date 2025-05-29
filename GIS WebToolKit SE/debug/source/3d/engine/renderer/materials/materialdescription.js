/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Класс параметров материала                    *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Core = GWTK.gEngine.Core || {};

    /**
     * Класс параметров материала
     * @class GWTK.gEngine.Renderer.MaterialDescription
     * @constructor GWTK.gEngine.Renderer.MaterialDescription
     * @param description {object} Описание материала
     */
    GWTK.gEngine.Renderer.MaterialDescription = function (description) {
        var defaultColor = [1, 1, 1, 1];
        this._ambientColor = description.AmbientColor || defaultColor;
        this._diffuseColor = description.DiffuseColor || defaultColor;
        this._specularColor = description.SpecularColor || defaultColor;
        this._emissiveColor = description.EmissiveColor || defaultColor;
        this._shininess = description.Shininess || 0;

        this._opacity = description.Opacity || Math.max(
            this._ambientColor[3],
            this._diffuseColor[3],
            this._specularColor[3],
            this._emissiveColor[3]
        )
    };
    GWTK.gEngine.Renderer.MaterialDescription.prototype = {
        /**
         * Получить фоновый цвет
         * @method getAmbientColor
         * @public
         * @return {array} Цвет [r,g,b,a]
         */
        getAmbientColor: function () {
            return this._ambientColor;
        },
        /**
         * Получить диффузный цвет
         * @method getDiffuseColor
         * @public
         * @return {array} Цвет [r,g,b,a]
         */
        getDiffuseColor: function () {
            return this._diffuseColor;
        },
        /**
         * Получить зеркальный цвет
         * @method getSpecularColor
         * @public
         * @return {array} Цвет [r,g,b,a]
         */
        getSpecularColor: function () {
            return this._specularColor;
        },
        /**
         * Получить исходящий цвет
         * @method getEmissiveColor
         * @public
         * @return {array} Цвет [r,g,b,a]
         */
        getEmissiveColor: function () {
            return this._emissiveColor;
        },
        /**
         * Получить радиус блика
         * @method getShininess
         * @public
         * @return {number} Радиус блика
         */
        getShininess: function () {
            return this._shininess;
        },
        /**
         * Получить общую прозрачность материала
         * @method getOpacity
         * @public
         * @return {number} Прозрачность материала
         */
        getOpacity: function () {
            return this._opacity;
        }
    }
}