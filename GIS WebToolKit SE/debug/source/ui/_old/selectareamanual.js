/**************************************** Нефедьева О. 24/07/18 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2018              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Ручной ввод координат области поиска            *
 *                                                                  *
 *******************************************************************/


if (window.GWTK) {
    /**
     * Компонент Выбор области вводом координат
     * @class GWTK.SelectManualAreaAction
     * @constructor GWTK.SelectManualAreaAction
     */
    GWTK.SelectManualAreaAction = function (task, map, parent) {

        this.toolname = 'selectManualArea';

        this._id = GWTK.Util.randomInt(800, 9000);

        GWTK.MapAction.call(this, task, (this.toolname + this._id));

        if (this.task) {
            this.map = this.getMap();
        }
        else {
            this.map = map;
            this.task = task;
        }
        if (!this.map) {
            console.log("selectAreaCircle. " + w2utils.lang("Not defined a required parameter") + " Map.");
            this.error = true;
            return;
        }
        
        this.panel = document.getElementById(parent);                             // панель обработчика

        this._gridname = 'grid_' + this.toolname;                                 // имя грида

        this.selectedFeatures = null;

        this._cookieKey = GWTK.cookies.getKey() + '_' + this.toolname;

        return;
    };

    GWTK.SelectManualAreaAction.prototype = {
        /**
         * Инициализация
         * @method init
         */
        init: function () {
            this.started = false;

            this.createPanel();

            this.renderGrid();

            this.setDragable();

            this.setResizable();

            this.initSelectedFeatures();

        },

        /**
          * Инициализация класса отобранных объектов карты
          * @method initSelectedFeatures
         */
        initSelectedFeatures: function () {
            if (!this.selectedFeatures) {
                this.selectedFeatures = new GWTK.selectedFeatures(this.map);
                this.selectedFeatures.drawoptionsSelected.stroke = "red";
                this.selectedFeatures.drawoptionsSelected.fill = "red";
                this.selectedFeatures.drawoptionsSelected["stroke-width"] = "0px";
                this.selectedFeatures.drawoptionsSelected["fill-opacity"] = "0.23";
            }

            this.selectedFeatures.clear();
            
            return;
        },

        /**
          * Создать панель
          * @method createPanel
         */
        createPanel: function(){

            if (!this.panel) {
                var pan = $(this.map.mapPaneOld).find('.manual-area-panel');
                if (pan.length == 0) {
                    this.panel = GWTK.DomUtil.create('div', 'map-panel-def resizable manual-area-panel', this.map.mapPaneOld);
                }
                else {
                    this.panel = pan[0];
                    $(this.panel).show();
                }
            }
            
            this.panel.setAttribute('name', this.name);
            this.$panel = $(this.panel);
            
            if ($('#' + this._gridname).length == 0) {
                this.gridPane = GWTK.DomUtil.create('div', 'w2ui-reset w2ui-grid resizable', this.panel);
                this.gridPane.setAttribute('name', this._gridname);
                this.gridPane.setAttribute('id', this._gridname);
            }
            else {
                this.gridPane = $('#' + this._gridname)[0];
                this.gridPane.setAttribute('name', this._gridname);
            }

            this.$gridPane = $(this.gridPane);
            this.$gridPane.height(this.$panel.height() - 5);

            return;
        },

        /**
          * Вывести грид координат области поиска
          * @method renderGrid
         */
        renderGrid: function () {
            var gname = this._gridname, tool = this;

            if (w2ui[this._gridname]) {
                w2ui[this._gridname].render();
            }
            
            this.$gridPane.w2grid({
                'name': this._gridname,
                'header': w2utils.lang('Search area'),
                multiSelect: true,
                recNumber:4,
                show: {
                    'header': false,
                    'toolbar': true,
                    'selectColumn': true,
                    'lineNumbers': true,
                    'toolbarAdd': true,
                    'toolbarDelete': true,
                    'toolbarSearch': false,
                    'toolbarReload': false,
                    'toolbarColumns' : false

                },
                toolbar: {
                    items: [
                        { type: 'break' },
                        { type: 'button', id: 'find', caption: w2utils.lang('Search'), icon: 'w2ui-icon icon-search-down', tooltip: w2utils.lang('Search'), disabled: false },
                        { type: 'break' },
                        { type: 'spacer' },
                        {
                            type: 'menu', id: 'coordFormat', caption: w2utils.lang('Format: degrees,minutes,seconds'), tooltip: w2utils.lang('Format'),
                            selected: ['degminsec'],
                            items: [
                                { id: 'degrees', text: w2utils.lang('degrees').toLowerCase() },
                                { id: 'degminsec', text: w2utils.lang('degrees,minutes,seconds') }
                            ]
                        }
                    ],
                    onClick: function (target, event) {
                        if (target.indexOf(':') == -1) {
                            event.stopPropagation();
                            if (target == 'find') {
                                this.onFind(event);
                            }
                            return;
                        }
                        this.setCoordFormat(event);
                        return;
                    },

                    onApplay: function (event) {
                        var item = this.get('coordFormat');
                        //tool._drawArea(tool.getArea(item.selected[0]));
                    },

                    onFind: function (event) {
                        tool.startSearch(event);
                        return;
                    },

                    setCoordFormat: function (event) {
                        if (!event || event.item.id != 'coordFormat') {
                            return;
                        }
                        if (event.item.selected[0] && (event.item.selected[0] == event.subItem.id)) {
                            return;                                                       // выбор не изменился...
                        }
                        event.item.caption = w2utils.lang('Format') +': ' + event.subItem.text;
                        event.item.selected = [event.subItem.id];
                        event.item.checked = false;
                        this.refresh('coordFormat');
                        if (event.subItem.id == 'degrees') {
                            w2ui[gname].columnGroups = [];
                            tool._setDegrees();
                        }
                        else {
                            w2ui[gname].columnGroups = [{ caption: w2utils.lang("Latitude"), span: 3 }, { caption: w2utils.lang('Longitude'), span: 3 }];
                            tool._setDegreesMinutesSeconds();
                        }
                        w2ui[gname].toggleColumn('lat_grad_dec', 'lat_grad', 'lat_min', 'lat_sec', 'lng_grad', 'lng_min', 'lng_sec', 'lng_grad_dec');
                        w2ui[gname].refresh();
                        return;
                    }
                    
                },
                records: [/*{ recid: 1, lat_grad: 55, lat_min: 50, lat_sec: 20, lng_grad: 38, lng_min: 22, lng_sec: 25 },
                           { recid: 2, lat_grad: 55, lat_min: 54, lat_sec: 03, lng_grad: 38, lng_min: 28, lng_sec: 16 },
                           { recid: 3, lat_grad: 55, lat_min: 50, lat_sec: 43, lng_grad: 38, lng_min: 30, lng_sec: 14 }*/
                         ],
                columnGroups: [
                   { caption: w2utils.lang('Latitude'), span: 3 },
                   { caption: w2utils.lang('Longitude'), span: 3 }
                ],
                columns: [
                          { field: 'lat_grad', caption: w2utils.lang('degrees'), size: '15%', resizable: true, editable: { type: 'int', min: -84, max: 84 }, hideable: true },
                          { field: 'lat_min', caption: w2utils.lang('minutes'), size: '15%', resizable: true, editable: { type: 'int', min: 0, max: 59 }, hideable: true },
                          { field: 'lat_sec', caption: w2utils.lang('seconds'), size: '15%', resizable: true, editable: { type: 'int', min: 0, max: 59 }, hideable: true },
                          { field: 'lat_grad_dec', caption: w2utils.lang('Latitude'), size: '50%', resizable: true, editable: { type: 'float', min: -85, max: 85, precision: 6, hidden: true, hideable: true } },
                          { field: 'lng_grad', caption: w2utils.lang('degrees'), size: '15%', resizable: true, editable: { type: 'int', min: -179, max: 179 }, hideable: true },
                          { field: 'lng_min', caption: w2utils.lang('minutes'), size: '15%', resizable: true, editable: { type: 'int', min: 0, max: 59 }, hideable: true },
                          { field: 'lng_sec', caption: w2utils.lang('seconds'), size: '15%', resizable: true, editable: { type: 'int', min: 0, max: 59 }, hideable: true },
                          { field: 'lng_grad_dec', caption: w2utils.lang('Longitude'), size: '50%', resizable: true, editable: { type: 'float', min: -180, max: 180, precision: 6, hideable: true, hidden: true } }
                ],
                onAdd: function (event) {
                    var recid = this.recNumber;
                    var record = { recid: this.recNumber, lat_grad: "", lat_min: "0", lat_sec: "0", lat_grad_dec: "", lng_grad: "", lng_min: "0", lng_sec: "0", lng_grad_dec:""};
                    w2ui[gname].add(record);
                    this.recNumber++;
                },
                onChange: function (event) { event.stopPropagation(); },
                onEdit: function (event) { event.stopPropagation(); },
                onDelete: function (event) { event.stopPropagation(); },
                onClick: function (event) { }
            });
            
            w2ui[this._gridname].render();
            w2ui[this._gridname].toggleColumn('lat_grad_dec', 'lng_grad_dec');

            return;
        },

        /**
          * Настроить обработчик
          * @method set
         */
        set: function () {

            this.init();

            this._readCookie();

            return;
        },

        /**
          * Очистить обработчик (удалить изображение, отключить события)
          * @method clear
         */
        clear: function () {

            this._writeCookie();

            if (w2ui[this._gridname]) {
                w2ui[this._gridname].destroy();
                //$('#' + this._gridname).remove();
            }
            this.$panel.hide();

            if (this.selectedFearures) {
                this.selectedFearures.destroy();
                this.selectedFearures = null;
            }

            if (this.task) {
                this.task.clearAction();
            }
            return;
        },

        /**
          * Установить формат координат "Градусы, минуты, секунды"
          * @method _setDegrees
         */
        _setDegrees: function () {
 
            var records = w2ui[this._gridname].records;
            if (records.length == 0) { return false; }

            var i, len, ll = new GWTK.LatLng(0, 0);
            for (i = 0; len = records.length, i<len; i++) {
                var rec = records[i];
                if ((!rec['lat_grad'] || rec['lat_grad'].length == 0) ||
                    (!rec['lat_min'] || rec['lat_min'].length == 0)   ||
                    (!rec['lat_sec'] || rec['lat_sec'].length == 0)   ||
                    (!rec['lng_grad'] || rec['lng_grad'].length == 0) ||
                    (!rec['lng_min'] || rec['lng_min'].length == 0)   ||
                    (!rec['lng_sec'] || rec['lng_sec'].length == 0)) {
                    return false;
                }
                var g = parseInt(rec['lat_grad'], 10),
                    m = parseInt(rec['lat_min'], 10),
                    s = parseInt(rec['lat_sec'], 10);
                var B = ll.DegreesMinutesSeconds2Degrees(g, m, s);
                records[i]['lat_grad_dec'] = B.toFixed(8);
                g = parseInt(rec['lng_grad'], 10),
                m = parseInt(rec['lng_min'], 10),
                s = parseInt(rec['lng_sec'], 10);
                var L = ll.DegreesMinutesSeconds2Degrees(g, m, s);
                records[i]['lng_grad_dec'] = L.toFixed(8);
            }
            return true;
        },

        /**
          * Установить формат координат "Градусы"
          * @method _setDegreesMinutesSeconds
         */
        _setDegreesMinutesSeconds: function () {
            var records = w2ui[this._gridname].records, i, len;
            if (records.length == 0) { return false; }

            for (i = 0; len = records.length, i < len; i++) {
                var b = this.degrees2DegreesMinutesSeconds(records[i]['lat_grad_dec']),
                    l = this.degrees2DegreesMinutesSeconds(records[i]['lng_grad_dec']);
                records[i]['lat_grad'] = b.degrees;
                records[i]['lat_min'] = b.minutes;
                records[i]['lat_sec'] = b.seconds;
                records[i]['lng_grad'] = l.degrees;
                records[i]['lng_min'] = l.minutes;
                records[i]['lng_sec'] = l.seconds;
            }
            return true;
        },

        /**
          * Перевод значения координаты градусы -> градусы, минуты, секунды
          * @method degrees2DegreesMinutesSeconds
          * @param degrees {Number} градусы
          * @return {Object} { 'degrees': g, 'minutes': m, 'seconds': s }
         */
        // ===============================================================
        degrees2DegreesMinutesSeconds: function (degrees) {
            var degrees = parseFloat(degrees);
            var ideg = parseInt(degrees, 10),
                minsec = (degrees - parseFloat(ideg)) * 3600.0;      // остаток -> секунды
            
            var min = parseFloat(minsec) / 60.0,
                sec = parseFloat(minsec) % 60.0,
                imin = parseInt(min, 10);
            sec = parseInt(sec + 0.5);
            if (sec >= 60){
                sec = sec - 60;
                imin += 1;
            }
            if (imin >= 60) {
                imin = (imin - 60);
                if (ideg < 0) {
                    ideg -= 1;
                }
                else {
                    ideg += 1;
                }
            }
            return { 'degrees': ideg, 'minutes': imin, 'seconds': sec };
        },

        /**
          * Запросить область поиска
          * @method getArea
          * @return {GWTK.mapobject} объект карты
          * При ошибке возвращает `false`
        */
        // ===============================================================
        getArea: function () {
            if (!this.map || !w2ui[this._gridname]) { return; };

            if (!this._mergeAndTest()) { return false; }

            var item = w2ui[this._gridname].toolbar.get('coordFormat'),
                format = 3;
            if (item.selected[0] == 'degrees') format = 1;
            if (format == 3) {
                if (!this._setDegrees()) {
                    w2alert(w2utils.lang('Error coordinate value') + '!');
                    return;
                }
            }

            var records = w2ui[this._gridname].records, i, len;

            var mapobject = new GWTK.mapobject(this.map);
            mapobject.gid = "manualarea.1";
            mapobject.setSpatialposition('Polygon');
            
            for (i = 0; len = records.length, i < len; i++) {
                mapobject.geometry.appendpoint(records[i]['lat_grad_dec'], records[i]['lng_grad_dec']);
            }
            mapobject.geometry.appendpoint(records[0]['lat_grad_dec'], records[0]['lng_grad_dec']);   // замкнули первой точкой

            mapobject.saveJSON();

            mapobject.oJSON.features[0].properties = {};
            mapobject.oJSON.features[0].properties.name = 'manualarea';
            mapobject.oJSON.features[0].properties.id = 'manualarea.1';
            
            mapobject.setbbox();

            mapobject.objectcenter = GWTK.toLatLng(mapobject.bbox[1] + (mapobject.bbox[3] - mapobject.bbox[1]) / 2, mapobject.bbox[0] + (mapobject.bbox[2] - mapobject.bbox[0]) / 2);

            return mapobject;
        },

        /**
          * Применить изменения координат в гриде
          * @method _applayChanges
         */
        // ===============================================================
        _applayChanges: function () {
            var changes = w2ui[this._gridname].getChanges();

            if (!changes || changes.length == 0) { return; }
            var j, len = changes.length;
            for (j = 0; j < len; j++) {
                var record = w2ui[this._gridname].get(changes[j].recid);
                for (var coll in changes[j]) {
                    var value = changes[j][coll];
                    if (typeof (value) != "undefined") {
                        record[coll] = value;
                    }
                }
            }
            return;
        },

        /**
          * Проверить значения координат в записи
          * @method _testRecord
          * @param record {Object} запись грида
          * @return {Boolean} `false` - ошибка значения
         */
        // ===============================================================
        _testRecord: function (record) {
            if (typeof record == 'undefined') { return false; }

            var format = w2ui[this._gridname].toolbar.get('coordFormat').selected[0];
            var grid = w2ui[this._gridname];
            var ok = true, count = 0;

            for (var field in record) {
                var value = record[field];
                count++;
                if (typeof (value) == "undefined" || value.length == 0) {
                    if (field == 'lat_min' || field == 'lat_sec' || field == 'lng_min' || field == 'lng_sec') {
                        record[field] = "0";
                        continue;
                    }
                    if (format == 'degminsec' && (field == 'lat_grad_dec' || field == 'lng_grad_dec')) { continue; }

                    ok = false;
                }
            }
            if (count == 1) { ok = false; }
            
            return ok;
        },

        /**
          * Слить изменения координат в гриде и проверить записи
          * @method _mergeAndTest
          * @return {Boolean} `false` - ошибка значения в записи
         */
        // ===============================================================
        _mergeAndTest: function () {
            if (!this.map || !w2ui[this._gridname]) { return false; };

            this._applayChanges();

            var records = w2ui[this._gridname].records, i, len;
            if (records.length < 3) {
                w2alert(w2utils.lang('Enter degrees') + '!');
                return false;
            }

            w2ui[this._gridname].selectNone();
            var test = true, select = [];
            for (i = 0; len = records.length, i < len; i++) {
                if (!this._testRecord(records[i])) {
                    test = false;
                    select.push(records[i].recid);
                }
            }
            if (!test) {
                for (i = 0; len = select.length, i < len; i++) {
                    w2ui[this._gridname].select(select[i]);
                }
                var msg = w2utils.lang('Error coordinate value') + '!';
                w2ui[this._gridname].error(msg);
                return false;
            }

            w2ui[this._gridname].mergeChanges();

            return true;
        },

        /**
          * Начать поиск
          * @method startSearch
         */
        // ===============================================================
        startSearch: function (event) {

            var area = this.getArea();

            if (!area) return;
            
            this.task.xArea = [];

            this.toggleFind(true);

            this._drawArea(area);

            var i, len = this.selectedFeatures.drawselobject.geometry.points.length;
            
            for (i = 0; i < len; i++) {
                this.task.xArea.push(this.selectedFeatures.drawselobject.geometry.points[i].x);
                this.task.xArea.push(this.selectedFeatures.drawselobject.geometry.points[i].y);
            }
            
            $(this.map.eventPane).trigger({ type: 'objectarea', geometry: 'polygon', area: { coords: [] } });

            this.clearImage();

            return;
        },

        _drawArea: function (area) {

            if (!area) return;

            if (!this.selectedFeatures) this.initSelectedFeatures();

            this.selectedFeatures.drawselobject = area;

            this.selectedFeatures.selected = [area.gid];

            if (this.selectedFeatures.svgDrawSelected) {
                $(this.selectedFeatures.svgDrawSelected.drawingMethod.drawpanel).show();
            }

            this.selectedFeatures.drawcontour(area, true, true, true, true);        //drawcontour(mapobject, clear, select, setposition, setframe)
        },

        /**
         * Очистить изображение
         * @method clearImage
        */
        // ===============================================================
        clearImage: function () {
            var draw = this.selectedFeatures;
            $(this.selectedFeatures.svgDrawSelected.drawingMethod.drawpanel).fadeOut(3000,function () { draw.cleardrawobject("manualarea.1", true); return; });
            return;
        },

        /**
         * Переключить состояние disabled кнопки Поиск
         * @method toggleFind
        */
        // ===============================================================
        toggleFind: function (flag) {
            
            var item = w2ui[this._gridname].toolbar.get('find');
            if (typeof flag == 'undefined') {
                item.disabled = !item.disabled;
            }
            else {
                item.disabled = flag;
            }
            w2ui[this._gridname].toolbar.refresh('find');
        },

        /**
          * Установить способность к перемещению
          * @method setDragable
         */
        setDragable: function () {
            if (!this.map) return;
            var tool = this;

            this.$panel.draggable({
                stop: function (event, ui) { /*tool._savePosition();*/ }
            });

            return;
        },

        /**
          * Установить способность изменять размер
          * @method setResizable
        */
        setResizable: function () {
            var tool = this;

            this.$panel.resizable({
                alsoResize: "#" + this._gridname,
                handles: 'all',
                create: function (e, ui) { $(this).parent().on('resize', function (e) { e.stopPropagation(); }); },
                resize: function (e, ui) { w2ui[tool._gridname].resize(); }

            });

            return;
        },

        _writeCookie: function () {
            if (!localStorage || !w2ui[this._gridname]) { return; }

            localStorage.removeItem(this._cookieKey);

            if (w2ui[this._gridname].records.length > 0) {
                localStorage.setItem(this._cookieKey, JSON.stringify({ "coord": w2ui[this._gridname].records }));
            }
            return;
        },

        _readCookie: function () {
            if (!localStorage || !w2ui[this._gridname]) {
                return;
            }
            var scoord = localStorage.getItem(this._cookieKey);
            if (!scoord) { return; }
            var _value = JSON.parse(scoord), i, len;
            if (_value.coord == undefined || _value.coord.length == 0) {
                return;
            }
            var recid = 1;
            for (i = 0; len = _value.coord.length, i < len; i++) {
                var r_id = parseInt(_value.coord[i].recid);
                recid = Math.max(recid, r_id);
            }
            recid++;

            w2ui[this._gridname].recNumber = recid;

            w2ui[this._gridname].records = _value.coord;

            w2ui[this._gridname].refresh();
        }
    };

    GWTK.Util.inherits(GWTK.SelectManualAreaAction, GWTK.MapAction);
}