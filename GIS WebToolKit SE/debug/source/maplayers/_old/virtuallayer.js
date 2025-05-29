 /*************************************** Нефедьева О. 19/02/21  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Класс виртуальный слой (виртуальная папка)           *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {
    /**
     * Компонент виртуальный слой (виртуальная папка)
     * api для публикации слоев из виртуальной папки
     * @class GWTK.VirtualLayer
     * @constructor GWTK.VirtualLayer
     */
	GWTK.VirtualLayer = function ( map, options, callback ) {

        this.map = null;
        this.idLayer = "";
        this.xId = "";                       // Уникальный идентификатор слоя
        this.alias = "";                     // Название слоя
        this.server = "";                    // Адрес картографического сервиса
        this.folderService = "wms";          // Сервис получения изображений слоев виртуальной папки
        this.selectObject = 0;               // Возможность выбора объектов карты (1/0)
        this.layerContainer = null;          // Контейнер слоя (не используется)
        this.visible = true;                 // Признак видимости слоя (1/0)
        this.classifier = null;
        this.iconUrl = "";
        this.options = null;                 // Параметры виртуальной папки
        this.layersParam = [];               // Параметры слоев из виртуальной папки
        this.folderUrl = "";                 // Адрес (шаблон) запросов данных из виртуальной папки
        this.callback = callback;            // Обработчик открытия слоя
        this.virtualFolder = null;           // Класс доступа к виртуальной папке
        this.idFolderDelimiter = '_';        // Разделитель идентификатора папки (новый содержит '#')

        if (!map) {
            console.log("GWTK.VirtualLayer. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.datatypeArray = ['MAP', 'SIT', 'SITX', 'MPT', 'MTW', 'MTL', 'MTQ', 'RSW'];
        
        this.init(map, options);

        return;
    };

    GWTK.VirtualLayer.prototype = {
        /**
         * Инициализация
         * @method init
         * @param map {Object} Объект карты
         * @param options {Object}  Параметры виртуальной папки
         */
         init: function (map, options) {

            this.map = map;

            this.server = (options.url || this.map.options.url) + '?';

            if (!options || !options.folder || options.folder.length == 0) {
                console.log(w2utils.lang('GWTK.VirtualLayer. Options error. Parameter folder is undefined.'));
                return;
            }
            // параметры виртуальной папки
            this.options = options;

            // Уникальный идентификатор в карте
            this.xId = options.id;
            this.alias = options.alias;

            // протокол обмена данными
            this.folderService = options.service || 'wms';

            // типы публикуемых слоев
            if (!this.options.datatype)
                this.options.datatype = [];                                // берем все типы данных в папке

            else if (!$.isArray(this.options.datatype)) {
                if (this.options.datatype.length > 0 && this.options.datatype != '*')
                    this.options.datatype = this.options.datatype.split(",");
                else
                    this.options.datatype = [];
            }

            // если тип данных не задан в параметрах, берем все типы данных из папки
            if (this.options.datatype.length == 0)
                this.options.datatype = this.datatypeArray;
            else {
                var i, len = this.options.datatype.length;
                for (i = 0; i < len; i++) {
                    this.options.datatype[i] = this.options.datatype[i].toUpperCase();
                }
            }

            this.setIdDelimiter();

            // адрес запроса слоев из виртуальной папки
            this.folderUrl = this.server + "service=" + this.folderService + "&request=";
            if (this.folderService == 'wms')
                this.folderUrl += "GetMap&VERSION=1.3.0&FORMAT=image/png&nopainterror=1&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt&LAYERS=";
            else
                this.folderUrl += "GetTile&VERSION=1.0.0&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png&LAYER=";
             
            if (this.options.folder.lastIndexOf(this.idFolderDelimiter) == (this.options.folder.length - 1)) {
                this.options.folder = this.options.folder.slice(0, this.options.folder.length - 1);
            }

            // назначить обработчики событий
            this.initEvents();

            // установить признак аутентификации
            this.map.tiles.setAuthTypeServer(this);

            // rest вызовы к виртуальной папке
            this.virtualFolder = new GWTK.VirtualFolder(this, this.refreshVirtualFolderLayers);

            this.options.layer_alias = this.virtualFolder.restParam.layer_alias;

            if (this.getHost() == "") {
                this.options.layer_alias = 'USERFOLDER' + this.idFolderDelimiter;
            }
        },

        /**
         * Установить разделитель идентификатора папки ('_'(старый формат) или '#'(новый формат))
         * @method setIdDelimiter
         */
        // ===============================================================
         setIdDelimiter: function ()
         {
             this.idFolderDelimiter = "_";
             if (!$.isEmptyObject(this.options) && typeof this.options.folder != "undefined") {
                 if (this.options.folder.indexOf('#') != -1) {
                     this.idFolderDelimiter = "#";
                 }
             }
             return this.idFolderDelimiter;
         },

        /**
         * Назначение обработчиков событий
         * @method initEvents
         */
        // ===============================================================
        initEvents: function () {

            this.refreshVirtualFolderLayers = GWTK.Util.bind(this.refreshVirtualFolderLayers, this);

            this.layerRequest = GWTK.Util.bind(this.layerRequest, this);

            this.createFolderLayers = GWTK.Util.bind(this.createFolderLayers, this);

            $(this.map.eventPane).on('layercommand.mapfolder', this.layerRequest);

            $(this.map.eventPane).on('layerlistchanged.mapfolder', this.callback);

            $(this.map.eventPane).on('createlayer.mapfolder', this.createFolderLayers);
        },

        /**
          * Запросить host
          * @method getHost
          * @return {String} хост ГИС Сервера
         */
        // ===============================================================
        getHost: function () {
            if (!this.options.folder || !this.options.folder) {
                return '';
            }

            var name = this.options.folder.toLowerCase(),
                host = "";
            
            if (name.length == 0 || name.indexOf('host') == -1) {
                return host;
            }
 
            var alias = this.idFolderDelimiter + 'alias' + this.idFolderDelimiter,
                arr = name.split(alias);

            host = this.options.folder.slice(0, arr[0].length);

            var str = host.split(this.idFolderDelimiter);
            host = str.join('#');

            return host;
        },

        /**
          * Получить алиас слоя папки
          * @method getFolderLayerAlias
          * @return {String} алиас слоя папки (вид HOST_gisserver.ru_2047_ALIAS_ или HOST#gisserver.ru#2047#ALIAS#)
          */
        // ===============================================================
        getFolderLayerAlias: function () {

            if (!this.options || !this.options.folder) {
                return '';
            }

            var name = this.options.folder.toLowerCase(),
                alias = "";
            if (name.length == 0) return '';

            if (name.indexOf('host') == 0) {
                var dalias = this.idFolderDelimiter + 'alias' + this.idFolderDelimiter,
                    arr = name.split(dalias);
                alias = this.options.folder.slice(0, arr[0].length);
                alias += dalias.toUpperCase();
            }
            else {
                alias = this.options.folder;
            }

            return alias;
        },

        /**
         * Получить тип слоя
         * @method getType
         * @return {String} 'folder'
         */
        getType: function(){
            return 'folder';
        },

        /**
         * Создать слои карты для папки
         * @method createFolderLayers
         * @param event {Object} event.layers[] массив узлов слоев в дереве данных
        */
        // ===============================================================
        createFolderLayers:function(event){
            if (!event || !event.layers) {
                return;
            }
            var nodes = event.layers, i, len, flag = false;

            for (i = 0; len = event.layers.length, i < len; i++) {
                if (this.openMapLayer(event.layers[i])) {
                    flag = true;
                }
            }

            if (flag) {
                if (this.folderService == "wms")
                    this.map.tiles.wmsManager.wmsDrawing();
                else {
                    this.map.tiles.setLayersInViewOrder();
                    this.map.tiles.forceupdate();
                }
            }

        },

        /**
         * Открыть слой карты
         * @method openMapLayer
         * @param node {Object} узел слоя в дереве данных
        */
        // ===============================================================
        openMapLayer: function (node) {

            if (!node || $.isEmptyObject(node) || !node.layer_id || node.layer_id.length == 0) {
                return;
            }
            if (node.layer_id.indexOf(this.options.folder) == -1) {
                return;
            }
            if (this.map.tiles.getLayerByxId(node.id)) {
                if (node.legend && node.legend.length > 0) {
                    node.plus = true;
                }
                return;
            }

            var param = {
                'id': node.id, 'alias': node.text, 'url': this.folderUrl + encodeURIComponent(node.layer_id),
                'hidden': false
            };

            param.token = this.options.token;

            if (node.legend && node.legend.length > 0) {
                param.legend = node.legend;
                node.plus = true;
            }
 
            if (this.options.selectObject && this.options.selectObject == 1) {
                param.selectObject = 1;
            }
            if (this.options.authtype){
                param["authtype"] = this.options.authtype;
            }

            var maplayer = this.map.openLayer(param);
    
            // при выборе объектов чтобы отображалось название карты, добавим в список слой
            if (maplayer.selectObject) {
                this.map.openVectorLayer({
                    id: param.id,
                    url: this.folderUrl + encodeURIComponent(node.layer_id),
                    alias: param.alias,
                    selectObject: param.selectObject,
                    legend: param.legend
                });
            }
            
            if (maplayer !== 0) {
                maplayer._foldername = this.virtualFolder.name;
                this.map.tiles.setLayerViewOrder(param.id);
                return true;
            } else {
                console.log(w2utils.lang('Map layer creation error') + ' folder ' +
                    this.virtualFolder.name + ' id ' + param.id);
            }
        },

        /**
         * Закрыть слои карты
         * @method closeFolderLayers
         * @param node {Object} описание слоя в дереве
        */
        // ===============================================================
        closeFolderLayers: function () {
            if (!this.virtualFolder._setRemove()) {
                return;
            }
            var i, j, len,
                list = this.virtualFolder.old_layer_ids;

            for (i = 0; len = list.length, i < len; i++) {
                this.map.closeLayer(list[i].xid);
            }
        },

        /**
         * Запросить типы данных, публикуемых из виртуальной папки
         * @method getDataType
         * @return {Array} массив строк типов данных или `null` при ошибке
        */
        // ===============================================================
        getDataType: function () {
            if (!this.options)
                return null;
            return this.options.datatype;
        },

        /**
         * Получить слои папки
         * @method layerRequest
        */
        // ===============================================================
        layerRequest: function (event) {
            if (!event.maplayer || !event.maplayer.id)
                return;
            if (event.maplayer.id != this.xId || event.maplayer.act != 'update')
                return;

            if (!this.virtualFolder) return;

            GWTK.Util.showWait();

            this.virtualFolder.getFolderData();

            return;
        },

        /**
         * Обновить слои виртуальной папки в дереве состава данных
         * @method refreshVirtualFolderLayers
         * @param data {String} ответ запроса данных папки, 'ok' - успешно
        */
        // ===============================================================
        refreshVirtualFolderLayers: function (result) {
 
            if (!result) { return; }

            if (result !== 'ok' || !this.virtualFolder) return;
    
            // удалить слои, которых нет в новом составе
            this.closeFolderLayers();
            
            //обновляем дерево
            const res = this.map.contentTreeManager.removeChildren(this.xId);
            if (res) { // все слои были удалены
                const folder = this.map.getContentTreeNode(this.xId);
                this.map.onLayerListChanged(folder);
            }
    
            // заполнить дерево
            for (var i = 0, len = this.virtualFolder.nodes.length; i < len; i++) {
                this.map.onLayerListChanged(this.virtualFolder.nodes[i]);
            }
            
            GWTK.Util.hideWait();
        },

        /**
         * Освободить ресурсы
         * @method destroy
        */
        // ===============================================================
        destroy: function () {
            $(this.map.eventPane).off('layercommand.mapfolder', this.layerRequest);
            $(this.map.eventPane).off('layerlistchanged.mapfolder', this.callback);
            $(this.map.eventPane).off('createlayer.mapfolder', this.createFolderLayers);
            this.layersParam = [];
        },

        /**
         * Очистка параметров при удалении слоя
         * @method onRemove
         */
        onRemove: function ()
        {
            if (this.layersParam.length == 0) {
                $(this.map.eventPane).trigger({ type: 'layerlistchanged', maplayer: { 'id': this.xId, 'act': 'remove' } });
                var index = $.inArray(this, this.map.virtualfolders);
                if (index != -1) {
                    this.map.virtualfolders.splice(index, 1);
                }
            }
            return;
        },

        /**
         * Удалить слои данных из папки
         * @method removeFolderLayers
         */
        removeFolderLayers: function() {
            let ids = [], i;
            for (i = 0; i < this.map.layers.length; i++) {
                if (!this.map.layers[i]._foldername) {
                    continue;
                }
                if (this.map.layers[i]._foldername === this.virtualFolder.name) {
                    ids.push(this.map.layers[i].xid);
                }
            }
            for (i = 0; i < ids.length; i++) {
                this.map.closeLayer(ids[i]);
            }
        }

    }
}