/*************************************** Патейчук В.К.  20/05/20 ****
 *************************************** Нефедьева О.   09/04/20 ****
 *************************************** Тазин В.       01/10/18 ****
 *************************************** Помозов Е.В.   10/03/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Компонент "Списки объектов"                   *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {
    /**
     * Компонент списки объектов
     * @class GWTK.featureSamplesControl
     * @constructor GWTK.featureSamplesControl
     */
    GWTK.featureSamplesControl = function(map) {
        this.toolname = "featuresamples";
        this.map = map;
        var that = this;
        
        // Создаем кнопку на панели управления
        var bt = GWTK.DomUtil.create('div', 'control-button control-button-featuresamplescontrol clickable', this.map.panes.toolbarPane);
        bt.id = 'panel_button-featuresamplescontrol';
        bt.title = w2utils.lang('Object lists');
        bt._pane = 'featureSamplesControlPaneParent';
        // Добавляем обработчики событий для кнопки
        $(bt).on('click', function() {
            var button = $("#panel_button-featuresamplescontrol");
            if (button.hasClass("control-button-active")) {
                button.removeClass("control-button-active");
                if (this)
                    $(this.featureSamplesControlPaneParent).hide('slow');
            }else{
                button.addClass("control-button-active");
                this.init();
                $(this.featureSamplesControlPaneParent).show();
                // развернуть общую панель для компонентов (если используется)
                // this.map.showControlsPanel();
                w2ui[this.featureSamplesControlPane.id].resize();
            }
        }.bind(that));
        this.colors = ["#00FF7F", "#00FFFF", "#7FFF00", "#DE3163", "#FFFF00", "#FFA500", "#FF0000"];
        this.scolors = ["#FF0000", "#FFA500", "#FFC0CB", "#5CACEE", "#1874CD", "#00FFFF", "#00FF7F"];
        this.icons = ["M2 14L30 14L8 30L16 2L24 30 z", "M16 2L2 30L30 30 z", "M 2 16 a 7 7 0 0 0 28 0M 2 16 a 7 7 0 0 1 28 0",
            "M 4 4L28 4L28 28L4 28 z", "M 16 2L26 16L16 30L6 16 z"];
        this.samples = {};
        this.svgDraws = {};
        this.recordsArray = [];
        this.objectsArray = {};
        this.map.maptools.push(this);
        
        // Создание панели
        // если указана панель для компонентов, то создаем в ней
        if (this.map.options.controlspanel) {
            this.featureSamplesControlPaneParent = GWTK.DomUtil.create('div', 'map-panel-def-flex featuresamplescontrol-panel-flex', this.map.mapControls);
        }else{
            this.featureSamplesControlPaneParent = GWTK.DomUtil.create('div', 'map-panel-def featuresamplescontrol-panel', this.map.mapPaneOld);
        }
        this.featureSamplesControlPaneParent.id = this.map.divID + '_featureSamplesControlPaneParent';
        
        // если указана панель для компонентов, то перетаскивание недоступно
        if (!this.map.options.controlspanel) {
            this.setDraggable();
        }
        
        // заголовок окна
        this.featureSamplesControlPaneParent.appendChild(
            GWTK.Util.createHeaderForComponent({
                    callback: function() {
                        $("#panel_button-featuresamplescontrol").click();
                    },
                    context: this.toolname,
                    name: w2utils.lang('Object lists'),
                    map: this.map
                }
            ));
        
        this.setResizable();
        
        // Создание контейнера для таблицы
        this.featureSamplesControlPane = GWTK.DomUtil.create('div', 'featuresamplescontrol-grid', this.featureSamplesControlPaneParent);
        this.featureSamplesControlPane.id = 'featureSamplesControlPane';
        
        $(this.featureSamplesControlPaneParent).hide();
        
    };
    
    GWTK.featureSamplesControl.prototype = {
        
        /**
         * Инициализация
         *
         * @method init
         */
        init: function() {
            this.createGrid();
            this.initEvents();
        },
        
        /**
         * Назначение обработчиков событий
         *
         * @method initEvents
         */
        initEvents: function() {
            var that = this;
            $(this.map.eventPane).off('featuresamplescontrol');
            $(this.map.eventPane).on('featuresamplescontrol', function(event) {
                if (!event || !event.maplayer || !event.maplayer.act || !event.maplayer.id)
                    return;
                if (event.maplayer.act == 'checkAmount')
                    that.onlyTri();
            });
            
            // обработка изменений размера панели контролов
            $(this.map.eventPane).on('resizecontrolspanel.' + this.toolname, function(event) {
                // изменить размеры своей панели
                this.resize();
            }.bind(this));
        },
        
        /**
         * Создать таблицу
         */
        createGrid: function() {
            var that = this;
            
            // Создание/обновление таблицы списков
            if (!w2ui[this.featureSamplesControlPane.id]) {
                
                var name = this.featureSamplesControlPane.id;
                
                // кнопки тулбара
                var buttons = {
                    items: [{
                        id: 'show',
                        type: 'button',
                        caption: '',
                        img: 'featuresamplescontrol-icon-show',
                        hint: w2utils.lang('Display selected lists'),
                        onClick: function() {
                            var feature = that;
                            var sel = w2ui[feature.featureSamplesControlPane.id].getSelection();
                            for (var i = 0; i < sel.length; i++) {
                                feature.drawGroup(sel[i]);
                                var id = feature.featureSamplesControlPane.id;
                                if (w2ui[id].get(sel[i])) {
                                    w2ui[id].get(sel[i]).style = "opacity:1";
                                    w2ui[id].get(sel[i]).checked = true;
                                    w2ui[id].unselect(sel[i]);
                                    w2ui[id].refreshRow(sel[i]);
                                    feature.saveToLocalStorage(w2ui[id].get(sel[i]).recid, w2ui[id].get(sel[i]));
                                }
                            }
                        }
                    }, {
                        id: 'hide',
                        type: 'button',
                        caption: '',
                        img: 'featuresamplescontrol-icon-hide',
                        hint: w2utils.lang('Hide selected lists'),
                        onClick: function() {
                            var feature = that;
                            var sel = w2ui[feature.featureSamplesControlPane.id].getSelection();
                            for (var i = 0; i < sel.length; i++) {
                                feature.hideGroup(sel[i]);
                                var id = feature.featureSamplesControlPane.id;
                                w2ui[id].get(sel[i]).style = "opacity:0.4";
                                w2ui[id].unselect(sel[i]);
                                w2ui[id].refreshRow(sel[i]);
                                w2ui[id].get(sel[i]).checked = false;
                                feature.saveToLocalStorage(w2ui[id].get(sel[i]).recid, w2ui[id].get(sel[i]));
                            }
                        }
                    }, /*{      // TODO !
                        id: 'intersection',
                        type: 'button',
                        caption: '',
                        img: 'featuresamplescontrol-icon-intersection',
                        hint: w2utils.lang('Overlay'),
                        onClick: function() {
                            var feature = that;
                            if ($("#id-selectMap").length == 0)
                                $('#grid_' + feature.featureSamplesControlPane.id + '_toolbar').w2overlay({
                                    name: "selectMaps",
                                    html: feature.openSelectMap(),
                                    align: "both",
                                    onHide: function() {
                                        $(this).remove();
                                    }
                                });
                        }
                    },*/ {
                        id: 'overview',
                        type: 'button',
                        caption: '',
                        img: 'featuresamplescontrol-icon-overview',
                        hint: w2utils.lang('List view'),
                        onClick: function() {
                            var feature = that;
                            var sel = w2ui[feature.featureSamplesControlPane.id].getSelection();
                            if (sel.length > 0)
                                feature.showFeatureList(sel[0]);
                        }
                    }
                    
                    ]
                };
                
                // грид
                $(this.featureSamplesControlPane).w2grid({
                    name: name,
                    show: {
                        header: false,
                        toolbar: true,
                        toolbarColumns: false,
                        toolbarSearch: false,
                        toolbarReload: false,
                        toolbarAdd: true,
                        toolbarDelete: true,
                        toolbarSave: false,
                        toolbarEdit: false,
                        footer: false,
                        lineNumbers: true,
                        selectColumn: true,
                        expandColumn: false
                    },
                    columns: [{
                        field: 'name',
                        caption: w2utils.lang('List name'),
                        size: "40%",
                        suffix: '',
                        editable: {
                            type: 'text'
                        },
                        render: function(record) {
                            if (record.changes && record.changes.name) {
                                var rewrite = true;
                                for (var i = 0; i < w2ui[that.featureSamplesControlPane.id].records.length; i++) {
                                    if (w2ui[that.featureSamplesControlPane.id].records[i].name == record.changes.name) {
                                        rewrite = false;
                                        break;
                                    }
                                }
                                if (rewrite) {
                                    record.name = record.changes.name;
                                    record.name = record.name.replace(/&amp;/g, "&");
                                    that.saveToLocalStorage(record.recid, record);
                                }
                                delete record.changes;
                            }
                            return record.name + ', ' + w2utils.lang('objects count') + ': ' + record.count;
                        }
                    }, {
                        field: 'imglist',
                        caption: w2utils.lang('Marker'),
                        size: "60px",
                        attr: "align=center",
                        title: ""
                    }],
                    onAdd: function(event) {
                        if ($("#id-selectMap").length != 0) {
                            var checkedCheckbox = document.forms.selectMapform.querySelectorAll('[type="checkbox"]:checked');
                            if (checkedCheckbox.length != 2) {
                                w2utils.lang("Two maps must be selected");
                                return;
                            }
                            var layers = {};
                            layers["methodName"] = "mathBuildCrossLayers";
                            layers["members"] = {};
                            for (var i = 0; i < checkedCheckbox.length; i++) {
                                var lay = that.map.tiles.getLayerByxId(checkedCheckbox[i].name);
                                layers["members"]["LayerName" + (i + 1)] = lay.idLayer;
                                if (lay.typeNames)
                                    layers["members"]["Typenames" + (i + 1)] = lay.typeNames;
                                if (lay["semanticList"])
                                    layers["members"]["SemanticList" + (i + 1)] = lay["semanticList"];
                            }
                            layers["members"]["MapId"] = 1;
                            that.getLayerIntersection(layers);
                        }else
                            that.addList(event);
                        
                    },
                    onDelete: function(event) {
                        if (event.force) {
                            var feature = that;
                            var sel = w2ui[feature.featureSamplesControlPane.id].getSelection();
                            for (var i = 0; i < sel.length; i++) {
                                feature.deleteGroup(sel[i]);
                            }
                        }
                    }
                });
                
                // добавить кнопки в тулбар грида
                for (var i = 0; i < buttons.items.length; i++) {
                    w2ui[name].toolbar.add(buttons.items[i]);
                }
                
                // Проверка localStorage
                if (localStorage["featuresc"]) {
                    this.initLS();
                }
            }else{ // таблица уже существует, обновим
                w2ui[this.featureSamplesControlPane.id].refresh();
            }
        },
        
        /**
         * Загрузка из localstorage
         *
         * @method initLS
         */
        initLS: function() {
            var records = localStorage["featuresc"].split("&amp;&amp;");
            for (var i = 0; i < records.length; i++) {
                if (records[i] == "")
                    continue;
                this.recordsArray.push(records[i]);
                var rec = records[i].split("&amp;");
                var recObj = {};
                for (var j = 0; j < rec.length; j++) {
                    if (rec[j] == "")
                        continue;
                    var param = /(\w+):(.+)/.exec(rec[j]);
                    recObj[param[1]] = param[2];
                }
                recObj.recid = parseInt(recObj.recid);
                if (recObj["changes"])
                    recObj["changes"] = { name: recObj["changes"].split(":")[1] };
                var lmap = this.map;
                var request = null;
                const xmlRpcParams = {};
                switch (recObj.methodName) {
                    case "mathBuildCrossLayers" :
                        request = recObj.methodName;
                        this.objectsArray[recObj.recid] = {};
                        this.objectsArray[recObj.recid]["methodName"] = recObj.methodName;
                        this.objectsArray[recObj.recid]["members"] = {};
                        xmlRpcParams['LAYERNAME1'] = this.objectsArray[recObj.recid]["members"]["LayerName1"] = recObj.LayerName1;
                        xmlRpcParams['LAYERNAME2'] = this.objectsArray[recObj.recid]["members"]["LayerName2"] = recObj.LayerName2;
                        if (recObj.Typenames1)
                            xmlRpcParams['TYPENAMES1'] = this.objectsArray[recObj.recid]["members"]["Typenames1"] = recObj.Typenames1;
                        if (recObj.Typenames2)
                            xmlRpcParams['TYPENAMES2'] = this.objectsArray[recObj.recid]["members"]["Typenames2"] = recObj.Typenames2;
                        if (recObj.SemanticList1)
                            xmlRpcParams['SEMANTICLIST1'] = this.objectsArray[recObj.recid]["members"]["SemanticList1"] = recObj.SemanticList1;
                        if (recObj.SemanticList2)
                            xmlRpcParams['SEMANTICLIST2'] = this.objectsArray[recObj.recid]["members"]["SemanticList2"] = recObj.SemanticList2;
                        if (recObj.MapID)
                            xmlRpcParams['MAPID'] = this.objectsArray[recObj.recid]["members"]["MapID"] = recObj.MapID;
                        xmlRpcParams['REQUESTID'] = this.objectsArray[recObj.recid]["members"]["RequestId"] = recObj.recid;
                        break;
                    default :
                        this.objectsArray[recObj.recid] = {};
                        this.objectsArray[recObj.recid]["methodName"] = recObj.methodName;
                        this.objectsArray[recObj.recid]["members"] = {};
                        xmlRpcParams['IDLIST'] = recObj.IdList;
                        this.objectsArray[recObj.recid]["members"]["IdList"] = recObj.IdList.split(",");
                        xmlRpcParams['LAYER'] = recObj.Layer;
                        this.objectsArray[recObj.recid]["members"]["Layer"] = recObj.Layer.split(",");
                        xmlRpcParams['OUTTYPE'] = this.objectsArray[recObj.recid]["members"]["OutType"] = recObj.OutType;
                        xmlRpcParams['REQUESTID'] = this.objectsArray[recObj.recid]["members"]["RequestId"] = recObj.recid;
                        if (recObj.MapID)
                            xmlRpcParams['MAPID'] = this.objectsArray[recObj.recid]["members"]["MapID"] = recObj.MapID;
                        break;
                }
                
                w2ui[this.featureSamplesControlPane.id].add(recObj);
                this.requestFeatureList(xmlRpcParams, lmap, request);
            }
        },
        
        /**
         * Нанесение объектов на svg-холст
         *
         * @method drawGroup
         * @param recid {String} Идентификатор записи в таблице
         */
        drawGroup: function(recid) {
            var feature = this;
            if (feature.svgDraws[recid]) {
                $("#" + "FeatureSamplesGroup_" + recid).show();
                return;
            }
            var json = feature.samples[recid];
            var record = w2ui[feature.featureSamplesControlPane.id].get(recid);
            var color = record["color"];
            var sColor = record["sColor"];
            var fsamples = $("#FeatureSamples");
            var parent = fsamples.length != 0 ? fsamples[0] : null;
            feature.svgDraws[recid] = new GWTK.svgDrawing(feature.map, "featuresamples", parent, "FeatureSamplesGroup_" + recid, null);
            var options = {
                "stroke-width": "2px",
                "vector-effect": "non-scaling-stroke",
                "stroke": sColor,
                "fill": color,
                "fill-opacity": "0.75",
                "background": "",
                "background-size": "auto auto",
                "marker": record.path
            };
            try {
                feature.svgDraws[recid].draw(json, true, options);
            } catch (e) {
                this.deleteGroup(recid);
                w2ui[feature.featureSamplesControlPane.id].remove(recid);
                console.log(w2utils.lang("Incorrect visualization parameters list record has been deleted!"));
                console.log(e, "recid:" + recid);
            }
        },
        
        /**
         * Скрыть объекты списка
         *
         * @method hideGroup
         * @param recid {String} Идентификатор записи в таблице
         */
        hideGroup: function(recid) {
            $("#" + "FeatureSamplesGroup_" + recid).hide();
        },
        
        /**
         * Удалить список
         *
         * @method deleteGroup
         * @param recid {String} Идентификатор записи в таблице
         */
        deleteGroup: function(recid) {
            $("#" + "FeatureSamplesGroup_" + recid).remove();
            var feature = this;
            if (feature.svgDraws[recid]) {
                delete feature.svgDraws[recid];
            }
            if (feature.samples[recid]) {
                delete feature.samples[recid];
            }
            if (feature.objectsArray[recid]) {
                delete feature.objectsArray[recid];
            }
            
            // Удалить запись из localStorage
            var newrecordsArray = [];
            for (var i = 0; i < feature.recordsArray.length; i++) {
                if (feature.recordsArray[i].match(/recid:(\d+)&amp;/) && feature.recordsArray[i].match(/recid:(\d+)&amp;/)[1] == recid) {
                    continue;
                }
                newrecordsArray.push(feature.recordsArray[i]);
            }
            feature.recordsArray = newrecordsArray;
            localStorage.setItem("featuresc", feature.recordsArray.join("&amp;&amp;"));
        },
        
        /**
         * Добавление выбранных объектов
         *
         * @method addList
         * @param event {Object} Событие
         * @param grid {String} Идентификатор таблицы
         */
        addList: function(event, grid) {
            if (!grid)
                grid = this.featureSamplesControlPane.id;
            var pnum = 1;
            for (var i = 0; i < w2ui[grid].records.length; i++) {
                if (w2ui[grid].records[i].recid >= pnum)
                    pnum = parseInt(w2ui[grid].records[i].recid) + 1;
            }
            this.objectsArray[pnum] = {};
            this.objectsArray[pnum]["methodName"] = "GetFeature";
            this.objectsArray[pnum]["members"] = {};
            this.objectsArray[pnum]["members"]["IdList"] = [];
            this.objectsArray[pnum]["members"]["Layer"] = [];
            this.objectsArray[pnum]["members"]["OutType"] = "json";
            this.objectsArray[pnum]["members"]["RequestId"] = "" + pnum;
            var mapObjects = this.map.getSelectedObjects(); //this.map.searchManager.mapObjects; //this.map.selectedObjects;
            if (mapObjects) {
                for (var i = 0; i < mapObjects.length; i++) {
                    if (!mapObjects[i].mapId)   //["wmtsId"])
                        continue;
                    if ($.inArray(mapObjects[i].gmlId, this.objectsArray[pnum]["members"]["IdList"]) == -1)
                        this.objectsArray[pnum]["members"]["IdList"].push(mapObjects[i].gmlId);
                    if ($.inArray(mapObjects[i].mapId, this.objectsArray[pnum]["members"]["Layer"]) == -1)
                        this.objectsArray[pnum]["members"]["Layer"].push(mapObjects[i].mapId);
                }
            }
            if (this.objectsArray[pnum]["members"]["IdList"].length == 0 && this.objectsArray[pnum]["members"]["Layer"].length == 0) {
                console.log("No object has been selected");
                return;
            }
            const xmlRpcParams = {
                OUTTYPE: 'json',
                REQUESTID: pnum.toString(),
                LAYER: this.objectsArray[pnum]["members"]["Layer"].join(','),
                IDLIST: this.objectsArray[pnum]["members"]["IdList"].join(',')
            };
            this.objectsArray[pnum]["members"]["MapID"] = "1";
            // var rpc = GWTK.Util.getRequestXmlRpc(this.objectsArray[pnum]);
            // this.requestFeatureList(rpc, null, null);
            this.requestFeatureList(xmlRpcParams, null, null);
        },
        
        /**
         * Получить пересечение слоев
         *
         * @method getLayerIntersection
         * @param jsObj {Object} Параметры слоев в формате JSON
         */
        getLayerIntersection: function(jsObj) {
            var grid = w2ui[this.featureSamplesControlPane.id];
            var pnum = 1;
            for (var i = 0; i < grid.records.length; i++) {
                if (grid.records[i].recid >= pnum)
                    pnum = parseInt(grid.records[i].recid) + 1;
            }
            var request = jsObj["methodName"];
            const xmlRpcParams = {};
            this.objectsArray[pnum] = {};
            this.objectsArray[pnum]["methodName"] = jsObj["methodName"];
            this.objectsArray[pnum]["members"] = {};
            xmlRpcParams['LAYERNAME1'] = this.objectsArray[pnum]["members"]["LayerName1"] = jsObj["members"]["LayerName1"];
            xmlRpcParams['LAYERNAME2'] = this.objectsArray[pnum]["members"]["LayerName2"] = jsObj["members"]["LayerName2"];
            if (jsObj["members"]["Typenames1"])
                xmlRpcParams['TYPENAMES1'] = this.objectsArray[pnum]["members"]["Typenames1"] = jsObj["members"]["Typenames1"];
            if (jsObj["members"]["Typenames2"])
                xmlRpcParams['TYPENAMES2'] = this.objectsArray[pnum]["members"]["Typenames2"] = jsObj["members"]["Typenames2"];
            if (jsObj["members"]["SemanticList1"])
                xmlRpcParams['SEMANTICLIST1'] = this.objectsArray[pnum]["members"]["SemanticList1"] = jsObj["members"]["SemanticList1"];
            if (jsObj["members"]["SemanticList2"])
                xmlRpcParams['SEMANTICLIST2'] = this.objectsArray[pnum]["members"]["SemanticList2"] = jsObj["members"]["SemanticList2"];
            xmlRpcParams['REQUESTID'] = this.objectsArray[pnum]["members"]["RequestId"] = "" + pnum;
            xmlRpcParams['MAPID'] = this.objectsArray[pnum]["members"]["MapID"] = "1";
            // var rpc = GWTK.Util.getRequestXmlRpc(this.objectsArray[pnum]);
            // this.requestFeatureList(rpc, false, request);
            this.requestFeatureList(xmlRpcParams, null, request);
        },
        
        /**
         * Составление и отправка запроса на сервер
         *
         * @method requestFeatureList
         * @param rpc {Object} Параметры для составления запроса в формате XML-RPC
         * @param map {GWTK.Map} Объект карты
         * @param request {String} Тип запроса
         */
        requestFeatureList: function(rpc, map, request) {
            // if (rpc == "undefined" || rpc == "")
            //     return;
            // if (map) {
            //     this.wfs = new MapMath(map.options.url);
            //     if (request == "mathBuildCrossLayers")
            //         this.wfs.onDataLoad = this.onListDataLoadedIntersectionGetJson.bind(this);
            //     else
            //         this.wfs.onDataLoad = this.onListDataLoadedGetJson.bind(this);
            // }else{
            //     this.wfs = new MapMath(this.map.options.url);
            //     if (request == "mathBuildCrossLayers")
            //         this.wfs.onDataLoad = this.onListDataLoadedIntersection.bind(this);
            //     else
            //         this.wfs.onDataLoad = this.onListDataLoaded.bind(this);
            // }
            //
            // this.wfs.postxmlrpc(rpc, this, request);
            GWTK.Util.showWait();
            if (!this.wfs) {
                const httpParams = GWTK.RequestServices.createHttpParams(this.map);
                this.wfs = GWTK.RequestServices.retrieveOrCreate(httpParams, 'REST');
            }
            
            if (request === "mathBuildCrossLayers") {
                this.wfs.mathBuildCrossLayers(rpc).then((result) => {
                    if (result.data) {
                        const data = JSON.stringify(result.data);
                        if (map) {
                            this.onListDataLoadedIntersectionGetJson(data);
                        }else{
                            this.onListDataLoadedIntersection(data);
                        }
                    }
                });
            }else{
                this.wfs.getFeature([rpc]).then((result) => {
                    if (result.data) {
                        const data = JSON.stringify(result.data);
                        if (map) {
                            this.onListDataLoadedGetJson(data);
                        }else{
                            this.onListDataLoaded(data);
                        }
                    }
                })
            }
            
        },
        
        /**
         * Обработка успешного ответа
         *
         * @method onListDataLoaded
         * @param response {Object} Ответ сервера в формате JSON
         */
        onListDataLoaded: function (response) {
			GWTK.Util.hideWait();
            var feature = this;
            var grid = feature.featureSamplesControlPane.id;
            var json = feature.getJSON(response);
            if (!json)
                return;
            var numbers = feature.getNumbers(grid);
            var pnum = numbers[0];
            var lnum = numbers[1] || 1;
            var cnt = json["features"].length;
            feature.samples[pnum] = json;
            var numC = feature.colorNum(pnum, feature.colors.length);
            var numI = feature.colorNum(pnum, feature.icons.length);
            var re = /#/i;
            var svgIcon = "data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cpath d='"
                + feature.icons[numI] + "' fill='" + feature.colors[numC].replace(re, "%23") + "'  stroke='"
                + feature.scolors[numC].replace(re, "%23") + "' stroke-width='2px' vectorEffect='non-scaling-stroke'%3E%3C/path%3E%3C/svg%3E";
            
            w2ui[grid].add({
                recid: pnum,
                name: w2utils.lang("New list") + " " + lnum,
                count: cnt,
                color: feature.colors[numC],
                sColor: feature.scolors[numC],
                imglist: '<img src="' + svgIcon + '">',
                path: feature.icons[numI],
                methodName: feature.objectsArray[pnum]["methodName"],
                IdList: feature.objectsArray[pnum]["members"]["IdList"].join(","),
                Layer: feature.objectsArray[pnum]["members"]["Layer"].join(","),
                OutType: "json",
                MapID: "1",
                checked: false
            });
            w2ui[grid].get(pnum).style = "opacity:0.4";
            w2ui[grid].save();
            feature.saveToLocalStorage(pnum);
        },
        
        /**
         * Обработка успешного ответа (пересечение слоев)
         *
         * @method onListDataLoadedIntersection
         * @param response {Object} Ответ сервера в формате JSON
         */
        onListDataLoadedIntersection: function (response) {
			GWTK.Util.hideWait();
            var feature = this;
            var grid = feature.featureSamplesControlPane.id;
            var json = feature.getJSON(response);
            if (!json)
                return;
            var numbers = feature.getNumbers(grid);
            var pnum = numbers[0];
            var lnum = numbers[1] || 1;
            var cnt = json["features"].length;
            feature.samples[pnum] = json;
            var numC = feature.colorNum(pnum, feature.colors.length);
            var numI = feature.colorNum(pnum, feature.icons.length);
            var re = /#/i;
            var svgIcon = "data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cpath d='"
                + feature.icons[numI] + "' fill='" + feature.colors[numC].replace(re, "%23") + "'  stroke='"
                + feature.scolors[numC].replace(re, "%23") + "' stroke-width='2px' vectorEffect='non-scaling-stroke'%3E%3C/path%3E%3C/svg%3E";
            
            w2ui[grid].add({
                recid: pnum,
                name: w2utils.lang("New list") + " " + lnum,
                count: cnt,
                color: feature.colors[numC],
                sColor: feature.scolors[numC],
                imglist: '<img src="' + svgIcon + '">',
                path: feature.icons[numI],
                methodName: feature.objectsArray[pnum]["methodName"],
                LayerName1: feature.objectsArray[pnum]["members"]["LayerName1"],
                LayerName2: feature.objectsArray[pnum]["members"]["LayerName2"],
                OutType: "json",
                MapID: "1",
                checked: false
            });
            w2ui[grid].get(pnum).style = "opacity:0.4";
            w2ui[grid].save();
            feature.saveToLocalStorage(pnum);
        },
        
        /**
         * Обработка успешного ответа при загрузке из localStorage (пересечение слоев)
         *
         * @method onListDataLoadedIntersectionGetJson
         * @param response {Object} Ответ сервера в формате JSON
         */
        onListDataLoadedIntersectionGetJson: function (response) {
			GWTK.Util.hideWait();
            var feature = this;
            var grid = feature.featureSamplesControlPane.id;
            var json = feature.getJSON(response);
            if (!json)
                return;
            var pnum = json["RequestId"];
            feature.samples[pnum] = json;
            for (var i = 0; i < w2ui[grid].records.length; i++) {
                pnum = parseInt(w2ui[grid].records[i].recid);
                if (w2ui[grid].get(pnum).checked == "true") {
                    if (feature.samples[pnum])
                        feature.drawGroup(pnum);
                    w2ui[grid].get(pnum).style = "opacity:1";
                    w2ui[grid].refreshRow(pnum);
                }else{
                    w2ui[grid].get(pnum).style = "opacity:0.4";
                    w2ui[grid].refreshRow(pnum);
                }
            }
        },
        
        //        // Обработка успешного ответа (пересечение списков)
        //        onListDataLoadedIntersection1: function (response) {
        //            var grid = GWTK.maphandlers.map.featureSamplesControlPane.id;
        //            var feature = GWTK.maphandlers.map.mapTool("FeatureSamples");
        //            var json=feature.getJSON(response);
        //            if (!json)
        //        	return;
        //            var numbers = feature.getNumbers(grid);
        //            var pnum = numbers[0];
        //            var lnum = numbers[1] || 1;
        //            var cnt = json["features"].length;
        //            feature.samples[pnum] = json;
        //            var numC = feature.colorNum(pnum, feature.colors.length);
        //            var numI = feature.colorNum(pnum, feature.icons.length);
        //
        //            var svgIcon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><path d='" + feature.icons[numI] + "' fill='" + feature.colors[numC] + "'  stroke='"+feature.scolors[numC]+"' stroke-width='2px' vectorEffect='non-scaling-stroke'></path></svg>";
        //
        //
        //            w2ui[grid].add({
        //                recid: pnum,
        //                name: "Новый список " + lnum,
        //                count: cnt,
        //                color: feature.colors[numC],
        //                sColor:feature.scolors[numC],
        //                imglist: '<img src="' + svgIcon + '">',
        //                path: "<path d='" + feature.icons[numI] + "' fill='" + feature.colors[numC] + "'); stroke='"+feature.scolors[numC]+"' stroke-width='2'></path>",
        //                methodName: feature.objectsArray[pnum]["methodName"],
        //                LayerName1: feature.objectsArray[pnum]["members"]["LayerName1"],
        //                LayerName2: feature.objectsArray[pnum]["members"]["LayerName2"],
        //                checked: false
        //            });
        //            w2ui[grid].get(pnum).style = "opacity:0.4";
        //            w2ui[grid].save();
        //            feature.saveToLocalStorage(pnum);
        //        },
        
        /**
         * Обработка успешного ответа при загрузке из localStorage
         *
         * @method onListDataLoadedGetJson
         * @param response {Object} Ответ сервера в формате JSON
         */
        onListDataLoadedGetJson: function (response) {
			GWTK.Util.hideWait();
            var feature = this;
            var grid = feature.featureSamplesControlPane.id;
            var json = feature.getJSON(response);
            if (!json)
                return;
            var pnum = json["RequestId"];
            feature.samples[pnum] = json;
            
            for (var i = 0; i < w2ui[grid].records.length; i++) {
                pnum = parseInt(w2ui[grid].records[i].recid);
                if (w2ui[grid].get(pnum).checked == "true") {
                    if (feature.samples[pnum])
                        feature.drawGroup(pnum);
                    if (w2ui[grid].get(pnum)) {
                        w2ui[grid].get(pnum).style = "opacity:1";
                        w2ui[grid].refreshRow(pnum);
                    }
                }else{
                    w2ui[grid].get(pnum).style = "opacity:0.4";
                    w2ui[grid].refreshRow(pnum);
                }
            }
        },
        
        /**
         * Сохранение в LocalStorage
         *
         * @method saveToLocalStorage
         * @param pnum {Number} Порядковый номер в таблице
         * @param record {Object} Запись в таблице
         */
        saveToLocalStorage: function(pnum, record) {
            localStorage.setItem("featuresc", "");
            var curRecord = {};
            if (record) {
                curRecord = record;
                pnum = record.recid;
            }else{
                var grid = this.featureSamplesControlPane.id;
                curRecord = w2ui[grid].get(pnum);
            }
            curRecord.toString = function() {
                var str = "";
                var that = JSON.stringify(this);
                that = JSON.parse(that);
                for (var key in that) {
                    if (typeof that[key] == "object" && !Array.isArray(that[key]))
                        that[key] = curRecord.toString.call(that[key]);
                    str = str + key + ":" + that[key] + "&amp;";
                }
                return str;
            };
            var exist = null;
            for (var i = 0; i < this.recordsArray.length; i++) {
                if (this.recordsArray[i].match(/recid:(\d+)&amp;/)
                    && this.recordsArray[i].match(/recid:(\d+)&amp;/)[1] == pnum) {
                    exist = i;
                    break;
                }
            }
            if (exist != null)
                this.recordsArray[exist] = curRecord.toString();
            else
                this.recordsArray.push(curRecord.toString());
            
            localStorage.setItem("featuresc", GWTK.maphandlers.map.mapTool(this.toolname).recordsArray.join("&amp;"));
        },
        
        /**
         * Поиск оригинального recid и номера "Новый список "#
         *
         * @method getNumbers
         * @param grid {String} Идентификатор таблицы
         * @return {Array} Возвбращает массив вида [#текущий_номер, #номер_для_присвоения]
         */
        getNumbers: function(grid) {
            var pnum = 1;
            var larr = [];
            for (var i = 0; i < w2ui[grid].records.length; i++) {
                if (parseInt(w2ui[grid].records[i].recid) >= pnum)
                    pnum = parseInt(w2ui[grid].records[i].recid) + 1;
                var q = new RegExp(w2utils.lang("New list") + " (\\d+)", 'i');
                var exec = q.exec(w2ui[grid].records[i].name);
                if (exec !== null)
                    larr.push(parseInt(exec[1]));
            }
            var lnum = null;
            var j = 1;
            while (lnum == null) {
                if (jQuery.inArray(j, larr) != -1)
                    j += 1;
                else
                    lnum = j;
            }
            
            return [pnum, lnum];
        },
        
        /**
         * Выбор следующего цвета
         *
         * @method colorNum
         * @param rlength {Number} Длина массива строк
         * @param clength {Number} Длина массива цветов
         * @return {Number} Возвбращает индекс из массива цветов
         */
        colorNum: function(rlength, clength) {
            var num = 0;
            if (rlength >= clength)
                num = this.colorNum(rlength - clength, clength);
            else
                num = rlength;
            return num;
        },
        
        //        // Пересечение списков
        //        getListIntersection: function () {
        //            var grid = GWTK.maphandlers.map.featureSamplesControlPane.id;
        //            var pnum = 1;
        //            for (var i = 0; i < w2ui[grid].records.length; i++) {
        //                if (w2ui[grid].records[i].recid >= pnum)
        //                    pnum = parseInt(w2ui[grid].records[i].recid) + 1;
        //            }
        //
        //            var request="mathBuildCrossLayers";
        //            this.objectsArray[pnum] = {};
        //            this.objectsArray[pnum]["methodName"] = "mathBuildCrossLayers";
        //            this.objectsArray[pnum]["members"] = {};
        //            for (var i = 0; i < sel.length; i++) {
        //                this.objectsArray[pnum]["members"]["IdList"+(i+1)] = w2ui[GWTK.maphandlers.map.featureSamplesControlPane.id]
        //						.get(sel[i]).listString;
        //                this.objectsArray[pnum]["members"]["LayerName"+(i+1)] = w2ui[GWTK.maphandlers.map.featureSamplesControlPane.id]
        //						.get(sel[i]).layersString;
        //            }
        //            this.objectsArray[pnum]["members"]["RequestId"] = pnum;
        //
        //            var rpc = GWTK.Util.getRequestXmlRpc(this.objectsArray[pnum]);
        //            this.map.mapTool("FeatureSamples").requestFeatureList(rpc, false, request);
        //        },
        
        /**
         * Вызов окна выбора слоев для пересечения
         *
         * @method openSelectMap
         * @return {Element} Возвбращает HTML-код окна
         */
        openSelectMap: function() {
            /*создали панель родитель mapPane*/
            var selectMapPane = $("<div></div>");
            selectMapPane.addClass('selectMap-pane');
            selectMapPane[0].id = "id-selectMap";
            /*создали форму*/
            var newLi = document.createElement('form');
            /*установили атрибут id*/
            newLi.setAttribute("id", "id-selectMapform");
            newLi.setAttribute("name", "selectMapform");
            /*добавили атриут name*/
            
            /*получаем все слои*/
            this.selectMapLayers = [];
            this.tempselectMapLayers = this.map.layers;
            for (var ji = 0; ji < this.tempselectMapLayers.length; ji++) {
                if ( this.testServiceLayer(this.tempselectMapLayers[ji]) ) {
                    var trigger = "$('#" + this.map.eventPane.id + "').trigger({ type: 'featuresamplescontrol', maplayer: { id:'" + this.tempselectMapLayers[ji].xId + "', act: 'checkAmount' } }); ";
                    this.selectMapLayers.push('<li  class="draglist" id="' + this.tempselectMapLayers[ji].xId + '">'
                        + '<input onchange="' + trigger + '" type="checkbox" id="selectMap-check-box'
                        + this.tempselectMapLayers[ji].xId + '" name="' + this.tempselectMapLayers[ji].xId + '">'
                        + this.tempselectMapLayers[ji].alias + '</li>');
                }
            }
            /* вывели html в форму */
            $(newLi).html(this.selectMapLayers);
            
            selectMapPane[0].appendChild(newLi);
            
            return selectMapPane[0].outerHTML;
        },

        testServiceLayer: function( layer ) {
            if (!layer) return false;
            const url = layer.options.url.toLowerCase();
            const service = this.map.options.url.toLowerCase();
            if ( url.indexOf( service ) == -1 ) {
                return false;
            }
            return ( layer.visible && layer.selectObject );
        },
        
        /**
         * Гиман - ограничение выбора количества записей для пересечения
         *
         * @method onlyTri
         */
        onlyTri: function() {
            /*Получаем форму по имени*/
            var myForm = document.forms.selectMapform;
            var countCheckbox = myForm.querySelectorAll('[type="checkbox"]'),
                checkedCheckbox = myForm.querySelectorAll('[type="checkbox"]:checked');
            for (var j = 0; j < countCheckbox.length; j++)
                if (checkedCheckbox.length >= 2) {
                    countCheckbox[j].disabled = true;
                    for (var i = 0; i < checkedCheckbox.length; i++)
                        checkedCheckbox[i].disabled = false;
                }else{
                    countCheckbox[j].disabled = false;
                }
        },
        
        /**
         * Получение и обработка ответа от сервера
         *
         * @method getJSON
         * @param response {String} Ответ сервера в формате JSON-строки
         * @return {Object} Возвращает отредактированный слой в формате JSON,
         * либо `null` в случае неудачи
         */
        getJSON: function(response) {
            var json;
            try {
                json = JSON.parse(response);
                for (var feature in json["features"]) {
                    if (!json["features"][feature]["bbox"]) {
                        json["features"][feature]["bbox"] = [];
                        json["features"][feature]["bbox"] = this.coordsArray(json["features"][feature]["geometry"]["coordinates"],
                            json["features"][feature]["bbox"])
                    }
                }
            } catch (e) {
                console.log(e);
                w2alert(e.name + ":" + w2utils.lang("Incorrect data format of the server response!"));
                return null;
            }
            return json;
        },
        
        /**
         * Открывает список объектов выбранного слоя
         *
         * @method showFeatureList
         * @param recid {Number} Номер записи в таблице
         */
        showFeatureList: function(recid) {
            var objpanel = this.map.mapTool("objectlist");
            if (!objpanel)
                objpanel = new GWTK.objectList(this.map);
            var item = w2ui[this.featureSamplesControlPane.id].get(recid);
            
            var jsontemplate = {};
            jsontemplate.bbox = this.samples[recid].bbox || [];
            jsontemplate.type = this.samples[recid].type;
            jsontemplate.features = [];
            var jsonString = JSON.stringify(jsontemplate);
            var jsonList = {};
            var anyMapId = false;
            for (var i = this.samples[recid].features.length - 1; i >= 0; i--) {
                var feature = this.samples[recid].features[i];
                if (feature["properties"]["mapid"]) {
                    anyMapId = true;
                    var layer = this.map.tiles.getLayerByIdService(feature["properties"]["mapid"]);
                    if (!jsonList[layer.xId])
                        jsonList[layer.xId] = JSON.parse(jsonString);
                    jsonList[layer.xId]["features"].push(feature);
                }
            }
            if (!anyMapId)
                console.log("There is no \"mapid\" params.");
            for (var key in jsonList) {
                objpanel.addListObjectsFromJson({
                    xId: key,
                    name: item.name,
                    recid: item.recid
                }, jsonList[key]);
                
            }
        },
        
        /**
         * Вычисление границ объекта из массива координат
         *
         * @method coordsArray
         * @param coordinates {Array} Массив координат
         * @param bbox {Array} Текущие координаты границ объекта
         * @return {Array} Результирующие координаты границ объекта
         */
        coordsArray: function(coordinates, bbox) {
            for (var i = 0; i < coordinates.length; i++) {
                if (typeof (coordinates[i]) == "object") {
                    this.coordsArray(coordinates[i], bbox);
                }
            }
            if (typeof (coordinates[0]) != "object") {
                var coord = [];
                coord[0] = parseFloat(coordinates[0]);
                coord[1] = parseFloat(coordinates[1]);
                if (!bbox[0] || bbox[0] > coord[0])
                    bbox[0] = coord[0];
                if (!bbox[1] || bbox[1] > coord[1])
                    bbox[1] = coord[1];
                if (!bbox[2] || bbox[2] < coord[0])
                    bbox[2] = coord[0];
                if (!bbox[3] || bbox[3] < coord[1])
                    bbox[3] = coord[1];
            }
            return bbox;
        },
        
        /**
         * Деструктор
         */
        destroy: function() {
            $(this.map.eventPane).off('featuresamplescontrol');
            $('#panel_button-featuresamplescontrol').off().remove();
            $('#featuresamplescontrol_close').off();
            $(this.featureSamplesControlPaneParent).resizable("destroy");
            if ($(this.featureSamplesControlPaneParent).is('.ui-draggable'))
                $(this.featureSamplesControlPaneParent).draggable("destroy");
            if (w2ui[this.featureSamplesControlPane.id])
                w2ui[this.featureSamplesControlPane.id].destroy;
            $(this.featureSamplesControlPane).remove();
            $(this.featureSamplesControlPaneParent).empty().remove();
        },
        
        /**
         * Установить возможность перемещения панели
         */
        setDraggable: function() {
            if (!this.map)
                return;
            GWTK.panelUI({ draggable: true, $element: $(this.featureSamplesControlPaneParent), resizable: false });
            // var that = this;
            // $(this.featureSamplesControlPaneParent).draggable({
            //     containment: "parent",
            //     cancel:"#featureSamplesControlPane",
            //     distance: 2,
            //     stop: function (event, ui) {
            //         $(that.featureSamplesControlPaneParent).css({'position': 'absolute', 'top': ui.offset.top, 'left': ui.offset.left});
            //     }
            // });
        },
        
        /**
         * Установить возможность изменения размеров окна компонента
         */
        setResizable: function() {
            var that = this;
            $(this.featureSamplesControlPaneParent).resizable({
                handles: 's,w,sw',
                resize: function(event, ui) {
                    ui.position.left = ui.originalPosition.left;
                    $(that.featureSamplesControlPaneParent).css({ width: ui.size.width, height: ui.size.height });
                    $(that.featureSamplesControlPane).css({ height: ui.size.height - 50 });
                    w2ui[that.featureSamplesControlPane.id].resize();
					
					GWTK.Util.fixJqueryResizablePluginFF({
						before: {
							width: ui.originalSize.width,
							height: ui.originalSize.height
						},
						after: {
							width: ui.size.width,
							height: ui.size.height
						}
					});
                },
                stop: function() {
                }
            });
        },
        
        /**
         * Изменить размер дочерних элементов по размеру панели
         */
        resize: function() {
            var panelW = $(this.featureSamplesControlPaneParent).width();
            $(this.featureSamplesControlPane).css({ width: panelW }); // изменить ширину грида
            w2ui[this.featureSamplesControlPane.id].resize();
        }
    };
}
