/******************************** Полищук Г.В.  ******* 12/09/18 ***
/******************************** Нефедьева О.А ******* 22/04/21 ***
/******************************** Гиман Н.Л     ******* 16/10/17 ***
/******************************** Соколова Т.O  ******* 09/11/18 ***
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2022              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                 Обработчик выбора точек карты                    *
*                                                                  *
*******************************************************************/
if (window.GWTK) {
    /**
     * Выбор точек карты кликом мыши (точка/произвольная линия)
     * @class  GWTK.PickMapPointAction
     * @constructor GWTK.PickMapPointAction
     * @param task {Object} задача
     * @param map {Object} карта GWTK.Map
     * @param options {Object} дополнительные параметры, JSON
     * {name:string,maxPointsCount:number,pointsUnit:'point'/'geo',getEachPoint:bool,moveEvent:bool,draggablePoints:bool,updateLastPoint:bool,fn_getPoints:function }
     */
    GWTK.PickMapPointAction = function (task, map, options) {

        if (options && options.name && options.name.length > 0) {
            this.name = options.name;
        }

        GWTK.MapAction.call(this, task, this.name);

        this.map = map;
        this.task = task;
        this.points = [];                                                                                         // Массив точек
        this.options = options || {};                                                                             // Дополнительные параметры
        this.maxPointsCount = this.options.maxPointsCount || 2;                                                   // Максимальное кол-во точек
        this.cycle = this.options.cycle !== undefined ? this.options.cycle : false;                               // признак "Циклическое обнуление точек"
        this.pointsUnit = (typeof this.options.pointsUnit === "string") ? this.options.pointsUnit : 'geo';        // Единицы представления точек
        this.getEachPoint = this.options.getEachPoint !== undefined ? this.options.getEachPoint : false;          // Получать координаты точeк при выборе
        this.moveEvent = this.options.moveEvent !== undefined ? this.options.moveEvent : false;                   // Генерировать событие перемещения курсора mousemove
        this.draggablePoints = this.options.draggable !== undefined ? this.options.draggable : true;              // Возможность перемещения точек
        this.updateLastPoint = this.options.updateLastPoint !== undefined ? this.options.updateLastPoint : false; // Обновление последней точки
        this.getPoints = function (point) { };                                                                    // Обработчик выбора точек
        if ($.isFunction(this.options.fn_getPoints)) {
            this.getPoints = this.options.fn_getPoints;
        }
        this.dragPointsStop = this.options.fn_dragPointsStop;                                                     // Обработчики перемещения точек
        this.dragPointsStart = this.options.fn_dragPointsStart;
        this.dragPointsDrag = this.options.fn_dragPointsDrag;
        this.dragPointsUpdate = this.options.fn_dragPointsUpdate;

        this.topology;                                                                                            // Класс топологии
        this.objectDrawing;                                                                                       // Класс рисования линий
	    this.detectClick = {
		    start: {x: 0, y: 0},
		    end: {x: 0, y: 0}
	    };
    };
    GWTK.PickMapPointAction.prototype = {
        /**
		 * Инициализация
		 * @method init
		 */
        // ===============================================================
        init: function (base, nocall) {
            if (nocall) return;
            if (!base) base = this;

            base.createDrawPanel();
            base.createMapObjectForEditingAndDrawing();
            base.createDrawObjectInstance();
            base.createTopologyInstance();
            base.setDrawObjectInstanceParam();
            base.setTopologyInstanceParam();

	        base.initEvents();
        },

        /**
		 * Настроить обработчик
		 * @method set
		 */
        // ===============================================================
        set: function (base, nocall) {
            if (nocall) { return; }
            if (!base) base = this;
            base.init();

	        this.$mapObjectPanel = $('#mapobject-overlayPane_' + base.name + '_canvas');

	        this.oldzIndex = $(base.map.drawPane).css('zIndex');
	        this.oldzIndexOverlay = base.$mapObjectPanel.parent().css('zIndex');

	        $(base.map.drawPane).css({zIndex: 707});

	        base.$mapObjectPanel.removeClass('overlay-panel');
	        base.$mapObjectPanel.addClass('overlay-panel-mappoints');
	        base.$mapObjectPanel.parent().css({zIndex: 700});
        },

        /**
		 * Очистить обработчик
		 * @method clear
		 */
        // ===============================================================
        clear: function (base, nocall) {
            if (nocall) return;

            if (!base) base = this;

            base.clearPoints();
            if (base.objectDrawing) { base.objectDrawing.destroy(); }
            if (base.topology) { base.topology.destroy(); }
            $('#mapobject-overlayPane_' + base.name + '_canvas').remove();
            base.removeDrawPanel();
            base.removeEvents();

            if (base.map) $(base.map.drawPane).css({ zIndex: base.oldzIndex });
            if (base.$mapObjectPanel) base.$mapObjectPanel.parent().css({zIndex: base.oldzIndexOverlay});
        },

        /**
		 * Очистить массив точек
		 * @method clearPoints
		 */
        // ===============================================================
        clearPoints: function () {
            this.points = [];
        },

        /**
          * Обработчик выбора точки, добавляет точки в массив
          * @method _onMapclick
          * @private
          * @param e {Object} объект события
          */
        // ===============================================================
        _onMapclick: function (e) {
            this.detectClick.end.x = e.point.x;
            this.detectClick.end.y = e.point.y;

            if(Math.abs(this.detectClick.end.x - this.detectClick.start.x) > 3
                && Math.abs(this.detectClick.end.y - this.detectClick.start.y) >3){
                return false;
            }
            var coord = [];
            if (this.pointsUnit == 'point') {
                coord = [e[this.pointsUnit].x, e[this.pointsUnit].y];
            }
            else {
                coord = e[this.pointsUnit];
            }
            if (this.points.length < this.maxPointsCount) {

                this.points.push(coord);

                if (this.getEachPoint) {
                    this.getPoints(coord);
                }
                else {
                    if (this.points.length === this.maxPointsCount)
                        this.getPoints(this.points);
                }

                if ((this.points.length === this.maxPointsCount) && this.cycle) {     // для прямой геод.задачи ????
                   this.clearPoints();
                }

                return true;
            }
            else if (this.updateLastPoint) {                                      // если установлен признак обновления последней точки

                this.points[this.points.length - 1] = coord;

                if (this.getEachPoint) {
                    this.getPoints(coord);
                }
                else {
                    this.getPoints(this.points);
                }
                return true;
            }
            return;
        },

        /**
		 * Обновить значение точки по индексу в массиве точек
         * @method updatePoint
         * @param number {Number} индекс точки в массиве точек
         * @param coord {Array} значение координат (в соответствии с установленными единицами)
         * @return {Boolean} `true` - точка обновлена, `false` - нет
		 */
        // ===============================================================
        updatePoint: function (number, coord) {

            if (!this.points || isNaN(number) || !$.isArray(coord)) {
                return;
            }
            if (number < 0 || number >= this.points.length) {
                return;
            }

            this.points[number] = coord;
            return true;
        },

        /**
		 * Назначить обработчики событий
		 * @method initEvents
		 */
        // ===============================================================
        initEvents: function () {
            $(this.map.overlayPane).on('mapclick.' + this.name, GWTK.Util.bind(this._onMapclick, this));

            //Обновление линии
            $(this.map.eventPane).on('overlayRefresh.' + this.name, GWTK.Util.bind(function (e) { this.onOverlayRefresh(e); }, this));

            if (this.moveEvent) {
                $(this.map.eventPane).on('mousemove.' + this.name, GWTK.Util.bind(function (e) {
                    var point = GWTK.DomEvent.getMousePosition(e, this.map.panes.eventPane);
                    if (this.pointsUnit === 'point') {
                        console.log(point);
                    } else {
                        var coord = this.map.tiles.getLayersPointProjected(point);
                        var geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
                        console.log(geo);
                    }
                }, this));
            }
	        $(this.drawpanel).on('mousedown', GWTK.Util.bind(function(e){
                var point = GWTK.DomEvent.getMousePosition(e, this.map.panes.eventPane);
                this.detectClick.start.x = point.x;
                this.detectClick.start.y = point.y;
	        }, this));
        },

        /**
		 * Удалить обработчики событий
		 * @method removeEventListeners
		 */
        // ===============================================================
        removeEvents: function () {
            if (this.map) {
                $(this.map.overlayPane).off('mapclick.' + this.name);
                $(this.map.eventPane).off('mousemove.' + this.name);
                $(this.map.eventPane).off('overlayRefresh.' + this.name);
            }
        },

        /**
		  * Установить параметры рисования класса GWTK.DrawingObject
          * @method setDrawObjectInstanceParam
		 */
        // ===============================================================
        setDrawObjectInstanceParam: function () {
            this.objectDrawing.drw_centerpoints = false;
            this.objectDrawing.options_points["fill"] = "#ff3322";
            this.objectDrawing.options_line["stroke-width"] = "1px";
            this.objectDrawing.refreshstyle();
            this.objectDrawing.initparam({
                'nocontextmenu': true,
                'func': {
                    'fn_draggable': GWTK.Util.bind(function (process, event, ui) {
                        if (!this.objectDrawing || !this.drawpanel) return;
                        switch (process) {
                            case 'start':
                                this.topology.map_events('off');
                                $(this.map.overlayPane).off('mapclick.'+ this.name);
                                if (this.dragPointsStart && typeof this.dragPointsStart === 'function') {
                                    this.dragPointsStart(process, event, ui);
                                }
                                break;
                            case 'stop':
                                this.topology.map_events('on');
                                $(this.map.overlayPane).on('mapclick.' + this.name, GWTK.Util.bind(this._onMapclick, this));
                                if (this.dragPointsStop && typeof this.dragPointsStop === 'function') {
                                    this.dragPointsStop(process, event, ui);
                                }
                                break;
                            case 'drag':
                                if (this.dragPointsDrag && typeof this.dragPointsDrag === 'function') {
                                    this.dragPointsDrag(process, event, ui);
                                }
                                break;
                        }
                        return true;
                    }, this),
                    'fn_updatepoint': GWTK.Util.bind(function (div, ui, insert) {
                        var number = this.objectDrawing.getnumber(div.id);
                        var subjectNumber = this.objectDrawing.getsubjectnumber(div.id);
                        var point = GWTK.point(ui.position.left, ui.position.top);
                        var coord = this.map.tiles.getLayersPointProjected(point);
                        var geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
                        this.editobject.geometry.updatepoint(number + 1, 0, new GWTK.Point3D(geo[0], geo[1], 0));
                        this.objectDrawing.refreshdraw();
                        if (this.pointsUnit == 'point') {
                        	this.updatePoint(number, [point.x, point.y]);
                        }
                        else {
                        	this.updatePoint(number, geo);
                        }
                        if (this.dragPointsUpdate && typeof this.dragPointsUpdate === 'function') {
                            this.dragPointsUpdate(number, geo, point);
                        }
                    }, this)
                }
            });
        },

        /**
		 * Создать объект карты для отображения линии
         * @method createMapObjectForEditingAndDrawing
		 */
        // ===============================================================
        createMapObjectForEditingAndDrawing: function () {
            this.editobject = new GWTK.mapobject(this.map, 'pickpointsaction');
            this.editobject.maplayername = "pickpointslayername";
            this.editobject.id = "qwerty";
            this.editobject.setSpatialposition('linestring');
        },

        /**
		 * Создать панель рисования
         * @method createDrawPanel
		 */
        // ===============================================================
        createDrawPanel: function () {
            this.drawpanel = GWTK.DomUtil.create('div', 'overlay-panel', this.map.drawPane);
            this.drawpanel.id = 'pickpoints' + GWTK.Util.randomInt(30000, 50000);
            this.$drawPanel = $(this.drawpanel);
        },

        /**
		 * Удалить панель рисования
         * @method removeDrawPanel
		 */
        // ===============================================================
        removeDrawPanel: function () {
            if (this.$drawPanel) {
                this.$drawPanel.remove();
            }
        },

        /**
		 * Создать класс рисования
         * @method createDrawObjectInstance
		 */
        // ===============================================================
        createDrawObjectInstance: function () {

            this.objectDrawing = new GWTK.DrawingObject(this.map, {
                'func': {
                    'fn_parentpanel': this.getDrawPanel
                }
            }, this);

            this.objectDrawing.drw_centerpoints = false;
        },

        /**
		 * Создать класс топологии
         * @method createTopologyInstance
		 */
        // ===============================================================
        createTopologyInstance: function () {
            this.topology = new GWTK.Topology(this.map, {
                'svgid': this.name + '_canvas',
                'func': {
                    'fn_parentpanel': this.getDrawPanel,
                    'fn_drawcustom': this.draw
                }
            }, this);
        },

        /**
		 * Запросить панель рисования
         * @method getDrawPanel
		 * @return {DOMObject}, div
		 */
        // ===============================================================
        getDrawPanel: function () {
            return this.drawpanel;
        },

        /**
		 * Установить параметры класса топологии
         * @method setTopologyInstanceParam
		 */
        // ===============================================================
        setTopologyInstanceParam: function () {
            if (!this.topology) return;
            this.topology.drawoptions_over["stroke"] = "transparent";
            this.topology.drawoptions_over["fill"] = "transparent";
            this.topology.searchObjectsByAreaFrame(null, [], "edit");
        },

        /**
		 * Рисование линии
         * @method draw
		 * @param svg {Object}
		 */
        // ===============================================================
        draw: function (svg) {
            this.objectDrawing.draw(this.editobject, svg, true, this.drw_centerpoints);
        },

        /**
		 * Перерисовать линию при перемещении или масштабировании карты
         * @method onOverlayRefresh
		 */
        // ===============================================================
        onOverlayRefresh: function (e) {
            if (e.cmd === 'move' || e.cmd === 'zoom') {
                var that = this;
                setTimeout(function () { that.objectDrawing.refreshdraw(); }, 1200);
                this.refreshPoints();
            }
        },

        /**
		 * Нарисовать линию до точки point
         * @method drawLine
		 * @param point {Array} [x,y] координаты точки
         * @param clear {Boolean} признак очистки объекта для рисования
		 */
        // ===============================================================
        drawLine: function (point, clear) {

            if (clear) {
                this.editobject.geometry.clear();
            }

            if (!point) return;

            if(this.updateLastPoint && this.editobject.geometry.points.length === this.maxPointsCount){
	            var newPoint1 = new GWTK.Point3D(point[0], point[1], 0);
	            this.editobject.geometry.updatepoint(this.maxPointsCount, 0, newPoint1);
	            this.objectDrawing.refreshdraw();

	            if (this.draggablePoints === false) {
		            $('#' + this.name + '_canvas').find('circle').each(function () {
			            $(this).removeAttr('onmouseover');
			            $(this).removeAttr('onmouseout');
			            $(this).removeAttr('onmousedown');
		            });
	            }
	            return true;
            }

            var newPoint = new GWTK.Point3D(point[0], point[1], 0);
            this.editobject.geometry.appendpoint3D(newPoint.x, newPoint.y, newPoint.h, 0);
            this.objectDrawing.refreshdraw();

            if (this.draggablePoints === false) {
                $('#' + this.name + '_canvas').find('circle').each(function () {
                    $(this).removeAttr('onmouseover');
                    $(this).removeAttr('onmouseout');
                    $(this).removeAttr('onmousedown');
                });
            }

            return;
        },

        /**
		 * Удалить рисунок линии
         * @method removeLine
		 */
        // ===============================================================
        removeLine: function () {
            this.editobject.geometry.clear();
            this.objectDrawing.refreshdraw();
        },

        /**
          * Обновить точки
          * @method refreshPoints
         */
        // ===============================================================
        refreshPoints: function () {
            if (!this.points || this.points.length < 1) { return; }
            if (!this.dragPointsUpdate || typeof this.dragPointsUpdate != 'function') {
                return;
            }
            var index = this.points.length - 1,
                point = this.points[index],
                place = GWTK.tileView.geo2pixelOffset(this.map, new GWTK.LatLng(point[0], point[1]));

            this.dragPointsUpdate(index, this.point, place);

            return;
        }
    };

    GWTK.Util.inherits(GWTK.PickMapPointAction, GWTK.MapAction);



    /**
     * Выбор ближайшей точки на объекте
     * Выбор производится щелчком указателя на карте
     * Между указателем и точкой на объекте отображается пунктирная линия
     * @class GWTK.NearestPointAction
     * @param task {object} - задача GWTK.MapTask
     * @param map {object} - карта GWTK.Map
     * @param options {object} - параметры
     * {name:string,object:GWTK.mapobject,fn_callback:function,svgOptions:object,mode:string}
     * options.name {string} - название действия
     * options.object {GWTK.mapobject} - объект, с которым производится действие - обязательный параметр
     * options.fn_callback {function} - функция обратного вызова при выполнении действия или сбросе; передаёт объект:
     *                                      success {boolean} признак успеха
     *                                      point {GWTK.Point} точка на карте (при успехе)
     *                                      geo {GWTK.LatLng} координаты точки (при успехе)
     *                                      subject {number} индекс подобъекта или -1, если внешний контур
     *                                      id {array} массив индексов точек (1 точка или 2, если на нормали)
     *                                      type {string} 'point' или 'normal', в засивимости от положения точки
     * options.svgOptions {object} - дополнительные настройки для графики, расширяющие настройки по умолчанию
     * options.mode {string} - режим поиска точки;
     *              'point' - ближайшая точка объекта (режим по умолчанию)
     *              'normal' - по нормали
     * options.pointVisible {boolean} - отображение точки на объекте, по умолчанию true
     * @constructor GWTK.NearestPointAction
     */
    GWTK.NearestPointAction = function (task, map, options) {

        this.options = options || {};
        if (this.options.name && this.options.name.length > 0) {
            this.name = this.options.name;
        } else {
            this.name = 'nearestPointAction' + GWTK.Util.randomInt(12345, 67890);
        }

        // Обязательный параметр объект - экземпляр GWTK.mapobject
        if (typeof this.options.object !== 'object' || !(this.options.object instanceof GWTK.mapobject)) {
            throw 'GWTK.NearestPointAction: Ошибка! Объект не указан или не является объектом карты.';
        }

        // Регистрация действия
        GWTK.MapAction.call(this, task, this.name);

        this.map = map;  // карта
        this.task = task;  // задача
        this.svgDraw = null;  // пунктирная линия с точкой
        this.svgOptions = {
            marker: {
                width: 13,
                height: 13
            }
        };  // настройки графики
        if (typeof options.svgOptions === 'object') {
            // расширение настроек графики
            $.extend(this.svgOptions, options.svgOptions);
        }
        this.pointVisible = (options.pointVisible !== undefined) ? options.pointVisible : true;  // признак отображения точки
        this.success = null;  // признак успешного завершения действия
        this.nearestPoint = null;  // ближайшая точка линейного объекта
        this.nearestGeo = null;  // географические координаты точки
        this.mode = ( this.options.mode === 'normal' ? 'normal' : 'point' );  // режим point (по умолчанию) или normal

    };

    /**
     * Функции объекта GWTK.NearestPointAction
     */
    GWTK.NearestPointAction.prototype = {

        /**
         * Инициализировать
         * @method init
         * @param base {object|null} - базовое действие (при необходимости)
         * @param nocall {boolean} - не обрабатывать
         */
        init: function (base, nocall) {

            if (nocall) {
                return;
            }
            if (!base) {
                base = this;
            }

            // Создание графического объекта
            base.svgDraw = new GWTK.objectDrawing(base.map, [
                'Features_pane_' + base.name,
                null,
                'selectedFeatures_canvas_' + base.name
            ]);

            base.success = false;  // признак успешного завершения действия
            base._initMouseMoveEvent();  // слежение за указателем
            base._initClickEvent();  // щелчок указателем - подтверждение действия
            base._initListenCloseAction();  // слежение за завершением данного действия

        },

        /**
         * Запустить - входной метод
         * @method set
         * @param base {object|null} - базовое действие (при необходимости)
         * @param nocall {boolean} - не обрабатывать
         */
        set: function (base, nocall) {

            if (nocall) {
                return;
            }
            if (!base) {
                base = this;
            }

            base.init();

        },

        /**
         * Очистить - выполняется автоматически при отмене данного действия или запуске другого действия в GWTK.Mapaction
         * @method clear
         * @param base {object|null} - базовое действие (при необходимости)
         * @param nocall {boolean} - не обрабатывать
         */
        clear: function (base, nocall) {

            if (nocall) {
                return;
            }
            if (!base) {
                base = this;
            }

            base._clearListen();  // отмена действий

        },

        /**
         * Установить слежение за движением указателя
         * Сохраняет данные точки объекта, ближайшей к указателю
         * Вызывается автоматически в методе 'init' при установке действия
         * @method _initMouseMoveEvent
         * @private
         */
        _initMouseMoveEvent: function () {

            // Движение по карте
            $(this.map.eventPane).on("mousemove." + this.name, GWTK.Util.bind(function(event) {

                // Предотвращение сдвига при перемещении карты
                if (this.map.handlers.movedrag.isDragEnabled()) {
                    return false;
                }

                // Определение количества точек метрики
                // (при пустом массиве points в geometry, он будет проинициализирован данными из geometry.oGeometryJSON)
                this.options.object.geometry.count();
                // Точки объекта
                this.points = this.options.object.geometry.points.slice();
                if (!this.points.length) {
                    // Точек нет
                    return;
                }
                if (this.options.object.spatialposition === 'polygon') {
                    // Полигон. Удаление последней точки из геометрии, потому что дублирует первую.
                    this.points.length--;
                }

                // Точка под указателем
                var mousePoint = GWTK.DomEvent.getMousePosition(event, this.map.panes.eventPane);
                var mouseCoord = this.map.tiles.getLayersPointProjected(mousePoint);
                var mouseGeo = GWTK.projection.xy2geo(this.map.options.crs, mouseCoord.y, mouseCoord.x);

                this.nearestPoint = null;  // ближайшая точка линейного объекта
                this.nearestGeo = null;  // география точки

                var result;
                if (this.mode === 'point') {
                    // поиск ближайшей точки внешнего контура
                    result = this._findNearestPoint(mousePoint, this.points);
                } else if (this.mode === 'normal') {
                    // получение ближайшей точки по нормали внешнего контура
                    result = this._getNearestNormal(mousePoint, this.points);
                }

                // Ближайшая точка не найдена
                if (!result || (result.nearestPoint === null)) {
                    return;
                }

                this.subject = -1;  // внешний контур
                // Есть подобъекты ? Цикл подобъектов
                var subjects = this.options.object.geometry.subjects;
                for (var i in subjects) {

                    var pointsI = subjects[i].points.slice();
                    // У полигонов первая и последняя точка совпадают. Срезать последнюю.
                    if (pointsI.length) {
                        pointsI.length--;
                    }
                    var resultI;
                    if (this.mode === 'point') {
                        resultI = this._findNearestPoint(mousePoint, pointsI);
                    } else if (this.mode === 'normal') {
                        resultI = this._getNearestNormal(mousePoint, pointsI);
                    }

                    // Сравнение ближайших точек принятого и данного результатов
                    if (resultI && (resultI.nearestPoint !== null) && resultI.dist < result.dist) {
                        // Принятие подобъекта
                        this.subject = parseInt(i, 10);
                        this.points = pointsI;
                        result = resultI;
                    }

                }

                // Установка результатов
                this.nearestPoint = result.nearestPoint;
                this.nearestGeo = result.nearestGeo;
                this.pointId = result.pointId;

                var features = [{
                    // пунктирная линия
                    type: 'Feature',
                    properties: { id: this.options.object.gid },
                    geometry: {
                        type: 'linestring',
                        coordinates: [ [ result.nearestGeo.lng, result.nearestGeo.lat ], [ mouseGeo[1], mouseGeo[0] ] ]
                    }
                }];
                if (this.pointVisible) {
                    features.push({
                        // точка объекта
                        type: 'Feature',
                        properties: { id: this.options.object.gid + 'point' },
                        geometry: {
                            type: 'point',
                            coordinates: [ result.nearestGeo.lng, result.nearestGeo.lat ]
                        }
                    });
                }

                // Отображение графики
                this.svgDraw.draw({ features: features }, false, this.svgOptions);

            }, this));

        },

        /**
         * Найти ближайшую точку из списка точек.
         *
         * @method _findNearestPoint
         * @param checkPoint {GWTK.Point} - точка под указателем, от которой вести отсчёт
         * @param points {array} - список точек для расчёта
         * @returns {object} результаты:
         *     index {number} порядковый индекс полученной точки
         *     dist {number} расстояние до точки
         *     nearestPoint {object} ближайшая точка
         *     nearestGeo {object} её координаты
         *     pointId {array} индекс ближайшей точки, обёрнутый в массив
         * @private
         */
        _findNearestPoint: function (checkPoint, points) {

            var result = {
                pointId: [ 0 ],
                dist: null,
                nearestPoint: null,
                nearestGeo: null
            };
            for (var i = 0; i < points.length; i++) {
                var geo = GWTK.toLatLng([ points[i].x, points[i].y ]);
                var overlayPoint = GWTK.tileView.geo2pixelOffset(this.map, geo);
                // Расстояние между данной и контрольной точками
                var xDiff = checkPoint.x - overlayPoint.x;
                var yDiff = checkPoint.y - overlayPoint.y;
                var dist = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
                // Сохранение ближайшей точки в результат
                if (result.dist === null || result.dist > dist) {
                    result.dist = dist;
                    result.pointId = [ i ];  // порядковый индекс ближайшей точки (одна точка)
                    result.nearestPoint = overlayPoint;
                    result.nearestGeo = geo;
                }
            }
            return result;

        },

        /**
         * Получить ближайшую точку по нормали, применительно к списку точек.
         *
         * @method _getNearestNormal
         * @param checkPoint {GWTK.Point} - точка под указателем, от которой вести отсчёт
         * @param points {array} - список точек для расчёта
         * @returns {object|boolean} результаты:
         *     index {number} порядковый индекс полученной точки
         *     dist {number} расстояние до точки
         *     pointId {array} индекс ближайшей точки, в виде массива
         *     nearestPoint {object} ближайшая точка
         *     nearestGeo {object} её координаты
         * @private
         */
        _getNearestNormal: function (checkPoint, points) {

            // Получение индекса ближайшей точки
            var nearestPoint = this._findNearestPoint(checkPoint, points);
            var index = nearestPoint.pointId[0];
            if (points.length === 1) {
                // Точка одна, нормали быть не может
                return false;
            }

            var normals = [];

            // Нормаль между данной и следующей точками
            var indexNext = (index + 1) % points.length;
            var geoNext = GWTK.toLatLng([ points[indexNext].x, points[indexNext].y ]);
            var overlayPointNext = GWTK.tileView.geo2pixelOffset(this.map, geoNext);
            // Линейным объектам проверка на другой конец линии.
            // В таком случае результат не добавлять.
            if (this.options.object.spatialposition !== 'linestring' || (index + 1) !== points.length) {
                normals.push(this._getNormal(nearestPoint.nearestPoint, index, overlayPointNext, indexNext, checkPoint));
            }

            // Нормаль между данной и предыдущей точками
            var indexPrev = (index - 1 + points.length) % points.length;
            var geoPrev = GWTK.toLatLng([ points[indexPrev].x, points[indexPrev].y ]);
            var overlayPointPrev = GWTK.tileView.geo2pixelOffset(this.map, geoPrev);
            // Линейным объектам проверка на другой конец линии.
            // В таком случае результат не добавлять.
            if (this.options.object.spatialposition !== 'linestring' || index) {
                normals.push(this._getNormal(nearestPoint.nearestPoint, index, overlayPointPrev, indexPrev, checkPoint));
            }

            var normal;
            if (normals.length > 1) {
                // Кратчайшая нормаль
                if (normals[0].d < normals[1].d) {
                    normal = normals[0];
                } else {
                    normal = normals[1];
                }
            } else if (normals.length === 1) {
                // Всего одна нормаль
                normal = normals[0];
            } else {
                // Нормалей нет ?
                return false;
            }

            var result = nearestPoint;
            result.pointId = normal.id;

            // География точки
            var coord = this.map.tiles.getLayersPointProjected(normal);
            var geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);

            result.nearestGeo = GWTK.toLatLng(geo);
            result.nearestPoint = GWTK.tileView.geo2pixelOffset(this.map, result.nearestGeo);

            return result;

        },

        /**
         * Получить нормаль в пределах пары координат
         * @method _getNormal
         * @param p1 {GWTK.Point} - координаты первой точки
         * @param id1 {number} - индекс первой точки
         * @param p2 {GWTK.Point} - координаты второй точки
         * @param id2 {number} - индекс второй точки
         * @param check {GWTK.Point} - координаты точки, относительно которой вести расчёт
         * @returns {{x, y, d}}
         *          x {number}, y {number} - координаты ближайшей точки по нормали
         *          d {number} - расстояние до этой точки
         * @private
         */
        _getNormal: function(p1, id1, p2, id2, check) {

            var lx = p2.x - p1.x;
            var ly = p2.y - p1.y;
            var dx = p1.x - check.x;
            var dy = p1.y - check.y;

            // Очевидно, квадрат расстояния имеет только минимум, в нем производная = 0
            var t = -(dx * lx + dy * ly) / (lx * lx + ly * ly);

            // Уравнение прямой
            var X = p1.x + t * lx;
            var Y = p1.y + t * ly;

            // Квадрат расстояния от точки check до точки прямой с параметром t
            // R2 = Math.pow((lx * t + dx), 2) + Math.pow((ly * t + dy), 2));

            // Производная
            // 2 * t * (Math.pow(lx, 2) + Math.pow(ly, 2)) + 2 * (dx * lx + dy * ly)

            var result = { x: X, y: Y, d: null, id: [ id1, id2 ] };
            // Выход за пределы пары точек - ближайшая точка
            if (t < 0) {
                result = p1;
            } else if (t > 1) {
                result = p2;
            }

            // Расстояние по нормали
            var xDiff = check.x - result.x;
            var yDiff = check.y - result.y;
            result.d = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));

            return result;

        },

        /**
         * Установить слежение за щелчком указателя
         * Щелчок указателя завершает действие
         * Вызывается автоматически в методе 'init' при установке действия
         * @method _initClickEvent
         * @private
         */
        _initClickEvent: function () {

            // Нажатие по карте
            $(this.map.overlayPane).on('mapclick.' + this.name, GWTK.Util.bind(function () {
                this.success = true;
                setTimeout(GWTK.Util.bind(function () {
                    this.map.closeAction();
                }, this));
            }, this));

        },

        /**
         * Установить слежение за завершением данного действия
         * Вызывается автоматически в методе 'init' при установке действия
         * @method _initListenCloseAction
         * @private
         */
        _initListenCloseAction: function () {

            // При отмене данного действия вызывается функия обратного вызова
            $(this.map.eventPane).one('closeaction', GWTK.Util.bind(function (action, task) {
                if (action.action === this.name && typeof this.options.fn_callback === 'function') {
                    setTimeout(GWTK.Util.bind(function() {
                        if (this.success && this.nearestPoint) {
                            // Успех
                            this._calcOtherResult();
                            this.options.fn_callback({
                                success: true,
                                point: this.nearestPoint,
                                geo: this.nearestGeo,
                                type: this.pointType,
                                subject: this.subject,
                                id: this.pointId
                            });
                        } else {
                            // Нет точки или отмена действия
                            this.options.fn_callback({
                                success: false
                            });
                        }
                    }, this));
                }
            }, this));

        },

        /**
         * Очистить слежения
         * Вызывается автоматически в методе 'clear' при завершении действия
         * @private
         */
        _clearListen: function () {

            $(this.map.eventPane).off("mousemove." + this.name);
            $(this.map.overlayPane).off('mapclick.' + this.name);
            if (this.svgDraw) {
                this.svgDraw.destroy();
            }

        },

        /**
         * Прочие расчёты для возврата результата.
         * Определяет тип точки:
         *      'point' - угловая, устанавливает индекс одной ближайшей точки
         *      'normal' - по нормали
         *
         * @method _calcOtherResult
         * @private
         */
        _calcOtherResult: function () {

            if (this.mode === 'point') {
                this.pointType = 'point';
                return;
            }

            this.pointType = 'normal';  // тип - точка по нормали

            // Поиск точки на объекте, очень близкой к данной
            $.each(this.points, GWTK.Util.bind(function (index, element) {
                var defX = parseInt(element.x * 1000000 - this.nearestGeo.lat * 1000000);
                var defY = parseInt(element.y * 1000000 - this.nearestGeo.lng * 1000000);
                var diff = Math.abs(defX) + Math.abs(defY);
                if (diff < 100) {
                    this.pointType = 'point';  // тип - угловая точка
                    this.pointId = [ index ];  // установка индекса одной точки
                    return false;
                }
            }, this));

        }

    };

    GWTK.Util.inherits(GWTK.NearestPointAction, GWTK.MapAction);  // Расширяется интерфейсом GWTK.MapAction


}