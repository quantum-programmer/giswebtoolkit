/****************************************** Тазин В.О. 24/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Классы анимации объектов                      *
 *                                                                  *
 *******************************************************************/
import VertexAttribute, { VertexAttributeType } from '~/3d/engine/core/geometry/vertexattribute';
import { Calculate, vec3 } from '~/3d/engine/utils/glmatrix';

"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    
    /**
     * Класс анимации точечного объекта
     * @class GWTK.gEngine.Scene.PointRenderableAnimator
     * @constructor GWTK.gEngine.Scene.PointRenderableAnimator
     * @param renderable {GWTK.gEngine.Scene.InstancedObject} Экземпляр объекта
     */
    GWTK.gEngine.Scene.PointRenderableAnimator = function(renderable) {
        this._renderable = renderable;
        this._renderable.uDepthTextureFlag = true;
        this._renderable.getDrawState().renderState.depthTest.enabled = false;
        this._mesh = renderable.getInstancedMesh();
        
        this._axisesOrigin = this._mesh.getAttributes()['aVertexAxis'].getValues()[0];
        this._anglesOrigin = this._mesh.getAttributes()['aVertexAngle'].getValues()[0];
        this._scalesOrigin = this._mesh.getAttributes()['aVertexScale'].getValues()[0];
    };
    GWTK.gEngine.Scene.PointRenderableAnimator.prototype = {
        /**
         * Обновить геометрию узла
         * @method updateOBB
         * @public
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         */
        updateOBB: function(obb) {
            this._renderable.setOBB(obb);
        },
        /**
         * Обновить меш
         * @method updateMesh
         * @public
         * @param vectorPointList {array} Массив точек
         */
        updateMesh: function(vectorPointList) {
            
            var points = this._mesh.getAttributes()['aVertexOffset'].getValues();
            var axises = this._mesh.getAttributes()['aVertexAxis'].getValues();
            var angles = this._mesh.getAttributes()['aVertexAngle'].getValues();
            var scales = this._mesh.getAttributes()['aVertexScale'].getValues();
            
            points.length = vectorPointList.length;
            axises.length = vectorPointList.length;
            angles.length = vectorPointList.length;
            scales.length = vectorPointList.length;
            
            for (var i = 0; i < vectorPointList.length; i++) {
                if (!Array.isArray(points[i])) {
                    points[i] = [];
                }
                vec3.sub(vectorPointList[i], this._renderable.getOBB().getCenter(), points[i]);
                axises[i] = this._axisesOrigin;
                angles[i] = this._anglesOrigin;
                scales[i] = this._scalesOrigin;
            }
            // this._renderable.setInstancedMesh(this._mesh);//TODO: ???
            this._renderable._isDirty = true;
        }
    };
    /**
     * Класс анимации линейного объекта
     * @class GWTK.gEngine.Scene.LineRenderableAnimator
     * @constructor GWTK.gEngine.Scene.LineRenderableAnimator
     * @param renderable {GWTK.gEngine.Scene.Polyline} Экземпляр объекта
     */
    GWTK.gEngine.Scene.LineRenderableAnimator = function(renderable) {
        this._renderable = renderable;
        
        this._renderable.setColor([0, 0, 1, 1], 1); // цвет выделенного отрезка
        
        this._renderable.getDrawState().renderState.depthTest.enabled = false;
        this._mesh = renderable.getMesh();
    };
    GWTK.gEngine.Scene.LineRenderableAnimator.prototype = {
        /**
         * Обновить геометрию узла
         * @method updateOBB
         * @public
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         */
        updateOBB: function(obb) {
            this._renderable.setOBB(obb);
        },
        /**
         * Обновить меш
         * @method updateMesh
         * @public
         * @param vectorPointList {array} Массив точек
         * @param [options] {object} Параметры
         */
        updateMesh: function(vectorPointList, options) {
            
            var activeIndex0 = -1;
            var activeIndex1 = -1;
            if (options) {
                activeIndex0 = options.minActiveIndex;
                activeIndex1 = options.maxActiveIndex;
            }
            
            var points = this._mesh.getAttributes()['aVertexPosition'].getValues();
            var normals = this._mesh.getAttributes()['aVertexNormal'].getValues();
            var materials = this._mesh.getAttributes()['aVertexMaterial'].getValues();
            var indices = this._mesh.getIndices().getValues();
            
            indices.length = 0;
            
            for (var i = 0; i < vectorPointList.length; i++) {
                if (!Array.isArray(points[i])) {
                    points[i] = [];
                }
                vec3.sub(vectorPointList[i], this._renderable.getOBB().getCenter(), points[i]);
                normals[i] = normals[0];
                materials[i] = (i >= activeIndex0 && i < activeIndex1) ? 1 : 0;
                if (i + 1 < vectorPointList.length) {
                    indices.push(i, i + 1);
                }
            }
            
            var aLengthSoFar = this._mesh.getAttributes()['aLengthSoFar'];
            if (aLengthSoFar === undefined) {
                aLengthSoFar = new VertexAttribute('aLengthSoFar', VertexAttributeType.Float, 1);
                aLengthSoFar.setValues([0]);
                this._mesh.addAttribute(aLengthSoFar);
            }
            var lengthSoFar = aLengthSoFar.getValues(); // the length so far starts at 0
            lengthSoFar[0] = 0;
            var curLenVector = [];
            var curLen = 0;
            for (var ii = 1; ii < points.length; ++ii) {
                curLen += vec3.len(vec3.sub(points[ii], points[ii - 1], curLenVector));
                lengthSoFar[ii] = curLen;
            }
            
            
            this._renderable.setMesh(this._mesh);
            
        },
        /**
         * Обновить цвет линии
         * @method updateLineColor
         * @public
         * @param value {array} Цвет [R,G,B,A]
         */
        updateLineColor: function(value) {
            this._renderable.setColor([value[0], value[1], value[2], 1], 0); // цвет отрезка
            this._renderable.setColor([1 - value[0], 1 - value[1], 1 - value[2], 1], 1); // цвет выделенного отрезка
        }
    };
    
    /**
     * Класс анимации площадного объекта
     * @class GWTK.gEngine.Scene.PolygonRenderableAnimator
     * @constructor GWTK.gEngine.Scene.PolygonRenderableAnimator
     * @param renderable {GWTK.gEngine.Scene.Polyline} Экземпляр объекта
     */
    GWTK.gEngine.Scene.PolygonRenderableAnimator = function(renderable) {
        this._renderable = renderable;
        this._renderable.depthTestFlag = true;
        this._mesh = renderable.getMesh();
    };
    GWTK.gEngine.Scene.PolygonRenderableAnimator.prototype = {
        /**
         * Обновить геометрию узла
         * @method updateOBB
         * @public
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         */
        updateOBB: function(obb) {
            this._renderable.setOBB(obb);
        },
        /**
         * Обновить меш
         * @method updateMesh
         * @public
         * @param vectorPointList {array} Массив точек
         * @param [options] {object} Параметры
         */
        updateMesh: function(vectorPointList, options) {
            
            var points = this._mesh.getAttributes()['aVertexPosition'].getValues();
            var normals = this._mesh.getAttributes()['aVertexNormal'].getValues();
            var materials = this._mesh.getAttributes()['aVertexMaterial'].getValues();
            var textureCoords = this._mesh.getAttributes()['aVertexTextureCoords'].getValues();
            var indices = this._mesh.getIndices().getValues();
            
            indices.length = 0;
            points.length = vectorPointList.length;
            normals.length = vectorPointList.length;
            materials.length = vectorPointList.length;
            textureCoords.length = vectorPointList.length;
            
            if (vectorPointList.length > 2) {
                textureCoords[0] = [0, 0, 0];
                for (var i = 0; i < vectorPointList.length; i++) {
                    if (!Array.isArray(points[i])) {
                        points[i] = [];
                    }
                    vec3.sub(vectorPointList[i], this._renderable.getOBB().getCenter(), points[i]);
                    normals[i] = [];
                    textureCoords[i] = textureCoords[0];
                    materials[i] = 0;
                }
            }
            var curNormal = [];
            for (i = 0; i < options.indices.length; i++) {
                indices.push(options.indices[i]);
                
                if (((i % 3) === 0) && i < options.indices.length - 2) {
                    var index0 = options.indices[i];
                    var index1 = options.indices[i + 1];
                    var index2 = options.indices[i + 2];
                    
                    var vertex0 = points[index0];
                    var vertex1 = points[index1];
                    var vertex2 = points[index2];
                    Calculate.calcNormal(vertex0, vertex1, vertex2, curNormal);
                    vec3.normalize(curNormal);
                    vec3.set(curNormal, normals[index0]);
                    vec3.set(curNormal, normals[index1]);
                    vec3.set(curNormal, normals[index2]);
                }
            }
            
            this._renderable.setMesh(this._mesh);
            
        },
        /**
         * Обновить цвет заполнения
         * @method updateFillColor
         * @public
         * @param value {array} Цвет [R,G,B,A]
         */
        updateFillColor: function(value) {
            this._renderable.setColor(value, 0);
        }
    }
    
    /**
     * Класс анимации площадного объекта
     * @class GWTK.gEngine.Scene.SurfacePolygonRenderableAnimator
     * @constructor GWTK.gEngine.Scene.SurfacePolygonRenderableAnimator
     */
    GWTK.gEngine.Scene.SurfacePolygonRenderableAnimator = function() {
        this._renderableList = {};
        this._meshList = {};
        this._obb = null;
    };
    GWTK.gEngine.Scene.SurfacePolygonRenderableAnimator.prototype = {
        /**
         * Добавить экземпляр объекта
         * @method updateOBB
         * @public
         * @param id {string} Идентификатор описания
         * @param renderable {GWTK.gEngine.Scene.Polyline} Экземпляр объекта
         */
        addRenderable: function(id, renderable) {
            renderable.depthTestFlag = true;
            this._renderableList[id] = renderable;
            this._meshList[id] = renderable.getMesh();
        },
        
        /**
         * Обновить геометрию узла
         * @method updateOBB
         * @public
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         */
        updateOBB: function(obb) {
            for (var k in this._renderableList) {
                this._renderableList[k].setOBB(obb)
            }
            this._obb = obb;
        },
        /**
         * Обновить меш
         * @method updateMesh
         * @public
         * @param vectorPointList {array} Массив точек
         * @param options {object} Параметры
         */
        updateMesh: function(vectorPointList, options) {
            
            for (var k in this._renderableList) {
                var mesh = this._meshList[k];
                var points = mesh.getAttributes()['aVertexPosition'].getValues();
                if (mesh.getAttributes()['aVertexNormal']) {
                    var normals = mesh.getAttributes()['aVertexNormal'].getValues();
                }
                if (mesh.getAttributes()['aVertexTextureCoords']) {
                    var texCoords = mesh.getAttributes()['aVertexTextureCoords'].getValues();
                }
                var materials = mesh.getAttributes()['aVertexMaterial'].getValues();
                var indices = mesh.getIndices().getValues();
                
                indices.length = 0;
                points.length = vectorPointList.length;
                materials.length = vectorPointList.length;
                if (normals) {
                    normals.length = vectorPointList.length;
                }
                if (texCoords) {
                    texCoords.length = vectorPointList.length;
                }
                
                if (vectorPointList.length > 2) {
                    for (var i = 0; i < vectorPointList.length; i++) {
                        if (!Array.isArray(points[i])) {
                            points[i] = [];
                        }
                        vec3.sub(vectorPointList[i], this._obb.getCenter(), points[i]);
                        materials[i] = 0;
                        if (normals) {
                            if (!Array.isArray(normals[i])) {
                                normals[i] = [];
                            }
                            vec3.normalize(points[i], normals[i]);
                        }
                        if (texCoords) {
                            if (!Array.isArray(texCoords[i])) {
                                texCoords[i] = texCoords[0];
                            }
                        }
                    }
                }
                for (i = 0; i < options.indices.length; i++) {
                    indices.push(options.indices[i]);
                }
                if (this._renderableList[k].hasOwnProperty('minDistance')) {
                    this._renderableList[k].minDistance = options.minDistance || 0;
                }
                this._renderableList[k].setMesh(mesh);
            }
        },
        /**
         * Обновить цвет заполнения
         * @method updateFillColor
         * @public
         * @param value {array} Цвет [R,G,B,A]
         */
        updateFillColor: function(value) {
            for (var k in this._renderableList) {
                this._renderableList[k].setColor(value, 0);
            }
        }
    }
}
