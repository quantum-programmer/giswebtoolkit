/****************************************** Тазин В.О. 10/11/20  ****
 *************************************** Железнякова Ю 07/10/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Коллекция объектов                           *
 *                                                                  *
 *******************************************************************/
"use strict";
import Mesh, { PrimitiveType } from '~/3d/engine/core/geometry/mesh';
import { LOCALE } from '~/3d/engine/worker/workerscripts/parse3dobject';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};

    /**
     * Компонент рисования коллекции объектов
     * @class GWTK.gEngine.Scene.RenderableCollection
     * @constructor GWTK.gEngine.Scene.RenderableCollection
     * @param id {string} Идентификатор объекта
     * @param obb {OrientedBoundingBox3D} Геометрия узла
     */
    GWTK.gEngine.Scene.RenderableCollection = function (id, obb) {
        this.id = id;
        this._obb = obb;
        this._polygonList = [];
        this._descriptionIdList = {};
    };
    GWTK.gEngine.Scene.RenderableCollection.prototype = {
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
         * Рисование компонента
         * @method render
         * @public
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param logarithmicDepth {boolean} Флаг использования логарифмической глубины
         * @param depthDraw {boolean} Флаг отрисовки во фреймбуфер глубины
         */
        render: function (sceneState, logarithmicDepth, depthDraw) {
            if (this._polygonList.length > 0) {
                sceneState.resetModelMatrix();
                for (var i = 0; i < this._polygonList.length; i++) {
                    this._polygonList[i].render(sceneState, logarithmicDepth, depthDraw)
                }
            }
        },
        /**
         * Удаление буферов из контекста
         * @method destroy
         * @public
         */
        destroy: function () {
            for (var i = 0; i < this._polygonList.length; i++) {
                this._polygonList[i].destroy();
            }
        },
        /**
         * Добавить объект, полученный из GeoJSON
         * @method addFromGeoJSON
         * @public
         * @param feature {object} Данные объекта
         */
        addFromGeoJSON: function (feature) {
            if ((this._polygonList.length > 0 && this._descriptionIdList[feature.description.guid] !== undefined) &&
                (!feature.properties.__service || feature.properties.__service.animated === false)) //TODO: пока нет отдельного описания в классификаторе
            {
                var polygon = this._polygonList[this._descriptionIdList[feature.description.guid]];
            }

            if (polygon) {
                var mesh = polygon.getMesh();
            }

            if (!mesh || this._descriptionIdList[feature.description.guid] === undefined) {
                if (feature.mesh) {
                    if (feature.mesh instanceof Mesh) {
                        mesh = feature.mesh;
                    } else {
                        mesh = Mesh.fromJSON(feature.mesh);
                    }
                }
            } else if (!feature.meshInstanced && !feature.meshText) {
                var fmesh = Mesh.fromJSON(feature.mesh);

                var posAttrValues = fmesh.getAttributes()['aVertexPosition'].getValues();
                var positionsAttribute = mesh.getAttributes()['aVertexPosition'];
                var values = positionsAttribute.getValues();
                var addIndex = values.length;
                for (var i = 0; i < posAttrValues.length; i++) {
                    values.push(posAttrValues[i])
                }


                if (fmesh.getAttributes()['aVertexNormal']) {
                    var normAttrValues = fmesh.getAttributes()['aVertexNormal'].getValues();
                    var normalsAttribute = mesh.getAttributes()['aVertexNormal'];
                    values = normalsAttribute.getValues();
                    for (i = 0; i < normAttrValues.length; i++) {
                        values.push(normAttrValues[i])
                    }
                }

                if (fmesh.getAttributes()['aVertexTextureCoords']) {
                    var textureCoordsAttrValues = fmesh.getAttributes()['aVertexTextureCoords'].getValues();
                    var textureCoordsAttr = mesh.getAttributes()['aVertexTextureCoords'];
                    values = textureCoordsAttr.getValues();
                    for (i = 0; i < textureCoordsAttrValues.length; i++) {
                        values.push(textureCoordsAttrValues[i])
                    }
                }

                if (fmesh.getAttributes()['aVertexMaterial']) {
                    var materialAttrValues = fmesh.getAttributes()['aVertexMaterial'].getValues();
                    var materialAttr = mesh.getAttributes()['aVertexMaterial'];
                    values = materialAttr.getValues();
                    for (i = 0; i < materialAttrValues.length; i++) {
                        values.push(materialAttrValues[i])
                    }
                }

                var indicesResultValues = fmesh.getIndices().getValues();
                var indicesAttribute = mesh.getIndices();
                values = indicesAttribute.getValues();
                for (i = 0; i < indicesResultValues.length; i++) {
                    values.push(indicesResultValues[i] + addIndex)
                }
                indicesAttribute.validateType();
            }


            if (feature.meshInstanced != null) {
                var meshInstanced = null;
                if (polygon) {
                    meshInstanced = polygon.getInstancedMesh();
                }

                if (!meshInstanced) {
                    meshInstanced = Mesh.fromJSON(feature.meshInstanced);
                } else {

                    if (feature.singleObjectFlag) {
                        var attributes = meshInstanced.getAttributes();
                        for (var k in attributes) {
                            attributes[k].getValues().length = 0;
                        }
                    }

                    var fmeshInstanced = Mesh.fromJSON(feature.meshInstanced);

                    var instancedPosAttributeValues = fmeshInstanced.getAttributes()['aVertexOffset'].getValues();
                    var instancedPositionsAttribute = meshInstanced.getAttributes()['aVertexOffset'];
                    values = instancedPositionsAttribute.getValues();
                    for (i = 0; i < instancedPosAttributeValues.length; i++) {
                        values.push(instancedPosAttributeValues[i])
                    }

                    var instancedRotAxisAttribute = fmeshInstanced.getAttributes()['aVertexAxis'].getValues();
                    var instancedRotationsAxisAttribute = meshInstanced.getAttributes()['aVertexAxis'];
                    values = instancedRotationsAxisAttribute.getValues();
                    for (i = 0; i < instancedRotAxisAttribute.length; i++) {
                        values.push(instancedRotAxisAttribute[i])
                    }

                    var instancedRotAngleAttribute = fmeshInstanced.getAttributes()['aVertexAngle'].getValues();
                    var instancedRotationAnglesAttribute = meshInstanced.getAttributes()['aVertexAngle'];
                    values = instancedRotationAnglesAttribute.getValues();
                    for (i = 0; i < instancedRotAngleAttribute.length; i++) {
                        values.push(instancedRotAngleAttribute[i])
                    }

                    var instancedScaleAttribute = fmeshInstanced.getAttributes()['aVertexScale'].getValues();
                    var instancedScalesAttribute = meshInstanced.getAttributes()['aVertexScale'];
                    values = instancedScalesAttribute.getValues();
                    for (i = 0; i < instancedScaleAttribute.length; i++) {
                        values.push(instancedScaleAttribute[i])
                    }
                }
                if (feature.properties.__service && feature.properties.__service.animated){
                    polygon = this._createAnimatedDrawingObject(feature, mesh, this.getOBB(), polygon, meshInstanced);
                }
                else {
                    polygon = this._createInstancedDrawingObject(feature, mesh, this.getOBB(), polygon, meshInstanced);
                }
            } else if (feature.meshText != null) {
                var meshText = Mesh.fromJSON(feature.meshText);
                polygon = this._createTextObject(feature, mesh, this.getOBB(), polygon, meshText);
            } else if (feature.properties.__service) {
                if (feature.properties.__service.simplePolygon === true) {
                    polygon = this._createSimplePolygon(feature.properties.id, mesh, this.getOBB(), polygon);
                }
            }else if (mesh.shadowVolume === true) {
                polygon = this._createShadowPolygon(feature.properties.id, mesh, this.getOBB(), polygon);
            } else {
                if (feature.properties.localization === LOCALE.Line && feature.description.textureId != null) {
                    feature.properties.localization = LOCALE.Plane;
                }
                if (mesh.getPrimitiveType() === PrimitiveType.Lines) {
                    feature.properties.localization = LOCALE.Line;
                }
                switch (feature.properties.localization) {
                    case LOCALE.Line:
                        polygon = this._createPolyline(feature.properties.id, mesh, this.getOBB(), polygon);
                        break;
                    case LOCALE.Plane:
                        polygon = this._createPolygon(feature.properties.id, mesh, this.getOBB(), polygon);
                        break;
                    case LOCALE.Text:
                        polygon = undefined;
                        break;
                }
            }

            if (polygon !== undefined) {
                polygon.setDescription(feature.description);
                if (this._polygonList.length === 0 || this._descriptionIdList[feature.description.guid] === undefined) {
                    this._addPolygon(polygon, feature.description.guid);
                }
            }
        },
        /**
         * Создать полигон
         * @method _createPolygon
         * @private
         * @param id {string} Идентификатор объекта
         * @param mesh {Mesh} Меш объекта
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         * @param [dest] {GWTK.gEngine.Scene.Polygon} Существующий экземпляр
         * @return {GWTK.gEngine.Scene.Polygon} Новый экземпляр объекта/cуществующий экземпляр
         */
        _createPolygon: function (id, mesh, obb, dest) {
            if (!dest) {
                dest = new GWTK.gEngine.Scene.Polygon(id);
                dest.setMesh(mesh);
                dest.setOBB(obb);
            }
            return dest;
        },
        /**
         * Создать полигон по поверхности
         * @method _createShadowPolygon
         * @private
         * @param id {string} Идентификатор объекта
         * @param mesh {Mesh} Меш объекта
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         * @param [dest] {GWTK.gEngine.Scene.Polygon} Существующий экземпляр
         * @return {GWTK.gEngine.Scene.Polygon} Новый экземпляр объекта/cуществующий экземпляр
         */
        _createShadowPolygon: function (id, mesh, obb, dest) {
            if (!dest) {
                dest = new GWTK.gEngine.Scene.ShadowVolumePolygon(id);
                dest.setMesh(mesh);
                dest.setOBB(obb);
            }
            return dest;
        },
        /**
         * Создать простой полигон
         * @method _createSimplePolygon
         * @private
         * @param id {string} Идентификатор объекта
         * @param mesh {Mesh} Меш объекта
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         * @param [dest] {GWTK.gEngine.Scene.Polygon} Существующий экземпляр
         * @return {GWTK.gEngine.Scene.Polygon} Новый экземпляр объекта/cуществующий экземпляр
         */
        _createSimplePolygon: function (id, mesh, obb, dest) {
            if (!dest) {
                dest = new GWTK.gEngine.Scene.SimplePolygon(id);
                dest.setMesh(mesh);
                dest.setOBB(obb);
            }
            return dest;
        },
        /**
         * Создать знак
         * @method _createInstancedDrawingObject
         * @private
         * @param feature {object} Данные объекта
         * @param mesh {Mesh} Меш объекта
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         * @param [dest] {GWTK.gEngine.Scene.InstancedObject} Существующий экземпляр
         * @param meshInstanced {Mesh} Меш повторяющихся параметров
         * @return {GWTK.gEngine.Scene.InstancedObject} Новый экземпляр объекта/cуществующий экземпляр
         */
        _createInstancedDrawingObject: function (feature, mesh, obb, dest, meshInstanced) {
            if (!dest) {
                dest = new GWTK.gEngine.Scene.InstancedObject(feature.properties.id);
                dest.setOBB(obb);
                dest.setMesh(mesh);
                dest.setInstancedMesh(meshInstanced);
            } else {
                dest.setOBB(obb);
                dest._isDirty = true;
            }
            return dest;
        },
        /**
         * Создать текст
         * @method _createInstancedDrawingObject
         * @private
         * @param feature {object} Данные объекта
         * @param mesh {Mesh} Меш объекта
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         * @param [dest] {GWTK.gEngine.Scene.TextObject} Существующий экземпляр
         * @param meshInstanced {Mesh} Меш повторяющихся параметров
         * @return {GWTK.gEngine.Scene.TextObject} Новый экземпляр объекта/cуществующий экземпляр
         */
        _createTextObject: function (feature, mesh, obb, dest, meshInstanced) {
            if (!dest) {
                dest = new GWTK.gEngine.Scene.TextObject(feature.properties.id);
                dest.setOBB(obb);
                dest.setMesh(mesh);
                dest.setInstancedMesh(meshInstanced);
            } else {
                dest.setOBB(obb);
                dest._isDirty = true;
            }
            return dest;
        },
        /**
         * Создать полилинию
         * @method _createInstancedDrawingObject
         * @private
         * @param id {string} Идентификатор объекта
         * @param mesh {Mesh} Меш объекта
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         * @param [dest] {GWTK.gEngine.Scene.Polyline} Существующий экземпляр
         * @return {GWTK.gEngine.Scene.Polyline} Новый экземпляр объекта/cуществующий экземпляр
         */
        _createPolyline: function (id, mesh, obb, dest) {
            if (!dest) {
                dest = new GWTK.gEngine.Scene.Polyline(id);
                dest.setMesh(mesh);
                dest.setOBB(obb);
            }
            return dest;
        },

        /**
         * Создать анимированный знак
         * @method _createAnimatedDrawingObject
         * @private
         * @param feature {object} Данные объекта
         * @param mesh {Mesh} Меш объекта
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         * @param [dest] {GWTK.gEngine.Scene.InstancedObject} Существующий экземпляр
         * @param meshInstanced {Mesh} Меш повторяющихся параметров
         * @return {GWTK.gEngine.Scene.InstancedObject} Новый экземпляр объекта/cуществующий экземпляр
         */
        _createAnimatedDrawingObject: function (feature, mesh, obb, dest, meshInstanced) {
            if (!dest) {
                dest = new GWTK.gEngine.Scene.AnimatedObject(feature.properties.id, feature.properties.__service.animatedParam);
                dest.setOBB(obb);
                dest.setMesh(mesh);
                dest.setInstancedAnimatedMesh(meshInstanced);
            } else {
                dest.setOBB(obb);
                dest._isDirty = true;
            }
            return dest;
        },

        /**
         * Добавить объект в список существующих
         * @method _addPolygon
         * @private
         * @param polygon {GWTK.gEngine.Scene.AbstractRenderable} Экземпляр объекта
         * @param id {string} Идентификатор объекта
         */
        _addPolygon: function (polygon, id) {
            if (polygon != null) {
                this._polygonList.push(polygon);
                if (this._descriptionIdList[id] === undefined) {
                    this._descriptionIdList[id] = this._polygonList.length - 1;
                }
            }
        }
    }
}
