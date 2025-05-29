/****************************************** Тазин В.О. 12/03/21  ****
 ************************************* Железнякова Ю.  12/05/20  ****
 ************************************* Помозов Е.В.    18/03/21  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Компонент управления запросами                *
 *                                                                  *
 *******************************************************************/
'use strict';
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};

    /**
     * Компонент управления запросами
     * @class GWTK.gEngine.RequestService
     */
    GWTK.gEngine.RequestService = (function () {


            /**
             * Функция преобразования json-объекта в XmlRpc для подготовки запроса GetFeature
             * @method _getRequestXmlRpc
             * @private
             * @param jsRpc {Array} Массив описаний для xml-запроса по количеству слоев
             * @param mName {String} Имя метода
             * @return {String} XmlRpc-строка для запроса
             */
            function _getRequestXmlRpc(jsRpc, mName) {
                if (!mName)
                    mName = 'GetFeature';
                var request = '<?xml version=\'1.0\' encoding=\'utf-8\'?><methodCall><methodName>' + mName + '</methodName><params><param><value>';

                if (Array.isArray(jsRpc)) {
                    for (var k = 0, jsRpcByLayer; (jsRpcByLayer = jsRpc[k]); k++) {
                        request += '<array><data><value><string>' + jsRpcByLayer['LAYER_ID'] + '</string></value><struct>';
                        for (var key in jsRpcByLayer) {
                            if (jsRpcByLayer[key] === undefined || key === 'LAYER_ID')
                                continue;

                            request += '<member><name>' + key + '</name>' + '<value><string>' + jsRpcByLayer[key] + '</string></value></member>';
                        }
                        request += '</struct></data></array>';
                    }
                } else {
                    jsRpcByLayer = jsRpc;

                    request += '<array><data><value><string>' + jsRpcByLayer['LAYER_ID'] + '</string></value><struct>';
                    for (key in jsRpcByLayer) {
                        if (jsRpcByLayer[key] === undefined || key === 'LAYER_ID')
                            continue;

                        request += '<member><name>' + key + '</name>' + '<value><string>' + jsRpcByLayer[key] + '</string></value></member>';
                    }
                    request += '</struct></data></array>';
                }

                request += '</value></param></params></methodCall>';

                return request;
            }

            var query = {};
            var requestedList = {};
            var count = 0;

            var globalOptions = {};

            /**
             * Функция создания XMLHttp-запроса
             * @method _sendXMLHttpRequest
             * @private
             * @param params {Object} Значение для параметров запросов
             * @return {String} Идентификатор запроса
             */
            function _sendXMLHttpRequest(params) {

                var id = 'request_' + Date.now() + '_' + Math.random();
                if (query[id] !== undefined) {
                    id += '_' + Math.random();
                }

                var xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    delete requestedList[id];
                    params['onload'].call(this);
                };
                xhr.onerror = function () {
                    delete requestedList[id];
                    params['onerror'].call(this);
                };

                xhr.onabort = function () {
                    delete requestedList[id];
                    params['onabort'].call(this);
                };


                xhr.onreadystatechange = params['onreadystatechange'] || function () {
                };

                query[id] = {xhr: xhr, params: params};
                count++;

                return id;
            }

            /**
             * Функция создания XMLHttp-запроса обернутый в Promise
             * @method _sendXMLHttpRequestPromisified
             * @private
             * @param params {Object} Значение для параметров запросов
             * @param promiseHandlers {Object} Объект с обработчиками
             * @return {String} Идентификатор запроса
             */
            function _sendXMLHttpRequestPromisified(params, promiseHandlers) {
                var id = 'request_' + Date.now() + '_' + Math.random();
                if (query[id] !== undefined) {
                    id += '_' + Math.random();
                }

                var xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    delete requestedList[id];
                    params['onload'].call(this);
                    promiseHandlers.resolve();
                };
                xhr.onerror = function () {
                    delete requestedList[id];
                    params['onerror'].call(this);
                    promiseHandlers.reject();
                };

                xhr.onabort = function () {
                    delete requestedList[id];
                    params['onabort'].call(this);
                    promiseHandlers.reject();
                };


                xhr.onreadystatechange = function () {
                    params['onreadystatechange'].call(this);
                };

                query[id] = {xhr: xhr, params: params};
                count++;


                return id;
            }

            /**
             * Получение JSON-объекта из строки
             * @method _getJSON
             * @private
             * @param response {String} Ответ сервера
             * @return {Object} JSON-объект
             */
            function _getJSON(response) {
                var json;
                if (typeof response == 'string') {
                    try {
                        json = JSON.parse(response);
                    } catch (e) {
                        json = null;
                    }
                } else {
                    json = response;
                }
                return json;
            }

            /**
             * Установка ответа исключения
             * @method _setExceptionResponse
             * @private
             * @param mess {String} Сообщение
             * @return {String} XML текст исключения
             */
            function _setExceptionResponse(mess) {

                var str = '<?xml version=\"1.0\" encoding=\"utf-8\"?><ExceptionReport ' +
                    'version="1.0.0" xmlns="http://www.opengis.net/ows/2.0" ' +
                    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
                    'xsi:schemaLocation="http://www.opengis.net/ows/2.0 owsExceptionReport.xsd" ><Exception><ExceptionText>';

                if (typeof (mess) != 'undefined')
                    str += mess;

                str += '</ExceptionText></Exception></ExceptionReport>';

                return str;
            }

            var RequestService = function () {
            };

            RequestService.prototype = {

                /**
                 * настройка параметров сервиса запросов
                 * @method setOptions
                 * @public
                 * @param params {Object} Значение для параметров запросов
                 */
                setOptions: function (params) {
                    for (var k in params) {
                        globalOptions[k] = params[k];
                    }
                },

                /**
                 * Функция составления и отправки запроса для получения информации по объектам
                 * @method requestRestFeature
                 * @public
                 * @param jsRpc {Array} Массив описаний для xml-запроса по количеству слоев
                 * @param params {object} Значение для параметра CUTBYFRAME и обработчик ответа сервера
                 */
                requestRestFeature: function (jsRpc, params) {

                    var options = {'SERVICE': 'WFS', 'RESTMETHOD': 'GetFeature'};
                    var xmldata = _getRequestXmlRpc(jsRpc, options['RESTMETHOD']);
                    var url = params['src'] + '?SERVICE=' + options['SERVICE'] + '&' + 'RESTMETHOD=' + options['RESTMETHOD'];

                    var onloadHandler = typeof params.onload == 'function' ? params.onload : function () {
                    };
                    var onreadystatechangeHandler = typeof params['onreadystatechangeHandler'] == 'function' ? params['onreadystatechangeHandler'] : function () {
                    };
                    var onloadErrorHandler = (typeof params.onerror == 'function') ? params.onerror : function (object, textStatus, errorThrown) {
                        var err = textStatus;
                        if ((textStatus !== errorThrown) && (errorThrown.length > 0))
                            err += '. ' + errorThrown + '.';
                        console.error(_setExceptionResponse(err));
                    };
                    var requestParams = {};
                    // Задать обработчик на завершение асинхронной загрузки
                    requestParams.onload = function () {
                        // Добавляем объекты в массив тайла и в общий массив целых объектов
                        onloadHandler(_getJSON(this.response));
                    };

                    requestParams['onerror'] = onloadErrorHandler;
                    requestParams['onreadystatechange'] = onreadystatechangeHandler;

                    requestParams['src'] = url;
                    requestParams['sync'] = false;
                    requestParams['responseType'] = 'json';
                    requestParams['method'] = 'POST';
                    requestParams['postdata'] = xmldata;

                    return this.requestXHR(requestParams);
                },

                /**
                 * Функция составления и отправки запроса для получения текстуры
                 * @method requestTexture
                 * @public
                 * @param jsRpc {Array|Object} Массив описаний для xml-запроса
                 * @param params {Object} Адрес и обработчик ответа сервера
                 * @param promiseHandlers {Object} Объект с обработчиками
                 */
                requestTexture: function (jsRpc, params, promiseHandlers) {

                    var options = {'RESTMETHOD': 'GET3DTEXTURES'};
                    var xmldata = _getRequestXmlRpc(jsRpc, options['RESTMETHOD']);
                    var url = params['src'] + '?RESTMETHOD=' + options['RESTMETHOD'];

                    var handler = typeof params.onload == 'function' ? params.onload : function () {
                    };
                    var requestParams = {};
                    // Задать обработчик на завершение асинхронной загрузки
                    requestParams.onload = function () {
                        // Добавляем объекты в массив тайла и в общий массив целых объектов
                        handler(this.response);
                    };
                    requestParams['onerror'] = function (object, textStatus, errorThrown) {
                        var err = textStatus;
                        if ((textStatus !== errorThrown) && (errorThrown.length > 0))
                            err += '. ' + errorThrown + '.';
                        console.error(_setExceptionResponse(err));
                    };


                    requestParams['src'] = url;
                    requestParams['sync'] = false;
                    requestParams['responseType'] = 'arraybuffer';
                    requestParams['method'] = 'POST';
                    requestParams['postdata'] = xmldata;

                    return this.requestXHR(requestParams, promiseHandlers);

                },

                /**
                 * Функция составления и отправки запроса для получения текстуры
                 * @method requestMaterial
                 * @public
                 * @param jsRpc {Array|Object} Массив описаний для xml-запроса
                 * @param params {Object} Адрес и обработчик ответа сервера
                 * @param promiseHandlers {Object} Объект с обработчиками
                 */
                requestMaterial: function (jsRpc, params, promiseHandlers) {

                    var options = {'RESTMETHOD': 'GET3DMATERIALS'};
                    var xmldata = _getRequestXmlRpc(jsRpc, options['RESTMETHOD']);
                    var url = params['src'] + '?RESTMETHOD=' + options['RESTMETHOD'];

                    var handler = typeof params.onload == 'function' ? params.onload : function () {
                    };
                    var requestParams = {};
                    // Задать обработчик на завершение асинхронной загрузки
                    requestParams.onload = function () {
                        // Добавляем объекты в массив тайла и в общий массив целых объектов
                        handler(this.response);
                    };
                    requestParams['onerror'] = function (object, textStatus, errorThrown) {
                        var err = textStatus;
                        if ((textStatus !== errorThrown) && (errorThrown.length > 0))
                            err += '. ' + errorThrown + '.';
                        console.error(_setExceptionResponse(err));
                    };


                    requestParams['src'] = url;
                    requestParams['sync'] = false;
                    requestParams['responseType'] = 'arraybuffer';
                    requestParams['method'] = 'POST';
                    requestParams['postdata'] = xmldata;

                    return this.requestXHR(requestParams, promiseHandlers);

                },


                /**
                 * Функция составления и отправки запроса
                 * @method requestSemanticList
                 * @public
                 * @param params {Object} Обработчик ответа сервера
                 */
                requestSemanticList: function (params) {
                    var handler = params.handler,
                        layerId = params.layerId,
                        url = params.serviceURL + '?RestMethod=GetLayerSemanticList&Layer=' + layerId;

                    var requestParams = {};
                    // Задать обработчик на завершение асинхронной загрузки
                    requestParams.onload = function () {
                        if (this.readyState === 4 && this.status === 200) {
                            if (handler instanceof Function) {
                                handler(_getJSON(this.response));
                            }
                        }
                    };
                    requestParams['src'] = url;
                    requestParams['sync'] = false;
                    requestParams['responseType'] = 'json';
                    requestParams['method'] = 'GET';

                    return this.requestXHR(requestParams);
                },

                /**
                 * Запросить описания 3D-объектов по классификатору
                 * @method requestDescObjects3D
                 * @public
                 * @param jsRpc {Array} Массив описаний для xml-запроса
                 * @param params {Object} Обработчик ответа сервера
                 */
                requestDescObjects3D: function (jsRpc, params) {

                    var options = {'SERVICE': 'WFS', 'RESTMETHOD': 'GET3DOBJECTS'};
                    var xmldata = _getRequestXmlRpc(jsRpc, options['RESTMETHOD']);
                    var url = params['serviceURL'] + '?RestMethod=' + options['RESTMETHOD'];


                    if (url.length === 0)
                        return 0;

                    // Идентификатор HTTP-запроса
                    var requestParams = {};
                    // Задать обработчик на завершение асинхронной загрузки
                    requestParams.onreadystatechange = function () {
                        // Ответ получен (4) и он правильный (200)
                        if (this.readyState === 4 && this.status === 200) {
                            // Пытаемся прочитать полученный массив описаний 3D-объектов
                            var arrayBuffer = this.response;
                            if (typeof params.handler == 'function') {
                                params.handler(arrayBuffer, params.layerId, params['serviceURL']);
                            }
                            if (arrayBuffer == null) {
                                return 0;
                            }
                        }
                        return 1;
                    };
                    requestParams['src'] = url;
                    requestParams['sync'] = false;
                    requestParams['responseType'] = 'arraybuffer';

                    if ((typeof (xmldata) == 'undefined') || (xmldata == null) || (xmldata.length === 0)) {
                        requestParams['method'] = 'GET';
                    } else {
                        requestParams['method'] = 'POST';
                        requestParams['postdata'] = xmldata;
                    }

                    return this.requestXHR(requestParams);
                },


                /**
                 * Запросить описания 3D-объектов по классификатору без карты
                 * @method requestDescObjects3DByClassifier
                 * @public
                 * @param jsRpc {Array} Массив описаний для xml-запроса
                 * @param params {Object} Обработчик ответа сервера
                 */
                requestDescObjects3DByClassifier: function (jsRpc, params) {

                    var options = {'SERVICE': 'WFS', 'RESTMETHOD': 'GET3OBJECTSBYCLASSIFIER'};
                    // var xmldata1 = _getRequestXmlRpcByClassifier(jsRpc, options['RESTMETHOD']);
                    var xmldata = _getRequestXmlRpc(jsRpc, options['RESTMETHOD']);
                    var url = params['serviceURL'] + '?RestMethod=' + options['RESTMETHOD'];


                    if (url.length === 0)
                        return 0;

                    // Идентификатор HTTP-запроса
                    var requestParams = {};
                    // Задать обработчик на завершение асинхронной загрузки
                    requestParams.onreadystatechange = function () {
                        // Ответ получен (4) и он правильный (200)
                        if (this.readyState === 4 && this.status === 200) {
                            // Пытаемся прочитать полученный массив описаний 3D-объектов
                            var arrayBuffer = this.response;
                            if (typeof params.handler == 'function') {
                                params.handler(arrayBuffer, params.classifiername, params['serviceURL']);
                            }
                        }
                        return 1;
                    };
                    requestParams['src'] = url;
                    requestParams['sync'] = false;
                    requestParams['responseType'] = 'arraybuffer';

                    if ((typeof (xmldata) == 'undefined') || (xmldata == null) || (xmldata.length === 0)) {
                        requestParams['method'] = 'GET';
                    } else {
                        requestParams['method'] = 'POST';
                        requestParams['postdata'] = xmldata;
                    }

                    return this.requestXHR(requestParams);
                },

                /**
                 * Стандартный запрос
                 * @method requestXHR
                 * @public
                 * @param params {Object} Параметры запроса
                 * @param [promiseHandlers] {Object} Объект с обработчиками
                 */
                requestXHR: function (params, promiseHandlers) {
                    var requestParams = {};
                    for (var k in params) {
                        requestParams[k] = params[k];
                    }
                    // Задать обработчик на завершение асинхронной загрузки
                    requestParams['onload'] = params['onload'] || function () {
                    };
                    requestParams['onerror'] = params['onerror'] || function () {
                    };
                    requestParams['onabort'] = params['onabort'] || function () {
                    };
                    requestParams['onreadystatechange'] = params['onreadystatechange'] || function () {
                    };

                    requestParams['sync'] = params['sync'] || false;

                    if (promiseHandlers == null) {
                        return _sendXMLHttpRequest(requestParams);
                    } else {
                        return _sendXMLHttpRequestPromisified(requestParams, promiseHandlers);
                    }
                },

                /**
                 * Отменить запрос
                 * @method abortXHR
                 * @public
                 * @param requestId {String} Идентификатор запроса
                 */
                abortXHR: function (requestId) {
                    if (query[requestId] !== undefined) {
                        delete query[requestId];
                        count--;
                    } else {
                        if (requestedList[requestId] !== undefined) {
                            var request = requestedList[requestId];
                            request.xhr.abort();
                            delete requestedList[requestId];
                        }
                    }
                },

                /**
                 * Отменить запросы
                 * @method abortAllRequests
                 * @public
                 */
                abortAllRequests: function () {
                    for (var k in query) {
                        delete query[k];
                        count--;
                    }
                    for (k in requestedList) {
                        var request = requestedList[k];
                        request.xhr.abort();
                        delete requestedList[k];
                    }
                },

                /**
                 * Отправить запросы из очереди
                 * @method sendRequest
                 * @public
                 * @param cnt {Number} Количество запросов если !cnt, то отправляется вся очередь
                 */
                sendRequest: function (cnt) {
                    if (!cnt) {
                        cnt = count;
                    }
                    for (var k in query) {
                        if (cnt-- <= 0) {
                            break;
                        }
                        var request = query[k];
                        count--;
                        delete query[k];
                        var params = request.params;

                        if (window.navigator.onLine) {
                            var xhr = request.xhr;
                            if (!xhr.aborted) {
                                xhr.open(params['method'], params['src'], !params['sync']);
                                xhr.responseType = params['responseType'];

                                var authFlag = false;
                                if (Array.isArray(globalOptions.pamUrls)) {
                                    for (var i = 0; !authFlag && i < globalOptions.pamUrls.length; i++) {
										if (params['src'].indexOf(globalOptions.pamUrls[i].url) !== -1) {
                                            authFlag = true;
                                        }
                                    }
                                }
								
                                if (authFlag || (globalOptions['extauth'] && params['src'].indexOf(globalOptions.url) !== -1)) {
                                    // внешняя авторизация
                                    xhr.withCredentials = true;
                                } else if (globalOptions['token']) {
                                    var token = globalOptions['token'];                       // авторизация токеном
                                    xhr.setRequestHeader(GWTK.gEngine.AUTH_TOKEN, token);
                                }

                                xhr.send(params['postdata']);
                                requestedList[k] = request;
                            }
                        } else {
                            if (typeof params['onerror'] === 'function') {
                                params['onerror']();
                            }
                        }
                    }
                }
            };

            return new RequestService();
        }
    )();
}
