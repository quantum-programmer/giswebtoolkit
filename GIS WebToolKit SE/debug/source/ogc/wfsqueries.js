/********************************* Нефедьева О.А. **** 14/07/20 ****
/********************************* Соколова Т.О.  **** 24/11/17 ****
/********************************* Нефедьева О.А. **** 20/08/18 ****
********************************** Гиман Н.Л      **** 21/11/17 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                       Выполнение WFS-запросов                    *
*                            GWTK SE                               *
*******************************************************************/

// ===============================================================
//  WfsQueries object, OGC Web Feature Service interface
// ===============================================================

WfsQueries=function WfsQueries(srv, map) {

    this.qoptions = { 'SERVICE': 'WFS', 'REQUEST': '', 'OUTPUTFORMAT': 'GML/XML' };

    this.xmlDoc = new xmlDocument();
    this.mapsrv = '';
    this.enabled = false;
    this.qtimeout = 180000;                    // 3 min
    var xdr;
    this.hhr = null;
    this.context = null;
    this.map = map;

    this.init = function (uri) {
        if (typeof (uri) == 'undefined') {
            this.enabled = false;
            return;
        }
        this.mapsrv = uri;
        this.enabled = true;
    }

    this.init(srv);

    // Event handler of successful response 
    this.onDataLoad = null;

    // Выполнить запрос
    // options - JSON объект параметров запроса
    this.sendRequest = function (options, async) {

        if (!options || $.isEmptyObject(options) || !this.mapsrv) return;

        var response = 'text/xml',
            _async = true,
            _token = false, xhrfields = wc = undefined,
            dataType;
        if (options.OUTTYPE) {
            dataType = 'json';
        }
        if (typeof async === "boolean")
            _async = async;

        if (typeof this.map !== "undefined" && $.isFunction(this.map.getToken)) {
            _token = this.map.getToken();
        }
              
        var sUrl = this.mapsrv + "?" + GWTK.Util.urlParamString(options);

        wc = this.map.authTypeServer(this.mapsrv) || this.map.authTypeExternal(this.mapsrv);
        wc ? xhrfields = {withCredentials: true} : xhrfields = undefined;

        sUrl += '&dt=' + new Date().getMilliseconds().toString();

        $.support.cors = true;

        if (window.XDomainRequest) {
            xdr = new XDomainRequest();
            xdr.timeout = this.qtimeout;
            xdr.ontimeout = this.onTimeout;
            xdr.onload = this.onSuccess;
            xdr.onerror = this.onError;
            xdr.ondataload = this.onDataLoad;
            xdr.sender = this;
            xdr.open("get", sUrl);
            xdr.send();
        }
        else {
            this.hhr = $.ajax({
                crossDomain: true,
                type: 'get',
                url: this.mapsrv,
                data: options,
                xhrFields: xhrfields,                                                                     //параметры запроса
                response: response,                                                                //тип возвращаемого ответа text либо xml, либо json
                dataType: dataType,
                async: _async,
                beforeSend: _token ? function(xhr){xhr.setRequestHeader(GWTK.AUTH_TOKEN, _token)} : undefined,
                context: this,
                error: this.onError,
                success: this.onSuccess,
                timeout: this.qtimeout
            });
        }

    }

    // Обработчик успешного запроса
    this.onSuccess = function (response) {        
        if (response != null) {
            this.xmlDoc = this.hhr.responseText;
            this.onDataLoad(this.xmlDoc, this.context);
            this.context = null;
        }
        else { // для IE
            if (this.contentType == 'text/xml' && this.sender != null)
                this.sender.xmlDoc = this.responseText;
            if (this.ondataload != null)
                this.ondataload(this.responseText, this.sender.context);
        }
    }

    // Обработчик ошибки запроса
    this.onError = function (object, textStatus, errorThrown) {
        if (this.hhr != null) {
            var err = textStatus;
            if ((textStatus != errorThrown) && (errorThrown.length > 0))
                err += ". " + errorThrown + ".";
            this.xmlDoc = setExceptionResponse(err);
            this.onDataLoad(this.xmlDoc, this.context);
            this.context = null;
        }
        else { // для IE
            if (this.sender) {
                this.sender.xmlDoc = setExceptionResponse("Request error");
                if (this.sender.onDataLoad)
                    this.sender.onDataLoad(this.sender.xmlDoc, this.sender.context);
                this.sender.context = null;
            }
        }
    }

    // Обработчик превышения времени запроса (только для IE)
    this.onTimeout = function () {

        var message = '<?xml version="1.0" encoding="utf-8"?><ExceptionReport version="1.0.0" ' +
                'xmlns="http://www.opengis.net/ows/2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
                'xsi:schemaLocation="http://www.opengis.net/ows/2.0  owsExceptionReport.xsd" >' +
                '<Exception><ExceptionText>' + "timeout " + '</ExceptionText></Exception></ExceptionReport>';

        if (typeof (this.ondataload) != "undefined") {
            xdr.ondataload(message);
        }
        return message;
    }

    // Выполнить запрос DescribeFeatureType
    this.featuretype = function (typenames) {
        var opt = { 'SERVICE': 'WFS', 'REQUEST': 'DescribeFeatureType', 'TYPENAMES': '' };

        if (typeof (typenames) != "undefined")
            opt.TYPENAMES = typenames;

        var resp = this.sendRequest(opt);

        return resp;
    }

    // Выполнить запрос ListStoredQueries
    this.liststoredqueries = function () {
        var opt = { 'SERVICE': 'WFS', 'REQUEST': 'ListStoredQueries' };

        var resp = this.sendRequest(opt);

        return resp;
    }

    // Выполнить запрос GetFeature
    this.feature = function (queryfeature, context) {

        var options;

        if (typeof (queryfeature) != "object")
            try {
                options = $.parseJSON(queryfeature);
            }
            catch (e) { alert(e.message); }
        else
            options = queryfeature;

        if (options == null) return 0;

        this.context = context;

        for (var key in options) {
            if (key.toLowerCase() == "result") {
                options.RESULTTYPE = options[key]; options[key] = null;
                if (options.RESULTTYPE == 0) options.RESULTTYPE = "hits";
                else options.RESULTTYPE = "results";
            }
        }

        options.SERVICE = 'WFS';
        options.restmethod = 'GetFeature';
        options.MapID = 1;
        options.AREA = 1;
 
        this.sendRequest(options);

        return 1;
    }

    // Выполнить запрос GetFeature через xmlrpc
    this.featureex = function (param, context) {
        if (!param || !param.layers) {
            console.log("ERROR:   WfsQueries.featureex input parameters error.");
            return;
        }
        param.MAPID = 1;
        var url = "";
        for (var key in param) {
            if (key.toLowerCase() == "layers") continue;
            url += "&" + key + "=" + param[key];
        }
        url = '?' + url.slice(1);

        var xtext = GWTK.Util.url2xmlRpcEx(url, "GetFeature", param.layers);

        //console.log(xtext);
        this.context = context;

        var options = { 'SERVICE': 'WFS', 'RESTMETHOD': 'GetFeature' };
        if (param.OUTTYPE)
            options.OUTTYPE = param.OUTTYPE;

        this.postRequest(options, xtext);

        return;
    }

    // Выполнить хранимый запрос GetFeatureById
    this.featurebyid = function (id, layerid, responcetype, objectcenter, area, length, getframe, sld) {
        if (typeof (id) == "undefined") return "";

        var opt = { 'SERVICE': 'WFS', 'REQUEST': 'GetFeature', 'STOREDQUERY_ID': 'urn:ogc:def:query:OGC-WFS::GetFeatureById', 'semanticname':1};
        opt.ID = id;
        if (layerid)
            opt.LAYER_ID = layerid;
        if (responcetype)
            opt.OUTTYPE = responcetype;
        if (objectcenter)
            opt.OBJCENTER = objectcenter;
        else opt.OBJCENTER = 2;
        if (area)
            opt.area = area;
        if (length)
            opt.length = length;
        if (getframe)
            opt.getframe = getframe;
        if (sld)
            opt.Getsld = sld;
        opt.MapId = 1;
        this.sendRequest(opt);
        return;
    }

    // Выполнить запрос списка объектов GetFeature 
    this.featureListByid = function (param, context) {
        if (!param) return;
        this.context = context;
        var options = { 'SERVICE': 'WFS', 'RESTMETHOD': 'GetFeature', "MAPID": 1, "OUTTYPE": "json" };
        for (var key in param) {
            if (key.toLowerCase() == "layers") continue;
            options[key] = param[key];
        }
        this.postRequest(options, '');
    }

    // Выполнить преобразование координат точки из плоских прямоугольных координат в метрах в геодезические в градусах по заданному коду EPSG
    this.geopoint = function (layer, plane, crs, context) {
        // METHOD=GetPointGeo&SERVICE=WFS&LAYER=0001&CRS=EPSG:3857&POINT1=7506495.190182736,4267526.8783815048
        var param = { "METHOD": "GetPointGeo", "SERVICE": "WFS", "Layer": "", "POINT1":"", "CRS":"" };
        param.Layer = layer;
        param.POINT1 = plane;
        param.CRS = crs;
        this.context = context;

        this.sendRequest(param);
    }

    // Выполнить преобразование координат точки из геодезических координат в градусах в плоские прямоугольные в метрах в  по заданному коду EPSG
    this.planepoint = function (layer, geo, crs, context) {
        // METHOD=GetPointGeo&SERVICE=WFS&LAYER=0001&CRS=EPSG:3857&POINT1=7506495.190182736,4267526.8783815048
        var param = { "METHOD": "GetPointPlane", "SERVICE": "WFS", "Layer": "", "POINT1": "", "CRS": "" };
        param.Layer = layer;
        param.POINT1 = geo;
        param.CRS = crs;
        this.context = context;

        this.sendRequest(param);
    }

    // Выполнить запрос Transaction
    this.transaction = function (xmlaction, layer) {

        var url = this.mapsrv + "?SERVICE=WFS&REQUEST=Transaction",
            xhrfields = undefined,
            wc = this.map.authTypeServer(this.mapsrv) || this.map.authTypeExternal(this.mapsrv),
        _token = GWTK.Util.accessToken(this.map, layer);
        if (wc) xhrfields = {withCredentials: true};

        if (layer != undefined && layer != null)
            url += "&LAYER_ID=" + layer;
        
        $.support.cors = true;
        this.hhr = $.ajax({    
            type: "POST",
            crossDomain: true,
            context: this,
            xhrFields: xhrfields,
            url: url,
            beforeSend: _token ? function (xhr) { xhr.setRequestHeader(GWTK.AUTH_TOKEN, _token) } : undefined,
            data: xmlaction,
            response: 'text/xml',
            dataType: 'xml',
            processData: false,
            success: this.onSuccess,
            error: this.onError
        });    }

    // Выполнить запрос TEXTSEARCH
    this.textsearch = function (layers, filter, index, objcount, context) {
        // http://localhost/GISWebServiceSE/service.php?METHOD=TEXTSEARCH&Layer=0001&Service=wfs&TEXTFILTER=((OBJNAME)(=)(val=*М-7*));
        if (typeof (layers) == undefined || layers.length == 0 || typeof (filter) == undefined || filter.length == 0)
            return;
        
        var param = { "RESTMETHOD": "TEXTSEARCH", "SERVICE": "WFS", "Layer": "", "TextFilter": "", "OBJCENTER": "2", "START_INDEX": "0", "OBJLOCAL":"0,1,2,4", "MAPID":1};
        param.Layer = layers;
        param.TextFilter = filter;     
        if (typeof (index) != undefined && index >= 0) param.START_INDEX = index;
        if (typeof (objcount) != undefined && objcount > 0) param.FEATURE_COUNT = objcount;
        param.MapID = 1;
        this.context = context;

        this.sendRequest(param);
        return;
    }

    // Выполнить запрос TEXTSEARCH по протоколу xmlRpc
    this.textsearchex = function (rpclayers, index, objcount, context) {

        if (!rpclayers || !$.isArray(rpclayers)) {
            console.log("ERROR:   WfsQueries.textsearchex input parameters error.");
            return;
        }

        if (index == undefined || index == null || index < 0) index = 0;
        this.context = context;
        var url = "?OBJCENTER=2&OBJLOCAL=0,1,2,4&MapId=1&START_INDEX=" + index;
        if (objcount)
            url += "&FEATURE_COUNT=" + objcount;
        if(GWTK.maphandlers.map.options.objectpanel){
            url += '&OUTTYPE=JSON';
            this.OUTTYPE = 'JSON';
        }
        if(GWTK.maphandlers.map.options.measurement.show){
            url += '&AREA=1'
        }
        var xtext = GWTK.Util.url2xmlRpcEx(url, "TEXTSEARCH", rpclayers);

        //console.log(xtext);

        this.postRequest({ 'SERVICE' : 'WFS','RESTMETHOD' : 'TEXTSEARCH' }, xtext);
        return;
    }

    // Выполнить запрос AREASEARCH 
    this.areaseek = function (layer, xarea, method, startindex, objcount, locals) {
        if (!layer || !xarea || !method)
            return;
        if (startindex == undefined) startindex = 0;
        if (locals == undefined) locals = '0,1,2,4';
        var surl = this.mapsrv + "?SERVICE=WFS&OBJCENTER=2&MAPID=1&START_INDEX=" + startindex + "&OBJLOCAL=" + locals;
        if (objcount) surl += '&FEATURE_COUNT=' + objcount;
        surl += "&RESTMETHOD=" + method + "&LAYER=" + layer;
        var xhrfields,
            wc = this.map.authTypeServer(this.mapsrv) || this.map.authTypeExternal(this.mapsrv);
        wc ? xhrfields = {withCredentials: true} : xhrfields = undefined;
        var _token = false;
        if (typeof this.map !== 'undefined' && $.isFunction(this.map.getToken)) {
            _token = this.map.getToken();
        }

        $.support.cors = true;
        if (window.XDomainRequest) {
            xdr = new XDomainRequest();
            if (xdr) {
                xdr.timeout = this.qtimeout;
                xdr.ontimeout = this.onTimeout;
                xdr.onerror = this.onError;
                xdr.onload = this.onSuccess;
                xdr.ondataload = this.onDataLoad;
                xdr.sender = this;
                xdr.open('POST', surl);
                xdr.send(xarea);
            }
        }
        else {
            this.hhr = $.ajax({
                crossDomain: true,
                context: this,
                url: surl,
                beforeSend: _token ? function (xhr) { xhr.setRequestHeader(GWTK.AUTH_TOKEN, _token) } : undefined,
                processData: false,
                type: "POST",
                data: xarea,
                response: 'text/xml',
                dataType: 'xml',
                xhrFields: xhrfields,
                success: this.onSuccess,
                error: this.onError
            });
        }
    }

    // Выполнить запрос AREASEARCH по протоколу xmlRpc 
    this.areaseekex = function (layers, xarea, method, startindex, objcount, locals) {

        if (!layers || !xarea || !method) {
            console.log("ERROR:   WfsQueries.areaseekex input parameters error.");
            return;
        }
        if (startindex == undefined || startindex == null) startindex = 0;
        if (locals == undefined || locals == null) locals = '0,1,2,4';

        var rpcArea = GWTK.Util.utf8ToBase64(xarea);

        var getArea = '', json = '';
        if(this.OUTTYPE == 'JSON'){
            json = '&OUTTYPE=JSON'
        }
        if(GWTK.maphandlers.map.options.measurement.show){
            getArea = '&AREA=1';
        }
        var parm = "?MAPID=1&OBJCENTER=2&START_INDEX=" + startindex + "&OBJLOCAL=" + locals + "&FILEDATA=1&SEMANTICNAME=1" + getArea + json;
        if (objcount) parm += '&FEATURE_COUNT=' + objcount;

        var xtext = GWTK.Util.url2xmlRpcEx(parm, method, layers, [rpcArea]);
        //console.log(xtext);
        if (xtext) {
            this.postRequest({ 'SERVICE': 'WFS', 'RESTMETHOD': method }, xtext);
        }
        return;
    }

    // Выполнить запрос AREASEEKINSIDE
    this.areaseekinside = function (layer, xarea) {
        if (layer == undefined || xarea == undefined)
            return;
        var _token = false;
        if (typeof this.map !== 'undefined' && $.isFunction(this.map.getToken)) {
            _token = this.map.getToken();
        }
        var surl = this.mapsrv + "?SERVICE=WFS&RESTMETHOD=";
        
        surl += 'areaseekinside' + "&LAYER=" + layer;
        var xhrfields,
            wc = this.map.authTypeServer(this.mapsrv) || this.map.authTypeExternal(this.mapsrv);
        wc ? xhrfields = {'withCredentials': true} : xhrfields = undefined;

        $.support.cors = true;
        if (window.XDomainRequest) {
            xdr = new XDomainRequest();
            if (xdr) {
                xdr.timeout = this.qtimeout;
                xdr.ontimeout = this.onTimeout;
                xdr.onerror = this.onError;
                xdr.onload = this.onSuccess;
                xdr.ondataload = this.onDataLoad;
                xdr.sender = this;
                xdr.open('POST', surl);
                xdr.send(xarea);
            }
        }
        else {
            this.hhr = $.ajax({
                crossDomain: true,
                context: this,
                url: surl,
                beforeSend: _token ? function (xhr) { xhr.setRequestHeader(GWTK.AUTH_TOKEN, _token) } : undefined,
                processData: false,
                type: "POST",
                data: xarea,
                response: 'text/xml',
                dataType: 'xml',
                xhrFields: xhrfields,
                success: this.onSuccess,
                error: this.onError
            });
        }
    }

    // Выполнить запрос для получения инормации о выполненных транзакциях на сервере по дате, времени 
    this.transactionstimefilter = function (layer, date, time) {

        // var url= 'localhost/GISWebServiceSE/service.php?METHOD=GETTRANSACTION&Layer=0001&Service=wfs&Date=09.10.2014&time=10:15:20';
        if (layer == undefined || layer == null || layer.length == 0) return;
        if (date == undefined || date == null) return;
        var stime = time;
        if (stime == undefined || stime == null) stime = '00:00:00';
        var opt = { 'SERVICE': 'WFS', 'METHOD': 'GetTransaction', 'LAYER': '', 'DATE': '', 'TIME': '' };
        opt.LAYER = layer;
        opt.DATE = date;
        opt.TIME = stime;
        this.sendRequest(opt, true);
        return;
    } 

    // Выполнить запрос для построения сплайна 
    this.spline = function (layer, type, xml) {
        if (layer == undefined || layer == null || layer.length == 0) return;
        if (typeof(type) == undefined) type = 'smooth';
        if (type != 'smooth' && type != 'bend')
            type = 'smooth';
        var opt = { 'SERVICE': 'WFS', 'METHOD': 'SPLINEBEND', 'LAYER': '' };
        if (type == 'smooth') opt.METHOD = 'SPLINECASHION';
        opt.LAYER = layer;

        this.postRequest(opt, xml);
    }

    // Выполнить запрос для создания слоя по файлу gml 
    this.loadgmlbyxsd = function (options, xgml, callback) {

        if (!options || !xgml || xgml.length === 0) {
            return;
        }

        if ($.isFunction(callback)) {
            this.onDataLoad = callback;
        }
       
        options.RestMethod = 'LoadGmlByXsd';
        options.Service = 'WFS';

        this.postRequest(options, xgml);

        return;
    },

    // Выполнить запрос для получения списка схем xsd 
    this.getxsdlist = function (callback) {
        
        if ($.isFunction(callback)) {
            this.onDataLoad = callback;
        }
        
        this.sendRequest({ 'RestMethod': 'GetXsdList' });

        return;
    },

    // Выполнить POST-запрос 
    this.postRequest = function (options, xmldata) {

        if (typeof options === 'undefined' || !xmldata)
            return;

        var outtype = 'text/xml', _token = false,
            dataType = 'xml';
        if (options.OUTTYPE) {
            dataType = 'JSON';
            outtype = options.OUTTYPE;
        }
     
        if (typeof this.map !== 'undefined' && $.isFunction(this.map.getToken)) {
            _token = this.map.getToken();
        }
     
        var surl = this.mapsrv + "?";

        // параметры запроса
        for (var key in options) {
            var val = options[key];
            if (typeof (val) !== "undefined")
                surl += "&" + key + "=" + val;
        }

        var xhrfields,
            wc = false;
        if (this.map) {
            wc = this.map.authTypeServer(this.mapsrv) || this.map.authTypeExternal(this.mapsrv);
        }    

        wc ? xhrfields = {'withCredentials': true} : xhrfields = undefined;

        $.support.cors = true;

        if (window.XDomainRequest) {
            xdr = new XDomainRequest();
            if (xdr) {
                xdr.timeout = this.qtimeout;
                xdr.ontimeout = this.onTimeout;
                xdr.onerror = this.onError;
                xdr.onload = this.onSuccess;
                xdr.ondataload = this.onDataLoad;
                xdr.sender = this;
                xdr.open('POST', surl);
                xdr.send(xmldata);
            }
        }
        else {
            this.hhr = $.ajax({
                crossDomain: true,
                context: this,
                url: surl,
                processData: false,
                type: "POST",
                beforeSend: _token ? function(xhr){xhr.setRequestHeader(GWTK.AUTH_TOKEN, _token);} : undefined,
                data: xmldata,
                response: outtype,
                dataType: dataType,
                xhrFields: xhrfields, 
                success: this.onSuccess,
                error: this.onError
            });
        }
    }

    this.areafeature = function (layer, gmlpolygon) {
        if (!gmlpolygon) return;
        var opt = { 'SERVICE': 'Wfs', 'RESTMETHOD': 'GetArea' };
        if (layer && layer.length > 0) {
            opt["LAYER"] = layer;
        }
        this.postRequest(opt, gmlpolygon);

        return;
    }


    /**
     * Выполнить хранимый запрос GetFeatureById
     * @param id (String) - идентификатор оюъекта
     * @param async (Bool) - false/true признак aсинхронного запроса
     * @param options (Object) - расширенные параметры запроса
     * {
     *     layer - идентификатор слоя на сервисе
     *     objcenter - 1/2 - центр объекта (1 = по центру, 2 - по первой точке)
     *     outtype - 'json'/null - формат возвращаемых данных (json или xml)
     *     area - 0/1 - вернуть площадь объекта
     *     length - 0/1 - вернуть длину объекта
     *     semanticname - 0/1 - вернуть семантику объекта
     *     metric - 0/1 - вернуть метрику объекта
     *     getframe - 0/1 - вернуть габариты объекта
     *     getsld - 0/1 - вернуть графическое описание объекта
     *     mapid - 0/1 - вернуть идентификатор слоя на сервисе
     *     inmap - 0/1 - проведение рассчетов с учетом рельефа местности - 1 или без - 0
     *     crs - параметр указывает в какой референсной системе координат заданы значения параметра BBOX. Значением параметра служит код системы координат.
     *
     * }- параметры запроса
     */
    this.getFeatureById = function (id, options, async) {
                                    // layerid, responcetype, objectcenter, area, length, getframe, sld) {
        if (typeof (id) == "undefined") return "";

        var opt = {
            'id': id,
            'SERVICE': 'WFS',
            'REQUEST': 'GetFeature',
            'STOREDQUERY_ID': 'urn:ogc:def:query:OGC-WFS::GetFeatureById'
        };
        opt = $.extend(opt, options);

        // this.sendRequest(opt, async);
        this.sendRequest(opt);

        // async = (typeof async === "boolean") ? async: true;
        // var ret = this.sendRequest(opt, async);
        // if (async === false) {
        //     return ret;
        // }

        return;
    }



}
