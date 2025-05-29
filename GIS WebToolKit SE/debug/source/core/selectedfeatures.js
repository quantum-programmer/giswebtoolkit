/*********************************** Нефедьева О.  **** 31/07/20 ***
************************************ Патейчук В.К. **** 12/03/20 ***
************************************ Соколова Т.О. **** 30/09/20 ***
************************************ Тазин В.О.    **** 20/04/17 ***
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                     Отобранные объекты карты                     *
*                                                                  *
*******************************************************************/

if (window.GWTK) {
    GWTK.selectedFeatures = function (map, draw_options, drawSelected_options) {
        this.map = map;
        if (!this.map) {
            console.log("GWTK.selectedFeatures. " + w2utils.lang("Not defined a required parameter") + " Map.");
        }
        this.selected = [];                  // id отобранных объектов, массив
        this.layers = [];                    // id слоев сервиса, массив
        //объект для хранения выбранных слоев
        this.selectedLayers = {};

        // Объекты карты для отрисовки на карте
        this.mapobjects = [];
        // текущий отрисованный объект
        this.drawcurrobject = null;
        // отрисованный выделенный объект
        this.drawselobject = null;

        // Панель для рисования объектов
        this.drawoptions = !draw_options ?
            {
                "stroke": "red",
                "stroke-width": "2px",
                "stroke-opacity": "1",
                "vector-effect": "non-scaling-stroke",
                "fill": "transparent",
                "background": "",
                "background-size": "auto auto",
                "fill-opacity": "0.3",
                "font-family": "Verdana",
                "font-size": "12px",
                "letter-spacing": "1",
                "startOffset": "2%",
//                "marker": 'M 2 9 a 5 5 0 0 0 17 0M 2 9 a 5 5 0 0 1 17 0',
                "marker": {"path": "M2 9 L4.06 13.98 L10.5 17.5 L16.94 13.98 L19 9 L16.94 4.02 L10.5 0.5 L4.06 4.02 Z", "refX": 8, "refY":8},  // Ромб
                "text": ""
            } :
            JSON.parse(JSON.stringify(draw_options));

        this.drawoptionsSelected = !drawSelected_options ?
            {
                "stroke": "#e581f1",
                "stroke-width": "2px",
                "stroke-opacity": "0.75",
                "vector-effect": "non-scaling-stroke",
                "fill": "#e581f1",     // розовый,
                "background": "",
                "background-size": "auto auto",
                "fill-opacity": "0.3",
                "font-family": "Verdana",
                "font-size": "12px",
                "letter-spacing": "1",
                "startOffset": "2%",
//                "marker": 'M 2 9 a 5 5 0 0 0 17 0M 2 9 a 5 5 0 0 1 17 0',
                "marker": {"path": "M2 9 L4.06 13.98 L10.5 17.5 L16.94 13.98 L19 9 L16.94 4.02 L10.5 0.5 L4.06 4.02 Z", "refX": 8, "refY":8},  // Ромб
                "text": ""
            } :
            JSON.parse(JSON.stringify(drawSelected_options));

        this.svgDraw = null;
        this.svgDrawSelected = null;

        this.id = 'sf' + GWTK.Util.randomInt(60000, 70000).toString();     // уникальный идентификатор объекта

        // идентификатор одиночного маркера (placemark)
        this.markSingleId = this.id + 'Single';

        return this;
    };

    GWTK.selectedFeatures.prototype = {

        init: function (method) {
            this.svgDraw = new GWTK.objectDrawing(this.map, ['Features_pane' + this.id, null, 'selectedFeatures_canvas' + this.id], method);
            this.svgDraw.initView();
            this.svgDraw.options = this.drawoptions;

            this.svgDrawSelected = new GWTK.objectDrawing(this.map, ['FeaturesSelected_pane' + this.id, null, 'selectedFeaturesSelected_canvas' + this.id], method);
            this.svgDrawSelected.initView();
            this.svgDrawSelected.options = this.drawoptionsSelected;
        },

        destroy: function () {
            this.clear();
            if (this.svgDraw)
                this.svgDraw.destroy();
            if (this.svgDrawSelected)
                this.svgDrawSelected.destroy();
            // Обнулить
            this.svgDraw = null;
            this.svgDrawSelected = null;
        },

        clear: function () {

            // Всегда удаляем одиночный маркер
            this.map.placemarkRemove(this.markSingleId);

            // удалим объекты
            this.clearDrawAll();
            this.clearobjects();

            this.selected = [];
            this.layers = [];
            this.selectedLayers = {};
        },

        getselection: function () {
            return this.selected;
        },

        // добавить объект mapobject через http-запрос wfs
        // objcenter - необязательный параметр, отвечающий за позиционирование объекта
        // ("1" = по центру, "2" - по первой точке, по умолчанию = "2")
        // objframe - запрос габаритов объекта (1 или  0)
        addWfs: function (gid, maplayerid, objcenter, objframe) {
            if (!gid || !maplayerid) return;
            this.addselect(gid, maplayerid);
            var l = this.map.tiles.getLayerByIdService(maplayerid);
            if (!l)
                return null;
            var currentMapObject = this.findobjectsByGid(gid);
            var mapobject = currentMapObject || new GWTK.mapobject(this.map, gid, l.options.id, null, null, this.mapobjects);
            if (!mapobject.error) {
	            mapobject.geometry.clear();
	            mapobject.semantic.clear();
                mapobject.initwfs(null, objcenter, objframe);
            }
            return mapobject;
        },

        // Добавить объекты из json в список объектов
        // layer - слой
        addJsonObjects: function (json, layer) {
            if (!json || !json.type || json.type != "FeatureCollection" || !json.features || json.features.length == 0)
                return false;
            this.selectedLayers = {};
            for(var i = 0; i<json.features.length; i++){
                this.addJsonObject(json, i, layer);
            }
            return true;
        },

        // Добавить объект из json в список объектов по индексу
        // layer - слой
        addJsonObject: function (json, index, layer) {
            if (!json || !json.type){
                return false;
            }
            var featureJson;
            if (json.type == "FeatureCollection" && json.features && json.features.length > 0){
                featureJson = json.features[index];
            } else {
                if (json.type == "Feature"){
                    featureJson = json;
                }
            }

            if (!featureJson){
                return false;
            }
            // сделаем новый json - объект
            var newjson = {
                "type": "FeatureCollection",
                "bbox": json.bbox,
                "features": []
            };
            newjson.features.push(featureJson);
            var mapobject = new GWTK.mapobject(this.map, "0", "0", null, null, this.mapobjects);
            if (mapobject.error)
                return;

            mapobject.loadJSON(newjson, true);

            if (layer || featureJson['properties']['mapid']) {
                var xid = '';
                if (layer && layer.options && layer.options.id) {
                    xid = layer.options.id;
                }
                else {
                    var lay = this.map.tiles.getLayerByIdService(featureJson['properties']['mapid']);
                    if (lay) {
                        xid = lay.xId;
                        mapobject.wmtsId = lay.idLayer;
                    }
                    else {
                        mapobject.wmtsId = featureJson['properties']['mapid'];
                    }
                }
                mapobject.maplayerid = xid;
                mapobject.maplayername = layer ? layer.alias : null;
            }

            return this.add(mapobject, true);
        },


        // добавить объект mapobject из xml-элемента
        // maplayerid - id сервиса карт
        addXmlElem: function (gid, maplayerid, xmlelem) {
            this.addselect(gid, maplayerid);
            var layer = this.map.tiles.getLayerByIdService(maplayerid);
            if (!layer) return;

            // найдем и обновим
            var currentMapObject = this.findobjectsByGid(gid);
            var mapobject = currentMapObject || new GWTK.mapobject(this.map, gid, layer.options.id, null, null, this.mapobjects);
            if (!mapobject.error) {
                mapobject.geometry.clear();
                mapobject.semantic.clear();
                mapobject.loadobjectXmlElem(xmlelem);
            }
            // Если не было, то добавить
            if (!currentMapObject) {
                this.mapobjects.splice(this.mapobjects.length, 0, mapobject);
                currentMapObject = this.mapobjects[this.mapobjects.length - 1];
            }
            return currentMapObject;
        },

        // Добавить объект mapobject в список объектов
        // link - добавить объект как ссылку
        add: function (mapobject, link) {
            if (!mapobject) return;
            this.selectedLayers[mapobject.maplayerid] = true;
            if ($.inArray(mapobject.gid, this.selected) == -1) {
                this.selected.push(mapobject.gid);
            }
            var serviceId = this.map.tiles.getLayerByxId(mapobject.maplayerid);
            serviceId = (serviceId && serviceId.idLayer) ? serviceId.idLayer : '';
            var newobject, currentMapObject = this.findobjectsByGid(mapobject.gid);
            if (currentMapObject)
                this.remove(currentMapObject);
            if (link)
                newobject = mapobject;
            else
		        newobject = mapobject.clone();
		    this.addselect(newobject.gid, serviceId);
		    newobject.mapobjects = this.mapobjects;
		    this.mapobjects.splice(this.mapobjects.length, 0, newobject);
            return this.mapobjects[this.mapobjects.length - 1];
        },
    
        
        /**
         * Добавить объект карты в список объектов
         * @method addMapObject
         * @param newMapObject {MapObject} Объект карты
         * @return {object} Описание объекта
         */
        addMapObject: function(newMapObject) {
    
            const mapObject = new GWTK.mapobject(this.map, "0", "0", null, null, this.mapobjects);
            if (mapObject.error)
                return;
            const featureJson = newMapObject.toJSON();
    
            var newjson = {
                "type": "FeatureCollection",
                "features": [featureJson]
            };
    
            mapObject.loadJSON(newjson, true);
    
            if (featureJson['properties']['mapid']) {
                let xid = '';
                const lay = this.map.tiles.getLayerByIdService(featureJson['properties']['mapid']);
                if (lay) {
                    xid = lay.xId;
                    mapObject.wmtsId = lay.idLayer;
                }else{
                    mapObject.wmtsId = featureJson['properties']['mapid'];
                }
        
                mapObject.maplayerid = xid;
    
                const layerId = featureJson['properties']['mapid']||GWTK.Util.parseGmlId(featureJson.properties.id).sheet;
                const layer= this.map.tiles.getLayerByxId(layerId);
                
                mapObject.maplayername = layer ? layer.alias : null;
            }
    
            if ($.inArray(mapObject.gid, this.selected) == -1) {
                this.selected.push(mapObject.gid);
            }
            let serviceId = this.map.tiles.getLayerByxId(mapObject.maplayerid);
            serviceId = (serviceId && serviceId.idLayer) ? serviceId.idLayer : '';
            const newobject = mapObject.clone(),
                currentMapObject = this.findobjectsByGid(mapObject.gid);
            if (currentMapObject) {
                this.remove(currentMapObject);
            }
            this.addselect(newobject.gid, serviceId);
            newobject.mapobjects = this.mapobjects;
            this.mapobjects.splice(this.mapobjects.length, 0, newobject);
            return this.mapobjects[this.mapobjects.length - 1];
        },

        // удалить объект
        remove: function (mapobject) {
            if (!mapobject || !this.mapobjects || this.mapobjects.length == 0)
                return false;
            var count = this.mapobjects.length, gid_svg;
            for (var i = 0; i < count; i++) {
                if (this.mapobjects[i].gid == mapobject.gid) {
                    // Стереть с холста
                    gid_svg = (mapobject.gid_svg) ? mapobject.gid_svg : mapobject.gid;
                    this.cleardrawobject(gid_svg, true);
                    this.cleardrawobject(gid_svg);
                    // Удалить объект из select
                    this.removeselect(mapobject.gid);
                    this.mapobjects.splice(i, 1);
                    return true;
                }
            }
        },

        // очистить список объектов
        clearobjects: function () {
            if (this.mapobjects == null || this.mapobjects == undefined)
                return;

            if (this.drawselobject != null && this.drawselobject != undefined) {
                this.drawselobject.clear();
                this.drawselobject = null;
            }

            var count = this.mapobjects.length;
            for (var i = 0; i < count; i++)
                this.mapobjects[i].clear();
            this.mapobjects = [];
            this.drawcurrobject = null;
        },

        // Поиск объекта по идентификатору слоя и gml:id
        // возвращает объект класса mapobject
        findobjectsById: function (layerId, gid) {
            if (this.mapobjects == null || this.mapobjects == undefined)
                return;
            var count = this.mapobjects.length;
            for (var i = 0; i < count; i++)
                if (this.mapobjects[i].maplayerid == layerId && this.mapobjects[i].gid == gid)
                    return this.mapobjects[i];
        },

        // Отрисовать объект по id
        // layerId - id слоя карты
        // gid - идентификатор объекта
        // clear - стереть предыдущий отрисованный объект
        // select - выделить
        drawcontourById: function (layerId, gid, clear, select) {
            // Заглушка
            var layer = this.map.tiles.getLayerByGmlId(gid);
            if (!layer) return;
            layerId = layer.options.id;

            var mapobject = this.findobjectsById(layerId, gid);
            if (mapobject) {
                this.drawcontour(mapobject, clear, select);
                return true;
            }

            return false;
        },

        // Поиск объекта только по gid
        // возвращает объект класса mapobject
        findobjectsByGid: function (gid) {
            if (!this.mapobjects || this.mapobjects.length == 0)
                return false;
            var count = this.mapobjects.length;
            for (var i = 0; i < count; i++) {
                if (this.mapobjects[i].gid == gid)
                    return this.mapobjects[i];
            }
        },

	    getMeasurement: function () {
		    var tmpOnject = { areaSum: 0, perimeterSum: 0 };
		    for ( var i = 0; i < this.mapobjects.length; i++ ) {
			    if ( this.mapobjects[ i ] && this.mapobjects[ i ][ 'arealoaded' ] ) {
				    tmpOnject.areaSum += this.mapobjects[ i ][ 'arealoaded' ];
			    }
			    if ( this.mapobjects[ i ] && this.mapobjects[ i ][ 'perimeterloaded' ] ) {
				    tmpOnject.perimeterSum += this.mapobjects[ i ][ 'perimeterloaded' ];
			    }
		    }
		    return tmpOnject;
	    },

        // Нарисовать объект по его идетификатору
        // При отсутствии объекта в списке запрашивает его с сервера и пытается отрисовать
        // clear - стререть предыдущий отрисованный
        // select - выделить
        // setposition - спозиционировать карту по центру объекта
        // setframe - спозиционировать карту по габаритам объекта
        // animate - анимация
	    drawobject: function (gid, clear, select, setposition, setframe, animate) {
	        var mapobject = this.findobjectsByGid(gid);

	        var layer =  this.map.tiles.getLayerByGmlId(gid);
	        if (layer && layer instanceof GWTK.graphicLayer == false) {
	            if (!mapobject || mapobject.geometry.count() == 0) {
	                // Так как к моменту вызова данной функции ответ от сервера может не прийти,
	                // добавил разовый обработчик события загрузки метрики объекта. Как только
	                // ответ от сервера поступит, объект будет отрисован
	                var that = this;
	                // Запросим объект у сервера
	                this.addWfs(gid, layer.id, "2", "1");
	                $(this.map.eventPane).one('mapobjectloadWfs', function (e) {
	                    mapobject = that.findobjectsByGid(e.gid);
	                    if (!mapobject) return;
	                    that.drawcontour(mapobject, clear, select, setposition, setframe);
	                });
	                return false;
	            }

	            // Отрисовать объект
	            this.drawcontour(mapobject, clear, select, setposition, setframe, animate);
	        }
	        return true;
	    },

        // Рисование объекта
	    drawcontour: function (mapobject, clear, select, setposition, setframe, animate) {
	        // Всегда удаляем одиночный маркер
	        this.map.placemarkRemove(this.markSingleId);

	        if (!mapobject)
	            return;
	        if (!mapobject.geometry || mapobject.geometry.count() == 0) {
	            console.log("Object " + mapobject.gid + ": the geometry of the object is absent.");
	            return;
	        }

	        var overlaypoint = GWTK.tileView.geo2pixelOffset(this.map, mapobject.objectcenter),
                json = mapobject.oJSON ? mapobject.oJSON : mapobject.saveJSON();

	        // Спозиционировать объект
	        if (setframe) {
	            if (mapobject.bbox) {
	                this.map.showMapExtent(mapobject.bbox[1], mapobject.bbox[0], mapobject.bbox[3], mapobject.bbox[2]);
	            }
	        }
	        else {
	            if (setposition || this.map.getSelectedMarking().id == 'marker') {
	                this.viewSelectedObject(mapobject);
	            }
	        }
	        this.drawcurrobject = mapobject;
	        this.drawselobject = this.drawcurrobject.createcopyForDraw(this.drawcurrobject);

	        if (this.map.options.markingofobjects.selected.fill && this.selected.length > 0 && this.map.getSelectedMarking().id != 'marker') {
	            var drawjson = JSON.parse(JSON.stringify(json));
	            //  удалим стили и назначим цвет выделения (актуально для объектов локального слоя)
	            drawjson.features[0].style = null;
	            drawjson.features[0].properties["stroke"] = this.drawoptionsSelected["stroke"];
	            this.drawsvgDraw(drawjson, clear, select, animate);
	            // После отрисовки меняется id
	            this.drawselobject.gid_svg = drawjson.features[0].properties.id;
	        }
	        else {   // ставим маркер
	            this.map.overlayAppend(mapobject.objectcenter, overlaypoint, true, mapobject.gid, false, false, this.markSingleId, mapobject.name);
	        }

	    },

        // Отрисовать объект на svg холсте
	    drawsvgDraw: function (drawjson, clear, select, animate) {
	        if (!drawjson || !drawjson.features || drawjson.features.length == 0)
	            return;

	        if (!this.svgDraw)
	            this.init();

            var options, svg, type;
	        // Назначим параметры отрисовки из настроек
            if (select) {
                options = JSON.parse(JSON.stringify(this.drawoptionsSelected));
                svg = this.svgDrawSelected;
            }
            else {
                options = JSON.parse(JSON.stringify(this.drawoptions));
                svg = this.svgDraw;
            }

	        // изменим опции для точечных
	        for (var i = 0; i < drawjson.features.length; i++) {
	            type = drawjson.features[i].geometry.type.toLowerCase().indexOf('point');
	            if (type >= 0) { // если точечный
	                if (!drawjson.features[i]["style"]) {
	                    drawjson.features[i].style = JSON.parse(JSON.stringify(options));
	                }
	                drawjson.features[i].style["stroke-opacity"] = "0.95";
	                drawjson.features[i].style["fill-opacity"] = "0.95";
	            }
	            else {
	                if (drawjson.features[i].style) {
	                    drawjson.features[i].style = options;
	                }

	            }
	        }
	        svg.draw(drawjson, !clear, options, true, animate);
	    },

        // Стереть объект с холста
	    cleardrawobject: function (mapobjectId, select) {
	        if (select) {
	            if (this.svgDrawSelected)
	                this.svgDrawSelected.deleteObject(mapobjectId);
	        }
	        else {
	            if (this.svgDraw)
	                this.svgDraw.deleteObject(mapobjectId);
	        }
	    },

        // Стереть все объекты с холста
        clearDraw: function () {
            if (this.svgDraw)
                this.svgDraw.clearDraw();
        },

        // Стереть все объекты с холста
        clearDrawSelect: function () {
            if (this.svgDrawSelected)
                this.svgDrawSelected.clearDraw();
        },

        // Стереть все объекты с холста
        clearDrawAll: function () {
            this.clearDraw();
            this.clearDrawSelect();
            this.map.placemarkRemove(this.id);
        },

        // добавить в список выбранных слоев и объектов
        // maplayerid - идентификатор слоя в Service SE
        addselect: function (gmlid, maplayerid) {
            if (this.layers.indexOf(maplayerid) == -1)
                this.layers.push(maplayerid);
            if (this.selected.indexOf(gmlid) == -1)
                this.selected.push(gmlid);
            return;
        },

        // удалить объект из списка выбранных объектов
        removeselect: function (gmlid) {
            var count = this.selected.length;
            for (var i = count-1; i >= 0; i--) {
                 if (gmlid == this.selected[i]) {
                    this.selected.splice(i, 1);
                    return true;
                }
            }
        },

        // показать на карте объект из списка выбранных объектов по идентификатору или описанию объекта
        // (функция центрирует карту по координатам центра объекта)
        // @param object {String или GWTK.mapobject} - объект карты
        // при ошибке возвращает `false`, иначе - `true`
        viewSelectedObject: function (object) {
            if (!this.map) {
                console.log("GWTK.selectedFeatures.viewSelectedObject. " + w2utils.lang("Not defined a required parameter") + " Map.");
                return false;
            }
            var mapObject = null;
            if (object instanceof GWTK.mapobject) {
                if ($.inArray(object, this.mapobjects) > -1) {
                    mapObject = object;
                }
                else if ($.inArray(object.gid, this.selected) > -1) {
                    mapObject = object;
                }
            }
            else if (typeof (object) == 'String') {
                mapObject = this.findobjectsByGid(object);
            }

            if (!mapObject || !mapObject.objectcenter) {
                return false;
            }

            if (!mapObject.bbox) {
                mapObject.setbbox();
            }

            var windowBounds = this.map.getMapBboxGeo();
            if (mapObject.bbox && windowBounds) {
                var SW = GWTK.toLatLng(mapObject.bbox[1], mapObject.bbox[0]),
                    NE = GWTK.toLatLng(mapObject.bbox[3], mapObject.bbox[2]),
                    contains = false;
                if (SW && NE) {
                    //contains = windowBounds.contains(GWTK.latLngBounds(SW, NE));
                    contains = windowBounds.intersects(GWTK.latLngBounds(SW, NE));
                    if (contains && this.map.getSelectedMarking().id == 'marker'){
                        contains = windowBounds.contains(mapObject.objectcenter);
                    }
                }
                if (!contains) {
                    this.map.setViewport(mapObject.objectcenter);
                }
            }
            else {
                this.map.setViewport(mapObject.objectcenter);
            }
            return true;
        },

        addLocalLayersFeatures: function () {
            if (!this.map) {
                console.log("GWTK.selectedFeatures. " + w2utils.lang("Not defined a required parameter") + " Map.");
                return;
            }
            var selectedFeatures = this;
            var layers = [], objects = [];
            var allLayers = this.map.tiles.getSelectableLayersArray();                                   // видимые слои с выбором объектов

            for (var i = 0; i < allLayers.length; i++) {
                var ltype = allLayers[i].getType();

                if (ltype !== 'svg' && ltype !== 'geomarkers') continue;
                if (!allLayers[i].selectedObjects || allLayers[i].selectedObjects.length == 0) continue;  // нет отобранных объектов
                layers.push(allLayers[i].xId);
                for (var j = 0; j < allLayers[i].selectedObjects.length; j++) {
                    selectedFeatures.addJsonObject(allLayers[i].GeoJSON, allLayers[i].selectedObjects[j], allLayers[i]);
                    var json = allLayers[i].GeoJSON["features"][allLayers[i].selectedObjects[j]];
                    objects.push(json["properties"]["id"]);
                }
            }
            if (layers.length > 0 && objects.length > 0) {
                [].push.apply(selectedFeatures.layers, layers);
            }

            return;
        },

        // Выделить отобранные объекты
        // method drawSelectedObjects
        // param clear {Boolean} сбросить ранее отобранные объекты
        // param object {GWTK.mapobject} объект карты
        // param saveposition {Boolean} `true` - сохранить положение карты
        drawSelectedObjects: function (clear, object, saveposition) {
            if (!this.map) {
                console.log("GWTK.selectedFeatures.drawSelectedObjects " + w2utils.lang("Not defined a required parameter") + " Map.");
                return;
            }

            var setposition = true;                                                    // центрировать карту по объекту
            if (typeof saveposition != 'undefined') {
                if (saveposition) setposition = false;                                 // если указано, не меняем положение карты при выделении объектов
            }

            //  Сотрем ранее отрисованные объекты
            var nomarker = this.map.options.markingofobjects.selected.fill && this.selected.length > 0 && this.map.getSelectedMarking().id != 'marker';
            if (clear && nomarker)
                this.clearDrawAll();

            var mapObject = null, overlaypoint;
            if (object instanceof GWTK.mapobject) {
                if ($.inArray(object, this.mapobjects) > -1) {                         // если отобраны геообъекты стороннего сайта (адресный )
                    mapObject = object;
                }
                else if ($.inArray(object.gid, this.selected) > -1) {
                    mapObject = object;
                }
            }
            if (mapObject != null) {                                                   // выделяем один объект
                this.drawcontour(mapObject, clear, true, setposition, false);
                return;

            }

            //выделяем все объекты в mapobjects
            this.clearDrawAll();
            //if (this.map.options.markingofobjects.selected.fill && this.selected.length > 0 && this.map.getSelectedMarking().id != 'marker') {
            if (nomarker) {
                this.drawGEOJSON(this.mapobjectsToGeoGSON(), true, true);
            }
            else {
                for (var i = 0; i < this.mapobjects.length; i++) {
                    overlaypoint = GWTK.tileView.geo2pixelOffset(this.map, this.mapobjects[i].objectcenter);
                    if (this.selected.length == 0) {
                        this.map.overlayAppend(this.mapobjects[i].objectcenter, overlaypoint, true, this.mapobjects[i].gid, false, false, this.id, this.mapobjects[i].name);
                    }
                    else {
                        this.map.overlayAppend(this.mapobjects[i].objectcenter, overlaypoint, true, this.mapobjects[i].gid, true, null, this.id, this.mapobjects[i].name);
                    }
                }
            }
        },

        // Отрисовать объекты из geoJSON
        drawGEOJSON: function (geoJSON, clear, select) {
            this.drawsvgDraw(geoJSON, clear, select);
        },

        // объекты карты в geojson
        // clear - удалить существующий geoJSON объектов
        mapobjectsToGeoGSON: function (clear) {
            var json,
                geoJSON = {
                "type": "FeatureCollection",
                //"bbox": json.bbox,
                "features": []
            };

            var len = this.mapobjects.length;
            for (var i = 0; i < len; i++) {
                if (!this.mapobjects[i])
                    continue;
                if (clear)
                    this.mapobjects[i].oJSON = null;
                json = this.mapobjects[i].oJSON ? this.mapobjects[i].oJSON : this.mapobjects[i].saveJSON();
                geoJSON["features"].push(json["features"][0]);
            }
            return geoJSON;
        },

        // Обновить ссылки на объекты mapobject в
        updateLink: function (mapobjects) {
            // удалим информацию об объектах
            this.clearDrawAll();
            this.selected = [];
            this.layers = [];

            if (!mapobjects) return;
            if (mapobjects instanceof Array)
                this.mapobjects = mapobjects;
            else {
                if (mapobjects instanceof GWTK.mapobject)
                    this.mapobjects.push(mapobjects);
            }
            // Обновим select
            if (this.mapobjects.length > 0) {
                for (var i = 0; i < this.mapobjects.length; i++) {
                    this.selected.push(this.mapobjects[i].gid);
                    this.selectedLayers[this.mapobjects[i].maplayerid] = true;
                }
            }
        },

        // @method compare
        // Сравнение элементов массива объектов для сортировки Array.prototype.sort()
        // в порядке [точки, линии, площади]
        // @param a, b {GWTK.mapobject, GWTK.mapobject} объекты карты
        // @return {Number} 0 - совпадение, -1 a < b, 1 a > b
        compare: function (a, b) {
            if (typeof a == "undefined" || typeof b == "undefined") {
                return 0;
            }
           var t1 = a.spatialposition,
               t2 = b.spatialposition
            if (t1 && t2) {
                var p1 = (t1.indexOf('point') > -1 || t1.indexOf('title') > -1),
                    p2 = (t2.indexOf('point') > -1 || t2.indexOf('title') > -1);
                if (p1) {
                    if (p2) {
                        return 0;
                    }
                    return -1;
                }
                if (p2) {
                    return 1;
                }
                var l1 = (t1.indexOf('linestring') > -1),
                    l2 = (t2.indexOf('linestring') > -1);
                if (l1) {
                    if (l2) {
                        return 0;
                    }
                    return -1;
                } else if (l2) {
                    return 1;
                }
            }
            return 0;
       },

        // Установить общие параметры выделения объектов
        // @method _setDrawOptionsSelected
       _setDrawOptionsSelected: function(){
           if (!this.map) {return;}
           if (this.map.options.markingofobjects.fill.filltype.outline.selected) {
               this.drawoptionsSelected.fill = 'none';
           } else {
               this.drawoptionsSelected.fill = '#' + this.map.options.markingofobjects.fill.style.color;
           }
           this.drawoptionsSelected['fill-opacity'] = this.map.options.markingofobjects.fill.style.opacity;
           this.drawoptionsSelected.stroke = '#' + this.map.options.markingofobjects.fill.style.linecolor;
           this.drawoptionsSelected['stroke-opacity'] = 0.75;
           if (this.map.getSelectedStrokeWidth()) {
                this.drawoptionsSelected['stroke-width'] = this.map.getSelectedStrokeWidth().id;
           }
       }


    }

}
