/****************************************** Тазин В.О. 10/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Класс текстуры контекста                      *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Renderer.WebGL = GWTK.gEngine.Renderer.WebGL || {};

    /**
     * Класс текстуры контекста
     * @class GWTK.gEngine.Renderer.WebGL.Texture2DWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.Texture2DWebgl
     * @param description {GWTK.gEngine.Renderer.Texture2DDescription} Объект параметров текстуры
     * @param textureTarget {GWTK.gEngine.Renderer.enumTextureTarget} Цель привязки текстуры в контексте
     * @param sampler {object|null} Шаблон использования текстуры в контексте (GWTK.gEngine.Renderer.TextureSamplers)
     */
    GWTK.gEngine.Renderer.WebGL.Texture2DWebgl = function (description, textureTarget, sampler) {
        var gl = GWTK.gEngine.Renderer.Context.getGL();
        if (gl == null) {
            console.warn('Invalid input data');
            return {};
        }

        sampler = sampler || GWTK.gEngine.Renderer.TextureSamplers.linearClamp;

        this.name = gl.createTexture();
        this._description = description;

        this.mLastTextureUnit = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) - 1;
        this.mTarget = textureTarget;
        var TypeConverter = GWTK.gEngine.Renderer.WebGL.TypeConverterWebgl;
        this._bindToLastTextureUnit();
        gl.texImage2D(gl[this.mTarget], 0, gl[TypeConverter.toPixelInternalFormat(description.getFormat())], this._description.getWidth(), this._description.getHeight(), 0, gl[TypeConverter.toPixelInternalFormat(description._format)], gl[TypeConverter.toPixelType(description._format)], null);
        this.applySampler(sampler);
        this.unbind();
    };

    GWTK.gEngine.Renderer.WebGL.Texture2DWebgl.prototype = {

        /**
         * Получить имя текстуры
         * @method getName
         * @public
         * @return {WebGLTexture} Ссылка на текстуру в контексте
         */
        getName: function () {
            return this.name;
        },
        /**
         * Получить описание текстуры
         * @method getDescription
         * @public
         * @return {GWTK.gEngine.Renderer.Texture2DDescription} Описание текстуры
         */
        getDescription: function () {
            return this._description;
        },
        /**
         * Привязка к крайней текстурной единице в контексте
         * @method _bindToLastTextureUnit
         * @public
         */
        _bindToLastTextureUnit: function () {
            GWTK.gEngine.Renderer.Context.setActiveTexture(this.mLastTextureUnit);
            this.bind();
        },
        /**
         * Активация текстуры в активной текстурной единице контекста
         * @method bind
         * @public
         */
        bind: function () {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl.bindTexture(gl[this.mTarget], this.name);
        },
        /**
         * Декативация текстуры в активной текстурной единице контекста
         * @method unbind
         * @public
         */
        unbind: function () {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl.bindTexture(gl[this.mTarget], null);
        },
        /**
         * Задать параметры обработки текстуры
         * @method applySampler
         * @public
         * @param sampler {object|null} Шаблон использования текстуры в контексте (GWTK.gEngine.Renderer.TextureSamplers)
         */
        applySampler: function (sampler) {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            for (var k in sampler) {
                gl.texParameteri(gl[this.mTarget], gl[k], gl[sampler[k]]);
            }
        },
        /**
         * Создать уменьшенные копии текстуры
         * @method _generateMipmaps
         * @private
         */
        _generateMipmaps: function () {
            if (this._description.getGenerateMipmaps()) {
                var gl = GWTK.gEngine.Renderer.Context.getGL();
                gl.generateMipmap(gl[this.mTarget]);
            }
        },
        /**
         * Загрузить изображение
         * @method copyFromBuffer
         * @public
         * @param pixelBuffer{object} Изображение
         * @param xOffset{number} Смещение по оси X
         * @param yOffset{number} Смещение по оси Y
         * @param [format]{GWTK.gEngine.Renderer.enumTextureFormat} Формат изображения
         * @param [rowAlignment]{number} Выравнивание строк
         * @param [width]{number} Ширина изображения
         * @param [height]{number} Высота изображения
         */
        copyFromBuffer: function (pixelBuffer, xOffset, yOffset, format, rowAlignment, width, height) {
            format = format || this._description.getFormat();

            var TypeConverter = GWTK.gEngine.Renderer.WebGL.TypeConverterWebgl;
            var mFormat = TypeConverter.toPixelInternalFormat(format);
            var mType = TypeConverter.toPixelType(format);

            this._bindToLastTextureUnit();
            var context = GWTK.gEngine.Renderer.Context;
            var gl = context.getGL();
            context.setPixelStore('UNPACK_ALIGNMENT', rowAlignment || 4);
            if (pixelBuffer instanceof HTMLImageElement || (typeof ImageBitmap === 'function' && pixelBuffer instanceof ImageBitmap)) {
                gl.texSubImage2D(gl[this.mTarget], 0, xOffset, yOffset, gl[mFormat], gl[mType], pixelBuffer);
            } else {
                width = width || this._description.getWidth();
                height = height || this._description.getHeight();
                gl.texSubImage2D(gl[this.mTarget], 0, xOffset, yOffset, width, height, gl[mFormat], gl[mType], pixelBuffer);
            }

            this._generateMipmaps();
            this.unbind();
        },
        /**
         * Очистить память
         * @method cleanUp
         * @public
         */
        cleanUp: function () {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl.deleteTexture(this.name);
        },
        /**
         * Загрузить изображение из буфера рисования
         * @method copyFromActiveFrameBuffer
         * @public
         * @param [level]{number} Уровень изображения
         * @param [xOffset]{number} Смещение в текстуре по оси X
         * @param [yOffset]{number} Смещение в текстуре по оси Y
         * @param [x]{number} X-координата левого нижнего угла области чтения буфера рисования
         * @param [y]{number} Y-координата левого нижнего угла области чтения буфера рисования
         */
        copyFromActiveFrameBuffer: function (level, xOffset, yOffset, x, y) {
            level = level || 0;
            xOffset = xOffset || 0;
            yOffset = yOffset || 0;
            x = x || 0;
            y = y || 0;
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            this._bindToLastTextureUnit();
            gl.copyTexSubImage2D(gl[this.mTarget], level, xOffset, yOffset, x, y, this._description.getWidth(), this._description.getHeight());
            this._generateMipmaps();
            this.unbind();

        }
    }
}
