/****************************************** Тазин В.О. 10/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент измерения длины                        *
 *                                                                  *
 *******************************************************************/
"use strict";
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { IntersectionTests } from '~/3d/engine/core/collisiondetection/collisiondetection';
import { Calculate, vec3 } from '~/3d/engine/utils/glmatrix';

if (window.GWTK) {
    
    /**
     * Интерфейс компонента просмотра с воздуха
     * @class GWTK.gEngine.Scene.PointSource
     * @constructor GWTK.gEngine.Scene.PointSource
     */
    GWTK.gEngine.Scene.PointSource = function(ellipsoid, opacityMode) {
        this._depthPointCoords = [0, 0];
        this._targetPointCoords = [-1, -1];
        this.depthFramebuffer = new GWTK.gEngine.Renderer.DepthFramebuffer(opacityMode);
        this.sceneState = opacityMode.sceneState;
        this.updatePointHandler = this._updatePointHandler.bind(this);
        this.cleanPointValue = this._cleanPointValue.bind(this);
        this.ellipsoid = ellipsoid;
        this.mRayDirection = [];
        this.mSpherePos = [0, 0, 0];
        this.cursorPointObject = {
            geo: new Geodetic3D(0, 0, 0),
            normal: [1, 0, 0],
            widthoutHeight: true
        };
        this.isDirty = false;
        this._initHandlers();
    };
    GWTK.gEngine.Scene.PointSource.prototype = {
        
        /**
         * Инициализация обработчиков событий
         * @method _initHandlers
         * @private
         */
        _initHandlers: function() {
            GWTK.gEngine.Mediator.subscribe('preRenderScene', this.cleanPointValue);
            GWTK.gEngine.Mediator.publish('mouseEventSubscription', {
                type: 'mousemove',
                handler: this.updatePointHandler
            });
        },
        
        /**
         * Удаление обработчиков событий
         * @method _removeHandlers
         * @private
         */
        _removeHandlers: function() {
            GWTK.gEngine.Mediator.unsubscribe('preRenderScene', this.cleanPointValue);
            GWTK.gEngine.Mediator.publish('mouseEventUnsubscription', {
                type: 'mousemove',
                handler: this.updatePointHandler
            });
        },
        
        /**
         * Обработчик запроса обновления точки под курсором
         * @method _updatePointHandler
         * @private
         * @param e {GWTK.gEngine.EventArgs} Объект события
         */
        _updatePointHandler: function(e) {
            var x = e.data.x;
            var y = e.data.y;
            
            if (x !== this._targetPointCoords[0] || y !== this._targetPointCoords[1]) {
                this.isDirty = true;
                this._targetPointCoords[0] = x;
                this._targetPointCoords[1] = y;
            }
        },
        /**
         * Обработчик обновления точки под курсором
         * @method _cleanPointValue
         * @private
         */
        _cleanPointValue: function() {
            this.depthFramebuffer.renderDepth();
            if (this.isDirty) {
                var x = this._targetPointCoords[0];
                var y = this._targetPointCoords[1];
                if (x !== this._depthPointCoords[0] || y !== this._depthPointCoords[1]) {
                    this._depthPointCoords[0] = x;
                    this._depthPointCoords[1] = y;
                    var viewPort = GWTK.gEngine.Renderer.Context.getViewPort();
                    var targetTextureWidth = viewPort[2];
                    var targetTextureHeight = viewPort[3];
                    if (this.sceneState.getCamera().getHeight(this.ellipsoid) <= 325000) {
                        
                        var coords = [];
                        coords[0] = x;
                        coords[1] = y;
                        if (coords[0] > targetTextureWidth - 2) {
                            coords[0] -= 2;
                        }
                        if (coords[1] > targetTextureHeight - 2) {
                            coords[1] -= 2;
                        }
                        
                        var vertex0 = this.depthFramebuffer.getPoint(coords);
                        coords[1] += 2;
                        var vertex1 = this.depthFramebuffer.getPoint(coords);
                        coords[0] += 2;
                        coords[1] -= 2;
                        var vertex2 = this.depthFramebuffer.getPoint(coords);
                        
                        if (vertex0 !== undefined && vertex1 !== undefined && vertex2 !== undefined) {
                            Calculate.calcNormal(vertex0, vertex1, vertex2, this.cursorPointObject.normal);
                            vec3.normalize(this.cursorPointObject.normal);
                        }
                        var point = this.depthFramebuffer.getPoint(this._depthPointCoords);
                        if (point) {
                            this.ellipsoid.toGeodetic3d(point, this.cursorPointObject.geo);
                        }
                        this.cursorPointObject.widthoutHeight = false;
                    }else{
                        
                        this.mSpherePos[0] = this.mSpherePos[1] = this.mSpherePos[2] = 0;
                        const radii=this.ellipsoid.getRadius();
                        var point = IntersectionTests.tryRaySphere(this.sceneState.getCamera().getCameraPosition(), Calculate.getPointerDirection(this.sceneState.getCamera(), x, y, targetTextureWidth, targetTextureHeight, this.mRayDirection), this.mSpherePos, radii[0]);
                        if (point) {
                            this.ellipsoid.toGeodetic3d(point, this.cursorPointObject.geo);
                            vec3.normalize(point, this.cursorPointObject.normal);
                            this.cursorPointObject.widthoutHeight = true;
                        }
                    }
                    
                }
                this.isDirty = false;
                GWTK.gEngine.Mediator.publish("cursorPoint", this.cursorPointObject);
            }
        },
        
        
        /**
         * Завершить работу компонента
         * @method destroy
         * @public
         */
        destroy: function() {
            this._removeHandlers();
            this._depthPointCoords.length = 0;
            this._depthPointCoords = null;
            this.depthFramebuffer.destroy();
            this.depthFramebuffer = null;
            this.cursorPointObject = null;
            this.mRayDirection.length = 0;
            this.mRayDirection = null;
            this.mSpherePos.length = 0;
            this.mSpherePos = null;
        }
    };
}
