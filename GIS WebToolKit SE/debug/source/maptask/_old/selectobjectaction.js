/*************************************** Соколова Т.О. 30/04/21  ****
/*************************************** Нефедьева О.  08/08/18  ****
/*************************************** Помозов Е.    02/02/21  ****
/*************************************** Гиман Н.Л     04/12/17  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2018              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *    Обработчики:                                                  *
 *     Обработчик выбора объектов карты в точке                     *
 *     Обработчик выбора объекта карты  при наведении мыши          *
 *     Обработчик создания геометрии объекта произвольным контуром  *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {

    /**
     * Выбор объектов карты в точке
     * @class  GWTK.SelectMapObjectAction
     * @constructor GWTK.SelectMapObjectAction
     * @param task {Object} задача (допустимый)
     * @param map {Object} карта GWTK.Map (обязательный)
     * @param params {Object} - объект параметров: {
     *  - show {Boolean} признак Выводить информацию об объектах в окне Объекты карты
     *  - callback функция обратного вызова при событии featureinforefreshed (Обновление отобранных объектов)
     *  - message (String) - строка для отображения в статус баре 
     *  - sequence признак перебора объектов, выводится окно для перебора объектов в точке
     *  - objlocal (Array) - Массив номеров локализаций (соответствует ГИС карте: 0 - линейный, 1- площадной, 2 - точечный, 3 - подпись, 4 - векторный, 5 - шаблон)
     *  - layerscodelist:  []   Массив внешних кодов объектов rsc карты для слоев карты
     *   {
     *     layerid: Идентификатор слоя
     *     codelist: [] Массив внешних кодов объектов rsc карты
     *   }
     *  - fn_setselectlayers {Function} функция, возвращающая массив слоев для выбора - "selectlayersid": ["", ...] 
     *  - fn_isCorrectObject {Function} функция проверки на корректность объекта, где
     *     {gid  (String) - идентификатор объекта,
     *      code (String) - код объекта,
     *      key (String) - ключ объекта}     
     * } 
     * при выборе объекта инициируется триггер featurelistclick
     */

    GWTK.SelectMapObjectAction = function (task, map, params) {

        GWTK.MapAction.call(this, task);

        this.name = 'SelectMapObjectAction';
        this.error = true;

        if (this.task) {
            this.map = this.getMap();
        }
        else {
            this.map = map;
        }
        if (!this.map) {
            console.log("SelectMapObjectAction. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        this.objlocal = [0, 1, 2, 3, 4];
        this.layerscodelist = null;
        this.setselectlayers = null;
        this.message = w2utils.lang("Select the highlighted object on the map");

        // Заберем данные из параметров
        if (params) {
            this.showObjectsInfo(params.show);
            if (params.callback)
                this._onFeatureinforefreshed = params.callback;
            if (params.sequence)
                this.sequence = params.sequence;
            if (params.fn_setselectlayers)
                this.setselectlayers = params.fn_setselectlayers;
            if (params.fn_isCorrectObject)
                this.isCorrectObject = params.fn_isCorrectObject;

            this.objlocal = (params.objlocal && params.objlocal instanceof Array && params.objlocal.length > 0) ? params.objlocal.slice(0) : this.objlocal;
            this.layerscodelist = (params.layerscodelist && params.layerscodelist.length > 0) ? JSON.parse(JSON.stringify(params.layerscodelist)) : null;

            if (params.message)
                this.message = params.message;
        }

        this.init();

        if (this.map.objectManager) {
            this.defaultRequestLocals = this.map.objectManager.getRequestLocals();
            this.map.objectManager.setRequestLocals(this.objlocal.join());
        }

        this.error = false;

        // Наследуемые функции
        if (this.$super) {
            this.$super.init.call(this, null, true);
            this.$super.set.call(this, null, null);
            this.$super.clear.call(this, null, true);
        }
        return;
    };

    GWTK.SelectMapObjectAction.prototype = {
        /**
         * Инициализация класса
         * @method init
         */
        // ===============================================================
        init: function (base, nocall) {
            if (nocall) return;

            // Функция родителя 
            this.$super.init(this);
            if (!base) base = this;

            base.canSelectObject = true;
            if (this._onFeatureinforefreshed) {
                this._onFeatureinforefreshed = GWTK.Util.bind(this._onFeatureinforefreshed, base);
			}
            else {
                this.onFeatureinfoRefreshed = GWTK.Util.bind(this.onFeatureinfoRefreshed, base);
			}			
			
            this.onMapclick = GWTK.Util.bind(this.onMapclick, base);

            return;
        },

        /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
	     * @method set
         */
        // ===============================================================
        set: function (options, base, nocall) {
            if (nocall) return;

            // Функция родителя 
            this.$super.set(options, null, this);
            if (!base) base = this;

            this.cursor = $(base.map.eventPane).css('cursor');
            $(base.map.eventPane).css('cursor', 'crosshair');
            base.map.statusbar.set(base.message + '...');

            if (this._onFeatureinforefreshed) {
                $(base.map.eventPane).on("featureinforefreshed", this._onFeatureinforefreshed);
            }
            else {
                $(base.map.eventPane).on("featureinforefreshed", this.onFeatureinfoRefreshed);
            }

            // назначаем обработчики событий
            base.map.on({ type: "click", target: "map", phase: 'before' }, this.onMapclick);
        },

        /**
         * Очистить класс 
         * @method clear
         */
        // ===============================================================
        clear: function (base, nocall) {
            if (nocall) return;

            // Функция родителя 
            this.$super.init(this);
            if (!base) base = this;

            if (!base.canCancel)
                return;

            // Восстановим локализации выбираемых объектов
            if (base.map.objectManager) {
                base.map.objectManager.setRequestLocals(this.defaultRequestLocals);
            }

            base.map.off({ type: "click", target: "map", phase: 'before' }, this.onMapclick);

            if (this._onFeatureinforefreshed) {
                $(base.map.eventPane).off("featureinforefreshed", this._onFeatureinforefreshed);
            }
            else {
                $(base.map.eventPane).off("featureinforefreshed", this.onFeatureinfoRefreshed);
            }

            this.removeInfoPopup(base.name, base.map);

            if (base.task) {
                base.task.clearAction();
            }

            $(base.map.eventPane).css('cursor', this.cursor);
            return;
        },

        /**
         * Обработчик события click в карте 
         * @method onMapclick
         * @param event {Object} объект события GWTK.event
         */
        // ===============================================================       
        onMapclick: function (event) {

            if (!this.showObjectsInfo()) {
                this.map.hideObjectInfo();
            }

            if (!this.canCancel) {                           // игнорируем, выполняется запрос...
                event.stopPropagation();
                return false;
            }

            event.stopPropagation();
            this.map.onClick(event);

            return;
        },

        /**
         * Обработчик события "featureinforefreshed" - Отобранные объекты обновились 
         * @method onFeatureinfoRefreshed
         * @param event {Object} объект события event
         */
        // ===============================================================
        onFeatureinfoRefreshed: function (event) {

            this.canCancel = true;

            if (this.showObjectsInfo()) {
                return;
            }

            var selectedFeatures = this.map.objectManager.selectedFeatures;
            if (!selectedFeatures)
                return;
            selectedFeatures.addLocalLayersFeatures();                                     // добавляем объекты локальных слоев

            // Подкорректируем список
            var find, val;
            if (this.objlocal) {
                for (var i = selectedFeatures.mapobjects.length - 1; i >= 0; i--) {
                    val = GWTK.classifier.prototype.getlocalByName(selectedFeatures.mapobjects[i].spatialposition);
                    find = -1;
                    for (var j = 0; j < this.objlocal.length; j++) {
                        if (parseInt(this.objlocal[j]) == parseInt(val)) {
                            find = j;
                        }
                    }
                    if (find < 0)
                        // удалить из массива
                        selectedFeatures.remove(selectedFeatures.mapobjects[i]);
                }
            }

            if ((this.selectlayersid = this.setselectlayers()) && this.selectlayersid.length > 0) {
                for (var i = selectedFeatures.mapobjects.length - 1; i >= 0; i--) {
                    find = this.selectlayersid.find(
                        function (element, index, array) {
                            if (element == selectedFeatures.mapobjects[i].maplayerid)
                                return element;
                        });
                    if (!find)
                        // удалить из массива
                        selectedFeatures.remove(selectedFeatures.mapobjects[i]);
                }
            }

            if (this.layerscodelist) {
                for (var i = selectedFeatures.mapobjects.length - 1; i >= 0; i--) {
                    var vallayer = selectedFeatures.mapobjects[i].maplayerid,
                        valcode = selectedFeatures.mapobjects[i].code,
                        retfind;
                    find = this.layerscodelist.find(
                        function (element, index, array) {
                            if (element.layerid == vallayer && element.codelist && element.codelist.length > 0) {
                                retfind = element.codelist.find(
                                    function (element1, index1, array1) {
                                        if (element1.toString() == valcode.toString()) {
                                            return element1;
                                        }
                                    });
                                if (retfind)
                                    return element;
                            }
                        });
                    if (!find)
                        // удалить из массива
                        selectedFeatures.remove(selectedFeatures.mapobjects[i]);
                }
            }

            // Проверим на корректность
            if (this.isCorrectObject) {
                for (var i = selectedFeatures.mapobjects.length - 1; i >= 0; i--) {
                    if (!this.isCorrectObject(selectedFeatures.mapobjects[i].gid, selectedFeatures.mapobjects[i].code, selectedFeatures.mapobjects[i].key))
                        selectedFeatures.remove(selectedFeatures.mapobjects[i]);
                }
            }

            if (selectedFeatures.selected.length > 0) {                                    // выделяем первый объект
                var lay = this.map.tiles.getLayerByGmlId(selectedFeatures.selected[0]);
                if (lay && selectedFeatures.drawobject(selectedFeatures.selected[0], true, true, null, null, true)) {
                    if (!this.sequence) {
                        $(this.map.eventPane).trigger({ type: 'featurelistclick', layer: lay.xId, gid: this.map.objectManager.selectedFeatures.selected[0] });
                        this.removeInfoPopup();
                    }
                    else {
                        // Выставить номер текущей точки 0
                        if (this.map.objectManager.selectedFeatures.mapobjects.length > 0 && this.map.objectManager.clickData.number < 0)
                            this.number = this.map.objectManager.clickData.number = 0;
                        this.createInfoPopup(this.map.panes.mapPane, this.name, this.map.objectManager.clickData._point.x, this.map.objectManager.clickData._point.y, selectedFeatures.mapobjects);
                    }
                }
            }
            else {
                this.removeInfoPopup();
            }

            event.stopPropagation();

            return;
        },


        /**
        * Создание информационной панели  
        * @method createInfoPopup
        * @param selectorParent {string}  - селектор родителя
        * @param id {string}  - идентификатор панели
        * @param x {Int}  - координата x точки в окне карты 
        * @param y {Int}  - координата y точки в окне карты 
        * @param mapobjects [GWTK.mapobject]  - массив объектов в точке с координатами (x,y)
        */
        // ===============================================================
        createInfoPopup: function (selectorParent, id, x, y, mapobjects) {
            var id = id;
            // удалить окно
            this.remove(id);

            if (!selectorParent || !id || !x || !y || !mapobjects || mapobjects.length == 0)
                return;

            var windowsize = this.map.getWindowSize(),
                maxwidth = 365, maxheight = 200,
                left = x + 5, top = y + 5;
            if (left > windowsize[0] - maxwidth)
                left = windowsize[0] - maxwidth;
            if (top > windowsize[1] - maxheight)
                top = windowsize[1] - maxheight;

            var gmldata = GWTK.Util.parseGmlId(mapobjects[0].gid),
                sheet = (gmldata.sheet) ? gmldata.sheet: '',
                gridname = id + '_grid';

            // Создать окно
            var html =
                '<div id = "' + id + '" class="map-panel-def editTable" style="left:' + left + 'px; top:' + top + 'px; position:absolute !important;"></div>';
               
            $(selectorParent).append(html);

            var $parent = $('#' + id);
            if ($parent.length == 0)
                return;

            GWTK.Util.createHeaderForComponent({
                map: this.map,
                parent: $parent[0],
                callback: GWTK.Util.bind(function () {
                    _that.removeInfoPopup(id, _that.map);
                }, this)
            })

            $parent.append(
                '<div>'
                + '<div class="infoPopup">'

                    + '<div style="margin:15px 5px 5px 5px;">'

                        + '<table width="100%" >'
                        + '<tr>'
                        + '<td width="30px" style="text-align:left; vertical-align: top;">'
                            + '<img class="button-clickable" id="' + id + '_prev"  src="' + GWTK.imgArrowPrev + '">'
                        + '</td>'
                        + '<td style="text-align:center;">'
                            + '<div class="identify_header_content_title" id="' + id + '_headreinfo" style="text-align: center !important;">'
                        + '</td>'
                        + '<td width="30px" style="text-align:right; vertical-align: top;">'
                            + '<img class="button-clickable" id="' + id + '_next"  src="' + GWTK.imgArrowNext + '">'
                        + '</td>'
                        + '</tr>'
                        + '</table>'

                    + '</div>'

                    + '<div style="padding:0px 10px 0 10px;">'  
                    + '<div id="' + gridname + '" style="min-height:0px; height:200px; width: 100%;">'
                    + '</div>'
                    + '</div>'

                    + '<div style="margin: 10px 0px 10px 160px; ">'
                            + '<div type="button"  id="' + id + '_select" class="control-button control-button_addmenu control-button-ok clickable" title="' + w2utils.lang("Select") + '"></div>'
                    + '</div>'

                + '</div>'
            + '</div>');

            // Обновим содержимое
            this.updateInfo(id, mapobjects);

            var _that = this, lay;
            $('#' + id + '_prev').click(function (event) {
                if (_that.number > 0) {
                    _that.number--;
                    _that.updateInfo(id, mapobjects);
                }
            });

            $('#' + id + '_next').click(function (event) {
                if (_that.number < mapobjects.length - 1) {
                    _that.number++;
                    _that.updateInfo(id, mapobjects);
                }
                else {
                    _that.number = 0;
                    _that.updateInfo(id, mapobjects);
                }
            });

            $('#' + id + '_select').click(function (event) {
                if (_that.map.objectManager && _that.map.objectManager.selectedFeatures && (lay=_that.map.tiles.getLayerByGmlId(_that.map.objectManager.selectedFeatures.selected[_that.number]))) {
                    $(_that.map.eventPane).trigger({ type: 'featurelistclick', layer: lay.xId, gid: _that.map.objectManager.selectedFeatures.selected[_that.number] });
                }
                else {
                    _that.removeInfoPopup(id, _that.map);
                }
            });

            // JQuery UI перемещение и изменение размеров
            GWTK.panelUI({
                $element: $('#' + id),
                draggable: true,
                resizable: false
            });
        },

        /**
          * Удаление оконных элементов 
          * @method remove
          * @param id {string}  - идентификатор панели
          */
        // ===============================================================
        remove: function (id) {
            // удалить грид
            if (w2ui[id + '_grid']) {
                w2ui[id + '_grid'].destroy();  // грид
            }
            // Удалить окно
            $('#' + id).remove();
        },

        /**
          * Удаление информационной панели 
          * @method removeInfoPopup
          * @param id {string}  - идентификатор панели
          */
        // ===============================================================
        removeInfoPopup: function (id, map) {
            if (!map)
                map = this.map;
            if (map.objectManager)
                map.objectManager.clickData.clearPickPoint();

            // Удалить окно
            this.remove(id);

            if (map.objectManager && map.objectManager.selectedFeatures) {
                map.objectManager.selectedFeatures.clear();
            }

            $(map.eventPane).css('cursor', 'crosshair');
         },

        /**
        * Обновление информации на панели 
        * @method updateInfo
        * @param id {string}  - идентификатор панели
        * @param mapobjects [GWTK.mapobject]  - массив объектов 
        */
        // ===============================================================
        updateInfo: function (id, mapobjects) {
            if (!id || !mapobjects || mapobjects.length == 0)
                return;

            var gmldata = GWTK.Util.parseGmlId(mapobjects[this.number].gid),
                sheet = (gmldata.sheet) ? gmldata.sheet: '',
                $el = $('#' + id).find('#' + id + '_headreinfo');
            $el.empty();
            $el.append('<div class="identify-tag">' + sheet + '</br> ' + mapobjects[this.number].name + '(' + mapobjects[this.number].code + ')' + '</div>'
            + '<div class="identify-count">' + '(' + (this.number + 1).toString() + '/' + mapobjects.length + ')</div>');


            var _that = this, gridname = id + '_grid';
            this.records = [];
            for (var i = 0; i < mapobjects[this.number].semantic.semantics.length; i++) {
                this.records.push(mapobjects[this.number].semantic.semantics[i]);
                this.records[i].recid = i + 1;
            }

            if (this.records.length == 0) {
                $('#' + gridname).css('display', 'none');
                $('#' + id + '_select').css('margin-top', '-10px');
            }
            else {
                $('#' + gridname).css('display', 'block');
                $('#' + gridname).css('max-height', Math.min(100, this.records.length * 26));
                $('#' + id + '_select').css('margin-top', '0px');
            }

            if (w2ui[gridname]) {
                w2ui[gridname].records = this.records;
                w2ui[gridname].refresh();  // грид
            }
            else {

                $('#' + gridname).w2grid({
                    name: gridname,
                    multiSelect: false,
                    show: {
                        toolbar: false
                        , columnHeaders: false
                        , header: false
                        , footer: false
                        , toolbarReload: false
                        , lineNumbers: false
                        , toolbarSearch: false
                        , toolbarColumns: false
                        , fixedBody: true
                    },
                    limit: 1000,
                    columns: [
                            { field: 'recid', hidden: true },
                            { field: 'name', size: '50%' },
                            { field: 'textvalue', size: '50%' }                    ],

                    // Записи
                    records: this.records
                });

            }


            $('#' + id).css('height', '');
            if (this.map.objectManager && this.map.objectManager.selectedFeatures) {
                this.map.objectManager.selectedFeatures.drawcontour(mapobjects[this.number], true, true, null, null, true);

                // Событие на выделение объекта
                $(this.map.eventPane).trigger({type: 'selectobjectupdated', feature: mapobjects[this.number]});
            }
        },

        // назначить слои для выделения
        setselectlayers: function () {
            return this.selectlayersid = [];
        }

    };

    GWTK.Util.inherits(GWTK.SelectMapObjectAction, GWTK.MapAction);

    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    /**
     * Обработчик выбора объекта карты  при наведении мыши
     * @class  GWTK.SelectMapObjectActionHover
     * @constructor GWTK.SelectMapObjectActionHover
     * @param task {Object} задача (допустимый)
     * @param params {Object} - объект параметров:
     *  - fn_setselectlayers {Function} функция, возвращающая массив слоeв для выбора - "selectlayersid": ["", ...] }
     *  - drawall (Bool) -  признак выделения всех отобранных объектов
     *  - message (String) - строка для отображения в статус баре 
     *  - objlocal (Array) - Массив номеров локализаций (соответствует ГИС карте: 0 - линейный, 1- площадной, 2 - точечный, 3 - подпись, 4 - векторный, 5 - шаблон)
     *  - layerscodelist:  []   Массив внешних кодов объектов rsc карты для слоев карты
     *   {
     *     layerid: Идентификатор слоя
     *     codelist: [] Массив внешних кодов объектов rsc карты
     *   },
     *  - excludeObjects: [] Массив идентификаторов объектов карты, которые нужно исключить 
     *
     * при выборе объекта инициируется триггер featurelistclick
     */
    GWTK.SelectMapObjectActionHover = function (task, params) {
        this.error = true;
        this.setselectlayers = null;
        this.drawall = false;
        this.message = w2utils.lang("Select the highlighted object on the map");
        this.objlocal = [0,1,2,3,4];
        this.layerscodelist = null;
        this.excludeObjects = [];

        // Заберем данные из параметров
        if (params) {
            if (params.fn_setselectlayers)
                this.setselectlayers = params.fn_setselectlayers;
            if (params.drawall)
                this.drawall = params.drawall;
            if (params.message)
                this.message = params.message;
            if (params.objlocal && params.objlocal instanceof Array ) 
                this.objlocal = (params.objlocal && params.objlocal.length > 0) ? params.objlocal.slice(0) : null;
            if (params.layerscodelist && params.layerscodelist instanceof Array)
                this.layerscodelist = (params.layerscodelist && params.layerscodelist.length > 0) ? JSON.parse(JSON.stringify(params.layerscodelist)) : null;
            if (params.excludeObjects && params.excludeObjects instanceof Array)
                this.excludeObjects = (params.excludeObjects && params.excludeObjects.length > 0) ? JSON.parse(JSON.stringify(params.excludeObjects)) : [];
        }

        this.drawpanel_id = 'selectTopologySvgcPane';
        this.map = task.map;
        if (!this.map) return;
        this.selectedFeatures = this.map.objectManager.selectedFeatures;
        // родительский конструктор    
        GWTK.MapAction.call(this, task, name);
        this.name = 'SelectMapObjectActionHover';
        this.zIndexUp = '715';

        // Замыкание контекста 
        this.bind();

        if (!this.init())
            return;
        this.error = false;

        // Наследуемые функции
        if (this.$super) {
            this.$super.init.call(this, null, true);
            this.$super.set.call(this, null, null);
            this.$super.clear.call(this, null, true);
        }

    };

    GWTK.SelectMapObjectActionHover.prototype = {

        /**
         * Инициализация класса
         * @method init
         */
        // ===============================================================
        init: function (base, nocall) {
            if (nocall) return;

            // Функция родителя 
            this.$super.init(this);
            if (!base) base = this;

            // Назначим слои для выделения
            base.selectlayersid = base.setselectlayers();
            return base.selectlayersid;
        },
	
	    /**
	     * Настройка класса (подключение обработчиков событий, установка флажков и др.)
	     * @method set
	     * @param base
	     * @param nocall
	     */
        // ===============================================================
        set: function (options, base, nocall) {
            if (nocall) return;

            // Функция родителя 
            this.$super.set(options, null, this);
            if (!base) base = this;

            // Сбросим выделение
            if (this.selectedFeatures)
                this.selectedFeatures.clearDrawAll();

            $(base.map.eventPane).on('overlayRefresh', base.onOverlayRefresh);
            $(base.map.eventPane).on('layerlistchanged', base.onLayerListChanged);
            $(base.map.eventPane).on('visibilitychanged', base.onVisibilityChanged);
            $(base.map.eventPane).on('filterchanged', base.onVisibilityChanged);
            base.map.on({ type: "click", target: "map", phase: 'before' }, base.onMapclick);

            if (base.createdrawpanel()) {
                // Поднять панель рисования_action
                this.zIndexDrawPanel('up', base.drawpanel, base);
                base.searchObjectsByAreaFrame(this.message);
            }
        },

        /**
        * Сбросить настройки (отключение обработчиков событий, инициализация флажков и др.)
        * @method clear
        */
        // ===============================================================
        clear: function (base, nocall) {
            if (nocall) return;

            this.$super.clear(this);
            if (!base) base = this;

            // Опустить панель рисования на прежний уровень
            this.zIndexDrawPanel('down', base.drawpanel, base);

            $(base.map.eventPane).off('overlayRefresh', base.onOverlayRefresh);
            $(base.map.eventPane).off('layerlistchanged', base.onLayerListChanged);
            $(base.map.eventPane).off('visibilitychanged', base.onVisibilityChanged);
            $(base.map.eventPane).off('filterchanged', base.onVisibilityChanged);

            base.map.off({ type: "click", target: "map", phase: 'before' }, base.onMapclick);


            if (base.topology) {
                base.topology.destroy();
                base.topology = null;
            }

            $('#' + base.drawpanel_id).remove();

            // Очмстим статус бар
            base.map.statusbar.clear();

        },

        // Поднять/опустить zIndex панели рисования и родительской панели
        zIndexDrawPanel: function (type, selector, base) {
            var $drawpanel = $(selector);
            var $parent = $drawpanel.parent();

            if (!base) base = this;

            // поднять
            if (type == 'up') {
                if (!base.zIndex) {
                    base.zIndex = $parent.css('zIndex');
                }
                $parent.css('zIndex', base.zIndexUp);
                $drawpanel.css('zIndex', base.zIndexUp);
            }
            else {
                if (base.zIndex) {
                    $parent.css('zIndex', base.zIndex);
                    $drawpanel.css('zIndex', base.zIndex);
                }
            }
        },

        /**
        * Замыкание контекста 
        * @method bind
        */
        // ===============================================================
        bind: function (base) {
            if (!base) base = this;

            this.onSelectObject = GWTK.Util.bind(this.onSelectObject, this);
            this.onOverlayRefresh = GWTK.Util.bind(this.onOverlayRefresh, this);
            this.onLayerListChanged = GWTK.Util.bind(this.onLayerListChanged, this);
            this.onVisibilityChanged = GWTK.Util.bind(this.onVisibilityChanged, this);
            this.onMapclick = GWTK.Util.bind(this.onMapclick, this);
        },


        // назначить слои для выделения
        setselectlayers: function () {
            return this.selectlayersid = [];
        },

        /**
         * Проверка возможность завершения 
         * @method canClose
         * @return {Boolean} true - можно завершить, false - нет
         */
        canClose: function () {
            return this.canCancel;
        },

        // Создать панель для отрисовки
        createdrawpanel: function () {
            if (document.getElementById(this.drawpanel_id)) {
                $('#' + this.drawpanel_id).remove();
            }

            var selectGraphicPane = this.map.drawPane;
            if (!selectGraphicPane) {
                console.log('Отсутствует панель map.drawPane');
                return;
            }

            this.drawpanel = GWTK.DomUtil.create('div', 'overlay-panel', selectGraphicPane);
            this.drawpanel.id = this.drawpanel_id;

            if (this.topology)
                this.topology.destroy();

            var topologyParam = {
                'svgid': 'actionhover',
                'selectlayersid': this.selectlayersid,
                'nodrawpoint': true,
                'objlocal' : this.objlocal,
                'func': {
                    'fn_selectobject': GWTK.Util.bind(this.onSelectObject, this),
                    'fn_parentpanel': GWTK.Util.bind(function () { return this.drawpanel; }, this)
                }
            };
            if (this.objlocal) 
                topologyParam.objlocal = this.objlocal;
            if (this.layerscodelist)
                topologyParam.layerscodelist = this.layerscodelist;

            this.topology = new GWTK.Topology(this.map, topologyParam, this);

            this.topology.drawpointoptions.stroke = this.topology.drawpointoptions.fill =
                this.topology.drawpointoptions_over.stroke = this.topology.drawpointoptions_over.fill =
                this.topology.drawoptions_over.stroke = this.topology.drawoptions_over.fill = "#e95757";
            this.topology.drawoptions["stroke-width"] = "3px";

            return true;
        },

        /**
         * Выделить объект 
         * @method  selectObject
         * @param layer {Object} Объект слоя
         * @param gid {String} Идентификатор объекта
         */
        // ===============================================================
        selectObject: function (layer, gid, pointevent) {
            var $ep = $(this.map.eventPane);
            this.selectedFeatures.drawSelectedObjects(true, null, true);
            $ep.trigger({ type: 'featurelistclick', layer: layer.xId, gid: gid, act: 'pickfeature', pointevent: pointevent });
        },

        /**
         * Обработчик нажатия мыши на объекте 
         * @method  onSelectObject
         * @param event {Object} Событие
         */
        // ===============================================================
        onSelectObject: function (event) {
            var target = event.dataobject && event.dataobject.currentTarget ? event.dataobject && event.dataobject.currentTarget :
                        (event.evt && event.evt.currentTarget ? event.evt && event.evt.currentTarget : null)
            if (this.topology && target) {
                var gmlid, layer;
                // Запросим реальный объект в коллекции топологии
                var realRealFeatureObject = this.topology.getRealFeatureObject(target);
                if (this.selectedFeatures) {
                    if (!this.drawall) {
                        this.selectedFeatures.clear();
                    }
                    if (realRealFeatureObject && realRealFeatureObject.properties && realRealFeatureObject.properties.id) {
                        gmlid = realRealFeatureObject.properties.id;
                        var layer = this.map.tiles.getLayerByGmlId(gmlid);
                        if (layer) {                            
							if (this.selectedFeatures.selected.indexOf(gmlid) !== -1) {
                                // повторный клие по объекту								
								var mapobject = this.selectedFeatures.findobjectsById(layer.xId, gmlid);								
								this.selectedFeatures.remove(mapobject);
							}
							else {
							  var newjson = {
                                "type": "FeatureCollection",
                                "bbox": realRealFeatureObject.bbox,
                                "features": [realRealFeatureObject]
                              };
							  this.selectedFeatures.addJsonObject(newjson, 0, layer);	
							}							
							return this.selectObject(layer, gmlid, event.dataobject);
                        }
                    }
                    else {
                        gmlid = this.topology.getRealGID(target);
                        layer = this.map.tiles.getLayerByGmlId(gmlid);
                        if (layer) {                            
							if (this.selectedFeatures.selected.indexOf(gmlid) !== -1) {
                                // повторный клие по объекту								
								var mapobject = this.selectedFeatures.findobjectsById(layer.xId, gmlid);								
								this.selectedFeatures.remove(mapobject);
								this.selectObject(layer, gmlid, event.dataobject);
							}
							else {
							  this.selectedFeatures.addselect(gmlid, layer.id);
                              //_that.canCancel = false;
                              if (!(layer instanceof GWTK.graphicLayer)) {                                
								this.selectedFeatures.addWfs(gmlid, layer.id, "2", "1");
                                var _that = this, $ep = $(this.map.eventPane);
                                $ep.one('mapobjectloadWfs', function (e) {                                    
									_that.selectObject(layer, gmlid, event.dataobject);
                                });
                              }
                              else {
                                var index = layer.getNumberById(gmlid);
                                if (index != null) {
                                    this.selectedFeatures.addJsonObject(layer.GeoJSON, index, layer);
                                    this.selectObject(layer, gmlid, event.dataobject);
                                }
                              }	
							}							
                        }
                    }
                }
            }
        },


        /**
        * Событие на перерисовку карты
        * @method  onOverlayRefresh
        * @param event {Object} Событие
        */
        // ===============================================================
        onOverlayRefresh: function (event) {
            // Создадим панель для рисования топологии
            if (!this.createdrawpanel || !this.createdrawpanel())
                return;

            // Поднять панель рисования
            if (this.drawpanel) {
                this.zIndexDrawPanel('up', this.drawpanel, this);
            }

            // Затычка для масштабирования, событие mouseover для svg назначается раньше, 
            // чем wms панель стала видимой после стирания временной панели.
            this.searchObjectsByAreaFrame(w2utils.lang("Select the highlighted object on the map"));
            if (this.topology) {
                this.topology.updateSvgEvents();
            }
        },

        /**
         * Событие изменения списка локальных слоев 
         * @method  onLayerListChanged
         * @param event {Object} Событие
         */
        // ===============================================================
        onLayerListChanged: function (event) {
            this.selectlayersid = this.setselectlayers();
            this.onOverlayRefresh(event);
        },

        ///**
        // * Событие изменения видимости слоя 
        // * @method  onVisibilityChanged
        // * @param event {Object} Событие
        // */
        // ===============================================================
        onVisibilityChanged: function (event) {
            this.selectlayersid = this.setselectlayers();
            this.onOverlayRefresh(event);
        },

        /**
         * Обработчик события click в карте 
         * @method onMapclick
         * @param event {Object} объект события GWTK.event
         */
        // ===============================================================       
        onMapclick: function (event) {
            event.stopPropagation();
            return;
        },

        // Найти и отрисовать объекты для выбора 
        searchObjectsByAreaFrame: function (message) {			
            //this.topology.searchObjectsByAreaFrame(null, this.excludeObjects, 'edit', this.selectlayersid, null, message);
            this.topology.searchObjectsByAreaFrame(null, [], 'edit', this.selectlayersid, null, message, true);
		}

    };

    GWTK.Util.inherits(GWTK.SelectMapObjectActionHover, GWTK.MapAction);


    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    /**
     * Обработчик создания геометрии объекта произвольным контуром
     * @method mapCreationObjectGeometry
     * @param map {Object} карта GWTK.Map
     * @param mapobjectJSON {Object} объект карты в формате geojson
     * @param param {Object} параметры рисовавания 
     * {
     * "box": true   - наличие габаритной рамки для вращения и мастабирования при создании или редактировании геометрии объекта 
     * }
     * @returns  - true, если процесс создания начался
     * при завершении операции создания/редактирования инициируется триггер creationobjectgeometry {
     * "type": "creationobjectgeometry"
     * "action":  'ok' или "cancel" в зависимости от завершения
     * "mapobject" : объект карты в формате geojson при action = "save"
     *}
     * Пример обработки триггера
     *   $(map.eventPane).one('creationobjectgeometry', function () {
     *   // действия пользователя
     *   });
     */

    GWTK.CreationObjectGeometryAction = function (map, mapobjectJSON, param) {
        this.error = true;

        GWTK.MapAction.call(this, null, 'CreationObjectGeometry');           // родительский конструктор     

        if (!map) {
            console.log("CreationObjectGeometry. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        if (!mapobjectJSON) {
            console.log("CreationObjectGeometry. " + w2utils.lang("Not defined a required parameter") + " mapobjectJSON.");
            return;
        }

        this.editobject = new GWTK.mapobject(map, '0');
        if (!this.editobject.loadJSON(mapobjectJSON, true)) {
            console.log("CreationObjectGeometry. " + w2utils.lang("Not defined a required parameter") + " mapobjectJSON.");
            return;
        }
        this.dimension = this.editobject.geometry.dimension;

        //if (selectlayersid && selectlayersid instanceof Array && selectlayersid.length > 0)
        //    this.selectlayersid = selectlayersid;
        this.map = map;
        this.name = this.name + this.editobject.spatialposition;
        this.param = param;

        this.drawobject = new GWTK.DrawingObject(this.map, {
            'nocontextmenu': true,   // не отображать конткстное меню
            'func': {
                'fn_draggable': this.do_draggable,
                //'fn_popupmenu': this.task.popupmenu,
                'fn_downpoint': this.popupmenu,
                'fn_updatepoint': this.updatepoint,
                'fn_parentpanel': this.getdrawpanel
            }

        }, this);
        this.drawobject.drw_centerpoints = true;


        // Класс топологии
        this.topology = new GWTK.Topology(this.map, {
            'svgid': this.name + '_canvas',
            //'selectlayersid': this.selectlayersid,
            'func': {
                'fn_parentpanel': this.getdrawpanel,
                'fn_drawcustom': this.draw
            }
        }, this);


        //this.drawobject.options_points["fill"] = "#ff3322";
        //this.drawobject.options_line["stroke-width"] = "1px";
        //this.drawobject.refreshstyle();
        this.topology.drawoptions_over["stroke"] = "transparent";
        this.topology.drawoptions_over["fill"] = "transparent";

        // Номер контура 
        this.subjectnumber = 0;

        // Создадим панель для рисования
        var mapdiv = (this.map.drawPane) ? this.map.drawPane : (this.map.overlayPane);
        if (!mapdiv) return;
        var drawpanel_id = 'mapobject' + GWTK.Util.randomInt(100, 150);    //this.editobject.gid;//.replace(/\./g, '_');
        var p = $('#mapobject-overlayPane_' + drawpanel_id);
        if (p && p.length > 0)
            p.remove();
        this.drawpanel = GWTK.DomUtil.create('div', 'overlay-panel', this.map.drawPane);// mapdiv);
        this.drawpanel.id = 'mapobject-overlayPane_' + drawpanel_id;
        this.zIndexDrawPanel('up', this.drawpanel);

        // класс топологии
        this.topology.searchObjectsByAreaFrame(null, [], "edit", this.selectlayersid);

        // Замыкание контекста 
        this.onMouseDown = GWTK.Util.bind(this.onMouseDown, this);
        this.onOverlayRefresh = GWTK.Util.bind(this.onOverlayRefresh, this);
        this.onKeyDown = GWTK.Util.bind(this.onKeyDown, this);


        this.error = false;
        this.popupId = 'popupmenu' + GWTK.Util.randomInt(100, 150);
        this.message = w2utils.lang("Create contour, causing a point on the map") + '. ' + w2utils.lang("Save") + ": Ctrl+Left, Ctrl+S, Ctrl+Enter. " + w2utils.lang("Cancel") + ": Esc" + "...";

    };

    GWTK.CreationObjectGeometryAction.prototype = {

        /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
         * @method set
         * @param options {Object} параметры обработчика
         */
        // ===============================================================
        set: function (options) {

            var $drawpanel = $(this.drawpanel);
            var parent = $drawpanel.parent();

            // Перерисовка карты
            $(this.map.eventPane).on('overlayRefresh', this.onOverlayRefresh);

            // переопределить клики для планшетов    ?????   
            $drawpanel.off("touchstart", this.map.handlers.touchStart);   // аналог onmousedown
            $drawpanel.off("touchmove", this.map.handlers.touchMove);     // аналог onmousemove
            $drawpanel.off("touchend", this.map.handlers.touchEnd);       // аналог onmouseup    

            // клик на карте
            this.map.on({ type: "click", target: "map", phase: 'before' }, this.onMouseDown);
            // События на нажатие клавиш
            this.map.on({ type: "keydown", target: "map", phase: 'before', sender: this }, this.onKeyDown);

            this.map.statusbar.set(this.message);
        },

        /**
         * Сбросить настройки (отключение обработчиков событий, инициализация флажков и др.)
         * @method clear
         */
        // ===============================================================
        clear: function () {
            if (!this.trigger) // Если триггер на окончание операции не посылали (кто-то другой закрыл обработчик), то надо восполнить этот пробел 
                $(this.map.eventPane).trigger({ "type": "creationobjectgeometry", action: 'cancel' });

            // удалить меню 
            this.removepopupmenu();

            // События на нажатие клавиш
            this.map.off({ type: "keydown", target: "map", phase: 'before', sender: this }, this.onKeyDown);
            // клик на карте
            this.map.off({ type: "click", target: "map", phase: 'before' }, this.onMouseDown);
            // Перерисовка карты
            $(this.map.eventPane).off('overlayRefresh', this.onOverlayRefresh);

            this.zIndexDrawPanel('down', this.drawpanel);

            this.drawobject.destroy();
            this.topology.destroy();
            $(this.drawpanel).remove();

            this.map.statusbar.clear();
        },

        /**
         * Завершить посторение метрики
         * @method stop
         */
        // ===============================================================
        stop: function (ok) {
            this.trigger = true;

            if (ok) {
                var count = this.editobject.geometry.count();
                switch (this.editobject.spatialposition.toLowerCase()) {
                    case 'polygon':
                    case 'multipolygon':
                        if (count < 4) return;
                        break;

                    case 'linestring':
                    case 'multilinestring':
                        if (count < 2) return;
                        break;
                    case 'point':
                        if (count < 1) return;
                        break;
                }
                // триггер на сохранение
                if (this.editobject) {
                    $(this.map.eventPane).trigger({ "type": "creationobjectgeometry", action: 'ok', mapobject: this.editobject.saveJSON() });
                }
                else
                    $(this.map.eventPane).trigger({ "type": "creationobjectgeometry", action: 'cancel' });
                var map = this.map;
                window.setTimeout(function () {
                    map.closeAction();
                }, 2000);
            }
            else {
                // триггер на отказ
                $(this.map.eventPane).trigger({ "type": "creationobjectgeometry", action: 'cancel' });
                this.map.closeAction();
            }

        },


        /**
        * Удалить точку 
        * @method removePoint
        */
        // ===============================================================
        deletepoint: function (number) {
            if (!number) return;
            number = parseInt(number);
            if (number) {
                this.editobject.geometry.deletepoint(number);
                if (this.editobject.spatialposition.toLowerCase() == 'polygon')
                    this.editobject.geometry.closeobject(true);
                this.refreshdraw();
            }
        },



        /**
         * Добавить точку в координатах экрана в объект
         * @method addpoint
         * @param x {Int} координата по оси х
         * @param y {Int} координата по оси y
         , @param nooffset {Boolean} Не пересчитывать смещение координат
         */
        // ===============================================================
        addpoint: function (x, y, nooffset) {
            if (!this.editobject.geometry)
                return;

            var count, geo = this.topology.pixel2geoOffset(x, y, nooffset);
            if (!geo) return;

            var newpoint = (this.dimension == 3) ? new GWTK.Point3D(geo[0], geo[1], 0) : new GWTK.Point(geo[0], geo[1]),
                number = this.editobject.geometry.count(this.subjectnumber),
                lastpoint = (number) ? this.editobject.geometry.getpoint(number, this.subjectnumber) : { x: 0, y: 0, h: 0 };

            if (newpoint.x == lastpoint.x && newpoint.y == lastpoint.y)
                return;

            switch (this.editobject.spatialposition.toLowerCase()) {
                case 'polygon':
                case 'multipolygon':
                    if (number < 3)
                       (this.dimension == 3) ? this.editobject.geometry.appendpoint3D(newpoint.x, newpoint.y, newpoint.h, this.subjectnumber) :
                                               this.editobject.geometry.appendpoint(newpoint.x, newpoint.y, this.subjectnumber);
                    number = this.editobject.geometry.count(this.subjectnumber);
                    if (number == 3) // Замкнем
                        this.editobject.geometry.closeobject(false, this.subjectnumber);
                    else {
                        if (number >= 4) {
                            (this.dimension == 3) ? this.editobject.geometry.insertpoint3D(newpoint.x, newpoint.y, newpoint.h, number, this.subjectnumber) :
                                                    this.editobject.geometry.insertpoint(newpoint.x, newpoint.y, number, this.subjectnumber);
                        }
                    }
                    break;

                case 'linestring':
                case 'multilinestring':
                    (this.dimension == 3) ? this.editobject.geometry.appendpoint3D(newpoint.x, newpoint.y, newpoint.h, this.subjectnumber) :
                                             this.editobject.geometry.appendpoint(newpoint.x, newpoint.y, this.subjectnumber);
                    break;
                case 'point':
                    if (number < 1) {
                        (this.dimension == 3) ? this.editobject.geometry.insertpoint3D(newpoint.x, newpoint.y, newpoint.h, 0, this.subjectnumber) :
                                                this.editobject.geometry.insertpoint(newpoint.x, newpoint.y, 0, this.subjectnumber);
                    }
                    else {
                        this.editobject.geometry.updatepoint(1, this.subjectnumber, newpoint);
                    }
                    //this.stop(true);
            }

        },

        /**
        * Создание панели для рисования объекта
        * @method getdrawpanel
        */
        // ===============================================================
        getdrawpanel: function () {
            return this.drawpanel;
        },

        // Функция отрисовки редактируемого объекта с габаритной рамкой 
        draw: function (svg) {
            this.drawobject.draw(this.editobject, svg, true, this.drw_centerpoints, false, (this.param && this.param.box) ? true : false);
        },

        // Перерисовать drawobject
        refreshdraw: function () {
            if (this.drawobject.mapobject.geometry.count() <= 1)
                this.drawobject.refreshdraw();
            else
                this.drawobject.refreshdraw(null, (this.param && this.param.box) ? true : false);
        },


        /**
        * Событие на перерисовку карты
        * @method  onOverlayRefresh
        * @param event {Object} Событие
        */
        // ===============================================================
        onOverlayRefresh: function (event) {
            if (this.drawpanel) {
                this.drawpanel.style.left = '0px';
                this.drawpanel.style.top = '0px';
            }


            this.topology.searchObjectsByAreaFrame(null, null, 'edit', this.selectlayersid);

            // Затычка для масштабирования, событие mouseover для svg назначается раньше, 
            // чем wms панель стала видимой после стирания временной панели.
            window.clearInterval(this.timer);
            var temp = $('#' + this.map.tilePane.id + '_temp');
            var _that = this;
            if (event && event.cmd == 'zoom' && temp.length > 0) {
                this.timer = window.setInterval(function () {
                    _that.topology.searchObjectsByAreaFrame(null, null, 'edit', _that.selectlayersid);
                    if (parseInt(temp.css('z-index')) <= 0) {
                        if (_that.topology.svgDraw) {
                            _that.topology.svgDraw.updateEvents();
                        }
                        window.clearInterval(_that.timer);
                    }
                }, 1200);
                return;
            }

        },

        /**
         * Действия в процессe перемещения точки
         * @method do_draggable
         * @param process {String} Наименование процесса "start", "drag", "stop" 
         * @param target {Object} объект события по перемещению
         * @param ui {Object} Объект, содержащий смещение точки
         */
        // ===============================================================
        do_draggable: function (process, target, ui) {

            // удалить меню 
            this.removepopupmenu();

            if (!this.drawobject || !this.drawpanel) return;

            switch (process) {
                case 'start':
                    // Oтключить события карты в топологии
                    this.topology.map_events('off');
                    break;

                case 'stop':
                    if (this.drawobject.drag.rotate) {
                        this.refreshdraw();
                    }

                    // Включить события карты в топологии
                    this.topology.map_events('on');
                    break;

            }

            return true;
        },


        /**
         * Обновление координат точки объекта
         * @method updatepoint
         * @param div {Element} Элемент, содержащий всю информацию о точке
         * @param ui {Object} Объект, содержащий позицию точки { "position": {"left": left, "top": top };
         * @param insert {Boolean} признак вставки новой точки (для серединных точек), иначе обновление существующей
         */
        // ===============================================================
        updatepoint: function (div, ui, insert) {

            // Удалим сервисные линии
            this.drawobject._removeservicelines();

            if (!div || !ui) return;

            var geometry = this.editobject.geometry;
            if (!geometry) return;

            var number = this.drawobject.getnumber(div.id);
            if (number < 0) return;

            var geo,
                point = GWTK.point(ui.position.left, ui.position.top),
                coord = this.map.tiles.getLayersPointProjected(point),
                subjectnumber = this.drawobject.getsubjectnumber(div.id);

            // Если выбрана точка в классе топологии, ио взять ее координаты
            if (this.topology.currentPoint)  // Если имеется выбранная точка, то добавим ее
                geo = this.topology.getpointgeo(this.topology.currentPoint);
            else
                geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
            if (!geo) return;

            if (insert) {// вставить точку
                (this.dimension == 3) ? geometry.insertpoint3D(geo[0], geo[1], 0, number + 1, subjectnumber) :
                                        geometry.insertpoint(geo[0], geo[1], number + 1, subjectnumber);
                //geometry.insertpoint3D(geo[0], geo[1], 0, number + 1, subjectnumber);
            }
            else {      // обновить точку
                var point = (this.dimension == 3) ? new GWTK.Point3D(geo[0], geo[1], 0) : new GWTK.Point3D(geo[0], geo[1]);
                geometry.updatepoint(number + 1, subjectnumber, point);
                if (this.editobject.spatialposition.toLowerCase() == 'polygon')
                    geometry.closeobject(true, subjectnumber);
            }

            this.refreshdraw();
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
            this.removepopupmenu();

            var editobject = this.editobject;
            if (!div || !div.id || !editobject || !editobject.geometry || !editobject.spatialposition
                || div.id.indexOf('center') > 0)
                return;

            var left = '0px', top = '0px', spatialposition = editobject.spatialposition.toLowerCase();
            if (!isNaN(x)) left = parseInt(x - 5, 10) + 'px';
            if (!isNaN(y)) top = parseInt(y - 5, 10) + 'px';

            var subjectnumber = this.drawobject.getsubjectnumber(div.id);
            var pcount = editobject.geometry.count(subjectnumber);
            var styleDiv = ' style="left:' + left + ';top:' + top + '; cursor: pointer;opacity: 0.9"';
            var deletepoint = '<tr><td width="16px" class="ededmethod_delpoint" style="background-repeat:no-repeat;"/>  <td id="' + this.popupId + '_deletepoint" style="padding-left:5px;">' + w2utils.lang("Remove point") + '</td></tr>';

            // Определим номер точки
            var save = '<tr><td width="16px" class="ededmethod_save" style="background-repeat:no-repeat;"/>  <td id="' + this.popupId + '_save" style="padding-left:5px;">' + w2utils.lang("Save") + ' (Ctrl+Left)</td></tr>',
                cancel = '<tr><td width="16px" class="ededmethod_cancel" style="background-repeat:no-repeat;"/>  <td id="' + this.popupId + '_cancel" style="padding-left:5px;">' + w2utils.lang("Cancel") + ' (Esc)</td></tr>'
            closeobject = '<tr><td width="16px" class="ededmethod_closeobject" style="background-repeat:no-repeat;"/>  <td id="' + this.popupId + '_closeobject" style="padding-left:5px;">' + w2utils.lang("Close object") + '</td></tr>',
            changedirection = '',
                number = this.drawobject.getnumber(div.id),
                isclosing = true,
                pointfirst = editobject.geometry.getpoint(1, subjectnumber),
                pointlast = editobject.geometry.getpoint(pcount, subjectnumber);

            // завершить создание и сохранить
            switch (spatialposition) {
                case 'linestring':
                case 'multilinestring':
                    if (pcount < 2) {
                        save = '';
                        closeobject = '';
                    }
                    break;
                case 'polygon':
                case 'multipolygon':
                    closeobject = '';
                    if (pcount < 4) {
                        save = '';
                        deletepoint = '';
                    }
                    break;
            }

            // сменить направление
            if (spatialposition != 'point' && pcount > 1)
                changedirection = '<tr><td width="16px" class="ededmethod_changedir" style="background-repeat:no-repeat;"/> <td id="' + this.popupId + '_changedirection" style="padding-left:5px;">' + w2utils.lang("Change direction") + '</td></tr>';

            var text =
            '<div id="' + this.popupId + '" class=" map-panel-def editTable" ' + styleDiv + ' >' +
            '<div align="left"  class="menupoint" style="margin-left:5px; margin-top:5px;">' + //actionname +
                '<div><img id="' + this.popupId + '_close" class="panel-info-close" title="' + w2utils.lang("Close") + '" src="' + GWTK.imgClose + '"> </div>' +
            '</div>' +
            '<div>' +
            '<table cellspacing="2px;" cellpadding="2px" style="width:140px;">' +
                 deletepoint +
                 closeobject + // замкнуть
                 changedirection + // сменить направление 
                 save +   // завершить
                 cancel +    // отменить операцию
            '</table>' +
            '</div></div>';

            $(this.drawpanel).append(text);

            var _that = this, $popupmenu = $('#' + this.popupId);
            $('#' + this.popupId + '_close').click(function (event) {
                $popupmenu.remove();
                return false;
            });

            $('#' + this.popupId + '_deletepoint').click(function (event) {
                $popupmenu.remove();
                if (!div) {
                    w2alert(w2utils.lang("There is no point to remove"));
                    return false;
                }
                // удалить точку
                _that.deletepoint(_that.drawobject.getnumber(div.id) + 1, _that.drawobject.getsubjectnumber(div.id));
                return false;
            });

            // Завершить 
            $('#' + this.popupId + '_save').click(function (event) {
                $popupmenu.remove();
                _that.stop(true);
                return false;
            });

            // Замкнуть
            $('#' + this.popupId + '_closeobject').click(function (event) {
                $popupmenu.remove();
                editobject.geometry.closeobject(false, subjectnumber);
                _that.refreshdraw();
                return false;
            });

            // Изменить направление
            $('#' + this.popupId + '_changedirection').click(function (event) {
                $popupmenu.remove();
                editobject.geometry.changedirection(subjectnumber);
                _that.refreshdraw();
                return false;
            });

            // Отменить
            $('#' + this.popupId + '_cancel').click(function (event) {
                $popupmenu.remove();
                _that.stop();
                return false;
            });

        },

        /**
         * удалить контекстное меню для точки объекта 
         * @method removepopupmenu
         */
        // ===============================================================
        removepopupmenu: function () {
            $('#' + this.popupId).remove();
        },

        /**
         * Нажатие мыши при создании объекта
         * @method  onMouseDown
         * @param event {Object} Событие
         */
        // ===============================================================
        onMouseDown: function (e) {
            //console.log(e);
            var ev = e.originalEvent;

            // Завершение создания объекта при комбинации Ctrl+mousedown
            if (ev.ctrlKey && ev.which == 1) {  // Левая кнопка мыши (завершить создание)
                this.stop(true);
                return;
            }

            if (this.drawobject.parentpanel) {
                ev.clientX -= $(this.drawobject.parentpanel()).offset().left;
                ev.clientY -= $(this.drawobject.parentpanel()).offset().top;
            }

            this.addpoint(ev.clientX, ev.clientY, true);

            this.refreshdraw();
            e.stopPropagation();
            this.map.statusbar.set(this.message);
        },

        /**
          * Событие нажатия клавиши
          * @method  onKeyDown
          * @param event {Object} Событие
          */
        // ===============================================================
        onKeyDown: function (event) {

            var which = event.originalEvent.which;
            var ctrlKey = event.originalEvent.ctrlKey;
            if (which === 83 && ctrlKey || which === 13 && ctrlKey) { // ctrl+S или Ctrl+Enter сохранение
                this.stop(true);
            }
            else if (which == 27) {  // Esc
                this.stop();
            }
            else {
                return;
            }

            event.originalEvent.preventDefault();
            event.originalEvent.stopPropagation();
            event.preventDefault();
            event.stopPropagation();
        },

        // Поднять/опустить zIndex панели рисования и родительской панели
        zIndexDrawPanel: function (type, selector) {
            var $drawpanel = $(selector);
            var $parent = $drawpanel.parent();

            // поднять
            if (type == 'up') {
                this.zIndex = $parent.css('zIndex');
                $parent.css('zIndex', '710');
                $drawpanel.css('zIndex', '710');
            }
            else {
                $parent.css('zIndex', this.zIndex);
                $drawpanel.css('zIndex', this.zIndex);
            }
        }

    };

    GWTK.Util.inherits(GWTK.CreationObjectGeometryAction, GWTK.MapAction);


    /*******************************************************************
     *                                                                  *
     *                      Редактор объектов карты                     *
     *               Обработчик перемещения объекта карты               *
     *                                                                  *
     *******************************************************************/
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // Обработчик перемещения объекта карты
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    /**
     * Обработчик Обработчик перемещения объекта карты
     * @class  GWTK.MovingMapObjectAction
     * @constructor GWTK.MovingMapObjectAction
     * @param task {Object} задача (допустимый)
     * @param params {Object} - объект параметров:
     *  - name (string)- название действия
     *  - mapobject (GWTK.mapobject) - объект карты
     *  - fn_callback {Function} функция завершения перемещения, возвращает оьъкт карты с пересчитанными координатами и смещение в геодезических координатах:
     *  - drawOptions (Object) -  параметры отрисовки контура объекта
     *  - message (String) - строка для отображения в статус баре
     */

    GWTK.MovingMapObjectAction = function (task, params) {
        this.error = true;
        if (!params || !params.mapobject || params.mapobject instanceof GWTK.mapobject === false)
            return;
        GWTK.MapAction.call(this, task, params.name || 'movingmapobject');    // родительский конструктор

        // Не отображать объекты карты в диалоге выбора объектов
        this.showInfoOfSelectedObjects = false;

        this.params = params;
        this.message = this.params.message || w2utils.lang("Press and move, retaining clicked a mouse button") + '...';

        this.map = this.getMap();
        if (!this.map) return;

        this._drawOverlayPane = 'moving-overlayPane_' + this.name;

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

    GWTK.MovingMapObjectAction.prototype = {

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
         * Запрос панели для рисования объекта
         * @method getdrawpanel
         */
        // ===============================================================
        getdrawpanel: function () {
             return this.drawpanel;
        },

        /**
         * Создание панели для рисования объекта
         * @method getdrawpanel
         */
        // ===============================================================
        createdrawpanel:function(){
            if (this.drawpanel) {
                $(this.drawpanel).remove();
            }

            if (!this.map.drawPane)
                return;

            var el = document.getElementById(this._drawOverlayPane);
            if (el) {
                el.parentNode.removeChild(el);
            }
            this.drawpanel = GWTK.DomUtil.create('div', 'overlay-panel', this.map.drawPane);
            this.drawpanel.id = this._drawOverlayPane;
        },

        /**
         * Настройка класса (подключение обработчиков событий, установка флажков и др.)
         * @method set
         * @param options {Object} параметры обработчика
         */
        // ===============================================================
        set: function (options) {

            this.mapobjectId = this.params.mapobject.id;
            this.params.mapobject.id = this.name + this.mapobjectId;
            this.mapobjectGid = this.params.mapobject.gid;
            this.params.mapobject.gid = this.name + this.mapobjectGid;

            // Класс рисования объекта
            this.createdrawpanel();
            this.drawobject = new GWTK.DrawingObject(this.map, {
                'nocontextmenu' : true,   // не отображать конткстное меню
                'func': {
                    'fn_parentpanel': this.getdrawpanel
                }
            }, this);

            // Параметры отрисовкм
            if (typeof this.params.drawOptions === 'object') {
                // расширение настроек графики
                $.extend(this.drawobject.options_points, this.params.drawOptions);
                this.drawobject.refreshstyle();
            }

            this.svgDraw = new GWTK.EditSvgDrawing(this.map, {
                'id' :  this.name + '_pane',
                'parent' : this.drawpanel,
                'svgid' : this.name + '_canvas'
            }, this);
            if (this.svgDraw.error) {
                this.svgDraw = null;
            }

            // функция перемещения точки
            if (this.drawobject) {
                this.fn_draggable = this.drawobject.getFunctions().fn_draggable;
                this.drawobject.setFunctions({ "fn_draggable": GWTK.Util.bind(this.do_processmethod, this) });
            }

            // Отрисовать текущий объект
            this.drawobject.draw(this.params.mapobject, this.svgDraw, true, null, true);

            // Инициировать класс перемещения
            this.movedrag.init();
            this.drawpanel.style.cursor = 'move';
            this.drawobject.zIndexDrawPanel('up', this.drawpanel);

            // Назначим события нажатия мыши
            this.map.on({ type: 'mousedown', target: "map", phase: 'before', sender: this }, this.onMouseDown);
            this.map.on({ type: 'mouseup', target: "map", phase: 'before', sender: this }, this.onMouseUp);

            this.map.statusbar.set(this.message + '...');

        },

        /**
         * Сбросить настройки (отключение обработчиков событий, инициализация флажков и др.)
         * @method clear
         */
        // ===============================================================
        clear: function () {

            // Назначим события нажатия мыши
            this.map.off({ type: 'mousedown', target: "map", phase: 'before', sender: this }, this.onMouseDown);
            this.map.off({ type: 'mouseup', target: "map", phase: 'before', sender: this }, this.onMouseUp);
            this.map.off({ type: 'mousemove', target: "map", phase: 'before', sender: this }, this.onMouseMove);

            if (this.drawpanel) {
                $(this.drawpanel).remove();
            }
            if (this.drawobject) {
                this.drawobject.destroy();
            }
            if (this.svgDraw){
                this.svgDraw.destroy();
            }

            // Воостановим идентификаторы
            this.params.mapobject.id = this.mapobjectId;
            this.params.mapobject.gid = this.mapobjectGid;

            // Очмстим статус бар
            this.map.statusbar.clear();

        },

        /**
         * Событие при нажатии мыши в режиме перемещения объекта
         * @method  onMouseDown
         * @param event {Object} Событие
         */
        // ==============================================s=================
        onMouseDown: function (event) {

            var e = event.originalEvent;
            if (!e) return;
            if (e.target && (e.target.nodeName != 'svg' && e.target.id != 'topology_canvas'))
                return true;

            // Запомним положение точки
            this.movedrag.setOffsetPoint(GWTK.point(e.clientX, e.clientY));
            // Событие на перемещение мыши
            this.map.on({ type: 'mousemove', target: "map", phase: 'before', sender: this }, this.onMouseMove);

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
            if (!event) return;

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

                this.movedrag.dx = dx; this.movedrag.dy = dy;
                this.movedrag.x += dx; this.movedrag.y += dy;
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
            // this.map.off({ type: 'mousemove', target: "map", phase: 'before', sender: this }, this.onMouseMove);

            var e = event.originalEvent;
            if (!e) return;

            this.offsetpoints(this.movedrag.x, this.movedrag.y);
            event.stopPropagation();

            // Завершить процесс перемещения
            this.complete();

            return false;
        },

        /**
         * Смещение точек объекта
         * @method  offsetpoints
         * @param dx, dy {int} смещение в координатах экрана
         */
        // ===============================================================
         offsetpoints: function(dx, dy ){
            var el = this.drawobject.getpointElemByNumber(0, 0);
            if (!el) return;
            var point = this.drawobject.getpositionByPointId(el.id);
            if (!point) return;

            point = GWTK.point(point.x + dx, point.y + dy);
            var coord = this.map.tiles.getLayersPointProjected(point);
            var geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x),
                geopoint;
            var geopoint = this.params.mapobject.geometry.getpoint(1, 0);

            if (geopoint) {
                this.deltaGeo = [geo[0] - geopoint.x, geo[1] - geopoint.y];
                this.params.mapobject.geometry.offsetpoints(this.deltaGeo);
            }
        },

        /**
         * Завершить процесс создания метрики объекта
         * @method complete
         */
        // ===============================================================
        complete: function () {
            // Завершить обработчик
            this.clear();

            if (this.params.fn_callback){
                this.params.fn_callback(this.params.mapobject, this.deltaGeo);
            }


            // // Запустить обработчик заново
            // this. clear();
            // this.set();

        },

        /**
         * Обновиление отображения Wms слоев при сдвиге мыши за пределы окна
         * @method wmsDrawing
         */
        // ===============================================================
        wmsDrawing: function () {
            var coord = map.tiles.getLayersCenterProjected();
            if (coord != null) {
                this.map.setMapCenter(coord);
                this.map.tiles.wmsManager.wmsDrawing();
            }
        }


    };
    GWTK.Util.inherits(GWTK.MovingMapObjectAction, GWTK.MapAction);


}



