/******************************************** Тазин В. 23/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Описание униформов контекста WebGL                   *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Renderer.WebGL = GWTK.gEngine.Renderer.WebGL || {};


    /**
     * Класс простого униформа контекста WebGL
     * @class GWTK.gEngine.Renderer.WebGL.UniformWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.UniformWebgl
     * @param name {string} Имя униформа
     * @param type {GWTK.gEngine.Renderer.enumUniformType} Тип униформа
     * @param location {WebGLUniformLocation} Локация униформа в контексте
     * @param program {GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl} Программа униформа
     */
    GWTK.gEngine.Renderer.WebGL.UniformWebgl = function (name, type, location, program) {
        this._value = null;
        this.mName = name;
        this.mType = type;
        this.mLocation = location;
        this.mShaderProgram = program;
        this.mDirty = false;
    };
    GWTK.gEngine.Renderer.WebGL.UniformWebgl.prototype = {
        /**
         * Установить значение униформа
         * @method setValue
         * @public
         * @param value{Object} Значение
         */
        setValue: function (value) {
            if (this._value != value) {
                this._value = value;
                this.mDirty = true;
                this.mShaderProgram.notifyDirty(this);
            }
        },
        /**
         * Получить значение униформа
         * @method getValue
         * @public
         * @return {Object} Значение
         */
        getValue: function () {
            return this._value;
        },
        /**
         * Обновить значение униформа в контексте
         * @method clean
         * @public
         */
        clean: function () {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl[this.mType](this.mLocation, this._value);
            this.mDirty = false;
        }
    };

    /**
     * Класс векторного униформа контекста WebGL
     * @class GWTK.gEngine.Renderer.WebGL.UniformVectorWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.UniformVectorWebgl
     * @param name {string} Имя униформа
     * @param type {GWTK.gEngine.Renderer.enumUniformType} Тип униформа
     * @param location {WebGLUniformLocation} Локация униформа в контексте
     * @param program {GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl} Программа униформа
     */
    GWTK.gEngine.Renderer.WebGL.UniformVectorWebgl = function (name, type, location, program) {
        GWTK.gEngine.Renderer.WebGL.UniformWebgl.call(this, name, type, location, program);
        this._value = [];
    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Renderer.WebGL.UniformVectorWebgl, GWTK.gEngine.Renderer.WebGL.UniformWebgl);
    /**
     * Установить значение униформа
     * @method setValue
     * @public
     * @param value{array} Значение
     */
    GWTK.gEngine.Renderer.WebGL.UniformVectorWebgl.prototype.setValue = function (value) {
        if (Array.isArray(value)) {
            var update = false;
            for (var i = 0; i < value.length; i++) {
                if (this._value[i] !== value[i]) {
                    this._value[i] = value[i];
                    update = true;
                }
            }
            this.mDirty = this.mDirty || update;
            if (update) {
                this.mShaderProgram.notifyDirty(this);
            }
        }
    };

    /**
     * Класс матричного униформа контекста WebGL
     * @class GWTK.gEngine.Renderer.WebGL.UniformMatrixWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.UniformMatrixWebgl
     * @param name {string} Имя униформа
     * @param type {GWTK.gEngine.Renderer.enumUniformType} Тип униформа
     * @param location {WebGLUniformLocation} Локация униформа в контексте
     * @param program {GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl} Программа униформа
     */
    GWTK.gEngine.Renderer.WebGL.UniformMatrixWebgl = function (name, type, location, program) {
        GWTK.gEngine.Renderer.WebGL.UniformVectorWebgl.call(this, name, type, location, program);
    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Renderer.WebGL.UniformMatrixWebgl, GWTK.gEngine.Renderer.WebGL.UniformVectorWebgl);
    /**
     * Обновить значение униформа в контексте
     * @method clean
     * @public
     */
    GWTK.gEngine.Renderer.WebGL.UniformMatrixWebgl.prototype.clean = function () {
        var gl = GWTK.gEngine.Renderer.Context.getGL();
        gl[this.mType](this.mLocation, false, this._value);
        this.mDirty = false;
    };
}