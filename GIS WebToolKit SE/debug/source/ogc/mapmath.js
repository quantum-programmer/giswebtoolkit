/*!
 * Класс MapMath 
 */

// ===============================================================
//  MapMath object, map measurements interface, 
//  extended queries protocol WFC, WMS, WMTS
// ===============================================================
// 08/04/20

function MapMath(srv) {

    this.options_wfs = { 'SERVICE': 'WFS', 'REQUEST': '', 'OUTPUTFORMAT': 'GML/XML' };
    this.options_wmts = { 'SERVICE': 'WMTS', 'VERSION': '1.0.0', 'REQUEST': '' };

    this.xmlDoc = new xmlDocument();
    this.mapsrv = '';
    this.enabled = false;
    this.qtimeout = 60000;                    // 1 min
    var xdr;
    this.hhr;
    this.context = null;

    this.init = function (prm) {
        this.mapsrv = prm;
        this.enabled = true;
    }

    this.init(srv);

    // Event handler of successful response 
    this.onDataLoad = null;

    // Выполнить запрос
    // options - JSON объект параметров запроса
    this.sendRequest = function (options) {

        if (typeof (options) == "undefined")
            return;

        var sUrl = this.mapsrv + "?", _token = false, 
            xhrheader = undefined;

        // строка запроса с параметрами
        for (var key in options) {
            var val = options[key];
            if (window.XDomainRequest) val = encodeURIComponent(val);
            if (typeof (val) != "undefined")
                sUrl += "&" + key + "=" + val;
        }

        if (typeof this.context !== "undefined" && this.context.hasOwnProperty('map')) {
            if ($.isFunction(this.context.map.getToken)) {
                _token = this.context.map.getToken();
            }
            if (this.context.map.authTypeServer(this.mapsrv) || 
                this.context.map.authTypeExternal(this.mapsrv) ){
                    xhrheader = {withCredentials: true};
            }        
        }
        
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
            $.support.cors = true;
            this.hhr = $.ajax({
                crossDomain: true,
                context: this,
                type: 'get',
                url: this.mapsrv,
                data: options,         // параметры запроса
                response: 'text/xml',  // тип возвращаемого ответа text либо xml
                beforeSend: _token ? function (xhr) { xhr.setRequestHeader(GWTK.AUTH_TOKEN, _token); } : undefined,
                async: true,
                xhrHeaders: xhrheader,
                timeout: this.qtimeout,
                error: this.onError,
                success: this.onSuccess
            });
        }
    }

    // Обработчик успешного запроса
    this.onSuccess = function (response) {

        if (this.hhr != null) {
            this.xmlDoc = this.hhr.responseText;
            this.onDataLoad(this.xmlDoc, this.context);
            this.context = null;
        }
        else { // для IE
            if (this.sender) {
                if (this.contentType === 'text/xml') {
                    this.sender.xmlDoc = this.responseText;
                }
                if (this.ondataload)
                    this.ondataload(this.responseText, this.sender.context);
                else if (this.sender.onDataLoad) {
                    this.sender.onDataLoad(this.responseText, this.sender.context);
                }
                this.sender.context = null;
            }
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
                if (this.ondataload)
                    this.ondataload(this.sender.xmlDoc, this.sender.context);
                this.sender.context = null;
            }
        }
    }

    // Обработчик превышения времени запроса 
    this.onTimeout = function () {
        if (!this.sender) { return; }
        this.sender.xmlDoc = setExceptionResponse("timeout");
        if (this.ondataload) {
            this.ondataload(this.sender.xmlDoc, this.sender.context);
        }
        this.sender.context = null;
    }

    this.dimentionfeatures = function (queryfeature, context) {           // список объектов в точке с измерениями и id по WMTS
        var resp = "";
        if (queryfeature == null) return resp;
        this.context = context;
        var options;

        if (typeof (queryfeature) != "object")
            options = $.parseJSON(queryfeature);
        else
            options = queryfeature;

        if (options == null) return resp;

        if (options.layer == null || options.layer.length == 0)
            return resp;
        if (options.tilematrixset == null || options.tilematrixset.length == 0)
            return resp;
        else {
            if (options.tilematrixset.indexOf("urn:ogc:def:wkss:OGC:1.0:") == -1 && options.tilematrixset.indexOf(":3395") == -1)
                options.tilematrixset = options.tilematrixset;
                // options.tilematrixset = "urn:ogc:def:wkss:OGC:1.0:" + options.tilematrixset;  - сервис больше не требует
        }
        if (options.style == null || options.style.length == 0)
            options.style = "default";
        if (options.format == null) options.format = "";
        if ((options.tilerow == null) || (options.tilecol == null))
            return resp;
        if (options.info_format == null || options.info_format == "") options.info_format = "text/xml";

        if (isNaN(options.i) || isNaN(options.j)) return resp;

        options.REQUEST = "GetFeatureInfo";
        options.SERVICE = 'WMTS';
        options.VERSION = '1.0.0';

        this.sendRequest(options);

        return "1";
    }

    this.dimentions = function (layer, id, context) {                                 // wfs
        this.context = context;
        if (id == undefined || id == null) {
            var err = "Request parameters error. Locator=id";
            this.xmlDoc = setExceptionResponse(err);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }
       
        var opt = { 'SERVICE': 'WFS', 'REQUEST': 'GetFeature', 'STOREDQUERY_ID': 'urn:ogc:def:query:OGC-WFS::GetFeatureById' };
        opt.ID = id;
        opt.LAYER = layer;
        opt.AREA = "1";
        opt.LENGTH = "1";

        this.sendRequest(opt);
        return;
    }

    this.area = function (layer, id, context) {                                     // wfs
        this.context = context;
        if (id == undefined || id == null) {
            var err = "Request parameters error. Locator=id";
            this.xmlDoc = setExceptionResponse(err);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }

        var opt = { 'SERVICE': 'WFS', 'REQUEST': 'GetFeature', 'STOREDQUERY_ID': 'urn:ogc:def:query:OGC-WFS::GetFeatureById' };
        opt.ID = id;
        opt.LAYER = layer;
        opt.AREA = "1";
        opt.LENGTH = "0";
        opt.SEMANTIC = "0";
        opt.METRIC = "1";

        this.sendRequest(opt);
        return;
    }

    this.length = function (layer, id, context) {                                   // wfs
        this.context = context;
        if (id == undefined || id == null) {
            var err = "Request parameters error. Locator = id";
            this.xmlDoc = setExceptionResponse(err);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }

        var opt = { 'SERVICE': 'WFS', 'REQUEST': 'GetFeature', 'STOREDQUERY_ID': 'urn:ogc:def:query:OGC-WFS::GetFeatureById' };
        opt.ID = id;
        if (layer != undefined && layer != null) {
            opt.LAYER = layer;
        }
        opt.AREA = "0";
        opt.LENGTH = "1";
        opt.SEMANTIC = "0";
        opt.METRIC = "1";

        this.sendRequest(opt);
        return;
    }

    this.azimuth = function (layer, point1, point2, crs, handle, context) {                 // wfs
        this.context = context;
        var locator = "";
        if (layer == undefined || layer == null) {
            locator = "layer";
        }
        else {
            if (point1 == undefined || point1 == null) {
                locator = "point1";
            }
            else {
                if (point2 == undefined || point2 == null) {
                    locator = "point2";
                }
                else if (crs == undefined || crs == null) {
                    locator = "crs";
                }
            }
        }
        if (locator.length != 0) {
            this.xmlDoc = setExceptionResponse("Request parameters error. Locator = " + locator);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }

        var opt = { 'SERVICE': 'WFS', 'RESTMETHOD': 'SIDEAZIMUTH' };
        opt.LAYER = layer;
        opt.POINT1 = [point1.x, point1.y];
        opt.POINT2 = [point2.x, point2.y];
        opt.CRS = crs;
        opt.HANDLE = handle;


        this.sendRequest(opt);
        return;
    }

    this.directionalangle = function (layer, point1, point2, crs, handle, context) {        // wfs
        var locator = "";
        if (layer == undefined || layer == null) {
            locator = "layer";
        }
        else {
            if (point1 == undefined || point1 == null) {
                locator = "point1";
            }
            else {
                if (point2 == undefined || point2 == null) {
                    locator = "point2";
                }
                else if (crs == undefined || crs == null) {
                    locator = "crs";
                }
            }
        }
        if (locator.length != 0) {
            this.xmlDoc = setExceptionResponse("Request parameters error. Locator = " + locator);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }

        var opt = { 'SERVICE': 'WFS', 'RESTMETHOD': 'SIDEDIRECTION' };
        opt.LAYER = layer;
        opt.POINT1 = [point1.x, point1.y];
        opt.POINT2 = [point2.x, point2.y];
        opt.CRS = crs;
        opt.HANDLE = handle;

        this.context = context;

        this.sendRequest(opt);
        return;
    }

    this.mapdistance = function (layer, point1, point2, crs, handle, context) {
        this.context = context;
        var locator = "";
        if (layer == undefined || layer == null) {
            locator = "layer";
        }
        else {
            if (point1 == undefined || point1 == null) {
                locator = "point1";
            }
            else {
                if (point2 == undefined || point2 == null) {
                    locator = "point2";
                }
                else if (crs == undefined || crs == null) {
                    locator = "crs";
                }
            }
        }

        if (locator.length != 0) {
            this.xmlDoc = setExceptionResponse("Request parameters error. Locator = " + locator);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }

        var opt = { 'SERVICE': 'WFS', 'RESTMETHOD': 'SIDELENGTH' };
        opt.LAYER = layer;
        opt.POINT1 = [point1.x, point1.y];
        opt.POINT2 = [point2.x, point2.y];
        opt.CRS = crs;
        opt.HANDLE = handle;

        this.sendRequest(opt);
        return;
    }
       
    this.mappolygoncenter = function (layer, id, context) {
        this.context = context;
        if (layer == undefined || layer == null) {
            var err = "Request parameters error. Locator = Layer";
            this.xmlDoc = setExceptionResponse(err);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }

         if (id == undefined || id == null) {
            var err = "Request parameters error. Locator=id";
            this.xmlDoc = setExceptionResponse(err);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }

        var opt = { 'SERVICE': 'WFS', 'REQUEST': 'GetFeature', 'STOREDQUERY_ID': 'urn:ogc:def:query:OGC-WFS::GetFeatureById' };
        opt.ID = id;
        opt.LAYER = layer;
        opt.OBJCENTER = "1";

        this.sendRequest(opt);
        return;

    }

    this.intersection = function (layer, id, type, context) {
        this.context = context;
        if (layer == undefined || layer == null) {
            var err = "Request parameters error. Locator = Layer";
            this.xmlDoc = setExceptionResponse(err);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }

        if (id == undefined || id == null) {
            var err = "Request parameters error. Locator=id";
            this.xmlDoc = setExceptionResponse(err);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }

        var method = '';
        if (type == 0) method = 'crossline';
        else method = 'crosslinesquare';
        var opt = { 'SERVICE': 'WFS', 'RESTMETHOD': '' };
        opt.RESTMETHOD = method;
        opt.LAYER = layer;
        opt.ID = id;

        this.sendRequest(opt);
        return;
    }

    this.intersectionsquare = function (layer, id, context) {
        this.context = context;

        if (layer == undefined || layer == null) {
            var err = "Request parameters error. Locator = Layer";
            this.xmlDoc = setExceptionResponse(err);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }

        if (id == undefined || id == null) {
            var err = "Request parameters error. Locator=id";
            this.xmlDoc = setExceptionResponse(err);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }

        var opt = { 'SERVICE': 'WFS', 'RESTMETHOD': 'crosssquare' };
        opt.LAYER = layer;
        opt.ID = id;
        this.sendRequest(opt);
        return;
    }

    this.merging = function (layer, id, context) {
        //http://localhost/GISWebServiceSE/service.php?METHOD=UNION&Service=WFS&Layer=0005&id=Новая карта:148,Новая карта:142
        this.context = context;
        if (typeof(layer) == undefined || layer == null) {
            var err = "Request parameters error. Locator = Layer";
            this.xmlDoc = setExceptionResponse(err);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }

        if (typeof(id) == undefined || id == null) {
            var err = "Request parameters error. Locator=id";
            this.xmlDoc = setExceptionResponse(err);
            if (this.onDataLoad != null)
                this.onDataLoad(this.xmlDoc, context);
            return;
        }
        
        var opt = { 'SERVICE': 'WFS', 'RESTMETHOD': 'UNION' };
        opt.LAYER = layer;
        opt.ID = id;

        this.sendRequest(opt);
        return;
    }

    this.spline = function (layer, type, xml) {
        if (layer == undefined || layer == null || layer.length == 0) return;
        if (typeof (type) == undefined) type = 'smooth';
        if (type != 'smooth' && type != 'bend')
            type = 'smooth';
        var opt = { 'SERVICE': 'WFS', 'RESTMETHOD': 'SPLINEBEND', 'LAYER': '' };
        if (type == 'smooth') opt.RESTMETHOD = 'SPLINECASHION';
        opt.LAYER = layer;

        this.postRequest(opt, xml);
    }

    this.postRequest = function (options, xmldata) {

        if (typeof (options) == undefined || xmldata == undefined)
            return;
        var surl = this.mapsrv + "?";
        var sep = "", _token = false, xhrFields = undefined;
        // параметры запроса
        for (var key in options) {
            var val = options[key];
            if (window.XDomainRequest) val = encodeURIComponent(val);
            if (typeof (val) != "undefined") {
                surl += sep + key + "=" + val;
                sep = "&";
            }
        }

        if (typeof this.context !== "undefined" && this.context.hasOwnProperty('map')) {
            if ($.isFunction(this.context.map.getToken)) {
                _token = this.context.map.getToken();
            }
            if (this.context.map.authTypeServer(this.mapsrv) || 
                this.context.map.authTypeExternal(this.mapsrv)){
                xhrFields = {withCredentials: true};
            }                    
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
                response: 'text/xml',
                beforeSend: _token ? function(xhr){xhr.setRequestHeader(GWTK.AUTH_TOKEN, _token);} : undefined,
                xhrFields: xhrFields,
                success: this.onSuccess,
                error: this.onError
            });
        }
    }

    this.areafeature = function (layer, gmlpolygon) {
        if (!layer || !gmlpolygon) return;
        var opt = { 'SERVICE': 'Wfs', 'RESTMETHOD': 'GetArea', 'LAYER': layer };

        this.postRequest(opt, gmlpolygon);

        return;
    }

    this.buildzonefeature = function (layer, id, radius, context) {
        if (!layer || !id || !radius) return false;

        this.context = context;

        this.sendRequest({ 'SERVICE': 'WFS', 'RESTMETHOD': 'BuildZone', 'LAYER': layer, 'IDLIST': id, 'RADIUS': radius, 'CIRCLE': '1', 'SEVERALOBJ': '1' });

        return true;
    }

    this.postxmlrpc = function (xml, context, request) {
        if (!xml) return false;
        if (!request)
            request='GetFeature';
        this.context = context;
        this.postRequest({ 'SERVICE': 'WFS','RESTMETHOD':request}, xml);
        return true;
    }

    /////////////////////////////////////////////////////////
    this.lengthfeature = function (layer, gmlline) { }                      // wfs
    this.distance = function (point1, point2, crs) { }                      // wfs
    this.polygoncenter = function (layer, gmlpolygon) { }                   // wfs
}