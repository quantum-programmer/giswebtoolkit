/****************************************** Тазин В.О. 20/07/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент линейного измерения объектов              *
 *                                                                  *
 *******************************************************************/
"use strict";
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { IntersectionTests } from '~/3d/engine/core/collisiondetection/collisiondetection';
import ComboPoint3D from '~/3d/engine/core/combopoint3d';
import { mat4, vec3 } from '~/3d/engine/utils/glmatrix';


if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Plugins = GWTK.gEngine.Plugins || {};
    
    /**
     * Класс модели линейного измерения объектов
     * @class GWTK.gEngine.Plugins.LinearMeasurementLayer
     * @constructor GWTK.gEngine.Plugins.LinearMeasurementLayer
     * @extends GWTK.UserControl
     */
    GWTK.gEngine.Plugins.LinearMeasurementLayer = function() {
        // this.title = w2utils.lang("Linear measurements");
        this.title = "Linear measurements";
        this.id = "panel_button_linearmeasurements3d";
    };
    GWTK.gEngine.Plugins.LinearMeasurementLayer.prototype = {
        /**
         * Инициализация
         * @method init
         * @public
         */
        init: function() {
            this.reset = this.reset.bind(this);
            this._initSubscriptions();
        },
        
        /**
         * Добавление обработчиков внешних событий
         * @method _initSubscriptions
         * @private
         */
        _initSubscriptions: function() {
            GWTK.gEngine.Mediator.subscribe('hide3d', this.reset);
        },
        /**
         * Удаление обработчиков внешних событий
         * @method _removeSubscriptions
         * @private
         */
        _removeSubscriptions: function() {
            GWTK.gEngine.Mediator.unsubscribe('hide3d', this.reset);
        },
        
        
        /**
         * Активация компонента
         * @method activate
         * @public
         */
        activate: function() {
        },
        /**
         * Сброс компонента
         * @method reset
         * @public
         */
        reset: function() {
            if (this._activated) {
                this._controller.destroy();
                this._controller = null;
                this._activated = false;
            }
        },
        /**
         * Деструктор
         * @method destroy
         * @public
         */
        destroy: function() {
            this.reset();
            this._removeSubscriptions();
            GWTK[this.toolname] = undefined;
        }
        
    };
    
    /**
     * Класс визуализации значений измерения объектов
     * @class GWTK.gEngine.Plugins.LinearMeasurementValuesView
     * @constructor GWTK.gEngine.Plugins.LinearMeasurementValuesView
     * @extends GWTK.gEngine.Plugins.MeasurementConstructionView
     */
    GWTK.gEngine.Plugins.LinearMeasurementValuesView = function() {
        this._pointList = [];
        this._pixelPointList = [];
        this._divs = [];
        this.mPoints = [[], [], []];
        this._parentDiv = null;
        this._supportPoint = undefined;
        this.mGeoPoint = new Geodetic3D(0, 0, 0);
        this._init();
    };
    GWTK.gEngine.Plugins.LinearMeasurementValuesView.prototype = {
        
        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function() {
            this._parentDiv = document.createElement('div');
            GWTK.gEngine.Renderer.Context.getGL().canvas.parentElement.appendChild(this._parentDiv);
            
            var className = 'measurement3d-divs';
            for (var i = 0; i < 3; i++) {
                this._divs.push(new GWTK.gEngine.Scene.PointUI(this._parentDiv, className));
            }
            className = 'measurement3d-divs measurement3d-divs-absolute-height';
            for (i = 0; i < 2; i++) {
                this._divs.push(new GWTK.gEngine.Scene.PointUI(this._parentDiv, className));
            }
        },
        
        /**
         * Обработчик обновления сцены
         * @method onSceneUpdate
         * @public
         * @param e {object} Событие обновления
         */
        onSceneUpdate: function(e) {
            this._updateElementPositions(e);
            for (var i = 0; i < this._divs.length; i++) {
                this._divs[i].updateElement();
            }
            this._checkForCollisions();
        },
        
        /**
         * Проверка на пересечения элементов
         * @method _checkForCollisions
         * @private
         */
        _checkForCollisions: function() {
            
            this._divs[0].setVisibility(this._checkPixelCenter(this._divs[0].getBbox().getCenter()));
            
            var heightVisibility = this._checkPixelCenter(this._divs[1].getBbox().getCenter()) && !IntersectionTests.tryBoundingBoxes2D(this._divs[0].getBbox(), this._divs[1].getBbox()) && !IntersectionTests.tryBoundingBoxes2D(this._divs[3].getBbox(), this._divs[1].getBbox()) && !IntersectionTests.tryBoundingBoxes2D(this._divs[4].getBbox(), this._divs[1].getBbox());
            this._divs[1].setVisibility(heightVisibility);
            
            var lengthDvisibility = this._checkPixelCenter(this._divs[2].getBbox().getCenter()) && !IntersectionTests.tryBoundingBoxes2D(this._divs[0].getBbox(), this._divs[2].getBbox()) && !IntersectionTests.tryBoundingBoxes2D(this._divs[1].getBbox(), this._divs[2].getBbox()) && !IntersectionTests.tryBoundingBoxes2D(this._divs[3].getBbox(), this._divs[2].getBbox()) && !IntersectionTests.tryBoundingBoxes2D(this._divs[4].getBbox(), this._divs[2].getBbox());
            this._divs[2].setVisibility(lengthDvisibility);
            
            var minPointVisibility = this._checkPixelCenter(this._divs[3].getBbox().getCenter()) && !IntersectionTests.tryBoundingBoxes2D(this._divs[0].getBbox(), this._divs[3].getBbox());
            this._divs[3].setVisibility(minPointVisibility);
            
            var maxPointVisibility = this._checkPixelCenter(this._divs[4].getBbox().getCenter()) && !IntersectionTests.tryBoundingBoxes2D(this._divs[0].getBbox(), this._divs[4].getBbox());
            this._divs[4].setVisibility(maxPointVisibility);
            
            
        },
        /**
         * Проверка на нахождение элементов в пределах экрана
         * @method _checkPixelCenter
         * @private
         * @param pixelPoint {array} Экранные координаты точки
         */
        _checkPixelCenter: function(pixelPoint) {
            var viewport = GWTK.gEngine.Renderer.Context.getViewPort();
            return pixelPoint[0] > viewport[0] && pixelPoint[0] < (viewport[0] + viewport[2]) &&
                pixelPoint[1] > viewport[1] && pixelPoint[1] < (viewport[1] + viewport[3]);
        },
        /**
         * Обновление положения элементов на экране
         * @method _updateTextPoints
         * @private
         * @param pixelPoin0 {array} Экранные координаты точки 0
         * @param pixelPoin1 {array} Экранные координаты точки 1
         * @param pixelPoin2 {array} Экранные координаты точки 2
         */
        _updateTextPoints: function(pixelPoin0, pixelPoin1, pixelPoin2) {
            if (this._pixelPointList[0] === undefined) {
                this._pixelPointList[0] = [];
                this._pixelPointList[1] = [];
                this._pixelPointList[2] = [];
                this._pixelPointList[3] = [];
                this._pixelPointList[4] = [];
            }
            
            this._pixelPointList[0][0] = Math.round((pixelPoin0[0] + pixelPoin1[0]) * 0.5);
            this._pixelPointList[0][1] = Math.round((pixelPoin0[1] + pixelPoin1[1]) * 0.5);
            
            this._pixelPointList[1][0] = Math.round((pixelPoin0[0] + pixelPoin2[0]) * 0.5);
            this._pixelPointList[1][1] = Math.round((pixelPoin0[1] + pixelPoin2[1]) * 0.5);
            
            this._pixelPointList[2][0] = Math.round((pixelPoin1[0] + pixelPoin2[0]) * 0.5);
            this._pixelPointList[2][1] = Math.round((pixelPoin1[1] + pixelPoin2[1]) * 0.5);
            
            this._pixelPointList[3][0] = Math.round(pixelPoin0[0]);
            this._pixelPointList[3][1] = Math.round(pixelPoin0[1] - 20);
            
            this._pixelPointList[4][0] = Math.round(pixelPoin1[0]);
            this._pixelPointList[4][1] = Math.round(pixelPoin1[1] - 20);
            
            for (var i = 0; i < this._divs.length; i++) {
                this._divs[i].updateBbox(this._pixelPointList[i]);
            }
        },
        /**
         * Обновление положения элементов
         * @method _updateElementPositions
         * @private
         * @param e {object} Событие обновления
         */
        _updateElementPositions: function(e) {
            if (this._pointList.length > 1) {
                if (this._pointList[0].getGeo().getHeight() < this._pointList[1].getGeo().getHeight()) {
                    var vector3d0 = this._pointList[0].getCartesian();
                    var vector3d1 = this._pointList[1].getCartesian();
                }else{
                    vector3d0 = this._pointList[1].getCartesian();
                    vector3d1 = this._pointList[0].getCartesian();
                }
                
                var vector3d2 = this._supportPoint.getCartesian();
                
                var pixelPoin0 = this._calcPixelPoint(e.sceneState, vector3d0, this.mPoints[0]);
                var pixelPoin1 = this._calcPixelPoint(e.sceneState, vector3d1, this.mPoints[1]);
                var pixelPoin2 = this._calcPixelPoint(e.sceneState, vector3d2, this.mPoints[2]);
                this._updateTextPoints(pixelPoin0, pixelPoin1, pixelPoin2);
            }
            
        },
        /**
         * Пересчет в экранные координаты
         * @method _calcPixelPoint
         * @private
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         * @param cursorVectorPoint {array} Координаты точки
         * @param point3D {array} Результат
         */
        _calcPixelPoint: function(sceneState, cursorVectorPoint, point3D) {
            var viewport = GWTK.gEngine.Renderer.Context.getViewPort();
            var matrix = sceneState.getViewPerspectiveMatrix();
            //transform world to clipping coordinates
            vec3.set(cursorVectorPoint, point3D);
            point3D[3] = 1;
            mat4.multiplyVec4(matrix, point3D, point3D);
            vec3.scale(point3D, 1 / point3D[3]);
            point3D.length = 2;
            point3D[0] = Math.round(viewport[2] * (point3D[0] + 1) / 2);
            point3D[1] = Math.round(viewport[3] * (1 - point3D[1]) / 2);
            
            return point3D;
        },
        
        /**
         * Обновление значений измерений
         * @method updateValues
         * @public
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         * @param measurementResults {object} Значения измерений
         */
        updateValues: function(obb, measurementResults) {
            var pointList = measurementResults.geometry.points;
            this._pointList.length = pointList.length;
            for (var i = 0; i < pointList.length; i++) {
                this._pointList[i] = pointList[i];
            }
            
            var currentSupportPoint = this.mGeoPoint;
            if (this._pointList.length > 1) {
                if (this._pointList[0].getGeo().getHeight() < this._pointList[1].getGeo().getHeight()) {
                    currentSupportPoint.setLatitude(this._pointList[0].getGeo().getLatitude());
                    currentSupportPoint.setLongitude(this._pointList[0].getGeo().getLongitude());
                    currentSupportPoint.setHeight(this._pointList[1].getGeo().getHeight());
                }else{
                    currentSupportPoint.setLatitude(this._pointList[1].getGeo().getLatitude());
                    currentSupportPoint.setLongitude(this._pointList[1].getGeo().getLongitude());
                    currentSupportPoint.setHeight(this._pointList[0].getGeo().getHeight());
                }
            }
            if (!this._supportPoint) {
                this._supportPoint = new ComboPoint3D(this._pointList[0].ellipsoid);
            }
            this._supportPoint.setGeo(currentSupportPoint);
            
            
            if (measurementResults.segments.length > 0) {
                var segment = measurementResults.segments[0];
                var distance = segment.metricValues.distance;
                var deltaHeight = segment.metricValues.deltaHeight;
                var planeDistance = segment.metricValues.planeDistance;
                
                
                if (this._pointList[0].getGeo().getHeight() > this._pointList[1].getGeo().getHeight()) {
                    var maxHeight = measurementResults.points[0].metricValues.relativeHeight;
                    var minHeight = measurementResults.points[1].metricValues.relativeHeight;
                }else{
                    maxHeight = measurementResults.points[1].metricValues.relativeHeight;
                    minHeight = measurementResults.points[0].metricValues.relativeHeight;
                }
                if (distance.value === 0 || segment.auxiliaryValues.slope < 0.05) {
                    deltaHeight = undefined;
                    planeDistance = undefined;
                }
                if (planeDistance !== undefined && segment.auxiliaryValues.slope < 0.05) {
                    planeDistance = undefined;
                    deltaHeight = undefined;
                }
                
                if (minHeight.value < 1) {
                    minHeight = undefined;
                }
                
                if (maxHeight.value < 1) {
                    maxHeight = undefined;
                }
                
                this._divs[0].setValue(distance);
                this._divs[1].setValue(deltaHeight);
                this._divs[2].setValue(planeDistance);
                
                this._divs[3].setValue(minHeight);
                this._divs[4].setValue(maxHeight);
                
                GWTK.gEngine.Mediator.publish('tool3dLinearMeasurements', measurementResults);
                
            }else{
                //TODO если кликнули по небу, чтобы как в старом компоненте
                GWTK.gEngine.Mediator.publish('tool3dLinearMeasurements', {});
            }
        },
        /**
         * Обновление стиля
         * @method updateStyle
         * @public
         */
        updateStyle: function() {
        },
        /**
         * Активация компонента
         * @method activate
         * @public
         */
        activate: function() {
            for (var i = 0; i < this._divs.length; i++) {
                this._divs[i].show();
            }
        },
        /**
         * Сброс компонента
         * @method reset
         * @public
         */
        reset: function() {
            for (var i = 0; i < this._divs.length; i++) {
                this._divs[i].hide();
            }
        },
        /**
         * Деструктор
         * @method destroy
         * @public
         */
        destroy: function() {
            for (var i = 0; i < this._divs.length; i++) {
                this._divs[i].destroy();
            }
            this._parentDiv.parentElement.removeChild(this._parentDiv);
            this._parentDiv = null;
        }
    };
}
