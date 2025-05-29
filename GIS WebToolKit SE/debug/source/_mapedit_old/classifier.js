/********************************* Помозов Е.     **** 20/00/20 ****
 /********************************* Нефедьева О.А. **** 22/07/20 ****
 ********************************** Соколова Т. В. **** 05/05/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Классификатор карты                       *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {

    GWTK.rscobject = {
        "code": "",
        "local": "",
        "segment": "",
        "segmentname": "",
        "segmentkey": "",
        "scale": "",
        "direct": "",
        "bot": "",
        "top": "",
        "name": "",
        "key": "",
        "rscsemantics": [],
        "image": "",
        "cssimage": ''
    }

    GWTK.rscsemantic = {
        "code": "",
        "type": "",
        "reply": "",
        "enable": "",
        "service": "",
        "name": "",
        "unit": "",
        "minimum": "",
        "defaultvalue": "",
        "maximum": "",
        "size": "",
        "decimal": "",
        "shortname": "",
        "value": "",
        "image": "",
        "textvalue": ""
    }

    GWTK.classifiersematic = {
        "code": "",
        "key": "",
        "reference": []
    }
    GWTK.record = {
        "value": "",
        "text": "",
        "name": ""
    }

    // Структура семантики слоя
    GWTK.layersemanticlist = {
        "alias": "",
        "name": "",
        "rscsemantic": [] // массив GWTK.rscsemantic
    }

    // Элемент очереди на загрузку классификаторов
    GWTK.queueitem = {
        "server": "",             // адрес сервера
        "schemeName": "",         // имя xsd-схемы
        "status": 0,
        "layer": undefined        // слой
    }

    GWTK.Classifiers = function(map) {
        this.map = null;
        if (map && map instanceof GWTK.Map) {
            this.map = map;
        }
        this.classifiers = [];               // классификаторы
        this._queue = [];                    // очередь на загрузку классификаторов
    };

    GWTK.Classifiers.prototype = {

        /**
         * add - добавить классификатор
         * @param layer -  слой
         * @returns {Object) -  GWTK.classifier или null
         */
        add: function(layer) {
            if (!layer || !layer.options || !layer.options.selectObject) {
                return;
            }

            // Найдем среди открытых
            var server = GWTK.Util.getServerUrl(layer.options.url);
            if (!server) {
                return;
            }
            for (var i = 0; i < this.classifiers.length; i++) {
                if (!this.classifiers[i]) {
                    continue;
                }
                var source_srv = this.classifiers[i].srv ? this.classifiers[i].srv === server : false;
                if (!source_srv) {
                    continue;
                }
                if (layer.options.schemename && this.classifiers[i].schemeName &&
                    (layer.options.schemename === this.classifiers[i].schemeName)) {
                    return this.classifiers[i];
                }
                if (this.classifiers[i].wmtsId && layer.idLayer &&
                    (layer.idLayer === this.classifiers[i].wmtsId)) {
                    return this.classifiers[i];
                }
            }
            // не нашли, добавим
            if (!this.getQueue(layer)) {
                this.inQueue(layer);                               // добавим в очередь запросов
            }
            this.classifiers.push(new GWTK.classifier(layer));    // добавим в список классификаторов
            return this.classifiers[this.classifiers.length - 1];
        },

        /**
         * Удалить слой
         * @method remove
         * @param layer {Object} слой карты
         */
        remove: function(layer) {
            var len;
            if (!this.map || !this.map.layers || (len = this.map.layers.length) == 0) {
                return;
            }

            // Найдем среди существующих
            var server = GWTK.Util.getServerUrl(layer.options.url), isuse = false, index = -1;
            if (server) {
                for (var i = 0; i < this.classifiers.length; i++) {
                    if (this.classifiers[i] && server && this.classifiers[i].srv && this.classifiers[i].wmtsId && this.classifiers[i].wmtsId == layer.idLayer && this.classifiers[i].srv == server) {
                        // если нашли, то проверим, что ни в одном из открытых слоев он не используется
                        index = i;
                        for (var j = 0; j < len; j++) {
                            var layerurl = GWTK.Util.getServerUrl(this.map.layers[j].options.url);
                            if (layerurl && this.map.layers[j].alias != layer.alias && this.map.layers[j].idLayer == this.classifiers[i].wmtsId && this.classifiers[i].srv == layerurl) {
                                isuse = true;
                                break;
                            }
                        }
                    }
                    if (isuse) {
                        break;
                    }
                }
                if (!isuse && index >= 0) {
                    delete this.classifiers[index];
                }
            }

        },

        /**
         * Запросить слой
         * @method get
         * @param layer
         * @returns {Object) -  GWTK.classifier или null, при отсутствии добавляет
         */
        get: function(layer) {
            if (this.classifiers.length == 0) {
                this.initEvents();
            }
            return this.add(layer);
        },

        /**
         * Поместить в очередь запросов
         * @method inQueue
         * @param layer {Object} слой карты
         * @returns {Object) Элемент очереди GWTK.queueitem или undefined
         */
        inQueue: function(layer) {
            if (!layer || !layer.selectObject) {
                return;
            }
            var item = this.getQueue(layer);
            if (item == undefined) {
                this._queue.push({
                    "server": GWTK.Util.getServerUrl(layer.options.url),
                    "schemeName": layer.options.schemename || '',
                    "status": 1,
                    "layer": layer
                });
                item = this._queue[this._queue.length - 1];
            }
            return item;
        },

        /**
         * Получить элемент очереди запросов
         * @method getQueue
         * @param layer {Object} слой карты
         * @param getindex {Boolean} `true` - вернуть индекс в очереди
         * @returns {Object/Number/undefined) Элемент очереди GWTK.queueitem, индекс или undefined
         */
        getQueue: function(layer, getindex) {
            if (!layer) {
                return;
            }
            var server = GWTK.Util.getServerUrl(layer.options.url);
            if (layer.options.schemename) {
                for (var i = 0, len = this._queue.length; i < len; i++) {
                    if (!this._queue[i] || server !== this._queue[i].server) {
                        continue;
                    }
                    if (this._queue[i].schemeName === layer.options.schemename) {
                        if (getindex) {
                            return i;
                        }
                        return this._queue[i];
                    }
                }
            }else{
                for (var i = 0, len = this._queue.length; i < len; i++) {
                    if (!this._queue[i] || server !== this._queue[i].server) {
                        continue;
                    }
                    if (layer === this._queue[i].layer ||
                        layer.idLayer === this._queue[i].layer.idLayer) {
                        if (getindex) {
                            return i;
                        }
                        return this._queue[i];
                    }
                }
            }
        },

        /**
         * Удалить из очереди запросов
         * @method fromQueue
         * @param layer {Object} слой карты
         * @returns {Boolean/undefined} `true` Элемент очереди удален или undefined
         */
        fromQueue: function(layer) {
            var index = this.getQueue(layer, true);
            if (index == undefined) {
                return;
            }
            // Удалим events на слой
            if (layer.classifier) {
                layer.classifier.destroyEvents();
            }
            this._queue.splice(index, 1);
            return true;
        },

        /**
         * Обновить очередь запросов
         * @method _refreshQueue
         * @param event {Object} событие
         * Функция удаляет из очереди слой event.layer и загружает очередной слой
         */
        _refreshQueue: function(event) {
            if (!event || !event.layer)
                return;
            this.fromQueue(event.layer);
            if (this._queue.length > 0) {
                this.loadClassifier();
            }else{
                $(this.map.eventPane).off('loadclassifier.classifiers');
                $(this.map.eventPane).off('loadclassifierError.classifiers');
            }
        },

        /**
         * Загрузить очередной классификатор
         * @method loadClassifier
         * Функция загружает классификатор первого в очереди элемента
         */
        loadClassifier: function() {
            if (!this._queue || this._queue.length == 0) {
                return;
            }
            try {
                this._queue[0].layer.classifier._initwfs(true);
            } catch (exp) {
            }
        },

        /**
         * Инициализировать обработку событий загрузки
         * @method initEvents
         */
        initEvents: function() {
            $(this.map.eventPane).off('loadclassifier.classifiers');
            $(this.map.eventPane).off('loadclassifierError.classifiers');
            $(this.map.eventPane).on('loadclassifier.classifiers', this._refreshQueue.bind(this));
            $(this.map.eventPane).on('loadclassifierError.classifiers',
                this._refreshQueue.bind(this));
        },

        /**
         * Деструктор
         * @method destroy
         */
        destroy: function() {
            if (this.classifiers && this.classifiers.length > 0) {
                this.classifiers.splice(0, this.classifiers.length);
            }
            if (this._queue && this._queue.length > 0) {
                this._queue.splice(0, this._queue.length);
            }
            this.classifiers = null;
            this._queue = null;
            $(this.map.eventPane).off('loadclassifier.classifiers');
            $(this.map.eventPane).off('loadclassifierError.classifiers');
        }

    };



    GWTK.classifier = function(layer) {

        this.toolname = 'classifier';

        if (!layer || layer instanceof Object == false ||
            layer instanceof GWTK.TileLayer == false && layer instanceof GWTK.WmsLayer == false && layer instanceof GWTK.graphicLayer == false) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " layer.");
            return;
        }
        if (!layer.map) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        // Переменные класса
        this.layer = layer;                 // объект слоя
        this.name = null;                   // имя классификатора
        this.schemeName = (layer.options && layer.options.schemename) ? layer.options.schemename : null;  // Наименование схемы

        this.layerid = this.layer.options.id;       // id слоя в карте
        this.map = this.layer.map;                  // карта

        this.classifiersematiclist = new Array();   // список семантик типа классификатор GWTK.classifiersematisc
        this.rscobjects = new Array();              // список объектов классификатора   GWTK.rscobject
        this.layerSemanticList = new Array();       // список скмантик слоя  GWTK.layersemanticlist

        this.legend = null;                         // легенда
        this.queryWfs = null;
        this.queryEdit = null;
        this.queryLayerSemanticList = null;
        this.wmtsId = null;                          // id слоя для формирования запроса

        this.loadclassifier = false;
        this.loadclassifiersematiclist = false;
        this.onDataLoaded = GWTK.Util.bind(this.onDataLoaded, this);
        this.onLoadClassifier = GWTK.Util.bind(this.onLoadClassifier, this);
        this.onLoadClassifierError = GWTK.Util.bind(this.onLoadClassifierError, this);

        this.initialize();
    };

    GWTK.classifier.prototype = {

        initialize: function() {

            // Инициализация классификатора графического слоя
            if (this.layer instanceof GWTK.graphicLayer) { // графический слой
                this.initGraphicLayer();
                return this;
            }

            // установим url
            this.seturl();

            // Сделаем асинхронный запрос данных классификатора
            //setTimeout(function () { this._initwfs(true); }.bind(this), 3000);
            return this;
        },

        /**
         * Инициализация классификатора графического слоя
         */
        initGraphicLayer: function() {
            if (this.layer && this.layer instanceof GWTK.graphicLayer) { // графический слой

                // Загрузим все объекты, которые можно будет создавать
                // копирование делается с целью сохранения вида последнего создаваемого объекта
                var rscobjects = this.layer.getCreateObjects();
                if (rscobjects && rscobjects.length > 0) {
                    this.rscobjects.splice(0, this.rscobjects.length);
                    for (var i = 0; i < rscobjects.length; i++) {
                        this.rscobjects.push(rscobjects[i]);
                    }
                }

                this.classifiersematiclist = this.layer.getSemanticWithList();

                this.legend = {};

            }
        },

        // Запросить легенду
        getlegend: function() {
            // Если обрабатывается запрос, то просто ждем
            if (this.isQueryInitLegend)
                return;
            else{
                if (this.legend == null) {
                    this._initLegend();
                }else{
                    return this.legend;
                }
            }
        },


        /**
         * Запрос списка семантик слоя
         * @param callback_complete = function(features, status),
         * где features - массив семантик слоя,
         *     status - 'success' или 'error'
         *     GWTK.classifier - экземпляр класса
         */
        getLayerSemanticList: function(callback_complete) {
            // Если не загружен список семантик
            if (!this.loadlayerSemanticList) {
                this._initLayerSemanticList(true, callback_complete);
            }else{
                if (callback_complete && $.isFunction(callback_complete)) {
                    callback_complete(this.layerSemanticList, (this.layerSemanticList.length > 0) ? 'success' : 'error', this);
                }
            }
        },

        /**
         * Запросить семантики слоя классификатора карты по ключу
         * @param key
         * @returns {*} объект слоя классификатора с семантиками слоя
         */
        getLayerSemanticListByKey: function(key, callback_complete) {

            // Не загружена
            if (!this.loadlayerSemanticList) {
                this.getLayerSemanticList(GWTK.Util.bind(function() {
                    if (callback_complete) {
                        callback_complete(this.getLayerSemanticListByKey_callback(key));
                    }
                }, this));
            }else{
                if (callback_complete) {
                    callback_complete(this.getLayerSemanticListByKey_callback(key));
                }else{
                    return this.getLayerSemanticListByKey_callback(key);
                }
            }
        },

        getLayerSemanticListByKey_callback: function(key) {
            var len = 0;
            if (this.layerSemanticList && ((len = this.layerSemanticList.length) > 0)) {
                for (var i = 0; i < len; i++) {
                    if (this.layerSemanticList[i]['name'] == key) {
                        return this.layerSemanticList[i];
                    }
                }
            }
        },

        /**
         * Запрос списа семантик типа классификатор
         * @param callback_complete = function(classifiersematiclist, status),
         * где classifiersematiclist - массив семантик типа классификатор,
         *     status - 'success' или 'error'
         */
        getclassifiersematiclist: function(callback_complete) {
            // Если не загружен список семантик
            if (!this.loadclassifiersematiclist) {
                this._initSemanticWithList(callback_complete);
            }else{
                if (callback_complete && $.isFunction(callback_complete)) {
                    callback_complete(this.classifiersematiclist, 'success');
                }
            }
        },

        // установим url для запросов
        seturl: function() {
            if (this.layer) {
                this.srv = GWTK.Util.getServerUrl(this.layer.options.url);
                this.wmtsId = GWTK.Util.getParamsFromURL(this.layer.options.url);
                if ('layer' in this.wmtsId)
                    this.wmtsId = this.wmtsId.layer;
                else{
                    if ('layers' in this.wmtsId) this.wmtsId = this.wmtsId.layers;
                }
            }
        },

        // Инициализировать данные классификатора через http-запрос wfs
        _initwfs: function() {

            if (!this.layer.selectObject) {
                return;
            }

            if (this.rscobjects.length > 0)
                return;

            // Запрос легенды
            this.getlegend();

            // Заполним список семантик слоя
            this.getLayerSemanticList();

            // заполним список семантик типа классификатор
            this.getclassifiersematiclist();

        },

        // Запрос легенды
        _initLegend: function() {
            if (!this.wmtsId || this.wmtsId == '' || !this.srv)
                return;

            // var map = this.map;
            // this.queryWfs = new WfsQueries(this.srv, this.map);
            // this.queryWfs.context = this;
            // this.queryWfs.onDataLoad = function(response, context) {
            //     GWTK.Util.onLegendDataLoaded(response, context, map);
            // };
            // this.queryWfs.onError = GWTK.Util.bind(this.onError, this);
            // this.isQueryInitLegend = true;
            // this.queryWfs.sendRequest({
            //     "restmethod": "createLegend",
            //     "layer": this.wmtsId,
            //     "width": '32',
            //     "objlocal": "0,1,2,3,4",
            //     "BYXSD": "1",
            //     "COLOR": "ffffff"
            // });
            const httpParams = GWTK.RequestServices.createHttpParams(this.map, { url: this.srv });
            this.queryWfs = GWTK.RequestServices.retrieveOrCreate(httpParams, 'REST');

            this.queryWfs.createLegend({
                LAYER: this.wmtsId,
                WIDTH: '64',
                OBJLOCAL: '0,1,2,3,4',
                BYXSD: '1',
                COLOR: 'ffffff'
            }).then((result) => {
                if (result.data) {
                    GWTK.Util.onLegendDataLoaded(result.data, this, this.map);
                }else{
                    this.onError(result.error);
                }
            }).catch((reason => {
                this.onError(reason);
            }));
        },

        initEvents: function(){
            $(this.map.eventPane).on('loadclassifier', this.onLoadClassifier);
            $(this.map.eventPane).on('loadclassifierError', this.onLoadClassifierError);
        },

        destroyEvents: function(){
            $(this.map.eventPane).off('loadclassifier', this.onLoadClassifier);
            $(this.map.eventPane).off('loadclassifierError', this.onLoadClassifierError);
        },

        // Запрос списка семантик типа классификатор
        _initSemanticWithList: function(callback_complete) {
            if (this.layer instanceof GWTK.graphicLayer && this.classifiersematiclist.length > 0) { // графический слой
                if (callback_complete && $.isFunction(callback_complete)) {
                    callback_complete(this.classifiersematiclist, 'success');
                    return;
                }
            }

            if (!this.wmtsId || this.wmtsId == '' || !this.srv)
                return;

            this.queryEdit = new EditQueries(this.srv, this.map);
            this.queryEdit.onDataLoad = GWTK.Util.bind(function(response, context, textStatus) {

                this.classifiersematiclist = this.onDataLoaded(response, context, textStatus);
                if (this.classifiersematiclist) {
                    this.loadclassifiersematiclist = true;
                }

                if (callback_complete && $.isFunction(callback_complete)) {
                    callback_complete(this.classifiersematiclist, textStatus);
                }

                this.queryEdit = null;
            }, this);

            this.queryEdit.sendRequest({ "RESTMETHOD": "GetSemanticWithList", "LAYERS": this.wmtsId });
        },

        // Инициализация семантик слоя
        _initLayerSemanticList: function(sync, callback_complete) {
            if (!this.wmtsId || this.wmtsId == '' || !this.srv)
                return;
            this.queryLayerSemanticList = new EditQueries(this.srv, this.map);

            this.queryLayerSemanticList.onDataLoad = GWTK.Util.bind(function(response, context, textStatus) {

                this.layerSemanticList = this.onDataLoaded(response, context, textStatus);
                if (this.layerSemanticList) {
                    this.loadlayerSemanticList = true;
                }
                if (callback_complete && $.isFunction(callback_complete)) {
                    callback_complete(this.layerSemanticList, textStatus, this);
                }

                this.queryLayerSemanticList = null;

            }, this);

            var options = { "RESTMETHOD": "GetLayerSemanticList", "LAYER": this.wmtsId, "INMAP": 0 };
            if (this.layer.wms) {
                if (this.layer.codeList !== false) {
                    options.codelist = this.layer.codeList;
                }
                if (this.layer.typeNames !== false) {
                    options.typeNames = this.layer.typeNames;
                }
            }
            this.queryLayerSemanticList.sendRequest(options, sync);
        },

        // запросить имя класификатора
        getName: function() {
            if (!this.name)
                return this.name;
            var name = decodeURIComponent(this.name);
            var sep = '\\';
            if (name.indexOf('\\') == -1)
                sep = '/';
            var arr = name.split(sep);
            if (arr[arr.length - 1] == "")
                arr.pop();
            arr.pop();              // убрать цвет
            arr.pop();              // убрать код объекта

            return arr.join('');
        },

        // Загрузка объектов с сервера
        loadObjects: function(legend) {
            if (!legend) return;
            this.legend = legend;
            var l = '_' + this.layer.xId;
            this.name = legend.imgpath;
            var node, bsdlayer, mass;
            for (var i = 0; i < legend.items.length; i++) {
                if (legend.items[i].nodes.length == 0)
                    continue;
                mass = legend.items[i].id.split("_");
                if (mass == null || mass.length < 2)
                    continue;
                bsdlayer = mass[mass.length - 1];
                for (var j = 0; j < legend.items[i].nodes.length; j++) {
                    node = legend.items[i].nodes[j];
                    var rscobject = {};
                    rscobject.code = node.code;
                    rscobject.local = node.local;
                    rscobject.segmentname = legend.items[i].text;
                    rscobject.segmentkey = bsdlayer;
                    rscobject.name = node.text;
                    var newid = node.id.replace(new RegExp(l, 'g'), "");
                    rscobject.key = newid;
                    rscobject.image = node.img;
                    rscobject.cssimage = node.css;
                    rscobject.url = node.url;
                    this.rscobjects.push(rscobject);
                }
                ;
            }

            // Триггер на завершение загрузки классификатора
            if (this.map.eventPane) {
                $(this.map.eventPane).trigger({ type: 'loadclassifier', legend: this.legend, layer: this.layer });
            }

        },

        // Запросить объект по ключу или коду (для запросу по коду: если серия, будет взят первый объект в списке)
        getobject: function(key, code) {
            if (key) {
                key = key.toLowerCase();
            }
            if (code) {
                code = code.toLowerCase();
            }
            for (var i = 0; i < this.rscobjects.length; i++) {
                if (key) {
                    if (this.rscobjects[i].key.toLowerCase() == key)
                        return this.rscobjects[i];
                }else{
                    if (code) {
                        if (this.rscobjects[i].code.toLowerCase() == code)
                            return this.rscobjects[i];
                    }
                }
            }
        },


        // Запросить индекс объекта
        getobjectindex: function(key) {
            for (var i = 0; i < this.rscobjects.length; i++) {
                if (this.rscobjects[i].key.toLowerCase() == key.toLowerCase())
                    return i;
            }
        },

        // Запросить семантику по коду объекта
        // getsemanticsByCode: function(code, content) {
        getsemanticsByCode: function (code, fn_callback) {
            if (!code) return;
            var rscobject = this.getobject(null, code);
            if (rscobject)
                // return this.getsemantics(rscobject.key, content);
                this.getsemantics(rscobject.key, fn_callback);
        },

        // Запросить семантику по ключу объекта
        // getsemantics: function(key, content) {
        getsemantics: function (key, fn_callback) {
            if (!key) return;
            var rscobject = this.getobject(key);
            if (rscobject && rscobject.rscsemantics) {
                if (fn_callback) {
                    fn_callback(rscobject.rscsemantics);
                }
                return rscobject.rscsemantics;
            }
            if (this.layer instanceof GWTK.graphicLayer == false) {
                if (!this.wmtsId || this.wmtsId == '')
                    return;

                // иначе считаем из классификатора
                this.queryEdit = new EditQueries(this.srv, this.map);
                this.queryEdit.onDataLoad = this.onDataLoaded;
                this.queryEdit.fn_callback = GWTK.Util.bind(function(){
                    var rscobject = this.getobject(key);
                    if (rscobject && rscobject.rscsemantics) {
                        if (fn_callback) {
                            fn_callback(rscobject.rscsemantics);
                        }
                       else {
                            return rscobject.rscsemantics;
                        }
                        this.queryEdit = null;
                    }
                }, this);
                // this.queryEdit.sendRequest({ "RESTMETHOD": "GetSemByObjKey", "LAYERS": this.wmtsId, "OBJECTKEY": key }, false);
                this.queryEdit.sendRequest({ "RESTMETHOD": "GetSemByObjKey", "LAYERS": this.wmtsId, "OBJECTKEY": key }, true);
            }

            // var rscobject = this.getobject(key);
            // if (rscobject && rscobject.rscsemantics)
            //     return rscobject.rscsemantics;
        },

        // запросить локализацию по коду (номеру)
        getlocal: function(local) {
            if (!local)
                return;
            switch (local.toString()) {
                case "0":
                    return "linestring";
                case "1":
                    return "polygon";
                case "2":
                    return "point";
                case "3":
                    return "title";
                case "4":
                    return "vector";
                default:
                    return;
            }
        },

        // запросить наименование локализации по коду (номеру)
        getlocalName: function(local) {
            if (!local)
                return;
            switch (local.toString()) {
                case "0":
                    return w2utils.lang("Linear objects");
                case "1":
                    return w2utils.lang("Vulgar objects");
                case "2":
                    return w2utils.lang("Dot objects");
                case "3":
                    return w2utils.lang("Signatures");
                case "4":
                    return w2utils.lang("Vector objects");
                default:
                    return;
            }
        },

        // запросить номер локализацтт локализацию по названию
        getlocalByName: function(name) {
            if (!name) return;
            switch (name.toLowerCase()) {
                case "linestring":
                    return "0";
                case "polygon":
                    return "1"
                case "point":
                    return "2";
                case "title":
                    return "3";
                case "vector":
                    return "4";
                default:
                    return;
            }
        },


        // Обновить семантику объекта по ключу объекта
        // только для графических объектов
        updatesemanticsobject: function(key, semantics, fn_callback) {
            if (this.layer instanceof GWTK.graphicLayer == false || !semantics) {
                 if (fn_callback) {
                     fn_callback();
                 }
                return;
            }

            // var rscsemantics = this.getsemantics(key);
            this.getsemantics(key, GWTK.Util.bind(function(rscsemantics){
                if (rscsemantics) {
                    rscsemantics.splice(0, rscsemantics.length);
                    for (var i = 0; i < semantics.length; i++)
                        rscsemantics.push(semantics[i]);
                }
                if (fn_callback) {
                    fn_callback();
                }
            }));
            // if (!rscsemantics) return;
            // rscsemantics.splice(0, rscsemantics.length);
            // for (var i = 0; i < semantics.length; i++)
            //     rscsemantics.push(semantics[i]);
        },

        // // Запросить список семантик типа классификатор
        // getclassifiersematiclist: function () {
        //     // Если не загружен список семантик
        //     if (!this.loadclassifiersematiclist) {
        //         this.initwfs(false);
        //     }
        //
        //     return this.classifiersematiclist;
        // },


        // запросить справочник семантики типа классификатор по ключу семантики
        getsemanticreference: function(key) {
            var reference = [];
            if (!key) return reference;

            // Если не загружен список семантик
            if (!this.loadclassifiersematiclist) {
                this.getclassifiersematiclist(false);
                //this.initwfs(false);
            }

            // Если список загружен, но там ничего нет
            if (!this.classifiersematiclist || this.classifiersematiclist.length == 0)
                return reference;

            var i, len = this.classifiersematiclist.length;
            for (i = 0; i < len; i++) {
                if (this.classifiersematiclist[i]['key'] == key) {
                    return this.classifiersematiclist[i]['reference'];
                }
            }
            return reference;
        },


        // Ошибка при выполнении запроса
        error: function(context, message, rest) {
            console.log(message);
            switch (rest) {
                case 'GetSemanticWithList':
                    context.classifiersematiclist = new Array();
                    context.loadclassifiersematiclist = true;
                    break;
                case 'GetLayerSemanticList':
                    context.layerSemanticList = new Array();
                    context.loadlayerSemanticList = true;
                    break;
            }

            context.queryEdit = null;
        },

        // Ошибка при загрузке класификатора
        onError: function(object, textStatus, errorThrown) {
            // var eventPanelId = this.map.eventPane.id;
            this.isQueryInitLegend = false;
            $(this.map.eventPane).trigger({ type: 'loadclassifierError', layer: this.layer });
        },

        // обработчик ответа сервера
        onDataLoaded: function(response, context, status) {
            if (!response) return;
            response = response.replace(/\r|\n/g, '');  // удалить перенос строки, перенос каретки

            var rest = (this.queryEdit && this.queryEdit.options && this.queryEdit.options.RESTMETHOD) ? this.queryEdit.options.RESTMETHOD : null;

            if (response.indexOf('ExceptionReport') != -1) {
                this.error(this, response, rest);
                // this.queryEdit = null;
                return;
            }

            try {
                var obj = JSON.parse(response), restcode = obj.restcode,
                    message = "Ошибка чтения данных, метод " + rest + ": " + obj.message;
                rest = obj.restmethod;

                if (restcode != 1) { // ошибка
                    alert(message);
                    if (window.console) console.log(message);
                    return;
                }

                switch (rest) {
                    case 'GetLayerSemanticList':
                        return obj.features;

                    case 'GetSemanticWithList':
                        return obj.classifiersematiclist;

                    case 'GetSemByObjKey':
                        var newrscobject = obj.rscobject,
                            rscobject = this.getobject(newrscobject.key),
                            i = this.getobjectindex(newrscobject.key),
                            updaterscobject;

                        if (newrscobject) {
                            updaterscobject = JSON.parse(JSON.stringify(newrscobject));
                            this.rscobjects.push(updaterscobject);
                        }
                        if (rscobject) {
                            updaterscobject.image = rscobject.image;
                            updaterscobject.cssimage = rscobject.cssimage;
                            updaterscobject.name = rscobject.name;
                            this.rscobjects.splice(i, 1, updaterscobject)

                        }
                        // if (rscobject && newrscobject) {
                        //     var img = rscobject.image, css = rscobject.cssimage, name = rscobject.name;
                        //     rscobject = JSON.parse(JSON.stringify(newrscobject));
                        //     rscobject.image = img;
                        //     rscobject.cssimage = css;
                        //     rscobject.name = name;
                        //     this.rscobjects.splice(i, 1, rscobject)
                        // }
                        if (this.queryEdit && this.queryEdit.fn_callback) {
                            this.queryEdit.fn_callback();
                        }
                        return;

                }
            } catch (err) {
                this.error(this, err, rest);
            }
            ;
        },

        /**
         * Загрузка данных из классификатора
         * @method  onLoadClassifier
         * @param event {Object} Событие
         */
        // ===============================================================
        onLoadClassifier: function(event) {
            $(this.map.eventPane).off('loadclassifier', this.onLoadClassifier);
            this.queryWfs = null;
            this.loadclassifier = true;
        },

        /**
         * Ошибка при загрузке данных из классификатора
         * @method  onLoadClassifierError
         * @param event {Object} Событие
         */
        // ===============================================================
        onLoadClassifierError: function(event) {
            $(this.map.eventPane).off('loadclassifierError', this.onLoadClassifierError);
            this.queryWfs = null;
            console.log(w2utils.lang("Legend layer is not initialized. Layer ") + this.layer.alias);
        }

    }
}

