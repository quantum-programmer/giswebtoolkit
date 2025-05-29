/************************************ Железнякова Ю. 03/07/2020  ****
 ****************************************** Тазин В.О. 28/01/21  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Сценарий движущихся объектов                    *
 *                                                                  *
 *******************************************************************/
"use strict";
import WorkerManager from '~/3d/engine/worker/workermanager';
import { MessageQueueCommand } from '~/3d/engine/worker/workerscripts/queue';

if (window.GWTK) {
    GWTK.enumScenarioMode = Object.freeze({
        ACTIVE: 0,
        PAUSED: 1,
        TURNED_ON: 2,
        TURNED_OFF: 3
    });
    
    /**
     * Интерфейс компонента просмотра с воздуха
     * @class GWTK.ScenarioUI
     * @constructor GWTK.ScenarioUI
     * @param ScenarioController
     * @param Scenario3dPane
     * @param map3dData
     * @param layerList
     */
    GWTK.ScenarioUI = function (ScenarioController, Scenario3dPane, map3dData, layerList) {
        this.Scenario3dPane = Scenario3dPane;
        this.ScenarioController = ScenarioController;
        this.map3dData = map3dData;
        this._layerList = layerList;
        this._waitSenarioDataLayerIntervalID = null;
        this.title = "Motion scenario";
        this.id = "motion_scen_button";
    };

    GWTK.ScenarioUI.prototype = {

        /**
         * Инициализация
         * @method init
         * @public
         */
        init: function () {
            var button = {
                id: this.id,
                className: "button-scenario3d icon-toolbar3d-menu-item",
                text: this.title,
                toggleHandler: this.ScenarioController.changeOnOff
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
                'id': 'scenario3d_toolbar',
                'class': 'user-control-3d map-panel-def toolbar-panel-freeFlight3d',
                'header': true,
                'hidable': true,
                'parent': this.Scenario3dPane[0]
            });

            this.$panel.draggable({containment: 'body'});
            this.panelHeaderElement = this.$panel[0].getElementsByTagName('span')[0];
            GWTK.DomUtil.setPosition(this.$panel[0], GWTK.point(50, 30));

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
            this.increaseSpeedElement.addEventListener("click", this.ScenarioController.incSpeedValue);

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
            this.decreaseSpeedElement.addEventListener("click", this.ScenarioController.decSpeedValue);

            // контейнер кнопки режима
            var playContainer = document.createElement("div");
            playContainer.classList.add("toolbar-panel-freeFlight3d-container", "clickable", "toolbar-panel-freeFlight3d-border", "toolbar-panel-freeFlight3d-button");
            playContainer.addEventListener('click', this.ScenarioController.toggleMode);
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

            //таблица w2ui
            var $gridElement = $(this.gridElement);
            var name = 'scenario3D';
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
                            caption: w2utils.lang('Done'),
                            icon: 'gwtk-icon-check',
                            hint: w2utils.lang('Select scenario'),
                            onClick: this.gridDoneHandler,
                            disabled: true
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
                        caption: w2utils.lang('Name'),
                        size: "33%",
                        suffix: '',
                        editable: {type: 'text'}
                    },
                    {
                        field: 'description',
                        caption: w2utils.lang('Description'),
                        size: "50%",
                        suffix: '',
                        editable: {type: 'text'}
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
                this.ScenarioController.updateScenarioParams(changes);
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
            this._grid.lock('', true);
            var sel = this._grid.getSelection();
            for (var i = 0; i < sel.length; i++) {
                this.ScenarioController.setUpScenario(this._grid.get(sel[i]).recid);
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
            this.panelHeaderElement.textContent = w2utils.lang("Select scenario");
            this.$panel.append(this.gridElement);
            this._grid.refresh();
        },


        /**
         * Добавить запись в таблицу сценариев
         * @method addScenarioRecord
         * @public
         * @param scenarioParams {object} Параметры маршрута
         */
        addScenarioRecord: function (scenarioParams) {
            var recid = this._grid.records.length + 1;
            var name = scenarioParams.alias;
            if (name == null) {
                name = w2utils.lang("Undefined path");
            }
            var description = scenarioParams.description;
            if (description == null) {
                description = w2utils.lang("User route");
            }

            this._grid.add({recid: recid, name: name, description: description});
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
         * @param mode {GWTK.enumScenarioMode} Состояние режима сценария
         */
        updateFlyMode: function (mode) {
            switch (mode) {
                case GWTK.enumScenarioMode.TURNED_ON:
                    this._setOnState();
                    break;
                case GWTK.enumScenarioMode.TURNED_OFF:
                    this._setOffState();
                    break;
                case GWTK.enumScenarioMode.ACTIVE:
                    this._setPlayState();
                    break;
                case GWTK.enumScenarioMode.PAUSED:
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
            this._grid.selectNone();
            this.$panel.hide();
        },
        /**
         * Установить режим "старт движения"
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
            var bt = $('#motion_scen_button');
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
     * Контроллер компонента сценарий движущегося объекта
     * @class GWTK.ScenarioUI
     * @constructor GWTK.ScenarioUI
     * @param map3dData {GWTK.Map3dData} Объект 3D параметров карты
     * @param layerList
     */
    GWTK.ScenarioUIController = function (map3dData, layerList) {
        this.ScenarioUI = null;
        this.defCoords = [];
        this._scenarioCollection = [];
        this.map3dData = map3dData;
        this._layerList = layerList;
        this.scenarioDataLayer = {};
        this.scenarioParams = {};
        this._messageQueue = WorkerManager.getWorker();

        this.speedMult = null;

        this._activeScenario = null;
        this._mode = GWTK.enumScenarioMode.TURNED_OFF;
        this.timer = null;
        this.selectRecId = 0;

        this.changeOnOff = this._changeOnOff.bind(this);
        this.changeOnOff_new = this._changeOnOff_new.bind(this);
        this.incSpeedValue = this._incSpeedValue.bind(this);
        this.decSpeedValue = this._decSpeedValue.bind(this);
        this.toggleMode = this._toggleMode.bind(this);


        this._initUI(map3dData);
    };
    GWTK.ScenarioUIController.prototype = {
        /**
         * Инициализация интерфейса пользователя
         * @method _initUI
         * @private
         * @param map3dData {GWTK.Map3dData} Объект 3D параметров карты
         */
        _initUI: function (map3dData) {
            var scenarioList = map3dData.getScenarioList();
            if (Array.isArray(scenarioList) && scenarioList.length > 0) {
                // Панель для кнопки
                var Scenario3d = $(document.getElementById('tools3d_div'));
                this.ScenarioUI = GWTK.mapCreateUserControl('scenario3d', map3dData.map, new GWTK.ScenarioUI(this, Scenario3d, this.map3dData, this._layerList), true);
                for (var i = 0; i < scenarioList.length; i++) {
                    this._uploadScenario(scenarioList[i]);
                }
            }
        },
        /**
         * Смена состояния (включен/выключен)
         * @method _changeOnOff
         * @private
         */
        _changeOnOff: function () {
            if (this._mode !== null) {
                if (this._mode !== GWTK.enumScenarioMode.TURNED_OFF) {
                    this._setMode(GWTK.enumScenarioMode.TURNED_OFF);
                } else {
                    this._setMode(GWTK.enumScenarioMode.TURNED_ON);
                }
            }
        },
        _changeOnOff_new: function () {
            if (this._mode !== null) {
                if (this._mode !== GWTK.enumScenarioMode.TURNED_OFF) {
                    this._setMode(GWTK.enumScenarioMode.TURNED_OFF);
                } else {
                    this._setMode(GWTK.enumScenarioMode.TURNED_ON);
                    return true;
                }
            }
            return false;
        },
        /**
         * Смена состояния (движения/паузы)
         * @method _toggleMode
         * @private
         */
        _toggleMode: function () {
            if (this._mode === GWTK.enumScenarioMode.ACTIVE) {
                this._setMode(GWTK.enumScenarioMode.PAUSED);
            } else if (this._mode === GWTK.enumScenarioMode.PAUSED) {
                this._setMode(GWTK.enumScenarioMode.ACTIVE);
            }
        },
        /**
         * Установить режим работы
         * @method _setMode
         * @private
         * @param mode {GWTK.enumScenarioMode} Режим
         */
        _setMode: function (mode) {
            if (mode != null && this._mode !== mode) {
                this._mode = mode;
                switch (mode) {
                    case GWTK.enumScenarioMode.TURNED_ON:
                        this._turnOn();
                        break;
                    case GWTK.enumScenarioMode.TURNED_OFF:
                        this._turnOff();
                        break;
                    case GWTK.enumScenarioMode.ACTIVE:
                        this._resumeScenario();
                        break;
                    case GWTK.enumScenarioMode.PAUSED:
                        this._pauseScenario();
                        break;
                }
                if(this.ScenarioUI) {
                    this.ScenarioUI.updateFlyMode(mode);
                }
            }
        },
        /**
         * Включить режим
         * @method _turnOn
         * @private
         */
        _turnOn: function () {
            if (w2ui['scenario3D'].records.length === 1) {
                w2ui['scenario3D'].select(1);
            } else {
                if (this.selectRecId !== 0) {
                    w2ui['scenario3D'].select(this.selectRecId);
                }
            }

            this._setSpeedValue(1.);
        },

        /**
         * Подождать старта сценария
         * @return {boolean}
         * @private
         */
        _waitSenarioDataLayer: function () {
            if (this._mode !== GWTK.enumScenarioMode.TURNED_ON) {
                clearInterval(this._waitSenarioDataLayerIntervalID);
                return false;
            }
            if (!$.isEmptyObject(this.scenarioDataLayer)) {
                clearInterval(this._waitSenarioDataLayerIntervalID);
                this.scenarioDataLayer.turnedOn(GWTK.enumScenarioMode.TURNED_ON);
                this._setMode(GWTK.enumScenarioMode.ACTIVE);
                return true;
            }
        },


        /**
         * Выключить режим
         * @method _turnOff
         * @private
         */
        _turnOff: function () {
            this.selectRecId = w2ui['scenario3D'].getSelection()[0];
            if (!$.isEmptyObject(this.scenarioDataLayer)) {
                this.scenarioDataLayer.destroy();
            }
            this._activeScenario = null;
        },
        /**
         * Продолжить выполнение сценария
         * @method _resumeScenario
         * @private
         */
        _resumeScenario: function () {
            this.scenarioDataLayer.activate(true);
        },
        /**
         * Прервать выполнение сценария
         * @method _pauseScenario
         * @private
         */
        _pauseScenario: function () {
            this.scenarioDataLayer.deactivate();
        },
        /**
         * Завершить работу компонента
         * @method destroy
         * @public
         */
        destroy: function () {
            this._setMode(GWTK.enumScenarioMode.TURNED_OFF);
            if(this.ScenarioUI) {
                this.ScenarioUI.destroy();
                this.ScenarioUI = null;
            }
            this.defCoords = null;
            this._scenarioCollection = null;
        },
        /**
         * Установить сценарий
         * @method setUpScenario
         * @private
         * @param recId
         */
        setUpScenario: function (recId) {

            if (this._activeScenario !== recId) {

                this.defCoords.length = 0;
                var scenarioJson = this._scenarioCollection[recId].scenarioParams;
                if (scenarioJson != null) {
                    this._activeScenario = recId;

                    this.scenarioDataLayer = new GWTK.gEngine.Scene.ScenarioDataLayer(this.map3dData,
                        this._scenarioCollection[recId].scenarioParams, this._scenarioCollection[recId].dataScenario, this.speedMult);
                    this._layerList.push(this.scenarioDataLayer);
                    this._startScenario();
                }
            }
        },
        /**
         * Запустить исполенеие сценария
         * @method _startScenario
         * @private
         */
        _startScenario: function () {
            if ($.isEmptyObject(this.scenarioDataLayer)) {
                var timeWait = 1000;
                this._waitSenarioDataLayerIntervalID = setInterval(this._waitSenarioDataLayer.bind(this), timeWait);
            } else {
                this.scenarioDataLayer.turnedOn(GWTK.enumScenarioMode.TURNED_ON);

                this.timer = window.setInterval(function () {
                    if (!$.isEmptyObject(this.scenarioDataLayer) && this.scenarioDataLayer.getData) {
                        window.clearInterval(this.timer);
                        this.ScenarioUI._grid.unlock();
                        this._setMode(GWTK.enumScenarioMode.ACTIVE);
                    }
                }.bind(this), 1200);

            }
        },
        /**
         * Обновить параметры сценария
         * @method updateScenarioParams
         * @public
         * @param records
         */
        updateScenarioParams: function (records) {
            if (Array.isArray(records)) {
                for (var i = 0; i < records.length; i++) {
                    var record = records[i];
                    var geoJson = this._scenarioCollection[record.recid].scenarioParams;
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
                this.ScenarioUI.updateSpeedValue(this.speedMult + "");
                if (!$.isEmptyObject(this.scenarioDataLayer)) {
                    this.scenarioDataLayer.setAnimationSpeedValue(this.speedMult);
                }
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
         * @private
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
         * @private
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
         * Обработчик загрузки сценария
         * @method _onLoad
         * @param filepath
         * @param scenarioParams
         * @private
         */
        _onLoad: function (filepath, scenarioParams) {
            if (this._mode === null) {
                return;
            }
            var dataScenario = GWTK.gEngine.ResourceMap.retrieveAsset(filepath);

            if (dataScenario == null || !dataScenario.hasOwnProperty('ScenarioList') || !dataScenario.hasOwnProperty('RouteList')) {
                // console.log(w2utils.lang("The file is not in the format ScenarioJson") + ": " + filepath);
                GWTK.gEngine.Mediator.publish('writeProtocol', {
                    text: w2utils.lang("The file is not in the format ScenarioJson") + ": " + filepath,
                    displayFlag: true
                });
            } else {
                var recId = this.ScenarioUI.addScenarioRecord(scenarioParams);
                this.scenarioParams = scenarioParams;
                this._scenarioCollection[recId] =
                    {
                        dataScenario: dataScenario,
                        scenarioParams: scenarioParams
                    };
            }
            GWTK.gEngine.ResourceMap.unloadAsset(filepath);
        },

        /**
         * Загрузить сценарий
         * @param scenarioParams
         * @private
         */
        _uploadScenario: function (scenarioParams) {
            if (scenarioParams.url !== null && scenarioParams.url !== "") {
                var url = scenarioParams.url;
            } else {
                url = this.map3dData.getMapState().getMapServiceURL();
            }


            var jsObj3D = {
                LAYER: scenarioParams.id
                //,
                // startScenario: 0
            };

            var command = MessageQueueCommand.getScenarioParam;
            var data = {
                jsRpc: jsObj3D,
                serviceUrl: url,
                scenarioParams: scenarioParams,
                command
            };
            this._messageQueue.post(this._messageQueue.createMessageData( scenarioParams.id, data, 0, 100000),{onLoad:this._onGetScenario.bind(this)});
        },

        /**
         * Обработка загрузки сценария
         * @method _onGetScenario
         * @param responseData
         * @private
         */
        _onGetScenario: function (responseData,message) {
            if (responseData === null) {
                return;
            }
            if (this._mode === null) {
                return;
            }
            var dataScenario = responseData.jsonfile;
            var scenarioParams = message.messageParams.scenarioParams;

            if (dataScenario == null || !dataScenario.hasOwnProperty('FileScenario')) {
                // console.log(w2utils.lang("The file is not in the format ScenarioJson") + ": " + scenarioParams.alias);
                GWTK.gEngine.Mediator.publish('writeProtocol', {
                    text: w2utils.lang("The file is not in the format ScenarioJson") + ": " + scenarioParams.alias,
                    displayFlag: true
                });
            } else {
                var recId = this.ScenarioUI.addScenarioRecord(scenarioParams);
                this.scenarioParams = scenarioParams;
                this._scenarioCollection[recId] =
                    {
                        dataScenario: dataScenario,
                        scenarioParams: scenarioParams
                    };

            }
        }
    }
}