/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Конвертер типов                          *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Renderer.WebGL = GWTK.gEngine.Renderer.WebGL || {};
    /**
     * Конвертер типов
     * @class GWTK.gEngine.Renderer.WebGL.TypeConverterWebgl
     * @static
     */
    GWTK.gEngine.Renderer.WebGL.TypeConverterWebgl = {

        /**
         * Конвертер формата изображения в формат пиксела
         * @method toPixelInternalFormat
         * @public
         * @param format {GWTK.gEngine.Renderer.enumTextureFormat} Формат изображения
         * @return {GWTK.gEngine.Renderer.enumPixelFormat} Формат пиксела
         */
        toPixelInternalFormat: function (format) {
            switch (format) {
                case GWTK.gEngine.Renderer.enumTextureFormat.alpha:
                    return GWTK.gEngine.Renderer.enumPixelFormat.alpha;
                case GWTK.gEngine.Renderer.enumTextureFormat.rgb8_8_8:
                case GWTK.gEngine.Renderer.enumTextureFormat.rgb5_6_5:
                    return GWTK.gEngine.Renderer.enumPixelFormat.rgb;
                case GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8:
                case GWTK.gEngine.Renderer.enumTextureFormat.rgba4_4_4_4:
                case GWTK.gEngine.Renderer.enumTextureFormat.rgba5_5_5_1:
                    return GWTK.gEngine.Renderer.enumPixelFormat.rgba;
                case GWTK.gEngine.Renderer.enumTextureFormat.lum8_8_8:
                case GWTK.gEngine.Renderer.enumTextureFormat.lum5_6_5:
                    return GWTK.gEngine.Renderer.enumPixelFormat.lum;
                case GWTK.gEngine.Renderer.enumTextureFormat.luma8_8_8_8:
                case GWTK.gEngine.Renderer.enumTextureFormat.luma4_4_4_4:
                case GWTK.gEngine.Renderer.enumTextureFormat.luma5_5_5_1:
                    return GWTK.gEngine.Renderer.enumPixelFormat.luma;
            }
        },
        /**
         * Конвертер формата изображения в тип пиксела
         * @method toPixelType
         * @public
         * @param format {GWTK.gEngine.Renderer.enumTextureFormat} Формат изображения
         * @return {GWTK.gEngine.Renderer.enumTextureType} Тип пиксела
         */
        toPixelType: function (format) {
            switch (format) {
                case GWTK.gEngine.Renderer.enumTextureFormat.alpha:
                    return GWTK.gEngine.Renderer.enumTextureType.uByte;
                case GWTK.gEngine.Renderer.enumTextureFormat.rgb8_8_8:
                    return GWTK.gEngine.Renderer.enumTextureType.uByte;
                case GWTK.gEngine.Renderer.enumTextureFormat.rgb5_6_5:
                    return GWTK.gEngine.Renderer.enumTextureType.uShort_565;
                case GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8:
                    return GWTK.gEngine.Renderer.enumTextureType.uByte;
                case GWTK.gEngine.Renderer.enumTextureFormat.rgba4_4_4_4:
                    return GWTK.gEngine.Renderer.enumTextureType.uShort_4444;
                case GWTK.gEngine.Renderer.enumTextureFormat.rgba5_5_5_1:
                    return GWTK.gEngine.Renderer.enumTextureType.uShort_5551;
                case GWTK.gEngine.Renderer.enumTextureFormat.lum8_8_8:
                    return GWTK.gEngine.Renderer.enumTextureType.uByte;
                case GWTK.gEngine.Renderer.enumTextureFormat.lum5_6_5:
                    return GWTK.gEngine.Renderer.enumTextureType.uShort_565;
                case GWTK.gEngine.Renderer.enumTextureFormat.luma8_8_8_8:
                    return GWTK.gEngine.Renderer.enumTextureType.uByte;
                case GWTK.gEngine.Renderer.enumTextureFormat.luma4_4_4_4:
                    return GWTK.gEngine.Renderer.enumTextureType.uShort_4444;
                case GWTK.gEngine.Renderer.enumTextureFormat.luma5_5_5_1:
                    return GWTK.gEngine.Renderer.enumTextureType.uShort_5551;
            }
        },

        /**
         * Конвертер формата изображения во внутренний формат буфера заполнения
         * @method toPixelInternalFormat
         * @public
         * @param format {GWTK.gEngine.Renderer.enumRenderBufferFormat} Формат буфера заполнения
         * @return {GWTK.gEngine.Renderer.enumRenderBufferInternalFormat} Внутренний формат буфера заполнения
         */
        toRenderBufferInternalFormat: function (format) {
            switch (format) {
                case GWTK.gEngine.Renderer.enumRenderBufferFormat.rgba4:
                    return GWTK.gEngine.Renderer.enumRenderBufferInternalFormat.rgba4;
                case GWTK.gEngine.Renderer.enumRenderBufferFormat.rgb5_6_5:
                    return GWTK.gEngine.Renderer.enumRenderBufferInternalFormat.rgb565;
                case GWTK.gEngine.Renderer.enumRenderBufferFormat.rgb5_a1:
                    return GWTK.gEngine.Renderer.enumRenderBufferInternalFormat.rgb5a1;
                case GWTK.gEngine.Renderer.enumRenderBufferFormat.depth_component_16:
                    return GWTK.gEngine.Renderer.enumRenderBufferInternalFormat.depthComponent16;
                case GWTK.gEngine.Renderer.enumRenderBufferFormat.stencil_index_8:
                    return GWTK.gEngine.Renderer.enumRenderBufferInternalFormat.stencilIndex8;
                case GWTK.gEngine.Renderer.enumRenderBufferFormat.depth_stencil:
                    return GWTK.gEngine.Renderer.enumRenderBufferInternalFormat.depthStencil;
            }
        }
    }
}