/****************************************** Тазин В.О. 23/06/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                          Полигон                                 *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Компонент рисования полигона
     * @class GWTK.gEngine.Scene.Polygon
     * @constructor GWTK.gEngine.Scene.Polygon
     * @extends  GWTK.gEngine.Scene.AbstractRenderable
     * @param id {string} Идентификатор объекта
     */
    GWTK.gEngine.Scene.Polygon = function (id) {
        var renderState = new GWTK.gEngine.Renderer.RenderState();
        renderState.depthTest.enabled = true;
        renderState.depthTest.func = GWTK.gEngine.Renderer.enumDepthComparisonFunction.Less;
        renderState.facetCulling.enabled = true;
        renderState.blending.enabled = true;
        renderState.blending.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
        renderState.blending.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
        renderState.blending.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
        renderState.blending.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;

        GWTK.gEngine.Scene.AbstractRenderable.call(this, id, "polygonVS", "polygonFS", renderState);

    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Scene.Polygon, GWTK.gEngine.Scene.AbstractRenderable);
}
