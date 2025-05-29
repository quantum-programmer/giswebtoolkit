/****************************************** Тазин В.О. 24/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Полигон по поверхности                        *
 *                                                                  *
 *******************************************************************/
"use strict";
import { PrimitiveType } from '~/3d/engine/core/geometry/mesh';
import { vec3 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Компонент рисования полигона по поверхности
     * @class GWTK.gEngine.Scene.ShadowVolumePolygon
     * @constructor GWTK.gEngine.Scene.ShadowVolumePolygon
     * @param id {string} Идентификатор объекта
     */
    GWTK.gEngine.Scene.ShadowVolumePolygon = function (id) {

        this._clearBeforeDraw = new GWTK.gEngine.Renderer.ClearState();
        this._clearBeforeDraw.buffers = GWTK.gEngine.Renderer.enumClearBuffers.StencilBuffer;
        this._plane = new GWTK.gEngine.Scene.Plane();

        var renderState = new GWTK.gEngine.Renderer.RenderState();
        renderState.depthTest.enabled = true;
        renderState.depthMask = false;
        renderState.depthTest.func = GWTK.gEngine.Renderer.enumDepthComparisonFunction.LEqual;
        renderState.facetCulling.enabled = false;
        renderState.stencilTest.enabled = true;
        renderState.stencilTest.front.depthFailStencilPass = GWTK.gEngine.Renderer.enumStencilOperation.DecrementWrap;
        renderState.stencilTest.front.mask = 0xFF;
        renderState.stencilTest.back.depthFailStencilPass = GWTK.gEngine.Renderer.enumStencilOperation.IncrementWrap;
        renderState.stencilTest.back.mask = 0xFF;
        renderState.colorMask.red = renderState.colorMask.green = renderState.colorMask.blue = renderState.colorMask.alpha = false;

        GWTK.gEngine.Scene.AbstractRenderable.call(this, id, "shadowPolygonVS", "shadowPolygonFS", renderState);
        this.minDistance = 0;
        this._distanceVector = [];
    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Scene.ShadowVolumePolygon, GWTK.gEngine.Scene.AbstractRenderable);

    /**
     * Установить цвет
     * @method setColor
     * @public
     * @param value {array} Цвет [R,G,B,A]
     * @param index {number} Индекс материала
     */
    GWTK.gEngine.Scene.ShadowVolumePolygon.prototype.setColor = function (value, index) {
        this._plane.setFillColor(value);
    };
    /**
     * Команда рисования
     * @method _drawCommand
     * @private
     * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
     */
    GWTK.gEngine.Scene.ShadowVolumePolygon.prototype._drawCommand = function (sceneState) {
        var obb = this.getOBB();
        if (obb.testPoint(sceneState.getCameraPosition())&&(vec3.dot(sceneState.getCameraPosition(), vec3.normalize(obb.getCenter(), this._distanceVector)) - vec3.len(obb.getCenter())) < this.minDistance) {
            return;
        }

        var context = GWTK.gEngine.Renderer.Context;
        context.clear(this._clearBeforeDraw);

        var primitiveTypeWebgl = sceneState.wireFrameMode ? PrimitiveType.Lines : this._drawState.renderState.drawingType;


        // var primitiveTypeWebgl = this._drawState.renderState.drawingType;
        GWTK.gEngine.Renderer.Context.draw(primitiveTypeWebgl, this._drawState, sceneState);

        this._plane.render(sceneState, false);
    };


    /**
     * Обновить униформ текстуры
     * @method _updateTexture
     * @private
     */
    GWTK.gEngine.Scene.ShadowVolumePolygon.prototype._updateTexture = function () {
        var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry('_DEPTH_TEXTURE');
        if (texture !== undefined) {
            GWTK.gEngine.Renderer.Context.setTextureUnit(1, texture);
        }
        var stexture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry('_SURFACE_DEPTH_TEXTURE');
        if (stexture !== undefined) {
            GWTK.gEngine.Renderer.Context.setTextureUnit(0, stexture);
        }
    };


    /**
     * Обновить униформ материала
     * @method _updateMaterial
     * @private
     */
    GWTK.gEngine.Scene.ShadowVolumePolygon.prototype._updateMaterial = function () {
    };
    /**
     * Обновить состояние освещения
     * @method _updateLightInfo
     * @private
     */
    GWTK.gEngine.Scene.ShadowVolumePolygon.prototype._updateLightInfo = function () {
    };
}
