/// <reference path="../drawingobject.js" />
/************************************* Соколова  ***** 05/05/21 ****
************************************** Нефедьева ***** 26/09/17 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2016              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                      Редактор объектов карты                     *
*                      Режим создания объекта карты                *
*                                                                  *
*******************************************************************/
if (window.GWTK) {

    /**
     * Обработчик создания объекта карты
     * @param task - задача
     * @param name - наименование обработчика
     * @constructor
     */
    GWTK.MapeditorCreatingActionExt = function (task, name) {

        this.error = true;

        GWTK.MapAction.call(this, task, name);           // родительский конструктор

        this.lineworkid = ['linework1', 'linework2', 'linework3', 'linework4'];
        this.linecircleworkid = 'linecirclework';

        this.map = this.getMap();
        if (!this.map) return;

        this.drawobject = this.task.drawobject;
        if (!this.drawobject) return;
        this.drawobject.drw_centerpoints = false;  // Нет срединных точек

        // Запросим объекты окружения, если их нет
        this.topology = this.task.topology;
        if (!this.topology) return;

        // стереть рабочие линии
        this.removeworklines();

        this.error = false;

        // Замыкание контекста
        this.bind();


    };


    GWTK.MapeditorCreatingActionExt.prototype = {

        /**
        * Замыкание контекста 
        * @method bind
        */
        bind: function () {
            if (this.error) {
                return;
            }

            this.onMouseUpCreation = GWTK.Util.bind(this.onMouseUpCreation, this);
            this.onMouseMoveCreation = GWTK.Util.bind(this.onMouseMoveCreation, this);

            // Навесим всплывающее меню на точки
            this.drawobject.clearparam();
            // this.drawobject.addPopupmenu(GWTK.Util.bind(this.popupmenu, this));
            this.drawobject.addPopupmenu(GWTK.Util.bind(this.task.onContextMenu, this));
            this.drawobject.addContinue(null);

            this.onDragStart = GWTK.Util.bind(this.onDragStart, this);
            this.onDragEnd = GWTK.Util.bind(this.onDragEnd, this);


            // Событие на изменение вида графического объекта
            $(this.map.eventPane).on('GWTK.MapeditLegendGraphicControl.changegraphicparams', GWTK.bind(function(event){
                if (this.editobject && this.editobject.graphic && event.source &&  this.editobject.graphic.type == event.source.type) {
                    this.editobject.graphic = event.source.saveJSON();
                    this.draw();
                }
            }, this));

        },


        /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
         * @method set
         * @param options {Object} параметры обработчика
         */
        set: function (options) {
            if (this.error) {
                return;
            }

            var task = this.task;
            // Cоздаем пустой объект, если его не было
            this.editobject = (task.editobjects && task.editobjects.length > 0) ? task.editobjects[0] : null;  // Редактируемый объект
            if (!this.editobject) {
                task.createNewMapObject(this.editobject, GWTK.Util.bind(function(mapobject) {
                    // Если есть предварительно выбранный код
                    if (!task.editNodeLast || !task.editNodeLast.node) {
                        task.initEditNodeLast();
                    }
                    if (task.editNodeLast.node) {
                        // // Установим подпись объекту
                        // this.task.setTitle(task.editNodeLast.node);

                        // Назначим код
                        task.changeMapObjectCode(task.editNodeLast.node);

                        // Если графический слой, то установить тип этого объекта
                        if (task.graphic) {
                            task.setLegendCode(task.editNodeLast.node.code, 'key', task.editNodeLast.node, true);
                        }
                        else {
                            if (!this.task.isLegendSelect()) {
                                task.setLegendCode(task.editNodeLast.node.key, 'key', task.editNodeLast.node, true);
                            }
                        }

                        // Установим подпись объекту
                        task.setTitle(task.editNodeLast.node);
                    }
                    this.subjectnumber = 0;
                    this.editobject = mapobject;

                }, this));
            }
            else {
                this.subjectnumber = (this.editobject.geometry) ? this.editobject.geometry.subjects.length : 0;
            }

            if (!this.editobject || !this.editobject.geometry) {
                this.error = true;
                return;
            }

            // Удалить всю метрику подобъекта
            this.editobject.geometry.deletepoints(this.subjectnumber);

            // Создать панель рисования, если ее удалили в canClose
            if (!this.task.isDrawpanel(this.editobject)) {
                this.task.createDrawpanel();
            }

            this.drawpanel = this.task.drawpanel;
            if (!this.drawpanel) {
                this.error = true;
                return;
            }

            this.flagComplete = false;

            // отменим обработчики
            var $drawpanel = $(this.drawpanel);
            $drawpanel.off("touchstart", this.map.handlers.touchStart);   // аналог onmousedown
            $drawpanel.off("touchmove", this.map.handlers.touchMove);     // аналог onmousemove
            $drawpanel.off("touchend", this.map.handlers.touchEnd);       // аналоыг onmouseup

            // // Перерисовка окна карты
            // $(this.map.eventPane).on('overlayRefresh', task.onOverlayRefresh);

            // События мыши на карте
            this.map_events('on');

            // Установить текущий обработчик
            task.currentAction = this;

            // Перерисовать карту с объектами топологии. Это обязательно!!!
           // this.topology.searchObjectsByAreaFrame(null, [this.editobject.gid], 'create', this.task.selectlayersid, true,
            this.topology.searchObjectsByAreaFrame(null, [this.editobject.gid], 'create', [], true,
                w2utils.lang(w2utils.lang("Create contour, causing a point on the map")));
        },

        map_events: function(type){
            if (this.error) {
                return;
            }
            if (type == 'on') {
                // Мышь на карте
                this.map.on({ type: 'mouseup', target: "map", phase: 'before', sender: this }, this.onMouseUpCreation);
                this.map.on({ type: 'mousemove', target: "map", phase: 'before',  sender: this }, this.onMouseMoveCreation);

                // Перемещение карты
                $(this.map.eventPane).on('mapdragstart',  this.onDragStart);
                $(this.map.eventPane).on('mapdragend', this.onDragEnd);

            }
            else {
                this.map.off({ type: 'mouseup', target: "map", phase: 'before', sender: this }, this.onMouseUpCreation);
                this.map.off({ type: 'mousemove', target: "map", phase: 'before',  sender: this }, this.onMouseMoveCreation);

                // Перемещение карты
                $(this.map.eventPane).off('mapdragstart',  this.onDragStart);
                $(this.map.eventPane).off('mapdragend', this.onDragEnd);
            }


         },

        /**
         * Сбросить настройки (отключение обработчиков событий, инициализация флажков и др.)
         * @method clear
         */
        clear: function () {
            if (this.error) {
                return;
            }

            this.task.zIndexRestore();
            var $drawpanel = $(this.drawpanel);

            // отменим обработчики
            this.map_events();

            // назначим обработчики
            $drawpanel.on("touchstart", this.map.handlers.touchStart);   // аналог onmousedown
            $drawpanel.on("touchmove", this.map.handlers.touchMove);     // аналог onmousemove
            $drawpanel.on("touchend", this.map.handlers.touchEnd);       // аналог onmouseup

            this.removeworklines();

            this.task.clearStatusBar();

            // // Перерисовка окна карты
            // $(this.map.eventPane).off('overlayRefresh', this.task.onOverlayRefresh);

        },

        canClose: function(){
            if (this.error) {
                return true;
            }
            if (!this.flagComplete) {
                return this.task.canClose();
            }
            else {
                return true;
            }
        },

        /**
         * Отрисовка объекта
         */
        draw: function(){
            if (this.error) {
                return true;
            }
            this.drawobject.draw(this.editobject, this.topology.svgDraw, true, false, false, false);
        },


        /**
        * Удаление рабочих линий создания/редактирования 
        * @method removeworklines
        */
        removeworklines: function () {
            if (this.error) {
                return;
            }
            var el;
            for (var i = 0; i < this.lineworkid.length; i++) {
                GWTK.DrawingObject.prototype.removeDomElement(this.lineworkid[i]);
            }

            // Удаление служебных линий окружности
            GWTK.DrawingObject.prototype.removeDomElement(this.linecircleworkid);
        },

        /**
         * События панели svg холста 
         * @event onSvgEvent
         */
        onSvgEvent: function (e) {
            if (this.error) {
                return;
            }
            var $ep = $(this.map.eventPane);
            $ep.trigger(e);
        },


        onDragStart: function(){
            this.drag = true;
        },

        onDragEnd: function(){
            this.drag = false;
        },

        /**
         * Нажатие мыши при создании объекта
         * @method  onMouseDownCreation
         * @param event {Object} Событие
         */
        onMouseUpCreation: function (e) {

            // Если это перемещение, то ничего не делаем
            if (this.drag) {
                return;
            }

            this.task.isChange(true);

            // var $drawpanel = $(this.drawpanel);

            // отрисовка направляющей линии
            e = e.originalEvent;

            // Меню на точку (почему-то не отрабатывает стандартное для точки (оно назначачено при отрисовке объекта) )
            if (e.target.nodeName == 'circle') {
                var el = e.target,
                    attr = el.getAttributeNS(null, 'onmousedown');
                if (attr) {
                    attr = GWTK.DrawingObject.prototype.getpointattr(el);
                    if (attr) 
                        return this.popupmenu(e, el, parseFloat(el.getAttributeNS(null, attr[0])), parseFloat(el.getAttributeNS(null, attr[1])));
                }
            }

            this.map.off({ type: 'mousemove', target: "map", phase: 'before', sender: this }, this.onMouseMoveCreation);
            this.map.on({ type: 'mousemove', target: "map", phase: 'before', sender: this }, this.onMouseMoveCreation);

            // Завершение создания объекта при комбинации Ctrl+mousedown
            if (e.ctrlKey) {
                if (e.which == 1) {// Левая кнопка мыши (завершить создание)
                    this.task.onCtrlLeft();
                }
                else {
                    if (e.which == 3)  { // Правая кнопка мыши (отказаться от создания)
                        this.task.onCtrlRight();
                     }
                }
                this.clearHotKey();
                return;
            }
            else {
                if (e.which == 3)  { // Правая кнопка мыши (Контекстное меню))
                    this.task.onContextMenu(e);
                    this.clearHotKey();
                    return;
                }
            }

            // Всплывающее меню
            if (e.target.id.indexOf(this.task.popupId) >= 0) {
                this.removeworklines();
                e.stopPropagation();
                return false;
            }
            // Удалим меню, если оно было
            $('#' + this.task.popupId).remove();

            // Добавим точку
            var geo, number,
                subjectnumber = this.subjectnumber,
                pointcount = this.editobject.geometry.count(subjectnumber),
                multirect = (this.name == 'multi_rectangle') ? true : false;

            // если НЕ сложный прямоугольник или у него меньше 2 точек
            if (!multirect || (multirect && pointcount < 2)) {

                switch (this.name) {
                    case 'horizontal_rectangle':
                    case 'circle':
                        if (pointcount == 1) {
                            this.complete(false, true);
                            return;
                        }
                        break;
                    case 'inclined_rectangle':
                        if (pointcount == 2) {
                            this.complete(false, true);
                            return;
                        }
                        break;
                }

                if (this.topology.currentPoint) {
                    geo = this.topology.getpointgeo(this.topology.currentPoint); // Если имеется выбранная точка, то добавим ее
                    if (geo) {
                        number = this.task.addpointgeo(geo[0], geo[1], null, subjectnumber, true);
                    }
                    else {
                        // Вероятно это виртуальная точка
                        var newpos = this.drawobject.getpositionByPointId(this.topology.currentPoint);
                        if (newpos) {
                            // Запрос ОБЯЗАТЕЛЬНО с учетом смещения this.drawpanel, поскольку координаты получены на холсте svg
                            number = this.task.addpoint(newpos.x, newpos.y, null, subjectnumber, true, true);
                        }
                    }
                    // удалим виртуальную точку
                    this.topology.drawVirtualPoint();
                }
                else {
                    // Если были координаты к горячим кнопкам
                    var x = null, y = null;
                    if (this.hotkey) {
                        x = this.hotkey.x;
                        y = this.hotkey.y;
                    }
                    else {
                        x = e.clientX;
                        y = e.clientY;
                    }

                    // Запрос БЕЗ учета смещения this.drawpanel, поскольку координаты получены  непосредственно в окне документа
                    // number = this.task.addpoint(e.clientX, e.clientY, null, subjectnumber, true);
                    number = this.task.addpoint(x, y, null, subjectnumber, true);
                }

                 this.draw();

            }
            else {
                // Сложный прямоугольник
                this.createmultirect(subjectnumber);
            }

            // Для полигона найдем какому контуру принадлежит точка 
            if (subjectnumber > 0 && this.editobject.spatialposition.indexOf('polygon') >= 0) {
                var subsub,
                    sub = this.editobject.geometry.getsubjectgeometry(subjectnumber),
                    ret = this.editobject.geometry.isPointInsideSubjects(this.editobject.geometry.getpoint(1, subjectnumber));

                if (ret < 0) { // никому не принадлежит
                    if (sub) 
                        sub.insideMultipart = ret;  // будет новый мультиконтур
                }
                else {
                    subsub = this.editobject.geometry.getsubjectgeometry(ret);
                    if (subsub.insideMultipart >= 0)  // если этот контур уже чья-то дырка, то создадим новый мультиконтур
                        sub.insideMultipart = -1;   // будет новый мультиконтур
                    else
                        sub.insideMultipart = ret;  // будет новая дырка
                }
                if (sub.insideMultipart < 0)
                    this.editobject.geometry.spatialposition = "multipolygon";
            }

            this.task.addmenu();

            // если точечный, завершить создание метрики
            if (this.iscomplete(this.editobject)) {
                this.complete(true, true);
            }

            this.clearHotKey();
        },

        /**
         * Перемещение мыши при создании объекта
         * @method  onMouseMoveCreation
         * @param e {Object} Событие
         */
        onMouseMoveCreation: function (e) {

            // Если это перемещение, то ничего не делаем
            if (this.drag) {
                return;
            }

            if (!e) return;
            e = e.originalEvent;

            // Панель для рисования! Курсор и zIndex
            this.drawobject.zIndexDrawPanel('up', this.drawpanel);
            this.drawpanel.style.cursor = 'crosshair';

            // отобразить координаты мыши
            e.map = this.map;
            GWTK.DomEvent.getMouseGeoCoordinates(e);

            var newpos, pointcount, next, elems,
                subjectnumber = this.subjectnumber,
                el = this.drawobject.getpointElemLast(subjectnumber),
                // Родитель для отрисовки на svg
                parent = document.getElementById(this.drawobject.mapobject.maplayername + '_' + this.drawobject.mapobject.id + '_objectJSON'),
                beforeel = document.getElementById(this.drawobject.getgroupId(subjectnumber) + '_' + 'pointsJSON'),
                // Стиль
                styleline = (subjectnumber > 0) ? this.drawobject.styleline_subject : this.drawobject.styleline,
                prev = (el) ? this.drawobject.getpositionByPointId(el.id) : null,
                rectdraw = this.drawpanel.getBoundingClientRect(),
                // Реальная позиция на экране
                ui = { position: { left: e.clientX - rectdraw.left, top: e.clientY - rectdraw.top } },
                newY = null, newX = null, hotkey = false;

            if (this.topology.drawOverObject(ui, { isobjectpoint: this.task.options.capturePoints, isvirtualpoint: this.task.options.captureVirtualPoints })) {
                newpos = { 'x': ui.position.left, 'y': ui.position.top };
            }

            if (this.hotkey && this.name == 'free_line') {
                if (el) {
                    switch (this.hotkey.key) {
                        case 'V':   // V - вертикальная линия (не меняем x)
                            newX = parseInt(el.getAttributeNS(null, 'cx'));
                            hotkey = true;
                            break;
                        case 'H':    // H - горизонтальная линия
                            newY = parseInt(el.getAttributeNS(null, 'cy'));
                            hotkey = true;
                            break;
                        case 'R':    // R - прямой угол
                            // Найдем последние две точки
                            if (beforeel && (elems = beforeel.childNodes)) {
                                elems = Array.prototype.slice.call(elems);
                                if (elems.length > 1) {
                                    var newpoint = this.getNormalPoint(
                                        [this.drawobject.getpositionElement(elems[elems.length - 2]), this.drawobject.getpositionElement(elems[elems.length - 1])],
                                        new GWTK.point(ui.position.left, ui.position.top));
                                    newX = newpoint.x;
                                    newY = newpoint.y;
                                    hotkey = true;
                                }
                            }
                            break;
                    }
                }
            }
            else {
                this.clearHotKey();
            }

            // В зависимости от способа создания рисовать линию или нет
            if (this.iscomplete(this.editobject) || (pointcount = this.editobject.geometry.count(subjectnumber) )<= 0) {
                // e.stopPropagation();
                return false;
            }
            if (pointcount > 1)
                this.task.setStatusBar(w2utils.lang("Backspace - step backwards, Esc - cancel the operation, Ctrl + Enter - to complete the operationб, Ctrl + S - save the object"));
            else {
                this.task.setStatusBar(w2utils.lang("Create contour, causing a point on the map"));
            }

            this.removeworklines();
            newX = (newX != null) ? newX: ui.position.left;
            newY = (newY != null) ? newY: ui.position.top;
            if (hotkey) {
                this.hotkey.x = newX + rectdraw.left;
                this.hotkey.y = newY + rectdraw.top;
            }

            next = GWTK.point(newX, newY);
            if (newpos) {
                next = GWTK.point(newpos.x, newpos.y)
            }

            // Горизонтальный прямоугольник
            if (prev) {
                switch (this.name) {
                    case 'horizontal_rectangle':  // прямоугольник
                        this.drawobject.svgDraw.createSVGline(this.lineworkid[0], parent, { "x1": prev.x, "y1": prev.y, "x2": prev.x, "y2": next.y, "style": styleline }, null, beforeel);
                        this.drawobject.svgDraw.createSVGline(this.lineworkid[1], parent, { "x1": prev.x, "y1": next.y, "x2": next.x, "y2": next.y, "style": styleline }, null, beforeel);
                        this.drawobject.svgDraw.createSVGline(this.lineworkid[2], parent, { "x1": next.x, "y1": next.y, "x2": next.x, "y2": prev.y, "style": styleline }, null, beforeel);
                        this.drawobject.svgDraw.createSVGline(this.lineworkid[3], parent, { "x1": next.x, "y1": prev.y, "x2": prev.x, "y2": prev.y, "style": styleline }, null, beforeel);
                        //this.updateEvents(this.map);
                        break;
                    case 'circle':               // окружность
                        this.drawobject.svgDraw.createSVGline(this.lineworkid[0], parent, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline }, null, beforeel);
                        // создаем группу точек окружности
                        this.drawobject.drawcircle(this.linecircleworkid, [prev, next]);
                        // this.updateEvents(this.map);
                        break;
                    case 'inclined_rectangle':  // наклонный прямоугольник
                        elems = beforeel.childNodes;
                        elems = Array.prototype.slice.call(elems);
                        if (elems.length > 1) {// отменим событие на нажатие и назначим на отжатие
                            // this.updateEvents(this.map);
                            // рисуем перпендикулярные параллельные линии
                            this.drawobject.drawperpendicularlines(this.lineworkid, [this.drawobject.getpositionElement(elems[0]), this.drawobject.getpositionElement(elems[1])], next, beforeel);
                        }
                        else
                            this.drawobject.svgDraw.createSVGline(this.lineworkid[0], parent, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline }, null, beforeel);
                        break;
                    case 'multi_rectangle':  // сложный прямоугольник
                        elems = beforeel.childNodes;
                        elems = Array.prototype.slice.call(elems);
                        if (elems.length > 1) {
                            this.drawobject.drawmultirect(this.lineworkid, [this.drawobject.getpositionElement(elems[elems.length - 2]), this.drawobject.getpositionElement(elems[elems.length - 1])], next, beforeel);
                        }
                        else
                            this.drawobject.svgDraw.createSVGline(this.lineworkid[0], parent, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline }, null, beforeel);
                        break;
                    default:
                        // this.drawobject.svgDraw.createSVGline(this.lineworkid[0], parent, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline }, null, beforeel);
                        this.drawobject.svgDraw.createSVGline(this.lineworkid[0], parent, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline }, null, beforeel);
                        break;
                }
            }
            // e.stopPropagation();
            return false;

        },

        /**
         * Нужно ли принудительно завершать создание объекта
         * @method iscomplete
         * @returns {Boolean} true - нужно принудительно завершить создание
         */
        iscomplete: function (editobject) {
            return GWTK.MapEditorUtil.iscomplete(editobject, this.subjectnumber);
        },


        /**
        * Завершить процесс создания метрики объекта
        * @method complete
        * @param nogeometry {Bool} - не формировать геометрию для нестандартных способов создания
        * @param isautosave {Bool} - Проверить флаг автоматического сохранения
        */
        complete: function (nogeometry, isautosave) {
            if (this.error || !this.editobject) {
                return;
            }

            if (!nogeometry) {
                var el, group, elems;
                el = this.drawobject.getpointElemLast();
                if (!el) return;

                var subjectnumber = this.drawobject.getsubjectnumber(el.id),
                    lineworkid = this.lineworkid,
                    linecircleworkid = this.linecircleworkid;

                switch (this.name) {
                    // Горизонтальный прямоугольник
                    case 'horizontal_rectangle':
                        this.editobject.geometry.deletepoints(subjectnumber);
                        for (var i = 0; i < lineworkid.length; i++) {
                            el = document.getElementById(lineworkid[i]);
                            if (!el) continue;
                            if (i == 0) {
                                this.task.addpoint(parseFloat(el.getAttributeNS(null, 'x1')), parseFloat(el.getAttributeNS(null, 'y1')), null, subjectnumber, true, true);
                            }
                            this.task.addpoint(parseFloat(el.getAttributeNS(null, 'x2')), parseFloat(el.getAttributeNS(null, 'y2')), null, subjectnumber, true, true);
                        }

                        this.task.closeobject(false, subjectnumber);
                        if (this.editobject.geometry.count(subjectnumber) == 0)
                            return;
                        break;

                    // Наклонный прямоугольник
                    case 'inclined_rectangle':
                        el = document.getElementById(lineworkid[2]);
                        if (el) {
                            this.task.addpoint(parseFloat(el.getAttributeNS(null, 'x1')), parseFloat(el.getAttributeNS(null, 'y1')), null, subjectnumber, true, true);
                            this.task.addpoint(parseFloat(el.getAttributeNS(null, 'x2')), parseFloat(el.getAttributeNS(null, 'y2')), null, subjectnumber, true, true);
                        }
                        this.task.closeobject(false, subjectnumber);
                        if (this.editobject.geometry.count(subjectnumber) == 0)
                            return;
                        break;

                    // Окружность
                    case 'circle':
                        this.editobject.geometry.deletepoints(subjectnumber);
                        group = document.getElementById(linecircleworkid);
                        if (!group) return;
                        elems = group.childNodes;
                        elems = Array.prototype.slice.call(elems); // теперь elems - массив
                        for (var i = 0; i < elems.length; i++) {
                            if (i == 0)
                                this.task.addpoint(parseFloat(elems[i].getAttributeNS(null, 'x1')), parseFloat(elems[i].getAttributeNS(null, 'y1')), null, subjectnumber, true, true);
                            this.task.addpoint(parseFloat(elems[i].getAttributeNS(null, 'x2')), parseFloat(elems[i].getAttributeNS(null, 'y2')), null, subjectnumber, true, true);
                        }
                        this.task.closeobject(false, subjectnumber);
                        if (this.editobject.geometry.count(subjectnumber) == 0)
                            return;

                        break;

                    // Сложный многоугольник
                    case 'multi_rectangle':
                        // Удалим первую  и последнюю точки
                        this.correctMultirect();
                        break;
                }

                // если полигон, замкнуть метрикy
                if (this.editobject.spatialposition.toLowerCase().indexOf('polygon') >= 0) {
                    if (!this.task.closeobject(false, subjectnumber)) {
                        w2alert(w2utils.lang("Object contains less than 3 points!"));
                        return;
                    }

                    //// Проверим на пересечение контуров (вынесено в сохранение)
                    //if (subjectnumber > 0) {
                    //    var ret = mapeditorTask.isIntersectionSubjectSubjects(this.editobject, subjectnumber);
                    //    if (ret >= 0) { // Имеется пересечение
                    //        w2alert(w2utils.lang("Created contour crosses ") + ret.toString() + w2utils.lang(" contour of the edited object") + '. ' + w2utils.lang("Contour can not be stored") + '.');
                    //        this.editobject.geometry.deletesubject(subjectnumber);
                    //        mapeditorTask.extend = false;
                    //    }
                    //}

                }

                // // Занести метрику в окно с метрикой объекта
                // if (this.task.metrics) {
                //     this.task.metrics.options.action = "edit";
                //     this.task.metrics.creategrid(this.editobject.geometry.saveJSON(true));
                // }
            }

            // Закрыть обработчик
            this.flagComplete = true;
            // this.task.closeAction();

            // Сбросить курсор и сменить инструменты
            this.drawpanel.style.cursor = 'default';

            // TODO запустить обработчик на редактирование !!!!!!!!
            // Скорректируем для точки
            if (this.editobject.spatialposition == 'point') {
                isautosave = true;
            }
            if (isautosave && this.task.options.autosave) {
                this.task.saveClick(null, GWTK.Util.bind(function(){
                    this.restoreComplete(this.name, subjectnumber)
                }, this));

            }
            else {
                // Скорректируем для точки
                // if (this.editobject.spatialposition != 'point') {
                    this.processEdition();
                // }
            }

            return true;
        },

        /**
         * Продолжить операцию создания предопределенных объектов, при отказе от сохранения
         * @param name
         * @param subjectnumber
         */
        restoreComplete: function(name, subjectnumber){
            switch(name){
                case 'horizontal_rectangle':
                case 'inclined_rectangle':
                case 'circle':
                    for (var i = this.editobject.geometry.count(subjectnumber); i > 1; i--) {
                        this.editobject.geometry.deletepoint(i, subjectnumber);
                    }
                    this.task.isSave = false;
            }

        },

        /**
         * Создание объекта - сложный многоугольник
         * @method createmultirect
         * @param subjectnumber {Int} Номер контура с 0
         */
        createmultirect: function (subjectnumber) {
            if (this.error) {
                return;
            }

            var el, points,
                newgeometry = this.editobject.geometry.createcopy();
            this.editobject.geometry.deletepoints(subjectnumber);

            el = document.getElementById(this.lineworkid[2]);
            if (el) {
                this.task.addpoint(parseFloat(el.getAttributeNS(null, 'x2')), parseFloat(el.getAttributeNS(null, 'y2')), null, subjectnumber, null, true);
                this.task.addpoint(parseFloat(el.getAttributeNS(null, 'x1')), parseFloat(el.getAttributeNS(null, 'y1')), null, subjectnumber, null, true);
            }

            points = newgeometry.getpoints(subjectnumber);
            if (points.length > 2) {
                for (var i = 0; i < points.length - 1; i++) {
                    this.task.addpointgeo(points[i].x, points[i].y, points[i].h, subjectnumber);
                }
            }
            else
                for (var i = points.length - 1; i >= 0; i--) {
                    this.task.addpointgeo(points[i].x, points[i].y, points[i].h, subjectnumber);
                }

            el = document.getElementById(this.lineworkid[3]);
            if (el) {
                this.task.addpoint(parseFloat(el.getAttributeNS(null, 'x1')), parseFloat(el.getAttributeNS(null, 'y1')), null, subjectnumber, null, true);
                this.task.addpoint(parseFloat(el.getAttributeNS(null, 'x2')), parseFloat(el.getAttributeNS(null, 'y2')), null, subjectnumber, null, true);
            }

            this.draw();

            this.task.history.add('all', null, subjectnumber, null, null, null, newgeometry, this.editobject.geometry);
        },

        /**
         * Откоррестировать метрику сложного многоугольника
         * @method correctMultirect
         */
        correctMultirect: function () {
            if (this.error || this.name != 'multi_rectangle' || !this.editobject || !this.editobject.geometry) {
                return;
            }
            // Удалим первую  и последнюю точки
            this.editobject.geometry.deletepoint(this.editobject.geometry.count(this.subjectnumber), this.subjectnumber);
            this.editobject.geometry.deletepoint(1, this.subjectnumber);
        },


        /**
         * Контекстное меню для точки объекта
         * @method popupmenu
         * @param div {Element} - Родительский элемент
         * @param x {Int} - Координата экрана x
         * @param y {Int} - Координата экрана y
         */
        popupmenu: function (e, div, x, y) {

            e.preventDefault();
            e.stopPropagation();

            // удалить меню и функцию
            $('#' + this.task.popupId).remove();
            // this.popupmenuClose = null;

            if (this.error || !this.editobject || !this.editobject.geometry) {
                return;
            }
            var editobject = this.editobject,
                rectdraw = (this.drawpanel) ? this.drawpanel.getBoundingClientRect() : 0,
                left = ((!div) ? (e.clientX - rectdraw.left).toString() : '0') + 'px',
                top  = ((!div) ? (e.clientY - rectdraw.top) .toString() : '0') + 'px';
            if (!isNaN(x)) left = parseInt(x - 5, 10) + 'px';
            if (!isNaN(y)) top = parseInt(y - 5, 10) + 'px';

            var subjectnumber = (div) ? this.drawobject.getsubjectnumber(div.id) : this.subjectnumber,
                pcount = editobject.geometry.count(subjectnumber);
            // if (pcount <= 1) {
            //     return;
            // }
            if (pcount <= 0) {
                return;
            }

            var styleDiv = ' style="left:' + left + ';top:' + top + '; cursor: pointer;opacity: 0.9"',
                class_menu = (!div) ? 'menucontext' : 'menupoint',
                deletepoint = (div) ? this.task.getItemPopup('deletepoint') : '',
                horizont = (pcount > 1) ? this.task.getItemPopup('horizont') : '',
                vertical = (pcount > 1) ? this.task.getItemPopup('vertical') : '',
                rightangle = (pcount > 1) ? this.task.getItemPopup('rightangle') : '',
                finish = (this.isValidOperation('finish') && subjectnumber == this.subjectnumber) ?
                    this.task.getItemPopup('finish') : '',
                closeobject = (this.isValidOperation('closeobject')) ? this.task.getItemPopup('closeobject') : '',
                changedirection = (this.isValidOperation('changedirection')) ? this.task.getItemPopup('changedirection') : '',
                issave = this.isValidOperation('save'),
                save = ((div && pcount > 1 && issave) || (!div && issave) ) ? this.task.getItemPopup('save') : '',
                cancel = this.task.getItemPopup('cancel');

            var text =
                '<div id="' + this.task.popupId + '" class=" map-panel-def editTable" ' + styleDiv + ' >' +
                    '<div align="left" class="' + class_menu + '" style="margin-left:5px; margin-top:5px;"></div>' +
                '<div>' +
                '<table cellspacing="2px;" cellpadding="2px" style="width:140px;">' +
                    deletepoint +
                    closeobject + // замкнуть
                    changedirection + // сменить направление
                    horizont +  // горизонтальная линия
                    vertical +  // вертикальная линия
                    rightangle +  // прямой угол
                    finish +   // завершить операцию
                    save +  // сохранить
                    cancel +  // отменить
                '</table>' +
                '</div></div>';

            $(this.drawpanel).append(text);


            var $popup = $('#' + this.task.popupId),
                $menupoint = $('.' + class_menu),
                _that = this;
            if ($menupoint.length > 0) {

                $menupoint[0].appendChild(GWTK.Util.createHeaderForComponent({
                    map: this.map,
                    callback: GWTK.Util.bind(function () {
                        $popup.remove();
                        this.topology.map_events('on');
                        return false;
                    }, this)
                }));

                var $popupclose = $menupoint.find('.panel-info-close');

                // // Функция закрытия меню
                // this.popupmenuClose = function(){
                //     $popupclose.click();
                // };

                $('#' + this.task.popupId + '_deletepoint').click(function (event) {
                    $popupclose.click();
                    if (!div) {
                        w2alert(w2utils.lang("There is no point to remove"));
                        return false;
                    }

                    // удалить точку
                    _that.task.deletepoint(_that.drawobject.getnumber(div.id) + 1, _that.drawobject.getsubjectnumber(div.id), 'create');
                    _that.task.updatedrawcontur(null);
                    return false;
                });

                // $('#' + this.task.popupId + '_sourcepoint').click(function (event) {
                //     $popupclose.click();
                //     if (!div) {
                //         w2alert(w2utils.lang("There is no point to remove"));
                //         return false;
                //     }
                //
                //     // найти ответную точку
                //     _that.task.selectSourceObject(_that.drawobject.getnumber(div.id), _that.drawobject.getsubjectnumber(div.id));
                //     return false;
                // });

                // Завершить
                $('#' + this.task.popupId + '_finish').click(function (event) {
                    $popupclose.click();
                    _that.complete();
                    return false;
                });

                // Замкнуть
                $('#' + this.task.popupId + '_closeobject').click(function (event) {
                    $popupclose.click();
                    _that.task.closeobject(false, subjectnumber);
                    _that.complete();
                    return false;
                });

                // Изменить направление
                $('#' + this.task.popupId + '_changedirection').click(function (event) {
                    $popupclose.click();
                    _that.task.changedirection(subjectnumber, 'create');
                    return false;
                });

                // Горизонтальная линия
                $('#' + this.task.popupId + '_horizont').click(function (event) {
                    _that.onHotKey({
                        'key' : 'H'
                    });
                    $popupclose.click();
                    return false;
                });

                // Вертикальная линия
                $('#' + this.task.popupId + '_vertical').click(function (event) {
                    _that.onHotKey({
                        'key' : 'V'
                    });
                    $popupclose.click();
                    return false;
                });

                // Прямой угол
                $('#' + this.task.popupId + '_rightangle').click(function (event) {
                    _that.onHotKey({
                        'key' : 'R'
                    });
                    $popupclose.click();
                    return false;
                });
                // Сохранение
                $('#' + this.task.popupId + '_save').click(function (event) {
                    $popupclose.click();
                    _that.task.saveClick(null, GWTK.Util.bind(function(){
                        _that.restoreComplete(_that.name, subjectnumber)
                    }, this));
                    return false;
                });
                // Отмена
                $('#' + this.task.popupId + '_cancel').click(function (event) {
                    $popupclose.click();
                    _that.task.isChange(false);
                    _that.task.cancelClick();
                    return false;
                });
            }

            // Отключить события карты
            this.topology.map_events('off');

        },

        /**
         * Запустить процесс редактирования объекта
         * @method processEdition
         * @param extend {Boolean}  Флаг использования расширеннного режима
         * чтобы не делать запрос на сохранение при промежуточных операциях
         */
        processEdition: function (extend) {

            this.task.extend = extend;
            this.task.addmenu();

            // запустить обработчик
            this.task.changeCurrentAction(new GWTK.MapeditorEditingActionExt(this.task, 'editing'));
        },


        /**
         * Нажатие горячей клавиши
         * @param hotkey
         * @param fn_callback
         */
        onHotKey: function(hotkey, fn_callback){
            if (fn_callback) {
                this.callbackHotKey = fn_callback;
            }

            if (this.name == 'free_line') {
                this.removeworklines();
            }

            if (hotkey) {
                this.hotkey = JSON.parse(JSON.stringify(hotkey));
                switch (this.hotkey.key) {
                    case 'D':    // D - Изменить направление
                        if (this.isValidOperation('changedirection')) {
                            this.task.changedirection(this.subjectnumber, 'create');
                        }
                        this.clearHotKey();
                        break;
                    case 'L':       // L - замкнуть объект
                        if (this.isValidOperation('closeobject')) {
                            this.task.closeobject(false, this.subjectnumber);
                            this.complete();
                        }
                        this.clearHotKey();
                        break;
                }
            }
        },

        clearHotKey: function(){
            this.hotkey = null;
            if (this.callbackHotKey) {
                this.callbackHotKey();
            }
        },

        /**
         * Проверка валидности операции
         * @param operation - операция
         * @param pointnumber - номер точки с 0
         * @param subjectnumber - номер подобъекта (с 0)
         * @returns {boolean}
         */
        isValidOperation: function(operation, pointnumber, subjectnumber){
            var ret = false;
            if (!this.editobject || !this.editobject.geometry || !operation) {
                return ret;
            }
            var spatialposition = this.editobject.spatialposition,
                pcount = this.editobject.geometry.count(subjectnumber);
            if (!spatialposition || !pcount) {
                return ret;
            }
            switch(operation) {
                case 'closeobject': // Замыкание
                    // если линейный или площадной объект и крайние точки не равны
                    if ((spatialposition.indexOf("linestring") >= 0 || spatialposition.indexOf("polygon") >= 0) && pcount > 2) {
                        ret = true;
                    }
                    break;
                case 'changedirection': // Смена напрвления цифрования
                    if (spatialposition != 'point' && pcount > 1) {
                        ret = true;
                    }
                    break;
                case 'finish': // Завершение операции
                    if ((spatialposition.indexOf("linestring") >= 0 && pcount > 1)) {
                        ret = true;
                    }
                    else {
                        if ((spatialposition.indexOf("polygon") >= 0 && pcount > 2)) {
                            ret = true;
                        }
                        else {
                            if ((spatialposition.indexOf("point") >= 0 && pcount == 1)) {
                                ret = true;
                            }
                            else {
                                if ((spatialposition == "title" || spatialposition == "vector") && pcount == 2) {
                                    ret = true;
                                }
                            }
                        }
                    }
                    break;
                case 'save':
                    if (this.task._ischange && pcount > 0) {
                        ret = true;
                    }
                    break;
            }

            return ret;
        },

        /**
         * Точка нормали ко второй точке отрезка
         * @param points (точки отрезка)
         * @param marker (произвольная точка)
         * @returns {*|GWTK.Point}
         */
        getNormalPoint: function(points, marker){
            if (!points || points.length < 2 ||
                points[0] instanceof GWTK.Point == false || points[1] instanceof GWTK.Point == false ||
                !marker || marker instanceof GWTK.Point == false) {
                return;
            }
            if (points[0].x == points[1].x) {
                return new GWTK.Point(marker.x, points[1].y);
            }

            if (points[0].y == points[1].y) {
                return new GWTK.Point(points[1].x, marker.y);
            }

            var k = (points[1].y - points[0].y) / (points[1].x - points[0].x),
                b2 = marker.y - k * marker.x,
                b4 = points[1].y + (1.0 / k * points[1].x),
                p3 = new GWTK.Point(((b4 - b2) * k) / (k * k + 1), (b2 + k * k * b4) / (1 + k * k));
            return p3;
        }


    };
    GWTK.Util.inherits(GWTK.MapeditorCreatingActionExt, GWTK.MapAction);



    // ===============================================================
    /**  Обработчик создания объекта карты по геолокации
     *
     * @param task - задача
     * @param name - наименование обработчик
     * @constructor
     */
    // ===============================================================

    GWTK.MapeditorCreationByGeolocationAction = function (task, name) {
        this.error = true;

        GWTK.MapAction.call(this, task, name);           // родительский конструктор
        this.onGeolocationTick = GWTK.Util.bind(this.onGeolocationTick, this);
        this.onRestoreHistory = GWTK.Util.bind(this.onRestoreHistory, this);

        this.map = this.getMap();
        if (!this.map) return;

        this.drawobject = this.task.drawobject;
        if (!this.drawobject) return;

        // Запросим объекты окружения, если их нет
        this.topology = this.task.topology;
        if (!this.topology) return;

        // this.task.onOverlayRefresh = GWTK.Util.bind(this.task.onOverlayRefresh, this.task);

        this.error = false;

    };


    GWTK.MapeditorCreationByGeolocationAction.prototype = {

        /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
         * @method set
         * @param options {Object} параметры обработчика
         */
        set: function (options) {
            if ( this.error) {
                return;
            }

            this.task.clearStatusBar();

            $(this.map.eventPane).on('geolocationtick', this.onGeolocationTick);
            $(this.map.eventPane).on('GWTK.mapeditorTask', this.onRestoreHistory);
            // Перерисовка окна карты
            // $(this.map.eventPane).on('overlayRefresh', this.task.onOverlayRefresh);

            // Cоздаем пустой объект, если его не было
            this.editobject = (this.task.editobjects && this.task.editobjects.length > 0) ? this.task.editobjects[0] : null;  // Редактируемый объект
            if (!this.editobject){
                this.task.createNewMapObject(this.editobject, GWTK.Util.bind(function(mapobject) {
                    // Если есть предварительно выбранный код
                    if (this.task.editNodeLast && this.task.editNodeLast.node) {

                        // назначим код
                        this.task.changeMapObjectCode(this.task.editNodeLast.node);

                        // Если графический слой, то установить тип этого объекта
                        if (task.graphic) {
                            task.setLegendCode(task.editNodeLast.node.code, 'key', task.editNodeLast.node, true);
                        }
                        else {
                            if (!this.task.isLegendSelect()) {
                                task.setLegendCode(task.editNodeLast.node.key, 'key', task.editNodeLast.node, true);
                            }
                        }
                    }
                    this.editobject = mapobject;
                }, this));

                // this.editobject = this.task.createNewMapObject();
                // // Если есть предварительно выбранный код
                // if (this.task.editNodeLast && this.task.editNodeLast.node) {
                //
                //     // назначим код
                //     this.task.changeMapObjectCode(this.task.editNodeLast.node);
                //
                //     // Если графический слой, то установить тип этого объекта
                //     if (this.task.graphic) {
                //         this.task.setLegendCode(this.task.editNodeLast.node.code, 'key', this.task.editNodeLast.node, true);
                //     }
                // }
            }

            this.drawpanel = this.task.drawpanel;
            if (!this.drawpanel) return;

            // Перерисовать карту с объектами топологии. Это обязательно!!!
            this.topology.searchObjectsByAreaFrame(null, [], 'create', null, true, w2utils.lang('Move track created'));

            this.onGeolocationTick();
        },


        /**
         * Сбросить настройки (отключение обработчиков событий, инициализация флажков и др.)
         * @method clear
         */
        clear: function () {
            if (this.error) {
                return;
            }

            $(this.map.eventPane).off('geolocationtick', this.onGeolocationTick);
            $(this.map.eventPane).off('GWTK.mapeditorTask', this.onRestoreHistory);
            // Перерисовка окна карты
            // $(this.map.eventPane).off('overlayRefresh', this.task.onOverlayRefresh);

            this.task.clearStatusBar();
        },

        canClose: function(){
            if (this.error) {
                return true;
            }
            return this.task.canClose();
        },

        /**
         * Отрисовка объекта
         */
        draw: function(){
            if (this.error) {
                return true;
            }
            this.drawobject.draw(this.editobject, this.topology.svgDraw, true, false, false, false);
        },


        /**
         * Событие на тиканье таймера геолокации (для режима "Мои перемещения")
         * @method  onGeolocationTick
         * @param event {Object} Событие
         */
        onGeolocationTick: function (event) {
           if ( this.error) {
                return;
            }

            $(this.map.eventPane).off('geolocationtick', this.onGeolocationTick);
            var editobject = this.task.editobjects[0];
            if (!editobject) {
                return;
            }
            var newgeometry = editobject.geometry.createcopy();
            var tool = this.map.mapTool("geolocation");
            if (!tool || !tool.process)
                return;
            var toolpoints = tool.process.objectDraw.points;
            var count, point;
            for (var i = 0; i < toolpoints.length; i++) {
                count = editobject.geometry.count(0);
                if (count > 0)
                    point = editobject.geometry.getpoint(count, 0);
                if (point) {
                    if (point.x == toolpoints[i].POINT_X && point.y == toolpoints[i].POINT_Y)
                        continue;
                }
                editobject.geometry.appendpoint(toolpoints[i].POINT_X, toolpoints[i].POINT_Y);
            }

            this.task.history.add('all', null, 0, null, null, null, newgeometry, editobject.geometry);
            this.task.isChange(true);
            this.task.updatedrawcontur();
            $(this.map.eventPane).on('geolocationtick', this.onGeolocationTick);

            this.draw();
        },

        /**
         * Событин на изменение данных объекта
         * @param event
         */
        onRestoreHistory: function (event) {
            if ( this.error) {
                return;
            }

            if (event && event.operation == 'restorehistory') {
                if (event.param && event.param.phase == 'after') {
                    // Пдменить метрику объекта в геолокации
                    var editobject = this.task.editobjects[0];
                    if (!editobject) {
                        return;
                    }
                    var tool = this.map.mapTool("geolocation");
                    if (!tool || !tool.process)
                        return;

                    tool.process.objectDraw.points = [];
                    var point, len = editobject.geometry.count();
                    for (var i = 0; i < len; i++) {
                        point = editobject.geometry.getpoint(i+1);
                        if (point) {
                            toolpoints.push({POINT_X:point.x,POINT_Y:point.y})
                        }
                    }

                    this.draw();
                }
            }
        }
};
    GWTK.Util.inherits(GWTK.MapeditorCreationByGeolocationAction, GWTK.MapAction);

}
