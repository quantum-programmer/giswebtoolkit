/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Класс камеры 3D вида                       *
 *                                                                  *
 *******************************************************************/
"use strict";
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { Calculate, vec3 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    /**
     * Компонент камеры 3D вида
     * @class GWTK.gEngine.Renderer.Camera
     * @constructor GWTK.gEngine.Renderer.Camera
     */
    GWTK.gEngine.Renderer.Camera = function () {

        this._cameraPosition = vec3.scale(vec3.UNITY, -1, []);
        this._targetPosition = vec3.set(vec3.ZERO, []);
        this._orientation = vec3.set(vec3.UNITZ, []);

        this.mCameraVector = [];
        this.mCameraRightVector = [];

        this.viewAngleX = null;
        this.viewAngleY = Math.PI / 6;
        this.aspectRatio = 1;
        this._updateViewAngleX();
        this.perspectiveNearPlane = 0.01;
        this.perspectiveFarPlane = 64;

        this.orthoNearPlane = 0;
        this.orthoFarPlane = 1;

        this.orthoLeft = 0;
        this.orthoRight = 1;

        this.orthoBottom = 0;
        this.orthoTop = 1;

        this._frustumVolume = [
            {n: [], d: null},//  left
            {n: [], d: null},//  right
            {n: [], d: null},//  top
            {n: [], d: null},// bottom
            {n: [], d: null},//  far
            {n: [], d: null}//  near
        ];

        this.mFrustumSupport = [[], [], [], [], [], [], [], [], [], [], []];
        this.mTargetGeodetic = new Geodetic3D(0, 0, 0);
        this.mCameraGeodetic = new Geodetic3D(0, 0, 0);

    };
    GWTK.gEngine.Renderer.Camera.prototype = {
        /**
         * Получить положение камеры
         * @method getCameraPosition
         * @public
         * @return {array} Координаты положения камеры
         */
        getCameraPosition: function () {
            return this._cameraPosition;
        },
        /**
         * Установить положение камеры
         * @method setCameraPosition
         * @public
         * @param x{number|array} Положение по оси X | Точка в пространстве
         * @param [y]{number} Положение по оси Y
         * @param [z]{number} Положение по оси Z
         */
        setCameraPosition: function (x, y, z) {
            if (Array.isArray(x)) {
                z = x[2];
                y = x[1];
                x = x[0];
            }
            this._cameraPosition[0] = x;
            this._cameraPosition[1] = y;
            this._cameraPosition[2] = z;
        },
        /**
         * Получить положение цели
         * @method getTargetPosition
         * @public
         * @return {array} Координаты положения цели
         */
        getTargetPosition: function () {
            return this._targetPosition;
        },

        /**
         * Получить положение цели в геодезических координатах
         * @method getTargetGeodeticPosition
         * @public
         * @return {Geodetic3D} Координаты положения цели
         */
        getTargetGeodeticPosition: function (globeShape) {
            return globeShape.toGeodetic3d(this._targetPosition, this.mTargetGeodetic);
        },
        /**
         * Установить положение цели
         * @method setTargetPosition
         * @public
         * @param x{number|array} Положение по оси X | Точка в пространстве
         * @param [y]{number} Положение по оси Y
         * @param [z]{number} Положение по оси Z
         */
        setTargetPosition: function (x, y, z) {
            if (Array.isArray(x)) {
                z = x[2];
                y = x[1];
                x = x[0];
            }
            this._targetPosition[0] = x;
            this._targetPosition[1] = y;
            this._targetPosition[2] = z;
        },
        /**
         * Получить вектор ориентации камеры ВВЕРХ
         * @method getOrientation
         * @public
         * @return {array} Координаты положения цели
         */
        getOrientation: function () {
            return this._orientation;
        },
        /**
         * Установить вектор ориентации камеры ВВЕРХ
         * @method setOrientation
         * @public
         * @param x{number|array} Положение по оси X | Точка в пространстве
         * @param [y]{number} Положение по оси Y
         * @param [z]{number} Положение по оси Z
         */
        setOrientation: function (x, y, z) {
            if (Array.isArray(x)) {
                z = x[2];
                y = x[1];
                x = x[0];
            }
            this._orientation[0] = x;
            this._orientation[1] = y;
            this._orientation[2] = z;
            vec3.normalize(this._orientation);
        },
        /**
         * Получить вектор направления камеры
         * @method getCameraVector
         * @public
         * @param [doNotNormalizeFlag] {boolean} Передать вектор расстояния до точки наблюдения
         * @return {Array} Вектор направления камеры
         */
        getCameraVector: function (doNotNormalizeFlag) {
            vec3.sub(this._targetPosition, this._cameraPosition, this.mCameraVector);
            if (doNotNormalizeFlag !== true) {
                vec3.normalize(this.mCameraVector);
            }
            return this.mCameraVector;
        },
        /**
         * Получить вектор направо от направления камеры
         * @method getCameraRightVector
         * @public
         * @return {Array} Вектор направо от направления камеры
         */
        getCameraRightVector: function () {
            var cameraVec = this.getCameraVector();
            vec3.cross(cameraVec, this.getOrientation(), this.mCameraRightVector);
            vec3.normalize(this.mCameraRightVector);
            return this.mCameraRightVector;
        },
        /**
         * Получить угол области обзора наблюдателя
         * @method getViewAngleX
         * @public
         * @return {number} Угол области обзора наблюдателя
         */
        getViewAngleX: function () {
            return this.viewAngleX;
        },
        /**
         * Обновить угол области обзора наблюдателя
         * @method _updateViewAngleX
         * @private
         */
        _updateViewAngleX: function () {
            this.viewAngleX = 2.0 * Math.atan(this.aspectRatio * Math.tan(this.viewAngleY * 0.5));
        },
        /**
         * Получить угол области обзора наблюдателя
         * @method getViewAngleY
         * @public
         * @return {number} Угол области обзора наблюдателя
         */
        getViewAngleY: function () {
            return this.viewAngleY;
        },
        /**
         * Получить глубину ортогональной проекции
         * @method getOrthographicDepth
         * @public
         * @return {number} Глубина ортогональной проекции
         */
        getOrthographicDepth: function () {
            return Math.abs(this.orthoFarPlane - this.orthoNearPlane);
        },
        /**
         * Получить геодезические координаты камеры
         * @method getCameraGeodetic
         * @public
         * @param ellipsoid{GWTK.gEngine.Core.Ellipsoid} Параметры эллипсоида
         * @return {Geodetic3D} Геодезические координаты камеры
         */
        getCameraGeodetic: function (ellipsoid) {
            return ellipsoid.toGeodetic3d(this._cameraPosition, this.mCameraGeodetic);
        },
        /**
         * Получить высоту камеры
         * @method getHeight
         * @public
         * @param ellipsoid{GWTK.gEngine.Core.Ellipsoid} Параметры эллипсоида
         * @return {number} Высота камеры
         */
        getHeight: function (ellipsoid) {
            return this.getCameraGeodetic(ellipsoid).getHeight();
        },
        /**
         * Задать соотношение сторон облати отрисовки
         * @method setAspectRatio
         * @public
         * @param k{number} Соотношение сторон (width/height)
         */
        setAspectRatio: function (k) {
            this.aspectRatio = k;
            this._updateViewAngleX();
        },
        /**
         * Сохранить положение камеры
         * @method saveCameraState
         * @public
         * @return {string} JSON строка состояния камеры
         */
        saveCameraState: function () {
            var json = {
                cameraPosition: this._cameraPosition,
                targetPosition: this._targetPosition,
                orientation: this.getOrientation()
            };
            return this._savedState = JSON.stringify(json);
        },
        /**
         * Загрузить положение камеры
         * @method loadCameraState
         * @public
         * @param json {string|undefined} JSON строка состояния камеры
         */
        loadCameraState: function (json) {
            json = json || this._savedState;
            if (json != null) {
                var parsedJson = JSON.parse(json);
                vec3.set(parsedJson.cameraPosition, this._cameraPosition);
                vec3.set(parsedJson.targetPosition, this._targetPosition);
                this.setOrientation(parsedJson.orientation);
            }
        },
        /**
         * Переместить камеру для охвата сферы
         * @method zoomCameraToSphereRadius
         * @public
         * @param radius {number} Радиус вписанной сферы
         */
        zoomCameraToSphereRadius: function (radius) {
            var vectorToCam = this.mFragmentShader[0];
            vec3.sub(this._cameraPosition, this._targetPosition, vectorToCam);
            vec3.normalize(vectorToCam);

            var sin = Math.sin(Math.min(this.getViewAngleX(), this.viewAngleY) * 0.5);
            var distance = (radius / sin);

            vec3.scaleAndAdd(this._targetPosition, vectorToCam, distance, this._cameraPosition);
        },
        /**
         * Обновить объем пирамиды обзора
         * @method updateFrustumVolume
         * @public
         */
        updateFrustumVolume: function () {
            // Compute the center points of the near and far planes:
            var camForward = this.getCameraVector();
            var camRight = this.getCameraRightVector();
            var nearCenter = vec3.add(this._cameraPosition, vec3.scale(camForward, this.perspectiveNearPlane, this.mFrustumSupport[1]), this.mFrustumSupport[1]);
            var farCenter = vec3.add(this._cameraPosition, vec3.scale(camForward, this.perspectiveFarPlane, this.mFrustumSupport[2]), this.mFrustumSupport[2]);

            // Compute the widths and heights of the near and far planes:
            var nearHeight = 2. * Math.tan(this.viewAngleY / 2) * this.perspectiveNearPlane;
            var farHeight = 2. * Math.tan(this.viewAngleY / 2) * this.perspectiveFarPlane;
            var nearWidth = nearHeight * this.aspectRatio;
            var farWidth = farHeight * this.aspectRatio;
            var orientation = this.getOrientation();
            // Compute the corner points from the near and far planes:
            var farTopLeft = vec3.add(farCenter, vec3.sub(vec3.scale(orientation, farHeight * 0.5, this.mFrustumSupport[3]), vec3.scale(camRight, farWidth * 0.5, this.mFrustumSupport[0]), this.mFrustumSupport[3]), this.mFrustumSupport[3]);
            var farTopRight = vec3.add(farCenter, vec3.add(vec3.scale(orientation, farHeight * 0.5, this.mFrustumSupport[4]), vec3.scale(camRight, farWidth * 0.5, this.mFrustumSupport[0]), this.mFrustumSupport[4]), this.mFrustumSupport[4]);
            var farBottomLeft = vec3.sub(farCenter, vec3.add(vec3.scale(orientation, farHeight * 0.5, this.mFrustumSupport[5]), vec3.scale(camRight, farWidth * 0.5, this.mFrustumSupport[0]), this.mFrustumSupport[5]), this.mFrustumSupport[5]);
            var farBottomRight = vec3.sub(farCenter, vec3.sub(vec3.scale(orientation, farHeight * 0.5, this.mFrustumSupport[6]), vec3.scale(camRight, farWidth * 0.5, this.mFrustumSupport[0]), this.mFrustumSupport[6]), this.mFrustumSupport[6]);

            var nearTopLeft = vec3.add(nearCenter, vec3.sub(vec3.scale(orientation, nearHeight * 0.5, this.mFrustumSupport[7]), vec3.scale(camRight, nearWidth * 0.5, this.mFrustumSupport[0]), this.mFrustumSupport[7]), this.mFrustumSupport[7]);
            var nearTopRight = vec3.add(nearCenter, vec3.add(vec3.scale(orientation, nearHeight * 0.5, this.mFrustumSupport[8]), vec3.scale(camRight, nearWidth * 0.5, this.mFrustumSupport[0]), this.mFrustumSupport[8]), this.mFrustumSupport[8]);
            var nearBottomLeft = vec3.sub(nearCenter, vec3.add(vec3.scale(orientation, nearHeight * 0.5, this.mFrustumSupport[9]), vec3.scale(camRight, nearWidth * 0.5, this.mFrustumSupport[0]), this.mFrustumSupport[9]), this.mFrustumSupport[9]);
            var nearBottomRight = vec3.sub(nearCenter, vec3.sub(vec3.scale(orientation, nearHeight * 0.5, this.mFrustumSupport[10]), vec3.scale(camRight, nearWidth * 0.5, this.mFrustumSupport[0]), this.mFrustumSupport[10]), this.mFrustumSupport[10]);

            // Compute each plane from any three corners of the plane, wound CW or CCW to point inward (depending on coordinate system).

            var left = vec3.normalize(Calculate.calcNormal(nearTopLeft, farTopLeft, farBottomLeft), this._frustumVolume[0]['n']);
            this._frustumVolume[0]['d'] = -(left[0] * farTopLeft[0] + left[1] * farTopLeft[1] + left[2] * farTopLeft[2]);

            var right = vec3.normalize(Calculate.calcNormal(nearBottomRight, farBottomRight, nearTopRight), this._frustumVolume[1]['n']);
            this._frustumVolume[1]['d'] = -(right[0] * farBottomRight[0] + right[1] * farBottomRight[1] + right[2] * farBottomRight[2]);

            var top = vec3.normalize(Calculate.calcNormal(nearTopLeft, farTopRight, farTopLeft), this._frustumVolume[2]['n']);
            this._frustumVolume[2]['d'] = -(top[0] * farTopRight[0] + top[1] * farTopRight[1] + top[2] * farTopRight[2]);

            var bottom = vec3.normalize(Calculate.calcNormal(nearBottomLeft, farBottomLeft, farBottomRight), this._frustumVolume[3]['n']);
            this._frustumVolume[3]['d'] = -(bottom[0] * farBottomLeft[0] + bottom[1] * farBottomLeft[1] + bottom[2] * farBottomLeft[2]);

            var far = vec3.normalize(Calculate.calcNormal(farTopRight, farBottomLeft, farTopLeft), this._frustumVolume[4]['n']);
            this._frustumVolume[4]['d'] = -(far[0] * farTopRight[0] + far[1] * farTopRight[1] + far[2] * farTopRight[2]);

            var near = vec3.normalize(Calculate.calcNormal(nearBottomLeft, nearBottomRight, nearTopRight), this._frustumVolume[5]['n']);
            this._frustumVolume[5]['d'] = -(near[0] * nearBottomLeft[0] + near[1] * nearBottomLeft[1] + near[2] * nearBottomLeft[2]);

            return this._frustumVolume;

            // return [
            //     {n: left, d: leftD},//  left
            //     {n: right, d: rightD},//  right
            //     {n: top, d: topD},//  top
            //     {n: bottom, d: bottomD},// bottom
            //     {n: far, d: farD},//  far
            //     {n: near, d: nearD}//  near
            // ];
        },
        /**
         * Получить пирамиду обзора
         * @method getFrustumVolume
         * @public
         * @return {array} Плоскости пирамиды обзора
         */
        getFrustumVolume: function () {
            // this.updateFrustumVolume();
            return this._frustumVolume;
        }

        // getFrustumGeometry: function () {
        //
        //     var sup = [];
        //     var Calculate = Calculate;
        //
        //     // Compute the center points of the near and far planes:
        //     var camForward = this.getCameraVector();
        //     var camRight = this.getCameraRightVector();
        //     var nearCenter = vec3.add(this._cameraPosition, vec3.scale(camForward, this.perspectiveNearPlane, []), []);
        //     var farCenter = vec3.add(this._cameraPosition, vec3.scale(camForward, this.perspectiveFarPlane, []), []);
        //
        //     // Compute the widths and heights of the near and far planes:
        //     var nearHeight = 2 * Math.tan(this.viewAngleY / 2) * this.perspectiveNearPlane;
        //     var farHeight = 2 * Math.tan(this.viewAngleY / 2) * this.perspectiveFarPlane;
        //     var nearWidth = nearHeight * this.aspectRatio;
        //     var farWidth = farHeight * this.aspectRatio;
        //
        //     // Compute the corner points from the near and far planes:
        //     var farTopLeft = vec3.add(farCenter, vec3.sub(vec3.scale(this._orientation, farHeight * 0.5, []), vec3.scale(camRight, farWidth * 0.5, []), []), []);
        //     var farTopRight = vec3.add(farCenter, vec3.add(vec3.scale(this._orientation, farHeight * 0.5, []), vec3.scale(camRight, farWidth * 0.5, []),[]), []);
        //     var farBottomLeft = vec3.sub(farCenter, vec3.add(vec3.scale(this._orientation, farHeight * 0.5, []), vec3.scale(camRight, farWidth * 0.5, []), []), []);
        //     var farBottomRight = vec3.sub(farCenter, vec3.sub(vec3.scale(this._orientation, farHeight * 0.5, []), vec3.scale(camRight, farWidth * 0.5, []),[]), []);
        //
        //     var nearTopLeft = vec3.add(nearCenter, vec3.sub(vec3.scale(this._orientation, nearHeight * 0.5,[]), vec3.scale(camRight, nearWidth * 0.5,[]), []), []);
        //     var nearTopRight = vec3.add(nearCenter, vec3.add(vec3.scale(this._orientation, nearHeight * 0.5, []), vec3.scale(camRight, nearWidth * 0.5, []), []), []);
        //     var nearBottomLeft = vec3.sub(nearCenter, vec3.add(vec3.scale(this._orientation, nearHeight * 0.5,[]), vec3.scale(camRight, nearWidth * 0.5, []), []), []);
        //     var nearBottomRight = vec3.sub(nearCenter, vec3.sub(vec3.scale(this._orientation, nearHeight * 0.5, []), vec3.scale(camRight, nearWidth * 0.5, []), []), []);
        //
        //     return [].concat(
        //         farTopLeft, farBottomLeft, farBottomRight, farTopRight
        //         // nearTopLeft, nearBottomLeft, farBottomLeft, farTopLeft,
        //         // farTopRight, farBottomRight, nearBottomRight, nearTopRight
        //     );
        // }
    }
}