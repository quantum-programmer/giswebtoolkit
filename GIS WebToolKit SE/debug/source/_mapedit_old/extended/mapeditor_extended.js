/************************************** Соколова  ***** 04/06/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Редактор объектов карты (расширения)                   *
 *                                                                  *
 *******************************************************************/


if (window.GWTK) {


    /**
     * Задача редактор карты
     * @class GWTK.mapeditorTaskExtended
     * @constructor GWTK.mapeditorTaskExtended
     * @param id {String} Идентификатор объекта
     * @param map {Object} Объект карты
     * @param param {Object} Параметры редактора
     * {"maplayersid": ["", ""]            // редактируемые слои
     *   , "functions": []                 // функциональные возможности ("create", "edit", "delete" или *)
     *   , "editingdata" : [               // маска: редактируемые данные (объекты, семантики объектов), при отсутствии - редактируются все объекты слоя
     *       {   "layerid": ""             // идентификатор редактируемого слоя
     *           , "objects": [            // список объектов
     *               {
     *                   "code": ""        // код объекта (использовать для серии объектов)
     *                   , "key": ""         // ключ объекта (использовать для одиночных объектов)
     *                   , "semantics": [ "","" ]  // список кодов семантик
     *               },...
     *           ] }, ...
     *   ], "selectlayersid": ["", ...] }  //  Массив идентификаторов слоев, участвующих в выборе
     *                                         объектов для привязки и топологии.
     *                                         При отсутствии параметра работа идет со всеми слоями, в которых параметр слоя selectObject = 1
     *   , "transaction": "true"           //  Отмена и восстановление серверных операций над объектами карты,
     *                                     //  при значении «true» - появляются кнопки отмены операций на сервере.
     *   , "info": ["semantics", "metrics"]//Наличие окна с детализированной информации об объекте:
     *                                       - отсутствие параметра или ‘*’ – детализация по атрибутам и геометрии объекта,
     *                                       - пустой массив – детализация отсутствует,
     *                                       - массив заданных значений, ограничения:
     *                                       «semantics» - детализация атрибутов,
     *                                       «metrics» -  детализация геометрии
     *   , graphic                          // 1 - обрабатывать графические объекты карты
     *   , modelite                         // 1 - облегченная версия без шаблонов, графических объектов и легенды в виде таблицы
     *
     * @param bt_selector {String}  - селектор кнопки, инициировавшей задачу
     */

    // Задача редактор карты
    GWTK.mapeditorTaskExtended = function (id, map, param, bt_selector, autonomous) {
        this.error = true;

        // Переменные класса
        this.toolname = 'mapeditorTask';
        this.bt_selector = bt_selector;
        GWTK.mapeditorTaskExtended.prototype.__proto__ = GWTK.MapTask.prototype;
        GWTK.MapTask.call(this, map);    // родительский конструктор

        if (!map) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        if (!param || !param.functions) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " param.");
            return;
        }

        this.map = map;                           // объект карты
        this.param = param;

        // Обработка графических объектов карты
        if (this.param.graphic == undefined){
            this.param.graphic = true;
        }

        // уникальный идентификатор объекта
        this.id = (id) ? id : this.map.divID + '_' + this.toolname + 'Pane';

        // Имя текущей задачи
        this.currentTask = null;
        this.getShortTaskName = function(name){
            switch(name){
                case 'create':
                    return w2utils.lang("Create object");
                case 'edit':
                    return w2utils.lang("Edit object");
                case 'delete':
                    return w2utils.lang("Deleting");
                case 'move':
                    return w2utils.lang("Moving, scaling, rotating");
                case 'merge':
                    return w2utils.lang("Merging");
                default:
                    return '';
            }
        }

        // Текущий Action
        this.currentAction = null;
        this._ischange = false;

        // идентификаторы кнопок задачи
        this.button_ids = {
            'create': 'edcreate_' + this.id           // кнопка создания
            , 'edit': 'ededit_' + this.id             // кнопка редактирования
            , 'setting': 'edsetting_' + this.id       // кнопка параметров
            , 'process': 'edprocess_' + this.id       // панель для кнопок процесса (откаты, сохранение, отмена)
            , 'save': 'edsave_' + this.id             // сохранение
            , 'cancel': 'edcancel_' + this.id         // отказ
            , 'delete': 'eddelete_' + this.id         // удаление объекта
            , 'move': 'edmove_' + this.id             // перемещение объекта
            , 'merge': 'edmerge_' + this.id           // сшивка объекта
            // , 'infolog': 'edinfolog_' + this.id             // Информация по журналу операциям

        };

        this.functions = ["create", "edit", "delete", "group"];  // функции редактора
        this.info = ["semantics", "metrics"];                    // наличие информации по семантике или метрике

        // Жунал всех операций
        this.transactionsLog = new GWTK.EditorTransactionsLog(this.map, this);

        // история локальных изменений
        this.history = new GWTK.EditorHistory(this);

        this.init();

        // замкнуть контекст вызова функций
        this.bind();

        // идентификаторы для визуальных компонентов
        this.popupId = 'popupmenu' + GWTK.Util.randomInt(150, 200);
        this.maplistId = 'maplist' + GWTK.Util.randomInt(150, 200);

        // Идентификатор  панелей редактора
        this.panelsId = {
            'editor': null,     // основная
            'main': null,       // главная
            'info': null,       // информация об объекте
            'tools': null      // панель инструментов
        }

        // Префикы
        this._drawOverlayPane = 'mapobject-overlayPane_';
        this.preInfoTabs = 'editdetail';
        this.preInfoTab = 'selected-tab';
        this.extraAction = '_extra' + GWTK.Util.randomInt(150, 200);

        // Параметры для диалога семантики
        this.semanticoptions = {
            "graphic": false,
            "autonomic": false
        };
        this.semanticoptions.buttons = {
            "restore": false,
            "delete": true,
            "repeat": true,
            "save": false,
            "allsemantics": true,
            "hidden": true
        };

        this.semanticoptions_graphic = {
            "graphic": true,
            "autonomic": false
        };
        this.semanticoptions_graphic.buttons = {
            "restore": false,
            "delete": true,
            "save": false
        };

        this.zIndex = $(this.map.drawPane).css('zIndex');

        // Макеты для создания объектов
        this.mapeditTemplates = null;

        // Класс легенды
        this.legend = null;

        // Класс панели для расширения режимов редактирования
        this.mapeditExtendMethods = null;
        this.panelExtend = null;

        // Признак автономного запуска
        this.autonomous = autonomous;

        this.error = false;

        // Флаги незавершеных операций
        this.isSave = false;   // Сохранение

        // Инициализация графического объекта линией
        this.initNodeGraphic = function(){
            return {
                id: null,
                code: (this.graphic) ? 'line' : '',
                key: (this.graphic) ? 'line' : '',
                local: (this.graphic) ? '0' : '',
                text: (this.graphic) ? w2utils.lang('Line') : '',
                img: null,
                bsdlayer: null,
                graphic: (this.graphic) ?  new GWTK.MapeditLegendDraw_Line().saveJSON() : '',
                title: null
            }
        }

        // Последний выбранный код объекта
        this.initEditNodeLast = function (node, layerxId) {
            layerxId = (layerxId) ? layerxId : 0;
            // Для Графических слоев заполнение по умолчанию
            if (!node && this.graphic) {
                node = this.initNodeGraphic();
            }
            this.editNodeLast = {
                // "node" : (node) ? JSON.parse(JSON.stringify(node)) : null,
                "node": (node) ? {
                    id: node.id,
                    code: node.code,
                    key: node.key,
                    local: (node.code || node.key) ? node.local : '0',
                    text: node.text,
                    img: node.img,
                    bsdlayer: node.bsdlayer,
                    graphic: (node.graphic) ? JSON.parse(JSON.stringify(node.graphic)) : '',
                    title: node.title
                } : null,
                 "layerxId": layerxId
            };
        }

        this.initEditNodeLast();

        // Функция инициализации текущей точки объекта
        this.initSelectPoint = function(selectpoint){
            selectpoint = (selectpoint) ? selectpoint : {
                id: null,
                domElement: null
            }
            this.selectPoint = {
                id: selectpoint.id,
                domElement: selectpoint.domElement
            }
        }
        this.initSelectPoint();

        // TODO!!! Подмена фукциионала а графическом слое GWTK.graphicLayer !!!!!!!!!!!!!!!
        // TODO!!! Потом (когда будет готово draw) перенести в класс GWTK.graphicLayer
        /**
         * Получение семантики указанного типа объекта
         * @method getSemByObjKey
         * @private
         * @param key {String} Тип объекта
         * @return {Object} Объект семантики в формате JSON
         */
        GWTK.graphicLayer.prototype.getSemByObjKey = function (key) {
            var sample = {
                "code": "",
                "local": "",
                "name": "",
                "key": "",
                "rscsemantics": [],
                "cssimage": ""
            };
            if (key) {
                key = key.toLowerCase();
                switch (key) {
                    case "line" :
                    case "linestring":
                        sample["code"] = "Line";
                        sample["local"] = "0";
                        sample["name"] = w2utils.lang("Line");
                        sample["key"] = "Line";
                        break;
                    case "polygon" :
                        sample["code"] = "Polygon";
                        sample["local"] = "1";
                        sample["name"] = w2utils.lang("Polygon");
                        sample["key"] = "Polygon";
                        break;
                    case "point" :
                        sample["code"] = "Point";
                        sample["local"] = "2";
                        sample["name"] = w2utils.lang("Marker");
                        sample["key"] = "Point";
                        break;
                    case "title" :
                        sample["code"] = "Title";
                        sample["local"] = "3";
                        sample["name"] = w2utils.lang("Title");
                        sample["key"] = "Title";
                        break;
                }

                // Семантики Наименование и Комментарии
                sample["rscsemantics"] = [
                    {
                        code: "8",
                        decimal: "0",
                        defaultvalue: "0",
                        enable: "1", //"3"
                        maximum: "0",
                        minimum: "0",
                        name: w2utils.lang("Text"),
                        reply: "0",
                        service: "0",
                        shortname: "text",
                        size: "255"
                    },
                    {
                        code: "30",
                        decimal: "",
                        defaultvalue: "0",
                        enable: "1",
                        maximum: "0",
                        minimum: "0",
                        name: w2utils.lang("Comment"),
                        reply: "0",
                        service: "0",
                        shortname: "ObjCComm",
                        size: "255",
                        type: "0",
                        unit: ""
                    }
                ]
            }

            return sample;
        };

    };

    GWTK.mapeditorTaskExtended.prototype = {

        /**
         * ИНИЦИАЛИЗАЦИЯ И НАСТРОЙКА КЛАССА
         */
        init: function () {
            this.maplayersid = new Array();                          // массив редактируемых карт
            this.selectlayersid = new Array();                       // массив слоев, участвующий в веделении объектов

            // слой для создания объектов (по умолчанию первая из списка, иначе выбрать кнопкой)
            this.maplayerid = {"layerid": ""};
            this.layer = null;
            // Редактируемыe объекты
            this.editobjects = new Array();
            // Сохранияемые объекты
            this.editobjectsSave = new Array();
            // Сохранияемые объекты по слоям (в режиме топологии могут редактироваться объекты с разных слоев)
            this.editobjectsSaveByLayer = new Array();
            // флаг изменения объекта
            this.isChange(false);

            // Режим расширенного/сжатого информационного окна
            this.objectinfoExt = false;

            // Задачи редактора (назначаются  в функции setActiveTask по аттрибуту name кнопки, инициализируюшей задачу)
            this.mapeditorCreatingTask = null;
            this.mapeditorEditingTask = null;

            // Используется для определения стороннего разработчика
            this.notOurAction = null;

            // Заголовок для информационной строки статус бара
            this.titleMessage = w2utils.lang("Map editor") + '. ';

            /**
             *  Инструменты
             * @type {{create: {prefix: string, style: string, buttons: *[]}, edit: {prefix: string, style: string, buttons: Array}}}
             */
            this.tools = {
                'create': {
                    prefix: 'edcrmethod_',
                    style: 'control-button-edit-tools clickable',
                    buttons: [
                        {
                            name: 'free_line',
                            fn_click: this.onClickCreateTools,
                            caption: w2utils.lang("Any contour"),
                            fn_visible: null,
                            fn_disable: null,
                            style: ''
                        },
                        {
                            name: 'horizontal_rectangle',
                            fn_click: this.onClickCreateTools,
                            caption: w2utils.lang("Horizontal rectangle"),
                            fn_visible: null,
                            fn_disable: GWTK.Util.bind(this.disabledStyleTools, this),
                            style: ''
                        },
                        {
                            name: 'inclined_rectangle',
                            fn_click: this.onClickCreateTools,
                            caption: w2utils.lang("Inclined rectangle"),
                            fn_visible: null,
                            fn_disable: GWTK.Util.bind(this.disabledStyleTools, this),
                            style: ''
                        },
                        {
                            name: 'multi_rectangle',
                            fn_click: this.onClickCreateTools,
                            caption: w2utils.lang("Difficult rectangle"),
                            fn_visible: null,
                            fn_disable: GWTK.Util.bind(this.disabledStyleTools, this),
                            style: ''
                        },
                        {
                            name: 'circle',
                            fn_click: this.onClickCreateTools,
                            caption: w2utils.lang("Circle"),
                            fn_visible: null,
                            fn_disable: GWTK.Util.bind(this.disabledStyleTools, this),
                            style: ''
                        },
                        {
                            name: 'track',
                            fn_click: this.onClickCreateTools,
                            caption: w2utils.lang("My movements"),
                            fn_visible: function () {
                                return $('#panel_button-geolocation').length;
                            },
                            fn_disable: GWTK.Util.bind(
                                function () {
                                    var tool = this.map.mapTool("geolocation");
                                    if (!tool || !tool.process) {
                                        return 'disabledbutton';
                                    }
                                    return '';
                                }, this),
                            style: ''
                        },
                        {
                            name: 'file',
                            fn_click: this.onClickCreateTools,
                            caption: w2utils.lang("Loading from the file"),
                            fn_visible: function () {
                                return false
                            },
                            fn_disable: null,
                            style: ''
                        }
                    ]
                }
            };

            // Текущий инструмент создания
            this.currentToolName = 'free_line';
        },

        /**
         * Настройка класса
         * @method param
         */
        set: function (param) {
            if (!param || param instanceof Object == false)
                return;

            this.param = param;             // параметры редактора
            // Пока транзакции доступны всем, кто имеет право на редактирование
            //this.param.transaction = true;

            // Класс выделения объектов для отрисовки, чтоб не нагружать стандартный
            this.drawSelectFeatures = new GWTK.selectedFeatures(this.map, null,
                {
                    "stroke": this.map.selectedObjects.drawoptionsSelected.stroke,// "#00BA00",
                    "stroke-width": this.map.selectedObjects.drawoptionsSelected['stroke-width'], //"3px",
                    "stroke-opacity": "0.85",
                    "vector-effect": "non-scaling-stroke",
                    "fill": this.map.selectedObjects.drawoptionsSelected.fill,// "gray",
                    "background": "",
                    "background-size": "auto auto",
                    "fill-opacity": this.map.selectedObjects.drawoptionsSelected['fill-opacity'], //"0.3",
                    "font-family": "Verdana",
                    "font-size": "12px",
                    "letter-spacing": "1",
                    "startOffset": "2%",
                    "text": ""
                }
            );
            this.drawSelectFeatures.init();

            // Настройки для топологии, геометрии и прочее
            this.options = (param.options) ? JSON.parse(JSON.stringify(param.options)) :
                {
                    "topology": {
                        "limit": "5",                               // Допуск согласования точек (в м)
                        "captureradius": "5"                        // Радиус захвата (в м)
                    },
                    "geometry": {
                        "format": "BL",                              // Первоначальный формат отображения метрических данных "BL" или "BLgrad"(в гмс) ,
                        "precision_m": "8",                          // Точность при вводе координат в метрах
                        "precision_sec": "4",                        // Точность для ввода секунд при вводе координат в ГМС    (format = BLgrad)
                        "precision_grad": "8",                       // Точность для ввода градусов при вводе координат в градусах (format = BL)
                        "precision_h": "2",                          // Точность при вводе высоты
                        "visible_h": "0"                             // Первоначальное отображение высоты
                    },
                    "transaction": {                                 // Журнал транзакций
                        "startdate":                                 // Дата начала просмотра
                            {
                                "date": "" //new Date().getTime() - 2592000000
                                , "datestring": ""
                                //, "timestring": ""
                            },
                        "enddate":                                   // Дата окончания просмотра
                            {
                                "date": ""
                                , "datestring": ""
                                //, "timestring": ""
                            },
                        "servicerecord": 1
                    },
                    "autosave": 1,                                   // автоматически сохранять созданные объекты
                    "objectselectionInPoint": 0,                     // Выбор объекта в точке
                    "capturePoints": 1,
                    "captureVirtualPoints": 0
                };

            // Инициализация даты транзакций
            this.inittransactiondate('start');
            this.inittransactiondate('end');

            // Класс рисования объекта
            this.drawobject = new GWTK.DrawingObject(this.map, {
                'nocontextmenu': true,   // не отображать конткстное меню
                'func': {
                    'fn_parentpanel': this.getdrawpanel
                }
            }, this);

            // Класс топологии
            this.topology = new GWTK.Topology(this.map, {
                'selectlayersid': this.param.selectlayersid ? this.param.selectlayersid.slice() : [], // this.selectlayersid,
                'func': {
                    'fn_iseditingobject': this.iseditinglayer_object,
                    'fn_parentpanel': this.getdrawpanel,
                    'fn_drawcustom': this.draw
                },
                'topologyoptions': this.options.topology
            }, this);

            // заполним массив редактируемых карт
            this.setlayers();
            if (!this.layer) {
                if (this.currentTask) {
                    this.destroyTasks();
                    w2alert(w2utils.lang('There are no layers of editing'));
                }
            }

            if (this.param.functions && this.param.functions.length > 0 && this.param.functions[0] == '*') {                   // 08/10/15  Nefedeva
                this.param.functions = ["create", "edit", "delete"];
            }

            // заполним массив функций
            var count;
            if (this.param.functions && this.param.functions.length > 0) {
                count = this.param.functions.length;
                if (count >= 0) { // отдельные все режимы
                    this.functions.splice(0, this.functions.length);
                    for (var i = 0; i < count; i++) {
                        this.functions.push(this.param.functions[i]);
                    }
                }
            }

            // заполним массив детализации
            if (this.param.info) {
                if (this.param.info.length > 0 && this.param.info[0] == '*') {
                    this.param.info = ["semantics", "metrics"];
                }
                else {
                    count = this.param.info.length;
                    this.info.splice(0, this.info.length);
                    for (var i = 0; i < count; i++) {
                        this.info.push(this.param.info[i]);
                    }
                }
            }

            // Назначим события
            this.initActionEvent();
            this.initEvent();

        },

        /**
         * Замыкание контекста
         * @method bind
         */
        bind: function () {

            // Доступность кнопок
            this.disabledStyleTools = GWTK.Util.bind(this.disabledStyleTools, this);

            // this.onstopPropagation = GWTK.Util.bind(this.onstopPropagation, this);
            this.onUpdateMapObject = GWTK.Util.bind(this.onUpdateMapObject, this);
            this.onKeyDown = GWTK.Util.bind(this.onKeyDown, this);
            this.onVisibilityChanged = GWTK.Util.bind(this.onVisibilityChanged, this);
            this.onChangeDataSemantics = GWTK.Util.bind(this.onChangeDataSemantics, this);
            this.onChangeDataMetrics = GWTK.Util.bind(this.onChangeDataMetrics, this);
            this.onOverlayRefresh = GWTK.Util.bind(this.onOverlayRefresh, this);
            this.onSetAction = GWTK.Util.bind(this.onSetAction, this);
            this.onCloseAction = GWTK.Util.bind(this.onCloseAction, this);

            // Нажатие кнопок мыши
            this.onCtrlLeft = GWTK.Util.bind(this.onCtrlLeft, this);
            this.onCtrlRight = GWTK.Util.bind(this.onCtrlRight, this);

            // Контекстное меню
            this.onContextMenu = GWTK.Util.bind(this.onContextMenu, this);
            this.onContextMenuBody = GWTK.Util.bind(this.onContextMenuBody, this);

            // Прослушка кнопки геолокации
            this.onControlButtonClick = GWTK.Util.bind(this.onControlButtonClick, this);

            // Смена кода графического объекта
            this.onChangeGraphicParams = GWTK.Util.bind(this.onChangeGraphicParams, this);

            // Изменение параметров отрисовки и выделения объектоа карт
            this.onMarkingColorChanged = GWTK.Util.bind(this.onMarkingColorChanged, this);

            // Изменение размеров панели
            this.onResizeControlPanel = GWTK.Util.bind(this.onResizeControlPanel, this);

            this.onFeatureListClick = GWTK.Util.bind(this.onFeatureListClick, this);

        },

        /**
         * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
         */
        /**
         * Идентификатор панели редактора
         * @param panelId
         * @returns {*}
         */
        getPanelEditorId: function (panelId) {
            return !panelId ? this.panelsId['editor'] : panelId;
            // return (!panelId) ? this.panelId : panelId;
        },

        /**
         * Удаление содержимого панелей
         * @param paneSelector - селектор панели
         */
        emptyPane: function (paneSelector) {
            var qs = document.querySelector(paneSelector);
            if (qs) {
                qs.innerHTML = null;
            }
        },

        /**
         * Найти кнопку по задаче и названию
         * @param mode
         * @param name
         */
        findButton: function (tools, mode, name) {
            var find = false;
            if (!tools) {
                return find
            }
            var tools = tools[mode];
            if (tools.buttons) {
                find = tools.buttons.find(function (element) {
                    if (element.name == name) {
                        return element;
                    }
                });
            }
            return find;
        },

        /**
         * Изменить размер дочерних элементов по размеру панели
         */
        resize: function () {
            var panelId = this.getPanelEditorId();
            GWTK.MapEditorUtil.height(this.preInfoTabs + panelId + 'param', this.getHeightInfo(panelId).heightparam);
            if (this.rscsemantics) {
                this.rscsemantics.resize();
            }
        },

        /**
         * Запрос высоты окна информации
         * @param panelId
         * @returns {{heighttab: number, heightparam: string}}
         */
        getHeightInfo: function (panelId) {
            // var height = $('#' + panelId + 'info').height(),
            var height =  GWTK.MapEditorUtil.height(this.panelsId['info']),
                heighttab = 35, heightparam = '90%';
            if (height > 0) {
                heightparam = (height - heighttab).toString() + 'px';
            }
            return {
                'heighttab': heighttab,
                'heightparam': heightparam
            };
        },

        /**
         * ДОСТУПНОСТЬ ИНСТРУМЕНТОВ И ПАНЕЛЕЙ
         */
        /**
         *  Установить доступность кнопки по умолчанию
         */
        disabledButton: function (button) {
            if (!button) {
                return;
            }
            var disabled = (button.fn_disable && $.isFunction(button.fn_disable)) ? button.fn_disable() : '',
                qs = document.querySelector('div[name="' + button.name + '"]');

            if (qs) {
                if (disabled == '') {
                    GWTK.MapEditorUtil.removeClass(qs, 'disabledbutton');
                } else {
                    GWTK.MapEditorUtil.addClass(qs, 'disabledbutton');
                }
            }
        },

        /**
         * Доступность кнопок инструментов
         * disabledStyleTools
         * @mode {string}- режим ('create' или 'edit')
         * @spatialposition {string} - локализация  ('point', 'multipoint', 'title' , 'line', 'vector' и тд|
         */
        disabledStyleTools: function () {
            var disaled = '';
            var spatialposition = this.editobjects[0] ? this.editobjects[0].spatialposition : null;
            return (spatialposition && !GWTK.MapEditorUtil.isEnabledItemMenu(spatialposition, this.graphic)) ? 'disabledbutton' : disaled;
        },

        /**
         * Доступность панели списка карт
         * @param enable
         */
        enabledMaps: function (enable) {
            var elMaps = GWTK.MapEditorUtil.byId(this.panelsId['editor'] + 'maps');

            if (enable) {
                GWTK.MapEditorUtil.removeClass(elMaps, 'disabledbutton');
            }
            else {
                GWTK.MapEditorUtil.addClass(elMaps, 'disabledbutton');
            }
        },

        /**
         * Доступность панели списка карт
         * @param enable
         */
        enabledInfo: function (enable) {
            var el = GWTK.MapEditorUtil.byId(this.panelsId['info']);
            if (enable) {
                 GWTK.MapEditorUtil.removeClass(el, 'disabledbutton');
            }
            else {
                GWTK.MapEditorUtil.addClass(el, 'disabledbutton');
            }
        },

        /**
         * Обновить доступнорсть инструментов
         * @param taskname - наименование режима(задачи)
         */
        updateDisabledTools: function (taskname) {
            var tools;
            switch (taskname) {
                case 'create':
                    if (this.currentAction) {
                        if (this.currentAction.name == 'editing') {
                            tools = this.currentAction.tools['edit'];
                        }
                        else {
                            tools = this.tools[this.currentTask];
                        }
                    }
                    break;
                case'edit':
                    tools = this.tools;
                    break;
            }
            if (tools && tools.buttons) {
                for (var i = 0; i < tools.buttons.length; i++) {
                    this.disabledButton(tools.buttons[i]);
                }
            }
        },

        /**
         * СОЗДАНИЕ ПАНЕЛЕЙ
         */

        /**
         * Создание основной панели редактора карты
         * @method createPane
         */
        createPane: function (panelId) {

            this.panelsId['editor'] = panelId;
            this.panelsId['info'] = this.panelsId['editor'] + 'info';
            this.createPaneP(panelId);

             setTimeout(GWTK.Util.bind(function () {

                // Прочитаем куки
                this._readedCookie();

                    // Если режим создания имеется, то сразу запустить action на создание
                    if (this.layer && this.isfunction(this.functions, "create")) {
                        // this.setActiveTask("create");
                        GWTK.MapEditorUtil.click(this.panelsId['editor'] + this.button_ids.create);
                    }

             }, this), 200);

        },

        /**
         *  Разметить панель редактора
         *  parentSelector - селектор родительског окна (при необходимости)
         */
        createPaneP: function (panelId) {
            var map = this.map;
            if (!map) {
                return;
            }

            // карта (основной контейнер)
            this.panelsId['main'] = ((panelId) ? panelId : this.panelsId['editor']) + 'main';
            this.panelsId['tools'] = ((panelId) ? panelId : this.panelsId['editor']) + 'tools';

            var ep,
                minW = 550, // Ширина
                minH = 500, // Высота
                idpanel = this.panelsId['main'],
                panelId = this.getPanelEditorId(panelId);

            // Редактор в плавающей панели
            if (this.map.options.controlspanel) {
                ep = this.map.createPane('map-panel-def-flex divFlex editor-panel-flex', this.map.mapControls);
                ep.id = idpanel;
            }
            else {
                // карта (основной контейнер)
                var selectorMain = '#' + idpanel,
                    div = '<div id = "' + idpanel + '" class="divFlex" style="height: 100%;"></div>';

                // Добавим в родительский контейнер
                var parentSelector = (this.param && this.param.panels && this.param.panels.main && this.param.panels.main != '') ? this.param.panels.main : null;
                if (parentSelector) {
                    //ep = GWTK.MapEditorUtil.byId(selectorMain);
                    ep = GWTK.MapEditorUtil.byId(idpanel);
                    if (ep) {
                        this.destroy();
                    }
                    var parentEl = GWTK.MapEditorUtil.byId(parentSelector);
                    if (parentEl) {
                        var rect = parentEl.getBoundingClientRect();
                        if (rect) {
                           // minW = parseInt(rect.width).toString() + 'px;';
                            minW = parseInt(rect.width);
                        }
                    }
                    GWTK.MapEditorUtil.innerHTML(parentEl, div);
                    //ep = GWTK.MapEditorUtil.byId(selectorMain);
                    ep = GWTK.MapEditorUtil.byId(idpanel);
                }
                else {
                    if (map.container) {
                        ep = map.container.querySelectorAll(selectorMain);
                        if (ep.length > 0) {
                            this.destroy();
                        }
                        map.container.style.display = "flex";
                        map.mapPane.insertAdjacentHTML('beforebegin', div);
                        ep = map.container.querySelectorAll(selectorMain);
                        if (ep.length > 0) {
                            ep = ep[0];
                        }
                    }
                }

            }

            if (!ep) {
                console.log('Невозможно создать контейнер для компонента Редактор карты');
                return;
            }

            // Высота и ширина только при необходимости
            GWTK.MapEditorUtil.width(ep, minW.toString() + 'px');

            // Панель самостоятельная
            if (!this.map.options.controlspanel) {
                //this.map.resizing();
                $(window).resize();
            }
            else {
                this.resize();
            }


            GWTK.MapEditorUtil.innerHTML(ep,
                '<div  class="mapEditorDiv"  style="height:' + GWTK.MapEditorUtil.height(ep) + ';">' + // ' 100%;">' +
                // Заголовок
                '<div class="divHeader border-bottom"></div>' +
                // Тело   общее
                '<div class="divFlex" style="height:95%; flex-direction: column;">' + // надо высоту
                // Режимы
                '<div name="modes" class="divFlex border-bottom" >' +
                '<div id="' + panelId + 'modes" class="divFlex" style="height:40px; width:100%; margin-left: 5px; margin-right: 5px; margin-top: 5px; justify-content:space-evenly;"></div>' +
                '</div>' +

                // Тело
                '<div name="body" style="height:95%; overflow-y:auto; ">' +
                '<div class="divFlex" style="height:95%;">' +
                '<div class="divFlex" style="width: 100%; flex-direction: column; margin: 5px;">' +
                '<div id="' + panelId + 'templates" class="divFlex" style="flex-direction: column;"></div>' +
                // '<div id="' + panelId + 'info" class="divFlex" style="height:100%;"></div>' +
                '<div id="' + this.panelsId['info'] + '" class="divFlex" style="height:100%;"></div>' +
                '</div>' +
                // Инструменты
                // '<div class="divFlex" style="width:40px; height:100%; justify-content: center;">' +
                '<div class="divFlex" style="height:100%; justify-content: center;">' +
                '<div id="' + this.panelsId['tools'] + '" class="divFlex" style="height:100%; justify-content:flex-start;flex-direction: column;"></div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>'
            );

            $('.divHeader')[0].appendChild(GWTK.Util.createHeaderForComponent({
                map: map,
                name: 'Редактор карты',
                context: "mapeditorExt",
                minimizePanel: ep,
                callback: GWTK.Util.bind(function () {
                    // Найдем задачу "mapeditor"
                    var tool = this.map.mapTool("mapeditor");
                    if (tool) {
                        if (tool.closeTask(this)) {
                            tool.mapeditorTask = null;
                        }
                        ;
                    }
                }, this)
            }));

            this.createPaneMain(panelId);

            // Событие на минимизацию и восстановление панели
            $(this.map.eventPane).on('beforeminimizemappanel', GWTK.Util.bind(function (event, data) {
                if (data && data.context == 'mapeditorExt') {

                    // Врсстановление панели карты в 100%, иначе при работа идет с реальными размерами
                    $(this.map.mapPane).width('100%');

                }
            }, this));

            // Расширение режимов
            // --------------------
            // Панель дополнительных режимов окна редактора
            var idExtend = panelId + 'Extend';
            ep.insertAdjacentHTML('afterbegin', '<div id = "' + idExtend + '" class="map-panel-def ' + this.toolname + 'Templates-panel" ></div>');
            this.panelExtend = $('#' + idExtend);
            // Создадим класс панели для расширенных режимов
            this.mapeditExtendMethods = new GWTK.MapeditExtendMethodsExt(this.map, this.panelExtend);
            if (this.mapeditExtendMethods.error) {
                this.mapeditExtendMethods = null;
            }

            $(ep).resizable({
                handles: "e",
                minWidth: minW - 100,
                maxWidth: $(map.container).width() / 2,
                start: GWTK.Util.bind(function (event, ui) {
                }, this),
                stop: function (event, ui) {
                    if (event && event.type == 'resizestop' && ui.size) {
                        $(map.mapPane).width($(map.container).width() - ui.size.width);
                    }
                }
            });

        },

        /**
         * Создание основной панели редактора
         * @param panelId
         */
        createPaneMain: function (panelId) {

            panelId = this.getPanelEditorId(panelId);

            // Панель режимов
            this.createPaneModes(panelId + 'modes', panelId);

            // Если есть режим создания
            if (this.isfunction(this.functions, "create")) {

                var el = GWTK.MapEditorUtil.byId(panelId + 'templates');
                if (el) {
                    GWTK.MapEditorUtil.empty(el);
                    GWTK.MapEditorUtil.innerHTML(el, this.createPaneTemplates(panelId));
                }
                // Создадим класс макетов
                var panelTemplates = $('#' + panelId + 'map_templates');
                if (!this.param.modelite && panelTemplates.length > 0) {
                    this.mapeditTemplates = new GWTK.MapeditTemplatesExt(
                        this.map, panelTemplates[0],

                        // fn_start
                        GWTK.Util.bind(function (node) {

                            var currentTask = this.currentTask;
                            if (this.editobjects[0]) {
                                currentTask = this.getTaskByGID(this.editobjects[0].gid);
                            }

                            this.setLegendCode(node.key, 'key', node, true);
                            // Если нет текущей задачи, то создадим 'create'
                            if (!currentTask) {
                                // Создадим новый объект
                                this.createNewMapObject(null, GWTK.Util.bind(
                                    function (mapobject) {
                                        this.initDataMapObject(node, GWTK.bind(function(){
                                            // Запустим задачу создания
                                            GWTK.MapEditorUtil.click(this.panelsId['editor'] + this.button_ids.create);
                                        }, this));
                                        // // Запустим задачу создания
                                        // GWTK.MapEditorUtil.click(this.panelsId['editor'] + this.button_ids.create);
                                    }, this));

                                //   // Запустим задачу создания
                                // //  $('#' + this.panelId + this.button_ids.create).click();
                                //   $('#' + this.panelsId['editor'] + this.button_ids.create).click();
                            } else {
                                // Просто сменим код создаваемому объекту
                                this.initDataMapObject(node);
                            }

                        }, this),

                        GWTK.Util.bind(function (node) {
                            if (!node.startNew) {  // Отжали кнопку
                                this.initEditNodeLast(null, this.layer.xId);
                                this.unsetLegendCode(node.key, 'key', node);
                                // Если было создание, то завершим
                                if (this.editobjects[0] && this.getTaskByGID(this.editobjects[0].gid) == 'create') {
                                    this.cancelClick();
                                }
                            }

                            return true;
                        }, this)

                        , true);

                    if (this.mapeditTemplates.error)
                        this.mapeditTemplates = null;
                }


                // Установить список карт (при выборе карты идет заполнение лкна информации)
                GWTK.MapEditorUtil.empty(this.maplistId);

                this.setSelectMaps('#' + this.maplistId, false,
                    GWTK.Util.bind(function (layer) {
                        this.changeLayer(layer);
                     }, this),
                    GWTK.Util.bind(function (layer) {
                        this.changeLayer(layer);
                    }, this));
            }
        },

        /**
         *  Создание панели режимов
         * @returns {string}
         */
        createPaneModes: function (parentId, panelId) {

            // this.emptyPane('#' + parentId);
            GWTK.MapEditorUtil.empty(parentId);

            panelId = this.getPanelEditorId(panelId);

            var
                htmlcreate = this.isfunction(this.functions, "create") ?  // кнопка создания объекта
                    '<div id="' + panelId + this.button_ids.create + '" name = "create" class="control-button control-button_addmenu control-button_edcreate control-button-radio clickable" Title="' + w2utils.lang("Create object") + '"> </div> ' : '',
                isedit = this.isfunction(this.functions, "edit"),
                htmledit = isedit ? // кнопка редактирования
                    '<div id="' + panelId + this.button_ids.edit + '"  name = "edit"  class="control-button control-button_addmenu control-button_ededit control-button-radio clickable" Title="' + w2utils.lang("Edit object") + '"> </div> ' : '',
                // При автономном режиме не запускать перемещение
                htmlmove = isedit && (!this.autonomous) ? // кнопка перемещения выделенных объектов
                    '<div id="' + panelId + this.button_ids.move + '"  name = "move"  class="control-button control-button_addmenu control-button_edmove control-button-radio clickable" Title="' + w2utils.lang("Moving, scaling, rotating") + '"> </div> ' : '',
                htmlmerge = isedit && (!this.autonomous) ? // кнопка сшивки объектов
                    '<div id="' + panelId + this.button_ids.merge + '"  name = "merge"  class="control-button control-button_addmenu control-button_edmerge control-button-radio clickable" Title="' + w2utils.lang("Merging") + '"> </div> ' : '',
                htmldelete = this.isfunction(this.functions, "delete") ? // кнопка удаления
                    '<div id="' + panelId + this.button_ids['delete'] + '" name = "delete" class="control-button control-button_addmenu control-button_eddeleteobject control-button-radio clickable" Title="' + w2utils.lang("Deleting") + '"> </div> ' : '',

                // параметры редактора
                htmlparams = '<div id="' + panelId + this.button_ids.setting + '"  name = "setting" class="control-button border-button control-button_addmenu control-button_edsetting clickable" Title="' + w2utils.lang("Options") + '"> </div> ',

                // кнопки процесса
                save = '<div id="' + panelId + this.button_ids.save + '"  name = "save" class="control-button border-button control-button_edsave control-button_addmenu clickable disabledbutton" Title="' + w2utils.lang("Save") + '"> </div> ',
                cancel = '<div id="' + panelId + this.button_ids.cancel + '"  name = "cancel" class="control-button border-button control-button_edcancel control-button_addmenu clickable disabledbutton" Title="' + w2utils.lang("Cancel") + '"> </div> ',
                // infolog = '<div id="' + panelId + this.button_ids.infolog + '"  name = "infolog" class="control-button control-button_edinfolog control-button_addmenu clickable" Title="' + w2utils.lang("Cancel") + '"> </div> ',

                htmlprocess =
                    '<div id="' + panelId + this.button_ids.process + '" name="process" class="divFlex" > ' +
                    save +
                    cancel +
                    // infolog +
                    '</div> ',

                newid = 'transaction',

                htmlhistory = GWTK.Util.parseBoolean(this.param.transaction) ? this.htmlHistory(newid) : '', // кнопки откатов по транзакциям

                regime_panel =
                    '<div class="mapEditorDiv divFlex">' +
                    htmlcreate +
                    htmledit +
                    htmlmove +
                    htmlmerge +
                    htmldelete +
                    '</div>' +

                    // Параметры редактора
                    '<div class="mapEditorDiv divFlex divFlexEnd" >' +
                    htmlparams +
                    '</div>' +

                    '<div class="mapEditorDiv divFlex divFlexEnd">' +
                    // кнопки отката
                    htmlhistory +

                    // кнопки процесса
                    htmlprocess +

                    '</div>';

             GWTK.MapEditorUtil.innerHTML(parentId, regime_panel);

            // События на кнопки
            //------------------

            // Сохранение
            GWTK.MapEditorUtil.addEventListener(this.panelsId['editor'] + this.button_ids.save,
                'click', GWTK.Util.bind(function (event) {
                this.saveClick();
            }, this));

            // Завершить режим (обработчик)
            GWTK.MapEditorUtil.addEventListener(this.panelsId['editor'] + this.button_ids.cancel,
                'click', GWTK.Util.bind(function (event) {
                    this.cancelClick();
                }, this));

            // события кнопок отката транзакций
            $('.mapeditingAddmenu_transaction').click(GWTK.Util.bind(
                function (event) {
                    if (!event.target || !event.target.id)
                        return;
                    if (event.target.id.indexOf('_prev') >= 0)
                        this.restoreTransaction('UNDOLASTACTION', event.target.title);
                    else
                        this.restoreTransaction('REDOLASTACTION', event.target.title);
                }, this));


            GWTK.MapEditorUtil.addEventListener(this.panelsId['editor'] + this.button_ids["create"],
                'click', GWTK.Util.bind(function (event) {
                this.modesClick($(event.target).attr("name"));
            }, this));

            // Редактирование
            GWTK.MapEditorUtil.addEventListener(this.panelsId['editor'] + this.button_ids["edit"],
                'click', GWTK.Util.bind(function (event) {
                this.modesClick($(event.target).attr("name"));
            }, this));

            // Перемещение
            GWTK.MapEditorUtil.addEventListener(this.panelsId['editor'] + this.button_ids["move"],
                'click', GWTK.Util.bind(function (event) {
                this.modesClick($(event.target).attr("name"));
            }, this));

            // Удаление
            GWTK.MapEditorUtil.addEventListener(this.panelsId['editor'] + this.button_ids["delete"],
                'click', GWTK.Util.bind(function (event) {
                this.modesClick($(event.target).attr("name"));
            }, this));

            // Сшивка
            GWTK.MapEditorUtil.addEventListener(this.panelsId['editor'] + this.button_ids["merge"],
                'click', GWTK.Util.bind(function (event) {
                this.modesClick($(event.target).attr("name"));
            }, this));

            // Параметры редактора
            GWTK.MapEditorUtil.addEventListener(this.panelsId['editor'] + this.button_ids["setting"],
                'click', GWTK.Util.bind(this.onInitOptions, this));

        },

        /**
         * Создание панели шаблонов
         */
        createPaneTemplates: function (panelId) {

            panelId = this.getPanelEditorId(panelId);

            var html =
                // Карта
                '<div id="' + panelId + 'maps" class="divFlex" >' + this.createPaneMaps(this.maplistId) + '</div>' +
                '<div id="' + panelId + 'objectlayername" class="divFlex errortext"></div>' +
                // Макеты
                '<div class="divFlex" style="margin-top:5px; margin-bottom:5px;">' +
                '   <div id="' + panelId + 'map_templates" class="divFlex" style="width:100%; justify-content:flex-start;">' + '</div>' +
                '</div>';

            return html;

        },

        /**
         *Создание панели списка слоев
         * @method createPaneMaps
         */
        createPaneMaps: function (listid) {
            var html =
                '<div style="width:100%;">' +
                '<div class="w2ui-field w2ui-span3">' +
                '<label style = "text-align:left !important; width: 50px; margin-top: 3px;">' +
                ((this.maplayersid.length > 1) ? w2utils.lang("Layers") : w2utils.lang("Layer")) +
                '</label>' +
                '</div>' +
                '   <input type="list" id="' + listid + '" style="width:85% !important;">' +
                // '   <select name = "list" id="' + listid + '" style="width:85% !important;">' +
                '</div>';
            return html;
        },

        /**
         *Создание панели шаблонов кодов
         * @method createPaneClassifierTempates
         */
        createPaneInfo: function (panelId) {

            panelId = this.getPanelEditorId(panelId);
            var detailid = this.preInfoTabs + panelId,
                _id = this.preInfoTab + panelId;

            // Удалим компонент
            this.destroyCharacteristicsInfo();
            // this.emptyPane('#' + panelId + 'info');
            this.emptyPane('#' + this.panelsId['info']);

            var heights = this.getHeightInfo(panelId);
            // $('#' + panelId + 'info').append(
            $('#' + this.panelsId['info']).append(
                '<div class="divFlex" style="width:100%; height: 100%; flex-direction: column;">' +
                '<div id = "' + detailid + '"  style="width:100%; height: ' + heights.heighttab + 'px; margin-top:5px;"></div>' +
                '<div id = "' + detailid + 'param"  style="width:100%; height: ' + heights.heightparam + '; ">' +
                '<div id="' + _id + 'View"  class="divFlex"  style="width:100%; height: 100%;"></div>' +
                '<div id="' + _id + 'Attributes"  class="divFlex"  style="width:100%; height: 100%;"></div>' +
                '<div id="' + _id + 'Geometry"  class="divFlex"  style="width:100%; height: 100%;"></div>' +
                '</div>' +
                '</div>'
            );

            // // Изменение высоты окна информации
            // $(window).resize(GWTK.Util.bind(function (event) {
            //     // $('#' + detailid + 'param').height(parseInt(this.getHeightInfo(panelId).heightparam));
            //     this.resize();
            // }, this));

            var tabs = [{id: _id + 'View', caption: w2utils.lang('View')}];
            if (this.isfunction(this.info, 'semantics')) {
                tabs.push({id: _id + 'Attributes', caption: w2utils.lang("Attributes")});
            }
            if (this.isfunction(this.info, 'metrics')) {
                tabs.push({id: _id + 'Geometry', caption: w2utils.lang("Geometry")});
            }

            // Закладки
            $('#' + detailid).w2tabs({
                name: detailid,
                style: 'background-color: transparent;',
                tabs: tabs,
                onClick: GWTK.Util.bind(function (event) {
                    this.setActiveTabInfo(event.tab);
                }, this)
            });

            // активная закладка
            if (!this.showTab) {
                this.showTab = 'View';
            }
            var w2ui_tabs = w2ui[detailid];
            if (w2ui_tabs) {
                w2ui_tabs.active = _id + this.showTab;
                w2ui_tabs.refresh();
                this.setActiveTabInfo(w2ui_tabs.get(w2ui_tabs.active));
            }

        },

        /**
         * Создать класс легенды
         * @param parentSelector
         */
        createLegend: function (panelId) {

            if (this.legend && !this.legend.error) {
                return true;
            }

            // Заполним состав объектов
            var id = this.preInfoTab + this.getPanelEditorId() + 'View',
                parentLegend = $('#' + id);
            if (parentLegend.length == 0) {
                // Создвть панель для информвации по объекту
                this.createPaneInfo();
            }
            this.legend = new GWTK.MapeditLegend(this.map, this.layer, '#' + id,
                {
                   // "graphic": this.param.graphic,
                    "graphic": (this.param.modelite) ? false : this.param.graphic,
                    "modelite":  this.param.modelite,
                    'fn_selectcode': GWTK.Util.bind(
                        function (node) {
                            var currentTask = this.currentTask;
                            if (this.editobjects[0]) {
                                currentTask = this.getTaskByGID(this.editobjects[0].gid);
                            }

                            // Если задача создания, то заполнить и активировать шаблон
                            if (currentTask == 'create') {
                                this.setTemplateRecord(node);
                                this.activeTemplateRecord(null, true);
                            }
                            // Если любая другая, то просо изменить тип объекта
                            if (currentTask) {
                                this.initDataMapObject(node);
                            }

                        }, this),

                    'fn_iseditingobjects': GWTK.Util.bind(this.iseditingobjects, this),
                    'fn_iseditingbyCodeList': GWTK.Util.bind(GWTK.MapEditorUtil.iseditingbyCodeList, this),
                    'fn_iseditingobject': GWTK.Util.bind(GWTK.MapEditorUtil.iseditingobject, this)
                }
            );

            if (this.legend.error) {
                this.destroyLegend();
                return false;
            }

            // Заполнить панель информации об объекте (Обновить текущую закладку)
            var tabs = w2ui[this.preInfoTabs + this.getPanelEditorId()];
            if (tabs && tabs.active != id) {
                tabs.active = id;
                tabs.refresh();
                this.setActiveTabInfo(tabs.get(id));
            }

            return true;
        },

        /**
         *  Создание панели инструментов
         * @returns {string}
         */
        createPaneTools: function (tools, mode, context) {
            var parentId = this.panelsId['tools'];

            this.clearPaneTools(parentId);
            if (!tools) {
                return;
            }
            if (!mode || mode == 'create') {
                if (this.isfunction(this.functions, "create")) {
                    mode = 'create';
                }
            }

            if (!mode) {
                return;
            }

            tools = tools[mode];
            if (tools.buttons) {
                if (!context) {
                    context = this;
                }
                var html = '<div class="mapEditorDiv divFlex" style="flex-direction: column;">';
                for (var i = 0; i < tools.buttons.length; i++) {
                    if (!tools.buttons[i].fn_visible || (tools.buttons[i].fn_visible && $.isFunction(tools.buttons[i].fn_visible) && tools.buttons[i].fn_visible())) {
                        html += '<div name = "' + tools.buttons[i].name + '" class="' + tools.style + ' ' + tools.prefix + tools.buttons[i].name + ' ' +
                            '" Title="' + tools.buttons[i].caption + '"> </div>';
                    }
                }

                html += '</div>';

                GWTK.MapEditorUtil.innerHTML(parentId, html);

                // Навесим доступность и события
                var el;
                for (var i = 0; i < tools.buttons.length; i++) {
                    this.disabledButton(tools.buttons[i]);
                    el = $('div[name="' + tools.buttons[i].name + '"]');
                    if (tools.buttons[i].fn_click && $.isFunction(tools.buttons[i].fn_click)) {
                        el.click(GWTK.Util.bind(tools.buttons[i].fn_click, context));
                    }
                    tools.buttons[i].selector = el.selector;
                }
            }
        },

        /**
         * ОПЕРАЦИИ, СВЯЗАННЫЕ С ЗАДАЧЕЙ
         */
        /**
         * Создать активную задачу по типу  режима
         * @method setActiveTask
         */
        setActiveTask: function (type, selectobject) {
            // При групповых операциях ничего не отключаем
            if (this.isGroupDeleteProcess)
                return;

            $(this.map.eventPane).off('controlbuttonclick', this.onControlButtonClick);

            // Убрать прослушку из шаблонов
            if (this.mapeditTemplates) {
                this.mapeditTemplates.setEvent('off');
            }
            $(this.map.eventPane).off('controlbuttonclick', this.onControlButtonClick);

            this.enabledInfo(false);

            switch (type) {
                case 'create':
                    // Закрыть обработчик
                    if (!this.changeCurrentAction()) {
                        return this.currentTask;
                    }
                    $(this.map.eventPane).on('controlbuttonclick', this.onControlButtonClick);

                    // Создать панель инструментов
                    this.createPaneTools(this.tools, type);
                    this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Create object"));
                    this.currentTask = type;

                    // Включить режим создания тот, что был до этого
                    var button = this.findButton(this.tools, 'create', (this.currentToolName) ? this.currentToolName : 'free_line');

                    if (button && button.selector) {
                        $(button.selector).click();
                    }
                    // Сделать доступной панель карт и легенду
                    this.enabledMaps(true);
                    this.enabledInfo(true);

                    // Добавить прослушку в шаблонах
                    if (this.mapeditTemplates) {
                        this.mapeditTemplates.setEvent('on');
                    }
                    break;

                case 'edit':
                    // Удалить все инструменты
                    this.clearPaneTools();
                    this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Edit object"));

                    // Устанвить задачу
                    this.currentTask = type;

                    if (!selectobject) {
                        // Смотрим среди выделенных
                        if (this.map.selectedObjects && this.map.selectedObjects.drawcurrobject) {
                            selectobject = this.map.selectedObjects.drawcurrobject;
                        }
                    }

                    // Если Нет или Есть, но подлежит редактированию
                    if (!selectobject || (selectobject && !this.onFeatureListClick(null, selectobject))) {
                        this.selectObject(this.onFeatureListClick);
                    }
                    break;

                case 'delete':
                    // Удалить все инструменты
                    this.clearPaneTools();
                    this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Remove objects"));

                    // Устанвить задачу
                    this.currentTask = type;

                    if (!selectobject) {

                        // Смотрим среди выделенных
                        if (!this.isGroup(type,
                            GWTK.Util.bind(function () {
                                // Запуск окна для перебора выбранных объектов
                                if (!this.groupcontrol)
                                // this.groupcontrol = new GWTK.QueryGroupMapObjectsControlExt(this.map, $('#' + this.paneMainId)[0], type, this.editobjects,
                                    this.groupcontrol = new GWTK.QueryGroupMapObjectsControlExt(this.map, $('#' + this.panelsId['main'])[0], type, this.editobjects,
                                        GWTK.Util.bind(this.onGroupSave, this));
                                else
                                    this.groupcontrol.set(type, this.editobjects);

                                // Сделать недоступной главную панель редактора
                                $('.mapEditorDiv').addClass("disabledbutton");

                                this.isGroupDeleteProcess = true;

                                // $(this.map.eventPane).one('mapeditor_group', GWTK.Util.bind(this.onGroupSave), this);
                                // GWTK.DomUtil.setActiveElement('#' + this.button_ids[type]);
                                GWTK.MapEditorUtil.setActiveElement(this.button_ids[type]);

                            }, this),
                            GWTK.Util.bind(function () {
                                this.selectObject(this.onFeatureListClick);
                            }, this)
                        )) {
                            // не нашли среди выделенных
                            this.selectObject(this.onFeatureListClick);
                        }
                    }
                    else {
                        // Если Есть, но подлежит редактированию
                        if (!this.onFeatureListClick(null, selectobject)) {
                            this.selectObject(this.onFeatureListClick);
                        }
                    }

                    break;

                case 'move':
                    // Удалить все инструменты
                    this.clearPaneTools();
                    this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Moving, scaling, rotating"));

                    // Устанвить задачу
                    this.currentTask = type;

                    if (!selectobject) {

                        // Смотрим среди выделенных
                        if (!this.isGroup(type,
                            GWTK.Util.bind(function () {
                                this.processMoving();
                            }, this),
                            GWTK.Util.bind(function () {
                                this.selectObject(this.onFeatureListClick);
                            }, this)
                        )) {
                            // не нашли среди выделенных
                            this.selectObject(this.onFeatureListClick);
                        }
                    }
                    else {
                        // Если Есть, но подлежит редактированию
                        if (!this.onFeatureListClick(null, selectobject)) {
                            this.selectObject(this.onFeatureListClick);
                        }
                    }
                    break;

                case 'merge':
                    // Удалить все инструменты
                    this.clearPaneTools();
                    this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Merging"));

                    // Устанвить задачу
                    this.currentTask = type;

                    // Инииировать класс
                    this.mapeditMerging = new GWTK.MapeditorMerging(this, this.map);

                    break;

            }

            // Нажать кнопку
            if (type == this.currentTask) {
                if (this.button_ids[this.currentTask]) {
                    //GWTK.DomUtil.setActiveElement('#' + this.panelsId['editor'] + this.button_ids[this.currentTask]);
                    GWTK.MapEditorUtil.setActiveElement(this.panelsId['editor'] + this.button_ids[this.currentTask]);
                 }

                this.addmenu(null, 'transaction');

            }

            // // Запись в журнал
            // this.addTransactionWithOutHistory(null, 'changeregime', null, new GWTK.EditorTransactionLog({
            //     "mapalias": this.layer.alias,   // алиас карты
            //     "regime": this.getShortTaskName(this.currentTask),
            //     "result" : ""                   // результат
            // }));

            return this.currentTask;
        },

        /**
         * Запросить активную задачу
         * @method getActiveTask
         */
        getActiveTask: function () {
            switch (this.currentTask) {
                case 'create':
                    return this.mapeditorCreatingTask;
                case 'edit':
                    return this.mapeditorEditingTask;
                case 'delete':
                    if (this.map.taskManager._action && this.map.taskManager._action.name == this.currentTask)
                        return this.map.taskManager._action;
            }
        },

        /**
         * Это задача Редактора карты?
         * @method isOurTask
         * @returns {Boolean} true - процесс создания или редактировавния активен
         */
        isOurTask: function (task) {
            if (!task || !(task instanceof GWTK.mapeditorTaskExtended)) {
                return;
            }
            notOurAction = null;
            return true;
        },

        /**
         * Восстановить текущую задачу после закрытия обработчика
         * @method restoreTask
         * @param history {Boolean} = true - кнопки для истории, иначе кнопки для транзакций
         */
        restoreTask: function () {

            $(this.map.eventPane).trigger({type: 'w2confirm_close', toolname: this.toolname});

            this.clear();
            this.addmenu(null, 'transaction');

            // Если уже есть новый текущий action
            switch (this.currentTask) {
                case 'create':
                    if (this.currentAction && this.currentAction.name != 'editing') {
                        // Инициализировать его еще раз
                        this.currentAction.clear();
                        this.currentAction.set();
                    }
                    else {
                        // // Сбросим код легенды
                        // this.unsetLegendCode();
                        // Запустим задачу
                        this.setActiveTask(this.currentTask);
                    }
                    break;
                case 'edit':
                case 'move':
                case 'delete':
                case 'merge':

                    // Сбросим код легенды
                    this.unsetLegendCode();

                    this.setActiveTask(this.currentTask);
                    break;
            }

            // Нет текущей задачи
            if (!this.currentTask) {
                // Сделать доступной панель карт и легенду
                this.enabledMaps(true);
                this.enabledInfo(true);
            }

        },

        // /**
        //  * Восстановление задачи после отказа или сохранения по истечению времени
        //  * @private
        //  */
        // restoreTaskTimeout: function () {
        //     // setTimeout(
        //     //     GWTK.Util.bind(function () {
        //             console.log('1 restoreTaskTimeout ' + new Date() + ' ' + new Date().getMilliseconds());
        //             if (!this._isRestore) {
        //                 this.restoreTask();
        //                 this._isRestore = true;
        //             }
        //    //      }, this),
        //    //      500);
        //    // //     100);
        // },


        /**
         * Восстановление задачи после отказа или сохранения по истечению времени
         * @private
         */
        restoreTaskTimeout: function () {
            if (!this._isRestore) {
                setTimeout(
                    GWTK.Util.bind(function () {
                        this.restoreTask();
                        this._isRestore = true;
                    }, this),
                     500);
                    //     100);
            }
        },

        /**
         * Определить текущую задачу по идентифиатору объекта
         * @param gid
         * @returns {*|string}
         */
        getTaskByGID: function (gid) {
            var gmldata = GWTK.Util.parseGmlId(gid);
            if (gmldata.objid != '0') {
                if (this.currentTask == 'create') {
                    return 'edit';
                }
            }
            else {
                if (this.currentTask == 'edit') {
                    return 'create';
                }
            }
            return this.currentTask;
        },

        // Установить активную закладку
        setActiveTabInfo: function (tab) {
            if (!tab) {
                return;
            }

            // Скрыть все
            var panelId = this.getPanelEditorId(),
                elView, elAttributes, elGeometry;

            GWTK.MapEditorUtil.hide(elView = GWTK.MapEditorUtil.byId(this.preInfoTab + panelId + 'View'));
            GWTK.MapEditorUtil.hide(elAttributes = GWTK.MapEditorUtil.byId(this.preInfoTab + panelId + 'Attributes'));
            GWTK.MapEditorUtil.hide(elGeometry = GWTK.MapEditorUtil.byId(this.preInfoTab + panelId + 'Geometry'));

            this.showTab = null;
            switch (tab.caption) {
                case w2utils.lang('View'):
                    if (elView) {
                        GWTK.MapEditorUtil.show(elView);
                        GWTK.MapEditorUtil.height(elView, '100%');
                        this.showTab = 'View';
                        if (this.legend) {
                            this.legend.show(true);
                        }
                    }
                    break;
                case w2utils.lang('Attributes'):
                    GWTK.MapEditorUtil.show(elAttributes);
                    GWTK.MapEditorUtil.height(elAttributes, '100%');

                    var semantic;
                    if (this.editobjects && this.editobjects[0] && (semantic = this.editobjects[0].semantic)) {
                        if (!this.rscsemantics) {
                            var semantics;
                            if (this.editobjects.length > 1) {
                                semanticsArray = [];
                                for (var i = 0; i < this.editobjects.length; i++) {
                                    semanticsArray.push(GWTK.MapEditorUtil.getsemanticmask(semantic, this.editobjects[i], this.iseditinglayer(this.editobjects[i].maplayerid)));
                                }
                                // Собрать в один маiseditinglayerссив все одинаковые семантики
                                // TODO: Сделать редактирование общих семантик (хотя АГ говорил, что не надо)
                                semantics = null;
                            }
                            else {
                                semantics = GWTK.MapEditorUtil.getsemanticmask(semantic, this.editobjects[0], this.iseditinglayer(this.editobjects[0].maplayerid));
                            }
                            this.addsemanticEditor(semantics);
                        }
                    }
                    this.showTab = 'Attributes';
                    if (this.rscsemantics) {
                        this.rscsemantics.resize();
                    }
                    break;
                case w2utils.lang('Geometry'):
                    GWTK.MapEditorUtil.show(elGeometry);
                    GWTK.MapEditorUtil.height(elGeometry, '100%');

                    if (this.editobjects && this.editobjects.length == 1 && this.editobjects[0].geometry) {
                        this.options.geometry.action = this.getTaskByGID(this.editobjects[0].gid);
                        if (this.options.geometry.action) {
                            if (!this.metrics) {
                                this.options.geometry.size = [GWTK.MapEditorUtil.width(elGeometry), GWTK.MapEditorUtil.height(elGeometry)];
                                this.options.geometry.mapobject = this.editobjects[0];
                                // Добавим подпись
                                // if (this.editobjects[0].geometry.getText()) {
                                this.options.geometry.text = this.editobjects[0].geometry.getText();
                                // }
                                this.metrics = new GWTK.GeometryEditor(this.map, this.preInfoTab + panelId + 'Geometry', this.editobjects[0].geometry.saveJSON(true), this.options.geometry, 0);
                                if (this.metrics.error) {
                                    this.metrics = null;
                                }
                            }
                            else {
                                this.metrics.refresh(null, this.editobjects[0].geometry.getText());
                            }
                        }
                    }
                    this.showTab = 'Geometry';
                    break;
            }

        },


        /**
         * Вернуть старый код или сбросить изменения
         * @param node - информация о коде
         */
        restoreNode: function (node) {
            // Вернуть старый код
            if (this.editNodeLast.node) {
                this.setLegendCode(this.editNodeLast.node.id, 'id', this.editNodeLast.node, true);
            }
            else {
                // Сбросить выделенный
                this.unsetLegendCode(node.key, 'key', node);
            }
        },


        /**
         * Запрос на продолжение сохранения
         * @param onlysave
         */
        isSaveConfirm: function (node, onlysave) {
            // Если пришло из сохранения
            if (this.isSave) {
                var message = w2utils.lang("Continue saving?");
                if (!onlysave) {
                    message = w2utils.lang("Type selected") + " " + node.text + ", " + this.layer.alias + '. ' + message;
                }
                try {
                    w2confirm(message, w2utils.lang("Map editor"), GWTK.Util.bind(function (answer) {
                        if (answer == 'Yes') {
                            this.saveClick();
                        }
                        else {
                            this.isSave = false;
                            // Далее отрисовать, выполнить  действия по умолчанию
                            this.setMandatoryCompleteAction(this.currentAction, this.editobjects[0]);
                        }
                    }, this));
                }
                catch (e) {
                    console.log('isSaveConfirm');
                }
            }
            else {
                // Далее отрисовать, выполнить  действия по умолчанию
                this.setMandatoryCompleteAction(this.currentAction, this.editobjects[0]);
            }
        },

        /**
         * ОПЕРАЦИИ НАД ОБЪЕКТОМ (СОЗДАВАЕМЫМ ИЛИ РЕДАКТИРУЕМЫМ)
         */

        /**
         * Можно ли редактировать объект
         * @method canEditObject
         * @param editobject {Object} Объект карты
         */
        canEditObject: function (editobject, asc) {

            if (!editobject) {
                return;
            }

            var layedit = this.iseditinglayer(editobject.maplayerid);
            if (!layedit) { // не нашли нужный нам слой карты
                if (asc) {
                    w2alert(w2utils.lang('The object can not be edited because the layer is not included in the list of editable layers'));
                    return;
                }
            }

            // Проверка на возможность редактирования объекта
            if (!this.iseditinglayer_object(editobject.gid, editobject.code, editobject.key)) {
                if (asc) {
                    w2alert(editobject.maplayername + '. ' + editobject.name + '.\n\r' + w2utils.lang(
                        'The object can not be edited, because it does not include in the list of editable objects'));
                    return;
                }
            }

            return layedit;
        },

        /**
         * Инициализация данных создаваемого объекта
         * @method initdataCreationObject
         * @param node {Object} - элемент выбранного типа объекта из списка
         */
        initDataMapObject: function (node, fn_callback) {
            if (!node) {
                if (fn_callback) {
                    fn_callback();
                }
                return;
            }

            if (!this.editobjects || this.editobjects.length == 0) {
                this.restoreNode(node);
                if (fn_callback) {
                    fn_callback();
                }
                return;
            }

            // Установим подпись объекту
            this.setTitle(node, GWTK.bind(function(result) {
                if (
                    // Если есть метрика или семантика и есть код объекта и коды не равны
                    (this.editobjects[0].geometry && this.editobjects[0].geometry.count() > 0 ||
                        this.editobjects[0].semantic && this.editobjects[0].semantic.semantics.length > 0)
                    &&
                    // и есть код объекта и коды не равны
                    (this.editobjects[0].code && (this.editobjects[0].code != node.code || this.editobjects[0].key != node.key))
                ) {
                    // Запись в журнал
                    this.addTransactionWithOutHistory(null, 'changeobjecttype', null, new GWTK.EditorTransactionLog({
                        "mapalias": this.layer.alias,         // алиас карты
                        "regime": this.getShortTaskName(this.currentTask),           // режим редактора (Создание, редактирование, удаление, перемещение ...)
                        "name": w2utils.lang("Changing map object type"),             // название транзакции
                        "newvalue": node.text,
                        "result": ""           // результат
                    }));
                }

                if (this.changeMapObjectCode(node, true)) {
                    this.isSaveConfirm(node, false);
                }

                if (fn_callback) {
                    fn_callback();
                }
            }, this));
        },

        /**
         * Создание нового объекта
         */
        createNewMapObject: function (mapobject, fn_ok, fn_error) {

            if (!this.maplayerid || !this.maplayerid.layerid) {
                if (fn_error) {
                    fn_error();
                }
                return;
            }

            // Флаг ожидания графики
            var waitgraphic = false;
            if (!mapobject) {
                if (!this.editobjects[0] || this.editobjects[0].maplayerid != this.maplayerid.layerid) {
                    this.editobjects[0] = new GWTK.mapobject(this.map, "0", this.maplayerid.layerid);
                    if (!this.editobjects[0].error) {

                        this.setSpatialpositionDefault(this.editobjects[0]);

                        if (this.layer && this.layer.mapSheets && this.layer.mapSheets.sheets && this.layer.mapSheets.sheets.length > 0)
                            this.editobjects[0].maplayername = this.layer.mapSheets.sheets[0];
                        else
                            this.editobjects[0].maplayername = this.layer.id;
                        this.editobjects[0].id = '0';
                        this.editobjects[0].gid = this.editobjects[0].maplayername + '.' + this.editobjects[0].id;

                        this.changeMapObjectCodeSemantics(this.editobjects[0], true);
                    }
                }
            }
            else {
                this.editobjects[0] = mapobject.clone();
                // Если у объекта нет code и key, то счмтаем, что это объект draw (графический)
                if (this.layer instanceof GWTK.graphicLayer == false &&
                    (!this.editobjects[0].code || !this.editobjects[0].key) &&
                    this.editobjects[0].gid) {
                    if (!this.editobjects[0].getGraphic()) {
                        waitgraphic = true;
                    }
                }
                // this.changeMapObjectCodeSemantics(this.editobjects[0]);
                // this.changeMapObjectCodeGeometry(this.editobjects[0]);
            }


            if (waitgraphic) {
                $(this.map.eventPane).one('loadgraphic',
                    GWTK.Util.bind(function (event) {
                        waitgraphic = false;
                        this.createNewMapObject_callback(event.mapobject, fn_ok)
                    }, this));
            }
            else {
                this.createNewMapObject_callback(this.editobjects[0], fn_ok);
            }

        },

        createNewMapObject_callback: function (mapobject, fn_ok) {

            // this.editobjects[0] = mapobject;
            this.editobjects[0] = mapobject.clone();

            // Если задача удаления, то ничего не достаем
            if (this.currentTask !== 'delete') {

                this.changeMapObjectCodeSemantics(this.editobjects[0]);
                this.changeMapObjectCodeGeometry(this.editobjects[0]);

                // Создадим панель для рисования
                this.createDrawpanel();
                if (this.drawpanel) {
                    this.drawpanel.style.cursor = 'pointer';
                }
            }
            if (fn_ok) {
                fn_ok(this.editobjects[0]);
            }

        },

        /**
         * Изменить код объекта со всем содержимым
         * @param node
         */
        changeMapObjectCode: function (node, history) {
            if (!node || !this.layer) {
                return;
            }

            // Информация по коду
            var node_old = null;
            if (this.editNodeLast && this.editNodeLast.node) {
                node_old = JSON.parse(JSON.stringify(this.editNodeLast.node));
            }
            this.initEditNodeLast(node, this.layer.xId);

            // Непосредственно объект
            var len;
            if (this.editobjects && (len = this.editobjects.length) > 0) {

                // Сформируем массив объектов для истории
                if (history && len > 1) {
                    this.destroyHistoryEditObjects();
                }
                for (var i = 0; i < len; i++) {
                    this.changeMapObjectCode_ForOneMapObject(this.editobjects[i], this.editNodeLast.node, history, node_old, len);
                }

                if (history && len > 1) {
                    this.history.addmapobjects('update', this.historyEditObjects);
                }

                this.setObjectName(this.editobjects[0].name);
                return true;
            }
        },

        /**
         * Сменить код одному объекту из списка this.editobjects
         * @param editobject - объект
         * @param node - код
         * @param history - запись в историю
         * @param count - общее количество объектов массивк
         */
        changeMapObjectCode_ForOneMapObject: function (editobject, node, history, node_old, count) {
            if (!editobject || !node) {
                return;
            }
            var node_new = JSON.parse(JSON.stringify(this.editNodeLast.node)),
                mapobject_old = editobject.clone();

            editobject.code = node.code;
            editobject.key = node.key;

            if (!node.graphic) {
                // Значения из реального классифиатора
                if (node.id) {
                    var layer = this.map.tiles.getLayerByxId(this.maplayerid.layerid);
                    if (layer && layer.classifier) {
                        var l = '_' + layer.classifier.layerid,
                            _newid = node.id.replace(new RegExp(l, 'g'), ""),
                            newid = _newid.replace(new RegExp('editor_', 'g'), "");
                        editobject.key = newid;
                    }
                }
            }
            else {
                // Значения графических объектов
                editobject.key = node.key;
                editobject.code = node.code;
                var obj = GWTK.graphicLayer.prototype.getSemByObjKey(node.key);
                if (obj) {
                    editobject.local = node.local = obj.local;
                }
            }

            editobject.graphic = (node.graphic) ? JSON.parse(JSON.stringify(node.graphic)) : null;

            // Найдем подпись в шаблоне
            var title = (editobject.graphic) ? editobject.graphic.title : node.title;

            editobject.name = node.text;
            editobject.image = node.img;

            // Изменение данных слоя в объекте карты
            if (node.bsdlayer) {
                editobject.layername = node.bsdlayer;
            }
            // else {
            //     if (editobject.graphic && editobject.graphic.classifierLayer){
            //         editobject.layername = editobject.graphic.classifierLayer;
            //     }
            // }
            editobject.setMapLayerData(this.maplayerid.layerid);

            // Сбросим gid, если новый объект
            var gmldata = GWTK.Util.parseGmlId(editobject.gid);
            if (gmldata == {} || gmldata.objid == '0') {
                editobject.gid = editobject.maplayername + '.' + '0';
            }

            //this.editobjects[0].geometry.srsName = "urn:ogc:def:crs:EPSG:4326";
            editobject.spatialposition = editobject.geometry.spatialposition = GWTK.classifier.prototype.getlocal(node.local);
            if (!editobject.spatialposition) {
                this.setSpatialpositionDefault(editobject);
            }

            // Разберемся с метрикой
            this.changeMapObjectCodeGeometry(editobject, ((!title) ? null : title));

            // Разберемся с семантикой
            this.changeMapObjectCodeSemantics(editobject, true);

            // TODO: Заполнить историю
            if (history && node_old) {
                // Если общее количество больше 1, то формируем массив для истории
                if (count > 1) {
                    var data = {
                        mapobject_old: mapobject_old.clone(),
                        mapobject_new: editobject.clone()
                    };
                    if (node_old && node) {
                        data.node_old = JSON.parse(JSON.stringify(node_old));
                        data.node_new = JSON.parse(JSON.stringify(node));
                    }
                    this.historyEditObjects.push(data);
                }
                else {
                    this.history.addmapobject('update', mapobject_old, editobject, node_old, node);
                }

                mapobject_old.clear();
                this.isChange(true);
                this.addmenu();
            }

            // Обновить доступность инструментов
            this.updateDisabledTools(this.currentTask);

        },

        /**
         * Изменение метрики в соответствии с локализациейupdatedrawcontur
         * editobject - редактируемый объект
         * title - подпись, null - значение на отсутствие подписи
         */
        changeMapObjectCodeGeometry: function (editobject, title) {
            var spatialposition = (editobject && editobject.geometry) ?
                editobject.spatialposition : null;

            title = (title || title == null) ? (title) : editobject.geometry.getText();
            editobject.geometry.setText(title);
            editobject.geometry.mapobject = editobject;

            switch (spatialposition) {
                case 'point':
                case 'multipoint':
                    // Оставить по одной точке на каждом подобъекте
                    for (var i = editobject.geometry.subjects.length; i >= 0; i--) {
                        for (var j = editobject.geometry.count(i); j > 1; j--) {
                            editobject.geometry.deletepoint(j, i);
                        }
                    }
                    break;
                case 'polygon':
                case 'multipolygon':
                    // Если меняется код НЕ в режиме создания, то замкнуть метрику всех подобъектов
                    if (this.currentAction && this.currentAction instanceof GWTK.MapeditorCreatingActionExt == false) {
                        editobject.geometry.closeobjects();
                    }
                    break;
                case 'vector':
                case 'title':
                    // Оставить по две точке на каждом подобъекте
                    for (var i = editobject.geometry.subjects.length; i >= 0; i--) {
                        var count = editobject.geometry.count(i);
                        for (var j = count; j > 2; j--) {
                            editobject.geometry.deletepoint(j, i);
                        }
                        // Если нечего было удалять, то добавим еще одну точку
                        if (count < 2) {
                            var point = editobject.geometry.getpoint(1, i);
                            if (point && point.x) {
                                editobject.geometry.appendpoint(point.x, point.y, i);
                            }
                        }
                    }

                    // Добавить текст в метрику
                    if (editobject.graphic && editobject.graphic.type == 'title' && editobject.graphic.text) {
                        editobject.geometry.setText(editobject.graphic.text);
                    }
                    break;
            }

            // Заполнить панель информации об объекте (Обновить текущую закладку)
            if (this.showTab && this.showTab == 'Geometry') {
                var id = this.getPanelEditorId(),
                    tabs = w2ui[this.preInfoTabs + id];
                if (tabs) {
                    this.setActiveTabInfo(tabs.get(this.preInfoTab + this.getPanelEditorId() + this.showTab));
                }
            }
        },

        /**
         * Изменение семантики в соответствии с кодом объекта
         * @param editobject - объект
         * @param isnew - запрашивать семантику как для нового объекта
         */
        changeMapObjectCodeSemantics: function (editobject, isnew) {
            if (!editobject) {
                return;
            }

            this.destroySemantic();

            var gmldata = GWTK.Util.parseGmlId(editobject.gid);

            // Найдем семантики графического объекта слоя
            if (!this.graphic && editobject.graphic && editobject.graphic.classifierLayer) { // Не графический слой
                editobject.setSemanticsForGraphic(GWTK.Util.bind(this.changeMapObjectCodeSemantics_callback, this));
                return;
            }
            else {
                if (gmldata && gmldata.objid && gmldata.objid != '0' && !isnew) {
                    if (!this.graphic) { // если НЕ графический слой

                        // var rscobjectnumber = this.layer.classifier.getsemanticsobject(gmldata.objid);
                        editobject.getsemanticsobject(gmldata.objid, GWTK.Util.bind(
                            function(rscobject){
                                    if (rscobject) {
                                        editobject.semantic.setsemantics(rscobject.rscsemantics);
                                        editobject.key = rscobject.key;
                                        // Заполнить панель информации об объекте (Обновить текущую закладку)
                                        this.changeMapObjectCodeSemantics_callback();
                                    }
                                    else {
                                        if (window.console) {
                                            editobject.semantic.clear();
                                            console.log("Запрос объекта по ключу " + gmldata.objid + ", сервер не ответил своевременно. Проверьте наличие библиотеки objectinfo.dll");
                                        }
                                    }
                            }, this));
                    }
                }
                else {
                    if (!editobject.key) {
                        if (this.editNodeLast && this.editNodeLast.node) {
                            editobject.key = this.editNodeLast.node.key;
                        }
                    }
                    // var rscsemantic = this.layer.classifier.getsemantics(editobject.key);
                    this.layer.classifier.getsemantics(editobject.key, GWTK.Util.bind(function(rscsemantic){
                        if (rscsemantic) {
                            editobject.semantic.setsemantics(rscsemantic);
                        }
                        else {
                            editobject.semantic.clear();
                        }
                        // Заполнить панель информации об объекте (Обновить текущую закладку)
                        this.changeMapObjectCodeSemantics_callback();
                    }, this));
                }
            }

            // Заполнить панель информации об объекте (Обновить текущую закладку)
            // this.changeMapObjectCodeSemantics_callback();
        },

        changeMapObjectCodeSemantics_callback: function(){
            // Заполнить панель информации об объекте (Обновить текущую закладку)
            if (this.showTab && this.showTab == 'Attributes') {
                var id = this.getPanelEditorId(),
                    tabs = w2ui[this.preInfoTabs + id];
                // if (this.rscsemantics) {
                //
                // }
                if (tabs) {
                    this.setActiveTabInfo(tabs.get(this.preInfoTab + this.getPanelEditorId() + this.showTab));
                }
            }
        },

        /**
         * Контроль информации перед сохранением
         * @param fn_callbackYes
         * @param fn_callbackNo
         */
        controlMapObject: function (fn_callbackYes, fn_callbackNo) {
            if (!this.editobjects || this.editobjects.length == 0 || !this.editobjects[0]) {
                return;
            }
            if (!this.editobjects[0].key || this.editobjects[0].key == 0) {

                // Если графический слой, назначить тип по локализации
                if (this.graphic) {
                    if (this.legend && this.legend.graphicLegend) {
                        this.editobjects[0].code = this.editobjects[0].key = this.legend.graphicLegend.panelsDraw['line'].key;
                        this.editobjects[0].graphic = (this.legend.graphicLegend.panelsDraw['line'].drawObject) ?
                            this.legend.graphicLegend.panelsDraw['line'].drawObject.saveJSON() : '';

                        if (fn_callbackYes && $.isFunction((fn_callbackYes))) {
                            fn_callbackYes();
                        }
                        return;
                    }
                }

                try {
                    w2confirm(w2utils.lang("Object type not set. Save service type object?"), w2utils.lang("Map editor"),
                        function (answer) {
                            if (answer == 'Yes') {
                                // Диалог для подтверждения сохранения объектов служебным кодом
                                if (fn_callbackYes && $.isFunction((fn_callbackYes))) {
                                    fn_callbackYes();
                                }
                            }
                            else {
                                if (fn_callbackNo && $.isFunction((fn_callbackNo))) {
                                    fn_callbackNo();
                                }
                            }
                        });
                }
                catch (e) {
                    console.log('controlMapObject');
                }

            }
            else {
                if (fn_callbackYes && $.isFunction((fn_callbackYes))) {
                    fn_callbackYes();
                }
            }

            // TODO
            // Обновить данные с окна ввода (метрику, семантику)

        },

        /**
         * Очистить набор объектов, подлежащими редактированию
         * @method clearEditObjects
         */
        clearEditObjects: function () {
            var count = this.editobjects.length;
            for (var i = 0; i < count; i++)
                this.editobjects[i].clear();
            this.editobjects.splice(0, this.editobjects.length);
        },

        /**
         * ИЗМЕНЕНИЕ СЛОЯ, ОБРАБОТЧИКА ...
         */

        /**
         * Смена слоя в списке слоев карты (режим Создания)
         * @method changeLayer
         * @param item [Object] - Элемент списка
         */
        changeLayer: function (layer) {


            // Наименование объекта
            this.setObjectName();

            // Старое значение для журнала
            var oldLayerAlias = this.layer ? this.layer.alias : '',
                oldGraphic = (this.layer instanceof GWTK.graphicLayer);

            this.maplayerid = this.iseditinglayer((layer) ? layer.xId : null);
            if (!this.maplayerid) {

                // Сбросим шаблон
                this.setTemplate(null);

                // Удалим компоненты легенды и информацилнную панель
                this.destroyLegend();
                this.destroyCharacteristicsInfo();
                this.destroyTasks();

                return;
            }

            this.layer = this.map.tiles.getLayerByxId((this.maplayerid && this.maplayerid.layerid) ? this.maplayerid.layerid : null);

            this.layer.classifier.initGraphicLayer();


            // Установка типа слоя
            this.setlayertype(this.layer);

            // GWTK.Util.showWait();

            // Установка шаблона
            this.setTemplate(this.layer, false, true);

            // Загрузка легенды
            if (this.legend) {
                this.legend.changeLayer(this.layer);
            }
            else {
                this.createLegend(this.panelsId['editor']);
            }


            // // Синхронизация шаблона и легенды для draw-объектов
            // // setTimeout(GWTK.bind(function () {
            //     this.synchronizationTemlateAndLegendDraw();
            //
            //     // Проинициализировать текущим объектом
            //     if (this.editobjects[0] && this.editobjects[0].graphic) {
            //         var graphicObject = this.legend.graphicLegend.createGraphicObjectFromJSON(this.editobjects[0].graphic);
            //         if (graphicObject) {
            //             this.legend.graphicLegend.initPanelDraw(graphicObject);
            //         }
            //     }
            //
            //     // Если создание и графический слой выделить тип объекта
            //     if (this.currentTask == 'create' && this.editNodeLast.node) { //&& this.graphic
            //         if (this.graphic || this.editobjects[0].graphic) {
            //             this.setLegendCode(this.editNodeLast.node.key, 'key', this.editNodeLast.node, true);
            //         }
            //         else {
            //             this.setLegendCode(this.editNodeLast.node.key, 'key', null, true);
            //         }
            //     }
            //
            // // }, this), 200);


            // Инициализация типа объекта для истории
            if (this.editobjects && this.editobjects.length > 0) {
                var graphic = (this.graphic || this.editobjects[0].graphic);
                // Сменили простой слой на графику
                var node = {
                    id: '',
                    code: (graphic) ? (this.editobjects[0].code ? this.editobjects[0].code : '') : '',
                    key: (graphic) ? (this.editobjects[0].key ? this.editobjects[0].key : '') : '',
                    local: GWTK.classifier.prototype.getlocalByName(this.editobjects[0].spatialposition),
                    text: (graphic) ? w2utils.lang(this.editobjects[0].code) : '',
                    graphic: (graphic) ? ((this.editobjects[0].graphic) ? JSON.parse(JSON.stringify(this.editobjects[0].graphic)) : 'graphic') : ''
                };

                 if (this.graphic && !oldGraphic) {
                    var _graphic = GWTK.MapeditLegendGraphicControl.prototype.createGraphicObjectFromJSON({type: this.editobjects[0].spatialposition});

                    if (_graphic) {
                        node = {
                            id: '',
                            code: _graphic.type,
                            key: _graphic.type,
                            local: GWTK.classifier.prototype.getlocalByName(_graphic.type),
                            text: w2utils.lang(_graphic.type),
                            graphic: _graphic.saveJSON()
                        }
                    }

                }


                // Сброс кода объекта
                this.changeMapObjectCode(
                    node
                );

            }

            // Запись в журнал
            if (oldLayerAlias != this.layer.alias) {
                this.addTransactionWithOutHistory(null, 'changelayer', null, new GWTK.EditorTransactionLog({
                    "mapalias": this.layer.alias,         // алиас карты
                    "regime": this.getShortTaskName(this.currentTask),           // режим редактора (Создани, редактирование, удаление, перемещение ...)
                    "name": w2utils.lang("Changing map layer"),                  // название транзакции
                    "oldvalue": oldLayerAlias,
                    "newvalue": this.layer.alias,
                    "result": ""
                }));
            }

            this.addmenu();

             // Синхронизация шаблона и легенды для draw-объектов
            this.synchronizationTemlateAndLegendDraw();

             // Проинициализировать текущим объектом
            if (this.editobjects[0] && this.editobjects[0].graphic) {
                var graphicObject = this.legend.graphicLegend.createGraphicObjectFromJSON(this.editobjects[0].graphic);
                if (graphicObject) {
                    this.legend.graphicLegend.initPanelDraw(graphicObject);
                }
            }

            // Если создание и графический слой выделить тип объекта
            if (this.currentTask == 'create' && this.editNodeLast.node) { //&& this.graphic
                if (this.graphic || this.editobjects[0].graphic) {
                    this.setLegendCode(this.editNodeLast.node.key, 'key', this.editNodeLast.node, true);
                }
                else {
                    this.setLegendCode(this.editNodeLast.node.key, 'key', null, true);
                }
            }
        },

        /**
         * Смена обработчика
         * @param name
         */
        changeCurrentAction: function (action) {
            var ret = true;
            // Закрыть текущий обработчик
            if (this.currentAction) {

                var name = this.currentAction.name;
                ret = this.closeAction(this.currentAction.name);  // Обнулится при событии onCloseAction
                if (action && name == action.name) {
                    return false;
                }
            }

            // Инициировать новый
            if (action) {
                ret = this.setAction(action);
            }

            return ret;

        },

        /**
         * Выполнить обязательные действия обработчика, связанные с завершением операции
         * @param action - обработчик
         */
        setMandatoryCompleteAction: function (action, editobject) {
            // Далее отрисовать, выполнить  действия по умолчанию
            if (action) {
                if (action.iscomplete) {
                    if (action.iscomplete(editobject)) {
                        if (action.complete) {
                            action.complete();
                        }
                    }
                }
                if (action.draw) {
                    action.draw();
                }
            }
        },


        /**
         * Установить текущий код объекта в легенде
         * @param key
         */
        setLegendCode: function (value, fieldname, node, select) {
            if (this.legend) {
                this.legend.set(value, fieldname, node, select);
            }
        },

        /**
         * Сбросить текущий код объекта в легендеы
         * @param key
         */
        unsetLegendCode: function (value, fieldname, node) {
            this.setObjectName();
            if (this.legend) {
                value = (value) ? value : ((this.editNodeLast && this.editNodeLast.node) ? this.editNodeLast.node.id : null);
                fieldname = (fieldname) ? fieldname : 'id';
                node = (node) ? node : this.editNodeLast.node;
                this.legend.unset(value, fieldname, node);
            }
        },

        /**
         * Запросить объект легенды
         * @param value
         * @param fieldname
         */
        getLegendCode: function (value, fieldname) {
            if (this.legend) {
                var node = this.legend.get(value, fieldname);
                if (node) {
                    return node.node;
                }
            }
        },

        /**
         * Запросить, есть ли выделенный объект легенды
         */
        isLegendSelect: function(){
            if (this.legend) {
                return this.legend.isSelect();
            }
        },

        /**
         * Назначить выделенный объект на редактирование, перемещение, удаление и тд
         * @param setobject
         */
        setObject: function (selectobject, fn_ok, fn_error) {

            // Проверим на возможность редактирование
            var maplayerid = this.canEditObject(selectobject);

            if (maplayerid) {

                // Назначим нужный слой
                if (maplayerid.layerid != this.maplayerid.layerid) {
                    this.maplayerid = maplayerid;
                    // Установить тип редактируемого слоя
                    this.layer = this.map.tiles.getLayerByxId(this.maplayerid.layerid);
                    var item = {id: this.maplayerid.layerid, text: this.layer.alias};
                    $('#' + this.maplistId).data('selected', item).data('w2field').refresh();
                    this.changeLayer(this.layer);
                }

                this.createNewMapObject(selectobject, GWTK.Util.bind(
                    function (mapobject) {
                        if (mapobject && mapobject.code && mapobject.geometry && mapobject.geometry.count() > 0) {

                            // Режим удвления пропускаем
                            if (this.currentTask !== 'delete') {

                                // Выставить код объекта в легенде
                                var node = {};
                                if (mapobject.graphic) {
                                    node = {
                                        graphic: mapobject.graphic
                                    };
                                }
                                var selectdraw = (this.currentTask == 'edit') ? true : false;
                                if (mapobject.key) {
                                    node.key = mapobject.key;
                                    this.setLegendCode(mapobject.key, 'key', node, selectdraw);
                                    // Запомним текущий
                                    this.initEditNodeLast(this.getLegendCode(mapobject.key, 'key'), this.layer.xId);

                                } else {
                                    if (mapobject.code) {
                                        node.code = mapobject.code;
                                        this.setLegendCode(mapobject.code, 'code', node, selectdraw);
                                        // Запомним текущий
                                        this.initEditNodeLast(this.getLegendCode(mapobject.code, 'code'), this.layer.xId);
                                    }
                                }

                                this.setObjectName(mapobject.name);

                                // вызвать диалог ввода подписи
                                if (this.editNodeLast.node) {
                                    this.setTitle(this.editNodeLast.node);
                                }
                            }

                            // Сделать недоступной панель смены карт
                            this.enabledMaps(false);
                            this.enabledInfo(true);

                            if (fn_ok) {
                                fn_ok();
                            }
                            return true;
                        }
                        else {
                            if (fn_error) {
                                fn_error();
                            }
                            return false;
                        }
                    }
                    , this));
            }

        }
        ,

        /**
         * Процесс перемещения объектов для задачи перемещения
         */
        processMoving: function () {

            if (this.isGroupProcess) {
                this.drawSelectFeatures.updateLink(this.editobjects);
            }

            // Создадим панель для рисования
            this.createDrawpanel();

            // отрисуем габариты
            //  this.topology.searchObjectsByAreaFrame(null, null, 'edit', [], true);
            this.topology.searchObjectsByAreaFrame(null, null, null, [], true);

            this.changeCurrentAction(new GWTK.MapeditorMovingActionExt(this, 'moving', {
                'context': this, 'fn_complete': GWTK.Util.bind(function () {
                    // this.topology.searchObjectsByAreaFrame(null, null, 'edit', [], true);
                    this.topology.searchObjectsByAreaFrame(null, null, null, [], true);
                    this.action.clear();
                    this.action.set();
                }, this)
            }));
        }
        ,


        /**
         * Назначение прослушки событий для активного режима
         * @method initActionEvent
         */
        initActionEvent: function () {
            // Назначим события

            // События на нажатие клавиш
            this.map.on({type: "keydown", target: "map", phase: 'before', sender: this}, this.onKeyDown);
            //this.map.on({type: "keyup", target: "map", phase: 'before', sender: this}, this.onKeyDown);

            // обновление объекта
            $(this.map.eventPane).on('updatemapobject', this.onUpdateMapObject);
            // Изменение видимости слоев
            $(this.map.eventPane).on('visibilitychanged', this.onVisibilityChanged);

            // Запрет на контекстное меню
            $(this.map.mapPane).parent().on('contextmenu', this.onContextMenu);
            $('body').on('contextmenu', this.onContextMenuBody);

            //Перерисовка карты
            $(this.map.eventPane).on('overlayRefresh', this.onOverlayRefresh);

            // // Старт нового обработчика
            // $(this.map.eventPane).on('setaction', this.onSetAction);
            // $(this.map.eventPane).on('closeaction', this.onCloseAction);

            // Нажатие кнопок мыши
            $(this.map.eventPane).on('ctrlleft', this.onCtrlLeft);
            $(this.map.eventPane).on('ctrlright', this.onCtrlRight);

            // собщения от окна метрики
            $(this.map.eventPane).on('changedata_metrics', this.onChangeDataMetrics);

            // // собщения от окна семантики
            // $(this.map.eventPane).on('changedata_semantics', this.onChangeDataSemantics);

            // Изменение вида графического объекта
            $(this.map.eventPane).on('GWTK.MapeditLegendGraphicControl.changegraphicparams', this.onChangeGraphicParams);

            // Изменение параметров отрисовки и выделения объектоа карты
            $(this.map.eventPane).on('markingcolorchanged', this.onMarkingColorChanged);

            // обработка изменений размера панели контролов
            $(this.map.eventPane).on('resizecontrolspanel.' + this.toolname, this.onResizeControlPanel);

        }
        ,

        /**
         * Прослушка обработчиков (старт и закрытие)
         */
        initEvent: function() {
            // Старт нового обработчика
            $(this.map.eventPane).on('setaction', this.onSetAction);
            $(this.map.eventPane).on('closeaction', this.onCloseAction);
        },

        /**
         * Просмотр журнала операций
         * @param layer
         * @returns {{RESTMETHOD: string, LAYER: *, ServiceOperation: (number|*), DateEnd: string}|*}
         */
        setLogOptions: function (layer) {
            options = {
                "RESTMETHOD": "VIEWTRANSACTIONLOG",
                "LAYER": layer.classifier.wmtsId,
                "ServiceOperation": this.options.transaction.servicerecord,
                "DateEnd": this.options.transaction.enddate.datestring.replace(/\./g, '/')
            };

            if (this.options.transaction.startdate.datestring && this.options.transaction.startdate.datestring != '') {
                this.options.DateBegin = options.DateBegin = this.options.transaction.startdate.datestring.replace(/\./g, '/');
            }
            return options;
        }
        ,

        /**
         * Обработка нажатия кнопки "Сохранить"
         * @method saveLogToFile
         */
        saveLogToFile: function () {
            // заполним список семантик типа классификатор
            var layer = this.map.tiles.getLayerByxId(this.options.transaction.maplayerid);
            if (!layer) return;
            var queryEdit = new EditQueries(layer.classifier.srv, this.map);
            queryEdit.onDataLoad = this.onDataLoadedTransactLog;
            queryEdit.context = this;
            var options = this.setLogOptions(layer);
            queryEdit.sendRequest(options);
        }
        ,

        /**
         * Обработка нажатия кнопки "Открыть"
         * @method openLog
         */
        openLog: function () {
            var layer = this.map.tiles.getLayerByxId(this.options.transaction.maplayerid);
            if (!layer) return;
            var options = this.setLogOptions(layer);
            var paramstr = "?RESTMETHOD=" + options.RESTMETHOD + '&LAYER=' + options.LAYER + '&ServiceOperation=' +
                options.ServiceOperation + "&DateEnd=" + options.DateEnd;
            if (options.DateBegin) {
                paramstr += "&DateBegin=" + options.DateBegin;
            }
            else {
                paramstr += "&DateBegin=" + options.DateEnd;
            }
            var href = layer.classifier.srv + paramstr;
            window.open(href, '_blank');
        }
        ,

        /**
         * Ответ на запрос журнала транзакций
         * @method onDataLoadedTransactLog
         */
        onDataLoadedTransactLog: function (response, context) {
            var saveData = (function (data, filename) {
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                return function (data, filename) {
                    var blob = new Blob([data], {type: "octet/stream"}),
//                       blob = new Blob([json], { type: "text/html" }),
                        url = window.URL.createObjectURL(blob);
                    var ua = navigator.userAgent;
                    if (ua.search(/Trident/) != -1) {
                        //IE
                        window.navigator.msSaveBlob(blob, filename);
                        return true;
                    }
                    a.href = url;
                    a.download = filename;
                    a.click();

                };
            }());

            saveData(response, context.layer.alias + '.TAC.txt');

        }
        ,

        /**
         * Выполнение отмены транзакций
         * @method restoreTransaction
         * @param type {String} "UNDOLASTACTION" или "REDOLASTACTION"
         */
        restoreTransaction: function (type, title) {
            // заполним список семантик типа классификатор
            if (!this.options.transaction.maplayerid && this.layer && this.layer instanceof GWTK.graphicLayer == false)
                this.options.transaction.maplayerid = this.layer.xId;

            var layer = this.map.tiles.getLayerByxId(this.options.transaction.maplayerid);
            if (!layer) return;

            /**
             * TODO: Убрала вопрос о восстановлении объекта
             */
                // w2confirm(title + "? " + layer.alias, w2utils.lang("Map editor"), GWTK.Util.bind(function (answer) {
                //     if (answer == 'Yes') {
                //         var queryEdit = new EditQueries(layer.classifier.srv, this.map);
                //         queryEdit.context = this;
                //         queryEdit.type = type;
                //         queryEdit.layeralias = layer.alias;
                //         queryEdit.onDataLoad = this.onDataLoadedRestoreTransaction;
                //         queryEdit.addTransactionWithOutHistory = GWTK.Util.bind(this.addTransactionWithOutHistory, this);
                //         var options = {
                //             "SERVICE": "WFS",
                //             "RESTMETHOD": type,
                //             "LAYER": layer.classifier.wmtsId
                //         };
                //         queryEdit.sendRequest(options);
                //     }
                // }, this));

            var queryEdit = new EditQueries(layer.classifier.srv, this.map);
            queryEdit.context = this;
            queryEdit.type = type;
            queryEdit.layeralias = layer.alias;
            queryEdit.onDataLoad = this.onDataLoadedRestoreTransaction;
            queryEdit.addTransactionWithOutHistory = GWTK.Util.bind(this.addTransactionWithOutHistory, this);
            var options = {
                "SERVICE": "WFS",
                "RESTMETHOD": type,
                "LAYER": layer.classifier.wmtsId
            };
            queryEdit.sendRequest(options);

        }
        ,

        /**
         * Ответ на выполнение отмены транзакций
         * @method onDataLoadedRestoreTransaction
         */
        onDataLoadedRestoreTransaction: function (response, context) {
            if (!context || context instanceof GWTK.mapeditorTaskExtended === false)
                return;

            this.addTransactionWithOutHistory(null, this.type, w2utils.lang("Layer") + ': ' + this.layeralias);

            context.refreshmap();
            context.drawSelectFeatures.clearDrawAll();
            if (context.topology) {
                context.topology.isUpdate = true;
            }

            // Если это наш обработчик выбора объекта
            var action = context.map.taskManager._action;
            if (action && context.isOurAction(action)) {
                action.clear();
                action.set();
            }
        }
        ,


        /**
         * Инициализация значений даты для работы с транзакциями
         * @method inittransactiondate
         * @param type {String} "start" или "end"
         */
        inittransactiondate: function (type) {
            if (!this.options) return;
            var date;
            switch (type) {
                case 'start':
                    if (!this.options.transaction.startdate.date || this.options.transaction.startdate.date == '') {
                        this.options.transaction.startdate.date = new Date();
                    }
                    date = this.options.transaction.startdate.date.toLocaleString().split(', ');
                    if (!date || date.length != 2)
                        date = this.options.transaction.startdate.date.toLocaleString().split(' ');
                    if (date && date.length == 2) {
                        this.options.transaction.startdate.datestring = date[0];
                    }
                    break;
                case 'end':
                    if (!this.options.transaction.enddate.date || this.options.transaction.enddate.date == '')
                        this.options.transaction.enddate.date = new Date();
                    date = this.options.transaction.enddate.date.toLocaleString().split(', ');
                    if (!date || date.length != 2)
                        date = this.options.transaction.enddate.date.toLocaleString().split(' ');
                    if (date && date.length == 2) {
                        this.options.transaction.enddate.datestring = date[0];
                    }
                    break;
            }
        }
        ,

        /**
         * Установка значений даты для работы с транзакциями
         * @method settransactiondate
         * @param type {String} "start" или "end"
         */
        settransactiondate: function (type) {
            if (!this.options) return;
            var date, time;
            switch (type) {
                case 'start':
                    if (this.options.transaction.startdate.datestring && this.options.transaction.startdate.datestring != '') {
                        date = this.options.transaction.startdate.datestring.split('.');
                        this.options.transaction.startdate.date = new Date(date[2], date[1], date[0]);
                    }
                    break;
                case 'end':
                    if (this.options.transaction.enddate.datestring && this.options.transaction.enddate.datestring != '') {
                        date = this.options.transaction.enddate.datestring.split('.');
                        this.options.transaction.enddate.date = new Date(date[2], date[1], date[0]);
                    }
            }
        }
        ,

        /**
         * СТАРТ РЕЖИМОВ
         */

        /**
         * Заполнить select для групповых операций по объектам, подлежащими редактированию
         * @method setGroupSelectedFeatures
         * @param selectedFeatures - Класс выделенных объектов
         */
        setEditObjects: function (selectedFeatures) {
            if (!selectedFeatures || selectedFeatures.mapobjects.length == 0)
                return;
            var gmldata, find, result = [];
            this.clearEditObjects();
            for (var i = 0; i < selectedFeatures.mapobjects.length; i++) {
                selectedobject = selectedFeatures.mapobjects[i];
                gmldata = GWTK.Util.parseGmlId(selectedobject.gid);
                if (this.iseditinglayer_object(selectedobject.gid, selectedobject.code, selectedobject.key)) {
                    this.editobjects.push(selectedobject.clone());
                    if (result.length == 0) {
                        result.push({'sheet': gmldata.sheet, 'count': 1});
                    }
                    else {
                        find = result.find(
                            function (element, index, array) {
                                if (element.sheet == gmldata.sheet) {
                                    element.count++;
                                    return element;
                                }
                            });
                        if (!find)
                            result.push({'sheet': gmldata.sheet, 'count': 1});
                    }
                }
            }

            return result;
        }
        ,

        /**
         * УДАЛЕНИЕ, РАЗРУШЕНИЕ КОМПОНЕНТОВ И СОБЫТИЙ
         */

        /**
         * Удалить панель инструментов
         */
        clearPaneTools: function () {
            // Панель инструментов
            this.emptyPane('#' + this.panelsId['tools']);

            // Дополнительную скрыть
            if (this.mapeditExtendMethods) {
                this.mapeditExtendMethods.hide();
            }
        },

        /**
         * Сброс переменных после сохранения или отключения режима
         * @method clear
         */
        clear: function (regime) {

            // сбросим флажок изменения
            this.isChange(false);

            // очистим изображение объекта
            if (this.drawobject) {
                this.drawobject.destroy();
            }

            // Сбросим размеры панели рисования
            this.restoredrawpanel();

            // Разрушим информационную панель объектов
            this.destroyInfoObject();

            // Разрушим список редактируемых объектов и
            // оконные элементы соответствующие этим объектам
            this.destroyEditobjects();

            // очистим историю
            if (this.history) {
                this.history.clear();
            }

            // Удалим историю групповых
            this.destroyHistoryEditObjects();

            // Разрушим топологию
            if (this.topology) {
                this.topology.clear();
            }

            // Сбросим класс выделения объектов  редактора
            if (this.drawSelectFeatures) {
                this.drawSelectFeatures.clear();
            }

            // Сбросим название
            this.setObjectName();

            this.isGroupDeleteProcess = false;
            this.isGroupProcess = false;
        },

        /**
         * Разрушить панель редактора
         */
        destroyPaneP: function () {
            this.destroyLegend();

            // Панели шаблонов
            if (this.mapeditTemplates) {
                this.mapeditTemplates.destroy();
                this.mapeditTemplates = null;
            }

            // Панели расширения редактирования
            if (this.mapeditExtendMethods) {
                this.mapeditExtendMethods.destroy();
                this.panelExtend = null;
            }

            // Диалог настроек
            var overlay = $('#w2ui-overlay-' + this.button_ids.setting);
            if (overlay) {
                overlay.remove();
            }

            this.destroyCharacteristicsInfo(true);

            $('#' + this.panelsId['main']).remove();

            // Панель самостоятельная
            if (!this.map.options.controlspanel) {
                // this.map.setWindowSize();
                // this.map.resizing();
                $(window).resize();
            }
        },

        /**
         * Разрушить панель легенды
         */
        destroyLegend: function () {
            if (this.legend) {
                this.legend.destroy();
                this.legend = null;
            }
        },

        /**
         * Разрушить активную задачу по типу активного режима
         * @method destroyActiveTask
         */
        destroyActiveTask: function (type) {

            if (type == this.currentTask) {

                this.extend = false;

                // закрыть обработчик
                this.changeCurrentAction();

                // Скрыть дополнительную панель
                if (this.currentTask == 'edit') {
                    // Скрыть дополнительную панель
                    if (this.mapeditExtendMethods) {
                        this.mapeditExtendMethods.hide();
                    }
                }
                else {
                    if (this.currentTask == 'merge') {
                        if (this.mapeditMerging) {
                            this.mapeditMerging.destroy();
                            this.mapeditMerging = null;
                        }
                    }
                }
                // Прослушка от кнопки геолокации
                $(this.map.eventPane).off('controlbuttonclick', this.onControlButtonClick);

                if (this.button_ids[this.currentTask]) {
                  //  GWTK.DomUtil.removeActiveElement('#' + this.panelsId['editor'] + this.button_ids[this.currentTask]);
                    GWTK.MapEditorUtil.removeActiveElement(this.panelsId['editor'] + this.button_ids[this.currentTask]);
                }
                this.currentTask = null;

                // Сбросим класс выделения объектов  редактора
                if (this.drawSelectFeatures) {
                    this.drawSelectFeatures.clear();
                }

                this.addmenu(null, 'transaction');

                return true;
            }

        }
        ,

        /**
         * Разрушить все задачи редактора
         * @method destroyTasks
         */
        destroyTasks: function () {
            this.destroyActiveTask('create');
            this.destroyActiveTask('edit');
            this.destroyActiveTask('delete');
            this.destroyActiveTask('move');
            this.destroyActiveTask('merge');
            this.notOurAction = null;
            //this.editobjectssave = this.editobjectssave.splice(0, this.editobjectssave.length);
        }
        ,

        /**
         * Разрушение класса mapeditotTask
         * @method destroy
         */
        destroy: function () {

            // Сбросим обработчики
            this.destroyActionEvent();
            this.destroyEvent();

            if (this.topology) {
                this.topology.destroy();
                this.topology = null;
            }

            // Разрущим задачи
            this.destroyTasks();

            // Разрушим меню с кнопками возврата и сохранения
            this.destroyAddmenu();

            // Разрушим класс групповой обработки данных
            if (this.groupcontrol) {
                this.groupcontrol.destroy();
                this.groupcontrol = null;
            }

            // Разрушим основную панель
            this.destroyPaneP();

            // Класс отрисовки объектов удалить
            if (this.drawSelectFeatures) {
                this.drawSelectFeatures.destroy();
                this.drawSelectFeatures = null;
            }

        }
        ,

        /**
         * Удаление прослушки событий активного режима
         * @method destroyActionEvent
         */
        destroyActionEvent: function () {

            // Изменение параметров отрисовки и выделения объектоа карты
            $(this.map.eventPane).off('markingcolorchanged', this.onMarkingColorChanged);

            // Изменение вида графического объекта
            $(this.map.eventPane).off('GWTK.MapeditLegendGraphicControl.changegraphicparams', this.onChangeGraphicParams);

            // Запрет на контекстное меню
            $(this.map.mapPane).parent().off('contextmenu', this.onContextMenu);
            $('body').off('contextmenu', this.onContextMenuBody);

            // отменить события клавиатуры
            //this.map.off({type: "keydown", target: "map", phase: 'before', sender: this}, this.onKeyDown);
            this.map.off({type: "keyup", target: "map", phase: 'before', sender: this}, this.onKeyDown);

            // // собщения от окна семантики
            // $(this.map.eventPane).off('changedata_semantics', this.onChangeDataSemantics);

            // собщения от окна метрики
            $(this.map.eventPane).off('changedata_metrics', this.onChangeDataMetrics);
            // обновление объекта
            $(this.map.eventPane).off('updatemapobject', this.onUpdateMapObject);
            // // Перерисовка окна карты
            $(this.map.eventPane).off('overlayRefresh', this.onOverlayRefresh);

            // изменение видимости слоев
            $(this.map.eventPane).off('visibilitychanged', this.onVisibilityChanged);

            // Нажатие кнопок мыши
            $(this.map.eventPane).off('ctrlleft', this.onCtrlLeft);
            $(this.map.eventPane).off('ctrlright', this.onCtrlRight);

            // обработка изменений размера панели контролов
            $(this.map.eventPane).off('resizecontrolspanel.' + this.toolname, this.onResizeControlPanel);
        }
        ,

        // Прослушивание старта и закрытия обработчиков
        destroyEvent: function(){
            // Старт нового обработчика
            $(this.map.eventPane).off('setaction', this.onSetAction);
            $(this.map.eventPane).off('closeaction', this.onCloseAction);

            // Откоючим сообщения от окна семантики
            $(this.map.eventPane).off('changedata_semantics', this.onChangeDataSemantics);
        },

        /**
         * Удаление истории групповых операций
         */
        destroyHistoryEditObjects: function () {
            var len;
            if (this.historyEditObjects && (len = this.historyEditObjects.length) > 0) {
                for (var i = 0; i < len; i++) {
                    if (this.historyEditObjects[i].mapobject_old) {
                        this.historyEditObjects[i].mapobject_old.clear();
                        this.historyEditObjects[i].mapobject_old = null;
                    }
                    if (this.historyEditObjects[i].mapobject_new) {
                        this.historyEditObjects[i].mapobject_new.clear();
                        this.historyEditObjects[i].mapobject_new = null;
                    }
                    this.historyEditObjects[i].node_old = null;
                    this.historyEditObjects[i].node_new = null;
                }
            }
            this.historyEditObjects = [];
        },

        /**
         * Удаление информациюонной панели объекта
         * @method destroyInfoObject
         */
        destroyInfoObject: function () {

            // Удалим информационную панель
            this.destroyCharacteristicsInfo();

            // Перевывести заголовок
            this.updatetitle(w2utils.lang("Map editor"));
        }
        ,

        /**
         * Удаление панели с семантическими и метрическими характеристиками объекта
         * @method destroyCharacteristicsInfo
         */
        destroyCharacteristicsInfo: function (all) {
            var detailid = this.preInfoTabs + this.panelsId['editor'];
            if (w2ui[detailid]) {
                this.destroySemantic();
                this.destroyMetric();
                if (all) {
                    w2ui[detailid].destroy();
                }
            }
        }
        ,

        /**
         * Разрушить список редактируемых объектов и оконные элементы соответствующие этим объектам
         * @method destroyEditobjects
         */
        destroyEditobjects: function () {

            if (!this.editobjects) return;

            // сбросим отображение
            var gid;
            for (var i = 0; i < this.editobjects.length; i++) {
                gid = this.editobjects[i].gid;
                if (gid) {
                    GWTK.DrawingObject.prototype.removeDomElement(this._drawOverlayPane + gid.replace(/\./g, '_'));
                }
            }
            this.drawpanel = null;

            this.clearEditObjects();

        }
        ,

        /**
         * Разрушение объекта редактирования семантики объекта
         * @method destroySemantic
         */
        destroySemantic: function () {
            if (this.rscsemantics && this._ischange) {
                this.rscsemantics.save();
                if (this.editobjects && this.editobjects.length > 0 && this.editobjects[0].semantic)
                   // GWTK.MapEditorUtil.setsemanticmask(this.editobjects[0].semantic, this.rscsemantics._object);
                    this.editobjects[0].semantic.updatesemantics(this.rscsemantics._object);
            }

            if (this.rscsemantics) {
                this.rscsemantics.destroy();
                this.rscsemantics = null;
            }

        }
        ,

        /**
         * Разрушение объекта редактирования геометрии объекта
         * @method destroyMetric
         */
        destroyMetric: function () {
            if (this.metrics) {
                this.metrics.destroy();
                this.metrics = null;
            }
        }
        ,

        /**
         * РАБОТА СО СЛОЯМИ
         */

        /**
         * Заполнение списка редактируемых слов и слоев, участвующих в выделении
         * @method setlayers
         * @param maplayerid {String} Идентификатор текущего слоя
         */
        setlayers: function (maplayerid) {
            this.maplayersid.splice(0, this.maplayersid.length);

            var count = this.map.layers.length, realindex = -1, countParam, id;
            for (var i = 0; i < count; i++) {
                if (!this.map.layers[i].visible || !this.map.layers[i].editing)// || !w2ui[maptree.name].get(this.map.layers[i].xId)) // Невидимые слои или слои, не входящие в дерево
                    continue;

                if (!this.map.layers[i].selectObject) { // Такой слой нельзя редактировать
                    console.log(w2utils.lang("Layer") + ' "' + this.map.layers[i].alias + '"' + w2utils.lang(' is excluded from editing because selection of objects is not allowed on it.'));
                    continue;
                }
                if (this.map.layers[i] instanceof GWTK.WmsLayer) {
                    countParam = this.param.maplayersid.length;
                    for (var j = 0; j < countParam; j++) {
                        if (this.map.layers[i].options.id != this.param.maplayersid[j])
                            continue;
                        realindex = realindex < 0 ? i : realindex;
                        this.maplayersid.push({"layerid": this.param.maplayersid[j]});
                        // Считаем классификатор
                        if (this.map.layers[i].classifier) {
                            this.map.layers[i].classifier.getlegend();
                        }
                    }
                    continue;
                }
                else {
                    if (this.map.layers[i] instanceof GWTK.graphicLayer && this.map.layers[i].editing)
                        this.maplayersid.push({"layerid": this.map.layers[i].options.id});
                }
                realindex = realindex < 0 ? i : realindex;
            }

            // выставим значение по умолчанию
            if (this.maplayersid.length == 0) {
                this.maplayerid = null;
                this.layer = null;
                return;
            }

            // редактируемые объекты
            if (this.param.editingdata) {
                count = this.maplayersid.length;
                for (var i = 0; i < count; i++) {
                    countParam = this.param.editingdata.length;
                    if (countParam == 0) continue;
                    for (var j = 0; j < countParam; j++) {
                        if (this.maplayersid[i].layerid != this.param.editingdata[j].layerid)
                            continue;
                        this.maplayersid[i].editingdata = JSON.parse(JSON.stringify(this.param.editingdata[j]));
                    }
                }
            }

            // Пытаемся установить идентификатор слоя (или по входящемуЮ или по теущему)
            if (!this.maplayerid || this.maplayerid.layerid == '') {
                if (!maplayerid || maplayerid.layerid == '')
                    maplayerid = this.maplayersid[0];
            }
            else {
                var find = this.iseditinglayer((maplayerid && !maplayerid.layerid) ? maplayerid : this.maplayerid.layerid);
                if (find)
                    maplayerid = find;
            }

            // Если так и не определились со слоем, берем первый
            if (!maplayerid)
                maplayerid = this.maplayersid[0];

            // Найдем слой
            var layer = this.map.tiles.getLayerByxId(maplayerid.layerid);
            if (layer) {
                this.maplayerid = maplayerid;
                this.layer = this.map.tiles.getLayerByxId(this.maplayerid.layerid);
            }
            else {
                // найдем, что есть
                if (realindex) {
                    this.maplayerid = this.iseditinglayer(this.map.layers[realindex].options.id);
                    this.layer = this.map.tiles.getLayerByxId(this.maplayerid.layerid);
                }
            }

            count = this.map.layers.length;
            this.selectlayersid.splice(0, this.selectlayersid.length);
            for (var i = 0; i < count; i++) {
                if (!this.map.layers[i] || !this.map.layers[i].selectObject)
                    continue;
                id = this.map.layers[i].options.id;

                countParam = (this.param.selectlayersid && this.param.selectlayersid.length > 0) ? this.param.selectlayersid.length : 0;
                if (countParam == 0) {
                    this.selectlayersid.push(id);
                    continue;
                }

                for (var j = 0; j < countParam; j++) {
                    if (id != this.param.selectlayersid[j])
                        continue;
                    this.selectlayersid.push(this.param.selectlayersid[j]);
                }
            }


            return this.layer = layer;
        }
        ,

        /**
         * Установка/сброс типа слоя (слой карты или графический слой)
         * @method setlayertype
         * @param layer {Object} Слой карты GWTK.graphicLayer или GWTK.Layer
         */
        setlayertype: function (layer) {
            if (!layer) return;

            if (layer instanceof GWTK.graphicLayer) {
                this.graphic = true;
                this.res_mapEditor_confirm_deleteobject = w2utils.lang("You confirm the removal of the object");//"Вы подтверждаете удаление объекта?",;
            }
            else {
                this.graphic = false;
                this.res_mapEditor_confirm_deleteobject = w2utils.lang("You confirm the removal of the object on the server");//"Вы подтверждаете удаление объекта на сервере?',;
            }
        }
        ,

        /**
         * Установить spatialposition по умолчанию
         * @param editobject
         */
        setSpatialpositionDefault: function(editobject){
            if (editobject) {
                editobject.spatialposition = 'linestring';
                if (editobject.geometry) {
                    editobject.geometry.setText('');
                }
            }
        },

        /**
         * Изменение списка слоев карты при изменении состава карты извне
         * @method layerlistchanged
         * @param layerid {String} Идентификатор добавленного или удаленного слоя
         * @param act {String} Признак добавления или удаления слоя ("add" или "remove")
         * из внешней функции
         */
        layerlistchanged: function (layerid, act, onvisible) {

            // удалим окно выбора объектов
            var find = this.iseditinglayer(layerid);
            // Если идет по второму разу
            if (act == "add" && find || act == "remove" && !find)
                return;

            var countparam = this.param.maplayersid.length;
            // Если локальные слои, то просто обновим список
            if (act == "remove" && find) {
                if (onvisible && this.maplayerid.layerid == layerid) {  // если пришло при изменении видимости
                    // Завершить задачу, связанную с этим слоем
                    this.cancelClick();
                }
                this.maplayerid = null;
            }


            // Установим слои
            var oldValue = this.maplayerid,
                maplayerid = (this.maplayerid) ? this.maplayerid : ((this.param.maplayersid && this.param.maplayersid.length > 0) ? this.param.maplayersid[0] : null);
            this.setlayers(maplayerid);

            // Установить список карт
            this.emptyPane('#' + this.maplistId);
            this.setSelectMaps('#' + this.maplistId, false,
                GWTK.Util.bind(function (layer) {
                    this.changeLayer(layer);
                }, this),
                GWTK.Util.bind(function (layer) {
                    this.changeLayer(layer);
                }, this));


            // Запустить задачу
            var isNew = (this.maplayerid && (!oldValue || oldValue.layerid != this.maplayerid.layerid));
            if (isNew || !this.currentTask) {

                // Если новый слой
                if (isNew) {
                    // Прочитаем куки
                    this._readedCookie();

                    // Если была задача, то перезапустить ее
                    var currentTask;
                    if (this.editobjects && this.editobjects.length > 0) {
                        currentTask = this.getTaskByGID(this.editobjects[0].gid);
                    }
                    else {
                        currentTask = this.currentTask;
                    }
                    if (this.currentTask) {
                        this.destroyActiveTask(this.currentTask);
                    }
                    else {
                        // Если режим создания разрешен, то сразу запустить action на создание
                        if (this.isfunction(this.functions, 'create')) {
                            this.currentTask = 'create';
                        }
                    }
                }
                this.currentTask = currentTask;
                this._isRestore = false;
                this.restoreTaskTimeout();

            }
        }
        ,

        /**
         * РАБОТА С КУКИ
         */

        /**
         * Записать куки редактора картыy
         * @method _writeedCookie
         * @param cssslider {Boolean} Флаг наличия панели создания объекта
         */
        _writeedCookie: function (cssslider) {
            var startdate = (!this.options.transaction.startdate.date || this.options.transaction.startdate.date == '') ? null : 'transaction_startdate=' + this.options.transaction.startdate.date.getTime().toString();
            var enddate = (!this.options.transaction.enddate.date || this.options.transaction.enddate.date == '') ? null : 'transaction_enddate=' + this.options.transaction.enddate.date.getTime().toString();
            var value = ['id=' + this.id,
                'objectinfoExt=' + this.objectinfoExt,
                'limit=' + this.options.topology.limit,
                'captureradius=' + this.options.topology.captureradius,
                'transaction_servicerecord=' + this.options.transaction.servicerecord,
                'autosave=' + this.options.autosave,
                'objectselectionInPoint=' + ((this.options.objectselectionInPoint) ? 1 : 0),       // Выбор объекта в точке
                'capturePoints=' + ((this.options.capturePoints) ? 1 : 0),                         // Захват точек
                'captureVirtualPoints=' + ((this.options.captureVirtualPoints) ? 1 : 0)            // Захват виртуальных точек
            ];

            if (startdate)
                value.push(startdate);
            if (enddate)
                value.push(enddate);

            value = value.join('&');
            GWTK.cookie('mapeditorExt', value, {expires: 5, path: '/'});
        }
        ,

        /**
         * Прочитать куки панели инструментов карты
         * @method _readCookie
         */
        _readCookie: function () {
            var param = GWTK.cookie("VisiblePanels", GWTK.cookies.converter);
            if (param === undefined) return;

            //var tool = panel_button - mapEditor
            var tool = this.mapTool("mapeditor");
            if (!tool) return;

            $.each(param, function (index, value) {
                var key = value.shift();
                var key_value = value.length > 0 ? value.shift() : '';
                key_value = key_value.split(',');
                if (key == 'panel_button-' + tool.toolname) {
                    button = $('#' + key);
                    panel = button[0]._pane;
                    if (key_value[0] == 'show') {
                        $('#panel_button-' + tool.toolname).click();
                    }
                }
            });
            return;
        }
        ,

        /**
         * Прочитать куки редактора карты
         * @method _readedCookie
         */
        _readedCookie: function () {

            var param = GWTK.cookie("mapeditorExt", GWTK.cookies.converter);
            if (!param) return;

            $.each(param, GWTK.Util.bind(function (index, value) {
                var key = value.shift();
                var key_value = value.length > 0 ? value.shift() : '';
                switch (key) {
                    case 'id':
                        if (key_value != this.id)
                            return;
                        break;
                    case 'objectinfoExt':
                        this.objectinfoExt = JSON.parse(key_value);
                        break;
                    case 'limit':
                        if (key_value) {
                            this.options.topology.limit = parseFloat(key_value);
                        }
                        break;
                    case 'captureradius':
                        if (key_value) {
                            this.options.topology.captureradius = parseFloat(key_value);
                        }
                        break;
                    // даты в миллисекндах
                    case 'transaction_startdate':
                        if (key_value != '')
                            this.options.transaction.startdate.date = new Date(parseInt(JSON.parse(key_value)));
                        break;
                    case 'transaction_enddate':
                        if (key_value != '')
                            this.options.transaction.enddate.date = new Date(parseInt(JSON.parse(key_value)));
                        break;
                    case 'transaction_servicerecord':
                        this.options.transaction.servicerecord = parseInt(JSON.parse(key_value));
                        break;
                    case 'autosave':
                        this.options.autosave = parseInt(JSON.parse(key_value));
                        break;
                    case 'objectselectionInPoint':   // Выбор объекта в точке
                        this.options.objectselectionInPoint = parseInt(JSON.parse(key_value));
                        break;
                    case 'capturePoints':   // Захват точек
                        this.options.capturePoints = parseInt(JSON.parse(key_value));
                        break;
                    case 'captureVirtualPoints':   // Захват виртуальных точек
                        this.options.captureVirtualPoints = parseInt(JSON.parse(key_value));
                        break;
                }
            }, this));

            // Инициализация даты транзакций
            this.inittransactiondate('start');
            this.inittransactiondate('end');
        }
        ,


        /**
         * ФУНЦИИ СМЕНЫ ИЗОБРАЖЕНИЙ (КАРТЫ, ОКНА, КОНТУРОВ ОБЪЕКТА, СЛУЖЕБНЫХ КОНТУРОВ ...)
         */

        /**
         * Перерисовка карты
         * @method refreshmap
         */
        refreshmap: function () {
            if (!this.map) {
                return;
            }
            // перерисовать карту
            if (this.map.tiles && this.map.tiles.wmsManager) {
                this.map.tiles.wmsManager.view_refresh = true;
                this.map.tiles.wmsManager.wmsDrawing();
            }
            // Перерисуем выделение
            var selectedFeatures = (this.map.objectManager) ? this.map.objectManager.selectedFeatures : null;
            if (selectedFeatures && this.isGroupProcess)
                selectedFeatures.drawSelectedObjects(true);

        }
        ,

        /**
         * ПАНЕЛЬ ДЛЯ РИСОВАНИЯ
         */
        /**
         * Создание панели для рисования объекта
         * @method createDrawpanel
         */
        createDrawpanel: function () {
            if (this.editobjects.length == 0) {
                this.editobjects[0] = new GWTK.mapobject(this.map, '0');
            }

            if (!this.map.drawPane || !this.editobjects[0].gid)
                return;
            this.clearDrawpanel(this.editobjects[0]);

            this.drawpanel = GWTK.DomUtil.create('div', 'overlay-panel', this.map.drawPane);
            this.drawpanel.id = this._drawOverlayPane + this.getDrawpanelId(this.editobjects[0]);

            return true;
        },

        /**
         * Очистить панель для рисования
         * @param editobject
         */
        clearDrawpanel: function (editobject) {
            var elem;
            if (elem = this.isDrawpanel(editobject)) {
                $(elem).remove();
            }
        },

        /**
         * Проверить наличие ранели для рисования
         */
        isDrawpanel: function (editobject) {
            if (editobject && editobject.gid) {
                var elem = GWTK.MapEditorUtil.byId(this._drawOverlayPane + this.getDrawpanelId(editobject));
                return elem;
            }
            return null;
        },

        /**
         * Запросить идентификатор паели для рисования объекта
         * @param editobject
         * @returns {void | string | *}
         */
        getDrawpanelId: function (editobject) {
            if (editobject && editobject.gid) {
                return editobject.gid.replace(/\./g, '_');
            }
        },

        /**
         * Создание панели для рисования объекта
         * @method getdrawpanel
         */
        getdrawpanel: function () {
            return this.drawpanel;
        },

        /**
         * Восстановить размеры панели отрисовки объекта
         * @method restoredrawpanel
         */
        restoredrawpanel: function () {
            if (!this.drawpanel) return;

            this.zIndexRestore();

            this.drawpanel.style.width = '0px';
            this.drawpanel.style.height = '0px';
            this.drawpanel.style.left = '0px';
            this.drawpanel.style.top = '0px';
            this.drawpanel.style.cursor = 'default';

        },

        /**
         * Восстановление z-индекса панели рисования
         */
        zIndexRestore: function () {
            $(this.map.drawPane).css('zIndex', this.zIndex);
        }
        ,
        /**
         * Функция отрисовки редактируемого объекта с габаритной рамкой
         * @param svg
         * @param drw_points
         * @param drw_centerpoints
         * @param noevents
         * @param bbox
         */
        draw: function (svg, drw_points, drw_centerpoints, noevents, bbox) {
            if (!this.editobjects || !this.editobjects[0])
                return;

            var subaction = (this.map && this.map.taskManager && this.map.taskManager._action) ? this.map.taskManager._action.name : null;

            // Если расширенный action, то не полнимать панель
            var extra = (subaction && subaction.indexOf(this.extraAction) >= 0);
            if (!extra) {
                this.drawobject.zIndexDrawPanel('up', this.drawpanel);
                this.drawobject.pointerEventsDrawPanel(this.drawpanel);
            }
            else {
                this.drawobject.zIndexDrawPanel('down', this.drawpanel);
                this.drawobject.pointerEventsDrawPanel(this.drawpanel, 'none');
            }

            if (this.isGroupProcess) {
                this.drawobject.drawGEOJSON(this.drawSelectFeatures.mapobjects, this.drawSelectFeatures.mapobjectsToGeoGSON(true), svg, noevents, true);
                return;
            }

            // Отрисовка из action
            if (this.currentAction && this.currentAction.draw) {
                this.currentAction.draw();
            }
            else {
                this.drawobject.draw(this.editobjects[0], svg);
            }

        },
        /**
         * Обновить изображение редактируемого объекта
         * @method updatedrawcontur
         * @param nometrics {Boolean} - если true -
         * то не обновляется содержимое окна ввода координат с клавиатуры
         * @param subaction {String} - наименование обработчика
         * @param subjectnumber {int} - номер подобъекта (с 0)
         * @param pointnumber {int} - номер точки подобъекта (с 0)
         */
        updatedrawcontur: function (nometrics, subaction, subjectnumber, pointnumber) {

            if (!subaction) {
                if (this.map && this.map.taskManager && this.map.taskManager._action)
                    subaction = this.map.taskManager._action.name;
            }

            this.drawobject.drw_centerpoints = (subaction == 'editing') ? true : false;
            var bbox = (subaction == 'editing') ? true : false;

            // Перерисовка контуров
            if (this.isGroupProcess)
                this.drawobject.drawGEOJSON(this.drawSelectFeatures.mapobjects, this.drawSelectFeatures.mapobjectsToGeoGSON(true), this.drawobject.svgDraw, null, true);
            else {
                this.draw(this.drawobject.svgDraw, true, (this.currentTask != 'edit') ? false : true, null, true);
            }

            if (this.editobjects[0] && this.drawpanel && this.editobjects[0].geometry.count() > 0) {
                if (!nometrics && this.metrics) {
                    this.metrics.creategrid(this.editobjects[0].geometry.saveJSON(true), null, (subjectnumber) ? subjectnumber : 0, null, (pointnumber) ? pointnumber : 0);
                }
            }

            this.addmenu();

        }
        ,

        /**
         * СОЗДАНИЕ ИНФОРМАЦИОННЫХ ПАНЕЛЕЙ
         */


        /**
         * Добавление панели со списком семантик объекта
         * @method addsemanticEditor
         * @param semantics {Array} - Массив семантик (GWTK.rscsemantic)
         */
        addsemanticEditor: function (semantics) {
            // ограничение по семантике или ее отсутствие
            if (!semantics) {
                return;
            }

            var _classifier = this.layer.classifier,
                id = this.preInfoTab + this.getPanelEditorId(this.panelsId['editor']) + 'Attributes',
                parent = GWTK.MapEditorUtil.byId(id);
            if (parent) {
                var size = [GWTK.MapEditorUtil.width(parent), GWTK.MapEditorUtil.height(parent)];
                if (this.graphic) {
                    this.semanticoptions_graphic.size = size;
                    this.rscsemantics = new GWTK.SemanticEditor(this.map, _classifier, id, semantics, this.semanticoptions_graphic);
                }
                else {
                    this.semanticoptions.size = size;
                    this.rscsemantics = new GWTK.SemanticEditor(this.map, _classifier, id, semantics, this.semanticoptions);
                }

                // собщения от окна семантики
                $(this.map.eventPane).off('changedata_semantics', this.onChangeDataSemantics);
                $(this.map.eventPane).on('changedata_semantics', this.onChangeDataSemantics);
            }
            this.updatetitle();

        }
        ,

        /**
         * Обновление заголовка в панели информации
         * @method updatetitle
         * @param text {String} Текст заголовка
         */
        updatetitle: function (text) {
            if (!text) return;
            var span = $('#' + this.panelsId['main']).find(".divHeader").find(".panel-info-header").find('span');
            if (span.length > 0) {
                span = $(span[0]);
                span.empty();
                span.text(text);
            }
        }
        ,

        /**
         * Запросить объект rscobject по ключу объекта
         * @method getrscobject
         * @param key {String} Ключ объекта
         */
        getrscobject: function (key, code) {
            if (!key && !code) return;
            this.layer = this.map.tiles.getLayerByxId(this.maplayerid.layerid);
            if (this.layer)
                return this.layer.classifier.getobject(key, code);
        }
        ,

        /**
         * ФУНКЦИИ СОЗДАНИЯ ДОПОЛНИТЕЛЬНЫХ МЕНЮ И РАБОТЫ С НИМИ
         */

        /**
         * Добавление в основную панель редактора панели динамичеких режимов:
         * история, сохранение, удаление
         * @method addmenu
         * @param parent {Element} - Родительский элемент
         */
        addmenu: function (parent, type) {

            this.destroyAddmenu();

            var parent = GWTK.MapEditorUtil.byId(this.panelsId['editor'] + this.button_ids.process);
            if (!parent) return;

            // история
            var history = (!type) ? this.htmlHistory('history') : (this.param.transaction ? this.htmlHistory(type) : ''),
                // count = this.history.count(),
                pcount = (this.editobjects.length > 0 && this.editobjects[0].geometry) ? this.editobjects[0].geometry.count() : 0,
                savedisabled = 'disabledbutton',
                canceldisabled = (this.currentAction) ? '' : 'disabledbutton';

            if ((this.isfunction(this.functions, "edit") || this.isfunction(this.functions, "create")) && this._ischange && pcount > 0) {
                savedisabled = '';
            }

            // Недоступность кнопок сохранения и отказа
            var elSave = GWTK.MapEditorUtil.byId(this.panelsId['editor'] + this.button_ids["save"]),
                elCancel = GWTK.MapEditorUtil.byId(this.panelsId['editor'] + this.button_ids["cancel"]);

            if (elSave) {
                if (savedisabled == '') {
                    GWTK.MapEditorUtil.removeClass(elSave, 'disabledbutton');
                } else {
                    GWTK.MapEditorUtil.addClass(elSave, 'disabledbutton');
                }

                // Добавить историю
                elSave.insertAdjacentHTML('beforebegin', '<div id="' + this.panelsId['editor'] + 'mapeditingAddmenu" class="divFlex divFlexStart" >' +
                    history +
                    ' </div>');
            }

            if (canceldisabled == '') {
                GWTK.MapEditorUtil.removeClass(elCancel, 'disabledbutton');
            } else {
                GWTK.MapEditorUtil.addClass(elCancel, 'disabledbutton');
            }

            // назад
            var elPrev = GWTK.MapEditorUtil.byId(this.panelsId['editor'] + 'mapeditingAddmenu_history_prev');
            if (elPrev) {
                elPrev.onclick = GWTK.Util.bind(function (event) {
                    this.restorehistory('prev');
                    this.addmenu();
                }, this);
            }

            // вперед
            var elNext = GWTK.MapEditorUtil.byId(this.panelsId['editor'] + 'mapeditingAddmenu_history_next');
            if (elNext) {
                elNext.onclick = GWTK.Util.bind(function (event) {
                    this.restorehistory('next');
                    this.addmenu();
                }, this);
            }
        }
        ,

        /**
         * Разрушение панелей доролнительного меню (активного режима)
         * @method destroyAddmenu
         */
        destroyAddmenu: function () {
            GWTK.MapEditorUtil.remove(this.panelsId['editor'] + 'mapeditingAddmenu');
            var el = $('.mapeditingAddmenu_transaction');
            if (el && el.length > 0) {
                GWTK.MapEditorUtil.show(el[0]);
            }
        }
        ,

        /**
         * ФУНКЦММ РАБОТЫ С ОБРАБОТЧИКАМИ
         */

        /**
         * Закрыть обработчик
         * @method closeAction
         */
        closeAction: function (name) {
            return this.map.closeAction();
        }
        ,

        /**
         * Назначить обработчик
         * @method setAction
         * @param action {Object} - объект-обработчик
         */
        // Назначить обработчик
        setAction: function (action) {
            if (!action || action.error) return;
            return this.map.setAction(action)
        }
        ,

        /**
         * Запрос на возможность завершения задачи
         * @method canClose
         * @param task {Boolean} - признак того, что это обработчик компонента Редактор карты
         */
        canClose: function (task) {
            if (this.isGroupDeleteProcess)
                return false;

            // Если запускается не наш обработчик
            if (this.map.taskManager._newaction && (this.notOurAction = !(this.isOurAction(this.map.taskManager._newaction)))) {
                this.extend = false;
            }

            // Если это раширение режима в нашем обработчике
            if (this.extend) {
                return true;
            }

            this.extend = false;
            var regime = this.currentTask;
            if (!regime) return true;

            this.canCancel = true;

            // Очистить панель рисования
            this.clearDrawpanel(this.editobjects[0]);

            // Теперь спрашивать про сохранение
            if (this._ischange) {
                this.isChange(false);
                if (this.editobjects && this.editobjects.length >= 1 &&
                    this.editobjects[0].geometry && this.editobjects[0].geometry.count() > 0) {
                    // Подготовим объекты для сохранения
                    this.setCloneForSave();
                    // Сделать запрос на сохранение
                    try {
                        w2confirm(w2utils.lang("You are sure that you want to cancel editing? In this case your changes won't be kept."), w2utils.lang("Map editor"), GWTK.Util.bind(function (answer) {
                            if (answer == 'No') {// Объект Сохраняется
                                this.isSaveConfirmErrors(regime);
                            }
                        }, this));
                    }
                    catch(e){
                        console.log('canClose: ', e);
                    }
                }

            }
            // Это не наш обработчик
            if (this.notOurAction) {
                this.clear();
            }

            return this.canCancel;
        }
        ,

        /**
         * Запрос на сохранение при ошибках
         * @method isSaveConfirmErrors
         */
        isSaveConfirmErrors: function (regime) {
            if (this.message && this.message.length > 0) {
                try {
                    w2confirm(this.message + '\n\r' + w2utils.lang("Continue saving?"), w2utils.lang("Map editor") + ': ' + w2utils.lang("error..."), GWTK.Util.bind(function (answer) {
                        if (answer == 'Yes')
                            this.save(regime);
                    }, this));
                }
                catch(e){
                    console.log('isSaveConfirmErrors');
                }
            }
            else {
                this.save(regime);
            }
        }
        ,

        /**
         * html код для кнопок отмены операций
         * @method htmlHistory
         * @param history {Boolean} = true - кнопки для истории, иначе кнопки для транзакций
         */
        htmlHistory: function (type) {
            var htmlhistory = '', disablednext = '', disabledprev = '',
                classname = 'mapeditingAddmenu_',
                newid = classname + type,
                titleprev = w2utils.lang("Cancel operation"),
                titlenext = w2utils.lang("Restore the operation");

            // var nextscr = GWTK.imgNext, prevscr = GWTK.imgPrev;
            if (type == 'history') {
                disablednext = (this.history.current < this.history.count() - 1) ? '' : 'disabledbutton';
                disabledprev = (this.history.current >= 0) ? '' : 'disabledbutton';

                titleprev += ' (Сtrl+Z)';
                titlenext += ' (Сtrl+Y)';
            }

            // Кнопки с историей удаляем
            $('.' + classname + 'history').remove();
            // Далее по сценарию
            var el = $('.' + newid);
            if (type == 'transaction') {
                if (el.length > 0) {
                    if (this.layer instanceof GWTK.graphicLayer == false) {
                        // //el.show();
                        // el.css('display', '');
                        GWTK.MapEditorUtil.show(el[0]);
                    }
                    else {
                        // // el.hide();
                        // el.css('display', 'none');
                        GWTK.MapEditorUtil.hide(el[0]);
                    }
                    return htmlhistory;
                }
            }
            else {
                //$('.' + classname + 'transaction').hide();
                $('.' + classname + 'transaction').css('display', 'none');
            }

            htmlhistory =
                '<div class="divFlex ' + newid + '">' +
                '<div id="' + this.panelsId['editor'] + newid + '_prev" class="control-button border-button control-button_addmenu clickable ' + disabledprev + '" style="background-image:url(' + GWTK.imgPrev + ')" Title=" ' + titleprev + '" > </div> ' +
                '<div id="' + this.panelsId['editor'] + newid + '_next" class="control-button border-button control-button_addmenu clickable ' + disablednext + '" style="background-image:url(' + GWTK.imgNext + ')" Title=" ' + titlenext + '" > </div> ' +
                '</div>';

            return htmlhistory;
        }
        ,

        /**
         * ФУНКЦИИ РАБОТЫ С КОМПОНЕНТАМИ СОСТАВА СЛОЕВ, ВЫБОРА ОБЪЕКТОВ ИЗ ЛЕГЕНДЫ
         */

        initLayerList: function (parent, listid, nographic, align, width) {
            if (!this.maplayerid || !parent) return;

            align = (!align) ? 'center' : align;
            width = (!width) ? '300px' : width;
            var label = (this.maplayersid.length > 1) ? w2utils.lang("Layers") : w2utils.lang("Layer");
            var strmaps =
                '<tr>' +
                '<td>' +
                '<div class="w2ui-field w2ui-span3">' +
                '<label style = "text-align:' + align + ' !important;">' + label + ':</label>' +
                '<div> ' +
                '<input type="list" id="' + listid + '" style="width: ' + width + ' !important;">' +
                //'<select id="' + listid + '" style="width: ' + width + ' !important;">' +
                '</div>' +
                '</div>' +
                '</td>' +
                '</tr>';

            var strpanel =
                strmaps +
                '<tr>' +
                '<td>' +
                '<div id="' + this.classifersliderId + this.maplayerid.layerid + '" class="resizable panel-mapcontent-container" style="width: 100%; overflow: auto; padding-right: 1px;"></div>' +
                '</td>' +
                '</tr>';

            //$(parent).append('<table width="100%">' + strpanel + '</table>');
            parent.innerHTML = '<table width="100%">' + strpanel + '</table>';

        }
        ,

         /**
         * Список слоев для компонента списка слоев (режим Создания)
         * @method setSelectMaps
         */
        setSelectMaps: function (selector, nographic, fn_set, fn_change) {
            if (!selector || !fn_set || !fn_change) return;

            if ($(selector).length == 0) {
                return;
            }

            var maps = new Array(),
                layer, index = -1, _that = this;
            for (var i = 0; i < this.maplayersid.length; i++) {
                layer = this.map.tiles.getLayerByxId(this.maplayersid[i].layerid);
                if (!layer || (nographic && layer instanceof GWTK.graphicLayer) || !layer.visible)
                    continue;
                maps.push({
                    id: this.maplayersid[i].layerid,
                    text: layer.alias
                });
                if (this.maplayersid[i].layerid == this.maplayerid.layerid) {
                    index = i;
                }
            }
            var ellistid = $(selector);
            if (!ellistid || ellistid.length == 0) {
                return;
            }

            ellistid.off();
            ellistid.w2field('list',
                {items: maps, selected: maps[index]});
            ellistid.change(GWTK.Util.bind(function (event) {
                var obj = ellistid.data('selected');
                if (obj) {
                    var layer = this.map.tiles.getLayerByxId(obj.id);
                    // функция обратного вызова
                    if (layer && fn_change) {
                        fn_change(layer);
                    }
                }
            }, this))

            // Если ничего не выбрали
            if (fn_set) {
                if (index < 0) {
                    if (maps) {
                        if (maps.length > 0) {
                            // установливаем первый слой
                            index = 0;
                            fn_set(this.map.tiles.getLayerByxId(maps[index].id));

                        } else {
                            fn_set(null);
                        }
                    }
                }
                else {
                    fn_set(this.map.tiles.getLayerByxId(maps[index].id));
                }
            }

        }
        ,

        /**
         * ФУНКЦИИ ЗАВЕРШЕНИЯ ОПЕРАЦИЙ
         */

        /**
         * Сохранение изменений
         * @method save
         * @param regime {String} Режим сохранения изменений ('replace', 'delete' или 'create')
         */
        save: function (regime) {

            // Скинем флажок изменений
            this.isChange(false);

            $('#' + this.popupId).remove();

            var _that = this,
                count = this.editobjectsSave.length;

            var editobjectsSave = new Array();
            // Сохраним отредатированный объект вместе с объектами топологии
            for (var i = 0; i < count; i++) {
                editobjectsSave.push(this.editobjectsSave[i].editobject);
            }

            if (editobjectsSave.length > 0) {

                if (this.editobjectsSave[0].editobject && this.editobjectsSave[0].editobject.gid) {
                    regime = this.getTaskByGID(this.editobjectsSave[0].editobject.gid);
                }
                if (regime == 'edit' || regime == 'move') {
                    regime = 'replace';
                }

                // Если автономный запуск, отослать триггер и закрыть задачу
                if (this.autonomous) {
                    var saveJSON = [];
                    for (var i = 0; i < count; i++) {
                        saveJSON.push(editobjectsSave[i].saveJSON());
                    }
                    this.closeAutonomous('save', saveJSON);
                    return;
                }

                // Заменим в списке выбранных объектов в точке
                var find;
                if (regime == 'replace') {
                    find = this.drawSelectFeatures.mapobjects.find(
                        function (element, index, array) {
                            if (element.gid == _that.editobjectsSave[0].editobject.gid) {
                                _that.drawSelectFeatures.mapobjects.splice(index, 1, _that.editobjectsSave[0].editobject.clone());
                                return true;
                            }
                        });
                }

                // Разберем массив объектов на массивы по идентификаторам слоев для сохранения
                this.editobjectsSaveByLayer.splice(0, this.editobjectsSaveByLayer.length);
                this.editobjectsSaveByLayer.push({
                    'mli': editobjectsSave[0].maplayerid,
                    'save': false,
                    'mapobjects': [editobjectsSave[0]]
                });
                for (var i = 1; i < editobjectsSave.length; i++) {
                    find = this.editobjectsSaveByLayer.find(
                        function (element, index, array) {
                            if (element.mli == editobjectsSave[i].maplayerid) {
                                element.mapobjects.push(editobjectsSave[i]);
                                return true;
                            }
                        });
                    if (!find) {
                        this.editobjectsSaveByLayer.push(
                            {'mli': editobjectsSave[i].maplayerid, 'save': false, 'mapobjects': [editobjectsSave[i]]});
                    }
                }

                // Сохраним все
                // Первый сохраняем всегда
                // Сохранение можно предотвратить, перехватив событие 'mapeditor' вместе с action 'saveMapobjects'
                // и установив параметр canSave в значение false. Пример такого события:
                // $(this.map.eventPane).on('mapeditor', function (event, data) {
                //     console.log(event.action);  // saveMapobjectssaveMapobjects
                //     console.log(event.objectsByLayer);  // список слоёв и изменённых объектов карты
                //     console.log(event.regime);  // Режим сохранения 'create' - создание, 'delete' - удаление, 'replace' - изменение
                //     data.canSaveToMap = true;   // разрешить сохранение объекта в карту на сервисе
                //     data.stopEdit = true;  // выйти из режима редактирования, если принято решение не сохранять объект
                // });
                var triggerData = {
                    canSaveToMap: true,
                    stopEdit: true
                };

                $(this.map.eventPane).trigger({
                    type: 'mapeditor',
                    action: 'saveMapobjects',
                    regime: regime,
                    objectsByLayer: this.editobjectsSaveByLayer,
                    sender: _that
                }, triggerData);

                for (var i = 0; i < this.editobjectsSaveByLayer.length; i++) {
                    //Если в списке отобранных объектов больше одного, то сохраняем как есть,
                    // иначе остальные объекты для сохранения обновляем
                    if (i > 0 && !this.isGroupProcess)
                        regime = 'replace';
                    if (triggerData.canSaveToMap) {
                        this.editobjectsSaveByLayer[i].mapobjects[0].save(regime, false, this.editobjectsSaveByLayer[i].mapobjects);
                    } else if (triggerData.stopEdit) {
                        this.editobjectsSaveByLayer[i].mapobjects[0].createtrigger(regime);
                    }
                }

            }
        }
        ,

        /**
         * Сделать клоны объектов для сохранения
         * @method setCloneForSave
         */
        setCloneForSave: function () {
            this.editobjectsSave.splice(0, this.editobjectsSave.length);
            var i, k, cloneobj, error,
                len = (this.isGroupProcess) ? this.editobjects.length : ((this.editobjects.length) ? 1 : 0);

            for (i = 0; i < len; i++) {
                // Семантика
                if (this.rscsemantics) {
                    if (this.rscsemantics.save()) {
                        // Изменить семантики объекта
                        // GWTK.MapEditorUtil.setsemanticmask(this.editobjects[i].semantic, this.rscsemantics._object);
                        this.editobjects[i].semantic.updatesemantics(this.rscsemantics._object);
                    }
                }

                // Проверим объект
                if (!this.editobjects[i].spatialposition) {
                    if (this.graphic) { // Если графический слой
                        this.editobjects[i].spatialposition = this.layer.classifier;
                    }
                }
                // сделаем клон объекта и отправим его на сохранение
                this.editobjectsSave.push({'editobject': this.editobjects[i].clone(), 'save': false});

                // // Отрисуем, если спрашиваем разрешение, иначе не будем рисовать
                // var selectobject = this.editobjectsSave[i].editobject.clone();
                // selectobject.saveJSON();
                // if (!this.autonomous) {
                //     this.drawSelectFeatures.drawobject(selectobject.gid, true, true);
                // }
            }

            // Если топология и есть список измененных объектов
            if (this.topology && this.topology.topologyobjectsJSON.count() > 0) {
                // Сохранить объекты топологии
                this.topology.setCloneForSave(this.editobjectsSave);
            }

            this.message = '';
            // Контроль контуров и выдача сообщений
            for (var i = 0; i < this.editobjectsSave.length; i++) {
                // Ошибки геометрии
                errors = this.editobjectsSave[i].editobject.geometry.errors;
                if (errors.count() > 0) {
                    this.message += this.editobjectsSave[i].editobject.maplayername + ' ' + this.editobjectsSave[i].editobject.name + '<p>';
                    this.message += '<p>' + w2utils.lang('Geometry') + ':' + '</p>';
                    for (var j = 0; j < errors.count(); j++) {
                        this.message += '</p><p>' + errors.get([j]).message;
                    }
                    this.message += '.</p>';
                }

                // Ошибки семантики при включеной закладке семантики
                if (this.isfunction(this.info, 'semantics')) {
                    errors = this.editobjectsSave[i].editobject.semantic.errors;
                    if (errors.count() > 0) {
                        this.message += this.editobjectsSave[i].editobject.maplayername + ' ' + this.editobjectsSave[i].editobject.name + '<p>';
                        this.message += '<p>' + w2utils.lang('Attributes') + ':' + '</p>';
                        for (var j = 0; j < errors.count(); j++) {
                            this.message += '</p><p>' + errors.get([j]).message;
                        }
                        this.message += '.</p>';
                    }
                }

            }
        }
        ,

        /**
         * ФУНКЦИИ ОБНОВЛЕНИЯ КООРДИНАТ ТОЧЕК СОЗДАВАЕМОГО/РЕДАКТИРУЕМОГО ОБЪЕКТА
         */

        /**
         * Удаление точки объекта
         * @method deletepoint
         * @param number {Int} - Номер точки с 1
         * @param subject {Int} - Номер контура с 0
         * @param y {Int} - Координата экрана y
         */
        deletepoint: function (number, subject, subaction) {
            if (number < 0 || !this.editobjects[0] || !this.editobjects[0].geometry) return;
            var closing = false;
            if (subaction == 'editing')
                closing = this.editobjects[0].geometry._isclosing(number, subject);

            // история
            this.history.add('delete', number, subject, null, this.editobjects[0].geometry.getpoint(number, subject));

            this.editobjects[0].geometry.deletepoint(number, subject);

            //// Проверить на пересечение
            //var ret = this.isIntersectionSubjectSubjects(null, subject);
            //if (ret >= 0) {
            //    w2alert(w2utils.lang("Edited site of a contour has crossed ") + ret.toString() + w2utils.lang(" contour of the edited object") + '. ' + w2utils.lang("Operation canceled") + '.');
            //    this.restorehistory('prev');
            //    return;
            //};

            // замкнуть объект, если он до этого был замнут (полигон)
            if (closing)
                this.closeobject(true, subject);
            this.isChange(true);
        }
        ,

        /**
         * Удаление точек объекта
         * @method deletesegment
         * @param pointsnumber {Array} - массив из номеров трех точек (нумерация с 1)
         * @param subject {Int} - Номер контура с 0
         */
        deletesegment: function (pointsnumber, subject, subaction) {
            if (!this.editobjects[0] || !this.editobjects[0].geometry ||
                !pointsnumber || pointsnumber instanceof Array == false || pointsnumber.length < 3)
                return;

            var newgeometry = this.editobjects[0].geometry.createcopy();

            GWTK.newgeometry = this.editobjects[0].geometry;
            var isdelete = this.editobjects[0].geometry.deletesegment([pointsnumber[0], pointsnumber[1], pointsnumber[2]], subject);

            if (isdelete) {

                // // Запись в журнал, минуя историю.
                // this.addTransactionWithoutHistory('all', 'deletesegment');

                if (this.editobjects[0].geometry.points.length < 1) {
                    this.editobjects[0].geometry = newgeometry.createcopy();
                    return;
                }

                // история
                this.history.add('all', null, 0, null, null, null, newgeometry, this.editobjects[0].geometry);

                this.isChange(true);
                this.updatedrawcontur(null, subaction);
            }
        }
        ,

        /**
         * смещение точек объекта
         * @method offsersegment
         * @param pointsnumber {Array} - массив из номеров трех точек (нумерация с 1)
         * @param subject {Int} - Номер контура с 0
         * @param deltageo{Array} - смещение в geo координатах
         */
        offsetsegment: function (pointsnumber, subject, deltageo, subaction) {
            if (!this.editobjects[0] || !this.editobjects[0].geometry ||
                !pointsnumber || pointsnumber instanceof Array == false || pointsnumber.length < 3)
                return;

            var newgeometry = this.editobjects[0].geometry.createcopy();
            var isoffset = this.editobjects[0].geometry.offsetsegment(pointsnumber, subject, deltageo);

            if (isoffset) {
                // // Запись в журнал, минуя историю.
                // this.addTransactionWithoutHistory('all', 'offsetsegment');

                if (this.editobjects[0].geometry.points.length < 1) {
                    this.editobjects[0].geometry = newgeometry.createcopy();
                    return;
                }

                // история
                this.history.add('all', null, 0, null, null, null, newgeometry, this.editobjects[0].geometry);
                this.isChange(true);
                this.updatedrawcontur(null, subaction);
            }
        }
        ,

        /**
         * обновление сегмента объекта
         * @method updatesegment
         * @param pointsnumber {Array} - массив из номеров трех точек (нумерация с 1)
         * @param subject {Int} - Номер контура с 0
         * @param mapgeometry (GWTK.mapgeometry) - объект новой геометрии
         */
        updatesegment: function (pointsnumber, subject, mapgeometry, subaction) {
            if (!this.editobjects[0] || !this.editobjects[0].geometry ||
                !pointsnumber || pointsnumber instanceof Array == false || pointsnumber.length < 3)
                return;

            var newgeometry = this.editobjects[0].geometry.createcopy();
            var isupdate = this.editobjects[0].geometry.updatesegment(pointsnumber, subject, mapgeometry);

            if (isupdate) {
                // // Запись в журнал, минуя историю.
                // this.addTransactionWithoutHistory('all', 'updatesegment');

                if (this.editobjects[0].geometry.points.length < 1) {
                    this.editobjects[0].geometry = newgeometry.createcopy();
                    return;
                }

                // история
                this.history.add('all', null, 0, null, null, null, newgeometry, this.editobjects[0].geometry);
                this.isChange(true);
                this.updatedrawcontur(null, subaction);
            }
        }
        ,

        /**
         * Замыкание  объекта
         * @method closeobject
         * @param update {Boolean} - true  - заменяется первая точка на последнюю
         *                           false - добавлется последняя точка, равная первой
         * @param subjectnumber {Int} - Номер контура с 0
         */
        closeobject: function (update, subjectnumber) {
            if (!this.editobjects || this.editobjects.length == 0) {
                return;
            }
            var ret = true,
                geometry = this.editobjects[0].geometry;

            if (!geometry) return ret;
            var count = geometry.count(subjectnumber);
            if (count == 0) return ret;

            var pointfirst = geometry.getpoint(1, subjectnumber), pointlast = geometry.getpoint(count, subjectnumber);
            if (!pointfirst.x || !pointlast.x) return;

            if (pointfirst.x == pointlast.x && pointfirst.y == pointlast.y)
                return ret;

            if (update) {
                ret = geometry.closeobject(update, subjectnumber);
            }
            else {
                ret = geometry.closeobject(update, subjectnumber);
                var number = geometry.count() - 1;
                this.history.add('insert', number, subjectnumber, null, null, geometry.getpoint(number + 1, subjectnumber));
            }

            if (ret)
                this.isChange(true);
            return ret;
        }
        ,

        /**
         * Смена направления цифрования
         * @method changedirection
         * @param subjectnumber {Int} - Номер контура с 0
         */
        changedirection: function (subjectnumber, subaction) {
            if (subjectnumber < 0) { // надо определить текущий п/о
                subjectnumber = this.getsubjectnumber();
            }
            this.editobjects[0].geometry.changedirection(subjectnumber);
            this.history.add('changedirection', null, subjectnumber);
            this.isChange(true);
            this.updatedrawcontur(null, subaction);
        }
        ,

        /**
         * Запросить номер подобъекта из компонента редактирования геометрии
         * @method changedirection
         * @param subjectnumber {Int} - Номер контура с 0
         */
        getsubjectnumberByMetrics: function () {
            return (this.metrics) ? this.metrics.subject : 0;
        }
        ,

        /**
         * Запросить номер редактируемого контура объекта из класса рисования
         * @method getsubjectnumber
         */
        getsubjectnumber: function () {
            var number = 0
            if (this.drawobject) {
                var el = this.drawobject.getpointElemLast();
                if (el)
                    number = this.drawobject.getsubjectnumber(el.id);
            }
            return number;
        },

        /**
         * Обновление координат точки объекта
         * @method updateObjectPoint
         * @param number {Int} Номер точки
         * @param subject {Int} Номер подобъекта
         * @param pointgeo (GWTK.Point) - геодезические координате точки
         * @param insert {Boolean} признак вставки новой точки (для серединных точек), иначе обновление существующей
         * @param currtaskaction {String} - текуший режим обработки объекта ('create' или 'edit')
         */
        updateObjectPoint: function (number, subjectnumber, geo, insert, currtaskaction) {

            var geometry = this.editobjects[0].geometry;
            if (!geometry || !geo) return;

            // Если работали с редактированием общих точек
            var subaction = (this.map && this.map.taskManager && this.map.taskManager._action) ? this.map.taskManager._action.name : null;
            if (subaction == 'editing') {
                var topojson = [null, null];
                if (this.map.taskManager._action.buttonmethod_edit == 'edallpoint') {
                    // Добавить в историю еще и топологию
                    topojson = this.map.taskManager._action.topojson;
                    if (!topojson) {
                        topojson = [null, null];
                    }
                }
            }

            if (insert) {// вставить точку
                geometry.insertpoint3D(geo[0], geo[1], null, number + 1, subjectnumber);
                // история
                this.history.add('insert', number, subjectnumber, null, null, geometry.getpoint(number + 1, subjectnumber), null, null, topojson[0], topojson[1]);
            }
            else {      // обновить точку

                // история
                var point_old = geometry.getpoint(number + 1, subjectnumber);
                var pointnew = new GWTK.Point3D(geo[0], geo[1], point_old.h)
                geometry.updatepoint(number + 1, subjectnumber, pointnew);

                if (this.editobjects[0].spatialposition == "polygon" && currtaskaction != 'create') {
                    var count = geometry.count(subjectnumber);
                    if (number == count - 1) {
                        geometry.updatepoint(1, subjectnumber, pointnew);
                    }
                    else {
                        if (number == 0)
                            geometry.updatepoint(count, subjectnumber, pointnew);
                    }
                }
                // история
                if (topojson) {
                    this.history.add('update', number, subjectnumber, null, point_old, pointnew, null, null, topojson[0], topojson[1]);
                }
                else {
                    this.history.add('update', number, subjectnumber, null, point_old, pointnew);
                }
            }

            //// Проверить на пересечение
            //var ret = this.isIntersectionSubjectSubjects(null, subjectnumber);
            //if (ret >= 0) {
            //    w2alert(w2utils.lang("Edited site of a contour has crossed ") + ret.toString() + w2utils.lang(" contour of the edited object") + '. ' + w2utils.lang("Operation canceled") + '.');
            //    this.restorehistory('prev');
            //    return;
            //};

            this.isChange(true);
            this.updatedrawcontur(null, null, subjectnumber, number);

            if (this.map.taskManager._action)
                this.map.taskManager._action.topojson = null;
        }
        ,

        /**
         * Смещение всех точкек объекта
         * @method offsetpoints
         * @param dx {Int} Смещение по оси х
         * @param dy {Int} Смещение по оси y
         * @param history {Boolean} Сохранить информацию в историю
         */
        // ===============================================================
        offsetpoints: function (dx, dy, history, subaction) {

            if (!dx && !dy) {
                return;
            }

            if (subaction != 'create')  // если редактирование (перемещение объекта)
                this.restoredrawpanel();
            var el, point, index = 0;

            // Если текущая задача - перемещение объектов
            if (!subaction) {
                subaction = (this.map && this.map.taskManager && this.map.taskManager._action) ? this.map.taskManager._action.name : null;
            }

            if (this.currentTask == 'move' || (subaction && subaction.indexOf('move') >= 0)) { // && this.isGroupProcess) {
                var coord, contours;
                for (var i = 0; i < this.editobjects.length; i++) {
                    contours = this.drawobject.svgDraw.getCoords_pixel_byId(this.drawobject.svgDraw.getId(this.editobjects[i].gid));
                    if (contours && contours.length > 0) {
                        index = i;
                        break;
                    }
                }
                if (!contours || contours.length == 0)
                    return;

                // Если объект точечный, то берем середину
                // иначе первую точку
                for (var i = 0; i < contours.length; i++) { // контура
                    coord = contours[i];
                    if (coord.length == 0)
                        continue;
                    if (coord[0].length > 1) {
                        if (this.editobjects[i].spatialposition.indexOf('point') >= 0) {
                            if (coord[2] && coord[2].length > 1) {
                                point = new GWTK.point(
                                    parseFloat(coord[0][0]) + (parseFloat(coord[2][0]) - parseFloat(coord[0][0])) / 2,
                                    parseFloat(coord[0][1]) + (parseFloat(coord[2][1]) - parseFloat(coord[0][1])) / 2)
                            }
                        }
                        else {
                            point = new GWTK.point(parseFloat(coord[0][0]), parseFloat(coord[0][1]));
                        }
                    }
                    if (point) break;
                }
            }
            else {
                el = this.drawobject.getpointElemByNumber(0, 0);
                if (!el) return;
                point = this.drawobject.getpositionByPointId(el.id);
            }
            if (!point) return;

            point = GWTK.point(point.x + dx, point.y + dy);
            var coord = this.map.tiles.getLayersPointProjected(point);
            var geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x),
                geopoint;
            var geopoint = this.editobjects[index].geometry.getpoint(1, 0);
            var delta = [geo[0] - geopoint.x, geo[1] - geopoint.y];
            if (geopoint.x) {
                for (var i = 0; i < this.editobjects.length; i++) {
                    this.editobjects[i].geometry.offsetpoints(delta);
                }
            }

            this.isChange(true);

            // история
            if (history)
                this.history.add('offset', null, null, GWTK.point(dx, dy), null);

            if (subaction != 'create')  // если редактирование (перемещение объекта)
                this.updatedrawcontur(null, 'editing');
        }
        ,

        /**
         * Добавить точку в геодезических координатах в объект
         * @method addpointgeo
         * @param b {Float} Широта
         * @param l {Float} Долгота
         * @param h {Float} Высота
         * @param subjectnumber {Int} Номер контура с 0
         * @param history {Boolean} Сохранить информацию в историю
         */
        addpointgeo: function (b, l, h, subjectnumber, histor) {
            if (!b || !l) return;

            var point = new GWTK.Point3D(b, l, h);
            subjectnumber = (subjectnumber) ? subjectnumber : 0;
            var number = this.editobjects[0].geometry.count(subjectnumber);
            this.editobjects[0].geometry.appendpoint3D(point.x, point.y, null, subjectnumber);
            // история
            if (history)
               this.history.add('insert', number, subjectnumber, null, null, point);

            this.isChange(true);

            // Занести метрику в окно с метрикой объекта
            if (this.metrics) {
                // this.metrics.creategrid(this.editobjects[0].geometry.saveJSON(true), null, (subjectnumber) ? subjectnumber : 0);
                this.metrics.creategrid(this.editobjects[0].geometry.saveJSON(true), null, (subjectnumber) ? subjectnumber : 0, null, (number) ? number : 0);
            }

            return number;
        }
        ,

        /**
         * Добавить точку в координатах экрана в объект
         * @method addpoint
         * @param x {Int} координата по оси х
         * @param y {Int} координата по оси y
         * @param h {Float} Высота
         * @param subjectnumber {Int} Номер контура с 0
         * @param history {Boolean} Сохранить информацию в историю
         , @param nooffset {Boolean} Не пересчитывать смещение координат
         */
        addpoint: function (x, y, h, subjectnumber, history, nooffset) {
            if (!this.editobjects || this.editobjects.length === 0 || !this.editobjects[0].geometry)
                return;

            // Определим смещение относительно начала экрана
            var geo = this.topology.pixel2geoOffset(x, y, nooffset);
            if (!geo) return;
            return this.addpointgeo(geo[0], geo[1], h, subjectnumber, history);
        }
        ,

        /**
         * Обновление данных в объекте selectedFeatures
         * @method updateselectedFeatures
         * @param regime {String}  режим ('delete', 'replace')
         * @param mapobjects (Array)  -  массив объектов editobjectsSave
         */
        updateselectedFeatures: function (regime, mapobjects, selectedFeatures) {
            var len;
            if (!mapobjects || ((len = mapobjects.length) == 0) || !selectedFeatures)
                return;
            for (var i = 0; i < len; i++) {
                // Найдем и обновим
                if (selectedFeatures.findobjectsByGid(mapobjects[i].gid)) {
                    if (regime == 'delete')
                        selectedFeatures.remove(mapobjects[i]);
                    else {
                        selectedFeatures.add(mapobjects[i]);
                    }
                }
            }
        }
        ,


        /**
         * ФУНКЦИИ ЗАПРОСОВ НА НАЛИЧИЕ, РАЗРЕШЕНИЕ ...
         */

        /**
         * Это обработчик Редактора карты?
         * @method isOurAction
         * @returns {Boolean} true - процесс создания или редактировавния активен
         */
        isOurAction: function (action) {
            if (!action || !action.task)
                return;
            return this.isOurTask(action.task);
        }
        ,

        /**
         * Входит ли слой в список редактируемых
         * @method iseditinglayer
         * @param layerid {String} Идентификатор слоя
         * @returns {Object} Найденный слой
         */
        iseditinglayer: function (layerid) {
            layerid = (layerid ? layerid : '').toString();
            return this.maplayersid.find(
                function (element, index, array) {
                    if (element.layerid && element.layerid.toLowerCase() == layerid.toLowerCase())
                        return element;
                });
        },

        /**
         * Имеются ли объекты для редактирования в настройках редактора
         * @method iseditingobjects
         * @param layerid {String} Идентификатор слоя
         * @returns {Object} Найденный список объектов слоя
         */
        iseditingobjects: function (layerid) {
            return GWTK.MapEditorUtil.iseditingobjects(this.iseditinglayer(layerid));
        },

        /**
         * Имеется ли объект в списке редактируемых объектов редактора объектов топологии
         * @method iseditinglayer_object
         * @param gid {String} Идентификатор слоя
         * @returns {Object} Найденный список объектов слоя
         */
        iseditinglayer_object: function (gid, code, key) {
            if (!gid) return;
            var layers = this.map.tiles.getLayersByGmlId(gid);
            if (!layers || layers.length == 0) return;
            var edlayer = this.iseditinglayer(layers[0].options.id);
            // Проверим маски объектов
            if (edlayer) {
                var edobjects = GWTK.MapEditorUtil.iseditingobjects(edlayer);
                // Если есть, то проверить, входят ли наш
                if (edobjects) {
                    if (code || key)
                    // Определить code нашего объекта
                    return GWTK.MapEditorUtil.iseditingobject(edobjects, code, key);
                }
                else
                    return edlayer;
            }
            else
                return edlayer;
        }
        ,

        /**
         * Существует ли функцию редактора карты
         * @method isfunction
         * @param name {String} Имя функции
         * @returns {Object} Найденная функция
         */
        isfunction: function (mass, name) {
            if (mass) {
                return mass.find(
                    function (element, index, array) {
                        if (element.toLowerCase() == name.toLowerCase())
                            return element;
                    });
            }
        }
        ,

        /**
         * Проверка на пересечение контуров
         * @method isIntersectionSubjectSubjects
         * @param subject - номер подобъекта (c 0)
         * @param ismessage - вывод сообщения
         * @return int -  номер пересекаемого контура или -1
         */
        isIntersectionSubjectSubjects: function (editobject, subjectnumber) {
            var ret = -1;
            if (!editobject) {
                if (!this.editobjects || this.editobjects.length == 0 || subjectnumber < 0)
                    return ret;
                editobject = this.editobjects[0];
            }
            // Проверим на пересечение контуров
            if (editobject.spatialposition.indexOf('polygon') >= 0)
                return editobject.geometry.isIntersectionSubjectSubjects(subjectnumber);
            return -1;
        }
        ,

        /**
         * СОБЫТИЯ РЕДАКТОРА КАРТЫ
         */

        /**
         * Событие старт нового обработчика
         * @method  onSetAction
         * @param event {Object} Событие
         */
        onSetAction: function (event) {
            if (!event || !event.action)
                return;

            // Отключить события редактора
            this.destroyActionEvent();

            // Если стартовал не наш обработчик, то закрыть наши задачи
            if (!this.isOurAction(event.action)) {

                // // Отключить события редактора
                // this.destroyActionEvent();

                // Закрыть текущую задачу
                if (this.currentTask) {
                    this.destroyActiveTask(this.currentTask);
                }

            }
            else {

                // Включить события редактора
                this.initActionEvent();

                GWTK.DomUtil.removeActiveElement(".button-action");
                GWTK.DomUtil.setActiveElement('div[name="' + event.action.name + '"]');
                event.action.task.action = event.action;
                this.currentAction = event.action;

            }
        },

        /**
         * Нажатие кнопки сохранения объекта
         */
        saveClick: function (fn_callbackYes, fn_callbackNo) {

            // Установить текущую задачу по идентификатору объекта
            var currentTask = this.currentTask;
            if (this.editobjects && this.editobjects.length > 0 && this.editobjects[0] && this.editobjects[0].gid) {
                currentTask = this.getTaskByGID(this.editobjects[0].gid);
            }

            // Запрос на наличие кода объекта
            this.controlMapObject(GWTK.Util.bind(function () {
                    this.extend = false;
                    this.isSave = false;
                    this.setCloneForSave();

                    // Воосстановить задачу после сохранения
                    this.currentTask = currentTask;
                    this._isRestore = false;

                    this.isSaveConfirmErrors(this.currentTask);

                    if (fn_callbackYes){
                        fn_callbackYes();
                    }

                }, this),
                GWTK.Util.bind(function () {
                    this.isSave = true;
                    if (fn_callbackNo){
                        fn_callbackNo();
                    }
                }, this));
        },

        /**
         * Отказ от операции
         */
        cancelClick: function () {

            // // Если автономный запуск, отослать триггер и закрыть задачу
            // if (this.autonomous) {
            //     this.closeAutonomous('cancel');
            //     return;
            // }

            // Установить текущую задачу по идентификатору объекта
            var currentTask = this.currentTask;
            if (this.editobjects && this.editobjects.length > 0 && this.editobjects[0] && this.editobjects[0].gid) {
                currentTask = this.getTaskByGID(this.editobjects[0].gid);
            }

            // завершить обработчик
            this.extend = false;
            this.changeCurrentAction();

            // Воосстановить задачу
            this.currentTask = currentTask;
            this._isRestore = false;
            this.restoreTaskTimeout();

        },

        /**
         * Клик на кнопку смены залачи
         */
        modesClick: function (name) {
            if (this.isGroupDeleteProcess)  // диалог группового удаления объектов
                return;

            if (name) {
                var currentTask = this.currentTask,
                    currentTaskReal = this.currentTask;

                // Установить текущую задачу по идентификатору объекта
                if (this.editobjects && this.editobjects.length > 0 && this.editobjects[0] && this.editobjects[0].gid) {
                    currentTaskReal = this.getTaskByGID(this.editobjects[0].gid);
                }
                if (currentTask) {
                    this.destroyActiveTask(currentTask);
                }

                if (currentTaskReal != name) {
                    this.currentTask = name;
                }
                // else {
                // сделать текущей задачу создания
                //     this.currentTask = 'create';
                // }
            }
            // else {
            //     this.currentTask = 'create';
            // }

            // Если это не задача создания, то отключить панель шаблонов
            var templatesEl = GWTK.MapEditorUtil.byId(this.panelsId['editor'] + 'templates');
            if (templatesEl) {
                if (this.currentTask && this.currentTask != 'create') {
                    GWTK.MapEditorUtil.addClass(templatesEl, 'disabledbutton');
                } else {
                    GWTK.MapEditorUtil.removeClass(templatesEl, 'disabledbutton');
                }
            }

            // Если был код, то сбросить выделение кода в классификаторе
            if (this.currentTask != 'create' && this.editNodeLast && this.editNodeLast.node) {
                this.unsetLegendCode(this.editNodeLast.node.id, 'id', this.editNodeLast.node);
            }

            // Восстановить задачу
            this.restoreTask();
         },

        /**
         * Событие закрытие обработчика
         * @method  onCloseAction
         * @param event {Object} Событие
         */
        onCloseAction: function (event) {

            if (!event || !event.action || !event.task)
                return;

            // Удалим всплывающее меню
            $('#' + event.task.popupId).remove();

            // Если это наша задача
            if (this.isOurTask(event.task)) {
                if (event.action) {
                    GWTK.DomUtil.removeActiveElement('div[name="' + event.action + '"]');
                }

                if (this.currentAction && this.currentAction.name == event.action) {
                    // Если есть прослушка выбора объекта
                    if (this.currentAction.fn_callback) {
                        $(this.map.eventPane).off('featurelistclick', this.currentAction.fn_callback);
                    }
                    this.currentAction = null;
                }
            }
        },

        /**
         * Клик на кнопки инструментов ТОЛЬКО для панели СОЗДАНИЯ
         * @param tool
         */
        onClickCreateTools: function (event, name) {

            if (!name) {
                // Найдем атрибут name
                name = $(event.target).attr('name');
            }
            if (!name) {
                return;
            }

            // Сбросим все изменения, еслм это не расширение (создание подобъекта, радактирование участка и тд) и не стандартные инструменты создания
            if (!this.extend && this.currentAction &&
                this.currentAction.name != 'track' && this.currentAction.name != 'file') {
                this.isChange(false);
                this.history.clear();
                this.addmenu(null, GWTK.Util.parseBoolean(this.param.transaction) ? 'transaction' : null);
            }

            switch (name) {
                case 'free_line':
                case 'horizontal_rectangle':
                case 'inclined_rectangle':
                case 'multi_rectangle':
                case 'circle':
                    // Запустить обработчик создания
                    this.changeCurrentAction(new GWTK.MapeditorCreatingActionExt(this, name));
                    this.currentToolName = name;
                    break;

                case 'track':
                    this.changeCurrentAction(new GWTK.MapeditorCreationByGeolocationAction(this, name));
                    break;

                case 'file':
                    break;

            }
        },

        /**
         * Событие на нажатие кнопки геолокации в основной панели карты
         * @param event
         */
        onControlButtonClick: function (event) {

            if (event && event.target) {
                if (GWTK.MapEditorUtil.hasClass(event.target, 'control-button-geolocation')) {

                    // Завершить обработчик, если он был включен
                    this.changeCurrentAction();

                    // Доступность кнопки
                    var button = this.findButton(this.tools, 'create', 'track');
                    if (button) {
                        this.disabledButton(button);
                    }
                }
            }
        },

        /**
         * Инициализация кнопки "Параметры редактора" для сопряжения и топологии
         * @method  onInitOptions
         * @param event {Object} Событие
         */
        onInitOptions: function (event) {

            var prefix = 'edsettig_', transaction = "", servicerecord = "",
                checked = (this.options.transaction && this.options.transaction.servicerecord) ? " checked " : "",
                autosavechecked = (this.options.autosave) ? " checked " : "",
                objectselectionInPoint = (this.options.objectselectionInPoint) ? " checked " : "",
                captureVirtualPoints = (this.options.captureVirtualPoints) ? " checked " : "",
                capturePoints = (this.options.capturePoints) ? " checked " : "",
                layerlistid = prefix + 'maplist_' + this.id,
                divlayerlistid = 'div' + layerlistid,

                autosave = (this.autonomous) ? '' :
                    '<div class="w2ui-field"  style="width:250px;">' +
                    '<label style="width:180px; white-space: normal;text-align:left;margin-top:-3px;">' + w2utils.lang("Automatically save created objects") + ':</label>' +
                    '<div><input id="' + prefix + 'autosave_' + this.id + '" type="checkbox" ' + autosavechecked + ' style="margin-left: 5px; width:50px; float:right;" ' +
                    '></div>' +
                    '</div>';

            var htmlsetting =
                '<div  id="' + prefix + this.id + '" style="padding: 5px" >' +
                '<div  id="' + prefix + 'header_' + this.id + '" style="padding: 5px" >' +
                '</div>' +
                '<div class="w2ui-field"  style="width:250px;">' +
                '<label style="width:auto;">' + w2utils.lang("Limit (meters)") + ':</label>' +
                '<div><input id="' + prefix + 'limit_' + this.id + '"  value = "' + this.options.topology.limit + '" style="margin-left: 5px; width:50px; float:right;" ' +
                '></div>' +
                '</div>' +
                '<div class="w2ui-field"  style="width:250px;">' +
                '<label style="width:auto;">' + w2utils.lang("Capture radius (meters)") + ':</label>' +
                '<div><input id="' + prefix + 'captureradius_' + this.id + '"  value = "' + this.options.topology.captureradius + '" style="margin-left: 5px; width:50px; float:right;" ' +
                '></div>' +
                '</div>' +
                '<div class="w2ui-field"  style="width:250px;">' +
                '<label style="width:180px; white-space: normal;text-align:left;margin-top:-3px;">' + w2utils.lang("Select an object by specifying a point on the map") + ':</label>' +
                '<div><input id="' + prefix + 'objectselectionInPoint_' + this.id + '" type="checkbox" ' + objectselectionInPoint + ' style="margin-left: 5px; width:50px; float:right;" ' +
                '></div>' +
                '</div>' +
                '<div class="w2ui-field"  style="width:250px;">' +
                '<label style="width:180px; white-space: normal;text-align:left;margin-top:-3px;">' + w2utils.lang("Capturing points") + ':</label>' +
                '<div><input id="' + prefix + 'capturePoints_' + this.id + '" type="checkbox" ' + capturePoints + ' style="margin-left: 5px; width:50px; float:right;" ' +
                '></div>' +
                '</div>' +
                '<div class="w2ui-field"  style="width:250px;">' +
                '<label style="width:180px; white-space: normal;text-align:left;margin-top:-3px;">' + w2utils.lang("Capturing lines") + ':</label>' +
                '<div><input id="' + prefix + 'captureVirtualPoints_' + this.id + '" type="checkbox" ' + captureVirtualPoints + ' style="margin-left: 5px; width:50px; float:right;" ' +
                '></div>' +
                '</div>'
                + autosave;

            if (this.param.transaction && this.param.transaction != "") {
                transaction =
                    '<hr  align="center" width="100%" size="1" color="#868b92" style="margin-top:10px;"/>' + // size="2" color="#868b92"
                    '<div class="routeFilesName" style="margin-top:5px;">' +
                    '<table style="width:100%; padding-right: 3px;" >' +
                    '<tr>' +
                    '<td align="left" width="80%">' + w2utils.lang("The transaction log") +
                    '</td>' +
                    '<td align="right" >' +
                    '<div id="' + prefix + 'openLog_' + this.id + '" class="control-button-edit-method control-button-edit sidebar-node-open-button clickable" Title="' + w2utils.lang("Open") +
                    '"></div> ' +  // открыть
                    '</td>' +
                    //'<td align="right" >' +
                    //'<div id="' + prefix + 'saveLog_' + this.id + '" class="control-button-edit-method control-button-edit sidebar-node-save-button clickable" Title="' + w2utils.lang("Save") +
                    //'"></div> ' +  // Загрузить
                    //'</td>' +
                    '</tr>' +
                    '</table>' +
                    '</div>' +
                    '<div id="' + divlayerlistid + '">' +
                    '</div>' +
                    '<div class="w2ui-field"  style="width:250px;">' +
                    '<label style="width:auto;">' + w2utils.lang("Start date") + ':</label>' +
                    '<div><input  id="' + prefix + 'startdate_' + this.id + '" type="eu-date" value = "' + this.options.transaction.startdate.datestring + '" style="margin-left: 5px; width:100px; float:right;" ' +
                    '></div>' +
                    '</div>' +
                    '<div class="w2ui-field"  style="width:250px;">' +
                    '<label style="width:auto;">' + w2utils.lang("End date") + ':</label>' +
                    '<div><input id="' + prefix + 'enddate_' + this.id + '" type="eu-date" value = "' + this.options.transaction.enddate.datestring + '" style="margin-left: 5px; width:100px; float:right;" ' +
                    '></div>' +
                    '</div>' +
                    '<div class="w2ui-field"  style="width:250px;">' +
                    '<label style="width:auto;">' + w2utils.lang("Conclusion service records") + ':</label>' +
                    '<div><input id="' + prefix + 'servicerecord_' + this.id + '" type="checkbox" ' + checked + ' style="margin-left: 5px; width:50px; float:right;" ' +
                    '></div>' +
                    '</div>';
            }

            htmlsetting += transaction + '</div>';

            $(event.target).w2overlay({
                name: this.button_ids.setting,
                html: htmlsetting,
                align: "none",
                onShow: GWTK.Util.bind(function () {
                    // Заголовок
                    $('#' + prefix + 'header_' + this.id)[0].appendChild(GWTK.Util.createHeaderForComponent({
                        map: this.map,
                        callback: GWTK.Util.bind(function () {
                            $('#w2ui-overlay-' + this.button_ids.setting).remove();
                        }, this)
                    }));

                    $('#edsettig_limit_' + this.id).w2field('float', {precision: 3, min: 0});
                    $('#edsettig_captureradius_' + this.id).w2field('float', {precision: 3, min: 0});
                    $('input[type=eu-date]').w2field('date', {format: 'dd.mm.yyyy'});

                    // Назначить события
                    $('#' + prefix + 'limit_' + this.id).on('keyup', GWTK.Util.bind(function (event) {
                        this.options.topology.limit = $(event.target).val();
                    }, this));
                    $('#' + prefix + 'captureradius_' + this.id).on('keyup', GWTK.Util.bind(function (event) {
                        this.options.topology.captureradius = $(event.target).val();
                    }, this));
                    $('#' + prefix + 'openLog_' + this.id).on('click', GWTK.Util.bind(function (event) {
                        this.openLog();
                    }, this));
                    $('#' + prefix + 'saveLog_' + this.id).on('click', GWTK.Util.bind(function (event) {
                        this.saveLogToFile();
                    }, this));
                    $('#' + prefix + 'startdate_' + this.id).on('change', GWTK.Util.bind(function (event) {
                        this.options.transaction.startdate.datestring = $(event.target).val();
                        this.settransactiondate('start');
                    }, this));
                    $('#' + prefix + 'enddate_' + this.id).on('change', GWTK.Util.bind(function (event) {
                        this.options.transaction.enddate.datestring = $(event.target).val();
                        this.settransactiondate('end');
                    }, this));
                    $('#' + prefix + 'servicerecord_' + this.id).on('change', GWTK.Util.bind(function (event) {
                        this.options.transaction.servicerecord = (event.target.checked) ? 1 : 0;
                    }, this));
                    $('#' + prefix + 'autosave_' + this.id).on('change', GWTK.Util.bind(function (event) {
                        this.options.autosave = (event.target.checked) ? 1 : 0;
                    }, this));
                    $('#' + prefix + 'objectselectionInPoint_' + this.id).on('change', GWTK.Util.bind(function (event) {
                        this.options.objectselectionInPoint = (event.target.checked) ? 1 : 0;
                    }, this));
                    $('#' + prefix + 'capturePoints_' + this.id).on('change', GWTK.Util.bind(function (event) {
                        this.options.capturePoints = (event.target.checked) ? 1 : 0;
                    }, this));
                    $('#' + prefix + 'captureVirtualPoints_' + this.id).on('change', GWTK.Util.bind(function (event) {
                        this.options.captureVirtualPoints = (event.target.checked) ? 1 : 0;
                    }, this));

                    var panel = $('#' + divlayerlistid);
                    if (panel && panel.length > 0) {
                        this.initLayerList(panel[0], layerlistid, true, 'left', '175px');

                        // Установить список карт
                        this.setSelectMaps('#' + layerlistid, true,
                            GWTK.Util.bind(function (layer) {
                                if (layer) {
                                    this.options.transaction.maplayerid = layer.xId;
                                }
                                else {
                                    this.options.transaction.maplayerid = null;
                                }
                            }, this),
                            GWTK.Util.bind(function (obj) {
                                if (obj) {
                                    // Только на момент отката. Потом будет текущий слой карты
                                    this.options.transaction.maplayerid = obj.xId;
                                }
                            }, this));
                    }
                }, this),
                onHide: GWTK.Util.bind(function () {
                    this._writeedCookie();
                }, this)
            });
        },

        /**
         * Событие при обновлении объекта на сервере
         * @method  onUpdateMapObject
         * @param event {Object} Событие
         */
         onUpdateMapObject: function (event) {

            var mapobject = event.mapobject, gid;

            if (!event.error) {
                // Если это был графический объект, то обновить его вид в classifier
                if (this.layer && event.regime != 'delete' && mapobject) {
                    this.layer.classifier.updatesemanticsobject(mapobject.code, mapobject.semantic.semantics);
                }
            }
            else {
                w2alert(w2utils.lang("Failed to save the object."));
            }

            // Проверим все ли слои на сохранение обработаны
            var find = this.editobjectsSaveByLayer.find(
                GWTK.Util.bind(function (element, index, array) {
                    if (mapobject && mapobject.maplayerid && element.mli == mapobject.maplayerid && !element.save) {
                        var message = '';
                        switch(event.regime) {
                            case 'delete':
                                message += w2utils.lang("Deleted");
                                break;
                            case 'replace':
                                message += w2utils.lang("Replaced");
                                break;
                            case 'insert':
                                message += w2utils.lang("Inserted");
                                break;
                            case 'create':
                                message += w2utils.lang("Created");
                                break;
                        }
                        gid = (this.layer instanceof GWTK.graphicLayer == false) ? ' (' +  mapobject.gid + ')' : '';
                        if (message) {
                            message += ': ';
                        }
                        if (this.editobjects && this.editobjects.length >= 1) {
                            for(var i = 0; i < this.editobjects.length; i++){
                                if (message && mapobject.maplayerid == this.editobjects[i].maplayerid) {
                                    gid = (this.layer instanceof GWTK.graphicLayer == false) ? ' (' + this.editobjects[i].gid + ')' : '';
                                    if (i > 0) {
                                        message += ', ';
                                    }
                                    message += this.editobjects[i].name + gid;
                                }
                            }
                        }

                        // Запись в журнал операций
                        this.addTransactionWithOutHistory(null, 'save', message);

                        this.editobjectsSaveByLayer[index].save = true;

                        // TODO: Не надо обновлений, поскольку перед любой задачей сбрасываем обшее выдеоение
                        // // Обновим данные в глобальном объекте выделенных объектоа
                        // this.updateselectedFeatures(event.regime, this.editobjectsSaveByLayer[index].mapobjects, this.map.objectManager.selectedFeatures);

                        return element;
                    }
                }, this));

            // Просто выведем сообщение
            if (!find) {
                // Запись в журнал операций
                this.addTransactionWithOutHistory(null, 'save', event.message);
                // console.log(event.message);
            }

            // Пройдемся в поисках несохраненных слоев
            find = this.editobjectsSaveByLayer.find(
                function (element, index, array) {
                    if (!element.save) {
                        return true;
                    }
                });
            if (find) {
                //console.log('Осталось сохранить' + this.editobjectsSaveByLayer.length);
                return;
            }


            // Очистим список объектов для сохранения
            w2utils.unlock($(this.map.mapPane));
            this.editobjectsSave.splice(0, this.editobjectsSave.length);
            if (this.topology) {
                this.topology.isUpdate = true;
            }

            // Запомним слой последней операции на сервере
            if (this.layer && this.layer instanceof GWTK.graphicLayer == false)
                this.options.transaction.maplayerid = this.layer.xId;

            // Перерисовать карту
            this.refreshmap();

            // Восстановить задачу
            this.restoreTaskTimeout();


        },

        /**
         * Событие нажатия клавиши
         * @method  onKeyDown
         * @param event {Object} Событие
         */
        onKeyDown: function (event) {

            // Отсечем поля ввода
            if (document.activeElement && $(document.activeElement)[0].tagName.toLowerCase() == 'input') {
                return;
            }

            // Отработка горячих клавиш
            var which = event.originalEvent.which,
                key = null;
            // console.log(which);
            switch(which) {
                case 86:    // V - вертикальная линия
                    key = 'V';
                    break;
                case 72:    // H - горизонтальная линия
                    key = 'H';
                    break;
                case 82:    // R - прямой угол
                    key = 'R';
                    break;
                // case 70:    // F - Произвольная линия
                //     key = 'F';
                //     break;
                case 76:    // L - замкнуть объект
                    key = 'L';
                    break;
                case 68:    // D - Изменить направление
                    key = 'D';
                    break;
            }
            if (key) {
                this.hotkey = {
                    'key': key,
                    'x': null,
                    'y': null
                };
                if (this.currentAction && this.currentAction.onHotKey) {
                    this.currentAction.onHotKey(this.hotkey, GWTK.bind(function () {
                        this.hotkey = null;
                    }, this));
                }
                return;
            }

            var ctrlKey = event.originalEvent.ctrlKey;

            if (which === 89 && ctrlKey) {      // Ctrl+Z
                this.restorehistory('next');
            }
            else if (which === 90 && ctrlKey) { // ctrl+Y
                this.restorehistory('prev');
            }
            else if (which === 83 && ctrlKey) { // ctrl+S  сохранение
                this.saveClick();
            }
            else if (which === 13 && ctrlKey) {
                this.onCtrlLeft(event);
            }
            else if (which === 8) { // backspace
                if (event.originalEvent.target.id == '')
                    this.restorehistory('prev');
                else
                    return;
            }
            else if (which == 27) {                  // Esc
                this.onCtrlRight(event);
            }
            else {
                return;
            }

            event.originalEvent.preventDefault();
            event.originalEvent.stopPropagation();
            event.preventDefault();
            event.stopPropagation();

        },

        /**
         * Событие нажатия левой клавиши мыши
         * @method  onCtrlLeft
         * @param event {Object} Событие
         */
        onCtrlLeft: function (event) {
            // TODO:
            // Завершить создание контура
            if (this.currentAction && this.currentAction.complete && $.isFunction(this.currentAction.complete)) {
                this.currentAction.complete();
            }
        },

        /**
         * Событие нажатия правой клавиши мыши
         * @method  onCtrlRight
         * @param event {Object} Событие
         */
        onCtrlRight: function (event) {
            this.cancelClick();
        },

        /**
         * Отмена контекстного меню
         * @method  onContextMenu
         * @param event {Object} Событие
         */
        onContextMenu: function (e, div, x, y) {
            if (e.target && e.target.id.indexOf('editor') >= 0) {
                return true;
            }

            e.preventDefault();
            e.stopPropagation();

            // if (this.leftButtonDown) {
            //     this.leftButtonDown = false;
            //     this.cancelClick();
            //     return;
            // }

            // Меню от точки
            if (e.type == 'drawmark_popupmenu') {
                this.contextmenu = {
                    div: div,
                    x: x,
                    y: y
                }
            }
            else {
                if (this.contextmenu) {
                    if (this.currentAction && this.currentAction.popupmenu) {
                        this.currentAction.popupmenu(e, this.contextmenu.div, this.contextmenu.x, this.contextmenu.y);
                        this.contextmenu = null;
                    }
                }
                else {
                    if (this.currentAction && this.currentAction.popupmenu) {
                        this.currentAction.popupmenu(e);
                    }
                    else {
                        this.popupmenu(e);
                    }

                }
            }

            return false;
        },

        /**
         * Отмена контекстного меню на весь документ
         * @method  onContextMenu
         * @param event {Object} Событие
         */
        onContextMenuBody: function (e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        },

        /**
         * Событие изменения видимости слоя
         * @method  onVisibilityChanged
         * @param event {Object} Событие
         */
        onVisibilityChanged: function (event) {
            if (!event || !event.maplayer) return;
            this.layerlistchanged(event.maplayer.id, (event.maplayer.visible) ? 'add' : 'remove', true);
        },

        /**
         * Событие изменения семантических характеристик
         * @method  onChangeDataSemantics
         * @param event {Object} Событие
         */
        onChangeDataSemantics: function (event) {
            if (!event || !event.dataobject || event.dataobject.length == 0)
                return;
            this.isChange(true);
            this.history.addsem(event.dataobject[0].type, event.dataobject);
            this.addmenu();
        },

        /**
         * Событие изменения метрических характеристик
         * @method  onChangeDataMetrics
         * @param event {Object} Событие
         */
        onChangeDataMetrics: function (event) {
            var ip = event.dataobject.point;
            var is = event.dataobject.subject;
            var record = event.dataobject.record;
            var format = event.dataobject.format;
            var point, noupdatemetrics = false;
            switch (format) {
                case 'BL':
                    if (record)
                        point = new GWTK.Point3D(parseFloat(record.B), parseFloat(record.L), parseFloat(record.H));
                    break;
            }
            ;
            switch (event.regime) {
                case 'change':
                    if (!point) return;
                    var point_old = this.editobjects[0].geometry.getpoint(ip + 1, is);
                    this.editobjects[0].geometry.updatepoint(ip + 1, is, point);
                    if (event.geometryclose)
                        this.editobjects[0].geometry.updatepoint(1, is, point);
                    if (!point_old || !point_old.x || !point_old.y) { // Если это была первая точка
                        this.map.setViewport(GWTK.toLatLng(point.x, point.y));
                        this.map.overlayRefresh();
                        this.history.add('insert', ip, is, null, null, point, null, null);
                    }
                    else
                        this.history.add('update', ip, is, null, point_old, point);
                    noupdatemetrics = true;
                    break;

                case 'insert':
                    if (!point) return;
                    this.editobjects[0].geometry.insertpoint3D(point.x, point.y, point.h, ip + 1, is);
                    this.history.add('insert', ip, is, null, null, point, null, null);
                    break;

                case 'remove':
                    this.deletepoint(ip + 1, is);
                    break;

                case 'finish':  // Завершить создание, перейти к редактированию
                    if (this.mapeditorCreatingTask)
                        this.mapeditorCreatingTask.complete();
                    break;

                case 'select':     // Подветить текущую точку
                    if (this.selectPoint.domElement) {
                        $(this.selectPoint.domElement).mouseout();
                    }
                    var el = this.drawobject.getpointElemByNumber(is, ip);
                    if (el) {
                        this.selectPoint.domElement = el;
                        this.selectPoint.id = el.getAttributeNS(null, 'id');
                        $(this.selectPoint.domElement).mouseover();
                    }
                    return;

                case 'enabled':  // сделать доступной кнопку режима удаления подобъектов
                    var el = $('.ededmethod_removesubobject.clickable');
                    if (el && el.length > 0) {
                        if (is > 0)
                            el.removeClass('disabledbuttonConst');
                        else
                            el.addClass('disabledbuttonConst');
                    }
                    return;

                case 'text': // Изменения текста подписи
                    if (this.editobjects[0] && this.editobjects[0].geometry) {
                        this.editobjects[0].geometry.getsubjectgeometry(is).setText(event.dataobject.text);
                        this.editNodeLast.text = this.editNodeLast
                    }
                    break;

            }

            this.isChange(true);

            this.updatedrawcontur(noupdatemetrics);

            if (this.metrics) {
                // this.updatedrawcontur(noupdatemetrics, this.metrics.options.action);
                this.metrics.setgeometry(this.editobjects[0].geometry.saveJSON(true));
            }

        },

        /**
         * Изменение параметров графических объектов
         * @param event
         */
        onChangeGraphicParams: function(event){
            if (event && event.source) {
                if (this.editobjects && this.editobjects.length > 0 &&
                    this.editobjects[0].graphic &&
                    this.editobjects[0].graphic.type == event.source.type) {
                    this.editobjects[0].graphic = event.source.saveJSON();
                    this.isChange(event.ischange || this._ischange);
                    this.addmenu();
                    if (this.currentAction && this.currentAction.draw) {
                        this.currentAction.draw();
                        // Если есть текущий объект, то сменить семантику
                        if (this.editobjects[0].graphic.classifierLayer != this.editobjects[0].layername) {
                            this.editobjects[0].layername = this.editobjects[0].graphic.classifierLayer;
                            this.changeMapObjectCodeSemantics(this.editobjects[0], true);
                        }
                        // Если это режим создания, то изменить последний выбранный код объекта
                        if (this.getTaskByGID(this.editobjects[0].gid) == 'create' && this.editNodeLast.node){
                            this.editNodeLast.node.graphic = event.source.saveJSON();
                        }
                    }
                }
            }
        },

        /**
         * Изменение параметров отрисовки и выделения объектоа карт
         * @param event
         */
        onMarkingColorChanged: function(event){
            if (this.drawobject) {
                this.drawobject.refreshstyle();
                // Отрисовка из action
                if (this.currentAction && this.currentAction.draw) {
                    this.currentAction.draw();
                }

            }
            // Класс выделения объектов для отрисовки, чтоб не нагружать стандартный
            if (this.drawSelectFeatures) {
                this.drawSelectFeatures['stroke'] = this.map.selectedObjects.drawoptionsSelected['stroke'];
                this.drawSelectFeatures['stroke-width'] = this.map.selectedObjects.drawoptionsSelected['stroke-width'];
                this.drawSelectFeatures['fill'] = this.map.selectedObjects.drawoptionsSelected['fill'];
                this.drawSelectFeatures['fill-opacity'] = this.map.selectedObjects.drawoptionsSelected['fill-opacity'];
            }
        },

        /**
         * Событие на перерисовку карты
         * @method  onOverlayRefresh
         * @param event {Object} Событие
         */
        onOverlayRefresh: function (event) {

            if (this.drawobject) {
                this.drawobject.destroy();
            }
            if (this.drawpanel) {
                this.drawpanel.style.left = '0px';
                this.drawpanel.style.top = '0px';
            }

            // Найдем объекты топологии
            this.searchObjectsByAreaFrame(null);

            // Затычка для масштабирования, событие mouseover для svg назначается раньше,
            // чем wms панель стала видимой после стирания временной панели.
            if (this.topology) {
                this.topology.updateSvgEvents();
            }
        },

        /**
         * Изменение размеров панели
         * @param e
         */
        onResizeControlPanel: function(e) {
            this.resize();
        },

        /**
         * Событие на выбор объекта в списке выделенных
         * @method  onFeatureListClickEvent
         * @param ui {Object} Событие
         */
        onFeatureListClickEvent: function (ui) {
            if (!ui.layer || !ui.gid) {
                return;
            }

            var selectobject;
            if (this.map.objectManager.selectedFeatures) {
                selectobject = this.map.objectManager.selectedFeatures.findobjectsById(ui.layer, ui.gid);
            }

            if (this.currentAction && this.currentAction.fn_callback) {
                $(this.map.eventPane).off('featurelistclick', this.currentAction.fn_callback);
            }

            // TODO Потом может быть добавить выбор из списка
            // // Если есть координаты точки, то запросить список объектов в точке
            // if (ui.pointevent) {
            //     // Заполнить список объектов в точке
            //     this.mapeditorTask.setObjectsIntoPoint(ui.pointevent, ui.gid, this.setobject);
            // }

            return selectobject;
        },

        /**
         * Событие на выбор объекта в списке выделенных или пришедших извне  для редактирования
         * @method  onFeatureListClick
         * @param ui {Object} Событие
         */
        onFeatureListClick: function (ui, selectobject) {

            if (ui) {
                selectobject = this.onFeatureListClickEvent(ui);
            }

            if (selectobject){
                // Проверим на возможность обработки объекта
                if (this.iseditinglayer_object(selectobject.gid, selectobject.code, selectobject.key)) {
                    this.setObject(selectobject,
                        GWTK.Util.bind(function () {
                            this.clearSelectedFeaturesMap();

                            // Пройдемся по задачам
                            selectobject = this.editobjects[0];
                            switch (this.currentTask) {
                                case 'edit':
                                    this.changeCurrentAction(new GWTK.MapeditorEditingActionExt(this, 'editing'));
                                    this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Edit object"));
                                    this.addmenu();

                                    // Инициализируем структуру выбранного кода объекта
                                    var graphic = this.graphic || this.editobjects[0].graphic;

                                    this.initEditNodeLast({
                                            id: '',
                                            code: (graphic) ? this.editobjects[0].code : '',
                                            kew: (graphic) ? this.editobjects[0].key : '',
                                            local: GWTK.classifier.prototype.getlocalByName(this.editobjects[0].spatialposition),
                                            text: (graphic) ? w2utils.lang(this.editobjects[0].code) : '',
                                            graphic: (graphic) ? JSON.parse(JSON.stringify(this.editobjects[0].graphic)) : ''
                                        }
                                        , (this.layer) ? this.layer.xId : null);


                                    /**
                                     * TODO: !!!!! ВЕРНУТЬСЯ, КОГДА БУДЕТ АЛГОРИТМ СПЛАЙНА ДЛЯ ПОДПИСИ, а пока сделать недоступными режимы редактирования
                                     */
                                    if (selectobject.geometry && $.isArray(selectobject.geometry.getText())) {
                                        if (this.currentAction && this.currentAction.name == 'editing') {
                                            for (var j = 0; j < this.currentAction.tools['edit'].buttons.length; j++) {
                                                if (this.currentAction.tools['edit'].buttons[j]['name'] != 'moveobject') {
                                                    $(this.currentAction.tools['edit'].buttons[j].selector).addClass('disabledbutton');
                                                }
                                            }
                                        }
                                    }
                                    break;

                                case 'move':
                                    // Начнем перемещение
                                    this.processMoving();
                                    break;

                                case 'delete':
                                    // Начнем удаление
                                    this._isRestore = false;
                                    /**
                                     * TODO : Удалила запрос на удаление одного объекта
                                     */
                                    // w2confirm(this.layer.alias + '. ' + selectobject.name + '<p>' + this.res_mapEditor_confirm_deleteobject + '</p>', w2utils.lang("Map editor"),
                                    //     GWTK.Util.bind(function (answer) {
                                    //         if (answer == 'Yes') {
                                    //             // Сделаем клон объекта для сохранения (в клоне отрисовывается)
                                    //             this.setCloneForSave();
                                    //             this.save(this.currentTask);
                                    //         }
                                    //         else {
                                    //             this.restoreTaskTimeout();
                                    //         }
                                    //     }, this));

                                    this.setCloneForSave();
                                    this.save(this.currentTask);

                                    this.changeCurrentAction();
                                    break;
                            }

                        }, this),
                        GWTK.Util.bind(function () {
                            this.selectObject(GWTK.Util.bind(this.onFeatureListClick, this));

                        }, this))
                } else {
                    w2alert(w2utils.lang("Selected objects can not be edited, because they are not included in the list of editable"), w2utils.lang("Map editor"), GWTK.Util.bind(function (answer) {
                        this.clearSelectedFeaturesMap();
                        this.closeAction();
                        this.restoreTask();
                    }, this));
                }
            }
            else {
                this.selectObject(GWTK.Util.bind(this.onFeatureListClick, this));
            }

            // if (selectobject && this.setObject(selectobject)) {
            //
            //     this.clearSelectedFeaturesMap();
            //
            //     // Пройдемся по задачам
            //     selectobject = this.editobjects[0];
            //     switch (this.currentTask) {
            //         case 'edit':
            //             this.changeCurrentAction(new GWTK.MapeditorEditingActionExt(this, 'editing'));
            //             this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Edit object"));
            //             this.addmenu();
            //
            //             // Инициализируем структуру выбранного кода объекта
            //             this.initEditNodeLast({
            //                     id: '',
            //                     code: (this.graphic) ? this.editobjects[0].code: '',
            //                     kew: (this.graphic) ? this.editobjects[0].key : '',
            //                     local: GWTK.classifier.prototype.getlocalByName(this.editobjects[0].spatialposition),
            //                     text: (this.graphic) ? w2utils.lang(this.editobjects[0].code) : '',
            //                     graphic: (this.graphic && this.editobjects[0].graphic) ?  JSON.parse(JSON.stringify(this.editobjects[0].graphic)) : ''                                }
            //                 , (this.layer) ? this.layer.xId : null);
            //
            //
            //             /**
            //              * TODO: !!!!! ВЕРНУТЬСЯ, КОГДА БУДЕТ АЛГОРИТМ СПЛАЙНА ДЛЯ ПОДПИСИ, а пока сделать недоступными режимы редактирования
            //              */
            //             if (selectobject.geometry && $.isArray(selectobject.geometry.getText())) {
            //                 if (this.currentAction && this.currentAction.name == 'editing') {
            //                     for (var j = 0; j < this.currentAction.tools['edit'].buttons.length; j++) {
            //                         if (this.currentAction.tools['edit'].buttons[j]['name'] != 'moveobject') {
            //                             $(this.currentAction.tools['edit'].buttons[j].selector).addClass('disabledbutton');
            //                         }
            //                     }
            //                 }
            //             }
            //             break;
            //
            //         case 'move':
            //             // Начнем перемещение
            //             this.processMoving();
            //             break;
            //
            //         case 'delete':
            //             // Начнем удаление
            //             this._isRestore = false;
            //             /**
            //              * TODO : Удалила запрос на удаление одного объекта
            //              */
            //             // w2confirm(this.layer.alias + '. ' + selectobject.name + '<p>' + this.res_mapEditor_confirm_deleteobject + '</p>', w2utils.lang("Map editor"),
            //             //     GWTK.Util.bind(function (answer) {
            //             //         if (answer == 'Yes') {
            //             //             // Сделаем клон объекта для сохранения (в клоне отрисовывается)
            //             //             this.setCloneForSave();
            //             //             this.save(this.currentTask);
            //             //         }
            //             //         else {
            //             //             this.restoreTaskTimeout();
            //             //         }
            //             //     }, this));
            //
            //             this.setCloneForSave();
            //             this.save(this.currentTask);
            //
            //             this.changeCurrentAction();
            //             break;
            //     }
            //
            // }
            // else {
            //     this.selectObject(GWTK.Util.bind(this.onFeatureListClick, this));
            // }

        },

        /**
         * ГРУППОВЫЕ ОПЕРАЦИИ
         */

        /**
         * Запрос является ли операция групповой
         * @method isGroup
         */
        isGroup: function (type, fn_callbackYes, fn_callbackNo) {

            // Узнать, есть ли выделенные объекты
            var selectedFeatures = this.map.selectedObjects,
                info = '<br/>', result;

            if (this.currentTask != type) {
                return false;
            }
            if (selectedFeatures && selectedFeatures.mapobjects.length > 0) {
                result = this.setEditObjects(selectedFeatures);
                for (var i = 0; i < result.length; i++) {
                    if (i > 0)
                        info += ', ';
                    info += result[i].sheet + ': ' + result[i].count;
                }

                if (this.editobjects && this.editobjects.length > 0) {
                    var question = '';
                    switch (type) {
                        case 'delete':
                            question = w2utils.lang("You confirm deletion of the selected objects") + info + " ?";
                            break;

                        case 'move':
                            question = w2utils.lang("Do you want to move the selected objects") + info + " ?";
                            break;
                    }

                    /**
                     * TODO: Удаление вопроса для групповых операций.
                     */
                    // // Спросим
                    // w2confirm(question, w2utils.lang("Map editor"), GWTK.Util.bind(function (answer) {
                    //     if (answer == 'Yes') {
                    //         this.clearSelectedFeaturesMap();
                    //
                    //         this.isGroupProcess = true;
                    //         this.addmenu();
                    //         if (fn_callbackYes && $.isFunction(fn_callbackYes)) {
                    //             fn_callbackYes();
                    //         }
                    //     }
                    //     else {
                    //         // Сброс выделения
                    //         this.clearEditObjects();
                    //         this.map.handlers.clearselect_button_click();
                    //         if (fn_callbackNo && $.isFunction(fn_callbackNo)) {
                    //             fn_callbackNo();
                    //         }
                    //     }
                    // }, this));

                    this.clearSelectedFeaturesMap();

                    this.isGroupProcess = true;
                    this.addmenu();
                    if (fn_callbackYes && $.isFunction(fn_callbackYes)) {
                        fn_callbackYes();
                    }

                }
                else {
                    w2alert(w2utils.lang("Selected objects can not be edited, because they are not included in the list of editable"), w2utils.lang("Map editor"), GWTK.Util.bind(function (answer) {
                        this.map.handlers.clearselect_button_click();
                    }, this));
                }

                return true;
            }

            return false;
        },

        /**
         * Выполнение сохранения для групповых операций
         * @method  onGroupSave
         * @param event {Object} Событие
         */
        onGroupSave: function (event) {

            // Сделать недоступной главную панель редактора
            $('.mapEditorDiv').removeClass("disabledbutton");

            if (!event || !event.regime || !event.editobjects)
                return;

            // event.editobjects - это массив this.editobjects
            var editobjects = event.editobjects;

            // Назначим потерянные обработчики
            this.initActionEvent();

            switch (event.regime) {
                case 'delete':
                    this.editobjectsSave.splice(0, this.editobjectsSave.length);
                    for (var i = 0; i < editobjects.length; i++) {
                        // сделаем клон объекта и отправим его на сохранение
                        if (editobjects[i].isSave == true)
                            this.editobjectsSave.push({'editobject': editobjects[i].clone(), 'save': false});
                    }

                    this._isRestore = false;
                    if (this.editobjectsSave.length > 0) {
                        this.save(event.regime);
                    }
                    else {
                        this.restoreTaskTimeout();
                    }
                    break;
            }

        },

        /**
         * ПРОЧИЕ ФУНКЦИИ
         */

        /**
         * Поднять данные из истории изменений
         * @method restorehistory
         * @param direct {String} - 'prev' - предыдущее, 'next' - следующее
         */
        restorehistory: function (direct) {

            if (!direct || (direct != 'prev' && direct != 'next') || !this.editobjects[0])
                return;
            var geometry = this.editobjects[0].geometry;
            if (!geometry) return;

            var history;
            if (direct == 'prev')
                history = this.history.prev();
            else
                history = this.history.next();

            if (!history || !history.type)
                return;

            // восстановить флажок редактирования объекта
            if (this.history.current < 0)
                this.isChange(false);
            else
                this.isChange(true);

            var number = history.number;
            if (history.type != 'offset' && history.type != 'all' && history.type != 'changedirection'
                && (!number && history.date == 'g'))  // и нет точек при геометрии
                return;

            // Триггер на восстановлдение данных из истории
            $(this.map.eventPane).trigger({
                type: 'GWTK.mapeditorTask',
                operation: 'restorehistory',
                params: {phase: 'before', 'history': history, 'direct': direct}
            });

            switch (history.data) {
                case 'g': // метрика
                    switch (history.type) {
                        case 'insert':  // удаляем, если prev, вставляем, если next
                            if (direct == 'prev')
                                geometry.deletepoint(number + 1, history.subject);  // удаляем
                            else
                                geometry.insertpoint3D(history.coord_new.x, history.coord_new.y, history.coord_new.h, number + 1, history.subject);  // вствляем
                            break;
                        case 'delete': // вставляем, если prev, удаляем, если next
                            number -= 1;
                            if (direct == 'prev')
                                geometry.insertpoint3D(history.coord_old.x, history.coord_old.y, history.coord_old.h, number + 1, history.subject);  // вствляем
                            else
                                geometry.deletepoint(number + 1, history.subject);  // удаляем
                            // Замкнуть
                            if (this.editobjects[0].spatialposition.toLowerCase().indexOf("polygon") >= 0)
                                geometry.closeobject(true, history.subject);

                            break;
                        case 'update':
                            var point;
                            if (direct == 'prev') {
                                point = new GWTK.Point3D(history.coord_old.x, history.coord_old.y, history.coord_old.h);
                                geometry.updatepoint(number + 1, history.subject, point);

                                // восстановим объекты топологии
                                if (history.topologyobjectJSON_old)
                                    this.topology.restoreFromHistory(history.topologyobjectJSON_old);
                            }
                            else {
                                point = new GWTK.Point3D(history.coord_new.x, history.coord_new.y, history.coord_new.h);
                                geometry.updatepoint(number + 1, history.subject, point);
                                // восстановим объекты топологии
                                if (history.topologyobjectJSON_new)
                                    this.topology.restoreFromHistory(history.topologyobjectJSON_new);
                            }

                            if (this.editobjects[0].spatialposition.toLowerCase().indexOf("polygon") >= 0)
                                geometry.closeobject(true, history.subject);
                            break;

                        case 'offset':
                            var dx = history.offset.x;
                            var dy = history.offset.y;
                            if (direct == 'prev') { // смещение с минусом
                                dx = -dx;
                                dy = -dy;
                            }
                            this.offsetpoints(dx, dy);

                            // Если задача перемещения
                            if (this.currentTask == 'move' && this.currentAction && this.currentAction.name == 'moving') {
                                this.action.clear();
                                this.action.set();
                            }
                            break;

                        case 'all':
                            if (direct == 'prev')
                                this.editobjects[0].geometry = history.points_old.createcopy();
                            else
                                this.editobjects[0].geometry = history.points_new.createcopy();
                            geometry = this.editobjects[0].geometry;
                            break;

                        case 'changedirection':
                            geometry.changedirection(history.subject);
                            break;

                        default:
                            break;
                    }

                    this.updatedrawcontur();
                    break;

                case 's': // семаника
                    if (!this.rscsemantics || !history.semantics || history.semantics.length == 0)
                        return;

                    var semantics = new Array();
                    if (direct == 'prev') {
                        for (var i = 0; i < history.semantics.length; i++)
                            semantics.push({
                                id: history.semantics[i].id,
                                oldvalue: history.semantics[i].newvalue,
                                newvalue: history.semantics[i].oldvalue,
                                code: history.semantics[i].code,
                                changeview: history.semantics[i].changeview
                            });
                    }
                    else {
                        for (var i = 0; i < history.semantics.length; i++)
                            semantics.push({
                                id: history.semantics[i].id,
                                oldvalue: history.semantics[i].oldvalue,
                                newvalue: history.semantics[i].newvalue,
                                code: history.semantics[i].code,
                                changeview: history.semantics[i].changeview
                            });
                    }
                    this.rscsemantics.setvalue(semantics);
                    break;

                case 't': // тип
                    switch (history.type) {
                        case 'update':
                            var node = null;
                            if (direct == 'prev') {
                                node = history.node_old;
                            }
                            else {
                                node = history.node_new;
                            }
                            if (node) {
                                this.changeMapObjectCode(node);
                                this.setLegendCode(node.id, 'id');
                            }
                            break;
                    }
                    break;

                case 'mapobject': // тип
                    switch (history.type) {
                        case 'update':
                            var mapobject = null, node = null;
                            if (direct == 'prev') {
                                mapobject = history.mapobject_old;
                                if (history.node_old) {
                                    node = history.node_old;
                                }
                            }
                            else {
                                mapobject = history.mapobject_new;
                                if (history.node_new) {
                                    node = history.node_new;
                                }
                            }
                            if (node) {
                                this.changeMapObjectCode(node);
                                this.initEditNodeLast(node, this.layer.xId);
                                this.setLegendCode(node.id, 'id');
                                if (mapobject) {
                                    this.editobjects[0].semantic = mapobject.semantic.createcopy();
                                    this.editobjects[0].geometry = mapobject.geometry.createcopy();
                                }
                                // Далее отрисовать, выполнить  действия по умолчанию
                                this.setMandatoryCompleteAction(this.currentAction, this.editobjects[0]);
                            }
                            break;
                    }
                    break;

                case 'mapobjects': // тип
                    switch (history.type) {
                        case 'update':
                            var len;
                            this.historyEditObjects = history.historyEditObjects;
                            if (this.historyEditObjects && (len = this.historyEditObjects.length) > 0) {
                                for (var i = 0; i < len; i++) {
                                    var mapobject = null, node = null;
                                    if (direct == 'prev') {
                                        mapobject = this.historyEditObjects[i].mapobject_old;
                                        if (this.historyEditObjects[i].node_old) {
                                            node = this.historyEditObjects[i].node_old;
                                        }
                                    }
                                    else {
                                        mapobject = this.historyEditObjects[i].mapobject_new;
                                        if (this.historyEditObjects[i].node_new) {
                                            node = this.historyEditObjects[i].node_new;
                                        }
                                    }
                                    if (node) {
                                        this.changeMapObjectCode_ForOneMapObject(this.editobjects[i], node);
                                        if (i == 0) { // Взять только от первого объекта
                                            this.initEditNodeLast(node, this.layer.xId);
                                        }
                                        this.setLegendCode(node.id, 'id');
                                        if (mapobject) {
                                            this.editobjects[i].semantic = mapobject.semantic.createcopy();
                                            this.editobjects[i].geometry = mapobject.geometry.createcopy();
                                        }
                                    }
                                }
                                // Далее отрисовать, выполнить  действия по умолчанию
                                this.setMandatoryCompleteAction(this.currentAction, this.editobjects[0]);
                            }
                            break;
                    }
                    break;
            }

            $(this.map.eventPane).trigger({
                type: 'GWTK.mapeditorTask',
                operation: 'restorehistory',
                params: {phase: 'after', 'history': history, 'direct': direct}
            });

        }
        ,

        /**
         * Поиск объектов и отображение объектов класса топологии
         * @method searchObjectsByAreaFrame
         * @param excludeObjects {Array String} Массив идентификаторов объектов карты, которые нужно исключить
         * @param subaction {String} Активный режим редактора карты
         * @param noshow (Bool) - не отрисовывать объекты при наведении мыши
         */
        searchObjectsByAreaFrame: function (excludeObjects, subaction, nomouseover) {
            if (!subaction) {
                if (this.map && this.map.taskManager && this.map.taskManager._action) {
                    subaction = this.map.taskManager._action.name;
                    if (subaction == 'editing') {
                        subaction = 'edit';
                    }
                    else {
                        subaction = 'create';
                    }
                }
            }
            if (this.topology) {
                if (!excludeObjects) {
                    excludeObjects = [];
                    if (this.editobjects[0])
                        excludeObjects.push(this.editobjects[0].gid);
                }

                if (!subaction || subaction == 'groupOperations' || subaction == 'track') // Если групповые операции
                    this.topology.searchObjectsByAreaFrame(null, null, subaction, [], nomouseover);
                else
                    this.topology.searchObjectsByAreaFrame(null, excludeObjects, subaction, this.selectlayersid, nomouseover);

            }

        }
        ,

        /**
         * Информация в статус бар
         * @method message
         */
        setStatusBar: function (message) {
            if (this.map && this.map.statusbar) {
                this.map.statusbar.set(message + '...');
            }
        },

        /**
         * Информация в статус бар
         * @method message
         */
        clearStatusBar: function () {
            if (this.map && this.map.statusbar) {
                this.map.statusbar.clear();
            }
        },

        /**
         * Установка фажка редактирования
         * @param change
         */
        isChange: function (change) {
            if (!change) {
                change = false;
            }
            this._ischange = change;
        },

        /**
         * Инициализация компонента списка слоев (режим редактирования)
         * @method initObjectsInPoint
         */
        initObjectsInPoint: function (gid, objectlistId, fn_change) {

            var selectedFeaturesObjects = this.drawSelectFeatures.mapobjects;
            if (!gid && !objectlistId && selectedFeaturesObjects.length == 0)
                return;

            $('#' + this.objectlistId).children().remove();
            if (selectedFeaturesObjects && selectedFeaturesObjects.length > 1) {
                var _that = this;
                var paneinfo = this.map.createPane('edContainerInfo', $('#' + objectlistId)[0]);
                var strpanel =
                    '<tr>' +
                    '<td>' +
                    '<div class="w2ui-field w2ui-span3">' +
                    '<label style = "margin-top:-1px; white-space:pre-wrap; text-align:center !important;">' + w2utils.lang("Objects in the point") + ':</label>' +
                    '<div> ' +
                    '<input type="list" id="list_' + objectlistId + '" style="width: 100% !important;">' +
                    '</div>' +
                    '</div>' +
                    '</td>' +
                    '</tr>';
                $(paneinfo).append('<table width="100%" cellspacing=0 cellpadding=0>' + strpanel + '</table>');
                $(paneinfo).css('width', '100%');

                // Установить список объектов
                var _that = this,
                    ellistid = $('#list_' + objectlistId),
                    mapobjects = [], index = 0;
                for (var i = 0; i < selectedFeaturesObjects.length; i++) {
                    mapobjects.push({'text': selectedFeaturesObjects[i].name, 'id': selectedFeaturesObjects[i].gid});
                    if (mapobjects[i].id == gid)
                        index = i;
                }
                ellistid.off();
                ellistid.w2field('list',
                    {
                        items: mapobjects, selected: mapobjects[index], focus: -1
                    });
                ellistid.change(function (event) {
                    var obj = ellistid.data('selected');
                    if (obj) {
                        var find = selectedFeaturesObjects.find(
                            function (element, index, array) {
                                if (element.gid == obj.id) {
                                    return element;
                                }
                            });
                        if (find && fn_change) {
                            // Если объект с другого слоя, то переназначим слой
                            if (find.maplayerid != _that.maplayerid.layerid) {
                                // Назначим нужный слой
                                _that.maplayerid.layerid = find.maplayerid;
                                // Установить тип редактируемого слоя
                                _that.layer = _that.map.tiles.getLayerByxId(_that.maplayerid.layerid);
                                _that.setlayertype(_that.layer);
                            }
                            fn_change(find);
                        }
                        $('#' + _that.objectlistId).blur();
                    }
                });
                $('#' + this.objectlistId).blur();
            }

        }
        ,

        /**
         * Заполнить список объектов в точке
         * @method setObjectsIntoPoint
         */
        setObjectsIntoPoint: function (pointevent, gid, fn_callback) {
            if (!this.map || !this.map.taskManager) {
                return;
            }
            this.map.taskManager._serviceAction = new GWTK.MapAction(this, 'selectobjectsinpoint');
            this.map.taskManager._serviceAction.showInfoOfSelectedObjects = false;
            var point = GWTK.DomEvent.getMousePosition(pointevent, this.map.panes.eventPane);
            var gfi = this.map.objectManager.featureRequest;
            if (!gfi) {
                w2alert('Error of Map.getFeatureInfo. ' + 'Выбор объектов невозможен !');
                console.log('Error of Map.getFeatureInfo. ' + 'Выбор объектов невозможен !');
            }
            else {
                var _that = this;
                gfi.getFeatureInfo(point, null, function () {     // запросить данные объектов в точке
                    _that.map.taskManager._serviceAction = null;
                    var selectedFeatures = _that.map.selectedObjects;
                    selectedFeatures.editor = true;
                    for (var i = 0; i < selectedFeatures.mapobjects.length; i++) {
                        // Проверка на возможность редактирования объекта
                        if (!_that.iseditinglayer_object(selectedFeatures.mapobjects[i].gid, selectedFeatures.mapobjects[i].code, selectedFeatures.mapobjects[i].key))
                            continue;
                        if (!_that.drawSelectFeatures.findobjectsByGid(selectedFeatures.mapobjects[i].gid))
                            _that.drawSelectFeatures.add(selectedFeatures.mapobjects[i]);
                    }
                    // Сбросим класс выделения объектов
                    _that.initObjectsInPoint(gid, _that.objectlistId, fn_callback);
                });
            }
        }
        ,


        /**
         * Установка нужного макета в панели макетов
         * @param layer
         * @param legend
         * @param visible
         */
        setTemplate: function (layer, legend, visible) {
            if (this.mapeditTemplates) {
                this.mapeditTemplates.setTemplate(layer, legend, visible, this.panel);
            }
        }
        ,

        /**
         * Установка записи в макете
         * @param node
         */
        setTemplateRecord: function (node) {
            if (this.mapeditTemplates) {
                this.mapeditTemplates.setTemplateRecord(node);
            }
        }
        ,

        /**
         * Активация/деактивация кнопки в шаблоне
         * @param key
         * @param active
         */
        activeTemplateRecord: function (key, active) {
            if (this.mapeditTemplates) {
                this.mapeditTemplates.activeTemplateRecord(key, active);
            }
        }
        ,

        /** Синхронизировать шаблон и легенду в части графических изображений
         *
         * @constructor
        */
        synchronizationTemlateAndLegendDraw: function(){
            if (this.mapeditTemplates && this.legend) {
                var templateCurr = this.mapeditTemplates.templateCurr,
                    record, graphicObject;
                if (templateCurr) {
                    for(var i = 0; i < templateCurr.records.length; i++)  {
                        record = templateCurr.records[i];
                        if (record.graphic) {
                            if (this.legend.graphicLegend) {
                                graphicObject = this.legend.graphicLegend.createGraphicObjectFromJSON(record.graphic);
                                if (graphicObject) {
                                    this.legend.graphicLegend.initPanelDraw(graphicObject);
                                }
                            }
                        }
                    }
                }
            }
        },

        /**
         * Назначить слои для выделения
         * @param nographic - не учитывать графические слои
         * @returns {*}
         */
        setselectlayers: function (nographic) {
            var layer, selectlayersid = [];
            var tool = this.map.mapTool('mapeditor'), task;
            if (!tool || !(task = tool.mapeditorTask)) {
                return this.selectlayersid;
            }
            if (task.setlayers()) {
                for (var i = 0; i < task.maplayersid.length; i++) {
                    if (nographic) {
                        layer = this.map.tiles.getLayerByxId(task.maplayersid[i].layerid);
                        if (layer && layer instanceof GWTK.graphicLayer)
                            continue;
                    }
                    selectlayersid.push(task.maplayersid[i].layerid);
                }
            }
            return selectlayersid;
        },

        /**
         * Выбор объекта
         * @method selectObject
         * @param fn_callback {Function} - функция обратного вызова при выборе объекта
         * @param actionname {String} - расширение для название обработчика
         * @param message {String} - сообщение в статус баре
         * @param params {} - специфический набор параметров = {
         *     selectMapObjectActionHover:{},
         *     selectMapObjectAction:{}
         * }
         */
        selectObject: function (fn_callback, actionname, message, params) {

            var params = params || {
                selectMapObjectActionHover: {
                    fn_setselectlayers: this.setselectlayers,
                    message: message || ''
                },
                selectMapObjectAction: {
                    fn_setselectlayers: this.setselectlayers,
                    fn_isCorrectObject: GWTK.Util.bind(this.iseditinglayer_object, this),
                    sequence: true,
                    message: message || '',
                    show: false
                }
            };

            if (!this.options.objectselectionInPoint) {
                this.changeCurrentAction(new GWTK.SelectMapObjectActionHover(this,
                    params.selectMapObjectActionHover
                ));
            }
            else {
                this.changeCurrentAction(new GWTK.SelectMapObjectAction(this, this.map,
                    params.selectMapObjectAction
                ))
            }

            if (this.currentAction && !this.currentAction.error) {
                this.currentAction.fn_callback = fn_callback;
                $(this.map.eventPane).one('featurelistclick', this.currentAction.fn_callback);
                if (actionname) {
                    this.currentAction.name += actionname;
                }
            }

        }
        ,

        /**
         *  Сброс выделения в карте
         */
        clearSelectedFeaturesMap: function () {
            // Если задача запущена автономно, то не сбрасывать выделенные объекты
            if (this.autonomous) {
                this.map.objectManager.selectedFeatures.clearDrawAll();
            }
            else {
                this.map.handlers.objectsPane_close_click();
            }
        },

        /**
         * Установить название объекта в информационной строке
         * @param name
         */
        setObjectName: function(name){
            // var error = false;
            if (!name) {
                name = w2utils.lang("Layer object not set") + '...';
                // error = true;
            }

            var el = GWTK.MapEditorUtil.byId(this.panelsId['editor'] + 'objectlayername');
            if (el) {
                // if (!error) {
                //     GWTK.MapEditorUtil.removeClass(el, "errortext");
                //     GWTK.MapEditorUtil.addClass(el, "coloractive");
                // }
                // else {
                //     GWTK.MapEditorUtil.removeClass(el, "coloractive");
                //     GWTK.MapEditorUtil.addClass(el, "errortext");
                // }
                GWTK.MapEditorUtil.innerHTML(el, name);
            }
        },

         /**
         * TODO! Подумать над параметрами функции, некрасиво
         * Запмсь в журнвл операций параллельно с классом History
         * @param history_type - тип из объекиа GWTK.EditorHistory
         * @param type - тип операций в редакторе карты (при наличии history_type используется для его детализации)
         * @param message - текст произвольного сообщения
         * @param editorTransactionLog - объект класса GWTK.EditorTransactionLog
         */
        addTransactionWithOutHistory: function(history_type, type, message, editorTransactionLog) {
            if (!this.transactionsLog)
                return;

            var name = '';
            switch(type.toLowerCase()) {
                case 'deletesegment':
                    name = w2utils.lang("Removal part of geometry");
                    break;
                case 'offsetsegment':
                    name = w2utils.lang("Offset part of geometry");
                    break;
                case 'updatesegment':
                    name = w2utils.lang("Updating part of geometry");
                    break;
                case 'save':
                    name = w2utils.lang("Saving changes");
                    break;
                case 'undolastaction':
                    name = w2utils.lang("Undo recent changes");
                    break;
                case 'redolastaction':
                    name = w2utils.lang("Redo recent changes");
                    break;
                case 'changeobjecttype': // Смена типа объекта
                    break;
                case 'changeregime': // Смена режима редактора
                    break;
                case 'changelayer':  // Смена слоя карты
                    name = w2utils.lang("Changing map layer");
                    break;
            }
            if (history_type) {
                var mapobject = {
                        "name": "",         // наименование объекта
                        "gid": ""
                    };

                if (this.editobjects && this.editobjects.length > 0) {
                    mapobject.name = this.editobjects[0].name;
                    mapobject.gid = this.editobjects[0].gid;
                }
                this.transactionsLog.add(new GWTK.EditorTransactionLog({
                    "mapalias": this.layer.alias,         // алиас карты
                    "regime": this.getShortTaskName(this.currentTask),           // режим редактора (Создание, редактирование, удаление, перемещение ...)
                    "mapobject": mapobject,
                    "name": name,             // название транзакции
                    "result": ""              // результат
                }));
            }
            else {
                if (editorTransactionLog) {
                   this.transactionsLog.add(editorTransactionLog);
                }
                else {
                    this.transactionsLog.add(new GWTK.EditorTransactionLog({
                        "name": name,                                // название транзакции
                        "result": (message) ? message : ""           // результат
                    }));
                }
            }
        },

        /**
         * КОНТЕКСТНОЕ МЕНЮ
         */

        /**
         * Запросить пункт для всплавающего меню
         * @param operation: - идентификатор пункта меню (операция)
         *        deletepoint - удалить точку
         *        changedirection - сменить направление
         *        horizont - горизонтальная линия
         *        vertical - вертикальная линия
         *        rightangle - прямой угол
         *        cutobject - рассечение в точке
         *        createsubobject - создание подобъекта
         *        removesubobject - удаление подобъекта
         *        save - сохранить
         *        cancel - отменить
         */
        getItemPopup: function (operation) {

            var res = '';
            switch(operation){
                case 'deletepoint':
                    res =
                        '<tr>' +
                            '<td width="16px" class="ededmethod_delpoint" style="background-repeat:no-repeat;"/>  ' +
                            '<td id="' + this.popupId + '_deletepoint" style="padding-left:5px;">' + w2utils.lang("Remove point") + '</td>' +
                        '</tr>';
                    break;
                case 'changedirection':
                    res =
                        '<tr>' +
                            '<td width="16px" class="ededmethod_changedir" style="background-repeat:no-repeat;"/>' +
                            '<td id="' + this.popupId + '_changedirection" style="padding-left:5px;">' + w2utils.lang("Change direction") + ' (D)' + '</td>' +
                        '</tr>';
                    break;
                case  'horizont':
                    res =
                        '<tr>' +
                        '<td width="16px" class="ededmethod_horizont" style="background-repeat:no-repeat;"/> ' +
                        '<td id="' + this.popupId + '_horizont" style="padding-left:5px;">' + w2utils.lang("Horizontal line") + ' (H)' + '</td>' +
                        '</tr>';
                    break;
                case 'vertical':
                    res =
                        '<tr>' +
                            '<td width="16px" class="ededmethod_vertical" style="background-repeat:no-repeat;"/> ' +
                            '<td id="' + this.popupId + '_vertical" style="padding-left:5px;">' + w2utils.lang("Vertical line") + ' (V)' + '</td>' +
                        '</tr>';
                    break;
                case 'rightangle':
                    res =
                        '<tr>' +
                            '<td width="16px" class="ededmethod_rightangle" style="background-repeat:no-repeat;"/> ' +
                            '<td id="' + this.popupId + '_rightangle" style="padding-left:5px;">' + w2utils.lang("Right angle") + ' (R)' + '</td>' +
                        '</tr>';
                    break;
                case 'finish':
                    res =
                        '<tr>' +
                            '<td width="16px" class="ededmethod_finish" style="background-repeat:no-repeat;"/>  ' +
                            '<td id="' + this.popupId + '_finish" style="padding-left:5px;">' + w2utils.lang("Complete operation") + ' (Ctrl+Enter)</td>' +
                        '</tr>';
                    break;
                case 'closeobject':
                    res =
                        '<tr>' +
                            '<td width="16px" class="ededmethod_closeobject" style="background-repeat:no-repeat;"/> ' +
                            '<td id="' + this.popupId + '_closeobject" style="padding-left:5px;">' + w2utils.lang("Close object") + ' (L)' + '</td>' +
                        '</tr>';
                    break;
                case 'save':
                    res =
                        '<tr>' +
                            '<td width="16px" class="ededmethod_save" style="background-repeat:no-repeat;"/>' +
                            '<td id="' + this.popupId + '_save" style="padding-left:5px;">' + w2utils.lang("Save") + ' (Ctrl+S)' + '</td>' +
                        '</tr>';
                    break;

                case 'createsubobject':
                    res =
                        '<tr>' +
                            '<td width="16px" class="ededmethod_createsubobject" style="background-repeat:no-repeat;"/> ' +
                            '<td id="' + this.popupId + '_createsubobject" style="padding-left:5px;">' + w2utils.lang("Add contour") + '</td>' +
                        '</tr>';
                    break;

                case 'removesubobject':
                    res =
                        '<tr>' +
                            '<td width="16px" class="ededmethod_removesubobject" style="background-repeat:no-repeat;"/> ' +
                            '<td id="' + this.popupId + '_removesubobject" style="padding-left:5px;">' + w2utils.lang("Remove contour") + '</td>' +
                        '</tr>';
                    break;

                case 'cutobject':
                    res =
                        '<tr>' +
                            '<td width="16px" class="ededmethod_cutobject" style="background-repeat:no-repeat;"/>  ' +
                            '<td id="' + this.popupId + '_cutobject" style="padding-left:5px;">' + w2utils.lang("Cut") + '</td>' +
                        '</tr>';
                    break;

                case 'cancel':
                    res =
                        '<tr>' +
                            '<td width="16px" class="ededmethod_cancel" style="background-repeat:no-repeat;"/>  ' +
                            '<td id="' + this.popupId + '_cancel" style="padding-left:5px;">' + w2utils.lang("Cancel") + ' (Esc)' + '</td>' +
                        '</tr>';
                    break;
            }
            return res;
        },


        /**
         * Контекстное меню для точки объекта
         * @method popupmenu
         * @param div {Element} - Родительский элемент
         * @param x {Int} - Координата экрана x
         * @param y {Int} - Координата экрана y
         */
        popupmenu: function (e) {//, div, x, y) {
            e.preventDefault();
            e.stopPropagation();

            // удалить меню и функцию
            $('#' + this.popupId).remove();

            var
                rectdraw = (this.drawpanel) ? this.drawpanel.getBoundingClientRect() : 0,
                left = (e.clientX - rectdraw.left).toString() + 'px',
                top  = (e.clientY - rectdraw.top).toString() + 'px',
                styleDiv = ' style="left:' + left + ';top:' + top + '; cursor: pointer;opacity: 0.9"',
                class_menu = 'menucontext',
                save = (this._ischange) ? this.getItemPopup('save') : '',
                cancel = this.getItemPopup('cancel'),

                text =
                    '<div id="' + this.popupId + '" class=" map-panel-def editTable" ' + styleDiv + ' >' +
                    '<div align="left" class="' + class_menu + '" style="margin-left:5px; margin-top:5px;"></div>' +
                    '<div>' +
                    '<table cellspacing="2px;" cellpadding="2px" style="width:140px;">' +
                    save +
                    cancel +
                    '</table>' +
                    '</div></div>';

            $(this.drawpanel).append(text);

            var $popup = $('#' + this.popupId),
                $menupoint = $('.' + class_menu),
                _that = this;
            if ($menupoint.length > 0) {
                $menupoint[0].appendChild(GWTK.Util.createHeaderForComponent({
                    map: this.map,
                    callback: GWTK.Util.bind(function () {
                        $popup.remove();
                        _that.topology.map_events('on');
                        return false;
                    }, this)
                }));

                var $popupclose = $menupoint.find('.panel-info-close');

                // Сохранение
                $('#' + this.popupId + '_save').click(function (event) {
                    $popupclose.click();
                    _that.saveClick()
                    return false;
                });
                // Отмена
                $('#' + this.popupId + '_cancel').click(function (event) {
                    $popupclose.click();
                    _that.isChange(false);
                    _that.cancelClick();
                    return false;
                });
            }

            // Отключить события карты
            this.topology.map_events('off');

        },

        /**
         *  Назначить подпись объекту
         */
        setTitle: function(node, fn_callback){
            if (!node || !node.local || node.local != GWTK.classifier.prototype.getlocalByName('title')) {
                if (fn_callback) {
                    fn_callback(false);
                }
                return;
            }

            if (this.editobjects[0] && this.editobjects[0].geometry) {
                var _that = this,
                    id = this.panelsId['editor'] + 'popup_title';

                this.lock(true);

                setTimeout(function(){
                    // var popup_prev = $('#w2ui-popup'),
                    //     time = 100;
                    // if (popup_prev.length > 0) {
                    //     console.log(w2popup.textValue);
                    //     if (!w2popup.textValue) {
                    //         w2popup.close();
                    //     }
                    //     // time = 2000;
                    // }
                    var time = $('#w2ui-popup').length > 0 ? 2000 : 100;
                    setTimeout(function() {
                        // Проверка на случай закрытия режима (падает в linux, при смене или закрытии режима)
                        if (_that.editobjects[0] && _that.editobjects[0].geometry) {
                            w2popup.open({
                                title: w2utils.lang('Text input'),
                                body:
                                    '<div style="width: 100%; height: 100%;">' +
                                    '<div class="" style="padding: 13px; width: 100%;">' +
                                    '<input type="text" id="' + id + '" style="width:100% !important;">' +
                                    '</div>' +
                                    '</div>',
                                buttons:
                                    '<button class="btn" name="close" onclick="w2popup.close();">' + w2utils.lang('Cancel') + '</button>' +
                                    '<button class="btn" name="save" onclick="w2popup.save=true; w2popup.close();">' + w2utils.lang('Save') + '</button>',
                                width: 600,
                                height: 140,
                                overflow: 'hidden',
                                color: '#333',
                                speed: '0.3',
                                opacity: '0.8',
                                modal: true,
                                showClose: true,
                                onOpen: function (event) {
                                    event.onComplete = function () {
                                        this.textValue = _that.editobjects[0].geometry.getText() || node.title;
                                        this.save = false;
                                        this.inputtext = $('#' + id);
                                        this.buttonsave = $('button[name=save]');
                                        this.inputtext.w2field('text');
                                        this.inputtext.on('input', GWTK.Util.bind(function (event) {
                                            var val = $(this.inputtext).val();
                                            if (val && val != this.textValue) {
                                                this.buttonsave.removeClass('disabledbutton');
                                            } else {
                                                this.buttonsave.addClass('disabledbutton');
                                            }
                                        }, this));

                                        this.inputtext.val(this.textValue);
                                        // Не обрабатывам пока подпись типа spline
                                        if ($.isArray(this.textValue)) {
                                            this.inputtext.addClass('disabledbutton');
                                        }
                                    };
                                },
                                onClose: function (event) {
                                    var ret = this.save;
                                    if (ret) {
                                        var text = this.inputtext.val();
                                        _that.editobjects[0].geometry.setText(text);
                                        GWTK.mapeditorTaskExtended.prototype.triggerGeometry({
                                            "map": _that.map,
                                            "layer": _that.layer,
                                            "text": text
                                        });
                                      }

                                    delete this.textValue;
                                    delete this.save;
                                    delete this.inputtext;
                                    delete this.buttonsave;
                                    delete this.inputtext;

                                    _that.lock();

                                    if (fn_callback) {
                                        fn_callback(ret);
                                    }
                                }

                            });
                        }
                    }, time);
                    }, 300);
             }
        },

        /**
         * Блокировать / разблокировать окно карты и редактора
         * @param lock
         */
        lock:function(lock){
            if (lock) {
                $('#' + this.panelsId['main']).addClass('disabledbutton');
                // // $(this.map.mapPane).addClass('disabledbutton');
                // $('#' + this.map.divID).addClass('disabledbutton');
            }
            else {
                $('#' + this.panelsId['main']).removeClass('disabledbutton');
                // // $(this.map.mapPane).addClass('disabledbutton');
                // $('#' + this.map.divID).removeClass('disabledbutton');
            }
        },

        /**
         * Tриггер на помещение подписи в геометрию
         * @param data = {
         *   map:  объект Map
         *   layer: - обхет Layer
         *   text: - текст
         *   subject: - номер подобъекта
         * }
         */
        triggerGeometry: function(data){
            if (data.map && data.text) {
                $(data.map.eventPane).trigger({
                    type: 'changedata_metrics',
                    regime: 'text',
                    maplayer: data.layer,
                    dataobject: {
                        text: data.text,
                        subject: (data.subject) ? data.subject : 0
                    }
                });
           }
        },

        /**
         * РАБОТА С АВТОНОМНЫМ РЕДАКТОРОМ
         */
        // /**
        //  * Автономное самостоятельное закрытие задачи (без использования кнопок и меню)
        //  */
        // closeTaskAutonomous: function () {
        //     var toolname = 'mapeditor';
        //     $(this.map.eventPane).trigger({type: 'closecomponent', context: toolname});
        //     // Найдем задачу "mapeditor"
        //     var tool = this.map.mapTool(toolname);
        //     if (tool) {
        //         if (tool.closeTask(this)) {
        //             tool.mapeditorTask = null;
        //         }
        //         ;
        //     }
        // },
        /**
         * Закрытие редактора в автономном режиме
         * @param action
         * @param mapobjects
         */
        closeAutonomous: function (action, mapobjects) {
            $('#' + this.button_ids.save).hide();
            this.map.mapeditor.closeAutonomous(action, mapobjects);
        }

    };


    /************************************* Соколова  ***** 13/09/17 ****
     *                                                                  *
     *              Copyright (c) PANORAMA Group 1991-2016              *
     *                       All Rights Reserved                        *
     *                                                                  *
     ********************************************************************
     *                                                                  *
     *   Класс перебора или выбора объектов для                         *
     *                               выполнения групповых операций      *
     *                                                                  *
     *******************************************************************/


    GWTK.QueryGroupMapObjectsControlExt = function (map, parent, regime, editobjects, fn_close) {
        this.error = true;
        if (!map || !parent || !regime || !editobjects || editobjects.length == 0 || !map.mapeditor || !map.mapeditor.mapeditorTask)
            return;
        this.map = map;
        this.parent = parent;
        this.paneId = 'groupPane_' + this.map.mapeditor.panelId;

        // слой выделения
        this.selectedFeatures = this.map.mapeditor.mapeditorTask.drawSelectFeatures;

        this.init(regime, editobjects);

        this.error = false;

        this.fn_close = fn_close;  // Функция закрытия окна

        this.typeForm = 'form';
        this.createPane(regime);
        this.set(regime, editobjects);
    };

    GWTK.QueryGroupMapObjectsControlExt.prototype = {

        init: function (regime, editobjects) {
            this.regime = regime;
            this.editobjects = editobjects;
            this.setRecId();
            this.current = 0;
        },

        createPane: function (regime) {
            var header = this.header(regime);

            // Панель расположена после панели выбора объектов
            $(this.parent).append('<div id ="' + this.paneId + '" class="map-panel-def ' + 'mapeditorTask' + '-panel" >' +
                '</div>');
            this.$pane = $('#' + this.paneId);
            this.$pane.draggable({
                containment: "parent", distance: 2
            });

            if (this.$pane.length > 0) {
                this.$pane[0].appendChild(GWTK.Util.createHeaderForComponent({
                    map: this.map,
                    name: this.header(this.regime),
                    callback: GWTK.Util.bind(function () {
                        this.close();
                    }, this)
                }));
            }

            // Уберем отступы
            this.$pane.css('margin', 0);

            // форма
            this.formId = this.typeForm + this.paneId;
            this.$pane.append('<div id ="' + this.formId + '"></div>');
            if (this.typeForm == 'form')
                this.createform();
        },

        // Создать форму
        createform: function () {
            var _that = this,
                styleinput = ' style="width:90%" ',
                stylebtn = ' style="width:22%" ',
                formHTML =
                    '<div class="w2ui-page page-0 disabledbutton">' +
                    '<div class="w2ui-field">' +
                    '<label>' + w2utils.lang('Code') + '</label>' +
                    '<div>' +
                    '<input name="code" type="text"' + styleinput + '/>' +
                    '</div>' +
                    '</div>' +
                    '<div class="w2ui-field">' +
                    '<label>' + w2utils.lang('Object number') + '</label>' +
                    '<div>' +
                    '<input name="gid" type="text"' + styleinput + '/>' +
                    '</div>' +
                    '</div>' +
                    '<div class="w2ui-field">' +
                    '<label>' + w2utils.lang('Name') + '</label>' +
                    '<div>' +
                    '<input name="name" type="text"' + styleinput + '/>' +
                    '</div>' +
                    '</div>' +
                    '<div class="w2ui-field">' +
                    '<label>' + w2utils.lang('Layer') + '</label>' +
                    '<div>' +
                    '<input name="layername" type="text"' + styleinput + '/>' +
                    '</div>' +
                    '</div>' +
                    '<div class="w2ui-field">' +
                    '<label>' + w2utils.lang('Type') + '</label>' +
                    '<div>' +
                    '<input name="spatialpositionName" type="text"' + styleinput + '/>' +
                    '</div>' +
                    '</div>' +
                    '<div class="w2ui-field">' +
                    '<label>' + w2utils.lang('Layer (map)') + '</label>' +
                    '<div>' +
                    '<input name="maplayername" type="text"' + styleinput + '/>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +

                    '<div class="w2ui-buttons">' +
                    '<button class="btn" ' + stylebtn + ' name="yes" onclick="return false;">' + w2utils.lang("Yes") + '</button>' +
                    '<button class="btn" ' + stylebtn + ' name="skip" onclick="return false;">' + w2utils.lang("Skip") + '</button>' +
                    '<button class="btn" ' + stylebtn + ' name="all" onclick="return false;">' + w2utils.lang("All") + '</button>' +
                    '<button class="btn" ' + stylebtn + ' name="finish" onclick="return false;">' + w2utils.lang("Finish") + '</button>' +
                    '</div>';


            var fields = [
                {field: 'code', type: 'text'},
                {field: 'gid', type: 'text'},
                {field: 'name', type: 'text'},
                {field: 'layername', type: 'text'},
                {field: 'spatialpositionName', type: 'text'},
                {field: 'maplayername', type: 'text'}
            ];

            this.editobjects[this.current].spatialpositionName = this.editobjects[this.current].spatialpositionCaption();

            $('#' + this.formId).w2form({
                name: this.formId,
                fields: fields,
                record: this.editobjects[this.current],
                formHTML: formHTML,
                actions: {
                    yes: function () {
                        _that.editobjects[_that.current].isSave = true;
                        _that.nextrecord('yes');
                    },
                    skip: function () {
                        if (_that.setview('skip'))
                            _that.nextrecord('none');
                    },
                    all: function () {
                        _that.nextrecord('all', _that.editobjects.length);
                    },
                    finish: function () {
                        _that.nextrecord('finish', _that.editobjects.length);
                    }
                }
            });

        },

        // назначить идентификаторы записей
        setRecId: function () {
            for (var i = 0; i < this.editobjects.length; i++) {
                this.editobjects[i].recid = i + 1;
            }
        },

        // назначить данные
        set: function (regime, editobjects) {
            if (!editobjects || editobjects.length == 0)
                return;

            // Заполнить объектами selectedFeatures, если гридок
            this.selectedFeatures.clear();
            this.selectedFeatures.updateLink(editobjects);

            this.map.mapeditor.mapeditorTask.canCancel = false;
            this.init(regime, editobjects);

            var form = w2ui[this.formId];
           // this.$pane.show();
            GWTK.MapEditorUtil.show(this.panelId);
            if (form)
                this.nextrecord('none', 0);

        },

        // заголовок формы
        header: function (regime) {
            var headertext = '';
            switch (this.regime) {
                case 'delete':
                    headertext = w2utils.lang("Remove objects") + ' (' + this.editobjects.length + ')';
                    break;
                case 'edit':
                    headertext = w2utils.lang("Edit objects") + ' (' + this.editobjects.length + ')';
                    break;
            }
            return headertext;
        },

        // Разрушить оконные элементы
        destroy: function () {
            if (w2ui[this.formId])
                w2ui[this.formId].destroy();
            this.$pane.remove();
        },

        // Завершить операцию
        close: function () {
            var count = 0;
            for (var i = 0; i < this.editobjects.length; i++) {
                // сделаем клон объекта и отправим его на сохранение
                if (this.editobjects[i].isSave) {
                    count++;
                    this.map.selectedObjects.remove(this.editobjects[i]);
                }
            }

            if (count > 0 && this.regime == 'delete')
                w2utils.lock($(this.map.mapPane), w2utils.lang("Saving..."), true);

            this.$pane.hide();
            // //this.$pane.remove();
            // $(this.map.eventPane).trigger({ "type": "mapeditor_group", regime: this.regime, editobjects: this.editobjects });

            if (this.fn_close) {
                this.fn_close({regime: this.regime, editobjects: this.editobjects});
            }

            //if (count > 0)
            //    $(this.map.eventPane).trigger({ "type": "featureinforefreshed.featureinfo", "layers": this.map.objectManager.selectedFeatures.layers });

        },

        // текущая запись
        setrecord: function (current) {
            this.nextrecord(current);
        },

        // следующая запись
        nextrecord: function (actions, current) {
            if (actions == 'finish') {
                this.editobjects.splice(this.current, this.editobjects.length - this.current);
                this.close();
                return;
            }
            if (actions == 'all') {
                for (var i = 0; i < current; i++) {
                    this.editobjects[i].isSave = true;
                }
                this.close();
                return;
            }

            if (current >= 0)
                this.current = current;
            else {
                this.current++;
                if (!(this.current >= this.editobjects.length)) {
                    this.editobjects[this.current].spatialpositionName = this.editobjects[this.current].spatialpositionCaption();
                }
            }
            this.setview(actions);
        },

        // Подсветить выделенный объект
        setview: function (actions) {
            if (!this.editobjects || this.editobjects.length == 0 ||
                this.current >= this.editobjects.length) {
                this.close();
                return;
            }

            var form = w2ui[this.formId];
            if (form) {
                if (this.typeForm === 'form') {
                    form.record = this.editobjects[this.current];
                    form.refresh();
                }
            }

            // Отрисовать объект
            if (actions) {
                switch (actions) {
                    case 'yes':  // да
                        this.selectedFeatures.drawcontour(this.editobjects[this.current], true, true, true);
                        this.map.overlayRefresh();
                        break;
                    case 'skip':
                        this.selectedFeatures.remove(this.editobjects[this.current]);
                        this.current--;
                        if (this.editobjects.length === 0) {
                            this.close();
                            return;
                        }
                        break;
                    case 'none':
                        this.selectedFeatures.drawcontour(this.editobjects[this.current], true, true, true);
                        this.map.overlayRefresh();
                        break;
                }
            }
            else { // для грида
                if (this.editobjects[this.current]) {
                    this.selectedFeatures.drawcontour(this.editobjects[this.current], false, true, true, false);
                    this.map.overlayRefresh();
                }
            }

            return true;
        }

    };


}