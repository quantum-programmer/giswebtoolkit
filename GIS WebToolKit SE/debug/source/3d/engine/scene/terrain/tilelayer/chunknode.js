/******************************************** Тазин В. 31/03/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Компонент узла тайлов поверхности                     *
 *                                                                  *
 *******************************************************************/
"use strict";

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс узла тайлов поверхности
     * @class GWTK.gEngine.Scene.ChunkNode
     * @constructor GWTK.gEngine.Scene.ChunkNode
     * @param identifier {TileIdentifier} Идентификатор тайла
     * @param layer {GWTK.gEngine.Scene.ChunkLayer} Слой тайлов поверхности
     */
    GWTK.gEngine.Scene.ChunkNode = function (identifier, layer) {
        this._id = Date.now() * Math.random();
        this._identifier = identifier;
        this.parent = null;
        this._obb = null;
        this._renderable = null;
        this._children = [];
        this._layer = layer;
        this._minDistance = null;
    };
    GWTK.gEngine.Scene.ChunkNode.prototype = {
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
            if (this._renderable) {
                this._renderable.setOBB(obb);
            }
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
         * @param node {GWTK.gEngine.Scene.ChunkNode} Дочерний узел
         */
        addChild: function (node) {
            this._children.push(node);
        },
        /**
         * Рисование узла
         * @method render
         * @public
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param thau {number} Коэффициент качества графики
         * @param drawState {GWTK.gEngine.Renderer.DrawState} Объект параметров рисования
         */
        render: function (sceneState, thau, drawState) {
            var distanceNear = this.getOBB().testFrustum(sceneState.getCamera().getFrustumVolume(), sceneState.getViewPerspectiveMatrix());
            if (distanceNear !== 0) {
                if (this.checkScreenSpaceError(sceneState, thau, distanceNear)) {
                    this._selfRender(sceneState, drawState);
                } else {
                    if (!this.isAllChildrenResident()) {
                        this._selfRender(sceneState, drawState);
                    } else {
                        for (var i = 0; i < this._children.length; i++) {
                            this._children[i].render(sceneState, thau, drawState)
                        }
                    }
                }
            }
        },

        /**
         * Запрос данных для узла
         * @method request
         * @public
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param thau {number} Коэффициент качества графики
         */
        request: function (sceneState, thau) {
            this.requestChunk();
            var distanceNear = this.getOBB().testFrustum(sceneState.getCamera().getFrustumVolume(), sceneState.getViewPerspectiveMatrix());
            if (distanceNear !== 0) {
                if (!this.checkScreenSpaceError(sceneState, thau, distanceNear)) {
                    if (this._children.length === 0) {
                        this._layer.createChildren(this);
                    }
                    for (var i = 0; i < this._children.length; i++) {
                        this._children[i].request(sceneState, thau)
                    }
                }
            }
        },


        /**
         * Рисование объектов
         * @method _selfRender
         * @private
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param drawState {GWTK.gEngine.Renderer.DrawState} Объект параметров рисования
         */
        _selfRender: function (sceneState, drawState) {
            if (this.isResident()) {
                sceneState.setModelMatrix(this.getOBB().getModelMatrix());
                this._renderable.render(sceneState, drawState);
                this._layer.checkLoadingScreen(this._identifier.getLevel());
            }
        },
        /**
         * Получить флаг готовности объекта рисования узла к отображению
         * @method isResident
         * @public
         * @return {boolean} Флаг готовности объекта рисования узла к отображению
         */
        isResident: function () {
            return this._renderable.isReady();
        },
        /**
         * Получить флаг готовности всех дочерних узлов к отображению
         * @method isAllChildrenResident
         * @public
         * @return {boolean} Флаг готовности всех дочерних узлов к отображению
         */
        isAllChildrenResident: function () {
            var result;
            if (this._children.length < 4) {
                result = false;
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
         * Запросить меш для узла и данные объекта рисования
         * @method requestChunk
         * @public
         */
        requestChunk: function () {
            // if (!this._renderable.textureIsReady()) {
            this._layer.createTexture(this._identifier, this._renderable);
            // }
            if (!this.isResident()) {
                if (!this._renderable.meshIsReady()) {
                    this._layer.createMesh(this);
                }
            }
        },
        /**
         * Установить объект рисования
         * @method setRenderable
         * @public
         * @param renderable {GWTK.gEngine.Scene.Chunk} Объект рисования
         */
        setRenderable: function (renderable) {
            this._renderable = renderable;
        },
        /**
         * Получить объект рисования
         * @method getRenderable
         * @public
         * @return {GWTK.gEngine.Scene.Chunk} Объект рисования
         */
        getRenderable: function () {
            return this._renderable;
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
                this._minDistance = 0.485 * Math.abs(Math.cos(camera.getCameraGeodetic(projection.getGlobeShape()).getLatitude())) * e * viewport[2] / (2 * Math.tan(theta / 2) * thau);

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
         * Удаление объекта рисования узла
         * @method _selfDestroy
         * @private
         */
        _selfDestroy: function () {
            if (this._renderable !== null) {
                this._renderable.destroy();
                this._renderable = null;
            }
            this._identifier = null;
            this.parent = null;
            this._obb = null;
            this._children = null;
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
