/******************************************** Тазин В. 31/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент модели узла классифиактора                *
 *                                                                  *
 *******************************************************************/
"use strict";

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс модели узла классифиактора
     * @class GWTK.gEngine.Scene.ClassifierModel
     * @constructor GWTK.gEngine.Scene.ClassifierModel
     * @param modelId {string} Идентификатор модели в базе данных
     */
    GWTK.gEngine.Scene.ClassifierModel = function (modelId) {
        this._id = Date.now() * Math.random();
        this._modelId = modelId;
        this._distanceRenderables = {};
        this._renderables = [];
    };
    GWTK.gEngine.Scene.ClassifierModel.prototype = {
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mCurrentTextureList
         */
        mCurrentTextureList: [],
        /**
         * Получить идентификатор модели в классификаторе
         * @method getModelId
         * @public
         * @return {string} Идентификатор модели в классификаторе
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
         * @param distanceNear {number} Расстояние до ближней плоскости отсечения
         * @param depthDraw {boolean} Флаг отрисовки во фреймбуфер глубины
         */
        render: function (sceneState, logarithmicDepth, distanceNear, depthDraw) {
            for (var key in this._distanceRenderables) {
                var renderable = null;
                var renderableObjectArray = this._distanceRenderables[key];
                for (var i = 0; i < renderableObjectArray.length; i++) {
                    if (distanceNear >= renderableObjectArray[i]['minDistance']) {
                        renderable = renderableObjectArray[i]['renderable'];
                    } else {
                        break;
                    }
                }
                if (renderable !== null) {
                    renderable.render(sceneState, logarithmicDepth, depthDraw);
                }
            }
        },
        /**
         * Получить флаг готовности к отображению
         * @method isResident
         * @public
         * @return {boolean} Флаг готовности к отображению
         */
        isResident: function () {
            return true;
        },
        /**
         * Добавить коллекцию примитивов
         * @method addRenderable
         * @public
         * @param renderable {GWTK.gEngine.Scene.RenderableCollection} Коллекция примитивов
         * @param minDistance {number} Минимальная дистанция отображения
         */
        addRenderable: function (renderable, minDistance) {
            this._renderables.push(renderable);
            if (!Array.isArray(this._distanceRenderables[renderable.id])) {
                this._distanceRenderables[renderable.id] = [];
            }
            this._distanceRenderables[renderable.id].push({minDistance: minDistance, renderable: renderable});
            this._distanceRenderables[renderable.id].sort(function (a, b) {
                return a.minDistance - b.minDistance;
            });
        },
        /**
         * Получить коллекцию примитивов
         * @method getRenderable
         * @public
         * @param id {string} Идентификатор коллекции примитивов
         * @return {GWTK.gEngine.Scene.RenderableCollection} Коллекция примитивов
         * @param minDistance {number} Минимальная дистанция отображения
         */
        getRenderable: function (id, minDistance) {
            var renderable = null;
            if (Array.isArray(this._distanceRenderables[id])) {
                var renderableObjectArray = this._distanceRenderables[id];
                for (var i = 0; i < renderableObjectArray.length; i++) {
                    if (renderableObjectArray[i]['minDistance'] === minDistance) {
                        renderable = renderableObjectArray[i]['renderable'];
                        break;
                    }
                }
            }
            return renderable;
        },
        /**
         * Удаление
         * @method destroy
         * @public
         */
        destroy: function () {

            for (var key in this._distanceRenderables) {
                var renderableObjectArray = this._distanceRenderables[key];
                for (var i = 0; i < renderableObjectArray.length; i++) {
                    renderableObjectArray[i]['renderable'].destroy();
                }
            }
            this._modelId = null;
            this._distanceRenderables = null;
        }
    }
}
