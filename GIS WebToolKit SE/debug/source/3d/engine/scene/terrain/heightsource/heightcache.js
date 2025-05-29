/****************************************** Тазин В.О. 30/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Кешированные тайлы высот                      *
 *                                                                  *
 *******************************************************************/
"use strict";
import TileIdentifier from '~/3d/engine/scene/terrain/tileidentifier';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс кеша высотных тайловы
     * @class GWTK.gEngine.Scene.HeightCache
     * @constructor GWTK.gEngine.Scene.HeightCache
     */
    GWTK.gEngine.Scene.HeightCache = function() {
        this._heightTiles = {};
        this._heightTileList = {};
        this._count = 0;
        this._optimalCached = 1000;
        this._triggerValue = 1325;
    };
    GWTK.gEngine.Scene.HeightCache.prototype = {
        /**
         * Получить высоту в точке
         * @method getModelId
         * @public
         * @param geo {Geodetic3D} Геодезические координаты точки
         * @return {number|null} Высота в точке
         */
        getHeight: function(geo) {
            var result = null;
            for (var i = 22; i >= 0; i--) {
                
                var levelList = this._heightTiles[i];
                if (levelList) {
                    
                    for (var row in levelList) {
                        var rowList = levelList[row];
                        for (var col in rowList) {
                            var heighTile = rowList[col];
                            var height = heighTile.getHeightInPoint(geo);
                            if (height != null) {
                                result = height;
                                return result;
                            }
                        }
                    }
                }
            }
            return result;
        },
        
        /**
         * Получить интерполированную высоту в точке
         * @method getHeightAccurate
         * @public
         * @param geo {Geodetic3D} Геодезические координаты точки
         * @return {number|null} Высота в точке
         */
        getHeightAccurate: function(geo) {
            var result = null;
            for (var i = 22; i >= 0; i--) {
                
                var levelList = this._heightTiles[i];
                if (levelList) {
                    
                    for (var row in levelList) {
                        var rowList = levelList[row];
                        for (var col in rowList) {
                            var heighTile = rowList[col];
                            var height = heighTile.getHeightInPointAccurate(geo);
                            if (height !== undefined) {
                                result = height;
                                return result;
                            }
                        }
                    }
                }
            }
            return result;
        },
        
        /**
         * Получить тайл, вмещающий точки
         * @method getTileFromPoints
         * @public
         * @param geoPointList {array} Геодезические координаты точек
         * @return {HeightTile} Тайл высот
         */
        getTileFromPoints: function(geoPointList) {
            
            for (var i = 22; i > 0; i--) {
                var levelList = this._heightTiles[i];
                if (levelList) {
                    for (var row in levelList) {
                        var rowList = levelList[row];
                        for (var col in rowList) {
                            var heighTile = rowList[col];
                            var obb = heighTile.getOBB();
                            var flag = true;
                            for (var j = 0; j < geoPointList.length; j++) {
                                if (!obb.testPoint(geoPointList[j])) {
                                    flag = false;
                                    break;
                                }
                            }
                            if (flag) {
                                return heighTile;
                            }
                        }
                    }
                }
            }
            return this._heightTiles[0][0][0];
        },
        /**
         * Добавить тайл высот с идентификатором
         * @method addHeightTileWithIdentifier
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @param heightTile {HeightTile} Тайл высот
         */
        addHeightTileWithIdentifier: function(identifier, heightTile) {
            this._addToHeightTiles(identifier, heightTile);
            var name = identifier.toString();
            this._addToHeightTileList(name, heightTile);
        },
        /**
         * Получить тайл высот по идентификатору
         * @method getHeightTileByIdentifier
         * @public
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @return {HeightTile} Тайл высот
         */
        getHeightTileByIdentifier: function(identifier) {
            var heighTile = null;
            var level = identifier.getLevel();
            var col = identifier.getX();
            var row = identifier.getY();
            var levelList = this._heightTiles[level];
            if (levelList) {
                var rowList = levelList[row];
                if (rowList) {
                    heighTile = rowList[col];
                }
            }
            return heighTile;
        },
        /**
         * Добавить тайл высот с названием
         * @method addHeightTileWithName
         * @public
         * @param name {string} Название тайла
         * @param heightTile {HeightTile} Тайл высот
         */
        addHeightTileWithName: function(name, heightTile) {
            this._addToHeightTileList(name, heightTile);
            var identifier = TileIdentifier.fromString(name);
            
            this._addToHeightTiles(identifier, heightTile);
        },
        /**
         * Получить тайл высот по названию
         * @method getHeightTileByName
         * @public
         * @param name {string} Название тайла
         * @return {HeightTile} Тайл высот
         */
        getHeightTileByName: function(name) {
            return this._heightTileList[name];
        },
        /**
         * Добавить тайл высот в структуру
         * @method _addToHeightTiles
         * @private
         * @param identifier {TileIdentifier} Идентификатор тайла
         * @param heightTile {HeightTile} Тайл высот
         */
        _addToHeightTiles: function(identifier, heightTile) {
            var level = identifier.getLevel();
            var col = identifier.getX();
            var row = identifier.getY();
            
            if (this._heightTiles[level] === undefined) {
                var levelList = this._heightTiles[level] = {};
            }else{
                levelList = this._heightTiles[level];
            }
            
            if (levelList[row] === undefined) {
                var rowList = levelList[row] = {};
            }else{
                rowList = levelList[row];
            }
            if (rowList[col] === undefined) {
                rowList[col] = heightTile;
            }
        },
        /**
         * Удаить тайл высот по идентификатору
         * @method _removeHeightTileByIdentifier
         * @private
         * @param identifier {TileIdentifier} Идентификатор тайла
         */
        _removeHeightTileByIdentifier: function(identifier) {
            var level = identifier.getLevel();
            var col = identifier.getX();
            var row = identifier.getY();
            var levelList = this._heightTiles[level];
            if (levelList) {
                var rowList = levelList[row];
                if (rowList) {
                    delete rowList[col];
                }
            }
        },
        /**
         * Добавить тайл высот в список
         * @method _addToHeightTileList
         * @private
         * @param name {string} Название тайла
         * @param heightTile {HeightTile} Тайл высот
         */
        _addToHeightTileList: function(name, heightTile) {
            if (this._heightTileList[name] === undefined) {
                this._heightTileList[name] = heightTile;
                this._count++;
            }
        },
        /**
         * Удалить тайл высот по названию
         * @method _removeHeightTileByName
         * @private
         * @param name {string} Название тайла
         */
        _removeHeightTileByName: function(name) {
            delete this._heightTileList[name];
        },
        /**
         * Очистить кеш по объему отсечения
         * @method clearHeightTilesByFrustum
         * @public
         * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
         */
        clearHeightTilesByFrustum: function(sceneState) {
            if (this._count > this._triggerValue) {
                var frustumVolume = sceneState.getCamera().getFrustumVolume();
                var modelViewMatrix = sceneState.getViewPerspectiveMatrix();
                for (var name in this._heightTileList) {
                    var heightTile = this._heightTileList[name];
                    var obb = heightTile.getOBB();
                    if (obb.testFrustum(frustumVolume, modelViewMatrix) === 0) {
                        var identifier = TileIdentifier.fromString(name);
                        this._removeHeightTileByIdentifier(identifier);
                        this._removeHeightTileByName(name);
                        this._count--;
                        if (this._count === this._optimalCached) {
                            break;
                        }
                    }
                }
            }
        },
        /**
         * Очистить кеш
         * @method clearAll
         * @public
         */
        clearAll: function() {
            for (var name in this._heightTileList) {
                var identifier = TileIdentifier.fromString(name);
                this._removeHeightTileByIdentifier(identifier);
                this._removeHeightTileByName(name);
                this._count--;
            }
        }
    };
}
