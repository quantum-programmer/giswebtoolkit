/************************************* Полищук Г ***** 03/03/20 ****
************************************** Нефедьева ***** 03/06/19 ****
************************************** Соколова  ***** 04/06/21 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2022              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                      Редактор объектов карты                     *
*                                                                  *
*******************************************************************/

if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, "find", {
        value: function(predicate) {
            if (this === null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        },
        configurable: true,
        writable: true
    });
}

if (window.GWTK) {

/********************************************************************
*                                                                   *
*           Служебные функции Редактора объектов карты              *
*                                                                   *
********************************************************************/

GWTK.MapEditorUtil = {

    /**
     * Определить доступность пунктов меню для текущей точки или режима создания пожобъектов
     * для объетов различного типа
     * @method isEnabledItemMenu
     * @param spatialposition {String} - тип объекта ('point','multipoint, title','vector', 'polygon' и тд
     * @param graphic {bool} - признак локального слоя
     * @param return (Bool) - true - доступно, false - нет
     */
    isEnabledItemMenu: function (spatialposition, graphic) {
        if (!spatialposition) return;
        spatialposition = spatialposition.toLowerCase();
        if (((spatialposition == 'point' || spatialposition == 'multipoint') && !graphic) || spatialposition == 'title' || spatialposition == 'vector')  // если  точечный,  подпись,  вектор
            return false;
        return true;
    },

    /**
     * Имеются ли объекты для редактирования в настройках редактора
     * @method iseditingobjects
     * @param maplayerid {Object} - Объект идентификатора слоя {
     *     "layerid": "",
     *     "editingdata" : []  // массив editingdata из параметров редактора settings_mapEditor
     * }
     * @returns {Object} Найденный список объектов слоя
     */
    iseditingobjects: function (maplayerid) {
        if (!maplayerid || !maplayerid.editingdata || !maplayerid.editingdata.objects || maplayerid.editingdata.objects.length == 0)
            return;
        return maplayerid.editingdata.objects;
    },

    /**
     * Входит ли объект в список редактируемых в настройках редактора
     * @method iseditingobject
     * @param objects {Array Object} Массив объектов слоя
     * @param code {String} Код объекта
     * @param key {String} Ключ объекта
     * @returns {Object} Найденный объект для редактирвания
     */
    iseditingobject: function (objects, code, key) {
        if (!objects) return;
        return objects.find(function (element, index, array) {
            if ((key && element.key == key) || (code && element.code == code))
                return element;
        });
    },

    iseditingbyCodeList: function (layer, code) {
        // Если есть ограничения по codeList
        if (layer) {
            if (layer.codeList && typeof layer.codeList == 'string') {
                if (layer.codeList.split(',').find(
                    function (element, index, array) {
                        if (element == code)
                            return element;
                    }))
                    return true;
            }
            else
                return true;
        }
        return false;
    },

    /**
     * Входит ли семантика в настройках редактора в список редактируемых семантик
     * @method iseditingsemantic
     * @param semantics {Array Object} массив семантик
     * @param key {Object} ключ семантики
     * @return {Object} элемент
     */
    iseditingsemantic: function (semantics, key) {
        if (!semantics) return;
        return semantics.find(function (element, index, array) {
            if (element.code == code)
                return element;
        });
    },

    /**
     * Имеются ли семантики для редактирования в настройках редактора
     * @method iseditingsemantics
     * @param edobject {Object} объект редактирвания
     * @return {Array Object} Массив семантик
     */
    iseditingsemantics: function (edobject) {
        if (!edobject || !edobject.semantics || edobject.semantics.length == 0)
            return;
        return edobject.semantics;
    },

    /**
     * Запрос семантик для редактирования с учетом маски, если она установлена
     * @method getsemanticmask
     * @param allsemantic {Object} - Семантика объекта, класс GWTK.mapsemantic
     */
    getsemanticmask: function (allsemantic, mapobject, layer) {

        if (!allsemantic || !mapobject || !layer) return;

        // var newsemantic = new GWTK.mapsemantic(mapobject, allsemantic.semantics);
        var newsemantic = new GWTK.mapsemantic(null, allsemantic.semantics);
        // имеются ли объекты для редактирования
        var edobjects = GWTK.MapEditorUtil.iseditingobjects(layer);
        if (!edobjects || edobjects.length == 0)
            return newsemantic.semantics;

        var edobject = GWTK.MapEditorUtil.iseditingobject(edobjects, mapobject.code, mapobject.key);
        if (edobject) {
            var edsemantics = GWTK.MapEditorUtil.iseditingsemantics(edobject), edsem;
            if (edsemantics) {
                var indexes = [];
                for (var i = 0; i < allsemantic.count(); i++) {
                    edsem = edsemantics.find(
                        function (element, index, array) {
                            if (element == allsemantic.semantics[i].shortname) {
                                indexes.push(
                                    {
                                        'index': i,
                                        'realindex': (indexes.length == 0) ? i : i - indexes[indexes.length - 1]['index'] - 1
                                    });
                                return element;
                            }
                        });
                };

                if (indexes.length > 0) {
                    var begin = 0;
                    for (var i = 0; i < indexes.length; i++) {
                        newsemantic.semantics.splice(begin, indexes[i].realindex);
                        begin++;
                   }
                   newsemantic.semantics.splice(begin, newsemantic.semantics.length - indexes.length);
                }

            }
            return newsemantic.semantics;
        }
    },

    /**
     * Назначение объекту семантик с учетом маски, если она установлена
     * @method setsemanticmask
     * @param allsemantic {Object} - Семантика объекта с учетом маски, если она установлена, класс GWTK.mapsemantic
     * @param semantics {Array} - Массив назначаемых семантик (GWTK.rscsemantic)
     */
    setsemanticmask: function (allsemantic, semantics) {
        if (!allsemantic || !semantics)
            return;
        // Проверим семантику на валидность
        allsemantic.validatesemantics();

        // Удалим повторяющиеся семантики
        var len;
        if (allsemantic.semantics && (len = allsemantic.semantics.length) > 0) {
            for(var i = len - 1; i >= 0; i--){
                if (allsemantic.semantics[i].reply && allsemantic.semantics[i].reply.toString() == '1') {
                    allsemantic.semantics.splice(i, 1);
                }
            }

            // Добавим повторяющиеся семантики
            for (var i = 0; i < semantics.length; i++) {
                if (semantics[i] && semantics[i].reply && semantics[i].reply.toString() == '1') {
                    allsemantic.semantics.push(semantics[i]);
                }
            }
        }

        // Обновим остальные
        for (var i = 0; i < semantics.length; i++)
            if (semantics[i] && (!semantics[i].reply || semantics[i].reply.toString() !== '1')) {
                allsemantic.value(semantics[i].shortname, semantics[i]);
            }
     },

     /**
     * Найти элемент в массиве
     * @method find
     * @param objlist {Array} Массив объектов
     * @param func - Функция с параметрами (element, index, array), где
     *  element - значение элемента,
     *  index - индекс элемента
     *  array - массив, по которому осуществляется проход
     * @return - При положительном ответе возвращает код возврата функции func
     */

    find: function (objlist, func) {
        if (objlist instanceof Array === false) return;

        if (typeof func !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(objlist);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value, ret;

        for (var i = 0; i < length; i++) {
            value = list[i];
            ret = func.call(thisArg, value, i, list)
            if (ret)
                return ret;
        }
        return undefined;
    },

    /**
     * Дата в формате dd.mm.yyyy hh:mm:ss и время в формате
     * @param now - Date
     * @returns {string}
     */
    getDateAndTimeFormat: function(now){
        if (now && now instanceof Date) {
            var dt = now.toLocaleString('ru', {
                day: "numeric",
                month: "numeric",
                year: "numeric"
            })
            return dt + ' ' + now.getHours() + ':' + now.getMinutes()  + ':' + now.getSeconds();
        }
        else {
            return '';
        }
    },

    /**
     * Дата в формате dd.mm.yyyy и время в формате
     * @param now - Date
     * @returns {string}
     */
    getDateFormat: function(now){
        if (now && now instanceof Date) {
            return now.toLocaleString('ru', {
                day: "numeric",
                month: "numeric",
                year: "numeric"
            });
        }
        else {
            return '';
        }
    },

    /**
     * Дата в формате dd.mm.yyyy hh:mm:ss и время в формате
     * @param now - Date
     * @returns {string}
     */
    getTimeFormat: function(now){
        if (now && now instanceof Date) {
           return now.getHours() + ':' + now.getMinutes()  + ':' + now.getSeconds();
        }
        else {
            return '';
        }
    },

    /**
     * Нужно ли принудительно завершать создание объекта
     * @method iscomplete
     * @returns {Boolean} true - нужно принудительно завершить создание
     */
    iscomplete: function (editobject, subjectnumber) {
        if (!editobject) {
            return;
        }

        subjectnumber = (subjectnumber) ? subjectnumber : 0;
        var spatialposition = (editobject.spatialposition) ? editobject.spatialposition.toLowerCase() : null;
        if (spatialposition == 'point' || spatialposition == 'multipoint' ||
            (
                (editobject.spatialposition == 'vector' || editobject.spatialposition == 'title')
                && editobject.geometry.count(subjectnumber) >= 2)) {
            return true;
        }

    },

    byId: function (node) {
        return typeof node == 'string' ? document.getElementById(node) : node
    },

    show: function(el){
        el = GWTK.MapEditorUtil.byId(el);
        if (el) {
            //el.style.display = 'block';
            el.style.display = '';
        }
    },

    hide: function(el){
        el = GWTK.MapEditorUtil.byId(el);
        if (el) {
            el.style.display = 'none';
        }
    },

    isvisible: function(el){
        el = GWTK.MapEditorUtil.byId(el);
        if (el) {
            return (!(el.style.display == 'none'));
        }
        else {
            return false;
        }
    },

    width: function(el, value){
        el = GWTK.MapEditorUtil.byId(el);
        if (el) {
            if (value !== undefined) {
                el.style.width = value;
            }
            return el.style.width;
        }
        return 0;
    },

    height: function(el, value){
        el = GWTK.MapEditorUtil.byId(el);
        if (el) {
            if (value !== undefined) {
                el.style.height = value;
            }
            return el.style.height;
        }
        return 0;
    },

    addClass: function(el, classname){
        el = GWTK.MapEditorUtil.byId(el);
        if (el) {
            if (!el.classList.contains(classname)) {
                el.classList.add(classname);
            }
        }
    },

    removeClass: function(el, classname){
        el = GWTK.MapEditorUtil.byId(el);
        if (el) {
            if (el.classList.contains(classname)) {
                el.classList.remove(classname);
            }
        }
    },

    remove: function(el){
        el = GWTK.MapEditorUtil.byId(el);
        if (el) {
            if (el.parentElement) {
                el.parentElement.removeChild(el);
            }
             else {
                 if (el.parentNode) {
                     el.parentNode.removeChild(el);
                 }
             }
        }
    },

    empty: function(el){
        el = GWTK.MapEditorUtil.byId(el);
        if (el) {
            el.innerHTML = '';
        }
    },

    innerHTML: function(el, html){
        el = GWTK.MapEditorUtil.byId(el);
        if (el) {
            el.innerHTML = html;
        }
    },

    click: function(el){
        el = GWTK.MapEditorUtil.byId(el);
        if (el) {
            el.click();
        }
    },

    setActiveElement: function (el) {
        this.addClass(el, 'control-button-active');
    },

    removeActiveElement: function (el) {
        this.removeClass(el, 'control-button-active');
    },

    addEventListener: function (el, type, fn) {
        el = GWTK.MapEditorUtil.byId(el);
        if (el) {
            el.addEventListener(type, fn);
        }
    },

    hasClass: function(el, classname){
        el = GWTK.MapEditorUtil.byId(el);
        if (el) {
            return el.classList.contains(className);
        }
    }

};



    /**
    * Инструмент редактора карты
    * @class GWTK.mapeditor
    * @constructor GWTK.mapeditor
    * @param id {String} Идентификатор объекта
    * @param map {Object} Объект карты
    * @param param {Object} Параметры редактора
    * {"maplayersid": ["", ""]            // редактируемые слои
    *   , "functions": []                 // функциональные возможности ("create", "edit", "delete" или *)
    *   , "editingdata" : [               // маска: редактируемые данные (объекты, семантики объектов), при отсутствии - редактируются все объекты слоя
    *       {   "layerid": ""             // идентификатор редактируемого слоя
    *           , "objects": [            // список объектов
    *               {
    *                   "code": ""        // код объекта (использовать для серии объектов)
    *                   , "key": ""         // ключ объекта (использовать для одиночных объектов)
    *                   , "semantics": [ "","" ]  // список ключей семантик
    *               },...
    *           ] }, ...
    *   ], "selectlayersid": ["", ...] }  //  Массив идентификаторов слоев, участвующих в выборе
    *                                         объектов для привязки и топологии.
    *                                         При отсутствии параметра работа идет со всеми слоями, в которых параметр слоя selectObject = 1
    *   , "transaction": "true"           //  Отмена и восстановление серверных операций над объектами карты,
    *                                     //  при значении «true» - появляются кнопки отмены операций на сервере.
    *   , "info": ["semantics", "metrics"]//Наличие окна с детализированной информации об объекте:
    *                                       - отсутствие параметра или ‘*’ – детализация по атрибутам и геометрии объекта,
    *                                       - пустой массив – детализация отсутствует,
    *                                       - массив заданных значений, ограничения:
    *                                       «semantics» - детализация атрибутов,
    *                                       «metrics» -  детализация геометрии
    *   , oldversion                      // 1 - старая версия редактора карты
    *   , graphic                         // 1 - обрабатывать графические объекты карты
    *   , modelite                        // 1 - облегченная версия без шаблонов, графических объектов и легенды в виде таблицы
    *}
    * @param nopanel {Bool} Флаг, что инструмент Редактора карты не находится в панели инструментов,
    *  в дальнейшем (при необходимости) необходимо вызвать функцию init для добавления кнопки компонента
    *  на панель инструментов
    *
    * Запуск компонента
    *       mapeditor = new GWTK.mapeditor(id, map, settings_mapEditor, true);  // кнопка инструмента будет добавлена в панель инструментов карты в функции init
    *       mapeditor.init();
    *           или
    *       mapeditor = new GWTK.mapeditor(id, map, settings_mapEditor);        // кнопка инструмента сразу добавляется в панель инструментов карты
    *
    * Разрушение компонента и удаление его из панели инструментов карты
    *       mapeditor.destroy();
    *       mapeditor = null;
    */
    // ===============================================================

    GWTK.mapeditor = function (id, map, param, nopanel) {
        this.error = true;

        // Переменные класса
        this.toolname = 'mapeditor';
        this.bt_id = 'panel_button-' + this.toolname;
        // this.bt_idExt = this.bt_id + 'Ext';
        this.bt_idExt = 'panel_button-' + this.toolname + 'Ext';

        this.mapeditorTask = null;

        if (!map) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        // if (!param || !param.functions) {
        //     //console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " param.");
        //     param = {
        //         "maplayersid": []            // редактируемые слои
        //         , "functions": []
        //         , "selectlayersid": []
        //     }
        //     //return;
        // }

        this.map = map;                           // объект карты

        // Слои редактировоания
        this.maplayersid = [];

        // Параметры работы редактора
        this.param = {
            "maplayersid": []            // редактируемые слои
            , "functions": []
            , "selectlayersid": []
            , "oldversion": 0
            , "draw" : 1
        }

        // Проверка версии
        var version = 60, browser = GWTK.getBrowser(),
            oldversion = this.param.oldversion;
        if (browser && browser.mozilla && browser.name.toLowerCase() == 'firefox' && parseInt(browser.version) < version) {
            oldversion = 1;
            this.param.oldversion = oldversion;
        }
        if (param) {
            param.oldversion = (param.oldversion) ? param.oldversion : oldversion;
            $.extend(this.param, param);
        }

        // Параметры при запуске приложения
        this.applicationParam = (param) ? JSON.parse(JSON.stringify(param)) : JSON.parse(JSON.stringify(this.param));

        // this.param = JSON.parse(JSON.stringify(param));

        // уникальный идентификатор объекта
        // this.id = (id) ? id : GWTK.Util.randomInt(100, 150);
        this.id = (id) ? id : this.map.divID + '_' + this.toolname + 'Pane';     // уникальный идентификатор объекта;


        // Добавим в панель инструментов
        this.map.maptools.push(this);

        // идентификатор панели
        this.panelId = 'editorPane' + GWTK.Util.randomInt(150, 200);

        this.onLayerListChanged = GWTK.Util.bind(this.onLayerListChanged, this);
        $(this.map.eventPane).on('layerlistchanged', this.onLayerListChanged);

        // Инициализация  данных
        this.setOptions(param);

        // создание кнопки Режима
        this.nopanel = nopanel;
        if (!this.nopanel)
            this.init();

        this.error = false;

    };

    GWTK.mapeditor.prototype = {

        setOptions: function (param) {
            if (param) {
                // Параметры при запуске приложения
                this.applicationParam = JSON.parse(JSON.stringify(param));

                // Параметры работы редактора
                this.param = JSON.parse(JSON.stringify(param));
            }

            // Слои редактирования
            this.maplayersid = [];
            // Назначим wms слоям карты флаг редактирования, если они входят в настройки редактора
            this.setEditingMapLayers();

        },

        /**
        * Инициализировать компонент "Редактор карты"
        * @method init
        */
        // ===============================================================
        init: function () {
            this.createButton();
        },

        /**
        * Разрушить компонент "Редактор карты"
        * @method destroy
        */
        // ===============================================================
        destroy: function () {
            this.closetask();
            $(this.map.eventPane).off('layerlistchanged', this.onLayerListChanged);
            // Удалим инструмент
            var k = -1;
            for (i = 0; i < this.map.maptools.length; i++) {
                if (this.map.maptools[i].toolname == this.toolname) {
                    k = i; break;
                }
            }
            if (k >= 0)
                this.map.maptools.splice(k, 1);
            // Удалим кнопку
            $('#' + this.bt_id).remove();
        },

        /**
        * Создание кнопки "Редактор карты"
        * @method createButton
        */
        // ===============================================================
        createButton: function () {
            if (!this.map || !this.map.panes || !this.map.panes.toolbarPane)
                return;

            // Если существует, то не создавать второй раз
            if (document.getElementById(this.bt_id))
                return;

            // // var bt = GWTK.DomUtil.create('div', 'control-button control-button-' + this.toolname + ' clickable', this.map.panes.toolbarPane);
            // // bt.id = this.bt_id;
            // // bt.disabled = false;
            // // bt.title = w2utils.lang("Map editor");
            // // bt._pane = this.panelId;
            // // $('#' + this.bt_id).on("click", GWTK.Util.bind(this.onClickButton, this));
            //
            // // var btExt = GWTK.DomUtil.create('div', 'control-button control-button-' + this.toolname + 'Ext clickable', this.map.panes.toolbarPane);
            // var btExt = GWTK.DomUtil.create('div', 'control-button control-button-' + this.toolname + ' clickable', this.map.panes.toolbarPane);
            // btExt.id = this.bt_idExt;
            // btExt.disabled = false;
            // btExt.title = w2utils.lang("Map editor");
            // btExt._pane = this.panelId;
            // $('#' + this.bt_idExt).on("click", GWTK.Util.bind(this.onClickButton, this));

            var btExt = GWTK.DomUtil.create('div', 'control-button control-button-' + this.toolname + ' clickable', this.map.panes.toolbarPane);
            btExt.id = this.bt_idExt;
            btExt.disabled = false;
            btExt.title = w2utils.lang("Map editor");
            btExt._pane = this.panelId;
            $('#' + this.bt_idExt).on("click", GWTK.Util.bind(this.onClickButton, this));

        },

        /**
         * Обработка клика на кнопку редактора
         * @param event
         */
        onClickButton: function(event, param){
            if (!this.param || !this.param.maplayersid) {
                w2alert(w2utils.lang("There are no layers of editing"));
                return;
            }

            // Если задача запущена, то закрыть
            if (this.mapeditorTask) {

                // Определим тип редактора
                var type = (this.mapeditorTask instanceof GWTK.mapeditorTask) ?  'mapeditor' : 'mapeditorExt';
                if ((param && param.checked) || type == 'mapeditor') {
                    $(this.map.eventPane).trigger({type: 'closecomponent', context: 'mapeditorExt'});
                }

                if (type == 'mapeditor') {
                    this.closetask();
                }
                else {
                    if (this.closeTask(this.mapeditorTask)) {
                        this.mapeditorTask = null;
                    }
                }

                // Включить, если нажали переключение
                if (param && param.checked) {
                    this.onClickButton(event);
                    return;
                }
            }
            else {
                // Закрыть компонент меню
                $(".control-button-mapmenu").click();

                // Запустить задачу Редактор карты
                if ( $(event.target).attr('id') == this.bt_idExt) {
                    if (this.param.oldversion) {
                        if (!this.setTask(this.mapeditorTask = new GWTK.mapeditorTask(this.id, this.map, this.applicationParam, '#' + this.bt_idExt))) {
                            this.mapeditorTask = null;
                        }
                    }
                    else {
                        if (!this.setTask(this.mapeditorTask = new GWTK.mapeditorTaskExtended(this.id, this.map, this.applicationParam, '#' + this.bt_idExt))) {
                            this.mapeditorTask = null;
                        }
                        else {
                             if (this.map.options.controlspanel) {
                                this.map.showControlsPanel();
                            }
                        }
                    }
                }
                // else {
                //     if (!this.setTask(this.mapeditorTask = new GWTK.mapeditorTask(this.id, this.map, this.applicationParam, '#' + this.bt_id)))
                //         this.mapeditorTask = null;
                // }
            }


            this.map._writeCookiePanels();
        },

        // Закрытие задач редактора
        closetask: function() {
            this.closeMapeditorTask();
            this.map.statusbar.clear();
        },


        // Обновить параметры редактор карты
        reset: function (settings_mapEditor) {
            this.closeMapeditorTask();
            this.maplayersid = [];

            if (settings_mapEditor)
                this.param = JSON.parse(JSON.stringify(settings_mapEditor));
            this.setEditingMapLayers();
        },

        // Назначим wms слоям карты флаг редактирования, если они входят в настройки редактора
        setEditingMapLayers: function () {
            // Назначим wms слоям карты флаг редактирования, если они входят в настройки редактора
            if (this.param && this.param.maplayersid) {
                var count = this.map.layers.length;
                for (var i = 0; i < count; i++) {
                    this.setLayerEditing(this.map.layers[i]);
                }
            }
        },


        // Создать задачу
        setTask: function (task, autonomous) {

            if (!task || task.error) return;
            if (this.map.setTask(task)) {
                if (task.bt_selector) {
                    GWTK.DomUtil.setActiveElement(task.bt_selector);
                }

                var param = (!autonomous) ? this.applicationParam : this.param;
                task.set(param);
                task.createPane(this.panelId);
                return true;
            }
        },

        // Закрыть задачу mapeditorTask
        closeMapeditorTask: function () {
            var task = this.mapeditorTask;
            if (!task) return false;

            if (task.currentTask) {
                var _that = this;
                // Ждать сообщение от окна сохранения
                $(this.map.eventPane).one('w2confirm_close', function (event) {
                    if (!_that.mapeditorTask) return;
                    if (_that.closeTask(task)) {
                        _that.refreshmap();
                        _that.mapeditorTask = null;
                    }
                });
                // Закрыть текущую задачу
                task.destroyActiveTask(task.currentTask);
                return true;
            }
            else {
                if (this.closeTask(task)) {
                    this.mapeditorTask = null;
                    return true;
                }
            }
            return false;
        },

        // Разрушить задачу
        closeTask: function (task) {
            if (!task) return;

            // Удалить панель минимизации, если она была
            if (task.minimizePanelId) {
                var mapTaskBar = this.map.mapTool('maptaskbar');
                if (mapTaskBar) {
                    mapTaskBar.removeFromPanel(task.minimizePanelId, true);
                }
            }
            if (this.map.closeTask(task)) {
                if (task.bt_selector) {
                    GWTK.DomUtil.removeActiveElement(task.bt_selector);
                }
                //if (task instanceof GWTK.mapeditorTask)  // отошлем триггер
                //    $(this.map.eventPane).trigger({
                //        type: 'GWTK.mapeditorTask',
                //        operation: 'closeTask',
                //        params: { phase: 'after' }
                //    });
                return true;
            }
            return false;
        },


        /**
        * Перерисовка карты
        * @method refreshmap
        */
        // ===============================================================
        refreshmap: function () {
            // Сбросим выделение
            if (this.mapeditorTask) {
                this.mapeditorTask.clearSelectedFeaturesMap();
            }
        },

        /**
         * Добавление слоя карты в список на редактирование
         * @method addmapslayer
         * @param layerid {String} Идентификатор слоя
         */
        // ===============================================================
        addmapslayer: function (layerid, editingParam) {
            editingParam = (editingParam) ? editingParam : { "editing": true };
            this.addLayerEditingParam(this.map.tiles.getLayerByxId(layerid), editingParam);

            if (this.mapeditorTask)
                this.mapeditorTask.layerlistchanged(layerid, "add");
        },

        /**
         * Входит ли слой в список редактируемых
         * @method iseditinglayer
         * @param layerid {String} Идентификатор слоя
         * @returns {Object} Найденный слой
         */
        // ===============================================================
        iseditinglayer: function (layerid) {
            if (!this.param) return;  // Нет параметров редактирования

            layerid = (layerid ? layerid : '').toString();
            // Если нет слоев для редактирования
            if (this.maplayersid.length == 0 && this.param.maplayersid.length > 0) {
                this.setlayers();
            }

            return this.maplayersid.find(
                function (element, index, array) {
                    if (element.layerid && element.layerid.toLowerCase() == layerid.toLowerCase())
                        return element;
                });
        },

        /**
         * Заполнение списка редактируемых слов и слоев, участвующих в выделении
         * @method setlayers
        */
        // ===============================================================
        setlayers: function () {
            this.maplayersid.splice(0, this.maplayersid.length);

            if (!this.param) return;  // Нет параметров редактирования

            var count = this.map.layers.length, realindex = -1, countParam, id;
            for (var i = 0; i < count; i++) {
                if (!this.map.layers[i].visible || !this.map.layers[i].editing)// || !w2ui[maptree.name].get(this.map.layers[i].xId)) // Невидимые слои или слои, не входящие в дерево
                    continue;
                if (!this.map.layers[i].selectObject) { // Такой слой нельзя редактировать
                    console.log(w2utils.lang("Layer") + ' "' + this.map.layers[i].alias + '"' + w2utils.lang(' is excluded from editing because selection of objects is not allowed on it.'));
                    continue;
                }
                if (this.map.layers[i] instanceof GWTK.WmsLayer) {
                    countParam = this.param.maplayersid.length;
                    for (var j = 0; j < countParam; j++) {
                        if (this.map.layers[i].options.id != this.param.maplayersid[j])
                            continue;
                        realindex = realindex < 0 ? i : realindex;
                        this.maplayersid.push({ "layerid": this.param.maplayersid[j] });
                        // Считаем классификатор
                        if (this.map.layers[i].classifier) {
                            this.map.layers[i].classifier.getlegend();
                        }
                    }
                    continue;
                }
                else {
                    if (this.map.layers[i] instanceof GWTK.graphicLayer && this.map.layers[i].editing)
                        this.maplayersid.push({ "layerid": this.map.layers[i].options.id });
                }
                realindex = realindex < 0 ? i : realindex;
            }

            // выставим значение по умолчанию
            if (this.maplayersid.length == 0) {
                return;
            }

            // редактируемые объекты
            if (this.param.editingdata) {
                count = this.maplayersid.length;
                for (var i = 0; i < count; i++) {
                    countParam = this.param.editingdata.length;
                    if (countParam == 0) continue;
                    for (var j = 0; j < countParam; j++) {
                        if (this.maplayersid[i].layerid != this.param.editingdata[j].layerid)
                            continue;
                        this.maplayersid[i].editingdata = JSON.parse(JSON.stringify(this.param.editingdata[j]));
                    }
                }
            }
        },

        // Подлежит ли объект редактированию
        iseditingobject: function (mapobject) {
            var rc = false;
            if (!this.iseditingbyCodeList(this.map.tiles.getLayerByxId(mapobject.maplayerid), mapobject.code))
                return rc;

            if (this.iseditinglayer(mapobject.maplayerid)) {
                var edobject, edobjects = GWTK.MapEditorUtil.iseditingobjects(this.iseditinglayer(mapobject.maplayerid));
                if (edobjects && edobjects.length > 0) {  // список объектов для редактирования задан и объект входит в этот список
                    edobject = GWTK.MapEditorUtil.iseditingobject(edobjects, mapobject.code, mapobject.key);
                    if (edobject)
                        rc = true;

                }
                else  // список объектов для редактирования не задан
                    rc = true;
            }

            return rc;
        },

        // Запрос наличия списка объектов по CodeList
        // layerid -id слоя карты (соответствует map.layers[i].options.id)
        iseditingbyCodeList: function (layer, code) {
            // Если есть ограничения по codeList
            if (layer) {
                if (layer.codeList && typeof layer.codeList == 'string') {
                    if (layer.codeList.split(',').find(
                    function (element, index, array) {
                        if (element == code)
                            return element;
                    }))
                        return true;
                }
                else
                    return true;
            }
            return false;
        },

        /**
        * Запрос семантик для редактирования с учетом маски, если она установлена
        * @method getsemanticmask
        * @param allsemantic {Object} - Семантика объекта, класс GWTK.mapsemantic
        */
        // ===============================================================
        getsemanticmask: function (allsemantic, mapobject) {
            return GWTK.MapEditorUtil.getsemanticmask(allsemantic, mapobject, this.iseditinglayer(mapobject.maplayerid));
        },


        /**
       * Игнорировать изменения в карте (используется при автономном запуске)
       * @method ignoreMapChange
       */
        // ===============================================================
        ignoreMapChange: function (a_val) {
            if (!this._ignoreMapChangeData)
                this._ignoreMapChangeData = {}
            if (!this._ignoreMapChangeOrderCounter)
                this._ignoreMapChangeOrderCounter = 1

            this._ignoreMapChangeState = a_val;

            if (!a_val) {
                var actions = [];
                for (var k in this._ignoreMapChangeData)
                    actions.push(this._ignoreMapChangeData[k]);
                actions.sort(function (l, r) { return l.order - r.order; });
                this._ignoreMapChangeData = {};

                for (var k in actions) {
                    this._ignoreMapChangeProcessEvent(actions[k].event);
                }
            }
        },


       /**
       * Добавить изменения в карте в список отложенных событий
       * @method _ignoreMapChangeProcessEvent
       */
        // ===============================================================
        _ignoreMapChangeProcessEvent: function (event) {
            if (!this._ignoreMapChangeData)
                this._ignoreMapChangeData = {}
            if (!this._ignoreMapChangeOrderCounter)
                this._ignoreMapChangeOrderCounter = 1

            if (!event || !event.maplayer || !event.maplayer.id)
                return;

            if (!this._ignoreMapChangeData[event.maplayer.id]) {
                this._ignoreMapChangeData[event.maplayer.id] = {
                    event: $.extend({}, event),
                    action: event.maplayer.act,
                    order: this._ignoreMapChangeOrderCounter
                };
            } else {
                if ((this._ignoreMapChangeData[event.maplayer.id].event.maplayer.act == 'remove' && event.maplayer.act == 'add') ||
                    (this._ignoreMapChangeData[event.maplayer.id].event.maplayer.act == 'add' && event.maplayer.act == 'remove')) {
                    delete this._ignoreMapChangeData[event.maplayer.id];
                } else {
                    this._ignoreMapChangeData[event.maplayer.id] = {
                        event: $.extend({}, event),
                        action: event.maplayer.act,
                        order: this._ignoreMapChangeOrderCounter
                    };
                }
            }

            ++this._ignoreMapChangeOrderCounter;
        },


        /**
         * Событие изменения списка слоев
         * @method  onLayerListChanged
         * @param event {Object} Событие
         */
        // ===============================================================
        onLayerListChanged: function (event) {
            if (!event || !event.maplayer || !event.maplayer.id)
                return;

            if (this._ignoreMapChangeState) {
                this._ignoreMapChangeProcessEvent(event);
                return;
            }

            if (event.maplayer.act == "add") {
                if (event.maplayer.editingParam) {
                    this.addLayerEditingParam(this.map.tiles.getLayerByxId(event.maplayer.id), event.maplayer.editingParam);
                }
            }
            else {
                if (event.maplayer.act == "remove")
                    this.removeLayerEditingParam(event.maplayer.id);
            }
            this.setlayers();

            if (this.mapeditorTask && !this.mapeditorTask.autonomous)
                this.mapeditorTask.layerlistchanged(event.maplayer.id, event.maplayer.act);
        },

        /**
         * Назначить слой на редактирование (устанавливается на основании параметров настройки редактора карты)
         * @method  setLayerEditing
         * @param layer {Object GWTK.WmsLayer}
         */
        // ===============================================================
        setLayerEditing: function (layer) {
            if (!layer || (layer instanceof GWTK.WmsLayer == false && layer instanceof GWTK.graphicLayer == false) || !this.param || !this.param.maplayersid)
                return;
            var count = this.param.maplayersid.length;
            for (var j = 0; j < count; j++) {
                if (layer.options.id == this.param.maplayersid[j]) {
                    layer.editing = layer.options.editing = true;
                    break;
                }
            }
        },

        /**
        * Добавить слой на редактирование (добавляется в параметры настройки редактора карты)
        * @method  addLayerEditingParam
        * @param layer {Object GWTK.WmsLayer}
        * @param editingParam {Object editingParam {Object} - Параметры редактирования
        {
            "editing": true,
            "editingdata": // маска: редактируемые данные (объекты, семантики объектов), при отсутствии - редактируются все объекты слоя
            {
                "objects": [                                // список объектов
                    {
                        "code": "Line"                      // код объекта
                        , "semantics": ["0", "1"]           // список ключей семантик
                    }
                ]
            }
            "selectlayer": true   // Cлой участвует в выборе объектов для привязки и топологии. У слоя должен быть установлен параметр selectObject = 1
        }
        */
        // ===============================================================
        addLayerEditingParam: function (layer, editingParam) {
            if (!layer) return;

            // Теперь добавим
            if ((layer instanceof GWTK.WmsLayer == false && layer instanceof GWTK.graphicLayer == false) ||
                !editingParam || !editingParam.editing)
                return;
            layer.options.editing = layer.editing = true;

            if (!this.param || !this.param.maplayersid) {
                this.param = {
                    "maplayersid": []            // редактируемые слои
                    , "functions": []
                    , "selectlayersid": []
                }
            }

            if (!this.param.selectlayersid)
                this.param.selectlayersid = [];

            // Если есть, то не добавляем
            var find = this.param.maplayersid.find(
                function (element, index, array) {
                    if (element == layer.options.id) {
                        return element;
                    }
                })
            if (find) return;

            // Начнем добавление
            this.param.maplayersid.push(layer.options.id);

            var countParam = (this.param.selectlayersid && this.param.selectlayersid.length > 0) ? this.param.selectlayersid.length : 0;
            // Проверим наличие wms слоев
            var iswms = false, isselectwms = false, lid;
            for (var i = 0; i < this.map.layers.length; i++) {
                if (this.map.layers[i] && this.map.layers[i] instanceof GWTK.WmsLayer) {
                    iswms = true;
                    lid = this.map.layers[i].options.id;
                    // Проверим сразу их наличие в this.param.selectlayersid
                    if (!isselectwms) {
                        this.param.selectlayersid.find(
                           function (element, index, array) {
                               if (element == lid) {
                                   isselectwms = true;
                                   return;
                               }
                           });
                    }
                    if (isselectwms)  // Если слои есть, то больше не проверять
                        break;
                }
            }

            // Если не заданы, то назначить все локальные слои с установленным флажком selectObject = 1
            if (countParam == 0) {
                this.param.selectlayersid.push(layer.options.id);
            }
            else {
                if (!iswms) { // Если нет wms слоев, то установить ТОЛЬКО для локальных
                    for (var i = 0; i < this.map.layers.length; i++) {
                        if (!this.map.layers[i] || this.map.layers[i] instanceof GWTK.graphicLayer == false
                            || !this.map.layers[i].selectObject)
                            continue;
                        this.param.selectlayersid.push(this.map.layers[i].options.id);
                    }
                }
                else {
                    if (isselectwms)
                        this.param.selectlayersid.push(layer.options.id);
                }
            }

            // Добавим в редактируемые объекты слоя
            if (editingParam.editingdata) {
                var editingdata = {
                    "layerid": layer.options.id    // идентификатор редактируемого слоя
                    , "objects": []                  // список объектов
                };

                for (var i = 0; i < editingParam.editingdata.objects.length; i++) {
                    editingdata.objects.push(JSON.parse(JSON.stringify(editingParam.editingdata.objects[i])));
                }

                this.param.editingdata.push(editingdata);
            }
        },

        /**
        * Удалить слой из параметров настройки редактора карты
        * @method  removeLayerEditingParam
        * @param layerId {Number}  идентификатор удаляемого слоя
        */
        // ===============================================================
        removeLayerEditingParam: function (layerId) {
            if (!layerId || !this.param || !this.param.maplayersid)
                return;

            var id = layerId, _that = this;
            this.param.maplayersid.find(
                function (element, index, array) {
                    if (element == id) {
                        // Удалим из списка редактируемых слоев
                        _that.param.maplayersid.splice(index, 1);
                        return;
                    }
                });

            if (_that.param.selectlayersid && _that.param.selectlayersid.length > 0) {
                this.param.selectlayersid.find(
                    function (element, index, array) {
                        if (element == id) {
                            _that.param.selectlayersid.splice(index, 1);
                            return;
                        }
                    });
            }

            // Удалим из редактируемых объектов слоя
            if (this.param.editingdata) {
                this.param.editingdata.find(
                    function (element, index, array) {
                        if (element.layerid == id) {
                            _that.param.editingdata.splice(index, 1);
                            return;
                        }
                    });
            }
        },

        // Старт автономного редактора
        startAutonomous: function (map, mapobjectJSON, param, activitytask) {
            // Закрыть редактор, если он был запущен
            if (this.mapeditorTask)
                this.closetask();

            if (!map || map instanceof GWTK.Map == false || !mapobjectJSON || !param || !activitytask)
                return;

            var flag = activitytask;
            param.functions = [flag];
            this.reset(param);

            if (!this.setTask(this.mapeditorTask = new GWTK.mapeditorTask(this.id, map, param, null, true), true)) {
                this.mapeditorTask = null;
                return;
            }

            var editobject = new GWTK.mapobject(map, '0');
            if (!editobject.loadJSON(mapobjectJSON, true)) {
                console.log("mapEditorAutonomous. " + w2utils.lang("Not defined a required parameter") + " mapobjectJSON.");
                return;
            }

            //  Дополнительная обработка для определения слоя карты (отдельная приблуда для Коли)
            if ((mapobjectJSON.features[0].properties.gwtkLayerXId)) {
                var l = this.map.tiles.getLayerByxId(mapobjectJSON.features[0].properties.gwtkLayerXId);
                if (l) {
                    editobject.maplayerid = l.xId;
                }
           }

            var mapeditorTask = this.mapeditorTask;
            mapeditorTask.currentTask = mapeditorTask.setActiveTask(flag, editobject);
            mapeditorTask.autonomous = true;

            // Отключить изменение видимости слоя
            $(mapeditorTask.map.eventPane).off('visibilitychanged', mapeditorTask.onVisibilityChanged);

            // сделать недоступными кнопки редактора
            $('#' + mapeditorTask.button_ids[flag]).addClass("disabledbutton");

            $(this.map.eventPane).trigger({ "type": "mapeditorAutonomous", action: 'start', sender: this });
            return mapeditorTask;
        },

        // Закрытие редактора в автономном режиме
        // closeAutonomous: function (action, mapobjects) {
        //     this.closetask();
        //     this.mapeditorTask = null;
        //     $(this.map.eventPane).trigger({ "type": "mapeditorAutonomous", action: action, mapobjects: mapobjects, sender: this });
        // }

        // Закрытие редактора в автономном режиме
        // Возвращает признак успешного закрытия редактора
        closeAutonomous: function (action, mapobjects) {
            // Редактирование можно не закрывать, если при перехвате события "mapeditorAutonomous" установить параметр data.stopEdit в значение false.
            // Пример такого события:
            // $(this.map.eventPane).on('mapeditorAutonomous', function (event, data) {
            //     console.log(event.action);  // save
            //     console.log(event.mapobjects);  // список объектов
            //     data.stopEdit = true;  // закрыть режим редактирования (это поведение по умолчанию); если установить в false, то редактирование будет продолжено
            // });
            var triggerData = {
                stopEdit: true
            };

            $(this.map.eventPane).trigger({ "type": "mapeditorAutonomous", action: action, mapobjects: mapobjects, sender: this }, triggerData);
            if (triggerData.stopEdit) {
                if (action === 'cancel') {  // Закрывать, не спрашивая
                    if (this.mapeditorTask) {
                        $('#' + this.mapeditorTask.button_ids.save).hide();
                    }
                }
                this.closetask();
                this.mapeditorTask = null;
            }

            return triggerData.stopEdit;
        }
    };


    /**
    * Задача редактор карты
    * @class GWTK.mapeditor
    * @constructor GWTK.mapeditor
    * @param id {String} Идентификатор объекта
    * @param map {Object} Объект карты
    * @param param {Object} Параметры редактора
    * {"maplayersid": ["", ""]            // редактируемые слои
    *   , "functions": []                 // функциональные возможности ("create", "edit", "delete" или *)
    *   , "editingdata" : [               // маска: редактируемые данные (объекты, семантики объектов), при отсутствии - редактируются все объекты слоя
    *       {   "layerid": ""             // идентификатор редактируемого слоя
    *           , "objects": [            // список объектов
    *               {
    *                   "code": ""        // код объекта (использовать для серии объектов)
    *                   , "key": ""         // ключ объекта (использовать для одиночных объектов)
    *                   , "semantics": [ "","" ]  // список кодов семантик
    *               },...
    *           ] }, ...
    *   ], "selectlayersid": ["", ...] }  //  Массив идентификаторов слоев, участвующих в выборе
    *                                         объектов для привязки и топологии.
    *                                         При отсутствии параметра работа идет со всеми слоями, в которых параметр слоя selectObject = 1
    *   , "transaction": "true"           //  Отмена и восстановление серверных операций над объектами карты,
    *                                     //  при значении «true» - появляются кнопки отмены операций на сервере.
    * @param bt_selector {String}  - селектор кнопки, инициировавшей задачу
    */
    // ===============================================================


    // Задача редактор карты
    GWTK.mapeditorTask = function (id, map, param, bt_selector, autonomous) {
        this.error = true;

        // Переменные класса
        this.toolname = 'mapeditorTask';
        this.bt_selector = bt_selector;
        GWTK.mapeditorTask.prototype.__proto__ = GWTK.MapTask.prototype;
        GWTK.MapTask.call(this, map);    // родительский конструктор

        if (!map) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        if (!param || !param.functions) {
            console.log(this.toolname + ". " + w2utils.lang("Not defined a required parameter") + " param.");
            return;
        }

        this.map = map;                           // объект карты
        this.param = param;
        this.id = (id) ? id : Math.random();     // уникальный идентификатор объекта
        // Имя текущей задачи
        this.currentTask = null;

        // идентификаторы кнопок задачи
        this.button_ids = {
            'create': 'edcreate_' + this.id           // кнопка создания
            , 'edit': 'ededit_' + this.id             // кнопка редактирования
            , 'setting': 'edsetting_' + this.id       // кнопка параметров
            , 'process': 'edprocess_' + this.id       // панель для кнопок процесса (откаты, сохранение, отмена)
            , 'save': 'edsave_' + this.id             // сохранение
            , 'cancel': 'edcancel_' + this.id         // отказ
            , 'delete': 'eddelete_' + this.id         // удаление объекта
            , 'move': 'edmove_' + this.id             // перемещение объекта
            , 'merge': 'edmerge_' + this.id           // сшивка объекта

        };

        this.functions = ["create", "edit", "delete", "group"];  // функции редактора
        this.info = ["semantics", "metrics"];                    // наличие информации по семантике или метрике

        // история изменений
        this.history = new GWTK.EditorHistory();

        this.init();

        // замкнуть контекст вызова функций
        this.bind();

        // идентификаторы для визуальных компонентов
        this.popupId = 'popupmenu' + GWTK.Util.randomInt(150, 200);
        this.maplistId = 'maplist' + GWTK.Util.randomInt(150, 200);
        this.objectlistId = 'objectlist' + GWTK.Util.randomInt(150, 200);
        this.objectinfoId = 'objectinfo' + GWTK.Util.randomInt(150, 200);
        this.objectmethodId = 'objectmethod' + GWTK.Util.randomInt(150, 200);
        this.selectobjectsId = 'selectobjects' + GWTK.Util.randomInt(150, 200);
        this.selectgraphobjectsId = 'selectgraphobjects' + GWTK.Util.randomInt(150, 200);
        this.classifersliderId = 'classiferslider' + GWTK.Util.randomInt(150, 200);
        this.metricsId = 'metrics' + GWTK.Util.randomInt(150, 200);
        this.semanticId = 'semantic' + GWTK.Util.randomInt(150, 200);

        // Префикс дополнительного action
        this.extraAction = '_extra' +  + GWTK.Util.randomInt(150, 200);

        // Размеры
        this.cssNoExt = { 'width': 400, 'height': 220 };
        this.cssNoTask = { 'width': 400, 'height': 70 };
        this.cssExtInit = this.cssExt = this.cssExtMax = { 'width': 400, 'height': 450 };

        // Префиксы
        this._drawOverlayPane = 'mapobject-overlayPane_';

        this.semanticoptions = {
            "graphic": false,
            "autonomic": false
        };
        this.semanticoptions.buttons = {
            "restore": false,
            "delete": true,
            "repeat": true,
            "save": false,
            "allsemantics": true,
            "hidden": true
        };

        this.semanticoptions_graphic = {
            "graphic": true,
            "autonomic": false
        };
        this.semanticoptions_graphic.buttons = {
            "restore": false,
            "delete": true,
            "save": false
        };

        this.zIndex = $(this.map.drawPane).css('zIndex');

        // Макеты для создания объектов
        this.mapeditTemplates = null;

        // Признак автономного запуска
        this.autonomous = autonomous;

        this.error = false;

        // TODO!!! Подмена фукциионала а графическом слое GWTK.graphicLayer !!!!!!!!!!!!!!!
        // TODO!!! Потом (когда будет готово draw) убрать отсюда и из класса GWTK.graphicLayer
        /**
         * Получение семантики указанного типа объекта
         * @method getSemByObjKey
         * @private
         * @param key {String} Тип объекта
         * @return {Object} Объект семантики в формате JSON
         */
        GWTK.graphicLayer.prototype.getSemByObjKey = function (key) {

            var sample = {
                "code": "",
                "local": "",
                "name": "",
                "key": "",
                "rscsemantics": [],
                "cssimage": ""
            };
            if (key) {
                key = key.toLowerCase();
                switch (key) {
                    case "line" :
                    case "linestring":
                        sample["code"] = "Line";
                        sample["local"] = "0";
                        sample["name"] = w2utils.lang("Line");
                        sample["key"] = "Line";
                        sample["rscsemantics"].push({
                            code: "0",
                            decimal: "0",
                            defaultvalue: "",
                            enable: "1",
                            maximum: "0",
                            minimum: "0",
                            name: w2utils.lang("Name"),
                            reply: "0",
                            service: "0",
                            shortname: "ObjName",
                            size: "255"
                        }, {
                            code: "1",
                            decimal: "0",
                            defaultvalue: "2",
                            enable: "3",
                            maximum: "12",
                            minimum: "1",
                            name: w2utils.lang("Stroke width"),
                            reply: "0",
                            service: "0",
                            shortname: "stroke-width",
                            size: "18",
                            type: "1",
                            unit: "px",
                            value: "2",
                            textvalue: "2"
                        }, {
                            code: "2",
                            decimal: "2",
                            defaultvalue: "0.75",
                            enable: "3",
                            maximum: "1.0",
                            minimum: "0.0",
                            name: w2utils.lang("Stroke opacity"),
                            reply: "0",
                            service: "0",
                            shortname: "stroke-opacity",
                            size: "18",
                            type: "1",
                            unit: "",
                            value: "0.75",
                            textvalue: "0.75"
                        }, {
                            code: "3",
                            decimal: "0",
                            defaultvalue: "#7F7FFF",
                            enable: "3",
                            maximum: "0",
                            minimum: "0",
                            name: w2utils.lang("Stroke color"),
                            reply: "0",
                            service: "0",
                            shortname: "stroke",
                            size: "255",
                            type: "21",
                            unit: "",
                            value: "#7F7FFF",
                            textvalue: "#7F7FFF"
                        }, {
                            code: "4",
                            decimal: "0",
                            defaultvalue: "000",
                            enable: "3",
                            maximum: "3",
                            minimum: "1",
                            name: w2utils.lang("Stroke type"),
                            reply: "0",
                            service: "0",
                            shortname: "stroke-dasharray",
                            size: "18",
                            type: "16",
                            unit: "",
                            value: "000",
                            textvalue: "000"
                        });
                        break;
                    case "polygon" :
                        sample["code"] = "Polygon";
                        sample["local"] = "1";
                        sample["name"] = w2utils.lang("Polygon");
                        sample["key"] = "Polygon";
                        sample["rscsemantics"].push({
                            code: "0",
                            decimal: "0",
                            defaultvalue: "",
                            enable: "1",
                            maximum: "0",
                            minimum: "0",
                            name: w2utils.lang("Name"),
                            reply: "0",
                            service: "0",
                            shortname: "ObjName",
                            size: "255"
                        }, {
                            code: "1",
                            decimal: "0",
                            defaultvalue: "2",
                            enable: "3",
                            maximum: "12",
                            minimum: "1",
                            name: w2utils.lang("Stroke width"),
                            reply: "0",
                            service: "0",
                            shortname: "stroke-width",
                            size: "18",
                            type: "1",
                            unit: "px",
                            value: "2",
                            textvalue: "2"
                        }, {
                            code: "2",
                            decimal: "2",
                            defaultvalue: "0.75",
                            enable: "3",
                            maximum: "1.0",
                            minimum: "0.0",
                            name: w2utils.lang("Stroke opacity"),
                            reply: "0",
                            service: "0",
                            shortname: "stroke-opacity",
                            size: "18",
                            type: "1",
                            unit: "",
                            value: "0.75",
                            textvalue: "0.75"
                        }, {
                            code: "3",
                            decimal: "0",
                            defaultvalue: "#7F7FFF",
                            enable: "3",
                            maximum: "0",
                            minimum: "0",
                            name: w2utils.lang("Stroke color"),
                            reply: "0",
                            service: "0",
                            shortname: "stroke",
                            size: "255",
                            type: "21",
                            unit: "",
                            value: "#7F7FFF",
                            textvalue: "#7F7FFF"
                        }, {
                            code: "4",
                            decimal: "0",
                            defaultvalue: "000",
                            enable: "3",
                            maximum: "3",
                            minimum: "1",
                            name: w2utils.lang("Stroke type"),
                            reply: "0",
                            service: "0",
                            shortname: "stroke-dasharray",
                            size: "18",
                            type: "16",
                            unit: "",
                            value: "000",
                            textvalue: "000"
                        }, {
                            code: "5",
                            decimal: "2",
                            defaultvalue: "0.3",
                            enable: "3",
                            maximum: "1.0",
                            minimum: "0.0",
                            name: w2utils.lang("Fill opacity"),
                            reply: "0",
                            service: "0",
                            shortname: "fill-opacity",
                            size: "18",
                            type: "1",
                            unit: "",
                            value: "0.3",
                            textvalue: "0.3"
                        }, {
                            code: "6",
                            decimal: "0",
                            defaultvalue: "0",
                            enable: "3",
                            maximum: "0",
                            minimum: "0",
                            name: w2utils.lang("Fill color"),
                            reply: "0",
                            service: "0",
                            shortname: "fill",
                            size: "255",
                            type: "21",
                            unit: "",
                            value: "#7F7FFF",
                            textvalue: "#7F7FFF"
                        });
                        break;
                    case "point" :
                        sample["code"] = "Point";
                        sample["local"] = "2";
                        sample["name"] = w2utils.lang("Marker");
                        sample["key"] = "Point";
                        sample["rscsemantics"].push({
                            code: "0",
                            decimal: "0",
                            defaultvalue: "",
                            enable: "1",
                            maximum: "0",
                            minimum: "0",
                            name: w2utils.lang("Name"),
                            reply: "0",
                            service: "0",
                            shortname: "ObjName",
                            size: "255"
                        }, {
                            code: "1",
                            decimal: "0",
                            defaultvalue: "2",
                            enable: "3",
                            maximum: "12",
                            minimum: "1",
                            name: w2utils.lang("Stroke width"),
                            reply: "0",
                            service: "0",
                            shortname: "stroke-width",
                            size: "18",
                            type: "1",
                            unit: "px",
                            value: "2",
                            textvalue: "2"
                        }, {
                            code: "2",
                            decimal: "2",
                            defaultvalue: "0.75",
                            enable: "3",
                            maximum: "1.0",
                            minimum: "0.0",
                            name: w2utils.lang("Stroke opacity"),
                            reply: "0",
                            service: "0",
                            shortname: "stroke-opacity",
                            size: "18",
                            type: "1",
                            unit: "",
                            value: "0.75",
                            textvalue: "0.75"
                        }, {
                            code: "3",
                            decimal: "#7F7FFF",
                            defaultvalue: "0",
                            enable: "3",
                            maximum: "0",
                            minimum: "0",
                            name: w2utils.lang("Stroke color"),
                            reply: "0",
                            service: "0",
                            shortname: "stroke",
                            size: "255",
                            type: "21",
                            unit: "",
                            value: "#7F7FFF",
                            textvalue: "#7F7FFF"
                        }, {
                            code: "4",
                            decimal: "000",
                            defaultvalue: "1",
                            enable: "3",
                            maximum: "3",
                            minimum: "1",
                            name: w2utils.lang("Stroke type"),
                            reply: "0",
                            service: "0",
                            shortname: "stroke-dasharray",
                            size: "18",
                            type: "16",
                            unit: "",
                            value: "000",
                            textvalue: "000"
                        }, {
                            code: "5",
                            decimal: "2",
                            defaultvalue: "0.3",
                            enable: "3",
                            maximum: "1.0",
                            minimum: "0.0",
                            name: w2utils.lang("Fill opacity"),
                            reply: "0",
                            service: "0",
                            shortname: "fill-opacity",
                            size: "18",
                            type: "1",
                            unit: "",
                            value: "0.3",
                            textvalue: "0.3"
                        }, {
                            code: "6",
                            decimal: "0",
                            defaultvalue: "0",
                            enable: "3",
                            maximum: "0",
                            minimum: "0",
                            name: w2utils.lang("Fill color"),
                            reply: "0",
                            service: "0",
                            shortname: "fill",
                            size: "255",
                            type: "21",
                            unit: "",
                            value: "#7F7FFF",
                            textvalue: "#7F7FFF"
                        }, {
                            code: "7",
                            decimal: "0",
                            defaultvalue: "003",
                            enable: "3",
                            maximum: "3",
                            minimum: "1",
                            name: w2utils.lang("Marker"),
                            reply: "0",
                            service: "0",
                            shortname: "marker",
                            size: "18",
                            type: "16",
                            unit: "",
                            value: "003",
                            textvalue: "003"
                        });
                        break;
                    case "title" :
                        sample["code"] = "Title";
                        sample["local"] = "3";
                        sample["name"] = w2utils.lang("Title");
                        sample["key"] = "Title";
                        sample["rscsemantics"].push({
                                code: "8",
                                decimal: "0",
                                defaultvalue: "0",
                                enable: "3",
                                maximum: "0",
                                minimum: "0",
                                name: w2utils.lang("Text"),
                                reply: "0",
                                service: "0",
                                shortname: "text",
                                size: "255"
                            }, {
                                code: "6",
                                decimal: "0",
                                defaultvalue: "0",
                                enable: "3",
                                maximum: "0",
                                minimum: "0",
                                name: w2utils.lang("Text color"),
                                reply: "0",
                                service: "0",
                                shortname: "fill",
                                size: "255",
                                type: "21",
                                unit: "",
                                value: "#7F7FFF",
                                textvalue: "#7F7FFF"
                            },
                            // { code: "5", decimal: "2", defaultvalue: "0.75", enable: "3", maximum: "0", minimum: "0", name: "Прозрачность текста", reply: "0", service: "0", shortname: "fill-opacity", size: "18", type: "1", unit: "", value: "0.75", textvalue: "0.75" },
                            // { code: "11", decimal: "0", defaultvalue: "0", enable: "1", maximum: "360", minimum: "-360", name: "Поворот текста", reply: "0", service: "0", shortname: "text-rotation", size: "18", type: "1", unit: "" },
                            {
                                code: "12",
                                decimal: "0",
                                defaultvalue: "Verdana",
                                enable: "3",
                                maximum: "72",
                                minimum: "1",
                                name: w2utils.lang("Font family"),
                                reply: "0",
                                service: "0",
                                shortname: "font-family",
                                size: "18",
                                type: "16",
                                unit: "",
                                value: "Verdana",
                                textvalue: "Verdana"
                            }, {
                                code: "13",
                                decimal: "0",
                                defaultvalue: "12",
                                enable: "3",
                                maximum: "72",
                                minimum: "1",
                                name: w2utils.lang("Font size"),
                                reply: "0",
                                service: "0",
                                shortname: "font-size",
                                size: "18",
                                type: "1",
                                unit: "",
                                value: "12",
                                textvalue: "12px"
                            }, {
                                code: "14",
                                decimal: "0",
                                defaultvalue: "1",
                                enable: "3",
                                maximum: "10",
                                minimum: "1",
                                name: w2utils.lang("Letter spacing"),
                                reply: "0",
                                service: "0",
                                shortname: "letter-spacing",
                                size: "18",
                                type: "1",
                                unit: "",
                                value: "1",
                                textvalue: "1"
                            }, {
                                code: "15",
                                decimal: "0",
                                defaultvalue: "2",
                                enable: "3",
                                maximum: "10",
                                minimum: "1",
                                name: w2utils.lang("Start offset"),
                                reply: "0",
                                service: "0",
                                shortname: "startOffset",
                                size: "18",
                                type: "1",
                                unit: "",
                                value: "2",
                                textvalue: "2%"
                            });
                        break;
                }
                sample["rscsemantics"].splice(1, 0, {
                    code: "30",
                    decimal: "",
                    defaultvalue: "0",
                    enable: "1",
                    maximum: "0",
                    minimum: "0",
                    name: w2utils.lang("Comment"),
                    reply: "0",
                    service: "0",
                    shortname: "ObjCComm",
                    size: "255",
                    type: "0",
                    unit: ""
                });
            }
            return sample;
        };

    };

    GWTK.mapeditorTask.prototype = {

        /**
         * ИНИЦИАЛИЗАЦИЯ
         */

       init: function () {
            this.maplayersid = new Array();                          // массив редактируемых карт
            this.selectlayersid = new Array();                       // массив слоев, участвующий в веделении объектов

            // слой для создания объектов (по умолчанию первая из списка, иначе выбрать кнопкой)
            this.maplayerid = { "layerid": "" };
            this.layer = null;
            // Редактируемыe объекты
            this.editobjects = new Array();
            // Сохраняемые объекты
            this.editobjectsSave = new Array();
            // Сохраняемые объекты по слоям (в режиме топологии могут редактироваться объекты с разных слоев)
            this.editobjectsSaveByLayer = new Array();
            // флаг изменения объекта
            this.ischange(false);

            // Режим расширенного/сжатого информационного окна
            this.objectinfoExt = false;

            // Задачи редактора (назначаются  в функции setActiveTask по атрибуту name кнопки, инициализирующей задачу)
            this.mapeditorCreatingTask = null;
            this.mapeditorEditingTask = null;

            // Используется для определения стороннего разработчика
            this.ourAction = null;

            // Заголовок для информационной строки статус бара
            this.titleMessage = w2utils.lang("Map editor") + '. ';
        },


        /**
         * Инициализация параметров класса
         * @method initparam
         */
        // ===============================================================
        set: function (param) {
            if (!param || param instanceof Object == false)
                return;

            this.param = param;             // параметры редактора
            // Пока транзакции доступны всем, кто имеет право на редактирование
            //this.param.transaction = true;

            // Класс выделения объектов для отрисовки, чтоб не нагружать стандартный
            this.drawSelectFeatures = new GWTK.selectedFeatures(this.map, null,
                 {
                     "stroke": "#00BA00",
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
                     "text": ""
                 }
                );
            this.drawSelectFeatures.init();

            // Настройки для топологии, геометрии и прочее
            this.options = (param.options) ? JSON.parse(JSON.stringify(param.options)) :
            {
                "topology": {
                    "limit": "20",                               // Допуск согласования точек (в м)
                    "captureradius": "20"                        // Радиус захвата (в м)
                },
                "geometry": {
                    "format": "BL",                              // Первоначальный формат отображения метрических данных "BL" или "BLgrad"(в гмс) ,
                    "precision_m": "8",                          // Точность при вводе координат в метрах
                    "precision_sec": "4",                        // Точность для ввода секунд при вводе координат в ГМС    (format = BLgrad)
                    "precision_grad": "8",                       // Точность для ввода градусов при вводе координат в градусах (format = BL)
                    "precision_h": "2",                          // Точность при вводе высоты
                    "visible_h": "0"                             // Первоначальное отображение высоты
                },
                "transaction": {                                 // Журнал транзакций
                    "startdate":                                 // Дата начала просмотра
                        {
                            "date": "" //new Date().getTime() - 2592000000
                        , "datestring": ""
                            //, "timestring": ""
                        },
                    "enddate":                                   // Дата окончания просмотра
                        {
                            "date": ""
                        , "datestring": ""
                            //, "timestring": ""
                        },
                    "servicerecord": 1
                },
                "autosave": 1,                                   // автоматически сохранять созданные объекты
                "objectselectionInPoint": 0,                     // Выбор объекта в точке
                "capturePoints" : 1,
                "captureVirtualPoints" : 0
            };

            // Инициализация даты транзакций
            this.inittransactiondate('start');
            this.inittransactiondate('end');

            // Класс рисования объекта
            this.drawobject = new GWTK.DrawingObject(this.map, {
                'nocontextmenu' : true,   // не отображать контекстное меню
                'func': {
                    'fn_parentpanel': this.getdrawpanel
                }
            }, this);

            // Класс топологии
            this.topology = new GWTK.Topology(this.map, {
                'selectlayersid': this.selectlayersid,
                'func': {
                    'fn_iseditingobject': this.iseditinglayer_object,
                    'fn_parentpanel': this.getdrawpanel,
                    'fn_drawcustom': this.draw
                },
                'topologyoptions' : this.options.topology
            }, this);

            // заполним массив редактируемых карт
            this.setlayers();
            if (!this.layer) {
                if (this.currentTask) {
                    this.destroyTasks();
                    w2alert(w2utils.lang('There are no layers of editing'));
                }
            }

            if (this.param.functions && this.param.functions.length > 0 && this.param.functions[0] == '*') {                   // 08/10/15  Nefedeva
                this.param.functions = ["create", "edit", "delete"];
            }

            // заполним массив функций
            var count;
            if (this.param.functions && this.param.functions.length > 0) {
                count = this.param.functions.length;
                if (count >= 0) { // отдельные все режимы
                    this.functions.splice(0, this.functions.length);
                    for (var i = 0; i < count; i++) {
                        this.functions.push(this.param.functions[i]);
                    }
                }
            }

            // заполним массив детализации
            if (this.param.info) {
                if (this.param.info.length > 0 && this.param.info[0] == '*') {
                    this.param.info = ["semantics", "metrics"];
                }
                else {
                    count = this.param.info.length;
                    this.info.splice(0, this.info.length);
                    for (var i = 0; i < count; i++) {
                        this.info.push(this.param.info[i]);
                    }
                }
            }

            // Назначим события
            this.initActionEvent();

        },

        /**
        * Замыкание контекста
        * @method bind
        */
        // ===============================================================
        bind: function () {
            this.onDocumentReady = GWTK.Util.bind(this.onDocumentReady, this);
            this.onInitOptions = GWTK.Util.bind(this.onInitOptions, this);
            this.onstopPropagation = GWTK.Util.bind(this.onstopPropagation, this);
            this.onUpdateMapObject = GWTK.Util.bind(this.onUpdateMapObject, this);
            this.onKeyDown = GWTK.Util.bind(this.onKeyDown, this);
            this.onVisibilityChanged = GWTK.Util.bind(this.onVisibilityChanged, this);
            this.onChangeDataSemantics = GWTK.Util.bind(this.onChangeDataSemantics, this);
            this.onChangeDataMetrics = GWTK.Util.bind(this.onChangeDataMetrics, this);
            this.onOverlayRefresh = GWTK.Util.bind(this.onOverlayRefresh, this);
            this.onSetAction = GWTK.Util.bind(this.onSetAction, this);
            this.onStartActionByTemplates = GWTK.Util.bind(this.onStartActionByTemplates, this);

            // Нажатие кнопок мыши
            this.onCtrlLeft = GWTK.Util.bind(this.onCtrlLeft, this);
            this.onCtrlRight = GWTK.Util.bind(this.onCtrlRight, this);

            // Контекстное меню
            this.onContextMenu = GWTK.Util.bind(this.onContextMenu, this);

            // Групповые операции
            this.onGroup = GWTK.Util.bind(this.onGroup, this);

            // Выбор точки альтернативного объекта
            this.onSourceFeatureListClick = GWTK.Util.bind(this.onSourceFeatureListClick, this);

        },

        /**
         * Создать активную задачу по типу  режима
         * @method setActiveTask
         */
        // ===============================================================
        setActiveTask: function (type, selectobject) {
            // При групповых операциях ничего не отключаем
            if (this.isGroupDeleteProcess)
                return;

            var _that = this;
            switch (type) {
                case 'create':
                    this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Create object"));
                    if (!this.mapeditorCreatingTask) {
                        if (!this.setTask(this.mapeditorCreatingTask = new GWTK.MapeditorCreatingTask(this.id, this.map, null, '#' + this.button_ids.create, this, null, null, selectobject))) {
                            this.mapeditorCreatingTask.destroy();
                            this.mapeditorCreatingTask = null;
                        }
                    }
                    // this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Create object"));
                    return type;

                case 'edit':
                    this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Edit object"));
                    if (!this.setTask(this.mapeditorEditingTask = new GWTK.mapeditorEditingTask(this.id, this.map,
                        {
                            'context': this,
                            'bt_selector': '#' + this.button_ids.edit,
                            'selectobject' : selectobject
                        }
                        ))) {
                        this.mapeditorEditingTask.destroy();
                        this.mapeditorEditingTask = null;
                    }
                    // this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Edit object"));
                    return type;

                    //if (!this.isGroup(type)) {
                    //    if (!this.mapeditorEditingTask) {
                    //        this.setEditingAction(selectobject);
                    //        this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Edit object"));
                    //        return type;
                    //    }
                    //  }
                    //}
                    //return;

                case 'delete':
                    // Если нет выделенных объектов, то запустим обработчик на выбор объекта
                    if (!this.isGroup(type)) {
                        this.setDeletingAction();
                    }
                    return;

                case 'move':
                    if (!this.setTask(this.mapeditorMovingTask = new GWTK.mapeditorMovingTask(this.id, this.map,
                        {
                            'context': this,
                            'bt_selector': '#' + this.button_ids.move,
                            'selectobject' : selectobject
                        }
                        ))) {
                        this.mapeditorMovingTask.destroy();
                        this.mapeditorMovingTask = null;
                    }
                    this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Moving, scaling, rotating"));
                    return type;

                case 'merge':
                    if (!this.setTask(this.mapeditorMergingTask = new GWTK.mapeditorMergingTask(this.id, this.map,
                        {
                            'context': this,
                            'bt_selector': '#' + this.button_ids.merge,
                            'selectobject': selectobject
                    }
                        ))) {
                        this.mapeditorMergingTask.destroy();
                        this.mapeditorMergingTask = null;
                    }
                    this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Merging"));
                    return type;

            }

        },


        /**
        * Запросить активную задачу
        * @method getActiveTask
        */
        // ===============================================================
        getActiveTask: function () {
            switch (this.currentTask) {
                case 'create':
                    return this.mapeditorCreatingTask;
                case 'edit':
                    return this.mapeditorEditingTask;
                case 'delete':
                    if (this.map.taskManager._action && this.map.taskManager._action.name == this.currentTask)
                        return this.map.taskManager._action;
            }
        },

        /**
        * Создать задачу
        * @method setTask
        * @param task (Object)- объект Задача
        */
        // ===============================================================
        setTask: function (task) {
            if (!task || task.error) {
                return;
            }
            if (this.map.setTask(task)) {
                if (task.bt_selector)
                    GWTK.DomUtil.setActiveElement(task.bt_selector);
                return true;
            }
        },

        /**
          * Разрушить задачу
          * @method closeTask
          * @param task (Object)- объект Задача
          */
        // ===============================================================
        closeTask: function (task) {
            if (this.canClose((task) ? this.currentTask : null)) {
                if (this.map.closeTask(task)) {
                    this.currentTask = null;
                    if (task.bt_selector) {
                        GWTK.DomUtil.removeActiveElement(task.bt_selector);
                        if (task.mapeditorTask) {
                            $('#' + task.mapeditorTask.objectlistId).children().remove();
                            $('#' + task.mapeditorTask.objectinfoId).children().remove();
                        }
                    }

                    // Сбросим класс выделения объектов  редактора
                    this.drawSelectFeatures.clear();
                    this.addmenu(null, 'transaction');
                    return true;
                }
            }
        },

        /**
       * Восстановить текущую задачу после закрытия обработчика
       * @method restoreTask
       * @param history {Boolean} = true - кнопки для истории, иначе кнопки для транзакций
       */
        // ===============================================================
        restoreTask: function () {

            this.clear();
            this.addmenu(null, 'transaction');

            if (this.currentTask == 'create' && this.mapeditorCreatingTask) {
                if (this.mapeditorCreatingTask.action) {
                    this.map.closeAction();
                    this.mapeditorCreatingTask.action = null;
                }
                // Сбросим выделение
                this.drawSelectFeatures.clear();

                if (this.mapeditorCreatingTask.lastObject)
                    this.mapeditorCreatingTask.initdataCreationObject(this.mapeditorCreatingTask.lastObject);
                this.mapeditorCreatingTask.startCreation();
                return;
            }
            else {

                // Если задача редактирования, то запустить обработчик на выбор объекта
                this.drawSelectFeatures.clearDrawAll();

                if (this.currentTask == 'edit' && this.mapeditorEditingTask) {
                    this.mapeditorEditingTask.clickEditing();
                }
                else {
                    if (this.currentTask == 'move') {
                        if (this.isGroupProcess) {
                            // Перерисовать массив выделенных объектов, если были групповые операции
                            this.map.objectManager.selectedFeatures.drawSelectedObjects(true);
                        }
                        if (this.mapeditorMovingTask) {
                            this.mapeditorMovingTask.clickEditing();
                        }
                    }
                }
            }

            this.isGroupDeleteProcess = false;
            this.isGroupProcess = false;


        },


        /**
        * Создание основной панели редактора карты
        * @method createPane
        */
        // ===============================================================
        createPane: function (panelId) {

            if (!this.param) return;

            // Панель расположена после панели выбора объектов
            this.panel = this.map.createPane('map-panel-def ' + this.toolname + '-panel', this.map.mapPane);
            this.panel.id = this.panelId = panelId;

            var htmlcreate = this.isfunction(this.functions,"create") ?  // кнопка создания объекта
                '<div id="' + this.button_ids.create + '" name = "create" class="control-button control-button_addmenu control-button_edcreate control-button-radio clickable" Title="' + w2utils.lang("Create object") + '"> </div> ' : '';
            var isedit = this.isfunction(this.functions, "edit");
            var htmledit = isedit ? // кнопка редактирования
                '<div id="' + this.button_ids.edit + '"  name = "edit"  class="control-button control-button_addmenu control-button_ededit control-button-radio clickable" Title="' + w2utils.lang("Edit object") + '"> </div> ' : '';
            // При автономном режиме не запускать перемещение
            var htmlmove = isedit && (!this.autonomous)? // кнопка перемещения выделенных объектов
                '<div id="' + this.button_ids.move + '"  name = "move"  class="control-button control-button_addmenu control-button_edmove control-button-radio clickable" Title="' + w2utils.lang("Moving, scaling, rotating") + '"> </div> ' : '';
            var htmlmerge = isedit && (!this.autonomous)? // кнопка сшивки объектов
                '<div id="' + this.button_ids.merge + '"  name = "merge"  class="control-button control-button_addmenu control-button_edmerge control-button-radio clickable" Title="' + w2utils.lang("Merging") + '"> </div> ' : '';
            var htmldelete = '';
            if (this.isfunction(this.functions, 'delete'))
                htmldelete = this.isfunction(this.functions, "delete") ? // кнопка удаления
                '<div id="' + this.button_ids['delete'] + '" name = "delete" class="control-button control-button_addmenu control-button_eddeleteobject control-button-radio clickable" Title="' + w2utils.lang("Deleting") + '"> </div> ' : '';

            var newid = 'transaction',
                htmlhistory = GWTK.Util.parseBoolean(this.param.transaction) ? this.htmlHistory(newid) : '';// кнопки откатов по транзакциям

            var buttnswidth = "10px";
            var strpanel =
            '<div class="edContainer">' +
                '<div class="routeFilesName">' + w2utils.lang("Map editor") +
                '</div>' +
                '<div> <table width="100%" cellspacing=3 cellpadding=0> ' +
                     '<tr align="left"> ' +
                     '<td width = ' + buttnswidth + ' align="left"> ' +
                     htmlcreate +
                     '</td> ' +
                     '<td width = ' + buttnswidth + ' align="left"> ' +
                     htmledit +
                     '</td> ' +
                     '<td width = ' + buttnswidth + ' align="left"> ' +
                     htmlmove +
                     '</td> ' +
                     '<td width = ' + buttnswidth + ' align="left"> ' +
                     htmlmerge +
                    '</td> ' +
                    '<td width = ' + buttnswidth + ' align="left"> ' +
                     htmldelete +
                     '</td> ';
            // Параметры редактора
            strpanel += '<td width="40px" align="right">' +
                '<div id="' + this.button_ids.setting + '"  "name = "setting" class="control-button control-button_addmenu control-button_edsetting clickable" Title="' + w2utils.lang("Options") + '"> </div> ' +  // параметры редактора
                '</td>' +
            // кнопки процесса
                '<td >' +
                '<div id="' + this.button_ids.process + '" name="process"> </div> ' +
                '</td>' +
            // кнопки отката
                htmlhistory +
                '</tr> </table> </div>' +
                '<div id ="'+ this.objectlistId + '" ></div>' +
                '</div>';

            $('#' + this.panelId).append(strpanel);

            // Заголовок
            this.updatetitle(w2utils.lang("Map editor"));

            this.$panel = $(this.panel);
            var _that = this;
            this.$panel.draggable({
                containment: "parent",
                distance: 2,
                stop: function () {
                    _that.$panel.css("height", "auto");
                    _that._writeedCookie();
                }
            });


            // Панель расположена внизу окна карты
            this.panelTemplates = this.map.createPane('map-panel-def ' + this.toolname + 'Templates-panel', this.map.mapPane);
            this.panelTemplates.id = panelId + 'Templates';

            // Создадим класс макетов
            this.mapeditTemplates = new GWTK.MapeditTemplates(this.map, this.panelTemplates, this.onStartActionByTemplates);
            if (this.mapeditTemplates.error)
                this.mapeditTemplates = null;

            // Панель дополнительных режимов окна карты
            this.panelExtend = this.map.createPane('map-panel-def ' + this.toolname + 'Templates-panel', this.map.mapPane);
            this.panelExtend.id = panelId + 'Extend';

            // Создадим класс панели для расширенных режимов
            this.mapeditExtendMethods = new GWTK.MapeditExtendMethods(this.map, this.panelExtend);
            if (this.mapeditExtendMethods.error)
                this.mapeditExtendMethods = null;

            $(document).ready(this.onDocumentReady);

            //// Триггер
            //$(this.map.eventPane).trigger({
            //    type: 'GWTK.mapeditorTask',
            //    operation: 'openTask',
            //    params: { phase: 'after' }
            //});

        },

        /**
         * Установить изменение размеров окна
         */
        setResizablePane: function () {
            var that = this;
            var $objectlist = $('#' + that.objectlistId),
                $objectinfo, $selectobjects, $selectgraphobjects,
                $sliderclass, $sliderclass_children,
                $detail_semantic, $detail_metrics,
                start_selectgraphobjects, start_sliderclass, $sliderclass_children,
                start_detail_semantic, start_detail_metrics;

            var $parent_objdetail,
                start_parent_objdetail;

            this.$panel.resizable({
                handles: "e,s,se", //  's,w,sw',
                resize: function (event, ui) {

                    var $edContainerInfo = $('.edContainerInfo');
                    if (!that.currentTask) { // нет активных задач
                        // Оставим прежние размеры
                        that.$panel.resizable("option", "minHeight", that.cssNoTask.height);
                        ui.size.height = ui.originalSize.height;
                        ui.size.width = ui.originalSize.width;
                        return;
                    }

                    var offsetwidth = (ui.size.width - ui.originalSize.width);
                    var offsetheight = (ui.size.height - ui.originalSize.height);
                    switch (that.currentTask) {
                        case 'delete': // удаление или редактирование
                        case 'edit':
                            if ($objectlist.children().length > 0 && $objectinfo.length == 0) {   // Только список объектов
                                // Изменим ширину, высоту оставим прежнюю
                                that.$panel.resizable("option", "minHeight", that.cssNoTask.height + $objectlist.height());
                                ui.size.height = ui.originalSize.height;
                            }
                            else {
                                if ($objectinfo.length > 0) { //Есть информация об объекте
                                    if (!that.objectinfoExt) { // нет расширенного окна
                                        that.$panel.resizable("option", "minHeight", that.heighNotExt);  // 220
                                        ui.size.height = ui.originalSize.height;
                                    }
                                    else {  // есть расширенное окно
                                        that.$panel.resizable("option", "minHeight", that.cssExt.height);  // 550
                                        if (that.rscsemantics) {
                                            $detail_semantic.css({ width: start_detail_semantic.width + offsetwidth, height: start_detail_semantic.height + offsetheight });
                                            that.rscsemantics.resize();
                                        }
                                        if (that.metrics) {
                                            $detail_metrics.css({ width: start_detail_metrics.width + offsetwidth, height: start_detail_metrics.height + offsetheight });
                                            that.metrics.resize();
                                        }

                                    }
                                }
                            }
                            break;
                        case 'create':  // создание
                            if ($selectobjects.length > 0 && $selectgraphobjects.length > 0) { // Слои и создание объектов локальной карты
                                that.$panel.resizable("option", "minHeight", that.heighNotExt);  // 220
                                // Панель графических объектов
                                $selectgraphobjects.css({ width: start_selectgraphobjects.width + offsetwidth });
                                ui.size.height = ui.originalSize.height;
                            }
                            else {
                                // слайдер
                                if ($sliderclass.length > 0) {
                                    that.$panel.resizable("option", "minHeight", that.cssNoExt.height);  // 220
                                    $sliderclass.css({ width: start_sliderclass.width + offsetwidth, height: start_sliderclass.height + offsetheight });
                                    $sliderclass_children.css({ width: start_sliderclass_children.width + offsetwidth, height: start_sliderclass_children.height + offsetheight });
                                }
                            }
                            if ($objectinfo.length > 0) { //Есть информация об объекте
                                if (!that.objectinfoExt) { // нет расширенного окна
                                    that.$panel.resizable("option", "minHeight", that.heighNotExt);  // 220
                                    ui.size.height = ui.originalSize.height;
                                }
                                else {  // есть расширенное окно
                                    that.$panel.resizable("option", "minHeight", that.cssExt.height);  // 550
                                    if (that.rscsemantics) {
                                        $detail_semantic.css({ width: start_detail_semantic.width + offsetwidth, height: start_detail_semantic.height + offsetheight });
                                        that.rscsemantics.resize();
                                    }
                                    if (that.metrics) {
                                        $detail_metrics.css({ width: start_detail_metrics.width + offsetwidth, height: start_detail_metrics.height + offsetheight });
                                        that.metrics.resize();
                                    }

                                }
                            }
                            break;

                    }

                    // Сохраним в куки
                    that._writeedCookie(($sliderclass.length > 0) ? { width: start_sliderclass.width + offsetwidth, height: start_sliderclass.height + offsetheight } : null);
                    ui.position.left = ui.originalPosition.left;


					GWTK.Util.fixJqueryResizablePluginFF({
						before: {
							width: ui.originalSize.width,
							height: ui.originalSize.height
						},
						after: {
							width: ui.size.width,
							height: ui.size.height
						}
					});
                },
                start: function (event, ui) {
                    $objectinfo = $('#' + that.objectinfoId);
                    $selectobjects = $('#' + that.selectobjectsId);
                    $selectgraphobjects = $('#' + that.selectgraphobjectsId);
                    $sliderclass = $("div[name='" + that.classifersliderId + "']");
                    $sliderclass_children = $sliderclass.children();

                    start_selectgraphobjects = { 'width': $selectgraphobjects.width(), 'height': $selectgraphobjects.height() };
                    start_sliderclass = { 'width': $sliderclass.width(), 'height': $sliderclass.height() };
                    start_sliderclass_children = { 'width': $sliderclass_children.width(), 'height': $sliderclass_children.height() };

                    $detail_semantic = $('#' + that.semanticId + that.id);
                    $detail_metrics = $('#' + that.metricsId + that.id);
                    start_detail_semantic = { 'width': $detail_semantic.width(), 'height': $detail_semantic.height() };
                    start_detail_metrics = { 'width': $detail_metrics.width(), 'height': $detail_metrics.height() };
                },
                stop: function (event, ui) {
                    //that.sizeRemember();
                    that.resize();

                },
                //minHeight: this.cssNoTask.height,
                minWidth: this.cssNoTask.width,
                maxWidth: this.cssExtMax.width,    //this.getmaxWidth(), // $(this.map.mapPane).width()/2,
                maxHeight: this.cssExtMax.height    //this.getmaxHeight() // $(this.map.mapPane).height()
            });

        },

        getmaxHeight: function () {
            var size = this.map.getWindowSize();
            // return size[1] - ($(this.map.controlsPane).height() * 2);
            return size[1] - ($(this.map.controlsPane).height());
        },

        getmaxWidth: function () {
            var size = this.map.getWindowSize();
            return size[0] / 4 * 3;
        },

        getmaxSizeForDetail: function () {
            return [this.cssExtMax.width, this.cssExtMax.height - 250];
        },

        sizeRemember: function () {
            this.cssExtMax = { 'width': this.getmaxWidth(), 'height': this.getmaxHeight() };
            // На случай, если размер окна уменьшится до минимума
            this.cssExt = {
                'width': Math.min(this.cssExtInit.width, this.getmaxWidth()),
                'height': Math.min(this.cssExtInit.height, this.getmaxHeight())
            };

            this.$panel.resizable("option", "maxWidth", this.cssExtMax.width);
            this.$panel.resizable("option", "maxHeight", this.cssExtMax.height);
        },

        /**
        * Изменить размер панели редактора карты
        * @method resize
        */
        resize: function () {
            if (!this.$panel) return;
            //this._readedCookie();
            this.$panel.css({ 'height': 'auto' });
        },

        /**
         * Назначение прослушки событий для активного режима
         * @method initActionEvent
         */
        // ===============================================================
        initActionEvent: function () {
            // Назначим события

            // События на нажатие клавиш
            this.map.on({ type: "keydown", target: "map", phase: 'before', sender: this }, this.onKeyDown);

            // обновление объекта
            $(this.map.eventPane).on('updatemapobject', this.onUpdateMapObject);
            // Изменение видимости слоев
            $(this.map.eventPane).on('visibilitychanged', this.onVisibilityChanged);
            // Запрет на контекстное меню
            $(this.map.mapPane).parent().on('contextmenu', this.onContextMenu);
             //Перерисовка карты
            $(this.map.eventPane).on('overlayRefresh', this.onOverlayRefresh);
            // Старт нового обработчика
            $(this.map.eventPane).on('setaction', this.onSetAction);


            // Нажатие кнопок мыши
            $(this.map.eventPane).on('ctrlleft', this.onCtrlLeft);
            $(this.map.eventPane).on('ctrlright', this.onCtrlRight);
        },


        setLogOptions: function (layer) {
            options = {
                "RESTMETHOD": "VIEWTRANSACTIONLOG",
                "LAYER": layer.classifier.wmtsId,
                "ServiceOperation": this.options.transaction.servicerecord,
                "DateEnd": this.options.transaction.enddate.datestring.replace(/\./g, '/')
            };

            if (this.options.transaction.startdate.datestring && this.options.transaction.startdate.datestring != '')
                options.DateBegin = this.options.transaction.startdate.datestring.replace(/\./g, '/');
            return options;
        },

        /**
         * Обработка нажатия кнопки "Сохранить"
         * @method saveLogToFile
         */
        // ===============================================================
        saveLogToFile: function () {
            // заполним список семантик типа классификатор
            var layer = this.map.tiles.getLayerByxId(this.options.transaction.maplayerid);
            if (!layer) return;
            var queryEdit = new EditQueries(layer.classifier.srv, this.map);
            queryEdit.onDataLoad = this.onDataLoadedTransactLog;
            queryEdit.context = this;
            var options = this.setLogOptions(layer);
            queryEdit.sendRequest(options);
        },

        /**
         * Обработка нажатия кнопки "Открыть"
         * @method openLog
         */
        // ===============================================================
        openLog: function () {
            var layer = this.map.tiles.getLayerByxId(this.options.transaction.maplayerid);
            if (!layer) return;
            var options = this.setLogOptions(layer);
            var paramstr = "?RESTMETHOD=" + options.RESTMETHOD + '&LAYER=' + options.LAYER + '&ServiceOperation=' +
                options.ServiceOperation + "&DateEnd=" + options.DateEnd;
            if (this.options.DateBegin)
                paramstr += options.DateBegin;
            var href = layer.classifier.srv + paramstr;
            window.open(href, '_blank');
        },

        /**
        * Ответ на запрос журнала транзакций
        * @method onDataLoadedTransactLog
        */
        // ===============================================================
        onDataLoadedTransactLog: function (response, context) {
            var saveData = (function (data, filename) {
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                return function (data, filename) {
                    var blob = new Blob([data], { type: "octet/stream" }),
//                       blob = new Blob([json], { type: "text/html" }),
                      url = window.URL.createObjectURL(blob);
                    var ua = navigator.userAgent;
                    if (ua.search(/Trident/) != -1) {
                        //IE
                        window.navigator.msSaveBlob(blob, filename);
                        return true;
                    }
                    a.href = url;
                    a.download = filename;
                    a.click();

                };
            }());

            saveData(response, context.layer.alias + '.TAC.txt');

        },

        /**
         * Выполнение отмены транзакций
         * @method restoreTransaction
         * @param type {String} "UNDOLASTACTION" или "REDOLASTACTION"
         */
        // ===============================================================
        restoreTransaction: function (type, title) {
            // заполним список семантик типа классификатор
            if (!this.options.transaction.maplayerid && this.layer && this.layer instanceof GWTK.graphicLayer == false)
                this.options.transaction.maplayerid = this.layer.xId;

            var layer = this.map.tiles.getLayerByxId(this.options.transaction.maplayerid);
            if (!layer) return;

            var _that = this;
            w2confirm(title + "? " + layer.alias, w2utils.lang("Map editor"), function (answer) {
                if (answer == 'Yes') {
                    var queryEdit = new EditQueries(layer.classifier.srv, _that.map);
                    queryEdit.context = _that;
                    queryEdit.onDataLoad = _that.onDataLoadedRestoreTransaction;
                    var options = {
                        "SERVICE": "WFS",
                        "RESTMETHOD": type,
                        "LAYER": layer.classifier.wmtsId
                    };
                    queryEdit.sendRequest(options);
                }
            });

        },

        /**
        * Ответ на выполнение отмены транзакций
        * @method onDataLoadedRestoreTransaction
        */
        // ===============================================================
        onDataLoadedRestoreTransaction: function (response, context) {
            if (!context || context instanceof GWTK.mapeditorTask === false)
                return;
            context.refreshmap();
            context.drawSelectFeatures.clearDrawAll();
            if (context.topology) {
                context.topology.isUpdate = true;
            }

            // Если это наш обработчик выбора объекта
            var action = context.map.taskManager._action;
            if (action && context.isOurAction(action)) {
            if (action instanceof GWTK.MapeditorDeletingActionHover || action instanceof GWTK.MapeditorDeletingAction) {
                    action.clear(true);
                    action.set();
                }
                else {
                    if (action instanceof GWTK.SelectMapObjectActionHover || action instanceof GWTK.SelectMapObjectAction) {
                        action.clear();
                        action.set();
                    }
                }
            }
        },


        /**
         * Инициализация значений даты для работы с транзакциями
         * @method inittransactiondate
         * @param type {String} "start" или "end"
        */
        // ===============================================================
        inittransactiondate: function (type) {
            if (!this.options) return;
            var date;
            switch (type) {
                case 'start':
                    if (!this.options.transaction.startdate.date || this.options.transaction.startdate.date == '')
                        return;
                    //this.options.transaction.startdate.date = new Date().getTime() - 2592000000;  //  за месяц
                    date = this.options.transaction.startdate.date.toLocaleString().split(', ');
                    if (!date || date.length != 2)
                        date = this.options.transaction.startdate.date.toLocaleString().split(' ');
                    if (date && date.length == 2) {
                        this.options.transaction.startdate.datestring = date[0];
                        //this.options.transaction.startdate.timestring = date[1];
                    }
                    break;
                case 'end':
                    if (!this.options.transaction.enddate.date || this.options.transaction.enddate.date == '')
                        this.options.transaction.enddate.date = new Date();
                    date = this.options.transaction.enddate.date.toLocaleString().split(', ');
                    if (!date || date.length != 2)
                        date = this.options.transaction.enddate.date.toLocaleString().split(' ');
                    if (date && date.length == 2) {
                        this.options.transaction.enddate.datestring = date[0];
                        //this.options.transaction.enddate.timestring = date[1];
                    }
                    break;
            }
        },

        /**
         * Установка значений даты для работы с транзакциями
         * @method settransactiondate
         * @param type {String} "start" или "end"
        */
        // ===============================================================
        settransactiondate: function (type) {
            if (!this.options) return;
            var date, time;
            switch (type) {
                case 'start':
                    if (this.options.transaction.startdate.datestring && this.options.transaction.startdate.datestring != '') {
                        date = this.options.transaction.startdate.datestring.split('.');
                        this.options.transaction.startdate.date = new Date(date[2], date[1], date[0]);
                    }
                    break;
                case 'end':
                    if (this.options.transaction.enddate.datestring && this.options.transaction.enddate.datestring != '') {
                        date = this.options.transaction.enddate.datestring.split('.');
                        this.options.transaction.enddate.date = new Date(date[2], date[1], date[0]);
                    }
            }
        },


        /**
         * СТАРТ РЕЖИМОВ
         */

         /**
         * Можно ли редактировать выделенный объект
         * @method canEditSelectObject
         * @param layerid {String} Идентификатор слоя карты
         * @param gid {String} Идентификатор объекта слоя
         * @param selectedFeatures - Класс выделенных объектов
         */
        // ===============================================================
        canEditSelectObject: function (layerid, gid, selectedFeatures) {
            // очистим панель
            this.destroyInfoObject();

            this.ischange(false);
            this.history.clear();

            // очистим меню
            this.destroyAddmenu();

            var layedit = this.iseditinglayer(layerid);
            if (!layedit || !selectedFeatures) { // не нашли нужный нам слой карты
                this.destroyEditobjects();
                w2alert(w2utils.lang('The object can not be edited because the layer is not included in the list of editable layers'));
                return;
            }

            // Назначим нужный слой
            this.maplayerid = layedit;
            // Установить тип редактируемого слоя
            this.layer = this.map.tiles.getLayerByxId(this.maplayerid.layerid);
            this.setlayertype(this.layer);

            // если есть выделенный объект, найдем его
            var editobject,
                mapobjects = selectedFeatures.mapobjects,
                count = mapobjects.length;
            if (count == 0) return;

            // если нет параметров, то ищем первый подходящий объект на нашей карте
            editobject = selectedFeatures.findobjectsById(layerid, gid);
            if (!editobject || editobject.geometry.count() == 0)
                return;

            // Проверка на возможность редактирования объекта
            if (!this.iseditinglayer_object(gid, editobject.code, editobject.key)) {
                this.destroyEditobjects();
                w2alert(editobject.maplayername + '. ' + editobject.name + '.\n\r' + w2utils.lang(
                    'The object can not be edited, because it does not include in the list of editable objects'));
                return;
            }

            // Сбросим отрисовку выделения, если задача редактирования
            if (this.mapeditorEditingTask)
                //selectedFeatures.clearDrawAll();
//                this.drawSelectFeatures.clearDrawAll();
                this.drawSelectFeatures.clear();

            this.destroyEditobjects();

            var gmldata = GWTK.Util.parseGmlId(editobject.gid);
            if (gmldata.objid == '0')
                editobject.gid = null;
            return editobject;
        },


        /**
        * Заполнить select для групповых операций по объектам, подлежащими редактированию
        * @method setGroupSelectedFeatures
        * @param selectedFeatures - Класс выделенных объектов
        */
        // ===============================================================
        setEditObjects: function (selectedFeatures) {
            if (!selectedFeatures || selectedFeatures.mapobjects.length == 0)
                return;
            var gmldata, find, result = [];
            this.clearEditObjects();
            for (var i = 0; i < selectedFeatures.mapobjects.length; i++) {
                selectedobject = selectedFeatures.mapobjects[i];
                gmldata = GWTK.Util.parseGmlId(selectedobject.gid);
                if (this.iseditinglayer_object(selectedobject.gid, selectedobject.code, selectedobject.key)) {
                    this.editobjects.push(selectedobject.clone());
                    if (result.length == 0) {
                        result.push({ 'sheet': gmldata.sheet, 'count': 1 });
                    }
                    else {
                        find = result.find(
                            function (element, index, array) {
                                if (element.sheet == gmldata.sheet) {
                                    element.count++;
                                    return element;
                                }
                            });
                        if (!find)
                            result.push({ 'sheet': gmldata.sheet, 'count': 1 });
                    }
                }
            }

            return result;
        },

        /**
       * Очистить набор объектов, подлежащими редактированию
       * @method clearEditObjects
       */
        // ===============================================================
        clearEditObjects: function () {
            var count = this.editobjects.length;
            for (var i = 0; i < count; i++)
                this.editobjects[i].clear();
            this.editobjects.splice(0, this.editobjects.length);
        },



        /**
        * Можно ли редактировать объект
        * @method canEditObject
        * @param editobject {Object} Объект карты
        */
        // ===============================================================
        canEditObject: function (editobject) {
            // очистим панель
            this.destroyInfoObject();

            this.ischange(false);
            this.history.clear();

            // очистим меню
            this.destroyAddmenu();

            var layedit = this.iseditinglayer(editobject.maplayerid);
            if (!layedit) { // не нашли нужный нам слой карты
                this.destroyEditobjects();
                w2alert(w2utils.lang('The object can not be edited because the layer is not included in the list of editable layers'));
                return;
            }

            // Назначим нужный слой
            this.maplayerid = layedit;
            // Установить тип редактируемого слоя
            this.layer = this.map.tiles.getLayerByxId(this.maplayerid.layerid);
            this.setlayertype(this.layer);

            // Проверка на возможность редактирования объекта
            if (!this.iseditinglayer_object(editobject.gid, editobject.code, editobject.key)) {
                this.destroyEditobjects();
                w2alert(editobject.maplayername + '. ' + editobject.name + '.\n\r' + w2utils.lang(
                    'The object can not be edited, because it does not include in the list of editable objects'));
                return;
            }

            // Сбросим отрисовку выделения, если задача редактирования
            if (this.mapeditorEditingTask)
                //this.drawSelectFeatures.clearDrawAll();
                this.drawSelectFeatures.clear();

            this.destroyEditobjects();
            return true;
        },


       /**
         * УДАЛЕНИЕ, РАЗРУШЕНИЕ КОМПОНЕНТОВ И СОБЫТИЙ
         */

        /**
         * Разрушить активную задачу по типу активного режима
         * @method destroyActiveTask
         */
        // ===============================================================
        destroyActiveTask: function (type) {

            // Сбросим класс выделения объектов  редактора
            this.drawSelectFeatures.clear();
            // Сбросим класс выделения объектов карты
            if (this.map.selectedObjects.editor) {
                //this.map.selectedObjects.clear();
                GWTK.Util.clearselectedFeatures(this.map);
                this.map.selectedObjects.editor = null;
            }
            // Сбросим выбор объекта, если онн был
            this.destroySelectMapObjectAction();

            switch (type) {
                case 'create':
                    if (this.closeTask(this.mapeditorCreatingTask)) {
                        this.mapeditorCreatingTask = null;
                    }
                    break;
                case 'edit':
                    if (this.closeTask(this.mapeditorEditingTask)) {
                        this.mapeditorEditingTask = null;
                        if (this.mapeditExtendMethods){
                            this.mapeditExtendMethods.hide();
                        }
                    }
                    break;
                case 'move':
                    if (this.closeTask(this.mapeditorMovingTask)) {
                        this.mapeditorMovingTask = null;
                    }
                    break;
                case 'merge':
                    if (this.closeTask(this.mapeditorMergingTask)) {
                        this.mapeditorMergingTask = null;
                    }
                    break;
                case 'delete':
                    if (this.map.taskManager && this.map.taskManager._action && (this.map.taskManager._action instanceof GWTK.MapeditorDeletingActionHover || this.map.taskManager._action instanceof GWTK.MapeditorDeletingAction)) {
                        this.map.closeAction();
                        $('#' + this.objectlistId).children().remove();
                        this.currentTask = null;
                        this.restoreAfterConfirm();
                    }
                    //this.restoreAfterConfirm();
                    //$(this.map.eventPane).trigger({ type: 'w2confirm_close', toolname: this.toolname });
                    break;
            }
            this.addmenu(null, 'transaction');

            // Высоту окна панели сделать auto
            this.resize();

        },


        /**
         * Разрушить все задачи редактора
         * @method destroyTasks
         */
        // ===============================================================
        destroyTasks: function () {
            this.destroyActiveTask('create');
            this.destroyActiveTask('edit');
            this.destroyActiveTask('delete');
            this.destroyActiveTask('move');
            this.destroyActiveTask('merge');
            this.ourAction = null;
            //this.editobjectssave = this.editobjectssave.splice(0, this.editobjectssave.length);
        },


        /**
         * Разрушение класса mapeditotTask
         * @method destroy
         */
        // ===============================================================
        destroy: function () {

            // Класс отрисовки объектов удалить
            this.drawSelectFeatures.destroy();

            this.destroyActionEvent();
            this.destroyTasks();
            //this.destroyAddmenu();

            if (!this.map) return;

            GWTK.DomUtil.removeActiveElement(this.button_ids.create);
            GWTK.DomUtil.removeActiveElement('#edselmap_' + this.id);

            // Удалить созданные панели
            if (this.panel) {

                // Удалим шаблоны
                if (this.mapeditTemplates) {
                    this.mapeditTemplates.destroy();
                    this.panelTemplates = null;
                }

                if (this.mapeditExtendMethods){
                    this.mapeditExtendMethods.destroy();
                    this.panelExtend = null;
                }

                $(this.panel).remove();
                var overlay = $('#w2ui-overlay-' + this.button_ids.setting);
                if (overlay)
                    overlay.remove();

                this.panel = null;
            }

            if (this.groupcontrol)
                this.groupcontrol.destroy();
        },

        /**
         * Удаление прослушки событий активного режима
         * @method destroyActionEvent
         */
        // ===============================================================
        destroyActionEvent: function () {

            // Запрет на контекстное меню
            $(this.map.mapPane).parent().off('contextmenu', this.onContextMenu);

            // отменить события клавиатуры
            this.map.off({ type: "keydown", target: "map", phase: 'before', sender: this }, this.onKeyDown);

            // сообщения от окна семантики
            $(this.map.eventPane).off('changedata_semantics', this.onChangeDataSemantics);
            // сообщения от окна метрики
            $(this.map.eventPane).off('changedata_metrics', this.onChangeDataMetrics);
            // обновление объекта
            $(this.map.eventPane).off('updatemapobject', this.onUpdateMapObject);
            // Перерисовка окна карты
            $(this.map.eventPane).off('overlayRefresh', this.onOverlayRefresh);
            // Старт нового обработчика
            $(this.map.eventPane).off('setaction', this.onSetAction);

            // изменение видимости слоев
            $(this.map.eventPane).off('visibilitychanged', this.onVisibilityChanged);

            // Нажатие кнопок мыши
            $(this.map.eventPane).off('ctrlleft', this.onCtrlLeft);
            $(this.map.eventPane).off('ctrlright', this.onCtrlRight);

        },

        /**
         * Сброс переменных после сохранения или отключения режима
         * @method clear
         */
        // ===============================================================
        clear: function (regime) {

            // Сбросить методы создания/редактирования текущей задачи
            var task = this.getActiveTask();
            if (task && task.clearMethod)
                task.clearMethod();

            // сбросим флажок изменения
            this.ischange(false);

            // очистим изображение объекта
            this.drawobject.destroy();

            // Сбросим размеры панели рисования
            this.restoredrawpanel();

            // Разрушим информационную панель объектов
            this.destroyInfoObject();
            // Разрушим список редактируемых объектов и
            // оконные элементы соответствующие этим объектам
            this.destroyEditobjects();

            // очистим историю
            this.history.clear();
            // Разрушим топологию
            this.topology.destroy();

        },

        /**
       * Разрушение панелей дополнительного меню (активного режима)
       * @method destroyAddmenu
       */
        // ===============================================================
        destroyAddmenu: function () {
            $('#mapeditingAddmenu').remove();
            var el = $('.mapeditingAddmenu_transaction');
            if (el && el.length > 0)
                el.show();
        },

        /**
         * Удаление информационной панели объекта
         * @method destroyInfoObject
         */
        // ===============================================================
        destroyInfoObject: function () {

            $(this.map.eventPane).off('controlbuttonclick', this.onControlButtonClick);

            // Удалим информационную панель
            this.destroyCharacteristicsInfo();
            if (this.maplayerid && this.maplayerid.layerid) {
                $('#' + this.objectinfoId).remove();
            }

            // Перевывести заголовок
            this.updatetitle(w2utils.lang("Map editor"));
        },

        /**
          * Удаление панели с семантическими и метрическими характеристиками объекта
          * @method destroyCharacteristicsInfo
          */
        // ===============================================================
        destroyCharacteristicsInfo: function () {
            var detailid = 'editdetail_' + this.id;
            if (w2ui[detailid]) {
                this.destroySemantic();
                this.destroyMetric();
                w2ui[detailid].destroy();
            }

            this.resize();
        },

        /**
         * Разрушить список редактируемых объектов и оконные элементы соответствующие этим объектам
         * @method destroyEditobjects
         */
        // ===============================================================
        destroyEditobjects: function () {

            if (!this.editobjects) return;

            // сбросим отображение
            var gid;
            for (var i = 0; i < this.editobjects.length; i++) {
                gid = this.editobjects[i].gid;
                if (gid) {
                    // var el = document.getElementById(this._drawOverlayPane + gid.replace(/\./g, '_'))
                    // if (el)
                        GWTK.DrawingObject.prototype.removeDomElement(this._drawOverlayPane + gid.replace(/\./g, '_'));
                }
            }

            this.drawpanel = null;

            this.clearEditObjects();
            //var count = this.editobjects.length;
            //for (var i = 0; i < count; i++)
            //    this.editobjects[i].clear();
            //this.editobjects.splice(0, this.editobjects.length);
        },

        /**
         * Разрушение объекта редактирования семантики объекта
         * @method destroySemantic
         */
        // ===============================================================
        destroySemantic: function () {
            if (this.rscsemantics && this._ischange) {
                this.rscsemantics.save();
                if (this.editobjects && this.editobjects.length > 0 && this.editobjects[0].semantic)
                    GWTK.MapEditorUtil.setsemanticmask(this.editobjects[0].semantic, this.rscsemantics._object);
            }

            if (this.rscsemantics) {
                this.rscsemantics.destroy();
                this.rscsemantics = null;
            }

        },

        /**
         * Разрушение объекта редактирования геометрии объекта
         * @method destroyMetric
         */
        // ===============================================================
        destroyMetric: function () {
            if (this.metrics) {
                this.metrics.destroy();
                this.metrics = null;
            }
            $('#' + this.metricsId + this.id).css("height", "auto");
        },


        /**
         * РАБОТА СО СЛОЯМИ
         */

        /**
         * Заполнение списка редактируемых слов и слоев, участвующих в выделении
         * @method setlayers
         * @param maplayerid {String} Идентификатор текущего слоя
        */
        // ===============================================================
        setlayers: function (maplayerid) {

            this.maplayersid.splice(0, this.maplayersid.length);

            //var maptree  = this.map.mapTool('mapcontent');
            //if (!maptree) return;

            var count = this.map.layers.length, realindex = -1, countParam, id;
            for (var i = 0; i < count; i++) {
                if (!this.map.layers[i].visible || !this.map.layers[i].editing)// || !w2ui[maptree.name].get(this.map.layers[i].xId)) // Невидимые слои или слои, не входящие в дерево
                    continue;
                if (this.map.layers[i] instanceof GWTK.WmsLayer) {
                    countParam = this.param.maplayersid.length;
                    for (var j = 0; j < countParam; j++) {
                        if (this.map.layers[i].options.id != this.param.maplayersid[j])
                            continue;
                        realindex = realindex < 0 ? i : realindex;
                        this.maplayersid.push({ "layerid": this.param.maplayersid[j] });
                        // Считаем классификатор
                        this.map.layers[i].classifier.getlegend();
                    }
                    continue;
                }
                else {
                    if (this.map.layers[i] instanceof GWTK.graphicLayer && this.map.layers[i].editing)
                        this.maplayersid.push({ "layerid": this.map.layers[i].options.id });
                }
                realindex = realindex < 0 ? i : realindex;
            }

            // выставим значение по умолчанию
            if (this.maplayersid.length == 0) {
                this.maplayerid = null;
                this.layer = null;
                return;
            }

            // редактируемые объекты
            if (this.param.editingdata) {
                count = this.maplayersid.length;
                for (var i = 0; i < count; i++) {
                    countParam = this.param.editingdata.length;
                    if (countParam == 0) continue;
                    for (var j = 0; j < countParam; j++) {
                        if (this.maplayersid[i].layerid != this.param.editingdata[j].layerid)
                            continue;
                        this.maplayersid[i].editingdata = JSON.parse(JSON.stringify(this.param.editingdata[j]));
                    }
                }
            }

            // Пытаемся установить идентификатор слоя (или по входящему или по текущему)
            if (!this.maplayerid || this.maplayerid.layerid == '') {
                if (!maplayerid || maplayerid.layerid == '')
                    maplayerid = this.maplayersid[0];
            }
            else {
                var find = this.iseditinglayer(this.maplayerid.layerid);
                if (find)
                    maplayerid = find;
            }

            // Если так и не определились со слоем, берем первый
            if (!maplayerid)
                maplayerid = this.maplayersid[0];

            // Найдем слой
            var layer = this.map.tiles.getLayerByxId(maplayerid.layerid);
            if (layer) {
                this.maplayerid = maplayerid;
                this.layer = this.map.tiles.getLayerByxId(this.maplayerid.layerid);
            }
            else {
                // найдем, что есть
                if (realindex) {
                    this.maplayerid = this.iseditinglayer(this.map.layers[realindex].options.id);
                    this.layer = this.map.tiles.getLayerByxId(this.maplayerid.layerid);
                }
            }

            count = this.map.layers.length;
            this.selectlayersid.splice(0, this.selectlayersid.length);
            for (var i = 0; i < count; i++) {
                if (!this.map.layers[i] || !this.map.layers[i].selectObject)
                    continue;
                id = this.map.layers[i].options.id;

                countParam = (this.param.selectlayersid && this.param.selectlayersid.length > 0) ? this.param.selectlayersid.length : 0;
                if (countParam == 0) {
                    this.selectlayersid.push(id);
                    continue;
                }

                for (var j = 0; j < countParam; j++) {
                    if (id != this.param.selectlayersid[j])
                        continue;
                    this.selectlayersid.push(this.param.selectlayersid[j]);
                }
            }

             return this.layer = layer;
        },

        /**
         * Установка/сброс типа слоя (слой карты или графический слой)
         * @method setlayertype
         * @param layer {Object} Слой карты GWTK.graphicLayer или GWTK.Layer
        */
        // ===============================================================
        setlayertype: function (layer) {
            if (!layer) return;

            if (layer instanceof GWTK.graphicLayer) {
                this.graphic = true;
                this.res_mapEditor_confirm_deleteobject = w2utils.lang("You confirm the removal of the object");//"Вы подтверждаете удаление объекта?",;
            }
            else {
                this.graphic = false;
                this.res_mapEditor_confirm_deleteobject = w2utils.lang("You confirm the removal of the object on the server");//"Вы подтверждаете удаление объекта на сервере?',;
            }
        },

        /**
         * Изменение списка слоев карты при изменении состава карты извне
         * @method layerlistchanged
         * @param layerid {String} Идентификатор добавленного или удаленного слоя
         * @param act {String} Признак добавления или удаления слоя ("add" или "remove")
         * из внешней функции
         */
        // ===============================================================
        layerlistchanged: function (layerid, act, onvisible) {

            // удалим окно выбора объектов
            var find = this.iseditinglayer(layerid);
            // Если идет по второму разу
            if (act == "add" && find || act == "remove" && !find)
                return;

            var countparam = this.param.maplayersid.length;
            // Если локальные слои, то просто обновим список
            if (act == "remove" && find) {
                if (onvisible && this.maplayerid.layerid == layerid) {  // если пришло при изменении видимости
                        // Завершить задачу, связанную с этим слоем
                        if (this.currentTask != 'delete')
                            this.canClose(this.currentTask);
                }
            }

            // Установим слои
            var maplayerid =  this.param.maplayersid && this.param.maplayersid.length > 0 ? this.param.maplayersid[0] : null;
            this.setlayers(maplayerid);

            if (!this.layer) {
                // Закрыть все задачи
                $('#' + this.button_ids.save).hide();
                this.destroyTasks();
                console.log(w2utils.lang('There are no layers of editing'));
                // w2alert(w2utils.lang('There are no layers of editing'), w2utils.lang('Map editor'));
                // return;
            }

            // Если задача создания
            if (this.mapeditorCreatingTask) {
                var legend = this.layer.classifier.legend;
                if (legend) {
                    if (this.map.taskManager._action &&
                        (this.map.taskManager._action.name == 'edit' || this.map.taskManager._action.name == 'create')) {
                        this.map.taskManager._action.close();
                        this.clear();
                    }
                    this.mapeditorCreatingTask.initSelectObjects(legend);
                }

                var _that = this;
                this.setSelectMaps('#' + this.maplistId, false,
                    function (layer) {
                        _that.setlayertype(layer);
                    },
                    function (obj, first) {
                        this.mapeditorCreatingTask.changeselectmaplist(obj, first);
                        this.changemap = false;
                    });
            }

        },

        ///**
        // * Добавление карты в список на редактирование
        // * @method addmapslayer
        // * @param layerid {String} Идентификатор слоя
        // */
        //// ===============================================================
        //addmapslayer: function (layerid) {
        //    this.layerlistchanged(layerid, "add", true);
        //},

        /**
         * РАБОТА С КУКИ
         */

        /**
         * Записать куки редактора карты
         * @method _writeedCookie
         * @param cssslider {Boolean} Флаг наличия панели создания объекта
         */
        // ===============================================================
        _writeedCookie: function (cssslider) {
            var startdate = (!this.options.transaction.startdate.date || this.options.transaction.startdate.date == '') ? null : 'transaction_startdate=' + this.options.transaction.startdate.date.getTime().toString();
            var enddate = (!this.options.transaction.enddate.date || this.options.transaction.enddate.date == '') ? null : 'transaction_enddate=' + this.options.transaction.enddate.date.getTime().toString();
            $panel = this.$panel;
            var offset = $panel.offset();
            var value = ['id=' + this.id,
                         'objectinfoExt=' + this.objectinfoExt,
                         'posleft=' + ((offset) ? offset.left : 0),
                         'postop=' + ((offset) ? offset.top : 0),
                         'limit=' + this.options.topology.limit,
                         'captureradius=' + this.options.topology.captureradius,
                         'transaction_servicerecord=' + this.options.transaction.servicerecord,
                         'autosave=' + this.options.autosave,
                         'width=' + ((offset) ? $panel.width() : 0),
                         'height=' + ((offset) ? $panel.height() : 0),
                         'objectselectionInPoint=' + ((this.options.objectselectionInPoint) ? 1 : 0),       // Выбор объекта в точке
                         'capturePoints=' + ((this.options.capturePoints) ? 1 : 0),                         // Захват точек
                         'captureVirtualPoints=' + ((this.options.captureVirtualPoints) ? 1 : 0)            // Захват виртуальных точек
            ];

            if (startdate)
                value.push(startdate);
            if (enddate)
                value.push(enddate);
            if (cssslider) {
                value.push('cssslider=' + JSON.stringify(cssslider));
            }
            else {
                // Проверим предыдущие куки на предмет слайдера
                var param = GWTK.cookie("mapeditor", GWTK.cookies.converter);
                if (param && !cssslider) {
                    $.each(param, function (index, value1) {
                        var key = value1.shift();
                        var key_value = value.length > 0 ? value1.shift() : '';
                        switch (key) {
                            case 'cssslider':
                                value.push('cssslider=' + key_value);
                                break;
                        }
                    });
                }
            }

            value = value.join('&');
            GWTK.cookie('mapeditor', value, { expires: 5, path: '/' });
        },

        /**
         * Прочитать куки панели инструментов карты
         * @method _readCookie
         */
        // ===============================================================
        _readCookie: function () {
            var param = GWTK.cookie("VisiblePanels", GWTK.cookies.converter);
            if (param === undefined) return;

            //var tool = panel_button - mapEditor
            var tool = this.mapTool("mapeditor");
            if (!tool) return;

            $.each(param, function (index, value) {
                var key = value.shift();
                var key_value = value.length > 0 ? value.shift() : '';
                key_value = key_value.split(',');
                if (key == 'panel_button-' + tool.toolname) {
                    button = $('#' + key);
                    panel = button[0]._pane;
                    if (key_value[0] == 'show') {
                        $('#panel_button-' + tool.toolname).click();
                    }
                }
            });
            return;
        },

        /**
         * Прочитать куки редактора карты
         * @method _readedCookie
         */
        // ===============================================================
        _readedCookie: function () {
            if (!this.$panel) return;

            var panelScaler = $('.panel-scaler');
            var controlPanel = $(this.map.controlsPane);
            var height = panelScaler.height() > controlPanel.height() ? panelScaler.height() + panelScaler.offset().top : controlPanel.height() + controlPanel.offset().top;
            var $mapdiv = $('#' + this.map.divID);
            // if ((parseInt(this.$panel.css('left')) == 0)) {
            //     this.$panel.css({
            //         top: height - $mapdiv.offset().top,
            //         left: controlPanel.offset().left
            //     });
            // }

            this.$panel.css({
                top: height - $mapdiv.offset().top,
                left: 0
            });

            var param = GWTK.cookie("mapeditor", GWTK.cookies.converter);
            if (!param) return;

            var _that = this;
            var position = {};
            var wh = { 'width': this.cssNoTask.width, 'height': this.cssNoTask.height, 'cssslider': null };
            var flag, width, date;
            $.each(param, function (index, value) {
                var key = value.shift();
                var key_value = value.length > 0 ? value.shift() : '';
                switch (key) {
                    case 'id':
                        if (key_value != _that.id)
                            return;
                        break;
                    case 'posleft':
                        position.left = key_value;
                        break;
                    case 'postop':
                        position.top = key_value;
                        break;
                    case 'flag':
                        flag = key_value;
                        break;
                    case 'objectinfoExt':
                        _that.objectinfoExt = JSON.parse(key_value);
                        break;
                    case 'limit':
                        if (key_value) {
                            _that.options.topology.limit = parseFloat(key_value);
                        }
                        break;
                    case 'captureradius':
                        if (key_value) {
                            _that.options.topology.captureradius = parseFloat(key_value);
                        }
                        break;
                        // даты в миллисекундах
                    case 'transaction_startdate':
                        if (key_value != '')
                            _that.options.transaction.startdate.date = new Date(parseInt(JSON.parse(key_value)));
                        break;
                    case 'transaction_enddate':
                        if (key_value != '')
                            _that.options.transaction.enddate.date = new Date(parseInt(JSON.parse(key_value)));
                        break;
                    case 'transaction_servicerecord':
                        _that.options.transaction.servicerecord = parseInt(JSON.parse(key_value));
                        break;
                    case 'autosave':
                        _that.options.autosave = parseInt(JSON.parse(key_value));
                        break;
                    case 'width':
                        wh.width = parseInt(JSON.parse(key_value));
                        break;
                    case 'height':
                        wh.height = parseInt(JSON.parse(key_value));
                        break;
                    case 'cssslider':
                        wh.cssslider = JSON.parse(key_value);
                        break;
                    case 'objectselectionInPoint':   // Выбор объекта в точке
                        _that.options.objectselectionInPoint = parseInt(JSON.parse(key_value));
                        break;
                    case 'capturePoints':   // Захват точек
                        _that.options.capturePoints = parseInt(JSON.parse(key_value));
                        break;
                    case 'captureVirtualPoints':   // Захват виртуальных точек
                        _that.options.captureVirtualPoints = parseInt(JSON.parse(key_value));
                        break;
                }
            });

            //if (position.top > 0 && position.left > 0) {
            //    this.$panel.offset({ top: position.top, left: position.left });
            //}
            var mapOffset = $mapdiv.offset();
            var mapHeight = $mapdiv.height();
            var mapWidth = $mapdiv.width();
            if (position.top > mapOffset.top && position.left > mapOffset.left &&
                position.top < (mapHeight + mapOffset.top - 30) && position.left < (mapWidth + mapOffset.left - 30)) {
                this.$panel.offset({ top: position.top, left: position.left });
            }

            // Инициализация даты транзакций
            this.inittransactiondate('start');
            this.inittransactiondate('end');

            return wh;
        },



        /**
         * ФУНКЦИИ СМЕНЫ ИЗОБРАЖЕНИЙ (КАРТЫ, ОКНА, КОНТУРОВ ОБЪЕКТА, СЛУЖЕБНЫХ КОНТУРОВ ...)
         */

        /**
        * Перерисовка карты
        * @method refreshmap
        */
        // ===============================================================
        refreshmap: function () {
            // перерисовать карту
            if (this.map.tiles.wmsManager) {
                this.map.tiles.wmsManager.view_refresh = true;
                this.map.tiles.wmsManager.wmsDrawing();
            }

            // Перерисуем выделение
            var selectedFeatures = this.map.objectManager.selectedFeatures;
            if (selectedFeatures && this.isGroupProcess)
               selectedFeatures.drawSelectedObjects(true);

            //this.map.tiles.forceupdate();
        },

        /**
         * Обновить изображение редактируемого объекта
         * @method updatedrawcontur
         * @param nometrics {Boolean} - если true -
         * то не обновляется содержимое окна ввода координат с клавиатуры
         */
        // ===============================================================
        updatedrawcontur: function (nometrics, subaction) {

            if (!subaction) {
                if (this.map && this.map.taskManager && this.map.taskManager._action)
                    subaction = this.map.taskManager._action.name;
            }

            this.drawobject.drw_centerpoints = (subaction == 'edit') ? true : false;
            var bbox = (subaction == 'edit') ? true : false;
            this.refreshdraw(null, bbox);

            if (!this.editobjects[0] || !this.drawpanel || this.editobjects[0].geometry.count() == 0)
                return;

            if (!nometrics && this.metrics)
                this.metrics.creategrid(this.editobjects[0].geometry.saveJSON(true));

            this.addmenu();

        },

        /**
        * Создание панели для рисования объекта
        * @method createdrawpanel
        */
        // ===============================================================
        createdrawpanel: function () {
            if (!this.map.drawPane || !this.editobjects[0].gid)
                return;
            var drawpanel_id = this.editobjects[0].gid.replace(/\./g, '_');
            var el = document.getElementById(this._drawOverlayPane + drawpanel_id);
            if (el)
                el.parentNode.removeChild(el);
            //var p = $('#' + this._drawOverlayPane + drawpanel_id);
            //if (p && p.length > 0)
            //    p.remove();
            this.drawpanel = GWTK.DomUtil.create('div', 'overlay-panel', this.map.drawPane);
            this.drawpanel.id = this._drawOverlayPane + drawpanel_id;
            return true;
        },

        /**
        * Создание панели для рисования объекта
        * @method getdrawpanel
        */
        // ===============================================================
        getdrawpanel: function () {
            return this.drawpanel;
        },

        /**
         * Восстановить размеры панели отрисовки объекта
         * @method restoredrawpanel
         */
        // ===============================================================
        restoredrawpanel: function () {
            if (!this.drawpanel)  return;

            this.zIndexRestore();

            //this.drawpanel.style.width = '1px';
            //this.drawpanel.style.height = '1px';
            this.drawpanel.style.width = '0px';
            this.drawpanel.style.height = '0px';
            this.drawpanel.style.left = '0px';
            this.drawpanel.style.top = '0px';
            this.drawpanel.style.cursor = 'default';

           // this.drawpanel.style.border = 'red solid 10px';

        },

        /**
         * СОЗДАНИЕ ИНФОРМАЦИОННЫХ ПАНЕЛЕЙ
         */

        /**
         * Создание информационного окна создаваемого/редактируемого объекта
         * @method createPaneInfoObject
         */
        // ===============================================================
        createPaneInfoObject: function (subaction) {

            // удалим информационную панель
            this.destroyInfoObject();
            this.destroyAddmenu();

            //$('#mapeditingAddmenu').remove();
            if (!this.editobjects[0].gid)
                return;

            // Запросить слой
            this.layer = this.map.tiles.getLayerByxId(this.maplayerid.layerid);
            if (!this.layer) {
                w2alert(w2utils.lang('The object can not be edited because the layer is not included in the list of editable layers'));
                return;
            }

            var strpanel = '', css = this.toolname + "Objects-panel";
            var title = "";

            var rscobject, gid = '', gmldata;
            gid = this.editobjects[0].gid;

            switch (subaction) {
                case "create": // Процесс создания
                    if (this.mapeditorCreatingTask) {// Если запущена задача создания
                        title = w2utils.lang("Create object");

                        // список карт для основных карт
                        if (!this.graphic) {
                            this.mapeditorCreatingTask.initSelectMaps();
                        }
                        // Запросим характеристики объекта по ключу (на крайний случай по коду)
                        rscobject = this.getrscobject(this.editobjects[0].key, this.editobjects[0].code);
                        if (rscobject) {
                            this.editobjects[0].image = rscobject.image;
                            this.editobjects[0].name = rscobject.name;
                        }
                    }
                    break;

                case "edit": // Процесс редактирования

                    var title = w2utils.lang("editing object");
                    var gmldata = GWTK.Util.parseGmlId(gid);
                    if (gmldata && gmldata.sheet && gmldata.objid) {
                        var layer = this.map.tiles.getLayerByGmlId(gid);
                        if (layer)
                            gid = layer.alias + ':' + gmldata.objid;
                    }

                    break;
                default: return;
            }

            // Заголовок в панель редактора
            this.updatetitle(w2utils.lang("Map editor") + ": " + title);

            strpanel =
             '<table style="width:100%; table-layout: fixed;" cellspacing=0 cellpadding=0> ';

            if (!this.graphic)
                strpanel +=
                '<tr>' +
                '<td id="objectimage" class="objectimage">' +
                '</td>' +
                '<td align="left" class="objectname">' + this.editobjects[0].name + '<br />' + gid +
                '</td>' +
                // Метод создания или режим редактирования
                GWTK.MapeditorCreatingTask.prototype.htmlMethod(this.editobjects[0].spatialposition, this.graphic, this.objectmethodId) +
                '</tr>';
            else {
                if (subaction != "create") {
                    strpanel += '<tr>' +
                        '<td align="left">' + gid + '</td>' +
                       // Режим редактирования
                       GWTK.MapeditorEditingAction.prototype.htmlMethod(this.editobjects[0].spatialposition, this.graphic, this.objectmethodId) +
                        '</tr>';
                }
            }

            // Если создание объекта или подобъекта, инструменты взять из задачи
            if (this.mapeditorCreatingTask) {
                this.mapeditorCreatingTask.sethtmlMethod();
            }
            else
                $(this.map.eventPane).on('controlbuttonclick', this.onControlButtonClick);

            // Дополнительная информация для объекта при создании подписей обязательна
            if (this.editobjects[0].spatialposition.toLowerCase() == 'title')
                this.objectinfoExt = true;

            var imgUD = '';
            if (this.objectinfoExt) {
                if (!this.objectinfoExtFull)
                    imgUD = 'title="' + w2utils.lang("Characteristics of object") + '" src="' + GWTK.imgArrowUp + '"';
            }
            else
                imgUD = 'title="' + w2utils.lang("Characteristics of object") + '" src="' + GWTK.imgArrowDown + '"';

            this._writeedCookie();

            strpanel +=
               '<tr>' +
                '<td align="left">' +
                   '<div><img id="edit_objectinfoExt" ' + imgUD + '> </div>' +
                '</td>' +
                '<td></td>' +
               '</tr>';

            // семантика, метрика
            var detailid = 'editdetail_' + this.id;
            strpanel +=
               '<tr>' +
                '<td colspan=3>' +
                '<div id="editdetail_' + this.id + '" style="margin-bottom:10px;"> </div>' +
                '<div class="objdetail w2ui-reset" id="' + this.semanticId + this.id + '"></div>' +
                '<div class="objdetail w2ui-reset" id="' + this.metricsId + this.id + '"></div>' +
                '</div>' +
               '</td>' +
               '</tr>' +
               '</tr>' + '</table>';

            // панель в панели
            var pane = this.map.createPane('edContainerInfo', this.panel);
            pane.id = this.objectinfoId;// 'mapeditingInfoObject' + this.maplayerid.layerid;
            $(pane).append(strpanel);

            var _that = this;
            $('#edit_objectinfoExt').click(function (event) {
                if ($(this).attr('src') == GWTK.imgArrowUp) {
                    $(this).attr('src', GWTK.imgArrowDown);
                    _that.objectinfoExt = false;
                    _that.destroyCharacteristicsInfo();
                    // Кнопка расширения окна
                    _that.objectinfoExtFull = false;
                    _that._writeedCookie();
                }
                else {
                    if ($(this).attr('src') == GWTK.imgArrowDown) {
                        $(this).attr('src', GWTK.imgArrowUp);
                        _that.objectinfoExt = true;
                        _that._writeedCookie();
                        _that.addCharacteristicsInfo(null, subaction);
                        _that.sizeRemember();
                    }
                }


            });

            if (subaction == "create") { // Создание
                $('#objectimage').append('<div class="' + this.editobjects[0].image + '" style="width: 32px; height:32px;"></div>');
                // var sem = this.layer.classifier.getsemantics(this.editobjects[0].key);
                this.layer.classifier.getsemantics(this.editobjects[0].key, GWTK.Util.bind(function(sem){
                    if (sem) {
                        this.editobjects[0].semantic.setsemantics(sem);
                    }
                    else {
                        if (window.console) {
                            console.log("Запрос объекта по ключу " + this.editobjects[0].key + ", сервер не ответил своевременно. Проверьте наличие библиотеки objectinfo.dll");
                            // this.destroyInfoObject();
                        }
                    }

                    if (this.objectinfoExt)
                        this.addCharacteristicsInfo(null, subaction);
                }, this));
                // if (sem) {
                //     this.editobjects[0].semantic.setsemantics(sem);
                // }
                // else {
                //     if (window.console) {
                //         console.log("Запрос объекта по ключу " + this.editobjects[0].key + ", сервер не ответил своевременно. Проверьте наличие библиотеки objectinfo.dll");
                //         // this.destroyInfoObject();
                //     }
                // }
                //
                // if (this.objectinfoExt)
                //     this.addCharacteristicsInfo(null, subaction);
            }
            else {                                 // Редактирование
                if (gmldata && gmldata.objid) {
                    this.editobjects[0].getsemanticsobject(gmldata.objid, GWTK.Util.bind(
                        function(rscobjectnumber) {
                            if (rscobjectnumber) {
                                this.editobjects[0].semantic.setsemantics(rscobjectnumber.rscsemantics);
                                this.editobjects[0].key = rscobjectnumber.key;
                                //this.rscsemantics = rscobjectnumber.rscsemantics;
                                var editingobjects = GWTK.MapEditorUtil.iseditingobjects(this.maplayerid);
                                if (editingobjects) {
                                    edobj = GWTK.MapEditorUtil.iseditingobject(editingobjects, this.editobjects[0].code, this.editobjects[0].key);
                                    if (!edobj) {
                                        w2alert(w2utils.lang('The object can not be edited, because it does not include in the list of editable objects') + ': ' + this.editobjects[0].name);
                                        this.destroyInfoObject();
                                        return;
                                    }
                                }

                                var rscobject = this.layer.classifier.getobject(rscobjectnumber.key);
                                if (rscobject) {
                                    this.editobjects[0].image = rscobject.image;
                                    this.editobjects[0].spatialposition = GWTK.classifier.prototype.getlocal(rscobject.local);
                                    if ($('#objectimage div').length == 0) {
                                        $('#objectimage').append('<div class="' + this.editobjects[0].image + '" style="width: 32px; height:32px;"></div>');
                                    }
                                }

                                if (this.objectinfoExt)
                                    this.addCharacteristicsInfo(null, subaction);

                            }
                            else {
                                if (window.console) {
                                    console.log("Запрос объекта по ключу " + gmldata.objid + ", сервер не ответил своевременно. Проверьте наличие библиотеки objectinfo.dll");
                                    if (this.objectinfoExt)
                                        this.addCharacteristicsInfo(null, subaction);
                                }
                            }
                        }, this));
                }

            }

            this.addmenu();
            return true;
        },

        /**
         * Создание панелей с семантическими м метрическими характеристиками
         * @method addCharacteristicsInfo
         * @param target {Element} - элемент окна, если оно было создано ранее
         */
        // ===============================================================
        addCharacteristicsInfo: function (target, subaction) {
            var _that = this;
            this.resize();

            var tabs = [];
            if (this.isfunction(this.info, 'semantics')) {
                tabs.push({ id: this.semanticId + this.id, caption: w2utils.lang("Attributes") });
            }
            if (this.isfunction(this.info, 'metrics')) {
                tabs.push({ id: this.metricsId + this.id, caption: w2utils.lang("Geometry") });
            }
            if (tabs.length == 0)
                return;

            $(this.map.eventPane).on('changedata_method', function (event) {
                subaction = event.action;
            });

            var detailid = 'editdetail_' + this.id;
            if (!w2ui[detailid]) {
                $('#' + detailid).w2tabs({
                    name: detailid,
                    style: 'background-color: transparent;',
                    active: this.semanticId + this.id,
                    tabs: tabs,
                    onClick: function (event) {
                        _that.destroyCharacteristicsInfo();
                        _that.addCharacteristicsInfo(event.target, subaction);
                    }
                });
            }

            if ((!target || target.indexOf(this.semanticId) >= 0) && this.isfunction(this.info, 'semantics')) {
                var semantic = this.editobjects[0].semantic;
                if (semantic && semantic.semantics && semantic.count() > 0 && !this.rscsemantics)
                    this.addsemanticEditor(GWTK.MapEditorUtil.getsemanticmask(semantic, this.editobjects[0], this.iseditinglayer(this.editobjects[0].maplayerid)));
            }
            else {   // метрика
                if (this.isfunction(this.info, 'metrics')) {
                    $(this.map.eventPane).off('changedata_metrics', this.onChangeDataMetrics);
                    this.options.geometry.action = subaction;
                    this.options.size = this.getmaxSizeForDetail();
                    if (!this.metrics) {
                        this.metrics = new GWTK.GeometryEditor(this.map, this.metricsId + this.id, this.editobjects[0].geometry.saveJSON(true), this.options.geometry, 0);
                    }
                    if (this.metrics.error) {
                        this.metrics = null;
                    }
                    else {
                        // собщения от окна метрики
                        $(this.map.eventPane).on('changedata_metrics', this.onChangeDataMetrics);
                    }
                }
            }
        },

        /**
         * Добавление панели со списком семантик объекта
         * @method addsemanticEditor
         * @param semantics {Array} - Массив семантик (GWTK.rscsemantic)
         */
        // ===============================================================
        addsemanticEditor: function (semantics) {
            // ограничение по семантике или ее отсутствие
            if (!semantics || semantics.length == 0)
                return;

            var _classifier = this.layer.classifier;
            if (this.graphic) {
                this.semanticoptions_graphic.size = this.getmaxSizeForDetail();
                this.rscsemantics = new GWTK.SemanticEditor(this.map, _classifier, this.semanticId + this.id, semantics, this.semanticoptions_graphic);
            }
            else {
                this.semanticoptions.size = this.getmaxSizeForDetail();
                this.rscsemantics = new GWTK.SemanticEditor(this.map, _classifier, this.semanticId + this.id, semantics, this.semanticoptions);
            }

            // сообщения от окна семантики
            $(this.map.eventPane).off('changedata_semantics', this.onChangeDataSemantics);
            $(this.map.eventPane).on('changedata_semantics', this.onChangeDataSemantics);

            this.updatetitle();
        },

        /**
        * Обновление заголовка в панели информации
        * @method updatetitle
        * @param text {String} Текст заголовка
        */
        // ===============================================================
        updatetitle: function (text) {

            if (!text) return;

            var $parent = $('.edContainer');
            if ($parent.length == 0)
                return;
            var $bt = $parent.find(" .routeFilesName"), _that = this;
            $bt.empty();
            // if (!this.autonomous) {
                $bt[0].appendChild(GWTK.Util.createHeaderForComponent({
                    map: this.map,
                    name: text,
                    context: "mapeditor",
                    callback: GWTK.Util.bind(function () {
                        if (_that.autonomous) {
                            _that.closeAutonomous('cancel');
                            return;
                        }
                        else {
                            if (_that.bt_selector) {
                                $(_that.bt_selector).click();
                            } else {
                                if (_that.map.closeTask(_that))
                                    _that.map.mapeditor.mapeditorTask = null;
                                _that = null;
                            }
                        }

                    }, this)
                }));
            // }
            // else {
            //     // для автономного запуска кнопка закрытия не нужна
            //     var div = document.createElement( 'div' );
            //     div.className = 'panel-info-header';
            //     var span = document.createElement('span');
            //     span.innerHTML = text;
            //     div.appendChild( span );
            //     $bt.append(div);
            // }

            this.resize();
        },

        /**
         * Запросить объект rscobject по ключу объекта
         * @method getrscobject
         * @param key {String} Ключ объекта
         */
        // ===============================================================
        getrscobject: function (key, code) {
            if (!key && !code) return;
            this.layer = this.map.tiles.getLayerByxId(this.maplayerid.layerid);
            if (this.layer)
                return this.layer.classifier.getobject(key, code);
        },


        /**
         * ФУНКЦИИ СОЗДАНИЯ ДОПОЛНИТЕЛЬНЫХ МЕНЮ И РАБОТЫ С НИМИ
         */

        /**
        * Добавление в основную панель редактора панели динамичеких режимов:
        * история, сохранение, удаление
        * @method addmenu
        * @param parent {Element} - Родительский элемент
        */
        // ===============================================================
        addmenu: function (parent, type) {
            this.destroyAddmenu();

            var parent = document.getElementById(this.button_ids.process);
            if (!parent) return;
            this.paneAdd = this.map.createPane('edContainer', parent);
            this.paneAdd.id = 'mapeditingAddmenu';

            // история
            var history = (!type) ? this.htmlHistory('history') : (this.param.transaction ? this.htmlHistory(type) : ''),
                count = this.history.count(),
                pcount = (this.editobjects.length > 0 && this.editobjects[0].geometry) ? this.editobjects[0].geometry.count() : 0,
                deleteobject = '', save = '',
                // cancel зависит от типа кнопок отката
                cancel = (type) ? '' : '<td align="right"> ' +
                '<div id="' + this.button_ids.cancel + '" name="cancel" class="control-button control-button_edcancel control-button_addmenu clickable" Title="' + w2utils.lang("Cancel") + '"> </div> ' +  // кнопка отмена операции редактировая данных
                '</td> ';

            if ((this.isfunction(this.functions, "edit") || this.isfunction(this.functions, "create")) && this._ischange && pcount > 0) {
                save = '<td></td> <td align="right"> ' +
             '<div id="' + this.button_ids.save + '" name = "save" class="control-button control-button_edsave control-button_addmenu clickable" Title="' + w2utils.lang("Save") + ' (Сtrl+S)"> </div> ' +  // кнопка сохранения данных на сервер
             '</td> ';
            }

            var strpanel =
            '<div>' +
            '<div> <table width="100%" > ' +
            '<tr align="left"> ' +
            history +
            deleteobject +
            save +
            cancel +
           '</tr> </table> </div>  </div>';

            $(this.paneAdd).append(strpanel);

            var _that = this;
            $('#mapeditingAddmenu_close').click(function (event) {
                $('#mapeditingAddmenu').hide();
                return false;
            });

            // назад
            $('#mapeditingAddmenu_history_prev').click(function (event) {
                GWTK.DomUtil.setActiveElement('#' + this.id);
                _that.restorehistory('prev');
                _that.addmenu();
                GWTK.DomUtil.removeActiveElement('#' + this.id);
            });

            // вперед
            $('#mapeditingAddmenu_history_next').click(function (event) {
                GWTK.DomUtil.setActiveElement('#' + this.id);
                _that.restorehistory('next');
                _that.addmenu();
                GWTK.DomUtil.removeActiveElement('#' + this.id);
            });


            $('#' + this.button_ids.save).click(function (event) {

                //_that.canClose();
                var subaction = (_that.map && _that.map.taskManager && _that.map.taskManager._action) ? _that.map.taskManager._action.name : null;

                // Откорректировать метрику сложного многоугольника
                if (subaction == 'create' && _that.mapeditorCreatingTask) {
                    _that.mapeditorCreatingTask.correctMultirect();
                }

                _that.extend = false;
                _that.setCloneForSave();
                if (_that.w2confirmErrors(_that.currentTask))
                    $(event.target).hide();
            });


            $('#' + this.button_ids.cancel).click(function (event) {
                // Если автономный запуск, отослать триггер и закрыть задачу
                if (_that.autonomous) {
                    _that.closeAutonomous('cancel');
                    return;
                }
                _that.extend = false;
                _that.canClose();
            });
        },


        /**
       * Назначить обработчик
       * @method setAction
       * @param action {Object} - объект-обработчик
       */
        // ===============================================================
        // Назначить обработчик
        setAction: function (action) {
            if (!action || action.error) return;
            if (this.map.setAction(action)) {
                GWTK.DomUtil.removeActiveElement(".button-action");
                action.task.action = action;
                return true;
            }
        },

        /**
       * Закрыть обработчик
       * @method closeAction
       */
        // ===============================================================
        closeAction: function () {
            if (this.map.closeAction()) {
                return true;
            }
        },

        /**
        * Запрос на возможность завершения задачи
        * @method canClose
        * @param task {Boolean} - признак того, что это обработчик компонента Редактор карты
        */
        // ===============================================================
        canClose: function (task) {
            if (this.isGroupDeleteProcess)
                return false;

            if (this.extend && !this.ourAction && !task) {
               return true;
            }

            this.extend = false;
            var regime = this.currentTask, _that = this;
            if (!regime) return true;

            // Закрыть только задачу task
            this.destroycurrentTask = task;

            this.canCancel = true;
            if (this.map.taskManager._action) {
                // если это наш обработчик, то закрыть
                if (this.isOurAction(this.map.taskManager._action)) {
                    this.map.taskManager._action.canCancel = this.canCancel;
                }
            }

            var $el = $('#' + this.button_ids.save);
            // Если есть изменения или активный процесс
            if ($el.length > 0 && $el.is(':visible')) {   // Если кнопка изменения данных доступна
                this.ischange(false);
                // Удалим кнопку сохранения
                $el.remove();
                // Подготовим объекты для сохранения
                this.setCloneForSave();
                // Сделать запрос на сохранение
                w2confirm(w2utils.lang("You are sure that you want to cancel editing? In this case your changes won't be kept."), w2utils.lang("Map editor"), function (answer) {
                    if (answer == 'Yes')
                        _that.restoreAfterConfirm();
                    else {
                        _that.w2confirmErrors(regime);
                    }
                });
            }
            else {
                // Восстановление данных и задач после вопроса о сохранении
                this.restoreAfterConfirm();
            }

            return this.canCancel;
        },


        /**
       * Запрос на сохранение при ошибках
       * @method w2confirmErrors
       */
        // ===============================================================
        w2confirmErrors: function (regime) {
            var _that = this;
            if (this.message && this.message.length > 0) {
                w2confirm(this.message + '\n\r' + w2utils.lang("Continue saving?"), w2utils.lang("Map editor") + ': ' + w2utils.lang("error..."), function (answer) {
                    if (answer == 'Yes')
                        _that.save(regime);
                    else
                        _that.restoreAfterConfirm();
                });
            }
            else
                this.save(regime);
        },


        /**
       * Восстановление данных и задач после вопроса о сохранении
       * @method restoreAfterConfirm
       */
        // ===============================================================
        restoreAfterConfirm: function () {
            $(this.map.eventPane).trigger({ type: 'w2confirm_close', toolname: this.toolname });

            // Запускается не наш обработчик
            if (this.ourAction) {
                this.destroycurrentTask = this.currentTask;
                this.ourAction = null;
                this.ischange(false);
                this.destroyActiveTask(this.currentTask);
                return;
            }

            // Закрыть только текущую задачу
            if (this.destroycurrentTask) {
                this.destroycurrentTask = null;
                this.isGroupDeleteProcess = false;
                this.isGroupProcess = false;
                return;
            }

            // Восстановить задачу после закрытия обработчика, если это надо
            this.restoreTask();

        },

        /**
       * html код для кнопок отмены операций
       * @method htmlHistory
       * @param history {Boolean} = true - кнопки для истории, иначе кнопки для транзакций
       */
        // ===============================================================
        htmlHistory: function (type) {
            var htmlhistory = '', count, disablednext = '', disabledprev = '',
                classname = 'mapeditingAddmenu_',
                newid = classname + type,
                titleprev = w2utils.lang("Cancel operation"),
                titlenext = w2utils.lang("Restore the operation");

            var nextscr = GWTK.imgNext, prevscr = GWTK.imgPrev;
            if (type == 'history') {
                count = this.history.count();
                disablednext = disabledprev = 'disabledbutton';
                if (this.history.current < count - 1) {
                    disablednext = '';
                }
                if (this.history.current >= 0) {
                    disabledprev = '';
                }

                titleprev += ' (Сtrl+Z)';
                titlenext += ' (Сtrl+Y)';
            }

            // Кнопки с отменой транзакций просто делаем невидимыми
            $('.' + classname + 'transaction').hide();
            // Кнопки с историей удаляем
            $('.' + classname + 'history').remove();
            // Далее по сценарию
            var el = $('.' + newid);
            if (type == 'transaction') {
                if (el.length > 0) {
                    el.show();
                    return htmlhistory;
                }
            }

            return htmlhistory =
            '<td  width = "40px" align="right" class="' + newid + '">' +
                '<div id="' + newid + '_prev" class="control-button control-button_addmenu clickable ' + disabledprev + '" style="background-image:url(' + prevscr + ')" Title=" ' + titleprev + '" > </div> ' +
            '</td>' +
            '<td  width = "10px" align="left" class="' + newid + '">' +
                '<div id="' + newid + '_next" class="control-button control-button_addmenu clickable ' + disablednext + '" style="background-image:url(' + nextscr + ')" Title=" ' + titlenext + '" > </div> ' +
            '</td>';
        },

        /**
         * Удаление точки объекта
         * @method deletepoint
         * @param number {Number} - Номер точки с 1
         * @param subject {Number} - Номер контура с 0
         * @param y {Number} - Координата экрана y
         */
        // ===============================================================
        deletepoint: function (number, subject, subaction) {
            if (number < 0 || !this.editobjects[0] || !this.editobjects[0].geometry) return;
            var closing = false;
            if (subaction == 'edit')
                closing = this.editobjects[0].geometry._isclosing(number, subject);

            // история
            this.history.add('delete', number, subject, null, this.editobjects[0].geometry.getpoint(number, subject))
            this.editobjects[0].geometry.deletepoint(number, subject);

            //// Проверить на пересечение
            //var ret = this.isIntersectionSubjectSubjects(null, subject);
            //if (ret >= 0) {
            //    w2alert(w2utils.lang("Edited site of a contour has crossed ") + ret.toString() + w2utils.lang(" contour of the edited object") + '. ' + w2utils.lang("Operation canceled") + '.');
            //    this.restorehistory('prev');
            //    return;
            //};

            // замкнуть объект, если он до этого был замкнут (полигон)
            if (closing)
                this.closeobject(true, subject);
            this.ischange(true);
        },

        /**
         * Удаление точек объекта
         * @method deletesegment
         * @param pointsnumber {Array} - массив из номеров трех точек (нумерация с 1)
         * @param subject {Number} - Номер контура с 0
         */
        // ===============================================================
        deletesegment: function (pointsnumber, subject, subaction) {
            if (!this.editobjects[0] || !this.editobjects[0].geometry ||
                !pointsnumber || pointsnumber instanceof Array == false || pointsnumber.length < 3)
                return;

            //console.log(pointsnumber);
            var newgeometry = this.editobjects[0].geometry.createcopy();
            var isdelete = this.editobjects[0].geometry.deletesegment([pointsnumber[0], pointsnumber[1], pointsnumber[2]], subject);

            if (isdelete) {
                if (this.editobjects[0].geometry.points.length < 1) {
                    this.editobjects[0].geometry = newgeometry.createcopy();
                    return;
                }
                //console.log(this.editobjects[0].geometry.points);

                // история
                this.history.add('all', null, 0, null, null, null, newgeometry, this.editobjects[0].geometry);
                this.ischange(true);
                this.updatedrawcontur(null, subaction);
            }
        },

        /**
         * смещение точек объекта
         * @method offsersegment
         * @param pointsnumber {Array} - массив из номеров трех точек (нумерация с 1)
         * @param subject {Number} - Номер контура с 0
         * @param deltageo{Array} - смещение в geo координатах
         */
        // ===============================================================
        offsetsegment: function (pointsnumber, subject, deltageo, subaction) {
            if (!this.editobjects[0] || !this.editobjects[0].geometry ||
                !pointsnumber || pointsnumber instanceof Array == false || pointsnumber.length < 3)
                return;

            var newgeometry = this.editobjects[0].geometry.createcopy();
            var isoffset = this.editobjects[0].geometry.offsetsegment(pointsnumber, subject, deltageo);

            if (isoffset) {
                if (this.editobjects[0].geometry.points.length < 1) {
                    this.editobjects[0].geometry = newgeometry.createcopy();
                    return;
                }
                //console.log(this.editobjects[0].geometry.points);

                // история
                this.history.add('all', null, 0, null, null, null, newgeometry, this.editobjects[0].geometry);
                this.ischange(true);
                this.updatedrawcontur(null, subaction);
            }
        },


        /**
         * обновление сегмента объекта
         * @method updatesegment
         * @param pointsnumber {Array} - массив из номеров трех точек (нумерация с 1)
         * @param subject {Number} - Номер контура с 0
         * @param mapgeometry (GWTK.mapgeometry) - объект новой геометрии
         */
        // ===============================================================
        updatesegment: function (pointsnumber, subject, mapgeometry, subaction) {
            if (!this.editobjects[0] || !this.editobjects[0].geometry ||
                !pointsnumber || pointsnumber instanceof Array == false || pointsnumber.length < 3)
                return;

            var newgeometry = this.editobjects[0].geometry.createcopy();
            var isupdate = this.editobjects[0].geometry.updatesegment(pointsnumber, subject, mapgeometry);

            if (isupdate) {
                if (this.editobjects[0].geometry.points.length < 1) {
                    this.editobjects[0].geometry = newgeometry.createcopy();
                    return;
                }

                // история
                this.history.add('all', null, 0, null, null, null, newgeometry, this.editobjects[0].geometry);
                this.ischange(true);
                this.updatedrawcontur(null, subaction);
            }
        },

        /**
         * Замыкание  объекта
         * @method closeobject
         * @param update {Boolean} - true  - заменяется первая точка на последнюю
         *                           false - добавляется последняя точка, равная первой
         * @param subjectnumber {Number} - Номер контура с 0
         */
        // ===============================================================
        closeobject: function (update, subjectnumber) {
            var ret = true,
                geometry = this.editobjects[0].geometry;

            if (!geometry) return ret;
            var count = geometry.count(subjectnumber);
            if (count == 0) return ret;

            var pointfirst = geometry.getpoint(1, subjectnumber), pointlast = geometry.getpoint(count, subjectnumber);
            if (!pointfirst || !pointlast) return;

            if (pointfirst.x == pointlast.x && pointfirst.y == pointlast.y)
                return ret;

            if (update) {
                ret = geometry.closeobject(update, subjectnumber);
            }
            else {
                ret = geometry.closeobject(update, subjectnumber);
                var number = geometry.count() - 1;
                this.history.add('insert', number, subjectnumber, null, null, geometry.getpoint(number + 1, subjectnumber));
            }

            if (ret)
                this.ischange(true);
            return ret;
        },

        /**
         * Смена направления цифрования
         * @method changedirection
         * @param subjectnumber {Number} - Номер контура с 0
         */
        // ===============================================================
        changedirection: function (subjectnumber, subaction) {
            if (subjectnumber < 0) { // надо определить текущий п/о
                subjectnumber = this.getsubjectnumber();
            }
            this.editobjects[0].geometry.changedirection(subjectnumber);
            this.history.add('changedirection', null, subjectnumber);
            this.ischange(true);
            this.updatedrawcontur(null, subaction);
        },

        /**
         * Запросить номер подобъекта
         * @method changedirection
         */
        // ===============================================================
        getsubjectnumberByMetrics: function () {
            return (this.metrics) ? this.metrics.subject : 0;
        },

        /**
         * ФУНКЦИИ РАБОТЫ С КОМПОНЕНТАМИ СОСТАВА СЛОЕВ, ВЫБОРА ОБЪЕКТОВ ИЗ ЛЕГЕНДЫ
         */

        initLayerList: function (parent, listid, nographic, align, width) {
            if (!parent) return;

            align = (!align) ? 'center' : align;
            width = (!width) ? '300px' : width;
            var label = (this.maplayersid.length > 1) ? w2utils.lang("Layers") : w2utils.lang("Layer");
            var strmaps =
             '<tr>' +
             '<td>' +
             '<div class="w2ui-field w2ui-span3">' +
             '<label style = "text-align:' + align + ' !important;">' + label + ':</label>' +
             '<div> ' +
             '<input type="list" id="' + listid + '" style="width: ' + width + ' !important;">' +
             '</div>' +
             '</div>' +
             '</td>' +
             '</tr>';

            var strpanel =
            strmaps +
             '<tr>' +
             '<td>' +
            '<div id="' + this.classifersliderId + this.maplayerid.layerid + '" class="resizable panel-mapcontent-container" style="width: 100%; overflow: auto; padding-right: 1px;"></div>' +
            '</td>' +
            '</tr>';

            $(parent).append('<table width="100%">' + strpanel + '</table>');

        },


        /**
         * Список слоев для компонента списка слоев (режим Создания)
         * @method setSelectMaps
         */
        // ===============================================================
        setSelectMaps: function (selector, nographic, fn_set, fn_change) {
            if (!selector || !fn_set || !fn_change) return;

            var list = $(selector);
            if (list && list.length > 0) {
                list.children().remove();
            }

            var maps = new Array(),
                layer, index = 0, _that = this;
            for (var i = 0; i < this.maplayersid.length; i++) {
                layer = this.map.tiles.getLayerByxId(this.maplayersid[i].layerid);
                if (!layer || (nographic && layer instanceof GWTK.graphicLayer) || !layer.visible)
                    continue;
                maps.push({ id: this.maplayersid[i].layerid, text: this.map.tiles.getLayerByxId(this.maplayersid[i].layerid).alias });
                if (this.maplayersid[i].layerid == this.maplayerid.layerid) {
                    index = i;
                    fn_set(layer);
                }
            }

            var ellistid = $(selector);
            if (!ellistid || ellistid.length == 0)
                return;

            ellistid.w2field('list',
                { items: maps, selected: maps[index] });

            function changeSelectMaps() {
                var obj = ellistid.data('selected');
                if (obj) {
                    // Сменить шаблон
                    _that.setTemplate(_that.map.tiles.getLayerByxId(obj.id));
                    // функция обратного вызова
                    fn_change(obj);
                }
            };

            ellistid.change(function (event) {
                changeSelectMaps();
            })

        },



        /**
         * ФУНКЦИИ ЗАВЕРШЕНИЯ ОПЕРАЦИЙ
         */

        /**
        * Сохранение изменений
        * @method save
        * @param regime {String} Режим сохранения изменений ('replace', 'delete' или 'create')
        */
        // ===============================================================
        save: function (regime) {
            $('#' + this.popupId).remove();

            if (regime == 'edit' || regime == 'move') regime = 'replace';
            var _that = this, count = this.editobjectsSave.length;

            var editobjectsSave = new Array();
            // Сохраним отредактированный объект вместе с объектами топологии
            for (var i = 0; i < count; i++) {
                editobjectsSave.push(this.editobjectsSave[i].editobject);
            }

            if (editobjectsSave.length > 0) {

                // Если автономный запуск, отослать триггер и закрыть задачу
                if (this.autonomous) {
                    var saveJSON = [];
                    for (var i = 0; i < count; i++) {
                        saveJSON.push(editobjectsSave[i].saveJSON());
                    }
                    this.closeAutonomous('save', saveJSON);
                    return;
                }

                // Заменим в списке выбранных объектов в точке
                var find;
                if (regime == 'replace') {
                    find = this.drawSelectFeatures.mapobjects.find(
                     function (element, index, array) {
                        if (element.gid == _that.editobjectsSave[0].editobject.gid) {
                            _that.drawSelectFeatures.mapobjects.splice(index, 1, _that.editobjectsSave[0].editobject.clone());
                            return true;
                        }
                    });
                }

                // Разберем массив объектов на массивы по идентификаторам слоев для сохранения
                this.editobjectsSaveByLayer.splice(0, this.editobjectsSaveByLayer.length);
                this.editobjectsSaveByLayer.push({ 'mli': editobjectsSave[0].maplayerid, 'save': false, 'mapobjects': [editobjectsSave[0]] });
                for (var i = 1; i < editobjectsSave.length; i++) {
                    find = this.editobjectsSaveByLayer.find(
                        function (element, index, array) {
                            if (element.mli == editobjectsSave[i].maplayerid) {
                                element.mapobjects.push(editobjectsSave[i]);
                                return true;
                            }
                        });
                    if (!find) {
                        this.editobjectsSaveByLayer.push(
                            { 'mli': editobjectsSave[i].maplayerid, 'save': false, 'mapobjects': [editobjectsSave[i]] });
                    }
                }

                // Сохраним все
                // Первый сохраняем всегда
                // Сохранение можно предотвратить, перехватив событие 'mapeditor' вместе с action 'saveMapobjects'
                // и установив параметр canSave в значение false. Пример такого события:
                // $(this.map.eventPane).on('mapeditor', function (event, data) {
                //     console.log(event.action);  // saveMapobjectssaveMapobjects
                //     console.log(event.objectsByLayer);  // список слоёв и изменённых объектов карты
                //     console.log(event.regime);  // Режим сохранения 'create' - создание, 'delete' - удаление, 'replace' - изменение
                //     data.canSaveToMap = true;   // разрешить сохранение объекта в карту на сервисе
                //     data.stopEdit = true;  // выйти из режима редактирования, если принято решение не сохранять объект
                // });
                var triggerData = {
                    canSaveToMap: true,
                    stopEdit: true
                };

                $(this.map.eventPane).trigger({
                    type: 'mapeditor',
                    action: 'saveMapobjects',
                    regime: regime,
                    objectsByLayer: this.editobjectsSaveByLayer,
                    sender: _that
                }, triggerData);

                for (var i = 0; i < this.editobjectsSaveByLayer.length; i++) {
                    //Если в списке отобранных объектов больше одного, то сохраняем как есть,
                    // иначе остальные объекты для сохранения обновляем
                    if (i > 0 && !this.isGroupProcess)
                        regime = 'replace';
                    if (triggerData.canSaveToMap) {
                        this.editobjectsSaveByLayer[i].mapobjects[0].save(regime, false, this.editobjectsSaveByLayer[i].mapobjects);
                    } else if (triggerData.stopEdit) {
                        this.editobjectsSaveByLayer[i].mapobjects[0].createtrigger(regime);
                    }
                }
            }
        },


        /**
        * Сделать клоны объектов для сохранения
        * @method setCloneForSave
        */
        // ===============================================================
        setCloneForSave: function () {
            this.editobjectsSave.splice(0, this.editobjectsSave.length);
            var i, k, cloneobj, error,
                len = (this.isGroupProcess) ? this.editobjects.length : ((this.editobjects.length) ? 1 : 0);

            for (i = 0; i < len; i++) {
                // Семантика
                if (this.rscsemantics) {
                    if (this.rscsemantics.save()) {
                        // Изменить семантики объекта
                        GWTK.MapEditorUtil.setsemanticmask(this.editobjects[i].semantic, this.rscsemantics._object);

                        // Если графический объект и старая версия редактора
                        this.setGraphicFromSemantic(this.editobjects[i]);
                    }
                }
                // сделаем клон объекта и отправим его на сохранение
                this.editobjectsSave.push({ 'editobject': this.editobjects[i].clone(), 'save': false });

                // Отрисуем
                var selectobject = this.editobjectsSave[i].editobject.clone();
                selectobject.saveJSON();
                if (!this.autonomous) {
                    this.drawSelectFeatures.drawobject(selectobject.gid, true, true);
                }
            };

            // Если топология и есть список измененных объектов
            if (this.topology && this.topology.topologyobjectsJSON.count() > 0) {
                // Сохранить объекты топологии
                this.topology.setCloneForSave(this.editobjectsSave);
            }

            this.message = '';
            // Контроль контуров и выдача сообщений
            for (var i = 0; i < this.editobjectsSave.length; i++) {
                // Ошибки геометрии
                errors = this.editobjectsSave[i].editobject.geometry.errors;
                if (errors.count() > 0) {
                    this.message += this.editobjectsSave[i].editobject.maplayername + ' ' + this.editobjectsSave[i].editobject.name + '<p>';
                    this.message += '<p>'  + w2utils.lang('Geometry') + ':' + '</p>';
                    for (var j = 0; j < errors.count(); j++) {
                        this.message += '</p><p>' + errors.get([j]).message;
                    }
                    this.message += '.</p>';
                }

                // Ошибки семантики при включеной закладке семантики
                if (this.isfunction(this.info, 'semantics')) {
                    errors = this.editobjectsSave[i].editobject.semantic.errors;
                    if (errors.count() > 0) {
                        this.message += this.editobjectsSave[i].editobject.maplayername + ' ' + this.editobjectsSave[i].editobject.name + '<p>';
                        this.message += '<p>' + w2utils.lang('Attributes') + ':' + '</p>';
                        for (var j = 0; j < errors.count() ; j++) {
                            this.message += '</p><p>' + errors.get([j]).message;
                        }
                        this.message += '.</p>';
                    }
                }

            }
        },

        /**
         * Установить графическое описание объекта графического слоя из семантики
         * @param editobject
         */
        setGraphicFromSemantic: function(editobject) {

            if ((this.layer && this.layer instanceof GWTK.graphicLayer) && this.param['oldversion'].toString() == '1' &&
                editobject && editobject.semantic && editobject.semantic.semantics &&
                editobject.key) {

                var key = editobject.key.toLowerCase();
                if (!editobject.graphic) {
                    editobject.graphic = GWTK.MapeditLegendGraphicControl.prototype.setOptionsFromStyle(key);
                }
                for (var i = 0; i < editobject.semantic.semantics.length; i++) {
                    var val = (editobject.semantic.semantics[i].type && editobject.semantic.semantics[i].type.toString() == '16') ? null : editobject.semantic.semantics[i].textvalue,
                        shortname = editobject.semantic.semantics[i].shortname;

                    switch (key) {
                        case 'line':
                            if (!val) {
                                val = this.findValueForGraphic(this.layer, editobject.semantic.semantics[i]['value'],'4');
                            }
                            if (val) {
                                if (editobject.graphic.options[0].options.hasOwnProperty(shortname)) {
                                    editobject.graphic.options[0].options[shortname] = val;
                                }
                            }
                            break;
                        case 'polygon':
                            var optionsFill = editobject.graphic.options.optionsFill,
                                optionsLine = editobject.graphic.options.optionsLine.options[0].options;
                            if (!val) {
                                val = this.findValueForGraphic(this.layer, editobject.semantic.semantics[i]['value'],'4');
                            }
                            if (val) {
                                if (optionsFill.hasOwnProperty(shortname)) {
                                    optionsFill[shortname] = val;
                                }
                                if (optionsLine.hasOwnProperty(shortname)) {
                                    optionsLine[shortname] = val;
                                }
                            }
                            break;

                        case 'title':
                            var optionsFill = editobject.graphic.options.optionsFill,
                                optionsFont = editobject.graphic.options.optionsFont;
                            if (!val) {
                                val = this.findValueForGraphic(this.layer, editobject.semantic.semantics[i]['value'],'12');
                            }
                            if (val) {
                                if (optionsFill.hasOwnProperty(shortname)) {
                                    optionsFill[shortname] = val;
                                }
                                if (optionsFont.hasOwnProperty(shortname)) {
                                    optionsFont[shortname] = val;
                                }
                                // Найдем семантику текста
                                if (shortname == "text") {
                                    editobject.geometry.setText(val);
                                }
                            }
                            break;

                        case 'point':
                            var optionsFill = editobject.graphic.options.optionsFill,
                                optionsMarker = editobject.graphic.options.optionsMarker,
                                optionsLine = editobject.graphic.options.optionsLine.options[0].options;

                            if (!val) {
                                val = this.findValueForGraphic(this.layer, editobject.semantic.semantics[i]['value'],'7');
                            }
                            if (val) {
                                if (optionsFill.hasOwnProperty(shortname)) {
                                    optionsFill[shortname] = val;
                                }
                                if (shortname == "marker"){
                                    optionsMarker["path"] = val;
                                }
                                if (optionsLine.hasOwnProperty(shortname)) {
                                    optionsLine[shortname] = val;
                                }
                            }
                           break;

                    }
                }
            }
        },

        /**
         * Найти значение семантики тип классификатор для объекта графического слоя
         * @param layer
         * @param editobject
         * @param code
         * @returns {null|*}
         */
        findValueForGraphic: function(layer, semantic_value,  code) {
            var val = null;
            if (layer && code && semantic_value) {
                var semantics = layer.getSemanticWithList();
                for (var i = 0; i < semantics.length; i++) {
                    if (semantics[i]['code'] == code) {
                        if (semantics[i].reference) {
                            for (var j = 0; j < semantics[i].reference.length; j++) {
                                if (semantics[i].reference[j]['value'] == semantic_value) {
                                    val = semantics[i].reference[j]['attr'];
                                    return val;
                                }
                            }
                        }
                    }
                }
            }

            return val;
        },

        /**
         * ФУНКЦИИ ОБНОВЛЕНИЯ КООРДИНАТ ТОЧЕК СОЗДАВАЕМОГО/РЕДАКТИРУЕМОГО ОБЪЕКТА
         */

        /**
         * Запросить номер редактируемого контура объекта
         * @method getsubjectnumber
         */
        // ===============================================================
        getsubjectnumber: function () {
            var number = 0
            if (this.drawobject) {
                var el = this.drawobject.getpointElemLast();
                if (el)
                    number = this.drawobject.getsubjectnumber(el.id);
            }
            return number;
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

            if (!div || !ui)
                return;

            var geometry = this.editobjects[0].geometry;
            if (!geometry) return;

            //// Сместим относительно родительского окна
            //var rect = this.drawpanel.getBoundingClientRect();
            //ui.position.left -= rect.left;
            //ui.position.top -= rect.top;

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

            this.updateObjectPoint(number, subjectnumber, geo, insert);
        },


        /**
         * Обновление координат точки объекта
         * @method updateObjectPoint
         * @param number {Number} Номер точки
         * @param subject {Number} Номер подобъекта
         * @param pointgeo (GWTK.Point) - геодезические координаты точки
         * @param insert {Boolean} признак вставки новой точки (для серединных точек), иначе обновление существующей
         * @param currtaskaction {String} - текущий режим обработки объекта ('create' или 'edit')
         */
        // ===============================================================
        updateObjectPoint: function (number, subjectnumber, geo, insert, currtaskaction) {

            var geometry = this.editobjects[0].geometry;
            if (!geometry || !geo) return;

            // Если работали с редактированием общих точек
            var subaction = (this.map && this.map.taskManager && this.map.taskManager._action) ? this.map.taskManager._action.name : null;
            if (subaction == 'edit') {
                var topojson = [null, null];
                if (this.map.taskManager._action.buttonmethod_edit == '.ededmethod_edallpoint') {
                    // Добавить в историю еще и топологию
                    topojson = this.map.taskManager._action.topojson;
                }
            }

            if (insert) {// вставить точку
                geometry.insertpoint3D(geo[0], geo[1], null, number + 1, subjectnumber);
                // история
                this.history.add('insert', number, subjectnumber, null, null, geometry.getpoint(number + 1, subjectnumber), null, null, topojson[0], topojson[1]);
            }
            else {      // обновить точку

                // история
                var point_old = geometry.getpoint(number + 1, subjectnumber);
                var pointnew = new GWTK.Point3D(geo[0], geo[1], point_old.h)
                geometry.updatepoint(number + 1, subjectnumber, pointnew);

                if (this.editobjects[0].spatialposition == "polygon" && currtaskaction != 'create') {
                    var count = geometry.count(subjectnumber);
                    if (number == count - 1) {
                        geometry.updatepoint(1, subjectnumber, pointnew);
                    }
                    else {
                        if (number == 0)
                            geometry.updatepoint(count, subjectnumber, pointnew);
                    }
                }
                // история
                if (topojson) {
                    this.history.add('update', number, subjectnumber, null, point_old, pointnew, null, null, topojson[0], topojson[1]);
                }
                else {
                    this.history.add('update', number, subjectnumber, null, point_old, pointnew);
                }
            }

            //// Проверить на пересечение
            //var ret = this.isIntersectionSubjectSubjects(null, subjectnumber);
            //if (ret >= 0) {
            //    w2alert(w2utils.lang("Edited site of a contour has crossed ") + ret.toString() + w2utils.lang(" contour of the edited object") + '. ' + w2utils.lang("Operation canceled") + '.');
            //    this.restorehistory('prev');
            //    return;
            //};

            this.ischange(true);
            this.updatedrawcontur();

            if (this.map.taskManager._action)
                this.map.taskManager._action.topojson = null;
        },


        /**
         * Смещение всех точек объекта
         * @method offsetpoints
         * @param dx {Number} Смещение по оси х
         * @param dy {Number} Смещение по оси y
         * @param history {Boolean} Сохранить информацию в историю
         */
        // ===============================================================
        offsetpoints: function (dx, dy, history, subaction) {

            if (subaction != 'create')  // если редактирование (перемещение объекта)
                this.restoredrawpanel();
            var el, point, index = 0;

            // Если текущая задача - перемещение объектов
            if (this.currentTask == 'move') { // && this.isGroupProcess) {
                var coord, contours;
                for (var i = 0; i < this.editobjects.length; i++) {
                    contours = this.drawobject.svgDraw.getCoords_pixel_byId(this.drawobject.svgDraw.getId(this.editobjects[i].gid));
                    if (contours && contours.length > 0) {
                        index = i;
                        break;
                    }
                }
                if (!contours || contours.length == 0)
                    return;

                // Если объект точечный, то берем середину
                // иначе первую точку
                for (var i = 0; i < contours.length; i++) { // контура
                    coord = contours[i];
                    if (coord.length == 0)
                        continue;
                    if (coord[0].length > 1) {
                        if (this.editobjects[i].spatialposition.indexOf('point') >= 0) {
                            if (coord[2] && coord[2].length > 1) {
                                point = new GWTK.point(
                                    parseFloat(coord[0][0]) + (parseFloat(coord[2][0]) - parseFloat(coord[0][0]))/2,
                                    parseFloat(coord[0][1]) + (parseFloat(coord[2][1]) - parseFloat(coord[0][1]))/2)
                            }
                        }
                        else {
                            point = new GWTK.point(parseFloat(coord[0][0]), parseFloat(coord[0][1]));
                        }
                    }
                    if (point)  break;
                }
            }
            else {
                el = this.drawobject.getpointElemByNumber(0, 0);
                if (!el) return;
                point = this.drawobject.getpositionByPointId(el.id);
            }
            if (!point) return;

            point = GWTK.point(point.x + dx, point.y + dy);
            var coord = this.map.tiles.getLayersPointProjected(point);
            var geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x),
                geopoint;
            var geopoint = this.editobjects[index].geometry.getpoint(1, 0);
            var delta = [geo[0] - geopoint.x, geo[1] - geopoint.y];
            if (geopoint) {
                for (var i = 0; i < this.editobjects.length; i++) {
                    this.editobjects[i].geometry.offsetpoints(delta);
                }
            }

            this.ischange(true);

            // история
            if (history)
                this.history.add('offset', null, null, GWTK.point(dx, dy), null);

            if (subaction != 'create')  // если редактирование (перемещение объекта)
                this.updatedrawcontur(null, 'edit');
        },

        /**
         * Добавить точку в геодезических координатах в объект
         * @method addpointgeo
         * @param b {Float} Широта
         * @param l {Float} Долгота
         * @param h {Float} Высота
         * @param subjectnumber {Number} Номер контура с 0
         * @param history {Boolean} Сохранить информацию в историю
         */
        // ===============================================================
        addpointgeo: function (b, l, h, subjectnumber, history) {
            if (!b || !l) return;

            var point = new GWTK.Point3D(b, l, h);
            subjectnumber = (subjectnumber) ? subjectnumber : 0;
            var number = this.editobjects[0].geometry.count(subjectnumber);
            this.editobjects[0].geometry.appendpoint3D(point.x, point.y, null, subjectnumber);
            // история
            if (history)
                this.history.add('insert', number, subjectnumber, null, null, point);

            this.ischange(true);

            // Занести метрику в окно с метрикой объекта
            if (this.metrics)
                this.metrics.creategrid(this.editobjects[0].geometry.saveJSON(true));

            return number;
        },

        /**
         * Добавить точку в координатах экрана в объект
         * @method addpoint
         * @param x {Number} координата по оси х
         * @param y {Number} координата по оси y
         * @param h {Float} Высота
         * @param subjectnumber {Number} Номер контура с 0
         * @param history {Boolean} Сохранить информацию в историю
         , @param nooffset {Boolean} Не пересчитывать смещение координат
         */
        // ===============================================================
        addpoint: function (x, y, h, subjectnumber, history, nooffset) {
            if (!this.editobjects || this.editobjects.length === 0 || !this.editobjects[0].geometry)
                return;

            // Определим смещение относительно начала экрана
            var geo = this.topology.pixel2geoOffset(x, y, nooffset);
            if (!geo) return;
            return this.addpointgeo(geo[0], geo[1], h, subjectnumber, history);
        },

        /**
          * Обновление данных в объекте selectedFeatures
          * @method updateselectedFeatures
          * @param regime {String}  режим ('delete', 'replace')
          * @param mapobjects (Array)  -  массив объектов editobjectsSave
          */
        // ===============================================================
        updateselectedFeatures: function (regime, mapobjects, selectedFeatures) {
            var len;
            if (!mapobjects || ((len = mapobjects.length) == 0) || !selectedFeatures)
                return;
            for (var i = 0; i < len; i++) {
                if (regime == 'delete')
                    selectedFeatures.remove(mapobjects[i]);
                else
                    selectedFeatures.add(mapobjects[i]);
            }
        },



        ///**
        // * ОБЪЕКТЫ ГРАФИЧЕСКОГО СЛОЯ
        // */


        /**
         * ПАНЕЛЬ СПОСОБОВ СОЗДАНИЯ И РЕДАКТИРОВАНИЯ
         */

        /**
         * Активизация определенного способа создания или редактирования с отключением остальных
         * @method checkmethod
         * @param target {Element} Элемент кнопки, которую нужно сделать активной
         */
        // ===============================================================
        checkmethod: function (target) {
            GWTK.DomUtil.removeActiveElement('.control-button-edit-method');
            GWTK.DomUtil.setActiveElement(target);
        },


        /**
         * ФУНКЦИИ ЗАПРОСОВ НА НАЛИЧИЕ, РАЗРЕШЕНИЕ ...
         */

        /**
          * Это обработчик Редактора карты?
          * @method isOurAction
          * @returns {Boolean} true - процесс создания или редактировавния активен
          */
        // ===============================================================
        isOurAction: function (action) {
            if (!action || !action.task)
                return;
            return this.isOurTask(action.task);
        },

        /**
          * Это задача Редактора карты?
          * @method isOurTask
          * @returns {Boolean} true - процесс создания или редактирования активен
          */
        // ===============================================================
        isOurTask: function (task) {
            if (!task) return;
            if (task instanceof GWTK.mapeditorTask ||
                task instanceof GWTK.MapeditorCreatingTask ||
                task instanceof GWTK.mapeditorEditingTask ||
                task instanceof GWTK.mapeditorMovingTask ||
                task instanceof GWTK.mapeditorMergingTask
                )
                return true;
        },


        // /**
        //  * Запрос активности текщего процесса (создания или редактирования)
        //  * @method isActionProcess
        //  * @returns {Boolean} true - процесс создания или редактировавния активен
        //  */
        // // ===============================================================
        // isActionProcess: function () {
        //
        //     // Если создание и есть точки
        //     var ispoints = (this.editobjects[0] && this.editobjects[0].geometry && this.editobjects[0].geometry.count() > 0);
        //     if (!ispoints && this.history.count() == 0)
        //         return false;
        //
        //     if (this.currentTask == 'create') {
        //             if (this.history.isgeometry())
        //             return true;
        //     }
        //     else {
        //         if (this.history.count() > 0 || ispoints)
        //             return true;
        //     }
        //
        //     return false;
        // },

        /**
         * Входит ли слой в список редактируемых
         * @method iseditinglayer
         * @param layerid {String} Идентификатор слоя
         * @returns {Object} Найденный слой
         */
        // ===============================================================
        iseditinglayer: function (layerid) {
            layerid = (layerid ? layerid : '').toString();
            return this.maplayersid.find(
                function (element, index, array) {
                    if (element.layerid && element.layerid.toLowerCase() === layerid.toLowerCase())
                        return element;
                });
        },

        /**
         * Существует ли функцию редактора карты
         * @method isfunction
         * @param name {String} Имя функции
         * @returns {Object} Найденная функция
         */
        // ===============================================================
        isfunction: function (mass, name) {
            if (mass) {
                return mass.find(
                function (element, index, array) {
                    if (element.toLowerCase() == name.toLowerCase())
                        return element;
                });
            }
         },


        /**
         * Имеется ли объект в списке редактируемых объектов редактора
         * @method iseditinglayer_object
         * @param gid {String} Идентификатор объекта
         * @returns {Object} Найденный список объектов слоя
        */
        // ===============================================================
 /*       iseditinglayer_object: function (gid, code, key) {
            if (!gid) return;
            var find, layers = this.map.tiles.getLayersByGmlId(gid);
            if (!layers || layers.length == 0) return;
            var edlayer = this.iseditinglayer(layers[i].options.id);
            // Проверим маски объектов
            if (edlayer) {
                var edobjects = GWTK.MapEditorUtil.iseditingobjects(edlayer);
                // Если есть, то проверить, входят ли наш
                if (edobjects) {
                    if (code || key)
                    // Определить code нашего объекта
                        return GWTK.MapEditorUtil.iseditingobject(edobjects, code, key);
                }
                else
                    return edlayer;
            }
            else {
                return edlayer;
            }
        },
*/
        /**
         * Имеется ли объект в списке редактируемых объектов редактора
         * @method iseditinglayer_object
         * @param gid {String} Идентификатор объекта
         * @returns {Object} Найденный список объектов слоя
         */
        // ===============================================================
        iseditinglayer_object: function (gid, code, key) {
            if (!gid) return;
            var find, layers = this.map.tiles.getLayersByGmlId(gid);
            if (!layers || layers.length == 0) return;
            for(var i = 0; i < layers.length; i++) {
                var edlayer = this.iseditinglayer(layers[i].options.id);
                // Проверим маски объектов
                if (edlayer) {
                    find = edlayer;
                    var edobjects = GWTK.MapEditorUtil.iseditingobjects(edlayer);
                    // Если есть, то проверить, входят ли наш
                    if (edobjects) {
                        if (code || key)
                        // Определить code нашего объекта
                            return GWTK.MapEditorUtil.iseditingobject(edobjects, code, key);
                    }
                    else
                        return edlayer;
                }
            }
            return find;
        },



        /**
        * Проверка на пересечение контуров
        * @method isIntersectionSubjectSubjects
        * @param subject - номер подобъекта (c 0)
        * @param ismessage - вывод сообщения
        * @return int -  номер пересекаемого контура или -1
        */
        // ===============================================================
        isIntersectionSubjectSubjects: function (editobject, subjectnumber) {
            var ret = -1;
            if (!editobject) {
                if (!this.editobjects || this.editobjects.length == 0 || subjectnumber < 0)
                    return ret;
                editobject = this.editobjects[0];
            }
            // Проверим на пересечение контуров
            if (editobject.spatialposition.indexOf('polygon') >= 0)
                return editobject.geometry.isIntersectionSubjectSubjects(subjectnumber);
            return -1;
        },

         /**
         * СОБЫТИЯ РЕДАКТОРА КАРТЫ
         */


        /**
         * Документ загружен
         * @method  onDocumentReady
         * @param e {Object} Событие
         */
        // ===============================================================
        onDocumentReady: function (e) {

            // Размеры панели
            this.cssExtMax = { 'width': this.getmaxWidth(), 'height': this.getmaxHeight() };

            // Установим растягиваемую панель
            this.setResizablePane();

            // Прочитаем куки
            this._readedCookie();

            var width = $("#images img").attr("width");
            var height = $("#images img").attr("height");

            var _that = this, action;
            // Создание
            $('#' + this.button_ids.create).click(function (event) {
                action = $(event.target).attr("name");

                if (_that.mapeditorCreatingTask) {
                    var taskservice = _that.mapeditorCreatingTask.taskservice;

                    // Если задача создания, то автоматом сохранить и стартовать еще раз
                    _that.destroyActiveTask(_that.currentTask);

                    // Если задача была запущена не от своего режима, то открыть заново
                    if (taskservice) {
                        // удалить сервисную задачу
                        _that.destroyActiveTask(action);
                        _that.currentTask = _that.setActiveTask(action);
                    }
                }
                else {
                    // Закрыть текущую и открыть создание
                    _that.destroyActiveTask(_that.currentTask);
                    _that.currentTask = _that.setActiveTask(action);
                }

            });

            // Редактирование
            $('#' + this.button_ids.edit).click(function (event) {
                // Если задача запущена, то закрыть
                if (_that.mapeditorEditingTask) {
                    _that.destroyActiveTask(_that.currentTask);
                }
                else {
                    // Закрыть активную задачу
                    _that.destroyActiveTask(_that.currentTask);
                    _that.currentTask = _that.setActiveTask($(event.target).attr("name"));
                }
            });

            // Перемещение
            $('#' + this.button_ids.move).click(function (event) {
                if (_that.isGroupDeleteProcess)  // диалог группового удаления объектов
                    return;

                // Если задача запущена, то закрыть
                if (_that.mapeditorMovingTask) {
                    _that.destroyActiveTask(_that.currentTask);
                 }
                else {
                    // Закрыть активную задачу
                    _that.destroyActiveTask(_that.currentTask);
                    _that.currentTask = _that.setActiveTask($(event.target).attr("name"));
                    _that.mapeditorMovingTask.set();
                }
            });

            // Сшивка
            $('#' + this.button_ids.merge).click(function (event) {
                if (_that.isGroupDeleteProcess)  // диалог группового удаления объектов
                    return;

                // Если задача запущена, то закрыть
                if (_that.mapeditorMergingTask) {
                    _that.destroyActiveTask(_that.currentTask);
                }
                else {
                    // Закрыть активную задачу
                    _that.destroyActiveTask(_that.currentTask);
                    _that.currentTask = _that.setActiveTask($(event.target).attr("name"));
                    _that.mapeditorMergingTask.set();
                }
            });

            // Удаление
            $('#' + this.button_ids['delete']).click(function (event) {
                if (_that.isGroupDeleteProcess)  // заглушка пока все групповые операции не написаны
                    return;

                if (GWTK.DomUtil.isActiveElement(event.target)) {

                    // Сбросим класс выделения объектов  редактора
                    _that.drawSelectFeatures.clear();

                    _that.map.closeAction();
                    _that.currentTask = null;
                    $('#' + _that.objectlistId).children().remove();
                    _that.updatetitle(w2utils.lang("Map editor"));
                }
                else {
                    // Закрыть активную задачу
                    _that.destroyActiveTask(_that.currentTask);
                    _that.currentTask = _that.setActiveTask($(event.target).attr("name"));
                }
            });

            // Параметры редактора
            $('#' + this.button_ids.setting).click(this.onInitOptions);

            // события кнопок отката транзакций
            $('.mapeditingAddmenu_transaction').click(
                function (event) {
                    if (!event.target || !event.target.id)
                        return;
                    if (event.target.id.indexOf('_prev') >= 0)
                        _that.restoreTransaction('UNDOLASTACTION', event.target.title);
                    else
                        _that.restoreTransaction('REDOLASTACTION', event.target.title);
                });

            //// Отлов нажатия клавиш
            //isCtrl = false;
        },

        /**
          * Инициализация кнопки "Параметры редактора" для сопряжения и топологии
          * @method  onInitOptions
          * @param event {Object} Событие
          */
        // ===============================================================
        onInitOptions: function (event) {

            var prefix = 'edsettig_', transaction = "", servicerecord = "",
                checked = (this.options.transaction && this.options.transaction.servicerecord) ? " checked " : "",
                autosavechecked = (this.options.autosave) ? " checked " : "",
                objectselectionInPoint = (this.options.objectselectionInPoint) ? " checked " : "",
                captureVirtualPoints = (this.options.captureVirtualPoints) ? " checked " : "",
                capturePoints = (this.options.capturePoints) ? " checked " : "",
                layerlistid = prefix + 'maplist_' + this.id,
                divlayerlistid = 'div' + layerlistid,

                autosave = (this.autonomous) ? '' :
                '<div class="w2ui-field"  style="width:250px;">' +
                '<label style="width:180px; white-space: normal;text-align:left;margin-top:-3px;">' + w2utils.lang("Automatically save created objects") + ':</label>' +
                '<div><input id="' + prefix + 'autosave_' + this.id + '" type="checkbox" ' + autosavechecked + ' style="margin-left: 5px; width:50px; float:right;" ' +
                '></div>' +
            '</div>';

            var htmlsetting =
            '<div  id="' + prefix + this.id + '" style="padding: 5px" >' +
                '<div  id="' + prefix + 'header_' + this.id + '" style="padding: 5px" >' +
                '</div>' +
                '<div class="w2ui-field"  style="width:250px;">' +
                    '<label style="width:auto;">' + w2utils.lang("Limit (meters)") + ':</label>' +
                    '<div><input id="' + prefix + 'limit_' + this.id + '"  value = "' + this.options.topology.limit + '" style="margin-left: 5px; width:50px; float:right;" ' +
                    '></div>' +
                '</div>' +
                '<div class="w2ui-field"  style="width:250px;">' +
                   '<label style="width:auto;">' + w2utils.lang("Capture radius (meters)") + ':</label>' +
                   '<div><input id="' + prefix + 'captureradius_' + this.id + '"  value = "' + this.options.topology.captureradius + '" style="margin-left: 5px; width:50px; float:right;" ' +
                   '></div>' +
            '</div>' +
            '<div class="w2ui-field"  style="width:250px;">' +
                '<label style="width:180px; white-space: normal;text-align:left;margin-top:-3px;">' + w2utils.lang("Select an object by specifying a point on the map") + ':</label>' +
                '<div><input id="' + prefix + 'objectselectionInPoint_' + this.id + '" type="checkbox" ' + objectselectionInPoint + ' style="margin-left: 5px; width:50px; float:right;" ' +
                '></div>' +
            '</div>' +
            '<div class="w2ui-field"  style="width:250px;">' +
                '<label style="width:180px; white-space: normal;text-align:left;margin-top:-3px;">' + w2utils.lang("Capturing points") + ':</label>' +
                '<div><input id="' + prefix + 'capturePoints_' + this.id + '" type="checkbox" ' + capturePoints + ' style="margin-left: 5px; width:50px; float:right;" ' +
                '></div>' +
            '</div>' +
            '<div class="w2ui-field"  style="width:250px;">' +
                '<label style="width:180px; white-space: normal;text-align:left;margin-top:-3px;">' + w2utils.lang("Capturing lines") + ':</label>' +
                '<div><input id="' + prefix + 'captureVirtualPoints_' + this.id + '" type="checkbox" ' + captureVirtualPoints + ' style="margin-left: 5px; width:50px; float:right;" ' +
                '></div>' +
            '</div>'
            + autosave;

            if (this.param.transaction && this.param.transaction != "") {
                transaction =
                    '<hr  align="center" width="100%" size="1" color="#868b92" style="margin-top:10px;"/>' + // size="2" color="#868b92"
                    '<div class="routeFilesName" style="margin-top:5px;">' +
                    '<table style="width:100%; padding-right: 3px;" >' +
                    '<tr>' +
                    '<td align="left" width="80%">' + w2utils.lang("The transaction log") +
                    '</td>' +
                    '<td align="right" >' +
                    '<div id="' + prefix + 'openLog_' + this.id + '" class="control-button-edit-method control-button-edit sidebar-node-open-button clickable" Title="' + w2utils.lang("Open") +
                    '"></div> ' +  // открыть
                    '</td>' +
                    //'<td align="right" >' +
                    //'<div id="' + prefix + 'saveLog_' + this.id + '" class="control-button-edit-method control-button-edit sidebar-node-save-button clickable" Title="' + w2utils.lang("Save") +
                    //'"></div> ' +  // Загрузить
                    //'</td>' +
                    '</tr>' +
                    '</table>' +
                    '</div>' +
                    '<div id="' + divlayerlistid + '">' +
                    '</div>' +
            '<div class="w2ui-field"  style="width:250px;">' +
               '<label style="width:auto;">' + w2utils.lang("Start date") + ':</label>' +
               '<div><input  id="' + prefix + 'startdate_' + this.id + '" type="eu-date" value = "' + this.options.transaction.startdate.datestring + '" style="margin-left: 5px; width:100px; float:right;" ' +
               '></div>' +
            '</div>' +
            '<div class="w2ui-field"  style="width:250px;">' +
               '<label style="width:auto;">' + w2utils.lang("End date") + ':</label>' +
               '<div><input id="' + prefix + 'enddate_' + this.id + '" type="eu-date" value = "' + this.options.transaction.enddate.datestring + '" style="margin-left: 5px; width:100px; float:right;" ' +
               '></div>' +
            '</div>' +
            '<div class="w2ui-field"  style="width:250px;">' +
               '<label style="width:auto;">' + w2utils.lang("Conclusion service records") + ':</label>' +
               '<div><input id="' + prefix + 'servicerecord_' + this.id + '" type="checkbox" ' + checked + ' style="margin-left: 5px; width:50px; float:right;" ' +
               '></div>' +
            '</div>';
            }

            htmlsetting += transaction + '</div>';

            var _that = this;
            $('#' + this.button_ids.setting).w2overlay({
                name: _that.button_ids.setting,
                html: htmlsetting,
                align: "none",
                onShow: function () {
                    // Заголовок
                    $('#' + prefix + 'header_' + _that.id)[0].appendChild(GWTK.Util.createHeaderForComponent({
                        map: _that.map,
                        //name: w2utils.lang("Options"),
                        callback: function () {
                            $('#w2ui-overlay-' + _that.button_ids.setting).remove();
                        }
                    }));

                    $('#edsettig_limit_' + _that.id).w2field('float', { precision: 3, min: 0 });
                    $('#edsettig_captureradius_' + _that.id).w2field('float', { precision: 3, min: 0 });
                    $('input[type=eu-date]').w2field('date', { format: 'dd.mm.yyyy' });

                    // Назначить события
                    $('#' + prefix + 'limit_' + _that.id).on('keyup', function () {
                        _that.options.topology.limit = $(this).val();
                    });
                    $('#' + prefix + 'captureradius_' + _that.id).on('keyup', function () {
                        _that.options.topology.captureradius = $(this).val();
                    });
                    $('#' + prefix + 'openLog_' + _that.id).on('click', function () {
                        _that.openLog();
                    });
                    $('#' + prefix + 'saveLog_' + _that.id).on('click', function () {
                        _that.saveLogToFile();
                    });
                    $('#' + prefix + 'startdate_' + _that.id).on('change', function () {
                        _that.options.transaction.startdate.datestring = $(this).val(); _that.settransactiondate('start');
                    });
                    $('#' + prefix + 'enddate_' + _that.id).on('change', function () {
                        _that.options.transaction.enddate.datestring = $(this).val(); _that.settransactiondate('end');
                    });
                    $('#' + prefix + 'servicerecord_' + _that.id).on('change', function () {
                        _that.options.transaction.servicerecord = (this.checked) ? 1 : 0;
                    });
                    $('#' + prefix + 'autosave_' + _that.id).on('change', function () {
                        _that.options.autosave = (this.checked) ? 1 : 0;
                    });
                    $('#' + prefix + 'objectselectionInPoint_' + _that.id).on('change', function () {
                        _that.options.objectselectionInPoint = (this.checked) ? 1 : 0;
                    });
                    $('#' + prefix + 'capturePoints_' + _that.id).on('change', function () {
                        _that.options.capturePoints = (this.checked) ? 1 : 0;
                    });
                    $('#' + prefix + 'captureVirtualPoints_' + _that.id).on('change', function () {
                        _that.options.captureVirtualPoints = (this.checked) ? 1 : 0;
                    });

                    var panel = $('#' + divlayerlistid);
                    if (panel && panel.length > 0) {
                        _that.initLayerList(panel[0], layerlistid, true, 'left', '175px');

                        // Установить список карт
                        var _ed = _that;
                        _that.setSelectMaps('#' + layerlistid, true,
                            function (layer) {
                                _ed.options.transaction.maplayerid = layer.xId;
                            },
                            function (obj) {
                                // Только на момент отката. Потом будет текущий слой карты
                                _ed.options.transaction.maplayerid = obj.id;
                            });
                    }
                },
                onHide: function () {
                    _that._writeedCookie();
                }
            });
        },


        /**
         * Прерывание цепочки событий
         * @method  onstopPropagation
         * @param event {Object} Событие
         */
        // ===============================================================
        onstopPropagation: function (event) {
            event.stopPropagation();
            return false;
        },


        /**
         * Событие при обновлении объекта на сервере
         * @method  onUpdateMapObject
         * @param event {Object} Событие
         */
        // ===============================================================
        onUpdateMapObject: function (event) {

            var mapobject = event.mapobject;

            if (!event.error) {
                // Если это был графический объект, то обновить его вид в classifier
                if (this.layer && event.regime != 'delete' && mapobject)
                    this.layer.classifier.updatesemanticsobject(mapobject.code, mapobject.semantic.semantics);
            }
            else {
                w2alert(w2utils.lang("Failed to save the object."));
            }

            // Проверим все ли слои на сохранение обработаны
            var _that = this,
                find = this.editobjectsSaveByLayer.find(
                function (element, index, array) {
                    if (mapobject && mapobject.maplayerid && element.mli == mapobject.maplayerid && !element.save) {
                        if (event.message)
                            console.log(event.message);
                        else
                            console.log('Сохранены объекты слоя ' + mapobject.maplayerid);
                        _that.editobjectsSaveByLayer[index].save = true;

                        // Обновим данные в глобальном объекте выделенных объектоа
                        _that.updateselectedFeatures(event.regime, _that.editobjectsSaveByLayer[index].mapobjects, _that.map.objectManager.selectedFeatures);
                        return element;
                    }
                });

            // Просто выведем сообщение
            if (!find) {
                console.log(event.message);
            }

            // Пройдемся в поисках несохраненных слоев
            find = this.editobjectsSaveByLayer.find(
            function (element, index, array) {
                if (!element.save) {
                    return true;
                }
            });
            if (find) {
                //console.log('Осталось сохранить' + this.editobjectsSaveByLayer.length);
                return;
            }

            // Очистим список объектов для сохранения
            w2utils.unlock($(this.map.mapPane));
            this.editobjectsSave.splice(0, this.editobjectsSave.length);

            // Запомним слой последней операции на сервере
            if (this.layer && this.layer instanceof GWTK.graphicLayer == false)
                this.options.transaction.maplayerid = this.layer.xId;

            // Перерисовать карту
            this.refreshmap();

            this.clear();
            if (this.topology) {
                this.topology.isUpdate = true;
            }

            // Восстановить данные после запроса о сохранении
            this.restoreAfterConfirm();

            this.isGroupDeleteProcess = false;
            this.isGroupProcess = false;

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
            if (which === 89 && ctrlKey) {      // Ctrl+Z
                this.restorehistory('next');
            }
            else if (which === 90 && ctrlKey) { // ctrl+Y
                this.restorehistory('prev');
            }
            else if (which === 83 && ctrlKey) { // ctrl+S  сохранение
                $('#' + this.button_ids.save).click();
            }
            else if (which === 13 && ctrlKey) {
                this.onCtrlLeft(event);
            }
            else if (which === 8) { // backspace
                if (event.originalEvent.target.id == '')
                    this.restorehistory('prev');
                else
                    return;
            }
            else if (which == 27) {                  // Esc
                this.onCtrlRight(event);
            }
            else {
                 return;
            }

            event.originalEvent.preventDefault();
            event.originalEvent.stopPropagation();
            event.preventDefault();
            event.stopPropagation();

        },

        /**
       * Событие нажатия левой клавиши мыши
       * @method  onCtrlLeft
       * @param event {Object} Событие
       */
        // ===============================================================
        onCtrlLeft: function (event) {
            if (this.mapeditorCreatingTask)
                this.mapeditorCreatingTask.complete();
        },

        /**
        * Событие нажатия правой клавиши мыши
        * @method  onCtrlRight
        * @param event {Object} Событие
        */
        // ===============================================================
        onCtrlRight: function (event) {
            if (this.extend) { // Если создание подобъекта
                $('.edcrmethod_back').click();
            }
            else {
                this.canClose(); // Если Активен наш обработчик, запрос на сохранение изменений
            }
            $('#' + this.popupId).remove();
        },

        /**
         * Отмена контекстного меню
         * @method  onContextMenu
         * @param event {Object} Событие
         */
        // ===============================================================
        onContextMenu: function (e) {
            //onContextMenu
            e.preventDefault();
            e.stopPropagation();
            return false;
        },

        /**
         * Событие изменения видимости слоя
         * @method  onVisibilityChanged
         * @param event {Object} Событие
         */
        // ===============================================================
        onVisibilityChanged: function (event) {
            if (!event || !event.maplayer) return;

            this.layerlistchanged(event.maplayer.id, (event.maplayer.visible) ? 'add' : 'remove', true);
        },


        /**
        * Событие изменения семантических характеристик
        * @method  onChangeDataSemantics
        * @param event {Object} Событие
        */
        // ===============================================================
        onChangeDataSemantics: function (event) {
            if (!event || !event.dataobject || event.dataobject.length == 0)
                return;
            this.ischange(true);
            this.history.addsem(event.dataobject[0].type, event.dataobject);
            this.addmenu();
        },

        /**
        * Событие изменения метрических характеристик
        * @method  onChangeDataMetrics
        * @param event {Object} Событие
        */
        // ===============================================================
        onChangeDataMetrics: function (event) {
            var ip = event.dataobject.point;
            var is = event.dataobject.subject;
            var record = event.dataobject.record;
            var format = event.dataobject.format;
            var point, noupdatemetrics;
            switch (format) {
                case 'BL':
                    if (record)
                        point = new GWTK.Point3D(parseFloat(record.B), parseFloat(record.L), parseFloat(record.H));
                    break;
            };
            switch (event.regime) {
                case 'change':
                    if (!point) return;
                    var point_old = this.editobjects[0].geometry.getpoint(ip + 1, is);
                    this.editobjects[0].geometry.updatepoint(ip + 1, is, point);
                    if (event.geometryclose)
                        this.editobjects[0].geometry.updatepoint(1, is, point);
                    if (!point_old || !point_old.x || !point_old.y) { // Если это была первая точка
                        this.map.setViewport(GWTK.toLatLng(point.x, point.y));
                        this.map.overlayRefresh();
                        this.history.add('insert', ip, is, null, null, point, null, null);
                    }
                    else
                        this.history.add('update', ip, is, null, point_old, point);
                    noupdatemetrics = true;
                    break;

                case 'insert':
                    if (!point) return;
                    this.editobjects[0].geometry.insertpoint3D(point.x, point.y, point.h, ip + 1, is);
                    this.history.add('insert', ip, is, null, null, point, null, null);
                    break;

                case 'remove':
                    this.deletepoint(ip + 1, is);
                    break;

                case 'finish':  // Завершить создание, перейти к редактированию
                    if (this.mapeditorCreatingTask)
                        this.mapeditorCreatingTask.complete();
                    break;

                case 'select':     // Подсветить текущую точку
                    if (this.selectpointElement) {
                        $(this.selectpointElement).mouseout();
                    }
                    var el = this.drawobject.getpointElemByNumber(is, ip);
                    if (el) {
                        this.selectpointElement = el;
                        $(this.selectpointElement).mouseover();
                    }
                    return;

                case 'enabled':  // сделать доступной кнопку режима удаления подобъектов
                    var el = $('.ededmethod_removesubobject.clickable');
                    if (el && el.length > 0) {
                        if (is > 0)
                            el.removeClass('disabledbuttonConst');
                        else
                            el.addClass('disabledbuttonConst');
                    }
                    return;

            }

            this.ischange(true);

            this.updatedrawcontur(noupdatemetrics, this.metrics.options.action);
            this.metrics.setgeometry(this.editobjects[0].geometry.saveJSON(true));
            //this.ischange(true);
        },


        /**
        * Событие на перерисовку карты
        * @method  onOverlayRefresh
        * @param event {Object} Событие
        */
        // ===============================================================
        onOverlayRefresh: function (event) {

            // Пересчитаем размеры окна редактора
            if (this.rscsemantics || this.metrics || $("div[name='" + this.classifersliderId + "']").length > 0) {
                this.sizeRemember();
            }

            if (this.drawobject) {
                this.drawobject.destroy();
            }
            if (this.drawpanel) {
                this.drawpanel.style.left = '0px';
                this.drawpanel.style.top = '0px';
            }

            // Для всех кроме SelectMapObjectActionHover
            var subaction = (this.map && this.map.taskManager && this.map.taskManager._action) ? this.map.taskManager._action.name : null;

            // Найдем объекты топологии
            this.searchObjectsByAreaFrame(null, subaction);

            // Затычка для масштабирования, событие mouseover для svg назначается раньше,
            // чем wms панель стала видимой после стирания временной панели.
            if (this.topology) {
                this.topology.updateSvgEvents();
            }
        },

        /**
       * Событие старт нового обработчика
       * @method  onSetAction
       * @param event {Object} Событие
       */
        // ===============================================================
        onSetAction: function (event) {
            if (!event || !event.action)
                return;
            // Если стартовал не наш обработчик, то закрыть наши задачи
            if (!this.isOurAction(event.action)) {

                // триггер на закрытие обработчика
                $(this.map.eventPane).trigger({ type: 'GWTK.mapeditorTask', operation: 'closeaction', mapobject:  this.editobjects[0]});

                // Если это автономный запуск, то закрыть редактор карты
                if (this.autonomous) {
                    this.closeAutonomous('cancel');
                    return;
                }

                this.ourAction = true;
                this.canClose();
            }
            else {
                this.ourAction = false;

                // триггер на старт обработчика
                $(this.map.eventPane).trigger({ type: 'GWTK.mapeditorTask', operation: 'setaction', mapobject:  this.editobjects[0]});
            }

        },

        // Старт обработчика после выбора шаблона
        onStartActionByTemplates: function (node) {
            if (!this.mapeditorCreatingTask) {
                $('#' + this.button_ids.create).click();
                setTimeout(this.mapeditorCreatingTask.initdataCreationObject(node), 1000)
            }
            else
                this.mapeditorCreatingTask.initdataCreationObject(node);
        },


        /**
         * ГРУППОВЫЕ ОПЕРАЦИИ
         */

        /**
        * Запрос является ли операция групповой
        * @method isGroup
        */
        // ===============================================================
        isGroup: function (type) {

            // Узнать, есть ли выделенные объекты
            var selectedFeatures = this.map.selectedObjects,
                _that = this, info = '<br/>', result;
            if (selectedFeatures && selectedFeatures.mapobjects.length > 0) {
                result = this.setEditObjects(selectedFeatures);
                for (var i = 0; i < result.length; i++) {
                    if (i > 0)
                        info += ', ';
                    info += result[i].sheet + ': ' + result[i].count;
                }

                if (this.editobjects && this.editobjects.length > 0) {
                    switch (type) {
                        case 'delete':
                            w2confirm(w2utils.lang("You confirm deletion of the selected objects") + info + " ?", w2utils.lang("Map editor"), function (answer) {
                                if (answer == 'Yes') {
                                    // Диалог для подтверждения удаления выделенных объектов
                                    //selectedFeatures.clear();
                                    _that.startGroupDeleteControl(type);
                                }
                                else {
                                    // Сброс выделения
                                    _that.clearEditObjects();
                                    _that.map.handlers.clearselect_button_click();
                                    _that.setDeletingAction();
                                    return true;
                                }
                            });
                            break;

                        case 'move':
                            // Задача запущена
                            if (!this.mapeditorMovingTask)
                                return false;
                            w2confirm(w2utils.lang("Do you want to move the selected objects") + info + " ?", w2utils.lang("Map editor"), function (answer) {
                                if (answer == 'Yes') {
                                    _that.isGroupProcess = true;
                                    _that.mapeditorMovingTask.processEdition();
                                    _that.addmenu();
                                }
                                else {
                                    // Сброс выделения
                                    _that.clearEditObjects();
                                    _that.map.handlers.clearselect_button_click();
                                    _that.mapeditorMovingTask.clickEditing();
                                    //return true;
                                }
                            });
                            break;
                    }
                }
                else {
                    w2alert(w2utils.lang("Selected objects can not be edited, because they are not included in the list of editable"), w2utils.lang("Map editor"), function (answer) {
                        _that.map.handlers.clearselect_button_click();
                    });
                }

                return true;
            }

            return false;
        },


        // Запустить обработчик на удаление
        setDeletingAction: function () {

            var actionTask;
            if (!this.options.objectselectionInPoint) {
                actionTask = new GWTK.MapeditorDeletingActionHover(this, 'delete', this.setselectlayers);
            }
            else {
                //selectParams = {
                //    show: false,
                //    sequence: true,
                //    objlocal: [],
                //    codelist: [],
                //    fn_setselectlayers: this.mapeditorTask.setselectlayers,
                //    fn_isCorrectObject: GWTK.Util.bind(this.mapeditorTask.iseditinglayer_object, this.mapeditorTask),
                //    message: this.message
                //};
                actionTask = new GWTK.MapeditorDeletingAction(this, 'delete', this.setselectlayers);
            }
            if (!actionTask.error) {
                if (this.setAction(actionTask)) {
                    GWTK.DomUtil.setActiveElement('#' + this.button_ids['delete']);
                    this.currentTask = 'delete';
                    this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Deleting"));
                    return this.currentTask;
                }
                actionTask.close();
            }


            //var actionTask = new GWTK.MapeditorDeletingActionHover(this, 'delete', this.setselectlayers);
            //if (!actionTask.error) {
            //    if (this.setAction(actionTask)) {
            //        GWTK.DomUtil.setActiveElement('#' + this.button_ids['delete']);
            //        this.currentTask = 'delete';
            //        this.updatetitle(w2utils.lang("Map editor") + '. ' + w2utils.lang("Deleting"));
            //        return this.currentTask;
            //    }
            //    actionTask.close();
            //}
        },


        // Запуск окна для перебора выбранных объектов
        startGroupDeleteControl: function (regime) {
            if (!this.groupcontrol)
                this.groupcontrol = new GWTK.QueryGroupMapObjectsControl(this.map, this.map.mapPane, regime, this.editobjects);
            else
                this.groupcontrol.set(regime, this.editobjects);
            this.isGroupDeleteProcess = true;

            $(this.map.eventPane).one('mapeditor_group', this.onGroup);
            GWTK.DomUtil.setActiveElement('#' + this.button_ids[regime]);
        },


        /**
         * Выполнение групповых операций
         * @method  onGroup
         * @param event {Object} Событие
         */
        // ===============================================================
        onGroup: function (event) {

            if (!event || !event.regime || !event.editobjects)// || event.editobjects.length == 0)
                return;

            // event.editobjects - это массив this.editobjects
            var editobjects = event.editobjects;

            switch (event.regime) {
                case 'delete':
                    this.editobjectsSave.splice(0, this.editobjectsSave.length);
                    for (var i = 0; i < editobjects.length; i++) {
                        // сделаем клон объекта и отправим его на сохранение
                        if (editobjects[i].isSave == true)
                            this.editobjectsSave.push({ 'editobject': editobjects[i].clone(), 'save': false });
                    }

                    if (this.editobjectsSave.length > 0) {
                        this.save(event.regime);
                    }
                    else
                        $(this.map.eventPane).trigger({ type: 'updatemapobject', mapobject: editobjects[0], regime: 'cancel', error: false, message: '' });

                    // Отожмем кнопки
                    GWTK.DomUtil.removeActiveElement('#' + this.button_ids[event.regime]);
                    this.closeAction();

                    break;
            }

        },


        /**
         * ПРОЧИЕ ФУНКЦИИ
         */

        /**
         * Поднять данные из истории изменений
         * @method restorehistory
         * @param direct {String} - 'prev' - предыдущее, 'next' - следующее
         */
        // ===============================================================
        restorehistory: function (direct) {

            if (!direct || (direct != 'prev' && direct != 'next') || !this.editobjects[0])
                return;
            var geometry = this.editobjects[0].geometry;
            if (!geometry) return;

            var history;
            if (direct == 'prev')
                history = this.history.prev();
            else
                history = this.history.next();

            if (!history || !history.type)
                return;

            // восстановить флажок редактирования объекта
            if (this.history.current < 0)
                this.ischange(false);
            else
                this.ischange(true);

            var number = history.number;
            if (history.type != 'offset' && history.type != 'all' && history.type != 'changedirection'
                && (!number && history.date == 'g'))  // и нет точек при геометрии
                return;

            // Триггер на восстановление данных из истории
            $(this.map.eventPane).trigger({ type: 'GWTK.mapeditorTask', operation: 'restorehistory', params: { phase: 'before', 'history': history, 'direct': direct } });

            if (history.data == 'g') { // метрика

                switch (history.type) {
                    case 'insert':  // удаляем, если prev, вставляем, если next
                        if (direct == 'prev')
                            geometry.deletepoint(number + 1, history.subject);  // удаляем
                        else
                            geometry.insertpoint3D(history.coord_new.x, history.coord_new.y, history.coord_new.h, number + 1, history.subject);  // вствляем
                        break;
                    case 'delete': // вставляем, если prev, удаляем, если next
                        number -= 1;
                        if (direct == 'prev')
                            geometry.insertpoint3D(history.coord_old.x, history.coord_old.y, history.coord_old.h, number + 1, history.subject);  // вствляем
                        else
                            geometry.deletepoint(number + 1, history.subject);  // удаляем
                        // Замкнуть
                        if (this.editobjects[0].spatialposition.toLowerCase().indexOf("polygon") >= 0)
                            geometry.closeobject(true, history.subject);

                        break;
                    case 'update':
                        var point;
                        if (direct == 'prev') {
                            point = new GWTK.Point3D(history.coord_old.x, history.coord_old.y, history.coord_old.h);
                            geometry.updatepoint(number + 1, history.subject, point);

                            // восстановим объекты топологии
                            if (history.topologyobjectJSON_old)
                                this.topology.restoreFromHistory(history.topologyobjectJSON_old);
                        }
                        else {
                            point = new GWTK.Point3D(history.coord_new.x, history.coord_new.y, history.coord_new.h);
                            geometry.updatepoint(number + 1, history.subject, point);
                            // восстановим объекты топологии
                            if (history.topologyobjectJSON_new)
                                this.topology.restoreFromHistory(history.topologyobjectJSON_new);
                        }

                        if (this.editobjects[0].spatialposition.toLowerCase().indexOf("polygon") >= 0)
                            geometry.closeobject(true, history.subject);
                        break;

                    case 'offset':
                        var dx = history.offset.x;
                        var dy = history.offset.y;
                        if (direct == 'prev') { // смещение с минусом
                            dx = -dx; dy = -dy;
                        }
                        this.offsetpoints(dx, dy);
                        // Если режим перемещения (на общей панели)
                        if (this.currentTask == 'move' && this.mapeditorMovingTask) {
                            this.mapeditorMovingTask.processEdition();
                        }
                        return;
                    case 'all':
                        if (direct == 'prev')
                            this.editobjects[0].geometry = history.points_old.createcopy();
                        else
                            this.editobjects[0].geometry = history.points_new.createcopy();
                        geometry = this.editobjects[0].geometry;
                        break;
                    case 'changedirection':
                        geometry.changedirection(history.subject);
                        break;
                    default:
                        break;
                }

                this.updatedrawcontur();
                // Если нет точек, то включить режим создания
                if (geometry.count(history.subject) == 0) {
                    if (!this.mapeditorCreatingTask) {
                        if (!this.setTask(this.mapeditorCreatingTask = new GWTK.MapeditorCreatingTask(this.id, this.map, null, null, this))) {
                            this.mapeditorCreatingTask.destroy();
                            this.mapeditorCreatingtTask = null;
                            return;
                        }
                    }
                    this.mapeditorCreatingTask.processCreation();
                }
            }
            else { // семантика
                if (!this.rscsemantics || !history.semantics || history.semantics.length == 0)
                    return;

                var semantics = new Array();
                if (direct == 'prev') {
                    for (var i = 0; i < history.semantics.length; i++)
                        semantics.push({ id: history.semantics[i].id, oldvalue: history.semantics[i].newvalue, newvalue: history.semantics[i].oldvalue, code: history.semantics[i].code, changeview: history.semantics[i].changeview });
                }
                else {
                    for (var i = 0; i < history.semantics.length; i++)
                        semantics.push({ id: history.semantics[i].id, oldvalue: history.semantics[i].oldvalue, newvalue: history.semantics[i].newvalue, code: history.semantics[i].code, changeview: history.semantics[i].changeview });
                }
                this.rscsemantics.setvalue(semantics);
            }

            $(this.map.eventPane).trigger({ type: 'GWTK.mapeditorTask', operation: 'restorehistory', params: { phase: 'after', 'history': history, 'direct': direct } });

        },



        // Функция отрисовки редактируемого объекта с габаритной рамкой
        draw: function (svg, drw_points, drw_centerpoints, noevents, bbox) {
            if (!this.editobjects || !this.editobjects[0])
                return;

            var subaction = (this.map && this.map.taskManager && this.map.taskManager._action) ? this.map.taskManager._action.name : null;

            // Если расширенный action, то не поднимать панель
            var extra = (subaction && subaction.indexOf(this.extraAction) >= 0);
            if (!extra){
                this.drawobject.zIndexDrawPanel('up', this.drawpanel);
                this.drawobject.pointerEventsDrawPanel(this.drawpanel);
            }
            else {
                this.drawobject.zIndexDrawPanel('down', this.drawpanel);
                this.drawobject.pointerEventsDrawPanel(this.drawpanel, 'none');
            }

            if (this.isGroupProcess) {
                this.drawobject.drawGEOJSON(this.drawSelectFeatures.mapobjects, this.drawSelectFeatures.mapobjectsToGeoGSON(true), svg, noevents, true);
                return;
            }
            else {
                if (this.currentTask == 'move') {
                    this.drawobject.drawGEOJSON(this.editobjects, this.editobjects[0].saveJSON(), svg, noevents, true);
                    return;
                }
            }

            var subaction = (this.map && this.map.taskManager && this.map.taskManager._action) ? this.map.taskManager._action.name : null;
            switch (subaction) {
                case 'edit':
                    bbox = true;
                    drw_points = true;
                    drw_centerpoints = true;
                    break;
                case 'moving':
                    bbox = true;
                    drw_points = true;
                    drw_centerpoints = false;
                    noevents = true;
                    break;
                case 'create':
                    bbox = false;
                    drw_points = true;
                    drw_centerpoints = false;
                    break;
                default:
                    if (!subaction) {
                        if (this.currentTask == 'edit' || this.currentTask == 'create') {
                            noevents = true;
                            drw_points = true;
                            drw_centerpoints = false;
                        }
                    }
            }

            // Если расширенный action, то не поднимать панель
            if (extra){
                noevents = true;
                bbox = (this.currentTask == 'edit');
                drw_centerpoints = (this.currentTask == 'edit');
                drw_points = true;
            }

            this.drawobject.draw(this.editobjects[0], svg, drw_points, drw_centerpoints, noevents, bbox);

            // Сделать доступным окно информации
            this.paneInfoObjectDisabled(false);
        },

        // Перерисовка контуров
        refreshdraw: function (noevents, bbox) {
            if (this.isGroupProcess)
                this.drawobject.drawGEOJSON(this.drawSelectFeatures.mapobjects, this.drawSelectFeatures.mapobjectsToGeoGSON(true), this.drawobject.svgDraw, noevents, true);
            else {
                this.draw(this.drawobject.svgDraw, false, (this.currentTask != 'edit') ? false: true, noevents, bbox);
            }
        },


        /**
         * Поиск объектов и отображение объектов класса топологии
         * @method searchObjectsByAreaFrame
         * @param excludeObjects {Array String} Массив идентификаторов объектов карты, которые нужно исключить
         * @param subaction {String} Активный режим редактора карты
         * @param noshow (Bool) - не отрисовывать объекты при наведении мыши
         */
        // ===============================================================
        searchObjectsByAreaFrame: function (excludeObjects, subaction, nomouseover) {
            if (!subaction) {
                if (this.map && this.map.taskManager && this.map.taskManager._action)
                    subaction = this.map.taskManager._action.name;
            }
          //  if (subaction != 'SelectMapObjectActionHover') {
                if (this.topology) {
                    if (!excludeObjects) {
                        excludeObjects = [];
                        if (this.editobjects[0])
                            excludeObjects.push(this.editobjects[0].gid);
                    }
                    if (!subaction || subaction == 'groupOperations') // Если групповые операции
                        this.topology.searchObjectsByAreaFrame(null, null, subaction, [], nomouseover);
                    else
                        this.topology.searchObjectsByAreaFrame(null, excludeObjects, subaction, this.selectlayersid, nomouseover);
                }
           // }
        },

        // назначить слои для выделения
        // nographic - не брать графические слои
        setselectlayers: function (nographic) {
            var layer, selectlayersid = [];
            var tool = this.map.mapTool('mapeditor'), task;
            if (!tool || !(task = tool.mapeditorTask)) return this.selectlayersid;
            if (task.setlayers()) {
                for (var i = 0; i < task.maplayersid.length; i++) {
                    if (nographic) {
                        layer = this.map.tiles.getLayerByxId(task.maplayersid[i].layerid);
                        if (layer && layer instanceof GWTK.graphicLayer)
                            continue;
                    }
                    selectlayersid.push(task.maplayersid[i].layerid);
                }
            }
            return selectlayersid;
        },

        // назначить слои для выбора ответного объекта (нового источника данных)
        //
        setAvailableLayers: function (edit) {
            if (edit)
                return this.setselectlayers();

            var selectlayersid = [];
            var count = this.map.layers.length;
            for (var i = 0; i < count; i++) {
                if (!this.map.layers[i].visible || !this.map.layers[i].options.selectObject) // Невидимые слои или слои
                    continue;
                selectlayersid.push(this.map.layers[i].options.id);
            }
            return selectlayersid;
        },

        /**
         * Информация в статус бар
         * @method message
         */
        // ===============================================================
        setStatusBar: function (message) {
            //this.map.statusbar.set(this.mapeditorTask.titleMessage + message + '...');
            this.map.statusbar.set(message + '...');
        },

        /**
         * Информация в статус бар
         * @method message
         */
        // ===============================================================
        clearStatusBar: function () {
            this.map.statusbar.clear();
        },

        ischange: function (change) {
            if (!change)
                change = false;
            this._ischange = change;
            // Если уже редактируем, то сделать недоступным инструмент смены объектов в точке
            var $objectlistId = $('#' + this.objectlistId);
            if (change) {
                $objectlistId.addClass("disabledbutton");
            }
            else {
                $objectlistId.removeClass("disabledbutton");
            }
            $objectlistId.blur();
        },



        /**
         * Инициализация компонента списка слоев (режим редактирования)
         * @method initObjectsInPoint
         */
        // ===============================================================
        initObjectsInPoint: function (gid, objectlistId, fn_change) {

            var selectedFeaturesObjects = this.drawSelectFeatures.mapobjects;
            if (!gid && !objectlistId && selectedFeaturesObjects.length == 0)
                return;

            $('#' + this.objectlistId).children().remove();
            if (selectedFeaturesObjects && selectedFeaturesObjects.length > 1) {
                var _that = this;
                var paneinfo = this.map.createPane('edContainerInfo', $('#' + objectlistId)[0]);
                var strpanel =
                    '<tr>' +
                    '<td>' +
                    '<div class="w2ui-field w2ui-span3">' +
                    '<label style = "margin-top:-1px; white-space:pre-wrap; text-align:center !important;">' + w2utils.lang("Objects in the point") + ':</label>' +
                    '<div> ' +
                    '<input type="list" id="list_' + objectlistId + '" style="width: 100% !important;">' +
                    '</div>' +
                    '</div>' +
                    '</td>' +
                    '</tr>';
                $(paneinfo).append('<table width="100%" cellspacing=0 cellpadding=0>' + strpanel + '</table>');
                $(paneinfo).css('width', '100%');

                // Установить список объектов
                var _that = this, ellistid = $('#list_' + objectlistId),
                    mapobjects = [], index = 0;
                for (var i = 0; i < selectedFeaturesObjects.length; i++) {
                    mapobjects.push({ 'text': selectedFeaturesObjects[i].name, 'id': selectedFeaturesObjects[i].gid });
                    if (mapobjects[i].id == gid)
                        index = i;
                }
                ellistid.w2field('list',
                    {
                        items: mapobjects, selected: mapobjects[index], focus: -1
                    });
                ellistid.change(function (event) {
                    var obj = ellistid.data('selected');
                    if (obj) {
                        var find = selectedFeaturesObjects.find(
                          function (element, index, array) {
                              if (element.gid == obj.id) {
                                  return element;
                              }
                          });
                        if (find && fn_change) {
                            // Если объект с другого слоя, то переназначим слой
                            if (find.maplayerid != _that.maplayerid.layerid) {
                                // Назначим нужный слой
                                _that.maplayerid.layerid = find.maplayerid;
                                // Установить тип редактируемого слоя
                                _that.layer = _that.map.tiles.getLayerByxId(_that.maplayerid.layerid);
                                _that.setlayertype(_that.layer);
                            }
                            fn_change(find);
                        }
                        $('#' + _that.objectlistId).blur();
                    }
                });
                $('#' + this.objectlistId).blur();
            }

        },


        /**
         * Заполнить список объектов в точке
         * @method setObjectsIntoPoint
         */
        // ===============================================================
        setObjectsIntoPoint: function (pointevent, gid, fn_callback) {
            this.map.taskManager._serviceAction = new GWTK.MapAction(this, 'selectobjectsinpoint');
            this.map.taskManager._serviceAction.showInfoOfSelectedObjects = false;
            var point = GWTK.DomEvent.getMousePosition(pointevent, this.map.panes.eventPane);
            var gfi = this.map.objectManager.featureRequest;
            if (!gfi) {
                w2alert('Error of Map.getFeatureInfo. ' + 'Выбор объектов невозможен !');
                console.log('Error of Map.getFeatureInfo. ' + 'Выбор объектов невозможен !');
            }
            else {
                var _that = this;
                gfi.getFeatureInfo(point, null, function () {                                               // запросить данные объектов в точке
                    _that.map.taskManager._serviceAction = null;
                    var selectedFeatures = _that.map.selectedObjects;
                    selectedFeatures.editor = true;
                    for (var i = 0; i < selectedFeatures.mapobjects.length; i++) {
                        // Проверка на возможность редактирования объекта
                        if (!_that.iseditinglayer_object(selectedFeatures.mapobjects[i].gid, selectedFeatures.mapobjects[i].code, selectedFeatures.mapobjects[i].key))
                            continue;
                        if (!_that.drawSelectFeatures.findobjectsByGid(selectedFeatures.mapobjects[i].gid))
                            _that.drawSelectFeatures.add(selectedFeatures.mapobjects[i]);
                    }
                    // Сбросим класс выделения объектов
                    _that.initObjectsInPoint(gid, _that.objectlistId, fn_callback);
                });
            }
        },


        // Восстановить z-index панели рисования
        zIndexRestore: function () {
            $(this.map.drawPane).css('zIndex', this.zIndex);
        },

        // Доступность информационной панели на редактирование
        paneInfoObjectDisabled: function (disabled) {
            var $objectinfoId = $('#' + this.objectinfoId);
            if (disabled)
                $objectinfoId.addClass("disabledbutton");
            else
                $objectinfoId.removeClass("disabledbutton");
        },

        // Закрытие редактора в автономном режиме
        // closeAutonomous: function (action, mapobjects) {
        //     $('#' + this.button_ids.save).hide();
        //     this.map.mapeditor.closeAutonomous(action, mapobjects);
        // },

        closeAutonomous: function (action, mapobjects) {
            if (this.map.mapeditor.closeAutonomous(action, mapobjects)) {
                $('#' + this.button_ids.save).hide();
            }
        },

        // Панель макетов, если есть
        setTemplate: function (layer, legend, visible) {
            if (this.mapeditTemplates) {
                this.mapeditTemplates.setTemplate(layer, legend, visible, this.panel);
            }
        },

        // Установить запись в макете
        setTemplateRecord: function (node) {
            if (this.mapeditTemplates) {
                this.mapeditTemplates.setTemplateRecord(node);
            }
        },

        // Включить/отключить кнопку в шаблоне
        activeTemplateRecord: function (key, active) {
            if (this.mapeditTemplates) {
                this.mapeditTemplates.activeTemplateRecord(key, active);
            }
        },


        /**
          * Выбор точек на альтернативном объекте !!!!!!!!!!!!! Не задействовано !!!!!!!!!!!!
        */

        /**
         * Запустить процесс выбора объекта-источника
         * @method selectSourceObject
         * @param extend {Boolean}  Флаг использования расширенного режима
         * чтобы не делать запрос на сохранение при промежуточных операциях
         */
        // ===============================================================
        selectSourceObject: function (number, subjectnumber, pointscount) {

            if (this.map.taskManager._action && this.map.taskManager._action.buttonmethod_edit == '.ededmethod_edallpoint') {
                this.buttonmethod_edit = this.map.taskManager._action.buttonmethod_edit;
            }

            this.extend = true;

            this.actionName = this.map.currentActionName();
            //  Закроем текущий обработчик редактирования
            this.closeAction();

            this.currentpoint = number;
            this.currentsubject = subjectnumber;

            var actionTask = new GWTK.SelectMapObjectAction(this.getActiveTask(), this.map, {
                fn_setselectlayers: this.setAvailableLayers,
                sequence: true,
                show: false
            });

            if (!actionTask.error) {
                if (this.setAction(actionTask)) {
                    $(this.map.eventPane).one('featurelistclick', this.onSourceFeatureListClick);
                    return true;
                }
            }

            actionTask.close();
            this.currentpoint = null;
            this.currentsubject = null;
        },

        /**
        * Событие на выбор объекта в списке выделенных объектов
        * @method  onSourceFeatureListClick
        * @param ui {Object} Событие
        */
        // ===============================================================
        onSourceFeatureListClick: function (ui) {
            $(this.map.eventPane).off('featurelistclick', this.onSourceFeatureListClick);
            if (!ui.layer || !ui.gid)
                return false;

            var editobject = this.map.objectManager.selectedFeatures.findobjectsById(ui.layer, ui.gid);
            if (editobject) {
                this.drawSelectFeatures.add(editobject);
                var source = this.drawSelectFeatures.mapobjects[this.drawSelectFeatures.mapobjects.length - 1];
                this.drawSelectFeatures.drawcontour(source, true, true);
                if (source.geometry && source.geometry.count()) {


                    this.processSelectObjectPoints(editobject, pointscount, fn_callback);
                    //var actionTask = new GWTK.NearestPointAction(this.getActiveTask(), this.map, {
                    //    name:  'normal',
                    //    object: source,
                    //    mode: (!this.options.captureVirtualPoints) ? 'point' : 'normal',
                    //    svgOptions: {  // настройки для графики
                    //        'stroke-dasharray': '2,2'
                    //    },
                    //    fn_callback: GWTK.Util.bind(this.onSourceFeaturePointClick, this)
                    //});
                    //if (actionTask) {
                    //    if (this.setAction(actionTask)) {
                    //        return true;
                    //    }
                    //}
                }
            }
        },

        /**
         * Событие на выбор точки на объекте
         * @method  onFeatureListClick
         * @param success {boolean} - признак успеха
         * @param point {GWTK.Point} - точка на карте (при успехе)
         * @param geo {GWTK.LatLng} - координаты точки (при успехе)
        */
        // ===============================================================
        onSourceFeaturePointClick: function (ui) {
            this.extend = false;

            // Текущий обработчик текущей задачи
            var task = this.getActiveTask();
            if (ui.success) {

                // Изменим координаты точки редактируемого объекта на координаты точки выбранного объекта
                if (ui.geo) {
                    this.updateObjectPoint(this.currentpoint, this.currentsubject, [ui.geo.lat, ui.geo.lng], null, this.actionName);
                }

                if (this.drawSelectFeatures.mapobjects.length) {
                    var source = this.drawSelectFeatures.mapobjects[this.drawSelectFeatures.mapobjects.length - 1];
                    if (this.buttonmethod_edit == '.ededmethod_edallpoint') {
                        this.topojson = [this.topology.copytopologyobjectJSON(), null];
                        var feature = this.topology.findFeatureByGID(source.gid);
                        if (feature) {
                            if (ui.id.length == 2) {  // Имеется виртуальная точка
                                this.topology.addVirtualPointToGeometry(feature, ui.point, ui.subject + 1, ui.id[0], 1);
                            }
                        }
                        this.topology.dragtopologypoints(ui.point, true);
                        this.topojson[1] = this.topology.copytopologyobjectJSON();
                    }
                    this.drawSelectFeatures.remove(source);
                }
            }

            if (task) {
                switch (this.actionName) {
                    case 'edit':
                        task.processEdition(null, this.buttonmethod_edit);
                        break;
                    case 'create':
                        task.processCreation();
                        break;
                }
            }

            this.currentpoint = null;
            this.currentsubject = null;
            this.actionName = null;
            this.buttonmethod_edit = null;

        },


        /**
         * Выбор объекта
         * @method selectObject
         * @param fn_callback {Function} - функция обратного вызова при выборе объекта
         */
        // ===============================================================
        selectObject: function (fn_callback, actionname, message) {

            this.destroySelectMapObjectAction();

            if (!this.options.objectselectionInPoint) {
                this.selectMapObjectAction = new GWTK.SelectMapObjectActionHover(this, {
                    fn_setselectlayers: this.setselectlayers,
                    message: message || ''
                });
            }
            else {
                this.selectMapObjectAction = new GWTK.SelectMapObjectAction(this, this.map, {
                    fn_setselectlayers: this.setselectlayers,
                    fn_isCorrectObject: GWTK.Util.bind(this.iseditinglayer_object, this),
                    sequence: true,
                    message: message || '',
                    show: false
                });
            }

            if (!this.selectMapObjectAction.error) {
                if (actionname) {
                    this.selectMapObjectAction.name += actionname;
                }
                if (this.setAction(this.selectMapObjectAction)) {
                    this.selectMapObjectAction.fn_callback = fn_callback;
                    $(this.map.eventPane).one('featurelistclick', this.selectMapObjectAction.fn_callback);
                    return this.selectMapObjectAction;
                }
            }
            this.destroySelectMapObjectAction();
        },

        /**
         *  Удаление обработчика выбора объекта, если таковой есть
         */
        destroySelectMapObjectAction: function(){
            if (this.selectMapObjectAction) {
                if (this.selectMapObjectAction.fn_callback) {
                    $(this.map.eventPane).off('featurelistclick', this.selectMapObjectAction.fn_callback);
                }
                if (this.map.currentActionName() == this.selectMapObjectAction.name) {
                    this.map.closeAction();
                }
                else {
                    this.selectMapObjectAction.close();
                }
                this.selectMapObjectAction = null;
            }
        },

        /**
         *  Сброс выделения в карте
         */
        clearSelectedFeaturesMap: function() {
            // Если задача запущена автономно, то не сбрасывать выделенные объекты
            if (this.autonomous) {
                this.map.objectManager.selectedFeatures.clearDrawAll();
            }
            else {
                this.map.objectManager.selectedFeatures.clear();
            }
        }


    };


/************************************* Соколова  ***** 20/02/17 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2016              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                      Журнал                                      *
*                                                                  *
*******************************************************************/

    if (window.GWTK) {


        // класс Журнала
        GWTK.Log = function () {
            this.toolname = 'log';

            /*  errors - массив ошибок
            GWTK.RecordLog = {
                "classname": "",    // Имя класса
                "funcname": "",     // Имя функции
                "type": "",         // Тип ошибки
                "message": ""       // Сообщение
            }*/
            this.records = new Array();

        };

        GWTK.Log.prototype = {

            /**
             * Добавить запись
             * @method add
             * @param record {Object GWTK.RecordLog} -  объект, содержащий информацию
             */
            // ===============================================================
            add: function (record) {
                this.records.push(record);
            },

            /**
             * Запросить запись по индексу ( с 0)
             * @method get
             * @param index (Int) -  объект, содержащий информацию
             * @return record {Object GWTK.RecordLog} - запись журнала
             */
            // ===============================================================
            get: function (index) {
                if (index < 0 || index >= this.records.length)
                    index = 0;
                return this.records[index];
            },

            /**
             * Очистить журнал
             * @method clear
             */
            // ===============================================================
            clear: function () {
                this.records.splice(0, this.records.length);
            },            // Сохраним ошибки


            /**
             * Клон объекта
             * @method clone
             * @return {Object GWTK.Log} - объект журнал
             */
            // ===============================================================
            clone: function () {
                var newlog = new GWTK.Log();
                if (this.records.length > 0) {
                    for (var i = 0; i < this.records.length; i++)
                        newlog.add(this.records[i]);
                }
                return newlog;
            },

            /**
             * Количество записей в журнале
             * @method count
             * @return {Number}
             */
            // ===============================================================
            count: function () {
                return this.records.length;
            }


        };
    }

/************************************* Соколова  ***** 13/09/17 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2016              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*   Класс перебора или выбора объектов для                         *
*                               выполнения групповых операций      *
*                                                                  *
*******************************************************************/

    if (window.GWTK) {

        GWTK.QueryGroupMapObjectsControl = function (map, parent, regime, editobjects) {
            this.error = true;
            if (!map || !parent || !regime || !editobjects || editobjects.length == 0 || !map.mapeditor || !map.mapeditor.mapeditorTask)
                return;
            this.map = map;
            this.parent = parent;
            this.paneId = 'groupPane_' + this.map.mapeditor.panelId;

            // слой выделения
            this.selectedFeatures = this.map.mapeditor.mapeditorTask.drawSelectFeatures;

            this.init(regime, editobjects);

            this.error = false;

            this.typeForm = 'form';
            this.createPane(regime);
            this.set(regime, editobjects);
        };

        GWTK.QueryGroupMapObjectsControl.prototype = {

            init: function (regime, editobjects) {
                this.regime = regime;
                this.editobjects = editobjects;
                this.setRecId();
                this.current = 0;
            },

            createPane: function (regime) {
                var w, h, offset, header = this.header(regime),
                    $pane = $('#' + this.map.mapeditor.panelId);
                w = $pane.width();
                offset = $pane.offset();
                h = $pane.height();

                // Панель расположена после панели выбора объектов
                $(this.parent).append('<div id ="' + this.paneId + '" class="map-panel-def ' + 'mapeditorTask' + '-panel" >' +
                   '</div>');
                this.$pane = $('#' + this.paneId);
                this.$pane.draggable({
                    containment: "parent", distance: 2
                });
                //this.$pane.append('<div class="routeFilesName" id="header_' + this.paneId + '"></div>');

                if (this.$pane.length > 0) {
                    this.$pane[0].appendChild(GWTK.Util.createHeaderForComponent({
                        map: this.map,
                        name: this.header(this.regime),
                        callback: GWTK.Util.bind(function () {
                            this.close();
                        }, this)
                    }));
                }

                if (offset) {
                    this.$pane.offset({top: offset.top + h + 20, left: offset.left});
                }

                // форма
                this.formId = this.typeForm + this.paneId;
                this.$pane.append('<div id ="' + this.formId + '"></div>');
                if (this.typeForm == 'form')
                    this.createform();
            },

            // Создать форму
            createform: function () {
                var _that = this,
                    styleinput = ' style="width:90%" ',
                    stylebtn = ' style="width:22%" ',
                formHTML =
                    '<div class="w2ui-page page-0 disabledbutton">' +
                         '<div class="w2ui-field">' +
                             '<label>' + w2utils.lang('Code') + '</label>' +
                             '<div>' +
                                 '<input name="code" type="text"' + styleinput + '/>' +
                             '</div>' +
                         '</div>' +
                         '<div class="w2ui-field">' +
                             '<label>' + w2utils.lang('Object number') + '</label>' +
                             '<div>' +
                                 '<input name="gid" type="text"' + styleinput + '/>' +
                             '</div>' +
                         '</div>' +
                         '<div class="w2ui-field">' +
                             '<label>' + w2utils.lang('Name') + '</label>' +
                             '<div>' +
                                 '<input name="name" type="text"' + styleinput + '/>' +
                             '</div>' +
                         '</div>' +
                         '<div class="w2ui-field">' +
                             '<label>' + w2utils.lang('Layer') + '</label>' +
                             '<div>' +
                                 '<input name="layername" type="text"' + styleinput + '/>' +
                             '</div>' +
                         '</div>' +
                         '<div class="w2ui-field">' +
                             '<label>' + w2utils.lang('Type') + '</label>' +
                             '<div>' +
                                 '<input name="spatialpositionName" type="text"' + styleinput + '/>' +
                             '</div>' +
                         '</div>' +
                         '<div class="w2ui-field">' +
                             '<label>' + w2utils.lang('Layer (map)') + '</label>' +
                             '<div>' +
                                 '<input name="maplayername" type="text"' + styleinput + '/>' +
                             '</div>' +
                         '</div>' +
                     '</div>' +

                     '<div class="w2ui-buttons">' +
                         '<button class="btn" ' + stylebtn + ' name="yes" onclick="return false;">' + w2utils.lang("Yes") + '</button>' +
                         '<button class="btn" ' + stylebtn + ' name="skip" onclick="return false;">' + w2utils.lang("Skip") + '</button>' +
                         '<button class="btn" ' + stylebtn + ' name="all" onclick="return false;">' + w2utils.lang("All") + '</button>' +
                         '<button class="btn" ' + stylebtn + ' name="finish" onclick="return false;">' + w2utils.lang("Finish") + '</button>' +
                     '</div>';


                var fields = [
                        { field: 'code', type: 'text' },
                        { field: 'gid', type: 'text' },
                        { field: 'name', type: 'text' },
                        { field: 'layername', type: 'text' },
                        { field: 'spatialpositionName', type: 'text' },
                        { field: 'maplayername', type: 'text' }
                ];

                this.editobjects[this.current].spatialpositionName = this.editobjects[this.current].spatialpositionCaption();

                $('#' + this.formId).w2form({
                    name: this.formId,
                    fields: fields,
                    record: this.editobjects[this.current],
                    formHTML: formHTML,
                    actions: {
                        yes: function () {
                            _that.editobjects[_that.current].isSave = true;
                            _that.nextrecord('yes');
                        },
                        skip: function () {
                            if (_that.setview('skip'))
                                _that.nextrecord('none');
                        },
                        all: function () {
                            _that.nextrecord('all', _that.editobjects.length);
                        },
                        finish: function () {
                            _that.nextrecord('finish', _that.editobjects.length);
                        }
                    }
                });

            },

            // назначить идентификаторы записей
            setRecId: function () {
                for (var i = 0; i < this.editobjects.length; i++) {
                    this.editobjects[i].recid = i + 1;
                }
            },

            // назначить данные
            set: function (regime, editobjects) {
                if (!editobjects || editobjects.length == 0)
                    return;

                // Заполнить объектами selectedFeatures, если гридок
                this.selectedFeatures.clear();
                this.selectedFeatures.updateLink(editobjects);

                this.action = new GWTK.MapeditorGroupAction(this, 'groupOperations');
                if (!this.map.setAction(this.action))
                    return;
                this.map.mapeditor.mapeditorTask.canCancel = false;
                this.init(regime, editobjects);

                var form = w2ui[this.formId];
                this.$pane.show();
                if (form)
                    this.nextrecord('none', 0);
            },

            // заголовок формы
            header: function (regime) {
                var headertext = '';
                switch (this.regime) {
                    case 'delete':
                        headertext = w2utils.lang("Remove objects") + ' (' + this.editobjects.length + ')';
                        break;
                    case 'edit':
                        headertext = w2utils.lang("Edit objects") + ' (' + this.editobjects.length + ')';
                        break;
                }
                return headertext;
            },

            // Разрушить оконные элементы
            destroy: function () {
                this.closeAction();
                if (w2ui[this.formId])
                    w2ui[this.formId].destroy();
                this.$pane.remove();
            },

            // Завершить операцию
            close: function () {
                var count = 0;
                for (var i = 0; i < this.editobjects.length; i++) {
                    // сделаем клон объекта и отправим его на сохранение
                    if (this.editobjects[i].isSave) {
                        count++;
                        this.map.selectedObjects.remove(this.editobjects[i]);
                    }
                }

                if (count > 0 && this.regime == 'delete')
                    w2utils.lock($(this.map.mapPane), w2utils.lang("Saving..."), true);

                this.$pane.hide();
                $(this.map.eventPane).trigger({ "type": "mapeditor_group", regime: this.regime, editobjects: this.editobjects });
                //if (count > 0)
                //    $(this.map.eventPane).trigger({ "type": "featureinforefreshed.featureinfo", "layers": this.map.objectManager.selectedFeatures.layers });

                this.closeAction();
            },

            // закрыть групповой обработчик
            closeAction: function () {
                if (this.action)
                    this.action.canCancel = true;
                this.map.mapeditor.mapeditorTask.canCancel = true;
            },

            // текущая запись
            setrecord: function (current) {
                this.nextrecord(current);
            },

            // следующая запись
            nextrecord: function (actions, current) {
                if (actions == 'finish') {
                    this.editobjects.splice(this.current, this.editobjects.length - this.current);
                    this.close();
                    return;
                }
                if (actions == 'all') {
                    for (var i = 0; i < current; i++) {
                        this.editobjects[i].isSave = true;
                    }
                    this.close();
                    return;
                }

                if (current >= 0)
                    this.current = current;
                else {
                    this.current++;
                    if (!(this.current >= this.editobjects.length)) {
                        this.editobjects[this.current].spatialpositionName = this.editobjects[this.current].spatialpositionCaption();
                    }
                }
                this.setview(actions);
            },

            // Подсветить выделенный объект
            setview: function (actions) {
                if (!this.editobjects || this.editobjects.length == 0 ||
                    this.current >= this.editobjects.length) {
                    this.close();
                    return;
                }

                var form = w2ui[this.formId];
                if (form) {
                    if (this.typeForm == 'form') {
                        form.record = this.editobjects[this.current];
                        form.refresh();
                    }
                }

                // Отрисовать объект
                if (actions) {
                    switch (actions) {
                        case 'yes':  // да
                            this.selectedFeatures.drawcontour(this.editobjects[this.current], true, true, true);
                            this.map.overlayRefresh();
                            break;
                        case 'skip':
                            this.selectedFeatures.remove(this.editobjects[this.current]);
                            this.current--;
                            if (this.editobjects.length == 0) {
                                this.close();
                                return;
                            }
                            break;
                        case 'none':
                            this.selectedFeatures.drawcontour(this.editobjects[this.current], true, true, true);
                            this.map.overlayRefresh();
                            break;
                    }
                }
                else { // для грида
                    if (this.editobjects[this.current]) {
                        this.selectedFeatures.drawcontour(this.editobjects[this.current], false, true, true, false);
                        this.map.overlayRefresh();
                    }
                }

                return true;
            }

        };

    };



    /************************************* Соколова  ***** 09/08/18 ****
    *                                                                  *
    *              Copyright (c) PANORAMA Group 1991-2018              *
    *                       All Rights Reserved                        *
    *                                                                  *
    ********************************************************************
    *                                                                  *
    *                      Макеты создания объектов                    *
    *                                                                  *
    *******************************************************************/


    if (window.GWTK) {

        // Шаблоны для создания
        GWTK.MapeditRecordTemplate = {
            "name": "",         // название объекта
            "key": "",          // ключ объекта
            "code": "",         // код объекта
            "local": "",        // локализация из rsc
            "cssclass": "",     // класс изображения
            "bsdlayer": ""     // Имя слоя в классификаторе
        };
        GWTK.MapeditTemplate = {
            "layer": {
                "url": "",      // url запроса к серверу картографических данных
                "alias": "",   // alias слоя на сервере
                "id": "",       // ID слоя на сервере
                "idselector": ""   // ID дял селектора кнопки
            },
            "records": [] // массив объектов  GWTK.MapeditRecordTemplate
        };

        // класс Макетов создания
        GWTK.MapeditTemplates = function (map, parent, fn_start) {

            this.toolname = 'mapedittemplates';
            this.error = true;

            this.templates = [];
            this.map = map;
            if (!this.map || this.map instanceof GWTK.Map == false)
                return;

            this.parent = (parent) ? parent : this.map.mapPane;
            this.error = false;

            this.readCookie();

            this.onChangeAction = GWTK.Util.bind(this.onChangeAction, this);
            $(this.map.eventPane).on('GWTK.mapeditorTask', this.onChangeAction);
            this.onCloseAction = GWTK.Util.bind(this.onCloseAction, this);
            $(this.map.eventPane).on('closeaction', this.onCloseAction);

            this.fn_start = fn_start ? fn_start : null;

        };

        GWTK.MapeditTemplates.prototype = {

            destroy: function () {
                $(this.map.eventPane).off('GWTK.mapeditorTask', this.onChangeAction);
                $(this.map.eventPane).off('closeaction', this.onCloseAction);

                this.hideTemplate();
                $(this.parent).remove();
            },

            readCookie: function () {
                var param = GWTK.cookie(this.toolname, GWTK.cookies.converter);
                if (!param) return;

                var _that = this;
                $.each(param, function (index, value) {
                    var key = value.shift();
                    var key_value = value.length > 0 ? value.shift() : '';
                    switch (key) {
                        case 'templates':
                            _that.templates = ((key_value == '') ? [] : JSON.parse(key_value))
                            break;
                    }
                });

            },

            writeCookie: function () {
                var value = ['templates=' + ((this.templates) ? JSON.stringify(this.templates) : '')].join('&');
                GWTK.cookie(this.toolname, value, { expires: 5, path: '/' });
            },

            // Панель макетов, если есть
            setTemplate: function (layer, legend, visible, aligpanel) {
                if (!layer) return;

                var parent = $(this.parent), _that = this;
                this.hideTemplate();
                if (visible)
                    parent.css('display', 'block');
                parent.css('left', $(aligpanel).css('left'));
                parent.draggable({ containment: "parent" });

                // Найдем наш макет
                var template, url, question = layer.options.url.indexOf("?");
                if (question !== -1) {
                    url = layer.options.url.slice(0, question);
                }
                // else {
                //     question = this.map.options.url.indexOf("?");
                //     if (question !== -1) {
                //         url = this.map.options.url.slice(0, question);
                //     }
                // }

                if (!url) return;

                if (this.templates && this.templates.length > 0) {
                    this.templateCurr = this.templates.find(
                        function (element, index, array) {
                            if (element.layer && element.layer.id == layer.idLayer && element.layer.url == url)
                                return element;
                        });
                }

                // Создадим макет
                if (!this.templateCurr) {
                    var templateCurr = {
                        "layer": {
                            "url": url,
                            "alias": layer.alias,
                            "id": layer.idLayer,
                            "idselector": this.getId(layer.idLayer)
                        },
                        "records": [  // массив объектов  GWTK.editRecordTemplate
                        ]
                    }
                    for (var i = 0; i < 10; i++) {
                        templateCurr.records.push({
                            "name": "",
                            "key": "",
                            "local": "",
                            "cssclass": "emptytemlate",
                            "lastdate": 0
                        });
                    }
                    this.templates.push(templateCurr);
                    this.templateCurr = this.templates[this.templates.length - 1];
                }

                if (!legend)
                    legend = layer.classifier.getlegend();

                // Заголовок
                this.bodyselectorTemplate = parent.attr('id') + '_body';

                parent[0].appendChild(GWTK.Util.createHeaderForComponent({
                    map: this.map,
                    name: w2utils.lang("Layouts") + ': ' + this.templateCurr.layer.alias,
                    callback: GWTK.Util.bind(function () {
                        _that.hideTemplate();
                    }, this)
                }));

                // Перерисуем линейку макетов
                this.refreshTemplate();

            },

            // Скрыть шаблон
            hideTemplate: function () {
                this.writeCookie();
                //$('#' + this.bodyselectorTemplate).remove();
                $(this.parent).empty();
                $(this.parent).css('display', 'none');
            },

            // Перерисуем линейку макетов
            refreshTemplate: function () {
                var parent = $(this.parent);
                $('#' + this.bodyselectorTemplate).remove();

                // Выведем шаблон в окно
                var htmltds = '', template = this.templateCurr, _that = this;
                for (var i = 0; i < template.records.length; i++) {
                    htmltds +=
                        '<td width="32px" height="32px" >'
                                + '<div id="' + template.layer.idselector + '_' + i.toString() + '" class="button-clickable ' + template.records[i].cssclass + '" style="border: solid grey 1px !important; width:32px; height:32px;"'
                                + ' title = "' + template.records[i].name + '" ' + '>'
                        + '</td>';
                }

                var html =
                    '<div id="' + this.bodyselectorTemplate + '" style="padding-left: 5px;">' +
                        '<table>' +
                            '<tr id="templates">' +
                                htmltds +
                            '</tr>' +
                        '</table>' +
                    '</div>';
                parent.append(html);

                // Определим что лежит в шаблоне
                function gettemplaterecord(event) {
                    var id = $(event.target).attr('id');
                    if (id) {
                        var mass = id.split('_');
                        if (mass && mass.length > 1) {
                            var curr = -1, lastdate = 0,
                                record = _that.templateCurr.records[parseInt(mass[mass.length - 1])];
                            if (record && record.key != '')
                                record.lastdate = new Date().getTime();
                            if (record.cssclass != 'emptytemlate') {
                                if (_that.fn_start) {
                                    _that.fn_start({
                                        key: record.key,
                                        code: record.code,
                                        text: record.name,
                                        local: record.local,
                                        img: record.cssclass,
                                        bsdlayer: record.bsdlayer
                                    });
                                    _that.activeTemplateRecord(record.key, true);
                                }
                            }
                        }
                    }

                }

                for (var i = 0; i < template.records.length; i++) {
                    $('#' + template.layer.idselector + '_' + i.toString()).click(gettemplaterecord);
                }

            },

            // Обновить запись в шаблоне
            setTemplateRecord: function (node) {
                if (!node) return;

                // Назначим запись шаблонy
                var template = this.templateCurr,
                    curr = 0;
                if (template) {
                    var lastdate = template.records[curr].lastdate;
                    for (var i = 0; i < template.records.length; i++) {
                        if (template.records[i].key == node.key || template.records[i].lastdate == 0) {
                            curr = i;
                            break;
                        }
                        else {
                            if (lastdate > template.records[i].lastdate) {
                                lastdate = template.records[i].lastdate;
                                curr = i;
                            }
                        }
                    }
                    template.records[curr].lastdate = new Date().getTime();
                    template.records[curr].key = node.key;
                    template.records[curr].code = node.code;
                    template.records[curr].name = node.text;
                    template.records[curr].local = node.local;
                    template.records[curr].bsdlayer = node.bsdlayer;
                    if (node.img)
                        template.records[curr].cssclass = node.img.replace(' legend_img_editor', '');

                    this.templateRecordCurr = template.records[curr];
                    this.refreshTemplate();
                }

            },

            // Включить/отключить кнопку
            activeTemplateRecord: function (key, active) {
                var indexCurr = -1;
                if (this.templateCurr && this.templateCurr.records) {
                    this.templateRecordCurr = this.templateCurr.records.find(
                        function (element, index, array) {
                            if (element.key == key) {
                                indexCurr = index;
                                return element;
                            }
                        });
                }

                if (indexCurr >= 0) {
                    var el = '#' + this.templateCurr.layer.idselector + '_' + indexCurr.toString(),
                        $el = $(el);
                    if (active) {
                        GWTK.DomUtil.setActiveElement(el);
                        $el.css('opacity', 1.0);
                    }
                    else {
                        GWTK.DomUtil.removeActiveElement(el);
                        $el.css('opacity', '');
                    }
                }
            },

            // Смена обработчика
            onChangeAction: function (event) {
                if (!event.mapobject) return;
                if (event.operation == 'setaction') {
                    this.activeTemplateRecord(event.mapobject.key, true);
                }
            },

            // Закрытие обработчика
            onCloseAction: function () {
                if (!this.templateRecordCurr)
                    return;

                this.activeTemplateRecord(this.templateRecordCurr.key, false);
            },

            getId: function (id) {
                if (id) {
                    id = GWTK.Util.decodeIdLayer(id);
                    return ((id.replace(/\\/g, '_')).replace(/\./g, '_')).replace(/#/g, '_');
                }
            }
        };

    };


/************************************* Соколова  ***** 26/09/18 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2018              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                     Выбор нескольких точек объекта               *
*                                                                  *
*******************************************************************/


    if (window.GWTK) {

        /**
         * Выбор ближайших точек на объекте
         * Выбор производится щелчком указателя на карте
         * Между указателем и точкой на объекте отображается пунктирная линия
         * @class GWTK.SelectNearesObjectPoints
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
         *                                      type {string} 'point' или 'normal', в зависимости от положения точки
         * option.name (String) - расширение к названию обработчика
         */
        GWTK.SelectNearesObjectPoints = function (task, map, options) {

            this.toolname = 'selectNearesObjectPoints';
            this.error = true;

            this.map = map;
            if (!this.map || this.map instanceof GWTK.Map == false)
                return;
            this.task = task;

            this.options = options || {};

            // Обязательный параметр объект - экземпляр GWTK.mapobject
            if (typeof this.options.mapobject !== 'object' || !(this.options.mapobject instanceof GWTK.mapobject)) {
                throw 'GWTK.SelectNearesObjectPoints: Ошибка! Объект не указан или не является объектом карты.';
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

        GWTK.SelectNearesObjectPoints.prototype = {

            clear:function(){
                this.selectObjectPoints = [];
                this.NearestPointAction = null;
            },

            destroy: function () {
                // Класс отрисовки объектов удалить
                this.drawSelectFeatures.destroy();
                this.clear();
            },

            start: function(){
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
                    // this.NearestPointAction.close();
                    this.clear();
                }
            },

            /**
               * Запустить процесс выбора одной точки объекта
               * @method setNearestPointAction
               * @param nearestPointAction {Object}  Переменная для хранения action
               * @param mapobject {Object}  Объект карты, на котором выбирается точка
               * @param fn_callback {Function}  - callback функция
               */
            // ===============================================================
            setNearestPointAction: function (mapobject, fn_callback) {
                this.map.statusbar.set(w2utils.lang("Select point") + " " + (this.selectObjectPoints.length + 1) + '...');

                this.NearestPointAction = new GWTK.NearestPointAction(this.task, this.map, {
                //nearestPointAction = new GWTK.NearestPointAction(this.task, this.map, {
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
                    // var mapobject = this.options.mapobject;
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

    };




    /************************************* Соколова  ***** 09/08/18 ****
     *                                                                  *
     *              Copyright (c) PANORAMA Group 1991-2018              *
     *                       All Rights Reserved                        *
     *                                                                  *
     ********************************************************************
     *                                                                  *
     *                      Дополнительная панель                      *
     *                                                                  *
     *******************************************************************/


    if (window.GWTK) {

        // Режим на расширенной панели
        GWTK.MapeditExtendMethod = {
            "name": "",         // название
            "id": "",           // идентификатор
            "fn_start": "",     // функция старта режима
            "fn_stop": "",      // функция завершения режима
            "cssclass": ""      // класс изображения на кнопке
        };

        GWTK.MapeditExtendParam = {
            "title": "",          // Заголовок панели
            "editobject" : "",    // Редактируемый объект
            "methods": [],        // Массив объектов GWTK.MapeditExtendMethod
            "fn_start": "",     // функция старта - вызывается после открытия панели
            "fn_stop": ""      // функция завершения - вызывается после закрытия панели
        };

        // класс создания дополнительных панелей
        GWTK.MapeditExtendMethods = function (map, parent, param) {

            this.toolname = 'mapeditextend';
            this.error = true;

            this.map = map;
            if (!this.map || this.map instanceof GWTK.Map == false)
                return;
            this.parent = (parent) ? parent : this.map.mapPane;

            this.param = {};
            if (typeof param === 'object') {
                // расширение настроек графики
                $.extend(this.param, param);
            }

            this.error = false;
            this.ourMethods = false;
            this.bodyselector = $(this.parent).attr('id') + '_' + GWTK.Util.randomInt(150, 200);
            this.onClickMethod = GWTK.Util.bind(this.onClickMethod, this);

        };

        GWTK.MapeditExtendMethods.prototype = {

            destroy: function () {
                this.hide();
                $(this.parent).remove();
            },

            // назначить методы
            set: function (param, visible, aligpanel) {
                this.hide();

                // $(this.map.eventPane).on('GWTK.mapeditorTask', this.onChangeAction);
                // $(this.map.eventPane).on('closeaction', this.onCloseAction);

                if (!param || typeof param !== 'object' || !param.methods || param.methods.length == 0)
                    return;
                var parent = $(this.parent), _that = this;

                this.param = {};
                if (typeof param === 'object') {
                    // расширение настроек графики
                    $.extend(this.param, param);
                }

                if (visible) {
                    parent.css('display', 'block');
                }
                parent.css('left', $(aligpanel).css('left'));
                parent.draggable({ containment: "parent" });

                // Заголовок
                parent[0].appendChild(GWTK.Util.createHeaderForComponent({
                    map: this.map,
                    name: this.param.title ? this.param.title : '',
                    callback: GWTK.Util.bind(function () {
                        _that.hide();
                    }, this)
                }));

                // Перерисуем линейку макетов
                this.refresh();

            },

            // Скрыть
            hide: function () {
                // Закрыть обработчик
                if (this.currentSelector){
                    $('.' + this.currentSelector).click();
                }
                // $(this.map.eventPane).off('GWTK.mapeditorTask', this.onChangeAction);
                // $(this.map.eventPane).off('closeaction', this.onCloseAction);
                $(this.parent).empty();
                $(this.parent).css('display', 'none');
                if (this.param.fn_stop) {
                    this.param.fn_stop();
                }
            },

            // Перевывести режимы
            refresh: function () {
                if (this.param.fn_start) {
                    this.param.fn_start();
                }

                var parent = $(this.parent), len;
                $('#' + this.bodyselector).remove();

                // Выведем шаблон в окно
                var htmltds = '',
                    widthbutton = 32;

                for (var i = 0; i < (len = this.param.methods.length); i++) {
                    htmltds +=
                        '<td width="' + widthbutton.toString() + '"px" height="' + widthbutton.toString() + '"px" >'
                        + '<div id="' + (i+1).toString() + '" class="button-clickable control-button-edit-methodExt control-button-edit ' + this.param.methods[i].cssclass + '" style="border: solid grey 1px !important;"'
                        + ' title = "' + this.param.methods[i].name + '" ' + '>'
                        + '</td>';
                }

                var html =
                    '<div id="' + this.bodyselector + '" style="padding-left: 5px;">' +
                    '<table>' +
                    '<tr id="methods">' +
                    htmltds +
                    '</tr>' +
                    '</table>' +
                    '</div>';
                parent.append(html);
                parent.width(widthbutton * this.param.methods.length + parseInt(parent.css('padding-left')) * 2 );
                var el =  $(this.parent).find('#methods');
                for (var i = 0; i < len; i++) {
                    $(el).find('#' + (i + 1).toString()).click(this.onClickMethod);
                }

            },

            /**
             * onClickMethod - событие при нажатии на кнопку режима
             * @param event
             */
            onClickMethod:function(event){
                var id = $(event.target).attr('id');
                if (id > 0) {
                    id = parseInt(id) - 1;
                    // Если кнопка нажата, но не та, сперва отключить режим
                    if (this.currentSelector  && this.param.methods[id].cssclass !== this.currentSelector ) {
                        this.stop();
                        // var id_old = $('.' + this.currentSelector).attr('id');
                        // if (id_old) {
                        //     id_old = parseInt(id_old) - 1;
                        //     if (this.param.methods[id_old].fn_stop) {
                        //         this.param.methods[id_old].fn_stop(this.currentSelector);
                        //     }
                        //     this.activeMethod(this.currentSelector, false);
                        // }
                    }

                    if (GWTK.DomUtil.isActiveElement('.' + this.param.methods[id].cssclass) == false) {
                        this.activeMethod(this.param.methods[id].cssclass, true);
                        if (this.param.methods[id].fn_start) {
                            this.param.methods[id].fn_start(this.param.methods[id]);
                        }
                    }
                    else {
                        if (this.currentSelector) {
                            this.stop();
                            // this.activeMethod(this.param.methods[id].cssclass, false);
                            // if (this.param.methods[id].fn_stop) {
                            //     this.param.methods[id].fn_stop(this.param.methods[id]);
                            // }
                        }
                    }

                }

            },


            // Включить/отключить кнопку
            activeMethod: function (selector, active) {
                var cssselector = (selector) ? '.' + selector : null;
                if (active && selector) {
                    this.currentSelector = selector;
                }

                var $el = $(cssselector);
                if (active) {
                    GWTK.DomUtil.setActiveElement(cssselector);
                    $el.css('opacity', 1.0);
                }
                else {
                    GWTK.DomUtil.removeActiveElement(cssselector);
                    $el.css('opacity', '');
                    this.currentSelector = null;
                }
                return true;
            },

            /**
             * stop - завершение работы режима
             */
            stop: function(){
                var id = $('.' + this.currentSelector).attr('id');
                if (id) {
                    id = parseInt(id) - 1;
                    if (this.param.methods[id].fn_stop) {
                        this.param.methods[id].fn_stop(this.param.methods[id]);
                    }
                    this.reset();
//                    this.activeMethod(this.currentSelector, false);
                }
            },

            /**
             * reset - сброс режима
             */
            reset: function(){
                this.activeMethod(this.currentSelector, false);
            }

            // // Запрос об отмене операции
            // isAbort:function(fn_callback){
            //     if (!this.isShow) {
            //         return true;
            //     }
            //     if (this.abortConfirm) {
            //         return;
            //     }
            //     if (!this.currentSelector){
            //         if (fn_callback){
            //             this.hide();
            //             fn_callback();
            //         }
            //         return;
            //     }
            //
            //     var id, $el = $('.' + this.currentSelector);
            //     if (id = $el.attr('id')) {
            //         this.abortConfirm = true;
            //         var name = this.param.methods[parseInt(id) - 1], _that = this;
            //         w2confirm(w2utils.lang("Cancel operation ") + this.param.methods[parseInt(id) - 1].name + "? ", w2utils.lang("Map editor"),
            //             function (answer) {
            //                 _that.abortConfirm = false;
            //                 if (answer == 'Yes') {
            //                     if (_that.currentSelector){
            //                         if (fn_callback) {
            //                             _that.hide();
            //                             fn_callback();
            //                         }
            //                         else {
            //                             $el.click();
            //                         }
            //                     }
            //                 }
            //         });
            //     }
            // }

        };

    }


}
