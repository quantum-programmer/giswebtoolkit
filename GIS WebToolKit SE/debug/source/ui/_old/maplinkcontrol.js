/*
 *************************************** Патейчук В.К.  08/04/20 ****
 *************************************** Нефедьева О.   30/11/20 ****
 *************************************** Гиман Н.       08/10/19 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Компонент "Поделиться"                      *
 *                  (формирование ссылки на карту)                  *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {

    /**
     * Компонент Поделиться ссылкой на карту
     * @class GWTK.mapLinkControl
     * @constructor GWTK.mapLinkControl
     * @param map {Object} карта
    */
    GWTK.mapLinkControl = function (map) {
        // имя компонента
        this.toolname = 'maplink';
        // карта
        this.map = map;
        if (!this.map) {
            console.log("GWTK.mapLinkControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        // id панели
        this.id = null;
        // панель
        this.pane = null;
        // объект jquery панели
        this.$pane = null;
        // инициализация
        this.init();
    }
    GWTK.mapLinkControl.prototype = {

        /**
         * Инициализация компонента
         */
        init: function () {
            // создать панель
            this.createPane();
            // создать кнопку
            this.createtoolbarsButton();
            // добавить в карту
            this.map.maptools.push(this);
        },

        /**
         * Создать кнопку в панели карты
         */
        createtoolbarsButton: function () {
            if (!this.map || !this.map.panes.toolbarPane || !this.pane)
                return;
            var map = this.map, tool = this;
            this.bt = GWTK.DomUtil.create('div', 'control-button control-button-maplink clickable', this.map.panes.toolbarPane);
            this.bt.id = 'panel_button_maplink';
            this.bt.disabled = true;
            this.bt.title = w2utils.lang("Link");
            if (this.pane.id) {                        // идентификатор панели
                this.bt.disabled = false;
            }
            $(this.bt).attr('toolname', this.toolname);
            // обработчик клика на кнопке (включить режим, показать панель)
            $(this.bt).on("click", function (event) {
                //var tool = map.mapTool("maplink");
                if (map) map.handlers.toolbar_button_click(event);
                if (tool.visible()) {
                    tool.hidePane();
                }
                else {
                    $('#' + tool.id).css('top', $(this).position().top + $(this).height());
                    if (map.hasMenu()){
                        $('#' + tool.id).css('left', '300px');
                    }
                    else{
                        $('#' + tool.id).css('left', $(this).position().left);
                    }
                    tool.showPane();
                }
            });
        },

		/**
         * Скопировать ссылку в буфер обмена
		 */
		copyUrl: function () {
			if ($('#mapurl').length > 0) {
                // выделить
                $('#mapurl').select().focus();
                // скопировать в буфер обмена
                if (window.clipboardData) {
                    // IE
                    window.clipboardData.setData('Text', $('#mapurl').val());
                }
                if (document.execCommand) {
                    // Chrome
                    try {
                        document.execCommand('copy');
                    }
                    catch (e) {
                        console.log(w2utils.lang("Command is not supported!"));
                    }
                }
            }
		},

        /**
         * Создать панель
         */
        createPane: function () {
            this.id = this.map.divID + '_maplinkPane';
            this.pane = GWTK.DomUtil.create('div', 'map-panel-def panel-maplink', this.map.mapPaneOld);
            this.pane.id = this.id;
            this.$pane = $(this.pane);
            this.$pane.hide();

            // body --> панель

            var frame = document.createElement('div');
            frame.id = "maplink_container";
            frame.className += ' map-link-container';

            $(frame).html('<input id="mapurl" class="map-link-input-text" type="text" value="">' +
                          '<button class="map-link-button-copy btn" id="maplinkCopyButton">' + w2utils.lang("Copy") + '</button>');

            // body --> панель
            this.$pane.append(frame);
            var tool = this;
            $(frame).find("#maplinkCopyButton").click(function (e) { if (tool) { tool.copyUrl(); } return; });
        },

        /**
         * Отобразить панель
         */
        showPane: function () {
            if ($('#mapurl').length > 0) {
                $('#mapurl').val('');
                $('#mapurl').val(this.map.getMapLink());
                // выделить
                $('#mapurl').select().focus();
            }
            this.$pane.show();
        },

        /**
         * Скрыть панель
         */
        hidePane: function () {
            this.$pane.hide();
        },

        /**
         * Видимость панели
         */
        visible: function () {
            if (this.pane.style.display && this.pane.style.display == 'none')
                return false;
            return true;
        },

        /**
         * Деструктор
         */
        destroy: function () {
            $(this.bt).off();
            $(this.bt).remove();
            this.$pane.empty();
            this.$pane.remove();
        }

    }
}
