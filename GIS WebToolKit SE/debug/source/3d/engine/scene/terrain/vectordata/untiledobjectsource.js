/******************************************** Тазин В. 11/12/20  ****
 ************************************* Железнякова Ю. 12/05/2020  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
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
     * @class GWTK.gEngine.Scene.UntiledObjectLayer
     * @constructor GWTK.gEngine.Scene.UntiledObjectLayer
     * @param map {GWTK.Map} Объект карты
     * @param [singleObject] {boolean} Флаг наличие только одного объекта рисования
     */
    GWTK.gEngine.Scene.UntiledObjectLayer = function (map, singleObject) { // TODO: untiled
        this._map = map;
        this._singleObject = singleObject;
        this._messageQueue = WorkerManager.getWorker();
        this._prefix = "untiledObjectSource_" + Math.random();
        this._mVectorCache = null;

        this._distanceLimits = new Interval(Number.MIN_VALUE, Number.MAX_VALUE);
        this.requestData = null;
        this._meshInstancedIdArray = [];
        this._meshInstancedArray = [];
        this._metricLoadHandler = this._metricLoadHandler.bind(this);
        this._init();
    };
    GWTK.gEngine.Scene.UntiledObjectLayer.prototype = {
        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function () {
            this._serviceNode = new GWTK.gEngine.Scene.ServiceNode();
            this._serviceNode.setOBB(new BoundingSphere3D());
            this._serviceNode.createModelNodeList();

            var mediator = GWTK.gEngine.Mediator;
            mediator.subscribe('updateScene', this._sendRequest.bind(this));
            mediator.subscribe('renderTransparent', this._render.bind(this));
        },
        /**
         * Запросить меш объектов
         * @method requestMesh
         * @public
         * @param geoJSON {object} Описание объектов в формате geoJSON
         * @param layerId слой
         * @param tilematrix уровень тайла
         */
        requestMesh: function (geoJSON, layerId, tilematrix) {
            var id = this._prefix + "_" + Date.now() + "_" + Math.random();
            this._lastRequestId = id;
            if (geoJSON != null) {

                geoJSON = new GeoJSON(JSON.stringify(geoJSON));
                var tilematrixset = this._map.options.tilematrixset;
                var projection = ProjectionCollection[tilematrixset];
                if (geoJSON.json.features[0].geometry.type === "LineString") {
                    var coordList = geoJSON.getFullLineGeometry().coordinates;
                    var arrHeightLevel = [];
                    var arrHeightTile = [];
                    for (var coordNum = 0; coordNum < coordList.length; coordNum++) {
                        var point = geoJSON.getFullLineGeometry().coordinates[coordNum];
                        var geoPoint = new Geodetic3D(Trigonometry.toRadians(point[0]), Trigonometry.toRadians(point[1]), point[2] || 0);
                        var xy = projection.geo2xy(geoPoint);
                        var heightTile = null;
                        var level = this._map.options.tilematrix;
                        var heightSource = GWTK.heightSourceManager.getHeightSource(tilematrixset);
                        while (!heightTile && level >= 0) {
                            var identifier = projection.xy2tile(xy[0], xy[1], level);
                            heightTile = heightSource._heightCache.getHeightTileByIdentifier(identifier);
                            level--;
                        }
                        arrHeightLevel.push(level + 1);
                        arrHeightTile.push(heightTile);
                    }
                    heightTile = arrHeightTile[arrHeightLevel.indexOf(Math.max.apply(null, arrHeightLevel))];
                } else {
                    point = geoJSON.getFullLineGeometry().coordinates[0][0];
                    geoPoint = new Geodetic3D(Trigonometry.toRadians(point[0]), Trigonometry.toRadians(point[1]), point[2] || 0);
                    xy = projection.geo2xy(geoPoint);
                    heightTile = null;
                    level = this._map.options.tilematrix;
                    heightSource = GWTK.heightSourceManager.getHeightSource(tilematrixset);
                    while (!heightTile && level >= 0) {
                        identifier = projection.xy2tile(xy[0], xy[1], level);
                        heightTile = heightSource._heightCache.getHeightTileByIdentifier(identifier);
                        level--;
                    }
                }
                const command = MessageQueueCommand.createUntiledObject;
                this.requestData = {
                    id: id,
                    geoJSON: geoJSON.toString(),
                    tilematrixset: tilematrixset,
                    untiled: true,
                    hTile: heightTile.toJSON(true),
                    layerId: layerId || null,
                    // level: tilematrix || this._map.options.tilematrix,
                    command
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
                this._messageQueue.post(this._messageQueue.createMessageData(this._lastRequestId, this.requestData, 1),{onLoad:this._metricLoadHandler});
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
         * @param obb {BoundingSphere3D} Геометрия узла
         */
        _createRenderable: function (key, obb) {
            return new GWTK.gEngine.Scene.RenderableCollection(key, obb);
        },
        /**
         * Обработчик загрузки меша
         * @method _metricLoadHandler
         * @private
         * @param responseData {object} Сообщение из внешнего потока
         */
        _metricLoadHandler: function (responseData, message) {
            if (this._lastRequestId !== message.id) {
                return;
            }
            if (responseData.objectMeshList.length === 0) {
                return;
            }
            this._mVectorCache = responseData;
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
            if (this._serviceNode) {
                var sceneState = e.sceneState;
                // var distanceLimits = this._distanceLimits;
                var distanceNear = this._serviceNode.getDistanceFromNearPlane(sceneState);
                // if (distanceNear !== 0 && (distanceNear < 0 || distanceLimits.contains(distanceNear))) {
                this._serviceNode.render(e, distanceNear);
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
            if (this._serviceNode) {
                this._serviceNode.destroy();
                this._serviceNode = null;
            }
            this._lastRequestId = null;
            this._meshInstancedIdArray = null;
            this._meshInstancedArray = null;
        }
    }
}