/******************************************** Тазин В. 29/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Компонент управления высотными данными                *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    /**
     * Класс управления данными высот
     * @class GWTK.heightSourceManager
     */
    GWTK.heightSourceManager = (function () {
            var HeightSourceManager = function () {
                this._heightSourceList = {};
            };
            HeightSourceManager.prototype = {
                /**
                 * Добавить источник высот
                 * @method addHeightSource
                 * @public
                 * @param tilematrixset {string} Название пирамиды тайлов
                 * @param heightSource {GWTK.gEngine.Scene.HeightSource} Источник тайлов высот
                 */
                addHeightSource: function (tilematrixset, heightSource) {
                    this._heightSourceList[tilematrixset] = heightSource;
                },
                /**
                 * Получить источник высот
                 * @method getHeightSource
                 * @public
                 * @param [tilematrixset] {string} Название пирамиды тайлов
                 * @return {GWTK.gEngine.Scene.HeightSource} Источник тайлов высот
                 */
                getHeightSource: function (tilematrixset) {
                    var heightSource = null;
                    if (tilematrixset != null) {
                        heightSource = this._heightSourceList[tilematrixset];
                    } else {
                        for (var srcId in this._heightSourceList) {
                            if (this._heightSourceList.hasOwnProperty(srcId)) {
                                heightSource = this._heightSourceList[srcId];
                                break;
                            }
                        }
                    }
                    return heightSource;
                },
                /**
                 * Получить высоту в точке
                 * @method getHeightInPoint
                 * @public
                 * @param geoPoint {Geodetic3D} Геодезические координаты точки
                 * @return {number|null} Высота в точке
                 */
                getHeightInPoint: function (geoPoint) {
                    var height = null;
                    for (var source in this._heightSourceList) {
                        height = this._heightSourceList[source].getHeightInPoint(geoPoint);
                        if (height !== null) {
                            break;
                        }
                    }
                    return height;
                },
                /**
                 * Освободить память
                 * @method freeMemory
                 * @public
                 * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
                 */
                freeMemory: function (sceneState) {
                    for (var source in this._heightSourceList) {
                        this._heightSourceList[source].freeMemory(sceneState);
                    }
                },
                /**
                 * Очистить все данные
                 * @method clearAll
                 * @public
                 */
                clearAll: function () {
                    for (var source in this._heightSourceList) {
                        this._heightSourceList[source].clearAll();
                        delete this._heightSourceList[source];
                    }
                }
            };
            return new HeightSourceManager();
        }
    )()
}