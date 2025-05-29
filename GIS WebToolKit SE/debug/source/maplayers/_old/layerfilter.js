/********************************* Нефедьева О.А. **** 22/05/20 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2022              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                         Фильтр слоя карты                        *
*                                                                  *
*******************************************************************/

if (window.GWTK) {
    /**
     * Класс Фильтр слоя карты
     * Управление составом отображения WMS-слоя
     * @class GWTK.LayerFilter
     * @constructor GWTK.LayerFilter
     * @param layer {GWTK.WmsLayer} слой карты
    */
    GWTK.LayerFilter = function (layer) {
        if (!layer || layer.getType() !== 'wms') {
            console.log(w2utils.lang("Layer filter creation error") + ". " + w2utils.lang("Not defined a required parameter") + " layer.");
            return;
        }
        if (!layer.map ) {
            console.log(w2utils.lang("Layer filter creation error") + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        if (typeof layer.getType != 'function' || layer.getType() !== 'wms') {
            console.log(w2utils.lang("Layer filter creation error") + ". " + w2utils.lang("Not defined a required parameter") + " WmsLayer.");
            return;
        }
        
        this.layer = layer;                  // слой карты
        this.map = layer.map;                // карта
        this.server = false;                 // адрес сервера
        this.typeNamesArray = false;         // фильтр typenames
        this.typeNames = false;
        this.codesArray = false;             // фильтр codelist
        this.codeList = false;
        this.keysArray = false;              // фильтр keylist
        this.keysList = false;
        this.keysArrayPermanent = false;     // предопределенный фильтр keylist
        this.idList = false;                 // фильтр idlist
        
        this.filterInactive = true;          // фильтр неизменяемый, да/нет
        this.hasLegend = this.layer.hasLegend();

        this.error = false;
        
        this.init();
    }

    GWTK.LayerFilter.prototype =
    {
        /**
         * Инициализировать
         * @method init
         */
        init: function () {
      
            if (!this.layer) { return; }
            
            this.server = GWTK.Util.getServerUrl(this.layer.options.url);
            var url = this.layer.options.url.toLowerCase(),
                index,
                urlparam = GWTK.Util.getParamsFromURL(url);
            
            if (urlparam['typenames'] && urlparam['typenames'].length > 0) {
                index = url.indexOf(urlparam['typenames']);
                this.typeNames = this.layer.options.url.substr(index, urlparam['typenames'].length);
                this.typeNamesArray = this.typeNames.split(',');
            }
            
            if (urlparam['codelist'] && urlparam['codelist'].length > 0){
                this.typeNames = false;
                this.typeNamesArray = false;
                index = url.indexOf(urlparam['codelist']);
                this.codeList = this.layer.options.url.substr(index, urlparam['codelist'].length);
                this.codesArray = this.codeList.split(',');
            }

            if (urlparam['keylist'] && urlparam['keylist'].length > 0){
                index = url.indexOf(urlparam['keylist']);
                this.keysList = this.layer.options.url.substr(index, urlparam['keylist'].length);
                this.keysArray = this.keysList.split(',');
            }

            if (urlparam['idlist'] && urlparam['idlist'].length > 0){
                index = url.indexOf(urlparam['idlist']);
                this.idList = this.layer.options.url.substr(index, urlparam['idlist'].length);
            }
            
            this._restoreFilterValue();
            
            this.initEvents();
        },

        /**
         * Инициализировать обработку событий
         * @method initEvents
         */
        initEvents: function(){
            if (!this.hasLegend){
                return;
            }
            //$(this.map.eventPane).on('drawfilter.' + this.layer.xId, this.onDrawFilter.bind(this));
            
            $(this.map.eventPane).on('loadclassifierError.' + this.layer.xId, function(e){
                if (!e || !e.legend || e.legend.id !== this.layer.xId) { return; }
                this.inactive();                           // отключаем динамический фильтр
                this.error = true;
                this.errorText = 'loadclassifierError' + ' ' + this.layer.xId;
                GWTK.mapWriteProtocolMessage(this.map, {text: errorText, display: false, icon:'error'});
            }.bind(this));
            
            $(this.map.eventPane).on('loadclassifier.' + this.layer.xId, function( e ){
                if (!e || !e.legend ) {
                    return;
                }
                // if ( !this._testLegendSchemeName(e.legend.id) ) {
                if (e.layer.xId !== this.layer.xId) {
                    return;
                }
    
                if (!this.filterInactive) {
                    return;
                }
                $(this.map.eventPane).off('loadclassifier.' + this.layer.xId);
                
                this.active();
                
                if (!this.filterInactive){
                    this.layer.wmsManager._activateFilters(this.layer);
                }
                $(this.map.eventPane).trigger({'type': 'filteractive', 'layer':this.layer,
                                               'active':!this.filterInactive});
            }.bind(this));
        
        },
        
        /**
         * Сравнить имена схем
         * @method _testLegendSchemeName
         * @param id {string} id слоя (из легенды)
         * @return {boolean} `true`- имя схемы легенды совпало с именем схемы слоя фильтра
         */
         _testLegendSchemeName: function( id ) {
            if ( typeof id == 'undefined') {
                return false;
            }
            if ( id == this.layer.xId ) {
                return true;
            }
            if ( !this.layer.options.schemename ) {
                return false;
            }
            var schemeName = this.layer.classifier.schemeName;
            var legend_layer = this.map.tiles.getLayerByxId( id );
            if ( !legend_layer || !legend_layer.classifier ) {
                return false;
            }
            var classifier = legend_layer.classifier;
            if ( classifier.schemeName && schemeName ) {
                if (classifier.schemeName == schemeName) {
                    return true;
                }
            }
            return false;
        },
        
        /**
         * Обработчик события `drawfilter`
         * @method onDrawFilter
         * @param event {Object} объект события
         */
        onDrawFilter : function(event){                          // получена легенда для дерева
            if (!event || event.layer !== this.layer.xId) return;
            return false;
        },

        /**
         * Активировать фильтр
         * @method active
         */
        active: function(){
            if (!this.filterInactive) {
                return;
            }
            this.filterInactive = false;
            this.setKeysArrayPermanent();
            if (this.error){
                this.filterInactive = true;
                return;
            }
            this._convert();
            this.hasLegend = true;
        },

        /**
         * Деактивировать фильтр
         * @method inactive
         */
        inactive:function(){
            this.filterInactive = true;
            this.setKeysArrayPermanent = GWTK.Util.falseFunction;
            this.hasLegend = false;
        },

        /**
         * Получить список кодов объектов
         * @method getCodeList
         * @returns {String}
         */
        getCodeList: function(){
            return this.codeList;
        },
        
        /**
         * Получить список типов объектов
         * @method getTypeNames
         * @returns {String}
         */
        getTypeNames: function(){
            return this.typeNames;
        },

        /**
         * Получить список идентификаторов объектов
         * @method getIdList
         * @returns {String}
         */
        getIdList: function(){
            return this.idList;
        },

        /**
         * Получить список ключей объектов
         * @method getKeyList
         * @returns {String}
         */
        getKeyList: function(){
            return this.getKeysFilterString();
        },

        /**
         * Установить список статических ключей объектов
         * (заполняется, если в легенде в дереве выводятся не все typenames)
         * @method setKeysArrayPermanent
         */
        setKeysArrayPermanent: function(){
           
            if (!this.hasLegend || this.layer.options.legend == "*")
                return;
            this.error = false;
            // типы объектов в легенде (rsc слои)
            var tn_array_legend = this.layer.options.legend.split(',');
            
            if (this.typeNames || this.codeList){
                this.keysArrayPermanent = [];
                return;
            }

            if (typeof this.layer.classifier == 'undefined' ||
               !$.isArray(this.layer.classifier.rscobjects) ||
               this.layer.classifier.rscobjects.length == 0) {
                var param = {
                    text: 'GWTK.LayerFilter Error. ' + this.layer.alias + ' ' + w2utils.lang("Not defined a required parameter") + " - Classifier.",
                    display: true, icon:'error'
                };
                GWTK.mapWriteProtocolMessage(this.map, param);
                console.log(param.text);
                this.filterInactive = true;
                this.error = true;
                return;
            }

            var i, rscobjects = this.layer.classifier.rscobjects;
            this.keysArrayPermanent = [];                 // постоянный фильтр отображения по keys
            
            for (i = 0; i < rscobjects.length; i++){
                if ($.inArray(rscobjects[i].segmentkey, tn_array_legend) > -1){
                    continue;
                }
                this.keysArrayPermanent.push(rscobjects[i].key);
            }
            
            return true;
        },

        /**
         * Получить фильтр статических ключей объектов
         * (заполняется, если в легенде в UI выводятся не все typenames)
         * @method getKeysPermanentFilter
         * @returns {String}
         */
        getKeysPermanentFilter: function(){
           if (!this.keysArrayPermanent || this.keysArrayPermanent.length == 0){ return ''; }
           return this.keysArrayPermanent.join(',');
        },

        /**
         * Получить фильтр ключей объектов
         * @method getKeysFilterString
         * @returns {String}
         */
        getKeysFilterString: function(){
           if (!this.layer || !this.keysArray) return undefined;
           var filter = this.getKeysPermanentFilter();
           if (filter.length > 0){
               filter += ','
           }
           return (filter + this.keysArray.join(','));
        },
        
        /**
         * Установить список ключей объектов
         * @method setKeyList
         * @param keylist {String} список ключей объектов
         * @returns {String} список ключей объектов
         */
        setKeyList: function(keylist){
            this.keysList = false;
            if (typeof keylist == 'string') {
                this.keysList = keylist;
                this.keysArray = this.keysList.split(',');
            }
            return this.keysList;
        },

        /**
         * Установить массив ключей объектов
         * @method setKeysArray
         * @param filter {String or Array} список ключей объектов
         * @returns {Boolean} `true` - установлено
         */
        setKeysArray: function(filter){
//  console.log('setKeysArray');
            if (this.filterInactive) { return false; }
            this.keysArray = false;
            if (!filter) return false;
            if (typeof filter == 'string') {
                this.keysArray = filter.split(',');
                this.setKeyList(filter);
            }
            else if ($.isArray(filter)) {
                this.keysArray = filter;
                this.keysList = filter.join(',');
            }
            return $.isArray(this.keysArray);
        },
    
        getKeysArray:function(){
            return this.keysArray||undefined;
        },
        
        /**
         * Установить список идентификаторов объектов
         * @method setIdList
         * @param idlist {String} список идентификаторов объектов
         * @returns {String} список идентификаторов объектов
         * при ошибке возвращает `false`
         */
        setIdList: function(idlist){
            this.idList = false;
            if (!idlist) return false;
            if (typeof idlist == 'string') {
                this.idList = idlist;
            }
            return this.idList;
        },

        /**
         * Текущий фильтр объектов
         * @method curretnFilter
         * @returns {Object} json, фильтр объектов
         */
        curretnFilter: function(){
            var filter = {
                'typenames': this.getTypeNames(),
                'codelist': this.getCodeList(),
                'keylist': this.getKeysFilterString(),
                'idlist': this.getIdList()
            };
            if (filter['idlist'] && filter['idlist'].length > 0){
                delete filter.typenames;
                delete filter.codelist;
                delete filter.keylist;
            }
            if (filter['keylist']){
                delete filter.typenames;
                delete filter.codelist;
                delete filter.idlist;
            }
            if (filter['codelist'] && filter['codelist'].length > 0){
                delete filter.typenames;
                delete filter.keylist;
                delete filter.idlist;
            }
            if (filter['typenames'] && filter['typenames'].length > 0){
                delete filter.codelist;
                delete filter.keylist;
                delete filter.idlist;
            }
            return filter;
        },

        /**
         * Деструктор
         * @method destroy
         */
        destroy:function(){
            $(this.map.eventPane).off('drawfilter.' + this.layer.xId);
            $(this.map.eventPane).off('loadclassifierError.' + this.layer.xId);
            $(this.map.eventPane).off('loadclassifier.' + this.layer.xId);
            this.clear();
        },

        /**
         * Очистить
         * @method clear
         */
        clear: function(){
            this.keysArrayPermanent = [];
            this.typeNamesArray = [];
            this.codesArray = [];
            this.keysArray = [];
            this.typeNames = false;
            this.codeList = false;
            this.keysList = false;
            this.idList = false;
        },

        /**
         * Преобразовать
         * функция преобразует список кодов объектов в список ключей
         * @method _convert
         */
        _convert: function(){
            if (!this.hasLegend || !$.isArray(this.codesArray) || this.codesArray.length == 0){
                return;
            }
            if (!this.layer.classifier || !this.layer.classifier.rscobjects) {
                return;
            }
            var rscobjects = this.layer.classifier.rscobjects, i,
                keys = [];
            if (this.keysArray && this.keysArray.length > 0){
                keys = keys.concat(this.keysArray);
            }
            
            for (i = 0; i < rscobjects.length; i++){
                if ($.inArray(rscobjects[i].code, this.codesArray) == -1){
                    continue;
                }
                if ($.inArray(rscobjects[i].key, keys) == -1){
                    keys.push(rscobjects[i].key);
                }
            }

            if (keys.length == 0) { return; }
            this.keysList = keys.join(',');
            this.keysArray = this.keysList.split(',');
            this.codesArray = false;
            this.codeList = false;
        },

        /**
         * Получить параметр хранимого фильтра
         * @method getStoredFilterParameter
         * @returns {String} строка в кодировке base64
         */
        getStoredFilterParameter:function(){
            if (this.hasLegend){
                var ff = this.curretnFilter();
                if (!ff['typenames'] && !ff['codelist'] && !ff['keylist'] && !ff['idlist']){
                    return '';
                }
                return GWTK.Util.utf8ToBase64(JSON.stringify(ff));
            }
            return '';
        },

        /**
         * Восстановить фильтр из хранимого параметра
         * @method restoreFilterByParameter
         * @param str_base64 {String} фильтр в кодировке base64
         */
        restoreFilterByParameter: function(str_base64){
            if (!str_base64) return;
            try{
                var filter = JSON.parse(GWTK.Util.base64ToUtf8(str_base64));
            }
            catch(msg){ return; }
            if ($.isEmptyObject(filter)) { return; }
            this.clear();
            if (filter.hasOwnProperty('typenames')){
                this.typeNames = filter['typenames'];
                this.typeNamesArray = this.typeNames.split(',');
            }
            if (filter.hasOwnProperty('codelist')){
                this.codeList = filter['codelist'];
                this.codesArray = this.codeList.split(',');
            }
            if (filter.hasOwnProperty('keylist')){
                this.keysList = filter['keylist'];
                this.keysArray = this.keysList.split(',');
            }
            if (filter.hasOwnProperty('idlist')){
                this.idList = filter['idlist'];
            }
        },

        /**
         * Восстановить значение фильтра
         * @method _restoreFilterValue
         * @protected
         */
        _restoreFilterValue: function(){
            if (!localStorage) return;
            var lskey = 'filterlist_' + this.map.divID;
            if (this.map.options.username){
                lskey += this.map.options.username;
            }

            var farray = [],
                sf = localStorage.getItem(lskey);
            if (sf == null) return;
            farray = sf.split('($$$)');
            farray.forEach(function(record){
                var item = JSON.parse(record);
                if (item.xid == this.layer.xId){
                   this.restoreFilterByParameter(item.param);
                }
            }.bind(this));
        }

    }

    GWTK.layerFilter = function (layer) {
        return new GWTK.LayerFilter(layer);
    };
}