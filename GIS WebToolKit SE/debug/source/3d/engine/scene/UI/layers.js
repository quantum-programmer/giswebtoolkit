/****************************************** Тазин В.О. 27/04/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Компонент интерфейса слоя                  *
 *                                                                  *
 *******************************************************************/


"use strict";

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Интерфейс работы со слоями 3D тайлов
     * @class GWTK.gEngine.Scene.Tiles3DcomponentUI
     * @constructor GWTK.gEngine.Scene.Tiles3DcomponentUI
     */
    GWTK.gEngine.Scene.Tiles3DcomponentUI = function (map3dData, options, params) {
        this.map = map3dData.map;
        this.id = options.id;
        this._init(options, params);
        this.options = options;
        this.params = params;
    };
    GWTK.gEngine.Scene.Tiles3DcomponentUI.prototype = {

        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function (options, params) {
            this._addLayerTo(options, params);
            this._initHandlers();
        },
        /**
         * Инициализация обработчиков
         * @method _initHandlers
         * @private
         */
        _initHandlers: function () {
            var mediator = GWTK.gEngine.Mediator;
            mediator.subscribe('hide3d', this._hideTreeElement.bind(this));
            mediator.subscribe('show3d', this._showTreeElement.bind(this));

            mediator.subscribe('maprefresh', function () {
                this._addLayerTo(this.options, this.params);
            }.bind(this));

            $(this.map.eventPane).on('mapcontentloaded', function () {
                this._addLayerTo(this.options, this.params);
            }.bind(this));
        },
        /**
         * Добавить слой в панель Состав карты (дерево слоев)
         * @method _addLayerTo
         * @private
         * @param options {object} Параметры слоя
         * @param params {object} Параметры родительской группы {id:"Идентификатор", text:"Название группы", "img":"icon-page"}
         */
        _addLayerTo: function (options, params) {
            var data = {};
            var parent = {id: params["id"], text: params["text"]};
            parent.text = w2utils.lang(parent.text);
            var mapContent = this.map.mapTool('mapcontent');
            if (!mapContent)
                return;
            var mapContentPanel = w2ui[mapContent.name];
            // добавить узел в дерево данных карты
            if (!mapContentPanel.get(parent.id)) {
                // создать группу
                data = {
                    "id": parent.id,
                    "text": parent.text,
                    "group": true,
                    "expanded": true,
                    "img": ""
                };
                mapContentPanel.add(data);
            } else {
                mapContentPanel.expand(parent.id);
            }
            mapContentPanel.scrollIntoView(parent.id);
            if (!mapContentPanel.get(this.id)) {
                // добавить node в группу
                data = {
                    "id": this.id,
                    "group": false,
                    "clickable": true,
                    "isPrimitive": true,
                    "gClickable": true,
                    "expanded": false,
                    "ndcommand": true,
                    "ndClass": "goto-layer",
                    "ndact": "gotoModel",
                    "ndTitle": w2utils.lang("Move to the model"),
                    "img": params["img"] || ""
                };

                data.text = options["alias"];
                data.eventPanelId = params["eventPanelId"] || this.map.eventPane.id;
                data.subtype = this.id;

                mapContentPanel.add(parent.id, data);

            }

            // добавить в дерево
            if (!options["hidden"]) {
                mapContentPanel.setCheckedMode(this.id, 'n', true);                      // включить кнопку узла слоя в дереве данных
            }
            var optControl = this.map.mapTool('optionscontrols');

            if (optControl) {
                if (!$("#" + options['id']).length) {
                    var layer = {
                        options: {opacityValue: 100},
                        alias: options["alias"],
                        xId: options['id'],
                        visible: !options["hidden"]
                    };
                    optControl.addNodeInViewOrder(layer);
                    optControl.initEvents();
                }
            }
        },
        /**
         * Скрыть слой в панели Состав карты (в дереве слоев)
         * @method _hideTreeElement
         * @private
         */
        _hideTreeElement: function () {
            var mapContent = this.map.mapTool('mapcontent');
            if (mapContent) {
                mapContent.ItemHide(this.id);
                var optControl = this.map.mapTool('optionscontrols');
                if (optControl) {
                    optControl.hideLayerInVo(this.id);
                }
            }
        },
        /**
         * Отобразить слой в панели Состав карты (в дереве слоев)
         * @method _showTreeElement
         * @private
         */
        _showTreeElement: function () {
            var mapContent = this.map.mapTool('mapcontent');
            if (mapContent) {
                mapContent.ItemShow(this.id);
                var optControl = this.map.mapTool('optionscontrols');
                if (optControl) {
                    optControl.showLayerInVo(this.id);
                }
            }
        },
        /**
         * Удалить слой
         * @method deleteMap
         * @private
         * @param event {object} Событие
         */
        // ===============================================================
        deleteMap: function (event) {
            var mapContent = this.map.mapTool('mapcontent');
            if (mapContent) {
                var id = event.maplayer.id;
                if (id && event.maplayer.act == 'remove') {
                    event.stopPropagation();
                    // удалить из дерева
                    GWTK.Util.removeTreeNode(mapContent.name, id);
                }
            }
        },
        /**
         * Удаление из панели Состава карты (из дерева слоев)
         * @method destroy
         * @public
         */
        destroy: function () {
            var mapContent = this.map.mapTool('mapcontent');
            if (mapContent) {
                var mapContentPanel = w2ui[mapContent.name];
                if (mapContentPanel) {
                    mapContentPanel.remove(this.id);
                }
            }
        },
        /**
         * Сервисный метод
         * @method mapTool
         * @public
         */
        mapTool: function () {
        }
    };

}