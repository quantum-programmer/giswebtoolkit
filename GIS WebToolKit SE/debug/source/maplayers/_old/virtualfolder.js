
 /*************************************** Нефедьева О. 30/03/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Класс Виртуальная папка                    *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {
    /**
     * Класс Виртуальная папка
     * api для доступа к слоям данных из виртуальной папки
     * @class GWTK.VirtualFolder
     * @constructor GWTK.VirtualFolder
     * @param virtualLayer {GWTK.VirtualLayer} виртуальный слой карты
     * @param callback {Function} функция, обработчик ответа сервера
     */
    GWTK.VirtualFolder = function ( virtualLayer, callback ) {
        this.map = false;                  // карта
        this.name = '';                    // имя папки
        this.datatypes = [];               // типы данных из папки
        this.folderJSON = {};              // описание папок от сервера
        this.folderTree = {};              // описание папки с именем name
        this.responseCallback = callback;  // обработчик ответа сервера
        this.nodes = [];                   // настроенное дерево папки
        this.restParam = {'hostname':'', 'folder':''};

        this.init(virtualLayer);
    };

    GWTK.VirtualFolder.prototype = {

        /**
         * Инициализация
         * @method init
        */
        init: function (virtualLayer) {

            if (!virtualLayer || !virtualLayer.map) {
                console.log("GWTK.VirtualFolder. " + w2utils.lang("Not defined a required parameter") + " virtualLayer.");
                return;
            }
 
            this.layer = virtualLayer;                    // слой папки
            this.map = virtualLayer.map;                  // карта
            this.datatypes = this.layer.options.datatype; // типы слоев данных из папки ['sit', 'map', ...]
            this.url = this.getRestUrl();                  // адрес rest запросов
            this.name = this.restParam.folder;             // имя папки
            this.nodes = [];                               // настроенное дерево папки

            if (!this.name || this.name.length == 0 || !$.isArray(this.datatypes) || this.datatypes.length == 0) {
                console.log("GWTK.VirtualFolder. " + w2utils.lang("Not defined a required parameter") + " folderName or datatypes.");
                return;
            }

            this.layer_ids = [];
            this.old_layer_ids = [];

            return true;
        },

        /**
          * Установить параметры папки для запроса
          * @method getRestParam
         */
        setRestParam: function () {

            if (!this.layer){
                return;
            }
            
            this.restParam = {'hostname':'', 'folder':''};

            var name = this.layer.options.folder.toLowerCase();

            if (name.indexOf('host') == 0){
                this.restParam.hostname = this.layer.getHost();
                this.restParam.layer_alias = this.layer.getFolderLayerAlias();
                var salias = this.layer.idFolderDelimiter + 'alias' + this.layer.idFolderDelimiter,
                    arr = name.split(salias), jj;
                jj = name.indexOf(arr[1]);
                this.restParam.folder = this.layer.options.folder.slice(jj);
            } else {
                var ii = name.indexOf(this.layer.idFolderDelimiter);
                this.restParam.folder = this.layer.options.folder.slice(ii + 1);
                this.restParam.layer_alias = this.layer.options.folder;
            }
        },

        /**
          * Получить URL запроса
          * @method getRestUrl
          * @return {String} строка запроса данных папки
          */
        getRestUrl: function () {

            this.setRestParam();

            var url = this.layer.server + "restmethod=getdatafromfolder&pathname=" +
                      this.restParam.folder + "&datatype=" + this.datatypes.toString(',');

            if (this.restParam.hostname.length > 0) {
                url += "&hostname=" + encodeURIComponent(this.restParam.hostname);
            }

            return url;
        },

        /**
          * Получить данные папки
          * @method getFolderData
          * @return {String} строка запроса данных папки
          */
        getFolderData: function () {
 
            if (this.layer.options.token) { var token = this.map.getToken(); }
            var tokens = token ? [token] : undefined;
            
            GWTK.Util.doPromise([this.url], GWTK.Util.bind(this.onSuccess, this), tokens, this.map);
        },
        
        onSuccess: function(response, errors) {
            
            if (typeof (response) !== 'object' /*|| response.length == 0*/) {
                console.log("GWTK.VirtualFolder. " + w2utils.lang('Failed to get data') + ' - ' + this.name);
                console.log(response, 'Errors ', errors);
                GWTK.Util.hideWait();
                return;
            }
            
            this.folderJSON = response[0] || { folder: [] };          // содержимое папки
            // this.folderJSON = response[0];          // содержимое папки
            
            this.createFolderTree();

            if ($.isFunction(this.responseCallback)) {
                this.responseCallback('ok');
            }

            return;
        },

        /**
         * Получить описание папки по имени папки
         * @method _getFolderJSON
         * @return {Object} JSON иерархия папки
        */
        _getFolderJSON: function () {
            
            var len = this.folderJSON.folder.length, i;

            for (i = 0; i < len; i++) {
                if (this.folderJSON.folder[i].alias === this.name) {
                    return this.folderJSON.folder[i];
                }
            }

            return false;
        },

        /**
         * Создать дерево папки
         * @method createFolderTree
         * (метод устанавливает идентификаторы и свойства узлов дерева папки)
        */
        createFolderTree: function () {

            var len = this.folderJSON.folder.length, i;

            this.folderTree = this._getFolderJSON();                // json виртуальной папки
            
            if (!this.folderTree) {
                console.log("GWTK.VirtualFolder " + w2utils.lang('Failed to get data') + ' - ' + this.name);
                return;
            }

            this.fill();
        },

        /**
         * Заполнить узлы папки
         * @method fill
         * (метод рекурсивно устанавливает идентификаторы и свойства узлов дерева папки)
        */
        fill: function () {
            

            this.old_layer_ids = this.layer_ids;    // текущий состав слоев папки

            this.layer_ids = [];                    // новый состав слоев папки
            
            if (!this.folderTree) {
                return;
            }
    
            if (this.nodes.length) {
                for (var i = this.nodes.length - 1; i >= 0; i--) {
            
                    const name = this.nodes[i].text;
            
                    var isFound = false;
                    for (var key in this.folderTree) {
                        if (key === 'alias') {
                            continue;
                        }
                
                        const folderTreeValue = this.folderTree[key];
                        if (folderTreeValue.text && folderTreeValue.text === name) {
                            isFound = true;
                            break;
                        }
                
                    }
            
                    if (!isFound) {
                        this.nodes.splice(i, 1);
                    }
            
                }
            }
    
            for (var key in this.folderTree) {
        
                if (key === 'alias') {
                    continue;
                }
        
                const folderTreeValue = this.folderTree[key];
        
                var snode = JSON.stringify(folderTreeValue);
        
                var node = JSON.parse(snode);
        
                this.fillNode(node);
        
                if (node.skip && $.isArray(node.nodes)) {   // из этого узла берем только слои данных из nodes
                    if ($.isArray(node.nodes)) {
                        for (var i = 0; i < node.nodes.length; i++) {
                            node.nodes[i].parentId = this.layer.xId;
                            this.nodes.push(node.nodes[i]);
                        }
                    }
                    continue;
                }
                node.parentId = this.layer.xId;
        
                const index = this.nodes.findIndex((item) => item.text === node.text);
                if (index === -1) {
                    this.nodes.push(node);
                }else{
            
                    const listOld = [], listNew = [];
                    this.treeToList(this.nodes[index], listOld, 0);
                    this.treeToList(folderTreeValue, listNew, 0);
            
                    const listOfRemovedItems = this.compareLists(listOld, listNew);
                    listOfRemovedItems.forEach((item) => {
                        this.removeNodeByText(this.nodes[index], item.text);
                    });
            
                    const listOfAddedItems = this.compareLists(listNew, listOld);
                    if (listOfAddedItems.length) {
                        this.nodes.splice(index, 1, node);
                    }
            
                }
        
            }
    
        },
        
        /**
         * Удаление узла по свойству text
         * @param node
         * @param text
         */
        removeNodeByText: function(node, text) {
            if (node.nodes && node.nodes.length) {
                
                for (let i = 0; i < node.nodes.length; i++) {
                    
                    const item = node.nodes[i];
                    
                    if (item.text === text) {
                        node.nodes.splice(i, 1);
                        break;
                    }else{
                        this.removeNodeByText(item, text);
                    }
                    
                }
                
            }
            
        },
        
        /**
         * Преобразовать дерево в линейный список
         * @param tree {Object} дерево
         * @param list {[]} список
         * @param level {number} уровень узла в дереве
         */
        treeToList: function(tree, list, level) {
            if (tree && tree.text) {
                list.push({ text: tree.text, level });
            }
            if (tree && tree.nodes) {
                tree.nodes.forEach((item) => {
                    return this.treeToList(item, list, level + 1);
                });
            }
            
        },
    
        /**
         * Сравнить списки
         * @method compareLists
         * @param list1
         * @param list2
         */
        compareLists: function (list1, list2) {
            const listDiff = [];
            list1.forEach((list1Item) => {
                let result = false;
                for (let i = 0; i < list2.length; i++) {
            
                    const list2Item = list2[i];
            
                    if (list2Item.text === list1Item.text && (list2Item.level - list1Item.level) < 1) {
                        result = true;
                        break;
                    }
            
                }
        
                if (!result) {
                    listDiff.push(list1Item);
                }
            });
            
            return listDiff;
        },

        /**
         * Заполнить узeл папки
         * @method fillNode
         * @param node {Object} узел папки
        */
        fillNode: function (node) {

            this.prepare(node, this.layer);                            // заполнить свойства узла

            if (node.layer_id && node.layer_id.length > 0) {           // если узел данных, запомнить layer_id
                this.layer_ids.push({ 'xid': node.id, 'layer_id': node.layer_id });
            }
            if (!node.nodes || node.nodes.length == 0) {
                return node;
            }

            var layer = this.layer,
                names = this.layer_ids;

            node.indexes = [];

            fillNodes(node);                                            // заполнить дочерние узлы
            
            function fillNodes(nd) {

                if (typeof nd === 'undefined') {
                    return;
                }
                
                if (!nd.nodes || nd.nodes.length == 0) {
                    GWTK.VirtualFolder.prototype.prepare(nd, layer);
                    if (nd.layer_id) names.push({ 'xid': nd.id, 'layer_id': nd.layer_id });
                    return;
                }

                for (var i = 0; i < nd.nodes.length; i++) {
                    nd.nodes[i].id = GWTK.Util.createGUID();

                    node.indexes.push(nd.nodes[i].id);

                    // изображение узла
                    if (nd.comm != undefined && nd.comm) {
                        nd.img = "icon-folder";
                        nd.gClickable = true;
                        nd.panischecked = false;
                    }
                    else {
                        nd.img = "icon-page";
                        nd.layer_id = layer.options.layer_alias + nd.name;
                        nd.isfolder = true;
                        nd.hidden = true;
                        layer.virtualFolder.getLayerNodeId(nd.layer_id);
                        names.push({ 'xid': nd.id, 'layer_id': nd.layer_id });
                    }
                    if (layer) {
                        if (nd.layer_id) {
                            nd.showsettings = layer.map.options.showsettings;
                            nd.legend = layer.options.legend;
                            nd.gClickable = true;
                            nd.panischecked = false;
                        }
                    }
 
                    fillNodes(nd.nodes[i]);
                }
                return;
            }
            
            return node;
        },

        /**
          * Установить свойства узла
          * @method prepare
          * @param node {Object} узел папки
          * @param layer {GWTK.VirtualLayer} слой папки
         */
        prepare: function (node, layer) {
            // идентификатор
               node.id = GWTK.Util.createGUID();

            // изображение узла
            if (node.comm != undefined && node.comm) {
                node.img = "icon-folder";
                node.gClickable = true;
            }
            else {
                if (typeof node.name == 'undefined' || node.name.length == 0) {
                    node.text = "";
                    node.img = "";
                    node.skip = true;                // такой узел пропустим, но его слои данных (если есть), выведем
                 }
                else {
                    node.img = "icon-page";
                    node.layer_id = layer.options.layer_alias + node.name;
                    node.isfolder = true;
                    node.id = layer.virtualFolder.getLayerNodeId(node.layer_id);
                }
            }

            node.panischecked = false;

            // управление прозрачностью, легенда
            if (layer) {
                if (node.layer_id) {
                    node.showsettings = layer.map.options.showsettings;
                    node.legend = layer.options.legend;
                    node.gClickable = true;
                }
            }

            return node;
        },

        /**
         * Получить идентификатор слоя карты (узла) xid
         * @method getLayerNodeId
         * @param layer_id {String} идентификатор слоя папки
         * @return {String} идентификатор узла.Если layer_id найден в
         * списке old_layer_ids, возвращает его xid. Иначе - новый xid
        */
        getLayerNodeId: function (layer_id) {

            if (this.old_layer_ids && this.old_layer_ids.length > 0) {
                var pos = this._findKey(layer_id);
                if (pos > -1) {
                    return this.old_layer_ids[pos].xid;
                }
            }
 
            return GWTK.Util.createGUID();
        },
        
        _setRemove: function() {
            if (/*this.layer_ids.length == 0 ||*/ this.old_layer_ids.length == 0) return false;
            //this.present_xid = [];
            var remove = [], i, len;
            for (i = 0; len = this.layer_ids.length, i < len; i++) {
                var pos = this._findKey(this.layer_ids[i].layer_id);
                if (pos > -1) {
                    this.old_layer_ids.splice(pos, 1);
                }
            }

            return true;
        },

        getRemove: function () {
            return this.old_layer_ids;
        },

        _findKey: function (id) {
            var i, len;
            for (i = 0; len = this.old_layer_ids.length, i < len; i++) {
                if (this.old_layer_ids[i].layer_id == id) {
                    return i;
                }
            }
            return -1;
        },

        /**
          * Найти узел по идентификатору
          * @method findNode
          * @param id {String} идентификатор узла папки
          * @return {Object} узел папки
         */
        findNode: function (id) {
            if (!this.nodes || this.nodes.length == 0) {
                return;
            }
            var i, len, node = {};
            for (i = 0; len=this.nodes.length, i < len; i++){
                if (!this.nodes[i].indexes) { continue; }
                if ($.inArray(id, this.nodes[i].indexes) > -1) {
                    node = findInNode(this.nodes[i], id);
                }
            }

            return node;

            function findInNode(node, id) {
                var i, len;
                for (i = 0; len = node.length, i < len; i++) {
                    if (node[i].id === id) {
                        return node[i];
                    }
                    findInNode(node[i], id);
                }
                return;
            }

        },

        isEmpty: function (object) {
            if (!object) {
                return true;
            }
            if ($.type(object) !== "array" && $.type(object) !== "string") {
                return true;
            }
            if (object.length > 0) {
                return false;
            }
            return true;
        }

    }

}