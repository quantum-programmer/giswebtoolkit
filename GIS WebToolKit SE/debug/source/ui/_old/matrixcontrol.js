/*************************************** Патейчук В.К.  13/04/20 ****
 *************************************** Гиман Н.       05/11/18 ****
 *************************************** Нефедьева О.   13/04/20 ****
 *************************************** Соколова Т.О.  03/10/19 ****
 *************************************** Помозов Е.В.   09/03/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент "Значения матриц в точке"              *
 *                                                                  *
 *******************************************************************/
if(window.GWTK){
    GWTK.MatrixControl = function(map){
        this.map = map;
        this.toolname = "matrixcontrol";
        this.map.maptools.push(this);
        this.url                         = this.map.options.url;
        this.pane                        = null;                    //Панель
        this.button                      = null;                    //Кнопка
        this.activ                       = false;                   //Активность режима
        this.matrixLayerArray            = [];                      //слои, которые есть в приложении и опубликованы
        this.matrixTablePane             = null;                    //панель в которой находится таблица
        this.matrixLayerArrayGC          = [];                      //Массив объектов получ. через GetCapabilities
        this.matrixLayerArraySendRequest = [];                      //Слои для запросов данных
        this.matrixNodeHtmlObject        = {};                      //объект хранит в себе html объекты записей (сокращаем кол-во обращений к дом)
        this.fixedMouseCursor            = {x: 0, y: 0, t: 0};      //положение курсора фиксируется после отправки запроса по всем слоям
        this.tempSaveObj                 = {matrixbeforeid:{}};     //идентификаторы мпт
        this.removeMptParent             = {};
        this.gridName                    = "matrixgrid";
        this.init();
    };
    GWTK.MatrixControl.prototype = {
        init: function(){
            this.createButton();
            this.createPane();
            this.initMatrixLayer();
            this.setResizable();
            this.setDraggable();

            this.onVisibilitychanged = this.onVisibilitychanged.bind(this);
            this.onLayerlistchanged = this.onLayerlistchanged.bind(this);
            this.map.on('visibilitychanged', this.onVisibilitychanged);
            this.map.on('layerlistchanged', this.onLayerlistchanged);
        },

        /**
         * Признак активности компонента
         * @method isActive
         * @return {boolean}
         */
        isActive: function() {
            return $(this.button).hasClass('control-button-active');
        },

        /**
         * Обработчик события изменения видимости слоя
         * @method onVisibilitychanged
         * @param event {Object} объект события ,event.maplayer: {id: string, visible: boolean}
         */
        onVisibilitychanged: function( event ) {
            if ( !this.isActive() ) return;
            this.refreshLayerArray(event.maplayer.id, event.maplayer.visible);
        },

        /**
         * Обработчик события изменения состава слоев
         * @method onLayerlistchanged
         * @param event {Object} объект события ,event.maplayer: {id: string, act: 'remove'/'add'}
         */
        onLayerlistchanged: function( event ) {
            if ( !this.isActive() ) return;
            var detect = false;
            if(event.maplayer.act == 'remove') {
                this.refreshLayerArray(event.maplayer.id, false);
                // Удалить из matrixLayerArray
                for(var i = 0; i < this.matrixLayerArray.length; i++){
                    if(this.matrixLayerArray[i].xId == event.maplayer.id){
                        this.matrixLayerArray.splice(i, 1);
                        detect = true;
                        break;
                    }
                }
            } 
            if(event.maplayer.act == 'add'){
                var layer = this.map.tiles.getLayerByxId(event.maplayer.id);
                if(layer && layer.idLayer) {
                    var decodeLayer = GWTK.Util.decodeIdLayer(layer.idLayer), find = this.matrixLayerArrayGC.find(
                            function(element, index) {
                                if (decodeLayer == element.coverageid) {
                                    detect = true;
                                    return element;
                                }
                            });
                }
            }
            if (detect) {
                this.detectMatrixLayers();
            }
        },

        /**
         * Обработчик события mousemove
         * @method onLayerlistchanged
         * @param event {Object} объект события
         */
        onMousemove: function(event) {
            if ( !this.isActive() ) return;
            this.mouseMoveEvent(event, this);
        },

        //выключение режима
        destroyMatrixControl: function(){
            $(this.button).removeClass('control-button-active');
            $(this.pane).hide();
            this.activ = false;
        },

        destroy: function () {

            w2ui[this.gridName].destroy();

            this.map.off('layerlistchanged', this.onLayerlistchanged);
            this.map.off('visibilitychanged', this.onVisibilitychanged);
            this.map.off('mousemove', this.onMousemove);
            $('#close-matrix-pane').off();

            this.matrixLayerArray = [];

            if ($(this.pane).is('.ui-draggable'))
                $(this.pane).draggable('destroy');
            $(this.pane).resizable('destroy');

            $(this.button).off();
            $(this.button).remove();

            $(this.pane).empty();
            $(this.pane).remove();

        },

        //создание кнопки в тулбаре
        createButton: function(){
            this.button  = GWTK.DomUtil.create('div', 'control-button clickable control-button-radio control-button-matrix', this.map.panes.toolbarPane);
            this.button.id = "panel_button_matrix";
            this.button.title = w2utils.lang("Values of matrixes in point");
            var that = this;
            this.onMousemove = this.onMousemove.bind(this);
            $(this.button).on('click', function(event){
                if($(this).hasClass('control-button-active')){
                    $(this).removeClass('control-button-active');
                    $('#' + that.map.divID + '_matrixPane').hide('slow');
                    that.map.off({type:'mousemove', target: 'map'}, that.onMousemove);
                }
                else {
                    if(that.matrixLayerArray.length == 0){
                        console.log("Matrix layers not found");
                        return false;
                    }
                    $(this).addClass('control-button-active');
                    $('#' + that.map.divID + '_matrixPane').show();
                    that.map.on({type: 'mousemove', target: 'map'}, that.onMousemove);
                    w2ui[that.gridName].resize();
                }
                //активация режима (mousemove)
                that.activ = !that.activ;
            });

            $(this.button).hide();
        },
        //добавляет запись в панель UI ВХОД id будущего нода = идентификатору слоя
        addNodeInMatrixPane: function(id, alias, after, classForMpt){
            if(!id){
                console.log('Can not create node without id');
                return;
            }
            id = this.getRecId(id);
            w2ui[this.gridName].add({recid: id, layername: alias});
        },

        //удаление слоя из UI и matrixNodeHtmlObject идентификатор нода = идентификатору слоя
        removeNodeInMatrixPane: function(id){
            if(!id){
                console.log('Can not remove node without id');
                return;
            }
            // id = id.toLowerCase();
            id = this.getRecId(id);

            var removeid = '';
            if(this.tempSaveObj[id]){
                if(this.removeMptParent[id]){
                    delete this.removeMptParent[id];
                }
                for(var key in this.tempSaveObj[id]){
                    w2ui[this.gridName].remove(key);
                    delete this.tempSaveObj[id][key];
                }
                w2ui[this.gridName].remove(id);
            }else{
                w2ui[this.gridName].remove(id);
            }
        },

        //обновить массив слоев для запроса при включении выключении слоев даляет или добавляет в массив
        refreshLayerArray: function(id, visible){
            var index = null;
            if(!visible){
                index = this.map.tiles.indexOfxIdInArray(this.matrixLayerArraySendRequest, id);
                if(index != -1){
                    this.matrixLayerArraySendRequest.splice(index, 1);
                    var nId = this.map.tiles.getLayerByxId(id);
                    if (nId) this.removeNodeInMatrixPane(nId.idLayer);
                }
            }else{
                if(visible){
                    var stop = true;
                    for(var j = 0; j < this.matrixLayerArraySendRequest.length; j++){
                        if(id == this.matrixLayerArraySendRequest[j].xId){
                            stop = false;
                        }
                    }
                    if(stop){
                        for(var i = 0; i < this.matrixLayerArray.length; i++){
                            if(this.matrixLayerArray[i].xId == id){
                                this.matrixLayerArraySendRequest.push(this.matrixLayerArray[i]);
                                this.addNodeInMatrixPane(this.matrixLayerArray[i].idLayer, this.matrixLayerArray[i].alias);
                                break;
                            }
                        }
                    }
                }
            }
        },

        //Инициализация матриц функция отправляет запрос к серверу => получает идентификатор => сопоставляет со слоями в приложении
        initMatrixLayer: function(){
            if (!this.url) return;
            var that = this;

            var setting = {
                method: "POST",
                url: that.url + "?SERVICE=WCS&REQUEST=GetCapabilities&VERSION=2.0.1",
                dataType: 'html',
                success: function (data) {
                    var $doc = $.parseXML(data);
                    var $features = $('wcs\\:CoverageSummary, CoverageSummary', $doc);
                    $features.each(function () {
                        var $this = $(this);
                        that.addMatrixLayer($this.find('wcs\\:coverageid, coverageid').text(), $this.find('ows\\:LowerCorner, LowerCorner').text(), $this.find('ows\\:UpperCorner, UpperCorner').text());
                    });
					that.detectMatrixLayers();
				},
                error: function (data) {
					console.log(data);
				}
            };
            if (this.map.getToken()) {
                setting.beforeSend = function (xhr) {
                    xhr.setRequestHeader(GWTK.AUTH_TOKEN, that.map.getToken());
                }
            }

            if (this.map.authTypeServer(that.url) || this.map.authTypeExternal(that.url)){
                setting.xhrFields = { withCredentials: true };
            }

            //получаем JSON объект со списком слоев матриц ВХОД XML => JSON
            $.ajax(setting);
        },

		detectMatrixLayers: function() {
			var that = this;
                    for(var j = 0; j < that.matrixLayerArrayGC.length; j++){
				if(that.matrixLayerArrayGC[j]['wasadd'] === false){
                        var layer = that.map.tiles.getLayerByIdService(that.matrixLayerArrayGC[j].coverageid);
                        if(layer !== ''){
						that.matrixNodeHtmlObject[that.matrixLayerArrayGC[j]['coverageid']] = layer;
						that.matrixLayerArrayGC[j]['wasadd'] = true;
                            that.matrixLayerArray.push(layer);
                            if(layer.visible){
                                that.matrixLayerArraySendRequest.push(layer);
                                that.addNodeInMatrixPane(layer.idLayer, layer.alias);
                            }
                        }
                    }
			}

			if(that.matrixLayerArray.length === 0){
                $(that.button).hide();
				console.log('matrixcontrol: ' + w2utils.lang('no matrixes found!'));
                this.destroyMatrixControl();
            }
			else {
                if (!that.map.hasMenu())
                $(that.button).show();
            }
		},

        // Создать окно компонента
        createPane: function(){
            //окно компонента
            this.pane = document.createElement('div');
            this.pane.className += 'map-panel-def matrix-panel';
            this.pane.id = this.map.divID + '_matrixPane';

            GWTK.Util.createHeaderForComponent({
                map: this.map,
                parent: this.pane,
                context: this.toolname,
                name: w2utils.lang("Values of matrixes in point"),
                callback: function () { $('#panel_button_matrix').click(); return; }
            });

            this.gridPane = document.createElement('div');
            this.gridPane.className += ' matrix-control-grid-container';
            this.gridPane.style.height = ' 200px';
            this.pane.appendChild(this.gridPane);

            this.map.mapPaneOld.appendChild(this.pane);

            $(this.gridPane).w2grid({
                name: this.gridName,
                header: w2utils.lang("Values of matrixes in point"),
                show:{
                    header: false
                },
                columns: [
                    { field: 'value',    caption: w2utils.lang("Value"), size: '20%' },
                    { field: 'charname', caption: w2utils.lang("Characteristic"), size: '15%' },
                    { field: 'unit',     caption: w2utils.lang('Units'), size: '15%' },
                    { field: 'layername',caption: w2utils.lang("Layer name"), size: '100%' }
                ],
                records: []
            });

        },

        //посылаем запрос к серверу
        sendRequest: function(event){
            if(this.matrixLayerArraySendRequest.length <= 0){
                return false;
            }
            var point = GWTK.DomEvent.getMousePosition(event, this.map.panes.eventPane);
            var coord = this.map.tiles.getLayersPointProjected(point);
            var geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
            var that = this;
            var strID = '';
            var tempArr = [];
            var point2 = geo.toString();
            for(var i = 0; i < that.matrixLayerArraySendRequest.length; i++){
                tempArr.push(that.matrixLayerArraySendRequest[i].idLayer);
            }
            strID = tempArr.toString();
            
			if (this.map.getToken()) {
                var beforesend = function (xhr) {
                    xhr.setRequestHeader(GWTK.AUTH_TOKEN, this.map.getToken());
                }
            }
            //разбор xml ответа
			var settings = {
                url: that.url + "?RESTMETHOD=GETCOVERAGEPOINT&Point=" + point2 + "&layer=" + strID + "&service=wcs",
                method: "GET",
                dataType: 'html',
                //async: false,
                beforeSend: $.isFunction(beforesend) ? beforesend : undefined,
                success: function (data) {
                    try{
                        var obj = JSON.parse(data);
                    }
                    catch (err) {
                        console.log(err);
                    }
                    for(var key in obj){
                        if(obj[key]["mpt"]){                                                                    // если это мпт пройтись по дентификаторам
                            var mpt = obj[key]["mpt"];
                            for(var key2 in mpt){
                                that.updateValue(key, mpt[key2], {mpt: true, parentid: key, layername: key2});  // объединить слои (показать пользователю, что это группа)
                            }
                        }
                        else {
                            that.updateValue(key, obj[key], {mpt: false});                                      //обновить значения
                        }
                    }
                },
                error: function (data) {
                    console.log(data);
                }
            };
			
			if (this.map.authTypeServer(that.url) || this.map.authTypeExternal(that.url)){
                settings.xhrFields = { withCredentials: true };
            }
			
            $.ajax(settings);
            
            //если прошлись по всему списку, запоминаем положение курсора и время
            if(that.matrixLayerArraySendRequest.length == i){
                that.fixedMouseCursor.x = event.clientX;
                that.fixedMouseCursor.y = event.clientY;
                that.fixedMouseCursor.t = new Date().getTime();
            }
        },

        //обновить значение в точке
        updateValue: function(id, valueObj, mpt){
            // id = id.toLowerCase();
            var key = id;
            id = this.getRecId(id);
            //если это не мпт проект
            if(!mpt.mpt){                                                                       //если это не мпт то обновляем значение
                w2ui[this.gridName].set(id, {
                    value: valueObj.value == -111111 || valueObj.value == -32767000 ? "" : valueObj.value,
                    charname: this.getCharName(key, valueObj.name),
					unit: valueObj.unit == "0" ? "" : w2utils.lang(valueObj.unit)
				});
            }
            //если мпт
            if(mpt.mpt === true){
                var tempid = mpt.parentid + mpt.layername;                                      //временный идентификатор запишем в объект
                if(!this.removeMptParent[mpt.parentid.toLowerCase()]){                          //если мы еще не удаляли родительский узел МПТ то удалить
                    w2ui[this.gridName].remove(mpt.parentid.toLowerCase());                     //удаляем родительский узел так как для него нет значений а есть для дочерних слоев
                    this.removeMptParent[mpt.parentid.toLowerCase()] = true;                    //после удаления присваиваем признак того что удалили слой
                }
                if(!this.tempSaveObj[mpt.parentid.toLowerCase()]){                              //если нет такого МПТ записываем
                    this.tempSaveObj[mpt.parentid.toLowerCase()] = {};                          //создаем пустой объект в котором будут дочерние слои чтобы можно было удалить
                }
                if(!this.tempSaveObj[mpt.parentid.toLowerCase()][tempid.toLowerCase()]){        // если нет такого идентификатора в объекте нужно добавить
                    var layer = this.map.tiles.getLayerByIdService(mpt.parentid);               //проверяем родителя есть ли такой слой ?
                    if(layer){                                                                  //если нашли слой
                        this.addNodeInMatrixPane(tempid, mpt.layername + " (" + layer.alias + ")"/*layer.alias + " " + mpt.layername + ")"*/); //формируем алиас для пользователя
                        w2ui[this.gridName].set(id, {
                            value: valueObj.value == -111111 || valueObj.value == -32767000 ? "" : valueObj.value,
                            charname: w2utils.lang(valueObj.name),
                            unit: valueObj.unit == "0" ? "" : w2utils.lang(valueObj.unit)
                        });
                        this.tempSaveObj[mpt.parentid.toLowerCase()][tempid.toLowerCase()] = true;
                    }
                }else{
                    w2ui[this.gridName].set(tempid.toLowerCase(), {
                        value: valueObj.value == -111111 || valueObj.value == -32767000 ? "" : valueObj.value,
                        charname: w2utils.lang(valueObj.name),
                        unit: valueObj.unit == "0" ? "" : w2utils.lang(valueObj.unit)
                    });
                }
            }
        },

        /**
         * Добавляет идентификатор слоя в список доступных матриц на сервисе.
         * Метод необходимо вызывать до создания объекта слоя или его добавления/открытия в карте.
         *
         * @param id {string} идентификатор слоя на сервисе
         */
        addMatrixServiceLayerId: function(id) {

            var hasId = false;

            for (var i in this.matrixLayerArrayGC) {
                if (this.matrixLayerArrayGC[i].coverageid === id) {
                    hasId = true;
                    break;
                }
            }
            if (!hasId) {
                this.matrixLayerArrayGC.push({
                    coverageid: id,
                    wasadd: false
                });
            }
        },

        //перемещение панели
        setDraggable: function(){
            $(this.pane).draggable({
                containment: 'parent',
                cursor: "pointer"
            });
        },

        mouseMoveEvent:function(event, that){
            if(that.activ && !GWTK.movedrag().dragstart){
                var now = new Date().getTime();
                //интервал отправки запроса тестировался (работает)
                if(now - that.fixedMouseCursor.t <= 100){
                    //console.log(now - that.fixedMouseCursor.t);
                    return false;
                } else {
                    //если нет перемещения то запрос не отправляется
                    const Event = event.originalEvent;
                    if(Math.abs(that.fixedMouseCursor.x - Event.clientX) > 1 || Math.abs(that.fixedMouseCursor.y - Event.clientY) > 1){
                        that.sendRequest(Event);
                    }
                }
            }
        },

        //изменение размеров окна
        setResizable: function () {
            var that = this;
            var cont = $(that.gridPane);
            $(this.pane).resizable({
                handles: 's,w,sw',
                resize: function (event, ui) {
                    ui.position.left = ui.originalPosition.left;
                    cont.css({height: $(this).height() - $(cont.parent().find('.panel-info-header')).outerHeight(true)});
                    w2ui[that.gridName].resize();
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
                create: function () {
                    $(this).parent().on('resize', function (e) {
                        e.stopPropagation();
                    });
                }
            });
        },

        /**
         * Идентификатор для записи грида
         * @param id
         * @returns {*}
         */
        getRecId: function(id){
            if (id) {
                id = GWTK.Util.decodeIdLayer(id);
                id = (((id.replace(/\\/g, '_')).replace(/\./g, '_')).replace(/#/g, '_')).toLowerCase();
            }
            return id;
        },

        /**
         * Запрос названия харвактеристики
         * @param name
         */
        getCharName:function (key, name) {

            // Найдем матрицу в массиве
            var find = this.matrixLayerArrayGC.find(
                function(element, index){
                    if (element['coverageid'] == key && element.fn_getCharName) {
                        return element;
                    }
                });
            if (find && find.fn_getCharName && $.isFunction(find.fn_getCharName)) {
                return find.fn_getCharName(key, name);
            }

            return w2utils.lang(name);
        },

        /**
         * Добавление матрицы в набор данных  сервера wcs
         * @param wcsId - идентификатор слоя на сервисе
         * @param wcsLC - левыый нижний угол
         * @param wcsUC - правых верхний угол
         * @param fn_getCharName - Функция для отображения названия характеристики
         */
        addMatrixLayer: function(wcsId, wcsLC, wcsUC, fn_getCharName) {
            feature = {};
            if (wcsId) { // && options.wcsLC && options.wcsUC ) {
                // Сперва найдем в массиве matrixLayerArrayGC
                var find = this.matrixLayerArrayGC.find(
                    function (element, index) {
                        if (element['coverageid'] == wcsId)
                            return element;
                    });
                if (!find) {
                    feature['coverageid'] = wcsId;
                    if (wcsLC) {
                        feature['LowerCorner'] = wcsLC;
                    }
                    if (wcsUC) {
                        feature['UpperCorner'] = wcsUC;
                    }
                    if (fn_getCharName) {
                        feature.getCharName = fn_getCharName;
                    }
                    feature['wasadd'] = false;
                    this.matrixLayerArrayGC.push(feature);
                }
                else {
                    if (fn_getCharName) {
                        find.fn_getCharName = fn_getCharName;
                    }
                }
            }
        },

        /**
         * Удаление матрицы из набора данных сервера wcs
         * @param wcsId - идентификатор слоя на сервисе
         */
        removeMatrixLayer: function(wcsId) {
            if (wcsId) { // && options.wcsLC && options.wcsUC ) {
                for(var i = this.matrixLayerArrayGC.length-1; i >= 0; i--){
                    if (this.matrixLayerArrayGC[i]['coverageid'] == wcsId) {
                        this.matrixLayerArrayGC.splice(i,1);
                        this.removeNodeInMatrixPane(wcsId);
                        return;
                    }
                }
            }
        }

    }
}
