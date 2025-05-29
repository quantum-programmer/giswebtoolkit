/************************************* Соколова  ***** 01/04/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 * Классы:   Макеты создания объектов  ( GWTK.MapeditTemplatesExt ) *
 *           Дпополнительная панель  (GWTK.MapeditExtendMethodsExt) *
 *                                                                  *
 *******************************************************************/


if (window.GWTK) {

    /********************************************************************
    *                                                                  *
    *              Макеты создания объектов                            *
    *              GWTK.MapeditTemplatesExt                            *
    *                                                                  *
    *******************************************************************/

    // Шаблоны для создания
    GWTK.MapeditRecordTemplate = {
        "name": "",         // название объекта
        "key": "",          // ключ объекта
        "code": "",         // код объекта
        "local": "",        // локализация из rsc
        "cssclass": "",     // класс изображения
        "bsdlayer": "",    // Имя слоя в классификаторе
        "graphic": ""      // Параметры графического объекта (json)
    };
    GWTK.MapeditTemplate = {
        "layer": {
            "url": "",      // url запроса к серверу картографических данных
            "alias": "",   // alias слоя на сервере
            "id": "",       // ID слоя на сервере
            "idselector": ""   // ID дял селектора кнопки
        },
        "records": [] // массив объектов  GWTK.MapeditRecordTemplate
    };


    /**
     *  Класс: Макеты создания объектов
     * @param map - объекта Карта
     * @param parent - объект родительской панели
     * @param fn_start - функция при нажатии на кнопку макета
     * @param fn_stop - функция при отжатии кнопки макета
     * @param professional - признак профессионального редактора (определяет местоположение панели макета)
     * @constructor
     */
    // класс Макетов создания
    GWTK.MapeditTemplatesExt = function (map, parent, fn_start, fn_stop, professional) {

        this.toolname = 'mapedittemplates';
        this.error = true;
        this.professional = professional;

        this.templates = [];
        this.map = map;
        if (!this.map || this.map instanceof GWTK.Map == false)
            return;

        this.parent = (parent) ? parent : this.map.mapPane;
        this.error = false;

        this.readCookie();

        this.onChangeAction = GWTK.Util.bind(this.onChangeAction, this);
        $(this.map.eventPane).on('GWTK.mapeditorTask', this.onChangeAction);
        this.onCloseAction = GWTK.Util.bind(this.onCloseAction, this);
        $(this.map.eventPane).on('closeaction', this.onCloseAction);

        this.onChangeGraphicParams = GWTK.Util.bind(this.onChangeGraphicParams, this);
        this.onChangeGeometry = GWTK.Util.bind(this.onChangeGeometry, this);

        this.fn_start = fn_start ? fn_start : null;
        this.fn_stop = fn_stop ? fn_stop : null;

        this.cssclass = '';

        // Событие на смену размера кнопок
         $(this.map.eventPane).on('GWTK.MapeditLegend.changeSizing', GWTK.bind(function(event){
             if (event && event.cssclass) {
                 this.refreshTemplate(event.cssclass);
             }
          }, this));

    };

    GWTK.MapeditTemplatesExt.prototype = {

        destroy: function () {
            $(this.map.eventPane).off('GWTK.mapeditorTask', this.onChangeAction);
            $(this.map.eventPane).off('closeaction', this.onCloseAction);

            this.hideTemplate();
            $(this.parent).remove();
        },

        /**
         * Прочитать из хранилища браузера
         */
        readCookie: function () {
            this.templates = [];
            if (window.localStorage) {
                // var lstorage = JSON.parse(window.localStorage.getItem(this.toolname));
                var lstorage = window.localStorage.getItem(this.toolname);

                if (lstorage) {
                    var mass = lstorage.split('=');
                    if (mass && mass.length == 2 && mass[0] == 'templates') {
                        // this.templates = (lstorage[this.id] && lstorage[this.id]['value'] !== undefined) ? parseFloat(lstorage[this.id]['value']) : [];
                        this.templates = JSON.parse(mass[1]);
                    }
                }
            }
            else {
                var param = GWTK.cookie(this.toolname, GWTK.cookies.converter);
                if (!param) {
                    return;
                }

                var _that = this;
                $.each(param, function (index, value) {
                    var key = value.shift(), key_value;
                        key_value = value.length > 0 ? value.shift() : '';
                    switch (key) {
                        case 'templates':
                            _that.templates = ((key_value == '') ? [] : JSON.parse(key_value));
                            break;
                    }
                });
            }

        },

        /**
         * Сохранить в хранилище браузера
         */
        writeCookie: function () {
            var str = (this.templates) ? JSON.stringify(this.templates) : '',
                value = ['templates=' + str];

            if (window.localStorage){
                window.localStorage.setItem(this.toolname, value)
            }
            else {
                // var str = (this.templates) ? JSON.stringify(this.templates) : '',
                //     value = ['templates=' + str].join('&');
                GWTK.cookie(this.toolname, value.join('&'), {expires: 5, path: '/'});
            }
        },

        // Панель макетов, если есть
        setTemplate: function (layer, legend, visible, aligpanel) {
            var parent = $(this.parent), _that = this;
            if (!layer) {
                this.hideTemplate();
                return;
            }

            if (visible)
                parent.css('display', 'block');
            parent.css('left', $(aligpanel).css('left'));

            if (!this.professional) {
                parent.draggable({containment: "parent"});
            }

            // Найдем наш макет
            var template, url = '', question = layer.options.url.indexOf("?");
            if (question !== -1) {
                url = layer.options.url.slice(0, question);
            }

            // Если не графический слой и нет url
            if (!url && layer instanceof GWTK.graphicLayer == false) {
                return;
            }

            // Определим идентификатор слоя
            var idLayer = (layer instanceof GWTK.graphicLayer == false) ? layer.idLayer : layer.id;

            if (this.templates && this.templates.length > 0) {
                this.templateCurr = this.templates.find(
                    function (element, index, array) {
                        if (layer instanceof GWTK.graphicLayer) {
                            if (element.layer && element.layer.alias == layer.alias) {
                                return element;
                            }
                        }
                        else {
                            if (element.layer && element.layer.id == idLayer && element.layer.url == url)
                                return element;
                        }
                    });
            }

            // Создадим макет
            if (!this.templateCurr) {
                var templateCurr = {
                    "layer": {
                        "url": url,
                        "alias": layer.alias,
                        "id": idLayer,
                        "idselector": this.getId(idLayer)
                    },
                    "records": [  // массив объектов  GWTK.editRecordTemplate
                    ]
                }
                for (var i = 0; i < 10; i++) {
                    templateCurr.records.push({
                        "name": "",
                        "key": "",
                        "local": "",
                        "cssclass": "emptytemlate",
                        "lastdate": 0,
                        "graphic": "",
                        "title": ""
                    });
                }
                this.templates.push(templateCurr);
                this.templateCurr = this.templates[this.templates.length - 1];
            }

            if (!legend)
                legend = layer.classifier.getlegend();

            this.bodyselectorTemplate = parent.attr('id') + '_body';

            // Заголовок
            if (!this.professional) {
                parent[0].appendChild(GWTK.Util.createHeaderForComponent({
                    map: this.map,
                    name: w2utils.lang("Layouts") + ': ' + this.templateCurr.layer.alias,
                    callback: GWTK.Util.bind(function () {
                        _that.hideTemplate();
                    }, this)
                }));
            }

            // Установим текущую запись шаблона
            if (this.templateCurr) {
                this.templateRecordCurr = this.templateCurr.records[0];
            }

            // Перерисуем линейку макетов
            this.refreshTemplate();

        },

        // Скрыть шаблон
        hideTemplate: function () {
            this.writeCookie();
            //$('#' + this.bodyselectorTemplate).remove();
            $(this.parent).empty();
            $(this.parent).css('display', 'none');
        },

        // Перерисуем линейку макетов
        refreshTemplate: function (cssclass) {
            var parent = $(this.parent);

            if (cssclass) {
                this.cssclass = cssclass + ' ';
            }

            $('#' + this.bodyselectorTemplate).remove();

            // Выведем шаблон в окно
            var htmltds = '', template = this.templateCurr, el, w, h, title, classifierLayer, maplay;
            for (var i = 0; i < template.records.length; i++) {
                // Удалить все пробелы из selectorId
                template.records[i].selectorId = template.layer.idselector.replace(/ /g, '') + '_' + i.toString();
                // Удалить все пробелы из selectorId
                title = template.records[i].name;
                if (template.records[i].graphic) {
                    if (this.templateCurr && this.templateCurr.layer) {
                        maplay = this.map.tiles.getLayerByIdService(this.templateCurr.layer.id);
                        if (maplay && maplay.classifier) {
                            classifierLayer = maplay.classifier.getLayerSemanticListByKey(template.records[i].graphic.classifierLayer);
                            if (classifierLayer) {
                                title += ' (' + classifierLayer.alias + ')';
                            }
                        }
                    }
                }
                htmltds +=
                    // '<div id="' + template.layer.idselector + '_' + i.toString() + '" class="legend_img_editor border-button clickable ' + template.records[i].cssclass +
                    '<div id="' + template.records[i].selectorId + '" class="legend_img_editor border-button clickable ' + this.cssclass + template.records[i].cssclass +
                     '" style="margin-right: 3px;"'
                    + ' title = "' + title + '" ' + '></div>';
            }

            var html =
                '<div  class="divFlex" id="' + this.bodyselectorTemplate + '" >' +
                // '<div  class="divFlex" id="' + this.bodyselectorTemplate + '"  style="width: ' + width + ';">' +
                htmltds +
                '</div>';
            parent.append(html);

            for (var i = 0; i < template.records.length; i++) {
                el = $('#' + template.records[i].selectorId);
                el.click(GWTK.Util.bind(this.gettemplaterecord, this));
                // Если объект графического типа
                if (template.records[i].graphic) {
                    this.drawGraphicImage(template.records[i]);
                 }

            }

            this.writeCookie();
        },

        /**
         * Вывести изображение графического объекта
         */
        drawGraphicImage: function(record){
            if (record && record.graphic) {
                var el = $('#' + record.selectorId);
                el.empty();
                el.removeClass(record.cssclass);
                var w = el.width() - 4, h = el.height() - 4,
                    _object = GWTK.MapeditLegendGraphicControl.prototype.createGraphicObjectFromJSON(record.graphic);
                if (_object) {
                    if (_object.type !== 'point') {
                        var image = _object.getExampleImageSvg(w, h, null, 'template');
                        el.append('<div style = "padding: 2px;"><svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + image + '</svg></div>');
                    } else {
                        var svg = _object.createSvgExampleElement(w, h);
                        if (svg) {
                            var div =  GWTK.DomUtil.create('div', null, el[0]);
                            div.style.padding = '2px';
                            div.append(svg);
                        }
                    }
                }
            }
        },


        // Определим что лежит в шаблоне
        gettemplaterecord: function(event) {
            // var id = $(event.target).attr('id');
            var id = $(event.currentTarget).attr('id');
            if (id) {
                var mass = id.split('_');
                if (mass && mass.length > 1) {
                    var curr = -1, lastdate = 0,
                        record = this.templateCurr.records[parseInt(mass[mass.length - 1])];
                    if (record && record.key != '')
                        record.lastdate = new Date().getTime();
                     //if (record.cssclass != 'emptytemlate') {

                        var newbutton, currId = this.getButtonId(record.key, 'key');
                        if (currId && currId != this.currSelectId){
                            newbutton = true;
                        }

                        var graghicObject = (record.graphic) ? JSON.parse(JSON.stringify(record.graphic)) : '';
                        //var graghicObject = null;
                        // if (record.graphic) {
                        //     graghicObject = GWTK.MapeditLegendGraphic.prototype.createGraphicObjectFromJSON(record.graphic);
                        // }
                        // Если есть активный обработчик и он не равен пришедшему
                        if (this.currSelectId) {
                            var retStop = true;
                            // Попытыться завершить
                            if (this.fn_stop) {
                                retStop = this.fn_stop({
                                    key: record.key,
                                    code: record.code,
                                    text: record.name,
                                    local: record.local,
                                    img: record.cssclass,
                                    bsdlayer : record.bsdlayer,
                                    startNew : newbutton,      // Признак нового будущего старта
                                    graphic: graghicObject,
                                    title: record.title
                                });
                            }
                            // Не разрешено завершить
                            if (!retStop) {
                                return; // омтавили как есть
                            }

                            this.setActiveElement(this.currSelectId, false);
                        }


                        // Стартуем новый
                        if (newbutton) {
                            this.activeTemplateRecord(record.key, true);
                            if (this.fn_start) {
                                this.fn_start({
                                    key: record.key,
                                    code: record.code,
                                    text: record.name,
                                    local: record.local,
                                    img: record.cssclass,
                                    bsdlayer: record.bsdlayer,
                                    graphic: graghicObject,
                                    title: record.title
                                });
                            }
                        }
                   // }
                }
            }

        },


        // Обновить запись в шаблоне
        setTemplateRecord: function (node) {
            if (!node || (!node.key && !node.code)) {
                return;
            }

            // Назначим запись шаблонy
            var template = this.templateCurr,
                curr = -1;
            if (template) {
                var lastdate = template.records[0].lastdate;
                for (var i = 0; i < template.records.length; i++) {
                    if (template.records[i].key == node.key || template.records[i].lastdate == 0) {
                            curr = i;
                            break;
                    }
                    else {
                        if (lastdate && lastdate > template.records[i].lastdate) {
                            lastdate = template.records[i].lastdate;
                            curr = i;
                        }
                    }
                }
                if (curr < 0) {
                    curr = 0;
                }

                template.records[curr].lastdate = new Date().getTime();
                template.records[curr].key = node.key;
                template.records[curr].code = node.code;
                template.records[curr].name = node.text;
                template.records[curr].local = node.local;
                template.records[curr].bsdlayer = node.bsdlayer;
                if (node.local != GWTK.classifier.prototype.getlocalByName('title')) {
                    template.records[curr].title = node.title;
                }

                if (node.graphic) {
                    template.records[curr].graphic = JSON.parse(JSON.stringify(node.graphic));
                }
                else {
                    if (node.img) {
                        // template.records[curr].cssclass = node.img.replace(' legend_img_editor', '');
                        template.records[curr].cssclass = node.cssclass;
                    }
                }

                this.templateRecordCurr = template.records[curr];

                this.refreshTemplate();

            }

        },

        /**
         * Найти элемент по значению
         * @param value - значение
         * @param fieldname - имя поля поиска
         * @returns {{node: null, layerIndex: number, objectIndex: number}}
         */
        getButtonId: function(value, fieldname) {
            var indexCurr = -1;
            if (this.templateCurr && this.templateCurr.records) {
                this.templateRecordCurr = this.templateCurr.records.find(
                    function (element, index, array) {
                        if (element[fieldname] == value) {
                            indexCurr = index;
                            return element;
                        }
                    });
            }

            if (indexCurr >= 0) {
               // return this.templateCurr.layer.idselector + '_' + indexCurr.toString();
                return this.templateCurr.layer.idselector.replace(/ /g, '') + '_' + indexCurr.toString();
            }
        },

        // Включить/отключить кнопку
        activeTemplateRecord: function (key, active) {
            if (!key) {
                key = (this.templateRecordCurr )? this.templateRecordCurr.key : '';
            }

            var id = this.getButtonId(key, 'key');
            if (id) {
                this.setActiveElement(id, active);
            }

        },


        setActiveElement: function(id, active) {
            if (this.currSelectId) {
                GWTK.DomUtil.removeActiveElement('#' + this.currSelectId);
                $('#' + this.currSelectId).css('opacity', '');
                this.currSelectId = null;
            }
            if (active) {
                GWTK.DomUtil.setActiveElement('#' + id);
                $('#' + id).css('opacity', 1.0);
                this.currSelectId = id;
            }
        },

        // Смена обработчика
        onChangeAction: function (event) {
            if (!event.mapobject) return;
            if (event.operation == 'setaction') {
                this.activeTemplateRecord(event.mapobject.key, true);
            }
        },

        // Закрытие обработчика
        onCloseAction: function () {
            if (!this.templateRecordCurr)
                return;

            this.activeTemplateRecord(this.templateRecordCurr.key, false);
        },

        getId: function (id) {
            if (id) {
                id = GWTK.Util.decodeIdLayer(id);
                return ((id.replace(/\\/g, '_')).replace(/\./g, '_')).replace(/#/g, '_');
            }
        },


        /**
         * Установка прослушки
         * @param type
         */
        setEvent: function(type){
            switch(type) {
                case 'on' :
                    $(this.map.eventPane).on('GWTK.MapeditLegendGraphicControl.changegraphicparams', this.onChangeGraphicParams);
                    $(this.map.eventPane).on('changedata_metrics', this.onChangeGeometry);
                    break;
                case 'off' :
                    $(this.map.eventPane).off('GWTK.MapeditLegendGraphicControl.changegraphicparams', this.onChangeGraphicParams);
                    $(this.map.eventPane).off('changedata_metrics', this.onChangeGeometry);
                    break;
            }
        },

        /**
         * Событие на смену параметров draw-объектов
         * @param event
         */
        onChangeGraphicParams: function(event) {
            // Определимся с шаблоном
            if (event && this.templateCurr && event.maplayer &&
                this.templateCurr.layer.alias == event.maplayer.alias) {

                // Если есть текущий
                if (this.templateRecordCurr) {

                    if (this.templateRecordCurr.graphic && event.source &&
                        this.templateRecordCurr.graphic.type == event.source.type) {
                        this.templateRecordCurr.graphic = event.source.saveJSON();
                        this.drawGraphicImage(this.templateRecordCurr);
                        // console.log(this.templateRecordCurr.graphic);
                        // console.log(GWTK.MapeditLegendGraphicControl.prototype.saveSLD(this.templateRecordCurr.graphic));
                        this.writeCookie();
                    }
                }
            }
        },

        onChangeGeometry: function(event) {
            // Определимся с шаблоном
            if (event && event.dataobject && event.maplayer &&
                this.templateCurr &&
                this.templateCurr.layer.alias == event.maplayer.alias) {

                // Если есть текущий
                if (this.templateRecordCurr) {
                    this.templateRecordCurr.title = event.dataobject.text;
                    this.writeCookie();
                }
            }
        }



    };


    /********************************************************************
    *                                                                  *
    *                      Дпополнительная панель                      *
    *                      GWTK.MapeditExtendMethodsExt                *
    *                                                                  *
    *******************************************************************/

    // Режим на расширенной панели
    GWTK.MapeditExtendMethod = {
        "name": "",         // название
        "id": "",           // идентификатор
        "fn_start": "",     // функцмя старта режима
        "fn_stop": "",      // функцмя завершения режима
        "cssclass": ""      // класс изображения на кнопке
    };

    GWTK.MapeditExtendParam = {
        "title": "",          // Заголовок панели
        "editobject" : "",    // Редактируемый объект
        "methods": [],        // Массив объектов GWTK.MapeditExtendMethod
        "fn_start": "",       // функцмя старта - вызывается после открвтия панели
        "fn_stop": ""        // функцмя завершения - вызывается после закрытия панели
    };


    /**
     * класс создания дополнительных панелей
     * @param map - Объект Карта
     * @param parent - объект родительской панели
     * @param param - параметры
     * @constructor
     */
    GWTK.MapeditExtendMethodsExt = function (map, parent, param) {

        this.toolname = 'mapeditextend';
        this.error = true;

        this.map = map;
        if (!this.map || this.map instanceof GWTK.Map == false)
            return;
        this.parent = (parent) ? parent : this.map.mapPane;

        this.param = {};
        if (typeof param === 'object') {
            // расширение настроек графики
            $.extend(this.param, param);
        }

        this.error = false;
        this.ourMethods = false;
        this.bodyselector = $(this.parent).attr('id') + '_' + GWTK.Util.randomInt(150, 200);
        this.onClickMethod = GWTK.Util.bind(this.onClickMethod, this);

    };

    GWTK.MapeditExtendMethodsExt.prototype = {

        destroy: function () {
            this.hide();
            $(this.parent).empty();
        },

        // назначить методы
        set: function (param, visible, aligpanel) {
            this.hide();

            if (!param || typeof param !== 'object' || !param.methods || param.methods.length == 0)
                return;
            var parent = $(this.parent), _that = this;

            this.param = {};
            if (typeof param === 'object') {
                // расширение настроек графики
                $.extend(this.param, param);
            }

            if (visible) {
                parent.css('display', 'block');
            }

            // Выравнивание
            var alignPane = $(aligpanel), css_left = 0, css_right = 0;
            if (alignPane.length > 0) {
                css_left = parseFloat(alignPane.css('left'));
                css_right = parseFloat(alignPane.css('right'));
            }
            if (css_left) {
                parent.css('left', css_left);
            }
            else {
                parent.css('right', css_right);
            }

            parent.draggable({ containment: "parent" });

            // Заголовок
            parent[0].appendChild(GWTK.Util.createHeaderForComponent({
                map: this.map,
                name: this.param.title ? this.param.title : '',
                callback: GWTK.Util.bind(function () {
                    _that.hide();
                }, this)
            }));

            // Перерисуем линейку макетов
            this.refresh();

        },

        // Скрыть
        hide: function () {
            // Закрыть обработчик
            if (this.currentSelector){
                $('.' + this.currentSelector).click();
            }
            $(this.parent).empty();
            $(this.parent).css('display', 'none');
            if (this.param.fn_stop) {
                this.param.fn_stop();
            }
        },

        // Перевывести режимы
        refresh: function () {
            if (this.param.fn_start) {
                this.param.fn_start();
            }

            var parent = $(this.parent), len;
            $('#' + this.bodyselector).remove();

            // Выведем шаблон в окно
            var htmltds = '',
                widthbutton = 32;

            for (var i = 0; i < (len = this.param.methods.length); i++) {
                htmltds +=
                    '<div id="' + (i + 1).toString() + '" class="button-clickable control-button-edit-methodExt control-button-edit ' + this.param.methods[i].cssclass + '" style="border: solid grey 1px !important;"'
                    + ' title = "' + this.param.methods[i].name + '" ' + '></div>';
                }

            var html =
                '<div  class="divFlex" id="' + this.bodyselector + '" >' +
                htmltds +
                '</div>';

            parent.append(html);
            parent.width(widthbutton * this.param.methods.length + parseInt(parent.css('padding-left')) * 2 );

            // События
            var el =  $(this.parent).find('#' + this.bodyselector);
            for (var i = 0; i < len; i++) {
                $(el).find('#' + (i + 1).toString()).click(this.onClickMethod);
            }

        },

        /**
         * onClickMethod - событие при нажатии на кнопку режима
         * @param event
         */
        onClickMethod:function(event){
            var id = $(event.target).attr('id');
            if (id > 0) {
                id = parseInt(id) - 1;
                // Если кнопка нажата, но не та, сперва отключить режим
                if (this.currentSelector  && this.param.methods[id].cssclass !== this.currentSelector ) {
                    this.stop();
                    // var id_old = $('.' + this.currentSelector).attr('id');
                    // if (id_old) {
                    //     id_old = parseInt(id_old) - 1;
                    //     if (this.param.methods[id_old].fn_stop) {
                    //         this.param.methods[id_old].fn_stop(this.currentSelector);
                    //     }
                    //     this.activeMethod(this.currentSelector, false);
                    // }
                }

                if (GWTK.DomUtil.isActiveElement('.' + this.param.methods[id].cssclass) == false) {
                    this.activeMethod(this.param.methods[id].cssclass, true);
                    if (this.param.methods[id].fn_start) {
                        this.param.methods[id].fn_start(this.param.methods[id]);
                    }
                }
                else {
                    if (this.currentSelector) {
                        this.stop();
                        // this.activeMethod(this.param.methods[id].cssclass, false);
                        // if (this.param.methods[id].fn_stop) {
                        //     this.param.methods[id].fn_stop(this.param.methods[id]);
                        // }
                    }
                }

            }

        },


        // Включить/отключить кнопку
        activeMethod: function (selector, active) {
            var cssselector = (selector) ? '.' + selector : null;
            if (active && selector) {
                this.currentSelector = selector;
            }

            var $el = $(cssselector);
            if (active) {
                GWTK.DomUtil.setActiveElement(cssselector);
                $el.css('opacity', 1.0);
            }
            else {
                GWTK.DomUtil.removeActiveElement(cssselector);
                $el.css('opacity', '');
                this.currentSelector = null;
            }
            return true;
        },

        /**
         * stop - завершение работы режима
         */
        stop: function(){
            var id = $('.' + this.currentSelector).attr('id');
            if (id) {
                id = parseInt(id) - 1;
                if (this.param.methods[id].fn_stop) {
                    this.param.methods[id].fn_stop(this.param.methods[id]);
                }
                this.reset();
            }
        },

        /**
         * reset - сброс режима
         */
        reset: function(){
            this.activeMethod(this.currentSelector, false);
        }

    };


};
