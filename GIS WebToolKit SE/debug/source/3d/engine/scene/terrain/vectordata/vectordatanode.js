/******************************************** Тазин В. 31/03/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент узла тайлов векторных данных              *
 *                                                                  *
 *******************************************************************/
"use strict";

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс узла тайлов векторных данных
     * @class GWTK.gEngine.Scene.VectorDataNode
     * @constructor GWTK.gEngine.Scene.VectorDataNode
     * @param identifier {TileIdentifier} Идентификатор тайла
     * @param layer {GWTK.gEngine.Scene.VectorDataLayer} Слой тайлов векторных данных
     */
    GWTK.gEngine.Scene.VectorDataNode = function (identifier, layer) {
        this._id = Date.now() * Math.random();
        this._identifier = identifier;
        this.parent = null;
        this._obb = null;
        this._modelNodeList = null;
        this._children = [];
        this._renderOrder = {};
        this._layer = layer;
        this._minDistance = null;
    };
    GWTK.gEngine.Scene.VectorDataNode.prototype = {
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
         * Установить геометрию узла
         * @method setOBB
         * @public
         * @param obb {OrientedBoundingBox3D} Геометрия узла
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
         * Получить центр узла
         * @method getCenter
         * @public
         * @return {array} Координаты центра [x,y,z]
         */
        getCenter: function () {
            return this.getOBB().getCenter();
        },
        /**
         * Получить дочерние узлы
         * @method getChildren
         * @public
         * @return {array} Массив дочерних узлов
         */
        getChildren: function () {
            return this._children;
        },
        /**
         * Добавить дочерний узел
         * @method getChildren
         * @public
         * @param node {GWTK.gEngine.Scene.VectorDataNode} Дочерний узел
         */
        addChild: function (node) {
            this._children.push(node);
        },
        /**
         * Рисование узла
         * @method render
         * @public
         * @param renderParams {object} Параметры рисования
         * @param distanceNear {number} Расстояние до ближней плоскости отсечения
         * @param distanceLimits {Interval} Границы удаленности
         * @param depthDraw {boolean} Флаг отрисовки во фреймбуфер глубины
         */
        render: function (renderParams, distanceNear, distanceLimits, depthDraw) {
            var sceneState = renderParams.sceneState;
            var tau = renderParams.thau;
            var preventUpdate = renderParams.userActivity;
            var logarithmicDepth = renderParams.logarithmicDepth;
            this.requestChunk(preventUpdate);
            if (this.checkScreenSpaceError(sceneState, tau, distanceNear)) {
                this._selfRender(sceneState, logarithmicDepth, distanceNear, depthDraw);
            } else {
                if (!this.isAllChildrenResident()) {
                    if (this._children.length === 0) {
                        this._layer.createChildren(this);
                    }
                    for (var i = 0; i < this._children.length; i++) {
                        this._children[i].requestChunk(preventUpdate);
                    }
                    this._selfRender(sceneState, logarithmicDepth, distanceNear, depthDraw);
                } else {
                    for (i = 0; i < this._children.length; i++) {
                        var childNode = this._children[i];
                        var childDistanceNear = childNode.getDistanceFromNearPlane(sceneState);
                        if (childDistanceNear !== 0 && (childDistanceNear < 0 || distanceLimits.contains(childDistanceNear))) {
                            this._renderOrder[childDistanceNear] = childNode;
                        }
                    }
                    for (var dist in this._renderOrder) {
                        this._renderOrder[dist].render(renderParams, dist, distanceLimits, depthDraw);
                        delete this._renderOrder[dist];
                    }
                }
            }
            //Подгрузка более подробных тайлов на 1 уровень
            // if (!this.isAllChildrenResident()) {
            //     if (this._children.length === 0) {
            //         this._createChildren();
            //     }
            //     for (var i = 0; i < this._children.length; i++) {
            //         this._children[i].requestChunk();
            //     }
            // }
        },
        /**
         * Получить расстояние до ближней плоскости отсечения
         * @method getDistanceFromNearPlane
         * @public
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @return {number} Расстояние до ближней плоскости отсечения
         */
        getDistanceFromNearPlane: function (sceneState) {
            return this.getOBB().testFrustum(sceneState.getCamera().getFrustumVolume(), sceneState.getViewPerspectiveMatrix());
        },
        /**
         * Рисование объектов
         * @method _selfRender
         * @private
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param logarithmicDepth {boolean} Флаг использования логарифмической глубины
         * @param distanceNear {number} Расстояние до ближней плоскости отсечения
         * @param depthDraw {boolean} Флаг отрисовки во фреймбуфер глубины
         */
        _selfRender: function (sceneState, logarithmicDepth, distanceNear, depthDraw) {
            if (this.isResident() && this._modelNodeList.length > 0) {
                sceneState.setModelMatrix(this.getOBB().getModelMatrix());
                for (var i = 0, modelNode; (modelNode = this._modelNodeList[i]); i++) {
                    if (this._layer.checkModelVisibility(modelNode.getModelId())) {
                        modelNode.render(sceneState, logarithmicDepth, distanceNear, depthDraw);
                    }
                }
                sceneState.resetModelMatrix();
                this._layer.checkLoadingScreen(this._identifier.getLevel());
            }
        },
        /**
         * Получить флаг готовности объектов рисования узла к отображению
         * @method isResident
         * @public
         * @return {boolean} Флаг готовности объектов рисования узла к отображению
         */
        isResident: function () {
            var flag = true;
            if (Array.isArray(this._modelNodeList)) {
                for (var i = 0, modelNode; (modelNode = this._modelNodeList[i]); i++) {
                    if (!modelNode.isResident()) {
                        flag = false;
                        break;
                    }
                }
            } else {
                flag = false;
            }
            return flag;
        },
        /**
         * Получить флаг готовности всех дочерних узлов к отображению
         * @method isAllChildrenResident
         * @public
         * @return {boolean} Флаг готовности всех дочерних узлов к отображению
         */
        isAllChildrenResident: function () {
            if (this._children.length === 0) {
                var result = false;
            } else {
                result = true;
                for (var i = 0; i < this._children.length; i++) {
                    var child = this._children[i];
                    if (!child.isResident()) {
                        result = false;
                        break;
                    }
                }
            }
            return result;
        },
        /**
         * Запросить меш для узла и данные объектов рисования
         * @method requestChunk
         * @public
         */
        requestChunk: function (preventUpdate) {
            if (preventUpdate === true) {
                return;
            }
            if (!Array.isArray(this._modelNodeList)) {
                this._layer.createMesh(this);
            }
        },
        /**
         * Создать пустой массив моделей рисования узла
         * @method createModelNodeList
         * @public
         */
        createModelNodeList: function () {
            if (!Array.isArray(this._modelNodeList)) {
                this._modelNodeList = [];
            }
        },
        /**
         * Добавить модель рисования в узел
         * @method createModelNodeList
         * @public
         * @param modelNode {GWTK.gEngine.Scene.ClassifierModel} Модель узла
         */
        addModelNode: function (modelNode) {
            if (Array.isArray(this._modelNodeList)) {
                this._modelNodeList.push(modelNode);
            }
        },
        /**
         * Получить модель рисования узла
         * @method retrieveModelNode
         * @public
         * @param modelId {string} Идентификатор модели в базе данных
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
         * Проверить соответствие узла текущему масштабу отображения
         * @method checkScreenSpaceError
         * @public
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param thau {number} Коэффициент качества графики
         * @param distanceNear {number} Расстояние до ближней плоскости отсечения
         * @return {boolean} Флаг соответствия узла текущему масштабу отображения
         */
        checkScreenSpaceError: function (sceneState, thau, distanceNear) {
            var camera = sceneState.getCamera();
            if (this._minDistance === null) {
                var theta = camera.getViewAngleX();
                var viewport = GWTK.gEngine.Renderer.Context.getViewPort();
                var projection = this._layer.getProjection();

                var e = projection.getTileWidthMtr(29) * Math.pow(2, 29 - this._identifier.getLevel()) / projection.getTileWidth();
                this._minDistance = 0.485 * Math.cos(camera.getCameraGeodetic(projection.getGlobeShape()).getLatitude()) * e * viewport[2] / (2 * Math.tan(theta / 2) * thau);

            }
            return (this._minDistance <= Math.max(distanceNear, sceneState.getCameraDistanceFromSurface()));
        },
        /**
         * Получить уровень масштаба
         * @method getLevel
         * @public
         * @return {number} Номер уровень масштаба
         */
        getLevel: function () {
            return this._identifier.getLevel();
        },
        /**
         * Получить номер столбца
         * @method getCol
         * @public
         * @return {number} Номер столбца
         */
        getCol: function () {
            return this._identifier.getX();
        },
        /**
         * Получить номер строки
         * @method getRow
         * @public
         * @return {number} Номер строки
         */
        getRow: function () {
            return this._identifier.getY();
        },
        /**
         * Удаление моделей рисования узла
         * @method _selfDestroy
         * @private
         */
        _selfDestroy: function () {
            this._identifier = null;
            this.parent = null;
            this._obb = null;
            if (Array.isArray(this._modelNodeList)) {
                for (var i = 0, model; (model = this._modelNodeList[i]); i++) {
                    model.destroy();
                }
            }
            this._modelNodeList = null;
            this._children = null;
            this._renderOrder = null;
            this._layer = null;
        },
        /**
         * Удаление узла
         * @method destroy
         * @public
         */
        destroy: function () {
            for (var i = 0; i < this._children.length; i++) {
                this._children[i].destroy();
            }
            this._selfDestroy();
        }
    }
}
