/******************************************** Тазин В. 04/06/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Часть облака точек                         *
 *                                                                  *
 *******************************************************************/
"use strict";
import VertexAttribute, { VertexAttributeType } from '~/3d/engine/core/geometry/vertexattribute';
import Indices, { IndicesType } from '~/3d/engine/core/geometry/indices';
import Mesh, { PrimitiveType, WindingOrder } from '~/3d/engine/core/geometry/mesh';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Компонент части облака точек
     * @class GWTK.gEngine.Scene.PointCloud
     * @constructor GWTK.gEngine.Scene.PointCloud
     */
    GWTK.gEngine.Scene.PointCloud = function () {
        this.kColorVS = "chunkPointVS";
        this.kColorFS = "chunkPointFS";
        this.enable = false;

        GWTK.gEngine.ResourceMap.retrieveAssetsOnload([this.kColorVS, this.kColorFS], this._init.bind(this));
    };
    GWTK.gEngine.Scene.PointCloud.prototype = {

        /**
         * Инициализация компонента
         * @method _init
         * @private
         */
        _init: function () {
            var pointRS = new GWTK.gEngine.Renderer.RenderState();
            pointRS.depthTest.enabled = true;
            pointRS.depthTest.func = GWTK.gEngine.Renderer.enumDepthComparisonFunction.LEqual;
            pointRS.facetCulling.enabled = true;
            pointRS.blending.enabled = true;
            pointRS.blending.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            pointRS.blending.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            pointRS.blending.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
            pointRS.blending.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;

            var vs = GWTK.gEngine.ResourceMap.retrieveAsset(this.kColorVS);
            var fs = GWTK.gEngine.ResourceMap.retrieveAsset(this.kColorFS);
            var pointSP = GWTK.gEngine.Renderer.ShaderMap.retrieveOrCreate("shaderName_" + this.kColorLineVS + this.kColorLineFS, vs, fs);
            this._fillLogarithmicDepth = pointSP.getUniforms()["u_logarithmicDepth"];
            this._fillLogarithmicDepth.setValue(1);

            this._lightInfoUniform = pointSP.getLightInfoUniform();

            this._drawState = new GWTK.gEngine.Renderer.DrawState(pointRS, pointSP, this._va);
            this.enable = true;
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
         * Установить меш
         * @method setMesh
         * @public
         * @param inputMesh {object} Набор параметров вершин
         */
        setMesh: function (inputMesh) {
            var primitiveMesh = inputMesh.mesh;
            var positionsAttribute = new VertexAttribute('aVertexPosition', VertexAttributeType.Float, 3);
            positionsAttribute._values = primitiveMesh.positions;

            var normalsAttribute = new VertexAttribute('aVertexNormal', VertexAttributeType.Float, 3);
            normalsAttribute._values = primitiveMesh.normals;

            var colorAttribute = new VertexAttribute('aVertexColor', VertexAttributeType.Float, 4);
            colorAttribute._values = primitiveMesh.colors;

            var indices = new Indices(IndicesType.uShort);
            indices.add(primitiveMesh.indices);
            indices.validateType();

            var mesh = new Mesh();
            mesh.addAttribute(positionsAttribute);
            mesh.addAttribute(normalsAttribute);
            mesh.addAttribute(colorAttribute);
            mesh.setIndices(indices);
            mesh.setFrontFaceWindingOrder(primitiveMesh.frontFace === 1 ? WindingOrder.Counterclockwise : WindingOrder.Clockwise);
            mesh.setPrimitiveType(primitiveMesh.type || PrimitiveType.Points);
            this._meshGeomtery = mesh;
            this._mesh = true;
            this._dirty = true;

        },
        /**
         * Установить буферы меша
         * @method setMeshBuffers
         * @public
         * @param meshBuffersJSON {object} Буферы меша
         */
        setMeshBuffers: function (meshBuffersJSON) {
            var meshBuffers = new GWTK.gEngine.Renderer.MeshBuffers();
            meshBuffers.fromJSON(meshBuffersJSON, this._drawState.shaderProgram.getVertexAttributes(), GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);
            this._meshBuffers = meshBuffers;
            var mesh = new Mesh();
            mesh.setFrontFaceWindingOrder(meshBuffersJSON.frontFaceWindingOrder);
            mesh.setPrimitiveType(meshBuffersJSON.primitiveType);
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
            return this.meshIsReady();
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
            return true;
        },
        /**
         * Получить флаг готовности материала к отображению
         * @method materialIsReady
         * @public
         * @return {boolean} Флаг готовности материала к отображению
         */
        materialIsReady: function () {
            return true;
        },

        /**
         * Обновить состояние компонента
         * @method _clean
         * @private
         */
        _clean: function () {
            if (this._dirty && this._meshGeomtery) {
                if (this._meshBuffers) {
                    var meshBuffers = this._meshBuffers;
                } else {
                    meshBuffers = GWTK.gEngine.Renderer.GraphicDevice.createUnionMeshBuffers(this._meshGeomtery, this._drawState.shaderProgram.getVertexAttributes(), GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);
                    this._meshGeomtery.freeMesh();
                }
                this._drawState.vertexArray = GWTK.gEngine.Renderer.Context.createVertexArrayFromMeshBuffers(meshBuffers);
                this._drawState.renderState.facetCulling.frontFaceWindingOrder = this._meshGeomtery.getFrontFaceWindingOrder();
                this._dirty = false;
            }
        },
        /**
         * Рисование компонента
         * @method render
         * @public
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param logarithmicDepth {boolean} Флаг использования логарифмической глубины
         * @param depthDraw {boolean} Флаг отрисовки во фреймбуфер глубины
         * @param opacity {number} Прозрачность объектов
         */
        render: function (sceneState, logarithmicDepth, depthDraw, opacity) {
            if (this.enable && !depthDraw) {
                var context = GWTK.gEngine.Renderer.Context;
                this._clean();
                var uniforms = this._drawState.shaderProgram.getUniforms();
                uniforms['uTransparent'].setValue(opacity);

                uniforms['uMVMatrix'].setValue(sceneState.getModelViewPerspectiveMatrix());
                this._updateLightInfo(sceneState);

                uniforms['uFcoef'].setValue(sceneState.uFcoef);

                context.draw(this._meshGeomtery.getPrimitiveType(), this._drawState, sceneState);
            }
        },
        /**
         * Обновить состояние освещения
         * @method _updateLightInfo
         * @private
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         */
        _updateLightInfo: function (sceneState) {
            var lightSource = sceneState.getLightSource();
            this._lightInfoUniform.position.setValue(lightSource.getPosition());

            var lightColor = lightSource.getLightColor();
            this._lightInfoUniform.ambient.setValue(lightColor.ambient);
            this._lightInfoUniform.diffuse.setValue(lightColor.diffuse);
            this._lightInfoUniform.specular&&this._lightInfoUniform.specular.setValue(lightColor.specular);

            this._drawState.shaderProgram.getUniforms()['uCenterPoint'].setValue(this.getOBB().getCenter());
        },
        /**
         * Удаление буферов из контекста
         * @method destroy
         * @public
         */
        destroy: function () {
            this._fillLogarithmicDepth = null;
            this._lightInfoUniform = null;
            if (this._drawState) {
                if (this._drawState.vertexArray) {
                    this._drawState.vertexArray.destroy();
                    this._drawState.vertexArray = null;
                }
                this._drawState.shaderProgram = null;
            }
            this._obb = null;
            this._meshGeomtery = null;
        }
    }
}