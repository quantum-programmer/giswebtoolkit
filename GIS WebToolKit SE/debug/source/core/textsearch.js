/*************************************** Нефедьева О. 13/01/21 *****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2022              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                 Класс поиска в карте по характеристике           *
*                                                                  *
*******************************************************************/

/**
  * Класс поиска в карте
  * @class GWTK.mapTextSearch
  * @constructor GWTK.mapTextSearch
  * @param map {Object} ссылка на класс карты, обязательный
  * @param fn {function} обработчик ответа поиска, допустимый
*/
GWTK.MapTextSearch = function (map) {
 
    this.map = map;
    if (!map) {
        console.log("MapTextSearch. " + w2utils.lang("Not defined a required parameter") + " Map.");
        return;
    }
    this.wfs = null;

    this.startIndex = 0;

    this._text = '';

    this.initialize();
};

GWTK.MapTextSearch.prototype = {
    /**
     * Инициализация класса
     * @method initialize
     */
    // ===============================================================
    initialize: function () {
        if (!this.map) return;
        
        this.createWfs();

        this.canCancel = true;

        this.maxCount_default = 100;

        return this;
    },

    /**
     * Создать класс выполнения поиска на сервере
     * @method createWfs
     */
    // ===============================================================
    createWfs: function () {
        if (!this.map) return false;

        if (this.wfs == null) {
            this.wfs = new GWTK.WfsRestRequests(this.map);
            this._onDataLoaded = GWTK.Util.bind(this._onDataLoaded, this);
        }
        return true;
    },

    /**
     * Поиск объектов карты
     * @method search
     * @param text {String} текст поиска
     * @param query {Object} контекст поиска
     * @param callback {Function} функция анализа ответа
     */
    // ===============================================================
    search: function (text, query, callback){
        if (!text || !query) return;

        this._callback = null;
        if ($.isFunction(callback)) {
            this._callback = callback;
        }

        this.result = null;
        this.startIndex = query.startIndex || 1;
        this.maxCount = query.maxCount;
        if (this.maxCount < 0) {
            this.maxCount = this.maxCount_default;
        }

        this.search_query = $.extend(true, {}, query);

        this.postRequest(text);

    },

    /**
     * Отправить запрос операции поиска "textsearch"
     * @method postRequest
     * @param filter {String} текст поиска
     */
    // ===============================================================
    postRequest: function (filter) {
        if (!this.map || !filter) {
            console.log("GWTK.MapTextSearch.postRequest " + w2utils.lang("Runtime error"));
            return 0;
        }

        // параметры поиска для каждого слоя карты, где поиск выполняется 
        // формируем параметр "TEXTFILTER" ((k1,k2,k3)(=,=,=)(val=filter,val=filter,val=filter)), (()()()), ...- позиционно для списка слоев "LAYER"   
        var prm = this.map.tiles.getTextSearchOptions();
        if (prm.list.length == 0) {
            GWTK.Util.error_report('', this.map);
            w2alert(w2utils.lang("Nothing found. Refine your search."), w2utils.lang('Search'));
            return 0;
        }

        this._text = filter;              // что ищем
        var cond = '(OR)', keysValueOf = '',
        ssValueOf = '', textValueOf = '',
        valtext = 'val=' + GWTK.fixedEncodeURI('*' + filter + '*'),                           
        rpclayerslist = [], rpclayer = {}, i, jj, ss;
                
        for (i = 0; i < prm.list.length; i++) {
            rpclayer = {};                // { "layerid": id, "textfilter": filter, "typenames": types, "codelist": codelist }
            var layparam = prm.list[i];   // { "layer": "", "keys": [] };

            ss = [], condOf = '';
            var arrVal = [];
            for (jj = 0; jj < layparam.keys.length; jj++) {
                ss[jj] = '=';
                arrVal.push(valtext);
            }
            if (layparam.keys.length > 1)
                condOf = cond;
            keysValueOf = '(' + layparam.keys.toString() + ')';
            ssValueOf = '(' + ss.toString() + ')';
            textValueOf = '(' + arrVal.join('') + ')';

            rpclayer.layerid = layparam.layer;
            rpclayer.textfilter = '(' + keysValueOf + ssValueOf + textValueOf + condOf + ')';
            if (layparam.typenames)
                rpclayer.typenames = layparam.typenames;
            if (layparam.codeList)
                rpclayer.codelist = layparam.codelist;
              
            if (this.search_query.visibleflag){                
                if (layparam.keylist) { 
                    rpclayer.keylist = layparam.keylist; 
                }
                var scale = this.map.getZoomScale(this.map.getZoom());
                if (scale) {
                    rpclayer.objectviewscale = scale.toFixed(0); 
                }
            }              

            rpclayerslist.push(rpclayer);                               // параметры слоев  
        }
        var url = "?objcenter=2&objlocal=0,1,2,4&mapid=1&area=1&semantic=1&semanticname=1&getframe=1&start_index=" + this.startIndex;

        if (this.maxCount)
            url += "&feature_count=" + this.maxCount;
        
        this.wfs.restMethodRpc("textsearch", url, rpclayerslist, GWTK.Util.bind(this._onDataLoaded, this), {"sem_text":this._text});
    },

    /**
     * Получить фильтр семантик слоя для xmlrpc
     * @method getLayerSemanticFilter
     * @param data {JSON} параметры фильтра семантики, GWTK.LayerSemanticFilter
     * ( описание в mapapitypes.js)
     * @return {JSON} {"layerid":"", textfilter = "((сематика[,сематика])(операция[,операция])(val=значение[,val=значение])[(логический операнд)])"};
     */
    // ===============================================================
    getLayerSemanticFilter: function (data) {     
        
        if (typeof data == "undefined" || $.isEmptyObject(data) ||
            !$.isArray(data.keys) || !data.keys.length ||
            !$.isArray(data.values) || !$.isArray(data.operations)) {
            return undefined;
        }

        var keys = [],
            keys = data.keys,
            semvalues = data.values,
            operations = data.operations,
            logic = data.logic;

        if (!semvalues.length) semvalues.push("*");
       
        if (typeof logic !== "string") {
            logic = "OR";
        }
        var _logic = logic.toLowerCase();
        if (_logic !== 'or' && _logic !== 'and') {
            logic = "OR";
        }

        var i, len = keys.length,
            logicOf = "",   
            rpclayer = { "layerid": data.layerid };           

        if (keys.length > 1 || semvalues.length > 1)
            logicOf = '(' + logic + ')';

        if (keys.length !== semvalues.length) {                           
            if (keys.length == 1 && semvalues.length > 1) {              // одна семантика, много значений
                len = semvalues.length - 1;
                for (i = 0; i < len; i++) {
                    keys.push(data.keys[0]);                             // размножаем ключ
                }
            }
            else {
                len = keys.length;                    
                for (i = 0; i < len; i++) {
                    if (typeof semvalues[i] == "undefined") {
                        semvalues.push('*');                              // добавим любое значение семантики
                    }
                }
            }
        }

        len = keys.length;

        for (i = 0; i < len; i++) {
            if (typeof operations[i] == "undefined") {
                operations.push('=');
            }
        }

        len = semvalues.length;
        for (i = 0; i < len; i++) {
            semvalues[i] = 'val=' + semvalues[i];
        }
        
        if (data.typeNames)
            rpclayer.typenames = data.typeNames;
        if (data.codeList)
            rpclayer.codelist = data.codeList;
        
        var keysOf = '(' + data.keys.toString() + ')',
        operOf = '(' + operations.join(',') + ')',
        valuesOf = '(' + semvalues.join('') + ')';

        rpclayer.textfilter = '(' + keysOf + operOf + valuesOf + logicOf + ')';

        return rpclayer;
    },

    /**
     * Обработчик ответа сервера
     * @method _onDataLoaded
     * @param results {Object} ответ
     * @param context {Object} контекст запроса
     */
    // ===============================================================
    _onDataLoaded: function (results, context) {
        
        this.canCancel = true;
        
        this.result = results;

        this.search_query.startIndex = this.startIndex;

        this.search_query.maxCount = this.maxCount;

        if ($.isArray(results) && results.length == 1) {
            if (context && context == 'exception') {
                this.search_query.status = 'error';
                this.search_query.errormessage = w2utils.lang("Failed to get data");
                if (this._callback)
                    return this._callback(results, this.search_query);
                return results;
            }
            else {
                this.search_query.status = 'done';
                this.search_query.errormessage = '';
            }
        }
        else {
            this.search_query.status = 'done';
            this.search_query.errormessage = '';
        }

        if (this.search_query.status == 'done' && this.search_query.startIndex <= 1) {
            if (this.map.selectedObjects.mapobjects.length > 0 && this.map.selectedObjects.mapobjects[0].objectcenter) {
                this.map.setViewport(this.map.selectedObjects.mapobjects[0].objectcenter);
            }
         }
        
        if (!this._callback) { return results; }
 
        var report = this.createResponseReport(results);

        return this._callback([report], this.search_query);

    },

    /**
     * Создать отчет выполнения операции
     * @method _onDataLoaded
     * @param response {Array} ответ операции
     * @return {XmlDocument} отчет 
     */
    // ===============================================================
    createResponseReport: function (response) {
        
        if (!$.isArray(response)) return null;

        var xmldoc = $.parseXML('<?xml version=\"1.0\" encoding=\"utf-8\"?><SearchReport></SearchReport>'),
            len = response.length, i;
        var $root = $(xmldoc.documentElement), totalCount = 0, found = 0, totalreturned = 0;

        for (i = 0; i < len; i++) {
            var node = response[i].documentElement.nodeName.toLowerCase();
            if (node.indexOf("featurecollection") == -1) { continue; }

            var members = $(response[i].documentElement).find('wfs\\:member');
            if (!members.length) {
                members = $(response[i].documentElement).find('member');
            }

            var matched = $(response[i].documentElement).attr('numberMatched');
            var returned = $(response[i].documentElement).attr('numberReturned');
            if (matched != undefined && returned != undefined) {
                if (parseInt(matched) == 0 && parseInt(returned) == 0) {         // костыль для сервиса!
                    //var members = $(response[i].documentElement).find('wfs\\:member');
                    //if (!members.length) {
                    //    members = $(response[i].documentElement).find('member');
                    //}
                    matched = members.length;
                    returned = members.length;
                }
                $root.append('<found>' + matched + '</found>');
                $root.append('<returned>' + returned + '</returned>');
                totalCount = Math.max(totalCount, parseInt(matched));
                totalreturned += parseInt(returned);
                found += parseInt(matched);
            }
            else {
                $root.append('<found>' + members.length + '</found>');
                $root.append('<returned>' + members.length + '</returned>');
                totalCount = Math.max(totalCount, members.length);
                totalreturned += members.length;
                found += members.length;
            }
        }

        this.search_query.totalCount = totalCount;                       // всего найдено

        this.search_query.numberReturned = totalreturned;                // всего возвращено

        $root.append('<totalCount>' + totalCount.toString() + '</totalCount>');

        if (this.map && totalreturned) {
            //this.map.drawSelectedFeatures((this.search_query.startIndex <= 1));
            this.map.selectedObjects.drawSelectedObjects((this.search_query.startIndex <= 1));
        }
  
        return xmldoc;
    }

    /**
      * Найти все объекты
      * @method textSearchFull
     */
    // ===============================================================
    //textSearchFull: function (event) {
    //    var target = event.target || event.srcElement,
    //             $target = $(target);
    //    if ($target.hasClass('panel-textsearch-full') == false) { return; }
    //    if (!this._text || this._text.length == 0) { return; }
    //    this.startIndex = 0;
    //    this.maxCount = 0;
    //    this.setTextSearchPagination(0);
    //    this.postTextSearch(this._text, 0);
    //    this.maxCount = this.defCount;
    //    return;
    //}
 
}