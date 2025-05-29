/*************************************** Полищук Г.В.   10/02/21 ****
 *************************************** Нефедьева О.А. 14/01/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Поиск по области                         *
 *               (фрейм, окружность, объект карты)                  *
 *                            GWTK SE                               *
 *******************************************************************/

if (window.GWTK) {
    /**
     * Задача поиска по области
     * @class GWTK.AreaSearchTask
     * @constructor GWTK.AreaSearchTask
    */
    GWTK.AreaSearchTask = function (map, advanced) {

        this.toolname = "areasearch";

        GWTK.MapTask.call(this, map);                                            // родительский конструктор

        if (!this.map) {                                                         // карта
            console.log("GWTK.AreaSearchTask. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        var _id = GWTK.Util.randomInt(30000, 50000);                              // идентификатор элементов
        this.getId = function () { return _id; };

        this._areatypes = ['circle', 'mapobject', 'frame', 'distance'];           // тип области: круг, объект карты, фрейм, расстояние от точки
        this.area = 'circle';                                                     // текущий тип области
        this.action = null;                                                       // текущий обработчик выбора области
        this.gmlId = "";                                                          // идентификатор объекта карты
        this.layerId = "";                                                        // список идентификаторов слоев карты
        this.xArea = "";                                                          // xml-запрос поиска по области
        this.wfs = null;                                                          // запросы поиска объектов
        this.toolbarname = this.map.divID + '_toolbar_areaSearch';                // имя тулбара задачи
        this.advanced = false;                                                    // режим работы
        if (advanced) this.advanced = true;                                       // расширенный режим (все кнопки доступны)
        this._storageKey = 'areaseek_' + this.map.options.id;

        // создать кнопку управления задачей
        this.createToolbarsButton();
        // добавить в карту
        this.map.maptools.push(this);

        this.init();
        return;
    };

    GWTK.AreaSearchTask.prototype = {
        /**
         * Инициализировать компонент
         * @method init
         */
        // ===============================================================
        init: function () {

            var i, count = this.map.options.layers.length, flag = false;
            if (count == 0) {
                console.log(w2utils.lang("No layers to area search."));
                return;
            }
            for (i = 0; i < count; i++) {
                if ('selectObject' in this.map.options.layers[i] && this.map.options.layers[i].selectObject === 1) {
                    flag = true; break;
                }
            }
            if (!flag) {                                                     // нет слоев для поиска по области
                if (window.console)
                    console.log('AreaSearchTask. ' + w2utils.lang("No layers to area search."));
            }
            // создать тулбар задачи
            this.createPane();
            // установить обработчики событий
            this.initEvents();

            this.$radius.css('display', false);
        },

        /**
         * Деструктор
         */
        // ===============================================================
        destroy: function () {
            // очистить параметры работы
            this.clear();
            // удалить кнопку в карте
            $(this.btAreaSearch).off();
             $(this.btAreaSearch).remove();
            // удалить обработчики событий
            this._removeEvents();

            $('.areasearch-distance-lock').remove();

            // удалить из элементов управления карты
            var index = $.inArray(this.map.maptools, this);
            if (index > -1) {
                this.map.maptools.splice(index, 1);
            }
            // удалить toolbar
            if (w2ui[this.toolbarname]) {
                w2ui[this.toolbarname].destroy();
            }
            if (this.$tasktoolbar) {
                this.$tasktoolbar.empty();
                this.$tasktoolbar.remove();
                this.$tasktoolbar = undefined;
            }
            return;
        },

        _removeEvents: function () {
            if (!this.map)
                return;
            // выбран круг
            $(this.map.eventPane).off('circlearea', this.onCircleArea);
            // выбран объект на карте
            $(this.map.eventPane).off('objectarea', this.onObjectArea);
            // выбран фрейм
            $(this.map.eventPane).off('mapframe', this.onMapFrameArea);

            return;
        },

        /**
         * Cоздать кнопку управления задачей в карте
         * @method createToolbarsButton
         */
        // ===============================================================
        createToolbarsButton: function () {
            if (!this.map || !this.map.panes.toolbarPane)
                return;
            var tool = this;

            // кнопка управления задачей
            this.btAreaSearch = GWTK.DomUtil.create('div', 'control-button control-button-radio clickable control-button-areasearch', this.map.panes.toolbarPane);
            this.btAreaSearch.id = 'areasearchbutton';
            this.btAreaSearch.title = w2utils.lang("Area search");
            this.btAreaSearch.toolname = this.toolname;
            this.btAreaSearch._pane = this.toolbarname;

            $(this.btAreaSearch).on('click', function (event) {
                if (tool.map.tiles.getAreaSeekLayers().length == 0) {
                    GWTK.mapWriteProtocolMessage(tool.map, {text:w2utils.lang("No layers to area search."), display:true, icon: "warning",height:100});
                    return;
                }
                var active = $(this).hasClass('control-button-active');
                if (active) {
                    if (!tool.canClose()) {
                        return false;
                    }
                    else {
                        tool.clear();                                                    // закрываем обработчик задачи
                        var items = w2ui[tool.toolbarname].items, len = items.length, i; // кнопки тулбара выключаем
                        for (i = 0; i < len; i++) {
                            if (!items[i].checked) { continue; }
                            w2ui[tool.toolbarname].uncheck(items[i].id);
                            break;
                        }
                    }
                }
                else {
                    if (!tool.map.hasMenu()) {
                    tool.$tasktoolbar.css('top', $(this).position().top + $(this).height() + 5);
                    tool.$tasktoolbar.css('left', $(this).position().left + $(this).height() / 2);
                    }
                }

                tool.map.handlers.toolbar_button_click(event);                            // переключаем кнопку управления задачей
                return;
            });

            return;
        },

        /**
         * Cоздать тулбар задачи
         * @method createPane
         */
        // ===============================================================
        createPane: function () {

            var id = this.getId(),
                $container = $(this.map.mapPane).find('#' + this.toolbarname);
            if ($container.length == 0) {
                this.tasktoolbar = GWTK.DomUtil.create('div', 'map-panel-def toolbar-panel-areasearch', this.map.mapPane);
                this.tasktoolbar.id = this.toolbarname;
                this.$tasktoolbar = $(this.tasktoolbar);
            }
            else {
                this.$tasktoolbar = $(this.tasktoolbar);
            }

            var visibleflag = 'checked',
                statevisible = this._stateRestore(this._stateKey());
            if (!statevisible) visibleflag = 'unchecked';

            var task = this, hidden = !this.advanced;
            var items = [
                        { type: 'radio', id: 'frame', text: '', group: '1', "hint": w2utils.lang("Area of map"), icon: 'button-frame-ico' },
                        { type: 'radio', id: 'mapobject', text: '', group: '1', icon: 'button-mapobject-ico', "hint": w2utils.lang("Object of map") },
                        { type: 'radio', id: 'manual', text: '', group: '1', icon: 'gwtk-icon-list', hidable: true, hidden: hidden },
                        { type: 'radio', id: 'circle', text: '', group: '1', icon: 'button-circle-ico', "hint": w2utils.lang("Point,radius") },
                        { type: 'radio', id: 'distance', text: '', group: '1', icon: 'button-distance-ico', hidable: true, hidden: hidden, "hint": w2utils.lang("Point,given radius") },
                        {
                          type: 'html', id: 'radius', html: '<div class="w2ui-field" style="padding-top: 5px;width:135px;" id="divdistance" >&nbsp;' + w2utils.lang("Radius:") +
                                '&nbsp;<input size="20" id="radius_' + id + '" ' +
                                'style="padding: 0 2px 0 0; border-radius: 2px; border: 1px solid silver; height:18px; width:85px; text-align:right;" ' +
                                'onkeypress="GWTK.AreaSearchTask.prototype.onKeypressRadius(event);" onkeyup="GWTK.AreaSearchTask.prototype.onKeyupRadius(event);" ' +
                                'value="" /></div>'
                        }
            ];
            if (this.advanced){
                items.push({
                    type: 'html',
                    id: 'distance_units',
                    html: '<select ' +
                        'id="' + this.toolbarname + '-distance_units" ' +
                        'style="position: relative; top: 3px; height: 18px; margin-left: 1px; padding: 0; border-radius: 2px; border: 1px solid silver;" ' +
                        'onchange="w2ui[\'' + this.toolbarname + '\'].updateDistanceUnits(this.options[this.selectedIndex].value);"' +
                        '>' +
                        '<option selected>m</option>' +
                        '<option>km</option>' +
                        '</select>'
                });
            }
            items.push(
                { type: 'html', id: 'visibleonly', hint: w2utils.lang('Find only visible'),
                        html:'<div style="display:inline"><input id="check_visible" ' + visibleflag + ' type="checkbox" class="w2ui-expand-check w2ui-node-dots" '+
                             'style="margin:8px 4px 0px !important;" title="Найти только видимые">'+
                             '<span style="line-height:20px;font-size: 1em;">' + w2utils.lang('Visible') + '</span></div>'
                }
            );

            if (!w2ui[this.toolbarname]) {
                $('#' + this.toolbarname).w2toolbar({
                    name: this.toolbarname,
                    tooltip: 'bottom',
                    task: this,
                    items: items,
                    onClick: function (e) {
                        if (!e) { return; }

                        if (e.item.type == 'radio') {                                                      // кнопка ?
                            var waschecked = e.item.checked;
                            e.onComplete = function (e) {
                                if (waschecked) {
                                    task._toggleToolbarButton(e, false);
                                }
                                task._toggleAction(e.item.id, e.item.checked);                             // переключить режим
                                return;
                            }
                            return;
                        }
                    },
                    updateDistanceUnits: function (units) {
                        var item = this.get('distance_units');
                        item.text = units;

                        var dist = task.$radius.val();
                        if (dist) {
                            if (units === 'km') {
                                item.factor = 1000;
                                task.$radius.val(parseFloat(dist) * 0.001);
                            } else if (units === 'm') {
                                item.factor = 1;
                                task.$radius.val(parseFloat(dist) * 1000);
                            }
                        }
                    }
                });

                if (!this.advanced) {
                    this.$tasktoolbar.css('width', '170px').css('min-width', '100px');
                    $('#divdistance').hide();
                }

                this.$radius = $('#radius_' + id);
                this.$radius[0]._tool = this;

                this.$divlock = $('#divdistance');
                this.lock();

                this.$tasktoolbar.hide();

                $('#check_visible').on('change', this._stateSave.bind(this));
            }
            else {
                w2ui[this.toolbarname].render();
            }
        },

        /**
          * Запросить значение расстояния поиска
          * (для режима поиска по расстоянию от точки)
          * @method getDistanceValue
          * @return {Float} введенное значение расстояния в метрах
         */
        // ===============================================================
        getDistanceValue: function () {
            if (!this.$radius) {
                return false;
            }
            var dist = this.$radius.val(), unit = 'm';
            if (dist) {
                dist = parseFloat(dist);
                var item = w2ui[this.toolbarname].get('distance_units');
                if (item) {
                    if (item.text == 'km') {
                        return (dist * 1000);
                    }
                }
                    return dist;
                }

            return false;
        },

        /**
         * Переключить кнопку тулбара задачи
         * @method _toggleToolbarButton
         * @param event {Object} объект события
         * @param check {Boolean} флаг, true - включить
         */
        // ===============================================================
        _toggleToolbarButton: function (event, check) {
            if (!event || check == null || check == undefined || !event.item) {
                return;
            }
            if (!check) {
                w2ui[this.toolbarname].uncheck(event.item.id);
                if (event.item.id == 'distance') {
                    this.lock();
                }
            }
            else {
                w2ui[this.toolbarname].check(event.item.id);
                if (event.item.id == 'distance') {
                    this.unlock();
                }
            }
            w2ui[this.toolbarname].refresh(event.item.id);
            return;
        },

        /**
          * Переключить обработчик поиска по области
          * @method _toggleAction
          * @param button {Object} объект кнопки
          */
        // ===============================================================
        _toggleAction: function (id, ischeck) {
            if (!id) {
                return false;
            }
            var map = this.map, action = id;

            if (!this.isActive) {
                map.setTask(this);
            }

            if (!this.canCancel) {                                    // что-то выполняется здесь, прервать нельзя !
                this.cancel();                                        // ставим отметку об отмене
                return false;
            }

            this.clearCancel();                                       // сбросить флажки завершения
            this.clear();                                             // сбросить параметры задачи (кнопки тоже выключаются!)

            if (!ischeck) {                                           // кнопка выключена, выходим
                this.clearAction();
                return;
            }

            var idLayers = map.tiles.getAreaSeekLayers();
            if (idLayers.length == 0) {
                GWTK.Util.error_report(w2utils.lang("No layers to area search."));
                GWTK.SelectMapFrameAction.prototype.clearRectImage(map);
                return false;
            }

            var pretender = null;

            if (action == 'circle') {
                pretender = new GWTK.SelectAreaCircleAction(this, map);
                this.area = 'circle';
            }
            if (action == 'mapobject') {
                pretender = new GWTK.SelectAreaMapObjectAction(this, map);
                this.area = 'object';
            }
            if (action == 'frame') {
                pretender = new GWTK.SelectMapFrameAction(this, map);
                this.area = 'frame';
            }
            if (action == 'distance') {
                pretender = new GWTK.SelectAreaRadiusAction(this, map, null, this.getDistanceValue());
                this.area = 'distance';
            }
            if (action == 'manual') {
                pretender = new GWTK.SelectManualAreaAction(this, map);
                this.area = 'manual';
            }

            if (!pretender) {
                this.area = '';
                return false;
            }

            if (map.setAction(pretender)) {
                GWTK.DomUtil.removeActiveElement(".button-action");
                this.action = pretender;
                GWTK.DomUtil.removeClass(this.map.eventPane, 'cursor-dragging');
                this.map.setCursor('pointer');
                w2ui[this.toolbarname].check(action);
                w2ui[this.toolbarname].refresh(action);
                if (action == 'distance') {
                    this.unlock();
                }
                else {
                    this.lock();
                    this.$radius.val('');
                }
            }
            else {
                pretender.clear();
                pretender = null;
                this.action = null;
                this.area = '';
            }

            return;
        },

        /**
          * Блокировать ввод данных
          * @method lock
         */
        // ===============================================================
        lock: function () {
            var lock = this.$divlock.find('.areasearch-distance-lock');
            if (lock.length > 0) { lock.show(); return; }
            lock = GWTK.DomUtil.create('div', 'areasearch-distance-lock', this.$divlock[0]);
            this.$divlock.prepend(lock);
            $(lock).show();
        },

        /**
          * Разблокировать ввод данных
          * @method unlock
          */
        // ===============================================================
        unlock: function () {
            var lock = this.$divlock.find('.areasearch-distance-lock');
            if (lock.length > 0) {
                lock.remove();
            }
        },

        /**
          * Отобразить значение радиуса
          * @method showRadius
          * @param radius {Number} значение в метрах
          */
        // ===============================================================
        showRadius: function (radius) {
            if (isNaN(radius)) { return; }
            var tb = w2ui[this.toolbarname];
            var item = tb.get('distance_units');
            if (!item) { return; }
            var radius = parseFloat(radius), unit = 'm';
            if (radius > 1500) { radius = radius / 1000; unit = 'km'; }
            var str = w2utils.formatNumber(3 ? Number(radius).toFixed(3) : radius, ' ');
            this.$radius.val(str);

            item.text = unit;
            $(tb.box).find('#' + this.toolbarname + '-distance_units').val(unit);
        },

        /**
         * Инициализация обработчиков событий
         * @method initEvents
         */
        // ===============================================================
        initEvents: function () {

            this.onCircleArea = GWTK.Util.bind(this.onCircleArea, this);
            this.onObjectArea = GWTK.Util.bind(this.onObjectArea, this);
            this.onMapFrameArea = GWTK.Util.bind(this.onMapFrameArea, this);
            this.onKeyupRadius = GWTK.Util.bind(this.onKeyupRadius, this);

            // выбрана область на карте
            $(this.map.eventPane).on('circlearea', this.onCircleArea);
            // выбран объект на карте
            $(this.map.eventPane).on('objectarea', this.onObjectArea);
            // отменен обработчик
            //$(this.map.eventPane).on('actioncancel', this.onActionCancel);
            $(this.map.eventPane).on('mapframe', this.onMapFrameArea);

            var task = this;
            $(this.btAreaSearch).on('distancedone', function (event) {
                if (task.action && (task.action instanceof GWTK.SelectAreaRadiusAction)) {
                    var dist = parseFloat(event.distance);
                    var item = w2ui[task.toolbarname].get('distance_units');
                    if (item && item.text == 'km') {
                        dist = dist * 1000;
                    }
                    task.action.setDistance(dist);
                }
            });

            return;
        },

        /**
          * Удалить oбработчик карты
          * @method onActionCancel
          * @param event {Object} объект кнопки
         */
        // ===============================================================
        clearAction: function (event) {

            w2ui[this.toolbarname].uncheck('frame');
            w2ui[this.toolbarname].uncheck('circle');
            w2ui[this.toolbarname].uncheck('mapobject');
            w2ui[this.toolbarname].uncheck('distance');
            w2ui[this.toolbarname].uncheck('manual');

            this.action = null;
            this.xArea = null;
            this.area = '';

            return;
        },

        /**
         * Очистить параметры работы компонента
         * @method clear
         */
        // ===============================================================
        clear: function () {
            if (this.action) {
                if (this.map.closeAction()) {
                    this.action = null;
                    this.xArea = null;
                    this.area = '';
                 }
            }
            return;
        },

        /**
         * Обработчик события "objectarea" (выбран объект - область поиска)
         * @method onObjectArea
         */
        // ===============================================================
        onObjectArea: function (event) {
            var tool = this;

            if (!(this.action instanceof GWTK.SelectAreaMapObjectAction) && !(this.action instanceof GWTK.SelectManualAreaAction)) return;

            if (!tool.createWfs()) {
                GWTK.Util.showMessage(w2utils.lang("Failed to get data"));
                return;
            }

            if (!tool.xArea || !tool.xArea.length) {
                return;
            }

            //tool.map.handlers.clearselect_button_click();
            GWTK.Util.clearselectedFeatures(this.map);

            var count = tool.xArea.length / 2;
            var coord = tool.xArea.join(" ");

            // установить каким объектом задана область поиска ( 1 - лин, 2 - пл )
            var type = 1;
            if (event && event.geometry) {
                if (event.geometry == 'polygon') type = 2;
                if (event.geometry == 'linestring') type = 1;
            }

            tool.xArea = '<?xml version="1.0" encoding="utf-8"?>' +
            '<wfs:FeatureCollection version="2.0.0" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:fes="http://www.opengis.net/fes/2.0"  xmlns:gml="http://www.opengis.net/gml/3.2.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0.0/wfs.xsd http://www.opengis.net/gml/3.2 http://www.opengis.net/gml/3.2.1/gml.xsd"' +
            ' timeStamp="14.09.2015 17:54:54" numberMatched="1" numberReturned="1">' +
            '<wfs:member><bsd:Roads gml:id="id">' +
            '<bsd:RoadsCode>1000000001</bsd:RoadsCode>' +
            '<gml:LineString srsName="urn:ogc:def:crs:EPSG:4326">' +
            '<gml:posList srsDimension="2" count="' + count + '">' + coord + '</gml:posList>' +
            '</gml:LineString></bsd:Roads></wfs:member></wfs:FeatureCollection>';

            var method = 'AREASEEKCROSSSQUARE';
            if (type == 1) method = 'AREASEEKCROSSLINE';

            GWTK.Util.showWait();

            this.postData(method, 0);

            event.stopPropagation();

            return;
        },

        /**
         * Обработчик события "circlearea" (выбран круг)
         * @method onCircleArea
         */
        // ===============================================================
        onCircleArea: function (event) {
            var map = this.map;
            var idLayers = map.tiles.getAreaSeekLayers();

            //map.handlers.clearselect_button_click();
            GWTK.Util.clearselectedFeatures(map);

            if (idLayers.length == 0) {
                GWTK.Util.error_report(w2utils.lang("No layers to area search."));
                 return false;
            }
            var tool = this;
            if (!tool) return;

            if (!tool.createWfs()) {
                GWTK.Util.showMessage(w2utils.lang("Failed to get data"));
                return;
            }

            if (this.area == 'circle') {
                this.showRadius(event.circle.radius);
            }

            var coord = event.circle.ring;
            var count = coord.length;
            coord = coord.join(" ");
            tool.xArea = '<?xml version="1.0" encoding="utf-8"?>' +
            '<wfs:FeatureCollection version="2.0.0" xmlns:bsd="http://www.gisinfo.net/bsd" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:fes="http://www.opengis.net/fes/2.0"  xmlns:gml="http://www.opengis.net/gml/3.2.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.gisinfo.net/bsd http://www.gisinfo.net/bsd/topomap.xsd http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0.0/wfs.xsd http://www.opengis.net/gml/3.2 http://www.opengis.net/gml/3.2.1/gml.xsd"' +
            ' timeStamp="14.09.2015 17:54:54" numberMatched="1" numberReturned="1">' +
            '<wfs:member><bsd:Roads gml:id="id">' +
            '<bsd:RoadsCode>1000000001</bsd:RoadsCode>' +
            '<gml:Polygon srsName="urn:ogc:def:crs:EPSG:4326"><gml:exterior>' +
            '<gml:LineString srsName="urn:ogc:def:crs:EPSG:4326">' +
            '<gml:posList srsDimension="2" count="' + count + '">' + coord + '</gml:posList>' +
            '</gml:LineString></gml:exterior></gml:Polygon></bsd:Roads></wfs:member></wfs:FeatureCollection>';

            GWTK.Util.showWait();

            tool.postData('areaseekcrosssquare', 0);

            event.stopPropagation();

            return;
        },

        /**
         * Обработчик события "mapframe" (выбран фрейм)
         * @method onMapFrameArea
         * @param event {Object} объект события, event.geometry - координаты
         */
        // ===============================================================
        onMapFrameArea: function (event) {
            if (!this.action || !event || !event.geometry)
                return false;

            if ((this.action instanceof GWTK.SelectMapFrameAction) == false)
                return;

            if (!this.createWfs() || !$.isArray(event.geometry) || event.geometry.length == 0) {
                GWTK.Util.showMessage(w2utils.lang("Failed to get data"));
                return;
            }

            //this.map.selectedObjects.clear();
            GWTK.Util.clearselectedFeatures(this.map);

            var count = event.geometry.length;
            var coord = event.geometry.join(" ");

            var idLayers = this.map.tiles.getAreaSeekLayers();
            if (idLayers.length == 0) {
                GWTK.Util.error_report(w2utils.lang("No layers to area search."));
                return false;
            }

            this.xArea = '<?xml version="1.0" encoding="utf-8"?>' +
            '<wfs:FeatureCollection version="2.0.0" xmlns:bsd="http://www.gisinfo.net/bsd" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:fes="http://www.opengis.net/fes/2.0"  xmlns:gml="http://www.opengis.net/gml/3.2.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.gisinfo.net/bsd http://www.gisinfo.net/bsd/topomap.xsd http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0.0/wfs.xsd http://www.opengis.net/gml/3.2 http://www.opengis.net/gml/3.2.1/gml.xsd"' +
            ' timeStamp="12.12.2016 17:54:54" numberMatched="1" numberReturned="1">' +
            '<wfs:member><bsd:Roads gml:id="id">' +
            '<bsd:RoadsCode>1000000001</bsd:RoadsCode>' +
            '<gml:Polygon srsName="urn:ogc:def:crs:EPSG:4326"><gml:exterior>' +
            '<gml:LineString srsName="urn:ogc:def:crs:EPSG:4326">' +
            '<gml:posList srsDimension="2" count="' + count + '">' + coord + '</gml:posList>' +
            '</gml:LineString></gml:exterior></gml:Polygon></bsd:Roads></wfs:member></wfs:FeatureCollection>';

            GWTK.Util.showWait();

            this.postData('areaseekcrosssquare', 0);

            event.stopPropagation();

            return;
        },

        /**
         * Отправить запрос поиска по области
         * @method postData
         */
        // ===============================================================
        postData: function (method, start_index) {

            if (!this.wfs || !this.xArea || !method)
                return;

            var viewfilterflag = this.getSearchForVisible();

            this.canCancel = false;

            this.map.setCursor('progress');

            var uri_param = "?mapid=1&objcenter=2&objlocal=0,1,2,4&filedata=1&semanticname=1&start_index=" + start_index + "&area=1&semantic=1&getframe=1&ignoreEndToEndNumbering=1";

            var rpcArea = GWTK.Util.utf8ToBase64(this.xArea);
            var tmpObj = {};
	        var i;
	        for(i = 0; i < this.map.layers.length; i++){
		        tmpObj[this.map.layers[i].xId] = {};
		        tmpObj[this.map.layers[i].xId]['selectObject'] = this.map.layers[i]['selectObject'];
		        tmpObj[this.map.layers[i].xId]['areaSeek'] = this.map.layers[i]['areaSeek'];
		        this.map.layers[i]['selectObject'] = this.map.layers[i]['areaSeek'];
	        }

	        this.wfs.centering = false;

            this.wfs.restMethod(method, uri_param, rpcArea, this._onDataLoaded, viewfilterflag);

	        for(i = 0; i < this.map.layers.length; i++){
		        if(tmpObj[this.map.layers[i].xId] !== undefined){
			        this.map.layers[i]['selectObject'] = tmpObj[this.map.layers[i].xId]['selectObject'];
			        this.map.layers[i]['areaSeek'] = tmpObj[this.map.layers[i].xId]['areaSeek'];
		        }
            }

        },

        /**
        * Создать класс запросов WfsQueries
        * @method createWfs
        */
        // ===============================================================
        createWfs: function () {
            if (!this.map) return false;

            if (this.wfs == null) {
                this.wfs = new GWTK.WfsRestRequests(this.map);
                this._onDataLoaded = GWTK.Util.bind(this._onDataLoaded, this);
            }
            return true;
        },

        /**
        * Получить ответ операции поиска
        * @method _onDataLoaded
        */
        // ===============================================================
        _onDataLoaded: function (responses) {

            GWTK.Util.hideWait();

            if (this.action && this.action.toggleFind) {
                this.action.toggleFind(false);
            }

            if (!this.map) return;

            this.canCancel = true;

            this.map.setCursor('default');

            this.clear();

            /*if (this.isCancelled) {
                this.isCancelled = false;
                return;
            }*/

            $(this.map.underlayPane).fadeOut("slow");
        },

        getSearchForVisible: function(){
            var checkbox = this.$tasktoolbar.find("#check_visible");
            if (checkbox.length > 0) {
                return checkbox[0].checked;
            }
            return false;
        },

        /**
         * Проверить ввод пользователя
         * @method onKeyupRadius
         */
        // ===============================================================
        onKeypressRadius: function (event) {
            if (!event) {
                return false;
            }

            var id = event.target ? event.target.id : event.srcElement.id,
                $input = $('#' + id),
                text = $input.val();

            if (event.keyCode == 13) {
                console.log();
                if (text.length != 0) {
                    $('#areasearchbutton').trigger({ type: 'distancedone', distance: text });
                    event.stopPropagation();
                }
                return true;
            }

            text += event.key;

            if (w2utils.isFloat(text) || w2utils.isInt(text)) {
                return true;
            }
            event.stopPropagation();
            event.preventDefault();

            return;
        },

        /**
         * Проверить ввод пользователя
         * @method onKeyupRadius
         */
        // ===============================================================
        onKeyupRadius: function (event) {

            if (!event) {
                return false;
            }
            var charCode = event.keyCode,
                id = event.target ? event.target.id : event.srcElement.id,
                $input = $('#' + id),
                text = $input.val();

            if (text.length != 0 && $input[0]._tool) {
                var tool = $input[0]._tool;
                if (tool.action && (tool.action instanceof GWTK.SelectAreaRadiusAction)) {
                    $('#areasearchbutton').trigger({ type: 'distancedone', distance: text });
                }
                return true;
            }

            return false;
        },

        /**
         * Сохранить состояние
         * @method _stateSave
         */
        _stateSave: function(){
            GWTK.Util.stateSaveStorage(this._stateKey(), this.getSearchForVisible());
        },

        /**
         * Восстановить состояние
         * @method _stateSave
         */
        _stateRestore: function(key) {
            var _value = GWTK.Util.stateRestoreStorage(key);
            if (typeof _value !== 'boolean') _value = true;
            return _value;
        },

        /**
         * Получить ключ хранения состояния
         * @method _stateSave
         */
        _stateKey: function() {
            return this._storageKey;
        }
    }

    GWTK.Util.inherits(GWTK.AreaSearchTask, GWTK.MapTask);

}
