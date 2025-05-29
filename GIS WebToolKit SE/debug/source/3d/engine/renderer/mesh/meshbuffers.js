/******************************************** Тазин В. 21/02/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Класс буферизованного мэша                     *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Буферизованный мэш
     * @class GWTK.gEngine.Renderer.MeshBuffers
     * @constructor GWTK.gEngine.Renderer.MeshBuffers
     */
    GWTK.gEngine.Renderer.MeshBuffers = function () {
        this.attributes = {};
        this._indexBuffer = null;
        this._attributeCount = 0;
    };


    GWTK.gEngine.Renderer.MeshBuffers.prototype = {
        /**
         * Задать буфер индексов
         * @method setIndexBuffer
         * @public
         * @param indexBuffer {GWTK.gEngine.Renderer.WebGL.IndexBufferWebgl} Буфер индексов
         */
        setIndexBuffer: function (indexBuffer) {
            if (indexBuffer instanceof GWTK.gEngine.Renderer.WebGL.IndexBufferWebgl) {
                this._indexBuffer = indexBuffer;
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
         * Задать буфер вершинного атрибута
         * @method setIndexBuffer
         * @public
         * @param index {number} Номер (локация в шейдере)
         * @param vertexBufferAttribute {GWTK.gEngine.Renderer.WebGL.VertexBufferAttributeWebgl} Буфер вершинного атрибута
         */
        setAttribute: function (index, vertexBufferAttribute) {
            if (GWTK.gEngine.isNumeric(index) && vertexBufferAttribute instanceof GWTK.gEngine.Renderer.WebGL.VertexBufferAttributeWebgl) {
                if (this.attributes[index] === undefined) {
                    this._attributeCount++;
                }
                this.attributes[index] = vertexBufferAttribute;
            }
        },
        /**
         * Получить буферы вершинных атрибутов
         * @method getAttributes
         * @public
         * @return {object} Коллекция буферов вершинных атрибутов
         */
        getAttributes: function () {
            return this.attributes;
        },

        /**
         * Забрать данные из JSON объекта
         * @method fromJSON
         * @public
         * @param json {object} JSON объект
         * @param shaderAttributes {Object} Коллеция шейдерных атрибутов (GWTK.gEngine.Renderer.ShaderVertexAttribute)
         * @param usagePattern {GWTK.gEngine.Renderer.enumUsagePattern} Шаблон буфера для контекста
         */
        fromJSON: function (json, shaderAttributes, usagePattern) {
            usagePattern = usagePattern || GWTK.gEngine.Renderer.enumUsagePattern.StaticDraw;

            var arrayBuffer = json.arrayBuffer;

            var description = json.vertexArrayBufferDescription;
            var vertexBuffer = GWTK.gEngine.Renderer.GraphicDevice.createVertexBuffer(usagePattern);
            data = arrayBuffer.slice(description.startByte, description.startByte + description.byteLength);
            vertexBuffer.setData(data);

            var stride = description.stride;
            for (var name in shaderAttributes) {
                var shaderAttribute = shaderAttributes[name];
                var attribute = json.attributes[name];
                if (attribute != null) {
                    var type = attribute.type;
                    var size = attribute.numberOfComponents;
                    var offset = description.offsets[name];
                    var vertexAttribute = new GWTK.gEngine.Renderer.WebGL.VertexBufferAttributeWebgl(vertexBuffer, type, size, 0, offset, stride);
                    this.setAttribute(shaderAttribute.getLocation(), vertexAttribute);
                }
            }

            if (json.indices) {
                description = json.indexArrayBufferDescription;
                type = json.indices.type;
                var indexBuffer = GWTK.gEngine.Renderer.GraphicDevice.createIndexBuffer(usagePattern, type);
                var data = arrayBuffer.slice(description.startByte, description.startByte + description.byteLength);
                indexBuffer.setData(data);
                this.setIndexBuffer(indexBuffer);
            }

        }

    }
}