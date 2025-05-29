/************************************** Соколова Т.О. 02/08/18 *****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2016              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                          Компонент БПЛА                          *
*                                                                  *
*******************************************************************/
if (window.GWTK) {

    GWTK._routesBPLA = [];      // массив экземпляров компонента routeBPLA

    // Параметры создания класса
    // ----------------------------
    // id - идентификатор объекта
    //
    // param - параметры объекта в формате
    // {"alias": "test1_kml" - алиас объекта
    //  ,"file": "http://localhost/files/flytrex_multirotor_mission_20141202.kml" - ссылка на файл kml
    //  ,"shownamefile": null - отображение имени файла
    //  ,"imgpoint": null - изображение точки на карте
    //  ,"imgpointCurrent": null - изображение текущей точки на карте
    //  ,"imgpointSelect": null - изображение выделенной точки на карте
    //  ,"imgpointEmpty": null - пустое изображение точки
    //  ,"checkpoint" : null - флаг отображения всех точек объекта kml(0 или 1)
    //  ,"videovisible" : null - признак отображения видеоплеера (0 или 1)
    //  ,"videospeed" : null - скорость воспроизведения видео(0,1,2)
    //  ,"currmovi" : null - номер текущего набора movies, начиная с 1 
    //  ,"fn_pointTooltip": null - функция вывода подсказки для текущей точки
    //  ,"fn_geo2pixelOffset": null - функция для пересчета координат в координаты окна карты (параметр: массив координат BL[2] или XY[2], возвращает  GWTK.Point )
    //  ,"fn_initpointscsv": null - функция для заполнения структур points после загрузки csv файла
    // (параметры: - массив [[]] данных, полученных при загрузке csv файла, возвращает заполненный массив координат points) 
    //  обязательными полями элемента массива points являются:
    //      B  - широта
    //      L  - долгота
    //      time_millisecond  - смещение в миллисекундах относительно начала трека 
    //      datetime_utc - дата
    //  ,"fn_showCenter": null - функция перемещения в определенное положение на карте после загрузки данных
    //  , "movies": [     - массив видеофайлов
    //        { "file": null - видеофайл
    //         ,"timebegin": null - сдвиг относительно начала трека координат в миллисекундах
    //    ]
    //    }
    //
    // mapdiv - div родителя для размещения панелей объекта, это может быть панель карты
    // sliderdiv = null -  div для размещения слайдера
    // videodiv = null -  div для размещения видеоплаера

    // Функции инициализации данных
    // ----------------------------
    // инициализация данных из файла
    //    initdataFromfile: function (url, currentpoint, videoVisible, videoIsPlay)
    // инициализация данных из массива структур points
    //    initdataFromdata: function (points, currentpoint, videoVisible, videoIsPlay)
    //    обязательными полями элемента массива points являются:
    //      B  - широта
    //      L  - долгота
    //      time_millisecond  - смещение в миллисекундах относительно начала трека 
    //      datetime_utc - дата

    // События родительскому элементу mapdiv
    // -----------------------------------
    // filecompleteBPLA - загрузка файла даннах, содержащих временные метки  
    // updatedatarouteBPLA - обновление текущего значения 
    // updateparamBPLA - обновление параметров диалога слайдера
    // videovisibleBPLA - флаг видимости окна видеплеера
    // videoplayBPLA - флаг проигрывания видеоплаеера 
    // checkpointBPLA - изменение отображения точек объекта BPLA
    // videospeedBPLA - изменение скорости отображения видеофайла

    GWTK.routeBPLA = function (id, param, mapdiv, sliderdiv, videodiv) {

        // Переменные класса
        this.param = null;
        this.panel = null;
        this.panelVideo = null;
        this.overlayPane = null;
        this.geo2pixelOffset = null;

        this.id = id;
        this.parentstr = 'BPLAroute_' + id;
        if (mapdiv != null && mapdiv != undefined)
            this.mapdiv = mapdiv;
        if (sliderdiv != null && sliderdiv != undefined)
            this.sliderdiv = sliderdiv;
        if (videodiv != null && videodiv != undefined)
            this.videodiv = videodiv;

        // алиас 
        this.alias = null;
        // файл kml или csv
        this.file = null;
        this.fileshort = null;
        this.checkpoint = 0;
        this.videospeed = 0;

        // Точки объекта (структурированный массив realtime, datetime_utc,B,L,H,... и далее из csv)
        // структура points из файла csv (из kml только четыре параметра datetime_utc,B,L,H  )
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
        // 10: "time(millisecond)" - time_millisecond  - для данных из файла kml расчитывается автоматически (пропорционально) 
        // 11: "datetime(utc)" - datetime_utc
        // 12: "datetime(local)" - datetime_local
        // 13: "satellites" - satellites
        // 14: "pressure(Pa)" - pressure_Pa
        // 15: "temperature(F)" - temperature_F 
        // realtime - реальная дата и время в миллисекундах - вычисляется

        this.points = [];
        // Видеофайлы (структурированный массив file,timebegin)
        this.movies = [];

        // точки и контур объекта
        this.pointsObj = [];
        this.lineObj;
        this.centerObj = [];
        this.imgpoint = GWTK.imgPrick;
        this.imgpointEmpty = GWTK.imgPrickEmpty;
        this.imgpointCurrent = GWTK.imgPrickBig;
        this.imgpointSelect = GWTK.imgPrickBig_select;

        //  текущая точка
        this.currentpoint = 0;
        this.currentmark;

        //  выбранная точка
        this.selectpoint = -1;
        this.selecttmark;

        // текущие пограничные даты
        this.dateTimeBegin = null;
        this.dateTimeEnd = null;
        this.Step = 250;
        this.Interval = 250;   // оптимально для нормальной скорости плеера

        // Элемент видео плеера
        this.currentmovies = -1;
        this.videoVisible = false;
        this.videoIsPlay = false;

        this.videoTimebegin = 0;
        this.video = null;
        this.videocurrentTime = 0;
        this.videoDuration = 0;

        // Суммарное время
        //this.videocurrentTime_sum = null;

        // признак событий для видеоплеера, пришедших извне(от нас)
        this.videoEventOutside = false;

        // слайдер с кнопками управления
        this.sliderRoute = null;

        // css_msie, css
        this.cssLine_msie = "route-line-msie";
        this.cssLine = "route-line";

        this.initRes();

        if (param != null && param != undefined)
            this.param = param;

        if (param.fn_geo2pixelOffset != null && param.fn_geo2pixelOffset != undefined)
            this.geo2pixelOffset = param.fn_geo2pixelOffset;
        else
            this.geo2pixelOffset = function (coord) {
                var geo = GWTK.toLatLng(coord);
                return GWTK.tileView.geo2pixelOffset(GWTK.maphandlers.map, geo);
            }

        if (param.fn_pointTooltip != null && param.fn_pointTooltip != undefined)
            this.pointTooltip = param.fn_pointTooltip;

        if (param.fn_initpointscsv != null && param.fn_initpointscsv != undefined)
            this.initpointscsv = param.fn_initpointscsv;

        if (param.fn_showCenter != null && param.fn_showCenter != undefined)
            this.showCenter = param.fn_showCenter;
        
        this.initialize();


    };

    GWTK.routeBPLA.prototype = {

        initialize: function () {

            if (this.param == null || this.param == undefined ||
                this.param.file == null || this.param.file == undefined) {
                alert(this.routeBPLA_mess1);
                return;
            }

            if (this.geo2pixelOffset == null || this.geo2pixelOffset == undefined) {
                alert(this.routeBPLA_mess2);
                return;
            }

            this.clear();

            var param = this.param;
            // файл kml или csv
            if (param.alias != null)
                this.alias = param.alias;
            if (param.imgpoint != null)
                this.imgpoint = param.imgpoint;
            if (param.imgpointCurrent != null)
                this.imgpointCurrent = param.imgpointCurrent;
            if (param.imgpointSelect != null)
                this.imgpointSelect = param.imgpointSelect;
            if (param.imgpointEmpty != null)
                this.imgpointEmpty = param.imgpointEmpty;
            if (param.checkpoint != null)
                this.checkpoint = parseInt(param.checkpoint);
            if (param.videovisible != null)
                this.videoVisible = parseInt(param.videovisible);
            if (param.videospeed != null)
                this.videospeed = parseInt(param.videospeed);
            if (param.currmovi != null && param.currmovi > 0)
                this.currentmovies = parseInt(param.currmovi - 1);
            else
                this.currentmovies = 0;

            // отображение имени файла
            this.shownamefile = 1;
            if (param.shownamefile != null && param.shownamefile.toString() == '0')
                this.shownamefile = 0;

            this.file = param.file;
            this.fileshort = GWTK.routeUtil.shortfilename(this.file);

            // Видеофайлы (структурированный массив file,time)
            if (param.movies != null && param.movies.length > 0) {
                var count = param.movies.length;
                for (var i = 0; i < count; i++) {
                    this.movies[i] = new Array();
                    this.movies[i].file = param.movies[i].file;
                    this.movies[i].timebegin = parseInt(param.movies[i].timebegin);
                    this.movies[i].fileshort = GWTK.routeUtil.shortfilename(this.movies[i].file);
                    this.movies[i].duration = null;
                }
                // отсортируем
                /*               var bb=[], min, pos;
                               for (var i = 0; i < count-1; i++){ 
                                   min = this.movies[i].timebegin;
                                   pоs = i;
                                   for (var j = i + 1; j < count; j++){
                                       if (this.movies[j].timebegin < min) {
                                           min = this.movies[j].timebegin;
                                           pоs = j;
                                           bb = this.movies[i];
                                           this.movies[i] = this.movies[pоs];
                                           this.movies[pоs] = bb;
                                       }
                                   }
                               }
                */
                if (this.currentmovies > this.movies.length - 1)
                    this.currentmovies = this.movies.length - 1;
                this.videoTimebegin = this.movies[this.currentmovies].timebegin / 1000;
            }
            else
                this.currentmovies = -1;

            GWTK._routesBPLA.push(this);
        },

        initRes: function () {
            this.routeBPLA_mess1 = w2utils.lang("There are no parameters to display");//'Отсутствуют параметры для отображения';
            this.routeBPLA_mess2 = w2utils.lang("No coordinate conversion function");//'Отсутствует функция пересчета координат';
            this.routeBPLA_showvideo = w2utils.lang("Show the video");//'Показать видеозапись';
            this.routeBPLA_checkpoint = w2utils.lang("Mark the point of track");//'Отметить все точки трека';
            this.routeBPLA_timestampNo = w2utils.lang("You can not continue working because of lack of time stamps");//'Невозможно продолжить работу из-за отсутствия временных меток';
            this.routeBPLA_VideoSpeedSlowly = w2utils.lang("slow");//'медленно';
            this.routeBPLA_VideoSpeedNormal = w2utils.lang("fine");//'нормально';
            this.routeBPLA_VideoSpeedQuickly = w2utils.lang("fast");//'быстро';
        },

        clear: function () {
            this.alias = null;
            this.file = null;
            this.fileshort = null;
            if (this.points != null) {
                this.points.splice(0, this.points.length);
                this.centerObj = null;
            }
            if (this.movies != null)
                this.movies.splice(0, this.movies.length);
            this.clearPaint();
        },

        // очистить отрисованные элементы
        clearPaint: function () {
            this.clearPaintPoint();
            this.clearPaintLine();
        },

        // удалить маркер
        clearMark: function (placemark) {
            // удалим текущий маркер
            if (placemark != null)
                this.routePane.removeChild(placemark.geopoint());
            return null;
        },

        // очистить отрисованные элементы
        clearPaintPoint: function () {
            if (this.routePane == null || this.pointsObj == null)
                return;

            for (var i = 0; i < this.pointsObj.length; i++)
                this.clearMark(this.pointsObj[i]);
            this.pointsObj.splice(0, this.pointsObj.length);

            // удалим маркеры
            this.currentmark = this.clearMark(this.currentmark);
            this.selectmark = this.clearMark(this.selectmark);

        },

        clearPaintLine: function () {
            var nodes = $("." + this.cssLine_msie);
            if (nodes.length != 0)
                $(this.routePane).children().remove("." + this.cssLine_msie);
            else {
                nodes = $("." + this.cssLine);
                if (nodes.length != 0)
                    $(this.routePane).children().remove("." + this.cssLine);
            }
        },

        // инициализация данных из файла
        initdataFromfile: function (currentpoint, videoVisible, videoIsPlay, currentmovies) {
            this.file_get_contents(this.file, currentpoint, videoVisible, videoIsPlay, currentmovies);
        },

        // инициализация данных из массива структур points
        initdataFromdata: function (points, currentpoint, videoVisible, videoIsPlay, currentmovies) {
            if (points == null || points == undefined || points.length == 0)
                return;

            this.points.splice(0, this.points.length);
            this.points = points;

            // Создадим паненли и нарисуем объект
            this.createObject();
            this.restoreparam(currentpoint, videoVisible, videoIsPlay, currentmovies);
            this.savedata();
        },

        // Восстановить параметры сеанса
        // currentpoint c 1
        // currentmovies c 1
        restoreparam: function (currentpoint, videoVisible, videoIsPlay, currentmovies) {
            if (currentpoint == null || currentpoint == undefined || currentpoint <= 0)
                this.currentpoint = 0;
            else
                this.currentpoint = parseInt(currentpoint) - 1;

            if (currentmovies == null || currentmovies == undefined || currentmovies <= 0)
                this.currentmovies = 0;
            else
                this.currentmovies = currentmovies - 1;

            var service;
            if (videoVisible != null && videoVisible != undefined && videoVisible == "true") {
                this.videoVisible = true;
                this.showVideo(this.videoVisible);
                if (videoIsPlay != null && videoIsPlay != undefined && videoIsPlay == "true") {
                    service = "start";
                }
            }
            if (this.points != null && this.points.length != 0 && this.points[this.currentpoint] != null) {
                this.sliderRoute.setValue(this.points[this.currentpoint].realtime);
                // отобразим текущую точку    
                this.currentmark = this.paintpoint(this.currentpoint, "current");
                try {
                    if (this.videoVisible) {
                        
                        this.videoTimebegin = this.movies[this.currentmovies].timebegin / 1000;
                        this.videocurrentTime = this.points[this.currentpoint].time_millisecond / 1000 - this.videoTimebegin;
                        if (this.video != null && this.video != undefined) {
                            this.video.currentTime = this.videocurrentTime;
                            //// Определим текущее суммарное время
                            //var summaryduration = this.summaryduration(this.currentmovies);
                            //if (summaryduration)
                            //    this.videocurrentTime_sum = this.summaryduration(this.currentmovies) + this.videocurrentTime;
                        }
                    }
                    if (service == "start") {
                        $("#play").click();
                        this.videoplay();
                    }
                }
                catch (e) { }
                finally { }
            }
        },

        // Определение суммарного времени всех видео файлов
        // Если задан currentmovies, то до него
        // timebegin - исключить время начала проигрывания  
        summaryduration: function (currentmovies, timebegin) {
            var len = this.movies.length;
            if (currentmovies === null || currentmovies > len - 1)
                currentmovies = len;
            var summ = 0;
            for (var i = 0; i < currentmovies; i++) {
                if (timebegin)
                    summ -= (this.movies[i].timebegin)/1000;
                if (this.movies[i].duration === null)
                    return summ;
                summ += this.movies[i].duration;
            }
            return summ;
        },

        // Запросить видео и смещение на нужное время
        // videocurrentTime - теущее время в секундах, которое может и перевалить за размер текущего видеофайла
        getmovie: function (videocurrentTime, currentmovies) {
            var len = this.movies.length,
                sumduration = 0, sumtimebegin = 0, sumduration_ = 0,
                time, currenttime = null;

            currentmovies = (!currentmovies) ? 0 : currentmovies;
            for (var i = currentmovies; i < this.movies.length; i++) {
                // Если нет длины видео (не было загружено)
                if (!this.movies[i].duration) {
                    if (currenttime) {
                        currenttime.currentmovies = i;
                        currenttime.time = this.movies[i].timebegin/1000;
                        return currenttime;
                    }
                    continue;
                }
                if (currenttime === null)
                    currenttime = { "currentmovies": i, "time": this.movies[i].timebegin/1000 };
                sumduration += this.movies[i].duration + this.movies[i].timebegin/1000;
                // sumtimebegin += this.movies[i].timebegin;
                if (videocurrentTime <= sumduration) {
                    currenttime.currentmovies = i;
                    // Время начала проигрывания
                    //time = this.movies[i].duration - (sumduration + videocurrentTime);
                    //currenttime.time = time - this.movies[i].timebegin / 1000;
                    currenttime.time = videocurrentTime - sumduration_ - this.movies[i].timebegin / 1000;
                    //currenttime.time = videocurrentTime - this.movies[i].timebegin / 1000;  // !!!!! верно
                    return currenttime;
                }
                sumduration_ += this.movies[i].duration + this.movies[i].timebegin / 1000;

            }

            return currenttime;
        },


        savedata: function () {
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
            // 10: "time(millisecond)" - time_millisecond  - для данных из файла kml расчитывается автоматически (пропорционально) 
            // 11: "datetime(utc)" - datetime_utc
            // 12: "datetime(local)" - datetime_local
            // 13: "satellites" - satellites
            // 14: "pressure(Pa)" - pressure_Pa
            // 15: "temperature(F)" - temperature_F 
            // realtime - реальная дата и время в миллисекундах - вычисляется
            if (this.points == null) return;

            var data = "";
            for (var i = 0; i < this.points.length; i++) {
                data += this.points[i].B + "|" + this.points[i].L + "|" + this.points[i].H + "|" +
                        this.points[i].ascent_feet + "|" + this.points[i].speed_mph + "|" + this.points[i].distance_feet + "|" +
                        this.points[i].max_altitude_feet + "|" + this.points[i].max_ascent_feet + "|" + this.points[i].max_speed_mph + "|" +
                        this.points[i].max_distance_feet + "|" + this.points[i].time_millisecond + "|" + this.points[i].datetime_utc + "|" +
                        this.points[i].datetime_local + "|" + this.points[i].satellites + "|" + this.points[i].pressure_Pa + "|" +
                        this.points[i].temperature_F + "|" + this.points[i].realtime + "#";
            }
            localStorage.setItem('createBPLA_routepoints', data);
        },

        pointsdata: function () {
            return this.points;
        },

        getdata: function () {
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
            // 10: "time(millisecond)" - time_millisecond  - для данных из файла kml расчитывается автоматически (пропорционально) 
            // 11: "datetime(utc)" - datetime_utc
            // 12: "datetime(local)" - datetime_local
            // 13: "satellites" - satellites
            // 14: "pressure(Pa)" - pressure_Pa
            // 15: "temperature(F)" - temperature_F 
            // realtime - реальная дата и время в миллисекундах - вычисляется

            var data = localStorage["createBPLA_routepoints"];
            if (data == null || data == undefined) return false;

            var mass = data.split("#")
            if (mass == null || mass.length <= 0)
                return false;

            var points = [];
            var k = 0;
            for (var i = 0; i < mass.length; i++) {
                if (mass[i] == null || mass[i] == undefined || mass[i] == "")
                    continue;
                var p = mass[i].split("|");
                if (p == null || p.length <= 0)
                    continue;
                points[k] = new Array();
                points[k].B = parseFloat(p[0]);
                points[k].L = parseFloat(p[1]);
                points[k].H = parseInt(p[2]);
                points[k].ascent_feet = p[3];
                points[k].speed_mph = p[4];
                points[k].distance_feet = p[5];
                points[k].max_altitude_feet = p[6];
                points[k].max_ascent_feet = p[7];
                points[k].max_speed_mph = p[8];
                points[k].max_distance_feet = p[9];
                points[k].time_millisecond = parseFloat(p[10]);
                points[k].datetime_utc = p[11];
                points[k].datetime_local = p[12];
                points[k].satellites = p[13];
                points[k].pressure_Pa = p[14];
                points[k].temperature_F = p[15];
                points[k].realtime = parseFloat(p[16]);
                k++;
            }
            return points;
        },


        file_get_contents: function (url, currentpoint, videoVisible, videoIsPlay, currentmovies) {
            if (url == null || url == undefined)
                return;
            var separator = '.';
            var mass = url.toLowerCase().split(separator);
            if (mass == null || mass.length <= 0)
                return;
            if (mass[mass.length - 1] == "kml")
                this.readFile(url, "kml", currentpoint, videoVisible, videoIsPlay);
            else {
                if (mass[mass.length - 1] == "csv")
                    this.readFile(url, "csv", currentpoint, videoVisible, videoIsPlay, currentmovies);
            }
        },


        readFile: function (url, type, currentpoint, videoVisible, videoIsPlay, currentmovies) {
            if (url == null) return;
            $.support.cors = true;

            var _routeBPLA = this;
            try {
                $.ajax({
                    url: url,
                    dataType: 'text',
                    crossDomain: true,
                    //islocal: 'false',
                    complete: function (data) {
                    },
                    //contentType: "application/json; charset=utf-8",
                    success: function (data) {
                        if (_routeBPLA == null || _routeBPLA == undefined)
                            return;

                        if (type == "kml")
                            _routeBPLA.loadXml(data);
                        else
                            _routeBPLA.loadCsv(data, ",");

                        _routeBPLA.eventFileComplete();

                        // Создадим панели и нарисуем объект
                        _routeBPLA.createObject();

                        _routeBPLA.restoreparam(currentpoint, videoVisible, videoIsPlay, currentmovies);
                        _routeBPLA.savedata();
                    }

                   , error: function (data, textStatus, er) {
                       _routeBPLA.eventFileLoadError(url, textStatus, er);
                       // При загрузке файла с IIS не был настроен просмотр каталога и тип MIME для файлов ".kml", добавила тип MIME в web.config виртуальной папки 
                       //<directoryBrowse enabled="true" />
                       // <staticContent>
                       //     <mimeMap fileExtension=".kml" mimeType="text/xml" />
                       // </staticContent>
                       //<httpProtocol>
                       //<customHeaders>
                       //  <add name="Access-Control-Allow-Origin" value="*" />
                       //  <add name="Access-Control-Allow-Methods" value="GET" />
                       //  <add name="Access-Control-Allow-Headers" value="Content-Type" />
                       //</customHeaders>
                       //</httpProtocol>
                       alert("Ошибка при загрузке : " + url + ": " + er + ".\nПроверьте настройки сервера на наличие разрешений,\nдля IIS включите опцию 'просмотр каталога', \nнастройте тип MIME для файлов kml и csv, \nнастройте заголовки ответов HTTP");
                   }
                });
            } catch (e) {
            }

        },

        // Создать объект полностью 
        createObject: function () {
            if (this.points.length == 0) {
                alert(this.routeBPLA_timestampNo);
                return;
            }

            // Пограничные значения
            this.dateTimeBegin = new Date(this.points[0].realtime);
            var count = this.points.length;
            this.dateTimeEnd = new Date(this.points[count - 1].realtime);

            this.Step = this.points[1].time_millisecond;

            // запустим диалог
            this.createPanelRoutes();

            // нарисуем объект
            this.paintobject();
        },

        loadXml: function (xml) {
            if (xml == null) return;

            var xmlDoc = $.parseXML(xml);
            var $xml = $(xmlDoc);

            var $placemark = $xml.find('Placemark');
            if ($placemark == null) {
                return;
            }
            var count = $placemark.length;
            if (count == 0) return;
            var countch, countch1, istime, isBL;
            var k = 0;

            // Для вычисления центра
            var lat = lon = 0;
            for (var i = 0; i < count; i++) {
                if ($placemark[i] == null || $placemark[i].childNodes == null)
                    continue;
                countch = $placemark[i].childNodes.length;
                istime = isBL = false;
                if (countch == 0) continue;
                for (var j = 0; j < countch; j++) {
                    if ($placemark[i].childNodes[j].nodeName.toLowerCase() == 'timestamp') {
                        if ($placemark[i].childNodes[j].childNodes == null)
                            continue;
                        countch1 = $placemark[i].childNodes[j].childNodes.length;
                        if (countch1 == 0) continue;
                        for (var jj = 0; jj < countch1; jj++) {
                            if ($placemark[i].childNodes[j].childNodes[jj].nodeName.toLowerCase() != 'when')
                                continue;
                            if (this.points[k] == null)
                                this.points[k] = new Array();
                            if ($placemark[i].childNodes[j].childNodes[jj].textContent == undefined)
                                this.points[k].datetime_utc = $placemark[i].childNodes[j].childNodes[jj].text;
                            else
                                this.points[k].datetime_utc = $placemark[i].childNodes[j].childNodes[jj].textContent;
                            this.points[k].realtime = GWTK.routeUtil.getdate_millisecond(this.points[k].datetime_utc);

                            // определим time_millisecond
                            if (k == 0)
                                this.points[k].time_millisecond = 0;
                            else
                                this.points[k].time_millisecond = this.points[k - 1].time_millisecond + (this.points[k].realtime - this.points[k - 1].realtime);

                            istime = true;
                        }
                    }
                    if ($placemark[i].childNodes[j].nodeName.toLowerCase() == 'point') {
                        countch1 = $placemark[i].childNodes[j].childNodes.length;
                        if (countch1 == 0) continue;
                        for (var jj = 0; jj < countch1; jj++) {
                            if ($placemark[i].childNodes[j].childNodes[jj].nodeName.toLowerCase() != 'coordinates')
                                continue;
                            if (this.points[k] == null)
                                this.points[k] = new Array();
                            var text;
                            if ($placemark[i].childNodes[j].childNodes[jj].textContent == undefined)
                                text = $placemark[i].childNodes[j].childNodes[jj].text;
                            else
                                text = $placemark[i].childNodes[j].childNodes[jj].textContent;
                            if (text != null && text != "") {
                                // распарсить и преобразовать 
                                var mass = text.split(",");
                                if (mass == null || mass.length < 3)
                                    continue;
                                this.points[k].L = mass[0];
                                this.points[k].B = mass[1];
                                this.points[k].H = mass[2];
                                isBL = true;
                            }
                        }
                    }
                }
                if (istime && isBL) {
                    // для определениен центра
                    lat += parseFloat(this.points[k].B);
                    lon += parseFloat(this.points[k].L);
                    k++;
                }
            }


            if (k == 0)
                return;

            // Вычислим центр
            var latc = lat / k;
            var lonc = lon / k;
            this.centerObj = [latc, lonc];

            // Подкорректируем time_millisecond для точек с одинаковым временем
            this.correctTime_millisecond(this.points);
        },

        // Подкорректируем time_millisecond для точек с одинаковым временем
        correctTime_millisecond: function (points) {
            if (points == null || points == undefined || points.length == 0)
                return;
            var k = points.length;
            // Подкорректируем time_millisecond для точек с одинаковым временем
            var nb = ne = te = 0;
            for (var i = 1; i < k; i++) {
                if (points[i - 1].time_millisecond == points[i].time_millisecond) {
                    ne++;
                    continue;
                }
                // подкорректируем
                if (nb != ne) {
                    ne++;
                    var delta = Math.ceil((points[ne].time_millisecond - points[nb].time_millisecond) / (ne - nb));
                    var jj = 1;
                    for (var j = nb + 1; j < ne; j++) {
                        points[j].time_millisecond += (delta * jj);
                        points[j].realtime += (delta * jj);
                        jj++;
                    }
                    nb = ne = i;
                }
            }
        },

        // Загрузка csv файла
        loadCsv: function (strData, strDelimiter) {
            var arrData = GWTK.routeUtil.loadCsv(strData, strDelimiter);
            if (this.initpointscsv == null || this.initpointscsv == undefined)
                return;

            this.points = this.initpointscsv(arrData);

            if (this.points == null || this.points == undefined) {
                this.points = [];
                return;
            }
            var count = this.points.length;

            // Для вычисления центра
            var lat = lon = 0;
            // начнем с 1, т.к. в первой строке идут названия
            for (var i = 0; i < count; i++) {
                lat += parseFloat(this.points[i].B);
                lon += parseFloat(this.points[i].L);
                this.points[i].realtime = GWTK.routeUtil.getdate_millisecond(this.points[i].datetime_utc);
            }

            // Вычислим центр
            var latc = lat / (count);
            var lonc = lon / (count);
            this.centerObj = [latc, lonc];

        },

        // нарисуем объект
        paintobject: function (noline) {

            if (this.points == null || this.points.length == 0)
                return;

            if (this.routePane == null && this.overlayPane != null) {
                this.routePane = GWTK.DomUtil.create('div', 'route-panel', this.overlayPane);
                this.routePane.id = 'paintroutePane';
                this.overlayPane.appendChild(this.routePane);
            }
            if (this.routePane == null || this.routePane == undefined)
                return;

            // Переместить в центр при заданном масштабе
            if (this.showCenter != null && this.showCenter != undefined && (noline == null || noline == undefined))
                this.showCenter(this.centerObj);

            var coord = [];
            var count = this.points.length;
            for (var i = 0; i < count; i++) {
                var id = "routepoint" + '_' + i.toString();
                coord[0] = this.points[i].B;
                coord[1] = this.points[i].L;
                var overlaypoint = this.geo2pixelOffset(coord);
                var pmark;
                if (this.checkpoint != 0) 
                    pmark = new GWTK.placemarkEx(id, coord, '', '', this.imgpoint, GWTK.point(40, 50), GWTK.point(-20, -50), this.imgpointCurrent);
                else
                    pmark = new GWTK.placemarkEx(id, coord, '', '', this.imgpointEmpty, GWTK.point(40, 50), GWTK.point(-20, -50), this.imgpointCurrent);

                pmark.position(overlaypoint);
                pmark.id = id;
                if (noline == null || noline == undefined) {
                    var origin = null;
                    if (this.pointsObj.length > 0)
                        origin = this.pointsObj[this.pointsObj.length - 1];
                    if (origin) {
                        var prev = origin.realpoint;
                        var next = pmark.realpoint;
                        GWTK.routeUtil.drawLineWithIdToDivEx(prev, next, 'line' + this.pointsObj.length, this.routePane, GWTK.point(0, 0), this.cssLine, this.cssLine_msie);
                    }
                }

                pmark.geopoint().title = this.pointTooltip(i + 1, this.points[i]);

                this.routePane.appendChild(pmark.geopoint());
                var _routeBPLA = this;
                pmark.imgpoint().onmousedown = function (event) {

                    if (_routeBPLA == null || _routeBPLA == undefined)
                        return;

                    if (_routeBPLA.sliderRoute == null || _routeBPLA.sliderRoute == undefined)
                        return;

                    var idstr = this.getid();
                    if (idstr == null || idstr == undefined)
                        return;
                    var id = parseInt(idstr);

                    if (_routeBPLA.video != null && _routeBPLA.videoDuration != null) {
                        var currentTime = _routeBPLA.points[id].time_millisecond / 1000 - _routeBPLA.videoTimebegin;
                        if (currentTime > _routeBPLA.videoDuration)
                            currentTime = _routeBPLA.videoDuration;

                        _routeBPLA.video.currentTime = currentTime;
                        //_routeBPLA.video.pause();
                    }

                    //_routeBPLA.sliderRoute.stop();

                    _routeBPLA.selectmark = _routeBPLA.paintpoint(id, "select");
                    if (_routeBPLA.sliderRoute != null && _routeBPLA.sliderRoute != undefined) {
                        _routeBPLA.sliderRoute.setValue(_routeBPLA.points[id].realtime);
                        _routeBPLA.selectpoint = id;
                    }

                }

                this.pointsObj.push(pmark);
            }


            // Отладка - рисуем центр
            /*
           var geo = GWTK.toLatLng(this.centerObj);
            var overlaypoint = GWTK.tileView.geo2pixelOffset(GWTK.maphandlers.map, geo);
            var pmark = new GWTK.placemark(geo, '', '', '/images/yellowpoint.gif');    
            pmark.position(overlaypoint);
            pmark.id = "routepoint_center";
            this.routePane.appendChild(pmark.geopoint());   
            this.pointsObj.push(pmark);
            */

        },


        refresh: function () {
            if (this.routePane == null)
                return;

            this.routePane.style.left = '0px';
            this.routePane.style.top = '0px';
            if (this.pointsObj.length == 0) return;

            // текущий маркер перерисовать
            var geo, place;
            if (this.currentmark != null) {
                geo = this.currentmark.latlong;
                place = this.geo2pixelOffset(geo);
                this.currentmark.position(place);
            }

            // текущий перерисовать
            if (this.selectmark != null) {
                geo = this.selectmark.latlong;
                place = this.geo2pixelOffset(geo);
                this.selectmark.position(place);
            }

            for (var i in this.pointsObj) {
                geo = this.pointsObj[i].latlong;
                place = this.geo2pixelOffset(geo);
                this.pointsObj[i].position(place);
            }

            this.clearPaintLine();

            for (var i = 0; i < this.pointsObj.length - 1; i++) {
                var prev = this.pointsObj[i].realpoint;
                var next = this.pointsObj[i + 1].realpoint;
                GWTK.routeUtil.drawLineWithIdToDivEx(prev, next, 'line' + (i + 1).toString(), this.routePane, GWTK.point(0, 0), this.cssLine, this.cssLine_msie);
            }

        },

        destroy: function () {

            // Удалить слайдер
            if (this.sliderRoute != null || this.sliderRoute != undefined)
                this.sliderRoute.destroy();

            this.clear();

            if (this.mapdiv == null || this.mapdiv == undefined)
                return;

            if (this.overlayPane != null) {
                GWTK.routeUtil.removeAllChild(this.overlayPane);
                this.mapdiv.removeChild(this.overlayPane);
                this.overlayPane = null;
            }

            if (this.panelVideo != null) {
                GWTK.routeUtil.removeAllChild(this.panelVideo);
                if (this.videodiv == null || this.videodiv == undefined)
                    this.mapdiv.removeChild(this.panelVideo);
                else
                    $(this.videodiv).children().remove();
                this.panelVideo = null;
            }

            if (this.panel != null) {
                GWTK.routeUtil.removeAllChild(this.panel);
                if (this.sliderdiv == null || this.sliderdiv == undefined)
                    this.mapdiv.removeChild(this.panel);
                else
                    $(this.sliderdiv).children().remove();
                this.panel = null;
            }

            // Удалим из списка экземпляров
            var count = GWTK._routesBPLA.length;
            var k = -1;
            for (var i = 0; i < count; i++)
                if (this.id == GWTK._routesBPLA[i]) {
                    k = i; break;
                }
            if (k >= 0)
                GWTK._routesBPLA.splice(k, 1);
        },


        // создать панель 
        createPanelRoutes: function () {
            if (this.mapdiv == null || this.mapdiv == undefined)
                return;

            // панель слайдера
            if (this.sliderdiv == null || this.sliderdiv == undefined) {
                this.panel = GWTK.DomUtil.create('div', 'routeBPLA-panel map-panel-def', this.mapdiv);
                $(this.panel).draggable({ containment: "parent", distance: 2 });
            }
            else
                this.panel = GWTK.DomUtil.create('div', 'routeBPLA-panel_child map-panel-def', this.sliderdiv);
            this.panel.id = 'routePane_' + this.id;

            // панель видео, если был контейнер по видео
            var panelVideo_id = 'routeBPLA-panelVideo_' + this.id;
            if (this.videodiv) {
                this.panelVideo = GWTK.DomUtil.create('div', 'routeBPLA-panelVideo_child map-panel-def', this.videodiv);
                this.panelVideo.id = panelVideo_id;
            }

            // панель точек
            this.overlayPane = GWTK.DomUtil.create('div', 'overlay-panel map-panel-def', this.mapdiv);
            this.overlayPane.id = 'routeBPLA-overlayPane_' + this.id;

            // видимость всех точек 
            var checked = ' checked="checked" ';
            var strcheck = '<input type="checkbox" id="routeCheckVisible_' + this.id + '"';
            if (this.checkpoint == 1)
                strcheck += checked;
            strcheck += '><label for="routeCheckVisible_' + this.id + '" class="checkFontSize"> ' + this.routeBPLA_checkpoint + '</label>';

            // скорость
            var speed = '<div id="routeVideoSpeed_' + this.id + '" class="checkFontSize" style="margin-top:-10px;">' + w2utils.lang("Video playback speed ") +
           '<input type="radio" id="slowly_' + this.id + '" value="0" name="speedBPLA_' + this.id + '"';
            if (this.videospeed == 0)
                speed += checked;
            speed += '><label for="slowly_' + this.id + '" class="checkColor"> ' + this.routeBPLA_VideoSpeedSlowly + ' </label>' +
            '<input type="radio" id="normal_' + this.id + '" value="1" name="speedBPLA_' + this.id + '"';
            if (this.videospeed == 1)
                speed += checked;
            speed += '><label for="normal_' + this.id + '" class="checkColor"> ' + this.routeBPLA_VideoSpeedNormal + ' </label>' +
            '<input type="radio" id="quickly_' + this.id + '" value="2" name="speedBPLA_' + this.id + '"';
            if (this.videospeed == 2)
                speed += checked;
            speed += '><label for="quickly_' + this.id + '" class="checkColor"> ' + this.routeBPLA_VideoSpeedQuickly + ' </label>' +
            '</div>';

            $('#routePane_' + this.id).append('<div class="routeContainer"> </div>');

            if (this.sliderdiv == null || this.sliderdiv == undefined) {
                var $bt = $('.routeContainer'), _that = this;
                if ($bt.length > 0) {
                    $bt[0].appendChild(GWTK.Util.createHeaderForComponent({
                        map: this.map,
                        name: (this.shownamefile == 1) ? this.fileshort : this.alias,
                        callback: GWTK.Util.bind(function () {
                            _that.destroy(); 
                        }, this)
                    }));
                }
            }

            $('.routeContainer').append(
           '<table width="100%"> ' +
             '<tr> ' +
             '<td> ' +
                 '<div class="sliderContainer">' +
                    '<table width="100%"> ' +
                     '<tr> ' +
                     '<td align="left"> ' +
                        '<div id="showVideoContainer_' + this.id + '" class="control-button control-button_route_showvideo clickable" Title="' + this.routeBPLA_showvideo + '"> </div> ' +  // кнопка видеоплеера
                    '</td> ' +
                    '<td align="left"> ' +
                               '<div id="routeToolTips_' + this.id + '" class="routeToolTips-panel" > </div>' +   // панель с кнопками
                     '</td> ' +
                     '<td  align="right"> ' + strcheck + '</td> ' +
                     '</tr> ' +
                     '</table> ' +
                '</div> ' +
             '</td> ' +
             '</tr> ' +
             '<tr> ' +
             '<td> ' +
                  '<div id="sliderRoutePane_' + this.id + '" class="sliderRoutePane"> </div> ' +     // место под слайдер
             '</td> ' +
             '</tr> ' +
                     '<tr>' +
                     '<td colspan="3" align="left"> ' + speed + '</td> ' +
                     '</tr> ' +
            '</table> ');

            // Если был контейнер под видео, то добавим туда 
            if (this.panelVideo)
                $('#routeBPLA-panelVideo_' + this.id).append('<div id="videoContainer_' + this.id + '" class="videoContainer" align="center"> ');
            else 
                // если контейнера нет, то все вместе
                $(this.panel).append('<div class="routeBPLA-panelVideo_child" id = "' + panelVideo_id + '"><div id="videoContainer_' + this.id + '" class="videoContainer" align="center"></div>');
                       
            // Создадим слайдер с кнопками
            var initparam = new Array();
            initparam.dtbegin = this.dateTimeBegin
            initparam.dtend = this.dateTimeEnd;
            initparam.step = this.Step;
            initparam.interval = this.Interval;
            initparam.mininterval = this.Interval;
            this.sliderRoute = new GWTK.sliderToolsControl("route", $("#routeToolTips_" + this.id)[0], $("#sliderRoutePane_" + this.id)[0], initparam);

            var _routeBPLA = this;
            // События слайдера
            $('#sliderRoutePane_' + this.id).on('updatedatasliderToolsControl', function (ui) {
                _routeBPLA.selectpoint = -1;
                var sumdt = _routeBPLA.summaryduration(_routeBPLA.currentmovies, true);
                //                _routeBPLA.paintdataPoint(ui.value, ui.service);
                _routeBPLA.paintdataPoint(sumdt + ui.value, ui.service);

                _routeBPLA.eventUpdatedata(_routeBPLA.points[_routeBPLA.currentpoint], _routeBPLA.currentpoint + 1);
                return false;
            });

            $('#sliderRoutePane_' + this.id).on('updateparamsliderToolsControl', function (ui) {
                _routeBPLA.Step = ui.step;
                _routeBPLA.Interval = ui.interval;
                _routeBPLA.eventUpdateparam(ui.step, ui.interval);
                return false;
            });

            this.setvideo(this.currentmovies);


            $(document).ready(function () {

                $('#routeCheckVisible_' + _routeBPLA.id).change(function (event) {
                    _routeBPLA.updateImagepoint();
                });

                $('input[type=radio][name=speedBPLA_' + _routeBPLA.id + ']').change(function (event) {
                    _routeBPLA.setSpeed(this.value);
                });

                $("#loadkmlFile_" + _routeBPLA.id).change(function (event) {
                    var input = event.target;
                    _routeBPLA.file = input;
                    var reader = new FileReader();
                    reader.onload = function () {

                        _routeBPLA.clear();
                        var text = reader.result;

                        _routeBPLA.loadXml(reader.result);

                        // Нарисуем объект
                        if (_routeBPLA.points.length > 0) {
                            // Пограничные значения
                            _routeBPLA.dateTimeBegin = new Date(_routeBPLA.points[0].realtime);
                            var count = _routeBPLA.points.length;
                            _routeBPLA.dateTimeEnd = new Date(_routeBPLA.points[count - 1].realtime);
                            _routeBPLA.Step = _routeBPLA.points[1].time_millisecond;

                            // запустим диалог
                            _routeBPLA.updateroutedata();
                            _routeBPLA.videoTimebegin = 0;

                            // нарисуем объект
                            _routeBPLA.paintobject();
                        }


                    };
                    reader.readAsText(input.files[0]);

                });

                $("#showVideoContainer_" + _routeBPLA.id).click(function () {
                    if (_routeBPLA == null || _routeBPLA == undefined)
                        return;
                    if (_routeBPLA.videoVisible)
                        _routeBPLA.showVideo(false);
                    else
                        _routeBPLA.showVideo(true);
                });

                _routeBPLA.setvideoplayer();

            });

            if (this.sliderdiv == null && this.videodiv == null)
                $(this.panel).draggable({ cancel: "div.routeContainer" }); // Не драгать внутреннюю панель
        },


        // Установить текущее кино
        setvideo: function (currentmovies) {

            // Удалить события
            if (this.video) {
                this.video.removeEventListener("canplay", this.onVideoCanplay);
                this.video.removeEventListener("playing", this.onVideoPlaying);
                this.video.removeEventListener("pause", this.onVideoPause);
                this.video.removeEventListener("timeupdate", this.onVideoTimeupdate);
            }

            if (currentmovies === null)
                return;

            this.currentmovies = currentmovies;
            $('#HtmlVideoPlayer_' + this.id).remove();
            $('#routevideoFileName_' + this.id).remove();

            if (this.currentmovies != -1) {
                $('#showVideoContainer_' + this.id).css("display", "");
                $('#videoContainer_' + this.id).append(
                '<div> <div id="routevideoFileName_' + this.id + '" class="routeFilesName" align="left">' + this.movies[this.currentmovies].fileshort + '</div></div>');

                $('#videoContainer_' + this.id).append(
                '<video id="HtmlVideoPlayer_' + this.id + '" class="routeVideo" controls preload "> ' + // controls preload="none" poster="perigny-poster.jpg" width="600px"
                    '<source id="routesourceVideo_mp4_' + this.id + '" src="' + this.movies[this.currentmovies].file + '" type="video/mp4" codecs="avc1.42E01E, mp4a.40.2">' +
                    '<source id="routesourceVideo_webm_' + this.id + '" src="' + this.movies[this.currentmovies].file + '" type="video/webm" codecs="vp8, vorbis">' +
                    '<source id="routesourceVideo_ogg_' + this.id + '" src="' + this.movies[this.currentmovies].file + '"  type="video/ogg" codecs="theora, vorbis" >' +
                '</video> ');
            }
            else {
                $('#showVideoContainer_' + this.id).css("display", "none");
                if (this.videodiv)
                    $(this.videodiv).css("display", "none");
            }
        },


        // Установить видеоплеер для текущего кино
        setvideoplayer: function () {
            var _routeBPLA = this;
            var video = document.getElementById("HtmlVideoPlayer_" + _routeBPLA.id);
            if (video != null && video.canPlayType) {
                try {
                    video.playbackRate = 0.5;
                    this.video = video;
                }

                catch (e) {
                    _routeBPLA.video = null;
                    alert("Компонент video работает некорректно, проверьте настройки браузера.");
                    return;
                }

                this.setSpeed(this.videospeed.toString());

                this.video.that = this;
                video.addEventListener("canplay", _routeBPLA.onVideoCanplay, false);
                video.addEventListener("playing", _routeBPLA.onVideoPlaying, false);
                video.addEventListener("pause", _routeBPLA.onVideoPause, false);
                video.addEventListener("timeupdate", _routeBPLA.onVideoTimeupdate, false);
            }
            else {  // Если браузер не поддерживает html5
                $('#showVideoContainer_' + _routeBPLA.id).css("display", "none");
            }

            _routeBPLA.showVideo(_routeBPLA.videoVisible);

        },

        
        setSpeed: function (value) {
            if (this.video == null || !this.video.canPlayType)
                return;
            try {
                switch (value) {
                    default:
                    case "0":
                        this.video.playbackRate = 0.5;
                        break;
                    case "1":
                        this.video.playbackRate = 1;
                        break;
                    case "2":
                        this.video.playbackRate = 2;
                        break;
                }

                this.videospeed = parseInt(value);
                // Создадим событие
                this.eventVideoSpeed(this.videospeed);
            }
            catch (e) { }
            finally { }
        },

        updateImagepoint: function () {
            if ($("#routeCheckVisible_" + this.id).prop("checked"))
                this.checkpoint = 1;
            else
                this.checkpoint = 0;

            // сотрем
            this.clearPaintPoint();
            // нарисуем заново
            this.paintobject(true);

            // отобразим текущую точку    
            this.currentmark = this.paintpoint(this.currentpoint, "current");
            if (this.selectpoint >= 0)
                this.selectmark = this.paintpoint(this.selectpoint, "select");

            // Создадим событие
            this.eventCheckpoint(this.checkpoint);
        },

        // показать/ скрыть проигрыватель
        showVideo: function (visible) {
            if (visible && this.video != null && this.video != undefined) {     // показать
                if (this.videodiv != null && this.videodiv != undefined)
                    $(this.videodiv).show();
                $("#routeBPLA-panelVideo_" + this.id).show();
                $("#routeVideoSpeed_" + this.id).show();
                this.videoVisible = true;
            }
            else {
                $("#routeBPLA-panelVideo_" + this.id).hide();
                $("#routeVideoSpeed_" + this.id).hide();
                this.videoVisible = false;
                if (this.videodiv != null && this.videodiv != undefined) {
                    $(this.videodiv).hide();
                }
                if (this.videoIsPlay) {
                    this.videopause();
                }
            }

            // Создадим событие
            this.eventVideovisible(this.videoVisible);
        },


        //// Отобразить данные текущей точки
        //paintdataPoint: function (dt, service) {
        //    if (dt == null || dt == undefined)
        //        return;

        //    // найдем точку
        //    if (this.points == null || this.points == undefined || this.points.length == 0)
        //        return;

        //    var ipoint = this.findpoint(dt, service);
        //    if (ipoint == -1) return;

        //    this.currentmark = this.paintpoint(ipoint, "current");
        //    var currentTime = this.points[ipoint].time_millisecond / 1000;

        //    // Если текущее время меньше времени начала видео, то выходим
        //    if (this.videoVisible && this.video != null && this.videoDuration != null) {
        //        var play = false;
        //        if (currentTime < this.videoTimebegin) {
        //            this.videocurrentTime = currentTime - this.videoTimebegin;//0;
        //            this.video.currentTime = this.videocurrentTime;
        //            this.videopause();
        //        }
        //        else {
        //            if (currentTime > this.videoTimebegin + this.videoDuration) {
        //                this.videocurrentTime = this.videoDuration;
        //                this.video.currentTime = this.videocurrentTime;

        //                // Если есть еще видеофайлы
        //                var currenttime = this.getmovie (currentTime);
        //                if (currenttime === null) {
        //                    this.videocurrentTime = this.videoDuration;
        //                    this.video.currentTime = this.videocurrentTime;
        //                }
        //                else {
        //                    this.setvideo(currenttime.currentmovies);
        //                    this.video.currentTime = currenttime.time;
        //                    this.setvideoplayer();
        //                    service = "start";
        //                }
        //                //this.videocurrentTime_sum
        //                //this.videoTime_sum
        //                //// Найти в каком видео и его подключить
        //                //if (this.currentmovies < this.movies.length-1) {
        //                //    this.currentmovies++;
        //                //    this.setvideo(this.currentmovies);
        //                //    this.setvideoplayer();
        //                //    service = "start";
        //                //}
        //            }
        //            else {
        //                play = true;
        //                // Если video не былj запущенo ранее, а процесс идет, то start
        //                if (!this.videoIsPlay && service == "playprocess")
        //                    service = "start";
        //            }
        //        }

        //        switch (service) {
        //            case "start":
        //                this.videocurrentTime = currentTime - this.videoTimebegin;
        //                if (play) {
        //                    this.videoplay();
        //                }
        //                this.video.currentTime = this.videocurrentTime;
        //                break;
        //            case "stop":
        //                this.videocurrentTime = currentTime - this.videoTimebegin;
        //                this.video.currentTime = this.videocurrentTime;
        //                this.videopause();
        //                //this.video.pause();
        //                break;
        //            case "begin":
        //            case "end":
        //            case "step_forward":
        //            case "step_back":
        //            case "playprocess_back":
        //                this.videocurrentTime = currentTime - this.videoTimebegin;
        //                this.video.currentTime = this.videocurrentTime;
        //                this.videopause();
        //                //this.video.pause();
        //                break;
        //            case "random":
        //                this.videopause();
        //                //this.video.pause();
        //                this.videocurrentTime = currentTime - this.videoTimebegin;
        //                //if (play)
        //                //    this.video.play();
        //                this.video.currentTime = this.videocurrentTime;
        //                break;
        //            default:
        //                /* if (this.video.paused) {
        //                     this.videocurrentTime = currentTime - this.videoTimebegin;
        //                     this.video.currentTime = this.videocurrentTime;
        //                     this.video.play();
        //                 }*/
        //                //this.video.currentTime = currentTime;
        //                //$('#routetest').text(this.video.currentTime);
        //                break;
        //        }
        //    }
        //},

        // Отобразить данные текущей точки
        // dt - общее время проигывания за исключением сдвига
        paintdataPoint: function (dt, service) {
            if (dt == null || dt == undefined)
                return;

            // найдем точку
            if (this.points == null || this.points == undefined || this.points.length == 0)
                return;

            var ipoint = this.findpoint(dt, service);
            if (ipoint == -1) return;

            this.currentmark = this.paintpoint(ipoint, "current");
            var currentTime = this.points[ipoint].time_millisecond / 1000;

            // Если текущее время меньше времени начала видео, то выходимF
            if (!this.videoVisible || !this.video || !this.videoDuration) 
                return;

            // Определим текущее время и видео
            var play = false;
            var currentvideotime = this.getmovie(currentTime);
            if (currentvideotime === null) {
                this.videopause();
            }
            else {
                // Суммарное время с учетом сдвига 
                // Сменился плеер
                if (currentvideotime.currentmovies != this.currentmovies) {
                    this.setvideo(currentvideotime.currentmovies);
                    this.videocurrentTime = 
                    this.video.currentTime = currentvideotime.time;
                    this.setvideoplayer();
                    if ((service == "playprocess" || service == "start")) {
                        service = "start";
                        play = true;
                    }
                }
                else {
                    //var summaryduration = this.summaryduration(this.currentmovies, true);
                    if (currentvideotime.time <= 0) {// || currentTime < (currentvideotime.time + summaryduration)) {
                        this.videocurrentTime = 0;// currentvideotime.time/1000;//0;
                        this.video.currentTime = this.videocurrentTime;
                        this.videopause();
                    }
                    else {
                        play = true;
                        // Если video не было запущенo ранее, а процесс идет, то start
                        if (!this.videoIsPlay && service == "playprocess")
                            service = "start";
                    }
                }
            }

            switch (service) {
                case "start":
                    this.videocurrentTime = currentvideotime.time;// currentTime - this.videoTimebegin;
                    if (play) {
                        this.videoplay();
                    }
                    this.video.currentTime = this.videocurrentTime;
                    break;
                case "stop":
                    this.videocurrentTime = currentvideotime.time;//currentTime - this.videoTimebegin;
                    this.video.currentTime = this.videocurrentTime;
                    this.videopause();
                    break;
                case "begin":
                case "end":
                case "step_forward":
                case "step_back":
                case "playprocess_back":
                    this.videocurrentTime = currentvideotime.time;//currentTime - this.videoTimebegin;
                    this.video.currentTime = this.videocurrentTime;
                    this.videopause();
                    break;
                case "random":
                    this.videopause();
                    this.videocurrentTime = currentvideotime.time;//currentTime - this.videoTimebegin;
                    this.video.currentTime = this.videocurrentTime;
                    break;
                default:
                    break;
            }
        },


        // найти точку по времени и направлению
        findpoint: function (dt, service) {
            var ret = -1;
            var count = this.points.length;
            if (count == 0)
                return -1;

            switch (service) {
                case "begin":
                    return 0;
                case "end":
                    return count - 1;
            }

            // найдем текущую дату
            var currenttime = this.points[this.currentpoint].realtime;
            var time = dt;
            if (currenttime == time)
                return this.currentpoint;

            if (currenttime < time) {  // идем вперед
                ret = count - 1;
                for (var i = this.currentpoint + 1; i < count; i++) {
                    if (time < this.points[i].realtime) {
                        return this.currentpoint = i - 1;
                    }
                }
            }
            else {                     // идем назад
                ret = 0;
                for (var i = this.currentpoint; i >= 0; i--) {
                    if (time > this.points[i].realtime) {
                        return this.currentpoint = i;
                    }
                }
            }

            return ret;
        },

        // нарисовать точку
        paintpoint: function (index, type) {
            // удалим маркеры
            this.currentmark = this.clearMark(this.currentmark);
            this.selectmark = this.clearMark(this.selectmark);

            var point = this.currentmark;
            var image = this.imgpointCurrent;
            var size = GWTK.point(40, 50);
            var offset = GWTK.point(-20, -50);

            switch (type) {
                case "current":
                    point = this.currentmark;
                    image = this.imgpointCurrent;
                    break;
                case "select":
                    point = this.selectmark;
                    image = this.imgpointSelect;
                    break;
            }


            // удалим текущий маркер
            point = this.clearMark(point);

            if (index == null || index == undefined || index < 0)
                return;

            var id = "routepoint_" + type + index.toString() + "_" + this.id;
            var coord = [];
            coord[0] = this.points[index].B;
            coord[1] = this.points[index].L;
            //var geo = GWTK.toLatLng(coord);
            //            var overlaypoint = GWTK.tileView.geo2pixelOffset(GWTK.maphandlers.map, geo);
            var overlaypoint = this.geo2pixelOffset(coord);
            point = new GWTK.placemarkEx(id, coord, '', '', image, size, offset);
            point.position(overlaypoint);
            point.geopoint().title = this.pointTooltip(index + 1, this.points[index]);
            //index + ", " + this.points[index].datetime_utc + ",  " + (+(this.points[index].realtime)) + ",  " + this.points[index].time_millisecond;
            this.routePane.appendChild(point.geopoint());

            return point;
        },

        // подпись к точке
        pointTooltip: function (number, point) {
            return number + ", " + point.datetime_utc;
        },

        showCenter: function (centerObj) {
            if (centerObj == null || centerObj.length == 0) return;
            var tilematrix = null;
            for (var i = 0; i < GWTK.maphandlers.map.layers.length; i++) {
                if (GWTK.maphandlers.map.layers[i].options.tilematrix) {
                    tilematrix = GWTK.maphandlers.map.layers[i].options.tilematrix;
                    GWTK.maphandlers.map.setView(null, centerObj, tilematrix);
                    break;
                }
            }
        },



        videoplay: function () {
            if (this.video != null && this.video != undefined) {
                this.videoEventOutside = true;
                this.video.play();
            }
        },

        videopause: function () {
            if (this.video != null && this.video != undefined) {
                this.videoEventOutside = true;
                this.video.pause();
            }
        },

        // События
        eventFileComplete: function () {
            $(this.mapdiv).trigger({
                type: 'filecompleteBPLA'
            });
        },

        eventFileLoadError: function (url, textStatus, er) {
            $(this.mapdiv).trigger({
                type: 'fileerrorBPLA',
                url: url,
                textStatus: textStatus,
                error: er
            });
        },

        eventUpdatedata: function (point, number) {
            $(this.mapdiv).trigger({
                type: 'updatedatarouteBPLA',
                point: point,
                pointnumber: number
            });
        },

        eventUpdateparam: function (step, interval) {
            $(this.mapdiv).trigger({
                type: 'updateparamBPLA',
                step: step,
                interval: interval
            });
        },

        eventVideovisible: function (visible) {
            $(this.mapdiv).trigger({
                type: 'videovisibleBPLA',
                value: visible
            });
        },

        eventVideoisplay: function (play) {
            $(this.mapdiv).trigger({
                type: 'videoplayBPLA',
                value: play
            });
        },

        eventCheckpoint: function (check) {
            $(this.mapdiv).trigger({
                type: 'checkpointBPLA',
                value: check
            });
        },

        eventVideoSpeed: function (speed) {
            $(this.mapdiv).trigger({
                type: 'videospeedBPLA',
                value: speed
            });
        },

        onVideoCanplay: function (event) {
            var _routeBPLA = this.that;
            _routeBPLA.videocurrentTime = 0;
            _routeBPLA.videoTimebegin = (_routeBPLA.movies[_routeBPLA.currentmovies].timebegin / 1000);
            //_routeBPLA.videoDuration = this.duration.toFixed(1);
            // Заполним длину файла
            _routeBPLA.movies[_routeBPLA.currentmovies].duration =
            _routeBPLA.videoDuration = parseFloat(this.duration.toFixed(1));
 
            // Выставим суммарное смещение 
            //_routeBPLA.videocurrentTime_sum = _routeBPLA.summaryduration(_routeBPLA.currentmovies) + _routeBPLA.videoTimebegin;
            //_routeBPLA.videoTime_sum = _routeBPLA.summaryduration(_routeBPLA.currentmovies+1);
        },

        onVideoPlaying: function (event) {
            var _routeBPLA = this.that;
            _routeBPLA.videoIsPlay = true;
            if (_routeBPLA.videoEventOutside == false)  // события самого плеера
                _routeBPLA.sliderRoute.startPlay();
            _routeBPLA.videoEventOutside = false;
            _routeBPLA.eventVideoisplay(_routeBPLA.videoIsPlay);
        },

        onVideoPause: function (event) {
            var _routeBPLA = this.that;
            _routeBPLA.videoIsPlay = false;
            if (_routeBPLA.videoEventOutside == false)  // события самого плеера
                _routeBPLA.sliderRoute.stopPlay();
            _routeBPLA.videoEventOutside = false;
            _routeBPLA.eventVideoisplay(_routeBPLA.videoIsPlay);
        },

        onTimeupdate: function (event) {
            var _routeBPLA = this.that;
            if (!_routeBPLA.videoIsPlay)
                return;
            var value = +(_routeBPLA.dateTimeBegin) + this.currentTime * 1000 + _routeBPLA.movies[_routeBPLA.currentmovies].timebegin;
            //_routeBPLA.videocurrentTime_sum = _routeBPLA.summaryduration(_routeBPLA.currentmovies) + value;
            _routeBPLA.sliderRoute.setValue(value);
        }

    }


    // сервисные функции =============================
    GWTK.routeUtil = {
        // Удалить все дочерние элементы
        removeAllChild: function (parent) {
            // parent.children().remove();

            if (parent == null) return;
            while (parent.childNodes.length > 0) {
                var child = parent.lastChild;
                parent.removeChild(child);
            }
        },

        // запросить короткое имя файла
        shortfilename: function (name) {
            if (name == null || name == undefined)
                return;
            var mass = name.split('/');
            if (mass == null || mass.length <= 1)
                mass = name.split('\\');
            if (mass == null || mass.length == 0)
                return;
            return mass[mass.length - 1];
        },

        // дата в миллисекундах
        getdate_millisecond: function (datetime_utc) {
            if (datetime_utc == null)
                return;

            var str = datetime_utc.replace(".", "/").replace(".", "/").replace("-", "/").replace("-", "/").replace('T', ' ').replace('Z', ' ');
            var separator = '/';
            var mass = str.split(separator);
            if (mass.length > 3) {// есть миллисекунды
                str = mass[0] + separator + mass[1] + separator + mass[2] + "." + mass[3];
            }
            var dt = new Date(str);
            return +(dt);
        },

        loadCsv: function (strData, strDelimiter) {
            if (strData == null) return;
            strDelimiter = (strDelimiter || ",");

            // Создать регулярное выражение для разбора значений CSV
            var objPattern = new RegExp(
                (
                    // Разделители.
                    "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
                    // Котировочные поля
                    "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                    // Стандартные поля
                    "([^\"\\" + strDelimiter + "\\r\\n]*))"
                ),
                "gi"
                );

            var arrData = [[]];
            var arrMatches = null;

            // Цикл по регулярному выражению пока есть соответствие
            while (arrMatches = objPattern.exec(strData)) {
                // Получить разделитель, который был найден
                var strMatchedDelimiter = arrMatches[1];

                if (
                    strMatchedDelimiter.length &&
                    strMatchedDelimiter !== strDelimiter
                    ) {
                    arrData.push([]);
                }

                var strMatchedValue;
                if (arrMatches[2]) {
                    strMatchedValue = arrMatches[2].replace(
                        new RegExp("\"\"", "g"),
                        "\""
                        );
                } else {
                    strMatchedValue = arrMatches[3];
                }
                arrData[arrData.length - 1].push(strMatchedValue);
            }
            return arrData;
        },



        // width - ширина линии в пикселах
       drawLineWithIdToDivEx: function (point1, point2, id, div, offset, css, css_msie, width) {
            if (div == null) return false;
            if (id == null || id.length == 0) return false;
            if (point1 === undefined || point2 === undefined) return false;
            if (point1 instanceof GWTK.Point === false ||
                point2 instanceof GWTK.Point === false) return false;

            var x1 = point1.x, y1 = point1.y, x2 = point2.x, y2 = point2.y;

            var lw = 2;
            var msie = $.browser.msie;
            var version = msie ? $.browser.version : 9;

            if (msie && version < 9) {
                x1 = parseInt(x1, 10); y1 = parseInt(y1, 10);
                x2 = parseInt(x2, 10); y2 = parseInt(y2, 10);

                var line = document.createElement('hr');
                if (css_msie != null && css_msie != undefined)
                    line.className = css_msie;
                else
                    line.className = 'ruler-line-msie';

                line.id = id;
                line.setAttribute('unselectable', 'on');

                var fx = true, fy = true, t; lw = 3;

                if (x1 > x2) { fx = false; t = x1; x1 = x2; x2 = t; }
                if (y1 > y2) { fy = false; t = y1; y1 = y2; y2 = t; }
                var dx = 0, dy = 0;
                if (offset != null && offset != undefined) {
                    dx = offset.x; dy = offset.y;
                }
                x1 += dx; y1 += dy; x2 += dx; y2 += dy;

                var w = x2 - x1; var h = y2 - y1;
                var c = Math.sqrt((w * w) + (h * h));

                GWTK.DomUtil.setPosition(line, GWTK.point(x1 + dx, y1 + dy));
                line.style.width = c;

                var cs = (fx ? w : -w) / c;
                var sn = (fy ? h : -h) / c;

                var filter = '';

                filter += "progid:DXImageTransform.Microsoft.Alpha(opacity=80) ";

                filter += "progid:DXImageTransform.Microsoft.Matrix(SizingMethod='auto expand'," +
                        "FilterType='bilinear'" + ",M11=" + (cs) + ",M12=" + (-sn) + ",M21=" + (sn) + ",M22=" + (cs) + ")";

                line.style.filter = filter;
                div.appendChild(line);
                return line;
                //return;
            }
                // без плагина jquery.browser только для jquery < 1.9 Соколова
                //else if ((msie && version >= 9) || $.browser.webkit || $.browser.opera || $.browser.mozilla || $.browser.gecko)
                // с плагином jquery.browser
            else if ((version >= 9) || $.browser.webkit || $.browser.opera || $.browser.mozilla || $.browser.gecko) {
                var x1 = parseInt(x1, 10); var y1 = parseInt(y1, 10);
                var x2 = parseInt(x2, 10); var y2 = parseInt(y2, 10);

                var line = document.createElement('canvas');
                div.appendChild(line);

                if (css != null && css != undefined)
                    line.className = css;
                else
                    line.className = 'ruler-line';

                line.id = id;

                var t;
                var fx = true; var fy = true;

                if (x1 > x2) { fx = false; t = x1; x1 = x2; x2 = t; }
                if (y1 > y2) { fy = false; t = y1; y1 = y2; y2 = t; }

                var dx = 0, dy = 0;
                if (offset != null && offset != undefined) {
                    dx = offset.x; dy = offset.y;
                }
                x1 += dx; y1 += dy; x2 += dx; y2 += dy;

                var w = x2 - x1; var h = y2 - y1;
                GWTK.DomUtil.setPosition(line, GWTK.point(x1 + dx, y1 + dy));

                line.width = w;
                line.height = h;

                var ctx = line.getContext('2d');
                ctx.lineWidth = lw;
                if (width != null && width != undefined)
                    ctx.lineWidth = width;

                ctx.strokeStyle = '#FF0000';
                var colorLine = $("." + css).css('color');
                if (colorLine != null && colorLine != undefined)
                    ctx.strokeStyle = colorLine;

                ctx.globalAlpha = 0.80;
                ctx.beginPath();
                ctx.moveTo(fx ? 0 : w, fy ? 0 : h);
                ctx.lineTo(fx ? w : 0, fy ? h : 0);
                ctx.stroke();
                return line;
            }
            else {
                return;
            }
        }
    }


    // Расширенный класс  Соколова
    // ==========================
    GWTK.placemarkEx = function (id, latlong, title, text, imgurl, size, offset, imgurlover) {
        this.name = "placemarkEx";
        this.id = id;
        this.latlong = []; // массив координат b,l
        if (latlong != null && latlong != undefined && latlong.length == 2) {
            this.latlong[0] = latlong[0];
            this.latlong[1] = latlong[1];
            //this.latlong = GWTK.toLatLng(latlong); // -90, 90
        }

        this.title = title;
        this.text = text;
        if (imgurl != undefined && imgurl != null)
            this.href = imgurl;
        else
            this.href = GWTK.imgMarkerBlankRed;

        if (size != undefined && size != null)
            this.size = size;
        else
            this.size = GWTK.point(30, 50);          // сдвиг значка относительно точки позиционирования (pixel)

        if (offset != undefined && offset != null)
            this.offset = offset;
        else {
            this.offset = GWTK.point(0, 0);            // сдвиг значка относительно точки позиционирования (pixel)
            this.offset.x = -Math.round(this.size.x / 2);
            this.offset.y = -this.size.y;
        }


        if (imgurlover != undefined && imgurlover != null)
            this.hrefover = imgurlover;

        // if (id != undefined && id != null)
        //    this.id = id;

        this.vertex;                               // точка привязки (pixel) 
        this.realpoint;                            // реальная точка привязки (pixel) 
        this.div = "";
        this.img = "";
        this.init();
        this.create();
 
    };

    GWTK.placemarkEx.prototype =
    {
        init: function () {
            //this.latlong = GWTK.toLatLng(this.latlong);
            if (this.title == undefined || this.title == null) this.title = "";
            if (this.text == undefined || this.text == null) this.text = "";
        },

        create: function () {
            var div = document.createElement('div');
            div.id = this.name + "div_" + this.id;
            //var link = document.createElement('a');
            var img = document.createElement('img');
            img.id = this.name + "img_" + this.id;
            img.src = this.href;
            img.setAttribute('hrefout', this.href);

            if (this.hrefover != undefined && this.hrefover != null) {
                img.setAttribute('hrefover', this.hrefover);

                img.onmouseout = function (event) {
                    this.src = this.getAttribute('hrefout');
                    if (event != undefined)
                        event.preventDefault();
                    return false;
                };

                img.onmouseover = function (event) {
                    this.src = this.getAttribute('hrefover');
                    if (event != undefined)
                        event.preventDefault();
                    return false;
                };

                img.getid = function () {
                    var mass = this.id.split("_");
                    if (mass != null && mass.length > 0)
                        return mass[mass.length - 1];
                }
            }

            div.className = "placemark";
            div.appendChild(img);
            this.div = div;
            this.img = img;

        },


        getposition: function () {
            return this.geopoint()._pos;
        },

        position: function (point) {
            if (!point) return point;
            this.vertex = point;   // точка привязки
            this.realpoint = GWTK.point(point.x, point.y); //  реальная точка привязки
            point.x += this.offset.x;
            point.y += this.offset.y;
            GWTK.DomUtil.setPosition(this.div, point);
            return point;
        },

        toPoint: function () {
            if (this.latlong === null) return null;
            return this.latlong;
            //return GWTK.point(this.latlong.lat, this.latlong.lng);
        },

        isgeopoint: function () {
            if (this.latlong === null) return false;
            return true;
        },

        geopoint: function () { return this.div; },

        imgpoint: function () { return this.img; }

    }

}