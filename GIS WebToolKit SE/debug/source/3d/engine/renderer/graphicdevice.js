/******************************************** Тазин В. 21/02/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Компонент управления ресурсами на видеокарте            *
 *                                                                  *
 *******************************************************************/
"use strict";
import { VertexAttributeType } from '~/3d/engine/core/geometry/vertexattribute';
import { IndicesType } from '~/3d/engine/core/geometry/indices';
import { DataTypeSize } from '~/3d/engine/renderer/enumfromcore';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO = window['devicePixelRatio'] || 1;
    
    /**
     * Компонент управления ресурсами на видеокарте
     * @class GWTK.gEngine.Renderer.GraphicDevice
     */
    GWTK.gEngine.Renderer.GraphicDevice = (function() {
        
        var GraphicDevice = function() {
            this.mValues = [];
            this.mOffsets = {};
        };
        
        GraphicDevice.prototype = {
            
            /**
             * Создать буферизованный мэш
             * @method createMeshBuffers
             * @public
             * @param mesh {Mesh} Геометрия мэша
             * @param shaderAttributes {Object} Коллеция шейдерных атрибутов (GWTK.gEngine.Renderer.ShaderVertexAttribute)
             * @param usagePattern {GWTK.gEngine.Renderer.enumUsagePattern} Шаблон буфера для контекста
             * @return {GWTK.gEngine.Renderer.MeshBuffers} Буферизованный мэш
             */
            createMeshBuffers: function(mesh, shaderAttributes, usagePattern) {
                var meshBuffers = new GWTK.gEngine.Renderer.MeshBuffers();
                var meshIndices = mesh.getIndices();
                if (meshIndices !== null) {
                    var indices;
                    if (meshIndices.getType() === IndicesType.uShort) {
                        indices = new Uint16Array(meshIndices.getValues());
                    }else if (meshIndices.getType() === IndicesType.uByte) {
                        indices = new Uint8Array(meshIndices.getValues());
                    }else if (meshIndices.getType() === IndicesType.uInt) {
                        indices = new Uint32Array(meshIndices.getValues());
                    }
                    
                    var indexBuffer = this.createIndexBuffer(usagePattern, meshIndices.getType());
                    indexBuffer.setData(indices);
                    meshBuffers.setIndexBuffer(indexBuffer);
                }
                
                var meshAttributes = mesh.getAttributes();
                for (var name in shaderAttributes) {
                    var shaderAttribute = shaderAttributes[name];
                    var attribute = meshAttributes[name];
                    
                    var vertexValues = null;
                    var type = attribute.getType();
                    var size = Array.isArray(attribute._values[0]) ? attribute._values[0].length : 1;
                    var values = this.mValues;
                    values.length = 0;
                    for (var i = 0; i < attribute._values.length; i++) {
                        var attrValue = attribute._values[i];
                        for (var j = 0; j < attrValue.length; j++) {
                            values.push(attrValue[j]);
                        }
                        // values = values.concat(attribute._values[i]);
                    }
                    if (type === VertexAttributeType.Float) {
                        vertexValues = new Float32Array(values);
                    }else if (type === VertexAttributeType.uShort) {
                        vertexValues = new Uint16Array(values);
                    }else if (type === VertexAttributeType.uByte) {
                        vertexValues = new Uint8Array(values);
                    }else if (type === VertexAttributeType.Byte) {
                        vertexValues = new Int8Array(values);
                    }else if (type === VertexAttributeType.Short) {
                        vertexValues = new Int16Array(values);
                    }
                    
                    var vertexBuffer = this.createVertexBuffer(usagePattern);
                    vertexBuffer.setData(vertexValues);
                    meshBuffers.setAttribute(shaderAttribute.getLocation(), new GWTK.gEngine.Renderer.WebGL.VertexBufferAttributeWebgl(vertexBuffer, type, size, 0, 0, 0));
                }
                return meshBuffers;
            },
            
            /**
             * Создать объединенный буферизованный мэш
             * @method createUnionMeshBuffers
             * @public
             * @param mesh {Mesh} Геометрия мэша
             * @param shaderAttributes {Object} Коллеция шейдерных атрибутов (GWTK.gEngine.Renderer.ShaderVertexAttribute)
             * @param usagePattern {GWTK.gEngine.Renderer.enumUsagePattern} Шаблон буфера для контекста
             * @return {GWTK.gEngine.Renderer.MeshBuffers} Буферизованный мэш
             */
            createUnionMeshBuffers: function(mesh, shaderAttributes, usagePattern) {
                var meshBuffers = new GWTK.gEngine.Renderer.MeshBuffers();
                
                var meshIndices = mesh.getIndices();
                if (meshIndices) {
                    var indices = null;
                    if (meshIndices.getType() === IndicesType.uShort) {
                        indices = new Uint16Array(meshIndices.getValues());
                    }else if (meshIndices.getType() === IndicesType.uByte) {
                        indices = new Uint8Array(meshIndices.getValues());
                    }else if (meshIndices.getType() === IndicesType.uInt) {
                        indices = new Uint32Array(meshIndices.getValues());
                    }
                    
                    var indexBuffer = this.createIndexBuffer(usagePattern, meshIndices.getType());
                    indexBuffer.setData(indices);
                    meshBuffers.setIndexBuffer(indexBuffer);
                }
                
                var meshAttributes = mesh.getAttributes();
                var vertexBuffer = this.createVertexBuffer(usagePattern);
                var byteSize = 0;
                var stride = 0;
                var length = 0;
                var offsets = this.mOffsets;
                for (var name in shaderAttributes) {
                    var shaderAttribute = shaderAttributes[name];
                    var attribute = meshAttributes[name];
                    if (attribute != null && Array.isArray(attribute._values) && attribute._values.length > 0) {
                        var type = attribute.getType();
                        var size = Array.isArray(attribute._values[0]) ? attribute._values[0].length : 1;
                        length = Math.max(attribute._values.length, length);
                        byteSize += attribute._values.length * size * DataTypeSize[type];
                        
                        offsets[name] = stride;
                        stride += size * DataTypeSize[type];
                    }
                }
                
                var buffer = new ArrayBuffer(byteSize);
                var view = new DataView(buffer);
                
                var byteOffset = 0;
                for (var i = 0; i < length; i++) {
                    for (name in shaderAttributes) {
                        attribute = meshAttributes[name];
                        if (attribute != null && Array.isArray(attribute._values) && attribute._values.length === length) {
                            var value = attribute._values[i];
                            type = attribute.getType();
                            var stepOffset = DataTypeSize[type];
                            if (Array.isArray(value)) {
                                for (var j = 0; j < value.length; j++) {
                                    switch (type) {
                                        case VertexAttributeType.Float:
                                            view.setFloat32(byteOffset, value[j], true);
                                            break;
                                        case VertexAttributeType.uShort:
                                            view.setUint16(byteOffset, value[j], true);
                                            break;
                                        case VertexAttributeType.uByte:
                                            view.setUint8(byteOffset, value[j]);
                                            break;
                                        case VertexAttributeType.Byte:
                                            view.setInt8(byteOffset, value[j]);
                                            break;
                                        case VertexAttributeType.Short:
                                            view.setInt16(byteOffset, value[j], true);
                                            break;
                                    }
                                    byteOffset += stepOffset;
                                }
                            }else{
                                switch (type) {
                                    case VertexAttributeType.Float:
                                        view.setFloat32(byteOffset, value, true);
                                        break;
                                    case VertexAttributeType.uShort:
                                        view.setUint16(byteOffset, value, true);
                                        break;
                                    case VertexAttributeType.uByte:
                                        view.setUint8(byteOffset, value);
                                        break;
                                    case VertexAttributeType.Byte:
                                        view.setInt8(byteOffset, value);
                                        break;
                                    case VertexAttributeType.Short:
                                        view.setInt16(byteOffset, value, true);
                                        break;
                                }
                                byteOffset += stepOffset;
                            }
                        }
                    }
                }
                vertexBuffer.setData(buffer);
                
                
                for (name in shaderAttributes) {
                    shaderAttribute = shaderAttributes[name];
                    attribute = meshAttributes[name];
                    if (attribute != null && Array.isArray(attribute._values) && attribute._values.length > 0) {
                        type = attribute.getType();
                        size = Array.isArray(attribute._values[0]) ? attribute._values[0].length : 1;
                        meshBuffers.setAttribute(shaderAttribute.getLocation(), new GWTK.gEngine.Renderer.WebGL.VertexBufferAttributeWebgl(vertexBuffer, type, size, 0, offsets[name], stride));
                    }
                }
                return meshBuffers;
            },
            
            /**
             * Создать индексный буфер
             * @method createIndexBuffer
             * @public
             * @param usagePatternWebgl {GWTK.gEngine.Renderer.enumUsagePattern} Шаблон буфера для контекста
             * @param type {IndicesType} Тип массива данных
             * @return {GWTK.gEngine.Renderer.WebGL.IndexBufferWebgl} Индексный буфер
             */
            createIndexBuffer: function(usagePatternWebgl, type) {
                return new GWTK.gEngine.Renderer.WebGL.IndexBufferWebgl(usagePatternWebgl, type);
            },
            /**
             * Создать вершинный буфер
             * @method createVertexBuffer
             * @public
             * @param usagePatternWebgl {GWTK.gEngine.Renderer.enumUsagePattern} Шаблон буфера для контекста
             * @return {GWTK.gEngine.Renderer.WebGL.VertexBufferWebgl} Вершинный буфер
             */
            createVertexBuffer: function(usagePatternWebgl) {
                return new GWTK.gEngine.Renderer.WebGL.VertexBufferWebgl(usagePatternWebgl);
            },
            
            /**
             * Создать шейдерную программу
             * @method createShaderProgram
             * @public
             * @param vertexShaderSource {string} Текст вершинного шейдера
             * @param fragmentShaderSource {string} Текст фрагментного шейдера
             * @return {GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl} Шейдерная программа
             */
            createShaderProgram: function(vertexShaderSource, fragmentShaderSource) {
                return new GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl(vertexShaderSource, fragmentShaderSource)
            },
            /**
             * Создать текстуру
             * @method createTexture2D
             * @public
             * @param description {GWTK.gEngine.Renderer.Texture2DDescription} Описание текстуры
             * @param img {object} Изображение
             * @param sampler {object|null} Шаблон использования текстуры в контексте (GWTK.gEngine.Renderer.TextureSamplers)
             * @return {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Текстура
             */
            createTexture2D: function(description, img, sampler) {
                var texture = new GWTK.gEngine.Renderer.WebGL.Texture2DWebgl(description, GWTK.gEngine.Renderer.enumTextureTarget.texture2d, sampler);
                texture.copyFromBuffer(img, 0, 0);
                return texture;
            },
            
            /**
             * Создать пустую текстуру
             * @method createEmptyTexture2D
             * @public
             * @param description {GWTK.gEngine.Renderer.Texture2DDescription} Описание текстуры
             * @param sampler {object|null} Шаблон использования текстуры в контексте (GWTK.gEngine.Renderer.TextureSamplers)
             * @return {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Текстура
             */
            createEmptyTexture2D: function(description, sampler) {
                return new GWTK.gEngine.Renderer.WebGL.Texture2DWebgl(description, GWTK.gEngine.Renderer.enumTextureTarget.texture2d, sampler);
            },
            
            /**
             * Создать буфер заполнения
             * @method createRenderBuffer
             * @public
             * @param description {GWTK.gEngine.Renderer.RenderBufferDescription} Описание буфера заполнения
             * @return {GWTK.gEngine.Renderer.WebGL.RenderBufferWebgl} Буфер заполнения
             */
            createRenderBuffer: function(description) {
                return new GWTK.gEngine.Renderer.WebGL.RenderBufferWebgl(description, GWTK.gEngine.Renderer.enumRenderBufferTarget.renderBuffer);
            }
        };
        return new GraphicDevice();
    }());
}