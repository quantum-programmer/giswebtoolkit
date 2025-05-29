/****************************************** Тазин В.О. 06/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                          Текст                                   *
 *                                                                  *
 *******************************************************************/
"use strict";
import { PrimitiveType } from '~/3d/engine/core/geometry/mesh';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Компонент рисования текста
     * @class GWTK.gEngine.Scene.TextObject
     * @constructor GWTK.gEngine.Scene.TextObject
     * @extends  GWTK.gEngine.Scene.AbstractRenderable
     * @param id {string} Идентификатор объекта

     */
    GWTK.gEngine.Scene.TextObject = function (id) {
        var renderState = new GWTK.gEngine.Renderer.RenderState();
        renderState.depthTest.enabled = true;
        renderState.depthTest.func = GWTK.gEngine.Renderer.enumDepthComparisonFunction.Less;
        renderState.facetCulling.enabled = true;
        renderState.blending.enabled = true;
        renderState.blending.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
        renderState.blending.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
        renderState.blending.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
        renderState.blending.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;

        GWTK.gEngine.Scene.AbstractRenderable.call(this, id, "textVS", "textFS", renderState);

        this.smooth = 0.17;
    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Scene.TextObject, GWTK.gEngine.Scene.AbstractRenderable);
    /**
     * Дополнительный метод обновления
     * @method _optionalUpdate
     * @private
     */
    GWTK.gEngine.Scene.TextObject.prototype._optionalUpdate = function () {
        var meshBuffers = GWTK.gEngine.Renderer.GraphicDevice.createUnionMeshBuffers(this._instancedMesh, this._drawState.shaderProgram.getVertexAttributes(), GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);
        this._drawState.instancedArray = GWTK.gEngine.Renderer.Context.createVertexArrayFromMeshBuffers(meshBuffers, this._drawState.instancedArray);
        this._instancedMesh = null;
    };
    /**
     * Команда рисования
     * @method _drawCommand
     * @private
     * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
     */
    GWTK.gEngine.Scene.TextObject.prototype._drawCommand = function (sceneState) {
        var uniforms=this._drawState.shaderProgram.getUniforms();
        uniforms['uCameraUp'].setValue(sceneState.getCamera().getOrientation());
        uniforms['uCameraRight'].setValue(sceneState.getCamera().getCameraRightVector());
        uniforms['uSmooth'].setValue(this.smooth);
        uniforms['uDevicePixelSize'].setValue(GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO);
        var primitiveTypeWebgl = sceneState.wireFrameMode ? PrimitiveType.Lines : this._drawState.renderState.drawingType;
        GWTK.gEngine.Renderer.Context.drawInstanced(primitiveTypeWebgl, this._drawState, sceneState);
    };
    /**
     * Метод перед удалением
     * @method _preDestroyCommand
     * @private
     */
    GWTK.gEngine.Scene.TextObject.prototype._preDestroyCommand = function () {
        if (this._drawState && this._drawState.instancedArray) {
            this._drawState.instancedArray.destroy();
            this._drawState.instancedArray = null;
        }
        this._instancedMesh = null;
    };
    /**
     * Установить меш повторяющихся параметров
     * @method setInstancedMesh
     * @public
     * @param mesh {Mesh} Меш
     */
    GWTK.gEngine.Scene.TextObject.prototype.setInstancedMesh = function (mesh) {
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
    GWTK.gEngine.Scene.TextObject.prototype.getInstancedMesh = function () {
        return this._instancedMesh;
    };
    /** Установить описание
     * @method setDescription
     * @public
     * @param description {object} Описание объекта
     */
    GWTK.gEngine.Scene.TextObject.prototype.setDescription = function (description) {
        if (description.color) {
            this.setColor(description.color, 0);
        }
        if (description.material) {
            this._setMaterial(description.material, 1);
        }
        if (description.textureId) {
            this._setTextureId(description.textureId);
        }
        if (description.smooth) {
            this.smooth = 0.05 + 0.2 * description.smooth;
        }
    };
    /**
     * Обновить униформ текстуры
     * @method _updateTexture
     * @private
     */
    GWTK.gEngine.Scene.TextObject.prototype._updateTexture = function () {
        var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry(this._texture);
        if (texture !== undefined) {
            GWTK.gEngine.Renderer.Context.setTextureUnit(0, texture);
            this._uTextureFlag.setValue(true);
        } else if (GWTK.gEngine.ResourceMap.isAssetActuallyLoaded(this._texture)) {
            var textureParams = GWTK.gEngine.ResourceMap.retrieveAsset(this._texture);
            texture = GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate(this._texture, textureParams.description, textureParams.img, textureParams.locked, textureParams.sampler);
            GWTK.gEngine.Renderer.Context.setTextureUnit(0, texture);
            this._uTextureFlag.setValue(true);
        } else {
            this._uTextureFlag.setValue(false);
        }

    };

    /**
     * Обновить состояние освещения
     * @method _updateLightInfo
     * @private
     * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
     */
    GWTK.gEngine.Scene.TextObject.prototype._updateLightInfo=function(sceneState) {
        if (this._drawState.shaderProgram.getUniforms()['uCenterPoint']) {
            this._drawState.shaderProgram.getUniforms()['uCenterPoint'].setValue(this.getOBB().getCenter());
        }
    };
}
