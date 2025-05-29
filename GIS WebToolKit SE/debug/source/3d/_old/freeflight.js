/****************************************** Тазин В.О. 17/09/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Интерфейс компонента просмотра с воздуха               *
 *                                                                  *
 *******************************************************************/
"use strict";
import GeoJSON from '~/utils/GeoJSON';
import Geodetic3D from '~/3d/engine/core/geodetic3d';

if (window.GWTK) {

    GWTK.enumFreeFlightMode = Object.freeze({
        ACTIVE: 0,
        PAUSED: 1,
        TURNED_ON: 2,
        TURNED_OFF: 3
    });
    /**
     * Интерфейс компонента просмотра с воздуха
     * @class GWTK.FreeFlightUI
     * @constructor GWTK.FreeFlightUI
     */
    GWTK.FreeFlightUI = function (freeFlightController, freeFlight3dPane) {
        this.freeFlight3dPane = freeFlight3dPane;
        this.freeFlightController = freeFlightController;
        this.title = "Free flight";
        this.id = "panel_button_freeFlight3d";
    };
    GWTK.FreeFlightUI.prototype = {
        /**
         * Инициализация
         * @method init
         * @public
         */
        init: function () {
            var button = {
                id: this.id,
                className: "icon-freeFlight3d icon-toolbar3d-menu-item",
                text: this.title,
                toggleHandler: this.freeFlightController.changeOnOff
            };
            GWTK.gEngine.Mediator.publish("addToToolbar3d", {"button": button});

            this.gridDoneHandler = this._gridDoneHandler.bind(this);
            this._initPanes();
        },
        /**
         * Инициализация панелей, кнопок и их обработчиков
         * @method _initPanes
         * @private
         */
        _initPanes: function () {

            this.createPanel({
                'id': 'free_flight_toolbar',
                'class': 'user-control-3d map-panel-def toolbar-panel-freeFlight3d',
                'header': true,
                'hidable': true,
                'parent': this.freeFlight3dPane[0]
            });

            this.$panel.draggable({containment: 'body'});
            this.panelHeaderElement = this.$panel[0].getElementsByTagName('span')[0];

            this._createToolbar();

            this._createGrid();

        },
        /**
         * Создание панели инструментов
         * @method _createToolbar
         * @private
         */
        _createToolbar: function () {
            //контейнер панели инструментов
            this.toolbarElement = document.createElement("div");

            //контейнер панели управления скоростью
            var speedContainer = document.createElement("div");
            speedContainer.classList.add("toolbar-panel-freeFlight3d-container");
            this.toolbarElement.appendChild(speedContainer);

            //контейнер для кнопок
            var supportDiv = document.createElement("div");
            supportDiv.classList.add('toolbar-panel-freeFlight3d-container-speed');
            speedContainer.appendChild(supportDiv);

            // Кнопка увеличения скорости движения
            this.increaseSpeedElement = GWTK.DomUtil.create('div', 'icon-freeFlight3d-speed toolbar-panel-freeFlight3d-border clickable toolbar-panel-freeFlight3d-button', supportDiv);
            this.increaseSpeedElement.setAttribute("title", w2utils.lang("Increase speed"));
            this.increaseSpeedElement.innerHTML = "+";
            this.increaseSpeedElement.addEventListener("click", this.freeFlightController.incSpeedValue);

            // Поле скорости движения
            this.textElement = document.createElement("div");
            this.textElement.setAttribute("title", w2utils.lang("Speed"));
            this.textElement.style.color = "#868b92";
            this.textElement.classList.add('toolbar-panel-freeFlight3d-border');
            supportDiv.appendChild(this.textElement);

            // Кнопка уменьшения скорости движения
            this.decreaseSpeedElement = GWTK.DomUtil.create('div', 'icon-freeFlight3d-speed toolbar-panel-freeFlight3d-border clickable toolbar-panel-freeFlight3d-button', supportDiv);
            this.decreaseSpeedElement.setAttribute("title", w2utils.lang("Decrease speed"));
            this.decreaseSpeedElement.innerHTML = "-";
            this.decreaseSpeedElement.addEventListener("click", this.freeFlightController.decSpeedValue);

            // контейнер кнопки режима
            var playContainer = document.createElement("div");
            playContainer.classList.add("toolbar-panel-freeFlight3d-container", "clickable", "toolbar-panel-freeFlight3d-border", "toolbar-panel-freeFlight3d-button");
            playContainer.addEventListener('click', this.freeFlightController.toggleMode);
            this.toolbarElement.appendChild(playContainer);

            // Кнопка запуска и остановки движения
            this.playButton = GWTK.DomUtil.create('div', 'play-icon toolbar-panel-freeFlight3d-container-play', playContainer);

        },
        /**
         * Отображение панели инструментов
         * @method _showToolbar
         * @private
         */
        _showToolbar: function () {
            $(this.gridElement).remove();
            this.$panel.css("width", "");
            this.$panel.css("height", "");
            this.panelHeaderElement.textContent = w2utils.lang(this.title);
            this.$panel.append(this.toolbarElement);
        },
        /**
         * Создание панели выбора маршрута
         * @method _createGrid
         * @private
         */
        _createGrid: function () {
            // контейнер панели выбора маршрута
            this.gridElement = document.createElement("div");
            this.gridElement.classList.add("toolbar-panel-freeFlight3d-grid");
            this.$panel.append(this.gridElement);

            var that = this;
            // компонент выбора файлы
            var fileInput = document.createElement("input");
            fileInput.setAttribute("type", "file");
            fileInput.addEventListener("change", function (event) {
                var ifile = event.currentTarget;
                var files = ifile["files"];
                if (files && files.length > 0) {
                    that.freeFlightController.uploadLocalRoute(files[0]);
                    this.value = '';
                }
            });

            //таблица w2ui
            var $gridElement = $(this.gridElement);
            var name = 'freeFlight3d';
            $gridElement.w2grid({
                name: name,
                show: {
                    footer: true,
                    header: false,
                    toolbar: true,
                    toolbarColumns: false,
                    toolbarSearch: true,
                    toolbarReload: false,
                    toolbarAdd: false,
                    toolbarDelete: false,
                    toolbarSave: false,
                    toolbarEdit: false,
                    lineNumbers: false,
                    selectColumn: true,
                    expandColumn: false
                },

                toolbar: {
                    items: [
                        {
                            id: 'apply',
                            type: 'button',
                            caption: w2utils.lang("Done"),
                            icon: 'gwtk-icon-check',
                            hint: w2utils.lang("Select flying route"),
                            onClick: this.gridDoneHandler,
                            disabled: true
                        },
                        {
                            id: 'add',
                            type: 'button',
                            caption: w2utils.lang("Add New"),
                            icon: 'gwtk-icon-file',
                            hint: w2utils.lang("Add flying route"),
                            onClick: function (e) {
                                fileInput.click();
                                e.stopPropagation();
                            }
                        }
                    ]
                },

                multiSelect: false,
                columns: [
                    {
                        field: 'recid',
                        caption: "#",
                        size: "20px",
                        suffix: ''
                    },
                    {
                        field: 'name',
                        caption: w2utils.lang("Name"),
                        size: "33%",
                        suffix: '',
                        editable: {type: 'text'}
                    },
                    {
                        field: 'description',
                        caption: w2utils.lang("Description"),
                        size: "50%",
                        suffix: '',
                        editable: {type: 'text'}
                    },
                    {
                        field: 'looped',
                        caption: w2utils.lang("Looped"),
                        size: "17%",
                        suffix: '',
                        editable: {type: 'check'}
                    }
                ],
                records: [],

                onChange: function (event) {
                    event.onComplete = onChange;
                },

                onSelect: function (event) {
                    event.onComplete = updateStatus;
                },

                onUnselect: function (event) {
                    event.onComplete = updateStatus;
                },

                onClick: function (event) {
                    if (event.column === null) {
                        event.preventDefault();
                        event.stopPropagation();
                        return false;
                    }
                }
            });
            this._grid = w2ui[name];

            // обработчики таблицы w2ui
            var updateStatus = function () {
                if (this.getSelection().length > 0) {
                    this.toolbar.enable('apply');
                } else {
                    this.toolbar.disable('apply');
                }
            }.bind(this._grid);
            var onChange = function () {
                var changes = this._grid.getChanges();
                this.freeFlightController.updateRouteParams(changes);
                this._grid.save();
            }.bind(this);

            //удаляем из DOM после создания
            $gridElement.remove();
        },
        /**
         * Обработчик выбора маршрута
         * @method _gridDoneHandler
         * @private
         */
        _gridDoneHandler: function () {
            var sel = this._grid.getSelection();
            for (var i = 0; i < sel.length; i++) {
                this.freeFlightController.setUpRoute(this._grid.get(sel[i]).recid);
            }
        },
        /**
         * Отображение панели выбора маршрута
         * @method _showGrid
         * @private
         */
        _showGrid: function () {
            $(this.toolbarElement).remove();
            this.$panel.css("width", "");
            this.$panel.css("height", "");
            this.panelHeaderElement.textContent = w2utils.lang("Flying route selection");
            this.$panel.append(this.gridElement);
            this._grid.refresh();

        },
        /**
         * Добавить запись в таблицу маршрутов
         * @method addRouteRecord
         * @public
         * @param routeParams {object} Параметры маршрута
         */
        addRouteRecord: function (routeParams) {
            var recid = this._grid.records.length + 1;
            var name = routeParams.alias;
            if (name == null) {
                name = w2utils.lang("Undefined path");
            }
            var description = routeParams.description;
            if (description == null) {
                description = w2utils.lang("User route");
            }

            var looped = routeParams.enableloop;
            if (looped == null) {
                looped = false;
            }
            this._grid.add({recid: recid, name: name, description: description, looped: looped});
            this._grid.refresh();
            return recid;
        },
        /**
         * Обновить значение скорости
         * @method updateSpeedValue
         * @public
         * @param num {string} Значение коэффициента ускорения
         */
        updateSpeedValue: function (num) {
            var rgx = /(\d+)\.?(\d\d?)?/;
            var m;
            if ((m = rgx.exec(num)) !== null) {
                num = m[1] + ".";
                if (m[2] == null) {
                    m[2] = "";
                }
                while (m[2].length < 2) {
                    m[2] += "0";
                }
                num += m[2];
            }
            this.textElement.textContent = num;
        },
        /**
         * Обновить режим работы
         * @method updateFlyMode
         * @public
         * @param mode {GWTK.enumFreeFlightMode} Состояние режима полета
         */
        updateFlyMode: function (mode) {
            switch (mode) {
                case GWTK.enumFreeFlightMode.TURNED_ON:
                    this._setOnState();
                    break;
                case GWTK.enumFreeFlightMode.TURNED_OFF:
                    this._setOffState();
                    break;
                case GWTK.enumFreeFlightMode.ACTIVE:
                    this._setPlayState();
                    break;
                case GWTK.enumFreeFlightMode.PAUSED:
                    this._setPauseState();
                    break;

            }
        },
        /**
         * Установить режим "Включен"
         * @method _setOnState
         * @private
         */
        _setOnState: function () {
            this._showGrid();
            this.$panel.show();
        },
        /**
         * Установить режим "Выключен"
         * @method _setOffState
         * @private
         */
        _setOffState: function () {
            this._setPauseState();
            this._grid.selectNone();
            this.$panel.hide();
        },
        /**
         * Установить режим "Полет"
         * @method _setPlayState
         * @private
         */
        _setPlayState: function () {
            this._showToolbar();
            this.playButton.setAttribute("title", w2utils.lang("Pause"));
            this.playButton.classList.remove("play-icon");
            this.playButton.classList.add("pause-icon");
        },
        /**
         * Установить режим "Пауза"
         * @method _setPauseState
         * @private
         */
        _setPauseState: function () {
            this.playButton.setAttribute("title", w2utils.lang("Resume"));
            this.playButton.classList.remove("pause-icon");
            this.playButton.classList.add("play-icon");
        },
        /**
         * Обработсик закрытия панели
         * @method onClosePanel
         * @public
         */
        onClosePanel: function () {
            GWTK.gEngine.Mediator.publish("deactivateToolbar3dComponent", {id: this.id});
        },
        /**
         * Завершить работу компонента
         * @method destroy
         * @public
         */
        destroy: function () {
            // Кнопка включения и выключения режима
            var bt = $('#free_flight_button');
            bt.off();
            bt.remove();

            // Кнопка увеличения скорости движения
            bt = $(this.increaseSpeedElement);
            bt.off();
            bt.remove();


            // Кнопка запуска и остановки движения
            bt = $(this.playButton);
            bt.off();
            bt.remove();


            // Кнопка уменьшения скорости движения
            bt = $(this.decreaseSpeedElement);
            bt.off();
            bt.remove();

            this._grid.destroy();


            GWTK[this.toolname] = undefined;
        }
    };


    /**
     * Контроллер компонента просмотра с воздуха
     * @class GWTK.FreeFlightUI
     * @constructor GWTK.FreeFlightUI
     * @param map3dData {GWTK.Map3dData} Объект 3D параметров карты
     */
    GWTK.FreeFlightUIcontroller = function (map3dData) {
        this.freeFlightUI = null;
        this.defCoords = [];
        this._routeCollection = [];
        this.freeMove = new GWTK.FreeMove(map3dData);
        this.speedMult = null;

        this._activeRoute = null;
        this._mode = GWTK.enumFreeFlightMode.TURNED_OFF;

        this.updateFreeMove = this._updateFreeMove.bind(this);
        this.forceMoveHandler = this._forceMoveHandler.bind(this);
        this.changeOnOff = this._changeOnOff.bind(this);
        this.incSpeedValue = this._incSpeedValue.bind(this);
        this.decSpeedValue = this._decSpeedValue.bind(this);
        this.toggleMode = this._toggleMode.bind(this);

        GWTK.gEngine.Mediator.subscribe("forceMove", this.forceMoveHandler);
        this._initUI(map3dData);
    };
    GWTK.FreeFlightUIcontroller.prototype = {
        /**
         * Вспомогательный массив
         * @static
         * @property {array} mCoordinates
         */
        mCoordinates: [],
        /**
         * Инициализация интерфейса пользователя
         * @method _initUI
         * @private
         * @param map3dData {GWTK.Map3dData} Объект 3D параметров карты
         */
        _initUI: function (map3dData) {
            // Панель для кнопки
            var freeFlight3dPane = document.getElementById('tools3d_div');
            this.freeFlightUI = GWTK.mapCreateUserControl('freeFlight3d', map3dData.map, new GWTK.FreeFlightUI(this, $(freeFlight3dPane)), true);
            var defaultRoutes = map3dData.getDefaultFlightRoutes();
            if (defaultRoutes) {
                for (var i = 0; i < defaultRoutes.length; i++) {
                    this._uploadRemoteRoute(defaultRoutes[i]);
                }
            }
        },
        /**
         * Смена состояния (включен/выключен)
         * @method _changeOnOff
         * @public
         */
        _changeOnOff: function () {
            if (this._mode !== null) {
                if (this._mode !== GWTK.enumFreeFlightMode.TURNED_OFF) {
                    this._setMode(GWTK.enumFreeFlightMode.TURNED_OFF);
                } else {
                    this._setMode(GWTK.enumFreeFlightMode.TURNED_ON);
                }
            }
        },
        /**
         * Смена состояния (движения/паузы)
         * @method _toggleMode
         * @public
         */
        _toggleMode: function () {
            if (this._mode === GWTK.enumFreeFlightMode.ACTIVE) {
                this._setMode(GWTK.enumFreeFlightMode.PAUSED);
            } else if (this._mode === GWTK.enumFreeFlightMode.PAUSED) {
                this._setMode(GWTK.enumFreeFlightMode.ACTIVE);
            }
        },
        /**
         * Установить режим работы
         * @method _setMode
         * @private
         * @param mode {GWTK.enumFreeFlightMode} Режим
         */
        _setMode: function (mode) {
            if (mode != null && this._mode !== mode) {
                this._mode = mode;
                switch (mode) {
                    case GWTK.enumFreeFlightMode.TURNED_ON:
                        this._turnOn();
                        break;
                    case GWTK.enumFreeFlightMode.TURNED_OFF:
                        this._turnOff();
                        break;
                    case GWTK.enumFreeFlightMode.ACTIVE:
                        this._resumeFlight();
                        break;
                    case GWTK.enumFreeFlightMode.PAUSED:
                        this._pauseFlight();
                        break;
                }
                this.freeFlightUI.updateFlyMode(mode);
            }
        },
        /**
         * Обработчик смещения карты
         * @method _forceMoveHandler
         * @private
         */
        _forceMoveHandler: function () {
            if (this._mode === GWTK.enumFreeFlightMode.ACTIVE) {
                this._setMode(GWTK.enumFreeFlightMode.PAUSED);
            }
        },
        /**
         * Включить режим
         * @method _turnOn
         * @private
         */
        _turnOn: function () {
            this._setSpeedValue(1.);
        },
        /**
         * Выключить режим
         * @method _turnOff
         * @private
         */
        _turnOff: function () {
            var mediator = GWTK.gEngine.Mediator;
            mediator.unsubscribe('zoomEvent', this.updateFreeMove);
            this.freeMove.reset();
            this._activeRoute = null;
            this._resetSpeedValue();
        },
        /**
         * Продолжить полет по маршруту
         * @method _resumeFlight
         * @private
         */
        _resumeFlight: function () {
            this.freeMove.activate(true);
        },
        /**
         * Прервать полет по маршруту
         * @method _pauseFlight
         * @private
         */
        _pauseFlight: function () {
            this.freeMove.deactivate();
        },
        /**
         * Завершить работу компонента
         * @method destroy
         * @public
         */
        destroy: function () {
            this._setMode(GWTK.enumFreeFlightMode.TURNED_OFF);
            this.freeFlightUI.destroy();
            this.freeFlightUI = null;
            this.defCoords = null;
            this._routeCollection = null;
            this.freeMove = null;
            this._mode = null;
            GWTK.gEngine.Mediator.unsubscribe("forceMove", this.forceMoveHandler);
        },
        /**
         * Установить маршрут
         * @method setUpRoute
         * @private
         */
        setUpRoute: function (recid) {

            if (this._activeRoute !== recid) {

                this.defCoords.length = 0;
                var geoJson = this._routeCollection[recid];
                if (geoJson != null) {
                    var firstFeature = geoJson.getFeature();
                    this.defProperties = firstFeature.properties;
                    this.defCoords = firstFeature.getGeometry().clone().coordinates;
                    if (this.defProperties.relative) {
                        GWTK.gEngine.Mediator.subscribe('zoomEvent', this.updateFreeMove);
                    }

                    this._activeRoute = recid;

                    this._updateFreeMove();

                    if (this.mCoordinates.length > 0) {
                        var mapParams = {
                            height: this.defProperties.height,
                            center: this.mCoordinates[0],
                            force: true
                        };

                        this._startFlight(mapParams);
                    }
                }
            }
        },
        /**
         * Запустить полет по маршруту
         * @method _startFlight
         * @private
         * @param mapParams{object} Параметры для карты
         */
        _startFlight: function (mapParams) {
            this.freeMove.setMapParams(mapParams);
            this._setMode(GWTK.enumFreeFlightMode.ACTIVE);
        },


        /**
         * Обновить маршрут
         * @method _updateFreeMove
         * @public
         */
        _updateFreeMove: function () {
            if (this._mode !== null) {
                var coordinates = this.defCoords;
                var mapState = this.freeMove.getMapState();
                this.mCoordinates.length = 0;
                if (this.defProperties.relative) {
                    this._recalcCoords(coordinates, mapState);
                } else {
                    for (var i = 0; i < coordinates.length; i++) {
                        var point = coordinates[i];
                        this.mCoordinates[i] = new Geodetic3D(point[0] * Math.PI / 180, point[1] * Math.PI / 180, point[2]);
                    }
                }
                if (this.mCoordinates.length > 0) {
                    var properties = Object.create(this.defProperties);
                    if (mapState.starViewFlag) {
                        properties.height = null;
                    }
                    this.freeMove.setProperties(properties);
                    this.freeMove.setPath(this.mCoordinates);
                }

            }
        },
        /**
         * Пересчет относительных координат на текущий масштаб
         * @method _recalcCoords
         * @private
         * @param coordinates {array} Массив координат
         * @param mapState {object} Параметры состояния карты
         */
        _recalcCoords: function (coordinates, mapState) {
            if (!Array.isArray(coordinates) ||
                !(mapState != null && mapState.hasOwnProperty('scale') && mapState.hasOwnProperty('center')
                    && mapState.hasOwnProperty('starViewFlag'))) {
                return;
            }
            var scale = mapState.scale;
            var center = mapState.center;
            var starViewFlag = mapState.starViewFlag;
            this.mCoordinates.length = 0;
            if (!starViewFlag) {
                for (var i = 0; i < coordinates.length; i++) {
                    var x = coordinates[i][0] * scale + center[1];
                    var y = coordinates[i][1] * scale + center[0];
                    var height = center[2] || 0;
                    this.mCoordinates[i] = mapState.projection.xy2geo(y, x, height);
                }
            } else {
                GWTK.gEngine.Mediator.publish('writeProtocol', {
                    text: w2utils.lang("Scale should be under") + " 8 000 000",
                    displayFlag: false
                });
                var deltaRad = 8 * Math.PI / 180;
                height = mapState.distanceFromObs;
                var geoEx = mapState.projection.xy2geo(center[0], center[1], height);
                var lat0 = geoEx.getLatitude();
                var lng0 = geoEx.getLongitude();
                for (i = 0; i < 45; i++) {
                    this.mCoordinates[i] = new Geodetic3D(deltaRad * i + lng0, lat0, height);
                }
            }
        },
        /**
         * Обновить параметры маршрутов
         * @method updateRouteParams
         * @public
         */
        updateRouteParams: function (records) {
            if (Array.isArray(records)) {
                for (var i = 0; i < records.length; i++) {
                    var record = records[i];
                    var geoJson = this._routeCollection[record.recid];
                    if (geoJson) {
                        var firstFeature = geoJson.getFeature();
                        firstFeature.setProperties(record);
                    }
                }
            }
        },
        /**
         * Установить значение скорости
         * @method _setSpeedValue
         * @private
         * @param value{number} Новое значение скокрости
         */
        _setSpeedValue: function (value) {
            if (value !== this.speedMult) {
                this.speedMult = value;
                this.freeFlightUI.updateSpeedValue(this.speedMult + "");
                this.freeMove.setAnimationSpeedValue(this.speedMult);
            }
        },
        /**
         * Сбросить значение скорости
         * @method _resetSpeedValue
         * @private
         */
        _resetSpeedValue: function () {
            this._setSpeedValue(1.);
            this.speedMult = null;
        },
        /**
         * Увеличить значение скорости
         * @method _incSpeedValue
         * @public
         */
        _incSpeedValue: function () {
            if (this.speedMult != null) {
                var newValue = this.speedMult + 0.25;
                if (newValue > 10.0) {
                    newValue = 10.0;
                }
                this._setSpeedValue(newValue);
            }
        },
        /**
         * Уменьшить значение скорости
         * @method _decSpeedValue
         * @public
         */
        _decSpeedValue: function () {
            if (this.speedMult != null) {
                var newValue = this.speedMult - 0.25;
                if (newValue < 0.25) {
                    newValue = 0.25;
                }
                this._setSpeedValue(newValue);
            }
        },
        /**
         * Обработчик загрузки маршрута
         * @method _onLoad
         * @private
         */
        _onLoad: function (filepath, routeParams) {
            if (this._mode === null) {
                return;
            }
            var freeflight = GWTK.gEngine.ResourceMap.retrieveAsset(filepath);

            if (freeflight == null || !freeflight.features || freeflight.features.length < 1) {
                GWTK.gEngine.Mediator.publish('writeProtocol', {
                    text: w2utils.lang("The file is not in the format GeoJSON") + ": " + filepath,
                    displayFlag: true
                });
            } else {
                var geoJSON = this._createGeoJSONroute(freeflight);
                var recid = this.freeFlightUI.addRouteRecord(routeParams);
                this._routeCollection[recid] = geoJSON;
            }
            GWTK.gEngine.ResourceMap.unloadAsset(filepath);
        },
        /**
         * Сформировать GeoJSON-объект маршрута
         * @method _createGeoJSON
         * @private
         * @param json{object} JSON-объект
         * @return {GWTK.gEngine.GeoJSON} GeoJSON-объект маршрута
         */
        _createGeoJSONroute: function (json) {
            var geoJson = new GeoJSON(JSON.stringify(json));
            var geometry = geoJson.getFullLineGeometry();
            var feature = geoJson.getFeature(0);
            var properties = feature.properties;
            properties.relative = (properties.type != null && properties.type.toLowerCase() === 'relative');
            properties.targetMode = !(properties['cameraHeightsMode']);
            properties.height = properties.height || 0;

            var routeGeoJSON = new GeoJSON();
            routeGeoJSON.addFeature(GeoJSON.createFeature(properties, geometry));

            return routeGeoJSON;
        },
        /**
         * Загрузить маршрут по ссылке
         * @method _uploadRemoteRoute
         * @private
         * @param routeParams {object} Параметры маршрута
         */
        _uploadRemoteRoute: function (routeParams) {
            GWTK.gEngine.TextFileLoader.loadTextFile(routeParams.url, GWTK.gEngine.Resources.enumTextFileType.eJSONFile, function (filePath) {
                this._onLoad(filePath, routeParams);
            }.bind(this));
        },
        /**
         * Загрузить маршрут из локального файла (geojson)
         * @method uploadLocalRoute
         * @public
         * @param file {File} объект File, загруженный пользователем, GeoJSON
         */
        uploadLocalRoute: function (file) {

            var fileName = file.name, that = this;
            var reader = new FileReader();

            var filePath = "local_uploadFile_" + fileName + "_" + Date.now() + "_" + Math.random();
            GWTK.gEngine.ResourceMap.asyncLoadRequested(filePath);
            reader.onload = function (e) {
                var json = null;
                try {
                    json = JSON.parse(e.target['result']);                               // открыть GeoJSON-file в карте
                    if (!json["type"] || json["type"] !== "FeatureCollection") {
                        console.error("JSON type \"FeatureCollection\" required!");
                    } else {
                        GWTK.gEngine.ResourceMap.asyncLoadCompleted(filePath, json);
                        that._onLoad(filePath, {});
                    }
                } catch (err) {
                    GWTK.gEngine.Mediator.publish('writeProtocol', {
                        text: w2utils.lang("The file is not in the format GeoJSON") + ": " + fileName,
                        displayFlag: true
                    });
                    GWTK.gEngine.ResourceMap.unloadAsset(filePath);
                }
            };
            reader.readAsText(file);
        }
    };
}