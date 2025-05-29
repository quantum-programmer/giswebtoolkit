/****************************************** Тазин В.О. 23/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                           Полилиния                              *
 *                                                                  *
 *******************************************************************/
"use strict";
import { vec3 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Компонент рисования полилинии
     * @class GWTK.gEngine.Scene.Polyline
     * @constructor GWTK.gEngine.Scene.Polyline
     * @extends  GWTK.gEngine.Scene.AbstractRenderable
     * @param id {string} Идентификатор объекта
     */
    GWTK.gEngine.Scene.Polyline = function (id) {
        var renderState = new GWTK.gEngine.Renderer.RenderState();
        renderState.depthTest.enabled = true;
        renderState.depthTest.func = GWTK.gEngine.Renderer.enumDepthComparisonFunction.Less;
        renderState.facetCulling.enabled = true;
        renderState.blending.enabled = true;
        renderState.blending.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
        renderState.blending.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
        renderState.blending.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
        renderState.blending.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;

        GWTK.gEngine.Scene.AbstractRenderable.call(this, id, "lineVS", "lineFS", renderState);
        this.distanceValue = [];
    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Scene.Polyline, GWTK.gEngine.Scene.AbstractRenderable);
    /**
     * Обновить униформ текстуры
     * @method _updateTexture
     * @private
     */
    GWTK.gEngine.Scene.Polyline.prototype._updateTexture = function () {
        var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry('_DEPTH_TEXTURE');
        if (texture !== undefined) {
            GWTK.gEngine.Renderer.Context.setTextureUnit(0, texture);
        }
    };


    /**
     * Команда рисования
     * @method _drawCommand
     * @private
     * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
     */
    GWTK.gEngine.Scene.Polyline.prototype._drawCommand = function (sceneState) {

        vec3.sub(sceneState.getCamera().getCameraPosition(), this.getOBB().getCenter(), this.distanceValue)
        this._drawState.shaderProgram.getUniforms()['uObjectDistance'].setValue(vec3.len(this.distanceValue));

        GWTK.gEngine.Scene.AbstractRenderable.prototype._drawCommand.call(this, sceneState);
    };
}
