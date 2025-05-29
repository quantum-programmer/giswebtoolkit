/****************************************** Тазин В.О. 20/01/21  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                              Слой 3D тайлов                      *
 *                                                                  *
 *******************************************************************/
"use strict";
import Trigonometry from '~/3d/engine/core/trigonometry';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import TileIdentifier from '~/3d/engine/scene/terrain/tileidentifier';
import OrientedBoundingBox3D from '~/3d/engine/core/boundingvolumes/orientedbbox3d';
import { vec3 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс слоя 3D тайлов
     * @class GWTK.gEngine.Scene.Tile3dLayer
     * @constructor GWTK.gEngine.Scene.Tile3dLayer
     * @param mapState {GWTK.MapState} Объект состояния карты
     * @param tileSource {GWTK.gEngine.Scene.Tile3dSource} Источник тайлов
     * @param componentUI {GWTK.gEngine.Scene.Tiles3DcomponentUI} Интерфейс слоя
     */
    GWTK.gEngine.Scene.Tile3dLayer = function(mapState, tileSource, componentUI) {
        this._id = Date.now() * Math.random();
        
        this._tileSource = tileSource;
        
        if (!this._tileSource.hidden) {
            this._show();
        }else{
            this._hide();
        }
        this._opacity = 1.;
        this._componentUI = componentUI;
        this._isActive = true;
        this._currentZoom = mapState.getMapTileLevel();
        this._tileSource.onMetadataLoad(this._init.bind(this));
        this.mGoToPoint = new Geodetic3D(0, 0, 0);
    };
    GWTK.gEngine.Scene.Tile3dLayer.prototype = {
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mPointArrayYX
         */
        mPointArrayYX: [[], [], [], [], [], [], []],
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mBorderPointArray
         */
        mBorderPointArray: [[], [], [], [], [], [], [], [], [], [], [], [], [], []],
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mzVec
         */
        mzVec: [],
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mxVec
         */
        mxVec: [],
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mAxis
         */
        mAxis: {},
        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function() {
            if (this._isActive) {
                this._targetZoom = this._currentZoom - 1;
                if (this._targetZoom < this._tileSource._minZoom) {
                    this._targetZoom = null;
                }
                
                if (this._targetZoom > this._tileSource._maxZoom) {
                    this._targetZoom = this._tileSource._maxZoom;
                }
                
                var projection = this._tileSource.getProjection();
                
                var identifier = new TileIdentifier(projection.getMinimumTileLevel(), 0, 0);
                this._headNode = new GWTK.gEngine.Scene.Tile3dNode(identifier, this);
                
                var borderPointList = [];
                
                var radii = projection.getGlobeShape().getRadius();
                
                var oX = [radii[0] * 2, 0, 0];
                var oXn = [-radii[0] * 2, 0, 0];
                var oY = [0, radii[1] * 2, 0];
                var oYn = [0, -radii[1] * 2, 0];
                var oZ = [0, 0, radii[2] * 2];
                var oZn = [0, 0, -radii[2] * 2];
                
                borderPointList.push(oX, oXn, oY, oYn, oZ, oZn);
                
                var obb = new OrientedBoundingBox3D();
                obb.fitPoints(borderPointList);
                // obb.setCenter([radii[0], 0, 0]);
                // obb.setRadius(radii[0] * 2);
                this._headNode.setOBB(obb);
                
                this.createChildren(this._headNode);
                
                var mediator = GWTK.gEngine.Mediator;
                
                
                mediator.subscribe('depthScene', this._renderDepth.bind(this));
                
                mediator.subscribe('renderAlphaTest', this._render.bind(this));
                
                
                mediator.subscribe('layercommand', this.goToModel.bind(this));
                
                mediator.subscribe('changeLayerOpacity', this._updateLayersOpacity.bind(this));
                mediator.subscribe('changeLayerVisibility', this.setVisibility.bind(this));
            }
        },
        /**
         * Получить максимальный уровень отображения
         * @method getMaxZoom
         * @public
         * @return {number} Максимальный уровень отображения
         */
        getMaxZoom: function() {
            return this._tileSource._maxZoom;
        },
        /**
         * Получить проекцию
         * @method getProjection
         * @public
         * @return {GWTK.gEngine.Core.Projection} Проекция
         */
        getProjection: function() {
            return this._tileSource.getProjection();
        },
        /**
         * Получить идентификатор модели
         * @method getModelId
         * @public
         * @return {string} Идентификатор модели
         */
        getModelId: function() {
            return this._tileSource.getId();
        },
        /**
         * Получить признак того, что слой опубликован автоматически,
         * а не добавлен администратором
         * @method isNotPublished
         * @public
         * @return {boolean} Слой опубликован автоматически
         */
        isPublished: function () {
            return this._tileSource.getPublished();
        },
        /**
         * Задать видимость слоя
         * @method setVisibility
         * @public
         * @param e {Object} Параметры события
         */
        setVisibility: function(e) {
            if (this._tileSource._id === e.id) {
                if (e.visible) {
                    this._show();
                }else{
                    this._hide();
                }
            }
        },
        /**
         * Получить видимость слоя
         * @method getVisibility
         * @public
         * @return {boolean} Видимость слоя
         */
        getVisibility: function() {
            return this.visible;
        },
        /**
         * Отобразить слой
         * @method _show
         * @private
         */
        _show: function() {
            this.visible = true;
        },
        /**
         * Скрыть слой
         * @method _hide
         * @private
         */
        _hide: function() {
            this.visible = false;
        },
        /**
         * Перейти к модели
         * @method goToModel
         * @public
         */
        goToModel: function(e) {
            if (e && e.maplayer && e.maplayer.act === 'gotoModel') {
                if (e.maplayer.id === this._tileSource._id) {
                    if (this._tileSource._metadata) {
                        var dframe = this._tileSource._metadata.DFRAME;
                        if (Array.isArray(dframe)) {
                            var defaultPoint = [];
                            var b = 0.5 * (dframe[0] + dframe[2]);
                            
                            var l = 0.5 * (dframe[1] + dframe[3]);
                            if (dframe[1] > dframe[3]) {
                                l += 180;
                            }
                            
                            this.mGoToPoint.setLongitude(Trigonometry.toRadians(l));
                            this.mGoToPoint.setLatitude(Trigonometry.toRadians(b));
                            var t = this._tileSource.getProjection().geo2xy(this.mGoToPoint);
                            
                            if (!isNaN(t[0]) && !isNaN(t[1])) {
                                defaultPoint[0] = t[1];
                                defaultPoint[1] = t[0];
                            }else{
                                //TODO: переходный вариант с прямоугольными координатами
                                defaultPoint[0] = dframe[0];
                                defaultPoint[1] = dframe[1]
                            }
                            GWTK.gEngine.Mediator.publish('moveToPoint', { point: defaultPoint });
                        }
                    }
                }
            }
        },
        /**
         * Рисование компонента
         * @method _render
         * @private
         * @param e {object} Событие отрисовки
         */
        _render: function(e) {
            if (this.visible && this._headNode) {
                var opacity = this._opacity;
                // if (e.transparentMode === true && opacity == 1 || opacity < 1 && !e.transparentMode) {
                //     return;
                // }
                this._headNode.requestChunk();
                var distanceNear = this._headNode.getDistanceFromNearPlane(e.sceneState);
                if (distanceNear !== 0) {
                    this._headNode.render(e, distanceNear, false, opacity);
                }
            }
        },
        /**
         * Заполнение буфера глубины
         * @method _renderDepth
         * @private
         * @param e {object} Событие отрисовки
         */
        _renderDepth: function(e) {
            if (this.visible && this._headNode) {
                this._headNode.requestChunk();
                var distanceNear = this._headNode.getDistanceFromNearPlane(e.sceneState);
                if (distanceNear !== 0) {
                    this._headNode.render(e, distanceNear, true);
                }
            }
        },
        
        /**
         * Создать меш для тайла
         * @method createMesh
         * @public
         * @param node {GWTK.gEngine.Scene.Tile3dNode} Тайл
         */
        createMesh: function(node) {
            this._tileSource.createNodeMesh(node);
        },
        /**
         * Загрузить список текстур тайла
         * @method loadTextures
         * @public
         * @param textureIdentifierList {array} Массив идентификаторов текстур
         */
        loadTextures: function(textureIdentifierList) {
            this._tileSource.loadModelTextures(textureIdentifierList);
        },
        /**
         * Загрузить список материалов тайла
         * @method loadTextures
         * @public
         * @param materialIdentifierList {array} Массив идентификаторов материалов
         */
        loadMaterials: function(materialIdentifierList) {
            this._tileSource.loadModelMaterials(materialIdentifierList);
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
         * @param parent {GWTK.gEngine.Scene.Tile3dNode} Родительский узел
         */
        createChildren: function(parent) {
            var level = parent.getLevel() + 1;
            var parentCol = parent.getCol();
            var parentRow = parent.getRow();
            
            for (var i = 0; i < 2; i++) {
                var col = parentCol * 2 + i;
                
                for (var j = 0; j < 2; j++) {
                    var row = parentRow * 2 + j;
                    
                    var identifier = new TileIdentifier(level, col, row);
                    var chunkNode = new GWTK.gEngine.Scene.Tile3dNode(identifier, this);
                    chunkNode.setOBB(this._createTileBbox(identifier));
                    chunkNode.parent = parent;
                    parent.addChild(chunkNode);
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
            var projection = this._tileSource.getProjection();
            var globeShape = projection.getGlobeShape();
            
            var pointArrayYX = this.mPointArrayYX;
            var borderPointArray = this.mBorderPointArray;
            
            var zVec = this.mzVec;
            var xVec = this.mxVec;
            var axis = this.mAxis;
            
            var yxCenter = projection.getCenterByIdentifier(identifier, pointArrayYX[0]);
            
            var halfWidthMtr = 0.5 * projection.getTileWidthMtr(identifier.getLevel());
            var halfHeightMtr = 0.5 * projection.getTileHeightMtr(identifier.getLevel());
            
            var minHeight = this._tileSource._metadata.MinHeight;
            var maxHeight = this._tileSource._metadata.MaxHeight;
            
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
            axis.xAxis = vec3.normalize(vec3.sub(bottomRightPointMinVec3, bottomLeftPointMinVec3, xVec), []);
            
            vec3.set(vec3.ZERO, zVec);
            for (var ii = 0; ii < borderPointArray.length; ii++) {
                zVec = vec3.add(zVec, borderPointArray[ii]);
            }
            var count = borderPointArray.length;
            vec3.scale(zVec, 1 / count);
            axis.zAxis = vec3.normalize(zVec, []);
            
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
         * Проверить видимость модели
         * @method checkModelVisibility
         * @public
         * //@param modelId {string} Идентификатор модели в базе данных 3D тайлов
         * @return {boolean} Флаг видимости модели
         */
        checkModelVisibility: function() {
            return true;//TODO: видимость модели базы данных
        },
        /**
         * Обработчик для обновления прозрачности слоев
         * @method _updateLayersOpacity
         * @public
         * @param event {Object} Событие
         */
        _updateLayersOpacity: function(event) {
            // Видимость для 3d слоя
            var layerId = event.id;
            var opacity = event.value;
            if (this._tileSource._id === layerId) {
                this._opacity = opacity;
            }
            
        },
        /**
         * Удаление слоя
         * @method destroy
         * @public
         */
        destroy: function() {
            this._componentUI.destroy();
            this._componentUI = null;
            this._tileSource.destroy();
            this._tileSource = null;
            if (this._headNode) {
                this._headNode.destroy();
                this._headNode = null;
            }
            GWTK.gEngine.Scene.Tile3dNodeModel.prototype.mCurrentTextureList.length = 0;
            GWTK.gEngine.Scene.Tile3dNodeModel.prototype.mCurrentMaterialList.length = 0;
            this._isActive = false;
        }
    }
}
