/******************************************** Тазин В. 26/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Класс параметров сцены 3D вида                *
 *                                                                  *
 *******************************************************************/
"use strict";
import { mat4 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};
    /**
     * Класс параметров сцены 3D вида
     * @class GWTK.gEngine.Renderer.SceneState
     * @constructor GWTK.gEngine.Renderer.SceneState
     */
    GWTK.gEngine.Renderer.SceneState = function() {
        
        this._camera = new GWTK.gEngine.Renderer.Camera();
        this._distanceFromSurface = 0;
        this.uFcoef = 1;
        
        this._sunPosition = [10000000, 0, 0];
        this._enableSun = 1;
        this._lightSource = new GWTK.gEngine.Scene.LightSource();
        
        this.highResolutionSnapScale = 1;
        
        
        this._modelMatrix = mat4.create(mat4.IDENTITY);
        
        this.mViewportTransformationMatrix = mat4.create(mat4.IDENTITY);
        this.mPerspectiveMatrix = mat4.create(mat4.IDENTITY);
        this.mOrthoMatrix = mat4.create(mat4.IDENTITY);
        this.mViewOrthoMatrix = mat4.create(mat4.IDENTITY);
        this.mViewMatrix = mat4.create(mat4.IDENTITY);
        this.mModelViewMatrix = mat4.create(mat4.IDENTITY);
        this.mModelViewPerspectiveMatrix = mat4.create(mat4.IDENTITY);
        this.mViewPerspectiveMatrix = mat4.create(mat4.IDENTITY);
        this.mModelViewOrthoMatrix = mat4.create(mat4.IDENTITY);
        this.mDiffuseSpecularAmbientShininess = [];
        this.mHalfDim = [];
        this.mViewPortDim = [];
        
        this.scissorBbox = [0, 0, 1, 1];
        this.wireFrameMode = false;
    };
    GWTK.gEngine.Renderer.SceneState.prototype = {
        /**
         * Получить источник освещения
         * @method getLightSource
         * @public
         * @return {GWTK.gEngine.Scene.LightSource} Источник освещения
         */
        getLightSource: function() {
            return this._lightSource;
        },
        
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
         * Получить положение камеры
         * @method getCameraPosition
         * @public
         * @return {Array} Положение камеры
         */
        getCameraPosition: function() {
            return this._camera.getCameraPosition();
        },
        /**
         * Получить материал цвета источника света
         * @method getDiffuseSpecularAmbientShininess
         * @public
         * @return {array} Материал цвета источника света
         */
        getDiffuseSpecularAmbientShininess: function() {
            
            var lightColor = this._lightSource.getLightColor();
            this.mDiffuseSpecularAmbientShininess[0] = lightColor.diffuse;
            this.mDiffuseSpecularAmbientShininess[1] = lightColor.specular;
            this.mDiffuseSpecularAmbientShininess[2] = lightColor.ambient;
            this.mDiffuseSpecularAmbientShininess[3] = 12;
            
            return this.mDiffuseSpecularAmbientShininess;
        },
        /**
         * Получить матрицу пересчета экранных координат
         * @method getViewportTransformationMatrix
         * @public
         * @param viewport {array} Прямоугольник видимой области экрана
         * @param nearDepthRange {number} Минимальная глубина
         * @param farDepthRange {number} Максимальная глубина
         * @return {array|undefined} Матрица пересчета экранных координат
         */
        getViewportTransformationMatrix: function(viewport, nearDepthRange, farDepthRange) {
            this.mHalfDim[0] = viewport[2] * 0.5;
            this.mHalfDim[1] = viewport[3] * 0.5;
            this.mHalfDim[2] = (farDepthRange - nearDepthRange) * 0.5;
            this.mViewPortDim[0] = viewport[0] + this.mHalfDim[0];
            this.mViewPortDim[1] = viewport[1] + this.mHalfDim[1];
            this.mViewPortDim[2] = nearDepthRange + this.mHalfDim[2];
            
            mat4.identity(this.mViewportTransformationMatrix);
            mat4.translate(this.mViewportTransformationMatrix, this.mViewPortDim);
            mat4.scale(this.mViewportTransformationMatrix, this.mHalfDim);
            
            return this.mViewportTransformationMatrix;
        },
        /**
         * Обновить матрицу перспективы
         * @method _updatePerspectiveMatrix
         * @private
         */
        _updatePerspectiveMatrix: function() {
            mat4.identity(this.mPerspectiveMatrix);
            var camera = this._camera;
            mat4.perspective(camera.getViewAngleY() * 0.5, camera.aspectRatio, camera.perspectiveNearPlane, camera.perspectiveFarPlane, this.mPerspectiveMatrix);
        },
        /**
         * Получить матрицу перспективы
         * @method getPerspectiveMatrix
         * @public
         * @return {Array} Матрица перспективы
         */
        getPerspectiveMatrix: function() {
            return this.mPerspectiveMatrix;
        },
        
        
        /**
         * Обновить прямоугольную матрицу проекции
         * @method _updateOrthoMatrix
         * @private
         */
        _updateOrthoMatrix: function() {
            mat4.identity(this.mOrthoMatrix);
            var camera = this._camera;
            return mat4.ortho(camera.orthoLeft, camera.orthoRight, camera.orthoTop, camera.orthoBottom, camera.orthoNearPlane, camera.orthoFarPlane, this.mOrthoMatrix);
        },
        /**
         * Получить прямоугольную матрицу проекции
         * @method getOrthoMatrix
         * @public
         * @return {Array} Прямоугольная матрица проекции
         */
        getOrthoMatrix: function() {
            return this.mOrthoMatrix;
        },
        
        /**
         * Получить видовую прямоугольную матрицу проекции по параметрам окна
         * @method getViewportOrthoMatrix
         * @public
         * @param viewport {array} Окно рисования
         * @return {Array} Видовая прямоугольная матрица проекции
         */
        getViewportOrthoMatrix: function(viewport) {
            mat4.identity(this.mViewOrthoMatrix);
            return mat4.ortho(viewport[0], viewport[2], viewport[1], viewport[3], 0., 1., this.mViewOrthoMatrix);
        },
        
        /**
         * Получить видовую матрицу
         * @method getViewMatrix
         * @public
         * @return {array} Видовая матрица
         */
        getViewMatrix: function() {
            var camera = this._camera;
            return mat4.lookAt(camera.getCameraPosition(), camera.getTargetPosition(), camera.getOrientation(), this.mViewMatrix);
        },
        /**
         * Получить матрицу модели сцены
         * @method getModelMatrix
         * @public
         * @return {array} Матрица модели сцены
         */
        getModelMatrix: function() {
            return this._modelMatrix;
        },
        /**
         * Установить матрицу модели сцены
         * @method setModelMatrix
         * @public
         * @param matrix{array} Матрица модели сцены
         */
        setModelMatrix: function(matrix) {
            if (Array.isArray(matrix)) {
                mat4.set(matrix, this._modelMatrix);
            }
        },
        /**
         * Сбросить матрицу модели сцены
         * @method resetModelMatrix
         * @public
         */
        resetModelMatrix: function() {
            mat4.identity(this._modelMatrix);
        },
        /**
         * Получить видовую матрицу модели сцены
         * @method getModelViewMatrix
         * @public
         * @return {array} Видовая матрица модели сцены
         */
        getModelViewMatrix: function() {
            return mat4.multiply(this.getViewMatrix(), this.getModelMatrix(), this.mModelViewMatrix);
        },
        /**
         * Получить перспективную видовую матрицу модели сцены
         * @method getModelViewPerspectiveMatrix
         * @public
         * @return {Array} Перспективная видовая матрица модели сцены
         */
        getModelViewPerspectiveMatrix: function() {
            return mat4.multiply(this.getPerspectiveMatrix(), this.getModelViewMatrix(), this.mModelViewPerspectiveMatrix);
        },
        
        /**
         * Получить перспективную видовую матрицу сцены
         * @method getViewPerspectiveMatrix
         * @public
         * @return {Array} Перспективная видовая матрица сцены
         */
        getViewPerspectiveMatrix: function() {
            return mat4.multiply(this.getPerspectiveMatrix(), this.getViewMatrix(), this.mViewPerspectiveMatrix);
        },
        
        /**
         * Обновить состояние сцены
         * @method update
         * @public
         * @param map3dData {GWTK.Map3dData} Компонент 3d параметров карты
         */
        update: function(map3dData) {
            this._lightSource.update(this.getCamera());
            
            this._updatePerspectiveMatrix();
            this._updateOrthoMatrix();
            
            this.uFcoef = 2.0 * Math.LN2 / Math.log(this.getCamera().perspectiveFarPlane + 1.0);
            
            this._distanceFromSurface = map3dData._cameraLookAtPoint.getRange() * Math.sin(map3dData._cameraLookAtPoint.getElevation());
        },
        /**
         * Получить расстояние от камеры до плоскости поверхности
         * @method getCameraDistanceFromSurface
         * @public
         * @return {number} Расстояние от камеры до плоскости поверхности
         */
        getCameraDistanceFromSurface: function() {
            return this._distanceFromSurface;
        },
        /**
         * Переключение каркасного режима отображения объектов
         * @method toggleViewFrame
         * @public
         */
        toggleViewMode: function() {
            this.wireFrameMode = !this.wireFrameMode;
            GWTK.gEngine.Mediator.publish('changeViewMode', this.wireFrameMode);
        }
    };
}
