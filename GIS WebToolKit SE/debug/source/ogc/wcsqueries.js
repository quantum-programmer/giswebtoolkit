// ===============================================================
//  WcsQueries object, OGC Web Coverage Service interface
// ===============================================================
function WcsQueries(srv) {

    this.qoptions = { 'SERVICE': 'WCS', 'REQUEST': '' };
    this.xmlDoc = new xmlDocument();
    this.mapsrv = '';
    this.enabled = false;
    this.qtimeout = 60000;                       // timeout = 1 min
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
    this.sendRequest = function (options, async) {

        if (typeof (options) == "undefined") return;

        var sUrl = this.mapsrv + "?";

        // строка запроса с параметрами
        for (var key in options) {
            var val = options[key];
            if (typeof (val) != "undefined") {
                if (key == 'dimensionsubsetx' || key == 'dimensionsubsety') {
                    sUrl += "&" + 'dimensionsubset' + "=" + val;
                }
                else sUrl += "&" + key + "=" + val;
            }
        }

        $.support.cors = true;

        if ($.browser.msie && $.browser.version < 10) {
            xdr = new XDomainRequest();
            xdr.timeout = this.qtimeout;
            xdr.ontimeout = this.onTimeout;
            xdr.onload = this.onSuccess;
            xdr.onerror = this.onError;
            xdr.ondataload = this.onDataLoad;
            xdr.open("get", sUrl);
            xdr.send();
        }
        else {
            if (options.REQUEST == 'GetCoverage') {
                hhr = $.ajax({
                    crossDomain: true,
                    type: 'get',
                    url: sUrl,
                    processData: false,
                    data: {},                                                                       //параметры запроса
                    response: 'text/xml',                                                           //тип возвращаемого ответа text либо xml
                    async: true,
                    context: this,
                    error: this.onError,
                    success: this.onSuccess,
                    timeout: this.qtimeout
                });
            }
            else
            hhr = $.ajax({
                crossDomain: true,
                type: 'get',
                url: this.mapsrv,
                data: options,                                                                  //параметры запроса
                response: 'text/xml',                                                           //тип возвращаемого ответа text либо xml
                async: true,
                context: this,
                error: this.onError,
                success: this.onSuccess,
                timeout: this.qtimeout
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
            if (this.contentType == 'text/xml' && this.wmts != null)
                this.wmts.xmlDoc = this.responseText;
            if (this.ondataload != null)
                this.ondataload(this.responseText);
        }
    }

    // Обработчик ошибки запроса
    this.onError = function (object, textStatus, errorThrown) {

        var txt = "Request Error. ";
        if (typeof (textStatus) != 'undefined') txt += textStatus + ". ";

        var message = '<?xml version="1.0" encoding="utf-8"?><ExceptionReport version="1.0.0" ' +
                'xmlns="http://www.opengis.net/ows/2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
                'xsi:schemaLocation="http://www.opengis.net/ows/2.0  owsExceptionReport.xsd" >' +
                '<Exception><ExceptionText>' + txt + '</ExceptionText></Exception></ExceptionReport>';

        if (hhr != null)
            if (typeof (this.onDataLoad) != "undefined") this.onDataLoad(message);
            else if (hdr != null)     // для IE
                if (typeof (this.ondataload) != "undefined") this.ondataload(message);
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

    this.getcapabilities = function () {

        if (this.enabled == false || this.mapsrv.length == 0) return;

        var opt = this.qoptions;
        opt.REQUEST = 'GetCapabilities';

        this.sendRequest(opt);
    }

    this.сoveragelist = function (coverageid) {
        if (this.enabled == false || this.mapsrv.length == 0) return;

        var opt = this.qoptions;
        opt.REQUEST = 'DescribeCoverage';
        opt.COVERAGEID = coverageid;

        this.sendRequest(opt);
    }

    this.сoverage = function (coverageoptions) {
        if (this.enabled == false || this.mapsrv.length == 0) return;

        var options;
        if (typeof (coverageoptions) != "object")
            try {
                options = $.parseJSON(coverageoptions);
            }
            catch (e) { alert(e.message); }
        else
            options = coverageoptions;

        if (typeof (options) == 'undefined' || options['covarageid'] == null) return;

        var opt = this.qoptions;
        opt.REQUEST = 'GetCoverage';
        opt.CoverageId = options.covarageid;
        if (options.resolution != null)
            opt.resolution = options.resolution;
        if (options.dimsubsetx != null && options.dimsubsetx.length != 0)
            opt.dimensionsubsetx = options.dimsubsetx;
        if (options.dimsubsety != null && options.dimsubsety.length != 0)
            opt.dimensionsubsety = options.dimsubsety;

        this.sendRequest(opt);
    }
}