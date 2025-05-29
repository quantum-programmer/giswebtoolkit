/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Класс состояния определенной области рисования         *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Класс состояния определенной области рисования
     * @class GWTK.gEngine.Renderer.ScissorTest
     * @constructor GWTK.gEngine.Renderer.ScissorTest
     */
    GWTK.gEngine.Renderer.ScissorTest = function () {
        this.enabled = false;
        this.box=[0, 0, 0, 0];// [x, y, width, height]
    };
}