/************************************* Соколова  ***** 29/11/18 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2018              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Редактор объектов карты                     *
 *                           Обработчики                            *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {


    /*******************************************************************
     *                                                                  *
     *                      Редактор объектов карты                     *
     *               Обработчик перемещения объекта карты               *
     *                                                                  *
     *******************************************************************/
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // Обработчик перемещения объекта карты   
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    GWTK.MapeditorMovingAction = function (task, name, params) {
        this.error = true;
        if (!params || !params.context || params.context instanceof GWTK.mapeditorTask === false)
            return;
        GWTK.MapAction.call(this, task, name);           // родительский конструктор     

        // Не отображать объекты карты в диалоге выбора объектов
        this.showInfoOfSelectedObjects = false;

        this.params = params;
        this.mapeditorTask = params.context;
        this.drawobject = params.context.drawobject;
        if (!this.drawobject) return;
        this.drawpanel = params.context.drawpanel;
        if (!this.drawpanel) return;
        // Запросим объекты окружения, если их нет
        this.topology = params.context.topology;
        if (!this.topology) return;

        if (params.fn_complete && typeof params.fn_complete === "function") {
            this.complete = params.fn_complete;
        }

        // класс расчета смещений передвижения мыши
        this.movedrag = new GWTK.MapDragData();
        // инициализация
        this.movedrag.init = function () {
            this.x = 0;
            this.y = 0;
            this.x_prev = 0;
            this.y_prev = 0;
            this.dx = 0;
            this.dy = 0;
            this.drag = false;
            this.dragstart = false;
            this.point_.x = 0;
            this.point_.y = 0;
            this.rotate = false;
            this.angle = 0;
            this.center = GWTK.point(0, 0);
        };

        // Замыкание контекста 
        this.bind();

        this.init();

        this.error = false;
    };

    GWTK.MapeditorMovingAction.prototype = {

        /**
         * Замыкание контекста
         * @method bind
         */
        // ===============================================================
        bind: function () {
            this.onMouseDown = GWTK.Util.bind(this.onMouseDown, this);
            this.onMouseUp = GWTK.Util.bind(this.onMouseUp, this);
            this.onMouseMove = GWTK.Util.bind(this.onMouseMove, this);
        },

        /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
         * @method set
         * @param options {Object} параметры обработчика
         */
        // ===============================================================
        set: function (options) {
            var map = this.getMap();
            if (!map) return;

            // функция для перерисовки объекта
            this.fn_drawcustom = this.topology.getFunctions().fn_drawcustom;
            this.topology.setFunctions({"fn_drawcustom": GWTK.Util.bind(this.draw, this)})

            // функция перемещения точки
            if (this.drawobject) {
                this.fn_draggable = this.drawobject.getFunctions().fn_draggable;
                this.drawobject.setFunctions({"fn_draggable": GWTK.Util.bind(this.do_processmethod, this)});
            }

            // Стереть объекты топологии, чтоб их не таскать вместе с объектом
            this.topology.clearChildrensSvgid();

            // Отрисовать текущий объект
            this.draw();

            this.movedrag.init();
            this.drawpanel.style.cursor = 'move';
            this.drawobject.zIndexDrawPanel('up', this.drawpanel);

            // Назначим события нажатия мыши
            map.on({type: 'mousedown', target: "map", phase: 'before', sender: this}, this.onMouseDown);
            map.on({type: 'mouseup', target: "map", phase: 'before', sender: this}, this.onMouseUp);

            this.mapeditorTask.setStatusBar(w2utils.lang("Press and move, retaining clicked a mouse button"));

        },

        /**
         * Сбросить настройки (отключение обработчиков событий, инициализация флажков и др.)
         * @method clear
         */
        // ===============================================================
        clear: function () {
            this.mapeditorTask.zIndexRestore();
            this.mapeditorTask.clearStatusBar();

            var map = this.getMap();
            if (!map) return;

            // Назначим события нажатия мыши
            map.off({type: 'mousedown', target: "map", phase: 'before', sender: this}, this.onMouseDown);
            map.off({type: 'mouseup', target: "map", phase: 'before', sender: this}, this.onMouseUp);

            // Возврат функций
            // функция перемещения точки
            if (this.fn_draggable) {
                this.drawobject.setFunctions({"fn_draggable": this.fn_draggable});
            }
            // функция для перерисовки объекта
            if (this.fn_drawcustom)
                this.topology.setFunctions({"fn_drawcustom": this.fn_drawcustom});

            this.drawpanel.style.cursor = 'default';
        },


        /**
         * Проверка возможность завершения
         * @method canClose
         * @return {Boolean} true - можно завершить, false - нет
         */
        canClose: function () {

            // Если флажок не сброшен в задаче принудительно, 
            // то выполнить операции по сохранению данных
            if (!this.canCancel) {
                this.canCancel = this.mapeditorTask.canClose();
            }

            return this.canCancel;
        },

        // Функция отрисовки перемещаемого объекта 
        draw: function () {
            this.mapeditorTask.draw(this.topology.svgDraw, false, false, false, true);
        },

        /**
         * Событие при нажатии мыши в режиме перемещения объекта
         * @method  onMouseDown
         * @param event {Object} Событие
         */
        // ==============================================s=================
        onMouseDown: function (event) {
            var map = this.getMap();
            if (!map) return;

            var e = event.originalEvent;
            if (!e) return;
            if (e.target && (e.target.nodeName != 'svg' && e.target.id != 'topology_canvas'))
                return true;

            // Запомним положение точки
            this.movedrag.setOffsetPoint(GWTK.point(e.clientX, e.clientY));
            // Событие на перемещение мыши
            map.on({type: 'mousemove', target: "map", phase: 'before', sender: this}, this.onMouseMove);

            event.stopPropagation();
            return false;

        },

        /**
         * Событие перемещения мыши в режиме перемещения объекта
         * @method  onMouseMove
         * @param event {Object} Событие
         */
        // ===============================================================
        onMouseMove: function (event) {
            var map = this.getMap();
            if (!map || !event) return;

            var e = event.originalEvent;
            if (!e) return;

            // отобразить координаты мыши
            e.map = map;
            GWTK.DomEvent.getMouseGeoCoordinates(e);

            e.map.tiles._onMouseDown();
            var rect = map.mapPane.getBoundingClientRect();
            // Если за пределами окна карты, то надо двигать карту
            var offset = 10, dx = 0, dy = 0;
            if (e.clientX <= rect.left + offset || e.clientY <= rect.top + offset ||
                e.clientX >= rect.right - offset || e.clientY >= rect.bottom - offset) {
                this.drawpanel.style.cursor = 'default';
                if (e.clientX <= rect.left + offset)
                    dx = -offset;
                if (e.clientY <= rect.top + offset)
                    dy = -offset;
                if (e.clientX >= rect.right - offset)
                    dx = offset;
                if (e.clientY >= rect.bottom - offset)
                    dy = offset;

                this.movedrag.dx = dx;
                this.movedrag.dy = dy;
                this.movedrag.x += dx;
                this.movedrag.y += dy;
                this.drawpanel.style.left = this.movedrag.x + 'px';
                this.drawpanel.style.top = this.movedrag.y + 'px';
                map.move(-(this.movedrag.dx), -(this.movedrag.dy));

                // Обновить отображение Wms слоев
                this.wmsDrawing();
            }
            else {
                this.movedrag.setOffset(e);
                this.drawpanel.style.left = this.movedrag.x + 'px';
                this.drawpanel.style.top = this.movedrag.y + 'px';
                this.drawpanel.style.cursor = 'move';
            }

            event.stopPropagation();
            return false;
        },

        /**
         * Событие отпускания мыши в режиме перемещения объекта
         * @method  onMouseUp
         * @param event {Object} Событие
         */
        // ===============================================================
        onMouseUp: function (event) {
            var map = this.getMap();
            if (!map) return;
            map.off({type: 'mousemove', target: "map", phase: 'before', sender: this}, this.onMouseMove);

            var e = event.originalEvent;
            if (!e) return;

            this.drawpanel.style.cursor = 'default';
            this.mapeditorTask.offsetpoints(this.movedrag.x, this.movedrag.y, true);

            event.stopPropagation();

            // Завершить процесс перемещения
            this.complete();
            return false;
        },


        /**
         * Завершить процесс создания метрики объекта
         * @method complete
         */
        // ===============================================================
        complete: function () {

            // Отжать кнопку
            var selectorbutton = this.params.selectorbutton ? this.params.selectorbutton : '.ededmethod_moveobject';
            $(selectorbutton).click();

            // Запустить процесс продолжения редактирования
            this.task.processEdition();
            this.mapeditorTask.searchObjectsByAreaFrame(null, 'edit');

        },

        /**
         * Обновиление отображения Wms слоев при сдвиге мыши за пределы окна
         * @method wmsDrawing
         */
        // ===============================================================
        wmsDrawing: function () {
            var map = this.getMap();
            if (!map) return;
            var coord = map.tiles.getLayersCenterProjected();
            if (coord != null) {
                map.setMapCenter(coord);
                map.tiles.wmsManager.wmsDrawing();
            }
        },

        /**
         * Действия в процессe перемещения точки
         * @method do_processmethod
         * @param process {String} Наименование процесса "start", "drag", "stop"
         * @param target {Object} объект события по перемещению
         * @param ui {Object} Объект, содержащий смещение точки
         */
        // ===============================================================
        do_processmethod: function (process, target, ui) {
            if (!this.drawobject || !this.drawpanel) return;
            // Смещение на центр
            var _that = this, newpos,
                offset = (target) ? this.drawobject.offsetCenter(target.id) : null;

            switch (process) {
                case 'start':
                    // Oтключить события карты в топологии
                    this.topology.map_events('off');
                    break;
                case 'stop':
                    // Если было вращение
                    if (this.drawobject.drag.rotate) {
                        // Нарисовать объект 
                        this.mapeditorTask.ischange(true);
                        this.updatedrawcontur(this.name);
                    }

                    // Если было масштабирование
                    if (this.drawobject.drag.scale >= 0) {
                        // Нарисовать объект 
                        this.mapeditorTask.ischange(true);
                        this.updatedrawcontur(this.name);
                    }
                    // OВключить события карты в топологии
                    this.topology.map_events('on');
                    break;
            }

            return true;

        },

        /**
         * Обновить изображение редактируемого объекта
         * @method updatedrawcontur
         * @param nometrics {Boolean} - если true -
         * то не обновляется содержимое окна ввода координат с клавиатуры
         */
        // ===============================================================
        updatedrawcontur: function (subaction) {
            this.mapeditorTask.updatedrawcontur(null, subaction);
        }


    };
    GWTK.Util.inherits(GWTK.MapeditorMovingAction, GWTK.MapAction);


    /*******************************************************************
     *                                                                  *
     *                      Редактор объектов карты                     *
     *               Обработчик удаления объекта карты                  *
     *                                                                  *
     *******************************************************************/
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // Обработчик перемещения объекта карты   
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    GWTK.MapeditorDeletingActionHover = function (task, name, fn_setselectlayers) {

        this.error = true;
        if (!task || task instanceof GWTK.mapeditorTask == false)
            return;
        //this.name = name;
        this.canSelectObject = true;

        GWTK.SelectMapObjectActionHover.call(this, task, {                                // родительский конструктор 
            fn_setselectlayers: fn_setselectlayers
        });
        this.name = name;

        // Не отображать объекты карты в диалоге выбора объектов
        this.showInfoOfSelectedObjects = false;

        this.selectedFeatures = new GWTK.selectedFeatures(this.map);

        //this.bind();

        this.error = false;

        // Наследуемые функции
        if (this.$super) {
            this.$super.init.call(this, null, true);
            this.$super.set.call(this, null, null, true);
            this.$super.clear.call(this, null, true);
            this.$super.bind.call(this, null);
        }

    };

    GWTK.MapeditorDeletingActionHover.prototype = {

        /**
         * Инициализация класса
         * @method init
         */
        // ===============================================================
        init: function (base, nocall) {
            if (nocall) return;
            this.$super.init(this);
        },

        /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
         * @method set
         * @param options {Object} параметры обработчика
         */
        // ===============================================================
        set: function (options, base, nocall) {
            if (nocall) return;
            this.$super.set(options, this);
            if (!base) base = this;
            $(base.map.eventPane).one('featurelistclick', base.onFeatureListClick);
        },

        /**
         * Очистить компонент (удалить изображение, отключить события)
         * @method clear
         */
        // ===============================================================
        clear: function (nobutton, base, nocall) {
            if (nocall) return;
            if (!base) base = this;

            $(base.map.eventPane).off('featurelistclick', base.onFeatureListClick);
            this.$super.clear(this);
            // Отожмем кнопку
            if (!nobutton)
                GWTK.DomUtil.removeActiveElement('#' + base.task.button_ids['delete']);
            // Сброс стандартного selectedFeatures
            base.selectedFeatures.clear();
        },

        /**
         * Замыкание контекста
         * @method bind
         */
        // ===============================================================
        bind: function () {
            this.onFeatureListClick = GWTK.Util.bind(this.onFeatureListClick, this);
            this.deleteobject = GWTK.Util.bind(this.deleteobject, this);
        },

        /**
         * Событие на выбор объекта в списке выделенных объектов
         * @method  onFeatureListClick
         * @param ui {Object} Событие
         */
        // ===============================================================
        onFeatureListClick: function (ui) {
            if (!ui.layer || !ui.gid || !ui.layer)
                return false;

            var editobject = this.task.canEditSelectObject(ui.layer, ui.gid, this.selectedFeatures);

            // Добавим в список объектов
            this.task.drawSelectFeatures.clear();
            this.task.drawSelectFeatures.add(editobject);

            this.deleteobject(editobject);

            // Если есть координаты точки, то запросить список объектов в точке
            if (ui.pointevent) {
                // Заполнить список объектов в точке
                this.task.setObjectsIntoPoint(ui.pointevent, ui.gid, this.deleteobject);
            }

        },

        /**
         * Удаление объекта
         * @param layerid {String} Идентификатор слоя карты
         * @param gid {String} Идентификатор объекта слоя
         */
        // ===============================================================
        deleteobject: function (selectobject) {

            if (selectobject) {

                var mapeditorTask = this.task;
                if (!mapeditorTask) return;

                // Данные могли не успеть подчитаться
                if (!selectobject.geometry || selectobject.geometry.count() <= 0) {
                    // Попробуем найти
                    var sobject = this.map.objectManager.selectedFeatures.findobjectsById(selectobject.maplayerid, selectobject.gid);
                    if (!sobject) return;
                    var find = mapeditorTask.drawSelectFeatures.mapobjects.find(
                        function (element, index, array) {
                            if (element.gid == sobject.gid) {
                                mapeditorTask.drawSelectFeatures.mapobjects.splice(index, 1, sobject.clone());
                                return selectobject = mapeditorTask.drawSelectFeatures.mapobjects[index];
                            }
                        });

                    if (!find) {
                        return;
                    }
                    mapeditorTask.drawSelectFeatures.add(find);
                }

                // Клон объекта на редактирование
                this.task.editobjects[0] = selectobject.clone();

                // Сделаем клон объекта для сохранения (в клоне отрисовывается)
                this.task.setCloneForSave();

                var _that = this, gid = selectobject.gid;
                if (selectobject) {
                    this.task.editobjects[0] = selectobject.clone();
                    w2confirm(this.task.layer.alias + '. ' + selectobject.name + '<p>' + this.task.res_mapEditor_confirm_deleteobject + '</p>', w2utils.lang("Map editor"), function (answer) {
                        if (answer == 'Yes') {
                            _that.task.save('delete');
                            // Удалить элемент из списка и перестроить список
                            var find = _that.task.drawSelectFeatures.mapobjects.find(
                                function (element, index, array) {
                                    if (element.gid == gid) {
                                        _that.task.drawSelectFeatures.mapobjects.splice(index, 1);
                                        return true;
                                    }
                                });
                            if (find) {
                                _that.task.initObjectsInPoint(gid, _that.task.objectlistId, _that.deleteobject);
                            }
                        }
                        else {
                            if (_that.task && _that.task.drawSelectFeatures)
                                _that.task.drawSelectFeatures.cleardrawobject(_that.task.editobjects[0].gid, true);
                        }
                        setTimeout((function (a1, a2) {
                            _that.clear(true);
                            _that.set();
                        }), 500);
                    });
                }
            }
            else {
                this.clear(true);
                this.set();
            }
        }
    };
    GWTK.Util.inherits(GWTK.MapeditorDeletingActionHover, GWTK.SelectMapObjectActionHover);


    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // Обработчик перемещения объекта карты    GWTK.MapeditorDeletingAction
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    GWTK.MapeditorDeletingAction = function (task, name, fn_setselectlayers) {

        this.error = true;
        if (!task || task instanceof GWTK.mapeditorTask == false)
            return;
        this.canSelectObject = true;

        GWTK.SelectMapObjectAction.call(this, task, this.map, {
            show: false,
            sequence: true,
            fn_setselectlayers: fn_setselectlayers,
            fn_isCorrectObject: GWTK.Util.bind(task.iseditinglayer_object, task)
        });
        this.name = name;
        this.error = false;

        // Наследуемые функции
        if (this.$super) {
            this.$super.init.call(this, null, true);
            this.$super.set.call(this, null, null, true);
            this.$super.clear.call(this, null, true);
        }
        this.bind();

    };

    GWTK.MapeditorDeletingAction.prototype = {

        /**
         * Инициализация класса
         * @method init
         */
        // ===============================================================
        init: function (base, nocall) {
            if (nocall) return;
            this.$super.init(this);
        },

        /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
         * @method set
         * @param options {Object} параметры обработчика
         */
        // ===============================================================
        set: function (options, base, nocall) {
            if (nocall) return;
            this.$super.set(options, this);
            if (!base) base = this;
            $(base.map.eventPane).one('featurelistclick', this.onFeatureListClick);
        },

        /**
         * Очистить компонент (удалить изображение, отключить события)
         * @method clear
         */
        // ===============================================================
        clear: function (nobutton, base, nocall) {
            if (nocall) return;
            if (!base) base = this;

            $(base.map.eventPane).off('featurelistclick', this.onFeatureListClick);
            this.$super.clear(this);
            // Отожмем кнопку
            if (!nobutton)
                GWTK.DomUtil.removeActiveElement('#' + base.task.button_ids['delete']);
            // Сброс стандартного selectedFeatures
            //base.selectedFeatures.clear();
        },

        /**
         * Замыкание контекста
         * @method bind
         */
        // ===============================================================
        bind: function () {
            this.onFeatureListClick = GWTK.Util.bind(this.onFeatureListClick, this);
            this.deleteobject = GWTK.Util.bind(this.deleteobject, this);
        },

        /**
         * Событие на выбор объекта в списке выделенных объектов
         * @method  onFeatureListClick
         * @param ui {Object} Событие
         */
        // ===============================================================
        onFeatureListClick: function (ui) {
            if (!ui.layer || !ui.gid || !ui.layer)
                return false;

            var editobject = this.task.canEditSelectObject(ui.layer, ui.gid, this.map.objectManager.selectedFeatures);

            // Добавим в список объектов
            this.task.drawSelectFeatures.clear();
            this.task.drawSelectFeatures.add(editobject);

            this.deleteobject(editobject);

        },

        /**
         * Удаление объекта
         * @param layerid {String} Идентификатор слоя карты
         * @param gid {String} Идентификатор объекта слоя
         */
        // ===============================================================
        deleteobject: function (selectobject) {

            if (selectobject) {

                var mapeditorTask = this.task;
                if (!mapeditorTask) return;

                // Данные могли не успеть подчитаться
                if (!selectobject.geometry || selectobject.geometry.count() <= 0) {
                    // Попробуем найти
                    var sobject = this.map.objectManager.selectedFeatures.findobjectsById(selectobject.maplayerid, selectobject.gid);
                    if (!sobject) return;
                    var find = mapeditorTask.drawSelectFeatures.mapobjects.find(
                        function (element, index, array) {
                            if (element.gid == sobject.gid) {
                                mapeditorTask.drawSelectFeatures.mapobjects.splice(index, 1, sobject.clone());
                                return selectobject = mapeditorTask.drawSelectFeatures.mapobjects[index];
                            }
                        });

                    if (!find) {
                        return;
                    }
                    mapeditorTask.drawSelectFeatures.add(find);
                }

                // Клон объекта на редактирование
                this.task.editobjects[0] = selectobject.clone();

                // Сделаем клон объекта для сохранения (в клоне отрисовывается)
                this.task.setCloneForSave();

                var _that = this, gid = selectobject.gid;
                if (selectobject) {
                    this.task.editobjects[0] = selectobject.clone();
                    w2confirm(this.task.layer.alias + '. ' + selectobject.name + '<p>' + this.task.res_mapEditor_confirm_deleteobject + '</p>', w2utils.lang("Map editor"), function (answer) {
                        if (answer == 'Yes') {
                            _that.task.save('delete');
                            // Удалить элемент из списка и перестроить список
                            var find = _that.task.drawSelectFeatures.mapobjects.find(
                                function (element, index, array) {
                                    if (element.gid == gid) {
                                        _that.task.drawSelectFeatures.mapobjects.splice(index, 1);
                                        return true;
                                    }
                                });
                            if (find) {
                                _that.task.initObjectsInPoint(gid, _that.task.objectlistId, _that.deleteobject);
                            }
                        }
                        else {
                            if (_that.task && _that.task.drawSelectFeatures)
                                _that.task.drawSelectFeatures.cleardrawobject(_that.task.editobjects[0].gid, true);
                        }
                        setTimeout((function (a1, a2) {
                            _that.clear(true);
                            _that.set();
                        }), 500);
                    });
                }
            }
            else {
                this.clear(true);
                this.set();
            }
        }
    };
    GWTK.Util.inherits(GWTK.MapeditorDeletingAction, GWTK.SelectMapObjectAction);


    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // Обработчик Редактирования объекта 
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    GWTK.MapeditorEditingAction = function (task, name, context) {
        this.error = true;
        if (!context || context instanceof GWTK.mapeditorTask == false)
            return;
        GWTK.MapAction.call(this, task, name);           // родительский конструктор     

        // Не отображать объекты карты в диалоге выбора объектов
        this.showInfoOfSelectedObjects = false;

        this.mapeditorTask = context;
        this.map = task.map;

        if (!this.mapeditorTask.editobjects || !this.mapeditorTask.editobjects[0])
            return;
        this.editobject = context.editobjects[0];

        this.drawobject = context.drawobject;
        if (!this.drawobject) return;
        this.drawpanel = context.drawpanel;
        if (!this.drawpanel) return;

        // Запросим объекты окружения, если их нет
        this.topology = context.topology;
        if (!this.topology) return;

        // Статус бар
        this.setStatusBar = this.mapeditorTask.setStatusBar;
        this.clearStatusBar = this.mapeditorTask.clearStatusBar;

        // Замыкание контекста 
        this.bind();
        //this.set();
        this.error = false;

        // курсор
        this.drawpanel.style.cursor = 'default';

        // текущий обработчик
        this.currentTaskAcrionName = name;

        // Массив режимов редактирования
        this.methods = [
            'ededmethod_edallpoint',
            'ededmethod_moveobject',
            'ededmethod_closeobject',
            'ededmethod_changedir',
            'ededmethod_createsubobject',
            'ededmethod_removesubobject',
            'ededmethod_editsegment'
        ];
    };

    GWTK.MapeditorEditingAction.prototype = {

        /**
         * Замыкание контекста
         * @method bind
         */
        // ===============================================================
        bind: function () {
            this.drawobject.clearparam();

            // Навесим всплывающее меню на точки
            //this.drawobject.do_downpoint = GWTK.Util.bind(this.popupmenu, this);
            this.drawobject.addPopupmenu(GWTK.Util.bind(this.popupmenu, this));

            this.drawobject.do_draggable = GWTK.Util.bind(this.do_processmethod, this);
            this.drawobject.do_updatepoint = GWTK.Util.bind(this.mapeditorTask.updatepoint, this.mapeditorTask);

            this.onDrawmark_mouseout = GWTK.Util.bind(this.onDrawmark_mouseout, this);
            this.onDrawmark_mouseover = GWTK.Util.bind(this.onDrawmark_mouseover, this);
        },

        /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
         * @method set
         * @param options {Object} параметры обработчика
         */
        // ===============================================================
        set: function (options) {
            if (this.drawobject) {
                this.drawobject.drw_centerpoints = true;
                this.drawobject.zIndexDrawPanel('up', this.drawpanel);
            }
            this.mapeditorTask.searchObjectsByAreaFrame(null, 'edit', true);

        },

        /**
         * Сбросить настройки (отключение обработчиков событий, инициализация флажков и др.)
         * @method clear
         */
        // ===============================================================
        clear: function () {
            this.drawmark_events('off');
            this.mapeditorTask.zIndexRestore();
        },

        /**
         * Завершить процесс создания метрики объекта
         * @method complete
         */
        // ===============================================================
        complete: function () {

            if (!this.editobject)
                return;

            // если полигон, замкнуть метрикy 
            if (this.editobject.spatialposition.toLowerCase().indexOf('polygon') >= 0) {
                if (!this.mapeditorTask.closeobject(false, this.mapeditorTask.getsubjectnumber())) {
                    w2alert(w2utils.lang("Object contains less than 3 points!"));
                    return;
                }
            }

            // Занести метрику в окно с метрикой объекта
            if (this.mapeditorTask.metrics) {
                this.mapeditorTask.metrics.options.action = "edit";
                this.mapeditorTask.metrics.creategrid(this.editobject.geometry.saveJSON(true));
            }

            // Перерисовать все, что имеем
            this.getMap().overlayRefresh();

            // Сменить инструменты
            this.changemethod();

            return true;
        },

        /**
         * Смена панели инструментов
         * @method changemethod
         * @param method (String) -  css метода редактирования, который нужно установить
         */
        // ===============================================================
        changemethod: function (changemethod) {
            var el = $('#' + this.mapeditorTask.objectmethodId);
            if (el && el.length > 0) {
                el.children().remove();
                el.append(this.htmlMethod(this.editobject.spatialposition, this.mapeditorTask.graphic, this.mapeditorTask.objectmethodId));

                // триггер на смену панели инструментов
                $(this.getMap().eventPane).trigger({type: 'changedata_method', action: 'edit'});
                this.method_events(changemethod);

                this.drawmark_events('on');
            }
        },

        /**
         * Объявление событий на кнопки методов создания и редактирования
         * @method  method_events
         * @param target {Element} Элемент кнопки, которую нужно сделать активной
         */
        // ===============================================================
        method_events: function (cls) {

            $('.control-button-edit-method').off('click');

            var $target = $(cls);
            this.buttonmethod_edit = cls;

            // Активация режима
            //GWTK.mapeditorTask.prototype.checkmethod($target);
            var _that = this;
            $('.control-button-edit-method').click(function (event) {
                //                _that.clickMethod(event.currentTarget);
                _that.clickMethod(event.target);
            });
            if ($target) {
                $target.click();
            }
        },

        // Сбросить кнопки метода создания
        clearMethod: function () {
            // Закрыть обработчик, если он был запущен
            if (this.task.action) {
                if (this.map.closeAction()) {
                    this.task.action = null;
                }
            }
            if (!this.task.action) {
                GWTK.DomUtil.removeActiveElement(this.buttonmethod_edit);
                if (this.mapeditorTask.mapeditExtendMethods) {
                    this.mapeditorTask.mapeditExtendMethods.hide();
                }
                this.buttonmethod_edit = null;

                this.startEditAction();
            }
        },

        //  Старт обработчика режима редактирование
        startEditAction: function () {
            // Сбросим выделение
            this.mapeditorTask.clearSelectedFeaturesMap();

            switch (this.currentTaskAcrionName) {
                case 'edit':
                    this.task.processEdition(null, this.buttonmethod_edit);
                    break;
                case 'create':
                    this.task.processCreation();
                    break;
            }
        },

        /**
         * Формирование html cпособа создания или редактирования
         * @method htmlMethod
         * @param action {String} Тип процесса ("processCreation" или "processEdition")
         */
        // ===============================================================
        htmlMethod: function (spatialposition, graphic, objectmethodId) {

            if (graphic) // если это графика 
                html = '<td align="right"  id="' + objectmethodId + '" style=" padding-left:50px; width:100%;">';
            else
                html = '<td align="right"  id="' + objectmethodId + '" >';
            return html += this.htmlMetod_detail(spatialposition, graphic) + '</td>';
        },

        /**
         * Вставка детальной информации в html cпособа создания или редактирования
         * @method htmlMetod_detail
         * @param spatialposition {String} Локализация объекта ('point', 'title', 'vector', 'linestring', 'polygon')
         */
        // ===============================================================
        htmlMetod_detail: function (spatialposition, graphic) {

            var disabled = '', disabledtrack = '', geolocation,
                html =
                    '<div class="routeFilesName" style="text-align:center; padding-left:0px;">' + w2utils.lang("Editing mode") +
                    '</div>' +
                    '<table style="margin-top:-12px;" align="center">' +
                    '<tr align="center">' +
                    //'<td> ' +
                    //'<div class="control-button-edit-method control-button-edit ededmethod_edpoint clickable" Title="' + w2utils.lang("Editing point") + '" name="' + action + '"> </div> ' +  // редактирование точки
                    //'</td> ' +
                    '<td> ' +
                    '<div class="control-button-edit-method control-button-edit ededmethod_edallpoint clickable" Title="' + w2utils.lang("Topology") + '"> </div> ' +  // редактирование общих точек
                    '</td> ';

            // Режимы редактирования для различных локализаций
            if (!GWTK.MapEditorUtil.isEnabledItemMenu(spatialposition, graphic))
                disabled = 'disabledbutton';

            html += '<td > ' +
                '<div class="control-button-edit-method control-button-edit ededmethod_closeobject clickable ' + disabled + '" Title="' + w2utils.lang("Close object") + '"> </div> ' +  // замкнуть
                '</td> ' +
                '<td> ' +
                '<div class="control-button-edit-method control-button-edit ededmethod_changedir clickable ' + disabled + '" Title="' + w2utils.lang("Change direction") + '"> </div> ' +  // изменить направление цифрования
                '</td> ' +
                '<td> ' +
                // '<div class="control-button-edit-method control-button-edit ededmethod_deletesegment clickable ' + disabled + '" Title="' + w2utils.lang("Delete part") + '"> </div> ' +  // Удалить участок метрики
                // '</td> ' +
                '<div class="control-button-edit-method control-button-edit ededmethod_editsegment clickable ' + disabled + '" Title="' + w2utils.lang("Edit part") + '"> </div> ' +  // Редактировать участок метрики
                '</td> ' +

                '</tr>' +
                '<tr align="center">' +
                '<td> ' +
                '<div class="control-button-edit-method control-button-edit ededmethod_createsubobject clickable ' + disabled + '" Title="' + w2utils.lang("Add contour") + '"> </div> ' +  // создание подобъекта
                '</td> ' +
                '<td> ' +
                '<div class="control-button-edit-method control-button-edit ededmethod_removesubobject clickable disabledbuttonConst" Title="' + w2utils.lang("Remove contour") + '"> </div> ' +  // удаление подобъекта
                '</td> ' +
                '<td> ' +
                '<div class="control-button-edit-method control-button-edit ededmethod_moveobject clickable" Title="' + w2utils.lang("Move object") + '"> </div> ' +  // перемещение объекта
                '</td> ' +
                '</tr>' +
                '</table>';

            return html;
        },

        /**
         * Смена способа создания или редактирования
         * @method clickMethod
         * @param target {Element} Элемент кнопки
         */
        // ===============================================================
        clickMethod: function (target) {

            var actiontarget = target, $actiontarget = $(actiontarget);

            // Если активный элемент, отжать и выйти
            if (GWTK.DomUtil.isActiveElement(target)) {
                this.clearMethod();
                return;
            }

            GWTK.mapeditorTask.prototype.checkmethod(actiontarget);

            this.buttonmethod_edit = this.getclassmethod(actiontarget);

            // Запомним имя обработчика до старта другого
            this.currentTaskAcrionName = (this.mapeditorTask.getActiveTask().action) ? this.mapeditorTask.getActiveTask().action.name : this.name;

            // Все кнопки сделать доступными
            this.methodsEnabled();

            // Отсечь режимы с разовым нажатием
            // Замкнуть объект
            if ($actiontarget.hasClass('ededmethod_closeobject')) {
                this.mapeditorTask.closeobject(false);
                this.updatedrawcontur(this.name);
                $actiontarget.click();
                return;
            }
            // Изменить направление цифрования
            if ($actiontarget.hasClass('ededmethod_changedir')) {
                this.mapeditorTask.changedirection(-1, 'edit');
                $actiontarget.click();
                return;
            }
            // Создать подобъект
            if ($actiontarget.hasClass('ededmethod_createsubobject')) {
                this.createsubobject();
                return;
            }
            // Удалить подобъект
            if ($actiontarget.hasClass('ededmethod_removesubobject')) {
                this.removesubobject(this.mapeditorTask.getsubjectnumberByMetrics());
                $actiontarget.click();
                return;
            }

            // Переместить объект
            if ($actiontarget.hasClass('ededmethod_moveobject')) {
                this.processMoving();
                return;
            }

            // Редактирование участка
            if ($actiontarget.hasClass('ededmethod_editsegment')) {
                // Создадим класс макетов
                if (this.mapeditorTask.mapeditExtendMethods) {
                    this.mapeditorTask.mapeditExtendMethods.set({
                        "title": w2utils.lang("Segment"),         // Заголовок панели
                        "editobject": this.editobject,   // Редактируемый объект
                        "methods": [{
                            "name": w2utils.lang("Delete part"),         // название
                            "id": "ededmethod_deletesegment",           // идентификатор
                            "fn_start": GWTK.Util.bind(this.method_deletesegmentStart, this),             // функцмя старта режима
                            "fn_stop": GWTK.Util.bind(this.method_deletesegmentStop, this),              // функцмя остановки режима
                            "cssclass": "ededmethod_deletesegment"      // класс изображения на кнопке
                        },
                            {
                                "name": w2utils.lang("Move part"),         // название
                                "id": "ededmethod_movesegment",           // идентификатор
                                "fn_start": GWTK.Util.bind(this.method_movesegmentStart, this),             // функцмя старта режима
                                "fn_stop": GWTK.Util.bind(this.method_movesegmentStop, this),               // функцмя остановки режима
                                "cssclass": "ededmethod_movesegment"      // класс изображения на кнопке
                            },
                            {
                                "name": w2utils.lang("Copy part"),         // название
                                "id": "ededmethod_copysegment",           // идентификатор
                                "fn_start": GWTK.Util.bind(this.method_copysegmentStart, this),             // функцмя старта режима
                                "fn_stop": GWTK.Util.bind(this.method_copysegmentStop, this),               // функцмя остановки режима
                                "cssclass": "ededmethod_copysegment"      // класс изображения на кнопке
                            }
                        ],        // Массив объектов GWTK.MapeditExtendMethod
                        "fn_start": GWTK.Util.bind(function () {
                            this.methodsEnabled(target);
                        }, this),
                        "fn_stop": GWTK.Util.bind(function () {
                            this.methodsEnabled();
                            GWTK.DomUtil.removeActiveElement(target);
                        }, this)
                    }, true);
                }
            }

            // Запустим режим редактирования
            this.drawmark_events('off');
            //this.drawmark_events('on');

            // Если включен режим топологии
            if ($actiontarget.hasClass('ededmethod_edallpoint')) {
                this.drawmark_events('on');
            }

        },

        /**
         * Определение css кнопки способа создания или редактирования
         * @method getclassmethod
         * @param buttonmethod {Element} Элемент кнопки
         */
        // ===============================================================
        getclassmethod: function (selector) {
            var el = $(selector);
            if (el && el.length > 0) {
                for (var i = 0; i < this.methods.length; i++) {
                    if (el.hasClass(this.methods[i])) {
                        return '.' + this.methods[i];
                    }
                }
            }
        },

        /**
         * methodsEnabled - назначение доступости кнопок режимов
         * @param selectorsEnable - массив доступных селекторов (если отсутствует, то все кнопки доступны)
         *
         */
        methodsEnabled: function (selectorsEnable) {
            // Если есть, то его оставим доступным, остальнве нет
            if (selectorsEnable) {
                if (!(selectorsEnable instanceof Array)) {    // Не массив
                    selectorsEnable = [selectorsEnable]
                }

                for (var i = 0; i < selectorsEnable.length; i++) {
                    var el = $(selectorsEnable[i]);
                    if (el && el.length > 0) {
                        for (var j = 0; j < this.methods.length; j++) {
                            if (!el.hasClass(this.methods[j])) {
                                $('.' + this.methods[j]).addClass('disabledbutton');
                            }
                            else {
                                $('.' + this.methods[j]).removeClass('disabledbutton');
                            }
                        }
                    }
                }
            }
            else {  // Сделать все доступным
                for (var i = 0; i < this.methods.length; i++) {
                    $('.' + this.methods[i]).removeClass('disabledbutton');
                }
            }

        },

        /**
         * Запуск процесса создания нового контура
         * @method createsubobject
         */
        // ===============================================================
        createsubobject: function () {
            this.editobject.geometry.addsubject();
            this.mapeditorTask.ischange(true);
            this.mapeditorTask.extend = true;
            var currentsubobject = this.editobject.geometry.subjects.length;
            if (this.mapeditorTask.metrics) {
                this.mapeditorTask.metrics.updatesubjectlist(currentsubobject, this.editobject.geometry.saveJSON(true));
            }

            // Если этот обработчик от задачи создания
            this.startCreatingTask(currentsubobject);

        },

        // Запустить задачу создания с продолжением создания
        startCreatingTask: function (currentsubobject) {

            //  Закроем текущий обработчик редактирования
            this.map.closeAction();

            // Если этот обработчик от задачи создания
            if (this.task instanceof GWTK.MapeditorCreatingTask)
                this.task.setCreation(currentsubobject);
            else {

                if (!this.mapeditorTask.setTask(this.mapeditorTask.mapeditorCreatingTask = new GWTK.MapeditorCreatingTask(this.name, this.getMap(), null, null, this.mapeditorTask, this.task, currentsubobject))) {
                    this.mapeditorTask.mapeditorCreatingTask.destroy();
                    this.mapeditorTask.mapeditorCreatingTask = null;
                    return;
                }

            }

            return this.task;
        },

        /**
         * Удаление контура
         * @method removesubobject
         * @param subjectnumber {Int} - Номер контура с 1
         */
        // ===============================================================
        removesubobject: function (subjectnumber) {
            if (!subjectnumber) return;

            var newgeometry = this.editobject.geometry.createcopy();
            this.drawobject.destroy();
            this.editobject.geometry.deletesubject(subjectnumber);

            if (this.mapeditorTask.metrics) {
                this.mapeditorTask.metrics.updatesubjectlist(0, this.editobject.geometry.saveJSON(true));
            }

            this.mapeditorTask.history.add('all', null, 0, null, null, null, newgeometry, this.editobject.geometry);
            this.mapeditorTask.ischange(true);
            this.updatedrawcontur(this.name);
        },

        /**
         * Обновить изображение редактируемого объекта
         * @method updatedrawcontur
         * @param nometrics {Boolean} - если true -
         * то не обновляется содержимое окна ввода координат с клавиатуры
         */
        // ===============================================================
        updatedrawcontur: function (subaction) {
            this.mapeditorTask.updatedrawcontur(null, subaction);
        },

        /**
         * Запустить процесс перемещения объекта
         * @method processMoving
         */
        // ===============================================================
        processMoving: function () {

            var actionTask = new GWTK.MapeditorMovingAction(this.task, 'moving', {'context': this.mapeditorTask});
            if (!actionTask.error) {
                // Флаг расширения, используется для продолжения работы без запроса на сохранение
                this.mapeditorTask.extend = true;
                if (this.mapeditorTask.setAction(actionTask)) {
                    return;
                }
                actionTask.close();
            }

        },

        /**
         * Запустить процесс перемещения объекта
         * @method processMoving
         */
        // ===============================================================
        processSelectPoints: function () {

            var actionTask = new GWTK.MapeditorSelectPointsAction(this.task, 'selectpoints', {'context': this.mapeditorTask});
            if (!actionTask.error) {
                // Флаг расширения, используется для продолжения работы без запроса на сохранение
                this.mapeditorTask.extend = true;
                if (this.mapeditorTask.setAction(actionTask)) {
                    return;
                }
                actionTask.close();
            }

        },

        /**
         * Контекстное меню для точки объекта
         * @method popupmenu
         * @param div {Element} - Родительский элемент
         * @param x {Int} - Координата экрана x
         * @param y {Int} - Координата экрана y
         */
        // ===============================================================
        popupmenu: function (div, x, y) {

            // удалить меню 
            $('#' + this.mapeditorTask.popupId).remove();
            var editobject = this.editobject;

            if (!div || !div.id || !editobject || !editobject.geometry ||
                div.id.indexOf('center') >= 0) return;  // если это средняя точка 

            var left = '0px', top = '0px', spatialposition = editobject.spatialposition.toLowerCase();
            if (!isNaN(x)) left = parseInt(x - 5, 10) + 'px';
            if (!isNaN(y)) top = parseInt(y - 5, 10) + 'px';

            var subjectnumber = this.drawobject.getsubjectnumber(div.id),
                pcount = editobject.geometry.count(subjectnumber),
                styleDiv = ' style="left:' + left + ';top:' + top + '; cursor: pointer;opacity: 0.9"',
                deletepoint = '<tr><td width="16px" class="ededmethod_delpoint" style="background-repeat:no-repeat;"/>  <td id="' + this.mapeditorTask.popupId + '_deletepoint" style="padding-left:5px;">' + w2utils.lang("Remove point") + '</td></tr>';
            if (!editobject.geometry.isdeletingpoint(subjectnumber))
                deletepoint = '';

            // Заглушка, пока нет других операций над точками
            if (deletepoint == '' && pcount <= 1 || !spatialposition)
                return;

            // Определим номер точки
            var continu = '', closeobject = '', cutobject = '', changedirection = '', createsubobject = '',
                removesubobject = '',
                number = this.drawobject.getnumber(div.id),
                isclosing = false,
                pointfirst = editobject.geometry.getpoint(1, subjectnumber),
                pointlast = editobject.geometry.getpoint(pcount, subjectnumber),
                line = spatialposition.indexOf('linestring'), polygon = spatialposition.indexOf('polygon');
            if (!pointfirst || !pointlast) return;

            if ((line >= 0 || polygon >= 0) && pcount >= 3 && (pointfirst.x != pointlast.x && pointfirst.y != pointlast.y))
                isclosing = true;  // теоретически можно замыкать (не замкнут)

            if (isclosing && (number == pcount - 1 || number == 0)) { // последняя точка
                //if (this.task instanceof GWTK.MapeditorCreatingTask)
                //    continu = '<tr><td width="16px" class="ededmethod_continue" style="background-repeat:no-repeat;"/>  <td id="mapeditingPopupmenu_continue" style="padding-left:5px;">' + w2utils.lang("Continue") + '</td></tr>';
                closeobject = '<tr><td width="16px" class="ededmethod_closeobject" style="background-repeat:no-repeat;"/>  <td id="' + this.mapeditorTask.popupId + '_closeobject" style="padding-left:5px;">' + w2utils.lang("Close object") + '</td></tr>';
            }

            // разрезать линейный
            if (line >= 0 && pcount >= 3 && (!isclosing || (number > 0 && number < pcount - 1)))
                cutobject = '<tr><td width="16px" class="ededmethod_cutobject" style="background-repeat:no-repeat;"/>  <td id="' + this.mapeditorTask.popupId + '_cutobject" style="padding-left:5px;">' + w2utils.lang("Cut") + '</td></tr>';

            // сменить направление
            if ((spatialposition != 'point' && spatialposition != 'multipoint') && pcount > 1)
                changedirection = '<tr><td width="16px" class="ededmethod_changedir" style="background-repeat:no-repeat;"/> <td id="' + this.mapeditorTask.popupId + '_changedirection" style="padding-left:5px;">' + w2utils.lang("Change direction") + '</td></tr>';

            // Создать подобъект (только для площадных и линейных)
            var en = GWTK.MapEditorUtil.isEnabledItemMenu(spatialposition, this.mapeditorTask.graphic);
            if (en) {
                //if (spatialposition != 'point' && spatialposition != 'multipoint' && spatialposition != 'vector' && spatialposition != 'title') {
                createsubobject = '<tr><td width="16px" class="ededmethod_createsubobject" style="background-repeat:no-repeat;"/> <td id="' + this.mapeditorTask.popupId + '_createsubobject" style="padding-left:5px;">' + w2utils.lang("Add contour") + '</td></tr>';
            }

            // Удалить подобъект (только для площадных и линейных)
            if (subjectnumber > 0 && en) {
                //(spatialposition != 'point' && spatialposition != 'vector' && spatialposition != 'title'))
                removesubobject = '<tr><td width="16px" class="ededmethod_removesubobject" style="background-repeat:no-repeat;"/> <td id="' + this.mapeditorTask.popupId + '_removesubobject" style="padding-left:5px;">' + w2utils.lang("Remove contour") + '</td></tr>';
            }

            // Найти точку на альтернативном объекте
            var sourcepoint = '<tr><td width="16px" class="ededmethod_sourcepoint" style="background-repeat:no-repeat;"/> <td id="' + this.mapeditorTask.popupId + '_sourcepoint" style="padding-left:5px;">' + w2utils.lang("Capture the line of the selected object") + '</td></tr>';

            var text =
                '<div id="' + this.mapeditorTask.popupId + '" class=" map-panel-def editTable" ' + styleDiv + ' >' +
                '<div align="left"  class="menupoint" style="margin-left:5px; margin-top:5px;">' + //actionname +
                '</div>' +
                '<div>' +
                '<table cellspacing="2px;" cellpadding="2px" style="width:140px;">' +
                deletepoint +
                //sourcepoint +
                closeobject + // замкнуть
                cutobject + // разрезать
                changedirection + // сменить направление
                createsubobject + // создать подобъект
                removesubobject + // удалить подобъект
                continu +  // продолжить
                '</table>' +
                '</div></div>';

            $(this.drawpanel).append(text);

            var $popup = $('#' + this.mapeditorTask.popupId),
                $menupoint = $('.menupoint'),
                _that = this;
            if ($menupoint.length > 0) {
                $menupoint[0].appendChild(GWTK.Util.createHeaderForComponent({
                    map: this.map,
                    callback: GWTK.Util.bind(function () {
                        $popup.remove();
                        _that.topology.map_events('on');
                        return false;
                    }, this)
                }));

                var $popupclose = $menupoint.find('.panel-info-close');

                $('#' + this.mapeditorTask.popupId + '_deletepoint').click(function (event) {
                    $popupclose.click();
                    if (!div) {
                        w2alert(w2utils.lang("There is no point to remove"));
                        return false;
                    }

                    // удалить точку
                    _that.mapeditorTask.deletepoint(_that.drawobject.getnumber(div.id) + 1, _that.drawobject.getsubjectnumber(div.id), 'edit');
                    _that.updatedrawcontur('edit');
                    return false;
                });

                $('#' + this.mapeditorTask.popupId + '_sourcepoint').click(function (event) {
                    $popupclose.click();
                    if (!div) {
                        w2alert(w2utils.lang("There is no point to remove"));
                        return false;
                    }

                    // найти ответную точку
                    _that.mapeditorTask.selectSourceObject(_that.drawobject.getnumber(div.id), _that.drawobject.getsubjectnumber(div.id));
                    return false;
                });

                //            // Продолжить 
                //            $('#mapeditingPopupmenu_continue').click(function (event) {
                //                $('#mapeditingPopupmenu').hide();
                //                if (isclosing) // Если замкнут, разорвать
                //                    _that.editobject.geometry.deletepoint(pcount, subjectnumber);
                //                // установить панель инструментов и режим
                ////                var task = _that.startCreatingTask(true);
                //                var task = _that.startCreatingTask(subjectnumber);
                //                // Отключить все режимы создания кроме произвольного контура
                //                if (task) {
                //                    task.buttonmethod_enableOnly(['.edcrmethod_free_line']);
                //                }
                //                return false;
                //            });

                // Замкнуть
                $('#' + this.mapeditorTask.popupId + '_closeobject').click(function (event) {
                    _that.mapeditorTask.closeobject(false, subjectnumber);
                    _that.updatedrawcontur(_that.name);
                    //_that.complete();
                    $popupclose.click();
                    return false;
                });

                // Разрезать
                $('#' + this.mapeditorTask.popupId + '_cutobject').click(function (event) {
                    var newgeometry = _that.editobject.geometry.createcopy();
                    _that.editobject.geometry.cutline(_that.drawobject.getnumber(div.id) + 1, subjectnumber);
                    _that.mapeditorTask.history.add('all', null, subjectnumber, null, null, null, newgeometry, _that.editobject.geometry);
                    _that.mapeditorTask.ischange(true);
                    _that.updatedrawcontur(_that.name);
                    $popupclose.click();
                    return false;
                });

                // Изменить направление
                $('#' + this.mapeditorTask.popupId + '_changedirection').click(function (event) {
                    _that.mapeditorTask.changedirection(subjectnumber, 'edit');
                    $popupclose.click();
                    return false;
                });

                // Создать подобъект
                $('#' + this.mapeditorTask.popupId + '_createsubobject').click(function (event) {
                    _that.createsubobject();
                    $popupclose.click();
                    return false;
                });

                // Удалить подобъект
                $('#' + this.mapeditorTask.popupId + '_removesubobject').click(function (event) {
                    _that.removesubobject(subjectnumber);
                    $popupclose.click();
                    return false;
                });


            }

            // Отключить события карты
            this.topology.map_events('off');

        },


        /**
         * Действия в процессe перемещения точки
         * @method do_processmethod
         * @param process {String} Наименование процесса "start", "drag", "stop"
         * @param target {Object} объект события по перемещению
         * @param ui {Object} Объект, содержащий смещение точки
         */
        // ===============================================================
        do_processmethod: function (process, target, ui) {
            if (!this.drawobject || !this.drawpanel) return;
            // Смещение на центр
            var _that = this, newpos,
                offset = (target) ? this.drawobject.offsetCenter(target.id) : null;

            switch (process) {
                case 'start':
                    // Oтключить события карты в топологии
                    this.topology.nomouseover = false;
                    this.topology.map_events('off');

                    $('#' + this.mapeditorTask.popupId).hide();
                    // Если работает обработчик перемещения
                    if (this.getMap().taskManager._action instanceof GWTK.MapeditorCreatingAction)
                        return false;

                    if (this.buttonmethod_edit == '.ededmethod_edallpoint') {
                        // Отключить обработчики
                        this.drawmark_events('off');
                        //  определим ВСЕ близлежашие точки выбранных объектов
                        this.topology.addneartopologypoints();
                    }
                    break;
                case 'stop':
                    this.topology.nomouseover = true;
                    if (this.topology.currentPoint) {
                        newpos = this.drawobject.getpositionByPointId(this.topology.currentPoint);
                        if (newpos) {
                            ui.position.left = newpos.x;
                            ui.position.top = newpos.y;
                        }

                        // сотрем с холста виртуальную точку
                        this.topology.drawVirtualPoint();
                    }

                    if (this.buttonmethod_edit == '.ededmethod_edallpoint') {
                        this.topojson = [this.topology.copytopologyobjectJSON(), null];
                        // Запросим параметры виртуальной точки
                        var nearObjectParam = this.topology.getVirtualPointParam();
                        if (nearObjectParam) {
                            // Добавить виртуальную точку в исходный json
                            this.topology.addVirtualPointToInterfaceJSON(nearObjectParam);
                        }

                        this.topology.dragtopologypoints(GWTK.point(ui.position.left, ui.position.top), true);
                        this.topojson[1] = this.topology.copytopologyobjectJSON();

                        // Включить обработчики
                        this.drawmark_events('on');
                    }

                    // Если было вращение
                    if (this.drawobject.drag.rotate) {
                        // Сохранить в историю

                        // Нарисовать объект 
                        this.mapeditorTask.ischange(true);
                        this.updatedrawcontur(this.name);
                    }

                    // Если было масштабирование
                    if (this.drawobject.drag.scale >= 0) {
                        // Сохранить в историю

                        // Нарисовать объект 
                        this.mapeditorTask.ischange(true);
                        this.updatedrawcontur(this.name);
                    }

                    this.topology.map_events('on');
                    break;

                case 'drag':
                    if (offset) {
                        // Подсветить близлежащий объект и точку
                        var ret = this.topology.drawOverObject(ui, {
                            isobjectpoint: this.mapeditorTask.options.capturePoints,
                            isvirtualpoint: this.mapeditorTask.options.captureVirtualPoints
                        });
                        if (ret) {
                            this.drawobject.hidepoint(target);
                        }

                        if (this.buttonmethod_edit == '.ededmethod_edallpoint') {
                            //  Отрисовать объекты топологии 
                            this.topology.dragtopologypoints(GWTK.point(ui.position.left, ui.position.top));
                        }
                    }
                    break;

            }

            return true;

        },

        /**
         * Включение/отключение обработчиков на точки
         * @method drawmark_events
         * @param type {String} Флажок 'on' - назначить, 'off' - отключить
         */
        // ===============================================================
        drawmark_events: function (type) {
            var map = this.getMap();
            $(map.eventPane).off('drawmark_mouseout', this.onDrawmark_mouseout);
            $(map.eventPane).off('drawmark_mouseover', this.onDrawmark_mouseover);
            if (type == 'on') {
                $(map.eventPane).on('drawmark_mouseout', this.onDrawmark_mouseout);
                $(map.eventPane).on('drawmark_mouseover', this.onDrawmark_mouseover);
            }

        },

        /**
         * Обработчик mouseout-события точки
         * @method onDrawmark_mouseout
         * @param event {Object} Событие
         */
        // ===============================================================
        onDrawmark_mouseout: function (event) {
            if (!this.topology) return;
            this.mapeditorTask.setStatusBar(w2utils.lang("Edit the chosen object, moving contour points") + '. ' + w2utils.lang("Save") + " (Сtrl+S)");
            this.topology.cleardrawtopogroup();
        },

        /**
         * Обработчик mouseovert-события точки
         * @method onDrawmark_mouseover
         * @param event {Object} Событие
         */
        // ===============================================================
        onDrawmark_mouseover: function (event) {
            if (!this.topology) return;

            var id = event.sender.getAttributeNS(null, 'id');
            if (event && event.sender) {
                var id = event.sender.getAttributeNS(null, 'id');
                if (id.indexOf('rotate') < 0 && id.indexOf('_bop_') < 0)
                    this.mapeditorTask.setStatusBar(w2utils.lang("Edit the chosen object, moving contour points") + '. ' + w2utils.lang("Save") + " (Сtrl+S)");
            }

            // Если режим топологии, подсветить близлежашие объекты
            if (this.buttonmethod_edit == '.ededmethod_edallpoint') {
                var id = event.sender.id, prefix = this.drawobject.pointprefix + 'mop_';
                if (!id || id.indexOf(prefix) < 0)
                    return;
                var point = this.drawobject.getpositionByPointId(id);
                if (point)
                    this.topology.drawtopologyobjects(GWTK.point(point.x, point.y), id);
            }
        },

        // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        // Расширенные режимы
        // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        /**
         * method_deletesegment - старт удаления участка
         */
        method_deletesegmentStart: function () {
            this.processSelectObjectPoints = new GWTK.SelectNearesObjectPoints(this.task, this.map, {
                name: this.mapeditorTask.extraAction,
                mapobject: this.editobject,
                pointscount: 3,
                fn_callback: GWTK.Util.bind(function (selectObjectPoints) {

                    // параметры для удаления точек
                    if (selectObjectPoints && selectObjectPoints.length == 3) {
                        // удалить точки
                        this.mapeditorTask.deletesegment([selectObjectPoints[0].id[0] + 1, selectObjectPoints[1].id[0] + 1, selectObjectPoints[2].id[0] + 1], selectObjectPoints[1].subject + 1, 'edit');
                        this.method_deletesegmentStop();
                    }
                }, this)
            })

        },

        /**
         * method_deletesegment - стоп удаление участка
         */
        method_deletesegmentStop: function () {
            if (this.processSelectObjectPoints) {
                this.processSelectObjectPoints.stop();
                this.processSelectObjectPoints.destroy();
                this.processSelectObjectPoints = null;
            }

            if (this.mapeditorTask.mapeditExtendMethods) {
                this.mapeditorTask.mapeditExtendMethods.reset();
            }
            this.startEditAction();
        },


        /**
         * method_movesegment - перемещение участка
         */
        method_movesegmentStart: function () {
            this.processSelectObjectPoints = new GWTK.SelectNearesObjectPoints(this.task, this.map, {
                name: this.mapeditorTask.extraAction,
                mapobject: this.editobject,
                pointscount: 3,
                fn_callback: GWTK.Util.bind(function (selectObjectPoints) {

                    // параметры для удаления точек
                    if (selectObjectPoints && selectObjectPoints.length == 3 && this.editobject && this.editobject.geometry) {
                        var geometry = this.editobject.geometry.createsegment(
                            [selectObjectPoints[0].id[0] + 1, selectObjectPoints[1].id[0] + 1, selectObjectPoints[2].id[0] + 1], selectObjectPoints[1].subject + 1);
                        if (geometry && geometry.mapgeometry && geometry.mapgeometry.count() > 0) {
                            var mapobject = new GWTK.mapobject(this.map, this.editobject.gid, null, geometry.mapgeometry);
                            mapobject.spatialposition = geometry.mapgeometry.spatialposition;
                            // Создадим объект для перемещения
                            this.movingMapObjectAction = new GWTK.MovingMapObjectAction(this.task,
                                {
                                    "name": "movesegment",
                                    "mapobject": mapobject,
                                    "fn_callback": GWTK.Util.bind(
                                        function (mapobject, deltaGeo) {
                                            // Обновим метрику исходного объекта
                                            this.mapeditorTask.offsetsegment([selectObjectPoints[0].id[0] + 1, selectObjectPoints[1].id[0] + 1, selectObjectPoints[2].id[0] + 1], selectObjectPoints[1].subject + 1, deltaGeo, 'edit');
                                            this.method_movesegmentStop();
                                        }, this
                                    ),
                                    drawOptions: {"fill": "#159cba"}
                                });

                            if (!this.movingMapObjectAction.error) {
                                this.movingMapObjectAction.set();
                            }
                            else {
                                this.method_movesegmentStop();
                            }
                        }
                        else {
                            this.method_movesegmentStop();
                        }
                    }
                    else {
                        this.method_movesegmentStop();
                    }
                }, this)
            })

        },


        /**
         * method_movesegmentStop - стоп перемещения участка
         */
        method_movesegmentStop: function () {
            if (this.movingMapObjectAction) {
                if (this.movingMapObjectAction.close()) {
                    this.movingMapObjectAction = null;
                }
            }
            if (this.processSelectObjectPoints) {
                this.processSelectObjectPoints.stop();
                this.processSelectObjectPoints.destroy();
                this.processSelectObjectPoints = null;
            }

            if (this.mapeditorTask.mapeditExtendMethods) {
                this.mapeditorTask.mapeditExtendMethods.reset();
            }

            this.startEditAction();
        },


        /**
         * method_copysegmentStart - копированеи участка
         */
        method_copysegmentStart: function () {
            // Выбрать точки на объеке
            this.processSelectObjectPoints = new GWTK.SelectNearesObjectPoints(this.task, this.map, {
                name: this.mapeditorTask.extraAction,
                mapobject: this.editobject,
                pointscount: 3,
                fn_callback: GWTK.Util.bind(function (selectObjectPointsIn) {
                    // параметры для замены точек
                    if (selectObjectPointsIn && selectObjectPointsIn.length == 3) {
                        if (this.processSelectObjectPoints) {
                            this.processSelectObjectPoints.stop();
                            this.processSelectObjectPoints.destroy();
                            this.processSelectObjectPoints = null;
                        }
                        // Выбрать объект
                        this.processSelectObject = this.mapeditorTask.selectObject(GWTK.Util.bind(
                            function (ui) {
                                if (!ui.layer || !ui.gid)
                                    return false;
                                // Ищем объект
                                var editobject = this.map.objectManager.selectedFeatures.findobjectsById(ui.layer, ui.gid);
                                if (editobject) {
                                    editobject = editobject.clone();
                                    this.mapeditorTask.destroySelectMapObjectAction();
                                    this.processSelectObjectPoints = new GWTK.SelectNearesObjectPoints(
                                        this.task, this.map,
                                        {
                                            name: this.mapeditorTask.extraAction,
                                            mapobject: editobject,
                                            pointscount: 3,
                                            fn_callback: GWTK.Util.bind(
                                                function (selectObjectPointsOut) {
                                                    if (selectObjectPointsOut && selectObjectPointsOut.length == 3) {

                                                        var newsegment = editobject.geometry.createsegment(
                                                            [selectObjectPointsOut[0].id[0] + 1, selectObjectPointsOut[1].id[0] + 1, selectObjectPointsOut[2].id[0] + 1], selectObjectPointsOut[1].subject + 1);

                                                        // Обновим метрику исходного объекта
                                                        this.mapeditorTask.updatesegment([selectObjectPointsIn[0].id[0] + 1, selectObjectPointsIn[1].id[0] + 1, selectObjectPointsIn[2].id[0] + 1], selectObjectPointsIn[1].subject + 1, newsegment, 'edit');

                                                        this.method_copysegmentStop();
                                                        }
                                                     else {
                                                        this.method_copysegmentStop(); //  не выбрали три точки у второго объекта
                                                     }
                                                }, this)
                                         });
                                }
                                else {
                                    this.method_copysegmentStop(); //  нет выбранного объекта
                                }
                            }, this),
                            this.mapeditorTask.extraAction,
                            w2utils.lang("Copy part") + ': ' +  w2utils.lang("Select the highlighted object on the map") );
                    }
                    else {
                        this.method_copysegmentStop();       // Не выбрали три точки
                    }
                }, this)
            })

        },

        /**
         * method_copysegmentStop - стоп копирования участка
         */
        method_copysegmentStop: function () {

            this.mapeditorTask.destroySelectMapObjectAction();

            if (this.processSelectObjectPoints) {
                this.processSelectObjectPoints.stop();
                this.processSelectObjectPoints.destroy();
                this.processSelectObjectPoints = null;
            }
            if (this.mapeditorTask.mapeditExtendMethods) {
                this.mapeditorTask.mapeditExtendMethods.reset();
            }

            this.startEditAction();
        }


    };
    GWTK.Util.inherits(GWTK.MapeditorEditingAction, GWTK.MapAction);

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // Обработчик групповой обработки объектов карты   
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    GWTK.MapeditorGroupAction = function (task, name) {
        GWTK.MapAction.call(this, task, name);           // родительский конструктор     
        this.canCancel = false;
    }
    GWTK.Util.inherits(GWTK.MapeditorGroupAction, GWTK.MapAction);


}
