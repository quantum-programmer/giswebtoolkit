/************************************ Нефедьева О. *** 14/02/17 ****
 ************************************* Соколова Т.О *** 15/10/17 ****
 ************************************* Гиман  Н.Л.  *** 17/10/16 ****
 
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2017              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Поиск объектов                           *
 *                            GWTK SE                               *
 *******************************************************************/

if (window.GWTK) {
    GWTK.objectsSearch = function(map, func) {
        this.wfsQuery = null;
        this.map = map;
        if (!this.map) {
            console.log("objectsSearch." + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.selectedFeatures = null;
        this.handler = this.onDataLoaded;
        this.retrieveDataById = null;
        if ($.isFunction(func))
            this.retrieveDataById = func;
        this.dbHandler = this.retrieveDataById;                        // внешняя функция поиска записей DB
        
        this.initialize();
    };
    
    GWTK.objectsSearch.prototype = {
        // инициализация класса
        initialize: function() {
            if (!this.map) return;
            
            this.selectedFeatures = new GWTK.selectedFeatures(this.map);
            
            // var objsearch = this;
            // this.wfsQuery = new WfsQueries(this.map.options.url, this.map);
            // this.wfsQuery.onDataLoad = function(response, context) {
            //     if (objsearch) objsearch.onDataLoaded(response, context);
            //     return;
            // };
            //
            // return;
            const httpParams = GWTK.RequestServices.createHttpParams(this.map);
            this.wfsQuery = GWTK.RequestServices.retrieveOrCreate(httpParams, 'REST');
        },
        
        // обработчик ответа сервера
        onDataLoaded: function(response, context) {
            if (!this.map) return;
            if (this.map.options.objectpanel) {
                var tool = GWTK.maphandlers.map.mapTool('objectPanel');
                if (tool) {
                    tool.parseResponse(response);
                }else{
                    console.log('Error GWTK.objectsSearch. Cannot find tool with name objectPanel');
                }
                return;
            }else{
                this.map.setTextSearchResPane();
                $("#listlink").hide();
                
                var shtml = GWTK.Util.getResponseType(response);
                
                $(this.map.drawPane).css('cursor', 'default');
                
                var isError = true, pos = false;
                var pane = this.map.objectsPane;
                if (context && context instanceof HTMLDivElement) {
                    var pane = context;
                }else{
                    if ((context) && (context == true))
                        pos = true;
                }
                
                if (shtml != null && shtml.length == 4 && shtml[0] == 'wfs_featurecollection') {
                    if (!isNaN(shtml[2]) && !isNaN(shtml[3])) {
                        if (shtml[1] != "" && shtml[1] instanceof HTMLDivElement) {
                            isError = false;
                            
                            $('#pagination_result').html(w2utils.lang("Results from") + '<span> 1 </span>' + w2utils.lang("to") + '<span>' + shtml[2] + '</span>&nbsp;&nbsp;&nbsp;');
                            
                            this.searchDataByIdList();
                            
                            if ($('.panel-info-img-search').length > 0)  // Соколова клик на выделение первого найденного объекта
                            {
                                $('.panel-info-img-search')[0]._noplace = !pos;
                                //TODO GNL отключил клик по первому объекту
                                if (this.map.getSelectedMarking().id == 'marker') {
                                    if (typeof event !== 'undefined') {
                                        $('.panel-info-img-search')[0].click(event);
                                    }else{
                                        $('.panel-info-img-search')[0].click(window.event);
                                    }
                                }
                                
                            }
                        }
                    }
                }
                
                //GWTK.featureSearch.retrieveDataById = GWTK.featureSearch.dbHandler;
                
                if (!isError) {
                    if (pos) this.map.viewPlacemark(0);
                    $('#listlink').removeClass('hide');
                    $('#listlink').show();
                    $('#fulllist').hide();
                    $('.panel-pagination-button-left').hide();
                    $('.panel-pagination-button-right').hide();
                    $(pane).fadeIn("slow");
                    $(this.map.objectsPaneFooter).show();
                }else{
                    GWTK.Util.error_report();
                    $(this.map.objectsPaneFooter).hide();
                }
                
                $(this.map.underlayPane).fadeOut("slow");
                
                return;
            }
            
        },
        
        // выполнить запрос поиска объектов по списку идентификаторов gml:id
        searchObjectsByIdList: function(layers, ids) {
            var idfeature = [];
            var idLayers = [];
            if (!ids || !layers) return false;
            
            if (GWTK.Util.isArray(ids))
                idfeature = ids.toString();
            else idfeature = ids;
            if (GWTK.Util.isArray(layers))
                idLayers = layers.toString();
            else
                idLayers = layers;
            
            // var param = { "startindex": 0, "idlist": "", "layer_id": "" };
            // param.layer_id = idLayers;
            // param.idlist = idfeature;
            // param.mapid = idLayers;
            // param.ObjCenter = 2;
            //
            // this.wfsQuery.feature(param, true);
            this.retrieveDataById = null;
            this.wfsQuery.getFeature({
                LAYER: idLayers,
                IDLIST: idfeature,
                STARTINDEX: '0',
                OBJCENTER: '2'
            }).then((response) => {
                this.onDataLoaded(response.data, true);
            });
            
            return true;
        },
        
        
        // выполнить запрос поиска объектов по списку семантик
        searchObjectsBySemList: function(layers, codesAndValues) {
            var idfeature = [];
            var idLayers = [];
            if (!codesAndValues || !layers) return false;
            idfeature = codesAndValues;
            
            if (GWTK.Util.isArray(layers))
                idLayers = layers.toString();
            else
                idLayers = layers;
            
            var start_index = 0, maxCount = 10;
            var txtfilter;
            var cond = '(OR)';
            var keysValueOf = '';
            
            var sems = [];
            var values = [];
            var ss = [];
            
            for (var ii = 0; ii < idfeature.length; ii++) {
                var sem_val = idfeature[ii].split(':');
                if (sem_val.length != 2) return null;
                sems[ii] = sem_val[0].toLowerCase();
                values[ii] = 'val=' + sem_val[1].toLowerCase();
                ss[ii] = '=';
                
            }
            keysValueOf = '(' + sems.toString() + ')';
            var ssValueOf = '(' + ss.toString() + ')';
            var textValueOf = '(' + values.join('') + ')';
            var condValueOf = '';
            if (idfeature.length > 1) condValueOf = cond;
            txtfilter = '(' + keysValueOf + ssValueOf + textValueOf + condValueOf + ')';
            
            GWTK.featureSearch.wfsQuery.textsearch(layers.toString(), txtfilter, start_index + 1, maxCount, GWTK.maphandlers.map.objectsPane);
            return true;
        },
        
        // найти объекты базы данных по списку идентификаторов gml:id
        searchDataByIdList: function() {
            if (GWTK.featureSearch.retrieveDataById == null) return false;
            if (GWTK.featureSearch.selectedFeatures === undefined) return false;
            
            var ids = GWTK.featureSearch.selectedFeatures.getselection();
            if (ids.length == 0) return false;
            GWTK.featureSearch.retrieveDataById(ids);
            
            return true;
        },
        
        // найти объекты карты по прямоугольной области
        searchObjectsByAreaFrame: function(frame) {
            
            if (!frame || frame.length != 2) return false;
            
            var valid = ('lat' in frame[0] && 'lng' in frame[0] && 'lat' in frame[1] && 'lng' in frame[1]);
            if (!valid) return false;
            var map = this.map;
            var idLayers = map.tiles.getAreaSeekLayersxId();
            if (idLayers.length === 0) {
                GWTK.Util.error_report(w2utils.lang("No layers to area search."));
                map.handlers.clearAction($('#panel_button_select_rect'));
                setTimeout(function() {
                    $(map.objectsPane).fadeOut("slow");
                }, 3000);
                return false;
            }
            
            $(map.eventPane).css('cursor', 'progress');
            GWTK.Util.clearselectedFeatures();
            
            rpclayerlist = map.tiles.getRpcLayersByxId(idLayers);  // 01/04/2016
            
            var param = { "startindex": 0, "objlocal": "0,1,2,4" };
            param.layers = rpclayerlist;
            param.mapid = 1;
            
            if (map.options.measurement.show) {
                param.area = 1;
            }
            
            param.SEMANTIC = 1;
            param.objcenter = 2;
            param.metric = 1;
            param.semanticname = 1;
            param.bbox = [frame[0].lat, frame[0].lng, frame[1].lat, frame[1].lng];
            param.bbox = param.bbox.toString();
            
            if (map.options.objectpanel) {
                param.OUTTYPE = 'JSON';
            }
            
            if (GWTK.featureSearch === undefined) {
                GWTK.selectFeatures(map);
            }
            
            GWTK.featureSearch.retrieveDataById = GWTK.featureSearch.dbHandler; // установить функцию для обработки результата поиска
            
            //if (map.options.objectpanel) {
            //    GWTK.featureSearch.wfsQuery.OUTTYPE = 'JSON';
            //}
            
            GWTK.featureSearch.wfsQuery.featureex(param, false);                // false - не позиционировать карту на 1-ый объект
            
            return true;
        }
    };
    
}