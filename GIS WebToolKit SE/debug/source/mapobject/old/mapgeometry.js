/****************************************** Тазин В.О. 22/08/17 *****
 **************************************** Соколова Т.О. 09/04/21 ****
 *                                                                  *
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2018              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Метрика объекта слоя                       *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {
// класс Журнала
    GWTK.Log = function() {
        this.toolname = 'log';
        
        /*  errors - массив ошибок
        GWTK.RecordLog = {
            "classname": "",    // Имя класса
            "funcname": "",     // Имя функции
            "type": "",         // Тип ошибки
            "message": ""       // Сообщение
        }*/
        this.records = new Array();
        
    };
    
    GWTK.Log.prototype = {
        
        /**
         * Добавить запись
         * @method add
         * @param record {Object GWTK.RecordLog} -  объект, содержащий информацию
         */
        // ===============================================================
        add: function(record) {
            this.records.push(record);
        },
        
        /**
         * Запросить запись по индексу ( с 0)
         * @method get
         * @param index (Int) -  объект, содержащий информацию
         * @return record {Object GWTK.RecordLog} - запись журнала
         */
        // ===============================================================
        get: function(index) {
            if (index < 0 || index >= this.records.length)
                index = 0;
            return this.records[index];
        },
        
        /**
         * Очистить журнал
         * @method clear
         */
        // ===============================================================
        clear: function() {
            this.records.splice(0, this.records.length);
        },            // Сохраним ошибки
        
        
        /**
         * Клон объекта
         * @method clone
         * @return {Object GWTK.Log} - объект журнал
         */
        // ===============================================================
        clone: function() {
            var newlog = new GWTK.Log();
            if (this.records.length > 0) {
                for (var i = 0; i < this.records.length; i++)
                    newlog.add(this.records[i]);
            }
            return newlog;
        },
        
        /**
         * Количество записей в журнале
         * @method count
         * @return {Number}
         */
        // ===============================================================
        count: function() {
            return this.records.length;
        }
        
        
    };
    GWTK.mapgeometry = function (map, mapobject, points, dimension, srsName) {
        this.error = true;

        this.toolname = 'mapgeometry';
        if (!map) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        // Переменные класса
        this.map = map;
        this.mapobject = mapobject;     // объект карты
        this.spatialposition = (mapobject && mapobject.spatialposition) ? mapobject.spatialposition.toLowerCase() : null;

        this.dimension = (dimension) ? dimension : 2;                   // размерность
        this.srsName = srsName ? srsName : "urn:ogc:def:crs:EPSG:4326";  // проекция в полном виде, например - 'urn:ogc:def:crs:EPSG:4326'

        this.subjects = new Array();    // массив подобъектов GWTK.mapgeometry
        this.insideMultipart = -1;       // номер объекта/подобъекта мультиполигона, внутри которого он лежит
        // массив точек объекта GWTK.Point
        this.points = (points && points instanceof Array) ? this.clonepoints(0, points) : new Array();

        // количество точек, загружаемое при чтении данных с сервера (из xml)
        this.countpoint = 0;
        // Признак рассечения объекта (только для линейного, чтоб добавить самостоятельные подобъекты при сохранении)
        this.cut = false;

        // Габариты
        this.bbox = [];         // порядок координат как в geojson (L, B)
        this.bboxpixel = [];    // порядок координат как на экране (x, y)

        // Ошибки пересечений контуров
        this.errors = new GWTK.Log();

        // Json геометрии (используется для быстрой отрисовки объекта призагрузке с сервера)
        this.oGeometryJSON = null;

        // Ссылка на геометрию в объект
        if (!points && mapobject && mapobject.geometry)
            mapobject.geometry = this;

        this.initialize();

        this.error = false;

        // Флаг изменения метрики (несоответсвия oGeometryJSON и реального массива точек)
        this.ischange = false;

        // Текст для подписи
        this._text = undefined;
    };

    GWTK.mapgeometry.prototype = {

        initialize: function () {
            if (this.points)
                this.setbbox();
            return this;
        },

        // запросить количество точек объекта/подобъекта
        // subject с 0
        count: function (subject) {
            var count = this.getpoints(subject).length;
            if (count == 0 && this.isGeometryJSON()) {
                this.loadJSON(this.oGeometryJSON);
                count = this.getpoints(subject).length;
                this.setbbox();
            }

            return count;
        },


        // Скопируем метрику из json
        copyFromGeometryJSON: function (jsonobj) {
            if (!jsonobj || !jsonobj.coordinates)
                return false;
            if (jsonobj.type) {
                // Очистим геометрию
                this.clear();
                this.spatialposition = jsonobj.type.toLowerCase();
                this.oGeometryJSON = JSON.parse(JSON.stringify(jsonobj));
                return true;
            }
        },

        // Загрузим метрику из json
        loadJSON: function (jsonobj) {
            if (!jsonobj || !jsonobj.coordinates)
                return false;
            if (jsonobj.type)
                this.spatialposition = jsonobj.type.toLowerCase();

            // Очистим геометрию
            this.clear();
            if (jsonobj.coordinates.length == 0)
                return true;

            var pcount, subcount, points = [];
            switch (this.spatialposition) {

                // один уровень вложенности
                case 'point':
                    points = this.JSONToPounts([jsonobj.coordinates]);
                    if (points)
                        this.points = points;
                    break;

                // двойной уровень вложенности
                case 'linestring':
                case 'title':
                case 'vector':
                    points = this.JSONToPounts(jsonobj.coordinates);
                    if (points)
                        this.points = points;
                    break;

                case 'multipoint':
                    pcount = jsonobj.coordinates.length;
                    for (var j = 0; j < pcount; j++) {
                        points = this.JSONToPounts([jsonobj.coordinates[j]]);
                        if (points) {
                            if (j == 0)
                                this.points = points;
                            else {
                                this.addsubject(points);
                            }
                        }
                    }
                    break;

                // тройной уровень вложенности
                case 'multilinestring':
                case 'polygon':
                    pcount = jsonobj.coordinates.length;
                    for (var j = 0; j < pcount; j++) {
                        points = this.JSONToPounts(jsonobj.coordinates[j]);
                        if (points) {
                            if (j == 0) {
                                this.points = points;
                             }
                            else {
                                this.addsubject(points);
                            }
                        }
                    }
                    // Раскидать подпись, если она есть
                    this.setText(this.getText());
                    break;

                case 'multipolygon':
                    var subnum = 0, coordinates = jsonobj.coordinates;
                    k = 0;
                    pcount = coordinates.length;
                    for (var j = 0; j < pcount; j++) { // части
                        subcount = coordinates[j].length;
                        for (var i = 0; i < subcount; i++) {    //дырки
                            points = this.JSONToPounts(coordinates[j][i]);
                            if (points) {
                                if (k == 0) {
                                    this.points = points;
                                    this.insideMultipart = -1;
                                }
                                else {
                                    if (i == 0) {
                                        this.addsubject(points, null, -1);
                                        subnum = this.subjects.length;
                                    }
                                    else
                                        this.addsubject(points, null, subnum);
                                }
                                k++;
                            }
                        }
                    }

                    break;

                default:
                    return false;
            }

            this.countpoint = this.points.length;

            return true;

        },


        // Сохранить объект в json
        // noclose - при true не будут замыкаться объеты типа 'polygon' !!!
        saveJSON: function (noclose) {

            if (!this.ischange && this.isGeometryJSON())
                return this.oGeometryJSON;

            // Замкнуть объект, если это полигон
            //var spatialposition = (this.mapobject && this.mapobject.spatialposition) ? this.mapobject.spatialposition.toLowerCase() : this.spatialposition;
            var spatialposition = this.getspatialposition();

            if (!noclose && spatialposition && spatialposition.toLowerCase().indexOf('polygon') >= 0) {
                this.closeobjects(false);
            }

            var newjson = {
                "type": "",
                "coordinates": []
            };
            // newjson.type = this.getJSONspatialposition(this.spatialposition) || '';
            newjson.type = this.getJSONspatialposition(spatialposition) || '';
            if (newjson.type) {

                this.spatialposition = newjson.type.toLowerCase();
                if (this.mapobject)
                    this.mapobject.spatialposition = this.spatialposition;

                if (this.points.length == 0)
                    return newjson;

                this.dimension = 2;

                var points = this.pointsToJSON(0);
                if (!points || points.length == 0)
                    return;


                switch (newjson.type.toLowerCase()) {
                    case 'point':
                        newjson.coordinates = points[0];
                        break;

                    case 'linestring':
                    case 'title':
                    case 'vector':
                        newjson.coordinates = points;
                        break;

                    // case 'title':
                    //     newjson.coordinates = points;
                    //     if (this.subjects.length > 0) {
                    //         for (var j = 0; j < this.subjects.length; j++) {
                    //             points = this.pointsToJSON(j + 1);
                    //             if (points)
                    //                 newjson.coordinates.push(points);
                    //         }
                    //         //this.spatialposition = 'multilinestring';
                    //     }
                    //     break;

                    case 'multipoint':
                        newjson.coordinates = points;
                        for (var j = 0; j < this.subjects.length; j++) {
                            points = this.pointsToJSON(j + 1);
                            if (points && points.length > 0)
                            //                                newjson.coordinates.push(points);
                                newjson.coordinates.push(points[0]);
                        }
                        break;

                    case 'multilinestring':
                    case 'polygon':
                        newjson.coordinates.push(points);
                        for (var j = 0; j < this.subjects.length; j++) {
                            points = this.pointsToJSON(j + 1);
                            if (points)
                                newjson.coordinates.push(points);
                        }
                        break;

                    case 'multipolygon':
                        newjson.coordinates.push([]);
                        newjson.coordinates[0].push(points);
                        this.index = 0;
                        // Сначала сложим основные контура
                        if (this.subjects.length > 0) {
                            // Сначала сложим основные контура
                            //var k = 1;
                            for (var j = 0; j < this.subjects.length; j++) {
                                subject = this.subjects[j];
                                if (subject.insideMultipart < 0) {// Самостоятельный контур
                                    points = this.pointsToJSON(j + 1);
                                    if (points) {
                                        newjson.coordinates.push([]);
                                        k = newjson.coordinates.length - 1;
                                        newjson.coordinates[k].push(points);
                                        // вспомогательный флаг
                                        subject.index = k;
                                    }
                                }
                            }
                            // Теперь пройдемся по дырам
                            for (var j = 0; j < this.subjects.length; j++) {
                                subject = this.subjects[j];
                                if (subject.insideMultipart < 0) // Самостоятельный контур
                                    continue;
                                // найдем родителя
                                var subparent = (subject.insideMultipart == 0) ? this : this.subjects[subject.insideMultipart - 1];
                                // найдем место в coordinates, куда вставить
                                points = this.pointsToJSON(j + 1);
                                if (subparent && points) {
                                    if (!subparent.index) {
                                        subparent.index = 0;
                                    }
                                    newjson.coordinates[subparent.index].push(points);
                                 }
                            }
                        }
                        break;

                }
            }
            this.oGeometryJSON = JSON.parse(JSON.stringify(newjson));
            this.ischange = false;
            return newjson;
        },


        // точки метрики подобъекта в JSON
        // subject - номер подобъекта (c 0)
        pointsToJSON: function (subject) {
            var points = this.getpoints(subject);
            if (!points || points.length == 0)
                return null;
//            var dimension = parseInt(this.dimension);
            var pointsJSON = [];
            for (var i = 0; i < points.length; i++) {
                if (this.dimension == 3) {
                    pointsJSON.push([points[i].y, points[i].x, (points[i].h && !isNaN(points[i].h)) ? points[i].h : 0]);
                }
                else {
                    if ((points[i].h == undefined || isNaN(points[i].h))) {
                        pointsJSON.push([points[i].y, points[i].x]);
                    }
                    else {
                        pointsJSON.push([points[i].y, points[i].x, points[i].h]);
                        this.dimension = 3;
                    }
                }
            }
            return pointsJSON;
        },

        // точки  JSON  в метрику
        // subject - номер подобъекта (c 0)
        JSONToPounts: function (pointsJSON) {
            if (!pointsJSON || pointsJSON.length == 0) return null;
            var points = [];
            for (var i = 0; i < pointsJSON.length; i++) {
                if (pointsJSON[i].length == 2)
                    points.push(new GWTK.Point(pointsJSON[i][1], pointsJSON[i][0]));
                else
                    points.push(new GWTK.Point3D(pointsJSON[i][1], pointsJSON[i][0], pointsJSON[i][2]));
            }
            return points;
        },

        // Добавить точку (c 1)
        // subject - номер подобъекта (c 0)
        appendpoint: function (b, l, subject) {
            //var points = this.getpoints(subject);
            this._appendpoint(b, l, null, this.getpoints(subject).length + 1, subject);
        },

        // Вставить точку (c 1)
        // subject - номер подобъекта (c 0)
        insertpoint: function (b, l, number, subject) {
            this._appendpoint(b, l, null, number, subject);
        },

        // Добавить точку в 3D (c 1)
        // subject - номер подобъекта (c 0)
        appendpoint3D: function (b, l, h, subject) {
            this._appendpoint(b, l, h, this.getpoints(subject).length + 1, subject);
        },

        // Вставить точку в 3D (c 1)
        // subject - номер подобъекта (c 0)
        insertpoint3D: function (b, l, h, number, subject) {
            this._appendpoint(b, l, h, number, subject);
        },

        // Обновить массив точек объекта/подобъекта
        // subject - номер подобъекта (c 0)
        // cut - признак того, что об
        setpoints: function (subject, points) {
            subject = (!subject || subject <= 0) ? 0 : subject;
            if (subject) {
                if (this.subjects.length > 0 && subject <= this.subjects.length) {
                    this.subjects[subject - 1].points = this.clonepoints(0, points);
                    return this.subjects[subject - 1];
                }
                else {
                    this.addsubject();
                    this.subjects[this.subjects.length - 1].points = this.clonepoints(0, points);
                    return this.subjects[this.subjects.length - 1];
                }
            }
            else {
                this.points = this.clonepoints(0, points);
                return this;
            }
        },

        // Запросить массив точек объекта/подобъекта
        // subject - номер подобъекта (c 0)
        getpoints: function (subject) {
            subject = (!subject || subject <= 0) ? 0 : subject;
            if (subject) {
                if (this.subjects.length > 0 && subject <= this.subjects.length)
                    return this.subjects[subject - 1].points;
                else {
                    this.addsubject();
                    return this.subjects[this.subjects.length - 1].points;
                }
            }
            else
                return this.points;
        },

        // Запросить точку  (c 1)
        // subject - номер подобъекта (c 0)
        getpoint: function (number, subject) {
            var point = new GWTK.Point3D();
            var points = this.getpoints(subject);
            if (!points || points.length == 0)
                return point;
            var index = this._indexpoint(number, points);
            if (index >= 0) {
                // return points[index];
                point = new GWTK.Point3D(points[index].x, points[index].y, points[index].h);
            }
            return point;
        },

        // Запросить объект подобъекта
        // возвращает класс geometry подобъекта
        getsubjectgeometry: function (subject) {
            if (!subject || subject <= 0) return this;
            if (subject > this.subjects.length)
                subject = this.subjects.length;
            return this.subjects[subject - 1];
        },

        // Запросить spatialposition
        getspatialposition: function () {
            return (this.mapobject && this.mapobject.spatialposition) ? this.mapobject.spatialposition.toLowerCase() : this.spatialposition;
        },

        // Обновить точку (c 1), если номер точки превышает количество точек, то точка добавляется
        // subject - номер подобъекта (c 0)
        updatepoint: function (number, subject, point) {
            if (!point) return;
            // Если Высота существует
            if (point.h)
                this.dimension = 3;

            subject = (subject) ? subject : 0;
            var points = this.getpoints(subject);
            if (!points) return;

            if (!number || number <= 0 || number > points.length)
                number = -1;
            if (number < 0) {
                this.appendpoint3D(point.x, point.y, point.h, subject);
                return;
            }
            ;

            var oldvalue = points[number - 1].clone();
            points.splice(number - 1, 1, point);
            this.createtrigger('updatepoint', {
                pointnumber: number,
                subject: subject,
                oldvalue: oldvalue,
                newvalue: point
            });
        },

        // Удалить точку
        // number - номер точки (c 1)
        // subject - номер подобъекта (c 0)
        deletepoint: function (number, subject) {
            var points = this.getpoints(subject);
            if (points.length > 0)
                points.splice(number - 1, 1);

            this.createtrigger('deletepoint', {pointnumber: number, subject: subject});

        },

        // Удалить все точки объекта/подобъекта
        // subject - номер подобъекта (c 0)
        deletepoints: function (subject) {
            var points = this.getpoints(subject);
            points.splice(0, points.length);

            this.createtrigger('deletepoints', {subject: subject});

        },

        // Запросить часть метрики объекта/подобъекта, заданные номерами трех точек
        // pnumberoints - массив номеров из 3 точек (номера точек с 1), по которым можно определить направление удаления)
        // например, [2, 1, 9]
        // subject - номер подобъекта (c 0)
        // возвращает объект {
        //              pointsArray:  -- массив из одного/двух массивов с номерами точек (нумерация с 1 в порядке возрастания номеров) объекта/подобъекта
        //              direction: 'forward' или 'back'  -- прямое или обратное направление
        // }
        // например, [[8,9][1,2]]
        getsegment: function (pointsnumber, subject) {
            if (pointsnumber && pointsnumber instanceof Array && pointsnumber.length == 3) {
                var spatialposition = this.getspatialposition();
                if (!spatialposition)
                    return false;
                var isclose = (spatialposition.toLowerCase().indexOf('polygon') >= 0) ? true : false,
                    count = this.count(subject),
                    points = this.getpoints(subject),
                    pointsArray = [], ps1 = [], ps2 = [],
                    direction;

                // Определить направление
                if (pointsnumber[0] < pointsnumber[1] && pointsnumber[1] < pointsnumber[2]) { // прямое
                    isclose = false;
                    for (var k = 0, i = pointsnumber[0] + 1; i < pointsnumber[2]; i++) {
                        ps1[k] = i;
                        k++;
                    }
                    pointsArray.push(ps1);
                    direction = 'forward';
                }
                else {
                    if (pointsnumber[0] > pointsnumber[1] && pointsnumber[1] > pointsnumber[2]) { // обратное
                        isclose = false;
                        k = 0;
                        for (var k = 0, i = pointsnumber[2] + 1; i < pointsnumber[0]; i++) {
                            ps1[k] = i;
                            k++;
                        }
                        pointsArray.push(ps1);
                        direction = 'back';
                    }
                    else {
                        // а теперь разрывы
                        if (isclose && pointsnumber[1] == 1) {
                            pointsnumber[1] = count;
                        }

                        var dF = (pointsnumber[0] < pointsnumber[1] && pointsnumber[1] > pointsnumber[2] && pointsnumber[0] > pointsnumber[2]),
                            dB = (pointsnumber[0] > pointsnumber[1] && pointsnumber[1] < pointsnumber[2] && pointsnumber[0] > pointsnumber[2]);
                        if (dB || dF) { // обратное + млм прямое +
                            //  хвост
                            for (var k = 0, i = pointsnumber[0] + 1; i <= count; i++) {
                                ps1[k] = i;
                                k++;
                            }
                            pointsArray.push(ps1);
                            // начало
                            for (var k = 0, i = 1; i < pointsnumber[2]; i++) {
                                ps2[k] = i;
                                k++;
                            }
                            pointsArray.push(ps2);
                            direction = (dB) ? 'back' : 'forward';
                        }
                        else {
                            dB = (pointsnumber[0] < pointsnumber[1] && pointsnumber[1] > pointsnumber[2] && pointsnumber[0] < pointsnumber[2]),
                                dF = (pointsnumber[0] > pointsnumber[1] && pointsnumber[1] < pointsnumber[2] && pointsnumber[0] < pointsnumber[2]);
                            if (dF || dB) { // прямое + обратное +
                                //  хвост
                                for (var k = 0, i = pointsnumber[2] + 1; i <= count; i++) {
                                    ps1[k] = i;
                                    k++;
                                }
                                pointsArray.push(ps1);
                                // начало
                                for (var k = 0, i = 1; i < pointsnumber[0]; i++) {
                                    ps2[k] = i;
                                    k++;
                                }
                                pointsArray.push(ps2);
                                direction = (dB) ? 'back' : 'forward';
                            }
                        }
                    }
                }

            }

            return {'pointsArray': pointsArray, direction: direction};
        },


        // Удалить часть метрики объекта/подобъекта, заданные номерами трех точек
        // pointsnumber - массив номеров из 3 точек (номера точек с 1), по которым можно определить направление удаления)
        // например, [2, 1, 9]
        // subject - номер подобъекта (c 0)
        // если было удаление хоть отдной точки, возвращает true, иначе false
        deletesegment: function (pointsnumber, subject) {
            var points = this.getpoints(subject),
                spatialposition = this.getspatialposition(),
                isclose = (spatialposition.toLowerCase().indexOf('polygon') >= 0) ? true : false,
                obj = this.getsegment(pointsnumber, subject),
                pointsArray = (obj.pointsArray) ? obj.pointsArray : [];

            if (points && points.length > 0 && pointsArray && pointsArray.length > 0) {
                var isdelete = false;
                for (var j = 0; j < pointsArray.length; j++) {
                    for (var i = pointsArray[j].length - 1; i >= 0; i--) {
                        isdelete = true;
                        points.splice(pointsArray[j][i] - 1, 1);
                    }
                }

                if (isdelete && isclose) {
                    this.closeobject(false, subject);
                }

                if (isdelete) {
                    this.createtrigger('deletesegment', {subject: subject});
                }

                return isdelete;
            }
        },


        // Создать сегмент объекта/подобъекта, заданные номерами трех точек
        // pointsnumber - массив номеров из 3 точек (номера точек с 1), по которым можно определить направление удаления)
        // например, [2, 1, 9]
        // subject - номер подобъекта (c 0)
        // возвращает объект  {mapgeometry: GWTK.mapgeometry или false
        //                     direction:   'forward' или 'back'  -- прямое или обратное направление
        createsegment: function (pointsnumber, subject) {
            var obj = this.getsegment(pointsnumber, subject),
                pointsArray = (obj.pointsArray) ? obj.pointsArray : [],
                count = this.count(subject),
                point;

            if (pointsArray.length > 1 && pointsArray[1].length == 0) {
                pointsArray.splice(1, 1);
            }
            if (count > 1 && pointsArray && pointsArray.length > 0) {
                // Создадим  объект из пришедщих частей

                var len,
                    mapgeometry = new GWTK.mapgeometry(this.map);
                if (mapgeometry.error)
                    return;
                mapgeometry.spatialposition = 'linestring';

                // первая точка
                point = this.getpoint(pointsArray[0][0] - 1, subject);
                if (point) {
                    mapgeometry.appendpoint(point.x, point.y);
                }
                // Середина метрики
                for (var i = 0; i < pointsArray.length; i++) {
                    for (var j = 0; j < pointsArray[i].length; j++) {
                        point = this.getpoint(pointsArray[i][j], subject);
                        mapgeometry.appendpoint(point.x, point.y);
                    }
                }

                // последняя точка
                point = null;
                if (pointsArray.length > 1) {
                    len = pointsArray[1].length - 1;
                    point = this.getpoint(pointsArray[1][len] + 1, subject);
                }
                else {
                    if (pointsArray[0][0] > 1) {// если лежит не первая точка
                        len = pointsArray[0].length - 1;
                        point = this.getpoint(pointsArray[0][len] + 1, subject);
                    }
                }
                if (point) {
                    mapgeometry.appendpoint(point.x, point.y);
                }

                return {'mapgeometry': mapgeometry, 'direction': obj.direction};
            }

        },

        // Сместить часть метрики объекта/подобъекта, заданные номерами трех точек
        // pointsnumber - массив номеров из 3 точек (номера точек с 1), по которым можно определить направление удаления)
        // например, [2, 1, 9]
        // subject - номер подобъекта (c 0)
        // deltageo - Array - массив geoкоординат [b, l]
        // если было смещение хоть одной точки, возвращает true, иначе false
        offsetsegment: function (pointsnumber, subject, deltageo) {
            if (!deltageo || deltageo instanceof Array === false || deltageo.length !== 2)
                return;

            var lenall, len,
                count = this.count(subject),
                points = this.getpoints(subject),
                obj = this.getsegment(pointsnumber, subject),
                pointsArray = (obj.pointsArray) ? obj.pointsArray : [],
                isclose = (this.spatialposition && this.spatialposition.toLowerCase().indexOf('polygon') >= 0) ? true : false;

            if (pointsArray.length > 1 && pointsArray[1].length == 0) {
                pointsArray.splice(1, 1);
            }

            // Создадим новый массив точек, включив крайние
            var newPointsArray = [];
            newPointsArray.push(pointsArray[0].slice());
            newPointsArray[0].splice(0, 0, pointsArray[0][0] - 1);
            if (pointsArray.length > 1) {  //
                len = pointsArray[1].length - 1;
                newPointsArray.push(pointsArray[1]);
                newPointsArray[1].splice(len + 1, 0, pointsArray[1][len] + 1);
            }
            else {
                len = pointsArray[0].length - 1;
                newPointsArray[0].splice(len + 2, 0, pointsArray[0][len] + 1);
            }

            pointsArray = newPointsArray;
            if (points && points.length > 0 && pointsArray && (lenall = pointsArray.length) > 0) {
                var isoffset = false, endpoint, len, number_endpoint,
                    number_firstpoint = pointsArray[0][0],
                    firstpoint = {
                        x: points[number_firstpoint - 1].x,
                        y: points[number_firstpoint - 1].y
                    };

                if (lenall == 1) { // точки берем только с первого массива
                    len = pointsArray[0].length;

                    number_endpoint = pointsArray[0][len - 1];
                    if (isclose && number_endpoint > count) {
                        endpoint = {
                            x: points[0].x,
                            y: points[0].y
                        };
                        number_endpoint--;
                    }
                    else {
                        endpoint = {
                            x: points[number_endpoint - 1].x,
                            y: points[number_endpoint - 1].y
                        };
                    }

                    // Проверяем замкнутость
                    if ((isclose && number_endpoint <= count && number_endpoint <= count) || (!isclose && number_firstpoint > 1 && number_endpoint < count)) {
                        number_endpoint++;
                    }

                }
                else { // первую с с первого массива, последнюю - со второго
                    len = pointsArray[1].length;
                    number_endpoint = pointsArray[1][len - 1];
                    endpoint = {
                        x: points[number_endpoint - 1].x,
                        y: points[number_endpoint - 1].y
                    };
                }

                for (var j = 0; j < lenall; j++) {
                    for (var i = pointsArray[j].length - 1; i >= 0; i--) {
                        isoffset = true;
                        if (points[pointsArray[j][i] - 1]) {
                            points[pointsArray[j][i] - 1].x += deltageo[0];
                            points[pointsArray[j][i] - 1].y += deltageo[1];
                        }
                    }
                }

                // Вставим первую точку
                if (isclose || (!isclose && number_firstpoint > 1)) {
                    // Вставим первую точку
                    this.insertpoint(firstpoint.x, firstpoint.y, number_firstpoint, subject);
                }
                if (isclose || (!isclose && number_endpoint < count)) {
                    // Вставим последнюю точку
                    this.insertpoint(endpoint.x, endpoint.y, number_endpoint + 1, subject);
                }

                if (isoffset) {
                    this.createtrigger('offsetsegment', {subject: subject});
                }

                return isoffset;
            }
        },


        // Обновить часть метрики объекта/подобъекта, заданные номерами трех точек
        // pointsnumber - массив номеров из 3 точек (номера точек с 1), по которым можно определить направление удаления)
        // например, [2, 1, 9]
        // subject - номер подобъекта (c 0)
        // geometry объект  {mapgeometry: GWTK.mapgeometry или false
        //                     direction:   'forward' или 'back'  -- прямое или обратное направление
        updatesegment: function (pointsnumber, subject, geometry) {
            if (!geometry || !geometry.mapgeometry || geometry.mapgeometry.count() == 0) {
                return;
            }

            var points = this.getpoints(subject),
                spatialposition = this.getspatialposition(),
                isclose = (spatialposition.toLowerCase().indexOf('polygon') >= 0) ? true : false,
                obj = this.getsegment(pointsnumber, subject),
                pointsArray = (obj.pointsArray) ? obj.pointsArray : [],
                direction = (obj.direction) ? obj.direction : '';

            if (points && points.length > 0 && pointsArray && pointsArray.length > 0) {
                // удалим точки
                for (var j = 0; j < pointsArray.length; j++) {
                    for (var i = pointsArray[j].length - 1; i >= 0; i--) {
                        // isdelete = true;
                        points.splice(pointsArray[j][i] - 1, 1);
                    }
                }

                // // Вставим точки
                // var number_firstpoint;
                // if (obj.direction == 'forward') {
                //     // Добавим после первой точки
                //     number_firstpoint = pointsArray[0][0];
                //     if (geometry.direction == 'forward') {
                //         for (var i = 0; i < geometry.mapgeometry.points.length; i++) {
                //             point = geometry.mapgeometry.getpoint(i + 1);
                //             this.insertpoint(point.x, point.y, number_firstpoint, subject);
                //             number_firstpoint++
                //         }
                //     }
                //     else {
                //         for (var i = geometry.mapgeometry.points.length - 1; i >= 0; i--) {
                //             point = geometry.mapgeometry.getpoint(i + 1);
                //             this.insertpoint(point.x, point.y, number_firstpoint, subject);
                //             number_firstpoint++
                //         }
                //     }
                // }
                // else {
                //     if (pointsArray.length == 1 || (pointsArray.length == 2 && pointsArray[1].length == 0)) {
                //         number_firstpoint = pointsArray[0][pointsArray[0].length - 1];
                //     }
                //     else {
                //         number_firstpoint = pointsArray[1][pointsArray[1].length - 1];
                //     }
                //
                //     // Добавим после первой, но начиная с конца дополнительной метрики
                //     if (geometry.direction == 'forward') {
                //         for (var i = geometry.mapgeometry.points.length - 1; i >= 0; i--) {
                //             point = geometry.mapgeometry.getpoint(i + 1);
                //             this.insertpoint(point.x, point.y, number_firstpoint, subject);
                //             number_firstpoint++
                //         }
                //     }
                //     else {
                //         for (var i = 0; i < geometry.mapgeometry.points.length; i++) {
                //             point = geometry.mapgeometry.getpoint(i + 1);
                //             this.insertpoint(point.x, point.y, number_firstpoint, subject);
                //             number_firstpoint++
                //         }
                //     }
                // }


                // Вставим точки
                var number_firstpoint;
                if (obj.direction == 'forward') {
                    // Добавим после первой точки
                    number_firstpoint = pointsArray[0][0];
                    if (geometry.direction == 'forward') {
                        for (var i = 0; i < geometry.mapgeometry.points.length; i++) {
                            point = geometry.mapgeometry.getpoint(i + 1);
                            this.insertpoint(point.x, point.y, number_firstpoint, subject);
                            number_firstpoint++
                        }
                    }
                    else {
                        for (var i = geometry.mapgeometry.points.length - 1; i >= 0; i--) {
                            point = geometry.mapgeometry.getpoint(i + 1);
                            this.insertpoint(point.x, point.y, number_firstpoint, subject);
                            number_firstpoint++
                        }
                    }
                }
                else {
                    if (pointsArray.length == 1 || (pointsArray.length == 2 && pointsArray[1].length == 0)) {
                        number_firstpoint = pointsArray[0][pointsArray[0].length - 1];
                    }
                    else {
                        number_firstpoint = pointsArray[1][pointsArray[1].length - 1];
                    }

                    // Добавим после первой, но начиная с конца дополнительной метрики
                    if (geometry.direction == 'forward') {
                        for (var i = geometry.mapgeometry.points.length - 1; i >= 0; i--) {
                            point = geometry.mapgeometry.getpoint(i + 1);
                            this.insertpoint(point.x, point.y, number_firstpoint, subject);
                            number_firstpoint++
                        }
                    }
                    else {
                        for (var i = 0; i < geometry.mapgeometry.points.length; i++) {
                            point = geometry.mapgeometry.getpoint(i + 1);
                            this.insertpoint(point.x, point.y, number_firstpoint, subject);
                            number_firstpoint++
                        }
                    }
                }


                // Замкнем
                if (isclose) {
                    this.closeobject(false, subject);
                }

                this.createtrigger('updatesegment', {subject: subject});
                return true;
            }

        },


        // замкнуть объект/ подобъект
        // update = true - заменив первую точку на последнюю
        //        = false - добавив последнюю точку, равную первой
        // subject - номер подобъекта (c 0)
        closeobject: function (update, subject) {
            // если последняя точка равна первой, ничего не делать
            var points = this.getpoints(subject);
            var count = points.length;
            if (count == 0) return;

            if (points[0].x == points[count - 1].x && points[0].y == points[count - 1].y) {
                if (count < 2) {
                    this._appendpoint(points[0].x, points[0].y, points[0].h, points.length + 1, subject);
                    count = points.length;
                }
                else {
                    return true;
                }
            }

            if (update) {
                if (count < 4) return false;
                points[0] = new GWTK.Point3D(points[count - 1].x, points[count - 1].y, points[count - 1].h);
            }
            else {
                // if (count < 2) return false;
                if (count < 2) {
                    this._appendpoint(points[0].x, points[0].y, points[0].h, points.length + 1, subject);
                }
                this._appendpoint(points[0].x, points[0].y, points[0].h, points.length + 1, subject);
            }

            return true;
        },

        // замкнуть объект со всеми подобъектами
        // update = true - заменив первую точку на последнюю
        //        = false - добавив последнюю точку, равную первой
        closeobjects: function (update) {
            this.closeobject(update);
            for (var i = 0; i < this.subjects.length; i++)
                this.closeobject(update, i + 1);
        },

        // создать копию объекта метрики (mapgeometry - метрика основного объекта)
        createcopy: function (geometry) {
            geometry = (geometry && geometry instanceof GWTK.mapgeometry) ? geometry : this;

            var mapgeometry;
            // Если были изменения и загруженный json, то синхронизировать
            if (geometry.isGeometryJSON() && (!geometry.points || geometry.points.length == 0)) {
                if (geometry.ischange)
                    geometry.saveJSON();
                mapgeometry = new GWTK.mapgeometry(geometry.map);
                if (mapgeometry.error)
                    return;
                mapgeometry.copyFromGeometryJSON(geometry.oGeometryJSON);
                mapgeometry.bbox = geometry.bbox.slice();
                mapgeometry.bboxpixel = geometry.bboxpixel.slice();
            }
            else {
                //var mapgeometry = new GWTK.mapgeometry(geometry.map, geometry.mapobject, geometry.points);
                var mapgeometry = new GWTK.mapgeometry(geometry.map, null, geometry.points);
                if (mapgeometry.error)
                    return;
                mapgeometry.spatialposition = geometry.spatialposition;
                mapgeometry.cut = geometry.cut;
                // mapgeometry.mapobject = geometry.mapobject;

                var geometrysubject;
                for (var i = 0; i < geometry.subjects.length; i++) {
                    geometrysubject = mapgeometry.addsubject(geometry.getpoints(i + 1), null, geometry.subjects[i].insideMultipart);
                    geometrysubject.cut = geometry.subjects[i].cut;
                }
            }

            // Сохраним ошибки
            if (geometry.errors)
                mapgeometry.errors = geometry.errors.clone();

            mapgeometry.mapobject = geometry.mapobject;
            mapgeometry.setText(geometry.getText());

            return mapgeometry;
        },

        // клон точек объекта/подобъекта
        // subject - номер подобъекта (c 0)
        clonepoints: function (subject, points) {
            points = (points) ? points : this.getpoints(subject);
            var newpoints = new Array();
            for (var i = 0; i < points.length; i++)
                newpoints.push(points[i].clone());
           // var newpoints = points.slice();
            return newpoints;
        },

        // добавить(вставить) подобъект (c 1)
        // insideMultipart - номер контура, куда этот п/о входит
        addsubject: function (points, subject, insideMultipart) {
            var polygon = (this.spatialposition && this.spatialposition.indexOf('polygon') >= 0),
                message = '';
            if (polygon) {
                var ret = this.isIntersectionPointsSubjects(points);
                if (ret >= 0) { // Идет пересечение
                    message = w2utils.lang("Crossing of contours") + ': ' + ret + '/';
                    //console.log('GWTK.mapgeometry.addsubject: пересечение контуров, контур не создан.');
                    //return;
                }

                // Если не указано, то проверить
                if (insideMultipart === undefined) {
                    insideMultipart = 0;
                    // Проверим входит ли первая точка в какой-нибудь контур
                    if (points && points.length > 0) {
                        ret = this.isPointInsideSubjects(points[0]);
                        if (ret < 0)  // никому не принадлежит
                            insideMultipart = ret;
                        else {
                            var subsub = this.getsubjectgeometry(ret);
                            if (subsub.insideMultipart >= 0)  // если этот контур уже чья-то дырка, то создадим новый мультиконтур
                                insideMultipart = -1;   // будет новый мультиконтур
                            else
                                insideMultipart = ret;  // будет новая дырка
                        }
                    }
                }
            }
            subject = (!subject || subject <= 0 || subject > this.subjects.length) ? this.subjects.length : subject;
            //            var mapgeometry = new GWTK.mapgeometry(this.map, this.mapobject, points, this.dimension, this.srsName);
            var mapgeometry = new GWTK.mapgeometry(this.map, null, points, this.dimension, this.srsName);
            if (mapgeometry.error) return;
            mapgeometry.spatialposition = this.spatialposition;

            if (polygon)
                mapgeometry.insideMultipart = insideMultipart;
            if (message.length > 0)
                this.errors.add({
                    "classname": "GWTK.mapgeometry",
                    "funcname": "addsubject",
                    "type": "cross",
                    "message": message + parseInt(this.subjects.length + 1).toString()
                });
            this.createtrigger('addsubject', {
                subject: this.subjects.length
            });

            if (subject >= this.subjects.length) {
                this.subjects.splice(subject, 0, mapgeometry); // добавим
                return this.subjects[this.subjects.length - 1];
            }
            else {
                this.subjects.splice(subject - 1, 0, mapgeometry); // вставим
                return this.subjects[subject - 1];
            }
        },

        // обновить подобъект (с 1)
        // Возвращает geometry подобъекта
        updatesubject: function (points, subject) {
            if (!subject || subject <= 0 || subject > this.subjects.length)
                return;
            //var mapgeometry = new GWTK.mapgeometry(this.map, this.mapobject, points, this.dimension, this.srsName);
            var mapgeometry = new GWTK.mapgeometry(this.map, null, points, this.dimension, this.srsName);
            if (mapgeometry.error) return;
            mapgeometry.spatialposition = this.spatialposition;

            this.subjects.splice(subject - 1, 1, mapgeometry);
            return this.subjects[subject - 1];
        },

        // Разрушить объект со всеми подобъектами
        clear: function () {
            this.points.splice(0, this.points.length);
            this.subjects = new Array();
            this.oGeometryJSON = null;
        },

        // Удалить все подобъекты
        deletesubjects: function () {
            this.subjects = new Array();
            this.createtrigger('deletesubjects');
        },

        // Удалить подобъект
        // с 1
        deletesubject: function (subject) {
            if (!subject || subject <= 0 || subject > this.subjects.length)
                return;
            this.subjects.splice(subject - 1, 1);

            this.createtrigger('deletesubject', {
                   subject: subject
            });
        },

        // Сместить координаты объекта (в bl)
        // deltageo = [b, l]
        offsetpoints: function (deltageo) {
            for (var i = 0; i < this.points.length; i++) {
                this.points[i].x += deltageo[0];
                this.points[i].y += deltageo[1];
            }
            if (this.subjects.length > 0) {
                for (var i = 0; i < this.subjects.length; i++) {
                    for (var j = 0; j < this.subjects[i].points.length; j++) {
                        this.subjects[i].points[j].x += deltageo[0];
                        this.subjects[i].points[j].y += deltageo[1];
                    }
                }
            }

            this.createtrigger('offsetpoints');
        },

        // Установить габариты объекта в координатах карты (bbox - порядок координат как в geojson (L, B))
        // и в координатах экрана (boxpixel - порядок координат как на экране (x, y))
        setbbox: function () {
            var geometry, count, place;
            for (var i = 0; i <= this.subjects.length; i++) {
                geometry = this.getsubjectgeometry(i);
                if (!geometry || !geometry.points || (count = geometry.points.length) == 0) {
                    geometry.count();
                    if (!geometry || !geometry.points || (count = geometry.points.length) == 0) {
                        continue;
                    }
                }

                geometry.bbox = [geometry.points[0].y, geometry.points[0].x, geometry.points[0].y, geometry.points[0].x];
                place = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng(geometry.points[0].x, geometry.points[0].y));
                geometry.bboxpixel = [place.x, place.y, place.x, place.y];
                for (var j = 1; j < count; j++) {
                    geometry.bbox[0] = Math.min(geometry.bbox[0], geometry.points[j].y);
                    geometry.bbox[1] = Math.min(geometry.bbox[1], geometry.points[j].x);
                    geometry.bbox[2] = Math.max(geometry.bbox[2], geometry.points[j].y);
                    geometry.bbox[3] = Math.max(geometry.bbox[3], geometry.points[j].x);

                    place = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng(geometry.points[j].x, geometry.points[j].y));
                    geometry.bboxpixel[0] = Math.min(geometry.bboxpixel[0], place.x);
                    geometry.bboxpixel[1] = Math.min(geometry.bboxpixel[1], place.y);
                    geometry.bboxpixel[2] = Math.max(geometry.bboxpixel[2], place.x);
                    geometry.bboxpixel[3] = Math.max(geometry.bboxpixel[3], place.y);
                }
            }
        },


        // Запросить габариты объекта/подобъекта
        // subject - номер подобъекта (c 0)
        // pixel - в координатах экрана
        getbbox: function (subject, pixel) {
            var geometry = this.getsubjectgeometry(subject);
            if (!geometry) return;
            if (pixel)
                return geometry.bboxpixel;
            else
                return geometry.bbox;
        },

        // запросить центр объекта/подобъекта
        // subject - номер подобъекта (c 0)
        // pixel - в координатах экрана
        getcenter: function (subject, pixel) {
            var bbox = this.getbbox(subject, pixel);
            if (!bbox) return;
            return GWTK.point(bbox[0] + (bbox[2] - bbox[0]) / 2, bbox[1] + (bbox[3] - bbox[1]) / 2);
        },


        // Вращение объекта
        // anglevalue - угол в радианах
        // center - центр вращения GWTK.point
        // pixel - true - центр вращения представлен в координатах экрана
        rotate: function (anglevalue, center, pixel) {
            if (!anglevalue)
                return;
            var centerpixel = {};
            if (!center) {
                if (this.bboxpixel.length == 0)
                    this.setbbox();
                centerpixel = this.getcenter(0, true);
            }
            else {
                if (!pixel)
                    centerpixel = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng(center.x, center.y));
                else {
                    centerpixel.x = center.x;
                    centerpixel.y = center.y;
                }
            }

            var angle = anglevalue;
            if (angle > Math.PI) angle = angle - Math.PI * 2;
            var cosA = Math.cos(angle);
            var sinA = Math.sin(angle);
            var geometry, count, coord, pointp, pointgeo, xin, yin, xout, yout;

            for (var i = 0; i <= this.subjects.length; i++) {
                geometry = this.getsubjectgeometry(i);
                if (!geometry) continue;
                count = geometry.points.length;
                for (var j = 0; j < count; j++) {
                    pointp = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng(geometry.points[j].x, geometry.points[j].y));
                    xin = pointp.x - centerpixel.x;
                    yin = pointp.y - centerpixel.y;
                    xout = xin * cosA + yin * sinA + centerpixel.x;
                    yout = yin * cosA - xin * sinA + centerpixel.y;
                    coord = this.map.tiles.getLayersPointProjected(GWTK.point(xout, yout));
                    pointgeo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);

                    geometry.points[j].x = pointgeo[0];
                    geometry.points[j].y = pointgeo[1];
                }
            }
            this.createtrigger('rotate');
        },

        // Масштабирование объекта
        // koeff - коэффициент
        // center - точка, относительно которой идет масштабирование GWTK.point
        // pixel - true - точка, относительно которой идет масштабирование представлена в координатах экрана
        scale: function (koeff, center, pixel) {
            if (!koeff) return;
            var centerpixel = {};
            if (!center) {
                if (this.bboxpixel.length == 0)
                    this.setbbox();
                centerpixel = this.getcenter(0, true);
            }
            else {
                if (!pixel)
                    centerpixel = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng(center.x, center.y));
                else {
                    centerpixel.x = center.x;
                    centerpixel.y = center.y;
                }
            }

            var geometry, count, coord, pointp, pointgeo;
            for (var i = 0; i <= this.subjects.length; i++) {
                geometry = this.getsubjectgeometry(i);
                if (!geometry) continue;
                count = geometry.points.length;
                for (var j = 0; j < count; j++) {
                    pointp = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng(geometry.points[j].x, geometry.points[j].y));
                    //xout = center.x + (pointp.x - center.x) * koeff.x;
                    //yout = center.y + (pointp.y - center.y) * koeff.y;
                    coord = this.map.tiles.getLayersPointProjected(GWTK.point(centerpixel.x + (pointp.x - centerpixel.x) * koeff.x, centerpixel.y + (pointp.y - centerpixel.y) * koeff.y));
                    pointgeo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
                    geometry.points[j].x = pointgeo[0];
                    geometry.points[j].y = pointgeo[1];
                }
            }
            this.createtrigger('scale');
        },


        // Построение окружности с заданным центром и радиусом
        // center (Object GWTK.Point) - центр окружности
        // radius (Float) - радиус
        // pixel (Bool) - центр в координатах экрана,  = true центр и радиус в пикселах, иначе центр в BL, радиус в метрах
        // subject (Int) - подобъект
        createcircle: function (center, radius, pixel, subject) {
            if (!center || center instanceof GWTK.Point == false || !radius) return;
            var TMP = this.map.options.tilematrix;
            var TMPMAXZOOM = this.map.options.maxzoom;
            this.map.options.tilematrix = GWTK.TileMatrixSets[this.map.options.tilematrixset]['scales'].length - 1;
            this.map.options.maxzoom = GWTK.TileMatrixSets[this.map.options.tilematrixset]['scales'].length - 1;
            try {
                var next, nextgeo, coord, koeff, centerpixel, radiuspixel,
                    stepsize = ((koeff = radius * 0.1) >= 1) ? koeff : 1,
                    circlepointcount = parseInt((Math.PI * 2 * radius / stepsize)),
                    dAngle = 2.0 * Math.PI / circlepointcount,
                    pixelSpan = GWTK.tileView.getpixelSpan(this.map.getZoomScale(this.map.options.tilematrix), (this.map.options.crs == 4326)),
                    points = [];

                // Если в BL и в метрах
                if (!pixel) {

                    // Найдем поправочный коэффициент
                    var geo1 = GWTK.toLatLng(center.x, center.y);
                    centerpixel = GWTK.tileView.geo2pixelOffset(this.map, geo1);
                    pixelSpan = GWTK.tileView.getpixelSpan(this.map.getZoomScale(this.map.options.tilematrix), (this.map.options.crs == 4326));
                    // исходный радиус в пикселах
                    radiuspixel = radius / pixelSpan;
                    // Вторая точка в пикселах, чтобы рассчитать поправочный коэффициент на исходный радиус
                    var centerpixel2 = new GWTK.Point(centerpixel.x + radiuspixel, centerpixel.y);
                    coord = this.map.tiles.getLayersPointProjected(centerpixel2);
                    var geo2 = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
                    // Реальный радиус в пикселах, умноженный на поправочный коэффициент
                    radiuspixel = radiuspixel * (radius / geo1.distanceTo(geo2));

                } else {
                    centerpixel = new GWTK.Point(center.x, center.y);
                    radiuspixel = radius;
                }
                if (centerpixel) {
                    for (var i = 0, ang = 0.0; i < circlepointcount; i++, ang += dAngle) {
                        next = new GWTK.Point(radiuspixel * Math.sin(ang) + centerpixel.x, radiuspixel * Math.cos(ang) + centerpixel.y);
                        coord = this.map.tiles.getLayersPointProjected(next);
                        nextgeo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
                        if (nextgeo) {
                            points.push(new GWTK.Point(nextgeo[0], nextgeo[1]));
                        }
                    }
                    if (points.length > 0) {
                        // Если подобъект, то обновить
                        if (subject >= 1) {
                            this.updatesubject(points, subject);
                        } else {
                            this.points = this.clonepoints(0, points);
                        }
                        this.closeobject(false, subject);
                        this.map.options.tilematrix = TMP;
                        this.map.options.maxzoom = TMPMAXZOOM;
                        return true;
                    }
                }
            } catch (e) {
                this.map.options.tilematrix = TMP;
                this.map.options.maxzoom = TMPMAXZOOM;
            }
        },


        // Рассечь линейный объект в точке
        // number - номер точки (c 1)
        // subject - номер подобъекта (c 0)
        cutline: function (number, subject) {
            var points = this.getpoints(subject);
            var pcount = points.length;
            if (pcount == 0) return;

            var index = this._indexpoint(number, points);
            if (index < 0) return;

            // Если замкнутый, то просто рассечь
            var newpoints = new Array();
            if (points[0].x == points[pcount - 1].x && points[0].y == points[pcount - 1].y) {
                // сделаем новую метрику
                for (var i = index; i < pcount - 1; i++)
                    newpoints.push(points[i].clone());
                for (var i = 0; i <= index; i++)
                    newpoints.push(points[i].clone());
                // Закинем новые точки
                this.setpoints(subject, newpoints);
            }
            else { // иначе, создать подобъект
                for (var i = 0; i <= index; i++)
                    newpoints.push(points[i].clone());
                this.setpoints(subject, newpoints).cut = true;
                newpoints = new Array();
                for (var i = index; i < pcount; i++)
                    newpoints.push(points[i].clone());
                this.addsubject(newpoints, subject + 1);
            }
        },

        // изменить направление цифрования объекта/ подобъекта
        // subject - номер подобъекта (c 0)
        changedirection: function (subject) {
            var points = this.getpoints(subject);
            var pcount = points.length;
            if (pcount == 0) return;
            var newpoints = new Array();
            for (var i = pcount - 1; i >= 0; i--)
                newpoints.push(points[i].clone());
            this.setpoints(subject, newpoints);
            this.createtrigger('changedirection', {subject: subject});
        },

        setSrsName: function (srcname) {
            if (!srcname) return;
            this.srsName = srcname;
        },

        // запрос метрики в виде строки для wfs запроса
        // pointnumber - количество точек основного контура, которые нужно положить в строку wfs
        pointsToXmlString: function (jsonGeometry, text, pointnumber) {
            if (this.points.length == 0) {
                if (this.isGeometryJSON())
                    this.loadJSON(this.oGeometryJSON);
                if (this.points.length == 0)
                    return;
            }

            // text = (text) ? text: this.getText();
            var str = '', strcut, strpoints = '', subject, countpoint, title = '', text_title;
            var dimension = parseInt(this.dimension);
            var strresult = new Array();

            //var type = (this.mapobject && this.mapobject.spatialposition) ? this.mapobject.spatialposition : this.spatialposition;
            var type = this.getspatialposition();
            if (!type) {
                return;
            }

            var polygon = (type.toLowerCase().indexOf('polygon') >= 0);
            if (polygon) {
                if (!jsonGeometry)
                    jsonGeometry = this.saveJSON();
                this.closeobject(false);
            }

            switch (type.toLowerCase()) {
                case 'multipolygon':
                    var coordinates = jsonGeometry.coordinates;
                    pcount = coordinates.length;
                    for (var j = 0; j < pcount; j++) {  // полигоны
                        subcount = coordinates[j].length;
                        if (subcount > 0) {
                            str += '<gml:geometryMember>';
                            for (var i = 0; i < subcount; i++) {  // дырки
                                points = this.JSONToPounts(coordinates[j][i]);
                                if (points) {
                                    strpoints = '';
                                    for (var k = 0; k < points.length; k++) {
                                        strpoints += points[k].x.toString().replace(',', '.') + ' ' + points[k].y.toString().replace(',', '.') + ' ';
                                        if (dimension == 3) {
                                            if (points[k].h === undefined)
                                                points[k].h = 0;  // заглушка
                                            strpoints += points[k].h.toString().replace(',', '.') + ' ';
                                        }
                                    }
                                    if (i == 0) {  // полигон

                                        str += '<gml:Polygon srsName="' + this.srsName + '">' +
                                            '<gml:exterior>' +
                                            '<gml:LinearRing>' +
                                            '<gml:posList srsDimension="' + this.dimension + '" count="' + points.length + '">' +
                                            strpoints +
                                            '</gml:posList>' +
                                            '</gml:LinearRing>' +
                                            '</gml:exterior>';
                                    }
                                    else {        // дырка
                                        str +=
                                            '<gml:interior>' +
                                            '<gml:LinearRing>' +
                                            '<gml:posList srsDimension="' + this.dimension + '" count="' + points.length + '">' +
                                            strpoints +
                                            '</gml:posList>' +
                                            '</gml:LinearRing>' +
                                            '</gml:interior>';
                                    }
                                }
                            }
                            str += '</gml:Polygon>';
                            str += '</gml:geometryMember>';
                        }
                    }
                    strresult.push(str);
                    break;

                case 'polygon':
                    var coordinates = jsonGeometry.coordinates;
                    subcount = coordinates.length;
                    for (var i = 0; i < subcount; i++) {  // дырки
                        points = this.JSONToPounts(coordinates[i]);
                        if (points) {
                            strpoints = '';
                            for (var k = 0; k < points.length; k++) {
                                if (pointnumber && k == pointnumber && i == 0)
                                    break;
                                strpoints += points[k].x.toString().replace(',', '.') + ' ' + points[k].y.toString().replace(',', '.') + ' ';
                                if (dimension == 3) {
                                    if (points[k].h === undefined)
                                        points[k].h = 0;  // заглушка
                                    strpoints += points[k].h.toString().replace(',', '.') + ' ';
                                }
                            }
                            if (i == 0) {  // полигон
                                countpoint = (pointnumber) ? pointnumber : points.length;
                                str += '<gml:Polygon srsName="' + this.srsName + '">' +
                                    '<gml:exterior>' +
                                    '<gml:LinearRing>' +
                                    '<gml:posList srsDimension="' + this.dimension + '" count="' + countpoint + '">' +
                                    strpoints +
                                    '</gml:posList>' +
                                    '</gml:LinearRing>' +
                                    '</gml:exterior>';
                            }
                            else {        // дырка
                                str +=
                                    '<gml:interior>' +
                                    '<gml:LinearRing>' +
                                    '<gml:posList srsDimension="' + this.dimension + '" count="' + points.length + '">' +
                                    strpoints +
                                    '</gml:posList>' +
                                    '</gml:LinearRing>' +
                                    '</gml:interior>';
                            }
                        }
                    }
                    str += '</gml:Polygon>';
                    strresult.push(str);
                    break;

                case 'linesrting_geojson':
                    coordinates = jsonGeometry.coordinates;
                    var points = this.JSONToPounts(coordinates);
                    if (points) {
                        strpoints = '';
                        for (k = 0; k < points.length; k++) {
                            if (pointnumber && k == pointnumber && i == 0)
                                break;
                            strpoints += points[k].x.toString().replace(',', '.') + ' ' + points[k].y.toString().replace(',', '.') + ' ';
                            if (dimension == 3) {
                                if (points[k].h === undefined)
                                    points[k].h = 0;
                                strpoints += points[k].h.toString().replace(',', '.') + ' ';
                            }
                        }
                        countpoint = (pointnumber) ? pointnumber : points.length;
                        str = '<gml:LineString srsName="' + this.srsName + '">';
                        str += '<gml:posList srsDimension="' + this.dimension + '" count="' + countpoint + '">' +
                            strpoints +
                            '</gml:posList>';
                        str += '</gml:LineString>';
                        strresult.push(str);
                    }
                    break;
                case 'linestring':
                case 'vector':
                case 'title':
                    for (var i = 0; i < this.points.length; i++) {
                        if (pointnumber && i == pointnumber)
                            break;
                        strpoints += this.points[i].x.toString().replace(',', '.') + ' ' + this.points[i].y.toString().replace(',', '.') + ' ';
                        if (dimension == 3) {
                            if (this.points[i].h === undefined)
                                this.points[i].h = 0;  // заглушка
                            strpoints += this.points[i].h.toString().replace(',', '.') + ' ';
                        }
                    }
                    strpoints = strpoints.slice(0, -1);
                    str = '<gml:LineString srsName="' + this.srsName + '">';

                    if (this.mapobject &&
                        // this.mapobject.spatialposition == 'title' &&
                        text) { // если подпись
                        str += '<gml:name>' + text + '</gml:name>';
                    }

                    countpoint = (pointnumber) ? pointnumber : this.points.length;
                    str += '<gml:posList srsDimension="' + this.dimension + '" count="' + countpoint + '">' +
                        strpoints +
                        '</gml:posList>' +
                        '</gml:LineString>';
                    strresult.push(str);
                    break;

                case 'curve':
                case 'multilinestring':
                    // если объект подвергался рассечению, то все остальные подобъекты сделать самостоятельными
                    for (var i = 0; i < this.points.length; i++) {
                        strpoints += this.points[i].x.toString().replace(',', '.') + ' ' + this.points[i].y.toString().replace(',', '.') + ' ';
                        if (this.dimension == 3) {
                            if (!this.points[i].h)
                                this.points[i].h = 0;  // заглушка
                            strpoints += this.points[i].h.toString().replace(',', '.') + ' ';
                        }
                    }
                    strpoints = strpoints.slice(0, -1);

                    if (this.cut || (!this.cut && this.subjects.length == 0)) { // если резали, то возъмем эту часть как самостоятельную
                        strcut = '<gml:LineString srsName="' + this.srsName + '">';
                        strcut += '<gml:posList srsDimension="' + this.dimension + '" count="' + this.points.length + '">' +
                            strpoints +
                            '</gml:posList>' +
                            '</gml:LineString>';
                        strresult.push(strcut);
                        strpoints = '';
                    }

                    if (strpoints != '') {
                        text_title = this.getText(0);
                        // text_title = this.getText();
                        // if ($.isArray(text_title)) {
                        //     text_title = text_title.join('');
                        // }

                        title = (text_title != undefined) ? '<gml:name>' + text_title + '</gml:name>' : '';
                        str = '<gml:Curve srsName="' + this.srsName + '">' +
                            '<gml:segments>' +
                             title +
                            '<gml:LineStringSegment>' +
                            '<gml:posList  srsDimension="' + this.dimension + '" count="' + this.points.length + '">' +
                                strpoints +
                            '</gml:posList></gml:LineStringSegment>';
                    }
                    if (this.subjects.length > 0) {
                        for (var j = 0; j < this.subjects.length; j++) {
                            strpoints = '';
                            subject = this.subjects[j];
                            if (!subject || subject.points.length == 0)
                                continue;
                            for (var i = 0; i < subject.points.length; i++) {
                                strpoints += subject.points[i].x.toString().replace(',', '.') + ' ' + subject.points[i].y.toString().replace(',', '.') + ' ';
                                if (dimension == 3) {
                                    if (subject.points[i].h === undefined)
                                        subject.points[i].h = 0;  // заглушка
                                    strpoints += subject.points[i].h.toString().replace(',', '.') + ' ';
                                }
                            }
                            if (strpoints.length == 0)
                                continue;
                            strpoints = strpoints.slice(0, -1);
                            if (subject.cut || (!subject.cut && j == this.subjects.length - 1 && str == '')) { // если резали, то возъмем эту часть как самостоятельную
                                strcut = '<gml:LineString srsName="' + this.srsName + '">';
                                strcut += '<gml:posList srsDimension="' + this.dimension + '" count="' + subject.points.length + '">' +
                                    strpoints +
                                    '</gml:posList>' +
                                    '</gml:LineString>';
                                strresult.push(strcut);
                                strpoints = '';
                                continue;
                            }

                            if (strpoints) {
                                text_title = subject.getText(0);
                                title = (text_title != undefined) ? '<gml:name>' + text_title + '</gml:name>' : '';

                                if (str == '') {
                                    str = '<gml:Curve srsName="' + this.srsName + '">' +
                                        '<gml:segments>' +
                                        title +
                                        '<gml:LineStringSegment>' +
                                        '<gml:posList  srsDimension="' + this.dimension + '" count="' + this.points.length + '">' +
                                            strpoints +
                                        '</gml:posList></gml:LineStringSegment>';
                                    continue;
                                }

                                str +=
                                    title +
                                    '<gml:LineStringSegment><gml:posList srsDimension="' + this.dimension + '" count="' + subject.points.length + '">' +
                                    strpoints +
                                    '</gml:posList></gml:LineStringSegment>';
                            }
                        }
                    }

                    if (str && str.indexOf('LineStringSegment') >= 0) {
                        str += '</gml:segments></gml:Curve>';
                        strresult.push(str);
                    }
                    break;

                case 'point':
                    strpoints = this.points[0].x.toString().replace(',', '.') + ' ' + this.points[0].y.toString().replace(',', '.');
                    if (dimension == 3) {
                        if (this.points[0].h === undefined)
                            this.points[0].h = 0;  // заглушка
                        strpoints += ' ' + this.points[0].h.toString().replace(',', '.');
                    }
                    str = '<gml:Point  srsName="' + this.srsName + '">' +
                        '<gml:pos srsDimension="' + this.dimension + '">' + strpoints + '</gml:pos></gml:Point>';
                    strresult.push(str);
                    break;

                case 'multipoint':  // Потом поправить, пока в ГИС карте этого нет
                    break;

            }
            return strresult;
        },

        getJSONspatialposition: function (type) {
            var milti = (this.subjects.length > 0 && this.count(this.subjects.length - 1) > 0) ? true : false;

            if (!type) return;
            switch (type.toLowerCase()) {
                case "polygon":  // полигон
                    // Разобрать polygon или multipolygon
                    if (this.isMultiPoygon())
                        return 'MultiPolygon';
                    return "Polygon";
                case 'linestring':
                    return (milti) ? "MultiLineString" : "LineString";
                case "point":
                    return (milti) ? "MultiPoint" : "Point";
                case "multipolygon":
                    return "MultiPolygon";
                case "multilinestring":
                    return "MultiLineString";
                case "multipoint":
                    return "MultiPoint";
                case "vector":
                default:
                    return type;
            }
        },


        // Добавить/вставить точку c 1
        // number - номер точки с 1, при отсутствии - добавляется в конец
        // subject - номер подобъекта с 0
        _appendpoint: function (b, l, h, number, subject) {
            number = (number) ? number - 1 : 0;
            var points = this.getpoints(subject = (subject) ? subject : 0);
            var point = new GWTK.Point3D(b, l, h);
            points.splice(number, 0, point);
            this.createtrigger('appendpoint', {pointnumber: number + 1, subject: subject, newvalue: point});
        },

        // проверка на возможность удаления точки
        isdeletingpoint: function (subject) {
            var points = this.getpoints(subject);
            //var spatialposition = (this.mapobject && this.mapobject.spatialposition) ? this.mapobject.spatialposition.toLowerCase() : this.spatialposition;
            var spatialposition = this.getspatialposition();

            switch (spatialposition.toLowerCase()) {
                case 'polygon':
                case 'multipolygon':
                    if (points.length <= 4)
                        return false;
                    return true;
                case 'linestring':
                case 'multilinestring':
                    if (points.length <= 2)
                        return false;
                    return true;
                case 'point':
                    return false;
            }
        },

        // проверка на необходимость замыкания объекта, при изменении координат точки
        // number - номер точки c 1
        _isclosing: function (number, subject) {
            //var spatialposition = (this.mapobject && this.mapobject.spatialposition) ? this.mapobject.spatialposition.toLowerCase() : this.spatialposition;
            var spatialposition = this.getspatialposition();

            if (!spatialposition)
                return false;
            if (spatialposition.toLowerCase().indexOf('polygon') >= 0) {
                var points = this.getpoints(subject);
                if (points && (number == points.length || number == 1))
                    return true;
            }
            return false;
        },

        // Индекс реальной точки для запроса метрики
        // number c 1
        // points - массив точек
        // при ошибочном number возвращает 0 или индекс последней точки
        // при отсутствии точек возвращает -1
        _indexpoint: function (number, points) {
            points = (points) ? points : this.getpoints(0);
            if (points.length == 0)
                return -1;
            if (number > points.length) number = points.length - 1;
            if (!number || number <= 0) number = 0;
            else number--;
            return number;
        },

        // Является ли метрика объекта мультиполигоном
        isMultiPoygon: function () {
            for (var j = 0; j < this.subjects.length; j++) {
                subject = this.subjects[j];
                if (subject.insideMultipart < 0)
                    return true;
            }
        },

        // Принадлежит ли точка контуру объекта/подобъекта
        // Если точки совпадают, то принадлежит
        // subject - номер подобъекта (c 0)
        isPointInsideSubject: function (point, subject) {
            var polygon = this.getpoints(subject)
            if (!polygon || polygon.length <= 1)
                return false;

            var intersections_num = 0,
                prev = polygon.length - 1,
                prev_under = polygon[prev].y < point.y,
                cur_under, a, b, t;

            for (var i = 0; i < polygon.length; ++i) {
                // если точки совпадают, то считаем, что входит
                if (polygon[i].equals(point)) {
                    intersections_num = 1;
                    break;
                }
                cur_under = polygon[i].y < point.y;
                a = polygon[prev].subtract(point);
                b = polygon[i].subtract(point);
                t = (a.x * (b.y - a.y) - a.y * (b.x - a.x));
                if (cur_under && !prev_under) {
                    if (t > 0)
                        intersections_num += 1;
                }
                if (!cur_under && prev_under) {
                    if (t < 0)
                        intersections_num += 1;
                }
                prev = i;
                prev_under = cur_under;
            }
            return (intersections_num & 1) != 0;
        },


        // Какому контуру принадлежит точка
        isPointInsideSubjects: function (point) {
            if (!this.subjects || !point) return -1;
            // Массив номеров объектов, куда может попадать
            var indexsubjects = [], sub;
            for (var k = 0; k <= this.subjects.length; k++) {
                if (this.isPointInsideSubject(point, k)) {
                    indexsubjects.push(k);
                }
            }
            // А теперь найдем контур, который является дыркой
            // Если такого нет, то вернем первый из массива
            if (indexsubjects.length > 0) {
                for (var i = 1; i < indexsubjects.length; i++) {
                    sub = this.subjects[indexsubjects[i - 1]];
                    if (sub && sub.insideMultipart >= 0) // является дыркой
                        return -1;
                }
                return indexsubjects[0];
            }

            return -1;
        },


        // Пересекаются ли подобъект c другими подобъектами
        // subject - номер подобъекта (c 0)
        // Возвращает номер первого подобъекта (с 0), с которым имеется пересечение, иначе  -1
        isIntersectionSubjectSubjects: function (subject) {
            if (!this.subjects) return -1;
            var points = this.getpoints(subject);
            for (var k = 0; k <= this.subjects.length; k++) {
                if (subject == k) continue;
                for (var i = 0; i < points.length - 1; i++) {
                    if (this.isIntersectionSegmentSubject(points[i], points[i + 1], k))
                        return k;
                }
            }
            return -1;
        },

        // Пересекаются ли точки c другими подобъектами
        // points  - массив точек
        // Возвращает номер первого подобъекта (с 0), с которым имеется пересечение, иначе  -1
        isIntersectionPointsSubjects: function (points) {
            if (!this.subjects || !points || points.length == 0)
                return -1;
            for (var k = 0; k <= this.subjects.length; k++) {
                for (var i = 0; i < points.length - 1; i++) {
                    if (this.isIntersectionSegmentSubject(points[i], points[i + 1], k))
                        return k;
                }
            }
            return -1;
        },

        // Пересекаются ли отрезок с подобъектом
        // subject - номер подобъекта (c 0)
        isIntersectionSegmentSubject: function (point1, point2, subject) {
            if (!point1 || !point2) return false;
            var points = this.getpoints(subject);
            if (!points || points.length == 0) return false;
            for (var i = 0; i < points.length - 1; i++) {
                if (this._isIntersectionSegments(point1, point2, points[i], points[i + 1]))
                    return true;
            }
            return false;
        },

        // Пересекаются ли отрезки
        _isIntersectionSegments: function (point1, point2, point3, point4) {
            var v1 = (point4.x - point3.x) * (point1.y - point3.y) - (point4.y - point3.y) * (point1.x - point3.x),
                v2 = (point4.x - point3.x) * (point2.y - point3.y) - (point4.y - point3.y) * (point2.x - point3.x),
                v3 = (point2.x - point1.x) * (point3.y - point1.y) - (point2.y - point1.y) * (point3.x - point1.x),
                v4 = (point2.x - point1.x) * (point4.y - point1.y) - (point2.y - point1.y) * (point4.x - point1.x);
            //console.log('v1=' + v1 + ', v2=' + v2 + ', v3=' + v3 + ', v4=' + v4);
            return (v1 * v2 < 0) && (v3 * v4 < 0);
        },

        /**
         * Проверка наличия даныых в oGeometryJSON
         */
        isGeometryJSON: function () {
            return (this.oGeometryJSON && this.oGeometryJSON.coordinates && this.oGeometryJSON.coordinates.length > 0);
        },

        // Инициировать триггер по изменению метрики
        // datapoint = { pointnumber: номер точки c 1, subject:номер подобъекта c 0, oldvalue: старое значение, newvalue: новое значение}
        createtrigger: function (action, datapoint) {
            // Все, кроме текста полписи
            if (action != 'changetext') {
                this.ischange = true;
            }
            $('#' + this.map.eventPane.id).trigger({
                type: 'changegeometry',
                action: action,
                datapoint: datapoint,
                mapgeometry: this,
                mapobject: this.mapobject
            });
        },

        // getText: function(subject){
        //     if (this._text != undefined) {
        //         if (this.spatialposition == 'multilinestring') {
        //             if (subject != undefined) {
        //
        //                 if (subject == 0) {
        //                     return this._text;
        //                 }
        //                 else {
        //                     if (this.subjects[subject]) {
        //                         return this.subjects[subject]._text;
        //                     }
        //                 }
        //             }
        //             else {
        //                 if ($.isArray(this._text)) {
        //                     return this._text;
        //                 }
        //                 var text = [this._text];
        //                 for (var i = 0; i < this.subjects.length; i++) {
        //                     text.push(this.subjects[i]._text);
        //                 }
        //                 return text;
        //             }
        //         }
        //         else {
        //             return this._text;
        //         }
        //     }
        //
        // },
        //
        // setText: function(text){
        //
        //     var oldvalue = this._text;
        //     if (text != undefined) {
        //         // Если это массив, раскидаем по подобъектам
        //         if ($.isArray(text) && text.length == this.subjects.length + 1) {
        //             this._text = text[0];
        //             for(var i = 0; i < this.subjects.length; i++) {
        //                 this.subjects[i]._text = text[i + 1];
        //             }
        //         }
        //         else {
        //             this._text = text;
        //         }
        //     }
        //     else {
        //         this._text = text;
        //     }
        //
        //     if (oldvalue != this._text) {
        //         this.createtrigger('changetext', {
        //             subject: 0,
        //             oldvalue: oldvalue,
        //             newvalue: this._text
        //         });
        //     }
        // }

        getText: function(subject){
            if (this._text) {
               //if (this.spatialposition == 'multilinestring') {
               if (this.subjects && this.subjects.length > 0) {
                    if (subject >= 0) {

                        if (subject == 0) {
                            return this._text;
                        }
                        else {
                            if (this.subjects[subject]) {
                                return this.subjects[subject]._text;
                            }
                        }
                    }
                    else {
                        if ($.isArray(this._text)) {
                            return this._text;
                        }
                        var text = [this._text];
                        for (var i = 0; i < this.subjects.length; i++) {
                            text.push(this.subjects[i]._text);
                        }
                        return text;
                    }
                }
                else {
                    return this._text;
                }
            }

        },

        setText: function(text){

            var oldvalue = this._text;
            this._text = text;
            if (text) {

                // Если это массив, раскидаем по подобъектам
                if ($.isArray(text)) {
                    if (text.length == this.subjects.length + 1) {
                        this._text = text[0];
                        for(var i = 0; i < this.subjects.length; i++) {
                            this.subjects[i]._text = text[i + 1];
                        }
                    }
                }

                if (this.mapobject) {
                    this.mapobject.setSpatialposition();
                }
            }

            if (oldvalue != this._text) {
                this.createtrigger('changetext', {
                    subject: 0,
                    oldvalue: oldvalue,
                    newvalue: this._text
                });
            }
        }

    }

}

