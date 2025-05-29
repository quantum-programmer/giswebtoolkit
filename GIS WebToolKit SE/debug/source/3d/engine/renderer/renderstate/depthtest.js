/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Класс состояния теста глубины                   *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};


    /**
     * Класс состояния теста глубины
     * @class GWTK.gEngine.Renderer.DepthTest
     * @constructor GWTK.gEngine.Renderer.DepthTest
     */
    GWTK.gEngine.Renderer.DepthTest = function () {
        this.enabled = true;
        this.func = GWTK.gEngine.Renderer.enumDepthComparisonFunction.Less;
    };

    /**
     * Класс параметров теста глубины
     * @class GWTK.gEngine.Renderer.DepthRange
     * @constructor GWTK.gEngine.Renderer.DepthRange
     */
    GWTK.gEngine.Renderer.DepthRange = function () {
        this.zNear = 0.0;
        this.zFar = 1.0;
    };


}