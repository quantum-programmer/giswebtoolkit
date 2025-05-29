/******************************************** Тазин В. 21/02/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Класс атрибута внутри буфера на видеокарте             *
 *                                                                  *
 *******************************************************************/
"use strict";
import { DataTypeSize } from '~/3d/engine/renderer/enumfromcore';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Renderer.WebGL = GWTK.gEngine.Renderer.WebGL || {};

    /**
     * Класс атрибута внутри буфера на видеокарте
     * @class GWTK.gEngine.Renderer.WebGL.VertexBufferAttributeWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.VertexBufferAttributeWebgl
     * @param vertexBuffer {GWTK.gEngine.Renderer.WebGL.VertexBufferWebgl} Вершинный буфер контекста WebGL
     * @param componentDatatypeWebgl {VertexAttributeType} Тип значения
     * @param numberOfComponents {number} Количество компонентов атрибута вершин
     * @param normalize {number} Флаг нормализации в контексте
     * @param offsetInBytes {number} Смещение в байтах для первого компонента в массиве
     * @param strideInBytes {number} Шаг повторения в байтах
     */
    GWTK.gEngine.Renderer.WebGL.VertexBufferAttributeWebgl = function (vertexBuffer, componentDatatypeWebgl, numberOfComponents, normalize, offsetInBytes, strideInBytes) {

        this.mVertexBuffer = vertexBuffer;
        this.mComponentDatatypeWebgl = componentDatatypeWebgl;
        this.mNumberOfComponents = numberOfComponents;
        this.mNormalize = normalize || 0;
        this.mOffsetInBytes = offsetInBytes || 0;
        this.mStrideInBytes = strideInBytes ? strideInBytes : DataTypeSize[this.mComponentDatatypeWebgl] * this.mNumberOfComponents;
    };

    GWTK.gEngine.Renderer.WebGL.VertexBufferAttributeWebgl.prototype = {
        /**
         * Получить количество вершин в буфере
         * @method getItemCount
         * @public
         * @return {number} Количество вершин в буфере
         */
        getItemCount: function () {
            return Math.floor(this.mVertexBuffer.getSize() / this.mStrideInBytes);
        },
        /**
         * Привязать атрибут к определенной локации
         * @method  bindTo
         * @param locPosition {number} Локация атрибута
         */
        bindTo: function (locPosition) {
            this.mVertexBuffer.bind();
            GWTK.gEngine.Renderer.Context.setVertexAttribPointer(locPosition, this.mNumberOfComponents, this.mComponentDatatypeWebgl, this.mNormalize, this.mStrideInBytes, this.mOffsetInBytes);
        },
        /**
         * Удаление внутренних элементов
         * @method destroy
         * @public
         */
        destroy: function () {
            this.mVertexBuffer.destroy();
        }
    };
}