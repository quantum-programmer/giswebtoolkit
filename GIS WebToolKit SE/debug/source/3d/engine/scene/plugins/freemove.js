/******************************************** Тазин В. 23/06/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Режим свободного полета                         *
 *                                                                  *
 *******************************************************************/
"use strict";
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import Trigonometry from '~/3d/engine/core/trigonometry';
import { vec3 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    
    /**
     * Компонент свободного полета
     * @class GWTK.FreeMove
     * @constructor GWTK.FreeMove
     */
    GWTK.FreeMove = function(map3dData) {
        
        this.map3dData = map3dData;
        this._curCameraHeight = null;
        this._curAngle = null;
        this.pos = 0;
        this._speedAnimation = 1;
        this.coordinates = [];
        this.distanceList = [];
        this.distanceDeltaList = [];
        this.vectorList = [];
        this.properties = { looped: false };
        this._active = false;
        
        this.mV = vec3.create();
        this.V = vec3.create();
        
        this.mCurVec = [];
        this.mVec = [];
        this.mVec1 = [];
        this.mVec2 = [];
        this.mVec3 = [];
        
        this._tick = this._tick.bind(this);
        this.reset = this.reset.bind(this);
        this.resetPosition = this.resetPosition.bind(this);
        this.curHeight = 0;
        
        this.DEFAULT_TIME = 7;
        this.cursorPointObject = { normal: [] };
        
    };
    GWTK.FreeMove.prototype = {
        /**
         * Активировать режим
         * @method activate
         * @public
         */
        activate: function(bufferingFlag) {
            this.map3dData.buffering = !!bufferingFlag;
            this._subscribe();
            this._active = true;
        },
        /**
         * Деактивировать режим
         * @method deactivate
         * @public
         */
        deactivate: function() {
            this.map3dData.buffering = false;
            this._unsubscribe();
            this._active = false;
        },
        /**
         * Задать маршрут
         * @method setPath
         * @public
         * @param coordinates {Array} Массив координат точек
         * @param [noFilter] {boolean} Флаг отмены фильтрации точек
         */
        setPath: function(coordinates, noFilter) {
            
            if (coordinates.length === 0) {
                return;
            }
            var globeShape = this.map3dData.getMapEllipsoid();
            var prevVec = this.mVec1, nextVec = this.mVec2;
            
            var speed = this._getSpeedValue();
            var ind = 0;
            for (var i = 0; i < coordinates.length; i++) {
                var pointGeo = coordinates[i];
                if (this.properties.height && !this.map3dData.isStarView()) {
                    var height = this.distanceList[ind] = this.properties.height;
                }else{
                    height = this.distanceList[ind] = pointGeo.getHeight();
                    pointGeo.setHeight(0);
                }
                if (i > 0) {
                    var curVec = vec3.sub(globeShape.toVector3d(pointGeo, nextVec), globeShape.toVector3d(this.coordinates[ind - 1], prevVec), []);
                    if (vec3.len(curVec) !== 0) {
                        var k = speed / vec3.len(curVec);
                    }else{
                        k = speed;
                    }
                    
                    vec3.scale(curVec, k);
                    
                    if (!noFilter && i > 1) {
                        //фильтрация точек для избежания дрожания
                        if (Math.abs(Math.cos(vec3.angleBetween(curVec, vec3.UNITZ))) < 11e-2 && Math.abs(vec3.angleBetween(curVec, this.vectorList[ind - 2])) < 1e-2) {
                            continue;
                        }
                        //фильтрация точек для прохода на разных скоростях (хотя бы 1 точка на скорости х10)
                        if (k > 10) {
                            continue;
                        }
                    }
                    
                    this.vectorList[ind - 1] = curVec;
                    this.distanceDeltaList[ind - 1] = (height - this.distanceList[ind - 1]) * k;
                    
                    
                }
                this.coordinates[ind] = pointGeo;
                ind++;
            }
            
            if (this.properties["looped"]) {
                curVec = vec3.sub(globeShape.toVector3d(this.coordinates[0], nextVec), globeShape.toVector3d(this.coordinates[this.coordinates.length - 1], prevVec), []);
                if (vec3.len(curVec) !== 0) {
                    k = speed / vec3.len(curVec);
                }else{
                    k = speed;
                }
                vec3.scale(curVec, k);
                
                this.vectorList[this.coordinates.length - 1] = curVec;
                this.distanceDeltaList[this.coordinates.length - 1] = (this.distanceList[0] - this.distanceList[this.coordinates.length - 1]) * k;
            }else{
                this.vectorList[this.coordinates.length - 1] = this.vectorList[this.coordinates.length - 2];
                this.distanceDeltaList[this.coordinates.length - 1] = this.distanceDeltaList[this.coordinates.length - 2];
            }
            this.mVec.length = 0;
        },
        /**
         * Задать параметры режима
         * @method setProperties
         * @public
         * @param properties {Object} Параметры режима
         */
        setProperties: function(properties) {
            for (var k in properties) {
                this.properties[k] = properties[k];
            }
        },
        /**
         * Задать параметры карты
         * @method setMapParams
         * @public
         * @param properties {Object} Параметры карты
         */
        setMapParams: function(properties) {
            this.map3dData._cameraLookAtPoint.setCenterPoint(this.map3dData.getMapEllipsoid().toVector3d(properties.center));
        },
        /**
         * Получить состояние карты
         * @method getMapState
         * @public
         * @return {Object} Параметры карты
         */
        getMapState: function() {
            var projection = this.map3dData.getMapProjection();
            var center = projection.geo2xy(this.map3dData.getGeoCenter());
            return {
                center: center,
                scale: this.map3dData.getCurrentScale(),
                starViewFlag: this.map3dData.isStarView(),
                distanceFromObs: this.map3dData.getDistanceFromObs(),
                projection: projection
            }
        },
        /**
         * Сбросить параметры режима
         * @method reset
         * @public
         */
        reset: function() {
            this.deactivate();
            for (var k in this.properties) {
                delete this.properties[k];
            }
            this.coordinates.length = 0;
            this.distanceList.length = 0;
            this.distanceDeltaList.length = 0;
            this.vectorList.length = 0;
            this.pos = 0;
            this._curCameraHeight = null;
            this._curAngle = null;
            this._speedAnimation = 1;
        },
        /**
         * Получить значение скорости
         * @method _getSpeedValue
         * @private
         */
        _getSpeedValue: function() {
            var speed = this.properties["speed"];
            if (speed == null) {
                var map3dData = this.map3dData;
                var scale = map3dData.getCurrentScale();
                speed = 100 * map3dData.getMapState().getPixelSpan(scale) * (1 + map3dData.getTargetPosition()[2] / map3dData.getDistanceFromObs());
            }
            
            return speed;
        },
        /**
         * Установить значение коэффициента скорости анимации
         * @method setAnimationSpeedValue
         * @public
         * @param value {number} Значение коэффициента скорости анимации
         */
        setAnimationSpeedValue: function(value) {
            this._speedAnimation = value;
        },
        /**
         * Добавление обработчиков событий
         * @method _subscribe
         * @private
         */
        _subscribe: function() {
            var mediator = GWTK.gEngine.Mediator;
            mediator.subscribe('mapmoveEvent', this._tick);
            mediator.subscribe("forceMove", this.reset);
        },
        /**
         * Удаление обработчиков событий
         * @method _unsubscribe
         * @private
         */
        _unsubscribe: function() {
            var mediator = GWTK.gEngine.Mediator;
            mediator.unsubscribe('mapmoveEvent', this._tick);
            mediator.unsubscribe("forceMove", this.reset);
        },
        /**
         * Шаг анимации просмотра с воздуха
         * @method _tick
         * @private
         */
        _tick: function(e) {
            if (this.pos >= this.coordinates.length) {
                if (this.properties['looped']) {
                    this.pos = 0;
                }else{
                    this.reset();
                    return;
                }
            }
            
            var map3dData = this.map3dData;
            var curPoint = this.mVec;
            var curVec = vec3.scale(this.vectorList[this.pos], this._speedAnimation * e.currentDelay / 1000, this.mCurVec);
            
            if (curPoint.length === 0) {
                map3dData.getMapEllipsoid().toVector3d(this.coordinates[this.pos], curPoint);
                this.curHeight = this.distanceList[this.pos];
            }else{
                curPoint = vec3.add(curPoint, curVec);
                this.curHeight += this.distanceDeltaList[this.pos] * this._speedAnimation * e.currentDelay / 1000;
            }
            
            
            var nextPos = this.pos + 1;
            if (nextPos >= this.coordinates.length) {
                if (this.properties['looped']) {
                    nextPos = 0;
                }else{
                    nextPos = this.pos;
                }
            }
            var nextpoint = map3dData.getMapEllipsoid().toVector3d(this.coordinates[nextPos], this.mVec1);
            var deltaVector = vec3.sub(nextpoint, curPoint, this.mVec2);
            if (
                vec3.dot(curVec, deltaVector) < 0 || vec3.len(deltaVector) < 1e-8) {
                vec3.set(nextpoint, curPoint);
                this.curHeight = this.distanceList[nextPos];
                this.pos++;
            }
            
            var curGeo = map3dData._cameraLookAtPoint.getGeoCenterPoint();
            var h = curGeo.getHeight();
            map3dData.getMapEllipsoid().toGeodetic3d(curPoint, curGeo);
            curGeo.setHeight(h);
            map3dData._cameraLookAtPoint.setGeoCenterPoint(curGeo);
            
            if (this.curHeight) {
                map3dData.setDistanceFromObs(this.curHeight);
            }
            
            if (!this.properties['freeCamera']) {
                
                var zVector = vec3.normalize(curPoint, []);
                
                var eyeVector = map3dData._cameraLookAtPoint.getCamera().getCameraVector();
                var dEyeVectorUp = vec3.scale(zVector, vec3.dot(eyeVector, zVector), []);
                var dEyeVectorEye = vec3.sub(eyeVector, dEyeVectorUp, dEyeVectorUp);
                
                var deltaVectorUp = vec3.scale(zVector, vec3.dot(curVec, zVector), []);
                var deltaVectorEye = vec3.normalize(vec3.sub(curVec, deltaVectorUp, deltaVectorUp));
                var deltaAngle = vec3.angleBetween(deltaVectorEye, dEyeVectorEye);
                var crossVec = vec3.cross(dEyeVectorEye, deltaVectorEye, deltaVectorEye);
                
                var rotateAxisVector = vec3.normalize(crossVec);
                if (vec3.dot(rotateAxisVector, zVector) < 0) {
                    deltaAngle *= -1;
                }
                var MAX_DELTA = this._speedAnimation * 0.00125;
                
                if (deltaAngle > Trigonometry.toRadians(10)) {
                    deltaAngle = Trigonometry.toRadians(Math.sqrt(Trigonometry.toDegrees(deltaAngle) + 18) - 5.3);
                }else if (deltaAngle > MAX_DELTA) {
                    deltaAngle = MAX_DELTA;
                }
                
                if (deltaAngle < Trigonometry.toRadians(-10)) {
                    deltaAngle = -Trigonometry.toRadians(Math.sqrt(Trigonometry.toDegrees(-deltaAngle) + 18) - 5.3);
                }else if (deltaAngle < -MAX_DELTA) {
                    deltaAngle = -MAX_DELTA;
                }
                
                map3dData.setTurnModel(null, deltaAngle);
            }
            
            this.cursorPointObject.geo = map3dData._cameraLookAtPoint.getGeoCenterPoint();
            vec3.normalize(map3dData._cameraLookAtPoint.getCenterPoint(), this.cursorPointObject.normal);
            this.cursorPointObject.widthoutHeight = false;
            GWTK.gEngine.Mediator.publish("cursorPoint", this.cursorPointObject);
        },
        /**
         * Перелет между двумя точками
         * @method flyToPoint
         * @public
         * @param center {Array} Координаты текущей точки
         * @param dest {Array} Координаты точки назначения
         * @param [time] {number} Время перелета (сек)
         */
        flyToPoint: function(center, dest, time) {
            time = time || this.DEFAULT_TIME;
            
            var map3dData = this.map3dData;
            var topLeft = map3dData.getMapProjection().getTopLeft();
            var halfScreenMtr = Math.abs(topLeft.y);
            if (Math.abs(dest[0] - center[0]) > halfScreenMtr) {
                if (dest[0] < 0) {
                    dest[0] = dest[0] + 2 * halfScreenMtr;
                }else if (dest[0] > 0) {
                    dest[0] = dest[0] - 2 * halfScreenMtr;
                }
            }
            center[2] = dest[2] = map3dData.getDistanceFromObs();
            
            var maxCount = 11;
            
            if (time === 0) {
                maxCount = 2;
                time = 0.0001;
            }
            
            // Траектория полета
            var parabola = this._calcParabola(center, dest, maxCount);
            
            var coordinates = parabola.pointsArray;
            if (coordinates.length < 2) {
                return;
            }
            var len = 0;
            var curGeo = new Geodetic3D(0, 0, 0);
            var prevGeo = new Geodetic3D(0, 0, 0);
            var curPoint = this.mVec1;
            var prevPoint = this.mVec2;
            var ellipsoid = map3dData.getMapEllipsoid();
            for (var i = 0; i < coordinates.length; i++) {
                var coordinate = coordinates[i];
                coordinates[i] = map3dData.getMapProjection().xy2geo(coordinate[1], coordinate[0], coordinate[2] || 0);
                if (i > 0) {
                    curGeo.setLongitude(coordinates[i].getLongitude());
                    curGeo.setLatitude(coordinates[i].getLatitude());
                    
                    prevGeo.setLongitude(coordinates[i - 1].getLongitude());
                    prevGeo.setLatitude(coordinates[i - 1].getLatitude());
                    
                    len += vec3.len(vec3.sub(ellipsoid.toVector3d(curGeo, curPoint), ellipsoid.toVector3d(prevGeo, prevPoint), this.mVec3));
                }
            }
            this.properties["speed"] = len / time;
            this.setPath(coordinates, true);
            
            // this.setAnimationSpeedValue(parabola.length / time);
            // this.setAnimationSpeedValue(map3dData.getTilematrix());
            this.activate();
        },
        /**
         * Перелет между двумя точками
         * @method initZoomToPoint
         * @public
         * @param [time] {number} Время перелета (сек)
         */
        initZoomToPoint: function(time) {
            time = time || this.DEFAULT_TIME;
            var map3dData = this.map3dData;
            
            var geoCenter = map3dData.getGeoCenter().copy();
            geoCenter.setHeight(map3dData.getDistanceFromObs());
            var geoCenterStart = map3dData.getGeoCenter().copy();
            geoCenterStart.setLatitude(geoCenter.getLatitude() - Math.PI / 180);
            geoCenterStart.setHeight(10000000);
            delete this.properties.height;
            
            // Траектория полета
            var coordinates = [geoCenterStart, geoCenter];
            var len = 0;
            var curGeo = new Geodetic3D(0, 0, 0);
            var prevGeo = new Geodetic3D(0, 0, 0);
            var curPoint = this.mVec1;
            var prevPoint = this.mVec2;
            var ellipsoid = map3dData.getMapEllipsoid();
            for (var i = 1; i < coordinates.length; i++) {
                curGeo.setLongitude(coordinates[i].getLongitude());
                curGeo.setLatitude(coordinates[i].getLatitude());
                
                prevGeo.setLongitude(coordinates[i - 1].getLongitude());
                prevGeo.setLatitude(coordinates[i - 1].getLatitude());
                
                len += vec3.len(vec3.sub(ellipsoid.toVector3d(curGeo, curPoint), ellipsoid.toVector3d(prevGeo, prevPoint), this.mVec3));
            }
            
            this.properties["speed"] = len / time;
            this.setPath(coordinates);
            
            // this.setAnimationSpeedValue(parabola.length / time);
            // this.setAnimationSpeedValue(map3dData.getTilematrix());
            this.activate();
        },
        /**
         * Расчет параболы
         * @method _calcParabola
         * @public
         * @param point1 {Array} Прямоугольные координаты начальной точки
         * @param point2 {Array} Прямоугольные координаты конечной точки
         * @param number {Number} Количество точек (минимум 2)
         * @return {Object} Массив точек параболы
         */
        _calcParabola: function(point1, point2, number) {
            if (number == null || number < 2) {
                number = 2;
            }
            
            var x1 = point1[0];
            var y1 = point1[1];
            var z1 = point1[2] || 0;
            var x2 = point2[0];
            var y2 = point2[1];
            var z2 = point2[2] || 0;
            // Угол наклона прямой на плоскости XY
            var alpha = Math.atan2(y2 - y1, x2 - x1);
            
            //Общий вид уравнения:
            //    z=k(l-l0)^2+l0;
            var dist = 3.0 * Math.sqrt(Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2) + Math.pow(point2[2] - point1[2], 2));//расстояние между точками
            var z0 = Math.min(z1, z2) + dist;
            z0 = Math.max(z0, z1, z2);
            
            // Параметры прямой l
            var d = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            if (Math.abs(d) <= 0.00001) {
                return { pointsArray: [[x2, y2, z2]], length: 100 };
            }
            
            if (Math.cos(alpha) < 0) {
                d = -d;
            }
            var l1 = Math.sqrt(Math.pow(x1, 2) + Math.pow(y1, 2));
            var l2 = l1 + d;
            
            // Координаты по возрастанию
            if (l1 > l2) {
                d = l2;
                l2 = l1;
                l1 = d;
            }
            
            // Расчет коэффициентов
            var A = (z1 - z2) / (l1 - l2);
            var B = -2 * A * l1 - 2 * z0 + 2 * z1;
            var C = (z0 - z1) * (l1 + l2) + A * Math.pow(l1, 2);
            if (A === 0) {
                var l0 = (l1 + l2) * 0.5;
                var k = (z1 - z0) / Math.pow((l1 - l0), 2);
            }else{
                var Disc = Math.sqrt(Math.pow(B, 2) - 4 * A * C);
                var l01 = (-B + Disc) / (2 * A);
                var l02 = (-B - Disc) / (2 * A);
                
                l0 = (l01 >= l1 && l01 <= l2) ? l01 : l02;
                k = A / ((l1 + l2) - 2 * l0);
            }
            
            
            // Расчет точек
            var length = 0;
            var pointsArray = [];
            pointsArray.push([x1, y1, z1]);
            // Приращение высоты
            var deltaZ = 2 * (z0 - Math.min(z1, z2)) / (number - 1);
            var _x = x1, _y = y1, _z = z1, _l = l1, ks = 1;
            for (var i = 1; i < number - 1; i++) {
                if (i > (number - 1) / 2) {
                    ks = -1;
                }
                // Текущая высота
                var z = _z + ks * deltaZ;
                z = Math.min(z, z0);
                
                // Расчет координат X и Y
                var l = -ks * Math.sqrt(Math.abs((z - z0) / k)) + l0;
                var deltaL = l - _l;
                var deltaX = deltaL * Math.cos(alpha);
                var deltaY = deltaL * Math.sin(alpha);
                
                var x = _x + deltaX;
                var y = _y + deltaY;
                
                pointsArray.push([x, y, z]);
                
                length += Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));//+ Math.pow(deltaZ, 2)
                
                _x = x;
                _y = y;
                _z = z;
                _l = l;
            }
            
            pointsArray.push([x2, y2, z2]);
            length += Math.sqrt(Math.pow(x2 - _x, 2) + Math.pow(y2 - _y, 2));//+ Math.pow(deltaZ, 2)
            
            return { pointsArray: pointsArray, length: length };
        },
        resetPosition: function() {
            this.pos = 0;
        }
    };
}
