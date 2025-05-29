/**************************************** Нефедьева О.  14/11/19 ****
 **************************************** Тазин В.О.    27/07/20 ****
 **************************************** Патейчук В.К. 09/07/20 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент "Тематические слои"                  *
 *                 (отображение тематических слоев)                 *
 *                                                                  *
 *******************************************************************/

"use strict";

if (window.GWTK) {
    /**
     * Компонент Отображение тематических слоев
     * @class GWTK.mapthematic
     * @constructor GWTK.mapthematic
     */
    GWTK.MapThematic = function (map) {
        this.toolname = "thematicmap";
        this.map = map;
        if (!this.map) {
            console.log("GWTK.MapThematic. " + w2utils.lang("Not defined a required parameter") + " Map.");
            this.error = true;
            return;
        }

        // фильтр на объекты, которые попадут в обработку
        this.filter = {};

        // кэш загруженных данных
        this.cache = {};

        this.error = false;
        //Текст по умолчанию
        this.defText = "<span>" + w2utils.lang("Place your cursor on the object") + "</span>";
        this.xId = this.createGUID();
        //Идентификатор панели для холста
        this.id = "canvasPane";
        //Идентификатор панели интерфейса
        this.tematicPane = "tematicPane";

        this.svgDraws = [];
        this.activeThemeIdList = {
            fill: undefined,
            hatching: undefined
        };

        $(this.map.eventPane).on('mapcontentloaded.thematicmap', this.init.bind(this));

        this.layerCommandHandler = this.layerCommandHandler.bind(this);
        this.updatePatternScale = this.updatePatternScale.bind(this);
        this.initEvents();

        if (this.map.options["sectionsURL"] == null || this.map.options["sectionsFname"] == null ||
            this.map.options["sectionsURL"].length === 0 || this.map.options["sectionsFname"].length === 0) {
            this.error = true;
            console.log("GWTK.MapThematic. " + w2utils.lang("Not defined a required parameter") + "  sectionsURL or sectionsFname.");
        }

        this.map.maptools.push(this);
    };

    GWTK.MapThematic.prototype = {

        /**
         * Инициализация
         * @method init
         */
        init: function () {
            if (this.error) return;
            var tool = this.map.mapTool('mapcontent');
            if (tool) {

                //PHP скрипт для выдачи JSON
                this.surl = this.map.options["sectionsURL"];
                this.sname = this.map.options["sectionsFname"];
                this.svgItem = {
                    itemid: 'mapthematic',
                    alias: w2utils.lang("Thematic layers"),
                    group: true,
                    expanded: true,
                    nodes: [],
                    type: "main"
                };
                this.addThemes(null, this.svgItem);

                w2utils.lock(this.map.mapPane, w2utils.lang("Loading..."), true);
                $(".w2ui-lock").css("pointer-events", "all");
                // включить спиннер
                GWTK.Util.showWait();

                //Загружаем разделы
                this.initSections();
                for (var k in this.sections) {
                    this.sections[k].id = "mapthematic_" + this.sections[k].id;
                    var item = {
                        itemid: this.sections[k].id,
                        alias: this.sections[k].name,
                        group: false,
                        expanded: true,
                        clickable: true,
                        nodes: [],
                        type: "section"
                    };
                    this.addThemes(this.svgItem.itemid, item);
                }
                w2utils.unlock(this.map.mapPane);
                GWTK.Util.hideWait();
            }
        },

        /**
         * Инициализация панелей
         * @method initPanes
         */
        initPanes: function () {
            var tPane = $("#" + this.tematicPane);
            tPane.remove();
            //Добавление информационной панели
            $(this.map.mapPane).append(
                '<div id="' + this.tematicPane + '" class="tematic-panel map-panel-def ui-draggable ui-draggable-handle" style="display: none;">'
                + '<div class="tematic-panel-header">' + w2utils.lang('Thematic layer information') + '</div>' + '<div id="'
                + this.tematicPane + '_text">' + this.defText + '</div>' + '</div>');
            // Сделать панель перемещаемой
            GWTK.panelUI({draggable: true, $element: tPane, resizable: false});
        },

        /**
         * Назначение обработчиков событий
         * @method initEvents
         */
        initEvents: function () {
            $(this.map.eventPane).on('layercommand.thematicmap', this.layerCommandHandler);

            $(this.map.eventPane).on("svgmouseover.thematicmap", function (event) {
                event = event.dataobject || window.event.dataobject;
                this.mouseoverAction(event);
            }.bind(this));
            $(this.map.eventPane).on("svgmouseleave.thematicmap", function (event) {
                event = event.dataobject || window.event.dataobject;
                this.mouseleaveAction(event);
            }.bind(this));

        },

        /**
         * Обработчик выбора тем и разделов
         * @method layerCommandHandler
         * @param event {object} Событие
         */
        layerCommandHandler: function (event) {
            if (!event || !event.maplayer || !event.maplayer.act || !event.maplayer.id || !event.maplayer.subtype)
                return;
            if (event.maplayer.subtype !== this.xId)
                return;

            var that = this;

            if (event.maplayer.act === 'toggleSection') { // ВЫБОР РАЗДЕЛА
                // включить спиннер
                GWTK.Util.showWait();
                // запустить обработчик выбора раздела через 1 сек (иначе спиннер не виден)
                setTimeout(function () {
                    that.sectionSelected(event);
                }, 1000);
            } else if (event.maplayer.act === 'toggleTheme') { // ВЫБОР ТЕМЫ
                // включить спиннер
                GWTK.Util.showWait();
                // запустить обработчик выбора темы через 1 сек (иначе спиннер не виден)
                setTimeout(function () {
                    that.themeChecked(event);
                }, 1000);
            }
        },

        /**
         * Загрузка файла с разделами
         * @method initSections
         */
        initSections: function () {
            if (!this.surl || !this.sname)
                return;

            var sections = "";
            $.ajax({
                url: this.surl,
                crossDomain: true,
                async: false,
                type: "POST",
                data: {
                    "request": "Sections",
                    "name": "",
                    "path": "\\" + this.sname
                },
                dataType: "json",
                success: function (data) {
                    sections = data;
                }
            });
            this.sections = sections;

            // список для поля формы
            var typeList = [];
            for (var key in this.sections) {
                typeList.push({
                    "id": this.sections[key]["id"],
                    "text": this.sections[key]["name"]
                });
            }
            this.sectionsField = {};
            this.sectionsField['field'] = 'section';
            this.sectionsField['type'] = 'list';
            this.sectionsField.options = {
                items: typeList,
                openOnFocus: true,
                markSearch: false,
                maxWidth: 100,
                align: 'none',
                required: true
            };
        },

        /**
         * Загрузка списка тем для данного раздела
         * @method initThemes
         * @param section {String} Идентификатор раздела
         */
        initThemes: function (section) {
            var num = null;
            for (key in this.sections) {
                if (section === this.sections[key].id) {
                    num = key;
                    break;
                }
            }
            if (num == null)
                return;

            w2utils.lock(this.map.mapPane, w2utils.lang("Loading..."), true);
            $(".w2ui-lock").css("pointer-events", "all");

            // отправляем запросы на сервер
            this.settings = null;
            this.GeoJSON = null;
            var tool = this;

            // получить geoJSON
            var filename = this.sections[key]["files"]["geojson"]["fname"];
            var filenameJson = filename;
            var GeoJSON = this.getFromCache(filename);
            if (GeoJSON == null) {
                // получить с сервера
                $.ajax({
                    url: this.sections[key]["files"]["geojson"]["url"],
                    crossDomain: true,
                    async: false,
                    type: "POST",
                    data: {
                        "request": "geoJSON",
                        "name": "",
                        "path": "\\" + filename
                    },
                    dataType: "json",
                    success: function (data) {
                        GeoJSON = tool.checkBbox(data);

                        tool.cache[filename] = GeoJSON; // записать в кэш
                        tool.cache[filename + '_full'] = JSON.parse(JSON.stringify(GeoJSON));  // полный GeoJSON
                    }
                });
            }

            // получить настройки
            filename = this.sections[key]["files"]["settings"]["fname"];
            var settings = this.getFromCache(filename);
            if (settings == null) {
                // получить с сервера
                $.ajax({
                    url: this.sections[key]["files"]["settings"]["url"],
                    crossDomain: true,
                    async: false,
                    type: "POST",
                    data: {
                        "request": "colors",
                        "name": "",
                        "path": "\\" + filename
                    },
                    dataType: "json",
                    success: function (data) {
                        settings = data;
                        tool.cache[filename] = data; // записать в кэш
                    }
                });
            }

            // получить таблицу с записями
            if (this.sections[key]["files"]["fields"] !== "") {
                filename = this.sections[key]["files"]["fields"]["fname"];
                var baseJSON = this.getFromCache(filename);
                if (baseJSON == null) {
                    // получить с сервера
                    $.ajax({
                        url: this.sections[key]["files"]["fields"]["url"],
                        async: false,
                        type: "POST",
                        data: {
                            "request": "base",
                            "name": "",
                            "path": "\\" + filename
                        },
                        dataType: "json",
                        success: function (data) {
                            baseJSON = data;
                            tool.cache[filename] = data; // записать в кэш
                        }
                    });
                }
            }

            w2utils.unlock(this.map.mapPane);

            // все данные получены
            this.settings = settings;

            this.GeoJSON = GeoJSON;
            this.GeoJSON_Full = this.getFromCache(filenameJson + '_full');
            //JSON.parse(JSON.stringify(GeoJSON)); // полный GeoJSON (пришедший с сервера)
            this.baseJSON = baseJSON;

            // заполнение списка в форме
            var typeList = [];
            for (var key in this.settings) {
                var expanded = ((this.settings[key]["expanded"] == null) || (this.settings[key]["expanded"] == "true")) ? true : false;
                typeList.push({
                    "id": this.settings[key]["type"],
                    "text": this.settings[key]["name"],
                    "expanded": expanded
                });
            }
            for (var k in typeList) {
                var item = {
                    itemid: typeList[k].id,
                    alias: typeList[k].text,
                    group: false,
                    expanded: typeList[k].expanded,
                    clickable: true,
                    type: "theme"
                };
                this.addThemes(section, item);
            }

            // установить фильтр на объекты из параметров, если указан
            if (this.settings[key]["filter"]) {
                this.filter = this.settings[key]["filter"];
            }

            GWTK.Util.hideWait();
        },


        /**
         * Проверка bbox полей JSON объектов
         * @method checkBbox
         * @param json {Object} Объекты в формате GeoJSON
         * @return {Object|null} GeoJSON с bbox | `null` при ошибке в составе входных данных
         */
        checkBbox: function (json) {
            if (!json)
                return null;
            if (!json['bbox']) {
                json['bbox'] = [];
            }
            for (var i = 0; i < json["features"].length; i++) {
                var item = json["features"][i];
                if (!item["bbox"] || item["bbox"].length < 4) {
                    var bbox = [];
                    item["bbox"] = this.coordsArray(item["geometry"]["coordinates"], bbox);
                }

                if (json["bbox"].length === 0) {
                    json["bbox"] = item["bbox"].slice();
                } else {
                    json["bbox"][0] = Math.min(json["bbox"][0], item["bbox"][0]);
                    json["bbox"][1] = Math.min(json["bbox"][1], item["bbox"][1]);
                    json["bbox"][2] = Math.max(json["bbox"][2], item["bbox"][2]);
                    json["bbox"][3] = Math.max(json["bbox"][3], item["bbox"][3]);
                }
            }
            return json;
        },
        /**
         * Вычисление границ объекта из массива координат
         * @method coordsArray
         * @private
         * @param coordinates {Array} Массив координат
         * @param bbox {Array} Текущие координаты границ объекта
         * @return {Array} Результирующие координаты границ объекта
         */
        coordsArray: function (coordinates, bbox) {
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
         * Запросить данные из кэша
         *
         * @param  {String} key - ключ (имя файла) который ищем в кэше
         * @return {Object} - данные (объект, массив и т.д.) или null
         */
        getFromCache: function (key) {
            // console.log('this.cache', this.cache);
            if (!key)
                return null;

            if (this.cache.hasOwnProperty(key)) {
                return this.cache[key];
            } else
                return null;
        },


        /**
         * Создание легенды c описанием
         *
         * @method createLegend
         * @param colorTheme {object} Описание темы
         */
        createLegend: function (colorTheme) {
            if (colorTheme["colors"]) {
                var colors = colorTheme["colors"];
            } else if (colorTheme["color"]) {
                colors = this.convertOldColorStructure(colorTheme["color"], colorTheme["hatchingFlag"]);
            } else {
                //нет цветовой схемы
                return;
            }

            var themeId = colorTheme["type"];
            var valuemode = colorTheme["valuemode"];
            //TODO: если перейти от строк к dom элементам - можно сократить дублирование
            var text, item, info = "";
            if (colors[0].value === "min") {
                for (var i = 1; i < colors.length; i++) {
                    if (parseFloat(colors[i].value) != null) {
                        if (colors[0].info && colors[0].info.length > 0)
                            info = ". <span id='colorLegendInfo_" + colors[0].value + "_" + colors[0].hatchingType + "' class=\"thematic-legend-info\">" + colors[0].info + "</span>";

                        if (colors[0].hatchingType != null && colors[0].hatchingType !== '') {
                            var pattern = this.createLegendSvgContent(colors[0]);
                            text = "<div class='tematic-legend-text'><i class='tematic-legend-icon' style='border: none;'><svg width='18' height='16'><defs>" + pattern.outerHTML + "</defs><rect fill=' url(#" + this.makeValidSvgLinkId(pattern.getAttributeNS("", "id")) + ")' stroke-width='2' stroke='black' x='0' y='0' width='18' height='16'></rect></svg></i> " + colors[i].value + " " + w2utils.lang("and less") + info + "</div>";
                        } else {
                            text = "<div class='tematic-legend-text'><i class='tematic-legend-icon' style='background-color:" + colors[0].color
                                + "'></i> " + colors[i].value + " " + w2utils.lang("and less") + info + "</div>";
                        }


                        item = {
                            itemid: "colorLegendInfo_" + themeId + "_" + colors[0].value + "_" + (colors[0].hatchingType !== undefined ? "1" : "0"),
                            alias: text,
                            group: false,
                            expanded: false,
                            clickable: false,
                            type: "legend"
                        };
                        this.addThemes(themeId, item);
                        break;
                    }
                }
            }

            var prefValue = '';
            if (valuemode !== 'equally') // не строгое соответствие значения для раскрашивания
                prefValue = w2utils.lang("more than"); // добавить перед значением фразу "более"

            for (i = 0; i < colors.length; i++) {
                if (colors[i].value === "min") {
                    continue;
                }
                if (colors[i].info && colors[i].info.length > 0)
                    info = ". <span  id='colorLegendInfo_" + colors[i].value + "_" + colors[i].hatchingType + "' class=\"thematic-legend-info\">" + colors[i].info + "</span>";


                if (colors[i].hatchingType != null && colors[i].hatchingType !== '') {
                    pattern = this.createLegendSvgContent(colors[i]);
                    text = "<div class='tematic-legend-text'><i class='tematic-legend-icon' style='border: none;'><svg width='18' height='16'><defs>" + pattern.outerHTML + "</defs><rect fill=' url(#" + this.makeValidSvgLinkId(pattern.getAttributeNS("", "id")) + ")' stroke-width='2' stroke='black' x='0' y='0' width='18' height='16'></rect></svg></i> " + " "
                        + prefValue + " " + colors[i].value + info + "</div>";
                } else {
                    text = "<div class='tematic-legend-text'><i class='tematic-legend-icon' style='background-color:" + colors[i].color + "'></i>" + " "
                        + prefValue + " " + colors[i].value + info + "</div>";
                }

                item = {
                    itemid: "colorLegendInfo_" + themeId + "_" + colors[i].value + "_" + (colors[i].hatchingType !== undefined ? "1" : "0"),
                    alias: text,
                    group: false,
                    expanded: false,
                    clickable: false,
                    type: "legend"
                };
                this.addThemes(themeId, item);
            }
        },

        /**
         * Создание объектов тематического слоя
         *
         * @method drawTheme
         */
        drawTheme: function () {

            // this.filter.semantic = [{'name': 'fias_okato2', 'value': '46'},
            //     {'name': 'fias_okato','value': '54','position': {'begin': 0,'end': 2}},
            //     {'name': 'fias_okato','value': '66','position': {'begin': 0,'end': 2}}
            // ];

            this.GeoJSON = JSON.parse(JSON.stringify(this.GeoJSON_Full));

            // если установлен фильтр на объекты, которые попадут в обработку
            if (JSON.stringify(this.filter) !== '{}') {

                // отфильтрованный массив объектов
                var featuresFiltered = [];

                // перебираем объекты по полному списку
                for (key = 0; key < this.GeoJSON_Full.features.length; key++) {
                    // перебираем семантики установленные в фильтре
                    for (var i = 0; i < this.filter.semantic.length; i++) {
                        if (this.GeoJSON_Full.features[key]["properties"][this.filter.semantic[i].name]) {
                            var objSemValue = this.GeoJSON_Full.features[key]["properties"][this.filter.semantic[i].name];
                            if (this.filter.semantic[i].position) {
                                objSemValue = objSemValue.slice(this.filter.semantic[i].position.begin, this.filter.semantic[i].position.end);
                            }
                            if (objSemValue === this.filter.semantic[i].value) {
                                featuresFiltered.push(this.GeoJSON_Full.features[key]); // скопировать объект в массив объектов
                            }
                        }
                    }
                }

                this.GeoJSON.features = featuresFiltered;
                var filterAddFlag = featuresFiltered.length > 0;

                // Проверяем на наличие в отрисовке
                if (this.svgDraw && this.svgDraw.svgCanvas) {
                    this.cleanObjects();
                }
            }

            var defs = this.createSvgElement("defs");

            // Параметры объекта по умолчанию
            var params = {
                "stroke-width": "2px", // толщина контура
                "vector-effect": "non-scaling-stroke",
                "stroke": "green", // цвет контура
                "fill-opacity": "0.75", // прозрачность объекта
                "objName": "SEM99", // откуда брать наименование объекта (отображается в панели "информация о тематическом слое")
                "objText": ""
            };

            if (this.activeThemeIdList.fill) {
                var fillTheme = this.getThemeById(this.activeThemeIdList.fill);
                // Установить откуда брать наименование объекта, если указано
                if (fillTheme["objname"])
                    params.objName = fillTheme["objname"];
                if (fillTheme["objtext"])
                    params.objText = fillTheme["objtext"];
            }
            if (this.activeThemeIdList.hatching) {
                var hatchingTheme = this.getThemeById(this.activeThemeIdList.hatching);
                // Установить откуда брать наименование объекта, если указано
                if (hatchingTheme["objname"])
                    params.objName = hatchingTheme["objname"];
                if (hatchingTheme["objtext"])
                    params.objText = hatchingTheme["objtext"];
            }


            // перебираем объекты и заполняем их параметры
            for (var key = 0; key < this.GeoJSON.features.length; key++) {

                var id = this.makeValidSvgLinkId("thematicmap_pattern_" + this.GeoJSON.features[key]["properties"]["id"]);

                if (fillTheme) {
                    var tval = this.getTvalue(fillTheme, this.GeoJSON["features"][key]);
                    // Определение цвета заливки объекта
                    patternParams = this.getParamsByValue(fillTheme, tval);
                    var color = patternParams.color;
                    if (tval == null || isNaN(tval)) {
                        if (fillTheme["colordef"])
                            color = fillTheme["colordef"]; // цвет объектов, у которых не установлено значение
                        else
                            color = "rgba(0,0,0,0)"; // цвет не указан, сделать объект прозрачным
                    }
                    if (color === undefined) {
                        // настройки цвета заданы по новому (массив объектов)
                        color = Array.isArray(fillTheme['colors']) && fillTheme['colors'][0].color; // берем первый цвет
                    }

                    var patternHatching = this.createFillPattern(id, color);
                    defs.appendChild(patternHatching);
                }
                if (hatchingTheme) {
                    tval = this.getTvalue(hatchingTheme, this.GeoJSON["features"][key]);
                    // Определение цвета заливки объекта
                    var patternParams = this.getParamsByValue(hatchingTheme, tval);
                    var lineColor = patternParams.color;
                    var hatchingFlag = parseInt(hatchingTheme["hatchingFlag"]) === 1 ? 1 : 0;
                    var hatchingType = patternParams.hatchingType || (hatchingFlag === 1 ? 0 : undefined);
                    if (tval == null || isNaN(tval)) {
                        if (hatchingTheme["colordef"])
                            lineColor = hatchingTheme["colordef"]; // цвет объектов, у которых не установлено значение
                        else
                            lineColor = "rgba(0,0,0,0)"; // цвет не указан, сделать объект прозрачным
                        hatchingType = undefined;
                    }
                    if (lineColor === undefined) {
                        // настройки цвета заданы по новому (массив объектов)
                        lineColor = Array.isArray(hatchingTheme['colors']) && hatchingTheme['colors'][0].color; // берем первый цвет
                    }

                    if (hatchingType !== undefined) {
                        var funcNumber = hatchingType;
                        defs.appendChild(this.createFillPattern(id, undefined, lineColor, funcNumber, patternHatching));
                    }
                }

                params["fill"] = "url(#" + id + ")";
                for (var p in params) {
                    this.GeoJSON.features[key]["properties"][p] = params[p];
                }
            }

            $("#" + this.tematicPane).show();

            if (!this.svgDraw || !this.svgDraw.svgCanvas) {
                var parents = $("#" + this.id);
                var parent = parents.length !== 0 ? parents[0] : null;
                this.svgDraw = new GWTK.svgDrawing(this.map, this.id, parent, "svg_" + this.id, ["mouseover", "mouseleave"]);
                this.svgDraw.draw(this.GeoJSON, true);
                this.addTextElements(this.GeoJSON.features);
                this.svgDraw.updateShadowCopies();
                $(this.map.eventPane).on('overlayRefresh.' + this.svgDraw.drawpanel.id, this.updatePatternScale);
            } else {
                var svgDefs = this.svgDraw.svgCanvas.querySelector("defs");
                svgDefs.outerHTML = "";
                if (filterAddFlag) {
                    this.svgDraw.draw(this.GeoJSON, true);
                    this.addTextElements(this.GeoJSON.features);
                    this.svgDraw.updateShadowCopies();
                }
                GWTK.Util.hideWait(); // иначе крутится - мы не перерисовываем
            }

            if (this.svgDraw.svgCanvas.getElementsByTagName("defs").length === 0) {
                this.svgDraw.svgCanvas.appendChild(defs);
            } else {
                // обновляем шаблоны
                var oldDefs = this.svgDraw.svgCanvas.getElementsByTagName("defs")[0];
                var patterns = Array.prototype.slice.apply(defs.getElementsByTagName("pattern"));
                for (i = 0; i < patterns.length; i++) {
                    var pattern = patterns[i];
                    var existPattern = oldDefs.querySelector("#" + pattern.getAttributeNS("", "id"));
                    if (existPattern) {
                        this.updatePatternElement(pattern, existPattern);
                    } else {
                        oldDefs.appendChild(pattern);
                    }
                }
            }
        },

        /**
         * Добавление текста
         * @method addTextElements
         * @public
         * @param features {array} Массив объектов в формате geoJSON
         */
        addTextElements: function (features) {
            for (var key = 0; key < features.length; key++) {
                var textField = features[key]["properties"]["objText"];
                var textValue = features[key]["properties"][textField];
                if (textValue) {
                    var bl = [];
                    if (features[key]["properties"]["SEMLATWGS84"] !== undefined &&
                        features[key]["properties"]["SEMLONWGS84"] !== undefined) {
                        bl[0] = features[key]["properties"]["SEMLONWGS84"];
                        bl[1] = features[key]["properties"]["SEMLATWGS84"];
                    } else {
                        var bbox = features[key]["bbox"];

                        bl[0] = (bbox[0] + bbox[2]) / 2;
                        bl[1] = (bbox[1] + bbox[3]) / 2;
                    }
                    var place = this.svgDraw.convertCoordinates([bl[0], bl[1]]);

                    var id = this.makeValidSvgLinkId(features[key]["properties"]["id"]);

                    var currCharWidth = 0.556 * this.getCurrentPatternScale();

                    var textOptions = {
                        id: "thematicmap_text_" + id,
                        x: place.x,
                        y: place.y,
                        "font-family": "sans-serif",
                        "font-size": this.getCurrentPatternScale() + "px",
                        "font-weight": "bold"
                    };
                    var svgElement = this.svgDraw.svgCanvas.querySelector("#" + id);
                    if (svgElement) {
                        var groupNode = svgElement.parentNode;
                        var textElement = this.createText(textOptions, textValue);
                        textElement.setAttributeNS("", "dx", (-currCharWidth * textElement.innerHTML.length / 2));
                        groupNode.appendChild(textElement);
                    }
                }
            }
        },

        /**
         * Установить тему
         * @public
         * @method setTheme
         * @param themeId {string} Идентификатор темы
         * @param active {boolean} Состояние (активна/неактивна)
         */
        setTheme: function (themeId, active) {
            var colorTheme = this.getThemeById(themeId);
            var hatchingFlag = parseInt(colorTheme["hatchingFlag"]) === 1 ? 1 : 0;
            if (active) {
                // создать легенду
                this.createLegend(colorTheme);
                if (hatchingFlag) {
                    this.activateHatching(themeId);
                } else {
                    this.activateFill(themeId);
                }
            } else {
                // Тема была выбрана ранее - отключаем ее
                this.clearThemeLegend(themeId);

                if (hatchingFlag) {
                    this.resetHatching();
                } else {
                    this.resetFill();
                }
            }
        },
        /**
         * Активаци заливки цветом
         * @method activateFill
         * @param themeId {string} Идентификатор темы
         */
        activateFill: function (themeId) {
            this.activeThemeIdList.fill = themeId;
        },
        /**
         * Cброс заливки цветом
         * @method resetFill
         */
        resetFill: function () {
            this.activeThemeIdList.fill = undefined;
        },
        /**
         * Активаци заливки штриховкой
         * @method activateFill
         * @param themeId {string} Идентификатор темы
         */
        activateHatching: function (themeId) {
            this.activeThemeIdList.hatching = themeId;
        },
        /**
         * Cброс заливки штриховкой
         * @method resetHatching
         */
        resetHatching: function () {
            this.activeThemeIdList.hatching = undefined;
        },

        /**
         * Очистка SVG от лишних объектов
         *
         * @method cleanObjects
         * @return {array} Массив идентификаторов отсутствующих в SVG объектов
         */
        cleanObjects: function () {
            var svgElements = Array.prototype.slice.apply(this.svgDraw.svgCanvas.querySelectorAll("path"));
            for (var i = 0; i < svgElements.length; i++) {
                var groupNode = svgElements[i].parentNode;
                groupNode.parentNode.removeChild(groupNode);//элемент <g>
            }
        },

        /**
         * Преобразование устаревшей структуры
         *
         * @method convertOldColorStructure
         * @param color {Object} Коллекция цветов и соответствующих им значений
         * @return {array} Массив цветов, соответствующих им значений и описаний
         */
        convertOldColorStructure: function (color) {
            var colors = [];
            if (color.hasOwnProperty("min")) {
                colors.push({
                    "color": color["min"],
                    "value": "min",
                    "hatchingType": color["hatchingType"],
                    "info": ""
                });
            }
            for (var key in color) {
                if (key !== "min") {
                    colors.push({
                        "color": color[key],
                        "hatchingType": color["hatchingType"],
                        "value": key,
                        "info": ""
                    })
                }
            }
            return colors;
        },

        /**
         * Получить параметры заливки по значению
         * @method getParamsByValue
         * @private
         * @param colorTheme {object} Цветовая тема
         * @param tval {number} Значение
         * @return {object} Параметры заливки
         */
        getParamsByValue: function (colorTheme, tval) {
            var result = {
                color: undefined,
                hatchingType: undefined,
                info: ""
            };
            var equalMode = (colorTheme["valuemode"] === 'equally');
            var colors = colorTheme["colors"];
            if (!colors) {
                if (colorTheme["color"]) {
                    // старый формат приводим к новому
                    colors = this.convertOldColorStructure(colorTheme["color"]);
                } else {
                    colors = [];
                }
            }

            if (!equalMode && colors.length > 0) {
                // значение min
                result = colors[0];
            }

            // поиск по значению
            for (var i = 0; i < colors.length; i++) {
                if (equalMode) { // строгое соответствие значений
                    if (tval === parseFloat(colors[i].value)) {
                        result = colors[i];
                        break;
                    }
                } else { // не строгое соответствие значений (диапазон)
                    if (tval > parseFloat(colors[i].value)) {
                        result = colors[i];
                    }
                }
            }
            return result;
        },

        /**
         * Получить значение величины для темы
         * @method getTvalue
         * @private
         * @param colorTheme {object} Цветовая тема
         * @param feature {object} JSON объект
         * @return {number} Значение величины
         */
        getTvalue: function (colorTheme, feature) {

            var result = null;

            if (colorTheme["loc"] === "geojson" || !this.baseJSON["records"])
                result = parseFloat(feature["properties"][colorTheme["gparam"]]);
            else {
                for (var v in this.baseJSON["records"]) {
                    if (feature["properties"][colorTheme["gid"]] === this.baseJSON["records"][v][colorTheme["dbid"]]
                        && this.baseJSON["records"][v][colorTheme["dbparam"]] != null) {
                        result = parseFloat(this.baseJSON["records"][v][colorTheme["dbparam"]]);
                        break;
                    }
                }
            }
            return result;
        },

        /**
         * Получить цветовую тему по идентификатору
         * @method getThemeById
         * @private
         * @param id {string} Идентификатор темы
         * @return {object|undefined} Цветовая тема
         */
        getThemeById: function (id) {
            var colorTheme;
            for (var key in this.settings) {
                if (this.settings[key]["type"] === id) {
                    colorTheme = this.settings[key];
                    if (!colorTheme["hatchingFlag"])
                        colorTheme["hatchingFlag"] = 0; // значение по умолчанию
                    break;
                }
            }

            return colorTheme;
        },

        /**
         * Получить размер шаблона штриховки для текущего масштаба карты
         * @method getCurrentPatternScale
         * @private
         * @return {number} Размер шаблона штриховки для текущего масштаба карты
         */
        getCurrentPatternScale: function () {
            // "100000" взял на глазок
            return 100000 / Math.pow(2, this.map.options.tilematrix);
        },

        /**
         * Создать SVG элемент
         * @method createSvgElement
         * @private
         * @param tag {string} Тег элемента
         * @param [options] {object} Параметры элемента
         * @return {SVGElement} SVG элемент
         */
        createSvgElement: function (tag, options) {
            var element = document.createElementNS("http://www.w3.org/2000/svg", tag);
            if (options !== undefined) {
                this.updateSvgElement(element, options);
            }
            return element;
        },
        /**
         * Создать SVG текст
         * @method createText
         * @private
         * @param options {object} Параметры элемента
         * @param textValue {object} Текст элемента
         * @return {SVGElement} SVG-text элемент
         */
        createText: function (options, textValue) {
            var text = this.createSvgElement("text", options);
            text.innerHTML = textValue;
            return text;
        },

        /**
         * Обновить атрибуты SVG элемента
         * @method updateSvgElement
         * @private
         * @param element {SVGElement} SVG элемент
         * @param options {object} Параметры элемента
         */
        updateSvgElement: function (element, options) {
            for (var attr in options) {
                element.setAttributeNS("", attr, options[attr]);
            }
        },

        /**
         * Обновить атрибуты SVG элемента из другого элемента
         * @method updateNSElementAttributes
         * @private
         * @param sourceElement {SVGElement} SVG элемент со значениями атрибутов
         * @param targetElement {SVGElement} Изменяемый SVG элемент
         */
        updateNSElementAttributes: function (sourceElement, targetElement) {
            for (var j = 0, atts = sourceElement.attributes, n = atts.length; j < n; j++) {
                targetElement.setAttributeNS("", atts[j].nodeName, sourceElement.getAttributeNS("", atts[j].nodeName));
            }
        },

        /**
         * Обновить атрибуты SVG шаблона из другого шаблона
         * @method updateNSElementAttributes
         * @private
         * @param sourcePattern {SVGElement} SVG шаблон со значениями атрибутов
         * @param existPattern {SVGElement} Изменяемый SVG шаблон
         */
        updatePatternElement: function (sourcePattern, existPattern) {
            //pattert attributes
            this.updateNSElementAttributes(sourcePattern, existPattern);

            //rect attributes
            var rect = sourcePattern.getElementsByTagName("rect")[0];
            if (rect) {
                var existRect = existPattern.getElementsByTagName("rect")[0];
                if (existRect) {
                    this.updateNSElementAttributes(rect, existRect);
                } else {
                    if (existPattern.getElementsByTagName("line")[0]) {
                        existPattern.insertBefore(rect, existPattern.getElementsByTagName("line")[0])
                    } else {
                        existPattern.appendChild(rect);
                    }
                }
            } else {
                //lines attributes
                var lines = Array.prototype.slice.apply(sourcePattern.getElementsByTagName("line"));
                if (lines.length > 0) {
                    var existLines = existPattern.getElementsByTagName("line");
                    var count = existLines.length;
                    while (lines.length < count) {
                        // удаляем лишние линии
                        existPattern.removeChild(existPattern.getElementsByTagName("line")[--count]);
                    }
                    for (var k = 0; k < lines.length; k++) {
                        var line = lines[k];
                        var existLine = existLines[k];
                        if (existLine) {
                            this.updateNSElementAttributes(line, existLine);
                        } else {
                            existPattern.appendChild(line);
                        }
                    }

                }
            }
        },

        /**
         * Создать SVG шаблон заливки
         * @method createFillPattern
         * @private
         * @param id {string} Идентификатор шаблона
         * @param fillColor {string|undefined} Цвет заливки
         * @param lineColor {string|undefined} Цвет штриховки
         * @param funcNumber {string|number} Номер функции штриховки
         * @param [pattern] {SVGElement} SVG шаблон заливки
         * @return {SVGElement} SVG шаблон заливки
         */
        createFillPattern: function (id, fillColor, lineColor, funcNumber, pattern) {
            var defaultValue = this.getCurrentPatternScale();

            var options = {
                id: id,
                x: 0,
                y: 0,
                width: defaultValue,
                height: defaultValue,
                patternUnits: "userSpaceOnUse"
            };

            // Шаблон
            pattern = pattern || this.createSvgElement("pattern", options);
            if (funcNumber !== undefined) {
                this.updateSvgElement(pattern, {funcNumber: funcNumber});
            }

            if (fillColor !== undefined) {
                // Заливка цветом
                var rectOptions = {
                    x: 0,
                    y: 0,
                    width: "100%",
                    height: "100%",
                    fill: fillColor
                };
                var rect = this.createSvgElement("rect", rectOptions);
                pattern.appendChild(rect);
            } else if (lineColor !== undefined) {
                // Штриховка
                var lineParamsArray = [];
                this.calcPatternLinePoints(funcNumber, defaultValue, lineParamsArray);

                for (var i = 0; i < lineParamsArray.length; i++) {
                    var lineOptions = {
                        x1: lineParamsArray[i][0],
                        y1: lineParamsArray[i][1],
                        x2: lineParamsArray[i][2],
                        y2: lineParamsArray[i][3],
                        "stroke-width": defaultValue / 5,
                        "stroke-linecap": "square",
                        stroke: lineColor
                    };
                    var line = this.createSvgElement("line", lineOptions);
                    pattern.appendChild(line);
                }
            }

            return pattern;
        },

        /**
         * Обновить масштаб шаблона заливки
         * @method updatePatternScale
         * @private
         */
        updatePatternScale: function () {
            if (this.svgDraw) {
                var scaleCurr = this.getCurrentPatternScale();

                var patterns = this.svgDraw.svgCanvas.getElementsByTagName("defs")[0].getElementsByTagName("pattern");

                var options = {"width": scaleCurr, "height": scaleCurr};

                for (var i = 0; i < patterns.length; i++) {
                    var pattern = patterns[i];
                    this.updateSvgElement(pattern, options);
                    var lineElements = pattern.getElementsByTagName("line");
                    if (lineElements.length > 0) {
                        // Обновить параметры линий
                        this.updateLineScale(lineElements, pattern.getAttributeNS("", "funcNumber"));
                    }
                }

                // обновлем текстовые надписи, если есть
                options = {"font-size": scaleCurr + "px"};
                var currCharWidth = 0.556 * scaleCurr;
                var textElements = this.svgDraw.svgCanvas.getElementsByTagName("text");
                for (i = 0; i < textElements.length; i++) {
                    var textElement = textElements[i];
                    this.updateSvgElement(textElement, options);
                    textElement.setAttributeNS("", "dx", (-currCharWidth * textElement.innerHTML.length / 2));
                }
                this.svgDraw.updateShadowCopies();
            }
        },

        /**
         * Обновить масштаб линий штриховки
         * @method updateLineScale
         * @private
         * @param lineElements {HTMLCollectionOf<SVGElement>} Коллекция линий
         * @param funcNumber {string} Функция штриховки
         */
        updateLineScale: function (lineElements, funcNumber) {
            var scaleCur = this.getCurrentPatternScale();
            var lineParamsArray = [];
            this.calcPatternLinePoints(funcNumber, scaleCur, lineParamsArray);

            for (var i = 0; i < lineParamsArray.length; i++) {
                var lineOptions = {
                    x1: lineParamsArray[i][0],
                    y1: lineParamsArray[i][1],
                    x2: lineParamsArray[i][2],
                    y2: lineParamsArray[i][3],
                    "stroke-width": scaleCur / 5
                };
                this.updateSvgElement(lineElements[i], lineOptions);
            }
        },

        /**
         * Получить геометрию линий штриховки на масштаб
         * @method calcPatternLinePoints
         * @private
         * @param funcNumber {string} Функция штриховки
         * @param scale {number} Масштабный коэффициент
         * @param output {array} Массив результатов
         */
        calcPatternLinePoints: function (funcNumber, scale, output) {
            var defaultValue = scale;
            var defaultStroke = defaultValue / 5;
            var points1 = [];
            var points2 = [];

            switch (parseInt(funcNumber)) {
                case 0:
                    //0
                    points1[0] = 0;
                    points1[1] = defaultValue / 2;
                    points1[2] = defaultValue;
                    points1[3] = defaultValue / 2;
                    output.push(points1);
                    break;
                case 1:
                    //45
                    points1[0] = defaultStroke;
                    points1[1] = defaultValue;
                    points1[2] = defaultValue;
                    points1[3] = defaultStroke;
                    output.push(points1);

                    points2[0] = 0;
                    points2[1] = defaultStroke;
                    points2[2] = defaultStroke;
                    points2[3] = 0;
                    output.push(points2);
                    break;
                case 2:
                    //90
                    points1[0] = defaultValue / 2;
                    points1[1] = 0;
                    points1[2] = defaultValue / 2;
                    points1[3] = defaultValue;
                    output.push(points1);
                    break;
                case 3:
                    //135
                    points1[0] = 0;
                    points1[1] = defaultStroke;
                    points1[2] = defaultValue - defaultStroke;
                    points1[3] = defaultValue;
                    output.push(points1);

                    points2[0] = defaultValue - defaultStroke;
                    points2[1] = 0;
                    points2[2] = defaultValue;
                    points2[3] = defaultStroke;
                    output.push(points2);
                    break;
                case 4:
                    //+
                    points1[0] = 0;
                    points1[1] = defaultValue / 2;
                    points1[2] = defaultValue;
                    points1[3] = defaultValue / 2;
                    output.push(points1);

                    points2[0] = defaultValue / 2;
                    points2[1] = 0;
                    points2[2] = defaultValue / 2;
                    points2[3] = defaultValue;
                    output.push(points2);
                    break;
                case 5:
                    //X
                    points1[0] = 0;
                    points1[1] = 0;
                    points1[2] = defaultValue;
                    points1[3] = defaultValue;
                    output.push(points1);

                    points2[0] = 0;
                    points2[1] = defaultValue;
                    points2[2] = defaultValue;
                    points2[3] = 0;
                    output.push(points2);
                    break;
            }
        },

        /**
         * Создать элемент легенды для штриховки
         * @method createLegendSvgContent
         * @private
         * @param params {object} Параметры штриховки
         * @return {SVGElement} SVG шаблон заливки
         */
        createLegendSvgContent: function (params) {
            var defaultValue = 8; // на глазок
            var id = "svg_legend_pattern_" + params.hatchingType;
            var options = {
                id: id,
                x: 0,
                y: 0,
                width: defaultValue,
                height: defaultValue,
                patternUnits: "userSpaceOnUse"
            };
            var pattern = this.createSvgElement("pattern", options);

            var lineParamsArray = [];
            this.calcPatternLinePoints(params.hatchingType, defaultValue, lineParamsArray);

            for (var i = 0; i < lineParamsArray.length; i++) {
                var lineOptions = {
                    x1: lineParamsArray[i][0],
                    y1: lineParamsArray[i][1],
                    x2: lineParamsArray[i][2],
                    y2: lineParamsArray[i][3],
                    "stroke-width": 2,
                    "stroke-linecap": "square",
                    stroke: params.color
                };
                var line = this.createSvgElement("line", lineOptions);
                pattern.appendChild(line);
            }

            return pattern;

        },

        /**
         * Создать правильный идентификатор для ссылки на шаблон
         * @method makeValidSvgLinkId
         * @public
         * @param id {string} Идентификатор
         * @return {string} Идентификатор с удаленными запрещенными символами
         */
        makeValidSvgLinkId: function (id) {
            return id.replace(/[#:/.\s]/g, '_');
        },

        /**
         * Очистить легенду темы
         * @method clearThemeLegend
         * @private
         * @param themeId {string} Идентификатор темы в дереве слоев
         */
        clearThemeLegend: function (themeId) {
            var mapContent = this.map.mapTool('mapcontent');
            var themeNode = w2ui[mapContent.name].get(themeId);
            for (var i = themeNode.nodes.length - 1; i >= 0; i--) {
                w2ui[mapContent.name].remove(themeNode.nodes[i].id);
            }
        },

        /**
         * Создать GUID
         * @method createGUID
         * @public
         * @return {string} GUID
         */
        createGUID: function () {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            }

            return '' + s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },

        /**
         * Обработчик mouseover-события объекта
         * @method mouseoverAction
         * @param event {Object} Событие
         */
        mouseoverAction: function (event) {
            var elem = event.srcElement;
            var tval = null; // значение, по которому раскрасился объект
            var infoval = ''; // описание значения из легенды
            var name = elem.attributes.name.value; // наименование объекта
            var nameName = 'Name'; // наименование объекта (отображается перед самим наименованием)
            var nameValue = 'Value'; // наименование значения (отображается перед самим значением)


            // Получить значение, по которому раскрасился объект
            for (var key in this.GeoJSON["features"]) {
                var objecId = this.GeoJSON["features"][key]["properties"]["id"];
                objecId = objecId.replace(" ", '_');
                objecId = objecId.replace(":", '_');
                objecId = objecId.replace(".", '_');
                if (objecId === elem.id) {
                    var txtEl = $("#" + this.tematicPane + '_text');
                    txtEl.empty();
                    var curName = null;
                    // заполняем для каждой активной темы
                    for (var type in this.activeThemeIdList) {
                        var themeId = this.activeThemeIdList[type];
                        if (themeId !== undefined) {
                            var colorTheme = this.getThemeById(themeId);
                            if (colorTheme["loc"] === "geojson")
                                // отображаемое значение берем из свойства объекта
                                tval = parseFloat(this.GeoJSON["features"][key]["properties"][colorTheme["gparam"]]);
                            else {
                                // отображаемое значение берем из таблицы
                                for (var v in this.baseJSON["records"]) {
                                    if (this.GeoJSON["features"][key]["properties"][colorTheme["gid"]] === this.baseJSON["records"][v][colorTheme["dbid"]]
                                        && this.baseJSON["records"][v][colorTheme["dbparam"]] != null) {
                                        tval = parseFloat(this.baseJSON["records"][v][colorTheme["dbparam"]]);
                                        break;
                                    }
                                }
                            }

                            if (colorTheme["objnamename"]) {
                                nameName = colorTheme["objnamename"];
                            }
                            if (colorTheme["valuename"]) {
                                nameValue = colorTheme["valuename"];
                            }

                            // Получить описание значения из легенды
                            if (colorTheme["colors"]) {
                                var patternParams = this.getParamsByValue(colorTheme, tval);
                                infoval = patternParams.info || "";
                            }

                            if (tval == null || isNaN(tval)) {
                                tval = w2utils.lang("missing");
                            }

                            var textValue = '';
                            var textField = this.GeoJSON["features"][key]["properties"]["objText"];
                            if (textField)
                                textValue = '(' + this.GeoJSON["features"][key]["properties"][textField] + ')';

                            // Сформировать текст с информацией об объекте
                            if (curName !== nameName) {
                                // чтобы не повторялось наименование (повторится, только если разное название параметра в темах)
                                txtEl.append('<div class="thematic-objinfo-fname">' + w2utils.lang(nameName) + ': <span class="thematic-objinfo-fname-val">' + name + ' ' + textValue + '</span></div>');
                                curName = nameName;
                            }
                            txtEl.append(
                                '<div class="thematic-objinfo-fvalue">' + w2utils.lang(nameValue) + ': <span class="thematic-objinfo-fvalue-val">' + tval + '</span></div>' +
                                '<div class="thematic-objinfo-finfo">' + infoval + '</div>');
                        }
                    }
                    break;
                }
            }
        },

        /**
         * Обработчик mouseleave-события
         * @method mouseleaveAction
         */
        mouseleaveAction: function () {
            var txtEl = $("#" + this.tematicPane + '_text');
            txtEl.empty();
            txtEl.append(this.defText);
        },

        /**
         * Очистка svg-холста и удаление svg-объекта
         * @method clear
         */
        clear: function () {
            $("#" + this.tematicPane).remove();
            if (this.svgDraw) {
                $(this.map.eventPane).off('overlayRefresh.' + this.svgDraw.drawpanel.id, this.updatePatternScale);
                this.svgDraw.destroy();
            }
            this.activeThemeIdList.fill = undefined;
            this.activeThemeIdList.hatching = undefined;
        },

        /**
         * Функция создания дерева для раздела тематического картографирования
         * @method addThemes
         * @param parentId {String} Идентификатор раздела-родителя
         * @param ItemData {Object} Элемент дерева панели Состава карт
         */
        addThemes: function (parentId, ItemData) {
            var mapContent = this.map.mapTool('mapcontent');

            if (w2ui[mapContent.name].get(ItemData.itemid)) {
                // узел уже есть
                return;
            }

            var data, divtext, trigger;

            switch (ItemData.type) {
                case "main":
                    divtext = ItemData.alias;
                    break;
                case "section":
                    trigger = "$('#" + this.map.eventPane.id + "').trigger({ type: 'layercommand', maplayer: { id:'" + "chbx_" + parentId + '_' + ItemData.itemid
                        + "', act: 'toggleSection', name:'" + parentId + "', value :'" + ItemData.itemid + "', subtype:'" + this.xId + "' } }); ";
                    divtext = '<div><input ' + 'id="chbx_' + parentId + '_' + ItemData.itemid + '" type="checkbox" name="'
                        + parentId + '" value = "' + ItemData.itemid + '" style="float:left;" onchange="' + trigger + '" class="mapcontent-item-img">'
                        + ItemData.alias + '</div>';
                    break;
                case "theme":
                    trigger = "$('#" + this.map.eventPane.id + "').trigger({ type: 'layercommand', maplayer: { id:'" + "chbx_" + parentId + '_' + ItemData.itemid
                        + "', act: 'toggleTheme' , name:'" + parentId + "', value :'" + ItemData.itemid + "', subtype:'" + this.xId + "' } }); ";
                    divtext = '<div><input ' + 'id="chbx_' + parentId + '_' + ItemData.itemid + '" type="checkbox" name="'
                        + parentId + '" value = "' + ItemData.itemid + '" style="float:left" onclick="' + trigger + '" class="mapcontent-item-img">'
                        + ItemData.alias + '</div>';
                    break;
                case "legend":
                    divtext = ItemData.alias;
                    break;
            }

            data = {
                "id": ItemData.itemid,
                "text": divtext,
                "group": ItemData.group || false,
                "clickable": true,
                "expanded": ItemData.expanded,
                "img": ItemData.img || ""
            };


            if (parentId == null)
                w2ui[mapContent.name].add(data);
            else
                w2ui[mapContent.name].add(parentId, data);
        },


        /**
         * Выбор темы. Обработчик mouseclick-события по теме в дереве
         *
         * @method themeChecked
         * @param event {Object} Событие
         */
        themeChecked: function (event) {
            $(document).css("cursor", "wait");

            event = event || window.event;
            var selected = event.maplayer;

            var themeId = selected.value;

            var hatchingFlag = parseInt(this.getThemeById(themeId).hatchingFlag) === 1 ? 1 : 0;
            var activeThemeId = hatchingFlag === 1 ? this.activeThemeIdList.hatching : this.activeThemeIdList.fill;

            if (activeThemeId !== themeId) { // Если элемент не выбирали ранее
                if (activeThemeId !== undefined) {
                    this.setTheme(activeThemeId, false);
                    $("input[name=" + selected.name + "][value=" + activeThemeId + "]").removeAttr('checked');// снимаем выбор
                }

                this.setTheme(themeId, true);
                this.drawTheme();
                $("#" + selected.id)[0].checked = true;
                this.ReplaceItemText(themeId, selected.name);
            } else {

                this.setTheme(themeId, false);
                $("input[name=" + selected.name + "][value=" + themeId + "]").removeAttr('checked');// снимаем выбор

                if (this.activeThemeIdList.fill || this.activeThemeIdList.hatching) {
                    // сбрасываем тему, если есть еще одна активная
                    this.drawTheme();
                } else {
                    // отключаем раздел - активных тем нет
                    $("#node_" + selected.name + " input").click();
                }
            }
        },

        /**
         * Выбор раздела. Обработчик mouseclick-события по тематическому разделу в дереве
         *
         * @method sectionSelected
         * @param event {Object} Событие
         */
        sectionSelected: function (event) {
            var mapContent = this.map.mapTool('mapcontent');
            if (!mapContent) return;
            var sections, key, i;
            event = event || window.event; // кросс-браузерно
            var selected = event.maplayer;
            var thematicPane = $("#" + this.tematicPane);
            if (thematicPane.length < 1) {
                this.initPanes();
            }
            if (w2ui[mapContent.name].get(selected.value).nodes.length === 0) {
                $("#" + this.id).empty();
                thematicPane.hide();

                if (this.svgDraw) {
                    this.svgDraw.clearDraw();
                    this.svgDraw = null;
                }

                sections = w2ui[mapContent.name].get(selected.name).nodes;
                for (key in sections) {
                    if (sections[key].id !== selected.value) {
                        for (i = sections[key].nodes.length - 1; i >= 0; i--)
                            w2ui[mapContent.name].remove(sections[key].nodes[i].id);
                    }
                }
                $("input[name=" + selected.name + "]").removeAttr('checked');
                this.initThemes(selected.value);
                $("#" + selected.id)[0].checked = true;
                this.ReplaceItemText(selected.value, selected.name);
                this.activeThemeIdList.fill = undefined;
                this.activeThemeIdList.hatching = undefined;
            } else {
                sections = w2ui[mapContent.name].get(selected.name).nodes;
                for (key in sections) {
                    if (sections[key].id === selected.value) {
                        for (i = sections[key].nodes.length - 1; i >= 0; i--)
                            w2ui[mapContent.name].remove(sections[key].nodes[i].id);
                    }
                }
                this.clear();
                $("#" + selected.id).removeAttr('checked');
                this.ReplaceItemText(selected.value, selected.name);
                GWTK.Util.hideWait();
            }
        },

        /**
         * Сервисная функция замены названия элемента в дереве
         * @method ReplaceItemText
         * @param ItemId {String} Идентификатор элемента
         * @param parentId {String} Идентификатор раздела-родителя
         */
        ReplaceItemText: function (ItemId, parentId) {
            if (!ItemId)
                return;
            var mapContent = this.map.mapTool('mapcontent');
            if (typeof mapContent == null) {
                return;
            }
            var pos,
                nodes = w2ui[mapContent.name].find({id: ItemId});
            if (nodes.length !== 0) {
                var itext = nodes[0].text;
                var ipos = itext.indexOf('chbx_' + parentId + '_' + ItemId);
                if (ipos === -1)
                    return;
                if (itext != null && itext != '') {
                    if (document.getElementById('chbx_' + parentId + '_' + ItemId).checked) {
                        pos = itext.indexOf('<input id');
                        if (pos !== -1) {
                            itext = itext.replace('<input id', '<input checked id');
                        }
                    } else {
                        pos = itext.indexOf('<input checked id');
                        if (pos !== -1) {
                            itext = itext.replace('<input checked id', '<input id');
                        }
                    }
                }
                var node = w2ui[mapContent.name].get(ItemId);
                if (!node || !node.text)
                    return;
                node.text = itext;
            }
        },

        /**
         * Деструктор
         * @method destroy
         */
        destroy: function () {
            $(this.map.eventPane).off('mapcontentloaded.thematicmap');
            $(this.map.eventPane).off('layercommand.thematicmap');
            if (this.svgDraw) {
                this.svgDraw.destroy();
            }
            $(this.map.eventPane).off("svgmouseover.thematicmap");
            $(this.map.eventPane).off("svgmouseleave.thematicmap");
            var pane = $("#" + this.tematicPane);
            if (pane.is('.ui-draggable'))
                pane.draggable("destroy");
            pane.remove();
        }
    };
}
