/****************************************** Тазин В.О. 23/06/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Компонент ввода с мыши                      *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Список кодов клавиш мыши
     * @enum GWTK.gEngine.Renderer.MouseButton
     */
    GWTK.gEngine.Renderer.MouseButton = Object.freeze({
        Left: 0,
        Middle: 1,
        Right: 2
    });

    /**
     * Компонент ввода с мыши
     * @class GWTK.gEngine.Renderer.MouseDevice
     * @constructor GWTK.gEngine.Renderer.MouseDevice
     * @param eventPane {HTMLElement} Панель событий
     */
    GWTK.gEngine.Renderer.MouseDevice = function (eventPane) {

        this._eventPane = eventPane;
        this._initHandlers();

        this.buttonPressedList = {};

        this.mouseEvent = {
            x: 0,
            y: 0,
            buttonList: this.buttonPressedList,
            leftClick: {
                initX: 0,
                initY: 0
            },
            rightClick: {
                initX: 0,
                initY: 0
            },
            wheelEvent: {}
        };

        this._subscribers = {
            onmousedown: [],
            onmouseup: [],
            onmousemove: [],
            oncursormove: [],
            onclick: [],
            onmouseclick: [],
            onwheel: [],
            onmousewheel: [],
            onmouseleave: [],
            oncontextmenu: [],
            onmouserightclick: []
        };


    };
    GWTK.gEngine.Renderer.MouseDevice.prototype = {
        /**
         * Инициализация обработчиков событий
         * @method _initHandlers
         * @private
         */
        _initHandlers: function () {
            this._eventPane.onmousedown = this.onmousedown.bind(this);
            this._eventPane.onmouseup = this.onmouseup.bind(this);
            this._eventPane.onmousemove = this.onmousemove.bind(this);
            this._eventPane.onclick = this._eventPane.onmouseclick = this.onmouseclick.bind(this);
            this._eventPane.onwheel = this._eventPane.onmousewheel = this.onmousewheel.bind(this);
            this._eventPane.onmouseleave = this.onmouseleave.bind(this);
            this._eventPane.oncontextmenu = this.oncontextmenu.bind(this);
        },
        /**
         * Валидация события
         * @method _validateMouseEvent
         * @private
         * @param e {MouseEvent} Событие мыши
         * {MouseEvent} Исправленное событие мыши
         */
        _validateMouseEvent: function (e) {
            if (e.offsetX == null) {
                if (e.layerX || e.layerX === 0) {      // for mozilla firefox
                    e.offsetX = e.layerX;
                    e.offsetY = e.layerY;
                } else { // for other devices
                    e.offsetX = e.clientX - this._eventPane.offsetLeft;
                    e.offsetY = e.clientY - this._eventPane.offsetTop;
                }
            }
            //for webkit browser like safari and chrome do nothing
            return e;
        },

        /**
         * Обработчик нажатия клавиши мыши
         * @method onmousedown
         * @private
         */
        onmousedown: function (e) {
            e = this._validateMouseEvent(e);
            var button = e.button;
            this.buttonPressedList[button] = true;

            var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
            this.mouseEvent.x = realToCSSPixels * e.offsetX;
            this.mouseEvent.y = realToCSSPixels * e.offsetY;

            if (button === GWTK.gEngine.Renderer.MouseButton.Left) {
                this.mouseEvent.leftClick.initX = this.mouseEvent.x;
                this.mouseEvent.leftClick.initY = this.mouseEvent.y;
            }
            if (button === GWTK.gEngine.Renderer.MouseButton.Right) {
                this.mouseEvent.rightClick.initX = this.mouseEvent.x;
                this.mouseEvent.rightClick.initY = this.mouseEvent.y;
            }

            var handlers = this._subscribers["onmousedown"];
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }

            e.stopPropagation();
            e.preventDefault();
            e.returnValue = false;
        },
        /**
         * Обработчик клика клавиши мыши
         * @method onmouseclick
         * @private
         * @param e {Event} Объект события
         */
        onmouseclick: function (e) {
            e = this._validateMouseEvent(e);
            var button = e.button;
            var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
            this.mouseEvent.x = realToCSSPixels * e.offsetX;
            this.mouseEvent.y = realToCSSPixels * e.offsetY;
            if (button === GWTK.gEngine.Renderer.MouseButton.Left) {
                if (Math.abs(this.mouseEvent.x - this.mouseEvent.leftClick.initX) <= 3 && Math.abs(this.mouseEvent.y - this.mouseEvent.leftClick.initY) <= 3) {
                    var handlers = this._subscribers["onmouseclick"];
                    for (var i = 0; i < handlers.length; i++) {
                        handlers[i](this.mouseEvent);
                    }
                }
            }
            if (button === GWTK.gEngine.Renderer.MouseButton.Right) {
                if (Math.abs(this.mouseEvent.x - this.mouseEvent.rightClick.initX) <= 3 && Math.abs(this.mouseEvent.y - this.mouseEvent.rightClick.initY) <= 3) {
                    handlers = this._subscribers["onmouserightclick"];
                    for (i = 0; i < handlers.length; i++) {
                        handlers[i](e);
                    }
                }
            }

            e.stopPropagation();
            e.preventDefault();
            e.returnValue = false;
        },
        /**
         * Обработчик отпускания клавиши мыши
         * @method onmouseup
         * @private
         * @param e {Event} Объект события
         */
        onmouseup: function (e) {
            e = this._validateMouseEvent(e);
            var button = e.button;
            this.buttonPressedList[button] = false;

            var handlers = this._subscribers["onmouseup"];
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }
            e.stopPropagation();
            e.preventDefault();
            e.returnValue = false;
        },
        /**
         * Обработчик вызова контекстного меню
         * @method oncontextmenu
         * @private
         * @param e {Event} Объект события
         */
        oncontextmenu: function (e) {
            e = this._validateMouseEvent(e);
            var value = false;
            var handlers = this._subscribers["oncontextmenu"];
            for (var i = 0; i < handlers.length; i++) {
                value = handlers[i]() || value;
            }
            e.stopPropagation();
            e.preventDefault();
            e.returnValue = value;
            this.onmouseclick(e);
            return value;
        },
        /**
         * Обработчик покидания элемента курсором мыши
         * @method onmouseleave
         * @private
         * @param e {Event} Объект события
         */
        onmouseleave: function (e) {
            e = this._validateMouseEvent(e);
            var button = e.button;
            this.buttonPressedList[button] = false;

            var handlers = this._subscribers["onmouseleave"];
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }
            e.stopPropagation();
            e.preventDefault();
            e.returnValue = false;
        },
        /**
         * Обработчик вращения колеса мыши
         * @method onmousewheel
         * @private
         * @param e {Event} Объект события
         */
        onmousewheel: function (e) {
            e = this._validateMouseEvent(e);
            this.mouseEvent.wheelEvent.originalEvent = e;
            var handlers = this._subscribers["onmousewheel"];
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }
            this.mouseEvent.wheelEvent.originalEvent = null;
            e.stopPropagation();
            e.preventDefault();
            e.returnValue = false;
        },
        /**
         * Обработчик перемещения курсора мыши по элементу
         * @method onmousemove
         * @private
         * @param e {Event} Объект события
         */
        onmousemove: function (e) {
            e = this._validateMouseEvent(e);
            var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
            this.mouseEvent.x = realToCSSPixels * e.offsetX;
            this.mouseEvent.y = realToCSSPixels * e.offsetY;

            this.mouseEvent.freeMove = !this.buttonPressedList[GWTK.gEngine.Renderer.MouseButton.Left] && !this.buttonPressedList[GWTK.gEngine.Renderer.MouseButton.Right];

            var handlers = this._subscribers["onmousemove"];
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }

            this._cursorMove(this.mouseEvent);

            e.stopPropagation();
            e.preventDefault();
            e.returnValue = false;
        },

        /**
         * Обработчик свободного перемещения курсора мыши
         * @method onmousemove
         * @private
         * @param mouseEvent {mouseEvent} Объект события мыши
         */
        _cursorMove: function (mouseEvent) {
            if (!this.buttonPressedList[GWTK.gEngine.Renderer.MouseButton.Left] && !this.buttonPressedList[GWTK.gEngine.Renderer.MouseButton.Right]) {
                var handlers = this._subscribers["oncursormove"];
                for (var i = 0; i < handlers.length; i++) {
                    handlers[i](mouseEvent);
                }
            }
        },

        /**
         * Подписаться на события мыши
         * @method subscribe
         * @public
         * @param handlers {object} Коллекция функций-обработчиков
         */
        subscribe: function (handlers) {
            for (var event in handlers) {
                this._subscribers[event].push(handlers[event]);
            }
        },
        /**
         * Отписаться от события мыши
         * @method unsubscribe
         * @public
         * @param handlers {object} Коллекция функций-обработчиков
         */
        unsubscribe: function (handlers) {
            for (var event in handlers) {
                var ind = this._subscribers[event].indexOf(handlers[event]);
                if (ind !== -1) {
                    this._subscribers[event].splice(ind, 1);
                }
            }
        },
        /**
         * Очистить список подписчиков
         * @method clean
         * @public
         */
        clean: function () {
            for (var event in this._subscribers) {
                this._subscribers[event].length = 0;
            }
        }
    };

}
