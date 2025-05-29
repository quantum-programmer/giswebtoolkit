/**************************************** Тазин В.     09/07/20 *****
 **************************************** Гиман Н.Л.   14/09/18 *****
 **************************************** Соколова Т.  04/06/21 *****
 ***************************************** Нефедьева О. 08/06/20 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Компонент векторная графика                       *
 *                                                                  *
 *******************************************************************/

import GeoPoint from '~/geo/GeoPoint';

if (window.GWTK) {
    /**
     * Компонент векторная графика
     * @class GWTK.svgDrawing
     * @constructor GWTK.svgDrawing
     */
    GWTK.svgDrawing = function(map, id, parent, svgid, eventSets, params) {
        if (!id || !svgid)
            return false;
        this.map = map;
        if (!this.map) {                                                                // 21/11/17
            console.log("GWTK.svgDrawing. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        // панель для SVG-холста
        this.parent = this.drawpanel = parent;
        if (!this.drawpanel) {
            // Поищем панель (на всякий пожарный, чтоб не создавалось дубликатов)
            var $el = $('#' + id);
            if (!$el || $el.length == 0) {
                this.drawpanel = GWTK.DomUtil.create('div', 'svgdrawing-panel', this.map.mapPane);
                this.drawpanel.id = id;
                this.drawpanel.style.zIndex = $(this.map.overlayPane).css('z-index') - 1;
                this.drawpanel.style.position = 'absolute';
            }else
                this.drawpanel = $el[0];
        }
        this.svgCanvasId = svgid;
        this.prefixMarker = 'marker_' + this.svgCanvasId;
        this.eventSets = null;
        if (eventSets)
            this.eventSets = eventSets;
        // events = [ "mouseover", "mouseleave", "click", "mousedown", "mouseup"];
        this.origin = {};
        this.svgCanvas = null;
        this.viewBox = {};
        this.pixelLimit = null;
        this.BL = null;
        this.maxZoom = null;
        this.bbox = [-180, -90, 180, 90];
        this.errorOverbox = "-2";
        this.style = "";
        
        this.svgNS = "http://www.w3.org/2000/svg";
        
        // Предельные значения для ширины элемента в браузере
        this.maxCSSvalue = {
            "chrome": "33553900",
            "mozilla": "17895100",
            "opera": "29825600"
        };
        // параметры рисования по умолчанию
        this.options = {
            "vector-effect": "non-scaling-stroke",
            "stroke": "green",
            "stroke-width": "2px",
            "stroke-opacity": "0.75",
            "fill": "blue",
            "fill-opacity": "0.75",
            "background": "",
            "background-size": "auto auto",
            "objName": "SEM99",
            // "marker": {"path": 'M 1 6 a 5 5 0 0 0 11 0M 1 6 a 3 3 0 0 1 11 0'},
            //  "marker": {"path": "M2 9 L4.06 13.98 L10.5 17.5 L16.94 13.98 L19 9 L16.94 4.02 L10.5 0.5 L4.06 4.02 Z", "refX": 8, "refY":8},
            "marker": {
                "path": "M2 9 L4.06 13.98 L10.5 17.5 L16.94 13.98 L19 9 L16.94 4.02 L10.5 0.5 L4.06 4.02 Z",
                "refX": 8,
                "refY": 8
            },  // Ромб
            // "marker": {
            //     "width": "32px",
            //     "height": "32px",
            //     "path": "M 2 16 a 7 7 0 0 0 28 0M 2 16 a 7 7 0 0 1 28 0",
            //     "centerX": "16",
            //     "centerY": "16"
            // },
            "typeField": "id",
            "font-family": "Verdana",
            "font-size": "12px",
            "letter-spacing": "1",
            "startOffset": "", //"2%",
            "stroke-dasharray": "none",
            //		"text" : "Текст по умолчанию"
            "text": ""
            , "writing-mode": ""
            , "text-shadow": ""
            , "text-decoration": "none"
            , "font-style": GWTK.GRAPHIC.fontStyleDefault     // стиль шрифта: normal | italic | oblique
            , "font-weight": GWTK.GRAPHIC.fontWeightDefault   // насыщенность(толщина?) шрифта bold(полужирное)|bolder|lighter|normal(нормальное)|100|200|300|400|500|600|700|800|900
            , "font-stretch": GWTK.GRAPHIC.fontStretchDefault // начертание (condensed(узкоеЮ)|normal(нормальное)|expanded(широкое)
            
        };
        
        this.animate = {
            "stroke": "red",
            "stroke-width": "2px",
            "stroke-opacity": "1",
            "fill": "red",
            "fill-opacity": "0.2"
        };
        
        this.params = params || {};
        
        // Функция добавления шаблонов заливки
        // Входной параметр объект Feature объекта GeoJSON
        this.addFillPattern = null;
        
        this.init();
    };
    
    GWTK.svgDrawing.prototype = {
        
        /**
         * Инициализация
         * @method init
         * @private
         */
        // ===============================================================
        init: function() {
            this.drawpanel.style.left = 0 + "px";
            this.drawpanel.style.top = 0 + "px";
            this.drawpanel.style.width = 100 + "%";
            this.drawpanel.style.height = 100 + "%";
            this.drawpanel.style["pointer-events"] = "none";
            // Передача событий на eventPane
            var that = this;
            $(this.drawpanel).on(GWTK.mousedown, function(e) {
                $(that.map.eventPane).trigger(e);
            });
            $(this.drawpanel).on(GWTK.mouseup, function(e) {
                $(that.map.eventPane).trigger(e);
            });
            $(this.drawpanel).on(GWTK.mouseleave, function() {
                $(that.map.drawPane).show();
            });
            $(this.drawpanel).on(GWTK.mousemove, function(e) {
                $(that.map.eventPane).trigger(e);
            });
            $(this.drawpanel).on(GWTK.click, function(e) {
                $(that.map.eventPane).trigger(e);
            });
            $(this.drawpanel).on("mousewheel DOMMouseScroll wheel MozMousePixelScroll", function(e) {
                $(that.map.eventPane).trigger(e);
            });
            
            
            var eventNameOr = 'overlayRefresh.' + this.drawpanel.id;
            var eventNameDrag = 'mapdrag.' + this.drawpanel.id;
            
            // $( that.map.eventPane ).off( eventNameOr );
            $(that.map.eventPane).off(eventNameDrag);
            
            $(that.map.eventPane).on(eventNameOr, function(e) {
                that.overlayPaneEvent(e);
            });
            $(that.map.eventPane).on(eventNameDrag, GWTK.Util.bind(this.eventPaneMapdrag, this));
            
            
        },
        
        /**
         * Рисование на svg-холсте
         * @method draw
         * @public
         * @param geoJSON {Object} Объекты в формате geoJSON
         * @param addSvg {Boolean} Если значение `true`, добавляет объекты к существующим; если `false` - чистит холст
         * @param params {Object} Праметры стиля отображения объектов
         * @param excellencestyle {bool} Преимущество стиля взять из описания объекта
         * @param isanimate {Bool} Анимация
         * @returns {Object} В случае ошибки возвращает ее описание
         */
        // ===============================================================
        draw: function(geoJSON, addSvg, params, excellencestyle, isanimate) {
            
            GWTK.Util.showWait();
            
            if (!addSvg) {
                this.clearDraw();
                this.bbox = geoJSON["bbox"];
            }else{
                this.bbox = null;
            }
            
            if (!this.bbox || this.bbox.length == 0) {
                var bboxInit = this.calculateBBOX(geoJSON);
                if (bboxInit.length === 0) {
                    this.bbox = [-180, -90, 180, 90];
                }else{
                    this.bbox = bboxInit;
                }
            }
            
            this.initView();
            
            //// Установим масштабный коэффициент
            //this.scaleCurr = this.map.getZoomScale(this.map.options.tilematrix)
            //    / this.scaleOrigin; // текущий коэфф. сжатия изображения
            
            
            if (!this.svgCanvas) {
                this.createCanvas();
            }
            
            var i;
            var ids = [];
            var options = {};
            var id, xid;
            var name;
            
            for (i = 0; i < geoJSON.features.length; i++) {
                if (!geoJSON.features[i] || !geoJSON.features[i].geometry || !geoJSON.features[i].geometry.coordinates)
                    continue;
                if (geoJSON.features[i]["properties"].skip) continue;                                        // 07/10/2016
                
                // Применение шаблонов (пользовательская функция)
                if (this.addFillPattern && typeof this.addFillPattern === 'function') {
                    this.addFillPattern(geoJSON.features[i]);
                }
                
                if (geoJSON.features[i]["style"] || geoJSON.features[i]["properties"]) {
                    for (var key in this.options) {
                        if (!excellencestyle) {
                            options[key] = params && params[key] ? params[key] : (geoJSON.features[i]["style"] && geoJSON.features[i]["style"][key]
                                ? geoJSON.features[i]["style"][key]
                                : (geoJSON.features[i]["properties"] && geoJSON.features[i]["properties"][key]
                                    ? geoJSON.features[i]["properties"][key]
                                    : this.options[key]));
                        }else{
                            options[key] = geoJSON.features[i]["style"] && geoJSON.features[i]["style"][key]
                                ? geoJSON.features[i]["style"][key]
                                : (geoJSON.features[i]["properties"] && geoJSON.features[i]["properties"][key]
                                    ? geoJSON.features[i]["properties"][key]
                                    : (params && params[key] ? params[key] : this.options[key]));
                        }
                    }
                }
                // Совместимость с прежним маркером
                if (typeof options["marker"] !== "object") {
                    options["marker"] = {
                        "path": options["marker"]
                    };
                }else{
                    if (!options["marker"]["path"] && !options["marker"]["image"]) {
                        options["marker"]["path"] = this.options["marker"]["path"];
                    }
                }
                var markerId = geoJSON.features[i]["properties"][options["typeField"]];
                if (!markerId)
                    markerId = geoJSON.features[i]["properties"][this.options["typeField"]];
                markerId = markerId.toString().replace(/\s+|:|\./g, '_');
                options['marker']['markerId'] = markerId;
                
                // // Применение шаблонов (пользовательская функция)
                // if (this.addFillPattern && typeof this.addFillPattern === 'function') {
                //     this.addFillPattern(geoJSON.features[i]);
                // }
                
                // рисование объекта
                if (geoJSON.features[i]["properties"]) {
                    id = geoJSON.features[i]["properties"]["id"];
                    id = id.replace(/\s+|:|\./g, '_');
                    xid = geoJSON.features[i]["properties"]["id"];
                    name = (options && options["objName"]) ? geoJSON.features[i]["properties"][options["objName"]]
                        : geoJSON.features[i]["properties"][this.options["objName"]];
                }else{
                    for (key in this.options) {
                        options[key] = params && params[key] ? params[key] : this.options[key];
                    }
                    id = "zone_" + i;
                    name = "zone_" + i;
                }
                ids.push(id);
                var geometry = geoJSON.features[i]["geometry"];
                var er = this.drawObject(geometry, id, name, options, xid, isanimate);
                if (er == this.errorOverbox) {
                    GWTK.Util.hideWait();
                    return er;
                }
            }
            
            // масштабирование и переход на нужную точку (т.к. рисование
            // производилось при максимальном)
            this.scaleCurr = this.map.getZoomScale(this.map.options.tilematrix)
                / this.scaleOrigin; // текущий коэфф. сжатия изображения
            var viewbox = this.viewBox.split(" ");
            var place = this.map.geoToPixel(new GeoPoint(this.BL.lng, this.BL.lat, 0, this.map.ProjectionId));
            
            // проверить по габаритам
            // var matrix = GWTK.tileView.getTileMatrixSize(this.map);
            // if (this.map.getWindowSize()[0] >= matrix.width) {                  // размер окна больше ширины матрицы
            //     var bbox_geo = this.map.getMapGeoBounds();
            //     var bbox = this.bbox;
            //     if (bbox_geo.SW.lng - bbox[0] > 120) {
            //         place["x"] += matrix.width;
            //     }
            // }
            
            viewbox[0] = place["x"];
            viewbox[1] = place["y"];
            // console.log('BL_init = ' + this.BL);
            // console.log('viewbox_init = ' + viewbox);
            var vb = [-viewbox[0] * this.scaleCurr,
                -viewbox[1] * this.scaleCurr,
                parseFloat(viewbox[2]) * this.scaleCurr,
                parseFloat(viewbox[3]) * this.scaleCurr].join(' ');
            
            // console.log('vb_init = ' + vb);
            
            
            this.svgCanvas.setAttributeNS("", "viewBox", vb);
            
            // Добавляем холст на панель рисования
            $(this.drawpanel).append(this.svgCanvas);
            
            // Добавляем обработчики событий для новых объектов
            if (this.eventSets != null && ids.length > 0)
                this.setEvents(ids);
            
            // Смасштабировать подписи, которые не масштабируются (подписи вместе с объектами)
            this.scalingTitleTemplate(this.map.getZoomScale(this.map.options.tilematrix) / parseFloat(this.svgCanvas.getAttribute("scaleorigin")));
            
            // Перерисовать (если было изменение размеров окна карты до этого, то все сползет)
            if (this.overlayPaneEvent) {
                this.overlayPaneEvent();
            }
            GWTK.Util.hideWait();
        },
        /**
         * Вычисление границ объекта из массива координат
         * @method coordsArray
         * @private
         * @param coordinates {Array} Массив координат
         * @param bbox {Array} Текущие координаты границ объекта
         * @return {Array} Результирующие координаты границ объекта
         */
        // ===============================================================
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
         * Вычислить bbox для полученного geoJSON
         * @param geoJSON - описание объекта
         * @return {Array}
         */
        calculateBBOX: function(geoJSON) {
            var bbox = [];
            for (var key in geoJSON['features']) {
                this.coordsArray(geoJSON['features'][key]['geometry']['coordinates'], bbox);
            }
            return bbox;
        },
        /**
         * Очищает панель рисования и svg-холст
         * @method clearDraw
         * @public
         */
        // ===============================================================
        clearDraw: function() {
            if (this.$svgCanvas) {
                $(this.$svgCanvas).remove();
            }
            //Удаляем ссылки для освобождения памяти
            this.svgCanvas = null;
            this.$svgCanvas = null;
            this.svgCanvasRightGroup = null;
            this.svgCanvasLeftGroup = null;
        },
        
        /**
         * Удаление компонента
         * @method destroy
         * @private
         */
        // ===============================================================
        destroy: function() {
            this.clearDraw();
            $(this.drawpanel).off();
            if (!this.parent) {
                $(this.drawpanel).remove();
            }
        },
        
        /**
         * Инициализация текущих параметров отображения карты
         * @method initView
         * @public
         */
        // ===============================================================
        initView: function() {
            // определяем допустимые размеры элементов для браузера
            var ua = navigator.userAgent;
            if (ua.search(/OPR/) != -1)
                this.pixelLimit = this.maxCSSvalue["opera"];
            else if ((ua.search(/Chrome/) != -1) || (ua.search(/Safari/) != -1) || (ua.search(/Trident/) != -1))
                this.pixelLimit = this.maxCSSvalue["mozilla"];
            else
                this.pixelLimit = this.maxCSSvalue["mozilla"];
            
            // координаты точки в окне карты (pixel)
            var BLmin = GWTK.toLatLng([this.bbox[1], this.bbox[0]]);
            var BLmax = GWTK.toLatLng([this.bbox[3], this.bbox[2]]);
            var BL = GWTK.toLatLng([(this.bbox[3] + this.bbox[1]) / 2,
                (this.bbox[2] + this.bbox[0]) / 2]);
            
            // Определение максимально подробного масштаба для тематической
            // карты
            //TODO:Переделать!!!
            for (var k = 0; k < this.map.tileMatrix.Ogc.ScaleDenominator.length; k++) {
                var minpx = this._geo2pixelOffset(BLmin, k);
                var maxpx = this._geo2pixelOffset(BLmax, k);
                var maxX = Math.max(Math.abs(minpx["x"] - maxpx["x"]), Math.abs(minpx["x"]), Math.abs(maxpx["y"]));
                var maxY = Math.max(Math.abs(minpx["y"] - maxpx["y"]), Math.abs(minpx["y"]), Math.abs(maxpx["y"]));
                if (maxX < this.pixelLimit && maxY < this.pixelLimit)
                    this.maxZoom = k;
            }
            this.BL = BL;
            
            this.scaleOrigin = this.map.tileMatrix.Ogc.ScaleDenominator[this.maxZoom];
            this.maxZoom = 13;
            this.scaleOrigin = this.map.getZoomScale(this.maxZoom);
            for (k = 0; k < this.map.tileMatrix.Ogc.ScaleDenominator.length; k++) {
                if (this.scaleOrigin == this.map.tileMatrix.Ogc.ScaleDenominator[k])
                    this.maxZoom = k;
            }
            this.scaleCurr = this.map.getZoomScale(this.map.options.tilematrix);
            
            if (!this.maxZoom) { // Если не определился maxZoom, берем текущий Соколова
                for (k = 0; k < this.map.tileMatrix.Ogc.ScaleDenominator.length; k++) {
                    if (this.scaleCurr == this.map.tileMatrix.Ogc.ScaleDenominator[k])
                        this.maxZoom = k;
                }
            }
            
            this.origin = this._geo2pixelOffset(this.BL, this.maxZoom);
        },
        
        /**
         * Создание SVG-холста
         * @method createCanvas
         * @private
         */
        // ===============================================================
        createCanvas: function() {
            var wh = this.map.getWindowSize();
            
            this.svgCanvas = document.createElementNS(this.svgNS, "svg");
            this.$svgCanvas = $(this.svgCanvas);
            wh[0] = parseFloat(wh[0]);
            wh[1] = parseFloat(wh[1]);
            this.svgCanvas.style.width = wh[0] + "px";
            this.svgCanvas.style.height = wh[1] + "px";
            this.viewBox = "0 0 " + wh[0] + " " + wh[1];
            this.svgCanvas.setAttributeNS("", "viewBox", this.viewBox.slice(0));
            this.svgCanvas.setAttributeNS("", "viewboxorigin", "0 0 " + wh[0] + " " + wh[1]);
            this.svgCanvas.setAttributeNS("", "width", wh[0]);
            this.svgCanvas.setAttributeNS("", "height", wh[1]);
            this.svgCanvas.style.display = "block";
            this.svgCanvas.style.position = "absolute";
            
            this.svgCanvas.setAttributeNS("", "id", this.svgCanvasId);
            this.svgCanvas.setAttributeNS("", "baseProfile", "full");
            this.svgCanvas.setAttributeNS("", "version", "1.1");
            
            this.svgCanvas.setAttributeNS("", "scaleorigin", this.scaleOrigin);
            this.svgCanvas.setAttributeNS("", "bl", [this.BL["lat"], this.BL["lng"]].toString());
            
            
            var mainGroupName = "mainGroup_" + this.svgCanvasId;
            this.svgCanvasGroup = document.createElementNS(this.svgNS, "g");
            this.svgCanvasGroup.setAttributeNS("", "id", mainGroupName);
            this.svgCanvas.appendChild(this.svgCanvasGroup);
            
            this.updateShadowCopies();
        },
        
        /**
         * Обновление/создание теневых копий элементов
         * @method updateShadowCopies
         * @public
         */
        updateShadowCopies: function() {
            
            if (!this.params['do-not-repeat']) {
                var matrix = this.map.tileMatrix.getTileMatrixSize(this.map.options.tilematrix);
                var dx = matrix.x * this.scaleCurr / this.scaleOrigin;
                if (!this.svgCanvasRightGroup) {
                    this.svgCanvasRightGroup = document.createElementNS(this.svgNS, "use");
                    this.svgCanvasRightGroup.setAttributeNS("", "id", "rightGroup");
                    this.svgCanvasRightGroup.setAttributeNS("", "transform", "translate(" + dx + ")");
                    this.svgCanvas.appendChild(this.svgCanvasRightGroup);
                }
                if (!this.svgCanvasLeftGroup) {
                    this.svgCanvasLeftGroup = document.createElementNS(this.svgNS, "use");
                    this.svgCanvasLeftGroup.setAttributeNS("", "id", "leftGroup");
                    this.svgCanvasLeftGroup.setAttributeNS("", "transform", "translate(" + (-dx) + ")");
                    this.svgCanvas.appendChild(this.svgCanvasLeftGroup);
                }
                
                var mainGroupName = "mainGroup_" + this.svgCanvasId + Math.random();
                this.svgCanvas.querySelector("g").setAttributeNS("", "id", mainGroupName);
                this.svgCanvasRightGroup.setAttributeNS("http://www.w3.org/1999/xlink", 'href', "#" + mainGroupName);
                this.svgCanvasLeftGroup.setAttributeNS("http://www.w3.org/1999/xlink", 'href', "#" + mainGroupName);
            }
        },
        
        /**
         * Рисование объекта
         * @method drawObject
         * @public
         * @param geometry {Object} Объект "geometry" формата geoJSON
         * @param id {String} Идентификатор объекта
         * @param name {String} Наименование объекта
         * @param options {Object} Параметры отображения объекта
         * @param xid {String} Дополнительный идентификатор объекта
         * @param isanimate {Bool} Анимация
         * @returns {Boolean} Возвращает `false` в случае некорректных входных данных, иначе `true`
         */
        // ===============================================================
        drawObject: function(geometry, id, name, options, xid, isanimate) {
            if (!this.svgCanvas || !geometry["coordinates"] || geometry["coordinates"].length < 1 || !id)
                return false;
            if (!options) {
                options = this.options;
            }
            
            var svgObj = this.parseJsonObj(geometry);
            if ((svgObj.type == "point" || svgObj.type == "multipoint") && options["marker"]) {
                if (options["marker"]["image"]) {
                    this.addMarkerSvgTemplate(options);
                }else{
                    this.addMarkerTemplate(options);
                }
            }
            
            var path = null;
            var g = document.createElementNS(this.svgNS, "g");
            if (svgObj.type == "text" || svgObj.type == "title") {
                path = this.addText(options, id, svgObj.path, xid);
            }else{
                path = document.createElementNS(this.svgNS, "path");
                path.setAttributeNS("", 'stroke', options["stroke"]);
                path.setAttributeNS("", 'stroke-opacity', options["stroke-opacity"]);
                if (GWTK.Util.ie_Version() !== -1 && options["vector-effect"] === 'non-scaling-stroke') {
                    var scaleCurr = this.map.getZoomScale(this.map.options.tilematrix) / parseFloat(this.svgCanvas.getAttribute("scaleorigin"));
                    path.setAttributeNS("", 'stroke-width', (scaleCurr * parseInt(options["stroke-width"])) + 'px');
                    path.setAttributeNS("", "strokewidthorigin", parseInt(options["stroke-width"]));
                    var sd = options["stroke-dasharray"];
                    if (sd) {
                        sd = sd.split(",");
                        for (var j = 0; j < sd.length; j++) {
                            sd[j] *= scaleCurr;
                        }
                        sd = sd.join(",");
                    }
                    path.setAttributeNS("", 'stroke-dasharray', sd);
                    path.setAttributeNS("", "strokedasharrayorigin", parseInt(options["stroke-dasharray"]))
                }else{
                    path.setAttributeNS("", 'stroke-width', options["stroke-width"]);
                    path.setAttributeNS("", 'stroke-dasharray', options["stroke-dasharray"]);
                }
                path.setAttributeNS("", 'vector-effect', options["vector-effect"]);
                path.setAttributeNS("", 'd', svgObj.path);
                path.setAttributeNS("", 'background', options["background"]);
                path.setAttributeNS("", 'background-size', options["background-size"]);
                if (svgObj.type !== 'point' && svgObj.type !== 'multipoint')
                    path.setAttributeNS("", 'class', "vector-polyline");
                path.setAttributeNS("", "id", id);
                path.setAttributeNS("", "name", name);
                path.setAttributeNS("", "xid", xid);
                
                if (svgObj.type != 'linestring' && svgObj.type != 'multilinestring' && svgObj.type != 'point' && svgObj.type != 'multipoint') {
                    path.setAttributeNS("", 'fill', options["fill"]);
                    path.setAttributeNS("", 'fill-opacity', options["fill-opacity"]);
                    path.setAttributeNS("", 'fill-rule', 'evenodd');  // Для изображения дырок
                }else{
                    path.setAttributeNS("", 'fill', 'transparent');
                    path.setAttributeNS("", 'fill-opacity', '0');
                }
                
                if (options["marker"]) {
                    if (svgObj.type == "point" || svgObj.type == "multipoint") {
                        var rects = [];
                        var coords = svgObj.path.split(/([^Mm\s]+)/);
                        for (var i = 0; i < coords.length; i++) {
                            var rect = coords[i].split(",");
                            if (rect.length > 1) {
                                rects.push(rect);
                            }
                        }
                        if (options["marker"]["image"]) {
                            for (i = 0; i < rects.length; i++) {
                                if (options["marker"]['rectX'] && options["marker"]['rectY'] && options["marker"]['rectWidth'] && options["marker"]['rectHeight']) {
                                    var rpath = document.createElementNS(this.svgNS, "rect");
                                    rpath.setAttributeNS("", 'x', parseFloat(rects[i][0]) - options["marker"]['rectX'] * options["marker"]['rectWidth'] + "");
                                    rpath.setAttributeNS("", 'y', parseFloat(rects[i][1]) - options["marker"]['rectY'] * options["marker"]['rectHeight'] + "");
                                    rpath.setAttributeNS("", 'rectX', parseFloat(options["marker"]['rectX']) + "");
                                    rpath.setAttributeNS("", 'rectY', parseFloat(options["marker"]['rectY']) + "");
                                    rpath.setAttributeNS("", 'pointX', rects[i][0]);
                                    rpath.setAttributeNS("", 'pointY', rects[i][1]);
                                    rpath.setAttributeNS("", 'width', options["marker"]['rectWidth'] + "");
                                    rpath.setAttributeNS("", 'height', options["marker"]['rectHeight'] + "");
                                    rpath.setAttributeNS("", "name", name);
                                    rpath.setAttributeNS("", "xid", xid);
                                    rpath.setAttributeNS("", 'class', "vector-polyline");
                                    rpath.setAttributeNS("", 'style', "fill-opacity:0;stroke-opacity:0");
                                    rpath.setAttributeNS("", 'mId', this.prefixMarker + options["marker"]["markerId"]);
                                    if (this.eventSets === null)
                                        rpath.style["pointer-events"] = "none";
                                    g.appendChild(rpath);
                                }
                            }
                        }
                    }
                    if (svgObj.type == "point") {
                        //path.setAttributeNS("", 'marker-start', "url(#marker_" + options["marker"]["markerId"] + ")");
                        //path.setAttributeNS("", 'marker-end', "url(#marker_" + options["marker"]["markerId"] + ")");
                        path.setAttributeNS("", 'marker-start', "url(#" + this.prefixMarker + options["marker"]["markerId"] + ")");
                        path.setAttributeNS("", 'marker-end', "url(#" + this.prefixMarker + options["marker"]["markerId"] + ")");
                        //						path.setAttributeNS(null, 'pathLength', "20");
                    }else if (svgObj.type == "multipoint") {
                        path.setAttributeNS("", 'marker-start', "url(#" + this.prefixMarker + options["marker"]["markerId"] + ")");
                        path.setAttributeNS("", 'marker-mid', "url(#" + this.prefixMarker + options["marker"]["markerId"] + ")");
                        path.setAttributeNS("", 'marker-end', "url(#" + this.prefixMarker + options["marker"]["markerId"] + ")");
                    }
                }
                
            }
            
            if (path) {
                
                // Если анимация
                if (isanimate) {
                    
                    var animateElement, newd = [], val;
                    if (svgObj.type == "point" || svgObj.type == "multipoint") {
                        // Удалить ссылку на маркер
                        path.setAttributeNS("", 'marker-start', "url(#marker_animate)");
                        path.setAttributeNS("", 'marker-end', "url(#marker_animate)");
                        // Найдем координаты центра
                        var delta = 1,
                            d = path.getAttribute("d");
                        var mass = d.split(',');
                        if (mass && mass.length > 1) {
                            mass[0] = parseFloat(mass[0].replace('M', ''));
                            mass[1] = parseFloat(mass[1]);
                            
                        }else{
                            mass = [];
                            mass[0] = parseFloat(mass[0]);
                            mass[1] = parseFloat(mass[1]);
                        }
                        newd = [
                            (mass[0] - delta).toString() + ',' + (mass[1] - delta).toString(),
                            (mass[0] + delta).toString() + ',' + (mass[1] - delta).toString(),
                            (mass[0] + delta).toString() + ',' + (mass[1] + delta).toString(),
                            (mass[0] - delta).toString() + ',' + (mass[1] + delta).toString(),
                            (mass[0] - delta).toString() + ',' + (mass[1] - delta).toString()
                        ];
                        
                        animateElement = document.createElementNS(this.svgNS, "animate");
                        animateElement.setAttribute("attributeType", "XML");
                        animateElement.setAttribute("attributeName", "d");
                        // Сделать отностительно центра
                        val = 'M' + newd.join(' ') + ';';
                        //                        animateElement.setAttribute("values", "M-1,-1 1,-1 1,1 -1,1 -1,-1;");
                        animateElement.setAttribute("values", val);
                        animateElement.setAttribute("dur", "1.7s");
                        animateElement.setAttribute("repeatCount", "indefinite");
                        path.appendChild(animateElement);
                    }
                    
                    if (GWTK.Util.ie_Version() !== -1 && options["vector-effect"] === 'non-scaling-stroke') {
                        var scaleCurr = this.map.getZoomScale(this.map.options.tilematrix) / parseFloat(this.svgCanvas.getAttribute("scaleorigin"));
                        path.setAttributeNS("", 'stroke-width', (scaleCurr * parseInt(this.animate["stroke-width"])) + 'px');
                        path.setAttributeNS("", "strokewidthorigin", parseInt(this.animate["stroke-width"]));
                        if (svgObj.type == "point" || svgObj.type == "multipoint") {
//                            path.setAttribute("d", "M-1,-1 1,-1 1,1 -1,1 -1,-1;");
                            path.setAttribute("d", val);
                        }
                    }else{
                        
                        /** Create the DOM object for shape animation, and set its attributes. */
                        animateElement = document.createElementNS(this.svgNS, "animate");
                        animateElement.setAttribute("attributeType", "XML");
                        animateElement.setAttribute("attributeName", "stroke");
                        animateElement.setAttribute("values", "transparent;" + this.animate["stroke"] + ";transparent;");
                        animateElement.setAttribute("dur", "1.7s");
                        animateElement.setAttribute("repeatCount", "indefinite");
                        path.appendChild(animateElement);
                    }
                }
                if (this.eventSets === null)
                    path.style["pointer-events"] = "none";
                g.appendChild(path);
                
                // Добавить подписи, если они есть
                this.addTitles(id, svgObj.path, options["text"], g);
                
                this.svgCanvasGroup.appendChild(g);
                
                return true;
            }
            
        },
        
        /**
         * Преобразование geoJSON объекта в элемент для SVG-холста
         * @method parseJsonObj
         * @private
         * @param geometry {Object} Объект "geometry" формата geoJSON
         * @returns {Object} Элемент для SVG-холста
         */
        // ===============================================================
        parseJsonObj: function(geometry) {
            var svgType = geometry["type"].toLowerCase(),
                points = this.pointsArray(geometry["coordinates"], svgType);
            if (points.length < 1)
                return null;
            return { path: points, type: svgType };
        },
        
        /**
         * Формирование строки svg-координат
         * @method pointsArray
         * @private
         * @param coordinates {Array} Массив координат объекта
         * @param svgType {String} Тип geoJSON объекта
         * @returns {String} Результирующая строка координат
         */
        // ===============================================================
        pointsArray: function(coordinates, svgType) {
            var level = 0,
                coords = coordinates.slice(),
                lit = ",",
                polygons = [];
            if (svgType == "point" || svgType == "multipoint") {
                lit = "M";
            }
            // Уровень вложенности
            while (true) {
                if (!Array.isArray(coords))
                    break;
                coords = coords[0];
                level++;
            }
            // Восстанавливаем массив координат до 4-го уровня вложенности
            while (level < 4) {
                coordinates = [coordinates];
                level++;
            }
            for (var i = 0, ilen = coordinates.length; i < ilen; i++) {
                // Уровень polygon
                coords = coordinates[i];
                var lines = [];
                for (var j = 0, jlen = coords.length; j < jlen; j++) {
                    // Уровень line
                    var pointsArray = [],
                        lineCoords = coords[j];
                    for (var ii = 0, iilen = lineCoords.length; ii < iilen; ii++) {
                        
                        // console.log('lineCoords[ii] = ' + lineCoords[ii]);
                        var place = this.convertCoordinates(lineCoords[ii]);
                        // console.log('place = ' + place);
                        
                        pointsArray.push(place["x"] + "," + place["y"] + " ");
                    }
                    lines.push(pointsArray.join(lit));
                }
                polygons.push(lines.join("M"));
            }
            return "M" + polygons.join("M");
        },
        
        /**
         * Конвертирование координат в координаты svg-холста
         * @method convertCoordinates
         * @private
         * @param coordinates {Array} Одномерный массив координат
         * @returns {String} Строка координат svg-элемента
         */
        // ===============================================================
        convertCoordinates: function(coordinates) {
            var coord = [parseFloat(coordinates[1]), parseFloat(coordinates[0])];
            var geo = GWTK.toLatLng(coord);
            var place = this._geo2pixelOffset(geo, this.maxZoom);
            place["x"] = (place["x"] - this.origin["x"]).toFixed(3);
            place["y"] = (place["y"] - this.origin["y"]).toFixed(3);
            if (Math.abs(place["x"]) > this.pixelLimit / 2 || Math.abs(place["y"]) > this.pixelLimit / 2)
                this.error = true;
            return place;
        },
        
        /**
         * Добавление обработчиков событий
         * @method setEvents
         * @private
         * @param ids {Array} Массив идентификаторов элементов для назначения обработчика
         */
        // ===============================================================
        setEvents: function(ids) {
            var that = this;
            for (var i = 0; i < ids.length; i++) {
                // var element = $("#" + ids[i])[0];
                var element = this.svgCanvas.getElementById(ids[i]);
                element = $(element).parent()[0];// Выбираем <g>
                if (!element) {
                    continue;
                }
                for (var j = 0; j < this.eventSets.length; j++) {
                    
                    switch (this.eventSets[j]) {
                        case "mouseover":
                            element.onmouseover = function(event) {
                                if (!event.srcElement) {
                                    event.srcElement = event.target;
                                }
                                $(that.map.eventPane).trigger({
                                    type: 'svgmouseover',
                                    dataobject: event
                                });
                            };
                            break;
                        case "mouseleave":
                            element.onmouseout = function(event) {
                                if (!event.srcElement) {
                                    event.srcElement = event.target;
                                }
                                $(that.map.eventPane).trigger({
                                    type: 'svgmouseleave',
                                    dataobject: event
                                });
                            };
                            break;
                        case "click":
                            element.onclick = function(event) {
                                if (!element.moved) {
                                    if (!event.srcElement) {
                                        event.srcElement = event.target;
                                    }
                                    $(that.map.eventPane).trigger({
                                        type: 'svgclick',
                                        dataobject: event
                                    });
                                    $(that.map.eventPane).trigger({
                                        type: 'svgclickMarker',
                                        dataobject: event
                                    });
                                }
                            };
                            break;
                        case "mousedown":
                            element.onmousedown = function(event) {
                                if (!event.srcElement) {
                                    event.srcElement = event.target;
                                }
                                $(that.map.eventPane).trigger({
                                    type: 'svgmousedown',
                                    dataobject: event
                                });
                            };
                            break;
                        case "mouseup":
                            element.onmouseup = function(event) {
                                if (!element.moved) {
                                    if (!event.srcElement) {
                                        event.srcElement = event.target;
                                    }
                                    $(that.map.eventPane).trigger({
                                        type: 'svgmouseup',
                                        dataobject: event
                                    });
                                }
                            };
                            break;
                    }
                }
                // При нажатии конпки мыши если не вводить element.moved,
                // то для svg перемещения курсора по экрану не учитывается
                // (курсор остается на объекте svg-слоя) и при отпускании кнопки мыши
                // происходит событие click (которое не должно быть)
                if (element.onclick) {
                    var el = $(element);
                    el.mousemove(function(event) {
                        if (element.mouseDown)
                            element.moved = true;
                    });
                    el.mousedown(function(event) {
                        element.mouseDown = true;
                    });
                    el.mouseup(function(event) {
                        element.mouseDown = false;
                    });
                    el.click(function(event) {
                        element.moved = false;
                    });
                }
            }
        },
        
        /**
         * Удаление объекта из svg-холста
         * @method deleteObject
         * @public
         * @param xid {String} Идентификатор элемента
         * @param type {String} Тип элемента
         */
        // ===============================================================
        deleteObject: function(xid, type) {
            // id = id.replace(/\s+|:|\./g, '_');
            var selector;
            if (type && type.toLowerCase() == "title") { // Если подпись
                selector = "#" + this.svgCanvasId + " text[xid='" + xid + "']";
                $(selector).parent().remove();
                selector = "#" + this.svgCanvasId + " path[xid='textPath_" + xid + "']";
                $(selector).remove();
            }else{
                selector = "#" + this.svgCanvasId + " path[xid='" + xid + "']";
                $(selector).parent().remove();
            }
        },
        
        /**
         * Пересчет координат из гео в пиксели
         * @method _geo2pixelOffset
         * @param geo {Object} Географические координаты точки
         * @param zoom {Number} Масштаб для расчета
         * @returns {Object} Cмещение точки относительно начала отображаемого фрагмента карты
         * @private
         */
        // ===============================================================
        _geo2pixelOffset: function(geo, zoom) {
            if (!geo)
                return null;
            var place = this.map.geoToPixel(new GeoPoint(geo.lng, geo.lat, 0., this.map.ProjectionId), zoom);
            return place;
        },
        
        /**
         * Пересчитывает координаты из пикселей в географические координаты
         * @method getCoords
         * @public
         * @param id {String} Идентификатор объекта
         * @returns {Array} Массив координат объекта
         */
        // ===============================================================
        getCoords: function(id) {
            id = id.replace(/\s+|:|\./g, '_');
            // Пример вызова:
            // $(GWTK.maphandlers.map.eventPane).on("svgclick", function(event){
            // var el=event.dataobject.srcElement || event.dataobject.target;
            // GWTK.maphandlers.map.mapTool("FeatureSamples").svgDraws[1].getCoords(el.id);
            // });
            var d = $("#" + id).attr("d");
            var coordinates = [];
            this.scaleCurr = this.map.getZoomScale(this.map.options.tilematrix);
            var lines = d.split("M");
            for (var i = 0; i < lines.length; i++) {
                if (lines[i] == "")
                    continue;
                var points = lines[i].split(" ");
                for (var j = 0; j < points.length; j++) {
                    if (points[j] == "")
                        continue;
                    var coordTL = GWTK.maphandlers.map.tiles.getLayersPointProjected({ "x": 0, "y": 0 }); // прямоугольные координаты точки point
                    var blTL = GWTK.toLatLng(GWTK.projection.xy2geo(GWTK.maphandlers.map.options.crs, coordTL["y"], coordTL["x"]));
                    var pxTL = this._geo2pixelOffset(blTL, this.maxZoom);
                    var coords = points[j].split(",");
                    coords[0] = (this.origin["x"] + parseFloat(coords[0]) - pxTL["x"]) * this.scaleOrigin / this.scaleCurr;
                    coords[1] = (this.origin["y"] + parseFloat(coords[1]) - pxTL["y"]) * this.scaleOrigin / this.scaleCurr;
                    var coord = GWTK.maphandlers.map.tiles.getLayersPointProjected({ "x": coords[0], "y": coords[1] }); // прямоугольные координаты точки point
                    var bl = GWTK.projection.xy2geo(GWTK.maphandlers.map.options.crs, coord["y"], coord["x"]);
                    coordinates.push(bl);
                }
            }
            return coordinates;
        },
        
        /**
         * Обработчик события перемещения курсора мыши
         * @method ondragVectorEvent
         * @private
         * @param svgCanvas {String} Svg-холст
         * @param scaleorigin {Number} Исходный масштаб svg-холста
         * @param dx {Number} Смещение курсора по оси Х
         * @param dy {Number} Смещение курсора по оси Y
         */
        // ===============================================================
        ondragVectorEvent: function(svgCanvas, scaleorigin, dx, dy) {
            var scaleCurr = GWTK.maphandlers.map.getZoomScale(GWTK.maphandlers.map.options.tilematrix) / scaleorigin;
            dx = dx * scaleCurr;
            dy = dy * scaleCurr;
            // var svg = $("#" + svgCanvasId)[0];
            var svg = svgCanvas;
            if (!svg) return;
            var vBox = svg.getAttribute("viewBox");
            var viewBox = vBox.split(" ");
            // viewBox.push(svg.viewBox.baseVal["x"], svg.viewBox.baseVal["y"], svg.viewBox.baseVal["width"], svg.viewBox.baseVal["height"]);
            
            if (isNaN(viewBox[0]))
                viewBox[0] = 0;
            if (isNaN(viewBox[1]))
                viewBox[1] = 0;
            
            viewBox[0] = viewBox[0] - dx;
            viewBox[1] = viewBox[1] - dy;
            
            if (isNaN(viewBox[0]) || isNaN(viewBox[1]))  // Соколова
                return;
            
            svg.setAttributeNS("", "viewBox", viewBox.join(" "));
        },
        
        
        /**
         * Обработчик события масштабирования векторного изображения
         * @method onscaleVectorEvent
         * @private
         * @param scaleorigin {Number} Исходный масштаб svg-холста
         * @param BL {Object} Координаты `LatLng` точки привязки
         * @param viewBox {Array} Размеры окна svg-холста
         */
        // ===============================================================
        onscaleVectorEvent: function(scaleorigin, BL, viewBox) {
            var scaleCurr = this.map.getZoomScale(this.map.options.tilematrix) / scaleorigin; // текущий коэфф. сжатия изображения
            
            // Смасштабировать маркеры
            this.scalingMarkerTemplate(scaleCurr);
            
            // Смасштабировать подпись к объекту
            this.scalingTitleTemplate(scaleCurr);
            
            var viewbox = viewBox.split(" ");
            var place = this.map.geoToPixel(new GeoPoint(BL.lng, BL.lat, 0, this.map.ProjectionId));
            
            // проверить по габаритам
            // var matrix = GWTK.tileView.getTileMatrixSize(this.map);
            // if (this.map.getWindowSize()[0] >= matrix.width) {                  // размер окна больше ширины матрицы
            //     var bbox_geo = this.map.getMapGeoBounds();
            //     var bbox = this.bbox;
            //     if (bbox_geo.SW.lng - bbox[0] > 120) {
            //         place["x"] += matrix.width;
            //     }
            // }
            
            viewbox[0] = place["x"];
            viewbox[1] = place["y"];
            // console.log('BL = ' + BL);
            // console.log('viewbox = ' + viewbox);
            var vb = [-viewbox[0] * scaleCurr, -viewbox[1] * scaleCurr, parseFloat(viewbox[2]) * scaleCurr, parseFloat(viewbox[3]) * scaleCurr].join(' ');
            // console.log('vb = ' + vb);
            
            this.svgCanvas.setAttribute('viewBox', vb);
            
            // if (GWTK.Util.ie_Version() !== -1) {
            //     this.$svgCanvas.find('g').each(function() {
            //         var $svgElements = $($(this).find('[vector-effect]'));
            //         for (var i = 0; i < $svgElements.length; i++) {
            //             var svgElement = $svgElements[i];
            //             var ve = svgElement.getAttribute("vector-effect");
            //             var k = null;
            //             if (ve === "non-scaling-stroke") {
            //                 var sw = svgElement.getAttribute('strokewidthorigin') || 3;
            //                 k = scaleCurr * sw;
            //                 svgElement.setAttributeNS("", 'stroke-width', k + 'px');
            //                 var sd = svgElement.getAttribute('strokedasharrayorigin');
            //                 if (sd) {
            //                     sd = sd.split(",");
            //                     for (var j = 0; j < sd.length; j++) {
            //                         sd[j] *= scaleCurr;
            //                     }
            //                     sd = sd.join(",");
            //                     svgElement.setAttributeNS("", 'stroke-dasharray', sd);
            //                 }
            //             }
            //         }
            //     });
            // }
            //Данные строчки необходимы для правильного отображения выделенных объектов в SVG
            //При небольшом сдвиге карты без этих строк объекты "плавали" относитльно объектов карты
            this.$svgCanvas.width(this.$svgCanvas.width() - 1);
            this.$svgCanvas.width(this.$svgCanvas.width() + 1);
        },
        
        /**
         * Обработчик события overlayRefresh
         * @method overlayPaneEvent
         * @private
         */
        // ===============================================================
        overlayPaneEvent: function(e) {
            
            if (!this.svgCanvas) {
                if (this.drawpanel) {
                    this.drawpanel.style.left = '0px';                        // 16/05/17
                    this.drawpanel.style.top = '0px';
                }
                return false;
            }
            
            if (!this.svgCanvas.getAttribute("bl"))  // Соколова
                return false;
            
            var wh = this.map.getWindowSize();
            this.svgCanvas.style.width = wh[0] + "px";
            this.svgCanvas.style.height = wh[1] + "px";
            this.svgCanvas.setAttributeNS("", "width", wh[0]);
            this.svgCanvas.setAttributeNS("", "height", wh[1]);
            this.svgCanvas.setAttributeNS("", "viewboxorigin", "0 0 " + wh[0] + " " + wh[1]);
            var BL = GWTK.toLatLng([(this.bbox[3] + this.bbox[1]) / 2,
                (this.bbox[2] + this.bbox[0]) / 2]);
            
            this.onscaleVectorEvent(parseFloat(this.svgCanvas.getAttribute("scaleorigin")), BL, this.svgCanvas.getAttribute("viewboxorigin"));
            
            var divElement = $(this.svgCanvas.parentNode);
            // var tilePane = $( '#tilePane' );
            var tilePane = $(this.map.tilePane);
            var left = tilePane.css('left');
            left = parseFloat(left) - parseInt(left);
            var top = tilePane.css('top');
            top = parseFloat(top) - parseInt(top);
            divElement.css("left", left + "px");
            divElement.css("top", top + "px");
        },
        
        /**
         * Обработчик событий eventPane
         * @method eventPaneEvent
         * @private
         * @param event {Event} Событие
         */
        // ===============================================================
        eventPaneEvent: function(event) {
            var dx = event.offset.dx;
            var dy = event.offset.dy;
            for (var i = 0, svgElements = $("svg:not(.clone-svg):not(marker svg)"); i < svgElements.length; i++) {
                var svgElement = svgElements[i];
                GWTK.svgDrawing.prototype.ondragVectorEvent(svgElement, svgElement.getAttribute("scaleorigin"), dx, dy);
                var divElement = $(svgElement).parent();
                divElement.css("left", "0px");
                divElement.css("top", "0px");
            }
        },
        /**
         * Обработчик событий eventPaneMapdrag
         * @method eventPaneMapdrag
         * @private
         * @param event {Event} Событие
         */
        // ===============================================================
        eventPaneMapdrag: function(event) {
            
            if (!this.drawpanel || !event.offset) {
                return false;
            }
            
            // var left = parseInt( this.svgCanvas.parentNode.style.left ) || 0;
            // var top = parseInt( this.svgCanvas.parentNode.style.top ) || 0;
            // this.svgCanvas.parentNode.style.left = left + event.offset.dx + "px";
            // this.svgCanvas.parentNode.style.top = top + event.offset.dy + "px";
            
            var left = this.drawpanel.offsetLeft || 0;
            var top = this.drawpanel.offsetTop || 0;
            
            var coord = this.map.tiles._testShift(event.offset.dx, event.offset.dy),
                dx = coord[0],
                dy = coord[1];
            
            this.drawpanel.style.left = left + dx + "px";
            this.drawpanel.style.top = top + dy + "px";
            
        },
        
        /**
         * Добавление шаблонов маркеров в SVG
         * @method addMarkerTemplate
         * @public
         * @param options {Object} Параметры шаблона
         */
        // ===============================================================
        addMarkerTemplate: function(options) {
            
            var markerOptions = options["marker"];
            var SIZE_X = parseFloat(markerOptions["width"]) || 32;
            var SIZE_Y = parseFloat(markerOptions["height"]) || 32;
            var id = markerOptions["markerId"];
            var defs = $(this.svgCanvas).find("defs");
            if (defs.length === 0) {
                defs = document.createElementNS(this.svgNS, "defs");
                $(this.svgCanvas).append(defs);
            }
            //if ($(defs).find("#marker_" + id).length > 0)
            if ($(defs).find("#" + this.prefixMarker + id).length > 0)
                return;
            
            var scaleCurr = this.map.getZoomScale(this.map.options.tilematrix) / parseFloat($(this.svgCanvas)[0].getAttribute("scaleorigin"));
            
            defs = $(defs);
            var mW = SIZE_X * scaleCurr;
            var mH = SIZE_Y * scaleCurr;
            
            var width = SIZE_X * 2;
            var height = SIZE_Y * 2;
            // var refX = SIZE_X / 2 + "";
            // var refY = SIZE_Y / 2 + "";
            var refX = parseFloat(markerOptions["refX"]) || SIZE_X / 2 + "";
            var refY = parseFloat(markerOptions["refY"]) || SIZE_Y / 2 + "";
            
            var marker = document.createElementNS(this.svgNS, "marker");
            marker.setAttributeNS("", 'viewBox', "0 0" + " " + width + " " + height);
            marker.setAttributeNS("", 'refX', refX);
            marker.setAttributeNS("", 'refY', refY);
            marker.setAttributeNS("", 'markerUnits', "userSpaceOnUse");
            marker.setAttributeNS("", 'markerWidth', "" + mW);
            marker.setAttributeNS("", 'markerHeight', "" + mH);
            marker.setAttributeNS("", 'markerInitWidth', "" + SIZE_X);
            marker.setAttributeNS("", 'markerInitHeight', "" + SIZE_Y);
            //marker.setAttributeNS("", 'id', "marker_" + id);
            marker.setAttributeNS("", 'id', this.prefixMarker + id);
            
            var path = document.createElementNS(this.svgNS, "path");
            path.setAttributeNS("", 'stroke', options["stroke"]);
            path.setAttributeNS("", 'stroke-width', options["stroke-width"]);
            path.setAttributeNS("", 'stroke-dasharray', options["stroke-dasharray"]);
            path.setAttributeNS("", 'stroke-opacity', options["stroke-opacity"]);
            path.setAttributeNS("", 'fill', options["fill"]);
            path.setAttributeNS("", 'fill-opacity', options["fill-opacity"]);
            path.setAttributeNS("", 'pointer-events', "none");
            path.setAttributeNS("", 'd', markerOptions["path"]);
            if (path.getTotalLength() === 0)
                throw ("-2");
            marker.appendChild(path);
            defs.append(marker);
            
        },
        /**
         * Добавление изображений шаблонов маркеров в SVG
         * @method addMarkerSvgTemplate
         * @public
         * @param options {Object} Параметры шаблона
         */
        // ===============================================================
        addMarkerSvgTemplate: function(options) {
            var markerOptions = options["marker"];
            var SIZE_X = parseFloat(markerOptions["width"]) || 32;
            var SIZE_Y = parseFloat(markerOptions["height"]) || 32;
            var id = markerOptions["markerId"];
            var defs = $(this.svgCanvas).find("defs");
            if (defs.length === 0) {
                defs = document.createElementNS(this.svgNS, "defs");
                $(this.svgCanvas).append(defs);
            }
            if ($(defs).find("#" + this.prefixMarker + id).length > 0)
                return;
            var scaleCurr = this.map.getZoomScale(this.map.options.tilematrix) / parseFloat($(this.svgCanvas)[0].getAttribute("scaleorigin"));
            defs = $(defs);
            var mW = SIZE_X * scaleCurr;
            var mH = SIZE_Y * scaleCurr;
            var marker = document.createElementNS(this.svgNS, "marker");
            marker.setAttributeNS("", 'markerUnits', "userSpaceOnUse");
            marker.setAttributeNS("", 'markerWidth', "" + mW);
            marker.setAttributeNS("", 'markerHeight', "" + mH);
            marker.setAttributeNS("", 'markerInitWidth', "" + SIZE_X);
            marker.setAttributeNS("", 'markerInitHeight', "" + SIZE_Y);
            marker.setAttributeNS("", 'id', this.prefixMarker + id);
            var svgImage = $(markerOptions["image"]);
            var refX = markerOptions["centerX"] || "0";
            var refY = markerOptions["centerY"] || "0";
            var vBox = ["0", "0", SIZE_X * 2, SIZE_Y * 2];
            var width = null;
            var height = null;
            for (var i = 0; i < svgImage.length; i++) {
                var el = $(svgImage[i]);
                var w = el.attr("width");
                if (w)
                    width = parseFloat(w);
                var h = el.attr("height");
                if (h)
                    height = parseFloat(h);
                if (!w || !h) {
                    var viewBox = [];
                    var vbStr = el.attr("viewBox");
                    if (vbStr)
                        viewBox = vbStr.split(" ");
                    if (viewBox.length !== 4) {
                        el = svgImage[i];
                        if (el.viewBox) {
                            var vbBase = el.viewBox.baseVal;
                            viewBox = [vbBase.x, vbBase.y, vbBase.width, vbBase.height];
                        }
                    }
                    if (viewBox.length === 4) {
                        if (!w) {
                            width = parseFloat(viewBox[2])
                        }
                        if (!h) {
                            height = parseFloat(viewBox[3]);
                        }
                    }
                }
            }
            if (width) {
                vBox[2] = width;
            }
            if (height) {
                vBox[3] = height;
            }
            markerOptions['rectWidth'] = mW;
            markerOptions['rectHeight'] = mH;
            markerOptions['rectX'] = refX / vBox[2];
            markerOptions['rectY'] = refY / vBox[3];
            marker.setAttributeNS("", 'viewBox', vBox.join(" "));
            marker.setAttributeNS("", 'refX', refX);
            marker.setAttributeNS("", 'refY', refY);
            $(marker).append(svgImage);
            defs.append(marker);
        },
        
        /**
         * Изменение масштаба маркера точечного объекта
         * @method scalingMarkerTemplate
         * @private
         * @param scaleCurr {Number} Текущий масштаб
         */
        // ===============================================================
        scalingMarkerTemplate: function(scaleCurr) {
            for (var i = 0, markers = this.drawpanel.querySelectorAll("defs marker:not(.clone-svg)")/*$( "defs marker:not(.clone-svg)" )*/; i < markers.length; i++) {
                
                var mW = parseFloat(markers[i].getAttribute('markerInitWidth'));
                var mH = parseFloat(markers[i].getAttribute('markerInitHeight'));
                mW = mW * scaleCurr;
                mH = mH * scaleCurr;
                
                markers[i].setAttribute('markerWidth', "" + mW);
                markers[i].setAttribute('markerHeight', "" + mH);
                
                var id = markers[i].getAttribute('id');
                var rects = $("rect[mId=" + id + "]");
                for (var j = 0; j < rects.length; j++) {
                    var rect = rects[j];
                    var pointX = rect.getAttribute('pointX');
                    var pointY = rect.getAttribute('pointY');
                    var rectX = rect.getAttribute('rectX');
                    var rectY = rect.getAttribute('rectY');
                    rect.setAttributeNS("", 'x', pointX - rectX * mW + "");
                    rect.setAttributeNS("", 'y', pointY - rectY * mH + "");
                    rect.setAttributeNS("", 'width', mW + "");
                    rect.setAttributeNS("", 'height', mH + "");
                }
            }
        },
        
        /**
         * Создание элементов текстовой надписи для svg-холста
         * @method addText
         * @public
         * @param options {Object} Параметры надписи
         * @param id {String} Идентификатор объекта
         * @param points {String} Строка координат для svg-элемента
         * @param xid {String} Дополнительный идентификатор объекта
         * @returns {Element} Текстовый элемент для svg-холста
         */
        // ===============================================================
        // addText: function (options, id, points, xid) {
        //
        //     id = id.replace(/\s+|:|\./g, '_');
        //
        //     var path = document.createElementNS(this.svgNS, "path");
        //     path.setAttributeNS("", 'stroke', "blue");
        //     path.setAttributeNS("", 'd', points);
        //     path.setAttributeNS("", "id", "textPath_" + id);
        //     path.setAttributeNS("", "xid", "textPath_" + xid);
        //
        //     var defs = $(this.svgCanvas).find("defs");
        //     if (defs.length == 0) {
        //         defs = document.createElementNS(this.svgNS, "defs");
        //         $(this.svgCanvas).append(defs);
        //     }
        //
        //     var $def_textPath = ($(defs).find("#textPath_" + id));
        //     if ($def_textPath.length > 0) {
        //         $def_textPath.remove();
        //         //return null;
        //     }
        //
        //     $(defs).append(path);
        //
        //     var text = document.createElementNS(this.svgNS, "text");
        //     text.setAttributeNS("", 'font-family', options['font-family']);
        //     text.setAttributeNS("", 'font-size', options['font-size']);
        //     text.setAttributeNS("", 'class', "vector-polyline");
        //     text.setAttributeNS("", "id", id);
        //     text.setAttributeNS("", "name", name);
        //     text.setAttributeNS("", "xid", xid);
        //
        //     text.setAttributeNS("", 'fill', options['fill'] || "blue");
        //     text.setAttributeNS("", 'letter-spacing', options['letter-spacing']);
        //
        //     var textPath = document.createElementNS(this.svgNS, "textPath");
        //     textPath.setAttributeNS("http://www.w3.org/1999/xlink", 'href', "#textPath_" + id);
        //     textPath.setAttributeNS("", 'startOffset', options['startOffset']);
        //
        //     $(textPath).prop('textContent', options['text']);
        //
        //     text.appendChild(textPath);
        //
        //     var $text = $(this.svgCanvas).find("text#" + id);
        //     if ($text.length > 0) {
        //         $text.remove();
        //         //return null;
        //     }
        //
        //     return text;
        // },
        
        addText: function(options, id, points, xid) {
            
            id = id.replace(/\s+|:|\./g, '_');
            
            if (!options || !points) {
                return;
            }
            
            var text = document.createElementNS(this.svgNS, "text");
            if (options['font-family']) {
                text.setAttributeNS("", 'font-family', options['font-family']);
            }
            if (options['font-size']) {
                text.setAttributeNS("", 'font-size', options['font-size']);
            }
            if (options['letter-spacing']) {
                text.setAttributeNS("", 'letter-spacing', options['letter-spacing']);
            }
            if (options['text-decoration']) {
                text.setAttributeNS("", 'text-decoration', options['text-decoration']);
            }
            if (options['font-style']) {
                text.setAttributeNS("", 'font-style', options['font-style']);
            }
            if (options['font-weight']) {
                text.setAttributeNS("", 'font-weight', options['font-weight']);
            }
            if (options['font-stretch']) {
                text.setAttributeNS("", 'font-stretch', options['font-stretch']);
            }
            text.setAttributeNS("", 'fill', options['fill'] || "blue");
            
            text.setAttributeNS("", 'class', "vector-polyline");
            text.setAttributeNS("", "id", id);
            text.setAttributeNS("", "name", name);
            text.setAttributeNS("", "xid", xid);
            
            if (!options['writing-mode']) {
                
                var path = document.createElementNS(this.svgNS, "path");
                path.setAttributeNS("", 'stroke', "blue");
                path.setAttributeNS("", 'd', points);
                path.setAttributeNS("", "id", "textPath_" + id);
                path.setAttributeNS("", "xid", "textPath_" + xid);
                
                var defs = $(this.svgCanvas).find("defs");
                if (defs.length == 0) {
                    defs = document.createElementNS(this.svgNS, "defs");
                    $(this.svgCanvas).append(defs);
                }
                
                var $def_textPath = ($(defs).find("#textPath_" + id));
                if ($def_textPath.length > 0) {
                    $def_textPath.remove();
                    //return null;
                }
                
                $(defs).append(path);
                
                
                var textPath = document.createElementNS(this.svgNS, "textPath");
                textPath.setAttributeNS("http://www.w3.org/1999/xlink", 'href', "#textPath_" + id);
                if (options['startOffset']) {
                    textPath.setAttributeNS("", 'startOffset', options['startOffset']);
                }
                
                $(textPath).prop('textContent', options['text']);
                
                text.appendChild(textPath);
                
            }else{
                var x, y, mass = points.split(' ');
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
            
            var $text = $(this.svgCanvas).find("text#" + id);
            if ($text.length > 0) {
                $text.remove();
                //return null;
            }
            
            return text;
        },
        
        /**
         * Добавление всех подписей к элементу
         * @method addTitles
         * @public
         * @param path {Element} Путь для определения координат первой точки для вывода подписи
         * @param options {Array или Object} Параметры описанния подписи properties["text"] = {
         * "text": [                             // массив описаний подписей
         *           {
         *               "key" : "SUBST_TYPE",   // ключ семантики (ключ описания подписи из объекта классификатора, нарпример "titles": {"SUBST_TYPE":{})...
         *               "text": ["БЕТОН"],      // массив строк для вывода подписи (несколько элементов массива подразумевают вывод многострочной подписи)
         *               "style" : {}            // стиль подписи (необязательный параметр: при отсутствии стиль берется из классификатора, при отсутствии в классификаторе берется из значений по умолчанию)
         *           },
         *           {
         *               "key" : "MAX_NUMB",
         *               "text": ["100"]
         *           },
         *           {
         *               "key" : "MAX_CONTENT",
         *               "text": ["300"]
         *           }
         *        ]
         * }
         * @param g {Element} Родительский элемент
         */
        // ===============================================================
        addTitles: function(id, path, options, g) {
            
            var title, newid = id,
                scale = this.map.getZoomScale(this.map.options.tilematrix) / parseFloat(this.svgCanvas.getAttribute("scaleorigin"));
            
            if (options instanceof Array) {
                for (var i = 0; i < options.length; i++) {
                    newid = id + i.toString();
                    //g1 = this._addTGroup(options[i], scale);
                    title = this._addTitle(newid, path, options[i], scale);
                    if (title) {
                        //g1.appendChild(title);
                        g.appendChild(title);
                    }
                }
            }else{
                if (typeof options === 'object') {
                    //g1 = this._addTGroup(options, scale);
                    title = this._addTitle(id, path, options, scale);
                    if (title) {
                        g.appendChild(title);
                    }
                }
            }
        },
        
        /**
         * Добавление одной подписи к элементу
         * @method _addTitle
         * @private
         * @param path {Element} Путь для определения координат первой точки для вывода подписи
         * @param options {Object} Параметры подписи
         * @param scaleCurr {Float} масштабный коэффициент
         */
        // ===============================================================
        _addTitle: function(id, path, options, scaleCurr) {
            id = "title_" + id.replace(/\s+|:|\./g, '_');
            
            if ($('#' + id).length > 0)
                return;
            var k = 0, basedx, basedy;
            
            if (path && options) {
                // Определим координаты
                var x, y,
                    dx = (options.style && options.style.dx) ? options.style.dx : 0,
                    dy = (options.style && options.style.dy) ? options.style.dy : 0,
                    mass = path.split(',');
                if (mass && mass.length == 2) {
                    mass[0] = mass[0].replace('M', '');
                    x = mass[0];
                    y = mass[1];
                }
                if (x && y) {
                    var text = document.createElementNS(this.svgNS, "text");
                    
                    // Добавить стили текста
                    var istextstyle = (options.style && typeof options.style === "object");
                    for (var key in this.options) {
                        if (key == 'marker' || key == 'stroke' || key == 'stroke-width' || key == "stroke-opacity" || key == "stroke-dasharray"
                            || key == "letter-spacing" || key == "background-size"
                            || key == "objName" || key == "typeField" || key == "startOffset")
                            continue;
                        text.setAttributeNS("", key, (istextstyle && options.style[key]) ? options.style[key] : this.options[key]);
                    }
                    
                    // Добавимк стилям оставшиеся параметры, если они есть
                    if (istextstyle) {
                        for (var key in options.style) {
                            text.setAttributeNS("", key, options.style[key]);
                        }
                    }
                    
                    // Идентификатор и позиционирование
                    text.setAttributeNS("", 'id', id);
                    text.setAttributeNS("", 'x', x);
                    text.setAttributeNS("", 'y', y);
                    
                    // Отображение при текущем масштабе
                    text.setAttributeNS("", "basescale", text.getAttribute('font-size'));
                    const basescale = parseFloat(text.getAttribute('basescale'));
                    text.setAttributeNS("", "font-size", "" + basescale * scaleCurr);
                    
                    text.setAttributeNS(null, 'basedx', dx);
                    text.setAttributeNS(null, 'basedy', dy);
                    basedx = parseFloat(text.getAttribute('basedx'));
                    basedy = parseFloat(text.getAttribute('basedy'));
                    
                    // События
                    text.style["pointer-events"] = "none";
                    text.setAttributeNS("", "class", "vector-polyline");
                    
                    if (typeof options === 'string' && options !== '') { // Если объект строка
                        this._addTSpan(text, { x: x, y: y, dx: '0', dy: k.toString() + 'em', text: options });
                    }else{
                        if (typeof options === 'object' && options.text && options.text instanceof Array) {
                            var indexdy = 0;
                            for (var i = 0; i < options.text.length; i++) {
                                indexdy = this._addTSpan(text, {
                                    x: x,
                                    y: y,
                                    dx: (parseInt(basedx / basescale)).toString() + 'em',
                                    dy: ((basedy / basescale) + k).toString() + 'em',
                                    text: options.text[i]
                                });
                                k++;
                                if (indexdy) {
                                    k += indexdy;
                                }
                            }
                        }
                    }
                    
                    // Масшьабирование вынесено, поскольку работает только после отрисовки на канве
                    //trdx = basedx * scaleCurr;
                    //trdy = basedx * scaleCurr;
                    //text.setAttributeNS(null, 'transform', "translate(" + trdx + ", " + trdy + ")");
                    
                    return text;
                }
            }
        },
        
        
        /**
         * Создание и добавление части текстовой надписи к тексту
         * @method _addTSpan
         * @private
         * @param parent {Element} Родительский элемент: текст
         * @param options {Object} Параметры надписи
         */
        // ===============================================================
        _addTSpan: function(parent, options) {
            var indexdy = 0;
            if (!parent && !options)
                return indexdy;
            var textSpan = document.createElementNS(this.svgNS, "tspan");
            if (options.x)
                textSpan.setAttributeNS("", 'x', options.x);
            if (options.y)
                textSpan.setAttributeNS("", 'y', options.y);
            if (options.dx)
                textSpan.setAttributeNS("", 'dx', options.dx);
            if (options.dy) {
                textSpan.setAttributeNS("", 'dy', options.dy);
            }
            if (options.text) {
                if (options["text"].indexOf('___') >= 0 && options.dy) {
                    var mass = options.dy.split('em');
                    if (mass && mass.length > 0) {
                        textSpan.setAttributeNS("", 'dy', (mass[0] - 1).toString() + 'em');
                        indexdy = -1;
                    }
                }
                textSpan.innerHTML = options["text"];
            }
            parent.appendChild(textSpan);
            return indexdy;
        },
        
        
        /**
         * Масшвбирование подписи объекта
         * @method scalingTitleTemplate
         * @private
         * @param scaleCurr {Number} Текущий масштаб
         */
        // ===============================================================
        scalingTitleTemplate: function(scaleCurr) {
            if (scaleCurr) {
                var texts, basedx, basedy;
                for (var i = 0, texts = $(this.drawpanel).find("text:not(.clone-svg)"); i < texts.length; i++) {
                    var basescale = parseFloat(texts[i].getAttribute('basescale'));
                    if (basescale) {
                        texts[i].setAttribute('font-size', "" + basescale * scaleCurr);
                        //пересчитать трансформацию
                        basedx = texts[i].getAttribute('basedx');
                        basedy = texts[i].getAttribute('basedy');
                        if (basedx && basedy) {
                            texts[i].setAttributeNS(null, 'transform', "translate(" + scaleCurr * basedx + "," + scaleCurr * basedy + ")");
                        }
                    }
                }
            }
        },
        
        /**
         * Установить прозрачность
         * @param value
         */
        setOpacity: function(value) {
            if (this.$svgCanvas) {
                this.$svgCanvas.css('opacity', value);
            }
        },
        
        /**
         * Настроить svg-холст
         * @method setupSVG
         */
        setupSVG() {
            // масштабирование и переход на нужную точку (т.к. рисование
            // производилось при максимальном)
            this.scaleCurr = this.map.getZoomScale(this.map.options.tilematrix)
                / this.scaleOrigin; // текущий коэфф. сжатия изображения
            var viewbox = this.viewBox.split(" ");
            var place = this.map.geoToPixel(new GeoPoint(this.BL.lng, this.BL.lat, 0, this.map.ProjectionId));
            // проверить по габаритам
            // var matrix = GWTK.tileView.getTileMatrixSize(this.map);
            // if (this.map.getWindowSize()[0] >= matrix.width) {                  // размер окна больше ширины матрицы
            //     var bbox_geo = this.map.getMapGeoBounds();
            //     var bbox = this.bbox;
            //     if (bbox_geo.SW.lng - bbox[0] > 120) {
            //         place["x"] += matrix.width;
            //     }
            // }
            
            viewbox[0] = place["x"];
            viewbox[1] = place["y"];
            // console.log('BL_init = ' + this.BL);
            // console.log('viewbox_init = ' + viewbox);
            var vb = [-viewbox[0] * this.scaleCurr,
                -viewbox[1] * this.scaleCurr,
                parseFloat(viewbox[2]) * this.scaleCurr,
                parseFloat(viewbox[3]) * this.scaleCurr].join(' ');
            
            // console.log('vb_init = ' + vb);
            
            
            this.svgCanvas.setAttributeNS("", "viewBox", vb);
        },
        
        /**
         * Очищает svg-холст
         * @method clearSVG
         */
        clearSVG: function() {
            const groups = this.svgCanvas.querySelectorAll('g');
            for (let i = 0; i < groups.length; i++) {
                const innerGroups = groups[i].querySelectorAll('g');
                for (let j = 0; j < innerGroups.length; j++) {
                    groups[i].removeChild(innerGroups[j]);
                }
            }
        }
        
    };
}
