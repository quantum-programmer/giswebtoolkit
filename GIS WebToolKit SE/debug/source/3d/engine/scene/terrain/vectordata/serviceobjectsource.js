/****************************************** Тазин В.О. 10/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Слой сервисных объектов                     *
 *                                                                  *
 *******************************************************************/
"use strict";
import GeoJSON from '~/utils/GeoJSON';
import Trigonometry from '~/3d/engine/core/trigonometry';
import WorkerManager from '~/3d/engine/worker/workermanager';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { ProjectionCollection } from '~/3d/engine/core/geometry/projection';
import Mesh from '~/3d/engine/core/geometry/mesh';
import BoundingSphere3D from '~/3d/engine/core/boundingvolumes/boundingsphere3d';
import Interval from '~/3d/engine/core/interval';
import { MessageQueueCommand } from '~/3d/engine/worker/workerscripts/queue';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс слоя сервисных объектов
     * @class GWTK.gEngine.Scene.ServiceObjectLayer
     * @constructor GWTK.gEngine.Scene.ServiceObjectLayer
     * @param map {GWTK.Map} Объект карты
     * @param [singleObject] {boolean} Флаг наличие только одного объекта рисования
     */
    GWTK.gEngine.Scene.ServiceObjectLayer = function (map, singleObject) {
        this._map = map;
        this._singleObject = singleObject;
        this._messageQueue = WorkerManager.getWorker();
        this._prefix = "serviceObjectSource_" + Math.random();
        this._mVectorCache = null;
        this._distanceLimits = new Interval(Number.MIN_VALUE, Number.MAX_VALUE);
        this.requestData = null;
        this._meshInstancedIdArray = [];
        this._meshInstancedArray = [];
        this._metricLoadHandler = this._metricLoadHandler.bind(this);
        this._active = true;
        this._featureLoadHandlers = [];
        this._init();
    };
    GWTK.gEngine.Scene.ServiceObjectLayer.prototype = {
        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function () {
            this._serviceNode = new GWTK.gEngine.Scene.ServiceNode();
            var obb=new BoundingSphere3D();
            this._serviceNode.setOBB(obb);
            this._serviceNode.createModelNodeList();

            this.sendRequest = this._sendRequest.bind(this);
            this.render = this._render.bind(this);

            var mediator = GWTK.gEngine.Mediator;
            mediator.subscribe('updateScene', this.sendRequest);
            mediator.subscribe('renderOverlay', this.render);

        },
        /**
         * Получить узел сервисных объектов
         * @method getServiceNode
         * @public
         * @return {GWTK.gEngine.Scene.ServiceNode} Узел сервисных объектов
         */
        getServiceNode: function () {
            return this._serviceNode;
        },
        /**
         * Установить параметр активности слоя
         * @method setActive
         * @public
         * @param flag {boolean} Активность слоя
         */
        setActive: function (flag) {
            this._active = flag;
        },
        /**
         * Загрузка объекта
         * @method _onFeatureLoad
         * @private
         * @param renderable {GWTK.gEngine.Scene.RenderableCollection} Объект
         */
        _onFeatureLoad: function (renderable) {
            for (var i = 0; i < this._featureLoadHandlers.length; i++) {
                this._featureLoadHandlers[i](renderable)
            }
        },
        /**
         * Добавить обработчик загрузки объекта
         * @method addFeatureLoadHandler
         * @public
         * @param callback {function} Функция-обработчик
         */
        addFeatureLoadHandler: function (callback) {
            this._featureLoadHandlers.push(callback);
        },
        /**
         * Удалить обработчик загрузки объекта
         * @method addFeatureLoadHandler
         * @public
         * @param callback {function} Функция-обработчик
         */
        removeFeatureLoadHandler: function (callback) {
            for (var i = 0; i < this._featureLoadHandlers.length; i++) {
                if (this._featureLoadHandlers[i] === callback) {
                    this._featureLoadHandlers.splice(i, 1);
                    return callback;
                }
            }
        },

        /**
         * Запросить меш объектов
         * @method requestMesh
         * @public
         * @param geoJSON {GWTK.gEngine.GeoJSON|object} Описание объектов в формате geoJSON
         * @param [layerId] {string} Идентификатор слоя шаблонов классификатора
         * @param [noHeights] {boolean} Не отправлять тайл высот
         */
        requestMesh: function (geoJSON, layerId, noHeights) {
            var id = this._prefix + "_" + Date.now() + "_" + Math.random();
            this._lastRequestId = id;
            if (geoJSON != null) {
                if (!(geoJSON instanceof GeoJSON)) {
                    geoJSON = new GeoJSON(JSON.stringify(geoJSON));
                }
                var tilematrixset = this._map.options.tilematrixset;
                var heightTile = null;
                if (!noHeights) {
                    var projection = ProjectionCollection[tilematrixset];
                    var point = geoJSON.getFullLineGeometry().coordinates[0];
                    var geoPoint = new Geodetic3D(Trigonometry.toRadians(point[0]), Trigonometry.toRadians(point[1]), point[2] || 0);
                    var xy = projection.geo2xy(geoPoint);
                    var level = this._map.options.tilematrix;
                    var heightSource = GWTK.heightSourceManager.getHeightSource(tilematrixset);
                    while (!heightTile && level >= 0) {
                        var identifier = projection.xy2tile(xy[0], xy[1], level);
                        heightTile = heightSource._heightCache.getHeightTileByIdentifier(identifier);
                        level--;
                    }
                    heightTile = heightTile.toJSON(true);
                }

                this.requestData = {
                    id: id,
                    layerId: layerId || null,
                    geoJSON: geoJSON.toString(),
                    hTile: heightTile,
                    obb: this._serviceNode.getOBB().toJSON(),
                    tilematrixset: tilematrixset
                };
            }
        },
        /**
         * Отправить запрос
         * @method _sendRequest
         * @private
         */
        _sendRequest: function () {
            if (this.requestData !== null) {
                this.requestData.command = MessageQueueCommand.createServiceObject;
                this._messageQueue.post(this._messageQueue.createMessageData( this._lastRequestId, this.requestData, 1), {onLoad:this._metricLoadHandler});
            }
        },
        /**
         * Обновить очередь загрузки
         * @method _updateMeshQueue
         * @private
         */
        _updateMeshQueue: function () {
            var curChunkedNode = this._serviceNode;
            var response = this._mVectorCache;
            if (response != null) {
                var obb = curChunkedNode.getOBB();
                var resultOBB = response.obb;
                if (resultOBB) {
                    obb.fromJSON(resultOBB);
                }
                if (response.objectMeshList) {
                    var objectMeshList = response.objectMeshList;
                    curChunkedNode.createModelNodeList();
                    for (var k = 0; k < objectMeshList.length; k++) {
                        var objectMesh = objectMeshList[k];
                        for (var j = 0; j < objectMesh.length; j++) {
                            var featureMeshCollection = objectMesh[j];
                            var features = featureMeshCollection && featureMeshCollection.features || [];
                            for (var i = 0; i < features.length; i++) {
                                var feature = features[i];
                                var modelId = feature.properties['code'];
                                var key = feature.properties['key'];
                                var modelNode = curChunkedNode.retrieveModelNode(modelId);
                                if (!modelNode) {
                                    modelNode = new GWTK.gEngine.Scene.ClassifierModel(modelId);
                                    curChunkedNode.addModelNode(modelNode);
                                }
                                var minDistance = Math.round(featureMeshCollection.minDistance);
                                var renderable = modelNode.getRenderable(key, minDistance);
                                if (renderable == null) {
                                    renderable = this._createRenderable(key, obb);
                                    modelNode.addRenderable(renderable, minDistance);
                                } else {
                                    renderable.setOBB(obb);
                                }
                                feature.singleObjectFlag = this._singleObject;
                                var meshIndex = this._meshInstancedIdArray.indexOf(feature.description.guid);
                                if (meshIndex === -1 && feature.meshInstanced) {
                                    if (feature.mesh) {
                                        var mesh = Mesh.fromJSON(feature.mesh);
                                    }
                                    meshIndex = this._meshInstancedIdArray.length;
                                    this._meshInstancedIdArray.push(feature.description.guid);
                                    this._meshInstancedArray.push(mesh);
                                }
                                if (!feature.mesh) {
                                    feature.mesh = this._meshInstancedArray[meshIndex];
                                }
                                renderable.addFromGeoJSON(feature);

                                this._onFeatureLoad(renderable);
                            }
                        }
                    }
                }
                this._mVectorCache = null;
            }
            this.requestData = null;
        },
        /**
         * Создать узел отрисовки
         * @method _createRenderable
         * @private
         * @param key {string} Ключ шаблона классификатора
         * @param obb {OrientedBoundingBox3D} Геометрия узла
         */
        _createRenderable: function (key, obb) {
            return new GWTK.gEngine.Scene.RenderableCollection(key, obb);
        },
        /**
         * Обработчик загрузки меша
         * @method _metricLoadHandler
         * @private
         * @param message {object} Сообщение из внешнего потока
         */
        _metricLoadHandler: function (data, message) {
            if (this._lastRequestId !== message.id) {
                return;
            }
            if (data.objectMeshList.length === 0) {
                return;
            }
            this._mVectorCache = data;
            this._updateMeshQueue();
        },
        /**
         * Рисование
         * @method _render
         * @private
         * @param e {object} Объект события отрисовки
         */
        _render: function (e) {
            //TODO: добавить ограничения на отрисовку
            if (this._active && this._serviceNode) {
                var sceneState = e.sceneState;
                // var distanceLimits = this._distanceLimits;
                var distanceNear = this._serviceNode.getDistanceFromNearPlane(sceneState);
                // if (distanceNear !== 0 && (distanceNear < 0 || distanceLimits.contains(distanceNear))) {
                this._serviceNode.render(e,distanceNear);
                // }
            }
        },
        /**
         * Очистить слой
         * @method clearServiceObject
         * @public
         */
        clearServiceObject: function () {
            this._serviceNode.clearModelNodeList();
            this._meshInstancedIdArray.length = 0;
            this._meshInstancedArray.length = 0;
        },
        /**
         * Удаление источника
         * @method destroy
         * @public
         */
        destroy: function () {
            this._map = null;
            this._messageQueue = null;
            this._mVectorCache = null;
            this._distanceLimits = null;
            this.requestData = null;
            var mediator = GWTK.gEngine.Mediator;
            mediator.unsubscribe('updateScene', this.sendRequest);
            mediator.unsubscribe('renderOverlay', this.render);

            if (this._serviceNode) {
                this._serviceNode.destroy();
                this._serviceNode = null;
            }
            this._lastRequestId = null;
            this._meshInstancedIdArray = null;
            this._meshInstancedArray = null;
        }
    };
}
