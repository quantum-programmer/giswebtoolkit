/****************************************** Тазин В.О. 20/07/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Кнопки панели 3d навигации                     *
 *                                                                  *
 *******************************************************************/
"use strict";

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Кнопки панели навигации
     * @class GWTK.gEngine.Scene.NavigationButtons
     * @constructor GWTK.gEngine.Scene.NavigationButtons
     * @param map3dData {GWTK.Map3dData} Объект параметров карты
     */
    GWTK.gEngine.Scene.NavigationButtons = function (map3dData) {
        this.map3dData = map3dData;
        this._navigationPane = null;
        this._buttonList = [];
        //Инициализация кнопок и их обработчиков
        this._initButtons();
    };
    GWTK.gEngine.Scene.NavigationButtons.prototype = {
        /**
         * Инициализация кнопок и их обработчиков
         * @method _initButtons
         * @private
         */
        _initButtons: function () {
            var map3dData = this.map3dData;
            var animation = map3dData.animation;

            var mapState = map3dData.getMapState();
            var _touchMode = GWTK.gEngine.Utils3d.isTouchDevice();
            var params = {};

            var handlerList = {};

            // Создаем кнопки навигации на панели управления
            var navigation3d = mapState.addMapPane('navigation3d', 'panel-navigation3d', mapState.getMapScalerPane());
            this._navigationPane = $(navigation3d);

            //Наклон камеры
            //---------------------------------------------------------------------------------
            //Перемещение камеры ближе к карте
            params.id = 'camera_button-in';
            params.title = w2utils.lang("Tilt forward");
            params.tagName = "div";
            params.className = 'control-button clickable';
            params.container = navigation3d;

            // Добавляем обработчики событий для кнопки
            var handler = function () {
                animation.animateIncline(+Math.PI / 144);
            };
            var handlerStop = function () {
                GWTK.gEngine.Mediator.publish('animationInclineReset');
            };
            if (!_touchMode) {
                handlerList.mousedown = handler;
                handlerList.mouseup = handlerStop;
                handlerList.mouseout = handlerStop;
            } else {
                handlerList.touchstart = handler;
                handlerList.touchenter = handler;
                handlerList.touchend = handlerStop;
                handlerList.touchcancel = handlerStop;
                handlerList.touchleave = handlerStop;
                handlerList.touchmove = handlerStop;
            }


            this.addButton(new GWTK.gEngine.Scene.Button(params, handlerList));

            //---------------------------------------------------------------------------------
            //Перемещение камеры дальше от карты
            params.id = 'camera_button-out';
            params.title = w2utils.lang("Tilt back");

            // Добавляем обработчики событий для кнопки
            handler = function () {
                animation.animateIncline(-Math.PI / 144);
            };

            if (!_touchMode) {
                handlerList.mousedown = handler;
                handlerList.mouseup = handlerStop;
                handlerList.mouseout = handlerStop;
            } else {
                handlerList.touchstart = handler;
                handlerList.touchenter = handler;
                handlerList.touchend = handlerStop;
                handlerList.touchcancel = handlerStop;
                handlerList.touchleave = handlerStop;
                handlerList.touchmove = handlerStop;
            }


            this.addButton(new GWTK.gEngine.Scene.Button(params, handlerList));

            //---------------------------------------------------------------------------------
            // Поворот камеры
            var rotation3d = mapState.addMapPane('rotation3d', 'control-button panel-rotation3d', navigation3d);

            //---------------------------------------------------------------------------------
            //Вращение камеры по часовой стрелке
            params.id = 'rotate3d_button-left';
            params.title = w2utils.lang("Rotate right");
            params.className = 'control-button-rotate3d clickable';
            params.container = rotation3d;
            // Добавляем обработчики событий для кнопки
            handler = function () {
                animation.animateRotation(-Math.PI * 0.5);
            };

            handlerStop = function () {
                GWTK.gEngine.Mediator.publish('animationRotateReset');
            };

            if (!_touchMode) {
                handlerList.mousedown = handler;
                handlerList.mouseup = handlerStop;
                handlerList.mouseout = handlerStop;
            } else {
                handlerList.touchstart = handler;
                handlerList.touchenter = handler;
                handlerList.touchend = handlerStop;
                handlerList.touchcancel = handlerStop;
                handlerList.touchleave = handlerStop;
                handlerList.touchmove = handlerStop;
            }

            this.addButton(new GWTK.gEngine.Scene.Button(params, handlerList));
            //---------------------------------------------------------------------------------

            handlerList.mousedown = null;
            handlerList.touchstart = null;
            handlerList.mouseup = null;
            handlerList.mouseout = null;
            handlerList.touchend = null;
            handlerList.touchcancel = null;
            handlerList.touchmove = null;


            //Возврат на исходную позицию (север)
            params.id = 'rotate3d_button-center';
            params.title = w2utils.lang("Reset rotation angle");
            // Добавляем обработчики событий для кнопки
            handler = function () {
                var rotateAngle = map3dData.getRotateAngle();
                var targetAngle = 0;

                if (rotateAngle > targetAngle)
                    var delta = -Math.PI;
                else if (rotateAngle < targetAngle)
                    delta = Math.PI;
                else {
                    delta = 0;
                }
                animation.animateRotation(delta, targetAngle);
            };
            handlerStop = function () {
                if (animation.targetRotateAngle === null) {
                    GWTK.gEngine.Mediator.publish('animationRotateReset');
                }
            };
            handlerList.click = handler;
            this.addButton(new GWTK.gEngine.Scene.Button(params, handlerList));
            handlerList.click = null;
            //---------------------------------------------------------------------------------

            //Вращение камеры против часовой стрелки
            params.id = 'rotate3d_button-right';
            params.title = w2utils.lang("Rotate left");
            // Добавляем обработчики событий для кнопки
            handler = function () {
                animation.animateRotation(Math.PI * 0.5);
            };

            handlerStop = function () {
                GWTK.gEngine.Mediator.publish('animationRotateReset');
            };

            if (!_touchMode) {
                handlerList.mousedown = handler;
                handlerList.mouseup = handlerStop;
                handlerList.mouseout = handlerStop;
            } else {
                handlerList.touchstart = handler;
                handlerList.touchenter = handler;
                handlerList.touchend = handlerStop;
                handlerList.touchcancel = handlerStop;
                handlerList.touchleave = handlerStop;
                handlerList.touchmove = handlerStop;
            }
            this.addButton(new GWTK.gEngine.Scene.Button(params, handlerList));

            // Создаем кнопки навигации на панели управления
            var toolbar3d = mapState.addMapPane('toolbar3d', 'panel-tools3d', mapState.getMapScalerPane());
            this._toolbarPane = $(toolbar3d);
            //---------------------------------------------------------------------------------
        },
        /**
         * Спрятать панель
         * @method hide
         * @public
         */
        hide: function () {
            this._navigationPane.hide();
        },
        /**
         * Отобразить панель
         * @method show
         * @public
         */
        show: function () {
            this._navigationPane.show();
        },
        /**
         * Добавить кнопку
         * @method addButton
         * @public
         * @param button {GWTK.gEngine.Scene.Button} Кнопка навигации
         */
        addButton: function (button) {
            this._buttonList.push(button);
        },
        /**
         * Удалить кнопку
         * @method removeButton
         * @public
         * @param button {GWTK.gEngine.Scene.Button} Кнопка навигации
         */
        removeButton: function (button) {
            var index = this._buttonList.indexOf(button);
            if (index !== -1) {
                button.destroy();
                this._buttonList.splice(index, 1);
            }
        },
        /**
         * Удалить кнопку по идентификатору
         * @method removeButton
         * @public
         * @param id {string} Идентификатор кнопки навигации
         */
        removeButtonById: function (id) {
            var button;
            for (var i = 0; (button = this._buttonList[i]); i++) {
                if (button._id === id) {
                    button.destroy();
                    this._buttonList.splice(i, 1);
                    break;
                }
            }
        },
        /**
         * Удаление кнопок и их обработчиков
         * @method _destroyButtons
         * @private
         */
        _destroyButtons: function () {
            var button;
            for (var i = 0; (button = this._buttonList[i]); i++) {
                button.destroy();
            }
            this._buttonList = null;

        },
        /**
         * Удаление из DOM
         * @method destroy
         * @public
         */
        destroy: function () {
            this._destroyButtons();
            var mapState = this.map3dData.getMapState();
            $(mapState.getMapPane('rotation3d')).remove();
            this._navigationPane.remove();
            this._navigationPane = null;
        }
    };
    /**
     * Кнопка навигации
     * @class GWTK.gEngine.Scene.Button
     * @constructor GWTK.gEngine.Scene.Button
     * @param params {object} Параметры кнопки
     * @param handlers {object} Обработчики
     */
    GWTK.gEngine.Scene.Button = function (params, handlers) {
        this._id = params.id;
        // Создаем кнопку компонента на панели управления
        this._element = $(GWTK.DomUtil.create(params.tagName, params.className, params.container));
        this._element.attr("id", params.id);
        this._element.attr("title", params.title);
        // Добавляем обработчики событий для кнопки
        for (var event in handlers) {
            var handler = handlers[event];
            if (typeof handler === "function") {
                this._element.on(event, handler.bind(this));
            }
        }
    };
    GWTK.gEngine.Scene.Button.prototype = {
        /**
         * Удаление из DOM
         * @method destroy
         * @public
         */
        destroy: function () {
            this._element.off();
            this._element.remove();
        }
    };
}


