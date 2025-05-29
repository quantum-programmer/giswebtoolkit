/******************************************** Тазин В. 23/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *         Описание текстурной единицы контекста WebGL              *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Renderer.WebGL = GWTK.gEngine.Renderer.WebGL || {};

    /**
     * Класс текстурной единицы контекста WebGL
     * @class GWTK.gEngine.Renderer.WebGL.TextureUnitWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.TextureUnitWebgl
     * @param index {number} Индекс текстурной единицы в коллекции
     * @param observer {GWTK.gEngine.Renderer.WebGL.TextureUnitsWebgl} Коллекция текстурных единиц
     */
    GWTK.gEngine.Renderer.WebGL.TextureUnitWebgl = function (index, observer) {
        this.mTexture = null;
        this.mTextureUnitIndex = index;
        this.mDirty = false;
        this.mObserver = observer;
    };

    GWTK.gEngine.Renderer.WebGL.TextureUnitWebgl.prototype = {
        /**
         * Задать текстуру
         * @method setTexture
         * @public
         * @param texture{GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Объект текстуры
         */
        setTexture: function (texture) {
            if (texture instanceof GWTK.gEngine.Renderer.WebGL.Texture2DWebgl && this.mTexture !== texture) {
                if (!this.mDirty) {
                    this.mObserver.notifyDirty(this.mTextureUnitIndex);
                }
                this.mDirty = true;
                this.mTexture = texture;
            }
        },
        /**
         * Убрать текстуру
         * @method unsetTexture
         * @public
         */
        unsetTexture: function () {
            if (!this.mDirty) {
                this.mObserver.notifyDirty(this.mTextureUnitIndex);
            }
            this.mDirty = false;
            this.mTexture = null;
        },
        /**
         * Обновить текстуру в контексте
         * @method clean
         * @public
         */
        clean: function () {
            if (this.mDirty) {
                GWTK.gEngine.Renderer.Context.setActiveTexture(this.mTextureUnitIndex);
                if (this.mTexture !== null) {
                    this.mTexture.bind();
                    this.mDirty = false;
                } else {
                    GWTK.gEngine.Renderer.WebGL.Texture2DWebgl.prototype.unbind();
                }

            }
        },
        /**
         * Обновить крайнюю текстуру
         * @method cleanLastTextureUnit
         * @public
         */
        cleanLastTextureUnit: function () {

            // If the last texture unit has a texture attached, it
            // is cleaned even if it isn't dirty because the last
            // texture unit is used for texture uploads and downloads in
            // Texture2DGL3x, the texture unit could be dirty without
            // knowing it.
            if (this.mTexture !== null) {
                this.mDirty = true;
            }
            this.clean();
        }
    };
}