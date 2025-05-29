/******************************************** Тазин В. 26/11/18  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Класс буфера рисования                      *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Renderer.WebGL = GWTK.gEngine.Renderer.WebGL || {};


    /**
     * Класс буфера рисования
     * @class GWTK.gEngine.Renderer.WebGL.FramebufferWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.FramebufferWebgl
     */
    GWTK.gEngine.Renderer.WebGL.FramebufferWebgl = function () {
        var gl = GWTK.gEngine.Renderer.Context.getGL();
        this.mName = gl.createFramebuffer();
        this._colorAttachments = new GWTK.gEngine.Renderer.WebGL.ColorAttachmentsWebgl();
        this._dirtyFlags = GWTK.gEngine.Renderer.enumDirtyFlags.None;
        this._dirtyRenderBufferFlags = GWTK.gEngine.Renderer.enumDirtyRenderBufferFlags.None;
        this._depthAttachment = null;
        this._depthAttachmentRenderBuffer = null;
        this._depthStencilAttachment = null;
        this._depthStencilAttachmentRenderBuffer = null;

    };
    GWTK.gEngine.Renderer.WebGL.FramebufferWebgl.prototype = {

        /**
         * Активация буфера рисования в контексте
         * @method bind
         * @public
         */
        bind: function () {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.mName);
        },
        /**
         * Сброс буфера рисования в контексте
         * @method unbind
         * @public
         */
        unbind: function () {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        },
        /**
         * Обновить состояние буфера рисования
         * @method clean
         * @public
         */
        clean: function () {
            if (this._colorAttachments.getDirty()) {
                var colorAttachments = this._colorAttachments.getColorAttachments();
                for (var i = 0; i < colorAttachments.length; i++) {
                    if (colorAttachments[i].getDirty()) {
                        this.mAttach(GWTK.gEngine.Renderer.enumFramebufferAttachment['ColorAttachment' + i], colorAttachments[i].getTexture());
                        colorAttachments[i].setDirty(false);
                    }
                }
                this._colorAttachments.setDirty(false);
            }

            if (this._dirtyFlags !== GWTK.gEngine.Renderer.enumDirtyFlags.None) {
                if ((this._dirtyFlags & GWTK.gEngine.Renderer.enumDirtyFlags.DepthAttachment) === GWTK.gEngine.Renderer.enumDirtyFlags.DepthAttachment) {
                    this.mAttach(GWTK.gEngine.Renderer.enumFramebufferAttachment.DepthAttachment, this._depthAttachment);
                }
                if ((this._dirtyFlags & GWTK.gEngine.Renderer.enumDirtyFlags.DepthStencilAttachment) === GWTK.gEngine.Renderer.enumDirtyFlags.DepthStencilAttachment) {
                    this.mAttach(GWTK.gEngine.Renderer.enumFramebufferAttachment.DepthAttachment, this._depthStencilAttachment);
                    this.mAttach(GWTK.gEngine.Renderer.enumFramebufferAttachment.StensilAttachment, this._depthStencilAttachment);
                }
                this._dirtyFlags = GWTK.gEngine.Renderer.enumDirtyFlags.None;
            }
            if (this._dirtyRenderBufferFlags !== GWTK.gEngine.Renderer.enumDirtyRenderBufferFlags.None) {

                if ((this._dirtyRenderBufferFlags & GWTK.gEngine.Renderer.enumDirtyRenderBufferFlags.DepthAttachment) === GWTK.gEngine.Renderer.enumDirtyRenderBufferFlags.DepthAttachment) {
                    this.mAttachRenderBuffer(GWTK.gEngine.Renderer.enumFramebufferAttachment.DepthAttachment, this._depthAttachmentRenderBuffer);
                }
                if ((this._dirtyRenderBufferFlags & GWTK.gEngine.Renderer.enumDirtyRenderBufferFlags.DepthStencilAttachment) === GWTK.gEngine.Renderer.enumDirtyRenderBufferFlags.DepthStencilAttachment) {
                    this.mAttachRenderBuffer(GWTK.gEngine.Renderer.enumFramebufferAttachment.DepthAttachment, this._depthStencilAttachmentRenderBuffer);
                    this.mAttachRenderBuffer(GWTK.gEngine.Renderer.enumFramebufferAttachment.StensilAttachment, this._depthStencilAttachmentRenderBuffer);
                }
                this._dirtyRenderBufferFlags = GWTK.gEngine.Renderer.enumDirtyRenderBufferFlags.None;
            }
        },
        /**
         * Назначить текстуру вывода
         * @method mAttach
         * @private
         * @param attachPoint {GWTK.gEngine.Renderer.enumFramebufferAttachment} Место назначения текстуры
         * @param texture {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Объект текстуры
         */
        mAttach: function (attachPoint, texture) {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            if (texture != null) {
                var textureGL = texture.getName();
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl[attachPoint], gl.TEXTURE_2D, textureGL, 0);
            } else {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl[attachPoint], gl.TEXTURE_2D, null, 0);
            }
        },
        /**
         * Назначить буфер заполнения вывода
         * @method mAttachRenderBuffer
         * @private
         * @param attachPoint {GWTK.gEngine.Renderer.enumFramebufferAttachment} Место назначения буфера заполнения
         * @param renderBuffer {GWTK.gEngine.Renderer.WebGL.RenderBufferWebgl} Объект буфера заполнения
         */
        mAttachRenderBuffer: function (attachPoint, renderBuffer) {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            if (renderBuffer != null) {
                var renderBufferGL = renderBuffer.getName();
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl[attachPoint], gl.RENDERBUFFER, renderBufferGL);
            } else {
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl[attachPoint], gl.RENDERBUFFER, null);
            }
        },
        /**
         * Получить массив элементов назначения текстуры
         * @method getColorAttachments
         * @public
         * @return {GWTK.gEngine.Renderer.WebGL.ColorAttachmentsWebgl} Элемент вывода значения цвета
         */
        getColorAttachments: function () {
            return this._colorAttachments;
        },
        /**
         * Получить наначенную текстуру буфера глубины
         * @method getDepthAttachment
         * @public
         * @return {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Объект текстуры
         */
        getDepthAttachment: function () {
            return this._depthAttachment;
        },
        /**
         * Назначить текстуру буфера глубины
         * @method setDepthAttachment
         * @public
         * @param texture {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Объект текстуры
         */
        setDepthAttachment: function (texture) {
            if (this._depthAttachment !== texture) {
                this._depthAttachment = texture;
                this._dirtyFlags |= GWTK.gEngine.Renderer.enumDirtyFlags.DepthAttachment;
            }
        },

        /**
         * Получить наначенный буфер заполнения буфера глубины
         * @method getDepthAttachmentRenderBuffer
         * @public
         * @return {GWTK.gEngine.Renderer.WebGL.RenderBufferWebgl} Объект буфера заполнения
         */
        getDepthAttachmentRenderBuffer: function () {
            return this._depthAttachmentRenderBuffer;
        },
        /**
         * Назначить  буфер заполнения значений глубины
         * @method setDepthAttachmentRenderBuffer
         * @public
         * @param renderBuffer {GWTK.gEngine.Renderer.WebGL.RenderBufferWebgl} Объект буфера заполнения
         */
        setDepthAttachmentRenderBuffer: function (renderBuffer) {
            if (this._depthAttachmentRenderBuffer !== renderBuffer) {
                this._depthAttachmentRenderBuffer = renderBuffer;
                this._dirtyRenderBufferFlags |= GWTK.gEngine.Renderer.enumDirtyRenderBufferFlags.DepthAttachment;
            }
        },


        /**
         * Получить наначенный буфер заполнения буфера глубины и шаблона
         * @method getDepthStencilAttachmentRenderBuffer
         * @public
         * @return {GWTK.gEngine.Renderer.WebGL.RenderBufferWebgl} Объект буфера заполнения
         */
        getDepthStencilAttachmentRenderBuffer: function () {
            return this._depthStencilAttachmentRenderBuffer;
        },
        /**
         * Назначить буфер заполнения значений глубины и шаблона
         * @method setDepthStencilAttachmentRenderBuffer
         * @public
         * @param renderBuffer {GWTK.gEngine.Renderer.WebGL.RenderBufferWebgl} Объект буфера заполнения
         */
        setDepthStencilAttachmentRenderBuffer: function (renderBuffer) {
            if (this._depthStencilAttachmentRenderBuffer !== renderBuffer) {
                this._depthStencilAttachmentRenderBuffer = renderBuffer;
                this._dirtyRenderBufferFlags |= GWTK.gEngine.Renderer.enumDirtyRenderBufferFlags.DepthStencilAttachment;
            }
        },
        /**
         * Получить наначенную текстуру буфера глубины и шаблона
         * @method getDepthStencilAttachment
         * @public
         * @return {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Объект текстуры
         */
        getDepthStencilAttachment: function () {
            return this._depthStencilAttachment;
        },
        /**
         * Назначить текстуру буфера глубины и шаблона
         * @method setDepthStencilAttachment
         * @public
         * @param texture {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Объект текстуры
         */
        setDepthStencilAttachment: function (texture) {
            if (this._depthStencilAttachment !== texture) {
                this._depthStencilAttachment = texture;
                this._dirtyFlags |= GWTK.gEngine.Renderer.enumDirtyFlags.DepthStencilAttachment;
            }
        },
        /**
         * Считать пикселы из буфера
         * @method readPixels
         * @public
         * @param x{number} Координата по оси X
         * @param y{number} Координата по оси Y
         * @param arrayBuffer {ArrayBufferView} Буфер вывода результата
         */
        readPixels: function (x, y, arrayBuffer) {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, arrayBuffer);
        },
        /**
         * Очистить данные
         * @method cleanUp
         * @public
         */
        cleanUp: function () {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl.deleteFramebuffer(this.mName);
        }
    }
}