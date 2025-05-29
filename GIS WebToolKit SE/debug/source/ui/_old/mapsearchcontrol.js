 /********************************* Нефедьева О.А. **** 14/01/21 ****
 ********************************** Патейчук В.К.  **** 20/05/20 ****
 ********************************** Помозов Е.В.   **** 02/03/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Элемент управления "Поиск"                         *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {
    /**
     * Элемент управления Поиск
     * @class GWTK.MapSearchControl
     * @constructor GWTK.MapSearchControl
    */
    GWTK.MapSearchControl = function (map, parent) {
        this.parent = parent;                                                              // окно поиска
        this.map = map;                                                                    // карта GWTK.Map
        if (!this.map) {
            console.log("MapSearchControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        if (!this.parent) {
            console.log("MapSearchControl. " + w2utils.lang("Not defined a required parameter") + " parent.");
            return;
        }
        this.toolname = 'mapsearch';
	    this.options = {                                                                    // доступные режимы поиска
	        "semantic": { "visible": false, "selected": false },
	        "address": { "visible": false, "selected": false },
	        "rosreestr": { "visible": false, "selected": false }
	    };

        this.query = {'totalCount': 0, 'startIndex': 0, 'maxCount': 0,                      // количественные параметры запросов
            'defaultCount': 100, 'numberReturned': 0, 'status':'', 'errormessage':''  };
        this._mode = "";                                                                    // имя текущего режим поиска
        this.searchProviders = {};                                                          // экземпляры классов поиска (провайдеры)
        this._statekey = 'mapsearch_' + this.map.options.id;

        // создать кнопку управления задачей
        this.createToolbarButton();

        // добавить в карту
        this.map.maptools.push(this);

        this.init();

        return;
    };

    GWTK.MapSearchControl.prototype = {

        /**
         * Инициализация
         * @method init
         */
        init: function () {
            if (!this.map || !this.parent) {
                console.log("MapSearchControl. " + w2utils.lang("Not defined a required parameter") + " Map or Parent.");
                return;
            }
            this._text = "";

            this.setOptions();

            return;
        },

        /**
         * Установить параметры поиска - доступные режимы
         * @method setOptions
         */
        setOptions: function (param) {
            this.$toolbarButton.hide();

            if (!this.map || !this.map.options || !this.map.options.search_options) {
                return;
            }

            // Запросим куки
            this._readCookie();

            // Если есть настройки поиска
            this.options = {
                "semantic": { "visible": false, "selected": false },
                "address": { "visible": false, "selected": false },
                "rosreestr": { "visible": false, "selected": false }
            };
            var search_options = param || this.map.options.search_options;
            if (!search_options)
                return;

            this.$toolbarButton.show();
            // this.options.semantic.visible = ($.inArray("search", this.map.options.controls) >= 0 || this.map.options.controls[0] == '*') && (search_options.map.visible > 0);
            this.options.address.visible = (search_options.address && parseInt(search_options.address.visible) && search_options.address.sources && search_options.address.sources.length > 0);
            this.options.rosreestr.visible = (search_options.rosreestr && parseInt(search_options.rosreestr.visible)) && ($.inArray("rosreestr", this.map.options.controls) >= 0 || this.map.options.controls[0] == '*');

            if (search_options["default"]) {
                var options_name = search_options["default"],
                    search_default = search_options["default"];
                if (search_default == 'map') {
                    options_name = 'semantic';
                }
                if (search_options[search_default].visible > 0) {
                    this.options[options_name].selected = true;
                }
            }
            else {
                if (this.options.semantic.visible)
                    this.options.semantic.selected = true;
                else {
                    if (this.options.address.visible)
                        this.options.address.selected = true;
                    else {
                        if (this.options.rosreestr.visible)
                            this.options.rosreestr.selected = true;
                    }
                }
            }
            // Сохраним в куки
            this._writeCookie(search_options);

            this.createPane();
            return true;
        },

        /**
         * Создать панель поиска
         * @method createPane
        */
        createPane: function () {
            if (!this.parent)
                return;

            if ($(this.parent).find('.panel-textsearch-container').length > 0)
                return;

            this.setDraggable();

            this.setResizable();

            var _that = this;
            this.parent.appendChild(GWTK.Util.createHeaderForComponent({
                map: this.map,
                callback: GWTK.Util.bind(function () {_that.$toolbarButton.click();}, this),
                context: _that.toolname
            }));

            if (!this.options || !(this.options.semantic || this.options.address || this.options.rosreestr) ||
                !(this.options.semantic.visible || this.options.address.visible || this.options.rosreestr.visible)) {
                console.log("MapSearchControl. " + w2utils.lang("Search components are not defined."));
                return;
            }

            var frame = document.createElement('div');
            frame.className = "panel-textsearch-container";
            this.parent.appendChild(frame);

            // поле ввода
            var textinput = document.createElement('input');
            textinput.setAttribute('type', "text");
            textinput.setAttribute('class', 'panel-textsearch-input');
            textinput.setAttribute('name', 'inputSearchText');
            textinput.setAttribute('id', 'inputSearchText');
            textinput.value = '';
            textinput.title = w2utils.lang("Enter text");
            frame.appendChild(textinput);
            this.$textinput = $(textinput);

            var tool = this,
                sources, $eladdress, urls = [], index = 0;

            // кнопка поиск
            var img = GWTK.DomUtil.create('img', 'panel-textsearch-image-ok');
            frame.appendChild(img);
            img.src = GWTK.imgsearch;
            img.id = 'inputSearchButton';
            img.name = 'inputSearchButton';
            $(img).on("click", function (e) { tool.searchButton_click(e); });
            this.$textinput.keypress(function (event) { if (event.keyCode == 13) { $(img).click(); return false;} });

            // кнопка панели режимов поиска
            $(frame).append('<img title="' + w2utils.lang("Sources") + '" id="searchModeButton"  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABaUlEQVR42mNkQAOzZs22Y2VlbQNiXSYmJh6Q2L9//778/v37MhBXpaWlHkJWzwhjTJs2nRMI9rCxsWn//fu3FGjA0sjIiG8gueXLV3ABNUczMzN3//r16+r3799dsrIyv8MNAGnm5ua+xcjIuDMuLjaFAQ9YtGjxnP///7t//fpVDWQI2ID58xccAZp+g5BmZEOArtRITEywYQT5GWj7xujoKEFiNMPA0qXL3gNd4c8ItX0h0PbZpBgAdEUq0BXxjEuWLP0INEASFGBVVVVyIDkBAQF7bJo+fPhwEEiFtLW1vQEFLNCA54zLli3/GxUVyQxTBDREFUjtBRoii6b5MZByBmq+DRMD6cUwAGqIDRcX9z42NlZWEP/Xr9+/v3376gTUfARZHdgAZC+gGRIHdMVCqO3xQM2LkOXhXsAXiCBDQDS6ZpRAxBeNwAQGTifABPMfZzSCOBQlJKhNlCVlmCFkZyZkQGp2BgDONwMaNDjYKgAAAABJRU5ErkJggg==">');
            $("#searchModeButton").addClass('panel-textsearch-image-mode');

            // панель режимов поиска
            var radioContainer = document.createElement('div');
            radioContainer.id = 'searchModePane';
            radioContainer.style.display = 'none';
            this.parent.appendChild(radioContainer);
            this.$searchModePane = $(radioContainer);

            // Отображение/скрытие панели режимов поиска
            $(frame).find('#searchModeButton').on('click', function (e) {
                $(radioContainer).toggle(0, function (e) {
                    var $mode = $('#searchModeButton');
					if ($(radioContainer).is(':visible')) {
                        $mode.addClass('button-searchmode-active');
						$(tool.parent).height(85);
                        // Если есть список поисковых адресных сайтов
                        if ($eladdress && $eladdress.length > 0) {
                            $eladdress.w2field('list',
                                { items: urls, selected: urls[index] });
                        }
                    } else {
						$(tool.parent).height(40);
                        $mode.removeClass('button-searchmode-active');
                    }
                });
            });

            var radio = null, label = null;
            // кнопка Поиск в карте
            if (this.options.semantic.visible) {
                var statevisible = this._stateRestore(this._statekey),
                visibleflag = 'unchecked';
                if (statevisible) visibleflag = 'checked';

                $(radioContainer).append(
                    '<table width="100%" cellspacing=0 cellpadding=0><tr><td style="width:35%;"> ' +
                        '<label class="panel-textsearch-semantic">' +
                            '<input type="radio" name = "searchradio" id="radioSemanticSearch" value = "map"/>' +
                            w2utils.lang('Map search') +
                        '</label></td>' +
                '<td>' +
                        '<label style="text-align:left !important; display:block; float:left;" name="onlyvisible"><input type="checkbox" name="onlyvisible" value="yes" title="' +
                            w2utils.lang('Find visible only') + '" '+ visibleflag + '></input>' +
                            w2utils.lang('Visible') +
                    '</label>' +
                    '</td></tr></table>');
                this.$radioSemanticSearch = $('#radioSemanticSearch');
                if (this.options.semantic.selected){
                   this.$radioSemanticSearch[0].checked = true;
                   this._disableSearchForVisible(false);
                }
                else{
                    this._disableSearchForVisible(true);
                }
                this.searchProviders.semantic = new GWTK.MapTextSearch(this.map);
            }
            // кнопка Адресный поиск
            if (this.options.address.visible) {
                $(radioContainer).append(
                '<table width="100%" cellspacing=0 cellpadding=0> ' +
                '<tr>' +
                '<td style="width:35%;">' +
                    '<label style = "text-align:left !important; display:block;" class="panel-textsearch-toggler">' +
                        '<input type="radio"  name = "searchradio" id="radioAddressSearch" value = "address"/>' +
                        w2utils.lang('Address search') +
                    '</label>' +
                '</td>' +
                '<td>' +
                    '<input type="list" id="' + this.map.divID + 'addressSearch' + '" style="width: ' + 100 + '% !important;">' +
                '</td>' +
                '</tr>' +
                '<table>');

                this.$radioAddressSearch = $('#radioAddressSearch');
                if (this.options.address.selected)
                    this.$radioAddressSearch.prop("checked", true);

                sources = this.map.options.search_options.address.sources;
                $eladdress = $('#' + this.map.divID + 'addressSearch');
                if (sources && sources.length > 0) {
                    for (var i = 0; i < sources.length; i++) {
                        urls.push({ id: i, text: sources[i].alias });
                        if (i == this.map.options.search_options.address["default"]) {
                            index = i;
                        }
                    }
                    $eladdress.change(function (event) {
                        var obj = $eladdress.data('selected');
                        if (obj) {
                            index = obj.id;
                            // Сохраним куки
                            tool.map.options.search_options.address["default"] = index;
                            tool._writeCookie(tool.map.options.search_options);

                            // Смена параметров для прямого геокодирования
                            if (tool.searchProviders.address)
                                tool.searchProviders.address.setOptions(tool.map.options.search_options.address.sources[obj.id]);

                            // Смена параметров для обратного геокодирования
                            var toolreverse = tool.map.mapTool('reversegeocoding');
                            if (toolreverse) {
                                toolreverse.setOptions(tool.map.options.search_options.address.sources[obj.id]);
                            }
                        }
                    })
                    this.searchProviders.address = new GWTK.AddressGeocoding(this.map, this.map.options.search_options.address.sources[index]);
                }
            }

            // кнопка выбора поиска в Росреестре
            if (this.options.rosreestr.visible) {
                label = document.createElement('label');
                label.className = "panel-textsearch-toggler";
                radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'searchradio';
                radio.id = 'radioRossreestrSearch';
                radio.value = "rosreestr";
                if (this.options.rosreestr.selected)
                    radio.checked = true;
                label.style.display = 'block';
                label.appendChild(radio);
                label.appendChild(document.createTextNode(w2utils.lang("Search cadastral number")));
                radioContainer.appendChild(label);
                this.$radioRossreestrSearch = $(radio);

                this.searchProviders.rosreestr = { "toolname": "rosreestrsearch_out", "canCancel": 1 };
            }

            // изменение типа поиска
            $('input[type=radio][name=searchradio]').change(function (event) {
                // Сохраним куки
                tool.map.options.search_options["default"] = this.value;
                tool._writeCookie(tool.map.options.search_options);
                // доступность выбора поиска видимых (только для поиска в карте)
                if (event && event.target){
                    if (event.target.id == 'radioSemanticSearch'){
                        tool._disableSearchForVisible(false);
                    }
                    else{
                        tool._disableSearchForVisible(true);
                    }
                }
            });

            $("input[name='onlyvisible']").on('change', this._stateSave.bind(this));

            return;
        },

        /**
         * Недоступность кнопки Только видимые
         * @method _disableSearchForVisible
         * @param flag {Boolean} `true` - кнопка недоступна
        */
       _disableSearchForVisible: function(flag){
            if (typeof flag !== 'boolean') return;
            $("input[name='onlyvisible']")[0].disabled = flag;
        },

        /**
         * Получить значение флага Только видимые
         * @method getSearchForVisible
         * @returns {Boolean} `true` - включен
        */
        getSearchForVisible: function(){
            var checkbox = this.$searchModePane.find("input[name='onlyvisible']");
            if (checkbox.length > 0) {
                return checkbox[0].checked;
            }
            return false;
        },

        /**
         * Установить режим поиска
         * @param mode{String} - значение режима, возможные значения ('address' || 'rosreestr' || 'semantic')
         * @returns {boolean}
         */
        setActiveSearchMode: function (mode) {
            if (mode == 'address') {
                if (this.$radioAddressSearch) {
                    this.$radioAddressSearch.prop('checked', true);
                    return true;
                }
            }
            if (mode == 'rosreestr') {
                if (this.$radioRossreestrSearch) {
                    this.$radioRossreestrSearch.prop('checked', true);
                    return true;
                }
            }
            if (mode == 'semantic') {
                if (this.$radioSemanticSearch) {
                    this.$radioSemanticSearch.prop('checked', true);
                    return true;
                }
            }

        },

        /**
         * Создать кнопку вызова панели
         * @method createToolbarButton
        */
        createToolbarButton: function () {
            if (!this.map) {
                console.log("MapSearchControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
                return;
            }
            var bt = GWTK.DomUtil.create('div', 'control-button control-button-search clickable', this.map.panes.toolbarPane);
            bt.id = 'panel_button_search';
            bt.title = w2utils.lang('Search');
            bt._pane = this.parent.id;

            this.$toolbarButton = $(bt);
            this.$toolbarButton.on("click", function (e) {
                if (!this.map) { return; }
                this.map.handlers.toolbar_button_click(e);
                if (this.$toolbarButton.hasClass('control-button-active')){
                    this.map.showControlsPanel();
                }
            }.bind(this));
        },

        /**
         * Настроить обработчики событий
         * @method initEvents
         */
        initEvents: function () {
            var tool = this;
            $(this.map.eventPane).on('visibilitychanged.mapsearch', function () {
                tool.checkMode();
            });
            $(this.map.eventPane).on('layerlistchanged.mapsearch', function () {
                tool.checkMode();
            });
            $(this.map.eventPane).on('continuesearch.mapsearch', function (event) {
                tool.continueSearch(event);
            });
            $(radioContainer).on('click', function(event){if (event && event.target){var id = event.target.id; }}.bind(this));

            // обработка изменений размера панели контролов
			$(this.map.eventPane).on('resizecontrolspanel.' + this.toolname, function (event) {
				// изменить размеры своей панели
				this.resize();
			}.bind(this));
        },

        /**
         * Настроить кнопки режимов поиска
         * @method checkCondition
         */
        checkMode: function () {

            if (!this.$textinput) {
                this.$textinput = $('#inputSearchText');
            }
            if (this.$textinput.length == 0) { return; }

            if (this.map.tiles.getTextSearchLayers().length == 0) {
                this.$radioSemanticSearch[0].disabled = true;
                if (this.$radioSemanticSearch[0].checked) {
                    this.$textinput[0].disabled = true;
                }
                else this.$textinput[0].disabled = false;
            }
            else {
                this.$radioSemanticSearch[0].disabled = false;
                this.$textinput[0].disabled = false;
            }
            return;
        },

        /**
         * Запросить имя текущего режима поиска
         * @method getSearchMode
         * @return {String} 'semantic' или 'address' или 'rosreestr' или '' при ошибке
         */
        getSearchMode: function () {
            if (this.$radioSemanticSearch && this.$radioSemanticSearch.length > 0) {
                if (this.$radioSemanticSearch[0].checked) { return 'semantic'; }
            }
            if (this.$radioAddressSearch && this.$radioAddressSearch.length > 0) {
                if (this.$radioAddressSearch[0].checked) { return 'address'; }
            }
            if (this.$radioRossreestrSearch && this.$radioRossreestrSearch.length > 0) {
                if (this.$radioRossreestrSearch[0].checked) { return 'rosreestr'; }
            }
            return "";
        },

        /**
         * Инициализировать параметры запроса
         * @method initQuery
         */
        initQuery: function () {
            this.query.startIndex = 0;
            this.query.totalCount = 0;
            this.query.maxCount = 0;
            this.query.numberReturned = 0;
            this.query.status = '';
            this.query.errormessage = '';
            this.query.visibleflag = 0;
            return;
        },

        /**
         * Выполнить поиск
         * @method searchButton_click
        */
        searchButton_click: function () {

            var text = this.$textinput.val();
            if (!text || text.length == 0) { return; }

            // выбранный режим поиска
            var new_mode = this.getSearchMode();
            if (new_mode == "" || !this.searchProviders || !this.searchProviders[new_mode]) {
                console.log("GWTK.MapSearchControl. " + w2utils.lang("Runtime error"));
                return;
            }

            this._mode = new_mode;

            this.initQuery();

            this.query.text = this._text = text;

            this.query.mode = this._mode;

            this.query.visibleflag = this.getSearchForVisible();

            this.maxCount = 3;

            this.map.handlers.clearselect_button_click();

            if ($.isFunction(this.searchProviders[this._mode].search)) {
                this.$textinput.addClass('processing');
                this.searchProviders[this._mode].search(text, this.query, GWTK.Util.bind(this.parseResponse, this));

            }
            else if (this.query.mode == "rosreestr") {
                $(this.map.eventPane).trigger({ 'type': 'searchrosreestr', "text": text });
            }

        },

        /**
         * Выполнить анализ ответа
         * @method parseResponse
         * @param response {Object} ответ сервера
         * @param context {Object} контекст поиска ( копия this.query )
        */
        parseResponse: function (response, context) {
            this.$textinput.removeClass('processing');

            if (!$.isArray(response || !context || !context.mode)) {
                // Ошибка выполнения запроса
                this.showMessage(w2utils.lang("Failed to get data"));
                return;
            }

            // результат поиска в карте
            if (context.mode == "semantic" && (response[0] instanceof XMLDocument)) {     // ответ поиска в карте по семантике
                if (context.status == 'cancelled') { return; }
                if (context.status == 'error') {
                    this.showMessage(context.errormessage);
                    return;
                }
                var node = response[0].documentElement.nodeName.toLowerCase();
                if (node.indexOf("searchreport") > -1) {

                    if (this.query.mode == context.mode && this.query.text == context.text) {
                        $.extend(this.query, context);            // обновляем контекст запроса
                    }
                    //if (context.totalCount > 0) {
                    //    return;
                    //}
                    if (this.map.selectedObjects.mapobjects.length > 0)
                        return;
                }
                var message = w2utils.lang("Nothing found. Refine your search.");
                if (context && context.errormessage) {
                    message = context.errormessage;
                }
                this.showMessage(message, w2utils.lang('Map search'));
                return;
            }
            // результат адресного поиска
            if (context.mode && context.mode == "address") {
                if (context.status == 'cancelled') { return; }
                if (context.status == 'error') {
                    this.showMessage(context.errormessage);
                    return;
                }
                if (this.query.mode == context.mode && this.query.text == context.text) {
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
            }
            return;
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
        * Продолжить поиск
        * @method continueSearch
        * @param event {Object} объект события
        */
        continueSearch: function (event) {

            if (this._mode == "rosreestr") { return; }

            if (!event || event.searchindex == undefined || isNaN(event.searchindex)) {
                return;
            }
            var startIndex = parseInt(event.searchindex);
            var text = this.$textinput.val();
            if (!text || text.length == 0 || text != this.query.text) {
                return;
            }

            this.query.startIndex = startIndex;
            this.query.status = '';
            this.query.errormessage = '';

            if ($.isFunction(this.searchProviders[this._mode].search)) {
                this.searchProviders[this._mode].search(text, this.query, GWTK.Util.bind(this.parseResponse, this));
            }

        },

        /**
         * Деструктор
         *
         * @method destroy
        */
        destroy: function () {

            this.searchProviders = [];
            GWTK.cookie('mapsearch', '', { expires: 0, path: '/' });

            $(this.map.eventPane).off('visibilitychanged.mapsearch');
            $(this.map.eventPane).off('layerlistchanged.mapsearch');
            $(this.map.eventPane).off('continuesearch.mapsearch');

            $(this.parent).find('.panel-textsearch-image-ok').off();
            $(this.parent).find('#searchModeButton').off();
            $('input[type=radio][name=searchradio]').unbind();
            $('#' + this.map.divID + 'addressSearch').unbind();

            if ($(this.parent).is('.ui-draggable'))
                $(this.parent).draggable('destroy');
            $(this.parent).resizable('destroy');

            $(this.parent).empty();

            this.$toolbarButton.off();
            this.$toolbarButton.remove();
        },

        /**
         * Сохранить в куки параметры поиска
         *
         * @method _writeCookie
         * @param flag {Boolean} Флаг того, что окно редактора перемещалось
         */
        _writeCookie: function (search_options) {
            var value = ['default=' + search_options["default"],
                         //'mapvisible=' + search_options.map.visible,
                         //'rosreestrvisible=' + search_options.rosreestr.visible,
                         //'addressvisible=' + search_options.address.visible,
                         'addressdefault=' + search_options.address["default"]
            ];
            value = value.join('&');
            GWTK.cookie('mapsearch', value, { expires: 5, path: '/' });
        },

        /**
         * Прочитать куки параметров поиска
         *
         * @method _readCookie
         */
        _readCookie: function () {
            if (!this.map || !this.map.options || !this.map.options.search_options)
                return;

            var param = GWTK.cookie("mapsearch", GWTK.cookies.converter);
            if (!param) return;

            var _that = this;
            $.each(param, function (index, value) {
                var key = value.shift();
                var key_value = value.length > 0 ? value.shift() : '';
                switch (key) {
                    case 'default':
                        _that.map.options.search_options["default"] = key_value;
                        break;
                    case 'addressdefault':
                        _that.map.options.search_options.address["default"] = key_value;
                        break;
                }
            });
        },

        /**
		 * Сделать панель перемещаемой
         */
		setDraggable: function () {
            if (!this.map || this.map.options.controlspanel)  // при наличии боковой панели перемещения нет
                return;
            GWTK.panelUI({ draggable: true, $element: $(this.parent), resizable: false });
        },

        /**
		 * Сделать панель растягиваемой
         */
        setResizable: function () {
            var control = this;
            $(this.parent).resizable({
                handles: 'w',
                resize: function (event, ui) {
                    ui.position.left = ui.originalPosition.left;
                    control.resize();
					
					GWTK.Util.fixJqueryResizablePluginFF({
						before: {
							width: ui.originalSize.width,
							height: ui.originalSize.height
						},
						after: {
							width: ui.size.width,
							height: ui.size.height
						}
					});
                },
                minWidth: 400
            });
        },

        /**
		 * Обработка изменения размера панели
         * @method resize
		 */
		resize: function () {
            $('#inputSearchText').width($(parent).width() - 40);
        },

        /**
         * Сохранить состояние
         * @method _stateSave
         */
        _stateSave: function(){
            GWTK.Util.stateSaveStorage(this._statekey, this.getSearchForVisible());
        },

        /**
         * Восстановить состояние
         * @method _stateSave
         */
        _stateRestore: function(key) {
            var _value = GWTK.Util.stateRestoreStorage(key);
            if (typeof _value !== 'boolean') _value = false;
            return _value;
        }

    };

}
