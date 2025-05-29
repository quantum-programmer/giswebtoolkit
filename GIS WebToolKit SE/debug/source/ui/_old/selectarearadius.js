 /*************************************** Нефедьева О. 05/02/21 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Выбор области по расстоянию от точки              *
 *                                                                  *
 *******************************************************************/


if (window.GWTK) {
    /**
     * Компонент Выбор области в радиусе от точки (круг)
     * @class GWTK.SelectAreaCircleAction
     * @constructor GWTK.SelectAreaCircleAction
     * @param task {GWTK.AreaSearchTask}, ссылка на задачу
     * @param map {GWTK.Map}, ссылка на карту
     * @param div {HTML Element} контейнер для рисования
     * @param distance {Float} расстояние, метры
     */
    GWTK.SelectAreaRadiusAction = function (task, map, div, distance) {

        this.toolname = 'selectAreaRadius';

        GWTK.MapAction.call(this, task, 'areasearchradius');                                            // родительский конструктор

        if (this.task) {
            this.map = this.getMap();
        }
        else {
            this.map = map;
        }
        if (!this.map) {
            console.log("selectAreaRadius. " + w2utils.lang("Not defined a required parameter") + " Map.");
            this.error = true;
            return;
        }

        var _id = GWTK.Util.randomInt(50000, 80000);                                // идентификатор элементов (суффикс)
        this.getId = function () { return _id; };

        if (!div) {                                                                 // где рисуем
            this.container = this.map.drawPane;
        }
        else {
            this.container = div;
        }

        var elem = $(this.container).find('selectcircle');
        if (elem.length == 0) {
            this.canvas = GWTK.DomUtil.create('div', 'selectcircle', this.container);
            this.canvas.id = 'imagecircle';
        }
        else {
            this.canvas = elem[0];
        }
        this.$canvas = $(this.canvas);                                                // что рисуем

        this.x0 = 0;                                                                  // центр x
        this.y0 = 0;                                                                  // центр y
        this.radius = 0;                                                              // радиус, пикселы
        this.center = null;                                                           // координаты точки (центр круга)
        this.error = false;                                                           // признак ошибки

        if (isNaN(distance)) {                                                        // радиус, метры
            this.error = true;
            this.distance = false;
        }
        else {
            this.distance = parseFloat(distance);
        }

        this.mousedown = GWTK.Util.bind(this.mousedown, this);
        this.onClick = GWTK.Util.bind(this.onClick, this);

        return;
    };

    GWTK.SelectAreaRadiusAction.prototype = {
        /**
         * Инициализация компонента
         * @method init
         */
        // ===============================================================
        init: function () {
            this.started = false;

            this.map.on({ "type": "mousedown", "target": "map", "phase": "before" }, this.mousedown);
            this.map.on({ "type": "click", "target": "map", "phase": "*" }, this.onClick);

            var ws = this.map.getWindowSize();
            this.container.style.width = ws[0] + 'px';
            this.container.style.height = ws[1] + 'px';

            this.center = null;

            this.error = !$.isNumeric(this.distance);

            this.mapculc = new GWTK.MapCalculations(this.map);

            return;
        },

        /**
         * Настроить для рисования
         * @method set
         */
        // ===============================================================
        set: function () {

            if (!this.container || !this.canvas) return;

            // инициализировать
            this.init();

            // очистить изображение
            this.clearCircle();

            return;
        },

        /**
        * Установить расстояние поиска
        * @method setDistance
        * @param distance {Float} расстояние, метры
        * @return {Boolean} `true`/`false`
        */
        // ===============================================================
        setDistance: function (distance) {
            if (isNaN(distance)) {
                return false;
            }
            this.distance = parseFloat(distance);
            this.error = false;

            return true;
        },

         /**
          * Обработчик события "mousedown"
          * @method mousedown
          * @param event {Object}, EventData (look GWTK.Util.event)
          */
        // ===============================================================
        mousedown: function (event) {

            this.map.statusbar.clearText();

            if (this.error) {
                event.stopPropagation();
                this.map.statusbar.setText(w2utils.lang('Enter search radius'));
                return false;
            }

            this.map.handlers.clearselect_button_click(event.orinalEvent);

            event.stopPropagation();

            this.started = false;

            this.radius = this.getRadius();

            if (!this.radius) {
                this.map.statusbar.setText(w2utils.lang('Enter search radius'));
                return false;
            }

            this.started = true;

            $(this.map.eventPane).css('cursor', '');

            this.point1 = GWTK.DomEvent.getMousePosition(event, this.map.panes.eventPane);
            this.x0 = this.point1.x;
            this.y0 = this.point1.y;

            this.center = this.toGeo(this.point1);                         // гео координаты центра

            var d = parseInt(this.radius) * 2;                             // габариты канвы
            this.canvas.style.width = d + 'px';
            this.canvas.style.height = d + 'px';
            this.$canvas.css('border-radius', d);
            this.$canvas.css('-webkit-border-radius', d);

            this.canvas.style.left = (this.x0 - this.radius) + 'px';
            this.canvas.style.top = (this.y0 - this.radius) + 'px';

            var $imgcenter = this.$canvas.find('.selectcircle-center'), dcenter;   // отметка центра
            if ($imgcenter.length == 0) {
                dcenter = GWTK.DomUtil.create('div', 'selectcircle-center', this.canvas);
            }
            else {
                dcenter = $imgcenter[0];
            }
            dcenter.style.left = (this.radius - 5) + 'px';
            dcenter.style.top = (this.radius - 5) + 'px';

            this.$canvas.stop();
            this.$canvas.show();

            this.mouseup(event);

            return;
        },

        /**
        * Обработчик события "mouseup"
        * @method mouseup
        * @param event {Object}, EventData (look GWTK.Util.event)
        */
        // ===============================================================
        mouseup: function (event) {

            tool = this;

            if (!this.started) { return false; }

            this.started = false;

            var coord = this.getRing();

            $(this.map.eventPane).trigger({ type: 'circlearea', circle: { 'center': this.center, 'radius': this.distance, 'ring': coord } });

            $(this.canvas).fadeOut(2000);

            return false;
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
          * Запросить значение радиуса в пикселах
          * @method getRadius
         */
        // ===============================================================
        getRadius: function () {
            if (this.error || isNaN(this.distance)) {
                return 0;
            }
            var scale = this.map.getZoomScale(this.map.options.tilematrix);
            var pixelSpan = GWTK.tileView.getpixelSpan(scale, false);

            var pp = GWTK.point(200, 200),
                pp2 = GWTK.point(250, 250),
                pp_meter = this.map.tiles.getLayersPointProjected(pp),
                pp2_meter = this.map.tiles.getLayersPointProjected(pp2),
                pp_geo = this.toGeo(pp);
            var d_meter = pp_meter.distanceTo(pp2_meter),
                d_geo = pp_geo.distanceTo(this.toGeo(pp2)),
                geo_ratio = d_meter / d_geo;

            this.radius = (this.distance / pixelSpan) * geo_ratio;

            return this.radius;
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
         * Запросить координаты окружности
         * @method getRing
         * @return {Array} геодезические координаты точек окружности по
         * координатам центра и значению радиуса
        */
        // ===============================================================
        getRing: function () {
            if (!this.map) return null;

            var angle = 0,
            coord = [],
            center_meter = this.map.tiles.getLayersPointProjected(this.point1);
            var geo = GWTK.projection.xy2geo(this.map.options.crs, center_meter.y, center_meter.x);
            for (angle = 0; angle < 370; angle++)
            {
                var result = this.mapculc.mapDirectPositionComputation(parseFloat(geo[0]), parseFloat(geo[1]), angle, this.distance);
                coord.push(result.b);
                coord.push(result.l);
                angle += 19;
            }
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

            return;
        },

        /**
         * Очистить компонент (удалить изображение, отключить события)
         * @method clear
         */
        // ===============================================================
        clear: function () {

            //this.clearCircle();

            this.$canvas.find('.selectcircle-center').remove();
            this.$canvas.remove();

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
        }

     };

    GWTK.Util.inherits(GWTK.SelectAreaRadiusAction, GWTK.MapAction);
}