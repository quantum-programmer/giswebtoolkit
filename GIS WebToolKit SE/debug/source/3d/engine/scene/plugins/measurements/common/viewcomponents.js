/****************************************** Тазин В.О. 24/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компоненты визуализации измерений               *
 *                                                                  *
 *******************************************************************/
import GeoJSON from '~/utils/GeoJSON';
import Trigonometry from '~/3d/engine/core/trigonometry';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { ProjectionCollection } from '~/3d/engine/core/geometry/projection';
import { WindingOrder } from '~/3d/engine/core/geometry/mesh';
import { VIEWTYPE } from '~/3d/engine/worker/workerscripts/object3dtemplate';
import { LOCALE } from '~/3d/engine/worker/workerscripts/parse3dobject';
import { vec3, vec4 } from '~/3d/engine/utils/glmatrix';
import ComboPoint3D from '~/3d/engine/core/combopoint3d';
import LineSubdivision from '~/3d/engine/utils/polygons/linesubdivision';

"use strict";

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Plugins = GWTK.gEngine.Plugins || {};
    
    GWTK.gEngine.Plugins.enumConsctuctionMode = Object.freeze({
        Simple: 0,
        AdditionalPoint: 1
    });
    GWTK.gEngine.Plugins.enumPolygonMode = Object.freeze({
        None: 0,
        Simple: 1,
        ShadowPolygon: 2
    });
    /**
     * Класс визуализации построения измерений
     * @class GWTK.gEngine.Plugins.MeasurementConstructionView
     * @constructor GWTK.gEngine.Plugins.MeasurementConstructionView
     * @param map {GWTK.Map} Объект карты
     * @param centerPoint {array} Центр модели
     * @param [options] {object} Параметры
     */
    GWTK.gEngine.Plugins.MeasurementConstructionView = function(map, centerPoint, options) {
        this._pointUpdater = null;
        this._lineUpdater = null;
        this._polygonUpdater = null;
        this._surfacePolygonUpdater = null;
        this._vectorPointList = [];
        this._linePointList = [];
        this._constructionMode = GWTK.gEngine.Plugins.enumConsctuctionMode.Simple;
        this._polygonMode = GWTK.gEngine.Plugins.enumPolygonMode.None;
        if (options) {
            this._constructionMode = options.constructionMode || this._constructionMode;
            this._polygonMode = options.polygonMode || this._polygonMode;
        }
        this.mGeoPoint = new Geodetic3D(0, 0, 0);
        this.mGeoFirstPoint = new Geodetic3D(0, 0, 0);
        this.mGeoSecondPoint = new Geodetic3D(0, 0, 0);
        
        this.style = {
            fillcolor: [],
            linecolor: []
        };
        
        this._initServiceObjectLayer(map, centerPoint);
    };
    GWTK.gEngine.Plugins.MeasurementConstructionView.prototype = {
        /**
         * Инициализация слоя сервисных объектов
         * @method _initServiceObjectLayer
         * @private
         * @param map {GWTK.Map} Объект карты
         * @param centerPoint {array} Центр модели
         */
        _initServiceObjectLayer: function(map, centerPoint) {
            this.onFeatureLoadHandler = this._onFeatureLoadHandler.bind(this);
            
            var projection = ProjectionCollection[map.options.tilematrixset];
            this._ellipsoid = projection.getGlobeShape();
            this._supportPoint = new ComboPoint3D(this._ellipsoid);
            
            var geo = this._ellipsoid.toGeodetic3d(centerPoint);
            this._serviceObjectLayer = new GWTK.gEngine.Scene.ServiceObjectLayer(map);
            // this._serviceObjectLayer.getServiceNode().getOBB().setCenter(centerPoint);
            this._serviceObjectLayer.getServiceNode().getOBB().fitPoints([
                vec3.add(vec3.create(centerPoint), vec3.UNITZ),
                vec3.add(vec3.create(centerPoint), vec3.UNITX),
                vec3.add(vec3.create(centerPoint), vec3.UNITY),
                vec3.sub(vec3.create(centerPoint), vec3.UNITZ),
                vec3.sub(vec3.create(centerPoint), vec3.UNITX),
                vec3.sub(vec3.create(centerPoint), vec3.UNITY)
            ]);
            
            
            var geoPointDeg = Trigonometry.toDegrees(geo);
            var feature = {
                "type": "Feature",
                "bbox": [-180, -90, 180, 90],
                "geometry": {
                    "type": "Point",
                    "coordinates": [geoPointDeg.getLongitude(), geoPointDeg.getLatitude(), geoPointDeg.getHeight()]
                },
                "properties": {
                    "id": "mark_geolocation_0",
                    "code": -1031,
                    "key": "GeoPoint",
                    "viewtype": VIEWTYPE.Template,
                    "local": LOCALE.Point
                }
            };
            var featureLine = {
                "type": "Feature",
                "bbox": [-180, -90, 180, 90],
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[geoPointDeg.getLongitude(), geoPointDeg.getLatitude(), geoPointDeg.getHeight()], [geoPointDeg.getLongitude(), geoPointDeg.getLatitude(), geoPointDeg.getHeight()]]
                },
                "properties": {
                    "id": "line_geolocation",
                    "code": -10000002,
                    "key": "FlatLine",
                    "viewtype": VIEWTYPE.Template,
                    "local": LOCALE.Line,
                    "colorValue": [218 / 255, 68 / 255, 71 / 255, 1]
                }
            };
            
            var geoJSON = new GeoJSON();
            if (this._polygonMode === GWTK.gEngine.Plugins.enumPolygonMode.Simple) {
                var featureArea = {
                    "type": "Feature",
                    "bbox": [-180, -90, 180, 90],
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[geoPointDeg.getLongitude(), geoPointDeg.getLatitude(), geoPointDeg.getHeight()], [geoPointDeg.getLongitude() - 10, geoPointDeg.getLatitude() - 10, geoPointDeg.getHeight()], [geoPointDeg.getLongitude() + 10, geoPointDeg.getLatitude() + 10, geoPointDeg.getHeight()]]]
                    },
                    "properties": {
                        "id": "area_geolocation",
                        "code": -100000021,
                        "key": "PolygonFree",
                        "viewtype": VIEWTYPE.Template,
                        "local": LOCALE.Plane,
                        "colorValue": [218 / 255, 68 / 255, 71 / 255, 0.95]
                    }
                };
                geoJSON.addFeature(featureArea);
            }else if (this._polygonMode === GWTK.gEngine.Plugins.enumPolygonMode.ShadowPolygon) {
                var featureSurface = {
                    "type": "Feature",
                    "bbox": [-180, -90, 180, 90],
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[geoPointDeg.getLongitude(), geoPointDeg.getLatitude(), geoPointDeg.getHeight()], [geoPointDeg.getLongitude() - 10, geoPointDeg.getLatitude() - 10, geoPointDeg.getHeight()], [geoPointDeg.getLongitude() + 10, geoPointDeg.getLatitude() + 10, geoPointDeg.getHeight()]]]
                    },
                    "properties": {
                        "id": "surface_geolocation",
                        "code": -1001,
                        "key": "ShadowPolygon",
                        "viewtype": VIEWTYPE.Template,
                        "local": LOCALE.Plane,
                        "colorValue": [218 / 255, 68 / 255, 71 / 255, 0.95]
                    }
                };
                geoJSON.addFeature(featureSurface);
            }
            
            geoJSON.addFeature(feature);
            geoJSON.addFeature(featureLine);
            
            this._serviceObjectLayer.addFeatureLoadHandler(this.onFeatureLoadHandler);
            this._serviceObjectLayer.requestMesh(geoJSON, null, true);
            this._serviceObjectLayer.setActive(false);
        },
        
        /**
         * Обработчик загрузки объекта
         * @method _onFeatureLoadHandler
         * @private
         * @param renderable {GWTK.gEngine.Scene.RenderableCollection} Объект
         */
        _onFeatureLoadHandler: function(renderable) {
            if (renderable.id === 'FlatLine') {
                this._lineUpdater = new GWTK.gEngine.Scene.LineRenderableAnimator(renderable._polygonList[0]);
                this._lineUpdater.updateLineColor(this.style.linecolor);
            }
            if (renderable.id === 'GeoPoint') {
                this._pointUpdater = new GWTK.gEngine.Scene.PointRenderableAnimator(renderable._polygonList[0]);
            }
            if (renderable.id === 'PolygonFree') {
                this._polygonUpdater = new GWTK.gEngine.Scene.PolygonRenderableAnimator(renderable._polygonList[0]);
                this._polygonUpdater.updateFillColor(this.style.fillcolor);
            }
            if (renderable.id === 'ShadowPolygon') {
                if (!this._surfacePolygonUpdater) {
                    this._surfacePolygonUpdater = new GWTK.gEngine.Scene.SurfacePolygonRenderableAnimator();
                }
                for (var k in renderable._descriptionIdList) {
                    var index = renderable._descriptionIdList[k];
                    this._surfacePolygonUpdater.addRenderable(k, renderable._polygonList[index]);
                }
                
                
                this._surfacePolygonUpdater.updateFillColor(this.style.fillcolor);
            }
        },
        /**
         * Обработчик обновления сцены
         * @method onSceneUpdate
         * @public
         * @param e {object} Событие обновления
         */
        onSceneUpdate: function(e) {
        },
        
        /**
         * Обновление значений измерений
         * @method updateValues
         * @public
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         * @param measurementResults {object} Значения измерений
         */
        updateValues: function(obb, measurementResults) {
            
            var serviceNodeOBB = this._serviceObjectLayer._serviceNode.getOBB();
            // serviceNodeOBB.setCenter(obb.getCenter());
            // serviceNodeOBB.setRadius(obb.getRadius());
            
            var pointList = measurementResults.geometry.points;
            var curPointList = [];
            for (var i = 0; i < pointList.length; i++) {
                curPointList.push(pointList[i].getCartesian());
            }
            serviceNodeOBB.fitPoints(curPointList);
            
            if (this._pointUpdater) {
                this._vectorPointList.length = 0;
                for (i = 0; i < pointList.length; i++) {
                    this._vectorPointList.push(pointList[i].getCartesian())
                }
                this._pointUpdater.updateOBB(obb);
                this._pointUpdater.updateMesh(this._vectorPointList);
            }
            
            
            if (this._lineUpdater) {
                this._lineUpdater.updateOBB(obb);
                
                this._linePointList.length = 0;
                
                var minActiveIndex = -1;
                var maxActiveIndex = -1;
                
                for (i = 0; i < measurementResults.segments.length; i++) {
                    var segment = measurementResults.segments[i];
                    var linePoints = segment.auxiliaryValues.linePoints;
                    
                    if (segment.auxiliaryValues.active) {
                        minActiveIndex = this._linePointList.length;
                        maxActiveIndex = minActiveIndex + linePoints.length;
                    }
                    
                    for (var j = 0; j < linePoints.length; j++) {
                        this._linePointList.push(linePoints[j])
                    }
                    if (this._constructionMode === GWTK.gEngine.Plugins.enumConsctuctionMode.AdditionalPoint && segment.auxiliaryValues.slope > 0.05 && linePoints.length > 1) {
                        var currentSupportPoint = this.mGeoPoint;
                        
                        var firstGeoPoint = this._ellipsoid.toGeodetic3d(linePoints[0], this.mGeoFirstPoint);
                        var secondGeoPoint = this._ellipsoid.toGeodetic3d(linePoints[linePoints.length - 1], this.mGeoSecondPoint);
                        
                        if (firstGeoPoint.getHeight() < secondGeoPoint.getHeight()) {
                            currentSupportPoint.setLatitude(firstGeoPoint.getLatitude());
                            currentSupportPoint.setLongitude(firstGeoPoint.getLongitude());
                            currentSupportPoint.setHeight(secondGeoPoint.getHeight());
                        }else{
                            currentSupportPoint.setLatitude(secondGeoPoint.getLatitude());
                            currentSupportPoint.setLongitude(secondGeoPoint.getLongitude());
                            currentSupportPoint.setHeight(firstGeoPoint.getHeight());
                        }
                        
                        this._supportPoint.setGeo(currentSupportPoint);
                        
                        this._linePointList.push(linePoints[linePoints.length - 1]);
                        this._linePointList.push(this._supportPoint.getCartesian());
                        this._linePointList.push(this._supportPoint.getCartesian());
                        this._linePointList.push(linePoints[0]);
                    }
                }
                
                this._lineUpdater.updateMesh(this._linePointList, {
                    minActiveIndex: minActiveIndex,
                    maxActiveIndex: maxActiveIndex
                });
            }
            
            
            if (this._polygonUpdater) {
                this._polygonUpdater.updateOBB(obb);
                
                this._polygonUpdater.updateMesh(measurementResults.geometry.triangles.points, { indices: measurementResults.geometry.triangles.indices });
            }
            if (this._surfacePolygonUpdater) {
                this._surfacePolygonUpdater.updateOBB(obb);
                
                var resultPositions = measurementResults.geometry.triangles.points;
                
                var heightSource = GWTK.heightSourceManager.getHeightSource();
                var hTile = heightSource.getTileFromPoints(resultPositions);
                var granularity = hTile._deltaPlaneRad;
                if (hTile._level < 4) {
                    granularity = 0.4 / (hTile._level + 1);
                }
                var addHeight = Math.pow(obb.getRadius(), 2) / (2 * this._ellipsoid.getMaximumRadius());
                
                var minMaxHeight = heightSource.getMinMaxEntireHeight(hTile);
                
                var bottomHeight = Math.min(minMaxHeight[0], minMaxHeight[1]);
                bottomHeight *= bottomHeight > 0 ? 0.95 : 1.05;
                bottomHeight -= addHeight;
                
                var topHeight = Math.max(minMaxHeight[0], minMaxHeight[1]);
                topHeight *= topHeight > 0 ? 1.05 : 0.95;
                topHeight += addHeight;
                
                var middleHeight = 0.5 * (topHeight - bottomHeight);
                if (topHeight - middleHeight < 1) {
                    topHeight = middleHeight + 1;
                }
                if (middleHeight - bottomHeight < 1) {
                    bottomHeight = middleHeight - 1;
                }
                
                var positionAttributeValues = [];
                for (i = 0; i < resultPositions.length; i++) {
                    var position = resultPositions[i];
                    // fill positions WC
                    // scale to surface
                    var point = this._ellipsoid.scaleToGeocentricSurface(position, topHeight);
                    positionAttributeValues.push(point);
                }
                
                for (i = 0; i < resultPositions.length; i++) {
                    position = resultPositions[i];
                    // fill positions WC
                    // scale to surface
                    point = this._ellipsoid.scaleToGeocentricSurface(position, bottomHeight);
                    positionAttributeValues.push(point);
                }
                
                var indicesAttributeValues = measurementResults.geometry.triangles.indices.slice();
                
                //bottom plane
                var count = indicesAttributeValues.length;
                var maxIndex = resultPositions.length;
                for (i = 0; i < count; i += 3) {
                    indicesAttributeValues.push(maxIndex + indicesAttributeValues[i]);
                    indicesAttributeValues.push(maxIndex + indicesAttributeValues[i + 2]);
                    indicesAttributeValues.push(maxIndex + indicesAttributeValues[i + 1]);
                }
                
                //sides
                if (resultPositions.length > 0 && pointList.length > 2) {
                    
                    var startIndex = positionAttributeValues.length;
                    var additionalPoints = [];
                    var maxPointIndex = pointList.length - 1;
                    var k, n, m, firstPointIndex, startPoint, endPoint, result;
                    if (measurementResults.geometry.triangles.pointListOrder === WindingOrder.Clockwise) {
                        k = 1;
                        n = -1;
                        m = 0;
                        
                    }else{
                        k = 0;
                        n = 1;
                        m = 1;
                    }
                    for (i = 0; i < pointList.length; i++) {
                        firstPointIndex = maxPointIndex * k + i * n;
                        startPoint = pointList[firstPointIndex].getCartesian();
                        
                        if (firstPointIndex === maxPointIndex * m) {
                            endPoint = pointList[maxPointIndex * k].getCartesian();
                        }else{
                            endPoint = pointList[firstPointIndex + n].getCartesian();
                        }
                        result = LineSubdivision.compute(startPoint, endPoint, granularity, true);
                        additionalPoints.push(startPoint);
                        for (j = 0; j < result.length; j++) {
                            additionalPoints.push(result[j]);
                        }
                    }
                    additionalPoints.push(pointList[maxPointIndex * k].getCartesian());
                    
                    count = additionalPoints.length;
                    
                    for (i = 0; i < additionalPoints.length; i++) {
                        position = additionalPoints[i];
                        point = this._ellipsoid.scaleToGeocentricSurface(position, topHeight);
                        positionAttributeValues.push(point)
                    }
                    for (i = 0; i < additionalPoints.length; i++) {
                        position = additionalPoints[i];
                        point = this._ellipsoid.scaleToGeocentricSurface(position, bottomHeight);
                        positionAttributeValues.push(point)
                    }
                    
                    for (i = 0; i < count; i++) {
                        var currentTop = i;
                        var nextTop = i + 1;
                        if (nextTop === count) {
                            nextTop = 0;
                        }
                        currentTop += startIndex;
                        nextTop += startIndex;
                        
                        
                        var currentBottom = count + currentTop;
                        var nextBottom = count + nextTop;
                        
                        indicesAttributeValues.push(currentTop);
                        indicesAttributeValues.push(currentBottom);
                        indicesAttributeValues.push(nextTop);
                        
                        indicesAttributeValues.push(nextBottom);
                        indicesAttributeValues.push(nextTop);
                        indicesAttributeValues.push(currentBottom);
                    }
                }
                
                this._surfacePolygonUpdater.updateMesh(positionAttributeValues, {
                    indices: indicesAttributeValues,
                    minDistance: topHeight + addHeight - middleHeight
                });
            }
        },
        /**
         * Обновление стиля
         * @method updateStyle
         * @public
         */
        updateStyle: function(style) {
            if (!vec4.equals(style.fillcolor, this.style.fillcolor)) {
                vec4.set(style.fillcolor, this.style.fillcolor);
                if (this._polygonUpdater) {
                    this._polygonUpdater.updateFillColor(this.style.fillcolor);
                }
                if (this._surfacePolygonUpdater) {
                    this._surfacePolygonUpdater.updateFillColor(this.style.fillcolor);
                }
            }
            if (!vec4.equals(style.linecolor, this.style.linecolor)) {
                vec4.set(style.linecolor, this.style.linecolor);
                if (this._lineUpdater) {
                    this._lineUpdater.updateLineColor(this.style.linecolor);
                }
            }
        },
        /**
         * Активация компонента
         * @method activate
         * @public
         */
        activate: function() {
            this._serviceObjectLayer.setActive(true);
        },
        /**
         * Сброс компонента
         * @method reset
         * @public
         */
        reset: function() {
            this._serviceObjectLayer.setActive(false);
        },
        /**
         * Деструктор
         * @method destroy
         * @public
         */
        destroy: function() {
            this._serviceObjectLayer.destroy();
            this._serviceObjectLayer.removeFeatureLoadHandler(this.onFeatureLoadHandler);
        }
    };
    
}
