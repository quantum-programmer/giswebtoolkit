/******************************************** Тазин В. 25/10/19  ****
 ***************************************** Кружкова E. 20/12/16  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Фон для 3d карты                                *
 *                                                                  *
 *******************************************************************/
"use strict";
import VertexAttribute, { VertexAttributeType } from '~/3d/engine/core/geometry/vertexattribute';
import Indices, { IndicesType } from '~/3d/engine/core/geometry/indices';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { EllipsoidCollection } from '~/3d/engine/core/geometry/ellipsoid';
import Mesh, { PrimitiveType, WindingOrder } from '~/3d/engine/core/geometry/mesh';
import { mat4, vec3 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс слоя горизонта
     * @class GWTK.gEngine.Scene.Background3d
     * @constructor GWTK.gEngine.Scene.Background3d
     */
    GWTK.gEngine.Scene.Background3d = function() {
        //   horPlaneCount, horPlaneCount - количество плоскостей по вертикали и горизонтали
        var horPlaneCount = 20;
        var verPlaneCount = 1;
        
        // ссылка на изображение текстуры
        var src = "./gwtkse/3d/images/sky.jpg";
        
        // Создание объекта-текстуры снимка
        var textureName = this.textureId = 'skySquare' + Date.now();
        
        var img = new Image();
        // После загрузки изображения преобразовать его в текстуру,
        // после чего записать в реестр ресурсов
        img.onload = function() {
            var description = new GWTK.gEngine.Renderer.Texture2DDescription(img.width, img.height, GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8, true);
            GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate(textureName, description, img, true, GWTK.gEngine.Renderer.TextureSamplers.linearMipmapRepeat);
            var urlCreator = window.URL;
            urlCreator.revokeObjectURL(src);
        };
        img.src = src;
        
        
        // Реальное количество плоскостей (пересчитывается с учетом наличия бортиков)
        this.HorPlaneCount = horPlaneCount;
        this.VerPlaneCount = verPlaneCount;
        
        // Число вершин (пересчитывается в calculate с учетом наличия бортиков)
        this.HorVertexCount = this.HorPlaneCount + 1;
        this.VerVertexCount = this.VerPlaneCount + 1;
        
        // Число точек, необходимое для описания поверхности фигуры (+1 в центре верхней плоскости)
        this.PointCount = this.HorVertexCount * this.VerVertexCount + 1;
        // Число индексов вершин треугольников, необходимое для описания
        // поверхности фигуры (треугольник*2 = четырехугольник = 6)
        // плюс треугольники верхней плоскости
        this.IndexCount = this.HorPlaneCount * this.VerPlaneCount * 6 + this.HorPlaneCount * 3;
        
        // Координаты вершин XYZ четырехугольных граней
        this.point = [];
        
        // Нормали вершин XYZ
        this.normal = [];
        
        // Координаты текстуры XY по вершинам
        this.texPoint = [];
        
        // Индексы вершин граней (i) с разбиением на треугольники
        this.indexPlane = [];
        this.mvMatrix = [];
        
        this._init();
        
        GWTK.gEngine.Mediator.subscribe('renderBackground', this.render.bind(this));
        
        this.mRaxis = [];
        
        this.mGeoTarget = new Geodetic3D(0, 0, 0);
        
    };
    GWTK.gEngine.Scene.Background3d.prototype = {
        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function() {
            this._calculateIndexes();
            var horBeginAngle = 0;
            var horEndAngle = 2 * Math.PI;
            var radius = 11000000.5;
            this._calculate(horBeginAngle, horEndAngle, radius);
            
            this.backgroundSources = ["skyVS", "skyFS"];
            this._drawState = null;
            
            GWTK.gEngine.ResourceMap.retrieveAssetsOnload(this.backgroundSources, this._initShader.bind(this));
        },
        /**
         * Инициализация шейдеров
         * @method _initShader
         * @private
         */
        _initShader: function() {
            var vs = GWTK.gEngine.ResourceMap.retrieveAsset(this.backgroundSources[0]);
            var fs = GWTK.gEngine.ResourceMap.retrieveAsset(this.backgroundSources[1]);
            var fillSP = GWTK.gEngine.Renderer.ShaderMap.retrieveOrCreate("shaderName_" + this.backgroundSources[0] + this.backgroundSources[1], vs, fs);
            
            var textureRS = new GWTK.gEngine.Renderer.RenderState();
            textureRS.depthTest.enabled = true;
            textureRS.depthTest.func = GWTK.gEngine.Renderer.enumDepthComparisonFunction.LEqual;
            textureRS.facetCulling.enabled = true;
            textureRS.blending.enabled = true;
            textureRS.blending.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            textureRS.blending.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            textureRS.blending.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
            textureRS.blending.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
            
            this._drawState = new GWTK.gEngine.Renderer.DrawState(textureRS, fillSP, null);
            this._initBuffers();
        },
        /**
         * Расчет буферов рисования поверхности шара
         * @method _initBuffers
         * @private
         * @return {number} 0 - Ошибка данных, 1 - Успешное выполнение
         */
        _initBuffers: function() {
            var mesh = new Mesh();
            // var attributes = this._drawState.shaderProgram.getVertexAttributes();
            // for (var k in attributes) {
            //     var attr = new VertexAttribute(k, VertexAttributeType.Float);
            //     mesh.addAttribute(attr);
            // }
            var indices = new Indices(IndicesType.uShort);
            indices.add(this.indexPlane);
            mesh.setIndices(indices);
            
            mesh.setFrontFaceWindingOrder(WindingOrder.Counterclockwise);
            mesh.setPrimitiveType(PrimitiveType.Triangles);
            
            // var meshAttributes = mesh.getAttributes();
            // meshAttributes['aVertexPosition']._values = this.point;
            var aVertexPosition = new VertexAttribute('aVertexPosition', VertexAttributeType.Float, 3);
            aVertexPosition.setValues(this.point);
            mesh.addAttribute(aVertexPosition);
            
            // meshAttributes['aTextureCoord']._values = this.texPoint;
            var aTextureCoord = new VertexAttribute('aTextureCoord', VertexAttributeType.Float, 3);
            aTextureCoord.setValues(this.texPoint);
            mesh.addAttribute(aTextureCoord);
            
            var meshBuffers = GWTK.gEngine.Renderer.GraphicDevice.createUnionMeshBuffers(mesh, this._drawState.shaderProgram.getVertexAttributes(), GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);
            this._drawState.vertexArray = GWTK.gEngine.Renderer.Context.createVertexArrayFromMeshBuffers(meshBuffers);
            
            this.point = null;
            this.normal = null;
            this.texPoint = null;
            this.indexPlane = null;
        },
        /**
         * Построение сферической поверхности
         * @method _calculate
         * @private
         * @param horBeginAngle {number} Начальный угол по горизонтали (по меридианам от Гринвича) от 0 до 360
         * @param horEndAngle {number} Конечный угол по горизонтали (по меридианам от Гринвича) от 0 до 360
         * @param radius {number} Радиус шара
         * @return {number} 0 - Ошибка данных,
         *                  1 - Успешное выполнение
         */
        _calculate: function(horBeginAngle, horEndAngle, radius) {
            
            var curH = 0.05 * Math.PI * radius;
            var hor;
            var horPlaneCount = this.HorPlaneCount;
            var horVertexCount = this.HorVertexCount;
            
            var horAngleDelta = -(horEndAngle - horBeginAngle) / horPlaneCount;
            
            var xy = 0;
            var xyz = 0;
            
            
            var height = -curH * 1.25;
            var horAngle = horBeginAngle;
            var yTex = 0.01;
            // Проход по нижним точкам цилиндра
            for (hor = 0; hor < horVertexCount; hor++) {
                var cosA = Math.cos(horAngle);
                var sinA = Math.sin(horAngle);
                // Координаты точек
                this.point[xyz] = [cosA * radius, sinA * radius, height];
                // Нормали точек
                // this.normal[xyz] = [cosA, -sinA, height];
                xyz++;
                
                this.texPoint[xy] = [hor, yTex];
                xy++;
                
                horAngle += horAngleDelta;
            }
            
            height = curH * 2;
            horAngle = horBeginAngle;
            yTex = 1.0;
            // Проход по верхним точкам цилиндра
            for (hor = 0; hor < horVertexCount; hor++) {
                cosA = Math.cos(horAngle);
                sinA = Math.sin(horAngle);
                // Координаты точек
                this.point[xyz] = [cosA * radius, sinA * radius, height];
                // Нормали точек
                // this.normal[xyz] = [cosA, -sinA, height];
                xyz++;
                
                this.texPoint[xy] = [hor, yTex];
                xy++;
                
                horAngle += horAngleDelta;
            }
            
            //Точка в центре верхней плоскости
            // Координаты точек
            this.point[xyz] = [0, 0, height];
            // Нормали точек
            // this.normal[xyz] = [0, 0, height];
            
            this.texPoint[xy] = [1., 1.];
            
            
        },
        /**
         * Рассчет массивов индексов и координат текстур поверхности шара
         * @method _calculateIndexes
         * @private
         * @return {Number} 0 - Ошибка данных,
         *                  1 - Успешное выполнение
         */
        _calculateIndexes: function() {
            
            var hor;
            
            // Убрать начальную и конечную вершины бортика
            // (по краю фрагмента шара бортик не формируется)
            
            var horPlaneCount = this.HorPlaneCount;
            var horVertexCount = this.HorVertexCount;
            var verVertexCount = this.VerVertexCount;
            
            // ЗАПОЛНИТЬ МАССИВ ИНДЕКСНЫХ КООРДИНАТ ГРАНЕЙ
            var ind = 0;
            
            var horIndex0 = 0;
            var horIndex1 = 0;
            
            var verIndex0 = 0;
            var verIndex1 = horVertexCount;
            
            var centerIndex = horVertexCount * verVertexCount;
            
            // Проход по меридианам
            for (hor = 0; hor < horPlaneCount; hor++) {
                horIndex0 = hor;
                horIndex1 = horIndex0 + 1;
                // Индексы кооординат текущей грани
                this.indexPlane[ind] = verIndex0 + horIndex0;
                ind++;
                this.indexPlane[ind] = verIndex1 + horIndex1;
                ind++;
                this.indexPlane[ind] = verIndex1 + horIndex0;
                ind++;
                
                this.indexPlane[ind] = verIndex0 + horIndex0;
                ind++;
                this.indexPlane[ind] = verIndex0 + horIndex1;
                ind++;
                this.indexPlane[ind] = verIndex1 + horIndex1;
                ind++;
                
                this.indexPlane[ind] = centerIndex;
                ind++;
                this.indexPlane[ind] = verIndex1 + horIndex0;
                ind++;
                this.indexPlane[ind] = verIndex1 + horIndex1;
                ind++;
                
                
            }
        },
        /**
         * Рисование
         * @method render
         * @private
         * @param e {object} Объект события отрисовки
         */
        render: function(e) {
            if (this._drawState !== null && !e.starsVisibility) {
                
                e.sceneState.resetModelMatrix();
                
                var mvMatrix = mat4.set(e.sceneState.getModelViewMatrix(), this.mvMatrix);
                mat4.translate(mvMatrix, e.sceneState.getCamera().getTargetPosition(), mvMatrix);
                
                var targetVector = e.sceneState.getCamera().getTargetPosition();
                var geoTarget = EllipsoidCollection.WGS84_SPHERICAL.toGeodetic3d(targetVector, this.mGeoTarget);
                var rAxis = vec3.cross(vec3.UNITZ, targetVector, this.mRaxis);
                
                mat4.rotate(mvMatrix, rAxis, Math.PI / 2 - geoTarget.getLatitude(), mvMatrix);
                mat4.rotateZ(mvMatrix, geoTarget.getLongitude(), mvMatrix);
                
                mat4.multiply(e.sceneState.getPerspectiveMatrix(), mvMatrix, mvMatrix);
                
                this._drawState.shaderProgram.getUniforms()['uMVMatrix'].setValue(this.mvMatrix);
                this._drawElement(e.sceneState);
            }
        },
        /**
         * Прорисовка элементов из буферов
         * @method _drawElement
         * @private
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         */
        _drawElement: function(sceneState) {
            var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry(this.textureId);
            if (texture !== undefined) {
                GWTK.gEngine.Renderer.Context.setTextureUnit(0, texture);
                var context = GWTK.gEngine.Renderer.Context;
                context.draw(PrimitiveType.Triangles, this._drawState, sceneState, this.IndexCount, 0);
            }
        },
        /**
         * Удаление внутренних элементов
         * @method destroy
         * @public
         */
        destroy: function() {
            this._drawState && this._drawState.vertexArray.destroy();
        }
    };
}