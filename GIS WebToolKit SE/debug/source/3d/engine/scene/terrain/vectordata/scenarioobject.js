/************************************** Железнякова Ю 12/02/2021 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Класс сценария движущегося объекта                    *
 *                                                                  *
 *******************************************************************/
"use strict";
import GeoJSON from '~/utils/GeoJSON';
import Trigonometry from '~/3d/engine/core/trigonometry';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { ProjectionCollection } from '~/3d/engine/core/geometry/projection';
import ColorMethods from '~/3d/engine/utils/colormethods';
import { VIEWTYPE } from '~/3d/engine/worker/workerscripts/object3dtemplate';
import { LOCALE } from '~/3d/engine/worker/workerscripts/parse3dobject';
import { mat4, vec3 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс сценария движущегоя объекта
     * @class GWTK.gEngine.Scene.ScenarioObject
     * @constructor GWTK.gEngine.Scene.ScenarioObject
     * @param scenarioName{String} название сценария
     * @param objectValue {Object} параметры объекта
     * @param routeCoordination {array} geoJson
     * @param map {Object} карта
     * @param map3dData
     * @param coefSpeedScenario - коэффициент скорости воспроизведения сценария
     * @param rscName - классификатор
     * @param url_scenario - url к сервису сценария
     */
    GWTK.gEngine.Scene.ScenarioObject = function(scenarioName, objectValue, routeCoordination, map, map3dData, coefSpeedScenario, rscName, url_scenario) {
        this._id = Date.now() * Math.random();
        this.counter = 1;
        this.objectValue = objectValue;
        this.routeCoord = routeCoordination.slice();
        this.trackCoord = routeCoordination.slice();
        this.coordinates = [];
        this.trailCoord = [];
        this._map = map;
        this.rscName = rscName;
        this.url_scenario = url_scenario;
        this._map3dData = map3dData;
        this.curDistance = 0;
        this.timerSetDirection = null;
        this._animatedObject = new GWTK.gEngine.Scene.UntiledObjectLayer(this._map); // TODO: untiled
        
        this._trackObject = new GWTK.gEngine.Scene.UntiledObjectLayer(this._map, true);
        this._trailObject = new GWTK.gEngine.Scene.UntiledObjectLayer(this._map, true);
        this._trailObjectPoint = new GWTK.gEngine.Scene.UntiledObjectLayer(this._map, true);
        
        if ((this.objectValue.hasOwnProperty("ShowTrack")) && this.objectValue.ShowTrack === "1") {
            this._trackObject = new GWTK.gEngine.Scene.UntiledObjectLayer(this._map, true);
        }
        if ((this.objectValue.hasOwnProperty("ShowTrail")) && this.objectValue.ShowTrail === "1") {
            
            this._trailObject = new GWTK.gEngine.Scene.UntiledObjectLayer(this._map, true);
            this._trailObjectPoint = new GWTK.gEngine.Scene.UntiledObjectLayer(this._map, true);
        }
        this.time = window.performance.now();
        this.objectValue['timeStartDelay'] = this.time / 1000 + parseFloat(this.objectValue.TimeStart);
        this.objectValue['timeEndDelay'] = this.time / 1000 + parseFloat(this.objectValue.TimeEnd);
        this.pos = -1;
        this.curOfset = [];
        this.projection = ProjectionCollection.GoogleMapsCompatible;//TODO: по эллипсоиду
        
        this.updateTrailToObject = GWTK.gEngine.Utils3d.throttle(this._updateTrailToObject.bind(this), 300);
        this.updateTrack = GWTK.gEngine.Utils3d.throttle(this._updateTrack.bind(this), 1000);
        this.pauseOn = false; // пауза
        this.scenarioName = scenarioName;
        this.active = GWTK.enumScenarioMode.TURNED_ON;
        
        this.startMove = 0; // начало движения
        
        this._coeffSpeedAnimation = 1; // коэффициент увеличения/уменьшения скорости анимации
        if (coefSpeedScenario !== 1) {
            this.setAnimationSpeedValue(coefSpeedScenario);
        }
        
        this._init(scenarioName);
        this.pos = 0;
        this.startViewObjectItervalID = setInterval(this.startViewObjectScene.bind(this), 100);
        this._update = this.update.bind(this);
        GWTK.gEngine.Mediator.subscribe("updateScene", this._update);
        
    };
    
    
    GWTK.gEngine.Scene.ScenarioObject.prototype = {
        
        /**
         * Режим пауза
         * @param active
         * @private
         */
        _pauseCheck: function(active) {
            this.pauseOn = active === GWTK.enumScenarioMode.PAUSED;
        },
        
        
        /**
         * @method _init
         * @private
         */
        _init: function() {
            if (!$.isEmptyObject(this.objectValue) && this.routeCoord.length > 0) {
                this.coordinates = this._getCoordinatesRad(this.routeCoord);
            }
            
        },
        
        /**
         * Рассчитать Bbox для объекта по координатам
         * _getBbox
         * @param arrayCoordinates
         * @return {null|[*, *, *, *]}
         * @private
         */
        _getBbox: function(arrayCoordinates) {
            if (!$.isArray(arrayCoordinates)) {
                return null;
            }
            
            var bbox = [arrayCoordinates[0][0], arrayCoordinates[0][1], arrayCoordinates[0][0], arrayCoordinates[0][1]];
            for (var curCoord = 1; curCoord < arrayCoordinates.length; curCoord++) {
                bbox[0] = Math.max(bbox[0], arrayCoordinates[curCoord][0]);
                bbox[1] = Math.max(bbox[1], arrayCoordinates[curCoord][1]);
                bbox[2] = Math.min(bbox[2], arrayCoordinates[curCoord][0]);
                bbox[3] = Math.min(bbox[3], arrayCoordinates[curCoord][1]);
            }
            
            var bboxGeo = [];
            
            for (var numCoord = 0; numCoord < bbox.length; numCoord++) {
                var curGeo = Trigonometry.toRadians(new Geodetic3D(bbox[numCoord], bbox[numCoord + 1]));
                numCoord++;
                bboxGeo.push(curGeo);
            }
            
            var bboxXY = this.projection.geo2xy(bboxGeo[0]);
            bbox[0] = bboxXY[1]; // max x
            bbox[1] = bboxXY[0]; // max y
            bboxXY = this.projection.geo2xy(bboxGeo[1]);
            bbox[2] = bboxXY[1]; // min x
            bbox[3] = bboxXY[0]; // min y
            
            return bbox;
        },
        
        /**
         * Добавить точки в траекторию
         * @private
         */
        _addNewPointInTrack: function() {
            // добавить точки в траекторию, для уточнения высот
            var coordSpecif = [];
            for (var numPoint = 0; numPoint < this.routeCoord.length; numPoint++) {
                var latLngObj = {
                    latitude: this.routeCoord[numPoint][1],
                    longitude: this.routeCoord[numPoint][0]
                };
                var latlng = this.latLngToCoords(latLngObj, 7);
                this.routeCoord[numPoint] = [latlng[1], latlng[0]];
            }
            if (coordSpecif.length > this.routeCoord.length) {
                this.routeCoord = coordSpecif;
                this.coordinates = this._getCoordinatesRad(this.routeCoord);
            }
            
            for (numPoint = 0; numPoint < this.routeCoord.length - 1; numPoint++) {
                
                var getPointGeo = this._getNewPointBetweenFSPoint(numPoint, numPoint + 1);
                if (getPointGeo !== null && getPointGeo.length > 0) {
                    for (var numCoord = 0; numCoord < getPointGeo.length; numCoord++) {
                        if (coordSpecif.length === 0 || (!(getPointGeo[numCoord][0] === coordSpecif[coordSpecif.length - 1][0] && getPointGeo[numCoord][1] === coordSpecif[coordSpecif.length - 1][1]))) {
                            coordSpecif.push(getPointGeo[numCoord]);
                        }
                    }
                    
                }else{
                    if (coordSpecif.length === 0 || (!(this.routeCoord[numPoint][0] === coordSpecif[coordSpecif.length - 1][0] && this.routeCoord[numPoint][1] === coordSpecif[coordSpecif.length - 1][1]))) {
                        coordSpecif.push(this.routeCoord[numPoint]);
                    }
                    
                    if (coordSpecif.length === 0 || (!(this.routeCoord[numPoint + 1][0] === coordSpecif[coordSpecif.length - 1][0] && this.routeCoord[numPoint + 1][1] === coordSpecif[coordSpecif.length - 1][1]))) {
                        coordSpecif.push(this.routeCoord[numPoint + 1]);
                    }
                }
                
            }
            
            if (coordSpecif.length > this.routeCoord.length) {
                this.routeCoord = coordSpecif;
                this.coordinates = this._getCoordinatesRad(this.routeCoord);
            }
            
        },
        
        /**
         * Ограничить геодезические координаты точки до указанной точности
         * @method latLngToCoords
         * @param latLng {Object} координаты точки
         * @param precision {Number} точность
         * @return {Array} массив с координатами точки
         */
        latLngToCoords: function(latLng, precision) {
            // precision = 7;
            precision = typeof precision === 'number' ? precision : 10;
            return [GWTK.Util.formatNum(latLng.latitude, precision), GWTK.Util.formatNum(latLng.longitude, precision)];
        },
        
        
        /**
         * Преобразовать координаты в Geodetic3D и радианы
         * @param coordGeo - массив Geo точек  {longitude, latitude}
         * @return {[{ Geodetic3D}]}
         * @private
         */
        _getCoordinatesRad: function(coordGeo) {
            var coordRad = [];
            for (var numCoord = 0; numCoord < coordGeo.length; numCoord++) {
                if (coordGeo[numCoord].length > 2) {
                    var curGeo = Trigonometry.toRadians(new Geodetic3D(coordGeo[numCoord][0], coordGeo[numCoord][1]));
                    if (this.objectValue.hasOwnProperty("UseHeight") && this.objectValue.UseHeight === "1") { // использовать высоту из траектории
                        var height = coordGeo[numCoord][2];
                    }else{
                        height = GWTK.heightSourceManager.getHeightInPoint(curGeo);
                    }
                    
                    curGeo._height = height;
                    coordGeo[numCoord][2] = height;
                }else{
                    curGeo = Trigonometry.toRadians(new Geodetic3D(coordGeo[numCoord][0], coordGeo[numCoord][1]));
                    height = GWTK.heightSourceManager.getHeightInPoint(curGeo);
                    curGeo._height = height;
                    coordGeo[numCoord][2] = height;
                }
                coordRad.push(curGeo);
            }
            return coordRad;
        },
        
        /**
         * Получить точки пересечения с mesh между двумя точками
         * @method _getNewPointBetweenFSPoint
         * @param firstPointNum - начальная точка отрезка
         * @param secondPointNum - конечная точка отрезка
         * @return {null|[]}
         * @private
         */
        _getNewPointBetweenFSPoint: function(firstPointNum, secondPointNum) {
            var bboxObj = this._getBbox([this.routeCoord[firstPointNum], this.routeCoord[secondPointNum]]);
            var identTile = this._getTileNumberForBbox(bboxObj);
            
            var hTile = GWTK.heightSourceManager.getHeightSource(this.projection.getTilematrixset())._heightCache.getHeightTileByIdentifier(identTile);
            
            if (hTile === undefined || hTile === null) {
                return null;
            }
            
            var geoFirstPoint = this.coordinates[firstPointNum];
            var geoSecondPoint = this.coordinates[secondPointNum];
            
            
            var geoPointList = hTile.getPath(geoFirstPoint, geoSecondPoint);
            if (!$.isArray(geoPointList)) {
                return null;
            }
            var pointList = [];
            for (var numPoint = 0; numPoint < geoPointList.length; numPoint++) {
                var point = Trigonometry.toDegrees(geoPointList[numPoint]);
                var latlng = this.latLngToCoords(point, 10);
                pointList.push([latlng[1], latlng[0]]);
            }
            return pointList;
            
        },
        
        /**
         *Получить номер тайла в котором умещяется bbox
         * @param bbox {[*, *, *, *]}
         * @return {number}
         */
        _getTileNumberForBbox: function(bbox) {
            if (!$.isArray(bbox) || bbox.length !== 4) {
                return 0;
            }
            var bboxTile = [];
            for (var tileNum = 22; tileNum > 0; tileNum--) {
                var identTile = this.projection.xy2tile(bbox[1], bbox[0], tileNum);
                var bboxTileMinMax = this.projection.getTileBbox(identTile);
                
                bboxTile = bboxTileMinMax.slice();
                for (var curCoord = 0; curCoord < bboxTile.length; curCoord++) {
                    bboxTile[0] = Math.max(bboxTile[0], bboxTileMinMax[curCoord]);
                    bboxTile[1] = Math.max(bboxTile[1], bboxTileMinMax[curCoord + 1]);
                    bboxTile[2] = Math.min(bboxTile[2], bboxTileMinMax[curCoord]);
                    bboxTile[3] = Math.min(bboxTile[3], bboxTileMinMax[curCoord + 1]);
                    curCoord++;
                }
                
                if (bbox[0] <= bboxTile[0] && bbox[0] >= bboxTile[2] &&
                    bbox[2] <= bboxTile[0] && bbox[2] >= bboxTile[2] &&
                    bbox[1] <= bboxTile[1] && bbox[1] >= bboxTile[3] &&
                    bbox[3] <= bboxTile[1] && bbox[3] >= bboxTile[3]) {
                    return identTile;
                }
            }
            
        },
        /**
         * Сформировать GeoJSON-объект маршрута
         * @method _createGeoJSONroute
         * @private
         * @param scenarioValueName{string}
         * @param routeCoord{array}
         * @param typeGeometry{String} тип объекта
         * @param optionsView {Object}
         * @return {GWTK.gEngine.GeoJSON} GeoJSON-объект маршрута
         */
        _createGeoJSONroute: function(scenarioValueName, typeGeometry, routeCoord, optionsView) {
            var fillColor = "#b44c53";
            var fillOpacity = "0.3";
            if ((!$.isEmptyObject(optionsView)) && optionsView.hasOwnProperty('fill-color') && optionsView.hasOwnProperty('fill-opacity')
                && optionsView.hasOwnProperty('code')) {
                fillColor = optionsView["fill-color"];
                fillOpacity = optionsView["fill-opacity"];
                var code = optionsView.code;
            }
            var options = {
                "fill-color": fillColor,
                "fill-opacity": fillOpacity,
                "stroke-color": "#808080",
                "stroke-opacity": "0.75"
            };
            
            var jsonForRoute = {
                type: "FeatureCollection",
                bbox: [],
                features: [
                    {
                        type: "Feature",
                        bbox: [],
                        geometry: {
                            type: typeGeometry,
                            coordinates: routeCoord
                        },
                        properties: {
                            freeCamera: true,
                            name: w2utils.lang("Script route") + " " + scenarioValueName,
                            description: w2utils.lang("Script route") + " " + scenarioValueName,
                            looped: false,
                            id: "scenerio_id"
                        }
                    }
                ]
            };
            var geoJson = new GeoJSON(JSON.stringify(jsonForRoute));
            var feature = geoJson.getFeature(0);
            var properties = feature.properties;
            properties.relative = (properties.type != null && properties.type.toLowerCase() === 'relative');
            properties.targetMode = !(properties['cameraHeightsMode']);
            properties.height = properties.height || 0;
            
            properties.color = ColorMethods.RGBA(options["fill-color"], options["fill-opacity"]);
            var geometryObj = null;
            switch (typeGeometry) {
                case "LineString" :
                    geometryObj = geoJson.getFullLineGeometry();
                    
                    properties.height = {
                        "heightDef": 20,
                        "heightSem": 1,
                        "heightConstSem": 0
                    };
                    
                    properties.code = code || -107;
                    properties.key = properties.code !== -107 ? "LineByReliefHorizont" : "LineByRelief";
                    properties.viewtype = VIEWTYPE.Template;
                    properties.local = LOCALE.Line;
                    break;
                case "Point" :
                    geometryObj = jsonForRoute.features[0].geometry;
                    properties.height = {
                        "heightDef": 40,
                        "keySem": "",
                        "heightSem": 1,
                        "heightConstSem": 0
                    };
                    properties.code = code || this.objectValue.ObjectCode;
                    properties.key = this.objectValue.ObjectKey;
                    properties.viewtype = VIEWTYPE.Template;
                    properties.local = LOCALE.Point;
                    break;
                case "MultiPoint" :
                    geometryObj = geoJson.getFullLineGeometry();
                    properties.height = {
                        "heightDef": 40,
                        "keySem": "",
                        "heightSem": 1,
                        "heightConstSem": 0
                    };
                    properties.code = code || this.objectValue.ObjectCode;
                    properties.key = this.objectValue.ObjectKey;
                    properties.viewtype = VIEWTYPE.Template;
                    properties.local = LOCALE.Point;
                    break;
            }
            properties.colorValue = properties.color || null;
            var routeGeoJSON = new GeoJSON();
            routeGeoJSON.addFeature(GeoJSON.createFeature(properties, geometryObj));
            return routeGeoJSON;
        },
        /**
         * Деактивировать режим
         * @method deactivate
         * @public
         */
        deactivate: function() {
            this.active = GWTK.enumScenarioMode.TURNED_OFF;
            GWTK.gEngine.Mediator.unsubscribe("updateScene", this._update);
            
            setTimeout(this._clearDrawRoute.bind(this), 1000);
        },
        
        /**
         * Очищает панель рисования
         * @method clearDraw
         * @public
         */
        _clearDrawRoute: function() {
            if (this._animatedObject) {
                this._animatedObject.clearServiceObject();
            }
            if (this._trackObject) {
                this._trackObject.clearServiceObject();
            }
            if (this._trailObjectPoint) {
                this._trailObjectPoint.clearServiceObject();
            }
            if (this._trailObject) {
                this._trailObject.clearServiceObject();
            }
        },
        
        /**
         * Начать отображение объекта в первой точке и траектории,
         * в зависимости от параметров сценария объекта сразу или по времени страрта timeStartDelay
         * @method startViewObjectScene
         */
        startViewObjectScene: function() {
            if (this.objectValue.hasOwnProperty("ViewBegin") &&
                (this.objectValue.ViewBegin === "1" || this.time >= (this.objectValue.timeStartDelay * 1000))) {
                this.active = GWTK.enumScenarioMode.ACTIVE;
                clearInterval(this.startViewObjectItervalID);
                // Отбразить объект в первой точке
                var typeGeometry = "MultiPoint";
                
                if (this.routeCoord.length === 2 && ((this.objectValue.timeEndDelay - this.objectValue.timeStartDelay) <= 0.5)) {
                    var geoJSONObject = this._createGeoJSONroute(this.scenarioName, typeGeometry, [this.routeCoord[0], this.routeCoord[1]]);
                    
                }else{
                    geoJSONObject = this._createGeoJSONroute(this.scenarioName, typeGeometry, [this.routeCoord[0]], null);
                }
                
                if (geoJSONObject.json.features[0].properties.code === "-103") {
                    this._animatedObject.requestMesh(geoJSONObject.json);
                }else{
                    this._animatedObject.requestMesh(geoJSONObject.json, this.url_scenario + this.rscName);
                }
                this.timerSetDirection = window.setInterval(function() {
                    if (!$.isEmptyObject(this._animatedObject._serviceNode.retrieveModelNode(this.objectValue.ObjectCode))) {
                        window.clearInterval(this.timerSetDirection);
                        this._setDirection();
                    }
                }.bind(this), 100);
                
                if (this.objectValue.hasOwnProperty("UseHeight") && this.objectValue.UseHeight !== "1") {
                    this._addNewPointInTrack();
                }
                // Отображать траекторию
                if (this.objectValue.hasOwnProperty("ShowTrack") && this.objectValue.ShowTrack === "1") {
                    typeGeometry = "LineString";
                    var optionsColor = {
                        "fill-color": "#0d0d31",
                        "fill-opacity": "1",
                        "code": -10000003
                    };
                    var geoJSON = this._createGeoJSONroute(this.objectValue.ObjectName, typeGeometry, this.routeCoord, optionsColor);
                    this._trackObject.requestMesh(geoJSON.json);
                }
                
            }
        },
        
        
        /** Обновить объект движения
         * @param timeUpdate {Object} время обновлений
         * @method update
         */
        update: function(timeUpdate) {
            
            var deltaT = timeUpdate.currentTime - this.time;
            this.time = timeUpdate.currentTime;
            this.curOfset = [];
            if (this.pauseOn) {
                this.objectValue.timeEndDelay += deltaT / 1000;
                this.objectValue.timeStartDelay += deltaT / 1000;
                return;
            }
            
            
            if (this.active !== GWTK.enumScenarioMode.ACTIVE) {
                return;
            }
            
            
            if (this.time < (this.objectValue.timeStartDelay * 1000)) {
                return;
            }
            
            if (this.time >= (this.objectValue.timeEndDelay * 1000)) {
                if (this.objectValue.hasOwnProperty("ViewEnd") && this.objectValue.ViewEnd === "0") {
                    this.deactivate();
                    return;
                }else{
                    if (this.objectValue.Repeat === "1") {
                        this.curDistance = 0;
                        this.pos = 0;
                        
                        this.objectValue.timeStartDelay = ((timeUpdate.currentTime / 1000)).toString();
                        this.objectValue.timeEndDelay = ((parseFloat(this.objectValue.TimeEnd) / this._coeffSpeedAnimation) + (timeUpdate.currentTime / 1000)).toString();
                        
                        this.curOfset.length = 0;
                        this.trailCoord.length = 0;
                        if (this._trailObjectPoint) {
                            this._trailObjectPoint.clearServiceObject();
                        }
                        if (this._trailObject) {
                            this._trailObject.clearServiceObject();
                        }
                        this.update(timeUpdate);
                        return;
                    }else{
                        return;
                    }
                }
            }
            
            if (this.coordinates.length === 0 || this.pos >= this.coordinates.length - 1) {
                return;
            }
            
            var nextPos = this.pos + 1;
            
            var currGeoPoint = this.coordinates[this.pos];
            var nextGeoPoint = this.coordinates[nextPos];
            
            var ellipsoid = this.projection.getGlobeShape();
            if (this.objectValue.hasOwnProperty("UseHeight") && this.objectValue.UseHeight !== "1") {
                var height = GWTK.heightSourceManager.getHeightInPoint(currGeoPoint);
                currGeoPoint.setHeight(height);
                height = GWTK.heightSourceManager.getHeightInPoint(nextGeoPoint);
                nextGeoPoint.setHeight(height);
            }
            
            
            var currPoint = ellipsoid.toVector3d(currGeoPoint, []);
            var newPoint = ellipsoid.toVector3d(nextGeoPoint, []);
            
            var curVector = vec3.sub(newPoint, currPoint, []);
            var curDir = vec3.normalize(curVector, []);
            var deltaDistance = 0.001 * deltaT * this.objectValue.Speed / 3.6;
            this.curDistance += deltaDistance;
            
            if (this.curDistance >= vec3.len(curVector)) {
                this.curDistance -= vec3.len(curVector);
                this.pos++;
                this.update(timeUpdate);
                this._updateTrail();
                return;
            }
            
            this.curOfset = vec3.scale(curDir, this.curDistance, []);
            vec3.add(this.curOfset, currPoint);
            
            // if ((this.objectValue.hasOwnProperty("UseHeight") && this.objectValue.UseHeight !== "1")&&
            //     (this.pos < this.coordinates.length - 3) &&
            //     ((this.coordinates[this.pos + 3]._height> this.coordinates[this.pos + 2]._height  &&  this.coordinates[this.pos + 2]._height> this.coordinates[this.pos]._height  && this.coordinates[this.pos+2]._height> this.coordinates[this.pos+1]._height) ||
            //     ( this.coordinates[this.pos + 3]._height< this.coordinates[this.pos + 2]._height && this.coordinates[this.pos + 2]._height< this.coordinates[this.pos]._height  && this.coordinates[this.pos+2]._height< this.coordinates[this.pos+1]._height))) {
            //     var geo = ellipsoid.toGeodetic2d(this.curOfset);
            //     height = GWTK.heightSourceManager.getHeightInPoint(geo);
            //     geo.setHeight(height);
            //     this.curOfset = ellipsoid.toVector3d(geo, []);
            // }
            //
            var model = this._animatedObject._serviceNode.retrieveModelNode(this.objectValue.ObjectCode);
            if (model) {
                var minDistance = Math.round(-Number.MAX_VALUE); //Number.MIN_SAFE_INTEGER;
                var renderable = model.getRenderable(this.objectValue.ObjectKey, minDistance);
                if (renderable) {
                    for (var i = 0; i < renderable._polygonList.length; i++) {
                        var obb = renderable._polygonList[i].getOBB();
                        
                        // поворот по направлению
                        var centerOBB = obb.getCenter();
                        
                        var orthoVector = vec3.normalize(centerOBB, []);
                        var vector = [];
                        vec3.sub(newPoint, currPoint, vector);
                        vec3.normalize(vector);
                        
                        var matAxis = obb.getModelMatrix().slice();
                        
                        mat4.identity(matAxis);
                        var xAxis = vec3.transformMat3(vec3.UNITX, matAxis, []);
                        // При отрисовке знак поворачивается до совпадения оси Z знака с вектором из центра Земли
                        // поэтому следует повернуть и ось X для расчета
                        var zUp = orthoVector;
                        var zxNorm = vec3.normalize(vec3.cross(vec3.UNITZ, zUp, []));
                        var zxNormAngle = Math.acos(vec3.dot(vec3.UNITZ, zUp));
                        vec3.normalize(vec3.rotateAroundAxis(xAxis, zxNorm, zxNormAngle));
                        
                        var yAxis = vec3.normalize(vec3.cross(orthoVector, xAxis, []));
                        
                        var curVectorXYZ = [];
                        curVectorXYZ[0] = vec3.dot(vector, xAxis);
                        curVectorXYZ[1] = vec3.dot(vector, yAxis);
                        // curVectorXYZ[2] = vec3.dot(vector, orthoVector);
                        curVectorXYZ[2] = 0;
                        
                        var rotateAngle = Math.acos(vec3.dot(curVectorXYZ, vec3.UNITX));
                        
                        //память
                        var rotationXYZaxis = curVectorXYZ;
                        vec3.normalize(vec3.cross(vec3.UNITX, curVectorXYZ, rotationXYZaxis));
                        
                        var rotationAxis = [0, 0, 0];
                        
                        vec3.scaleAndAdd(rotationAxis, xAxis, rotationXYZaxis[0], rotationAxis);
                        vec3.scaleAndAdd(rotationAxis, yAxis, rotationXYZaxis[1], rotationAxis);
                        vec3.scaleAndAdd(rotationAxis, orthoVector, rotationXYZaxis[2], rotationAxis);
                        
                        if (vec3.dot(rotationAxis, orthoVector) < 0) {
                            vec3.scale(rotationAxis, -1);
                            rotateAngle = -rotateAngle;
                        }
                        
                        // var axis = vec3.normalize(vec3.cross(vector, orthoVector, []));
                        // var pseudoVector = vec3.normalize(vec3.cross(orthoVector, axis, []));
                        // var angle = vec3.angleBetween(pseudoVector, vector);
                        
                        var matrixOffset = obb.getModelMatrix().slice();
                        mat4.identity(matrixOffset);
                        
                        var offsetToZero = renderable._polygonList[i]._instancedMesh.getAttributes()["aVertexOffset"]._values[0];
                        mat4.translate(matrixOffset, vec3.scale(offsetToZero, -1, []));
                        var rotationMatrix = mat4.IDENTITY.slice();
                        mat4.rotate(rotationMatrix, rotationAxis, rotateAngle);
                        // mat4.rotate(rotationMatrix, axis, angle);
                        mat4.multiply(rotationMatrix, matrixOffset, matrixOffset);
                        
                        var translateMatrix = mat4.IDENTITY.slice();
                        mat4.translate(translateMatrix, this.curOfset);
                        mat4.multiply(translateMatrix, matrixOffset, matrixOffset);
                        renderable._polygonList[i].setModelMatrix(matrixOffset);
                    }
                }
            }
            this.updateTrack();
            this.updateTrailToObject();
        },
        
        
        /**
         * овернуть объект по направлению (траектории движения)
         * @method _setDirection
         * @private
         */
        _setDirection: function() {
            
            var currGeoPoint = this.coordinates[0];
            var nextGeoPoint = this.coordinates[1];
            
            var ellipsoid = this.projection.getGlobeShape();
            if (this.objectValue.hasOwnProperty("UseHeight") && this.objectValue.UseHeight !== "1") {
                var height = GWTK.heightSourceManager.getHeightInPoint(currGeoPoint);
                currGeoPoint.setHeight(height);
                height = GWTK.heightSourceManager.getHeightInPoint(nextGeoPoint);
                nextGeoPoint.setHeight(height);
            }
            
            var currPoint = ellipsoid.toVector3d(currGeoPoint, []);
            var newPoint = ellipsoid.toVector3d(nextGeoPoint, []);
            
            var model = this._animatedObject._serviceNode.retrieveModelNode(this.objectValue.ObjectCode);
            if (model) {
                var minDistance = Math.round(-Number.MAX_VALUE); //Number.MIN_SAFE_INTEGER;
                var renderable = model.getRenderable(this.objectValue.ObjectKey, minDistance);
                if (renderable) {
                    for (var i = 0; i < renderable._polygonList.length; i++) {
                        var obb = renderable._polygonList[i].getOBB();
                        
                        // поворот по направлению
                        var centerOBB = obb.getCenter();
                        
                        var orthoVector = vec3.normalize(centerOBB, []);
                        var vector = [];
                        vec3.sub(newPoint, currPoint, vector);
                        vec3.normalize(vector);
                        
                        var matAxis = obb.getModelMatrix().slice();
                        
                        mat4.identity(matAxis);
                        var xAxis = vec3.transformMat3(vec3.UNITX, matAxis, []);
                        // При отрисовке знак поворачивается до совпадения оси Z знака с вектором из центра Земли
                        // поэтому следует повернуть и ось X для расчета
                        var zUp = orthoVector;
                        var zxNorm = vec3.normalize(vec3.cross(vec3.UNITZ, zUp, []));
                        var zxNormAngle = Math.acos(vec3.dot(vec3.UNITZ, zUp));
                        vec3.normalize(vec3.rotateAroundAxis(xAxis, zxNorm, zxNormAngle));
                        
                        var yAxis = vec3.normalize(vec3.cross(orthoVector, xAxis, []));
                        
                        var curVectorXYZ = [];
                        curVectorXYZ[0] = vec3.dot(vector, xAxis);
                        curVectorXYZ[1] = vec3.dot(vector, yAxis);
                        curVectorXYZ[2] = 0;
                        
                        var rotateAngle = Math.acos(vec3.dot(curVectorXYZ, vec3.UNITX));
                        
                        //память
                        var rotationXYZaxis = curVectorXYZ;
                        vec3.normalize(vec3.cross(vec3.UNITX, curVectorXYZ, rotationXYZaxis));
                        
                        var rotationAxis = [0, 0, 0];
                        
                        vec3.scaleAndAdd(rotationAxis, xAxis, rotationXYZaxis[0], rotationAxis);
                        vec3.scaleAndAdd(rotationAxis, yAxis, rotationXYZaxis[1], rotationAxis);
                        vec3.scaleAndAdd(rotationAxis, orthoVector, rotationXYZaxis[2], rotationAxis);
                        
                        if (vec3.dot(rotationAxis, orthoVector) < 0) {
                            vec3.scale(rotationAxis, -1);
                            rotateAngle = -rotateAngle;
                        }
                        
                        var matrixOffset = obb.getModelMatrix().slice();
                        mat4.identity(matrixOffset);
                        
                        var offsetToZero = renderable._polygonList[i]._instancedMesh.getAttributes()["aVertexOffset"]._values[0];
                        mat4.translate(matrixOffset, vec3.scale(offsetToZero, -1, []));
                        var rotationMatrix = mat4.IDENTITY.slice();
                        mat4.rotate(rotationMatrix,rotationAxis, rotateAngle);
                        mat4.multiply(rotationMatrix, matrixOffset, matrixOffset);
                        
                        var translateMatrix = mat4.IDENTITY.slice();
                        mat4.translate(translateMatrix, currPoint);
                        mat4.multiply(translateMatrix, matrixOffset, matrixOffset);
                        renderable._polygonList[i].setModelMatrix(matrixOffset);
                    }
                }
            }
            
        },
        
        
        /**
         * Обновить траекторию
         * @method _updateTrack
         * @private
         */
        _updateTrack: function() {
            if (this.active !== GWTK.enumScenarioMode.ACTIVE) {
                return;
            }
            if ((this.objectValue.hasOwnProperty("ShowTrack")) && this.objectValue.ShowTrack === "1" && this.trackCoord.length !== 0) {
                var typeGeometry = "LineString";
                var optionsColor = {
                    "fill-color": "#0d0d31",
                    "fill-opacity": "1",
                    "code": -10000003
                };
                var geoJSON = this._createGeoJSONroute(this.objectValue.ObjectName, typeGeometry, this.routeCoord, optionsColor);
                this._trackObject.requestMesh(geoJSON.json);
            }
        },
        
        /**
         * Обновить след за объектом от начала маршрута до последней точки перед объектом
         * @method _updateTrail
         * @private
         */
        _updateTrail: function() {
            if (this.active !== GWTK.enumScenarioMode.ACTIVE) {
                return;
            }
            var typeGeometry = "LineString";
            
            // по routeCoord
            if ((this.objectValue.hasOwnProperty("ShowTrail")) && this.objectValue.ShowTrail === "1") {
                this.trailCoord = this.routeCoord.slice(0, this.pos + 1);
                if (this.trailCoord.length !== 0) {
                    var geoJSONTrail = this._createGeoJSONroute(this.objectValue.ObjectName, typeGeometry, this.trailCoord, null);
                    this._trailObject.requestMesh(geoJSONTrail.json);
                    this._updateTrailToObject();
                }
            }
            // Следить за объектом
            if ((this.objectValue.hasOwnProperty("TrackObject")) && this.objectValue.TrackObject === "1") {
                this._map3dData._cameraLookAtPoint.setCenterPoint(this._map3dData.getMapEllipsoid().toVector3d(this.coordinates[this.pos]));
            }
        },
        
        /**
         * Обновить след за объектом от последней точки до объекта
         * @method _updateTrailToObject
         * @private
         */
        _updateTrailToObject: function() {
            if (this.active !== GWTK.enumScenarioMode.ACTIVE) {
                return;
            }
            if ((this.objectValue.hasOwnProperty("ShowTrail")) && this.objectValue.ShowTrail === "1") {
                
                var geoCurrOffsetArr = [];
                if (this.curOfset.length !== 0) {
                    var ellipsoid = this.projection.getGlobeShape();
                    var geoCurrOffset = new Geodetic3D(0, 0, 0);
                    ellipsoid.toGeodetic3d(this.curOfset, geoCurrOffset);
                    
                    geoCurrOffsetArr.push(geoCurrOffset.getLongitude() * 180 / Math.PI);
                    geoCurrOffsetArr.push(geoCurrOffset.getLatitude() * 180 / Math.PI);
                    geoCurrOffsetArr.push(geoCurrOffset.getHeight());
                    if ($.isArray(geoCurrOffsetArr)) {
                        var typeGeometry = "LineString";
                        var geoJSON = this._createGeoJSONroute(this.objectValue.ObjectName, typeGeometry, [this.routeCoord[this.pos], geoCurrOffsetArr], null);
                        this._trailObjectPoint.requestMesh(geoJSON.json);
                    }
                }else{
                    if (!this.pauseOn) {
                        this._trailObjectPoint.clearServiceObject();
                    }
                }
            }
        },
        /**
         * Установить значение коэффициента скорости анимации
         * @method setAnimationSpeedValue
         * @public
         * @param value {number} Значение коэффициента скорости анимации
         */
        setAnimationSpeedValue: function(value) {
            var coeffSpeedNew = value / this._coeffSpeedAnimation;
            
            if (this.active !== GWTK.enumScenarioMode.ACTIVE || this.startMove === 0) {
                this.objectValue.timeStartDelay = (this.time / 1000) + ((this.objectValue.timeStartDelay - (this.time / 1000)) / coeffSpeedNew);
            }
            // var timesec = this.time/1000;
            // var v1 = this.objectValue.Speed;
            // var s1 = v1 * timesec;
            // var s = v1 * this.objectValue.timeEndDelay;
            // var s2 = s - s1;
            // var v2 = v1*coeffSpeedNew;
            // var t2 = s2/v2;
            // var tAll = timesec+ t2;
            
            this.objectValue.timeEndDelay = (this.time / 1000) + ((this.objectValue.timeEndDelay - (this.time / 1000)) / coeffSpeedNew);
            this._coeffSpeedAnimation = value;
            this.objectValue.Speed = this.objectValue.Speed * coeffSpeedNew;
        }
    }
}

