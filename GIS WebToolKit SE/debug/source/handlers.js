/*************************************** Нефедьева О. 26/03/21 *****
 **************************************** Помозов Е.В. 19/03/21 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Обработчики событий карты                       *
 *                                                                  *
 *******************************************************************/

import PixelPoint from '~/geometry/PixelPoint';
import {CURSOR_TYPE} from './types/Types';

if (window.GWTK) {
    /**
     * Переменные для Touchscreen
     */
    var timeoutId;
    var TouchCoordClass = function() {
        this.x = 0;
        this.y = 0;                   // Координаты нажатия
        this.l = 0;                               // Расстояние до предыдущего по порядку нажатия на момент начала события (в пикселях)
    };
    var multiTouch = [];                                // Массив экземпляров класса touchCoordClass
    
    var TouchVarsClass = function() {
        this.touchStMove = false;
        this.maximumTargets = 2;                  // Количество одновременных нажатий
        this.originalCenter = new TouchCoordClass();
        this.currentCenter = new TouchCoordClass();
        this.x = 0;
        this.y = 0;                   // координаты тягача
        this.x0 = 0;
        this.y0 = 0;
        this.dx = 0;
        this.dy = 0;                 // смещение левого верхнего угла тягача
        this.zoom = 1;
        this.noZoomIn = false;
        this.noZoomOut = false;
        this.shiftLeft = 0;
        this.shiftTop = 0;    // смещение тягача при простом перетаскивании
    }
    var touchVars = new TouchVarsClass();
    
    /**
     * Управление событиями контрола и очередью обработчиков событий.
     */
    //=========================================================================================
    GWTK.Util.event = {
        /**
         * Подключить обработчик события
         * @method on
         * @param eventData {Object}, параметры события, { type: 'click', phase: 'before', type: 'click', target: 'map', originalEvent: event }
         * @param handler {function} обработчик события
         * Метод добавляет объект { event: eventData, handler: handler } в очередь (массив) обработчиков maphandlers
         */
        on: function(eventData, handler) {
            if (!$.isPlainObject(eventData)) eventData = { type: eventData };
            eventData = $.extend({ type: null, execute: 'before', target: null, onComplete: null }, eventData);
            
            if (!eventData.type) {
                console.log('ERROR: You must specify event type when calling .on() method of Map');
                return;
            }
            if (!handler) {
                console.log('ERROR: You must specify event handler function when calling .on() method of Map');
                return;
            }
            
            if (this.map) {
                if (Array.isArray(this.maphandlers)) {
                    this.maphandlers.push({ event: eventData, handler: handler });
                }else{
                    this.map.maphandlers.push({ event: eventData, handler: handler });
                }
            }else if (this instanceof GWTK.Map) {
                if (!Array.isArray(this.maphandlers)) this.maphandlers = [];
                this.maphandlers.push({ event: eventData, handler: handler });
            }else{
                console.log('ERROR: You must specify ref GWTK.Map when calling .on() method for event');
                return;
            }
        },
        
        /**
         * Отключить обработчик события
         * @method off
         * @param eventData {Object}, параметры события, { type: 'click', phase: '', target: '' }
         * @param handler {function} обработчик события
         * Метод удаляет объект { event: eventData, handler: handler } из очереди обработчиков maphandlers
         */
        off: function(eventData, handler) {
            if (eventData == undefined || eventData == null)
                return;
            if (!$.isPlainObject(eventData)) eventData = { type: eventData };
            eventData = $.extend({}, { type: null, execute: 'before', target: null, onComplete: null }, eventData);
            
            if (!eventData.type) {
                console.log('ERROR: You must specify event type when calling .off() method of Map');
                return;
            }
            if (!handler) {
                handler = null;
            }
            // remove handler
            var newHandlers = [], obj = {}, maphandlers = [];
            
            obj = this;
            if (obj.maphandlers) {
                maphandlers = obj.maphandlers;
            }else{
                if (obj.map)
                    maphandlers = obj.map.maphandlers;
            }
            
            for (var h = 0, len = maphandlers.length; h < len; h++) {
                var t = maphandlers[h];
                if ((t.event.type === eventData.type || eventData.type === '*') &&
                    (t.event.target === eventData.target || eventData.target === null) &&
                    (t.handler === handler || handler === null)) {
                    continue;
                }else{
                    newHandlers.push(t);
                }
            }
            
            if (obj.map) {
                if (obj.maphandlers)
                    obj.maphandlers = newHandlers;
                else
                    obj.map.maphandlers = newHandlers;
            }else{
                obj.maphandlers = newHandlers;
            }
            
            return;
        },
        
        /**
         * Выполнить обработчик события
         * @method trigger
         * @param eventData {Object}, параметры события, { type: 'click', type: '', target: '' }
         * Метод выполняет обработчики события eventData.type из очереди обработчиков maphandlers
         */
        trigger: function(eventData) {
            var eventData = $.extend({ type: null, phase: 'before', target: null }, eventData, {
                isStopped: false, isCancelled: false,
                preventDefault: function() {
                    this.isCancelled = true;
                },
                stopPropagation: function() {
                    this.isStopped = true;
                }
            });
            // main object events
            var funName = 'on' + eventData.type.substr(0, 1).toUpperCase() + eventData.type.substr(1);
            //todo: to be deleted!
            if (this.getTaskManager && this.getTaskManager() && this.getTaskManager().checkBlockingAction(funName)) {
                return;
            }
            
            
            if (eventData.phase === 'before') {
                eventData.onComplete = null;
            }
            var args, fun, tmp, handlers = [];
            
            if (this.maphandlers) {
                handlers = this.maphandlers;
            }else if (this.map) {
                handlers = this.map.maphandlers;
            }else{
                console.log('Error of trigger. Map is undefined.');
                return;
            }
            if (!Array.isArray(handlers)) handlers = [];
            
            // events in REVERSE order
            for (var h = handlers.length - 1; h >= 0; h--) {
                var item = handlers[h];
                if ((item.event.type === eventData.type || item.event.type === '*') &&
                    (item.event.target === eventData.target || item.event.target === null) &&
                    (item.event.execute === eventData.phase || item.event.execute === '*' || item.event.phase === '*')) {
                    eventData = $.extend({}, item.event, eventData);
                    item.handler.call(this, eventData);
                    if (eventData.isStopped === true || eventData.stop === true) {
                        return eventData;
                    }
                }
            }
            
            // main object events
            if (eventData.phase === 'before' && typeof this[funName] === 'function') {
                fun = this[funName];
                fun.call(this, eventData);
                if (eventData.isStopped === true || eventData.stop === true)
                    return eventData;
            }
            // item object events
            if (eventData.object != null && eventData.phase === 'before' &&
                typeof eventData.object[funName] === 'function') {
                fun = eventData.object[funName];
                fun.call(this, eventData);
                if (eventData.isStopped === true || eventData.stop === true) return eventData;
            }
            // execute onComplete
            if (eventData.phase === 'after' && typeof eventData.onComplete === 'function') {
                eventData.onComplete.call(this, eventData);
            }
            
            return eventData;
        }
    };
    
    /**
     * Класс обработчиков событий карты
     * @constructor Handlers
     * @param map {Object} карта GWTK.Map
     */
    // ===============================================================
    GWTK.Handlers = function(map) {
        this.map = map;
        this.x = 0;
        this.y = 0;
        this.dragstart = false;
        this.dragend = false;
        this.movedrag = new GWTK.MapDragData();
        this.dsize = 25;
        this.layersManager = null;
        this.lastWheelScalingEventTime = 0;
        
        this.mapclick = GWTK.bind(this.mapclick, this);
        this.mapmove = GWTK.bind(this.mapmove, this);
        this.mapdrag = GWTK.bind(this.mapdrag, this);
        this.mapmousedown = GWTK.bind(this.mapmousedown, this);
        this.mapmouseup = GWTK.bind(this.mapmouseup, this);
        this.mousemove = GWTK.bind(this.mousemove, this);
        this.zoominclick = GWTK.bind(this.zoominclick, this);
        this.zoomoutclick = GWTK.bind(this.zoomoutclick, this);
        this.clearAction = GWTK.bind(this.clearAction, this);
        this.semdocument_click = GWTK.bind(this.semdocument_click, this);
        this.objectsPane_close_click = GWTK.bind(this.objectsPane_close_click, this);
        this.textsearchinmap_click = GWTK.bind(this.textsearchinmap_click, this);
        this.mousewheelscaling = GWTK.bind(this.mousewheelscaling, this);
        this.touchStart = GWTK.bind(this.touchStart, this);
        this.touchEnd = GWTK.bind(this.touchEnd, this);
        this.touchMove = GWTK.bind(this.touchMove, this);
        
        this.pointersCount = 0;
        this.pointerTouches = {
            p1: {},
            p2: {},
            distance1: 0,
            distance2: 0,
            currentCenter: { x: 0, y: 0 },
            originalCenter: { x: 0, y: 0 }
        };
        this.lastTapTime = new Date().getTime();
        this.doubleTapDelay = 400;
    };
    GWTK.Handlers.prototype = {
        /**
         * Обработчик события `click` в карте
         * @method mapclick
         * @param event {Object} класс события
         */
        // ===============================================================
        mapclick: function(event) {
            var map = this.map;
            
            if (!event) event = window.event;
            
            event.preventDefault();
            event.stopPropagation();
            
            if (this.movedrag.drag == true) {
                this.movedrag.init();                     // завершить режим "drag"
                event.preventDefault();
                map._writeCookie();
                return false;
            }
            $(this.map.eventPane).off("mousemove", this.mapdrag);
            
            var point = GWTK.DomEvent.getMousePosition(event, map.panes.eventPane);
            var coord = map.tiles.getLayersPointProjected(point);
            if (!coord) return false;
            
            if (!this.map.tiles._testPointByMaxBounds(point)) {
                return false;
            }
            
            $(map.eventPane).trigger({ type: 'svgclick', dataobject: event });
            $(map.overlayPane).trigger({ type: 'mapclick', point: point, coord: coord });
            
            // запросить информацию об объектах
            map.getFeatureInfo(point);
            
            return false;
        },
        
        /**
         * Обработчик события `mousewheel`
         * @method mousewheelscaling
         * @param event {Object} класс события
         */
        // ===============================================================
        mousewheelscaling: function(event) {
            if (!event) event = window.event;
            
            if (!this.map) return false;
            
            var point = GWTK.DomEvent.getMousePosition(event, this.map.panes.eventPane);
            
            var delta = GWTK.DomEvent.getWheelDelta(event);
            
            var now = GWTK.Util.performanceNow();
            
            event.preventDefault();
            event.stopPropagation();
            event.returnValue = false;
            
            if (!this.map.tiles._testPointByMaxBounds(point)) {                   // проверить точку по габаритам карты (если они установлены)
                return false;
            }
            
            if (now - this.lastWheelScalingEventTime < 50) {
                return;
            }
            
            if (this.map.scaleManager && this.map.scaleManager.getZooming() != undefined) {                // масштабирование выполняется
                var that = this;
                setTimeout(function() {
                    that.mousewheelscaling(event);
                }, 200);
                return;
            }
            
            this.lastWheelScalingEventTime = now;
            
            var zoom = parseInt(this.map.options.tilematrix, 10) + delta;
            zoom = this.map.zoomLimit(zoom);                                       // новый масштаб
            if (zoom == this.map.options.tilematrix) {
                return;
            }
            var ratio = this.map.getZoomingRatio(zoom);
            
            var render = this.map.scaleManager;
            
            if (this.map.scaleManager.timer) {
                clearTimeout(this.map.scaleManager.timer);
                this.map.scaleManager.timer = false;
            }
            this.map.scaleManager.timer = setTimeout(function() {
                render.refreshMap();
                return;
            }, 500);
            
            this.map.scaleManager.zoomAnimate(ratio, point);
            
            return;
        },
        
        /**
         * Обработчик события `mousedown`
         * @method mapmousedown
         * @param event {Object} класс события
         */
        // ===============================================================
        mapmousedown: function(event) {
            
            if (event.shiftKey || ((event.button !== 0) && !event.touches)) {
                return;
            }
            
            if (window.PointerEvent && event.originalEvent && (event.originalEvent instanceof PointerEvent) && event.originalEvent.pointerType === 'touch') {
                this.touchPointerStart(event);
            }
            
            $(this.map.mapPane).onselectstart = function() {
                return false;
            };
            
            $(document).on(GWTK.mouseup + '.head', this.mapmouseup);
            
            $(document).on(GWTK.mousemove + '.head', this.mapdrag);
            
            // if (this.map.scaleManager.isActive()) { return; }
            if (this.map.scaleManager && this.map.scaleManager.isActive()) {
                return;
            }
            
            this.movedrag.setStartDrag(event);
            
            this.movedrag.prevGeoBounds = this.map.getMapGeoBounds(true);
            
            this.map.tiles._onMouseDown(event);
            
            GWTK.DomUtil.addClass(this.map.eventPane, 'cursor-dragging');
            
            return;
        },
        
        /**
         * Обработчик события `mouseup`
         * @method mapmouseup
         * @param event {Object} класс события
         */
        // ===============================================================
        mapmouseup: function(event) {
            
            if (window.PointerEvent && event.originalEvent && (event.originalEvent instanceof PointerEvent) && event.originalEvent.pointerType === 'touch') {
                this.touchPointerEnd(event);
            }
            
            $(document).off(GWTK.mouseup + '.head', this.mapmouseup);
            $(document).off(GWTK.mousemove + ".head", this.mapdrag);
            
            GWTK.DomUtil.removeClass(this.map.eventPane, 'cursor-dragging');
            
            this.map.setCursor('default');
            
            if (this.movedrag == null) return;
            
            if (this.movedrag.isDragEnabled()) {
                this.mapdrag(event, true);
                $(this.map.eventPane).off("mousemove", this.mapdrag);
                
                this.map.options.newCenterPixel = undefined;
                
                // var geo = this.map.options.center;
                // if (geo.lng > 180) {
                //    geo.lng = geo.lng - 360.0;
                // }
                // if (geo.lng < -180) {
                //     geo.lng = geo.lng + 360.0;
                // }
                // this.map.options.center = geo;
                this.map.setViewport(this.map.getCenter());
                
                this.movedrag.init();
                this.movedrag.drag = true;
                
                $(this.map.eventPane).trigger({
                    type: 'mapdragend',
                    offset: { 'left': parseFloat(this.map.tilePane.style.left), 'top': parseFloat(this.map.tilePane.style.top) }
                });

                this.map.setCursor( CURSOR_TYPE.default );

                this.map.overlayRefresh('move');
                
                //запоминаем новые габариты
                this.movedrag.newGeoBounds = this.map.getMapGeoBounds(true);
                //выдаем событие moveEnd для карты        Kozhanov  20.10.2015
                this.map.moveEnd(this.movedrag.prevGeoBounds, this.movedrag.newGeoBounds);
                
                this.map._writeCookie();
            }else{
                this.movedrag.init();
            }
            event.stopPropagation();
            event.preventDefault();
            
            return false;
        },
        
        /**
         * Обработчик события `move`
         * @method mapmove
         * @param event {Object} класс события
         */
        // ===============================================================
        mapmove: function(event) {
            
            if (this.pointersCount === 2) {
                this.touchPointerMove(event);
            }
            if (this.pointersCount === 2) return false;
            
            event.map = this.map;
            // отобразить координаты мыши
            //GWTK.DomEvent.getMouseGeoCoordinates(event);
            
            if (!this.movedrag.dragstart || this.movedrag.isDragEnabled()) {
                return;
            }
            
            this.movedrag.setDrag(event);                   // начать перемещение
            
            if (this.movedrag.isDragEnabled()) {
                
                this.map._initNewCenterPixel();
                
                var pixelTopLeft = this.map.getPixelMapTopLeft().round();
                
                $(this.map.eventPane).trigger({
                    type: 'mapdragstart',
                    offset: { 'left': pixelTopLeft.x, 'top': pixelTopLeft.y, 'center': this.map.getNewCenterPixel() }
                });
                
                $(this.map.eventPane).on("mousemove", this.mapdrag);

                this.map.setCursor( CURSOR_TYPE.move );

                return;
            }
        },
        
        /**
         * Обработчик события `move`
         * @method mapdrag
         * @param event {Object} класс события
         */
        // ===============================================================
        mapdrag: function(event, forсed) {
            
            var mapmove = this.movedrag;
            
            if (!mapmove.isDragEnabled()) return false;
            
            var flag = mapmove.lastDragTime;
            
            mapmove.setOffset(event);
            
            this.map.move(mapmove.dx, mapmove.dy);
            
            $(this.map.eventPane).trigger({ type: 'mapdrag', offset: { 'dx': mapmove.dx, 'dy': mapmove.dy } });
            
            return false;
        },
        
        
        /**
         * Обработчик клика кнопки zoomin
         * @method zoominclick
         * @param event {Object} класс события
         */
        // ===============================================================
        zoominclick: function(event) {
            if (!this.map || !this.map.scaleManager) {
                return false;
            }
            
            if (this.map.scaleManager.getZooming() != undefined) {                // масштабирование выполняется
                var that = this;
                setTimeout(function() {
                    that.zoominclick(event);
                }, 250);
                return;
            }
            
            this.applyZoom(1, null, event);
            
            return false;
        },
        
        /**
         * Обработчик клика кнопки zoomout
         * @method zoomoutclick
         * @param event {Object} класс события
         */
        // ===============================================================
        zoomoutclick: function(event) {
            if (!this.map || !this.map.scaleManager) {
                return false;
            }
            
            if (this.map.scaleManager.getZooming() != undefined) {
                var that = this;
                setTimeout(function() {
                    that.zoomoutclick(event);
                }, 250);
                return;
            }
            
            this.applyZoom(-1, null, event);
            
            return false;
        },
        
        /**
         * Выполнить масштабирование
         * @method applayZoom
         * @param zoom {Number} новый уровень матрицы
         * @param point {GWTK.Point} координаты точки в карте (пикселы)
         * @param event {Object} класс события
         */
        // ===============================================================
        applyZoom: function(delta, point, event) {
            if (typeof delta == 'undefined') {
                return false;
            }
            if (!this.map || !this.map.scaleManager) {
                return false;
            }
            var delta = parseInt(delta),
                zoom = parseInt(this.map.options.tilematrix, 10) + delta;
            zoom = this.map.zoomLimit(zoom);                                       // новый уровень масштаба
            if (zoom == this.map.options.tilematrix) {
                return;
            }
            
            var render = this.map.scaleManager,
                ratio = this.map.getZoomingRatio(zoom);
            if (this.map.scaleManager.timer) {
                clearTimeout(this.map.scaleManager.timer);
                this.map.scaleManager.timer = false;
            }
            // обновить карту
            this.map.scaleManager.timer = window.setTimeout(function() {
                    render.map.handlers.lastWheelScalingEventTime = 0;
                    render.refreshMap();
                    return;
                },
                800);
            
            // выполнить масштабирование
            this.map.scaleManager.zoomAnimate(ratio, point, event.timeStamp);
        },
        
        /**
         * Обработчик обновления списка отобранных объектов карты
         * @method onFeatureInfoRefreshed
         * @param event {Object} объект события
         */
        // ===============================================================
        onFeatureInfoRefreshed: function(event) {
            var map = this.map,
                centering = true,
                select = map.selectedObjects;
            if (!map) return;
            
            // if (map.taskManager.getTotalShowFeatureInfoFlag()) {
            //     return;
            // }
            
            if (!select.mapobjects || select.mapobjects.length === 0) {
                GWTK.Util.clearselectedFeatures(map);
                return;
            }
            
            if (!event.centering) {
                centering = false;
            }
            
            var mapObject = select.mapobjects[0];
            
            if (mapObject && centering && mapObject.objectcenter) {
                select.viewSelectedObject(mapObject);
            }
            
            select.drawSelectedObjects();
        },
        
        /**
         * Отобразить объект по идентификатору
         * (перебор отобранных в точке объектов по повторному клику)
         * @method onShowFeatureInfo
         * @param event {Object} объект события
         */
        // ===============================================================
        onShowFeatureInfo: function(event) {
            if (!this.map) return;
            
            var gid = event.mapobject ? event.mapobject : '',
                map = this.map, centering = false;
            
            // if (map.taskManager.getTotalShowFeatureInfoFlag()) {
            //     return;
            // }
            
            var mapObject = map.selectedObjects.findobjectsByGid(gid);
            
            if (!mapObject) {
                GWTK.Util.clearselectedFeatures(map);
                return;
            }
            if (!event.centering) {
                centering = false;
            }else{
                centering = true;
            }
            
            if (centering && mapObject.objectcenter) {
                map.selectedObjects.viewSelectedObject(mapObject);
            }
            
            map.selectedObjects.drawSelectedObjects(true, mapObject, !centering);
            
            $(map.eventPane).trigger({ type: 'featurelistclick', layer: mapObject.maplayerid, gid: gid });
            
            map.overlayRefresh();
            
            return false;
        },
        
        /**
         * Обработчик закрытия панели отобранных объектов
         * @method objectsPane_close_click
         */
        // ===============================================================
        objectsPane_close_click: function(event) {
            var map = this.map;
            if (!map) return;
            
            if (map.eventPane) {
                $(map.eventPane).trigger({ type: 'featurelistcanceled' });
            }
            
            // Сбросить найденные объекты
            GWTK.Util.clearselectedFeatures(map);
        },
        
        /**
         * Отменить выделенные объекты
         * @method clearselect_button_click
         */
        // ===============================================================
        clearselect_button_click: function(event) {
            if (event && event.target) {
                // if ($(event.target).hasClass('control-button-clearselect') && this.map.selectedObjects.mapobjects.length > 0) {
                //     this.map.onCloseComponent({});
                // }
            }
            // очистить список отобранных объектов
            if (this.objectsPane_close_click) {
                this.objectsPane_close_click(event);
            }
            if (this.map.getActiveObject()) {
                this.map.clearActiveObject();
            }
            this.map.clearSelectedObjects();
            
        },
        
        // *********************************************
        //    Обработчики touchscreens
        // *********************************************
        
        _getPointersDistance: function() {
            var count1 = Object.keys(this.pointerTouches.p1);
            var count2 = Object.keys(this.pointerTouches.p2);
            if (count1 < 1 || count2 < 1) return 0;
            
            var id1 = Object.keys(this.pointerTouches.p1)[0];
            var id2 = Object.keys(this.pointerTouches.p2)[0];
            
            var x1 = this.pointerTouches.p1[id1] ? this.pointerTouches.p1[id1].clientX : this.pointerTouches.p1[id1].clientX;
            var y1 = this.pointerTouches.p1[id1] ? this.pointerTouches.p1[id1].clientY : this.pointerTouches.p1[id1].clientY;
            var x2 = this.pointerTouches.p2[id2] ? this.pointerTouches.p2[id2].clientX : this.pointerTouches.p2[id2].clientX;
            var y2 = this.pointerTouches.p2[id2] ? this.pointerTouches.p2[id2].clientY : this.pointerTouches.p2[id2].clientY;
            
            return GWTK.Util.getLengthEx(x1, y1, x2, y2);
        },
        
        _getCenterBetweenPointers: function() {
            var count1 = Object.keys(this.pointerTouches.p1);
            var count2 = Object.keys(this.pointerTouches.p2);
            if (count1 < 1 || count2 < 1) return 0;
            
            var id1 = Object.keys(this.pointerTouches.p1)[0];
            var id2 = Object.keys(this.pointerTouches.p2)[0];
            return {
                x: parseInt(this.pointerTouches.p1[id1].clientX + this.pointerTouches.p2[id2].clientX / 2, 10),
                y: parseInt(this.pointerTouches.p1[id1].clientY + this.pointerTouches.p2[id2].clientY / 2, 10)
            }
        },
        
        /**
         * Обработчик начала перемещения
         * @method touchPointerStart
         * @param event - объект события
         */
        touchPointerStart: function(event) {
            
            if (this.pointersCount < 2) {
                if (this.pointersCount < 1) {
                    this.pointerTouches.p1 = event;
                }else if (this.pointersCount === 1) {
                    this.pointerTouches.p2 = event;
                }
                this.pointersCount++;
            }
            var eMapDiv = document.getElementById(this.map.divID);
            multiTouch = [];
            touchVars = new TouchVarsClass();
            touchVars.x = parseInt(eMapDiv.style.left, 10);
            if (isNaN(touchVars.x)) {
                touchVars.x = 0;
            }
            touchVars.y = parseInt(eMapDiv.style.top, 10);
            if (isNaN(touchVars.y)) {
                touchVars.y = 0;
            }
            
            var objXY = GWTK.Util.uiFindPos(eMapDiv);
            touchVars.x0 = objXY[0] + touchVars.x;
            touchVars.y0 = objXY[1] + touchVars.y;
            
            var p1 = new TouchCoordClass();
            if (this.pointerTouches.p1) {
                p1.x = this.pointerTouches.p1.pageX - touchVars.x0;
                p1.y = this.pointerTouches.p1.pageY - touchVars.y0;
                p1.id = event.originalEvent.pointerId;
                multiTouch.push(p1);
            }
            var p2 = new TouchCoordClass();
            if (this.pointerTouches.p2) {
                p2.x = this.pointerTouches.p2.pageX - touchVars.x0;
                p2.y = this.pointerTouches.p2.pageY - touchVars.y0;
                p2.id = event.originalEvent.pointerId;
                multiTouch.push(p2);
                p2.l = GWTK.Util.getLengthEx(multiTouch[0].x, multiTouch[0].y, multiTouch[1].x, multiTouch[1].y);
                
                touchVars.originalCenter.x = parseInt((multiTouch[0].x + multiTouch[1].x) / 2, 10);
                touchVars.originalCenter.y = parseInt((multiTouch[0].y + multiTouch[1].y) / 2, 10);
                touchVars.originalCenter.l = multiTouch[1].l;
            }
        },
        
        /**
         * Выполнить масштабирование
         * функция используется для масштабирования на мобильных устройствах
         * @method scaleByTouch
         * @param point{GWTK.Point} - координаты точки в карте (пикселы)
         * @param delta {Number} - новый уровень матрицы
         * @param duration {Number} - задержка анимации
         * @return {boolean}
         */
        scaleByTouch: function(point, delta, duration) {
            if (duration === undefined) {
                duration = 0;
            }
            var now = GWTK.Util.performanceNow();
            if (!this.map.tiles._testPointByMaxBounds(point)) {
                return false;
            }
            if (now - this.lastWheelScalingEventTime < 50) {
                return;
            }
            this.lastWheelScalingEventTime = now;
            var zoom = parseInt(this.map.options.tilematrix, 10) + delta;
            zoom = this.map.zoomLimit(zoom);                                       // новый масштаб
            if (zoom == this.map.options.tilematrix) {
                return;
            }
            var ratio = this.map.getZoomingRatio(zoom);
            var render = this.map.scaleManager;
            if (this.map.scaleManager.timer) {
                clearTimeout(this.map.scaleManager.timer);
                this.map.scaleManager.timer = false;
            }
            this.map.scaleManager.timer = window.setTimeout(function() {
                render.refreshMap();
                return;
            }, 100);
            this.map.scaleManager.zoomAnimate(ratio, point, duration);
            return;
        },
        
        /**
         * Обработчик перемещения
         * @method touchPointerMove
         * @param event
         */
        touchPointerMove: function(event) {
            event.preventDefault();
            var id = event.originalEvent.pointerId;
            var dX, dY, dL;  // Изменения текущего положения и расстояния между касаниями
            if (this.pointerTouches.p1 && this.pointerTouches.p1.originalEvent.pointerId === event.originalEvent.pointerId) {
                this.pointerTouches.p1[id] = event;
                touchVars.touchStMove = true;
                
                multiTouch[0].x += (event.pageX - touchVars.x0 - multiTouch[0].x);
                multiTouch[0].y += (event.pageY - touchVars.y0 - multiTouch[0].y);
                
            }else if (this.pointerTouches.p2 && this.pointerTouches.p2.originalEvent.pointerId === event.originalEvent.pointerId) {
                this.pointerTouches.p2 = event;
                
                multiTouch[1].x += (event.pageX - touchVars.x0 - multiTouch[1].x);
                multiTouch[1].y += (event.pageY - touchVars.y0 - multiTouch[1].y);
                multiTouch[1].l = GWTK.Util.getLengthEx(multiTouch[0].x, multiTouch[0].y, multiTouch[1].x, multiTouch[1].y);
            }
            touchVars.currentCenter.x = parseInt((multiTouch[0].x + multiTouch[1].x) / 2, 10);
            touchVars.currentCenter.y = parseInt((multiTouch[0].y + multiTouch[1].y) / 2, 10);
            touchVars.currentCenter.l = multiTouch[1].l;
            
            // Определяем коэффециент масштабирования рисунка карты
            touchVars.zoom = touchVars.currentCenter.l / touchVars.originalCenter.l;
            // Если достигнут предел масштабирования, и масштабирование идет
            // в обратном направлении - обновить длину отрезка между касаниями
            if (touchVars.zoom > 1 && touchVars.noZoomIn) {
                touchVars.zoom = 1;
                touchVars.originalCenter.l = touchVars.currentCenter.l;
            }
            if (touchVars.zoom < 1 && touchVars.noZoomOut) {
                touchVars.zoom = 1;
                touchVars.originalCenter.l = touchVars.currentCenter.l;
            }
            
            // Масштабирование и смещение карты и оверлеев
            touchVars.dx = parseInt(touchVars.currentCenter.x - touchVars.originalCenter.x * touchVars.zoom);
            touchVars.dy = parseInt(touchVars.currentCenter.y - touchVars.originalCenter.y * touchVars.zoom);
            // смасштабировать панель с картой в scale раз с центром масштабирования в точке x,y
            GWTK.Util.setMapPanelScale(touchVars.dx, touchVars.dy, touchVars.zoom);
        },
        /**
         * Обработчик окончания перемещения
         * @method touchPointerEnd
         * @param event - объект события
         */
        touchPointerEnd: function(event) {
            event.preventDefault();
            if (this.pointersCount === 2) {
                this.zoomByTouch(event);
            }
            
            // this.zoomByDoubleTap(event);
            
            this.pointersCount = 0;
            if (this.pointerTouches.p1[event.originalEvent.pointerId]) {
                delete this.pointerTouches.p1[event.originalEvent.pointerId];
            }
            if (this.pointerTouches.p2[event.originalEvent.pointerId]) {
                delete this.pointerTouches.p2[event.originalEvent.pointerId];
            }
        },
        
        /**
         * Обработчик масштабирования в точке
         * при двойном касании на Touch устройствах.
         * Функция вызывается в touchEnd, touchPointerEnd
         * @param {Object} event - Объект события
         * @return {boolean}
         */
        zoomByDoubleTap: function(event) {
            var now = new Date().getTime();
            var timeSince = now - this.lastTapTime;
            var finger;
            if ((timeSince < this.doubleTapDelay) && (timeSince > 0)) {
                if (event.changedTouches !== undefined) {
                    finger = event.changedTouches[0];
                }else{
                    finger = event;
                }
                var point = { x: finger.clientX, y: finger.clientY };
                this.touchHasClick = false;
                this.scaleByTouch(point, 1, 250);
                return true;
            }
            this.lastTapTime = new Date().getTime();
            return false;
        },
        touchStart: function(event) {
            event.preventDefault();
            var eMapDiv = document.getElementById(this.map.divID);
            
            multiTouch = new Array();
            touchVars = new TouchVarsClass();
            touchVars.x = parseInt(eMapDiv.style.left, 10);
            if (isNaN(touchVars.x)) {
                touchVars.x = 0;
            }
            touchVars.y = parseInt(eMapDiv.style.top, 10);
            if (isNaN(touchVars.y)) {
                touchVars.y = 0;
            }
            var objXY = GWTK.Util.uiFindPos(eMapDiv);
            touchVars.x0 = objXY[0] + touchVars.x;
            touchVars.y0 = objXY[1] + touchVars.y;
            
            for (var i = 0; i < event.targetTouches.length; i++) {
                multiTouch[i] = new TouchCoordClass();
                multiTouch[i].x = event.targetTouches[i].pageX - touchVars.x0;
                multiTouch[i].y = event.targetTouches[i].pageY - touchVars.y0;
                if (i > 0) {
                    multiTouch[i].l = GWTK.Util.getLengthEx(multiTouch[i - 1].x, multiTouch[i - 1].y, multiTouch[i].x, multiTouch[i].y);
                }
                if (i >= touchVars.maximumTargets - 1) break;
            }
            
            if (multiTouch[1] != null) {
                touchVars.originalCenter.x = parseInt((multiTouch[0].x + multiTouch[1].x) / 2, 10);
                touchVars.originalCenter.y = parseInt((multiTouch[0].y + multiTouch[1].y) / 2, 10);
                touchVars.originalCenter.l = multiTouch[1].l;
            }
            
            this.fireMouseEvent(event);
            return false;
        },
        
        touchMove: function(event) {
            event.preventDefault();
            var dX, dY;  // Изменения текущего положения и расстояния между касаниями
            touchVars.touchStMove = true;
            // Зафиксируем текущее положение касаний
            for (var i = 0; i < event.targetTouches.length; i++) {
                // Определяем смещение положения касания
                dX = event.targetTouches[i].pageX - touchVars.x0 - multiTouch[i].x;
                dY = event.targetTouches[i].pageY - touchVars.y0 - multiTouch[i].y;
                multiTouch[i].x += dX;
                multiTouch[i].y += dY;
                
                // Определяем расстояние до предыдущего по списку касания
                if (i > 0) multiTouch[i].l = GWTK.Util.getLengthEx(multiTouch[i - 1].x, multiTouch[i - 1].y, multiTouch[i].x, multiTouch[i].y);
                
                // Число витков цикла - не больше разрешенного количества касаний
                if (i >= touchVars.maximumTargets - 1) break;
            }
            
            // Если касаний несколько, Масштабируем объект
            if (event.targetTouches.length >= 2) {
                // Текущее положение центра касания
                touchVars.currentCenter.x = parseInt((multiTouch[0].x + multiTouch[1].x) / 2, 10);
                touchVars.currentCenter.y = parseInt((multiTouch[0].y + multiTouch[1].y) / 2, 10);
                touchVars.currentCenter.l = multiTouch[1].l;
                
                // Определяем коэффециент масштабирования рисунка карты
                touchVars.zoom = touchVars.currentCenter.l / touchVars.originalCenter.l;
                
                // Если достигнут предел масштабирования, и масштабирование идет
                // в обратном направлении - обновить длину отрезка между касаниями
                if (touchVars.zoom > 1 && touchVars.noZoomIn) {
                    touchVars.zoom = 1;
                    touchVars.originalCenter.l = touchVars.currentCenter.l;
                }
                if (touchVars.zoom < 1 && touchVars.noZoomOut) {
                    touchVars.zoom = 1;
                    touchVars.originalCenter.l = touchVars.currentCenter.l;
                }
                
                // Масштабирование и смещение карты и оверлеев
                touchVars.dx = parseInt(touchVars.currentCenter.x - touchVars.originalCenter.x * touchVars.zoom);
                touchVars.dy = parseInt(touchVars.currentCenter.y - touchVars.originalCenter.y * touchVars.zoom);
                // смасштабировать панель с картой в scale раз с центром масштабирования в точке x,y
                GWTK.Util.setMapPanelScale(touchVars.dx, touchVars.dy, touchVars.zoom);
                
                return false;
            }else{
                touchVars.shiftLeft = dX; // Если касание одно, Перемещаем объект
                touchVars.shiftTop = dY;
            }
            
            this.fireMouseEvent(event);
            
            return false;
        },
        
        touchEnd: function(event) {
            var map = this.map;
            
            if (GWTK.movedrag() == null) return;
            
            if (GWTK.movedrag().isDragEnabled()) {
                
                $(this).off("mousemove", this.mapdrag);
                
                map.options.newCenterPixel = undefined;
                map.setViewport(map.getCenter());
                
                GWTK.movedrag().init();
                this.movedrag.drag = true;
                $(map.eventPane).trigger({
                    type: 'mapdragend',
                    offset: { 'left': parseFloat(map.tilePane.style.left), 'top': parseFloat(map.tilePane.style.top) }
                });
                
                this.map.trigger({
                    type: 'mapdragend',
                    offset: { 'left': parseFloat(this.map.tilePane.style.left), 'top': parseFloat(this.map.tilePane.style.top) }
                });
                
                map.overlayRefresh('move');
                
                //запоминаем новые габариты
                GWTK.movedrag().newGeoBounds = map.getMapGeoBounds(true);
                // выдаем событие moveEnd для карты   Kozhanov + 20/10/2015
                map.moveEnd(GWTK.movedrag().prevGeoBounds, GWTK.movedrag().newGeoBounds);
            }else{
                GWTK.movedrag().init();
            }
            
            event.preventDefault();
            
            // Масштабирование "pinch zoom"
            if (typeof (multiTouch[1]) != 'undefined') {
                if (event.targetTouches.length == 0) { // проверка, чтоб работало на отпускание последнего пальца (а то на отпускание каждого пальца шло масштабирование)
                    this.zoomByTouch(event);
                }
                return false;
            }
            
            if (!touchVars.touchStMove) {
                var type = "click";
            }
            this.touchHasClick = true;
            var wasScaled = this.zoomByDoubleTap(event);
            if (wasScaled) {
                return false;
            }
            
            setTimeout(function() {
                if (this.touchHasClick) {
                    this.fireMouseEvent(event, type);
                }
            }.bind(this), this.doubleTapDelay);
            
            return false;
        },
        
        zoomByTouch: function() {
            var delta, k = 2,
                dx = touchVars.currentCenter.x - touchVars.originalCenter.x,
                dy = touchVars.currentCenter.y - touchVars.originalCenter.y,
                zoom = Math.ceil(touchVars.zoom * 100) / 100;
            var point;
            if (zoom > 1 && zoom <= 2) {
                zoom *= k;
            }
            if (zoom >= 0.5 && zoom < 1) {
                zoom /= k;
            }
            if (zoom > 1) {
                delta = Math.round(Math.sqrt(zoom)) - 1;
                point = { x: touchVars.originalCenter.x - dx, y: touchVars.originalCenter.y - dy };
            }else{
                delta = 1 - Math.round(Math.sqrt(1 / zoom));
                point = { x: touchVars.originalCenter.x + (2 * dx), y: touchVars.originalCenter.y + (2 * dy) };
            }
            this.scaleByTouch(point, delta);
            GWTK.Util.setMapPanelScale(touchVars.dx, touchVars.dy, 0);
        },
        
        mouseCoords: function(ev) {
            if (ev.pageX || ev.pageY) {
                return { x: ev.pageX, y: ev.pageY };
            }else{
                return {
                    x: ev.clientX + document.documentElement.scrollLeft,
                    y: ev.clientY + document.documentElement.scrollTop
                };
            }
        },
        
        fireMouseEvent: function(event, click) {
            var touches = event.changedTouches,
                first = touches[0],
                type = "";
            
            if (click === 'click') {
                type = "click";
            }else{
                switch (event.type) {
                    case "touchstart":
                        type = "mousedown";
                        break;
                    case "touchmove":
                        type = "mousemove";
                        break;
                    case "touchend":
                        type = "mouseup";
                        break;
                    default:
                        return;
                }
            }
            
            var simulatedEvent = document.createEvent('MouseEvent');
            simulatedEvent.initMouseEvent(type, true, true, window, 1,
                first.screenX, first.screenY,
                first.clientX, first.clientY, false, false, false, false, 0, null);
            
            first.target.dispatchEvent(simulatedEvent);
            
            event.preventDefault();
        },
        
        // Отменить текущую операцию на карте
        clearAction: function(context) {
            if (!this.map || !this.map.panes.toolbarPane)
                return;
            var map = this.map;
            var act = $(map.panes.toolbarPane).find('.control-button');
            
            var flag = false;
            for (var i = 0; i < act.length; i++) {
                if ($(act[i]).hasClass('control-button-radio')) {
                    if ($(act[i]).hasClass('control-button-active')) {
                        $(act[i]).removeClass('control-button-active');
                        flag = true;
                    }
                }
            }
            
            if (flag) {
                var matrixControl = map.mapTool('matrixcontrol');
                if (matrixControl) {
                    if (matrixControl.activ) {
                        matrixControl.destroyMatrixControl();
                    }
                }
            }
            
            // сообщение об отмене обработчика
            $(map.eventPane).trigger({ type: 'actioncancel', sender: context });
        },
        
        /**
         * Обработчик загрузки файла документа из семантики объекта
         * @method onSemdocument_click
         */
        // ===============================================================
        onSemdocument_click: function(event) {
            var target = event.target || event.srcElement,
                $target = $(target);
            if ($target.hasClass('panel-info-text-semdocument') === false)
                return;
            
            this.getFileDocument($target.attr('layerId'), $target.attr('semdoc'));
            
            event.stopPropagation();
            return false;
        },
        
        /**
         * Загрузить файл документа с ГИС Сервера из семантики (RESTMETHOD=GETFILEFROMSEMANTIC)
         * @method getFileDocument
         * @param layerid {String} идентификатор слоя карты сервиса
         * @param semvalue {String} значение семантики, содержит алиас документа ГИС Сервера
         * при успешном выполнении запроса файл выводится в браузер
         */
        // ===============================================================
        getFileDocument: function(layerid, semvalue) {
            if (!layerid || !semvalue)
                return;
            var maplay = this.map.tiles.getLayerByIdService(layerid);
            if (!maplay) return;
            var semfilename = this.getFileNameFromSemantic(semvalue);
            var names = semfilename.split('.');
            if (names.length >= 2) {
                names.length = names.length - 1;
                semfilename = names.join('.');
            }
            if (semfilename.indexOf(',') > -1) {
                semfilename = semfilename.replace(/,/g, "_");
            }
            
            // адрес запроса
            var server = GWTK.Util.getServerUrl(maplay.serverUrl || maplay.server);
            if (!server) return;
            
            // получить файл с ГИС Сервера в кэш сервиса
            var url = server + "?SERVICE=WFS&RESTMETHOD=GETFILEFROMSEMANTIC&LAYER=" + layerid + "&ALIAS=" + encodeURIComponent(semvalue);
            
            var settings = {};
            if (this.map.authTypeServer(server) || this.map.authTypeExternal(server)) {
                settings.xhrFields = { withCredentials: true };         // внешняя авторизация на сервисе или pam
            }else{
                var token = this.map.getToken();                       // авторизация токеном
                if (token && maplay.options.token) {
                    settings.beforeSend = function(xhr) {
                        xhr.setRequestHeader(GWTK.AUTH_TOKEN, token);
                    }
                }
            }
            
            var promise = $.ajax(url, settings);
            promise.then(
                function(data) {
                    var $xml = $(data), filename = '';
                    $xml.find('member').each(function() {
                        var xname = $(this).find('name');
                        if ($(xname).text() == 'FILENAME') {
                            var xfn = $(this).find('string');
                            filename = xfn.text();
                        }
                    });
                    if (!filename) {
                        console.log(w2utils.lang('Failed to get data') + ' !');
                        return;
                    }
                    // загрузить файл из кэша сервиса в обозреватель пользователя
                    url = server + "?SERVICE=WFS&Method=GetFile&FilePath=" + encodeURIComponent(filename) + "&RENAME=" + semfilename;
                    window.open(url, '_blank');
                    return;
                },
                function(err) {
                    console.log(err);
                    return err;
                }
            );
            return;
        },
        
        /**
         * Запросить имя файла из алиаса документа ГИС Сервера
         * @method getFileNameFromSemantic
         * @param semvalue {String} значение семантики - алиас документа ГИС Сервера
         */
        // ===============================================================
        getFileNameFromSemantic: function(semvalue) {
            if (!semvalue || semvalue.length == 0) return "";
            var docsem = semvalue.toLowerCase(), pos = -1, filename = '';
            if (docsem.indexOf('doc#') == -1) return semvalue;
            // в семантике алиас файла документа с ГИС Сервера
            pos = semvalue.lastIndexOf('#') + 1;
            filename = semvalue.substring(pos);
            return filename;
        },
        
        /**
         * Обработчик клика на кнопке тулбара
         * @method toolbar_button_click
         */
        // ===============================================================
        toolbar_button_click: function(event) {
            if (!event || !event.currentTarget || !event.currentTarget.id)
                return false;
            
            var id = event.currentTarget.id, button = $(event.currentTarget),
                panel = button[0]._pane;
            
            if (button.hasClass('control-button-active')) {
                button.removeClass('control-button-active');
                if (panel) $("#" + panel).hide('slow');
            }else{
                button.addClass('control-button-active');
                if (panel) $("#" + panel).show(300);
            }
        },
        
        /**
         * Изменить прозрачность слоя
         * @method changeLayerOpacity
         * @param layer {Object | String} объект слоя или идентификатор слоя
         * @param value {Number | String} значение прозрачности слоя
         */
        changeLayerOpacity: function(layer, value) {
            if (!layer) {
                return;
            }
            var mapLayer;
            if (typeof layer === 'string') {
                mapLayer = this.map.tiles.getLayerByxId(layer);
                if (!mapLayer) {
                    $(this.map.eventPane).trigger({
                        type: 'layercommand',
                        maplayer: { id: layer, act: 'opacitychanged', value: value }
                    });
                    this.map.trigger({
                        type: 'layercommand',
                        maplayer: { id: mapLayer.xId, act: 'opacitychanged', value }
                    });
                    return;
                }
            }else{
                mapLayer = layer;
            }
            var show = false,
                old = parseFloat(mapLayer.options.opacityValue);
            if (Math.abs(parseFloat(value) - old) >= 1.0) {
                show = true;
            }
            
            if (mapLayer.getType() == 'wms') {
                this.map.tiles.wmsManager.setMergedLayersOpacity(mapLayer, value);
            }
            
            mapLayer.setOpacity(mapLayer.initOpacity(value), show);
            
            this.map.tiles.saveLayersOpacity();
            
            $(this.map.eventPane).trigger({
                type: 'layercommand',
                maplayer: {
                    id: mapLayer.xId,
                    act: 'opacitychanged',
                    value: value,
                    layer: mapLayer
                }
            });
            this.map.trigger({
                type: 'layercommand',
                maplayer: { id: mapLayer.xId, act: 'opacitychanged', value, layer: mapLayer }
            });
        }
    };
    
    GWTK.MapDragData = function() {
        this.x = 0;            // накопленное смещение курсора по X
        this.y = 0;            // накопленное смещение курсора по Y
        this.x_prev = 0;       // X предыдущего события mousemove
        this.y_prev = 0;       // Y предыдущего события mousemove
        this.ddx = 5;          // допуск на срабатывание mapDrag
        this.ddy = 5;          // допуск на срабатывание mapDrag
        this.dx = 0;           // текущее приращение смещения по оси X
        this.dy = 0;           // текущее приращение смещения по оси Y
        this.drag = false;
        this.dragstart = false;
        this.point_ = GWTK.point(0, 0);
        
        // инициализация
        this.init = function() {
            this.x = 0;
            this.y = 0;
            this.x_prev = 0;
            this.y_prev = 0;
            this.dx = 0;
            this.dy = 0;
            this.drag = false;
            this.dragstart = false;
            this.point_.x = 0;
            this.point_.y = 0;
            this.lastDragTime = undefined;
        }
        
        // запросить положение курсора
        this.getOffsetPoint = function() {
            this.point_.x = this.x_prev;
            this.point_.y = this.y_prev;
            return this._point;
        }
        
        // установить положение курсора
        this.setOffsetPoint = function(point) {
            if (point == undefined || point == null) {
                this.x_prev = 0;
                this.y_prev = 0;
                return;
            }
            this.x_prev = point.x;
            this.y_prev = point.y;
        }
        
        this.setOffset = function(event) {
            if (event == undefined || event == null) return;
            this.dx = event.clientX - this.x_prev;
            this.dy = event.clientY - this.y_prev;
            this.x_prev = event.clientX;
            this.y_prev = event.clientY;
            this.x += this.dx;
            this.y += this.dy;
            this.lastDragTime = GWTK.Util.performanceNow();
            return;
        }
        
        this.isDragEnabled = function() {
            return (this.drag & this.dragstart);
        }
        
        this.setDrag = function(event) {
            this.drag = false;
            if (event == undefined) return;
            var point = new PixelPoint(event.clientX, event.clientY);
            point.subtract(new PixelPoint(this.x_prev, this.y_prev), point);
            if (Math.abs(point.x) >= this.ddx || Math.abs(point.y) >= this.ddy) {
                this.drag = true;
                this.setOffset(event);
                this.x = 0;
                this.y = 0;
                this.lastDragTime = GWTK.Util.performanceNow();
            }
        }
        
        this.setStartDrag = function(event) {
            if (event == undefined) return;
            this.init();
            this.dragstart = true;
            this.x_prev = event.clientX;
            this.y_prev = event.clientY;
        }
    }
    
    GWTK.handlers = function(map) {
        GWTK.maphandlers = new GWTK.Handlers(map);
        return GWTK.maphandlers;
    };
    
    GWTK.movedrag = function() {
        
        if (!GWTK.maphandlers || !GWTK.maphandlers.movedrag)
            return null;
        
        return GWTK.maphandlers.movedrag;
    };
    
    GWTK.selectFeatures = function(map) {
        console.log('WARNING! GWTK.selectFeatures and GWTK.featureSearch are deprecated! Use instead map.selectedObjects');
        console.log('ПРЕДУПРЕЖДЕНИЕ! GWTK.selectFeatures и GWTK.featureSearch являются устаревшими! Используйте map.selectedObjects.');
        return;
    };
}