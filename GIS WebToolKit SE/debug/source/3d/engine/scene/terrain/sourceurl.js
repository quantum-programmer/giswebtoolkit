/******************************************** Тазин В. 05/03/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Источник для загрузки тайлов                      *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс источника для загрузки тайлов
     * @class GWTK.gEngine.Scene.RasterSourceUrl
     * @constructor GWTK.gEngine.Scene.RasterSourceUrl
     * @param serviceUrl {string|null} Строка адреса сервиса
     * @param urlString {string} Строка для запроса
     */
    GWTK.gEngine.Scene.RasterSourceUrl = function (serviceUrl, urlString) {
        this.setServer(serviceUrl);
        this.setBaseUri(urlString);

        this._keyList = {
            '%x': null,
            '%y': null,
            '%z': null
        };
        this._replacer = this._replacer.bind(this);
    };

    GWTK.gEngine.Scene.RasterSourceUrl.prototype = {
        /**
         * Параметр для замены строки
         * @property _re {string}
         * @static
         */
        _re: /%x|%y|%z/g,

        /**
         * Обработчик замены символов
         * @method _replacer
         * @private
         * @param charToReplace {string} Символ для замены
         * @return {string} Символ на замену
         */
        _replacer: function (charToReplace) {
            return this._keyList[charToReplace] || ''
        },

        /**
         * Установить базовый источник
         * @method setBaseUri
         * @public
         * @param urlString {string} Строка для запроса
         */
        setBaseUri: function (urlString) {
            if (urlString) {
                this._baseUri = GWTK.gEngine.Utils3d.parseUrl(urlString);
            }
        },
        /**
         * Получить ссылку на тайл
         * @method getUrl
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @return {string} Ссылка на тайл
         */
        getUrl: function (identifier) {
            this._keyList['%x'] = '' + identifier.getX();
            this._keyList['%y'] = '' + identifier.getY();
            this._keyList['%z'] = '' + identifier.getLevel();
            return this._baseUri.href.replace(this._re, this._replacer);
        },
        /**
         * Установить адрес сервиса
         * @method setServer
         * @public
         * @param serviceUrl {string|null} Строка адреса сервиса
         */
        setServer: function (serviceUrl) {
            this._serverUrl = serviceUrl;
        },
        /**
         * Получить адрес сервиса
         * @method setServer
         * @public
         * @return {string|null} Адрес сервиса
         */
        getServer: function () {
            return this._serverUrl;
        }
    }
}