/******************************************** Тазин В. 28/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Инструмент рисования объектов 3d карты              *
 *                                                                  *
 *******************************************************************/
"use strict";
import ColorMethods from '~/3d/engine/utils/colormethods';
import { VIEWTYPE } from '~/3d/engine/worker/workerscripts/object3dtemplate';
import { LOCALE } from '~/3d/engine/worker/workerscripts/parse3dobject';

if (window.GWTK) {
    /**
     * Компонент рисования выделения объектов в 3d
     * @class GWTK.Drawing3d
     * @constructor GWTK.Drawing3d
     */
    GWTK.Drawing3d = function (serviceObjectSource, params) {
        this.serviceObjectSource = serviceObjectSource;
        this._init(params);
    };

    GWTK.Drawing3d.prototype = {
        /**
         * Инициализация
         * @method _init
         * @private
         * @param params {Object} Праметры стиля отображения объектов
         */
        _init: function (params) {
            var options = {
                "vector-effect": "non-scaling-stroke",
                "stroke": "#e95757",
                "stroke-width": "2px",
                "stroke-opacity": "1.0",
                "fill": "#e95770",
                "fill-opacity": "0.3",
                "background": "",
                "background-size": "auto auto",
                "objName": "SEM99",
                "marker": 'M 1 6 a 5 5 0 0 0 11 0M 1 6 a 3 3 0 0 1 11 0',
                "font-family": "Verdana",
                "font-size": "12px",
                "letter-spacing": "1",
                "startOffset": "2%",
                "stroke-dasharray": "none",
                "text": ""
            };

            if (params) {
                options["fill"] = params["fill"] || options["fill"];
                options["fill-opacity"] = params["fill-opacity"] || options["fill-opacity"];
                options["stroke"] = params["stroke"] || options["stroke"];
                options["stroke-opacity"] = params["stroke-opacity"] || options["stroke-opacity"];
            }

            this.options = {
                "fill-color": options["fill"],
                "fill-opacity": options["fill-opacity"],
                "stroke-color": options["stroke"],
                "stroke-opacity": options["stroke-opacity"]
            };
        },
        /**
         * Рисование слоя
         * @method draw
         * @public
         * @param geoJSON {Object} Объекты в формате geoJSON
         */
        draw: function (geoJSON) {
            if (!geoJSON)
                return;

            for (var i = 0; i < geoJSON.features.length; i++) {

                var currentFeature = geoJSON.features[i];
                currentFeature.properties.color = ColorMethods.RGBA(this.options["fill-color"], this.options["fill-opacity"]);

                var type = currentFeature["geometry"]["type"];
                switch (type) {
                    case "LineString":
                    case "MultiLineString":
                        currentFeature.properties.height = {
                            "heightDef": 15,
                            "heightSem": 1,
                            "heightConstSem": 0
                        };
                        currentFeature.properties.code = -102;
                        currentFeature.properties.key = "Line";
                        currentFeature.properties.viewtype = VIEWTYPE.Template;
                        currentFeature.properties.local = LOCALE.Line;

                        break;
                    case "Polygon":
                    case "MultiPolygon":
                        currentFeature.properties.height = {
                            "heightDef": 100,
                            "heightSem": 1,
                            "heightConstSem": 0
                        };
                        currentFeature.properties.code = -101;
                        currentFeature.properties.key = "Polygon";
                        currentFeature.properties.viewtype = VIEWTYPE.Template;
                        currentFeature.properties.local = LOCALE.Plane;
                        break;
                    case "Point":
                    case "Unknown":
                    default:
                        currentFeature.properties.height = {
                            "heightDef": 5,
                            "heightSem": 1,
                            "heightConstSem": 0
                        };
                        currentFeature.properties.code = -103;
                        currentFeature.properties.key = "Point";
                        currentFeature.properties.viewtype = VIEWTYPE.Template;
                        currentFeature.properties.local = LOCALE.Point;

                }
                currentFeature.properties.colorValue = currentFeature.properties.color || null;

            }
            this.serviceObjectSource.requestMesh(geoJSON);
        },
        /**
         * Очищает панель рисования
         * @method clearDraw
         * @public
         */
        clearDraw: function () {
            if (this.serviceObjectSource) {
                this.serviceObjectSource.clearServiceObject();
            }
        },
        /**
         * Удаление объекта
         * @method deleteObject
         * @public
         * @param {String} id Идентификатор элемента
         */
        deleteObject: function (id) {
        },
        /**
         * Инициализация текущих параметров отображения карты
         * @method initView
         * @public
         */
        initView: function () {
        },
        /**
         * Рисование объекта
         * @method drawObject
         * @public
         */
        drawObjects: function () {
        }
    };
}
