/******************************************** Тазин В. 28/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Плоский четырехугольник с текстурой                *
 *                                                                  *
 *******************************************************************/
import { IndicesType } from '~/3d/engine/core/geometry/indices';
import { PrimitiveType } from '~/3d/engine/core/geometry/mesh';
import { mat4 } from '~/3d/engine/utils/glmatrix';

"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Компонент рисования плоского четырехугольника
     * @class GWTK.gEngine.Scene.TexturedSquare
     * @constructor GWTK.gEngine.Scene.TexturedSquare
     */
    GWTK.gEngine.Scene.TexturedSquare = function () {

        this.kColorVS = "texturedSquareVS";
        this.kColorFS = "texturedSquareFS";

        this.enable = false;

        var positionBuffer = GWTK.gEngine.Renderer.GraphicDevice.createVertexBuffer(GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);
        positionBuffer.setData(new Float32Array([
                -1, -1, 0, 0,
                1, -1, 1, 0,
                -1, 1, 0, 1,
                1, 1, 1, 1]
            )
        );

        var positionAttributeBuffer = new GWTK.gEngine.Renderer.WebGL.VertexBufferAttributeWebgl(positionBuffer, GWTK.gEngine.Renderer.enumComponentDataType.Float, 2, 0, 0, 16);
        var textureAttributeBuffer = new GWTK.gEngine.Renderer.WebGL.VertexBufferAttributeWebgl(positionBuffer, GWTK.gEngine.Renderer.enumComponentDataType.Float, 2, 0, 8, 16);

        var indices = new Uint16Array([0, 1, 2, 2, 1, 3]);

        var indexBuffer = GWTK.gEngine.Renderer.GraphicDevice.createIndexBuffer(GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw, IndicesType.uShort);
        indexBuffer.setData(indices);
        var context = GWTK.gEngine.Renderer.Context;
        this.vertexArray = context.createEmptyVertexArray();
        this.vertexArray.setAttribute(GWTK.gEngine.Renderer.enumVertexAttributeLocations.aVertexPosition, positionAttributeBuffer);
        this.vertexArray.setAttribute(GWTK.gEngine.Renderer.enumVertexAttributeLocations.aTextureCoord, textureAttributeBuffer);
        this.vertexArray.setIndexBuffer(indexBuffer);

        GWTK.gEngine.Scene.TexturedSquare.prototype.mvMatrix = mat4.identity([]);
        this._textureParams = [];

        GWTK.gEngine.ResourceMap.retrieveAssetsOnload([this.kColorVS, this.kColorFS], this._init.bind(this));

    };
    GWTK.gEngine.Scene.TexturedSquare.prototype = {
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mSupport
         */
        mSupport: [[], [], [], [], [], []],
        /**
         * Инициализация компонента
         * @method _init
         * @private
         */
        _init: function () {
            var fillRS = new GWTK.gEngine.Renderer.RenderState();
            fillRS.depthTest.enabled = false;
            fillRS.facetCulling.enabled = true;
            fillRS.blending.enabled = true;
            fillRS.blending.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            fillRS.blending.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            fillRS.blending.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
            fillRS.blending.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;

            var vs = GWTK.gEngine.ResourceMap.retrieveAsset(this.kColorVS);
            var fs = GWTK.gEngine.ResourceMap.retrieveAsset(this.kColorFS);
            var fillSP = GWTK.gEngine.Renderer.ShaderMap.retrieveOrCreate("shaderName_" + this.kColorVS + this.kColorFS, vs, fs);

            this._fillAlphaUniform = fillSP.getUniforms()["u_alpha"];
            this.uTextureParams = fillSP.getUniforms()["uTextureParams"];

            this.show = true;

            this._drawStateFill = new GWTK.gEngine.Renderer.DrawState(fillRS, fillSP, this.vertexArray);
        },

        /**
         * Рисование компонента
         * @method render
         * @public
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         */
        render: function (sceneState) {
            var drawFlag = false;
            if (this.show) {
                var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry(this._texture);
                if (texture !== undefined) {
                    var uniforms = this._drawStateFill.shaderProgram.getUniforms();
                    uniforms['uMVMatrix'].setValue(this.mvMatrix);
                    this._updateFillOpacity();
                    this._updateTextureParams();
                    var context = GWTK.gEngine.Renderer.Context;
                    context.setTextureUnit(0, texture);
                    context.draw(PrimitiveType.Triangles, this._drawStateFill, sceneState, 6, 0);
                    drawFlag = true;
                    context.unsetTextureUnit(0);
                }
            }
            return drawFlag;
        },
        /**
         * Удаление буферов из контекста
         * @method destroy
         * @public
         */
        destroy: function () {
            this._texture = null;
            if (this.vertexArray) {
                this.vertexArray.destroy();
                this.vertexArray = null;
            }
            GWTK.gEngine.Scene.TexturedSquare.prototype.mvMatrix.length = 0;
            for (var i = 0; i < this.mSupport; i++) {
                this.mSupport[i].length = 0;
            }
        },
        /**
         * Установить непрозрачность заливки
         * @method setOpacity
         * @public
         * @param value {number} Непрозрачность заливки
         */
        setOpacity: function (value) {
            this._opacity = value;
        },
        /**
         * Обновить униформ непрозрачности заливки
         * @method _updateFillOpacity
         * @private
         */
        _updateFillOpacity: function () {
            this._fillAlphaUniform.setValue(this._opacity);
        },
        /**
         * Установить идентификатор текстуры
         * @method setTextureId
         * @public
         * @param textureId {string} Идентификатор текстуры
         */
        setTextureId: function (textureId) {
            this._texture = textureId;
        },
        /**
         * Установить параметры текстуры
         * @method setTextureParams
         * @public
         * @param value {array} Параметры текстуры [xOffset,yOddset,kWidth,kHeight]
         */
        setTextureParams: function (value) {
            this._textureParams[0] = value[0];
            this._textureParams[1] = value[1];
            this._textureParams[2] = value[2];
            this._textureParams[3] = value[3];
        },
        /**
         * Обновить униформ параметров текстуры
         * @method _updateTextureParams
         * @private
         */
        _updateTextureParams: function () {
            this.uTextureParams.setValue(this._textureParams);
        }
    }
}