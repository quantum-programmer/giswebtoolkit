/******************************************** Тазин В. 28/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Класс анимации трехмерной модели               *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    /**
     * Класс анимации
     * @class GWTK.gEngine.AnimationClass
     * @constructor GWTK.gEngine.AnimationClass
     * @param map3dData {GWTK.Map3dData} Объект параметров карты
     */
    GWTK.gEngine.AnimationClass = function (map3dData) {
        this.map3dData = map3dData;
        this.speedUnit = 1.0;
        this.tempMapcenter = [];
        this.tempAngleEvent = {
            "deltaRotateAngle": null,
            "deltaInclineAngle": null
        };

        var mediator = GWTK.gEngine.Mediator;
        mediator.subscribe('updateScene', this);
        mediator.subscribe('animationStop', this.resetAllAnimation.bind(this));
        mediator.subscribe('animationInclineReset', this.initIncline.bind(this));
        mediator.subscribe('animationRotateReset', this.initRotate.bind(this));
    };
    GWTK.gEngine.AnimationClass.prototype = {
        /**
         * Сброс анимации наклона
         * @method initIncline
         * @public
         */
        initIncline: function () {
            this.animationInclineProcess = false;
            this.targetInclineAngle = null;
        },
        /**
         * Сброс анимации поворота
         * @method initRotate
         * @public
         */
        initRotate: function () {
            this.animationRotationProcess = false;
            this.targetRotateAngle = null;
        },
        /**
         * Установить скорость анимации
         * @method setAnimationSpeed
         * @public
         */
        setAnimationSpeed: function (value) {
            if (value != null) {
                this.speedUnit = value;
            }
        },
        /**
         * Сбросить скорость анимации
         * @method setAnimationSpeed
         * @public
         */
        resetAnimationSpeed: function () {
            this.speedUnit = 1.0;
        },
        /**
         * Обновление анимации
         * @method update
         * @public
         * @param e {Object} Событие
         */
        update: function (e) {
            var time = e.currentDelay != null ? e.currentDelay / 1000 : 0.333;
            time *= this.speedUnit;
            var mediator = GWTK.gEngine.Mediator;

            //анимация вращения
            if (this.animationRotationProcess) {
                this.tempAngleEvent.deltaInclineAngle = null;
                // time = e.currentDelay != null ? e.currentDelay / 1000 : 0.333;
                var rotationAngle = this.rotationAngle * time;
                if (this.targetRotateAngle !== null) {
                    var currentAngle = this.targetRotateAngle - this.map3dData.getRotateAngle();
                    if (currentAngle * (currentAngle - rotationAngle) <= 0) {
                        this.tempAngleEvent.deltaRotateAngle = currentAngle;
                        mediator.publish('changeCameraView', this.tempAngleEvent);
                        this._animateRotationStop();
                    } else {
                        this.tempAngleEvent.deltaRotateAngle = rotationAngle;
                        mediator.publish('changeCameraView', this.tempAngleEvent);
                    }
                } else {
                    this.tempAngleEvent.deltaRotateAngle = rotationAngle;
                    mediator.publish('changeCameraView', this.tempAngleEvent);
                }
            }

            //анимация наклона
            if (this.animationInclineProcess) {
                this.tempAngleEvent.deltaRotateAngle = null;
                if (this.targetInclineAngle !== null) {
                    currentAngle = this.targetInclineAngle - this.map3dData.getInclineAngle();
                }
                if (currentAngle !== null && Math.abs(currentAngle) <= Math.abs(this.inclineAngle)) {
                    this.tempAngleEvent.deltaInclineAngle = currentAngle;
                    mediator.publish('changeCameraView', this.tempAngleEvent);
                    this._animateInclineStop();
                } else {
                    this.tempAngleEvent.deltaInclineAngle = this.inclineAngle;
                    mediator.publish('changeCameraView', this.tempAngleEvent);
                }
            }
        },
        /**
         * Анимация поворота
         * @method animateRotation
         * @public
         */
        animateRotation: function (delta, targetAngle) {
            if (delta) {
                this.animationRotationProcess = true;
                this.rotationAngle = delta;
                this.targetRotateAngle = targetAngle;
            } else {
                this.initRotate();
            }
        },
        /**
         * Остановка анимации поворота
         * @method _animateRotationStop
         * @private
         */
        _animateRotationStop: function () {
            this.initRotate();
            GWTK.gEngine.Mediator.publish('writeCookie');
        },

        /**
         * Анимация наклона
         * @method animateIncline
         * @public
         */
        animateIncline: function (delta, targetAngle) {
            if (delta) {
                this.animationInclineProcess = true;
                this.inclineAngle = delta;
                this.targetInclineAngle = targetAngle;
            } else {
                this.initIncline();
            }
        },
        /**
         * Остановка анимации наклона
         * @method _animateInclineStop
         * @private
         */
        _animateInclineStop: function () {
            this.initIncline();
            GWTK.gEngine.Mediator.publish('writeCookie');
        },
        /**
         * Остановка анимаций
         * @method resetAllAnimation
         * @public
         */
        resetAllAnimation: function () {
            this._animateInclineStop();
            this._animateRotationStop();
        }
    }
}