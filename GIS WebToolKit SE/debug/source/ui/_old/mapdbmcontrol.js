/************************************** Нефедьева О.   09/12/20 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                  Пространственная база данных                    *
*                                                                  *
*******************************************************************/
/**
 * Элемент управления База данных
 * Управление таблицами dbm-слоев карты
 * Наследует GWTK.UserControl
 * Создание: GWTK.mapCreateUserControl('mapdbm', map, protoMapDbm, true);
 * @class GWTK.UserControl, имя инструмента 'mapdbm'
 * Хранение состояния элементов: localStorage.gwtk.states[this.toolname + '-' + <md5hash>] 
 */
import { mapSearchObjectsByIdList, SearchObjectsResult } from '~/api/MapApi';

GWTK.DbmLayerDescriptor = {
    'layer': null,
    'dblist': [],
    'schemename': '' 
};

GWTK.protoMapDbm = {

    title: "",

    toolname: "mapdbm",

    button_options: {
        "class": 'control-button clickable control-button-mapdbm'
    },

    panel_options: {
        'class': 'map-panel-def mapdbm-panel',
        'class-controlspanel': 'map-panel-def-flex objects-panel-flex',
        'display': 'none',
        'header': true,
        'hidable': true,
        'draggable': true,
        'resizable': true,
        'minimize': false
    },

    idtabs: 'tabs_mapdbm',

    nametabs: 'tabsmapdbm',

    namegrid: 'grid_mapdbm_',

    dbmlayers: [],

    grids: [],

    error: false,

    tableSearch: false,
  
    /**
     * Инициализировать 
     * @method init
     */
    init: function () {
        
        this.toolname = 'mapdbm';

        this.title = w2utils.lang('Spatial database');

        this.messageLocator = 'GWTK.MapDbm',

        this.createButton({ "class": 'control-button clickable control-button-mapdbm' });
        
        this.$button.hide();

        this.createPanel();

        this.initPanel();

        this._createTabs();

        this.initEvents();
        
        if (this.dbmlayers.length == 0){
            this._getDbmLayers();
        }
    },

    /**
     * Инициализировать панель
     * @method initPanel
     */
    initPanel:function(){
        if (this.panel){
            this.$panel = $(this.panel);
            this.$panel.height(500)
                       .append('<div id="mapdbm-body" class="mapdbm-panel-content"></div>'); 
            this.$body = $(".mapdbm-panel-content");
        }
    },

    /**
     * Инициализировать события
     * @method initEvents
     */
    initEvents: function(){
        if (this.button) {
            $(this.button).on('click', function (event) {
                if (this.button.disabled){
                    return;
                }
                if ($(this.panel).is(':visible')){
                    this.$panel.hide('slow');
                } 
                else {
                    if ($(this.panel).hasClass('panel-minimized')){
                        return;
                    }
                    $(this.panel).show('slow');
                    this.map.showControlsPanel();
                    this._createTables();
                }
            }.bind(this));
        }
        this.$panel.on('resize', function (event) { this.resize(event); }.bind(this));

        var $eventPane = $(this.map.eventPane);
        
        $eventPane.on('resizecontrolspanel.mapdbm', function (event) {
            var that = this; setTimeout(function(){ that.resize() }, 400); 
        }.bind(this));

        this.onFeatureInfoRefreshed = this.onFeatureInfoRefreshed.bind(this);
                
        $eventPane.on('notifyrestorepanel.mapdbm', function(event) {
            if (!event || !event.context || event.context !== this.toolname) { return; }
            this._resetTab( w2ui[this.nametabs].active );
        }.bind(this));  

        this.map.on( { type: 'featureinforefreshed', 
            target: 'map', 
            phase: 'before' }, 
            this.onFeatureInfoRefreshed 
        );
    },

    /**
     * Деструктор
     * @method destroy
     * освободить ресурсы, отключить обработчики событий
     */
    destroy: function () {
    
        if ($(this.panel).is(':visible')){
            this.$panel.hide('10');
        } 
        
        this.map.off('featureinforefreshed', this.onFeatureInfoRefreshed);
            
        $(this.map.eventPane).off('resizecontrolspanel.mapdbm')
                             .off('notifyrestorepanel.mapdbm');
        
        this.$panel.resizable('destroy');

        if (this.$panel.is('.ui-draggable'))
            this.$panel.draggable('destroy');                     
        
        this.dbmlayers.splice(0);

        if (w2ui[this.nametabs]){
            var tab = w2ui[this.nametabs].active; 
            if (tab){
                var xid = w2ui[this.nametabs].get(tab).xid;
                if (xid) {
                    if (w2ui[this.namegrid + xid]) w2ui[this.namegrid + xid].destroy();
                    if (w2ui['sidebar_' + xid]) w2ui['sidebar_' + xid].destroy();
                    if (w2ui['layout_' + xid]) w2ui['layout_' + xid].destroy();
                }
            }
            w2ui[this.nametabs].destroy();
        }
        
        this.$button.remove();
        this.$panel.remove();
    },

    /**
     * Проверить активность
     * @method isActive
     * @returns {boolean} `true`- режим активен
     */
    isActive: function(){
        return ($(this.panel).is(':visible'));
    },

    /**
     * Получить список dbm-слоев карты
     * @method _getDbmLayers
     */
    _getDbmLayers: function(){
        //'http://localhost/giswebservicese/service.php?restmethod=getlayers' 
        var servers = [], urls = [], i,
            layers = this._getMapLayers();                                         // слои с выбором объектов
          
        for (i = 0; i < layers.length; i++) {
            var server = GWTK.Util.getServerUrl(layers[i].options.url);
            if (server.indexOf('?') === (server.length - 1)){
                server = server.slice(0, server.length - 1);
            }
            if (servers.indexOf(server) === -1){
                servers.push(server);
            }
        }
        if (servers.length == 0) {
            console.log(this.messageLocator + '. ' + w2utils.lang('Dbm layers are not contained in the map') + '.');
            return;
        }
        
        for (i = 0; i < servers.length; i++) {                                     // список адресов для запроса getlayers 
            urls.push(servers[i] + '?restmethod=getlayers');
        }
                
        GWTK.Util.showWait();

        GWTK.Util.doPromise(urls, this.onGetDbmLayers.bind(this), [], this.map);   // запросить данные            
    },

    /**
     * Обработка ответа операции getlayers 
     * @method onGetDbmLayers
     * @param a, b {Array} ответ операции getlayers
     */
    onGetDbmLayers: function(a, b){
        var data = '', response = [];
        if (a && a.length > 0){
            response = a;
        }
        else if (b.length > 0){
            response = b;
        }
        else{
            this.onError(true, w2utils.lang('Failed to get data'));
            return;
        }
        
        this.dbmlayers = [];

        for (var i = 0, len = response.length; i < len; i++){
            data = response[i].text;
            if (!data || data.length === 0 || data.indexOf('<?xml') !== 0){
                this.onError(true, w2utils.lang('Failed to get data'));
                continue;
            }
            this.loadLayers(data);
        }

        if (this.dbmlayers && this.dbmlayers.length > 0){
            this.button.disabled = false;
            if (!this.map.hasMenu()){
                $(this.button).show();
            }
            this.map.trigger({type:'disablecomponent', 'command': 'cm_mapdbm', 'enabled': 1});
        }
        else {
            this.button.disabled = true;
            $(this.button).hide();
            GWTK.mapWriteProtocolMessage(this.map, {'text': 'GWTK.MapDbm. ' + w2utils.lang('Dbm layers are not contained in the map'), 'display': false});
            this.map.trigger({type:'disablecomponent', 'command': 'cm_mapdbm', 'enabled': 0});
        }

        GWTK.Util.hideWait();
    },

    /**
     * Загрузить данные dbm-слоев
     * @method loadData
     * @param data {String} ответ операции getlayers
     */
    loadLayers: function(data){
        if (typeof data !== 'string'){
            return;
        }
        var maplayers = this._getMapLayers(),               // слои карты с выбором объектов
        xmlDoc = $.parseXML(data),                          // ответ на запрос getlayers
        xml = $(xmlDoc), 
        idlayers = [], i;
        if (xml.context.documentElement.nodeName.toLowerCase() !== 'layerlist'){
            this.onError(true, w2utils.lang('Failed to get data'));
            GWTK.Util.hideWait();
            return;
        }
 
        // получаем общий список id DBM-слоев сервиса из ответа
        var layers = xml.find('Service[Type="WFS"]')
                        .find('Layer[DBM="1"]');
        this._getIdents({'layers': layers, 'idlayers': idlayers});

        var layers_t = xml.find('Service[Type="WFS-T"]')
                          .find('Layer[DBM="1"]');    
                         
        this._getIdents({'layers': layers_t, 'idlayers': idlayers});
                        
        if (idlayers.length == 0){
            return;
        }
        
        this._fillDbNames(layers);
        
        this._fillDbNames(layers_t);

        // заполняем список DBM-слоев в карте
        for ( i = 0; i < maplayers.length; i++) {
            if (maplayers[i].idLayer && idlayers.indexOf(maplayers[i].idLayer) !== -1){
                if (this.dbmlayers.indexOf(maplayers[i]) === -1)
                    this.dbmlayers.push(maplayers[i]);
            }
        }

    },

    /**
     * Получить список слоев карты с выделением объектов
     * @method _getMapLayers
     * @param data {String} ответ операции getlayers
     */
    _getMapLayers: function(){
        var layers = [], i, 
            types = ['wms', 'wmts'];
        for (i = 0; i < this.map.layers.length; i++) {
            if (this.map.layers[i].options.duty || !this.map.layers[i].options['mapdb']) {
                continue;
            }
            if (this.map.layers[i].selectObject != undefined && this.map.layers[i].selectObject == 1) {
                if ($.inArray(this.map.layers[i].getType(), types) !== -1)
                    layers.push(this.map.layers[i]);
            }
        }
        return layers;
    },

   /**
    * Получить dbm-слой по идентификатору 
    * @method getDbmLayerByxId
    * @param xid {string} идентификатор слоя в карте
    * @returns {object} объект слоя или `false` при ошибке
    */    
   getDbmLayerByxId: function(xid){
        if (!xid || this.dbmlayers.length == 0){
             return false;
        }
        for (var i = 0, len = this.dbmlayers.length; i < len; i++){
             if (this.dbmlayers[i].xId === xid){
                 return this.dbmlayers[i];
             }
        }
        return false;
    },

   /**
    * Получить список идентификаторов dbm-слоев 
    * @method _getIdents
    * @param param {Object} param.layers - xml-слои
    */    
    _getIdents: function(param){
        var layers = param.layers;
        for (var i=0, len = layers.length; i < len; i++ ){
            if ($(layers[i]).attr('DBM') && $(layers[i]).attr('DBM') == '1'){ 
                var id = $(layers[i]).attr('ID');
                if (param.idlayers.indexOf(id) === -1){    
                    param.idlayers.push(id);
                }
            }
        }
        return param;
    },

   /**
    * Заполнить список таблиц слоя 
    * @method _fillDbNames
    * @param xlayers {Array} xml-слои (Layer xml-документа)
    */    
   _fillDbNames: function(xlayers){
        if (!xlayers || xlayers.length == 0){
            return;
        }
        var i, j, mapid, lay;
        for ( j = 0; j < xlayers.length; j++){
            mapid = $(xlayers[j]).attr('ID');
            lay = this.map.tiles.getLayerByIdService(mapid);
            if (!lay || xlayers[j].children.length == 0) { continue; }
            lay.options.dbnames = [];
            for (i = 0; i < xlayers[j].children.length; i++){
                if (xlayers[j].children[i].nodeName === 'Dbname'){
                    lay.options.dbnames.push(xlayers[j].children[i].innerHTML)
                }            
            }
        }
    },

    /**
     * Создать элемент tabcontrol (управление вкладками слоев) 
     * @method _createTabs
     */
    _createTabs: function(){
        if (!this.$body) { return; }
        var id = this.namegrid;
        
        if (!w2ui[this.nametabs]){
            this.$body.append('<div id="' + this.idtabs + '" style="position:relative;border:none; height:30px;"></div>' +
                              '<div id="' + this.idtabs + '_content' + '" class="tabscontent"  style="height:440px; width:570px;"></div>'
            );
            this.$tabs = $("#" + this.idtabs);
            this.$tabs.w2tabs({
                name: this.nametabs,
                active: '', 
                tabs: [],                 
                ucont: this,
                onClick: function (event) {
                    if (this.active === event.target){
                        return;
                    }                    
                    this.ucont.$panel.find('.mapdbm-grid').hide();
                    event.onComplete = function(){
                        var xid = this.get(this.active).xid;
                        if (xid) {
                            $('#' + id + xid).show();
                            $("#layout_box_" + xid).show();
                            var grid = w2ui[id + xid];
                            if (!grid || grid.columns.length == 0){
                                this.ucont.getLayerGridFields(this.ucont.getDbmLayerByxId(xid));
                            }
                            else{
                                grid.render();
                            }
                        }
                    };
                }
            });
            this.$content = $('.tabscontent');
        }
        
        w2ui[this.nametabs].render();
        
    },

    /**
     * Добавить вкладку в tabcontrol
     * @method _addTab
     * @param id {string} идентификатор слоя в карте (xId)
     * @param text {string} текст вкладки
     */
    _addTab: function(id, text) {
        w2ui[this.nametabs].add({ id: 'tab_' + id, text: text, xid: id });
    },

    /**
     * Удалить вкладку в tabcontrol
     * @method _removeTab
     * @param id {string} идентификатор слоя
     */
    _removeTab: function(id) {
        if (!id) return;
        w2ui[this.nametabs].animateClose('tab_'+ id);
    },

    /**
     * Создать таблицы слоев карты
     * @method _createTables
     */    
    _createTables: function(){
        if (this.dbmlayers.length === 0){
            GWTK.mapWriteProtocolMessage(this.map, {'text': 'GWTK.MapDbm. ' + w2utils.lang('Dbm layers are not contained in the map'), 'display': false});
            return;
        }
        // восстановить текущую вкладку
        if (w2ui[this.nametabs].tabs.length > 0) {
            this._resetTab(w2ui[this.nametabs].active);
            return;
        }
        // добавить вкладки
        for (var i = 0, len = this.dbmlayers.length; i < len; i++){
            this._addTab(this.dbmlayers[i].xId, this.dbmlayers[i].alias);                       // вкладка
            this._createTabLayout(this.dbmlayers[i]);                                           // виджет Layout вкладки  
            this._createLayerGridBox(this.dbmlayers[i].xId, this.dbmlayers[i].options.dbnames); // контейнер грида 
        }
        
        // получить поля, заполнить грид первого по списку
        this.getLayerGridFields(this.dbmlayers[0]);                       // грид заполнится после получения полей
        
        // сделать текущим первый слой из списка
        w2ui[this.nametabs].click('tab_' + this.dbmlayers[0].xId);
    },

    /**
     * Восстановить вкладку
     * @method _resetTab
     * @param tabid {string} идентификатор вкладки
     */    
    _resetTab: function(tabid){
        if (!tabid || !w2ui[this.nametabs].get(tabid)) { 
            return; 
        }
        var tab = tabid,
        xid = w2ui[this.nametabs].get(tab).xid;
        var gridname = this.gridNameById(xid);
        if ( !gridname ) {
            return;
        }
        if (w2ui[gridname]) {
            var objselect = this.map.getSelectedObjects();
            if (objselect.length > 0){
                this.tableSearch = false;
                this.searchRecordsBySelectedObjects();
            }
            else{
                w2ui[gridname].reset(false);
            }
            //w2ui[gridname].resize();
        }
    },

    /**
     * Вывести грид слоя
     * @method _renderLayerGrid
     * @param maplayer {object} слой карты
     * @param columns {Array} массив колонок
     */    
    _renderLayerGrid: function(maplayer, columns, table){

        var columns = columns;

        this._customizeLayerGridColumns(columns);

        this._createLayerGrid(maplayer, columns, table);
        
        GWTK.Util.hideWait();
    },

    /**
     * Установить поиск грида
     * @method _setGridSearch
     * @param grid {object} грид
     * @param field {Array} массив полей поиска
     */    
    _setGridSearch: function(grid, field){
        if (!grid) return;
        var fields = [];
        if (!Array.isArray(field)){
            fields.push(field); 
        }
        else{
            fields = field;  
        }
        grid.searches = grid.searches.concat(fields);
    },

    /**
     * Получить поиск грида
     * @method _getGridColumnsSearch
     * @param grid {object} грид
     * @returns {Array} массив полей поиска
     */    
    _getGridColumnsSearch: function(grid){
        if (!grid) return [];
        var colls = this._getColumnsSearch(grid.columns);
        if (colls.length > 0){
            grid.searches = colls;    
        }
        return colls;
    },

    /**
     * Получить поля поиска
     * @method _getColumnsSearch
     * @param columns {Array} колонки грид
     * @returns {Array} массив полей поиска
     */    
    _getColumnsSearch: function(columns){
        if (!Array.isArray(columns)) return [];
        var colType = function(ftype){
            if (typeof ftype !== 'string'){
                return ''
            }
            var anytype = ftype.toLowerCase();
            if (anytype.indexOf('int') !== -1){
                return 'int';
            }
            if (anytype.indexOf('varchar') !== -1){
                return 'text';
            }
            if (anytype.indexOf('float') !== -1){
                return 'number';
            }
            return 'text'; 
        },
        colls = [];
        for (var i = 0, len = columns.length; i < len; i++){
            if (columns[i].link || columns[i].hidden == false){
                colls.push({
                    'field': columns[i].field,
                    'caption': columns[i].caption,
                    'type': colType(columns[i].column_type)})                  
            }
        }
        return colls;
    },

    /**
     * Создать контейнер таблицы слоя карты
     * @method _createLayerGridBox
     * @param xid {string} идентификатор слоя в карте
     * @returns {string} идентификатор таблицы слоя
     */
    _createLayerGridBox: function(xid, dbnames){
        var name = this.namegrid + xid;
        if (this.$content.find('#' + name).length == 0){
            if (Array.isArray(dbnames) && dbnames.length > 0){
                w2ui['layout_' + xid].content('main', '<div id="' + name + '" class="mapdbm-grid" style="width:100%"></div>');
            }
            else this.$content.append('<div id="' + name + '" class="mapdbm-grid"></div>');
        }
        else {
            if (w2ui[name]) w2ui[name].destroy();
        }
        return name;
    },

    /**
     * Создать таблицу слоя карты
     * @method _createLayerGrid
     */    
    _createLayerGrid: function(maplayer, columns, table){
        
        var id = this.gridName(maplayer),        
           url = this._gridUrl(maplayer),
           grid = w2ui[id];
        if (table) {
            url += '&filepath=' + table;
        }    
        if (grid && grid.url !== url){
            grid.searchReset();
            grid.stateReset();
            grid.clear();
            grid.searches = [];
            grid.url = url;
            grid.columns = columns;
            this._stateRestoreLayerGridTable(maplayer.xId, true);
            this._getGridColumnsSearch(grid);
            grid.render();
            w2ui['layout_' + maplayer.xId].unlock('main');
            w2ui['layout_' + maplayer.xId].unlock('right');
        }
        if (!w2ui[id]){
            $('#' + id).w2grid({ 
                name   : id, 
                show: {
                    selectColumn: true,
                    toolbar: true,
                    footer: true,
                    toolbarSearch: true 
                },
                searches: this._getColumnsSearch(columns),  
                multiSelect: true,
                multiSearch: true,
                textSearch: 'contains',
                autoLoad: true,
                limit: 50,
                offset: 0,
                columns: columns,
                records: [],
                url: url,
                maplayer: maplayer,
                ucont: this,
                /*onReload: function(event){
                    event.onComplete = function(){this.ucont.featureSearch = false;}     
                },*/
                onUnselect: function(event){
                    event.onComplete = function(){ 
                        this.ucont.searchObjectsBySelectedRecords(true); 
                    }
                },
                onSearch:function(event){
                    this._searchValue = event.searchValue;
                    if (event.searchData.length == 0){
                        this.ucont.tableSearch = false;
                    }
                },
                onError: function(event){
                    if (event.message){
                        var text = 'GWTK.MapDbm. ' + w2utils.lang(event.message);
                        this.msgAJAXerror = text;  
                    }
                    if (text){
                        console.log(text);
                        GWTK.mapWriteProtocolMessage(this.ucont.map, {'text': text, 'display': false});
                    }
                    event.preventDefault();
                    return false;
                },
                onClick: function(event){
                    this.ucont.tableSearch = true;
                },
                onStateSave: function(event) {
                    var columns = event.state.columns;
                    for (i = 0, len = columns.length; i < len; i++){
                        if (columns[i].hidden == false){
                            if (parseInt(columns[i].size) == 0)
                                columns[i].size = '60px';
                        }
                    }
                    this.ucont._getGridColumnsSearch(this);
                },
                onColumnOnOff: function(event){
                    event.onComplete = function(){
                        this.stateSave();
                    }
                },
                _selectRecords: function(event){
                    if (event.recid){                       // выбрана запись
                        this.ucont.tableSearch = true;
                        event.onComplete = function(){ this.ucont.searchObjectsBySelectedRecords(); }
                        return;
                    }
                    if (!this.ucont.tableSearch){
                        event.onComplete = function(){ this.ucont.searchObjectsBySelectedRecords(); }
                    }
                    else{
                        this.ucont.tableSearch = false;
                    }
                }       
            });
            w2ui[id].on('load', function(event) {
                event.onComplete = function(){
                    if (this.searchData.length > 0){
                       this.selectAll();
                    }
                }
            });
            w2ui[id].onSelect = w2ui[id]._selectRecords.bind(w2ui[id]);
            
            this._stateRestoreLayerGridTable(maplayer.xId, true);
            this._getGridColumnsSearch(w2ui[id]);
        }
        
        if (this.map.options['controlspanel']){
            this.resize();
        }
        else{
            if (maplayer.options.dbnames){
                w2ui['layout_' + maplayer.xId].resize();
            }
        }
    },

    /**
     * Настроить колонки таблицы
     * @method _customizeLayerGridColumns
     * @param columns {Array} массив колонок
     */    
    _customizeLayerGridColumns: function(columns){
        if (!Array.isArray(columns)){ return; }
        // отобразим первые 10 колонок, установим ширину и видимость
        var i, linkpos = -1, len, col_link;
        for (i = 0, len = columns.length; i < len; i++){
            if (columns[i].link != 0){
                columns[i].hidden = false;
                columns[i].hideable  = false;
                columns[i].size = '60px';
                linkpos = i;
                col_link = $.extend({}, columns[i]);
            }
            else{
                columns[i].size = '60px';
                columns[i].hidden = true; 
            }
            columns[i].sortable = true;
        }
        var col = columns[linkpos]; 
        columns.splice(linkpos, 1);
        columns.splice(0, 0, col);

        if (columns.length > 10) {len = 10;}

        for (i = 0; i < len; i++){
            columns[i].hidden = false;
        }
        return col_link;
    },

    /**
     * Получить имя поля связи таблцы слоя
     * @method getLinkFieldName
     * @param maplayer {object} слой карты
     * @returns {object} поля связи, json: {'field': string, 'type': string}
     */      
    getLinkFieldName: function(maplayer){
        
        var grid = w2ui[this.gridName(maplayer)],
            fieldname = '', i, type = '', caption = '';
        if (!grid) return fieldname;
        for ( i = 0; i < grid.columns.length; i++){
            if (grid.columns[i].link == 1){
                fieldname = grid.columns[i].field;
                type = grid.columns[i].column_type;
                caption = grid.columns[i].caption;
                break;
            } 
        }
        var name = {'field': fieldname, 'type': type, 'caption':caption};
        return name;
    },

    /**
     * Получить поля таблцы слоя
     * @method getLayerGridFields
     * @param maplayer {object} слой карты
     */      
    getLayerGridFields: function(maplayer, tablename){
        if (typeof maplayer === 'undefined'  || !maplayer.idLayer){
            return;
        }
        
        GWTK.Util.showWait();

        var maplayer = maplayer,
        table = '', 
        search = 'cmd=getfields&layer_id=' + maplayer.idLayer; 
        var url = this._serverUrl(maplayer);
        if (!url){
            console.log(this.messageLocator + '. ' + w2utils.lang("Not defined a required parameter") + '- Url. Layer ' + maplayer.xId);
            return;
        }
        if (url[url.length -1] == '?') {
            url += search;
        }
        else{
            url += ('?' + search);
        }
        if (maplayer.options.dbnames){
            if (tablename && maplayer.options.dbnames.indexOf(tablename) > -1){
                table = tablename;
            }
            else if (maplayer.options.dbnames[0]){
                table = maplayer.options.dbnames[0];
            }
            if (table.length > 0){
                url += '&filepath=' + table;
            }
        }
        
        GWTK.Util.doPromise([url], 
            function(data){
                var colls = Array.isArray(data) ? data[0] : {}; 
                if (!colls || !colls.status || colls.status !== 'success'){
                    var txt = this.messageLocator + '. ' + w2utils.lang("Failed to get data") + '-' + colls.data_url ? colls.data_url : maplayer.idLayer; 
                    console.log(txt);
                    if (colls.message) { console.log(colls.message);
                        GWTK.mapWriteProtocolMessage(this.map, {'text': this.messageLocator + '. ' + colls.message, 'display': false});
                    }
                    else{
                        GWTK.mapWriteProtocolMessage(this.map, {'text': txt, 'display': false});
                    }
                    GWTK.Util.hideWait();
                    return;
                }
                var columns = colls.columns ? colls.columns : [];
                
                this._renderLayerGrid(maplayer, columns, table);

            }.bind(this), 
        [], this.map);

    },

    /**
     * Обработка записей dbm запроса
     * @method _serverUrl
     * @param maplayer {object} слой карты
     * @param data {object} ответ в виде: {records: [{},...], status: "success/error", total: 5, maxtotal: "97"}
     * @returns {string} строка адреса для dbm запросов
     */    
    _onGetRecords: function(data, maplayer){
        var recs = Array.isArray(data) ? data[0] : {}; 
        if (!recs || !recs.status || recs.status !== 'success' || !maplayer){
            console.log(this.messageLocator + '. ' + w2utils.lang("Failed to get data") + '-' + maplayer.xId);
            return;
        }
        var grid = w2ui[this.gridName(maplayer)];
        if (grid)
            grid.refresh();
    },

    /**
     * Адрес сервера для dbm запросов
     * @method _serverUrl
     * @param maplayer {object} слой карты
     * @returns {string} строка адреса для dbm запросов
     */    
    _serverUrl: function(maplayer){
        if (!maplayer) return;
        var url = GWTK.Util.getServerUrl(maplayer.options.url);
        url = url.replace('service.php', 'mapdb/mapdb.php')
        return url;
    },

    /**
     * Адрес запросов в гриде
     * @method _gridUrl
     * @param maplayer {object} слой карты
     * @returns {string} строка адреса для dbm запросов
     */
    _gridUrl: function(maplayer){
        var url = this._serverUrl(maplayer),
            mess = this.messageLocator + '. ',
            search = 'cmd=getrecords&layer_id=' + maplayer.idLayer;  
        if (!url){
            mess += w2utils.lang("Not defined a required parameter") + ' Url. Id ' + maplayer.xId;
            console.log(mess);
            return;
        }
        if (url[url.length -1] == '?') {
            url += search;
        }
        else{
            url += ('?' + search);
        }
        return url;
    },

    /**
     * Заполнить записи таблицы слоя
     * @method _fillLayerGridRecords
     * @param maplayer {object} слой карты
     * @param records {Array} массив записей
     */    
    _fillLayerGridRecords: function(maplayer, records){
        var grid = w2ui[this.gridName(maplayer)];
        if (!grid || !records || records.length == 0) {
            return;
        }
        grid.add(records);
        grid.refresh();
    },

    /**
     * Обработка ошибки
     * @method onError
     * @param flag {boolean} признак ошибки `true`/`false`
     * @param msg {string} текст сообщения в журнал карты
     */    
    onError: function(flag, msg){
        
        this.error = flag;
        if (typeof msg === 'string'){
            var txt = this.messageLocator + '. ' + msg;
            console.log(txt);
            GWTK.mapWriteProtocolMessage(this.map, {'text': txt, 'display': false});
        }
    },

    /**
     * Обработка изменения размера панели
     * @method resize
     */    
    resize: function(event){
        if (!this.dbmlayers) return;
        if (!this.isActive()) return;
        var W = this.$body.width();
        if (W == 0) return;
        this.$content.height(this.$body.height() - 31)
        this.$content.width(W)
        for (var i = 0, len = this.dbmlayers.length; i < len; i++){
            var grid = this.gridName(this.dbmlayers[i]),
                layout = this.layoutName(this.dbmlayers[i]);
            if (w2ui[layout]){     
                w2ui[layout].box.style.width = W + 'px'; 
                w2ui[layout].resize();
            }
            if (w2ui[grid]){
                w2ui[grid].resize();
            }
        }
    },

    /**
     * Получить имя грида слоя
     * @method gridName
     * @param maplayer {object} слой карты
     * @returns {string} имя грида слоя. При ошибке возвращает пустую строку.
     */    
    gridName: function(maplayer){
        if (maplayer){
            return (this.namegrid + maplayer.xId);
        }
        return '';
    },

    /**
     * Получить имя грида по идентификатору слоя
     * @method gridNameById
     * @param xid {string} id слоя в карте
     * @returns {string} имя грида слоя. При ошибке возвращает пустую строку.
     */    
    gridNameById: function(xid){
        if (!xid) return '';
        return (this.namegrid + xid);
    },

    /**
     * Получить имя вкладки слоя
     * @method tabName
     * @param maplayer {object} слой карты
     * @returns {string} имя вкладки слоя. При ошибке возвращает пустую строку.
     */    
    tabName: function(maplayer){
        if (maplayer){
            return ('tab_' + maplayer.xId);
        }
        return '';
    },

    /**
     * Получить имя виджета layout слоя
     * @method layoutName
     * @param maplayer {object} слой карты
     * @returns {string} имя виджета layout. При ошибке возвращает пустую строку.
     */    
    layoutName: function(maplayer){
        if (maplayer){
            return ('layout_' + maplayer.xId);
        }
        return '';
    },

    /**
     * Получить имя таблицы БД, которую отображает grid 
     * @method _getGridTableName
     * @returns {string} имя таблицы БД или пустая строка при ошибке
     */
    _getGridTableName: function(gridname, all){
        var grid = w2ui[gridname];
        if (!grid) return '';
        var arr = grid.url.split('&filepath='), name = '';
        if (arr.length > 1){
            var pos = arr[1].lastIndexOf('/');
            var end = arr[1].lastIndexOf('.');
            if (end == -1){ end = arr[1].length; }
            if (!all){
                name = arr[1].slice(pos + 1, end);
            }
            else{
                name = arr[1].slice(pos + 1);
            }
        }
        return name;
    },

    /**
     * Поиск объектов карты по выделенным записям в таблице
     * @method searchObjectsBySelectedRecords
     * @param tableName (string) Имя таблицы
     */
    searchObjectsBySelectedRecords: function () {

        var active = w2ui[this.nametabs].active, 
            maplayer;
        var xid = active.slice(4), 
            i, len = this.dbmlayers.length;
            xid = xid.trim();
        for (i = 0; i < len; i++){
            if (this.dbmlayers[i].xId == xid){
                maplayer = this.dbmlayers[i];
                break;
            }
        }
        
        if (!maplayer){
            return;
        }
        if (!maplayer.getVisibility()){
            maplayer.show();
        }
        var idtab = this.tabName(maplayer),                      // вкладка
            field = this.getLinkFieldName(maplayer),             // поле связи
            gridname = this.gridName(maplayer),                  // грид слоя
            sheetname = maplayer.mapSheets.sheets,
            selindexes = w2ui[gridname].getSelection(true),
            ids = [],
            tablename = this._getGridTableName(gridname);
        
        if (!selindexes || selindexes.length == 0){
            this.map.handlers.clearselect_button_click();
            return;
        }
        for (i = 0, len = selindexes.length; i < len; i++){
            var objid = w2ui[gridname].records[selindexes[i]][field.field];
            if (typeof objid !== 'undefined'){
                ids.push(tablename + '.' + objid);      // sheetname[0]
            }
        }
        if (ids.length > 0){

            GWTK.Util.clearselectedFeatures(this.map);
            // Поиск объектов на карте
            //GWTK.mapSearchObjectsByIdList(this.map, maplayer.idLayer, ids.join(','), true);
            const result = mapSearchObjectsByIdList( this.map, maplayer.idLayer, ids.join(','), true );
            if (result.filePath && result.filePath.length > 0) {
                w2confirm( w2utils.lang('Too many objects in response. Continue?'), function btn(answer) {
                    if ( answer == 'No') {
                        console.log( 'MapDbmControl. ' + w2utils.lang('Unable to create the list. Too many objects.') ); 
                    } else {
                        const url = mapLayer.options.url;
                        const uri = Utils.parseUrl( url );   
                        const server = uri.origin + '/' + uri.pathname;
                        mapGetObjectsByFileData( this.map, server, result.filePath );
                    }
                }.bind( this ) );
            }
        }

    },

    /**
     * Обработка выделения объектов в карте
     * @method onFeatureInfoRefreshed
     * @param event (object) объект события
     */
    onFeatureInfoRefreshed: function(event){
        if (!this.isActive()){
            return;
        }
        
        if (this.tableSearch){
            this.tableSearch = false;
            return;
        } 
        this.tableSearch = true;
        this.searchRecordsBySelectedObjects();
    },

    /**
     * Поиск записей таблицы по выделенным оъектам карты
     * @method search_ForSelectedObjectsInLayers
     * @param tableName (string) Имя таблицы
     */
    searchRecordsBySelectedObjects:function(){

        var searches = [];

        var selection = this._getObjectSelectionSummary();
        var objselect = selection.objects,                          // отобраные объекты
            layersselect = selection.layers,                        // отобраные слои
            maplayer;

        if (this.dbmlayers.length == 0 || objselect.length == 0){
            this.tableSearch = false;    // !!!
            return;
        }
        for (var i = 0; i < this.dbmlayers.length; i++){
            if ($.inArray(this.dbmlayers[i].idLayer, layersselect) > -1){
                maplayer = this.dbmlayers[i];
                break;
            }
        }
        if (!maplayer){
            return;
        }
        
        var idtab = this.tabName(maplayer),                      // вкладка
            field = this.getLinkFieldName(maplayer),             // поле связи
            gridname = this.gridName(maplayer),                  // грид слоя
            tablename = this._getGridTableName(gridname),        // текущая таблица
            sheetname = [];                                      // листы карты слоя   
        
        if (tablename) {
            if (maplayer.mapSheets.sheets && maplayer.mapSheets.sheets.indexOf(tablename) > -1)
                sheetname = [tablename];
        } else {
            sheetname = maplayer.mapSheets.sheets;
        }
        
        if (!w2ui[gridname]){
            return;
        }
        w2ui[this.nametabs].active = idtab;

        for ( i = 0; i < objselect.length; i++){
            if ( sheetname.includes(objselect[i].sheetName) ) {
                searches.push({'field': field.field, 'value': objselect[i].objectNumber, 'operator':'is'})
            }
        }
        
        if (searches.length > 0){
            w2ui[gridname].search(searches, 'OR');
        } else {
            if (this.tableSearch){ w2ui[gridname].clear(); }  // !!!
            w2ui[gridname].searchReset(true);
        }
    },

    /**
     * Получить данные по выделенным оъектам карты
     * @method _getObjectSelectionSummary
     * @return {json}, {layers: string[], objects: MapObject[]} 
    */
    _getObjectSelectionSummary: function( ) {
        var result = { layers: [], objects: [] };
        const selectedObjects = this.map.getSelectedObjects();
        const activeObject = this.map.getActiveObject();
        let mapObjects;
        if ( activeObject ) {
            mapObjects = [ activeObject ];
        } 
        if ( selectedObjects.length > 0 ) {
            mapObjects = selectedObjects;
        }
        if ( mapObjects ) {
            for (var i = 0; i < mapObjects.length; i++) {
                result.objects.push( mapObjects[i] );
                if (result.layers.indexOf(mapObjects[i].mapId ) == -1) {
                    result.layers.push( mapObjects[i].mapId );
                }
            }
        }
        return result;
    },

    onFeatureListClick: function(event){
        if (!event || event.act !== 'selfeature') { 
            return;
        }
        var 
        maplayer = this.getDbmLayerByxId(event.layer),
        gridname = this.gridNameById(event.layer),
        tablename = this._getGridTableName(gridname);
        if (!w2ui[gridname] 
            || !tablename || event.gid.indexOf(tablename) == -1){
            return;
        }
        var linkname = this.getLinkFieldName(maplayer), linkfield = '',
        search = {},
        gmlid = GWTK.Util.parseGmlId(event.gid);
        if (linkname && gmlid.objid) {
            linkfield = linkname['field'];
            search[linkfield] = gmlid.objid; 
            var recs = w2ui[gridname].find(search);
            if (recs[0] !== undefined){
                w2ui[gridname].select(recs[0]);
            }
          
        }
        console.log(event.layer, event.gid, event.act);
    }, 

    /**
     * Создать виджет Layout
     * @method _createTabLayout
     * @param maplayer (Object) cлой карты
     * Layout создается для работы с mpt-таблицами
    */
   _createTabLayout: function(maplayer){
        var xid = maplayer ? maplayer.xId : '';
        if (xid.length == 0) { return false; }
        var tablename = maplayer.options.dbnames || [];
        var config = this._getTabConfig(xid, tablename);
        var name = this._createLayerLayoutBox(xid);
        $('#' + name).w2layout(config.layout);
        if (config.sidebar){
            w2ui['layout_' + xid].content('right', $().w2sidebar(config.sidebar));
        }
        return true;
    },

    /**
     * Создать контейнер виджета Layout
     * @method _createLayerLayoutBox
     * @param xid (string) идентификатор слоя карты
     * @returns {string} имя контейнера
    */    
    _createLayerLayoutBox: function(xid){
        var name = 'layout_box_' + xid;
        if (this.$content.find('#' + name).length == 0){
            this.$content.append('<div id="' + name + '" class="mapdbm-grid" style="width:695px; height:100%;"></div>');
        }
        else {
            if (w2ui[name]) w2ui[name].destroy();
        }

        return name;
    },

    /**
     * Получить конфигурацию вкладки с виджетом Layout
     * @method _getTabConfig
     * @param id (string) идентификатор слоя карты
     * @param dbnames {Array} список таблиц слоя (mpt-проект таблиц)
     * @returns {JSON object} конфигурация вкладки: {'layout': {}, 'sidebar': {}}
    */    
    _getTabConfig: function(id, dbnames){
        var allnames = [], i;
        for (i = 0; i < dbnames.length; i++){
            var text = dbnames[i];
            var arr = text.split('/');
            if (arr.length > 1){
                text = arr[arr.length - 1];
            }                                              
            allnames.push({'id': 'item_' + text, 'text': w2utils.lang(text), img: 'icon-page', tablename: dbnames[i]});  
        }
        var sidebar = this._getSideBarConfig(id, allnames);
        var config = {
            layout: {
                name: 'layout_' + id,
                padding: 0,
                panels: [
                    { type: 'main', overflow: 'hidden', resizable: true, size:400,
                        style: 'background-color: white; border: 1px solid silver; border-top: 0px; padding:0px;'
                    }
                ]
            },
            sidebar: sidebar
        };
        
        if (sidebar){
            config.layout.panels.push({ type: 'right', size: 200, resizable: true, minSize: 10, style:"height:100%" });
        }
        return config;
    },

    /**
     * Получить конфигурацию виджета sidebar для Layout
     * @method _getSideBarConfig
     * @param id (string) идентификатор слоя карты
     * @param nodes {Array} список таблиц слоя как узлов
     * @returns {JSON object} конфигурация sidebar
    */    
   _getSideBarConfig: function(id, nodes){
        if (!Array.isArray(nodes) || nodes.length == 0) return undefined;
        var sidebar = {
            name: 'sidebar_' + id,
            nodes: [ 
                { 'id': 'root', 'text': 'Таблицы', 'group': true, 'expanded': true, 'nodes': nodes}
            ],
            _xid: id,
            onClick: function (event) {
                var item = this.get(event.target);
                if (item.selected){
                    event.preventDefault();
                    return false;
                }
                event.onComplete = function(){
                    this.nodes[0].text = this.get(event.target).text;
                    this.refresh();
                    
                    var grid = w2ui['grid_mapdbm_' + this._xid];
                    if (grid.url.indexOf(item.tablename) == -1){
                        grid.ucont._changeLayerGridTable(this._xid, item.tablename);   // сменить текущую таблицу
                    }
                }
            }
        };
        sidebar.nodes[0].nodes[0].selected = true;
        sidebar.nodes[0].text = sidebar.nodes[0].nodes[0].text;
        return sidebar;
    },

    /**
     * Изменить текущую таблицу слоя (для Layout)
     * @method _changeLayerGridTable
     * @param xid (string) идентификатор слоя карты
     * @param tablename {String} имя новой таблицы
    */    
    _changeLayerGridTable: function(xid, tablename){
        
        this._stateSaveLayerGridTable(xid);

        w2ui['layout_' + xid].lock('main', '', true);
        w2ui['layout_' + xid].lock('right');

        this.getLayerGridFields(this.getDbmLayerByxId(xid), tablename);  
    },
    
    /**
     * Сохранить состояние w2grid текущей таблицы слоя
     * @method _stateSaveLayerGridTable
     * @param xid {string} идентификатор слоя карты
     * @returns {string} ключ localStorage или `null` при ошибке
    */    
    _stateSaveLayerGridTable: function(xid){
        
        var grid = w2ui['grid_mapdbm_' + xid];
        if (!localStorage || !grid) return null;
        var key = this._getLocalStorageItemKey(xid, this._getGridTableName('grid_mapdbm_' + xid, true)),
            tmp;
        try {
            if (localStorage.gwtk){
                tmp = JSON.parse(localStorage.gwtk);
                if (!tmp['states']) tmp['states'] = {};     
            }
            else
               tmp = {'states': {}}; 
            if (tmp.states && tmp.states[key]) {
                delete tmp.states[key];
            }
            localStorage.gwtk = JSON.stringify(tmp);

            var gridState = grid.stateSave(true);
            if (gridState !== null && tmp){
                tmp.states[key] = gridState;
                localStorage.gwtk = JSON.stringify(tmp);
            }
            return key;        
        } catch (e) {
        }       
        return null;
    },

    /**
     * Восстановить состояние w2grid таблицы слоя
     * @method _stateRestoreLayerGridTable
     * @param xid (string) идентификатор слоя карты
     * @param restore {boolean} `true` - состояние w2grid восстановить
     * @returns {string} ключ localStorage или `null` при ошибке 
    */    
   _stateRestoreLayerGridTable: function(xid, restore){

        var gridname = 'grid_mapdbm_' + xid, 
            grid = w2ui[gridname];
        if (!localStorage || !grid) return null;
        var key = this._getLocalStorageItemKey(xid, this._getGridTableName(gridname, true)),
            newstate = null;
        try {
            var tmp = JSON.parse(localStorage.gwtk || '{}');
            if (!tmp.states || !tmp.states[key]) {
                return null;
            }
            newstate = tmp.states[key];
            newstate.show.selectColumn = true;
        } catch (e) {
            return null;
        }
        if (newstate !== null && restore === true){
            grid.stateRestore(newstate);
        }
        return key;
    },

    /**
     * Получить ключ состояния w2grid слоя для localStorage
     * @method _getLocalStorageItemKey
     * @param xid {string} идентификатор слоя карты
     * @param tablename {String} имя таблицы
     * @returns {string} ключ
    */    
    _getLocalStorageItemKey: function(xid, tablename){
        return (hex_md5(xid + tablename));
    }

}
