/************************************** Соколова  ***** 19/04/21 ****
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

    GWTK.GRAPHIC = {};

    // Цвет по умолчанию
    GWTK.GRAPHIC.colorDefault = '#FF55FF';//'#000000';

    // Минимальный простой набор
    GWTK.GRAPHIC.optionsSimple = {
        'stroke': GWTK.GRAPHIC.colorDefault,  // цвет
        'stroke-width': 1.00,  // толщина
        'stroke-opacity': 1.00 // прозрачность
    }

    // Параметры простой линии
    GWTK.GRAPHIC.optionsSimpleLine = {
        // Общие
        'stroke': GWTK.GRAPHIC.colorDefault, //'#000000',      // цвет
        'stroke-width': 1.00,          // толщина
        'stroke-dasharray': '',     // пунктир
        // Только графика
        'stroke-opacity': 1.00,       // прозраность
        'stroke-dashoffset': 0,    // смещение
        'stroke-linecap': ''       // скругление углов
    };

    // Параметры простой линии
    GWTK.GRAPHIC.optionsSimpleLineHatch = {
        'stroke': '#000000', //GWTK.GRAPHIC.colorDefault,
        'stroke-width': 1.00,
        'stroke-angle': 45,
        'stroke-step' : 4 //3.794 = 1 мл
    };

    // Параметры заливки
    GWTK.GRAPHIC.optionsFillDefault = {
        'fill': GWTK.GRAPHIC.colorDefault, //'#FFFFFF',
        'fill-opacity': 1.00
    },

    // Параметры шрифта по умолчанию
    GWTK.GRAPHIC.fontFamilyDefault = 'Verdana';
    GWTK.GRAPHIC.fontStyleDefault = 'normal';
    GWTK.GRAPHIC.fontWeightDefault = 'normal';
    GWTK.GRAPHIC.fontSizeDefault = '12';
    GWTK.GRAPHIC.fontStretchDefault = 'normal';

    GWTK.GRAPHIC.optionsFontDefault = {
        'font-family': GWTK.GRAPHIC.fontFamilyDefault,   // имя шрифта
        'font-style': GWTK.GRAPHIC.fontStyleDefault,     // стиль шрифта: normal | italic | oblique
        'font-weight': GWTK.GRAPHIC.fontWeightDefault,   // насыщенность(толщина?) шрифта bold(полужирное)|bolder|lighter|normal(нормальное)|100|200|300|400|500|600|700|800|900
        'font-size': GWTK.GRAPHIC.fontSizeDefault,       // высота шрифта
        'font-stretch': GWTK.GRAPHIC.fontStretchDefault, // начертание (condensed(узкое)|normal(нормальное)|expanded(широкое)
        'text-decoration': 'none',                       // line-through (перечеркнутый) || overline (над текстом)|| underline(подчеркнутый )
        'letter-spacing': 0,                             // расстояние между буквами
        'text-shadow': '',                               // тень text-shadow: 1px 1px 1px #000000;
        'writing-mode': ''                               // направление текста на странице lr | rl | tb
        // направление текста на странице lr-tb | rl-tb | tb-rl | bt-rl | tb-lr | bt-lr

        //     lr  Устанавливает направление текста слева направо.
        //     rl  Задает направление текста справа налево.
        //     tb  Текст располагается вертикально сверху внищ.


        // lr-tb  Устанавливает направление текста слева направо.
        // rl-tb Задает направление текста справа налево.
        // tb-rl Текст располагается вертикально и выравнивается по верхнему и правому краю.
        // bt-rl Текст располагается вертикально и выравнивается по нижнему и правому краю.
        // tb-lr Текст располагается вертикально и выравнивается по верхнему и левому краю.
        // bt-lr Текст располагается вертикально и выравнивается по нижнему и левому краю.
    };

    GWTK.GRAPHIC.optionsMarkerDefault = {
        'path': "M 2 16 a 7 7 0 0 0 28 0M 2 16 a 7 7 0 0 1 28 0",  // круг
        // Пока заглушка
        'width': 32,
        'height': 32,
        'refX': 16,
        'refY': 16,
        'markerUnits': "userSpaceOnUse",
        'markerWidth': 32,
        'markerHeight': 32,
        'markerInitWidth': 32,
        'markerInitHeight': 32,
        'image': ''
    };


    /**
     *  класс типов графических объектов
     * @param layer
     * @param parentSelector
     * @param options {
     *     fn_selectcode : - функция выбора кода объекта
     *     selectobject : mapobject - предустановленный объект
     *     border: false - наличие рамки у компонента
     *     }
     * @constructor
     */

    GWTK.MapeditLegendGraphicControl = function (map, layer, parentSelector, options) {


        this.toolname = 'mapeditlegendraw';
        this.error = true;

        this.map = map;
        if (!this.map || this.map instanceof GWTK.Map == false || !layer) {
            return;
        }

        this.panelId = this.toolname + GWTK.Util.randomInt(150, 200);
        this.preInfoTabs = 'drawdetail';
        this.preInfoTab = 'selected-tab';
        // this.panelToolbarId = this.panelId + 'toolbar';

        this.parent = (parentSelector) ? $(parentSelector) : $(this.map.mapPane);

        // Инициализация переменых
        this.init();

        this.options = {
            border: false
        }
        if (options) {
            $.extend(this.options, options);
        }

        // Настроим слой
        this.changeLayer(layer);

    };

    GWTK.MapeditLegendGraphicControl.prototype = {

        /**
         * Инициализация переменных
         */
        init: function () {

            // Текущий объект
            this.initnode();

            // Пнель Draw объектов
            this.panelsDraw = {
                "line": {
                    "id": this.panelId + 'draw_line',
                    "code": 'Line',
                    "key": 'Line',
                    "caption": 'Line',
                    "visible": 1,
                    'min-height': '180px',
                    'example-size': ['100', '50'],
                    'local': GWTK.classifier.prototype.getlocalByName('linestring'),
                    'drawObject': new GWTK.MapeditLegendDraw_Line(),
                    'layerSemanticList': ''

                }
                , "polygon": {
                    "id": this.panelId + 'draw_polygon',
                    "code": 'Polygon',
                    "key": 'Polygon',
                    "caption": 'Polygon',
                    "visible": 1,
                    'min-height': '350px',
                    'example-size': ['100', '50'],
                    'local': GWTK.classifier.prototype.getlocalByName('Polygon'),
                    'drawObject': new GWTK.MapeditLegendDraw_Polygon(),
                    'layerSemanticList': ''
                }
                , "point": {
                    "id": this.panelId + 'drawp_point',
                    "code": 'Point',
                    "key": 'Point',
                    "caption" : 'Point',
                    "visible": 1,
                    'min-height': '200px',
                    'example-size': ['100', '50'],
                    'local': GWTK.classifier.prototype.getlocalByName('Point'),
                    'drawObject': new GWTK.MapeditLegendDraw_Marker(),
                    'layerSemanticList': ''

                }
                , "title": {
                    "id": this.panelId + 'draw_title',
                    "code": 'Title',
                    "key": 'Title',
                    "caption": 'Title',
                    "visible": 1,
                    'min-height': '250px',
                    'example-size': ['100', '50'],
                    'local': GWTK.classifier.prototype.getlocalByName('Title'),
                    'drawObject': new GWTK.MapeditLegendDraw_Title(),
                    'layerSemanticList': ''
                }
            };

            this.panelsDrawControl =
                {
                    "line": null,
                    "polygon": null,
                    "marker": null,
                    "title": null
                };

        },

        createPane: function () {

            // this.parent.empty();
            GWTK.MapEditorUtil.empty(this.parent[0]);
            // this.parent.show();
            GWTK.MapEditorUtil.show(this.parent[0]);

            var border = (this.options.border) ? ' border' : '',
                detailid = this.preInfoTabs + this.panelId,
                _id = this.preInfoTab + this.panelId,
                tab = w2ui[detailid], layer;

            // Удалим компонент
            if (tab) {
                tab.destroy();
            }

            var tabs = [],
                htmltab = '<div class="divFlex" style="width:98%; height: 90%; flex-direction: column;">';

            for (var key in this.panelsDraw) {
                htmltab += '<div id="' + _id + key + '" class="divFlex"  style="width:100%; height: 100%; min-height:"' + this.panelsDraw[key]['min-height'] + ';"></div>';
                tabs.push({id: key, caption: w2utils.lang(this.panelsDraw[key].caption)});
            }
            htmltab += '</div>';

            this.parent.append(
                // '<div class="w2ui-tabs divFlex' + border + '" id = "' + this.panelId + '" style="height:100%; flex-direction: column;">' + w2utils.lang("Graphics settings") +
                '<div class="divFlex" style="width:100%; height: 100%; flex-direction: column;">' +
                    '<div id = "' + detailid + '"  style="width:100%; height: 35px; margin-top:5px;"></div>' +
                    htmltab +
                 '</div>' +
                ' </div>'
            );

            // Закладки
            $('#' + detailid).w2tabs({
                name: detailid,
                style: 'background-color: transparent;',
                tabs: tabs,
                onClick: GWTK.Util.bind(function (event) {
                    this.setActiveTabInfo(event.tab.id);
                }, this)
            });


            this.showTab = null;
            this.setActiveTabInfo('line');

            // Если не графический слой, то закладка для точечных невидимая
            if (this.layer instanceof GWTK.graphicLayer == false ) {
                w2ui[detailid].hide('point');
            }

        },

        destroy: function () {

            for(var key in this.panelsDrawControl) {
                if (this.panelsDrawControl[key]) {
                    this.panelsDrawControl[key].destroy();
                }
            }
            // Закладки
            var tab = w2ui[this.preInfoTabs + this.panelId];
            if (tab) {
                tab.destroy();
            }

        },

        /**
         * Перерисовать окно с данными при смене размеров
         */
        refresh: function () {

            // Закладки
            var tab = w2ui[this.preInfoTabs + this.panelId];
            if (tab) {
                // tab.refresh(tab.active);
                for(var key in this.panelsDrawControl) {
                    // $('#' + this.panelId).height(this.parent.height());
                    // GWTK.MapEditorUtil.height(this.panelId, GWTK.MapEditorUtil.height(this.parent[0]));
                    if (tab.active == key) {
                        GWTK.MapEditorUtil.height('selected-tab' + this.panelId + key, GWTK.MapEditorUtil.height(this.parent[0]));

                        if (this.panelsDrawControl[tab.active]) {
                            this.panelsDrawControl[tab.active].refresh();
                        }
                        break;
                    }
                }

            }
            // for(var key in this.panelsDrawControl) {
            //     GWTK.MapEditorUtil.height('selected-tab' + this.panelId + key, GWTK.MapEditorUtil.height(this.parent[0]));
            //     if (this.panelsDrawControl[key]) {
            //         this.panelsDrawControl[key].refresh();
            //     }
            // }
        },


        // Установить активную закладку
        /**
         * Установить активную закладку
         * @param value - ключ объекта
         * @param change - признак применения измений
         */
        setActiveTabInfo: function (value, change) {
            if (!value) {
                return;
            }
            // Скрыть все
            var el;
            for (var key in this.panelsDraw) {
                el = document.getElementById( this.preInfoTab + this.panelId + key);
                if (key != value) {
                    GWTK.MapEditorUtil.hide(el);
                }
                else {
                    GWTK.MapEditorUtil.height(el,'100%');
                    GWTK.MapEditorUtil.show(el);
                    if (this.showTab != key) {
                        this.initTabInfo(key, change);
                    }
                    this.showTab = key;
                }
            }

            var w2ui_tabs = w2ui[this.preInfoTabs + this.panelId];
            if (w2ui_tabs) {
                if (this.showTab != w2ui_tabs.active) {
                    w2ui_tabs.active = this.showTab;
                    w2ui_tabs.refresh();
                    if (this.panelsDrawControl[this.showTab]) {
                        this.panelsDrawControl[this.showTab].refresh();
                    }
                }
            }
        },

        /**
         * Инициализация данных закладки
         * @param key
         */
        initTabInfo: function (key, change) {
            if (!key) {
                return;
            }

            var options = {
                type: key,
                settings: this.panelsDraw[key],

                fn_changeimage: GWTK.Util.bind(function(key, drawObject) {

                    this.panelsDraw[key].drawObject = drawObject.clone();

                    // Отошлем триггер на смену вида объекта (если сть выделенный тип))
                    if (this.node.key) {
                        $(this.map.eventPane).trigger({
                            type: 'GWTK.MapeditLegendGraphicControl.changegraphicparams',
                            source: drawObject,
                            maplayer: this.layer,
                            ischange: (this.panelsDrawControl[key]) ? this.panelsDrawControl[key].isChange() : false
                        });
                    }
                }, this),

                fn_selectcode: GWTK.Util.bind(function(key, drawObject) {
                    this.selectCodeDraw(key);
                }, this)
            };

            if (!this.panelsDrawControl[key]) {
                switch(key) {
                    case 'line':
                    case 'polygon':
                        this.panelsDrawControl[key] =
                            new GWTK.MapeditLegendDrawControl_LinePolygon(
                                this.map, this.layer, '#' + this.preInfoTab + this.panelId + key, options);
                        break;

                    case 'title':
                        this.panelsDrawControl[key] =
                            new GWTK.MapeditLegendDrawControl_Title(
                                this.map, this.layer, '#' + this.preInfoTab + this.panelId + key, options);
                        break;

                    case 'point':
                        this.panelsDrawControl[key] =
                            new GWTK.MapeditLegendDrawControl_Marker(
                                this.map, this.layer, '#' + this.preInfoTab + this.panelId + key, options);
                        break;
                }
            }
            else {
                if (change) {
                    this.panelsDrawControl[key]._ischange = false;
                }
                this.panelsDrawControl[key].createDetailPane(key, this.panelsDraw[key]['drawObject']);
            }

        },

        // Смена слоя
        changeLayer: function (layer) {

            if (!layer) {
                return;
            }

            if (!this.layer || this.layer.id != layer.id) {
                this.init();

                this.layer = layer;
                this.createPane();
            }
        },

        initnode: function(){
            this.node = {
                id: null,
                code: null,
                key: null,
                local: null,
                text: '',
                graphic: 'graphic'
            };
        },

        setnode: function(key){
            this.initnode();
            if (key) {
                key = key.toLowerCase();
                if (this.panelsDraw[key]) {
                    this.node = {
                        id: this.panelsDraw[key]['id'],
                        code: this.panelsDraw[key]['code'],
                        key: this.panelsDraw[key]['key'],
                        local: this.panelsDraw[key]['local'],
                        text: w2utils.lang(this.panelsDraw[key]['caption']),
                        graphic: (this.panelsDraw[key]['drawObject'].saveJSON) ? this.panelsDraw[key]['drawObject'].saveJSON() : ''
                    };
                    if (this.node && this.node.graphic && this.node.graphic.classifierLayer) {
                        this.node.bsdlayer = this.node.graphic.classifierLayer;
                    }
                    this.initTabInfo(key);
                }
            }
        },

        get: function (node) {
            if (!node) {
                node = this.node;
            }
            if (!node.key) {
                return;
            }

            for (var key in this.panelsDraw) {
                if (key.toLowerCase() == node.key.toLowerCase()) {
                    return this.panelsDraw[key];
                }
            }
        },

        set: function (node, select) {
            if (!node) {
                node = this.node;
            }

            // key должен быть равен  code
            if (node.key) {
                node.code = node.key;
            }
            else{
                if (node.code) {
                    node.key = node.code;
                }
            }
            var draw = this.get(node);
            if (draw && node.graphic && node.key) {
                draw.drawObject = GWTK.MapeditLegendGraphicControl.prototype.createGraphicObjectFromJSON(node.graphic);
                this.setActiveTabInfo(node.key.toLowerCase(), true);
                this.setnode(node.key);
                // if (select) {
                    // Сделаем активной закладку
                    this.setActiveImageElement(node.key.toLowerCase(), true);
                // }
            }


        },

        unset: function (node) {
            if (!node) {
                node = this.node;
            }

            var draw = this.get(node);
            if (draw) {
                var key = draw['code'].toLowerCase();
                this.setActiveImageElement(key);
                if (this.panelsDrawControl[key]) {
                    this.panelsDrawControl[key]._ischange = false;
                }
            }
        },

        /**
         * Выбор элемента из свободного просмотра
         * @param event
         */
        selectCodeDraw: function (key_select) {

            this.initnode();

            // Сбросить все выделенные
            for (var key in this.panelsDraw) {
                this.setActiveImageElement(key);
            }

            if (key_select) {
                key_select = key_select.toLowerCase();

                // Сделаем активной закладку
                this.setActiveImageElement(key_select, true);

                // Найдем элемент
                var select = null;
                for (var key in this.panelsDraw) {
                    if (key_select == key) {
                        select = key;
                        break;
                    }
                }

                if (select) {
                    this.setnode(select);

                    // Отошлем триггер на смену вида объекта
                    $(this.map.eventPane).trigger({
                        type: 'GWTK.MapeditLegendGraphicControl.select',
                        source: this.panelsDraw[key]['drawObject'],
                        maplayer: this.layer
                    });

                }

            }

        },

        /**
         * Сделать активным элемент
         * @param selector
         * @param active
         */
        setActiveElement: function (selector, active) {
            var el = $(selector)
            GWTK.DomUtil.removeActiveElement(el);
            if (active) {
                GWTK.DomUtil.setActiveElement(el);
            }
        },

        /**
         * Сделать активной кнопку с изображением
         * @param key
         * @param active
         */
        setActiveImageElement: function (key, active) {
            this.setActiveElement('#' + this.preInfoTab + this.panelId + key, active);
            this.setActiveElement("div[name='image_" + key + "']", active);
        },

        /**
         * Создать графический объект по параметрам шаблона
         * options = {
         *      type : тип ('line', 'plygon' ...),
         *      options : параметры для создания объекта
         * }
         */
        createGraphicObjectFromJSON: function (options) {
            var newobject = null;
            if (options && options.type) {
                switch (options.type) {
                    case 'line':
                        newobject = new GWTK.MapeditLegendDraw_Line();
                        break;

                    case 'polygon':
                        newobject = new GWTK.MapeditLegendDraw_Polygon();
                        break;

                    case 'title':
                        newobject = new GWTK.MapeditLegendDraw_Title();
                        break;

                    case 'point':
                        newobject = new GWTK.MapeditLegendDraw_Marker();
                        break;

                    default:
                        newobject  = new GWTK.MapeditLegendDraw_Line();
                        break;
                }

                if (newobject && options.options) {
                    newobject.loadJSON(options);
                }
            }
            return newobject;
        },

        /**
         * Созранить данные в формат SLD (только для объектов карты)
         * @param options
         * @returns {*}
         */
        saveSLD: function(options){
            var sld = '';
            if (options && options.type) {
                switch (options.type) {
                    case 'line':
                        sld = GWTK.MapeditLegendDraw_Line.prototype.saveSLD(options);
                        break;

                    case 'polygon':
                        sld = GWTK.MapeditLegendDraw_Polygon.prototype.saveSLD(options);
                        break;

                    case 'title':
                        sld = GWTK.MapeditLegendDraw_Title.prototype.saveSLD(options, true);
                        break;

                    case 'point':
                        sld = GWTK.MapeditLegendDraw_Marker.prototype.saveSLD(options);;
                        break;

                }
            }
            return sld;
        },

        /**
         * Загрузить графические параметры из SLD описания
         * @param type
         * @param nodeSLD
         * @returns {*}
         */
        loadSLD: function(nodeSLD, classifierLayer){
            var options;

            var styles = this.setStyleFromSLD(nodeSLD);
            if (styles && styles.type) {
                var type = styles.type;
                switch (type) {
                    case 'line':
                        if (styles['styleLine'] && styles['styleLine'].length > 0) {
                            options = this.setOptionsFromStyle(type, {
                                    'styleLine': styles['styleLine']
                            });
                        }
                        break;
                    case 'polygon':
                        if (styles['styleFill'] || styles['styleLine'] || styles['styleHatch']) {
                            options = this.setOptionsFromStyle(type, {
                                    'styleFill': styles['styleFill'],
                                    'styleLine': styles['styleLine'],
                                    'styleHatch': styles['styleHatch']
                            });
                        }
                        break;
                    case 'title':
                        if (styles['styleTitle']) {
                            // Откорректируем stroke
                            var styleFont = styles['styleTitle'].styleFont;
                            if (styleFont) {
                                if ((!styleFont["stroke-width"] || parseInt(styleFont["stroke-width"]) == 0) &&
                                    (styleFont["text-shadow"])) {
                                    styleFont["stroke"] = '';
                                }
                            }
                            options = this.setOptionsFromStyle(type, {
                                    'style': $.extend(styles['styleTitle']['styleFill'], styles['styleTitle']['styleFont'])
                                });
                        }
                        break;
                }
            }
            if (options) {
                options.classifierLayer = classifierLayer;
            }

            return options;
        },

        /**
         * Создать стиль из SLD
         * @param nodeSLD
         * @returns {{styleFill: {}, styleLine: Array, styleHatch: Array, styleTitle: {styleFill: {}, styleFont: {}}}}
         */
        setStyleFromSLD: function(nodeSLD){
            var elem, child,
                styles = {
                    'styleFill': {},
                    'styleLine': [],
                    'styleHatch': [],
                    'styleTitle': {
                        'styleFill': {},
                        'styleFont' : {}
                    },
                    'type': ''
                };

            if (nodeSLD.nodeName.toLowerCase() == 'sld') {
                elem = nodeSLD.childNodes;
                if (elem && elem.length > 0) {
                    if (elem[0].nodeName.toLowerCase() == 'featuretypestyle') {
                        elem = elem[0].childNodes;
                        if (elem && elem.length > 0) {
                            if (elem[0].nodeName.toLowerCase() == 'rule') {
                                elem = elem[0].childNodes;
                                if (elem && elem.length > 0) {
                                    for(var i = 0; i < elem.length; i++){
                                        switch(elem[i].nodeName.toLowerCase()){
                                            case 'polygonsymbolizer':
                                                child = elem[i].childNodes;
                                                if (child && child.length > 0) {
                                                    for(var j = 0; j < child.length; j++){
                                                         switch(child[j].nodeName.toLowerCase()){
                                                            case 'fill': // Заливка
                                                                this.loadSLD_css(child[j], styles['styleFill']);
                                                                break;
                                                            case 'stroke':  // штриховка
                                                                styles['styleHatch'].push({});
                                                                this.loadSLD_css(child[j], styles['styleHatch'][styles['styleHatch'].length - 1]);
                                                                break;
                                                        }
                                                    }
                                                }
                                                styles.type = 'polygon';
                                                break;

                                            case 'linesymbolizer':
                                                child = elem[i].childNodes;
                                                if (child && child.length > 0) {
                                                    for (var j = 0; j < child.length; j++) {
                                                        switch (child[j].nodeName.toLowerCase()) {
                                                            case 'stroke': // Линия
                                                                styles['styleLine'].push({});
                                                                this.loadSLD_css(child[j], styles['styleLine'][styles['styleLine'].length - 1]);
                                                                break;
                                                        }
                                                    }
                                                }
                                                break;

                                            case 'textsymbolizer':
                                                child = elem[i].childNodes;
                                                if (child && child.length > 0) {
                                                    for(var j = 0; j < child.length; j++){
                                                        switch(child[j].nodeName.toLowerCase()){
                                                            case 'fill': // Заливка
                                                                this.loadSLD_css(child[j], styles['styleTitle']['styleFill']);
                                                                break;
                                                            case 'font':  // шрифт
                                                                this.loadSLD_css(child[j], styles['styleTitle']['styleFont']);
                                                                break;
                                                        }
                                                    }
                                                }
                                                styles.type = 'title';
                                                break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (!styles.type) {
                styles.type = 'line';
            }
            return styles;
        },

        /**
         * Заполнить объект стилеф из css
         * @param nodes - массив nodes с параметрами css
         * @param style - Объект style, куда добавляются новые стили
         * @returns {*}
         */
        loadSLD_css: function(node, style){
            if (!node || !style) {
                return style;
            }
            var css_child = node.childNodes;
            if (css_child && css_child.length > 0) {
                for(var i = 0; i < css_child.length; i++){
                    if (css_child[i].nodeName.toLowerCase() == 'cssparameter') {
                        style[css_child[i].getAttribute('name')] = $(css_child[i]).text();
                    }
                }
            }
            return style;
        },

        /**
         * Создать объект параметров для графического класса по объекту стиля
         *  type : тип ('line', 'plygon' ...),
         *  style: {
         *      style: {
         *          fill: "#76A5AF"
         *          fill-opacity: 1
         *          stroke: "#6AA84F"
         *          stroke-dasharray: ""
         *          stroke-dashoffset: 0
         *          stroke-linecap: ""
         *          stroke-opacity: 1
         *          stroke-width: "11.00"
         *          }
         *  }
         */
        setOptionsFromStyle: function (type, style) {
            var newobject = null;
            if (type) {
                if (type.indexOf('line') >= 0) {
                    return GWTK.MapeditLegendDraw_Line.prototype.setOptionsFromStyle(style);
                }
                else {
                    if (type.indexOf('polygon') >= 0) {
                        return GWTK.MapeditLegendDraw_Polygon.prototype.setOptionsFromStyle(style);
                    }
                    else {
                        if (type.indexOf('title') >= 0) {
                            return GWTK.MapeditLegendDraw_Title.prototype.setOptionsFromStyle(style);
                        }
                        else {
                            if (type.indexOf('point') >= 0) {
                                return GWTK.MapeditLegendDraw_Marker.prototype.setOptionsFromStyle(style);
                            }
                        }

                    }

                    // TODO !!! Дописать для остальных типов
                }
            }

            return {};
        },

        // Инициализировать данные Draw объектов
        initPanelDraw: function (graphicObject) {
            if (!graphicObject) {
                return;
            }
            if (this.panelsDraw[graphicObject.type]) {
                this.panelsDraw[graphicObject.type].drawObject = graphicObject.clone();
                var draw = this.panelsDraw[graphicObject.type];

                if (this.showTab == graphicObject.type) {
                    if (this.panelsDrawControl[graphicObject.type]) {
                        this.panelsDrawControl[graphicObject.type].createDetailPane(graphicObject.type, draw['drawObject']);
                    }
                    else {
                        this.initTabInfo(graphicObject.type);
                    }
                }
             }
         }

    }


    /*********************************************/
    /**       КЛАССЫ ГРАФМЧЕСКИХ ПРИМИТИВОВ    ***/
    /*********************************************/

    /****************************************************/
    /**  Служебные функции для графических примитивов  **/
    /****************************************************/

    GWTK.MapeditLegendDrawUtil = {
        /**
         * Запросить целое значение
         * @param val
         * @returns {string}
         */
        getInt: function (val) {
            return (parseInt(val) == NaN) ? '1' : val;
        },

        /**
         * Запросить значение цвета
         * @param val
         * @returns {string}
         */
        getColor: function (val) {
            var result = 'none'; //GWTK.GRAPHIC.colorDefault;
            if (val) {
                return (val[0] != '#') ? result : ((val == '#') ? 'none' : val);
            }
            return result;
        }
    };



    /**
     * Базовый класс отображения типов графических объектов
     * @param map
     * @param layer
     * @param parentSelector
     * @param options {
     *     fn_changeimage : - функция смены вида объекта
     *     fn_selectcode : - функция выделения объекта
     *     }
     * @constructor
     */

    GWTK.MapeditLegendDrawControl_Base = function (map, layer, parentSelector, options) {

        this.error = true;

        this.map = map;
        if (!this.map || this.map instanceof GWTK.Map == false || !layer) {
            return;
        }

        this.parent = (parentSelector) ? $(parentSelector) : $(this.map.mapPane);

        this.options = {};
        if (options) {
            $.extend(this.options, options);
        }

        // Префикс панели парамеров
        this.imagesparam = 'imagesparam';

        // Признак инициализации данных
        this._ischange = false;
    };

    GWTK.MapeditLegendDrawControl_Base.prototype = {

        changeLayer: function (layer) {
            if (!layer) {
                return;
            }

            if (!this.layer || this.layer.id != layer.id) {

                this.layer = layer;
                if (this.layer instanceof GWTK.graphicLayer) {
                    this.isGraphic = true;
                }
                else {
                    this.isGraphic = false;
                }
                this.createPane();
            }
        },

        createPane: function(){
            var parent = this.parent,
                key = this.options.type,
                layerlistId = this.options.settings['id'] + 'layer_' + key,
                current = $('#' + this.panelId),
                layer = (this.isGraphic) ? layer = '' :
                    '<div style="width:100%;">' +
                        '<div class="w2ui-field w2ui-span3">' +
                            '<label style = "text-align:left !important; width: 10px; margin-top: 3px;">' +
                            '</label>' +
                        '</div>' +
                        '<input type="list" id="' + layerlistId + '" style="width:90% !important;">' +
                    '</div>',
                // Для точечного за overflow отвечает грид
                overflow = (key != 'title') ? 'overflow-y:auto;' : '';


            if (current.length > 0) {
                // parent.show();
                GWTK.MapEditorUtil.show(parent[0]);
                this.refresh();
            }
            else {
                parent.empty();
                parent.append(
                    '<div id="' + this.panelId + '" class="divFlex" style="margin: 3px; height:98%; width: 100%; flex-direction: column;">' +
                    // Название типа объектаи и его изображение
                    '<div  class="divFlex" style="flex-direction: row; justify-content: space-between">' +
                    // Изображение объекта
                    '<div name="image_' + key + '" class="control-button border-button clickable" Title= "' + w2utils.lang('Click to select type') +'" style="padding:1px; width:' + this.options.settings['example-size'][0] + 'px; height:' + this.options.settings['example-size'][1] + 'px;"></div>' +
                    // Список слоев
                    layer +
                    '</div>' +
                    // Объекты слоя
                    '<div id="' + this.panelId + this.imagesparam + '" class="divFlex" style="height:96%; width:100%; flex-direction: column;' + overflow + '"></div>' +
                    '</div>'
                );

                // Добавим список слоев карты
                if (layer) {
                    this.createClassifierLayers(key, '#' + layerlistId);
                }

                this.createDetailPane(key, this.options.settings['drawObject']);

                if (this.options.fn_selectcode) {

                    $("div[name='image_" + key + "']").click(
                        GWTK.Util.bind(function(){
                            if (this.options.fn_selectcode && $.isFunction(this.options.fn_selectcode)) {
                                this.options.fn_selectcode(this.options.type, this.options.settings['drawObject']);
                            }
                        },this)
                    );

                }
            }

            // Настроим минимальную высоту окна
            parent.css('min-height', this.options.settings['min-height']);

        },

        destroy: function(){
        },

        refresh: function(){
        },

        isChange: function(){
            return this._ischange;
        },

        /**
         * Изменение значения
         * @param valueold
         * @param valuenew
         */
        changeValue: function(valueold, valuenew){
            if (valueold != valuenew) {
                valueold = valuenew;
                this._ischange = true;
            }
            return valueold;
        },

        /**
         * Комбобокс со списком слоев классификатора карты
         * @param key
         * @param selector
         */
        createClassifierLayers: function (key, selector) {
            var el = $(selector);

            el.empty();

            if (this.layer.classifier) {
                this.layer.classifier.getLayerSemanticList(
                    GWTK.bind(function (list) {
                        if (list) {
                            var layersName = [], index = 0;
                            if (!this.options.settings['layerSemanticList'] &&
                                this.options.settings.drawObject && this.options.settings.drawObject.classifierLayer) {
                                this.options.settings['layerSemanticList'] =
                                    this.layer.classifier.getLayerSemanticListByKey(this.options.settings.drawObject.classifierLayer);
                            }

                            for (var i = 0; i < list.length; i++) {
                                layersName.push({
                                    id: list[i].name,
                                    text: list[i].alias
                                });
                                if (this.options.settings['layerSemanticList']) {
                                    if (this.options.settings['layerSemanticList'].name == list[i].name) {
                                        index = i;
                                    }
                                }
                            }

                            el.off();
                            el.w2field('list',
                                {items: layersName, selected: layersName[index]});

                            el.change(GWTK.Util.bind(function (event) {
                                var obj = el.data('selected');
                                if (obj) {
                                    this.setClasifierLayer(obj.id, key, true);
                                }
                            }, this))
                            this.setClasifierLayer(layersName[index].id, key);
                        }
                    }, this)
                );
            }
        },

        /**
         * Установить значение слоя классификатора
         * @param value
         * @param key
         */
        setClasifierLayer: function (value, key, select) {
            this.options.settings['layerSemanticList'] = this.layer.classifier.getLayerSemanticListByKey(value);
            if (this.options.settings['layerSemanticList']) {
                // this.options.settings['drawObject'].classifierLayer = this.options.settings['layerSemanticList'].name;
                this.options.settings['drawObject'].classifierLayer = this.changeValue(this.options.settings['drawObject'].classifierLayer, this.options.settings['layerSemanticList'].name);

                // Отошлем триггер на смену вида объекта
                if (this.options.fn_changeimage) {
                    this.options.fn_changeimage(key, this.options.settings['drawObject']);
                }

            }
        },

        /**
         * Установить значение слоя классификатора
         * @param drawObject
         */
        selectClasifierLayer: function(drawObject) {
            if (drawObject) {
                this.layer.classifier.getLayerSemanticListByKey(drawObject.classifierLayer, GWTK.Util.bind(function(data){
                    if (data) {
                        var el = $('#' + this.options.settings['id'] + 'layer_' + drawObject.type);
                        if (el.length > 0) {
                            var d = el.data('selected', {
                                id: data.name,
                                text: data.alias
                            }).data('w2field');
                            if (d && d.refresh) {
                                d.refresh();
                            }
                        }
                    }
                }, this));
            }
        },

        /**
         * Отрисовка вида объекта
         * @param selector - селектор
         * @param drawObject - графический объект
         */
        // paintExampleImageSvg: function(selector, drawObject) {
        //     var image;
        //     if (selector) {
        //         image = $(selector);
        //     }
        //     if (image && drawObject) {
        //         var w, h;
        //         if (image) {
        //             image.empty();
        //             w = image.width();
        //             h = image.height();
        //         }
        //         image.append('<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + drawObject.getExampleImageSvg(w, h) + '</svg>');
        //     }
        // }

        paintExampleImageSvg: function(selector, drawObject) {
            var image;
            if (selector) {
                image = $(selector);
            }
            if (image.length > 0 && drawObject) {
                var w, h;
                if (image) {
                    GWTK.MapEditorUtil.empty(image[0]);
                    w = parseInt(GWTK.MapEditorUtil.width(image[0])) - 4;
                    h = parseInt(GWTK.MapEditorUtil.height(image[0])) - 4;
                }
                if (drawObject.type !== 'point') {
                    image.append('<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + drawObject.getExampleImageSvg(w, h) + '</svg>');
                }
                else {
                    var svg = drawObject.createSvgExampleElement(w, h);
                    if (svg) {
                        image.append(svg);
                    }
                }
            }
        }

    };



     /**
     *  класс отображения типов графических объектов line и polygon
     * @param map
     * @param layer
     * @param parentSelector
     * @param options {
     *     fn_changeimage : - функция смены вида объекта
     *     fn_selectcode : - функция выделения объекта
     *     }
     * @constructor
     */

    GWTK.MapeditLegendDrawControl_LinePolygon = function (map, layer, parentSelector, options) {

        // родительский конструктор
        GWTK.MapeditLegendDrawControl_Base.call(this, map, layer, parentSelector, options);

        this.toolname = 'legendrawcontrol';

        if (!this.options.type) {
            this.options.type = 'line';
        }
        this.panelId = this.toolname + GWTK.Util.randomInt(150, 200) + this.options.type;

        // Настроим слой
        this.changeLayer(layer);

        this.error = false;
    };

    GWTK.MapeditLegendDrawControl_LinePolygon.prototype = {

        createDetailPane: function(type, drawObject){

            var parentSelector = '#' + this.panelId;
            if (!type) {
                return;
            }
            if (drawObject) {
                this.options.settings.drawObject = drawObject.clone();
            }

            parentSelector += this.imagesparam;
                type = type.toLowerCase();
                switch (type) {
                    case 'line':
                        if (!drawObject) {
                            drawObject = new GWTK.MapeditLegendDraw_Line();
                        }
                        this.createDetailPaneLine(type, parentSelector, drawObject);
                        break;

                    case 'polygon':
                        if (!drawObject) {
                            drawObject = new GWTK.MapeditLegendDraw_Polygon();
                        }
                        this.createDetailPanePolygon(type, parentSelector, drawObject);
                        break;

                    case 'point':
                        if (!drawObject) {
                            drawObject = new GWTK.MapeditLegendDraw_Marker();
                        }
                        if (this.createDetailPaneMarker) {
                            this.createDetailPaneMarker(parentSelector, drawObject);
                        }
                        break;
                }

                // Установим значение слоя классификатора
                this.selectClasifierLayer(drawObject);
        },

        destroy: function(){
            // Удалить гридки
            var w2uiEl = w2ui[this.options.type + 'images_grid_line'];
            if (w2uiEl) {
                w2uiEl.destroy();
            }
            w2uiEl = w2ui[this.options.type + 'images_grid'];
            if (w2uiEl) {
                w2uiEl.destroy();
            }
            w2uiEl = w2ui[this.options.type + 'images_grid_hatch'];
            if (w2uiEl) {
                w2uiEl.destroy();
            }

            this.parent.empty();
        },

        refresh: function(){
            var w2uiEl = w2ui[this.options.type + 'images_grid_line'];
            if (w2uiEl) {
                w2uiEl.refresh();
            }
            w2uiEl = w2ui[this.options.type + 'images_grid'];
            if (w2uiEl) {
                w2uiEl.refresh();
            }
            w2uiEl = w2ui[this.options.type + 'images_grid_hatch'];
            if (w2uiEl) {
                w2uiEl.refresh();
            }
        },


        /**
         * Панель парметров линии
         * @param type - тип 'line' или 'polygon'
         * @param parentSelector - родительский селектор
         * @param drawObject - объект MapeditLegendDraw_Line
         */
        createDetailPaneLine: function (type, parentSelector, drawObject) {
            var records = this.getRecordsGrid(type, drawObject),
                columns = [],
                gridname = type + 'images_grid_line',
                grid = w2ui[gridname];

            if (grid) {
                grid.records = records;
                grid.drawObject = drawObject;
                grid.refresh();
                return;
            }

            var parentEl = $(parentSelector);
            if (parentEl.length == 0) {
                return;
            }
            parentEl.empty();

            var html = this.getHtmlPanel(type);
            parentEl.append(html);

            // Грид с примитивами
            var images = parentEl.find("div[name='images_grid_line']"),
                _that = this;

            if (images.length == 0 || !drawObject) {
                return;
            }

            var procent = parseInt(100 / 4);
            columns.push({
                field: 'stroke',
                caption: w2utils.lang('Stroke color'),
                title: w2utils.lang('Stroke color'),
                size: procent + '%',
                editable: {type: 'color'}
                ,
                render: function (record, index, column_index) {
                    return _that.renderGridColumns(this, record, this.columns[column_index].field);
                }
            });
            columns.push({
                field: 'stroke-width',
                caption: w2utils.lang('Stroke width'),
                title: w2utils.lang('Stroke width'),
                size: procent + '%',
                editable: {type: 'float', precision: 2}
                ,
                render: function (record, index, column_index) {
                    return _that.renderGridColumns(this, record, this.columns[column_index].field);
                }
            });
            columns.push({
                field: 'stroke-dasharray',
                caption: w2utils.lang('Dasharray'),
                title: w2utils.lang("The lengths of strokes and spaces, separated by spaces: stroke space stroke space ..."),
                size: procent + '%',
                editable: {type: 'text'}
                ,
                render: function (record, index, column_index) {
                    return _that.renderGridColumns(this, record, this.columns[column_index].field);
                }
            });
            columns.push({
                field: 'stroke-opacity',
                caption: w2utils.lang('Stroke opacity'),
                title: w2utils.lang('Stroke opacity') + ': 0 - 1',
                size: procent + '%',
                editable: {type: 'float', precision: 2, min: 0, max: 1}
                ,
                render: function (record, index, column_index) {
                    return _that.renderGridColumns(this, record, this.columns[column_index].field);
                }
            });


            // Грид
            var show = {header : true},
                toolbar = this.getToolBar(type);
           if (toolbar) {
                show.toolbar = true;
                show.toolbarAdd = false;
                show.toolbarDelete = false;
                show.toolbarSave = false;
                show.toolbarEdit = false;
                show.toolbarReload = false;
                show.toolbarColumns = false;
                show.toolbarSearch = false;
            }
            images.w2grid({
                header  : w2utils.lang('Contour'),
                show : show,
                name: gridname,
                columns: columns,
                multiSelect: false,
                records: records,
                toolbar: toolbar,
                onDelete: function(event) {
                    event.preventDefault();
                },
                onAdd: function(event) {
                    event.preventDefault();
                }
            });

            grid = w2ui[gridname];
            if (grid) {
                grid.select('1');
                grid.type = 'line';
                grid.objectImage = type;
                grid.drawObject = drawObject;
                if (grid.toolbar) {
                    grid.toolbar.grid = grid;
                }

            }
        },

        /**
         * Панель парметров линии
         * @param type - тип 'line' или 'polygon'
         * @param parentSelector - родительский селектор
         * @param drawObject - объект MapeditLegendDraw_Line
         */
        createDetailPaneLineHatch: function (type, parentSelector, drawObject) {

            var records = this.getRecordsGrid(type, drawObject, true),
                columns = [],
                gridname = type + 'images_grid_hatch',
                grid = w2ui[gridname];

            if (grid) {
                grid.records = records;
                grid.drawObject = drawObject;
                grid.refresh();
                return;
            }

            var parentEl = $(parentSelector),
                // Грид с примитивами
                images = parentEl.find("div[name='images_grid_hatch']");

            if (images.length == 0 || !drawObject) {
                return;
            }

            // Изменения значения поля
            onAngleChange = function (event) {
                if (event.data) {
                    var val = $(event.target).data('selected').id;
                    event.data.record['stroke-angle'] = val;
                    if (event.data.drawobject) {
                        event.data.drawobject.set('hatch', event.data.record.recid - 1, 'stroke-angle', val);
                        _that.refreshImage(grid);

                    }
                }
            }

            var procent = parseInt(100 / 4), _that = this;
            columns.push({
                field: 'stroke',
                caption: w2utils.lang('Stroke color'),
                title: w2utils.lang('Stroke color'),
                size: procent + '%',
                editable: {type: 'color'}
                ,
                render: function (record, index, column_index) {
                    return _that.renderGridColumns(this, record, this.columns[column_index].field);
                }
            });
            columns.push({
                field: 'stroke-width',
                caption: w2utils.lang('Stroke width'),
                title: w2utils.lang('Stroke width'),
                size: procent + '%',
                editable: {type: 'float', precision: 2}
                ,
                render: function (record, index, column_index) {
                    return _that.renderGridColumns(this, record, this.columns[column_index].field);
                }
            });
            columns.push({
                field: 'stroke-step',
                caption: w2utils.lang('Step'),
                title: w2utils.lang("Step"),
                size: procent + '%',
                editable: {type: 'int', min: 3}
                ,
                render: function (record, index, column_index) {
                    return _that.renderGridColumns(this, record, this.columns[column_index].field);
                }
            });
            columns.push({
                field: 'stroke-angle',
                caption: w2utils.lang('Angle'),
                title: w2utils.lang('Angle'),
                size: procent + '%',
                render: function (record, index, col_index) {

                    var id = _that.panelId + 'anglelist_'+ index.toString(),
                        html =
                        '<div style="width:100%;">' +
                            '<input style="width:100%;" type="list" id="' + id + '"/>' +
                        '</div>',
                        grid = this;
                    setTimeout(function () {
                        var $field = $('#' + id),
                            options = {};
                            if (record._anglelist) {
                                options.selected = record['stroke-angle'];
                                options.focus = -1;
                                options.items = record._anglelist;
                                $field.w2field('list', options);
                                $field.off('change', onAngleChange);
                                $field.on('change', {record: record, drawobject: (grid) ? grid.drawObject : null},
                                    onAngleChange);
                            }
                    }, 100);
                    return html || '';
                }
            });


            // Грид
            var show = {header : true},
                toolbar = this.getToolBar(type);
            if (toolbar) {
                show.toolbar = true;
                show.toolbarAdd = false;
                show.toolbarDelete = false;
                show.toolbarSave = false;
                show.toolbarEdit = false;
                show.toolbarReload = false;
                show.toolbarColumns = false;
                show.toolbarSearch = false;
            }
            images.w2grid({
                header  : w2utils.lang('Hatching'),
                show : show,
                name: gridname,
                columns: columns,
                multiSelect: false,
                records: records,
                toolbar: toolbar,
                onDelete: function(event) {
                    event.preventDefault();
                },
                onAdd: function(event) {
                    event.preventDefault();
                }
            });

            grid = w2ui[gridname];
            if (grid) {
                if (records.length > 0) {
                    grid.select('1');
                }
                grid.type = 'hatch';
                grid.objectImage = type;
                grid.drawObject = drawObject;
                if (toolbar) {
                    grid.toolbar.grid = grid;
                }
            }
        },


        /**
         * Панель параметров полигона
         * @param parentSelector
         * @param drawObject
         */
        createDetailPanePolygon: function (type, parentSelector, drawObject) {

            if (!drawObject) {
                drawObject = new GWTK.MapeditLegendDraw_Polygon();
            }

            var parentEl = $(parentSelector),
                type = (type) ? type: 'polygon';
            if (parentEl.length == 0) {
                return;
            }

            var records = [
                    {
                        'recid': 1,
                        'fill': drawObject.options.optionsFill['fill'],
                        'fill-opacity': drawObject.options.optionsFill['fill-opacity']
                    }
                ],
                gridname = type + 'images_grid',
                grid = w2ui[gridname];

            if (grid) {
                grid.drawObject = drawObject;
                grid.records = records;
                grid.refresh();

                //  Обновим линию
                this.createDetailPaneLine(type, parentSelector, drawObject);

                // Обновим штриховку
                this.createDetailPaneLineHatch(type, parentSelector, drawObject);

                return;
             }

            parentEl.empty();

            this.createDetailPaneLine(type, parentSelector, drawObject);

            // Грид с примитивами
            var images = parentEl.find("div[name='images_grid_" + type + "']"),
                _that = this;

            if (images.length == 0 || !drawObject) {
                return;
            }

            var procent = parseInt(100 / 2),
                columns = [];

            columns.push({
                field: 'fill',
                caption: w2utils.lang('Fill color'),
                title: w2utils.lang('Fill color'),
                size: procent + '%',
                editable: {type: 'color'}
                ,
                render: function (record, index, column_index) {
                    return _that.renderGridColumns(this, record, this.columns[column_index].field);
                }
            });
            columns.push({
                field: 'fill-opacity',
                caption: w2utils.lang('Fill opacity'),
                title: w2utils.lang('Fill opacity') + ': 0 - 1',
                size: procent + '%',
                editable: {type: 'float', precision: 2, min: 0, max: 1}
                ,
                render: function (record, index, column_index) {
                    return _that.renderGridColumns(this, record, this.columns[column_index].field);
                }
            });

            // Грид
            images.w2grid({
                header  : w2utils.lang('Filling'),
                show : {
                    header : true
                },
                name: gridname,
                columns: columns,
                records: records
            });

            grid = w2ui[gridname];
            if (grid) {
                grid.type = 'fill';
                grid.objectImage = type;
                grid.drawObject = drawObject;
            }

            // Штриховка
            this.createDetailPaneLineHatch(type, parentSelector, drawObject);

        },

        /**
         * Запросить массив записей для грида
         * @param type
         * @param drawObject
         * @param hatch - признак штриховки
         */
        getRecordsGrid: function (type, drawObject, hatch) {
            if (!drawObject ||
                (drawObject instanceof GWTK.MapeditLegendDraw_Line == false &&
                 drawObject instanceof GWTK.MapeditLegendDraw_Polygon == false &&
                 drawObject instanceof GWTK.MapeditLegendDraw_Marker == false)) {
                return;
            }
            var records = [], drawParts;
            if (!hatch) {
                drawParts = (type == 'line') ? drawObject.options : drawObject.options.optionsLine.options;
                // Записи
                for (var i = 0; i < drawParts.length; i++) {
                    var record = {
                        'recid': i + 1,
                        'stroke': drawParts[i].options['stroke'],
                        'stroke-width': drawParts[i].options['stroke-width'],
                        'stroke-dasharray': drawParts[i].options['stroke-dasharray'],
                        'stroke-opacity': drawParts[i].options['stroke-opacity'],
                        'stroke-dashoffset': drawParts[i].options['stroke-dashoffset'],
                        'stroke-linecap': drawParts[i].options['stroke-linecap']
                    };
                    records.push(record);
                }
            }
            else {
                drawParts = (drawObject.options && drawObject.options.optionsHatch && drawObject.options.optionsHatch.options) ? drawObject.options.optionsHatch.options : null;
                if (drawParts) {
                    // Записи
                    for (var i = 0; i < drawParts.length; i++) {
                        var record = {
                            'recid': i + 1,
                            'stroke': drawParts[i].options['stroke'],
                            'stroke-width': drawParts[i].options['stroke-width'],
                            'stroke-step': drawParts[i].options['stroke-step'],
                            'stroke-angle': drawParts[i].options['stroke-angle'],
                            '_anglelist': drawParts[i].getAngleList()
                        };
                        records.push(record);
                    }
                }
            }
            return records;
        },


        /**
         * рендеринг колонки
         * @param grid - грид
         * @param record - запись,
         * @param nameIn - field исходной колонки
         * @returns {String}
         */
        renderGridColumns: function (grid, record, nameIn) {
            var html = '';
            if (!grid || !record || !nameIn) {
                return html;
            }
            // Найдем колонку с названием nameIn
            var column = grid.getColumn(nameIn);
            if (column) {
                html = '<div style="width:100%;"><input name="' + grid.name + nameIn + record.recid + '" style="width:100%;" title = "' + column.title + '"></div>';
                setTimeout(GWTK.Util.bind(function () {
                    this.setColumnValue(grid, record, nameIn);
                }, this), 50);
            }
            return html;
        },

        /**
         * Установка значения в колонке
         * @param grid
         * @param record
         * @param nameIn
         */
        setColumnValue: function (grid, record, nameIn) {
            if (!grid || !nameIn) {
                return;
            }

            if (!grid.drawObject) {
                return;
            }
            var el = $(grid.box).children().find("input[name='" + grid.name + nameIn + record.recid + "']"),
                _that = this,
                index = record.recid - 1;
            if (el.length > 0) {
                if (nameIn == 'stroke' || nameIn == 'fill') {
                    var val = grid.drawObject.get(grid.type, record.recid - 1, nameIn);
                    if (val != 'none') {
                        el.val(grid.drawObject.get(grid.type, record.recid - 1, nameIn).slice(1));
                    }
                    else {
                        el.val('');
                    }
                }
                else {
                    el.val(grid.drawObject.get(grid.type, record.recid - 1, nameIn));
                }

                switch (nameIn) {
                    case 'stroke':
                    case 'fill':
                        el.w2field('color');
                        el.change(function (event) {
                            grid.drawObject.set(grid.type, index, nameIn,
                                _that.changeValue(grid.drawObject.get(grid.type, index, nameIn), GWTK.MapeditLegendDrawUtil.getColor('#' + $(this).val())));
                            _that.refreshImage(grid);

                        })
                        break;

                    case 'stroke-dasharray':
                        el.w2field('text');
                        // if (!_that.isGraphic) {  // слой обыкновенной карты
                        //     el.mask('9 9', {placeholder:" "});
                        // }
                        // else {
                        //     el.mask('9 9 9 9', {placeholder:" "});
                        // }
                        el.mask('9 9', {placeholder:" "});
                        el.change(function (event) {
                            grid.drawObject.set(grid.type, index, nameIn,
                                _that.changeValue(grid.drawObject.get(grid.type, index, nameIn), $(this).val()));
                            _that.refreshImage(grid);
                        })
                        break;

                    case 'stroke-width':
                        el.w2field('float', {precision: 2, min: 1});
                        el.change(function (event) {
                            grid.drawObject.set(grid.type, index, nameIn,
                                _that.changeValue(grid.drawObject.get(grid.type, index, nameIn), $(this).val()));
                            _that.refreshImage(grid);
                        })
                        break;
                    case 'stroke-opacity':
                    case 'fill-opacity':
                        el.w2field('float', {precision: 2, min: 0, max: 1});
                        el.change(function (event) {
                            grid.drawObject.set(grid.type, index, nameIn,
                                _that.changeValue(grid.drawObject.get(grid.type, index, nameIn), $(this).val()));
                            _that.refreshImage(grid);
                        })
                        break;

                    case 'stroke-step':
                        el.w2field('int', {min: 1});
                        el.change(function (event) {
                            grid.drawObject.set(grid.type, index, nameIn,
                                _that.changeValue(grid.drawObject.get(grid.type, index, nameIn), $(this).val()));
                            _that.refreshImage(grid);
                        })
                        break;
                }
            }

        },

        /**
         * Обновить изображение
         * @param grid
         * @param record
         */
        refreshImage: function (grid) {
            if (grid && grid.objectImage && grid.drawObject) {
                this.paintExampleImageSvg("div[name='image_" + grid.objectImage + "']", grid.drawObject);

                if (this.options.fn_changeimage) {
                    this.options.fn_changeimage(this.options.type, grid.drawObject)
                }
            }
        },

        // Запросить тулбар для грида
        getToolBar: function(type){
            if (this.isGraphic || type == 'point') {
                return null;
            }
            var _that = this;
            return {
                items: [
                    {type: 'button',
                        id: 'w2ui-add',
                        // caption: w2utils.lang('Add New'),
                        icon: 'w2ui-icon-plus',
                        hint: w2utils.lang('Add new record')},
                    {
                        type: 'button',
                        id: 'w2ui-delete',
                        // caption: w2utils.lang('Delete'),
                        icon: 'w2ui-icon-cross',
                        hint: w2utils.lang('Delete selected records')
                    },
                    // {type: 'break', id: 'break1'},
                    {
                        type: 'button',
                        id: 'top',
                        caption: w2utils.lang('Top'),
                        icon: "icon-up",
                        hint: w2utils.lang('Top')
                    },
                    {
                        type: 'button',
                        id: 'down',
                        caption: w2utils.lang('Down'),
                        icon: "icon-down",
                        hint: w2utils.lang('Down')
                    }
                ],
                onClick: function (event) {
                    if (!this.grid) {
                        return;
                    }
                    var grid = this.grid;

                    var selected = this.grid.getSelection(true);
                    if ((!selected || selected.length == 0) && this.grid.records.length >= 1) {
                        selected = [0];
                    }
                    if ((event.target != 'w2ui-add' && this.grid.records.length <= 1 && this.grid.type != "hatch") || !this.grid.drawObject) {
                        return;
                    }
                    var records = this.grid.records,
                        newrecords = [],
                        selectednew = (this.grid.records[selected[0]]) ? this.grid.records[selected[0]].recid : '1';
                    switch (event.target) {
                        case 'w2ui-add':
                            var options = (grid.type == 'line') ?
                                           new GWTK.MapeditLegendDraw_SimpleLine() :
                                           new GWTK.MapeditLegendDraw_SimpleLineHatch();
                            if (selected.length > 0) {
                                options = (grid.type == 'line') ?
                                           new GWTK.MapeditLegendDraw_SimpleLine(this.grid.drawObject.getOptions(grid.type, grid.records[selected[0]].recid - 1)) :
                                           new GWTK.MapeditLegendDraw_SimpleLineHatch(this.grid.drawObject.getOptions(grid.type, grid.records[selected[0]].recid - 1));
                            }
                            grid.drawObject.add(grid.type, options);

                            this.grid.records = _that.getRecordsGrid(grid.objectImage, grid.drawObject, grid.type == 'hatch');
                            this.grid.refresh();
                            this.grid.select(this.grid.records[this.grid.records.length - 1].recid);
                            break;

                        case 'w2ui-delete':
                            // Если последний, то так и оставить
                            if (selected[0] == this.grid.records.length - 1) {
                                selectednew = 'last';
                            }
                            else {
                                selectednew = 'current';
                            }
                            this.grid.drawObject.remove(this.grid.type, selected[0]);
                            this.grid.records = _that.getRecordsGrid(grid.objectImage, grid.drawObject, grid.type == 'hatch');
                            this.grid.refresh();
                            if (selectednew == 'last') { // Если последний, то так и оставить
                                if (this.grid.records.length > 0) {
                                    selectednew = this.grid.records[this.grid.records.length - 1].recid;
                                }
                                else {
                                    selectednew = null;
                                }
                            }
                            else {
                                selectednew = this.grid.records[selected[0]].recid;
                            }
                            if (selectednew) {
                                this.grid.select(selectednew);
                            }
                            else {
                                _that.refreshImage(this.grid);
                            }
                            break;

                        case 'down': // Переместить вниз
                            if (selected.length > 0) {
                                selectednew = this.grid.drawObject.down(this.grid.type, selected[0]);
                                this.grid.records = _that.getRecordsGrid(grid.objectImage, grid.drawObject, grid.type == 'hatch');
                                this.grid.refresh();
                                this.grid.select(selectednew);
                            }
                            break;

                        case 'top':
                            if (selected.length > 0) {
                                selectednew = this.grid.drawObject.up(this.grid.type, selected[0]);
                                this.grid.records = _that.getRecordsGrid(grid.objectImage, grid.drawObject, grid.type == 'hatch');
                                this.grid.refresh();
                                this.grid.select(selectednew);
                            }
                            break;
                    }
                }
            }
        },

        /**
         * Разметка панели параметров draw объекта
         */
        getHtmlPanel: function (type) {
            // Высота грида с несколькими строками
           var height = (this.isGraphic || type =='point') ? '90px' : '160px',

               line = (type == 'line' || type == 'polygon' || type == 'point') ?
                    '<div  name="images_line" class="divFlex" style="width:100%; flex-direction: column; min-height:' + height + ';">' +
                    '<div  name="images_grid_line" class="divFlex" style="width:100%; height:100%; overflow-y:auto;"></div>' +
                    '</div>' : '',

               // Заливка
               polygon = (type == 'point' || type == 'polygon') ? '<div  name="images_grid_' + type + '" class="divFlex" style="width:100%; min-height: 90px; margin-bottom: 3px;"></div>' : '',

               // Штриховка
               hatch = (type == 'polygon' && !this.isGraphic) ?
                    '<div  name="images_grid_hatch" class="divFlex" style="width:100%; min-height:' + height + '; margin-bottom: 3px;"></div>' : '',

               // Маркер
               marker = (type == 'point') ? '<div  name="images_list_' + type + '" class="divFlex" style="width:100%; height: 100%;"></div>' : '',

               html =
                '<div class="divFlex" style="width:100%; height: 98%; margin-top:3px; flex-direction: row; justify-content: space-between;">' +
                '<div name="images" class="divFlex" style="width:100%; height: 100%; flex-direction: column; ">' +
                    line +
                    polygon +
                    hatch +
                    marker +
                '</div>';
            return html;
        }
    };
    GWTK.Util.inherits(GWTK.MapeditLegendDrawControl_LinePolygon, GWTK.MapeditLegendDrawControl_Base);


    /**
     *  класс отображения типов графических объектов title
     * @param map
     * @param layer
     * @param parentSelector
     * @param options {
     *     fn_changeimage : - функция смены вида объекта
     *     fn_selectcode : - функция выделения объекта
     *     }
     * @constructor
     */

    GWTK.MapeditLegendDrawControl_Title = function (map, layer, parentSelector, options) {

        // родительский конструктор
        GWTK.MapeditLegendDrawControl_Base.call(this, map, layer, parentSelector, options);

        this.toolname = 'legendrawcontrol';

        if (!this.options.type){
            this.options.type = 'title';
        }

        this.panelId = this.toolname + GWTK.Util.randomInt(150, 200) + this.options.type;

        this.textId = this.panelId + '_text';

        // событие на изменение текста подписи
        this.onChangeGeometry = GWTK.Util.bind(this.onChangeGeometry, this);

        // Настроим слой
        this.changeLayer(layer);

        this.error = false;
    };

    GWTK.MapeditLegendDrawControl_Title.prototype = {

        createDetailPane: function(type, drawObject){

            if (!type) {
                return;
            }
            if (drawObject) {
                this.options.settings.drawObject = drawObject.clone();
            }

            this.createDetailPaneTitle('#' + this.panelId + this.imagesparam, drawObject);

            // Установим значение слоя классификатора
            this.selectClasifierLayer(drawObject);

        },


        destroy: function(){
            // событие на изменение текста подписи
            $(this.map.eventPane).off('changegeometry', this.onChangeGeometry);

            // Удалить гридки
            var w2uiEl = w2ui[this.options.type + 'images_grid'];
            if (w2uiEl) {
                w2uiEl.destroy();
            }
            this.parent.empty();
        },

        refresh: function(){
            var w2uiEl = w2ui[this.options.type + 'images_grid'];
            if (w2uiEl) {
                w2uiEl.refresh();
            }
        },

        /**
         * Событие на изменение текста метрики
         * @param event
         */
        onChangeGeometry: function(event){
            if (event && event.action == "changetext" && event.datapoint) {
                if (GWTK.DomUtil.isActiveElement(this.parent)) {
                    if (this.options.settings.drawObject.text != event.datapoint.newvalue) {
                      //  var el = $('#' + this.textId);
                       // if (el.val() != event.datapoint.newvalue) {
                            $('#' + this.textId).val(this.changeTitle(this.options.settings.drawObject, event.datapoint.newvalue));
                       // }
                    }
                }
            }
        },

        /**
         * Панель параметров подписи
         * @param parentSelector
         * @param drawObject
         */
        createDetailPaneTitle: function (parentSelector, drawObject) {
            // событие на изменение текста подписи
            $(this.map.eventPane).off('changegeometry', this.onChangeGeometry);

            // событие на изменение текста подписи
            $(this.map.eventPane).on('changegeometry', this.onChangeGeometry);

            if (!drawObject) {
                drawObject = new GWTK.MapeditLegendDraw_Title();
            }

            var parentEl = $(parentSelector),
                type = this.options.type;

            if (parentEl.length == 0) {
                return;
            }

            var records = [];
            drawObject.dictionary = drawObject.saveDictionary(this.layer);
            for (var i = 0; i < drawObject.dictionary.length; i++) {
                records.push({
                    'recid': i + 1,
                    'name': drawObject.dictionary[i].caption,
                    'value': drawObject.dictionary[i].value,
                    '_object': drawObject.dictionary[i]
                });
            };

            var gridname = type + 'images_grid',
                grid = w2ui[gridname],
                $text = $('#' + this.textId);

            if (grid) {
                grid.records = records;
                grid.drawObject = drawObject;
                grid.refresh();
                $text.val(drawObject.text);
                return;
            }

            parentEl.empty();

            parentEl.append('<div class = "divFlex" style="width:100%; margin: 1px;">' +
                '<input id="' + this.textId + '" type="text" style="width:100% !important;"/>' +
                '</div>' +
                '<div class="divFlex" style="width:100%; height: 98%; margin-top:3px; flex-direction: row; justify-content: space-between;">' +
                '<div name="images" class="divFlex" style="width:100%; height: 100%; flex-direction: column; ">' +
                '<div  name="images_grid_' + type + '" class="divFlex" style="width:100%; height: 100%;"></div>' +
                '</div>');

            // Грид с примитивами
            var images = parentEl.find("div[name='images_grid_" + type + "']"),
                _that = this;

            if (images.length == 0 || !drawObject) {
                return;
            }

            var procent = parseInt(100 / 2),
                columns = [
                    {
                        field: 'name',
                        caption: w2utils.lang('Name'),
                        size: procent + '%'
                    },
                    {
                        field: 'value',
                        caption: w2utils.lang('Value'),
                        size: procent + '%'
                        , render: function (record, index, col_index) {
                            // console.log(record);
                            var html = _that.createFormatForGrid(record._object),
                                grid = this;
                            setTimeout(function () {
                                _that.setFieldDataForGrid(record._object, grid);
                            }, 100);

                            return html || '';
                        }

                    }
                ];

            // Грид
            images.w2grid({
                name: gridname,
                columns: columns,
                records: records,
                drawObject: drawObject
            });

            // Инициализация поля ввода текста
            $text = $('#' +  this.textId);

            $text.w2field('text');
            $text.val(drawObject.text);
            $text.on('input', GWTK.Util.bind(function(event) {
               this.changeTitle(drawObject, event.target.value);
            }, this));

        },

        /**
         * Смена полписи
         * @param value
         */
        changeTitle: function(drawObject, value){
            if (drawObject) {
                drawObject.text = this.changeValue(drawObject.text, value);
                this.paintExampleImageSvg("div[name='image_title']", drawObject);

                // Отошлем триггер на помещение подписи в геометрию
                this.triggerGeometry(drawObject);

                if (this.options.fn_changeimage) {
                    this.options.fn_changeimage(this.options.type, drawObject);
                }
                return drawObject.text;
            }
        },

        /**
         * Tриггер на помещение подписи в геометрию
         * @param dataobject
         */
        triggerGeometry: function(drawObject){
            if (GWTK.DomUtil.isActiveElement(this.parent) && drawObject) {
                GWTK.mapeditorTaskExtended.prototype.triggerGeometry({
                        "map": this.map,
                        "layer": this.layer,
                        "text": drawObject.text
                    });
            }
        },

        // Создание шаблона для поля
        createFormatForGrid: function (_object) {
            var format = '';
            if (!_object) {
                return format;
            }
            format =
                '<div style="width:100%;">';

            if (_object.options && _object.options.params && _object.options.params.length > 0) {
                format += '<div style="width:100%;" name="' + this.panelId + _object.name + '">';

                if (_object.options.type) {
                    format += '<input type="checkbox" style="width:100%;" name="' + this.panelId + _object.name + '_0"/>';
                }
                format += '<div style="width:100%;" name="' + this.panelId + _object.name + '_0">';
                for (var i = 0; i < _object.options.params.length; i++) {
                    // format += '<input style="width:' + procent + '%;" name="'  + this.panelId + _object.options.params[i].name + '"/>';
                    format += '<div><input style="width:100%;" title="' + _object.options.params[i].caption + '" name="' + this.panelId + _object.options.params[i].name + '"/></div>';
                }
                format += '</div>'
                format += '</div>';
            }
            else {
                format += '<input style="width:100%;" title="' + _object.caption + '" name="' + this.panelId + _object.name + '"/>';
            }

            format += '</div>';

            return format;
        },


        // Уствновка шаблона ввода данных для поля + значение
        setFieldDataForGrid: function (_object, grid) {

            var record = this.fieldValue(_object),
                _that = this, $field_div,
                type = (_object.options && _object.options.type) ? _object.options.type : '',
                complex = (type == 'checkbox' && _object.options && _object.options.params && _object.options.params.length > 0) ? true : false,
                $field = (!complex) ? $("input[name='" + this.panelId + _object.name + "']") :
                    $("div[name='" + this.panelId + _object.name + "']");

            // Изменения значения поля
            onFieldChange = function (event) {
                if (event.data) {
                    _that.dataChange($(event.target), event.data._object, event.data.drawobject);
                }
            }
            // Изменения значения поля
            onCheckChange = function (event) {
                if (event.data) {
                    _that.setCheckedForGrid($(this), event.data.field_div, event.data._object, event.data.drawobject);
                }
            }

            var options = {};
            if (type != 'list') {
                if (!complex) { // Простой ввод

                    if (_object.options.min != undefined) {
                        options.min = _object.options.min;
                    }
                    if (_object.options.max != undefined) {
                        options.max = _object.options.max;
                    }
                    if (_object.options.precision != undefined) {
                        options.precision = _object.options.precision;
                    }

                    $field.val(record);
                    $field.w2field(type, options);//, form.options);

                    $field.off('change', onFieldChange);
                    $field.on('change', {
                        _object: _object, drawobject: (grid) ? grid.drawObject : null
                    }, onFieldChange);
                }
                else {         // сложный ввод

                    // Оcновная чекалка
                    $field = $("input[name='" + this.panelId + _object.name + "_0']");
                    $field_div = $("div[name='" + this.panelId + _object.name + "_0']");
                    if (record) {
                        $field.prop('checked', true);
                    }
                    else {
                        $field.prop('checked', false);
                    }
                    // this.setCheckedForGrid($field, $field_div, _object, (grid) ? grid.drawObject : null);
                    this.setCheckedForGrid($field, $field_div);
                    $field.on('click', {
                        _object: _object,
                        field_div: $field_div,
                        drawobject: (grid) ? grid.drawObject : null
                    }, onCheckChange);

                    // Дополнитедьные параметры
                    var param;
                    for (var i = 0; i < _object.options.params.length; i++) {
                        param = _object.options.params[i];
                        options = {};
                        $field = $("input[name='" + this.panelId + param.name + "']");
                        record = this.fieldValue(param);
                        if (param.options.type) {
                            if (param.options.type != 'list') {
                                if (param.options.min != undefined) {
                                    options.min = param.options.min;
                                }
                                if (param.options.max != undefined) {
                                    options.max = param.options.max;
                                }
                                if (param.options.precision != undefined) {
                                    options.precision = param.options.precision;
                                }

                                $field.val(record);
                                $field.w2field(param.options.type, options);//, form.options);

                                $field.off('change', onFieldChange);
                                $field.on('change', {
                                    _object: param,
                                    drawobject: (grid) ? grid.drawObject : null
                                }, onFieldChange);
                            }
                            else {
                                if (param.options.items) {
                                    options.selected = record;
                                    options.focus = -1;
                                    options.items = param.options.items;
                                    $field.w2field(param.options.type, options);
                                    $field.off('change', onFieldChange);
                                    $field.on('change', {
                                        _object: param,
                                        drawobject: (grid) ? grid.drawObject : null
                                    }, onFieldChange);
                                }
                            }
                        }

                    }
                }
            }
            else {
                if (_object.options.items) {
                    options.selected = record;
                    options.focus = -1;
                    options.items = _object.options.items;
                    $field.w2field(type, options);
                    $field.off('change', onFieldChange);
                    $field.on('change', {_object: _object, drawobject: (grid) ? grid.drawObject : null}, onFieldChange);
                }

            }
        },

        //Заполнение поля формирование записи record для this._obj
        fieldValue: function (_object) {
            var record = null;

            if (_object['value'] != 'undefined' && _object.options && _object.options.type) {
                switch (_object.options.type) {
                    case 'int':
                        // var dec = (parseInt(_object['decimal']) >= 0 ? parseInt(rscsemantic['decimal']) : 2);
                        // if (dec == 0)
                        record = parseInt(_object['value']);
                        break;
                    case 'float':
                        if (!_object.options.precision) {
                            record = parseInt(_object['value']);
                        }
                        else {
                            record = Math.round(parseFloat(_object['value'].toString().replace(",", ".")) * Math.pow(10, _object.options.precision))
                                / Math.pow(10, _object.options.precision);

                        }
                        break;
                    case 'color': //Цветовая палитра
                        if (_object['value'] != 'none') {
                            record = _object['value'].slice(1); // Убрать # из значения цвета
                        }
                        else {
                            record = '';
                        }
                        break;

                    case 'checkbox':
                        record = _object['value'];
                        break;

                    case 'list': //Редактирование значения списка
                        var index = -1,
                            items = _object.options.items;
                        if (items && items.length > 0) {
                            for (var j = 0; j < items.length; j++) {
                                if (items[j].id == _object['value']) {
                                    index = j;
                                    break;
                                }
                            }
                        }
                        if (index < 0) {
                            index = 0;
                        }
                        record = items[index];
                        break;
                }
            }
            return record;
        },

        // Смена значений в списке
        dataChange: function (field, _object, drawObject) {

            if (_object && _object.options) {
                switch (_object.options.type) {
                    case 'list':
                        _object.value = this.changeValue(_object.value, field.data('selected').id);
                        break;
                    case 'color':
                        _object.value = this.changeValue(_object.value, '#' + field.val());
                        break;
                    case 'checkbox':
                        _object.value = this.changeValue(_object.value, (field.is(':checked')) ? 1 : 0);
                        break;

                    default:
                        _object.value = this.changeValue(_object.value, field.val());
                        break;
                }
            }

            // Отрисовать подпись
            if (drawObject && drawObject.dictionary) {
                var updateadd = drawObject.loadOneRecordDictionary(_object);
                // Если есть дополнительное обновление
                if (updateadd) {
                    if (drawObject.options){
                        $field = $("input[name='" + this.panelId + updateadd + "_0']");
                        switch(updateadd){
                            case 'text-shadow':
                                if (drawObject.options.optionsFont[updateadd]) {
                                    $field.click();
                                }
                                break;
                            case 'stroke':
                                if (drawObject.options.optionsSimple[updateadd]) {
                                    $field.click();
                                    $("input[name='" + this.panelId + "stroke-width']").val(0);
                                }
                                break;
                        }
                    }
                }
                // // Если изменили цвет, то автоматом меняем контур
                // if (_object['name'] == 'fill') {
                //     var $field_stroke = $("input[name='" + this.panelId + 'stroke' + "']");
                //     $field_stroke.val(drawObject.options.optionsSimple['stroke'].slice(1));
                //     $field_stroke.w2field('color');
                // }

                this.paintExampleImageSvg("div[name='image_title']", drawObject);

                if (this.isChange()) {
                    if (this.options.fn_changeimage) {
                        this.options.fn_changeimage(this.options.type, drawObject)
                    }
                }

            }

        },

        /**
         * Выставить чек бокс и доступность параметров для сборных сложных типов
         * @param value
         */
        setCheckedForGrid: function (field, field_div, _object, drawObject) {
            var value = field.is(':checked');
            if (_object) {
                this.dataChange(field, _object, drawObject);
            }
            // Окно с детализированной информацией
            if (field_div) {
                if (value) {
                    field_div.removeClass('disabledbutton');
                }
                else {
                    field_div.addClass('disabledbutton');
                }
            }

        }

    };
    GWTK.Util.inherits(GWTK.MapeditLegendDrawControl_Title, GWTK.MapeditLegendDrawControl_Base);


    /**
     *  класс отображения типов графических объектов marker
     * @param map
     * @param layer
     * @param parentSelector
     * @param options {
     *     fn_changeimage : - функция смены вида объекта
     *     fn_selectcode : - функция выделения объекта
     *     }
     * @constructor
     */

    GWTK.MapeditLegendDrawControl_Marker = function (map, layer, parentSelector, options) {

        // родительский конструктор
        GWTK.MapeditLegendDrawControl_LinePolygon.call(this, map, layer, parentSelector, options);
        this.options.type = 'point';

        this.panelId = this.toolname + GWTK.Util.randomInt(150, 200) + this.options.type;

        // Настроим слой
        this.changeLayer(layer);

        this.error = false;

    };
    GWTK.MapeditLegendDrawControl_Marker.prototype = {
        /**
         * Панель параметров полигона
         * @param parentSelector
         * @param drawObject
         */
        createDetailPaneMarker: function (parentSelector, drawObject) {

            if (!drawObject) {
                drawObject = new GWTK.MapeditLegendDraw_Marker();
            }

            var parentEl = $(parentSelector),
                type = 'point';
            if (parentEl.length == 0) {
                return;
            }

            var selectItem = drawObject.findMarkerDefault(drawObject.options.optionsMarker['path']);
            var el = $('#' + this.panelId + 'point');
            if (el.length > 0) {
                el.data('selected', selectItem).data('w2field').refresh();
                this.createDetailPanePolygon(type, parentSelector, drawObject);
               return;
            }

            parentEl.empty();

            // Описание линейных параметров
            this.createDetailPanePolygon(type, parentSelector, drawObject);

            // Типы маркеров
            var images = parentEl.find("div[name='images_list_" + type + "']");

            if (images.length == 0 || !drawObject) {
                return;
            }

            images.empty();
            images.append(
                '<div style="width:100%; margin: 3px;">' +
                    '<div class="w2ui-field w2ui-span3" >' +
                        '<label style = "text-align:left !important; width: 100px; margin-top: 3px;">' +
                            w2utils.lang("Marker") +
                        '</label>' +
                    '</div>' +
                    '<input type="list" id="' + this.panelId + 'point' + '" style="width:70% !important;"/>' +
                '</div>');

            // Найти текущий
            el =  $('#' + this.panelId + 'point');
            el.w2field('list',
                {items: drawObject.defaultMarkers , selected: selectItem});

            el.change(GWTK.Util.bind(function (event) {
                var obj = el.data('selected');
                if (obj) {
                    drawObject.set('path', 0, 'path', this.changeValue(drawObject.get('path', 0, 'path'),
                                    drawObject.defaultMarkers[obj.id].value));
                    this.paintExampleImageSvg("div[name='image_point']", drawObject);

                    if (this.options.fn_changeimage) {
                        this.options.fn_changeimage(this.options.type, drawObject)
                    }

                }
            }, this));

        }


    };
    GWTK.Util.inherits(GWTK.MapeditLegendDrawControl_Marker, GWTK.MapeditLegendDrawControl_LinePolygon);



        /**
     *  класс объекта Простая Линия
     * @param options { // Параметры линии
     *       // Общие
     *       'stroke': '#000000',        // цвет
     *       'stroke-width': 1,          // толщина
     *       'stroke-dasharray': '',     // пунктир
     *       // Только для svg графики
     *       'stroke-opacity': 1,       // прозраность
     *       'stroke-dashoffset': 0,    // смещение
     *       'stroke-linecap': ''       // скругление углов
     * @constructor
     */

    GWTK.MapeditLegendDraw_SimpleLine = function (options) {

        this.type = 'simpleline';
        this.options = JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsSimpleLine));
        if (options) {
            $.extend(this.options, options);
        }
    };

    GWTK.MapeditLegendDraw_SimpleLine.prototype = {

        /**
         * Получение стилей для линии
         * @param image
         * @returns {string}
         */
        getStyle: function (options) {
            var style = '';

            if (!options) {
                return style;
            }

            if (options.stroke) {
                style += 'stroke:' + options.stroke + ';';
            }
            if (options['stroke-width']) {
                style += 'stroke-width:' + options['stroke-width'] + ';';
            }
            if (options['stroke-dasharray']) {
                style += 'stroke-dasharray:' + options['stroke-dasharray'] + ';';
            }
            if (options['stroke-opacity']) {
                style += 'stroke-opacity:' + options['stroke-opacity'] + ';';
            }
            if (options['stroke-dashoffset']) {
                style += 'stroke-dashoffset:' + options['stroke-dashoffset'] + ';';
            }
            if (options['stroke-linecap']) {
                style += 'stroke-linecap:' + options['stroke-linecap'] + ';';
            }

            return style;
        },

        /**
         * Пример изображения в svg
         * @param w
         * @param h
         * @param options
         * @returns {string}
         */
        getExampleImageSvg: function (w, h, options, defsid) {
            w = (w) ? w : 50;
            h = (h) ? h : 30;
            options = (options) ? options : this.options;

            var style = this.getStyle(options);
            if (style) {
                style = 'style="' + style + '"';
            }
            return '<line x1="' + w + '" y1="0" x2="0" y2="' + h + '" ' + style + ' />';
        },

        clone: function () {
            return new GWTK.MapeditLegendDraw_SimpleLine(this.options);
        },

        /**
         * Запросить значеие
         * @param val
         */
        get: function (key) {
            if (!key) {
                return;
            }
            return this.options[key];
        },

        /**
         * Установить значеие
         * @param index
         * @param key
         * @param val
         */
        set: function (key, val) {
            if (!key) {
                return;
            }
            this.options[key] = val;
        },

        /**
         * Сохранение параметров объетка в JSON
         */
        saveJSON: function () {
            return {
                type: this.type,
                options: JSON.parse(JSON.stringify(this.options))
            };
        },

        /**
         * Создать объект параметров из объекта стиля
         * @param style
         */
        setOptionsFromStyle: function (style) {
            var options = {
                type: 'simpleline',
                options: JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsSimpleLine))
            }
            if (style) {
                options.options = {
                    'stroke': (style['stroke']) ? style['stroke'] : options.options['stroke'],      // цвет
                    'stroke-width': (style['stroke-width']) ? style['stroke-width'] : options.options['stroke-width'],          // толщина
                    'stroke-dasharray': (style['stroke-dasharray']) ? style['stroke-dasharray'] : options.options['stroke-dasharray'],     // пунктир
                    // Только графика
                    'stroke-opacity': (style['stroke-opacity']) ? style['stroke-opacity'] : options.options['stroke-opacity'],       // прозраность
                    'stroke-dashoffset': (style['stroke-dashoffset']) ? style['stroke-dashoffset'] : options.options['stroke-dashoffset'],    // смещение
                    'stroke-linecap': (style['stroke-linecap']) ? style['stroke-linecap'] : options.options['stroke-linecap']        // скругление углов
                };
            }
            return options;
        },

        /**
         * Запросить css параметры
         * @param options
         * @returns {string}
         */
        getCssParametersSLD: function(options){
            var strFromOptions = '';
            if (!options) {
                return strFromOptions;
            }
            for (var key in options) {
                if (options[key]) {
                    strFromOptions += '<CssParameter name="' + key + '">' + options[key] + '</CssParameter>';
                }
            }
            return strFromOptions;
        },

        /**
         * Запросить стиль <Stroke>
         * @param options
         * @returns {*}
         */
        getStrokeSLD: function(options) {
            var str_result = '';
            if (!options || (options.type != 'simpleline' && options.type != 'simplelinehatch') || !options.options) {
                return str_result;
            }
            var strFromOptions = GWTK.MapeditLegendDraw_SimpleLine.prototype.getCssParametersSLD(options.options);
            str_result = (strFromOptions) ?
                '<Stroke>' +
                    strFromOptions +
                '</Stroke>' :
                '';

            return str_result;
        },

        /**
         * Сохранить в SLD формат
         * @param options = {
         *       'type': 'simpleline',
         *       'options' : {
         *           'stroke': GWTK.GRAPHIC.colorDefault,   // цвет
         *           'stroke-width': 1,          // толщина
         *           'stroke-dasharray': '',     // пунктир
         *           'stroke-opacity': 1,       // прозраность
         *           'stroke-dashoffset': 0,    // смещение
         *           'stroke-linecap': ''       // скругление углов
         *      }
         *   }
         * @returns {string}
         */
        saveSLD: function(options) {
            var strStrokeSLD = GWTK.MapeditLegendDraw_SimpleLine.prototype.getStrokeSLD(options);

            var str_result = (strStrokeSLD) ?
                '<LineSymbolizer>' +
                         strStrokeSLD +
                '</LineSymbolizer>'// +
                : '';

            return str_result;
        }

    };


    /**
     *   TODO: НЕ РЕАЛИЗОВАНО !!!
     *  класс объекта Простая Линейная штриховка
     * @param options { // Параметры штриховки
     *       'stroke': '#000000',
     *       'stroke-width': 1,
     *       'rotate': 0
     *      }
     * @constructor
     */

    GWTK.MapeditLegendDraw_SimpleLineHatch = function (options) {

        this.type = 'simplelinehatch';
        this.options = JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsSimpleLineHatch));

        if (options) {
            $.extend(this.options, options);
        }
    };

    GWTK.MapeditLegendDraw_SimpleLineHatch.prototype = {

        /**
         * Получение стилей для линии
         * @param image
         * @returns {string}
         */
        getStyle: function (options) {
            var style = '';

            if (!options) {
                return style;
            }

            if (options.stroke) {
                style += 'stroke:' + options.stroke + ';';
            }
            if (options['stroke-width']) {
                style += 'stroke-width:' + options['stroke-width'] + ';';
            }

            return style;
        },

        /**
         * Получение стилей для линии
         * @param image
         * @returns {string}
         */
         // Запрос углов для штрихоаки
        getAngleList: function(){
            return [
                {
                    'id': '0',
                    'text': '0'
                }
                , {
                    'id': '45',
                    'text': '45'
                }
                , {
                    'id': '90',
                    'text': '90'
                }
                , {
                    'id': '135',
                    'text': '135'
                }
            ]
        },

        getExampleHatchPatternSvg: function(patternId, options, name){
            options = (options) ? options : this.options;

            var style = this.getStyle(options);
            if (style) {
                style = 'style="' + style + '"';
            }

            var step = parseFloat(this.options['stroke-step']),
                angle = (this.options['stroke-angle'] == '45') ? '135' :
                ((this.options['stroke-angle'] == '135') ? '45' : this.options['stroke-angle']),
                name = (name) ? ' name="' + name + '" ' : '',
                res =
                    '<pattern ' + name + ' id="' + patternId +'" width="' + step + 'px" height="' + step + 'px" ' +
                    ' patternTransform="rotate(' + angle + ' 0 0)"' +
                    ' patternUnits="userSpaceOnUse" ' +
                    '>' +
                    '<line x1="0" y1="' + 0 + '" x2="' + step + '" y2="' + 0 + '" ' + style + '/>' +
                    '</pattern>';

            return res;
        },

        clone: function () {
            return new GWTK.MapeditLegendDraw_SimpleLineHatch(this.options);
        },

        /**
         * Сохранение параметров объекта в JSON
         */
        saveJSON: function () {
            return {
                type: this.type,
                options: JSON.parse(JSON.stringify(this.options))
            };
        },

        /**
         * Создать объект параметров из объекта стиля
         * @param style
         */
        setOptionsFromStyle: function (style) {
            var options = {
                type: 'simplelinehatch',
                options: JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsSimpleLineHatch))
            };

            if (style) {
                options.options = {
                    'stroke': (style['stroke']) ? style['stroke'] : options.options['stroke'],
                    'stroke-width': (style['stroke-width']) ? style['stroke-width'] : options.options['stroke-width'],
                    'stroke-angle': (style['stroke-angle']) ? style['stroke-angle'] : options.options['stroke-angle'],
                    'stroke-step': (style['stroke-step']) ? style['stroke-step'] : options.options['stroke-step']
                }
            }
            return options;
        }

    };
    GWTK.Util.inherits(GWTK.MapeditLegendDraw_SimpleLineHatch, GWTK.MapeditLegendDraw_SimpleLine);


    /**
     *  класс объекта Линия
     * @param options - массив объектов GWTK.MapeditLegendDraw_SimpleLine
     * @constructor
     */

    GWTK.MapeditLegendDraw_Line = function (options, classifierLayer) {

        this.type = 'line';
        this.classifierLayer = (classifierLayer) ? classifierLayer : '';
        this.options = [];
        if (options && options.length > 0) {
            for (var i = 0; i < options.length; i++) {
                this.options.push(options[i]);
            }
        }
        if (this.options.length == 0)
            this.options.push(new GWTK.MapeditLegendDraw_SimpleLine());
    };

    GWTK.MapeditLegendDraw_Line.prototype = {

        /**
         * Пример изображения в svg
         * @param w
         * @param h
         * @param options
         * @returns {string}
         */
        getExampleImageSvg: function (w, h, options, defsid) {
            w = (w) ? w : 50;
            h = (h) ? h : 30;
            options = (options) ? options : this.options;

            var imageSvg = '';
            for (var i = 0; i < options.length; i++) {
                if (options[i] instanceof GWTK.MapeditLegendDraw_SimpleLine) {
                    imageSvg += options[i].getExampleImageSvg(w, h);
                }
            }
            return imageSvg;
        },

        /**
         * Запросить значеие
         * @param index
         * @param key
         * @param val
         */
        get: function (type, index, key) {
            if (!key) {
                return;
            }
            if (index < 0 || index > this.options.length - 1) {
                index = 0;
            }
            return this.options[index].get(key);
        },

        /**
         * Установить значеие
         * @param index
         * @param key
         * @param val
         */
        set: function (type, index, key, val) {
            if (!key) {
                return;
            }
            if (index < 0) {
                index = 0;
            }
            if (index > this.options.length - 1) {
                switch(type) {
                    case 'line':
                        this.options.push(new GWTK.MapeditLegendDraw_SimpleLine());
                        break;
                    case 'hatch':
                        this.options.push(new GWTK.MapeditLegendDraw_SimpleLineHatch());
                        break;
                }
                index = this.options.length - 1;
            }

            this.options[index].set(key, val);
        },

        getOptions: function (type, index) {
            if (index < 0 || index > this.options.length - 1) {
                index = 0;
            }
            return this.options[index].options;
        },

        /**
         * Добывить объект простой линии
         * @param type
         * @param options
         */
        add: function (type, options) {
            switch(type) {
                case 'line':
                    if (options instanceof GWTK.MapeditLegendDraw_SimpleLine) {
                        this.options.push(options);
                    }
                    else {
                        this.options.push(new GWTK.MapeditLegendDraw_SimpleLine());
                    }
                    break;
                case 'hatch':
                    if (options instanceof GWTK.MapeditLegendDraw_SimpleLineHatch) {
                        this.options.push(options);
                    }
                    else {
                        this.options.push(new GWTK.MapeditLegendDraw_SimpleLineHatch());
                    }
                    break;
            }

        },

        /**
         * Удалить примитив
         * @param type
         * @param index
         */
        remove: function (type, index) {
            if (index <= 0) {
                this.options.shift();
            }
            else {
                if (index >= this.options.length - 1) {
                    this.options.pop();
                }
                else {
                    this.options.splice(index, 1);
                }
            }
        },

        /**
         * переместить примитив вниз
         * @param type
         * @param index
         */
        down: function (type, index) {
            var newrecords = [],
                selectednew = 0,
                records = this.options;

            // Если индекс меньше длины массива
            if (index < records.length - 1) {
                for (var i = 0; i < records.length; i++) {
                    if (i < index) {
                        newrecords.push(records[i]);
                    }
                    else {
                        if (i == index) {
                            newrecords.push(records[i + 1]);
                            newrecords.push(records[i]);
                            selectednew = newrecords.length;
                            for (var j = i + 2; j < records.length; j++) {
                                newrecords.push(records[j]);
                            }
                            break;
                        }
                    }
                }
                this.options = newrecords;
                return selectednew;
            }
        },

        /**
         * переместить примитив вверх
         * @param type
         * @param index
         */
        up: function (type, index) {
            var newrecords = [],
                selectednew = 0,
                records = this.options;

            // Если индекс меньше длины массива
            if (index > 0) {
                for (var i = 0; i < records.length; i++) {
                    if (i < index - 1) {
                        newrecords.push(records[i]);
                    }
                    else {
                        if (i == index - 1) {
                            newrecords.push(records[index]);
                            selectednew = newrecords.length;
                            newrecords.push(records[i]);
                            for (var j = i + 2; j < records.length; j++) {
                                newrecords.push(records[j]);
                            }
                            break;
                        }
                    }
                }

                this.options = newrecords;
                return selectednew;
            }

        },

        /**
         * Сохранение параметров объетка в JSON
         */
        saveJSON: function () {
            var objectTemplate = {
                type: this.type,
                classifierLayer: this.classifierLayer,
                options: []
            }
            for (var i = 0; i < this.options.length; i++) {
                objectTemplate.options.push(
                    this.options[i].saveJSON()
                );
            }

            return objectTemplate;
        },

        /**
         * Загрузка параметров из JSON
         */
        loadJSON: function (options) {
            if (options && options.type == this.type && options.options.length > 0) {
                this.options = [];
                for (var i = 0; i < options.options.length; i++) {
                    var newobj = null;
                    switch(options.options[i].type) {
                        case 'simpleline':
                            newobj = new GWTK.MapeditLegendDraw_SimpleLine(options.options[i].options);
                            break;
                        case 'simplelinehatch':
                            newobj = new GWTK.MapeditLegendDraw_SimpleLineHatch(options.options[i].options)
                            break;
                    }
                    if (newobj) {
                        this.options.push(newobj);
                    }
                }
            }
            this.classifierLayer = (options.classifierLayer) ? options.classifierLayer : '';
        },

        clone: function () {
            return new GWTK.MapeditLegendDraw_Line(this.options, this.classifierLayer);
        },

        /**
         * Запросить стиль в виде объекта JSON
         * @returns {*}
         */
        setStyleObject: function (jsonObject) {
            if (!jsonObject) {
                jsonObject = this.saveJSON();
            }
            if (jsonObject.options && jsonObject.options.length > 0) {
                if (jsonObject.options[0].type == 'simpleline') {
                    return jsonObject.options[0].options;
                }
            }
            return {};
        },


        /**
         * Создать объект параметров из объекта стиля
         * @param style
         */
        setOptionsFromStyle: function (style) {
            var options = {
                type: 'line',
                options:
                    [
                        GWTK.MapeditLegendDraw_SimpleLine.prototype.setOptionsFromStyle()
                    ]
            }

            if (style) {
                options.options = []
                if (style.style){
                    // options.options.push(GWTK.MapeditLegendDraw_SimpleLine.prototype.setOptionsFromStyle(style))
                    options.options.push(GWTK.MapeditLegendDraw_SimpleLine.prototype.setOptionsFromStyle(style.style))
                }
                else {
                    if (style.styleLine && style.styleLine.length){
                        for (var i = 0; i < style.styleLine.length; i++) {
                            options.options.push(GWTK.MapeditLegendDraw_SimpleLine.prototype.setOptionsFromStyle(style.styleLine[i]))
                        }
                    }
                }
            }

            return options;
        },

        /**
         * Запросить стиль для Svg в виде строки css
         * например "stroke:#00FFFE;stroke-width:11.00;stroke-dasharray:;stroke-opacity:1;stroke-dashoffset:0;stroke-linecap:;fill:#F6B26B;fill-opacity:1"
         * @returns {*}
         */
        getStyle_StringForSVG: function (jsonObject) {

            var styleline = '';
            if (!jsonObject) {
                jsonObject = this.saveJSON();
            }
            if (jsonObject.options && jsonObject.options.length > 0) {
                if (jsonObject.options[0].type == 'simpleline') {
                    styleline = JSON.stringify(jsonObject.options[0].options).replace(/{|}|\"/g, '');
                    styleline = styleline.replace(/,/g, ';');
                    return styleline;
                }
            }
            return styleline;
        },

        /**
         * Сохранить в SLD формат
         * @param options = {
         *      'type': 'line'
         *      'options = [
         *      {
         *       'type': 'simpleline',
         *       'options' : {
         *           'stroke': GWTK.GRAPHIC.colorDefault,   // цвет
         *           'stroke-width': 1,          // толщина
         *           'stroke-dasharray': '',     // пунктир
         *           'stroke-opacity': 1,       // прозраность
         *           'stroke-dashoffset': 0,    // смещение
         *           'stroke-linecap': ''       // скругление углов
         *      }
         *   }, ...
         *   ]
         * @returns {string}
         */
        saveSLD: function(options) {
            var str_result = '';
            if (!options || options.type != 'line' || !options.options || options.options.length == 0) {
                return str_result;
            }

            var options = options.options;
            for(var i = 0; i < options.length; i++) {
                str_result += GWTK.MapeditLegendDraw_SimpleLine.prototype.saveSLD(options[i]);
            }

            if (str_result) {
                str_result =
                    '<FeatureTypeStyle>' +
                    '<Rule>' +
                    str_result +
                    '</Rule>' +
                '</FeatureTypeStyle>';
            }

            return str_result;
        }

    };


    /**
     *  TODO: НЕ РЕАЛИЗОВАНО !!!
     *  класс объекта Линейная штриховка
     * @param options - массив объектов GWTK.MapeditLegendDraw_SimpleLineHatch
     * @constructor
     */

    GWTK.MapeditLegendDraw_LineHatch = function (options) {

        this.type = 'linehatch';
        this.options = [];
        if (options && options.length > 0) {
            for (var i = 0; i < options.length; i++) {
                this.options.push(options[i]);
            }
        }

    };

    GWTK.MapeditLegendDraw_LineHatch.prototype = {


        /**
         * Пример изображения в svg
         * @param w
         * @param h
         * @param options
         * @returns {string}
         */
        getExampleImageSvg: function (w, h, options, defsid) {
            w = (w) ? w : 50;
            h = (h) ? h : 30;
            options = (options) ? options : this.options;

            var res = '', rects = '',
                imageSvg = this.getExampleHatchPatternSvg(options, defsid);

            if (imageSvg.defsId.length > 0) {
                for (var i = 0; i < options.length; i++) {
                    if (options[i] instanceof GWTK.MapeditLegendDraw_SimpleLineHatch) {
                        rects += '<rect width="100%" height="100%" fill="url(#' + imageSvg.defsId[i] + ')" />';
                    }
                }
                res = '<defs>' + imageSvg.defs + '</defs>' + rects;
            }
            return res;
        },

        // Запросить строку паттернов для штриховки
        getExampleHatchPatternSvg: function(options, norandom, name, defsid){
            var defId, defs = '', defsId = [],
                imageSvg = {
                'defs' : defs,
                'defsId': defsId
            };
            if (options && options.length > 0) {
                for (var i = 0; i < options.length; i++) {
                    if (options[i] instanceof GWTK.MapeditLegendDraw_SimpleLineHatch) {
                        defId = 'diagonalHatch' + i.toString() + (defsid ? defsid : '');
                        if (!norandom) {
                            defId += GWTK.Util.randomInt(150, 200).toString();
                        }
                        imageSvg.defs += options[i].getExampleHatchPatternSvg(defId, options[i].options, name);
                        imageSvg.defsId.push(defId);
                    }
                }
            }
            return imageSvg;
        },

        clone: function () {
            return new GWTK.MapeditLegendDraw_LineHatch(this.options, this.classifierLayer);
        },

        /**
         * Создать объект параметров из объекта стиля
         * @param style
         */
        setOptionsFromStyle: function (style) {

            var options = {
                type: 'linehatch',
                options:
                    [
                    GWTK.MapeditLegendDraw_SimpleLineHatch.prototype.setOptionsFromStyle()
                    ]
            }

            if (style) {
                options.options = []
                if (style.style){
                    // options.options.push(GWTK.MapeditLegendDraw_SimpleLineHatch.prototype.setOptionsFromStyle(style))
                    options.options.push(GWTK.MapeditLegendDraw_SimpleLineHatch.prototype.setOptionsFromStyle(style.style))
                }
                else {
                    if (style.styleHatch && style.styleHatch.length){
                        for (var i = 0; i < style.styleHatch.length; i++) {
                            options.options.push(GWTK.MapeditLegendDraw_SimpleLineHatch.prototype.setOptionsFromStyle(style.styleHatch[i]))
                        }
                    }
                }
            }

            return options;

        },

        /**
         * Запросить стиль для Svg в виде строки css
         * например "stroke:#00FFFE;stroke-width:11.00;stroke-dasharray:;stroke-opacity:1;stroke-dashoffset:0;stroke-linecap:;fill:#F6B26B;fill-opacity:1"
         * @returns {*}
         */
        getStyle_StringForSVG: function (jsonObject) {

            var styleline = '';
            if (!jsonObject) {
                jsonObject = this.saveJSON();
            }
            if (jsonObject.options && jsonObject.options.length > 0) {
                if (jsonObject.options[0].type == 'simplelineatch') {
                    styleline = JSON.stringify(jsonObject.options[0].options).replace(/{|}|\"/g, '');
                    styleline = styleline.replace(/,/g, ';');
                    return styleline;
                }
            }
            return styleline;
        }
    };
    GWTK.Util.inherits(GWTK.MapeditLegendDraw_LineHatch, GWTK.MapeditLegendDraw_Line);

    /**
     *  класс объекта Полигон
     * @param options { // Исходные параметры полигна
     * }
     * @param classifierLayer - Ключ слоя в классификаторе
     * @constructor
     */

    GWTK.MapeditLegendDraw_Polygon = function (options, classifierLayer) {

        this.type = 'polygon';
        this.classifierLayer = (classifierLayer) ? classifierLayer : '';

        this.options = {
            // параметры линии
            'optionsLine': new GWTK.MapeditLegendDraw_Line(), // параметры линии MapeditLegendDraw_Line
            // параметры заливки
            'optionsFill': JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsFillDefault)), // параметры заливки
            // параметры штриховки
            'optionsHatch': new GWTK.MapeditLegendDraw_LineHatch() // параметры штриховки MapeditLegendDraw_LineHatch
        }
        if (options) {
            // $.extend(this.options, options);
            if (options.optionsLine && options.optionsLine.clone) {
                this.options.optionsLine = options.optionsLine.clone();
            }
            if (options.optionsFill) {
                this.options.optionsFill['fill'] = (options.optionsFill['fill']) ? options.optionsFill['fill'] : GWTK.GRAPHIC.colorDefault;
                this.options.optionsFill['fill-opacity'] = (options.optionsFill['fill-opacity']) ? options.optionsFill['fill-opacity'] : 1;
            }
            if (options.optionsHatch && options.optionsHatch.clone) {
                this.options.optionsHatch = options.optionsHatch.clone();
            }
        }

    };

    GWTK.MapeditLegendDraw_Polygon.prototype = {

        /**
         * Получение стилей для линии
         * @param image
         * @returns {string}
         */
        getStyleLine: function (options) {
            options = (options) ? options : this.options;

            // Получить стиль линии
            var style = GWTK.MapeditLegendDraw_SimpleLine.prototype.getStyle(options);
            return style;
        },

        /**
         * Получение стилей для линии
         * @param image
         * @returns {string}
         */
        getStyleFill: function (options) {
            options = (options) ? options : this.options;

            var style = '';
            if (options && options.optionsFill && options.optionsFill['fill']) {
                style += 'fill:' + options.optionsFill['fill'] + ';';
            }
            if (options && options.optionsFill && options.optionsFill['fill-opacity']) {
                style += 'fill-opacity:' + options.optionsFill ['fill-opacity'] + ';';
            }
            return style;
        },

        /**
         * Пример изображения в svg
         * @param w
         * @param h
         * @param options
         * @returns {string}
         */
        getExampleImageSvg: function (w, h, options, defsid) {
            var styleFill = this.getStyleFill(options);
            if (styleFill) {
                styleFill = 'style="' + styleFill + '"';
            }
            w = (w) ? w : 50;
            h = (h) ? h : 30;

            var res = '<rect width="' + w + '" height="' + h + '" x="0" y="0" ' + styleFill + ' />',
                styleLine = '';


            if (this.options.optionsHatch.options.length) {
                res += this.options.optionsHatch.getExampleImageSvg(w, h);
            }

            for (var i = 0; i < this.options.optionsLine.options.length; i++) {
                styleLine = this.getStyleLine(this.options.optionsLine.options[i].options);
                if (styleLine) {
                    styleLine = 'style="' + styleLine + ' fill:none;' + '"';
                    res += '<path d="M0,0 0,' + h + ' ' + w + ',' + h + ' ' + w + ',0 0,0" ' + styleLine + '></path>';
                }
            }

            return res;
        },

        /**
         * Запросить значеие
         * @param index
         * @param key
         * @param val
         */
        get: function (type, index, key) {
            if (!key) {
                return;
            }
            switch (type) {
                case 'line':
                    return this.options.optionsLine.get(type, index, key);
                case 'fill':
                    return this.options.optionsFill[key];
                case 'hatch':
                    return this.options.optionsHatch.get(type, index, key);
            }
        },

        /**
         * Установить значеие
         * @param index
         * @param key
         * @param val
         */
        set: function (type, index, key, val) {
            if (!key) {
                return;
            }
            switch (type) {
                case 'line':
                    return this.options.optionsLine.set(type, index, key, val);
                case 'fill':
                    return this.options.optionsFill[key] = val;
                case 'hatch':
                    return this.options.optionsHatch.set(type, index, key, val);
            }
        },

        getOptions: function (type, index) {
            if (index < 0 || index > this.options.length - 1) {
                index = 0;
            }
            switch (type) {
                case 'line':
                    return this.options.optionsLine.getOptions(type, index);
                case 'fill':
                    return this.options.optionsFill;
                case 'hatch':
                    return this.options.optionsHatch.getOptions(type, index);
            }
        },

        /**
         * Добывить объект простой линии
         * @param type
         * @param options
         */
        add: function (type, options) {
            switch (type) {
                case 'line':
                    return this.options.optionsLine.add(type, options);
                case 'hatch':
                    return this.options.optionsHatch.add(type, options);
            }
        },

        remove: function (type, index) {
            switch (type) {
                case 'line':
                    return this.options.optionsLine.remove(type, index);
                case 'hatch':
                    return this.options.optionsHatch.remove(type, index);
            }
        },

        down: function (type, index) {
            switch (type) {
                case 'line':
                    return this.options.optionsLine.down(type, index);
                case 'hatch':
                    return this.options.optionsHatch.down(type, index);
            }
        },

        up: function (type, index) {
            switch (type) {
                case 'line':
                    return this.options.optionsLine.up(type, index);
                case 'hatch':
                    return this.options.optionsHatch.up(type, index);
            }
        },

        /**
         * Сохранение параметров объетка в JSON
         */
        saveJSON: function () {
            var objectTemplate = {
                type: this.type,
                classifierLayer: this.classifierLayer,
                options: {
                    'optionsLine': this.options.optionsLine.saveJSON(),
                    'optionsFill': JSON.parse(JSON.stringify(this.options.optionsFill)),
                    'optionsHatch': this.options.optionsHatch.saveJSON()
                }
            }

            return objectTemplate;
        },

        /**
         * Загрузка параметров из JSON
         */
        loadJSON: function (options) {
            if (options && options.type == this.type && options.options) {
                if (options.options.optionsLine) {
                    this.options.optionsLine = new GWTK.MapeditLegendDraw_Line();
                    this.options.optionsLine.loadJSON(options.options.optionsLine)
                }
                if (options.options.optionsFill) {
                    this.options.optionsFill = JSON.parse(JSON.stringify(options.options.optionsFill));
                }
                if (options.options.optionsHatch) {
                    this.options.optionsHatch = new GWTK.MapeditLegendDraw_LineHatch();
                    this.options.optionsHatch.loadJSON(options.options.optionsHatch)
                }
                if (options.classifierLayer) {
                    this.classifierLayer = options.classifierLayer;
                }
            }
        },

        clone: function () {
            return new GWTK.MapeditLegendDraw_Polygon(this.options, this.classifierLayer);
        },

        // Запрос углов Штриховки
        getAngleList: function(){
            return GWTK.MapeditLegendDraw_SimpleLineHatch.prototype.getAngleList();
        },

        /**
         * Запросить объект стиля (включает все атрибуты в один JSON объект)
         * @returns {*}
         */
        setStyleObject: function (jsonObject) {
            if (!jsonObject) {
                jsonObject = this.saveJSON();
            }
            var styleObject = {};
            if (jsonObject.options) {
                if (jsonObject.options.optionsLine && jsonObject.options.optionsLine.options &&
                    jsonObject.options.optionsLine.options.length > 0) {
                    if (jsonObject.options.optionsLine.options[0].type == 'simpleline') {
                        $.extend(styleObject, jsonObject.options.optionsLine.options[0].options);
                    }
                }
                if (jsonObject.options.optionsFill) {
                    $.extend(styleObject, jsonObject.options.optionsFill);
                }
                // TODO! Штриховку обработать отдельно
                // if (jsonObject.options.optionsHatch) {
                //     $.extend(styleObject, jsonObject.options.optionsHatch.options[0]);
                // }
                return styleObject;
            }
            return {};
        },

        /**
         * Создать объект параметров из объекта стиля
         * @param style = {
         *     style: {},
         *     styleFill : {},
         *     stylesLine : [],
         *     stylesHatch : []
         * }
         */
        setOptionsFromStyle: function (style) {
            var options = {
                type: 'polygon',
                options: {
                // параметры линии
                'optionsLine': GWTK.MapeditLegendDraw_Line.prototype.setOptionsFromStyle(), // параметры линии MapeditLegendDraw_Line
                // параметры заливки
                'optionsFill': JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsFillDefault)), // параметры заливки
                // параметры штриховки
                'optionsHatch': []
                }
            };

            if (style) {
                if (style.style) {
                    // Перегоним параметры
                    style.styleFill = {
                        'fill': style.style['fill'] ? style.style['fill'] : '',
                        'fill-opacity': style.style['fill-opacity'] ? style.style['fill-opacity'] : 1
                    };
                    style.styleLine = [{
                        // Общие
                        'stroke': style.style['stroke'] ? style.style['stroke'] : '', // цвет
                        'stroke-width': style.style['stroke-width'] ? style.style['stroke-width'] : 1.00,          // толщина
                        'stroke-dasharray': style.style['stroke-dasharray'] ? style.style['stroke-dasharray'] : '',     // пунктир
                        // Только графика
                        'stroke-opacity': style.style['stroke-opacity'] ? style.style['stroke-opacity'] : 1.00,       // прозраность
                        'stroke-dashoffset': style.style['stroke-dashoffset'] ? style.style['stroke-dashoffset'] : 0,    // смещение
                        'stroke-linecap': style.style['stroke-linecap'] ? style.style['stroke-linecap'] : ''       // скругление углов
                    }]
                }
                if (style.styleFill || style.styleLine || style.styleHatch) {
                    options.options.optionsFill = (style.styleFill) ? JSON.parse(JSON.stringify(style.styleFill)) : {};
                    options.options.optionsLine = (style.styleLine && style.styleLine.length) ? GWTK.MapeditLegendDraw_Line.prototype.setOptionsFromStyle({'styleLine': style.styleLine}) : [];
                    options.options.optionsHatch = (style.styleHatch && style.styleHatch.length) ? GWTK.MapeditLegendDraw_LineHatch.prototype.setOptionsFromStyle({'styleHatch': style.styleHatch}) : [];
                }
            }

            return options;
        },


        /**
         * Запросить стиль для Svg в виде параметров строки style
         * например "stroke:#00FFFE;stroke-width:11.00;stroke-dasharray:;stroke-opacity:1;stroke-dashoffset:0;stroke-linecap:;fill:#F6B26B;fill-opacity:1"
         * @returns {*}
         */
        getStyle_StringForSVG: function (jsonObject) {
            if (!jsonObject) {
                jsonObject = this.saveJSON();
            }

            var styleObject = {};
            if (jsonObject.options) {
                if (jsonObject.options.optionsLine && jsonObject.options.optionsLine.options && jsonObject.options.optionsLine.options.length > 0) {
                    if (jsonObject.options.optionsLine.options[0].type == 'simpleline') {
                        $.extend(styleObject, jsonObject.options.optionsLine.options[0].options);
                    }
                }
                if (jsonObject.options.optionsFill) {
                    $.extend(styleObject, jsonObject.options.optionsFill);
                }
                // TODO! Штриховку обработать отдельно
                // if (jsonObject.options.optionsHatch) {
                //     $.extend(styleObject, jsonObject.options.optionsHatch.options[0]);
                // }

                var styleline = JSON.stringify(styleObject).replace(/{|}|\"/g, '');
                styleline = styleline.replace(/,/g, ';');
                return styleline;
            }
            return '';

        },

        /**
         * Запросить стиль <Fill>
         * @param options = {
         *       'fill': GWTK.GRAPHIC.colorDefault,
         *       'fill-opacity': 1
         *   }
         * @param noopacity = bool - не добавлять прорачность
         * @returns {*}
         */
        getFillSLD: function(options, noopacity) {
            var str_result = '';
            if (!options) {
                return str_result;
            }
            var strFromOptions = '';
            for (var key in options) {
                if (key == 'fill-opacity' && noopacity) {
                    continue;
                }
                strFromOptions += '<CssParameter name="' + key + '">' + options[key] + '</CssParameter>';
            }
            str_result = (strFromOptions) ?
                '<Fill>' +
                strFromOptions +
                '</Fill>' :
                '';

            return str_result;
        },

        /**
         * Сохранить в формате SLD
         * @param options = {
         *     type: 'polygon',
         *     options: {
         *         optionsLine: {
         *             type: 'line',
         *             options: [
         *                 {
         *                  type: 'simpleline',
         *                  options: {
         *                      'stroke': GWTK.GRAPHIC.colorDefault,   // цвет
         *                      'stroke-width': 1,          // толщина
         *                      'stroke-dasharray': '',     // пунктир
         *                      'stroke-opacity': 1,       // прозраность
         *                      'stroke-dashoffset': 0,    // смещение
         *                      'stroke-linecap': ''       // скругление углов
         *                      }
         *                 },...
         *             ]
         *
         *         },
         *         optionsFill: {
         *            'fill': GWTK.GRAPHIC.colorDefault,
         *            'fill-opacity': 1
         *         }
         *
         *     }
         * }
         * @returns {string}
         */
        saveSLD: function(options) {
            var str_result = '';
            if (!options || options.type != 'polygon' || !options.options) {
                return str_result;
            }

            var strFillSLD = GWTK.MapeditLegendDraw_Polygon.prototype.getFillSLD(options.options.optionsFill),
                strStrokeSLD = '', strStrokeSLD_one = '',
                strStrokeHatchSLD = '', strStrokeHatchSLD_one = '';

            // Добавить <LineSymbolizer>, если несколько описаний линий
            for(var i = 0; i < options.options.optionsLine.options.length; i++) {
                strStrokeSLD_one = GWTK.MapeditLegendDraw_SimpleLine.prototype.getStrokeSLD(options.options.optionsLine.options[i]);
                if (strStrokeSLD_one)  {
                    strStrokeSLD += '<LineSymbolizer>' + strStrokeSLD_one + '</LineSymbolizer>';
                }
            }

            // Добавить <PolygonSymbolizer>, если несколько описаний штриховок
            if (options.options.optionsHatch && options.options.optionsHatch.options) {
                for (var i = 0; i < options.options.optionsHatch.options.length; i++) {
                    strStrokeHatchSLD_one = GWTK.MapeditLegendDraw_SimpleLine.prototype.getStrokeSLD(options.options.optionsHatch.options[i]);
                    if (strStrokeHatchSLD_one) {
                        strStrokeHatchSLD += '<PolygonSymbolizer>' + strStrokeHatchSLD_one + '</PolygonSymbolizer>';
                    }
                }
            }

            if (strFillSLD || strStrokeSLD || strStrokeHatchSLD)     {

                str_result = '<FeatureTypeStyle><Rule>';
                if (strFillSLD)     {
                    str_result += '<PolygonSymbolizer>' + strFillSLD + '</PolygonSymbolizer>';
                }
                if (strStrokeHatchSLD) {
                    str_result += strStrokeHatchSLD;
                }
                if (strStrokeSLD) {
                    str_result += strStrokeSLD;
                }
                str_result += '</Rule></FeatureTypeStyle>';
            }
            return str_result;
        }

    };


    /**
     *  класс объекта Подпись
     * @param options { // Исходные параметры подписи
     * }
     * @param classifierLayer - Ключ слоя в классификаторе
     * @constructor
     */

    GWTK.MapeditLegendDraw_Title = function (options, classifierLayer) {

        this.type = 'title';
        this.classifierLayer = (classifierLayer) ? classifierLayer : '';
        this.text = '';
        this.options = {
            // цвет, толщина, прозрачность
            'optionsSimple': JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsSimple)),
            // параметры шрифта
            'optionsFont': JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsFontDefault)),

            // TODO! При передаче параметров на сервер (при наличии обводки) для совпадения отображения текста
            // TODO: необходимо поменять местами 'stroke' и 'fill'
            // параметры обводки
            'optionsFill': JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsFillDefault)),

            // для описания Текста вдоль кривой
            'optionsTextPath': JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsSimpleLine)),   // Параметры простой линии
            // <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
            // <defs>
            // <path id="textpath" fill="none" stroke="#000000"
            // d="M0.057,0.024c0,0,10.99,51.603,102.248,51.603c91.259,0,136.172,53.992,136.172,53.992"/>
            // </defs>
            //
            // <use xlink:href="#textpath"/>
            //     <text x="10" y="100" font-size="24">
            //     <textPath xlink:href="#textpath">
            //     Кот вдоль кривой
            //     </textPath>
            //     </text>
            //</svg>

            // Параметры фона (в svg все сложно)
            'background-color': '' // в SVG это делается только так:
            //  <svg viewBox="0 0 100 25" width="100" height="25"> <defs>
            //     <filter x="0" y="0" width="1" height="1" id="red">
            //     <feFlood flood-color="red"></feFlood>
            //     <feComposite in="SourceGraphic" operator="xor"></feComposite>
            //     </filter>
            //     </defs>
            //     <text x="20" y="15" style="stroke: #27d6aa;stroke-width:1;stroke-opacity:1;font-size: 12px;" filter="url(#red)">TEXT</text>
            //     <text x="20" y="15" style="stroke: #27d6aa;stroke-width:1;stroke-opacity:1;font-size: 12px;">TEXT</text>
            // </svg>

        }

        if (options) {
            if (options.optionsSimple) {
                this.options.optionsSimple = JSON.parse(JSON.stringify(options.optionsSimple));
            }
            if (options.optionsFont) {
                this.options.optionsFont = JSON.parse(JSON.stringify(options.optionsFont));
            }
            if (options.optionsFill) {
                this.options.optionsFill = JSON.parse(JSON.stringify(options.optionsFill));
            }
            if (options.optionsTextPath) {
                this.options.optionsTextPath = JSON.parse(JSON.stringify(options.optionsTextPath));
            }
            if (options['background-color']) {
                this.options['background-color'] = options['background-color'];
            }
        }

    };

    GWTK.MapeditLegendDraw_Title.prototype = {


        /**
         * Сохранить параметры в json
         * @returns {{type: *, classifierLayer: *, options: any}}
         */
        saveJSON: function () {
            return {
                type: this.type,
                classifierLayer: this.classifierLayer,
                options: JSON.parse(JSON.stringify(this.options)),
                text: this.text
            }
        },

        /**
         * Загрузить из JSON
         * @param options
         */
        loadJSON: function (options) {

            if (options && options.type == this.type && options.options) {
                this.options = JSON.parse(JSON.stringify(options.options));
            }
            this.classifierLayer = (options.classifierLayer) ? options.classifierLayer : '';
            this.text = (options.text) ? options.text : '';
        },

        clone: function () {
            var _object = new GWTK.MapeditLegendDraw_Title(this.options, this.classifierLayer);
            _object.text = this.text;
            return _object;
        },

        setStyleObject: function (jsonObject) {
            if (!jsonObject) {
                jsonObject = this.saveJSON();
            }

            var styleObject = {};
            if (jsonObject.type == 'title') {
                if (jsonObject.options) {

                    if (jsonObject.options.optionsSimple) {
                        $.extend(styleObject, jsonObject.options.optionsSimple);
                    }
                    if (jsonObject.options.optionsFont) {
                        $.extend(styleObject, jsonObject.options.optionsFont);
                    }
                    if (jsonObject.options.optionsFill && jsonObject.options.optionsFill.fill) {
                        $.extend(styleObject, jsonObject.options.optionsFill);
                    }
                    // // optionsTextPath - отдельная обработка
                    // if (jsonObject.options.optionsTextPath) {
                    // }
                }
            }
            return styleObject;
        },

        /**
         * сохранить описание объекта в виде словаря [{name, caption, value, type, options}]
         */
        saveDictionary: function (layer) {
            var isGraphic = (layer && layer instanceof GWTK.graphicLayer) ? true : false,
                writing_mode_items = isGraphic ?
                [
                    {
                        'id': '',
                        'text':  w2utils.lang('none')
                    }
                    , {
                        'id': 'lr',
                        'text': w2utils.lang('from left to right') // слева направо
                    }
                    , {
                        'id': 'tb',
                        'text': w2utils.lang('top down') // свеху вниз
                    }
                    //  , {
                    //  'id': 'rl',
                    //  'text': w2utils.lang('from right to left') // справа налево
                    //  }
                    //
                    //
                    // ,{
                    //     'id': 'lr-tb',
                    //     'text': w2utils.lang('from left to right') // слева направо
                    // }
                    // , {
                    //     'id': 'rl-tb',
                    //     'text': w2utils.lang('from right to left') // справа налево
                    // }
                    // , {
                    //     'id': 'tb-rl',
                    //     'text': w2utils.lang('vertically aligned to top and right') // вертикально, выравнивание по верхнему и правому краю
                    // }
                    // , {
                    //     'id': 'bt-rl',
                    //     'text': w2utils.lang('vertically aligned to bottom and right') // вертикально, выравнивание по нижнему и правому краю
                    // }
                    // , {
                    //     'id': 'tb-lr',
                    //     'text': w2utils.lang('vertically aligned to top and left') // вертикально, выравнивание по верхнему и левому краю.
                    // }
                    // , {
                    //     'id': 'bt-lr',
                    //     'text': w2utils.lang('vertically aligned to bottom and left')  // вертикально, выравнивание по нижнему и левому краю.
                    // }
                ] :
                [
                    {
                        'id': 'lr',
                        'text': w2utils.lang('from left to right') // слева направо
                    }
                ],
                font_family_items = [
                    {
                        'id': 'Times New Roman',
                        'text': 'Times New Roman'
                    }
                    , {
                        'id': 'Georgia',
                        'text': 'Georgia'
                    }
                    , {
                        'id': 'Arial',
                        'text': 'Arial'
                    }
                    , {
                        'id': 'Verdana',
                        'text': 'Verdana'
                    }
                    , {
                        'id': 'Courier New',
                        'text': 'Courier New'
                    }
                    , {
                        'id': 'Lucida Console',
                        'text': 'Lucida Console'
                    }
                    , {
                        'id': 'Tahoma',
                        'text': 'Tahoma'
                    }];

            var paramGraphic = [
                {
                    'name': 'font-family',
                    'caption': w2utils.lang('Font family'),
                    'value': this.options.optionsFont['font-family'],
                    'options': {
                        'type': 'list',
                        'items': font_family_items
                    }
                }
                , {
                    'name': 'fill',
                    'caption': w2utils.lang('Color'),
                    'value': (this.options.optionsFill['fill'] == 'none') ? '' : this.options.optionsFill['fill'],
                    'options': {
                        'type': 'color'
                    }
                }
                , {
                    'name': 'fill-opacity',
                    'caption': w2utils.lang('Stroke opacity'),
                    'value': this.options.optionsFill['fill-opacity'],
                    'options': {
                        'type': 'float',
                        'min': 0,
                        'max': 1,
                        'precision': 2
                    }
                }
                , {
                    'name': 'font-size',
                    'caption': w2utils.lang('Height'),
                    'value': this.options.optionsFont['font-size'],
                    'options': {
                        'type': 'int'
                    }
                }
                , {
                    'name': 'stroke',
                    'caption': w2utils.lang('Сontour color'),
                    'value': this.options.optionsSimple['stroke'],
                    'options': {
                        'type': 'color'
                    }
                },

                {
                    'name': 'stroke-opacity',
                    'caption': w2utils.lang('Сontour opacity'),
                    'value': this.options.optionsSimple['stroke-opacity'],
                    'options': {
                        'type': 'float',
                        'min': 0,
                        'max': 1,
                        'precision': 2
                    }
                }
                , {
                    'name': 'stroke-width',
                    'caption': w2utils.lang('Сontour width'),
                    'value': this.options.optionsSimple['stroke-width'],
                    'options': {
                        'type': 'float',
                        'min': 0,
                        'precision': 2
                    }
                }
                , {
                    'name': 'font-style',
                    'caption': w2utils.lang('Font style'),
                    'value': this.options.optionsFont['font-style'],
                    'type': 'list',
                    'options': {
                        'type': 'list',
                        'items': [
                            {
                                'id': 'normal',
                                'text': w2utils.lang('normal')
                            }
                            , {
                                'id': 'italic',
                                'text': w2utils.lang('italic')
                            }
                            , {
                                'id': 'oblique',
                                'text': w2utils.lang('oblique')
                            }
                        ]
                    }
                }
                , {
                    'name': 'font-weight',
                    'caption': w2utils.lang('Font weight'),
                    'value': this.options.optionsFont['font-weight'],
                    'options': {
                        'type': 'list',
                        'items': [
                            {
                                'id': 'normal',
                                'text': w2utils.lang('normal')
                            }
                            , {
                                'id': 'bold',
                                'text': w2utils.lang('bold')
                            }
                        ]
                    }
                }
                , {
                    'name': 'font-stretch',
                    'caption': w2utils.lang('Font stretch'),
                    'value': this.options.optionsFont['font-stretch'],
                    'options': {
                        'type': 'list',
                        'items': [
                            {
                                'id': 'condensed',
                                'text': w2utils.lang('condensed')
                            }
                            , {
                                'id': 'normal',
                                'text': w2utils.lang('normal')
                            }
                            , {
                                'id': 'expanded',
                                'text': w2utils.lang('expanded')
                            }
                        ]
                    }
                }
                , {
                    'name': 'text-decoration',
                    'caption': w2utils.lang('Font decoration'),
                    'value': this.options.optionsFont['text-decoration'],
                    'options': {
                        'type': 'list',
                        'items': [
                            {
                                'id': 'none',
                                'text': w2utils.lang('none')
                            },
                            {
                                'id': 'line-through',
                                'text': w2utils.lang('crossed out')
                            }
                            , {
                                'id': 'overline',
                                'text': w2utils.lang('overline')
                            }
                            , {
                                'id': 'underline',
                                'text': w2utils.lang('underline')
                            }
                        ]
                    }
                }
                , {
                    'name': 'letter-spacing',
                    'caption': w2utils.lang('Letter spacing'),
                    'value': this.options.optionsFont['letter-spacing'],
                    'options': {
                        'type': 'int'
                    }
                }
                , {
                    'name': 'text-shadow',
                    'caption': w2utils.lang('Font shadow'),
                    'value': this.options.optionsFont['text-shadow'],
                    'options': {
                        'type': 'checkbox',
                        'params': [
                            {
                                'name': 'shadow-color',
                                'caption': w2utils.lang('Color'),
                                'value': this.getValueFromShadow('shadow-color'),
                                'options': {
                                    'type': 'color'
                                }
                            },
                            {
                                'name': 'shadow-offset-x',
                                'caption': w2utils.lang('Horizontal shadow offset relative to text'), // Смещение тени по горизонтали относительно текста
                                'value': this.getValueFromShadow('shadow-offset-x'),
                                'options': {
                                    'type': 'int'
                                }
                            },
                            {
                                'name': 'shadow-offset-y',
                                'caption': w2utils.lang('Horizontal shadow offset relative to text'), // Смещение тени по горизонтали относительно текста
                                'value': this.getValueFromShadow('shadow-offset-y'),
                                'options': {
                                    'type': 'int'
                                }
                            }
                        ]
                    }
                }
                , {
                    'name': 'writing-mode',
                    'caption': w2utils.lang('Text direction'),
                    'value': this.options.optionsFont['writing-mode'],
                    'options': {
                        'type': 'list',
                        'items': writing_mode_items
                    }
                }
                // , {
                //     'name': 'text-path',
                //     'caption': w2utils.lang('Text along the curve'),
                //     'value': 0,
                //     'options': {
                //         'type': 'checkbox',
                //         'params': [
                //             {
                //                 'name': 'stroke',
                //                 'caption': w2utils.lang('Color'),
                //                 'value': this.options.optionsSimple['stroke'],
                //                 'options': {
                //                     'type': 'color'
                //                 }
                //             },
                //             {
                //                 'name': 'stroke-width',
                //                 'caption': w2utils.lang('Stroke width'),
                //                 'value': this.options.optionsSimple['stroke-width'],
                //                 'options': {
                //                     'type': 'int'
                //                 }
                //             },
                //             {
                //                 'name': 'stroke-opacity',
                //                 'caption': w2utils.lang('Stroke opacity'),
                //                 'value': this.options.optionsSimple['stroke-opacity'],
                //                 'options': {
                //                     'type': 'float',
                //                     'min': 0,
                //                     'max': 1,
                //                     'precision': 2
                //                 }
                //             }
                //         ]
                //     }
                // }

            ];

            var paramDraw = [
                {
                    'name': 'font-family',
                    'caption': w2utils.lang('Font family'),
                    'value': this.options.optionsFont['font-family'],
                    'options': {
                        'type': 'list',
                        'items': font_family_items
                    }
                }

                , {
                    'name': 'fill',
                    'caption': w2utils.lang('Color'),
                    'value': (this.options.optionsFill['fill'] == 'none') ? '' : this.options.optionsFill['fill'],
                    'options': {
                        'type': 'color'
                    }
                }
                , {
                    'name': 'font-size',
                    'caption': w2utils.lang('Height'),
                    'value': this.options.optionsFont['font-size'],
                    'options': {
                        'type': 'int'
                    }
                }
                // ,{
                //     'name' : 'stroke-width',
                //     'caption' : w2utils.lang('Stroke width'),
                //     'value' : this.options.optionsSimple['stroke-width'],
                //     'options': {
                //         'type': 'float',
                //         'max' : 1,
                //         'precision' : 1
                //     }
                // }
                // ,{
                //     'name' : 'fill-opacity',
                //     'caption' : w2utils.lang('Stroke opacity'),
                //     'value' : this.options.optionsFill['fill-opacity'],
                //     'options': {
                //         'type': 'float',
                //         'min' : 0,
                //         'max' : 1,
                //         'precision' : 2
                //     }
                // }
                // , {
                //     'name': 'stroke',
                //     'caption': w2utils.lang('Сontour color'),
                //     'value': this.options.optionsSimple['stroke'],
                //     'options': {
                //         'type': 'color'
                //     }
                // }
                // {
                //     'name' : 'stroke-opacity',
                //     // 'caption' : w2utils.lang('Stroke opacity'),
                //     'caption' : w2utils.lang('Сontour opacity'),
                //     'value' : this.options.optionsSimple['stroke-opacity'],
                //     'options': {
                //         'type': 'float',
                //         'min' : 0,
                //         'max' : 1,
                //         'precision' : 2
                //     }
                // }
                , {
                    'name': 'font-style',
                    'caption': w2utils.lang('Font style'),
                    'value': this.options.optionsFont['font-style'],
                    'type': 'list',
                    'options': {
                        'type': 'list',
                        'items': [
                            {
                                'id': 'normal',
                                'text': w2utils.lang('normal')
                            }
                            , {
                                'id': 'italic',
                                'text': w2utils.lang('italic')
                            }
                            // ,{
                            //     'id': 'oblique',
                            //     'text': w2utils.lang('oblique')
                            // }
                        ]
                    }
                }
                , {
                    'name': 'font-weight',
                    'caption': w2utils.lang('Font thickness'),
                    'value': this.options.optionsFont['font-weight'],
                    'options': {
                        'type': 'list',
                        'items': [
                            {
                                'id': 'normal',
                                'text': w2utils.lang('normal')
                            }
                            , {
                                'id': 'bold',
                                'text': w2utils.lang('bold')
                            }
                        ]
                    }
                }
                , {
                    'name': 'font-stretch',
                    'caption': w2utils.lang('Font width'),
                    'value': this.options.optionsFont['font-stretch'],
                    'options': {
                        'type': 'list',
                        'items': [
                            {
                                'id': 'condensed',
                                'text': w2utils.lang('condensed')
                            }
                            , {
                                'id': 'normal',
                                'text': w2utils.lang('normal')
                            }
                            , {
                                'id': 'expanded',
                                'text': w2utils.lang('expanded')
                            }
                        ]
                    }
                }
                , {
                    'name': 'text-decoration',
                    'caption': w2utils.lang('Font decoration'),
                    'value': this.options.optionsFont['text-decoration'],
                    'options': {
                        'type': 'list',
                        'items': [
                            {
                                'id': 'none',
                                'text': w2utils.lang('none')
                            },
                            {
                                'id': 'line-through',
                                'text': w2utils.lang('crossed out')
                            }
                            , {
                                'id': 'overline',
                                'text': w2utils.lang('overline')
                            }
                            , {
                                'id': 'underline',
                                'text': w2utils.lang('underline')
                            }
                        ]
                    }
                }
                // ,{
                //     'name' : 'letter-spacing',
                //     'caption' : w2utils.lang('Letter spacing'),
                //     'value' : this.options.optionsFont['letter-spacing'],
                //     'options': {
                //         'type': 'int'
                //     }
                // }
                , {
                    'name': 'stroke',
                    'caption': w2utils.lang('Contour'),
                    'value': this.options.optionsSimple['stroke'],
                    'options': {
                        'type': 'checkbox',
                        'params': [
                            {
                                'name': 'stroke',
                                'caption': w2utils.lang('Color'),
                                'value': this.options.optionsSimple['stroke'],
                                'options': {
                                    'type': 'color'
                                }
                            },
                            {
                                'name' : 'stroke-width',
                                'caption' : w2utils.lang('Сontour width'),
                                'value' : this.options.optionsSimple['stroke-width'],
                                'options': {
                                    'type': 'float',
                                    'min' : 0,
                                    'precision' : 2
                                }
                            }

                        ]
                    }
                }
                , {
                    'name': 'text-shadow',
                    'caption': w2utils.lang('Font shadow'),
                    'value': this.options.optionsFont['text-shadow'],
                    'options': {
                        'type': 'checkbox',
                        'params': [
                            {
                                'name': 'shadow-color',
                                'caption': w2utils.lang('Color'),
                                'value': this.getValueFromShadow('shadow-color'),
                                'options': {
                                    'type': 'color'
                                }
                            },
                            {
                                'name': 'shadow-offset-x',
                                'caption': w2utils.lang('Horizontal shadow offset relative to text'), // Смещение тени по горизонтали относительно текста
                                'value': this.getValueFromShadow('shadow-offset-x'),
                                'options': {
                                    'type': 'int'
                                }
                            },
                            {
                                'name': 'shadow-offset-y',
                                'caption': w2utils.lang('Horizontal shadow offset relative to text'), // Смещение тени по горизонтали относительно текста
                                'value': this.getValueFromShadow('shadow-offset-y'),
                                'options': {
                                    'type': 'int'
                                }
                            }
                        ]
                    }
                }
                , {
                    'name': 'writing-mode',
                    'caption': w2utils.lang('Horizontal'),
                    'value': this.options.optionsFont['writing-mode'],
                    'options': {
                        'type': 'checkbox',
                        'params': [
                            {
                                'name': 'writing-mode',
                                'caption': '',
                                'value': 'lr',
                                'options': {
                                    'type': 'list',
                                    'items': writing_mode_items
                                }
                            }
                        ]
                    }
                }

            ]

            return (isGraphic) ? paramGraphic : paramDraw;
        },

        /**
         * Загрузить описание объекта из словаря
         * @param dictionary
         */
        loadDictionary: function (dictionary) {
            if (!dictionary || dictionary.length == 0) {
                return;
            }

            for (var i = 0; i < dictionary.length; i++) {
                this.loadOneRecordDictionary(dictionary[i]);
            }
        },

        /**
         * Загрузка одной записи словаря
         * @param record
         */
        loadOneRecordDictionary: function (record) {
            var updateadd = '';
            if (record && record.name) {
                switch (record.name) {
                    case 'stroke':
                        if (record.options) {
                            if (record.options.params) {
                                this.options.optionsSimple[record.name] = (record.value) ? GWTK.MapeditLegendDrawUtil.getColor(record.options.params[0].value) : '';

                                // Если выставили контур, то убрать тень, и наоборот
                                if (record.value) {
                                    updateadd = 'text-shadow';
                                }

                            }
                            else {
                                this.options.optionsSimple[record.name] = GWTK.MapeditLegendDrawUtil.getColor(record.value);
                            }
                        }
                        break;
                    case 'stroke-width':
                    case 'stroke-opacity':
                        if (record.options) {
                            if (record.options.params) {
                                this.options.optionsSimple[record.name] = (record.value) ? record.options.params[1].value : 0;
                            }
                            else {
                                this.options.optionsSimple[record.name] = record.value;
                            }
                        }
                        break;

                    case 'font-size':
                    case 'letter-spacing':
                    case 'font-family':
                    case 'font-style':
                    case 'font-weight':
                    case 'font-stretch':
                    case 'text-decoration':
                        this.options.optionsFont[record.name] = record.value;
                        break;

                    case 'writing-mode':
                        if (record.options) {
                            if (record.options.params) {
                                this.options.optionsFont[record.name] = (record.value) ? record.options.params[0].value : '';
                            }
                            else {
                                this.options.optionsFont[record.name] = record.value;
                            }
                        }
                        break;
                    case 'text-shadow':
                        if (!record.value) {
                            this.options.optionsFont[record.name] = '';
                        }
                        else {
                            this.options.optionsFont[record.name] = this.setValueFromShadowParams(record);
                            // Если выставили тень, то убрать контур, и наоборот
                            updateadd = 'stroke';
                        }
                        break;
                    case 'shadow-color':
                    case 'shadow-offset-x':
                    case 'shadow-offset-y':
                        var text_shadow = this.setValueFromShadowParam(record);
                        if (text_shadow && this.options.optionsFont['text-shadow']) {
                            this.options.optionsFont['text-shadow'] = this.setValueFromShadowParam(record);
                        }
                        break;

                    case 'fill':
                        if (record.options) {
                            var val;
                            if (record.options.params && record.options.params.length == 2) {
                                if (record.value) {
                                    val = record.options.params[0].value;
                                }
                                else {
                                    this.options.optionsFill[record.name] = '';
                                    break;
                                }
                            }
                            else {
                                val = record.value;
                            }
                            this.options.optionsFill[record.name] = GWTK.MapeditLegendDrawUtil.getColor(val);
                            // if (this.options.optionsFill[record.name] != 'none') {
                            //     this.options.optionsSimple['stroke'] = this.options.optionsFill[record.name];
                            // }
                        }
                        break;
                    case 'fill-opacity':
                        this.options.optionsFill[record.name] = record.value;
                        break;
                    // case 'text-path':
                    //     if (record.params && record.params.length == 3) {
                    //         this.options.optionsTextPath['stroke'] = record.params[0].value;
                    //         this.options.optionsTextPath['stroke-width'] = record.params[1].value;
                    //         this.options.optionsTextPath['stroke-opacity'] = record.params[2].value;
                    //     }
                    //     break;

                }

            }

            if (updateadd) {
                return updateadd;
            }
        },

        /**
         * Зпросить значение параметра тени
         * @param name
         * @returns {*}
         */
        getValueFromShadow: function (name) {
            var result = '', mass, val;
            if (this.options.optionsFont && this.options.optionsFont['text-shadow']) {
                var text_shadow = this.options.optionsFont['text-shadow'].replace(/px/g, '');
                mass = text_shadow.split(' ');
            }

            switch (name) {
                case 'text-shadow' :
                    if (this.options.optionsFont['text-shadow']) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                case 'shadow-color':
                    if (mass && mass.length > 0) {
                        for (var j = 0; j < mass.length; j++) {
                            if (mass[j][0] == '#') {
                                return mass[j];
                            }
                        }
                    }
                    return GWTK.GRAPHIC.colorDefault;

                case 'shadow-offset-x':
                    if (mass && mass.length > 0) {
                        for (var j = 0; j < mass.length; j++) {
                            val = parseInt(mass[i]);
                            if (val) {
                                return val;
                            }
                        }
                    }
                    return 1;

                case 'shadow-offset-y':
                    if (mass && mass.length > 0) {
                        var count = 0;
                        for (var j = 0; j < mass.length; j++) {
                            val = parseInt(mass[i]);
                            if (val && count > 1) {
                                return val;
                            }
                            count++;
                        }
                    }
                    return 1;
            }

            return result;
        },

        /**
         * Формирование парметра text-shadow из описания одного из параметров тени в словаре
         * @param shadow_param - один из пераметров описания тени
         * @returns {string}
         */
        setValueFromShadowParam: function (shadow_param) {
            var mass, text_shadow, result = '';
            if (!this.options.optionsFont) {
                return result;
            }
            if (shadow_param.name && shadow_param.value) {
                text_shadow = (!this.options.optionsFont['text-shadow']) ?
                    '1px 1px ' + GWTK.GRAPHIC.colorDefault :
                    this.options.optionsFont['text-shadow'];
                text_shadow = text_shadow.replace(/px/g, '');
                mass = text_shadow.split(' ');

                if (mass && mass.length >= 3) {

                    // Найдем цвет
                    var index_color = -1, value_color = GWTK.GRAPHIC.colorDefault;
                    for (var i = 0; i < mass.length; i++) {
                        if (mass[i][0] == '#') {
                            index_color = i;
                            break;
                        }
                    }
                    if (index_color >= 0) {
                        value_color = mass[index_color];
                    }

                    switch (shadow_param.name) {
                        case 'shadow-offset-x':
                            shadow_param.value = GWTK.MapeditLegendDrawUtil.getInt(shadow_param.value);
                            result = shadow_param.value + 'px ' + mass[1] + 'px ' + value_color;
                            break;
                        case 'shadow-offset-y':
                            shadow_param.value = GWTK.MapeditLegendDrawUtil.getInt(shadow_param.value);
                            result = mass[0] + 'px ' + shadow_param.value + 'px ' + value_color;
                            break;
                        case 'shadow-color':
                            shadow_param.value = GWTK.MapeditLegendDrawUtil.getColor(shadow_param.value);
                            result = mass[0] + 'px ' + mass[1] + 'px ' + shadow_param.value;
                            break;
                    }
                }
            }
            return result;
        },

        /**
         * Формирование парметра text-shadow из описания всех параметров тени в словаре
         * @param distionary_shadow
         */
        setValueFromShadowParams: function (distionary_shadow) {
            var result = '';
            if (distionary_shadow && distionary_shadow.options && distionary_shadow.options.params) {
                var val, el = distionary_shadow.options.params.find(
                    function (element, index, array) {
                        if (element.name == 'shadow-offset-x') {
                            return element;
                        }
                    });
                if (el && el.value) {
                    val = GWTK.MapeditLegendDrawUtil.getInt(el.value);
                    result += val + 'px';
                }
                el = distionary_shadow.options.params.find(
                    function (element, index, array) {
                        if (element.name == 'shadow-offset-y') {
                            return element;
                        }
                    });
                if (el) {
                    val = GWTK.MapeditLegendDrawUtil.getInt(el.value);
                    result += ' ' + val + 'px';
                }
                el = distionary_shadow.options.params.find(
                    function (element, index, array) {
                        if (element.name == 'shadow-color') {
                            return element;
                        }
                    });
                if (el) {
                    val = GWTK.MapeditLegendDrawUtil.getColor(el.value);
                    result += ' ' + val;
                }
            }
            return result;
        },

        /**
         * Запросить стиль для Svg в виде параметров строки style
         * например "stroke:#00FFFE;stroke-width:11.00;stroke-dasharray:;stroke-opacity:1;stroke-dashoffset:0;stroke-linecap:;fill:#F6B26B;fill-opacity:1"
         * @returns {*}
         */
        getStyle_StringForSVG: function (jsonObject) {

            if (!jsonObject) {
                jsonObject = this.saveJSON();
            }

            var styleObject = this.setStyleObject(jsonObject);
            if (styleObject) {
                styleline = JSON.stringify(styleObject).replace(/{|}|\"/g, '');
                styleline = styleline.replace(/,/g, ';');
                return styleline;
            }

            // var styleObject = {};
            // if (jsonObject.options) {
            //
            //     if (jsonObject.options.optionsSimple) {
            //         $.extend(styleObject, jsonObject.options.optionsSimple);
            //     }
            //     if (jsonObject.options.optionsFont) {
            //         $.extend(styleObject, jsonObject.options.optionsFont);
            //     }
            //     if (jsonObject.options.optionsFill) {
            //         $.extend(styleObject, jsonObject.options.optionsFill);
            //     }
            //     // // optionsTextPath - отдельная обработка
            //     // if (jsonObject.options.optionsTextPath) {
            //     // }
            //
            //     var styleline = JSON.stringify(styleObject).replace(/{|}|\"/g, '');
            //     styleline = styleline.replace(/,/g, ';');
            //     return styleline;
            // }
            return '';

        },

        /**
         * Пример изображения в svg
         * @param w
         * @param h
         * @param options
         * @returns {string}
         */
        getExampleImageSvg: function (w, h, options, defsid) {
            w = (w) ? w : 50;
            h = (h) ? h : 30;

            var id = 'textpath' + (defsid ? defsid :'');
            var path = (this.options.optionsFont['writing-mode']) ?
                '<path id="' + id + '"  d="M' + 0 + ',' +  h + ' ' + w + ',' + h  + '"/>':
                // '<path id="textpath"  d="M' + 10 + ',' + (h*2-10) + ' ' + w*3 + ',' + '0'  + '"/>';
                '<path id="' + id + '"  d="M' + 0 + ',' + h + ' ' + w + ',' + '0'  + '"/>';

            var res =
                '<defs>' +
                    path +
                '</defs>' +
                '<text style="' + this.getStyle_StringForSVG() + '">' +
                    '<textPath xlink:href="#' + id + '">' + ((this.text) ? (this.text) : 'Text') + '</textPath>' +
                '</text>';

            return res;
        },

        /**
         * Создать объект параметров из объекта стиля
         * @param style
         */
        setOptionsFromStyle: function (style) {
            var options = {
                type: 'title',
                options: {
                    // цвет, толщина, прозрачность
                    'optionsSimple': JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsSimple)),
                    // параметры шрифта
                    'optionsFont': JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsFontDefault)),
                    // параметры обводки
                    'optionsFill': JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsFillDefault)),
                    // для описания Текста вдоль кривой
                    'optionsTextPath': JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsSimpleLine)),
                    // Параметры фона (в svg все сложно)
                    'background-color': ''
                }
            };

            if (style && style.style) {
                style = style.style;
                options.options = {
                    optionsSimple: {
                            'stroke':  (style['stroke']) ? style['stroke'] : '', //'#FFFFFF',,  // цвет
                            'stroke-width':  (style['stroke-width']) ? style['stroke-width'] : options.options.optionsSimple['stroke-width'],
                            'stroke-opacity':  (style['stroke-opacity']) ? style['stroke-opacity'] : options.options.optionsSimple['stroke-opacity']
                    },
                    optionsFill: {
                        'fill': (style['fill']) ? style['fill'] : '', //'#FFFFFF',
                        'fill-opacity': (style['fill-opacity']) ? style['fill-opacity'] : options.options.optionsFill['fill-opacity']
                    },
                    optionsFont: {
                        'font-family': (style['font-family']) ? style['font-family'] : options.options.optionsFont['font-family'],
                        'font-style': (style['font-style']) ? style['font-style'] : options.options.optionsFont['font-style'],
                        'font-weight': (style['font-weight']) ? style['font-weight'] : options.options.optionsFont['font-weight'],
                        'font-size': (style['font-size']) ? style['font-size'] : options.options.optionsFont['font-size'],
                        'font-stretch': (style['font-stretch']) ? style['font-stretch'] : options.options.optionsFont['font-stretch'],
                        'text-decoration': (style['text-decoration']) ? style['text-decoration'] : options.options.optionsFont['text-decoration'],
                        'letter-spacing': (style['letter-spacing']) ? style['letter-spacing'] : options.options.optionsFont['letter-spacing'],
                        'text-shadow': (style['text-shadow']) ? style['text-shadow'] : options.options.optionsFont['text-shadow'],
                        'writing-mode': (style['writing-mode']) ? style['writing-mode'] : options.options.optionsFont['writing-mode']
                    }
                }

            }
            return options;
        },

        /**
         * Сохранить в формате SLD
         * @param options = {
         *     type: 'title',
         *     options: {
         *         optionsSimple: {
         *              'stroke': GWTK.GRAPHIC.colorDefault,   // цвет
         *              'stroke-width': 1,          // толщина
         *              'stroke-dasharray': '',     // пунктир
         *              'stroke-opacity': 1,       // прозраность
         *              'stroke-dashoffset': 0,    // смещение
         *              'stroke-linecap': ''       // скругление углов
         *              },
         *         optionsFont: {
         *              'font-family': GWTK.GRAPHIC.fontFamilyDefault,   // имя шрифта
         *              'font-style': GWTK.GRAPHIC.fontStyleDefault,     // стиль шрифта: normal | italic | oblique
         *              'font-weight': GWTK.GRAPHIC.fontWeightDefault,   // насыщенность(толщина?) шрифта bold(полужирное)|bolder|lighter|normal(нормальное)|100|200|300|400|500|600|700|800|900
         *              'font-size': GWTK.GRAPHIC.fontSizeDefault,       // высота шрифта
         *              'font-stretch': GWTK.GRAPHIC.fontStretchDefault, // начертание (condensed(узкоеЮ)|normal(нормальное)|expanded(широкое)
         *              'text-decoration': 'none',                       // line-through (перечеркнутый) || overline (над текстом)|| underline(подчеркнутый )
         *              'letter-spacing': 0,                             // расстояние между буквами
         *              'text-shadow': '',                               // тень text-shadow: 1px 1px 1px #000000;
         *              'writing-mode': ''
         *         },
         *         optionsFill: {
         *            'fill': GWTK.GRAPHIC.colorDefault,
         *            'fill-opacity': 1
         *         },
         *         optionsTextPath: {
         *              'stroke': GWTK.GRAPHIC.colorDefault,   // цвет
         *              'stroke-width': 1,          // толщина
         *              'stroke-dasharray': '',     // пунктир
         *              'stroke-opacity': 1,       // прозраность
         *              'stroke-dashoffset': 0,    // смещение
         *              'stroke-linecap': ''       // скругление углов
         *              }
         *      }
         * }
         * @param noopacity = bool - не добавлять прозрачность
         * @returns {string} - строку следующей структуры
         * <FeatureTypeStyle>
         *  <Rule>
         *      <LineSymbolizer>
         *          <Stroke>
         *          </Stroke>
         *      </LineSymbolizer>
         *      <TextSymbolizer>
         *          <Fill>
         *              <CssParameter name="fill">#000000</CssParameter>
         *          </Fill>
         *          <Font>
         *              <CssParameter name="font-family">Arial</CssParameter>
         *              <CssParameter name="font-size">11</CssParameter>
         *              <CssParameter name="font-style">normal</CssParameter>
         *              <CssParameter name="font-weight">bold</CssParameter>
         *          </Font>
         *      </TextSymbolizer>
         *  </Rule>
         * </FeatureTypeStyle>
         */
        saveSLD: function(options, noopacity) {

            var str_result = '';
            if (!options || options.type != 'title' || !options.options) {
                return str_result;
            }

            // Заливка (цвет и прозрачность текста)
            var strFillSLD = (options.options.optionsFill) ?
                GWTK.MapeditLegendDraw_Polygon.prototype.getFillSLD(options.options.optionsFill, noopacity) : '',
            // Параметры шрифта
               strCssFontSLD = (options.options.optionsFont) ?
                   GWTK.MapeditLegendDraw_SimpleLine.prototype.getCssParametersSLD(options.options.optionsFont) : '';
            // Параметры строки (контура)
            if (options.options.optionsSimple && !options.options.optionsSimple.stroke){
                options.options.optionsSimple['stroke-width'] = 0;
                options.options.optionsSimple['stroke-opacity'] = 0;
               }
            var strStrokeSLD = (options.options.optionsSimple) ?
                GWTK.MapeditLegendDraw_SimpleLine.prototype.getCssParametersSLD(options.options.optionsSimple):
                '';

            if (strFillSLD || strCssFontSLD) {
                str_result = '<FeatureTypeStyle><Rule><LineSymbolizer><Stroke></Stroke></LineSymbolizer><TextSymbolizer>';

                if (strCssFontSLD || strStrokeSLD) {
                    str_result += '<Font>' + strCssFontSLD + strStrokeSLD + '</Font>';
                }
                if (strFillSLD) {
                    str_result += strFillSLD;
                }
                str_result += '</TextSymbolizer></Rule></FeatureTypeStyle>';
            }
            return str_result;
        }



    };


    /**
     *  класс объекта Подпись
     * @param options { // Исходные параметры подписи
     * }
     * @param classifierLayer - Ключ слоя в классификаторе
     * @constructor
     */

    GWTK.MapeditLegendDraw_Marker = function (options, classifierLayer) {

        /**
         * TODO:  Доделать полноценный маркер
         */
        this.type = 'point';
        this.classifierLayer = (classifierLayer) ? classifierLayer : '';

        this.svgNS = "http://www.w3.org/2000/svg";

        // Параметры ммаркеров по умолчанию
        this.defaultMarkers  = [
                {
                    "id": 0,
                    "text": w2utils.lang("none"),
                    "value": ""
                },
                {
                    "id": 1,
                    "text": w2utils.lang("Star"),
                    "value": "M2 14L30 14L8 30L16 2L24 30 z"
                },
                {
                    "id": 2,
                    "text": w2utils.lang("Triangle"),
                    "value": "M16 2L2 30L30 30 z"
                },
                {
                    "id": 3,
                    "text": w2utils.lang("Circle"),
                    "value": "M 2 16 a 7 7 0 0 0 28 0M 2 16 a 7 7 0 0 1 28 0"
                },
                {
                    "id": 4,
                    "text": w2utils.lang("Square"),
                    "value": "M 4 4L28 4L28 28L4 28 z"
                },
                {
                    "id": 5,
                    "text": w2utils.lang("Rhombus"),
                    "value": "M 16 2L26 16L16 30L6 16 z"
                }
            ];

        // var optionsFill = GWTK.GRAPHIC.optionsFillDefault;
        // optionsFill["fill-opacity"] = 0.75;
        this.options = {
            optionsLine: new GWTK.MapeditLegendDraw_Line(),
            optionsFill: JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsFillDefault)), // параметры заливки
            optionsMarker: JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsMarkerDefault))
        };

        if (options) {
            if (options.optionsLine && options.optionsLine.clone) {
                this.options.optionsLine = options.optionsLine.clone();
            }
            if (options.optionsFill) {
                this.options.optionsFill['fill'] = (options.optionsFill['fill']) ? options.optionsFill['fill'] : GWTK.GRAPHIC.colorDefault;
                this.options.optionsFill['fill-opacity'] = (options.optionsFill['fill-opacity']) ? options.optionsFill['fill-opacity'] : 1;
            }
            if (options.optionsMarker) {
                this.options.optionsMarker = JSON.parse(JSON.stringify(options.optionsMarker));
            }
        }

    };

    GWTK.MapeditLegendDraw_Marker.prototype = {

        /**
         * Получение стилей для линии
         * @param image
         * @returns {string}
         */
        getStyleLine: function () {
            // Получить стиль линии
            var style = GWTK.MapeditLegendDraw_SimpleLine.prototype.getStyle(this.options.optionsLine.options[0].options);
            return style;
        },

        /**
         * Получение стилей для линии
         * @param image
         * @returns {string}
         */
        getStyleFill: function (options) {
            options = (options) ? options : this.options;

            var style = '';
            if (options && options.optionsFill && options.optionsFill['fill']) {
                style += 'fill:' + options.optionsFill['fill'] + ';';
            }
            if (options && options.optionsFill && options.optionsFill['fill-opacity']) {
                style += 'fill-opacity:' + options.optionsFill ['fill-opacity'] + ';';
            }
            return style;
        },

        /**
         * Пример изображения в svg
         * @param w
         * @param h
         * @param options
         * @returns {string}
         */
        getExampleImageSvg: function (w, h, options, defsid) {
            w = (w) ? w : 50;
            h = (h) ? h : 30;

            var style = ' style = "' + this.getStyleLine() + this.getStyleFill() +'" ';

            var width = this.options.optionsMarker.width * 2,
                height = this.options.optionsMarker.height * 2,
                refX = parseFloat(this.options.optionsMarker["refX"]) || width / 2 + "",
                refY = parseFloat(this.options.optionsMarker["refY"]) || height / 2 + "",
                id = 'markerdef' + (defsid ? defsid : '');

            var marker = '<marker viewBox="0 0 ' + width + ' ' + height +
                        '" id="' + id + '"' +
                        '" refX="' + refX + '" refY="' + refY +
                        '" markerUnits="' + this.options.optionsMarker.markerUnits +
                        '" markerWidth="' + this.options.optionsMarker.markerWidth +
                        '" markerHeight="' + this.options.optionsMarker.markerHeight +
                        '" markerInitWidth="' + this.options.optionsMarker.markerInitWidth +
                        '" markerInitHeight="' + this.options.optionsMarker.markerInitHeight +
                        '">' +
                            '<path ' + style +
                // 'stroke="#7F7FFF" stroke-width="2" stroke-dasharray="none" stroke-opacity="0.75" fill="#7F7FFF" fill-opacity="0.3" pointer-events="none" ' +
                            'd="' + this.options.optionsMarker.path +'">' +
                            '</path>'+
                        '</marker>';
            var res =
                '<defs>' +
                    marker +
                '</defs>' +
                '<path d="M' + w/2 + ' ' + h/2 + '" ' + style +
                    '"marker-start="url(#' + id + ')" marker-end="url(#' + id + ')" >' +
                '</path>';

            return res;
        },

        /**
         * Пример изображения в svg, используется вместо getExampleImageSvg,
         * поскольку в Firefox динамически не отрисовываются элементы из defs
         * @param w
         * @param h
         * @param options
         * @returns {Object} - Элемент Svg
         */
        createSvgExampleElement: function (w, h, options, defsid) {

            w = (w) ? w : 50;
            h = (h) ? h : 30;

            var svg = document.createElementNS(this.svgNS, "svg");
            svg.setAttributeNS("", "viewBox", "0 0 " + w + " " + h + "");
            svg.setAttributeNS("", "width", w);
            svg.setAttributeNS("", "height", h);

            var style = this.getStyleLine() + this.getStyleFill();

            var width = this.options.optionsMarker.width * 2,
                height = this.options.optionsMarker.height * 2,
                refX = parseFloat(this.options.optionsMarker["refX"]) || width / 2 + "",
                refY = parseFloat(this.options.optionsMarker["refY"]) || height / 2 + "",
                id = 'markerdef' + (defsid ? defsid : '');

            var defs = document.createElementNS(this.svgNS, "defs");
            $(svg).append(defs);

            var marker = document.createElementNS(this.svgNS, "marker");
            marker.setAttributeNS(null, 'viewBox', "0 0 " + width + " " + height + "");
            marker.setAttributeNS(null, 'refX', refX);
            marker.setAttributeNS(null, 'refY', refY);
            marker.setAttributeNS(null, 'markerUnits', this.options.optionsMarker.markerUnits);
            marker.setAttributeNS(null, 'markerWidth', this.options.optionsMarker.markerWidth);
            marker.setAttributeNS(null, 'markerHeight', this.options.optionsMarker.markerHeight);
            marker.setAttributeNS(null, 'id', id);

            var path = document.createElementNS(this.svgNS, "path");
            path.setAttributeNS(null, 'style', style);
            path.setAttributeNS(null, 'd', this.options.optionsMarker.path);
            marker.appendChild(path);
            defs.append(marker);

            var path = document.createElementNS(this.svgNS, "path");
            path.setAttributeNS(null, 'style', style);
            path.setAttributeNS(null, 'd', 'M' + w/2 + ' ' + h/2);
            path.setAttributeNS(null, 'marker-start', 'url(#' + id + ')');
            path.setAttributeNS(null, 'marker-end', 'url(#' + id + ')');

            svg.appendChild(path);
            return svg;
        },

        /**
         * Найти описание маркера по значению
         * @param value
         * @returns {{id, text, value}|*}
         */
        findMarkerDefault: function(value) {
            for(var i = 0; i < this.defaultMarkers.length; i++) {
                if (this.defaultMarkers[i].value == value) {
                    return this.defaultMarkers[i];
                }
            }
            return this.defaultMarkers[0];
        },

        /**
         * Запросить значеие
         * @param index
         * @param key
         * @param val
         */
        get: function (type, index, key) {
            if (!key) {
                return;
            }
            switch (type) {
                case 'line':
                    return this.options.optionsLine.get(type, index, key);
                case 'fill':
                    return this.options.optionsFill[key];
                case 'path':
                    return this.options.optionsMarker[key];
            }
        },

        /**
         * Установить значеие
         * @param index
         * @param key
         * @param val
         */
        set: function (type, index, key, val) {
            if (!key) {
                return;
            }
            switch (type) {
                case 'line':
                    return this.options.optionsLine.set(type, index, key, val);
                case 'fill':
                    return this.options.optionsFill[key] = val;
                case 'path':
                    return this.options.optionsMarker[key] = val;
            }
        },

        /**
         * Сохранение параметров объетка в JSON
         */
        saveJSON: function () {
            var objectTemplate = {
                type: this.type,
                classifierLayer: this.classifierLayer,
                options: {
                    'optionsLine': this.options.optionsLine.saveJSON(),
                    'optionsFill': JSON.parse(JSON.stringify(this.options.optionsFill)),
                    'optionsMarker': JSON.parse(JSON.stringify(this.options.optionsMarker))
                }
            }

            return objectTemplate;
        },

        /**
         * Загрузка параметров из JSON
         */
        loadJSON: function (options) {
            if (options && options.type == this.type && options.options) {
                if (options.options.optionsLine) {
                    this.options.optionsLine = new GWTK.MapeditLegendDraw_Line();
                    this.options.optionsLine.loadJSON(options.options.optionsLine)
                }
                if (options.options.optionsFill) {
                    this.options.optionsFill = JSON.parse(JSON.stringify(options.options.optionsFill));
                }
                if (options.options.optionsMarker) {
                    this.options.optionsMarker = JSON.parse(JSON.stringify(options.options.optionsMarker));
                }
                if (options.classifierLayer) {
                    this.classifierLayer = options.classifierLayer;
                }
            }
        },

        clone: function () {
            return new GWTK.MapeditLegendDraw_Marker(this.options, this.classifierLayer);
        },

        /**
         * Запросить объект стиля (включает все атрибуты в один JSON объект)
         * @returns {*}
         */
        setStyleObject: function (jsonObject) {
            if (!jsonObject) {
                jsonObject = this.saveJSON();
            }
            var styleObject = {};
            if (jsonObject.options) {
                if (jsonObject.options.optionsLine && jsonObject.options.optionsLine.options &&
                    jsonObject.options.optionsLine.options.length > 0) {
                    if (jsonObject.options.optionsLine.options[0].type == 'simpleline') {
                        $.extend(styleObject, jsonObject.options.optionsLine.options[0].options);
                    }
                }
                if (jsonObject.options.optionsFill) {
                    $.extend(styleObject, jsonObject.options.optionsFill);
                }
                if (jsonObject.options.optionsMarker) {
                    styleObject['marker'] = jsonObject.options.optionsMarker.path; // Заглушка
//                    styleObject['marker'] = JSON.parse(JSON.stringify(jsonObject.options.optionsMarker));
                }

                return styleObject;
            }
            return {};
        },

        /**
         * Запросить стиль для Svg в виде параметров строки style
         * например "stroke:#00FFFE;stroke-width:11.00;stroke-dasharray:;stroke-opacity:1;stroke-dashoffset:0;stroke-linecap:;fill:#F6B26B;fill-opacity:1"
         * @returns {*}
         */
        getStyle_StringForSVG: function (jsonObject) {
            if (!jsonObject) {
                jsonObject = this.saveJSON();
            }

            var styleObject = {};
            if (jsonObject.options) {
                if (jsonObject.options.optionsLine && jsonObject.options.optionsLine.options && jsonObject.options.optionsLine.options.length > 0) {
                    if (jsonObject.options.optionsLine.options[0].type == 'simpleline') {
                        $.extend(styleObject, jsonObject.options.optionsLine.options[0].options);
                    }
                }
                if (jsonObject.options.optionsFill) {
                    $.extend(styleObject, jsonObject.options.optionsFill);
                }

                var styleline = JSON.stringify(styleObject).replace(/{|}|\"/g, '');
                styleline = styleline.replace(/,/g, ';');
                return styleline;
            }
            return '';

        },

        /**
         * Создать объект параметров из объекта стиля
         * @param style
         */
        setOptionsFromStyle: function (style) {
            var  options = {
                type: 'point',
                options: {
                    optionsLine: GWTK.MapeditLegendDraw_Line.prototype.setOptionsFromStyle(),
                    optionsFill: {
                        'fill': GWTK.GRAPHIC.colorDefault, //'#FFFFFF',
                        'fill-opacity': 1
                    },
                    optionsMarker: JSON.parse(JSON.stringify(GWTK.GRAPHIC.optionsMarkerDefault))
                }
            };

            if (style && style.style) {
                options.options.optionsLine = GWTK.MapeditLegendDraw_Line.prototype.setOptionsFromStyle(style);
                style = style.style;
                options.options.optionsFill  = {
                        'fill': (style['fill']) ? style['fill'] : options.options.optionsFill['fill'], //'#FFFFFF',
                        'fill-opacity': (style['fill-opacity']) ? style['fill-opacity'] : options.options.optionsFill['fill-opacity']
                    };
                if (style.marker) {
                    options.options.optionsMarker.path = style.marker;
                }
            };

            return options;
        },


        /**
         * Сохранить в формате SLD
         * @param options = {
         *     type: 'title',
         *     options: {
         *         optionsLine: {
         *             type: 'line',
         *             options: [
         *                 {
         *                  type: 'simpleline',
         *                  options: {
         *                      'stroke': GWTK.GRAPHIC.colorDefault,   // цвет
         *                      'stroke-width': 1,          // толщина
         *                      'stroke-dasharray': '',     // пунктир
         *                      'stroke-opacity': 1,       // прозраность
         *                      'stroke-dashoffset': 0,    // смещение
         *                      'stroke-linecap': ''       // скругление углов
         *                      }
         *                 },...
         *             ]
         *         },
         *         optionsFill: {
         *            'fill': GWTK.GRAPHIC.colorDefault,
         *            'fill-opacity': 1
         *         },
         *         optionsMarker: {
         *              path: this.defaultMarkers[3].value,
         *              width: 32,
         *              height: 32,
         *              refX: 16,
         *              refY: 16,
         *              markerUnits: "userSpaceOnUse",
         *              markerWidth: 32,
         *              markerHeight: 32,
         *              markerInitWidth: 32,
         *              markerInitHeight: 32,
         *              image: ''
         *          }
         *      }
         * }
         * @returns {string} - строку следующей структуры
         */
        saveSLD: function(options) {

            var str_result = '';
            if (!options || options.type != 'point' || !options.options) {
                return str_result;
            }

            // Заливка (цвет и прозрачность текста)
            var strFillSLD = (options.options.optionsFill) ?
                GWTK.MapeditLegendDraw_Polygon.prototype.getFillSLD(options.options.optionsFill) : '',
                // Параметры шрифта
                strCssFontSLD = (options.options.optionsFont) ?
                    GWTK.MapeditLegendDraw_SimpleLine.prototype.getCssParametersSLD(options.options.optionsFont) : '';
            // // Параметры строки
            //    strStrokeSLD = (options.options.optionsSimple) ?
            //     GWTK.MapeditLegendDraw_SimpleLine.prototype.getStrokeSLD(options.options.optionsSimple):
            //     '';

            if (strFillSLD || strCssFontSLD) {
                str_result = '<FeatureTypeStyle><Rule><LineSymbolizer><Stroke></Stroke></LineSymbolizer><TextSymbolizer>';

                if (strCssFontSLD) {
                    str_result += '<Font>' + strCssFontSLD + '</Font>';
                }
                if (strFillSLD) {
                    str_result += strFillSLD;
                }
                str_result += '</TextSymbolizer></Rule></FeatureTypeStyle>';
            }
            return str_result;
        }

    };

}