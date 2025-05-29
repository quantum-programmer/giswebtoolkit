/******************************************** Тазин В. 23/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Класс назначения текстуры                   *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Renderer.WebGL = GWTK.gEngine.Renderer.WebGL || {};

    /**
     * Класс элемента вывода значения цвета
     * @class GWTK.gEngine.Renderer.WebGL.ColorAttachmentsWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.ColorAttachmentsWebgl
     */
    GWTK.gEngine.Renderer.WebGL.ColorAttachmentsWebgl = function () {
        this._colorAttachments = [];
        this._dirty = false;
        this.mCount = 0;
    };
    GWTK.gEngine.Renderer.WebGL.ColorAttachmentsWebgl.prototype = {
        /**
         * Получить назначенную текстуру
         * @method getColorAttachment
         * @public
         * @return {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Объект текстуры
         */
        getColorAttachment: function (index) {
            return this._colorAttachments[index].getTexture();
        },
        /**
         * Установить текстуру
         * @method setColorAttachment
         * @public
         * @param index {number} Номер элемента в массиве
         * @param texture {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Объект текстуры
         */
        setColorAttachment: function (index, texture) {
            if (this._colorAttachments[index] == null) {
                this._colorAttachments[index] = new GWTK.gEngine.Renderer.WebGL.ColorAttachmentWebgl();
            }
            if (this._colorAttachments[index].getTexture() !== texture) {
                this._colorAttachments[index].setTexture(texture);
                this._colorAttachments[index].setDirty(true);
                this._dirty = true;
            }
        },
        /**
         * Получить флаг необходимости обновления
         * @method getDirty
         * @public
         * @return {boolean} Флаг необходимости обновления
         */
        getDirty: function () {
            return this._dirty;
        },
        /**
         * Установить флаг необходимости обновления
         * @method setDirty
         * @public
         * @param value {boolean} Флаг необходимости обновления
         */
        setDirty: function (value) {
            this._dirty = value;
        },
        /**
         * Получить массив элементов назначения текстуры
         * @method getColorAttachments
         * @public
         * @return {array} Массив элементов назначения текстуры
         */
        getColorAttachments: function () {
            return this._colorAttachments;
        }
    };

    /**
     * Класс элемента назначения текстуры
     * @class GWTK.gEngine.Renderer.WebGL.ColorAttachmentWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.ColorAttachmentWebgl
     */
    GWTK.gEngine.Renderer.WebGL.ColorAttachmentWebgl = function () {
        this._texture = null;
        this._dirty = false;
    };
    GWTK.gEngine.Renderer.WebGL.ColorAttachmentWebgl.prototype = {
        /**
         * Получить текстуру
         * @method getTexture
         * @public
         * @return {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Объект текстуры
         */
        getTexture: function () {
            return this._texture;
        },
        /**
         * Установить текстуру
         * @method setTexture
         * @public
         * @param texture {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Объект текстуры
         */
        setTexture: function (texture) {
            this._texture = texture;
        },
        /**
         * Получить флаг необходимости обновления
         * @method getDirty
         * @public
         * @return {boolean} Флаг необходимости обновления
         */
        getDirty: function () {
            return this._dirty;
        },
        /**
         * Установить флаг необходимости обновления
         * @method setDirty
         * @public
         * @param value {boolean} Флаг необходимости обновления
         */
        setDirty: function (value) {
            this._dirty = value;
        }
    }

}