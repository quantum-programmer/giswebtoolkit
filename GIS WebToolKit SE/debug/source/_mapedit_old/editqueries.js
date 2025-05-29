/*************************************** Соколова **** 13/08/19 ****
/*************************************** Нефедьева *** 08/04/20 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*        Выполнение WMS-запросов для редактора карты               *
*                                                                  *
*******************************************************************/

EditQueries = function EditQueries(srv, map) {
    this.qoptions = { 'RESTMETHOD': '', 'LAYERS': '' };

    this.xmlDoc = new xmlDocument();
    this.mapsrv = '';
    this.enabled = false;
    this.qtimeout = 60000;                    // 1 min
    var xdr;
    this.hhr = null;
    this.context = null;
    this.map = map;

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
    // rpcxml - параметры для Rpc запроса
    this.sendRequest = function (options, sync, rpcxml) {

        if (typeof (options) == "undefined") return;
        this.options = options;

        var async = sync, type, data, _token = false;

        if (async == undefined)
            async = true;

        var urlmapsrv = this.mapsrv;
        var sUrl = this.mapsrv + "?";
        
        // строка запроса с параметрами
        if (options) {
            var and = '';
            for (var key in options) {
                var val = options[key];
                if (window.XDomainRequest) val = encodeURIComponent(val);
                if (typeof (val) != "undefined") {
                    sUrl += and + key + "=" + val;
                    and = "&";
                }
            }
            data = options;
        }

        type = 'GET';
        if (rpcxml != undefined && rpcxml.length > 0) {
            type = 'POST';
            data = rpcxml;
        }
        if (typeof this.map !== "undefined" && $.isFunction(this.map.getToken)) {
            _token = this.map.getToken();
        }
        $.support.cors = true;
        if (window.XDomainRequest) {
            xdr = new XDomainRequest();
            xdr.timeout = this.qtimeout;
            xdr.ontimeout = this.onTimeout;
            xdr.onload = this.onSuccess;
            xdr.onerror = this.onError;
            xdr.ondataload = this.onDataLoad;
            xdr.sender = this;
            xdr.open(type, sUrl);
            if (type == "GET")
                xdr.send();
            else
                xdr.send(data);
        }
        else {
            //  Если GET параметры запроса возьмутся из options и url будет содержать только сервис
            //  иначе url содержит параметры + post
            var settings = {
                crossDomain: true,
                type: type,
                url: sUrl,  
                data: data,
                dataType: "text",
                response: 'text',                                                                  //тип возвращаемого ответа text либо xml
                async: async,
                context: this,
                beforeSend: _token ? function (xhr) { xhr.setRequestHeader(GWTK.AUTH_TOKEN, _token) } : undefined,
                error: this.onError,
                success: this.onSuccess,
                timeout: this.qtimeout
            };

            if (typeof this.map !== 'undefined') {
                if (this.map.authTypeServer(this.mapsrv) || 
                    this.map.authTypeExternal(this.mapsrv)) {
                       settings.xhrFields = { withCredentials: true };
                }
            }

            if (type == 'GET'){   
                settings.url = urlmapsrv;
            }
            if (async == false)  // Если несинхронный запрос, просто обозначить this.hhr, чтоб обработать ответ при ошибке
                this.hhr = true;

            this.hhr = $.ajax(settings);
        }
    }

    // Обработчик успешного запроса
    this.onSuccess = function (response) {
        if (response) {
            this.onDataLoad(response, this.context, 'success');
            this.context = null;
        }
        else { // для IE
            if (this.contentType == 'text' && this.sender)
                this.sender.xmlDoc = this.responseText;
            if (this.ondataload)
                this.ondataload(this.responseText, this.sender.context, 'success');
        }
    }

    // Обработчик ошибки запроса
    this.onError = function (object, textStatus, errorThrown) {
        if (this.hhr != null) {
            var err = textStatus;
            if ((textStatus != errorThrown) && (errorThrown.length > 0))
                err += ". " + errorThrown + ".";
            this.xmlDoc = setExceptionResponse(err);
            this.onDataLoad(this.xmlDoc, this.context, 'error');
            this.context = null;
        }
        else { // для IE
            if (this.sender) {                                                                   // 13/02/17
                this.sender.xmlDoc = setExceptionResponse("Request error");
                if (this.ondataload)
                    this.ondataload(this.sender.xmlDoc, this.sender.context, 'error');
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
    },

    // Выполнить запрос GetFeature
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

        this.sendRequest({ 'SERVICE': 'WFS', 'RESTMETHOD': 'GetFeature' }, true, xtext);
    }

}


 