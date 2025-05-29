/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Класс параметров буфера заполнения               *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Core = GWTK.gEngine.Core || {};


    /**
     * Класс параметров буфера заполнения
     * @class GWTK.gEngine.Renderer.RenderBufferDescription
     * @constructor GWTK.gEngine.Renderer.RenderBufferDescription
     * @param width {number} Ширина буфера заполнения
     * @param height {number} Высота буфера заполнения
     * @param format {GWTK.gEngine.Renderer.enumRenderBufferFormat} Формат буфера заполнения

     */
    GWTK.gEngine.Renderer.RenderBufferDescription = function (width, height, format) {
        width = width || 0;
        height = height || 0;

        this._width = width;
        this._height = height;
        this._format = format;
    };
    GWTK.gEngine.Renderer.RenderBufferDescription.prototype = {
        /**
         * Получить ширину буфера заполнения
         * @method getWidth
         * @public
         * @return {number} Ширина буфера заполнения в px
         */
        getWidth: function () {
            return this._width;
        },
        /**
         * Получить высоту буфера заполнения
         * @method getHeight
         * @public
         * @return {number} Высота буфера заполнения в px
         */
        getHeight: function () {
            return this._height;
        },
        /**
         * Получить формат буфера заполнения
         * @method getFormat
         * @public
         * @return {GWTK.gEngine.Renderer.enumRenderBufferFormat} Формат буфера заполнения
         */
        getFormat: function () {
            return this._format;
        },

        /**
         * Вычислить приблизительный размер памяти необходимой для буфера заполнения
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
                case GWTK.gEngine.Renderer.enumRenderBufferFormat.rgba4:
                    return 4;
                case GWTK.gEngine.Renderer.enumRenderBufferFormat.rgb5_6_5:
                    return 2;
                case GWTK.gEngine.Renderer.enumRenderBufferFormat.rgb5_a1:
                    return 2;
                case GWTK.gEngine.Renderer.enumRenderBufferFormat.depth_component_16:
                    return 2;
                case GWTK.gEngine.Renderer.enumRenderBufferFormat.stencil_index_8:
                    return 1;
                case GWTK.gEngine.Renderer.enumRenderBufferFormat.depth_stencil:
                    return 1;
            }
        }
    }

}