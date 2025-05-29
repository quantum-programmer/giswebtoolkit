/************************************* Нефедьева О.А. 13/01/21 *****
************************************** Помозов Е.В.   27/04/21 *****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2022              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                      Wfs запросы объектов                        *
*                                                                  *
*******************************************************************/

if (window.GWTK) {

    /**
     * @Class GWTK.WfsRestRequests - Wfs запросы объектов по XmlRpc-протоколу
     * @Constructor WfsRestRequests
     * @param map {Object} компонент карты
    */
    GWTK.WfsRestRequests = function (map) {
        this.map = map;
        this.enabled = false;
        if (!this.map) {
            console.log("WfsRestRequests. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.enabled = true;
        this.canCancel = true;
        this.responses = "";
        this.responseError = "";
        this.init();
        return;
    };
    GWTK.WfsRestRequests.prototype = {
        /**
         * Инициализация класса
         * @method init
         */
        // ===============================================================
        init: function () {
            var zeroResp = '<?xml version="1.0" encoding="utf-8"?>' + '<wfs:FeatureCollection numberMatched="0" numberReturned="0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
                           'xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns="http://www.w3.org/2001/XMLSchema" xmlns:xlink="http://www.w3.org/1999/xlink" >' +
                           '</wfs:FeatureCollection>';
            this.notFoundDocument = $.parseXML(zeroResp);
            return;
        },

        /**
         * Выполнить Rest метод (Wfs запрос)
         * @method restMethod
         * @param method {String} имя REST метода
         * @param urlparam {String} параметры метода в строке запроса
         * @param data {XmlString} данные для метода
         * @param callback {Function} функция обратного вызова
         * @return {Boolean} `true`- запрос отправлен, `false` - нет
         * Выполнение отклоняется, если ожидается ответ предыдущего запроса
         */
        // ===============================================================
        restMethod: function (method, urlparam, data, callback, viewfilter) {
            if (!urlparam || !method) {
                console.log("WfsRestRequests.restMethod " + w2utils.lang("Not defined a required parameter") + " method or urlparam.");
                return false;
            }
            if (!this.canCancel || !this.enabled) {
                return false;
            }

            var urls = this.getUrls(method, urlparam, data, viewfilter);

            this.postRequestMulti(urls, callback);

            return true;
        },

        /**
         * Выполнить Rest метод (Wfs запрос)
         * @method restMethodRpc
         * @param method {String} имя REST метода
         * @param urlparam {String} параметры метода в строке запроса
         * @param rpclayersparam {Array} параметры метода для rpc-запроса (по слоям)
         * @param callback {Function} функция обратного вызова
         * @param fdata {Object} JSON, данные контекста выполнения rest-метода
         * @return {Boolean} `true`- запрос отправлен, `false` - нет
         */
        // ===============================================================
        restMethodRpc: function (method, urlparam, rpclayersparam, callback, fdata) {

            if (!this.map) { return false; }

            if (!urlparam || !method || !rpclayersparam || urlparam.length == 0) {
                console.log("WfsRestRequests.restMethodRpc " + w2utils.lang("Not defined a required parameter") + " method or urlparam.");
                return false;
            }
            if (urlparam.indexOf('finddirection') == -1 && urlparam.indexOf('idlist') == -1){
                urlparam += "&finddirection=1";
            }
            var url = urlparam, i, j,
                urls = [];
            if (urlparam.charAt(0) != '?') {
                url = '?' + url;
            }
            var servers = this.map.tiles.getSelectableServers();
            if (servers.length == 0) {
                console.log('WfsRestRequests - ' + method + '  ' + w2utils.lang('There are no available map layers to perform the operation'));
                $(this.map.eventPane).trigger({ "type": "featureinforefreshed" });
                if ($.isFunction(callback)) {
                    callback([this.notFoundDocument]);
                }
                return;
            }

            // ищем сервер для слоя из параметров
            for (j = 0; j < rpclayersparam.length; j++) {
                var srv = false;
                for (i = 0; i < servers.length; i++) {
                    if ($.inArray(rpclayersparam[j].layerid, servers[i].layerid) > -1) {
                        srv = servers[i].srv; break;
                    }
                }
                if (!srv) continue;
                var rpctext = GWTK.Util.url2xmlRpcEx(urlparam, method, [rpclayersparam[j]]);
                if (!rpctext) { continue; }

                urls.push({
                    "url": srv + "?SERVICE=WFS&RESTMETHOD=" + method, "text": rpctext,
                    "token": this.accessToken(rpclayersparam[j].layerid)
                });
            }

            if (urls.length == 0) {
                console.log('WfsRestRequests - ' + method + '  ' + 'Нет доступных слоев карты для выполнения операции');
                $(this.map.eventPane).trigger({ "type": "featureinforefreshed" });
                if ($.isFunction(callback)) {
                    callback([this.notFoundDocument]);
                }
                return;
            }

            this.postRequestMulti(urls, callback, fdata);
        },

        /**
         * Получить параметры запросов операции для xmlRpc по серверам
         * @method getUrls
         * @param method {String} имя REST метода
         * @param urlparams {String} параметры метода в строке запроса
         * @param data {String} данные для метода
         * @return {Array} массив объектов вида {"url":запрос,"text": rpctext}
         */
        // ===============================================================
        getUrls: function (method, urlparams, data, viewfilter) {

            if (!urlparams || !method) {
                console.log("WfsRestRequests.getUrls " + w2utils.lang("Not defined a required parameter") + " method or param.");
                return [];
            }
            var urlparam = urlparams;
            if (urlparam.indexOf('finddirection') == -1 && urlparam.indexOf('idlist') == -1){
                urlparam += '&finddirection=1';
            }
            if (viewfilter){
                var scale = this.map.getZoomScale(this.map.getZoom());
                if (scale) {
                    urlparam += '&objectviewscale=' + parseInt(scale);
                }
            }
            var urls = [],
                url = urlparam;
            if (urlparam.length > 0) {
                if (urlparam.charAt(0) != '?') {
                    url = '?' + url;
                }
            }

            var ignoreEndToEndNumbering = (urlparam.indexOf('ignoreEndToEndNumbering') !== -1);

            // Список адресов серверов и идентификаторов их слоев для получения данных
            var servers = this.map.tiles.getSelectableServers(viewfilter, ignoreEndToEndNumbering);
            if (servers.length == 0) {
                return [];
            }
            var data_array = undefined;
            if (data) data_array = [data];
            for (i = 0; i < servers.length; i++) {
                var xtext = GWTK.Util.url2xmlRpcEx(url, method, servers[i].rpclayerslist, data_array);
                if (!xtext) { continue; }
                var token = false;
                if ($.isArray(servers[i].layerid)) {
                    token = this.accessToken(servers[i].layerid[0]);
                }
                urls.push({ "url": servers[i].srv + "?SERVICE=WFS&RESTMETHOD=" + method,
                            "text": xtext, "token":token });
            }

            return urls;
        },

        /**
         * Формировать параметры запросов операции xmlRpc для одного слоя
         * @method getUrl
         * @param method {String} имя REST метода
         * @param urlparam {String} параметры метода в строке запроса
         * @param rpclayer {JSON} параметры слоя для запроса xmlRpc
         * @param data {String} Xml данные для метода
         * @return {JSON} объект вида {"url":запрос,"text": rpctext}
         */
        // ===============================================================
        getUrl: function (method, urlparam, rpclayer, data) {
            if (!urlparam || !method || typeof rpclayer == "undefined") {
                console.log("WfsRestRequests.getUrl " + w2utils.lang("Not defined a required parameter") + " method or param.");
                return false;
            }
            if (typeof rpclayer.server === "undefined") {
                console.log("WfsRestRequests.getUrl " + w2utils.lang("Not defined a required parameter") + " rpclayer.");
                return false;
            }
            if (urlparam.indexOf('finddirection') == -1 && urlparam.indexOf('idlist') == -1){
                urlparam += "&finddirection=1";
            }
            var data_array = undefined;
            if (typeof data !== "undefined") {
                if ($.isArray(data)) {
                    data_array = data;
                }
                else data_array = [data];
            }

            var xtext = GWTK.Util.url2xmlRpcEx(urlparam, method, [rpclayer], data_array);

            if (typeof xtext == "string" && xtext.length > 0) {
                return {
                    "url": rpclayer.server + "?SERVICE=WFS&FORMAT=text/xml&RESTMETHOD=" + method,
                    "text": xtext,
                    "token": this.accessToken(rpclayer.layerid)
                };
            }
            return false;
        },

        /**
         * Получить токен авторизованного доступа по id слоя
         * @method accessToken
         * @param layerid {String} идентификатор слоя на сервисе
         * @return {String/Boolean} токен / `false` - токен отсутствует
         */
        // ===============================================================
        accessToken: function (layerid) {
            var lay = this.map.tiles.getLayerByIdService(layerid);
            if (lay === '' || !lay.options.token) {
                return false;
            }
            return this.map.getToken();
        },

        /**
         * Выполнить Rest метод по списку параметров
         * @method restMethodByList
         * функция отпраляет отдельный запрос к каждому слою из списка
         * @param method {String} имя REST метода
         * @param urlparam {String} параметры метода в строке запроса
         * @param rpclayersparam {Array} список параметров метода для rpc-запроса по слоям
         * @param callback {Function} функция обратного вызова
         * @param data {Array} массив JSON, данные контекста выполнения rest-метода по слоям
         * @return {Boolean} `true`- запрос отправлен, `false` - ошибки
         */
        // ===============================================================
        restMethodByList: function (method, urlparam, rpclayersparam, callback, data) {

            if (!this.map) { return false; }

            if (!urlparam || !method || !rpclayersparam || urlparam.length == 0) {
                console.log("WfsRestRequests.restMethodByList " + w2utils.lang("Not defined a required parameter") + " method or urlparam.");
                return false;
            }
            var urls = [],
                i, len,
                url = urlparam;
            if (urlparam.length > 0) {
                if (urlparam.charAt(0) != '?') {
                    url = '?' + url;
                }
            }

            for (i = 0; len = rpclayersparam.length, i < len; i++) {
                var lu = this.getUrl(method, url, rpclayersparam[i], data);
                if (lu) {
                    urls.push(lu);
                }
            }

            if (urls.length > 0) {
                this.postRequestMulti(urls, callback, data);
                return true;
            }

            return false;
        },

        /**
         * Выполнить запрос операции по xmlRpc
         * @method postRequestMulti
         * @param urls {Array} массив объектов вида {"url":запрос,"text": rpctext}
         * @param func {Function} callback-функция для анализа данных
         * @param fdata {Object} JSON, данные контекста выполнения rest-метода
         * @return {Array} массив объектов вида {"url":запрос,"text": rpctext}
         */
        // ===============================================================
        postRequestMulti: function (urls, func, fdata) {

            if (!$.isArray(urls) || urls.length == 0) {
                console.log("WfsRestRequests.postRequest " + w2utils.lang("Not defined a required parameter") + " urls.");
                return false;
            }
            this.canCancel = false;

            var map = this.map,
                responseData = [],                // массив ответов
                responseError = [],               // массив url, где возникли ошибки
            total_count = urls.length,            // число запросов общее
            error_count = 0;
            var callback = GWTK.Util.bind(this.dataLoad, this),
                fdata = fdata,
                handler = func;
            if (!$.isFunction(func)) handler = null;
            // параметры ajax-запроса
            var options = {
                crossDomain: true,
                processData: false,
                type: "POST",
                data: '',
                response: 'text/xml', dataType: 'xml'
            },
               serviceUrl = this.map.options.url;

            if (urls[0].text.indexOf('OUTTYPE') > -1) {
                options.response = options.dataType = "json";
            }

            var notFound = this.notFoundDocument;

            if (this.map && this.map.options.extauth) {
                var withCredentials = true;                                     // внешняя авторизация на сервисе
            }

            $.support.cors = true;

            // отправляем запросы серверам
            $.map(urls, function (url) {
                var setting = $.extend({},options);
                setting.data = url.text;
                setting.url = url.url;
                if (url.token) {
                    setting.beforeSend = function(xhr) {
                        xhr.setRequestHeader(GWTK.AUTH_TOKEN, url.token);
                    }
                }
                else{
                    var server = GWTK.Util.getServerUrl(url.url);
                    if (map.authTypeExternal(server) || map.authTypeServer(server)){
                       setting.xhrFields = { withCredentials: true };
                    }
                }

                var promise = $.ajax(setting);

                return promise.then(
                 function (result) {
                    if (result.documentElement.nodeName.indexOf('FeatureCollection') > -1) {
                         responseData.push(result);                               // сохраняем правильный ответ
                    } else {                                                      // fix ответов сервиса
                         var isFile = $(result).find('string').text();
                         if (isFile.length > 0) {
                             responseData.push(result);
                         }
                         else {
                             responseData.push(notFound);                              // добавляем notFound документ
                         }
                         if (promise.responseText) {
                             if (promise.responseText.indexOf('ObjectsNotFound') == -1) {
                                 console.log(result);
                             }
                         }
                     }

                     if (result.documentElement.nodeName.indexOf('RestMethod') > -1) {
                        responseData = [];
                        responseData.push(result);
                     }

                     if (total_count <= (responseData.length + error_count)) {
                         callback(responseData, responseError, total_count, handler, fdata);
                     }
                     return 1;
                 },
                function (error) {                                                  // failed, ошибка
                    error_count++;
                    var msg = w2utils.lang('Failed to get data');
                    console.log(msg + '  ' + this.url);
                    console.log(error);
                    if (responseError == null) {
                        responseError = [];
                    }
                    responseError.push({ "text": msg, "data": this.url });          // сохраняем ошибочные ответы
                    if (total_count <= (responseData.length + error_count)) {
                        callback(responseData, responseError, total_count, handler, fdata);
                    }
                });
            });
            return;
        },

        /**
         * Загрузка данных объектов в карту
         * @method dataLoad функция заполняет selectedFeatures карты данными полученных объектов
         * @param responses {Array} массив правильных ответов (объектов wfs:FeatureCollection)
         * @param errors {Array} массив адресов серверов, где произошла ошибка
         * @param totalcount {Number} число отправленных запросов
         * @param func {Function} callback-функция получения ответа
         * @param fdata {Object} JSON, данные контекста выполнения rest-метода
         */
        // ===============================================================
        dataLoad: function (responses, errors, totalcount, func, fdata) {

            if (!totalcount || !responses || (responses && responses.length == 0)) {                     // сообщаем об ошибках
                if (func) {
                    var exception = $.parseXML(setExceptionResponse(w2utils.lang("Failed to get data")));
                    func([exception], 'exception');
                    console.log("GWTK.WfsRestRequests.dataLoad. " + w2utils.lang("Failed to get data"));
                    if (errors){
                        console.log(errors);
                    }

                }
                else {
                    console.log("GWTK.WfsRestRequests.dataLoad. " + w2utils.lang("Failed to get data"));
                }

                this.canCancel = true;
                if (this.map) {
	                $(this.map.eventPane).trigger({ "type": "featureinforefreshed" });
                }

                return;
            }

            this.responses = responses;

            // заполнить данные объектов
            this.setSelectedFeatures(fdata);

            this.canCancel = true;

            // вызвать callback
            if ($.isFunction(func)) func(this.responses);

            return;
        },

        /**
        * Сохранить данные объектов в класс отобранных объектов selectedFeatures
        * @method setSelectedFeatures
        * @param context {Object} JSON, данные контекста выполнения rest-метода.
        * Передаются в объект события "featureinforefreshed" для анализа в его обработчике.
        * Функция не очищает selectedFeatures перед записью данных!
        */
        // ===============================================================
        setSelectedFeatures: function (context) {

            if (!this.map || !this.map.objectManager || !this.responses || this.responses.length == 0) {
                return;
            }
            if (!this.map.objectManager.selectedFeatures) { return; }
            var selectedFeatures = this.map.objectManager.selectedFeatures;

            // ответ xml или json ?
            if ((this.responses[0] instanceof XMLDocument) == false) {
                this.setSelectedFeaturesJson();
                return;
            }


            // заполняем из xml
            var i, j, len = this.responses.length,
                total = 0, isFile = [];
            for (i = 0; i < len; i++) {
                var xmldoc = this.responses[i];
	            var members = $( xmldoc.documentElement ).find('wfs\\:member');
	            if (!members.length) {
		            members = $( xmldoc.documentElement ).find( 'member' );
	            }
	            if (!members.length) {
	                continue;
	            }
	            if (!isFile.length) {
	                isFile = $(xmldoc).find('string').text();
	                if (isFile.length > 0) {
	                    continue;
	                }
	            }
                for (j = 0; j < members.length; j++) {
                    var gid = $(members[j].firstChild).attr("gml:id");
                    var layer = $(members[j]).find("MapID").text();
                    if ((gid && gid.length > 0) && (layer && layer.length > 0)) {
                        if (layer.indexOf("#") != -1) {
                            layer = encodeURIComponent(layer);
                        }
                        var mapobject = selectedFeatures.addXmlElem(gid, layer, members[j].firstChild);
                        mapobject.saveJSON();
                         total++;
                }
            }
            }

            if (isFile.length > 0) {
                w2alert(w2utils.lang("Too many objects selected on request! Change your request."));
            }
            if (total > 0) {
                $(this.map.eventPane).trigger({ "type": "featureinforefreshed", "layers": selectedFeatures.layers, "rest_context": context, "centering": this.centering });
            }
            else {
                $(this.map.eventPane).trigger({ "type": "featureinforefreshed" });
            }

            return total;
        },

        setSelectedFeaturesJson: function () {
            //console.log('Function setSelectedFeaturesJson is not defined !');
        }

    };

}