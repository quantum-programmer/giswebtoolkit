/****************************************** Тазин В.О. 14/01/21  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Вспомогательные функции 3D режима                  *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {

    GWTK.gEngine = GWTK.gEngine || {};

    GWTK.gEngine.GLOBAL_LIVETIME = 60000;

    /**
     * Проверка, является ли значение конечным числом
     * @method GWTK.gEngine.isNumeric
     * @public
     * @param n {string|number} Значение
     * @return {boolean} Значение является конечным числом
     */
    GWTK.gEngine.isNumeric = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    /**
     * Наследование методов
     * @method GWTK.gEngine.inheritPrototype
     * @public
     * @param subClass {Object} Класс - потомок
     * @param superClass {Object} Класс - родитель
     */
    GWTK.gEngine.inheritPrototype = function (subClass, superClass) {
        var prototype = Object.create(superClass.prototype);
        prototype.constructor = subClass;
        subClass.prototype = prototype;
    };

    /**
     * Вспомогательные функции 3D режима
     * @class GWTK.gEngine.Utils3d
     */
    GWTK.gEngine.Utils3d = (function () {

        /**
         * Объект подписчика
         * @param token {string} Токен
         * @param handler {function} Обработчик события
         */
        var Observer = function (token, handler) {
            this.token = token;
            this.update = handler;
        };

        var Utils = function () {

        };
        Utils.prototype = {

            /**
             * Обертование функции для срабатывания только после
             * выдерживания временного интервала (каждый вызов заново сбрасывает счетчик)
             * @method debounce
             * @public
             * @params func {Function} Функция
             * @params delay {Number} Задержка в мс
             * @params immediate {Boolean} Флаг срабатывания вначале временного отрезка
             */
            debounce: function (func, delay, immediate) {
                var inDebounce = undefined;
                return function () {
                    var context = this,
                        args = arguments;
                    clearTimeout(inDebounce);
                    inDebounce = setTimeout(function () {
                        inDebounce = null;
                        if (!immediate)
                            func.apply(context, args);
                    }, delay);
                    if (immediate && !inDebounce) func.apply(context, args);
                }
            },

            /**
             * Обертование функции для срабатывания не чаще временного интервала
             * @method throttle
             * @public
             * @params func {Function} Функция
             * @params limit {Number} Задержка в мс
             */
            throttle: function (func, limit) {
                var inThrottle,
                    lastFunc,
                    lastRan;
                return function () {
                    var context = this,
                        args = arguments;
                    if (!inThrottle) {
                        func.apply(context, args);
                        lastRan = Date.now();
                        inThrottle = true;
                    } else {
                        clearTimeout(lastFunc);
                        lastFunc = setTimeout(function () {
                            if ((Date.now() - lastRan) >= limit) {
                                func.apply(context, args);
                                lastRan = Date.now()
                            }
                        }, limit - (Date.now() - lastRan))
                    }
                };
            },
            /**
             * Создание GUID
             * @method createGUID
             * @public
             * @return {string} GUID
             */
            createGUID: function () {
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
                }

                return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
            },

            /**
             * Определение наличия сенсорного экрана
             * @method isTouchDevice
             * @public
             * @return {boolean} Наличие сенсорного экрана
             */
            isTouchDevice: function () {
                return (('ontouchstart' in window)
                    || (navigator['MaxTouchPoints'] > 0)
                    || (navigator.msMaxTouchPoints > 0));
            },

            /**
             * Определение версии IE
             * @method isIE
             * @public
             * @return {*}
             */
            isIE: function () {
                var rv = -1;
                var ua = window.navigator.userAgent;
                var msie = ua.indexOf('MSIE ');
                if (msie > 0) {
                    // IE 10 or older => return version number
                    return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
                }
                var trident = ua.indexOf('Trident/');
                if (trident > 0) {
                    // IE 11 => return version number
                    rv = ua.indexOf('rv:');
                    return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
                }
                var edge = ua.indexOf('Edge/');
                if (edge > 0) {
                    // Edge (IE 12+) => return version number
                    return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
                }
                return rv;
            },

            /**
             * Разбор строки URL адреса
             * @method parseUrl
             * @public
             * @param url {string} Строка URL адреса
             * @return {object} Объект URL параметров {`folderpath`,`href`,`protocol`,`origin`,`pathname`}
             */
            parseUrl: function (url) {

                var link = url.split('?');
                var server = link[0].split(/\/+/);
                var path = "";
                if (server.length > 2) {
                    path = server.slice(2).join("/");
                }
                var signPos = url.indexOf("?");
                if (signPos === -1) {
                    signPos = undefined;
                }
                var folder = url.slice(0, signPos);
                folder = folder.slice(0, folder.lastIndexOf("/"));
                return {
                    folderpath: folder,
                    href: url,
                    protocol: server[0],
                    origin: server[0] + "//" + server[1],
                    pathname: path
                }
            },
            /**
             * Создать правильный идентификатор из строки
             * @method makeHtmlId
             * @public
             * @param id {string} Идентификатор
             * @return {string} Идентификатор с удаленными запрещенными символами
             */
            makeHtmlId: function (id) {
                return id.replace(/[!#_:\\/.]/g, '');
            },

            /**
             * Добавить к объекту методы обработки событий
             * @method makeHtmlId
             * @public
             * @param myObject {object} Объект
             */
            makePubSub: function (myObject) {

                // Storage for topics that can be broadcast
                // or listened to
                var topics = {};

                // A topic identifier
                var subUid = -1;

                // Publish or broadcast events of interest
                // with a specific topic name and arguments
                // such as the data to pass along
                /**
                 * Выполнить обработчик события
                 * @method publish
                 * @param topic {string} Название события
                 * @param args {GWTK.gEngine.EventArgs} Аргументы
                 * Метод выполняет обработчики события eventData.type из очереди обработчиков maphandlers
                 */
                myObject.publish = function (topic, args) {

                    if (topics[topic] === undefined) {
                        return false;
                    }

                    var subscribers = topics[topic], len = subscribers.length;
                    args.CancelRequested = false;
                    // events in REVERSE order
                    while (len--) {
                        subscribers[len].update(args);
                        if (args.CancelRequested === true) {
                            args.CancelRequested = false;
                            break;
                        }
                    }

                    return this;
                };

                /**
                 * Подключить обработчик события
                 * @method on
                 * @param topic {string} Название события
                 * @param handler {function} Обработчик события
                 * @param [afterFlag] {boolean} Флаг добавления в конец списка обработчиков
                 * @return {string|boolean} При успешном добавлении возвращает токен обработчика, иначе - `false`
                 */
                myObject.subscribe = function (topic, handler, afterFlag) {

                    if (!topic) {
                        console.error('You have to specify event type');
                        return false;
                    }

                    if (typeof handler !== "function") {
                        console.error('You have to specify event handler function');
                        return false;
                    }


                    if (topics[topic] === undefined) {
                        topics[topic] = [];
                    }

                    var token = (++subUid).toString();
                    if (afterFlag) {
                        topics[topic].splice(0, 0, new Observer(token, handler))
                    } else {
                        topics[topic].push(new Observer(token, handler));
                    }
                    return token;
                };

                /**
                 * Отключить обработчик события
                 * @method unsubscribe
                 * @param token {string} Токен обработчика
                 * @return {object|boolean} При успешном удалении возвращает объект издателя, иначе - `false`
                 */
                myObject.unsubscribe = function (token) {

                    if (!token) {
                        console.error('You have to specify handler token');
                        return false;
                    }

                    for (var m in topics) {
                        for (var i = 0, j = topics[m].length; i < j; i++) {
                            if (topics[m][i].token === token) {
                                topics[m].splice(i, 1);
                                return token;
                            }
                        }
                    }

                    return this;
                };

                /**
                 * Отключить обработчик события
                 * @method unsubscribe
                 * @param handler {function} Функция обработчика
                 * @return {object|boolean} При успешном удалении возвращает объект издателя, иначе - `false`
                 */
                myObject.unsubscribeByHandler = function (handler) {

                    if (!handler) {
                        console.error('You have to specify handler');
                        return false;
                    }

                    for (var m in topics) {
                        for (var i = 0, j = topics[m].length; i < j; i++) {
                            if (topics[m][i].update === handler) {
                                topics[m].splice(i, 1);
                                return handler;
                            }
                        }
                    }

                    return this;
                };
            },

            /**
             * Разобрать ответ сервиса (ошибка)
             * @method parseServiceException
             * @param xmlText {string} Текст ответа
             * @result {string|undefined} Протокол ошибки
             */
            parseServiceException: function (xmlText) {
                var errorCode, errorText, result, xml;
                if (typeof xmlText === "string") {
                    var parser = new DOMParser();
                    xml = parser.parseFromString(xmlText, "text/xml");
                } else if (typeof xmlText === "object") {
                    xml = xmlText;
                } else {
                    xml = null;
                }
                if (xml == null || (xml.doctype && xml.doctype.name === 'html')) {
                    errorCode = 'InvalidResponseDataError';
                    errorText = 'Invalid data from server';
                } else {
                    var exceptionElement = xml.getElementsByTagName('Exception')[0];
                    if (exceptionElement) {
                        errorCode = exceptionElement.getAttribute('code');
                        var exceptionTextElement = xml.getElementsByTagName('ExceptionText')[0];
                        if (exceptionTextElement) {
                            errorText = exceptionTextElement.textContent;
                        }
                    }
                }
                if (errorCode) {
                    result = w2utils.lang("Exception code") + ": " + "<span style='color: red;'>" + errorCode + "</span>. " + w2utils.lang("Exception text") + ": " + "<span style='color: red;'>" + errorText + "</span>";
                }
                return result;
            },

            /**
             * Прочитать Blob как текст
             * @method readBlobAsText
             * @param blob {Blob} Образ файла
             * @param handler {function} Обработчик текста
             */
            readBlobAsText: function (blob, handler) {
                var uri = URL.createObjectURL(blob);
                var xhr = new XMLHttpRequest();
                xhr.open('get', uri, false);
                xhr.responseType = 'text';
                xhr.onload = function () {
                    handler(this.responseText);
                };
                xhr.send();
            }
        };
        return new Utils();
    })();

    GWTK.gEngine.EventArgs = function (data) {
        this.CancelRequested = false;
        this.data = data || undefined;
    };
    GWTK.gEngine.EventArgs.prototype = {
        toJSON: function () {
            var result = {};
            for (var k in this) {
                if (this.hasOwnProperty(k))
                    result[k] = this[k];
            }
            return JSON.stringify(result);
        },
        fromJSON: function (json) {
            for (var k in this) {
                if (json.hasOwnProperty(k)) {
                    this[k] = json[k];
                }
            }
        }
    }

}
