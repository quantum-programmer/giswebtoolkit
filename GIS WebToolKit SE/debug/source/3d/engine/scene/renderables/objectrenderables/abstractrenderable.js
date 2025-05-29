/****************************************** Тазин В.О. 10/11/20  ****
 ************************************** Железнякова Ю. 12/05/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Стандартный объект                           *
 *                                                                  *
 *******************************************************************/
"use strict";
import ColorMethods from '~/3d/engine/utils/colormethods';
import { PrimitiveType } from '~/3d/engine/core/geometry/mesh';
import { mat4 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Компонент рисования стандартного объекта
     * @class GWTK.gEngine.Scene.AbstractRenderable
     * @constructor GWTK.gEngine.Scene.AbstractRenderable
     * @param id {string} Идентификатор объекта
     * @param vertexShader {string} Название вершинного шейдера в реестре ресурсов
     * @param fragmentShader {string} Название фрагментного шейдера в реестре ресурсов
     * @param renderState {GWTK.gEngine.Renderer.RenderState} Состояние контекста рисования
     */
    GWTK.gEngine.Scene.AbstractRenderable = function (id, vertexShader, fragmentShader, renderState) {
        this._id = id;

        this.enable = false;

        this.kColorVS = vertexShader; // Path to the VertexShader
        this.kColorFS = fragmentShader;

        this._modelMatrix = mat4.identity([]);

        this._isDirty = false;
        this._shapeMaterialList = [];
        this._shapeParamList = [];

        this.setColor([0.5, 0.5, 0.5, 1], 0);

        this._texture = null;
        this._dirtyColor = true;

        this._fillRS = renderState;

        GWTK.gEngine.ResourceMap.retrieveAssetsOnload([this.kColorVS, this.kColorFS], this._init.bind(this));
    };
    GWTK.gEngine.Scene.AbstractRenderable.prototype = {
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mCameraPosition
         */
        mCameraPosition: [],
        /**
         * Инициализация компонента
         * @method _init
         * @private
         */
        _init: function () {

            var vs = GWTK.gEngine.ResourceMap.retrieveAsset(this.kColorVS);
            var fs = GWTK.gEngine.ResourceMap.retrieveAsset(this.kColorFS);
            var fillSP = GWTK.gEngine.Renderer.ShaderMap.retrieveOrCreate("shaderName_" + this.kColorVS + this.kColorFS, vs, fs);

            this._fillLogarithmicDepth = fillSP.getUniforms()["u_logarithmicDepth"];
            this._fillLogarithmicDepth.setValue(1);

            this._materialUniformList = fillSP.getMaterialUniformList();
            this._uTextureFlag = fillSP.getUniforms()['uTextureFlag'];
            this._uForceMaterial = fillSP.getUniforms()['uForceMaterial'];
            this._uDepthMode = fillSP.getUniforms()['uDepthMode'];
            this._uViewPosition = fillSP.getUniforms()['uViewPosition'];

            this._drawState = new GWTK.gEngine.Renderer.DrawState(this._fillRS, fillSP);
            this._fillRS = null;

            this._lightInfoUniform = fillSP.getLightInfoUniform();

            this.enable = true;
        },

        /**
         * Получить параметры рисования
         * @method getDrawState
         * @public
         * @return {GWTK.gEngine.Renderer.DrawState} Параметры рисования
         */
        getDrawState: function () {
            return this._drawState;
        },

        /**
         * Установить геометрию узла
         * @method setOBB
         * @public
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         */
        setOBB: function (obb) {
            this._obb = obb;
            var centerPoint = this.getOBB().getCenter();
            this._modelMatrix = mat4.identity(this._modelMatrix);
            // model matrix
            mat4.translate(this._modelMatrix, centerPoint, this._modelMatrix);
        },

        /**
         * Установить матрицу трансформирования
         * @method setModelMatrix
         *
         */
        setModelMatrix: function (matrix) {
            // TODO: для сценариев
            mat4.set(matrix, this._modelMatrix);
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
            if (this._mesh !== mesh) {
                this._mesh = mesh;
                this._isDirty = true;
            }
        },
        /**
         * Получить меш
         * @method getMesh
         * @public
         * @return {Mesh} Меш
         */
        getMesh: function () {
            return this._mesh;
        },
        /**
         * Обновить состояние компонента
         * @method _clean
         * @private
         */
        _clean: function () {
            if (this._isDirty) {
                if (this._mesh) {
                    var meshBuffers = GWTK.gEngine.Renderer.GraphicDevice.createUnionMeshBuffers(this._mesh, this._drawState.shaderProgram.getVertexAttributes(), GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);
                    this._drawState.renderState.drawingType = this._mesh.getPrimitiveType();
                    this._drawState.renderState.facetCulling.frontFaceWindingOrder = this._mesh.getFrontFaceWindingOrder();
                    this._drawState.vertexArray = GWTK.gEngine.Renderer.Context.createVertexArrayFromMeshBuffers(meshBuffers, this._drawState.vertexArray);
                    this._mesh = null;
                }
                this._optionalUpdate();
                this._isDirty = false;
            }
        },
        /**
         * Дополнительный метод обновления
         * @method _optionalUpdate
         * @private
         */
        _optionalUpdate: function () {
        },
        /**
         * Рисование компонента
         * @method render
         * @public
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param logarithmicDepth {boolean} Флаг использования логарифмической глубины
         * @param depthDraw {boolean} Флаг отрисовки во фреймбуфер глубины
         */
        render: function (sceneState, logarithmicDepth, depthDraw) {
            if (this.enable) {
                this._clean();

                if (logarithmicDepth) {
                    this._fillLogarithmicDepth.setValue(1);
                    this._drawState.shaderProgram.getUniforms()['uFcoef'].setValue(sceneState.uFcoef);
                } else {
                    this._fillLogarithmicDepth.setValue(0);
                }

                if (depthDraw && this._uDepthMode) {
                    this._drawState.renderState.blending.enabled = false;
                    this._uDepthMode.setValue(true);
                    this._uTextureFlag.setValue(false);
                    this._uForceMaterial && this._uForceMaterial.setValue(false);
                } else {
                    this._drawState.renderState.blending.enabled = true;
                    if (this._uDepthMode) {
                        this._uDepthMode.setValue(false);
                    }
                    this._updateMaterial();
                    this._updateLightInfo(sceneState);
                    this._updateTexture();
                }

                if (!depthDraw || this._uDepthMode) {
                    sceneState.setModelMatrix(this._modelMatrix);
                    this._drawState.shaderProgram.getUniforms()['uMVMatrix'].setValue(sceneState.getModelViewPerspectiveMatrix());
                    if (this._uViewPosition) {
                        this._uViewPosition.setValue(sceneState.getCamera().getCameraVector());
                    }
                    this._drawCommand(sceneState);
                }
            }
        },
        /**
         * Команда рисования
         * @method _drawCommand
         * @private
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         */
        _drawCommand: function (sceneState) {
            var primitiveTypeWebgl = sceneState.wireFrameMode ? PrimitiveType.Lines : this._drawState.renderState.drawingType;
            GWTK.gEngine.Renderer.Context.draw(primitiveTypeWebgl, this._drawState, sceneState);
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
        destroy: function () {
            this._preDestroyCommand();
            if (this._drawState) {
                if (this._drawState.vertexArray) {
                    this._drawState.vertexArray.destroy();
                }
                this._drawState.vertexArray = null;
                this._drawState.shaderProgram = null;
            }

            this._fillLogarithmicDepth = null;
            this._materialUniformList = null;
            this._uTextureFlag = null;
            this._uForceMaterial = null;
            this._uDepthMode = null;
            this._lightInfoUniform = null;

            this._obb = null;

            this._shapeMaterialList = null;
            this._shapeParamList = null;

            this._modelMatrix = null;

            this._mesh = null;

            this.enable = false;

            this._isDirty = false;
        },
        /**
         * Метод перед удалением
         * @method _preDestroyCommand
         * @private
         */
        _preDestroyCommand: function () {
        },
        /**
         * Установить описание
         * @method setDescription
         * @public
         * @param description {object} Описание объекта
         */
        setDescription: function (description) {
            if (description.color) {
                this.setColor(description.color, 0);
            } else if (description.material) {
                this._setMaterial(description.material, 0);
            }
            if (description.textureId) {
                this._setTextureId(description.textureId);
            }
        },
        /**
         * Установить цвет
         * @method setColor
         * @public
         * @param value {array} Цвет [R,G,B,A]
         * @param index {number} Индекс материала
         */
        setColor: function (value, index) {
            if (!Array.isArray(this._shapeMaterialList[index])) {
                this._shapeMaterialList[index] = [];
                this._shapeParamList[index] = [];
            }
            var color = ColorMethods.packToFloat32(value);
            var shapeMaterial = this._shapeMaterialList[index];
            shapeMaterial[0] = color;
            shapeMaterial[1] = color;
            shapeMaterial[2] = 0;
            shapeMaterial[3] = 0;

            var shapeParam = this._shapeParamList[index];
            shapeParam[0] = 0;
            shapeParam[1] = value[3];
        },
        /**
         * Установить материал
         * @method _setMaterial
         * @private
         * @param material {object} Описание материала
         * @param index {number} Индекс материала
         */
        _setMaterial: function (material, index) {
            if (!Array.isArray(this._shapeMaterialList[index])) {
                this._shapeMaterialList[index] = [];
                this._shapeParamList[index] = [];
            }
            var shapeMaterial = this._shapeMaterialList[index];
            //TODO: материал
            shapeMaterial[0] = ColorMethods.packToFloat32(material.ambientColor);
            shapeMaterial[1] = ColorMethods.packToFloat32(material.diffuseColor);
            shapeMaterial[2] = ColorMethods.packToFloat32(material.specularColor);
            shapeMaterial[3] = ColorMethods.packToFloat32(material.emissiveColor);

            var shapeParam = this._shapeParamList[index];
            shapeParam[0] = material.shininess;
            shapeParam[1] = material.ambientColor[3];
        },
        /**
         * Установить идентификатор текстуры
         * @method setTextureId
         * @private
         * @param textureId {string} Идентификатор текстуры
         */
        _setTextureId: function (textureId) {
            this._texture = textureId;
        },

        /**
         * Обновить униформ материала
         * @method _updateMaterial
         * @private
         */
        _updateMaterial: function () {
            for (var i = 0; i < this._shapeMaterialList.length; i++) {
                if (this._shapeMaterialList[i] !== undefined) {
                    var materialUniform = this._materialUniformList[i];
                    materialUniform.ADSE.setValue(this._shapeMaterialList[i]);
                    materialUniform.ST.setValue(this._shapeParamList[i]);
                }
            }
        },
        /**
         * Обновить униформ текстуры
         * @method _updateTexture
         * @private
         */
        _updateTexture: function () {
            var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry(this._texture);
            if (texture !== undefined) {
                GWTK.gEngine.Renderer.Context.setTextureUnit(0, texture);
                this._uTextureFlag.setValue(true);
                this._uForceMaterial.setValue(false);
            } else {

                this._uTextureFlag.setValue(false);

                this._uForceMaterial.setValue(this._texture !== null);
            }
        }
    }
}
