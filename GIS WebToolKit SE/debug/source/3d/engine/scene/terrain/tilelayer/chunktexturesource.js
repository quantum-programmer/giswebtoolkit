/******************************************** Тазин В. 30/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Источник текстур тайлов поверхности                 *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};

    /**
     * Класс источника текстур тайлов поверхности
     * @class GWTK.gEngine.Scene.ChunkTextureSource
     * @constructor GWTK.gEngine.Scene.ChunkTextureSource
     * @param projection {GWTK.gEngine.Core.Projection} Проекция
     */
    GWTK.gEngine.Scene.ChunkTextureSource = function (projection) {
        ++this.exampleCounter;
        this._prefix = this.SOURCE_CLASS + this.exampleCounter + "_";

        this._tileWidth = projection.getTileWidth();
        this._tileHeight = projection.getTileHeight();

        this._textureFormat = GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8;

        this._isActive = true;
        this._textureUnits = {};
        this._rasterSourceArray = [];

        this._topLayer = null;

        // GWTK.gEngine.Mediator.subscribe("updateScene", this.updateTextures.bind(this));
        GWTK.gEngine.Mediator.subscribe("preRenderScene", this.renderTextures.bind(this));
    };
    GWTK.gEngine.Scene.ChunkTextureSource.prototype = {
        /**
         * Название компонента
         * @static
         * @property {array} SOURCE_CLASS
         */
        SOURCE_CLASS: "chunkTexture_",
        /**
         * Счетчик компонентов
         * @static
         * @property {number} exampleCounter
         */
        exampleCounter: 0,
        /**
         * Получить значение непрозрачности
         * @method getOpacity
         * @public
         * @return {number} Максимальное значение непрозрачности слоев (от 0 до 1.0)
         */
        getOpacity: function () {
            var opacity = 0;
            for (var i = 0; i < this._rasterSourceArray.length; i++) {
                var rasterSource = this._rasterSourceArray[i];
                if (rasterSource.getVisibility()) {
                    opacity = Math.max(opacity, rasterSource.getOpacity());
                }
            }
            return opacity;
        },
        /**
         * Установить изображение тайла
         * @method setTileTexture
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @param renderable {GWTK.gEngine.Scene.Chunk} Объект рисования
         */
        setTileTexture: function (identifier, renderable) {
            this.requestTileTexture(identifier);
            renderable.setTextureId(this.createTileTextureId(identifier));
        },
        /**
         * Создать идентификатор текстуры тайла поверхности
         * @method createTileTextureId
         * @public
         * @return {string} Идентификатор текстуры тайла поверхности
         */
        createTileTextureId: function (identifier) {
            return this._prefix + identifier.toString();
        },
        /**
         * Добавить источник растровых тайлов
         * @method addRasterSource
         * @public
         * @param rasterSource {GWTK.gEngine.Scene.RasterSource} Источник растровых тайлов
         */
        addRasterSource: function (rasterSource) {
            rasterSource.setChunkTileWidth(this._tileWidth);
            rasterSource.setChunkTileHeight(this._tileHeight);
            this._rasterSourceArray.push(rasterSource);
        },
        /**
         * Проверить, имеется ли активный источник тайлов
         * @method checkRasterVisibility
         * @public
         * @return {boolean} Имеется активный источник тайлов
         */
        checkRasterVisibility: function () {
            var result = false;
            for (var i = 0; i < this._rasterSourceArray.length; i++) {
                result = this._rasterSourceArray[i].getVisibility();
                if (result) {
                    break;
                }
            }
            return result;
        },

        /**
         * Запросить изображение для тайла поверхности
         * @method requestTileTexture
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         */
        requestTileTexture: function (identifier) {
            var id = this.createTileTextureId(identifier);
            if (!this._textureUnits[id]) {
                var description = new GWTK.gEngine.Renderer.Texture2DDescription(this._tileWidth, this._tileHeight, this._textureFormat, true);
                this._textureUnits[id] = new GWTK.gEngine.Scene.ChunkTextureUnit(identifier, id, description);
            }
            this._textureUnits[id].checkRasterSources(this._rasterSourceArray);
        },
        /**
         * Обновить изображение для тайла поверхности
         * @method renderTextures
         * @public
         * @param e {object} Событие отрисовки
         */
        renderTextures: function (e) {
            for (var id in this._textureUnits) {
                this._textureUnits[id].clean(e.sceneState);
            }
            this._updateTopLayer();
        },
        /**
         * Обновить верхний слой изображений
         * @method _updateTopLayer
         * @private
         */
        _updateTopLayer: function () {
            var layer = null;
            for (var i = 0; i < this._rasterSourceArray.length; i++) {
                var rasterSource = this._rasterSourceArray[i];
                if (rasterSource.getVisibility()) {
                    if (layer === null || layer.zIndex < rasterSource.getZindex()) {
                        layer = rasterSource.getDescription();
                    }
                }
            }
            this._topLayer = layer;
        },
        /**
         * Получить верхний слой изображений
         * @method getTopLayer
         * @public
         * @return {GWTK.LayerDescription} Описания слоя
         */
        getTopLayer: function () {
            return this._topLayer;
        },
        /**
         * Удаление буферов из контекста
         * @method destroy
         * @public
         */
        destroy: function () {
            for (var id in this._textureUnits) {
                this._textureUnits[id].destroy();
            }
            this._textureUnits = null;
            GWTK.gEngine.Scene.ChunkTextureUnit.mClearState = null;
            if (GWTK.gEngine.Scene.ChunkTextureUnit.prototype.mFrameBuffer) {
                GWTK.gEngine.Scene.ChunkTextureUnit.prototype.mFrameBuffer.cleanUp();
                GWTK.gEngine.Scene.ChunkTextureUnit.prototype.mFrameBuffer = null;
            }
            if (GWTK.gEngine.Scene.ChunkTextureUnit.prototype.mRenderable) {
                GWTK.gEngine.Scene.ChunkTextureUnit.prototype.mRenderable.destroy();
                GWTK.gEngine.Scene.ChunkTextureUnit.prototype.mRenderable = null;
            }
            for (var i = 0; i < this._rasterSourceArray.length; i++) {
                this._rasterSourceArray[i].destroy();
            }
            this._rasterSourceArray = null;
            this._topLayer = null;
        }
    };
}