/****************************************** Тазин В.О. 26/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Компонент управление источником освещения              *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Plugins = GWTK.gEngine.Plugins || {};
    
    GWTK.gEngine.Plugins.enumLightSourceMode = Object.freeze({
        PROJECTOR: "icon-flashlight3d",
        SUN: "icon-sun3d"
    });
    /**
     * Компонент управление источником освещения
     * @class GWTK.gEngine.Plugins.LightSourceControl
     * @constructor GWTK.gEngine.Plugins.LightSourceControl
     */
    GWTK.gEngine.Plugins.LightSourceControl = function() {
        this.title = "Light source";
        this.id = "panel_button_lightSourceControl3d";
        this.mode = GWTK.gEngine.Plugins.enumLightSourceMode.PROJECTOR;
        this._isDirty = true;
        this._toggleHandler = this._toggleHandler.bind(this);
        this._toggleHandler_new = this._toggleHandler_new.bind(this);
        this._clean = this._clean.bind(this);
        this._getMode = this._getMode.bind(this);
    };
    GWTK.gEngine.Plugins.LightSourceControl.prototype = {
        /**
         * Инициализация
         * @method init
         * @public
         */
        init: function() {
            var button = {
                id: this.id,
                className: this.mode + " icon-toolbar3d-menu-item",
                text: this.title,
                toggleHandler: this._toggleHandler
            };
            
            GWTK.gEngine.Mediator.publish("addToToolbar3d", { "button": button });
            this._initSubscriptions();
        },
        /**
         * Смена режима
         * @method _toggleHandler
         * @private
         */
        _toggleHandler: function(activate, item) {
            item.active = false;
            var iconElement = item.item.firstChild;
            iconElement.classList.remove(this.mode);
            if (this.mode === GWTK.gEngine.Plugins.enumLightSourceMode.PROJECTOR) {
                this.mode = GWTK.gEngine.Plugins.enumLightSourceMode.SUN;
            }else{
                this.mode = GWTK.gEngine.Plugins.enumLightSourceMode.PROJECTOR;
            }
            iconElement.classList.add(this.mode);
            this._isDirty = true;
        },
        /**
         * Смена режима
         * @method _toggleHandler_new
         * @private
         */
        _toggleHandler_new: function() {
            let isProjectorMode = true;
            if (this.mode === GWTK.gEngine.Plugins.enumLightSourceMode.PROJECTOR) {
                this.mode = GWTK.gEngine.Plugins.enumLightSourceMode.SUN;
                isProjectorMode = false;
            }else{
                this.mode = GWTK.gEngine.Plugins.enumLightSourceMode.PROJECTOR;
            }
            this._isDirty = true;
            
            return isProjectorMode;
        },
        
        _getMode: function() {
            return this.mode;
        },
        
        /**
         * Добавление обработчиков внешних событий
         * @method _initSubscriptions
         * @private
         */
        _initSubscriptions: function() {
            GWTK.gEngine.Mediator.subscribe('preRenderScene', this._clean);
        },
        
        /**
         * Обновить состояние компонента
         * @method _clean
         * @private
         * @param e {object} Событие отрисовки
         */
        _clean: function(e) {
            if (this._isDirty) {
                this._isDirty = false;
                if (this.mode === GWTK.gEngine.Plugins.enumLightSourceMode.SUN) {
                    e.sceneState.getLightSource().setSunMode();
                }else{
                    e.sceneState.getLightSource().setProjectorMode();
                }
                GWTK.gEngine.Mediator.publish('changeLightSource', this.mode);
            }
        },
        /**
         * Деструктор
         * @method destroy
         * @public
         */
        destroy: function() {
            this._isDirty = false;
            GWTK.gEngine.Mediator.unsubscribe('preRenderScene', this._clean);
            GWTK[this.toolname] = undefined;
        }
    };
}
