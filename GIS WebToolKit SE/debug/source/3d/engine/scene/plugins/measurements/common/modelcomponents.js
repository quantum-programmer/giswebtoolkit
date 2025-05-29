/****************************************** Тазин В.О. 30/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компоненты моделей измерения                    *
 *                                                                  *
 *******************************************************************/

import Trigonometry from '~/3d/engine/core/trigonometry';
import WorkerManager from '~/3d/engine/worker/workermanager';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { WindingOrder } from '~/3d/engine/core/geometry/mesh';
import EarClipping from '~/3d/engine/core/geometry/earclipping';
import TriangleMeshSubdivision from '~/3d/engine/utils/polygons/trianglemeshsubdivision';
import { IntersectionTests } from '~/3d/engine/core/collisiondetection/collisiondetection';
import PolygonAlgorithms from '~/3d/engine/core/geometry/polygonalgorithms';
import OrientedBoundingBox3D from '~/3d/engine/core/boundingvolumes/orientedbbox3d';
import { Calculate, vec3 } from '~/3d/engine/utils/glmatrix';
import TangentPlane from '~/3d/engine/core/geometry/planegeometry';
import ComboPoint3D from '~/3d/engine/core/combopoint3d';
import { AngleUnit, AreaUnitConverter, LengthUnitConverter, Unit, UnitText } from '~/3d/engine/core/unitconverter';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Plugins = GWTK.gEngine.Plugins || {};
    
    /**
     * Класс модели линейного измерения объектов
     * @class GWTK.gEngine.Plugins.PointMeasurementModel
     * @constructor GWTK.gEngine.Plugins.PointMeasurementModel
     * @param ellipsoid {Ellipsoid} Эллипсоид
     * @param [options] {object} Параметры
     */
    GWTK.gEngine.Plugins.PointMeasurementModel = function(ellipsoid, options) {
        
        this._ellipsoid = ellipsoid;
        this._state = {
            allByRelief: false,
            closedLine: false,
            planeMode: false,
            longByRelief: false
        };
        
        if (options) {
            for (var key in this._state) {
                this._state[key] = !!options[key];
            }
            this._state["serviceUrl"] = options["serviceUrl"] || undefined;
            this._state["matrixLayerId"] = options["matrixLayerId"] || undefined;
        }
        this.mVec3Center = [];
        this.mGeoPoint = new Geodetic3D(0, 0, 0);
        this._normalList = [];
        var point = new ComboPoint3D(ellipsoid);
        
        this._obb = new OrientedBoundingBox3D();
        // this._obb.setCenter(point.getCartesian().slice());
        // this._obb.setRadius(ellipsoid.getRadius()[0] * 3);
        const centerPoint = point.getCartesian();
        this._obb.fitPoints([
            vec3.add(vec3.create(centerPoint), vec3.UNITZ),
            vec3.add(vec3.create(centerPoint), vec3.UNITX),
            vec3.add(vec3.create(centerPoint), vec3.UNITY),
            vec3.sub(vec3.create(centerPoint), vec3.UNITZ),
            vec3.sub(vec3.create(centerPoint), vec3.UNITX),
            vec3.sub(vec3.create(centerPoint), vec3.UNITY)
        ])
        
        this._sourceSegmentList = [];
        this._sourcePointList = [];
        this._totalDistance = 0;
        this._totalArea = 0;
        
        this._lengthUnits = Unit.Meters;
        this._textLengthUnit = UnitText[this._lengthUnits];
        
        this._areaUnits = Unit.SquareMeters;
        this._textAreaUnit = UnitText[this._areaUnits];
        
        
        this._angleUnits = AngleUnit.Radians;
        this._textAngleUnit = "";
        
        this._result = {
            geometry: {
                points: [],
                triangles: {
                    points: [],
                    indices: [],
                    slope: 0,
                    pointListOrder: ''
                }
            },
            segments: [],
            points: [],
            total: this._createValueElements('distance', 'area', 'slope')
        };
        
        this._threadRequestQueue = WorkerManager.getThreadRequestQueue();
        
        this.updateFromServer = GWTK.gEngine.Utils3d.debounce(this._updateFromServer.bind(this), 100);
        this.updateFromServerHandler = this._updateFromServerHandler.bind(this);
        
    };
    GWTK.gEngine.Plugins.PointMeasurementModel.prototype = {
        /**
         * Создание элементов измеренных значений
         * @method _addAngleValueElement
         * @private
         * @return {object} Список элементов измеренных значений
         */
        _createValueElements: function() {
            var result = {};
            for (var i = 0; i < arguments.length; i++) {
                result[arguments[i]] = { 'value': 0, 'unit': this._textLengthUnit, 'text': '' };
            }
            return result;
        },
        /**
         * Обновление значений измерений
         * @method _updateValues
         * @private
         */
        _updateValues: function(index) {
            var pointList = this._result.geometry.points;
            this._result.geometry.triangles.points.length = 0;
            this._result.geometry.triangles.indices.length = 0;
            
            this._sourceSegmentList.length = 0;
            this._sourcePointList.length = 0;
            
            this._totalArea = 0;
            this._totalDistance = 0;
            
            if (index >= pointList.length) {
                index = 0;
            }
            
            var lineIndex = index - 1;
            if (lineIndex < 0) {
                if (this._state.closedLine) {
                    lineIndex = pointList.length - 1;
                }else{
                    lineIndex = 0;
                }
            }
            var lineCount = this._state.closedLine ? pointList.length : pointList.length - 1;
            
            var curVec = [];
            var curLinePoints = [];
            for (var i = 0; i < pointList.length; i++) {
                
                // Параметры точек
                var curGeo = pointList[i].getGeo();
                var curCartesian = pointList[i].getCartesian();
                
                var surfaceHeight = GWTK.heightSourceManager.getHeightSource().getHeightAccurate(curGeo);
                this._sourcePointList.push(
                    {
                        metricValues: {
                            absoluteHeight: curGeo.getHeight(),
                            relativeHeight: curGeo.getHeight() - surfaceHeight,
                            surfaceHeight: surfaceHeight
                        },
                        auxiliaryValues: {
                            active: (i === index)
                        }
                    }
                );
                
                
                if (i < lineCount) {
                    var nextIndex = i + 1;
                    if (nextIndex === pointList.length) {
                        nextIndex = 0;
                    }
                    
                    var nextGeo = pointList[nextIndex].getGeo();
                    var nextCartesian = pointList[nextIndex].getCartesian();
                    
                    curLinePoints.length = 0;
                    var granularity = Math.PI * 2;
                    if (this._state["serviceUrl"] === undefined) {
                        if (this._state.allByRelief) {
                            granularity = (Math.abs(nextGeo.getLongitude() - curGeo.getLongitude()) + Math.abs(nextGeo.getLatitude() - curGeo.getLatitude())) / 64;
                        }else if (this._state.longByRelief) {
                            granularity = 0.01;
                        }
                    }
                    
                    this._ellipsoid.computeCurve(curCartesian, nextCartesian, granularity, curLinePoints);
                    var deltaHeight = Math.abs(curGeo.getHeight() - nextGeo.getHeight());
                    var distance = vec3.len(vec3.sub(curCartesian, nextCartesian, curVec));
                    
                    if (distance !== 0) {
                        var planeDistance = Math.sqrt(Math.pow(distance, 2) - Math.pow(deltaHeight, 2));
                        
                        var azimuth = this._ellipsoid.calculateAzimuth(curGeo, nextGeo);
                        if (this._sourceSegmentList.length > 0) {
                            var rotation = azimuth - this._sourceSegmentList[this._sourceSegmentList.length - 1].angleValues.azimuth;
                            if (rotation < 0) {
                                rotation += Math.PI * 2;
                            }
                        }else{
                            rotation = 0;
                        }
                        
                        // Параметры отрезков
                        var segmentDescription = {
                            metricValues: {
                                distance: 0,
                                deltaHeight: deltaHeight,
                                planeDistance: planeDistance
                            },
                            angleValues: {
                                azimuth: azimuth,
                                rotation: rotation,
                                slope: deltaHeight / distance,
                                interiorAngle: 0 // для незамкнутого контура отсутствует внутренний угол
                            },
                            auxiliaryValues: {
                                intersected: false,
                                slope: deltaHeight / distance,
                                linePoints: [],
                                active: i === lineIndex
                            }
                        };
                        
                        for (var j = 0; j < curLinePoints.length; j++) {
                            var geo = this._ellipsoid.toGeodetic3d(curLinePoints[j], this.mGeoPoint);
                            if (j > 0 && j < curLinePoints.length - 1) {
                                geo.setHeight(GWTK.heightSourceManager.getHeightSource().getHeightAccurate(geo));
                            }
                            this._ellipsoid.toVector3d(geo, curLinePoints[j]);
                            segmentDescription.auxiliaryValues.linePoints.push(curLinePoints[j]);
                            
                            if (j > 0) {
                                segmentDescription.metricValues.distance += vec3.len(vec3.sub(curLinePoints[j - 1], curLinePoints[j], curVec));
                            }
                        }
                        this._sourceSegmentList.push(segmentDescription);
                        if (this._state["serviceUrl"] === undefined) {
                            this._totalDistance += segmentDescription.metricValues.distance;
                        }
                    }
                }
            }
            
            if (this._state.closedLine && pointList.length > 2) {
                var pointArray = this._result.geometry.triangles.points;
                var indexArray = this._result.geometry.triangles.indices;
                
                var directionNormal = vec3.normalize(this.getOBB().getCenter(), []);
                for (i = 0; i < pointList.length; i++) {
                    vec3.add(directionNormal, this._normalList[i]);
                }
                vec3.normalize(directionNormal);
                
                var averageNormal = vec3.ZERO.slice();
                var curNormal = [];
                for (i = 0; i < pointList.length - 2; i++) {
                    var vertex0 = pointList[0].getCartesian();
                    var vertex1 = pointList[i + 1].getCartesian();
                    var vertex2 = pointList[i + 2].getCartesian();
                    Calculate.calcNormal(vertex0, vertex1, vertex2, curNormal);
                    vec3.normalize(curNormal);
                    vec3.add(averageNormal, curNormal);
                }
                vec3.normalize(averageNormal);
                
                if (vec3.dot(directionNormal, averageNormal) < 0) {
                    vec3.scale(averageNormal, -1);
                }
                
                var cleanPositions = [];
                var topPosition = [];
                this._caclTopPoint(averageNormal, topPosition);
                
                if (this._state.planeMode) {
                    // определение нормали к плоскости проекции
                    var curVector = [];
                    for (i = 0; i < pointList.length; i++) {
                        curPoint = pointList[i].getCartesian();
                        vec3.sub(topPosition, curPoint, curVector);
                        vec3.normalize(curVector);
                        if (Math.abs(vec3.dot(curVector, averageNormal)) > 0.017) {
                            vec3.normalize(this.getOBB().getCenter(), averageNormal);
                            this._caclTopPoint(averageNormal, topPosition);
                            break;
                        }
                    }
                }
                
                for (i = 0; i < pointList.length; i++) {
                    var curPoint = pointList[i].getCartesian();
                    cleanPositions.push(curPoint);
                }
                
                this._result.geometry.triangles.pointListOrder = WindingOrder.Counterclockwise;
                
                var plane = new TangentPlane(topPosition, averageNormal);
                var positionsOnPlane = plane.computePositionsOnPlane(cleanPositions);
                var order = PolygonAlgorithms.computeWindingOrder(positionsOnPlane);
                var intersectionFlag = false;
                if (order === WindingOrder.Clockwise) {
                    positionsOnPlane.reverse();
                    cleanPositions.reverse();
                    this._result.geometry.triangles.pointListOrder = WindingOrder.Clockwise;
                }
                
                // проверка на пересечение ребер
                for (i = 0; i < positionsOnPlane.length - 1; i++) {
                    var startPoint = positionsOnPlane[i];
                    var endPoint = positionsOnPlane[i + 1];
                    for (j = i + 2; j < positionsOnPlane.length; j++) {
                        var startTestPoint = positionsOnPlane[j];
                        var endTestPoint = positionsOnPlane[j + 1];
                        if (endTestPoint === undefined) {
                            if (i === 0) {
                                continue;
                            }else{
                                endTestPoint = positionsOnPlane[0];
                            }
                        }
                        
                        if (IntersectionTests.trySegmentSegment2D(startPoint, endPoint, startTestPoint, endTestPoint)) {
                            var vertexIndex = i;
                            if (order === WindingOrder.Clockwise) {
                                vertexIndex = positionsOnPlane.length - 1 - i;
                            }
                            this._sourceSegmentList[vertexIndex].auxiliaryValues.intersected = true;
                            intersectionFlag = true;
                            break;
                        }
                    }
                }
                
                if (!intersectionFlag && positionsOnPlane.length > 2) {
                    var indices = EarClipping.triangulate(positionsOnPlane);
                    
                    
                    if (this._state.planeMode) {
                        // берем точки на плоскости
                        plane.planePositionsToGeocentic(positionsOnPlane, pointArray);
                        for (i = 0; i < indices.length; i++) {
                            indexArray[i] = indices[i];
                        }
                        this._result.geometry.triangles.slope = vec3.angleBetween(averageNormal, this.getOBB().getCenter());
                        if (this._result.geometry.triangles.slope > Math.PI / 2) {
                            this._result.geometry.triangles.slope = Math.PI - this._result.geometry.triangles.slope;
                        }
                        
                    }else{
                        // берем исходные точки
                        for (i = 0; i < cleanPositions.length; i++) {
                            pointArray[i] = cleanPositions[i];
                        }
                        if (this._state["serviceUrl"] === undefined) {
                            for (i = 0; i < indices.length; i += 3) {
                                var index0 = indices[i];
                                var index1 = indices[i + 1];
                                var index2 = indices[i + 2];
                                
                                if (indexArray.indexOf(index0) === -1) {
                                    indexArray.push(index0);
                                }else{
                                    indexArray.push(pointArray.length);
                                    pointArray.push(pointArray[index0]);
                                }
                                if (indexArray.indexOf(index1) === -1) {
                                    indexArray.push(index1);
                                }else{
                                    indexArray.push(pointArray.length);
                                    pointArray.push(pointArray[index1]);
                                }
                                if (indexArray.indexOf(index2) === -1) {
                                    indexArray.push(index2);
                                }else{
                                    indexArray.push(pointArray.length);
                                    pointArray.push(pointArray[index2]);
                                }
                            }
                            this._result.geometry.triangles.slope = 0;
                        }else{
                            
                            var heightSource = GWTK.heightSourceManager.getHeightSource();
                            var hTile = heightSource.getTileFromPoints(pointArray);
                            granularity = hTile._deltaPlaneRad;
                            if (hTile._level < 4) {
                                granularity = 0.4 / (hTile._level + 1);
                            }
                            
                            var result = TriangleMeshSubdivision.compute(pointArray, indices, granularity);
                            
                            var resultIndices = result.getIndices();
                            var resultPoiontArray = result.getPositions();
                            
                            for (i = 0; i < resultIndices.length; i++) {
                                indexArray[i] = resultIndices[i];
                            }
                            for (i = 0; i < resultPoiontArray.length; i++) {
                                pointArray[i] = resultPoiontArray[i];
                            }
                            
                            
                        }
                    }
                    
                    if (this._state["serviceUrl"] === undefined) {
                        for (i = 0; i < indexArray.length; i += 3) {
                            vertex0 = pointArray[indexArray[i]];
                            vertex1 = pointArray[indexArray[i + 1]];
                            vertex2 = pointArray[indexArray[i + 2]];
                            this._totalArea += Calculate.calcArea(vertex0, vertex1, vertex2);
                        }
                    }else{
                        this.updateFromServer();
                    }
                }
                if (this._state.planeMode) {
                    // обнуляем для режима плоскости
                    this._totalDistance = 0;
                }
                //внутренний угол
                var nextVec = [];
                var prevVec = [];
                
                if (order === WindingOrder.Clockwise) {
                    positionsOnPlane.reverse();
                    cleanPositions.reverse();
                }
                
                for (i = 0; i < this._sourceSegmentList.length; i++) {
                    
                    segmentDescription = this._sourceSegmentList[i];
                    
                    if (this._state.planeMode) {
                        if (order === WindingOrder.Clockwise) {
                            var prevPointIndex = pointArray.length - 1 - i;
                            var curPointIndex = (prevPointIndex === 0) ? pointArray.length - 1 : prevPointIndex - 1;
                            var nextPointIndex = (curPointIndex === 0) ? pointArray.length - 1 : curPointIndex - 1;
                        }else{
                            prevPointIndex = i;
                            curPointIndex = (prevPointIndex < pointArray.length - 1) ? prevPointIndex + 1 : 0;
                            nextPointIndex = (curPointIndex < pointArray.length - 1) ? curPointIndex + 1 : 0;
                        }
                        // точки с плоскости (нет добавочных)
                        var next = pointArray[nextPointIndex];
                        var cur = pointArray[curPointIndex];
                        var prev = pointArray[prevPointIndex];
                        
                        segmentDescription.metricValues.deltaHeight = 0;
                        
                        segmentDescription.angleValues.azimuth = 0;
                        segmentDescription.angleValues.rotation = 0;
                        segmentDescription.angleValues.slope = 0;
                        
                        segmentDescription.auxiliaryValues.slope = 0;
                        
                    }else{
                        prevPointIndex = i;
                        curPointIndex = (prevPointIndex < cleanPositions.length - 1) ? prevPointIndex + 1 : 0;
                        nextPointIndex = (curPointIndex < cleanPositions.length - 1) ? curPointIndex + 1 : 0;
                        
                        // точки исходные (нет добавочных)
                        next = cleanPositions[nextPointIndex];
                        cur = cleanPositions[curPointIndex];
                        prev = cleanPositions[prevPointIndex];
                    }
                    
                    if (next && cur && prev) {
                        vec3.sub(next, cur, nextVec);
                        vec3.sub(prev, cur, prevVec);
                        
                        var angle = vec3.angleBetween(nextVec, prevVec);
                        if (
                            (order !== WindingOrder.Clockwise && vec3.dot(vec3.cross(nextVec, prevVec, curVec), averageNormal) < 0) ||
                            (order === WindingOrder.Clockwise && vec3.dot(vec3.cross(nextVec, prevVec, curVec), averageNormal) > 0)
                        ) {
                            angle *= -1;
                        }
                        
                        while (angle < 0) {
                            angle += Math.PI * 2;
                        }
                        while (angle >= Math.PI * 2) {
                            angle -= Math.PI * 2;
                        }
                        
                        if (this._state.planeMode) {
                            // пересчитываем параметры отрезков
                            segmentDescription.metricValues.distance = vec3.len(prevVec);
                            segmentDescription.metricValues.planeDistance = segmentDescription.metricValues.distance;
                            this._totalDistance += segmentDescription.metricValues.distance;
                        }
                        
                    }else{
                        angle = 0;
                    }
                    
                    segmentDescription.angleValues.interiorAngle = angle;
                }
            }
            
            
            this._updateTextValues();
        },
        /**
         * Обновление значений с сервера
         * @method _updateFromServer
         * @private
         */
        _updateFromServer: function() {
            if (this._state["serviceUrl"] !== undefined && this._state["matrixLayerId"] !== undefined) {
                var url = this._state["serviceUrl"] + '?RESTMETHOD=GETAREABYMATRIX&SERVICE=WFS&LAYER=' + this._state["matrixLayerId"];
                var requestParams = {};
                requestParams['method'] = 'POST';
                requestParams['src'] = url;
                requestParams['sync'] = false;
                requestParams['responseType'] = 'text';
                requestParams['postdata'] = this._createGML();
                
                // var requestData = this._threadRequestQueue.createRequestData("serviceVersionRequest_" + Math.random(), {requestParams: requestParams}, 1, 1000);
                
                // this._threadRequestQueue.post(this.updateFromServerHandler, requestData);
                
                
                let restService = GWTK.RequestServices.retrieveOrCreate({ url: this._state["serviceUrl"] }, 'REST');
                
                const requestData = this._threadRequestQueue.createMessageData("serviceVersionRequest_" + Math.random(), {
                    httpParams: {
                        url: this._state["serviceUrl"], responseType: 'text', headers: {
                            'Content-Type': 'text/xml'
                        }, data: this._createGML()
                    },
                    options: { LAYER: this._state["matrixLayerId"] },
                    requestMethod: restService.getAreaByMatrix.bind(restService)
                }, 1);
                
                this._threadRequestQueue.post(requestData, {
                    onLoad: function(response) {
                        this.updateFromServerHandler({ responseData: response.data });
                    }.bind(this)
                });
                
                
            }
        },
        /**
         * Создать GML структуру для запроса
         * @method _createGML
         * @private
         * @return {string} Строка GML
         */
        _createGML: function() {
            var points = this._result.geometry.points;
            var coordinates = [];
            for (var i = 0; i < points.length; i++) {
                var point = points[i].getGeo();
                coordinates.push(Trigonometry.toDegrees(point.getLatitude()) + " " + Trigonometry.toDegrees(point.getLongitude()));
            }
            
            var count = points.length;
            var coordinateString = coordinates.join(" ");
            
            var doc = document.implementation.createDocument("", "", null);
            var xmlString = '<?xml version="1.0" encoding="utf-8"?><wfs:FeatureCollection></wfs:FeatureCollection>';
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(xmlString, "application/xml");
            var wfsFeatureCollection = xmlDoc.getElementsByTagName('wfs:FeatureCollection')[0];
            wfsFeatureCollection.innerHTML = '';
            wfsFeatureCollection.setAttribute("version", "2.0.0");
            wfsFeatureCollection.setAttribute("xmlns:bsd", "http://www.gisinfo.net/bsd");
            wfsFeatureCollection.setAttribute("xmlns:wfs", "http://www.opengis.net/wfs/2.0");
            wfsFeatureCollection.setAttribute("xmlns:fes", "http://www.opengis.net/fes/2.0");
            wfsFeatureCollection.setAttribute("xmlns:gml", "http://www.opengis.net/gml/3.2.1");
            wfsFeatureCollection.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
            wfsFeatureCollection.setAttribute("xsi:schemaLocation", "http://www.gisinfo.net/bsd http://www.gisinfo.net/bsd/topomap.xsd http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0.0/wfs.xsd http://www.opengis.net/gml/3.2 http://www.opengis.net/gml/3.2.1/gml.xsd");
            wfsFeatureCollection.setAttribute("timeStamp", new Date().toLocaleString('ru-RU'));
            wfsFeatureCollection.setAttribute("numberMatched", "1");
            wfsFeatureCollection.setAttribute("numberReturned", "1");
            
            var wfsMember = doc.createElement("wfs:member");
            
            var bsdRoads = doc.createElement("bsd:Roads");
            bsdRoads.setAttribute("gml:id", "id");
            
            var bsdRoadsCode = doc.createElement("bsd:RoadsCode");
            bsdRoadsCode.textContent = '1000000001';
            bsdRoads.appendChild(bsdRoadsCode);
            
            var gmlPolygon = doc.createElement("gml:Polygon");
            gmlPolygon.setAttribute("srsName", "urn:ogc:def:crs:EPSG:4326");
            
            var gmlexterior = doc.createElement("gml:exterior");
            
            var gmlLineString = doc.createElement("gml:LineString");
            gmlLineString.setAttribute("srsName", "urn:ogc:def:crs:EPSG:4326");
            
            var gmlposList = doc.createElement("gml:posList");
            gmlposList.setAttribute("srsDimension", "2");
            gmlposList.setAttribute("count", count + '');
            gmlposList.textContent = coordinateString;
            
            gmlLineString.appendChild(gmlposList);
            
            gmlexterior.appendChild(gmlLineString);
            
            gmlPolygon.appendChild(gmlexterior);
            
            bsdRoads.appendChild(gmlPolygon);
            
            wfsMember.appendChild(bsdRoads);
            wfsFeatureCollection.appendChild(wfsMember);
            return new XMLSerializer().serializeToString(xmlDoc);
        },
        /**
         * обработчик ответа сервера
         * @method _updateFromServerHandler
         * @private
         * @param response{object} Ответ сервера
         */
        _updateFromServerHandler: function(response) {
            var xmlText = response.responseData;
            if (typeof xmlText === "string") {
                var parser = new DOMParser();
                var xml = parser.parseFromString(xmlText, "text/xml");
                
                var perimeterElement = xml.getElementsByTagName('Perimeter')[0];
                if (perimeterElement) {
                    this._totalDistance = parseFloat(perimeterElement.innerHTML);
                }
                var areaElement = xml.getElementsByTagName('Area')[0];
                if (areaElement) {
                    this._totalArea = parseFloat(areaElement.innerHTML);
                }
                
                this._updateTextValues();
                GWTK.gEngine.Mediator.publish('measurementModelUpdate');
            }
        },
        
        /**
         * Определить самую удаленную точку по вектору
         * @method _caclTopPoint
         * @private
         * @param vector {array} Вектор
         * @param dest {array} Результат
         * @return {array} Результат/Новый вектор
         */
        _caclTopPoint: function(vector, dest) {
            var pointList = this._result.geometry.points;
            dest = dest || [];
            vec3.set(pointList[0].getCartesian(), dest);
            for (var i = 1; i < pointList.length; i++) {
                var curPoint = pointList[i].getCartesian();
                var curPointProjection = vec3.dot(curPoint, vector);
                if (curPointProjection > vec3.dot(dest, vector)) {
                    vec3.set(curPoint, dest);
                }
            }
            return dest;
        },
        /**
         * Обновление отображаемых значений измерений
         * @method _updateTextValues
         * @private
         */
        _updateTextValues: function() {
            
            this._result.segments.length = this._sourceSegmentList.length;
            for (var i = 0; i < this._sourceSegmentList.length; i++) {
                var segmentDescription = this._sourceSegmentList[i];
                var measuredSegmentValues = this._result.segments[i];
                if (!measuredSegmentValues) {
                    measuredSegmentValues = {};
                    measuredSegmentValues.metricValues = this._createValueElements('deltaHeight', 'distance', 'planeDistance');
                    measuredSegmentValues.angleValues = this._createValueElements('azimuth', 'rotation', 'interiorAngle', 'slope');
                    this._result.segments[i] = measuredSegmentValues;
                }
                for (var key in measuredSegmentValues.metricValues) {
                    this._updateDistanceValue(measuredSegmentValues.metricValues[key], segmentDescription.metricValues[key]);
                }
                for (key in measuredSegmentValues.angleValues) {
                    this._updateAngleValue(measuredSegmentValues.angleValues[key], segmentDescription.angleValues[key]);
                }
                measuredSegmentValues.auxiliaryValues = segmentDescription.auxiliaryValues;
            }
            
            this._result.points.length = this._sourcePointList.length;
            for (i = 0; i < this._sourcePointList.length; i++) {
                var pointDescription = this._sourcePointList[i];
                var measuredPointValues = this._result.points[i];
                if (!measuredPointValues) {
                    measuredPointValues = {};
                    measuredPointValues.metricValues = this._createValueElements('absoluteHeight', 'relativeHeight', 'surfaceHeight');
                    this._result.points[i] = measuredPointValues;
                }
                for (key in measuredPointValues.metricValues) {
                    this._updateDistanceValue(measuredPointValues.metricValues[key], pointDescription.metricValues[key]);
                }
                measuredPointValues.auxiliaryValues = pointDescription.auxiliaryValues;
            }
            
            this._updateDistanceValue(this._result.total.distance, this._totalDistance);
            this._updateAreaValue(this._result.total.area, this._totalArea);
            this._updateAngleValue(this._result.total.slope, this._result.geometry.triangles.slope);
        },
        /**
         * Обновление значения длины участка
         * @method _updateDistanceValue
         * @param currentItem {object}  Описание значения длины
         * @param originValue {number}  Значение
         * @private
         */
        _updateDistanceValue: function(currentItem, originValue) {
            var units = this._lengthUnits;
            var textUnit = this._textLengthUnit;
            
            // автоматический переход на метры для значения в километрах, если менее 3000 метров
            if (this._lengthUnits === Unit.Kilometers && originValue < 3000) {
                units = Unit.Meters;
                textUnit = UnitText[units];
            }
            
            currentItem.value = LengthUnitConverter.toUnits(originValue, units);
            currentItem.unit = textUnit;
            currentItem.text = this._lengthToTextValue(currentItem.value);
        },
        /**
         * Обновление значения площади участка
         * @method _updateAreaValue
         * @param currentItem {object}  Описание значения площади
         * @param originValue {number}  Значение
         * @private
         */
        _updateAreaValue: function(currentItem, originValue) {
            var units = this._areaUnits;
            var textUnit = this._textAreaUnit;
            
            // автоматический переход на метры для значения в километрах, если менее 1 000 000 квадратных метров
            if (this._areaUnits === Unit.SquareKilometers && originValue < 1000000) {
                units = Unit.SquareMeters;
                textUnit = UnitText[units];
            }
            
            currentItem.value = AreaUnitConverter.toUnits(originValue, units);
            currentItem.unit = textUnit;
            currentItem.text = this._lengthToTextValue(currentItem.value);
        },
        /**
         * Обновление значения углов
         * @method _updateAngleValue
         * @param currentItem {object}  Описание значения угла
         * @param originValue {number}  Значение
         * @private
         */
        _updateAngleValue: function(currentItem, originValue) {
            
            switch (this._angleUnits) {
                case AngleUnit.Degrees:
                    currentItem.value = Trigonometry.toDegrees(originValue);
                    currentItem.text = currentItem.value.toFixed(3) + "°";
                    break;
                case AngleUnit.DegreesMinutesSeconds:
                    currentItem.value = Trigonometry.toDegrees(originValue);
                    currentItem.text = this.degreesToDegMinSec(currentItem.value, 2);
                    break;
                case AngleUnit.Radians:
                default:
                    currentItem.value = originValue;
                    currentItem.text = originValue.toFixed(4);
                    break;
            }
            
            currentItem.unit = this._textAngleUnit;
        },
        
        /**
         * Обновление точки модели
         * @method updatePoint
         * @public
         * @param index {number} Индекс точки объекта
         * @param geo {Geodetic3D} Геодезические координаты точки
         * @param normal {array} Нормаль в точке
         * @return {boolean} Флаг обновления модели
         */
        updatePoint: function(index, geo, normal) {
            var pointList = this._result.geometry.points;
            var flagPoints = false;
            if (pointList[index] !== undefined) {
                var newPointFlag = true;
                
                var geoPoint = geo.copy();
                if (this._state.allByRelief) {
                    geoPoint.setHeight(GWTK.heightSourceManager.getHeightSource().getHeightAccurate(geoPoint));
                }
                for (var i = 0; i < pointList.length - 1; i++) {
                    if (pointList[i].getGeo().equals(geoPoint)) {
                        newPointFlag = false;
                        break;
                    }
                }
                if (newPointFlag) {
                    flagPoints = pointList[index].setGeo(geoPoint);
                    vec3.set(normal, this._normalList[index]);
                }else if (pointList.length > 1) {
                    pointList.splice(index, 1);
                }
            }
            
            
            vec3.set(vec3.ZERO, this.mVec3Center);
            var count = pointList.length || 1;
            for (i = 0; i < pointList.length; i++) {
                vec3.add(this.mVec3Center, pointList[i].getCartesian());
            }
            var vectorCenter = vec3.scale(this.mVec3Center, 1 / count);
            // this._obb.setCenter(vectorCenter);
            // var r = 0;
            // var curR = [];
            // for (i = 0; i < pointList.length; i++) {
            //     r = Math.max(r, vec3.len(vec3.sub(pointList[i].getCartesian(), vectorCenter, curR)));
            // }
            // this._obb.setRadius(r);
            
            var curPointList = [];
            for (i = 0; i < pointList.length; i++) {
                curPointList.push(pointList[i].getCartesian());
            }
            
            this._obb.fitPoints(curPointList);
            
            if (flagPoints) {
                this.updateActivePoint(index);
            }
            
            return flagPoints;
            
        },
        /**
         * Обновление состояния
         * @method updateState
         * @public
         * @param options {object} Параметры состояния
         * @return {boolean} Флаг обновления модели
         */
        updateState: function(options) {
            var flagUpdate = false;
            if (options) {
                for (var key in this._state) {
                    if (options.hasOwnProperty(key) && this._state[key] !== options[key]) {
                        flagUpdate = true;
                        this._state[key] = !!options[key];
                    }
                }
            }
            
            if (flagUpdate) {
                this._updateValues(this._activePointIndex);
            }
            
            return flagUpdate;
        },
        /**
         * Обновление активной точки
         * @method updateActivePoint
         * @public
         * @param index {number} Индекс текущей точки
         * @return {boolean} Флаг обновления активной точки
         */
        updateActivePoint: function(index) {
            var flagUpdate = false;
            if (this._activePointIndex !== index) {
                flagUpdate = true;
                this._activePointIndex = index;
            }
            
            this._updateValues(this._activePointIndex);
            
            return flagUpdate;
        },
        /**
         * Добавление точки модели
         * @method addPoint
         * @public
         * @param geoPoint {Geodetic3D} Геодезические координаты точки
         * @param normal {array} Нормаль в точке
         */
        addPoint: function(geoPoint, normal) {
            this._result.geometry.points.push(new ComboPoint3D(this._ellipsoid, geoPoint.copy()));
            this._normalList.push(normal.slice());
        },
        /**
         * Удаление точки модели
         * @method removePoint
         * @public
         * @param index {number} Индекс текущей точки
         */
        removePoint: function(index) {
            this._result.geometry.points.splice(index, 1);
            this._normalList.splice(index, 1);
            this.updateActivePoint(this._activePointIndex - 1);
        },
        /**
         * Задать единицы измерения
         * @method setMeasurementUnits
         * @public
         * @param units {string} Единицы измерения
         * @return {boolean} Флаг обновления единиц измерения
         */
        setMeasurementUnits: function(units) {
            // перевод к Enum
            switch (units) {
                case 'm':
                    units = Unit.Meters;
                    break;
                case 'km':
                    units = Unit.Kilometers;
                    break;
                case 'ft':
                    units = Unit.Foots;
                    break;
                case 'Nm':
                    units = Unit.NauticalMiles;
                    break;
                default:
                    units = Unit.Meters;
                    break;
            }
            
            var updateFlag = false;
            if (this._lengthUnits !== units) {
                this._lengthUnits = units;
                this._textLengthUnit = UnitText[this._lengthUnits];
                this._updateTextValues();
                
                updateFlag = true;
            }
            return updateFlag;
        },
        /**
         * Задать единицы измерения площади
         * @method setAreaMeasurementUnits
         * @public
         * @param units {string} Единицы измерения
         * @return {boolean} Флаг обновления единиц измерения
         */
        setAreaMeasurementUnits: function(units) {
            // перевод к Enum
            switch (units) {
                case 'sq m':
                    units = Unit.SquareMeters;
                    break;
                case 'sq km':
                    units = Unit.SquareKilometers;
                    break;
                case 'ha':
                    units = Unit.Hectares;
                    break;
                default:
                    units = Unit.SquareMeters;
                    break;
            }
            
            var updateFlag = false;
            if (this._areaUnits !== units) {
                this._areaUnits = units;
                this._textAreaUnit = UnitText[this._areaUnits];
                this._updateTextValues();
                
                updateFlag = true;
            }
            return updateFlag;
        },
        /**
         * Задать единицы измерения углов
         * @method setAngleUnits
         * @public
         * @param units {string} Единицы измерения
         * @return {boolean} Флаг обновления единиц измерения
         */
        setAngleUnits: function(units) {
            // перевод к Enum
            switch (units) {
                case 'grad':
                    units = AngleUnit.Degrees;
                    break;
                case 'grad min sec':
                    units = AngleUnit.DegreesMinutesSeconds;
                    break;
                case 'rad':
                    units = AngleUnit.Radians;
                    break;
                default:
                    units = AngleUnit.Radians;
                    break;
            }
            
            var updateFlag = false;
            if (this._angleUnits !== units) {
                this._angleUnits = units;
                this._updateTextValues();
                
                updateFlag = true;
            }
            return updateFlag;
        },
        /**
         * Получить геометрию узла
         * @method getOBB
         * @public
         * @return {OrientedBoundingBox3D} Геометрия узла
         */
        getOBB: function() {
            return this._obb;
        },
        /**
         * Получить точки
         * @method getPoints
         * @public
         * @return {array} Массив точек
         */
        getPoints: function() {
            return this._result.geometry.points;
        },
        /**
         * Получить значения измерений
         * @method getValues
         * @public
         * @return {object} Значения измерений
         */
        getValues: function() {
            return this._result;
        },
        /**
         * Сброс состояния модели
         * @method reset
         * @public
         */
        reset: function() {
            this._result.geometry.points.length = 0;
            this._normalList.length = 0;
            this.updateActivePoint(-1);
        },
        /**
         * Деструктор
         * @method destroy
         * @public
         */
        destroy: function() {
        },
        
        /**
         * Регулярное выражение
         * @property _regex
         * @private
         */
        _regex: /^(\d+)(?:(\d{3}(?:[\s.].+|.{0}))*)$/gm,
        /**
         * Шаблон для замещения
         * @property _replacer
         * @private
         */
        _replacer: '$1 $2',
        /**
         * Преобразование числа в текст вида `1 234.56`
         * @method _lengthToTextValue
         * @private
         * @param value {number} Числовое значение
         * @return {string} Строка
         */
        _lengthToTextValue: function(value) {
            value = value || 0;
            var word = value.toFixed(2);
            var newword = word;
            do {
                word = newword;
                newword = word.replace(this._regex, this._replacer);
            }
            while (word !== newword);
            
            return word;
        },
        /**
         * Перевод граусов в строку в градусы, минуты, секунд
         * @method degreesToDegMinSec
         * @param degrees {number} Градусы
         * @param precision {number} Точность
         * @return {string} Строка в формате 'ГГ MM CCCC'
         */
        degreesToDegMinSec: function(degrees, precision) {
            if (!precision)
                precision = 2;
            
            if (degrees < 0) {
                var result = "-";
                degrees = Math.abs(degrees);
            }else{
                result = "";
            }
            
            var iDegrees = Math.floor(degrees);
            var iMinutes = Math.floor((degrees - iDegrees) * 60);
            var seconds = (degrees - iDegrees - iMinutes / 60) * 3600;
            
            if (Math.round(seconds) === 60) {
                seconds = 0;
                iMinutes += 1;
                if (iMinutes === 60) {
                    iMinutes = 0;
                    iDegrees += 1;
                }
            }
            
            iDegrees = iDegrees % 360;
            
            result += this._padToThree(iDegrees);
            result += "°";
            
            result += this._padToTwo(iMinutes);
            result += "\'";
            
            if (seconds < 10) {
                result += "0";
            }
            result += seconds.toFixed(precision);
            result += "\"";
            
            return result;
        },
        /**
         * Преобразование числа в текст вида `002`
         * @method _padToThree
         * @private
         * @param number {number} Числовое значение
         * @return {string} Строка
         */
        _padToThree: function(number) {
            var result = "";
            if (number <= 999) {
                result = ("00" + number).slice(-3);
            }else{
                result = (result + number).substr(0, 3);
            }
            return result;
        },
        /**
         * Преобразование числа в текст вида `02`
         * @method _padToTwo
         * @private
         * @param number {number} Числовое значение
         * @return {string} Строка
         */
        _padToTwo: function(number) {
            var result = "";
            if (number <= 99) {
                result = ("0" + number).slice(-2);
            }else{
                result = (result + number).substr(0, 2);
            }
            return result;
        }
    };
}
