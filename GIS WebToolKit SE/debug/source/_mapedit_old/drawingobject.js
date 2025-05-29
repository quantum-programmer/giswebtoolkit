/**************************************** Гиман Н.     02/11/17 ****
******************************************* Тазин В.О. 22/08/17 ****
**************************************** Соколова Т.О. 05/04/21 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2018              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*          Компонент рисования редактируемого объекта              *
*                                                                  *
*******************************************************************/
if (window.GWTK) {

    /**
    * Компонент рисования объекта) 
    * @class GWTK.DrawingObject
    * @constructor GWTK.DrawingObject
    * @param param {Object} - параметры класса  = {
       nocontextmenu :         признак того, что не надо показывать конткстное меню
       func:{              
            fn_draggable :      функция перемещения 
            fn_popupmenu :      функция контекстного меню для точки объекта
            fn_updatepoint :    функция обновления координат точки объекта
            fn_destroy :        функция разрушения объекта
            fn_downpoint :      функция, выполняющаяся при нажатии на точку объекта (не перетаскивая ее) 
            fn_parentpanel :   функция, возващающая панель родителя для размещения на ней svg холста
            fn_continue:        функция продолжения создания (доцифровка объекта/подобъекта)
        }
    * }
    * @param context {Object} - контекст вызова
    */
    // ===============================================================
    GWTK.DrawingObject = function (map, param, context) {
        this.toolname = 'drawingobject';

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

        // Параметры рисования
        this.pointprefix = 'placemarkDivdiv_';
        this.options_points =
         {
             "stroke": "black",
             "stroke-width": "1px",
             "stroke-opacity": "1.0",
             //"vector-effect": "non-scaling-stroke",
             "fill": "#00BA00",
             "background": "",
             "background-size": "auto auto",
             "fill-opacity": "0.9",
             "font-family": "Verdana",
             "font-size": "12px",
             "letter-spacing": "1",
             "startOffset": "2%",
             "text": ""
         };

        this.options_line =
         {
             "stroke-width": "3px",
             "stroke-opacity": "1.0",
             "vector-effect": "non-scaling-stroke",
             "fill": "#00BA00", 
             "background": "",
             "background-size": "auto auto",
             "fill-opacity": "0.9",
             "font-family": "Verdana",
             "startOffset": "2%"
         };

        this.options_pointsBbox =
         {
             "stroke": "#00BA00",
             "stroke-width": "2px",
             "stroke-opacity": "1.0",
             //"vector-effect": "non-scaling-stroke",
             "fill": "white",
             "fill-opacity": "0.9",
             "stroke-dasharray" :"10 5"
         };

        this.zIndexUp = 710;

        // Настроить стили
        this.refreshstyle();

        // инициализация переменных класса
        this.clear();
        this.initparam(param);

    };


    GWTK.DrawingObject.prototype = {
        /**
         * Инициализация параметров класса
         * @method initparam
         */
        // ===============================================================
        initparam: function (param) {
            if (!param || param instanceof Object == false)
                return;

            var func = param.func;
            if (func) {
                if (func.fn_draggable) {
                    if (this.context)
                        this.do_draggable = GWTK.Util.bind(func.fn_draggable, this.context);
                    else {
                        this.do_draggable = func.fn_draggable;
                    }
                }

                if (func.fn_downpoint) {
                    if (this.context)
                        this.do_downpoint = GWTK.Util.bind(func.fn_downpoint, this.context);
                    else {
                        this.do_downpoint = func.fn_downpoint;
                    }
                }

                if (func.fn_popupmenu) {
                    this.addPopupmenu(func.fn_popupmenu);
                 }

                if (func.fn_updatepoint) {
                    if (this.context)
                        this.do_updatepoint = GWTK.Util.bind(func.fn_updatepoint, this.context);
                    else {
                        this.do_updatepoint = func.fn_updatepoint;
                    }
                }
                if (func.fn_destroy) {
                    if (this.context)
                        this.do_destroy = GWTK.Util.bind(func.fn_destroy, this.context);
                    else {
                        this.do_destroy = func.fn_destroy;
                    }
                }
                if (func.fn_parentpanel) {
                    if (this.context)
                        this.parentpanel = GWTK.Util.bind(func.fn_parentpanel, this.context);
                    else {
                        this.parentpanel = func.fn_parentpanel;
                    }
                }

                if (func.fn_continue) {
                    this.addContinue(func.fn_continue);
                }

            }

            this.nocontextmenu = param.nocontextmenu;

        },

        // Добавить функцию для всплывающего меню
        addPopupmenu: function (fn) {
            if (GWTK.device.desktop()) {
                if (fn) {
                    if (this.context)
                        this.do_popupmenu = GWTK.Util.bind(fn, this.context);
                    else {
                        this.do_popupmenu = fn;
                    }
                }
            }
            else {
                if (fn) {
                    if (!this.do_downpoint) {  // Если бработчик нажатия точки свободен, назначим на него popupmenu
                        if (this.context)
                            this.do_downpoint = GWTK.Util.bind(fn, this.context);
                        else {
                            this.do_downpoint = fn;
                        }
                    }
                }
            }
        },

        // Добавить функцию для продолжения построения объекта
        addContinue: function (fn) {

            // Очистить объект доцифровки
            this.clearContinueCreate();

            if (fn) {
                if (this.context)
                    this.do_continue = GWTK.Util.bind(fn, this.context);
                else {
                    this.do_continue = fn;
                }
                $(this.map.eventPane).on('drawmark_mouseover', this.onDrawmark_mouseover);
            }
            else {
                this.do_continue = null;
                $(this.map.eventPane).off('drawmark_mouseover', this.onDrawmark_mouseover);
            }

        },


        /**
        * Сброс параметров 
        * @method initparam
        */
        // ===============================================================
        clearparam: function () {

            this.do_draggable = null;
            this.addContinue();
            this.do_popupmenu = GWTK.DrawingObject.prototype.do_popupmenu;
            this.do_updatepoint = GWTK.DrawingObject.prototype.do_updatepoint;
            this.do_destroy = GWTK.DrawingObject.prototype.do_destroy;
            //this.do_downpoint = GWTK.DrawingObject.prototype.do_downpoint;

            this.nocontextmenu = false;

        },


        /**
          * Очистить переменные
          * @method bind
          */
        // ===============================================================
        clear: function () {

            // Разрушим и почистим все переменные класса
            this.destroy();

            this.onDrawmark_mousedown = GWTK.Util.bind(this.onDrawmark_mousedown, this);
            this.onDrawmark_popupmenu = GWTK.Util.bind(this.onDrawmark_popupmenu, this);

            this.svgDraw = null;

            this.drag = {
                elem: null,
                x: 0,
                y: 0,
                delta: { x: 0, y: 0 },
                alldelta: { x: 0, y: 0 },
                state: false,
                center: GWTK.point(0, 0),
                koeff: { x: 1.0, y: 1.0 },
                firstpoint: { x: 0, y: 0 }
            };

            // Смещения в рамке относительно объекта и точки вращения 
            this.offsettop = 30; this.offsetbox = 10;

            // параметры отрисовки объекта
            this.drw_points = false;
            this.drw_centerpoints = false;

            // замкнуть контекст вызова функций
            this.bind();
        },

        /**
         * Очистить все, что связано с линией доцифровки, если такая была
         */
        clearContinueCreate: function(){
            if (this.continueCreate){
                GWTK.DrawingObject.prototype.removeDomElement(this.continueCreate.lineid);
                this.continueCreate = null;
            }
        },
        
        /**
          * Назначить функции 
          * @method setFunctions
        */
        // ===============================================================
        setFunctions: function (func) {
            if (!func) return;
            if (func.fn_draggable) 
               this.do_draggable = func.fn_draggable;
               this.do_popupmenu = func.fn_popupmenu;
            if (func.fn_updatepoint) 
               this.do_updatepoint = func.fn_updatepoint;
            if (func.fn_destroy) 
               this.do_destroy = func.do_destroy;
            if (func.fn_downpoint) 
               this.do_downpoint = func.fn_downpoint;
            if (func.fn_parentpanel) 
               this.parentpanel = func.fn_parentpanel;
            if (func.fn_continue) {
                this.addContinue(func.fn_continue);
            }
        },

        /**
          * Запросить функцию 
          * @method getFunctions
        */
        // ===============================================================
        getFunctions: function () {
            return {
                "fn_draggable" : this.do_draggable,
                "fn_popupmenu" : this.do_popupmenu,
                "fn_updatepoint" : this.do_updatepoint,
                "fn_destroy" : this.do_destroy,
                "fn_downpoint" : this.do_downpoint,
                "fn_parentpanel" : this.parentpanel,
                "fn_continue" : this.do_continue
            }
        },


        /**
          * Замыкание контекста 
          * @method bind
          */
        // ===============================================================
        bind: function () {
            this.onMouseMovePoint = GWTK.Util.bind(this.onMouseMovePoint, this);
            this.onMouseUpPoint = GWTK.Util.bind(this.onMouseUpPoint, this);

            this.onMouseMoveLine = GWTK.Util.bind(this.onMouseMoveLine, this);
            this.onMouseUpLine = GWTK.Util.bind(this.onMouseUpLine, this);

            this.onDrawmark_mouseover = GWTK.Util.bind(this.onDrawmark_mouseover, this);

            this.onDragStart = GWTK.Util.bind(this.onDragStart, this);
            this.onDragEnd = GWTK.Util.bind(this.onDragEnd, this);
        },

        /**
         * Стереть объект
         * @method destroy
         */
        // ===============================================================
        destroy: function () {
            this.events();

            this.clearContinueCreate();

            if ((!this.mapobject || !this.mapobject.geometry) &&
                // Для групповых операций
                (!this.mapobjects || this.mapobjects.length == 0))
                return;

            var idobject = this.mapobject.maplayername + '_' + this.mapobject.id;
            this.removeDomElement(idobject + '_objectJSON');
            this.removeDomElement(idobject + '_bboxJSON');
            this.do_destroy();
        },

        /**
         * Перенастроить стили
         * @method refreshstyle
         */
        // ===============================================================
        refreshstyle: function (measurementstylechanged) {

            var drawoptions = JSON.parse(JSON.stringify(this.map.selectedObjects.drawoptionsSelected));
            if (measurementstylechanged) {
                drawoptions.stroke = '#' + measurementstylechanged.linecolor;
                drawoptions.fill = '#' + measurementstylechanged.fillcolor;
            }

            //this.styleline = 'fill:' + this.options_points['fill'] + '; stroke:' + this.map.selectedObjects.drawoptionsSelected.stroke + '; stroke-width:' + this.map.selectedObjects.drawoptionsSelected['stroke-width'] +
            this.styleline = 'fill:' + this.options_points['fill'] + '; stroke:' + drawoptions.stroke + '; stroke-width:' + drawoptions['stroke-width'] +
            '; fill-opacity:' + this.options_points['fill-opacity'] + ';' + ' vector-effect:' + this.options_points['vector-effect'] + ';';

           // this.styleline_subject = 'fill:' + this.options_points['fill'] + '; stroke:' + this.map.selectedObjects.drawoptionsSelected.stroke + '; stroke-width:1px' +
            this.styleline_subject = 'fill:' + this.options_points['fill'] + '; stroke:' + drawoptions.stroke + '; stroke-width:1px' +
                '; fill-opacity:' + this.options_points['fill-opacity'] + ';' + ' vector-effect:' + this.options_points['vector-effect'] + ';';

            this.stylepoint = 'fill:' + this.options_points['fill'] + '; stroke:' + this.options_points['stroke'] + '; stroke-width:'
            + this.options_points['stroke-width'] + '; stroke-opacity:' + this.options_points['stroke-opacity']  +
            '; fill-opacity:' + this.options_points['fill-opacity'] + ';' + ' vector-effect:' + this.options_points['vector-effect'] + ';';

            this.stylepointFirst = 'fill:#e30f2d; stroke:#45171e' + '; stroke-width:' + this.options_points['stroke-width'] + '; fill-opacity:' +
                this.options_points['fill-opacity'] + ';' + ' vector-effect:' + this.options_points['vector-effect'] + ';';;

            this.stylepointLast = 'fill:#fd32df; stroke:#45171e' + '; stroke-width:' + this.options_points['stroke-width'] + '; fill-opacity:' +
                 this.options_points['fill-opacity'] + ';' + ' vector-effect:' + this.options_points['vector-effect'] + ';';;

            this.stylepointCenter = 'fill:' + this.options_points['fill'] + '; stroke:' + this.options_points['stroke'] + '; stroke-width:0'
            + '; fill-opacity:' + this.options_points['fill-opacity'] + ';' +
            ' vector-effect:' + this.options_points['vector-effect'] + ';';

            this.stylepointBbox = 'fill:' + this.options_pointsBbox['fill'] + '; stroke:' + this.options_pointsBbox['stroke'] + '; stroke-width:'
            + this.options_pointsBbox['stroke-width'] + '; fill-opacity:' + this.options_pointsBbox['fill-opacity'] + ';' +
            ' vector-effect:' + this.options_pointsBbox['vector-effect'] + ';';

            this.stylelineBbox = 'fill:' + this.options_pointsBbox['fill'] + '; stroke:' + 'black' + '; stroke-width:1px' +// this.options_pointsBbox['stroke-width'] +
                '; fill-opacity:' + this.options_pointsBbox['stroke-opacity'] + ';' + ' vector-effect:' + this.options_pointsBbox['vector-effect'] +
                '; stroke-dasharray:' + this.options_pointsBbox['stroke-dasharray'];

            this.styleMoveBbox = 'fill:' + this.options_pointsBbox['fill'] + '; stroke:' + this.options_pointsBbox['stroke'] + '; stroke-width:0px' +// this.options_pointsBbox['stroke-width'] +
            '; fill-opacity:0.1';
            
        },

        /**
         * Обновить изoбражение
         * Обновить изoбражение
         * @method refreshdraw
         * @param noevents {Boolean} при = true - события на точки объекта не будут назначены
         * @param box  {Boolean} при = true  отрисовка служебной рамки с возможностью поворота и масштабирования
         */
        // ===============================================================
        refreshdraw: function (noevents, box) {
            this.draw(this.mapobject, this.svgDraw, this.drw_points, this.drw_centerpoints, noevents, box);
        },

        /**
         * Назначить/отменить обработчики
         * @method events
         * @param type {String} при = 'on' - события будут назначены
         */
        // ===============================================================
        events: function (type) {
            if (this.drag && this.drag.rotate && this.drag.state && this.drag.scale >= 0)
                return;

            var ep = this.map.eventPane;
            if (!ep) return;
            var $ep = $(ep);

            // Если есть всплаывающее меню
            if (this.nocontextmenu) {
                $ep.off('contextmenu', this.onContextMenu);
            }
            // События на вызов меню
            $ep.off('drawmark_popupmenu', this.onDrawmark_popupmenu);
            // События на нажатие мыши
            $ep.off('drawmark_mousedown', this.onDrawmark_mousedown);

            // События на перемещение и отжатие мыши
            this.map.off({ type: "documentmousemove", target: "map", phase: 'before', sender: this }, this.onMouseMovePoint);
            this.map.off({ type: "documentmouseup", target: "map", phase: 'before', sender: this }, this.onMouseUpPoint);

            $ep.off('drawmark_mouseover', this.onDrawmark_mouseover);

            // Перемещение карты
            $ep.off('mapdragstart',  this.onDragStart);
            $ep.off('mapdragend', this.onDragEnd);

            if (type == 'on') {
                $ep.on('drawmark_mousedown', this.onDrawmark_mousedown);
                $ep.on('drawmark_popupmenu', this.onDrawmark_popupmenu);

                // Если есть всплаывающее меню
                if (this.nocontextmenu) {
                    $ep.on('contextmenu', this.onContextMenu);
                }

                $ep.on('drawmark_mouseover', this.onDrawmark_mouseover);

                // Перемещение карты
                $ep.on('mapdragstart',  this.onDragStart);
                $ep.on('mapdragend', this.onDragEnd);

                // Если нет ни одной точки и есть функция продолжения цифрования
                if (this.mapobject && this.mapobject.geometry && this.mapobject.geometry.count() == 0 &&
                    this.do_continue) {
                    this.map.on({ type: "onmouseup", target: "map", phase: 'before', sender: this }, this.onMouseUpLine);
                }
            }
        },

        // обновить this.mapobject.maplayername, чтоб реально соответсвовал
        setLayerName: function(mapobject) {
            if (!mapobject) return;
            if (!mapobject.maplayername) {
                var gmldata = GWTK.Util.parseGmlId(mapobject.gid);
                if (gmldata && gmldata.sheet && gmldata.objid) {
                    mapobject.maplayername = gmldata.sheet;
                }
            }
        },


        /**
         * Отрисовка объекта
         * @method draw
         * @param mapobject {Object} Объект карты GWTK.mapobject
         * @param svg  {Object} Компонент векторной графики GWTK.EditSvgDrawing
         * @param drw_points  {Boolean} Признак рисования точек объекта
         * @param drw_centerpoints  {Boolean} Признак рисования центральныхь точек линий объекта
         * @param noevents {Boolean} при = true - события на точки объекта не будут назначены
         * @param box  {Boolean} при = true  отрисовка служебной рамки с возможностью поворота и масштабирования
        */
        // ===============================================================
        draw: function (mapobject, svg, drw_points, drw_centerpoints, noevents, box) {
            this.destroy();

            if (!mapobject || !mapobject.geometry || !svg)
                return;
            this.mapobjects = null;
            this.mapobject = mapobject;
            this.svgDraw = svg;

            // Запомним пареметры, в дальнейшем используется для refreshdraw
            this.drw_points = drw_points;
            this.drw_centerpoints = drw_centerpoints;

            var gobject = document.createElementNS("http://www.w3.org/2000/svg", "g");
            
            // обновить this.mapobject.maplayername, чтоб реально соответсвовал
            this.setLayerName(this.mapobject);

            gobject.setAttributeNS(null, "id", this.mapobject.maplayername + '_' + this.mapobject.id + '_objectJSON');
            svg.appendElement(gobject, svg.svgCanvas);

            var rc, ret;
            for (var i = 0; i <= mapobject.geometry.subjects.length; i++) {
                rc = this.drawcontour(mapobject, i, drw_points, drw_centerpoints, noevents, box);
                if (rc)
                    ret = rc;
            }

            if (ret) {
                if (box) { // Если есть box, то рисуем с габаритами
                    this.drawbox(mapobject, noevents);
                }
                this.events('on');
            }
        },


        /**
         * Отрисовка группы объектов
         * @method draw
         * @param mapobject {Object} Объекты карты GWTK.mapobject
         * @param svg  {Object} Компонент векторной графики GWTK.EditSvgDrawing
         * @param drw_points  {Boolean} Признак рисования точек объекта
         * @param drw_centerpoints  {Boolean} Признак рисования центральных точек линий объекта
         * @param noevents {Boolean} при = true - события на точки объекта не будут назначены
         * @param box  {Boolean} при = true  отрисовка служебной рамки с возможностью поворота и масштабирования
        */
        // ===============================================================
        drawGEOJSON: function (mapobjects, drawjson, svg, noevents, box) {

            this.destroy();
            if (!mapobjects || !(mapobjects instanceof Array) || mapobjects.length == 0)
                return;
            this.svgDraw = (svg) ? svg : this.svgDraw;
            if (!this.svgDraw)
                return;

            this.mapobject = mapobjects[0];
            this.mapobjects = mapobjects;

            var options =  JSON.parse(JSON.stringify(this.options_line)),
                type;
            // изменим опции для точечных
            //options["stroke"] = this.options_line;
            options["stroke-width"] = this.map.selectedObjects.drawoptionsSelected["stroke-width"];//'2px';
            options["fill-opacity"] = '0';
            options["stroke"] = this.map.selectedObjects.drawoptionsSelected.stroke;//options["fill"];//this.options_pointsBbox;

            for (var i = 0; i < drawjson.features.length; i++) {
                type = drawjson.features[i].geometry.type.toLowerCase().indexOf('point');
                if (type >= 0) { // если точечный
                    if (!drawjson.features[i]["style"]) {
                        drawjson.features[i].style = JSON.parse(JSON.stringify(options));
                    }
                    drawjson.features[i].style["stroke-opacity"] = "0.95";
                    drawjson.features[i].style["fill-opacity"] = "0.95";
                }
            }

            this.svgDraw.draw(drawjson, false, options, null, null, false);

            // Габаритная рамка
            if (box) { // Если есть box, то рисуем с габаритами
                this.drawboxGroup(mapobjects, noevents);
            }
            if (!noevents)
                this.events('on');

        },


        /**
         * Отрисовка контура объекта 
         * @method drawcontour
         * @param mapobject {Object} Объект карты GWTK.mapobject
         * @param subject {Int} Номер контура (с 0)
         * @param svg  {Object} Компонент векторной графики GWTK.EditSvgDrawing
         * @param drw_points  {Boolean} Признак рисования точек объекта
         * @param drw_centerpoints  {Boolean} Признак рисования центральныхь точек линий объекта
         * @param noevents {Boolean} при = true - события на точки объекта не будут назначены
         */
        // ===============================================================
        drawcontour: function (mapobject, subject, drw_points, drw_centerpoints, noevents) {

            if (!mapobject || !mapobject.geometry || !this.map || !this.svgDraw)
                return;
            this.mapobject = mapobject;
            var svg = this.svgDraw;
            subject = (subject) ? subject : 0;

            var points = this.getpoints(mapobject, subject);
            if (points == null || points.length == 0)
                return;
            var coord = new Array(), geo, overlaypoint;

            var fn = [
                {
                    "event": "onmouseover",
                    "func": "GWTK.DrawingObject.prototype.onPointMouseOver(evt,'" + this.map.eventPane.id + "')"
            }
                , {
                    "event": "onmouseout",
                    "func": "GWTK.DrawingObject.prototype.onPointMouseOut(evt,'" + this.map.eventPane.id + "')"
            }];

            if (this.context) {
                fn.push(
                    {
                        "event": "onmousedown",
                        "func": "GWTK.DrawingObject.prototype.onPointMouseDown(evt,'" + this.map.eventPane.id + "')"
                    }
                );
            }

            if (noevents) {
                fn = new Array();
            }

            // Разберемся с параметрами рисования
            drw_points = (drw_points != undefined) ? drw_points : this.drw_points;
            drw_centerpoints = (drw_centerpoints != undefined) ? drw_centerpoints : this.drw_centerpoints;

            var step = 1;
            if (drw_centerpoints)
                step = 2;

            var center_hide = false;
            if (mapobject.spatialposition == 'vector' || mapobject.spatialposition == 'title')
                center_hide = true;

            var coord = new Array(), coord_s = new Array(), geo, overlaypoint, n_id, id, id_s, place_s,
                elpoint, elpoint_center;
            var count = points.length;
            var styleline = (subject > 0) ? this.styleline_subject : this.styleline;

            // Пробуем отрисовать графический объект
            var d = '', _graphic, spatialposition;
            // if (mapobject.graphic) {
            //     var layer = mapobject.map.tiles.getLayerByxId(mapobject.maplayerid);
            //     _graphic = GWTK.MapeditLegendGraphicControl.prototype.createGraphicObjectFromJSON(mapobject.graphic);
            //     if (_graphic && mapobject.spatialposition) {
            //         spatialposition = mapobject.spatialposition.toLowerCase();
            //         if (spatialposition.indexOf('title') >= 0) {
            //             // Изменить подпись в соответствии с масштабом карты
            //             if (mapobject.map && mapobject.maplayerid) {
            //                 layer = mapobject.map.tiles.getLayerByxId(mapobject.maplayerid);
            //                 var svgMap;
            //                 if (layer && layer instanceof GWTK.graphicLayer) {
            //                     if (layer.layerContainer && layer.layerContainer.drawingMethod &&
            //                         (svgMap = layer.layerContainer.drawingMethod.svgCanvas) && svgMap.getAttribute("scaleorigin")) {
            //                         var scaleCurr = mapobject.map.getZoomScale(mapobject.map.options.tilematrix) / parseFloat(svgMap.getAttribute("scaleorigin"));
            //                         _graphic.options.optionsFont['font-size'] = parseFloat(_graphic.options.optionsFont['font-size']) / scaleCurr;
            //                     }
            //                 }
            //             }
            //         }
            //
            //         styleline = _graphic.getStyle_StringForSVG();
            //         if (spatialposition.indexOf('polygon') >= 0 || spatialposition.indexOf('title') >= 0) {
            //             d += 'M';
            //         }
            //     }
            // }

            // замкнутость
            var style, isclosing = true;
            if (count < 4 || points[0].x != points[count - 1].x || points[0].y != points[count - 1].y)
                isclosing = false;

            // создали группу
            var iddrawobj = mapobject.maplayername + '_' + mapobject.id + '_' + subject.toString();
            var glines = document.createElementNS("http://www.w3.org/2000/svg", "g");
            glines.setAttributeNS(null, "id", iddrawobj + '_' + 'linesJSON');

            var gpoints = document.createElementNS("http://www.w3.org/2000/svg", "g");
            gpoints.setAttributeNS(null, "id", iddrawobj + '_' + 'pointsJSON');


            for (var i = 0; i < count; i++) {
                //               n_id = this.mapobject.maplayerid + '_' + this.mapobject.id + '_' + this.subject.toString() + '_' + i.toString();
                n_id = mapobject.maplayername + '_' + mapobject.id + '_' + subject.toString() + '_' + i.toString();
                id = this.pointprefix + "mop" + '_' + n_id;

                overlaypoint = this._geo2pixelOffset(this.map, GWTK.toLatLng([points[i].x, points[i].y]));

                if (!overlaypoint) {
                    continue;
                }

                if (d) {
                    d += overlaypoint.x.toString() + ',' + overlaypoint.y.toString() + ' ';
                }

                style = this.stylepoint;

                if (count > 1) {
                    if (i == 0 && !isclosing) // первая точка незамкнутый
                        style = this.stylepointFirst;
                    else {
                        if (i == count - 2 && isclosing) {// если замкнутый
                            style = this.stylepointLast;
                        }
                        else {
                            if (i == count - 1 && !isclosing) // если незамкнутый
                                style = this.stylepointLast;
                            else {
                                if (i == count - 1 && isclosing) // последняя замкнутый
                                    style = this.stylepointFirst;
                            }
                        }
                    }
                }

                // Создаем первую точку
                if (overlaypoint && i == 0)
                    elpoint = svg.createSVGcircle(id, gpoints, { "cx": overlaypoint.x, "cy": overlaypoint.y, "r": 4, "style": style, "transform": "matrix(1 0 0 1 0 0)" }, fn);

                if (i > 0) {

                    place_s = this._geo2pixelOffset(this.map, GWTK.toLatLng([points[i - 1].x, points[i - 1].y]));
                    n_id = mapobject.maplayername + '_' + mapobject.id + '_' + subject.toString() + '_' + i.toString();
                    svg.createSVGline("mol_" + n_id, glines, { "x1": place_s.x, "y1": place_s.y, "x2": overlaypoint.x, "y2": overlaypoint.y, "style": styleline });

/*
                    if (drw_centerpoints) { // создание промежуточной точки
                        var stylecircle = this.stylepointCenter;// this.stylepoint;
                        coord[0] = points[i - 1].x + ((points[i].x - points[i - 1].x) / 2.0);
                        coord[1] = points[i - 1].y + ((points[i].y - points[i - 1].y) / 2.0);
                        place_s = this._geo2pixelOffset(this.map, GWTK.toLatLng([coord[0], coord[1]]));
                        if (place_s) {
                            n_id = mapobject.maplayername + '_' + mapobject.id + '_' + subject.toString() + '_' + i.toString();
                            id_s = this.pointprefix + "mop" + '_' + n_id + "_center";
                            elpoint_center = svg.createSVGcircle(id_s, gpoints, { "cx": place_s.x, "cy": place_s.y, "r": 4, "style": stylecircle, "transform": "matrix(1 0 0 1 0 0)" }, fn);
                            elpoint_center.setAttributeNS(null, 'originalstyle', elpoint_center.getAttributeNS(null, 'style'));
                            elpoint_center.setAttributeNS(null, 'originalradius', elpoint_center.getAttributeNS(null, 'r'));
                        }
                    }
                    */


                    if (drw_centerpoints) { // создание промежуточной точки
                        var stylecircle = this.stylepointCenter;
                        var place_s0 = this._geo2pixelOffset(this.map, GWTK.toLatLng([points[i].x, points[i].y]));
                        place_s = {x: place_s.x + (place_s0.x- place_s.x)/2.0, y:  place_s.y + (place_s0.y- place_s.y)/2.0};

                        n_id = mapobject.maplayername + '_' + mapobject.id + '_' + subject.toString() + '_' + i.toString();
                        id_s = this.pointprefix + "mop" + '_' + n_id + "_center";
                        elpoint_center = svg.createSVGcircle(id_s, gpoints, { "cx": place_s.x, "cy": place_s.y, "r": 4, "style": stylecircle, "transform": "matrix(1 0 0 1 0 0)" }, fn);
                        elpoint_center.setAttributeNS(null, 'originalstyle', elpoint_center.getAttributeNS(null, 'style'));
                        elpoint_center.setAttributeNS(null, 'originalradius', elpoint_center.getAttributeNS(null, 'r'));

                    }


                    // создание основной точки  
                    if (overlaypoint) 
                        elpoint = svg.createSVGcircle(id, gpoints, { "cx": overlaypoint.x, "cy": overlaypoint.y, "r": 4, "style": style, "transform": "matrix(1 0 0 1 0 0)" }, fn);
                }

                if (elpoint) {
                    elpoint.setAttributeNS(null, 'originalstyle', elpoint.getAttributeNS(null, 'style'));
                    elpoint.setAttributeNS(null, 'originalradius', elpoint.getAttributeNS(null, 'r'));
                }

            }

            var parent = document.getElementById(this.mapobject.maplayername + '_' + this.mapobject.id + '_objectJSON');
            if (parent) {
                svg.appendElement(glines, parent);
                if (drw_points)
                    svg.appendElement(gpoints, parent);
            }
            else {
                svg.appendElement(glines, svg.svgCanvas);
                if (drw_points)
                    svg.appendElement(gpoints, svg.svgCanvas);
            }

            // // Если это полигон, то нарисовать path c заливкой,
            // // если подпись - то ее
            // if (d) {
            //      if (spatialposition.indexOf('title') >= 0) {
            //         var text = mapobject.geometry.getText();
            //         if (text != undefined) {
            //             if ($.isArray(text)) {
            //                 text = text.join('');
            //             }
            //         }
            //         else {
            //             text = '';
            //         }
            //         svg.createSVGText("text", glines, {
            //             d: d,
            //             style: styleline,
            //             'writing-mode': (_graphic.options.optionsFont['writing-mode']) ? _graphic.options.optionsFont['writing-mode']: '',
            //             text: text
            //         });
            //
            //     }
            //     else {
            //         svg.createSVGPath("path", glines, {d: d, style: styleline});
            //
            //         // Не сложилось со штриховкой на карте !!!!!
            //         // if (_graphic.options && _graphic.options.optionsHatch
            //         //     && _graphic.options.optionsHatch.options && _graphic.options.optionsHatch.options.length > 0) {
            //         //     var defs = _graphic.options.optionsHatch.getExampleHatchPatternSvg(_graphic.options.optionsHatch.options, true, 'hatchpattern');
            //         //     if (defs.defs) {
            //         //         var $defs = svg.createSvgDefs();
            //         //         // Удалить все паттерны
            //         //         $defs.find("pattern[name='hatchpattern']").remove();
            //         //         $defs.append(defs.defs);
            //         //         for(var i = 0; i < defs.defsId.length; i++) {
            //         //             svg.createSVGPath("hatch" + i.toString(), glines, {d: d, style: 'fill:url(#' + defs.defsId[i] + ')'});
            //         //         }
            //         //     }
            //         // }
            //     }
            // }

            return true;
         },


        /**
         * Отрисовка габаритов объекта 
         * @method drawbox
         * @param mapobject {Object} Объект карты GWTK.mapobject
         */
        // ===============================================================
        drawbox: function (mapobject, noevents) {

            if (!mapobject || !mapobject.geometry || !this.map || !this.svgDraw)
                return;
            this.mapobject = mapobject;

            // Установить габариты объекта в пикселах (bboxpixel)
            this.mapobject.setbbox();
            this.center = this.mapobject.getcenter(true);

            // создали группу
            var idobject = mapobject.maplayername + '_' + mapobject.id,
                gbox = document.createElementNS("http://www.w3.org/2000/svg", "g");
            gbox.setAttributeNS(null, "id", idobject + '_bboxJSON');

            var bboxpixel = this.mapobject.bboxpixel;
            var coord = { x: 0, y: 0 }, n_id, id, id_s,
                overlaypoint = [
                { x: this.mapobject.bboxpixel[0] - this.offsetbox, y: this.mapobject.bboxpixel[1] - this.offsetbox },
                { x: this.mapobject.bboxpixel[2] + this.offsetbox, y: this.mapobject.bboxpixel[1] - this.offsetbox },
                { x: this.mapobject.bboxpixel[2] + this.offsetbox, y: this.mapobject.bboxpixel[3] + this.offsetbox },
                { x: this.mapobject.bboxpixel[0] - this.offsetbox, y: this.mapobject.bboxpixel[3] + this.offsetbox },
                { x: this.mapobject.bboxpixel[0] - this.offsetbox, y: this.mapobject.bboxpixel[1] - this.offsetbox }
                ];

            this.boxpoints = [
                { x: overlaypoint[0].x, y: overlaypoint[0].y },
                { x: overlaypoint[0].x + (overlaypoint[1].x - overlaypoint[0].x) / 2, y: overlaypoint[0].y + (overlaypoint[1].y - overlaypoint[0].y) / 2 },
                { x: overlaypoint[1].x, y: overlaypoint[1].y },
                { x: overlaypoint[1].x + (overlaypoint[2].x - overlaypoint[1].x) / 2, y: overlaypoint[1].y + (overlaypoint[2].y - overlaypoint[1].y) / 2 },
                { x: overlaypoint[2].x, y: overlaypoint[2].y },
                { x: overlaypoint[2].x + (overlaypoint[3].x - overlaypoint[2].x) / 2, y: overlaypoint[2].y + (overlaypoint[3].y - overlaypoint[2].y) / 2 },
                { x: overlaypoint[3].x, y: overlaypoint[3].y },
                { x: overlaypoint[3].x + (overlaypoint[0].x - overlaypoint[3].x) / 2, y: overlaypoint[3].y + (overlaypoint[0].y - overlaypoint[3].y) / 2 },

                // первая точка
                { x: overlaypoint[0].x, y: overlaypoint[0].y }
            ];
            // точка вращения
            this.boxpoints.push({ x: this.boxpoints[1].x, y: this.boxpoints[1].y - this.offsettop });

            return this._drawbox(idobject, gbox, noevents);

        },


        /**
         * Отрисовка габаритов группы объектов
         * @method drawbox
         * @param mapobject {Object} Объект карты GWTK.mapobject
         */
        // ===============================================================
        drawboxGroup: function (mapobjects, noevents) {

            if (!mapobjects || !(mapobjects instanceof Array)  || mapobjects.length == 0)
                return;
            this.mapobject = mapobjects[0];
            var len = mapobjects.length,
                bboxpixel, overlaypoint = [],
                coord = { x: 0, y: 0 }, n_id, id, id_s;

            for (var i = 0; i < len; i++) {
                mapobjects[i].setbbox();

                // Пройдемся по первому, найдем габариты
                if (i == 0) {
                    bboxpixel = mapobjects[i].bboxpixel;
                    overlaypoint = [
                    { x: mapobjects[i].bboxpixel[0], y: mapobjects[i].bboxpixel[1] },
                    { x: mapobjects[i].bboxpixel[2], y: mapobjects[i].bboxpixel[1] },
                    { x: mapobjects[i].bboxpixel[2], y: mapobjects[i].bboxpixel[3] },
                    { x: mapobjects[i].bboxpixel[0], y: mapobjects[i].bboxpixel[3] },
                    { x: mapobjects[i].bboxpixel[0], y: mapobjects[i].bboxpixel[1] }
                    ];
                }
                else {
                    overlaypoint[0].x = Math.min(mapobjects[i].geometry.bboxpixel[0], overlaypoint[0].x);
                    overlaypoint[0].y = Math.min(mapobjects[i].geometry.bboxpixel[1], overlaypoint[0].y);
                    overlaypoint[1].x = Math.max(mapobjects[i].geometry.bboxpixel[2], overlaypoint[1].x);
                    overlaypoint[1].y = Math.min(mapobjects[i].geometry.bboxpixel[1], overlaypoint[1].y);
                    overlaypoint[2].x = Math.max(mapobjects[i].geometry.bboxpixel[2], overlaypoint[2].x);
                    overlaypoint[2].y = Math.max(mapobjects[i].geometry.bboxpixel[3], overlaypoint[2].y);
                    overlaypoint[3].x = Math.min(mapobjects[i].geometry.bboxpixel[0], overlaypoint[3].x);
                    overlaypoint[3].y = Math.max(mapobjects[i].geometry.bboxpixel[3], overlaypoint[3].y);
                    overlaypoint[4].x = Math.min(mapobjects[i].geometry.bboxpixel[0], overlaypoint[4].x);
                    overlaypoint[4].y = Math.min(mapobjects[i].geometry.bboxpixel[1], overlaypoint[4].y);
                }
            }

            // Расширим на смещение
            overlaypoint[0].x -= this.offsetbox;
            overlaypoint[0].y -= this.offsetbox;
            overlaypoint[1].x += this.offsetbox;
            overlaypoint[1].y -= this.offsetbox;
            overlaypoint[2].x += this.offsetbox;
            overlaypoint[2].y += this.offsetbox;
            overlaypoint[3].x -= this.offsetbox;
            overlaypoint[3].y += this.offsetbox;
            overlaypoint[4].x -= this.offsetbox;
            overlaypoint[4].y -= this.offsetbox;

            this.center = GWTK.point(overlaypoint[0].x + (overlaypoint[2].x - overlaypoint[0].x) / 2, overlaypoint[1].y + (overlaypoint[3].y - overlaypoint[1].y) / 2);

            // создали группу
            var idobject = this.getIdForGroup(mapobjects[0]),
                //this.svgDraw.svgIdentIds + '_' + mapobjects[0].maplayername + '_' + mapobjects[0].id,
                gbox = document.createElementNS("http://www.w3.org/2000/svg", "g");
            gbox.setAttributeNS(null, "id", idobject + '_bboxJSON');

            this.boxpoints = [
                { x: overlaypoint[0].x, y: overlaypoint[0].y },
                { x: overlaypoint[0].x + (overlaypoint[1].x - overlaypoint[0].x) / 2, y: overlaypoint[0].y + (overlaypoint[1].y - overlaypoint[0].y) / 2 },
                { x: overlaypoint[1].x, y: overlaypoint[1].y },
                { x: overlaypoint[1].x + (overlaypoint[2].x - overlaypoint[1].x) / 2, y: overlaypoint[1].y + (overlaypoint[2].y - overlaypoint[1].y) / 2 },
                { x: overlaypoint[2].x, y: overlaypoint[2].y },
                { x: overlaypoint[2].x + (overlaypoint[3].x - overlaypoint[2].x) / 2, y: overlaypoint[2].y + (overlaypoint[3].y - overlaypoint[2].y) / 2 },
                { x: overlaypoint[3].x, y: overlaypoint[3].y },
                { x: overlaypoint[3].x + (overlaypoint[0].x - overlaypoint[3].x) / 2, y: overlaypoint[3].y + (overlaypoint[0].y - overlaypoint[3].y) / 2 },

                // первая точка
                { x: overlaypoint[0].x, y: overlaypoint[0].y }
            ];
            // точка вращения
            this.boxpoints.push({ x: this.boxpoints[1].x, y: this.boxpoints[1].y - this.offsettop });

            return this._drawbox(idobject, gbox, noevents, (mapobjects.length > 1) ? true : false);

        },


        /**
         * Отрисовать габаритную рамку
         * @param idobject - Идентификатор объекта
         * @param gbox - группа для рамки
         * @param noevents - события на точки объекта
         * @param ispoint - признак отрисовки точек габаритной рамки для точечого объекта
         * @returns {boolean}
         * @private
         */
        _drawbox: function (idobject, gbox, noevents, ispoint) {
            if (!this.boxpoints) return;
            var svg = this.svgDraw;

            var fn = [
                        {
                            "event": "onmouseover",
                            "func": "GWTK.DrawingObject.prototype.onPointMouseOver(evt,'" + this.map.eventPane.id + "')"
                        },
                        {
                            "event": "onmousedown",
                            "func": "GWTK.DrawingObject.prototype.onPointMouseDown(evt,'" + this.map.eventPane.id + "')"
                        },
                        {
                            "event": "onmouseout",
                            "func": "GWTK.DrawingObject.prototype.onPointMouseOut(evt,'" + this.map.eventPane.id + "')"
                        }
                    ];

            if (noevents) {
                fn = new Array();
            }

            if (!ispoint) {
                ispoint = (this.mapobject && this.mapobject.spatialposition && this.mapobject.spatialposition.toLowerCase() != 'point') ? true : false;
            }

            var boxpoints = this.boxpoints, elpoint;
            if (ispoint)
                svg.createSVGline(this.pointprefix + "bol" + '_' + idobject + '_' + boxpoints.length.toString() + "_rotate", gbox, { "x1": boxpoints[1].x, "y1": boxpoints[1].y, "x2": boxpoints[9].x, "y2": boxpoints[9].y, "style": this.stylelineBbox });

            for (var i = 0; i < boxpoints.length - 1; i = i + 2) {
                n_id = idobject + '_' + i.toString();
                id_l = this.pointprefix + "bol" + '_' + n_id;
                if (i == 0)
                    continue;
                svg.createSVGline(id_l, gbox, { "x1": boxpoints[i - 2].x, "y1": boxpoints[i - 2].y, "x2": boxpoints[i].x, "y2": boxpoints[i].y, "style": this.stylelineBbox });
            }

            // для точечного объекта не надо точек на габаритной рамке
            if (ispoint) {
                for (var i = 0; i < boxpoints.length - 2; i++) {
                    n_id = idobject + '_' + i.toString();
                    id = this.pointprefix + "bop" + '_' + n_id;
                    elpoint = svg.createSVGcircle(id, gbox, { "cx": boxpoints[i].x, "cy": boxpoints[i].y, "r": 6, "style": this.stylepointBbox, "transform": "matrix(1 0 0 1 0 0)" }, fn);
                    if (elpoint) {
                        elpoint.setAttributeNS(null, 'originalstyle', elpoint.getAttributeNS(null, 'style'));
                        elpoint.setAttributeNS(null, 'originalradius', elpoint.getAttributeNS(null, 'r'));
                    }
                }

                elpoint = svg.createSVGcircle(id + "_rotate", gbox, { "cx": boxpoints[9].x, "cy": boxpoints[9].y, "r": 6, "style": this.stylepointBbox, "transform": "matrix(1 0 0 1 0 0)" }, fn);
                if (elpoint) {
                    elpoint.setAttributeNS(null, 'originalstyle', elpoint.getAttributeNS(null, 'style'));
                    elpoint.setAttributeNS(null, 'originalradius', elpoint.getAttributeNS(null, 'r'));
                }
            }

            svg.appendElement(gbox, svg.svgCanvas);
            return true;
        },


        /**
        * Запрос массива точек объекта
        * @method getpoints
        * @param mapobject {Object} Объект карты GWTK.mapobject
        * @param subject {Int} Номер контура (с 0)
        * @returns (Array GWTK.Point3D) массив объектов  GWTK.Point3D
        */
        // ===============================================================
        getpoints: function (mapobject, subject) {
            mapobject.geometry.count(subject);
            return (!subject || subject <= 0) ? mapobject.geometry.points : mapobject.geometry.subjects[subject - 1].points;
        },

        /**
         * Скрыть точку
         * @method hidepoint
         * @param elem {Element} svg-элемент точки
         */
        // ===============================================================
        hidepoint: function (elem) {
            if (!elem || elem.nodeName == 'path' ||
                elem.nodeName == 'line')
                return;

            var style = 'fill:' + this.options_points['fill'] + '; stroke:' + this.options_points['stroke'] + '; stroke-width:0px'
             + '; fill-opacity:0.0;' + ' vector-effect:' + this.options_points['vector-effect'] + ';';
            elem.setAttributeNS(null, 'style', style);
        },

        /**
         * Запрос атрибутов положения точки
         * @method hidepoint
         * @param elem {Element} svg-элемент circle или rect
         */
        // ===============================================================
        getpointattr: function (elem) {
            switch (elem.nodeName) {
                case 'circle':
                    return ['cx', 'cy'];
                case 'rect':
                    return ['x', 'y'];
            }
        },

        /**
         * Отрисовка вспомогательных линий к точке объекта при изменении положения точки
         * @method drawline
         * @param id {String} Идентификатор линии объекта, используется для определения стиля линии
         * @param ui {Object} Объект, содержащий позицию одной из точек линии
         * @param divid {String} Идентификатор точки
         * @param updatepoint (String) Признак обновления точки линии 'first' или 'last'
         */
        // ===============================================================
        drawline: function (id, ui, divid, updatepoint) {
            var prev, next, lineid, drawpoint;
            var offset = this.offsetCenter(divid);
            var drawpoint;
            switch (updatepoint) {
                case 'first':
                    prev = GWTK.point(ui.position.left + offset[0], ui.position.top + offset[1]);
                    next = this.getpositionByPointId(this._setPointIdByPointId(divid, 'next'));
                    if (!next) return;
                    lineid = 'addlines1';
                    break;
                case 'last':
                    next = GWTK.point(ui.position.left + offset[0], ui.position.top + offset[1]);
                    prev = this.getpositionByPointId(this._setPointIdByPointId(divid, 'prev'));
                    if (!prev) return;
                    lineid = 'addlines2';
                    break;
                default:
                    return;
            }

            GWTK.DrawingObject.prototype.removeDomElement(lineid);

            // найдем подобъект
            var subjectnumber = this.getsubjectnumber(divid);
            var iddrawobj = this.getgroupId(subjectnumber);
            var el = document.getElementById(iddrawobj + '_' + 'pointsJSON');
            var styleline = (subjectnumber > 0) ? this.styleline_subject : this.styleline;

            // Найдем родителя
            var parent = document.getElementById(this.mapobject.maplayername + '_' + this.mapobject.id + '_objectJSON');
            this.svgDraw.createSVGline(lineid, parent, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline }, null, el);

        },

        /**
         * Отрисовка окружности/дуги
         * @method drawcircle
         * @param idgroup {String} Идентификатор svg группы, в которой будет создан элемент окружности
         * @param points {Array GWTK.Point} Массив из двух точек (радиус)
         * @param anglestep {Double} Шаг для построения точек (угол)
         * @param parent {Object} Родительский элемент в dom модели, куда нужно окружности
         * @param before {Object} Элемент в dom модели, перед которым нужно добавить окружность
         */
        // ===============================================================
        drawcircle: function (idgroup, points, anglestep, parent, before) {
            if (!idgroup || !points || points instanceof Array == false || points.length < 2 || !this.context)
                return;


            var radius = Math.sqrt(
                (points[1].x - points[0].x) * (points[1].x - points[0].x) + (points[1].y - points[0].y) * (points[1].y - points[0].y)
                );
            if (radius < this.context.options.topology.captureradius) {
                radius = this.context.options.topology.captureradius;
            }

            var dAngle, circlepointcount;
            if (anglestep) {
                dAngle = anglestep;
                circlepointcount = dAngle * 2.0 * Math.PI;
            }

            else {
                var stepsize = this.context.options.topology.captureradius / 4;
                if (stepsize > 0) {
                    circlepointcount = parseInt((Math.PI * 2 * radius / stepsize));
                }
                else {
                    circlepointcount = parseInt(Math.PI * 2 * radius);
                }
                dAngle = 2.0 * Math.PI / circlepointcount;
            }
            // Найдем последний созданный объект
            el = this.getpointElemLast();
            if (!el) return;
            var subjectnumber = this.getsubjectnumber(el.id);
            var iddrawobj = this.getgroupId(subjectnumber);
            before = (before) ? before : document.getElementById(iddrawobj + '_' + 'pointsJSON');
            var styleline = (subjectnumber > 0) ? this.styleline_subject : this.styleline;

            var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttributeNS(null, "id", idgroup);
            g.setAttributeNS(null, "style", styleline);

            var prev = new GWTK.point(points[0].x, points[0].y), next, first;
            for (var i = 0, ang = 0.0; i < circlepointcount; i++, ang += dAngle) {
                next = new GWTK.point(radius * Math.sin(ang) + points[0].x, radius * Math.cos(ang) + points[0].y);
                // Нарисовать линию
                if (i > 0) {
                    this.svgDraw.createSVGline(idgroup + i.toString(), g, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline });
                }
                else
                    first = new GWTK.point(next.x, next.y);
                prev = new GWTK.point(next.x, next.y)
            }

            // Замыкание
            this.svgDraw.createSVGline(idgroup + circlepointcount.toString(), g, { "x1": prev.x, "y1": prev.y, "x2": first.x, "y2": first.y, "style": styleline });

            // Найдем родителя
            var parent = document.getElementById(this.mapobject.maplayername + '_' + this.mapobject.id + '_objectJSON');
            if (parent)
                this.svgDraw.appendElement(g, parent, before);
            else
                this.svgDraw.appendElement(g, this.svgDraw.svgCanvas, before);
        },

        /**
         * Отрисовка линий-перпендикуляров к точкам (наклонный прямоугольник)
         * @method drawperpendicularlines
         * @param lineworkid {Array String} Массив идентификаторов линий
         * @param points {Array GWTK.Point} Массив из двух точек (одна сторона прямоугольника)
         * @param marker {GWTK.Point} Точка положения мыши 
         * @param before {Object} Элемент в dom модели, перед которым нужно добавить прямоугольник
         */
        // ===============================================================
        drawperpendicularlines: function (lineworkid, points, marker, before) {
            if (!points || points instanceof Array == false || points.length < 2 || !marker || lineworkid instanceof Array == false || lineworkid.length < 4)
                return;

            // Найдем последний созданный объект
            el = this.getpointElemLast();
            if (!el) return;
            var subjectnumber = this.getsubjectnumber(el.id);
            var iddrawobj = this.getgroupId(subjectnumber);
            before = (before) ? before : document.getElementById(iddrawobj + '_' + 'pointsJSON');
            var styleline = (subjectnumber > 0) ? this.styleline_subject : this.styleline;

            // Найдем родителя
            var parent = document.getElementById(this.mapobject.maplayername + '_' + this.mapobject.id + '_objectJSON');
            if (points[0].x == points[1].x) {
                this.svgDraw.createSVGline(lineworkid[1], parent, { "x1": points[1].x, "y1": points[1].y, "x2": marker.x, "y2": points[1].y, "style": styleline }, null, before);
                this.svgDraw.createSVGline(lineworkid[2], parent, { "x1": marker.x, "y1": points[1].y, "x2": marker.x, "y2": points[0].y, "style": styleline }, null, before);
                this.svgDraw.createSVGline(lineworkid[3], parent, { "x1": marker.x, "y1": points[0].y, "x2": points[0].x, "y2": points[0].y, "style": styleline }, null, before);
                return;
            }

            if (points[0].y == points[1].y) {
                this.svgDraw.createSVGline(lineworkid[1], parent, { "x1": points[1].x, "y1": points[1].y, "x2": points[1].x, "y2": marker.y, "style": styleline }, null, before);
                this.svgDraw.createSVGline(lineworkid[2], parent, { "x1": points[1].x, "y1": marker.y, "x2": points[0].x, "y2": marker.y, "style": styleline }, null, before);
                this.svgDraw.createSVGline(lineworkid[3], parent, { "x1": points[0].x, "y1": marker.y, "x2": points[0].x, "y2": points[0].y, "style": styleline }, null, before);
                return;
            }

            var k = (points[1].y - points[0].y) / (points[1].x - points[0].x);
            var b2 = marker.y - k * marker.x;
            var b3 = points[0].y + (1.0 / k * points[0].x);
            var b4 = points[1].y + (1.0 / k * points[1].x);
            var p3 = new GWTK.point(((b4 - b2) * k) / (k * k + 1), (b2 + k * k * b4) / (1 + k * k));
            var p4 = new GWTK.point(((b3 - b2) * k) / (k * k + 1), (b2 + k * k * b3) / (1 + k * k));

            this.svgDraw.createSVGline(lineworkid[1], parent, { "x1": points[1].x, "y1": points[1].y, "x2": p3.x, "y2": p3.y, "style": styleline }, null, before);
            this.svgDraw.createSVGline(lineworkid[2], parent, { "x1": p3.x, "y1": p3.y, "x2": p4.x, "y2": p4.y, "style": styleline }, null, before);
            this.svgDraw.createSVGline(lineworkid[3], parent, { "x1": p4.x, "y1": p4.y, "x2": points[0].x, "y2": points[0].y, "style": styleline }, null, before);

        },


        /**
         * Отрисовка линий-перпендикуляров для сложного многоугольника
         * @method drawmultirect
         * @param lineworkid {Array String} Массив идентификаторов линий
         * @param points {Array GWTK.Point} Массив из двух точек (одна сторона прямоугольника)
         * @param marker {GWTK.Point} Точка положения мыши 
         * @param before {Object} Элемент в dom модели, перед которым нужно добавить прямоугольник
         */
        // ===============================================================
        drawmultirect: function (lineworkid, points, marker, before) {
            if (!points || points instanceof Array == false || points.length < 2 || !marker || lineworkid instanceof Array == false || lineworkid.length < 4)
                return;

            // Найдем последний созданный объект
            el = this.getpointElemLast();
            if (!el) return;
            var subjectnumber = this.getsubjectnumber(el.id);
            var iddrawobj = this.getgroupId(subjectnumber);
            before = (before) ? before : document.getElementById(iddrawobj + '_' + 'pointsJSON');
            var styleline = (subjectnumber > 0) ? this.styleline_subject : this.styleline;
            var k, b2, b3, b4, p3, p4;

            // Найдем родителя
            var parent = document.getElementById(this.mapobject.maplayername + '_' + this.mapobject.id + '_objectJSON');

            if (points[0].x == points[1].x) {
                p3 = new GWTK.point(marker.x, points[1].y);
                p4 = new GWTK.point(marker.x, points[0].y);
                this.svgDraw.createSVGline(lineworkid[0], parent, { "x1": points[1].x, "y1": points[1].y, "x2": p3.x, "y2": p3.y, "style": styleline }, null, before);
                this.svgDraw.createSVGline(lineworkid[1], parent, { "x2": p4.x, "y2": p4.y, "x2": points[0].x, "y2": points[0].y, "style": styleline }, null, before);
            }
            else {
                if (points[0].y == points[1].y) {
                    p3 = new GWTK.point(points[1].x, marker.y);
                    p4 = new GWTK.point(points[0].x, marker.y);
                    this.svgDraw.createSVGline(lineworkid[0], parent, { "x1": points[1].x, "y1": points[1].y, "x2": p3.x, "y2": p3.y, "style": styleline }, null, before);
                    this.svgDraw.createSVGline(lineworkid[1], parent, { "x2": p4.x, "y2": p4.y, "x2": points[0].x, "y2": points[0].y, "style": styleline }, null, before);
                }
                else {
                    k = (points[1].y - points[0].y) / (points[1].x - points[0].x);
                    b2 = marker.y - k * marker.x;
                    b3 = points[0].y + (1.0 / k * points[0].x);
                    b4 = points[1].y + (1.0 / k * points[1].x);
                    p3 = new GWTK.point(((b4 - b2) * k) / (k * k + 1), (b2 + k * k * b4) / (1 + k * k));
                    p4 = new GWTK.point(((b3 - b2) * k) / (k * k + 1), (b2 + k * k * b3) / (1 + k * k));

                    this.svgDraw.createSVGline(lineworkid[0], parent, { "x1": points[1].x, "y1": points[1].y, "x2": p3.x, "y2": p3.y, "style": styleline }, null, before);
                    this.svgDraw.createSVGline(lineworkid[1], parent, { "x1": p4.x, "y1": p4.y, "x2": points[0].x, "y2": points[0].y, "style": styleline }, null, before);
                }
            }

            points = [new GWTK.point(points[1].x, points[1].y), new GWTK.point(p3.x, p3.y)];

            if (points[0].x == points[1].x) {
                this.svgDraw.createSVGline(lineworkid[2], parent, { "x1": points[1].x, "y1": points[1].y, "x2": marker.x, "y2": points[1].y, "style": styleline }, null, before);
                this.svgDraw.createSVGline(lineworkid[3], parent, { "x1": marker.x, "y1": points[0].y, "x2": points[0].x, "y2": points[0].y, "style": styleline }, null, before);
                return;
            }

            if (points[0].y == points[1].y) {
                this.svgDraw.createSVGline(lineworkid[2], parent, { "x1": points[1].x, "y1": points[1].y, "x2": points[1].x, "y2": marker.y, "style": styleline }, null, before);
                this.svgDraw.createSVGline(lineworkid[3], parent, { "x1": points[0].x, "y1": marker.y, "x2": points[0].x, "y2": points[0].y, "style": styleline }, null, before);
                return;
            }

            k = (points[1].y - points[0].y) / (points[1].x - points[0].x);
            b2 = marker.y - k * marker.x;
            b3 = points[0].y + (1.0 / k * points[0].x);
            b4 = points[1].y + (1.0 / k * points[1].x);
            p3 = new GWTK.point(((b4 - b2) * k) / (k * k + 1), (b2 + k * k * b4) / (1 + k * k));

            this.svgDraw.createSVGline(lineworkid[2], parent, { "x1": points[1].x, "y1": points[1].y, "x2": p3.x, "y2": p3.y, "style": styleline }, null, before);
            this.svgDraw.createSVGline(lineworkid[3], parent, { "x1": p4.x, "y1": p4.y, "x2": p3.x, "y2": p3.y, "style": styleline }, null, before);


        },

        /**
         * Запрос идентификатора группы объекта/контура объекта
         * @method getgroupId
         * @param subject {Int} Номер контура (с 0)
         * @returns (String)
         */
        // ===============================================================
        getgroupId: function (subject) {
            if (this.mapobject)
                return this.mapobject.maplayername + '_' + this.mapobject.id + '_' + ((subject) ? subject : 0).toString();
        },

        /**
         * Запрос идентификатора элемента объекта карты для ГРУППОВЫХ операций (при отрисовке geoJSON)
         * @param mapobject - объект карты
         * @param subject - номер подобъеткта с 0
         * @param group - признак групповых операция
         * @returns {*|void}
         */
        getIdForGroup: function (mapobject) {
            if (mapobject && this.svgDraw){
                return this.svgDraw.getId(mapobject.maplayername + '_' + mapobject.id);
            }
        },

        /**
         * Запрос положения точки по ее идентификатору
         * @method getpositionByPointId
         * @param id {String} Идентификатор точки
         * @returns (GWTK.Point)
         */
        // ===============================================================
        getpositionByPointId: function (id) {
            var el = document.getElementById(id);
            if (!el)
                return;
            var attr = this.getpointattr(el);
            if (!attr)
                return;
            var offset = this.offsetCenter(id);
            return new GWTK.point(parseFloat(el.getAttributeNS(null, attr[0])) + offset[0], parseFloat(el.getAttributeNS(null, attr[1])) + offset[1]);
        },

        /**
         * Запрос положения элемента
         * @method getpositionElement
         * @param el {Element} Элемент в dom модели
         * @returns (GWTK.Point)
         */
        // ===============================================================
        getpositionElement: function (el) {
            if (!el) return;
            var attr = this.getpointattr(el);
            if (!attr) return;
            var offset = this.offsetCenterElement(el);
            return new GWTK.point(parseFloat(el.getAttributeNS(null, attr[0])) + offset[0], parseFloat(el.getAttributeNS(null, attr[1])) + offset[1]);
        },

        /**
         * Запрос смещения на середину элемента по идентификатору элемента
         * @method offsetCenter
         * @param id {String} Идентификатор элемента
         * @returns (Array) Двухмерный массив
         */
        // ===============================================================
        offsetCenter: function (id) {
            var el = document.getElementById(id);
            return this.offsetCenterElement(el);
        },

        /**
         * Запрос смещения на середину элемента 
         * @method offsetCenterElement
         * @param el {Element} Элемент в dom модели
         * @returns (Array) Двухмерный массив
         */
        // ===============================================================
        offsetCenterElement: function (el) {
            var offset = [0, 0];
            if (!el) return offset;
            var width, height;
            switch (el.nodeName) {
                case 'circle':
                    //  width = height = parseFloat(el.getAttributeNS(null, 'r'));
                    width = height = 0;
                    break;
                case 'rect':
                    width = parseFloat(el.getAttributeNS(null, 'width'));
                    height = parseFloat(el.getAttributeNS(null, 'height'));
                    break;
            }

            if (width && height) {
                return [width / 2, height / 2]
            }
            return offset;
        },

        /**
         * Отрисовка перетаскивание точки контура 
         * @method movepoint
         * @param div {Element} Элемент в dom модели
         * @param ui {Object} Объект, содержащий позицию точки 
         * @param local {String} локализация редактируемого объекта карты:
         * 'polygon', 'linestring', 'vector', 'title', 'curve'
         */
        // ===============================================================
        movepoint: function (div, local, ui) {
            this._removeservicelines();

            var number = this.getnumber(div.id);
            if (number < 0) return false;

            var subj = this.getsubjectnumber(div.id);
            var points = this.getpoints(this.mapobject, subj);
            if (!points || points.length == 0) return;

            var id, countpoint = points.length - 1;
            switch (local.toLowerCase()) {
                case 'polygon':
                    if (number == countpoint) {// последняя
                        this.drawline(this._setLineIdByPointId(div.id, 'curr'), ui, div.id, 'last');
                        var firstid = this._setPointId(div.id, 0);
                        this.drawline(this._setLineIdByPointId(firstid, 'next'), ui, firstid, 'first');
                    }
                    else {
                        if (number != 0) { // не первая
                            this.drawline(this._setLineIdByPointId(div.id, 'curr'), ui, div.id, 'last');
                            this.drawline(this._setLineIdByPointId(div.id, 'next'), ui, div.id, 'first');
                        }
                        else {
                            this.drawline(this._setLineIdByPointId(div, 'next'), ui, div.id, 'first');
                            var lastid = this._setPointId(div.id, countpoint);
                            this.drawline(this._setLineIdByPointId(lastid, 'curr'), ui, lastid, 'last');
                        }
                    }
                    break;
                case 'linestring':
                case 'multilinestring':
                case 'vector':
                case 'title':
                case 'curve':
                    if (number == 0) {// нулевая точка
                        // удалить линию с номером 1, пересчитать координату первой точки и создать новую линию
                        this.drawline(this._setLineIdByPointId(div.id, 'next'), ui, div.id, 'first');
                    }
                    else {
                        if (number == countpoint) {   // найти линию с номером number, пересчитать координату второй точки и перерисовать
                            var lastid = this._setPointId(div.id, countpoint);
                            this.drawline(this._setLineIdByPointId(lastid, 'curr'), ui, lastid, 'last');
                        }
                        else { // пересчитать обе точки             
                            this.drawline(this._setLineIdByPointId(div.id, 'curr'), ui, div.id, 'last');
                            this.drawline(this._setLineIdByPointId(div.id, 'next'), ui, div.id, 'first');
                        }
                    }
                    break;
            }
        },


        /**
        * Отрисовка перетаскивания средней точки линии контура 
        * @method movepointcenter
        * @param div {Element} Элемент в dom модели
        * @param ui {Object} Объект, содержащий позицию точки 
        */
        // ===============================================================
        movepointcenter: function (div, ui) {
            this._removeservicelines();

            // найдем элемент, перед которым вставить линии
            var subjectnumber = this.getsubjectnumber(div.id);
            var iddrawobj = this.getgroupId(subjectnumber);
            var el = document.getElementById(iddrawobj + '_' + 'pointsJSON');
            var styleline = (subjectnumber > 0) ? this.styleline_subject : this.styleline;
            // Найдем родителя
            var parent = document.getElementById(this.mapobject.maplayername + '_' + this.mapobject.id + '_objectJSON');

            var prev, next;
            prev = this.getpositionByPointId(this._setPointIdByPointId(div.id, 'prev'));
            if (!prev) {
                //console.log(div);
                return;
            }
            next = GWTK.point(ui.position.left, ui.position.top);
            this.svgDraw.createSVGline('addlines1', parent, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline }, null, el);

            prev = this.getpositionByPointId(this._setPointIdByPointId(div.id, 'curr'));
            if (!prev) {
                //console.log(div);
                return;
            }
            this.svgDraw.createSVGline('addlines2', parent, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline }, null, el);
        },


        // сформировать id точки по id точки 
        // type : curr - текуший номер,  prev - предыдущий, next - следующий
        _setPointIdByPointId: function (id, type, center) {
            if (id == undefined || id == null)
                return;
            var count, indnumber, ret = '', mass = id.split('_');
            if (mass == null || (count = mass.length) < 4)
                return;
            indnumber = count - 1;
            if (mass[count - 1] == 'center')
                indnumber = count - 2;
            var number = parseInt(mass[indnumber]);
            switch (type) {
                case 'curr':
                    break;
                case 'prev':
                    number -= 1;
                    break;
                case 'next':
                    number += 1;
                    break;
                default:
                    return;
            }

            for (var i = 0; i < indnumber; i++)
                ret += mass[i] + '_';
            ret += number.toString();

            if (center) // если центральная
                ret += '_center';
            return ret;
        },


        // определить номер точки или линии по id
        // c 0
        getnumber: function (id) {
            if (!id) return;
            var count, indnumber, mass = id.split("_");
            if (mass == null || (count = mass.length) < 4)
                return;
            indnumber = count - 1;
            if (mass[count - 1] == 'center')
                indnumber = count - 2;

            return parseInt(mass[indnumber]);
        },

        // определить номер подобъекта или линии по id
        // c 0
        getsubjectnumber: function (id) {
            if (!id) return;
            var count, indnumber, mass = id.split("_");
            if (mass == null || (count = mass.length) < 4)
                return;
            indnumber = count - 2;
            if (mass[count - 1] == 'center')
                indnumber = count - 3;

            return parseInt(mass[indnumber]);
        },

        /**
         * запрос на центральную точку линии
         * @param id - идентификаор точки на холсте
         * @returns {boolean}
         */
        iscenter: function(id) {
            if (!id) return;
            if (id.indexOf('center') >= 0) {
                return true
            }
        },

        /**
         * Запрос на сервисную точку объектв
         * @param id - идентификаор точки на холсте
         * @returns {boolean}
         */
        isservice: function(id){
            if (!id) return;
            if (id.indexOf('rotate') >= 0 || id.indexOf('bop') >= 0) {
                return true
            }
        },

        // Запросить элемен точки по номеру
        getpointElemByNumber: function (subject, number) {
            subject = (subject) ? subject : 0;
            var group = document.getElementById(this.getgroupId(subject) + '_' + 'pointsJSON');
            if (!group) return;
            var elems = group.childNodes;
            elems = Array.prototype.slice.call(elems); // теперь elems - массив
            var k = -1;
            for (var i = 0; i < elems.length; i++) {
                if (elems[i].id.indexOf('center') >= 0) 
                    continue;
                //if (elems[i].nodeName != 'rect') continue;
                k++;
                if (number == k) {
                    return elems[i];
                }
            }
        },

        // Запросить последний элемент точки
        getpointElemLast: function (subject) {
            subject = (subject >= 0) ? subject : -1;
            var group;
            if (subject < 0) { // найдем группу
                subject = 0;
                while (document.getElementById(this.getgroupId(subject) + '_' + 'pointsJSON'))
                { subject++ };
                subject--;
            }
            if (subject < 0 || !(group = document.getElementById(this.getgroupId(subject) + '_' + 'pointsJSON'))) return;
            var elems = group.childNodes;
            elems = Array.prototype.slice.call(elems); // теперь elems - массив
            if (elems && elems.length > 0)
                return elems[elems.length - 1];
        },


        // контур геометрии по номеру подобъекта
        getgeometryBysubjectnumber: function (subjectnumber) {
            if (!subjectnumber) return;
            var mass = subjectnumber.splite(subjectnumber);
            if (!mass || mass.length == 0)
                return;
            var geometry = this.mapobject.geometry;
            for (var i = 1; i < mass.length; i++) {
                geometry = geometry.getsubjectgeometry(mass[i]);
            }
            return geometry;
        },

        // удалить направляющие линии при перетаскивании точек
        _removeservicelines: function () {
             GWTK.DrawingObject.prototype.removeDomElement('addlines1');
             GWTK.DrawingObject.prototype.removeDomElement('addlines2');
        },

        _geo2pixelOffset: function (map, geo) {
            //var point = GWTK.tileView.geo2pixelOffset(map, geo);
            var point = GWTK.tileView.geo2pixelOffsetMap(map, geo);

             // проверить по габаритам
             var matrix = GWTK.tileView.getTileMatrixSize(map);
             if (map.getWindowSize()[0] >= matrix.width) {                  // размер окна больше ширины матрицы
                 var bbox_geo = map.getMapGeoBounds();
                 var bbox = [-180, -90, 180, 90];
                 if (bbox_geo.SW.lng - bbox[0] > 120) {
                     point["x"] += matrix.width;
                 }
             }

            //var point = GWTK.tileView.geo2pixel(this.map, geo);
            return point;
        },

        // сформировать id линии по id точки 
        // type : curr - текуший номер,  prev - предыдущий, next - следующий
        // id = placemarkDivdiv + '_' + mop  + '_' + layer + '_' + id + '_' + subject + '_' + i + '_center'; (center - для центра)
        // выход = mol  + '_' + layer + '_' + id + '_' + subject + '_' + i
        _setLineIdByPointId: function (id, type) {

            if (!id) return;
            var count, indnumber, mass = id.split('_');
            if (mass == null || (count = mass.length) < 4)
                return;
            indnumber = count - 1;
            if (mass[count - 1] == 'center')
                indnumber = count - 2;
            var number = parseInt(mass[indnumber]);
            switch (type) {
                case 'curr':
                    return id.replace(this.pointprefix + 'mop', 'mol').replace('_center', '');
                case 'prev':
                    number -= 1;
                    break;
                case 'next':
                    number += 1;
                    break;
                default:
                    return;
            }

            var ret = 'mol_';
            for (var i = 2; i < indnumber; i++)
                ret += mass[i] + '_';
            ret += number.toString();
            return ret;

        },

        // сформировать id точки по ноиеру точки
        // type : curr - текуший номер,  prev - предыдущий, next - следующий
        // id = placemarkDivdiv + '_' + mop  + '_' + layer + '_' + id + '_' + subject + '_' + i + '_center'; (center - для центра)
        // выход = mol  + '_' + layer + '_' + id + '_' + subject + '_' + i
        _setPointId: function (id, number) {
            if (!id) return;

            var count, indnumber, ret = '', mass = id.split('_');
            if (mass == null || (count = mass.length) < 4)
                return;
            indnumber = count - 1;
            if (mass[count - 1] == 'center')
                indnumber = count - 2;

            for (var i = 0; i < indnumber; i++)
                ret += mass[i] + '_';
            ret += number.toString();

            return ret;
        },

        // события при наведении на точку
        onPointMouseOut: function (evt, eventPanelId) {
            if (!evt || !eventPanelId) return;
            var el = evt.target;

            var original = el.getAttributeNS(null, 'originalstyle');
            if (original) {
                el.setAttributeNS(null, 'style', el.getAttributeNS(null, 'originalstyle'));
                if (el.nodeName == 'circle') {
                    el.setAttributeNS(null, 'r', el.getAttributeNS(null, 'originalradius'));
                }
            }

            GWTK.StatusBarControl.prototype.clearText();

            $('#' + eventPanelId).trigger({ type: 'drawmark_mouseout', sender: evt.target });

        },

        onPointMouseOver: function (evt, eventPanelId) {
            if (!evt || !eventPanelId) return;

            var options_points_over =
           {
               "stroke": "black",// "#00BA00",//"black",
               "stroke-width": "1px",
               "stroke-opacity": "1.0", //"1.0",
               //"vector-effect": "non-scaling-stroke",
               "fill": "yellow",
               "background": "",
               "background-size": "auto auto",
               "fill-opacity": "0.9",
               "font-family": "Verdana",
               "font-size": "12px",
               "letter-spacing": "1",
               "startOffset": "2%",
               "text": ""
           };

            var style = 'fill:' + options_points_over['fill'] + '; stroke:' + options_points_over['stroke'] + '; stroke-width:'
                + options_points_over['stroke-width'] + '; stroke-opacity:' + options_points_over['stroke-opacity'] +
                '; fill-opacity:' + options_points_over['fill-opacity'] + ';' +
                ' vector-effect:' + options_points_over['vector-effect'] + ';';

            var el = evt.target, overr = '6';
            el.setAttributeNS(null, 'style', style);
            el.setAttributeNS(null, 'class', "draggablepoint");


            // если это окружность
            if (el.nodeName == 'circle') {
                el.setAttributeNS(null, 'overr', overr);
                el.setAttributeNS(null, 'r', overr);
            }

            var id = evt.target.getAttributeNS(null, 'id')
            if (id.indexOf('rotate') >= 0) { // Вращение
                GWTK.StatusBarControl.prototype.setText(w2utils.lang("Press and drag to rotate the object") + '...');
            }
            else {
                if (id.indexOf('_bop_') >= 0) {// Растяжка объекта {
                    GWTK.StatusBarControl.prototype.setText(w2utils.lang("Press and move for scaling of an object") + '...');
                }
            }

            $('#' + eventPanelId).trigger({ type: 'drawmark_mouseover', sender: evt.target });
        },


        /**
         * Обработчик mouseovert-события точки
         * @method onDrawmark_mouseover
         * @param event {Object} Событие
         */
        // ===============================================================
        onDrawmark_mouseover: function (event) {

            if (!event || !event.sender) {
                return;
            }
            var id = event.sender.getAttributeNS(null, 'id');
            if (id.indexOf('rotate') < 0 && id.indexOf('_bop_') < 0 && id.indexOf('center') < 0 &&
                this.do_continue) {
                // Определим нномер точки (если первая или последняя, то рисуем линию )
                // Определим номер точки и локализацию объекта

                var spatialposition = this.mapobject.spatialposition.toLowerCase();
                if (spatialposition.indexOf('polygon') < 0 && spatialposition.indexOf('point') < 0) {
                // if (spatialposition != 'polygon' && spatialposition != 'multipolygon' &&
                //     spatialposition != 'point' && spatialposition != 'multipoint') {
                    var pointnumber = this.getnumber(id) >= 0 ? this.getnumber(id) : null,
                        subjectnumber = this.getsubjectnumber(id) >= 0 ? this.getsubjectnumber(id) : 0;
                    if (pointnumber == 0 || pointnumber == this.mapobject.geometry.count(subjectnumber) - 1) {
                        this.continueCreate = {
                            pointnumber: pointnumber,
                            subjectnumber: subjectnumber,
                            lineid: 'continueline'
                        };
                    }
                    else {
                        this.clearContinueCreate();
                    }
                }
            }

            if (this.continueCreate) {
                this.map.off({ type: 'mousemove', target: "map", phase: 'before',  sender: this }, this.onMouseMoveLine);
                this.map.off({ type: 'mouseup', target: "map", phase: 'before', sender: this }, this.onMouseUpLine);
                this.map.on({ type: 'mousemove', target: "map", phase: 'before',  sender: this }, this.onMouseMoveLine);
            }
        },


        onPointMouseDown: function (evt, eventPanelId) {

           if(!eventPanelId) return false;
           evt = evt || window.event;

           if (evt.target.id.indexOf('center') < 0) {
                if (!evt.ctrlKey && evt.which == 3) {// правая кнопка мыши (контекстное меню)
                    evt.target.setAttributeNS(null, "onmouseup", "GWTK.DrawingObject.prototype.onPointMouseMenu(evt,'" + eventPanelId + "')");
                }
                else {
                    if (evt.ctrlKey) {
                        if (evt.which == 1) { // Завешить операцию при нажатии левой кнопки
                            $('#' + eventPanelId).trigger({ type: 'ctrlleft', evt: evt });
                            return;
                        }
                        else {
                            if (evt.which == 3) { // Отказ при нажатии правой кнопки
                            $('#' + eventPanelId).trigger({ type: 'ctrlright', evt: evt });
                                return;
                            }
                        }
                    }
                    // else {
                    //     if(evt.which == 1) {
                    //         evt.target.leftButtonDown = true;
                    //         console.log('1:', evt);
                    //     } else if (evt.which == 3) {
                    //         if (evt.target.leftButtonDown) {
                    //             evt.target.leftButtonDown = false;
                    //             console.log('3:', evt);
                    //             $('#' + eventPanelId).trigger({ type: 'ctrlleft', evt: evt });
                    //         }
                    //     }
                    // }
                }
            }

            $('#'+ eventPanelId).trigger({ type: 'drawmark_mousedown', evt: evt });

        },

        /**
         * Событие на триггер  'drawmark_mousedown'
         * @method onDrawmark_mousedown
         * @param event {Object} Событие на триггер
         */
        // ===============================================================
        onDrawmark_mousedown: function (event) {
            
            var evt = event.evt || window.event,
                ui = {};

            if (!this.drag.state) {

                var point = this.getpositionElement(evt.target);
                evt.pageX = point.x;
                evt.pageY = point.y;
                this.drag.elem = evt.target;
                //this.drag.x = evt.pageX;
                //this.drag.y = evt.pageY;
                this.drag.x = point.x;
                this.drag.y = point.y;
                this.drag.delta = { 'x': 0, 'y': 0 };
                this.drag.alldelta = { 'x': 0, 'y': 0 };;
                this.drag.state = true;
                this.drag.rotate = false;
                this.drag.scale = -1;
                this.drag.center = GWTK.point(0, 0);
                this.drag.style = evt.target.getAttributeNS(null, 'style');
                this.drag.overr = evt.target.getAttributeNS(null, 'overr');
                if (evt.target.id.indexOf('_rotate') >= 0) {
                    this.drag.rotate = true;
                    this.drag.center = this.center;//this.mapobject.getcenter(true);
                    this.drag.angle = 0;
                    this.drag.anglerad = 0;
                }
                else {
                    if (evt.target.id.indexOf('_bop_') >= 0) {// Масштабирование
                        var mass = evt.target.id.split('_');
                        if (mass && mass.length > 0)
                            this.drag.scale = mass[mass.length-1];
                        this.drag.koeff = { 'x': 1.0, 'y': 1.0 };
                        this.drag.firstpoint = { 'x': 0, 'y': 0 };
                    }
                }
            }

              evt.preventDefault();
              //evt.stopPropagation();

            if (!(!evt.ctrlKey && evt.which == 3)) { // не правая кнопка мыши (контекстное меню)

                if (this.topology) {
                    this.topology.cleardrawtopogroup();
                }

                var ret = true;
                if (this.do_draggable) {
                    ret = this.do_draggable("start", this.drag.elem, ui);
                    if (ret == false) {

                        ui.position =  {
                            left: this.drag.x,
                            top: this.drag.y
                        };

                        this.do_draggable("stop", this.drag.elem, ui);
                        this._onstop(this.drag.elem, ui);
                        return;
                    }
                }

                this.map.on({
                    type: "documentmousemove",
                    target: "map",
                    phase: 'before',
                    sender: this
                }, this.onMouseMovePoint);

                // переопределить события движения мыши над таскаемым элементом
                //this.drag.elem.setAttributeNS(null, 'pointer-events', "stroke");
                this.drag.elem.setAttributeNS(null, 'pointer-events', "none");

            }

            this.map.on({ type: "documentmouseup", target: "map", phase: 'before', sender: this }, this.onMouseUpPoint);
        },



        /**
         * Перемещение мыши при создании объекта
         * @method  onMouseMoveCreation
         * @param e {Object} Событие
         */
        // ===============================================================
        onMouseMoveLine: function (e) {

            if (!e || !e.sender || !e.sender.continueCreate){
                return;
            }

            var subjectnumber = e.sender.continueCreate.subjectnumber,
                pointnumber =  e.sender.continueCreate.pointnumber,
                lineid = e.sender.continueCreate.lineid;

            // Стереть линию
            GWTK.DrawingObject.prototype.removeDomElement(lineid);

            e = e.originalEvent;
            e.map = this.map;
            GWTK.DomEvent.getMouseGeoCoordinates(e);

            var el = this.getpointElemByNumber(subjectnumber, pointnumber),
                beforeel, styleline, prev,
                rectdraw = (this.svgDraw.svgCanvas).getBoundingClientRect(),
                next = GWTK.point(e.clientX - rectdraw.left, e.clientY - rectdraw.top);

            // Найти близлежащую точку и подсветить ее
            if (this.context && (this.context instanceof GWTK.mapeditorTask || this.context instanceof GWTK.mapeditorTaskExtended) && this.context.topology) {
                var ui = { position: { left: next.x, top: next.y } }
                if (this.context.topology.drawOverObject(ui, { isobjectpoint: this.context.options.capturePoints, isvirtualpoint: this.context.options.captureVirtualPoints })) {
                    next = { 'x': ui.position.left, 'y': ui.position.top };
                }
            }

            // Линия направления
            if (el) {
                prev = this.getpositionByPointId(el.id);
                if (prev) {
                    var iddrawobj = this.getgroupId(subjectnumber);
                    beforeel = document.getElementById(iddrawobj + '_' + 'pointsJSON');
                    styleline = (subjectnumber > 0) ? this.styleline_subject : this.styleline;

                    // Найдем родителя для рисования на svg
                    var parent = document.getElementById(this.mapobject.maplayername + '_' + this.mapobject.id + '_objectJSON');
                    this.svgDraw.createSVGline(lineid, parent, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline }, null, beforeel);
                }
            }

            // Отжатие кнопки
            this.map.on({ type: 'mouseup', target: "map", phase: 'before', sender: this }, this.onMouseUpLine);

            // e.stopPropagation();
            // return false;
        },

        /**
         * Нажатие мыши при доцифровке объекта
         */
        onMouseUpLine: function(e){

            // Если это перемещение карты, то просто проигнорируем
            if (this.mapdrag) {
                return;
            }

            this.map.off({ type: 'mousemove', target: "map", phase: 'before',  sender: this }, this.onMouseMoveLine);
            this.map.off({ type: 'mouseup', target: "map", phase: 'before', sender: this }, this.onMouseUpLine);

            if (!e || !e.sender || !e.sender.continueCreate || !e.originalEvent){
                return true;
            }

            var evt = e.originalEvent;
            if (evt) {

                // Стереть линию
                GWTK.DrawingObject.prototype.removeDomElement(e.sender.continueCreate.lineid);

                if (evt.ctrlKey) {
                    if (evt.which == 1) { // Завешить операцию при нажатии левой кнопки
                        $(this.map.eventPane).trigger({ type: 'ctrlleft', evt: evt });
                        return;
                    }
                    else {
                        if (evt.which == 3) { // Отказ при нажатии правой кнопки
                            $(this.map.eventPane).trigger({ type: 'ctrlright', evt: evt });
                            return;
                        }
                    }
                }

                if (this.do_continue) {
                        var rectdraw = (this.svgDraw.svgCanvas).getBoundingClientRect();
                        e.point = {
                        x: evt.clientX - rectdraw.left,
                        y: evt.clientY - rectdraw.top,
                        subjectnumber: e.sender.continueCreate.subjectnumber,
                        pointnumber: e.sender.continueCreate.pointnumber
                    };
                    this.do_continue(e);
                    // this.continueCreate = null;
                    this.clearContinueCreate();
                }
            }
        },

        onDragStart: function(){
            this.mapdrag = true;
        },

        onDragEnd: function(){
            this.mapdrag = false;
        },

        onMouseMovePoint: function (event) {

            var e = event.originalEvent;
            var ui = {}, left, top;
            if (this.drag.state) {
                if (this.drag.elem.nodeName == 'circle') 
                    this.drag.elem.setAttributeNS(null, 'r', this.drag.overr);
                this.drag.elem.setAttributeNS(null, 'style', this.drag.style);

                if (this.parentpanel) {
                    e.pageX -= $(this.parentpanel()).offset().left;
                    e.pageY -= $(this.parentpanel()).offset().top;
                }
                this.drag.delta.x = e.pageX - this.drag.x;
                this.drag.delta.y = e.pageY - this.drag.y;
                this.drag.alldelta.x += this.drag.delta.x;
                this.drag.alldelta.y += this.drag.delta.y;

                // Если не вращение и не масштабирование
                if (!this.drag.rotate && this.drag.scale < 0) {
                    //this.drag.elem.setAttributeNS(null, 'style', this.drag.style);

                    var attr = this.getpointattr(this.drag.elem);
                    if (!attr) {
                        return;
                    }
                    left = parseFloat(this.drag.elem.getAttributeNS(null, attr[0])) + this.drag.delta.x;
                    top = parseFloat(this.drag.elem.getAttributeNS(null, attr[1])) + this.drag.delta.y;
                    this.drag.elem.setAttributeNS(null, attr[0], left);
                    this.drag.elem.setAttributeNS(null, attr[1], top);
                    this.drag.x = e.pageX;
                    this.drag.y = e.pageY;
                }
                else {
                    if (this.drag.rotate) {
                        this._onrotate(e.pageX, e.pageY);
                        event.stopPropagation();
                    }
                    else {
                        if (this.drag.scale >= 0) {
                            this.drag.x = e.pageX;
                            this.drag.y = e.pageY;
                            this._onscale(e.pageX, e.pageY);
                            event.stopPropagation();
                        }
                    }
                    return;
                }

                // Отрисовать линии
                ui.position =
                        {
                            left: left,
                            top: top
                        };

                if (e.target == this.drag.elem) {
                    e.target.setAttributeNS(null, "onmouseup", "");
                }

                if (ui.position) {
                    if (this.do_draggable) {
                        //this.drag.elem.setAttributeNS(null, 'r', 6);
                        this.do_draggable("drag", this.drag.elem, ui);
                        this._ondrag(this.drag.elem, ui);
                    }
                }
            }
            event.stopPropagation();
            return false;
        },

        onMouseUpPoint: function (event) {

            // Сбросим режим продолжения
            //this.continueCreate = null;
            this.clearContinueCreate();

            var e = event.originalEvent;

            this.map.off({ type: "documentmousemove", target: "map", phase: 'before', sender: this }, this.onMouseMovePoint);
            this.map.off({ type: "documentmouseup", target: "map", phase: 'before', sender: this }, this.onMouseUpPoint);

            var ui = {};
            if (this.drag.state) {
                if (this.parentpanel) {
                    e.pageX -= $(this.parentpanel()).offset().left;
                    e.pageY -= $(this.parentpanel()).offset().top;
                }
                ui.position =
                        {
                            left: this.drag.x,
                            top: this.drag.y
                        };

                this.drag.state = false;
                if (this.drag.rotate || this.drag.scale >= 0) {
                    var group = (this.mapobjects && this.mapobjects.length > 0) ? true : false;
                    if (this.drag.rotate) {
                        if (!group)
                            this.mapobject.geometry.rotate(this.drag.anglerad, this.drag.center, true);
                        else {
                            for(var i = 0; i < this.mapobjects.length; i++)
                                this.mapobjects[i].geometry.rotate(this.drag.anglerad, this.drag.center, true);
                        }
                    }
                    else {
                        if (this.drag.scale >= 0) {
                            this.drag.koeff.x = (this.drag.firstpoint.x - this.drag.center.x != 0) ? (e.pageX - this.drag.center.x) / (this.drag.firstpoint.x - this.drag.center.x) : 1.0;
                            this.drag.koeff.y = (this.drag.firstpoint.y - this.drag.center.y != 0) ? (e.pageY - this.drag.center.y) / (this.drag.firstpoint.y - this.drag.center.y) : 1.0;
                            if (!group)
                                this.mapobject.geometry.scale(this.drag.koeff, this.drag.center, true);
                            else {
                                for (var i = 0; i < this.mapobjects.length; i++)
                                    this.mapobjects[i].geometry.scale(this.drag.koeff, this.drag.center, true);
                            }
                        }
                    }
                    if (this.do_draggable) {
                        this.do_draggable("stop", this.drag.elem, ui);
                        this._onstop(e.target, ui);
                    }
                }

                //var attr = e.target.getAttributeNS(null, "onmouseup");
                //if (attr && (attr.indexOf("onPointMouseMenu") >= 0)) {
                //    e.target.setAttributeNS(null, "onmouseup", "");
                //}
                //else {
                    if (ui.position) {
                        //if (this.do_draggable) {
                        //    this.do_draggable("stop", this.drag.elem, ui);
                        //    this._onstop(this.drag.elem, ui);
                        //}

                        if (Math.abs(this.drag.alldelta.x) > 0 && Math.abs(this.drag.alldelta.y) > 0) {
                            if (this.do_draggable) {
                                this.do_draggable("stop", this.drag.elem, ui);
                                this._onstop(this.drag.elem, ui);
                            }
                        }
                        else {
                            if (this.do_downpoint) {
                                var point = this.getpositionElement(this.drag.elem);
                                ui.position.left = point.x;
                                ui.position.top = point.y;
                                this.do_downpoint(this.drag.elem, point.x, point.y);
                            }
                        }
                    }
                //}

                // вернуть назад мышиные события еа элемент
                this.drag.elem.setAttributeNS(null, 'pointer-events', "visiblePainted");

            }


            event.stopPropagation();
            return false;
        },

        onPointMouseMenu: function (evt,eventPanelId ) {

            if(!eventPanelId) return false;
            var el = evt.target;
            if (!el || el.id.indexOf('center') >= 0) // если это средняя точка
                return;
            $('#' + eventPanelId).trigger({ type: 'drawmark_popupmenu', evt: evt });
        },

        /**
         * Событие на триггер  'drawmark_popupmenu'
         * @method onDrawmark_popupmenu
         * @param event {Object} Событие на триггер
         */
        // ===============================================================
        onDrawmark_popupmenu: function (event) {
            evt = event.evt || window.event;
            var el = evt.target;
            if (!el) return;

            var attr = this.getpointattr(el);
            if (!attr) return;
            // this.do_popupmenu(el, parseFloat(el.getAttributeNS(null, attr[0])), parseFloat(el.getAttributeNS(null, attr[1])));
            if (this.do_popupmenu) {
                this.do_popupmenu(event, el, parseFloat(el.getAttributeNS(null, attr[0])), parseFloat(el.getAttributeNS(null, attr[1])));
            }
        },

        onContextMenu: function (e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        },

        // перетаскивание точки объекта
        _ondrag: function (div, ui) {

            if (!div && !div.id) return;

            var type;    // тип перетаскиваемого объекта (точка или линия)
            if (div.id.indexOf('mop') >= 0)
                type = 'point';
            else {
                if (div.id.indexOf('lop') >= 0)
                    type = 'line';
                else // перетаскивание другогo объекта
                        return;
            }

            if (type == 'point') {   // если это точка
                // найдем линии и перерисуем
                if (div.id.indexOf('center') < 0) // если это реальная точка
                    this.movepoint(div, this.mapobject.spatialposition, ui);  // перестроим линии
                else
                    this.movepointcenter(div, ui);
            }

            return;
        },

        // окончание перетаскивание точки объекта
        _onstop: function (div, ui) {
            this.drag.state = false;

            if (this.drag.rotate || this.drag.scale >= 0) {
                this.drag.rotate = false;
                this.drag.scale = -1;
                return;
            }

            if (!div && !div.id) return;
            var type;    // тип перетаскиваемого объекта
            if (div.id.indexOf('mop') > 0)
                type = 'point';
            else {
                if (div.id.indexOf('lop') > 0)
                    type = 'line';
                else // перетаскивание другогo объекта
                        return;
            }

            if (type == 'point') {   // если это точка

                // найдем линии и перерисуем
                if (div.id.indexOf('center') <= 0) { // если это реальная узловая точка
                    this.do_updatepoint(div, ui);  // перестроим точки
                }
                else {
                    this.do_updatepoint(div, ui, true);  // вставим точку и перестроим
                }
            }
        },

        // Вращение объекта
        _onrotate: function (x, y) {
            if (!this.drag || !this.drag.rotate || !this.drag.state)
                return;
            if ((x != this.drag.x) || (y != this.drag.y) &&           // переместились
                (this.drag.x != this.drag.center.x) || (this.drag.y != this.drag.center.y) &&       // центр поворота не в точке нажатия
                (x != this.drag.center.x) || (y == this.drag.center.y)) {         // центр не в текущей точке
                var angl1 = Math.atan2((this.drag.y - this.drag.center.y), (this.drag.x - this.drag.center.x)),
                    angl2 = Math.atan2((y - this.drag.center.y), (x - this.drag.center.x));

                this.drag.angle = ((angl2 - angl1) * 180) / Math.PI;            // угол поворота в градусах (для svg)
                this.drag.anglerad = angl1 - angl2;                             // угол поворота в радианах Для пересчета точек метрики (координаты метрики развернуты)

                // Повернем svg
                var transform = 'rotate(' + this.drag.angle.toString() + ',' + this.drag.center.x.toString() + ',' + this.drag.center.y.toString() + ')';
                var group = (this.mapobjects && this.mapobjects.length > 0) ? true : false,
                    idobject = (group) ? this.getIdForGroup(this.mapobjects[0]) :
                        //this.svgDraw.svgIdentIds + '_' + this.mapobjects[0].maplayername + '_' + this.mapobjects[0].id :
                        this.mapobject.maplayername + '_' + this.mapobject.id;
                var el = document.getElementById(idobject + '_bboxJSON');
                if (el)
                    el.setAttribute('transform', transform);
                if (group) {
                    for (var i = 0; i < this.mapobjects.length; i++) {
                        idobject = this.getIdForGroup(this.mapobjects[i]);
                            //this.svgDraw.svgIdentIds + '_' + this.mapobjects[i].maplayername + '_' + this.mapobjects[i].id;
                        el = document.getElementById(idobject);
                        if (!el) continue;
                        el.setAttribute('transform', transform);
                    }
                }
                else {
                    el = document.getElementById(idobject + '_objectJSON');
                    if (el)
                        el.setAttribute('transform', transform);
                }

            }
        },

        // Масштабирование объекта
        _onscale: function (x, y) {
            if (!this.drag || this.drag.scale < 0 || !this.drag.state) return;
            var group = (this.mapobjects && this.mapobjects.length > 0) ? true : false,
                idobject = (group) ? this.getIdForGroup(this.mapobjects[0]) :
                    //this.svgDraw.svgIdentIds + '_' + this.mapobjects[0].maplayername + '_' + this.mapobjects[0].id :
                                    this.mapobject.maplayername + '_' + this.mapobject.id,
                koeff0 = { 'x': 1.0, 'y': 1.0 }, p0 = { 'x': 0, 'y': 0 }, koeff, p,
                //p1 = { 'x': 0, 'y': 0 }, firstpoint = { 'x': x - this.drag.delta.x, 'y': y - this.drag.delta.y },
                scale = parseInt(this.drag.scale),
                firstpoint = { 'x': this.boxpoints[scale].x, 'y': this.boxpoints[scale].y };

            switch (scale) {
                case 0: // Растянуть по левому верхнему углу
                    //p1 = { 'x': this.boxpoints[4].x, 'y': this.boxpoints[4].y};
                    p0 = { 'x': this.boxpoints[4].x - this.offsetbox, 'y': this.boxpoints[4].y + this.offsetbox };
                    if (firstpoint.y - p0.y == 0 || firstpoint.x - p0.x == 0) return;
                    koeff0.x = (x - p0.x) / (firstpoint.x - p0.x);
                    koeff0.y = (y - p0.y) / (firstpoint.y - p0.y);
                    break;
                case 1: // Растянуть по вертикали вверх
                    //p1 = { 'x': this.boxpoints[5].x, 'y': this.boxpoints[5].y };
                    p0 = { 'x': this.boxpoints[5].x, 'y': this.boxpoints[5].y + this.offsetbox };
                    if (firstpoint.y - p0.y == 0) return;
                    koeff0.y = (y - p0.y) / (firstpoint.y - p0.y);
                    break;
                case 2: // Растянуть по правому верхнему углу
                    //p1 = { 'x': this.boxpoints[6].x, 'y': this.boxpoints[6].y };
                    p0 = { 'x': this.boxpoints[6].x + this.offsetbox, 'y': this.boxpoints[6].y + this.offsetbox };
                    if (firstpoint.y - p0.y == 0 || firstpoint.x - p0.x == 0) return;
                    koeff0.x = (x - p0.x) / (firstpoint.x - p0.x);
                    koeff0.y = (y - p0.y) / (firstpoint.y - p0.y);
                    break;
                case 3: // Растянуть по горизонтали вправо +
                    //p1 = { 'x': this.boxpoints[7].x, 'y': this.boxpoints[7].y };
                    p0 = { 'x': this.boxpoints[7].x + this.offsetbox, 'y': this.boxpoints[7].y };
                    if (firstpoint.x - p0.x == 0) return;
                    koeff0.x = (x - p0.x) / (firstpoint.x - p0.x);
                    break;
                case 4: // Растянуть по правому нижнему углу
                    //p1 = { 'x': this.boxpoints[0].x, 'y': this.boxpoints[0].y };
                    p0 = { 'x': this.boxpoints[0].x + this.offsetbox, 'y': this.boxpoints[0].y - this.offsetbox };
                    if (firstpoint.y - p0.y == 0 || firstpoint.x - p0.x == 0) return;
                    koeff0.x = (x - p0.x) / (firstpoint.x - p0.x);
                    koeff0.y = (y - p0.y) / (firstpoint.y - p0.y);
                    break;
                case 5: // Растянуть по вертикали вниз
                    //p1 = { 'x': this.boxpoints[1].x, 'y': this.boxpoints[1].y };
                    p0 = { 'x': this.boxpoints[1].x, 'y': this.boxpoints[1].y - this.offsetbox };
                    if (firstpoint.y - p0.y == 0) return;
                    koeff0.y = (y - p0.y) / (firstpoint.y - p0.y);
                    break;
                case 6: // Растянуть по левому нижнему углу
                    //p1 = { 'x': this.boxpoints[2].x, 'y': this.boxpoints[2].y };
                    p0 = { 'x': this.boxpoints[2].x - this.offsetbox, 'y': this.boxpoints[2].y - this.offsetbox };
                    if (firstpoint.y - p0.y == 0 || firstpoint.x - p0.x == 0) return;
                    koeff0.x = (x - p0.x) / (firstpoint.x - p0.x);
                    koeff0.y = (y - p0.y) / (firstpoint.y - p0.y);
                    break;
                case 7: // Растянуть по горизонтали влево +
                    //p1 = { 'x': this.boxpoints[3].x, 'y': this.boxpoints[3].y };
                    p0 = { 'x': this.boxpoints[3].x - this.offsetbox, 'y': this.boxpoints[3].y };
                    if (firstpoint.x - p0.x == 0) return;
                    koeff0.x = (x - p0.x) / (firstpoint.x - p0.x);
                    break;
            };

            // Если первый раз, то запомним точку захвата
            if (this.drag.firstpoint.x == 0 && this.drag.firstpoint.y == 0) {
                this.drag.firstpoint = { 'x': this.boxpoints[scale].x, 'y': this.boxpoints[scale].y };
                this.drag.center = { 'x': p0.x, 'y': p0.y };
            }

            // пересчитаем габариты рамки
            for (var i = 0; i < this.boxpoints.length - 1; i++) {
                this.boxpoints[i].x = p0.x + (this.boxpoints[i].x - p0.x) * koeff0.x;
                this.boxpoints[i].y = p0.y + (this.boxpoints[i].y - p0.y) * koeff0.y;
            }
            // точка вращения
            this.boxpoints[this.boxpoints.length - 1].x = this.boxpoints[1].x;
            this.boxpoints[this.boxpoints.length - 1].y = this.boxpoints[1].y  - this.offsettop;
            var el = document.getElementById(idobject + '_bboxJSON'), $el, $element, x1, y1, x2, y2, mel, koord;
            GWTK.MapEditorUtil.empty(el);

            this._drawbox(idobject, el, null);

            // пересчитаем метрику объекта
            koeff = koeff0; p = p0;
            if (group) {
                for (var i = 0; i < this.mapobjects.length; i++) {
                    idobject = this.getIdForGroup(this.mapobjects[i]);
                        //this.svgDraw.svgIdentIds + '_' + this.mapobjects[i].maplayername + '_' + this.mapobjects[i].id;
                    mel = document.getElementById('m' + idobject);
                    if (mel) continue;
                    el = document.getElementById(idobject);
                    if (!el) continue;
                    koord = null, koord = null;
                    if (el.nodeName == 'path') {
                        koord = this.svgDraw.getCoords_pixel(el);
                        if (!koord) continue;
                        for (var ii = 0; ii < koord.length; ii++) {
                            for (var jj = 0; jj < koord[ii].length; jj++) {
                                koord[ii][jj][0] = p.x + (parseFloat(koord[ii][jj][0]) - p.x) * koeff.x;
                                koord[ii][jj][1] = p.y + (parseFloat(koord[ii][jj][1]) - p.y) * koeff.y;
                            }
                        }
                        this.svgDraw.updatePart(el, koord);
                    }
                }
            }
            else {
                el = document.getElementById(idobject + '_objectJSON');
                if (!el) return;
                $el = $(el);
                $el.children().each(function (index, element) {
                    $element = $(element);
                    $element.children().each(function (index, koord) {
                        if (koord.nodeName == 'line') {  // Пересчитаем координаты линий
                            x1 = koord.getAttributeNS(null, 'x1');
                            y1 = koord.getAttributeNS(null, 'y1');
                            x2 = koord.getAttributeNS(null, 'x2');
                            y2 = koord.getAttributeNS(null, 'y2');
                            koord.setAttribute('x1', p.x + (x1 - p.x) * koeff.x);
                            koord.setAttribute('y1', p.y + (y1 - p.y) * koeff.y);
                            koord.setAttribute('x2', p.x + (x2 - p.x) * koeff.x);
                            koord.setAttribute('y2', p.y + (y2 - p.y) * koeff.y);
                        }
                        if (koord.nodeName == 'circle') { // Пересчитаем координаты точек
                            x1 = koord.getAttributeNS(null, 'cx');
                            y1 = koord.getAttributeNS(null, 'cy');
                            koord.setAttribute('cx', p.x + (x1 - p.x) * koeff.x);
                            koord.setAttribute('cy', p.y + (y1 - p.y) * koeff.y);
                        }
                    });
                });
            }

        },


        // Удалить элемент из DOM модели
        removeDomElement: function (element) {
            GWTK.MapEditorUtil.remove(element);
        },

        ///**
        // * Действия в процессe перемещения точки
        // * @method do_draggable
        // * @param process {String} Наименование процесса "start", "drag", "stop" 
        // * @param event {Object} Событие
        // * @param ui {Object} Объект, содержащий смещение точки
        // */
        //// ===============================================================
        //do_draggable: function (process, event, ui) {
        //    //switch (process) {
        //    //    case 'start':
        //    //        break;

        //    //    case 'stop':
        //    //        this.drawobject._onstop(event.target, ui);
        //    //        break;

        //    //    case 'drag':
        //    //        this.drawobject._ondrag(event.target, ui);
        //    //        break;
        //    //}
        //},

        /**
          * Контекстное меню для точки объекта 
          * @method do_popupmenu
          * @param event {Element} - Событие
          * @param div {Element} - Родительский элемент
          * @param x {Int} - Координата экрана x
          * @param y {Int} - Координата экрана y
          */
        // ===============================================================
        do_popupmenu: function (event, div, x, y) {
        },

        /**
         * Обновление координат точки объекта
         * @method do_updatepoint
         * @param div {Element} Элемент, содержащий всю информацию о точке
         * @param ui {Object} Объект, содержащий позицию точки { "position": {"left": left, "top": top };
         * @param insert {Boolean} признак вставки новой точки (для серединных точек), иначе обновление существующей
         */
        // ===============================================================
        do_updatepoint: function (div, ui, insert) {
        },

        /**
         * Разрушение объекта
         * @method do_destroy
         * @param div {Element} Элемент, содержащий всю информацию о точке
         * @param ui {Object} Объект, содержащий позицию точки { "position": {"left": left, "top": top };
         * @param insert {Boolean} признак вставки новой точки (для серединных точек), иначе обновление существующей
         */
        // ===============================================================
        do_destroy: function () {
            // $(this.map.eventPane).off('drawmark_mouseout', this.onDrawmark_mouseout);
            // $(this.map.eventPane).off('drawmark_mouseover', this.onDrawmark_mouseover);
        },

        ///**
        // * Функция нажатия на точку объекта (без перемещения точки)
        // * @method do_downpoint
        // * @param div {Element} Элемент, содержащий всю информацию о точке
        // * @param x {Int} - Координата экрана x
        // * @param y {Int} - Координата экрана y
        // */
        //// ===============================================================
        //do_downpoint: function (div, x, y) {
        //},


        // Поднять/опустить панель рисования
        zIndexDrawPanel: function (type, panel) {
            if (!panel) return;
            var $drawpanel = $(panel);
            var $parent = $drawpanel.parent();

            if (type == 'up') {
                if (!this.zIndex) {
                    this.zIndex = $parent.css('zIndex');
                }
                $parent.css('zIndex', this.zIndexUp);
                $drawpanel.css('zIndex', this.zIndexUp);
            }
            else {
                if (this.zIndex) {
                    $parent.css('zIndex', this.zIndex);
                    $drawpanel.css('zIndex', this.zIndex);
                }
            }
        },

        // Включить/отключить трансляцию событий
        pointerEventsDrawPanel: function (panel, type) {
            if (!panel) return;
            var $drawpanel = $(panel);

            if (type == 'none') {
                this.pointerEvents = $drawpanel.css('pointer-events');
                $drawpanel.css('pointer-events', type);
            }
            else {
                if (this.pointerEvents)
                    $drawpanel.css('pointer-events', this.pointerEvents);
            }
        }

    };
}
    
