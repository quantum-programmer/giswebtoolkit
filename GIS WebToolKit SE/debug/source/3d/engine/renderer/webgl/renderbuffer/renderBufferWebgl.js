/******************************************** Тазин В. 23/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Класс буфера заполнения контекста                 *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Renderer.WebGL = GWTK.gEngine.Renderer.WebGL || {};

    /**
     * Класс буфера заполнения контекста
     * @class GWTK.gEngine.Renderer.WebGL.RenderBufferWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.RenderBufferWebgl
     * @param description {GWTK.gEngine.Renderer.RenderBufferDescription} Объект параметров буфера заполнения
     * @param renderBufferTarget {GWTK.gEngine.Renderer.enumRenderBufferTarget} Цель привязки буфера заполнения в контексте
     */
    GWTK.gEngine.Renderer.WebGL.RenderBufferWebgl = function (description, renderBufferTarget) {
        var gl = GWTK.gEngine.Renderer.Context.getGL();
        if (gl == null) {
            console.warn('Invalid input data');
            return {};
        }
        this.name = gl.createRenderbuffer();
        this._description = description;
        this.mTarget = renderBufferTarget;

        this.bind();
        var TypeConverter = GWTK.gEngine.Renderer.WebGL.TypeConverterWebgl;
        // размер буфера глубины будет совпадать с размером текстуры

        gl.renderbufferStorage(gl[this.mTarget], gl[TypeConverter.toRenderBufferInternalFormat(description.getFormat())], description.getWidth(), description.getHeight());
        this.unbind();
    };

    GWTK.gEngine.Renderer.WebGL.RenderBufferWebgl.prototype = {

        /**
         * Получить имя буфера заполнения
         * @method getName
         * @public
         * @return {WebGLRenderbuffer} Ссылка на текстуру в контексте
         */
        getName: function () {
            return this.name;
        },
        /**
         * Получить описание буфера заполнения
         * @method getDescription
         * @public
         * @return {GWTK.gEngine.Renderer.RenderBufferDescription} Объект параметров буфера заполнения
         */
        getDescription: function () {
            return this._description;
        },

        /**
         * Активация буфера заполнения
         * @method bind
         * @public
         */
        bind: function () {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl.bindRenderbuffer(gl[this.mTarget], this.name);
        },
        /**
         * Декативация буфера заполнения
         * @method unbind
         * @public
         */
        unbind: function () {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl.bindRenderbuffer(gl[this.mTarget], null);
        },

        /**
         * Очистить данные
         * @method cleanUp
         * @public
         */
        cleanUp: function () {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl.deleteRenderbuffer(this.name);
        }

    }
}