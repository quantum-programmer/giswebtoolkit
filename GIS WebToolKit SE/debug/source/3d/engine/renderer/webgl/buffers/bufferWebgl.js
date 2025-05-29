/******************************************** Тазин В. 23/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Описание буферов контекста WebGL                     *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Renderer.WebGL = GWTK.gEngine.Renderer.WebGL || {};

    /**
     * Класс буфера контекста WebGL
     * @class GWTK.gEngine.Renderer.WebGL.BufferWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.BufferWebgl
     * @param targetWebgl {GWTK.gEngine.Renderer.enumWebglTarget} Целевое назначение буфера
     * @param usagePatternWebgl {GWTK.gEngine.Renderer.enumUsagePattern} Шаблон частоты изменения значений буфера
     */
    GWTK.gEngine.Renderer.WebGL.BufferWebgl = function (targetWebgl, usagePatternWebgl) {
        var gl = GWTK.gEngine.Renderer.Context.getGL();
        this._webGLBuffer = gl.createBuffer();
        this._target = targetWebgl;
        this._size = 0;
        this.mUsagePattern = gl[usagePatternWebgl];
    };
    GWTK.gEngine.Renderer.WebGL.BufferWebgl.prototype = {
        /**
         * Получить ссылку на буфер в контексте
         * @method getWebGLbuffer
         * @public
         * @return {WebGLBuffer} Ссылка на буфер в контексте
         */
        getWebGLbuffer: function () {
            return this._webGLBuffer;
        },
        /**
         * Получить целевое назначение буфера
         * @method getTarget
         * @public
         * @return {string} Целевое назначение буфера
         */
        getTarget: function () {
            return this._target;
        },

        /**
         * Получить размер буфера
         * @method getSize
         * @public
         * @return {number} Размер буфера в байтах
         */
        getSize: function () {
            return this._size;
        },
        /**
         * Записать данные в буфер
         * @method setData
         * @public
         * @param data{ArrayBufferView} Типизированный массив данных
         */
        setData: function (data) {
            if (typeof data != 'number' && (typeof data != 'object' || !(data instanceof ArrayBuffer || data.buffer instanceof ArrayBuffer))) {
                return;
            }
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            this.bind();
            gl.bufferData(gl[this._target], data, this.mUsagePattern);
            this._size = data.byteLength;
        },
        /**
         * Записать пустые данные в буфер
         * @method setEmptyData
         * @public
         * @param size{number} Размер в байтах
         */
        setEmptyData: function (size) {
            if (typeof size != 'number') {
                return;
            }
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            this.bind();
            gl.bufferData(gl[this._target], size, this.mUsagePattern);
            this._size = size;
        },
        /**
         * Записать данные в буфер с указанием смещения в буфере
         * @method setSubData
         * @public
         * @param data{ArrayBufferView} Типизированный массив данных
         * @param offset{number} Смещение в байтах, с которого начать замещение данных
         */
        setSubData: function (data, offset) {
            if (offset + data.byteLength > this._size) {
                return;
            }
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            this.bind();
            gl.bufferSubData(gl[this._target], offset, data);
        },
        /**
         * Активация буфера в контексте
         * @method bind
         * @public
         */
        bind: function () {
            GWTK.gEngine.Renderer.Context.bindBuffer(this._target, this._webGLBuffer);
        },
        /**
         * Деактивация буфера в контексте
         * @method unbind
         * @public
         */
        unbind: function () {
            GWTK.gEngine.Renderer.Context.bindBuffer(this._target, null);
        },
        /**
         * Удаление буфера из контекста
         * @method destroy
         * @public
         */
        destroy: function () {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl.deleteBuffer(this._webGLBuffer);
        }
    };

    /**
     * Класс вершинного буфера контекста WebGL
     * @class GWTK.gEngine.Renderer.WebGL.VertexBufferWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.VertexBufferWebgl
     * @param usagePatternWebgl {GWTK.gEngine.Renderer.enumUsagePattern} Шаблон частоты изменения значений буфера
     */
    GWTK.gEngine.Renderer.WebGL.VertexBufferWebgl = function (usagePatternWebgl) {
        GWTK.gEngine.Renderer.WebGL.BufferWebgl.call(this, GWTK.gEngine.Renderer.enumWebglTarget.ArrayBuffer, usagePatternWebgl);
    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Renderer.WebGL.VertexBufferWebgl, GWTK.gEngine.Renderer.WebGL.BufferWebgl);

    /**
     * Класс буфера индексов контекста WebGL
     * @class GWTK.gEngine.Renderer.WebGL.IndexBufferWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.IndexBufferWebgl
     * @param usagePatternWebgl {GWTK.gEngine.Renderer.enumUsagePattern} Шаблон частоты изменения значений буфера
     * @param type {IndicesType} Тип значений буфера
     */
    GWTK.gEngine.Renderer.WebGL.IndexBufferWebgl = function (usagePatternWebgl, type) {
        GWTK.gEngine.Renderer.WebGL.BufferWebgl.call(this, GWTK.gEngine.Renderer.enumWebglTarget.ElementArrayBuffer, usagePatternWebgl, type);
        this.type = type;
    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Renderer.WebGL.IndexBufferWebgl, GWTK.gEngine.Renderer.WebGL.BufferWebgl);

    /**
     * Получить тип значений буфера
     * @method getType
     * @public
     * @return {string} Тип значений буфера
     */
    GWTK.gEngine.Renderer.WebGL.IndexBufferWebgl.prototype.getType = function () {
        return this.type;
    };
}