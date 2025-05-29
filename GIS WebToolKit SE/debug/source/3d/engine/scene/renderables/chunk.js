/******************************************** Тазин В. 28/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Часть поверхности                          *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};

    /**
     * Компонент рисования части поверхности
     * @class GWTK.gEngine.Scene.Chunk
     * @constructor GWTK.gEngine.Scene.Chunk
     */
    GWTK.gEngine.Scene.Chunk = function () {
        this._texture = null;
        this._obb = null;
    };
    GWTK.gEngine.Scene.Chunk.prototype = {
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mCameraPosition
         */
        mCameraPosition: [],
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
         * Установить меш
         * @method setMesh
         * @public
         * @param mesh {Mesh} Меш
         */
        setMesh: function (mesh) {
            this._meshGeomtery = mesh;
            this._mesh = true;
            this._dirty = true;
        },
        /**
         * Получить общий флаг готовности к отображению
         * @method isReady
         * @public
         * @return {boolean} Общий флаг готовности к отображению
         */
        isReady: function () {
            return this.meshIsReady() && this.textureIsReady();
        },
        /**
         * Получить флаг готовности меша к отображению
         * @method meshIsReady
         * @public
         * @return {boolean} Флаг готовности меша к отображению
         */
        meshIsReady: function () {
            return this._mesh === true;
        },
        /**
         * Получить флаг готовности текстуры к отображению
         * @method textureIsReady
         * @public
         * @return {boolean} Флаг готовности текстуры к отображению
         */
        textureIsReady: function () {
            return GWTK.gEngine.Renderer.TextureMap.retrieveEntry(this._texture) !== undefined;
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
         * Обновить состояние компонента
         * @method _clean
         * @private
         * @param drawState {GWTK.gEngine.Renderer.DrawState} Объект параметров рисования
         */
        _clean: function (drawState) {
            if (this._dirty && this._meshGeomtery) {
                var meshBuffers = GWTK.gEngine.Renderer.GraphicDevice.createUnionMeshBuffers(this._meshGeomtery, drawState.shaderProgram.getVertexAttributes(), GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);
                this.vertexArray = GWTK.gEngine.Renderer.Context.createVertexArrayFromMeshBuffers(meshBuffers);
                // this._meshGeomtery.freeMesh(); //лежит в высотном тайле
                this._dirty = false;
            }
        },
        /**
         * Рисование компонента
         * @method render
         * @public
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param drawState {GWTK.gEngine.Renderer.DrawState} Объект параметров рисования
         */
        render: function (sceneState, drawState) {
            var context = GWTK.gEngine.Renderer.Context;
            this._clean(drawState);
            drawState.vertexArray = this.vertexArray;

            var uniforms = drawState.shaderProgram.getUniforms();

            uniforms['uMVMatrix'].setValue(sceneState.getModelViewPerspectiveMatrix());
            uniforms['uCenterPoint'].setValue(this.getOBB().getCenter());

            if (!uniforms['uDepthMode'].getValue()) {
                var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry(this._texture);
                if (texture !== undefined) {
                    uniforms['uFlagTex0'].setValue(1);
                    context.setTextureUnit(0, texture);
                } else {
                    uniforms['uFlagTex0'].setValue(0);
                }
            }

            context.draw(this._meshGeomtery.getPrimitiveType(), drawState, sceneState);
        },
        /**
         * Удаление буферов из контекста
         * @method destroy
         * @public
         */
        destroy: function () {
            this._texture = null;
            this._obb = null;
            this._meshGeomtery = null;
            if (this.vertexArray) {
                this.vertexArray.destroy();
                this.vertexArray = null;
            }
        }
    }
}