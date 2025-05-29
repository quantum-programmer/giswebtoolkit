/************************************* Соколова Т.О.  02/08/18 *****
************************************** Нефедьева О.А. 23/10/17 *****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2017              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*        Тестовый Класс для старта данных компонента БПЛА          *
*                                                                  *
*******************************************************************/

var timerRouteId = 0;

if (window.GWTK) {

    GWTK.maproutes = function (map, param) {
        // Переменные класса
        this.map;
        this.panel;

        if (map == null) return;
        this.map = map;

        this.initRes("RU");

        var j, len = this.map.options.controls.length;
        for (j = 0; j < len; j++) {
            if (this.map.options.controls[j] != "routebpla") continue;
            this.map.mapRoutes = this;
        }

        if (param != null) {
            this.param = param;
            this.routes = this.param.routes;
            for(var i = 0; i<this.routes.length; i++) {
                this.routes[i].fileshort = GWTK.routeUtil.shortfilename(this.routes[i].file);
                if (this.routes[i].movies == null || this.routes[i].movies == undefined)
                    continue;
                var count = this.routes[i].movies.length;
                for(var j = 0; j < count; j++) {
                    this.routes[i].movies[j].fileshort = GWTK.routeUtil.shortfilename(this.routes[i].movies[j].file);
                }
           }
        }

        this.maproute = null;

        this.initialize();
    }

    GWTK.maproutes.prototype = {
        initialize: function () {
            if (this.map instanceof GWTK.Map == false) return this;

            this.initRoutes();
            this.initEvents();
            $(document).ready(function () {
                GWTK.maproutes.prototype._readCookie();
            });
            


            return this;
        },

        initRes: function (res) {
            switch (res) {
                case "RU":
                    // Название кнопки режима
                    this.res_mapRoutes_button = w2utils.lang('A retrospective analysis of data from a UAV');//Ретроспективный анализ данных с БПЛА';   
                    break;
            }
        },


        // Иницализация кнопки
        initRoutes: function () {
            if (this.map == null || this.map.panes == null || this.map.panes.toolbarPane == null)
                return;
            var bt = GWTK.DomUtil.create('div', 'control-button control-button-maproutes clickable', this.map.panes.toolbarPane);
            bt.id = 'panel_button-mapRoute';
            bt.disabled = false;
            bt.title =  this.res_mapRoutes_button;
            bt._pane = 'routesPane';
            if ($.isFunction(this.map.is3dActive) && this.map.is3dActive()) {
                console.log(this.map.is3dActive());
                $(bt).addClass("control-button-non-active");
            }
        },

        // Инициализация событий
        initEvents: function () {
            var _mapRoutes = this;

            $('#panel_button-mapRoute').click(function (event) {
                if (_mapRoutes.param == null || _mapRoutes.param == undefined) {
                    alert("Данные для отображения отсутствуют.")
                    return;
                }
                if ($(event.currentTarget).hasClass('control-button-active')) {
                    $(event.currentTarget).removeClass('control-button-active');
                    _mapRoutes.destroy();
                }
                else {
                    $(event.currentTarget).addClass('control-button-active');
                    _mapRoutes.init(_mapRoutes.param);
                }
                GWTK.maphandlers.map._writeCookiePanels();
            });

        },

        destroy: function () {

            // удалить панели маршрута
            if (this.maproute != null && this.maproute != undefined) {
                this.maproute.destroy();
                this.maproute = null;
            }

            // Удалить созданные панели
            if (this.map == null || this.map.mapPane == null)
                return;
            if (this.panel != null){
                GWTK.routeUtil.removeAllChild(this.panel);
                this.map.mapPane.removeChild(this.panel);
                }
            this.panel = null;
           
        },

        // инициироваь данные 
        init: function (param) {

            //if (GWTK._mapRoutes.routes == null || GWTK._mapRoutes.routes == undefined || GWTK._mapRoutes.routes.length == 0) 
            //    return;

            this.panel = this.map.createPane('mapRoutes-panel map-panel-def', this.map.mapPane);
            this.panel.id = 'routesPane';
            $(this.panel).draggable({ containment: "parent", distance: 2 });

            var $routesPane = $('#routesPane');
            $routesPane.append(
            '<div class="routesContainer">' +
            '<div align="left"  class="routeFilesName">' + this.res_mapRoutes_button +
            '</div>' +
                   '<table width="100%" > ' +
                     '<tr> ' +
                     '<td> ' +
                            '<div id="routesList" align="left"></div> ' +
                     '</td> ' +
                     '</tr> ' +
                     '</table>' +
            '</div> ');


            var $bt = $routesPane.find(".routeFilesName");
            if ($bt.length > 0) {
                $bt[0].appendChild(GWTK.Util.createHeaderForComponent({
                    map: this.map,
                    name: this.res_mapRoutes_button,
                    callback: GWTK.Util.bind(function () {
                        $('#panel_button-mapRoute').click();
                    }, this)
                }));
            }

            var count = this.routes.length;
            for (var i = 0; i < count; i++) {
                $('#routesList').append(
                '<div  align="left" class="clickable" id= "route_' + i + '" Title="' + w2utils.lang("Execute") + '" >' + this.routes[i].alias + ' (' + this.routes[i].fileshort + ') </div>'
                );
            }

            var _routes = this;
            $(document).ready(function () {
                 
               //$('#routesHeaderList').click(function (event) {
               //    $('#panel_button-mapRoute').click();

               //   //  _routes.destroy(); return false; 
               //  });

               $('#routesList').children('.clickable').click(function (event) {
                    _routes.createroute(this.id);
                 });
            });

        },

        // создать маршрут
        createroute: function (id) {

            if (timerRouteId != 0)
                return;

            if (id == null || id == undefined)
                return;
            var mass = id.split("_");
            if (mass == null || mass.length == 0)
                return;
            id = mass[mass.length - 1];

            if (this.maproute != null && this.maproute != undefined)
                this.maproute.destroy();

            //var mappane = document.getElementById('mapPane');
 
            this.maproute = new GWTK.routeBPLA(id, this.routes[id], this.map.mapPane, null, null);
            $(this.map.mapPane).on('filecompleteBPLA', function (ui) {
                // Удалить таймер
                if (timerRouteId != 0) {
                    clearTimeout(timerRouteId);
                    timerRouteId = 0;
                }
            });

            // Событие на перерисовку
            var _maproute = this;
            $(this.map.mapPane).on('overlayRefresh', function (ui) {
                _maproute.refresh();
                return false;
            });


            // Считаем файл, точки объекта (структурированный массив time,B,L,H,... и далее из csv)
            // откроем диалог и нарисуем объект
            var file1 = this.maproute.file;
            var maproute1 = this.maproute;
            timerRouteId = setTimeout(function () {
                maproute1.initdataFromfile();
            }, 1000);

        },

        // Обновить координаты точек
        refresh: function () {
            if (this.maproute != null && this.maproute != undefined)
                this.maproute.refresh();
        },

        // функция пересчета координат
        geo2pixelOffset: function (coord) {
            var geo = GWTK.toLatLng(coord);
            return GWTK.tileView.geo2pixelOffset(GWTK.maphandlers.map, geo);
        },

        // Спозиционироваь карту в центре объекта
        showCenter: function (centerObj)
        {
            var layer = 0;
            if (centerObj == null || centerObj.length == 0) return;
            var tilematrix = null;
            if (GWTK.maphandlers.map.layers[layer].options.tilematrix != null)
                tilematrix = GWTK.maphandlers.map.layers[layer].options.tilematrix;
            GWTK.maphandlers.map.setView(null, centerObj, tilematrix);
        },

        initpointscsv: function(arrData) {
            // Разбор данных в структуру points.
            // 0: "latitude" - B
            // 1: "longitude" - L
            // 2: "altitude(feet)" - H
            // 3: "ascent(feet)" - ascent_feet
            // 4: "speed(mph)" - speed_mph
            // 5: "distance(feet)" - distance_feet
            // 6: "max_altitude(feet)" - max_altitude_feet
            // 7: "max_ascent(feet)" - max_ascent_feet
            // 8: "max_speed(mph)" - max_speed_mph
            // 9: "max_distance(feet)" - max_distance_feet
            // 10: "time(millisecond)" - time_millisecond
            // 11: "datetime(utc)" - datetime_utc
            // 12: "datetime(local)" - datetime_local
            // 13: "satellites" - satellites
            // 14: "pressure(Pa)" - pressure_Pa
            // 15: "temperature(F)" - temperature_F
            if (arrData == null || arrData == undefined)
                return;
            var count = arrData.length;
            if (count <= 1) return;

            var points = [], k = 0;
            // начнем с 1, т.к. в первой строке идут названия
            for(var i = 1; i < count;  i++) {
                //if (arrData[i].length < 16) // не все параметры
                //    continue;
                if (arrData[i][0] == null || arrData[i][1] == null ||
                    arrData[i][11] == null) continue;
                points[k] = new Array();
                points[k].B = arrData[i][0];
                points[k].L = arrData[i][1];
                points[k].H = arrData[i][2];
                points[k].ascent_feet = arrData[i][3];
                points[k].speed_mph = arrData[i][4];
                points[k].distance_feet = arrData[i][5];
                points[k].max_altitude_feet = arrData[i][6];
                points[k].max_ascent_feet = arrData[i][7];
                points[k].max_speed_mph = arrData[i][8];
                points[k].max_distance_feet = arrData[i][9];
                points[k].time_millisecond = arrData[i][10];
                points[k].datetime_utc = arrData[i][11];
                points[k].datetime_local = arrData[i][12];
                points[k].satellites = arrData[i][13];
                points[k].pressure_Pa = arrData[i][14];
                points[k].temperature_F = arrData[i][15];
                k++;
            }
        
            return points;
        },

        // подпись к точке
        pointTooltip: function (number, point) {
            return "N=" + number + ", " + point.datetime_utc + ",\n\rB=" + point.B + ", L=" + point.L + ", высота(м)=" + point.H +
            ",\n\rдавление(Pa)=" + point.pressure_Pa + ", температура(F)=" + point.temperature_F;
        },

        _readCookie: function () {
            var param = GWTK.cookie("VisiblePanels", GWTK.cookies.converter);
            if (param === undefined) return;

            $.each(param, function (index, value) {
                var key = value.shift();
                var key_value = value.length > 0 ? value.shift() : '';
                key_value = key_value.split(',');
                if (key == 'panel_button-mapRoute') {
                    button = $('#' + key);
                    panel = button[0]._pane;
                    if (key_value[0] == 'show') {
                        $('#panel_button-mapRoute').click();
                    }
                }
            });
            return;
        }
    }
}




