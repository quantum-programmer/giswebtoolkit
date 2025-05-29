/************************************** Соколова  ***** 04/06/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Класс выбора типов объектов карты                      *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {

    /**
     *  класс типов объектов
     * @param layer
     * @param parentSelector
     * @param options {
     *     view : 'tree' or 'free'
     *     graphic :  true/false - Добавлять панель для графических объектов
     *     fn_selectcode : - функция выбора кода объекта
     *     fn_iseditingobjects : - функция проверки наличия предопределенных объектов для отображения
     *     fn_iseditingbyCodeList : - функция проверки наличия списка объектов по CodeList
     *     fn_iseditingobject : - функция проверки вхождения объекта в список редактируемых объектов
     *     }
     * @constructor
     */
    GWTK.MapeditLegend = function (map, layer, parentSelector, options) {
        GWTK.LEGEND = {};
        // Типы локализаций
        GWTK.LEGEND.templateLocals = {
            '0': {'value': 1},
            '1': {'value': 1},
            '2': {'value': 1},
            '3': {'value': 1},
            '4': {'value': 1}
        };

        GWTK.LEGEND.templateDefault =  {
            'name': w2utils.lang('All objects'),
            'locals' : JSON.parse(JSON.stringify(GWTK.LEGEND.templateLocals)),
            'layers' : {
                'visible': [],
                'novisible': ['system']
            },
            'keys': {
                'visible': [],
                'novisible': []
            }
        };

        this.toolname = 'mapeditlegend';
        this.error = true;

        this.map = map;
        if (!this.map || this.map instanceof GWTK.Map == false) {
            return;
        }

        this.panelId = this.toolname + GWTK.Util.randomInt(150, 200);
        this.panelToolbarId = this.panelId + 'toolbar';
        this.panelLegendTemplatesId = this.panelToolbarId + 'legendtemplates';
        this.popupSettigsId = this.panelId + 'legendsettings';

        this.panels = {
            "tree": {
                "id": this.panelId + 'tree',
                "visible": 1
            }
        };

        if (options) {
            this.modelite = options.modelite;
            if (!this.modelite) {
                this.panels["free"] = {
                    "id" : this.panelId + 'free',
                    "visible" : 0
                }
            }
        }

        this.parent = (parentSelector) ? $(parentSelector) : $(this.map.mapPane);

        // Параметры
        this.options = {
            "view": "tree",
            "full": 1,
            "buttonsize": "small"
        };

        // Объект шаблонов
        this.layertemplates = {};

        this.readCookie();

        if (options) {
            $.extend(this.options, options);
            // Если отключена работа с графической панелью, то сделать full = 1
            if (!options.graphic) {
                this.options.graphic = false;
                this.options.full = 1;
            }

        }

        if (!layer) {
            return;
        }

        // Класс настройки шаблонов
        this.legendSettingsControl = new GWTK.LegendSettingsControl(this.map);

        // Кнопка сворачивания панели легенды
        this.options.full = (this.options.full == 0) ? this.options.full : 1;

        this.preClassifier = '_classifier';
        this.preClassifiers = '_classifiers';
        this.preDraw = '_draw';

        // Идентификаторы панелей объектов коассификатора и графических объектов
        this.detailid = [this.panelId + 'tabs', this.panelId + 'class', this.panelId + 'draw'];

        this.onLoadClassifier = GWTK.Util.bind(this.onLoadClassifier, this);
        this.onLoadClassifierError = GWTK.Util.bind(this.onLoadClassifierError, this);

        this.selectCodeFromFree = GWTK.Util.bind(this.selectCodeFromFree, this);

        this.isGraphic =  (layer instanceof GWTK.graphicLayer) ? true : false;
        var heights = this.getHeightInfo(this.parent),
            html =
                '<div id="' + this.panelId + '" class="divFlex" style="height:100%;width:100%;flex-direction: column;">' +

                '<div class="divFlex" style="width:100%; height: 100%; flex-direction: column;">' +
                '<div id = "' + this.detailid[0] + '"  style="width:100%; height: ' + heights.heighttab + 'px; margin-top:5px;"></div>' +

                '<div id = "' + this.detailid[0] + 'param"  style="width:100%; height: ' + heights.heightparam + ';">' +
                // Панель классификатора
                '<div id="' + this.detailid[1] + '"  class="divFlex"  style="width:100%; height: 100%; margin-top:5px;">' +
                '<div id="' + this.panelId + this.preClassifiers + 'main" class="divFlex" style="height:100%; width:100%;flex-direction: column;">' +

                '<div id="' + this.panelId + this.preClassifiers + '" class="divFlex" style="height:100%; width:100%;flex-direction: column;">' +

                '<div id="' + this.panelToolbarId + '"  class="divFlex" style="padding-bottom: 3px; justify-content: space-between;">' +
                    '<div class="divFlex" style="width:90%">' +
                    // Кнопка настройки и список
                    '<div id="' + this.panelToolbarId + 'legendsettings" class="control-button_edsetting clickable" title = "' + w2utils.lang('Setting the list of objects') + '" style="width: 24px; height: 24px;"></div>' +
                        '<div class="" style="padding-left: 5px; width: 100%;">' +
                            '<input type="list" id="' + this.panelLegendTemplatesId +'" style="width:100% !important;">' +
                        '</div>' +
                    '</div>';

        if (!this.modelite) {
            // Button tree/free
            html += '<div id="' + this.panelToolbarId + 'tree" class="clickable" style="width: 24px; height: 24px;"></div>';
        }

        html += '</div>' +
            // Коды объектов
            '<div id="' + this.panelId + this.preClassifier + '" style="height:98%;width:100%;"></div>' +
            '</div>' +
            '</div>' +
            '</div>';

        if (!this.options.modelite) {
            // Панель графических объектоа
            html +=
                '<div id="' + this.detailid[2] + '"  class="divFlex"  style="width:100%; height: 100%;">' +
                    '<div id="' + this.panelId + this.preDraw + '" class="divFlex" style="height:100%; width:100%;flex-direction: column;border:">' +
                    '</div>' +
                '</div>';
        }

        html += '</div>' +
                '</div>' +
                '</div>';
        this.parent.append(html);

        // this.parent.append(
        //     '<div id="' + this.panelId + '" class="divFlex" style="height:100%;width:100%;flex-direction: column;">' +
        //
        //     '<div class="divFlex" style="width:100%; height: 100%; flex-direction: column;">' +
        //         '<div id = "' + this.detailid[0] + '"  style="width:100%; height: ' + heights.heighttab + 'px; margin-top:5px;"></div>' +
        //
        //         '<div id = "' + this.detailid[0] + 'param"  style="width:100%; height: ' + heights.heightparam + ';">' +
        //             // Панель классификатора
        //             '<div id="' + this.detailid[1] + '"  class="divFlex"  style="width:100%; height: 100%; margin-top:5px;">' +
        //                 '<div id="' + this.panelId + this.preClassifiers + 'main" class="divFlex" style="height:100%; width:100%;flex-direction: column;">' +
        //
        //                     '<div id="' + this.panelId + this.preClassifiers + '" class="divFlex" style="height:100%; width:100%;flex-direction: column;">' +
        //
        //                         // Button tree/free
        //                         '<div id="' + this.panelToolbarId + '"  class="divFlex" style="padding-bottom: 3px; justify-content: space-between;">' +
        //                             '<div class="divFlex" style="width:90%">' +
        //                                 '<div id="' + this.panelToolbarId + 'legendsettings" class="control-button_edsetting clickable" title = "' + w2utils.lang('Setting the list of objects') + '" style="width: 24px; height: 24px;"></div>' +
        //                                 '<div class="" style="padding-left: 5px; width: 100%;">' +
        //                                     '<input type="list" id="' + this.panelLegendTemplatesId +'" style="width:100% !important;">' +
        //                                 '</div>' +
        //                             '</div>' +
        //                             '<div id="' + this.panelToolbarId + 'tree" class="clickable" style="width: 24px; height: 24px;"></div>' +
        //                         '</div>' +
        //
        //                         // Коды объектов
        //                         '<div id="' + this.panelId + this.preClassifier + '" style="height:98%;width:100%;">' +
        //                         '</div>' +
        //
        //                     '</div>' +
        //
        //                 '</div>' +
        //              '</div>' +
        //
        //             // Панель графических объектоа
        //              '<div id="' + this.detailid[2] + '"  class="divFlex"  style="width:100%; height: 100%;">' +
        //                 '<div id="' + this.panelId + this.preDraw + '" class="divFlex" style="height:100%; width:100%;flex-direction: column;border:">' +
        //                 '</div>' +
        //              '</div>' +
        //
        //      '</div>' +
        //    '</div>' +
        // '</div>'
        // );

        // Инициализировать закладки классификатора и графики
        this.initTabs();

        // Панели классификатора
        var display, html = '';
        for(var key in this.panels) {
            display =  (!this.panels[key].visible) ?  display = ' display:none;' : '';
            html += '<div id="' + this.panels[key]['id'] + '" class="divFlex border" style="height:100%;width:100%; flex-direction: column; overflow-y:auto;' +
                display + '"></div>';
        }
        $('#' + this.panelId + this.preClassifier).append(html);

        if (!this.changeLayer(layer)) {
            return;
        }

         // Инициализировать данные
        this.initData();

        this.error = false;

        // Кнопка настроек списка шаблонов
        $('#' + this.panelToolbarId + 'legendsettings').click(
            GWTK.bind(function(event){
                    this.legendSettingsPopup(this.layertemplates, GWTK.Util.bind(this.saveLegendtemplates,this));
            }, this)
        );

    };

    GWTK.MapeditLegend.prototype = {

        /**
         * Разрушить класс
         */
        destroy: function () {

            $(this.map.eventPane).off('loadclassifier', this.onLoadClassifier);
            $(this.map.eventPane).off('loadclassifierError', this.onLoadClassifierError);

            this.writeCookie();

            // Удалим компонент изменения размеров
            if (this.changeSizing) {
                this.changeSizing.destroy();
            }

            // Удалим slider
            this.removeLegend();

            // Удалим панель графичискипримитивов
            if (this.graphicLegend) {
                this.graphicLegend.destroy();
            }

            var w2ui_tabs = w2ui[this.detailid[0]];
            if (w2ui_tabs) {
                w2ui_tabs.destroy();
            }

            // Удалим класс настройки шаблонов
            if (this.legendSettingsControl) {
                this.legendSettingsControl.destroy();
            }
            this.parent.empty();

        },

        /**
         * Инициализировать закладки классификатора и графики
         */
        initTabs: function() {
            var tabs = [{id: this.detailid[1], caption: w2utils.lang("Map objects")}];
            if (!this.options.modelite) {
                tabs.push({id: this.detailid[2], caption: w2utils.lang('Graphic objects')});
            }

            // Закладки объектов классификаторва и графики
            $('#' + this.detailid[0]).w2tabs({
                name: this.detailid[0],
                style: 'background-color: transparent;',
                tabs: tabs,
                onClick: GWTK.Util.bind(function (event) {
                    this.setActiveTabInfo(event.tab.id);
                }, this)
            });
            this.showTab = null;
            this.setActiveTabInfo(this.detailid[1]);
        },

        /**
         * Установить активную закладку
         * @param value - ключ объекта
         * @param change - признак применения измений
         */
        setActiveTabInfo: function (value) {
            if (!value) {
                return;
            }

            // Скрыть все
            for(var i = 1; i < this.detailid.length; i++) {
                if (value != this.detailid[i]) {
                    GWTK.MapEditorUtil.hide(this.detailid[i]);
                }
                else {
                    GWTK.MapEditorUtil.show(this.detailid[i]);
                    this.showTab = value;
                }
            }

            var w2ui_tabs = w2ui[this.detailid[0]];
            if (w2ui_tabs) {
                w2ui_tabs.active = this.showTab;
                w2ui_tabs.refresh();
                if (this.showTab == this.detailid[2] ) {
                    this.createGraphicPane();
                }
            }
        },

        // Удалим легенду
        removeLegend: function () {
            for(var key in this.panels) {
                if (w2ui[this.panels[key]['id']]) {
                    w2ui[this.panels[key]['id']].destroy();
                }
                $('#' + this.panels[key]['id']).empty();
            }
            this.legendItems = [];
            this.items = [];

            // Если есть панель с графическими объектами
            if (this.graphicLegend) {
                this.graphicLegend.destroy();
            }
        },

        /**
         * Прочитать куки
         */
        readCookie: function () {
            var param = GWTK.cookie(this.toolname, GWTK.cookies.converter);
            if (param) {
                var _that = this;
                $.each(param, function (index, value) {
                    var key = value.shift();
                    var key_value = value.length > 0 ? value.shift() : '';
                    switch (key) {
                        case 'options':
                            _that.options = ((key_value == '') ? this.options : JSON.parse(key_value));
                            if (!_that.options.buttonsize) {
                                _that.options.buttonsize = "small";
                            }
                            break;
                    }
                });
            }

            // Облегченная версия
            if (this.modelite) {
                this.options.view = 'tree';
            }
            for(var key in this.panels) {
                this.panels[key].visible = 0;
                if (key == this.options.view) {
                    this.panels[key].visible = 1;
                }
            }

            // Макеты объектов
            this.legendtemplates = [];
            if (window.localStorage) {
                var lstorage = window.localStorage.getItem(this.toolname);
                if (lstorage) {
                    var mass = lstorage.split('=');
                    if (mass && mass.length == 2 && mass[0] == 'legendtemplates') {
                        this.legendtemplates = JSON.parse(mass[1]);
                    }
                }
            }
        },

        /**
         * Записать куки
         */
        writeCookie: function () {
            GWTK.cookie(this.toolname, 'options=' + JSON.stringify(this.options), {expires: 5, path: '/'});

            if (window.localStorage){
                var str = (this.legendtemplates) ? JSON.stringify(this.legendtemplates) : '',
                    value = (str) ? ['legendtemplates=' + str] : '';
                if (value) {
                    window.localStorage.setItem(this.toolname, value);
                }
            }
        },

        /**
         * Инициализировать данные
         */
        initData: function () {

            // Инициализировать вид отображения данных
            this.tree = GWTK.MapEditorUtil.byId(this.panelToolbarId + 'tree');
            if (!this.tree) {
                return;
            }

            this.showOptionsView(this.options.view);

            this.tree.onclick = (GWTK.Util.bind(function () {
                if (this.options.view == 'free') {
                    this.showOptionsView('tree');
                }
                else {
                    this.showOptionsView('free');
                }
                this.writeCookie();

            }, this));

            // // Класс смены размеров кнопок
            // this.changeSizing = new GWTK.ChangeSizing('#' + this.panelToolbarId + 'changesize', {
            //     size : this.options.buttonsize,
            //     fn_callback: GWTK.Util.bind(this.changeSizeButton, this)
            // });

        },

        /**
         * Сменить слой
         * @param layer
         */
        changeLayer: function (layer, init) {
            this.error = true;

            if (layer && this.layer && layer.xId == this.layer.xId) {
                this.error = false;
                return;
            }


            this.layer = layer;
            this.removeLegend();
            if (!this.layer) {
                return;
            }

            // var filter = this.layer.getKeysFilter();

            this.map = this.layer.map;
            if (!this.map || this.map instanceof GWTK.Map == false)
                return;

            //+++++++++++++++ TODO - обработать, когда будут работать Draw
            this.isGraphic = (this.layer instanceof GWTK.graphicLayer) ? true : false;
            var w2ui_tabs = w2ui[this.detailid[0]];
            if (w2ui_tabs) {
                if (this.isGraphic) {
                    w2ui_tabs.hide(this.detailid[1]);
                    this.setActiveTabInfo(this.detailid[2]);
                }
                else {
                    w2ui_tabs.show(this.detailid[1]);
                    w2ui_tabs.refresh();
                }
            }
            //+++++++++++++++

            // Сбросим флажок наполненности панелей
            this.panelTreeFree = false;

            // Текущий шаблон
            if (!this.isGraphic) {
                var key, find = false;
                if (this.legendtemplates) {
                    for (key in this.legendtemplates) {
                        if (key == this.layer.idLayer) {
                            this.layertemplates = JSON.parse(JSON.stringify(this.legendtemplates[key].layertemplates));
                            this.currentLegendTemplate = this.legendtemplates[key].current;
                            find = true;
                            break;
                        }
                    }
                }
                if (!find){
                    key = this.layer.idLayer;
                    this.legendtemplates[key] = {
                        'current': 0,
                        'layertemplates': [JSON.parse(JSON.stringify(GWTK.LEGEND.templateDefault))]
                    };
                    this.layertemplates = JSON.parse(JSON.stringify(this.legendtemplates[key].layertemplates));
                    this.currentLegendTemplate = this.legendtemplates[key].current;
                }

                // Инициализация компонента списка щаблонов легенды
                this.initLegendTemplatesList(GWTK.Util.bind(this.changeLegendTemplate,this));
            }

            this.error = false;
            this.legend = this.getLegend(this.layer);

            if (this.options.fn_iseditingobjects && $.isFunction(this.options.fn_iseditingobjects)) {
                this.editingobjects = this.options.fn_iseditingobjects(this.layer.options.id);
            }

            // От триггера на смену слоя в компоненте
            if (this.legend && this.legend.id &&
                this.initSelectLayerObjects(this.legend)) {
                // this.showClassifiers();
            }
            if (this.graphicLegend) {
                this.graphicLegend.changeLayer(layer);
            }
            return true;
        },

        /**
         * Создать панель графических объектов
         */
        createGraphicPane: function(){

            if (this.isGraphic || this.options.graphic) {

                if (!this.graphicLegend) {
                    this.graphicLegend = new GWTK.MapeditLegendGraphicControl(this.map, this.layer, '#' + this.panelId + this.preDraw, { fn_selectcode: this.options.fn_selectcode} );

                    // Слушаем события выделения элементы легенды
                    $(this.map.eventPane).on('GWTK.MapeditLegendGraphicControl.select', GWTK.bind(function(event) {
                        // Если есть текущий выделенный
                        if (this.currSelectFreeId) {
                            this.unset(this.currSelectFreeId, 'id');
                        }
                        if (this.options.fn_selectcode) {
                            this.options.fn_selectcode(this.graphicLegend.node);
                        }

                    }, this));
                }
                else {
                    this.graphicLegend.refresh();
                }
            }
            else{
                if (this.graphicLegend) {
                    this.graphicLegend.destroy();
                    this.graphicLegend = null;
                }
            }
        },

        /**
         * Создать панель для отображения вида объектов из классификатора
         * @param key
         */
        createClassifierPane: function (key) {
            if (!key) {
                return;
            }

            var ret;
            switch (key) {
                case 'tree':
                    ret = this.createTree(this.panels[key]['id']);
                    break;
                case 'free':
                    ret = this.createFree(this.panels[key]['id']);
                    this.updateFree();
                    break;
            }

            if (ret) {
                this.panelTreeFree = true;
                this.showClassifiers();
            }
        },

        /**
         * Создать дерево
         * @param parentId
         */
        createTree: function (parentId) {

            if (!this.items || this.items.length == 0 || !parentId) {
                return;
            }

            //  Проверим на отсутствие сожержимого
            var $parent = $('#' + parentId),
                w2sidebar = w2ui[parentId];
            if ($parent.length > 0 && !$parent.is(':empty') && w2sidebar)  {
                w2sidebar.refresh();
                return true;
            }

            $parent.empty();
            $parent.append(
                '<div id = "' + parentId + 'w2sidebar" style = "width: 100%; height: 100%;">' +
                '</div>'
            );
            // Создадим компонент
            if (w2sidebar) {
                w2sidebar.destroy();
            }

            $('#' + parentId + 'w2sidebar').w2sidebar({
                name: parentId,
                nodes: this.items
                // , style: 'height:100%; width: 100%;'
            });

            w2sidebar = w2ui[parentId];
            if (w2sidebar) {
                // Подгрузить (раньше нельзя, долго открывается дерево)
                if (this.itemsEmpty) {
                    this.items = this.legendSettingsControl.getSavedTemplateItems(this.legendItems, this.layertemplates[this.currentLegendTemplate],(this.itemsEmpty = false));
                }
                w2sidebar.on('expand', GWTK.Util.bind(function(event) {
                    if (this.itemsEmpty) {
                         this.items = this.legendSettingsControl.getSavedTemplateItems(this.legendItems, this.layertemplates[this.currentLegendTemplate],(this.itemsEmpty = false));
                    }
                    for(var i = 0; i < this.items.length; i++) {
                        if (this.items[i]['id'] == event.object['id']) {
                            if (!event.object.full) {
                                w2sidebar.set(event.object['id'], this.items[i]);
                                event.object.full = true;
                            }
                            break;
                        }
                    }
                }, this));
                w2sidebar.on('click', GWTK.Util.bind(function (event) {
                    var node = w2ui[parentId].get(event.target);
                    if (node && node.code) {
                        this.currSelectFreeId = node.id;
                        this.selectNode(node);

                        if (this.options.fn_selectcode && $.isFunction(this.options.fn_selectcode)) {
                            this.options.fn_selectcode(node);
                        }
                    }
                }, this));

            }
            return true;
        },

        /**
         * Создать произвольную галерею
         * @param legend
         */
        createFree: function (parentId) {

            if (!this.legendItems || this.legendItems.length == 0 || !parentId ||
                !this.panels || !this.panels.hasOwnProperty("free")||
                !this.panels['free']['id']) {
                return;
            }

            //  Проверим на отсутствие содержимого
            var id = this.panels['free']['id'],
                el = GWTK.MapEditorUtil.byId(id);
            if (el && el.children && el.children.length > 0) {
                return;
            }

            $(this.map.eventPane).off('legend.imageclick', this.selectCodeFromFree);

            if (this.itemsEmpty) {
                this.items = this.legendSettingsControl.getSavedTemplateItems(this.legendItems, this.layertemplates[this.currentLegendTemplate],(this.itemsEmpty = false));
            }
            // Стили по высоте, в зависимости от браузера
            // var style_height = ($.browser.msie || $.browser.mozilla) ? 'min-height:120px;' : 'height:120px;',
            var style_height = '',
                // Начальный размер кнопок
                buttonsize = 'control-buttons-' + this.options.buttonsize,
                min_height = ' min-height: 40px;',
                max_height = ' max-height: 120px;';

            var html = '<div id = "' + id + 'freebar" style = "width: 100%; height: 100%;">',
                nodesid = [];

            for (var i = 0; i < this.legendItems.length; i++) {
                 html +=
                    '<div  id="' + this.legendItems[i].id + '_layer" class="divFlex border-bottom" style="flex-direction: column;' + style_height + '">' +

                    // Название слоя
                    '<div  style="width:90%; margin-top: 5px; margin-left: 5px;  margin-right: 5px; white-space: pre-wrap;">' + this.legendItems[i].text + '</div>' +

                    '<div  class="divFlex" style="' + max_height + min_height + ' margin-top: 5px; margin-left: 5px;  margin-right: 5px; overflow-y:auto;">' +

                    // Объекты слоя
                    '<div id="' + this.legendItems[i].id + '" class="divFlex" style="height:100%;width:100%; flex-direction: row; flex-wrap:wrap">';

                    for (var j = 0; j < this.legendItems[i].nodes.length; j++) {
                        nodesid.push(this.legendItems[i].nodes[j].id);
                        html += '<div class="clickable ' + this.legendItems[i].nodes[j].img + '" id="' + nodesid[nodesid.length-1] + '" name = "' + this.panelId + 'stylefree" style="margin-right: 4px; margin-bottom: 4px; background-size: 100%;" title="' +
                            this.legendItems[i].nodes[j].text +
                            '" onclick="GWTK.MapeditLegend.prototype.imageClick(\'' + nodesid[nodesid.length-1] + '\', \'' + this.map.eventPane.id + '\')" ' +
                            '>' +
                            '</div>';
                    }

                 html += '</div></div></div>';
                }
            html += '</div>';
            el.innerHTML = html;

            $(this.map.eventPane).on('legend.imageclick', this.selectCodeFromFree);

            return true;
        },


        // /**
        //  * Создать произвольную галерею
        //  * @param legend
        //  */
        // createFree: function (parentId) {
        //
        //     if (!this.legendItems || this.legendItems.length == 0 || !parentId ||
        //         !this.panels || !this.panels.hasOwnProperty("free")||
        //         !this.panels['free']['id']) {
        //         return;
        //     }
        //
        //     //  Проверим на отсутствие содержимого
        //     var id = this.panels['free']['id'],
        //         el = document.getElementById(id);
        //     if (el && el.children && el.children.length > 0) {
        //         return;
        //     }
        //
        //     if (this.itemsEmpty) {
        //         this.items = this.legendSettingsControl.getSavedTemplateItems(this.legendItems, this.layertemplates[this.currentLegendTemplate],(this.itemsEmpty = false));
        //     }
        //     // Стили по высоте, в зависимости от браузера
        //     // var style_height = ($.browser.msie || $.browser.mozilla) ? 'min-height:120px;' : 'height:120px;',
        //     var style_height = '',
        //         // Начальный размер кнопок
        //         buttonsize = 'control-buttons-' + this.options.buttonsize,
        //         min_height = ' min-height: 40px;',
        //         max_height = ' max-height: 120px;';
        //
        //     var html = '<div id = "' + id + 'freebar" style = "width: 100%; height: 100%;">',
        //         nodesid = [], id;
        //
        //     for (var i = 0; i < this.legendItems.length; i++) {
        //         html +=
        //             '<div  id="' + this.legendItems[i].id + '_layer" class="divFlex border-bottom" style="flex-direction: column;' + style_height + '">' +
        //
        //             // Название слоя
        //             '<div  style="width:90%; margin-top: 5px; margin-left: 5px;  margin-right: 5px; white-space: pre-wrap;">' + this.legendItems[i].text + '</div>' +
        //
        //             '<div  class="divFlex" style="' + max_height + min_height + ' margin-top: 5px; margin-left: 5px;  margin-right: 5px; overflow-y:auto;">' +
        //
        //             // Объекты слоя
        //             '<div id="' + this.legendItems[i].id + '" class="divFlex" style="height:100%;width:100%; flex-direction: row; flex-wrap:wrap">';
        //
        //         for (var j = 0; j < this.legendItems[i].nodes.length; j++) {
        //             id = this.legendItems[i].nodes[j].id;
        //             html += '<img  ' +
        //                 'src="' + this.legendItems[i].nodes[j].url +
        //                 '" id="' + id + '" name = "' + this.panelId + 'stylefree" ' +
        //                 ' class="clickable border-button control-buttons-small" style="margin-right: 4px; margin-bottom: 4px;" ' +
        //                 ' title="' +  this.legendItems[i].nodes[j].text + '" ' +
        //                 ' onclick="GWTK.MapeditLegend.prototype.imageClick(\'' + id + '\', \'' + this.map.eventPane.id + '\')" ' +
        //                 '>';
        //         }
        //
        //         html += '</div></div></div>';
        //     }
        //     html += '</div>';
        //
        //     el.innerHTML = html;
        //
        //     $(this.map.eventPane).on('legend.imageclick', this.selectCodeFromFree);
        //
        //     return true;
        // },


        imageClick: function(id, eventPanelId){
            if (id && eventPanelId) {
                $('#' + eventPanelId).trigger({ type: 'legend.imageclick', id: id });
            }

        },

        /**
         * Запрос легенды слоя
         * @method getLegend
         * @param layer {Object} Слой карты GWTK.graphicLayer или GWTK.Layer
         */
        getLegend: function (layer) {
            if (!layer) {
                layer = this.layer;
            }
            if (!layer) {
                return;
            }

            this.error = true;
            $(this.map.eventPane).off('loadclassifier', this.onLoadClassifier);
            $(this.map.eventPane).off('loadclassifierError', this.onLoadClassifierError);

            if (!layer.classifier) {
                return;
            }

            var legend = layer.classifier.legend;
            if (!legend) {
                legend = layer.classifier.getlegend();
                if (!legend) {
                    $(this.map.eventPane).on('loadclassifier', this.onLoadClassifier);
                    $(this.map.eventPane).on('loadclassifierError', this.onLoadClassifierError);
                }
            }

            this.error = false;
            return legend;
        },

        /**
         * Загрузка данных из классификатора
         * @method  onLoadClassifier
         * @param event {Object} Событие
         */
        onLoadClassifier: function (event) {

            if (!this.layer) {
                this.error = true;
                return;
            }

            if (this.layer.id && event.layer && event.layer.id == this.layer.id) {
                this.error = false;
                var legend = event.legend;
                if (legend) {
                    if (this.initSelectLayerObjects(legend)) {
                        this.show(true);
                    }
                }
            }
        },

        /**
         * Ошибка при загрузке данных из классификатора
         * @method  onLoadClassifierError
         * @param event {Object} Событие
         */
        onLoadClassifierError: function (event) {

            this.error = true;
            if (!this.layer) {
                return;
            }
            if (this.layer.id && event.layer && event.layer.id == this.layer.id) {
                w2alert(w2utils.lang("Legend layer is not initialized. Layer ") + this.layer.alias);
                this.removeLegend();
            }
        },

        /**
         * Инициализации данных легенды для отображения
         * @param legend
         */
        initSelectLayerObjects: function (legend) {
            if (this.error || !legend || !legend.items || legend.items.length == 0 ||
                this.legendItems.length > 0) {
                return false;
            }

            // Заполним реальные данные
            this.legendItems = new Array();
            var node, bsdlayer, mass, k = 0,
                count = legend.items.length;
            var l = '_' + this.layer.options.id;
            for (var i = 0; i < count; i++) {
                if (legend.items[i].nodes.length == 0)
                    continue;
                mass = legend.items[i].id.split("_");
                if (mass == null || mass.length < 2)
                    continue;
                bsdlayer = mass[mass.length - 1];
                var itemsel = {};
                itemsel.id = 'editor_' + legend.items[i].id;
                itemsel.code = legend.items[i].code;
                itemsel.text = legend.items[i].text;
                itemsel.img = legend.items[i].img;
                itemsel.expanded = legend.items[i].expanded;
                itemsel.nodes = new Array();

                for (var j = 0; j < legend.items[i].nodes.length; j++) {

                    node = legend.items[i].nodes[j];
                    if (node.local.toString() == '5') {// Шаблоны не обрабатываем !!!!
                        continue;
                    }
                    var item = JSON.parse(JSON.stringify(node));

                    item.key = item.id.replace(new RegExp(l, 'g'), "");
                    item.id = 'editor_' + item.id;
                    item.expanded = true;
                    item.bsdlayer = bsdlayer;
                    item.cssclass = item.img;
                    item.img += ' legend_img_editor border-button';
                    if (this.options.buttonsize && item.img) {
                        item.img += ' control-buttons-' + this.options.buttonsize;
                    }

                    // Сначала пройдемся по codeList, если такая настройка существует
                    var isSeditingbyCodeList = false;
                    if (this.options.fn_iseditingbyCodeList && $.isFunction(this.options.fn_iseditingbyCodeList)) {
                        isSeditingbyCodeList = this.options.fn_iseditingbyCodeList(this.layer.options.id, item.code);
                    }
                    else {
                        isSeditingbyCodeList = true;
                    }

                    var edobj;
                    if (isSeditingbyCodeList) {
                        if (this.editingobjects && this.options.fn_iseditingobject && $.isFunction(this.options.fn_iseditingobject)) {
                            edobj = this.options.fn_iseditingobject(this.editingobjects, item.code, item.key);
                        }
                    }

                    if (!this.editingobjects || (this.editingobjects && edobj))
                        itemsel.nodes.push(item);
                 }

                 if (itemsel.nodes.length > 0) {
                    this.legendItems[k] = itemsel;
                    k++;
                 }
            }

            this.changeLegendTemplate(this.currentLegendTemplate);
            return true;
        },

        /**
         * Показать / cкрыть панель легенды классификатора
         * @param hide - скрыть независимо от настроек (например для графических слоев)
         */
        showClassifiers: function (hide) {
            if (!this.panelTreeFree) {
                this.show(true);
            }
            else {
                this.updateTree();
            }
        },

        showOptionsView: function(value) {
            if (!this.tree) {
                return;
            }
            if (value == 'tree') {
                this.options.view = 'tree';
                if (this.tree.classList.contains("control-button_edtree")) {
                    this.tree.classList.remove("control-button_edtree");
                }
                this.tree.classList.add("control-button_edtable");
                this.tree.setAttribute('title', w2utils.lang("Miniature"));

                this.showPaneView(this.options.view);
            }
            else {
                this.options.view = 'free';
                if (this.tree.classList.contains("control-button_edtable")) {
                    this.tree.classList.remove("control-button_edtable");
                }
                this.tree.classList.add("control-button_edtree");
                this.tree.setAttribute('title', w2utils.lang("Legend"));

                this.hidePaneView('tree');
                this.showPaneView(this.options.view);
            }
            this.tree.blur();//.focus(-1);
        },

        /**
         * Отобразить/скрыть панель
         * @param show
         */
        show: function (show) {
            if (show) {
                GWTK.MapEditorUtil.show(this.panelId);
                for(var key in this.panels) {
                    if (this.panels[key].visible) {
                        this.showPaneView(key);
                    }
                    else {
                        this.hidePaneView(key);
                    }
                }
            }
            else {
                GWTK.MapEditorUtil.hide(this.panelId);
            }

        },

        /**
         * Показать нужную панель отображения данных
         */
        showPaneView: function (key) {
            if (key) {
                 if (!GWTK.MapEditorUtil.isvisible(this.panels[key]['id'])) {
                    GWTK.MapEditorUtil.show(this.panels[key]['id']);
                    this.createClassifierPane(key);
                    this.panels[key].visible = 1;
                 }
            }
        },

         /**
         * Скрыть определенную панель отображения даннsых
         * @param key
         */
        hidePaneView: function (key) {
            if (key) {
                GWTK.MapEditorUtil.hide(this.panels[key]['id']);
                this.panels[key].visible = 0;
            }
        },

        /**
         * Обновить состав объектов
         */
        updateView: function() {
            this.panelTreeFree = false;
            // дерево (tree) удалим, в таблице (free) просто обновим видимость
            var id = this.panels['tree']['id'];
            if (w2ui[id]) {
                w2ui[id].destroy();
            }
            $('#' + id).empty();

            this.createClassifierPane(this.options.view);
          },

        /**
         * Обновить дерево в соотвествии с размерами окна
         */
        updateTree: function(){
            // Скроем
            for(var key in this.panels) {
                GWTK.MapEditorUtil.hide(this.panels[key]['id']);
            }

            // Отобразим
            if (this.options.view == 'tree') {
                // Высота для slider
                var w2sidebar = w2ui[this.panels['tree']['id']];
                if (w2sidebar) {
                    $(w2sidebar.box).height($('#' + this.detailid[0] + 'param').height());
                    w2sidebar.refresh();
                }
            }
            GWTK.MapEditorUtil.show(this.panels[this.options.view]['id']);
        },

        /**
         * Обновить отображение панели free
         * @returns {boolean}
         */
        updateFree: function() {
            if (this.itemsEmpty) {
                this.items = this.legendSettingsControl.getSavedTemplateItems(this.legendItems, this.layertemplates[this.currentLegendTemplate],(this.itemsEmpty = false));
            }
            if (!this.items || this.items.length == 0 ||
                !this.legendItems || this.legendItems.length == 0){
                return;
            }

            for (var i = 0; i < this.legendItems.length; i++) {
                GWTK.MapEditorUtil.hide(this.legendItems[i].id + '_layer');
                for (var j = 0; j < this.legendItems[i].nodes.length; j++) {
                    GWTK.MapEditorUtil.hide(this.legendItems[i].nodes[j].id);
                }
            }
            for (var i = 0; i < this.items.length; i++) {
                // Если последний слой, то не ограеничивать в размерах
                GWTK.MapEditorUtil.show(this.items[i].id + '_layer');
                if (this.items[i].nodes) {
                    for (var j = 0; j < this.items[i].nodes.length; j++) {
                        GWTK.MapEditorUtil.show(this.items[i].nodes[j].id);
                    }
                }
            }

            return true;
        },

        /**
         * Запрос высоты окна информации
         * @param panelId
         * @returns {{heighttab: number, heightparam: string}}
         */
        getHeightInfo: function (panelId) {
            //if (panelId.length > 0) {
                var height = $(panelId).height(),
                    // height = parseInt(GWTK.MapEditorUtil.height(panelId[0]));
                heighttab = 35, heightparam = '90%';
                if (height > 0) {
                    heightparam = (height - heighttab).toString() + 'px';
                }
                return {
                    'heighttab': heighttab,
                    'heightparam': heightparam
                };
            //}
        },

        /**
         * Выделить элемент из свободного просмотра
         * @param event
         */
        selectCodeFromFree: function (event) {
            if (!this.items || this.items.length == 0) {
                return;
            }
            var id = (event.id) ? event.id : $(event.target).attr('id'), nodes, node = null;
            if (id) {
                this.setActiveElement(id, true);

                // Найдем по идентификатору элемент
                node = this.get(id, 'id');
                if (node.node) {
                    this.selectNode(node.node);
                }
            }
        },

        /**
         * Выделить запись
         * @param node
         */
        selectNode: function(node){
            if (this.options.fn_selectcode && $.isFunction(this.options.fn_selectcode)) {
                if (this.graphicLegend) {
                    this.graphicLegend.unset();
                }

                // Запросить текст подписи, если local == '3'

                this.options.fn_selectcode(node);
            }
        },

        /**
         * Активировать/дезактивировать (подсветить/снять подсветку) текущий элемент
         * @param id
         * @param active
         */
        setActiveElement: function (id, active) {
            var node = '';
            if (this.currSelectFreeId) {
                GWTK.DomUtil.removeActiveElement($('#' + node + this.currSelectFreeId));
                this.currSelectFreeId = null;
            }
            if (active) {
                GWTK.DomUtil.setActiveElement($('#' + node + id));
                this.currSelectFreeId = id;
            }
        },

        /**
         * Установить на текущий элемент по значению
         * @param value - значение
         * @param fieldname - имя поля поиска
         */
        set: function (value, fieldname, node, select) {

            // Сперва сбросить текущий
            this.unset(this.currSelectFreeId, 'id');
            if (this.graphicLegend) {
                this.graphicLegend.unset();
            }
            if (!value || !fieldname) {
                // Посмотрим графику
                if (this.graphicLegend) {
                    this.graphicLegend.set(this.graphicLegend.node)
                }
                return;
            }
            // Если графика
            if (node && node.graphic) {
                this.setActiveTabInfo(this.detailid[2]);
                this.graphicLegend.set(node, select);
            }
            else {
                node = this.get(value, fieldname);

                if (node.node) {
                    this.setActiveTabInfo(this.detailid[1]);
                    this.setActiveElement(node.node.id, true);
                    this.scrollTop(node, true);
                }
            }
        },

        /**
         * Снять выделение с элемента
         * @param value
         * @param fieldname
         */
        unset: function (value, fieldname, node) {
            if (!value || !fieldname) {

                value = this.currSelectFreeId;
                fieldname = 'id';

                // Посмотрим графику
                if (this.graphicLegend) {
                    this.graphicLegend.unset();
                }

                // return;
            }

            // Если графика
            if (node && node.graphic) {
                if (this.graphicLegend) {
                    this.graphicLegend.unset(node);
                }
            }
            else {
                node = this.get(value, fieldname);
                if (node.node) {
                    this.setActiveElement(node.node.id);
                    this.scrollTop(node);
                }
            }
        },

        /**
         * Найти элемент по значению
         * @param value - значение
         * @param fieldname - имя поля поиска
         * @returns {{node: null, layerIndex: number, objectIndex: number}}
         */
        get: function (value, fieldname) {
            if (this.itemsEmpty) {
                this.items = this.legendSettingsControl.getSavedTemplateItems(this.legendItems, this.layertemplates[this.currentLegendTemplate],(this.itemsEmpty = false));
            }

            var retElement = {
                node: null,
                layerId: -1,
                objectIndex: -1,
                objectId: -1
            };
            if (!this.items || this.items.length == 0 || !value || !fieldname) {
                return retElement;
            }

            // Найдем по идентификатору элемент
            for (var i = 0; i < this.items.length; i++) {
                nodes = this.items[i].nodes;
                if (nodes && nodes.length > 0) {
                    var node = nodes.find(GWTK.Util.bind(function (element, index) {
                        if (element[fieldname] == value) {
                            retElement.node = element;
                            retElement.layerIndex = i;
                            retElement.objectIndex = index;
                            retElement.layerId = this.items[i].id;
                            retElement.objectId = element.id;

                            return element;
                        }
                    }, this))
                    if (node) {
                        break;
                    }
                }
            }

            return retElement;
        },

        /**
         * Запросить есть ли выдеоенный объект
         */
        isSelect: function(){
            return this.currSelectFreeId;
        },

        /**
         * Переместить скролл окна на нужный элемент
         * @param node
         */
        scrollTop: function (node, select) {
            if (!this.items || this.items.length == 0 || !node) {
                return;
            }

            if (this.options.view == 'tree') {
                var w2sidebar = w2ui[this.panels['tree']['id']];
                if (node.node && w2sidebar) {
                    if (select) {
                        w2sidebar.expand(node.layerId);
                        w2sidebar.select(node.objectId);
                        w2sidebar.scrollIntoView();
                     }
                    else {
                        w2sidebar.unselect(node.objectId);
                        // w2sidebar.collapse(node.layerId);
                    }
                }
            }
            else {
                if (this.items.length > 0 && $('#' + this.items[0].id + '_layer').length > 0) {
                    var rect, value = 0;
                    for (var i = 0; i < this.items.length; i++) {
                        rect = $('#' + this.items[i].id + '_layer')[0].getBoundingClientRect();
                        if (i == node.layerIndex) {
                            break;
                        }
                        if (rect.height) {
                            value += rect.height;
                        }
                    }
                    $('#' + this.panels['free']['id']).scrollTop(value);
                }
            }
        },

        /**
         * Инициализация компонента списка щаблонов легенды
         */
        initLegendTemplatesList: function(fn_change){
            var legendtemplatesEl = $('#' + this.panelLegendTemplatesId);
            if (legendtemplatesEl.length > 0) {
                var layertemplates = [];
                for(var i =0; i < this.layertemplates.length; i++) {
                    layertemplates.push({id: i, text: this.layertemplates[i].name})
                }

                legendtemplatesEl.off();
                legendtemplatesEl.w2field('list',
                    {items: layertemplates, selected: layertemplates[this.currentLegendTemplate]});

                legendtemplatesEl.change(GWTK.Util.bind(function (event) {
                    var obj = legendtemplatesEl.data('selected');
                    if (obj) {
                        // функция обратного вызова
                        if (fn_change) {
                            fn_change(obj.id, true);
                        }
                    }
                }, this))

                this.changeLegendTemplate(this.currentLegendTemplate);
            }
        },

        /**
         * Смена шаблона легенды
         * @param index
         * @param verification - проверять текущий шаблон на значение индекса
         */
        changeLegendTemplate: function(index, verification) {
            // this.legendtemplates[this.layer.idLayer].layertemplates = JSON.parse(JSON.stringify(legendtemplates));
            this.legendtemplates[this.layer.idLayer].current = index;
            this.writeCookie();

            if (verification && this.currentLegendTemplate == index) {
                return;
            }
            this.currentLegendTemplate = index;

            this.legendSettingsControl.init({
                'legend': this.legendItems,
                'parentSelector': '#' + this.popupSettigsId,
                'legendtemplates': this.layertemplates,
                'currenttemplate': this.currentLegendTemplate,
                'fn_save': GWTK.Util.bind(this.saveLegendtemplates,this)
            });

            this.items = this.legendSettingsControl.getSavedTemplateItems(this.legendItems, this.layertemplates[this.currentLegendTemplate], (this.itemsEmpty = true));

            this.updateView();
        },

        /**
         * Сохранение шаблона после его редактирования
         * @param legendtemplates
         * @param current
         */
        saveLegendtemplates: function(legendtemplates, current){
            if (legendtemplates) {
                this.layertemplates = JSON.parse(JSON.stringify(legendtemplates));
                if (!this.legendtemplates[this.layer.idLayer]){
                    this.legendtemplates[this.layer.idLayer] = {
                        'current': current,
                        'layertemplates': []
                    }
                }
                this.legendtemplates[this.layer.idLayer].layertemplates = JSON.parse(JSON.stringify(legendtemplates));
                this.legendtemplates[this.layer.idLayer].current = current;
                this.currentLegendTemplate = (current) ? current : 0;
                this.writeCookie();

                this.initLegendTemplatesList(GWTK.Util.bind(this.changeLegendTemplate,this));
            }
        },

        /**
         * Окно настройки объектов легенды
         * @param legendsettings
         */
        legendSettingsPopup: function(layertemplates, fn_save, id, layer) {

            layer = (layer) ? layer : this.layer;
            if (layer instanceof GWTK.graphicLayer) {
                return;
            }

            layertemplates = (layertemplates) ? layertemplates : this.layertemplates;
            id = (id) ? id : this.popupSettigsId;
            var param =
                {
                    'legend': this.legendItems,
                    'parentSelector': '#' + id,
                    'legendtemplates': layertemplates,
                    'currenttemplate': this.currentLegendTemplate,
                    'fn_save': GWTK.Util.bind(function (layertemplates, currenttemplate) {
                        if (fn_save) {
                            fn_save(layertemplates, currenttemplate);
                            this.itemsEmpty = true;
                        }
                    })
                };

            // Стартовать окно с настройками
            var _that = this;
            $().w2popup('open', {
                title: w2utils.lang('Setting the list of objects') + ': ' + this.layer.alias,
                body: '<div id = "' + id + '" style="width: 100%; height: 100%;"></div>',
                style: 'padding: 10px 10px 10px 10px; background: #ffffff;',
                width: 700,
                height: 700,
                overflow: 'hidden',
                modal     : true,
                speed: '0.3',
                showClose: true,
                showMax: true,
                onMax: function (event) {
                    event.onComplete = function (event) {
                       // $('#' + id).height(event.options.height);
                        GWTK.MapEditorUtil.height(id, event.options.height);
                        _that.legendSettingsControl.resize();
                    };
                },
                onMin: function (event) {
                    event.onComplete = function () {
                        // $('#' + id).height(event.options.height);
                        GWTK.MapEditorUtil.height(id, event.options.height);
                        _that.legendSettingsControl.resize();
                    };
                },
                onToggle: function (event) {
                    $(w2ui[_that.legendSettingsControl.id].box).hide();
                    event.onComplete = function () {
                        GWTK.MapEditorUtil.show(w2ui[_that.legendSettingsControl.id].box);
                        _that.legendSettingsControl.resize();
                    };
                },
                onOpen: function (event) {
                    event.onComplete = function () {
                        $('.w2ui-msg-title').css({
                            'background': '#ffffff',
                            'border': 'none',
                            'padding-left': '20px',
                            'text-align': 'left'
                        });
                        param.popupobject = this;
                        if (!_that.legendSettingsControl) {
                            if (layer instanceof GWTK.graphicLayer == false)
                                _that.legendSettingsControl = new GWTK.LegendSettingsControl(
                                    _that.map);
                        }
                        _that.legendSettingsControl.show(param);
                    };
                },
                onClose: function () {
                    if (_that.legendSettingsControl) {
                        _that.legendSettingsControl.hide();
                    }
                }
            });
         },

        /**
         * Изменение размера кнопок
         */
        changeSizeButton: function(size){
            var el = $('div[name="' + this.panelId + 'stylefree"]');
            if (el.length > 0) {
                el.removeClass('control-buttons-small');
                el.removeClass('control-buttons-middle');
                el.removeClass('control-buttons-large');
                el.addClass('control-buttons-' + size);
                // this.options.buttonsize = size;
                // this.writeCookie();
            }
            el = $('.legend_img_editor');
            if (el.length > 0) {
                el.removeClass('control-buttons-small');
                el.removeClass('control-buttons-middle');
                el.removeClass('control-buttons-large');
                el.addClass('control-buttons-' + size);
            }

            // Отошлем триггер на смену размера иображения
            $(this.map.eventPane).trigger({
                type: 'GWTK.MapeditLegend.changeSizing',
                cssclass: 'control-buttons-' + size
            });

            this.options.buttonsize = size;
            this.writeCookie();
        }

    };

    /**
     * Компонент кнопок для изменения размеров чего-либе
     * @param parentSelector - селкектор родителя
     * @param options = {
     *     size: "small", "middle" или "large"
     *     fn_callback: функция возврата с параметром "small", "middle" или "large"
     * }
     * @constructor
     */
    GWTK.ChangeSizing = function (parentSelector, options) {

        this.toolname = 'changesizing';
        this.error = true;

        if (!parentSelector) {
            return;
        }
        this.parentSelector = $(parentSelector);
        this.error = false;
        this.panelId = this.toolname + GWTK.Util.randomInt(150, 200);

        this.options = {
            size: 'small',
            fn_callback: null
        }

        if (options) {
            $.extend(this.options, options);
        }

        this.init();
    };

    GWTK.ChangeSizing.prototype = {

        init: function(){

            this.parentSelector.empty();

            this.parentSelector.append(
                '<div id="' + this.panelId + 'small' + '" name = "' + this.panelId + 'changesize" class="control-button-size control-button-radio clickable control-button-size-small"  Title="' + w2utils.lang("Small") + '"> </div> ' +
                '<div id="' + this.panelId + 'middle' + '" name = "' + this.panelId + 'changesize" class="control-button-size control-button-radio clickable control-button-size-middle"  Title="' + w2utils.lang("Middle") + '"> </div> ' +
                '<div id="' + this.panelId + 'large' + '" name = "' + this.panelId + 'changesize" class="control-button-size control-button-radio clickable control-button-size-large"  Title="' + w2utils.lang("Large") + '"> </div> '
            );

            // Событие на нажати кнопок смены размеров
            var el = $('div[name="' +  this.panelId + 'changesize"]');
            el.click(
                GWTK.Util.bind(function(event){
                    if (event && event.target) {
                        $('div[name="' +  this.panelId + 'changesize"]').removeClass('control-button-size-active');
                        if (event.target.id) {
                            $('#' + event.target.id).addClass('control-button-size-active');
                        }

                        var size = 'small';
                        if (event.target.id == this.panelId + 'small') {
                            size = 'small';
                        }
                        else {
                            if (event.target.id == this.panelId + 'middle') {
                                size = 'middle';
                            }
                            else {
                                if (event.target.id == this.panelId + 'large') {
                                    size = 'large';
                                }
                            }
                        }

                        if (this.options.fn_callback) {
                            this.options.fn_callback(size);
                        }
                    }
                }, this));

            $('#' + this.panelId + this.options.size).click();

        },

        destroy: function(){
            if (this.parentSelector) {
                this.parentSelector.empty();
            }
        },

        show: function(show) {
            if (show) {
                GWTK.MapEditorUtil.show(this.parentSelector[0]);
            }
            else {
                GWTK.MapEditorUtil.hide(this.parentSelector[0]);
            }
        }


    };


    }