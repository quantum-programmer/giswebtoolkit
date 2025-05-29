/********************************** Патейчук В.К. **** 14/10/20 ****
*********************************** Соколова Т.О. **** 04/06/21 ****
*********************************** Тазин В.О.    **** 01/04/16 ****
*********************************** Помозов Е.В.  **** 23/03/21 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                       Редактор семантики                         *
*                                                                  *
*******************************************************************/

var semEditors = {};

if (window.GWTK) {
    //Описание класса
    GWTK.SemanticEditor = function (map, classifier, id, inJSON, options) {

        // Значение для разделения разрядов
        w2utils.formatNumber = function (val, groupSymbol, decimalSymbol) {
            var ret = '';
            if (groupSymbol == null) groupSymbol = '';
            if (decimalSymbol == null) decimalSymbol = w2utils.settings.decimalSymbol || '.';
            // check if this is a number
            if (w2utils.isFloat(val) || w2utils.isInt(val) || w2utils.isMoney(val)) {
                tmp = String(val).split('.');
                ret = String(tmp[0]).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + groupSymbol);
                if (tmp[1] != null) ret += w2utils.settings.decimalSymbol + tmp[1];
            }
            return ret;
        }


        this.toolname = 'semanticeditor';
        this.map = map;
        delete semEditors[id];
        semEditors[id] = this;
        this._object = new Array();
        this._originalObject = new Array();

        for ( var i in inJSON) {
            if (inJSON[i]['readonly'])  // служебные семантики, только на чтение
                continue;
            this._object[i] = {};
            this._originalObject[i] = {};
            for (var j in inJSON[i]) {
                if (inJSON[i][j] == 'undefined') {
                    this._object[i][j] =  this._originalObject[i][j] = null;
                }
                else {
                    this._object[i][j] = this._originalObject[i][j] = inJSON[i][j];
                }
            }
            this._originalObject[i]['recid'] = this._object[i]['recid'] = i.toString();
            if (!this._object[i]['name']) { // Если нет поля name
                this._object[i]['name'] = this._originalObject[i]['name'] = this._object[i]['shortname'];
            }
        }
        this._obj = {};
        this._obj.form = new Array();//Массив для ввода полей и их параметров
        this._obj.record = new Array(); //Массив для ввода значений
        this._obj.record['time'] = new Array();//Исключение для поля ввода времени
        this._obj.record['angle'] = new Array();//Исключение для поля ввода угла
        this._id = id;
        this.classifier = classifier;

        this.classifiersematiclist = [];
        classifier.getclassifiersematiclist(
            GWTK.Util.bind(function(classifiersematiclist, status ){
                if (status == 'success'){
                    this.classifiersematiclist = classifiersematiclist;
                }
            }, this));

        if (options)
            this.options = options;
        else {
            this.options = {};
            this.options.buttons = {
                "restore" : true,
                "delete" : true,
                "repeat" : true,
                "save" : true,
                "hidden": true,
                "allsemantics" : true
            };
            if (typeof options == "object") {
                if (typeof options.buttons == "object") {
                    for (key in options.buttons) {
                        this.options.buttons[key] = options.buttons[key];
                    }
                }
            }
        }

        this._obj.buttons = {
            items: new Array(),
            onClick : function(event) {
//                var name = $(event.originalEvent.srcElement || event.originalEvent.target).parents(".w2ui-reset.w2ui-form")[0].id;
                var name = semEditors[id]._id;
                switch (event.target.name) {
                    case 'restore' :
                        semEditors[name].cancelForm();
                        break;
                    case 'save' :
                        semEditors[name].saveForm();
                        break;
                }
            }
        };

        for ( var key in this.options.buttons) {
            if (this.options.buttons[key] == true) {
                switch (key) {
                    case 'restore' :
                        this._obj.buttons.items.push({
                            id: 'restore',
                            type : 'button',
                            caption : w2utils.lang("Restore"),
                            img : 'semanticeditor-icon-cancel'
                        });
                        break;
                    case 'save' :
                        this._obj.buttons.items.push({
                            id : 'save',
                            type : 'button',
                            caption : w2utils.lang("Save"),
                            img : 'w2ui-icon-check'
                        });
                        break;
                }

            }
        }

        // Настройка маскирующих переменных
        $.mask.definitions['H'] = '[0123]';
        $.mask.definitions['M'] = '[012345]';
        $.mask.definitions['S'] = '[012345]';
        $.mask.definitions['X'] = '[ +-]';
        $.mask.definitions['D'] = '[01]';
        $.mask.definitions['M'] = '[012345]';
        $.mask.definitions['S'] = '[012345]';

        // Отображать или нет служебную семантику
        this.service = true;
        this.allsemantics = true;
        this._readCookieParam();

        // Определим высоту компонента
        this.min_height = 300;
        // Если автономнй запуск
        if (this.options.autonomic) {
            this.min_height = $('#' + id).height();
        }
        else {
            var height = this._readCookie();
            if (height != undefined && parseInt(height) != 0) {
                this.min_height = height;
            }
            // // Если высота больше панели основного окна, то берем минимальную
            // if (options.size && this.min_height > options.size[1] && options.size[1] > 100) {
            //     this.min_height = options.size[1];
            // }

            // Если высота больше панели основного окна, то берем минимальную
            if (options && options.size) {
                // if (this.min_height > options.size[1]) {
                //     this.min_height = options.size[1];
                // }
                this.min_height = options.size[1];
            }
        }

        if (!this.options.autonomic)
            $('#' + this._id).css('height', this.min_height);

        this.init();
        this.formCreation();
    };

    GWTK.SemanticEditor.prototype = {
        //Инициализация
        init : function() {
            //Создание объекта
            var rscsemantics = this._object;
            for (var i = 0; i < rscsemantics.length; i++) {
                if (!rscsemantics[i])
                    continue;
                var objectArray = new Array();
                objectArray = this.createSem(rscsemantics[i], i);
                if (objectArray) {
                    this._obj.form[i] = objectArray[0];
                    if (objectArray[1] != null)
                        this._obj.record[this._obj.form[i]['field']] = objectArray[1];
                    if (objectArray[2] != null)
                        for (angle in objectArray[2]) {
                            this._obj.record['angle'].push(objectArray[2][angle]);
                        }
                    if (objectArray[3] != null)
                        for (time in objectArray[3]) {
                            this._obj.record['time'].push(objectArray[3][time]);
                        }
                }
            }
        },

        // Настроить список записей в зависимости от условий
        setrecords:function(){

            var records = [];
            for (var i = 0; i < this._object.length; i++) {
                if (!this._object[i]) {
                    continue;
                }

                this._object[i].indexForm = i;
                this._object[i].style = 'text-align:left';

                // Все семантики
                if (!this.allsemantics && (!this._object[i].value || this._object[i].value == '')) {
                    continue;
                }

                // Общие для всех
                if (this._object[i].service == "1" && !this.service)
                    continue;

                // Ссылка на файл
                if ((this._object[i].type == '9') || // Имя файла зарегистрированного типа
                    (this._object[i].type == '13') || // Имя файла-паспорта
                    (this._object[i].type == '14') || // Имя файла-текст
                    (this._object[i].type == '15') // Имя графического файла (BMP, JPEG, PNG)
                ) {

                }

                records.push(this._object[i]);
            }

            return records;
        },


        //Поиск значений типа Классификатор
        searchSemantic : function(code) {
            var ret = null;
            for ( var i = 0; i < this.classifiersematiclist.length; i++) {
                if (this.classifiersematiclist[i]['code'] == code) {
                    ret = this.classifiersematiclist[i]['reference'];
                    break;
                }
            }
            if (!ret) return ret;

            var classifiersematiclist = JSON.parse(JSON.stringify(ret)), text;
            for (var i = 0; i < classifiersematiclist.length; i++) {
                if (classifiersematiclist[i]['name'])
                    text = classifiersematiclist[i]['name'];
                else
                    text = classifiersematiclist[i]['text'];

                classifiersematiclist[i]['name'] = classifiersematiclist[i]['text'];
                classifiersematiclist[i]['text'] = text;
            }

            return classifiersematiclist;
        },

        // Создание шаблона для поля
        createFormat: function (rscsemantic, form, options) {
            if (!rscsemantic || !form || rscsemantic instanceof Object == false || form instanceof Object == false) {
                return '<div style="color:green; text-align: center">' + w2utils.lang("No declared characteristics") + '</div>';
            }
            var format = '';
            var semClass = "";
            var dec = (parseInt(rscsemantic['decimal']) >= 0 ? parseInt(rscsemantic['decimal']) : 2);
            if (rscsemantic["reply"] == 1)
                semClass = "semanticeditor-label-reply";
            if (rscsemantic["enable"] == "2" || rscsemantic["enable"] == "3")
                semClass = "semanticeditor-label-enable";

            format += '<div style="width:100%;">'
		    		+ '<input style="width:100%;" id="'
		    		+ form['field']
		    		+ '" maxlength="'
		    		+ rscsemantic['size']
		    		+ '" size="20" '
		    		+ (rscsemantic['type'] != "16" ? ' title="'
		    				+ (rscsemantic['minimum'] != '' && (rscsemantic['minimum'] != rscsemantic['maximum'])
		    						? ('Значение от ' + Math.round(parseFloat(rscsemantic['minimum'].replace(",", ".")) * Math.pow(10, dec))
		    								/ Math.pow(10, dec))
		    						: '')
		    				+ (rscsemantic['maximum'] != '' && (rscsemantic['minimum'] != rscsemantic['maximum']) ? (' до ' + Math
		    						.round(parseFloat(rscsemantic['maximum']) * Math.pow(10, dec))
		    						/ Math.pow(10, dec)) : '') : '')
		    		+ '"/>'
            format += '</div>';
            return format;
        },

        // Смена значений в списке
        listdatachange: function ($field, rscsemantic, type) {
            var obj;
            if (type && type == '16') {
                obj = $field.data('selected');
            }
            else {
                obj = $field.val();
            }
            obj = this.updatevalue(obj, type);

            if (!rscsemantic || !obj)
                return;

            if (obj.value == 'undefined' || obj.value == null) {
                var oldvalue = this.semValue(rscsemantic);
                if (oldvalue)
                    $field.val(oldvalue);
                return;
            }
            if (obj.value == rscsemantic.value || (!rscsemantic.value && obj.value == ""))
                return;

            this.trigger($field.attr('id'), rscsemantic, obj.value, 'update');
            var mass = $field.selector.split('_'), index;
            if (mass && mass.length == 2) {
                index = parseInt(mass[1]);
                this._object[index].value = obj.value;
                this._object[index].textvalue = obj.textvalue;
                if (this._object[index].textvalue == '')  // Если пусто, то выставить флаг удаления
                    this._object[index].isdelete = true;
            }
        },

        // Инициировать триггер
        trigger: function (id, record, newvalue, type) {
            var data = new Array();
            data.push({
                id: id,
                oldvalue: record.value,
                newvalue: newvalue,
                code: record['code'],
                changeview: record['enable'] == '3' ? true : false,
                type: type
            });
            $(this.map.eventPane).trigger({
                type: 'changedata_semantics',
                dataobject: data
            });

        },


        //Помещаем форму в заданный контейнер, где требуется  переопределяем поля
        formCreation: function () {

            var _that = this, gridid_parent = this._id;

            if (this.options.autonomic) {

                var html = '<div id="createFormat_' + this._id + '" class="w2ui-page page-0 semanticeditor" style="margin:0px;padding:0px; height: ' + this.min_height + 'px;"></div>',
                //var html = '<div id="createFormat_' + this._id + '" class="w2ui-page page-0 semanticeditor" style="margin:0px;padding:0px;"></div>',
                htmlbuttons = '';

                if (this.options.buttons) {
                    for (var key in this.options.buttons) {
                        if (this.options.buttons[key] == true) {
                            switch (key) {
                                case 'restore':
                                    htmlbuttons += '<button class="btn" name="restore">' + w2utils.lang('Cancel') + '</button>';
                                    break;
                                case 'save':
                                    htmlbuttons += '<button class="btn" name="save">' + w2utils.lang('Save') + '</button>';
                                    break;
                            }
                        }
                    }
                }

                if (htmlbuttons.length > 0) {
                    //htmlbuttons += '<button class="btn" name="close">' + w2utils.lang('Close') + '</button>';
                    html += '<div class="w2ui-buttons">' + htmlbuttons + '</div>';
                }

                 $('#' + this._id).w2form({
                    name: this._id,
                    formHTML: html,
                    focus: -1,
                    actions: {
                        "save": function (event) {
                            _that._obj.buttons.onClick(event);
                        },
                        "restore": function (event) {
                            _that._obj.buttons.onClick(event);
                        }
                        //,
                        //"close": function (event) {
                        //    _that.destroy();
                        //}
                    }
                 });

                 // Стиль белый без рамки
                 $('.w2ui-form').css({ 'background': '#ffffff', 'border': 'none' });

                 gridid_parent = 'createFormat_' + this._id;
            }

            var records = this.setrecords();
            //console.log('records', records);

            this.render_code = function(record, index, col_index){
                return '<div title="' + record.code + ' ( ' + record.shortname + ' )' + '" >' + record.code + '</div>';
            };
            $('#' + gridid_parent).w2grid({
                name: 'grid_' + this._id,
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
                limit     : 1000,
                columns: [
                    {
                        field: 'code', caption: w2utils.lang("Code"), size: '50px', sortable: true, //render: 'number'
                        render: function (record, index, col_index) {
                            // подмена функций для сортировки числовых и текстовых кодов
                            if (!parseFloat(record.code)) {
                                this.columns[col_index].render = _that.render_code;
                            }
                            else {
                                this.columns[col_index].render = "number";
                            }
                        }
                        // render: function (record, index, col_index) {
                        // return '<div title="' + record.code + ' ( ' + record.shortname + ' )' + '" >' + record.code + '</div>';
                        // }
                   },
                    {
                        field: 'name', caption: w2utils.lang("Name"), size: '30%', sortable: true,
                        render: function (record, index, col_index) {
                            var css = '', addstr = '';
                            if (record["reply"] == 1) {
                                css = 'semanticeditor-label-reply';
                                addstr = ' (' + w2utils.lang('semantics are allowed to be repeated') + ')';
                            }
                            if (record["enable"] == "2") {
                                css = 'semanticeditor-label-enable2';
                                addstr = ' (' + w2utils.lang('mandatory semantics') + ')';
                            }
                            else {
                                if (record["enable"] == "3") {
                                    css = 'semanticeditor-label-enable3';
                                    addstr = ' (' + w2utils.lang('semantics affect the appearance') + ')';
                                }
                            }
                            return '<div class = "' + css +'" title="' + record.name + addstr + '" >' + record.name + '</div>';
                        }
                    },
                    {
                        field: 'value', caption: w2utils.lang("Value"), size: '50%',
                        render: function (record, index, col_index) {
                            html = _that.createFormat(record, _that._obj.form[record.indexForm], _that.options);
                            setTimeout(function () {
                                _that.setFieldData(record, _that._obj.form[record.indexForm], _that.options);
                            }, 100);

                            //if (_that._obj.form[record.indexForm].type == 'text')
                            //    this.contextMenu(index);
                            return html || '';
                        }
                    },
                    {
                        field: 'unit', caption: w2utils.lang("Units"), size: '50px', sortable: true,
                        render: function(record, index, col_index) {
                            // ссылка на файл на ГИС Сервере
                            if((record.type == '9') ||  // Имя файла зарегистрированного типа
                               (record.type == '13') || // Имя файла-паспорта
                               (record.type == '14') || // Имя файла-текст
                               (record.type == '15')    // Имя графического файла (BMP, JPEG, PNG)
                               ) {
                                html = '<button id="btnFileUpload_' + record.recid + '" class="btn btn-reference" onclick="' +
                                            //'GWTK.SemanticEditor.prototype.setupFileUpload(' + record.recid + '); ' +
                                            //'GWTK.SemanticEditor.prototype.resetFileUpload(' + record.recid + '); ' +
                                            '$(\'#fileUpload_' + record.recid + '\').click();' +
                                       '">...</button>';
                                return html;
                            }
                        }
                    }
                ],

                // Записи
                records: records,

                // Сортировка
                onSort: function(event) {
                       event.onComplete = function (event) {
                           _that._writeCookieParam();
                       }
                },

                //onContextMenu: function (event) {
                //    event.onComplete = function (event) {
                //        console.log(event);
                //    }
                //},

                // Выбор записей
                onSelect: function (event) {
                    event.onComplete = function (event) {
                        var record = this.get(event.recid);
   //                     // Отключить контекстное меню для текстовых полей
   //                     if (record["type"] == '0') {
   ////                         $('#grid_' + this.name + '_rec_' + event.recid).off('contextmenu', this.contextMenu);
   //                         $('#grid_' + this.name + '_rec_' + event.recid).oncontextmenu = function () { };
   //                     }
                        if (!this.toolbar)
                            return;

                        for (var i = 0; i < this.toolbar.items.length; i++) {
                            switch (this.toolbar.items[i].id) {
                                case 'repeat' + _that._id:
                                    if (record && record["reply"] == 1) { // Сделать кнопку тулбара доступной
                                        this.toolbar.items[i].disabled = false;
                                    }
                                    else {
                                        this.toolbar.items[i].disabled = true;
                                    }
                                    break;

                                case 'delete' + _that._id:
                                    if (record && record["enable"] != 2) { // Сделать кнопку тулбара доступной
                                        this.toolbar.items[i].disabled = false;
                                    }
                                    else {
                                        this.toolbar.items[i].disabled = true;
                                    }
                                    break;
                            }
                        }

                        this.toolbar.refresh();
                    }
                }

            });

            // Настроить  тулбар
            this.settoolbar();

            // первоначальная сортировка по названию
            this.sort(w2ui['grid_' + this._id]);

            // настроить загрузчики файлов на сервер
            var grid = w2ui['grid_' + this._id];
            for (var i = 0; i < grid.records.length; i++) {
                if((grid.records[i].type == '9') ||  // Имя файла зарегистрированного типа
                   (grid.records[i].type == '13') || // Имя файла-паспорта
                   (grid.records[i].type == '14') || // Имя файла-текст
                   (grid.records[i].type == '15')    // Имя графического файла (BMP, JPEG, PNG)
                ) {
                    this.setupFileUpload(grid.records[i].recid);
                }
            }

        },

        /**
         * Сбросить (обнулить) компонент выбора файла
         *
         * @param  {Number} id - суффикс id загрузчика, (идентификатор записи в гриде семантик - recid),
         *                       т.к. для каждой семантики свой загрузчик
         */
        resetFileUpload: function(id) {
            document.getElementById('frmfileUpload_' + id).reset();
            // var control = $("#fileUpload");
            // control.replaceWith(control = control.clone(true));

            // отключить обработчик события
            $('#fileUpload_' + id).off('change');
        },

        /**
         * Настроить загрузчик файлов на сервер
         *
         * @param  {Number} id - идентификатор записи в гриде (recid), добавляется к id загрузчика,
         *                       т.к. для каждой семантики свой загрузчик
         */
        setupFileUpload: function(id) {

            // если нет семантик - ссылка на документ, то выходим
            if ($('.btn-reference').length < 1) {
                return;
            }

            // создать fileUpload
            $('.w2ui-buttons').append('<form id="frmfileUpload_' + id + '"><input id="fileUpload_' + id + '" type="file" class="file-upload"></form>');

            var semeditor = this; // ссылка на компонент

            //this.resetFileUpload(id);

            // Обработчик диалога выбора файла (Закачать файл на сервер)
            //document.getElementById('fileUpload').addEventListener('change', function (event) {
            $('#fileUpload_' + id).on('change', function (event) {

                event.stopPropagation(); // остановка всех текущих JS событий
                event.preventDefault();  // остановка дефолтного события для текущего элемента

                if ((typeof this.files == 'undefined') || (this.files.length == 0)) {
                    console.log('this.files == undefined');
                    return;
                }

                var fileUpload = this;
                var fname = this.files[0]['name'];
                var fsize = this.files[0]['size'];
                var fsizeMax = 200*1024*1024; // максимальный размер загружаемого файла (200 Мб)

                //// Размер файла не должен превышать fsizeMax
                // if (fsize > fsizeMax) {
                //
                //     w2alert(w2utils.lang('The file size must not exceed') + ' ' + fsizeMax / 1024 / 1024 + ' Mb' + '<br /><br />' +
                //         w2utils.lang('Current size') + ' ' + (fsize  / 1024 / 1024).toFixed(0) + ' ' + w2utils.lang('Mb'));
                //     return;
                // }

                // // создадим объект данных формы
                // var data = new FormData();
                // // заполняем объект данных файлами в подходящем для отправки формате
                // $.each( files, function( key, value ){
                //     data.append( key, value );
                // });

                // запустить спиннер
                GWTK.Util.showWait();

                // Закачать файл на сервер
                var layer = semeditor.classifier.layer,                    
                    server = GWTK.Util.getServerUrl(layer.options.url),
					idLayer = encodeURIComponent(layer.idLayer),
                    token = GWTK.Util.accessToken(semeditor.map, idLayer),
                    withCredentials = semeditor.map.authTypeServer(server) || semeditor.map.authTypeExternal(server);
				
                $.ajax({
                    url: server + '?SERVICE=WMTS&RESTMETHOD=SAVEFILETODOCUMENT&LAYER=' + idLayer + '&SAVEDPATH=' + fname,
                    type: 'POST',
                    crossDomain: true,
                    //async: false,
                    timeout: 120000,
                    data: this.files[0],
                    dataType: 'html',
                    cache: false,
                    processData: false, // отключаем обработку передаваемых данных, пусть передаются как есть
                    contentType: 'text/plain', //false, // отключаем установку заголовка типа запроса. Так jQuery скажет серверу что это строковой запрос (только в версии 1.6 и более)					
					xhrFields: withCredentials ? {withCredentials: true} : undefined,
	                beforeSend: token ? function(xhr){xhr.setRequestHeader(GWTK.AUTH_TOKEN, token)} : undefined,					
                    success: function (data, status, jqXHR) {

                        if ((typeof data != 'string') || (data.indexOf('<?xml') == -1)) {
                            w2alert(w2utils.lang('File no uploaded') + '!<p>' + fname + '</p>');
                            console.log(w2utils.lang('File no uploaded') + '! ' + fname, data, status, jqXHR);
                            return;
                        }

                        // разобрать ответ (xml)
                        var $doc = $.parseXML(data),
                            $xml = $($doc),
                            alias = ''; // алиас загруженного файла
                        $xml.find('member').each(function () {
                            var xname = $(this).find('name');
                            if ($(xname).text() == 'Alias') {
                                var xid = $(this).find('string');
                                alias = xid.text();
                            }
                        });

                        // установить новое значение алиаса в форму
                        w2alert(w2utils.lang('File uploaded') + '!<p>' + fname  + '</p>');
                        // console.log(w2utils.lang('File uploaded') + '! ' + fname + ' alias: ' + alias), data, status, jqXHR);
                        var recid = fileUpload.id.split("_").pop(); // id записи в которой меняем значение
                        var grid = w2ui['grid_' + semeditor._id]; // таблица с семантиками
                        var record = grid.get(recid); // запись в которой меняем значение
                        //semeditor._obj.record['sematiclist_' + recid] = alias;
                        semeditor._object[recid].value = alias;
                        semeditor._object[recid].textvalue = alias;
                        // semeditor._originalObject[recid].value = alias;
                        // semeditor._originalObject[recid].textvalue = alias;
                        record.value = alias;
                        record.textvalue = alias;
                        semeditor.setFieldData(record, semeditor._obj.form[record.indexForm], semeditor.options);

                    },
                    error: function (jqXHR, status, errorThrown) {
                        w2alert(w2utils.lang('Loading file error') + "!");
                        console.log(w2utils.lang('Loading file error' + "!"), jqXHR, status, errorThrown);
                    },
                    complete: function(data) {
                        // спрятать спиннер
                        GWTK.Util.hideWait();
                    }
                });


            });


        },

        // Установка маскируещего слоя для полей
        setmask: function ($field, type) {
            if (!$field || !type)
                return;

            //Переопределение действий при вводе для полей типа "Время", маска ввода значения
            if (type == 'time') {
                $field.mask('H9' + ':M9' + ':S9',
                            {
                                //autoclear: false,
                                placeholder : "_",
                                completed : function() {
                                    var q = new RegExp(":", 'i'),
                                        val = $(this).val().split(q);
                                    if (val[0] * 1 > 23)
                                        val[0] = '23';
                                    if (val[1] * 1 > 59)
                                        val[1] = '59';
                                    if (val[2] * 1 > 59)
                                        val[2] = '59';
                                    val = val[0] + ':' + val[1] + ':' + val[2];
                                    $(this).val(val);
                                    $(this).removeClass('w2ui-error');
                                }
                            });

                            $field.on(
                            'focus',
                            function(event) {
                                $(this).w2tag(
                                        w2utils.lang("Maximum value") + ": " + '23' + ':59' + ':59');
                            });

                            $field.on(
                                    'blur',
                                    function (event) { // keyCode & charCode differ in FireFox
                                        var format = /([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)/;
                                        if ((m = format.exec(this.value)) === null && this.value != '' && this.value != '__:__:__') {
                                            $(this).w2tag(
                                                    w2utils.lang("Not a valid date") + ", " + w2utils.lang("template is") + " " + '23'
                                                             + ':59' + ':59');
                                        } else {
                                            $(this).w2tag();
                                        }
                                    });
            }

            //Переопределение действий при вводе для полей типа "Угол", маска ввода значения
            if (type == 'angle') {
                $field.mask('XD99°M9\'S9\"', {
                    //autoclear: false,
                    placeholder: "_",
                    completed: function () {
                        var val = $(this).val().split(/[ +-]|°|\'|\"/);
                        if (val[1] * 1 > 180)
                            val[1] = '180';
                        if (val[2] * 1 > 59)
                            val[2] = '59';
                        if (val[3] * 1 > 59)
                            val[3] = '59';
                        val = $(this).val().substr(0, 1) + val[1] + '°' + val[2] + '\'' + val[3] + '\"';
                        $(this).val(val);
                        $(this).removeClass('w2ui-error');
                    }
                });
                $field.on('focus', function (event) {
                    $(this).w2tag(w2utils.lang("Maximum value") + ": &plusmn;180°59\'59\"");
                });
                $field.on('blur', function (event) { // keyCode & charCode differ in FireFox
                    var format = /[ +-]([0-1]\d\d)°([0-5]\d)\'([0-5]\d)\"/;
                    if ((m = format.exec(this.value)) === null && this.value != '' && this.value != '____°__\'__\"') {
                        $(this).w2tag(w2utils.lang("Not a valid date") + ", " + w2utils.lang("template is") + " &plusmn;180°59\'59\"");
                    } else {
                        $(this).w2tag();
                    }
                });
            }
        },

        /**
         * Формирование дополнительного тулбара
         * @method settoolbar
         */
        // ===============================================================
		settoolbar: function () {
		    var _that = this, grid = w2ui['grid_' + this._id];
		    if (!grid) return;
		    for (var key in this.options.buttons) {
		        if (this.options.buttons[key] == true) {
		            switch (key) {
		                case 'delete':
		                    grid.toolbar.add(
                                {
                                    type: 'button', id: 'delete' + this._id, img: 'semanticeditor-icon-delete', hint: w2utils.lang("Delete")
                                    //, caption: w2utils.lang("Delete")
                                   , disabled: 'true'
                                   , onClick: function (event) {
                                        event.onComplete = function (event) {
 //                                           var grid = w2ui['grid_' + _that._id],
                                            var selection = grid.getSelection();
                                            if (!selection || selection.length == 0) return;
                                            _that.deletesem(grid.get(selection[0]));
                                        }
                                   }
                                });
		                    break;
		                case 'repeat':
		                    grid.toolbar.add(
                                {
                                    type: 'button', id: 'repeat' + this._id, img: 'semanticeditor-icon-add', hint: w2utils.lang("Repeat")
                                    //, caption: w2utils.lang("Repeat")
                                   , disabled: 'true'
                                   , onClick: function (event) {
                                       event.onComplete = function (event) {
  //                                         var grid = w2ui['grid_' + _that._id],
                                             var selection = grid.getSelection();
                                           if (!selection || selection.length == 0) return;
                                           _that.addsem(grid.get(selection[0]));
                                       }
                                    }
                                });

		                    break;

		                case 'allsemantics':
		                    if (this.options.graphic)
		                        break;
		                    grid.toolbar.add({ type: 'break', id: 'breakallsemantics' + this._id });
		                    grid.toolbar.add(
                            {
                                type: 'check', id: 'allsemantics' + this._id, img: 'w2ui-icon-check', hint: w2utils.lang("All semantics"), caption: w2utils.lang("All semantics"), checked: this.allsemantics,
                                onClick: function (event) {
                                    event.onComplete = function (event) {
                                        _that.allsemantics = event.item.checked;
                                        if (!_that.allsemantics)
                                            _that.service = false;
                                        _that.enableToolbarItem('hidden' + _that._id, event.item.checked);
                                        _that._writeCookieParam();
                                        _that.refresh();
                                    }
                                }
                            });

		                    break;

		                case 'hidden':
		                    if (this.options.graphic)
		                        break;
		                    grid.toolbar.add({ type: 'break', id: 'breakhidden' + this._id });
		                    grid.toolbar.add(
                            {
                                type: 'check', id: 'hidden' + this._id, img: 'w2ui-icon-check', hint: w2utils.lang("Common for all"), caption: w2utils.lang("Common for all"),
                                //checked: this.enableToolbarItem('hidden' + _that._id, this.allsemantics),
                                checked: this.allsemantics && this.service,
                                onClick: function (event) {
                                    event.onComplete = function (event) {
                                        _that.service = event.item.checked;
                                        _that._writeCookieParam();
                                        _that.refresh();
                                    }
                                }
                            });

		                    break;
		            }

		        }
		    }
		},

		enableToolbarItem: function (id, enabled) {
		    var grid = w2ui['grid_' + this._id];
		    if (!grid) return;
		    var item = grid.toolbar.items.find(
            function (element, index, array) {
                if (element.id == id)
                    return element;
            });
		    if (item) {
		        item.disabled = !enabled;
		        if (item.id == 'hidden' + this._id) // Если это общие для всех
		            item.checked = this.service;
		        grid.toolbar.refresh();
            }
		},

		//Восстановление исходных значений формы
		cancelForm: function () {

		    this._obj.form = new Array();//Массив для ввода полей и их параметров
		    this._obj.record = new Array(); //Массив для ввода значений
		    this._obj.record['time'] = new Array();//Исключение для поля ввода времени
		    this._obj.record['angle'] = new Array();//Исключение для поля ввода угла
		    this._object = new Array();
			for ( var i in this._originalObject) {
				this._object[i] = {};
				for ( var j in this._originalObject[i])
					this._object[i][j] = this._originalObject[i][j];
			}

            // проинициализировать
		    this.init();

		    // Пересоберем грид
			this.refresh();
		},

        //Обновление значений для отправки
		updatevalue: function (val, type) {
		    var obj = {value : null, textvalue: null};
		    switch (parseInt(type)) {
		        case 1: // число
		            obj.value = obj.textvalue = val.replace(/ /ig, '');
		            break;
		        case 16: //'list' :
                    obj.value = val.value;
                    obj.textvalue = val.text;
                    break;
                case 21: //'color':
                    obj.value = obj.textvalue = !this.options.graphic ? this.toDec(val) : '#' + val;
		            break;
		        case 19: //'time':
		            var format = /([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)/;
		            if ((m = format.exec(val)) != null && val != '' && val != '__:__:__') {
		                obj.value = val.replace(/:/ig, '');
		                obj.textvalue = val;
		            }
		            break;
		        case 17: //'date':
		            var massval = val.split('/');
		            if (massval && massval.length == 3) {
		                obj.value = massval[2] + massval[1] + massval[0];
		                obj.textvalue = val;
		            }
		            break;
		        case 18: // 'angle':
		            var m = new Array();
		            var format = /[ +-]([0-1]\d\d)°([0-5]\d)\'([0-5]\d)\"/;
		            if ((m = format.exec(val)) != null && val != '' && val != '____°__\'__\"') {
		                //var strval = (Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) / 648000 * Math.PI;
		                var strval = ((Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) * Math.PI) / 648000.0;
		                if (val.substr(0, 1) == '-')
		                    strval = -strval;
		                obj.value = strval;
		                obj.textvalue = val;//val.replace('"',"") + '.44\'';
                    }
		            break;
		        default:
		            obj.value = obj.textvalue = val;
		    }

		    return obj;
		},

		//Валидация и изменения
		saveForm : function() {
		    this.issave = this.save();
		    if (w2popup)
		        w2popup.close();
		},

		//Сохранение
		save : function() {

			$(".semanticeditor-error").removeClass("semanticeditor-error");

			for (var i = this._object.length - 1; i >= 0; i-- in this._object) {
			    if (!this._object[i]) continue;
    	        if ((!this._object[i].textvalue || this._object[i].textvalue == '') && !this._object[i].isdelete)
			        this._object.splice(i, 1);
			}
			return true;
		},

		//Заполнение поля формирование записи record для this._obj
		semValue: function (rscsemantic) {
		    var record = null;

		    if (rscsemantic['value'] && rscsemantic['value'] != 'undefined') {
		        switch (parseInt(rscsemantic['type'])) {
		            case 1:
		                var dec = (parseInt(rscsemantic['decimal']) >= 0 ? parseInt(rscsemantic['decimal']) : 2);
		                if (dec == 0)
		                    record = parseInt(rscsemantic['value']);
		                else
		                    record = Math.round(parseFloat(rscsemantic['value'].toString().replace(",", ".")) * Math.pow(10, dec))
									/ Math.pow(10, dec);
		                break;
		            case 21://Цветовая палитра
		                record = this.toHex(rscsemantic['value']);
		                break;
		            case 18://Редактирование значения угла (перевод в градусы)
		                var val = this.radiansToDegrees(rscsemantic['value']);
                        if (val && val.length == 4)
		                    record = val[0] + val[1] + '°' + val[2] + '\'' + val[3] + '\"';
		                break;
		            case 19://Редактирование значения времени (перевод в стандартный вид)
		                record = this.timeToText(rscsemantic['value']);
		                break;
		            case 17://Редактирование значения даты (перевод в стандартный вид / исходный вид 20170509 - года месяц день)
		                record = this.dateToText(rscsemantic['value']);
		                break;

		            case 16://Редактирование значения списка
		                var txt = '';
		                var value;
		                if (rscsemantic['value'] != "")
		                    value = rscsemantic['value'];
		                else
		                    value = "";
		                var items = this.searchSemantic(rscsemantic['code']);
		                if (items) {
		                    for (var j = 0; j < items.length; j++) {
		                        if (items[j].value == value) {
		                            txt = items[j].text;
		                            break;
		                        }
		                    }
		                }
		                record = {
		                    value: value,
		                    id: txt,
		                    text: txt
		                };
		                break;
		            default://Присвоение без редактирования
		                record = rscsemantic['value'];
		                break;
		        }
		    }
		    return record;
		},

        // Уствновка шаблона ввода данных для поля + значение
		setFieldData: function (rscsemantic, form, options) {

            var record = this.semValue(rscsemantic),
                _that = this, autoFormat,
                $field = $('#' + form['field']);

            var type = parseInt(rscsemantic.type);
            if (type == 19)
                type = 'time';
            else {
                if (type == 18)
                    type = 'angle';
            }

            onFieldChange = function (event) {
                _that.listdatachange($field, rscsemantic, rscsemantic['type']);
            }

            var options = form.options;
            if (form['type'] != 'list') {
                if (type == 'time' || type == 'angle')
                    this.setmask($field, type);
                $field.val(record);
            }
            else {
                options.selected = record;
                options.focus = -1;
            }

            $field.w2field(form['type'], options);

            // $field.off('change', onFieldChange);
            // $field.on('change', onFieldChange);
            if (form['type'] == 'list') {
                $field.off('change', onFieldChange);
                $field.on('change', onFieldChange);
            } else {
                $field.off('keyup', onFieldChange);
                $field.on('keyup', onFieldChange);
                if (form['type'] == 'color') {
                    $field.off('change', onFieldChange);
                    $field.on('change', onFieldChange);
                }
            }

        },



        // Создание одного поля для формы (+значение если есть) - this._obj
		createSem : function(rscsemantic, i) {
			var obj = {};
			var record = null;
			var angle = new Array();
			var time = new Array();

			obj.code = rscsemantic['code'];
			obj.service = rscsemantic['service'];

			obj['field'] = 'sematiclist_' + i;

			var _that = this;
			//Определение типа поля для формы
			switch (parseInt(rscsemantic['type'])) {
				case 21 ://Цветовая палитра
					obj['type'] = 'color';
					break;
				case 16 ://Раскрывающийся список
					obj['type'] = 'list';
					obj.options = {
						items : this.searchSemantic(rscsemantic['code']),
						openOnFocus : true,
						markSearch : true,
						renderDrop : function(mitext, options) {
						    if ($('#' + _that._id) && $('#' + _that._id).width() < 400) // узкое окно
								options.align = "none";
							return mitext.text;
						}
					};
					break;
				case 1 ://Числовое значение
					var dec = (parseInt(rscsemantic['decimal']) >= 0 ? parseInt(rscsemantic['decimal']) : 2);
					if (dec != 0)
						obj['type'] = 'float';
					else
						obj['type'] = 'int';

					obj.options = {
						placeholder : (rscsemantic['defaultvalue'] != '' && parseInt(rscsemantic['defaultvalue']) != 0 ? Math
								.round(parseFloat(rscsemantic['defaultvalue'].replace(",", ".")) * Math.pow(10, dec))
								/ Math.pow(10, dec) : ''),
						min : rscsemantic['minimum'] != '' && (rscsemantic['minimum'] != rscsemantic['maximum']) ? parseFloat(rscsemantic['minimum']
								.replace(",", ".")) : null,
						max : rscsemantic['maximum'] != '' && (rscsemantic['minimum'] != rscsemantic['maximum']) ? parseFloat(rscsemantic['maximum']
								.replace(",", ".")) : null,
						precision : dec,
						groupSymbol : ' ',
						autoFormat : false
					};//Если то, что значения максимума и минимума оба равны ( = 0) является ошибкой в классификаторе, то доп условие убрать.
					break;
				case 18 ://Угол, задан в радианах
					obj['type'] = 'text';
					break;
				case 17 ://Дата
					obj['type'] = 'date';
					obj.options = {
					    format: 'dd/mm/yyyy'
					};
					break;
				case 19 ://Время
					obj['type'] = 'text';
					break;
				case -1 :
				case 24 ://Нет типа
					obj['type'] = '';
					break;
				default ://Текстовая строка
					obj['type'] = 'text';
					break;
			}

			////Является ли необходимым полем
			//if (rscsemantic['enable'] == '2' || rscsemantic['enable'] == '3')
			//	obj['required'] = true;
			////добавление записи в this._object.form

			switch (parseInt(rscsemantic['type'])) {
				case 18 ://Угол, задан в радианах
					angle.push(obj['field']);
					break;
				case 19 ://Время
					time.push(obj['field']);
					break;
			}

			record = this.semValue(rscsemantic, obj);
			return [obj, record, angle, time];

		},

        // Добавить семантику
		addsem: function(record) {
		    if (!record) return;
		    var  newrecord = JSON.parse(JSON.stringify(record)),
		        grid =  w2ui['grid_' + this._id];
		    newrecord.recid = newrecord.indexForm = grid.records.length.toString();
		    objectArray = this.createSem(record, newrecord.recid);
		    if (!objectArray)  return;

		    this._obj.form[newrecord.recid] = objectArray[0];
		    this._object[newrecord.recid] = {};
		    this._object[newrecord.recid].isadd = true;

		    for (var key in this._object[record.recid]) {
		        this._object[newrecord.recid][key] = this._object[record.recid][key];
		    }
		    this._object[newrecord.recid].recid = newrecord.recid;

		    if (objectArray[1] != null)
		        this._obj.record[this._obj.form[newrecord.recid]['field']] = objectArray[1];

		    if (objectArray[2] != null)
		        for (angle in objectArray[2]) {
		            this._obj.record['angle'].push(objectArray[2][angle]);
		        }
		    if (objectArray[3] != null)
		        for (time in objectArray[3]) {
		            this._obj.record['time'].push(objectArray[3][time]);
		        }

            // Перевыведем гридок
		    this.refresh(newrecord.recid);
		    this.trigger(objectArray[0].field, newrecord, newrecord.value, 'insert');

		},

        // Удалить семантику
		deletesem: function (record) {
		    if (!record) return;
		    if (record.reply.toString() != '1') {
		        this.trigger(this._obj.form[record.recid].field, record, '', 'update');
		        this._object[record.recid].value = this._object[record.recid].textvalue = '';
		        this._object[record.recid].isdelete = true;
		        this.setFieldData(this._object[record.recid], this._obj.form[parseInt(record.indexForm)], this.options);
		        return;
		    }

		    // Найдем все повторяемые семантики с таким кодом
		    var k = 0;
            this._object.find(
            function (element, index, array) {
                if (element.code == record.code && element.reply.toString() == '1')
                    k++;
            });
            if (k > 1) {
                var grid = w2ui['grid_' + this._id];
                this.trigger(this._obj.form.field, record, null, 'delete');
                this._object.splice(parseInt(record.recid), 1);
                this._obj.form.splice(parseInt(record.recid), 1);

                // Перевыведем гридок
                this.refresh(parseInt(record.recid) - 1);

                //// Подсветим предыдущую запись
                //var newselect = parseInt(record.recid) - 1;
                //grid.scrollIntoView(newselect);
                //setTimeout(function () {
                //    grid.select(newselect);
                //}, 100);
            }
            else {
                this.trigger(this._obj.form[record.recid].field, record, '', 'update');
                record.value = record.textvalue = '';
                //this.setFieldData(record, this._obj.form[record.recid], this.options);
                this.setFieldData(record, this._obj.form[record.indexForm], this.options);

            }

		},

		//Внесение изменений от внешнего источника
		setvalue : function(data) {
		    var setvalues = new Array();
			var id = null, newvalue, oldvalue, code;
			for (key in data) {
				id = data[key].id;
				newvalue = data[key].newvalue;
				oldvalue = data[key].oldvalue;
				code = data[key].code;
				if (id != null)
					setvalues.push({
						id : id,
						value : newvalue,
						code : code
					});
			}
			if (setvalues.length == 0)
				return;
			//this.quickSave();

			for ( var i = 0; i < setvalues.length; i++) {
				var n = "";
				for (key in this._obj.form) {
					if (this._obj.form[key].field == setvalues[i].id) {
						n = key;
						break;
					}
				}

				if (setvalues[i].value == "" || typeof (setvalues[i].value) == "object") {
					//Удаление, чистка поля
					if (n != "") {
						this._object[n].value = "";
						this._object[n].textvalue = "";
						delete this._obj.record[setvalues[i].id];
						if (this._object[n].reply == "1") {
							//Повторяемая характеристика
							var cnt = 0;
							for ( var m in this._obj.form) {
								if (this._obj.form[m].code == setvalues[i].code)
									cnt++;
							}
							//Удаляем повторяемую, если она не единственная
							if (cnt > 1) {
								this._obj.form.splice(n, 1);
								this._object.splice(n, 1);
							}
						}
					}
				} else {
					//Изменение значения, добавление поля
					var k = 0;
					for ( var m in this._obj.form) {
						if (this._obj.form[m].code == setvalues[i].code) {
							k = m;
							break;
						}
					}

					if (n == "" && k != 0 && this._object[k].reply == "1") {
						//Добавляем новую характеристику
						var num = /(\d+)/.exec(this._obj.form[this._obj.form.length - 1].field);
						num = parseInt(num[1]) + 1;

						this._object[num] = {};
						for ( var key in this._object[k]) {
							this._object[num][key] = this._object[k][key];
						}
						this._object[num].value = setvalues[i].value + "";
						var objectArray = new Array();
						objectArray = this.createSem(this._object[num], num);

						if (objectArray) {
							this._obj.form[num] = objectArray[0];

							if (objectArray[1] != null)
								this._obj.record[this._obj.form[num]['field']] = objectArray[1];

							if (objectArray[2] != null)
								for (angle in objectArray[2]) {
									this._obj.record['angle'].push(objectArray[2][angle]);
								}
							if (objectArray[3] != null)
								for (time in objectArray[3]) {
									this._obj.record['time'].push(objectArray[3][time]);
								}
						}
					} else if (n != "") {
						//Меняем значение существующей характеристики
					    var rscsemantic = this._object[n];
					    if (rscsemantic) {
					        if (!setvalues[i].value)  // !!!
					            rscsemantic.value = null;
					        else
					            rscsemantic.value = setvalues[i].value + "";
					        var obj = this._obj.form[n];
					        var record = this.semValue(rscsemantic, obj);
					        this._obj.record[id] = record;
					    }
					}
				}
			}

		    // Пересоберем грид
			this.refresh(n);
		},

		resize: function (height) {
		    var grid = w2ui['grid_' + this._id];
		    if (w2ui[this._id]) {
		        if (height) {
		            $('#createFormat_' + this._id).height(height);
		        }
		        w2ui[this._id].resize();

		        var newheight = $('.w2ui-msg-body.w2ui-msg-no-buttons').height() - $('.w2ui-buttons').height();
		        $('#createFormat_' + this._id).css('height', newheight - 30);

		    }

            // Изменим размер гридка и сохраним в куки
		    if (grid) {
		        grid.resize();
		        this._writeCookie($('#' + this._id).height());
		    }

		},

		destroy: function () {

            w2utils.formatNumber = function (val, groupSymbol, decimalSymbol) {
                var ret = '';
                if (groupSymbol == null) groupSymbol = w2utils.settings.groupSymbol || ',';
                if (decimalSymbol == null) decimalSymbol = w2utils.settings.decimalSymbol || '.';
                // check if this is a number
                if (w2utils.isFloat(val) || w2utils.isInt(val) || w2utils.isMoney(val)) {
                    tmp = String(val).split('.');
                    ret = String(tmp[0]).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + groupSymbol);
                    if (tmp[1] != null) ret += w2utils.settings.decimalSymbol + tmp[1];
                }
                return ret;
            }

            var grid = w2ui['grid_' + this._id];

		    if (w2ui[this._id]) {
		        w2ui[this._id].destroy();           // форма
		    }
		    else {
		        $('#' + this._id).css('height','');
		    }

		    if (grid)
		        grid.destroy(); // грид

		},

        // перевывести данные
		refresh: function(select) {
		    var grid = w2ui['grid_' + this._id];
		    if (grid) {
		        grid.reset(true);
		        grid.records = this.setrecords();
		        grid.refresh();
                this.sort(grid);
		        if (select >= 0) {
		            grid.scrollIntoView(select);
		            setTimeout(function () {
		                grid.select(select);
		            }, 100);
		        }
		    }
		},

        sort: function(grid){
            if (grid) {
                if (!this.sortData || this.sortData.length == 0){
                    grid.sort('code', 'asc');
                }
                else {
                    grid.sort(this.sortData[0].field, this.sortData[0].direction);
                }
            }
        },

        /**
         * Записать куки размеров
         * @method _writeCookie
         * @param height {Int} высота окна
         */
        // ===============================================================
		_writeCookie: function (height) {
		    var value = ['height=' + height];
		    value = value.join('&');
		    if (!this.options.autonomic)
		        GWTK.cookie('mapeditor_detail', value, { expires: 5, path: '/' });
		},

        /**
         * Записать куки параметров отображения списка семантики
         * @method _writeCookieParam
         */
        // ===============================================================
		_writeCookieParam: function () {
            var sortData = '', grid = w2ui['grid_' + this._id];
            if (grid && grid.sortData && grid.sortData.length > 0 ){
                sortData = JSON.stringify( grid.sortData);
                this.sortData = JSON.parse(sortData);
            }
		    var value = [
                'service=' + this.service.toString(),
                'allsemantics=' + this.allsemantics.toString(),
                'sortData=' + sortData
		    ];
		    value = value.join('&');
		    GWTK.cookie('mapeditor_detail_semantics', value, { expires: 5, path: '/' });
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
         * Прочитать куки параметров отображения списка семантики
         * @method _readCookieParam
         */
        // ===============================================================
		_readCookieParam: function () {
		    var _that = this, param = GWTK.cookie("mapeditor_detail_semantics", GWTK.cookies.converter);
		    if (!param) return;
		    $.each(param, function (index, value) {
		        var key = value.shift();
		        var key_value = value.length > 0 ? value.shift() : '';
		        switch (key) {
		            case 'service':
		                _that.service = (key_value == 'true');
		                break;
		            case 'allsemantics':
		                _that.allsemantics = (key_value == 'true');
		                break;
                    case 'sortData':
                        this.sortData = [];
                        if (key_value){
                            _that.sortData = JSON.parse(key_value);
                        }
                        break;
		        }
		    });
		},

        //Редактирование значения угла (перевод в градусы)
		radiansToDegrees: function (value) {
		    var val = new Array();
		    //val[0] = Math.round(Math.abs(value) * 648000 / Math.PI);
		    //val[1] = Math.round(val[0] / 3600);
		    //val[0] = val[0] % 3600;
		    //val[2] = Math.round(val[0] / 60);
		    //val[3] = val[0] % 60;

		    val[0] = Math.round(Math.abs(value) * 648000 / Math.PI);
		    val[1] = parseInt(val[0] / 3600);
		    val[0] = val[0] % 3600;
		    val[2] = parseInt(val[0] / 60);
		    val[3] = val[0] % 60;

		    val[0] = value < 0 ? '-' : '+';
		    if (val[1] < 100) {
		        if (val[1] < 10)
		            val[1] = '00' + val[1];
		        else
		            val[1] = '0' + val[1];
		    }
		    if (val[2] < 10) {
		        val[2] = '0' + val[2];
		    }
		    if (val[3] < 10) {
		        val[3] = '0' + val[3];
		    }
		    return val;
		},

        ////Редактирование значения времени (перевод в стандартный вид)
        //timeToText : function(value) {
        //    var val = new Array();
        //	val[4] = Math.round((value - Math.round(value)) * 100);
        //	val[0] = Math.floor(value);
        //	val[1] = Math.round(val[0] / 3600);
        //	val[0] = val[0] % 3600;
        //	val[2] = Math.round(val[0] / 60);
        //	val[3] = val[0] % 60;
        //	val[0] = '';
        //	if (val[1] < 10) {
        //		val[1] = '0' + val[1];
        //	}
        //	if (val[2] < 10) {
        //		val[2] = '0' + val[2];
        //	}
        //	if (val[3] < 10) {
        //		val[3] = '0' + val[3];
        //	}
        //	if (val[4] < 10) {
        //		val[4] = '0' + val[4];
        //	}
        //	return val;
        //},

        //Редактирование значения времени (перевод в стандартный вид)
		timeToText: function (value) {
		    value = value.toString();
		    if (value.length < 6)
		        return '00' + ':' + '00' + ':' + '00';
		    return value[0] + value[1] + ':' + value[2] + value[3] + ':' + value[4] + value[5];
		},

        //Редактирование значения даты (перевод 20170509 в стандартный вид 09/05/2017)
		dateToText: function (value) {
		    value = value.toString();
		    if (value.length < 8)
		        return '';
		    return value[6] + value[7] + '/' + value[4] + value[5] + '/' + value[0] + value[1] + value[2] + value[3];
		},

        //Конвертер из шестнадцатиричной системы счисления в десятичную
		toDec: function (rgb) {
		    rgb += "";
		    var value = rgb.substr(4, 2) + rgb.substr(2, 2) + rgb.substr(0, 2);
		    var dec = 0;
		    var val = new Array();
		    val = value.split('');
		    for (var ii = 0; ii < val.length; ii++) {
		        if (isNaN(parseInt(val[ii]))) {
		            var s = '0123456789ABCDEF';
		            val[ii] = s.indexOf(val[ii]);
		        }
		        dec += parseInt(val[ii]) * Math.pow(16, val.length - 1 - ii);
		    }
		    return dec;
		},

        //Конвертер из десятичной системы счисления в шестнадцатиричную
		toHex: function (value) {
		    var rgb;
		    if (!this.options.graphic) {
		        var b = new Array();
		        var s = '0123456789ABCDEF';
		        var hex = "";
		        var re = /(\d+)/;
		        var m;
		        if ((m = re.exec(value)) !== null)
		            value = parseInt(m[1]);
		        while (value >= 1) {
		            val = value % 16;
		            if (val >= 10)
		                b.push(s.substr(val, 1));
		            else
		                b.push(val);
		            value = (value - val) / 16;
		        }
		        for (var ii = b.length - 1; ii >= 0; ii--) {
		            hex += b[ii];
		        }
		        rgb = hex.substr(4, 2) + hex.substr(2, 2) + hex.substr(0, 2);
		    } else
		        rgb = value.substr(1);

		    return rgb;

		}

	};
}
