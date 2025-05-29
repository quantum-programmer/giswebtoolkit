/************************************** Соколова Т.О.  17/05/21 ****
*************************************** Нефедьева О.А. 17/10/19 ****
*************************************** Патейчук В.К.  20/05/20 ****
*************************************** Помозов Е.В.   12/03/21 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                      Компонент "Росреестр"                       *
*        (Сведения государственного кадастра недвижимости)         *
*                                                                  *
*******************************************************************/
if (window.GWTK) {

    /**
     * Компонент Сведения государственного кадастра недвижимости
     * @class GWTK.rosreestr
     * @constructor GWTK.rosreestr
     * @param map {GWTK.Map} ссылка на карту
     */
    GWTK.rosreestr = function (map) {

        this.map = null;
        this.panel = null;

        if (!map) return;
        this.map = map;

        this.initRes();

        this.rosreestrControl = null;

        this.toolname = "rosreestr";

        // this.url = "https://pkk5.rosreestr.ru/api/features/";
        this.url = "https://pkk.rosreestr.ru/api/features/";
        this.parts = [];
        this.okss = [];
        this.textSearch = '';

        this.id = 'rr' + GWTK.Util.randomInt(60000, 70000).toString();     // уникальный идентификатор объекта

        this.onSetAction = GWTK.Util.bind(this.onSetAction, this);

        this.initialize();
    }

    GWTK.rosreestr.prototype = {
        initialize: function () {
            if (this.map instanceof GWTK.Map == false) return this;

            if (this.map.panes != null && this.map.panes.toolbarPane != null) {
                var bt = GWTK.DomUtil.create('div', 'control-button control-button-maprosreestr clickable', this.map.panes.toolbarPane);
                bt.id = 'panel_button-mapRosreestr';
                bt.disabled = false;
                bt.title = this.res_mapRosreestr_button;
                bt._pane = 'rosreestr1';

                this.map.maptools.push(this);

                $('#panel_button-mapRosreestr').click(GWTK.Util.bind(function (event) {

                    if ($(event.currentTarget).hasClass('control-button-active')) {
                        $(event.currentTarget).removeClass('control-button-active');
                        this.destroy();
                    }
                    else {

                        // Старт нового обработчика
                        $(this.map.eventPane).on('setaction', this.onSetAction);

                        // Запустим обработчик
                        this.action = new GWTK.MapeditorRosreestrAction(null, "rosreestr", this.map);
                        if (!this.map.setAction(this.action)) {
                            this.action.close();
                            this.action = null;
                        }
                        else {
                            $(event.currentTarget).addClass('control-button-active');
                            // развернуть общую панель для компонентов (если используется)
                            this.map.showControlsPanel();

                            if (this.point) {
                                this.rosreestrControl = new GWTK.rosreestrControl('1', this.map, this.map.mapPaneOld, this.point.x, this.point.y);
                            }
                            else {
                                this.rosreestrControl = new GWTK.rosreestrControl('1', this.map, this.map.mapPaneold);
                            }

                            if (this.textSearch) {
                                this.rosreestrControl.setTextSearch(this.textSearch);
                            }
                            GWTK.DomUtil.removeActiveElement(".button-action");
                        }
                    }

                    this.map._writeCookiePanels();

                }, this));

                $(this.map.eventPane).on("searchrosreestr", GWTK.Util.bind(function (event) {                               // 06/02/2017 Нефедьева
                    if (!event || !event.text) { return; }
                    this.setPoint();
                    if (this.rosreestrControl) {
                        this.rosreestrControl.setTextSearch(event.text);
                    }
                    this.setRequestPoint(event.text);
                }, this));

                $(document).ready(function () {
                    GWTK.rosreestr.prototype._readCookie();
                });

            }

            return this;
        },

        initRes: function () {
            // Название кнопки режима
            this.res_mapRosreestr_button = w2utils.lang("The information state real estate cadastre");//'Сведения государственного кадастра недвижимости';
        },

        destroy: function () {

            // Закроем Action
            if (this.action) {
                this.map.closeAction();
                this.action = null
            }

            // удалить панели маршрута
            if (this.rosreestrControl != null && this.rosreestrControl != undefined) {
                this.rosreestrControl.destroy();
                this.rosreestrControl = null;
            }

            // Удалить созданные панели
            if (this.map == null || this.map.mapPaneOld == null)
                return;
            if (this.panel != null){
                GWTK.routeUtil.removeAllChild(this.panel);
                this.map.mapPaneOld.removeChild(this.panel);
            }
            this.panel = null;

            // Удалим маркеры
            this.map.placemarkRemove(this.id);

            // Отмена обработчика
            $(this.map.eventPane).off('setaction', this.onSetAction);

        },

        _readCookie: function () {
            var param = GWTK.cookie("VisiblePanels", GWTK.cookies.converter);
            if (param === undefined) return;

            $.each(param, function (index, value) {
                var key = value.shift();
                var key_value = value.length > 0 ? value.shift() : '';
                key_value = key_value.split(',');
                if (key == 'panel_button-rosreestr') {
                    button = $('#' + key);
                    panel = button[0]._pane;
                    if (key_value[0] == 'show') {
                        $('#panel_button-rosreestr').click();
                    }
                }
            });
            return;
        },

        sendRequest: function (url, fn_load, type, ispoint) {
            var tool = this;
            if (window.XDomainRequest) {
                try {
                    req = new XDomainRequest();
                    req.timeout = 60000;
                    req.open("get", url, false);
                    req.onload = function (response) {
                        var data = req.responseText;
                        return fn_load(data, type, ispoint);
                    }
                    req.send(null);
                } catch (e) { }
            }
            else {
                try {
                    $.ajax({
                        url: url,
                        // headers: {
                        //     "Access-Control-Allow-Origin": "*'"
                        //     "Referer":"https://pkk5.rosreestr.ru",
                        // },
                        // data: {},
                        success: function (data, textStatus) {
                            if (textStatus != null && textStatus == "success") {
                                var rc = fn_load(tool, data, type, ispoint);
                                if (!rc) {
                                    if (type) {

                                        if (!tool.rosreestrControl) {
                                            $('#panel_button-mapRosreestr').click();
                                         }
                                        tool.rosreestrControl.cleartab();
                                        var activetab = tool.rosreestrControl.activetab;
                                        switch (type.toString()) {
                                            case '5': // ОКС
                                                activetab = tool.rosreestrControl.prefixtab + '1';
                                                break;
                                            case '1': // участки
                                                activetab = tool.rosreestrControl.prefixtab + '2';
                                                break;
                                            case '2':  // квартал
                                                activetab = tool.rosreestrControl.prefixtab + '3';
                                                break;
                                            case '3':  // район
                                                activetab = tool.rosreestrControl.prefixtab + '4';
                                                break;
                                        }
                                        if (tool.newsearch || activetab != tool.rosreestrControl.activetab) {
                                            w2ui['rosreestr_tabs'].active = activetab;
                                            w2ui['rosreestr_tabs'].refresh();
                                            w2ui['rosreestr_tabs'].click(activetab);
                                        }
                                    }
                                }
                            }
                            tool.newsearch = false;
                        },
                        dataType: 'text'
                    });
                }
                catch (e) {
                }
            }
        },


        // Послать запрос на поиск
        setRequestPoint: function (text) {
            // Определим, что ищем
            var cadnum = text.split(':');
            if (!cadnum|| cadnum.length == 0)
                return;
            var count = cadnum.length;
            var type;
            switch (count) {
                case 1:
                    type = 4;
                    break;
                case 2:
                    if (cadnum[1] == '')
                        type = 4;
                    else
                        type = 3;
                    break;
                case 3:
                    if (cadnum[2] == '')
                        type = 3;
                    else
                        type = 2;
                    break;
                case 4:  // Участок или ОКС
                    if (cadnum[3] == '')
                        type = 1;
                    else
                        type = 5; // или 1
                    break;
                default:
                    type = 5; // или 1
                    break;
            }

            this.textSearch = this.setIdByText(text);
            if (this.rosreestrControl) {
                this.rosreestrControl.cleartab();
            }
            if (this.textSearch) {
                var url = this.url + type + "/" + this.textSearch;
                this.sendRequest(url, this.loadDataPoint, type);
            } else {
                alert(w2utils.lang('Error in search value format!'));
            }
        },


        loadDataPoint: function (tool, data, type, ispoint) {

            if (!data || !tool) return;

            var obj = $.parseJSON(data);
            if (!obj || !obj.feature) {
                return;
            }

            var w2ui_el = w2ui['rosreestr_tabs'];
            if (w2ui_el) {
                w2ui_el.obj = null;
                w2ui_el.objtype = null;
            }
            var feature = obj.feature, geo, name;
            if (feature && feature.attrs && feature.center) {
                geo = GWTK.toLatLng(GWTK.projection.xy2geo3857(feature.center.y, feature.center.x));
                tool.setPoint(geo.lat, geo.lng, feature.center);
                if (!tool.rosreestrControl) {
                    $('#panel_button-mapRosreestr').click();
                    w2ui_el = w2ui['rosreestr_tabs'];
                }

                id = 'tab_' + feature.type.toString();
                if (w2ui_el && !ispoint) {
                    w2ui_el.obj = {features: []};
                    w2ui_el.obj.features.push(obj.feature);
                    w2ui_el.objtype = type;
                    w2ui_el.click(id);
                }

                return true;
            }
        },


        // Установить точкy
        setPoint: function (x, y, center) {

            // очистим участки
            this.parts.splice(0, this.parts.length);
            this.okss.splice(0, this.okss.length);

            // Установим координаты точки
            if (!x || !y) {
                this.point = null;
                this.newsearch = true;
                return;
            }

            this.point = new GWTK.Point(x, y);
            // Очистить строку поиска
            $('#inputrosreestrSearchText').val('');
            this.setCenter(center);
        },

        // Установить центр
        setCenter: function(center) {
            this.center = center;
            this.map.placemarkRemove(this.id);
        },

        // Запрос
        // type 1 - участок, 2 - квартал, 3 - район, 4 - округ, 5 - окс
        setRequest: function (type, point) {
            if (type <= 0 || type > 5)
                return;
            var text = '', ispoint = false;
            if (point){
                text = point.x.toString() + "," + point.y.toString();
                ispoint = true;
            }
            else {
                if (this.textSearch){
                    text = this.textSearch;
                }
            }
            // var url = this.url + type.toString() + "?text=" + point.x.toString() + "," + point.y.toString() + '&tolerance=1&limit=11' ;  // Добавлено для запроса по координатам

            if (text) {
                var url = this.url + type.toString() + "?text=" + text + '&tolerance=1&limit=11';  // Добавлено для запроса по координатам
                this.sendRequest(url, this.loadData, type, ispoint);
            } else {
                alert(w2utils.lang('Error in search value format!'));
            }
        },

        loadData: function (tool, data, type) {
            tool.map.placemarkRemove(tool.id);

            if (!data || !tool) return;

            var obj = $.parseJSON(data);
            if (!obj || !obj.features || obj.features.length == 0) {
                return;
            }

            if (!tool.rosreestrControl) {
                $('#panel_button-mapRosreestr').click();
            }

            tool.rosreestrControl.loadData(obj, type);
            return true;
        },

        //setcadnumByText: function(text, type){
        //    var cadnum = text.split(':');
        //    if (cadnum == undefined || cadnum == null || cadnum.length == 0)
        //        return;
        //    var newcadnum = '';
        //    for (var i = 0; i < cadnum.length; i++) {
        //        if (cadnum[i] == '') continue;
        //        if (newcadnum == '')
        //            newcadnum += cadnum[i];
        //        else {
        //            if (type && (type == 4 || type == 3 || type == 2)) // кварталы или районы
        //                newcadnum += cadnum[i];
        //            else
        //                newcadnum += '%3A' + cadnum[i];
        //        }
        //    }

        //    return newcadnum;
        //},

        setIdByText: function (text, type) {
            var cadnum = text.split(':');
            if (!cadnum || cadnum.length == 0)
                return;
            var newcadnum = '';
            for (var i = 0; i < cadnum.length; i++) {
                //if (cadnum[i] == '') continue;
                cadnum[i] = parseInt(cadnum[i]);
                if (isNaN(cadnum[i])) {
                    cadnum[i] = '';
                    continue;
                }
                if (newcadnum == '')
                    newcadnum += cadnum[i];
                else {
                    if (type && (type == 4 || type == 3 || type == 2)) // кварталы или районы
                        newcadnum += cadnum[i];
                    else
                        newcadnum += ':' + cadnum[i];
                }
            }

            return newcadnum;
        },

        // Запрос
        // index - индекс в массиве
        setRequest_cadnum: function (newcadnum, type) {

            var url = this.url + type + "/" + newcadnum;

            var _rosreestr = this;
            if (window.XDomainRequest) {
                try {
                    req = new XDomainRequest();
                    req.timeout = 60000;
                    req.open("get", url, false);
                    req.onload = function (response) {
                        var data = req.responseText;
                        return _rosreestr.loadData_cadnum(_rosreestr, data, type);
                    }
                    req.send(null);
                } catch (e) { }
            }
            else {
                try {
                    $.get(url,
                    function (data, textStatus) {
                        if (textStatus != null && textStatus == "success")
                            return _rosreestr.loadData_cadnum(_rosreestr, data, type);
                    }, "text");
                } catch (e) { }
            }

        },


        loadData_cadnum: function (tool, data, type) {
            if (!data || !tool) return;

            var obj = $.parseJSON(data);
            if (!obj || !obj.feature) {
                return;
            }
            type = parseInt(type);
            var feature = obj.feature;
            var info = '';

            if (feature.attrs.cn)
                info += 'Кадастровый номер: ' + feature.attrs.cn + '</br>';
            if (feature.attrs.address)
                info += 'Адрес: ' + feature.attrs.address + '</br>';
            if (feature.attrs.area_value)
                info += 'Уточненная площадь: ' + feature.attrs.area_value + '</br>';
            if (feature.attrs.cad_cost)
                info += 'Кадастровая стоимость: ' + feature.attrs.cad_cost + '</br>';
            //if (feature.attrs.FORM_RIGHTS != null)
            //    info += 'Форма собственности: ' + feature.attrs.FORM_RIGHTS + '</br>';
            //else
            //    info += 'Форма собственности: не определена' + '</br>';

            if (feature.attrs.statecd) {
                info += 'Статус участка: ';
                switch (feature.attrs.statecd) {
                    case "01":
                        info += 'Ранее учтеный';
                        break;
                    case "03":
                        info += 'Условный';
                        break;
                    case "04":
                        info += 'Внесенный';
                        break;
                    case "05":
                        info += 'Временный (Удостоверен)';
                        break;
                    case "06":
                        info += 'Зарегистрирован (Учтеный)';
                        break;
                    case "07":
                        info += 'Снят с учета';
                        break;
                    case "08":
                        info += 'Аннулированный';
                        break;
                    case "00":
                        info += 'Неопределено';
                        break;
                }
            }

            info += '</br>';
            if (feature.attrs.date_create)
                info += 'Дата создания: ' + feature.attrs.date_create + '</br>';
            if (feature.attrs.adate) {
                if (type == 5)
                    info += 'Дата обновления: ' + feature.attrs.adate + '</br>';
                else
                    info += 'Дата обновления границ участка на ПКК: ' + feature.attrs.adate + '</br>';
            }
            if (feature.attrs.category_type)
                info += 'Категория (код): ' + feature.attrs.category_type + '</br>';
            info += 'Разрешенное использование: ' + '</br>';
            if (feature.attrs.util_code)
                info += 'По классификатору (код): ' + feature.attrs.util_code + '</br>';
            if (feature.attrs.util_by_doc)
                info += 'По документу: ' + feature.attrs.util_by_doc + '</br>';

            if (type == 5 || feature.type == 5) {
                info += '</br>';
                if (feature.attrs.floors != null)
                    info += 'Этажей: ' + feature.attrs.floors + '</br>';
                if (feature.attrs.underground_floors != null)
                    info += 'Подземных этажей: ' + feature.attrs.underground_floors + '</br>';
                if (feature.attrs.year_used != null)
                    info += 'Год ввода в эксплуатацию: ' + feature.attrs.year_used + '</br>';
                if (feature.attrs.year_built != null)
                    info += 'Завершение строительства: ' + feature.attrs.year_built + '</br>';
            }

            if (!tool.rosreestrControl) {
                $('#panel_button-mapRosreestr').click();
            }

            $('#rosreestr_info').html(info);
            return true;
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
            // Если стартовал не наш обработчик, то закрыть  задачy
            if (this.action && this.action.name != event.action.name) {
                this.action = null;
                // Закрыть окно
                $('#panel_button-mapRosreestr').click();
            }

        }

    }

    // Компонент отображения сведений государственного кадастра недвижимости
    // id - уникальный идентификатор
    // parentdiv - область размещения компонента
    // mapdiv - панель объекта карты (Map)
    // x, y - координаты точки в метрах в системе EPSG:3857 (Меркатора на шаре, принятой в Google)
    // active -  0,1,2,3,4
    // 0 - объекты капитального строительства
    // 1 - участки
    // 2 - кварталы
    // 3 - районы
    // 4 - округа
     GWTK.rosreestrControl = function (id, map, parentdiv, x, y, active) {
        if (!id || !map) return;
        this.id = id;
        this.map = map;

        this.tool = this.map.mapTool("rosreestr");
        if (!this.tool || !(this.tool instanceof GWTK.rosreestr) )
            return;

        this.parentstr = 'rosreestr_' + id;
        if (parentdiv != null && parentdiv != undefined)
            this.parentdiv = parentdiv;

        this.prefixtab = 'tab_';
        this.initActiveTab(active);

        this.initRes();

        this.tool.point = null; // Выбранная точка
        if (x != undefined && x != null && y != undefined && y != null)
            this.tool.point = new GWTK.Point(x, y);

        this.onTextSearch = GWTK.Util.bind(this.onTextSearch, this);
        this.onClickObject = GWTK.Util.bind(this.onClickObject, this);

        this.initialize();
    }

    GWTK.rosreestrControl.prototype = {
        initActiveTab: function(active){
            active = (active) ? active : this.prefixtab + '5';
            this.activetab = active;
        },

        initialize: function () {
            if (this.parentdiv == undefined || this.parentdiv == null)
                return this;

            // если указана панель для компонентов, то создаем в ней
            if (this.map.options.controlspanel) {
                this.parentdiv = this.map.mapControls;
                this.panel = GWTK.DomUtil.create('div', 'map-panel-def-flex mapRosreestr-panel-flex', this.map.mapControls);
                var mapeditPane = $(this.parentdiv).find('.editor-panel-flex');
                if (mapeditPane.length > 0) {
                     $(mapeditPane).before($(this.panel));
                }
            } else {
                this.panel = GWTK.DomUtil.create('div', 'map-panel-def mapRosreestr-panel', this.parentdiv);
            }

            this.panel.id = this.parentstr;

            // если не указана панель для компонентов, то доступно перетаскивание
            if(!this.map.options.controlspanel) {
                this.setDraggable();
            }

            this.setResizable();

            this.panel.appendChild(GWTK.Util.createHeaderForComponent({
                map: this.map,
                context: "rosreestr",
                name: this.res_mapRosreestr_button,
                callback: GWTK.Util.bind(function () {
                    $('#panel_button-mapRosreestr').click();
                    this.destroy();
                }, this)
            }));

            $(this.panel).append(
                '<div class="divFlex divFlexColumn" style="width: 100%; height: 100%">' +
                     '<div class="panel-textsearch-container" >' +
                        '<input type="text" class="panel-textsearch-input-rosreestr" id="inputrosreestrSearchText" title="Ввести поисковый запрос" >' +
                        '<span class="panel-textsearch-image-ok-rosreestr" id="inputrosreestrSearchButton"></span>' +
                     '</div>' +
                     '<div class="divFlex divFlexColumn">' +
                        '<div id="rosreestr_tabs" style="height: 35px;"></div>' +
                        '<div class="divFlex divFlexColumn" id="rosreestr_selected-tab" style="padding: 10px 10px;">' +
                            '<div id="rosreestr_name" class="routeFilesName"> </div>' +
                            '<div id="rosreestr_info"  style="white-space: break-spaces; overflow-y: auto;"> </div>' +
                        '</div>'+
                     '</div>'+
                '</div>'
            );

            var _rosreestrControl = this;
            $(document).ready(function () {
                $('#inputrosreestrSearchButton').on('click', _rosreestrControl.onTextSearch);
                $('#inputrosreestrSearchText').keypress(function (event) {
                    if (event.keyCode == 13) {
                        $('#inputrosreestrSearchButton').click();
                    }
                });
                $('#rosreestr_tabs').w2tabs({
                    name: 'rosreestr_tabs',
                    style: 'background-color: transparent;',
                    active: _rosreestrControl.activetab,
                    tabs: [
                        { id: _rosreestrControl.prefixtab + '4', caption: _rosreestrControl.res_mapRosreestr_tab4 },
                        { id: _rosreestrControl.prefixtab + '3', caption: _rosreestrControl.res_mapRosreestr_tab3 },
                        { id: _rosreestrControl.prefixtab + '2', caption: _rosreestrControl.res_mapRosreestr_tab2 },
                        { id: _rosreestrControl.prefixtab + '1', caption: _rosreestrControl.res_mapRosreestr_tab1 },
                        { id: _rosreestrControl.prefixtab + '5', caption: _rosreestrControl.res_mapRosreestr_tab0 }
                    ],

                    onClick: function (event) {
                        if (event.target != _rosreestrControl.activetab) {
                            _rosreestrControl.cleartab();
                        }

                        _rosreestrControl.activetab = event.target;

                        var active = event.target.split('_'), type;
                        if (active && active.length >= 2) {
                            type = active[1];
                         }

                        // Если есть данные
                        if (this.obj && this.objtype == type ) {
                            _rosreestrControl.loadData(this.obj, type);
                        }
                        else {
                            _rosreestrControl.onclick(event.target);
                            _rosreestrControl.eventChangeTab(type);
                        }

                        // Изменить отступы, а то не влезают заголовки
                        $('#rosreestr_tabs table .w2ui-tab').css('padding-left', 15);
                        $('#rosreestr_tabs table .w2ui-tab').css('padding-right', 15);

                        return false;
                    }
                });


            });

            // обработка изменений размера панели контролов
			$(this.map.eventPane).on('resizecontrolspanel.' + this.toolname, function (event) {
				// изменить размеры своей панели
				this.resize();
            }.bind(this));

            return this;
        },

        /**
         * Установить возможность перемещения панели
         */
        setDraggable: function () {
            if (!this.map)
                return;
            GWTK.panelUI({ draggable: true, $element: $(this.panel), resizable: false });
        },

        /**
		 * Установить возможность изменения размера панели
		 */
        setResizable: function () {
            var that = this;
            $(this.panel).resizable({
                handles: 's,w,sw',
                resize: function (event, ui) {
                    ui.position.left = ui.originalPosition.left;
                    that.resize();
					
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
                create: function () {
                    $(this).parent().on('resize', function (e) {
                        e.stopPropagation();
                    });
                }
            });
        },

        /**
		 * Изменить размер дочерних элементов по размеру панели
		 */
        resize: function () {
            $('#' + this.parentstr).height('auto');
        },

        /**
         * Заполнить строку поиска
         * @param text
         */
        setTextSearch: function(text){
            $('#inputrosreestrSearchText').val(text);
        },

        onTextSearch: function () {
            var tool = this.map.mapTool("rosreestr");
            if (!tool || !(tool instanceof GWTK.rosreestr)) return;
            tool.setPoint();
            tool.map.placemarkRemove(tool.id);

            var text = $('#inputrosreestrSearchText').val();
            if (!text || text == '') {
                alert(w2utils.lang('Search criteria are not specified!'));
                return;
            }

            tool.newsearch = true;
            tool.setRequestPoint(text);
        },

        getFeatureInfo: function (point) {
            return false;
        },

        // Запросить идентификатор активной закладки
        getActivetabId: function () {
            if (w2ui.tabs == undefined || w2ui.tabs == null)
                return;
            return w2ui.tabs.active;
        },

        // Отобразить/скрыть окно
        show: function (show) {
            if (show) {
                $('#' + this.parentstr).show();
                // развернуть общую панель для компонентов (если используется)
                this.map.showControlsPanel();
            }
            else
                $('#' + this.parentstr).hide('slow');
        },

        onclick: function (active) {
            var type = active.split('_');
            if (!type || type.length < 2)
                return;
          //  if (this.tool.point) {
                w2ui['rosreestr_tabs'].active = active;
                w2ui['rosreestr_tabs'].refresh();
                this.tool.setRequest(type[1], this.tool.point);
           // }
        },

        destroy: function () {

            var t = $('#rosreestr_tabs');
            if (t != null && t.length > 0)
                w2ui['rosreestr_tabs'].destroy();
            $('#' + this.parentstr).remove();

        },

        cleartab: function () {
            $('#rosreestr_name').html('');
            $('#rosreestr_info').html('');
        },

        initRes: function () {
            this.res_mapRosreestr_tab4 = w2utils.lang('County');//'Округ';
            this.res_mapRosreestr_tab3 = w2utils.lang('Region');//'Район';
            this.res_mapRosreestr_tab2 = w2utils.lang('Quarter');//'Квартал';
            this.res_mapRosreestr_tab1 = w2utils.lang('Sector');//'Участок';
            this.res_mapRosreestr_tab0 = w2utils.lang('OCC');//'ОКС';
            this.res_mapRosreestr_button = w2utils.lang('The information state real estate cadastre');//'Сведения государственного кадастра недвижимости';
        },


        loadData: function (obj, type) {
            var name = '', info = '', names = '', param, geo;
            var tool = this.tool;

            this.objectsInfo = [];
            this.objectsInfo[type] = [];

            switch (type) {
                case '3':  // район
                case '4':  // округ
                case '2':  // квартал
                    for (var i = 0; i < obj.features.length; i++) {
                        name = obj.features[i].attrs.cn;
                        if (obj.features[i].attrs.cn) {
                            names += '<div class="routeFilesName" style="cursor:pointer;" id="part_' + (i + 1).toString() + '_' + type + '" >' + name;
                            if (obj.features[i].attrs.name) {
                                names += ' - ' + obj.features[i].attrs.name;
                                name += ' - ' + obj.features[i].attrs.name
                            }
                            names += '</div> ';
                            if (obj.features[i].center) {
                                geo = GWTK.toLatLng(GWTK.projection.xy2geo3857(obj.features[i].center.y, obj.features[i].center.x));
                                this.tool.point = new GWTK.Point(geo.lat, geo.lng);
                                param = { geo: geo, center: obj.features[i].center};
                                if (name)
                                    param.name = name;
                                this.objectsInfo[type].push(param);
                            }
                        }
                    }

                    $('#rosreestr_name').html(names);
                    // Добавим события
                    for (var i = 0; i < obj.features.length; i++) {
                        $('#part_' + (i + 1).toString() + '_' + type).on('click', this.onClickObject);
                    }
                    break;

                case '1': // участки
                    $('#rosreestr_info').html('');
                    if (this.tool.parts.length == 0) {
                        for (var i = 0; i < obj.features.length; i++) {
                            this.tool.parts.push(obj.features[i]);
                        }
                    }
                    for (var i = 0; i < this.tool.parts.length; i++) {
                        name = this.tool.parts[i].attrs.cn;
                        if (this.tool.parts[i].attrs.cn != null)
                            names += '<div class="routeFilesName" style="cursor:pointer;" id="part_' + (i + 1).toString() + '_' + type + '" >' + name + '</div> ';
                            if (this.tool.parts[i].center) {
                                geo = GWTK.toLatLng(GWTK.projection.xy2geo3857(this.tool.parts[i].center.y, this.tool.parts[i].center.x));
                                this.tool.point = new GWTK.Point(geo.lat, geo.lng);
                                param = { geo: geo, center: this.tool.parts[i].center };
                                if (name)
                                    param.name = name;
                                this.objectsInfo[type].push(param);
                            }
                        }

                    $('#rosreestr_name').html(names);
                    // Добавим события
                    for (var i = 0; i < obj.features.length; i++) {
                        $('#part_' + (i + 1).toString() + '_' + type).on('click', this.onClickObject);
                    }

                    //Встать на первый участок
                    tool.setRequest_cadnum(tool.parts[0].attrs.id, type);
                    break;

                case '5': // ОКС
                    $('#rosreestr_info').html('');
                    if (this.tool.okss.length == 0) {
                        for (var i = 0; i < obj.features.length; i++) {
                            this.tool.okss.push(obj.features[i]);
                        }
                    }
                    for (var i = 0; i < this.tool.okss.length; i++) {
                        name = this.tool.okss[i].attrs.cn;
                        if (this.tool.okss[i].attrs.cn != null)
                            names += '<div class="routeFilesName" style="cursor:pointer;" id="okss_' + (i + 1).toString() + '_' + type + '" >' + name + '</div> ';
                        if (this.tool.okss[i].center) {
                            geo = GWTK.toLatLng(GWTK.projection.xy2geo3857(this.tool.okss[i].center.y, this.tool.okss[i].center.x));
                            this.tool.point = new GWTK.Point(geo.lat, geo.lng);
                            param = { geo: geo, center: this.tool.okss[i].center };
                            if (name)
                                param.name = name;
                            this.objectsInfo[type].push(param);
                        }
                    }

                    $('#rosreestr_name').html(names);
                    // Добавим события
                    for (var i = 0; i < obj.features.length; i++) {
                        $('#okss_' + (i + 1).toString() + '_' + type).on('click', this.onClickObject);
                    }

                    // Встать на первый участок
                    tool.setRequest_cadnum(tool.okss[0].attrs.id, type);
                    break;

            }

            // Выведем placemark
            this.setPlaceMark(type, null, true);
        },

        eventChangeTab: function (active) {
            $(this.parentdiv).trigger({
                type: 'changetabRosreestr',
                value: active
            });
        },

        onClickObject: function (event) {
            var tool = this.map.mapTool("rosreestr");
            if (!tool) return false;

            var type,
                index = $(event.target)[0].id.split('_');
            if (!index || index.length < 3)
                return false;
            switch (type = index[2]) {
                case '3':  // район
                case '4':  // округ
                case '2':  // квартал
                     break;
                case '1': // участки
                    tool.setRequest_cadnum(tool.parts[parseInt(index[1]) - 1].attrs.id, index[2]);
                    break;
                case '5': // ОКС
                    tool.setRequest_cadnum(tool.okss[parseInt(index[1]) - 1].attrs.id, index[2]);
                    break;
            }

            // Спозиционируем
            this.setPlaceMark(type, this.objectsInfo[type][index[1] - 1].center);
        },

        // отобразить точки и спозиционировать
        setPlaceMark: function (type, center, first) {
            var tool = this.map.mapTool("rosreestr");
            if (!tool) return false;
            if (this.objectsInfo[type] && this.objectsInfo[type].length > 0) {
                if (center)
                    tool.setCenter(center);
                if (this.objectsInfo[type] && this.objectsInfo[type].length > 0) {
                    for (var i = 0; i < this.objectsInfo[type].length; i++) {
                        if ((tool.center && tool.center.x == this.objectsInfo[type][i].center.x && tool.center.y == this.objectsInfo[type][i].center.y) || (first && i == 0)) {
                            tool.map.setViewport(this.objectsInfo[type][i].geo);
                            tool.map.overlayAppend(this.objectsInfo[type][i].geo, null, true, tool.id, false, false, tool.id, this.objectsInfo[type][i].name);
                        }
                        tool.map.overlayAppend(this.objectsInfo[type][i].geo, null, true, tool.id, true, GWTK.Util.getDivSize('placemark-img-size-small'), tool.id, this.objectsInfo[type][i].name);
                    }
                    tool.map.overlayRefresh();
                }
            }
        }

    };

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // Обработчик росреестра
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    GWTK.MapeditorRosreestrAction = function (task, name, map) {
        GWTK.MapAction.call(this, task, name);           // родительский конструктор
        this.map = map;
        this.onMapclick = GWTK.Util.bind(this.onMapclick, this);

    };

    GWTK.MapeditorRosreestrAction.prototype = {
            /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
         * @method set
         * @param options {Object} параметры обработчика
         */
        set: function () {
            $('#panel_button_clearselect').click();
            this.map.getFeatureInfo = GWTK.rosreestrControl.prototype.getFeatureInfo;
            $( this.map.overlayPane ).on( 'mapclick', this.onMapclick);
        },

        /**
         * Сбросить настройки (отключение обработчиков событий, инициализация флажков и др.)
         * @method clear
         */
        clear: function () {
            this.map.getFeatureInfo = GWTK.Map.prototype.getFeatureInfo;
            $(this.map.overlayPane).off('mapclick', this.onMapclick);
        },

        onMapclick: function (ui) {
            var tool = this.map.mapTool("rosreestr");
            if (!tool || !(tool instanceof GWTK.rosreestr)) return;
            if (!ui || !ui.geo) {
                return;
            }
            var geo =  ui.geo;
            var _rosreestrControl = tool.rosreestrControl;
            _rosreestrControl.cleartab();
            tool.setPoint(geo[0], geo[1]);
            if (w2ui.rosreestr_tabs == undefined || w2ui.rosreestr_tabs == null)
                return;

            tool.newsearch = true;
            _rosreestrControl.initActiveTab();
            _rosreestrControl.onclick(_rosreestrControl.activetab);

            _rosreestrControl.show(true);
            return false;
        }
    }
    GWTK.Util.inherits(GWTK.MapeditorRosreestrAction, GWTK.MapAction);
}
