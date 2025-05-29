/**************************************** Железнякова Ю 30/11/20  ***
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                              Анимированный знак                  *
 *                                                                  *
 *******************************************************************/
"use strict";
import { PrimitiveType } from '~/3d/engine/core/geometry/mesh';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Компонент рисования анимированных знаков
     * @class GWTK.gEngine.Scene.AnimatedObject
     * @constructor GWTK.gEngine.Scene.AnimatedObject
     * @extends GWTK.gEngine.Scene.AbstractRenderable
     * @param id {string} Идентификатор объекта
     * @param animatedParam {object} параметры анимированного знака
     */
    GWTK.gEngine.Scene.AnimatedObject = function (id, animatedParam) {
        var renderState = new GWTK.gEngine.Renderer.RenderState();
        renderState.depthTest.enabled = true;
        renderState.depthTest.func = GWTK.gEngine.Renderer.enumDepthComparisonFunction.Less;
        renderState.facetCulling.enabled = true;
        renderState.blending.enabled = true;
        renderState.blending.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
        renderState.blending.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
        renderState.blending.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
        renderState.blending.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
        this.animatedParam = animatedParam;
        this.now_ = new Date();
        this.timeBase_ = new Date();
        this.timeSource_ = this.createDefaultClock_().bind(this);
        this.createFountainTexture();
        // this.createFountainTextureColorSempler();

        GWTK.gEngine.Scene.AbstractRenderable.call(this, id, "animatedVS", "animatedFS", renderState);
    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Scene.AnimatedObject, GWTK.gEngine.Scene.AbstractRenderable);
    /**
     * Дополнительный метод обновления
     * @method _optionalUpdate
     * @private
     */
    GWTK.gEngine.Scene.AnimatedObject.prototype._optionalUpdate = function () {
        var meshBuffers = GWTK.gEngine.Renderer.GraphicDevice.createUnionMeshBuffers(this._instancedMesh, this._drawState.shaderProgram.getVertexAttributes(), GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);
        this._drawState.instancedArray = GWTK.gEngine.Renderer.Context.createVertexArrayFromMeshBuffers(meshBuffers, this._drawState.instancedArray);
    };

    /**
     * Создание внутренних часов для частиц
     *
     * @return {function(): number}
     * @private
     */
    GWTK.gEngine.Scene.AnimatedObject.prototype.createDefaultClock_ = function () {
        return function () {
            var now = this.now_;
            var base = this.timeBase_;
            return (now.getTime() - base.getTime()) / 1000.0;
        }
    };


    /**
     * Команда рисования
     * @method _drawCommand
     * @private
     * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
     */
    GWTK.gEngine.Scene.AnimatedObject.prototype._drawCommand = function (sceneState) {
        this._drawState.shaderProgram.getUniforms()['worldVelocity'].setValue(this.animatedParam.worldVelocity);
        this._drawState.shaderProgram.getUniforms()['worldAcceleration'].setValue(this.animatedParam.worldAcceleration);
        this._drawState.shaderProgram.getUniforms()['timeRange'].setValue(this.animatedParam.timeRange);
        this._drawState.shaderProgram.getUniforms()['numFrames'].setValue(this.animatedParam.numFrames);
        this._drawState.shaderProgram.getUniforms()['frameDuration'].setValue(this.animatedParam.frameDuration);

        // Обновить представление о текущем времени
        this.now_ = new Date();
        var curTime = this.timeSource_();
        this._drawState.shaderProgram.getUniforms()['time'].setValue(curTime);

        var timeOffset = 0;
        this._drawState.shaderProgram.getUniforms()['timeOffset'].setValue(timeOffset);

        var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry('fountainTexture');
        if (texture !== undefined) {
            GWTK.gEngine.Renderer.Context.setTextureUnit(0, texture);
        }
        texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry('fountainTextureColorRamp');
        if (texture !== undefined) {
            GWTK.gEngine.Renderer.Context.setTextureUnit(1, texture);
        }


        this._drawState.shaderProgram.getUniforms()['uCameraUp'].setValue(sceneState.getCamera().getOrientation());
        var primitiveTypeWebgl = PrimitiveType.Triangles;
        GWTK.gEngine.Renderer.Context.drawInstanced(primitiveTypeWebgl, this._drawState, sceneState);
    };
    /**
     * Установить меш повторяющихся параметров
     * @method setInstancedMesh
     * @public
     * @param mesh {Mesh} Меш
     */
    GWTK.gEngine.Scene.AnimatedObject.prototype.setInstancedAnimatedMesh = function (mesh) {
        if (this._instancedMesh !== mesh) {
            this._instancedMesh = mesh;
            this._isDirty = true;
        }
    };
    /**
     * Метод перед удалением
     * @method _preDestroyCommand
     * @private
     */
    GWTK.gEngine.Scene.AnimatedObject.prototype._preDestroyCommand = function () {
        if (this._drawState && this._drawState.instancedArray) {
            this._drawState.instancedArray.destroy();
            this._drawState.instancedArray = null;
        }
        this._instancedMesh = null;
    };

    /**
     * Создание массива пикселей для текстуры
     * @method pixelToUint8Array
     * @param pixels
     * @return {Uint8Array}
     */
    GWTK.gEngine.Scene.AnimatedObject.prototype.pixelToUint8Array = function(pixels) {
        var data = new Uint8Array(pixels.length);
        for (var i = 0; i < pixels.length; i++) {
            if (pixels[i] <= 1) {
                var t = pixels[i] * 255.;
            } else {
                t = pixels[i];
            }
            data[i] = t;
        }
        return data;
    };


    /** Создание текстуры для фонтана
     * TODO:  кешировать результат в prototype
     * @method createFountainTexture
     */
    GWTK.gEngine.Scene.AnimatedObject.prototype.createFountainTexture = function () {
        var pixelColorSempler = [0., 0.20, 0.70, 1, 0.70, 0.20, 0., 0];
        var pixelsColorSempler = [];
        for (var yy = 0; yy < 8; ++yy) {
            for (var xx = 0; xx < 8; ++xx) {
                var pixel = pixelColorSempler[xx] * pixelColorSempler[yy];
                pixelsColorSempler.push(pixel, pixel, pixel, pixel);
            }
        }

        var dataColorSempler = this.pixelToUint8Array(pixelsColorSempler);
        var description = new GWTK.gEngine.Renderer.Texture2DDescription(8, 8, GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8, false);
        GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate('fountainTexture', description, dataColorSempler, true, GWTK.gEngine.Renderer.TextureSamplers.linearClamp);


        var pixelRampSempler = [58, 139, 166, 0.8,
            104, 150, 166, 0.5,
            0, 0, 0, 0];
        var dataRampSempler = this.pixelToUint8Array(pixelRampSempler);
        description = new GWTK.gEngine.Renderer.Texture2DDescription(3, 1, GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8, false);
        GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate('fountainTextureColorRamp', description, dataRampSempler, true, GWTK.gEngine.Renderer.TextureSamplers.linearClamp);
    }

}
