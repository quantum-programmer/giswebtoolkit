/************************************* Соколова  ***** 03/06/21  ****
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


    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // Обработчик Редактирования объекта
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    GWTK.MapeditorEditingActionExt = function (task, name) {
        this.error = true;

        GWTK.MapAction.call(this, task, name);           // родительский конструктор

        // Не отображать объекты карты в диалоге выбора объектов
        this.showInfoOfSelectedObjects = false;

        // this.mapeditorTask = context;
        this.map = this.getMap();
        if (!this.map) return;

        this.editobject = (this.task.editobjects && this.task.editobjects.length > 0) ? this.task.editobjects[0] : null;  // Редактируемый объект
        if (!this.editobject) return;

        this.drawobject = this.task.drawobject;
        if (!this.drawobject) return;
        this.drawpanel = this.task.drawpanel;
        if (!this.drawpanel) return;

        // Запросим объекты окружения, если их нет
        this.topology = this.task.topology;
        if (!this.topology) return;

        // Статус бар
        this.setStatusBar = this.task.setStatusBar;
        this.clearStatusBar = this.task.clearStatusBar;

        this.error = false;

        this.iscomplete(this.editobject, 0);

        // Замыкание контекста
        this.bind();

        // курсор
        this.drawpanel.style.cursor = 'default';

        // текущий обработчик
        //this.currentTaskAcrionName = name;

        this.tools = {
            'edit': {
                prefix: 'ededmethod_',
                style: 'control-button-edit-tools clickable',
                buttons: [
                    {
                        name: 'edallpoint',
                        fn_click: this.fn_clickEditTools,
                        caption: w2utils.lang("Topology"),
                        fn_visible: null,
                        fn_disable: null,
                        style: ''
                    },
                    {
                        name: 'closeobject',
                        fn_click: this.fn_clickEditTools,
                        caption: w2utils.lang("Close object"),
                        fn_visible: null,
                        fn_disable: GWTK.Util.bind(this.task.disabledStyleTools, this.task),
                        style: ''
                    },
                    {
                        name: 'changedir',
                        fn_click: this.fn_clickEditTools,
                        caption: w2utils.lang("Change direction"),
                        fn_visible: null,
                        fn_disable: GWTK.Util.bind(this.task.disabledStyleTools, this.task),
                        style: ''
                    },
                    {
                        name: 'editsegment',
                        fn_click: this.fn_clickEditTools,
                        caption: w2utils.lang("Edit part"),
                        fn_visible: null,
                        fn_disable: GWTK.Util.bind(this.task.disabledStyleTools, this.task),
                        style: ''
                    },
                    {
                        name: 'createsubobject',
                        fn_click: this.fn_clickEditTools,
                        caption: w2utils.lang("Add contour"),
                        fn_visible: null,
                        fn_disable: GWTK.Util.bind(this.task.disabledStyleTools, this.task),
                        style: ''
                    },
                    {
                        name: 'removesubobject',
                        fn_click: this.fn_clickEditTools,
                        caption: w2utils.lang("Remove contour"),
                        fn_visible: null,
                        fn_disable: GWTK.Util.bind(this.task.disabledStyleTools, this.task),
                        style: ''
                    },
                    {
                        name: 'moveobject',
                        fn_click: this.fn_clickEditTools,
                        caption: w2utils.lang("Move object"),
                        fn_visible: null,
                        fn_disable: null,
                        style: ''
                    }
                ]
            }
        }

    };

    GWTK.MapeditorEditingActionExt.prototype = {

        /**
         * Замыкание контекста
         * @method bind
         */
        // ===============================================================
        bind: function () {
            if (this.error) {
                return;
            }
            this.drawobject.clearparam();

            // Навесим всплывающее меню на точки
            // this.drawobject.addPopupmenu(GWTK.Util.bind(this.popupmenu, this));
            this.drawobject.addPopupmenu(GWTK.Util.bind(this.task.onContextMenu, this));

            // Перемещение точкм
            this.drawobject.do_draggable = GWTK.Util.bind(this.do_processmethod, this);
            // this.drawobject.do_updatepoint = GWTK.Util.bind(this.task.updatepoint, this.task);
            this.drawobject.do_updatepoint = GWTK.Util.bind(this.updatepointByDiv, this);

            // Добавить продолжение цифрования
            if (!this.isComplete) {
                this.drawobject.addContinue(GWTK.Util.bind(this.do_continue, this));
            };

            this.onDrawmark_mouseout = GWTK.Util.bind(this.onDrawmark_mouseout, this);
            this.onDrawmark_mouseover = GWTK.Util.bind(this.onDrawmark_mouseover, this);

            // Событие на изменение вида графического объекта
            $(this.map.eventPane).on('GWTK.MapeditLegendGraphicControl.changegraphicparams', GWTK.bind(function(event){
                if (this.editobject && this.editobject.graphic && event.source &&  this.editobject.graphic.type == event.source.type) {
                    this.editobject.graphic = event.source.saveJSON();
                    this.drawobject.draw(this.editobject, this.topology.svgDraw, true, true, false, true);
                }
            }, this));

        },


        /**
         *  Создание панели инструментов
         * @returns {string}
         */
        createPaneTools: function (tools, mode) {
            if (!tools) {
                tools = this.tools;
            }
            if (!mode) {
                mode = 'edit';
            }
            this.task.createPaneTools(tools, mode, this);

            // Если была нажата кнопка топологии
            if (this.task.buttonmethod_edit == 'edallpoint') {
                var bt = this.task.findButton(tools, 'edit', this.task.buttonmethod_edit);
                if (bt) {
                    $(bt.selector).click();
                }
            }

        },

        /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
         * @method set
         * @param options {Object} параметры обработчика
         */
        // ===============================================================
        set: function (options) {
            if (this.error) {
                return;
            }

            this.drawobject.zIndexDrawPanel('up', this.drawpanel);

            // Панель инструментов
            this.createPaneTools(this.tools, 'edit');

            // Включим события
            this.drawmark_events('on');

            // Установить текущий обработчик
            this.task.currentAction = this;

            // Перерисовать карту с объектами топологии. Это обязательно!!!
//            this.topology.searchObjectsByAreaFrame(null, [this.editobject.gid], 'edit', this.task.selectlayersid, true,
            this.topology.searchObjectsByAreaFrame(null, [this.editobject.gid], 'edit', [], true,
                w2utils.lang("Edit the chosen object, moving contour points") + '. ' + w2utils.lang("Save") + " (Сtrl+S)");

        },

        /**
         * Сбросить настройки (отключение обработчиков событий, инициализация флажков и др.)
         * @method clear
         */
        // ===============================================================
        clear: function () {
            if (this.error) {
                return;
            }
            this.drawmark_events('off');
            this.task.zIndexRestore();

            if (!this.task.extend) {
                this.task.clearPaneTools();
            }

            // Сбросим все обработчики и функции
            this.drawobject.clearparam();
        },

        canClose: function () {
            if (this.error) {
                return true;
            }
            return this.task.canClose();
        },

        /**
         * Отрисовка объекта
         */
        draw: function () {
            if (this.error) {
                return true;
            }
            this.drawobject.draw(this.editobject, this.topology.svgDraw, true,
                !this.isComplete,
                false, true);
        },


        /**
         * Завершить процесс создания метрики объекта
         * @method complete
         */
        // ===============================================================
        complete: function () {
            if (this.error || !this.editobject) {
                return;
            }

            // если полигон, замкнуть метрикy
            if (this.editobject.spatialposition.toLowerCase().indexOf('polygon') >= 0) {
                if (!this.task.closeobject(false, this.task.getsubjectnumber())) {
                    w2alert(w2utils.lang("Object contains less than 3 points!"));
                    return;
                }
            }

            // Занести метрику в окно с метрикой объекта
            if (this.task.metrics) {
                // this.task.metrics.options.action = "edit";
                this.task.metrics.creategrid(this.editobject.geometry.saveJSON(true));
            }

            this.draw();

            return true;
        },

        /**
         * Нажимаем кнопки в режиме редактирования
         * @param event
         * @param name
         */
        fn_clickEditTools: function (event, name) {

            // this.drawmark_events('off');

            //TODO: Доработка
            if (this.error) {
                return;
            }

            if (!name) {
                // Найдем атрибут name
                name = $(event.target).attr('name');
            }
            if (!name) {
                return;
            }

            switch (name) {
                case 'edallpoint':
                    // Если инструмент активный, то отключить
                    if (!GWTK.DomUtil.isActiveElement(event.target)) {
                        GWTK.DomUtil.setActiveElement(event.target);
                        this.task.buttonmethod_edit = name;
                        //this.drawmark_events('on');
                    }
                    else {
                        GWTK.DomUtil.removeActiveElement(event.target);
                        this.task.buttonmethod_edit = null;
                        //this.drawmark_events('off');
                    }
                    break;
                case 'closeobject':
                    this.task.closeobject(false);
                    this.updatedrawcontur('edit');
                    break;
                case 'changedir':
                    this.task.changedirection(-1, 'edit');
                    break;
                case 'editsegment':
                    if (!GWTK.DomUtil.isActiveElement(event.target)) {
                        this.task.extend = true;
                        // Создадим класс макетов
                        if (this.task.mapeditExtendMethods) {
                            this.task.mapeditExtendMethods.set({
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
                                    this.methodsEnabled(event.target);
                                    GWTK.DomUtil.setActiveElement(event.target);
                                }, this),
                                "fn_stop": GWTK.Util.bind(function () {
                                    this.methodsEnabled();
                                    GWTK.DomUtil.removeActiveElement(event.target);
                                }, this)
                            }, true, this.task.panelExtend);
                        }
                    }
                    else {
                        if (this.task.mapeditExtendMethods) {
                            this.task.mapeditExtendMethods.hide();
                            this.task.extend = false;
                        }
                    }
                    break;
                case 'createsubobject':
                    this.createsubobject();
                    break;
                case 'removesubobject':
                    this.removesubobject(this.task.getsubjectnumberByMetrics());
                    break;
                case 'moveobject':
                    // Если инструмент активный, то отключить
                    if (!GWTK.DomUtil.isActiveElement(event.target)) {
                        this.processMoving(name);

                    }
                    else {
                        this.startEditAction();
                        this.task.extend = false;
                    }
                    break;
            }

            $(this.map.eventPane).trigger({type: 'changedata_method', action: this.name});

        },

        //  Старт обработчика режима редактирование
        startEditAction: function () {
            this.task.changeCurrentAction(new GWTK.MapeditorEditingActionExt(this.task, 'editing'));
        },

        /**
         * methodsEnabled - назначение доступости кнопок режимов
         * @param selectorsEnable - массив доступных селекторов (если отсутствует, то все кнопки доступны)
         *
         */
        methodsEnabled: function (selectorsEnable) {
            var tools = this.tools['edit'];
            if (!tools || !tools.buttons) {
                return;
            }
            // Если есть, то его оставим доступным, остальнве нет
            if (selectorsEnable) {
                if (!(selectorsEnable instanceof Array)) {    // Не массив
                    selectorsEnable = [selectorsEnable]
                }
                for (var i = 0; i < selectorsEnable.length; i++) {
                    var el = $(selectorsEnable[i]);
                    if (el && el.length > 0) {
                        for (var j = 0; j < tools.buttons.length; j++) {
                            if (tools.buttons[j].name != el.attr('name')) {
                                $(tools.buttons[j].selector).addClass('disabledbutton');
                            }
                            else {
                                $(tools.buttons[j].selector).removeClass('disabledbutton');
                            }
                        }
                    }
                }
            }
            else {  // Сделать все доступным
                for (var j = 0; j < tools.buttons.length; j++) {
                    $(tools.buttons[j].selector).removeClass('disabledbutton');
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
            this.task.isChange(true);
            this.task.extend = true;
            var currentsubobject = this.editobject.geometry.subjects.length;
            if (this.task.metrics) {
                //this.task.metrics.updatesubjectlist(currentsubobject, this.editobject.geometry.saveJSON(true));
                // this.task.metrics.updatesubjectlist(currentsubobject, this.editobject.geometry.saveJSON(true));
                this.task.metrics.creategrid(this.editobject.geometry.saveJSON(true), this.task.metrics.id, currentsubobject, this.task.metrics.options.format);

            }

            // Если этот обработчик от задачи создания
            this.subjectnumber = currentsubobject;

            this.task.setActiveTask("create");
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

            if (this.task.metrics) {
                // this.task.metrics.updatesubjectlist(0, this.editobject.geometry.saveJSON(true));
                this.task.metrics.creategrid(this.editobject.geometry.saveJSON(true), this.task.metrics.id, 0, this.task.metrics.options.format);
            }

            this.task.history.add('all', null, 0, null, null, null, newgeometry, this.editobject.geometry);
            this.task.isChange(true);
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
            this.task.updatedrawcontur(null, subaction);
        },

        /**
         * Обновление координат точки объекта из класса рисования
         * @method updatepoint
         * @param div {Element} Элемент, содержащий всю информацию о точке
         * @param ui {Object} Объект, содержащий позицию точки { "position": {"left": left, "top": top };
         * @param insert {Boolean} признак вставки новой точки (для серединных точек), иначе обновление существующей
         */
        updatepointByDiv: function (div, ui, insert) {

            // Удалим сервисные линии
            this.drawobject._removeservicelines();

            if (!div || !ui)
                return;

            var geometry = this.editobject.geometry;
            if (!geometry) return;
            var number = this.drawobject.getnumber(div.id);
            if (number < 0) return;
            var subjectnumber = this.drawobject.getsubjectnumber(div.id);

            var point = GWTK.point(ui.position.left, ui.position.top);

            var coord = this.map.tiles.getLayersPointProjected(point);

            // Если выбрана точка в классе топологии, ио взять ее координаты
            var geo;
            if (this.topology.currentPoint) {  // Если имеется выбранная точка, то добавим ее
                geo = this.topology.getpointgeo(this.topology.currentPoint);
                if (!geo)
                    geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
            }
            else {
                geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
            }

            this.task.updateObjectPoint(number, subjectnumber, geo, insert);
        }
        ,

        /**
         * Запустить процесс перемещения объекта
         * @method processMoving
         */
        // ===============================================================
        processMoving: function (name) {

            // Запустить обработчик перемещения
            this.task.extend = true;
            this.task.changeCurrentAction(new GWTK.MapeditorMovingActionExt(this.task, name,
                {
                    fn_complete: GWTK.Util.bind(function () {
                        // Сбросить обработчик
                        this.task.changeCurrentAction();
                        this.processMoving(name);
                    }, this)
                }
            ));
        },

        /**
         * Контекстное меню для точки объекта
         * @method popupmenu
         * @param div {Element} - Родительский элемент
         * @param x {Int} - Координата экрана x
         * @param y {Int} - Координата экрана y
         */
        // ===============================================================
        popupmenu: function (e, div, x, y) {

            e.preventDefault();
            e.stopPropagation();

            // удалить меню и функцию
            $('#' + this.task.popupId).remove();
            // this.popupmenuClose = null;

            if (this.error || !this.editobject || !this.editobject.geometry) {
                return;
            }

            // если это средняя точка
            if (div && div.id &&  div.id.indexOf('center') >= 0) {
                return;  // если это средняя точка)
            }

            this.selectPoint = (div) ? {
                'id' : div.id,
                'domElement' : div
            } : {
                'id' : this.task.selectPoint.id,
                'domElement' : this.task.selectPoint.domElement
            };

            var editobject = this.editobject,
                spatialposition = editobject.spatialposition.toLowerCase(),
                rectdraw = (this.drawpanel) ? this.drawpanel.getBoundingClientRect() : 0,
                left = ((!div) ? (e.clientX - rectdraw.left).toString() : '0') + 'px',
                top  = ((!div) ? (e.clientY - rectdraw.top) .toString() : '0') + 'px';
            if (!isNaN(x)) left = parseInt(x - 5, 10) + 'px';
            if (!isNaN(y)) top = parseInt(y - 5, 10) + 'px';

            var subjectnumber = (this.selectPoint.id) ? this.drawobject.getsubjectnumber(this.selectPoint.id) : this.subjectnumber,
                pcount = editobject.geometry.count(subjectnumber),
                styleDiv = ' style="left:' + left + ';top:' + top + '; cursor: pointer;opacity: 0.9"',
                class_menu = (!div) ? 'menucontext' : 'menupoint',
                deletepoint = (div && pcount > 0) ? this.task.getItemPopup('deletepoint') : '';
            if (!editobject.geometry.isdeletingpoint(subjectnumber))
                deletepoint = '';

            // Заглушка, пока нет других операций над точками
            // if (deletepoint == '' && pcount <= 1 || !spatialposition)
            if (deletepoint == '' && pcount <= 0 || !spatialposition)
                return;

            // Определим номер точки
            var
                // сменить направление
                changedirection = this.isValidOperation('changedirection') ? this.task.getItemPopup('changedirection') : '',
                number = (div) ? this.drawobject.getnumber(div.id) : 0,
                isclosing = this.isValidOperation('closeobject'),
                closeobject = (isclosing) ? this.task.getItemPopup('closeobject') : '',
                line = spatialposition.indexOf('linestring'),
                horizont = (this.selectPoint.domElement && pcount > 1) ? this.task.getItemPopup('horizont') : '',
                vertical = (this.selectPoint.domElement && pcount > 1) ? this.task.getItemPopup('vertical') : '',
                save = (this.isValidOperation('save')) ? this.task.getItemPopup('save') : '',
                cancel = this.task.getItemPopup('cancel'),
                // разрезать линейный
                cutobject = (div && line >= 0 && pcount >= 3 && (!isclosing || (number > 0 && number < pcount - 1))) ?
                        this.task.getItemPopup('cutobject') : '',
                en = GWTK.MapEditorUtil.isEnabledItemMenu(spatialposition, this.graphic),
                // Создать подобъект (только для площадных и линейных)
                createsubobject = (en) ? this.task.getItemPopup('createsubobject') : '',
                // Удалить подобъект (только для площадных и линейных)
                removesubobject = (subjectnumber > 0 && en) ? this.task.getItemPopup('removesubobject') : '';

            // // Найти точку на альтернативном объекте
            // var sourcepoint = '<tr><td width="16px" class="ededmethod_sourcepoint" style="background-repeat:no-repeat;"/> <td id="' + this.task.popupId + '_sourcepoint" style="padding-left:5px;">' + w2utils.lang("Capture the line of the selected object") + '</td></tr>';

            var text =
                '<div id="' + this.task.popupId + '" class=" map-panel-def editTable" ' + styleDiv + ' >' +
                    '<div align="left" class="' + class_menu + '" style="margin-left:5px; margin-top:5px;"></div>' +
                '<div>' +
                '<table cellspacing="2px;" cellpadding="2px" style="width:140px;">' +
                    deletepoint +
                    //sourcepoint +
                    closeobject + // замкнуть
                    cutobject + // разрезать
                    changedirection + // сменить направление
                    createsubobject + // создать подобъект
                    removesubobject + // удалить подобъект
                    horizont +  // горизонтальная линия
                    vertical +  // вертикальная линия
                    save +
                    cancel +
                '</table>' +
                '</div></div>';

            $(this.drawpanel).append(text);

            var $popup = $('#' + this.task.popupId),
                $menupoint = $('.' + class_menu),
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

                // // Функция закрытия меню
                // this.popupmenuClose = function(){
                //     $popupclose.click();
                // };

                $('#' + this.task.popupId + '_deletepoint').click(function (event) {
                    $popupclose.click();
                    if (!div) {
                        w2alert(w2utils.lang("There is no point to remove"));
                        return false;
                    }

                    // удалить точку
                    _that.task.deletepoint(_that.drawobject.getnumber(div.id) + 1, _that.drawobject.getsubjectnumber(div.id), 'edit');
                    _that.updatedrawcontur('edit');
                    return false;
                });

                // $('#' + this.task.popupId + '_sourcepoint').click(function (event) {
                //     $popupclose.click();
                //     if (!div) {
                //         w2alert(w2utils.lang("There is no point to remove"));
                //         return false;
                //     }
                //
                //     // найти ответную точку
                //     _that.task.selectSourceObject(_that.drawobject.getnumber(div.id), _that.drawobject.getsubjectnumber(div.id));
                //     return false;
                // });

                // Замкнуть
                $('#' + this.task.popupId + '_closeobject').click(function (event) {
                    _that.task.closeobject(false, subjectnumber);
                    _that.updatedrawcontur(_that.name);
                    //_that.complete();
                    $popupclose.click();
                    return false;
                });

                // Разрезать
                $('#' + this.task.popupId + '_cutobject').click(function (event) {
                    var newgeometry = _that.editobject.geometry.createcopy();
                    _that.editobject.geometry.cutline(_that.drawobject.getnumber(div.id) + 1, subjectnumber);
                    _that.task.history.add('all', null, subjectnumber, null, null, null, newgeometry, _that.editobject.geometry);
                    _that.task.isChange(true);
                    _that.updatedrawcontur(_that.name);
                    $popupclose.click();
                    return false;
                });

                // Изменить направление
                $('#' + this.task.popupId + '_changedirection').click(function (event) {
                    _that.task.changedirection(subjectnumber, 'edit');
                    $popupclose.click();
                    return false;
                });

                // Создать подобъект
                $('#' + this.task.popupId + '_createsubobject').click(function (event) {
                    _that.createsubobject();
                    $popupclose.click();
                    return false;
                });

                // Удалить подобъект
                $('#' + this.task.popupId + '_removesubobject').click(function (event) {
                    _that.removesubobject(subjectnumber);
                    $popupclose.click();
                    return false;
                });

                // Горизонтальная линия
                $('#' + this.task.popupId + '_horizont').click(function (event) {
                    _that.task.initSelectPoint(_that.selectPoint);
                    _that.onHotKey({
                        'key' : 'H'
                    });
                    $popupclose.click();
                    return false;
                });

                // Вертикальная линия
                $('#' + this.task.popupId + '_vertical').click(function (event) {
                    _that.task.initSelectPoint(_that.selectPoint);
                    _that.onHotKey({
                        'key' : 'V'
                    });
                    $popupclose.click();
                    return false;
                });

                // Сохранение
                $('#' + this.task.popupId + '_save').click(function (event) {
                    $popupclose.click();
                    _that.task.saveClick()
                    return false;
                });
                // Отмена
                $('#' + this.task.popupId + '_cancel').click(function (event) {
                    $popupclose.click();
                    _that.task.isChange(false);
                    _that.task.cancelClick();
                    return false;
                });
            }

            // Отключить события карты
            this.topology.map_events('off');

        },


        /**
         * Проверка валидности операции
         * @param operation - операция
         * @param pointnumber - номер точки с 0
         * @param subjectnumber - номер подобъекта (с 0)
         * @returns {boolean}
         */
        isValidOperation: function(operation, pointnumber, subjectnumber){
            var ret = false;
            if (!this.editobject || !this.editobject.geometry || !operation) {
                return ret;
            }
            var spatialposition = this.editobject.spatialposition,
                pcount = this.editobject.geometry.count(subjectnumber);
            if (!spatialposition || !pcount) {
                return ret;
            }
            switch(operation) {
                case 'closeobject': // Замыкание
                    var pointfirst = this.editobject.geometry.getpoint(1, subjectnumber),
                        pointlast = this.editobject.geometry.getpoint(pcount, subjectnumber);
                    // если линейный или площадной объект и крайние точки не равны
                    if ((spatialposition.indexOf("linestring") >= 0 || spatialposition.indexOf("polygon") >= 0) && pcount > 3
                        && (pointfirst.x != pointlast.x && pointfirst.y != pointlast.y)) {
                        ret = true;
                    }
                    break;
                case 'changedirection': // Смена напрвления цифрования
                    if (spatialposition != 'point' && pcount > 1) {
                        ret = true;
                    }
                    break;
                case 'save':
                    if (this.task._ischange && pcount > 0) {
                        ret = true;
                    }
                    break;
            }

            return ret;
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
                    this.oldgeometry = this.editobject.geometry.createcopy();

                    if (target && target.id && !this.drawobject.isservice(target.id)) {
                        var pointNumber = this.drawobject.getnumber(target.id),
                            subjectNumber = this.drawobject.getsubjectnumber(target.id),
                            iscenter = this.drawobject.iscenter(target.id);
                        if (this.isComplete && (iscenter ||
                            pointNumber != 0 && (pointNumber != (this.editobject.geometry.count(subjectNumber) - 1)))) {
                            return false;
                        }
                    }


                    // Oтключить события карты в топологии
                    this.topology.nomouseover = false;
                    this.topology.map_events('off');

                    $('#' + this.task.popupId).hide();
                    // Если работает обработчик перемещения
                    if (this.map.taskManager._action instanceof GWTK.MapeditorCreatingActionExt)
                        return false;

                    // Отключить обработчики
                    this.drawmark_events('off');

                    if (this.task.buttonmethod_edit == 'edallpoint') {
                        // // Отключить обработчики
                        // this.drawmark_events('off');
                        //  определим ВСЕ близлежашие точки выбранных объектов
                        this.topology.addneartopologypoints();
                    }

                    this.task.selectPoint.domElement = target;
                    this.task.selectPoint.id = target.id;

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

                    if (this.task.buttonmethod_edit == 'edallpoint') {
                        this.topojson = [this.topology.copytopologyobjectJSON(), null];
                        // Запросим параметры виртуальной точки
                        var nearObjectParam = this.topology.getVirtualPointParam();
                        if (nearObjectParam) {
                            // Добавить виртуальную точку в исходный json
                            this.topology.addVirtualPointToInterfaceJSON(nearObjectParam);
                        }

                        this.topology.dragtopologypoints(GWTK.point(ui.position.left, ui.position.top), true);
                        this.topojson[1] = this.topology.copytopologyobjectJSON();

                        // // Включить обработчики
                        // this.drawmark_events('on');
                    }

                    // Включить обработчики
                    this.drawmark_events('on');

                    // Если было вращение
                    if (this.drawobject.drag.rotate) {
                        // Сохранить в историю
                        if (this.oldgeometry) {
                            this.task.history.add('all', null, 0, null, null, null, this.oldgeometry, this.editobject.geometry);
                        }

                        // Нарисовать объект
                        this.task.isChange(true);
                        this.updatedrawcontur(this.name);
                    }

                    // Если было масштабирование
                    if (this.drawobject.drag.scale >= 0) {
                        // Сохранить в историю
                        if (this.oldgeometry) {
                            this.task.history.add('all', null, 0, null, null, null, this.oldgeometry, this.editobject.geometry);
                        }

                        // Нарисовать объект
                        this.task.isChange(true);
                        this.updatedrawcontur(this.name);
                    }

                    this.topology.map_events('on');
                    this.oldgeometry = null;
                    break;

                case 'drag':

                    if (offset) {
                        // Подсветить близлежащий объект и точку
                        var ret = this.topology.drawOverObject(ui, {
                            isobjectpoint: this.task.options.capturePoints,
                            isvirtualpoint: this.task.options.captureVirtualPoints
                        });
                        if (ret) {
                            this.drawobject.hidepoint(target);
                        }

                        if (this.task.buttonmethod_edit == 'edallpoint') {
                            //  Отрисовать объекты топологии
                            this.topology.dragtopologypoints(GWTK.point(ui.position.left, ui.position.top));
                        }
                    }
                    break;

            }

            return true;

        },

        /**
         * Обработка точки при продолжении цифровния
         */
        do_continue: function (e) {
            if (this.isComplete) {
                return;
            }

            if (e && e.point) {
                // Добавим точку и перерисуем объект
                var point = GWTK.point(e.point.x, e.point.y),
                    coord = this.map.tiles.getLayersPointProjected(point),
                    geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);

                // Если выбрана точка в классе топологии, ио взять ее координаты
                if (this.topology.currentPoint) {  // Если имеется выбранная точка, то добавим ее
                    geo = this.topology.getpointgeo(this.topology.currentPoint);
                    if (!geo)
                        geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
                }
                else {
                    geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
                }

                if (e.point.pointnumber != 0) {
                    e.point.pointnumber += 1;
                }
                this.task.updateObjectPoint(e.point.pointnumber, e.point.subjectnumber, geo, true);

                this.draw();
            }

        },

        /**
         * Включение/отключение обработчиков на точки
         * @method drawmark_events
         * @param type {String} Флажок 'on' - назначить, 'off' - отключить
         */
        // ===============================================================
        drawmark_events: function (type) {
            $(this.map.eventPane).off('drawmark_mouseout', this.onDrawmark_mouseout);
            $(this.map.eventPane).off('drawmark_mouseover', this.onDrawmark_mouseover);
            if (type == 'on') {
                $(this.map.eventPane).on('drawmark_mouseout', this.onDrawmark_mouseout);
                $(this.map.eventPane).on('drawmark_mouseover', this.onDrawmark_mouseover);
            }

        },

        /**
         * Обработчик mouseout-события точки
         * @method onDrawmark_mouseout
         * @param event {Object} Событие
         */
        // ===============================================================
        onDrawmark_mouseout: function (event) {
            this.task.initSelectPoint();

            if (!this.topology) return;
            this.task.setStatusBar(w2utils.lang("Edit the chosen object, moving contour points") + '. ' + w2utils.lang("Save") + " (Сtrl+S)");
            this.topology.cleardrawtopogroup();
        },

        /**
         * Обработчик mouseovert-события точки
         * @method onDrawmark_mouseover
         * @param event {Object} Событие
         */
        // ===============================================================
        onDrawmark_mouseover: function (event) {

            // Определим точку на объекте  и выполним операцию от горячих клавиш
            if (event && event.sender) {
                var id = event.sender.getAttributeNS(null, 'id');
                if (id.indexOf('rotate') < 0 && id.indexOf('_bop_') < 0) {
                    this.task.setStatusBar(w2utils.lang("Edit the chosen object, moving contour points") + '. ' + w2utils.lang("Save") + " (Сtrl+S)");
                    if (id.indexOf('mop') >= 0 && !this.drawobject.iscenter(id)) { // точка объекта метрики
                        // Если уже был и разные id
                        if (this.task.selectPoint.id != id){
                            $(this.task.selectPoint.domElement).mouseout();
                        }
                        this.task.selectPoint.domElement = event.sender;
                        this.task.selectPoint.id = id;
                    }
                }
            }

            if (!this.topology) {
                return;
            }

            // Если режим топологии, подсветить близлежашие объекты
            if (this.task.buttonmethod_edit == 'edallpoint') {
                var id = event.sender.id, prefix = this.drawobject.pointprefix + 'mop_';
                if (!id || id.indexOf(prefix) < 0)
                    return;
                var point = this.drawobject.getpositionByPointId(id);
                if (point)
                    this.topology.drawtopologyobjects(GWTK.point(point.x, point.y), id);
            }
        },

        /**
         * Нажатие горячей клавиши
         * @param hotkey
         * @param fn_callback
         */
        onHotKey: function(hotkey, fn_callback){

            if (this.task.selectPoint.id && hotkey) {
                 // console.log('onHotKey: ok');
                this.hotkey = JSON.parse(JSON.stringify(hotkey));

                var subjectnumber = this.drawobject.getsubjectnumber(this.task.selectPoint.id),
                    pointnumber = this.drawobject.getnumber(this.task.selectPoint.id),
                    flag;
                switch(this.hotkey.key){
                    case 'V':   // V - вертикальная линия (не меняем x)
                        flag = 'y';
                        break;
                    case 'H':    // H - горизонтальная линия
                        flag = 'x';
                        break;
                    case 'L':    // L - замкнуть объект
                        if (this.isValidOperation('closeobject')) {
                            this.task.closeobject(false, (this.task.selectPoint.id) ? this.drawobject.getsubjectnumber(this.task.selectPoint.id) : null);
                            this.updatedrawcontur('edit');
                        }
                        break;
                    case 'D':    // D - Изменить направление
                        if (this.isValidOperation('changedirection')) {
                            this.task.changedirection(subjectnumber, 'edit');
                        }
                        break;
                }
                if (flag) {
                    this.map.trigger({ phase: 'before', type: 'documentmouseup', target: 'map', originalEvent: $.Event('documentmouseup') });
                    this.updatePointHotKey(pointnumber, subjectnumber, flag);
                }
            }

            this.hotkey = null;
            if (fn_callback) {
                fn_callback();
            }

        },

        /**
         * Обновление точки метрики при нажатии горячей клавиши
         * @param pointnumber - номер точки
         * @param subjectnumber - номер подобъекта
         * @param flag - ('x' или 'у')
         */
        updatePointHotKey: function(pointnumber, subjectnumber, flag){
            if (!this.editobject || !this.editobject.geometry) {
                return '';
            }
            // Координаты текущей точки
            var point,
                count = this.editobject.geometry.count(subjectnumber),
                pointnew = this.editobject.geometry.getpoint(pointnumber + 1, subjectnumber);

            if (pointnumber == 0) {
                // Если объект замкнут, то работаем с предпоследней точкой
                var pointend = this.editobject.geometry.getpoint(this.editobject.geometry.count(), subjectnumber);
                if (pointnew.x == pointend.x && pointnew.y == pointend.y) {
                    point = this.editobject.geometry.getpoint(this.editobject.geometry.count() - 1, subjectnumber);
                }
            }
            else {
                point = this.editobject.geometry.getpoint(pointnumber, subjectnumber);
            }

            if (point) {
                if (flag == 'x') { // Обновим координату х
                    pointnew.x = point.x;
                }
                else {
                    if (flag == 'y') { // Обновим координату y
                        pointnew.y = point.y;
                    }
                }
                this.task.updateObjectPoint(pointnumber, subjectnumber, [pointnew.x, pointnew.y]);
            }

            // this.task.updateObjectPoint(pointnumber, subjectnumber, [pointnew.x, pointnew.y]);
            // if (pointnumber > 0) {
            //     // найдем координаты предыдущей точки
            //     var point = this.editobject.geometry.getpoint(pointnumber, subjectnumber);
            //     var pointnew = this.editobject.geometry.getpoint(pointnumber + 1, subjectnumber);
            //     if (flag == 'x') { // Обновим координату х
            //         pointnew.x = point.x;
            //     }
            //     else {
            //         if (flag == 'y') { // Обновим координату y
            //             pointnew.y = point.y;
            //         }
            //     }
            //
            //     this.task.updateObjectPoint(pointnumber, subjectnumber, [pointnew.x, pointnew.y]);
            // }
        },

        /**
         * Нужно ли принудительно завершать создание объекта
         * @method iscomplete
         * @returns {Boolean} true - нужно принудительно завершить создание
         */
        // ===============================================================
        iscomplete: function (editobject) {
            return this.isComplete = GWTK.MapEditorUtil.iscomplete(editobject);
        },

        // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        // Функции для расширенных режимов
        // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        /**
         * method_deletesegment - старт удаления участка
         */
        method_deletesegmentStart: function () {
            this.processSelectObjectPoints = new GWTK.SelectNearesObjectPointsExt(this.task, this.map, {
                name: this.task.extraAction,
                mapobject: this.editobject,
                pointscount: 3,
                fn_callback: GWTK.Util.bind(function (selectObjectPoints) {

                    // параметры для удаления точек
                    if (selectObjectPoints && selectObjectPoints.length == 3) {
                        // удалить точки
                        this.task.deletesegment([selectObjectPoints[0].id[0] + 1, selectObjectPoints[1].id[0] + 1, selectObjectPoints[2].id[0] + 1], selectObjectPoints[1].subject + 1, 'edit');
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

            if (this.task.mapeditExtendMethods) {
                this.task.mapeditExtendMethods.reset();
            }
            this.startEditAction();
        },


        /**
         * method_movesegment - перемещение участка
         */
        method_movesegmentStart: function () {
            this.processSelectObjectPoints = new GWTK.SelectNearesObjectPointsExt(this.task, this.map, {
                name: this.task.extraAction,
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
                                            this.task.offsetsegment([selectObjectPoints[0].id[0] + 1, selectObjectPoints[1].id[0] + 1, selectObjectPoints[2].id[0] + 1], selectObjectPoints[1].subject + 1, deltaGeo, 'edit');
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

            if (this.task.mapeditExtendMethods) {
                this.task.mapeditExtendMethods.reset();
            }

            this.startEditAction();
        },


        /**
         * method_copysegmentStart - копированеи участка
         */
        method_copysegmentStart: function () {
            // Выбрать точки на объеке
            this.processSelectObjectPoints = new GWTK.SelectNearesObjectPointsExt(this.task, this.map, {
                name: this.task.extraAction,
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
                        this.processSelectObject = this.task.selectObject(GWTK.Util.bind(
                            function (ui) {
                                if (!ui.layer || !ui.gid)
                                    return false;
                                // Ищем объект
                                var editobject = this.map.objectManager.selectedFeatures.findobjectsById(ui.layer, ui.gid);
                                if (editobject) {
                                    editobject = editobject.clone();
                                    this.processSelectObjectPoints = new GWTK.SelectNearesObjectPointsExt(
                                        this.task, this.map,
                                        {
                                            name: this.task.extraAction,
                                            mapobject: editobject,
                                            pointscount: 3,
                                            fn_callback: GWTK.Util.bind(
                                                function (selectObjectPointsOut) {
                                                    if (selectObjectPointsOut && selectObjectPointsOut.length == 3) {

                                                        var newsegment = editobject.geometry.createsegment(
                                                            [selectObjectPointsOut[0].id[0] + 1, selectObjectPointsOut[1].id[0] + 1, selectObjectPointsOut[2].id[0] + 1], selectObjectPointsOut[1].subject + 1);

                                                        // Обновим метрику исходного объекта
                                                        this.task.updatesegment([selectObjectPointsIn[0].id[0] + 1, selectObjectPointsIn[1].id[0] + 1, selectObjectPointsIn[2].id[0] + 1], selectObjectPointsIn[1].subject + 1, newsegment, 'edit');

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
                            this.task.extraAction,
                            w2utils.lang("Copy part") + ': ' + w2utils.lang("Select the highlighted object on the map"));
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

            // Сбросим выделенные объекты карты
            GWTK.Util.clearselectedFeatures(this.map);

            if (this.processSelectObjectPoints) {
                this.processSelectObjectPoints.stop();
                this.processSelectObjectPoints.destroy();
                this.processSelectObjectPoints = null;
            }
            if (this.task.mapeditExtendMethods) {
                this.task.mapeditExtendMethods.reset();
            }

            this.startEditAction();
        }


    };
    GWTK.Util.inherits(GWTK.MapeditorEditingActionExt, GWTK.MapAction);


    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // Обработчик перемещения объекта карты   
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    GWTK.MapeditorMovingActionExt = function (task, name, params) {

        GWTK.MapAction.call(this, task, name);           // родительский конструктор     

        // Не отображать объекты карты в диалоге выбора объектов
        this.showInfoOfSelectedObjects = false;

        this.map = this.getMap();
        if (!this.map) return;

        // Перемещаемые объекты
        this.editobjects = (this.task.editobjects && this.task.editobjects.length > 0) ? this.task.editobjects : null;  // Редактируемый объект
        if (!this.editobjects) return;

        this.drawobject = this.task.drawobject;
        if (!this.drawobject) return;
        this.drawpanel = this.task.drawpanel;
        if (!this.drawpanel) return;

        // Запросим объекты окружения, если их нет
        this.topology = this.task.topology;
        if (!this.topology) return;

        // Статус бар
        this.setStatusBar = this.task.setStatusBar;
        this.clearStatusBar = this.task.clearStatusBar;

        this.error = false;

        if (params) {
            this.params = params;
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

    };

    GWTK.MapeditorMovingActionExt.prototype = {

        /**
         * Замыкание контекста
         * @method bind
         */
        // ===============================================================
        bind: function () {
            this.onMouseDown = GWTK.Util.bind(this.onMouseDown, this);
            this.onMouseUp = GWTK.Util.bind(this.onMouseUp, this);
            this.onMouseMove = GWTK.Util.bind(this.onMouseMove, this);
            this.onKeyDown = GWTK.Util.bind(this.onKeyDown, this);
            this.drawobject.addPopupmenu(GWTK.Util.bind(this.task.onContextMenu, this));
        },

        /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
         * @method set
         * @param options {Object} параметры обработчика
         */
        // ===============================================================
        set: function (options) {
            if (this.error) {
                return;
            }

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
            this.map.on({type: 'mousedown', target: "map", phase: 'before', sender: this}, this.onMouseDown);
            this.map.on({type: 'mouseup', target: "map", phase: 'before', sender: this}, this.onMouseUp);

            // События на нажатие клавиш
            this.map.on({type: "keydown", target: "map", phase: 'before', sender: this}, this.onKeyDown);

            this.task.setStatusBar(w2utils.lang("Press and move, retaining clicked a mouse button") + '. ' + w2utils.lang("Esc - cancel the operation, Ctrl + S - save the object"));

            // Нажать кнопку
            if (this.params && this.params.selectorbutton) {
                GWTK.DomUtil.setActiveElement(this.params.selectorbutton);
            }

        },

        /**
         * Сбросить настройки (отключение обработчиков событий, инициализация флажков и др.)
         * @method clear
         */
        // ===============================================================
        clear: function () {
            if (this.error) {
                return;
            }
            this.task.zIndexRestore();
            this.task.clearStatusBar();

            // Назначим события нажатия мыши
            this.map.off({type: 'mousedown', target: "map", phase: 'before', sender: this}, this.onMouseDown);
            this.map.off({type: 'mouseup', target: "map", phase: 'before', sender: this}, this.onMouseUp);
            this.map.off({type: 'mapdblclick', target: "map", phase: 'before', sender: this}, this.task.onDblClick);

            // // Двойной клик
            // $(document).off(GWTK.dblclick,  this.task.onDocumentDblClick);

            // События на нажатие клавиш
            this.map.off({type: "keydown", target: "map", phase: 'before', sender: this}, this.onKeyDown);

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
            if (this.error) {
                return true;
            }
            return this.task.canClose();
        },

        // Функция отрисовки перемещаемого объекта
        draw: function () {
            if (this.error) {
                return;
            }

            if (this.task.isGroupProcess) {
                this.drawobject.drawGEOJSON(this.task.drawSelectFeatures.mapobjects, this.task.drawSelectFeatures.mapobjectsToGeoGSON(true), this.topology.svgDraw, false, true);
            }
            else {
                this.drawobject.drawGEOJSON(this.editobjects, this.editobjects[0].saveJSON(), this.topology.svgDraw, false, true);
            }

            this.drawpanel.style.cursor = 'move';
        },

        /**
         * Событие при нажатии мыши в режиме перемещения объекта
         * @method  onMouseDown
         * @param event {Object} Событие
         */
        // ==============================================s=================
        onMouseDown: function (event) {
            if (this.error || !event) {
                return;
            }

            var e = event.originalEvent;
            if (!e) return;
            if (e.target && (e.target.nodeName != 'svg' && e.target.id != 'topology_canvas'))
                return true;

            // Запомним положение точки
            this.movedrag.setOffsetPoint(GWTK.point(e.clientX, e.clientY));
            // Событие на перемещение мыши
            this.map.on({type: 'mousemove', target: "map", phase: 'before', sender: this}, this.onMouseMove);

            // Ловим нажатие мыши для событий задачи редактора
            this.task.leftButtonDown = true;

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
            if (this.error || !event) {
                return;
            }

            var e = event.originalEvent;
            if (!e) return;

            // отобразить координаты мыши
            e.map = this.map;
            GWTK.DomEvent.getMouseGeoCoordinates(e);

            e.map.tiles._onMouseDown();
            var rect = this.map.mapPane.getBoundingClientRect();
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
                this.map.move(-(this.movedrag.dx), -(this.movedrag.dy));

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
            if (this.error || !event) {
                return;
            }

            this.map.off({type: 'mousemove', target: "map", phase: 'before', sender: this}, this.onMouseMove);

            var e = event.originalEvent;
            if (!e) return;

            this.drawpanel.style.cursor = 'default';
            this.task.offsetpoints(this.movedrag.x, this.movedrag.y, true, this.name);

            // Ловим нажатие мыши для событий задачи редактора
            this.task.leftButtonDown = false;

            event.stopPropagation();

            // Завершить процесс перемещения
            this.complete();

            return false;
        },

        onKeyDown:function (event) {

            var e = (event && event.originalEvent) ? event.originalEvent : (event ? event : window.event);

            // Блокируем стандаритные операции браузера
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.returnValue = false;

        },

        /**
         * Завершить процесс создания метрики объекта
         * @method complete
         */
        // ===============================================================
        complete: function () {
            if (this.error) {
                return;
            }
            // Отжать кнопку
            if (this.params && this.params.selectorbutton) {
                GWTK.DomUtil.removeActiveElement(this.params.selectorbutton);
            }
            if (this.params.fn_complete && $.isFunction(this.params.fn_complete)) {
                this.params.fn_complete();
            }
        },

        /**
         * Обновиление отображения Wms слоев при сдвиге мыши за пределы окна
         * @method wmsDrawing
         */
        // ===============================================================
        wmsDrawing: function () {
            if (this.error) {
                return;
            }

            var coord = this.map.tiles.getLayersCenterProjected();
            if (coord != null) {
                this.map.setMapCenter(coord);
                this.map.tiles.wmsManager.wmsDrawing();
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

            if (this.error || !this.drawobject || !this.drawpanel) {
                return;
            }

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
                        this.task.isChange(true);
                        this.updatedrawcontur(this.name);
                    }

                    // Если было масштабирование
                    if (this.drawobject.drag.scale >= 0) {
                        // Нарисовать объект 
                        this.task.isChange(true);
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
            this.task.updatedrawcontur(null, subaction);
        }

    };
    GWTK.Util.inherits(GWTK.MapeditorMovingActionExt, GWTK.MapAction);


    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //  Обработчик:  Выбор нескольких точек объекта   GWTK.SelectNearesObjectPointsExt
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    /**
     * Выбор ближайших точек на объекте
     * Выбор производится щелчком указателя на карте
     * Между указателем и точкой на объекте отображается пунктирная линия
     * @class GWTK.SelectNearesObjectPointsExt
     * @param map {object} - карта GWTK.Map
     * @param options {object} - параметры
     * {object:GWTK.mapobject, pointscount:pointscount, fn_callback:function}
     * options.mapobject {GWTK.mapobject} - объект, с которым производится действие - обязательный параметр
     * options.pointscount - количество выбираемых точек
     * options.fn_callback {function} - функция обратного вызова при выполнении действия или сбросе; передаёт массив объектов:
     *                                      success {boolean} признак успеха
     *                                      point {GWTK.Point} точка на карте (при успехе)
     *                                      geo {GWTK.LatLng} координаты точки (при успехе)
     *                                      subject {number} индекс подобъекта или -1, если внешний контур
     *                                      id {array} массив индексов точек объекта (1 точка или 2, если на нормали)
     *                                      type {string} 'point' или 'normal', в засивимости от положения точки
     * option.name (String) - расширение к названию обработчика
     */
    GWTK.SelectNearesObjectPointsExt = function (task, map, options) {

        this.toolname = 'selectNearesObjectPoints';
        this.error = true;

        this.map = map;
        if (!this.map || this.map instanceof GWTK.Map == false)
            return;
        this.task = task;
        if (!this.task)
            return;

        this.options = options || {};

        // Обязательный параметр объект - экземпляр GWTK.mapobject
        if (typeof this.options.mapobject !== 'object' || !(this.options.mapobject instanceof GWTK.mapobject)) {
            throw 'GWTK.SelectNearesObjectPointsExt: Ошибка! Объект не указан или не является объектом карты.';
        }

        this.error = false;

        // Класс выделения объектов для отрисовки, чтоб не нагружать стандартный
        this.drawSelectFeatures = new GWTK.selectedFeatures(this.map, null,
            {
                "stroke": "#159cba",
                "stroke-width": "3px",
                "stroke-opacity": "0.85",
                "vector-effect": "non-scaling-stroke",
                "fill": "gray",
                "background": "",
                "background-size": "auto auto",
                "fill-opacity": "0.3",
                "font-family": "Verdana",
                "font-size": "12px",
                "letter-spacing": "1",
                "startOffset": "2%",
                "stroke-dasharray": "10",
                "text": ""
            }
        );
        this.drawSelectFeatures.init();
        if (this.options.mapobject) {
            this.drawSelectFeatures.add(this.options.mapobject);
            this.drawSelectFeatures.mapobjects[this.drawSelectFeatures.mapobjects.length - 1].geometry.count();
        }

        this.start();
    };

    GWTK.SelectNearesObjectPointsExt.prototype = {

        clear: function () {
            this.selectObjectPoints = [];
            this.NearestPointAction = null;
        },

        destroy: function () {
            // Класс отрисовки объектов удалить
            this.drawSelectFeatures.destroy();
            this.clear();
        },

        start: function () {
            this.clear();
            this.drawSelectFeatures.drawcontour(this.drawSelectFeatures.mapobjects[this.drawSelectFeatures.mapobjects.length - 1], true, true);
            this.setNearestPointAction(this.drawSelectFeatures.mapobjects[this.drawSelectFeatures.mapobjects.length - 1], GWTK.Util.bind(this.onSelectObjectPointsClick, this));
        },

        stop: function () {
            if (this.NearestPointAction) {
                if (this.task.action) {
                    if (this.map.closeAction()) {
                        this.task.action = null;
                    }
                }

                this.clear();
            }
        },

        /**
         * Запустить процесс выбора одной точки объекта
         * @method setNearestPointAction
         * @param nearestPointAction {Object}  Переменная для хранени action
         * @param mapobject {Object}  Объект карты, на котором выбирается точка
         * @param fn_callback {Function}  - callback функция
         */
        // ===============================================================
        setNearestPointAction: function (mapobject, fn_callback) {
            this.map.statusbar.set(w2utils.lang("Select point") + " " + (this.selectObjectPoints.length + 1) + '...');

            this.NearestPointAction = new GWTK.NearestPointAction(this.task, this.map, {
                name: this.toolname + (this.options.name || ''),
                object: mapobject,
                mode: 'point',
                svgOptions: {  // настройки для графики
                    'stroke-dasharray': '2,2'
                },
                fn_callback: fn_callback
            });

            if (this.map.setAction(this.NearestPointAction)) {
                GWTK.DomUtil.removeActiveElement(".button-action");
                this.NearestPointAction.task.action = this.NearestPointAction;
            }
        },

        /**
         * Событие на выбор точки на объекте
         * @method  onSelectObjectPointtClick
         * @param success {boolean} - признак успеха
         * @param point {GWTK.Point} - точка на карте (при успехе)
         * @param geo {GWTK.LatLng} - координаты точки (при успехе)
         */
        // ===============================================================
        onSelectObjectPointsClick: function (ui) {
            if (ui.success) {
                var mapobject = this.drawSelectFeatures.mapobjects[this.drawSelectFeatures.mapobjects.length - 1];
                if (this.options.pointscount != this.selectObjectPoints.length) {

                    if (!this.selectObjectPoints.length || ui.subject + 1 === this.selectObjectPoints[0].subject + 1) {
                        // Не добавлять точку, которая уже есть
                        var find = false;
                        for (var i = 0; i < this.selectObjectPoints.length; i++) {
                            if (this.selectObjectPoints[i].id[0] + 1 == ui.id[0] + 1) {
                                find = true;
                            }
                        }
                        if (!find) {
                            this.selectObjectPoints.push(ui);
                        }
                    }

                    if (this.options.pointscount != this.selectObjectPoints.length) {
                        this.setNearestPointAction(mapobject, GWTK.Util.bind(this.onSelectObjectPointsClick, this));
                    }
                    else {
                        this.map.statusbar.clear();

                        // Убрать из списка
                        this.drawSelectFeatures.remove(mapobject);

                        // Вызвать callback функцию
                        if (this.options.fn_callback) {
                            return this.options.fn_callback(this.selectObjectPoints.slice());
                        }

                        // Сбросить набор выбранных точек
                        this.destroy();
                    }
                }
            }
        }

    };



    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // Задача Сшивка объектов карты
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    // Задача Перемещение объекта карты
    GWTK.MapeditorMerging = function (task, map, params) {
        // Переменные класса
        this.toolname = 'MapeditorMerging';

        this.error = true;

        this.map = map;
        if (!this.map || this.map instanceof GWTK.Map == false) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.task = task;
        if (!this.task)
            return;

        this.params = params || {};

        this.drawobject = task.drawobject;
        if (!this.drawobject) return;
        // Запросим объекты окружения, если их нет
        this.topology = task.topology;
        if (!this.topology) return;

        this.selectobjectOne = (this.params.selectobjectOne) ? this.params.selectobjectOne.clone() : null;
        this.selectobjectTwo = (this.params.selectobjectTwo) ? this.params.selectobjectTwo.clone() : null;
        this.message = '';

        // Замыкание контекста
        this.bind();

        this.error = false;

        this.set();
    };

    GWTK.MapeditorMerging.prototype = {

        /**
         * Инициализация параметров класса
         * @method initparam
         */
        // ===============================================================
        set: function (param) {

            // Сброс выделения, если нет объекта на входе
            if (!this.selectobjectOne && !this.selectobjectTwo) {
                GWTK.Util.clearselectedFeatures(this.map);
            }

            if (this.selectobjectOne && this.selectobjectTwo &&
                this.canEditObject(this.selectobjectOne) && this.canEditObject(this.selectobjectTwo)) {
                this.task.drawSelectFeatures.add(this.selectobjectOne);
                this.task.drawSelectFeatures.add(this.selectobjectTwo);
                // Если подлежит редактированию
                this.setMerge();
            }
            else {
                if (!this.action) {
                    this.message = w2utils.lang('Select source object');
                    this.selectObject();
                }
            }
            return true;

        },

        /**
         * Разрушить класс
         */
        destroy: function(){
            if (this.selectobjectOne){
                this.selectobjectOne.clear();
                this.selectobjectOne = null;
            }
            if (this.selectobjectTwo) {
                this.selectobjectTwo.clear();
                this.selectobjectTwo = null;
            }
        },

        /**
         * Замыкание контекста
         * @method bind
         */
        // ===============================================================
        bind: function () {
            this.setselectlayers = GWTK.Util.bind(this.setselectlayers, this);
            this.onDataLoaded = GWTK.Util.bind(this.onDataLoaded, this);
        },

        // назначить слои для выделения
        setselectlayers: function () {
            if (!this.selectobjectOne)
                return this.task.setselectlayers(this.noGraphic);
            else
                return [this.selectobjectOne.maplayerid];
        },

        /**
         * Нажатие на кнопку редактирования
         * @method clickCreating
         */
        // ===============================================================
        selectObject: function () {
            this.noGraphic = true;

            // Закроем текущий обработчик
            this.task.changeCurrentAction();

            var selectMapObjectActionHover = {
                fn_setselectlayers: this.setselectlayers,
                message: this.message,
                objlocal: [0, 1, 4],
                layerscodelist: []
                },

                selectMapObjectAction = {
                    show: false,
                    sequence: true,
                    objlocal: [0, 1, 4],
                    layerscodelist: [],
                    fn_setselectlayers: this.setselectlayers,
                    fn_isCorrectObject: GWTK.Util.bind(this.task.iseditinglayer_object, this.task),
                    message: this.message
                };

            // Если первый объект уже выбран
            if (this.selectobjectOne) {
                selectMapObjectActionHover.layerscodelist.push({
                    layerid: this.selectobjectOne.maplayerid,
                    codelist: [this.selectobjectOne.code]
                });
                selectMapObjectActionHover.objlocal = [GWTK.classifier.prototype.getlocalByName(this.selectobjectOne.spatialposition)]

                selectMapObjectAction.objlocal = [GWTK.classifier.prototype.getlocalByName(this.selectobjectOne.spatialposition)];
                selectMapObjectAction.layerscodelist.push({ layerid: this.selectobjectOne.maplayerid, codelist: [this.selectobjectOne.code] });
            }

            this.task.selectObject(
                GWTK.Util.bind(this.onFeatureListClick, this),
                null,
                null,
                {
                    selectMapObjectActionHover: selectMapObjectActionHover,
                    selectMapObjectAction: selectMapObjectAction
                }
            );

        },


        /**
         * Событие на выбор объекта в списке выделенных объектов
         * @method  onFeatureListClick
         * @param ui {Object} Событие
         */
        // ===============================================================
        onFeatureListClick: function (ui) {
            if (!ui) {
                return;
            }
            var selectobject = this.task.onFeatureListClickEvent(ui);

            if (selectobject) {
                // Проверим на возможность редактирование
                var maplayerid = this.task.canEditObject(selectobject);
                if (maplayerid){
                    // Добавим в список объектов
                    this.task.drawSelectFeatures.add(selectobject);
                    this.task.drawSelectFeatures.drawSelectedObjects(true, null, true);

                    if (!this.selectobjectOne)
                        this.selectobjectOne = this.task.drawSelectFeatures.mapobjects[0];
                    else
                        this.selectobjectTwo = this.task.drawSelectFeatures.mapobjects[1];

                    if (this.selectobjectOne && !this.selectobjectTwo) {
                        this.message = w2utils.lang('Select editing object');
                        this.selectObject();
                    }
                    else {
                        this.setMerge();
                    }
                }
                else {
                    this.selectObject();
                }
             }
        },

        /**
         * Установка объекта для редактирования
         * @method setMerge
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
                        , "Precision": (this.task.options.topology.limit).toString()
                    }, false);
                    return;
                }
            }
        },

        // обработчик ответа сервера
        onDataLoaded: function (response) {
            this.task._isRestore = false;

            if (!response) return;
            response = response.replace(/\r|\n/g, '');  // удалить перенос строки, перенос каретки

            if (response.indexOf('ExceptionReport') !== -1) {
                console.log(response);
                alert(w2utils.lang('Can not merging selected objects!'));
            }
            else {
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
                }
            }

            // Перезапустить задачу
            this.task.restoreTaskTimeout();

        }

    };


}
