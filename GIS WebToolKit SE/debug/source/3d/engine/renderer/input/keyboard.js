/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент ввода с клавиатуры                    *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    /**
     * Список кодов клавиш
     * @enum GWTK.gEngine.Renderer.KeyboardCode
     */
    GWTK.gEngine.Renderer.KeyboardCode = Object.freeze({
        Unknown: null,
        Shift: 16,
        Control: 17,
        Alt: 18,
        WinLeft: 91,
        WinRight: 92,
        Menu: 93,
        F1: 112,
        F2: 113,
        F3: 114,
        F4: 115,
        F5: 116,
        F6: 117,
        F7: 118,
        F8: 119,
        F9: 120,
        F10: 121,
        F11: 122,
        F12: 123,
        Up: 38,
        Down: 40,
        Left: 37,
        Right: 39,
        Enter: 13,
        Escape: 27,
        Space: 32,
        Tab: 9,
        Backspace: 8,
        Insert: 45,
        Delete: 46,
        PageUp: 33,
        PageDown: 34,
        Home: 36,
        End: 35,
        CapsLock: 20,
        ScrollLock: 145,
        // PrintScreen: 'PrintScreen',
        Pause: 19,
        NumLock: 144,
        0: 48,
        1: 49,
        2: 50,
        3: 51,
        4: 52,
        5: 53,
        6: 54,
        7: 55,
        8: 56,
        9: 57,
        A: 65,
        B: 66,
        C: 67,
        D: 68,
        E: 69,
        F: 70,
        G: 71,
        H: 72,
        I: 73,
        J: 74,
        K: 75,
        L: 76,
        M: 77,
        N: 78,
        O: 79,
        P: 80,
        Q: 81,
        R: 82,
        S: 83,
        T: 84,
        U: 85,
        V: 86,
        W: 87,
        X: 88,
        Y: 89,
        Z: 90,
        Number0: 96,
        Number1: 97,
        Number2: 98,
        Number3: 99,
        Number4: 100,
        Number5: 101,
        Number6: 102,
        Number7: 103,
        Number8: 104,
        Number9: 105,
        Tilde: 192,
        Minus: 109,
        Plus: 107,
        Semicolon: 186,
        Equal: 187,
        Quote: 222,
        Comma: 188,
        Period: 190,
        Slash: 191,
        Backslash: 220
    });
    
    /**
     * Компонент ввода с клавиатуры
     * @class GWTK.gEngine.Renderer.KeyBoard
     * @constructor GWTK.gEngine.Renderer.KeyBoard
     */
    GWTK.gEngine.Renderer.KeyBoard = (function() {
        /**
         * Компонент ввода с клавиатуры
         * @class KeyBoard
         * @constructor KeyBoard
         */
        var KeyBoard = function() {
            this.keyPressedList = {};
            this.mKeyMove = [0, 0];
            this.mKeyRotate = [0, 0];
            
            this.keyboardEvent = {
                rotate: [0, 0],
                move: [0, 0],
                keyList: this.keyPressedList,
                clickedList: []
            };
            this._subscribers = [];
            
            this.ROTATE_FACTOR = 0.3;
            this.MOVE_FACTOR = 0.3;
            
            // document.onkeydown = this._keyDown.bind(this);
            document.addEventListener('keydown', this._keyDown.bind(this));
            // document.onkeyup = this._keyUp.bind(this);
            document.addEventListener('keyup', this._keyUp.bind(this));
            
            this.modes = {
                "SKELETON_MODE": false
            };
            
        };
        KeyBoard.prototype = {
            
            /**
             * Обновить состояние клавиатуры
             * @method update
             * @public
             * @param timeUpdate {object} Время обновления
             */
            update: function(timeUpdate) {
                
                var enumKeyboardCode = GWTK.gEngine.Renderer.KeyboardCode;
                
                var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
                var rotateValue = (this.ROTATE_FACTOR * timeUpdate.currentDelay) / realToCSSPixels;
                var moveValue = (this.MOVE_FACTOR * timeUpdate.currentDelay) / realToCSSPixels;
                
                var shiftKey = this.keyPressedList[enumKeyboardCode.Shift];
                var ctrlKey = this.keyPressedList[enumKeyboardCode.Control];
                if (this.keyPressedList[enumKeyboardCode.Left]) {
                    if (shiftKey) {
                        this.mKeyMove[0] += moveValue;
                    }else if (ctrlKey) {
                        this.mKeyRotate[0] -= rotateValue;
                    }
                } // "Стрелка влево"
                
                if (this.keyPressedList[enumKeyboardCode.Up]) {
                    if (shiftKey) {
                        this.mKeyRotate[1] += rotateValue;
                    }else if (ctrlKey) {
                        this.mKeyMove[1] += moveValue;
                    }
                    
                } // "Стрелка вверх"
                
                if (this.keyPressedList[enumKeyboardCode.Right]) {
                    if (shiftKey) {
                        this.mKeyMove[0] -= moveValue;
                    }else if (ctrlKey) {
                        this.mKeyRotate[0] += rotateValue;
                    }
                    
                } // "Стрелка вправо"
                
                if (this.keyPressedList[enumKeyboardCode.Down]) {
                    if (shiftKey) {
                        this.mKeyRotate[1] -= rotateValue;
                    }else if (ctrlKey) {
                        this.mKeyMove[1] -= moveValue;
                    }
                } // "Стрелка вниз"
                
                this.keyboardEvent.rotate[0] = this.mKeyRotate[0];
                this.keyboardEvent.rotate[1] = this.mKeyRotate[1];
                
                this.keyboardEvent.move[0] = this.mKeyMove[0];
                this.keyboardEvent.move[1] = this.mKeyMove[1];
                
                this.publish();
                
                this.mKeyRotate[0] = 0;
                this.mKeyRotate[1] = 0;
                this.mKeyMove[0] = 0;
                this.mKeyMove[1] = 0;
                
            },
            
            /**
             * Подписаться на событие клавиатуры
             * @method subscribe
             * @public
             * @param handler {Function} Функция-обработчик
             */
            subscribe: function(handler) {
                this._subscribers.push(handler);
            },
            /**
             * Отписаться от события клавиатуры
             * @method unsubscribe
             * @public
             * @param handler {Function} Функция-обработчик
             */
            unsubscribe: function(handler) {
                var subscriberIndex = this._subscribers.indexOf(handler);
                if (subscriberIndex !== -1) {
                    this._subscribers.splice(subscriberIndex, 1);
                }
            },
            /**
             * Очистить список подписчиков
             * @method clean
             * @public
             */
            clean: function() {
                this._subscribers.length = 0;
            },
            /**
             * Вызвать обработчики подписчиков
             * @method publish
             * @public
             */
            publish: function() {
                for (var i = 0; i < this._subscribers.length; i++) {
                    this._subscribers[i](this.keyboardEvent);
                }
                this.keyboardEvent.clickedList.length = 0;
            },
            
            /**
             * Обработчик нажатия клавиши
             * @method _keyDown
             * @private
             */
            _keyDown: function(event) {
                var keyCode = event.keyCode;
                this.keyPressedList[keyCode] = true;
                
                this.keyboardEvent.ctrlKey = event.ctrlKey;
                this.keyboardEvent.shiftKey = event.shiftKey;
            },
            /**
             * Обработчик отпускания клавиши
             * @method _keyUp
             * @private
             */
            _keyUp: function(event) {
                var keyCode = event.keyCode;
                this.keyPressedList[keyCode] = false;
                this.keyboardEvent.clickedList.push(keyCode);
                this.keyboardEvent.ctrlKey = event.ctrlKey;
                this.keyboardEvent.shiftKey = event.shiftKey;
            }
        };
        return new KeyBoard();
    })();
}
