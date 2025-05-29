/******************************************** Тазин В. 26/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Источник освещения                         *
 *                                                                  *
 *******************************************************************/
import Trigonometry from '~/3d/engine/core/trigonometry';
import { vec3 } from '~/3d/engine/utils/glmatrix';

"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс источника освещения
     * @class GWTK.gEngine.Scene.LightSource
     * @constructor GWTK.gEngine.Scene.LightSource
     */
    GWTK.gEngine.Scene.LightSource = function () {
        this._distance = 100000000;

        this._projectorPosition = [];
        this._projectorDeltaScale = -Math.tan(Trigonometry.toRadians(15));
        this._projectorColor = {
            ambient: [0.6, 0.6, 0.6, 1.0],
            diffuse: [0.6, 0.6, 0.6, 1.0],
            specular: [0.25, 0.25, 0.25, 1.0]
        };
        //TODO: перейти к типу описания материала

        this._sunPosition = [];
        this._sunColor = {
            ambient: [0.2, 0.2, 0.2, 1.0],
            diffuse: [0.75, 0.75, 0.75, 1.0],
            specular: [0.5, 0.5, 0.5, 1.0]
        };
        this._sunLastUpdateTime = -3600000;
        //TODO: перейти к типу описания материала

        this._rotateAngle = null;

        this._updateSunPosition();

        this._position = this._sunPosition;
        this._lightColor = this._sunColor;
    };
    GWTK.gEngine.Scene.LightSource.prototype = {
        /**
         * Обновление положения Солнца
         * @method _updateSunPosition
         * @private
         */
        _updateSunPosition: function () {
            if (this._sunLastUpdateTime + 3600000 <= Date.now()) {
                var cDate = new Date(),
                    currentYear = cDate.getUTCFullYear();
                //     currentMonth = cDate.getUTCMonth(),
                //     currentDay = cDate.getUTCDate(),
                //     currentDate = new Date(currentYear, currentMonth, currentDay),
                //     delta = currentDate - new Date(currentYear, 5, 22);
                // delta /= 365 * 24 * 3600 * 1000;
                // delta *= 2 * Math.PI;
                // delta += cDate.getUTCHours() * 15 * Math.PI / 180;
                // this._setSolaceRotateAngle(-delta+Math.PI/4);
                var Triginometry = Trigonometry;

                var contrDate = new Date(currentYear, 5, 22);
                var dDays = (cDate - contrDate) / 86400000;
                var L = Math.PI * 2 * dDays / 366;
                var inclineAngle = Triginometry.toRadians(23.5) * (1.25 - 4 * Math.abs(dDays) / 366);
                this._rotateAngle = L + cDate.getUTCHours() * Triginometry.toRadians(15);
                var hourRotateAngle = -cDate.getUTCHours() * Triginometry.toRadians(15) + Math.PI;

                this._sunPosition[0] = Math.cos(hourRotateAngle);
                this._sunPosition[1] = Math.sin(hourRotateAngle);
                this._sunPosition[2] = Math.sin(inclineAngle);
                vec3.scale(this._sunPosition, this._distance);

                this._sunLastUpdateTime = Date.now();
            }
        },
        /**
         * Обновление положения прожектора
         * @method _updateProjectorPosition
         * @private
         */
        _updateProjectorPosition: function (camera) {
            var cameraVector = camera.getCameraVector();
            var cameraRightVector = camera.getCameraRightVector();
            var cameraUpVector = camera.getOrientation();

            vec3.set(cameraVector, this._projectorPosition); // луч по направлению взгляда
            vec3.scaleAndAdd(this._projectorPosition, cameraRightVector, this._projectorDeltaScale, this._projectorPosition); // смещаем луч на несколько градусов влево
            vec3.scaleAndAdd(this._projectorPosition, cameraUpVector, this._projectorDeltaScale, this._projectorPosition); // смещаем луч на несколько градусов вниз

            vec3.scale(this._projectorPosition, -this._distance); // переходим к положению источника луча
        },
        /**
         * Получить цвет источника освещения
         * @method getLightColor
         * @public
         * @return {object} Материал света
         */
        getLightColor: function () {
            //TODO: перейти к типу описания материала
            return this._lightColor;
        },
        /**
         * Получить угол поворота источника освещения
         * @method getRotateAngle
         * @public
         * @return {number} Угол поворота в радианах
         */
        getRotateAngle: function () {
            return this._rotateAngle;
        },
        /**
         * Получить положение источника освещения
         * @method getPosition
         * @public
         * @return {Array} Координаты положения источника освещения
         */
        getPosition: function () {
            return this._position;
        },
        /**
         * Установить Солнце в качестве источника освещения
         * @method setSunMode
         * @public
         */
        setSunMode: function () {
            this._position = this._sunPosition;
            this._lightColor = this._sunColor;
        },
        /**
         * Установить прожектор в качестве источника освещения
         * @method setProjectorMode
         * @public
         */
        setProjectorMode: function () {
            this._position = this._projectorPosition;
            this._lightColor = this._projectorColor;
        },
        /**
         * Обновить состояние источника освещения
         * @method update
         * @public
         * @param camera {GWTK.gEngine.Renderer.Camera} Объект камеры
         */
        update: function (camera) {
            this._updateProjectorPosition(camera);
            this._updateSunPosition();
        }
    };
}
