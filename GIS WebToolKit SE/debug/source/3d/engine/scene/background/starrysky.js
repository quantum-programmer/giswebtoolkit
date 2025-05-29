/******************************************** Тазин В. 25/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент звездного неба                       *
 *                                                                  *
 *******************************************************************/
"use strict";
import VertexAttribute, { VertexAttributeType } from '~/3d/engine/core/geometry/vertexattribute';
import Mesh, { PrimitiveType, WindingOrder } from '~/3d/engine/core/geometry/mesh';
import { mat4, vec3 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    
    /**
     * Компонент звездного неба
     * @class GWTK.gEngine.Scene.StarrySky
     * @constructor GWTK.gEngine.Scene.StarrySky
     */
    GWTK.gEngine.Scene.StarrySky = function() {
        this.EARTH_RADIUS = 100;
        
        this.mvMatrix = mat4.create();
        this.geometry = [];
        this.drawArrays = [];
        
        this.textureArray = [
            [1.0, 0.0], [1.0, 1.0], [0.0, 0.0],
            [0.0, 1.0], [0.0, 0.0], [1.0, 1.0]
        ];
        
        this.starSources = ["starVS", "starFS", "starrysky"];
        
        GWTK.gEngine.ResourceMap.retrieveAssetsOnload(this.starSources, this._init.bind(this));
        
        GWTK.gEngine.Mediator.subscribe('renderBackground', this.render.bind(this));
        
    };
    GWTK.gEngine.Scene.StarrySky.prototype = {
        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function() {
            
            this._initShader();
            
            var src = "./gwtkse/3d/images/star.png";
            this.textureStarId = "starrysky" + Date.now();
            this._initTextureLoad(src, this.textureStarId);
            
            src = "./gwtkse/3d/images/sun.png";
            this.textureSunId = "sun" + Date.now();
            this._initTextureLoad(src, this.textureSunId);
            
            
            var stars = GWTK.gEngine.ResourceMap.retrieveAsset(this.starSources[2]);
            if (stars) {
                this._initStars(JSON.parse(stars)["starCoordinates"]);
            }
            this._initSun();
        },
        /**
         * Инициализация загрузки текстуры звезды
         * @method _initTextureLoad
         * @private
         * @param src {string} Ссылка на источник изображения
         * @param textureName {string} Название тестуры
         */
        _initTextureLoad: function(src, textureName) {
            var img = new Image();
            // После загрузки изображения преобразовать его в текстуру,
            // после чего записать в реестр ресурсов
            img.onload = function() {
                var description = new GWTK.gEngine.Renderer.Texture2DDescription(img.width, img.height, GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8, true);
                GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate(textureName, description, img, true, GWTK.gEngine.Renderer.TextureSamplers.linearMipmapNearestClamp);
                var urlCreator = window.URL;
                urlCreator.revokeObjectURL(src);
            };
            img.src = src;
        },
        /**
         * Инициализация шейдеров
         * @method _initShader
         * @private
         */
        _initShader: function() {
            var vs = GWTK.gEngine.ResourceMap.retrieveAsset(this.starSources[0]);
            var fs = GWTK.gEngine.ResourceMap.retrieveAsset(this.starSources[1]);
            var fillSP = GWTK.gEngine.Renderer.ShaderMap.retrieveOrCreate("shaderName_" + this.starSources[0] + this.starSources[1], vs, fs);
            
            var textureRS = new GWTK.gEngine.Renderer.RenderState();
            textureRS.depthTest.enabled = true;
            textureRS.depthTest.func = GWTK.gEngine.Renderer.enumDepthComparisonFunction.LEqual;
            textureRS.facetCulling.enabled = true;
            textureRS.blending.enabled = true;
            textureRS.blending.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            textureRS.blending.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            textureRS.blending.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
            textureRS.blending.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
            
            fillSP.getUniforms()['uSun'].setValue(0);
            fillSP.getUniforms()['uFlagTex0'].setValue(0);
            fillSP.getUniforms()['uAspectRatio'].setValue(1);
            
            this._drawState = new GWTK.gEngine.Renderer.DrawState(textureRS, fillSP, null);
            
        },
        /**
         * Инициализация звезд
         * @method _initStars
         * @private
         * @param STARS {Array} Массив звезд
         * @return {Boolean} `true` - успешная инициализация
         */
        _initStars: function(STARS) {
            var radius = this.EARTH_RADIUS;
            // Сортировка звезд по размеру и цвету
            for (var i = 0, starsItem; (starsItem = STARS[i]); i++) {
                var ra = starsItem[0],
                    dec = starsItem[1],
                    mag = starsItem[2],
                    j,
                    // На этот угол изначально повренуты звезды
                    rect = this._spheric2rect(ra, dec);
                
                if (mag < 0) j = 0;
                else if (mag < 1) j = 1;
                else if (mag < 2) j = 2;
                else if (mag < 3) j = 3;
                else if (mag < 4) j = 4;
                else if (mag < 5) j = 5;
                else j = 6;
                
                if (!this.geometry[j]) {
                    this.geometry[j] = {
                        "vertices": []
                    };
                }
                this.geometry[j].vertices.push([radius * rect[0], radius * rect[1], radius * rect[2]]);
            }
            var settings = [[1, 3], [0.866666, 3], [1, 2], [0.866666, 2], [0.666666, 2], [1, 1], [0.8666666, 1]];
            var starsOptions = { text: 'Звезды', bg: [1.0, 1.0, 1.0], labelcolor: 0x8282b4 };
            var geometry;
            var mesh = new Mesh();
            
            var attr = new VertexAttribute('aVertexPosition', VertexAttributeType.Float, 3);
            attr._values = [];
            mesh.addAttribute(attr);
            attr = new VertexAttribute('aTextureCoord', VertexAttributeType.Float, 2);
            attr._values = [];
            mesh.addAttribute(attr);
            attr = new VertexAttribute('aVertexColor', VertexAttributeType.uByte, 4);
            attr._values = [];
            mesh.addAttribute(attr);
            attr = new VertexAttribute('aVertexSize', VertexAttributeType.Float, 2);
            attr._values = [];
            mesh.addAttribute(attr);
            
            mesh.setFrontFaceWindingOrder(WindingOrder.Counterclockwise);
            mesh.setPrimitiveType(PrimitiveType.Triangles);
            
            // Создание массива звезд
            for (i = 0; (geometry = this.geometry[i]); i++) {
                var m = settings[i];
                var currVertices = geometry.vertices;
                var color = [
                    Math.floor(starsOptions.bg[0] * m[0] * 255),
                    Math.floor(starsOptions.bg[1] * m[0] * 255),
                    Math.floor(starsOptions.bg[2] * m[0] * 255),
                    255
                ];
                var size = [m[1]];
                
                var currVertice;
                // commonArrays.length = 0;
                for (j = 0; (currVertice = currVertices[j]); j++) {
                    this._addToMesh(mesh, currVertice, size, color);
                }
            }
            
            var meshBuffers = GWTK.gEngine.Renderer.GraphicDevice.createUnionMeshBuffers(mesh, this._drawState.shaderProgram.getVertexAttributes(), GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);
            this._starVertexArray = GWTK.gEngine.Renderer.Context.createVertexArrayFromMeshBuffers(meshBuffers);
            this.geometry = null;
        },
        /**
         * Инициализация Солнца
         * @method _initSun
         * @private
         * @return {Boolean} `true` - успешная инициализация
         */
        _initSun: function() {
            //
            // var Y = parseInt(time[0]),
            //     M = parseInt(time[1]),
            //     D = parseInt(time[2]),
            //     h = 3 in time ? parseInt(time[3]) : 0,
            //     m = 4 in time ? parseInt(time[4]) : 0,
            //     s = 5 in time ? parseInt(time[5]) : 0;
            // return 367*Y - parseInt(7*( Y + parseInt((M+9)/12) ) / 4) + parseInt(275*M/9) + D - 730530 + (h*3600 + m*60 + s) / 86400.0;
            
            // var cDate = new Date(2017,11,1),
            //     Y = cDate.getUTCFullYear(),
            //     M = cDate.getUTCMonth(),
            //     D = cDate.getUTCDate(),
            //     d = 367 * Y - parseInt(7 * ( Y + parseInt((M + 9) / 12) ) / 4) + parseInt(275 * M / 9) + D - 730530;
            //
            // var w = 282.9404 + 4.70935E-5 * d,   // arg.perig.
            //     m = 356.0470 + 0.9856002585 * d; // mean anomaly
            // // mean longtitude
            // var L = m-45;
            
            var aDate = new Date(),
                Y = aDate.getUTCFullYear();
            // M = aDate.getUTCMonth(),
            // D = aDate.getUTCDate();
            
            var contrDate = new Date(Y, 5, 22);
            var dDays = (aDate - contrDate) / 86400000;
            var L = Math.PI / 2 * (1 + 4 * dDays / 366);
            
            var lat = 23.5 * Math.PI / 180.0 * (1.25 - 4 * Math.abs(dDays) / 366);
            
            // На этот угол изначально повренуто Солнце относительно звезд
            var coords = [L, lat, -26, "Sun", "Sun"];
            var radius = this.EARTH_RADIUS;
            var rect = this._spheric2rect(coords[0], coords[1]);
            var color = [
                255,
                Math.floor(255 * 0.811765),
                Math.floor(255 * 0.282353),
                255
            ];
            var size = [40];
            var point = vec3.create([radius * rect[0], radius * rect[1], radius * rect[2]]);
            
            var mesh = new Mesh();
            
            var attr = new VertexAttribute('aVertexPosition', VertexAttributeType.Float, 3);
            attr._values = [];
            mesh.addAttribute(attr);
            attr = new VertexAttribute('aTextureCoord', VertexAttributeType.Float, 2);
            attr._values = [];
            mesh.addAttribute(attr);
            attr = new VertexAttribute('aVertexColor', VertexAttributeType.uByte, 4);
            attr._values = [];
            mesh.addAttribute(attr);
            attr = new VertexAttribute('aVertexSize', VertexAttributeType.Float, 2);
            attr._values = [];
            mesh.addAttribute(attr);
            
            mesh.setFrontFaceWindingOrder(WindingOrder.Counterclockwise);
            mesh.setPrimitiveType(PrimitiveType.Triangles);
            
            
            this._addToMesh(mesh, point, size, color);
            
            
            var meshBuffers = GWTK.gEngine.Renderer.GraphicDevice.createUnionMeshBuffers(mesh, this._drawState.shaderProgram.getVertexAttributes(), GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);
            this._sunVertexArray = GWTK.gEngine.Renderer.Context.createVertexArrayFromMeshBuffers(meshBuffers);
            
        },
        /**
         * Добавление вершины в общий массив вершинных и текстурных координат
         * @method _addToMesh
         * @private
         * @param mesh {Mesh} Меш
         * @param currVertice {Array} Координаты [x,y,z]
         * @param size {Array} Размер звезды
         * @param color {Array} Цвет звезды
         */
        _addToMesh: function(mesh, currVertice, size, color) {
            var meshAttributes = mesh.getAttributes();
            for (var i = 0, texturePoint; (texturePoint = this.textureArray[i]); i++) {
                meshAttributes['aVertexPosition']._values.push(currVertice);
                meshAttributes['aTextureCoord']._values.push(texturePoint);
                meshAttributes['aVertexColor']._values.push(color);
                meshAttributes['aVertexSize']._values.push(size);
            }
        },
        /**
         * Преобразование сферических координат (ra,dec) в прямоугольные (x,y,z)
         * @method _spheric2rect
         * @private
         * @param ra {Number} Долгота в радианах
         * @param dec {Number} Широта в радианах
         * @return {Array} Прямоугольные координаты [x,y,z]
         */
        _spheric2rect: function(ra, dec) {
            //TODO: перевести в отдельный класс
            return [Math.cos(ra) * Math.cos(dec),
                Math.sin(ra) * Math.cos(dec),
                Math.sin(dec)];
        },
        /**
         * Рисование
         * @method render
         * @public
         * @param e {object} Объект события отрисовки
         */
        render: function(e) {
            
            if (this._drawState && e.starsVisibility) {
                
                var sceneState = e.sceneState;
                sceneState.resetModelMatrix();
                var mvMatrix = mat4.set(sceneState.getModelViewMatrix(), this.mvMatrix);
                mat4.translate(mvMatrix, sceneState.getCameraPosition(), mvMatrix);
                
                // Синхронизация звезд с текущей датой
                mat4.rotate(mvMatrix, vec3.UNITZ,Math.PI / 2 - sceneState.getLightSource().getRotateAngle(), null);
                mat4.multiply(sceneState.getPerspectiveMatrix(), mvMatrix, mvMatrix);
                
                var shaderProgram = this._drawState.shaderProgram;
                shaderProgram.getUniforms()['uSun'].setValue(0);
                shaderProgram.getUniforms()['uMVMatrix'].setValue(mvMatrix);
                shaderProgram.getUniforms()['uAspectRatio'].setValue(sceneState.getCamera().aspectRatio);
                
                var texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry(this.textureStarId);
                if (texture !== undefined) {
                    GWTK.gEngine.Renderer.Context.setTextureUnit(0, texture);
                    this._drawState.shaderProgram.getUniforms()['uFlagTex0'].setValue(1);
                }else{
                    this._drawState.shaderProgram.getUniforms()['uFlagTex0'].setValue(0);
                }
                this._drawState.vertexArray = this._starVertexArray;
                var context = GWTK.gEngine.Renderer.Context;
                context.draw(PrimitiveType.Triangles, this._drawState, sceneState, null, 0);
                
                // Рисование Солнца
                shaderProgram.getUniforms()['uSun'].setValue(1);
                texture = GWTK.gEngine.Renderer.TextureMap.retrieveEntry(this.textureSunId);
                if (texture !== undefined) {
                    GWTK.gEngine.Renderer.Context.setTextureUnit(0, texture);
                    this._drawState.shaderProgram.getUniforms()['uFlagTex0'].setValue(1);
                }else{
                    this._drawState.shaderProgram.getUniforms()['uFlagTex0'].setValue(0);
                }
                this._drawState.vertexArray = this._sunVertexArray;
                context.draw(PrimitiveType.Triangles, this._drawState, sceneState, null, 0);
            }
        },
        /**
         * Удаление внутренних элементов
         * @method destroy
         * @public
         */
        destroy: function() {
            this._starVertexArray.destroy();
            this._sunVertexArray.destroy();
        }
    };
    
    /**
     * Компонент созвездий
     * @class GWTK.gEngine.Scene.Constellations
     * @constructor GWTK.gEngine.Scene.Constellations
     */
    GWTK.gEngine.Scene.Constellations = function() {
        this.EARTH_RADIUS = 100;
        
        this.constellationSources = ["constellationVS", "constellationFS", "starrysky"];
        
        this.mvMatrix = mat4.create();
        this.lineColor = [102 / 255, 153 / 255, 1.0, 0.3];
        
        GWTK.gEngine.ResourceMap.retrieveAssetsOnload(this.constellationSources, this._init.bind(this));
        
        GWTK.gEngine.Mediator.subscribe('renderBackground', this.render.bind(this));
    };
    GWTK.gEngine.Scene.Constellations.prototype = {
        /**
         * Инициализация
         * @method _init
         * @private
         * @return {Boolean} `true` - успешная инициализация
         */
        _init: function() {
            this._initShader();
            
            var constellations = GWTK.gEngine.ResourceMap.retrieveAsset(this.constellationSources[2]);
            if (constellations) {
                this._initConstellations(JSON.parse(constellations)["constellations"]);
            }
        },
        /**
         * Инициализация шейдеров
         * @method _initShader
         * @private
         */
        _initShader: function() {
            var vs = GWTK.gEngine.ResourceMap.retrieveAsset(this.constellationSources[0]);
            var fs = GWTK.gEngine.ResourceMap.retrieveAsset(this.constellationSources[1]);
            var lineSP = GWTK.gEngine.Renderer.ShaderMap.retrieveOrCreate("shaderName_" + this.constellationSources[0] + this.constellationSources[1], vs, fs);
            
            var lineRS = new GWTK.gEngine.Renderer.RenderState();
            lineRS.depthTest.enabled = true;
            lineRS.depthTest.func = GWTK.gEngine.Renderer.enumDepthComparisonFunction.LEqual;
            lineRS.facetCulling.enabled = true;
            lineRS.blending.enabled = true;
            lineRS.blending.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            lineRS.blending.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            lineRS.blending.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
            lineRS.blending.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
            
            lineSP.getUniforms()['uShapeColor'].setValue(this.lineColor);
            
            this._drawState = new GWTK.gEngine.Renderer.DrawState(lineRS, lineSP, null);
        },
        /**
         * Инициализация созвездий
         * @method _initConstellations
         * @private
         * @param CONSTELLATIONS {Array} Массив описаний созвездий
         * @return {Boolean} `true` - успешная инициализация
         */
        _initConstellations: function(CONSTELLATIONS) {
            var radius = this.EARTH_RADIUS;
            var onePath = [];
            for (var i = 0, constellation; (constellation = CONSTELLATIONS[i]); i++) {
                var paths = constellation["paths"];
                for (var j = 0, path; (path = paths[j]); j++) {
                    for (var k = 1, point; (point = path[k]); k++) {
                        var firstPoint = k === 1 ? this._spheric2rect(path[0][0] * 15, path[0][1]) : onePath[onePath.length - 1];
                        var secondPoint = this._spheric2rect(point[0] * 15, point[1]);
                        
                        vec3.scale(firstPoint, radius);
                        vec3.scale(secondPoint, radius);
                        onePath.push(firstPoint);
                        onePath.push(secondPoint);
                    }
                }
            }
            
            var mesh = new Mesh();
            var attr = new VertexAttribute('aVertexPosition', VertexAttributeType.Float, 3);
            attr._values = onePath;
            mesh.addAttribute(attr);
            mesh.setFrontFaceWindingOrder(WindingOrder.Counterclockwise);
            mesh.setPrimitiveType(PrimitiveType.Lines);
            
            
            var meshBuffers = GWTK.gEngine.Renderer.GraphicDevice.createUnionMeshBuffers(mesh, this._drawState.shaderProgram.getVertexAttributes(), GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw);
            this._drawState.vertexArray = GWTK.gEngine.Renderer.Context.createVertexArrayFromMeshBuffers(meshBuffers);
            
        },
        /**
         * Преобразование сферических координат (ra,dec) в прямоугольные (x,y,z)
         * @method _spheric2rect
         * @private
         * @param ra {Number} Долгота в градусах
         * @param dec {Number} Широта в градусах
         * @return {Array} Прямоугольные координаты [x,y,z]
         */
        _spheric2rect: function(ra, dec) {
            //TODO: перевести в отдельный класс
            ra *= Math.PI / 180;
            dec *= Math.PI / 180;
            return [Math.cos(ra) * Math.cos(dec),
                Math.sin(ra) * Math.cos(dec),
                Math.sin(dec)];
        },
        /**
         * Рисование
         * @method render
         * @public
         * @param e {object} Объект события отрисовки
         */
        render: function(e) {
            if (this._drawState && e.starsVisibility) {
                var sceneState = e.sceneState;
                sceneState.resetModelMatrix();
                var mvMatrix = mat4.set(sceneState.getModelViewMatrix(), this.mvMatrix);
                mat4.translate(mvMatrix, sceneState.getCameraPosition(), mvMatrix);
                
                // Синхронизация звезд с текущей датой
                mat4.rotate(mvMatrix, vec3.UNITZ,Math.PI / 2 - sceneState.getLightSource().getRotateAngle(),  null);
                mat4.multiply(sceneState.getPerspectiveMatrix(), mvMatrix, mvMatrix);
                
                var shaderProgram = this._drawState.shaderProgram;
                shaderProgram.getUniforms()['uMVMatrix'].setValue(mvMatrix);
                shaderProgram.getUniforms()['uShapeColor'].setValue(this.lineColor);
                
                var context = GWTK.gEngine.Renderer.Context;
                context.draw(PrimitiveType.Lines, this._drawState, sceneState, null, 0);
            }
        },
        /**
         * Удаление внутренних элементов
         * @method destroy
         * @public
         */
        destroy: function() {
            this._drawState.vertexArray.destroy()
        }
    };
}