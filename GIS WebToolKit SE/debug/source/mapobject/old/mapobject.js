/*************************************** Соколова Т.О. 05/04/21 ****
 /*************************************** Гиман Н.      29/06/18 ****
 /*************************************** Нефедьева О.  26/03/19 ****
 *                                                                  *
*              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                             Объект слоя                          *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {

    GWTK.mapobject = function(map, gid, maplayerid, geometry, semantic, mapobjects) {
        this.error = true;

        this.toolname = 'mapobject';
        if (!map) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        // Переменные класса
        this.map = map;                 // объект карты
        this.gid = gid;                 // уникальный идентификатор объъекта карты
        this.id = null;                 // id объекта карты
        this.maplayerid = maplayerid;   // id слоя карты (соответствует map.layers[i].options.id)
        this.wmtsId = null;             // id или список id для запроса к сервису SE
        this.maplayername = null;       // имя слоя карты  (соответствует map.layers[i].options.sheet)



        this.objectcenter = null;
        this.code = null;               // код объекта из rsc
        this.key = null;                // ключ объекта из rsc
        this.image = null;              // изображение объекта
        this.name = null;               // название объекта
        this.bbox = null;               // порядок координат как в geojson (L, B)
        this.crs = null;                // код epsg, например - '4326'
        this.classifiername = null;     // имя классификатора

        // Имя слоя объекта из xsd схемы в соответствии с форматом спецификации GML
        // geodesy - ГЕОДЕЗИЧЕСКИЕ ПУНКТЫ,
        // settlements - НАСЕЛЕННЫЕ ПУНКТЫ,
        // infrastructure - ПРОМЫШЛЕННЫЕ И СОЦИАЛЬНЫЕ ОБЪЕКТЫ,
        // roads - ДОРОЖНАЯ СЕТЬ,
        // hydrography - ГИДРОГРАФИЯ,
        // hydraulicStructures - ГИДРОТЕХНИЧЕСКИЕ СООРУЖЕНИЯ
        // relief - РЕЛЬЕФ СУШИ
        // vegetation - РАСТИТЕЛЬНОСТЬ
        // soil - ГРУНТЫ И ЛАВОВЫЕ ПОКРОВЫ
        // boundaries - ГРАНИЦЫ И ОГРАЖДЕНИЯ
        // signatures - НАЗВАНИЯ И ПОДПИСИ
        this.layername = null;

        // Код пространственного местоположения объекта в соответствии с форматом спецификации GML
        // polygon - полигон,
        // poslist - контур,
        // сurve - линейный объект,
        // point - точечный
        this.spatialposition = null;

        // Запрос объекта с сервера
        this.wfsQuery = null;

        this.mapobjects = mapobjects;   // массив объектов, если нужно добавить

        // панель для рисования объекта
        this.overlayPane = null;

        // параметры отрисовки объекта
        this.drw_select = false;

        // json - объект
        this.oJSON = null;

        // xsd схема
        this.rscschema = null;

        // режим сохранения объекта (используется при сохранении нескольких объектов)
        this.saveregime = null;
        this.geometry = (geometry) ? geometry.createcopy() : new GWTK.mapgeometry(this.map, this);  // объект метрики
        this.semantic = (semantic) ? semantic.createcopy() : new GWTK.mapsemantic(this);  // объект семантики
        this.initialize();

        this.error = false;
    };

    GWTK.mapobject.prototype = {

        initialize: function() {
            if (this.map instanceof GWTK.Map == false || !this.gid)
                return this;

            // Установим идентификатор
            this.setgid(this.gid);

            this.setMapLayerData(this.maplayerid);

            return this;
        },


        // Инициализировать данные объекта через http-запрос wfs
        // firstdrawselect - выделить контуром объект
        // objcenter - необязательный параметр, отвечающий за позиционирование объекта
        // ("1" = по центру, "2" - по первой точке, по умолчанию = "2")
        // objframe - запрос габаритов объекта (1 или  0)
        initwfs: function(gid, objcenter, objframe) {
            gid = (gid) ? gid : this.gid;
            // Запросить слой
            if (this.maplayerid) {
                var layer = this.map.tiles.getLayerByxId(this.maplayerid);
                if (layer) {
                    // this.wfsQuery.featureex({
                    //     layers: [{layerid: layer._idLayerXml()}],
                    //     id: gid,
                    //     OUTTYPE: "JSON",
                    //     area: 1,
                    //     length: 1,
                    //     metric: 1,
                    //     semantic: 1,
                    //     mapid: 1,
                    //     objcenter: objcenter,
                    //     getframe: objframe,
                    //     SEMANTICNAME: 1
                    // }, this);

                   // if (!objcenter)
                   //     objcenter = "2";

                    if (this.wfsQuery) { //FIXME:проверить запрос!!!!
                        this.wfsQuery.getFeature({
                            LAYER: layer._idLayerXml(),
                            ID: gid,
                            OUTTYPE: 'JSON',
                            AREA: '1',
                            LENGTH: '1',
                            OBJCENTER: objcenter,
                            GETFRAME: objframe
                        }).then(this.onDataLoaded);
                    }
                }
            }
            // this.wfsQuery.featurebyid(this.gid, this.wmtsId, "JSON", objcenter, "1", "1", objframe);

        },

        // Загрузить данные из json, всегда загружается первый объект
        loadJSON: function(jsonobj, mapobjectAttr) {

            if (!jsonobj || !jsonobj.type || jsonobj.type != "FeatureCollection" || !jsonobj.features || jsonobj.features.length == 0)
                return false;

            this.oJSON = JSON.parse(JSON.stringify(jsonobj));
            if (this.oJSON.bbox)
                this.bbox = [this.oJSON.bbox[0], this.oJSON.bbox[1], this.oJSON.bbox[2], this.oJSON.bbox[3]];
            if (this.oJSON.features[0].bbox)
                this.bbox = [this.oJSON.features[0].bbox[0], this.oJSON.features[0].bbox[1], this.oJSON.features[0].bbox[2], this.oJSON.features[0].bbox[3]];
            else{
                if (this.bbox) {
                    this.oJSON.features[0].bbox = [this.bbox[0], this.bbox[1], this.bbox[2], this.bbox[3]];
                }
            }

            this.gid = this.id = this.oJSON.features[0].properties.id;
            this.rscschema = this.oJSON.features[0].properties.schema;        // название схемы
            this.code = this.oJSON.features[0].properties.code;               // код объекта из rsc
            this.key = this.oJSON.features[0].properties.key;                 // ключ объекта из rsc
            this.name = this.oJSON.features[0].properties.name;               // название объекта
            this.layername = this.oJSON.features[0].properties.layerid;       // идентификатор слоя классифиатора в хsd схеме
            if (this.oJSON.features[0].properties.objectcenterx)
                this.objectcenter = GWTK.toLatLng(this.oJSON.features[0].properties.objectcenterx, this.oJSON.features[0].properties.objectcentery);
            if (this.oJSON.features[0].properties.objectfirstpointx)
                this.objectcenter = GWTK.toLatLng(this.oJSON.features[0].properties.objectfirstpointx, this.oJSON.features[0].properties.objectfirstpointy);
            // Если нет центра, то посчитать по габаритам
            if (!this.objectcenter && this.bbox) {
                //this.objectcenter = GWTK.toLatLng(this.bbox[0] + (this.bbox[2] - this.bbox[0]) / 2, this.bbox[1] + (this.bbox[3] - this.bbox[1]) / 2);
                this.objectcenter = GWTK.toLatLng(this.bbox[1] + (this.bbox[3] - this.bbox[1]) / 2, this.bbox[0] + (this.bbox[2] - this.bbox[0]) / 2);
            }

            this.arealoaded = this.oJSON.features[0].properties.area;
            this.perimeterloaded = this.oJSON.features[0].properties.perimeter;
            this.wmtsId = this.oJSON.features[0].properties.mapid;            // идентификатор слоя карты в АП сервисе

            // Заполним недостающие переменные класса (для возможности сохранения объекта)
            var l = this.map.tiles.getLayerByGmlId(this.gid);
            if (!this.wmtsId) { // Если нет wmtsId, попробуем его определить
                if (l)
                    this.wmtsId = this.map.tiles.getIdServiceByLayer(l);
            }
            if (!this.maplayerid && l) {
                this.maplayerid = l.xId;
            }

            // Обновление id слоя (если есть typeNames или codeList)
            if (this.code) {
                var i, len = this.map.layers.length;
                for (i = 0; i < len; i++) {
                    if (!this.map.layers[i] ||
                        (!this.map.layers[i].typeNames && !this.map.layers[i].codeList))
                        continue;
                    var lt, ll;
                    // Сначала по typeNames
                    if (this.map.layers[i].typeNames) {
                        if (this.map.layers[i].typeNames.indexOf(this.layername) >= 0) {
                            lt = this.map.layers[i].xId;
                        }
                    }

                    if (this.map.layers[i].codeList) {
                        if (this.map.layers[i].codeList.indexOf(this.code) >= 0) {
                            ll = this.map.layers[i].xId;
                        }
                    }

                    if (lt) {
                        this.maplayerid = lt;
                        break;
                    }else{
                        if (ll) {
                            this.maplayerid = ll;
                            break;
                        }
                    }
                }
            }


            // Заполнить метрику и семантику, если надо
            if (mapobjectAttr) {

                // Загрузим метрику
                if (this.geometry.copyFromGeometryJSON(this.oJSON.features[0].geometry)) {
                    this.spatialposition = this.geometry.spatialposition;
                    var geometry = this.oJSON.features[0].geometry;
                    if (!this.objectcenter && geometry.type.toLowerCase() == 'point' && geometry.coordinates.length > 0)
                        this.objectcenter = GWTK.toLatLng(geometry.coordinates[1], geometry.coordinates[0]);
                    // Если не было bbox в метрике, то посчитать реальный
                    if (!this.oJSON.features[0].bbox)
                        this.setbbox();
                }

                // Загрузим семантику
                this.semantic.loadJSON(this.oJSON.features[0].properties);

                // Графическое изображение
                if (this.oJSON.features[0]['style']) {

                    // var options = {
                    //     type: (this.code) ? this.code.toLowerCase() : this.key.toLowerCase(),
                    //     options: [this.oJSON.features[0]['style']]
                    // }
                    // TODO: Если draw объект на слое АП сервися, то заполнить еще ключ слоя класификатора, в котором этот объект лежит
                    // options.classifierLayer = this....

                    this.graphic = GWTK.MapeditLegendGraphicControl.prototype.setOptionsFromStyle(this.spatialposition, { 'style': this.oJSON.features[0]['style'] });
                }
            }
            return true;
        },

        // Сохранить объект в json
        saveJSON: function() {

            var newjson = {
                "type": "FeatureCollection",
                "features": [{ "type": "Feature" }]
            };

            if (!this.bbox)
                this.setbbox();

            if (this.bbox) {
                newjson.bbox = newjson.features[0].bbox = this.bbox;
            }

            // Отдельно пройдемся по подписям
            var text = this.geometry.getText();
            if (this.geometry) {
                newjson.features[0].geometry = this.geometry.saveJSON();
            }

            // Заполним наименование объекта, есл его нет
            var layer = this.map.tiles.getLayerByxId(this.maplayerid);
            if (!this.name) {
                if (layer && layer instanceof GWTK.graphicLayer) {
                    var sample = layer.getSemByObjKey(this.code);
                    if (sample) {
                        this.name = sample["name"];
                    }
                }
            }
            newjson.features[0].properties =
                {
                    "id": this.gid,
                    "layer": this.rsclayer,
                    "schema": this.rscschema,
                    "code": this.code,
                    "key": this.key,
                    "name": this.name,
                    "semantics": []
                };

            if (this.layername) {
                newjson.features[0].properties.layerid = this.layername;
            }
            if (text != undefined) {
                newjson.features[0].properties['title'] = text;
            }

            // Если определен слой сервиса, то его тоже сохраним
            if (this.wmtsId)
                newjson.features[0].properties.mapid = this.wmtsId;

            // идентификатор слоя карты в АП сервисе
            if (this.wmtsId) { // Если нет wmtsId, попробуем его определить
                var l = this.map.tiles.getLayerByGmlId(this.gid);
                if (l)
                    this.wmtsId = this.map.tiles.getIdServiceByLayer(l);
            }

            // Семантика
            if (this.semantic && this.semantic.semantics && this.semantic.semantics.length > 0) {
                this.semantic.saveJSON(newjson.features[0].properties.semantics);

                // Подменим text на title, если это графика
                if (layer && layer instanceof GWTK.graphicLayer) {
                    if (newjson.features[0].properties['text'] && newjson.features[0].properties['title']) {
                        newjson.features[0].properties['text'] = newjson.features[0].properties['title'];
                    }
                }
            }

            // Графическое изображение
            if (this.graphic) {
                var _graphic = GWTK.MapeditLegendGraphicControl.prototype.createGraphicObjectFromJSON(this.graphic);
                if (_graphic) {
                    newjson.features[0].style = _graphic.setStyleObject(this.graphic);
                }
            }

            this.oJSON = JSON.parse(JSON.stringify(newjson));
            return this.oJSON;
        },


        /**
         * Создание клона объекта
         * @returns {*|GWTK.mapobject}
         */
        clone: function() {
            return this.createcopy(this);
        },

        // Создать копию объекта
        createcopy: function(mapobject) {
            if (!mapobject || mapobject instanceof GWTK.mapobject == false) return;

            var copy = new GWTK.mapobject(mapobject.map, mapobject.gid, mapobject.maplayerid, mapobject.geometry, mapobject.semantic);
            if (copy.error) return;

            // назначить графическое изображение на объект
            if (mapobject.graphic) {
                copy.graphic = JSON.parse(JSON.stringify(mapobject.graphic));
            }

            if (!mapobject.gid || mapobject.gid == "0") {
                copy.id = "0";
            }
            if (mapobject.gid_svg) {
                copy.gid_svg = mapobject.gid_svg;
            }
            copy.maplayername = mapobject.maplayername;
            copy.code = mapobject.code;                         // код объекта из rsc
            copy.key = mapobject.key;                           // ключ объекта из rsc
            copy.name = mapobject.name;                         // название объекта
            copy.bbox = mapobject.bbox;
            copy.crs = mapobject.crs;                           // код epsg, например - '4326'
            copy.classifiername = mapobject.classifiername;     // имя классификатора
            copy.layername = mapobject.layername;
            copy.spatialposition = mapobject.spatialposition;
            copy.wmtsId = mapobject.wmtsId;
            copy.rscschema = mapobject.rscschema;               // название схемы
            copy.layername = mapobject.layername;               // идентификатор слоя классифиатора в хsd схеме
            copy.objectcenter = mapobject.objectcenter;
            copy.arealoaded = mapobject.arealoaded;
            copy.perimeterloaded = mapobject.perimeterloaded;
            copy.saveregime = mapobject.saveregime;
            if (mapobject.spatialposition) {
                copy.geometry.spatialposition = mapobject.spatialposition;
            }

            if (mapobject.geometry.ischange || mapobject.semantic.ischange) {
                // copy.oJSON = mapobject.saveJSON();
                copy.oJSON = copy.saveJSON();
            }else{
                copy.oJSON = JSON.parse(JSON.stringify(mapobject.oJSON));
            }

            return copy;
        },


        // Создать копию только для отрисовки
        createcopyForDraw: function(mapobject) {
            if (!mapobject || mapobject instanceof GWTK.mapobject == false) return;

            // var copy = new GWTK.mapobject(mapobject.map, mapobject.gid, mapobject.maplayerid, mapobject.geometry, mapobject.semantic);
            var copy = new GWTK.mapobject(mapobject.map, mapobject.gid, mapobject.maplayerid);
            if (copy.error) return;

            // назначить графическое изображение на объект
            if (mapobject.graphic) {
                copy.graphic = JSON.parse(JSON.stringify(mapobject.graphic));
            }

            if (!mapobject.gid || mapobject.gid == "0") {
                copy.id = "0";
            }
            if (mapobject.gid_svg) {
                copy.gid_svg = mapobject.gid_svg;
            }
            copy.maplayername = mapobject.maplayername;
            copy.code = mapobject.code;                         // код объекта из rsc
            copy.key = mapobject.key;                           // ключ объекта из rsc
            copy.name = mapobject.name;                         // название объекта
            copy.bbox = mapobject.bbox;
            copy.crs = mapobject.crs;                           // код epsg, например - '4326'
            copy.classifiername = mapobject.classifiername;     // имя классификатора
            copy.layername = mapobject.layername;
            copy.spatialposition = mapobject.spatialposition;
            copy.wmtsId = mapobject.wmtsId;
            copy.rscschema = mapobject.rscschema;               // название схемы
            copy.layername = mapobject.layername;               // идентификатор слоя классифиатора в хsd схеме
            copy.objectcenter = mapobject.objectcenter;
            copy.arealoaded = mapobject.arealoaded;
            copy.perimeterloaded = mapobject.perimeterloaded;
            copy.saveregime = mapobject.saveregime;
            if (mapobject.spatialposition) {
                copy.geometry.spatialposition = mapobject.spatialposition;
            }

            if (mapobject.geometry.ischange || mapobject.semantic.ischange) {
                // copy.oJSON = mapobject.saveJSON();
                copy.oJSON = copy.saveJSON();
            }else{
                copy.oJSON = JSON.parse(JSON.stringify(mapobject.oJSON));
            }

            return copy;

        },

        // установить уникальный идентификатор объекта
        setgid: function(gid) {
            var gmldata = GWTK.Util.parseGmlId(gid);
            if (gmldata && gmldata.sheet && gmldata.objid) {
                this.gid = gid;
                this.maplayername = gmldata.sheet;
                this.id = gmldata.objid;
            }
        },


        /**
         * Заполнение данных, относящихся к слою карты
         * @param maplayerid - идентификатор слоя карты (соответствует map.layers[i].options.id)
         */
        setMapLayerData: function(maplayerid) {

            if (!maplayerid) {
                return;
            }

            // Найдем слой по this.maplayerid
            var layer = this.map.tiles.getLayerByxId(maplayerid);
            // Найдем сервер
            if (layer && layer instanceof GWTK.graphicLayer == false) {
                this.srv = GWTK.Util.getServerUrl(layer.options.url);
            }
            // Найдем слой на сервере
            if (layer) {
                this.maplayerid = maplayerid;
                this.wmtsId = GWTK.Util.getParamsFromURL(layer.options.url);

                if ('layer' in this.wmtsId)
                    this.wmtsId = this.wmtsId.layer;
                else{
                    if ('layers' in this.wmtsId) this.wmtsId = this.wmtsId.layers;
                }

                // Установим название слоя карты (имя карты из паспорта слоя)
                // иcпользуется при формировании gid объекта слоя
                if (layer && layer.mapSheets && layer.mapSheets.sheets && layer.mapSheets.sheets.length > 0) {
                    this.maplayername = layer.mapSheets.sheets[0];
                }else{
                    this.maplayername = layer.id;
                }
            }

            if (this.srv) {
                // this.wfsQuery = new WfsQueries(this.srv, this.map);
                // this.wfsQuery.onDataLoad = this.onDataLoaded;
                const httpParams = GWTK.RequestServices.createHttpParams(this.map, { url: this.srv })
                this.wfsQuery = GWTK.RequestServices.retrieveOrCreate(httpParams, 'REST');
            }
        },

        // Установить габариты объекта в координатах карты (bbox - порядок координат как в geojson (L, B))
        // и в координатах экрана (boxpixel - порядок координат как на экране (x, y))
        setbbox: function() {
            if (!this.geometry) return;
            this.geometry.setbbox();
            this.bbox = [this.geometry.bbox[0], this.geometry.bbox[1], this.geometry.bbox[2], this.geometry.bbox[3]],
                this.bboxpixel = [this.geometry.bboxpixel[0], this.geometry.bboxpixel[1], this.geometry.bboxpixel[2], this.geometry.bboxpixel[3]];
            var geometry, count, place;
            for (var i = 1; i <= this.geometry.subjects.length; i++) {
                geometry = this.geometry.getsubjectgeometry(i);
                if (geometry.count() == 0)
                    continue;
                if (!geometry || !geometry.bbox || !geometry.bboxpixel)
                    continue;
                this.bbox[0] = Math.min(geometry.bbox[0], this.bbox[0]);
                this.bbox[1] = Math.min(geometry.bbox[1], this.bbox[1]);
                this.bbox[2] = Math.max(geometry.bbox[2], this.bbox[2]);
                this.bbox[3] = Math.max(geometry.bbox[3], this.bbox[3]);
                this.bboxpixel[0] = Math.min(geometry.bboxpixel[0], this.bboxpixel[0]);
                this.bboxpixel[1] = Math.min(geometry.bboxpixel[1], this.bboxpixel[1]);
                this.bboxpixel[2] = Math.max(geometry.bboxpixel[2], this.bboxpixel[2]);
                this.bboxpixel[3] = Math.max(geometry.bboxpixel[3], this.bboxpixel[3]);
            }
        },

        // запросить центр объекта
        // pixel - в координатах экрана
        getcenter: function(pixel) {
            var bbox = this.getbbox(pixel);
            if (!bbox) return;
            return GWTK.point(bbox[0] + (bbox[2] - bbox[0]) / 2, bbox[1] + (bbox[3] - bbox[1]) / 2);
        },

        // Запросить габариты объекта
        // pixel - в координатах экрана
        getbbox: function(pixel) {
            if (pixel)
                return this.bboxpixel;
            else
                return this.bbox;
        },

        // обработчик ответа сервера
        onDataLoaded: function(response, context) {
            if (response == undefined || response == null || context == undefined || context == null)
                return;
            var mapobject = context;
            mapobject.loaddata(response);

            // триггер на события клика на карту Соколова
            //var mapdiv = document.getElementById('mapPane');
            //if (mapdiv)
            var eventPanelId = context.map.eventPane.id;
            $('#' + eventPanelId).trigger({
                type: 'mapobjectloadWfs',
                layer: mapobject.maplayerid,
                gid: mapobject.gid
            });
        },

        // загрузка данных
        loaddata: function(response) {
            // Если это не JSON, то будем считать, что это xml
            response = response.replace(/\r|\n/g, '');  // Николай
            try {
                var obj = JSON.parse(response);
                this.loadJSON(obj, true);
                //                return;
            } catch (err) {
                if (window.console) console.log(err + ", 'это не JSON");

                var xmlDoc = $.parseXML(response);
                var xml = $(xmlDoc);
                if (!xml) return ["wfs_featurecollection", ""];
                var elem = xml.context.documentElement.nodeName.toLowerCase();
                if (elem.indexOf('featurecollection') == -1)
                    return ["wfs_featurecollection", ""];
                var elem = xml.context.documentElement.childNodes;
                if (elem == null || elem == undefined || elem.length == 0)
                    return ["wfs_featurecollection", ""];

                var gid = null;
                var classifiername = null;

                var const1 = '<wfs:member>', const2 = '</wfs:member>';
                var index1 = response.indexOf(const1);
                var index2 = response.indexOf(const2);

                var elem1, elem2, elem3, elem4, elem5, i, j, ii, jj;
                for (i = 0; i < elem.length; i++) {
                    elem1 = elem[i];
                    switch (elem1.nodeName.toLowerCase()) {
                        case "wfs:member":
                            elem2 = elem1.childNodes;
                            if (elem2 == null || elem2 == undefined || elem2.length == 0)
                                continue;
                            for (j = 0; j < elem2.length; j++) {
                                this.loadobjectXmlElem(elem2[j]); // Загрузить элемент объекта
                            }
                            break;

                        case "wfs:boundedby":
                            break;
                    }
                }
            }

            // Только отрисовка, объект уже существует
            if (this.waitdrawobject) {
                if (this.waitdrawobject.spatialposition == 'point' && this.map.markVisible == false || this.waitdrawobject.spatialposition != 'point') {
                    this.waitdrawobject._drawcontour(this.mapdiv);
                }
                this.waitdrawobject = null;
                return;
            }

            if (this.mapobjects) {
                var _that = this,
                    find = this.mapobjects.find(
                        function(element, index, array) {
                            if (element.gid == _that.gid)
                                return element;
                        });
                if (!find)
                    this.mapobjects.splice(this.mapobjects.length, 0, this);
                //if (window.console)
                //    console.log("Загружен объект:" + this.mapobjects.length.toString());
            }

        },

        // загрузка объекта из xml элемента
        loadobjectXmlElem: function(elem) {
            if (elem == null || elem == undefined || elem.length == 0)
                return;

            // центр объекта
            var objcenter = $(elem).find('ObjectFirstPoint');
            if (objcenter.length == 0) {
                objcenter = $(elem).find('ObjectCenter');
            }
            if (objcenter.length > 0) {
                var coord = $(objcenter).text().split(' ');
                if (coord.length == 2) {
                    this.objectcenter = GWTK.toLatLng(coord);
                }
            }

            var ischema, attr = elem.attributes;
            if (attr && attr.length > 0) {
                for (var ia = 0; ia < attr.length; ia++) {
                    if (attr[ia].nodeName.toLowerCase() == "gml:id") {
                        ischema = elem.nodeName.indexOf(":");
                        if (ischema >= 0) {
                            this.rscschema = elem.nodeName.substring(0, ischema);
                            break;
                        }
                    }
                }
            }
            var area = $(elem).find('Area');
            var perimeter = $(elem).find('Perimeter');
            var bbox = $(elem).find('ObjectFrame');
            if (area.length == 1 && area.text().length > 0) {
                this['arealoaded'] = parseFloat(area.text());
            }
            if (perimeter.length == 1 && perimeter.text().length > 0) {
                this['perimeterloaded'] = parseFloat(perimeter.text());
            }
            if (bbox.length == 1 && bbox.text().length > 0) {
                this['bboxloaded'] = bbox.text().split(', ');
                if (this['bboxloaded'] && this['bboxloaded'].length == 4) {
                    this.bbox = [parseFloat(this['bboxloaded'][1]), parseFloat(this['bboxloaded'][0]), parseFloat(this['bboxloaded'][3]), parseFloat(this['bboxloaded'][2])];
                    var place = [
                        GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng(this.bbox[1], this.bbox[0])),
                        GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng(this.bbox[3], this.bbox[2]))
                    ];
                    this.bboxpixel = [Math.min(place[0].x, place[1].x), Math.min(place[0].y, place[1].y), Math.max(place[0].x, place[1].x), Math.max(place[0].y, place[1].y)];
                }
            }
            var name = elem.nodeName;//.toLowerCase();
            elem = elem.childNodes;
            if (elem == null || elem == undefined || elem.length == 0)
                return;
            var elem1, i;
            if (name.indexOf(this.rscschema) >= 0) {  // начался объект
                var mass = name.split(':');
                if (mass.length >= 1)
                    this.layername = mass[1];

                for (i = 0; i < elem.length; i++) {
                    elem1 = elem[i];
                    // Код объекта из классификатора
                    if (elem1.nodeName.toLowerCase() == this.rscschema.toLowerCase() + ':' + (this.layername + 'code').toLowerCase()) {
                        this.code = this.loadtextXmlElem(elem1);
                    }else{
                        switch (elem1.nodeName.toLowerCase()) {
                            case "gml:name":
                                this.name = this.loadtextXmlElem(elem1);
                                break;
                            case "sld":
                                this.graphic = this.loadSldXmlElem(elem1);
                                break;
                            default:
                                this.loadspatialpositionXmlElem(elem1);
                                break;
                        }
                    }
                }
            }


            if (this.graphic && this.graphic.type == 'title') {
                this.graphic.text = (this.geometry) ? this.geometry.getText() : '';
            }

        },

        loadtextXmlElem: function(elem) {
            if (elem == null || elem == undefined || elem.length == 0)
                return;
            var text = $(elem).text();
            return text;
        },

        loadattrXmlElem: function(elem, attrname) {
            if (elem == null || elem == undefined || elem.length == 0)
                return;
            var elem1 = elem.attributes;
            if (elem1 == null || elem1 == undefined || elem1.length == 0)
                return;
            for (var i = 0; i < elem1.length; i++) {
                if (elem1[i].nodeName.toLowerCase() == attrname)
                    return elem1[i].nodeValue;
            }
        },

        loadspatialpositionXmlElem: function(elem, isMulti, subjectMulti) {
            if (elem == null || elem == undefined || elem.length == 0)
                return;
            var name = elem.nodeName.toLowerCase();
            this.geometry.setSrsName(this.loadattrXmlElem(elem, "srsname"));
            var elem1, mass, text, sem, val;
            switch (name) {
                case "gml:polygon":  // полигон
                    //this.spatialposition = this.geometry.spatialposition = "polygon";
                    this.spatialposition = this.geometry.spatialposition = (!isMulti) ? "polygon" : "multipolygon";
                    elem1 = elem.childNodes;
                    // var subject = 0;
                    var subject = (!isMulti) ? 0 : ((this.geometry.subjects && this.geometry.subjects.length > 0) ? this.geometry.subjects.length + 1 : subjectMulti),
                        insideMultipart;
                    for (var i = 0; i < elem1.length; i++) {
                        if (elem1[i].nodeName.toLowerCase() == "gml:exterior") {  // основной объект
                            this.loadgeometryXmlElem(elem1[i].childNodes, subject);
                            if (isMulti) {
                                if (subject > 0) {
                                    this.geometry.subjects[subject - 1].insideMultipart = -1; // Отметить как самостоятельный контур
                                    insideMultipart = subject;
                                }else{
                                    insideMultipart = 0;
                                }
                            }
                        }
                        if (elem1[i].nodeName.toLowerCase() == "gml:interior") {  // подобъект
                            subject++;
                            this.loadgeometryXmlElem(elem1[i].childNodes, subject);
                            if (isMulti) {
                                this.geometry.subjects[subject - 1].insideMultipart = insideMultipart;
                            }
                        }
                    }
                    break;
                case "gml:linestring":  // контур
                    this.spatialposition = this.geometry.spatialposition = "linestring";
                    var data = this.loadsinglegeometryXmlElem(elem);
                    if (data) {
                        this.loadpoints(data, 0, this.geometry.dimension, this.geometry.countpoint);
                    }
                    break;
                case "gml:curve":  // линейный объект с подобъектами
                    this.spatialposition = this.geometry.spatialposition = "curve";
                    elem1 = elem.childNodes;
                    var subject = 0;
                    for (var i = 0; i < elem1.length; i++) {
                        if (elem1[i].nodeName.toLowerCase() == "gml:exterior") {  // основной объект
                            this.loadgeometryXmlElem(elem1[i].childNodes, 0);
                            subject++;
                        }else{
                            if (elem1[i].nodeName.toLowerCase() == "gml:interior") {  // подобъект
                                // subject++;
                                this.loadgeometryXmlElem(elem1[i].childNodes, subject);
                                subject++;
                            }else{
                                if (elem1[i].nodeName.toLowerCase() == "gml:segments") {  // мультиконтур
                                    this.spatialposition = this.geometry.spatialposition = "multilinestring";
                                    var newsubject = this.loadgeometryXmlElem(elem1[i].childNodes, subject);
                                    subject = newsubject;
                                }
                            }
                        }
                    }
                    break;
                case "gml:point":
                    this.spatialposition = this.geometry.spatialposition = "point";
                    var data = this.loadsinglegeometryXmlElem(elem);
                    if (data) {
                        this.loadpoints(data, 0, this.geometry.dimension, this.geometry.countpoint);
                    }
                    break;
                case "gml:multigeometry":  // В PANORAME ПРИРАВНИВАЕТСЯ к MULTIPOLYGON
                    elem1 = elem.childNodes;
                    for (var i = 0; i < elem1.length; i++) {
                        if (elem1[i].nodeName.toLowerCase() == 'gml:geometrymember') {  // основной объект
                            this.loadspatialpositionXmlElem(elem1[i].firstChild, true, i);
                            // return;
                        }
                    }
                    return;
                default:  // будем считать, что это семантика
                    text = elem.nodeName;
                    if (text.indexOf(this.rscschema + ":") >= 0) {
                        mass = text.split(':');
                        if (mass && mass.length > 1)
                            val = this.loadtextXmlElem(elem);
                        sem = {
                            'shortname': mass[1],
                            'value': val,
                            'textvalue': val,
                            'name': this.loadattrXmlElem(elem, 'name')
                        };
                        this.semantic.semantics.push(sem);
                    }
            }

        },

        // Загрузить данные метрики из xml - элемента
        loadsinglegeometryXmlElem: function(elem) {
            if (elem == null || elem == undefined || elem.length == 0)
                return;
            var name = elem.nodeName.toLowerCase();
            var elem1, elem2, i, j;

            switch (name) {
                case "gml:linestring":
                case "gml:linearring":
                case "gml:point":
                case "gml:linestringsegment":
                    // началась метрика
                    elem1 = elem.childNodes;
                    var text = '';
                    for (i = 0; i < elem1.length; i++) {
                        if (elem1[i].nodeName.toLowerCase() != "gml:poslist" &&
                            elem1[i].nodeName.toLowerCase() != "gml:pos") {
                            if (elem1[i].nodeName.toLowerCase() == "gml:name") { // Это подпись
                                text = $(elem1[i]).text();
                            }
                            continue;
                        }
                        // заберем атрибуты
                        elem2 = elem1[i].attributes;
                        if (elem2 != null && elem2 != undefined && elem2.length != 0) {
                            for (j = 0; j < elem2.length; j++) {
                                if (elem2[j].nodeName.toLowerCase() == "srsdimension")
                                    this.geometry.dimension = elem2[j].nodeValue;
                                if (elem2[j].nodeName.toLowerCase() == "count")
                                    this.geometry.countpoint = elem2[j].nodeValue;
                            }
                        }

                        // заберем данные
                        data = { data: $(elem1[i]).text(), text: text };
                        return data;
                    }
                    break;
            }

        },

        // Загрузить данные метрики из xml - элемента
        loadgeometryXmlElem: function(elem, subject) {
            if (elem == null || elem == undefined || elem.length == 0)
                return;
            var data;
            for (var i = 0; i < elem.length; i++) {
                data = this.loadsinglegeometryXmlElem(elem[i]);
                if (data) {
                    this.loadpoints(data, subject, this.geometry.dimension, this.geometry.countpoint);
                }
                subject++;
            }
            return subject;
        },

        // Загрузить точки метрики из строки
        loadpoints: function(data, subject, dimension, count) {
            if (data == undefined || data == null ||
                dimension == null || dimension == undefined ||
                count == null || count == undefined)
                return;
            var h,
                mass = (data.data) ? data.data.split(' ') : [];
            if (mass.length >= 0) {
                dimension = parseInt(dimension);
                count = parseInt(count);
                for (var i = 0; i < mass.length; i += dimension) {
                    if (!mass[i] || !mass[i + 1] || (dimension == 3 && !mass[i + 2]))
                        continue;
                    if (dimension == 3)
                        h = parseFloat(mass[i + 2]);
                    this.geometry.appendpoint3D(parseFloat(mass[i]), parseFloat(mass[i + 1]), h, subject);
                }
            }
            if (data.text) {
                this.geometry.setText(data.text);
            }
        },


        // Сохранить объект
        // regime (create, replace, delete) - режим создания
        // mapobjects - список объектов на сохранение
        save: function(regime, nosemantic, mapobjects) {
            // var wfsQuery_save;
            let context;
            if (this.srv) {
                // wfsQuery_save = new WfsQueries(this.srv, this.map);
                // wfsQuery_save.onDataLoad = this.onDataLoaded_save;
                // wfsQuery_save.context = this;
                // wfsQuery_save.context.regime = regime;
                context = this;
                context.regime = regime;
            }

            var onestr, strout = '',
                response = '<?xml version="1.0" encoding="utf-8" ?><wfs:Transaction version="2.0.0" service="WFS" handle="Transaction ' + regime + '">';

            if (mapobjects && mapobjects instanceof Array) {
                for (var i = 0; i < mapobjects.length; i++) {
                    if (i > 0 && regime != 'delete') // Если объект не один и режим не равен удалению, то остальные объекты только на обновление
                        regime = 'replace';
                    // Если для конкретного объекта списка  выставлен режим сохранения(saveregime), то берем его
                    if (mapobjects[i].saveregime)
                        regime = mapobjects[i].saveregime;
                    onestr = this.setresponse(regime, nosemantic, mapobjects[i]);
                    if (onestr && onestr != 'graphic')
                        strout += onestr;
                }
            }else{
                onestr = this.setresponse(regime, nosemantic, this);
                if (onestr && onestr != 'graphic')
                    strout += onestr;
            }

            if (strout == '') { // только графические
                this.createtrigger(regime);
                return;
            }

            // Выполним транзакцию
            response += strout;
            response += '</wfs:Transaction>';
            // if (wfsQuery_save) {
            //     wfsQuery_save.transaction(response, this.wmtsId);
            // }
            //todo: response составлять через класс XMLElement
            if (this.wfsQuery) {
                this.wfsQuery.transaction({ data: response }, { LAYER_ID: this.wmtsId }).then(
                    (result) => {
                        this.onDataLoaded_save(result.data, context);
                    }
                );
            }

        },

        // Сформировать строку информации по объекту для формировнания запроса транзакций
        setresponse: function(regime, nosemantic, mapobject) {
            if (!mapobject)
                mapobject = this;

            // Сбросим режим сохранения, он далее не понадобится
            mapobject.setSaveRegime();

            // Сохраним в json
            mapobject.saveJSON();

            var layer = this.map.tiles.getLayerByxId(mapobject.maplayerid);
            // если это объект из локального слоя
            if (layer && layer instanceof GWTK.graphicLayer) {
                // Запросить объект layer по id
                if (regime != 'delete') {
                    if (regime == 'create') {
                        mapobject.oJSON.features[0].properties.id = null;
                        layer.addFeature(mapobject.oJSON.features[0]);
                        mapobject.gid_svg = mapobject.gid = mapobject.oJSON.features[0].properties.id;
                        layer.drawMap();
                    }else{
                        layer.updateFromGeoJson(mapobject.oJSON);
                    }
                }else
                    layer.deleteObject(mapobject.oJSON);
                return 'graphic';
            }

            if (!mapobject.wmtsId) return;

            // Сформируем семантику  в виде xml строки
            var strsemantic = nosemantic ? '' : mapobject.semantic.semanticsToXmlString(),
                response = '', strgeometry, strgraphic, strgeometrys = new Array();
            // text = (mapobject.semantic) ? mapobject.semantic.texttitle : null;

            // Запросим метрику в виде xml строки
            strgeometrys = mapobject.geometry.pointsToXmlString(mapobject.oJSON.features[0].geometry, mapobject.oJSON.features[0].properties['title']);
            if (!strgeometrys || strgeometrys.length == 0)
                return;

            // Графическая составляющая объекта
            strgraphic = (mapobject.graphic) ? GWTK.MapeditLegendGraphicControl.prototype.saveSLD(mapobject.graphic) : '';
            if (strgraphic) {
                mapobject.layername = mapobject.graphic.classifierLayer;
            }

            var bsd = mapobject.rscschema ? mapobject.rscschema : 'bsd',
                multipolygon = (mapobject.geometry.spatialposition.toLowerCase().indexOf('multipolygon') >= 0);

            for (var i = 0; i < strgeometrys.length; i++) {
                strgeometry = strgeometrys[i];
                if (multipolygon) {
                    strgeometry = '<gml:MultiGeometry>' + strgeometry + '</gml:MultiGeometry>';
                }
                if (i > 0) {
                    regime = 'create';
                    // Удалим все подобъекты (они больше не понадобяться)
                    mapobject.geometry.deletesubjects();
                }

                //  сформируем wfs запрос
                // switch (regime) {
                //     case 'replace':
                //         response += '<wfs:Replace handle="' + regime + '_' + mapobject.maplayerid.toString() + '_' + mapobject.id.toString() + '">' +
                //             '<fes:Filter><fes:ResourceId rid="' + mapobject.gid + '"/></fes:Filter>';
                //         response += '<' + bsd + ':' + mapobject.layername + ' gml:id="' + mapobject.id + '">';
                //         // код объекта или графическое описание
                //         if (!strgraphic) {
                //             response += '<' + bsd + ':' + mapobject.layername + 'Code>' + mapobject.code + '</' + bsd + ':' + mapobject.layername + 'Code>'; // <bsd:VegetationAreasCode>71111110</bsd:VegetationAreasCode>
                //         }
                //         else {
                //             response += '<sld>' + strgraphic + '</sld>';
                //         }
                //         // метрика семантика
                //         response += strsemantic + strgeometry + '</' + bsd + ':' + mapobject.layername + '>';
                //         response += '</wfs:Replace>';
                //         break;
                //     case 'delete':
                //         response += '<wfs:delete handle="' + regime + '_' + mapobject.maplayerid.toString() + '_' + mapobject.id.toString() +
                //             '" typeName="' + bsd + ':' + mapobject.layername + '">' +
                //                     '<fes:Filter><fes:ResourceId rid="' + mapobject.gid + '"/></fes:Filter>' +
                //                     '</wfs:delete>';
                //         break;
                //     case 'create':
                //         response += '<wfs:Insert handle="' + regime + '_' + mapobject.maplayerid.toString() + '_' + mapobject.id.toString() + '">';
                //         response += '<' + bsd + ':' + mapobject.layername + ' gml:id="' + mapobject.maplayername + '">';
                //         // код объекта или графическое описание
                //         if (!strgraphic) {
                //             response += '<' + bsd + ':' + mapobject.layername + 'Code>' + mapobject.code + '</' + bsd + ':' + mapobject.layername + 'Code>';
                //         }
                //         else {
                //             response += '<sld>' + strgraphic + '</sld>';
                //         }
                //         response += strsemantic + strgeometry + '</' + bsd + ':' + mapobject.layername + '>';
                //         response += '</wfs:Insert>';
                //         break;
                // }

                switch (regime) {
                    case 'replace':
                        response += '<wfs:Replace handle="' + regime + '_' + mapobject.maplayerid.toString() + '_' + mapobject.id.toString() + '">' +
                            '<fes:Filter><fes:ResourceId rid="' + mapobject.gid + '"/></fes:Filter>';
                        //response += '<' + bsd + ':' + mapobject.layername + ' gml:id="' + mapobject.id + '">';
                        response += '<' + bsd + ':' + mapobject.layername + ' gml:id="' +  mapobject.gid  + '">';
                        // код объекта или графическое описание
                        if (!strgraphic) {
                            response += '<' + bsd + ':' + mapobject.layername + 'Code>' + mapobject.code + '</' + bsd + ':' + mapobject.layername + 'Code>'; // <bsd:VegetationAreasCode>71111110</bsd:VegetationAreasCode>
                        }else{
                            response += '<sld>' + strgraphic + '</sld>';
                            response += '<gml:name>' + this.name + '</gml:name>';
                        }
                        // метрика семантика
                        response += strsemantic + strgeometry + '</' + bsd + ':' + mapobject.layername + '>';
                        response += '</wfs:Replace>';
                        break;
                    case 'delete':
                        response += '<wfs:delete handle="' + regime + '_' + mapobject.maplayerid.toString() + '_' + mapobject.id.toString() +
                            '" typeName="' + bsd + ':' + mapobject.layername + '">' +
                            '<fes:Filter><fes:ResourceId rid="' + mapobject.gid + '"/></fes:Filter>' +
                            '</wfs:delete>';
                        break;
                    case 'create':
                        response += '<wfs:Insert handle="' + regime + '_' + mapobject.maplayerid.toString() + '_' + mapobject.id.toString() + '">';
                        response += '<' + bsd + ':' + mapobject.layername + ' gml:id="' + mapobject.maplayername + '">';
                        // код объекта или графическое описание
                        if (!strgraphic) {
                            response += '<' + bsd + ':' + mapobject.layername + 'Code>' + mapobject.code + '</' + bsd + ':' + mapobject.layername + 'Code>';
                        }else{
                            response += '<sld>' + strgraphic + '</sld>';
                            response += '<gml:name>' + this.name + '</gml:name>';
                        }
                        response += strsemantic + strgeometry + '</' + bsd + ':' + mapobject.layername + '>';
                        response += '</wfs:Insert>';
                        break;
                }

            }

            return response;
        },

        // Установить локализацию объекта
        setSpatialposition: function(spatialposition) {
            var text = this.geometry.getText();
            if (text) {
                if ($.isArray(text)) {
                    spatialposition = 'multilinestring';
                }else{
                    spatialposition = 'title';
                }
            }
            if (spatialposition) {
                this.spatialposition = this.geometry.spatialposition = spatialposition;
            }
        },

        // нарисовать контур объекта на карте
        // mapdiv - панель объекта карта
        // тип рисования (= select - выделить)
        // objcenter - необязательный параметр, отвечающий за позиционирование объекта
        // ("1" = по центру, "2" - по первой точке, по умолчанию = "2")
        drawcontour: function(mapdiv, objcenter) {
//            this.cleardraw();

            // Если нет метрики, запросить по wfs
            if (!this.geometry) return;
            if (this.geometry.count() == 0 && this.gid != "0") // если нет точек и gid реальный
            {
                // выставим флажок ожидания данных на перерисовку
                this.waitdrawobject = this;
                this.initwfs(this.gid, objcenter);
                return false;
            }

            this._drawcontour(mapdiv);
            return true;
        },

        /**
         * Запросить графические параметры объекта
         * @param gid
         */
        getGraphic: function(gid) {
            if (this.graphic) {
                return this.graphic
            }

            if (!this.wmtsId && !this.srv) {
                return;
            }
            if (gid == null && gid != undefined) {
                this.setgid(gid);
            }
            // Если это новый объект
            if (this.id && this.id.toString() == '0') {
                return;
            }
            // var wfsQuery_graphic = new WfsQueries(this.srv, this.map);
            // wfsQuery_graphic.context = this;
            // wfsQuery_graphic.onDataLoad = GWTK.Util.bind(this.onDataLoaded_sld, this);
            // wfsQuery_graphic.featurebyid(this.gid, this.wmtsId, null, 0, 0, 0, 0, 1);
            if (this.wfsQuery) {
                this.wfsQuery.getFeatureById({ ID: this.gid, LAYER: this.wmtsId, GETSLD: '1' }).then(
                    (result) => {
                        this.onDataLoaded_sld(result.data, this);
                    }
                );
            }
        },

        /**
         * Загрузка графического описания объекта
         * @param response
         */
        onDataLoaded_sld: function(response, context) {
            // var mapobject = context;
            var mapobject = this;
            if (mapobject) {

                mapobject.graphic = null;
                if (response && response.toLowerCase().indexOf('exception') < 0) {
                    // Найдем блок SLD
                    response = response.replace(/\r|\n/g, '');
                    var xml = $.parseXML(response);
                    xml = $(xml);
                    if (xml) {
                        if (xml.context.documentElement.nodeName.toLowerCase() == 'wfs:featurecollection') {
                            var elem = xml.context.documentElement.childNodes,
                                child, levelsld;
                            if (elem && elem.length > 0) {
                                for (var i = 0; i < elem.length; i++) {
                                    if (elem[i].nodeName.toLowerCase() != 'wfs:member') {
                                        continue;
                                    }
                                    child = elem[i].childNodes;
                                    if (child && child.length > 0) {
                                        for (var j = 0; j < child.length; j++) {
                                            if (child[j].nodeName.toLowerCase() != (this.rscschema + ':' + this.layername).toLowerCase()) {
                                                continue;
                                            }
                                            // ищем блок sld
                                            levelsld = child[j].childNodes;
                                            if (levelsld && levelsld.length > 0) {
                                                for (var jj = 0; jj < levelsld.length; jj++) {
                                                    if (levelsld[jj].nodeName.toLowerCase() == 'sld') {
                                                        this.loadSldXmlElem(levelsld[jj]);
                                                        // var text = (mapobject.geometry) ? mapobject.geometry.getText() : '';
                                                        // mapobject.graphic = GWTK.MapeditLegendGraphicControl.prototype.loadSLD(mapobject.spatialposition, levelsld[jj], mapobject.layername);
                                                        // if (mapobject.graphic.type && !mapobject.code){
                                                        //     mapobject.code = mapobject.graphic.type;
                                                        //     mapobject.key = mapobject.code;
                                                        // }
                                                        // if (mapobject.spatialposition == 'title') {
                                                        //     mapobject.graphic.text = (mapobject.geometry) ? mapobject.geometry.getText() : '';
                                                        // }
                                                        break;
                                                    }
                                                }
                                            }
                                            if (mapobject.graphic) {
                                                break;
                                            }
                                        }
                                    }
                                    if (mapobject.graphic) {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }

                // mapobject.createtrigger('load');
                // $(mapobject.map.eventPane).trigger({ type: 'updatemapobject', mapobject: this, regime: 'load'});
                // $(mapobject.map.eventPane).trigger({ type: 'loadgraphic', mapobject: this, regime: 'load'});

                $(mapobject.map.eventPane).trigger({
                    type: 'loadgraphic',
                    mapobject: mapobject
                });
            }
        },

        loadSldXmlElem: function(nodesld) {
            if (nodesld) {
                this.graphic = GWTK.MapeditLegendGraphicControl.prototype.loadSLD(nodesld, this.layername);
                if (this.graphic) {
                    if (this.graphic.type && (!this.code || this.code == '0')) {
                        this.code = this.graphic.type;
                        this.key = this.code;
                    }
                    if (this.graphic.type == 'title') {
                        this.graphic.text = (this.geometry) ? this.geometry.getText() : '';
                    }
                }
                return this.graphic;
            }
        },

        // Очистить объект
        clear: function() {
            if (this.geometry)
                this.geometry.clear();
            if (this.semantic)
                this.semantic.clear();
            this.clearvariable();

        },

        // Очистить переменные класса
        clearvariable: function() {
            this.image = null;

            this.gid = null;                 // уникальный идентификатор объъекта карты
            this.id = null;                 // id объекта карты
            this.code = null;               // код объекта из rsc
            this.key = null;                // ключ объекта из rsc
            this.image = null;              // изображение объекта
            this.name = null;               // название объекта
            this.bbox = null;
            this.crs = null;                // код epsg, например - '4326'
            this.classifiername = null;     // имя классификатора
            this.layername = null;
            this.spatialposition = null;
            this.saveregime = null;
        },

        // нарисовать контур объекта на карте
        // mapdiv - панель объекта карта
        _drawcontour: function(mapdiv) {
            var version = $.browser.msie ? $.browser.version : 9;
            if (!this.map) {
                return;
            }
            // Выделить объект
            if (version >= 9 && this.map.selectedObjects) {
                if (!this.map.selectedObjects.svgDraw) {
                    this.map.selectedObjects.init();
                }
                this.map.selectedObjects.drawobject(this.gid, true, this.drw_select);
            }
        },

        // Сохранение объекта
        onDataLoaded_save: function(response, context) {
            if (response == undefined || response == null || context == undefined || context == null)
                return;
            var mapobject = context;
            //mapobject.saveoperation = true;
            var error = false;
            if (response.indexOf('Exception') >= 0) {
                error = true;
                //alert("Ошибка при сохранении объекта: " + response);
                //return;
            }

            // триггер на операцию обновления объекта
            var info = context.createmessage(response, mapobject.maplayerid);
            mapobject.createtrigger(mapobject.regime, error, info);

        },

        createtrigger: function(regime, error, info) {
            if (!regime) return;

            //$(this.map.mapPane).trigger({ type: 'updatemapobject', mapobject: this, regime: regime, error: error });
            $(this.map.eventPane).trigger({
                type: 'updatemapobject',
                mapobject: this,
                regime: regime,
                error: error,
                message: (info) ? info.message : '',
                info: info
            });
            this.regime = null;
        },

        // Сообщение об операции по изменению объектов
        createmessage: function(response, maplayerid) {
            if (!response) return '';
            var gid,
                info = {
                    'inserted': 0,
                    'replaced': 0,
                    'deleted': 0,
                    'updated': 0,
                    'message': w2utils.lang('Layer') + ' ' + maplayerid + ': '
                };
            //message = w2utils.lang('Layer') + ' ' + maplayerid + ': ';
            var $doc = $.parseXML(response);
            var $xml = $($doc);
            if ($xml.context.documentElement.nodeName.toLowerCase() == "wfs:transactionresponse") {
                var childNodes1, childNodes2, childNodes = $xml.context.documentElement.childNodes;
                if (childNodes && childNodes.length > 0) {
                    for (var i = 0; i < childNodes.length; i++) {
                        if (childNodes[i].nodeName.toLowerCase() == 'wfs:transactionsummary') {
                            childNodes1 = childNodes[i].childNodes;
                            for (var j = 0; j < childNodes1.length; j++) {
                                var childNodes1jText = $(childNodes1[j]).text();
                                if (childNodes1[j].nodeName.toLowerCase() == 'wfs:totalinserted') {
                                    if (childNodes1jText) {
                                        info.inserted = childNodes1jText;
                                        info.message += w2utils.lang('Inserted') + ' ' + w2utils.lang('layer objects') + ' - ' + info.inserted;
                                    }
                                }else{
                                    if (childNodes1[j].nodeName.toLowerCase() == 'wfs:totalreplaced') {
                                        if (childNodes1jText) {
                                            info.replaced = childNodes1jText;
                                            info.message += w2utils.lang('Replaced') + ' ' + w2utils.lang('layer objects') + ' ' + w2utils.lang('objects count') + ' - ' + info.replaced;
                                        }
                                    }else{
                                        if (childNodes1[j].nodeName.toLowerCase() == 'wfs:totaldeleted') {
                                            if (childNodes1jText) {
                                                info.deleted = childNodes1jText;
                                                info.message += w2utils.lang('Deleted') + ' ' + w2utils.lang('layer objects') + ' - ' + info.deleted;
                                            }
                                        }else{
                                            if (childNodes1[j].nodeName.toLowerCase() == 'wfs:totalupdated') {
                                                if (childNodes1jText) {
                                                    info.updated = childNodes1jText;
                                                    info.message += w2utils.lang('Updated') + ' ' + w2utils.lang('layer objects') + ' - ' + info.updated;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }else{
                            // Если была вставка (создание) объекта
                            if (childNodes[i].nodeName.toLowerCase() == 'wfs:insertresults') {
                                childNodes1 = childNodes[i].childNodes;
                                for (var j = 0; j < childNodes1.length; j++) {
                                    if (childNodes1[j].nodeName.toLowerCase() == 'wfs:feature') {
                                        childNodes2 = childNodes1[j].childNodes;
                                        for (var jj = 0; jj < childNodes2.length; jj++) {
                                            if (childNodes2[jj].nodeName.toLowerCase() == 'wfs:resourceid') {
                                                // Запросим атрибут rid - это gid объекта
                                                gid = $(childNodes2[jj]).attr("rid");
                                                this.setgid($(childNodes2[jj]).attr("rid").replace(/:/g, "."));
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return info;
        },

        spatialpositionCaption: function() {
            var text = '';
            switch (this.spatialposition.toLowerCase()) {
                case 'point':
                case 'multipoint':
                    text = w2utils.lang("Spot");
                    break;
                case 'multilinestring':
                case 'linestring':
                    text = w2utils.lang("Linear");
                    break;
                case 'title':
                    text = w2utils.lang("Signature");
                    break;
                case 'polygon':
                case 'multipolygon':
                    text = w2utils.lang("Square object");
                    break;
            }
            return text;
        },

        // Установить режим сохранения объекта
        // regime =  'replace' или 'delete' или 'create' или null
        setSaveRegime: function(regime) {
            if (regime)
                this.saveregime = regime;
            else
                this.saveregime = null;
        },

        /**
         * Назначить семантики для графического объекта карты
         */
        setSemanticsForGraphic: function(callback_complete) {
            var layer = this.map.tiles.getLayerByxId(this.maplayerid);
            if (!layer) return;

            layer.classifier.getLayerSemanticListByKey(this.layername,
                GWTK.Util.bind(function(semantics) {
                    if (semantics) {
                        var rscsemantic = semantics.rscsemantic,
                            copysemantic = this.semantic.createcopy();
                        this.semantic.setsemantics(rscsemantic);
                        this.semantic.updateSemanticsValue(copysemantic.semantics);
                        if (callback_complete) {
                            return callback_complete(this.semantic);
                        }
                    }
                }, this));

        },

        // Запросить семантику по номеру объекта на карте
        // objectnumber - номер объекта на карте
        getsemanticsobject: function(objectnumber, fn_callback) {
            if (!objectnumber) return;
            return this.semantic.loadSemanticsByObjectNumber(objectnumber, this, fn_callback);
        }

    }

}
