/**************************************** Помозов Е.   28/10/19 *****
 **************************************** Нефедьева О. 08/04/20 *****
 **************************************** Соколова Т.О.27/08/20 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент  Выделение объектов                   *
 *                 (указанные, по условному знаку)                  *
 *                          GWTK SE                                 *
 *******************************************************************/

if (window.GWTK) {
    /**
     * Задача выделение объектов
     * @class GWTK.SelectObjectsTask
     * @constructor GWTK.SelectObjectsTask
     * @param map - объект карты
     */
    GWTK.SelectObjectsTask = function(map) {
        this.toolname = 'selectobjects';
        
        GWTK.MapTask.call(this, map);                                            // родительский конструктор
        
        if (!this.map) {                                                         // карта
            console.log("GWTK.SelectObjectsTask. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        
        this._selecttypes = ['specified', 'condition'];                           // типы выделения объектов (указанные, по условному знаку)
        this.selecttype = false;                                                  // текущий тип выделения
        this.action = false;                                                      // текущий обработчик выбора объектов
        this.canCancel = true;
        this.layer = null;
        this.gmlid = null;
        this.showobjpanel = true;                                                 // показать панель объектов
        this.layerSemantics = null;                                               // семантики слоя
        this.init();
        return;
    }
    
    GWTK.SelectObjectsTask.prototype = {
        /**
         * Инициализировать компонент
         * @method init
         */
        // ===============================================================
        init: function() {
            
            // список слоев для выделения объектов
            this.maplayersid = [];
            var len = this.map.layers.length;
            for (i = 0; i < len; i++) {
                if (this.map.layers[i].selectObject && this.map.layers[i].selectObject == 1) {
                    this.maplayersid.push(this.map.layers[i].xId);
                }
            }
            
            if (this.maplayersid.length == 0) {
                console.log(w2utils.lang("No layers with selectobject option!"));
                return;
            }
            
            // создать кнопку управления задачей
            this.createToolbarsButton();
            this.bind();
            // установить обработчики событий
            this.initEvents();
            
            return;
        },
        
        /**
         * Заполнить список идентификаторов слоев для выбора объектов
         * @method getMapLayers
         */
        // ===============================================================
        getMapLayers: function() {
            this.maplayersid = [];
            var lay_ids = this.map.tiles.getSelectableLayersEx(), i, len = lay_ids.length;
            
            for (i = 0; i < len; i++) {
                this.maplayersid.push(lay_ids[i].id);
            }
            return;
        },
        
        /**
         * Привязка контекста
         * @method bind
         */
        // ===============================================================
        bind: function() {
            this._setselectlayers = GWTK.Util.bind(this._setselectlayers, this);
            this._onFeatureListClick = GWTK.Util.bind(this._onFeatureListClick, this);
        },
        
        /**
         * Cоздать кнопки управления задачей в карте
         * @method createToolbarsButton
         */
        // ===============================================================
        createToolbarsButton: function() {
            if (!this.map || !this.map.panes.toolbarPane)
                return;
            var tool = this;
            
            for (var i = 0; i < this._selecttypes.length; i++) {
                var btn = GWTK.DomUtil.create('div', 'control-button control-button-radio clickable button-action control-button-selectobjects-' + this._selecttypes[i], this.map.panes.toolbarPane);
                btn.id = this.toolname + '_' + this._selecttypes[i];
                btn.toolname = this.toolname;
                if (this._selecttypes[i] == 'specified') {
                    btn.title = w2utils.lang('Select specified');
                    btn.selecttype = 'specified';
                }
                if (this._selecttypes[i] == 'condition') {
                    btn.title = w2utils.lang('Select by sign');
                    btn.selecttype = 'condition';
                }
                
                $(btn).on("click", function(event) {
                    if (!tool.selecttype) {
                        // включить режим
                        tool.map.handlers.clearselect_button_click();
                        tool._toggleAction(this.selecttype);
                        $('#' + tool.toolname + '_' + tool.selecttype).addClass('control-button-active');
                    }else{
                        if (tool.selecttype == this.selecttype) {
                            // выключить текущий режим
                            $(tool.map.eventPane).off('featurelistclick', tool._onFeatureListClick);
                            tool.clearAction();
                            return;
                        }else{
                            // сменить режим
                            if (!tool.canCancel) {
                                return;
                            }
                            tool.map.handlers.clearselect_button_click();                     // сбросить выделение
                            $('#' + tool.toolname + '_' + tool.selecttype).removeClass('control-button-active');
                            tool._toggleAction(this.selecttype);
                            $('#' + tool.toolname + '_' + tool.selecttype).addClass('control-button-active');
                        }
                    }
                });
            }
        },
        
        /**
         * Переключить обработчик выделения объектов
         * @method _toggleAction
         * @param id - идентификатор задачи
         */
        // ===============================================================
        _toggleAction: function(id) {
            
            if (!id) {
                return false;
            }
            
            var map = this.map, draw_all = false;
            
            if (!this.isActive) {
                map.setTask(this);
            }
            
            this.clear();
            
            if (id == 'specified') {
                draw_all = true;
            }
            
            var actionSelect = new GWTK.SelectMapObjectActionHover(this, {
                fn_setselectlayers: this._setselectlayers,
                drawall: draw_all
            });
            
            actionSelect.name = 'SelectMapObjectActionHover_Special';
            
            if (actionSelect.error) {
                console.log(w2utils.lang('Error when creating object SelectMapObjectActionHover'));
                return;
            }
            
            if (map.setAction(actionSelect)) {
                this.action = actionSelect;
            }else{
                actionSelect.clear();
                return;
            }
            
            this.selecttype = id;
            
            $(this.map.eventPane).off('featurelistclick', this._onFeatureListClick);
            $(this.map.eventPane).on('featurelistclick', this._onFeatureListClick);
            
            
            return;
        },
        
        /**
         * Возращает массив слоев с возможностью выбора объектов
         * @method setselectlayers
         */
        // ===============================================================
        _setselectlayers: function() {
            return this.maplayersid;
        },
        
        /**
         * Инициализация обработчиков событий
         * @method initEvents
         */
        // ===============================================================
        initEvents: function() {
            
            var task = this;
            $(this.map.eventPane).on("closeaction." + task.toolname, function(e) {
                if (!task || !e || !e.action) return;
                $('#' + task.toolname + '_' + task.selecttype).removeClass('control-button-active');
                if (!task.action) return;
                if (task.action.name && task.action.name === e.action) {
                    task.action.clear();
                    task.selecttype = false;
                    task.action = false;
                    $(task.map.eventPane).off('featurelistclick', task._onFeatureListClick);
                }
            });
            
            $(this.map.eventPane).on('visibilitychanged.' + task.toolname, function(e) {
                task.getMapLayers();
                if (task.action) {
                    task.action.selectlayersid = task.maplayersid;
                }
            });
            
            $(this.map.eventPane).on('getsembyobjnumber.' + task.toolname, function(e) {
                if (task._skipselectobjects) return;
                
                if (e && e.answer && e.answer.restmethod == 'GetSemByObjNumber' && e.answer.message == 'OK') {
                    // проверить наличие семантик, влияющих на вид
                    var viewsemantic = [];
                    for (var i = 0; i < e.answer.rscobject.rscsemantics.length; i++) {
                        if (e.answer.rscobject.rscsemantics[i].enable == 3) {
                            viewsemantic.push({
                                name: e.answer.rscobject.rscsemantics[i].shortname,
                                value: e.answer.rscobject.rscsemantics[i].textvalue
                            });
                        }
                    }
                    task._selectObjects(viewsemantic);
                }else{
                    console.log(w2utils.lang("Failed to get data"));
                }
            });
            
            $(this.map.eventPane).on('overlayRefresh.SelectSpecified', function(event) {
                event.stopPropagation();
                return false;
            });
            
        },
        
        /**
         * Очистить параметры работы задачи
         * @method clear
         */
        // ===============================================================
        clear: function() {
            this.clearAction();
            this.wfsQuery = null;
        },
        
        clearAction: function() {
            if (this.action) {
                this.action.clear();
                this.map.closeAction();
            }
            
            this.selecttype = false;
            this.action = false;
            this.map.statusbar.clear();
            
            return;
        },
        
        /**
         * Выделить объекты
         * @method _selectObjects
         * @param viewSems - массив объектов семантик (имя, значение)
         */
        // ===============================================================
        _selectObjects: function(viewSems) {
            if (!$.isArray(viewSems) || !this.action) {
                return;
            }
            
            var task = this,
                mapobject = task.map.objectManager.selectedFeatures.findobjectsById(task.layer.xId, task.gmlid);
            var typenames = mapobject.layername;
            var codelist = mapobject.code;
            var keylist = mapobject.key;
            var objlocal = task.layer.classifier.getlocalByName(mapobject.spatialposition);
            
            task.canCancel = false;
            GWTK.Util.showWait();
            
            var srv = task.layer.options.url.split("?");
            const httpParams = GWTK.RequestServices.createHttpParams(this.map, { url: srv[0] });
            const restService = GWTK.RequestServices.retrieveOrCreate(httpParams, 'REST');
            // var token = task.map.getToken(),
            //     tokens = undefined;
            // if (token && task.layer.options.token) { tokens = [token]; }
            
            if (viewSems.length == 0) {
                // запросить объекты по типу
                // var url = srv[0] + '?service=wfs&restmethod=getfeature&OUTTYPE=json&objcenter=2&SEMANTIC=1&SEMANTICNAME=1&metric=1&mapid=1&area=1&length=1&layers=' + task.layer.idLayer +
                //           '&TYPENAMES=' + typenames;
                // if (typeof keylist !== 'undefined') {
                //     url += '&KEYLIST=' + keylist;
                // }
                // else {
                //   url += '&CODELIST=' + codelist + "&OBJLOCAL=" + objlocal;
                // }
                //
                // GWTK.Util.doPromise([url], GWTK.Util.bind(task.onSuccessPromise, task), tokens, task.map);
                
                const requestOptions = {
                    OUTTYPE: 'JSON',
                    OBJCENTER: '2',
                    AREA: '1',
                    LENGTH: '1',
                    LAYER: this.layer.idLayer,
                    TYPENAMES: typenames
                };
                if (keylist !== undefined) {
                    requestOptions.KEYLIST = keylist;
                }else{
                    requestOptions.CODELIST = codelist;
                    requestOptions.OBJLOCAL = objlocal;
                }
                
                restService.getFeature(requestOptions, { responseType: 'json' }).then((response) => {
                    this.onSuccessPromise(response.data, response.error);
                }).catch(this.onSuccessPromise);
                
                return;
            }
            
            // запросить объекты по типу и семантике
            var semantics = [], values = [], operations = [], i;
            for (i = 0; i < viewSems.length; i++) {
                semantics.push(viewSems[i].name);
                values.push('val=' + viewSems[i].value);
                operations.push('=');
            }
            // var textfilter = '(' + '(' + semantics.join(',') + ')' + '(' + operations.join(',') + ')' + '(' + values.join(',') + ')' + '(' + 'OR' + '))' +
            //                  '&TYPENAMES=' + typenames + '&CODELIST=' + codelist + "&OBJLOCAL=" + objlocal +
            //                  '&objcenter=2&SEMANTIC=1&SEMANTICNAME=1&metric=1&mapid=1';
            //
            // var url = srv[0] + '?&SERVICE=WFS&METHOD=TEXTSEARCH&OUTTYPE=json&LAYER=' + task.layer.idLayer + '&TEXTFILTER=' + textfilter;
            //
            // GWTK.Util.doPromise([url], GWTK.bind(task.onSuccessPromise, task), tokens, task.map);
            //
            // return;
            
            restService.textSearch({
                TEXTFILTER: '(' + '(' + semantics.join(',') + ')' + '(' + operations.join(',') + ')' + '(' + values.join(',') + ')' + '(' + 'OR' + '))',
                TYPENAMES: typenames,
                CODELIST: codelist,
                OBJLOCAL: objlocal,
                SEMANTIC: '1',
                SEMANTICNAME: '1',
                METRIC: '1',
                OUTTYPE: 'JSON',
                LAYER: this.layer.idLayer
            }, { responseType: 'json' }).then((response) => {
                this.onSuccessPromise(response.data, response.error);
            }).catch(this.onSuccessPromise);
        },
        
        _onFeatureListClick: function(event) {
            if (!event.act || event.act !== 'pickfeature') {
                return;
            }
            if (!this._skipselectobjects) {
                if (!this.action || !this.selecttype) {
                    return;
                }
                
                if (this.selecttype === 'specified') {
                    this._onSelectSpecified(event);
                }else if (this.selecttype == 'condition') {
                    this._onSelectCondition(event);
                }
            }
            
            return;
        },
        
        /**
         * Заполнить описание семантик класса для слоя карты
         * @method getLayerSemantics
         * @param layerid {String} Идентификатор слоя карты
         */
        // ===============================================================
        getLayerSemantics: function(layerid) {
            var maplayer = this.map.tiles.getLayerByIdService(layerid);
            if (!this.layerSemantics || !this.layerSemantics[layerid]) {
                this.layerSemantics = this.layerSemantics || {};
                this.layerSemantics[layerid] = this.layerSemantics[layerid] || [];
                var maplayer = this.map.tiles.getLayerByIdService(layerid);
                if (maplayer && maplayer.classifier) {
                    var tool = this;
                    maplayer.classifier.getLayerSemanticList(
                        function(features, status) {
                            if (status == 'success') {
                                for (var i = 0; i < features.length; i++) {
                                    // сохранить семантики для выбранного слоя
                                    if (features[i].name == '')
                                        continue;
                                    tool.layerSemantics[layerid].push(features[i]);
                                }
                            }
                        });
                }
            }
        },
        
        /**
         * Запросить описание семантики по ключу семантики и id слоя карты
         * @method getSemanticBySemKey
         * @param semkey {String} Ключ семантики
         * @param layerid {String} Идентификатор слоя карты
         * @return {Object} Возвращает объект семантики, либо пустой объект
         */
        // ===============================================================
        getSemanticBySemKey: function(semkey, layerid) {
            if (!semkey || !layerid || !this.layerSemantics) {
                return {};
            }
            if (!this.layerSemantics[layerid]) {
                return {};
            }
            var objects = this.layerSemantics[layerid], sem = {}, len = objects.length, i, j;
            for (i = 0; i < len; i++) {
                var count = objects[i].rscsemantic.length;
                for (j = 0; j < count; j++) {
                    if (objects[i].rscsemantic[j].shortname == semkey) {
                        sem = objects[i].rscsemantic[j];
                        break;
                    }
                }
            }
            return sem;
        },
        
        /**
         * Обработчик события "selectspecified" (выделить указанные)
         * @method onSelectSpecified
         * @param event - объект события
         */
        // ===============================================================
        _onSelectSpecified: function(event) {
            var selectedFeatures = this.map.objectManager.selectedFeatures,
                count = selectedFeatures.selected.length;
            // обновить список выделенных объектов
            
            if (this.showobjpanel) {
                this._skipselectobjects = true;
                // получение семантики
                var semantic = [], len = selectedFeatures.mapobjects.length;
                for (i = 0; i < len; i++) {
                    semantic.push(selectedFeatures.mapobjects[i].semantic);
                }
                for (i = 0; i < len; i++) {
                    if (semantic[i].semantics.length == 0) continue;
                    var maplay = this.map.tiles.getLayerByGmlId(semantic[i].mapobject.gid);
                    if (!maplay) continue;
                    // имя rsc
                    var rscname = maplay.classifier.getName();
                    for (var j = 0; j < semantic[i].semantics.length; j++) {
                        var shortname = semantic[i].semantics[j].shortname;
                        if (!shortname || !semantic[i].semantics[j].value) {
                            continue;
                        }
                        this.getLayerSemantics(maplay.idLayer);
                        var sem = this.getSemanticBySemKey(shortname, maplay.idLayer);
                        if ($.isEmptyObject(sem)) {
                            console.log(w2utils.lang('Semantic is not found!') + ' ' + w2utils.lang('name') + ':"' + shortname + '" ' + w2utils.lang('layer') + ':"' + maplay.idLayer + '"');
                            continue;
                        }
                        selectedFeatures.mapobjects[i].semantic.semantics[j].name = sem.name;
                    }
                }
                
                $(this.map.eventPane).trigger({
                    "type": "featureinforefreshed",
                    "layers": this.maplayersid,
                    "centering": 0,
                    gid: selectedFeatures.selected[count - 1],
                    act: "showinfo"
                });
                this._skipselectobjects = false;
                this.map.drawSelectedFeatures();
            }
            
        },
        
        /**
         * Обработчик события "selectcondition" (выделить по условному знаку)
         * @method onSelectCondition
         * @param event - объект события
         */
        // ===============================================================
        _onSelectCondition: function(event) {
            this.map.statusbar.set("-");
            this.gmlid = event.gid;
            this.layer = this.map.tiles.getLayerByGmlId(this.gmlid);
            var mapobject = this.map.objectManager.selectedFeatures.findobjectsById(this.layer.xId, this.gmlid);
            
            //this.layer.classifier.getsemanticsobject(GWTK.Util.parseGmlId(mapobject.id).objid);
            mapobject.getsemanticsobject(GWTK.Util.parseGmlId(mapobject.id).objid);
            return;
        },
        
        /**
         * выделить объекты по условному знаку
         * @method onDataLoaded
         * @param response - xml строка
         */
        // ===============================================================
        onSuccessPromise: function(data, errors) {
            this.canCancel = true;
            
            GWTK.Util.hideWait();
            
            if (typeof (data) !== 'object') {
                console.log("GWTK.SelectObjectsTask --> onSuccessPromise : " + w2utils.lang("Error when getting objects list!"));
                console.log(data);
                return;
            }
            // data[] - объекты карты по запросу в json
            var selectedFeatures = this.map.objectManager.selectedFeatures;
            selectedFeatures.clear();
            selectedFeatures.addJsonObjects(data);                           // обновить список выделенных объектов
            selectedFeatures.drawGEOJSON(data, true, true);
            
            if (this.showobjpanel) {
                this._skipselectobjects = true;
                $(this.map.eventPane).trigger({ "type": "featureinforefreshed", "layers": this.maplayersid, "centering": 0 });
                this._skipselectobjects = false;
                this.map.drawSelectedFeatures();
            }
            
            return;
        },
        
        cancel: function() {
            return this.canCancel;
        },
        
        /**
         * Закрыть задачу
         * @method close
         */
        close: function() {
            this.clear();
            this.destroy();
        },
        
        /**
         * Деструктор
         * @method destroy
         */
        destroy: function() {
            
            $(this.map.eventPane).off("closeaction." + this.toolname);
            $(this.map.eventPane).off('visibilitychanged.' + this.toolname);
            $(this.map.eventPane).off('featurelistclick', this._onFeatureListClick);
            $(this.map.eventPane).off('getsembyobjnumber.' + this.toolname);
            
            for (var i = 0; i < this._selecttypes.length; i++) {
                $('#' + this.toolname + '_' + this._selecttypes[i]).off().remove();
            }
        }
    }
    
    GWTK.Util.inherits(GWTK.SelectObjectsTask, GWTK.MapTask);
    
}