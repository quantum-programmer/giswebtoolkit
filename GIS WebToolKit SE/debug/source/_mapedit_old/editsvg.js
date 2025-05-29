/**************************************** Гиман Н.     16/11/17 ****
/************************************ Соколова Т.О. ** 09/11/18 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2018              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*           Компонент векторной графики редактора карты            *
*                                                                  *
*******************************************************************/

if (window.GWTK) {
    /**
     * Компонент векторной графики редактора карты   
     * @class GWTK.EditSvgDrawing
     * @constructor GWTK.EditSvgDrawing
     * @param param {Object} - параметры класса  = {
        map:   {Object}   oбъект карты   
        id:    {String}   Идентификатор компонента 
        parent: {Object}  Родительский элемент для панели svg холста
        svgid:  {String}  Идентификатор svg холста
        eventSets: {Array String}  Список событий, назначаемых svg элементам ["mouseover", "mouseleave", "click", "mousedown", "mouseup"]
    * }
    * @param context {Object} - контекст вызова
    */
    // ===============================================================
    GWTK.EditSvgDrawing = function (map, param, context) {
        this.error = true;

        // Переменные класса
        this.toolname = 'editsvgdrawing';
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

        // Идентификаторы svg объектов
        this.ids = new Array();
        this.errorOverbox = "-2";
        this.style = "";
        this.svgNS = "http://www.w3.org/2000/svg";

        // Предельные значения для ширины элемента в браузере
        this.maxCSSvalue = {
            "chrome" : "33553900",
            "mozilla" : "17895100",
            "opera" : "29825600"
        };
        // параметры рисования по умолчанию
        this.defaultoptions = {
            "vector-effect" : "non-scaling-stroke",
            "stroke" : "transparent",// "green",
            "stroke-width": "2px",
            "stroke-opacity" : "0.75",
            "fill": "green",
            "fill-opacity": "0", // "0.55",
            "background" : "",
            "background-size" : "auto auto",
            "objName" : "SEM99",
//           "marker" : 'M 1 6 a 5 5 0 0 0 11 0M 1 6 a 3 3 0 0 1 11 0',
            "marker" : 'circle',
            "font-family" : "Verdana",
            "font-size" : "12px",
            "letter-spacing" : "1",
            "startOffset" : "2%",
            "stroke-dasharray":"none",
            //		"text" : "Текст по умолчанию"
            "text": "",
            "cursor": "",
            "radiuscircle": "5"
        };

        this.onSvgEvent = GWTK.Util.bind(this.onSvgEvent, this);

        // инициализация переменных класса
        this.initparam(param);

        this.error = false;

    };

    GWTK.EditSvgDrawing.prototype = {

        /**
         * Инициализация параметров класса
         * @method initparam
         */
        // ===============================================================
        initparam: function (param) {
            if (!param || param instanceof Object == false)
                return;

            this.destroy();

            // панель для SVG-холста
            this.parent = this.drawpanel = param.parent;
            this.svgCanvasId = (param.svgid) ? param.svgid : Math.random();
            this.eventSets = (param.eventSets) ? param.eventSets : null;

            this.svgIdentIds = 'svg' + GWTK.Util.randomInt(100, 150);     // уникальный идентификатор объекта

            this.svgCanvas = null;

            // this.bbox = [-180, -90, 180, 90];

            if (!this.parent) {
                this.drawpanel = GWTK.DomUtil.create('div', 'svgdrawing-panel', this.map.mapPane);
                this.drawpanel.id = (param.id) ? param.id : Math.random();
                this.drawpanel.style.zIndex = parseInt($(this.map.overlayPane).css('z-index')) -1;
                this.drawpanel.style.position = 'absolute';
            }
            this.drawpanel.style.left = 0 + "px";
            this.drawpanel.style.top = 0 + "px";
            this.drawpanel.style.width = 100 + "%";
            this.drawpanel.style.height = 100 + "%";
            this.drawpanel.style["pointer-events"] = "visiblePainted";  // ("none", "all", "visiblePainted", "visibleFill", "visible", "painted")

            // Назначим обработчики
            this.map_events('on');

            this.pixelLimit = null;
            // Предельные значения для ширины элемента в браузере
            this.maxCSSvalue = {
                "chrome": "33553900",
                "mozilla": "17895100",
                "opera": "29825600"
            };
            // определяем допустимые размеры элементов для браузера
            var ua = navigator.userAgent;
            if (ua.search(/OPR/) != -1)
                this.pixelLimit = this.maxCSSvalue["opera"];
            else if ((ua.search(/Chrome/) != -1) || (ua.search(/Safari/) != -1) || (ua.search(/Trident/) != -1))
                this.pixelLimit = this.maxCSSvalue["mozilla"];
            else
                this.pixelLimit = this.maxCSSvalue["mozilla"];

        },


        /**
         * Включение/отключение обработчиков 
         * @method map_events
         * @param type {String} Флажок 'on' - назначить, 'off' - отключить
         */
        // ===============================================================
        map_events: function (type) {
            var $drawpanel = $(this.drawpanel);

            if (type == 'on') {
                $drawpanel.on(GWTK.mousedown, this.onSvgEvent);
                $drawpanel.on(GWTK.mouseup, this.onSvgEvent);
                $drawpanel.on(GWTK.mouseleave, this.onSvgEvent);
                $drawpanel.on(GWTK.mousemove, this.onSvgEvent);
                $drawpanel.on(GWTK.click, this.onSvgEvent);
                $drawpanel.on("mousewheel DOMMouseScroll wheel MozMousePixelScroll", this.onSvgEvent);
            }
            else {
                $drawpanel.off(GWTK.mousedown, this.onSvgEvent);
                $drawpanel.off(GWTK.mouseup, this.onSvgEvent);
                $drawpanel.off(GWTK.mouseleave, this.onSvgEvent);
                $drawpanel.off(GWTK.mousemove, this.onSvgEvent);
                $drawpanel.off(GWTK.click, this.onSvgEvent);
                $drawpanel.off("mousewheel DOMMouseScroll wheel MozMousePixelScroll", this.onSvgEvent);
            }

        },

        /**
         * События панели svg холста 
         * @event onSvgEvent
         */
        // ===============================================================
        onSvgEvent: function (e) {
            var ep = this.map.eventPane;
            if (!ep) return;
            $(ep).trigger(e);
        },


        /**
        * Рисование на svg-холсте
        * @method draw
        * @param geoJSON {Object} Объекты в формате geoJSON
        * @param addSvg {Boolean} Если значение `true`, добавляет объекты к существующим; если `false` - чистит холст
        * @param params {Object} Параметры стиля отображения объектов
        * @param groupid {String} Идентификатор группы элемента svg, в которой отрисовать объект
        * @param before {Object} Элемент группы svg, перед которым разместить объект
        * @param excellencestyle {bool} Преимущество стиля взять из описания объекта
        * @returns {Object} В случае ошибки возвращает ее описание
       */
        // ===============================================================
        draw: function (geoJSON, addSvg, params, groupid, before, excellencestyle) {

            if (!addSvg) {
                this.destroy();
                // Назначим обработчики
                this.map_events('on');

                // this.bbox = geoJSON["bbox"];
                // if (!this.bbox || this.bbox.length == 0) {
                //     this.bbox = [-180, -90, 180, 90];
                // }
            }
            // else {
            //     this.bbox = [-180, -90, 180, 90];
            // }

            this.createCanvas();

            // Создадим тег для описания маркеров и прочих служебных элементов
            var defs = $(this.svgCanvas).find("defs");
            if ($(this.svgCanvas).find("defs").length == 0) {
                defs = document.createElementNS(this.svgNS, "defs");
                $(this.svgCanvas).append(defs);
            }

            var i, paintoptions = {}, id, name,
                g;   //  созданнная группа

            for (i = 0; i < geoJSON.features.length; i++) {
                if (!geoJSON.features[i] || !geoJSON.features[i].geometry || !geoJSON.features[i].geometry.coordinates)
                    continue;
                //var coordinates = geoJSON.features[i].geometry.coordinates;

                //if (geoJSON.features[i]["style"] || geoJSON.features[i]["properties"]) {
                //    for (var key in this.defaultoptions) {
                //        paintoptions[key] = params && params[key] ? params[key] : (geoJSON.features[i]["style"] && geoJSON.features[i]["style"][key]
				//				? geoJSON.features[i]["style"][key]
				//				: (geoJSON.features[i]["properties"] && geoJSON.features[i]["properties"][key]
				//						? geoJSON.features[i]["properties"][key]
				//						: this.defaultoptions[key]));
                //    }
                //}

                if (geoJSON.features[i]["properties"].skip) continue;                                        // 07/10/2016
                if (geoJSON.features[i]["style"] || geoJSON.features[i]["properties"]) {
                    for (var key in this.defaultoptions) {
                        if (!excellencestyle) {
                            paintoptions[key] = params && params[key] ? params[key] : (geoJSON.features[i]["style"] && geoJSON.features[i]["style"][key]
                                ? geoJSON.features[i]["style"][key]
                                : (geoJSON.features[i]["properties"] && geoJSON.features[i]["properties"][key]
                                    ? geoJSON.features[i]["properties"][key]
                                    : this.defaultoptions[key]));
                        }
                        else {
                            paintoptions[key] = geoJSON.features[i]["style"] && geoJSON.features[i]["style"][key]
                            ? geoJSON.features[i]["style"][key]
                            : (geoJSON.features[i]["properties"] && geoJSON.features[i]["properties"][key]
                                ? geoJSON.features[i]["properties"][key]
                                : (params && params[key] ? params[key] : this.defaultoptions[key]));
                        }
                    }
                }


                // рисование объекта
                if (geoJSON.features[i]["properties"]) {
                    id = geoJSON.features[i]["properties"]["id"];
                    id = this.getId(id);//  id.replace(/\./g, '_');
                    xid = geoJSON.features[i]["properties"]["id"];
                    name = (paintoptions && paintoptions["objName"]) ? geoJSON.features[i]["properties"][paintoptions["objName"]]
							: geoJSON.features[i]["properties"][this.defaultoptions["objName"]];
                } else {
                    for (var key in this.defaultoptions) {
                        paintoptions[key] = params && params[key] ? params[key] : this.defaultoptions[key];
                    }
                    id = "zone_" + i;
                    name = "zone_" + i;
                }

                this.ids.push(id);
//                this.ids.push(xid);
                type = geoJSON.features[i]["geometry"]["type"];
                if (!groupid) {
                    var er = this.drawObject(geoJSON.features[i], id, name, paintoptions, type, xid, null, null, before);
                    if (er == this.errorOverbox)
                        return er;
                }
                else
                    g = this.drawObject(geoJSON.features[i], id, name, paintoptions, type, xid, groupid, g, before);

            }

            $(this.drawpanel).append(this.svgCanvas);

            // Добавляем обработчики событий для новых объектов
            if (this.eventSets != null && this.ids.length > 0)
                this.setEvents(this.ids);
            return;
        },

        /**
         * Очищает панель рисования и svg-холст
         * @method destroy
         */
        // ===============================================================
        destroy: function () {
            this.clearEvents(this.ids);

            // Отключим события на eventPane
            this.map_events('off');

            if (!this.parent)
                $(this.drawpanel).empty();
            if (this.svgCanvas) {
                $(this.svgCanvas).remove();
                this.svgCanvas = null;
            }
            this.ids = new Array();
            return;
        },


        /**
         * Очищает события svg-холста
         * @method clearEvents
         */
        // ===============================================================
        clearEvents: function (ids) {
            if (!ids || ids.length == 0 || this.eventSets.length == 0) {
                return;
            }
            var el;
            for (var i = 0; i < ids.length; i++) {
                el = document.getElementById(ids[i]);
                if (!el) continue;
                for (var j = 0; j < this.eventSets.length; j++) {
                    switch (this.eventSets[j]) {
                        case "mouseover":
                            el.onmouseover = null;
                            break;
                        case "mouseleave":
                            el.onmouseout = null;
                            break;
                        case "click":
                            el.onclick = null;
                            break;
                        case "mousedown":
                            el.onmousedown = null;
                            break;
                        case "mouseup":
                            el.onmouseup = null;
                            break;
                        case "dblclick":
                            el.ondblclick = null;
                            break;
                    }
                }
            }
        },

        /**
         * Создание SVG-холста
         * @method createCanvas
         */
        // ===============================================================
        createCanvas: function () {
            if (this.svgCanvas) return;   // Соколова

            var wh = this.map.getWindowSize();

            this.svgCanvas = document.createElementNS(this.svgNS, "svg");
            this.svgCanvas.setAttributeNS(null, "width", wh[0]);
            this.svgCanvas.setAttributeNS(null, "height", wh[1]);
            // this.svgCanvas.setAttributeNS(null, "viewBox", '0 0 ' +  wh[0] + ' ' + wh[1]);
            this.svgCanvas.style.display = "block";
            this.svgCanvas.style.position = "absolute";
            this.svgCanvas.style.width = wh[0] + "px";
            this.svgCanvas.style.height = wh[1] + "px";

            this.svgCanvas.setAttributeNS(null, "id", this.svgCanvasId);
            this.svgCanvas.setAttributeNS(null, "baseProfile", "full");
            this.svgCanvas.setAttributeNS(null, "version", "1.1");
            return;

        },

        /**
         * Рисование объекта
         * @method drawObject
         * @param coordinates {Object} Объект "geometry.coordinates" формата geoJSON
         * @param id {String} Идентификатор объекта
         * @param name {String} Наименование объекта
         * @param options {Object} Параметры отображения объекта
         * @param type {String} Тип объекта geometry
         * @param xid {String} Дополнительный идентификатор объекта
         * @param groupid {String} Идентификатор создаваемой группы для размещения объекта
         * @param g {Object} Элемент группы svg для размещения объекта
         * @param before {Object} Элемент группы svg, перед которым разместить объект
         * @returns {Object} Возвращает группy svg элемента, в котрой размещен объект
         */
        // ===============================================================

        drawObject: function (feature, id, name, options, type, xid, groupid, g, before) {
            if (!this.svgCanvas || !feature || !feature.geometry || !id)
                return;

            var coordinates = feature.geometry.coordinates;

            if (!options) {
                options = this.defaultoptions;
            }

            // Вставка элемента в группу
            var group = null;
            // Если есть id для группы 
            if (groupid && g) {
                // Определим та ли это группа
                attrid = g.attributes['id'];
                if (attrid && attrid.value == groupid)
                    group = g;
            }
            if (!group) {
                g = document.createElementNS(this.svgNS, "g");
                if (groupid)
                    g.setAttributeNS(null, "id", groupid);
                if (this.svgCanvas) {
                    try {
                        this.svgCanvas.insertBefore(g, before);
                    }
                    catch(err){
                    }
                }
            }


            type = type.toLowerCase();
            switch (type) {
                case "multipoint":
                    this.lineString = "";
                    this.mpointString = "M";
                    break;
                default:
                    if (type == "title")
                        type = "text";
                    this.mpointString = "";
                    this.lineString = "M";
                    break;
            }
            var points = "M";
            var bb = {
                "start": 0,
                "min": { "x": 0, "y": 0 },
                "max": { "x": 0, "y": 0 }
            }
            points = this.pointsArray(coordinates, points, bb);
            if (points == "M") return;

            var bboxpixel = bb.min.x + "," + bb.min.y + " " + bb.max.x + "," + bb.max.y, svgel;

            if (type.indexOf("point") >= 0) {

                //if (options["marker"].indexOf("M") < 0) {
                points = points.substr(1);
                var mass = points.split(' ');
                if (!mass || mass.length == 0) return;
                for (var i = 0; i < mass.length; i++) {
                    var point = mass[i].split(',');
                    if (!point || point.length <= 1)
                        continue;
                    var offset = 10;
                    point[0] = parseFloat(point[0]);
                    point[1] = parseFloat(point[1]);
                    bboxpixel = (point[0] - offset) + "," + (point[1] - offset) + " " + (point[0] + offset) + "," + (point[1] + offset);
                    points = "M" + (point[0] - offset) + "," + (point[1] - offset) + " " +
                                   (point[0] + offset) + "," + (point[1] - offset) + " " +
                                   (point[0] + offset) + "," + (point[1] + offset) + " " +
                                   (point[0] - offset) + "," + (point[1] + offset) + " " +
                                   (point[0] - offset) + "," + (point[1] - offset);

                    // Точечные ричуем как путь, инача не выделить
                    svgel = null;
                    switch (options["marker"]) {
                        case "circle":
                            svgel = this.createSVGcircle('m' + id, g, {"cx": parseFloat(point[0]), "cy": parseFloat(point[1]), "bbox": bboxpixel });
                            break;
                        case "rect":
                            svgel = this.createSVGrect('m' + id, g, { "x": parseFloat(point[0]), "y": parseFloat(point[1]), "bbox": bboxpixel });
                            break;
                        default: // Если реально путь маркера, то просто сделать точку, чтоб можно было ловить события наведения мыши
                            svgel = this.createSVGcircle('m' + id, g, { "cx": parseFloat(point[0]), "cy": parseFloat(point[1]), "bbox": bboxpixel });
                            break;
                        }
                    if (svgel) {
                        svgel.setAttributeNS(null, "xid", 'm' + xid);
                    }

                    // switch (options["marker"]) {
                    //     case "circle":
                    //         svgel = this.createSVGcircle(id, g, {"cx": parseFloat(point[0]), "cy": parseFloat(point[1]), "bbox": bboxpixel });
                    //         break;
                    //     case "rect":
                    //         svgel = this.createSVGrect(id, g, { "x": parseFloat(point[0]), "y": parseFloat(point[1]), "bbox": bboxpixel });
                    //         break;
                    //     default: // Если реально путь маркера, то просто сделать точку, чтоб можно было ловить события наведения мыши
                    //         svgel = this.createSVGcircle(id, g, { "cx": parseFloat(point[0]), "cy": parseFloat(point[1]), "bbox": bboxpixel });
                    //         break;
                    //     }
                    // if (svgel) {
                    //     svgel.setAttributeNS(null, "xid", xid);
                    // }

                }

                // Если есть путь отрисовки маркера
                if (options["marker"] && typeof options["marker"] != 'string')
                    return;
                if (options["marker"].indexOf("M") >= 0 && options["marker"]) {  
                    var marker = this.addMarkerTemplate(options, id);
                    if (svgel && marker)
                        svgel.setAttributeNS(null, "marker-end", "url(#marker_" + marker.getAttributeNS(null, 'id'));
                }
                //return g;
            }

            var path = null;
            if (type == "text") {
                path = this.addText(options, id, points, xid);
            } else {
                path = document.createElementNS(this.svgNS, "path");
                path.setAttributeNS(null, 'stroke', options["stroke"]);
                path.setAttributeNS(null, 'stroke-width', options["stroke-width"]);
                path.setAttributeNS(null, 'stroke-opacity', options["stroke-opacity"]);
                path.setAttributeNS(null, 'vector-effect', options["vector-effect"]);
                path.setAttributeNS(null, 'stroke-dasharray', options["stroke-dasharray"]);
                path.setAttributeNS(null, 'd', points);
                path.setAttributeNS(null, 'background', options["background"]);
                path.setAttributeNS(null, 'background-size', options["background-size"]);
                path.setAttributeNS(null, 'class', "vector-polyline");
                path.setAttributeNS(null, "id", id);
                path.setAttributeNS(null, "name", name);
                path.setAttributeNS(null, "xid", xid);
                if (bboxpixel)
                    path.setAttributeNS(null, "bbox", bboxpixel);

                if (type != 'linestring' && type != 'multilinestring' && type != 'point' && type != 'multipoint') {
                    path.setAttributeNS(null, 'fill', options["fill"]);
                    path.setAttributeNS(null, 'fill-opacity', options["fill-opacity"]);
                    path.setAttributeNS(null, 'fill-rule', 'evenodd');
                } else {
                    path.setAttributeNS(null, 'fill', 'transparent');
                    path.setAttributeNS(null, 'fill-opacity', '0');
                }

                if (options["marker"] && options["marker"].indexOf("M") >= 0) {
                    if (type == "point") {
                        path.setAttributeNS(null, 'marker-end', "url(#marker_" + id + ")");
                    } else if (type == "multipoint") {
                        path.setAttributeNS(null, 'marker-start', "url(#marker_" + id + ")");
                        path.setAttributeNS(null, 'marker-mid', "url(#marker_" + id + ")");
                        path.setAttributeNS(null, 'marker-end', "url(#marker_" + id + ")"); 
                    }
                }
            }
            if (this.eventSets == null || this.eventSets.length == 0)
                path.style["pointer-events"] = "none";

            // Установим тип курсора, если есть
            if (options["cursor"])
                path.setAttributeNS(null, 'cursor', options["cursor"]);

            // Установим атрибут название листа и код объекта
            if (feature.properties) {
                var objectinfo = '', mass;
                if (feature.properties.id) {
                    mass = feature.properties.id.split('.');
                    if (mass && mass.length > 2)
                        objectinfo += mass[1];
                }
                if (feature.properties.name)
                    objectinfo +=': '+ feature.properties.name;
                path.setAttributeNS(null, 'objectinfo', objectinfo);
            }

            // Вставка элемента в группу
           // path.setAttributeNS(null, 'tabindex','1');
            g.appendChild(path);
            return g;

        },

        /**
         * Формирование линейного массива координат
         * @method pointsArray
         * @param coordinates {Array} Массив координат объекта
         * @param points {Array} Промежуточный двухмерный массив координат
         * @param bbox {Array} Массив для расчета габаритов
         * @param pixel {Boolean} Исходные данные: true - исходные даннные в пикселях, иначе - геодезические координаты
         * @returns {Array} Результирующий двухмерный массив координат
         */
        // ===============================================================
        pointsArray: function (coordinates, points, bbox, pixel) {
            for (var i = 0; i < coordinates.length; i++) {
                if (typeof (coordinates[i]) == "object") {
                    if (typeof (coordinates[i][0]) == "object" && typeof (coordinates[i][0][0]) != "object" && points.length > 1)
                        points = points + this.lineString;
                    points = this.pointsArray(coordinates[i], points, bbox, pixel);
                }
            }
            if (typeof (coordinates[0]) != "object") {
                var place = { "x": parseFloat(coordinates[0]), "y": parseFloat(coordinates[1]) };
                if (!pixel)
                    place = this.geo2svg(coordinates);
                if (!place) return points;

                points = points + this.mpointString;
                if (bbox) {
                    if (bbox.start == 0) {
                        bbox.min.x = place["x"];
                        bbox.min.y = place["y"];
                        bbox.max.x = place["x"];
                        bbox.max.y = place["y"];
                        bbox.start = 1;
                    }
                    bbox.min.x = Math.min(bbox.min.x, place["x"]);
                    bbox.min.y = Math.min(bbox.min.y, place["y"]);
                    bbox.max.x = Math.max(bbox.max.x, place["x"]);
                    bbox.max.y = Math.max(bbox.max.y, place["y"]);
                }
                points = points + place["x"] + "," + place["y"] + " ";
            }
            return points;
        },

        /**
         * Добавление обработчиков событий
         * @method setEvents
         * @param ids {Array} Массив идентификаторов элементов для назначения обработчика
         */
        // ===============================================================
        setEvents: function (ids) {
            if (this.eventSets.length == 0) return;
            var el,
                eventPane = $(this.map.eventPane);
            if (eventPane.length == 0) {
                return;
            }

            for (var i = 0; i < ids.length; i++) {
                el = document.getElementById(ids[i]);
                if (!el) {
                    // console.log(ids[i]);
                    continue;
                }

                for (var j = 0; j < this.eventSets.length; j++) {
                    switch (this.eventSets[j]) {
                        case "mouseover":
                            el.onmouseover = function (event) {
                                if (event.target.attributes.cursor)
                                    $(this).css("cursor", event.target.attributes.cursor.value);
                                eventPane.trigger({
                                    type: 'svgmouseover',
                                    dataobject: event
                                });
                            };
                            break;
                        case "mouseleave":
                            el.onmouseout = function (event) {
                                if (event.target.attributes.cursor)
                                    $(this).css("cursor", event.target.attributes.cursor.value);
                                eventPane.trigger({
                                    type: 'svgmouseleave',
                                    dataobject: event
                                });
                            };
                            break;
                        case "click":
                            el.onclick = function (event) {
                                eventPane.trigger({
                                    type: 'svgclick',
                                    dataobject: event
                                });
                            };
                            break;
                        case "mousedown":
                            el.onmousedown = function (event) {
                                eventPane.trigger({
                                    type: 'svgmousedown',
                                    dataobject: event
                                });
                            };
                            break;
                        case "mouseup":
                            el.onmouseup = function (event) {
                                eventPane.trigger({
                                    type: 'svgmouseup',
                                    dataobject: event
                                });
                            };
                            break;

                        case "dblclick":
                            el.ondblclick = function (event) {
                                eventPane.trigger({
                                    type: 'svgdblclick',
                                    dataobject: event
                                });
                            };
                            break;
                    }
                }
            }
        },

        /**
         * Обновить обработчики
         * @method updateEvents
         */
        // ===============================================================
        updateEvents: function () {
            this.clearEvents(this.ids);
            this.setEvents(this.ids);
        },


        /**
         * Удаление объекта из svg-холста
         * @method deleteObject
         * @param {String} xid Идентификатор элемента
         */
        // ===============================================================
        deleteObject: function (xid, type) {
            var selector;
            if (type && type.toLowerCase() == "title") { // Если подпись
                selector = "#" + this.svgCanvasId + " text[xid='" + xid + "']";
                $(selector).parent().remove();
                selector = "#" + this.svgCanvasId + " path[xid='textPath_" + xid + "']";
                $(selector).remove();
            }
            else {
                selector = "#" + this.svgCanvasId + " path[xid='" + xid + "']";
                $(selector).parent().remove();
            }
        },

        /**
        * Формирование линейного массива координат в координатах экрана из строки svg элемента
        * @method getCoords_pixelByLine
        * @param line {String} Строка двухмерных координат (x y), разделитель ','
        * @returns {Array} Результирующий двухмерный массив координат
        */
        // ===============================================================
        getCoords_pixelByLine: function (line) {
            if (!line) return;

            var points;
            // Для ie11 (там разделитель ' L ')
            if (line.indexOf(" L ") >= 0) {
                line = line.slice(1);
                points = line.split(" L ");
            }
            else
                points = line.split(" ");
            var coordinates = new Array();
            for (var j = 0; j < points.length; j++) {
                if (points[j] == "")
                    continue;
                var coords = points[j].split(",");
                if (!coords || coords.length == 1)  // это был ie11
                    coords = points[j].split(" ");
                coordinates.push(coords);
            }
            return coordinates;
        },

        /**
         * Получение массива координат элемента 'path' формата svg в координатах экрана  
         * по идентификатору элемента 'path'
         * @method getCoords_pixel_byId
         * @param id {String} Идентификатор элемента 'path'
         * @returns {Array} Результирующий трехмерный массив координат
         */
        // ===============================================================
        getCoords_pixel_byId: function (id) {
            var target = document.getElementById(id);
            if (target)
                return this.getCoords_pixel(target);
        },

        /**
         * Получение массива координат элемента 'path' формата svg в координатах экрана  
         * по элементу 'path'
         * @method getCoords_pixel
         * @param target {Element} Элемент 'path' в dom модели (document.getElementById(id))
         * @returns {Array} Результирующий трехмерный массив координат
         */
        // ===============================================================
        getCoords_pixel: function (target) {
            if (!target) return;
            var objectcoord = new Array(), coordinates, lines;
            var d = target.getAttributeNS(null, 'd');
            if (!d) {
                // Если есть координаты 
                var cx = target.getAttributeNS(null, 'cx'),
                    cy = target.getAttributeNS(null, 'cy');
                if (cx && cy) {
                    var coordinates = new Array();
                    coordinates.push([cx, cy]);
                    objectcoord.push(coordinates);
                    return objectcoord;
                }
                return;
            }

            lines = d.split("M");
            for (var i = 0; i < lines.length; i++) {
                if (lines[i] == "")
                    continue;
                coordinates = this.getCoords_pixelByLine(lines[i]);
                if (coordinates)
                    objectcoord.push(coordinates);
            }

            return objectcoord;
        },

        /**
         * Обновление одной координаты элемента 'path' формата svg 
         * @method updateCoordPart
         * @param target {Element} Элемент 'path' в dom модели (document.getElementById(id))
         * @param iline {Int} Индекс строки элемента 'path' (с 0)
         * @param ipoint {Int} Индекс координаты(точки) в строке элемента 'path' (с 0)
         * @param coord {Array} Новое значение - координата точки [x,y]
         * @returns {Array} Результирующий трехмерный массив координат
         */
        // ===============================================================
        updateCoordPart: function (target, iline, ipoint, coord) {
            if (!target || coord instanceof Array == false || coord.length < 2 || iline < 0) return;

            var d = target.getAttributeNS(null, 'd');
            if (!d) return;
            var objectcoord = new Array(), coordinates, lines, k = 0;
            lines = d.split("M");
            for (var i = 0; i < lines.length; i++) {
                if (lines[i] == "")
                    continue;
                coordinates = this.getCoords_pixelByLine(lines[i]);
                if (iline instanceof Array == false) {
                    if (k == iline) {
                        //coordinates = this.getCoords_pixelByLine(lines[i]);
                        if (ipoint < coordinates.length)
                            coordinates[ipoint] = [coord[0], coord[1]];
                    }
                }
                else {
                    if (k == iline) {
                        //coordinates = this.getCoords_pixelByLine(lines[i]);
                        if (ipoint < coordinates.length)
                            coordinates[ipoint] = [coord[0], coord[1]];
                    }
                }

                objectcoord.push(coordinates);
                k++;
            }

            this.updatePart(target, objectcoord);
            return objectcoord;
        },

        /**
         * Обновление элемента 'path' формата svg 
         * @method updatePart
         * @param target {Element} Элемент 'path' в dom модели (document.getElementById(id))
         * @param coords {Array} Координаты для элемента 'path'
         * @param ipoint {Int} Индекс координаты(точки) в строке элемента 'path' (с 0)
         * @param coord {Array} Новое значение - координата точки [x,y]
         * @param geo {Boolean} Признак того, что в coords геодезические координаты
         */
        // ===============================================================
        updatePart: function (target, coords, geo) {
            if (!target || coords instanceof Array == false) return;

            var points = "M";
            var bb = {
                "start": 0,
                "min": { "x": 0, "y": 0 },
                "max": { "x": 0, "y": 0 }
            };

            points = this.pointsArray(coords, points, bb, !geo);
            target.setAttributeNS(null, 'd', points);
            var bboxpixel = bb.min.x + "," + bb.min.y + " " + bb.max.x + "," + bb.max.y;
            target.setAttributeNS(null, "bbox", bboxpixel);

        },

        /**
         * Добавление шаблонов маркеров в SVG
         * @method addMarkerTemplate
         * @param options {Object} Параметры шаблона
         * @param id {String} Идентификатор точечного объекта
         */
        // ===============================================================
        addMarkerTemplate: function (options, id) {
            //id = id.replace(/\s+|:|\./g, '_');
            id = this.getId(id);//id.replace(/\./g, '_');
            var defs = $(this.svgCanvas).find("defs");
            if ($(this.svgCanvas).find("defs").length == 0) {
                defs = document.createElementNS(this.svgNS, "defs");
                $(this.svgCanvas).append(defs);
            }

            if ($(defs).find("#marker_" + id).length > 0)
                return;
            var scaleCurr = 1;
            defs = $(defs);
            mW = 32 * scaleCurr;
            mH = 32 * scaleCurr;

            var marker = document.createElementNS(this.svgNS, "marker");
            marker.setAttributeNS(null, 'refX', "16");
            marker.setAttributeNS(null, 'refY', "16");
            marker.setAttributeNS(null, 'markerUnits', "userSpaceOnUse");
            marker.setAttributeNS(null, 'markerWidth', mW);
            marker.setAttributeNS(null, 'markerHeight', mH);
            marker.setAttributeNS(null, 'id', "marker_" + id);

            var path = document.createElementNS(this.svgNS, "path");
            path.setAttributeNS(null, 'stroke', options["stroke"]);
            path.setAttributeNS(null, 'stroke-width', options["stroke-width"]);
            path.setAttributeNS(null, 'stroke-dasharray', options["stroke-dasharray"]);
            path.setAttributeNS(null, 'stroke-opacity', options["stroke-opacity"]);
            path.setAttributeNS(null, 'fill', options["fill"]);
            path.setAttributeNS(null, 'fill-opacity', options["fill-opacity"]);
            path.setAttributeNS(null, 'pointer-events', "none");
            path.setAttributeNS(null, 'd', options["marker"]);
            if (path.getTotalLength() == 0)
                throw ("-2");
            marker.appendChild(path);
            defs.append(marker);
            return marker;
        },

        /**
         * Изменение масштаба маркера точечного объекта
         * @method scalingMarkerTemplate
         * @param scaleCurr {Number} Текущий масштаб
         */
        // ===============================================================
        scalingMarkerTemplate: function (scaleCurr) {
            var viewbox = "0 0 64 64";
            viewbox = viewbox.split(" ");
            var mW = parseFloat("32");
            var mH = parseFloat("32");
            mW = mW * scaleCurr;
            mH = mH * scaleCurr;

            for (var i = 0; i < $("defs marker").length; i++) {
                $("defs marker")[i].setAttribute('markerWidth', parseInt(mW));
                $("defs marker")[i].setAttribute('markerHeight', parseInt(mH));

            }
        },

        /**
         * Создание элементов текстовой надписи для svg-холста
         * @method addText
         * @param options {Object} Параметры надписи
         * @param id {String} Идентификатор объекта
         * @param points {String} Строка координат для svg-элемента
         * @returns {Element} Текстовый элемент для svg-холста
         */
        // ===============================================================
        addText: function (options, id, points, xid) {
            // id = this.getId(id);//id.replace(/\./g, '_');
            id = id.replace(/\./g, '_');

            var path = document.createElementNS(this.svgNS, "path");
            path.setAttributeNS(null, 'stroke', "blue");
            path.setAttributeNS(null, 'd', points);
            path.setAttributeNS(null, "id", "textPath_" + id);
            path.setAttributeNS(null, "xid", "textPath_" + xid);

            var defs = $(this.svgCanvas).find("defs");
            if ($(this.svgCanvas).find("defs").length == 0) {
                defs = document.createElementNS(this.svgNS, "defs");
                $(this.svgCanvas).append(defs);
            }

            if ($(defs).find("#textPath_" + id).length > 0)
                return;
            $(defs).append(path);

            var text = document.createElementNS(this.svgNS, "text");
            text.setAttributeNS(null, 'font-family', options['font-family']);
            text.setAttributeNS(null, 'font-size', options['font-size']);
            text.setAttributeNS(null, 'class', "vector-polyline");
            text.setAttributeNS(null, "id", id);
            text.setAttributeNS(null, "name", name);
            text.setAttributeNS(null, "xid", xid);

            text.setAttributeNS(null, 'fill', options['fill'] || "blue");
            text.setAttributeNS(null, 'letter-spacing', options['letter-spacing']);

            var textPath = document.createElementNS(this.svgNS, "textPath");
            textPath.setAttributeNS("http://www.w3.org/1999/xlink", 'href', "#textPath_" + id);
            textPath.setAttributeNS(null, 'startOffset', options['startOffset']);
            textPath.setAttributeNS(null, "xid", xid);


            $(textPath).prop('textContent', options['text']);

            text.appendChild(textPath);
            return text;
        },

        /**
        * Перевод гещдезических координат в координаты svg холста
        * @method geo2svg
        * @param coordinates {Array} Двухмерный массив координат
        * @returns {Object} Объект {x, y}
        */
        // ===============================================================
        geo2svg: function (coordinates, map) {
            if (coordinates instanceof Array == false || coordinates.length == 0)
                return;
            var geo = GWTK.toLatLng([coordinates[1], coordinates[0]]);
            map = this.map || map;
            if (!map) return;
            var place = GWTK.tileView.geo2pixelOffset(map, geo);
            if (!place) return;
            if (Math.abs(place["x"]) > this.pixelLimit / 2 || Math.abs(place["y"]) > this.pixelLimit / 2)
                this.error = true;
            return place;
        },

        /**
          * Добавление/вставка элемента на svg холст
          * @method appendElement
          * @param el {Object} Элемент в dom модели, который нужно добавить
          * @param parent {Object} Родительский элемент в dom модели, куда нужно добавить el
          * @param before {Object} Элемент в dom модели, перед которым нужно добавить el
          * @returns {Element} Вставленный элемент
          */
        // ===============================================================
        appendElement: function (el, parent, before) {
            if (!el) return;
            if (!parent) {
                if (!this.svgCanvas) {
                    this.createCanvas();
                    $(this.drawpanel).append(this.svgCanvas);
                }
                parent = this.svgCanvas;
            }

            if (parent) {
                if (before && before.parentNode != parent) {
                    return;
                }
                return parent.insertBefore(el, before);
            }
            else {
                if (this.svgCanvas)
                    return this.svgCanvas.insertBefore(el, before);
            }

        },

        /**
          * Создание svg элемента - окружность
          * @method createSVGcircle
          * @param id {String} Идентификатор создаваемого элемента
          * @param parent {Object} Родительский элемент в dom модели, в которос будет создана окружность
          * @param options {Object} Объект атрибутов  {"cx": 1, "cy": 1, "r": 4, "style" : style, "bbox":bbox }
          * @param fn_events {Array Object} Массив объектов для назначения событий [
          *   {"event": "onmouseover", "func": "fn_mouseover"},
          *   {"event": "onmouseout", "func": "fn_mouseout"}, ...]   
          * @param before {Object} Элемент в dom модели, перед которым нужно добавить el
          * @returns {Element} Вставленный элемент
          */
        // ===============================================================
        createSVGcircle: function (id, parent, options, fn_events, before) {
            if (!id || !options || !options.cx || !options.cy) return;

            var el = document.createElementNS(this.svgNS, "circle");
            var r = (options.r) ? options.r : this.defaultoptions.radiuscircle;
            el.setAttributeNS(null, 'r', r);
            el.setAttributeNS(null, "id", id);
            el.setAttributeNS(null, "xid", id);
            el.setAttributeNS(null, 'cx', options.cx);
            el.setAttributeNS(null, 'cy', options.cy);
            if (options.bbox)
                el.setAttributeNS(null, "bbox", options.bbox);

            var style = (options.style) ? options.style : 'fill:' + this.defaultoptions["fill"] + '; stroke:' + this.defaultoptions["stroke"] + '; stroke-width:'
                    + this.defaultoptions["stroke-width"] + '; fill-opacity:' + this.defaultoptions["fill-opacity"] + ';' +
                    ' vector-effect:' + this.defaultoptions["vector-effect"] + ';';
            el.setAttributeNS(null, 'style', style);

            if (options.transform)
                el.setAttributeNS(null, 'transform', options.transform);

            if (fn_events && fn_events.length > 0) {
                for (var i = 0; i < fn_events.length; i++) {
                    el.setAttributeNS(null, fn_events[i].event, fn_events[i].func);
                }
            }

            if (parent) {
                if (before && before.parentNode != parent) {
                    return;
                }
                return parent.insertBefore(el, before);
            }
            else {
                if (this.svgCanvas)
                    return this.svgCanvas.insertBefore(el, before);
            }

        },

        /**
         * Создание svg элемента - квадрат
         * @method createSVGrect
         * @param id {String} Идентификатор создаваемого элемента
         * @param parent {Object} Родительский элемент в dom модели, в которос будет создана окружность
         * @param options {Object} Объект атрибутов  {"cx": 1, "cy": 1, "r": 4, "style" : style, "bbox":bbox }
         * @param fn_events {Array Object} Массив объектов для назначения событий [
         *   {"event": "onmouseover", "func": "fn_mouseover"},
         *   {"event": "onmouseout", "func": "fn_mouseout"}, ...]   
         * @param before {Object} Элемент в dom модели, перед которым нужно добавить el
         * @returns {Element} Вставленный элемент
         */
        // ===============================================================
        createSVGrect: function (id, parent, options, fn_events, before) {
            if (!id || !options || !options.x || !options.y) return;
            var w = h = r = (options.r) ? options.r : this.defaultoptions.radiuscircle;

            var el = document.createElementNS(this.svgNS, "rect");
            el.setAttributeNS(null, "id", id);
            el.setAttributeNS(null, 'x', options.x - (w / 2));
            el.setAttributeNS(null, 'y', options.y - (h / 2));
            el.setAttributeNS(null, 'width', w);
            el.setAttributeNS(null, 'height', h);
            if (options.bbox)
                el.setAttributeNS(null, "bbox", options.bbox);

            style = (options.style) ? options.style : 'fill:' + this.defaultoptions["fill"] + '; stroke:' + this.defaultoptions["stroke"] + '; stroke-width:'
                    + this.defaultoptions["stroke-width"] + '; fill-opacity:' + this.defaultoptions["fill-opacity"] + ';' +
                    ' vector-effect:' + this.defaultoptions["vector-effect"] + ';';
            el.setAttributeNS(null, 'style', style);

            if (options.transform)
                el.setAttributeNS(null, 'transform', options.transform);

            if (fn_events && fn_events.length > 0) {
                for (var i = 0; i < fn_events.length; i++) {
                    el.setAttributeNS(null, fn_events[i].event, fn_events[i].func);
                }
            }

            if (parent) {
                if (before && before.parentNode != parent) {
                    return;
                }
                return parent.insertBefore(el, before);
            }
            else {
                if (this.svgCanvas)
                    return this.svgCanvas.insertBefore(el, before);
            }
        },

        /**
         * Создание svg элемента - линия
         * @method createSVGline
         * @param id {String} Идентификатор создаваемого элемента
         * @param parent {Object} Родительский элемент в dom модели, в которос будет создана окружность
         * @param options {Object} Объект атрибутов  {"x1": 1, "y1": 1, "x2": 2, "y2": 2, "style" : style, "bbox":bbox }
         * @param fn_events {Array Object} Массив объектов для назначения событий [
         *   {"event": "onmouseover", "func": "fn_mouseover"},
         *   {"event": "onmouseout", "func": "fn_mouseout"}, ...]   
         * @param before {Object} Элемент в dom модели, перед которым нужно добавить el
         * @returns {Element} Вставленный элемент
         */
        // ===============================================================
        createSVGline: function (id, parent, options, fn_events, before) {
            if (!id || !options || !options.x1 || !options.y1 || !options.x2 || !options.y2) return;

            var el = document.createElementNS(this.svgNS, "line");
            el.setAttributeNS(null, "id", id);
            el.setAttributeNS(null, 'x1', options.x1);
            el.setAttributeNS(null, 'y1', options.y1);
            el.setAttributeNS(null, 'x2', options.x2);
            el.setAttributeNS(null, 'y2', options.y2);
            if (options.bbox)
                el.setAttributeNS(null, "bbox", options.bbox);

            var style = (options.style) ? options.style : 'fill:' + this.defaultoptions["fill"] + '; stroke:' + this.defaultoptions["stroke"] + '; stroke-width:'
                    + this.defaultoptions["stroke-width"] + '; fill-opacity:' + this.defaultoptions["fill-opacity"] + ';' +
                    ' vector-effect:' + this.defaultoptions["vector-effect"] + ';';
            el.setAttributeNS(null, 'style', style);

            if (fn_events && fn_events.length > 0) {
                for (var i = 0; i < fn_events.length; i++) {
                    el.setAttributeNS(null, fn_events[i].event, fn_events[i].func);
                }
            }

            if (parent) {
                if (before && before.parentNode != parent) {
                    return;
                }
                return parent.insertBefore(el, before);
            }
            else {
                if (this.svgCanvas) {
                    return this.svgCanvas.insertBefore(el, before);
                }
            }

        },

        /**
         * Создание элемента path
         */
        createSVGPath: function(id, parent, options, before) {
            if (!id || !options || !options.d || !options.style)
                return;

            var el = document.createElementNS(this.svgNS, "path");
            el.setAttributeNS(null, "id", id);
            el.setAttributeNS(null, "d", options.d);
            el.setAttributeNS(null, "style", options.style);
            if (parent) {
                return parent.insertBefore(el, before);
            }
        },

        /**
         * Создание defs
         */
        createSvgDefs:  function() {
            var defs = $(this.svgCanvas).find("defs");
            if (defs.length == 0) {
                defs = document.createElementNS(this.svgNS, "defs");
                $(this.svgCanvas).append(defs);
            }
            return $(this.svgCanvas).find("defs");
        },

        /**
         * Создание элемента подпись
         */
        createSVGText: function(id, parent, options, before) {
            if (!id || !options || !options.d || !options.style)
                return;

            var text = document.createElementNS(this.svgNS, "text");
            text.setAttributeNS(null, "style", options.style);
            text.setAttributeNS(null, "id", 'text_' + id);

            // Разберем выравнивание текста по горизонтальной или вертикальной линии
            if (!options['writing-mode']) {
                var path = document.createElementNS(this.svgNS, "path");
                path.setAttributeNS(null, "id", 'textPath_' + id);
                path.setAttributeNS(null, "d", options.d);
                // path.setAttributeNS(null, "style", options.style);

                // var defs = $(this.svgCanvas).find("defs");
                //                 // if (defs.length == 0) {
                //                 //     defs = document.createElementNS(this.svgNS, "defs");
                //                 //     $(this.svgCanvas).append(defs);
                //                 // }

                var $defs = this.createSvgDefs(),
                    // $def_textPath = ($(defs).find("#textPath_" + id));
                    $def_textPath = $defs.find("#textPath_" + id);
                if ($def_textPath.length > 0) {
                    $def_textPath.remove();
                }
                // $(defs).append(path);
                $defs.append(path);
                // this.appendElement(path, defs);

                var textPath = document.createElementNS(this.svgNS, "textPath");
                textPath.setAttributeNS("http://www.w3.org/1999/xlink", 'href', "#textPath_" + id);
                $(textPath).prop('textContent', options['text']);

                text.appendChild(textPath);
            }
            else {
                var x, y, mass = options.d.split(' ');
                if (mass && mass.length > 1) {
                    mass = mass[0].split(',');
                    if (mass && mass.length > 1) {
                        x = mass[0].slice(1);
                        y = mass[1];
                    }
                }
                text.setAttributeNS(null, "x", x);
                text.setAttributeNS(null, "y", y);
                text.textContent = options['text'];
                text.innerHTML = options['text'];
            }

            if (parent) {
                return parent.insertBefore(text, before);
            }
        },

        getId: function (id) {
            if (id) {
                return this.svgIdentIds + '_' + id.replace(/\./g, '_');
                //return id.replace(/\./g, '_');
            }
        }
    };
}
