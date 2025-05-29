/*************************************** Помозов Е.В.  27/02/20 ****
**************************************** Полищук Г.В.  30/01/19 ****
**************************************** Соколова Т.O. 28/07/20 ****
**************************************** Гиман Н.Л.    16/11/17 ****
**************************************** Нефедьева О.  14/07/20 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*           Компонент топологии редактора карты                    *
*                                                                  *
*******************************************************************/


if (window.GWTK) {

    /**
     * Компонент топологии редактора карты    
     * @class GWTK.Topology
     * @constructor GWTK.Topology
     * @param param {Object} - параметры класса  = {
        map:                 Объект карты    
        ,selectlayersid:     Массив идентификаторов слоев, участвующих в выборе объектов для привязки и топологии
        ,objlocal :          Массив номеров локализаций (соответствует ГИС карте: 0 - линейный, 1- площадной, 2 - точечный, 3 - подпись, 4 - векторный, 5 - шаблон)
        ,layerscodelist:  []     Массив внешних кодов объектов rsc карты для слоев карты
        {
          layerid: Идентификатор слоя
          codelist: [] Массив внешних кодов объектов rsc карты
        }
        ,svgid :             Идентификатор для svg холста
        ,nodrawpoint' :      Не отображать точки контуров объектов
        ,topologyoptions:            Параметры топологии
            {"limit": "5",            // Допуск согласования точек (в м)
             "captureradius": "5" }   // Радиус захвата (в м)
        , func : {
             fn_iseditingobject :  функция, проверяющая возможность редактирования объекта 
            ,fn_parentpanel :      функция, возващающая панель родителя для размещения на ней svg холста
            ,fn_drawcustom :       функция отрисовки дополнительных пользовательских элементов на svg холсте
        },
        datasize: - максимальный размер получаемых с сервера данных в байтах (оптимально 1500000)
     }
     * @param context {Object} - контекст вызова
     */
    // ===============================================================
    GWTK.Topology = function (map, param, context) {
        this.error = true;

        // Переменные класса
        this.toolname = 'topology';

        if (!map) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        if (!param) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " param.");
            return;
        }

        this.map = map;
        this.context = context;

        // Панель для рисования объектов
        this.drawoptions =
            {
                "stroke": "transparent", //"white",
                "stroke-width": "2px",
                "stroke-opacity": "0.0",
                "vector-effect": "non-scaling-stroke",
                "fill": "transparent", //"white",
                "background": "",
                "background-size": "auto auto",
                "fill-opacity": "0.0",
                "font-family": "Verdana",
                "font-size": "12px",
                "letter-spacing": "1",
                "startOffset": "2%",
                "text": "",
                 "cursor": "crosshair"
            };

        // Опции для отрисовки объектов топологии
        this.drawtopologyoptions =
                        {
                            "stroke": "lime",
                            "stroke-width": "2px",
                            "stroke-opacity": "1.0",
                            "vector-effect": "non-scaling-stroke",
                            "fill": "yellow",
                            "background": "",
                            "background-size": "auto auto",
                            "fill-opacity": "0.0",
                            "font-family": "Verdana",
                            "font-size": "12px",
                            "letter-spacing": "1",
                            "startOffset": "2%",
                            "text": "",
                             "cursor": "crosshair"
                        };

        // Опции для отрисовки общей топологии
        this.drawtopologyoptionsAll =
                        {
                            "stroke": "lime",
                            "stroke-width": "2px",
                            "stroke-opacity": "1.0",
                            "vector-effect": "non-scaling-stroke",
                            "fill": "gray",
                            "fill-opacity": "0.0",
                            "stroke-dasharray": "10, 5"
                        };

        // Опции для отрисовки контура объекта при наведении мыши
        this.drawoptions_over =
                        {
                            "stroke": "green",
                            "stroke-width": "1px",
                            "stroke-opacity": "1.0",
                            "vector-effect": "non-scaling-stroke",
                            "fill": "green",
                            "background": "",
                            "background-size": "auto auto",
                            "fill-opacity": "1.0",
                            "font-family": "Verdana",
                            "font-size": "12px",
                            "letter-spacing": "1",
                            "startOffset": "2%",
                            "text": "",
                             "cursor": "crosshair"
                        };

        // Опции для отрисовки точки объекта
        this.drawpointoptions =
                {
                    "stroke": "green",
                    "stroke-width": "1px",
                    "stroke-opacity": "1.0",
                    //"vector-effect": "non-scaling-stroke",
                    "fill": "green",
                    "background": "",
                    "background-size": "auto auto",
                    "fill-opacity": "0.8",
                    "font-family": "Verdana",
                    "font-size": "12px",
                    "letter-spacing": "1",
                    "startOffset": "2%",
                    "text": "",
                     "cursor": "crosshair"
                };

        // Опции для отрисовки точки объекта при наведении мыши
        this.drawpointoptions_over =
        {
            "stroke": "green",
            "stroke-width": "1px",
            "stroke-opacity": "1.0",
            //"vector-effect": "non-scaling-stroke",
            "fill": "yellow",
            "background": "",
            "background-size": "auto auto",
            "fill-opacity": "0.8",
            "font-family": "Verdana",
            "font-size": "12px",
            "letter-spacing": "1",
            "startOffset": "2%",
            "text": "",
             "cursor": "crosshair"
        };

        // Опции для отрисовки виртуальной точки объекта
        this.drawpointoptions_virtual =
                {
                    "stroke": "green", // "red", //"yellow",
                    "stroke-width": "1px",
                    "stroke-opacity": "1.0",
                    //"vector-effect": "non-scaling-stroke",
                    "fill": "transparent"//,
                    //"background": "",
                    //"background-size": "auto auto",
                    //"fill-opacity": "0.8",
                    //"font-family": "Verdana",
                    //"font-size": "12px",
                    //"letter-spacing": "1",
                    //"startOffset": "2%",
                    //"text": "",
                    //"cursor": "crosshair"
                };

        // префиксы
        this.prefixPoint = '_point_';
        this.prefixPointGroup = 'points_';
        this.prefixInterfaceJSON = '_interfaceJSON';
        this.prefixTopoGroup = '_topologyJSON';
        this.prefixTopologyParent = 'topologyparent_pane_';
        this.prefixTopologyInterfaceJSON = '_topologyinterfaceJSON';
        this.prefixVirtualPoint = '_virtualpoint';
        this.delimiterMulti = '&';
        this.delimiterPoint = '-';

        // Холст для рисования
        this.svgDraw = null;

        // Массив json объектов с объектами топологии для сопряжения
        this.topologyobjectsJSON = new GWTK.hashmap();
        this.topologyobjectsJSON.forEach = this.forEach;

        // id объектов, которые надо исключить из отображаемых объектов
        this.excludeObjects = new Array();
        // Массив запросов для обращения к серверам
        this.querysEdit = new Array();
        //// Массив объектов для сохранения
        //this.mapobjectssave = new Array();

        // Цена пиксела
        this.pixelSpan = GWTK.tileView.getpixelSpan(this.map.getZoomScale(this.map.options.tilematrix), (this.map.options.crs == 4326));

        // инициализация переменных класса
        this.initparam(param);

        // Флажок, что экран сенсорный
        this.touch = 'ontouchstart' in window;

        this.error = false;

        // Флаг обязательного обновления данных
        this.isUpdate = false;

    };

    GWTK.Topology.prototype = {


        /**
         * Инициализация параметров класса
         * @method initparam
         */
        // ===============================================================
        initparam: function (param) {
            if (!param || param instanceof Object == false)
                return;

            // Разрушим и почистим все переменные класса
            this.destroy();

            this.selectlayersid = param.selectlayersid;
            this.nodrawpoint = param.nodrawpoint;
            this.objlocal = (param.objlocal && param.objlocal.length > 0) ? param.objlocal.join(',') : "0,1,2,4";
            //this.codelist = (param.codelist && param.codelist.length > 0) ? param.codelist.join(',') : null;
            this.layerscodelist = (param.layerscodelist && param.layerscodelist.length > 0) ? JSON.parse(JSON.stringify(param.layerscodelist)) : null;

            var func = param.func;
            if (func) {
                if (func.fn_iseditingobject) {
                    if (this.context)
                        this.iseditingobject = GWTK.Util.bind(func.fn_iseditingobject, this.context);
                    else {
                        this.iseditingobject = func.fn_iseditingobject;
                    }
                }

                if (func.fn_parentpanel) {
                    if (this.context)
                        this.parentpanel = GWTK.Util.bind(func.fn_parentpanel, this.context);
                    else {
                        this.parentpanel = func.fn_parentpanel;
                    }
                }

                if (func.fn_drawcustom) {
                    if (this.context)
                        this.drawcustom = GWTK.Util.bind(func.fn_drawcustom, this.context);
                    else {
                        this.drawcustom = func.fn_drawcustom;
                    }
                }

                if (func.fn_selectobject) {
                    if (this.context)
                        this.selectobject = GWTK.Util.bind(func.fn_selectobject, this.context);
                    else {
                        this.selectobject = func.fn_selectobject;
                    }
                }
            }

            this.onSvgMouseOver = GWTK.Util.bind(this.onSvgMouseOver, this);
            if (this.selectobject) {
                this.onSvgDblclick = GWTK.Util.bind(this.onSvgDblclick, this);
            }

            this.topologyoptions = (param.topologyoptions) ? param.topologyoptions :
            {
                "limit": "5",                               // Допуск согласования точек (в м)
                "captureradius": "5"                        // Радиус захвата (в м)
            };

            this.topologyoptions.draw = {
                "radiusPoint": "3",
                "radiusoverPoint": "7"
            }

            this.svgid = (param.svgid) ? param.svgid : 'topology_canvas';

            // Ограничение по размеру запрашиваемых данных с сервера на один слой
            this.datasize = (param.datasize) ? param.datasize : 1500000;
        },


        /**
         * Jxbcnbnm переменные класса
         */
        clear: function() {
            this.clearSvgDraw();

            // this.topologyobjectsJSON.clear();
            //
            // // geojson общей топологии
            // this.topologyInterfaceJSON = null;
            //
            // //geolson объект с объектами для сопряжения
            // this.interfaceJSON = null;

            // id текущей точки
            this.currentPoint = null;
            // id текущего объекта
            this.currentObject = null;
            // index текущего json топологии для отрисовки при редактировании
            this.currenttopologyObjectJSON = null;

            // идентификатор точки исходного объекта топологии, для которой был создан объект топологии
            this.currenttopologyPoint = null;
            // id объектов, которые надо исключить из отображаемых объектов
            this.excludeObjects = this.excludeObjects.splice(0, this.excludeObjects.length);

            // Параметры близлежащего объекта, определяются при поиске близлежащих точек объекта
            // координаты всех точек в координатах экрана
            this.nearObjectParam = {
                'id' : null,  // идентификатор svg объекта
                'xid': null,  // идентификатор реального объекта в коллекции interfaceJSON
                'dist': {
                    'distcurr': -1,   // переменная для подсчета расстояния
                    'points': [],     // координаты точек линии,
                    'distances': [],  // массив расстояний до точек в координатах экрана
                    'distancesGeo': [], // массив расстояний до точек в геодезических координатах
                    'mindistance': null,  // минимальное расстояние в координатах экрана
                    'mindistanceGeo': null, // минимальное расстояние в геодезических координатах
                    'nearpoint': {          // ближайшая реальная точка объекта
                        'point': null,
                        'pointnumber': null,
                        'indexinsert': null,   // индекс смещения (0 или 1) от pointnumber (для вставки виртуальных точек в объъекты топологии)
                        'subjectnumber': null,
                        'pointId': null
                    },
                    'virtualpoint': null // виртуальная точка на линии (находится между points)
                }
            }

            // Режим (создание/редактирование)
            this.action = null;

            // this.querysEdit = new Array();

        },

        /**
         * Разрушить класс
         * @method destroy
         */
        // ===============================================================
        destroy: function () {

            this.clear();

            this.topologyobjectsJSON.clear();

            // geojson общей топологии
            this.topologyInterfaceJSON = null;

            //geolson объект с объектами для сопряжения
            this.interfaceJSON = null;

            this.querysEdit = new Array();

            this.isUpdate = false;

        },


        /**
          * Назначить функции 
          * @method setFunctions
        */
        // ===============================================================
        setFunctions: function (func) {
            if (!func) return;
            if (func.fn_iseditingobject) 
                this.iseditingobject = func.fn_iseditingobject;
            if (func.fn_parentpanel) 
                this.parentpanel = func.fn_parentpanel;
            if (func.fn_drawcustom) 
                this.drawcustom = func.fn_drawcustom;
            if (func.fn_selectobject) 
                this.selectobject = func.fn_selectobject;
        },

        /**
          * Запросить функцию 
          * @method getFunctions
        */
        // ===============================================================
        getFunctions: function () {
            return {
                "fn_iseditingobject": this.iseditingobject,
                "fn_parentpanel": this.parentpanel,
                "fn_drawcustom": this.drawcustom,
                "fn_selectobject": this.selectobject
            }
        },

        /**
        * Скрыть элементы топологии
        * @method hideTopology
        */
        // ===============================================================
        hideTopology: function () {
            var el = document.getElementById(this.prefixPointGroup + this.currentObject);
            if (el)
                $(el).remove();
            el = document.getElementById(this.svgid + this.prefixInterfaceJSON);
            if (el)
                $(el).remove();
        },


        /**
         * Поиск объектов по прямоугольной области
         * @method searchObjectsByAreaFrame
         * @param frame {Array GWTK.toLatLng} Двухмерный массив области поиска 
         * @param excludeObjects {Array String} Массив идентификаторов объектов карты, которые нужно исключить
         * @param action {String} Активный режим редактора карты
         * param selectlayersid Array String Массив идентификаторов слоев карты, на которые делать выборку 
         * @param nomouseover - не подсвечивать в текущий момент объекты по событию mouseover 
		 * @param outputarea {Boolean} добавить в запрос параметры для получения площади и периметра объекьа
         */
        // ===============================================================
        searchObjectsByAreaFrame: function (frame, excludeObjects, action, selectlayersid, nomouseover, message, outputarea) {

            this.map.statusbar.clear();

            this.message = message ? message : null;
			
			this.outputarea = outputarea ? outputarea : false;

            // Создадим холст -------------
            this.createSvgDraw();
            // Нарисуем пользовательские объекты (до запроса топологии, чтобы не было долгой задержки)
            this.drawcustom(this.svgDraw);
            // -------------

            // Если нет обработчика, то не слать запросы
            if (!action || action != 'create' && action != 'edit') {
                return true;
            }

            // Значение пиксела в метрах;
            this.pixelSpan = GWTK.tileView.getpixelSpan(this.map.getZoomScale(this.map.options.tilematrix), (this.map.options.crs == 4326));

            // Габариты области в габаритах экрана
            var framepixel, frame_new;
            if (frame)
                framepixel = [this.svgDraw.geo2svg(frame[0]), this.svgDraw.geo2svg(frame[1])];
            else {
                var ws = this.map.getWindowSize();
                framepixel = [[0, 0], [ws[0], ws[1]]];
            }
            // Габариты области в геодезических координатах
            frame_new = (frame) ? frame : this.toGeo();

            // Если различаются данные, то обновлять запрос с сервера
            // ------------------------------------------------------
            var isupdate = false;
            if (
                ( !this.frame || frame_new[0].lat  != this.frame[0].lat ||
                frame_new[0].lng  != this.frame[0].lng ||
                frame_new[1].lat  != this.frame[1].lat ||
                frame_new[1].lng  != this.frame[1].lng)
                ||
                (!this.framepixel || framepixel[0][0]  != this.framepixel[0][0] ||
                 framepixel[0][1]  != this.framepixel[0][1] ||
                 framepixel[1][0]  != this.framepixel[1][0] ||
                 framepixel[1][1] != this.framepixel[1][1])
            ) {
                isupdate = true;
            }
            else {
                // Сравним слои
                if (
                    ((!this.selectlayersid || this.selectlayersid.length == 0) && (selectlayersid && selectlayersid.length > 0) ) ||
                    (this.selectlayersid && selectlayersid && this.selectlayersid.length != selectlayersid.length ) ||
                    (this.selectlayersid && (!selectlayersid || selectlayersid.length == 0))
                ) {
                    isupdate = true;
                }
                else {
                    if (this.selectlayersid && selectlayersid && this.selectlayersid.length == selectlayersid.length) {
                        for(var i = this.selectlayersid; i < this.selectlayersid.length; i++) {
                            if (this.selectlayersid[1] != selectlayersid[i] ) {
                                isupdate = true;
                                break;
                            }
                        }
                    }
                }
            }
            // ------------------------------------------------------

            // Если необходимо обновить или параметры запроса данных не совпадают
            if (isupdate || this.isUpdate) {// || this.isDifference(frame, selectlayersid)) {

                // Идентификатор запросов
                this.querysId = Math.random();

                this.querysEdit.splice(0, this.querysEdit.length);
                this.response = 0;

                if (nomouseover !== undefined)
                    this.nomouseover = nomouseover;

                this.framepixel = framepixel.slice();
                this.frame = frame_new.slice();

                if (excludeObjects && excludeObjects instanceof Array)
                    this.excludeObjects = excludeObjects;

                this.action = (action) ? action : this.action;
                var layers = (selectlayersid && selectlayersid.length > 0) ? selectlayersid : this.selectlayersid;

                this.interfaceJSON = null;
                if (!this.frame || this.frame.length != 2) return false;

                var valid = ('lat' in this.frame[0] && 'lng' in this.frame[0] && 'lat' in this.frame[1] && 'lng' in this.frame[1]);
                if (!valid) return false;

                var i, len = 0, objlay, srvs = [];
                if (layers)
                    len = layers.length;

                var graphicLayer = [];
                for (i = 0; i < len; i++) {
                    objlay = this.map.tiles.getLayerByxId(layers[i]);

                    if (objlay instanceof GWTK.graphicLayer && objlay.visible) {
                        graphicLayer.push(objlay);
                        continue;
                    }
                    // Невидимые слои или слои, в которых не указан признак выделения
                    if (!objlay || (!objlay.visible && !objlay.options.duty) || !objlay.selectObject) {
                        continue;
                    }
                    if ($.isFunction(objlay.checkViewZoom) && !objlay.checkViewZoom()) {
                        continue;
                    }
                    // if ('url' in objlay && objlay == -1) {
                    //     if (objlay.options.url.indexOf('://') < 0) {
                    //         objlay.options.url = this.map.options.url + "?" + objlay.options.url;
                    //     }
                    // }

                    var srv = objlay.options.url;
                    var question = objlay.options.url.indexOf("?");
                    var el;
                    if (question !== -1) {
                        srv = srv.slice(0, question);
                        el = srvs.find(
                            function (element, index, array) {
                                if (element.srv == srv)
                                    return element;
                            });
                    }

                    var wmtsId = GWTK.Util.getParamsFromURL(objlay.options.url);
                    if ('layer' in wmtsId) wmtsId = wmtsId.layer;
                    else if ('layers' in wmtsId) wmtsId = wmtsId.layers;
                    else continue;

                    var rpclayer = {},
                        idLayer = objlay._idLayerXml();
                    rpclayer.layerid = idLayer;
                    if (objlay.typeNames)
                        rpclayer.typenames = objlay.typeNames;
                    if (objlay.codeList)
                        rpclayer.codelist = objlay.codeList;

                    // Ключи объектов
                    if (typeof objlay.getKeyListParamString === 'function'){
                        var keylist = objlay.getKeyListParamString();
                    }
                    if (keylist) {
                        rpclayer.keylist = keylist.keylist;
                    }

                    if (this.layerscodelist) {
                        this.layerscodelist.find(function (element, index, array) {
                            if (element.layerid == objlay.options.id)
                                rpclayer.codelist = element.codelist.join(',')
                            return element;
                        });
                    }

                    if (!el) {
                        var elem = {"srv": srv, "wmtsId": [idLayer], "rpclayerslist": [rpclayer]};
                        srvs.push(elem);
                    }
                    else {
                        el.wmtsId.push(idLayer);                                // список id слоев сервера
                        el.rpclayerslist.push(rpclayer);
                    }
                }
				
                // формируем запросы
                len = srvs.length;
                for (i = 0; i < len; i++) {
                    var param = {"startindex": 0, "objlocal": this.objlocal};

                    param.layers = srvs[i].rpclayerslist;
                    param.mapid = 1;
                    param.objcenter = 2;
                    param.metric = 1;
                    param.semantic = 1;
                    param.semanticname = 1;					
					if (this.outputarea) {						
					  param.area = 1;	
					  param.length = 1;
					}										
                    param.OutType = 'json';
                    param.bbox = [this.frame[0].lat, this.frame[0].lng, this.frame[1].lat, this.frame[1].lng];
                    param.bbox = param.bbox.toString();
                    param.getframe = 1;
                    param.getkey = 1;

                    var queryEdit = new EditQueries(srvs[i].srv, this.map);
                    queryEdit.onDataLoad = this.onDataLoaded;
                    queryEdit.param = param;
                    queryEdit.querysId = this.querysId;
                    this.querysEdit.push(queryEdit);
                }

                for (var i = 0; i < graphicLayer.length; i++) {
                    this.addinterfaceJSON(graphicLayer[i].GeoJSON);
                }

                len = this.querysEdit.length;
                // нет ни одного запроса
                if (len == 0) {
                    if (graphicLayer.length == 0) {
                        //this.setinterfaceJSON_service('frame', [this.frame[0].lat, this.frame[0].lng, this.frame[1].lat, this.frame[1].lng]);
                        // Без отрисовки слоя топологии
                        this.showSvgDraw();
                    }
                    else {
                        if (this.interfaceJSON) {
                            this.interface_sortJSON();
                            this.showSvgDraw();
                        }
                    }
                    return;
                }


                // отсылаем запросы
                for (i = 0; i < this.querysEdit.length; i++) {
                    this.querysEdit[i].featureex(this.querysEdit[i].param, this);
                }

                $(this.map.mapPane).addClass('processing');

                GWTK.Util.showWait();

            }
            else {
                this.map.statusbar.set(this.message);
                this.showSvgDraw();
            }

            return true;
        },

        /**
         * Создание и отрисовка служебного interfaceJSON 
         * (выполняется при отсутствии слоев или ошибочных запросах)
         * @method setinterfaceJSON_service
         * @param id {String} идентификатор объекта
         * @param bbox {Array[4]} габариты рамки в геодезических координатах
         */
        // ===============================================================
        setinterfaceJSON_service: function (id, bbox) {
            this.interfaceJSON = {
                "bbox": [bbox[1], bbox[0], bbox[3], bbox[2]],
                "features": []
            }
            this.interfaceJSON.features[0] = this.featurebbox_frompgeo('frame', bbox);
            this.showSvgDraw();
            return;
        },


        /**
         * Обработчик ответа сервера
         * @method onDataLoaded
         * @param response {Object} Объект в формате json 
         * @param context {Object} Контекст, инициировавший запрос
         */
        // ===============================================================
        onDataLoaded: function (response, context) {

            if (!response || !context || (context instanceof GWTK.Topology === false) ||
                !this.querysId || this.querysId != context.querysId)
                return;

            var topology = context;

            $(topology.map.mapPane).removeClass('processing');

            try {
                // Переведем в json
                context.response++;

                // console.log(response.length);

                // Проверим ограничение
                if (response.length <= context.datasize) {

                    if (context.response <= context.querysEdit.length) {// это значит, что еще не все запросы обработаны
                        topology.addinterfaceJSON(JSON.parse(response));
                    }

                    if (topology.message)
                        topology.map.statusbar.set(topology.message);
                }
                else {
                    var message = w2utils.lang('Size of the received data') + " (" + response.length + ") " + w2utils.lang('exceeds the limit') + " (" +  context.datasize + ") ";
                    topology.map.statusbar.set(message);
                    GWTK.mapWriteProtocolMessage(this.map, {
                        "text": message, // текст сообщения
                        "display": false // показать всплывающее окно,
                        // "icon": "warning", // имя изображения в окне, "error"/"warning" или ничего}
                        // "height": 100,
                        // "width": 400,
                        // "top": 10
                        // // "duration":2000
                    });
                }
            }
            catch (err) {
                //if (window.console) console.log(err);
            };

            // Нарисуем объекты
            if (context.response == context.querysEdit.length) {
                if (topology.interfaceJSON) {
                    topology.interface_sortJSON();
                    topology.showSvgDraw();
                }
                else {
                    topology.setinterfaceJSON_service('frame', [topology.frame[0].lat, topology.frame[0].lng, topology.frame[1].lat, topology.frame[1].lng]);
                }
            }
			GWTK.Util.hideWait();

            this.isUpdate = false;
        },


        /**
         * Добавление данных в interfaceJSON
         * @method addinterfaceJSON
         * @param geoJSON {Object} Объекты в формате geoJSON, которые 
         * нужно добавить в interfaceJSON
         */
        // ===============================================================
        addinterfaceJSON: function (geoJSON) {
            if (!geoJSON) return;
            if (!this.interfaceJSON) {
                this.interfaceJSON = JSON.parse(JSON.stringify(geoJSON));
                return;
            }
            var i, count;
            if (!geoJSON.features || (count = geoJSON.features.length) == 0)
                return;

            Array.prototype.push.apply(this.interfaceJSON.features, JSON.parse(JSON.stringify(geoJSON.features)));

        },
        
        // родительская панель для размещения svg-холста
        fn_parentpanel: function () {
        },


        /**
         * Создвание Svg - объекта
         * @method showSvgDraw
         */
        // ===============================================================
        createSvgDraw: function () {
            // удалим, если что-то было
            this.clearSvgDraw();

            var parent = this.parentpanel();
            if (!parent) return;

            this.drawpanel = document.getElementById(this.prefixTopologyParent + this.svgid);
            if (!this.drawpanel) {
                this.drawpanel = GWTK.DomUtil.create('div', 'mapeditorsvgdrawing-panel', parent);
                this.drawpanel.id = this.prefixTopologyParent + this.svgid;
                this.drawpanel.style.zIndex = parseInt($(parent).css('z-index')) - 1;
                this.drawpanel.style.position = 'absolute';
            }

            var eventSets = [];
            if (!this.nomouseover)
                eventSets = ["mouseover"];

            if (this.selectobject) {
                eventSets.push("click");
            }
            this.svgDraw = new GWTK.EditSvgDrawing(this.map, {
                'id' : 'topology_pane',
                'parent' : this.drawpanel,
                'svgid' : this.svgid,
                'eventSets': eventSets
            }, this);
            if (this.svgDraw.error) {
                this.svgDraw = null;
            }
        },

        /**
         * Отрисовка Svg - объекта
         * @method showSvgDraw
         */
        // ===============================================================
        showSvgDraw: function () {

            // Создадим холст
            if (!this.svgDraw) {
                this.createSvgDraw();
            }
            if (!this.svgDraw) {
                return;
            }

            // Синхронизация объектов топологии и interfaceJSON
            this.synchronization();

            // Найдем первый дочерний элемент и вставим перед ним
            var before = null, 
                childs = $('#' + this.svgid).children();
            if (childs && childs.length > 0) {
                before = childs[0];
            }
            // Отрисовать
            // Если только служебная рамка, то не рисовать JSON
            var isFrame = (this.interfaceJSON && this.interfaceJSON.features.length >= 1 && this.interfaceJSON.features[0].properties.id == "frame");
            if (this.interfaceJSON && !isFrame) {
                this.svgDraw.draw(this.interfaceJSON, true, this.drawoptions, this.svgid + this.prefixInterfaceJSON, before);
                this.svgDraw.svgCanvas.setAttributeNS(null, "class", 'topology-svg');
            }

            //// Нарисуем пользовательские объекты
            //this.drawcustom(this.svgDraw);

            // Назначение передачи событий на eventPane
            this.map_events('on');
            //this.setevents();

            // для сенсорных экранов
            if (this.touch)
                this.countclick = 0;

            $(this.map.eventPane).on("svgmouseover", this.onSvgMouseOver);
            if (this.selectobject) {
                $(this.map.eventPane).on("svgclick", this.onSvgDblclick);
            }

        },

        // Функция отрисовки дополнительных элементов на svg холсте
        drawcustom : function(svg) {
        },

        /**
         * Назначение обработчиков в зависимости от флажка action
         * @method setevents
         */
        // ===============================================================
        setevents: function () {
            // Отмена передачи событий на eventPane
            switch (this.action) {
                case 'create': // Если процесс создания
                    this.map_events('off');
                    break;
                case 'edit':
                    this.map_events('on');
                    break;
            }
        },

        /**
         * Обновление обработчиков на svg панели, поскольку
         * событие mouseover для svg назначается раньше, чем wms панель стала видимой после стирания временной панели.
         * @method updateSvgEvents
         */
        // ===============================================================
        updateSvgEvents: function () {
            window.clearInterval(this.timer);
            var temp = $('#' + this.map.tilePane.id + '_temp');
            var _that = this;
            this.timer = window.setInterval(function () {
                if (temp.css('display') == 'none') {
                    if (_that.svgDraw) {
                        _that.svgDraw.updateEvents();
                    }
                    window.clearInterval(_that.timer);
                }
            }, 1200);
            return;
        },


        /**
         * Синхронизация объектов топологии (массив json-объектов topologyobjectsJSON) 
         * и объектов сопряжения (json-объект interfaceJSON)
         * @method synchronization
         */
        // ===============================================================
        synchronization: function () {

            if (!this.interfaceJSON)
                return;

            // Создать объект общей топологии
            this.topologyInterfaceJSON = {
                "bbox": [this.interfaceJSON.bbox[0], this.interfaceJSON.bbox[1], this.interfaceJSON.bbox[2], this.interfaceJSON.bbox[3]],
                "features": []
            };

            this.topologyobjectsJSON.forEach(
                function (value, key) {
                    if (value.features) {
                        var fcount = value.features.length;
                        for (var j = 0; j < fcount; j++) {
                            var id = value.features[j].properties.id;
                            id = id.slice(id.indexOf('.') + 1);
                            // Смотрим исходный json - interfaceJSON
                            var ifcount = this.interfaceJSON.features.length;
                            for (var ii = 0; ii < ifcount; ii++) {
                                var iid = this.interfaceJSON.features[ii].properties.id;
                                iid = iid.slice(iid.indexOf('.') + 1);
                                // Нашли нужный id, заменим объект
                                if (iid == id) {
                                    value.features[j].properties.id = this.interfaceJSON.features[ii].properties.id;
                                    this.interfaceJSON.features[ii] = value.features[j];

                                    // Добавить объект в общую топологию
                                    this.addTopologyInterface(this.interfaceJSON.features[ii]);

                                    break;
                                }
                            }
                        }
                    }
                }, this);

            // отрисовать общую топологию 
            this.drawTopologyInterface();
        },


        /**
         * Добавить объект в общую топологию
         * @method  addTopologyInterface
         * @param feature {Object} json объект feature
         */
        // ===============================================================
        addTopologyInterface: function (feature) {
            var find = -1;
            for (var i = 0; i < this.topologyInterfaceJSON.features.length; i++) {
                if (this.topologyInterfaceJSON.features[i].properties.id == feature.properties.id) {
                    find = i;
                    break;
                }
            }
            if (find >= 0) {
                this.topologyInterfaceJSON.features[find] = feature;
            }
            else {
                this.topologyInterfaceJSON.features.push(feature);
            }
        },

        /**
         * Отрисовать общую топологию
         * @method  drawTopologyInterface
         */
        // ===============================================================
        drawTopologyInterface: function () {
            $('#' + this.svgid + this.prefixTopologyInterfaceJSON).remove();
            if (this.topologyInterfaceJSON.features.length > 0) {
                this.svgDraw.draw(this.topologyInterfaceJSON, true, this.drawtopologyoptionsAll, this.svgid + this.prefixTopologyInterfaceJSON);
            }
        },

        /**
         * Обработчик попадания мыши на объект 
         * @method  onSvgMouseOver
         * @param event {Object} Событие
         */
        // ===============================================================
        onSvgMouseOver: function (event) {
            if (this.nomouseover) return;

            // Подсветить строку в статус баре 
            if (event.dataobject && event.dataobject.target) {
                var objectinfo = $(event.dataobject.target).attr('objectinfo');
                if (objectinfo) {
                    //this.map.statusbar.set(this.message + '... ' + objectinfo);
                    this.map.statusbar.set(((this.message) ? this.message : '') + '... ' + objectinfo);
                }
            }

            if (this.selectobject) {
                if (event.target.id.indexOf(this.prefixPoint) < 0) {
                    var old = this.currentObjectMouseOver;
                    this.onMouseoverAction(event.dataobject || window.event.dataobject);
                    if (this.touch) {
                        if (old && old == this.currentObject) {
                            this.selectobject(event);
                            return;
                        }
                        else
                            this.countclick = 0;

                        this.currentObjectMouseOver = this.currentObject;
                    }
                }
            }
            else {
                if (event.target.id.indexOf(this.prefixPoint) < 0) {
                    this.onMouseoverAction(event.dataobject || window.event.dataobject);
                }
            }

        },

        /**
         * Обработчик нажатия мыши на объекте 
         * @method  onSvgMouseDown
         * @param event {Object} Событие
         */
        // ===============================================================
        onSvgDblclick: function (event) {
            if (this.touch) {
                if (!this.countclick) {
                    // Сбросим выделение объекта
                    this.onMouseoutObject();
                    // Выделим новый объект
                    this.onSvgMouseOver(event);
                    return;
                }
            }
            else {
                if (this.selectobject) {
                    this.selectobject(event);
                }
            }
        },

        /**
         * Включение/отключение обработчиков 
         * @method map_events
         * @param type {String} Флажок 'on' - назначить, 'off' - отключить
         */
        // ===============================================================
        map_events: function (type) {

            if (!this.svgDraw) return;
            var $drawpanel = $(this.drawpanel);

            $drawpanel.off(GWTK.mousedown, this.svgDraw.onSvgEvent);
            $drawpanel.off(GWTK.mouseup, this.svgDraw.onSvgEvent);
            $drawpanel.off(GWTK.mouseleave, this.svgDraw.onSvgEvent);
            $drawpanel.off(GWTK.mousemove, this.svgDraw.onSvgEvent);
            $drawpanel.off(GWTK.click, this.svgDraw.onSvgEvent);
            $drawpanel.off(GWTK.dblclick, this.svgDraw.onSvgEvent);

            if (type == 'on') {
                $drawpanel.on(GWTK.mousedown, this.svgDraw.onSvgEvent);
                $drawpanel.on(GWTK.mouseup, this.svgDraw.onSvgEvent);
                $drawpanel.on(GWTK.mouseleave, this.svgDraw.onSvgEvent);
                $drawpanel.on(GWTK.mousemove, this.svgDraw.onSvgEvent);
                $drawpanel.on(GWTK.click, this.svgDraw.onSvgEvent);
                $drawpanel.on(GWTK.dblclick, this.svgDraw.onSvgEvent);
            }

        },

        /**
        * Стереть отрисованные объекты 
        * @method clearobjects
        */
        // ===============================================================
        clearobjects: function () {

            $(this.map.eventPane).off("svgmouseover", this.onSvgMouseOver);
            $(this.map.eventPane).off("svgclick", this.onSvgDblclick);

            if (this.svgDraw) {
                this.svgDraw.destroy();
            }

        },

        /**
         * Очистить панель рисования и svg-холст
         * @method clearSvgDraw
         */
        // ===============================================================
        clearSvgDraw: function () {
            this.clearobjects();
            // удалим одержимое  
            if (this.svgDraw) {
                $('#' + this.prefixTopologyParent + this.svgid).remove();
                this.svgDraw = null;
            }
        },

        
        /**
         * Очистить дочерние элементы, расположенные на svgid 
         * @method clearChildrensSvgid
         */
        // ===============================================================
        clearChildrensSvgid: function () {
            $('#' + this.svgid).children().remove();
        },

        /**
         * Установить курсор на svg панели
         * @method setcursor
         * @param name {String} Название курсора
         */
        // ===============================================================
        setcursor: function (name) {
            var group = document.getElementById(this.svgid + this.prefixInterfaceJSON);
            if (!group) return;
            var elems = group.childNodes;
            elems = Array.prototype.slice.call(elems); // теперь elems - массив
            for (var i = 0; i < elems.length; i++)
                elems[i].setAttributeNS(null, 'cursor', name);
        },

        /**
         * Найти точку, ближайшую к заданной
         * @method getnearpoint
         * @param point {GWTK.Point} Заданная точка в геодезических координатах
         * @param delta {Float} Расстояние в метрах
         * @param changestyle {Boolean} При значении true - выделяет найденную точку 
         */
        // ===============================================================
        getnearpoint: function (point, delta, changestyle) {
            if (!this.currentObject || !point || point instanceof GWTK.Point == false)
                return;
            delta = parseFloat(delta ? delta : this.topologyoptions.captureradius);
            var group = document.getElementById(this.prefixPointGroup + this.currentObject);
            if (!group) return;

            // пикселы в geo
            var point_geo = this.xy2geo(point);
            if (!point_geo) return;

            var elems = group.childNodes, elid;
            elems = Array.prototype.slice.call(elems); // теперь elems - массив
            var geoout, pixel;
            for (var i = 0; i < elems.length; i++) {
                elid = elems[i].getAttributeNS(null, "id");
                if (elid == undefined || !elid)
                    continue;
                geoout = this.getpointgeo(elid);
                if (geoout) {
                    // Сбросим выделение точки
                    if (changestyle)
                        this.onMouseoutPoint(elid);
                    if (this.distance(point_geo, GWTK.toLatLng(geoout[0], geoout[1])) <= delta) {
                        // Выделим точку
                        if (changestyle) {
                            this.onMouseoverPoint(elid);
                        }
                        var pixel = this.svgDraw.geo2svg([geoout[1], geoout[0]]);
                        return pixel;
                    }
                }
            }

        },


        /**
         * Обработчик mouseover-события объекта
         * @method onMouseoverAction
         * @param event {Object} Событие
         */
        // ===============================================================
        onMouseoverAction: function (event) {

            // Текущий объект
            var targetobj = this.getobjectident_id(event.target.id);

            // Удалим точки предыдущего выбранного объекта
            var id_fromElement, el,
                relatedTarget = event.relatedTarget;
            // Посмотрим откуда пришло
            if (relatedTarget) {
                id_fromElement = relatedTarget.id;
                var obj = this.getobjectident_id(id_fromElement);
                // Если предыдущий и текущий объет равны (пришли от точки текyщего объекта)
                if (targetobj == obj)
                    return;
                // Изменим облик предыдущего контура
                this.onMouseoutObject();
            }

            // Если есть маркер, то подсветим его 
            var marker = document.getElementById('m' + event.target.getAttributeNS(null, "id"));
            if (marker) {
                var style = 'fill:' + this.drawoptions_over["fill"] + '; stroke:' + this.drawoptions_over["stroke"] + '; stroke-width:'
                + this.drawoptions_over["stroke-width"] + '; fill-opacity:' + this.drawoptions_over["stroke-opacity"] + ';' +
                ' vector-effect:' + this.drawoptions_over["vector-effect"] + ';';
                marker.setAttributeNS(null, 'style', style);
            }
            else {
                event.target.setAttributeNS(null, "stroke", this.drawoptions_over.stroke);
                event.target.setAttributeNS(null, "stroke-opacity", this.drawoptions_over["stroke-opacity"]);
            }

            this.deleteoverpoints(event.target);
            this.addoverpoints(event.target, this.drawpointoptions);

            this.currentObject = event.target.id;
        },

        /**
         * Выделение текущего объекта
         * @method MouseoverAction
         * @param id {String} Идентификатор объекта
         */
        // ===============================================================
        MouseoverAction: function (id) {
            // Если есть маркер, то подсветим его 
            var el_pred, el = document.getElementById(id);
            if (!el) return;

            // Определиться с предыдущим контуром и точками нового контура
            if (!this.currentObject)
                this.addoverpoints(el, this.drawpointoptions);
            else {
                if ((el_pred = document.getElementById(this.currentObject))) {
                    // Изменим облик предыдущего контура
                    this.onMouseoutObject();
                    // Удалим точки предыдущего выбранного объекта
                    this.deleteoverpoints(el_pred);
                }
                this.addoverpoints(el, this.drawpointoptions);
            }

            // Подсветить текущий контур
            var marker = document.getElementById('m' + el.getAttributeNS(null, "id"));
            if (marker) {
                var style = 'fill:' + this.drawoptions_over["fill"] + '; stroke:' + this.drawoptions_over["stroke"] + '; stroke-width:'
                + this.drawoptions_over["stroke-width"] + '; fill-opacity:' + this.drawoptions_over["stroke-opacity"] + ';' +
                ' vector-effect:' + this.drawoptions_over["vector-effect"] + ';';
                marker.setAttributeNS(null, 'style', style);
            }
            else {
                el.setAttributeNS(null, "stroke", this.drawoptions_over.stroke);
                el.setAttributeNS(null, "stroke-opacity", this.drawoptions_over["stroke-opacity"]);
            }

            this.currentObject = id;

        },


        onMouseoutObject: function () {
            // Изменим облик предыдущего контура
            var el = document.getElementById(this.currentObject);
            if (el) {
                this.deleteoverpoints(el);
                el.setAttributeNS(null, "stroke", this.drawoptions.stroke);
                el.setAttributeNS(null, "stroke-opacity", this.drawoptions["stroke-opacity"]);

                // Если есть маркер, то потушим его 
                var marker = document.getElementById('m' + this.currentObject);
                if (marker) {
                    var style = 'fill:' + this.drawoptions["fill"] + '; stroke:' + this.drawoptions["stroke"] + '; stroke-width:'
                        + this.drawoptions["stroke-width"] + '; fill-opacity:' + this.drawoptions["stroke-opacity"] + ';' +
                        ' vector-effect:' + this.drawoptions["vector-effect"] + ';';
                    marker.setAttributeNS(null, 'style', style);
                }
            }
        },

        /**
         * Обработчик mouseover-события точки
         * @method onMouseoverPoint
         * @param id {String} Идентификатор точки
         * @param virtual {Boolean} Признак виртуальной точки
         */
        // ===============================================================
        onMouseoverPoint: function (id) {
            if (!id) return;
            var el = document.getElementById(id);
            if (!el) return;

            var options = this.drawpointoptions_over;
            var style = 'fill:' + options["fill"] + '; stroke:' + options["stroke"] + '; stroke-width:'
                + options["stroke-width"] + '; fill-opacity:' + options["fill-opacity"] + ';' +
                ' vector-effect:' + options["vector-effect"] + ';';

            document.getElementById(id).setAttributeNS(null, 'style', style);
            document.getElementById(id).setAttributeNS(null, 'r', this.topologyoptions.draw.radiusoverPoint);

            // Запомним точку 
            this.currentPoint = id;
        },

        /**
         * Обработчик mouseout-события точки
         * @method onMouseoutPoint
         * @param id {String} Идентификатор точки
         */
        // ===============================================================
        onMouseoutPoint: function (id) {
            if (!id) return;
            var el = document.getElementById(id);
            if (!el) return;

            var options = this.drawpointoptions;
            var style = 'fill:' + options["fill"] + '; stroke:' + options["stroke"] + '; stroke-width:'
                + options["stroke-width"] + '; fill-opacity:' + options["fill-opacity"] + ';' +
                ' vector-effect:' + options["vector-effect"] + ';';

            el.setAttributeNS(null, 'style', style);
            el.setAttributeNS(null, 'r', this.topologyoptions.draw.radiusPoint);

            // Запомним точку 
            this.currentPoint = null;
        },

        /**
         * Обновление идентификаторов объектов (добавление индекса массива в начале id)
         * @method interface_updateidJSON
         * @param features {Object} Объект features формата json
         */
        // ===============================================================
        interface_updateidJSON: function (features) {
            if (!features) return;
            var i, count = features.length, mass;
            if (this.excludeObjects && this.excludeObjects.length > 0) {
                // Исключить объекты
                for (i = count - 1; i >= 0; i--) {
                    if (this.excludeObjects) {
                        for (var j = this.excludeObjects.length - 1; j >= 0; j--) {
                            if (features[i].properties["id"] == this.excludeObjects[j]) {
                                features.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            }

            // Добавить индекс
            count = features.length;
            for (i = count - 1; i >= 0; i--) {
                if (!features[i] || !features[i].geometry || !features[i].geometry.coordinates)
                    continue;
                mass = features[i].properties["id"].split('.');
                if (mass && mass.length > 2)
                    features[i].properties["id"] = features[i].properties["id"].replace(mass[0] + '.', '');
                features[i].properties["id"] = i.toString() + '.' + features[i].properties["id"];
            }

        },

        /**
         * Сортировка features формата json по уменьшению габаритов
         * @method interface_sortJSON
         */
        // ===============================================================
        interface_sortJSON: function () {
            if (!this.interfaceJSON || !this.interfaceJSON.features || this.interfaceJSON.features.length == 0)
                return;

            // Если у объектов нет bbox, принудительно создать (проверка по первому объекту: или есть или нет)
            var bbox = this.interfaceJSON.features[0].bbox;
            if (!bbox || bbox instanceof Array == false || bbox.length < 4) {
                this.interface_addbboxJSON();
            }

            // Сортировка
            //  < 0 меняют местами
            function sortbbox(a, b) {
                if (!a.bbox || !b.bbox)
                    return 0;
		var a1 = new GWTK.LatLng( a.bbox[1],  a.bbox[0]), a3 = new GWTK.LatLng( a.bbox[3],  a.bbox[2]),
                    al = a1.distanceTo(a3),
                    b1 = new GWTK.LatLng( b.bbox[1],  b.bbox[0]), b3 = new GWTK.LatLng( b.bbox[3],  b.bbox[2]),
                    bl = b1.distanceTo(b3);
                if (bl <= al ||
                    b.geometry.type.toLowerCase().indexOf('point') >= 0)
                    return -1;
                else
                    return 1;
				

            }


            var interfaceJSON_sort = this.interfaceJSON.features.sort(sortbbox);
            if (interfaceJSON_sort) {
                this.interface_updateidJSON(interfaceJSON_sort);
                this.interfaceJSON.features = interfaceJSON_sort;
            }
        },

        /**
         * Перевод точки в координатах экрана в геодезические координаты
         * @method xy2geo
         * @param point {GWTK.Point} 
         * @returns {GWTK.toLatLng} 
         */
        // ===============================================================
        xy2geo: function (point, map) {
            map = this.map || map;
            if (!map) return;
            var coord = map.tiles.getLayersPointProjected(point);
            if (!point || !coord)
                return;
            var geo = GWTK.projection.xy2geo(map.options.crs, coord.y, coord.x);
            return GWTK.toLatLng(geo);
        },

        ///**
        //* Перевод гещдезических координат в координаты svg холста
        //* @method geo2svg
        //* @param geo {Object GWTK.toLatLng}
        //* @returns {Object} Объект {x, y}
        //*/
        //// ===============================================================
        //geo2svg: function (coordinates) {
        //    var place = GWTK.tileView.geo2pixelOffset(this.map, geo);
        //    if (!place) return;
        //    if (Math.abs(place["x"]) > this.pixelLimit / 2 || Math.abs(place["y"]) > this.pixelLimit / 2)
        //        this.error = true;
        //    return [place["x"], place["y"]];
        //},

        /**
         * Преобразование точек габаритов (в координатах экрана) в геодезические координаты
         * @method toGeo
         * @param point1 {GWTK.Point} Минимальная координата
         * @param point2 {GWTK.Point} Максимальная координата
         * @returns {Array} - Массив габаритов в геодезических координатах ([GWTK.toLatLng, GWTK.toLatLng])
         */
        // ===============================================================
        toGeo: function (point1, point2, map) {

            map = this.map || map;
            if (!map) return;
            if (!point1 || !point2) {
                var ws = map.getWindowSize();
                point1 = new GWTK.Point(0, 0);
                point2 = new GWTK.Point(ws[0], ws[1]);
            }

            if (!point1 || !point2) return new Array();

            geo1 =  GWTK.Topology.prototype.xy2geo(point1, map);
            geo2 =  GWTK.Topology.prototype.xy2geo(point2, map);

            var min = GWTK.toLatLng(0, 0), max = GWTK.toLatLng(0, 0);
            if (geo1 && geo2) {
                min.lat = Math.min(geo1.lat, geo2.lat);
                min.lng = Math.min(geo1.lng, geo2.lng);
                max.lat = Math.max(geo1.lat, geo2.lat);
                max.lng = Math.max(geo1.lng, geo2.lng);
            }

            return [min, max];
        },

        /**
         * Создание и отрисовка точек выбранного объекта
         * @method addoverpoints
         * @param target {Element} Элемент 'path' в dom модели (document.getElementById(id))
         * @param options {Object} Параметры рисования
         * @returns {Array} - Массив габаритов в геодезических координатах ([GWTK.toLatLng, GWTK.toLatLng])
         */
        // ===============================================================
        addoverpoints: function (target, options) {
            if (!this.interfaceJSON || !target || this.nodrawpoint) 
                return;

            // определение вложенности координат
            var id = target.getAttributeNS(null, "id"), coord = null, coord1 = null, coord2 = null, coord3 = null,
                xid = target.getAttributeNS(null, "xid");// geo, overlaypoint, json;
            var index = this.getobjectindex_id(id);
            if (!index) return;

            var object = this.interfaceJSON.features[parseInt(index)];
            if (!object || !object.geometry || !object.geometry.type)
                return;

            var options = (options) ? options : this.drawpointoptions;
            var style = 'fill:' + options["fill"] + '; stroke:' + options["stroke"] + '; stroke-width:'
                + options["stroke-width"] + '; fill-opacity:' + options["fill-opacity"] + ';' +
                ' vector-effect:' + options["vector-effect"] + ';';

            // создали группу
            var place, g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttributeNS(null, "id", this.prefixPointGroup + id);
            g.setAttributeNS(null, "style", style);

            // Добавление точек объекта
            switch (object.geometry.type.toLowerCase()) {
                case 'point':
                    place = this.svgDraw.geo2svg(object.geometry.coordinates);
                    if (!this.nodrawpoint) {
                        this.svgDraw.createSVGcircle(id + this.prefixPoint + '0-0', g, { "cx": place["x"], "cy": place["y"], "r": this.topologyoptions.draw.radiusPoint, "style": style });
                    }
                    break;

                case 'linestring':
                case 'multipoint':
                    pcount = object.geometry.coordinates.length;
                    for (var i = 0; i < pcount; i++) {
                        place = this.svgDraw.geo2svg(object.geometry.coordinates[i]);
                        this.svgDraw.createSVGcircle(id + this.prefixPoint + '0-' + i.toString(), g, { "cx": place["x"], "cy": place["y"], "r": this.topologyoptions.draw.radiusPoint, "style": style });
                    }
                    break;

                case 'polygon':
                case 'multilinestring':
                    subcount = object.geometry.coordinates.length;
                    for (var i = 0; i < subcount; i++) {
                        pcount = object.geometry.coordinates[i].length;
                        for (var j = 0; j < pcount; j++) {
                            place = this.svgDraw.geo2svg(object.geometry.coordinates[i][j]);
                            this.svgDraw.createSVGcircle(id + this.prefixPoint + i.toString() + this.delimiterPoint + j.toString(), g, { "cx": place["x"], "cy": place["y"], "r": this.topologyoptions.draw.radiusPoint, "style": style });
                        }
                    }
                    break;

                case 'multipolygon':
                    var coord = object.geometry.coordinates;
                    for (var j = 0; j < coord.length; j++) {
                        pcount = coord[j].length;
                        for (var ii = 0; ii < pcount; ii++) {
                            for (var jj = 0; jj < coord[j][ii].length; jj++) {
                                place = this.svgDraw.geo2svg(object.geometry.coordinates[j][ii][jj]);
                                this.svgDraw.createSVGcircle(id + this.prefixPoint + (j.toString() + this.delimiterMulti + ii.toString()) + this.delimiterPoint + jj.toString(), g, { "cx": place["x"], "cy": place["y"], "r": this.topologyoptions.draw.radiusPoint, "style": style });
                            }
                        }
                    }
                    break;
                default:
                    break;
            }
 
            var before = null;
            if (this.excludeObjects[0]) {
                before = document.getElementById(this.excludeObjects[0].replace(/\./g, '_') + '_objectJSON');
            }

            this.svgDraw.appendElement(g, this.svgDraw.svgCanvas, before);
        },


        /**
         * Отрисовать/стереть виртуальную точкy
         * @method drawVirtualPoint
         * @param place {Object{x,y}} Координаты точки в координатах экрана
         * @param options {Object} Параметры рисования
         */
        // ===============================================================
        drawVirtualPoint: function (place, id, options) {

            id = (id) ? id : this.svgid;
            id += this.prefixVirtualPoint;

            var elem = document.getElementById(id);
            // Удалим существующий, чтоб не плодить
            if (elem) {
                elem.parentNode.removeChild(elem);
            }

            if (place) {
                // Отрисуем
                var options = (options) ? options : this.drawpointoptions_virtual;
                var style = 'fill:' + options["fill"] + '; stroke:' + options["stroke"] + '; stroke-width:'
                    + options["stroke-width"] + '; fill-opacity:' + options["fill-opacity"] + ';' +
                    ' vector-effect:' + options["vector-effect"] + ';';
                var before = null;
                if (this.excludeObjects[0]) {
                    before = document.getElementById(this.excludeObjects[0].replace(/\./g, '_') + '_objectJSON');
                }
                this.svgDraw.createSVGcircle(id, null, { "cx": place["x"], "cy": place["y"], "r": this.topologyoptions.draw.radiusoverPoint, "style": style }, null, before);

            }
        },


        //  Удаление группы точек выбранного объекта
        deleteoverpoints: function (target) {
            // Если это объект, удалить точки


            if (target.id.indexOf(target.id + this.prefixPoint) >= 0)  // Если это точка
                return;

            var id = target.getAttributeNS(null, "id");
            if (!id) return;
            this.deleteoverpoints_id(this.prefixPointGroup + id);
        },

        //  Удаление группы точек выбранного объекта по id = "points_..."
        deleteoverpoints_id: function (id) {
            if (!id) return;

            var el = document.getElementById(id);
            if (el)
                GWTK.DrawingObject.prototype.removeDomElement(el);
            this.currentPoint = null;
        },

        // Запросить идентификатор объекта по идентификатору точки
        getobjectident_id: function (id) {
            if (!id) return;

            // Найдем index oбъекта и точку
            var mass = id.split(this.prefixPoint);
            if (!mass || mass.length == 0)
                return;
            return mass[0];
        },

        // Запросить индекс объекта по идентификатору объекта
        getobjectindex_id: function (id) {
            if (!id) return;

            // если это не маркер
            if (id.substr(0,1) == 'm')
                id = id.substring(1);
            // Найдем index oбъекта и точку
            var mass = id.split('_');
            // Берем 1 элемент, поскольку в 0 лежит префикс объекта для уникальной идентификации DOM элементов
            if (!mass || mass.length < 1)
                return;
            return mass[1];

        },

        // Запросить геодезические координаты точки по id  
        // Возвращает [B,L]
        getpointgeo: function (id) {
            if (!this.interfaceJSON || !id) return;

            var mass = id.split(this.prefixPoint);
            if (!mass || mass.length < 2)
                return;
            // var index = mass[0].split('_'), object;
            // if (!index || index.length == 0)
            //     return;
            // найдем индекс
            var index = this.getobjectindex_id(id);
            if (index >= 0) {
                object = this.interfaceJSON.features[parseInt(index)];
                if (!object || !object.geometry || !object.geometry.type)
                    return;

                // Найдем подобъект и точку
                var identpoint = this.topopointids(mass[1]),
                    is, ip;
                if (identpoint) {
                    is = identpoint.isubj;
                    ip = identpoint.ipoint;

                    switch (object.geometry.type.toLowerCase()) {
                        case 'point':
                            return [object.geometry.coordinates[1], object.geometry.coordinates[0]];

                        case 'linestring':
                        case 'multipoint':
                            if (!object.geometry.coordinates[ip] || object.geometry.coordinates[ip].length == 0)
                                return;
                            return [object.geometry.coordinates[ip][1], object.geometry.coordinates[ip][0]];

                        case 'polygon':
                        case 'multilinestring':
                            if (is instanceof Array) return;
                            if (!object.geometry.coordinates[is] || !object.geometry.coordinates[is][ip] || object.geometry.coordinates[is][ip].length == 0)
                                return;
                            return [object.geometry.coordinates[is][ip][1], object.geometry.coordinates[is][ip][0]];

                        case 'multipolygon':
                            if (is instanceof Array == false) return;
                            s1 = is[0];
                            s2 = is[1];
                            if (!!object.geometry.coordinates[s1] || !object.geometry.coordinates[s1][s2] || !object.geometry.coordinates[s1][s2][ip] || object.geometry.coordinates[s1][s2][ip].length == 0)
                                return;
                            return [object.geometry.coordinates[s1][s2][ip][1], object.geometry.coordinates[s1][s2][ip][0]];
                        default:
                            break;
                    }
                }

            }
        },

        // идентификатор группы объектов топологии
        topogroupid: function (index, idpoint) {
            index = (index) ? index : this.currenttopologyObjectJSON;
            idpoint = (idpoint) ? idpoint : this.currenttopologyPoint;
            return this.svgid + this.prefixTopoGroup + '_' + index + '_' + idpoint;
        },

        // идентификатор точки группы объектов топологии
        // возвращаеи "4_Ногинский район_88409.0_146" при 
        // id = 4_Ногинский район_88409, isubj = 0, ipoint = 146
        topopointid: function (id, ipolygon, isubj, ipoint) {
            if (ipolygon < 0) {
                if (id && isubj >= 0 && ipoint >= 0) {
                    return id + '.' + isubj + this.delimiterPoint + ipoint;
                }
            }
            else {
                if (id && isubj >= 0 && ipoint >= 0) {
                    return id + '.' + (ipolygon.toString() + this.delimiterMulti + isubj.toString()) + this.delimiterPoint + ipoint;
                }
            }
        },


        // Входит ли точка в допуск
        isinside: function (point, elid, isubj, ipoint, delta, func, ctx) {
            if (!point || !elid || !func) return;

            // Координаты сквозной нумерацией (это из svg)
            var coord = this.svgDraw.getCoords_pixel_byId(elid);
            if (!coord) return;

            // в метрах
            delta = parseFloat(delta ? delta : this.topologyoptions.limit);
            // дотяг в пикселах
            var deltapx = delta / this.pixelSpan;

            // Теперь посмотрим остальные точки
            for (var ii = isubj; ii < coord.length; ii++) {
                for (var jj = ipoint; jj < coord[ii].length; jj++) {
                    if (point.distanceTo(GWTK.point(parseFloat(coord[ii][jj][0]), parseFloat(coord[ii][jj][1]))) <= delta) {
                        return func.call(ctx || this, elid, -1, ii, jj);
                    }
                }
            }

        },

        // массив идентификаторов: объект, подобъект, точка   группы объектов топологии
        // возвращаеи idents = { id : 4_Ногинский район_88409, isubj : 0, ipoint : 146}
        // при pointid = "4_Ногинский район_88409.0_146"  
        topodataids: function (pointid) {
            if (!pointid) return;
            var mass = pointid.split('.');
            if (!mass || mass.length < 2) return;
            var idents = {}, isubj;
            idents.id = mass[0];
            mass = mass[1].split(this.delimiterPoint);
            if (!mass || mass.length < 2) return;
            isubj = mass[0].split(this.delimiterMulti);
            if (!isubj || isubj.length <= 1)
                idents.isubj = parseInt(mass[0]);
            else 
                idents.isubj = [parseInt(mass[0]), parseInt(mass[1])];
            idents.ipoint = parseInt(mass[1]);
            return idents;
        },

        // массив идентификаторов: объект, подобъект, точка   группы объектов топологии
        // возвращаеи idents = { isubj : 1 (или [0,1]), ipoint : 146}
        // при pointid = "1-146"  или "0&1-146"
        topopointids: function (pointid) {
            if (!pointid) return;
            mass = pointid.split(this.delimiterPoint);
            if (!mass || mass.length < 2) return;
            var idents = {}, isubj;
            isubj = mass[0].split(this.delimiterMulti);
            if (!isubj || isubj.length <= 1)
                idents.isubj = parseInt(mass[0]);
            else
                idents.isubj = [parseInt(mass[0]), parseInt(mass[1])];
            idents.ipoint = parseInt(mass[1]);
            return idents;
        },


        // Стереть группу с объектами топологии
        cleardrawtopogroup: function () {
            if (this.currenttopologyObjectJSON != null && this.currenttopologyObjectJSON >= 0 && this.currenttopologyPoint) {
                $('#' + this.topogroupid(this.currenttopologyObjectJSON, this.currentpointtopology).replace(/\s+/g, '\\ ')).remove();
                this.currenttopologyPoint = null;
                this.currenttopologyObjectJSON = null;
            }
        },

        // Нарисовать близлежащие объекты топологии
        drawtopologyobjects: function (point, idpoint, delta) {

            if (!this.interfaceJSON || !this.interfaceJSON.features || this.interfaceJSON.features.length == 0)
                return;

            // Удалить ранее отрисованный
            this.cleardrawtopogroup();

            if (!point || point instanceof GWTK.Point == false || !idpoint)
                return;
            delta = parseFloat(delta ? delta : this.topologyoptions.limit);

            var topologyobjectsJSON = {
                "id": idpoint,
                "point": point,
                "idpoints": new GWTK.hashmap(),
                "type": "FeatureCollection",
                "features": []
            };
            topologyobjectsJSON.idpoints.forEach = this.forEach;

            var group = document.getElementById(this.svgid + this.prefixInterfaceJSON);
            if (!group) return;

            var elems = group.childNodes, elid, bbox, coord, cp, find;
            elems = Array.prototype.slice.call(elems); // теперь elems - массив
            var geoout, pixel, feature, isediting, xid, gid;
            for (var i = 0; i < elems.length; i++) {

                if (elems[i].nodeName != 'path')
                    continue;

                // Входит ли объект в состав редактируемых слоев?
                if (!(elid = elems[i].getAttributeNS(null, "id")))
                    continue;

                if (!(bbox = elems[i].getAttributeNS(null, "bbox")))
                    continue;
 
                if (!(xid = elems[i].getAttributeNS(null, "xid")))
                    continue;

                if (!(gid = xid.slice(xid.indexOf('.') + 1)))
                    continue;

                // Определим входит объект ли в состав редактируемых
                if (!(feature = this.interfaceJSON.features[this.getobjectindex_id(elid)]) || !feature.properties) {
                    isediting = this.iseditingobject(gid);
                }
                else {
                    isediting = this.iseditingobject(gid, feature.properties.code);
                }
                if (!isediting) continue;

                // Запросим габариты в пикселах
                bbox = this.svgDraw.getCoords_pixelByLine(bbox);
                if (!bbox || bbox instanceof Array == false || bbox.length < 2)
                    continue;

                // дотяг в пикселах
                var deltapx = delta / this.pixelSpan;
                // Попадает ли точка в bbox
                if (point.x >= (parseFloat(bbox[0][0]) - deltapx) && point.y >= (parseFloat(bbox[0][1])) - deltapx &&
                    point.x <= (parseFloat(bbox[1][0]) + deltapx) && point.y <= (parseFloat(bbox[1][1]) + deltapx)) {

                    find = this.isinside(point, elid, 0, 0, delta, function (elid, i, ii, jj) {
                        topologyobjectsJSON.features.push(this.interfaceJSON.features[this.getobjectindex_id(elid)]);
                        topologyobjectsJSON.idpoints.put(topologyobjectsJSON.idpoints.count(), this.topopointid(elid, i, ii, jj));
                        return true;
                    }, this);
                }
            }

            // Добавить в массив 
            var count = this.topologyobjectsJSON.count();
            if (topologyobjectsJSON.features.length > 0) {

                // Найдем существующий объект
                var index = this.topologyobjectsJSON.forEach(
                    function (value, key) {
                        if (value.id == idpoint) {
                            return key;
                        }
                    }, this);

                if (index >= 0 || index) {
                    this.currenttopologyObjectJSON = index;
                }
                else {
                    topologyobjectsJSON.bbox = this.interfaceJSON.bbox;
                    this.currenttopologyObjectJSON = count;
                }

                this.topologyobjectsJSON.put(this.currenttopologyObjectJSON, topologyobjectsJSON);
                this.currenttopologyPoint = idpoint;

                // Отрисовать новый в отдельной группе
                var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
                g.setAttributeNS(null, "id", this.topogroupid());
                var before = null;
                if (this.excludeObjects[0]) {
                    before = document.getElementById(this.excludeObjects[0].replace(/\./g, '_') + '_objectJSON');
                }
                // отрисовка текущей топологии
                this.svgDraw.draw(this.topologyobjectsJSON.get(this.currenttopologyObjectJSON), true, this.drawtopologyoptions, this.topogroupid(), before);
            }

        },

        // Добавить ВСЕ близлежащие точки объектов топологии
        addneartopologypoints: function () {
            var topologyobjectsJSON = this.topologyobjectsJSON.get(this.currenttopologyObjectJSON)
            if (!topologyobjectsJSON)
                return;

            var idpoints = new Array();
            topologyobjectsJSON.idpoints.forEach(
                function (value, key) {
                    var idents = this.topodataids(value);
                    var group = document.getElementById(this.svgid + this.prefixInterfaceJSON);
                    if (!group) return;

                    var elems = group.childNodes, elid, coord;
                    elems = Array.prototype.slice.call(elems); // теперь elems - массив
                    var geoout, pixel;
                    var find = false;
                    for (var i = 0; i < elems.length; i++) {
                        elid = elems[i].getAttributeNS(null, "id");
                        // Пропускаем уже просмотренные ранее данные 
                        if (!find) {
                            if (elid != idents.id)
                                continue;
                            else {
                                find = true;
                            }
                        }

                        this.isinside(topologyobjectsJSON.point, idents.id, idents.isubj, idents.ipoint + 1, this.topologyoptions.limit, function (elid, i, ii, jj) {
                            idpoints.push(this.topopointid(elid, i, ii, jj));
                            return true;
                        }, this);

                    }
                }, this);

            // Добавим эти точки в массив точек притяжения 
            var count = idpoints.length;
            if (count > 0) {
                for (var i = 0; i < count; i++) {
                    topologyobjectsJSON.idpoints.put(topologyobjectsJSON.idpoints.count(), idpoints[i]);
                }
            }

            //    var topologyobjectsJSON = this.topologyobjectsJSON[this.currenttopologyObjectJSON];
        },

        // Переместить (перерисовать объекты с новым расположением согласованных точек)
        // updatejson = true - обновление топо json
        // nearObjectParam - параметры для добавление виртуальной (ответной) точки
        dragtopologypoints: function (point, updatejson, nearObjectParam) {
            // Текущие значения 
            // currenttopologyObjectJSON = 1 
            // currenttopologyPoint = "Ногинский район_35698_0_3"

            // Данные для поиска
            // "Ногинский район_35698_0_3" // id topologyobjectsJSON[...] - идентификатор точки привязки
            // "topology_canvas_topologyJSON_1_Ногинский район_35698_0_3" - идентификатор группы, где лежат path(s) объектов топологии

            // Значения для внесения исправлений
            // точки для изменения:
            // "4_Ногинский район_88409.0_146"
            // "20_Ногинский район_36071.0_0"
            // "27_Ногинский район_35699.0_3"

            // пути, соответствующие точкам
            // "4_Ногинский район_88409" - path одного топологии 88409
            // "20_Ногинский район_36071"  - path одного топологии 36071
            // "27_Ногинский район_35699"  - path одного топологии 35699

            var topologyobjectsJSON = this.topologyobjectsJSON.get(this.currenttopologyObjectJSON),
                idents;
            if (!topologyobjectsJSON) {
                return;
            }

            // Пройдемся по общим точкам и изменим метрику
            topologyobjectsJSON.idpoints.forEach(
                function (value, key) {
                    idents = this.topodataids(value);
                    var group = document.getElementById(this.svgid + this.prefixTopoGroup + '_' + this.currenttopologyObjectJSON + '_' + this.currenttopologyPoint);
                    if (!group) return;
                    var elems = group.childNodes, elid, coord;
                    elems = Array.prototype.slice.call(elems); // теперь elems - массив
                    var geoout, pixel;
                    var find = false;
                    for (var i = 0; i < elems.length; i++) {
                        elid = elems[i].getAttributeNS(null, "id");
                        if (elid != idents.id)
                            continue;
                        var objectcoord = this.svgDraw.updateCoordPart(elems[i], idents.isubj, idents.ipoint, [point.x, point.y]);
                        if (updatejson) {
                            this.updatetopologyobject(elid, elems[i].getAttributeNS(null, "xid"), point, idents.isubj, idents.ipoint);
                        }
                    }
                }, this);

            // Удалить группу точек, если она осталась
            if (updatejson) {
                this.deleteoverpoints_id(this.prefixPointGroup + this.currentObject);
            }

            // Отрисовка общей топологии перед исходным json
            this.drawTopologyInterface();
        },


        // Добавить виртуальную точку а исходный json, если есть topologyobjectsJSON, то обновить его
        addVirtualPointToInterfaceJSON: function (nearObjectParam) {
            if (nearObjectParam.target && nearObjectParam.dist && nearObjectParam.dist.nearpoint && nearObjectParam.dist.nearpoint.pointId) {
                var feature = this.getRealFeatureObject(nearObjectParam.target, null, true);
                var idents = this.topopointids(nearObjectParam.dist.nearpoint.pointId);
                this.addVirtualPointToGeometry(feature, nearObjectParam.dist.virtualpoint, idents.isubj, idents.ipoint, nearObjectParam.dist.nearpoint.indexinsert);
            }
        },
        // Добавить виртуальную точку а геометрию объекта и перерисовать объект
        addVirtualPointToGeometry: function (feature, virtualpoint, isubj, ipoint, indexinsert) {
            if (feature && feature.geometry && virtualpoint) {
                this.updategeometry(feature.geometry, virtualpoint, isubj, ipoint, true, indexinsert);
                this.showSvgDraw();
            }
        },


        // Обновить объект топологии в исходном файле топологии
        // id - идентификатор объекта в property
        updatetopologyobject: function (id, xid, point, isubj, ipoint, virtual) {
            var topologyobjectsJSON = this.topologyobjectsJSON.get(this.currenttopologyObjectJSON)
            if (!topologyobjectsJSON)
                return;
            var features = topologyobjectsJSON.features, ifeatures = this.interfaceJSON.features;
            for (var i = 0; i < features.length; i++) {
                if (features[i].properties.id != xid) continue;
                // обновим топо
                this.updategeometry(features[i].geometry, point, isubj, ipoint, virtual);

                // добавить в общую топологию
                this.addTopologyInterface(features[i]);

                // обновим interfaceJSON
                for (var j = 0; j < ifeatures.length; j++) {
                    if (ifeatures[j].properties.id != xid) continue;
                    ifeatures[j] = features[i];
                    // перестроить путь основного interfaceJSON
                    var jqel = $('#' + this.svgid + this.prefixInterfaceJSON + ' ' + '#' + id.replace(/\s+/g, '\\ '))[0];
                    this.svgDraw.updatePart(jqel, ifeatures[j].geometry.coordinates, true);
                    break;
                }
                break;
            }
        },


        // Узнатть порядковый номер (сквозная нумерация контуров мультиполигонов) для изменения координаты точки линии
        // id - идентификатор объекта в property
        serialNumber: function (coord, isubj) {
            if (!isubj || !coord) return -1;
            var k = 0;
            for (var i = 0; coord.length; i++) {
                for (var j = 0; j < coord[i].length; j++) {
                    if (isubj == k) {
                        return [i, j];
                    }
                    k++;
                }
            }
        },


        // обновить json-geometry
        // virtual - признак виртуальной точки
        // indexinsert - индекс вставки для виртуальной точки 0 или 1
        updategeometry: function (geometry, point, is, ip, virtual, indexinsert) {
            geo = this.xy2geo(point), type = null, l = null;
            if (!geo || !geometry) return;

            indexinsert = (indexinsert) ? indexinsert : 0;
            //if (virtual)
            //    ipinsert = (insert == 'after') ? ip + 1 : ip;

            type = geometry.type.toLowerCase();
            switch (type) {
                case 'point':
                    geometry.coordinates[1] = geo.lat;
                    geometry.coordinates[0] = geo.lng;
                    break;

                case 'linestring':
                case 'multipoint':
                    if (!geometry.coordinates[ip] || geometry.coordinates[ip].length == 0)
                        return;
                    if (virtual) {
                        geometry.coordinates.splice(ip + indexinsert, 0, [geo.lng, geo.lat]);
                    }
                    else {
                        geometry.coordinates[ip][1] = geo.lat;
                        geometry.coordinates[ip][0] = geo.lng;
                    }
                    break;

                case 'polygon':
                case 'multilinestring':
                    if (is instanceof Array)  break;

                    if (!geometry.coordinates[is][ip] || geometry.coordinates[is][ip].length == 0)
                        return;
                    if (virtual) {
                        geometry.coordinates[is].splice(ip + indexinsert, 0, [geo.lng, geo.lat]);
                    }
                    else {
                        geometry.coordinates[is][ip][1] = geo.lat;
                        geometry.coordinates[is][ip][0] = geo.lng;
                    }
                    if (type == 'polygon' && ip == 0) { // Замкнуть объект
                        l = geometry.coordinates[is].length;
                        geometry.coordinates[is][l - 1][1] = geo.lat;
                        geometry.coordinates[is][l - 1][0] = geo.lng;
                    }
                    break;

                case 'multipolygon':

                    // Определим наш контур и дырку
                    is = this.serialNumber(geometry.coordinates, is);
                    if (is instanceof Array == false) break;
                    if (!geometry.coordinates[is[0]][is[1]][ip] || geometry.coordinates[is[0]][is[1]][ip].length == 0)
                        return;
                    if (virtual) {
                        geometry.coordinates[is[0]][is[1]].splice(ip + indexinsert, 0, [geo.lng, geo.lat]);
                    }
                    else {
                        geometry.coordinates[is[0]][is[1]][ip][1] = geo.lat;
                        geometry.coordinates[is[0]][is[1]][ip][0] = geo.lng;
                    }
                    if (ip == 0) { // Замкнуть объект
                        l = geometry.coordinates[s1][s2].length;
                        geometry.coordinates[is[0]][is[1]][ip][l - 1][1] = geo.lat;
                        geometry.coordinates[is[0]][is[1]][ip][l - 1][0] = geo.lng;
                    }
                    break;

                default:
                    break;

            }
        },


        // Функция для подмены в GWTK.hashmap 
        forEach: function (func, ctx) {
            for (var key in this._data) {
                var data = this._data[key];
                var ret = func.call(ctx || this, data[1], data[0]);
                if (ret >= 0 || ret)
                    return ret;
            }
        },


        /**
        * Сделать клоны объектов для сохранения
        * @method setCloneForSave
        * @param mapobjectssave - массив для сохранения
        * @param k - номер в массиве, с какого надо положить данные
        */
        // ===============================================================
        setCloneForSave: function (mapobjectssave) {
            var map = this.map, id, layers, newjson, mapobject, _that = this, cloneobj;
            if (!map || !mapobjectssave) return;

            // Обновить id в списке объектов топологии, затем обновить сам объект в списке interfaceJSON
            this.topologyobjectsJSON.forEach(
                function (value, key) {
                    if (value.features) {
                        var fcount = value.features.length;
                        for (var j = 0; j < fcount; j++) {
                            // сделаем новый json - объект
                            newjson = {
                                "type": "FeatureCollection",
                                "features": []
                            };
                            newjson.features.push(value.features[j]);
                            id = value.features[j].properties.id;
                            id = id.slice(id.indexOf('.') + 1);
                            newjson.features[0].properties.id = id;
                            layers = map.tiles.getLayersByGmlId(id);
                            if (!layers || layers.length == 0) continue;

                            var mapobject = new GWTK.mapobject(map, id, layers[0].options.id);
                            if (!mapobject.error) {
                                mapobject.loadJSON(newjson, true);
                                mapobject.wmtsId = layers[0].idLayer;
                                mapobjectssave.push({ 'editobject': mapobject.clone(), 'save': false });
                            }
                        }
                    }
                }, this);

            this.topologyobjectsJSON.clear();
        },

        // восстановить топо json из истории
        restoreFromHistory: function (topologyobjectJSON) {
            var index = this.topologyobjectsJSON.forEach(
                function (value, key) {
                    if (value.id == topologyobjectJSON.id) {
                        this.topologyobjectsJSON.put(key, topologyobjectJSON);
                        this.searchObjectsByAreaFrame();
                        return key;
                    }

                }, this);
        },

        // Копия текушего topologyobjectsJSON 
        copytopologyobjectJSON: function () {
            if (this.currenttopologyObjectJSON != null && this.currenttopologyObjectJSON >= 0 && this.topologyobjectsJSON.count() > 0) {
                return JSON.parse(JSON.stringify(this.topologyobjectsJSON.get(this.currenttopologyObjectJSON)));
            }
            return null;
        },

        // Определение возможности редактирования объекта
        iseditingobject: function (gid, code) {
            return false;
        },

        // Родительская панель для размещения svg объектов
        parentpanel: function() { 
            var overlayPane = document.getElementById('overlayPane');
            if (!overlayPane) return;
            var parent = GWTK.DomUtil.create('div', 'overlay-panel', overlayPane);
            parent.id = 'mapobject-overlayPane_' + this.svgid;
            return parent;
        },

        // Функция отрисовки дополнительных элементов на svg холсте
        drawcustom: function (svg) {
        },

        // ========================================================
        // Сервисные функции
        // ========================================================

        // Добавление габаритов объектов в interfaceJSON
        interface_addbboxJSON: function () {
            if (!this.interfaceJSON || !this.interfaceJSON.features)
                return;

            var features = this.interfaceJSON.features, coordinates, countsubs, pcount, min = {}, max = {}, minbbox = {}, maxbbox = {}, type;
            var count = features.length;
            for (var i = 0; i < count; i++) {
                if (!features[i].geometry || !features[i].geometry.coordinates)
                    continue;
                features[i].properties["id"] = i.toString() + '.' + features[i].properties["id"];
                coordinates = features[i].geometry.coordinates;

                // Метрика без подобъектоа
                type = features[i].geometry.type.toLowerCase();
                if (type == 'point') {// один уровень вложенности
                    min.lat = coordinates[1];
                    min.lng = coordinates[0];
                    max.lat = coordinates[1];
                    max.lng = coordinates[0];
                    features[i].bbox = [min.lng, min.lat, max.lng, max.lat];
                }
                else {
                    // двойной уровень вложенности
                    if (type == 'linestring' || type == 'multipoint') {
                        pcount = coordinates.length;
                        if (pcount > 0) {
                            min.lat = coordinates[0][1];
                            min.lng = coordinates[0][0];
                            max.lat = coordinates[0][1];
                            max.lng = coordinates[0][0];
                            for (var jj = 0; jj < pcount; jj++) {
                                min.lat = Math.min(min.lat, coordinates[jj][1]);
                                min.lng = Math.min(min.lng, coordinates[jj][0]);
                                max.lat = Math.max(max.lat, coordinates[jj][1]);
                                max.lng = Math.max(max.lng, coordinates[jj][0]);
                            }
                            features[i].bbox = [min.lng, min.lat, max.lng, max.lat];
                        }
                    }
                    else {
                        if (type == 'multilinestring' || type == 'polygon') {
                            var countsubs = coordinates.length;
                            if (countsubs > 0 && coordinates[0].length > 0) {
                                min.lat = coordinates[0][0][1];
                                min.lng = coordinates[0][0][0];
                                max.lat = coordinates[0][0][1];
                                max.lng = coordinates[0][0][0];
                                for (var j = 0; j < countsubs; j++) {
                                    pcount = coordinates[j].length;
                                    for (var jj = 0; jj < pcount; jj++) {
                                        // Габариты
                                        min.lat = Math.min(min.lat, coordinates[j][jj][1]);
                                        min.lng = Math.min(min.lng, coordinates[j][jj][0]);
                                        max.lat = Math.max(max.lat, coordinates[j][jj][1]);
                                        max.lng = Math.max(max.lng, coordinates[j][jj][0]);
                                    }
                                }
                                features[i].bbox = [min.lng, min.lat, max.lng, max.lat];
                            }
                        }
                        else {
                            if (type == 'multipolygon') {
                                var countpolygon = coordinates.length;
                                if (countpolygon > 0 && coordinates[0].length > 0) {
                                    for (var i = 0; i < countpolygon; i++) {
                                        var countsubs = coordinates[i].length;
                                        if (countsubs > 0 && coordinates[i].length > 0) {
                                            var countsub = coordinates.length;
                                            min.lat = coordinates[i][0][0][1];
                                            min.lng = coordinates[i][0][0][0];
                                            max.lat = coordinates[i][0][0][1];
                                            max.lng = coordinates[i][0][0][0];
                                            for (var j = 0; j < countsubs; j++) {
                                                pcount = coordinates[j].length;
                                                for (var jj = 0; jj < pcount; jj++) {
                                                    // Габариты
                                                    min.lat = Math.min(min.lat, coordinates[i][j][jj][1]);
                                                    min.lng = Math.min(min.lng, coordinates[i][j][jj][0]);
                                                    max.lat = Math.max(max.lat, coordinates[i][j][jj][1]);
                                                    max.lng = Math.max(max.lng, coordinates[i][j][jj][0]);
                                                }
                                            }
                                        }
                                        features[i].bbox = [min.lng, min.lat, max.lng, max.lat];
                                    }
                                }
                            }
                        }
                    }
                }
            }


        },

        // Добавление точек объектов в interfaceJSON
        interface_addpointsJSON: function (newjson) {
            if (!this.interfaceJSON || !this.interfaceJSON.features || !this.map)
                return;

            var json;
            if (newjson)
                json = JSON.parse(JSON.stringify(this.interfaceJSON));
            else
                json = this.interfaceJSON;

            var features = json.features, coordinates, countsubs, pcount, min = {}, max = {}, minbbox = {}, maxbbox = {}, type;
            var count = features.length;
            for (var i = 0; i < count; i++) {
                if (!features[i].geometry || !features[i].geometry.coordinates)
                    continue;
                features[i].properties["id"] = i.toString() + '.' + features[i].properties["id"];
                coordinates = features[i].geometry.coordinates;

                // Метрика без подобъектоа
                type = features[i].geometry.type.toLowerCase();
                if (type == 'point') {// один уровень вложенности
                    geo = GWTK.toLatLng([coordinates[1], coordinates[0]]);
                    if (!geo) continue;
                    overlaypoint = GWTK.DrawingObject.prototype._geo2pixelOffset(this.map, geo);
                    if (!overlaypoint) continue;
                    feature = this.featurebbox(i + this.prefixPoint + 0, [overlaypoint.x - 5, overlaypoint.y - 5, overlaypoint.x + 5, overlaypoint.y + 5]);
                    if (!feature) continue;
                    json.features.push(feature);

                }
                else {
                    // двойной уровень вложенности
                    if (type == 'linestring' || type == 'multipoint') {
                        pcount = coordinates.length;
                        if (pcount > 0) {
                            for (var jj = 0; jj < pcount; jj++) {
                                geo = GWTK.toLatLng([coordinates[jj][1], coordinates[jj][0]]);
                                if (!geo) continue;
                                overlaypoint = GWTK.DrawingObject.prototype._geo2pixelOffset(this.map, geo);
                                if (!overlaypoint) continue;
                                feature = this.featurebbox(i + this.prefixPoint + jj, [overlaypoint.x - 5, overlaypoint.y - 5, overlaypoint.x + 5, overlaypoint.y + 5]);
                                if (!feature) continue;
                                json.features.push(feature);
                            }
                        }
                    }
                    else {
                        if (type == 'multilinestring' || type == 'polygon') {
                            var countsubs = coordinates.length;
                            if (countsubs > 0 && coordinates[0].length > 0) {
                                for (var j = 0; j < countsubs; j++) {
                                    pcount = coordinates[j].length;
                                    for (var jj = 0; jj < pcount; jj++) {
                                        geo = GWTK.toLatLng([coordinates[j][jj][1], coordinates[j][jj][0]]);
                                        if (!geo) continue;
                                        overlaypoint = GWTK.DrawingObject.prototype._geo2pixelOffset(this.map, geo);
                                        if (!overlaypoint) continue;
                                        feature = this.featurebbox(i + this.prefixPoint + jj, [overlaypoint.x - 5, overlaypoint.y - 5, overlaypoint.x + 5, overlaypoint.y + 5]);
                                        if (!feature) continue;
                                        json.features.push(feature);

                                    }
                                }
                            }
                        }
                        else {
                            if (type == 'multipolygon') {
                                var countpolygon = coordinates.length;
                                if (countpolygon > 0 && countpolygon[0].length > 0) {
                                    for (var i = 0; i < countpolygon; i++) {
                                        var countsubs = coordinates[i][0].length;
                                        if (countsubs > 0 && coordinates[i][0].length > 0) {
                                            for (var j = 0; j < countsubs; j++) {
                                                pcount = coordinates[i][j].length;
                                                for (var jj = 0; jj < pcount; jj++) {
                                                    geo = GWTK.toLatLng([coordinates[i][j][jj][1], coordinates[i][j][jj][0]]);
                                                    if (!geo) continue;
                                                    overlaypoint = GWTK.DrawingObject.prototype._geo2pixelOffset(this.map, geo);
                                                    if (!overlaypoint) continue;
                                                    feature = this.featurebbox(i + this.prefixPoint + jj, [overlaypoint.x - 5, overlaypoint.y - 5, overlaypoint.x + 5, overlaypoint.y + 5]);
                                                    if (!feature) continue;
                                                    json.features.push(feature);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            json.features.splice(0, count);
            return json;

        },

        // Создать json.features.feature - квадрат по габаритам в пикселах
        //  bbox - массив [0,1,2,3] соответсвует [left,top,right,bottom]
        featurebbox_frompixel: function (id, bbox, delta) {
            if (!bbox || bbox instanceof Array == false || bbox.length < 4)
                return;
            geo = this.xy2geo(GWTK.point(bbox[0], bbox[1]));
            if (geo)
                point1 = new GWTK.Point(geo[0], geo[1]);
            geo = this.xy2geo(GWTK.point(bbox[2], bbox[3]));
            if (geo)
                point2 = new GWTK.Point(geo[0], geo[1]);
            return this.featurebbox_frompoint(id, point1, point2, delta);
        },

        // Расстояние между двумя точками
        // origin GWTK.toLatLng - 1 точка,  bl GWTK.toLatLng - вторая точка
        distance: function (origin, bl) {
            if (origin instanceof GWTK.LatLng == false || bl instanceof GWTK.LatLng == false)
                return '';
            return Math.abs(origin.distanceTo(bl));
        },


        // Создать json.features.feature - квадрат по габаритам в geo
        //  bbox - массив [0,1,2,3] соответсвует [left,top,right,bottom]
        featurebbox_frompgeo: function (id, bbox, delta) {
            if (!bbox || bbox instanceof Array == false || bbox.length < 4)
                return;
            return this.featurebbox_frompoint(id, new GWTK.Point(bbox[0], bbox[1]), new GWTK.Point(bbox[2], bbox[3]), delta);
        },

        featurebbox_frompoint: function (id, point1, point2, delta) {
            if (!point1 || point1 instanceof GWTK.Point === false || !point2 || point2 instanceof GWTK.Point === false)
                return;

            if (!delta) delta = 0;
            return feature = {
                "type": "Feature",
                "geometry": {
                    "type": "polygon",
                    "coordinates": [[
                        [point1.y - delta, point1.x - delta],
                        [point1.y - delta, point2.x + delta],
                        [point2.y + delta, point2.x + delta],
                        [point2.y + delta, point1.x - delta],
                        [point1.y - delta, point1.x - delta]
                    ]]
                },
                "properties": { "id": id.toString() }
            };
        },

        // Создать json.features.feature - квадрат по габаритам в пикселах
        //  bbox - массив [0,1,2,3] соответствует [left,top,right,bottom]
        featurebbox: function (id, bbox) {
            if (!bbox || bbox.length < 4)
                return;
            var coord = this.map.tiles.getLayersPointProjected(GWTK.point(bbox[0], bbox[1]));
            var geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
            if (geo)
                point1 = new GWTK.Point(geo[0], geo[1]);
            coord = this.map.tiles.getLayersPointProjected(GWTK.point(bbox[2], bbox[3]));
            geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
            if (geo)
                point2 = new GWTK.Point(geo[0], geo[1]);

            return feature = {
                "type": "Feature",
                "geometry": {
                    "type": "polygon",
                    "coordinates": [[
                        [point1.y, point1.x],
                        [point1.y, point2.x],
                        [point2.y, point2.x],
                        [point2.y, point1.x],
                        [point1.y, point1.x]
                    ]]
                },
                "properties": { "id": id }
            };
        },

        // Расстояние от точки (x0,y0) до отрезка (x1,y1,x2,y2)
        distanceFromPointToLineSegment: function (x0, y0, x1, y1, x2, y2) {
            var
            // квадраты боковых сторон треугольника
            a = (x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1),
            b = (x0 - x2) * (x0 - x2) + (y0 - y2) * (y0 - y2),
            // квадрат основания
            c = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1),
            // площадь треугольника
            s = Math.abs((x0 - x2) * (y1 - y2) - (x1 - x2) * (y0 - y2)) / 2,
            // высота к основанию
            h = 2 * s / Math.sqrt(c); // и его высоту
            // если треугольник тупоугольный, найдем до какого конца расстояние меньше
            if ((a + c < b) || (b + c < a)) {
                if (a < b)
                    d = Math.sqrt(a);
                else
                    d = Math.sqrt(b);
            }
            else
                d = h;  // если не тупоугольный, расстояние=высоте
            return {d:d};
        },

        /**
         * Получить нормаль в пределах пары координат
         * @method _getNormal
         * @param p1 {GWTK.Point} - координаты первой точки
         * @param p2 {GWTK.Point} - координаты второй точки
         * @param check {GWTK.Point} - координаты точки, относительно которой вести расчёт
         * @returns {{x, y, d}}
         *          x {number}, y {number} - координаты ближайшей точки по нормали
         *          d {number} - расстояние до этой точки
         * @private
         */
        _getNormal: function (x0, y0, x1, y1, x2, y2) {

            var lx = x2 - x1;
            var ly = y2 - y1;
            var dx = x1 - x0;
            var dy = y1 - y0;

            // Очевидно, квадрат расстояния имеет только минимум, в нем производная = 0
            var t = -(dx * lx + dy * ly) / (lx * lx + ly * ly);

            // Уравнение прямой
            var X = x1 + t * lx;
            var Y = y1 + t * ly;

            var result = { x: X, y: Y, d: null };
            // Выход за пределы пары точек - ближайшая точка
            if (t < 0) {
                result.x = x1;
                result.y = y1;
            } else if (t > 1) {
                result.x = x2;
                result.y = y2;
            }

            // Расстояние по нормали
            var xDiff = x0 - result.x;
            var yDiff = y0 - result.y;
            result.d = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
            return result;
        },


        // Найти близлежащий svg объект
        // isvirtual - отображать или нет виртуальную точку
        findNearSvgObjectByXY: function (clientX, clientY, isvirtual) {
            var distout = {
                'distcurr': -1,
                'points': [],
                'distances': [],
                'distancesGeo': [],
                'mindistance': null,
                'mindistanceGeo': null,
                'nearpoint': {
                    'point': null,
                    'pointnumber': null,
                    'indexinsert': null,
                    'subjectnumber': null,
                    'pointId':  null
                }
            };
            var ret = { 'id': null, 'dist': distout, xid: null };

            if (!clientX || !clientY)  return ret;
            // Найдем объекты с расстоянием менее того, что пришло
            var group = document.getElementById(this.svgid + this.prefixInterfaceJSON);
            if (!group) return ret;

            var mindistance = this.topologyoptions.captureradius / this.pixelSpan;//4;  // Минимальное расстояние

            var elems = group.childNodes, elid, coord, elidout, bbox, type, elout;

            // Переберем все элементы svg
            elems = Array.prototype.slice.call(elems); // теперь elems - массив
            // Ищем от последнего вверх
            for (var i = elems.length - 1; i >= 0; i--) {
                //         for (var i = 0; i < elems.length; i++) {
                type = 'path';
                //if (elems[i].nodeName == 'circle') { // если это маркер, то берем сразу следующий за ним
                //    i++; type = 'marker';
                //}
                if (i > 0 && elems[i - 1].nodeName == 'circle') { // если это маркер, то берем сразу следующий за ним
                    type = 'marker';
                }

                if (elems[i].nodeName != 'path')
                    continue;
                if (!(elid = elems[i].getAttributeNS(null, "id")))
                    continue;
                // Запросим габариты объекта в пикселах
                if (!(bbox = elems[i].getAttributeNS(null, "bbox")))
                    continue;

                distout = this.minDistanceSvgObject(elid, bbox, clientX, clientY, distout, type);
                // Если нашли объект ближе, чем наш
                if (distout.distcurr >= 0 && distout.distcurr <= mindistance) {  // И расстояние в пределах допуска
                    if (isvirtual) {
                        this.drawVirtualPoint(distout.virtualpoint);
                    }
                    elidout = elid;
                    elout = elems[i];
                    break;
                }
            }

            // не нашли другой объект
            if (!elidout) {
                distout.virtualpoint = null;
                if (isvirtual) {
                    this.drawVirtualPoint();
                }
                return ret;
            }

            var point_geo = [this.xy2geo(new GWTK.Point(clientX, clientY)), this.xy2geo(distout.points[0]), this.xy2geo(distout.points[1])];
            if (point_geo[0] && point_geo[1] && point_geo[2]) {
                var distanceGeo = [this.distance(point_geo[0], point_geo[1]), this.distance(point_geo[0], point_geo[2])];
                distout.distancesGeo = distanceGeo;
                distout.mindistanceGeo = Math.min(distanceGeo[0], distanceGeo[1]);
            }

            return { 'id': elidout, 'dist': distout, target: elout };
        },

        // Минимальное расстояние до svg объекта
        minDistanceSvgObject: function (id, bbox, clientX, clientY, distcurr, type) {
            if (!distcurr)
                distcurr = {
                    'distcurr': -1,
                    'points': [],
                    'distances': [],
                    'distancesGeo': [],
                    'mindistance': null,
                    'mindistanceGeo': null,
                    'nearpoint': {
                        'point': null,
                        'pointnumber': null,
                        'indexinsert': null,
                        'subjectnumber': null,
                        'pointId':  null
                    },
                    'virtualpoint': null
                };

            if (!id || !clientX || !clientY)
                return distcurr;

            var coord, contours, dist, isbbox = true, isbox,
                currpoint = -1;

            if (!bbox || !bbox || bbox instanceof Array == false || bbox.length < 2) {
                bbox = this.framepixel;
                isbbox = false;
            }
            // Если координаты мыши попадают в габариты объекта
            if (!isbbox ||
                (isbbox && clientX >= parseFloat(bbox[0][0]) && clientY >= parseFloat(bbox[0][1]) &&
                clientX <= parseFloat(bbox[1][0]) && clientY <= parseFloat(bbox[1][1]))) {
                // Иначе ищем минимальное расстояние
                contours = this.svgDraw.getCoords_pixel_byId(id);
                if (!contours || contours.length == 0)
                    return distcurr;

                // Проверяем ВСЕ контура
                for (var i = 0; i < contours.length; i++) { // контура
                    coord = contours[i];
                    if (coord.length == 0)
                        continue;
                    for (var j = 0; j < coord.length - 1; j++) {  // точки
                        isbox =   
                            (coord[j][0] >= this.framepixel[0][0] && coord[j][1] >= this.framepixel[0][1] &&
                            coord[j][0] <= this.framepixel[1][0] && coord[j][1] <= this.framepixel[1][1] ||
                            coord[j + 1][0] >= this.framepixel[0][0] && coord[j + 1][1] >= this.framepixel[0][1] &&
                            coord[j + 1][0] <= this.framepixel[1][0] && coord[j + 1][1] <= this.framepixel[1][1]);
                        // Проверим входит ли хоть одна координат в габариты окна
                        if (isbox) {
                            //dist = this.distanceFromPointToLineSegment(clientX, clientY, coord[j][0], coord[j][1], coord[j + 1][0], coord[j + 1][1]);
                            dist = this._getNormal(clientX, clientY, parseFloat(coord[j][0]), parseFloat(coord[j][1]), parseFloat(coord[j + 1][0]), parseFloat(coord[j + 1][1]));
                            if (distcurr.distcurr < 0) {
                                distcurr.distcurr = dist.d;
                                distcurr.virtualpoint = new GWTK.Point(dist.x, dist.y);
                                currpoint = j;
                                currcontour = i;
                            }
                            else {
                                if (dist.d < distcurr.distcurr) {
                                    distcurr.distcurr = dist.d;
                                    distcurr.virtualpoint = new GWTK.Point(dist.x, dist.y);
                                    currpoint = j;
                                    currcontour = i;
                                }
                            }

                        }
                    }
                }
            }

            // Если нашли точку
            if (currpoint >= 0) {

                var isMin0, point = new GWTK.Point(clientX, clientY);

                distcurr.points = [
                                new GWTK.Point(parseFloat(contours[currcontour][currpoint][0]), parseFloat(contours[currcontour][currpoint][1])),
                                new GWTK.Point(parseFloat(contours[currcontour][currpoint + 1][0]), parseFloat(contours[currcontour][currpoint + 1][1]))
                ];
                distcurr.distances = [
                                point.distanceTo(distcurr.points[0]),
                                point.distanceTo(distcurr.points[1])
                ];
                distcurr.mindistance = Math.min(distcurr.distances[0], distcurr.distances[1]);
                distcurr.nearpoint = {
                    point: (isMin0 = (distcurr.distances[0] < distcurr.distances[1])) ? distcurr.points[0] : distcurr.points[1],
                    pointnumber: (isMin0) ? currpoint : currpoint + 1,
                    indexinsert: (isMin0) ? 1 : 0,
                    subjectnumber: currcontour
                };
                distcurr.nearpoint.pointId = (type != 'marker') ? distcurr.nearpoint.subjectnumber.toString() + this.delimiterPoint + distcurr.nearpoint.pointnumber.toString() : distcurr.nearpoint.subjectnumber.toString() + this.delimiterPoint + '0';
            }

            return distcurr;
        },


        /**
         * Перевод из координат экрана в геодезические координаты
         * @method pixel2geoOffset
         * @param x {Int} координата по оси х
         * @param y {Int} координата по оси y
         , @param nooffset {Boolean} Не пересчитывать смещение координат
         * @returns {Array} Двухмерный массив [b, l]
         */
        // ===============================================================
        pixel2geoOffset: function (x, y, nooffset) {
            if (!x || !y || !this.drawpanel) return;
            var rect = this.drawpanel.getBoundingClientRect(), p;
            if (!nooffset)
                p = GWTK.point(x - rect.left, y - rect.top);
            else
                p = GWTK.point(x, y);
            var coord = this.map.tiles.getLayersPointProjected(p);
            if (coord) {
                var geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
                if (!geo) return;
                // if (geo[1] < 0)
                //     geo[1] = geo[1] + 360.0;
                return geo;
            }
        },

        /**
         * Запросить реальный идентификатор объекта по target или xid
         * @method getRealGID
         * @param target {Object}
         * @returns {Object} {
         *  xid: идентификатор объекта в коллекции,
         *  gmlid : реальный идентификатор объекта карты
         * } 
         */
        // ===============================================================
        getRealGID: function (target, xid) {
            xid = (target) ? target.getAttributeNS(null, 'xid') : xid;
            if (xid) {
                var gmlid = '', mass = xid.split(".");
                if (mass && mass.length > 0) {// наш объект
                    // Соберем
                    for (var i = 1; i < mass.length - 1; i++) {
                        if (i > 1)
                            gmlid += '.';
                        gmlid += mass[i];
                    }
                    return gmlid + '.' + mass[mass.length - 1];
                }
            }
        },

        /**
         * Запросить реальный объект в коллекции по target или xid
         * @method getFeatureObject
         * @param target {Object}
         * @returns {Object}  feature
         * } 
         */
        // ===============================================================
        getRealFeatureObject: function (target, xid, noclone) {
            if (!this.interfaceJSON) {
                return;
            }
            var xid = (target) ? target.getAttributeNS(null, 'xid') : xid;
            if (xid) {
                var topologyobject = this.interfaceJSON.features.find(
                    function (element, index, array) {
                        if (element.properties.id == xid)
                            return element;
                    });
                if (topologyobject) {
                    var gmlid = this.getRealGID(null, xid)
                    if (gmlid) {
                        if (noclone) {
                            return topologyobject;
                        }
                        var clone = JSON.parse(JSON.stringify(topologyobject));
                        clone.properties.id = gmlid;
                        return clone;
                        //return newjson = {
                        //    "type": "FeatureCollection",
                        //    "bbox": clone.bbox,
                        //    "features": [clone]
                        //};
                    }
                }
            }
        },

        /**
        * Отрисовать близлежащий объект и точку
        * @method drawOverObject
        * @param ui {Object} - позиционирование исходной точки
        * @param drawpoints {Object} - объект, в котором указаны, какие точки подсветить
        * { isobjectpoint: true, isvirtualpoint: true}
        * @returns {Boolean}  
        */
        // ===============================================================
        drawOverObject: function (ui, drawpoints) {
            if (!ui || !ui.position)
                return;
            if (!this.calculation) {
                this.calculation = true;
                // сбросить близлежащую точку
                this.onMouseoutPoint(this.currentPoint);
                // найдем близлежащий объект
                this.nearObjectParam = this.findNearSvgObjectByXY(ui.position.left, ui.position.top, (drawpoints && drawpoints.isvirtualpoint) ? drawpoints.isvirtualpoint : false);
                this.calculation = false;

                if (this.nearObjectParam && this.nearObjectParam.id) {
                    // Подсветим его вместе с точками
                    this.MouseoverAction(this.nearObjectParam.id);

                    if (!drawpoints || (!drawpoints.isobjectpoint && !drawpoints.isvirtualpoint))
                        return true;
                    //подсветим близлежашие объекты с точками для выбора
                    if (this.nearObjectParam.dist.mindistanceGeo) {
                        if (this.nearObjectParam.dist.mindistanceGeo <= this.topologyoptions.captureradius) {
                            if (drawpoints.isobjectpoint) {
                                if (this.nearObjectParam.dist.nearpoint && this.nearObjectParam.dist.nearpoint.point) {
                                    ui.position.left = this.nearObjectParam.dist.nearpoint.point.x;
                                    ui.position.top = this.nearObjectParam.dist.nearpoint.point.y;
                                    var el = document.getElementById(this.nearObjectParam.id + this.prefixPoint + this.nearObjectParam.dist.nearpoint.pointId);
                                    // удалим виртуальную точку
                                    this.drawVirtualPoint();
                                    this.nearObjectParam.dist.virtualpoint = null;
                                    // Подсветить близлежащую точку
                                    this.onMouseoverPoint(this.nearObjectParam.id + this.prefixPoint + this.nearObjectParam.dist.nearpoint.pointId);
                                    var el = document.getElementById(this.currentPoint);
                                    if (el) {
                                        if (el.nodeName == 'circle') {
                                            ui.position.left = parseFloat(el.getAttributeNS(null, "cx"));
                                            ui.position.top = parseFloat(el.getAttributeNS(null, "cy"));
                                        }
                                    }
                                    return true;
                                }
                            }
                        }
                        else {
                            if (drawpoints.isvirtualpoint) {
                                // Если есть виртуальная точка
                                if (this.nearObjectParam.dist.virtualpoint) {
                                    ui.position.left = this.nearObjectParam.dist.virtualpoint.x;
                                    ui.position.top = this.nearObjectParam.dist.virtualpoint.y;
                                    this.onMouseoverPoint(this.svgid + this.prefixVirtualPoint, true);
                                    return true;
                                }
                            }
                        }
                    }
                }
            }

        },

        // Запросить параметры виртуальной точки
        //nearObjectParam = {
        //    id : id объекта,
        //    xid : xid,
        //    dist : {
        //    'distcurr': -1,
        //    'points': [],
        //    'distances': [],
        //    'distancesGeo': [],
        //    'mindistance': null,
        //    'mindistanceGeo': null,
        //    'nearpoint': {
        //        'point': null,
        //        'pointnumber': null,
        //        'indexinsert': null,
        //        'subjectnumber': null,
        //        'pointId':  null
        //    }
        //  }
        //}
        getVirtualPointParam: function () {
            if (this.nearObjectParam && this.nearObjectParam.dist && this.nearObjectParam.dist.virtualpoint) {
                return this.nearObjectParam;
            }
        },

        /**
        * Найти объект в коллекции interfaceJSON по идентификатору объекта gid
        * @method findFeatureByGID
        * @param gid {String} - идентификатор объекта
        * @returns {Object}   - feature
        */
        // ===============================================================
        findFeatureByGID: function (gid) {
            var topologyobject = this.interfaceJSON.features.find(
                function (element, index, array) {
                    var mass = element.properties.id.split('.');
                    if (mass && mass.length > 2) {
                        var xid = mass[1] + '.' + mass[2];
                        if (gid == (mass[1] + '.' + mass[2]))
                            return element;
                    }
                });
            return topologyobject;
        }



    };


}



