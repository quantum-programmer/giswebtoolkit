/******************************************** Тазин В. 28/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Плоский четырехугольник                         *
 *                                                                  *
 *******************************************************************/
import { IndicesType } from '~/3d/engine/core/geometry/indices';
import { PrimitiveType } from '~/3d/engine/core/geometry/mesh';
import { mat4, vec3 } from '~/3d/engine/utils/glmatrix';

"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Компонент рисования плоского четырехугольника
     * @class GWTK.gEngine.Scene.Plane
     * @constructor GWTK.gEngine.Scene.Plane
     */
    GWTK.gEngine.Scene.Plane = function () {
        this.kColorVS = "planeVS";
        this.kColorFS = "planeFS";

        this.enable = false;
        this._shapeColor = [1.0, 0, 0, 1];

        this._positionBuffer = GWTK.gEngine.Renderer.GraphicDevice.createVertexBuffer(GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);

        var indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

        var indexBuffer = GWTK.gEngine.Renderer.GraphicDevice.createIndexBuffer(GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw, IndicesType.uShort);
        indexBuffer.setData(indices);
        var context = GWTK.gEngine.Renderer.Context;
        this._va = context.createEmptyVertexArray();
        this._va.setAttribute(GWTK.gEngine.Renderer.enumVertexAttributeLocations.aVertexPosition, new GWTK.gEngine.Renderer.WebGL.VertexBufferAttributeWebgl(this._positionBuffer, GWTK.gEngine.Renderer.enumComponentDataType.Float, 3, 0, 0, 0));
        this._va.setIndexBuffer(indexBuffer);

        this._setOrigin([0, 0, 1]);
        this._setXaxis([1, 0, 0]);
        this._setYaxis([0, 1, 0]);

        this.mvMatrix = mat4.identity([]);

        GWTK.gEngine.ResourceMap.retrieveAssetsOnload([this.kColorVS, this.kColorFS], this._init.bind(this));

        this.mPositions = new Float32Array(12);
    };
    GWTK.gEngine.Scene.Plane.prototype = {
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

            fillRS.stencilTest.enabled = true;
            fillRS.stencilTest.front.func = GWTK.gEngine.Renderer.enumStencilTestFunction.NotEqual;
            // fillRS.stencilTest.front.depthPassStencilPass = GWTK.gEngine.Renderer.enumStencilOperation.Zero;
            fillRS.stencilTest.front.ref = 0;
            fillRS.stencilTest.front.mask = 0xFF;
            fillRS.stencilTest.back.func = GWTK.gEngine.Renderer.enumStencilTestFunction.NotEqual;
            // fillRS.stencilTest.back.depthPassStencilPass = GWTK.gEngine.Renderer.enumStencilOperation.Zero;
            fillRS.stencilTest.back.ref = 0;
            fillRS.stencilTest.back.mask = 0xFF;

            fillRS.depthMask = false;

            var vs = GWTK.gEngine.ResourceMap.retrieveAsset(this.kColorVS);
            var fs = GWTK.gEngine.ResourceMap.retrieveAsset(this.kColorFS);
            var fillSP = GWTK.gEngine.Renderer.ShaderMap.retrieveOrCreate("shaderName_" + this.kColorVS + this.kColorFS, vs, fs);


            this._fillLogarithmicDepth = fillSP.getUniforms()["u_logarithmicDepth"];
            this._fillColorUniform = fillSP.getUniforms()["u_color"];
            this._fillAlphaUniform = fillSP.getUniforms()["u_alpha"];
            this._fillLogarithmicDepth.setValue(1);

            this.showFill = true;
            this.show = true;

            this._drawStateFill = new GWTK.gEngine.Renderer.DrawState(fillRS, fillSP, this._va);


        },
        /**
         * Обновить состояние компонента
         * @method _clean
         * @private
         */
        _clean: function () {
            if (this._dirty) {

                var vecXYadd = vec3.add(this._xAxis, this._yAxis, this.mSupport[0]);
                var vecXYsub = vec3.sub(this._xAxis, this._yAxis, this.mSupport[1]);
                this.mSupport[2].length = 0;
                var p0 = vec3.sub(this._origin, vecXYadd, this.mSupport[2]);
                var p1 = vec3.add(this._origin, vecXYsub, this.mSupport[3]);
                var p2 = vec3.add(this._origin, vecXYadd, this.mSupport[4]);
                var p3 = vec3.sub(this._origin, vecXYsub, this.mSupport[5]);

                Array.prototype.push.apply(p0, p1);
                Array.prototype.push.apply(p0, p2);
                Array.prototype.push.apply(p0, p3);

                this.mPositions.set(p0, 0);

                this._positionBuffer.setData(this.mPositions);

                this._dirty = false;
            }
        },
        /**
         * Рисование компонента
         * @method render
         * @public
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param logarithmicDepth {boolean} Флаг использования логарифмической глубины
         */
        render: function (sceneState, logarithmicDepth) {
            if (this.show) {
                var context = GWTK.gEngine.Renderer.Context;
                this._clean();

                if (this.showFill) {
                    if (logarithmicDepth) {
                        this._drawStateFill.shaderProgram.getUniforms()['u_logarithmicDepth'].setValue(1);
                        this._drawStateFill.shaderProgram.getUniforms()['uFcoef'].setValue(sceneState.uFcoef);
                    } else {
                        this._drawStateFill.shaderProgram.getUniforms()['u_logarithmicDepth'].setValue(0);
                    }

                    this._fillColorUniform.setValue([this._shapeColor[0], this._shapeColor[1], this._shapeColor[2]]);
                    this._updateFillOpacity();


                    this._drawStateFill.shaderProgram.getUniforms()['uMVMatrix'].setValue(this.mvMatrix);
                    // context.setTexture(0, this._textureId);
                    context.draw(PrimitiveType.Triangles, this._drawStateFill, sceneState);
                }


            }
        },
        /**
         * Обновить униформ непрозрачности заливки
         * @method _updateFillOpacity
         * @private
         */
        _updateFillOpacity: function () {
            this._fillAlphaUniform.setValue(this._shapeColor[3]);
        },
        /**
         * Установить цвет заливки
         * @method setFillColor
         * @public
         * @param value {array} Цвет [R,G,B,A]
         */
        setFillColor: function (value) {
            this._shapeColor[0] = value[0];
            this._shapeColor[1] = value[1];
            this._shapeColor[2] = value[2];
            this._shapeColor[3] = value[3];
        },
        /**
         * Установить центр плоскости
         * @method _setOrigin
         * @private
         * @param value {array} Координаты центра
         */
        _setOrigin: function (value) {
            if (!Array.isArray(this._origin)) {
                this._origin = [];
            }
            if (
                this._origin[0] != value[0] ||
                this._origin[1] != value[1] ||
                this._origin[2] != value[2]
            ) {
                this._dirty = true;
                this._origin[0] = value[0];
                this._origin[1] = value[1];
                this._origin[2] = value[2];
            }
        },
        /**
         * Установить вектор оси X
         * @method _setXaxis
         * @private
         * @param value {array} Ветор
         */
        _setXaxis: function (value) {
            if (!Array.isArray(this._xAxis)) {
                this._xAxis = [];
            }
            if (
                this._xAxis[0] != value[0] ||
                this._xAxis[1] != value[1] ||
                this._xAxis[2] != value[2]
            ) {
                this._dirty = true;
                this._xAxis[0] = value[0];
                this._xAxis[1] = value[1];
                this._xAxis[2] = value[2];
            }
        },
        /**
         * Установить вектор оси Y
         * @method _setYaxis
         * @private
         * @param value {array} Ветор
         */
        _setYaxis: function (value) {
            if (!Array.isArray(this._yAxis)) {
                this._yAxis = [];
            }
            if (
                this._yAxis[0] != value[0] ||
                this._yAxis[1] != value[1] ||
                this._yAxis[2] != value[2]
            ) {
                this._dirty = true;
                this._yAxis[0] = value[0];
                this._yAxis[1] = value[1];
                this._yAxis[2] = value[2];
            }
        }
    }
}