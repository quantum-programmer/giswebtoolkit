/******************************************** Тазин В. 29/04/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *         Описание текстурной единицы тайла поверхности            *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};

    /**
     * Класс текстурной единицы тайла поверхности
     * @class GWTK.gEngine.Scene.ChunkTextureUnit
     * @constructor GWTK.gEngine.Scene.ChunkTextureUnit
     * @param identifier {TileIdentifier} Идентификатор тайла
     * @param textureId {string} Идентификатор текстуры
     * @param description { GWTK.gEngine.Renderer.Texture2DDescription} Описание текстуры
     */
    GWTK.gEngine.Scene.ChunkTextureUnit = function (identifier, textureId, description) {
        this._identifier = identifier;
        this._id = textureId;
        this._description = description;

        this._imageSourceList = {};
        this._sortedLayerList = {};
        if (!this.mFrameBuffer) {
            GWTK.gEngine.Scene.ChunkTextureUnit.prototype.mFrameBuffer = GWTK.gEngine.Renderer.Context.createFramebuffer();
            var colorAttachments = this.mFrameBuffer.getColorAttachments();
            colorAttachments.setColorAttachment(0, this._retrieveDefaultTexture());
        }
        this._viewPort = [0, 0, description.getWidth(), description.getHeight()];

        if (!this.mClearState) {
            GWTK.gEngine.Scene.ChunkTextureUnit.prototype.mClearState = new GWTK.gEngine.Renderer.ClearState();
            this.mClearState.buffers = GWTK.gEngine.Renderer.enumClearBuffers.ColorBuffer;
            this.mClearState.depth = 0;
            this.mClearState.color = [1, 1, 1, 1];
        }
        if (!this.mRenderable) {
            GWTK.gEngine.Scene.ChunkTextureUnit.prototype.mRenderable = new GWTK.gEngine.Scene.TexturedSquare();
        }
    };
    GWTK.gEngine.Scene.ChunkTextureUnit.prototype = {
        /**
         * Объект параметров очищения области рисования
         * @static
         * @property {GWTK.gEngine.Renderer.ClearState}
         */
        mClearState: null,
        /**
         * Буфер рисования
         * @static
         * @property {GWTK.gEngine.Renderer.WebGL.FramebufferWebgl}
         */
        mFrameBuffer: null,
        /**
         * Объект рисования плоского четырехугольника
         * @static
         * @property {GWTK.gEngine.Scene.TexturedSquare}
         */
        mRenderable: null,
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mOldViewPort
         */
        mOldViewPort: [],
        /**
         * Извлечь тестуру или создать новую
         * @method _retrieveTexture
         * @private
         * @return {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Объект текстуры
         */
        _retrieveTexture: function () {
            return GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate(this._id, this._description, null, false, GWTK.gEngine.Renderer.TextureSamplers.linearMipmapLinearClamp);
        },
        /**
         * Проверка существования объекта текстуры
         * @method _textureExistance
         * @private
         * @return {boolean} Существование текстуры
         */
        _textureExistance: function () {
            return GWTK.gEngine.Renderer.TextureMap.hasEntry(this._id);
        },
        /**
         * Получить текстуру по умолчанию
         * @method _retrieveDefaultTexture
         * @private
         * @return {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Объект текстуры по умолчанию
         */
        _retrieveDefaultTexture: function () {
            var description = new GWTK.gEngine.Renderer.Texture2DDescription(this._description.getWidth(), this._description.getHeight(), this._description.getFormat(), false);
            return GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate("ChunkTextureUnit_" + Math.random(), description, null, true, GWTK.gEngine.Renderer.TextureSamplers.nearestClamp);
        },
        /**
         * Получить идентификатор
         * @method getIdentifier
         * @public
         * @return {TileIdentifier} Идентификатор тайла
         */
        getIdentifier: function () {
            return this._identifier;
        },
        /**
         * Проверить состояние источников растровых изображений
         * @method checkRasterSources
         * @public
         * @param rasterSourceArray {array} Массив источников растровых изображений
         */
        checkRasterSources: function (rasterSourceArray) {
            var identifier = this.getIdentifier();
            var anySource = false;
            for (var i = 0; i < rasterSourceArray.length; i++) {
                var rasterSource = rasterSourceArray[i];
                if (rasterSource.checkTileFrame(identifier)) {
                    anySource = true;
                    var rasterState = rasterSource.getState();
                    var layerId = rasterSource.getId();
                    if (this._imageSourceList[layerId] === undefined) {
                        this._imageSourceList[layerId] = new GWTK.gEngine.Scene.RasterSourceState();
                        this._imageSourceList[layerId].textureParams = [];
                    }
                    if (!this._imageSourceList[layerId].equals(rasterState) || (rasterState.visible && !rasterSource.checkTextureExistance(identifier))) {
                        if (rasterState.visible) {
                            var textureParams = rasterSource.getTextureParams(identifier);
                            this._imageSourceList[layerId].textureParams[0] = textureParams[0];
                            this._imageSourceList[layerId].textureParams[1] = textureParams[1];
                            this._imageSourceList[layerId].textureParams[2] = textureParams[2];
                            this._imageSourceList[layerId].textureParams[3] = textureParams[3];
                            this._imageSourceList[layerId].textureId = rasterSource.requestTileTexture(identifier);
                        } else {
                            this._imageSourceList[layerId].textureId = null;
                        }
                        this._imageSourceList[layerId].setTargetState(rasterState);
                        this._isDirty = true;
                    }
                }
            }
            this._isDirty = this._isDirty || !anySource;
            if (this._isDirty) {
                this._isEmpty = true;
                for (var key in this._sortedLayerList) {
                    delete this._sortedLayerList[key];
                }
                for (var id in this._imageSourceList) {
                    rasterState = this._imageSourceList[id];

                    if (rasterState.getTargetState()) {
                        rasterState.clean();
                    }
                    if (rasterState.visible === true) {
                        this._isEmpty = false;
                    }
                    this._sortedLayerList[rasterState.zIndex] = id;
                }
            }
        },
        /**
         * Обновить состояние текстуры
         * @method clean
         * @public
         */
        clean: function (sceneState) {
            if (this._isDirty) {
                var drawFlag = this._isEmpty;
                //clean renderbuffer
                var context = GWTK.gEngine.Renderer.Context;
                context.setFramebuffer(this.mFrameBuffer);
                var oldViewPort = context.getViewPort();
                this.mOldViewPort[0] = oldViewPort[0];
                this.mOldViewPort[1] = oldViewPort[1];
                this.mOldViewPort[2] = oldViewPort[2];
                this.mOldViewPort[3] = oldViewPort[3];
                context.setViewPort(this._viewPort);
                context.clear(this.mClearState);

                for (var zIndex in this._sortedLayerList) {
                    var layerId = this._sortedLayerList[zIndex];
                    var rasterState = this._imageSourceList[layerId];
                    if (rasterState.visible) {
                        this.mRenderable.setTextureId(rasterState.textureId);
                        this.mRenderable.setTextureParams(rasterState.textureParams);
                        this.mRenderable.setOpacity(rasterState.opacity);
                        if (!this.mRenderable.render(sceneState)) {
                            rasterState.visible = false;
                            rasterState.textureId = null;
                        } else {
                            drawFlag = true;
                        }
                    }
                }

                this._isDirty = false;
                if (drawFlag) {
                    // копируем пиксели в текстуру тайла
                    this._retrieveTexture().copyFromActiveFrameBuffer();
                }

                context.setFramebuffer(null);
                context.setViewPort(this.mOldViewPort);
            } else if (!this._textureExistance()) {
                // Если все загружено, отрисовалось ранее, но потом текстура попала под чистку
                for (layerId in this._imageSourceList) {
                    delete this._imageSourceList[layerId]
                }
            }
        },
        /**
         * Удаление компонента
         * @method destroy
         * @public
         */
        destroy: function () {
            this._description = null;
            this._imageSourceList = null;
            this._viewPort = null;
        }
    };
}