/************************************ Нефедьева О. *** 30/11/20 ****
 ************************************* Соколова Т.О *** 13/08/19 ****
 ************************************* Полищук Г.В. *** 14/01/19 ****
 ************************************* Гиман Н.Л.   *** 05/06/17 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       API функции карты                          *
 *                            GWTK SE                               *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {
    /**
     * Поиск и выделение объектов карты по идентификаторам объектов
     * @method mapSearchObjectsByIdList
     * @param map {Object} карта GWTK.Map
     * @param layers {String} список идентификаторов слоев сервиса через запятую
     * @param ids {String} список идентификаторов объектов карты в виде gml.id через запятую
     * @param centering {bool} центрировать ли объект
     */
    GWTK.mapSearchObjectsByIdList = function(map, layers, ids, centering) {
        if (!map || !layers || !ids) {
            console.log("GWTK.mapSearchObjectsByIdList. " + w2utils.lang("Not defined a required parameter") + " map, layers or ids!");
            return;
        }
        var idfeature = [],
            idLayers = [], map = map, centering = centering;
        
        if (Array.isArray(ids)) {
            idfeature = ids.toString();
        }else{
            idfeature = ids;
        }
        if (Array.isArray(layers)) {
            idLayers = layers.toString();
        }else{
            idLayers = layers;
        }
        
        var uri = "?mapid=1&objcenter=2&objlocal=0,1,2,4&semanticname=1&area=1&semantic=1&start_index=0&layer_id=" + idLayers + "&idlist=" + idfeature + "&outcrs=4326";
        
        if (!$.isEmptyObject(map.options.maxBounds)) {
            uri += "&bbox=" + map.options.maxBounds.toApiString();
        }
        
        var wfs = new GWTK.WfsRestRequests(map);
        
        wfs.restMethod("GetFeature", uri, null, function(data) {
            if (map) {
                if (centering && map.selectedObjects.mapobjects.length > 0) {
                    map.selectedObjects.viewSelectedObject(map.selectedObjects.mapobjects[0]);
                }
                map.selectedObjects.drawSelectedObjects(true, null, false);
            }
        });
    };
    
    /**
     * Поиск данных по идентификаторам выделенных объектов карты
     * @method mapSearchDataByIdList
     * @param map {Object} карта GWTK.Map
     * @param callback {Function} функция поиска по списку идентификаторов объектов
     * @param context {Object} контекст вызова callback-функции
     */
    GWTK.mapSearchDataByIdList = function(map, callback, context) {
        
        if (!map || typeof callback !== 'function') {
            console.log("GWTK.mapSearchDataByIdList. " + w2utils.lang("Not defined a required parameter") + " map or callback");
            return;
        }
        var map = map, callback = callback;
        var ids = map.selectedObjects.getselection();
        if (context) {
            callback.call(context, ids);
        }else{
            callback(ids);
        }
    };
  
    /**
     * Установить фильтр отображения слоя
     * @method mapSetLayerViewFilter
     * @param map {Object} карта GWTK.Map
     * @param layerid {String} уникальный идентификатор слоя карты
     * @param filter {object} фильтр объектов карты, JSON, GWTK.LayerObjectFilter
     * @return {boolean} `false` ошибка параметров
     */
    GWTK.mapSetLayerViewFilter = function(map, layerid, filter) {
        if (!map || !layerid) {
            console.log("GWTK.mapSetLayerViewFilter. " + w2utils.lang("Not defined a required parameter") + " map or layerid");
            return false;
        }
        if ($.isEmptyObject(filter) || filter['idlist'] === undefined) {
            return false;
        }
        var maplayer = map.tiles.getLayerByxId(layerid);
        if (maplayer == null || maplayer.getType() !== 'wms') {
            return false;
        }
        
        if (typeof maplayer.setGmlList == 'function') {
            return maplayer.setGmlList(filter.idlist);
        }
        return false;
    };
    
    /**
     * Очистить фильтр отображения слоя
     * @method mapClearLayerViewFilter
     * @param map {Object} карта GWTK.Map
     * @param layerid {String} уникальный идентификатор слоя карты
     */
    GWTK.mapClearLayerViewFilter = function(map, layerid) {
        if (!map || !layerid) {
            console.log("GWTK.mapSetLayerViewFilter. " + w2utils.lang("Not defined a required parameter") + " map or layerid");
            return false;
        }
        
        var maplayer = map.tiles.getLayerByxId(layerid);
        if (maplayer == null || maplayer.getType() !== 'wms') {
            return false;
        }
        
        if (typeof maplayer.clearGmlList == 'function') {
            maplayer.clearGmlList();
            return true;
        }
        return false;
    };
    
    /**
     * Создать окно карты во всплывающем окне с возможностью поиска объекта по адресу или по координате
     * @method mapSearchDataByIdList
     * @param options {Object} - объект с параметрами след вида
     * {
     *     address - адрес объекта,
     *     callBack - функция обратного вызова,
     *     coord - координаты объекта,
     *     title - аголовок окна,
     *     objectName - название объекта
     * }
     * @param optionsMap - параметры карты
     * @returns {boolean}
     */
    GWTK.mapShowMapInPopup = function(options, optionsMap) {
        GWTK.PopupMapControl.prototype.mapShowMapInPopup(options, optionsMap);
    };
    
    /**
     * Создать легенду для графических слоев
     * @method mapCreateLegend
     * @param params{Object} - объект с полем map и ссылкой на экземпляр карты
     * @returns {*} объект с методами управления окном
     */
    GWTK.mapCreateLegend = function(params) {
        return GWTK.PopupMapControl.prototype.mapCreateLegend(params);
    };
    
    /**
     * Создание/Редактирование геометрии объекта карты
     * @method mapCreationObjectGeometry
     * @param map {Object} - карта GWTK.Map
     * @param mapobjectJSON {Object}  - объект карты в формате geojson
     * @param param {Object}  - параметры рисования {
     * "box": true   - наличие габаритной рамки для вращения и мастабирования при создании или редактировании геометрии объекта
     * }
     * @returns  - true, если процесс создания/редактирование начался
     * при завершении операции создания/редактирования инициируется триггер creationobjectgeometry {
     * "type": "creationobjectgeometry"
     * "action":  'ok' или "cancel" в зависимости от завершения
     * "mapobject" : объект карты в формате geojson при action = "ok"
     *}
     * Пример обработки триггера
     *    $(map.eventPane).one('creationobjectgeometry', function () {
     *   // действия пользователя
     *	});
     */
    GWTK.mapCreationObjectGeometry = function(map, mapobjectJSON, param) {
        if (!map || map instanceof GWTK.Map == false || !mapobjectJSON)
            return;
        // Запустим обработчик
        var action = new GWTK.CreationObjectGeometryAction(map, mapobjectJSON, param);
        if (!action.error) {
            if (map.setAction(action)) {
                return true;
            }
            action.close();
        }
    };
    
    /**
     * Запрос geojson объекта круг(окружность)
     * @method mapGetCircleGeoJson
     * @param map {Object} - карта GWTK.Map
     * @param type - тип объекта ('Polygon' или 'Line')
     * @param center (Array[B,L]) - центр окружности массив B, L (широта, долгота)
     * @param radius (Float) - радиус в метрах
     * @param properties (Object) - ассоциативный массив, добавляемый в свойства (properties) geojson
     * @return {Object geojson}
     */
    GWTK.mapGetCircleGeoJson = function(map, type, center, radius, properties) {
        if (!map || map instanceof GWTK.Map === false ||
            !center || center instanceof Array === false || !radius)
            return;
        var mapobj = new GWTK.mapobject(map, '0'), center = new GWTK.Point(center[0], center[1]);
        if (mapobj.error) return;
        mapobj.geometry.spatialposition = mapobj.spatialposition = (type && ((type = type.toLowerCase()) === 'polygon') || type === 'line') ? type : 'polygon';
        
        if (mapobj.geometry.createcircle(center, radius)) {
            mapobj.setbbox();
            var geojson = mapobj.saveJSON();
            if (geojson && geojson.features && geojson.features.length > 0) {
                geojson.features[0]['properties']["objectcenterx"] = center[0];
                geojson.features[0]['properties']["objectcentery"] = center[1];
                geojson.features[0]['properties']["radius"] = radius;
                if (properties) {
                    for (var key in properties) {
                        if (properties.hasOwnProperty(key)) {
                            geojson.features[0]['properties'][key] = properties[key];
                        }
                    }
                }
            }
            return geojson;
        }
    };
    
    
    /**
     * Работа режима редактирования объекта редактора карты в автономном режиме
     * @method mapEditorAutonomous_Editing
     * @param map {Object} - карта GWTK.Map
     * @param mapobjectJSON {Object}  - объект карты в формате geojson
     * @param param {Object} Параметры редактора GWTK.EditorParameters
     * @returns  - {Object GWTK.mapeditorTask} задача mapeditorTask
     * при завершении операции создания/редактирования инициируется триггер mapeditorAutonomous {
     * "type": "mapeditorAutonomous"
     * "action":  'start', 'save' или "cancel"
     * "mapobjects" : объекты карты, подлежащие сохранению, в формате geojson при action = "save"
     * "sender" : объект, инициализировавший событие
     *}
     * Пример обработки триггера
     *    $(map.eventPane).one('mapeditorAutonomous', function () {
     *   // действия пользователя
     *	});
     */
    GWTK.mapEditorAutonomous_Editing = function(map, mapobjectJSON, param) {
        if (!map || !map.mapeditor) return;
        // Запустить редактор
        return map.mapeditor.startAutonomous(map, mapobjectJSON, param, 'edit');
    };
    
    
    /**
     * Работа режима редактирования объекта редактора карты в автономном режиме
     * @method mapEditorAutonomous_Editing
     * @param map {Object} - карта GWTK.Map
     * @param mapobjectJSON {Object}  - объект карты в формате geojson
     * @param param {Object} Параметры редактора GWTK.EditorParameters
     * @returns  - {Object GWTK.mapeditorTask } задача mapeditorTask
     * при завершении операции создания/редактирования инициируется триггер mapeditorAutonomous {
     * "type": "mapeditorAutonomous"
     * "action":  'start', 'save' или "cancel"
     * "mapobjects" : объекты карты, подлежащие сохранению, в формате geojson при action = "save"
     * "sender" : объект, инициализировавший событие
     *}
     * Пример обработки триггера
     *    $(map.eventPane).one('mapeditorAutonomous', function () {
     *   // действия пользователя
     *	});
     */
    GWTK.mapEditorAutonomous_Creating = function(map, mapobjectJSON, param) {
        if (!map || !map.mapeditor) return;
        return map.mapeditor.startAutonomous(map, mapobjectJSON, param, 'create');
    };
    
    /**
     * Получить коэффициент масштабирования карты, при котором экстент полностью помещается в окне
     * (вписать географический экстент в окно)
     * Если для карты установлен максимальный масштаб отображения, он не превышается.
     * @method getZoomByFrame
     * @param  map {Object} ссылка на карту
     * @param  width {Number} ширина окна карты в пикселах
     * @param  height {Number} высота окна карты в пикселах
     * @param  a,b {Number, Number} геодезичесие координаты юго-западного угла прямоугольной области (градусы)
     * @param  c,d {Number, Number} геодезичесие координаты северо-восточного угла прямоугольной области (градусы)
     * @param roundedup {bool} признак округления масштаба в большую сторону.
     * @return {Number} коэффициент масштабирования в текущей пирамиде тайлов или `null` при ошибке
     */
    GWTK.mapGetZoomByFrame = function(map, width, height, a, b, c, d, roundedup) {
        if (!map) return;
        var max_latitude = 85.1;
        var matrix = GWTK.TileMatrixSets[map.options.tilematrixset];
        if (matrix && matrix.max_latitude)
            max_latitude = matrix.max_latitude;
        var tilesize = matrix.tileWidth ? matrix.tileWidth : 256;
        
        var sign = 1;
        a < 0 ? sign = -1 : sign = 1;
        if (Math.abs(a) > max_latitude) a = max_latitude * sign;
        c < 0 ? sign = -1 : sign = 1;
        if (Math.abs(c) > max_latitude) c = max_latitude * sign;
        
        var sw = GWTK.toLatLng(a, b);
        var ne = GWTK.toLatLng(c, d);
        if (!sw || !ne)
            return;
        
        var bounds = new GWTK.LatLngBounds(sw, ne);               // габариты прямоугольной области
        if (!bounds)
            return;
        var geocenter = bounds.getCenter(), zoom, wsize,          // центр прямоугольной области
            maxzoom = matrix.scales.length;
        if (map.options.maxzoom) maxzoom = map.options.maxzoom; // предел масштабирования
        
        // габариты прямоугольной области в метрах
        var xyBounds = GWTK.projection.latLngBounds2Bounds(bounds, map.options.crs),
            dx = Math.abs(xyBounds.max.x - xyBounds.min.x),     // ширина прямоугольной области (m)
            dy = Math.abs(xyBounds.max.y - xyBounds.min.y);     // высота прямоугольной области (m)
        
        zoom = 0;
        var equator = 2 * Math.PI * GWTK.tileView.axisMajor,
            pixel_size = equator / tilesize,                    // m/pix, zoom=0
            m_zoom_W = pixel_size * width,                   // m в окне по горизонтали при zoom=0
            m_zoom_H = pixel_size * height;                  // m в окне по вертикали при zoom=0
        
        zoom = Math.max(m_zoom_W / dx, m_zoom_H / dy);
        //zoom = parseInt(zoom);
        if (roundedup)
            zoom = Math.floor(Math.log(zoom) / Math.log(2) + 1);
        else
            zoom = Math.floor(Math.log(zoom) / Math.log(2) - 1);
        
        if (zoom < 2) zoom = 2;
        if (zoom > maxzoom) zoom = maxzoom;                 // берем максимально возможный, если превышение
        
        return zoom;
    };
    
    /**
     * Подключить пользовательские элементы управления
     * @param map {Object} ссылка на карту
     * @param list {Array} список элементов управления, массив элементов типа GWTK.UserControlType
     * @param apply {boolean} признак инициализации, `true` - выполнить инициализацию после создания
     */
    GWTK.mapAttachUserControls = function(map, list, apply) {
        if (!map) return;
        
        if (!Array.isArray(list) || list.length == 0) {
            return;
        }
        var plagins = list, i, len;
        for (i = 0; len = plagins.length, i < len; i++) {
            var control = plagins[i];
            if (typeof control === 'indefined' || typeof control.options === 'indefined' || !control.name) {
                var mess = '';
                if (control && control.alias) {
                    mess = control.alias;
                }
                console.log('GWTK.mapAttachUserControls. ' + mess + ' ' + w2utils.lang("Component not plugged."));
                continue;
            }
            if (!control.alias) {
                control.alias = '';
            }
            var proto = {};
            if (typeof control.options === 'string') {
                proto = window[control.options] || GWTK[control.options];
                if (!proto) {
                    console.log('GWTK.mapAttachUserControls. ' + control.alias + ' ' + w2utils.lang("Not defined a required parameter") + " options.");
                    continue;
                }
            }else
                proto = control.options;
            
            proto.title = control.alias || proto.title;
            
            if (typeof GWTK.mapCreateUserControl == 'function') {
                GWTK.mapCreateUserControl(control.name, map, proto, apply);
            }
        }
        
        return;
    };
    
    /**
     * Установить уровень прозрачности изображения слоя
     * @method GWTK.mapSetLayerOpacity
     * @param map {Object} объект карты
     * @param id {String} уникальный идентификатор слоя в карте
     * @return {Number} значение css прозрачности
     */
    GWTK.mapSetLayerOpacity = function(map, id) {
        
        if (!map || typeof id === 'undefined') {
            return;
        }
        
        var opacity = false,
            layer = map.tiles.getLayerByxId(id),
            param = GWTK.Util.getStoredParameter("opacitySettings");
        
        if (!layer || !param) {
            return;
        }
        
        try {
            param = JSON.parse(param);
            if (param[id]) {
                opacity = parseFloat(param[id]['value']);
            }
        } catch (e) {
        }
        
        var css_opacity = layer.initOpacity(opacity);
        
        layer.setOpacity(css_opacity);
        
        return css_opacity;
    };
    
    
    //*
    //* КАРТА И СЛОИ КАРТЫ
    //*
    
    /**
     * Создать карту
     * @method GWTK.mapCreateMap
     * @param html {Object} HTML элемент (div) для размещения карты
     * @param param {Object} параметры создания, JSON {'options': GWTK.MapParameters}
     * @return {GWTK.Map} объект карты или false при ошибке
     */
    GWTK.mapCreateMap = function(html, param) {
        
        var fn_name = 'GWTK.mapCreateMap: ',
            map = false;
        
        if (!param || typeof param !== 'object') {
            console.log(fn_name + w2utils.lang("Not defined a required parameter") + " param.");
            return false;
        }
        
        if (!param.options) {
            console.log(fn_name + w2utils.lang("Not defined a required parameter") + " param.options");
            return false;
        }
        try {
            var param = param;
            param.options.id = param.options.id || GWTK.Util.createGUID();
            
            map = new GWTK.Map($(html).attr('id'), param.options);
            if (!map.mapPane) {
                map = null;
            }
        } catch (e) {
        }
        
        return map;
    };
    
    /**
     * Добавить слой карты
     * @method GWTK.mapAddLayer
     * @param map  (GWTK.Map) - объект Карта
     * @param param {Object} параметры, JSON {'layer':GWTK.LayerParameters} // параметры слоя
     * @return {Object} - объект слоя, при ошибке возвращает `false`
     */
    GWTK.mapAddLayer = function(map, param) {
        var layer = false,
            fn_name = 'GWTK.mapAddLayer: ';
        
        if (!map || map instanceof GWTK.Map === false) {
            console.log(fn_name + w2utils.lang("Not defined a required parameter") + " map.");
            return false;
        }
        if (!param || typeof param !== 'object' || !param.layer) {
            console.log(fn_name + w2utils.lang("Not defined a required parameter") + " param.");
            return false;
        }
        
        try {
            if (param.layer.legend && !$.isEmptyObject(param.layer.legend)) {
                var legend = param.layer.legend;
                param.layer.legend = legend.legend;
                param.layer.shortlegend = legend.shortlegend || 0;
            }
            
            layer = map.openLayer(param.layer);
            
            if (layer) {
                if (layer.getType() === 'wms' && !map.options.mergewmslayers) {
                    map.tiles.wmsManager.wmsDrawing();
                }
                GWTK.mapSetLayerOpacity(map, layer.xId);
            }
        }
        catch (e) {
            console.log(e);
        }
        
        return layer;
    };
  
    /**
     * Добавить слой в дерево состава карты
     * @method GWTK.mapAddLayerToTree
     * @param map  (GWTK.Map) - объект Карта
     * @param layer (Object) -  объект Слой
     * @param param {Object} параметры, JSON {'tree':{ parentId: иднтификатор родительского узла, node: GWTK.TreeNodeParameter} }
     * @return {Object} - параметры добавленного узла, при ошибке возвращает `false`
     */
    GWTK.mapAddLayerToTree = function(map, layer, param) {
        var fn_name = 'GWTK.mapAddLayerToTree: ';
        
        if (!map || map instanceof GWTK.Map === false) {
            console.log(fn_name + w2utils.lang("Not defined a required parameter") + " map.");
            return false;
        }
        if (!layer || typeof layer !== 'object') {
            console.log(fn_name + w2utils.lang("Not defined a required parameter") + " layer.");
            return false;
        }
        if (!param || typeof param !== 'object' || !param.tree || typeof param.tree !== 'object') {
            console.log(fn_name + w2utils.lang("Not defined a required parameter") + " param.");
            return false;
        }
        
        try {
            // Найдем инструмент для отображения списка слоев
            var maptree,
                tool = map.mapTool('mapcontent');
            if (tool) {
                maptree = tool.getName();
                if (param.tree.node && typeof param.tree.node === 'object') {
                    var nodeparam = param.tree.node;
                    var node = {
                        "img": nodeparam.img,
                        "id": nodeparam.id || layer.xId,
                        "group": nodeparam.group,
                        "clickable": nodeparam.clickable,
                        "gClickable": nodeparam.clickable,
                        "expanded": (layer.options.legend) ? false : nodeparam.expanded,
                        "text": nodeparam.text || layer.alias,
                        "hint": nodeparam.hint || layer.alias,
                        "isLayer": true,
                        "remove": nodeparam.remove,
                        "save": nodeparam.save
                    };
                    
                    node.showsettings = map.options.showsettings || layer.options.showsettings;
                    if (node.remove || node.save) {
                        node.eventPanelId = map.eventPane.id;
                        node.subtype = node.id;
                        if (layer instanceof GWTK.graphicLayer && node.save) {
                            node.saveFileName = layer.alias;
                        }
                    }
                    
                    // Добавим узел
                    var parentId = param.tree.parentId || null,
                        treenode = tool.addNode(parentId, node, true);
                    
                    // Добавить div для загрузки легенды
                    var legend = layer.options.legend && typeof layer.options.legend == 'object' ? layer.options.legend.legend : layer.options.legend;
                    if (treenode && legend) {
                        w2ui[tool.name].add(layer.xId, {
                            "id": 'legendholder_' + layer.xId,
                            "group": false,
                            "expanded": false
                        });
                    }
                    
                    if (layer.visible) {
                        tool.setLayersVisibility();
                    }
                    
                    return treenode;
                    
                }
            }
        } catch (e) {
        }
        
        return false;
    };
   
    /**
     * Cинхронизировать загруженные данные
     * @method GWTK.mapSynchronizeData
     * @param map GWTK.Map) - объект Карта
     * @return {boolean}
     */
    GWTK.mapSynchronizeData = function(map) {
        var fn_name = 'GWTK.mapSynchronizeData: ';
        
        if (!map || map instanceof GWTK.Map === false) {
            console.log(fn_name + w2utils.lang("Not defined a required parameter") + " map.");
            return false;
        }
        
        try {
            // Пройдемся по инструментам
            var tool = map.mapTool("mapeditor");
            if (tool) {
                if (map.options.settings_mapEditor) {
                    tool.setOptions(map.options.settings_mapEditor);
                }
            }
            tool = map.mapTool("areasearch");
            if (tool) {
                tool.init();
            }
            return true;
        } catch (e) {
        }
        
        return false;
    }
    
    
    /**
     *  ПОИСК И ВЫДЕЛЕНИЕ
     */
    
    /**
     * Установить признак вывода информации об отобранных объектах карты (панели "Объекты карты")
     * @method GWTK.mapSetModeObjectList
     * @param map (GWTK.Map) - объект Карта
     * @param mode - признак отображения панели(“show”/”hide” )
     * @returns {boolean}
     */
    GWTK.mapSetModeObjectList = function(map, mode) {
        var res = false, fn_name = 'GWTK.mapSetModeObjectList: ';
        
        if (!map || map instanceof GWTK.Map === false) {
            console.log(fn_name + w2utils.lang("Not defined a required parameter") + " map.");
            return res;
        }
        if (!mode || (mode !== "show" && mode !== "hide")) {
            console.log(fn_name + w2utils.lang("Not defined a required parameter") + " mode.");
            return res;
        }
        
        try {
            // Найдем класс и выставим признак
            // список объектов карты
            var objectPanel = map.mapTool("objectPanel");
            if (objectPanel) {
                objectPanel.setModeObjectList(mode);
                res = true;
            }
        } catch (e) {
        }
        
        return res;
        
    };
    
    
    /**
     * Cоздать объект для выделения объектов карты
     * @method GWTK.mapCreateSelectedFeatures
     * @param map GWTK.Map) - объект Карта
     * @param param (object) - {draw: GWTK.DrawParameters}
     * @returns {object or boolean} - GWTK.selectedFeatures или false
     */
    GWTK.mapCreateSelectedFeatures = function(map, param) {
        var features = false,
            fn_name = 'GWTK.mapCreateSelectedFeatures: ';
        
        if (!map || map instanceof GWTK.Map === false) {
            console.log(fn_name + w2utils.lang("Not defined a required parameter") + " map.");
            return features;
        }
        
        try {
            features = new GWTK.selectedFeatures(map, param ? param.draw : null);
        } catch (e) {
        }
        
        return features;
    };
    
    
    /**
     * Установить объект отобранных объектов карты для панели выделения объектов
     * @method GWTK.mapSetSelectedObjects
     * @param map (GWTK.Map) - объект Карта
     * @param selectedObjects - класс отобранных объектов  GWTK.selectedFeatures
     * @returns {boolean}
     */
    GWTK.mapSetSelectedObjects = function(map, selectedObjects) {
        var res = false, fn_name = 'GWTK.mapSetSelectedObjects: ';
        
        if (!map || map instanceof GWTK.Map === false) {
            console.log(fn_name + w2utils.lang("Not defined a required parameter") + " map.");
            return res;
        }
        if (!selectedObjects || selectedObjects instanceof GWTK.selectedFeatures === false) {
            console.log(fn_name + w2utils.lang("Not defined a required parameter") + " selectedObjects.");
            return res;
        }
        
        try {
            // Найдем класс и выставим признак
            // список объектов карты
            var objectPanel = map.mapTool("objectPanel");
            if (objectPanel) {
                objectPanel.setSelectedObjects(selectedObjects);
                res = true;
            }
        } catch (e) {
        }
        
        return res;
    };
    
    /**
     * Создать элемент управления Просмотр тематичесих слоев
     * @deprecated
     * @param apply {boolean} флаг создания, `true` - создать
     * @param map {Object} объект карты
     * @param param {Object} объект параметров
     */
    GWTK.mapCreateThematicMapsViewer = function(map, param, apply) {
        
        if (!map || !param ||
            typeof param.sectionsURL == "undefined" ||
            typeof param.sectionsFname == "undefined") {
            console.log("GWTK.mapCreateThematicMapsViewer. " + w2utils.lang("Not defined a required parameter map or param!"));
            return;
        }
        var index = map.getMapTool("thematicmap", true);
        if (index != null) {
            map.maptools[index].destroy();
            map.maptools.splice(index, 1);
        }
        map.options.sectionsURL = param.sectionsURL;
        map.options.sectionsFname = param.sectionsFname;
        
        if (Array.isArray(map.options.controls) && map.options.controls.indexOf("thematicmap") == -1) {
            map.options.controls.push("thematicmap");
        }
        
        if (apply) {
            new GWTK.MapThematic(map).init();
        }
        
        return;
    };
    
    /**
     * Получить семантики слоя
     * @method GWTK.mapGetLayerSemantics
     * @param map - (GWTK.Map) - объект Карта
     * @param ids (string or Array) - идентификатор слоя или массив идентификаторов слоев
     * @return {Array} массив объектов GWTK.LayerSemanticList или `false` при ошибке
     */
    GWTK.mapGetLayerSemanticsEx = function(map, ids, callback) {
        var map = map,
            xid = [],
            urls = [], i, len,
            rest = "?RestMethod=GetLayerSemanticList&InMap=1&Layer=",
            fname = 'GWTK.mapGetLayerSemanticsEx: ';
        
        if (!map) {
            console.log(fname + w2utils.lang("Not defined a required parameter") + " map.");
            return false;
        }
        if (!ids) {
            console.log(fname + w2utils.lang("Not defined a required parameter") + " ids.");
            return false;
        }
        if (typeof ids === 'string') {
            xid.push(ids);
        }else{
            if (Array.isArray(ids)) {
                xid = ids;
            }else{
                console.log(fname + w2utils.lang("Not defined a required parameter") + " ids.");
                return false;
            }
        }
        var token = map.getToken(), tokens = undefined;
        if (token) tokens = [];
        for (i = 0; len = ids.length, i < len; i++) {
            var lay = map.tiles.getLayerByxId(ids[i]);
            if (typeof lay === "undefined") {
                console.log(fname + w2utils.lang("Not defined layer, id =") + " " + ids[i]);
                continue;
            }
            urls.push(GWTK.Util.getServerUrl(lay.options.url) + rest + lay.idLayer);
            if (token && lay.options.token) {
                tokens.push(token);
            }else{
                if (tokens) tokens.push(undefined);
            }
        }
        if (urls.length == 0) {
            return false;
        }
        if (!tokens || tokens.length == 0) {
            tokens = undefined;
        }
        
        GWTK.Util.doPromise(urls, GWTK.bind(_onSemResponse, this), tokens, map);
        
        function _onSemResponse(data, error) {
            
            if (!data || data.length == 0) {
                if (typeof callback == 'function') {
                    callback(false, error);
                }
                return false;
            }
            var list = [], ii, len = data.length;
            for (ii = 0; ii < len; ii++) {                                              // слои
                if (!data[ii].data_url) {
                    continue;
                }
                var idlayer = data[ii].data_url.split("&Layer="),
                    lay = map.tiles.getLayerByIdService(idlayer[1]),
                    keys = [],
                    laysem = { "layerid": lay.xId, "alias": lay.alias, "keys": [] },
                    semantics = data[ii].features, i,
                    ilen = semantics.length, j;
                for (i = 0; i < ilen; i++) {
                    if (!semantics[i].rscsemantic) {
                        continue;
                    }
                    for (j = 0; j < semantics[i].rscsemantic.length; j++) {
                        if ($.inArray(semantics[i].rscsemantic[j].shortname, keys) > -1) continue;
                        keys.push(semantics[i].rscsemantic[j].shortname);
                        laysem.keys.push({
                            "key": semantics[i].rscsemantic[j].shortname,
                            "name": semantics[i].rscsemantic[j].name
                        });
                    }
                }
                list.push(laysem);
            }
            
            if (typeof callback == 'function') {
                callback(list);
            }
            return list;
        };
    };
    
    /**
     * Найти объекты карты по семантике
     * @method GWTK.mapSearchObjectsBySemanticList
     * @param map - (GWTK.Map) - объект Карта
     * @param options {Array} массив JSON's, [GWTK.SemanticsSearchOptions]), параметры поиска (см. mapapitypes.js, по слоям)
     * @return {Boolean} `true` при успешном выполнении, `false` при ошибке
     */
    GWTK.mapSearchObjectsBySemanticList = function(map, options, centering, callback) {
        var map = map,
            uri = "?objcenter=2&objlocal=0,1,2,4&mapid=1&area=1&semantic=1&semanticname=1&getframe=1",
            i, len, j,
            rpclist = [],
            fname = 'GWTK.mapSearchObjectsBySemanticList: ';
        
        if (!map || typeof map.initTools !== 'function') {
            console.log(fname + w2utils.lang("Not defined a required parameter") + " map.");
            return false;
        }
        
        if (!Array.isArray(options)) {
            console.log(fname + w2utils.lang("Not defined a required parameter") + " options.");
            return false;
        }
        
        for (i = 0; len = options.length, i < len; i++) {
            var semfilter = $.extend({}, options[i]);
            semfilter.operations = [];
            for (j = 0; j < options[i].keys.length; j++) {
                semfilter.operations.push("=");
            }
            
            semfilter.logic = "OR";
            var ml = map.tiles.getLayerByIdService(options[i].layerid);
            if (typeof ml === "undefined") {
                continue;
            }
            // параметры для xmlrpc-запроса
            var rpc = GWTK.MapTextSearch.prototype.getLayerSemanticFilter(semfilter);
            rpc.server = GWTK.Util.getServerUrl(ml.options.url);
            
            if (ml.typeNames)
                rpc.typenames = ml.typeNames;
            if (ml.codeList)
                rpc.codelist = ml.codeList;
            
            rpclist.push(rpc);
        }
        
        if (!rpclist.length) {
            return false;
        }
        
        var wfs = new GWTK.WfsRestRequests(map);
        
        wfs.centering = centering;
        
        return wfs.restMethodByList("textsearch", uri, rpclist, callback);
        
    };
    
    /**
     * Запросить семантики слоев карты
     * @method mapGetLayerSemantics
     * @param map {Object} объект карты
     * @param ids (string or Array) - идентификатор слоя или массив идентификаторов слоя
     * @param callBack {Function} функция обратного вызова,
     * @returns {boolean}
     */
    GWTK.mapGetLayerSemantics = function(map, ids, callback) {
        var map = map,
            xid = [],
            list = [],
            
            fname = 'GWTK.mapGetLayerSemantics: ';
        
        if (!map || map instanceof GWTK.Map === false) {
            console.log(fname + w2utils.lang("Not defined a required parameter") + " map.");
            return false;
        }
        if (!ids) {
            console.log(fname + w2utils.lang("Not defined a required parameter") + " ids.");
            return false;
        }
        if (typeof ids === 'string') {
            xid.push(ids);
        }else{
            if (Array.isArray(ids)) {
                xid = ids;
            }else{
                console.log(fname + w2utils.lang("Not defined a required parameter") + " ids.");
                return false;
            }
        }
        
        var countIn = 0, countOut = 0;
        for (let i = 0; i < xid.length; i++) {
            const lay = map.tiles.getLayerByxId(xid[i]);
            if (typeof lay === 'undefined') {
                console.log(fname + w2utils.lang('Not defined layer, id =') + ' ' + xid[i]);
                continue;
            }
            countIn++;
            if (lay && lay.classifier) {
                lay.classifier.getLayerSemantics().then(function(result) {
                    _onSemResponse(result, lay);
                });
            }
        }
        
        function _onSemResponse(semantics, layer) {
            countOut++;
            
            var laysem = { 'layerid': layer.xId, 'alias': layer.alias, 'keys': [] },
                keys = [];
            
            for (var i = 0; i < semantics.length; i++) {
                if ($.inArray(semantics[i].shortname, keys) > -1) {
                    continue;
                }
                keys.push(semantics[i].shortname);
                laysem.keys.push({
                    'key': semantics[i].shortname,
                    'name': semantics[i].name
                });
            }
            list.push(laysem);
            
            if (countIn == countOut) {
                if (typeof callback == 'function') {
                    callback(list);
                }
            }
        }
        
        return true;
    };
    
    /**
     * Получить имена листов карты
     * @method mapGetSheetName
     * @param map {Object} объект карты
     * @param options {Array} параметры слоев сервиса, массив объектов: {"server":url сервиса, "id": id слоя}
     * функция выполняет асинхронные запросы по адресам в массиве, при получении ответа для карты вызывается триггер:
     * trigger({ "type": "sheetname", "server": url сервиса, "id": id слоя, "status":"ok"/"error" }
     */
    GWTK.mapGetSheetName = function(map, options) {
        var map = map, i,
            idlist = options,
            fname = 'GWTK.mapGetSheetName: ';
        
        if (typeof map === 'undefined' || !map.hasOwnProperty('maptools')) {
            console.log(fname + w2utils.lang("Not defined a required parameter") + " map.");
            return false;
        }
        
        if (!Array.isArray(idlist) || idlist.length == 0) {
            console.log(fname + w2utils.lang("Not defined a required parameter") + " options.");
            return false;
        }
        
        var onsheetname = function(data, map, url) {
            var _url = url || "";
            if (!data || data == "error") {
                console.log(fname + w2utils.lang("Failed to get data") + " " + _url);
                $(map.eventPane).trigger({ "type": "sheetname", "server": _url, "id": "", status: "error" })
                return;
            }
            var result = data;
            if ($.isEmptyObject(result) || result.sheets.length == 0 || !result.layerId) {
                console.log(fname + w2utils.lang("Failed to get data") + " " + _url);
                $(map.eventPane).trigger({ "type": "sheetname", "server": _url, "id": "", "status": "error" })
                return;
            }
            if (!map.tiles.sheetNamesList.getElement(result.server, result.layerId)) {
                map.tiles.sheetNamesList.addElement({
                    "server": result.server, "layerId": result.layerId,
                    "sheets": result.sheets
                });
            }
            $(map.eventPane).trigger({ "type": "sheetname", "server": result.server, "id": result.layerId, "status": "ok" })
            return;
        };
        
        for (i = 0; i < idlist.length; i++) {
            if (!idlist[i].hasOwnProperty('server') || !idlist[i].hasOwnProperty('id')) {
                console.log(fname + w2utils.lang("Input data error") + " " + idlist[i]);
                onsheetname('error', map, '');
                continue;
            }
            if (map.tiles.sheetNamesList.getElement(idlist[i].server, idlist[i].id)) {
                $(map.eventPane).trigger({
                    "type": "sheetname", "server": idlist[i].server, "id": idlist[i].id,
                    "status": "ok"
                });
                continue;
            }
            GWTK.Util.getSheetNameForLayer_(idlist[i].server, idlist[i].id, map, onsheetname);
        }
    };
}

