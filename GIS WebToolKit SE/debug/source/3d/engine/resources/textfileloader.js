/***************************************** Тазин В.О. 12/03/21  *****
 ***************************************** Помозов Е.В. 18/03/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Компонент загрузчика текстовых файлов                *
 *                                                                  *
 *******************************************************************/
'use strict';
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};

    /**
     * Компонент загрузчика текстовых файлов
     * @class GWTK.gEngine.TextFileLoader
     */
    GWTK.gEngine.TextFileLoader = (function () {

        var globalOptions = {};

        var TextFileLoader = function () {
        };

        TextFileLoader.prototype = {

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
             * Загрузить текстовый файл
             * @method loadTextFile
             * @public
             * @param fileName {string} Путь к файлу
             * @param fileType {number} Тип файла [0:xml; 1:simple text; 2: json]
             * @param callbackFunction {function} Обработчик
             * @param [name] {string} Название ресурса
             */
            loadTextFile: function (fileName, fileType, callbackFunction, name) {
                name = name || fileName;
                if (!(GWTK.gEngine.ResourceMap.isAssetActuallyLoaded(name))) {
                    if (!(GWTK.gEngine.ResourceMap.isAssetLoaded(name))) {
                        GWTK.gEngine.ResourceMap.asyncLoadRequested(name);  // добавление ресурсов в реестр

                        var eTextFileType = GWTK.gEngine.Resources.enumTextFileType;
                        // асинхронный запрос данных с сервера
                        var req = new XMLHttpRequest();
                        req.onreadystatechange = function () {
                            if ((req.readyState === 4) && (req.status !== 200)) {
                                GWTK.gEngine.Mediator.publish('writeProtocol', {
                                    text: w2utils.lang('Loading file error') + ': <span style=\'color: red;\'>' + +fileName + '</span>',
                                    displayFlag: false
                                });
                            }
                        };
                        req.open('GET', fileName, true);
                        
                        req.onload = function () {
                            var fileContent;
                            if (fileType === eTextFileType.eXMLFile) {
                                var parser = new DOMParser();
                                fileContent = parser.parseFromString(req.responseText, 'text/xml');
                            } else if (fileType === eTextFileType.eJSONFile) {
                                fileContent = JSON.parse(req.responseText);
                            } else {
                                fileContent = req.responseText;
                            }
                            GWTK.gEngine.ResourceMap.asyncLoadCompleted(name, fileContent);
                            if (typeof callbackFunction === 'function')
                                callbackFunction(name);
                        };
                        req.onerror = function () {
                            GWTK.gEngine.ResourceMap.asyncLoadCompleted(name, null);
                            if (typeof callbackFunction === 'function')
                                callbackFunction(name);
                        };

                        var authFlag = false;
                        if (Array.isArray(globalOptions.pamUrls)) {
                            for (var i = 0; !authFlag && i < globalOptions.pamUrls.length; i++) {
                                if (fileName.indexOf(globalOptions.pamUrls[i].url) !== -1) {
                                    authFlag = true;
                                }
                            }
                        }

                        if (authFlag || (globalOptions['extauth'] && fileName.indexOf(globalOptions.url) !== -1)) {
                            // внешняя авторизация
                            req.withCredentials = true;
                        } else if (globalOptions['token']) {
                            var token = globalOptions['token'];                       // авторизация токеном
                            req.setRequestHeader(GWTK.gEngine.AUTH_TOKEN, token);
                        }
						else {
							req.setRequestHeader('Content-Type', 'text/xml');
						}

                        req.send();
                    }
                } else {
                    if (typeof callbackFunction === 'function')
                        callbackFunction(name);
                }
            },

            /**
             * Удалить загруженный текстовый файл (либо ссылку на него) из реестра
             * @method unloadTextFile
             * @public
             * @param fileName {string} Путь к файлу
             */
            unloadTextFile: function (fileName) {
                GWTK.gEngine.ResourceMap.unloadAsset(fileName);
            }

        };

        return new TextFileLoader();

    }());
}
