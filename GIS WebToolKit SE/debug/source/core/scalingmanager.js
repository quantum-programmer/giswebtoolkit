/*******************************************************************
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2023              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*               Управление масштабированием карты                  *
*                                                                  *
*******************************************************************/
if (window.GWTK) {
    // Трансформация
    GWTK.Transformations = function (translateX, translateY, scale) {
        this.scale = scale;
        this.translateX = translateX;
        this.translateY = translateY;
        this.timeFunction = 'linear';
    }

    GWTK.Transformations.prototype.getScale = function () { return this.scale; }
    GWTK.Transformations.prototype.getTranslateX = function () { return this.translateX; }
    GWTK.Transformations.prototype.getTranslateY = function () { return this.translateY; }
    GWTK.Transformations.prototype.getTimingFunction = function () { return this.timeFunction; }

    /**
     * Класс Менеджер масштабирования карты
     * Управление масштабированием карты
     * @class GWTK.ScalingManager
     * @constructor GWTK.ScalingManager
     * @param map {GWTK.Map} ссылка на карту
    */
    GWTK.ScalingManager = function (map) {

        if (map == undefined || map == null) {
            console.log("GWTK.ScalingManager error. " + w2ui.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.map = map;

        this.$target = $(this.map.tilePane);                               // целевая панель

        this.$div_clone = GWTK.Util.cloneMap(this.map);                    // клон целевой панели

        this.map.mapClone.hide();

        this.$picture = $(this.$div_clone[0]);                             // объект клона

        this.current = new GWTK.Transformations(0, 0, 1);                  // текущая трансформация

        this.zooming = undefined;                                          // выполняемая трансформация

        this.$wmsTarget = undefined;
        if (this.map.tiles.wmsManager) {
            this.$wmsTarget = $(this.map.tiles.wmsManager.parent);
        }

        this.clear();
    };

    GWTK.ScalingManager.prototype =
    {
        /**
         * Очистить  
         * @method clear
        */
        // ===============================================================
        clear: function () {
 
            this.current = new GWTK.Transformations(0, 0, 1);
            this.$picture.css({ 'transform': 'translate3d(0px 0px 0px) scale(1)', 'transition-duration': '0s' });
        },

        /**
         * Установить текущую трансформацию 
         * @method setCurrentTransformations
        */
        // ===============================================================
        setCurrentTransformations : function(t){ this.current = t; },

        /**
          * Установить выполняемую трансформацию 
          * @method setZooming
         */
        // ===============================================================
        setZooming: function (zooming) { this.zooming = zooming; },

        /**
         * Запросить текущую трансформацию 
         * @method getCurrentTransformations
        */
        // ===============================================================
        getCurrentTransformations: function () { return this.current; },

        /**
         * Запросить выполняемую трансформацию 
         * @method getZooming
        */
        // ===============================================================
        getZooming: function () { return this.zooming; },

        /**
          * Запросить параметры css трансформации 
          * @method getTransform3d
         */
        // ===============================================================
        getTransform3d : function(t){
            
            return 'translate3d(' + t.getTranslateX() + 'px, ' + t.getTranslateY() + 'px, 0px) scale(' + t.getScale().toFixed(3) + ')';
        },

        /**
         * Признак активности (выполнения) масштабирования 
         * @method isActive
         * @return {Boolean} `true/false`, true - выполнение
        */
        // ===============================================================
        isActive: function () {
            return (this.$picture[0].style.display == "block");
        },

        /**
          * Установить изображение клона
          * @method setCloneImage
         */
        // ===============================================================
        setCloneImage: function () {
            var $elem = this.$picture;

            $elem.find('.clone-svg').remove();

            // копируем рисунки в клон
            var c = this.$picture.find(".temp_canvas"),     // временное изображение масштабирования
                ctx = c[0].getContext("2d"),
                mapcanvas = this.map._getCanvas();
            
            ctx.clearRect(0, 0, c[0].width, c[0].height);

            ctx.drawImage(mapcanvas, 0, 0);

            mapcanvas.style.display = 'none';

            // установить положение клона
            $elem[0].style.cssText = "display:block;";
            $elem[0].style.left = '0px';
            $elem[0].style.top = '0px';
            // клонировать svg
            this.zoom_SvgCloning(this.map);
        },

        /**
          * Получить параметры css трансформации
          * @method getTranslate
          * @param scale {Float} коэффициент масштабирования рисунка
          * @param point {GWTK.Point} координаты точки масштабирования в окне карты (pixel)
          * @return {Object} GWTK.Transformations, параметры css трансформации
         */
        // ===============================================================
        getTranslate: function (scale, point) {

            var wsize = this.map.getWindowSize(),
                x, y, x0, y0,
                center = point,
                point0 = point;

            if (!point) {
                center = {};
                center.x = parseInt(wsize[0]) * 0.5;
                center.y = parseInt(wsize[1]) * 0.5;
                point = point0 = center;
            }
            else {
                center.x = parseInt(point.x);
                center.y = parseInt(point.y);
            }

            x0 = parseFloat(this.$picture[0].style.left);
            y0 = parseFloat(this.$picture[0].style.top);

            x = (center.x - x0) * (1 - scale);
            y = (center.y - y0) * (1 - scale);

            var transform = new GWTK.Transformations(x, y, scale);

            if (point0) {
                if (scale < 1) {
                    transform.timeFunction = 'ease-out';
                }
                else {
                    transform.timeFunction = 'ease-in';
                }
            }

            transform.point = point;

            return transform;
        },

        /**
          * Масштабировать
          * method zoom
          * @param scale {Float} коэффициент масштабирования рисунка
          * @param point {GWTK.Point} координаты точки масштабирования в окне карты (pixel)
          * @return {Object} GWTK.Transformations, параметры css трансформации
         */
        // ===============================================================
        zoom: function (scale, point) {

            var prev_scale = this.getCurrentTransformations().getScale();

            var scale = scale * prev_scale;
            if (scale < 0.031) {
                scale = 0.03125 / 2;
            }

            return this.getTranslate(scale, point);
        },

        /**
         * Анимировать масштабирование
         * method zoomAnimate
         * @param ratio {Float} коэффициент масштабирования рисунка
         * @param point {GWTK.Point} координаты точки масштабирования в окне карты (pixel)
         * @param duration {int} - скорост анимации
         */
        // ===============================================================
        zoomAnimate: function (ratio, point, duration) {
            if(duration === undefined){
                duration = 250;
            }
            if (!this.$div_clone || typeof ratio == 'undefined') {
                return false;
            }

            if (this.getZooming() != undefined) {
                return;
            }

            var $elem = this.$picture,
                scale = ratio;
            
            if (!this.isActive()) {
                this.setCloneImage();
                this.$picture.fadeIn(5);
            }

            if (this.$wmsTarget && this.$wmsTarget.is(':visible')) {
                this.$wmsTarget.fadeOut(300);
            }

            if (!this.getCurrentTransformations()) {
                this.current = new GWTK.Transformations(0, 0, 1);
            }

            this.setZooming(this.getCurrentTransformations());

            var newTransformation = this.zoom(scale, point);

            this.$target.fadeOut(100);

            this.applyZooming(newTransformation, duration);

            this.setCurrentTransformations(newTransformation);

            this.setZooming(undefined);

        },

       /**
         * Применить трансформацию
         * @method applyZooming
         * @param t {Object} GWTK.Transformations, параметры css трансформации 
         */
        // ===============================================================
        applyZooming: function (t, duration) {

            if (typeof t === "undefined") {
                return;
            }

            this.$picture.css({ 'transform': this.getTransform3d(t), 'transition-duration': duration + 'ms', 'transition-timing-function': t.getTimingFunction() });
        },

        /**
          * Обновить карту
          * @method refreshMap
          * @param t {Object} GWTK.Transformations, параметры css трансформации 
          */
        // ===============================================================
        refreshMap: function () {

            this.map.setCursor('progress');
            
            this.setZooming(new GWTK.Transformations(0, 0, 1));

            if (this.$picture[0].style.display !== 'block') {
               this.$picture.show(5);
            }

            var t = this.getCurrentTransformations(), delta = 0;

            if (t.scale < 1) {
                var num = 1 / t.scale;
                delta = parseInt(-(Math.sqrt(num) + 0.5));
            }
            else {
                delta = parseInt((Math.sqrt(t.scale) + 0.5));
            }

            var evtype = 'refreshmap.scaling';                            
            if (this.map.tiles.getTileLayersVisible().length == 0) {             // нет видимых тайлов
                evtype = 'wmsloaded.scaling';                                    // обработать событие загрузки wms
            }
            if (this.map.tiles.getVisibleLayers().length == 0) {                 // нет видимых слоев
                evtype = '';
            }
            
            this.map.zooming(delta, t.point);                                    // масштабируем карту
                                              // нет видимых слоев, завершаем режим принудительно
            setTimeout(GWTK.bind(this._onRefreshMap,this), 200);
        },

        /**
         * Обработать обновление карты
         * @method _onRefreshMap
         */
        // ===============================================================
        _onRefreshMap: function (event) {
            var render = this;
            if (this.map._wmsEnabled()){
                this.map.tiles.wmsManager.clearState();
            }
            this.$target.show(5);
            this.map.tiles.setLayersOpacity();
            this.map.tiles.drawMapImage(true, false, true);
            this.map._getCanvas().style.display = '';
            this.zoomAnimateEnd();
            this.$picture.fadeOut(400, function () { render.setZooming(undefined); render.clear(); return; });
         },

         /**
          * Завершить выполнение масштабирования
          * @method zoomAnimationEnd
          */
        // ===============================================================
        zoomAnimateEnd: function () {
            if (!this.map) {
                return;
            }
 
            this.map.setCursor('default');

            var $svg = $(this.map.container).find('.svgdrawing-panel svg:not(marker svg)');
            if ($svg.length > 0) { $svg.fadeIn(400); }

            // Синхронизировать видимость локальных слоев
            // иначе при их перерисовке они всегда видимые
            for (var i = 0; i < this.map.layers.length; i++) {
                if (this.map.layers[i] instanceof GWTK.graphicLayer)
                    if (!this.map.layers[i].visible)
                        this.map.layers[i].hide();
            }
        },

        /**
         * Подготовка масштабирования svg и кластеризатора
         * method zoom_SvgCloning
         * @param map {Object} карта GWTK.Map
        */
        // ===============================================================
        zoom_SvgCloning: function (map) {
            if (!map) {
                return;
            }
            var map = map,
                $div_clone = map.mapClone;
            //Kozhanov + 07.12.2015
            //текущий индекс слоя
            var layerZIndex = 800;
            //Kozhanov 
            if (map.animatedLayers.length > 0) {
                for (var i = 0; i < map.animatedLayers.length; i++) {
                    if (!map.animatedLayers[i].clone) {
                        map.animatedLayers[i].clone = $(map.animatedLayers[i].layer).clone(false);
                        map.animatedLayers[i].clone.id = map.animatedLayers[i].layer.id + "_temp";
                    }
                    else {
                        $(map.animatedLayers[i].clone).html($(map.animatedLayers[i].layer).html());
                    }
                    $div_clone.append(map.animatedLayers[i].clone[0]);

                    $(map.animatedLayers[i].clone).css({
                        "position": "absolute",
                        "top": -parseFloat($div_clone[0].style.top) + 1 + "px",
                        "left": -parseFloat($div_clone[0].style.left) + 1 + "px",
                        "z-index": layerZIndex++
                    });

                }
            }

            //Тазин Виктор - создание клонов SVG
            var svg = $(map.container).find('.svgdrawing-panel svg:not(marker svg)');
            if (svg.length > 0) {

                var svgs = $(map.container).find('svg:not(".clone-svg, .topology-svg, .info-svg"):not(marker svg)');
                for (i = 0; i < svgs.length; i++) {
                    var svgClone = svgs.clone(false);
                    if (svgClone[i]) {
                        svgClone[i].id = svgClone[i].id + "_temp";
                        svgClone[i].setAttribute("class", "clone-svg");
                        $(svgClone).css({
                            "position": "absolute",
                            "top": -parseFloat($div_clone[0].style.top) + "px",
                            "left": -parseFloat($div_clone[0].style.left) + "px",
                            "z-index": 800
                        });
                        // Клонирование маркеров (маркеры изменяются в процессе масштабирования,
                        // поэтому создаем неизменемые клоны)
                        var markers = $(svgClone).find("marker");
                        for (var j = 0; j < markers.length; j++) {
                            var marker = markers[j];
                            var id = marker.getAttribute("id");
                            marker.setAttributeNS("", 'id', id + "_temp");
                            marker.setAttribute("class", "clone-svg");
                        }
                        // Замена ссылок с оригинальных на маркеры-клоны для элементов слоя clone-svg
                        var paths = $(svgClone).find("[marker-start],[marker-mid],[marker-end]");
                        var regex = /url\(#marker_(.+)\)/;
                        var regexAlt = /url\(\"#marker_(.+)\"\)/;
                        var mList = ["marker-start", "marker-mid", "marker-end"];
                        for (j = 0; j < paths.length; j++) {
                            var path = paths[j];
                            for (var k = 0; k < mList.length; k++) {
                                var markerType = mList[k];
                                id = path.getAttribute(markerType);
                                if (id) {
                                    var m, mid;
                                    if ((m = regex.exec(id)) !== null) {
                                        mid = m[1] + "_temp";
                                    } else if ((m = regexAlt.exec(id)) !== null) {
                                        mid = m[1] + "_temp";
                                    }
                                    if (mid)
                                        path.setAttributeNS("", markerType, "url(#marker_" + mid + ")");
                                }
                            }
                        }

                        // Клонирование паттернов (иначе в яндекс браузере не перерисовывается при масштбировании)
                        var patterns = $(svgClone).find("pattern");
                        for (var j = 0; j < patterns.length; j++) {
                            var pattern = patterns[j];
                            var id = pattern.getAttribute("id");
                            pattern.setAttributeNS("", 'id', id + "_temp");
                            pattern.setAttribute("class", "clone-svg");
                        }

                        // Клонирование textPath (пути подписей изменяются в процессе масштабирования,
                        // поэтому создаем неизменемые клоны)
                        var textPaths = $(svgClone).find("textPath");
                        for (var j = 0; j < textPaths.length; j++) {
                            var textPath = textPaths[j];
                            var id = textPath.getAttribute("href");
                            textPath.setAttributeNS("", 'id', id + "_temp");
                            textPath.setAttribute("class", "clone-svg");
                            var path = $($(svgClone).find("defs")).find("path" + id);
                            if (path.length > 0) {
                                path[0].setAttributeNS("", 'id', id + "_temp");
                            }
                        }

                        $($div_clone).append(svgClone[i]);
                    }
                }
                svg.hide();   
            }
        }

    }
}