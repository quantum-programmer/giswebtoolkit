/*************************************** Соколова Т.О.05/11/19 *****
**************************************** Нефедьева О. 23/10/18 *****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2019              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                   Класс Адресное геокодирование                  *
*                                                                  *
*                                                                  *
*******************************************************************/

if (window.GWTK) {
    /**
     * Класс Адресное геокодирование
     * @class GWTK.AddressGeocoding
     * @constructor GWTK.AddressGeocoding
    */
      GWTK.AddressGeocoding = function (map, addressparam ) {
        this.toolname = "addressgeocoding";
        this.map = map;

        this.clearSearch();

        if (!this.map ) {
            console.log("GWTK.AddressGeocoding. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        
        if (!addressparam || !addressparam.url_addresssearch || !addressparam.url_addresssearch[0]) { // нет url
            console.log("GWTK.AddressGeocoding. " + w2utils.lang("Not defined a required parameter") + " Url.");
            return;
        }
        this.sheet = 'geocode.';

        this.setOptions(addressparam);
    };

    GWTK.AddressGeocoding.prototype = {
        /**
         * Настроить параметры запроса геокодирования
         * @method setOptions
         * @param map {Object} карта
         * @param addressparam {Object} параметры запроса
        */
        // ===============================================================
        setOptions: function (addressparam) {
            this.clearSearch();
            if (!addressparam || !addressparam.url_addresssearch || addressparam.url_addresssearch.length == 0)
                return;
            this.addressparam = JSON.parse(JSON.stringify(addressparam));
            this.init(addressparam);
            return true;
        },


        /**
         * Инициализация класса
         * @method init
         */
        // ===============================================================
        init: function (addressparam) {

            this._canCancel = true;                         // признак возможности завершения
            this._canceled = false;                         // признак завершения активности
            this.maxCount_default = 100;                    // размер ответа по умолчанию

            if (this.addressparam["url_addresssearch"][0]) {
                this.url = this.addressparam["url_addresssearch"][0];
                if (!addressparam["url_addresssearch"][1] ||
                    !addressparam["url_addresssearch"][1].fn_setrequest || !addressparam["url_addresssearch"][1].fn_getresponse) { // нет настроек (значит стандартные  - яндекс)
                    this.addressparam["url_addresssearch"][1] = {
                        "fn_setrequest": GWTK.AddressGeocoding.setrequestYandex,
                        "fn_getresponse": GWTK.AddressGeocoding.getresponseYandex
                    };
                }
                else {
                    // Допишем адреса функций
                    this.addressparam["url_addresssearch"][1].fn_setrequest = addressparam["url_addresssearch"][1].fn_setrequest;
                    this.addressparam["url_addresssearch"][1].fn_getresponse = addressparam["url_addresssearch"][1].fn_getresponse;
                }
            }

            // apikey
            if (this.addressparam["access"] && typeof this.addressparam["access"] === 'object'){
                this.access = JSON.parse(JSON.stringify(this.addressparam["access"]));
            }

            return this;
        },


        /**
         * Очистить переменные поиска
         * @method clearSearch
         */
        // ===============================================================
        clearSearch: function () {
            // Удалим place марки
            this.map.placemarkRemove(this.toolname);

            // очистить массив точек
            this.geoCodes = [];                             // данные ответа сервера - массив объектов geoCodes:text - название,BL - координаты через пробел b l
            this.totalCount = 0;                            // общее число найденных адресов по запросу
            this.startIndex = 0;                            // номер первой записи в ответе
            this.requestUrl = "";                           // Полный Url запроса геокодирования
            this._text = "";                                // адрес для геокодирования
            this._callback = null;
        },

        /**
         * Проверить возможность работы
         * @method enabled
         */
        // ===============================================================
        enabled: function () {
            if (!this.url || this.url.length == 0)
                return false;
            return true;
        },

        /**
         * Прервать выполнение
         * @method cancel
         */
        // ===============================================================
        cancel: function () {
            if (!this._canCancel) {
                this._canceled = true;
            }
            else this._canceled = false;

            return this._canCancel;
        },

        // Запрос разделителя к формируемой строке запроса
        getdelimerForUrl: function (url) {
            if (!url) return '';

            var delimer = '';
            var question = url.indexOf("?");
            if (question < 0)
                delimer = '?';
            else {
                if (url.length > question - 1)
                    delimer = '&';
            }
            return delimer;
        },


        /**
        * Запросить данные с сервера
        * @method postRequest
        * @param result {Number} максимальный размер ответа (объектов)
        * @param skip {Number} число записей, которое надо пропустить
        * @param fn_setrequest {Function} функция формирования запроса к серверу
        * @param fn_getresponse {Function} функция разбора ответа от сервера
       */
        // ===============================================================
        postRequest: function (result, skip, fn_setrequest, fn_getresponse) {

            if (!this._text) {
                this.search_query.errormessage = w2utils.lang("Not defined a required parameter" + " - text.");
                var classname = (this instanceof GWTK.AddressGeocoding) ? 'GWTK.AddressGeocoding' : 'GWTK.ReverseGeocoding';
                if (this.i)
                    console.log(classname + ".postRequest " + this.search_query.errormessage);
            }

            if (fn_setrequest !== 'undefined' && $.type(fn_setrequest) === "string") {
                fn_setrequest = GWTK.Util.getFunction(fn_setrequest);
            }
            if (fn_getresponse !== 'undefined' && $.type(fn_getresponse) === "string") {
                fn_getresponse = GWTK.Util.getFunction(fn_getresponse);
            }

            if (!fn_setrequest === 'undefined' || $.isFunction(fn_setrequest) == false ||
                !fn_getresponse === 'undefined' || $.isFunction(fn_getresponse) == false) {
                this.search_query.errormessage = w2utils.lang("Not defined a required parameter") + " - fn_setrequest, fn_getresponse.";
                console.log(classname + ".postRequest " + this.search_query.errormessage);
            }

            // Если ошибка
            if (this.search_query.errormessage && this.search_query.errormessage !== '') {
                if (this._callback) {
                    this._callback(this.geoCodes, this.search_query);
                }
               return;
            }

            var result = result;
            if (!result)
                result = this.maxCount_default;
            if (!skip) {
                this.startIndex = 0;
            }
            else {
                this.startIndex = skip;
            }

            var requesObj = fn_setrequest(this.url, this._text, result, this.startIndex, this.map, this.access ? this.access : null);
            if (!requesObj) return;
            this.requestUrl = requesObj.requestUrl;
            var response = requesObj.response,
                dataType = requesObj.dataType;

            var tool = this;
            //this.search_query.startIndex = this.startIndex;
            //this.search_query.errormessage = '';
            //this.search_query.status = 'error';
            //this.search_query.numberReturned = 0;
            //this.search_query.totalCount = 0;

            $.support.cors = true;
            try {
                $.ajax({
                    type: "GET",
                    crossDomain: true,
                    url: this.requestUrl,
                    response: response,
                    dataType: dataType,
                    timeout: 240000,                                     // timeout = 4 min
                    success: function (data, textStatus) {
                        tool._canCancel = true;
                        tool.search_query.errormessage = '';
                        if (tool._canceled) {
                            tool.search_query.status = 'canceled';
                            if ($.isFunction(tool._callback)) { tool._callback([], tool.search_query); }
                            return;
                        }
                        if (!textStatus || textStatus != "success") {
                            return this.error();
                        }
                        tool.search_query.status = 'done';
                        
                        var retobj = fn_getresponse(data);
                        if (!retobj || retobj.geoCodes.length == 0) {
                            tool.notFound();
                            if (tool.search_query.startIndex == 0) {
                                $(tool.map.eventPane).trigger({ "type": "featureinforefreshed" });
                            }
                            return;
                        }

                        tool.fillResult(retobj.geoCodes);
                        $(tool.map.eventPane).trigger({ "type": "featureinforefreshed", "layers": [] });

                        // заполнить контекст ответа
                        tool.search_query.numberReturned = retobj.numberReturned;
                        tool.search_query.totalCount = retobj.totalCount; //found;
                        //if (results) tool.search_query.maxCount = parseInt(results);
                        //else tool.search_query.maxCount = this.maxCount;

                        if (tool._callback) {
                            tool._callback(tool.geoCodes, tool.search_query);
                        }
                    },
                    error: function (jqxhr, textStatus, errorThrown) {
                        tool._canCancel = true;
                        var message = "GWTK.AddressGeocoding.postRequest " + w2utils.lang("Failed to get data");
                        if (textStatus && textStatus.length > 0) {
                            message += ". Error - " + textStatus;
                        }
                        console.log(message);
                        tool.search_query.status = 'error';
                        tool.search_query.errormessage = w2utils.lang("Failed to get data");
                        if (tool._callback) {
                            tool._callback([], tool.search_query);
                        }
                        return;
                    }
                });
            }
            catch (e) { var message = "GWTK.AddressGeocoding.postRequest " + w2utils.lang("Failed to get data"); console.log(message); }

        },


        /**
          * Обработчик ошибки поиска
          * @method notFound
         */
        // ===============================================================
        notFound: function () {
            this.search_query.status = 'done';
            this.search_query.errormessage = w2utils.lang("Nothing found. Refine your search.");
            if ($.isFunction(this._callback)) {
                this._callback([], this.search_query);
            }
            return;
        },

        /**
         * Выполнить поиск
         * @method search
         * @param text {String} строка поиска
         * @param query {Object} контекст поиска
         * @param callback {Function} callback-функция получатель ответа
        */
        // ===============================================================
        search: function (text, query, callback) {

            this.search_query = $.extend(true, {}, query);
            this.search_query.startIndex = this.startIndex;
            this.search_query.errormessage = '';
            this.search_query.status = 'error';
            this.search_query.numberReturned = 0;
            this.search_query.totalCount = 0;

            if (!text || !query) {
                this.search_query.errormessage = w2utils.lang("Not defined a required parameter") + " text or query.";
                console.log("GWTK.AddressGeocoding. " + this.search_query.errormessage);
            }

            if (GWTK.Util.forbiddenTagsHTML(text)) {
                this.search_query.errormessage = w2utils.lang("Nothing found. Refine your search.");
                console.log("GWTK.AddressGeocoding. " + this.search_query.errormessage);
            }

            this.clearSearch();

            // Если ошибка во входных параметрах
            if (this.search_query.errormessage !== '') {
                if (callback) {
                    callback(this.geoCodes, this.search_query);
                    return;
                }
            }

            this._text = text;

            if (GWTK.Util.ie_Version() !== -1) {
                this._text = encodeURIComponent(this._text);
            }

            if ($.isFunction(callback)) {
                this._callback = callback;
            }
            else
                this._callback = null;

            this.result = null;
            this.startIndex = query.startIndex || 0;
            this._canCancel = false;

            if (!this.addressparam || !this.addressparam.url_addresssearch[1])
                return;
            
            // Выполнить запрос
            this.postRequest((this.addressparam.url_addresssearch[1].result) ? this.addressparam.url_addresssearch[1].result : null,
                this.search_query.startIndex,
                this.addressparam.url_addresssearch[1].fn_setrequest, this.addressparam.url_addresssearch[1].fn_getresponse);

        },

        /**
         * Заполнить результат
         * @method fillResult
         * @param geoCodes {Array} ответ сервера
        */
        // ===============================================================
        fillResult: function (geoCodes) {

            if (!geoCodes || geoCodes.length == 0) {
                this.notFound();
                return;
            }
            var count = geoCodes.length;
            for (var i = 0; i < count; i++) {
                this.geoCodes.push(geoCodes[i]);
                // Добавим в панель списка найденных объектов
                this.addPlacemark(this.geoCodes[i], i);
                this.addMapObject(this.geoCodes[i], i);
            }

            this.map.overlayRefresh();
        },

        /**
         * Добавить отметку на карту
         * @method addPlacemark
         * @param geoCode {Object} геообъект, JSON
         * @param index {Number} индекс геообъекта в массиве объектов
        */
        // ===============================================================
        addPlacemark: function (geoCode, index) {
            if (!geoCode) return;

            // id точки
            var id = "addrpoint" + '_' + (index + 1).toString();
            var coord = geoCode.BL.split(' ');
            if (coord.length != 2) {
                if (window.console) console.log("GWTK.AddressGeocoding. Ошибка данных.");
                return;
            }

            try {
                var geo = GWTK.toLatLng(coord[1], coord[0]);
                var overlaypoint = GWTK.tileView.geo2pixelOffset(this.map, geo);
                this.map.overlayAppend(geo, overlaypoint, true, id, true, GWTK.Util.getDivSize('placemark-img-size-small'), this.toolname, geoCode.text);
            }
            catch (err) {
                if (window.console) console.log(err + " - " + "GWTK.AddressGeocoding. " + w2utils.lang("Runtime error"));
            }

            return;
        },

        /**
         * Добавить геообъект в карту
         * @method addMapObject
         * @param geoobject {Object} геообъект, JSON
         * @param index {Number} индекс геообъекта в массиве объектов
        */
        // ===============================================================
        addMapObject: function (geoobject, index) {
            if (!geoobject) return false;

            var gmlid = this.sheet + (parseInt(index) + 1).toString();
            var mapobject = new GWTK.mapobject(this.map, gmlid, "", null, null);
            mapobject.maplayername = this.addressparam.alias;             // алиас адресного сервиса
            mapobject.maplayerid = "";
            mapobject.srv = "";
            mapobject.wfsQuery = null;
            mapobject.spatialposition = mapobject.geometry.spatialposition = "point";
            var coord = geoobject.BL.split(' ');
	        mapobject.objectcenter = GWTK.toLatLng( [ coord[ 1 ], coord[ 0 ] ] );
            if (coord.length != 2) {
                if (window.console) console.log("GWTK.AddressGeocoding. Ошибка данных.");
                return;
            }
            mapobject.name = geoobject.text;
            mapobject.geometry.appendpoint(coord[1], coord[0]);

            this.map.selectedObjects.mapobjects.push(mapobject);

            return;
        }

    };



    /*********************************************************
    **    Компонент обратного геокодирования                **
    **********************************************************/
    GWTK.ReverseGeocoding = function (map, addressparam) {

        GWTK.AddressGeocoding.call(this, map, addressparam);

        this.toolname = "reversegeocoding";
        this.query = {
            'totalCount': 0, 'startIndex': 0, 'maxCount': 0,                      // количественные параметры запросов
            'defaultCount': 100, 'numberReturned': 0
        };

        this.map = map;
        if (!this.map) {
            console.log("GWTK.ReverseGeocoding. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        if (!addressparam || !addressparam.url_addressatcoord || !addressparam.url_addressatcoord[0]) { // нет url
            console.log("GWTK.ReverseGeocoding. " + w2utils.lang("Not defined a required parameter") + " Url.");
            return;
        }

        this.sheet = 'reversegeocode.';
        this.setOptions(addressparam);

        this.bt_id = 'button-addressatcoord';

        this.initialize();

        return;
    };

    GWTK.ReverseGeocoding.prototype = {

        initialize: function () {
            if (this.map instanceof GWTK.Map == false) return this;

            this.onMapClick = GWTK.Util.bind(this.onMapClick, this);
            this.onTransitionPointOk = GWTK.Util.bind(this.onTransitionPointOk, this);
            this.onSetAction = GWTK.Util.bind(this.onSetAction, this);

            if (!this.map.panes && !this.map.panes.toolbarPane)
                return;

            // Если существует, то не создавать второй раз
            if (!document.getElementById(this.bt_id)) {
                var bt = GWTK.DomUtil.create('div', 'control-button control-button-addressatcoord control-button-radio clickable', this.map.panes.toolbarPane);
                bt.id = this.bt_id;
                bt.disabled = false;
                bt.title = w2utils.lang("Address at"); //'Адрес в точке';;
                bt._pane = 'addressatcoord1';
            }

            this.map.maptools.push(this);
            tool = this;
            $('#' + this.bt_id).click(function (event) {
                tool.map.handlers.clearselect_button_click();
                tool.clearSearch();
                if (GWTK.DomUtil.isActiveElement(event.target)) {
                    GWTK.DomUtil.removeActiveElement(event.target);
                    $(tool.map.overlayPane).off('mapclick', tool.onMapClick);
                    $('#transitionpoint_ok').off('click', tool.onTransitionPointOk);
                    $(tool.map.eventPane).off('setaction', tool.onSetAction);
                    if (tool.map.taskManager._action == tool.action)
                        tool.map.closeAction();
                }
                else {
                    tool.action = new GWTK.MapAction(null, tool.toolname);
                    tool.action.clear = function() {
                        if (GWTK.DomUtil.isActiveElement(event.target)) {
                            GWTK.DomUtil.removeActiveElement(event.target);
                            $(tool.map.overlayPane).off('mapclick', tool.onMapClick);
                            $('#transitionpoint_ok').off('click', tool.onTransitionPointOk);
                            $(tool.map.eventPane).off('setaction', tool.onSetAction);
                            tool.map.closeAction();
                            tool.map.getTaskManager().checkOldTaskCreation('gwtk-old-undefined');
                        }
                    };
                    if (tool.map.setAction(tool.action)) {
                        GWTK.DomUtil.setActiveElement(event.target);
                        GWTK.DomUtil.removeActiveElement(".button-action");
                        $(tool.map.overlayPane).on('mapclick', tool.onMapClick);
                        $('#transitionpoint_ok').on('click', tool.onTransitionPointOk);
                        // Старт нового обработчика
                        $(tool.map.eventPane).on('setaction', tool.onSetAction);
                    }

                }
            });

            return this;
        },


        /**
         * Настроить параметры запроса геокодирования
         * @method setOptions
         * @param map {Object} карта
         * @param addressparam {Object} параметры запроса
        */
        // ===============================================================
        setOptions: function (addressparam) {
            this.clearSearch();
            if (!addressparam || !addressparam.url_addressatcoord || addressparam.url_addressatcoord.length == 0)
                return;
            this.addressparam = JSON.parse(JSON.stringify(addressparam));
            this.init(addressparam);
            return true;
        },

        /**
         * Инициализация класса
         * @method init
         */
        // ===============================================================
        init: function (addressparam) {

            this._canCancel = true;                         // признак возможности завершения
            this._canceled = false;                         // признак завершения активности
            this.maxCount_default = 100;                    // размер ответа по умолчанию

            if (this.addressparam["url_addressatcoord"][0]) {
                this.url = this.addressparam["url_addressatcoord"][0];
                if (!addressparam.url_addressatcoord[1] ||
                    !addressparam["url_addressatcoord"][1].fn_setrequest || !addressparam["url_addressatcoord"][1].fn_getresponse) { // нет настроек (значит стандартные  - яндекс)
                    this.addressparam["url_addressatcoord"][1] = {
                        "fn_setrequest": GWTK.AddressGeocoding.setrequestYandexAtCoord,
                        "fn_getresponse": GWTK.AddressGeocoding.getresponseYandex
                    };
                }
                else {
                    // Допишем адреса функций
                    this.addressparam["url_addressatcoord"][1].fn_setrequest = addressparam["url_addressatcoord"][1].fn_setrequest;
                    this.addressparam["url_addressatcoord"][1].fn_getresponse = addressparam["url_addressatcoord"][1].fn_getresponse;
                }
            }

            // apikey
            if (this.addressparam["access"] && typeof this.addressparam["access"] === 'object'){
                this.access = JSON.parse(JSON.stringify(this.addressparam["access"]));
            }

            return this;
        },


        gettext: function () {
            if (this.position) {
                var text;
                if (this.position[0] && this.position[1]) {
                    text = this.position[1].toString() + ',' + this.position[0].toString();  // долгота,широта (как в яндексе)
                }
                this.position = null;
                return text;
            }
            else {
                // Если нет координат, то берем со строки поиска
                return this._text;
            }
        },

        // выполнить поиск
        search: function (text, query, callback) {
            if (!text || !query) {
                console.log("GWTK.ReverseGeocoding. " + w2utils.lang("Not defined a required parameter") + " text or query.");
                return 0;
            }

            this.clearSearch();
            this._text = text;

            if ($.isFunction(callback)) {
                this._callback = callback;
            }
            else
                this._callback = null;

            this.result = null;
            this.startIndex = query.startIndex || 0;
            this.search_query = $.extend(true, {}, query);         // query;   var cloneUser = $.extend(true, {}, {firstName:"John", lastName:"Doe"});

            this._canCancel = false;

            if (!this.addressparam || !this.addressparam.url_addressatcoord[1])
                return;

            this.postRequest((this.addressparam.url_addressatcoord[1].result) ? this.addressparam.url_addressatcoord[1].result : null,
                this.search_query.startIndex,
                this.addressparam.url_addressatcoord[1].fn_setrequest, this.addressparam.url_addressatcoord[1].fn_getresponse);
        },

        /**
         * Инициализировать параметры запроса
         * @method initQuery
         */
        // ===============================================================
        initQuery: function () {
            this.query.startIndex = 0;
            this.query.totalCount = 0;
            this.query.maxCount = this.query.defaultCount;
            this.query.numberReturned = 0;
            return;
        },

        // Обратное геокодирование точка --> адрес
        onMapClick: function (event, position) {
            this.map.handlers.clearselect_button_click();
            if (!event) return;
            if (!position)
                this.position = event.geo;
            else
                this.position = position;
            this.initQuery();
            this.search(this.gettext(), this.query, this.parseResponse);//, this.addressparam.fn_parse);
            // event.stopPropagation();
        },

        // При переходе по координатам вызов поиск в точке
        onTransitionPointOk: function (event) {
            this.position = [];
            this.position[1] = this.map.options.center.lng;
            this.position[0] = this.map.options.center.lat;
            this.onMapClick(event, this.position);
        },

        /**
        * Событие старт нового обработчика
        * @method  onSetAction
        * @param event {Object} Событие
        */
        // ===============================================================
        onSetAction: function (event) {
            if (!event || !event.action)
                return;
            // Если стартовал не наш обработчик
            if (event.action != this.action)
                $('#button-addressatcoord').click();
        },

        /**
        * Выполнить анализ ответа
        * @method parseResponse
        * @param response {Object} ответ сервера
        * @param context {Object} контекст поиска ( копия this.query )
        */
        // ===============================================================
        parseResponse: function (response, context) {        // результат адресного поиска
            if (context.status == 'cancelled') { return; }
            if (context.status == 'error') {
                this.showMessage(context.errormessage);
                return;
            }
            if (this.query.text == context.text) {
                $.extend(this.query, context);
            }

            if (response.length == 0 && context.status == 'done') {
                if (context.totalCount > 0 && context.startIndex > 0) {       // продолжали поиск, но не нашли с индеска context.startIndex !
                    return;
                }
                var message = context.errormessage;
                if (message.length == 0) message = w2utils.lang("Nothing found. Refine your search.");
                if (context.text && context.text.length > 0)
                    this.showMessage(message, w2utils.lang('Search') + "  -  " + context.text);
                else
                    this.showMessage(message);
                return;
            }
        },
    
    
        /**
         * Вывести сообщение
         *
         * @method showMessage
         * @param message {String} текст окна сообщения
         * @param title {String} заголовок окна сообщения
         */
        showMessage: function (message, title) {
            if (!message) return;
            if (!title) title = w2utils.lang('Search');
            w2alert(message, title);
        },

        /**
         * Деструктор
         * @method destroy
         */
        // ===============================================================
        destroy: function () {
            $('#button-addressatcoord').off().remove();
            var pos = $.inArray(this, this.map.maptools);
            if (pos > -1)
                this.map.maptools.splice(pos, 1);
        }
    };

    GWTK.Util.inherits(GWTK.ReverseGeocoding, GWTK.AddressGeocoding);


    
    // Формирование запросов и ответов поисковых северов
    // +++++++++++++++++++++++++++++++++++++++++++++++++

    /* Формирование строки запроса с сервера Яндекса
    * @method setrequestYandex
    * @param text {String} - трока поиска
    * @param result {Number} максимальный размер ответа (объектов)
    * @param skip {Number} число записей, которое надо пропустить
    * @return {Object}  Возвращает объект
    *       {
    *        'requestUrl' : 'Ногинск' // строка запроса,
    *        'response' : 'json',     // тип запрашиваемых данных (json, text/xml),
    *        'dataType' : 'jsonp'       // тип возвращаемых данных  (json, jsonp, text/xml)
    *       }
    */

    GWTK.AddressGeocoding.setrequestYandex = function (url, text, result, skip, map, access) {
        if (!url || url == '' || !text || text == '')
            return;
        if (!result) result = 100;
        if (!skip) skip = 0;
        
        var requestUrl = {
            'requestUrl': url + GWTK.AddressGeocoding.prototype.getdelimerForUrl(url) + 'geocode=' + text + '&results=' + result + '&skip=' + skip
                + ((access && access["name"] &&  access["value"]) ? '&' + access["name"] + '=' + access["value"] : '')
                + '&format=json',
            'response' : 'json',
            'dataType' : 'jsonp'
        };
        if (map && map.options.maxBounds) {
            requestUrl.requestUrl += '&rspn=1&bbox=' + map.options.maxBounds.getWest() + ',' + map.options.maxBounds.getSouth() + '~' +
                map.options.maxBounds.getEast() + ',' + map.options.maxBounds.getNorth();
        }
        return requestUrl;
    }


    /**
     * Разбор ответа YandexMaps
     * @method getresponseYandex
     * @param data {Object} ответ сервера, JSON
     */
    // ===============================================================
    GWTK.AddressGeocoding.getresponseYandex = function (data) {
        var retobj = {
            geoCodes: [],
            totalCount: 0,      // всего найдено
            numberReturned: 0   // количество в возвращаемом списке
        }
        if (!data || !(data.response)) {
            return retobj;
        }
        var geoObjectCollection = data.response.GeoObjectCollection;
        if (!geoObjectCollection)
            return retobj;
        var geocoderResponseMetaData = geoObjectCollection.metaDataProperty.GeocoderResponseMetaData;
        if (!geocoderResponseMetaData)
            return retobj;
        var found = geocoderResponseMetaData.found;
        retobj.totalCount = parseInt(found);
        if (!found || parseInt(found) == 0)
            return retobj;
        var results = geocoderResponseMetaData.results;
        var featuresMember = geoObjectCollection.featureMember;

        if (!featuresMember || featuresMember.length == 0) {
            return retobj;
        }

        retobj.numberReturned = featuresMember.length;
        var count = featuresMember.length;
        var featureMember;
        for (var i = 0; i < count; i++) {
            retobj.geoCodes[i] = {};
            featureMember = featuresMember[i];
            retobj.geoCodes[i]["text"] = featureMember.GeoObject.metaDataProperty.GeocoderMetaData.text;
            retobj.geoCodes[i]["BL"] = featureMember.GeoObject.Point.pos;
        }

        return retobj;
    }

   /* Формирование строки запроса с сервера Яндекса для обратного геокодирования
   * @method setrequestYandexAtCoord
   * @param text {String} - строка поиска в виде 38.39874550384223,55.863501352659696 - долгота,широта
   * @param result {Number} максимальный размер ответа (объектов)
   * @param skip {Number} число записей, которое надо пропустить
   * @return {Object}  Возвращает объект
   *       {
   *        'requestUrl' : 'Ногинск' // строка запроса,
   *        'response' : 'json',     // тип запрашиваемых данных (json, text/xml),
   *        'dataType' : 'jsonp'       // тип возвращаемых данных  (json, jsonp, text/xml)
   *       }
   */
    GWTK.AddressGeocoding.setrequestYandexAtCoord = function (url, text, result, skip, map, access) {
        return GWTK.AddressGeocoding.setrequestYandex(url, text, result, skip, map, access);
    }

    /**
    * Формирование строки запроса к серверу Panorama
    * @method setrequestPanorama
    * @param text {String} - cтрока поиска
    * @param result {Number} максимальный размер ответа (объектов)
    * @param skip {Number} число записей, которое надо пропустить
    * @return {Object}  Возвращает объект
    *       {
    *        'requestUrl' : 'Ногинск' // строка запроса,
    *        'response' : 'json',     // тип запрашиваемых данных (json, text/xml),
    *        'dataType' : 'jsonp'       // тип возвращаемых данных  (json, jsonp, text/xml)
    *       }
    */
    // ===============================================================
    GWTK.AddressGeocoding.setrequestPanorama = function (url, text, result, skip, B, L, scale) {
        if (!url || url == '' || !text || text == '')
            return;
        if (!result) result = 100;
        if (!skip) skip = 0;
        var strBL = '', strScale = '';
        if (B && L) {
            strBL = '&Coord_B=' + B.toString() + '&Coord_L=' + L.toString();
        }
        if (scale) {
            strScale = '&scale=' + scale.toString();
        }
        var requestUrl = {
            'requestUrl': url + GWTK.AddressGeocoding.prototype.getdelimerForUrl(url) + 'filter=' + text + '&results=' + result + '&skip=' + skip
                + strBL + strScale,
            'response': 'json',
            'dataType': 'jsonp'
        };
        return requestUrl;
    }

    /**
     * Разбор ответа Panorama
     * @method getresponsePanorama
     * @param data {Object} ответ сервера, JSON
     */
    // ===============================================================
    GWTK.AddressGeocoding.getresponsePanorama = function (data) {
        return GWTK.AddressGeocoding.getresponseYandex(data);
    }

    /* Формирование строки запроса с сервера Panorama для обратного геокодирования
    * @method setrequestPanoramaAtCoord
   * @param text {String} - строка поиска в виде 38.39874550384223,55.863501352659696 - долгота,широта
    * @param result {Number} максимальный размер ответа (объектов)
    * @param skip {Number} число записей, которое надо пропустить
    * @return {Object}  Возвращает объект
    *       {
    *        'requestUrl' : 'Ногинск' // строка запроса,
    *        'response' : 'json',     // тип запрашиваемых данных (json, text/xml),
    *        'dataType' : 'jsonp'       // тип возвращаемых данных  (json, jsonp, text/xml)
    *       }
    */
    GWTK.AddressGeocoding.setrequestPanoramaAtCoord = function (url, text, result, skip, B, L, scale) {
        if (!url || url == '' || !text || text == '')
            return;
        if (!result) result = 100;
        if (!skip) skip = 0;
        // Поменяем местами координаты
        var strScale = '',
            mass = text.split(',');
        if (scale) {
            strScale = '&scale=' + scale.toString();
        }

        if (mass.length == 2) {
            text = 'Coord_B=' + mass[1] + '&Coord_L=' + mass[0];
            var requestUrl = {
                'requestUrl': url + GWTK.AddressGeocoding.prototype.getdelimerForUrl(url) + text + '&results=' + result + '&skip=' + skip
                    + strScale,
                'response': 'json',
                'dataType': 'jsonp'
            };
            return requestUrl;
        }
    }

    /**
    * Формирование строки запроса с сервера OSM
    * @method setrequestOsm
    * @param text {String} - трока поиска
    * @param result {Number} максимальный размер ответа (объектов)
    * @param skip {Number} число записей, которое надо пропустить
    * @return {Object}  Возвращает объект
    *       {
    *        'requestUrl' : 'Ногинск' // строка запроса,
    *        'response' : 'json',     // тип запрашиваемых данных (json, text/xml),
    *        'dataType' : 'jsonp'       // тип возвращаемых данных  (json, jsonp, text/xml)
    *       }
    */
    // ===============================================================
    GWTK.AddressGeocoding.setrequestOsm = function (url, text, result, skip, map) {
        if (!url || url == '' || !text || text == '')
            return;
        if (!result) result = 100;
        if (!skip) skip = 0;
        var requestUrl = {
            'requestUrl': url + GWTK.AddressGeocoding.prototype.getdelimerForUrl(url) + 'q=' + text + '&limit=' + result + '&format=json',
            'response': 'json',
            'dataType': 'json'
        };
        if (map && map.options.maxBounds) {
            requestUrl.requestUrl += '&bounded=1&viewbox=' + map.options.maxBounds.getWest() + ',' + map.options.maxBounds.getSouth() + ',' +
            map.options.maxBounds.getEast() + ',' + map.options.maxBounds.getNorth();
        }
        return requestUrl;
    }

    /**
     * Разбор ответа Osm
     * @method getresponsePanorama
     * @param data {Object} ответ сервера, JSON
     */
    // ===============================================================
    GWTK.AddressGeocoding.getresponseOsm = function (data) {
        var retobj = {
            geoCodes: [],
            totalCount: 0,      // всего найдено
            numberReturned: 0   // количество в возвращаемом списке
        }
        if (!data) {
            return retobj;
        }

        retobj.totalCount = retobj.numberReturned = data.length;
        for (var i = 0; i < data.length; i++) {
            var geoCode = {};
            geoCode["text"] = data[i].display_name;
            if (geoCode["text"]) {
                geoCode["BL"] = data[i].lon.toString() + " " + data[i].lat.toString();
                retobj.geoCodes.push(geoCode);
            }
        }
        return retobj;
    }

    /* Формирование строки запроса с сервера OSM для обратного геокодирования
    * @method setrequestOSMAtCoord
    * @param text {String} - строка поиска в виде 38.39874550384223,55.863501352659696 - долгота,широта
    * @param result {Number} максимальный размер ответа (объектов)
    * @param skip {Number} число записей, которое надо пропустить
    * @return {Object}  Возвращает объект
    *       {
    *        'requestUrl' : 'Ногинск' // строка запроса,
    *        'response' : 'json',     // тип запрашиваемых данных (json, text/xml),
    *        'dataType' : 'jsonp'       // тип возвращаемых данных  (json, jsonp, text/xml)
    *       }
    */
    GWTK.AddressGeocoding.setrequestOSMAtCoord = function (url, text, result, skip) {
        if (!url || url == '' || !text || text == '')
            return;
        if (!result) result = 100;
        if (!skip) skip = 0;
        // Поменяем местами координаты
        var mass = text.split(',');
        if (mass.length == 2) {
            text = mass[1] + ',' + mass[0];
            var requestUrl = {
                'requestUrl': url + GWTK.AddressGeocoding.prototype.getdelimerForUrl(url) + 'q=' + text + '&limit=' + result + '&format=json',
                'response': 'json',
                'dataType': 'json'
            };
            return requestUrl;
        }
    }


}