/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *         Класс состояния попиксельной области рисования           *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Класс состояния попиксельной области рисования
     * @class GWTK.gEngine.Renderer.StencilTest
     * @constructor GWTK.gEngine.Renderer.StencilTest
     */
    GWTK.gEngine.Renderer.StencilTest = function () {
        this.enabled = false;
        this.front = new GWTK.gEngine.Renderer.StencilTestFace();
        this.back = new GWTK.gEngine.Renderer.StencilTestFace();
        this.frontAndBack = new GWTK.gEngine.Renderer.StencilTestFace();
    };

    /**
     * Класс функции определения попиксельной области рисования
     * @class GWTK.gEngine.Renderer.StencilTestFace
     * @constructor GWTK.gEngine.Renderer.StencilTestFace
     */
    GWTK.gEngine.Renderer.StencilTestFace = function () {
        this.stencilFail = GWTK.gEngine.Renderer.enumStencilOperation.Keep;
        this.depthFailStencilPass = GWTK.gEngine.Renderer.enumStencilOperation.Keep;
        this.depthPassStencilPass = GWTK.gEngine.Renderer.enumStencilOperation.Keep;
        this.func = GWTK.gEngine.Renderer.enumStencilTestFunction.Always;
        this.ref = 0;
        this.mask = -1;
    };


}