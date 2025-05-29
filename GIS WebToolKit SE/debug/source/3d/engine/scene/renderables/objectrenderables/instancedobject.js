/****************************************** Тазин В.О. 23/04/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                              Знак                                *
 *                                                                  *
 *******************************************************************/
"use strict";
import { PrimitiveType } from '~/3d/engine/core/geometry/mesh';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Компонент рисования знаков
     * @class GWTK.gEngine.Scene.InstancedObject
     * @constructor GWTK.gEngine.Scene.InstancedObject
     * @extends GWTK.gEngine.Scene.AbstractRenderable
     * @param id {string} Идентификатор объекта
     */
    GWTK.gEngine.Scene.InstancedObject = function (id) {
        var renderState = new GWTK.gEngine.Renderer.RenderState();
        renderState.depthTest.enabled = true;
        renderState.depthTest.func = GWTK.gEngine.Renderer.enumDepthComparisonFunction.Less;
        renderState.facetCulling.enabled = true;
        // renderState.facetCulling.face = GWTK.gEngine.Renderer.enumCullFaceMode.Front;
        renderState.blending.enabled = true;
        renderState.blending.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
        renderState.blending.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
        renderState.blending.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
        renderState.blending.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;

        GWTK.gEngine.Scene.AbstractRenderable.call(this, id, "simpleVS", "simpleFS", renderState);
    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Scene.InstancedObject, GWTK.gEngine.Scene.AbstractRenderable);
    /**
     * Дополнительный метод обновления
     * @method _optionalUpdate
     * @private
     */
    GWTK.gEngine.Scene.InstancedObject.prototype._optionalUpdate = function () {
        var meshBuffers = GWTK.gEngine.Renderer.GraphicDevice.createUnionMeshBuffers(this._instancedMesh, this._drawState.shaderProgram.getVertexAttributes(), GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);
        this._drawState.instancedArray = GWTK.gEngine.Renderer.Context.createVertexArrayFromMeshBuffers(meshBuffers, this._drawState.instancedArray);
        // this._instancedMesh = null;
    };
    /**
     * Команда рисования
     * @method _drawCommand
     * @private
     * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
     */
    GWTK.gEngine.Scene.InstancedObject.prototype._drawCommand = function (sceneState) {
        this._drawState.shaderProgram.getUniforms()['uDepthTextureFlag'].setValue(this.uDepthTextureFlag===true);
        if(this.uDepthTextureFlag===true){
            var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry('_DEPTH_TEXTURE');
            if (texture !== undefined) {
                GWTK.gEngine.Renderer.Context.setTextureUnit(0, texture);
                GWTK.gEngine.Renderer.Context.setTextureUnit(1, texture);
            }
        }
        this._drawState.shaderProgram.getUniforms()['uCameraUp'].setValue(sceneState.getCamera().getOrientation());
        var primitiveTypeWebgl = sceneState.wireFrameMode ? PrimitiveType.Lines : this._drawState.renderState.drawingType;
        GWTK.gEngine.Renderer.Context.drawInstanced(primitiveTypeWebgl, this._drawState, sceneState);
    };
    /**
     * Установить меш повторяющихся параметров
     * @method setInstancedMesh
     * @public
     * @param mesh {Mesh} Меш
     */
    GWTK.gEngine.Scene.InstancedObject.prototype.setInstancedMesh = function (mesh) {
        if (this._instancedMesh !== mesh) {
            this._instancedMesh = mesh;
            this._isDirty = true;
        }
    };
    /**
     * Получить меш повторяющихся параметров
     * @method getInstancedMesh
     * @public
     * @return {Mesh} Меш
     */
    GWTK.gEngine.Scene.InstancedObject.prototype.getInstancedMesh = function () {
        return this._instancedMesh;
    };
    /**
     * Метод перед удалением
     * @method _preDestroyCommand
     * @private
     */
    GWTK.gEngine.Scene.InstancedObject.prototype._preDestroyCommand = function () {
        if (this._drawState && this._drawState.instancedArray) {
            this._drawState.instancedArray.destroy();
            this._drawState.instancedArray = null;
        }
        this._instancedMesh = null;
    };
}
