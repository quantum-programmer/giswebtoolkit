/****************************************** Тазин В.О. 10/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Класс буфера глубины рисования                      *
 *                                                                  *
 *******************************************************************/
"use strict";
import { mat4, vec4 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Класс буфера глубины рисования
     * @class GWTK.gEngine.Renderer.DepthFramebuffer
     * @constructor GWTK.gEngine.Renderer.DepthFramebuffer
     */
    GWTK.gEngine.Renderer.DepthFramebuffer = function (opacityMode) {

        this.opacityMode = opacityMode;
        this._clearState = new GWTK.gEngine.Renderer.ClearState();
        this._clearState.color = [1, 1, 1, 1];
        this._depthPixels = new Uint8Array(4);

        this._rgbaVec = [1, 1 / 255, 1 / 65025, 1 / 16581375];

        this._depthBuffer = null;

        this._depthTexture = null;
        this._surfaceDepthTexture = null;

        this._frameBuffer = null;
        this.mCurrentPointResult = [];
        this.mCurrentInverse = [];
        GWTK.gEngine.ResourceMap.retrieveAssetsOnload(['_DEFAULT_TEXTURE'], this._initTexture.bind(this));

    };

    GWTK.gEngine.Renderer.DepthFramebuffer.prototype = {

        _initTexture: function () {
            var textureElement = GWTK.gEngine.ResourceMap.retrieveAsset('_DEFAULT_TEXTURE');
            GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate('_DEFAULT_TEXTURE', textureElement.description, textureElement.img, textureElement.locked, textureElement.sampler);
        },

        /**
         * Получить точку по экранным координатам
         * @method _calcDepthOnScreen
         * @private
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param x {number} X-координата на экране
         * @param y {number} Y-координата на экране
         * @param logarithmicDepth {boolean} Флаг использования логарифмической глубины
         * @param viewPort {array} Границы области рисования
         * @return {Geodetic3D | undefined } Точка на сцене
         */
        _calcDepthOnScreen: function (sceneState, x, y, logarithmicDepth, viewPort) {
            var pointWorld;
            var depth = vec4.dot(this._depthPixels, this._rgbaVec);
            depth /= 255;

            var near = sceneState.getCamera().perspectiveNearPlane;
            var far = sceneState.getCamera().perspectiveFarPlane;

            if (logarithmicDepth) {

                var log2 = Math.log(far + 1.0) / Math.log(2);
                depth = Math.pow(2.0, depth * log2) - 1.0;
                depth = far * (1.0 - near / depth) / (far - near);
            }

            if (depth > 0.0 && depth < 1.0) {
                this.mCurrentPointResult[0] = ((x - viewPort[0]) / viewPort[2]) * 2.0 - 1.0;
                this.mCurrentPointResult[1] = ((viewPort[3] - y - viewPort[1]) / viewPort[3]) * 2.0 - 1.0;
                this.mCurrentPointResult[2] = 2 * depth - 1;
                this.mCurrentPointResult[3] = 1;

                sceneState.resetModelMatrix();

                pointWorld = mat4.multiplyVec4(mat4.inverse(sceneState.getViewPerspectiveMatrix(), this.mCurrentInverse), this.mCurrentPointResult);
                vec4.scale(pointWorld, 1 / pointWorld[3]);
            }
            return pointWorld;
        },
        /**
         * Обновить параметры буферов и текстур
         * @method _updateTextureParams
         * @private
         * @param targetTextureWidth {number} Ширина текстуры
         * @param targetTextureHeight {number} Высота текстуры
         */
        _updateTextureParams: function (targetTextureWidth, targetTextureHeight) {
            if (this._depthTexture) {
                GWTK.gEngine.Renderer.TextureMap.unloadEntry('_DEPTH_TEXTURE');
            }
            if (this._depthBuffer) {
                this._depthBuffer.cleanUp();
            }
            if (this._frameBuffer) {
                this._frameBuffer.cleanUp();
            }
            var context = GWTK.gEngine.Renderer.Context;
            this._frameBuffer = context.createFramebuffer();

            var textureDescription = new GWTK.gEngine.Renderer.Texture2DDescription(targetTextureWidth, targetTextureHeight, GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8, false);
            this._depthTexture = GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate('_DEPTH_TEXTURE', textureDescription, null, true, GWTK.gEngine.Renderer.TextureSamplers.nearestClamp);
            var colorAttachments = this._frameBuffer.getColorAttachments();
            colorAttachments.setColorAttachment(0, this._depthTexture);

            var renderBufferDescription = new GWTK.gEngine.Renderer.RenderBufferDescription(targetTextureWidth, targetTextureHeight, GWTK.gEngine.Renderer.enumRenderBufferFormat.depth_component_16);
            this._depthBuffer = GWTK.gEngine.Renderer.GraphicDevice.createRenderBuffer(renderBufferDescription);
            this._frameBuffer.setDepthAttachmentRenderBuffer(this._depthBuffer);

            if (this._surfaceDepthTexture) {
                GWTK.gEngine.Renderer.TextureMap.unloadEntry('_SURFACE_DEPTH_TEXTURE');
            }
            this._surfaceDepthTexture = GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate("_SURFACE_DEPTH_TEXTURE", textureDescription, null, true, GWTK.gEngine.Renderer.TextureSamplers.nearestClamp);
        },

        /**
         * Получить точку по экранным координатам
         * @method getPoint
         * @public
         * @param cursorPoint {array} Экранные координаты
         * @return {Geodetic3D | undefined} Точка на сцене
         */
        getPoint: function (cursorPoint) {
            var context = GWTK.gEngine.Renderer.Context;
            var viewPort = context.getViewPort();

            context.setFramebuffer(this._frameBuffer);

            var x = cursorPoint[0];
            var y = cursorPoint[1];
            var targetTextureHeight = viewPort[3];
            this._readPixels(x, targetTextureHeight - y);

            context.setFramebuffer(null);

            return this._calcDepthOnScreen(this.opacityMode.sceneState, x, y, this.opacityMode.logarithmicDepth, viewPort);
        },

        /**
         * Заполнить текстуру глубины
         * @method renderDepth
         * @public
         */
        renderDepth: function () {
            var context = GWTK.gEngine.Renderer.Context;
            var viewPort = context.getViewPort();
            this._prepareFrameBuffer(viewPort);

            context.clear(this._clearState);

            GWTK.gEngine.Mediator.publish('surfaceDepthScene', this.opacityMode);

            //Копируем рельеф в отдельную текстуру
            this._surfaceDepthTexture.copyFromActiveFrameBuffer();

            GWTK.gEngine.Mediator.publish('depthScene', this.opacityMode);

            context.setFramebuffer(null);
        },

        /**
         * Подготовить буфер рисования
         * @method _prepareFrameBuffer
         * @private
         */
        _prepareFrameBuffer: function (viewPort) {
            var context = GWTK.gEngine.Renderer.Context;

            var targetTextureWidth = viewPort[2];
            var targetTextureHeight = viewPort[3];

            if (!this._depthTexture || this._depthTexture.getDescription().getWidth() !== targetTextureWidth || this._depthTexture.getDescription().getHeight() !== targetTextureHeight) {
                this._updateTextureParams(targetTextureWidth, targetTextureHeight);
            }

            context.setFramebuffer(this._frameBuffer);
            context.unsetAll();
            var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry('_DEFAULT_TEXTURE');
            if (texture !== undefined) {
                context.setTextureUnit(0, texture);
                context.setTextureUnit(1, texture);
            }
        },
        /**
         * Чтение пикселей с экрана
         * @method _readPixels
         * @private
         * @param x {number} X-координата на экране
         * @param y {number} Y-координата на экране
         */
        _readPixels: function (x, y) {
            this._frameBuffer.readPixels(x, y, this._depthPixels);
        },
        /**
         * Деструктор
         * @method destroy
         */
        destroy: function () {

            this._clearState = null;

            this._depthTexture = null;
            this._surfaceDepthTexture = null;

            if (this._depthBuffer) {
                this._depthBuffer.cleanUp();
                this._depthBuffer = null;
            }

            if (this._frameBuffer) {
                this._frameBuffer.cleanUp();
                this._frameBuffer = null;
            }

            this._depthPixels = null;
            this._rgbaVec.length = 0;
            this._rgbaVec = null;
            this.mCurrentPointResult.length = 0;
            this.mCurrentPointResult = null;
            this.mCurrentInverse.length = 0;
            this.mCurrentInverse = null;

        }
    }
}
