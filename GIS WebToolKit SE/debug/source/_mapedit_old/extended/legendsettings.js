/*************************************** Соколова **** 27/08/20 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*      Настройки классифиатора карты на отображение объектов       *
*                                                                  *
*******************************************************************/


if (window.GWTK) {
    // Класс для настройки легенды
    /**
     *
     * @param map - карта
     * @param options {
     *      legend - легенда карты из объекта GWTK.classifier
     *      parentSelector - родительский селектор
     *      legendtemplates - массив параметров настройки легенды (GWTK.LEGEND.templateDefault)
     *      currenttemplate - индекс текущешл шаблоны (с 0)
     *      id - идентификатор объекта для GWTK.legendSettingsControl.id
     *      fn_save - callback функция при сохранении данных
     *      buttons{
     *           "close" : true,
     *           "save" : true
     *       } - наличие кнопок
     *      }
     * @constructor
     */
    GWTK.LegendSettingsControl = function (map, options) {
        this.toolname = 'legendsettings';
        this.error = true;

        this.map = map;
        if (!this.map || this.map instanceof GWTK.Map == false) {
            return;
        }

        this.id = (options && options.id) ? this.options.id : this.toolname + GWTK.Util.randomInt(150, 200);

        this.w2ui = {
            'gridId' : this.id + 'grid',
            'sidebarId' : this.id + 'sidebar',
            'localId' : this.id + 'local'
        }
        if (options){
            this.init(options);
        }

    };

    GWTK.LegendSettingsControl.prototype = {

        init: function(options) {
            this.options = {
                buttons: {
                    "close" : true,
                    "save" : true
                }
            };

            if (options) {
                $.extend(this.options, options);
            }

            if (this.options.legend && this.options.legend.length > 0) {
                this.legend = JSON.parse(JSON.stringify(this.options.legend));
            }
            else {
                return;
            }

            this.parent = (this.options.parentSelector) ? $(this.options.parentSelector) : $(this.map.mapPane);

            this.legendtemplates = (this.options.legendtemplates) ?
                JSON.parse(JSON.stringify(this.options.legendtemplates)) :
                JSON.parse(JSON.stringify(GWTK.LEGEND.templateDefault));
            this.currenttemplate = (this.options.currenttemplate && this.legendtemplates.length > this.options.currenttemplate ) ? this.options.currenttemplate : 0;

            //Локализации
            this.itemsLocal = JSON.parse(JSON.stringify(this.legendtemplates[this.currenttemplate < 0 ? 0 : this.currenttemplate ].locals));
            this.recordlocal = [];
            for (var key in this.itemsLocal) {
                this.recordlocal.push({
                        recid: key,
                        name: GWTK.classifier.prototype.getlocalName(key)
                    }
                );
            }

        },

        /**
         * Показать
         * @param options - настройки
         */
        show: function(options){
            this.destroy();

            if (options) {
                this.init(options);
            }
            this.isChange = false;
            this.formCreation();
        },

        /**
         * Скрыть
         */
        hide: function(){
            this.destroy();
        },

        /**
         * Создать форму в заданном контейнере
         */
        formCreation: function () {

            var html =
                '<div id="' +  this.id + '" class="w2ui-page page-0 ' + this.toolname + '" style="margin:0px;padding:0px; width:100%;">' +

                '<div class="divFlex" style="width: 100%; margin-right: 0px; height: 100%; flex-direction: column;">' +
                    '<div id="' + this.w2ui.gridId + '" class="divFlex" style="height:30%; width:100%;">' +
                    '</div>' +
                    '<div class="divFlex" style="height:70%; width:100%;">' +
                        '<div id="' + this.w2ui.sidebarId + '" class="divFlex" style="height:100%; width:70%;flex-direction: column; ">' +
                        '</div>' +
                        '<div id="' + this.w2ui.localId + '" class="divFlex" style="height:100%; width:30%;flex-direction: column; ">' +
                        '</div>' +
                '</div>' +
                '</div>' +

                '</div>',
                htmlbuttons = '';

            if (this.options.buttons) {
                for (var key in this.options.buttons) {
                    if (this.options.buttons[key] == true) {
                        switch (key) {
                            case 'close':
                                htmlbuttons += '<button class="btn" name="close">' + w2utils.lang('Cancel') + '</button>';
                                break;
                            case 'save':
                                htmlbuttons += '<button class="btn" name="save">' + w2utils.lang('Save') + '</button>';
                                break;
                        }
                    }
                }
            }

            if (htmlbuttons.length > 0) {
                html += '<div class="w2ui-buttons">' + htmlbuttons + '</div>';
            }

            this.parent.w2form({
                name: this.id,
                formHTML: html,
                focus: -1,
                actions: {
                    "save": GWTK.Util.bind(function (event) {
                        if (this.isChange) {
                            this.updateTemplate();
                        }
                        this.close();
                        if (this.options.fn_save) {
                            this.options.fn_save(JSON.parse(JSON.stringify(this.legendtemplates)), this.currenttemplate);
                        }
                    }, this),
                    "close": GWTK.Util.bind(function (event) {
                        this.close();
                    }, this)
                }
            });

            // Добавить грид
            var records = [];
            for(var i = 0; i < this.legendtemplates.length; i++) {
                records.push({
                    recid: i,
                    name: this.legendtemplates[i].name
                    }
                );
            }

            $('#' + this.w2ui.gridId).w2grid({
                header  : w2utils.lang('Layouts'),
                show : {
                    header : true,
                    toolbar: true,
                    toolbarAdd: true,
                    toolbarDelete: true,
                    lineNumbers: true,
                    toolbarSave: false,
                    toolbarEdit: false,
                    toolbarReload: false,
                    toolbarColumns: false,
                    toolbarSearch: false,
                    columnHeaders: false
                },
                name: this.w2ui.gridId,
                columns: [{
                    field: 'name',
                    size: '100%',
                    editable: {
                        type: 'text'  // type of the field (see below)
                    }
                }],
                multiSelect: false,
                records: records
                , onDelete: function(event) {
                    var record = this.records[this.getSelection(true)[0]];
                    if (record && record['recid'] == 0) {
                        event.preventDefault();
                    }
                    var index = record['recid'];
                    event.onComplete = function(event){
                        // Перестроим массив настроек
                        this.legendSetting.legendtemplates = this.legendSetting.legendtemplates.splice(index, 1);
                        this.legendSetting.currenttemplate = index;
                        if (index >= this.legendSetting.legendtemplates.length) {
                            this.legendSetting.currenttemplate = index - 1;
                        }
                        this.select(this.legendSetting.currenttemplate);
                    };
                }
                , onAdd: function(event) {
                    if (this.legendSetting.isChange){
                        this.legendSetting.updateTemplate();
                    }

                    this.legendSetting.legendtemplates.push(JSON.parse(JSON.stringify(GWTK.LEGEND.templateDefault)));
                    // this.legendSetting.currenttemplate = this.legendSetting.legendtemplates.length - 1;
                    this.add({
                        recid: this.records.length,
                        name: this.legendSetting.legendtemplates[this.legendSetting.currenttemplate].name
                    });
                    this.select(this.legendSetting.legendtemplates.length - 1);
                }
                , onChange: function(event) {
                    event.onComplete = function (event) {
                        this.legendSetting.legendtemplates[this.legendSetting.currenttemplate].name = event.value_new;
                    }
                }
                , onSelect: function(event) {
                    // Запрос на сохраненне
                    if (this.legendSetting.isChange) {
                        this.legendSetting.updateTemplate();
                    }

                    event.onComplete = function (event) {
                        var selected = this.getSelection(),
                            legendtemplate, local, isLocal;

                        if (!selected || selected.length == 0) {
                            selected = [0];
                        }

                        if (!this.legendSetting.isInit && this.legendSetting.currenttemplate == selected[0]) {
                            return;
                        }

                        this.legendSetting.currenttemplate = selected[0];
                        this.legendSetting.isChange = false;
                        this.legendSetting.isInit = true;
                        legendtemplate = this.legendSetting.legendtemplates[this.legendSetting.currenttemplate];

                        // Сменить sidebar
                        this.legendSetting.setItems(this.legendSetting.legend, legendtemplate);
                        this.legendSetting.initSidebar();

                        // выставим select в гриде локализации
                        local = w2ui[this.legendSetting.w2ui.localId];
                        if (local) {
                            local.selectNone();
                            for (var key in this.legendSetting.itemsLocal) {
                                isLocal = this.legendSetting.getVisible('local', key, legendtemplate);
                                if (isLocal.visible) {
                                    local.select(key);
                                }
                            }
                        }

                        this.legendSetting.isInit = false;
                    }
                }
            });

            // Настроить sidebar
            this.createSidebar(this.legendtemplates[this.currenttemplate]);


            $('#' + this.w2ui.localId).w2grid({
                header  : w2utils.lang('Type'),
                show : {
                    header : true,
                    toolbar: false,
                    selectColumn: true
                },
                multiSelect: true,
                name: this.w2ui.localId,
                columns: [
                    {
                    field: 'name',
                    caption: w2utils.lang("Name"),
                    size: '100%'
                }],
                records: this.recordlocal
                , onSelect: function(event) {
                    event.onComplete = function () {
                        // Если это не инициылизация нового набора
                        if (!this.legendSetting.isInit) {
                            this.legendSetting.isChange = true;
                            var selected = this.getSelection();
                            this.legendSetting.setItemsLocal(this.legendSetting.itemsLocal, selected, 1);
                            this.legendSetting.checkItems('local', selected, true);
                        }
                    }
               }
                , onUnselect: function (event) {
                    event.onComplete = function () {
                        if (!this.legendSetting.isInit) {
                            var selected = this.getSelection(),
                                noselected = [];
                            if (selected.length == 0) {
                                for (var key in this.legendSetting.itemsLocal) {
                                    noselected.push(key);
                                }
                            }
                            else {
                                for (var key in this.legendSetting.itemsLocal) {
                                    var find = false;
                                    for(var i = 0; i < selected.length; i++) {
                                        if (key == selected[i]) {
                                            find = true;
                                            break;
                                        }
                                    }
                                    if (!find) {
                                        noselected.push(key);
                                    }

                                }
                            }
                            this.legendSetting.setItemsLocal(this.legendSetting.itemsLocal, noselected, 0);
                            this.legendSetting.isChange = true;
                            this.legendSetting.checkItems('local', noselected, false);

                        }
                    }
                }
            });

           var grid = w2ui[this.w2ui.localId];
           if (grid){
               grid.legendSetting = this;
           }
           grid =  w2ui[this.w2ui.gridId];

           if (grid) {
               grid.legendSetting = this;
               this.isInit = true;
               grid.select(this.currenttemplate);
           }


        },


        /**
         * Создать Sidebar
         * @param legendtemplate
         */
        createSidebar: function(legendtemplate) {

            $('#' + this.w2ui.sidebarId).w2sidebarGWTK({
                name: this.w2ui.sidebarId,
                hideChecked: false,
                returnElement: this.setLayerVisible,
                returnCondition: function (node) {
                    if (node.gClickable || node.isLayer) {
                        return true;
                    }
                }
                , onClick: function (event) {
                    var node = event.node,
                        len, parent, nodes, k;

                    // При включении и выключении все дочерние node дубдируют состояние
                    this.legendSetting.checkNode(node, node.panischecked);
                    // if (node.nodes && (len = node.nodes.length) > 0) {
                    //     for (var i = 0; i < len; i++) {
                    //         this.legendSetting.checkNode(node.nodes[i], node.panischecked);
                    //     }
                    // }

                    // Обновить itemsLocal и грид с локализациями
                    this.legendSetting.updateParentItemsLocal();

                    if (node.panischecked) {
                        parent = node.parent;
                        while (parent) {
                            parent.panischecked = node.panischecked;
                            parent = parent.parent;
                        }
                    }
                    else {
                        // Если все node выключены, выключить и родительский узел
                        parent = node.parent;
                        while (parent) {
                            nodes = parent.nodes;
                            if (nodes && (len = nodes.length) > 0) {
                                k = -1;
                                for (var i = 0; i < len; i++) {
                                    if (nodes[i].panischecked) {
                                        k = i;
                                        break;
                                    }
                                }
                                if (k < 0) {
                                    parent.panischecked = false;
                                }
                            }
                            parent = parent.parent;
                        }
                    }

                    this.legendSetting.isChange = true;
                    this.refresh();
                }
            });

            var sidebar = w2ui[this.w2ui.sidebarId];
            if (sidebar) {
                sidebar.legendSetting = this;
            }

        },

        setItems: function(legend, legendtemplate) {
            if (legendtemplate && legendtemplate.locals) {
                this.itemsLocal = JSON.parse(JSON.stringify(legendtemplate.locals));
            }

            // Заполним реальные данные
            this.items = {
                id: 'layers',
                text: w2utils.lang("Layers"),
                expanded: true,
                gClickable: true,
                panischecked: true,
                nodes:[]
                };
            var node, k = 0, isvisible = false,
                count = legend.length,
                isLayer, isKey, isLocal ;
            for (var i = 0; i < count; i++) {
                if (!legend[i].nodes || legend[i].nodes.length == 0)
                    continue;
                // Найдем слой в макете
                isLayer = this.getVisible('layer', legend[i].code.toLowerCase(), legendtemplate);

                var itemsel = {};
                itemsel.id = legend[i].id;
                //itemsel.code = legend[i].code;
                itemsel.key = legend[i].code;
                itemsel.type = 'layer';
                itemsel.text = legend[i].text;
                itemsel.img = legend[i].img;
                itemsel.expanded = legend[i].expanded;

                itemsel.gClickable = true;
                if (isLayer.id == legend[i].code.toLowerCase()) {
                    if (isLayer.visible) {
                        itemsel.panischecked = true;
                    }
                    else {
                        itemsel.panischecked = false
                    }
                }
                itemsel.nodes = new Array();

                var itemslocal = {};
                for(var key in this.itemsLocal){
                    itemslocal[key] = 0;
                }

                for (var j = 0; j < legend[i].nodes.length; j++) {
                    node = legend[i].nodes[j];
                    var item = JSON.parse(JSON.stringify(node))
                    item.key = item.key;
                    item.id = item.id;
                    item.type = 'key';
                    item.expanded = true;
                    item.gClickable = true;
                    item.cssclass = item.img;
                    // Разберемся с локализацией
                    if (!itemslocal[item.local]){
                        isLocal = this.getVisible('local', item.local, legendtemplate);
                        itemslocal[item.local] = {
                            id: itemsel.key + item.local,
                            //code: item.local,
                            key: item.local,
                            type: 'local',
                            text: GWTK.classifier.prototype.getlocalName(item.local),
                            nodes:[],
                            expanded:true,
                            gClickable: true,
                            panischecked: (itemsel.panischecked && isLocal.visible)
                        }
                        itemsel.nodes.push(itemslocal[item.local]);
                        this.itemsLocal[item.local].detail = {};
                    }

                    item.panischecked = false;
                    if (itemslocal[item.local].panischecked){
                        isKey = this.getVisible('key', item.key, legendtemplate);
                        if (isKey.visible) {
                            item.panischecked = isKey.visible;
                            isvisible = true;
                        }
                    }
                    this.itemsLocal[item.local].detail[item.id] = item.panischecked;
                    itemslocal[item.local].nodes.push(item);
                }

                if (itemsel.nodes.length > 0) {
                    this.items.nodes[k] = itemsel;
                    k++;
                }
            }

            // Видимость корня
            this.items.panischecked = isvisible;
        },

        /**
         * Запросить items для отображения в легенде редактора
         * @param legendtemplate - шаблон
         * @returns {*}
         */
        getSavedTemplateItems: function(legend, legendtemplate, empty){
            var items = [];

            legend = (legend) ? legend : this.legend;
            if (legend && legendtemplate) {

                var node, k = 0,
                    count = legend.length,
                    isLayer, isKey;

                for (var i = 0; i < count; i++) {
                    if (!legend[i].nodes || legend[i].nodes.length == 0 || !legend[i].code)

                        continue;
                    // Найдем слой в макете
                    isLayer = this.getVisible('layer', legend[i].code.toLowerCase(), legendtemplate);

                    var itemsel = {};
                    itemsel.id = legend[i].id;
                    itemsel.code = legend[i].code;
                    itemsel.text = legend[i].text;
                    itemsel.img = legend[i].img;
                    itemsel.expanded = legend[i].expanded;
                    if (!isLayer.visible) {
                        continue;
                    }
                    itemsel.nodes = new Array();
                    if (empty) {
                        itemsel.nodes.push({id:i});
                    }
                    else {
                        for (var j = 0; j < legend[i].nodes.length; j++) {
                            node = legend[i].nodes[j];
                            var item = JSON.parse(JSON.stringify(node));
                            isKey = this.getVisible('local', item.local, legendtemplate);
                            if (!isKey.visible) {
                                continue;
                            }
                            isKey = this.getVisible('key', item.key, legendtemplate);
                            if (!isKey.visible) {
                                continue;
                            }
                            itemsel.nodes.push(item);
                        }
                    }

                     if (itemsel.nodes.length > 0) {
                        items[k] = itemsel;
                        k++;
                     }
                }
            }

            return items;
        },


        /**
         * Запросить видимость элемента
         * @param type ('local', 'layer', 'key')
         * @param id - идентификатор
         * @param legendtemplate - шаблон
         * @returns {{id: *, visible: boolean, novisible: boolean}}
         */
        getVisible: function(type, id, legendtemplate){
            var data = {
                id: id,
                visible: true,
                novisible: false
            };

            if (legendtemplate) {

                var types;
                switch (type) {
                    case 'layer':
                        types = legendtemplate.layers;
                        break;
                    case 'key':
                        types = legendtemplate.keys;
                        break;
                    case 'local':
                        types = legendtemplate.locals;
                        if (types){
                            if (legendtemplate.locals[id].value){
                                data.visible = true;
                                data.novisible = false;
                            }
                            else {
                                data.novisible = true;
                                data.visible = false;
                            }
                        }
                        return data;
                }

                if (types && (types.visible || types.novisible)) {
                    var find = false;
                    for (var i = 0; i < types.visible.length; i++) {
                        if (types.visible[i].toLowerCase() == data.id) {
                            data.visible = true;
                            data.novisible = false;
                            find = true;
                            break;
                        }
                    }
                    // Если есть видимые и не нашли, то их нет
                    if (types.visible.length > 0 && !find ) {
                        data.visible = false;
                    }
                    else {
                        for (var i = 0; i < types.novisible.length; i++) {
                            if (types.novisible[i].toLowerCase() == data.id) {
                                data.visible = false;
                                data.novisible = true;
                                break;
                            }
                        }
                    }
                }
            }
            return data;
        },

        setItemsLocal: function(itemslocal, keys, check){
            if (!itemslocal || !keys || keys.length == 0){
                return;
            }
            var find;
            for(var key in itemslocal) {
                find = keys.find(
                    function (element) {
                        if (element == key)
                            return element;
                    });
                if (find) {
                        itemslocal[key].value = check;
                        // Если есть детализация, то пройтись по ней
                        if (itemslocal[key].detail) {
                            for(var keydetail in itemslocal[key].detail) {
                                itemslocal[key].detail[keydetail] = check;
                            }
                        }
                    }
                }

        },

        updateParentItemsLocal: function(itemslocal){
            itemslocal = (itemslocal) ? itemslocal : this.itemsLocal;
            var local = w2ui[this.w2ui.localId];
            for(var key in itemslocal) {
                if (itemslocal[key].detail) {
                    var check = false;
                    for(var keydetail in itemslocal[key].detail) {
                        //check &= itemslocal[key].detail[keydetail];
                        check |= itemslocal[key].detail[keydetail];
                     }
                    // Выставим значение в гриде локализаций
                    if (local) {
                        this.isInit = true;
                        if (check) {
                            local.select(key);
                        }
                        else {
                            local.unselect(key);
                        }
                        this.isInit = false;
                    }
                    itemslocal[key].value = check;
                }
            }

        },

        // /**
        //  * Установить значение видимости в шаблоне
        //  * @param type - ('local', 'layer', 'key')
        //  * @param ids - массив идентификаторов
        //  * @param legendtemplate - шаблон
        //  * @param visible - признак видимоости или отсутствие видисости (true/false)
        //  */
        // setVisible: function(type, ids, legendtemplate, visible){
        //
        //     if (legendtemplate && ids && ids.length > 0) {
        //
        //         var types, data;
        //         switch (type) {
        //             case 'layer':
        //                 types = legendtemplate.layers;
        //                 break;
        //             case 'key':
        //                 types = legendtemplate.keys;
        //                 break;
        //             case 'local':
        //                 types = legendtemplate.locals;
        //                 break;
        //         }
        //
        //         if (types) {
        //             types.visible = [];
        //             types.novisible = [];
        //             if (visible) {
        //                 data = types.visible;
        //             }
        //             else {
        //                 data = types.novisible;
        //             }
        //             for(var i = 0; i < ids.length; i++ ) {
        //                 data.push(ids[i]);
        //             }
        //         }
        //     }
        // },

        /**
         * Инициализация данных sidebar
         */
        initSidebar: function(){
            var sidebar = w2ui[this.w2ui.sidebarId];
            if (sidebar) {
                sidebar.nodes = [];
                this.showWait();
                    sidebar.add(this.items);
                this.hideWait();
            }
        },

        // /**
        //  * Инициализация массива локализаций
        //  */
        // initLocal: function(){
        //     var itemslocal = JSON.parse(JSON.stringify(GWTK.LEGEND.templateLocals));
        //     for (var key in itemslocal) {
        //         itemslocal[key].value = 0;
        //     }
        //     return itemsocal;
        // },

        /**
         * Включение/выключение items в sidebar
         * @param type - тип (local, layer, key)
         * @param codes - массив кодов items
         * @param check - true/false
         */
        checkItems: function(type, codes, check){
            if (!this.items || !type || !codes || codes.length == 0) {
                return;
            }

            var sidebar = w2ui[this.w2ui.sidebarId];
            if (sidebar) {
                var datanodes =
                    {
                        nodes: sidebar.nodes,
                        index: 0
                    };
                while(datanodes) {
                    datanodes = this.checkItemsNodes(datanodes, type, codes, check);
                }

                // Разберемся с главным узлом
                var nodes = sidebar.nodes[0].nodes,
                    ischecked = false;
                for (var i = 0; i < nodes.length; i++) {
                    ischecked |= nodes[i].panischecked;
                }
                sidebar.nodes[0].panischecked = ischecked;

                sidebar.refresh();
            }
            
        },

        /**
         * Рекурсивнок ключение/выключение items в sidebar
         * @param datanodes - {nodes: sidebar.nodes, index: 0 }
         * @param type - тип (local, layer, key)
         * @param codes - массив кодов items
         * @param check - true/false
         */
        checkItemsNodes: function(datanodes, type, codes, check){
            if (!datanodes || !datanodes.nodes || datanodes.nodes.length == 0) {
                return null;
            }
            var find, parent, index = datanodes.index + 1,
                nodes = datanodes.nodes;
            parent = nodes[0].parent;
            if (parent) {
                parent = parent.parent;
            }

            var ret = -1;
            for(var i = 0; i < nodes.length; i++) {
                if (nodes[i].type != type) {
                    ret = i
                    break;
                    // return {
                    //     nodes: nodes[i].nodes,
                    //     index: i
                    // };
                }
                // Родитель допускает включение
                // if (parent.nodes[datanodes.index].panischecked) {
                    find = -1
                    for (var j = 0; j < codes.length; j++) {
                        if (codes[j] == nodes[i].key) {
                            find = j;
                            break;
                        }
                    }
                    if (find > -1) {
                        nodes[i].panischecked = check;
                        if (nodes[i].nodes) {
                            for (var ii = 0; ii < nodes[i].nodes.length; ii++) {
                                nodes[i].nodes[ii].panischecked = check;
                            }
                        }
                    }
                // }
            }


            // Разберемся с родительским узлом
            var ischeck = false;
            for(var i = 0; i < nodes.length; i++) {
                ischeck |= nodes[i].panischecked;
            }
            nodes[0].parent.panischecked = ischeck;

            // Не тот тип данных
            if (ret >= 0) {
                return {
                    nodes: nodes[ret].nodes,
                    index: ret
                };
            }

            if (parent && parent.nodes && parent.nodes[index]) {
                // // Разберемся с родительским узлом
                // var ischeck = false;
                // for(var i = 0; i < nodes.length; i++) {
                //     ischeck |= nodes[i].panischecked;
                // }
                // nodes[0].parent.panischecked = ischeck;

                return {
                    nodes: parent.nodes[index].nodes,
                    index: index
                }
            }
            return null;
        },

        /**
         * Обновить данные шаблона из sidebar
         */
        updateTemplate: function(){
            var legendtemplate = this.legendtemplates[this.currenttemplate];

            // Пройдемся по sidebar
            var sidebar = w2ui[this.w2ui.sidebarId];
            if (!sidebar || !sidebar.nodes || sidebar.nodes.length == 0 ||
                !sidebar.nodes[0].nodes || sidebar.nodes[0].nodes.length == 0) {
                return;
            }

            var param = {
                layer:
                    {
                    'visible': [],
                    'novisible': []
                },
                key: {
                    'visible': [],
                    'novisible': []
                }
            };

            // Временные значения заполнили
            this.setTemplateAdvance(param, sidebar.nodes[0].nodes);

            // Теперь шаблон
            if (param.layer.visible.length > param.layer.novisible.length || param.layer.visible.length == 0){
                legendtemplate.layers.novisible = param.layer.novisible.slice();
                legendtemplate.layers.visible = [];
            }
            else {
                legendtemplate.layers.visible = param.layer.visible.slice();
                legendtemplate.layers.novisible = [];
            }
            if (param.key.visible.length > param.key.novisible.length || param.key.visible.length == 0){
                legendtemplate.keys.novisible = param.key.novisible.slice();
                legendtemplate.keys.visible = [];
            }
            else {
                legendtemplate.keys.visible = param.key.visible.slice();
                legendtemplate.keys.novisible = [];
            }

            // Локализации из this.itemsLocal
            for(var key in this.itemsLocal){
                legendtemplate.locals[key] = {'value': this.itemsLocal[key].value};
            }

            this.isChange = false;
        },

        /**
         * Предварительные установки значений перед сохранением в шаблон
         * @param data
         * @param nodes
         */
        setTemplateAdvance: function(data, nodes){
            if (!data || !nodes || nodes.length == 0){
                return;
            }
            for(var i = 0; i < nodes.length; i++) {
                 if (nodes[i].type == 'local') {
                     continue;
                 }

                if (nodes[i].panischecked) {
                    data[nodes[i].type].visible.push(nodes[i].key);
                }
                else {
                    data[nodes[i].type].novisible.push(nodes[i].key);
                }
                if (nodes[i].nodes && nodes[i].nodes.length > 0) {
                    this.setTemplateAdvance(data, nodes[i].nodes);
                }
            }
        },

        /**
         * Включить/отключить node сщ всеми дочерними узлами
         * @param node
         * @param check
         */
        checkNode: function(node, check){
            if (node) {
                node.panischecked = check;
                if (node.type == 'key'){
                    this.itemsLocal[node.local].detail[node.id] = check;
                }
            }
            if (!node.nodes || node.nodes.length == 0){
                return;
            }
            var nodes = node.nodes;
            for(var i = 0; i < nodes.length; i++) {
                this.checkNode(nodes[i], check);
                if (node.type == 'local'){
                    this.itemsLocal[node.key].detail[nodes[i].id] = check;
                }
            }
        },

        resize: function(){
            w2ui[this.id].resize();
            var el;
            for (var key in this.w2ui) {
                el = w2ui[this.w2ui[key]];
                if (el) {
                    el.resize();
                }
            }
        },

		destroy: function () {
		    // Удалить компоненты
            var el;
            for (var key in this.w2ui) {
                el = w2ui[this.w2ui[key]];
                if (el) {
                    el.destroy();
                }
            }
            // Удалить форму
            if (w2ui[this.id]) {
                w2ui[this.id].destroy();
            }

		},

        close: function(){
            if (this.options.popupobject){
                this.options.popupobject.close();
            }
            else {
                this.destroy();
            }
        },

        /**
         * Показать индикатор процесса
         */
        showWait: function () {
            if (GWTK.spinner == null) {
                var target = GWTK.MapEditorUtil.byId(this.w2ui.sidebarId);
                GWTK.spinner = new GWTK.Spinner(GWTK.opts).spin(target);
            }
        },

        /**
         * Скрыть индикатор процесса
         */
        hideWait: function () {
            if (GWTK.spinner != null) {
                GWTK.spinner.stop();
                GWTK.spinner = null;
            }
        }

    };
}
