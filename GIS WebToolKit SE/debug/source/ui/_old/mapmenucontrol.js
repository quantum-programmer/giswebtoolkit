/************************************** Нефедьева О.   03/11/20 ****
*************************************** Патейчук В.К.  20/02/20 ****
*************************************** Соколова Т.О.  18/02/20 ****
*************************************** Помозов Е.В.   11/05/21 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                         Меню карты                               *
*                                                                  *
*******************************************************************/
/**
 * Элемент управления Меню
 * Управление режимами карты
 * (масштабирование, поиски, состав слоев,...)
 * Наследует GWTK.UserControl
 * Создание: GWTK.mapCreateUserControl('mapmenu', map, protoMapMenu, true);
 * @class GWTK.UserControl, имя инструмента 'mapmenu'
 */
protoMapMenu = {

    title: "",

    toolname: "mapmenu",

    panel_options: {
       /*  'class': 'map-panel-def map-panel-def-task', 'display': 'none',
        'header': true, 'parent': 'map-pane-main', 'hidable': true, draggable: true, resizable: true */
    },

    hideItems3d : [
                    "cm_aresearch", "cm_builderzone", "cm_mapaddressatcoord",
                    "cm_mapbuildheatmap", "cm_mapclusterizator", "cm_mapeditorExt", //"cm_mapeditor",
                    "cm_mapexport", "cm_mapfeaturesamples",
                    "cm_mapmath", "cm_mapmatrixvalues", "cm_mapprint",
                    "cm_maprosreestr", "cm_maproutes", "cm_mapshutter",
                    "cm_mapthematicmap", "cm_selectspecified",
                    "cm_selecttype", "cm_maproutesbpla", "cm_mapinitial"
     ],

    /**
     * Инициализировать
     * @method init
     */
    init: function () {

        this.createButton({ 'class': 'control-button clickable icon-menu control-button-mapmenu' });

        this.createPanel({ 'class': 'map-panel-def mapmenu-panel', 'display': 'none', 'header': true, 'hidable': true });

        this.$panel.find(".panel-info-header").height('16px');

        this._createMenu();

        this.initEvents();
    },

    /**
     * Создать меню
     * @method _createMenu
     */
    _createMenu: function () {
        this.commands = [];

        // создать контейнер меню
        this._createMenuWrapper();

        // создать элементы меню
        this._createMenuItemsList();

        // создать меню
        this.$menumain.menu();

        return;
    },

    /**
     * Создать контейнер меню
     * @method _createMenuWrapper
     * @param parent {JQuery-элемент} родительский элемент
     */
    _createMenuWrapper: function (parent) {
        var parent = parent;
        if (typeof parent == "undefined") {
            parent = this.$panel;
        }

        this.$menumain = $('<ul/>', { "id": "gwtkmenu", "style": "border:none !important" }).appendTo(parent);

        return this.$menumain;
    },

    /**
     * Создать элементы меню
     * @method _createMenuItemsList
     */
    _createMenuItemsList: function () {

        var controls = this.map.options.controls, j, len;

        for (j = 0; len = controls.length, j < len; j++) {
			
            // расчеты по карте
            if (controls[j] == "mapcalculations" ) {
                this._createSubMenuMath(controls);
                continue;
            }

            // // измерение расстояния
            // if (controls[j] == "ruler") {
            //     this._createSubMenuMath(controls);
            //     continue;
            // }

            // // измерение углов
            // if (controls[j] == "anglemeter") {
            //     this._createSubMenuMath(controls);
            //     continue;
            // }

            // // измерение площади полигона
            // if (controls[j] == "polygonarea") {
            //     this._createSubMenuMath(controls);
            //     continue;
            // }
            // построение зон
            if (controls[j] == "builderofzone") {
                this._createSubMenuMath(controls);
                continue;
            }

            // // поиск по карте
            // if (controls[j] == "search") {
            //     this._createMenuItem("cm_search", "Search", "icon-menu-item icon-mapsearch", "#panel_button_search");
            //     continue;
            // }

            // поиск по области (фрейм, круг, объект карты)
            if (controls[j] == "areasearch") {
                this._createMenuItem("cm_aresearch", 'Area search', "icon-menu-item icon-mapareasearch", "#areasearchbutton");
                continue;
            }

            // расширенный поиск по области ()
            if (controls[j] == "areasearchex") {
                this._createMenuItem("cm_aresearch", 'Area search', "icon-menu-item icon-mapareasearch", "#areasearchbutton");
                continue;
            }

            // выделение объектов(указанные & по условному знаку)
            // if (controls[j] == "selectobjects") {
            //     this._createMenuItem("cm_selectspecified",
            //                  'Select specified', "icon-menu-item icon-mapselectspecified", "#selectobjects_specified", true);
            //     this._createMenuItem("cm_selecttype", 'Select by sign',
            //                  "icon-menu-item icon-mapselectcondition", "#selectobjects_condition", true);
            //     continue;
            // }

            // // слои карты
            // if (controls[j] == "content") {
            //     this._createMenuItem("cm_mapcontent", 'Layers', "icon-menu-item icon-maplayers", ".control-button-content");
            // }

            //шторка
            if (controls[j] == "shutter") {
                this._createMenuItem("cm_mapshutter", 'Shutter', "icon-menu-item icon-mapshutter", "#panel_button_shutter", true);
                continue;
            }

            //параметры отображения
            if (controls[j] == "viewoptions") {
                this._createMenuItem("cm_mapoptions", "Options", "icon-menu-item icon-mapoptions", "#panel_button_options");
                continue;
            }

            // построение тепловых карт
            if (controls[j] == "buildheatmap") {
                this._createMenuItem("cm_mapbuildheatmap", "Heat maps", "icon-menu-item icon-mapheatmaps", "#panel_button_buildheatmap");
                continue;
            }

            // печать карты
            if (controls[j] == "map2img") {
                this._createMenuItem("cm_mapprint", "Print", "icon-menu-item icon-mapprint", "#panel_button_printmap", false);
                continue;
            }

            // поиск по семантике
            if (controls[j] == "searchSem") {
                this._createMenuItem("cm_searchsem", 'Search by semantics', "icon-menu-item icon-mapsearchsem", "#panel_button_searchSem");
                continue;
            }

            // поделиться
            if (controls[j] == 'maplink') {
                this._createMenuItem("cm_maplink", "Link", "icon-menu-item icon-maplink", ".control-button-maplink");
                continue;
            }

            // кластеризатор
            if (controls[j] == "clusterizator") {
                this._createMenuItem("cm_mapclusterizator", "Clustered data", "icon-menu-item icon-mapclusterizator", "#panel_button-clusterizator");
                continue;
            }

            // списки объектов
            if (controls[j] == "featuresamplescontrol") {
                this._createMenuItem("cm_mapfeaturesamples", "Object lists", "icon-menu-item icon-mapsamples", "#panel_button-featuresamplescontrol");
                continue;
            }

            // росреестр
            if (controls[j] == "rosreestr") {
                this._createMenuItem("cm_maprosreestr", "Rosreestr", "icon-menu-item icon-maprosreestr", "#panel_button-mapRosreestr", true);
                continue;
            }

            // поиск адреса по координатам
            if (controls[j] == "addressatcoord") {
                this._createMenuItem("cm_mapaddressatcoord", "Address at", "icon-menu-item icon-mapaddrcoord", ".control-button-addressatcoord", true);
                continue;
            }

            // // маршруты проезда
            // if (controls[j] == "routecontrol") {
            //     this._createMenuItem("cm_maproutes", "Route", "icon-menu-item icon-maproute", "#panel_button_route", true);
            //     continue;
            // }

            // 3d карта
            if (controls[j] == 'map3d') {
                this._createMenuItem("cm_map3dview", "3D view", "icon-menu-item icon-map3dview", "#panel_button-3dview");
                continue;
            }

            //значение матриц в точке
            if (controls[j] == "matrixcontrol") {
                this._createMenuItem("cm_mapmatrixvalues", "Values of matrixes in point", "icon-menu-item icon-mapmatrixvalue", "#panel_button_matrix");
                continue;
            }

            // // геолокация
            // if (controls[j] == "geolocation") {
            //     this._createMenuItem("cm_mapgeolocation", "My location", "icon-menu-item icon-mapgeolocation", "#panel_button-geolocation");
            //     continue;
            // }

            if (controls[j] == "thematicmapcontrol") {
                this._createMenuItem("cm_mapthematicmap", "Thematic layer", "icon-menu-item icon-mapthematic", ".control-button-thematicmap");
                continue;
            }
			
			if (controls[j] == "userthematic") {
                this._createMenuItem("cm_userthematicmap", "Cartogram", "icon-menu-item icon-userthematic", "#panel_button_userthematic");
                continue;
            }

            // редактор карты (создан выше)
            if (controls[j] == "mapeditor") {
                $('<li/>', { "class": "ui-menu-divider" }).appendTo(this.$menumain);
                // this._createMenuItem("cm_mapeditor", "Map editor", "icon-menu-item icon-mapeditor", "#panel_button-mapeditor");
                 this._createMenuItem("cm_mapeditorExt", "Map editor", "icon-menu-item icon-mapeditor", "#panel_button-mapeditorExt");
                $("<li/>", { "class": "ui-menu-divider" }).appendTo(this.$menumain);
                // this._createSubMenuEditor(controls);
                continue;
            }

            // // скачивание слоя
            // if (controls[j] == 'exportLayer') {
            //     this._createMenuItem("cm_mapexport", "Layers export", "icon-menu-item icon-mapexport", "#panel_button_exportlayer");
            //     continue;
            // }

            if (controls[j] == "routebpla") {
                this._createMenuItem("cm_maproutesbpla", "Analysis of data from a UAV", "icon-menu-item icon-mapbplaroutes", "#panel_button-mapRoute");
                continue;
            }

            if (controls[j] == 'initialextent'){
                this._createMenuItem("cm_mapinitial", "Show initial extent", "icon-menu-item icon-mapinitial", ".control-button-mapinitial");
                continue;
            }

            if (controls[j] == 'mapdbm' && this.map.hasMapDataBase()) {
                this._createMenuItem("cm_mapdbm", "Spatial database", "icon-menu-item icon-mapdbm", ".control-button-mapdbm");
                continue;
            }

        }
        var $item = $('<li/>', { "class": "ui-menu-item" }).appendTo(this.$menumain);
        $item.css("pointer-events", "none");
        $('<div/>', { "class": "icon-menu-item" }).appendTo($item);
        return;
    },

    /**
     * Создать подменю Расчеты
     * @method _createSubMenuMath
     */
    _createSubMenuMath: function (controls) {
        if (!this.map || !$.isArray(controls)) {
            return;
        }
        if ($.inArray("mapcalculations", controls) == -1 && $.inArray("ruler", controls) == -1 &&
            $.inArray("anglemeter", controls) == -1 && $.inArray("polygonarea", controls) == -1 &&
            $.inArray("builderofzone", controls) == -1) {
            return;
        }
        if (this.$panel.find("#cm_mapmath").length > 0) {
            return;
        }
        $('<li/>', { "class": "ui-menu-divider" }).appendTo(this.$menumain);
        // родитель подменю "Расчеты"
        this._createMenuItem("cm_mapmath", "Calculations", "icon-menu-item icon-mapmath", "submenu_math");
        $('<li/>', { "class": "ui-menu-divider" }).appendTo(this.$menumain);
        // подменю "Расчеты"
        $('<ul/>', { "id": "submenucalc", "role-sub": 1 }).appendTo($("#cm_mapmath"));
        // if ($.inArray("ruler", controls) > -1)
        //     this._createMenuItem("cm_mapruler", "Distance", "icon-menu-item icon-mapruler", "#panel_button-ruler", true, $("#submenucalc"));
        // if ($.inArray("polygonarea", controls) > -1)
        //     this._createMenuItem("cm_maparea", "Area of polygon", "icon-menu-item icon-mappolygonarea", "#panel_button-polygonarea", true, $("#submenucalc"));
        // if ($.inArray("anglemeter", controls) > -1)
        //     this._createMenuItem("cm_mapangle", "Measure angles", "icon-menu-item icon-mapangles", "#panel_button-rulerangle", true, $("#submenucalc"));
        if ($.inArray("mapcalculations", controls) > -1)
            this._createMenuItem("cm_mapcalculations", "Map calculation", "icon-menu-item icon-mapcalculations", ".control-button-mapcalculation", false, $("#submenucalc"));
        if ($.inArray("builderofzone", controls) > -1)
            this._createMenuItem("cm_builderzone", "Buffer zones", "icon-menu-item icon-mapbuilderzone", "#panel_button_builderzone", false, $("#submenucalc"));
    },

    /**
     * Создать подменю Редактор
     * @method _createSubMenuEditor
     */
    _createSubMenuEditor: function (controls) {
        if (!this.map || !$.isArray(controls)) {
            return;
        }
        if ($.inArray("mapeditor", controls) == -1) {
            return;
        }
        if (this.$panel.find("#cm_mapeditorParent").length > 0) {
            return;
        }

        $('<li/>', { "class": "ui-menu-divider" }).appendTo(this.$menumain);
        this._createMenuItem("cm_mapeditorParent", "Map editor", "icon-menu-item icon-mapeditor", "submenu_mapeditor");
        $("<li/>", { "class": "ui-menu-divider" }).appendTo(this.$menumain);

        // подменю "Редактор"
        $('<ul/>', { "id": "subeditor", "role-sub": 1 }).appendTo( $("#cm_mapeditorParent"));
        var sub = $("#subeditor");
        this._createMenuItem("cm_mapeditor", "Map editor 1", "icon-menu-item icon-mapeditor", "#panel_button-mapeditor", true, sub);
        this._createMenuItem("cm_mapeditorExt", "Map editor 2", "icon-menu-item icon-mapeditor", "#panel_button-mapeditorExt", true, sub);
    },
    
    /**
     * Создать пункт меню
     * @method _createMenuItem
     * @param id {string} идентификатор пункта меню
     * @param text {string} название
     * @param iclass {string} имя css-класса
     * @param btselector {string} селектор кнопки управления режима для меню
     * @param action {Boolean} признак обработчика карты
     * @param parent {JQuery-элемент} родительский элемент для пункта меню
     */
    _createMenuItem: function (id, text, iclass, btselector, action, parent) {
        var iclass = iclass,
            id = id,
            div = { "id": "div_" + id },
            spantext = { "text": w2utils.lang(text), "style":'font-size:13px;' };
        if (typeof iclass === "string" && iclass.length > 0) {
            div["class"] = iclass;
        }
        if (typeof id === "undefined") {
            id = "menuitem_" + this.$menumain.find('li').length;
        }
        var li = { "id": id };
        if (action && action === true) {
            li["class"] = "radio";
        }
        else {
            action = false;
        }
        var $item = $('<li/>', li);
        $('<div/>', div).appendTo($item);
        $('<span/>', spantext).appendTo($item);
        $('<span/>', { "class": "menu-item-check" }).appendTo($item);

        var parent = parent;

        if (typeof parent === "undefined")
            parent = this.$menumain;

        $item.appendTo(parent);

        this.commands[id] = { "item": parent[0].lastChild, "action": action, "btselector": btselector };

        var tool = this;

        if (btselector.indexOf("submenu_") == 0) {                 // это элемент подменю
            return;
        }

        $("#" + id).on('click.mapmenu', function (event) {                      // обработка клика на пункте меню

            if (this.classList.contains('ui-state-disabled')){
                event.stopImmediatePropagation();
                return;
            }
            var $icheck = $(this).find(".menu-item-check"),
                checked = $icheck.hasClass("w2ui-icon-check");                  // запоминаем, обработчик может переключить
            
			$(tool.commands[this.id].btselector).trigger('click', {'checked': !checked}); // включить/выключить инструмент карты

            if (checked) {
                if (this.id == "cm_mapprint") {
                    var pcnt = tool.map.getMapTool('printmap');
                    pcnt._closePane();
                }
                tool._uncheckItem($(this));                        // неактивный пункт
                tool.toggleSubMenuItem(this, false);
                tool.notifyClick(this.id);
            }
            else {
                if (this.id == "cm_mapinitial"){ return;}
                tool._checkItem($(this));                          // активный пункт
                tool.toggleSubMenuItem(this, true);
            }

        });

        return;
    },

    /**
     * Уведомить о закрытии всех компонентов в меню
     * @method notifyClick
     * @param cm_id {string} id пункта меню
     */
    notifyClick: function(cm_id){
        var notchildren = ["cm_aresearch", "cm_mapprint", "cm_maplink", "cm_map3dview"];
        if (!this.commands[cm_id] || this.commands[cm_id].action || cm_id === "cm_aresearch"){
            return;
        }
        if ($.inArray(cm_id, notchildren) > -1){
            return;
        }
        var $icheck = this.$panel.find("span.menu-item-check.w2ui-icon-check");
        var parents = $icheck.parent('li'),
            count = 0, i, len = parents.length;
        for (i = 0; i < len; i++){
            if (!this.commands[parents[i].id].action && parents[i].id !== "cm_aresearch") {
                count++;
            }
        }
        if (count === 0){
            $(this.map.eventPane).trigger({'type': 'closemenucontrol', 'cmd': cm_id});
        }
    },

    /**
     * Назначение обработчиков событий
     * @method initEvents
     */
    initEvents: function () {

        var tool = this;
        // нажатие кнопки управления
        this.$button.on('click', function (event) {
            if (tool.$button.hasClass('control-button-active')) {
                tool.$button.removeClass('control-button-active');
                if (tool.panel_options.hidable)
                    tool.$panel.hide('slow');
            }
            else {
                tool.$button.addClass('control-button-active');
                tool.$panel.show('slow');
            }
        });

        // закрытие инструмента карты
        $(this.map.eventPane).on('closecomponent.mapmenu', function (event) {
            if (event && event.context && event.context === 'mapmenu'){
                return;
            }
            tool.toggleMenuItem(event.context);
        });

        // закрытие обработчика карты
        $(this.map.eventPane).on('closeaction.mapmenu', this.onCloseAction.bind(this));

        // настроить меню для режима 3dview
        $("#panel_button-3dview").on('click.mapmenu', this._triggering3d.bind(this));

        // отключить пункт меню
        this.map.on('disablecomponent', function(event){
            if (!event || !event.command) { return; }
            var item = this.commands[event.command];
            if (!item) { return; }
            var enabled = event.enabled;
            if (typeof enabled == 'undefined') enabled = 1;
            if (enabled){
                $(item.item).removeClass('ui-state-disabled')
                            .css('pointer-events', 'all');
            }
            else{
                $(item.item).addClass('ui-state-disabled')
                            .css('pointer-events', 'none');
            }
            event.preventDefault()
        }.bind(this));
    },

    /**
     * Переключить элементы меню для 3D карты
     * @method _triggering3d
     */
    _triggering3d: function () {
        if (this.map.is3dButtonActive()) {
            for (var i = 0, id; id = this.hideItems3d[i]; i++) {
                if (this.commands[id] === undefined) continue;
                this._uncheckItem($(this.commands[id].item));
                $(this.commands[id].item).addClass("ui-state-disabled");
            }
            this._checkItem($(this.commands["cm_map3dview"].item));
        }
        else {
            for (var i = 0, id; id = this.hideItems3d[i]; i++) {
                if (this.commands[id] === undefined) continue;
                $(this.commands[id].item).removeClass("ui-state-disabled");
            }
        }
        return;
    },

    /**
     * Закрытие обработчика карты - событие 'closeaction'
     * @method onCloseAction
     * @param event {object} объект события
     */
    onCloseAction: function (event) {
        if (!event) return;
        if (typeof event.task === "undefined" || event.task == null) {
            this.toggleMenuItem(event.action, true);
            return;
        }

        // if (event.task.toolname && event.task.toolname == "selectobjects") {
        //     this._inactiveItem(this.commands["cm_selecttype"]);
        //     this._inactiveItem(this.commands["cm_selectspecified"]);
        //     return;
        // }

        if (event.task.toolname && event.task.toolname == "scalingbyframe") {
            GWTK.DomUtil.removeActiveElement(".button-action");
            return;
        }

        var action = event.action.toLowerCase(),
            command;

        if (action.indexOf("ruleractionlength") > -1) {
            command = "cm_mapruler";
        }
        else if (action.indexOf("ruleractionpolygon") > -1) {
            command = "cm_maparea";
        }
        if (action.indexOf("ruleractionangle") > -1) {
            command = "cm_mapangle";
        }
        if (typeof command !== "undefined") {
            this._inactiveItem(this.commands[command]);
        }
        else {
            this.toggleMenuItem(event.action, true);
        }
        return;
    },

    /**
     * Переключить пункт меню
     * @method toggleMenuItem
     * @param toolname {string} имя инструмента карты (чей пункт меню переключается)
     */
    toggleMenuItem: function (toolname, action) {
		
        if (typeof toolname === "undefined") {
            return;
        }
        if (typeof toolname === 'object' && typeof toolname['toolname'] === 'string'){
            toolname = toolname.toolname;
        }
        
        var item = {};
        switch (toolname) {
            case "mapsearch":
                item = this.commands["cm_search"];
                break;
            case "searchSem":
                item = this.commands["cm_searchsem"];
                break;
            case "mapcontent":
                item = this.commands["cm_mapcontent"];
                break;
            case "shuttercontrol":
                item = this.commands["cm_mapshutter"];
                break;
            case 'maplink':
                item = this.commands["cm_maplink"];
                break;
            case 'optionscontrols':
                item = this.commands["cm_mapoptions"];
                break;
            case "featuresamples":
                item = this.commands["cm_mapfeaturesamples"];
                break;
            case "rosreestr":
                item = this.commands["cm_maprosreestr"];
                break;
            // case "routecontrol":
            //     item = this.commands["cm_maproutes"];
            //     break;
            case "thematicmaps":
                item = this.commands["cm_mapthematicmap"];
                break;
			case "userthematic":
                item = this.commands["cm_userthematicmap"];
                break;
            case "mapeditor":
                item = this.commands["cm_mapeditor"];
                break;
            case "mapeditorExt":
                item = this.commands["cm_mapeditorExt"];
                break;
            case "printmap":
                item = this.commands["cm_mapprint"];
                break;
            // case "exportlayer":
            //     item = this.commands["cm_mapexport"];
            //     break;
            case "mapdbm":
                item = this.commands["cm_mapdbm"];
                break;
            case "maproutesbpla":
                item = this.commands["cm_maproutesbpla"];
                break;
            case "buildheatmap":
                item = this.commands["cm_mapbuildheatmap"];
                break;
            case "matrixcontrol":
                item = this.commands["cm_mapmatrixvalues"];
                break;
            case "mapcalculations":
                item = this.commands["cm_mapcalculations"];
                break;
            case "builderofzone":
                item = this.commands["cm_builderzone"];
                break;
            default: break;
        }

        if (!$.isEmptyObject(item)) {
            this._uncheckItem($(item.item));
            this.toggleSubMenuItem(item.item, false);
            $(this.map.eventPane).trigger({'type': 'closemenucontrol', 'cmd': toolname});
        }
        else{
            if (!action)
                $(this.map.eventPane).trigger({'type': 'closemenucontrol', 'name': toolname});
        }

        return;
    },

    /**
     * Включить пункт меню
     * @method _checkItem
     * @param $item {jquery-object} пункт меню
     */
    _checkItem: function ($item) {
        if ($.isEmptyObject($item) || !$item.jquery) return;
        if ($item.hasClass('.ui-state-disabled')){return;}
        $item.find(".menu-item-check").addClass("w2ui-icon-check");
        $item.addClass("menu-item-active");
    },

    /**
     * Выключить пункт меню
     * @method _uncheckItem
     * @param $item {jquery-object} пункт меню
     */
    _uncheckItem: function ($item) {
        if ($.isEmptyObject($item) || !$item.jquery) return;
        $item.find(".menu-item-check").removeClass("w2ui-icon-check");
        $item.removeClass("menu-item-active");
        //$item.addClass('ui-state-disabled');
        //console.log($item);
    },
    
    /**
     * Переключить корневой узел подменю
     * @method toggleSubMenuItem
     * @param item {object} дочерний пункт меню
     */
    toggleSubMenuItem: function (item, active) {
        var $ul = $(item).parent('ul');

        if ($ul.attr("role-sub") === undefined) { return; }

        if (active) {
            $ul.parent().addClass("menu-item-active");
        }
        else if ($ul.find(".menu-item-active").length == 0) {
            $ul.parent().removeClass("menu-item-active");
        }
        return;
    },

    /**
     * Неактивный пункт меню
     * @method _inactiveItem
     * @param item {Object} пункт меню
     */
    _inactiveItem: function (item) {
        if (!$.isEmptyObject(item)) {
            this._uncheckItem($(item.item));
            this.toggleSubMenuItem(item.item, false);
        }
    },

    /**
     * Деструктор
     * @method destroy
     * освободить ресурсы, отключить обработчики событий
    */
    destroy: function () {

        $(this.map.eventPane).off('closecomponent.mapmenu');
        $(this.map.eventPane).off('closeaction.mapmenu');
        $("#panel_button-3dview").off('click.mapmenu');
        this.$menumain.menu("destroy");
        this.$button.remove();
        this.$panel.remove();
    }

};
