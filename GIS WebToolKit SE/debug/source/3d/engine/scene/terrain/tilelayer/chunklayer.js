/****************************************** Тазин В.О. 10/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Слой тайлов поверхности                    *
 *                                                                  *
 *******************************************************************/
"use strict";
import TileIdentifier from '~/3d/engine/scene/terrain/tileidentifier';
import OrientedBoundingBox3D from '~/3d/engine/core/boundingvolumes/orientedbbox3d';
import { vec3 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс слоя тайлов поверхности
     * @class GWTK.gEngine.Scene.ChunkLayer
     * @constructor GWTK.gEngine.Scene.ChunkLayer
     * @param mapState {GWTK.MapState} Объект состояния карты
     * @param textureSource {GWTK.gEngine.Scene.ChunkTextureSource} Источник текстур
     */
    GWTK.gEngine.Scene.ChunkLayer = function(mapState, textureSource) {
        this._id = Date.now() * Math.random();
        this.isReady = false;
        
        
        this._heightSource = GWTK.heightSourceManager.getHeightSource(mapState.getMapTilematrixset());
        this._textureSource = textureSource;
        
        this._maxZoom = mapState.getMapMaximumTileLevel();
        this._minZoom = mapState.getMapMinimumTileLevel();
        
        if (this._maxZoom <= 2) {
            this._minZoom = 0;
        }
        
        if (this._heightSource._levelAccuracyLimit === null) {
            this._heightSource._levelAccuracyLimit = this._maxZoom;
        }
        
        this._targetZoom = mapState.getMapTileLevel() - 1;
        if (this._targetZoom < this._minZoom) {
            this._targetZoom = null;
        }
        if (this._targetZoom > this._maxZoom) {
            this._targetZoom = this._maxZoom;
        }
        
        this.kColorVS = "chunkVS";
        this.kColorFS = "chunkFS";
        this.kWaveTexture = '_WAVE_TEXTURE';
        
        this._isActive = true;
        GWTK.gEngine.ResourceMap.retrieveAssetsOnload([this.kColorVS, this.kColorFS], this._init.bind(this));
    };
    
    GWTK.gEngine.Scene.ChunkLayer.prototype = {
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mSupArray
         */
        mSupArray: [],
        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function() {
            if (this._isActive) {
                this._initFill();
                // this._initLine();
                this._initHeaderNode();
                this.isReady = true;
                GWTK.gEngine.Mediator.subscribe('preRenderScene', this._requestNodes.bind(this));
                GWTK.gEngine.Mediator.subscribe('surfaceDepthScene', this._renderDepth.bind(this));
                GWTK.gEngine.Mediator.subscribe('renderGeometry', this._render.bind(this));
                GWTK.gEngine.Mediator.subscribe('renderTransparent', this._render.bind(this));
            }
        },
        /**
         * Получить проекцию
         * @method getProjection
         * @public
         * @return {GWTK.gEngine.Core.Projection} Проекция
         */
        getProjection: function() {
            return this._heightSource.getProjection();
        },
        /**
         * Инициализация заполняющего шейдера
         * @method _initFill
         * @private
         */
        _initFill: function() {
            var fillRS = new GWTK.gEngine.Renderer.RenderState();
            fillRS.depthTest.enabled = true;
            fillRS.depthTest.func = GWTK.gEngine.Renderer.enumDepthComparisonFunction.Less;
            fillRS.facetCulling.enabled = true;
            fillRS.blending.enabled = true;
            fillRS.blending.srcRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            fillRS.blending.srcAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.SrcAlpha;
            fillRS.blending.dstRGBFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
            fillRS.blending.dstAlphaFactor = GWTK.gEngine.Renderer.enumSourceBlendingFactor.OneMinusSrcAlpha;
            
            var vs = GWTK.gEngine.ResourceMap.retrieveAsset(this.kColorVS);
            var fs = GWTK.gEngine.ResourceMap.retrieveAsset(this.kColorFS);
            var fillSP = GWTK.gEngine.Renderer.ShaderMap.retrieveOrCreate("shaderName_" + this.kColorVS + this.kColorFS, vs, fs);
            
            var uniforms = fillSP.getUniforms();
            
            this._fillLogarithmicDepth = uniforms["u_logarithmicDepth"];
            this._fillLogarithmicDepth.setValue(0);
            var emptyArray = this.mSupArray;
            emptyArray.length = 0;
            uniforms['uWaterColors[0].color'].setValue(emptyArray);
            uniforms['uWaterColorsCount'].setValue(0);
            emptyArray[0] = 0.5;
            emptyArray[1] = 0.5;
            emptyArray[2] = 0.5;
            emptyArray[3] = 1;
            uniforms['uShapeColor'].setValue(emptyArray);
            uniforms['uFlagTex0'].setValue(0);
            
            
            this._lightInfoUniform = fillSP.getLightInfoUniform();
            
            this._drawStateFill = new GWTK.gEngine.Renderer.DrawState(fillRS, fillSP, null);
        },
        
        /**
         * Инициализация головного узла
         * @method _initHeaderNode
         * @private
         */
        _initHeaderNode: function() {
            var identifier = new TileIdentifier(this._heightSource.getProjection().getMinimumTileLevel(), 0, 0);
            this._headNode = new GWTK.gEngine.Scene.ChunkNode(identifier, this);
            this._headNode.setRenderable(new GWTK.gEngine.Scene.Chunk());
            
            var obb = new OrientedBoundingBox3D();
            this._headNode.setOBB(obb);
            this.createChildren(this._headNode);
        },
        /**
         * Рисование компонента
         * @method _render
         * @private
         * @param e {object} Событие отрисовки
         */
        _requestNodes: function(e) {
            if (!this.isReady || !this._headNode || !this.checkRasterVisibility()) {
                return;
            }
            var sceneState = e.sceneState;
            this._headNode.request(sceneState, e.thau);
            
        },
        /**
         * Рисование компонента
         * @method _render
         * @private
         * @param e {object} Событие отрисовки
         */
        _render: function(e) {
            if (!this.isReady || !this._headNode || !this.checkRasterVisibility()) {
                return;
            }
            var opacity = this._textureSource.getOpacity();
            if (e.transparentMode === true && opacity === 1 || opacity < 1 && !e.transparentMode) {
                return;
            }
            var sceneState = e.sceneState;
            this._clean(sceneState);
            var uniforms = this._drawStateFill.shaderProgram.getUniforms();
            if (e.logarithmicDepth) {
                this._fillLogarithmicDepth.setValue(1);
                uniforms['uFcoef'].setValue(sceneState.uFcoef);
            }else{
                this._fillLogarithmicDepth.setValue(0);
            }
            var layer = this._textureSource.getTopLayer();
            if (layer !== null) {
                this.setWaterColors(layer.getWaterColors());
            }
            
            this._drawStateFill.renderState.blending.enabled = true;
            
            uniforms['uDepthMode'].setValue(false);
            uniforms['u_time'].setValue(e.currentTime);
            var texture = this._getWaveTexture();
            if (texture) {
                GWTK.gEngine.Renderer.Context.setTextureUnit(1, texture);
                this._headNode.render(sceneState, e.thau, this._drawStateFill);
            }
        },
        
        /**
         * Получить текстуру волн
         * @method _getWaveTexture
         * @private
         * @return {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Текстура
         */
        _getWaveTexture: function() {
            var texture = null;
            if (GWTK.gEngine.ResourceMap.isAssetActuallyLoaded(this.kWaveTexture)) {
                var textureParams = GWTK.gEngine.ResourceMap.retrieveAsset(this.kWaveTexture);
                texture = GWTK.gEngine.Renderer.TextureMap.retrieveOrCreate(this.kWaveTexture, textureParams.description, textureParams.img, textureParams.locked, textureParams.sampler);
            }
            return texture;
        },
        
        /**
         * Обновить состояние компонента
         * @method _clean
         * @private
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         */
        _clean: function(sceneState) {
            var lightSource = sceneState.getLightSource();
            this._lightInfoUniform.position.setValue(lightSource.getPosition());
            var lightColor = lightSource.getLightColor();
            this._lightInfoUniform.ambient.setValue(lightColor.ambient);
            this._lightInfoUniform.diffuse.setValue(lightColor.diffuse);
            this._lightInfoUniform.specular && this._lightInfoUniform.specular.setValue(lightColor.specular);
        },
        /**
         * Заполнение буфера глубины
         * @method _renderDepth
         * @private
         * @param e {object} Событие отрисовки
         */
        _renderDepth: function(e) {
            if (!this.isReady || !this._headNode || !this.checkRasterVisibility()) {
                return;
            }
            var sceneState = e.sceneState;
            var uniforms = this._drawStateFill.shaderProgram.getUniforms();
            if (e.logarithmicDepth) {
                this._fillLogarithmicDepth.setValue(1);
                uniforms['uFcoef'].setValue(sceneState.uFcoef);
            }else{
                this._fillLogarithmicDepth.setValue(0);
            }
            
            this._drawStateFill.renderState.blending.enabled = false;
            
            uniforms['uDepthMode'].setValue(true);
            this._headNode.render(sceneState, e.thau, this._drawStateFill);
        },
        
        /**
         * Создать меш для тайла
         * @method createMesh
         * @public
         * @param chunkNode {GWTK.gEngine.Scene.ChunkNode} Тайл
         */
        createMesh: function(chunkNode) {
            this._heightSource.setMesh(chunkNode);
        },
        /**
         * Создать текстуру для тайла
         * @method createTexture
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @param renderable {GWTK.gEngine.Scene.Chunk} Объект рисования
         */
        createTexture: function(identifier, renderable) {
            this._textureSource.setTileTexture(identifier, renderable);
        },
        /**
         * Проверить, имеется ли активный источник тайлов
         * @method checkRasterVisibility
         * @public
         * @return {boolean} Имеется активный источник тайлов
         */
        checkRasterVisibility: function() {
            return this._textureSource.checkRasterVisibility();
        },
        /**
         * Проверка на отключение загрузочного экрана
         * @method checkLoadingScreen
         * @public
         * @param level {number} Уровень отрисовываемого тайла
         */
        checkLoadingScreen: function(level) {
            if (this._targetZoom !== null && level === this._targetZoom) {
                this._targetZoom = null;
                GWTK.gEngine.Mediator.publish('clearLoadingScreen');
            }
        },
        /**
         * Создать дочерние элементы узла
         * @method createChildren
         * @public
         * @param parent {GWTK.gEngine.Scene.ChunkNode} Родительский узел
         */
        createChildren: function(parent) {
            var level = parent.getLevel() + 1;
            if (level <= this._maxZoom) {
                var parentCol = parent.getCol();
                var parentRow = parent.getRow();
                var projection = this._heightSource.getProjection();
                var maxCol = projection.getColCount(level);
                var maxRow = projection.getRowCount(level);
                var startCol = parentCol * 2;
                var startRow = parentRow * 2;
                var endCol = Math.min(startCol + 1, maxCol);
                var endRow = Math.min(startRow + 1, maxRow);
                
                for (var col = startCol; col <= endCol; col++) {
                    for (var row = startRow; row <= endRow; row++) {
                        var identifier = new TileIdentifier(level, col, row);
                        var chunkNode = new GWTK.gEngine.Scene.ChunkNode(identifier, this);
                        chunkNode.setRenderable(new GWTK.gEngine.Scene.Chunk());
                        chunkNode.parent = parent;
                        chunkNode.setOBB(this._createTileBbox(identifier));
                        parent.addChild(chunkNode);
                    }
                }
            }
        },
        /**
         * Создать ограничивающий объем тайла
         * @method _createTileBbox
         * @private
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @return {OrientedBoundingBox3D} Ограничивающий ориентированный параллелепипед
         */
        _createTileBbox: function(identifier) {
            var projection = this._heightSource.getProjection();
            var globeShape = projection.getGlobeShape();
            
            var pointArrayYX = [[], [], [], [], [], [], []];
            var borderPointArray = [[], [], [], [], [], [], [], [], [], [], [], []];
            
            var zVec = [];
            var xVec = [];
            var axis = {};
            
            var yxCenter = projection.getCenterByIdentifier(identifier, pointArrayYX[0]);
            
            var halfWidthMtr = 0.5 * projection.getTileWidthMtr(identifier.getLevel());
            var halfHeightMtr = 0.5 * projection.getTileHeightMtr(identifier.getLevel());
            
            var level = identifier.getLevel();
            var currIdentifier = identifier;
            var hTile;
            while (level > 0 && !hTile) {
                hTile = this._heightSource._heightCache.getHeightTileByIdentifier(currIdentifier);
                if (!hTile) {
                    currIdentifier = projection.getParentByIdentifier(currIdentifier);
                }
                level--;
            }
            if (hTile) {
                var minHeight = hTile._minHeight;
                var maxHeight = hTile._maxHeight;
                if (minHeight === maxHeight) {
                    maxHeight += 1;
                }
            }else{
                minHeight = 0;
                maxHeight = 1;
            }
            
            
            pointArrayYX[1][0] = yxCenter[0] + halfHeightMtr;
            pointArrayYX[1][1] = yxCenter[1] - halfWidthMtr;
            
            pointArrayYX[2][0] = yxCenter[0] + halfHeightMtr;
            pointArrayYX[2][1] = yxCenter[1] + halfWidthMtr;
            
            pointArrayYX[3][0] = yxCenter[0] - halfHeightMtr;
            pointArrayYX[3][1] = yxCenter[1] - halfWidthMtr;
            
            pointArrayYX[4][0] = yxCenter[0] - halfHeightMtr;
            pointArrayYX[4][1] = yxCenter[1] + halfWidthMtr;
            
            pointArrayYX[5][0] = yxCenter[0] + halfHeightMtr;
            pointArrayYX[5][1] = yxCenter[1];
            
            pointArrayYX[6][0] = yxCenter[0] - halfHeightMtr;
            pointArrayYX[6][1] = yxCenter[1];
            
            for (var i = 0; i < pointArrayYX.length; i++) {
                var curPointYX = pointArrayYX[i];
                globeShape.toVector3d(projection.xy2geo(curPointYX[0], curPointYX[1], minHeight), borderPointArray[i]);
                var indexMaxHeight = i + pointArrayYX.length;
                globeShape.toVector3d(projection.xy2geo(curPointYX[0], curPointYX[1], maxHeight), borderPointArray[indexMaxHeight]);
            }
            
            // вычисляем направление осей до определения полюсов
            var bottomLeftPointMinVec3 = borderPointArray[3];
            var bottomRightPointMinVec3 = borderPointArray[4];
            axis.xAxis = vec3.normalize(vec3.sub(bottomRightPointMinVec3, bottomLeftPointMinVec3, xVec));
            
            vec3.set(vec3.ZERO, zVec);
            for (var ii = 0; ii < pointArrayYX.length; ii++) {
                zVec = vec3.add(zVec, borderPointArray[ii]);
            }
            var count = borderPointArray.length;
            vec3.scale(zVec, 1 / count);
            axis.zAxis = vec3.normalize(zVec);
            const radii = projection.getGlobeShape().getRadius();
            if (identifier.getY() === 0) {
                var topLeftPointMinVec3 = borderPointArray[1];
                var topRightPointMinVec3 = borderPointArray[2];
                var topLeftPointMaxVec3 = borderPointArray[1 + pointArrayYX.length];
                var topRightPointMaxVec3 = borderPointArray[2 + pointArrayYX.length];
                topLeftPointMinVec3[0] = 0;
                topLeftPointMinVec3[1] = 0;
                topLeftPointMinVec3[2] = radii[2];
                vec3.set(topLeftPointMinVec3, topRightPointMinVec3);
                vec3.set(topLeftPointMinVec3, topLeftPointMaxVec3);
                vec3.set(topLeftPointMinVec3, topRightPointMaxVec3);
            }
            if (identifier.getY() === (projection.getRowCount(identifier.getLevel()) - 1)) {
                var bottomLeftPointMaxVec3 = borderPointArray[3 + pointArrayYX.length];
                var bottomRightPointMaxVec3 = borderPointArray[4 + pointArrayYX.length];
                bottomLeftPointMinVec3[0] = 0;
                bottomLeftPointMinVec3[1] = 0;
                bottomLeftPointMinVec3[2] = -radii[2];
                vec3.set(bottomLeftPointMinVec3, bottomRightPointMinVec3);
                vec3.set(bottomLeftPointMinVec3, bottomLeftPointMaxVec3);
                vec3.set(bottomLeftPointMinVec3, bottomRightPointMaxVec3);
            }
            
            var obb = new OrientedBoundingBox3D(axis);
            obb.fitPoints(borderPointArray);
            return obb;
        },
        
        
        /**
         * Загрузить цвета водной поверхности верхнего слоя
         * @method setWaterColors
         * @public
         * @param colorsArray {array} Массив цветов водной поверхности
         */
        setWaterColors: function(colorsArray) {
            if (Array.isArray(colorsArray) && colorsArray.length > 0) {
                for (var i = 0; i < colorsArray.length; i++) {
                    this._drawStateFill.shaderProgram.getUniforms()['uWaterColors[' + i + '].color'].setValue(colorsArray[i]);
                }
                this._drawStateFill.shaderProgram.getUniforms()['uWaterColorsCount'].setValue(colorsArray.length);
            }else{
                this._drawStateFill.shaderProgram.getUniforms()['uWaterColorsCount'].setValue(0);
            }
        },
        /**
         * Удаление слоя
         * @method destroy
         * @public
         */
        destroy: function() {
            this._heightSource = null;
            this._textureSource.destroy();
            this._textureSource = null;
            if (this._headNode) {
                this._headNode.destroy();
                this._headNode = null;
            }
            GWTK.gEngine.Scene.Chunk.prototype.mCameraPosition.length = 0;
            this._isActive = false;
        }
    }
}
