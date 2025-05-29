/******************************************** Тазин В. 23/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *      Описание коллекции текстурных единиц контекста WebGL        *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    GWTK.gEngine.Renderer.WebGL = GWTK.gEngine.Renderer.WebGL || {};

    /**
     * Класс коллекции текстурных единиц
     * @class GWTK.gEngine.Renderer.WebGL.TextureUnitsWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.TextureUnitsWebgl
     * @param numberOfTextureUnits {number} Количество текстурных единиц в контексте
     */
    GWTK.gEngine.Renderer.WebGL.TextureUnitsWebgl = function (numberOfTextureUnits) {
        this.mTextureUnits = [];
        for (var i = 0; i < numberOfTextureUnits; i++) {
            this.mTextureUnits[i] = new GWTK.gEngine.Renderer.WebGL.TextureUnitWebgl(i, this);
        }
        this.mDirtyTextureUnits = [];
        this.mLastTextureUnit = this.mTextureUnits[numberOfTextureUnits - 1];
    };

    GWTK.gEngine.Renderer.WebGL.TextureUnitsWebgl.prototype = {
        /**
         * Установить текстурную единицу
         * @method setTextureUnit
         * @public
         * @param i{number} Порядковый номер
         * @param texture {GWTK.gEngine.Renderer.WebGL.TextureUnitWebgl} Текстурная единица
         */
        setTextureUnit: function (i, texture) {
            if (GWTK.gEngine.isNumeric(i) && i >= 0) {
                this.mTextureUnits[i].setTexture(texture);
            }
        },
        /**
         * Освободить текстурную единицу
         * @method unsetTextureUnit
         * @public
         * @param i{number} Порядковый номер
         */
        unsetTextureUnit: function (i) {
            if (GWTK.gEngine.isNumeric(i) && i >= 0) {
                this.mTextureUnits[i].unsetTexture();
            }
        },
        /**
         * Очистить все текстурные единицы
         * @method unsetAll
         * @public
         */
        unsetAll: function () {
            for (var i = 0; i < this.mTextureUnits.length; i++) {
                this.mTextureUnits[i].unsetTexture();
            }
        },
        /**
         * Обновить текстурные единицы коллекции
         * @method clean
         * @public
         */
        clean: function () {
            var dirtyCount = this.mDirtyTextureUnits.length;
            if (dirtyCount > 0) {
                for (var i = 0; i < dirtyCount; ++i) {
                    var index = this.mDirtyTextureUnits[i];
                    this.mTextureUnits[index].clean();
                }
                this.mDirtyTextureUnits.length = 0;
            }
            this.mLastTextureUnit.cleanLastTextureUnit();
        },
        /**
         * Добавить текстурную единицу в очередь на обновление
         * @method notifyDirty
         * @public
         * @param index {number} Индекс текстурной единицы
         */
        notifyDirty: function (index) {
            if (this.mDirtyTextureUnits.indexOf(index) === -1) {
                this.mDirtyTextureUnits.push(index);
            }
        }
    };
}