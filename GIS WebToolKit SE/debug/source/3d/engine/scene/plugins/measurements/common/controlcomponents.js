/****************************************** Тазин В.О. 25/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент контроллера измерения объектов            *
 *                                                                  *
 *******************************************************************/
"use strict";
import ColorMethods from '~/3d/engine/utils/colormethods';
import { IntersectionTests } from '~/3d/engine/core/collisiondetection/collisiondetection';
import { vec3 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Plugins = GWTK.gEngine.Plugins || {};

    /**
     * Класс контроллера линейного измерения объектов
     * @class GWTK.gEngine.Plugins.PointMeasurementController
     * @constructor GWTK.gEngine.Plugins.PointMeasurementController
     * @param model {GWTK.gEngine.Plugins.PointMeasurementModel} Модель
     * @param map {GWTK.Map} Объект карты
     * * @param [options] {object} Параметры
     */
    GWTK.gEngine.Plugins.PointMeasurementController = function (model, map, options) {

        this._model = model;
        this._map = map;
        this._viewList = [];
        this._isDrawable = false;
        this.activePoint = -1;
        this.pointUnderCursor = -1;
        this._editionMode = false;
        this._creationMode = false;
        this.mRayVector = [];

        this.mMarkingStyle = {
            fillcolor: [1, 0.9921568627450981, 0.34901960784313724, 0.85],
            linecolor: [218 / 255, 68 / 255, 71 / 255, 1]
        };

        this.destroyHandler = function () {
        };
        this._maxPointCount = Number.MAX_VALUE;
        if (options) {
            this._maxPointCount = options.maxPointCount || this._maxPointCount;
            this.destroyHandler = options.destroyHandler || this.destroyHandler;
        }


        this._init();
    };
    GWTK.gEngine.Plugins.PointMeasurementController.prototype = {

        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function () {
            this.onSceneUpdate = this._onSceneUpdate.bind(this);
            this.mouseLeftDownHandler = this._mouseLeftDownHandler.bind(this);
            this.mouseDragHandler = this._mouseDragHandler.bind(this);
            this.mouseMoveHandler = this._mouseMoveHandler.bind(this);
            this.mouseLeftUpHandler = this._mouseLeftUpHandler.bind(this);
            this.cursorPointHandler = this._cursorPointHandler.bind(this);
            this.mouseLeftClickHandler = this._mouseLeftClickHandler.bind(this);
            this.mouseRightClickHandler = this._mouseRightClickHandler.bind(this);
            this.updateMeasurementUnitsHandler = this._updateMeasurementUnitsHandler.bind(this);
            this.updateModelHandler = this._updateModelHandler.bind(this);
            this.updateMarkingStyle = this._updateMarkingStyle.bind(this);
            this.keyboardHandler = this._keyboardHandler.bind(this);
            this.resetView = this.resetView.bind(this);
            this.proceed = this.proceed.bind(this);
            this.removePoint = this.removePoint.bind(this);
            this.updatePointUnderCursor = this.updatePointUnderCursor.bind(this);
            this.updateModelState = this.updateModelState.bind(this);


            this._initSubscriptions();

            this._model.setMeasurementUnits(this._map.getLinearUnits());
            this._model.setAreaMeasurementUnits(this._map.getAreaUnits());
            this._model.setAngleUnits(this._map.getAngleUnits());
        },
        /**
         * Добавление обработчиков внешних событий
         * @method _initSubscriptions
         * @private
         */
        _initSubscriptions: function () {

            var mediator = GWTK.gEngine.Mediator;
            mediator.subscribe('preRenderScene', this.onSceneUpdate);
            mediator.subscribe("cursorPoint", this.cursorPointHandler);
            mediator.subscribe("measurementModelUpdate", this.updateModelHandler);
    
            mediator.subscribe('planeObject', this.updateModelState);
            mediator.subscribe('setActiveSegment', this.updatePointUnderCursor);
            
            mediator.publish('mouseEventSubscription', {
                type: 'leftclick',
                handler: this.mouseLeftClickHandler
            });
            mediator.publish('mouseEventSubscription', {
                type: 'rightclick',
                handler: this.mouseRightClickHandler
            });
            mediator.publish('mouseEventSubscription', {
                type: 'leftup',
                handler: this.mouseLeftUpHandler
            });
            mediator.publish('mouseEventSubscription', {
                type: 'leftdown',
                handler: this.mouseLeftDownHandler
            });

            mediator.publish('mouseEventSubscription', {
                type: 'mousemove',
                handler: this.mouseMoveHandler
            });
            mediator.publish('mouseEventSubscription', {
                type: 'mousedrag',
                handler: this.mouseDragHandler
            });

            $(this._map.eventPane).on('measurement_change', this.updateMeasurementUnitsHandler);
            $(this._map.eventPane).on('measurementstylechanged', this.updateMarkingStyle);

            GWTK.gEngine.Renderer.KeyBoard.subscribe(this.keyboardHandler);
        },
        /**
         * Удаление обработчиков внешних событий
         * @method _removeSubscriptions
         * @private
         */
        _removeSubscriptions: function () {
            var mediator = GWTK.gEngine.Mediator;
            mediator.unsubscribe('preRenderScene', this.onSceneUpdate);
            mediator.unsubscribe("cursorPoint", this.cursorPointHandler);
            mediator.unsubscribe("measurementModelUpdate", this.updateModelHandler);
    
            mediator.unsubscribe('planeObject', this.updateModelState);
            mediator.unsubscribe('setActiveSegment', this.updatePointUnderCursor);
            
            mediator.publish('mouseEventUnsubscription', {
                type: 'leftclick',
                handler: this.mouseLeftClickHandler
            });
            mediator.publish('mouseEventUnsubscription', {
                type: 'rightclick',
                handler: this.mouseRightClickHandler
            });
            mediator.publish('mouseEventUnsubscription', {
                type: 'leftup',
                handler: this.mouseLeftUpHandler
            });
            mediator.publish('mouseEventUnsubscription', {
                type: 'leftdown',
                handler: this.mouseLeftDownHandler
            });
            mediator.publish('mouseEventUnsubscription', {
                type: 'mousemove',
                handler: this.mouseMoveHandler
            });
            mediator.publish('mouseEventUnsubscription', {
                type: 'mousedrag',
                handler: this.mouseDragHandler
            });

            $(this._map.eventPane).off('measurement_change', this.updateMeasurementUnitsHandler);
            $(this._map.eventPane).off('measurementstylechanged', this.updateMarkingStyle);

            GWTK.gEngine.Renderer.KeyBoard.unsubscribe(this.keyboardHandler);
        },
        /**
         * Проверка нахождения точки под курсором
         * @method _checkPoint
         * @private
         * @param e {object} Объект события
         * @return {number} Индекс точки или -1
         */
        _checkPoint: function (e) {
            var UNSCALED_VALUE = 1. / 466.;
            var rayPosition = e.rayPosition;
            var rayDirection = e.rayDirection;

            var activePoint = -1;
            var pointList = this._model.getPoints();
            for (var i = 0; i < pointList.length; i++) {
                var sphereCenter = pointList[i].getCartesian();
                var sphereRadius = UNSCALED_VALUE * 2.5 * vec3.len(vec3.sub(sphereCenter, rayPosition, this.mRayVector));
                if (IntersectionTests.tryRaySphere(rayPosition, rayDirection, sphereCenter, sphereRadius)) {
                    activePoint = i;
                    break;
                }
            }

            return activePoint;
        },

        /**
         * Обработчик события обновления сцены
         * @method _onSceneUpdate
         * @private
         * @param e {object} Событие обновления
         */
        _onSceneUpdate: function (e) {
            if (this._isDrawable) {
                for (var i = 0; i < this._viewList.length; i++) {
                    this._viewList[i].onSceneUpdate(e);
                }
            }
        },
        /**
         * Обработчик события нажатия клавиши
         * @method _keyboardHandler
         * @private
         * @param e {object} Событие
         */
        _keyboardHandler: function (e) {
            if (e.keyList[GWTK.gEngine.Renderer.KeyboardCode.Control] === true && e.clickedList.indexOf(GWTK.gEngine.Renderer.KeyboardCode.Enter) !== -1) {
                this.interrupt();
            } else if (e.clickedList.indexOf(GWTK.gEngine.Renderer.KeyboardCode.Backspace) !== -1 && this._creationMode && this.activePoint > 1) {
                this.removePoint(--this.activePoint);
            }
        },
        /**
         * Обработчик перемещения курсора
         * @method _mouseMoveHandler
         * @private
         * @param e {GWTK.gEngine.EventArgs} Объект события
         */
        _mouseMoveHandler: function (e) {
            if (this._isDrawable) {
                this.pointUnderCursor = this._checkPoint(e.data);
                if (this.activePoint !== -1) {
                    GWTK.gEngine.Renderer.Context.getGL().canvas.style.cursor = 'crosshair';
                } else {
                    if (this.pointUnderCursor !== -1) {
                        GWTK.gEngine.Renderer.Context.getGL().canvas.style.cursor = 'pointer';
                        this.updatePointUnderCursor(this.pointUnderCursor);
                    } else {
                        GWTK.gEngine.Renderer.Context.getGL().canvas.style.cursor = 'default';
                    }
                }

            } else {
                GWTK.gEngine.Renderer.Context.getGL().canvas.style.cursor = 'crosshair';
            }
        },
        /**
         * Обработчик перетаскивания
         * @method _mouseDragHandler
         * @private
         * @param e {GWTK.gEngine.EventArgs} Объект события
         */
        _mouseDragHandler: function (e) {
            if (!this._editionMode && this.activePoint !== -1) {
                e.CancelRequested = true;
            }
        },
        /**
         * Активация перемещения точки
         * @method _mouseLeftDownHandler
         * @private
         */
        _mouseLeftDownHandler: function () {
            if (!this._editionMode) {
                this.activePoint = this.pointUnderCursor;
            }
        },
        /**
         * Деактивация перемещения точки
         * @method _mouseLeftUpHandler
         * @private
         */
        _mouseLeftUpHandler: function () {
            if (!this._editionMode && this.activePoint !== -1) {
                this.activePoint = -1;
            }

        },
        /**
         * Обработчик перемещения точки
         * @method _cursorPointHandler
         * @private
         * @param e {object} Объект события
         */
        _cursorPointHandler: function (e) {
            if (this.activePoint !== -1) {
                var flag = this._model.updatePoint(this.activePoint, e.geo, e.normal);
                if (flag) {
                    this.updateView();
                }
            }
        },
        /**
         * Обновление единиц измерения модели
         * @method _updateMeasurementUnitsHandler
         * @private
         */
        _updateMeasurementUnitsHandler: function () {
            var units = this._map.getLinearUnits();
            var flag = this._model.setMeasurementUnits(units);
            var areaUnits = this._map.getAreaUnits();
            flag = this._model.setAreaMeasurementUnits(areaUnits) || flag;
            var angleUnits = this._map.getAngleUnits();
            flag = this._model.setAngleUnits(angleUnits) || flag;
            if (flag) {
                this.updateView();
            }
        },
        /**
         * Обновление модели
         * @method _updateModelHandler
         * @private
         */
        _updateModelHandler: function () {
            this.updateView();
        },
        /**
         * Обновление параметров отрисовки
         * @method _updateMarkingStyle
         * @private
         * @param [index] {number} Индекс для обновления
         */
        _updateMarkingStyle: function (index) {
            var style = this._map.options.measurementstyle;
            if (style) {
                ColorMethods.RGBA("#" + style.fillcolor, style.opacity, null, this.mMarkingStyle.fillcolor);
                ColorMethods.RGBA("#" + style.linecolor, style.opacity, null, this.mMarkingStyle.linecolor);
            }
            if (!isNaN(index) && index < this._viewList.length) {
                this._viewList[index].updateStyle(this.mMarkingStyle);
            } else {
                for (var i = 0; i < this._viewList.length; i++) {
                    this._viewList[i].updateStyle(this.mMarkingStyle);
                }
            }

        },

        /**
         * Обработчик добавления точки
         * @method _mouseLeftClickHandler
         * @private
         * @param e {object} Объект события
         */
        _mouseLeftClickHandler: function (e) {
            e.CancelRequested = true;
            if (!this._isDrawable) {
                // момент добавления на экран
                this._isDrawable = true;
                this._model.addPoint(e.data.geo, e.data.normal);
                this.activePoint = 0;
                this.activateView();
                this.updateView();
                this._creationMode = true;
                this._editionMode = true;
            }

            if (this._creationMode) {
                // если идет процесс добавления точек
                this._model.updatePoint(this.activePoint, e.data.geo, e.data.normal);
                this.activePoint = this._model.getPoints().length;
                this._model.addPoint(e.data.geo, e.data.normal);
                if (this._model.getPoints().length >= this._maxPointCount) {
                    this._creationMode = false;
                }
            } else if (this._editionMode) {
                // если шел процесс перемещения точки
                this._editionMode = false;
                this.activePoint = -1;

            } else if (this.pointUnderCursor !== -1) {
                // если навели курсор на точку
                this.activePoint = this.pointUnderCursor;
                this._editionMode = true;

            } else {
                e.CancelRequested = false;
            }

        },

        /**
         * Обработчик клика правой кнопки мыши
         * @method _mouseRightClickHandler
         * @private
         */
        _mouseRightClickHandler: function () {
            this.interrupt();
        },

        /**
         * Добавить объект визуализации
         * @method addView
         * @public
         * @param view {GWTK.gEngine.Plugins.MeasurementConstructionView } Вид
         */
        addView: function (view) {
            this._viewList.push(view);
            this.updateMarkingStyle(this._viewList.length - 1);
        },
        /**
         * Активация визуализаций компонента
         * @method updateView
         * @public
         */
        activateView: function () {
            for (var i = 0; i < this._viewList.length; i++) {
                this._viewList[i].activate();
            }
        },
        /**
         * Обновление визуализаций компонента
         * @method updateView
         * @public
         */
        updateView: function () {
            for (var i = 0; i < this._viewList.length; i++) {
                this._viewList[i].updateValues(this._model.getOBB(), this._model.getValues(), this.activePoint !== -1);
            }
        },
        /**
         * Сброс визуализаций компонента
         * @method updateView
         * @public
         */
        resetView: function () {
            this.reset();
            this._model.reset();
            for (var i = 0; i < this._viewList.length; i++) {
                this._viewList[i].reset();
            }
        },
        /**
         * Завершение режима добавления точек
         * @method interrupt
         * @public
         */
        interrupt: function () {
            if (this._creationMode) {
                this._creationMode = false;
                this._editionMode = false;
                var point = this.activePoint;
                this.activePoint = -1;
                this.removePoint(point);
            } else if (this._editionMode) {

            } else {
                if (this.pointUnderCursor !== -1) {
                    this.pointUnderCursor = -1;
                }
                this.updatePointUnderCursor(this.pointUnderCursor);
            }
    
            GWTK.gEngine.Mediator.publish('tool3dMeasurementsInterrupt' );
        },
        /**
         * Активация режима добавления точек
         * @method proceed
         * @public
         */
        proceed: function () {
            if (!this._creationMode && this._model.getPoints().length < this._maxPointCount) {
                this.activePoint = this._model.getPoints().length;
                this._model.addPoint(this._model.getPoints()[this.activePoint - 1].getGeo(), vec3.normalize(this._model.getPoints()[this.activePoint - 1].getCartesian(), []));
                this.updateView();
                this._creationMode = true;
                this._editionMode = true;
            }
        },
        /**
         * Обновление активной точки
         * @method updatePointUnderCursor
         * @public
         * @param index {number} Индекс точки
         */
        updatePointUnderCursor: function (index) {
            if (this._model.updateActivePoint(index)) {
                this.updateView();
            }
        },
        /**
         * Обновление состояния модели
         * @method updateModelState
         * @public
         * @param options {object} Параметры модели
         */
        updateModelState: function (options) {
            if (this._model.updateState(options)) {
                this.updateView();
            }
        },
        /**
         * Удаление точки по индексу
         * @method removePoint
         * @public
         * @param index {number} Индекс точки
         */
        removePoint: function (index) {
            if (this._model.getPoints().length > 0) {
                this._model.removePoint(index);
            }
            if (this._model.getPoints().length === 0) {
                this.resetView();
                GWTK.gEngine.Mediator.publish('tool3dMeasurementsResetView' );
            } else {
                this.updateView();
            }
        },
        /**
         * Сброс компонента
         * @method reset
         * @public
         */
        reset: function () {
            this.activePoint = -1;
            this._isDrawable = false;
            this._editionMode = false;
            this._creationMode = false;
            this.pointUnderCursor = -1;
        },
        /**
         * Деструктор
         * @method destroy
         * @public
         */
        destroy: function () {
            this.reset();
            this._removeSubscriptions();
            GWTK.gEngine.Renderer.Context.getGL().canvas.style.cursor = 'default';

            this._model.destroy();

            for (var i = 0; i < this._viewList.length; i++) {
                this._viewList[i].destroy();
            }

        }
    };
}
