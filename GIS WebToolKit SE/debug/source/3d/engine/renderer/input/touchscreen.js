/****************************************** Тазин В.О. 20/07/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент ввода с сенсорного экрана                 *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Компонент ввода с сенсорного экрана
     * @class GWTK.gEngine.Renderer.TouchScreen
     * @constructor GWTK.gEngine.Renderer.TouchScreen
     * @param eventPane {HTMLElement} Панель событий
     */
    GWTK.gEngine.Renderer.TouchScreen = function (eventPane) {

        this._eventPane = eventPane;
        this._initHandlers();

        this.buttonPressedList = {};

        this.mouseEvent = {
            x: 0,
            y: 0,
            buttonList: this.buttonPressedList,
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

        this.touches = {
            0: {
                active: false,
                x: 0,
                y: 0
            },
            1: {
                active: false,
                x: 0,
                y: 0
            }

        };
        this._mouseClick = this._mouseClick.bind(this);
    };

    GWTK.gEngine.Renderer.TouchScreen.prototype = {
        /**
         * Инициализация обработчиков событий
         * @method _initHandlers
         * @private
         */
        _initHandlers: function () {
            this._eventPane.addEventListener('touchstart', this.ontouchstart.bind(this), false);
            this._eventPane.addEventListener('touchmove', this.ontouchmove.bind(this), false);
            this._eventPane.addEventListener('touchcancel', this.ontouchend.bind(this), false);
            this._eventPane.addEventListener('touchend', this.ontouchend.bind(this), false);
            // this._eventPane.addEventListener('click', this.onmouseclick.bind(this), false);
        },

        /**
         * Обработчик прикосновения к экрану
         * @method ontouchstart
         * @private
         * @param e {TouchEvent} Объект события
         */
        ontouchstart: function (e) {
            switch (e.touches.length) {
                case 1:
                    this._handleOneTouchStart(e);
                    break;
                case 2:
                    this._handleTwoTouchesStart(e);
                    break;
                // case 3: handle_three_touches(e); break;
                // default: gesture_not_supported(e); break;
            }
            e.stopPropagation();
            e.preventDefault();
            e.returnValue = false;
        },
        /**
         * Обработчик удаления от экрана
         * @method ontouchend
         * @private
         * @param e {TouchEvent} Объект события
         */
        ontouchend: function (e) {

            switch (e.touches.length) {
                case 0:
                    this._handleOneTouchEnd(e);
                    break;
                case 1:
                    this._handleTwoTouchesEnd(e);
                    break;
                // case 3: handle_three_touches(e); break;
                // default: gesture_not_supported(e); break;
            }
            e.stopPropagation();
            e.preventDefault();
            e.returnValue = false;
        },
        /**
         * Обработчик движения по экрану
         * @method ontouchmove
         * @private
         * @param e {TouchEvent} Объект события
         */
        ontouchmove: function (e) {

            switch (e.touches.length) {
                case 1:
                    this._handleOneTouchMove(e);
                    break;
                case 2:
                    this._handleTwoTouchesMove(e);
                    break;
                // case 3: handle_three_touches(e); break;
                // default: gesture_not_supported(e); break;
            }
            e.stopPropagation();
            e.preventDefault();
            e.returnValue = false;
        },

        /**
         * Обработчик касания одного пальца
         * @method _handleOneTouchStart
         * @private
         * @param e {TouchEvent} Объект события
         */
        _handleOneTouchStart: function (e) {
            var button = GWTK.gEngine.Renderer.MouseButton.Left;
            this.buttonPressedList[button] = true;


            var touch = e.touches[0];


            var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
            this.mouseEvent.x = realToCSSPixels * touch.clientX;
            this.mouseEvent.y = realToCSSPixels * touch.clientY;

            this.touches[0].x = this.touches[0].initX = this.mouseEvent.x;
            this.touches[0].y = this.touches[0].initY = this.mouseEvent.y;
            this.touches[0].active = true;

            var handlers = this._subscribers["onmousedown"];
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }

            handlers = this._subscribers["oncursormove"];
            for (i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }


        },
        /**
         * Обработчик касания двух пальцев
         * @method _handleTwoTouchesStart
         * @private
         * @param e {TouchEvent} Объект события
         */
        _handleTwoTouchesStart: function (e) {
            var button = GWTK.gEngine.Renderer.MouseButton.Right;
            this.buttonPressedList[button] = true;

            var firstTouch = e.touches[0];


            var touch = e.touches[1];

            var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;

            var x0 = realToCSSPixels * firstTouch.clientX;
            var y0 = realToCSSPixels * firstTouch.clientY;
            var x1 = realToCSSPixels * touch.clientX;
            var y1 = realToCSSPixels * touch.clientY;

            var x = 0.5 * (x0 + x1);
            var y = 0.5 * (y0 + y1);

            this.mouseEvent.x = x;
            this.mouseEvent.y = y;

            var handlers = this._subscribers["onmousedown"];
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }

            this.touches[1].x = x1;
            this.touches[1].y = y1;
            this.touches[1].active = true;

        },

        /**
         * Обработчик отпускания последнего пальца
         * @method _handleTwoTouchesStart
         * @private
         * @param e {TouchEvent} Объект события
         */
        _handleOneTouchEnd: function (e) {
            var button = GWTK.gEngine.Renderer.MouseButton.Left;
            this.buttonPressedList[button] = false;


            var touch = e.changedTouches[0];
            var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
            this.mouseEvent.x = realToCSSPixels * touch.clientX;
            this.mouseEvent.y = realToCSSPixels * touch.clientY;


            var initTouch = this.touches[0];
            initTouch.active = false;

            var deltaX = initTouch.initX - this.mouseEvent.x;
            var deltaY = initTouch.initY - this.mouseEvent.y;


            var handlers = this._subscribers["onmouseup"];
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }

            if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) < 5) {
                this._doubleTap();
            }
        },
        /**
         * Обработчик отпускания предпоследнего пальца
         * @method _handleTwoTouchesStart
         * @private
         */
        _handleTwoTouchesEnd: function () {
            var button = GWTK.gEngine.Renderer.MouseButton.Right;
            this.buttonPressedList[button] = false;

            this.touches[1].active = false;
            var handlers = this._subscribers["onmouseup"];
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }
        },

        /**
         * Обработчик перемещения одного пальца
         * @method _handleOneTouchMove
         * @private
         * @param e {TouchEvent} Объект события
         */
        _handleOneTouchMove: function (e) {
            var touch = e.touches[0];
            var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
            this.mouseEvent.x = realToCSSPixels * touch.clientX;
            this.mouseEvent.y = realToCSSPixels * touch.clientY;
            this.mouseEvent.freeMove = true;
            var handlers = this._subscribers["onmousemove"];
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }
            this.mouseEvent.freeMove = false;
        },
        /**
         * Обработчик перемещения двух пальцев
         * @method _handleTwoTouchesMove
         * @private
         * @param e {TouchEvent} Объект события
         */
        _handleTwoTouchesMove: function (e) {
            var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;

            var changedTouches = e.changedTouches;

            var x0 = realToCSSPixels * changedTouches[0].clientX;
            var deltaX0 = x0 - this.touches[0].x;
            var y0 = realToCSSPixels * changedTouches[0].clientY;
            var deltaY0 = y0 - this.touches[0].y;

            var x1 = realToCSSPixels * changedTouches[1].clientX;
            var deltaX1 = x1 - this.touches[1].x;
            var y1 = realToCSSPixels * changedTouches[1].clientY;
            var deltaY1 = y1 - this.touches[1].y;

            if ((deltaX0 * deltaX1 + deltaY0 * deltaY1) < 0) {
                var lX = this.touches[0].x - this.touches[1].x;
                var lY = this.touches[0].y - this.touches[1].y;
                var prevLength = Math.sqrt(lX * lX + lY * lY);

                lX = x0 - x1;
                lY = y0 - y1;

                var curLength = Math.sqrt(lX * lX + lY * lY);

                this._mouseWheel(curLength - prevLength);
            } else {
                var x = 0.5 * (x0 + x1);
                var y = 0.5 * (y0 + y1);
                this._mouseMove(x, y);
            }

            this.touches[0].x = x0;
            this.touches[0].y = y0;
            this.touches[1].x = x1;
            this.touches[1].y = y1;


        },

        /**
         * Обработчик эмуляции клика
         * @method _mouseClick
         * @private
         */
        _mouseClick: function () {
            var initTouch = this.touches[0];
            this.mouseEvent.x = initTouch.initX;
            this.mouseEvent.y = initTouch.initY;
            var handlers = this._subscribers["onmouseclick"];
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }
            clearTimeout(this._clickTimer);
            this._clickTimer = null;
        },
        /**
         * Обработчик двойного прикосновения (одним пальцем два подряд)
         * @method _doubleTap
         * @private
         */
        _doubleTap: function () {
            if (this._clickTimer == null) {
                this._clickTimer = setTimeout(this._mouseClick, 500);
            } else {
                clearTimeout(this._clickTimer);
                this._clickTimer = null;
                this._mouseWheel(600);
            }
        },
        /**
         * Обработчик эмуляции движения курсора по экрану
         * @method _mouseMove
         * @private
         * @param x {number} Координата Х в пикселах
         * @param y {number} Координата Y в пикселах
         */
        _mouseMove: function (x, y) {
            this.mouseEvent.x = x;
            this.mouseEvent.y = y;
            var handlers = this._subscribers["onmousemove"];
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }
        },
        /**
         * Обработчик эмуляции прокрутки колеса мыши
         * @method _mouseMove
         * @private
         * @param deltaLen {number} Величина вращения
         */
        _mouseWheel: function (deltaLen) {

            this.mouseEvent.wheelEvent.originalEvent = {wheelDelta: deltaLen};
            var handlers = this._subscribers["onmousewheel"];
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](this.mouseEvent);
            }
            this.mouseEvent.wheelEvent.originalEvent = null;
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
                if (ind != -1) {
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