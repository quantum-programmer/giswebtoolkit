/**************************************** Гиман Н.     02/11/17 ****
**************************************** Соколова Т.О. 04/06/21 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2015              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*    Редактирование геометрии объекта слоя с клавиатуры            *
*                                                                  *
*******************************************************************/

var geomEditors = {};

if (window.GWTK) {
    /**
     * Компонент редактирования геометрии объекта слоя с клавиатуры 
     * @class GWTK.GeometryEditor
     * @constructor GWTK.GeometryEditor
     * @param map {Object} Объект карта
     * @param id {String} Идентификатор объекта
     * @param geometryJSON {Object} Объект геометрии в формате json {"type": "", "coordinates": [] };
     * @param options {Object} Формат отображения данных в формате json { "action": "edit", "format": "BL", "precision_m": 8, "precision_sec": 4, "precision_grad": 8, "precision_h": 2, "visible_h": 0 };
     * @param subject {Int} Номер подобъекта (контура)
     */
    // ===============================================================
    GWTK.GeometryEditor = function (map, id, geometryJSON, options, subject) {
        this.error = true;

        this.toolname = 'editorhistory';
        if (!map) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        this.map = map;
        this.id = id;
        delete geomEditors[this.id];
        geomEditors[this.id] = this;

        this.textId = this.id + '_text';

        this.options = (options) ? options : { "action": "edit", "format": "BL", "precision_m": 8, "precision_sec": 4, "precision_grad": 8, "precision_h": 2, "visible_h": 0 };
        this.options.action = (options && options.action) ? options.action : "edit";
        this.options.format = (options && options.format) ? options.format : "BL"; //"BLgrad",
        this.options.precision_m = (options && options.precision_m) ? parseInt(options.precision_m) : 8;
        this.options.precision_sec = (options && options.precision_sec) ? parseInt(options.precision_sec) : 4;
        this.options.precision_grad = (options && options.precision_grad) ? parseInt(options.precision_grad) : 8;
        this.options.precision_h = (options && options.precision_h) ? parseInt(options.precision_h) : 2;
        this.options.visible_h = (options && options.visible_h) ? parseInt(options.visible_h) : 0;
        this.options.text = (options && options.text != undefined) ? options.text : undefined;
        this.options.mapobject = (options && options.mapobject) ? options.mapobject : undefined;

        this.subject = (subject) ? subject : 0;
        this.selected = [];

        this.geometry = geometryJSON;

        // Определим высоту компонента
        this.min_height = 300;
        var height = this._readCookie();
        if (height != undefined && parseInt(height) != 0) {
            this.min_height = height;
        }
        // Если высота больше панели основного окна, то берем минимальную
        if (options && options.size) {
            // if (this.min_height > options.size[1]) {
            //     this.min_height = options.size[1];
            // }
            this.min_height = options.size[1];
        }

        // событие на изменение текста подписи
        this.onChangeGeometry = GWTK.Util.bind(this.onChangeGeometry, this);

        this.creategrid(this.geometry, this.id, this.subject, this.options.format);

        this.error = false;
    };


    GWTK.GeometryEditor.prototype = {

        /**
         * Уничтожение класса 
         * @method destroy
         */
        // ===============================================================
        destroy: function () {
            if (!this.grid) {
                return;
            }

            // событие на изменение текста подписи
            $(this.map.eventPane).off('changegeometry', this.onChangeGeometry);

            // var grid = w2ui['grid_' + this.id];
            // if (!grid) return;

            // Удалим грид 
            this.grid.destroy();
            this.grid = null;

            $('#' + this.textId).hide();
            // Удалить у родительского окна грида свойства, присущие гридку
            // var $el = $("#" + this.id);
            // $el.removeClass("w2ui-reset");
            // $el.removeClass("w2ui-grid");
            // $el.attr("name", '');

            $('#' + this.id).css('height', '');

        },

        /**
         * Изменение размера окна 
         * @method resize
         */
        // ===============================================================
        resize: function () {
            $('#' + this.id).children().width('100%');

            if (this.grid) {
                this.grid.resize();
            }
            // w2ui['grid_' + this.id].resize();
            this._writeCookie($('#' + this.id).height());
        },

        /**
         * Записать куки размеров
         * @method _readCookie
         * @param flag {Boolean} Флаг того, что окно редактора перемещалось
         */
        // ===============================================================
        _writeCookie: function (height) {
            var value = ['height=' + height];
            value = value.join('&');
            GWTK.cookie('mapeditor_detail', value, { expires: 5, path: '/' });
        },

        /**
         * Прочитать куки размеров
         * @method _readedCookie
         */
        // ===============================================================
        _readCookie: function () {
            var param = GWTK.cookie("mapeditor_detail", GWTK.cookies.converter);
            if (!param) return;
            var height = 0;
            $.each(param, function (index, value) {
                var key = value.shift();
                var key_value = value.length > 0 ? value.shift() : '';
                switch (key) {
                    case 'height':
                        height = key_value;
                        break;
                }
            });

            return height;
        },

        /**
         * Назначить новую метрику
         * @method setgeometry
         */
        // ===============================================================
        setgeometry: function (geometryJSON) {
            this.geometry = geometryJSON;
        },

        /**
         * Создание объекта grid
         * @method creategrid
         * @param geometry {Object} Объект геометрии в формате json {"type": "", "coordinates": [] };
         * @param gridid {String} Идентификатор объекта grid
         * @param subjectnumber {Int} Номер подобъекта (контура)
         * @param format {Object} Формат отображения данных в формате json { "action": "edit", "format": "BL", "precision_m": 8, "precision_sec": 4, "precision_grad": 8, "precision_h": 2, "visible_h": 0 };
         * @param pointnumber {Int} Номер точки подобъекта (контура)
         */
        // ===============================================================
        creategrid: function (geometry, gridid, subjectnumber, format, pointnumber) {
            this.geometry = (geometry) ? geometry : this.geometry;
            gridid = ((gridid) ? gridid : this.id) + '_grid';
            subjectnumber = (subjectnumber >= 0) ? subjectnumber : this.subject;
            this.pointnumber = (pointnumber >= 0) ? pointnumber : 0;

            // Еслт окно родителя невидимое, то не делать лишних телодвижения
            if($('#' + gridid).css('display') == 'none'){
                return;
            }

            // триггер на доступномть кнопки
            this.trigger({ "record": null, "format": "BL", "subject": subjectnumber, "point": null }, "enabled", gridid);

            var _metrics = this, gridname = 'grid_' + gridid,
                records = this.setcoord(subjectnumber);


            format = format ? format : this.options.format;
            // var divformat = '';
            // var fn_formatB = null, fn_formatL = null;
            var geometrytype = this.geometry.type.toLowerCase(),
                //onchange = ' onchange = "GWTK.GeometryEditor.prototype.changefield(this, \'' + gridname + '\', \'' + geometrytype + '\',' + subject + ');"';
                // onchange = ' onchange = "GWTK.GeometryEditor.prototype.changefield(this, \'' + gridname + '\', \'' + geometrytype + '\',' + subjectnumber + ', \'' + format + '\');"';
               onchange = ' onkeyup = "GWTK.GeometryEditor.prototype.changefield(event, this, \'' + gridname + '\', \'' + geometrytype + '\',' + subjectnumber + ', \'' + format + '\');"';

            var max_latitude = GWTK.TileMatrixSets[this.map.options.tilematrixset].max_latitude;

            switch (format) {
                case 'BLgrad': // градусы минуты секунды
                    this.fn_formatB = function BLgrad(record, index, col_index) {
                        var divformat = '',
                            coord = GWTK.GeometryEditor.prototype.Degrees2DegreesMinutesSeconds(record.B, _metrics.options.precision_sec).split(' ');
                        if (!coord) return divformat;
                        divformat =
                            '<input type="text" name="geomformatB_gr" id="geomformat_B_gr_' + index.toString() + '_0" style="width:35px;" title="Градусы"  ' +
                            ' value = "' + coord[0].replace(/^0+/, '') + '" ' +
                            ' onfocus=" GWTK.GeometryEditor.prototype.w2field(this, \'int\', { min: -' + max_latitude.toFixed() + ', max: ' + max_latitude.toFixed() + ' });"' +
                            onchange +
                            '>' +
                            '<label style="padding: 2px; color: #868b92;">°</label>' +
                            '<input type="text"  name="geomformatB_min" id="geomformat_B_min_' + index.toString() + '_0" style="width:25px;" title="Минуты" ' +
                            ' value = "' + coord[1].replace(/^0+/, '') + '" ' +
                            ' onfocus=" GWTK.GeometryEditor.prototype.w2field(this, \'int\', {min: 0, max:59 });" ' +
                            onchange +
                            '>' +
                            '<label style="padding: 2px; color: #868b92;" class="label-coord">\'</label>' +
                            '<input type="text"  name="geomformatB_sec" id="geomformat_B_sec_' + index.toString() + '_0" style="width:60px;" title="Секунды"  ' +
                            ' value = "' + coord[2].replace(/^0+/, '') + '" ' +
                            ' onfocus=" GWTK.GeometryEditor.prototype.w2field(this, \'float\', {min: 0, max:59.9999, precision: ' + _metrics.options.precision_sec + ' });" ' +
                            onchange +
                            '>' +
                            '<label style="padding: 2px; color: #868b92;" class="label-coord">\'\'</label>';
                        return divformat;
                    };

                    this.fn_formatL = function BLgrad(record, index, col_index) {
                        var divformat = '',
                            coord = GWTK.GeometryEditor.prototype.Degrees2DegreesMinutesSeconds(record.L, _metrics.options.precision_sec).split(' ');
                        if (!coord) return divformat;
                        divformat =
                            '<input type="text" name="geomformatL_gr" id="geomformat_L_gr_' + index.toString() + '_1" style="width:35px;" title="Градусы"  ' +
                            ' value = "' + coord[0].replace(/^0+/, '') + '" ' +
                            ' onfocus=" GWTK.GeometryEditor.prototype.w2field(this, \'int\', {min: -180, max:180 });" ' +
                            onchange +
                            '>' +
                            '<label style="padding: 2px; color: #868b92;">°</label>' +
                            '<input type="text"  name="geomformatL_min" id="geomformat_L_min_' + index.toString() + '_1" style="width:25px;" title="Минуты" ' +
                            ' value = "' + coord[1].replace(/^0+/, '') + '" ' +
                            ' onfocus=" GWTK.GeometryEditor.prototype.w2field(this, \'int\', {min: 0, max:59 });" ' +
                            onchange +
                            '>' +
                            '<label style="padding: 2px; color: #868b92;" class="label-coord">\'</label>' +
                            '<input type="text"  name="geomformatL_sec" id="geomformat_L_sec_' + index.toString() + '_1" style="width:60px;" title="Секунды"  ' +
                            ' value = "' + coord[2].replace(/^0+/, '') + '" ' +
                            ' onfocus=" GWTK.GeometryEditor.prototype.w2field(this, \'float\', {min: 0, max:59.9999, precision: ' + _metrics.options.precision_sec + ' })"; ' +
                            onchange +
                            '>' +
                            '<label style="padding: 2px; color: #868b92;" class="label-coord">\'\'</label>';
                        return divformat;
                    };

                    break;

                case 'BL': // градусы
                    this.fn_formatB = function BL(record, index, col_index) {
                        var coord = record.B.toString(),
                            divformat =
                            '<input type="float" name="geomformatB" id="geomformat_B_grad_' + index.toString() + '_0" style="width:100%;"  ' +
                            ' value = "' + coord + '" ' +
                            ' onfocus=" GWTK.GeometryEditor.prototype.w2field(this, \'float\', { min: -' + max_latitude + ', max: ' + max_latitude + ', precision: ' + _metrics.options.precision_grad + ' });"' +
                            onchange +
                            '>';
                        return divformat;
                    };

                    this.fn_formatL = function BLgrad(record, index, col_index) {
                        var coord = record.L.toString(),
                            divformat =
                            '<input type="float" name="geomformatL" id="geomformat_L_grad_' + index.toString() + '_1" style="width:100%;"  ' +
                            ' value = "' + coord + '" ' +
                            ' onfocus=" GWTK.GeometryEditor.prototype.w2field(this, \'float\', {min: -180, max: 180, precision: ' + _metrics.options.precision_grad + ' });" ' +
                            onchange +
                            '>';
                        return divformat;
                    };
                    break;

                default:
                    this.fn_formatB = null;
                    this.fn_formatL = null;
                    break;

            };

            this.fn_formatH = function BLgrad(record, index, col_index) {
                var coord = (record.H) ? record.H : '',
                    divformat =
                    '<input type="float" name="geomformatH" id="geomformat_H_grad_' + index.toString() + '_2" style="width:100%;"  ' +
                    ' value = "' + coord + '" ' +
                    ' onfocus=" GWTK.GeometryEditor.prototype.w2field(this, \'float\', { precision: ' + _metrics.options.precision_h + ' });"' +
                    onchange +
                    '>';
                return divformat;
            };


            if (!w2ui[gridname]) {

                var parent = $('#' + this.id);

                parent.empty();
                parent.css('height', this.min_height);

                var novisibletext =  (this.options.text != undefined) ? '' : 'display:none';
                parent.append(
                    '<div class = "divFlex" style="width: 100%; height: 100%; flex-direction: column;" >'+
                        '<div style="width: 100%;">' +
                            '<input id="' + this.textId +'" type="text" style="width:100% !important;' + novisibletext + '"/>' +
                        '</div>' +
                        '<div id="' + gridid + '" style="width:100% !important; height: 90%;"></div>'  +
                    '</div>'
                );


                $('#' + gridid).w2grid({
                    name: gridname,
                    multiSelect: false,
                    show: {
                        toolbar: true
                        , footer: false
                        , toolbarReload: false
                        , lineNumbers: true
                        , toolbarSearch: false
                        , toolbarColumns: false
                        , fixedBody: false
                    },
                    columns: [
                        {
                            field: 'B', caption: 'B (' + w2utils.lang("Latitude") + ')', size: '33.3333%',
                            //editable: { type: 'float', precision: _metrics.options.precision_grad },
                            render:
                                function (record, index, col_index) {
                                    if (_metrics.fn_formatB) {
                                        return _metrics.fn_formatB(record, index, col_index);
                                    }
                                    else {
                                        if (record.changes && record.changes.B)
                                            return record.changes.B;
                                        return record.B;
                                    }
                                }
                        },
                        {
                            field: 'L', caption: 'L (' + w2utils.lang("Longitude") + ')', size: '33.3333%',
                            //editable: { type: 'float', precision: _metrics.options.precision_grad },
                            render:
                                function (record, index, col_index) {
                                    if (_metrics.fn_formatL) {
                                        return _metrics.fn_formatL(record, index, col_index);
                                    }
                                    else {
                                        if (record.changes && record.changes.L)
                                            return record.changes.L;
                                        return record.L;
                                    }
                                }
                        },
                        {
                            field: 'H',
                            caption: 'H (' + w2utils.lang("Height") + ')',
                            title: w2utils.lang("Height"),
                            size: '33.3333%',
                            //editable: { type: 'float', precision: _metrics.options.precision_h },
                            hidden: !(Boolean(_metrics.options.visible_h)),
                            render:
                                function (record, index, col_index) {
                                    if (_metrics.fn_formatH) {
                                        return _metrics.fn_formatH(record, index, col_index);
                                    }
                                    else {
                                        if (record.changes && record.changes.H)
                                            return record.changes.H;
                                        return record.H;
                                    }
                                }
                            //function (record, index, col_index) {
                            //    if (record.changes && record.changes.H && !isNaN(record.changes.H))
                            //        return record.changes.H;
                            //    return record.H;
                            //}
                        }
                    ],

                    onDelete: function (event) {
                        if (_metrics.options.action == "edit") {// процесс редактирования
                            var ret = true;
                            switch (_metrics.geometry.type.toLowerCase()) {
                                case 'point':
                                case 'multipoint':
                                    ret = false;
                                    break;
                                case 'linestring':
                                case 'multilinestring':
                                    if (this.records.length <= 2)
                                        ret = false;
                                    break;
                                case 'polygon':
                                    if (this.records.length <= 4)
                                        ret = false;
                                    break;
                            }
                            if (!ret) {
                                event.preventDefault();
                                w2alert(w2utils.lang("The point is not to be removed"));
                                return;
                            }
                        }

                        _metrics.selected = this.getSelection();
                        var index = _metrics.selected[0];
                        event.onComplete = function (event) {
                            _metrics.trigger({
                                "record": null,
                                "format": "BL",
                                "subject": _metrics.subject,
                                "point": parseInt(index)
                            }, "remove", this.name);
                        }
                    },

                    // Записи
                    records: records,

                    // Тулбар
                    onToolbar: function (event) {
                        event.onComplete = function (event) {
                            if (event.target.indexOf('format:') >= 0) {
                                _metrics.options.format = event.target.replace('format:', '');
                                _metrics.destroy();
                                _metrics.creategrid();
                                return;
                            }
                            else {
                                if (event.target == "height") {
                                    _metrics.options.visible_h = event.originalEvent.item.checked ? 0 : 1;
                                    (event.originalEvent.item.checked) ? this.hideColumn('H') : this.showColumn('H');
                                    _metrics.updatesubjectlist(_metrics.subject);
                                }
                            }

                        }
                        switch (event.target) {
                            case "addpoint": // добавить
                                _metrics.selected = this.getSelection();
                                var record;
                                // Нет выбранных, то добавляем в конец
                                var index = -1;
                                if (_metrics.selected.length == 0) {
                                    if (this.records.length == 0) {
                                        this.add({recid: this.records.length, B: 0, L: 0});
                                        return;
                                    }
                                    else {
                                        record = this.records[this.records.length - 1];
                                        record.recid = this.records.length;
                                        index = this.records.length;
                                    }
                                }
                                else {
                                    record = this.records[_metrics.selected[0]];
                                    record.recid = this.records.length;
                                    index = _metrics.selected[0];
                                }
                                if (index >= 0 && geometrytype.indexOf('point') < 0)
                                    _metrics.trigger({
                                        "record": record,
                                        "format": "BL",
                                        "subject": _metrics.subject,
                                        "point": parseInt(index)
                                    }, "insert", this.name);
                                return;
                            case 'deletepoint':
                                this['delete']();
                                return;
                            case "finish":
                                _metrics.options.action = 'edit';
                                _metrics.settoolbar(this);
                                _metrics.trigger({}, event.target, this.name);
                                return;
                        }
                    },

                    onSelect: function (event) {
                        _metrics.trigger({
                            "record": this.records[event.index],
                            "format": _metrics.options.format,
                            "subject": _metrics.subject,
                            "point": event.index
                        }, "select", this.name);
                    }

                });


                this.grid = w2ui[gridname];
                if (this.selected.length > 0)
                    this.grid.select(this.selected[0]);

                // Выставим текст подписи
                var text = this.setText(subjectnumber, this.options.text);
                if (text) {
                    text.w2field('text');
                    text.on('input', function() {
                        _metrics.options.text = this.value;
                        _metrics.trigger({
                            "subject": _metrics.subject,
                            "text": this.value
                        }, "text");
                    });
                }

                // Добавим кнопки в тулбар
                this.settoolbar(this.grid);

                this.grid.msgDelete = w2utils.lang('Remove the current point?');

            }
            else {
                this.refresh(records, this.options.text);
            }

            if (pointnumber >= 0) {
                this.grid.select(records[pointnumber].recid);
            }


            // событие на изменение текста подписи
            $(this.map.eventPane).off('changegeometry', this.onChangeGeometry);
            $(this.map.eventPane).on('changegeometry', this.onChangeGeometry);
        },

        /**
         * Изменение текста
         * @param event
         */
        onChangeGeometry: function(event){
            if (event && event.action == "changetext") {
                if (event.mapobject && this.options.mapobject &&
                    event.mapobject.gid == this.options.mapobject.gid) {
                    if (event.datapoint.newvalue !== $('#' + this.textId).val()) {
                        this.setText(event.datapoint.subject, event.datapoint.newvalue);
                    }
                }
            }
        },

        /**
         * Установить текст подписи
         * @param subjectnumber
         */
        setText: function(subjectnumber, text){
            subjectnumber = (subjectnumber >= 0) ? subjectnumber : 0;
            var $text = $('#' + this.textId);
            if ($text.length > 0 && text != undefined) {
                /**
                 * TODO: ВЕРНУТЬСЯ, КОГДА БУДЕТ АЛГОРИТМ СПЛАЙНА
                 */
                if ($.isArray(text)) {
                    this.multiTitle = true;
                }
                var textvalue = (this.multiTitle) ? text[subjectnumber] : text;
                $text.val(textvalue);
                if (this.multiTitle) {
                    $text.addClass("disabledbutton");
                }

                $text.show();

                //this.options.text = textvalue;
                return $text;
            }

        },

        /**
         * Формирование дополнительного тулбара
         * @method settoolbar
         */
        // ===============================================================
        settoolbar: function (grid) {
            if (!grid) return;

            /**
             * TODO: ВЕРНУТЬСЯ, КОГДА БУДЕТ АЛГОРИТМ СПЛАЙНА
             */
            if (!this.multiTitle) {
                grid.toolbar.add(
                    {
                        type: 'button', id: 'addpoint', img: 'ededmethod_addpoint_16', hint: w2utils.lang("Add New")
                    });
                grid.toolbar.add(
                    {
                        type: 'button', id: 'deletepoint', img: 'ededmethod_delpoint_16', hint: w2utils.lang("Delete")
                    });
            }

            if (this.options.action != "edit") {
                grid.toolbar.add({ type: 'break', id: 'break4' });
                grid.toolbar.add({ type: 'button', id: 'finish', img: 'ededmethod_finish_16', hint: w2utils.lang("Complete operation") });
            }

            grid.toolbar.add({ type: 'break', id: 'break1' });

            grid.toolbar.add(
            {
                type: 'menu', id: 'format', caption: w2utils.lang("Coordinates type"),
                items: [
                    { text: 'WGS84 (' + w2utils.lang("degrees") + ')', id: 'BL' },
                    { text: 'WGS84 (' + w2utils.lang("grad min sec") + ')', id: 'BLgrad' }
                ]
            });
            grid.toolbar.add({ type: 'break', id: 'break2' });

            // Подобъекты
            grid.toolbar.add(
            {
                type: 'html', id: 'subjects', hint: w2utils.lang("Contours list"),
                html: '<div>' +
                    '<input id="' + this.id + '_subjects" style="width: 40px !important;">' +
                    '</div>'
            });

            grid.toolbar.add({ type: 'break', id: 'break3' });

            // Высота 
            grid.toolbar.add(
                { type: 'check', id: 'height', caption: w2utils.lang("Height"), hint: w2utils.lang("Height"), checked: Boolean(this.options.visible_h) });

            // Незначить список подобъектов
            this.updatesubjectlist(this.subject);
        },

        /**
         * перерисока окна
         */
        refresh: function(records, text){
            if (this.grid) {
                records = (!records || records.length == 0) ? this.setcoord(this.subject) : records;
                this.grid.records = records;
                this.grid.refresh();
                this.updatesubjectlist(this.subject);
                if (records.length > 0) {
                    this.grid.select(records[this.pointnumber].recid);
                }
                if (!text) {
                    $('#' + this.textId).hide();
                }
                this.setText(this.subject, text)
            }
        },

        /**
          * Формирование массива координат для подобъекта (контура)
          * @method setcoord
          * @param subj {Int} Номер подобъекта (контура)
          */
        // ===============================================================
        setcoord: function (subj) {
            if (!this.geometry) return [];
            if (!subj) subj = 0;
            this.subject = subj;
            var coords = [], coord, h, pcount, subcount;
            switch (this.geometry.type.toLowerCase()) {
                case 'point':
                    if (this.geometry.coordinates.length > 0) {
                        h = this.geometry.coordinates[2];
                        coords = [{ "recid": 0, "B": this.geometry.coordinates[1].toFixed(this.options.precision_grad), "L": this.geometry.coordinates[0].toFixed(this.options.precision_grad), "H": (h) ? h.toFixed(this.options.precision_h) : h }];
                    }
                    break;
                case 'multipoint':
                    pcount = this.geometry.coordinates.length;
                    if (subj > pcount) return [];
                    if (this.geometry.coordinates[subj]) {
                        h = this.geometry.coordinates[subj][2];
                        coords = [{ "recid": 0, "B": this.geometry.coordinates[subj][1].toFixed(this.options.precision_grad), "L": this.geometry.coordinates[subj][0].toFixed(this.options.precision_grad), "H": (h) ? h.toFixed(this.options.precision_h) : h }];
                    }
                    break;
                case 'linestring':
                case 'title':
                    pcount = this.geometry.coordinates.length;
                    for (var i = 0; i < pcount; i++) {
                        h = this.geometry.coordinates[i][2];
                        coords.push({ "recid": i, "B": this.geometry.coordinates[i][1].toFixed(this.options.precision_grad), "L": this.geometry.coordinates[i][0].toFixed(this.options.precision_grad), "H": (h) ? h.toFixed(this.options.precision_h) : h });
                    }
                    break;

                case 'polygon':
                case 'multilinestring':
                    subcount = this.geometry.coordinates.length;if (subj > subcount - 1) return [];
                    coord = this.geometry.coordinates[subj];
                    pcount = coord.length;
                    for (var i = 0; i < pcount; i++) {
                        h = coord[i][2];
                        coords.push({ "recid": i, "B": coord[i][1].toFixed(this.options.precision_grad), "L": coord[i][0].toFixed(this.options.precision_grad), "H": (h) ? h.toFixed(this.options.precision_h) : h });
                    }
                    break;
   
                case 'multipolygon':
                    // Запрашиваем части по сквозной нумерации
                    var k = 0;
                    var coord = this.geometry.coordinates;
                    for (var j = 0; j < coord.length; j++) {
                        pcount = coord[j].length;
                        for (var ii = 0; ii < pcount; ii++) {
                            if (k == subj) {
                                for (var jj = 0; jj < coord[j][ii].length; jj++) {
                                    h = coord[j][ii][jj][2];
                                    coords.push({ "recid": jj, "B": coord[j][ii][jj][1].toFixed(this.options.precision_grad), "L": coord[j][ii][jj][0].toFixed(this.options.precision_grad), "H": (h) ? h.toFixed(this.options.precision_h) : h });
                                }
                                return coords;
                            }
                            k++;
                        }
                    }

                    break;

                default:
                    break;
            }

            return coords;
        },


        /**
        * Формирование списка подобъектов (контуров)
        * @method setsubjectlist
        */
        // ===============================================================
        setsubjectlist: function () {
            var subjects = [];
            if (!this.geometry) return subjects;
            var coords = [], coord, h;
            switch (this.geometry.type.toLowerCase()) {
                case 'point':
                case 'linestring':
                case 'multipoint':
                    subjects.push({ id: 0, text: "0" });
                    break;

                case 'multilinestring':
                case 'polygon' :
                    pcount = this.geometry.coordinates.length;
                    for (var i = 0; i < this.geometry.coordinates.length; i++)
                        subjects.push({ id: i, text: i.toString() });
                    break;
                case 'multipolygon':
                    var k = 0;
                    for (var i = 0; i < this.geometry.coordinates.length; i++) {
                        var coord = this.geometry.coordinates[i];
                        for (var j = 0; j < coord.length; j++) {
                            subjects.push({ id: k, text: k.toString() });
                            k++;
                        }
                    }
                    break;

                default:
                    break;
            }

            return subjects;
        },

        /**
          * Обновление списка подобъектов (контуров)
          * @method updatesubjectlist
          */
        // ===============================================================
        updatesubjectlist: function (subject, geometryJSON) {
            var list = $('#' + this.id + '_subjects');
            if (list && list.length > 0) {
                list.children().remove();
            }

            this.subject = (subject >= 0) ? subject : this.subject;
            this.geometry = (geometryJSON) ? geometryJSON : this.geometry;
            var subjects = this.setsubjectlist();

            // Добавим подобъект без координат
            if (subjects.length == subject) {
                subjects.push({ id: subject, text: subject.toString() });
            }

            var subelem = subjects.find(
                       function (element, index, array) {
                           if (element.id == subject)
                               return element;
                       });
            list = $('#' + this.id + '_subjects');
            if (list && list.length > 0) {
                list.w2field('list', { items: subjects, selected: subelem });
                // if (this.options.action != 'edit' || subjects.length == 1)
                //    list.prop('disabled', true);
                list.change(GWTK.Util.bind(function (event) {
                    var obj = list.data('selected');
                    if (obj) {
                        this.subject = obj.id;
                        this.creategrid(this.geometry, this.id, this.subject, this.options.format);
                    }
                }, this));
            }

        },

        /**
          * Назначить оконному элементу типа w2field
          * @method w2field
          * @param obj {Object} Оконный элемент
          * @param type {String} Тип вводимых данных ("int", "float" ...)
          * @param options {Object} Формат отображения данных w2ui 
         */
        // ===============================================================
        w2field: function (obj, type, options) {
            if (!obj || !type) return;
            $(obj).w2field(type, options);
        },

        /**
          * Изменение значения поля координат
          * @method changefield
          * @param obj {Object} Оконный элемент, в котором произошли изменения
          */
        // ===============================================================
        changefield: function (event, obj, gridname, geometrytype, subject, format) {
            if (!obj || !obj.id || !format) return;

            var enter = false;
            if (event && (event.key == 'Enter' || event.keyCode == 13)) {
                enter = true;
            }

            var mass = obj.id.split('_');
            if (!mass || mass.length == 0)
                return;
            var field = mass[mass.length - 1];  // индекс редактируемого поля
            var index = mass[mass.length - 2];  // индекс строки
            var prefix = mass[mass.length - 3];  // префикс строки (gr, min, sec)
            var BL = mass[mass.length - 4];  // B или L строки
            var record = w2ui[gridname].records[index], 
                coordB, coordL;

            switch(format) {
                case 'BLgrad': // градусы минуты секунды
                    var gradrecord = {
                        "B": [$('#geomformat_B_gr_' + index + '_0').val(), $('#geomformat_B_min_' + index + '_0').val(), $('#geomformat_B_sec_' + index + '_0').val()],
                        "L": [$('#geomformat_L_gr_' + index + '_1').val(), $('#geomformat_L_min_' + index + '_1').val(), $('#geomformat_L_sec_' + index + '_1').val()],
                        "H": $('#geomformat_H_grad_' + index + '_2').val()
                    };
                    var value = $(obj).val();
                    if (!value) value = '';
                    switch (prefix) {
                        case 'gr':
                            if (BL == 'B')
                                gradrecord.B[0] = value;
                            else
                                gradrecord.L[0] = value;
                            break;

                        case 'min':
                            if (BL == 'B')
                                gradrecord.B[1] = value;
                            else
                                gradrecord.L[1] = value;
                            break;

                        case 'sec':
                            if (BL == 'B')
                                gradrecord.B[2] = value;
                            else
                                gradrecord.L[2] = value;
                            break;
                    }

                    if (!gradrecord.B[0] || !gradrecord.L[0] ||
                        !gradrecord.B[1] || !gradrecord.L[1] ||
                        gradrecord.B[0] == '' || gradrecord.L[0] == '' ||
                        gradrecord.B[1] == '' || gradrecord.L[1] == '')
                        return;

                    var bl = new GWTK.LatLng(0, 0);
                    coordB = bl.DegreesMinutesSeconds2Degrees(gradrecord.B[0], gradrecord.B[1], gradrecord.B[2]);
                    coordL = bl.DegreesMinutesSeconds2Degrees(gradrecord.L[0], gradrecord.L[1], gradrecord.L[2]);
                    if (!coordB || !coordL) return;
                    break;

                case 'BL': // градусы
                    var gradrecord = {
                        "B": $('#geomformat_B_grad_' + index + '_0').val(),
                        "L": $('#geomformat_L_grad_' + index + '_1').val(),
                        "H": $('#geomformat_H_grad_' + index + '_2').val()
                    };
                    coordB = gradrecord.B;
                    coordL = gradrecord.L;
                    break;
            }

            var newrecord = { "B": coordB, "L": coordL, "H": gradrecord.H };
            w2ui[gridname].records.splice(index, 1, { "recid": record.recid, "B": coordB, "L": coordL, "H": gradrecord.H });

            GWTK.GeometryEditor.prototype.trigger({ "record": newrecord, "format": 'BL', "subject": subject, "point": parseInt(index), "enter": enter}, "change", gridname, geometrytype);
        },

        /**
          * Создание триггера на изменение геометрии
          * @method trigger
          * @param obj {Object} Объект { "record": "", "format": "", "subject": "", "point": "" }
          * @param regime {String} Режимы для триггера: 'change', 'insert', 'remove', 'finish', 'select', 'enabled'
          */
        // ===============================================================
        trigger: function (obj, regime, gridname, geometrytype) {
            if (!obj) return;
            if (obj.record && (obj.record.B == 0 || obj.record.L == 0))
                return;

            var geometryclose = false;
            var point = obj.point;
            if (regime == 'change' && !geometrytype)
                return;
            if (gridname && regime == 'change' && geometrytype &&  geometrytype.indexOf('polygon') >= 0) {
                var count = w2ui[gridname].records.length;
                if (point == 0 || point == count - 1) {
                    var np = (point == 0) ? count - 1 : 0;
                    var record = w2ui[gridname].records[np];
                    record.B = obj.record.B;
                    record.L = obj.record.L;
                    record.H = obj.record.H;
                    w2ui[gridname].records.splice(np, 1, record);
                    w2ui[gridname].refreshRow(record.recid);
                    geometryclose = true;
                    obj.point = count - 1;
                }
            }
            //var eventPanelId = this.map.eventPane.id;
            var $el = $('.event-panel');
            if ($el && $el.length > 0) {
                $el.trigger({
                    type: 'changedata_metrics',
                    regime: regime,
                    dataobject: obj,
                    geometryclose: geometryclose
                });
                // Если точечный, завершить создание
                if (geometrytype && geometrytype.indexOf('point') >= 0 && obj.enter)
                    $el.trigger({
                        type: 'changedata_metrics',
                        regime: 'finish',
                        dataobject: obj,
                        geometryclose: geometryclose
                    });
            }
        },

        /**
         * Перевод граусов в строку в градусы, минуты, секунд
         * @method Degrees2DegreesMinutesSeconds
         * @param degrees {Float} Градусы
         * @param precision {Int} Точность
         * @return {String} Строка в формате 'ГГ MM CCCC'
         */
        // ===============================================================
        Degrees2DegreesMinutesSeconds: function (degrees, precision) {
            if (!precision) precision = 4;
            else
                precision = parseInt(precision);

            var Result = "";
            var iDegrees = parseInt(degrees, 10);
            var minutes = (degrees - parseFloat(iDegrees)) * 60.0;
            var iMinutes = parseInt(minutes, 10);
            var seconds = (minutes - parseFloat(iMinutes)) * 60.0;
            if ((seconds + 0.001) > 60.0) {
                seconds = 0;
                iMinutes += 1;
            }
            var seconds1 = parseInt(seconds, 10);
            if (iMinutes >= 60) {
                iMinutes = 0;
                iDegrees += 1;
            }

            iDegrees = iDegrees % 360;
            if (iDegrees < 0) {
                Result = "-";
                iDegrees = Math.abs(iDegrees);
            }
            else Result = "";

            if (iDegrees < 10)
                Result = Result + "00";
            else if (iDegrees < 100)
                Result = Result + "0";
            Result = Result + iDegrees.toString(10) + " ";

            iMinutes = Math.abs(iMinutes);
            iMinutes < 10 ? Result += "0" + iMinutes + " " : Result += iMinutes + " ";

            seconds = Math.abs(seconds);
            return (Result + parseFloat(seconds, 10).toFixed(precision) + "");
        }


    };
}