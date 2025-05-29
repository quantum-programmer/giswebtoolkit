/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                          Шаблоны текстуры                        *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Коллекция шаблонов текстуры
     * @class GWTK.gEngine.Renderer.TextureSamplers
     * @static
     */
    GWTK.gEngine.Renderer.TextureSamplers = Object.freeze({
        nearestClamp: {
            TEXTURE_MAG_FILTER: GWTK.gEngine.Renderer.enumTextureMagnificationFilter.Nearest,
            TEXTURE_MIN_FILTER: GWTK.gEngine.Renderer.enumTextureMinificationFilter.Nearest,
            TEXTURE_WRAP_S: GWTK.gEngine.Renderer.enumTextureWrap.Clamp,
            TEXTURE_WRAP_T: GWTK.gEngine.Renderer.enumTextureWrap.Clamp
        },

        linearClamp: {
            TEXTURE_MAG_FILTER: GWTK.gEngine.Renderer.enumTextureMagnificationFilter.Linear,
            TEXTURE_MIN_FILTER: GWTK.gEngine.Renderer.enumTextureMinificationFilter.Linear,
            TEXTURE_WRAP_S: GWTK.gEngine.Renderer.enumTextureWrap.Clamp,
            TEXTURE_WRAP_T: GWTK.gEngine.Renderer.enumTextureWrap.Clamp
        },
        linearMipmapNearestClamp: {
            TEXTURE_MAG_FILTER: GWTK.gEngine.Renderer.enumTextureMagnificationFilter.Linear,
            TEXTURE_MIN_FILTER: GWTK.gEngine.Renderer.enumTextureMinificationFilter.LinearMipmapNearest,
            TEXTURE_WRAP_S: GWTK.gEngine.Renderer.enumTextureWrap.Clamp,
            TEXTURE_WRAP_T: GWTK.gEngine.Renderer.enumTextureWrap.Clamp
        },
        linearMipmapLinearClamp: {
            TEXTURE_MAG_FILTER: GWTK.gEngine.Renderer.enumTextureMagnificationFilter.Linear,
            TEXTURE_MIN_FILTER: GWTK.gEngine.Renderer.enumTextureMinificationFilter.LinearMipmapLinear,
            TEXTURE_WRAP_S: GWTK.gEngine.Renderer.enumTextureWrap.Clamp,
            TEXTURE_WRAP_T: GWTK.gEngine.Renderer.enumTextureWrap.Clamp
        },
        nearestRepeat: {
            TEXTURE_MAG_FILTER: GWTK.gEngine.Renderer.enumTextureMagnificationFilter.Nearest,
            TEXTURE_MIN_FILTER: GWTK.gEngine.Renderer.enumTextureMinificationFilter.Nearest,
            TEXTURE_WRAP_S: GWTK.gEngine.Renderer.enumTextureWrap.Repeat,
            TEXTURE_WRAP_T: GWTK.gEngine.Renderer.enumTextureWrap.Repeat
        },
        linearRepeat: {
            TEXTURE_MAG_FILTER: GWTK.gEngine.Renderer.enumTextureMagnificationFilter.Linear,
            TEXTURE_MIN_FILTER: GWTK.gEngine.Renderer.enumTextureMinificationFilter.Linear,
            TEXTURE_WRAP_S: GWTK.gEngine.Renderer.enumTextureWrap.Repeat,
            TEXTURE_WRAP_T: GWTK.gEngine.Renderer.enumTextureWrap.Repeat
        },
        linearMipmapRepeat: {
            TEXTURE_MAG_FILTER: GWTK.gEngine.Renderer.enumTextureMagnificationFilter.Linear,
            TEXTURE_MIN_FILTER: GWTK.gEngine.Renderer.enumTextureMinificationFilter.LinearMipmapLinear,
            TEXTURE_WRAP_S: GWTK.gEngine.Renderer.enumTextureWrap.Repeat,
            TEXTURE_WRAP_T: GWTK.gEngine.Renderer.enumTextureWrap.Repeat
        }
    });

}