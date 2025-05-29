/**************************************** Патейчук В.К.  11/06/20 ***
 **************************************** Соколова Т.О.  24/01/19 ***
 **************************************** Нефедьева О.А. 04/03/21 ***
 **************************************** Помозов Е.В.   06/04/21 ***
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Компонент "Объекты слоя"                     *
 *                                                                  *
 *******************************************************************/

import RequestServices, { ServiceType } from '~/services/RequestServices';

if (window.GWTK) {
    // ===============================================================
    // Вход: map - карта
    //       target - контейнер (объект HTML, не JQuery!) в котором
    //       будет создана панель. Если контейнер не задан, то панель
    //       будет создана в окне карты
    // ===============================================================
    GWTK.objectList = function(map, target) {
        this.toolname = 'objectlist';
        this.map = map;
        if (!this.map) {
            console.log("GWTK.objectList. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.pane = null;                               // панель - объект HTML
        this.$pane = null;                              // панель - объект JQUERY
        this.bt = null;
        this.ind = 0;                                   // идентификатор вкладки на панели (имя слоя)
        this.wfs = null;                                // запросы WFS
        this.selectedFeatures = null;                   // отобранные объекты карты
        this.panelName = 'objectlist-mapcontent-' + this.map.divID;
        this.selectedFeatures = this.map.selectedObjects; // отобранные объекты карты
        this.init(target);
    };

    GWTK.objectList.prototype = {

        /**
         * Инициализация компонента
         *
         * @param  {Object} target - контейнер, в котором создать компонент
         */
        init: function(target) {

            // создать панель
            this.createPane(target);
            // если контейнером является карта
            if (!target) {
                // добавить компонент в карту
                this.map.maptools.push(this);
            }

            this.initEvents();
            this.setResizable();
            // если не указана панель для компонентов, то доступно перетаскивание
            if (!this.map.options.controlspanel) {
                this.setDraggable();
            }
        },

        /**
         * Инициализация событий
         */
        initEvents: function() {
            var that = this;

            // обработка изменений размера панели контролов
            $(this.map.eventPane).on('resizecontrolspanel.' + this.toolname, function(event) {
                // изменить размеры своей панели
                that.resize();
            }.bind(this));

            this.map.on('openobjectlist', function( event ){
                console.log( event.layer );
                this.addListObjects({ name: '', xId: event.layer });
            }.bind(this) );
        },

        /**
         * Установить возможность перемещения панели
         */
        setDraggable: function() {
            if (!this.map)
                return;
            GWTK.panelUI({ draggable: true, $element: this.$pane, resizable: false });
        },

        /**
         * Установить возможность изменения размера панели
         */
        setResizable: function() {
            var that = this;
            $(this.pane).resizable({
                handles: 's,w,sw',
                resize: function(event, ui) {
                    ui.position.left = ui.originalPosition.left;

                    // изменить высоту контейнера вкладок
                    var panelH = that.$pane.height();
                    $('#' + that.map.divID + '_objectlist_tabs').css({ height: panelH - 30 });

                    // изменить высоту контейнера текущей вкадки
                    var layeridActive = w2ui[that.panelName].active.split('objectlist_tab_')[1]; // id слоя на текущей вкладке
                    var panelTabsH = $('#' + that.map.divID + '_objectlist_tabs').height();
                    $('#objectlist_tab_' + layeridActive).css({ height: panelTabsH - 30 });

                    // обновить грид
                    if (w2ui['objectlist_grid_' + layeridActive])
                        w2ui['objectlist_grid_' + layeridActive].resize();

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
                stop: function(event, ui) {
                    // if(w2ui[that.gridName])
                    //     w2ui[that.gridName].refresh();
                },
                create: function() {
                    $(this).parent().on('resize', function(e) {
                        e.stopPropagation();
                    });
                }
            });
        },

        /**
         * Изменить размер дочерних элементов по размеру панели
         */
        resize: function() {
            var tabActive = w2ui[this.panelName].active;
            if (!tabActive)
                return;
            var layeridActive = tabActive.split('objectlist_tab_')[1]; // id слоя на текущей вкладке
            // обновить грид
            if (w2ui['objectlist_grid_' + layeridActive])
                w2ui['objectlist_grid_' + layeridActive].resize();
        },

        /**
         * Создать кнопку в панели карты
         */
        createtoolbarsButton: function() {
            if (!this.map || !this.map.panes.toolbarPane || !this.pane)
                return;
            this.bt = GWTK.DomUtil.create('div', 'control-button control-button-objectlist clickable', this.map.panes.toolbarPane);
            this.bt.id = 'objectlist';
            this.bt.title = w2utils.lang('Objects on a layer');
            if (this.pane.id) {                        // идентификатор панели
                this.bt._pane = this.pane.id;
                this.bt.disabled = false;
            }

            $(this.bt).attr('toolname', this.toolname);
            var maphandlers = this.map.handlers;
            // обработчик клика на кнопке (включить режим, показать панель)
            $(this.bt).on("click", function(event) {
                if (maphandlers) maphandlers.toolbar_button_click(event);
            });

            return;
        },

        /**
         * Создать панель
         *
         * @param  {Object} target - контейнер для создания панели, если не задан,
         *                     панель создается в окне карты
         */
        createPane: function(target) {
            var map = this.map, tool = this;

            // создать панель в окне карты
            if (!target) {
                // если указана панель для компонентов, то создаем в ней
                if (this.map.options.controlspanel) {
                    this.pane = GWTK.DomUtil.create('div', 'map-panel-def-flex objectlist-panel-flex', this.map.mapControls);
                }else{
                    this.pane = GWTK.DomUtil.create('div', 'map-panel-def objectlist-panel', this.map.mapPaneOld);
                }
                this.$pane = $(this.pane);

                // заголовок панели
                this.pane.appendChild(
                    GWTK.Util.createHeaderForComponent({
                            map: map,
                            callback: GWTK.Util.bind(function(e) {
                                this.hidePane();
                            }, this),
                            name: w2utils.lang("Objects on a layer")
                        }
                    ));
            }else{
                // создать панель в указанном контейнере
                this.pane = GWTK.DomUtil.create('div', 'objectlist-panel', target);
                this.$pane = $(this.pane);
            }
            this.id = this.map.divID + '_objectsOfLayerPane';
            this.pane.id = this.id;
            this.hidePane();

            // контейнер с закладками
            this.objectListTabId = this.map.divID + "_objectlist_tabs";
            this.$pane.append('<div id="' + this.objectListTabId + '" class="objectlist_tabs"></div>');
            $('#' + this.objectListTabId).w2tabs({
                name: this.panelName,
                onClose: function(e) {
                    if (w2ui[tool.panelName].tabs.length == 1) {
                        e.preventDefault();
                        return;
                    }
                    e.onComplete = function() {
                        var ind = this.get(e.target, true);
                        ind == 0 ? ind = 1 : ind = 0;
                        this.click(this.tabs[ind].id);
                    };
                }
            });

            return;
        },

        /**
         * Добавить вкладку с объектами для слоя
         *
         * @param  {Object} options  - объект с параметрами:
         *            options.xId - идентификатор слоя
         *            options.name - наименование вкладки
         */
        addListObjects: function(options) {
            if (typeof options == 'undefined') {
                this.hidePane();
                return;
            }
            // описание слоя для которого ищем объекты
			var layer = this.map.tiles.getLayerByxId(options.xId);
            if (!layer) {
                // нет такого слоя
                console.log('objectList.addListObjects: ' + w2utils.lang('No data layer: ') + options.xId);
                return;
            }
            //if(layer && layer.format && layer.format == 'svg'){
            if (layer && layer.getType() == 'svg' || layer.getType() == 'geomarkers') {
                w2alert(w2utils.lang("Failed to obtain a list of objects for a given layer"));
                return;
            }
            if (layer.options.selectObject == 0) {
                // выбор объектов запрещен
                console.log('objectList.addListObjects: ' + w2utils.lang('Selection of objects forbidden to layer: ') + options.xId);
                return;
            }

            // если наименование вкладки не задано, берем из описания слоя
            if (!options.name)
                options.name = layer.options.alias;

            // показать индикатор процесса
            GWTK.Util.showWait();

            this.ind = options.xId;

            // добавить контейнер вкладки
            var tab = document.getElementById('objectlist_tab_' + this.ind);
            if (!tab) {
                $('#' + this.objectListTabId).append('<div id="objectlist_tab_' + this.ind + '" class="tab">' +
                    '<div id="objectlist_grid_' + this.ind + '" class="objectlist_grid"> </div>' +
                    '</div>');
            }
            if (w2ui[this.panelName].get('objectlist_tab_' + this.ind) !== null) {
				console.log(w2utils.lang('Objects on a layer') + ' "' + layer.alias + '" ' + w2utils.lang('have already been received!'));
				GWTK.Util.hideWait();
				if (!this.visible()) {
				  this.showPane();
				}
				w2ui[this.panelName].click('objectlist_tab_' + this.ind);
				return;
			}
            // добавить вкладку
            w2ui[this.panelName].add({
                id: 'objectlist_tab_' + this.ind,
                caption: options.name,
                hint: options.name,
                closable: true
            });
            var that = this;
            if (w2ui[this.panelName].handlers.length == 0) {       // 01/04/2016
                w2ui[this.panelName].on('click', function(event) {
                    $('#' + that.id + ' .tab').hide();
                    $('#' + that.objectListTabId + ' #' + event.target).show();

                    // 01/04/2016
                    var grid = event.target.split("objectlist_tab_");
                    if (w2ui["objectlist_grid_" + grid[1]])
                        w2ui["objectlist_grid_" + grid[1]].refresh();

                    return;
                });
            }

            // сделать вкладку текущей
            w2ui[this.panelName].click('objectlist_tab_' + this.ind);
            this.getObjectsList(layer, true);

        },

		/**
         * Запросить объекты слоя
         *
         * @param  {Object} layer  - объект слоя
         * @param  {Boolean} show - показать панель
         */
		getObjectsList: function(layer, show) {
		    show = show || false;
            // определить фильтры слоя
            var parlayer = GWTK.Util.getParamsFromURL(layer.options.url);
            var typenames = parlayer['typenames']; // типы объектов
            var codelist = parlayer['codelist'];   // коды объектов

            // заполнить параметры запроса к сервису
            var param = {
                'LAYER': layer._idLayerXml(),
                'METRIC': 0,
                'OBJLOCAL': '0,1,2,4'
            };
            if (typenames)
                param.layers[0].TYPENAMES = typenames;
            if (codelist)
                param.layers[0].CODELIST = codelist;
            if (Array.isArray(layer.options.semanticfilter) && layer.options.semanticfilter.length > 0) {
                param.PROPERTYNAME = layer.options.semanticfilter.join(',');
            }

            // выполнить запрос (получить список объектов)
            var url = GWTK.Util.getServerUrl(layer.options.url);
            if (!url) {
                console.log('objectList.addListObjects: ' + w2utils.lang('Error layer: ') + layer.xId);
                return;
            }
            if (url.endsWith('?')) {
                url = url.slice(0, url.length - 1);
            }

            var service = RequestServices.retrieveOrCreate( { url: url }, ServiceType.REST );
            service.getFeature( [ param ] )
            .then ((result) => {
                if (result.data.indexOf("<name>FILE</name>") != -1) {
                    const message = w2utils.lang('Too many objects in response. Continue?');
                    w2confirm( message, function btn(answer) {
                        if ( answer == 'No') {
                            GWTK.Util.hideWait();
                            console.log( 'ObjectList. ', w2utils.lang('Unable to create the list. Too many objects.') );
                        } else {
                            const begin = result.data.split( '<string>' );
                            const filePath = begin[ 1 ].split( '</string>' )[ 0 ];
                            service.getFile( { FILEPATH: filePath },
                                { url: url, responseType: 'text/xml' } )
                                .then ( (results) => {
                                    this._onDataLoaded( results.data );
                                    this.showPane();
                                })
                                .catch ( ( reason ) => {
                                    GWTK.Util.hideWait();
                                    console.log('mapSearchObjectsByIdList.', w2utils.lang('Failed to get data.'));
                                    console.log( reason );
                                });
                        }
                    }.bind(this) );
                } else {
                    this._onDataLoaded( result.data );
                    this.showPane();
                }
            })
            .catch((reason) => {
                this._onError(reason);
            });
        },

        /**
         * Добавить вкладку с объектами для слоя по geoJSON
         *
         * @param  {Object} options - объект с параметрами:
         *            options.xId - идентификатор слоя
         *            options.name - наименование вкладки
         * @param  {Object} json объекты в формате geoJSON
         */
        addListObjectsFromJson: function(options, json) {
            if (options == 'undefined') {
                this.hidePane();
                return;
            }

            // описание слоя для которого ищем объекты
            var layer = this.map.tiles.getLayerByxId(options.xId);
            if (!layer) {
                // нет такого слоя
                console.log('objectList.addListObjects: ' + w2utils.lang('No data layer: ') + options.xId);
                return;
            }
            if (layer.options.selectObject == 0) {
                // выбор объектов запрещен
                console.log('objectList.addListObjects: ' + w2utils.lang('Selection of objects forbidden to layer: ') + options.xId);
                return;
            }
            // если наименование вкладки не задано, берем из описания слоя
            if (!options.name)
                options.name = layer.options.alias;
            // показать индикатор процесса
            GWTK.Util.showWait();
            this.ind = options.xId + options.recid;
            // добавить контейнер вкладки
            var tab = document.getElementById('objectlist_tab_' + this.ind);
            if (!tab) {
                $('#' + this.objectListTabId).append(
                    '<div id="objectlist_tab_' + this.ind + '" class="tab">' + '<div id="objectlist_grid_' + this.ind
                    + '" class="objectlist_grid"> </div>' + '</div>');
            }
            // добавить вкладку
            w2ui[this.panelName].add({
                id: 'objectlist_tab_' + this.ind,
                caption: options.name,
                hint: options.name,
                closable: true
            });
            var that = this;
            if (w2ui[this.panelName].handlers.length == 0) {
                w2ui[this.panelName].on('click', function(event) {
                    $('#' + that.id + ' .tab').hide();
                    $('#' + that.objectListTabId + ' #' + event.target).show();
                    // 01/04/2016
                    var grid = event.target.split("objectlist_tab_");
                    if (w2ui["objectlist_grid_" + grid[1]])
                        w2ui["objectlist_grid_" + grid[1]].refresh();

                    return;
                });
            }
            // сделать вкладку текущей
            w2ui[this.panelName].click('objectlist_tab_' + this.ind);
            //Принудительно меняем параметры, если вкладка была создана ранее
            var wtab = w2ui[this.panelName].get('objectlist_tab_' + this.ind);
            if (wtab.caption != options.name)
                wtab.caption = options.name;
            if (wtab.hint != options.name)
                wtab.hint = options.name;
            w2ui[this.panelName].refresh('objectlist_tab_' + this.ind);
            // показать панель
            this.showPane();
            this.getGridFromJson(json, layer); // 01/04/2016
            GWTK.Util.hideWait();
        },

        /**
         * Заполнить таблицу объектов
         *
         * @param  {Object} jsonstring - список объектов в формате geojson
         * @param  {} layer
         */
        getGridFromJson: function(jsonstring, layer) {  // 01/04/2016
            var json = null;
            if (!jsonstring["features"])
                json = JSON.parse(jsonstring);
            else
                json = jsonstring;
            var features = json["features"];
            if (features.length == 0)
                return;
            var grid_col = [{
                field: 'id',
                caption: w2utils.lang('Identifier'),
                size: '80px',
                sortable: true,
                resizable: true
            }]; // колонки таблицы
            var grid_search = [{
                field: 'id',
                type: 'text'
            }]; // колонки для поиска
            var grid_rec = []; // записи таблицы
            var f_len = features.length, gid, semname, semvalue, sizecol, recobj = new Object();
            var layer;
            for (var i = 0; i < f_len; i++) {
                // описание объекта карты
                var elem = features[i];
                var properties = elem["properties"];
                gid = properties["id"];
                recobj = {
                    recid: i,
                    id: gid
                }; // описание объекта карты
                // разбор семантик объекта
                for (var elemObj in properties) {
                    // колонки таблицы
                    semname = elemObj;
                    sizecol = semname.length * 10;
                    if (sizecol < 80)
                        sizecol = 80;
                    if (!this.include(grid_col, {
                        field: semname,
                        caption: semname,
                        size: sizecol + 'px',
                        sortable: true,
                        resizable: true
                    })) {
                        grid_col.push({
                            field: semname,
                            caption: semname,
                            size: sizecol + 'px',
                            sortable: true,
                            resizable: true
                        }); // добавить колонку
                        grid_search.push({
                            field: semname,
                            caption: semname,
                            type: 'text'
                        }); // добавить колонку для поиска
                    }
                    // записи таблицы
                    semvalue = properties[elemObj];
                    recobj[semname] = semvalue;
                }
                // добавить запись с описанием объекта
                grid_rec.push(recobj);
                // добавить объект в список selectedFeatures
                //layer = GWTK.maphandlers.map.tiles.getLayerByGmlId(gid); // не нужен, т.к. теперь входной  // 01/04/2016
                //Добавить координаты центра в свойства
                json["features"][i]["properties"]["objectcentery"] = (json["features"][i]["bbox"][0] + json["features"][i]["bbox"][2]) / 2;
                json["features"][i]["properties"]["objectcenterx"] = (json["features"][i]["bbox"][1] + json["features"][i]["bbox"][3]) / 2;
                this.selectedFeatures.addJsonObject(json, i, layer);
            }
            //Если таблица уже есть, то очистить ее
            if (w2ui['objectlist_grid_' + this.ind]) {
                w2ui['objectlist_grid_' + this.ind].records = grid_rec;
                w2ui['objectlist_grid_' + this.ind].refresh();
                return;
            }
            ;
            // создать таблицу
            var selectedfeatures = this.selectedFeatures;
            $('#objectlist_grid_' + this.ind).w2grid({
                name: 'objectlist_grid_' + this.ind,
                columns: grid_col,
                records: grid_rec,
                searches: grid_search,
                show: {
                    toolbar: true,
                    footer: true
                },
                multiSearch: false,
                onSelect: function(event) {
                    var gmlid = this.records[event.index]['id'];
                    // показать объект на карте с позициоированием
                    selectedfeatures.drawobject(gmlid, true, true, true, true);                 // 01/04/2016
                }
            });

        },

        /**
         * Обработка ответа сервера
         *
         * @param  {} response
         * @param  {} context
         */
        _onDataLoaded: function(response) {
            if (!response) {
                GWTK.Util.hideWait();
                return;
            }

            // проверить ответ
            if (response.indexOf("Exception") != -1) {
                console.log('ERROR: objectList._onDataLoaded: ');
                console.log(response);
                GWTK.Util.hideWait();
                return;
            }

            // заполнить таблицу объектов
            this.getGrid(response);
            // скрыть индикатор процесса
            GWTK.Util.hideWait();
        },

        /**
         * Обработка ошибки сервера
         *
         * @param  {} response
         */
        _onError: function(response) {
            GWTK.Util.hideWait();
            w2alert(w2utils.lang("Failed to obtain a list of objects for a given layer"));
            console.log('ERROR: objectList._onError: ');
            console.log(response);
            //w2alert(response);
        },

        /**
         * Заполнить таблицу объектов
         *
         * @param  {Object} response - ответ сервера в формате XML
         */
        getGrid: function(response) {

            // проверить ответ на наличие ссылки на файл
            if (response.indexOf("<name>FILE</name>") != -1) {
                const begin = response.split('<string>');
                const end = begin[1].split('</string>');
                const filePath = end[0];
                console.log('filePath', filePath);
                var mess = w2utils.lang("Unable to create the list. Too many objects.");
                console.log('ERROR: objectList._onDataLoaded: ' + mess);
                $('#objectlist_tab_' + this.ind).html('<br /><br /><div style="display: table; text-align: center;">' + mess + '</div>');
                GWTK.Util.hideWait();
                return;
            }

            // преобразовать ответ в  XML-докумнет
            var xmlDoc = $.parseXML(response);
            var xml = $(xmlDoc);
            if (!xml.context.documentElement)
                return;
            var node = xml.context.documentElement.nodeName.toLowerCase();
            if (node.indexOf("featurecollection") == -1)
                return;
            var features = xml.context.documentElement.childNodes;
            if (features.length == 0)
                return;

            var grid_col = [{
                field: 'id',
                caption: w2utils.lang('Identifier').toUpperCase(),
                size: '120px',
                sortable: true,
                resizable: true
            }]; // колонки таблицы
            var grid_search = [{ field: 'id', type: 'text' }]; // колонки для поиска
            var grid_rec = []; // записи таблицы

            var semanticfilter = this.map.tiles.getLayerByxId(this.ind).options.semanticfilter;

            if (semanticfilter) {
                for (var i = 0; i < semanticfilter.length; i++) {
                    grid_col.push({ field: semanticfilter[i], sortable: true, resizable: true });
                    grid_search.push({ field: semanticfilter[i], type: 'text' });
                }
            }


            var f_len = features.length, gid, semname, semnameex, semvalue, sizecol, elemObj, recobj = new Object();
            var layer;
            for (var i = 0; i < f_len; i++) {
                if (features[i].nodeName.toLowerCase().indexOf('member') == -1)  // узел не является описанием объека, пропускаем
                    continue;
                // описание объекта карты
                var elem = features[i].firstChild;
                gid = $(elem).attr("gml:id");

                var objType = elem.nodeName.substr(elem.nodeName.indexOf(":") + 1, elem.nodeName.length);
                recobj = { recid: i, id: gid }; // описание объекта карты
                // разбор семантик объекта
                var obj_len = elem.childNodes.length;

                for (var jj = 0; jj < obj_len; jj++) {
                    elemObj = elem.childNodes[jj];
                    if (!elemObj || elemObj.childNodes.length > 1) // элемент с дочерними узлами, пропускаем
                        continue;
                    if ((elemObj.nodeName == 'gml:Polygon') || (elemObj.nodeName == 'gml:Point') || (elemObj.nodeName == 'gml:LineString')
						|| (elemObj.nodeName == 'gml:MultiGeometry') || (elemObj.nodeName == 'gml:metaDataProperty'))
                        continue; // элемент не является семантикой, пропускаем
                    semname = '';
					if (elemObj.nodeName.indexOf(":") !== -1) {
                    if (elemObj.nodeName.substr(0, elemObj.nodeName.indexOf(':')).toLowerCase() == 'gml') {
						semname = elemObj.nodeName.replace(':', '_');
					  }
					  else {semname = elemObj.nodeName.substr(elemObj.nodeName.indexOf(":") + 1, elemObj.nodeName.length);}}
					if (semname == '') continue;
                    var objTypeCode = objType + 'Code';
                    if (semname == objTypeCode) continue; // элемент не является семантикой, пропускаем
                    var fieldname = semname;
                    if (elemObj.attributes && elemObj.attributes.length > 0) {
                        semnameex = $(elemObj).attr('name');
                        if (!semnameex) {
                            continue;
                        }
                        semname = semnameex;
                    }
                    var caption = semname;
					if (fieldname.toLowerCase() == 'gml_name') {
					  caption = 'Object name';
					}
                    sizecol = semname.length * 10;
                    if (sizecol < 80)
                        sizecol = 80;

                    if (semanticfilter) {
                        if (semanticfilter.indexOf(fieldname) == -1 && fieldname !== 'name') {
                            continue;
                        }

                        var index = this.getItemIndexInArray(grid_col, 'field', fieldname);
                        if (fieldname == 'name') {
                            if (!index) {
                                grid_col.splice(1, 0, {
                                    field: fieldname,
                                    caption: w2utils.lang(caption).toUpperCase(),
                                    size: sizecol + 'px',
                                    sortable: true,
                                    resizable: true
                                }); // добавить колонку
                                grid_search.splice(1, 0, {
                                    field: fieldname,
                                    caption: w2utils.lang(caption).toUpperCase(),
                                    type: 'text'
                                }); // добавить колонку для поиска
                            }else{
                                grid_col[index].caption = w2utils.lang(caption).toUpperCase();
                                grid_col[index].size = sizecol + 'px';
                                grid_search[index].caption = w2utils.lang(caption).toUpperCase();
                            }
                        }else{
                            if (index) {
                                grid_col[index].caption = w2utils.lang(caption).toUpperCase();
                                grid_col[index].size = sizecol + 'px';
                                grid_search[index].caption = w2utils.lang(caption).toUpperCase();
                            }
                        }
                    }else{
                        if (!this.getItemIndexInArray(grid_col, 'field', fieldname)) {
                            grid_col.push({
                                field: fieldname,
                                caption: w2utils.lang(caption).toUpperCase(),
                                size: sizecol + 'px',
                                sortable: true,
                                resizable: true
                            }); // добавить колонку
                            grid_search.push({ field: fieldname, caption: w2utils.lang(caption).toUpperCase(), type: 'text' }); // добавить колонку для поиска
                        }
                    }

                    // записи таблицы
                    semvalue = elemObj.textContent; //semvalue = $(elemObj).text();
                    recobj[fieldname] = semvalue; // .replace(/"/g, '&quot;');
                }
                // добавить запись с описанием объекта
                grid_rec.push(recobj);
                // добавить объект в список selectedFeatures
                layer = this.map.tiles.getLayerByGmlId(gid);
                if (layer == null) {
                    console.log('objectList.getGrid: ' + gid);
                    continue;
                }
                this.selectedFeatures.addXmlElem(gid, layer.idLayer, elem);

            }

            // удалить пустые поля если есть
            for (var i = 0; i < grid_col.length; i++) {
                if (!grid_col[i]['caption']) {
                    grid_col.splice(i, 1);
                    grid_search.splice(i, 1);
                }
            }

            // вывод таблицы
            if (w2ui['objectlist_grid_' + this.ind]) {
                w2ui['objectlist_grid_' + this.ind].destroy();
            }
            var obj = this;
            // создать таблицу
            var map = this.map;
            $('#objectlist_grid_' + this.ind).w2grid({
                name: 'objectlist_grid_' + this.ind,
                columns: grid_col,
                records: grid_rec,
                searches: grid_search,
                //header: 'Список объектов',
                show: {
                    //header: true,
                    toolbar: true,
                    footer: true
                },
                multiSearch: false,
                onSelect: function(e) {
                    var gmlid = this.records[e.index]['id'];
                    var layer = map.tiles.getLayerByGmlId(gmlid);
                    map.selectedObjects.clear();
                    //map.handlers.clearselect_button_click();
                    GWTK.mapSearchObjectsByIdList(map, layer.idLayer, gmlid, true);
                },
                onClick: function(e) {
                    e.onComplete = function(e) {
                        var index = obj.getItemIndexInArray(this.records, 'recid', e.recid);
                        if (index !== -1) {
                            this.status(w2utils.lang('Record ID') + ': ' + (index + 1));
                        }
                    }
                },
				onReload: function(e) {
					var layer = map.tiles.getLayerByxId(obj.ind);
                    if (layer) {
					  if (typeof w2ui['objectlist_grid_' + obj.ind] !== 'undefined') {
						w2ui['objectlist_grid_' + obj.ind].clear();
					  }
					  obj.getObjectsList(layer);
					}
				}
            });

            // кнопка экспорта списка из HTML в Excel
            if (w2ui['objectlist_grid_' + this.ind].toolbar && w2ui['objectlist_grid_' + this.ind].toolbar.get('tb_sep_' + this.ind, true) != -1) {
                w2ui['objectlist_grid_' + this.ind].toolbar.remove('tb_sep_' + this.ind, 'btnSaveAsXLS_' + this.ind);
            }
            w2ui['objectlist_grid_' + this.ind].toolbar.add([
                { type: 'break', id: 'tb_sep_' + this.ind },
                {
                    type: 'button', id: 'btnSaveAsXLS_' + this.ind, caption: w2utils.lang('Export to Excel'),
                    hint: w2utils.lang('Export a list of objects to Excel'), icon: 'gwtk-icon-file-excel'
                }
            ]);

            var ObjList = this;
            // Обработчик кнопки экспорта таблицы в Excel
            if (!w2ui['objectlist_grid_' + this.ind].toolbar.onClick)
                w2ui['objectlist_grid_' + this.ind].toolbar.onClick = function(e) {
                    var pos = e.target.indexOf('btnSaveAsXLS_');
                    if (pos == -1) return;

                    GWTK.Util.showWait();

                    pos = e.target.indexOf('XLS_') + 'XLS_'.length;
                    var xId = e.target.substr(pos);
                    var grid = w2ui['objectlist_grid_' + xId];
                    var colls = grid.columns, j, collcount = grid.columns.length;
                    var rows = grid.records, i, rowscount = grid.records.length;
                    var table = document.createElement('table');

                    // заголовок таблицы
                    var head = document.createElement('tr');
                    table.appendChild(head);
                    for (j = 0; j < collcount; j++) {
                        if (colls[j].hidden) continue;
                        var td = document.createElement('td');
                        $(td).html(encodeURIComponent(colls[j].caption));
                        head.appendChild(td);
                    }

                    var maxRow = 1000; // максимальное число строк в таблице для выгрузки
                    var tblCount = Math.ceil(rowscount / maxRow); // число таблиц для выгрузки
                    var tblIndex = 0; // текущий индекс таблицы для выгрузки
                    var rowIndex = 0; // текущий индекс строки в таблице для выгрузки

                    ObjList.pnExportToExcelId = 'pnExportToExcelId' + GWTK.Util.randomInt(30000, 60000);
                    // окно со ссылками на файлы
                    if (tblCount > 1) {
                        w2popup.open({
                            title: w2utils.lang('Export to Excel'),
                            body: '<div class="w2ui-centered">' +
                                '<div style="margin-bottom:20px;">' + w2utils.lang('List of objects is divided into files of') + ' ' + maxRow + ' ' + w2utils.lang('entries') + ':</div>' +
                                '<div id="' + ObjList.pnExportToExcelId + '"></div>' +
                                '</div>'
                        });
                    }

                    // строки таблицы
                    for (i = 0; i < rowscount; i++) {
                        var tr = document.createElement('tr');
                        for (j = 0; j < collcount; j++) {
                            if (colls[j].hidden) continue;
                            var td = document.createElement('td');
                            var colfield = colls[j].field;
                            var colValue = rows[i][colfield];
                            if (!colValue) colValue = '';

                            $(td).html(encodeURIComponent(colValue));
                            tr.appendChild(td);
                        }
                        table.appendChild(tr);

                        rowIndex += 1;
                        // сохранить таблицу по частям
                        if ((tblCount > 1) && (rowIndex == maxRow)) {
                            rowIndex = 0;
                            tblIndex += 1;
                            // Создать ссылку на таблицу Excel
                            ObjList.createLinkXLS(table, xId + '_' + tblIndex + '.xls');

                            // создать шапку для новой таблицы
                            table = document.createElement('table');
                            head = document.createElement('tr');
                            table.appendChild(head);
                            for (j = 0; j < collcount; j++) {
                                if (colls[j].hidden) continue;
                                var td = document.createElement('td');
                                $(td).html(encodeURIComponent(colls[j].caption));
                                head.appendChild(td);
                            }
                        }
                    }

                    //window.open('data:application/vnd.ms-excel, <table>' + $(table).html() + '</table>');

                    if (tblCount > 1) { // список объектов разбит на несколько файлов, допишем последнюю часть
                        tblIndex += 1;
                        ObjList.createLinkXLS(table, xId + '_' + tblIndex + '.xls');
                    }else{ // весь список объектов в одном файле
                        var a = document.createElement('a');
                        a.download = xId + '.xls';
                        a.href = 'data:application/vnd.ms-excel;charset=utf-8,<html><head><meta%20charset="utf-8"></head><body><table>' +
                                $(table).html() + '</table></body></html>';
                        document.body.appendChild(a);     // для FireFox
                        a.setAttribute("type", "hidden"); // для FireFox
                        a.click();
                    }
                    GWTK.Util.hideWait();
                    e.preventDefault();
                };
        },

        /**
         * Создать ссылку на таблицу Excel и добавить ее на панель
         * Ссылка добавляется в панель pnExportToExcel
         *
         * @param  {String} table - таблица (строки таблицы <tr>...</tr>)
         * @param  {String} name - имя таблицы
         */
        createLinkXLS: function(table, name) {
            if (!table)
                return;

            // ссылка на файл
            var a = document.createElement('a');
            a.download = name;
            a.href = 'data:application/vnd.ms-excel;charset=utf-8, <html><head><meta%20charset="utf-8"></head><body><table>' + $(table).html() + '</table></body></html>';
            $(a).text(name);
            $(a).attr('class', 'linkXLS');
            $('#' + this.pnExportToExcelId).append(a);
            // разделитель
            var span = document.createElement('span');
            $(span).text(' ');
            $('#' + this.pnExportToExcelId).append(span);

            GWTK.Util.hideWait();
        },

        /**
         * Проверить существование объекта в массиве
         *
         * @param  {Array} arr - массив в котором проверяем
         * @param  {Object} obj - объект который проверяем
         * @return {Boolean} true - объект присутствует, false - нет
         */
        include: function(arr, obj) {
            obj = JSON.stringify(obj);
            for (var i = 0; i < arr.length; i++) {
                if (JSON.stringify(arr[i]) == obj)
                    return true;
            }
        },

        /**
         * Получить индекс элемента в массиве объектов
         *
         * @param  {Array} arr - массив
         * @param  {string} field - поле объекта
         * @param  {string} val - значение поля
         * @return {Boolean}  индекс элемента в массиве или false
         */
        getItemIndexInArray: function(arr, field, val) {
            var index = false;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i][field] == val) {
                    index = i;
                    break;
                }
            }
            return index;
        },

        /**
         * Очистить selectedFeatures
         */
        clearselectedFeatures: function() {
            if (!this.selectedFeatures) return;
            this.selectedFeatures.clear();
            return;
        },

        /**
         * Отобразить панель
         */
        showPane: function() {
            this.$pane.show();
            // развернуть общую панель для компонентов (если используется)
            // this.map.showControlsPanel();
        },

        /**
         * Скрыть панель
         */
        hidePane: function() {
            this.$pane.hide();
        },

        /**
         * Проверить видимость панели
         */
        visible: function() {
            if (this.pane.style.display && this.pane.style.display == 'none')
                return false;
            return true;
        },

        /**
         * Деструктор
         */
        destroy: function() {

            $(this.bt).off();
            $('#' + this.objectListIdClose).off();

            if (w2ui['objectlist_grid_' + this.ind]) {
                w2ui['objectlist_grid_' + this.ind].destroy();
            }
            if (w2ui[this.panelName]) {
                w2ui[this.panelName].destroy();

            }
            $('#' + this.objectListTabId).remove();
            $(this.panelName).remove();
            if (this.$pane.is('.ui-draggable'))
                this.$pane.draggable('destroy');
            this.$pane.empty();
            this.$pane.remove();
        }


    }
}
