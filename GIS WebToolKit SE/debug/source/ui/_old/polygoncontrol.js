/*************************************** Нефедьева О.А 28/11/17 ****
/*************************************** Соколова Т.О. 21/03/17 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2017              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                     Измерение площади по карте                   *
*                                                                  *
*******************************************************************/
if (window.GWTK) {
    /**
     * Компонент измерения площади по карте
     * @class GWTK.areaSearchControl
     * @constructor GWTK.areaSearchControl
    */
    GWTK.PolygonControl = function (map) {
        this.toolname = 'rulerPolygonControl';
        if (!map) {
            console.log("RulerPolygonControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.map = map;
        this.$button = null;
        this.action = null;

        this.init();
    };

    GWTK.PolygonControl.prototype = {
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
            var bt = GWTK.DomUtil.create('div', 'control-button control-button-polygon-area control-button-radio clickable button-action', this.map.panes.toolbarPane);
            bt.id = 'panel_button-polygonarea';
            bt.title = w2utils.lang("Area of polygon");
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
                    this.ruler = new GWTK.RulerTask(this.map, { "type": "Polygon" });
                }

                this.ruler.start();
            }
            this.action = this.ruler.action;

        },

        /**
		  * Деструктор
          * @method destroy
		 */
        destroy: function () {
            if (this.action) {
                this.map.closeAction();
                this.action = null;
            }
            if (this.ruler) {
                this.ruler.destroy();
                this.ruler = null;
            }
        }

    }
}