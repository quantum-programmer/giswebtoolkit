/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Класс параметров очищения области рисования             *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Класс параметров очищения области рисования
     * @class GWTK.gEngine.Renderer.ClearState
     * @constructor GWTK.gEngine.Renderer.ClearState
     */
    GWTK.gEngine.Renderer.ClearState = function () {
        this.scissorTest = new GWTK.gEngine.Renderer.ScissorTest();
        this.colorMask = new GWTK.gEngine.Renderer.ColorMask(true, true, true, true);
        this.depthMask = true;
        this.frontStencilMask = -1;
        this.backStencilMask = -1;
        this.buffers = GWTK.gEngine.Renderer.enumClearBuffers.All;
        this.color = [1.0, 1.0, 1.0, 0.0];
        this.depth = 1;
        this.stencil = 0;
    };
}