/****************************************** Тазин В.О. 23/04/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Класс коллекции вершинных атрибутов               *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Renderer.WebGL = GWTK.gEngine.Renderer.WebGL || {};

    /**
     * Класс коллекции параметров вершин
     * @class GWTK.gEngine.Renderer.WebGL.VertexCollectionWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.VertexCollectionWebgl
     */
    GWTK.gEngine.Renderer.WebGL.VertexCollectionWebgl = function () {
        this._indexBuffer = null;
        this._maxVertexCount = 0;
        this.mAttributes = {};
    };

    GWTK.gEngine.Renderer.WebGL.VertexCollectionWebgl.prototype = {

        /**
         * Активация вершинных атрибутов и буфера индексов в контексте
         * @method bind
         * @public
         */
        bind: function () {
            var context = GWTK.gEngine.Renderer.Context;
            for (var k in this.mAttributes) {
                k = parseInt(k);
                var vertexBufferAttribute = this.mAttributes[k];
                if (vertexBufferAttribute != null) {
                    context.enableVertexAttribute(k, true);
                    vertexBufferAttribute.bindTo(k);
                } else {
                    context.enableVertexAttribute(k, false);
                }
            }
            if (this._indexBuffer) {
                this._indexBuffer.bind();
            }
        },
        /**
         * Активация вершинных атрибутов и буфера индексов однотипных объектов
         * @method bindInstanced
         * @public
         * @param ext {ANGLE_instanced_arrays} Расширение отрисовки однотипных объектов
         */
        bindInstanced: function (ext) {
            this.bind();
            for (var loc in this.mAttributes) {
                loc = parseInt(loc);
                ext.vertexAttribDivisorANGLE(loc, 1);
            }
        },
        /**
         * Деактивация вершинных атрибутов и буфера индексов однотипных объектов
         * @method unbindInstanced
         * @public
         * @param ext {ANGLE_instanced_arrays} Расширение отрисовки однотипных объектов
         */
        unbindInstanced: function (ext) {
            var context = GWTK.gEngine.Renderer.Context;
            for (var k in this.mAttributes) {
                k = parseInt(k);
                context.enableVertexAttribute(k, false);
                ext.vertexAttribDivisorANGLE(k, 0);
            }
        },

        /**
         * Получить количество вершин
         * @method getVertexCount
         * @public
         * @return {number} Количество вершин
         */
        getVertexCount: function () {
            return this._maxVertexCount;
        },
        /**
         * Обновить количество вершин
         * @method _updateVertexCount
         * @private
         */
        _updateVertexCount: function () {
            this._maxVertexCount = 0;
            for (var k in this.mAttributes) {
                if (this.mAttributes[k] != null) {
                    this._maxVertexCount = Math.max(this._maxVertexCount, this.mAttributes[k].getItemCount());
                }
            }
        },
        /**
         * Получить буфер индексов
         * @method getIndexBuffer
         * @public
         * @return {GWTK.gEngine.Renderer.WebGL.IndexBufferWebgl} Буфер индексов
         */
        getIndexBuffer: function () {
            return this._indexBuffer;
        },
        /**
         * Задать буфер индексов
         * @method setIndexBuffer
         * @public
         * @param indexBuffer{GWTK.gEngine.Renderer.WebGL.IndexBufferWebgl} Буфер индексов
         */
        setIndexBuffer: function (indexBuffer) {
            this._indexBuffer = indexBuffer;
        },
        /**
         * Задать вершинный атрибут
         * @method setAttribute
         * @public
         * @param index {number} Номер (локация в шейдере)
         * @param vertexBufferAttribute {GWTK.gEngine.Renderer.WebGL.VertexBufferAttributeWebgl|null} Буфер вершинного атрибута
         */
        setAttribute: function (index, vertexBufferAttribute) {
            if (this.mAttributes[index] !== vertexBufferAttribute) {
                this.mAttributes[index] = vertexBufferAttribute;
                this._updateVertexCount();
            }
        },

        /**
         * Удаление внутренних элементов
         * @method destroy
         * @public
         */
        destroy: function () {
            for (var k in this.mAttributes) {
                var vertexBufferAttribute = this.mAttributes[k];
                if (vertexBufferAttribute) {
                    vertexBufferAttribute.destroy();
                }
                this.mAttributes[k] = null;
            }
            this.bind(); //Убираем ссылки на атрибуты
            if (this._indexBuffer !== null) {
                this._indexBuffer.destroy();
                this._indexBuffer = null;
            }
            this._maxVertexCount = 0;
        }
    };
}
