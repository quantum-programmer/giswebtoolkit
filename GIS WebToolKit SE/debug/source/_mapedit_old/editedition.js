/************************************* Соколова  ***** 29/11/18 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2018              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                      Редактор объектов карты                     *
*                Режим редактирование объекта карты                *
*                                                                  *
*******************************************************************/
if (window.GWTK) {
    // Задача Редактирования объекта карты   
    GWTK.mapeditorEditingTask = function (id, map, params) {
        this.error = true;

        // Переменные класса
        this.toolname = 'mapeditorEditingTask';
        if (!map) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        GWTK.mapeditorEditingTask.prototype.__proto__ = GWTK.MapTask.prototype;
        GWTK.MapTask.call(this, map);    // родительский конструктор     

        if (!params || !params.context || params.context instanceof GWTK.mapeditorTask === false)
            return;

        this.params = params;
        this.mapeditorTask = params.context;
        this.drawobject = params.context.drawobject;
        if (!this.drawobject) return;
        // Запросим объекты окружения, если их нет
        this.topology = params.context.topology;
        if (!this.topology) return;
        this.bt_selector = this.params.bt_selector;
        this.selectobject = this.params.selectobject;

        this.map = map;                           // объект карты
        this.id = (id) ? id : Math.random();      // уникальный идентификатор объекта

        // Замыкание контекста 
        this.bind();

        if (!this.init()) return;

        this.set();
        this.error = false;
    };

    GWTK.mapeditorEditingTask.prototype = {

        /**
         * ИНИЦИАЛИЗАЦИЯ
         */
        init: function () {
            var mapeditorTask = this.mapeditorTask;
            if (!mapeditorTask)
                return;

            // Очистим историю
            mapeditorTask.history.clear();

            // Сброс выделения, если нет объекта на входе
            if (!this.selectobject)
                this.map.handlers.clearselect_button_click();

            // Обновим слои для редактирования
            mapeditorTask.setlayers(mapeditorTask.maplayerid);
            if (!mapeditorTask.layer) return;

            // Если на входе объект для редактирования, то ничего не выбираем, сразу запускаем его
            if (this.selectobject) {
                // Если подлежит редактированию
                if (mapeditorTask.canEditObject(this.selectobject))
                    this.setobject(this.selectobject);
            }
            else {
                if (!this.action)
                    this.clickEditing();
            }
            return true;
        },

        /**
         * Инициализация параметров класса
         * @method initparam
         */
        // ===============================================================
        set: function (param) {
        },

        // Разрушение задачи
        destroy: function () {
            $(this.map.eventPane).off('featurelistclick', this.onFeatureListClick);
            // Удалим события
            if (this.mapeditorTask)
                this.mapeditorTask.clear();
        },

        /**
        * Замыкание контекста 
        * @method bind
        */
        // ===============================================================
        bind: function () {
            this.onFeatureListClick = GWTK.Util.bind(this.onFeatureListClick, this);
            this.setobject = GWTK.Util.bind(this.setobject, this);
            this.onSourceFeatureListClick = GWTK.Util.bind(this.onSourceFeatureListClick, this);
        },

        // Сбросить кнопки метода создания
        clearMethod: function () {
            var action = this.map.taskManager._action;
            if (action) { 
                if (action instanceof GWTK.MapeditorEditingAction)
                    action.clearMethod();
                if (action.task instanceof GWTK.MapeditorCreatingTask)
                    action.task.clearMethod();
            }
        },

        /**
         * Нажатие на кнопку редактирования
         * @method clickCreating
         */
        // ===============================================================
        clickEditing: function () {
            this.mapeditorTask.selectObject(this.onFeatureListClick);
        },


        /**
         * Событие на выбор объекта в списке выделенных объектов
         * @method  onFeatureListClick
         * @param ui {Object} Событие
         */
        // ===============================================================
        onFeatureListClick: function (ui) {
            $(this.map.eventPane).off('featurelistclick', this.onFeatureListClick);
            if (!ui.layer || !ui.gid)
                return false;
            // Если не подлежит редактированию
            var editobject = this.mapeditorTask.canEditSelectObject(ui.layer, ui.gid, this.map.objectManager.selectedFeatures);
            if (editobject) {
                // Добавим в список объектов
                this.mapeditorTask.drawSelectFeatures.clear();
                if (this.mapeditorTask.drawSelectFeatures.add(editobject)) {
                    this.setobject(this.mapeditorTask.drawSelectFeatures.mapobjects[this.mapeditorTask.drawSelectFeatures.mapobjects.length-1]);
                }
            }
            else {
                this.clickEditing();
                return;
            }

            // Если есть координаты точки, то запросить список объектов в точке
            if (ui.pointevent) {
                // Заполнить список объектов в точке
                this.mapeditorTask.setObjectsIntoPoint(ui.pointevent, ui.gid, this.setobject);
            }

        },

         /**
         * Установка объекта для редактирования
         * @method setobject
         * @param selectobject {Object} GWTK.mapobject 
         */
        // ===============================================================
        setobject: function (selectobject) {
            if (!selectobject) return;

            var mapeditorTask = this.mapeditorTask;
            if (!mapeditorTask) return;

            if (!selectobject.geometry || selectobject.geometry.count() <= 0) {
                // Попробуем найти
                var sobject = this.map.objectManager.selectedFeatures.findobjectsById(selectobject.maplayerid, selectobject.gid);
                if (!sobject || !sobject.geometry || sobject.geometry.count() <= 0) {
                    w2alert(w2utils.lang('An object is no metric information'));
                    return;
                }
                var find = mapeditorTask.drawSelectFeatures.mapobjects.find(
                  function (element, index, array) {
                      if (element.gid == sobject.gid) {
                          mapeditorTask.drawSelectFeatures.mapobjects.splice(index, 1, sobject.clone());
                          return selectobject = mapeditorTask.drawSelectFeatures.mapobjects[index];
                      }
                  });

                if (!find)  {
                    w2alert(w2utils.lang('An object is no metric information'));
                    return;
                }
                //mapeditorTask.drawSelectFeatures.add(find);
            }

            // Клон объекта на редактирование
            mapeditorTask.editobjects[0] = selectobject.clone();

            // Сбросим выделенные объекты
             mapeditorTask.clearSelectedFeaturesMap();

            // Создадим панель для отрисовки объекта
            if (!mapeditorTask.createdrawpanel())
                return;

            mapeditorTask.ischange(false);

            // Откроем информационное окно
            mapeditorTask.createPaneInfoObject('edit');

            // запустим процесс редактирования
            this.processEdition();

            //// Тестирование создания объекта автономно через api-функцию геометрии
            //mapeditorTask.editobjects[0].geometry.clear();
            //var json = mapeditorTask.editobjects[0].saveJSON();
            //var ret = GWTK.mapCreationObjectGeometry(this.map, json, { 'box': true });
            //if (ret) {
            //    var map = this.map;
            //    $(this.map.eventPane).one('creationobjectgeometry', function (ui) {
            //        //if (ui.mapobject) {
            //        //    var editobject = new GWTK.mapobject(map, '0');
            //        //    if (editobject.loadJSON(ui.mapobject, true)) {
            //        //        editobject.save('replace');
            //        //    }
            //        //}
            //        alert('creationobjectgeometry');
            //        //map.closeAction();
            //    });
            //}
            //return true;

            // Запросим объекты окружения, предварительно сделав недоступным окно информации
            mapeditorTask.paneInfoObjectDisabled(true);
            if (mapeditorTask.editobjects[0].gid)
                mapeditorTask.topology.searchObjectsByAreaFrame(null, [mapeditorTask.editobjects[0].gid], 'edit', mapeditorTask.selectlayersid, true,
                    w2utils.lang("Edit the chosen object, moving contour points") + '. ' + w2utils.lang("Save") + " (Сtrl+S)");
            return true;
        },

        /**
         * Запустить процесс редактирования объекта
         * @method processEdition
         * @param extend {Boolean}  Флаг использования расширеннного режима
         * чтобы не делать запрос на сохранение при промежуточных операциях 
         * @param method (String) -  css метода редактирования, который нужно установить
        */
        // ===============================================================
        processEdition: function (extend, method) {

            var mapeditorTask = this.mapeditorTask;
            mapeditorTask.extend = extend;
            mapeditorTask.drawobject.drw_centerpoints = true;
            mapeditorTask.addmenu();

            var actionTask = new GWTK.MapeditorEditingAction(this, 'edit', mapeditorTask);
            if (!actionTask.error) {
                if (mapeditorTask.setAction(actionTask)) {
                    actionTask.changemethod(method);
                    return;
                }
            }
            actionTask.close();
        }

    };


    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // Задача Перемещение объекта карты   
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    // Задача Перемещение объекта карты   
    GWTK.mapeditorMovingTask = function (id, map, params) {
        // Переменные класса
        this.toolname = 'mapeditorMovingTask';
        if (!map) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        GWTK.mapeditorMovingTask.prototype.__proto__ = GWTK.MapTask.prototype;
        GWTK.MapTask.call(this, map);    // родительский конструктор     

        if (!params || !params.context || params.context instanceof GWTK.mapeditorTask === false)
            return;

        this.params = params;
        this.mapeditorTask = params.context;
        this.drawobject = params.context.drawobject;
        if (!this.drawobject) return;
        // Запросим объекты окружения, если их нет
        this.topology = params.context.topology;
        if (!this.topology) return;
        this.bt_selector = this.params.bt_selector;
        this.selectobject = this.params.selectobject;

        this.map = map;                           // объект карты
        this.id = (id) ? id : Math.random();      // уникальный идентификатор объекта

        // Замыкание контекста 
        this.bind();

        this.error = false;
    };

    GWTK.mapeditorMovingTask.prototype = {

        /**
            * Инициализация параметров класса
            * @method initparam
            */
        // ===============================================================
        set: function (param) {
            var mapeditorTask = this.mapeditorTask;
            mapeditorTask.history.clear();
            if (this.selectobject) {
                // Если подлежит редактированию
                if (mapeditorTask.canEditObject(this.selectobject))
                    this.setobject(this.selectobject);
            }
            else {
                if (!mapeditorTask.isGroup('move')) {
                    //this.map.handlers.clearselect_button_click();
                    this.clickEditing();
                }
            }

        },

        // Разрушение задачи
        destroy: function () {
            $(this.map.eventPane).off('featurelistclick', this.onFeatureListClick);
            // Удалим события
            if (this.mapeditorTask)
                this.mapeditorTask.clear();
        },

        /**
        * Замыкание контекста 
        * @method bind
        */
        // ===============================================================
        bind: function () {
            this.onFeatureListClick = GWTK.Util.bind(this.onFeatureListClick, this);
            this.setobject = GWTK.Util.bind(this.setobject, this);
        },

        // Сбросить кнопки метода создания
        clearMethod: function () {
            var action = this.map.taskManager._action;
            if (action) {
                if (action instanceof GWTK.MapeditorEditingAction)
                    action.clearMethod();
                if (action.task instanceof GWTK.MapeditorCreatingTask)
                    action.task.clearMethod();
            }
        },

        /**
            * Нажатие на кнопку редактирования
            * @method clickCreating
            */
        // ===============================================================
        clickEditing: function () {
            this.mapeditorTask.selectObject(this.onFeatureListClick);
        },


        /**
            * Событие на выбор объекта в списке выделенных объектов
            * @method  onFeatureListClick
            * @param ui {Object} Событие
            */
        // ===============================================================
        onFeatureListClick: function (ui) {
            $(this.map.eventPane).off('featurelistclick', this.onFeatureListClick);
            if (!ui.layer || !ui.gid)
                return false;
            // Если не подлежит редактированию
            var editobject = this.mapeditorTask.canEditSelectObject(ui.layer, ui.gid, this.map.objectManager.selectedFeatures);
            if (editobject) {
                // Добавим в список объектов
                this.mapeditorTask.drawSelectFeatures.clear();
                this.mapeditorTask.drawSelectFeatures.add(editobject);
                this.setobject(this.mapeditorTask.drawSelectFeatures.mapobjects[this.mapeditorTask.drawSelectFeatures.mapobjects.length-1]);
            }
            else {
                this.clickEditing();
                return;
            }

            // Если есть координаты точки, то запросить список объектов в точке
            if (ui.pointevent) {
                // Заполнить список объектов в точке
                this.mapeditorTask.setObjectsIntoPoint(ui.pointevent, ui.gid, this.setobject);
            }

        },

        /**
        * Установка объекта для редактирования
        * @method setobject
        * @param selectobject {Object} GWTK.mapobject 
        */
        // ===============================================================
        setobject: function (selectobject) {
            if (!selectobject) return;

            var mapeditorTask = this.mapeditorTask;
            if (!mapeditorTask) return;

            if (!selectobject.geometry || selectobject.geometry.count() <= 0) {
                // Попробуем найти
                var sobject = this.map.objectManager.selectedFeatures.findobjectsById(selectobject.maplayerid, selectobject.gid);
                if (!sobject || !sobject.geometry || sobject.geometry.count() <= 0) {
                    w2alert(w2utils.lang('An object is no metric information'));
                    return;
                }
                var find = mapeditorTask.drawSelectFeatures.mapobjects.find(
                    function (element, index, array) {
                        if (element.gid == sobject.gid) {
                            mapeditorTask.drawSelectFeatures.mapobjects.splice(index, 1, sobject.clone());
                            return selectobject = mapeditorTask.drawSelectFeatures.mapobjects[index];
                        }
                    });

                if (!find) {
                    w2alert(w2utils.lang('An object is no metric information'));
                    return;
                }
            }

            // Клон объекта на редактирование
            mapeditorTask.editobjects[0] = selectobject.clone();

            mapeditorTask.ischange(false);

            // запустим процесс редактирования
            mapeditorTask.isGroupProcess = false;
            this.processEdition();

            mapeditorTask.addmenu();

            return true;
        },

        /**
            * Запустить процесс редактирования объекта
            * @method processEdition
            * чтобы не делать запрос на сохранение при промежуточных операциях 
            */
        // ===============================================================
        processEdition: function () {
            this.mapeditorTask.closeAction();

            if (this.mapeditorTask.isGroupProcess) {
                this.mapeditorTask.drawSelectFeatures.updateLink(this.mapeditorTask.editobjects);
            }

            // Создадим панель для рисования
            this.mapeditorTask.createdrawpanel();

            // отрисуем габариты
            this.topology.searchObjectsByAreaFrame(null, null, 'edit', [], true);

            var _that = this;
            this.action = new GWTK.MapeditorMovingAction(this, 'moving', {
                'context': this.mapeditorTask, 'fn_complete': function () {
                    _that.topology.searchObjectsByAreaFrame(null, null, 'edit', [], true);
                    _that.action.clear();
                    _that.action.set();
                }
            });

            if (!this.map.setAction(this.action))
                return;
        }

    };


    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // Задача Сшивка объектов карты   
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    // Задача Перемещение объекта карты   
    GWTK.mapeditorMergingTask = function (id, map, params) {
        // Переменные класса
        this.toolname = 'mapeditorMovingTask';
        if (!map) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        GWTK.mapeditorMergingTask.prototype.__proto__ = GWTK.MapTask.prototype;
        GWTK.MapTask.call(this, map);    // родительский конструктор     

        if (!params || !params.context || params.context instanceof GWTK.mapeditorTask === false)
            return;

        this.params = params;
        this.mapeditorTask = params.context;
        this.drawobject = params.context.drawobject;
        if (!this.drawobject) return;
        // Запросим объекты окружения, если их нет
        this.topology = params.context.topology;
        if (!this.topology) return;
        this.bt_selector = this.params.bt_selector;
        this.selectobjectOne = (this.params.selectobjectOne) ? this.params.selectobjectOne.clone() : null;
        this.selectobjectTwo = (this.params.selectobjectTwo) ? this.params.selectobjectTwo.clone() : null;
        this.message = '';

        this.map = map;                           // объект карты
        this.id = (id) ? id : Math.random();      // уникальный идентификатор объекта

        // Замыкание контекста 
        this.bind();

        this.error = false;
    };

    GWTK.mapeditorMergingTask.prototype = {

        /**
            * Инициализация параметров класса
            * @method initparam
            */
        // ===============================================================
        set: function (param) {
            var mapeditorTask = this.mapeditorTask;
            if (!mapeditorTask)
                return;

            // Очистим историю
            mapeditorTask.history.clear();

            // Сброс выделения, если нет объекта на входе
            if (!this.selectobjectOne && !this.selectobjectTwo)
                this.map.handlers.clearselect_button_click();

            // Обновим слои для редактирования
            mapeditorTask.setlayers(mapeditorTask.maplayerid);
            if (!mapeditorTask.layer) return;

            // Если на входе объекты для сшивки, то ничего не выбираем и если они подлежат редактированию, сразу запускаем сшивку
            this.mapeditorTask.drawSelectFeatures.clear();
            if (this.selectobjectOne && this.selectobjectTwo && 
                mapeditorTask.canEditObject(this.selectobjectOne) && mapeditorTask.canEditObject(this.selectobjectTwo)) {
                this.mapeditorTask.drawSelectFeatures.add(this.selectobjectOne);
                this.mapeditorTask.drawSelectFeatures.add(selectobjectOne);
                // Если подлежит редактированию
                this.setMerge();
            }
            else {
                if (!this.action) {
                    this.message = w2utils.lang('Select source object');
                    this.selectObject(this.mapeditorTask.setselectlayers);
                }
            }
            return true;

        },

        // Разрушение задачи
        destroy: function () {
            this.mapeditorTask.closeAction();
            $(this.map.eventPane).off('featurelistclick', this.onFeatureListClick);
            // Удалим события
            if (this.mapeditorTask)
                this.mapeditorTask.clear();
        },

        /**
        * Замыкание контекста 
        * @method bind
        */
        // ===============================================================
        bind: function () {
            this.onFeatureListClick = GWTK.Util.bind(this.onFeatureListClick, this);
            this.setselectlayers = GWTK.Util.bind(this.setselectlayers, this);
            this.onDataLoaded = GWTK.Util.bind(this.onDataLoaded, this);
        },

        // назначить слои для выделения
        setselectlayers: function () {
            if (!this.selectobjectOne)
                return this.mapeditorTask.setselectlayers(this.noGraphic);
            else
                return [this.selectobjectOne.maplayerid];
        },

        /**
        * Нажатие на кнопку редактирования
        * @method clickCreating
        */
        // ===============================================================
        selectObject: function () {
            var actionTask, selectParams;
            this.noGraphic = true;
            if (!this.mapeditorTask.options.objectselectionInPoint) {
                    selectParams = {
                        fn_setselectlayers: this.setselectlayers,
                        message: this.message,
                        objlocal: [0, 1, 4],
                        layerscodelist: []
                    };
                    if (this.selectobjectOne) 
                        selectParams.layerscodelist.push({ layerid: this.selectobjectOne.maplayerid, codelist: [this.selectobjectOne.code] });
                    actionTask = new GWTK.SelectMapObjectActionHover(this, selectParams);
                }
            else {
                 selectParams = {
                    show: false,
                    sequence: true,
                    objlocal: [],
                    layerscodelist: [],
                    fn_setselectlayers: this.setselectlayers,
                    fn_isCorrectObject: GWTK.Util.bind(this.mapeditorTask.iseditinglayer_object, this.mapeditorTask),
                    message: this.message
                 };
                if (this.selectobjectOne) {
                    selectParams.objlocal.push(GWTK.classifier.prototype.getlocalByName(this.selectobjectOne.spatialposition));
                    //selectParams.codelist.push(this.selectobjectOne.code);
                    selectParams.layerscodelist.push({ layerid: this.selectobjectOne.maplayerid, codelist: [this.selectobjectOne.code] });
                }
                else {
                    selectParams.objlocal = [0, 1, 4];
                }

                actionTask = new GWTK.SelectMapObjectAction(this, this.map, selectParams);
            }

            if (!actionTask.error) {
                if (this.mapeditorTask.setAction(actionTask)) {
                    $(this.map.eventPane).one('featurelistclick', this.onFeatureListClick);
                    return true;
                }
            }

            actionTask.close();
        },


        /**
            * Событие на выбор объекта в списке выделенных объектов
            * @method  onFeatureListClick
            * @param ui {Object} Событие
            */
        // ===============================================================
        onFeatureListClick: function (ui) {
            $(this.map.eventPane).off('featurelistclick', this.onFeatureListClick);
            if (!ui.layer || !ui.gid)
                return false;
            // Если не подлежит редактированию
            var editobject = this.mapeditorTask.canEditSelectObject(ui.layer, ui.gid, this.map.objectManager.selectedFeatures);
            if (editobject) {
                // Добавим в список объектов
                this.mapeditorTask.drawSelectFeatures.add(editobject);
                this.mapeditorTask.drawSelectFeatures.drawSelectedObjects(true, null, true);

                if (!this.selectobjectOne)
                    this.selectobjectOne = this.mapeditorTask.drawSelectFeatures.mapobjects[0];
                else 
                    this.selectobjectTwo = this.mapeditorTask.drawSelectFeatures.mapobjects[1];

                if (this.selectobjectOne && !this.selectobjectTwo) {
                    this.message = w2utils.lang('Select editing object');
                    // определить слой
                    this.selectObject();
                }
                else {
                    this.setMerge();
                }
            }
            else {
                this.selectObject();
                return;
            }

        },

        /**
        * Установка объекта для редактирования
        * @method setMerge
        * @param selectobject {Object} GWTK.mapobject 
        */
        // ===============================================================
        setMerge: function () {
            var layer = this.map.tiles.getLayerByxId(this.selectobjectTwo.maplayerid);
            if (layer) {
                var index = layer.options.url.indexOf("?");
                if (index !== -1) {
                    this.queryEdit = new EditQueries(layer.options.url.slice(0, index), this.map);
                    this.queryEdit.onDataLoad = this.onDataLoaded;
                    this.queryEdit.sendRequest({
                        "RESTMETHOD": "UNION",
                        "Layer": this.selectobjectTwo.wmtsId,
                        "idlist": this.selectobjectOne.gid.replace(".", ":") + ',' + this.selectobjectTwo.gid.replace(".", ":"),
                        "OUTTYPE": "JSON"
                        , "Precision": (this.mapeditorTask.options.topology.limit).toString()
                    }, false);
                    return;
                }
            }

            // Запустить новую сшивку
            this.repeat();
        },

        // обработчик ответа сервера
        onDataLoaded: function (response) {
            if (!response) return;
            response = response.replace(/\r|\n/g, '');  // удалить перенос строки, перенос каретки

            if (response.indexOf('ExceptionReport') !== -1) {
                console.log(response);
                alert(w2utils.lang('Can not merging selected objects!'));

                // Запустить новую сшивку
                this.repeat();
                return;
            }
            try {
                var obj = JSON.parse(response);

                // Разобрать json
                if (obj.features && obj.features.length > 0) {
                    // Обновить у второго объекта метрику
                    this.selectobjectTwo.geometry.copyFromGeometryJSON(obj.features[0].geometry);

                    // Слить семантику из первого
                    this.selectobjectTwo.semantic.merge(this.selectobjectOne.semantic);
                    this.selectobjectTwo.setSaveRegime('replace');

                    // Сохранить второй объект с одновременным удалением первого
                    var obj = this.selectobjectOne.clone();
                    if (obj) {
                        obj.setSaveRegime('delete');
                        this.selectobjectTwo.save('replace', null, [this.selectobjectTwo.clone(), obj]);
                    }

                    // Перерисовать карту
                    this.map.overlayRefresh();
                }

            }
            catch (err) {
                if (window.console) console.log(err);
            };

            // Запустить новую сшивку
            this.repeat();

        },

        // Повторить операцию
        repeat: function () {
            this.mapeditorTask.drawSelectFeatures.clear();
            this.selectobjectOne = null;
            this.selectobjectTwo = null;
            this.message = w2utils.lang('Select source object');
            this.selectObject();
        }


    };


}


