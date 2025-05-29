/*************************************** Нефедьева О. 22/10/18 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2018              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Выбор прямоугольной области карты               *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {
    /**
     * Выбор прямоугольной области карты
     * @class GWTK.SelectMapFrameAction
     * @constructor GWTK.SelectMapFrameAction
     */
    GWTK.SelectMapFrameAction = function(task, map, div) {
        
        this.toolname = 'SelectMapFrameAction';
        
        GWTK.MapAction.call(this, task);                                            // родительский конструктор
        
        if (this.task) {
            this.map = this.getMap();
        }else{
            this.map = map;
        }
        if (!this.map) {
            console.log("SelectMapFrameAction. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        
        this.container = div;
        if (!this.container) {                                                    // где рисуем
            this.container = this.map.drawPane;
        }
        var ws = this.map.getWindowSize();
        this.container.style.width = ws[0] + 'px';
        this.container.style.height = ws[1] + 'px';
        
        var elem = $(this.container).find('#imageFrameTemp');
        if (elem.length == 0) {
            this.canvas = GWTK.DomUtil.create('div', 'selectframe');              // рисуемый прямоугольник
            this.container.appendChild(this.canvas);
            this.canvas.id = 'imageFrameTemp';
        }else{
            this.canvas = elem[0];
            this.canvas.style.left = '0px';
            this.canvas.style.top = '0px';
        }
        this.x0 = 0;
        this.y0 = 0;
        this.error = false;
        this.handler = null;                                                      // обработчик завершения рисования
        
        this.onMousedown = GWTK.Util.bind(this.onMousedown, this);
        this.onMousemove = GWTK.Util.bind(this.onMousemove, this);
        this.onMouseup = GWTK.Util.bind(this.onMouseup, this);
        this.onClick = GWTK.Util.bind(this.onClick, this);
        
        return;
    };
    
    GWTK.SelectMapFrameAction.prototype = {
        /**
         * Инициализация класса
         * @method init
         */
        // ===============================================================
        init: function() {
            this.started = false;
            this.map.statusbar.clear();
            
            this.map.on({ phase: '*', type: 'mousedown', target: 'map', action: 'mapframe' }, this.onMousedown);
            this.map.on({ type: 'mousemove', target: 'map', phase: '*', action: 'mapframe' }, this.onMousemove);
            this.map.on({ type: 'mouseup', target: 'map', phase: '*', action: 'mapframe' }, this.onMouseup);
            this.map.on({ type: 'click', target: 'map', phase: '*', action: 'mapframe' }, this.onClick);
            
            var ws = this.map.getWindowSize();
            this.container.style.width = ws[0] + 'px';
            this.container.style.height = ws[1] + 'px';
            var elem = $(this.container).find('#imageFrameTemp');
            if (elem.length == 0) {
                this.canvas = GWTK.DomUtil.create('div', 'selectframe');              // рисуемый прямоугольник
                this.container.appendChild(this.canvas);
                this.canvas.id = 'imageFrameTemp';
            }
            return;
        },
        
        /**
         * Настроить для рисования
         * @method set
         * @param func {function} обработчик завершения выбора
         */
        // ===============================================================
        set: function(func) {
            
            if (!this.container || !this.canvas) return;
            
            // назначить обработчики событий мыши
            this.init();
            
            this.map.setCursor('');
            
            // удалить "старое" изображение
            this.clearRectImage();
            
            // назначить обработчик завершения рисования
            if (!func) this.handler = this.onMapframe;
            else this.handler = func;
            
            return;
        },
        
        /**
         * Обработчик события mousedown
         * @method mousedown
         * @param event {Object} объект события
         */
        // ===============================================================
        onMousedown: function(event) {
            
            if (this.started) return false;
            
            $(this.canvas).show();
            
            this.started = true;
            this.point1 = null;
            this.point2 = null;
            this.clearRectImage();
            
            this.point1 = GWTK.DomEvent.getMousePosition(event.originalEvent, this.map.eventPane);
            
            this.canvas.style.left = this.point1.x + 'px';
            this.canvas.style.top = this.point1.y + 'px';
            this.x0 = this.point1.x;
            this.y0 = this.point1.y;
            
            this.canvas.style.width = 0;
            this.canvas.style.height = 0;
            
            event.stopPropagation();
            
            return;
        },
        
        /**
         * Обработчик события mousemove
         * @method mousemove
         * @param event {Object} объект события
         */
        // ===============================================================
        onMousemove: function(event) {
            
            if (!event.action || event.action != 'mapframe')
                return;
            if (!this.started) return;
            
            var mpos = GWTK.DomEvent.getMousePosition(event.originalEvent, this.container);
            var x = Math.min(mpos.x, this.x0),
                y = Math.min(mpos.y, this.y0),
                w = Math.abs(mpos.x - this.x0),
                h = Math.abs(mpos.y - this.y0);
            if (!w || !h) {
                return;
            }
            this.canvas.style.top = y + 'px';
            this.canvas.style.left = x + 'px';
            
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = h + 'px';
            
            this.point2 = GWTK.DomEvent.getMousePosition(event.originalEvent, this.map.eventPane);
            
            event.stopPropagation();
            
            return false;
        },
        
        /**
         * Обработчик события mouseup
         * @method mouseup
         * @param event {Object} объект события
         */
        // ===============================================================
        onMouseup: function(event) {
            
            var tool = this;
            
            //var wind = { width: this.canvas.style.width, height: this.canvas.style.height, left: this.canvas.style.left, top: this.canvas.style.top };
            
            if (Math.abs(event.originalEvent.offsetX - this.x0) <= 1 && Math.abs(event.originalEvent.offsetY - this.y0) <= 1) {
                return false;
            }
            
            this.onMousemove(event);
            
            var wind = {
                width: this.canvas.style.width,
                height: this.canvas.style.height,
                left: this.canvas.style.left,
                top: this.canvas.style.top
            };
            
            this.started = false;
            
            this.image_update();
            
            var bbox = this.toGeo();
            if (bbox.length == 0) return false;
            
            if (this.map.options.maxBounds) {
                var frame = GWTK.latLngBounds(bbox[0], bbox[1]);
                if (!this.map.options.maxBounds.contains(frame) && !this.map.options.maxBounds.intersects(frame)) {
                    this.map.statusbar.set(w2utils.lang('Area is out of map bounds'));
                    return false;
                }
            }
            
            this.map.statusbar.clear();
            
            if (this.handler) {
                this.handler(bbox, wind);
            }else{
                this.onMapframe(bbox, wind);
            }
            
            $('#frameRect').fadeOut(3000, function() {
                tool.clearRectImage();
            });
            
            event.stopPropagation();
            
            return false;
        },
        
        /**
         * Обработчик события "click"
         * @method onClick
         */
        // ===============================================================
        onClick: function(event) {
            event.stopPropagation();
            return false;
        },
        
        /**
         * Преобразование выбранных координат в геодезические
         * @method toGeo
         * @return {Array}, [GWTK.LatLng,GWTK.LatLng] ([min,max])
         */
        // ===============================================================
        toGeo: function() {
            
            if (!this.point1 || !this.point2) return [];
            
            var coord = this.map.tiles.getLayersPointProjected(this.point1);
            var geo1 = coord.toGeoPoint();
            geo1 = GWTK.toLatLng([geo1.getLatitude(), geo1.getLongitude()]);
            
            coord = this.map.tiles.getLayersPointProjected(this.point2);
            var geo2 = coord.toGeoPoint();
            geo2 = GWTK.toLatLng([geo2.getLatitude(), geo2.getLongitude()]);
            
            var min = GWTK.toLatLng(0, 0), max = GWTK.toLatLng(0, 0);
            min.lat = Math.min(geo1.lat, geo2.lat);
            min.lng = Math.min(geo1.lng, geo2.lng);
            max.lat = Math.max(geo1.lat, geo2.lat);
            max.lng = Math.max(geo1.lng, geo2.lng);
            
            return [min, max];
        },
        
        /**
         * Обновить рисунок
         * @method image_update
         * Функция вызывается каждый раз, как пользователь завершит рисование.
         * Копирует временное изображение в постоянное и удаляет временное
         */
        // ===============================================================
        image_update: function() {
            
            if (this.started) return;
            
            // копируем Rect на underlayPane
            var imageContainer = this.map.underlayPane;
            imageContainer.style.left = 0 + 'px';                      // ?!
            imageContainer.style.top = 0 + 'px';
            
            var canva = $(imageContainer).find('#frameRect');
            if (canva.length == 0) {
                canva = GWTK.DomUtil.create('div', 'selectframe', this.map.underlayPane);
                canva.id = 'frameRect';
            }else{
                canva = canva[0];
            }
            
            canva.style.top = this.canvas.style.top;
            canva.style.left = this.canvas.style.left;
            canva.style.width = this.canvas.style.width;
            canva.style.height = this.canvas.style.height;
            
            // удаляем Rect
            var cnt = this;
            $(this.canvas).hide('slow', cnt.clearRect());
            $(canva).show();
            
            return;
        },
        
        /**
         * Удалить временный рисунок
         * @method clearRect
         */
        // ===============================================================
        clearRect: function() {
            
            if (this.started) return;
            
            this.canvas.style.left = '-100px';
            this.canvas.style.top = '-100px';
            this.canvas.style.width = 0;
            this.canvas.style.height = 0;
            
            return;
        },
        
        /**
         * Удалить рисунок
         * @method clearRectImage
         */
        // ===============================================================
        clearRectImage: function(map) {
            if (!map)
                return;
            var image = $(map.underlayPane).find('#frameRect');
            if (image.length == 0) {
                return;
            }else{
                image = image[0];
            }
            
            image.style.top = '-10px';
            image.style.left = '-10px';
            image.style.width = '0px';
            image.style.height = '0px';
            return;
        },
        
        /**
         * Очистить класс
         * @method clear
         */
        // ===============================================================
        clear: function() {
            
            this.started = false;
            this.clearRect();
            this.clearRectImage();
            
            $(this.canvas).remove();
            var $temp_img = $(this.map.underlayPane).find('#frameRect');
            $temp_img.remove();
            
            this.map.off({ phase: '*', type: 'mousedown', target: 'map', action: 'mapframe' }, this.onMousedown);
            this.map.off({ type: 'mousemove', target: 'map', phase: '*', action: 'mapframe' }, this.onMousemove);
            this.map.off({ type: 'mouseup', target: 'map', phase: '*', action: 'mapframe' }, this.onMouseup);
            this.map.off({ type: 'click', target: 'map', phase: '*', action: 'mapframe' }, this.onClick);
            
            this.started = false;
            this.point1 = null;
            this.point2 = null;
            
            if (this.task) {
                this.task.clearAction();
            }
            this.map.statusbar.clear();
            
            return;
        },
        
        /**
         * Отправить данные фрейма
         * @method onMapframe, event = { type: 'mapframe', bbox: bbox, geometry: coords, frame:frame }
         */
        // ===============================================================
        onMapframe: function(bbox, frame) {
            var coords = [];
            coords.push(bbox[0].lat);
            coords.push(bbox[0].lng);
            coords.push(bbox[1].lat);
            coords.push(bbox[0].lng);
            coords.push(bbox[1].lat);
            coords.push(bbox[1].lng);
            coords.push(bbox[0].lat);
            coords.push(bbox[1].lng);
            coords.push(bbox[0].lat);
            coords.push(bbox[0].lng);
            
            $(this.map.eventPane).trigger({ type: 'mapframe', bbox: bbox, geometry: coords, frame: frame });
            
            return;
        }
        
    };
    
    GWTK.Util.inherits(GWTK.SelectMapFrameAction, GWTK.MapAction);
}