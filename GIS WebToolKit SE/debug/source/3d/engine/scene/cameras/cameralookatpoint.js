/****************************************** Тазин В.О. 23/06/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Класс по управлению камерой 3D вида             *
 *                                                                  *
 *******************************************************************/
"use strict";
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { IntersectionTests } from '~/3d/engine/core/collisiondetection/collisiondetection';
import { Calculate, mat3, vec3 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс по управлению камерой 3D вида
     * @class GWTK.gEngine.Scene.CameraLookAtPoint
     * @constructor GWTK.gEngine.Scene.CameraLookAtPoint
     * @param camera {GWTK.gEngine.Renderer.Camera} Объект камеры
     * @param ellipsoid {Ellipsoid} Эллипсоид
     */
    GWTK.gEngine.Scene.CameraLookAtPoint = function(camera, ellipsoid) {
        
        GWTK.gEngine.Utils3d.makePubSub(this);
        this._camera = camera;
        this._eventPane = GWTK.gEngine.Renderer.Context.getGL().canvas;
        this.mCurCameraPos = [];
        this.mTempResult = [];
        this.mTempLocalResult = [];
        this.mTempResultMatrix = [];
        this.mEyePos = [];
        this._centerPoint = camera.getTargetPosition().slice();
        this._centerPointGeo = new Geodetic3D();
        this._globeShape = ellipsoid;
        this._zoomFactor = 2;
        var maximumRadius = ellipsoid.getMaximumRadius() / 800000;
        this._zoomRateRangeAdjustment = maximumRadius;
        this._maximumZoomRate = 559082264;
        this._minimumZoomRate = 133;
        this._rotateFactor = 1 / maximumRadius;
        this._rotateRateRangeAdjustment = maximumRadius;
        this._maximumRotateRate = 1.0;
        this._minimumRotateRate = 1.0 / 7000.0;
        this._fixedToLocalRotation = mat3.identity([]);
        this._fixedToLocalRotationT = mat3.identity([]);
        this._range = vec3.len(vec3.sub(this._camera.getCameraPosition(), this._camera.getTargetPosition(), this.mTempResult));
        this._elevation = 0;
        this._azimuth = 0;
        
        this.zoomIn3d = this._zoomIn3d.bind(this);
        this.zoomOut3d = this._zoomOut3d.bind(this);
        
        this._lastPoint = [];
        this.mRotate = [];
        this.mCameraDistanceEvent = { distance: null, range: null };
        this.mCameraViewEvent = {
            "deltaRotateAngle": null,
            "deltaInclineAngle": null
        };
        this.mRayDirection = [];
        this.mSpherePos = [0, 0, 0];
        this.mCenterPrevPointGeo = new Geodetic3D();
        this.mCenterPointGeo = new Geodetic3D();
        this.mCameraOrientation = [];
        
        this.buttonList = null;
        
        this.DELTA_RAD_TO_CAMERA_DISTANCE = 1 / 6411935;
        
        GWTK.gEngine.Mediator.subscribe("cursorPoint", function(e) {
            var point = e.geo;
            var normal = e.normal;
            if (point) {
                var geoCursorPoint = this._eventClickPoint.data.geo;
                geoCursorPoint.setLatitude(point.getLatitude());
                geoCursorPoint.setLongitude(point.getLongitude());
                if (!e.widthoutHeight) {
                    geoCursorPoint.setHeight(point.getHeight());
                }
                vec3.set(normal, this._eventClickPoint.data.normal);
            }
        }.bind(this));
        
        // мышь
        this._mouseHandlers = {
            onmousedown: this._mouseDown.bind(this),
            onmouseup: this._mouseUp.bind(this),
            onmousemove: this._mouseDrag.bind(this),
            onclick: this._mouseClick.bind(this),
            onmouseclick: this._mouseClick.bind(this),
            onmouserightclick: this._mouseRightClick.bind(this),
            onwheel: this._mouseWheel.bind(this),
            onmousewheel: this._mouseWheel.bind(this),
            // onmouseleave: this._mouseUp.bind(this), //TODO: проблемы?
            oncontextmenu: function() {
                return false;
            },
            oncursormove: this._mouseCursorMove.bind(this)
        };
        if (GWTK.gEngine.Utils3d.isTouchDevice()) {
            this._mouseDevice = new GWTK.gEngine.Renderer.TouchScreen(this._eventPane);
        }else{
            this._mouseDevice = new GWTK.gEngine.Renderer.MouseDevice(this._eventPane);
        }
        this.setMouseEnable(true);
        
        // клавиатура
        this._keyboardHandler = this._keyboardHandler.bind(this);
        this.setKeyBoardEnable(true);
        
        this.subscribe('mousedrag', this._mapMove.bind(this));
        
        
        GWTK.gEngine.Mediator.subscribe('mouseEventSubscription', function(data) {
            this.subscribe(data.type, data.handler);
        }.bind(this));
        GWTK.gEngine.Mediator.subscribe('mouseEventUnsubscription', function(data) {
            this.unsubscribeByHandler(data.handler);
        }.bind(this));
        
        this._eventCursorPoint = new GWTK.gEngine.EventArgs({ x: 0, y: 0, rayPosition: [], rayDirection: [] });
        
        this._eventClickPoint = new GWTK.gEngine.EventArgs({
            normal: [1, 0, 0],
            x: 0,
            y: 0,
            geo: new Geodetic3D()
        });
    };
    GWTK.gEngine.Scene.CameraLookAtPoint.prototype = {
        
        /**
         * Получить объект камеры
         * @method getCamera
         * @public
         * @return {GWTK.gEngine.Renderer.Camera} Объект камеры
         */
        getCamera: function() {
            return this._camera;
        },
        /**
         * Установить режим клавиатуры
         * @method setKeyBoardEnable
         * @public
         * @param flag {boolean} `true` - включен, `false` - отключен
         */
        setKeyBoardEnable: function(flag) {
            if (flag) {
                GWTK.gEngine.Renderer.KeyBoard.subscribe(this._keyboardHandler);
            }else{
                GWTK.gEngine.Renderer.KeyBoard.unsubscribe(this._keyboardHandler);
            }
        },
        /**
         * Обработчик событий клавиатуры
         * @method _keyboardHandler
         * @private
         * @param e {Object} Объект события
         */
        _keyboardHandler: function(e) {
            var rotateXY = e.rotate;
            if (Array.isArray(rotateXY) && (rotateXY[0] !== 0 || rotateXY[1] !== 0)) {
                this._rotate(rotateXY);
            }
            
            var moveXY = e.move;
            if (Array.isArray(moveXY) && (moveXY[0] !== 0 || moveXY[1] !== 0)) {
                
                var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
                var centerX = realToCSSPixels * this._eventPane.clientWidth / 2;
                var centerY = realToCSSPixels * this._eventPane.clientHeight / 2;
                
                var x = realToCSSPixels * moveXY[0] * Math.sin(this.getElevation());
                var y = realToCSSPixels * moveXY[1] * Math.sin(this.getElevation());
                
                this.mSpherePos[0] = this.mSpherePos[1] = this.mSpherePos[2] = 0;
                const radii = this._globeShape.getRadius();
                var point0 = IntersectionTests.tryRaySphere(this._camera.getCameraPosition(), this._getPointerDirection(centerX, centerY), this.mSpherePos, radii[0]);
                var prevPoint = this._globeShape.toGeodetic3d(point0, this.mCenterPrevPointGeo);
                
                point0 = IntersectionTests.tryRaySphere(this._camera.getCameraPosition(), this._getPointerDirection(centerX + x, centerY + y), this.mSpherePos, radii[0]);
                var newPoint = this._globeShape.toGeodetic3d(point0, this.mCenterPointGeo);
                
                if (prevPoint !== null && newPoint !== null) {
                    var lon = prevPoint.getLongitude() - newPoint.getLongitude();
                    var lat = prevPoint.getLatitude() - newPoint.getLatitude();
                    
                    var center = this.getGeoCenterPoint();
                    center.setLongitude(center.getLongitude() + lon);
                    center.setLatitude(center.getLatitude() + lat);
                    this.setGeoCenterPoint(center);
                    GWTK.gEngine.Mediator.publish('writeCookie', { 'movement': true });
                    
                    this._eventCursorPoint.data.x = Math.floor(centerX);
                    this._eventCursorPoint.data.y = Math.floor(centerY);
                    this._mouseCursorMove(this._eventCursorPoint.data)
                }
            }
        },
        /**
         * Установить режим мыши
         * @method setMouseEnable
         * @public
         * @param flag {boolean} `true` - включен, `false` - отключен
         */
        setMouseEnable: function(flag) {
            this._mouseEnabled = flag;
            if (this._mouseEnabled) {
                this._mouseDevice.subscribe(this._mouseHandlers);
            }else{
                this._mouseDevice.unsubscribe(this._mouseHandlers);
            }
        },
        /**
         * Обработчик нажатия клавиши мыши
         * @method _mouseDown
         * @private
         * @param mouseEvent {object} Объект события компонента ввода с мыши
         */
        _mouseDown: function(mouseEvent) {
            if (mouseEvent.buttonList[GWTK.gEngine.Renderer.MouseButton.Left]) {
                GWTK.gEngine.Mediator.publish("forceMove");
                var x = mouseEvent.x;
                var y = mouseEvent.y;
                this._eventClickPoint.data.x = Math.floor(x);
                this._eventClickPoint.data.y = Math.floor(y);
                this.publish('leftdown', this._eventClickPoint);
            }
            
            this._lastPoint[0] = mouseEvent.x;
            this._lastPoint[1] = mouseEvent.y;
        },
        /**
         * Обработчик отпускания клавиши мыши
         * @method _mouseUp
         * @private
         * @param mouseEvent {object} Объект события компонента ввода с мыши
         */
        _mouseUp: function(mouseEvent) {
            if (mouseEvent.buttonList[GWTK.gEngine.Renderer.MouseButton.Left] !== undefined) {
                var x = mouseEvent.x;
                var y = mouseEvent.y;
                this._eventClickPoint.data.x = Math.floor(x);
                this._eventClickPoint.data.y = Math.floor(y);
                this.publish('leftup', this._eventClickPoint);
            }
        },
        /**
         * Обработчик клика клавиши
         * @method _mouseClick
         * @private
         */
        _mouseClick: function(mouseEvent) {
            var x = mouseEvent.x;
            var y = mouseEvent.y;
            this._eventClickPoint.data.x = Math.floor(x);
            this._eventClickPoint.data.y = Math.floor(y);
            this.publish('leftclick', this._eventClickPoint);
        },
        /**
         * Обработчик клика правой кнопки мыши
         * @method _mouseRightClick
         * @private
         */
        _mouseRightClick: function(e) {
            this.publish('rightclick', e);
        },
        /**
         * Обработчик прокрутки колеса мыши
         * @method _mouseWheel
         * @private
         * @param mouseEvent {object} Объект события компонента ввода с мыши
         */
        _mouseWheel: function(mouseEvent) {
            GWTK.gEngine.Mediator.publish("userActivity", { move: true });
            var wheelDelta = GWTK.DomEvent.getWheelDelta(mouseEvent.wheelEvent) / 20;
            this._zoom(wheelDelta);
        },
        /**
         * Обработчик свободного движения курсора мыши
         * @method _mouseCursorMove
         * @private
         * @param mouseEvent {object} Объект события компонента ввода с мыши
         */
        _mouseCursorMove: function(mouseEvent) {
            this._updateCursorEvent(mouseEvent);
            this.publish('mousemove', this._eventCursorPoint);
        },
        /**
         * Обработчик перемещения курсора мыши с нажатой клавишей
         * @method _mouseDrag
         * @private
         * @param mouseEvent {object} Объект события компонента ввода с мыши
         */
        _mouseDrag: function(mouseEvent) {
            
            this._updateCursorEvent(mouseEvent);
            
            this.buttonList = mouseEvent.buttonList;
            
            this.publish('mousemove', this._eventCursorPoint);
            
            this.publish('mousedrag', this._eventCursorPoint);
        },
        /**
         * Обновить данные курсора
         * @method _updateCursorEvent
         * @private
         * @param mouseEvent {object} Объект события компонента ввода с мыши
         */
        _updateCursorEvent: function(mouseEvent) {
            var x = mouseEvent.x;
            var y = mouseEvent.y;
            this._eventCursorPoint.data.x = Math.floor(x);
            this._eventCursorPoint.data.y = Math.floor(y);
            
            vec3.set(this._camera.getCameraPosition(), this._eventCursorPoint.data.rayPosition);
            vec3.set(this._getPointerDirection(x, y), this._eventCursorPoint.data.rayDirection);
        },
        
        /**
         * Обработчик перемещения карты
         * @method _mapMove
         * @private
         * @param e {GWTK.gEngine.EventArgs} Объект события
         */
        _mapMove: function(e) {
            var x = e.data.x;
            var y = e.data.y;
            
            var leftButtonDown = this.buttonList[GWTK.gEngine.Renderer.MouseButton.Left];
            var rightButtonDown = this.buttonList[GWTK.gEngine.Renderer.MouseButton.Right];
            
            if (leftButtonDown || rightButtonDown) {
                GWTK.gEngine.Mediator.publish("userActivity", { move: true });
                
                if (rightButtonDown) {
                    this.mRotate[0] = x - this._lastPoint[0];
                    this.mRotate[1] = y - this._lastPoint[1];
                    this._rotate(this.mRotate);
                    GWTK.gEngine.Mediator.publish('writeCookie');
                    
                    this._lastPoint[0] = x;
                    this._lastPoint[1] = y;
                }else if (leftButtonDown) {
                    this.mSpherePos[0] = this.mSpherePos[1] = this.mSpherePos[2] = 0;
                    const radii = this._globeShape.getRadius();
                    var point0 = IntersectionTests.tryRaySphere(this._camera.getCameraPosition(), this._getPointerDirection(this._lastPoint[0], this._lastPoint[1]), this.mSpherePos, radii[0]);
                    var prevPoint = point0 ? this._globeShape.toGeodetic3d(point0, this.mCenterPrevPointGeo) : null;

                    point0 = IntersectionTests.tryRaySphere(this._camera.getCameraPosition(), this._getPointerDirection(x, y), this.mSpherePos, radii[0]);
                    var newPoint = point0 ? this._globeShape.toGeodetic3d(point0, this.mCenterPointGeo) : null;
                    
                    if (prevPoint !== null && newPoint !== null) {
                        var lon = prevPoint.getLongitude() - newPoint.getLongitude();
                        var lat = prevPoint.getLatitude() - newPoint.getLatitude();
                        
                        if (lon !== 0 || lat !== 0) {
                            var distance = vec3.len(this._camera.getCameraVector(true));
                            var sum = Math.abs(lat) + Math.abs(lon);
                            if (sum > distance * this.DELTA_RAD_TO_CAMERA_DISTANCE) {
                                lat = 0.05 * distance * this.DELTA_RAD_TO_CAMERA_DISTANCE * lat / sum;
                                lon = 0.05 * distance * this.DELTA_RAD_TO_CAMERA_DISTANCE * lon / sum;
                            }
                            
                            if (this._camera.getCameraGeodetic(this._globeShape).getHeight() < 0) {
                                lat = -lat;
                                // lon = -lon;
                            }
                            var center = this.getGeoCenterPoint();
                            center.setLongitude(center.getLongitude() + lon);
                            center.setLatitude(center.getLatitude() + lat);
                            this.setGeoCenterPoint(center);
                            GWTK.gEngine.Mediator.publish('writeCookie', { 'movement': true });
                        }
                    }
                    
                    this._lastPoint[0] = x;
                    this._lastPoint[1] = y;
                }
                // this.updateParametersFromCamera();
                
                
                this._updateViewPoint();
            }
            
        },
        
        /**
         * Установить угол поворота камеры
         * @method setAzimuth
         * @public
         * @param value {number} Угол поворота в радианах
         */
        setAzimuth: function(value) {
            this._azimuth = value;
        },
        /**
         * Получить угол поворота камеры
         * @method getAzimuth
         * @public
         * @return {number} Угол поворота в радианах
         */
        getAzimuth: function() {
            return this._azimuth;
        },
        /**
         * Установить угол наклона камеры
         * @method setElevation
         * @public
         * @param value {number} Угол наклона в радианах
         */
        setElevation: function(value) {
            this._elevation = value;
        },
        /**
         * Получить угол наклона камеры
         * @method getElevation
         * @public
         * @return {number} Угол наклона в радианах
         */
        getElevation: function() {
            return this._elevation;
        },
        /**
         * Установить расстояние от камеры до точки наблюдения
         * @method setRange
         * @public
         * @param value {number} Расстояние от камеры до точки наблюдения
         */
        setRange: function(value) {
            this._range = value;
        },
        /**
         * Получить расстояние от камеры до точки наблюдения
         * @method getRange
         * @public
         * @return {number} Расстояние от камеры до точки наблюдения
         */
        getRange: function() {
            return this._range;
        },
        /**
         * Установить точку наблюдения
         * @method setCenterPoint
         * @public
         * @param value {array} Точка наблюдения
         */
        setCenterPoint: function(value) {
            this._globeShape.toGeodetic3d(value, this._centerPointGeo);
            this.setGeoCenterPoint(this._centerPointGeo);
        },
        /**
         * Получить точку наблюдения
         * @method setCenterPoint
         * @public
         * @return {array} Точка наблюдения
         */
        getCenterPoint: function() {
            return this._centerPoint;
        },
        /**
         * Установить точку наблюдения в геодезических координатах
         * @method setGeoCenterPoint
         * @public
         * @param value {Geodetic3D} Геодезические координаты точки наблюжения
         */
        setGeoCenterPoint: function(value) {
            this._centerPointGeo.setLatitude(value.getLatitude());
            var lng = value.getLongitude();
            while (lng > Math.PI) {
                lng -= 2 * Math.PI;
            }
            while (lng < -Math.PI) {
                lng += 2 * Math.PI;
            }
            
            this._centerPointGeo.setLongitude(lng);
            this._centerPointGeo.setHeight(value.getHeight());
            
            this._globeShape.toVector3d(this._centerPointGeo, this._centerPoint);
        },
        /**
         * Получить точку наблюдения в геодезических координатах
         * @method getGeoCenterPoint
         * @public
         * @return {Geodetic3D} Геодезические координаты точки наблюжения
         */
        getGeoCenterPoint: function() {
            return this._centerPointGeo;
        },
        /**
         * Установить матрицу преобразований к местной системе координат
         * @method _setFixedToLocalRotation
         * @public
         * @param value {array} Матрица преобразований к местной системе координат
         */
        _setFixedToLocalRotation: function(value) {
            mat3.set(value, this._fixedToLocalRotation);
            mat3.transpose(this._fixedToLocalRotation, this._fixedToLocalRotationT);
        },
        /**
         * Обновить состояние камеры
         * @method update
         * @public
         */
        update: function() {
            if (GWTK.heightSourceManager) {
                var curHeight = this._centerPointGeo.getHeight();
                var targetHeight = GWTK.heightSourceManager.getHeightInPoint(this._centerPointGeo) || curHeight;
                var deltaHeight = targetHeight - curHeight;
                if (Math.abs(deltaHeight) > 0.1) {
                    targetHeight = curHeight + deltaHeight * 0.2;
                }
                this._centerPointGeo.setHeight(targetHeight);
                this._globeShape.toVector3d(this._centerPointGeo, this._centerPoint);
            }
            this._updateViewPoint();
        },
        /**
         * Обновить положение камеры
         * @method _updateViewPoint
         * @private
         */
        _updateViewPoint: function() {
            var geographic = this.getGeoCenterPoint();
            
            // Fixed to East-North-Up rotation, from Wikipedia's "Geodetic System" topic.
            var zAngle = geographic.getLongitude(); // from UNITX
            var yAngle = Math.PI / 2 - geographic.getLatitude(); // from UNITZ
            
            var cosLon = Math.cos(zAngle);
            var sinLon = Math.sin(zAngle);
            var cosLat = Math.cos(yAngle);
            var sinLat = Math.sin(yAngle);
            
            
            this.mTempResultMatrix[0] = cosLon * cosLat;
            this.mTempResultMatrix[1] = sinLon * cosLat;
            this.mTempResultMatrix[2] = -sinLat;
            
            this.mTempResultMatrix[3] = -sinLon;
            this.mTempResultMatrix[4] = cosLon;
            this.mTempResultMatrix[5] = 0;
            
            this.mTempResultMatrix[6] = sinLat * cosLon;
            this.mTempResultMatrix[7] = sinLat * sinLon;
            this.mTempResultMatrix[8] = cosLat;
            
            
            this._setFixedToLocalRotation(this.mTempResultMatrix);
            
            this._updateCameraFromParameters();
        },
        /**
         * Обновить состояние камеры из параметров компонента
         * @method _updateCameraFromParameters
         * @private
         */
        _updateCameraFromParameters: function() {
            
            var localToFixed = this._fixedToLocalRotation;
            
            var rangeTimesSinElevation = this._range * Math.cos(this._elevation);
            var cameraLocalPosition = this.mCurCameraPos;
            cameraLocalPosition[0] = rangeTimesSinElevation * Math.cos(this._azimuth);
            cameraLocalPosition[1] = rangeTimesSinElevation * Math.sin(this._azimuth);
            cameraLocalPosition[2] = this._range * Math.sin(this._elevation);
            
            // оси камеры
            var eYe = this.mEyePos;
            vec3.scale(cameraLocalPosition, -1, eYe);
            
            var right = vec3.cross(eYe, vec3.UNITZ, this.mTempResult);
            
            var localOrientation = vec3.cross(right, eYe, this.mTempLocalResult);
            if (Math.abs(vec3.dot(vec3.normalize(eYe), vec3.UNITZ)) > 1 - 1e-9) {
                // Up vector is invalid because _camera.Eye is all Z (or very close to it).
                // So compute the Up vector directly assuming no Z component.
                localOrientation[0] = -Math.cos(this._azimuth);
                localOrientation[1] = -Math.sin(this._azimuth);
                localOrientation[2] = 0.0;
            }else{
                vec3.normalize(localOrientation);
            }
            
            var result = mat3.multiplyVec3(localToFixed, localOrientation, this.mTempResult);
            this._camera.setOrientation(result);
            
            this._camera.setTargetPosition(this._centerPoint);
            // положение камеры
            result = mat3.multiplyVec3(localToFixed, cameraLocalPosition, this.mTempResult);
            vec3.add(result, this._centerPoint);
            this._camera.setCameraPosition(result);
            
        },
        /**
         * Обновить параметры компонента из состояния камеры
         * @method updateParametersFromCamera
         * @public
         */
        updateParametersFromCamera: function() {
            var fixedToLocalRotationT = this._fixedToLocalRotationT;
            
            var cameraLocalPosition = mat3.multiplyVec3(fixedToLocalRotationT, vec3.sub(this._camera.getCameraPosition(), this._camera.getTargetPosition(), this.mCurCameraPos), this.mCurCameraPos);
            
            var up = mat3.multiplyVec3(fixedToLocalRotationT, this._camera.getOrientation(), this.mCameraOrientation);
            
            this.setRange(vec3.len(cameraLocalPosition));
            this.setElevation(Math.asin(cameraLocalPosition[2] / this._range));
            
            
            if (Math.pow(vec3.len(cameraLocalPosition), 2) < Math.pow(vec3.len(up), 2)) {
                // Near the poles, determine the azimuth from the Up direction instead of from the Eye position.
                if (cameraLocalPosition[2] > 0.0) {
                    this.setAzimuth(Math.atan2(-up[1], -up[0]));
                }else{
                    this.setAzimuth(Math.atan2(up[1], up[0]));
                }
            }else{
                this.setAzimuth(Math.atan2(cameraLocalPosition[1], cameraLocalPosition[0]));
            }
        },
        
        /**
         * Получить направление луча под курсором
         * @method _getPointerDirection
         * @private
         * @param x {number} X-координата точки на экране
         * @param y {number} Y-координата точки на экране
         * @return {array} Направление луча под курсором
         */
        _getPointerDirection: function(x, y) {
            var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
            var width = Math.floor(realToCSSPixels * this._eventPane.clientWidth);
            var height = Math.floor(realToCSSPixels * this._eventPane.clientHeight);
            return Calculate.getPointerDirection(this._camera, x, y, width, height, this.mRayDirection);
        },
        /**
         * Поворот камеры
         * @method _rotate
         * @private
         * @param movement {array} Перемещение курсора [x,y]
         */
        _rotate: function(movement) {
            var rotateRate = this._rotateFactor * (this._range - this._rotateRateRangeAdjustment);
            if (rotateRate > this._maximumRotateRate) {
                rotateRate = this._maximumRotateRate;
            }
            if (rotateRate < this._minimumRotateRate) {
                rotateRate = this._minimumRotateRate;
            }
            
            var realToCSSPixels = GWTK.gEngine.Renderer.DEVICE_PIXEL_RATIO;
            var width = realToCSSPixels * this._eventPane.clientWidth;
            var height = realToCSSPixels * this._eventPane.clientHeight;
            var azimuthWindowRatio = movement[0] / width;
            var elevationWindowRatio = movement[1] / height;
            
            this.mCameraViewEvent["deltaInclineAngle"] = rotateRate * elevationWindowRatio * Math.PI;
            this.mCameraViewEvent["deltaRotateAngle"] = -rotateRate * azimuthWindowRatio * Math.PI * 2;
            
            GWTK.gEngine.Mediator.publish("changeCameraView", this.mCameraViewEvent);
            
        },
        /**
         * Приближение/удаление камеры
         * @method _zoom
         * @private
         * @param rangeWindowRatio {number} Коэффициент приближения/удаления
         */
        _zoom: function(rangeWindowRatio) {
            var zoomRate = this._zoomFactor * (this._range - this._zoomRateRangeAdjustment);
            if (zoomRate > this._maximumZoomRate) {
                zoomRate = this._maximumZoomRate;
            }
            if (zoomRate < this._minimumZoomRate) {
                zoomRate = this._minimumZoomRate;
            }
            
            this.mCameraDistanceEvent["distance"] = null;
            this.mCameraDistanceEvent["range"] = this._range - zoomRate * rangeWindowRatio;
            GWTK.gEngine.Mediator.publish("cameraDistance", this.mCameraDistanceEvent);
        },
        /**
         * Вызов функции увеличения масштаба
         * @method _zoomIn3d
         * @private
         * @param e {Object} Объект события
         * @return {Boolean} `false`
         */
        _zoomIn3d: function(e) {
            this._zoom(0.25);
            
            e.preventDefault();
            e.stopPropagation();
            e.returnValue = false;
            return false;
        },
        /**
         * Вызов функции уменьшения масштаба
         * @method _zoomOut3d
         * @private
         * @param e {Object} Объект события
         * @return {Boolean} `false`
         */
        _zoomOut3d: function(e) {
            this._zoom(-0.25);
            e.preventDefault();
            e.stopPropagation();
            e.returnValue = false;
            return false;
        }
    };
}
