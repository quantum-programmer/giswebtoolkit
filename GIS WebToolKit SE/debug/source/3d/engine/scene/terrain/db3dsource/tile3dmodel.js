/******************************************** Тазин В. 29/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Компонент модели узла 3D тайлов                   *
 *                                                                  *
 *******************************************************************/
"use strict";

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс модели узла 3D тайлов
     * @class GWTK.gEngine.Scene.Tile3dNodeModel
     * @constructor GWTK.gEngine.Scene.Tile3dNodeModel
     * @param modelId {string} Идентификатор модели в базе данных
     * @param node {GWTK.gEngine.Scene.Tile3dLayer} Узел 3D тайлов
     */
    GWTK.gEngine.Scene.Tile3dNodeModel = function (modelId, node) {
        this._id = Date.now() * Math.random();
        this._modelId = modelId;
        this._node = node;
        this._renderables = [];
    };
    GWTK.gEngine.Scene.Tile3dNodeModel.prototype = {
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mCurrentTextureList
         */
        mCurrentTextureList: [],
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mCurrentMaterialList
         */
        mCurrentMaterialList: [],
        /**
         * Получить идентификатор модели в базе данных
         * @method getModelId
         * @public
         * @return {string} Идентификатор модели в базе данных
         */
        getModelId: function () {
            return this._modelId;
        },
        /**
         * Рисование
         * @method render
         * @public
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param logarithmicDepth {boolean} Флаг использования логарифмической глубины
         * @param depthDraw {boolean} Флаг отрисовки во фреймбуфер глубины
         * @param opacity {number} Значение непрозрачности
         */
        render: function (sceneState, logarithmicDepth, depthDraw, opacity) {
            for (var i = 0, renderable; (renderable = this._renderables[i]); i++) {
                renderable.render(sceneState, logarithmicDepth, depthDraw, opacity);
            }
        },
        /**
         * Получить флаг готовности к отображению
         * @method isResident
         * @public
         * @return {boolean} Флаг готовности к отображению
         */
        isResident: function () {
            var flag = true;
            for (var i = 0, renderable; (renderable = this._renderables[i]); i++) {
                if (!renderable.isReady()) {
                    flag = false;
                    break;
                }
            }
            return flag;
        },
        /**
         * Получить флаг готовности текстур
         * @method _texturesIsReady
         * @private
         * @return {boolean} Флаг готовности текстур
         */
        _texturesIsReady: function () {
            var flag = true;
            for (var i = 0, renderable; (renderable = this._renderables[i]); i++) {
                if (!renderable.textureIsReady()) {
                    flag = false;
                    break;
                }
            }
            return flag;
        },
        /**
         * Получить флаг готовности материалов
         * @method _materialsIsReady
         * @private
         * @return {boolean} Флаг готовности материалов
         */
        _materialsIsReady: function () {
            var flag = true;
            for (var i = 0, renderable; (renderable = this._renderables[i]); i++) {
                if (!renderable.materialIsReady()) {
                    flag = false;
                    break;
                }
            }
            return flag;
        },
        /**
         * Добавить примитив
         * @method addRenderable
         * @public
         * @param renderable {GWTK.gEngine.Scene.TexturedChunk|GWTK.gEngine.Scene.PointCloud|
         * GWTK.gEngine.Scene.ColoredChunk|GWTK.gEngine.Scene.MaterialChunk} Примитив
         */
        addRenderable: function (renderable) {
            this._renderables.push(renderable);
        },
        /**
         * Запросить данные для рисования
         * @method requestRenderable
         * @public
         */
        requestRenderable: function () {
            if (!this._texturesIsReady()) {
                var textureIdentifierList = this._getTextureSrcList();
                this._node.loadTextures(textureIdentifierList);
            }
            if (!this._materialsIsReady()) {
                var materialIdentifierList = this._getMaterialSrcList();
                this._node.loadMaterials(materialIdentifierList);
            }
        },
        /**
         * Получить список текстур
         * @method _getTextureSrcList
         * @private
         * @return {array} Массив идентификаторов текстур
         */
        _getTextureSrcList: function () {
            var list = this.mCurrentTextureList;
            list.length = 0;
            for (var i = 0, renderable; (renderable = this._renderables[i]); i++) {
                var textureId = renderable._textureIdentifier;
                if (textureId != null) {
                    list.push(renderable._textureIdentifier);
                }
            }
            return list;
        },
        /**
         * Получить список материалов
         * @method _getMaterialSrcList
         * @private
         * @return {array} Массив идентификаторов материалов
         */
        _getMaterialSrcList: function () {
            var list = this.mCurrentMaterialList;
            list.length = 0;
            for (var i = 0, renderable; (renderable = this._renderables[i]); i++) {
                var materialId = renderable._materialIdentifier;
                if (materialId != null) {
                    list.push(renderable._materialIdentifier);
                }
            }
            return list;
        },
        /**
         * Удаление
         * @method destroy
         * @public
         */
        destroy: function () {
            for (var i = 0, renderable; (renderable = this._renderables[i]); i++) {
                renderable.destroy();
            }
            this._modelId = null;
            this._node = null;
            this._renderables = null;
        }
    }

}
