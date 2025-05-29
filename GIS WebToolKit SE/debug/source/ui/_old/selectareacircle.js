/**************************************** Нефедьева О. 23/10/18 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2018              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Выбор области в радиусе от точки                  *
 *                                                                  *
 *******************************************************************/


if (window.GWTK) {
    /**
     * Компонент Выбор области в радиусе от точки (круг)
     * @class GWTK.selectAreaCircle
     * @constructor GWTK.selectAreaCircle
     */
    GWTK.SelectAreaCircleAction = function (task, map, div) {

        this.toolname = 'selectAreaCircle';

        GWTK.MapAction.call(this, task, 'areasearchradius');                                            // родительский конструктор

        if (this.task) {
            this.map = this.getMap();
        }
        else {
            this.map = map;
        }
        if (!this.map) {
            console.log("selectAreaCircle. " + w2utils.lang("Not defined a required parameter") + " Map.");
            this.error = true;
            return;
        }
        
        if (!div)                                                                            // где рисуем
             this.container = this.map.drawPane;
        else this.container = div;
        
        var elem = $(this.container).find('selectcircle');
        if (elem.length == 0) {
            this.canvas = GWTK.DomUtil.create('div', 'selectcircle', this.container);         // что рисуем 
            this.canvas.id = 'imageTemp';
        }

        this.x0 = 0;                                                          // центр x
        this.y0 = 0;                                                          // центр y
        this.radius = 0;                                                      // радиус
        this.center = null;                                                   // координаты центра круга

        this.error = false;

        this.mousedown = GWTK.Util.bind(this.mousedown, this);
        this.mouseup = GWTK.Util.bind(this.mouseup, this);
        this.mousemove = GWTK.Util.bind(this.mousemove, this);
        
        return;
    };

    GWTK.SelectAreaCircleAction.prototype = {
        /**
         * Инициализация компонента
         * @method init
         */
        // ===============================================================
        init: function () {
            this.started = false;
                        
            this.map.on({ "type": "mousedown", "target": "map", "phase": "before" }, this.mousedown);
            this.map.on({ "type": "mouseup", "target": "map", "phase": "before" }, this.mouseup);
            this.map.on({ "type": "mousemove", "target": "map", "phase": "before" }, this.mousemove);
            this.map.on({ "type": "click", "target": "map", "phase": "*" }, this.onClick);

            var ws = this.map.getWindowSize();
            this.container.style.width = ws[0] + 'px';
            this.container.style.height = ws[1] + 'px';

            this.center = null;
            this.radius = 0;
        },

        /**
         * Настроить для рисования
         * @method set
         */
        // ===============================================================
        set: function () {

            if (!this.container || !this.canvas) return;

            this.init();

            // удалить "старое" изображение
            this.clearImage();

            return;
        },

        /**
         * Обработчик события "click"
         * @method onClick
         */
        // ===============================================================
        onClick: function (e) {
            e.stopPropagation();
            return;
        },

        /**
          * Обработчик события "mousedown"
          * @method mousedown
          * @param event {Object}, EventData (look GWTK.Util.event)
          */
        // ===============================================================
        mousedown: function (event) {

            if (this.started){
                event.stopPropagation();
                return;
            }
            var tool = this;
            var map = this.map;

            tool.started = true;
            tool.point1 = null;

            tool.clearImage();

            $(this.map.eventPane).css('cursor', '');
            
            if (this.map.options.maxBounds) {
                
                if ( !this.map.tiles._testPointByMaxBounds(
                    GWTK.DomEvent.getMousePosition(event, this.map.panes.eventPane))) {
                    this.map.statusbar.set(w2utils.lang('Point is out of map bounds'));
                    return;
                }
            }
            
            tool.radius = 5;
            tool.canvas.style.width = 10 + 'px';
            tool.canvas.style.height = 10 + 'px';
            $(tool.canvas).stop().fadeIn(1);

            tool.point1 = GWTK.DomEvent.getMousePosition(event, this.map.panes.eventPane);
            tool.x0 = tool.point1.x;
            tool.y0 = tool.point1.y;

            tool.canvas.style.left = (tool.x0 - tool.radius) + 'px';
            tool.canvas.style.top = (tool.y0 - tool.radius) + 'px';

            $('.selectcircle-center').remove();                            // отметка центра
            var center = GWTK.DomUtil.create('div', 'selectcircle-center', tool.container);
            center.style.left = (tool.x0 - tool.radius) + 'px';
            center.style.top = (tool.y0 - tool.radius) + 'px';

            tool.center = tool.toGeo(tool.point1);                         // гео координаты центра
            
            event.stopPropagation();
            return;
        },

        /**
         * Обработчик события "mousemove"
         * @method mousemove
         * @param event {Object}, EventData (look GWTK.Util.event)
         */
        // ===============================================================
        mousemove: function (event) {
  
            if (!this.started) return;

            var map = this.map;    
            
            this.point2 = GWTK.DomEvent.getMousePosition(event.originalEvent, map.panes.eventPane);
                         
            var mpos = GWTK.DomEvent.getMousePosition(event.originalEvent, this.container);
            var r = this.point1.distanceTo(mpos);
            if (r < 6) r = 6;
            
            var x = this.x0 - r,
                y = this.y0 - r,
                borderR = 2 * parseInt(r) + 'px';
            this.canvas.style.top = y + 'px';
            this.canvas.style.left = x + 'px';
            this.canvas.style.width = 2 * r + 'px';
            this.canvas.style.height = 2 * r + 'px';
            $(this.canvas).css('border-radius', borderR);
            $(this.canvas).css('-webkit-border-radius', borderR);

            this.radius = r;
            this.radius_meter = this.center.distanceTo(this.toGeo(this.point2));

            this.showLabel(this.point2.x, this.point2.y, this.radius_meter);

            event.stopPropagation();
            return false;
        },

        /**
        * Обработчик события "mouseup"
        * @method mouseup
        * @param event {Object}, EventData (look GWTK.Util.event)
        */
        // ===============================================================
        mouseup: function (event) {
            
            var tool = this;
            if (!this.started) return false;

            if (Math.abs(event.originalEvent.offsetX - tool.x0) <= 1 && Math.abs(event.originalEvent.offsetY - tool.y0) <= 1) return false;

            this.started = false;

            this.image_update();

            var coord = this.getRing();
                        
            $(this.map.eventPane).trigger({ type: 'circlearea', circle: { 'center': this.center, 'radius': this.radius_meter, 'ring': coord } });

            $('.selectcircle-center').remove();
            $('#infolabel').remove();
            $(this.canvas).fadeOut(3000, function () { tool.clearImage(); });
            
            event.stopPropagation();

            return false;
        },

        /**
        * Преобразовать координаты точки (pixel to Geo)
        * @method toGeo
        * @param point {GWTK.point}, pixels 
        */
        // ===============================================================
        toGeo: function (point) {
            if (!point) return null;
            point = GWTK.point(point);
            var coord = this.map.tiles.getLayersPointProjected(point);
            var geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
            geo = GWTK.toLatLng(geo);
            return geo;
        },

       /**
        * Обновить изображение круга
        * @method image_update
        * Функция вызывается каждый раз после того, как пользователь
        * завершит рисование. Копирует imageTemp в areaCircle и очищает imageTemp.
        */
        // ===============================================================
        image_update: function () {
            var tool = this.map.mapTool('areaSearch');
            if (!tool || !tool.action) return false;
            tool = this;

            if (this.started) return;

            // копируем Circle на underlayPane
            var imageContainer = this.map.underlayPane;
            imageContainer.style.left = 0 + 'px';                      
            imageContainer.style.top = 0 + 'px';

            $(imageContainer).find('#areaCircle').remove();

            var canva = $(tool.canvas).clone(true);
            canva[0].id = 'areaCircle';
            canva.appendTo(this.map.underlayPane);

            canva[0].style.top = tool.canvas.style.top;
            canva[0].style.left = tool.canvas.style.left;
            canva[0].style.width = tool.canvas.style.width;
            canva[0].style.height = tool.canvas.style.height;

            // удаляем Circle
            this.clearCircle();
        },

        /**
         * Запросить координаты окружности
         * @method getRing
         * @return {Array} геодезические координаты точек окружности по
         * координатам центра и значению радиуса
        */
        // ===============================================================
        getRing: function () {
            if (!this.map) return null;

            var angle_delta = Math.PI * 18 / 180.0,
            angle = 0.0, i, x, y,
            coord = [], geo,
            center_meter = this.map.tiles.getLayersPointProjected(this.point1);
            var p2 = this.map.tiles.getLayersPointProjected(this.point2);
            var R = center_meter.distanceTo(p2);                           // 21/06/18

            for (i = 0; i < 20; i++)
            {
                //y = this.radius_meter * Math.sin(angle) + center_meter.x;
                //x = this.radius_meter * Math.cos(angle) + center_meter.y;
                y = R * Math.sin(angle) + center_meter.x;
                x = R * Math.cos(angle) + center_meter.y;
                geo = GWTK.projection.xy2geo(this.map.options.crs, x, y);
                coord.push(geo[0]);
                coord.push(geo[1]);
                angle += angle_delta;
            }

            coord.push(coord[0]);
            coord.push(coord[1]);
            return coord;
         },

        /**
         * Очистить канву для изображения 
         * @method clearCircle
        */
        // ===============================================================
        clearCircle: function () {
           
            if (!this.canvas) return;

            this.canvas.style.left = -100 +'px';
            this.canvas.style.top = -100 + 'px';
            this.canvas.style.width = 10 + 'px';
            this.canvas.style.height = 10 + 'px';

            this.map.statusbar.clear();
            
            return;
        },

        /**
         * Очистить изображение 
         * @method clearCircle
        */
        // ===============================================================
        clearImage: function () {

            var image = $(this.map.underlayPane).find('#areaCircle');
            if (image.length == 0) {
                return;
            }
            else {
                image = image[0];
            }

            image.style.top = -100 + 'px';
            image.style.left = -100 + 'px';
            image.style.width = 10 + 'px';
            image.style.height = 10 + 'px';

            $('#infolabel').remove();

            this.map.statusbar.clear();

            return;
        },

        /**
         * Очистить компонент (удалить изображение, отключить события) 
         * @method clear
         */
        // ===============================================================
        clear: function () {

            this.clearCircle();
            $('#infolabel').remove();
            $('.selectcircle-center').remove();
            $('.selectcircle').remove();

            this.map.off({ "type": "mousedown", "target": "map", "phase": "before" }, this.mousedown);
            this.map.off({ "type": "mouseup", "target": "map", "phase": "before" }, this.mouseup);
            this.map.off({ "type": "mousemove", "target": "map", "phase": "before" }, this.mousemove);
            this.map.off( { "type": "click", "target": "map", "phase": "*" }, this.onClick);

            this.started = false;
            this.point1 = null;
            if (this.task) {
                this.task.clearAction();
            }
            return;
        },

        /**
         * Отобразить значение радиуса 
         * @method showLabel
        */
        // ===============================================================
        showLabel: function (x, y, r) {
            if (!x || !y || !r)
                return;
            var id = "infolabel",
            elem = $('#infolabel');
            if (elem.length == 0) {
                elem = GWTK.DomUtil.create('div', '', this.container);
                elem.id = "infolabel";
                elem.className = 'ruler-point-hint selectcircle-label';
                elem = $(elem);
            }
          
            if (elem.length == 0) return;

            elem[0].style.left = parseInt(x) + 'px';
            elem[0].style.top = parseInt(y) + 'px';
            var rr = parseInt(r), units = " м"; 
            if (rr > 1000) { rr = parseFloat(r) / 1000.0; units = " км"; }
            rr = GWTK.Util.formatting(rr, units);
            elem.html('R = ' + rr);
            return;
        }

    };

    GWTK.Util.inherits(GWTK.SelectAreaCircleAction, GWTK.MapAction);
}