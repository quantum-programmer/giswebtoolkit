/*****************************************  Тазин В.О. 30/11/20 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Меню 3D инструментов                         *
 *                                                                  *
 *******************************************************************/
"use strict";

/**
 * Класс панели инструмунтов 3D режима
 * @class GWTK.gEngine.Map3dToolbar
 * @constructor GWTK.gEngine.Map3dToolbar
 * @extends GWTK.UserControl
 */
GWTK.gEngine.Map3dToolbar = function () {
    this.button_options = {
        "class": 'icon-toolbar3d control-button clickable',
        'parent': '.panel-tools3d'
    };
    this.title = w2utils.lang('3D tools');
};
GWTK.gEngine.Map3dToolbar.prototype = {
    /**
     * Инициализация
     * @method init
     * @public
     */
    init: function () {
        this.createButton();
        this.$button = $(this.button);
        this.createPanel({
            'id': 'panel_toolbar_3d',
            'class': 'user-control-3d map-panel-def mapmenu-panel panel-toolbar3d',
            'display': 'none',
            'header': true,
            'hidable': true,
            'parent': document.getElementsByClassName('panel-tools3d')[0]
        });

        // чтобы как в 2D
        this.header.getElementsByTagName('span')[0].textContent = "";
        this.header.style.height = "26px";

        var navigationPane = document.getElementsByClassName('panel-navigation3d')[0];
        var toolsDiv = document.createElement('div');
        toolsDiv.setAttribute('id', 'tools3d_div');
        navigationPane.appendChild(toolsDiv);

        this.addButton = this._addButton.bind(this);
        this.deactivateItem = this._deactivateItem.bind(this);
        this.hide = this._hide.bind(this);
        this.show = this._show.bind(this);
        this.toggleMenuItemHandler = this._toggleMenuItemHandler.bind(this);

        this._initSubscriptions();
        this.initMenu();
    },

    /**
     * Добавление обработчиков внешних событий
     * @method _initSubscriptions
     * @private
     */
    _initSubscriptions: function () {
        // нажатие кнопки управления
        this.$button.on('click', function () {
            if (this.$button.hasClass('control-button-active')) {
                this._reset();
            } else {
                this.$button.addClass('control-button-active');
                this.$panel.show('slow');
            }
        }.bind(this));
        var mediator = GWTK.gEngine.Mediator;
        mediator.subscribe('hide3d', this.hide);
        mediator.subscribe('show3d', this.show);
        mediator.subscribe("addToToolbar3d", this.addButton);
        mediator.subscribe("deactivateToolbar3dComponent", this.deactivateItem);

    },

    /**
     * Удаление обработчиков внешних событий
     * @method _removeSubscriptions
     * @private
     */
    _removeSubscriptions: function () {
        var mediator = GWTK.gEngine.Mediator;
        mediator.unsubscribe('hide3d', this.hide);
        mediator.unsubscribe('show3d', this.show);
        mediator.unsubscribe("addToToolbar3d", this.addButton);
        mediator.unsubscribe("deactivateToolbar3dComponent", this.deactivateItem);
    },

    /**
     * Отобазить компонент
     * @method _show
     * @private
     */
    _show: function () {
        this.$button.show();
    },

    /**
     * Скрыть компонент
     * @method _hide
     * @private
     */
    _hide: function () {
        this._reset();
        this.$button.hide();
    },

    /**
     * Сброс компонента
     * @method _reset
     * @private
     */
    _reset: function () {
        this.$panel.hide('slow');
        this.$button.removeClass('control-button-active');
    },

    /**
     * Деструктор
     * @method destroy
     * @public
     */
    destroy: function () {
        this._reset();
        this.$button.remove();
        this._removeSubscriptions();
        GWTK[this.toolname] = undefined;

        this.$menumain.menu("destroy");
        this.$panel.remove();
    },

    /**
     * Создать меню
     * @method initMenu
     * @public
     */
    initMenu: function () {
        this.commands = [];

        // создать контейнер меню
        this._createMenuWrapper();

        // создать меню
        this.$menumain.menu();
    },

    /**
     * Создать контейнер меню
     * @method _createMenuWrapper
     * @private
     */
    _createMenuWrapper: function () {
        var ulElement = document.createElement("ul");
        ulElement.setAttribute("id", "tools3dmenu");
        ulElement.setAttribute("style", "border: none!important;");

        this.$panel.append(ulElement);

        this.$menumain = $(ulElement);
    },

    /**
     * Создать подменю Расчеты
     * @method _createSubMenuMath
     * @private
     */
    _createSubMenuMath: function () {

        this.$menumain.append(this._createDivider());

        // пункт подменю "Расчеты"
        var mapmathItem = this._createMenuItemEx({
            id: "tb3d_mapmath",
            text: "Calculations",
            className: "icon-toolbar3d-menu-item icon-mapmath"
        }, false);
        this.$menumain.append(mapmathItem);

        this.$menumain.append(this._createDivider());

        // панель подменю "Расчеты"
        var subMenuPanel = document.createElement("ul");
        subMenuPanel.setAttribute("id", "toolbar3dsubmenucalc");
        subMenuPanel.setAttribute("role-sub", "1");
        mapmathItem.appendChild(subMenuPanel);
    },

    /**
     * Создать разделитель меню
     * @method _createDivider
     * @private
     * @return {HTMLLIElement} Элемент разделителя
     */
    _createDivider: function () {
        var result = document.createElement("li");
        result.className += "ui-menu-divider";
        return result;
    },

    /**
     * Обработчик добавления кнопки
     * @method _addButton
     * @private
     * @param e {Event} Событие
     */
    _addButton: function (e) {
        var parent = this.$menumain[0];
        if (e.submenu) {
            var menuElement = document.getElementById(e.submenu);
            if (!menuElement) {
                if (e.submenu === "toolbar3dsubmenucalc") {
                    this._createSubMenuMath();
                }
                this.$menumain.menu("refresh");
                menuElement = document.getElementById(e.submenu)
            }
            parent = menuElement;
        }
        parent.appendChild(this._createMenuItemEx(e.button, true, e.submenu));
    },

    /**
     * Обработчик раскрытия подменю
     * @method _toggleMenuItemHandler
     * @private
     * @param e {Event} Событие
     */
    _toggleMenuItemHandler: function (e) {
        var id = e.target.id;
        if (!id) {
            id = e.target.parentElement.id;
        }

        var item = this.commands[id];
        if (item !== undefined) {
            var checked = item.active;
            if (checked) {
                this._deactivateItem({id: id});
            } else {
                if (item.parentId === "toolbar3dsubmenucalc") {
                    this._resetMeasurements();
                }
                this._activateItem({id: id});
            }
        }
    },

    /**
     * Обработчик сброса подменю измерений
     * @method _resetMeasurements
     * @private
     */
    _resetMeasurements: function () {

        var measurementItemList = document.getElementById("toolbar3dsubmenucalc").children;
        for (var i = 0; i < measurementItemList.length; i++) {
            var id = measurementItemList[i].getAttribute("id");
            var item = this.commands[id];
            if (item !== undefined) {
                var checked = item.active;
                if (checked) {
                    this._deactivateItem({id: id});
                }
            }
        }
    },

    /**
     * Активация элемента меню
     * @method _activateItem
     * @private
     */
    _activateItem: function (itemParams) {
        var item = this.commands[itemParams.id];
        if (item !== undefined && !item.active) {
            item.active = true;
            item.toggleHandler(true, item); // включить/выключить инструмент карты
            if (item.active) {
                this._checkItem(itemParams.id);                          // активный пункт
            }
        }
    },
    /**
     * Деактивация элемента меню
     * @method _deactivateItem
     * @private
     */
    _deactivateItem: function (itemParams) {
        var item = this.commands[itemParams.id];
        if (item !== undefined && item.active) {
            item.toggleHandler(false);                              // включить/выключить инструмент карты
            this._uncheckItem(itemParams.id);                          // активный пункт
            item.active = false;
        }
    },
    /**
     * Создать пункт меню
     * @method _createMenuItem
     * @param props {object} Описание элемента
     * @param action {Boolean} признак обработчика карты
     * @param [parentId] {string} Панель элементов
     * @return {HTMLLIElement} Элемент списка
     */
    _createMenuItemEx: function (props, action, parentId) {

        var iclass = props.className;
        var id = props.id;
        var text = props.text;
        var toggleHandler = props.toggleHandler;

        var itemElement = document.createElement("li");
        itemElement.setAttribute("id", id);
        itemElement.classList.add("panel-toolbar3d-item");
        if (action === true) {
            itemElement.classList.add("radio", "ui-menu-item");
        }

        var iconElement = document.createElement("div");
        if (typeof iclass === "string" && iclass.length > 0) {
            iconElement.className += iclass;
        }
        itemElement.appendChild(iconElement);

        var spantext = document.createElement("span");
        spantext.innerHTML = w2utils.lang(text);
        spantext.setAttribute("style", "font-size:13px;");
        itemElement.appendChild(spantext);

        var checkElement = document.createElement("span");
        checkElement.className += "menu-item-check";
        itemElement.appendChild(checkElement);

        this.commands[id] = {
            "item": itemElement,
            "action": !!action,
            "active": false,
            "parentId": parentId
        };

        if (toggleHandler) {                 // это элемент подменю
            this.commands[id].toggleHandler = toggleHandler;
            itemElement.addEventListener("click", this.toggleMenuItemHandler);
        }

        return itemElement;

    },
    /**
     * Включить пункт меню
     * @method _checkItem
     * @param id {string} Идентификатор
     */
    _checkItem: function (id) {
        var item = document.getElementById(id);
        if (item) {
            var checkItem = item.getElementsByClassName("menu-item-check");
            if (checkItem.length > 0) {
                checkItem[0].classList.add("w2ui-icon-check");
            }
            item.classList.add("menu-item-active");
        }
    },
    /**
     * Выключить пункт меню
     * @method _uncheckItem
     * @param id {string} Идентификатор
     */
    _uncheckItem: function (id) {
        var item = document.getElementById(id);
        if (item) {
            var checkItem = item.getElementsByClassName("menu-item-check");
            if (checkItem.length > 0) {
                checkItem[0].classList.remove("w2ui-icon-check");
            }
            item.classList.remove("menu-item-active");
        }
    }
};
