/****************************************** Тазин В.О. 24/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Простой полигон                             *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Компонент рисования простого полигона
     * @class GWTK.gEngine.Scene.SimplePolygon
     * @constructor GWTK.gEngine.Scene.SimplePolygon
     * @extends GWTK.gEngine.Scene.AbstractRenderable
     * @param id {string} Идентификатор объекта
     */
    GWTK.gEngine.Scene.SimplePolygon = function (id) {
        var renderState = new GWTK.gEngine.Renderer.RenderState();
        renderState.depthTest.enabled = false;
        renderState.facetCulling.enabled = false;
        renderState.blending.enabled = true;
        renderState.blending.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
        renderState.blending.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
        renderState.blending.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
        renderState.blending.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;

        GWTK.gEngine.Scene.AbstractRenderable.call(this, id, "simplePolygonVS", "simplePolygonFS", renderState);

    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Scene.SimplePolygon, GWTK.gEngine.Scene.AbstractRenderable);

    /**
     * Инициализация компонента
     * @method _init
     * @private
     */
    GWTK.gEngine.Scene.SimplePolygon.prototype._init = function () {
        GWTK.gEngine.Scene.AbstractRenderable.prototype._init.call(this);
        this.uDepthTestFlag = this._drawState.shaderProgram.getUniforms()['uDepthTestFlag'];
        this.depthTestFlag = false;
    };
    /**
     * Обновить униформ текстуры
     * @method _updateTexture
     * @private
     */
    GWTK.gEngine.Scene.SimplePolygon.prototype._updateTexture = function () {
        if (this.depthTestFlag === true) {
            var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry('_DEPTH_TEXTURE');
            if (texture !== undefined) {
                GWTK.gEngine.Renderer.Context.setTextureUnit(0, texture);
                this.uDepthTestFlag.setValue(true);
            }
        } else {
            this.uDepthTestFlag.setValue(false);
        }
    };
}
