/*************************************** Полищук Г.В.  14/01/19 ****
 **************************************** Соколова Т.О. 23/01/19 ****
 **************************************** Нефедьева О.  26/03/19 ****
 **************************************** Помозов Е.В.  10/03/20 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Управление локальными слоями                 *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {
    /**
     * Управление локальными  слоями
     * (поддержка GeoJSON и GML/XML файлов)
     * @class GWTK.localMapControl
     * @constructor GWTK.localMapControl
     * @param map {Object} ссылка на карту
     */
    GWTK.LocalMapControl = function(map) {
        this.toolname = "localMapControl";
        this.map = map;
        if (!map) {
            console.log("GWTK.LocalMapControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return this;
        }
        this._maxGmlSize = 8388608;              // максимальный размер Gml файла - 8 MB
        
        this.map.maptools.push(this);
        
        this.xsdList = [];                       // список xsd-схем сервиса
        
        this.init();
    };
    
    GWTK.LocalMapControl.prototype = {
        
        /**
         *  Инициализация
         *  @method init
         */
        // ===============================================================
        init: function() {
            var lmc = this;
            
            this._formName = "gmlform_" + this.map.divID;
            
            $(this.map.eventPane).on('locallayer.localcontrol', function(event) {
                lmc.onLocalLayer(event);
            });
            
            $(this.map.eventPane).on('layercommand.localcontrol', function(event) {
                lmc.onLayerCommandRemove(event);
            });
            
            this._getXsdList();
            
            return;
        },
        
        /**
         * Деструктор
         * @method destroy
         */
        // ===============================================================
        destroy: function() {
            
            $(this.map.eventPane).off('locallayer.localcontrol');
            
            $(this.map.eventPane).off('layercommand.localcontrol');
            
            var bt = $("#gmldialog_" + this.map.divID).find('.panel-info-close');
            
            if (bt.length > 0) {
                bt.off();
            }
            
            $("#gmldialog_" + this.map.divID).remove();
            
        },
        
        /**
         * Обработчик события добавления в карту локального слоя
         * @method onLocalLayer
         * @param event {Object} объект события `locallayer`
         */
        // ===============================================================
        onLocalLayer: function(event) {
            
            if (typeof event === 'undefined' || typeof event.maplayer === 'undefined') {
                console.log('GWTK.LocalMapControl. Open error of Locallayer');
                return;
            }
            var param = event.maplayer;
            
            if (param.act === 'create') {
                param.edit = true;
                this.createGraphicLayer(param);
            }else if (param.act === 'open') {
                this.openLocalLayer(param.file, param.edit);
            }
            
            return;
        },
        
        /**
         * Открыть слой из локального файла (geojson или gml/xml)
         * @method openLocalLayer
         * @param file {File} объект File, загруженный пользователем, GeoJSON или GML
         */
        // ===============================================================
        openLocalLayer: function(file, editing) {
            
            var fileName = file, that = this;
            
            var name = /(.+)\./.exec(fileName.name)[1],
                
                reader = new FileReader();
            
            if (!name || name.length == 0) {
                name = w2utils.lang("New layer");
            }
            
            reader.onload = function(e) {
                var json = null;
                
                if (e.target.result.indexOf('<?xml') !== -1 && e.target.result.indexOf('<gml:FeatureCollection') !== -1) {
                    
                    // Если нет url panorama - не открываем
                    if (!that.map.options.url) {
                        var error = GWTK.Util.notfoundPanoranaUrl();
                        console.log(error);
                        w2alert(error);
                        return;
                    }
                    that._publishLayerByGML(e, fileName);                        // опубликовать и открыть Gml-file в карте
                    
                    return;
                }
                
                try {
                    
                    json = JSON.parse(e.target.result);                               // открыть GeoJSON-file в карте
                    
                    if (!json["type"] || json["type"] != "FeatureCollection")
                        throw new SyntaxError("JSON type \"FeatureCollection\" required!");
                    
                } catch (err) {
                    console.log(w2utils.lang("Invalid file format") + "  " + fileName.name);
                    console.log(err);
                    console.log(w2utils.lang("The file is not in the format GeoJSON"));
                    return;
                }
                
                that.map.setCursor('progress');
                
                var id = GWTK.Util.createGUID();
                that.createGraphicLayer({ id: id, alias: name, edit: editing, json: json });
                
                that.map.setCursor('pointer');
                
                return;
            };
            
            reader.readAsText(fileName);
            
        },
        
        /**
         * Создать графический слой карты и добавить в Состав карты
         * @method createGraphicLayer
         * @param params {Object} Параметры слоя
         * {id:"Идентификатор слоя",alias:"Название",json:"локальная карта в формате GeoJSON"}
         */
        // ===============================================================
        createGraphicLayer: function(params) {
            if (!this.map || !params) {
                return;
            }
            var alias = params.alias || w2utils.lang("New layer"),
                paramEditing = { "editing": true };
            if (typeof params.edit != 'undefined') {
                paramEditing.editing = params.edit;
            }
            var id = params.id || GWTK.Util.createGUID();
            
            var options = {
                "url": "",
                "id": id,
                "alias": alias,
                "selectObject": "1",
                "selectsearch": "0",
                "type": "svg"
            };
            
            // Создать удобоваримый json
            if (params.json) {
                options.jsondata = GWTK.UtilGraphicLayer.createJSONforGraphicLayer(params.json);
            }
            
            gl = this.map.addGraphicLayer(options, paramEditing);
            
            if (!gl) {
                this.map._removeLayer(options.xId);
                return;
            }
            
            // Добавим в дерево
            gl.addLayerTo(id, alias, { id: "localMapList", text: "Local layers" });
            
            return gl;
        },
        
        /**
         * Запросить список графических слоев
         * @method getLayerList
         * @return {Array} массив загруженных локальных карт или
         * `null` в случае их отсутствия
         */
        // ===============================================================
        getLayerList: function() {
            var list = [];
            var layers = this.map.layers;
            for (var i = 0; i < layers.length; i++) {
                if (layers[i].options.url == "")
                    list.push({
                        alias: layers[i].options.alias,
                        id: layers[i].options.id
                    });
            }
            if (list.length == 0)
                list = null;
            
            return list;
        },
        
        
        //*****************************************************************
        //      Методы для публикации локальных слоев GML               ***
        //                                                              ***
        //*****************************************************************
        
        /**
         * Запросить список xsd схем
         * @method _getXsdList
         */
        // ===============================================================
        _getXsdList: function() {
            if (!this.map.options.url) {
                console.log(GWTK.Util.notfoundPanoranaUrl());
                // return;
            }
            // var wfs = new WfsQueries(this.map.options.url, this.map),
            //     tool = this;
            // wfs.getxsdlist(function(xml) {
            //     tool._onGetXsdList(xml);
            //     return;
            // });
            //
            // return;
            const httpParams = GWTK.RequestServices.createHttpParams(this.map);
            const wfs = GWTK.RequestServices.retrieveOrCreate(httpParams, 'REST');
            wfs.getXsdList().then((result) => {
                this._onGetXsdList(result.data);
            })
        },
        
        /**
         * Обработчик получения списка xsd схем
         * @method _onGetXsdList
         * @param xml {String} xml-ответ операции GetXsdList
         */
        // ===============================================================
        _onGetXsdList: function(xml) {
            
            this.xsdList = [];
            
            var $member = $(xml).find('member'),
                $child = $member.find('value').children();
            
            if ($member.length == 0 || $child.length == 0) {
                console.log(w2utils.lang("Failed to get data"));
                console.log(xml);
                return;
            }
            
            var slist = $child.html(),
                list = slist.split(','), i, len;
            
            for (i = 0; len = list.length, i < len; i++) {
                this.xsdList.push({ id: i + 1, text: list[i] });
            }
            
            return;
        },
        
        /**
         * Опубликовать слой из GML
         * @method _publishLayerByGML
         * @param event {Object} объект события onload FileReader'a
         * @param filename {String} имя файла
         */
        // ===============================================================
        _publishLayerByGML: function(event, file) {
            if (!event || !event.target || !event.target.result) return;
            
            if (event.target.result.indexOf('<?xml') == -1 || event.target.result.indexOf('<gml:FeatureCollection') == -1) {
                console.log(w2utils.lang("The file is not in the format GML"));
                w2alert(w2utils.lang("Invalid file format") + "!");
                return;
            }
            
            // открыть диалог
            this._createFormGML(file.name, file.size);
            
            if (w2ui[this._formName]) {
                w2ui[this._formName]._filedata = event.target.result;         // данные
                w2ui[this._formName]._file = file.name;                       // имя файла
            }
            
            return;
        },
        
        /**
         * Создать диалог загрузки файла
         * @method _createFormGML
         * @param filename {String} имя GML-файла
         * @param filesize {Number} размер GML-файла
         */
        // ===============================================================
        _createFormGML: function(filename, filesize) {
            
            var $win = $("#gmldialog_" + this.map.divID);
            var dialog, div, filename = filename, tool = this, $bt,
                wh = this.map.getWindowSize(), size = filesize, _name = filename.split('.');
            
            size = parseFloat(size) / 1024.;
            
            // диалог
            if ($win.length === 0) {
                dialog = GWTK.DomUtil.create('div', 'map-panel-form-gml map-panel-def', this.map.mapPaneOld);
                dialog.id = "gmldialog_" + this.map.divID;
                $(dialog).css({ 'left': (wh[0] / 2 - 5) + 'px' });
                
                GWTK.Util.createHeaderForComponent({
                    'name': "Open GML layer", 'parent': dialog, callback: function() {
                        $(dialog).hide('slow');
                        var form = $(dialog).find('.map-panel-gml-content');
                        w2ui[form[0].id].destroy();
                        var bt = $(dialog).find('.gml-btn-open');
                        bt.off();
                    }
                });
                
                GWTK.panelUI({ draggable: true, $element: $(dialog), resizable: false });
            }else{
                dialog = $win[0];
            }
            
            // форма
            $win = $(dialog).find('.map-panel-gml-content');
            if ($win.length === 0) {
                div = GWTK.DomUtil.create('div', 'map-panel-gml-content', dialog);
                div.id = this._formName;
                $(dialog).append('<div style="margin: 10px 0px 10px 170px; "><button class="w2ui-btn gml-btn-open" style="height:25px !important; width:90px; border-radius: 3px;">' + w2utils.lang("Open") +
                    '</button></div>');
            }else{
                div = $win[0];
                dialog.style.display = 'block';
            }
            
            // форма отображается...обновляем
            if (w2ui[div.id] !== undefined) {
                w2ui[div.id].record = { filename: filename, filesize: Math.ceil(size), crs: this.map.options.crs };
                w2ui[div.id]._filedata = '';
                $(dialog).find('.gml-btn-open').prop("disabled", false);
                w2ui[div.id].render();
                if (parseInt(filesize) > this._maxGmlSize) {
                    $(dialog).find('#filesize').addClass("w2ui-error");
                    $('#filesize').w2tag(w2utils.lang('This file size more then 8 MB!'));
                    $(dialog).find('.gml-btn-open').prop("disabled", true);
                }else{
                    $(dialog).find('#filesize').removeClass("w2ui-error");
                    $('#filesize').w2tag('');
                }
                return div.id;
            }
            
            $bt = $(dialog).find('.gml-btn-open');
            $bt.off();
            $bt.on('click.localcontrol', function(e) {
                tool._loadGmlToServer();
                e.stopPropagation();
            });
            
            $(div).w2form({
                name: div.id,
                fields: [
                    {
                        name: 'filename',
                        type: 'text',
                        html: { caption: w2utils.lang("File name"), column: 0, "attr": 'style="width:200px;" readonly' }
                    },
                    {
                        name: 'filesize',
                        type: 'text',
                        html: { caption: w2utils.lang("File size (KB)"), column: 0, "attr": 'style="width:200px;" readonly' }
                    },
                    {
                        name: 'xsd',
                        type: 'list',
                        required: true,
                        html: { caption: w2utils.lang("XSD schema name"), column: 1, "attr": 'style="width:200px"' },
                        options: { items: tool.xsdList }
                    },
                    {
                        name: 'mapname',
                        type: 'alphanumeric',
                        html: { caption: w2utils.lang("Map name"), column: 2, "attr": 'style="width:200px;"' }
                    },
                    {
                        name: 'crs',
                        type: 'int',
                        options: { 'autoFormat': false, 'groupSymbol': '' },
                        html: { caption: w2utils.lang("CRS code"), column: 3, "attr": 'style="width:200px;"' }
                    },
                    {
                        name: 'scale',
                        type: 'int',
                        options: { 'groupSymbol': ' ' },
                        html: { caption: w2utils.lang("Map scale"), column: 4, "attr": 'style="width:200px;"' }
                    },
                    //{ name: 'savedpath', type: 'text', html: { caption: w2utils.lang("Virtual folder"), column: 5, "attr": 'style="width:200px;"' } },
                    {
                        name: 'publicaccess',
                        type: 'checkbox',
                        required: false,
                        html: { caption: w2utils.lang("Public access"), column: 6 }
                    },
                    {
                        name: 'selectobjects',
                        type: 'checkbox',
                        required: false,
                        html: { caption: w2utils.lang("Select objects"), column: 7 }
                    }
                ],
                record: {
                    filename: filename,
                    filesize: Math.ceil(size),
                    mapname: _name[0],
                    crs: tool.map.options.crs,
                    scale: '100000',
                    publicaccess: 1,
                    selectobjects: 1
                },
                _filedata: ''
            });
            
            
            w2ui[div.id].render();
            
            $bt.prop("disabled", false);
            
            $(dialog).show();
            
            if (parseInt(filesize) > this._maxGmlSize) {
                $(dialog).find('#filesize').addClass("w2ui-error");
                $bt.prop("disabled", true);
                $('#filesize').w2tag(w2utils.lang('This file size more then 8 MB!'));
            }else{
                $(dialog).find('#filesize').removeClass("w2ui-error");
                $('#filesize').w2tag('');
            }
            
            return div.id;
        },
        
        /**
         * Загрузить GML-файл на сервер
         * @method _loadGmlToServer
         */
        // ===============================================================
        _loadGmlToServer: function() {
            
            if (!this.map.options.url) {
                console.log(GWTK.Util.notfoundPanoranaUrl());
                return;
            }
            
            if (!w2ui[this._formName]._filedata) {
                var msg = 'GWTK.LocalMapControl. ' + w2utils.lang("Runtime error") + '! GML --> ' + w2ui[this._formName]._file;
                console.log(msg);
                w2alert(msg);
                return;
            }
            
            var err = w2ui[this._formName].validate();
            
            if (err && err.length > 0) {
                return false;
            }
            
            
            w2utils.lock(w2ui[this._formName].box, '', true);
            
            var record = w2ui[this._formName].record;
            
            var param = { 'XSDNAME': record.xsd.text, 'LAYER': '', 'CRS': record.crs };
            
            if (typeof record.savedpath !== 'undefined') {
                param.SAVEDPATH = encodeURIComponent(record.savedpath);
            }
            if (typeof record.mapname !== 'undefined') {
                param.LAYER = record.mapname;
                if (param.LAYER[0] >= "0" && param.LAYER[0] <= "9") {
                    param.LAYER = 'gml' + param.LAYER;
                }
                param.LAYER = encodeURIComponent(param.LAYER);
            }
            if (typeof record.scale !== 'undefined') {
                param.CREATEMAPSCALE = record.scale;
            }
            if (typeof record.publicaccess !== 'undefined') {
                param.VIRTUALFOLDER = record.publicaccess;
            }
            
            // var wfs = new WfsQueries(this.map.options.url, this.map),
            //     tool = this;
            //
            // wfs._file = w2ui[this._formName]._file;
            //
            // wfs.loadgmlbyxsd(param, w2ui[this._formName]._filedata, function(xml) {
            //     tool._openGmlLayer(xml, this._file);
            //     return;
            // });
            
            // return;
            const httpParams = GWTK.RequestServices.createHttpParams(this.map);
            const wfs = GWTK.RequestServices.retrieveOrCreate(httpParams, 'REST');
            wfs.loadGmlByXsd(param, { data: w2ui[this._formName]._filedata }).then((result) => {
                this._openGmlLayer(result.data, w2ui[this._formName]._file);
            })
        },
        
        /**
         * Открыть слой в карте
         * @method _openGmlLayer
         * @param xml {String} xml-ответ операции загрузки GML на сервер
         * @param filename {String} имя GML файла
         */
        // ===============================================================
        _openGmlLayer: function(xml, filename) {
            
            if (!this.map.options.url) {
                console.log(GWTK.Util.notfoundPanoranaUrl());
                return;
            }
            
            var record = w2ui[this._formName].record;
            var selectobjects = 0;
            if (typeof record.selectobjects !== 'undefined') {
                selectobjects = record.selectobjects;
            }
            
            if (!xml || !filename) {
                this._errorGmlReport(xml, filename);
                w2utils.unlock(w2ui[this._formName].box);
                return;
            }
            var $layer = $(xml).find('LayerList NewLayer');
            
            if (!$layer.length) {
                this._errorGmlReport(xml, filename);
                w2utils.unlock(w2ui[this._formName].box);
                return;
            }
            
            var id = $layer.attr('id'), service = $layer.attr('ServiceType');            // id слоя и протокол обмена данными
            
            service = service.toLowerCase();
            
            if (!id || id.length === 0 || !service || service.length == 0) {
                this._errorGmlReport(xml, filename);
                w2utils.unlock(w2ui[this._formName].box);
                return;
            }
            if (service.indexOf('wms') === -1 && service.indexOf('wtms') === -1) {
                this._errorGmlReport(xml, filename);
                w2utils.unlock(w2ui[this._formName].box);
                return;
            }
            
            var _url = this.map.options.url + '?service=';
            
            if (service.indexOf('wms') !== -1) {
                _url += 'wms&request=GetMap&version=1.3.0&format=image/png&bbox=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt&layers=' + id;
            }else{
                _url += 'wmts&request=GetTile&version=1.0.0&style=default&format=image/png&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&LAYER=' + id;
            }
            
            // убрать точки из id
            var arr = id.split('.');
            id = 'gml_' + arr.join('_');
            
            // открыть слой в карте
            var layer = this.map.openLayer({
                'id': id,
                'url': _url,
                'alias': filename,
                'localgml': true,
                "selectObject": selectobjects
            });
            if (typeof layer == 'object') {
                this.map.tiles.setLayerViewOrder(id);
                layer.update();
            }
            
            // добавить в дерево данных карты
            this.addLayerTo(id, filename, { id: "localMapList", text: "Local layers" });
            
            this.map._writeCookie();
            
            w2utils.unlock(w2ui[this._formName].box);
            
            var bt = $("#gmldialog_" + this.map.divID).find('.panel-info-close');
            
            if (bt.length > 0) {
                bt.click();
            }
            
            
        },
        
        /**
         * Отчет об ошибке при загрузке GML
         * @method _errorGmlReport
         * @param xml {String} xml-ответ операции загрузки GML на сервер
         * @param filename {String} имя GML файла
         */
        // ===============================================================
        _errorGmlReport: function(xml, filename) {
            var msg = 'GWTK.LocalMapControl. ' + w2utils.lang("Map layer creation error") + '. GML --> ' + filename;
            console.log(msg);
            console.log(xml);
            w2alert(msg);
            
            return;
        },
        
        getServerLog: function(xml) {
            if (!xml) return '';
            var $members = $(xml).find('LayersData member');
            var $names = $(xml).find('LayersData member name'), i, len, log = "", log_txt = '';
            for (i = 0; len = $names.length, i < len; i++) {
                if ($($names[i]).text() == 'FILEDATA') {
                    log = $($members[i]).find('value');                   // журнал загрузки
                    log_txt = window.atob(log.text());
                }
            }
            //console.log($members, log_txt);
            
            return log_txt;
        },
        
        /**
         * Добавить слой в дерево данных карты
         * @method addLayerTo
         * @param id {String} идентификатор слоя в карте
         * @param alias {String} название слоя
         * @param params {Object} параметры родительского узла {id:"идентификатор", text:"название группы", "img":"icon-page"}
         */
        // ===============================================================
        addLayerTo: function(id, alias, params) {
            
            // добавить node слоя в родительский узел
            var node = {
                "id": id, "group": false,
                "clickable": true, "isLayer": true,
                "gClickable": true, "expanded": false,
                "text": alias, "img": "icon-page",
                "remove": true,
                "panischecked": true,
                "eventPanelId": this.map.eventPane.id,
                "showsettings": this.map.options.showsettings,
                "parentId": 'userlayers'
            };
            
            // mapContent.addNode(root, node);
            this.map.onLayerListChanged(node);
        },
        
        /**
         * Обработчик команды удаления слоя
         * @method onLayerCommandRemove
         * @param event {Object} объект события `layercommand`
         */
        // ===============================================================
        onLayerCommandRemove: function(event) {
            if (!event || !event.maplayer || typeof event.maplayer.act === 'undefined') {
                return;
            }
            if (event.maplayer.act !== 'remove' || typeof event.maplayer.id === 'undefined') {
                return;
            }
            if (event.maplayer.id.indexOf('gml_') !== -1) {
                this.map.closeLayer(event.maplayer.id);
            }
            
            return;
        }
        
    };
}