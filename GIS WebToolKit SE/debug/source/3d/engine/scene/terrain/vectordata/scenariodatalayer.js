/************************************** Железнякова Ю 12/02/2021 ****
 ******************************************* Тазин В.О. 17/09/20 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Компонент сценария движушихся объектов                *
 *                                                                  *
 *******************************************************************/
"use strict";
import Trigonometry from '~/3d/engine/core/trigonometry';
import WorkerManager from '~/3d/engine/worker/workermanager';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { ProjectionCollection } from '~/3d/engine/core/geometry/projection';
import { MessageQueueCommand } from '~/3d/engine/worker/workerscripts/queue';
import { vec3 } from '~/3d/engine/utils/glmatrix';

GWTK.enumScenarioMode = Object.freeze({
    ACTIVE: 0,
    PAUSED: 1,
    TURNED_ON: 2,
    TURNED_OFF: 3
});

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    // /**
    //  * Дополнительные метода для функциий шаблонов
    //  * @property GWTK.gEngine.Classifier.functions3d
    //  * @public
    //  */
    // GWTK.gEngine.Classifier.functions3d = GWTK.gEngine.Classifier.functions3d || {};

    /**
     * Класс слоя сценария движущихся объектов
     * @class GWTK.gEngine.Scene.ScenarioDataLayer
     * @constructor GWTK.gEngine.Scene.ScenarioDataLayer
     * @param map3dData {Object}
     * @param scenarioData {Object} - параметры сценария из json
     * @param scenarioJSON - файл json
     * @param coeffSpeedScenario - коэффициент скорости воспроизведения сценария
     */
    GWTK.gEngine.Scene.ScenarioDataLayer = function (map3dData, scenarioData, scenarioJSON, coeffSpeedScenario) {
        this._id = Date.now() * Math.random();
        this.map = map3dData.map;
        this.map3dData = map3dData;
        this._active = GWTK.enumScenarioMode.TURNED_OFF;
        this.defaultScenario = scenarioData || {};
        this.lyerScenario = this.defaultScenario.id;
        this.scenarioJSON = scenarioJSON;
        this.arrScenrioObject = [];
        this.tick = this._tick.bind(this);
        this.scenario = null;
        this.xsdList = [];
        this._messageQueue = WorkerManager.getWorker();
        this._textureArray = [];
        this._speedAnimation = coeffSpeedScenario;
        this.rscName = '';
        this.getRscNameID = null;
        this.allRouteForObj = {};
        this.countTrackFile = 0;
        this.getData = false;
        this.setTimeSpeed = false;
        this.timerRun = null;
        this.url_scenario = this.defaultScenario.url || this.map.options.url;
        this._init();
    };
    GWTK.gEngine.Scene.ScenarioDataLayer.prototype = {
        /**
         * Инициализация
         * @method _init
         * @private
         */
        _init: function () {
        },

        /**
         * Включить режим
         * @method turnedOn
         * @param active
         * @public
         */
        turnedOn: function (active) {
            this._active = active;
            if (this._active === GWTK.enumScenarioMode.TURNED_ON) {
                if ((!this.scenarioJSON) && this.defaultScenario && this.defaultScenario.url !== '') {
                    this._uploadScenario(this.defaultScenario);
                } else {
                    this._onLoad('', this.defaultScenario, this.scenarioJSON);
                }
                this._active = GWTK.enumScenarioMode.ACTIVE;
            }
        },

        /**
         * Активировать режим
         * @method activate
         * @public
         */
        activate: function () {
            this._subscribe();
            this._active = GWTK.enumScenarioMode.ACTIVE;
            for (var ii = 0; ii < this.arrScenrioObject.length; ii++) {
                this.arrScenrioObject[ii]._pauseCheck(this._active);
            }
        },
        /**
         * Деактивировать режим
         * @method deactivate
         * @public
         */
        deactivate: function () {
            this._unsubscribe();
            this._active = GWTK.enumScenarioMode.PAUSED;
            for (var ii = 0; ii < this.arrScenrioObject.length; ii++) {
                this.arrScenrioObject[ii]._pauseCheck(this._active);
            }

        },
        /**
         * Добавление обработчиков событий
         * @method _subscribe
         * @private
         */
        _subscribe: function () {
            var mediator = GWTK.gEngine.Mediator;
            mediator.subscribe('mapmoveEvent', this.tick);
        },
        /**
         * Удаление обработчиков событий
         * @method _unsubscribe
         * @private
         */
        _unsubscribe: function () {
            var mediator = GWTK.gEngine.Mediator;
            mediator.unsubscribe('mapmoveEvent', this.tick);
        },

        /**
         * Остановить выполнение сценария
         * @method _destroy
         * @private
         */
        _destroy: function () {
            this._unsubscribe();
        },

        /**
         * @method _tick
         * @private
         */
        _tick: function () {
            if (this._active === GWTK.enumScenarioMode.TURNED_ON) {
                if (this.defaultScenario) {
                    this._uploadScenario(this.defaultScenario);
                }
                this._active = GWTK.enumScenarioMode.ACTIVE;
            }
        },


        /**
         * Загрузить сценарий по ссылке
         * @method _uploadScenario
         * @private
         * @param scenarioParams {object} Параметры маршрута
         */
        _uploadScenario: function (scenarioParams) {
            GWTK.gEngine.TextFileLoader.loadTextFile(scenarioParams.url, GWTK.gEngine.Resources.enumTextFileType.eJSONFile, function (filePath) {
                this._onLoad(filePath, scenarioParams);
            }.bind(this));
        },

        /**
         * Обработчик загрузки сценария
         * @method _onLoad
         * @param filepath
         * @param scenarioParams
         * @param scenarioJson
         * @private
         */
        _onLoad: function (filepath, scenarioParams, scenarioJson) {
            if (this._mode === null) {
                return;
            }
            if (filepath !== '') {
                this.scenario = GWTK.gEngine.ResourceMap.retrieveAsset(filepath);
            } else {
                var scenarioFile = scenarioJson;
            }

            if ((scenarioFile == null || !scenarioFile.hasOwnProperty('FileScenario')) &&
                (!scenarioFile.FileScenario.hasOwnProperty('Scenario'))) {
                // console.log(w2utils.lang("File") + " " + filepath + " " + w2utils.lang("does not contain script"));
                GWTK.gEngine.Mediator.publish('writeProtocol', {
                    text: w2utils.lang("File") + " " + filepath + " " + w2utils.lang("does not contain script"),
                    displayFlag: true
                });
            } else {
                this.scenario = JSON.parse(JSON.stringify(scenarioFile.FileScenario.Scenario));

                if (this.scenario.hasOwnProperty('Name')) {
                    if (this.scenario.hasOwnProperty('Object')) {
                        if (!$.isArray(this.scenario.Object)) {
                            var objectArr = [];
                            objectArr.push(this.scenario.Object);
                            this.scenario.Object = objectArr;
                        }
                        this._getXSDScheme();
                        this._uploadTrackForScenario(this.lyerScenario, this.scenario.Object);
                        this.timer = window.setInterval(function () {
                                if (Object.keys(this.allRouteForObj).length === this.countTrackFile) {
                                    window.clearInterval(this.timer);
                                    this.countTrackFile = 0;
                                    this._setTimeStartForObjects(this.scenario.Object);
                                }
                            }.bind(this), 1200);
                    }
                }
            }
            if (filepath !== '') {
                GWTK.gEngine.ResourceMap.unloadAsset(filepath);
            }
        },

        /**
         * Начать создание объекта
         * @method runCreateObj
         */
        runCreateObj: function () {
            for (var objectkey in this.scenario.Object) {
                if (this.scenario.Object.hasOwnProperty(objectkey)) {
                    var objectValue = this.scenario.Object[objectkey];
                    if (!$.isEmptyObject(objectValue)) {
                        var routeCoord = this._getRouteCoord(objectValue.TrackFileName);
                        if (routeCoord !== null && routeCoord.length > 0) {
                            var scenarioObject = new GWTK.gEngine.Scene.ScenarioObject(this.scenario.Name, objectValue, routeCoord, this.map, this.map3dData, this._speedAnimation, this.rscName, this.url_scenario);
                            this.arrScenrioObject.push(scenarioObject);
                        }
                    }
                }
            }
            this.getData = true;
        },

        /**
         * Запросить координаты маршрута объекта
         * @param trackFileName
         * @return [] массив координат
         * @private
         */
        _getRouteCoord: function (trackFileName) {
            var routeCoord = [];
            if ((!$.isEmptyObject(trackFileName))&& (this.allRouteForObj.hasOwnProperty(trackFileName))) {
                routeCoord = this.allRouteForObj[trackFileName].coordinates;
            }
            return routeCoord;
        },

        /**
         * Перезаписать время старта для всех объектов
         * @method _setTimeStartForObjects
         * @param objects
         * @private
         */
        _setTimeStartForObjects: function (objects) {

            var allDistance = this.getAllDistance(objects);

            for (var objectNum = 0; objectNum < objects.length; objectNum++) {
                var objectValue = objects[objectNum];

                var newSpeedTimeEnd = this.calcNewSpeed(objectValue, allDistance);
                objects[objectNum].Speed = newSpeedTimeEnd.newSpeed;
                objects[objectNum].TimeEnd = newSpeedTimeEnd.timeEnd;
            }
            var arrayAfterObj = [];

            for (objectNum = 0; objectNum < objects.length; objectNum++) {
                var afterObj = objectNum + 1;
                if (parseInt(objects[(afterObj-1)].AfterObject) < afterObj) {
                    var newStart = parseFloat(objects[(afterObj - 1)].TimeEnd)+0.1;
                    for (var objectNum2 = 0; objectNum2 < objects.length; objectNum2++) {
                        if (parseInt(objects[objectNum2].AfterObject) === afterObj){
                            objects[objectNum2].TimeStart = parseFloat(objects[objectNum2].TimeStart) + newStart;
                            objects[objectNum2].TimeEnd = parseFloat(objects[objectNum2].TimeStart) + parseFloat(objects[objectNum2].TimeEnd);
                        }
                    }
                }
                else {

                    arrayAfterObj.push(afterObj);
                }
            }

            while (arrayAfterObj.length !==0) {
                var arrayAfterObj2 = arrayAfterObj.slice();
                arrayAfterObj.length = 0;
                for (objectNum = 0; objectNum < arrayAfterObj2.length; objectNum++) {
                    afterObj = arrayAfterObj2[objectNum];
                        newStart = parseFloat(objects[(afterObj - 1)].TimeEnd)+0.1;
                        for (objectNum2 = 1; objectNum2 < objects.length; objectNum2++) {
                            if (parseInt(objects[objectNum2].AfterObject) === afterObj) {
                                objects[objectNum2].TimeStart = parseFloat(objects[objectNum2].TimeStart) + newStart;
                                objects[objectNum2].TimeEnd = parseFloat(objects[objectNum2].TimeStart) + parseFloat(objects[objectNum2].TimeEnd);
                            }
                        }
                }
            }
            this.setTimeSpeed = true;
        },

        /**
         * Рассчитать длину маршрута ( для расчета скорости или времени движения)
         * @method getAllDistance
         * @param objects
         */
        getAllDistance: function(objects){
            // найдем длину линии
            var allDistance = {};

            for (var objectNum = 0; objectNum < objects.length; objectNum++) {
                var lAllLine = 0;
                var lengthSegment = [];
                var coordXY = [];
                var object = objects[objectNum];
                if (!(object.TrackFileName in allDistance)) {
                    var routeCoord = this._getRouteCoord(object.TrackFileName);

                    for (var numCoord = 0; numCoord < routeCoord.length; numCoord++) {
                        coordXY[numCoord] = Trigonometry.toRadians(new Geodetic3D(routeCoord[numCoord][0], routeCoord[numCoord][1], routeCoord[numCoord][2]));
                    }

                    for (numCoord = 1; numCoord < coordXY.length; numCoord++) {
                        lengthSegment[numCoord - 1] = this._getDistance(coordXY[numCoord - 1], coordXY[numCoord]);
                        lAllLine += lengthSegment[numCoord - 1];
                    }
                    allDistance[object.TrackFileName] = lAllLine;
                }
            }
            return allDistance;
        },
        /**
         * Рассчитать новую скорость движения для объекта
         * (если не указано время окнчания то скорость расчитывается растояние/ время)
         * @method calcNewSpeed
         * @param object
         * @param allDistance - длина пути
         * @return {{timeEnd: *, newSpeed: *}|number}
         */
        calcNewSpeed: function (object, allDistance) {
            var timeEnd = object.TimeEnd;
            var newSpeed = 0;
            // найдем длину линии
            if (allDistance.hasOwnProperty(object.TrackFileName) && object.TrackFileName!== 0) {
                var lAllLine = allDistance[object.TrackFileName];

                if (lAllLine > 0 && object.hasOwnProperty('Speed') && object.hasOwnProperty('TimeEnd') && parseFloat(object.TimeEnd) !== 0) {
                    newSpeed = (lAllLine / parseFloat(object.TimeEnd)) * 3.6;
                } else {
                    newSpeed = object.Speed;
                    if (parseFloat(object.TimeEnd) === 0) {
                        timeEnd = lAllLine / ((newSpeed * 1000) / 3600) + parseFloat(object.TimeStart);
                    }
                }
            }
            return {
                newSpeed: newSpeed,
                timeEnd: parseFloat(timeEnd)
            };

        },

        /**
         * Расстояние между точками
         * @method _getDistance
         * @param currGeoPoint - первая точка
         * @param nextGeoPoint - вторая точка
         * @return {number}
         * @private
         */
        _getDistance: function (currGeoPoint, nextGeoPoint) {
            var projection = ProjectionCollection.GoogleMapsCompatible;//TODO: по эллипсоиду
            var ellipsoid = projection.getGlobeShape();
            if (currGeoPoint._height === 0) {
                var height = GWTK.heightSourceManager.getHeightInPoint(currGeoPoint);
                currGeoPoint.setHeight(height);
            }
            if (nextGeoPoint._height === 0) {
                height = GWTK.heightSourceManager.getHeightInPoint(nextGeoPoint);
                nextGeoPoint.setHeight(height);
            }

            var currPoint = ellipsoid.toVector3d(currGeoPoint, []);
            var newPoint = ellipsoid.toVector3d(nextGeoPoint, []);

            var curVector = vec3.sub(newPoint, currPoint, []);
            return vec3.len(curVector);
        },


        /**
         * Запросить список xsd схем
         * @method _getXSDScheme
         * @private
         */
        _getXSDScheme: function () {
            if (!this.url_scenario) {
                // console.log(GWTK.Util.notfoundPanoranaUrl());
                GWTK.gEngine.Mediator.publish('writeProtocol', {
                    text: GWTK.Util.notfoundPanoranaUrl(),
                    displayFlag: true
                });
                return;
            }

            this.getRscNameID = setInterval(this.checkGetRscName.bind(this), 100);
            // var wfs = new WfsQueries(this.url_scenario, this.map),
            //     tool = this;
            // wfs.getxsdlist(function (xml) {
            //     tool._onGetXsdList(xml);
            // });
            const httpParams = GWTK.RequestServices.createHttpParams(this.map, { url: this.url_scenario });
            const wfs = GWTK.RequestServices.retrieveOrCreate(httpParams, 'REST');
            wfs.getXsdList().then((result) => {
                this._onGetXsdList(result.data);
            })
        },

        /**
         * Имя классификатора получено
         * @method checkGetRscName
         */
        checkGetRscName: function () {
            if (this.rscName !== '') {
                clearInterval(this.getRscNameID);
            }
        },

        /**
         * Обработчик получения списка xsd схем
         * @method _onGetXsdList
         * @param xml {String} xml-ответ операции GetXsdList
         */
        _onGetXsdList: function (xml) {

            this.xsdList = [];

            var $member = $(xml).find('member'),
                $child = $member.find('value').children();

            if ($member.length === 0 || $child.length === 0) {
                // console.log(w2utils.lang("Failed to get data"));
                // console.log(xml);
                var errorHtml = GWTK.gEngine.Utils3d.parseServiceException(xml);
                var protocolHtml = (errorHtml ? errorHtml + " " : "") + w2utils.lang("Server") + ": " + this.url_scenario + ". "+ w2utils.lang("Request") + ": "+"RestMethod=GetXsdList"+".";
                GWTK.gEngine.Mediator.publish('writeProtocol', {text: protocolHtml, displayFlag: false});

                GWTK.gEngine.Mediator.publish('writeProtocol', {
                    text: w2utils.lang("Failed to get data") + " (<i>" + w2utils.lang("Details in the event log") + "</i>)",
                    displayFlag: true
                });
                return;
            }

            var slist = $child.html(),
                list = slist.split(','), i, len;

            for (i = 0; len = list.length, i < len; i++) {
                this.xsdList.push({id: i + 1, text: list[i]});
            }
            this._setParam3dObjectsByClassifier();
        },

        /**
         * Сформировать Список ключей объектов
         * @method _getKeyTemplateList
         * @param objects
         * @return {string}
         * @private
         */
        _getKeyTemplateList: function (objects) {
            var keyListObj = [];
            for (var objNum = 0; objNum < objects.length; objNum++) {
                if (objects[objNum].hasOwnProperty('ObjectKey')){
                    if (keyListObj.indexOf(objects[objNum].ObjectKey) === -1) {
                        keyListObj.push(objects[objNum].ObjectKey);
                    }
                }
            }
            return keyListObj.join();
        },

        /**
         * Установить параметры для запроса объекта по классификатору
         * @method _setParam3dObjectsByClassifier
         * @private
         */
        _setParam3dObjectsByClassifier: function () {
            var rscName = this.scenario.RscName;
            if (rscName.slice(-4) === '.rsc') {
                rscName = rscName.slice(0, rscName.length - 4)
            }

            if (this.xsdList.length !== 0) {
                if (this._checkRscInXSDScheme(rscName)) {
                    this.rscName = rscName;
                    var keyTemplateListString = this._getKeyTemplateList(this.scenario.Object);
                    this._load3dObjectsByClassifier(rscName, this.url_scenario, keyTemplateListString);
                }
            }
        },

        /**
         * Проверить опубликован ли нужный rsc на сервисе
         * @method _checkRscInXSDSсheme
         * @private
         */
        _checkRscInXSDScheme: function (rscName) {
            var xsdList = this.xsdList;
            for (var listNum = 0; listNum < xsdList.length; listNum++) {
                if (rscName === this.xsdList[listNum].text) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Загрузить 3D-описания объектов по классификатору
         * @method loadDescObjects3DByXml
         * @public
         */
        loadDescObjects3DByXml: function (url) {
            // Составление описаний xml-запроса в соответствии к слою(карте)
            var jsObj3D = {
                "LAYER_ID": 'infrastructure3d',
                "LAYER": 'infrastructure3d',
                "OBJLOCAL": 2,//возможно 5?
                "KEYLIST": "D-53110000-P",
                "SERVICEVERSION": "13.02.00"
            };

            var command = MessageQueueCommand.setupParser3d;
            var data = {
                jsRpc: jsObj3D,
                descList: [{
                    code: "53110000",
                    local: 2,
                    objectkey: "D-53110000-P",
                    semlist: [],
                    viewtype: "4",
                    cut: 1,
                    color: "#808080",
                    opacity: 0.75,
                    height: {heightDef: 40, keySem: "", heightSem: 1},
                    relativeHeight: undefined
                }],
                serviceUrl: url,
                command
            };
            this._messageQueue.post(this._messageQueue.createMessageData(this._layerId, data, 0, 100000), {onLoad:this._onSetupHandler.bind(this)});
        },

        /**
         * Загрузить 3D-описания объектов по классификатору
         * @method _load3dObjectsByClassifier
         * @public
         */
        _load3dObjectsByClassifier: function (rscName, url, keyList) {
            // Составление описаний xml-запроса в соответствии к слою(карте)
            var jsObj3D = {
                "CLASSIFIERNAME": rscName,
                "OBJLOCAL": 2,//возможно 5?
                "KEYLIST": keyList,
                "SERVICEVERSION": "13.04.01"		//			Версия запроса
            };

            var command = MessageQueueCommand.setupParser3dByClassifier;
            var data = {
                jsRpc: jsObj3D,
                serviceUrl: url,
                command
            };
            this._messageQueue.post(this._messageQueue.createMessageData( rscName, data, 0, 100000),{onLoad:this._onSetupHandler.bind(this)});

            window.setTimeout(function () {
                GWTK.gEngine.Mediator.unsubscribe('clearLoadingScreen', this._load3dObjectsByClassifier)
            }.bind(this), 0);

        },
        /**
         * Обработчик загрузки данных источника
         * @method _onSceneUpdate
         * @private
         * @param message {object} Сообщение из второго потока
         */
        _onSetupHandler: function (message) {
            if (message.success === true) {
                this._textureArray = message.textureArray;

                if (this.setTimeSpeed){
                    this.runCreateObj();
                }
                else {
                    this.timerRun = window.setInterval(function () {
                        if (this.setTimeSpeed){
                            window.clearInterval(this.timerRun);
                            this.runCreateObj();
                        }
                    }.bind(this), 700);
                }
            }
        },

        /**
         * Добавление шаблонов
         * @method _addTemplates
         * @private
         * @param arrayBuffer {ArrayBuffer} Поток данных
         * @param classifierName {string} Идентификатор слоя
         * @param serviceUrl {string} Url- адрес сервиса
         */
        _addTemplates: function (arrayBuffer, classifierName, serviceUrl) {
            // Добавляем объект класса обработки трёхмерных объектов
            var json = this.parser3d.readObject3D(arrayBuffer, null);
            if (json !== undefined) {
                // Обработа загрузки кодов объектов
                this._createObjectTemplates(json, serviceUrl + classifierName);
            } else {
                console.log("Failed to get classifier 3D samples");
            }
        },

        /**
         * Удаление слоя
         * @method destroy
         * @public
         */
        destroy: function () {
            if (this.arrScenrioObject.length !== 0) {
                for (var ii = 0; ii < this.arrScenrioObject.length; ii++) {
                    var scenarioObject = this.arrScenrioObject[ii];
                    scenarioObject.deactivate();
                }
                this.arrScenrioObject = [];
            }
            this._destroy();
        },
        /**
         * Установить значение коэффициента скорости анимации
         * @method setAnimationSpeedValue
         * @public
         * @param value {number} Значение коэффициента скорости анимации
         */
        setAnimationSpeedValue: function (value) {
            for (var ii = 0; ii < this.arrScenrioObject.length; ii++) {
                this.arrScenrioObject[ii].setAnimationSpeedValue(value);
            }
        },


        /**
         * Загрузить маршрут для объекта сценария
         * @param layersScenario,
         * @param objects
         * @private
         */
        _uploadTrackForScenario: function (layersScenario, objects) {
            if (!this.url_scenario) {
                // console.log(GWTK.Util.notfoundPanoranaUrl());
                GWTK.gEngine.Mediator.publish('writeProtocol', {
                    text: GWTK.Util.notfoundPanoranaUrl(),
                    displayFlag: true
                });
                return;
            }
            var trackAll = {};

            for (var objectNum = 0; objectNum < objects.length; objectNum++) {
                var objectValue = objects[objectNum];

                var fileName = objectValue.TrackFileName;
                if (this.allRouteForObj.hasOwnProperty(fileName)) {
                    continue;
                }
                if (!trackAll.hasOwnProperty(objectValue.TrackFileName)){
                    trackAll[objectValue.TrackFileName] = 1;
                }

                var jsObj3D = {
                    LAYER: layersScenario,
                    FILENAME:fileName
                };

                var command = MessageQueueCommand.getTrackForScenario;
                var data = {
                    jsRpc: jsObj3D,
                    serviceUrl: this.url_scenario,
                    command
                };
                 this._messageQueue.post(this._messageQueue.createMessageData(fileName + Math.random(), data, 0, 100000), {onLoad:this._onGetTrackScenarioJson.bind(this)});
            }
            this.countTrackFile = Object.keys(trackAll).length;

            return this.countTrackFile;

        },

        /**
         * Маршрут для объекта сценария загружен
         * @method _onGetTrackScenarioJson
         * @param responseData координаты
         * @private
         */
        _onGetTrackScenarioJson: function(responseData, message) {
            if (!responseData || !responseData.jsonfile || !responseData.jsonfile.hasOwnProperty('coordinates')) {
                this.countTrackFile--;
                return;
            }

            var coordinates = responseData.jsonfile.coordinates;
            var fileName = message.messageParams.jsRpc.FILENAME;
            if (coordinates === null) {
                return;
            }
            for (var numCoord = 0; numCoord < coordinates.length; numCoord++) {
                var coord1 = coordinates[numCoord][1];
                var coord0 = coordinates[numCoord][0];
                coordinates[numCoord][0] = coord1;
                coordinates[numCoord][1] = coord0;
            }
            this.allRouteForObj[fileName] = responseData.jsonfile;
        }

    }
}
