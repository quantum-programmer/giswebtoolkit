/****************************************** Тазин В.О. 10/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Часть поверхности с материалом                      *
 *                                                                  *
 *******************************************************************/
"use strict";
import VertexAttribute, { VertexAttributeType } from '~/3d/engine/core/geometry/vertexattribute';
import Indices, { IndicesType } from '~/3d/engine/core/geometry/indices';
import ColorMethods from '~/3d/engine/utils/colormethods';
import Mesh, { PrimitiveType, WindingOrder } from '~/3d/engine/core/geometry/mesh';
import { MaterialIdentifier } from '~/3d/engine/scene/terrain/db3dsource/tile3didentifier';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Компонент части поверхности с материалом
     * @class GWTK.gEngine.Scene.MaterialChunk
     * @constructor GWTK.gEngine.Scene.MaterialChunk
     */
    GWTK.gEngine.Scene.MaterialChunk = function() {
        this.kColorVS = "materialTileVS";
        this.kColorFS = "materialTileFS";
        this.enable = false;
        
        GWTK.gEngine.ResourceMap.retrieveAssetsOnload([this.kColorVS, this.kColorFS], this._init.bind(this));
    };
    GWTK.gEngine.Scene.MaterialChunk.prototype = {
        /**
         * Инициализация компонента
         * @method _init
         * @private
         */
        _init: function() {
            var materialRS = new GWTK.gEngine.Renderer.RenderState();
            materialRS.depthTest.enabled = true;
            materialRS.depthTest.func = GWTK.gEngine.Renderer.enumDepthComparisonFunction.Less;
            materialRS.facetCulling.enabled = true;
            materialRS.blending.enabled = true;
            materialRS.blending.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            materialRS.blending.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            materialRS.blending.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
            materialRS.blending.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
            
            
            var vs = GWTK.gEngine.ResourceMap.retrieveAsset(this.kColorVS);
            var fs = GWTK.gEngine.ResourceMap.retrieveAsset(this.kColorFS);
            var fillSP = GWTK.gEngine.Renderer.ShaderMap.retrieveOrCreate("shaderName_" + this.kColorVS + this.kColorFS, vs, fs);
            
            fillSP.getUniforms()['u_logarithmicDepth'].setValue(1);
            
            
            this._lightInfoUniform = fillSP.getLightInfoUniform();
            this._materialUniform = {
                ADSE: fillSP.getUniforms()["u_Material.ADSE"],
                ST: fillSP.getUniforms()["u_Material.ST"]
            };
            
            this._drawState = new GWTK.gEngine.Renderer.DrawState(materialRS, fillSP, null);
            this._dirtyMaterial = true;
            
            var materialIdentifier = MaterialIdentifier.fromString(GWTK.gEngine.DEFAULT_MATERIAL);
            
            this._materialIdentifier = materialIdentifier.toString();
            
            var material = GWTK.gEngine.Renderer.MaterialMap.retrieveEntry(this._materialIdentifier);
            if (material) {
                this.setMaterial(material);
            }else{
                this._shapeMaterial = [0, 0, 0, 0];
            }
            
            this.enable = true;
        },
        /**
         * Установить геометрию узла
         * @method setOBB
         * @public
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         */
        setOBB: function(obb) {
            this._obb = obb;
        },
        /**
         * Получить геометрию узла
         * @method getOBB
         * @public
         * @return {OrientedBoundingBox3D} Геометрия узла
         */
        getOBB: function() {
            return this._obb;
        },
        /**
         * Установить меш
         * @method setMesh
         * @public
         * @param inputMesh {object} Набор параметров вершин
         */
        setMesh: function(inputMesh) {
            var primitiveMesh = inputMesh.mesh;
            var positionsAttribute = new VertexAttribute('aVertexPosition', VertexAttributeType.Float, 3);
            positionsAttribute._values = primitiveMesh.positions;
            
            var normalsAttribute = new VertexAttribute('aVertexNormal', VertexAttributeType.Float, 3);
            normalsAttribute._values = primitiveMesh.normals;
            
            var indices = new Indices(IndicesType.uShort);
            indices.add(primitiveMesh.indices);
            
            // if (!primitiveMesh.solid) {
            //     if (primitiveMesh.type != PrimitiveType.Lines) {
            //         for (var i = 0; i < primitiveMesh.indices.length; i += 3) {
            //             indices.add(primitiveMesh.indices[i]);
            //             indices.add(primitiveMesh.indices[i + 2]);
            //             indices.add(primitiveMesh.indices[i + 1]);
            //         }
            //     }
            // }
            indices.validateType();
            
            var mesh = new Mesh();
            mesh.addAttribute(positionsAttribute);
            mesh.addAttribute(normalsAttribute);
            mesh.setIndices(indices);
            mesh.setFrontFaceWindingOrder(primitiveMesh.frontFace === 1 ? WindingOrder.Counterclockwise : WindingOrder.Clockwise);
            mesh.setPrimitiveType(primitiveMesh.type);
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
        setMeshBuffers: function(meshBuffersJSON) {
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
        isReady: function() {
            return this.meshIsReady() && this.materialIsReady();
        },
        /**
         * Получить флаг готовности меша к отображению
         * @method meshIsReady
         * @public
         * @return {boolean} Флаг готовности меша к отображению
         */
        meshIsReady: function() {
            return this._mesh === true;
        },
        /**
         * Получить флаг готовности текстуры к отображению
         * @method textureIsReady
         * @public
         * @return {boolean} Флаг готовности текстуры к отображению
         */
        textureIsReady: function() {
            return true;
        },
        /**
         * Получить флаг готовности материала к отображению
         * @method materialIsReady
         * @public
         * @return {boolean} Флаг готовности материала к отображению
         */
        materialIsReady: function() {
            return GWTK.gEngine.Renderer.MaterialMap.hasEntry(this._materialIdentifier);
        },
        /**
         * Обновить состояние компонента
         * @method _clean
         * @private
         */
        _clean: function() {
            if (this._dirty) {
                if (this._meshGeomtery) {
                    if (this._meshBuffers) {
                        var meshBuffers = this._meshBuffers;
                    }else{
                        meshBuffers = GWTK.gEngine.Renderer.GraphicDevice.createUnionMeshBuffers(this._meshGeomtery, this._drawState.shaderProgram.getVertexAttributes(), GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);
                        this._meshGeomtery.freeMesh();
                    }
                    this._drawState.vertexArray = GWTK.gEngine.Renderer.Context.createVertexArrayFromMeshBuffers(meshBuffers);
                    this._drawState.renderState.facetCulling.frontFaceWindingOrder = this._meshGeomtery.getFrontFaceWindingOrder();
                }
                this._updateMaterial();
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
        render: function(sceneState, logarithmicDepth, depthDraw, opacity) {
            if (this.enable) {
                var context = GWTK.gEngine.Renderer.Context;
                this._clean();
                var uniforms = this._drawState.shaderProgram.getUniforms();
                
                
                if (logarithmicDepth) {
                    uniforms['u_logarithmicDepth'].setValue(1);
                    uniforms['uFcoef'].setValue(sceneState.uFcoef);
                }else{
                    uniforms['u_logarithmicDepth'].setValue(0);
                }
                
                
                if (depthDraw) {
                    this._drawState.renderState.blending.enabled = false;
                    uniforms['uTransparent'].setValue(1);
                    uniforms['uDepthMode'].setValue(true);
                }else{
                    this._drawState.renderState.blending.enabled = true;
                    uniforms['uDepthMode'].setValue(false);
                    uniforms['uTransparent'].setValue(opacity);
                    this._updateLightInfo(sceneState);
                }
                
                uniforms['uMVMatrix'].setValue(sceneState.getModelViewPerspectiveMatrix());
                
                
                if (!depthDraw) {
                    var material = GWTK.gEngine.Renderer.MaterialMap.retrieveEntry(this._materialIdentifier);
                    if (material) {
                        this.setMaterial(material);
                    }
                    this._updateMaterial();
                    uniforms['uViewPosition'].setValue(sceneState.getCamera().getCameraVector());
                }
                
                var primitiveTypeWebgl = sceneState.wireFrameMode ? PrimitiveType.Lines : this._meshGeomtery.getPrimitiveType();
                context.draw(primitiveTypeWebgl, this._drawState, sceneState);
            }
        },
        /**
         * Обновить состояние освещения
         * @method _updateLightInfo
         * @private
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         */
        _updateLightInfo: function(sceneState) {
            var lightSource = sceneState.getLightSource();
            this._lightInfoUniform.position.setValue(lightSource.getPosition());
            
            var lightColor = lightSource.getLightColor();
            this._lightInfoUniform.ambient.setValue(lightColor.ambient);
            this._lightInfoUniform.diffuse.setValue(lightColor.diffuse);
            this._lightInfoUniform.specular && this._lightInfoUniform.specular.setValue(lightColor.specular);
            
            
            if (this._drawState.shaderProgram.getUniforms()['uCenterPoint']) {
                this._drawState.shaderProgram.getUniforms()['uCenterPoint'].setValue(this.getOBB().getCenter());
            }
        },
        /**
         * Удаление буферов из контекста
         * @method destroy
         * @public
         */
        destroy: function() {
            this._materialUniform = null;
            this._materialIdentifier = null;
            this._lightInfoUniform = null;
            this._shapeMaterial = null;
            this._shapeParam = null;
            if (this._drawState) {
                if (this._drawState.vertexArray) {
                    this._drawState.vertexArray.destroy();
                    this._drawState.vertexArray = null;
                }
                this._drawState.shaderProgram = null;
            }
            this._obb = null;
            this._meshGeomtery = null;
        },
        /**
         * Установить материал
         * @method setMaterial
         * @public
         * @param material {GWTK.gEngine.Renderer.MaterialDescription} Параметры материала
         */
        setMaterial: function(material) {
            if (this._dirtyMaterial) {
                this._shapeMaterial = [
                    ColorMethods.packToFloat32(material.getAmbientColor()),
                    ColorMethods.packToFloat32(material.getDiffuseColor()),
                    ColorMethods.packToFloat32(material.getSpecularColor()),
                    ColorMethods.packToFloat32(material.getEmissiveColor())
                ];
                this._shapeParam = [material.getShininess, material.getOpacity()];
                this._dirtyMaterial = false;
            }
        },
        /**
         * Установить идентификатор материала
         * @method setMaterialId
         * @public
         * @param materialIdentifier {string} Идентификатор материала
         */
        setMaterialId: function(materialIdentifier) {
            if (this._materialIdentifier !== materialIdentifier) {
                this._materialIdentifier = materialIdentifier;
                this._dirtyMaterial = true;
            }
        },
        /**
         * Обновить униформ материала
         * @method _updateMaterial
         * @private
         */
        _updateMaterial: function() {
            this._materialUniform.ADSE.setValue(this._shapeMaterial);
            this._materialUniform.ST.setValue(this._shapeParam);
        }
    }
}
