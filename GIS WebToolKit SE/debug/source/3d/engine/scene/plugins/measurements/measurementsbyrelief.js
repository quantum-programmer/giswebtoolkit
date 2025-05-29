/****************************************** Тазин В.О. 25/11/20  ****
 ************************************ Железнякова Ю.В. 03/09/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Компонент измерения по земной поверхности             *
 *                                                                  *
 *******************************************************************/
"use strict";
import { mat4, vec3 } from '~/3d/engine/utils/glmatrix';


if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Plugins = GWTK.gEngine.Plugins || {};
    
    /**
     * Класс слоя измерения по земной поверхности
     * @class GWTK.gEngine.Plugins.MeasurementBySurfaceLayer
     * @constructor GWTK.gEngine.Plugins.MeasurementBySurfaceLayer
     * @extends GWTK.UserControl
     */
    GWTK.gEngine.Plugins.MeasurementBySurfaceLayer = function() {
        this.title = "Linear measurements by surface";
        this.id = "panel_button_surfacemeasurements3d";
    };
    GWTK.gEngine.Plugins.MeasurementBySurfaceLayer.prototype = {
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
     * @class GWTK.gEngine.Plugins.MeasurementBySurfaceInfoView
     * @constructor GWTK.gEngine.Plugins.MeasurementBySurfaceInfoView
     * @extends GWTK.gEngine.Plugins.MeasurementConstructionView
     * @param controller {GWTK.gEngine.Plugins.PointMeasurementController} Контроллер
     */
    GWTK.gEngine.Plugins.MeasurementBySurfaceInfoView = function(controller) {
        this._pointList = [];
        this._pixelPointList = [];
        this._divs = [];
        this.mPoints = [];
        this._parentDiv = null;
        this.removePoint = controller.removePoint;
        this._init();
    };
    GWTK.gEngine.Plugins.MeasurementBySurfaceInfoView.prototype = {
        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function() {
            this._parentDiv = document.createElement('div');
            GWTK.gEngine.Renderer.Context.getGL().canvas.parentElement.appendChild(this._parentDiv);
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
                if (i === this._cursorIndex) {
                    this._divs[i].cursorActivate();
                }else{
                    this._divs[i].cursorDeactivate();
                }
            }
        },
        
        /**
         * Обновление положения элементов
         * @method _updateElementPositions
         * @private
         * @param e {object} Событие обновления
         */
        _updateElementPositions: function(e) {
            for (var i = 0; i < this._pointList.length; i++) {
                var pixelPoint = this._calcPixelPoint(e.sceneState, this._pointList[i].getCartesian(), this.mPoints);
                if (this._pixelPointList[i] === undefined) {
                    this._pixelPointList[i] = [];
                }
                this._pixelPointList[i][0] = Math.round(pixelPoint[0]);
                this._pixelPointList[i][1] = Math.round(pixelPoint[1] - 30 * GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO);
                this._divs[i].updateBbox(this._pixelPointList[i]);
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
         * @param [hideDeleteElements] {boolean} Флаг для скрытия кнопки удаление точки (в процессе редактирования)
         */
        updateValues: function(obb, measurementResults, hideDeleteElements) {
            var pointList = measurementResults.geometry.points;
            for (var i = 0; i < pointList.length; i++) {
                if (this._pointList[i] !== undefined) {
                    if (!this._pointList[i].equals(pointList[i])) {
                        this._pointList.splice(i, 1);
                        this._divs[i].destroy();
                        this._divs.splice(i, 1);
                        i--;
                        
                    }
                }else{
                    this._pointList[i] = pointList[i];
                }
            }
            this._pointList.length = pointList.length;
            
            
            while (this._divs.length > this._pointList.length) {
                this._divs.pop().destroy();
            }
            var className = "measurement3d-cross";
            for (i = this._divs.length; i < this._pointList.length; i++) {
                var div = new GWTK.gEngine.Scene.ElementUI(this._parentDiv, className);
                div.addElementHandler('click', this.removePoint);
                this._divs.push(div);
            }
            
            for (i = 0; i < this._divs.length; i++) {
                div = this._divs[i];
                this._divs[i].setIndex(i);
                if (hideDeleteElements && div instanceof GWTK.gEngine.Scene.ElementUI) {
                    div.hide();
                }else{
                    div.show();
                }
            }
            
            var activeIndex = -1;
            var points = measurementResults.points;
            for (i = 0; i < points.length; i++) {
                if (points[i].auxiliaryValues.active) {
                    activeIndex = i;
                    break;
                }
            }
            this._cursorIndex = activeIndex;
            
            GWTK.gEngine.Mediator.publish('tool3dLinearMeasurementsSurface', measurementResults);
            
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
