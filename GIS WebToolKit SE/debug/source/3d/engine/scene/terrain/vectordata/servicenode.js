/****************************************** Тазин В.О. 10/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Компонент узла сервисных объектов                 *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс узла сервисных объектов
     * @class GWTK.gEngine.Scene.ServiceNode
     * @constructor GWTK.gEngine.Scene.ServiceNode
     */
    GWTK.gEngine.Scene.ServiceNode = function () {
        this._id = Date.now() * Math.random();
        this._obb = null;
        this._modelNodeList = null;
    };
    GWTK.gEngine.Scene.ServiceNode.prototype = {
        /**
         * Задать геометрию узла
         * @method setOBB
         * @public
         * @param obb {OrientedBoundingBox3D|BoundingSphere3D} Геометрия узла
         */
        setOBB: function (obb) {
            this._obb = obb;
        },
        /**
         * Получить геометрию узла
         * @method getOBB
         * @public
         * @return {OrientedBoundingBox3D} Геометрия узла
         */
        getOBB: function () {
            return this._obb;
        },
        /**
         * Рисование узла
         * @method render
         * @public
         * @param e {object} Объект события отрисовки
         * @param distance {number} Расстояние от наблюдателя
         */
        render: function (e, distance) {
            var sceneState = e.sceneState;
            var logarithmicDepth = e.logarithmicDepth;
            this._selfRender(sceneState, logarithmicDepth, distance);
        },
        /**
         * Рисование объектов
         * @method _selfRender
         * @private
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param logarithmicDepth {boolean} Использование логарифмической глубины
         * @param distance {number} Расстояние от наблюдателя
         */
        _selfRender: function (sceneState, logarithmicDepth, distance) {
            if (this._modelNodeList.length > 0) {
                sceneState.setModelMatrix(this.getOBB().getModelMatrix());
                for (var i = 0, modelNode; (modelNode = this._modelNodeList[i]); i++) {
                    modelNode.render(sceneState, logarithmicDepth, distance);
                }
                sceneState.resetModelMatrix();
            }
        },
        /**
         * Создание массива моделей узла
         * @method createModelNodeList
         * @public
         */
        createModelNodeList: function () {
            if (!Array.isArray(this._modelNodeList)) {
                this._modelNodeList = [];
            }
        },
        /**
         * Добавление модели узла
         * @method addModelNode
         * @public
         * @param modelNode {GWTK.gEngine.Scene.ClassifierModel} Модель из классификатора
         */
        addModelNode: function (modelNode) {
            if (Array.isArray(this._modelNodeList)) {
                this._modelNodeList.push(modelNode);
            }
        },
        /**
         * Очистить массив моделей узла
         * @method clearModelNodeList
         * @public
         */
        clearModelNodeList: function () {
            this._modelNodeList.length = 0;
        },
        /**
         * Получить модель узла
         * @method retrieveModelNode
         * @public
         * @return {GWTK.gEngine.Scene.ClassifierModel} Модель узла
         */
        retrieveModelNode: function (modelId) {
            var model;
            for (var i = 0; (model = this._modelNodeList[i]); i++) {
                if (model.getModelId() === modelId) {
                    return model;
                }
            }
        },
        /**
         * Получить центр
         * @method getCenter
         * @public
         * @return {array} Координаты центра
         */
        getCenter: function () {
            return this.getOBB().getCenter();
        },
        /**
         * Получить расстояние до ближней плоскости отсечения
         * @method getDistanceFromNearPlane
         * @public
         * @return {number} Расстояние до ближней плоскости отсечения
         */
        getDistanceFromNearPlane: function (sceneState) {
            return this.getOBB().testFrustum(sceneState.getCamera().getFrustumVolume(), sceneState.getViewPerspectiveMatrix());
        },
        /**
         * Удаление узла
         * @method destroy
         * @public
         */
        destroy: function () {
            this._obb = null;
            if (Array.isArray(this._modelNodeList)) {
                for (var i = 0, model; (model = this._modelNodeList[i]); i++) {
                    model.destroy();
                }
                this._modelNodeList = null;
            }
        }
    }
}
