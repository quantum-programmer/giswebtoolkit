/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Класс состояния маски цвета                    *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Класс состояния маски цвета
     * @class GWTK.gEngine.Renderer.ColorMask
     * @constructor GWTK.gEngine.Renderer.ColorMask
     * @param red {boolean} Маска красного канала
     * @param green {boolean} Маска зеленого канала
     * @param blue {boolean} Маска синего канала
     * @param alpha {boolean} Маска альфа канала
     */
    GWTK.gEngine.Renderer.ColorMask = function (red, green, blue, alpha) {
        this.red = +!!red;
        this.green = +!!green;
        this.blue = +!!blue;
        this.alpha = +!!alpha;
    };
    GWTK.gEngine.Renderer.ColorMask.prototype = {
        /**
         * Сравнение масок
         * @method equals
         * @public
         * @param colorMask{GWTK.gEngine.Renderer.ColorMask} Другая маска
         * @return {boolean} Если `true`, то маски одинаковые
         */
        equals: function (colorMask) {
            return this.red === colorMask.red && this.green === colorMask.green && this.blue === colorMask.blue && this.alpha === colorMask.alpha;
        },
        /**
         * Получить строку
         * @method toString
         * @public
         * @return {string} Строка маски
         */
        toString: function () {
            return [this.red, this.green, this.blue, this.alpha].join(",");
        },
        /**
         * Получить hash
         * @method getHashCode
         * @public
         * @return {number} hash
         */
        getHashCode: function () {
            return this.red * 1 ^ this.green * 2 ^ this.blue * 4 ^ this.alpha;
        }

    };
}