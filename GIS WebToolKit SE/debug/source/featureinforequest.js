/**************************************** Нефедьева О. 22/09/20 ****
***************************************** Соколова Т.О.28/07/20 ****
***************************************** Помозов Е.В. 29/06/20 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*               Запрос объектов по координатам точки               *
*                                                                  *
*******************************************************************/

if (window.GWTK) {

    /**
      * Запрос объектов в точке по wmts-протоколу
      * @param map {Object}  компонент карты
    */
    GWTK.FeatureInfoRequest = function (map) {
        this.map = map;
        if (!this.map) {
            console.log("FeatureInfoRequest." + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this._point = null;
        this.enabled = true;
        this.responses = "";
        this.objlocal = "0,1,2,4";
        this.metric = "1";
        this.semantic = "1";

        this.init();
        return;
    };

    GWTK.FeatureInfoRequest.prototype = {
        /**
         * Инициализация класса
         * @method init
        */
        // ===============================================================
        init: function () {
            if (!this.map) return;
            this.defaultcount = 100;
            return;
        },

        /**
         * Запросить параметры операции getFeatureInfo
         * @method getParam
         * @param count максимальное число объектов в ответе сервера
         * @return {Object} параметры
        */
        // ===============================================================
        getParam: function (count) {
            if (!this._point) {
                return false;
            }
            
            var param = {
                "layer": "", "tilematrixset": "", "style": "default", "mapid": "1", "area": "1", "length": "1","metric": "1",
                "format": "image/jpg", "tilematrix": "0", "tilerow": 0, "tilecol": 0, "info_format": "text/xml", "i": 0, "j": 0, "objlocal": this.objlocal,
                "feature_count":"1", "semantic": "1", "semanticname": "1", "objcenter":"2", "outcrs":4326, "finddirection":1, "GETFRAME" : 1,
                "getsld":1, "getframe": 1};

            if([ 'xs', 'sm'].indexOf(GWTK.Util.getDeviceScreenSize()) !== -1) {
				// для мобильных устройств
				param.AREAPIXEL = 20;
            }
            
            var mflag;
            if ($.isNumeric(this.metric)) {
                mflag = parseInt(this.metric);
                if (mflag === 0 || mflag === 1){
                    param.metric = this.metric;
                }
            }
            if ($.isNumeric(this.semantic)) {
                mflag = parseInt(this.semantic);
                if (mflag === 0 || mflag === 1){
                    param.semantic = this.semantic;
                }
            }

            var place = this.map.tiles.getLayersPointTile(this._point);

            param.tilematrixset = this.map.options.tilematrixset;
            param.tilematrix = this.map.options.tilematrix;
            param.tilerow = place[1];
            param.tilecol = place[0];
            param.i = place[2];
            param.j = place[3];
            if (!count)
                param.feature_count = this.defaultcount;
            else
                param.feature_count = count;

            var scale = this.map.getZoomScale(this.map.options.tilematrix);
            if ($.isNumeric(scale)) {
                param.objectviewscale = parseInt(scale);
            }
            return param;
        },

        /**
         * Запросить параметры операции getFeatureInfo для Wms
         * @method getParamWms
         * @param count максимальное число объектов в ответе сервера
         * @return {Object} параметры
         */
        // ===============================================================
        getParamWms: function (count) {
            if (!this._point) {
                return false;
            }
            var bbox = this.map.getWindowBounds();
            var sbbox = bbox.min.toString() + "," + bbox.max.toString(),
                wh = this.map.getWindowSize();
            var epsg="EPSG:" + this.map.options.crs;
            var param = {
                "service":"WMS",
                "layer": "",
                "styles": "default",
                "mapid": "1",
                "area": "1",
                "length": "1",
                "format": "image/png",
                "info_format": "text/xml",
                "bbox":sbbox,
                "crs":epsg,
                "width":wh[0],
                "height":wh[1],
                "i":this._point.x,
                "j":this._point.y,
                "objlocal": this.objlocal,
                "feature_count": "1",
                "semantic": "1",
                "semanticname": "1",
                "objcenter": "2"
            };
            if (!count)
                param.feature_count = this.defaultcount;
            else
                param.feature_count = count;
            if (this.map.options.objectpanel) {
                param.OUTTYPE = 'JSON';
            }
            return param;
        },
        /**
          * Получить информацию об объектах карты по координатам точки
          * @method getFeatureInfo
          * @param point {GWTK.Point} координаты точки в окне карты (x,y), пикселы
         */
        // ===============================================================
        getFeatureInfo: function (point, count, func) {

            if (!point || point instanceof GWTK.Point == false || !this.map) {
                return false;
            }

            if (!this.enabled) { return false; }

            // доступные для запроса слои карты
            var list = this.map.tiles.getSelectableLayersEx();
            if (list.length == 0) {
                return false;
            }

            this._point = point;
            // сбросить ответ
            this.responses = "";

            var param = this.getParam(count);
            if (!param) { return false; }
            // формируем параметры запроса (по серверам)
            var i, len = list.length,
                rpclayerslist = [], srvs = [],
                graphiclayers = [];

            for (i = 0; i < len; i++) {
                var objlay = this.map.tiles.getLayerByxId(list[i].id);
                if (!objlay) continue;

                if (objlay.getType() == 'svg' || objlay.getType() == 'geomarkers') { // графический слой пропустим
                    graphiclayers.push(objlay);
                    continue;
                }

                var srv = objlay.options.url;
                var question = objlay.options.url.indexOf("?"),
                    el;
                if (question > -1) {
                    srv = srv.slice(0, question);
                    el = null;
                    for (var n = 0; n < srvs.length; n++) {
                        if (srvs[n].srv == srv && !objlay.options.areapixel) {
                            el = srvs[n];
                            break;
                        }
                    }
                }

                var rpclayer = {}, idLayer = objlay._idLayerXml();
                rpclayer.layerid = idLayer;
                if (objlay.typeNames)
                    rpclayer.typenames = objlay.typeNames;
                if (objlay.codeList)
                    rpclayer.codelist = objlay.codeList;

                if (!el) {
                    var elem = { "srv": srv, "wmtsId": [idLayer], "rpclayerslist": [rpclayer]};
                    if (objlay.options.areapixel !== undefined){
                        elem['areapixel'] = objlay.options.areapixel;
                    }
                    srvs.push(elem);
                }
                else {
                    el.wmtsId.push(idLayer);                                // список id слоев сервера
                    el.rpclayerslist.push(rpclayer);
                }

            }

            if (srvs.length == 0) {
                if (graphiclayers.length == 0)
                    return false;
                else {
                    GWTK.Util.clearselectedFeatures(this.map);
                    GWTK.graphicLayer.prototype.fillSelectedFeatures(this.map, this.map.objectManager.selectedFeatures);
                    $(this.map.eventPane).trigger({ "type": "featureinforefreshed", "layers": this.map.objectManager.selectedFeatures.layers, "centering": 0  });
                    return true;
                }
            }

            var url = "";
            for (var key in param) {
                if (key.toLowerCase() == "layer" || key.toLowerCase() == "layers") continue;
                url += "&" + key + "=" + param[key];
            }
            
            url = '?' + url.slice(1);

            var urls = [], xtext;
 
            for (i = 0; i < srvs.length; i++) {
                param.layers = srvs[i].rpclayerslist;
                if (srvs[i].areapixel){
                    xtext = GWTK.Util.url2xmlRpcEx(url + "&areapixel="+srvs[i].areapixel, "GetFeatureInfo", param.layers);
                }
                else{
                    xtext = GWTK.Util.url2xmlRpcEx(url, "GetFeatureInfo", param.layers);
                }
                if (!xtext) { continue; }
                urls.push({
                    "url": srvs[i].srv + "?SERVICE=WMTS&RESTMETHOD=GetFeatureInfo",
                    "text": xtext,
                    "authtype":this.map.tiles.authTypePAM(param.layers[0].layerid),
                    "token": GWTK.Util.accessToken(this.map, param.layers[0].layerid)
                });
            }
            if (urls.length == 0) {
                return false;
            }

            GWTK.Util.showWait();

            this.doPromisePost(urls, func);

            return true;
        },

        /**
          * Oбработчик ответа операции getFeatureInfo
          * @method onGetFeatureInfo
          * @param responses {Array} массив правильных ответов серверов
          * @param errors {Array} массив адресов серверов, где произошла ошибка
          * @param totalcount {Number} число отправленных запросов
          * @param func {Function} callback-функция получения ответа сервера
         */
        // ===============================================================
        onGetFeatureInfo: function (responses, errors, totalcount, func) {

            var selectedFeatures = this.map.objectManager.selectedFeatures;
            selectedFeatures.clear();

            if ((!responses && !errors) || (responses && responses.length == 0)) {                     // сообщаем об ошибках
                if (func) {
                    func(setExceptionResponse(w2utils.lang("Failed to get data")));
                    console.log("GWTK.FeatureInfoRequest --> getFeatureInfo. " + w2utils.lang("Failed to get data"));
                    if (errors){
                        console.log(errors);
                    }

                }
                else {
                    console.log("GWTK.FeatureInfoRequest --> getFeatureInfo. " + w2utils.lang("Failed to get data"));
                }

                this.enabled = true;

                // Добавить объекты локальных слоев
                GWTK.graphicLayer.prototype.fillSelectedFeatures(this.map, this.map.objectManager.selectedFeatures);

                if (this.map) {
                    $(this.map.eventPane).trigger({ "type": "featureinforefreshed", "layers": this.map.objectManager.selectedFeatures.layers,  "centering": 0  });
	            }
                GWTK.Util.hideWait();
                return;
            }
            
            this.responses = responses;

            this.enabled = true;

            this.fillSelectedFeatures();

            if (func) func(responses, true);
 
            GWTK.Util.hideWait();

            return;
         },

        /**
          * Выполнить запрос информации об объектах карты по координатам точки
          * @method doPromisePost
          * @param urls {Array} массив объектов { "url": адрес сервера, "text": xml параметры запроса }
          * @param func {Function} callback-функция получения ответа сервера
         */
        // ===============================================================
        doPromisePost: function (urls, func) {
            if (!urls || !urls.length) {
                return false;
            }

            this.enabled = false;

            var _map = this.map,
            responseData = [],                  // массив ответов
            responseError = null,                 // массив url, где возникли ошибки
            total_count = urls.length,            // число запросов общее
            error_count = 0;
            var callback = GWTK.Util.bind(this.onGetFeatureInfo, this),
                handler = func;
            // параметры ajax-запроса
            var options = {
                crossDomain: true,
                processData: false, type: "POST",
                data: '', response: 'text/xml', dataType: 'xml'
            };
            
            $.support.cors = true;
            
            // отправляем запросы
            $.map(urls, function (url) {
                var setting = $.extend({}, options);
                setting.data = url.text;
                setting.url = url.url;
                if (_map.authTypeExternal(url.url) || url.authtype) {
                    setting.xhrFields = {withCredentials: true};
                }
                if (url.token) {
                    setting.beforeSend = function (xhr) {
                        xhr.setRequestHeader(GWTK.AUTH_TOKEN, url.token);
                    }
                }
                var promise = $.ajax(setting);
                return promise.then(
                 function (result) {                                              // Ok, пришел ответ
                     //console.log(result.documentElement.nodeName);
                     if (result.documentElement.nodeName.indexOf('FeatureCollection') > -1) {
                         responseData.push(result);                               // сохраняем ответ
                     }
                     else {
                         error_count++;
                         console.log(result);
                     }
                     if (total_count <= (responseData.length + error_count)) {
                         callback(responseData, responseError, total_count, handler);
                     }
                     return 1;
                 },
                function (error) {                                                // failed, ошибка
                    error_count++;
                    var msg = w2utils.lang('Failed to get data');
                    console.log(msg + '  ' + this.url);
                    console.log(error);
                    if (responseError == null) {
                        responseError = [];
                    }
                    responseError.push({ "text": msg, "data": this.url });        // сохраняем ошибочные ответы
                    if (total_count <= (responseData.length + error_count)) {
                        callback(responseData, responseError, total_count, handler);
                    }
                    return;
                });
            });
            return;
        },

        /**
         * Заполнить список отобранных объектов
         * @method fillSelectedFeatures
         * функция заполняет из ответа сервера список объектов в GWTK.ObjectManager
        */
        // ===============================================================
        fillSelectedFeatures: function () {
            if (!this.map || !this.map.objectManager || !this.responses || this.responses.length == 0) {
                return;
            }
            if (!this.map.objectManager.selectedFeatures) { return; }
            var selectedFeatures = this.map.objectManager.selectedFeatures;
            
            GWTK.Util.clearselectedFeatures(this.map);


            // Добавить объекты локальных слоев
            GWTK.graphicLayer.prototype.fillSelectedFeatures(this.map, this.map.objectManager.selectedFeatures);

            var i, j, len = this.responses.length;
            for (i = 0; i < len; i++) {
                var xmldoc = this.responses[i];
	            var members = $( xmldoc.documentElement ).find('wfs\\:member');
	            if (!members.length) {
		           members = $(xmldoc.documentElement).find('member');
	            }
	            if (!members.length) continue;
	            var count = members.length - 1;
	            for (j = count; j >= 0; j--) {
                    var gid = $(members[j].firstChild).attr("gml:id");
                    var layer = $(members[j]).find("MapID").text();
                    if (layer.indexOf("#") != -1) {
                        layer = encodeURIComponent(layer);
                    }
                    if ((gid && gid.length > 0) && (layer && layer.length > 0)) {
                        selectedFeatures.addXmlElem(gid, layer, members[j].firstChild);
                        selectedFeatures.addselect(gid, layer);
                    }
                }
            }
            if (selectedFeatures.mapobjects.length > 0) {
                selectedFeatures.mapobjects.sort(selectedFeatures.compare);
            }

            $(this.map.eventPane).trigger({ "type": "featureinforefreshed", "layers": selectedFeatures.layers, "centering": 0 });

            return;
        }

    }
}