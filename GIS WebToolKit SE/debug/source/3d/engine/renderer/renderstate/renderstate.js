/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Класс состояния контекста рисования            *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};


    /**
     * Класс состояния контекста рисования
     * @class GWTK.gEngine.Renderer.RenderState
     * @constructor GWTK.gEngine.Renderer.RenderState
     */
    GWTK.gEngine.Renderer.RenderState = function () {
        this.facetCulling = new GWTK.gEngine.Renderer.FacetCulling();
        this.drawingType = GWTK.gEngine.Renderer.enumDrawingType.Triangles;

        this.scissorTest = new GWTK.gEngine.Renderer.ScissorTest();
        this.stencilTest = new GWTK.gEngine.Renderer.StencilTest();
        this.depthTest = new GWTK.gEngine.Renderer.DepthTest();
        this.depthRange = new GWTK.gEngine.Renderer.DepthRange();
        this.blending = new GWTK.gEngine.Renderer.Blending();
        this.colorMask = new GWTK.gEngine.Renderer.ColorMask(true, true, true, true);
        this.depthMask = true;
    };
}