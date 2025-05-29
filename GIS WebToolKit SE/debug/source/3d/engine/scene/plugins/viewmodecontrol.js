/****************************************** Тазин В.О. 01/12/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Компонент управление каркасным видом               *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Plugins = GWTK.gEngine.Plugins || {};

    /**
     * Компонент управление каркасным видом
     * @class GWTK.gEngine.Plugins.ViewModeControl
     * @constructor GWTK.gEngine.Plugins.ViewModeControl
     */
    GWTK.gEngine.Plugins.ViewModeControl = function () {
        this.title = "Wireframe object view";
        this.id = "panel_button_skeletonModeControl3d";
        this._toggleHandler = this._toggleHandler.bind(this);
    };
    GWTK.gEngine.Plugins.ViewModeControl.prototype = {
        /**
         * Инициализация
         * @method init
         * @public
         */
        init: function () {
            var button = {
                id: this.id,
                className: "icon-wireframe3d icon-toolbar3d-menu-item",
                text: this.title,
                toggleHandler: this._toggleHandler
            };

            GWTK.gEngine.Mediator.publish("addToToolbar3d", {"button": button});
        },
        /**
         * Смена режима
         * @method _toggleHandler
         * @private
         */
        _toggleHandler: function () {
            GWTK.gEngine.Renderer.KeyBoard.modes["SKELETON_MODE"] = !GWTK.gEngine.Renderer.KeyBoard.modes["SKELETON_MODE"];
        },

        /**
         * Деструктор
         * @method destroy
         * @public
         */
        destroy: function () {
            GWTK[this.toolname] = undefined;
        }
    };
}
