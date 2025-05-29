/*!
 * Класс WmsQueries
 */

// ===============================================================
//  WmsQueries object 
// ===============================================================
function WmsQueries(srv)
{
    this.qoptions = { 'SERVICE': 'WMS', 'VERSION': '1.3.0', 'REQUEST': '' };    
    this.qtimeout = 60000;
    this.xmlDoc = new xmlDocument();
    this.mapsrv = '';
    this.enabled = false;
    var xdr;
    var hhr;
    
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

        // строка запроса с параметрами
        for (var key in options) {
            var val = options[key];
            if (typeof(val) != "undefined")
               sUrl += "&" + key + "=" + val;
        }
        
        if (window.XDomainRequest) {
            xdr = new XDomainRequest();
            xdr.timeout = this.qtimeout;
            xdr.ontimeout = this.onTimeout;
            xdr.onload = this.onSuccess;
            xdr.onerror = this.onError;
            xdr.ondataload = this.onDataLoad;
            xdr.wms = this;
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
    
    // Обработчик успешного запроса
    this.onSuccess = function (response) {
        
        if (hhr != null) { 
            this.xmlDoc = hhr.responseText;
            this.onDataLoad(this.xmlDoc);
        }
        else { // для IE
            if (typeof (response) === "undefined") {
                if (this.contentType === 'text/xml')
                   this.wms.xmlDoc = this.responseText;
            }
            if (this.ondataload != null)
                this.ondataload(this.responseText);
        }        
    }

    // Обработчик ошибки запроса
    this.onError = function (XHR, textStatus, errorThrown) {
                
        if (hhr != null) {
            var err = textStatus;
            if ((textStatus != errorThrown) && (errorThrown.length > 0))
                err += ". " + errorThrown + ".";
            this.xmlDoc = setExceptionResponse(err);
            this.onDataLoad(this.xmlDoc);
        }
        else { // для IE
            if (typeof (this.wms) !== "undefined") 
                this.wms.xmlDoc = setExceptionResponse("error");

            if (typeof (this.ondataload) !== "undefined" && this.ondataload != null)
                this.ondataload(this.wms.xmlDoc);
        }
    }

    // Обработчик превышения времени запроса (только для IE)
    this.onTimeout = function () {

        this.wms.xmlDoc = setExceptionResponse("timeout");
        if (typeof (this.ondataload) != "undefined") {
            xdr.ondataload(xdr.wms.xmlDoc);
        }                
    }

    // Выполнить запрос GetCapabilities - получить метаданные 
    // Возвращает метаданные в виде XML
    this.getcapabilities = function () {

        if (this.enabled == false || this.mapsrv.length == 0)
            return;
        
        var opt = this.qoptions;
        opt.REQUEST = "GetCapabilities";
        var resp = this.sendRequest(opt);
        return resp;
    }       

    // Создать строку запроса рисунка карты 
    // querymap – параметры запроса GetMap    
    // При ошибке возвращает пустую строку
    this.mapurl = function (querymap) {

        var sUrl = "";
        if (this.mapsrv == null || querymap == null)
            return sUrl;
                
        var options;
        // Проверить является ли входной параметр объектом
        if (typeof (querymap) != "object")
            options = $.parseJSON(querymap);
        else
            options = querymap;
        if (options == null)
            return sUrl;

        if (options.layers == null || options.layers.length == 0)
            return sUrl;
        if (options.crs == null || options.crs.length == 0)
            return sUrl;
        if (options.bbox == null || options.bbox.length == 0)
            return sUrl;
        if (options.width == null || options.width.length == 0)
            return sUrl;
        if (options.height == null || options.height.length == 0)
            return sUrl;
        
        if (options.style == null || options.style.length == 0)
            options.style = "default";
        if (options.format == null)
            options.format = "";
        
        var sUrl = this.mapsrv + '?SERVICE=' + this.qoptions.SERVICE + '&VERSION=' + this.qoptions.VERSION +
            "&REQUEST=GetMap" + "&LAYERS=" + options.layers + "&STYLE=" + options.style + "&FORMAT=" + options.format +
            "&crs=" + options.crs + "&bbox=" + options.bbox + "&width=" + options.width + "&height=" + options.height;
                
        return sUrl;
    }

    // Получить метаданные объектов карты в точке
    // queryfeature - строка параметров запроса GetFeatureInfo
    // Возвращает строку метаданных объектов в запрошенном формате: HTML/XML
    // При ошибке возвращает пустую строку
    this.featureinfo = function (queryfeature) {

        var resp = "";
        if (queryfeature == null)
            return resp;

        var options;
        // Проверить является ли входной параметр объектом
        if (typeof (queryfeature) != "object")
            options = $.parseJSON(queryfeature);
        else
            options = queryfeature;
        if (options == null)
            return resp;

        if (options.layers == null || options.layers.length == 0)
            return resp;
        if (options.query_layers == null || options.query_layers.length == 0)
            return resp;
        if (options.crs == null || options.crs.length == 0)
            return resp;
        if (options.bbox == null || options.bbox.length == 0)
            return resp;
        if (options.width == null || options.width.length == 0)
            return resp;
        if (options.height == null || options.height.length == 0)
            return resp;
        if (isNaN(options.i) || isNaN(options.j))
            return resp;
       
        if (options.style == null || options.style.length == 0)
            options.style = "default";
        if (options.format == null)
            options.format = "";
        if (options.info_format == null || options.info_format == "")
            options.info_format = "text/xml";
        if (options.feature_count == null || options.feature_count.length == 0)
            options.feature_count = 10;        

        options.request = "GetFeatureInfo";
        options.service = 'WMS';
        options.version = '1.3.0';

        var res = this.sendRequest(options);

        return res;
    }       

}