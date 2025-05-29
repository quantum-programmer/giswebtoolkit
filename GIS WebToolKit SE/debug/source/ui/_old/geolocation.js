/*************************************** Гиман Н.Л.    02/11/17 ****
/*************************************** Тазин В.О.    17/05/17 ****
/*************************************** Соколова Т.О. 16/10/19 ****
/*************************************** Нефедьева О.  30/11/17 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2019              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*       Геолокация. Определение собственного местоположения        *                                          
*                                                                  *
*******************************************************************/
if (window.GWTK) {
   
    GWTK.geolocation = function (map) {
        // Переменные класса
        if (map == null) return;
        this.map = map;
        this.toolname = "geolocation";
        this.initialize();
    }

    GWTK.geolocation.prototype = {
        initialize: function () {
            if (this.map instanceof GWTK.Map == false) return this;

            // Проверка геолокации
            if (!navigator.geolocation) {
                console.log("Message: Geolocation API не поддерживается в вашем браузере.");
                return this;
            } 

            if (this.map.panes != null && this.map.panes.toolbarPane != null) {
                var bt = GWTK.DomUtil.create('div', 'control-button control-button-geolocation clickable', this.map.panes.toolbarPane);
                bt.id = 'panel_button-geolocation';
                bt.disabled = false;
                bt.title = w2utils.lang("My location");
                bt._pane = 'geolocation1';

                this.map.maptools.push(this);
                
                _geolocation = this;
                $('#panel_button-geolocation').click(function (event) {
                    if ($(event.currentTarget).hasClass('control-button-active')) {
                        $(event.currentTarget).removeClass('control-button-active');
                        if (_geolocation.process) {
                          //  _geolocation.process.stop();
                            _geolocation.process.destroy();
                            _geolocation.process = null;
                            $(_geolocation.map.eventPane).trigger({ type: 'controlbuttonclick', target: event.currentTarget });
                        }
                    }
                    else {
                        $(event.currentTarget).addClass('control-button-active');
                        _geolocation.process = new GWTK.geolocationProcess(_geolocation.map);
                        $(_geolocation.map.eventPane).trigger({ type: 'controlbuttonclick', target: event.currentTarget });
                        _geolocation.process.start();
                    }

                    _geolocation.map._writeCookiePanels();
                    
                });

                //$(document).ready(function () {
                //    GWTK.geolocation.prototype._readCookie();
                //});
 

            }
            return this;
        },

        // Деструктор
        destroy: function () {
            $('#panel_button-geolocation').off().remove();
            if (_geolocation.process) _geolocation.process.destroy();
        }

        // _readCookie: function () {
        //    var param = GWTK.cookie("VisiblePanels", GWTK.cookies.converter);
        //    if (param === undefined) return;

        //    $.each(param, function (index, value) {
        //        var key = value.shift();
        //        var key_value = value.length > 0 ? value.shift() : '';
        //        key_value = key_value.split(',');
        //        if (key == 'panel_button-geolocation') {
        //            button = $('#' + key);
        //            panel = button[0]._pane;
        //            if (key_value[0] == 'show') {
        //                $('#panel_button-geolocation').click();
        //            }
        //        }
        //    });
        //    return;
        //}

    }

    // Процесс отслеживания
    GWTK.geolocationProcess = function (map, parentstr, drawobjects) {

        this.map = map;

        this.objectDraw = {   // Объект для отображения
            points: []
            , scr_marker: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAzCAYAAACAArhKAAAFWElEQVR42u2YXUybVRjHn7d920ILbfkodmUbQ4ZhTD4uZjaU7YKNpNGAeiEqcRduFwqGGJZ4Y+LN7h0xi2iijkSJSuZH4hxEM+dE1Gk2BWUZny5sAQusQIvlq29b/8/7AQ3K+qHJvOhJ/nmat+c8v/M85zmnfY9Ad6kJ/3uwt6nJeb23t9rn8VQLglCNRy4obM7Kmg0Fg1fSbbazDw4MfPmfgs/n5FQYjMa3rQ7HvoysLBJNJopEIhRaW6M/5+bINzND4XCY1S2FQk2PLizc/Nfg7tzcJyw2W2deYaHRkJ5OgihSZHVVGazTyXZteZk8Y2O0Cgu4F/D6+vn575MGA3rEbLX2OIuKxLSCAjLm5WGEQBFEt3bjBoUXF9f7Soh+aniY1jCpUCjkC0pSFSK/njAY6bWKev2wq6TEaXa5yJifT4JeTzpErLXVwUGKSBJF8JlTv+Tz0TQmBDDrKuD7H/P5QgmBexyOVzLs9pOOnTspbdcu0mdmkg5gTjVPgFtwYoKk+Xk5AwzndZ4eHaVlpJzhAD+NlH8YN3ihpeWey11dP+a4XAWZ2dlkAly0WhVwlILj4yT5/XK0cnHB+j0e8nm9DGX4hUe83tq4wVjb3aIojuYgvWZEagDUtGMH6QwGLLEgT4DgeHVkRIFqYGjx9m3yzc4SCgxdpNVyt7t4e2fnrXjBboB7sp1OMnOkqF6jzUYGh0PZSlxA2ELy+gIWUqMNA+YHeBFbjCMGmO1uFNl4vODHAf4k024na26uDNZzYbFVI9ZxdUMM08C8rgtTU7S8tBQNLgN4MF7wIYC/MRmNlI10M3QdDLHllJNaUCE11UFkYm5yUk6zBnaVllZU9vb+Ghd4yO0uudnffw3bSWdBqi04rTSgLBXKB0j0+vqR/hVEK6+vssYzBxoajmS3t/+WSFWfNYjiQUhe57SMDDlqubhUMGaxXtFL2FbLgYASuZJiTv2ZhxobX7afPj0dF5hb3549x+DsHQZztCYclyaLhXBmr6eZI5aQ3mVsqWAwqBwcKhifw/l79z5ZfunSR3FvJ244ubBV9V9AtSKvsZpmtno+r9EnApC2f8NqdUvKqcV6A3u4eSv/sc7qPID7ACzW4PIgYWMYp5qbBpUnEAr1IepaVPNKUmAVvg3gj6EqvVrNm8HyT6RaYNCnmMBRHJWBO/mN9/dYBLgZwJdgt2/+noGAD8GeRHo/iMdnQn99MAGcH0LVlNncMGmxtHCS8wOBV12BwPsA/pyIr6T/cx2uqZEX96uLF5PykQKnwClwCpwCp8ApcAocu3127hz3zVFFr7W1DbF9sbW1RO3iZdXX1UWSBp840WqHqYH2Q/dD7DwfMvH3AbwxjI2OyX2Li4vJbDFrQ/nv7BTEk+L3pcvQ16dOtfm3BANmgHkKOgbxdZJ25zAB9UL8xvc75OCHA/0D7WwrKiuaVcg26F6oDDoE7VTHS+r4DqgLkwiugwE9APMuBxDV+Qz0Ojr+7U2PW6w1hs9KmBegZyG9+ngEOgqfPwnoUKjOOEP9ku+SDuPL7+60RvEWF/wfhLkAGdVHfFVUxuBn8OG9qL5XAd1HMVoiVQ3GLzCVUY8aGZyLD/yF9obADo8D3hEDfB4mDHBdDOhxmLdoo574PqRSW+MCmDchd9SYb9Vn3ZjEQqyoNsGyYB6GnielULXWAz0Hf7eETQMeIKWqeZBWlXxBxjUwAPElyh+Qj5Stwy0NspFS1UVQBVROGwXF95qfQx0AXtFYW64PJnEfDFc7b49SUm5rnaQcIIZN3XmL8AHigSaha6p+AGz0n/wnddxhUqIaKbcVOJcS9XHXLsr/Am1s7NvjPxINAAAAAElFTkSuQmCC'
        };

        // Контекстный вызов функций
        this.overlayPaneEvent = GWTK.Util.bind(this.overlayPaneEvent, this);
        this.goPosition = GWTK.Util.bind(this.goPosition, this);
        this.timertick = GWTK.Util.bind(this.timertick, this);

        // Добавляем обработчики событий сторонних панелей
        $(this.map.eventPane).on('overlayRefresh', this.overlayPaneEvent);

        this.position = null;

        this.map.on({type: 'showMark', target: 'geolocation'}, this.handlerShowMark);
        this.map.on({type: 'clearMark', target: 'geolocation'}, this.clearmark);
    }

    GWTK.geolocationProcess.prototype = {

        destroy: function () {
            this.clear();

            // Удаляем обработчики событий сторонних панелей
            this.map.off({ type: 'showMark', target: 'geolocation' }, this.handlerShowMark);
            this.map.off({ type: 'clearMark', target: 'geolocation' }, this.clearmark);
            $(this.map.eventPane).off('overlayRefresh', this.overlayPaneEvent);

            // Остановить таймер
            clearInterval(this.timerId);
        },

         // Запустить процесс
        start: function () {
            this.clear();
            var interval =  10000; //1000;
            this.timertick();
            this.timerId = setInterval(this.timertick, interval);
        },

        /*    // Остановить процесс
        stop: function () {
            this.clear();
            clearInterval(this.timerId);
        },*/

        // тиканье таймера
        timertick: function () {

            var tool = this.map.mapTool("geolocation");                              // 02/12/16
            if (!tool || !(tool instanceof GWTK.geolocation)) return;
            
            // Запросить координату 
            var _that = this;
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    _that.goPosition(position.coords);
                },
                function(failure) { // При ошибке определим по ip
                    $.getJSON('https://ipinfo.io/geo', function(response) {
                        var loc = response.loc.split(',');
                        var coords = {
                            latitude: loc[0],
                            longitude: loc[1]
                        };
                        _that.goPosition(coords);
                    });
                });
        },

        goPosition: function(coords){
            if (!coords) return;
            var tool = this.map.mapTool("geolocation");                              // 02/12/16
            if (!tool || !(tool instanceof GWTK.geolocation)) return;

            var point = {};
            point.POINT_X = coords.latitude;  // B
            point.POINT_Y = coords.longitude;  // L
            var obj = tool.process.objectDraw;
            obj.points.push(point);
            var count = obj.points.length;
            if (count > 1) {
                var d = tool.process.distance(obj.points[count - 2], obj.points[count - 1]);
                if (d && d > 0) {
                    obj.distance += d;
                    obj.points[count - 1].distance = obj.distance;
                    obj.degree = tool.process.degree(obj.points[count - 2], obj.points[count - 1]);
                }
                else
                    obj.points.splice(count - 1, 1);
            }
            this.trigger();

            // Спозиционировать карту
            if (!tool.process.position) {
                tool.process.position = GWTK.toLatLng(obj.points[0].POINT_X, obj.points[0].POINT_Y);
                tool.map.setViewport(tool.process.position);
                tool.map.overlayRefresh();
            }

            // Найдем марку и перерисуем или создадим новую стандартную марку
            tool.process.showmark();

        },

        trigger: function (type) {
            if (this.map.eventPane)
                $(this.map.eventPane).trigger({
                    type: 'geolocationtick'

                });
        },


        // Расстояние между точками
        distance: function (p1, p2) {
            var origin = GWTK.toLatLng([p1.POINT_X, p1.POINT_Y]);
            var d = origin.distanceTo([p2.POINT_X, p2.POINT_Y]);
            return d;
        },


        // Угол поворота
        degree: function (p1, p2) {
            var point1 = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng([p1.POINT_X, p1.POINT_Y]));
            var point2 = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng([p2.POINT_X, p2.POINT_Y]));
              
            var x1 = point1.x; var x2 = point2.x;
            var y1 = point1.y; var y2 = point2.y;
            var degree = 0;
            var tg = 0;
            if (x2 - x1 != 0) {
                if (y2 == y1) {
                    if (x2 > x1) degree = 0;
                    if (x2 < x1) degree = 180;
                }
                else {
                    tg = (y2 - y1) / (x2 - x1);
                    degree = (180.0 * Math.atan2(y2 - y1, x2 - x1)) / Math.PI;
                    if (degree < 0)
                        degree = 360.0 + degree;
                }
            }
            else {
                if (y2 >= y1) degree = 90;
                else degree = 270;
            }

            return degree;

        },

        // Отобразить марку местоположения
        showmark: function () {
            var count = this.objectDraw.points.length;
            if (count < 1) return;

            // Найдем марку и перерисуем или создадим новую стандартную марку
            var geo = GWTK.toLatLng([this.objectDraw.points[count - 1].POINT_X, this.objectDraw.points[count - 1].POINT_Y]);
            this.map.trigger({ type: 'showMark', target: 'geolocation', originalEvent: { geo: geo, process: this } });
        },

        handlerShowMark: function (e) {
            var geo = e.originalEvent.geo;
            var process = e.originalEvent.process;
            if (!process && !geo) return;

            //var overlaypoint = GWTK.tileView.geo2pixelOffset(GWTK.maphandlers.map, geo);
            var overlaypoint = GWTK.tileView.geo2pixelOffset(process.map, geo);
            if (!process.mark) {
                process.mark = new GWTK.placemark(geo, null, null, process.objectDraw.scr_marker,null, null, this);
                process.mark.id = process.mark.div.id = 'mark_geolocation';
                process.mark.geopoint().className = 'placemark mark_geolocation';
            }
            var div = process.mark.geopoint();

            var el = $('#mark_geolocation');
            el.attr("title", w2utils.lang("My location"));

            if (!el || el.length == 0) {
                process.map.overlayPane.appendChild(div);
            }
            else {
                el.show();
            }
            process.mark.position(overlaypoint);

        },

        // Обработчик для overlayPane
        overlayPaneEvent: function (event) {
            // Перерисуем или создадим новую стандартную марку
            var tool = this.map.mapTool("geolocation");
            if (!tool || !(tool instanceof GWTK.geolocation)) return;
            tool.process.showmark();
        },

        clear: function () {
            this.map.trigger({ type: 'clearMark', target: 'geolocation' });
            if (this.paper)
                this.paper.clear();

            this.objectDraw.points = [];
            this.objectDraw.distance = 0.;
            this.position = null;
            return;
        },

        clearmark: function () {
            $('#mark_geolocation').remove();
            this.mark = null;
        }
    }
}




