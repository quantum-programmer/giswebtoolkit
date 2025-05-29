/**************************************** Тазин В.О.   20/04/17 ****
****************************************************** 09/01/17 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2017              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                       Выполнение WMTS-запросов                   *
*                                                                  *
*******************************************************************/
// ===============================================================
//  WmtsQueries object, querying map tiles, 
//  map tile layers options 
// ===============================================================
WmtsQueries = function WmtsQueries(srv)
{
    this.gtile = '?SERVICE=WMTS&VERSION=1.0.0';
    this.qoptions = { 'SERVICE': 'WMTS', 'VERSION': '1.0.0', 'REQUEST': '' };
    this.qtimeout = 60000;
    this.xmlDoc = new xmlDocument();
    this.mapsrv = '';
    this.enabled = false;
    var xdr;
    var hhr;
    var callbacks;
    this.context = null;

    this.init = function (prm) {
        this.mapsrv = prm;
        this.enabled = true;
    }

    if (typeof (srv) == 'undefined') {
        this.enabled = false; return;
    }

    this.init(srv);

    // Event handler of successful response 
    this.onDataLoad = null;

    // Выполнить запрос
    // options - JSON объект параметров запроса
    this.sendRequest = function (options) {

        if (typeof (options) == "undefined")
            return;
        
        var sUrl = this.mapsrv + "?";
        if ('url' in options && options.url.length != 0)
            sUrl = options.url + "?";

        // строка запроса с параметрами
        for (var key in options) {
            var val = options[key];
            if (typeof(val) != "undefined")
               sUrl += "&" + key + "=" + val;
        }

        $.support.cors = true;

        if (window.XDomainRequest) {
            xdr = new XDomainRequest();
            xdr.timeout = this.qtimeout;
            xdr.ontimeout = this.onTimeout;
            xdr.onload = this.onSuccess;
            xdr.onerror = this.onError;
            xdr.ondataload = this.onDataLoad;
            xdr.wmts = this;
            xdr.open("get", sUrl);
            xdr.send();
        }
        else {
            $.support.cors = true;
            hhr = $.ajax({
                crossDomain: true,
                context: this,
                type: 'get',
                url: this.mapsrv,
                data: options,         // параметры запроса
                response: 'text/xml',  // тип возвращаемого ответа text либо xml
                async: true,
                timeout: this.qtimeout,
                error: this.onError,
                success: this.onSuccess
            });
        }
    }

    this.postRequest = function (options, xmldata) {

        if (typeof (options) == undefined || xmldata == undefined)
            return;
        var surl = this.mapsrv + "?";

        // параметры запроса
        for (var key in options) {
            var val = options[key];
            if (typeof (val) != "undefined")
                surl += "&" + key + "=" + val;
        }

        var response = 'text/xml';
	    var dataType = 'xml';
        
 	    if (options.OUTTYPE) {
	        response = 'json';
	        dataType = 'json';
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
                data: xmldata,
                response: response,
                dataType: dataType,
                success: this.onSuccess,
                error: this.onError
            });
        };

    }
    
    // Обработчик успешного запроса
    this.onSuccess = function (response) {
        
        if (response) {
            this.xmlDoc = this.hhr.responseText;
            this.onDataLoad(this.xmlDoc, this.context);
            this.context = null;
        }
        else { // для IE
            if (typeof (response) === "undefined") {
                if (this.contentType === 'text/xml') {
                    this.wmts.xmlDoc = this.responseText;
                }
            }
            if (this.ondataload != null)
                this.ondataload(this.responseText, this.wmts.context);
            this.wmts.context = null;
        }
    }
    
    // Обработчик ошибки запроса
    this.onError = function (XHR, textStatus, errorThrown) {
                
        if (this.hhr != null) {
            var err = textStatus;
            if ((textStatus != errorThrown) && (errorThrown.length > 0))
                err += ". " + errorThrown + ".";
            this.xmlDoc = setExceptionResponse(err);
            this.onDataLoad(this.xmlDoc, this.context);
            this.context = null;
        }
        else { // для IE
            if (this.wmts) {
                this.wmts.xmlDoc = setExceptionResponse("error");

                if (this.ondataload)
                this.ondataload(this.wmts.xmlDoc, this.wmts.context);
            this.wmts.context = null;
        }
    }
    }

    // Обработчик превышения времени запроса (только для IE)
    this.onTimeout = function () {

        this.wmts.xmlDoc = setExceptionResponse("timeout");
        if (typeof (this.ondataload) != "undefined") {
            xdr.ondataload(xdr.wmts.xmlDoc, this.wmts.context);
        }
        this.wmts.context = null;
    }

    // Выполнить запрос GetCapabilities - получить метаданные (асинхронно)
    // Возвращает метаданные в виде XML
    this.getcapabilities = function (context) {

        if (this.enabled == false || this.mapsrv.length == 0)
            return;
        this.context = context;
        var opt = { 'SERVICE': 'WMTS', 'VERSION': '1.0.0', 'REQUEST': 'GetCapabilities' };
        var resp = this.sendRequest(opt);
        return;
    }

    // Получить коллекцию строк запросов рисунков тайлов
    // querytile – строка параметров запроса рисунков тайлов в кодировке JSON
    // При отсутствии параметра querytile.max формируется ссылка для запроса одного тайла
    // При ошибках параметров возвращает пустую коллекцию
    this.tileurl = function (querytile) {

        if (this.mapsrv == null || querytile == null) return null;

        var arUrl = new Array();

        var options;
        // Проверить является ли входной параметр объектом
        if (typeof (querytile) != "object")
            options = $.parseJSON(querytile);
        else
            options = querytile;

        if (options == null) return arUrl;

        if (options.layer == null || options.layer.length == 0)
            return arUrl;
        if (options.matrix == null || options.matrix.length == 0)
            return arUrl;
        else{
            if (options.matrix.indexOf("urn:ogc:def:wkss:OGC:1.0:") == -1 && options.matrix.indexOf(":3395") == -1 &&
                options.matrix.indexOf("MILLER") == -1)
                options.matrix = options.matrix;
                // options.matrix = "urn:ogc:def:wkss:OGC:1.0:" + options.matrix; - сервис больше не требует
        }
        if (options.style == null || options.style.length == 0)
            options.style = "default";
        
        if (options.format == null) options.format = "";

        var server = this.mapsrv;
        if (options.url != undefined) server = options.url;

        var urlTempl = server + this.gtile + "&REQUEST=GetTile" + "&LAYER=" + options.layer + "&STYLE=" + options.style + "&FORMAT=" +
                       options.format + "&tilematrixset=" + options.matrix + "&tilematrix=" + options.zoom;

        if (options.min == null || options.min.length != 2) return arUrl;
            
        if (typeof (options.max) === 'undefined' || options.max.length != 2)
        {
            var url = urlTempl + "&tilerow=" + options.min[1] + "&tilecol=" + options.min[0];
            arUrl.push(url);
            return arUrl;
        }
            
        if ((options.min[0] > options.max[0]) || (options.min[1] > options.max[1]))
            return arUrl;

        for (var row = options.min[1]; row <= options.max[1]; row++) {
            for (var col = options.min[0]; col <= options.max[0]; col++) {
                var url = urlTempl + "&tilerow=" + row + "&tilecol=" + col;
                arUrl.push(url);
            }
        }
        return arUrl;
    }

    // Получить рисунок тайла
    
    this.tileimage = function (querytile, context) {

        if (this.mapsrv == null || querytile == null) return "";

        this.context = context;

        var options = $.parseJSON(querytile);

        if (options == null) return "";

        if (options.layer == null || options.layer.length == 0)
            return "";
        if (options.matrix == null || options.matrix.length == 0)
            return "";
        else {
            if (options.matrix.indexOf("urn:ogc:def:wkss:OGC:1.0:") == -1 && options.matrix.indexOf(":3395") == -1)
                options.matrix = options.matrix;
                // options.matrix = "urn:ogc:def:wkss:OGC:1.0:" + options.matrix; - сервис больше не требует
        }
        if (options.style == null || options.style.length == 0)
            options.style = "default";
        if (options.min == null || options.min.length != 2)  return "";
        if (options.format == null) options.format = "";

        var tilereq = this.qoptions;
        tilereq.REQUEST = "GetTile";
        tilereq.layer = options.layer;
        tilereq.style = options.style;
        tilereq.tilematrixset = options.matrix;
        tilereq.tilematrix = options.zoom;
        tilereq.tilerow = options.min[1];
        tilereq.tilecol = options.min[0];
        tilereq.format = options.format;

        var resp = this.sendRequest(tilereq);

        //var sUrl = this.mapsrv + "?";
        
        //// строка запроса с параметрами
        //for (var key in tilereq) {
        //    var val = tilereq[key];
        //    if (typeof (val) != "undefined")
        //        sUrl += "&" + key + "=" + val;
        //}
        
        //return sUrl;
    }

    // Получить метаданные объектов карты в точке
    // queryfeature - строка параметров запроса GetFeatureInfo
    this.featureinfo = function (queryfeature, context) {
        
        if (queryfeature == null) return;
        this.context = context;
        var options;
        if (typeof (queryfeature) != "object")
            options = $.parseJSON(queryfeature);
        else
            options = queryfeature;

        if (options == null) return;

        if (options.layer == null || options.layer.length == 0)
            return;
        if (options.tilematrixset == null || options.tilematrixset.length == 0)
            return;
        else {
            if (options.tilematrixset.indexOf("urn:ogc:def:wkss:OGC:1.0:") == -1 && options.tilematrixset.indexOf(":3395") == -1)
                options.tilematrixset =options.tilematrixset;
                // options.tilematrixset = "urn:ogc:def:wkss:OGC:1.0:" + options.tilematrixset; - сервис больше не требует
        }
        if (options.style == null || options.style.length == 0)
            options.style = "default";
        if (options.format == null) options.format = "";
        if ((options.tilerow == null) || (options.tilecol == null))
            return;
        if (options.info_format == null || options.info_format == "") options.info_format = "text/xml";

        if (isNaN(options.i) || isNaN(options.j)) return;

        options.REQUEST = "GetFeatureInfo";
        options.SERVICE = 'WMTS';
        options.VERSION = '1.0.0';
        options.MapID = 1;

        this.sendRequest(options);

        return;
    }

    // Получить метаданные объектов карты в точке через RPC-запрос
    // param - параметры запроса GetFeatureInfo
    this.featureinfoex = function (param, context) {
        if (!param || !param.layers) {
            console.log("ERROR:   WmtsQueries.featureinfoex input parameters error.");
            return;
        }

        if (param.tilematrixset == null || param.tilematrixset.length == 0) {
            console.log("ERROR:   WmtsQueries.featureinfoex input parameters error (tilematrixset).");
            return;
        }
        else {
            if (param.tilematrixset.indexOf("urn:ogc:def:wkss:OGC:1.0:") == -1 && param.tilematrixset.indexOf(":3395") == -1)
                param.tilematrixset = param.tilematrixset;
                // param.tilematrixset = "urn:ogc:def:wkss:OGC:1.0:" + param.tilematrixset; - сервис больше не требует
        }
        if ((param.tilerow == null || param.tilerow == undefined) || (param.tilecol == null || param.tilecol == undefined)) {
            console.log("ERROR:   WmtsQueries.featureinfoex input parameters error (tilerow).");
            return;
        }

        if (!param.style || param.style.length == 0)
            param.style = "default";
        if (!param.format) param.format = "";
       
        if (param.info_format == null || param.info_format == "") param.info_format = "text/xml";

        param.SEMANTIC = 1;
        param.semanticname = 1;
        param.mapId = 1;
        param.objcenter = 2;
        // param.METRIC = 1;

        var url = "";
        for (var key in param) {
            if (key.toLowerCase() == "layers" || key.toLowerCase() == "layer") continue;
            url += "&" + key + "=" + param[key];
        }
        url = '?' + url.slice(1);

        var xtext = GWTK.Util.url2xmlRpcEx(url, "GetFeatureInfo", param.layers);
        if (xtext)
           this.postRequest({ 'SERVICE': 'WMTS', 'RESTMETHOD': 'GetFeatureInfo' }, xtext);
        
        return;
    }

    // Преобразовать строку в двоичный массив ArrayBuffer
    this.str2arraybuffer = function (str) {
        if (!window.ArrayBuffer) return null;
        var buf = new ArrayBuffer(str.length * 2); 
        var bufView = new Uint16Array(buf);
        for (var i = 0; i < str.length; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

}

