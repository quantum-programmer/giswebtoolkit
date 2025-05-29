/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Класс состояния смешивания                 *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     *  Класс состояния смешивания
     * @class GWTK.gEngine.Renderer.Blending
     * @constructor GWTK.gEngine.Renderer.Blending
     */
    GWTK.gEngine.Renderer.Blending = function () {
        this.enabled = false;
        this.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.One;
        this.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.Zero;
        this.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.One;
        this.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.Zero;

        this.blendEquationRGB = GWTK.gEngine.Renderer.enumBlendEquationMode.Func_Add;
        this.blendEquationAlpha = GWTK.gEngine.Renderer.enumBlendEquationMode.Func_Add;

        this.blendColor = [0, 0, 0, 0];//(red, green, blue, alpha) in the range of 0 to 1
    };
}