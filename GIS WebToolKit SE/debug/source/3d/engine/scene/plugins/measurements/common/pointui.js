/****************************************** Тазин В.О. 24/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Класс вывода значения на экран                *
 *                                                                  *
 *******************************************************************/
"use strict";
import BoundingBox2D from '~/3d/engine/core/boundingvolumes/bbox2d';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    
    /**
     * Класс вывода значения на экран
     * @class GWTK.gEngine.Scene.PointUI
     * @constructor GWTK.gEngine.Scene.PointUI
     * @param parent {HTMLElement} Контейнер
     * @param className {string} Класс элемента
     */
    GWTK.gEngine.Scene.PointUI = function(parent, className) {
        this._element = document.createElement('div');
        this._element.className = className;
        parent.appendChild(this._element);
        
        this._style = this._element.style;
        this._curPoint = [0, 0];
        this._curValue = { value: 0, unit: 0, text: '' };
        
        this._bbox = new BoundingBox2D();
        this._pointList = [[0, 0], [0, 0]];
        this._positionIsDirty = false;
        this._contentIsDirty = false;
        
        this._curVisibility = true;
        this._visibilityIsDirty = false;
        
        this._curTextVisibility = true;
        this._textVisibilityIsDirty = false;
    };
    GWTK.gEngine.Scene.PointUI.prototype = {
        /**
         * Отобразить элемент
         * @method show
         * @public
         */
        show: function() {
            this._style.display = "block";
        },
        
        /**
         * Скрыть элемент
         * @method hide
         * @public
         */
        hide: function() {
            this._style.display = "none";
        },
        /**
         * Деструктор
         * @method destroy
         */
        destroy: function() {
            this._element.parentElement.removeChild(this._element);
        },
        /**
         * Получить геометрию узла
         * @method getBbox
         * @public
         * @return {BoundingBox2D} Геометрия узла
         */
        getBbox: function() {
            return this._bbox;
        },
        /**
         * Обновить геометрию узла
         * @method updateBbox
         * @public
         * @param point {array} Точка в экранных координатах
         */
        updateBbox: function(point) {
            var flag = false;
            if (point[0] !== this._curPoint[0]) {
                var halfWidth = Math.round(0.5 * parseInt(this._element.offsetWidth));
                this._curPoint[0] = point[0];
                this._pointList[0][0] = point[0] - halfWidth;
                this._pointList[1][0] = point[0] + halfWidth;
                flag = true;
            }
            if (point[1] !== this._curPoint[1]) {
                var halfHeight = Math.round(0.5 * parseInt(this._element.offsetHeight));
                this._curPoint[1] = point[1];
                this._pointList[0][1] = point[1] - halfHeight;
                this._pointList[1][1] = point[1] + halfHeight;
                flag = true;
            }
            if (flag) {
                this._bbox.fitPoints(this._pointList);
                this._positionIsDirty = true;
            }
        },
        /**
         * Установить значение
         * @method setValue
         * @public
         * @param value {object} Значение
         */
        setValue: function(value) {
            if (value !== undefined) {
                if (this._curValue.value !== value.value || this._curValue.unit !== value.unit) {
                    this._curValue.value = value.value;
                    this._curValue.unit = value.unit;
                    this._curValue.text = value.text;
                    this._contentIsDirty = true;
                }
            }
            this.setTextVisibility(value !== undefined);
        },
        /**
         * Обновить состояние элемента
         * @method updateElement
         * @public
         */
        updateElement: function() {
            if (this._visibilityIsDirty || this._textVisibilityIsDirty) {
                this._style.visibility = this._curVisibility && this._curTextVisibility ? 'visible' : 'hidden';
                this._visibilityIsDirty = false;
                this._textVisibilityIsDirty = false;
            }
            var cssToRealPixels = 1 / GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
            if (this._curVisibility && this._curTextVisibility) {
                if (this._positionIsDirty) {
                    this._style.left = cssToRealPixels * this._bbox.getMinimum()[0] + "px";
                    this._style.top = cssToRealPixels * this._bbox.getMinimum()[1] + "px";
                    this._positionIsDirty = false;
                }
                if (this._contentIsDirty) {
                    this._element.innerHTML = this._curValue.text;
                    this._contentIsDirty = false;
                }
            }
        },
        /**
         * Установить видимость элемента
         * @method setVisibility
         * @public
         * @param visible {boolean} Видимость
         */
        setVisibility: function(visible) {
            if (visible !== this._curVisibility) {
                this._curVisibility = visible;
                this._visibilityIsDirty = true;
            }
        },
        /**
         * Установить видимость текста
         * @method setTextVisibility
         * @public
         * @param visible {boolean} Видимость
         */
        setTextVisibility: function(visible) {
            if (visible !== this._curTextVisibility) {
                this._curTextVisibility = visible;
                this._textVisibilityIsDirty = true;
            }
        }
        
    };
    
    
    /**
     * Класс элемента удаления точки
     * @class GWTK.gEngine.Scene.ElementUI
     * @constructor GWTK.gEngine.Scene.ElementUI
     * @param parent {HTMLElement} Контейнер
     * @param className {string} Класс элемента
     */
    GWTK.gEngine.Scene.ElementUI = function(parent, className) {
        this._element = document.createElement('div');
        var innerElement = document.createElement('p');
        innerElement.innerHTML = "×";
        this._element.appendChild(innerElement);
        this._element.className = className;
        parent.appendChild(this._element);
        
        this._style = this._element.style;
        this._curPoint = [0, 0];
        
        this._bbox = new BoundingBox2D();
        this._pointList = [[0, 0], [0, 0]];
        this._positionIsDirty = false;
        
        this._curVisibility = true;
        this._visibilityIsDirty = false;
        this._index = -1;
        
    };
    GWTK.gEngine.Scene.ElementUI.prototype = {
        /**
         * Отобразить элемент
         * @method show
         * @public
         */
        show: function() {
            this._style.display = "block";
        },
        
        /**
         * Скрыть элемент
         * @method hide
         * @public
         */
        hide: function() {
            this._style.display = "none";
        },
        /**
         * Деструктор
         * @method destroy
         */
        destroy: function() {
            this._element.parentElement.removeChild(this._element);
        },
        /**
         * Получить геометрию узла
         * @method getBbox
         * @public
         * @return {BoundingBox2D} Геометрия узла
         */
        getBbox: function() {
            return this._bbox;
        },
        /**
         * Обновить геометрию узла
         * @method updateBbox
         * @public
         * @param point {array} Точка в экранных координатах
         */
        updateBbox: function(point) {
            var flag = false;
            if (point[0] !== this._curPoint[0]) {
                var halfWidth = Math.round(0.5 * parseInt(this._element.offsetWidth));
                this._curPoint[0] = point[0];
                this._pointList[0][0] = point[0] - halfWidth;
                this._pointList[1][0] = point[0] + halfWidth;
                flag = true;
            }
            if (point[1] !== this._curPoint[1]) {
                var halfHeight = Math.round(0.5 * parseInt(this._element.offsetHeight));
                this._curPoint[1] = point[1];
                this._pointList[0][1] = point[1] - halfHeight;
                this._pointList[1][1] = point[1] + halfHeight;
                flag = true;
            }
            if (flag) {
                this._bbox.fitPoints(this._pointList);
                this._positionIsDirty = true;
            }
        },
        /**
         * Обновить состояние элемента
         * @method updateElement
         * @public
         */
        updateElement: function() {
            if (this._visibilityIsDirty) {
                this._style.visibility = this._curVisibility ? 'visible' : 'hidden';
                this._visibilityIsDirty = false;
            }
            var cssToRealPixels = 1 / GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
            if (this._curVisibility) {
                if (this._positionIsDirty) {
                    this._style.left = cssToRealPixels * this._bbox.getMinimum()[0] + "px";
                    this._style.top = cssToRealPixels * this._bbox.getMinimum()[1] + "px";
                    this._positionIsDirty = false;
                }
            }
        },
        /**
         * Установить видимость элемента
         * @method setVisibility
         * @public
         * @param visible {boolean} Видимость
         */
        setVisibility: function(visible) {
            if (visible !== this._curVisibility) {
                this._curVisibility = visible;
                this._visibilityIsDirty = true;
            }
        },
        addElementHandler: function(eventType, handler) {
            this._element.addEventListener(eventType, function() {
                handler(this._index);
            }.bind(this));
        },
        
        setIndex: function(value) {
            this._index = value;
        },
        cursorActivate: function() {
            this._element.classList.add("measurement3d-cross-show");
        },
        cursorDeactivate: function() {
            this._element.classList.remove("measurement3d-cross-show");
        }
    };
}
