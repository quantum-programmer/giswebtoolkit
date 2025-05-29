/**************************************** Нефедьева О. 15/11/19 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2019              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                       Токен доступа к данным                     *
*                                                                  *
*******************************************************************/
if (window.GWTK) {
    /**
     * Класс Токен доступа
     * Авторизованный доступ к пространственным данным
     * @class GWTK.Token
     * @constructor GWTK.Token
     * @param map {GWTK.Map} карта 
     */
    GWTK.Token = function (map) {
        this.map = map;
        this._key;
        this._param;
        this._timespan = 600;
        this.queue = [];
 
        if (this.map == undefined || this.map == null) {
            console.log("GWTK.Token. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        this.init();
    };

    GWTK.Token.prototype = {
        /**
         * Инициализация класса
         * @method init
         */
        init: function () {
            this._key = "";
            this._param = {};
        },

        /**
         * Установить токен
         * @method key
         * @param token {string} токен
         */
        key: function (token) {
            this._key = token;
        },

        /**
         * Получить токен доступа
         * @method token
         * @return {string} токен
         */
        token: function () {
            
            if (!this.checkTime()) {
               this.getToken(this.map, true, true);
            }
            else {
                if (this.queue.length > 0) this.queue = [];
            }
            
            return this._key;
        },

        /**
         * Установить параметры токена доступа
         * @method _setParam
         */
        _setParam: function () {
            if (typeof this._key === "undefined") {
                this._key = '';
            }
            if (this._key.length == 0) {
                this._param = {};
            }
            var data = this._key.split('.'),
                code1 = data[1].split('-');          
            var code = code1.join('+');
            code1 = code.split('_');
            code = code1.join('/');
 
            try {
                this._param = JSON.parse(window.atob(code));

            }
            catch (msg) {

                this.init();
                console.log("GWTK.Token " + w2utils.lang("Failed to get access token"));
                console.log(msg);
            }
             
            return;
        },

        /**
         * Установить токен и параметры токена
         * @method setToken
         */
        setToken: function (token) {
            if (typeof token !== 'string' || token === 'false') {
                this.init();
                return;
            }
            this.key(token);
            this._setParam();
        },

        /**
         * Получить время использования токена
         * @method getExpireTime
         * @return {Number} метка времени, секунды
         */
        getExpireTime: function () {
            if ($.isEmptyObject(this._param)) { return undefined; }
            return this._param.exp;
        },

        /**
         * Получить текущее время
         * @method getTimeStamp
         * @return {Number} метка времени, секунды
         */
        getTimeStamp: function () {
            var date = new Date();
            return parseInt(date.getTime() / 1000.0);
        },

        /**
         * Проверить время использования токена
         * @method checkTime
         * @return {Boolean} `true`- время использования не истекло
         */
        checkTime: function () {
            if (typeof this._key !== 'string' || this._key.length == 0) {
                return false;
            }
            if ($.isEmptyObject(this._param) || !this.getExpireTime()) {
                return false;
            }
            if ((this.getExpireTime() - this.getTimeStamp()) > this._timespan) {
                return true;
            }
            return false;
        },

        /**
         * Получить токен доступа через запрос к серверу 
         * @method getToken
         * @param map {GWTK.Map} карта
         * @param async {boolean} режим запроса, `true` - асинхронный запрос 
         * @return {string} токен
         */
        getToken: function (map, async, refresh) {

            var map = map;

            if (typeof map === "undefined") {
                map = this.map;
            }
            if (typeof map === "undefined" || typeof map.options.urltoken === "undefined") {
                return;
            }

            if (this.queue.length > 1) { return; }

            var async = typeof async !== "boolean" ? true : async;

        var onerror = GWTK.bind(this.init, this),
                onsuccess = GWTK.bind(this.setToken, this),
                data = { "cmd": "get-tokenparams", "param": "token" },
                _request = this;
            if (typeof refresh === 'boolean' && refresh) {
                data["act"] = "update";
            }

            console.log("GWTK.Token data ", data);

            var jqxhr = $.ajax({
                crossDomain: true,
                type: 'post',
                url: map.options.urltoken,
                data: data,
                response: 'text/plane',
                dataType: "text",
                async: async,
                error: function () {
                        console.log("GWTK.Token " + w2utils.lang("Failed to get access token"));
                        _request.queue.shift();
                    onerror(); return;
                },
                success: function (response) {
                        _request.queue.shift();
                        onsuccess(response); return;
                }
            });

            this.queue.push(jqxhr);
}
    }
}