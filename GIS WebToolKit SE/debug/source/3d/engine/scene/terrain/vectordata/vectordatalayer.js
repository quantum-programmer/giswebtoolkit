/******************************************** Тазин В. 07/02/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Компонент слоя тайлов векторных данных                *
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
     * Класс слоя тайлов векторных данных
     * @class GWTK.gEngine.Scene.VectorDataLayer
     * @constructor GWTK.gEngine.Scene.VectorDataLayer
     * @param mapState {GWTK.MapState} Объект состояния карты
     * @param objectSource {GWTK.gEngine.Scene.VectorDataWFSSource} Источник векторных данных
     */
    GWTK.gEngine.Scene.VectorDataLayer = function(mapState, objectSource) {
        this._id = Date.now() * Math.random();
        this._objectSource = objectSource;
        this.visible = !this._objectSource.hidden;
        this._targetZoom = mapState.getMapTileLevel() - 1;
        if (this._targetZoom < objectSource._minZoom) {
            this._targetZoom = null;
        }
        
        if (this._targetZoom > objectSource._maxZoom) {
            this._targetZoom = objectSource._maxZoom;
        }
        
        
        this._opacity = 1.;
        this._isActive = true;
        this._objectSource.onMetadataLoad(this._init.bind(this));
    };
    GWTK.gEngine.Scene.VectorDataLayer.prototype = {
        
        mAxis: {},
        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function() {
            if (this._isActive) {
                var identifier = new TileIdentifier(this._objectSource.getProjection().getMinimumTileLevel(), 0, 0);
                this._headNode = new GWTK.gEngine.Scene.VectorDataNode(identifier, this);
                //ставится радиус экватора
                var obb = new OrientedBoundingBox3D();
                // obb.setCenter([1,0,0]);
                var radii = this.getProjection().getGlobeShape().getRadius();
                var oX = [radii[0] * 2, 0, 0];
                var oXn = [-radii[0] * 2, 0, 0];
                var oY = [0, radii[1] * 2, 0];
                var oYn = [0, -radii[1] * 2, 0];
                var oZ = [0, 0, radii[2] * 2 + 100];
                var oZn = [0, 0, -radii[2] * 2];
                obb.fitPoints([oX, oXn, oY, oYn, oZ, oZn]);
                this._headNode.setOBB(obb);
                this.createChildren(this._headNode);
                
                var mediator = GWTK.gEngine.Mediator;
                mediator.subscribe('depthScene', this._renderDepth.bind(this));
                mediator.subscribe('renderGeometry', this._render.bind(this));
                mediator.subscribe('renderAlphaTest', this._render.bind(this));
                // mediator.subscribe('layercommand', this.goToModel.bind(this));
                mediator.subscribe('changeLayerOpacity', this._updateLayersOpacity.bind(this));
                mediator.subscribe('changeLayerVisibility', this.setVisibility.bind(this));
            }
        },
        /**
         * Задать видимость слоя
         * @method setVisibility
         * @public
         * @param e {Object} Параметры события
         */
        setVisibility: function(e) {
            if (this._objectSource._id == e.id) {
                if (e.visible) {
                    this._show();
                }else{
                    this._hide();
                }
            }
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
         * Рисование компонента
         * @method _render
         * @private
         * @param e {object} Событие отрисовки
         */
        _render: function(e) {
            if (this.visible && this._headNode) {
                var opacity = this._opacity;
                if (e.transparentMode === true && opacity == 1 || opacity < 1 && !e.transparentMode) {
                    return;
                }
                
                var sceneState = e.sceneState;
                var distanceLimits = this._objectSource.getDistanceLimits();
                this._headNode.requestChunk();
                var distanceNear = this._headNode.getDistanceFromNearPlane(sceneState);
                if (distanceNear !== 0 && (distanceNear < 0 || distanceLimits.contains(distanceNear))) {
                    this._headNode.render(e, distanceNear, distanceLimits, false);
                }
            }
        },
        
        /**
         * Получить проекцию источника
         * @method getProjection
         * @public
         * @return {GWTK.gEngine.Core.Projection} Проекция источника
         */
        getProjection: function() {
            return this._objectSource.getProjection();
        },
        /**
         * Заполнение буфера глубины
         * @method _renderDepth
         * @private
         * @param e {object} Событие отрисовки
         */
        _renderDepth: function(e) {
            if (this.visible && this._headNode) {
                var sceneState = e.sceneState;
                var distanceLimits = this._objectSource.getDistanceLimits();
                this._headNode.requestChunk();
                var distanceNear = this._headNode.getDistanceFromNearPlane(sceneState);
                if (distanceNear !== 0 && (distanceNear < 0 || distanceLimits.contains(distanceNear))) {
                    this._headNode.render(e, distanceNear, distanceLimits, true);
                }
            }
        },
        /**
         * Создать меш для тайла
         * @method createMesh
         * @public
         * @param node {GWTK.gEngine.Scene.VectorDataNode} Тайл
         */
        createMesh: function(node) {
            this._objectSource.setMesh(node);
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
         * @param parent {GWTK.gEngine.Scene.VectorDataNode} Родительский узел
         */
        createChildren: function(parent) {
            var projection = this._objectSource.getProjection();
            var globeShape = projection.getGlobeShape();
            
            var curCenterVec3;
            var yxCenter = [];
            var topLeftPoint = [];
            var topLeftPointVec3;
            var topRightPoint = [];
            var topRightPointVec3;
            var bottomLeftPoint = [];
            var bottomLeftPointVec3;
            var bottomRightPoint = [];
            var bottomRightPointVec3;
            var center = [];
            var xVec = [];
            var zVec = [];
            var axis = this.mAxis;
            
            var borderPointList = [];
            
            var level = parent.getLevel() + 1;
            var parentCenter = parent.getCenter();
            var parentCol = parent.getCol();
            var parentRow = parent.getRow();
            
            // var colCount = projection.getColCount(level);
            // var rowCount = projection.getRowCount(level);
            
            var parentGeodetic = globeShape.toGeodetic3d(parentCenter);
            
            // var topLeft = projection.getTopLeft();
            var parentCenterYX = projection.geo2xy(parentGeodetic);
            var halfWidthMtr = 0.5 * projection.getTileWidthMtr(level);
            var halfHeightMtr = 0.5 * projection.getTileHeightMtr(level);
            
            for (var i = 0; i < 2; i++) {
                var col = parentCol * 2 + i;
                var kCol = i % 2 === 0 ? 1 : -1;
                for (var j = 0; j < 2; j++) {
                    var row = parentRow * 2 + j;
                    
                    var identifier = new TileIdentifier(level, col, row);
                    
                    if (this._objectSource.checkTileFrame(identifier) !== true) {
                        continue;
                    }
                    
                    var kRow = j % 2 === 0 ? 1 : -1;
                    borderPointList.length = 0;
                    
                    yxCenter[0] = parentCenterYX[0] + kRow * halfHeightMtr;
                    yxCenter[1] = parentCenterYX[1] - kCol * halfWidthMtr;
                    
                    topLeftPoint[0] = yxCenter[0] + halfHeightMtr;
                    topLeftPoint[1] = yxCenter[1] - halfWidthMtr;
                    
                    topRightPoint[0] = yxCenter[0] + halfHeightMtr;
                    topRightPoint[1] = yxCenter[1] + halfWidthMtr;
                    
                    bottomLeftPoint[0] = yxCenter[0] - halfHeightMtr;
                    bottomLeftPoint[1] = yxCenter[1] - halfWidthMtr;
                    
                    bottomRightPoint[0] = yxCenter[0] - halfHeightMtr;
                    bottomRightPoint[1] = yxCenter[1] + halfWidthMtr;
                    
                    curCenterVec3 = globeShape.toVector3d(projection.xy2geo(yxCenter[0], yxCenter[1], parentGeodetic.getHeight()));
                    
                    topLeftPointVec3 = globeShape.toVector3d(projection.xy2geo(topLeftPoint[0], topLeftPoint[1], parentGeodetic.getHeight()));
                    topRightPointVec3 = globeShape.toVector3d(projection.xy2geo(topRightPoint[0], topRightPoint[1], parentGeodetic.getHeight()));
                    bottomLeftPointVec3 = globeShape.toVector3d(projection.xy2geo(bottomLeftPoint[0], bottomLeftPoint[1], parentGeodetic.getHeight()));
                    bottomRightPointVec3 = globeShape.toVector3d(projection.xy2geo(bottomRightPoint[0], bottomRightPoint[1], parentGeodetic.getHeight()));
                    
                    center = vec3.scale(vec3.add(bottomLeftPointVec3, topRightPointVec3, center), 0.5, center);
                    vec3.normalize(center);
                    axis.zAxis = vec3.set(center, zVec);
                    axis.xAxis = vec3.normalize(vec3.sub(bottomRightPointVec3, bottomLeftPointVec3, xVec));
                    center = globeShape.toVector3d(globeShape.toGeodetic3d(center));
                    
                    borderPointList.push(topLeftPointVec3, topRightPointVec3, bottomLeftPointVec3, bottomRightPointVec3, center);
                    const radii = projection.getGlobeShape().getRadius();
                    if (row === 0) {
                        topLeftPointVec3[0] = 0;
                        topLeftPointVec3[1] = 0;
                        topLeftPointVec3[2] = radii[2];
                    }
                    if (row === (projection.getRowCount(level) - 1)) {
                        bottomLeftPoint[0] = 0;
                        bottomLeftPoint[1] = 0;
                        bottomLeftPoint[2] = -radii[2];
                    }
                    
                    var chunkNode = new GWTK.gEngine.Scene.VectorDataNode(identifier, this);
                    var obb = new OrientedBoundingBox3D(axis);
                    obb.fitPoints(borderPointList);
                    chunkNode.setOBB(obb);
                    
                    chunkNode.parent = parent;
                    parent.addChild(chunkNode);
                    axis.xAxis = axis.yAxis = axis.zAxis = undefined;
                }
                
            }
        },
        /**
         * Проверить видимость модели
         * @method checkModelVisibility
         * @public
         * @return {boolean} Флаг видимости модели
         */
        checkModelVisibility: function() {
            return true;
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
            if (this._objectSource._layerId === layerId) {
                this._opacity = opacity;
            }
            
        },
        /**
         * Удаление слоя
         * @method destroy
         * @public
         */
        destroy: function() {
            
            this._objectSource.destroy();
            this._objectSource = null;
            if (this._headNode) {
                this._headNode.destroy();
                this._headNode = null;
            }
            GWTK.gEngine.Scene.ClassifierModel.prototype.mCurrentTextureList.length = 0;
            
            this._isActive = false;
        }
    }
}
