/**************************************** Соколова Т.О 23/03/17 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2016              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*               Компонент Измерение расстояний по карте            *
*                                                                  *
*******************************************************************/
if (window.GWTK) {
    /**
     * Компонент Измерение расстояний по карте
     * @class GWTK.RulerControl
     * @constructor GWTK.RulerControl
    */
    GWTK.RulerControl = function (map) {
        this.toolname = 'rulerLengthControl';
        if (!map) {
            console.log("RulerControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.map = map;
        this.$button = null;
        this.action = null;

        this.init();
    };

    GWTK.RulerControl.prototype = {
        /**
         * Инициализация компонента
         * @method init
         */
        // ===============================================================
        init: function () {
            if (!this.map) return;
            this.createButton();

            // добавить в карту
            this.map.maptools.push(this);
        },

        /**
         * Создать кнопку в тулбаре карты
         * @method createButton
         */
        // ===============================================================
        createButton: function () {
            var bt = GWTK.DomUtil.create('div', 'control-button control-button-ruler control-button-radio clickable button-action', this.map.panes.toolbarPane);
            bt.id = 'panel_button-ruler';
            bt.title = w2utils.lang("Measure distance");
            this.$button = $(bt);
            var tool = this;
            this.$button.on('click', function (e) { tool._toggle(e); return; });
            return;
        },
        
        /**
         * Переключить режим работы компонента
         * @method _toggle
         */
        // ===============================================================
        _toggle: function (event) {
            var map = this.map;
            //var eventData = { type: "click", target: "map", phase: 'after' };
            if (this.$button.hasClass('control-button-active')) {
                var res = map.closeAction();
                if (!res) return false;
                this.$button.removeClass('control-button-active');
            }
            else {
                var res = map.closeAction();
                if (!res) return false;

                GWTK.DomUtil.removeActiveElement(".button-action");
                this.$button.addClass('control-button-active');
                if (!this.ruler) {
                    this.ruler = new GWTK.RulerTask(this.map);
                }

                this.ruler.start();
            }
            this.action = this.ruler.action;

        }

    }


    /********************************************************************
    *                                                                  *
    *               Компонент Измерение углов по карте                 *
    *                                                                  *
    *******************************************************************/

    GWTK.RulerAngleControl = function (map) {
        this.toolname = 'rulerAngleControl';
        if (!map) {
            console.log("RulerAngleControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.map = map;
        this.$button = null;
        this.action = null;

        this.init();
    };

    GWTK.RulerAngleControl.prototype = {
        /**
         * Инициализация компонента
         * @method init
         */
        // ===============================================================
        init: function () {
            if (!this.map) return;
            this.createButton();

            // добавить в карту
            this.map.maptools.push(this);
        },

        /**
         * Создать кнопку в тулбаре карты
         * @method createButton
         */
        // ===============================================================
        createButton: function () {
            var bt = GWTK.DomUtil.create('div', 'control-button control-button-anglemeter control-button-radio clickable button-action', this.map.panes.toolbarPane);
            bt.id = 'panel_button-rulerangle';
            bt.title = w2utils.lang("Measure angles");
            this.$button = $(bt);
            var tool = this;
            this.$button.on('click', function (e) { tool._toggle(e); return; });
            return;
        },

        /**
         * Переключить режим работы компонента
         * @method _toggle
         */
        // ===============================================================
        _toggle: function (event) {
            var map = this.map;
            if (this.$button.hasClass('control-button-active')) {
                var res = map.closeAction();
                if (!res) return false;
                this.$button.removeClass('control-button-active');
            }
            else {

                var res = map.closeAction();
                if (!res) return false;

                GWTK.DomUtil.removeActiveElement(".button-action");
                this.$button.addClass('control-button-active');
                if (!this.ruler) {
                    this.ruler = new GWTK.RulerTask(this.map, { "type": "Angle" });
                }

                this.ruler.start();
            }
            this.action = this.ruler.action;

        }

    }

}