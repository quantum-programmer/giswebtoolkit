/**************************************** Нефедьева О. 13/04/20 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                       Список листов слоев карты                  *
*                                                                  *
*******************************************************************/
if (window.GWTK) {
    /**
     * Класс Список листов слоев карты
     * @class GWTK.SheetNamesList
     * @constructor GWTK.SheetNamesList
     * @param map {GWTK.Map} карта 
     */
    GWTK.SheetNamesList = function (map) {
        this.map = map;
        this.element = {"server":"", "layerId":"", "sheets":{}};
        this.list = [];
 
        if (this.map == undefined || this.map == null) {
            console.log("GWTK.SheetNamesList. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        this.init();
    };

    GWTK.SheetNamesList.prototype = {
        /**
         * Инициализация класса
         * @method init
         */
        init: function () {
            this.list = [];
        },

        /**
         * Добавить
         * @method add
         * @param layer {Object} слой карты
         * @returns {Object}  или {undefined} при ошибке
        */
        add: function(layer){
           if (typeof layer === 'undefined' || !$.isFunction(layer.getType) || !layer.idLayer){
               return;
           }
           var type = layer.getType();
           if (type !== 'wms' && type !== 'tile'){
               return;
           }

           if (!layer.mapSheets || layer.mapSheets.sheets.length == 0){
               return;
           }

           var elem = this.get(layer);

           if (!elem && layer.idLayer.length > 0){
               elem = $.extend({}, this.element);
               elem.server = GWTK.Util.getServerUrl(layer.options.url);
               elem.layerId = layer.idLayer;
               elem.sheets = [];
               elem.sheets = elem.sheets.concat(layer.mapSheets.sheets);   
               this.list.push(elem);
           }
           
           return elem;
        },
        
        /**
         * Добавить элемент
         * @method addElement
         * @param elem {Object} элемент списка {"server":"", "layerId":"", "sheets":[]}
         * @returns {Object}  или `false` при ошибке
        */
        addElement: function(elem){
            if (!elem || !$.isArray(elem.sheets) || !elem.layerId || !elem.server){ 
                return false; 
            }
            var _elem = $.extend({}, elem);
            _elem.sheets = [].concat(elem.sheets);   
            this.list.push(_elem);
            return _elem;
        },

        /**
         * Получить элемент списка для слоя
         * @method get
         * @param layer {Object} слой карты
         * @param index {boolean} признак "Вернуть индекс"
         * @returns {Object} или {Number} или `false` при ошибке
        */
        get: function(layer, index){
            if (typeof layer === 'undefined' || !$.isFunction(layer.getType) || !layer.idLayer){
                return false;
            }
            var type = layer.getType();
            if (type !== 'wms' && type !== 'tile'){
                return false;
            }
            
            return this.getElement(GWTK.Util.getServerUrl(layer.options.url), layer.idLayer, index);     
        },

        /**
         * Получить элемент списка 
         * @method getElement
         * @param server {string} адрес (url) сервера
         * @param id {string} id слоя сервера
         * @param getindex {boolean} признак "вернуть индекс"
         * @returns {Object} или {Number} или `false` при ошибке
        */
        getElement: function(server, id, getindex){
            if (!server || !id || !this.list){
                return false;
            }
            var i, len = this.list.length;
            for (i = 0; i < len; i++){
                if (this.list[i].server === server && this.list[i].layerId === id){
                    if (getindex){
                        return i;
                    }
                    return {"layerId": this.list[i].layerId, "sheets":this.list[i].sheets};
                }
            }
            return false;
        },

        /**
         * Деструктор
         * @method destroy
        */
        destroy: function(){
            if (!this.list || this.list == null){return;}
            var i, len = this.list.length;
            for (i = 0; i < len; i++){
                this.list[i].sheets.splice(0, this.list[i].sheets.length);
            }
            this.list.splice(0, this.list.length);
            this.list = null;
        },
      
        /**
         * Удалить
         * @method remove
         * @param layer {Object} слой карты
        */
        remove: function(layer){
            if (typeof layer === 'undefined' || !$.isFunction(layer.getType) || !layer.idLayer){
                return;
            }
            var i, elem,
                count = 0, 
                layers = this.map.tiles.getSelectableLayersArray(),
                len = layers.length,
                index = this.get(layer, true);
            if (!$.isNumeric(index)) {
                return;
            }
            elem = this.list[index];
            for (i = 0; i < len; i++){
                if (!layers[i].idLayer){
                    continue;
                }
                if (elem.layerId === layers[i].idLayer){
                    count++;
                }   
            }
            if (count == 1){
                this.list.splice(index, 1);
            }
            return;
        }
    }
}