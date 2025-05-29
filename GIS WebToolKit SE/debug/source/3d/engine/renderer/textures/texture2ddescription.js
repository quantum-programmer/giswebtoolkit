/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Класс параметров текстуры                  *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Core = GWTK.gEngine.Core || {};

    /**
     * Класс параметров текстуры
     * @class GWTK.gEngine.Renderer.Texture2DDescription
     * @constructor GWTK.gEngine.Renderer.Texture2DDescription
     * @param width {number} Ширина текстуры
     * @param height {number} Высота текстуры
     * @param format {GWTK.gEngine.Renderer.enumTextureFormat} Формат изображения текстуры
     * @param generateMipmaps {boolean} Флаг автоматической генерации mipmap-уровней
     */
    GWTK.gEngine.Renderer.Texture2DDescription = function (width, height, format, generateMipmaps) {
        this._width = width;
        this._height = height;
        this._format = format;
        this._generateMipmaps = !!generateMipmaps;
    };
    GWTK.gEngine.Renderer.Texture2DDescription.prototype = {
        /**
         * Получить ширину текстуры
         * @method getWidth
         * @public
         * @return {number} Ширина текстуры в px
         */
        getWidth: function () {
            return this._width;
        },
        /**
         * Получить высоту текстуры
         * @method getHeight
         * @public
         * @return {number} Высота текстуры в px
         */
        getHeight: function () {
            return this._height;
        },
        /**
         * Получить формат текстуры
         * @method getFormat
         * @public
         * @return {GWTK.gEngine.Renderer.enumTextureFormat} Формат текстуры
         */
        getFormat: function () {
            return this._format;
        },
        /**
         * Получить флаг автогенерации уменьшенных изображений
         * @method getGenerateMipmaps
         * @public
         * @return {boolean} Флаг автогенерации уменьшенных изображений
         */
        getGenerateMipmaps: function () {
            return this._generateMipmaps;
        },
        /**
         * Вычислить приблизительный размер памяти необходимой для изображения
         * @method approximateSizeInBytes
         * @return {number} Размер памяти в байтах
         */
        approximateSizeInBytes: function () {
            return this._width * this._height * this.sizeInBytes(this._format);
        },
        /**
         * Получить размер пиксела
         * @method sizeInBytes
         * @return {number} Размер пиксела в байтах
         */
        sizeInBytes: function (format) {
            switch (format) {

                case GWTK.gEngine.Renderer.enumTextureFormat.rgb8_8_8:
                    return 3;
                case GWTK.gEngine.Renderer.enumTextureFormat.rgb5_6_5:
                    return 2;

                case GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8:
                    return 4;
                case GWTK.gEngine.Renderer.enumTextureFormat.rgba4_4_4_4:
                    return 2;
                case GWTK.gEngine.Renderer.enumTextureFormat.rgba5_5_5_1:
                    return 2;

                case GWTK.gEngine.Renderer.enumTextureFormat.lum8_8_8:
                    return 3;
                case GWTK.gEngine.Renderer.enumTextureFormat.lum5_6_5:
                    return 2;

                case GWTK.gEngine.Renderer.enumTextureFormat.luma8_8_8_8:
                    return 4;
                case GWTK.gEngine.Renderer.enumTextureFormat.luma4_4_4_4:
                    return 2;
                case GWTK.gEngine.Renderer.enumTextureFormat.luma5_5_5_1:
                    return 2;

                case GWTK.gEngine.Renderer.enumTextureFormat.alpha:
                    return 1;
            }
        }
    }

}