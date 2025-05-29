/// <reference path="drawingobject.js" />
/************************************* Соколова  ***** 05/05/21 ****
************************************** Нефедьева ***** 26/09/17 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2016              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                      Редактор объектов карты                     *
*                      Режим создания объекта карты                *
*                                                                  *
*******************************************************************/
if (window.GWTK) {

    // Задача Создания объекта в редакторе карты   
    // taskservice - сервисная задача, которая запустила задачу создания
    GWTK.MapeditorCreatingTask = function (id, map, param, bt_selector, context, taskservice, subjectnumber, selectobject) {
        this.error = true;

        if (!context || context instanceof GWTK.mapeditorTask == false)
            return;
        this.mapeditorTask = context;
        this.topology = context.topology;

        this.drawobject = context.drawobject;
        if (!this.topology || !this.drawobject)
            return;

        // Сервисная задача, которая должна быть восстановлена по завершению данной
        if (taskservice) 
            this.taskservice = taskservice;

        this.subjectnumber = subjectnumber ? subjectnumber : 0;
        if (this.subjectnumber == 0)
            this.caption = w2utils.lang("Create object");
        else 
            this.caption = w2utils.lang("Create contour");

        // Переменные класса
        this.toolname = 'mapeditorCreatingTask';
        this.bt_selector = bt_selector;
        if (!map) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        this.map = map;                           // объект карты
        this.param = param;
        this.id = (id) ? id : Math.random();      // уникальный идентификатор объекта
        this.selectobject = selectobject;

        this.buttonmethod_create = null;
        this.editobject = null;
        this.lastObject = null;                   // Последний создаваемый объект

        // родительский конструктор     
        GWTK.MapTask.call(this, map);         

        this.setStatusBar = this.mapeditorTask.setStatusBar;
        this.clearStatusBar = this.mapeditorTask.clearStatusBar;

        // Идентификаторы компонентов
        this.selectobjectsId = this.mapeditorTask.selectobjectsId;
        this.selectgraphobjectsId = this.mapeditorTask.selectgraphobjectsId;

        // замкнуть контекст вызова функций
        this.bind();

        if (!this.init())
            return;

        this.error = false;
    };

    GWTK.MapeditorCreatingTask.prototype = {

        /**
         * ИНИЦИАЛИЗАЦИЯ
         */
        init: function () {
            var mapeditorTask = this.mapeditorTask;
            if (!mapeditorTask) return;

            if (!this.subjectnumber) {
                // Очистим историю
                mapeditorTask.history.clear();
                mapeditorTask.ischange(false);

                // Сброс выделения
                if (!this.selectobject)
                    this.map.handlers.clearselect_button_click();

                // Обновим слои для редактирования
                mapeditorTask.setlayers(mapeditorTask.maplayerid);
                if (!mapeditorTask.maplayerid || !mapeditorTask.layer) {
                    w2alert(w2utils.lang('There are no layers of editing'));
                    return;
                }

                // Создание без выбора кода объекта
                if (this.selectobject) {
                    this.createAutonomous(this.selectobject);
                }
                else {
                    // Запросим легенду карты
                    if (!(mapeditorTask.layer instanceof GWTK.graphicLayer)) {
                        // Проверим в заголовке, есть ли легенда карты
                        var ehead = document.getElementsByTagName('head');
                        // if ($(ehead).find("#legendclassif_" + mapeditorTask.layer.xId).length == 0) {
                        if (mapeditorTask.layer.classifier && $(ehead).find("#legendclassif_" + mapeditorTask.layer.classifier.layerid).length == 0) {
                            mapeditorTask.layer.classifier.legend = null;
                            mapeditorTask.layer.classifier.rscobjects = new Array();
                        }
                    }
                    var legend = mapeditorTask.layer.classifier.legend;
                    if (legend) {
                        this.initSelectObjects(legend);
                    }
                    else {
                        this.getLegend(mapeditorTask.layer);
                    }
                }
            }
            else {
                // Продолжение создания
                this.startCreation(this.subjectnumber);
            }

            return true;
        },

        // Разрушение задачи
        destroy: function () {
            if (this.map) {
                $(this.map.eventPane).off('loadclassifier', this.onLoadClassifier);
                $(this.map.eventPane).off('loadclassifierError', this.onLoadClassifierError);
                $(this.map.eventPane).off('geolocationtick', this.onGeolocationTick);
                $(this.map.eventPane).off('controlbuttonclick', this.onControlButtonClick);
            }
            if (this.mapeditorTask)
                this.mapeditorTask.clear();
            this.removepaneSelectObjects();
        },


        /**
        * Замыкание контекста 
        * @method bind
        */
        // ===============================================================
        bind: function () {
            this.onLoadClassifier = GWTK.Util.bind(this.onLoadClassifier, this);
            this.onLoadClassifierError = GWTK.Util.bind(this.onLoadClassifierError, this);
            this.onGraphicCreateClickable = GWTK.Util.bind(this.onGraphicCreateClickable, this);
            this.onGeolocationTick = GWTK.Util.bind(this.onGeolocationTick, this);
            this.onControlButtonClick = GWTK.Util.bind(this.onControlButtonClick, this);
        },

        /**
        * Запустить процесс создания объекта по существующим параметрам
        * @method setCreation
        */
        // ===============================================================
        setCreation: function (subjectnumber) {

            var text = w2utils.lang("Choose way of drawing");
            if (!this.taskservice)  // Если это не сервисная задача 
                this.setStatusBar(text + '. ' + w2utils.lang("To install a new kind of object, select the layer to display a legend"));
            else
                this.setStatusBar(text);

            // Скроем элементы топологии
            this.topology.hideTopology();
            // Убрать отрисовку срединных точек редактируемого объекта
            if (this.drawobject)
                this.drawobject.drw_centerpoints = false;
            // Перерисуем объект редактирования
            this.mapeditorTask.refreshdraw(false, false);

            if (!this.editobject) {
                if (this.mapeditorTask.editobjects && this.mapeditorTask.editobjects[0])
                    this.editobject = this.mapeditorTask.editobjects[0];
                else {
                    return;
                }
            }
            this.subjectnumber = subjectnumber ? subjectnumber : 0;
            if (this.mapeditorTask.drawpanel) {
                this.mapeditorTask.drawpanel.style.cursor = 'pointer';
                this.drawpanel = this.mapeditorTask.drawpanel;
            }

            var el = $('.edcrmethod_free_line');
            if (el.length == 0) {
                this.sethtmlMethod();
                this.clearMethod();
                this.buttonmethod_create = null;
                // Для точечных векторных и подписей
                var spatialposition = this.editobject.spatialposition.toLowerCase();
                if (spatialposition.indexOf('point') >= 0 || spatialposition == 'title' || spatialposition == 'vector') {
                    this.buttonmethod_create = '.edcrmethod_free_line';
                }
                this.method_events(this.buttonmethod_create);

                // триггер на смену панели инструментов
                $(this.map.eventPane).trigger({ type: 'changedata_method', action: 'create' });
            }
            return true;
        },

        /**
         * Объявление событий на кнопки методов создания и редактирования
         * @method  method_events
         * @param target {Element} Элемент кнопки, которую нужно сделать активной
         */
        // ===============================================================
        method_events: function (cls) {

            $('.control-button-edit-method').off('click');

            var _that = this;
            $('.control-button-edit-method').click(function (event) {
                //_that.clickMethod(event.currentTarget);
                _that.clickMethod(event.target);
            });

            if (cls) {
                var $target = $(cls);
                this.buttonmethod_create = cls;
                // Активация режима
                //GWTK.mapeditorTask.prototype.checkmethod($target);
                $target.click();
            }
        },

        // Сбросить кнопки метода создания
        clearMethod: function () {
            GWTK.DomUtil.removeActiveElement(this.buttonmethod_create);
            this.buttonmethod_create = null;
        },

        /**
         * Смена способа создания или редактирования
         * @method clickMethod
         * @param target {Element} Элемент кнопки
         */
        // ===============================================================
        clickMethod: function (target) {

            var actiontarget = target, $actiontarget = $(actiontarget);

            var points = this.editobject.geometry.count(this.subjectnumber)
            // Если активный элемент, отжать и выйти
            if (GWTK.DomUtil.isActiveElement(target)) {
                this.clearMethod(target);
                if (this.action) {
                    this.map.closeAction();
                    // Очмстить метрику и историю
                    if (this.editobject && this.editobject.geometry) {
                        this.editobject.geometry.deletepoints(this.subjectnumber);
                    }

                    // Если объект
                    if (!this.subjectnumber) {
                        this.topology.destroy();
                        this.mapeditorTask.history.clear();
                        // очистим изображение объекта
                        this.drawobject.destroy();
                        this.mapeditorTask.addmenu();
                    }
                    else { // Если подобъект
                        this.topology.hideTopology();
                        // Удалим из истории последние изменения points
                        this.mapeditorTask.history.clear(points);
                        // Перерисуем реальный объект
                        this.mapeditorTask.refreshdraw(false, false);
                    }

                    // Строка в статаус бар о том, чтоб выбрать способ создания
                    this.setStatusBar(w2utils.lang("Choose way of drawing"));

                }
                return;
            }
            
            // Нажмем кнопку
            GWTK.mapeditorTask.prototype.checkmethod(actiontarget);
            this.buttonmethod_create = this.getclassmethod(actiontarget);

           // Если режим возврата
            if (this.buttonmethod_create == '.edcrmethod_back') {
                // Удалим из истории последние изменения points
                this.mapeditorTask.history.clear(points);
                this.editobject.geometry.deletesubject(this.subjectnumber);
                this.mapeditorTask.extend = false;
                this.complete();
                // Перерисуем реальный объект
                this.mapeditorTask.refreshdraw(false, false);
                return;
            }

            // Очмстить метрику и историю, если сменили способ создания
            if (this.editobject && this.editobject.geometry)
                this.editobject.geometry.deletepoints(this.subjectnumber);
            if (!this.subjectnumber) {
                this.mapeditorTask.history.clear();
            }

            this.processCreation();
        },

        /**
        * Запустить процесс создания объекта по существующим параметрам
        * @method startCreation
        * @param extend {Boolean} - продолжить создание
        */
        // ===============================================================
        startCreation: function (subjectnumber) {

            if (subjectnumber == 0) {
                this.caption = w2utils.lang("Create object");
                if (this.mapeditorTask.graphic)
                    this.initSelectGraphObjects();
            }
            else
                this.caption = w2utils.lang("Create contour");

            this.mapeditorTask.updatetitle(w2utils.lang("Map editor") + '. ' + this.caption);

            if (this.setCreation(subjectnumber))
                this.processCreation();
        },


        /**
         * Инициализация компонента списка объектов (режим Создания)
         * @method initSelectObjects
         * @param legend {Object} - легенда выбранного слоя карты
         */
        // ===============================================================
        initSelectObjects: function (legend) {
            if (!legend) return;

            this.initSelectMaps();

            // Список объектов классификатора млм типов объектов графичечкого слоя
            this.initSelectLayerObjects(legend);

            this.mapeditorTask.updatetitle(w2utils.lang("Map editor") + '. ' + this.caption);

        },

        initSelectLayerObjects: function (legend) {
            var mapeditorTask = this.mapeditorTask;
            if (!mapeditorTask)
                return;

            // Графический слой
            if (mapeditorTask.graphic) {
                this.initSelectGraphObjects();
                return;
            }

            //  Имеются ли объекты для редактирования в настройках редактора
            var editingobjects = GWTK.MapEditorUtil.iseditingobjects(mapeditorTask.maplayerid);

            // Обычные карты
            if (!legend.items || legend.items.length == 0)
                return;
            var items = new Array(), node, bsdlayer, mass, k = 0, count = legend.items.length,
                layer = this.map.tiles.getLayerByxId(mapeditorTask.maplayerid.layerid);
            var l = '_' + mapeditorTask.maplayerid.layerid;
            for (var i = 0; i < count; i++) {
                if (legend.items[i].nodes.length == 0)
                    continue;
                mass = legend.items[i].id.split("_");
                if (mass == null || mass.length < 2)
                    continue;
                bsdlayer = mass[mass.length - 1];
                var itemsel = {};
                itemsel.id = 'editor_' + legend.items[i].id;
                itemsel.text = legend.items[i].text;
                itemsel.img = legend.items[i].img;
                itemsel.expanded = legend.items[i].expanded;
                itemsel.nodes = new Array();

                for (var j = 0; j < legend.items[i].nodes.length; j++) {
                    node = legend.items[i].nodes[j];
                    var item = {};
                    item.key = node.id.replace(new RegExp(l, 'g'), "");
                    item.code = node.code;
                    item.id = 'editor_' + node.id;
                    item.text = node.text;
                    item.img = node.img;
                    item.img += ' legend_img_editor border-button';
                    item.local = node.local;
                    item.expanded = true;
                    item.bsdlayer = bsdlayer;
                    // Сначала пройдемся по codeList, если такая настройка существует
                    if (this.map.mapeditor.iseditingbyCodeList(layer, item.code)) {
                        var edobj;
                        if (editingobjects)
                            edobj = GWTK.MapEditorUtil.iseditingobject(editingobjects, item.code, item.key);
                        if (!editingobjects || (editingobjects && edobj))
                            itemsel.nodes.push(item);
                    }
                };

                if (itemsel.nodes.length > 0) {
                    items[k] = itemsel;
                    k++;
                }
            }

            // Определимся  с размерами панели
            var wh = mapeditorTask._readedCookie();
            var maxsize = mapeditorTask.getmaxSizeForDetail();
            var height = (wh && wh.cssslider) ? wh.cssslider.height : mapeditorTask.cssExtInit.height;
            if (height > maxsize[1])
                height = maxsize[1];
            var style = 'height: ' + height + 'px;';

            var _that = this;
            if (items.length > 0) {

                $('#' + mapeditorTask.classifersliderId + mapeditorTask.maplayerid.layerid).w2sidebar({
                    name: mapeditorTask.classifersliderId
                    , style: style
                });

                w2ui[mapeditorTask.classifersliderId].resize();
                w2ui[mapeditorTask.classifersliderId].add(items);
                w2ui[mapeditorTask.classifersliderId].on('click', function (event) { // 'click' : 'dblClick'
                    var node = w2ui[mapeditorTask.classifersliderId].get(event.target);
                    if (node && node.code) {
                        _that.initdataCreationObject(node);
                    }
                });
            }
            else {
                $('#' + mapeditorTask.classifersliderId + mapeditorTask.maplayerid.layerid).append(
                    '<div class="routeFilesName" style="text-align:center;">' + w2utils.lang("Objects for mapping are absent") + ' </div>');
            }

            this.setStatusBar(w2utils.lang("Select an object from the legend view"));

            // Вставим макеты, если есть
            mapeditorTask.setTemplate(layer, legend, true);

        },


        /**
         * Инициализация компонента списка слоев (режим Создания)
         * @method initSelectMaps
         */
        // ===============================================================
        initSelectMaps: function () {

            var mapeditorTask = this.mapeditorTask;
            if (!mapeditorTask)
                return;
            this.removepaneSelectObjects();

            var _that = this;
            var paneinfo = this.map.createPane('edContainerInfo', mapeditorTask.panel);
            paneinfo.id = this.selectobjectsId;

            // Определить список карты
            mapeditorTask.initLayerList(paneinfo, mapeditorTask.maplistId, false, 'center', '100%');

            // Установить список карт
            mapeditorTask.setSelectMaps('#' + mapeditorTask.maplistId, false,
                function (layer) {
                    _that.mapeditorTask.setlayertype(layer);
                },
                function (obj) {
                    _that.changeselectmaplist(obj);
                });
        },

        /**
          * Смена слоя в списке слоев карты (режим Создания)
          * @method changeselectmaplist
          * @param item [Object] - Элемент списка
          */
        // ===============================================================
        changeselectmaplist: function (item) {

            var mapeditorTask = this.mapeditorTask;
            if (!item || !mapeditorTask)
                return;

            mapeditorTask.maplayerid = mapeditorTask.iseditinglayer(item.id);
            mapeditorTask.setlayers(mapeditorTask.maplayerid);
            if (!mapeditorTask.layer) return;
            mapeditorTask.setlayertype(mapeditorTask.layer);

            // Прнудительное завершение операции
            if (this.action) {
                // Закрыть обработчик
                mapeditorTask.extend = null;
                if (mapeditorTask.options.autosave)  // Сохранять автоматически
                    $('#' + mapeditorTask.button_ids.save).click();
                else
                    this.mapeditorTask.canClose();
            }

            this.removepaneSelectObjects();

            if (!mapeditorTask.graphic) { // Обычная карта
                //mapeditorTask.updatetitle(w2utils.lang("Map editor") + ': ' + w2utils.lang("select type of object being created"));

                var legend = this.getLegend(mapeditorTask.layer);
                if (legend)
                    this.initSelectObjects(legend);
            }
            else { // Графический слой
                this.initSelectGraphObjects();
            }
        },


        /**
         * Удаление панели выбора типа объекта в режиме создания
         * @method removepaneSelectObjects
         */
        // ===============================================================
        removepaneSelectObjects: function () {
            var mapeditorTask = this.mapeditorTask;
            if (!mapeditorTask)
                return;
            // Удалим информационную панель
            mapeditorTask.destroyInfoObject();

            // Удалим основное окно списка объеkтов для создания
            var sl = $("[name='" + mapeditorTask.classifersliderId + "']");
            if (sl && sl.length > 0)
                w2ui[mapeditorTask.classifersliderId].destroy();
            $('.edContainerInfo').remove();

            // Удалим панель выбора объектов основной карты
            if (mapeditorTask.maplayerid && mapeditorTask.maplayerid.layerid) {
                $('#' + this.selectobjectsId).remove();
                // Удалим панель выбора графических объектов
                $('#' + this.selectgraphobjectsId).remove();
            }
        },

        /**
         * Запрос легенды слоя
         * @method getLegend
         * @param layer {Object} Слой карты GWTK.graphicLayer или GWTK.Layer
         */
        // ===============================================================
        getLegend: function (layer) {
            $(this.map.eventPane).off('loadclassifier', this.onLoadClassifier);
            $(this.map.eventPane).off('loadclassifierError', this.onLoadClassifierError);

            if (!layer || !layer.classifier)
                return;

            var legend = layer.classifier.legend;
            if (!legend) {
                legend = layer.classifier.getlegend();
                if (!legend) {
                    $(this.map.eventPane).on('loadclassifier', this.onLoadClassifier);
                    $(this.map.eventPane).on('loadclassifierError', this.onLoadClassifierError);
                }
            }
            return legend;
        },


        /**
        * Инициализация данных создаваемого объекта
        * @method initdataCreationObject
        * @param node {Object} - элемент выбранного типа объекта из списка
        */
        // ===============================================================
        initdataCreationObject: function (node) {
            var mapeditorTask = this.mapeditorTask;
            if (!mapeditorTask || !mapeditorTask.layer)
                return;

            if (!node) return;

            if (!mapeditorTask.graphic) {
                this.removepaneSelectObjects();
                mapeditorTask.setTemplateRecord(node);
            }

            // Последний редактируемый объект
            this.lastObject = node;

            this.setStatusBar(w2utils.lang("Choose way of drawing"));

            mapeditorTask.editobjects[0] = new GWTK.mapobject(this.map, "0", mapeditorTask.maplayerid.layerid);
            if (mapeditorTask.editobjects[0].error) {
                mapeditorTask.editobjects[0] = null;
                return;
            }

            this.editobject = mapeditorTask.editobjects[0];

            // ЗАГЛУШКА! ПОТОМ УБРАТЬ !!!!!!!!!!!!!!!!!!!!!!!!!!!
            this.editobject.loadFromXml = true;

            this.editobject.id = "0";
            this.editobject.code = this.editobject.key = node.code;
            if (!mapeditorTask.graphic) {
                if (node.id) {
//                    var l = '_' + mapeditorTask.maplayerid.layerid;
                    var layer = this.map.tiles.getLayerByxId(mapeditorTask.maplayerid.layerid);
                    if (layer && layer.classifier) {
                        var l = '_' + layer.classifier.layerid;
                        var _newid = node.id.replace(new RegExp(l, 'g'), "");
                        var newid = _newid.replace(new RegExp('editor_', 'g'), "");
                        this.editobject.key = newid;
                    }
                }
                else {
                    this.editobject.key = node.key;
                }
            }

            this.editobject.name = node.text;
            this.editobject.image = node.img;

            this.editobject.layername = node.bsdlayer;
            if (mapeditorTask.layer && mapeditorTask.layer.mapSheets && mapeditorTask.layer.mapSheets.sheets && mapeditorTask.layer.mapSheets.sheets.length > 0)
                this.editobject.maplayername = mapeditorTask.layer.mapSheets.sheets[0];
            else
                this.editobject.maplayername = mapeditorTask.layer.id;
            this.editobject.gid = this.editobject.maplayername + '.' + '0';

            //this.editobjects[0].geometry.srsName = "urn:ogc:def:crs:EPSG:4326";
            this.editobject.spatialposition = this.editobject.geometry.spatialposition = GWTK.classifier.prototype.getlocal(node.local);

            // запомним адреса переменных
            mapeditorTask.createdrawpanel();
            mapeditorTask.drawpanel.style.cursor = 'pointer';
            this.drawpanel = mapeditorTask.drawpanel;

            if (!mapeditorTask.createPaneInfoObject('create')) {
                $('#' + mapeditorTask.objectmethodId).addClass('disabledbutton');
                return;
            }

            // Если точечный, то установить способ создания
            this.buttonmethod_create = null;
            if (GWTK.classifier.prototype.getlocal(node.local) == "point" || GWTK.classifier.prototype.getlocal(node.local) == "title") {
                this.buttonmethod_create = '.edcrmethod_free_line';
            }
            this.method_events(this.buttonmethod_create);

            return true;
        },

        /**
         * Запустить процесс создания объекта
         * @method processCreation
         */
        // ===============================================================
        processCreation: function () {

            if (!this.buttonmethod_create) {
                this.setStatusBar(w2utils.lang("Choose way of drawing"));
                return;
            }

            // запустить обработчик
            var actionTask = new GWTK.MapeditorCreatingAction(this, 'create', this.mapeditorTask);
            if (!actionTask.error) {
                if (this.mapeditorTask.setAction(actionTask)) {
                    if (this.loadgeometry($(this.buttonmethod_create)))
                        this.action = actionTask;
                    return;
                }
                actionTask.close();
            }
        },

        /**
         * Загрузка данных из классификатора
         * @method  onLoadClassifier
         * @param event {Object} Событие
         */
        // ===============================================================
        onLoadClassifier: function (event) {
            if (!this.mapeditorTask) return;

            var legend = this.mapeditorTask.layer.classifier.getlegend();
            if (legend) {
                if (!this.selectobject)  // Если нет предустановленного объекта
                    this.initSelectObjects(legend);
                else
                    this.createobjectAutonomous(this.selectobject);
            }
            return false;
        },

        /**
         * Ошибка при загрузке данных из классификатора
         * @method  onLoadClassifierError
         * @param event {Object} Событие
         */
        // ===============================================================
        onLoadClassifierError: function (event) {
            var layer = this.mapeditorTask.layer;
            this.mapeditorTask.destroyActiveTask('create');
            var errortxt = w2utils.lang("Legend layer is not initialized. Layer ");
            if (!layer) {
                console.log(errortxt + layer);
            }
            else {
                w2alert(errortxt + layer.alias);
                this.mapeditorTask.layerlistchanged(layer.id, "remove");
            }
        },

        /**
         * Событие на тиканье таймера геолокации (для режима "Мои перемещения")
         * @method  onGeolocationTick
         * @param event {Object} Событие
         */
        // ===============================================================
        onGeolocationTick: function (event) {
            this.loadgeometry($(this.buttonmethod_create));
        },

        /**
        * Установка доступности кнопки способа создания
        * @method buttonmethod_enable
        * @param target {Element} Элемент кнопки, которую нужно сделать активной
        */
        // ===============================================================
        buttonmethod_enable: function (target) {
            var disabled = 'disabledbutton', buttonmethod;
            var buttonsource = $(target);
            if (!buttonsource || buttonsource.length == 0)
                return;

            // Если это "Мое местоположение"
            if (buttonsource.hasClass('control-button-geolocation')) {
                buttonmethod = $('.edcrmethod_track');
            }

            if (!buttonmethod || buttonmethod.length == 0)
                return;

            // активируем кнопку метода
            buttonmethod.removeClass(disabled);
            // если источник неактивен, то деактивируем кнопку метода
            if (!GWTK.DomUtil.isActiveElement(target) || this.editobject.spatialposition.indexOf('linestring') < 0)
                buttonmethod.addClass(disabled);
        },

        /**
        * Установка доступности определенных кнопок способов создания
        * @method buttonmethod_enableOnly
        * @param target {Array} Массив элементов кнопкок, которые нужно сделать активными
        */
        // ===============================================================
        buttonmethod_enableOnly: function (target) {
            if (!target && !(target instanceof Array))
                return;
            var enabled = 'enabledbutton', disabled = 'disabledbutton', buttonmethod;

            $('.control-button-edit-method').addClass(disabled);
            for (var i = 0; i < target.length; i++) {
                buttonmethod = $(target[i]);
                if (buttonmethod.length) {
                    buttonmethod.removeClass(disabled);
                    buttonmethod.addClass(enabled);
                }
            }
        },

        /**
         * ОБЪЕКТЫ ГРАФИЧЕСКОГО СЛОЯ
         */

        /**
         * Инициализация окна инструментов для создания графических объектов
         * @method initSelectGraphObjects
         */
        // ===============================================================
        initSelectGraphObjects: function () {

            var _that = this;

            // Удалим и перерисуем
            this.removepaneSelectObjects();

            this.initSelectMaps();

            var pane = this.map.createPane('edContainerInfo', this.mapeditorTask.panel);
            pane.id = this.selectgraphobjectsId; 

            strpanel =
            '<table align="left">' +
            '<tr id="td_' + this.selectgraphobjectsId + '">' + 
            '<td align="left"> ' +
            '<div id="edcrgrline_' + this.id + '" class="control-button control-button-edit img_edcrgrline clickable" Title="' + w2utils.lang("Line") + '"> </div> ' +  // линия
            '</td> ' +
            '<td align="left"> ' +
            '<div id="edcrgrpolygon_' + this.id + '" class="control-button control-button-edit img_edcrgrpolygon clickable" Title="' + w2utils.lang("Polygon") + '"> </div> ' +  // полигон
            '</td> ' +
            '<td align="left"> ' +
            '<div id="edcrgrpoint_' + this.id + '" class="control-button control-button-edit img_edcrgrpoint clickable" Title="' + w2utils.lang("Marker") + '"> </div> ' +  // точечный объект
            '</td> ' +
            '<td align="left"> ' +
            '<div id="edcrgrtitle_' + this.id + '" class="control-button control-button-edit img_edcrgrtitle clickable" Title="' + w2utils.lang("Title") + '"> </div> ' +  // точечный объект
            '</td> ' +
            '</tr>' +
            '</table>';

            $(pane).append(strpanel);

            // Создание графических объектов
            $('#edcrgrline_' + this.id).click(function (event) {
                $(this).attr('local', '0');
                $(this).attr('code', 'Line');
                _that.onGraphicCreateClickable(event, this);
            });
            $('#edcrgrpolygon_' + this.id).click(function (event) {
                $(this).attr('local', '1');
                $(this).attr('code', 'Polygon');
                _that.onGraphicCreateClickable(event, this);
            });
            $('#edcrgrpoint_' + this.id).click(function (event) {
                $(this).attr('local', '2');
                $(this).attr('code', 'Point');
                _that.onGraphicCreateClickable(event, this);
            });
            $('#edcrgrtitle_' + this.id).click(function (event) {
                $(this).attr('local', '3');
                $(this).attr('code', 'Title');
                _that.onGraphicCreateClickable(event, this);
            });

        },

        /**
         * Клик на графическую кнопку
         * @method ongraphicCreateClickable
         * @param event {Event} Событие
         * @param selector {Element} Элемент, инициировавший событие
         */
        // ===============================================================
        onGraphicCreateClickable: function (event, selector) {
            if (this.subjectnumber > 0) return;

            var $el = $('#' + this.mapeditorTask.objectmethodId);
            if (GWTK.DomUtil.isActiveElement(event.target)) {
                GWTK.DomUtil.removeActiveElement(event.target);
                $el.addClass('disabledbutton');

                // Закрыть обработчик
                this.mapeditorTask.closeAction();

                // Удалим информационную панель
                this.mapeditorTask.destroyInfoObject();
                this.mapeditorTask.destroyEditobjects();
                // Очистим историю
                this.mapeditorTask.history.clear();
                this.setStatusBar(w2utils.lang("Select the type of object"));
            }
            else {
                var act = $('.edContainerInfo').find('.control-button-edit');
                for (var i = 0; i < act.length; i++) {
                    GWTK.DomUtil.removeActiveElement(act[i]);
                }
                GWTK.DomUtil.setActiveElement(event.target);
                var node = {};
                node.code = selector.getAttribute('code');
                node.text = selector.getAttribute('title');
                node.local = selector.getAttribute('local');

                if (this.initdataCreationObject(node))
                    $('#' + this.mapeditorTask.objectmethodId).removeClass('disabledbutton');
            }

            this.mapeditorTask.updatetitle(w2utils.lang("Map editor") + '. ' + this.caption);
        },

        /**
         * Нажатие кнопок режимов основной панели
         * @method  onControlButtonClick
         * @param event {Object} Событие
         */
        // ===============================================================
        onControlButtonClick: function (event) {
            this.buttonmethod_enable(event.target);
        },

        /**
         * Определение css кнопки способа создания
         * @method getclassmethod
         * @param buttonmethod {Element} Элемент кнопки
         */
        // ===============================================================
        getclassmethod: function (buttonmethod) {
            var cls;
            var el = $(buttonmethod);
            if (el && el.length > 0) {
                if (el.hasClass('edcrmethod_free_line'))
                    cls = '.edcrmethod_free_line';
                else {
                    if (el.hasClass('edcrmethod_horizontal_rectangle'))
                        cls = '.edcrmethod_horizontal_rectangle';
                    else {
                        if (el.hasClass('edcrmethod_inclined_rectangle'))
                            cls = '.edcrmethod_inclined_rectangle';
                        else {
                            if (el.hasClass('edcrmethod_multi_rectangle'))
                                cls = '.edcrmethod_multi_rectangle';
                            else {
                                if (el.hasClass('edcrmethod_track'))
                                    cls = '.edcrmethod_track';
                                else {
                                    if (el.hasClass('edcrmethod_circle'))
                                        cls = '.edcrmethod_circle';
                                    else {
                                        if (el.hasClass('edcrmethod_back'))
                                            cls = '.edcrmethod_back';
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return cls;
        },


        /**
         * Вставка детальной информации в html cпособа создания или редактирования
         * @method htmlMetod_detail
         * @param spatialposition {String} Локализация объекта ('point', 'title', 'vector', 'linestring', 'polygon')
         */
        // ===============================================================
        htmlMetod_detail: function (spatialposition) {
            var html = '', disabled = '', disabledtrack = '', geolocation, back = '';
            html =
           '<div class="routeFilesName" style="text-align:center; padding-left:0px;">' + w2utils.lang("Way of drawing") +
           '</div>' +
           '<table style="margin-top:-12px;" align="center">' +
           '<tr align="center">' +
           '<td> ' +
           '<div class="control-button-edit-method control-button-edit edcrmethod_free_line clickable" Title="' + w2utils.lang("Any contour") + '"> </div> ' +  // произвольный контур
           '</td> ';// +
            // Методы создания для различных локализаций
            if (!GWTK.MapEditorUtil.isEnabledItemMenu(spatialposition))
                disabled = 'disabledbutton';
            // Выставим доступность режима по геолокации
            geolocation = $('#panel_button-geolocation');
            if (!geolocation || geolocation.length == 0 || !geolocation.hasClass('control-button-active') || spatialposition.indexOf('linestring') < 0)
                disabledtrack = 'disabledbutton';
            if (this.subjectnumber > 0)
                back = '<div class="control-button-edit-method control-button-edit edcrmethod_back clickable ' + disabled + '" Title="' + w2utils.lang("Back to the point editing mode") + '"> </div> ';

            html += '<td> ' +
             '<div class="control-button-edit-method control-button-edit edcrmethod_horizontal_rectangle clickable ' + disabled + '" Title="' + w2utils.lang("Horizontal rectangle") + '"> </div> ' +  // Горизонтальный прямоугольник
             '</td> ' +
             '<td> ' +
             '<div class="control-button-edit-method control-button-edit edcrmethod_inclined_rectangle clickable ' + disabled + '" Title="' + w2utils.lang("Inclined rectangle") + '"> </div> ' +  // наклонный прямоугольник
             '</td> ' +
             '<td> ' +
             '<div class="control-button-edit-method control-button-edit edcrmethod_multi_rectangle clickable ' + disabled + '" Title="' + w2utils.lang("Difficult rectangle") + '"> </div> ' +  // сложный прямоугольник
             '</td> ' +
             '</tr>' +
             '<tr align="center">' +
             '<td> ' +
             '<div class="control-button-edit-method control-button-edit edcrmethod_track clickable ' + disabledtrack + '" Title="' + w2utils.lang("My movements") + '"> </div> ' +  // мои перемещения
             '</td> ' +
             //'<td align="left"> ' +
             //'<div class="control-button-edit-method control-button-edit edcrmethod_file clickable" Title="' + w2utils.lang("Loading from the file") + '" name="' + action + '"> </div> ' +  // загрузка из файла
             //'</td> ' +
             //'<td> ' +
             //'<div class="control-button-edit-method control-button-edit edcrmethod_coordinates clickable" Title="' + w2utils.lang("Creation on the coordinates entered from the keyboard") + '" name="' + action + '"> </div> ' +  // по координатам
             //'</td> ' +
             '<td> ' +
             '<div class="control-button-edit-method control-button-edit edcrmethod_circle clickable ' + disabled + '" Title="' + w2utils.lang("Circle") + '"> </div> ' +  // окружность
             '</td> ' +
             '<td> ' +
             '</td> ' +
             '<td> ' +
             back +
             '</td> ' +
             //'<td align="left"> ' +
             //'<div id="edcrgrpoint_' + this.id + '" class="control-button-edit-method control-button-edit edit_method_fix_circle clickable" Title="' + this.res_mapEditor_graphlabel + '"> </div> ' +  // точечный объект
             //'</td> ' +
             '</tr>' +
             '</table>';

            return html;
        },


        /**
        * Загрузка геометрии объекта в зависимости от способа создания
        * @method loadgeometry
        * @param target {Element} jQury-элемент кнопки способа создания
        * @returns {Int} :
        *   0 - метрика не загружена, продолжить процесс создания или редактирования
        *   1 - метрика загружена, завершить процесс создания или редактирования
        *   2 - метрика загружена, продолжить процесс создания или редактирования
        */
        // ===============================================================
        loadgeometry: function (target) {

            // Отключим события, если таковые имеются
            $(this.map.eventPane).off('geolocationtick', this.onGeolocationTick);

            // если трек
            if (target.hasClass('edcrmethod_track')) {
                var tool = this.map.mapTool("geolocation");
                if (!tool || !(tool instanceof GWTK.geolocation) || !tool.process) return;

                var newgeometry = this.editobject.geometry.createcopy();
                var toolpoints = tool.process.objectDraw.points;
                var count, point;
                for (var i = 0; i < toolpoints.length; i++) {
                    count = this.editobject.geometry.count(0);
                    if (count > 0)
                        point = this.editobject.geometry.getpoint(count, 0);
                    if (point) {
                        if (point.x == toolpoints[i].POINT_X && point.y == toolpoints[i].POINT_Y)
                            continue;
                    }
                    this.editobject.geometry.appendpoint(toolpoints[i].POINT_X, toolpoints[i].POINT_Y);
                }

                this.mapeditorTask.history.add('all', null, 0, null, null, null, newgeometry, this.editobject.geometry);
                this.mapeditorTask.ischange(true);
                this.updatedrawcontur('create');
                $(this.drawpanel).off('mousedown', this.onMouseDownCreation);
                $(this.drawpanel).off('mouseup', this.onMouseUpCreation);
                $(this.map.eventPane).one('geolocationtick', this.onGeolocationTick);
                return 1;
            }

            // если из файла
            if (target.hasClass('edcrmethod_file')) {
                $(this.drawpanel).off('mousedown', this.onMouseDownCreation);
                $(this.drawpanel).off('mouseup', this.onMouseUpCreation);
                return 1;
            }

            return 0;
        },


        /**
        * Создание объекта - сложный многоугольник
        * @method createmultirect
        * @param subjectnumber {Int} Номер контура с 0
        */
        // ===============================================================
        createmultirect: function (subjectnumber) {

            var mapeditorTask = this.mapeditorTask;
            if (!mapeditorTask || !this.map.taskManager._action)
                return;

            var newgeometry = this.editobject.geometry.createcopy();
            var action = this.map.taskManager._action;
            this.editobject.geometry.deletepoints(subjectnumber);

            var el = document.getElementById(action.lineworkid[2]);
            if (el) {
                mapeditorTask.addpoint(parseFloat(el.getAttributeNS(null, 'x2')), parseFloat(el.getAttributeNS(null, 'y2')), null, subjectnumber, null, true);
                mapeditorTask.addpoint(parseFloat(el.getAttributeNS(null, 'x1')), parseFloat(el.getAttributeNS(null, 'y1')), null, subjectnumber, null, true);
            }

            var points = newgeometry.getpoints(subjectnumber);
            if (points.length > 2) {
                for (var i = 0; i < points.length - 1; i++) {
                    mapeditorTask.addpointgeo(points[i].x, points[i].y, points[i].h, subjectnumber);
                }
            }
            else
                for (var i = points.length - 1; i >= 0; i--) {
                    mapeditorTask.addpointgeo(points[i].x, points[i].y, points[i].h, subjectnumber);
                }


            el = document.getElementById(action.lineworkid[3]);
            if (el) {
                mapeditorTask.addpoint(parseFloat(el.getAttributeNS(null, 'x1')), parseFloat(el.getAttributeNS(null, 'y1')), null, subjectnumber, null, true);
                mapeditorTask.addpoint(parseFloat(el.getAttributeNS(null, 'x2')), parseFloat(el.getAttributeNS(null, 'y2')), null, subjectnumber, null, true);
            }


            mapeditorTask.refreshdraw(false, false);

            mapeditorTask.history.add('all', null, subjectnumber, null, null, null, newgeometry, this.editobject.geometry);
        },

        /**
         * Откоррестировать метрику сложного многоугольника
         * @method correctMultirect
         */
        // ===============================================================
        correctMultirect: function () {
            if (this.buttonmethod_create != '.edcrmethod_multi_rectangle' || !this.editobject || !this.editobject.geometry)
                return;

            // Удалим первую  и последнюю точки
            this.editobject.geometry.deletepoint(this.editobject.geometry.count(this.subjectnumber), this.subjectnumber);
            this.editobject.geometry.deletepoint(1, this.subjectnumber);
        },
        
         /**
        * Завершить процесс создания метрики объекта
        * @method complete
        */
        // ===============================================================
        complete: function () {
            if (this.map.taskManager._action) {
                this.map.taskManager._action.canCancel = true;
                return this.map.taskManager._action.complete();
            }
            else {
                //this.map.overlayRefresh();
                this.processEdition();
            }
        },

        /**
         * Установка инмструментов создания
         * @method sethtmlMethod
         //*/
        // ===============================================================
        sethtmlMethod: function () {
            if (!this.editobject) return;

            var spatialposition = this.editobject.spatialposition;
            $(this.map.eventPane).off('controlbuttonclick', this.onControlButtonClick);
            var $el = $('#' + this.mapeditorTask.objectmethodId);
            if (this.mapeditorTask.graphic) {
                if (!this.taskservice) {
                    $el.remove();
                    $('#td_' + this.selectgraphobjectsId).append(this.htmlMethod(spatialposition, this.mapeditorTask.graphic, this.mapeditorTask.objectmethodId));
                }
                else {  // Если пришли из редактирования
                    $el.children().remove();
                    $el.append(this.htmlMetod_detail(spatialposition));
                }
                // Сделать недоступными кнопки
                if (this.subjectnumber == 0) 
                    $('#' + this.mapeditorTask.objectmethodId).addClass('disabledbutton');
            }
            else {
                $el.children().remove();
                $el.append(this.htmlMetod_detail(spatialposition, this.mapeditorTask.graphic));
            }
            $(this.map.eventPane).on('controlbuttonclick', this.onControlButtonClick);


            // Володя
            //var self = this;
            //setTimeout(function () {
            //    var el = $('#' + self.mapeditorTask.objectmethodId)[0];
            //    if (!self.editobject.geometry)
            //        return;

            //    var spatialposition = self.editobject.geometry.spatialposition;
            //    var button = spatialposition == 'linestring' || spatialposition == 'multilinestring' ||
            //                 spatialposition == 'polygon' || spatialposition == 'multipolygon'
            //                    ? $(el).find('.edcrmethod_free_line')[0]
            //                    : false;
            //    if (button)
            //        self.clickMethod(button);
            //}, 10);

        },


        /**
         * Запустить процесс редактирования объекта
         * @method processEdition
         * @param extend {Boolean}  Флаг использования расширеннного режима
         * чтобы не делать запрос на сохранение при промежуточных операциях 
         */
        // ===============================================================
        processEdition: function (extend) {

            this.mapeditorTask.extend = extend;
//            this.drawobject.drw_centerpoints = true;
            this.drawobject.drw_centerpoints = false;
            this.mapeditorTask.addmenu();

            // Если была сервисная задача, то вернуться в нее
            var task = (this.taskservice) ?  this.taskservice : this;

            // запустить обработчик
            var actionTask = new GWTK.MapeditorEditingAction(task, 'edit', this.mapeditorTask);
            if (!actionTask.error) {
                if (this.mapeditorTask.setAction(actionTask)) {
                    actionTask.changemethod();
                    return;
                }
                actionTask.close();
            }
        },

        /**
         * Формирование html cпособа создания или редактирования
         * @method htmlMethod
         */
        // ===============================================================
        htmlMethod: function (spatialposition, graphic, objectmethodId) {
            var html = '';
            if (graphic) // если это графика 
                html = '<td align="right"  id="' + objectmethodId + '" style=" padding-left:50px; width:100%;">';
            else
                html = '<td align="right"  id="' + objectmethodId + '" >';
            html += this.htmlMetod_detail(spatialposition) + '</td>';
            return html;
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
            if (!div || !div.id || !editobject || !editobject.geometry) return;

            var left = '0px', top = '0px', spatialposition = editobject.spatialposition;
            if (!isNaN(x)) left = parseInt(x - 5, 10) + 'px';
            if (!isNaN(y)) top = parseInt(y - 5, 10) + 'px';

            var subjectnumber = this.drawobject.getsubjectnumber(div.id);
            var pcount = editobject.geometry.count(subjectnumber);
            var styleDiv = ' style="left:' + left + ';top:' + top + '; cursor: pointer;opacity: 0.9"'; 
            var deletepoint = '<tr><td width="16px" class="ededmethod_delpoint" style="background-repeat:no-repeat;"/>  <td id="' + this.mapeditorTask.popupId + '_deletepoint" style="padding-left:5px;">' + w2utils.lang("Remove point") + '</td></tr>';

            // Заглушка, пока нет других операций над точками
            if (deletepoint == '' && pcount <= 1)
                return;

            // Определим номер точки
            var finish = '',  closeobject = '', changedirection = '',
                number = this.drawobject.getnumber(div.id),
                isclosing = true,
                pointfirst = editobject.geometry.getpoint(1, subjectnumber), pointlast = editobject.geometry.getpoint(pcount, subjectnumber);
            if (!pointfirst || !pointlast) return;
            if (pcount < 4 || pointfirst.x != pointlast.x || pointfirst.y != pointlast.y)
                isclosing = false;

            // Если создается подобъект, а нажали точку другого подобъекта, то не надо 
            var isfinish = false;
            if ((spatialposition.indexOf("linestring") >= 0 && pcount > 1))
                isfinish = true;
            if ((spatialposition.indexOf("polygon") >= 0 && pcount > 2))
                isfinish = true;
            if ((spatialposition.indexOf("point") >= 0 && pcount == 1))
                isfinish = true;
            if ((spatialposition == "title" || spatialposition == "vector") && pcount == 2)
                isfinish = true;

            if (isfinish && 
                subjectnumber == this.subjectnumber) // Если создается подобъект
                finish = '<tr><td width="16px" class="ededmethod_finish" style="background-repeat:no-repeat;"/>  <td id="' + this.mapeditorTask.popupId + '_finish" style="padding-left:5px;">' + w2utils.lang("Complete operation") + ' (Ctrl+Enter)</td></tr>';
            if ((spatialposition.indexOf("linestring") >= 0 || spatialposition.indexOf("polygon") >= 0) && pcount > 2)  // если линейный или площадной объект и крайние точки не равны
                closeobject = '<tr><td width="16px" class="ededmethod_closeobject" style="background-repeat:no-repeat;"/>  <td id="' + this.mapeditorTask.popupId + '_closeobject" style="padding-left:5px;">' + w2utils.lang("Close object") + '</td></tr>';

            // сменить направление
            if (spatialposition != 'point' && pcount > 1)
                changedirection = '<tr><td width="16px" class="ededmethod_changedir" style="background-repeat:no-repeat;"/> <td id="' + this.mapeditorTask.popupId + '_changedirection" style="padding-left:5px;">' + w2utils.lang("Change direction") + '</td></tr>';

            //// Найти точку на альтернативном объекте
            //var sourcepoint = '<tr><td width="16px" class="ededmethod_sourcepoint" style="background-repeat:no-repeat;"/> <td id="' + this.mapeditorTask.popupId + '_sourcepoint" style="padding-left:5px;">' + w2utils.lang("Capture the line of the selected object") + '</td></tr>';

            var text =
            '<div id="' + this.mapeditorTask.popupId + '" class=" map-panel-def editTable" ' + styleDiv + ' >' +
            '<div align="left"  class="menupoint" style="margin-left:5px; margin-top:5px;">' + //actionname +
            '</div>' +
            '<div>' +
            '<table cellspacing="2px;" cellpadding="2px" style="width:140px;">' +
                 deletepoint +
                 //sourcepoint +
                 closeobject + // замкнуть
                 changedirection + // сменить направление 
                 finish +   // завершить
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
                    _that.mapeditorTask.deletepoint(_that.drawobject.getnumber(div.id) + 1, _that.drawobject.getsubjectnumber(div.id), 'create');
                    _that.updatedrawcontur('create');
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

                // Завершить 
                $('#' + this.mapeditorTask.popupId + '_finish').click(function (event) {
                    $popupclose.click();
                    _that.complete();
                    return false;
                });


                // Замкнуть
                $('#' + this.mapeditorTask.popupId + '_closeobject').click(function (event) {
                    $popupclose.click();
                    _that.mapeditorTask.closeobject(false, subjectnumber);
                    _that.complete();
                    return false;
                });


                // Изменить направление
                $('#' + this.mapeditorTask.popupId + '_changedirection').click(function (event) {
                    $popupclose.click();
                    _that.mapeditorTask.changedirection(subjectnumber, 'create');
                    return false;
                });

            }

            // Отключить события карты
            this.topology.map_events('off');

        },


        /**
        * Автономное создание
        * @method createAutonomous
        * @param selectobject {Object} GWTK.mapobject 
        */
        // ===============================================================
        createAutonomous: function (selectobject) {
            if (!selectobject || !this.mapeditorTask) return;
            var mapeditorTask = this.mapeditorTask;

            // Если подлежит редактированию
            var layedit = mapeditorTask.iseditinglayer(selectobject.maplayerid);
            if (!layedit) { // не нашли нужный нам слой карты
                mapeditorTask.destroyEditobjects();
                w2alert(w2utils.lang('The object can not be edited because the layer is not included in the list of editable layers'));
                return;
            }

            // Назначим нужный слой
            mapeditorTask.maplayerid = layedit;
            // Установить тип редактируемого слоя
            mapeditorTask.layer = mapeditorTask.map.tiles.getLayerByxId(mapeditorTask.maplayerid.layerid);
            mapeditorTask.setlayertype(mapeditorTask.layer);
                 
            mapeditorTask.mapeditorCreatingTask = this;

            var legend = mapeditorTask.layer.classifier.legend;
            if (!legend) {
                this.getLegend(mapeditorTask.layer);
            }
            else
                this.createobjectAutonomous(selectobject);
        },

        /**
        * Создание объекта автономно
        * @method createobjectAutonomous
        * @param selectobject {Object} GWTK.mapobject 
        */
        // ===============================================================
        createobjectAutonomous: function (selectobject) {
            if (!selectobject || !this.mapeditorTask) return;
            var mapeditorTask = this.mapeditorTask;
            var node = {};
            // Запросим характеристики объекта по ключу (на крайний случай по коду)
            var rscobject = mapeditorTask.getrscobject(selectobject.key, selectobject.code);
            if (rscobject) {
                node.code = node.key = rscobject.key;
                node.text = rscobject.name;
                node.local = rscobject.local;
                node.img = rscobject.image;
                if (this.initdataCreationObject(node)) {
                    this.startCreation(this.subjectnumber);
                    $('#' + mapeditorTask.maplistId).parent().addClass("disabledbutton");
                    return true;
                }
            }
        }

    };
    GWTK.Util.inherits(GWTK.MapeditorCreatingTask, GWTK.MapTask);


    // Обработчик создания объекта карты   
    GWTK.MapeditorCreatingAction = function (task, name, context) {
        this.error = true;
        if (!context || context instanceof GWTK.mapeditorTask == false)
            return;

        GWTK.MapAction.call(this, task, name);           // родительский конструктор     

        this.lineworkid = ['linework1', 'linework2', 'linework3', 'linework4'];
        this.linecircleworkid = 'linecirclework';

        this.mapeditorTask = context;
        this.editobject = (this.task.editobject) ? this.task.editobject : this.mapeditorTask.editobjects[0];
        if (!this.editobject) return;

        if (this.mapeditorTask.metrics) {
            this.mapeditorTask.metrics.options.action = 'create';
            this.mapeditorTask.metrics.creategrid(this.editobject.geometry.saveJSON(true));
        }
        this.subjectnumber = this.task.subjectnumber;

        this.drawobject = this.task.drawobject;
        if (!this.drawobject) return;
        this.drawobject.drw_centerpoints = false;  // Нет срединных точек

        this.drawpanel = this.task.drawpanel;
        if (!this.drawpanel) return;

        // Запросим объекты окружения, если их нет
        this.topology = this.task.topology;
        if (!this.topology) return;

        this.mapeditorTask.paneInfoObjectDisabled(true);
        this.topology.searchObjectsByAreaFrame(null, [this.editobject.gid], 'create', this.mapeditorTask.selectlayersid, true, 
             w2utils.lang(w2utils.lang("Create contour, causing a point on the map")));

        // стереть рабочие линии
        this.removeworklines();

        // Замыкание контекста 
        this.bind();

        this.error = false;

    };

    GWTK.MapeditorCreatingAction.prototype = {

        /**
        * Замыкание контекста 
        * @method bind
        */
        // ===============================================================
        bind: function () {
            this.onMouseDownCreation = GWTK.Util.bind(this.onMouseDownCreation, this);
            this.onMouseUpCreation = GWTK.Util.bind(this.onMouseUpCreation, this);
            this.onMouseMoveCreation = GWTK.Util.bind(this.onMouseMoveCreation, this);
            //this.onOverlayRefresh = GWTK.Util.bind(this.onOverlayRefresh, this);


            // Навесим всплывающее меню на точки
            this.drawobject.clearparam();
            //this.drawobject.do_popupmenu = GWTK.Util.bind(this.popupmenu, this);
            //this.drawobject.do_downpoint = GWTK.Util.bind(this.task.popupmenu, this.task);
            this.drawobject.addPopupmenu(GWTK.Util.bind(this.task.popupmenu, this.task));
        },


        /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
         * @method set
         * @param options {Object} параметры обработчика
         */
        // ===============================================================
        set: function (options) {

            var map = this.getMap();
            if (!map || !this.drawpanel) return;

            if (this.task.buttonmethod_create == '.edcrmethod_track' || this.task.buttonmethod_create == '.edcrmethod_file') {
                this.task.clearStatusBar();
                return;
            }

            this.drawpanel.style.cursor = 'crosshair';
            var $drawpanel = $(this.drawpanel);
            this.drawobject.zIndexDrawPanel('up', this.drawpanel);

            // отменим обработчики 
            $drawpanel.off("touchstart", map.handlers.touchStart);   // аналог onmousedown
            $drawpanel.off("touchmove", map.handlers.touchMove);     // аналог onmousemove
            $drawpanel.off("touchend", map.handlers.touchEnd);       // аналог onmouseup    

            // назначим обработчики 
            //$(map.eventPane).on('overlayRefresh', this.onOverlayRefresh);

            map.on({ type: 'mousedown', target: "map", phase: 'before', sender: this }, this.onMouseDownCreation);
            map.on({ type: 'mousemove', target: "map", phase: 'before', sender: this }, this.onMouseMoveCreation);
        },

        /**
         * Сбросить настройки (отключение обработчиков событий, инициализация флажков и др.)
         * @method clear
         */
        // ===============================================================
        clear: function () {
            var map = this.getMap();
            if (!map) return;

            if (this.drawpanel) {
                this.mapeditorTask.zIndexRestore();
                var $drawpanel = $(this.drawpanel);

                // отменим обработчики 
                map.off({ type: 'mousedown', target: "map", phase: 'before', sender: this }, this.onMouseDownCreation);
                map.off({ type: 'mouseup', target: "map", phase: 'before', sender: this }, this.onMouseUpCreation);
                map.off({ type: 'mousemove', target: "map", phase: 'before', sender: this }, this.onMouseMoveCreation);
                //$(map.eventPane).off('overlayRefresh', this.onOverlayRefresh);

                // назначим обработчики 
                $drawpanel.on("touchstart", this.getMap().handlers.touchStart);   // аналог onmousedown
                $drawpanel.on("touchmove", this.getMap().handlers.touchMove);     // аналог onmousemove
                $drawpanel.on("touchend", this.getMap().handlers.touchEnd);       // аналог onmouseup    
            }

            this.removeworklines();

            this.task.clearStatusBar();
        },


        /**
        * Удаление рабочих линий создания/редактирования 
        * @method createdrawpanel
        */
        // ===============================================================
        removeworklines: function () {
            var el;
            for (var i = 0; i < this.lineworkid.length; i++) {
                GWTK.DrawingObject.prototype.removeDomElement(this.lineworkid[i]);
            }
            // Удаление служебных линий окружности
            GWTK.DrawingObject.prototype.removeDomElement(this.linecircleworkid);
        },

        /**
         * События панели svg холста 
         * @event onSvgEvent
         */
        // ===============================================================
        onSvgEvent: function (e) {
            var $ep = $(this.task.map.eventPane);
            $ep.trigger(e);
        },

        /**
         * Нажатие мыши при создании объекта
         * @method  onMouseDownCreation
         * @param event {Object} Событие
         */
        // ===============================================================
        onMouseDownCreation: function (e) {

            var map = this.getMap();
            if (!map || !this.drawpanel) return;

            var mapeditorTask = this.mapeditorTask;
            mapeditorTask.ischange(true);
            var $drawpanel = $(this.drawpanel);

            // отрисовка направляющей линии
            e = e.originalEvent;

            //console.log('onMouseDownCreation');
            //console.log(e);

            // Меню на точку (почему-то не отрабатывает стандартное для точки (оно назначачено при отрисовке объекта) )
            if (e.target.nodeName == 'circle') {
                var el = e.target;
                var attr = el.getAttributeNS(null, 'onmousedown');
                if (attr) {
                    attr = GWTK.DrawingObject.prototype.getpointattr(el);
                    if (attr) 
                        return this.task.popupmenu(el, parseFloat(el.getAttributeNS(null, attr[0])), parseFloat(el.getAttributeNS(null, attr[1])));
                }
            }

            map.off({ type: 'mousemove', target: "map", phase: 'before', sender: this }, this.onMouseMoveCreation);
            map.on({ type: 'mousemove', target: "map", phase: 'before', sender: this }, this.onMouseMoveCreation);

            // Завершение создания объекта при комбинации Ctrl+mousedown
            if (e.ctrlKey) {
                if (e.which == 1)  // Левая кнопка мыши (завершить создание)
                    this.complete();
                else {
                    if (e.which == 3)  // Правая кнопка мыши (отказаться от создания)
                        mapeditorTask.canClose();
                }
                return;
            }

            // Всплывающее меню
            if (e.target.id.indexOf(this.mapeditorTask.popupId) >= 0) {
                this.removeworklines();
                e.stopPropagation();
                return false;
            }
            // Удалим меню, если оно было
            $('#' + this.mapeditorTask.popupId).remove();

            // Добавим точку
            var subjectnumber = this.subjectnumber; 
            var pointcount = this.editobject.geometry.count(subjectnumber);

            var multirect = (this.task.buttonmethod_create == '.edcrmethod_multi_rectangle') ? true : false;
            // если НЕ сложный прямоугольник или у него меньше 2 точек
            if (!multirect || (multirect && pointcount < 2)) {
                if (this.topology.currentPoint) {
                    geo = this.topology.getpointgeo(this.topology.currentPoint); // Если имеется выбранная точка, то добавим ее
                    if (geo) {
                        number = mapeditorTask.addpointgeo(geo[0], geo[1], null, subjectnumber, true);
                    }
                    else {
                        // Вероятно это виртуальная точка
                        var newpos = this.drawobject.getpositionByPointId(this.topology.currentPoint);
                        if (newpos) {
                            number = mapeditorTask.addpoint(newpos.x, newpos.y, null, subjectnumber, true);
                        }
                    }
                    // удалим виртуальную точку
                    this.topology.drawVirtualPoint();
                }
                else {
                    number = mapeditorTask.addpoint(e.clientX, e.clientY, null, subjectnumber, true);
                }

                this.mapeditorTask.refreshdraw(false, false);
            }
            else {
                // Сложный прямоугольник
                this.task.createmultirect(subjectnumber);
            }

            // Для полигона найдем какому контуру принадлежит точка 
            if (subjectnumber > 0 && this.editobject.spatialposition.indexOf('polygon') >= 0) {
                var subsub, sub = this.editobject.geometry.getsubjectgeometry(subjectnumber);
                var ret = this.editobject.geometry.isPointInsideSubjects(this.editobject.geometry.getpoint(1, subjectnumber));
                if (ret < 0) { // никому не принадлежит
                    if (sub) 
                        sub.insideMultipart = ret;  // будет новый мультиконтур
                }
                else {
                    subsub = this.editobject.geometry.getsubjectgeometry(ret);
                    if (subsub.insideMultipart >= 0)  // если этот контур уже чья-то дырка, то создадим новый мультиконтур
                        sub.insideMultipart = -1;   // будет новый мультиконтур
                    else
                        sub.insideMultipart = ret;  // будет новая дырка
                }
                if (sub.insideMultipart < 0)
                    this.editobject.geometry.spatialposition = "multipolygon";
            }

            mapeditorTask.addmenu();

            // если точечный, завершить создание метрики 
            if (this.iscomplete(this.editobject)) {
                this.complete();
            }

        },

        /**
         * Отпускание мыши при создании объекта
         * @method  onMouseUpCreation
         * @param event {Object} Событие
         */
        // ===============================================================
        onMouseUpCreation: function (e) {
            var $drawpanel = $(this.drawpanel);
            if (!this.complete()) {
                this.mapeditorTask.refreshdraw(false, false);
                this.task.processCreation();
            }
        },

        /**
         * Перемещение мыши при создании объекта
         * @method  onMouseMoveCreation
         * @param e {Object} Событие
         */
        // ===============================================================
        onMouseMoveCreation: function (e) {
            if (!e) return;
            e.stopPropagation();
            e = e.originalEvent;

            // отобразить координаты мыши
            var map = e.map = this.getMap();
            GWTK.DomEvent.getMouseGeoCoordinates(e);

            var newpos, rectdraw = this.drawpanel.getBoundingClientRect();

            // Найти близлежащую точку и подсветить ее
            var ui = { position: { left: e.clientX - rectdraw.left, top: e.clientY - rectdraw.top } }
            if (this.topology.drawOverObject(ui, { isobjectpoint: this.mapeditorTask.options.capturePoints, isvirtualpoint: this.mapeditorTask.options.captureVirtualPoints })) {
                newpos = { 'x': ui.position.left, 'y': ui.position.top };
            }

            // В зависимости от способа создания рисовать линию или нет
            var subjectnumber = this.subjectnumber, pointcount;
            if (this.iscomplete(this.editobject) || (pointcount = this.editobject.geometry.count(subjectnumber) )<= 0) {
                // e.stopPropagation();
                return false;
            }

            if (pointcount > 1)
                this.task.setStatusBar(w2utils.lang("Backspace - step backwards, Esc - cancel the operation, Ctrl + Enter - to complete the operation"));
            else {
                 this.task.setStatusBar(w2utils.lang("Create contour, causing a point on the map"));
            }

            this.drawpanel.style.cursor = 'crosshair';

            // Линия направления
            this.removeworklines();
            var el, beforeel, styleline, prev,
                next = GWTK.point(e.clientX - rectdraw.left, e.clientY - rectdraw.top);
            if (newpos) {
                next = GWTK.point(newpos.x, newpos.y)
            }

            el = this.drawobject.getpointElemLast(subjectnumber);
            if (el) {
                prev = this.drawobject.getpositionByPointId(el.id);
                if (prev) {
                    var iddrawobj = this.drawobject.getgroupId(subjectnumber);
                    beforeel = document.getElementById(iddrawobj + '_' + 'pointsJSON');
                    styleline = (subjectnumber > 0) ? this.drawobject.styleline_subject : this.drawobject.styleline;
                }
            }

            // Найдем родителя для рисования на svg
            var parent = document.getElementById(this.drawobject.mapobject.maplayername + '_' + this.drawobject.mapobject.id + '_objectJSON');

            // Горизонтальный прямоугольник
            if (prev) {
                switch (this.task.buttonmethod_create) {
                    case '.edcrmethod_horizontal_rectangle':  // прямоугольник
                        this.drawobject.svgDraw.createSVGline(this.lineworkid[0], parent, { "x1": prev.x, "y1": prev.y, "x2": prev.x, "y2": next.y, "style": styleline }, null, beforeel);
                        this.drawobject.svgDraw.createSVGline(this.lineworkid[1], parent, { "x1": prev.x, "y1": next.y, "x2": next.x, "y2": next.y, "style": styleline }, null, beforeel);
                        this.drawobject.svgDraw.createSVGline(this.lineworkid[2], parent, { "x1": next.x, "y1": next.y, "x2": next.x, "y2": prev.y, "style": styleline }, null, beforeel);
                        this.drawobject.svgDraw.createSVGline(this.lineworkid[3], parent, { "x1": next.x, "y1": prev.y, "x2": prev.x, "y2": prev.y, "style": styleline }, null, beforeel);
                        this.updateEvents(map);
                        break;
                    case '.edcrmethod_circle':               // окружность
                        this.drawobject.svgDraw.createSVGline(this.lineworkid[0], parent, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline }, null, beforeel);
                        // создаем группу точек окружности
                        this.drawobject.drawcircle(this.linecircleworkid, [prev, next]);
                        this.updateEvents(map);
                        break;
                    case '.edcrmethod_inclined_rectangle':  // наклонный прямоугольник
                        var elems = beforeel.childNodes;
                        elems = Array.prototype.slice.call(elems);
                        if (elems.length > 1) {// отменим событие на нажатие и назначим на отжатие
                            this.updateEvents(map);
                            // рисуем перпендикулярные параллельные линии
                            this.drawobject.drawperpendicularlines(this.lineworkid, [this.drawobject.getpositionElement(elems[0]), this.drawobject.getpositionElement(elems[1])], next, beforeel);
                        }
                        else
                            this.drawobject.svgDraw.createSVGline(this.lineworkid[0], parent, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline }, null, beforeel);
                        break;
                    case '.edcrmethod_multi_rectangle':  // сложный прямоугольник
                        var elems = beforeel.childNodes;
                        elems = Array.prototype.slice.call(elems);
                        if (elems.length > 1) {
                            this.drawobject.drawmultirect(this.lineworkid, [this.drawobject.getpositionElement(elems[elems.length - 2]), this.drawobject.getpositionElement(elems[elems.length - 1])], next, beforeel);
                        }
                        else
                            this.drawobject.svgDraw.createSVGline(this.lineworkid[0], parent, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline }, null, beforeel);
                        break;
                    default:
                        this.drawobject.svgDraw.createSVGline(this.lineworkid[0], parent, { "x1": prev.x, "y1": prev.y, "x2": next.x, "y2": next.y, "style": styleline }, null, beforeel);
                        break;
                }
            }
            // e.stopPropagation();
            return false;

        },


        ///**
        //* Событие на перерисовку карты
        //* @method  onOverlayRefresh
        //* @param event {Object} Событие
        //*/
        //// ===============================================================
        //onOverlayRefresh: function (event) {
        //    if ((!event && event.cmd == 'zoom') || !this.editobject || !this.editobject.geometry)
        //        return;

        //    console.log('onOverlayRefresh');
        //    console.log(event);
        //    this.editobject.geometry.deletepoint(this.editobject.geometry.count(this.subjectnumber), this.subjectnumber);

        //},


        // Переназначить события
        updateEvents: function (map) {
            map.off({ type: 'mousedown', target: "map", phase: 'before', sender: this }, this.onMouseDownCreation);
            map.off({ type: 'mouseup', target: "map", phase: 'before', sender: this }, this.onMouseUpCreation);
            map.on({ type: 'mouseup', target: "map", phase: 'before', sender: this }, this.onMouseUpCreation);
        },


        /**
         * Нужно ли принудительно завершать создание объекта 
         * @method iscomplete
         * @returns {Boolean} true - нужно принудительно завершить создание
         */
        // ===============================================================
        iscomplete: function (editobject) {
            if (!editobject) return;
            var spatialposition = (editobject.spatialposition) ? editobject.spatialposition.toLowerCase() : null;
            if (spatialposition == 'point' || spatialposition == 'multipoint' ||
             ((editobject.spatialposition == 'vector' || editobject.spatialposition == 'title') && this.editobject.geometry.count(this.subjectnumber) == 2))
                return true;
        },


        /**
        * Завершить процесс создания метрики объекта
        * @method complete
        */
        // ===============================================================
        complete: function () {

            var mapeditorTask = this.mapeditorTask;
            if (!mapeditorTask || !this.editobject)
                return;

            var el, point;
            el = this.drawobject.getpointElemLast();
            if (!el) return;

            var subjectnumber = this.drawobject.getsubjectnumber(el.id),
                lineworkid = this.lineworkid,
                linecircleworkid = this.linecircleworkid;

            switch (this.task.buttonmethod_create) {
                // Горизонтальный прямоугольник
                case '.edcrmethod_horizontal_rectangle':
                    this.editobject.geometry.deletepoints(subjectnumber);
                    for (var i = 0; i < lineworkid.length; i++) {
                        el = document.getElementById(lineworkid[i]);
                        if (!el) continue;
                        if (i == 0)
                            mapeditorTask.addpoint(parseFloat(el.getAttributeNS(null, 'x1')), parseFloat(el.getAttributeNS(null, 'y1')), null, subjectnumber, true, true);
                        mapeditorTask.addpoint(parseFloat(el.getAttributeNS(null, 'x2')), parseFloat(el.getAttributeNS(null, 'y2')), null, subjectnumber, true, true);
                    }

                    if (this.editobject.geometry.count(subjectnumber) == 0)
                        return;
                    break;

                // Наклонный прямоугольник
                case '.edcrmethod_inclined_rectangle':
                    el = document.getElementById(lineworkid[2]);
                    if (el) {
                        mapeditorTask.addpoint(parseFloat(el.getAttributeNS(null, 'x1')), parseFloat(el.getAttributeNS(null, 'y1')), null, subjectnumber, true, true);
                        mapeditorTask.addpoint(parseFloat(el.getAttributeNS(null, 'x2')), parseFloat(el.getAttributeNS(null, 'y2')), null, subjectnumber, true, true);
                    }
                    mapeditorTask.closeobject(false, subjectnumber);
                    if (this.editobject.geometry.count(subjectnumber) == 0)
                        return;
                    break;

                // Оrружность
                case '.edcrmethod_circle':
                    this.editobject.geometry.deletepoints(subjectnumber);
                    var group = document.getElementById(linecircleworkid);
                    if (!group) return;
                    var elems = group.childNodes;
                    elems = Array.prototype.slice.call(elems); // теперь elems - массив
                    for (var i = 0; i < elems.length; i++) {
                        if (i == 0)
                            mapeditorTask.addpoint(parseFloat(elems[i].getAttributeNS(null, 'x1')), parseFloat(elems[i].getAttributeNS(null, 'y1')), null, subjectnumber, true, true);
                        mapeditorTask.addpoint(parseFloat(elems[i].getAttributeNS(null, 'x2')), parseFloat(elems[i].getAttributeNS(null, 'y2')), null, subjectnumber, true, true);
                    }
                    if (this.editobject.geometry.count(subjectnumber) == 0)
                        return;

                    break;

                // Сложный многоугольник 
                case '.edcrmethod_multi_rectangle':
                    // Удалим первую  и последнюю точки
                    this.task.correctMultirect();
                    break;
            };


            // если полигон, замкнуть метрикy 
            if (this.editobject.spatialposition.toLowerCase().indexOf('polygon') >= 0) {
                if (!mapeditorTask.closeobject(false, subjectnumber)) {
                    w2alert(w2utils.lang("Object contains less than 3 points!"));
                    return;
                }

                //// Проверим на пересечение контуров (вынесено в сохранение)
                //if (subjectnumber > 0) {
                //    var ret = mapeditorTask.isIntersectionSubjectSubjects(this.editobject, subjectnumber);
                //    if (ret >= 0) { // Имеется пересечение
                //        w2alert(w2utils.lang("Created contour crosses ") + ret.toString() + w2utils.lang(" contour of the edited object") + '. ' + w2utils.lang("Contour can not be stored") + '.');
                //        this.editobject.geometry.deletesubject(subjectnumber);
                //        mapeditorTask.extend = false;
                //    }
                //}

            }

            // Занести метрику в окно с метрикой объекта
            if (mapeditorTask.metrics) {
                mapeditorTask.metrics.options.action = "edit";
                mapeditorTask.metrics.creategrid(this.editobject.geometry.saveJSON(true));
            }

            // Закрыть обработчик
            mapeditorTask.closeAction();

            // Сбросить курсор и сменить инструменты
            this.drawpanel.style.cursor = 'default';

            this.task.processEdition();

            return true;
        }
    };
    GWTK.Util.inherits(GWTK.MapeditorCreatingAction, GWTK.MapAction);

}
