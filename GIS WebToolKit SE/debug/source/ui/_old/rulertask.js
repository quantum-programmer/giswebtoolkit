/*************************************** Тазин В.О.    23/08/17 ****
**************************************** Соколова Т.О. 31/03/21 ****
**************************************** Гиман Н.Л.    04/12/17 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2019              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                  Измерение и углов расстояний по карте           *
*                                                                  *
*******************************************************************/
if (window.GWTK) {
    
    /**
     * Компонент измерения расстояний по карте
     * @class GWTK.RulerTask
     * @constructor GWTK.RulerTask
     */
    GWTK.RulerTask = function(map, param) {
        if (!map) {
            console.log("rulerTask. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        
        GWTK.MapTask.call(this, map);    // родительский конструктор
        
        if (param)
            this.param = param;
        else{
            this.param = { "type": "Length" };
        }
        this.name = 'ruler' + this.param.type;
        
        // this.rulerlength = 0;
        this.distance = 0;                                       // длина ломаной
        this.hintclassName = 'ruler-point-hint';
        
        this._cookieKey = GWTK.cookies.getKey() + '_' + this.name + '_' + this.param.type;
        
        this.drawobject = new GWTK.DrawingObject(this.map, {
            'nocontextmenu': true   // не отображать конткстное меню
        }, this);
        if (this.param.type != 'Angle')
            this.drawobject.drw_centerpoints = true;
        
        // Класс топологии
        this.topology = new GWTK.Topology(this.map, {
            'svgid': this.name + '_canvas',
            'func': {
                'fn_parentpanel': this.getdrawpanel,
                'fn_drawcustom': this.draw
            }
        }, this);
        
        
        this.drawobject.options_points["fill"] = "#ff3322";
        this.drawobject.options_line["stroke-width"] = "1px";
        this.drawobject.refreshstyle(this.map.options.measurementstyle);
        this.topology.drawoptions_over["stroke"] = "transparent";
        this.topology.drawoptions_over["fill"] = "transparent";
        
        // Создадим объект карты
        this.createobject();
        
        // Номер контура для измерения углов
        this.subjectnumber = 0;
        
        this.countCycle = 4;
        
        this.initialize();
    };
    
    GWTK.RulerTask.prototype = {
        /**
         * Инициализация класса
         * @method initialize
         * @private
         */
        // ===============================================================
        initialize: function() {
            if (this.map instanceof GWTK.Map == false) return this;
            
            this.createdrawpanel();
            if (this.param["type"] === "Length") {
                // объект для расчета ортодромии
                this.mapcalcObject = new GWTK.MapCalculations(this.map);
                // панель для фона
                this.createbackgroundpanel();
            }
            this.onOverlayRefresh = GWTK.Util.bind(this.onOverlayRefresh, this);
            this.onMeasurementStyleChanged = GWTK.Util.bind(this.onMeasurementStyleChanged, this);
            
            // Перерисовка карты
            $(this.map.eventPane).on('overlayRefresh', this.onOverlayRefresh);
            $(this.map.eventPane).on('measurementstylechanged', this.onMeasurementStyleChanged);
            
            this.wfsQuerys = [];
            this._readCookie();
        },
        
        /**
         * Создание объекта редактирования
         * @method createobject
         * @private
         */
        // ===============================================================
        createobject: function() {
            this.editobject = new GWTK.mapobject(this.map, 'ruler' + this.param.type);
            this.editobject.maplayername = this.editobject.id = this.name;
            
            if (this.param.type == "Length" || this.param.type == "Angle")
                this.editobject.setSpatialposition('linestring');
            else{
                if (this.param.type == "Polygon")
                    this.editobject.setSpatialposition('polygon');
            }
            
        },
        
        /**
         * Создание панели для рисования объекта
         * @method createdrawpanel
         * @private
         */
        // ===============================================================
        createdrawpanel: function() {
            var mapdiv = (this.map.drawPane) ? this.map.drawPane : (this.map.overlayPane); //document.getElementById('overlayPane');
            if (!mapdiv || !this.editobject.gid)
                return;
            
            var drawpanel_id = this.editobject.gid;//.replace(/\./g, '_');
            var p = $('#mapobject-overlayPane_' + drawpanel_id);
            if (p && p.length > 0)
                p.remove();
            this.drawpanel = GWTK.DomUtil.create('div', 'overlay-panel', this.map.drawPane);// mapdiv);
            this.drawpanel.id = 'mapobject-overlayPane_' + drawpanel_id;
        },
        
        /**
         * Создание панели для рисования фона объекта
         * @method createbackgroundpanel
         * @private
         */
        // ===============================================================
        createbackgroundpanel: function() {
            // var mapdiv = document.getElementById(this.map.divID + '_drawPane_test');
            var mapdiv = document.getElementById(this.map.divID + '_drawPane');   // 05.06.2020
            
            if (!mapdiv || !this.editobject.gid)
                return;
            
            var backgroundpanel_id = this.editobject.gid + "_svg";
            var p = $('#mapobject-overlayPane_' + backgroundpanel_id);
            if (p && p.length > 0)
                p.remove();
            this.backgroundpanel = GWTK.DomUtil.create('div', 'overlay-panel', mapdiv);
            this.backgroundpanel.id = 'mapobject-overlayPane_' + backgroundpanel_id;
            
            this.svgDraw = new GWTK.svgDrawing(this.map, "orthodrom", this.backgroundpanel, "svgOrthodrom", null, { "do-not-repeat": true });
            this.svgDraw.options["stroke"] = "red";
            if (this.map.options.measurementstyle) {
                this.svgDraw.options["stroke"] = '#' + this.map.options.measurementstyle.linecolor;
            }
            
            this.svgDraw.options["stroke-width"] = "1px";
            //this.svgDraw.options["stroke-opacity"] = "0.45";
            this.svgDraw.options["stroke-opacity"] = "1";
            this.svgDraw.options["stroke-dasharray"] = "5";
            
            this.backgroundpanelCycle = [];
            this.svgDrawCycle = [];
            for (var k = 0; k < this.countCycle; k++) {
                var id = this.editobject.gid + "_svg" + k;
                var p = $('#mapobject-overlayPane_' + id);
                if (p && p.length > 0)
                    p.remove();
                this.backgroundpanelCycle[k] = GWTK.DomUtil.create('div', 'overlay-panel', mapdiv);
                this.backgroundpanelCycle[k].id = 'mapobject-overlayPane_' + id;
                
                this.svgDrawCycle[k] = new GWTK.svgDrawing(this.map, "orthodrom", this.backgroundpanelCycle[k], "svgOrthodrom" + k, null, { "do-not-repeat": true });
                this.svgDrawCycle[k].options["stroke"] = "red";
                if (this.map.options.measurementstyle) {
                    this.svgDrawCycle[k].options["stroke"] = '#' + this.map.options.measurementstyle.linecolor;
                }
                this.svgDrawCycle[k].options["stroke-width"] = "1px";
                //this.svgDrawCycle[k].options["stroke-opacity"] = "0.45";
                this.svgDrawCycle[k].options["stroke-opacity"] = "1";
                this.svgDrawCycle[k].options["stroke-dasharray"] = "5";
            }
        },
        
        /**
         * Начать построение пути
         * @method start
         * @public
         */
        // ===============================================================
        start: function() {
            // запустить обработчик
            var action = new GWTK.RulerAction(this, 'RulerAction' + this.param.type);
            if (!action.error) {
                if (this.map.setAction(action)) {
                    this.action = action;
                    return;
                }
                action.close();
            }
        },
        
        /**
         * Записать координаты пути в  Cookie
         * @method _writeCookie
         * @public
         */
        // ===============================================================
        _writeCookie: function() {
            
            // Запишем только для линии
            if (this.param.type != 'Length')
                return;
            
            GWTK.removeCookie(this._cookieKey);
            var coord = this.getPathCoord();
            if (coord.length > 0)
                GWTK.cookie(this._cookieKey, coord, { expires: 1, path: '/' });
        },
        
        /**
         * Записать координаты пути в  Cookie
         * @method _readCookie
         * @private
         */
        // ===============================================================
        _readCookie: function() {
            
            // Отладка
            /*
            var points = [];
            points.push(new GWTK.Point3D(65.94647, 163.65234, 0));
            points.push(new GWTK.Point3D(64.09141, -136.58203, 0));

            // var point1 = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng([points[0].x, points[0].y]));
            var point1 = GWTK.tileView.geo2pixelOffsetMap(this.map, GWTK.toLatLng([points[0].x, points[0].y]));
            console.log(' point1 = ' + point1);
            // var point2 = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng([points[1].x, points[1].y]));
            var point2 = GWTK.tileView.geo2pixelOffsetMap(this.map, GWTK.toLatLng([points[1].x, points[1].y]));
            console.log(' point2 = ' + point2);
*/
            
            // Поднимаем только для линии
            if (this.param.type != 'Length')
                return;
            
            var mass, param = GWTK.cookie(this._cookieKey);
            if (!param || param.length == 0)
                return;
            mass = param.split(',');
            if (!mass || mass.length == 0)
                return;
            points = [];
            for (var i = 0; i < mass.length; i += 3)
                points.push(new GWTK.Point3D(parseFloat(mass[i]), parseFloat(mass[i + 1]), parseFloat(mass[i + 2])));
            
            this.editobject.geometry.points = this.editobject.geometry.clonepoints(0, points);
            //обновление ортодромии
            this.updateBackground();
            this.drawBackground();
            this.getInfo();
        },
        
        /**
         * Запросить координаты пути (ломаной)
         * @method getPathCoord
         * @private
         * @return {String} геодезические координаты точек через запятую
         */
        // ===============================================================
        getPathCoord: function() {
            var points = this.editobject.geometry.getpoints();
            if (points.length == 0) return [];
            var path = [], i, len = points.length;
            for (i = 0; i < len; i++) {
                path[i] = GWTK.toLatLng(points[i].x, points[i].y).toString() + ',' + points[i].h.toString();
            }
            return path.join(',')
        },
        
        /**
         * Очистить путь
         * @method clearPath
         * @private
         */
        // ===============================================================
        clearPath: function(subject) {
            
            // Удалить hint
            if (this.param.type != 'Angle') {
                this.removePointHint(this.editobject.geometry.count(subject), true);
                this.editobject.geometry.clear();
            }else{
                this.removePointHint(subject, true);
                if (subject) {
                    this.editobject.geometry.deletesubject(subject);
                }else{
                    // Если удаляем основной контур, но при этом есть другие контура
                    if (this.editobject.geometry.subjects.length > 0) {
                        // Перестроим геометрию
                        var newgeometry = new GWTK.mapgeometry(this.editobject.geometry.map, this.editobject.geometry.mapobject, this.editobject.geometry.getpoints(1));
                        for (var i = 1; i < this.editobject.geometry.subjects.length; i++)
                            newgeometry.addsubject(this.editobject.geometry.getpoints(i));
                        this.editobject.geometry = newgeometry.createcopy();
                        this.drawobject.mapobject = this.editobject;
                    }else{
                        this.editobject.geometry.clear();
                    }
                }
                this.updateAnglePointsHint();
            }
            
            this.drawobject.refreshdraw();
            this.clearBackGroundPoints();
            
            if (this.param.type == 'Length')
                GWTK.removeCookie(this._cookieKey);
            
            // Очистить svg topology
            if (this.editobject.geometry.subjects.length == 0) {
                this.topology.clearChildrensSvgid();
            }
            
        },
        
        /**
         * Удалить точку
         * @method removePoint
         * @private
         */
        // ===============================================================
        removePoint: function(number) {
            if (!number) return;
            number = parseInt(number);
            if (number) {
                this.editobject.geometry.deletepoint(number);
                if (this.param.type == 'Polygon')
                    this.editobject.geometry.closeobject(true);
                // Обновим точки
                this.updatePoints(number, null, null, true);
                this.drawobject.refreshdraw();
                this.drawBackground();
            }
        },
        
        
        /**
         * Обновить точки
         * @method updatePoints
         * @private
         */
        // ===============================================================
        updatePoints: function(begin, subject, insert, remove) {
            // Обновим фоновый рисунок
            this.updateBackground();
            
            // Обновим значения точек
            this.updatePointsValue(begin, subject);
            // Обновим значения Hint
            this.updatePointsHint(begin, insert, remove);
            //// Обновим фоновый рисунок
            //this.updateBackground();
            // Сохраним в куки
            this._writeCookie();
        },
        
        
        /**
         * Обновить значения точек
         * @method updatePointsValue
         * @private
         */
        // ===============================================================
        updatePointsValue: function(begin, subject) {
            if (begin == 0) begin = 1;
            var points = this.editobject.geometry.getpoints(subject);
            if (!points) return;
            for (var i = begin; i <= points.length; i++)
                points[i - 1].h = 0;
        },
        
        /**
         * Обновить значения hint
         * @method updatePointHints
         * @private
         */
        // ===============================================================
        updatePointsHint: function(begin, insert, remove, onlyhint) {
            if (this.param.type == 'Angle') {
                this.updateAnglePointsHint();
                return;
            }
            
            var id, hint,
                hints = [],
                find, k,
                count = this.editobject.geometry.count(),
                el = $(this.drawpanel).parent().find('.hintpoints' + this.param.type);
            
            // Разберемся с метками панели на overlay
            this.updateOverlayPointHint('Length');
            this.updateOverlayPointHint('Polygon');
            
            if (!el || el.length == 0)
                return;
            
            // Узнаем на какие точки есть hint
            for (var j = 0; j < el.length; j++) {
                hint = $(el[j]).find('.ruler-point-removepoint');
                if (!hint || hint.length == 0 || !(id = hint[0].id))
                    continue;
                k = parseInt(id);
                if (k >= begin) {
                    if (insert)
                        k++;
                    else{
                        if (remove)
                            k--;
                    }
                }
                if (hints[hints.length - 1] != k)
                    hints.push(k);
            }
            
            // Удалим hints
            el.remove();
            
            // Добавим последнюю точку
            if (this.param.type == 'Polygon') {
                find = count - 1;
                if (onlyhint) {
                    this.setPointHint(find);
                }else{
                    this.getInfo(find);
                }
                return;
            }else
                hints.push(count);
            
            for (var i = 0; i < count; i++) {
                find = hints.find(
                    function(element, index, array) {
                        if (element == i + 1)
                            return element;
                    });
                if (find) {
                    if (find < begin && (!insert && !remove))
                        this.setPointHint(find);
                    else{
                        if (onlyhint) {
                            this.setPointHint(find);
                        }else{
                            this.getInfo(find);
                        }
                    }
                }
                
            }
            
        },
        
        /**
         * Обновить значения hint на overlayPane
         * @method updateOverlayPointHint
         * @private
         */
        // ===============================================================
        updateOverlayPointHint: function(type) {
            var idpoint, tool,
                el = $(this.map.overlayPane).find('.hintpoints' + type).children();
            if (!el || el.length == 0)
                return;
            idpoint = el[0].id;
            el.remove();
            if (idpoint) {
                idpoint = parseInt(idpoint.substr(this.hintclassName.length, 1));
                if (idpoint) {
                    tool = this.map.mapTool('ruler' + type + 'Control');
                    if (tool && tool.ruler) {
                        tool.ruler.setPointHint(idpoint);
                    }
                }
            }
            
        },
        
        
        /**
         * Обновить значения hint для углов
         * @method updateAnglePointsHint
         * @private
         */
        // ===============================================================
        updateAnglePointsHint: function() {
            $(this.drawpanel).parent().find('.hintpoints' + this.param.type).remove();
            var points;
            for (var i = 0; i <= this.editobject.geometry.subjects.length; i++) {
                points = this.editobject.geometry.getpoints(i);
                if (points.length == 3)
                    this.getInfo(2, i);
            }
        },
        
        /**
         * Очистить
         * @method destroy
         * @public
         */
        // ===============================================================
        destroy: function() {
            // Перерисовка карты
            $(this.map.eventPane).off('overlayRefresh', this.onOverlayRefresh);
            $(this.map.eventPane).off('measurementstylechanged', this.onMeasurementStyleChanged);
        },
        
        /**
         * Установить ярлык
         * @method setPointHint
         * @public
         */
        // ===============================================================
        setPointHint: function(number, subject) {
            
            var type = this.param.type;
            
            var end, count = this.editobject.geometry.count(subject),
                css = '.ruler-point-close' + '.' + type;
            number = (!number) ? 0 : number;
            if (type != 'Angle' && (number <= 1 ||
                (type == 'Polygon' && number <= 2 && count <= 4))) {
                end = true;
                //return;
            }
            subject = (!subject) ? 0 : subject;
            
            // Найдем координаты точки и пересчитаем в координаты экрана
            var point = this.editobject.geometry.getpoint(number, subject), plane;
            if (point.x != undefined && point.y != undefined) {
                // plane = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng(point.x, point.y));
                plane = GWTK.tileView.geo2pixelOffsetMap(this.map, GWTK.toLatLng(point.x, point.y));
            }
            
            
            if (!plane) {
                return;
            }
            
            var map = this.map;
            var matrix = GWTK.tileView.getTileMatrixSize(map);
            if (map.getWindowSize()[0] >= matrix.width) {                  // размер окна больше ширины матрицы
                var bbox_geo = map.getMapGeoBounds();
                var bbox = [-180, -90, 180, 90];
                if (bbox_geo.SW.lng - bbox[0] > 120) {
                    plane["x"] += matrix.width;
                }
            }
            
            var d = ' ', ruler = this,
                $drawpanel = (this.action) ? $(this.drawpanel) : $(this.map.overlayPane);
            
            if (point.h != 0) {
                switch (type) {
                    case 'Angle':
                        d = this.map.angleRadToUnits(point.h).text;
                        var el = $drawpanel.parent().find(css);
                        if (el && el.length > 0) {
                            for (var i = 0; i < el.length; i++) {
                                if (el[i].id == subject.toString())
                                    $(el[i]).parent().remove();
                            }
                        }
                        //d = (Math.round(point.h * 10000) / 10000).toString() + "°";  // В десятичных градусах с точностью до 4 знаков
                        break;
                    case 'Length':
                        d = (number).toString() + ') ' + this.map.linearMetersToUnits(point.h).text;
                        end = (count == number);
                        break;
                    case 'Polygon':
                        d = 'S = ' + this.map.squareMetersToUnits(point.h).text;
                        end = (count - 1 == number);
                        break;
                    default:
                        d = (number).toString() + ') ' + point.h.toString();
                        break;
                }
            }
            if (point.h == 0)
                d = ' ';
            
            // Удалим, если последняя точка
            //var css = '.ruler-point-close' + '.' + this.param.type;
            if (end)
                $drawpanel.parent().find(css).parent().parent().remove();
            
            var text =
                '<div class="hintpoints' + type + '" >' +
                '<div id= "' + this.hintclassName + number + '" class="' + this.hintclassName + ' ' + this.name + ' ui-widget-content" style="left:' + plane.x + 'px; top:' + plane.y + 'px;" ><span style="color:Gray;">' +
                d + '</span>&nbsp;';
            if (end || type == 'Angle')
                text += '<img id="' + subject + '" class="ruler-point-close' + ' ' + type + '" title="' + w2utils.lang("Delete") + '" src="' + GWTK.imgClose + '" align="absmiddle" ></img>';
            else
                text += '<img id="' + number + '" class="ruler-point-removepoint' + ' ' + type + '" title="' + w2utils.lang("Remove point") + '" src="' + GWTK.imgClose + '" align="absmiddle" ></img>';
            
            text += '</div>' +
                '</div>';
            
            if (this.action)
                $drawpanel.parent().append(text);
            else
                $drawpanel.append(text);
            
            var $hitpoints = $('.hintpoints' + type);
            // Удаление пути
            $hitpoints.find('#' + subject).click(function(event) {
                ruler.clearPath(subject);
            });
            
            // Удаление точки
            $hitpoints.find('#' + number).click(function(event) {
                if (type != 'Angle')
                    ruler.removePoint(this.id);
            });
        },
        
        /**
         * Удалить ярлык
         * @method removePointHint
         * @private
         */
        // ===============================================================
        removePointHint: function(number, end) {
            if (end) {
                $(this.drawpanel).parent().find('.' + this.hintclassName + '.' + this.name + '.ui-widget-content').remove();
                $(this.map.overlayPane).find('.' + this.hintclassName + '.' + this.name + '.ui-widget-content').remove();
            }else{
                var $el = this.findPointHint(number);
                if ($el)
                    $el.remove();
            }
        },
        
        
        /**
         * Найти ярлык
         * @method findPointHint
         * @private
         */
        // ===============================================================
        findPointHint: function(number) {
            var $el = $('.hintpoints' + this.param.type).find('#' + number).parent().parent();
            if ($el && $el.length > 0)
                return $el;
        },
        
        /**
         * Запрос информации (длины, площади, угла) по объекту
         * @method getInfo
         * @private
         * @param number {int} номер точки контура с 1
         * @param subject {int} номер контура с 0
         */
        // ===============================================================
        getInfo: function(number, subject) {
            if (this.param.type == 'Angle')
                this.getAngleInfo(subject);
            else
                return this.getFeatureInfo(number);
        },
        
        /**
         * Запрос угла
         * @method getAngleInfo
         * @private
         * @param subject {int} номер контура с 0
         * @return {float} - угол в радианах
         */
        // ===============================================================
        getAngleInfo: function(subject) {
            if (this.editobject.geometry.count(subject) != 3)
                return 0;
            
            var points = this.editobject.geometry.getpoints(subject);
            var planepoints = [], plane;
            for (var i = 0; i < points.length; i++) {
                //point = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng([points[i].x, points[i].y]));
                plane = GWTK.projection.geo2xy(this.map.options.crs, points[i].x, points[i].y);  // метры в проекции матрицы
                planepoints.push(new GWTK.Point(plane[0], plane[1]));
            }
            
            var angle = this.measureVectorAngle(new GWTK.Point(planepoints[0].x, planepoints[0].y),
                new GWTK.Point(planepoints[1].x, planepoints[1].y),
                new GWTK.Point(planepoints[2].x, planepoints[2].y));
            points[1].h = angle;
            this.setPointHint(2, subject);
        },
        
        
        /**
         * Расчет внутреннего угла B (в градусах) между векторами AB и BC
         * @method measureVectorAngle
         * @private
         */
        // ===============================================================
        measureVectorAngle: function(pointA, pointB, pointC) {
            var angle = 0;
            if (pointA instanceof GWTK.Point == false ||
                pointB instanceof GWTK.Point == false ||
                pointC instanceof GWTK.Point == false)
                return angle;
            var a = pointB.distanceTo(pointC),
                b = pointA.distanceTo(pointC),
                c = pointA.distanceTo(pointB);
            if (a == 0 || b == 0 || c == 0)
                return angle;
            
            // угол в радианах B:
            angle = (a * a + c * c - b * b) / (a * c * 2);
            if (Math.abs(angle) > 1)
                return angle;
            
            angle = Math.acos(angle);
            //angle = (angle * 180) / Math.PI;
            return angle;
        },
        
        /**
         * Запрос информации (длины, площади) по объекту
         * @method getInfo
         * @private
         * @param number {int} номер точки контура с 1
         */
        // ===============================================================
        getFeatureInfo: function(number) {
            if (this.editobject.geometry.count() < 2)
                return false;
            
            this.editobject.saveJSON();
            this.number = (!number) ? this.editobject.geometry.count() : number;
            //var numberlocal = (!number) ? this.editobject.geometry.count() : number;
            
            
            //TODO: перейти на GeoJSON
            var geometryObject = this.editobject.geometry;
            var type = (geometryObject.mapobject.spatialposition) ? geometryObject.mapobject.spatialposition : geometryObject.spatialposition;
            if (type.toLowerCase() === 'linestring' && this.GeoJson && this.GeoJson.features && this.GeoJson.features.length > 0) {
                //вычисление расстояния по ортодромии точек для линейного объекта
                var restoreType = type;
                geometryObject.mapobject.spatialposition = 'linesrting_geojson';
                var features = this.GeoJson.features, coords = [];
                for (var i = 0; i < features.length; i++) {
                    if (i < this.number - 1)
                        coords = coords.concat(features[i].geometry.coordinates);
                }
                var geometry = { coordinates: coords };
            }else{
                //вычисление расстояния по прямым между точками для линейного объекта
                geometry = this.editobject.oJSON.features[0].geometry;
            }
            
            var strgeometrys = this.editobject.geometry.pointsToXmlString(geometry, null, this.number);
            
            //Если определяли по ортодромии - восстанавливаем тип
            if (restoreType) {
                geometryObject.mapobject.spatialposition = restoreType;
            }
            
            //// Просто пустой шаблон, пока не отработает запрос
            //this.editobject.geometry.getpoint(this.number).h = 0;
            //this.setPointHint(this.number);
            
            if (!strgeometrys || strgeometrys.length == 0)
                return;
            
            // var feature = '<?xml version="1.0" encoding="utf-8"?>' +
            //     '<wfs:FeatureCollection version="2.0.0" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:fes="http://www.opengis.net/fes/2.0"  xmlns:gml="http://www.opengis.net/gml/3.2.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0.0/wfs.xsd http://www.opengis.net/gml/3.2 http://www.opengis.net/gml/3.2.1/gml.xsd"' +
            //     ' numberMatched="1" numberReturned="1">' +
            //     '<wfs:member><gml:Value>' +
            //     strgeometrys[0] +
            //     '</gml:Value></wfs:member></wfs:FeatureCollection>';
            
            //var ids = this.map.tiles.getSelectableLayers();
            //ids = ids.split(',');
            //ids = ids[0];
            // var ids = [];
            
            // this.wfsQuerys.push(new WfsQueries(this.map.options.url, this.map));
            // var l = this.wfsQuerys.length;
            // this.wfsQuerys[l - 1].onDataLoad = this.infoResponse;
            // this.wfsQuerys[l - 1].number = this.number;
            // this.wfsQuerys[l - 1].task = this;
            // this.wfsQuerys[l - 1].index = l - 1;
            // this.wfsQuerys[l - 1].context = this.wfsQuerys[l - 1];
            // this.wfsQuerys[l - 1].areafeature(ids, feature, false);
            const httpParams = GWTK.RequestServices.createHttpParams(this.map);
            const wfs = GWTK.RequestServices.retrieveOrCreate(httpParams, 'REST');
            
            const doc = new GWTK.XMLElement('document', '<?xml version="1.0" encoding="utf-8"?>');
            const wfsFeatureCollection = new GWTK.XMLElement('wfs:FeatureCollection', undefined, {
                'version': '2.0.0',
                'xmlns:wfs': 'http://www.opengis.net/wfs/2.0',
                'xmlns:fes': 'http://www.opengis.net/fes/2.0',
                'xmlns:gml': 'http://www.opengis.net/gml/3.2.1',
                'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                'xsi:schemaLocation': 'http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0.0/wfs.xsd http://www.opengis.net/gml/3.2 http://www.opengis.net/gml/3.2.1/gml.xsd',
                'numberMatched': '1',
                'numberReturned': '1'
            });
            const wfsMember = new GWTK.XMLElement('wfs:member');
            const gmlValue = new GWTK.XMLElement('gml:Value', strgeometrys[0]);
            wfsMember.addChild(gmlValue);
            wfsFeatureCollection.addChild(wfsMember);
            doc.addChild(wfsFeatureCollection);
    
            wfs.getArea(undefined, { data: doc.toString() }).then((result) => {
                if (result.data) {
                    this.infoResponse(result.data, this.number);
                }
            })
        },
        
        
        
        /**
         * Ответ от сервиса
         * @method infoResponse
         * @private
         */
        infoResponse: function(response, context) {
            // if (!context && context instanceof GWTK.wfsQuerys == false)
            //     return;
            
            // var task = context.task;
            // if (!task || task instanceof GWTK.RulerTask == false)
            //     return;
            
            var xmlDoc = $.parseXML(response),
                xml = $(xmlDoc);
            // удалим hint
            if (!xml.context) {
                return;
            }
            var elem = xml.context.documentElement,
                length = $(elem).find('Perimeter'),
                area = $(elem).find('Area'),
                Area, Length;
            
            if (length && length.length > 0)
                // Length = parseInt(length.text());
                Length = parseFloat(length.text());
            if (area && area.length > 0)
                //Area = parseInt(area.text());
            Area = parseFloat(area.text());

            var point = this.editobject.geometry.getpoint(context);
            if (this.param.type == 'Length' && Length) {
                point.h = Length;
                this.editobject.geometry.updatepoint(context, this.subjectnumber, point);
            }else if (this.param.type == 'Polygon' && Area) {
                point.h = Area;
                this.editobject.geometry.updatepoint(context, this.subjectnumber, point);
            }
            
            this.setPointHint(context);
            // task.wfsQuerys[context.index] = null;
            
            // Удалим массив запросов
            // var find = task.wfsQuerys.find(
            //     function(element, index, array) {
            //         if (element !== null)
            //             return element;
            //     });
            // if (!find) {
            //     task.wfsQuerys = [];
            // }
        },
        
        
        /**
         * Парсинг координат ломаной
         * @method parseCoord
         * @private
         * @param coord {String} строка координат ломаной через запятую
         * @return {Array} массив координат ломаной
         */
        // ===============================================================
        parseCoord: function(coord) {
            if (!coord || coord == null || coord.length == 0) return null;
            var bl = coord.split(',');
            if (bl.length < 2) return null;
            var res = [];
            while (bl.length > 0) {
                var pair = [bl.shift(), bl.length > 0 ? bl.shift() : null];
                if (pair[0] == null || pair[1] == null) break;
                res.push(pair);
            }
            return res;
        },
        
        /**
         * Добавить точку в координатах экрана в объект
         * @method addpoint
         * @public
         * @param x {int} координата по оси х
         * @param y {int} координата по оси y
         * @param nooffset {boolean} Не пересчитывать смещение координат
         */
        // ===============================================================
        addpoint: function(x, y, nooffset) {
            if (!this.editobject.geometry)
                return;
            
            var count, geo = this.topology.pixel2geoOffset(x, y, nooffset);
            if (!geo) return;
            
            var newpoint = new GWTK.Point3D(geo[0], geo[1], 0),
                number = this.editobject.geometry.count(this.subjectnumber),
                lastpoint = (number) ? this.editobject.geometry.getpoint(number, this.subjectnumber) : { x: 0, y: 0, h: 0 };
            
            if (newpoint.x == lastpoint.x && newpoint.y == lastpoint.y)
                return;
            
            if (this.param.type == 'Length' || this.param.type == 'Angle') {
                this.editobject.geometry.appendpoint3D(newpoint.x, newpoint.y, newpoint.h, this.subjectnumber);
                this.updateBackground();
            }else{
                if (this.param.type == 'Polygon') {
                    if (number == 2) // Замкнем
                        this.editobject.geometry.closeobject(false, this.subjectnumber);
                    else if (number >= 3) {
                        // Удалим последнюю точку
                        this.editobject.geometry.deletepoint(number, this.subjectnumber);
                    }
                    this.editobject.geometry.appendpoint3D(newpoint.x, newpoint.y, newpoint.h, this.subjectnumber);
                }
            }
            
            count = this.editobject.geometry.count(this.subjectnumber);
            if (count > 1)
                this.getInfo(count, this.subjectnumber);
            else
                this.setPointHint(count, this.subjectnumber);
            
            this._writeCookie();
            // Если измерение углов, то добавим подобъект
            if (this.param.type == 'Angle' && count == 3) {
                this.editobject.geometry.addsubject();
                this.subjectnumber += 1;
            }
            
        },
        
        ///**
        // * Перевод из координат экрана в геодезические координаты
        // * @method pixel2geoOffset
        // * @private
        // * @param x {int} координата по оси х
        // * @param y {int} координата по оси y
        // * @param nooffset {Boolean} Не пересчитывать смещение координат
        // * @returns {Array} Двухмерный массив [b, l]
        // */
        //// ===============================================================
        //pixel2geoOffset: function (x, y, nooffset) {
        //    if (!x || !y ) return;
        //    var rect = this.drawpanel.getBoundingClientRect(), p;
        //    if (!nooffset)
        //        p = GWTK.point(x - rect.left, y - rect.top);
        //    else
        //        p = GWTK.point(x, y);
        //    var coord = this.map.tiles.getLayersPointProjected(p);
        //    if (coord)
        //        return GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
        //},
        
        /**
         * Создание панели для рисования объекта
         * @method createdrawpanel
         * @public
         */
        // ===============================================================
        getdrawpanel: function() {
            return this.drawpanel;
        },
        
        
        /**
         * Функция отрисовки редактируемого объекта с габаритной рамкой
         * @method draw
         * @public
         */
        draw: function(svg) {
            this.drawobject.draw(this.editobject, svg, true, this.drawobject.drw_centerpoints);
            // if (this.editobject.geometry.count() == 0) return;
        },
        
        /**
         * Событие на перерисовку карты
         * @method  onOverlayRefresh
         * @private
         * @param event {Object} Событие
         */
        // ===============================================================
        onOverlayRefresh: function(event) {
            if (this.drawpanel) {
                this.drawpanel.style.left = '0px';
                this.drawpanel.style.top = '0px';
            }
            
            // Обновим hint
            this.updatePointsHint(this.editobject.geometry.count(), null, null, true);
            
            this.topology.searchObjectsByAreaFrame(null, null, 'edit');
            
            // Затычка для масштабирования, событие mouseover для svg назначается раньше,
            // чем wms панель стала видимой после стирания временной панели.
            if (this.topology) {
                this.topology.updateSvgEvents();
            }
            
        },
        
        /**
         * Обработка события изменения стилей измерений
         * @method  onMeasurementStyleChanged
         * @private
         * @param event {Object} Событие
         */
        onMeasurementStyleChanged: function(event) {
            
            if (this.map.options.measurementstyle) {
                this.drawobject.refreshstyle(this.map.options.measurementstyle);
                this.topology.searchObjectsByAreaFrame(null, null, 'edit');
                
                if (this.svgDraw){
                    this.svgDraw.options["stroke"] = '#' + this.map.options.measurementstyle.linecolor;
                    for (var k = 0; k < this.countCycle; k++) {
                        this.svgDrawCycle[k].options["stroke"] = '#' + this.map.options.measurementstyle.linecolor;
                    }
                    this.drawBackground();            
                }
            }
        },
        
        /**
         * Действия в процессe перемещения точки
         * @method do_draggable
         * @public
         * @param process {String} Наименование процесса "start", "drag", "stop"
         * @param target {Object} объект события по перемещению
         * @param ui {Object} Объект, содержащий смещение точки
         */
        // ===============================================================
        do_draggable: function(process, target, ui) {
            if (!this.drawobject || !this.drawpanel) return;
            
            switch (process) {
                case 'start':
                    // Oтключить события карты в топологии
                    this.topology.map_events('off');
                    break;
                
                case 'stop':
                    // Включить события карты в топологии
                    this.topology.map_events('on');
                    break;
            }
            
            return true;
        },
        
        
        /**
         * Обновление координат точки объекта
         * @method updatepoint
         * @public
         * @param div {Element} Элемент, содержащий всю информацию о точке
         * @param ui {Object} Объект, содержащий позицию точки { "position": {"left": left, "top": top };
         * @param insert {Boolean} признак вставки новой точки (для серединных точек), иначе обновление существующей
         */
        // ===============================================================
        updatepoint: function(div, ui, insert) {
            
            // Удалим сервисные линии
            this.drawobject._removeservicelines();
            
            if (!div || !ui) return;
            
            var geometry = this.editobject.geometry;
            if (!geometry) return;
            
            // Сместим относительно родительского окна
            //var rect = this.drawpanel.getBoundingClientRect();
            //ui.position.left -= rect.left;
            //ui.position.top -= rect.top;
            
            var number = this.drawobject.getnumber(div.id);
            if (number < 0) return;
            
            var geo,
                point = GWTK.point(ui.position.left, ui.position.top),
                coord = this.map.tiles.getLayersPointProjected(point),
                subjectnumber = this.drawobject.getsubjectnumber(div.id);
            
            // Если выбрана точка в классе топологии, ио взять ее координаты
            if (this.topology.currentPoint)  // Если имеется выбранная точка, то добавим ее
                geo = this.topology.getpointgeo(this.topology.currentPoint);
            else
                geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
            if (!geo) return;
            
            if (insert) {// вставить точку
                geometry.insertpoint3D(geo[0], geo[1], 0, number + 1, subjectnumber);
            }else{      // обновить точку
                geometry.updatepoint(number + 1, subjectnumber, new GWTK.Point3D(geo[0], geo[1], 0));
                if (this.param.type == 'Polygon')
                    geometry.closeobject(true, subjectnumber);
            }
            
            this.drawobject.refreshdraw();
            
            // обновим точки
            this.updatePoints(number + 1, subjectnumber, insert);
            
            this.drawBackground();
        },
        
        
        /**
         * Контекстное меню для точки объекта
         * @method popupmenu
         * @private
         * @param div {Element} - Родительский элемент
         * @param x {int} - Координата экрана x
         * @param y {int} - Координата экрана y
         */
        // ===============================================================
        popupmenu: function(div, x, y) {
            // Включим обработку событий
            var ruler = this;
            window.setTimeout(function() {
                ruler.topology.map_events('on');
            }, 700);
            
            if (!div || div.id.indexOf('center') >= 0 || !this.editobject || !this.drawobject) // если это средняя точка
                return;
            
            var number = this.drawobject.getnumber(div.id),
                count = this.editobject.geometry.count();
            
            // Если первая или последняя
            if (number == 0 || number == count - 1)
                return;
            number += 1;
            
            // удалить, если еще раз попали на эту точку
            var $el = this.findPointHint(number);
            if ($el) {
                $el.remove();
                return;
            }
            
            var point = this.editobject.geometry.getpoint(number);
            // Для измерения длины
            if (this.param.type == 'Length') {
                if (point.h != 0)
                    this.setPointHint(number);
                else
                    this.getInfo(number);
            }else{
                point.h = 0;
                this.setPointHint(number);
            }
        },
        
        /**
         * Отрисовка фонового GeoJSON
         * @method drawBackground
         * @private
         */
        drawBackground: function() {
            if (!this.svgDraw)
                return;
            
            if (this.GeoJson && this.GeoJson.features && this.GeoJson.features.length > 0) {
                this.clearBackGround();
                this.svgDraw.draw(this.GeoJson);
            }
            
            if (this.GeoJsonCycle) {
                for (var k = 0; k < this.countCycle; k++) {
                    if (this.svgDrawCycle && this.svgDrawCycle[k]) {
                        this.svgDrawCycle[k].draw(this.GeoJsonCycle[k]);
                    }
                }
            }
        },
        
        /**
         * Удаление фонового рисунка
         * @method clearBackGround
         * @private
         */
        clearBackGround: function() {
            if (!this.svgDraw)
                return;
            this.svgDraw.clearDraw();
            
            for (var k = 0; k < this.countCycle; k++) {
                this.svgDrawCycle[k].clearDraw();
            }
        },
        
        /**
         * Удаление объектов фонового рисунка
         * @method clearBackGroundPoints
         * @private
         */
        clearBackGroundPoints: function() {
            this.GeoJson = null;
            this.clearBackGround();
            this.GeoJsonCycle = null;
        },
        
        /**
         * Обновление состава объектов фонового GeoJSON
         * @method updateBackground
         * @private
         */
        // updateBackground: function () {
        //     if (!this.mapcalcObject)
        //         return;
        //
        //     var bbox = [0,0,0,0];
        //     if (this.GeoJson) {
        //         this.GeoJson.features = [];
        //     }
        //     else {
        //         this.GeoJson = {
        //             "type": 'FeatureCollection',
        //             // "bbox": [-180, -90, 180, 90],
        //             "features": []
        //         };
        //     }
        //
        //     var points = this.editobject.geometry.points,
        //         lastpoint, newpoint, fbbox = [], fbbox2 = [];
        //
        //     for (var i = 1; i < points.length; i++) {
        //         lastpoint = this.editobject.geometry.getpoint(i);
        //         newpoint = this.editobject.geometry.getpoint(i + 1);
        //
        //         fbbox[0] = Math.min(lastpoint.y, newpoint.y);
        //         fbbox[1] = Math.min(lastpoint.x, newpoint.x);
        //         fbbox[2] = Math.max(lastpoint.y, newpoint.y);
        //         fbbox[3] = Math.max(lastpoint.x, newpoint.x);
        //
        //         var coords = this.mapcalcObject.buildOrthodromy(lastpoint.x, lastpoint.y, newpoint.x, newpoint.y);
        //
        //         // console.log('lastpoint = ', lastpoint);
        //         // console.log('newpoint = ', newpoint);
        //         // console.log('coords = ', coords);
        //
        //         if (coords) {
        //
        //             // Определимся
        //             // Нормализуем точки для расчета
        //             var flag = false;
        //             if (lastpoint.y > 0 && newpoint.y < 0 || lastpoint.y < 0 && newpoint.y > 0 ) {
        //                 if (newpoint.y < 0) {
        //                     newpoint.y = 360.0 + newpoint.y;
        //                 }
        //                 if (lastpoint.y < 0) {
        //                     lastpoint.y = 360.0 + lastpoint.y;
        //                 }
        //                 //flag = newpoint.y - lastpoint.y;
        //                 // console.log('flag = ' + flag);
        //                 flag = (Math.abs(newpoint.y - lastpoint.y) < 180) ? false : true;
        //             }
        //
        //             // Нормализация для канады - европы
        //             if (flag) {
        //                 for (var j = 0; j < coords.length; j++) {
        //                     if (coords[j][0] < -180) {
        //                         coords[j][0] = coords[j][0] + 360.0;
        //                     }
        //                     if (coords[j][0] > 180) {
        //                         coords[j][0] = coords[j][0] - 360.0;
        //                     }
        //                 }
        //                 // console.log('coordsNorm = ', coords);
        //             }
        //
        //             // Разделим на две части
        //             var coords1 = [], coords2 = [];
        //             var delta = false;
        //             for (var j = 0; j < coords.length - 1; j++) {
        //                 if ((coords[j][0] < 0 && coords[j + 1][0] > 0 ||
        //                     coords[j][0] > 0 && coords[j + 1][0] < 0) ||
        //                     coords2.length > 0) {
        //                     if (delta == false) {
        //                         if (Math.abs(coords[j][0] - coords[j + 1][0]) > 350) {
        //                             delta = true;
        //                         }
        //                     }
        //                     coords2.push(coords[j + 1]);
        //                 }
        //                 else {
        //                     coords1.push(coords[j]);
        //                 }
        //             }
        //
        //             // Сделаем обратную нормализацию
        //             if (delta) {
        //                 if (coords2.length > 0) {
        //                     if (coords2[0][0] > 0) {
        //                         for (var j = 0; j < coords2.length ; j++) {
        //                             coords2[j][0] -= 360.0;
        //                         }
        //                     }
        //                     else {
        //                         for (var j = 0; j < coords1.length; j++) {
        //                             coords1[j][0] -= 360.0;
        //                         }
        //                     }
        //                 }
        //             }
        //
        //             // console.log('coords1 = ', coords1);
        //
        //             fbbox[0] = Math.min(coords1[0][0], coords1[coords1.length - 1][0]);
        //             fbbox[1] = Math.min(coords1[0][1], coords1[coords1.length - 1][1]);
        //             fbbox[2] = Math.max(coords1[0][0], coords1[coords1.length - 1][0]);
        //             fbbox[3] = Math.max(coords1[0][1], coords1[coords1.length - 1][1]);
        //
        //             // bbox[0] = Math.min(fbbox[0], bbox[0]);
        //             // bbox[1] = Math.min(fbbox[1], bbox[1]);
        //             // bbox[2] = Math.max(fbbox[2], bbox[2]);
        //             // bbox[3] = Math.max(fbbox[3], bbox[3]);
        //
        //             this.GeoJson["features"].push({
        //                 "type": "Feature",
        //                 "bbox": fbbox,
        //                 "geometry": {
        //                     "type": "LineString",
        //                     "coordinates": coords1
        //                     //"coordinates": coords
        //                 },
        //                 "properties": {
        //                     "id": i + 1 + ""
        //                 }
        //             });
        //
        //             if (coords2.length > 0) {
        //                 fbbox2[0] = Math.min(coords2[0][0], coords2[coords2.length - 1][0]);
        //                 fbbox2[1] = Math.min(coords2[0][1], coords2[coords2.length - 1][1]);
        //                 fbbox2[2] = Math.max(coords2[0][0], coords2[coords2.length - 1][0]);
        //                 fbbox2[3] = Math.max(coords2[0][1], coords2[coords2.length - 1][1]);
        //
        //                 // bbox[0] = Math.min(fbbox2[0], bbox[0]);
        //                 // bbox[1] = Math.min(fbbox2[1], bbox[1]);
        //                 // bbox[2] = Math.max(fbbox2[2], bbox[2]);
        //                 // bbox[3] = Math.max(fbbox2[3], bbox[3]);
        //
        //                 // console.log('coords2 = ', coords2);
        //                 this.GeoJson["features"].push({
        //                     "type": "Feature",
        //                     "bbox": fbbox2,
        //                     "geometry": {
        //                         "type": "LineString",
        //                         "coordinates": coords2
        //                         //"coordinates": coords
        //                     },
        //                     "properties": {
        //                         "id": i + 1 + "coord2"
        //                     }
        //                 });
        //             }
        //
        //         }
        //     }
        //
        //     // this.GeoJson.bbox = bbox;
        //     // console.log('this.GeoJson = ', this.GeoJson);
        // }
        
        updateBackground: function() {
            if (!this.mapcalcObject)
                return;
            
            var bbox = [0, 0, 0, 0];
            
            if (this.GeoJson) {
                this.GeoJson.features = [];
            }else{
                this.GeoJson = {
                    "type": 'FeatureCollection',
                    // "bbox": [-180, -90, 180, 90],
                    "features": []
                };
            }
            
            // Зациклим ортодромию
            if (!this.GeoJsonCycle) {
                this.GeoJsonCycle = [];
            }
            
            for (var k = 0; k < this.countCycle; k++) {
                this.GeoJsonCycle[k] = {
                    "type": 'FeatureCollection',
                    // "bbox": [0,0,0,0],
                    "features": []
                };
            }
            
            var points = this.editobject.geometry.points,
                lastpoint, newpoint, fbbox = [], fbbox2 = [];
            
            for (var i = 1; i < points.length; i++) {
                lastpoint = this.editobject.geometry.getpoint(i);
                newpoint = this.editobject.geometry.getpoint(i + 1);
                
                fbbox[0] = Math.min(lastpoint.y, newpoint.y);
                fbbox[1] = Math.min(lastpoint.x, newpoint.x);
                fbbox[2] = Math.max(lastpoint.y, newpoint.y);
                fbbox[3] = Math.max(lastpoint.x, newpoint.x);
                
                var coords = this.mapcalcObject.buildOrthodromy(lastpoint.x, lastpoint.y, newpoint.x, newpoint.y);
                if (coords) {
                    
                    // Разделим на две части
                    var coords_add1 = [], coords_add2 = [];
                    var delta = false;
                    for (var j = 0; j < coords.length - 1; j++) {
                        if ((coords[j][0] < 0 && coords[j + 1][0] > 0 ||
                            coords[j][0] > 0 && coords[j + 1][0] < 0) ||
                            coords_add2.length > 0) {
                            if (delta == false) {
                                if (Math.abs(coords[j][0] - coords[j + 1][0]) > 350) {
                                    delta = true;
                                }
                            }
                            coords_add2.push(coords[j + 1]);
                        }else{
                            coords_add1.push(coords[j]);
                        }
                    }
                    
                    fbbox[0] = Math.min(coords[0][0], coords[coords.length - 1][0]);
                    fbbox[1] = Math.min(coords[0][1], coords[coords.length - 1][1]);
                    fbbox[2] = Math.max(coords[0][0], coords[coords.length - 1][0]);
                    fbbox[3] = Math.max(coords[0][1], coords[coords.length - 1][1]);
                    
                    bbox[0] = Math.min(fbbox[0], bbox[0]);
                    bbox[1] = Math.min(fbbox[1], bbox[1]);
                    bbox[2] = Math.max(fbbox[2], bbox[2]);
                    bbox[3] = Math.max(fbbox[3], bbox[3]);
                    
                    this.GeoJson["features"].push({
                        "type": "Feature",
                        "bbox": fbbox,
                        "geometry": {
                            "type": "LineString",
                            //"coordinates": coords
                            "coordinates": coords_add1
                        },
                        "properties": {
                            "id": i + 1 + "coords_add1"
                        }
                    });
                    
                    if (coords_add2 && coords_add2.length > 0) {
                        this.GeoJson["features"].push({
                            "type": "Feature",
                            "bbox": fbbox,
                            "geometry": {
                                "type": "LineString",
                                //"coordinates": coords1
                                "coordinates": coords_add2
                            },
                            "properties": {
                                "id": i + 1 + "coords_add2"
                            }
                        });
                    }
                    
                    // Зациклим ортодромию
                    var fbboxCircle = [], coordsCycle = [],
                        delta = -(360.0 * this.countCycle / 2);
                    for (var k = 0; k < this.countCycle; k++) {
                        coordsCycle.push(
                            [
                                coords_add1.map(function(value) {
                                    return [value[0] + delta, value[1]];
                                }),
                                coords_add2.map(function(value) {
                                    return [value[0] + delta, value[1]];
                                })])
                        delta += 360.0
                        
                        this.GeoJsonCycle[k]["features"].push({
                            "type": "Feature",
                            //"bbox": fbbox1,
                            "geometry": {
                                "type": "LineString",
                                "coordinates": coordsCycle[k][0]
                            },
                            "properties": {
                                "id": i + 1 + "_" + k + "0"
                            }
                        });
                        this.GeoJsonCycle[k]["features"].push({
                            "type": "Feature",
                            //"bbox": fbbox1,
                            "geometry": {
                                "type": "LineString",
                                "coordinates": coordsCycle[k][1]
                            },
                            "properties": {
                                "id": i + 1 + "_" + k + "1"
                            }
                        });
                    }
                    // fbbox1[0] = Math.min(coords1[0][0], coords1[coords1.length - 1][0]);
                    // fbbox1[1] = Math.min(coords1[0][1], coords1[coords1.length - 1][1]);
                    // fbbox1[2] = Math.max(coords1[0][0], coords1[coords1.length - 1][0]);
                    // fbbox1[3] = Math.max(coords1[0][1], coords1[coords1.length - 1][1]);
                    //
                    // bbox1[0] = Math.min(fbbox1[0], bbox1[0]);
                    // bbox1[1] = Math.min(fbbox1[1], bbox1[1]);
                    // bbox1[2] = Math.max(fbbox1[2], bbox1[2]);
                    // bbox1[3] = Math.max(fbbox1[3], bbox1[3]);
                    
                }
            }
            
            this.GeoJson.bbox = bbox;
            // this.GeoJson1.bbox = bbox1;
            // this.GeoJson2.bbox = bbox2;
            // console.log('this.GeoJson = ', this.GeoJson);
        }
        
    };
    GWTK.Util.inherits(GWTK.RulerTask, GWTK.MapTask);
    
    
    /**
     * Обработчик создания объекта карты
     * @class GWTK.RulerAction
     * @constructor GWTK.RulerAction
     */
    GWTK.RulerAction = function(task, name) {
        this.error = true;
        
        GWTK.MapAction.call(this, task, name);           // родительский конструктор
        
        this.editobject = this.task.editobject;
        if (!this.editobject) return;
        
        this.drawobject = this.task.drawobject;
        if (!this.drawobject) return;
        
        this.drawpanel = this.task.drawpanel;
        if (!this.drawpanel) return;
        
        // Запросим объекты окружения, если их нет
        this.topology = this.task.topology;
        if (!this.topology) return;
        this.topology.searchObjectsByAreaFrame(null, [], "edit");
        
        // Замыкание контекста
        this.onMouseDown = GWTK.Util.bind(this.onMouseDown, this);
        
        this.error = false;
        
    };
    
    GWTK.RulerAction.prototype = {
        
        /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
         * @method set
         * @public
         * @param options {Object} параметры обработчика
         */
        // ===============================================================
        set: function(options) {
            
            var $drawpanel = $(this.drawpanel);
            this.task.subjectnumber = 0;
            var parent = $drawpanel.parent(), map = this.getMap();
            
            // Поднять панель рисования
            this.zIndexDrawPanel('up', this.drawpanel);
            
            // переопределить клики для планшетов    ?????
            $drawpanel.off("touchstart", map.handlers.touchStart);   // аналог onmousedown
            $drawpanel.off("touchmove", map.handlers.touchMove);     // аналог onmousemove
            $drawpanel.off("touchend", map.handlers.touchEnd);       // аналог onmouseup
            
            // клик на карте
            map.on({ type: "click", target: "map", phase: 'before' }, this.onMouseDown);
            
            // Перенести на другую панель
            this.changepanel($(map.overlayPane), parent);
            
            // Параметры для рисования
            this.drawobject.initparam({
                'nocontextmenu': true,   // не отображать конткстное меню
                'func': {
                    'fn_draggable': this.task.do_draggable,
                    'fn_downpoint': (this.task.param.type != 'Length') ? null : this.task.popupmenu,
                    'fn_updatepoint': this.task.updatepoint,
                    'fn_parentpanel': this.task.getdrawpanel
                }
            });
            
        },
        
        /**
         * Сбросить настройки (отключение обработчиков событий, инициализация флажков и др.)
         * @method clear
         * @public
         */
        // ===============================================================
        clear: function() {
            
            var $drawpanel = $(this.drawpanel), map = this.getMap();
            // клик на карте
            map.off({ type: "click", target: "map", phase: 'before' }, this.onMouseDown);
            
            // переопределить клики для планшетов    ?????
            $drawpanel.on("touchstart", map.handlers.touchStart);   // аналог onmousedown
            $drawpanel.on("touchmove", map.handlers.touchMove);     // аналог onmousemove
            $drawpanel.on("touchend", map.handlers.touchEnd);       // аналог onmouseup
            
            //опустить панель рисования
            this.zIndexDrawPanel('down', this.drawpanel);
            
            GWTK.DomUtil.removeActiveElement(".button-action");
            this.task.action = null;
            
            // Перенести на другую панель
            this.changepanel($drawpanel.parent(), $(map.overlayPane));
            if (this.task.param.type == 'Angle') {
                this.editobject.geometry.clear();
                this.drawobject.refreshdraw();
            }
            
            // Параметры для рисования
            this.drawobject.clearparam();
        },
        
        /**
         * Поднять/опустить zIndex панели рисования и родительской панели
         * @method zIndexDrawPanel
         * @public
         */
        zIndexDrawPanel: function(type, selector) {
            // var $drawpanel = $(selector);
            var $parent = $(selector).parent();
            
            // поднять
            if (type == 'up') {
                this.zIndex = $parent.css('zIndex');
                $parent.css('zIndex', '710');
                $('#mapobject-overlayPane_' + this.editobject.gid).css('zIndex', '710');
            }else{
                $parent.css('zIndex', this.zIndex);
                $parent.children().css('zIndex', this.zIndex);
            }
        },
        
        
        /**
         * Сменить панель
         * @method changepanel
         * @public
         */
        changepanel: function(source, receiver) {
            if (!source || !receiver) return;
            
            var css = '.ruler-point-close' + '.' + this.task.param.type,
                ruler = this.task, id,
                el = source.find(css).parent().parent();
            if (!el || el.length == 0) return;
            
            if (el.length == 1) {
                var className = el[0].className;
                // id = el.find(css).attr('id');
                if (this.task.param.type != 'Angle') {
                    receiver.append('<div class="' + className + '">' + el.html() + '</div>');
                    receiver.find(css).click(function(event) {
                        ruler.clearPath();
                    });
                }
            }
            
            // Удалим метку удаления пути со исходной панели
            el.remove();
            
            // Удалим все метки с панели, используемой непосредственно для рисования
            if (source.attr('id') == "drawPane") {
                el = $(this.drawpanel).parent().find('.hintpoints' + this.task.param.type);
                if (el && el.length > 0)
                    el.remove();
            }
        },
        
        
        /**
         * Нажатие мыши при создании объекта
         * @method  onMouseDown
         * @private
         * @param e {Object} Событие
         */
        // ===============================================================
        onMouseDown: function(e) {
            if (!e) return;
            
            var ev = e.originalEvent;
            ev.map = this.task.map;
            GWTK.DomEvent.getMouseGeoCoordinates(ev);
            // var ev = e.originalEvent;
            
            if (this.drawobject.parentpanel) {
                ev.clientX -= $(this.drawobject.parentpanel()).offset().left;
                ev.clientY -= $(this.drawobject.parentpanel()).offset().top;
            }
            
            this.task.addpoint(ev.clientX, ev.clientY, true);
            this.drawobject.refreshdraw();
            this.task.drawBackground();
            
            e.stopPropagation();
            
        }
        
    };
    
    GWTK.Util.inherits(GWTK.RulerAction, GWTK.MapAction);
    
    
}