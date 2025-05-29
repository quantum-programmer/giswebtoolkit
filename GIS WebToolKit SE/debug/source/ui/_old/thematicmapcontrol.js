/********************************** Нефедьева О.А. **** 07/08/20 ****
 ********************************** Соколова Т.О   **** 13/08/19 ****
 ********************************** Гиман Н.       **** 08/10/19 ****
 ********************************** Патейчук В.К.  **** 20/05/20 ****
 ********************************** Помозов Е.В.   **** 12/03/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Компонент "Тематический слой"                 *
 *                                                                  *
 *******************************************************************/
if ( window.GWTK ) {
    /**
     * Компонент Создание тематического слоя
     * @class GWTK.ThematicMapControl
     * @constructor GWTK.ThematicMapControl
     * @param map {GWTK.Map} ссылка на карту
     * @param toolbar {Object} элемент родителя кнопки
     */
    GWTK.ThematicMapControl = function (map, toolbar) {
        if (!map) {
            console.log("ThematicMapControl." + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        this.toolname = "thematicmaps";
        this.map = map;                                                       // карта
        this.toolbar = toolbar || map.panes.toolbarPane;                      // родительская панель кнопки
        this.pane = null;                                                     // панель компонента
        this.paneHeader = "Thematic maps";                                    // заголовок панели
        this.active = false;                                                  // признак активного режима
        this.button = null;                                                   // кнопка вызова компонента
        this.closeButton = null;                                              // кнопка закрытия панели

        this.tabsName = this.toolname + "_tabs_" + this.map.divID;            // имя компонента TabControl
		this.tabsActive = 'layers';                                           // вкладка по умолчанию
        this.tabs_pane = '<div id="' + this.tabsName + '" class=""></div>';   // контейнер TabControl

        this.gridDataPane = null;                                              // панель таблицы Данные
        this.gridDataName = "grid_data_" + this.map.divID;                     // имя таблицы Данные
		
		this.buildChart = false;                                               // построить диаграмму после создания слоя

        this.layerSemantics = {};                                              // семантики слоев карты
        this.selectedFeatures = this.map.selectedObjects;                      // выбранные объекты карты

        this._run = 0;                                                         // признак выполнения запроса
        this.number = 0;                                                       // порядковый номер тематического слоя
        this.colors = [];                                                      // массив цветов для построения тематического слоя
        this.selectedLayers_Request = {};                                      // Список слоев для запроса всех объектов
        this.selectedLayers_FeatureCollection = {};                            // Объекты слоев (без геометрии)
		this.selectedLayers_Semantics = {};                                    // семантики слоев, сформированные для таблицы Данные
		this.themProject = {theme: []};                                        // проект тематических карт
		this.themProjectRequest = null;                                        // запрошенный через API проект тематических карт

        this.themeProjectRequestParam = null;                                  // параметры запроса объектов карты для создания тематического слоя по теме
		this.themeProjectObject = null;
        this.themeProjectCallback = null;                                      // адрес callback функции для API

        this.currentTheme = {"datagrid": {}, "viewgrid": {}, "id": 0};         // описание текущей темы

        this.treeParentId = "userlayers";                                     // id родительского узла в дереве состава слоев

        this.init();
    };

    GWTK.ThematicMapControl.prototype = {

        /**
         * Инициализация компонента
         *
         * @method init
         */
        init: function () {

            this.createButton();
            this.createPane();
            this.createCommandPane();
            this.initEvents();
            this.setResizable();
            // если не указана панель для компонентов, то доступно перетаскивание
			if(!this.map.options.controlspanel) {
                this.setDraggable();
            }

            this.map.maptools.push(this);
        },

        /**
         * Создать кнопку компонента в тулбаре
         *
         * @method createButton
         */
        createButton: function () {
            if ( !this.map )
                return;
            this.button = GWTK.DomUtil.create( 'div', 'control-button control-button-thematicmap clickable', this.toolbar );
            this.button.id = "panel_button_thematicmap" + '_' + this.map.divID;
            this.button.title = w2utils.lang( this.paneHeader );
        },

        /**
         * Создать главную панель и таблицы
         *
         * @method createPane
         */
        createPane: function () {

            if ( !this.map )
                return;

            // если указана панель для компонентов, то создаем в ней
            if (this.map.options.controlspanel) {
                this.pane = GWTK.DomUtil.create('div', 'map-panel-def-flex thematicmap-panel-flex ', this.map.mapControls);
            } else {
                this.pane = GWTK.DomUtil.create('div', 'map-panel-def thematicmap-panel', this.map.mapPaneOld);

                // положение в экране
                var el = $('#' + this.map.divID), tool = this;
                setTimeout(GWTK.Util.bind(function () {
                    var w = el.width();
                    var h = el.height();
                    this.pane.style.top = (h / 2 - $(this.pane).height() / 2) + "px";
                    this.pane.style.left = (w / 2 - $(this.pane).width() / 2) + "px";
                }, this), 100);
            }

            this.pane.id = this.map.divID + '_' + this.toolname;

            var head = GWTK.Util.createHeaderForComponent({
                map: this.map,
                name: w2utils.lang("Thematic maps"),
                parent: this.pane,
                context: this.toolname,
                minimizePanel: $(this.pane),
				minimizeIconClass: 'icon-mapthematic',
                callback: GWTK.Util.bind(function () { $(this.button).click(); }, this)
            });

            this.closeButton = $(head).find('.panel-info-close')[0];

            // создать панель вкладок
            this.createTabs();

            // создать грид Данные
            this.createDataGrid();

            // создать вкладку настроек (View)
            this.createTabView(null);

            // создать грид Проекты
            this.createProjectGrid();
            
            $(this.pane).hide();
        },

        /**
         * Создать грид данных семантики
         *
         * @method createDataGrid
         */
        createDataGrid: function () {
          // var tool = this;
          if (!w2ui[this.gridDataName]) {
			var tool = this;
            // таблица данных семантики
            $("#tab_data_grid_pane").w2grid({
                name: this.gridDataName,
                show: {
                    toolbar: true,
                    footer: true,
                    selectColumn: true,
                    lineNumbers: true
                },
                multiSearch: false,
                multiSelect: false,
                columns: [
                    { field: "semname", caption: w2utils.lang("Characteristic"), size: '20%', searchable: true, sortable: true },
                    { field: "minvalue", caption: w2utils.lang("Min value"), size: '20%', sortable: true },
                    { field: "maxvalue", caption: w2utils.lang("Max value"), size: '20%', sortable: true },
                    { field: "layername", caption: w2utils.lang("Layer"), size: '20%', searchable: true, sortable: true },
                    { field: "layerid", size: '20px', hidden: true, hideable: false },
                    { field: "semkey", size: '20px', hidden: true, hideable: false },
                    { field: "semtype", size: '2px', hidden: true, hideable: false },
                    { field: "rsc", size: '150px', hidden: true, hideable: false }
                ],
                searches: [
                    { field: "semname", type: 'text', caption: w2utils.lang("Characteristic") },
                    { field: "layername", type: 'text', caption: w2utils.lang("Layer") }
                ],
                records: [],
				onReload: function(e) {
					this.clear();
					
					if (w2ui['tab_layers_grid']) {
					  var xid = w2ui['tab_layers_grid'].getSelection();
					  if (xid.length > 0) {
					    //if (!tool.selectedLayers_FeatureCollection[xid[0]]) {
						  delete tool.selectedLayers_FeatureCollection[xid[0]];
						  tool.getAllObjects(w2ui['tab_layers_grid'].getSelection());
				        //}
					  }
					}
					
				}
            });

            w2ui[this.gridDataName].on('click', function (event) {
                event.onComplete = function () {
                    var sel = this.getSelection();
                    if ( !sel || sel.length == 0 ) {
                        this.header = '';
                        return;
                    }
                    var record = this.get(sel);
                    this.header = JSON.stringify({ "semkey": record.semkey, "rsc": record.rsc });
                }
            });
            w2ui[this.gridDataName].on('select', function (event) {
                event.onComplete = function () {
                    var sel = this.getSelection();
                    if (!sel || sel.length == 0) {
                        this.header = '';
                        return;
                    }
                    var record = this.get(sel);
                    this.header = JSON.stringify({ "semkey": record.semkey, "rsc": record.rsc, "layerid": record.layerid });
                }
            });
		  }
        },

        /**
         * Создать панель командных кнопок (создать, сохранить)
         *
         * @method createCommandPane
         */
        createCommandPane: function () {
            this.number = 1;
            // кнопка OK
            var elem = document.createElement('div');
            $(elem).html('<div class="thematic-control-inputs-container">' +
                           '<input type="text" class="control-button-thematicmap-name" id="thematicmap_name" name="thematicmap_name" title="' + w2utils.lang("Name of thematic layer") + '"/>&nbsp;' +
                           '<button id="thematicmap_ok" class="btn control-button-thematicmap-build" title="' + w2utils.lang( 'Build' ) + '">'+ w2utils.lang('Build') +' </button>' +
						   '<div class="control-button-thematicmap-chart"><input type="checkbox" id="thematicmap_chart" name="thematicmap_chart"/>' + w2utils.lang("Chart") + '</div>' +
                         '</div>');

            $(this.pane).append(elem);
            var $elem_name = $(this.pane).find("#thematicmap_name");
            $elem_name.val(w2utils.lang("Thematic layer") + " " + this.number);

            // обработчик клика кнопки OK
            $(this.pane).find("#thematicmap_ok").click(function () {
                w2utils.lock($(this.pane), w2utils.lang('Creating...'), false);
                setTimeout(this.onCreateThematicLayer, 300);
            }.bind(this));
			
			// включить построение диаграммы
			var tool = this;
			$(this.pane).find("#thematicmap_chart").change(function(e) {
				 tool.buildChart = $(this).is(':checked');
            });
			// показать флаг управления построением диаграммы
			$(document).on('pluginloaded.chart', function(e){
                if (e.plugin == 'chart') {
				  $(this.pane).find("div.thematic-control-inputs-container > div").show();
				}
			}.bind(this));
						
        },

        /**
         * Обработчик создания слоя по таблице
         *
         * @method onCreateThematicLayer
         * @param event {Object} Событие
         * @returns {Boolean} Возвращает `false`
         */
        onCreateThematicLayer: function ( event ) {

            var $elem_name = $( this.pane ).find( "#thematicmap_name" ),
                $name = $elem_name.val();
            if ( !$name )
                $name = w2utils.lang( "Thematic layer" ) + " " + this.number;

            this.createThematicLayer( $name, null );

            this.number++;
            $elem_name.val( w2utils.lang( "Thematic layer" ) + " " + this.number );

            w2utils.unlock($(this.pane));
            return false;
        },

        /**
         * Создать панель вкладок
         *
         * @method createTabs
         */
        createTabs: function () {
            if ( !this.map || !this.pane )
                return;
            $(this.pane).append(this.tabs_pane);

            var $tabs = $('#' + this.tabsName);

            var tool = this;

            $tabs.w2tabs({
                name: tool.tabsName,
                active: this.tabsActive,
                tabs: [],
                onClick: function (event) {
                    $('#' + tool.tabsName + ' .tab').hide();
                    $('#' + event.target).show();
                }
            });

            $tabs.append('<div id="layers" class="tab"><div id="tab_layers_grid"></div></div>');
            $tabs.append( '<div id="data" class="tab"><div id="tab_data_grid_pane" class="objectlist_grid" ></div></div>' );
            $tabs.append( '<div id="view" class="tab thematic-view-container"> ' +
                '<div class="thematic-view-selected-prop"><label id="view_Character"></label></div><div>&nbsp;</div>' +
                '<div class="thematic-view-gradation-count-container">' +
                '<label id="view_lbGradation">' + w2utils.lang( 'Gradations' ) + '</label> <input id="view_countGradation" class="thematic-view-gradation-count control-button-theme-project">&nbsp;' +
                '<button id="view_btnGradCountUpdate" class="btn control-button-theme-project" title="' + w2utils.lang( 'Update' ) + '">'+ w2utils.lang('Update') +' </button>' +
                '<div class="clickable" style="margin:5px;"></div>' +
                '<label id="view_lbMin">Minimum:</label> &nbsp;<label id="view_lbMax">Maximum:</label>' +
                '</div>' +
                '<div class="thematic-view-default-color-container">' +
                '<label id="view_lbColorDef">' + w2utils.lang( 'Color values are out of range' ) + '</label>&nbsp;' +
                '<input id="view_ColorDef" class="thematic-view-default-color" value="" />' +
                '</div>' +
                '<div id="view_gridGradation" class="gradations-grid thematic-control-view-grid-container">2</div>' +
                '</div>' );
            
            $tabs.append('<div id="projects" class="tab"><div id="projects_button_cont" class="projects_button_cont_class">' +
                '<button class="btn gwtk-icon-file-open control-button-theme-project" id="thematicmap_open" style="padding:5px 6px 6px 5px !important;" title="' + w2utils.lang("Open project") + '" >&nbsp;' + w2utils.lang("Open") + '</button>' +
                '<button class="btn gwtk-icon-file-save control-button-theme-project" id="thematicmap_save" style="padding:5px 6px 6px 5px !important;" title="' + w2utils.lang("Save project") + '" >&nbsp;' + w2utils.lang("Save") + '</button>' +
                '<button class="btn w2ui-icon-cross control-button-theme-project" id="thematicmap_close" style="padding:5px 6px 6px 5px !important;" title="' + w2utils.lang("Close project") + '" >&nbsp;' + w2utils.lang("Close") + '</button>' +
				'</div><div id="tab_projects_grid"></div></div>');

		    w2ui[ this.tabsName ].add( {
                id: 'layers',
                caption: w2utils.lang( 'Layers' ),
                onClick: function ( e ) {
                    var gridArray = [];
                    var layers = tool.map.tiles.getSelectableLayersEx();
                    for (var i = 0; i < layers.length; i++) {
                        var lay = tool.map.tiles.getLayerByxId(layers[i].id);                // 12/05/17
                        if (!lay || lay.getType() == 'svg' || lay.getType() == 'geomarkers')
                           continue;
                        if (lay.options && lay.options.semkeytheme){continue;}      // темслои пропускаем
                        gridArray.push({ recid: layers[i].id, layername: layers[i].alias });
                    }
                    $('#layers').show();
                    if (!w2ui['tab_layers_grid']) {
                        $("#tab_layers_grid").w2grid({
                            name: 'tab_layers_grid',
                            show: {
                                selectColumn: true,
                                lineNumbers: true
                            },
                            multiSelect: false,
                            columns: [
                                { field: 'layername', caption: w2utils.lang( 'Layer name' ), size: '100%' }
                            ],
                            records: gridArray,

                            onSelect: function ( event ) {
                                event.onComplete = function () {
                                    if (tool.isThemeSelected()){
                                        tool.themProjectRequest = null;
                                    }
                                    var xid = this.getSelection(), request = [];
                                    for (var i in xid){
                                        if (!tool.selectedLayers_FeatureCollection[xid[i]]){
                                            request.push(xid[i]);
                                        }
                                    }
                                    if (request.length > 1){
                                       var sel = request.pop();
                                       for (var j in request){
                                           var pos = xid.indexOf(request[j]);
                                           if (pos > -1){
                                               xid.splice(pos, 1);
                                           }
                                       }
                                       xid.push(sel);
                                    }
                                    else {
                                        if (xid.length == 1 && request.length == 1){
                                            request.length = 0;
                                        }
                                    }
                                    for (var i in xid){
                                        tool.selectedLayers_Request[xid[i]] = true;
                                    }

                                    // больше одного слоя не запрашиваем, сбросим лишние
                                    if (request.length > 0 ){
                                        for (var j in request){
                                            this.unselect(request[j]);
                                        }
                                        return;
                                    }
                                };
                            },
                            onUnselect: function ( event ) {
                                if(event && event.all){
                                    tool.selectedLayers_Request = {};
                                }
                                else {
                                    if (tool.selectedLayers_Request[event.recid]){
                                        delete tool.selectedLayers_Request[event.recid];
                                    }
                                    event.onComplete = function () {
                                        var xid = this.getSelection();
                                        for (var i in xid){
                                            tool.selectedLayers_Request[xid[i]] = true;
                                        }
                                    };
                                 }
                            }
                        } );
                    }
                }
			});
		
		    w2ui[this.tabsName].add({
                id: 'data',
                caption: w2utils.lang( 'Data' ),
                onClick: function ( e ) {
                    $('#layers').hide();
					e.onComplete = function(e) {
                      if (tool.isThemeSelected()) {
                        w2ui[tool.gridDataName].records = [tool.themProjectRequest.datagrid];
                        w2ui[tool.gridDataName].select(tool.themProjectRequest.datagrid.recid);
                        w2ui[tool.gridDataName].refresh();
                      }
                      else if (!$.isEmptyObject(tool.selectedLayers_Request)){
						var xid = w2ui['tab_layers_grid'].getSelection();
						if (xid.length > 0) {
						  w2ui[tool.gridDataName].clear();
						  if (!w2ui[tool.gridDataName].layerSelected) {
                            w2ui[tool.gridDataName].render();
							w2ui[tool.gridDataName].layerSelected = true;
						  }
						  if (!tool.selectedLayers_FeatureCollection[xid[0]]) {
							tool.getAllObjects(w2ui['tab_layers_grid'].getSelection());
						  }
						  else {
							w2ui[tool.gridDataName].records = tool.selectedLayers_Semantics[xid[0]];
							w2ui[tool.gridDataName].refresh();
							// сортируем по имени семантики
						    w2ui[tool.gridDataName].sort('semname', 'asc');
                            if ( w2ui[ tool.gridDataName ].header.length ) {
                              var saved = JSON.parse( w2ui[ tool.gridDataName ].header );
                              var recs = w2ui[ tool.gridDataName ].find( saved );
                              if ( recs.length > 0 ) {
                                w2ui[ tool.gridDataName ].select( recs.toString() );
								w2ui[ tool.gridDataName ].scrollIntoView();
                              }
                            }
                            w2ui[tool.gridDataName].layerSelected = false;
						  }
						}
                      }
                      else {
                        tool.getSelectedLayerSemanticList(e);
                        w2ui[tool.gridDataName].refresh();
						w2ui[tool.gridDataName].layerSelected = false;
                      }
					}
                }
            } );

            w2ui[ this.tabsName ].add( {
                id: 'view',
                caption: w2utils.lang( 'View' ),
                onClick: function ( e ) {
                    var rec = null;
                    if (w2ui[tool.gridDataName]) {
                        var recid = w2ui[tool.gridDataName].getSelection(); // идентификатор выбранной характеристики
                        rec = w2ui[ tool.gridDataName ].get(recid);         // описание выбранной характеристики
                        if (!rec)
                            w2ui[tool.gridDataName].header = "";
                    }
                    tool.createTabView(rec);
                    if (w2ui["view_gridGradation"])
                       w2ui["view_gridGradation"].resize();
                    $( '#layers' ).hide();
                }
            });
            
			w2ui[this.tabsName].add({
				id: 'projects',
				caption: w2utils.lang('Project'),
				onClick: function () {
					if (w2ui['tab_projects_grid']) w2ui['tab_projects_grid'].refresh();
					$('#layers').hide();
				}
			});

        },

        /**
         * Установить возможность перемещения панели
         *
         * @method setDraggable
         */
        setDraggable: function () {
            if (!this.map)
                return;
            GWTK.panelUI({ draggable: true, $element: $(this.pane), resizable: false });
            // $(this.pane).draggable({
            //     containment: 'parent',
            //     cursor: "pointer"
            // });
        },

        /**
         * Установить возможность изменения размеров панели
         *
         * @method setResizable
         */
        setResizable: function () {

            var control = this;
            var $curpanel = {};
            $(this.pane).resizable({
                handles: 's,w,sw,e,se',
                resize: function (event, ui) {
                    ui.position.left = ui.originalPosition.left;
                    var h = $(this).height() - 80;
                    $("#" + control.tabsName).height(h);
                    $curpanel.height(h - 50);
					
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
                stop:function ( event, ui ){
                    $(".tab").height($curpanel.height());
                    $("#view_gridGradation").height($curpanel.height() - 100);
                    if ( w2ui[control.gridDataName] ) w2ui[ control.gridDataName ].resize();
                    if ( w2ui["view_gridGradation"] ) w2ui[ "view_gridGradation" ].resize();
                    if (w2ui['tab_layers_grid']) w2ui['tab_layers_grid'].resize();
                },
                start:function(event, ui){
                    $curpanel = $("#" + w2ui[control.tabsName].active);
                },
                create: function () {
					$(this).parent().on( 'resize', function ( e ) {
						e.stopPropagation();
					} );
				},
                minHeight: 485,
                minWidth: 561
            } );
        },

        /**
		 * Изменить размер дочерних элементов по размеру панели
		 */
        resize: function () {
            if (w2ui[this.gridDataName]) w2ui[this.gridDataName].resize();
            if (w2ui["view_gridGradation"]) w2ui["view_gridGradation"].resize();
            if (w2ui['tab_layers_grid']) w2ui['tab_layers_grid'].resize();
        },

        /**
         * Установить обработчики событий
         *
         * @method initEvents
         */
        initEvents: function () {
            var tool = this;

            // Обработчик клика на кнопке компонента в тулбаре
            $( this.button ).on( 'click', function ( event ) {
                if ( $( this ).hasClass( 'control-button-active' ) ) {
                    $( this ).removeClass( 'control-button-active' );
                    $( tool.pane ).hide('slow');
                    tool.active = false;
                }
                else {
                    $( this ).addClass( 'control-button-active' );
                    tool.active = true;
                    $( tool.pane ).show();
                    w2ui[ tool.tabsName ].click(tool.tabsActive);
                    // развернуть общую панель для компонентов (если используется)
					tool.map.showControlsPanel();
                }
            });

            //добавление/удаление слоя в таблицу слоев
            $( this.map.eventPane ).on( 'visibilitychanged.thememapcontrol', function ( e ) {
                if ( e.maplayer.visible ) {
                    var layer = tool.map.tiles.getLayerByxId(e.maplayer.id);
                    if (layer&&layer.idLayer && layer.idLayer.length > 0) {                                      // 12/05/17, графические слои не берем
                        if (layer.idLayer && w2ui['tab_layers_grid']) {
                            if (!w2ui['tab_layers_grid'].get(layer.xId)) {                                // 11/05/17
                                w2ui['tab_layers_grid'].add({ recid: layer.xId, layername: layer.alias });
                            }
                        }
                    }
                }
                else {
                    if (w2ui['tab_layers_grid']) {
                        w2ui['tab_layers_grid'].remove(e.maplayer.id);
                    }
                }
            } );

            // Обработчик события выделения объектов
            //$(this.map.eventPane).on('overlayRefresh.thememapcontrol', function (event) {
            $(this.map.eventPane).on('featureinforefreshed.thememapcontrol', function (event) {
                if ( !tool.active )
                    return;
                tool.clearThemeSelected();
                tool.selectedLayers_Request = {};

                if (w2ui['tab_layers_grid']) {
                    w2ui['tab_layers_grid'].selectNone();
                }
                
                tool.getSelectedLayerSemanticList(event);
            } );

            // Обработчик события отмены отобранных объектов карты
            $(this.map.eventPane).on('featurelistcanceled.thememapcontrol', function (event) {
                if ( w2ui[ tool.gridDataName ] ) {
                    w2ui[ tool.gridDataName ].clear();
                }
			});

			// открыть файл проекта
			$('#thematicmap_open').on('click', function () {
				this.openProject();
			}.bind(this));

            // сохранить файл проекта
			$('#thematicmap_save').on('click', function () {
				tool.saveProject();
			});

            // применить тему
			$('#thematicmap_close').on('click', function (e) {
			    tool.closeProject(e);
			});

            this.onCreateThematicLayer = GWTK.Util.bind(this.onCreateThematicLayer, this);
            
            // обработка изменений размера панели контролов
			$(this.map.eventPane).on('resizecontrolspanel.' + this.toolname, function (event) {
				// изменить размеры своей панели
				this.resize();
			}.bind(this));
        },

        /**
         * Деструктор
         *
         * @method destroy
         */
        destroy: function () {
            $(this.button).off();
            $('#thematicmap_open').off();
            $('#thematicmap_save').off();
            $('#thematicmap_close').off();
            if (this.closeButton)
               $(this.closeButton).off();

            $(this.map.eventPane).off('featurelistcanceled.thememapcontrol');
            $(this.map.eventPane).off('featureinforefreshed.thememapcontrol');
            $(this.map.eventPane).off('visibilitychanged.thememapcontrol');

            $(this.pane).resizable('destroy');
            if ($(this.pane).is('.ui-draggable'))
                $(this.pane).draggable('destroy');

            if (w2ui[this.gridDataName]) w2ui[this.gridDataName].destroy();
            if (w2ui['tab_layers_grid']) w2ui['tab_layers_grid'].destroy();
            if (w2ui["view_gridGradation"]) w2ui["view_gridGradation"].destroy();
            if (w2ui['tab_projects_grid']) w2ui['tab_projects_grid'].destroy();
            if (w2ui[this.tabsName]) w2ui[this.tabsName].destroy();

            $(this.pane).empty().remove();
            $(this.button).remove();
            return;
        },

        /**
         * Получить данные выделенных объектов
         *
         * @method getSelectedFeatures
         */
        getSelectedFeatures: function () {
            if ( !this.map || !this.active )
                return;

            if ( this._run ) {
                return;
            }

            // список идентификаторов объектов
            // var gmlid = this.selectedFeatures.getselection();
            // список слоев объектов
            var layers = this.selectedFeatures.layers;

            if (!layers || layers.length == 0 || layers[0] == null) {
                layers = [];
                for ( var key in this.selectedFeatures.selectedLayers ) {
                    if ( this.selectedFeatures.selectedLayers.hasOwnProperty( key ) ) {
                        layers.push( key );
                    }
                }
            }

            if ( layers.length == 0 ) {
                w2alert(w2utils.lang("Input data error"));
                console.log(w2utils.lang("Input data error"));
                return;
            }

            this.fillSemanticGrid();
        },

        /**
         * Заполнить таблицу семантик по выделенным объектам
         *
         * @method fillSemanticGrid
         */
        fillSemanticGrid: function () {

            if (!this.map)
                return;
            if (this.selectedFeatures.mapobjects.length == 0) return;

            var semantic = [], i,
                len = this.selectedFeatures.mapobjects.length;
            // общий список объектов семантик всех выделенных объектов
            for (i = 0; i < len; i++) {
                if (this.selectedFeatures.mapobjects[i].geometry &&
                    this.selectedFeatures.mapobjects[i].geometry.spatialposition === 'point'){
                        continue;
                    }
                semantic.push(this.selectedFeatures.mapobjects[i].semantic);
            }
            len = semantic.length;
            var records = [], j, count;

            // перебор семантик объектов и формирование строк таблицы
            for (i = 0; i < len; i++) {

                count = semantic[i].semantics.length;
                if (!count) continue;                     // нет семантики...
                // слой
                //var maplay = this.map.tiles.getLayerByGmlId(semantic[i].mapobject.gid);
                var maplay = this.map.tiles.getLayerByxId(semantic[i].mapobject.maplayerid);
                if (!maplay) continue;
                // имя rsc
                var rscname = maplay.classifier.getName();
                for (j = 0; j < count; j++) {
                    var shortname = semantic[i].semantics[j].shortname;

                    if (!shortname || !semantic[i].semantics[j].value)
                        continue;

                    // описание семантики
                    var sem = this.getSemanticBySemKey(shortname, maplay.idLayer);
                    var semref = null,
                        semvalue = semantic[i].semantics[j].value;
                    // код значения семантики
                    if (sem.type == 16) {
                        semref = this.getSemanicReferenceCode(maplay.classifier, shortname, semantic[i].semantics[j].value);
                        if (semref) semvalue = parseInt(semref);                         // код справочника семантики
                    }
                    else if (sem.type == 1) {
                        semvalue = parseFloat(semvalue);
                    }
                    else continue;

                    // ищем запись семантики по ее ключу и имени rsc
                    var index = this.findSemanticRecord(records, shortname, rscname);
                    var record = {};
                    if (index == -1) {                                             // запись не найдена, создаем
                        record.recid = (i + 1) * 1000 + j + 1;
                        record.semname = sem.name;
                        record.semkey = semantic[i].semantics[j].shortname;
                        record.minvalue = semvalue;
                        record.maxvalue = semvalue;
                        record.layername = maplay.alias;
                        record.layerid = maplay.xId;
                        record.semtype = sem.type;
                        record.rsc = rscname;
                        records.push(record);
                    }
                    else {
                        record = records[ index ];                                     // запись найдена, обновляем

                        if (record.minvalue > semvalue)
                            record.minvalue = semvalue;
                        else if (record.maxvalue < semvalue)
                            record.maxvalue = semvalue;
                        if (record.layername.indexOf(maplay.alias) == -1)
                            record.layername += ',' + maplay.alias;
                        if (record.layerid.indexOf(maplay.xId) == -1)
                            record.layerid += ',' + maplay.xId;
                    }
                    //}
                }
            }

            // вывести записи в таблице
            w2ui[this.gridDataName].clear();
            w2ui[this.gridDataName].records = records;
			w2ui[this.gridDataName].refresh();
            // сортируем по имени семантики
            w2ui[this.gridDataName].sort('semname', 'asc');
        },

        /**
         * Запросить код значения справочника семантики по ключу семантики и значению строки
         *
         * @method getSemanicReferenceCode
         * @param classifier {GWTK.classifier} Экземпляр классификатора
         * @param semkey {String} Ключ семантики
         * @param name {String} Значение строки
         * @return {Number} Возвращает значение параметра value из найденной семантики,
         * если семантика не найдена, возвращает `null`
         */
        getSemanicReferenceCode: function (classifier, semkey, name) {
            if (!classifier || !semkey || !name)
                return null;
            if (!classifier instanceof GWTK.classifier)
                return null;
            var semname = name.toLowerCase();
            var semref = classifier.getsemanticreference(semkey), i, len = 0;
            if (semref) len = semref.length;
            for (i = 0; i < len; i++) {
                if (semref[i] && semref[i].name && semref[i].name.toLowerCase() == semname) {
                    return semref[i].value;
                }
            }
            return null;
        },

        /**
         * Запросить описание семантики по ключу семантики и id слоя карты в списке layerSemantics
         *
         * @method getSemanticBySemKey
         * @param semkey {String} Ключ семантики
         * @param layerid {String} Идентификатор слоя карты (id) в списке layerSemantics
         * @return {Object} Возвращает объект семантики, либо пустой объект`{}`
         */
        getSemanticBySemKey: function (semkey, layerid) {

            if (!semkey || !layerid || !this.layerSemantics)
                return {};
            if (!this.layerSemantics[layerid])
                return {};

            var objecs = this.layerSemantics[layerid], sem = {}, len = objecs.length, i, j;

            for (i = 0; i < len; i++) {
                var count = objecs[i].rscsemantic.length;
                for (j = 0; j < count; j++) {
                    if (objecs[i].rscsemantic[j].shortname == semkey) {
                        sem = objecs[i].rscsemantic[j];
                        break;
                    }
                }
            }

            return sem;
        },

        /**
         * Найти запись в массиве записей по ключу семантики и имени rsc
         *
         * @method findSemanticRecord
         * @param records {Object} Массив записей
         * @param semkey {String} Ключ семантики
         * @param rscname {String} Имя rsc
         * @return {Number} Возвращает индекс записи или `-1`
         */
        findSemanticRecord: function ( records, semkey, rscname ) {
            var rec = -1;
            if ( !records || !$.isArray( records ) || !semkey || !rscname )
                return rec;
            var len = records.length, i;
            for ( i = 0; i < len; i++ ) {
                if ( records[ i ].semkey == semkey && records[ i ].rsc == rscname ) {
                    return i;
                }
            }
            return rec;
        },

        // Работа со слоями карты для создания тематического слоя
        // ==============================================================

        /**
         * Получить все объекты указанных слоев
         *
         * @method getAllObjects
         * @param xid {Array} массив идентификаторов слоев карты
         */
        getAllObjects: function (xid) {

            if (!xid || xid.length == 0) {
                return false;
            }
            this.selectedFeatures.clearDrawAll();
            GWTK.Util.clearselectedFeatures(this.map);

            if (!$.isEmptyObject(this.selectedLayers_FeatureCollection)){     // есть кэш объектов слоев
				var newlayers = [];
                for (i = 0; i < xid.length; i++) {
                    if (!this.selectedLayers_FeatureCollection[xid[i]]){
                        newlayers.push(xid[i]);
                    }
                }
				
                if (newlayers.length == 0){
					var records = this._refillSemanticGrid(xid);              // заполнить из кэша объектов
                    if ($.isArray(records)){
                        w2ui[this.gridDataName].records = records;
                        w2ui[this.gridDataName].refresh();
						// сортируем по имени семантики
						w2ui[this.gridDataName].sort('semname', 'asc');
                        if ( w2ui[ this.gridDataName ].header.length ) {
                            var saved = JSON.parse( w2ui[ this.gridDataName ].header );
                            var recs = w2ui[ this.gridDataName ].find( saved );
                            if ( recs.length > 0 ) {
                                w2ui[ this.gridDataName ].select( recs.toString() );
                            }
                        }
                        return;
                    }
                }
            }

            if (typeof newlayers !== 'undefined' && newlayers.length > 0){
                var layers = newlayers;
            }
            else
                var layers = xid;

            var i, urls=[], tokens = [],
                token = this.map.getToken(),
                strparam = "?service=WFS&restmethod=GetFeature&semanticname=1&outtype=JSON&metric=0&semantic=1&mapid=1&objlocal=0,1",
                param = {'layers': []};
            for (i = 0; i < layers.length; i++) {
                var lay = this.map.tiles.getLayerByxId(layers[i]);
                if (lay == null) continue;
                param['layers'].push({ 'layerid': lay.idLayer });
                urls.push(GWTK.Util.getServerUrl(lay.options.url));
                this.selectedLayers_Request[layers[i]] = true;
                if (token){
                    if (lay.options.token)
                       tokens.push(token);
                    else{
                        tokens.push(undefined);
                    }
                }
            }

            for (i = 0; i < urls.length; i++) {
                urls[i] = urls[i] + strparam + "&layers=" + param['layers'][i].layerid;
            }
            if (urls.length == 0){ return; }

            GWTK.Util.showWait();

            w2ui['tab_layers_grid'].lock();
            
            GWTK.Util.doPromise( urls,
                function(data, err){
                    if (err && err.length > 0){
                        if (err.text) {
						  console.log(err.text);
						}
						else {
						  console.log(w2utils.lang("Error when executing query") + "!");
						}
						
                        if (!data || data.length == 0){
                            w2ui['tab_layers_grid'].unlock();
                            GWTK.Util.hideWait();
                            return;
                        }
                    }
                    if (data && typeof data[0] != "undefined")
                        this._onFeaturesLoaded(data[0]);
                    else {
                        console.log(w2utils.lang("Error when executing query") + "!");
                        w2ui['tab_layers_grid'].unlock();
                        GWTK.Util.hideWait();
                        return;
                    }
                }.bind(this), tokens, this.map);

            return;
        },

        /**
         * @method _refillSemanticGrid
         * Заполнить грид семантики по данным из кэша selectedLayers_FeatureCollection
         * @param xid {Array} массив идентификаторов слоев карты
         * @returns {Array} массив записей таблицы семантик `data`
         * При ошибке возвращает `false`
         */
        _refillSemanticGrid: function(xid){
            if (!xid || xid.length == 0 || $.isEmptyObject(this.selectedLayers_FeatureCollection)) {
                return false;
            }
            var records = [], i, len = xid.length;
            for (i = 0; i < len; i++){
                var maplay = this.map.tiles.getLayerByxId(xid[i]);
                if (!$.isArray(this.selectedLayers_FeatureCollection[xid[i]]) || maplay == null) {
                    continue;
                }

                this._getRecordsArrayByJSON(this.selectedLayers_FeatureCollection[xid[i]], maplay, records);
            }

            return records;
        },

        /**
         * @method _onFeaturesLoaded
         * Обработка ответа сервера на запрос getFeature
         * (Заполнить грид семантик объектов слоя из json)
         */
        _onFeaturesLoaded: function (json) {
            var features = [];
            if (typeof json !== "undefined" && json.type && json.type == "FeatureCollection"){
                if ($.isArray(json.features)) {
                    features = json.features;
                }
            }
            if (features.length == 0) {
                w2ui['tab_layers_grid'].unlock();
                GWTK.Util.hideWait();
                return;
            }

            var layerId = features[0].properties.mapid,
                layerId = GWTK.Util.encodeIdLayerUrl(layerId),
                layer = this.map.tiles.getLayerByIdService(layerId);
            this._run = 1;

            
            this.getLayerSemanticList(layerId, function(){
                // записи семантики для слоя layer из Json
                var records = this.getSemanticGridByJSON(features, layer), i;
								
				if ($.isArray(records)) {
				    if (layer) {
					  this.selectedLayers_Semantics[layer.xId] = records;
					}
					w2ui[this.gridDataName].records = records;
					w2ui[this.gridDataName].refresh();
                    // сортируем по имени семантики
                    w2ui[this.gridDataName].sort('semname', 'asc');
                }
                
                w2ui['tab_layers_grid'].unlock();
                GWTK.Util.hideWait();
            }.bind(this));

            return;
        },

        /**
         * Получить записи семантики для объектов слоя
         *
         * @method getSemanticGridByJSON
         * @param features {Array} массив объектов слоя в формате json
         * @param layer {Object} слой карты
         * @returns {Array} массив записей семантики объектов
         */
        getSemanticGridByJSON: function(features, layer){
            var maplay = layer;
            if (!maplay || !$.isArray(features)) { return null; }
            var i, len = features.length;
            var layerfeatures = [];

            // общий список семантик всех json-объектов
            for (i = 0; i < len; i++) {
                if (!features[i].hasOwnProperty("properties")) {continue;}
                if (features[i].properties.semantics && features[i].properties.semantics.length > 0){
                    layerfeatures.push(features[i]);
                }
            }
            // if (layerfeatures.length == 0 ){
            //     return null;
            // }
            if ($.isArray(this.selectedLayers_FeatureCollection[maplay.xId])){
                len = this.selectedLayers_FeatureCollection[maplay.xId].length;
                this.selectedLayers_FeatureCollection[maplay.xId].splice(0, len);
            }

            this.selectedLayers_FeatureCollection[maplay.xId] = null;
            this.selectedLayers_FeatureCollection[maplay.xId] = layerfeatures;

            if (layerfeatures.length == 0 ){
                return null;
            }
            return this._getRecordsArrayByJSON(layerfeatures, maplay);
        },

        _getRecordsArrayByJSON: function(features, maplayer, grecords){

            if (!$.isArray(features) || typeof maplayer == "undefined" ){
                return null;
            }
            var records = [], count, i, j
            len = features.length,
            rscname = maplayer.classifier.getName();               // имя rsc

            if ($.isArray(grecords)){
                records = grecords;
            }
            // перебор семантик объектов и формирование строк таблицы
            for (i = 0; i < len; i++) {
                count = features[i].properties.semantics.length;
                if (!count) continue;
                var semantic = features[i].properties.semantics;     // семантики
                for (j = 0; j < count; j++) {
                    var shortname = semantic[j].key;
                    if (!shortname || !semantic[j].value)
                       continue;
                    // описание семантики
                    var sem = this.getSemanticBySemKey(shortname, maplayer.idLayer);
                    var semref = null,
                    semvalue = semantic[j].value;
                    // код значения семантики
                    if (sem.type == 16) {
                        semref = this.getSemanicReferenceCode(maplayer.classifier, shortname, semvalue);
                        if (semref) semvalue = parseInt(semref);           // код справочника семантики
                    }
                    else if (sem.type == 1) {
                        semvalue = parseFloat(semvalue);
                    }
                    else { continue; }
                    // ищем запись семантики по ее ключу и имени rsc
                    var index = this.findSemanticRecord(records, shortname, rscname);
                    var record = {};
                    if (index == -1) {                                     // запись не найдена, создаем
                        record.recid = (i + 1) * 1000 + j + 1;
                        record.semname = sem.name;
                        record.semkey = semantic[j].key;
                        record.minvalue = semvalue;
                        record.maxvalue = semvalue;
                        record.layername = maplayer.alias;
                        record.layerid = maplayer.xId;
                        record.semtype = sem.type;
                        record.rsc = rscname;
                        records.push(record);
                    }
                    else {
                        record = records[index];                              // запись найдена, обновляем
                        if (record.minvalue > semvalue)
                            record.minvalue = semvalue;
                        else if (record.maxvalue < semvalue)
                            record.maxvalue = semvalue;
                        if (record.layername.indexOf(maplayer.alias) == -1)
                            record.layername += ',' + maplay.alias;
                        if (record.layerid.indexOf(maplayer.xId) == -1)
                            record.layerid += ',' + maplayer.xId;
                    }
                }
           }
           return records;
        },

        /**
         * Заполнить список семантик выделенных объектов
         *
         * @method getSelectedLayerSemanticList
         * @param event {Object} объект события
         * @return {Boolean} при успехе возвращает `true`, иначе возвращает `false`
         */
        getSelectedLayerSemanticList: function (event) {
            if ( !this.map )
                return false;
            if (this.selectedFeatures.mapobjects.length == 0) {
                if (event && event.type == 'click' && this.active) {
                    $('#tab_data_grid_pane').html('<br/><br/><div style="text-align:center;padding:20px;">' + w2utils.lang("Select map object") + '!', w2utils.lang("Thematic maps") + '</div>');
                }
                //if (w2ui[this.gridDataName]) {
                  //  w2ui[this.gridDataName].clear();
                //}
                return false;
            }
			
			if (!w2ui[this.gridDataName].layerSelected) {
			  w2ui[this.gridDataName].render();
			}
            this.selectedFeatures.getselection();
            // список слоев выделенных объектов объектов
            var layers = this.selectedFeatures.layers;

            if (!layers || layers.length == 0 || layers[0] == null) {
                layers = [];
                for ( var key in this.selectedFeatures.selectedLayers ) {
                    if ( this.selectedFeatures.selectedLayers.hasOwnProperty( key ) ) {
                        layers.push( key );
                    }
                }
            }
            else if (typeof layers[0] != 'string') {
                var layerId = [], j, len=layers.length;
                for (j = 0; j < len; j++) {
                    if (layers[j].idLayer) {
                        if (layerId.indexOf(layers[j].idLayer) == -1)
                            layerId.push(layers[j].idLayer);
                    }
                }
                layers = layerId;
            }

            if ( !layers || layers.length == 0 ) {
                return false;
            }

            var i, len = layers.length;

            this._run = len;

            for ( i = 0; i < len; i++ ) {
                this.getLayerSemanticList(layers[i], this.getSelectedFeatures.bind(this));
            }

            if ( w2ui[ this.gridDataName ].header.length ) {
                var match = JSON.parse( w2ui[ this.gridDataName ].header );
                var recs = w2ui[ this.gridDataName ].find( match );
                if ( recs.length > 0 ) {
                    w2ui[ this.gridDataName ].select( recs.toString() );
                }
            }

            return true;
        },

        /**
         * Запросить список семантик слоя карты через запрос GetLayerSemanticList
         *
         * @method getLayerSemanticList
         * @param layerid {string} идентификатор слоя сервиса
         */
        getLayerSemanticList: function (layerid, callback) {

            if ( !layerid ) return;

            if ( this.layerSemantics[ layerid ] && this.layerSemantics[ layerid ].length > 0 ) {
                this._run--;
                if ($.isFunction(callback))
                   callback();
                //this.getSelectedFeatures();
                return;
            }

            var tool = this,
                maplayer = this.map.tiles.getLayerByIdService(layerid);
            tool.layerSemantics[layerid] = [];

            if (maplayer && maplayer.classifier){
                maplayer.classifier.getLayerSemanticList(
                    function(features, status){
                        if (status == 'success') {
                            for (var i = 0; i < features.length; i++) {
                                // сохранить семантики для выбранного слоя
                                if (features[i].name == '')
                                    continue;
                                tool.layerSemantics[layerid].push(features[i]);
                            }
                            //if (w2ui[tool.gridDataName]){
                              // w2ui[tool.gridDataName].resize();
                            //}
                        }

                        tool._run--;
                        if (tool._run <= 0) {
                            if (maplayer.classifier.getName() !== null && $.isFunction(callback)) {
                                //tool.getSelectedFeatures();
                                callback();
                            }
                            else {
                                //setTimeout(function () { tool.getSelectedFeatures(); }, 1000);
                                if ($.isFunction(callback)){
                                    setTimeout(function () { callback(); }, 1000);
                                }
                            }
                        }
                    }
                );
            }

        },

        /**
         * Создать тематический слой
         *
         * @method createThematicLayer
         * @param alias {String} наименование слоя
         * @param id {String} идентификатор слоя
         */
        createThematicLayer: function ( alias, id ) {
            // выделенные объекты
            //if ( this.selectedFeatures.mapobjects.length == 0 )
            //    return;
            if (!w2ui[this.gridDataName] || !w2ui['view_gridGradation'] ) {
                w2alert( w2utils.lang( 'Thematic map view is not defined' ) );
                return false;
            }

            // выбранная запись семантики
            var recid = w2ui[ this.gridDataName ].getSelection();
            if ( recid.length == 0 ) {
                w2alert( w2utils.lang( 'Select data' ) + " !" );
                return;
            }

            var record = w2ui[this.gridDataName].get( recid[ 0 ] ),
                id = id || GWTK.Util.createGUID();

            // проверить совпадение ключа семантики на вкладке Data и View
            if (record.semkey !== w2ui['view_gridGradation'].header){
                w2alert( w2utils.lang( 'Thematic map view is not defined' ) );
                return false;
            }

            var alias = alias || this.paneHeader + ' ( ' + record.semname + ' )',
            options = { "url": "", "id": id, "alias": alias, "selectObject": "1", "selectsearch": "0",
			"semkey": record.semkey, "semname": record.semname };

            this._createThematicMap(options, this._getCurrentThemeByGrid());

            return;
        },

        /**
         * Создать тематический слой через запрос CreateThematicMap
         *
         * @method _createThematicMap
         * @param options {Object} параметры слоя карты, JSON
         */
        _createThematicMap: function(options, project){

            // var recid = w2ui[this.gridDataName].getSelection();
            // if (recid.length == 0) {
            //     w2alert( w2utils.lang( 'Select data' ) + " !" );
            //     return;
            // }
            if (typeof options === 'undefined' || typeof project === 'undefined'){
                w2alert( w2utils.lang('Select data') + " !" );
                return;
            }

            var record = project.datagrid,
                ids = record.layerid.split(',');
                idlayers = this.map.tiles.getIdLayersByxId(record.layerid),
                maplayer = this.map.tiles.getLayerByxId(ids[0]),
                options = options;
				
            if (typeof idlayers !== 'string' || idlayers.length == 0 ||
                maplayer == null || typeof options == 'undefined'){
                w2alert( w2utils.lang('Thematic map creation error') + " !" );
                return;
            }

            var params = this._getThematicMapParamString(project);             // ключ семантики, градации значений
            if (!params){
                w2alert( w2utils.lang('Thematic map creation error') + " !" );
                return;
            }
            GWTK.Util.showWait();

            var url = GWTK.Util.getServerUrl(maplayer.options.url) + "?restmethod=CreateThematicMap&layer=" + idlayers + params.restparam,
                  token = this.map.getToken();
            if (token && maplayer.options.token){
                var tokens = [];
                tokens.push(token);
            }

            options.legend = params.legendcolors;                              // цветовые настройки

            options._alias = maplayer.options.alias;

            options._xid = maplayer.xId;

            GWTK.Util.doPromise([url],
                function(data, err){this._onCreateThematicMap(data, err, options);}.bind(this),
                tokens, this.map);
        },

        /**
         * Обработать ответ запроса CreateThematicMap
         *
         * @method _onCreateThematicMap
         * @param data {Array}, массив успешных ответов GWTK.Util.doPromise
         * @param err {Array}, массив ошибочных ответов GWTK.Util.doPromise
         * @param options {Object} параметры слоя карты, JSON
         * @returns `true` и открывает wms-слой при успехе CreateThematicMap
         */
        _onCreateThematicMap:function(data, err, options){
            if (Array.isArray(data) && data.length > 0 && !$.isEmptyObject(options)){
			  return this._getThematicLayerRealSemantics(data, options, this._openThematicLayer);
            }
            GWTK.Util.hideWait();
            var msg = 'GWTK.ThematicMapControl. ' + w2utils.lang('Thematic map creation error');
            console.log(msg);
            
			// вызвать функцию обратного вызова
            if (this.themeProjectCallback) {
              this.themeProjectCallback({ "created": null, "error": err });
            }
			else {
			  if (err) console.log(err);
			}
			
            return false;
        },
		
		/**
         * Открыть тематический слой
         *
         * @method _openThematicLayer
         * @param data {Array}, массив успешных ответов GWTK.Util.doPromise
         * @param options {Object} параметры слоя карты, JSON
		 * @param context {Object} ссылка на экземпляр класса
         * @returns `true` и открывает слой при успехе
         */
		_openThematicLayer: function(data, options, context){
		    
          if (Array.isArray(data) && data.length > 0 && !$.isEmptyObject(options) && !$.isEmptyObject(context)){
		   var response = data[0].text;
		   
           try{
                var $tmlay = $(response).find('NewLayer'),
                layerId = $tmlay.attr('ID'),
                url = GWTK.Util.getServerUrl(data[0].data_url) +
                '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png' +
                '&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&LAYERS=' + encodeURIComponent(layerId);
    
                var maplayer = context.map.openLayer( {
                    'alias': options.alias,
                    'id': options.id,
                    'url': url,
                    'selectObject': true,
                    'semkeytheme': options.semkey
                } );

                if ( maplayer ){
                    var legenditems = context.createLegend(maplayer.xId, options.legend);
                    if ( legenditems ) {
                        context.map.setUserLegend( maplayer, legenditems );
                    }
                    var layernode = {
                        'id': maplayer.xId, 
                        'clickable': true,
                        'text': maplayer.alias,
                        'parentId': context.treeParentId
                    };
                    
                    context.map.onLayerListChanged( layernode );

                    context._createPieChart(options);
                }

                GWTK.Util.hideWait();
 
                // вызвать функцию обратного вызова
                if (context.themeProjectCallback) {
                  context.themeProjectCallback({ "created": layerId, "error": err });
                }

                return true;
           }
           catch(e){}
		  }
          return false;
        },

        /**
         * Обновить легенду тематического слоя и вызвать функцию обратного вызова
         * @method _getThematicLayerRealSemantics
		 * @param data {Array}, массив успешных ответов GWTK.Util.doPromise
         * @param options {Object} параметры слоя карты, JSON
		 * @param callback {Function} функция обратного вызова
         * @returns {Boolean}, 'true`
         */
		_getThematicLayerRealSemantics: function(data, options, callback){
           if (Array.isArray(data) && data.length > 0 && !$.isEmptyObject(options)){
		     var response = data[0].text;
             try{
               var $tmlay = $(response).find('NewLayer'),
               layerId = $tmlay.attr('ID');
               if (options.legend.length > 0){
			     var srvUrl = this.map.options.url;
				 var layer = this.map.tiles.getLayerByxId(options._xid);
				 if (layer) {
				   srvUrl = GWTK.Util.getServerUrl(layer.options.url);
				 }
                 var url = srvUrl + "?service=WFS&restmethod=GetFeature&layers=" + encodeURIComponent(layerId) + "&semanticname=1&outtype=JSON&metric=0&semantic=1&mapid=1&objlocal=0,1",
                 urls = [url], tokens = [],
                 token = this.map.getToken();
				if (token) {
				  tokens.push(token);
			    }
                GWTK.Util.doPromise(urls,
                  function(answer, err){
					if (err && err.length > 0){
                      if (err.text) {
						console.log(err.text);
					  }
					  else {
						console.log(w2utils.lang('GetFeature Request Error!'));
					  }
                      if (!answer || answer.length == 0){
                        GWTK.Util.hideWait();
                        return false;
                      }
                    }
                    if (answer && typeof answer[0] != "undefined") {
                           var features = answer[0].features;
                             for (var i=0; i<features.length; i++) {
                               var semantics = features[i].properties.semantics;
						  	       for (var j=0; j<semantics.length; j++) {
									 if (options.semkey == semantics[j].key) {
									   for (var k=0; k<options.legend.length; k++) {
										 var type = options.legend[k].type;
                                         var value = semantics[j].value;
										 if (type == 16) {
                                           if (value == options.legend[k].name || value == options.legend[k].text) {
											 options.legend[k].count++;
											 break;
										   }
										 }
                                         else {
										   value = Number(value);
                                           if (isNaN(value)) {
											 value = semantics[j].value;
                                             if (value.indexOf('.') !== -1) {
											   value = Number(value.replace('.', ','));
										     }
											 else if (value.indexOf(',') !== -1) {
											   value = Number(value.replace(',', '.'));
											 }
										   }
										   if (value > options.legend[k].from
										      && value <= options.legend[k].to
										   ) {
											 options.legend[k].count++;
											 break;
										   }
										   if (k == 0 && value == options.legend[k].from) {
											 options.legend[k].count++;
											 break;
										   }
										 }
									   }
									 }
								   }
								 }
								 
								 var legend = [];
								 for (var i=0; i<options.legend.length; i++) {
								   if (options.legend[i].count > 0) {
									 legend.push(options.legend[i]);
								   }
								 }
                                 if (legend.length > 0) {
								   options.legend = legend;
								   if (typeof callback == 'function') {
									  callback(data, options, this);
								   }
								   GWTK.Util.hideWait();
                                   return true;
								 }
								 else {
                                   console.log('GWTK.ThematicMapControl. ' + w2utils.lang('Thematic map creation error') + ': ' +
								   w2utils.lang('Empty map without objects!'));
								   GWTK.Util.hideWait();
 								   return;
								 }
							  }
                              else {
                                console.log(w2utils.lang("Error when executing query") + "!");
                                GWTK.Util.hideWait();
                                return;
                              }
				  }.bind(this), tokens, this.map);
			   }
			 }
			 catch(e){}
		   }
		   return false;
        },
		
        /**
         * Создать круговую диаграмму
         * @method _createPieChart
         * @returns {Boolean}, 'true` - узел создан
         */
        _createPieChart: function(options){
            if (!options || !this.buildChart) {
                return;
            }
            var toolChart = this.map.toolChart;
            if (toolChart) {
              var $panelChart = $('#' + toolChart.panel_options.id);
              $panelChart.find('div.panel-info-header > span').text(options._alias);
              var features = this.selectedLayers_FeatureCollection[options._xid];
              chartSettings.chartTitle = options.semname;
              chartSettings.chartType = 'pie';
              chartSettings.chartData.labels = [];
              chartSettings.chartData.datasets = [
               {
                 'label': options.semname,
                 'backgroundColor': [],
                 'data': []
               }
              ];
              var legend = options.legend,
              length = legend.length,
              total = 0;
              for (var i = 0; i < length; i++) {
                var label = legend[i].text;
                var index = label.indexOf(options.semname);
                if (index == 0) {
                  label = label.substr(options.semname.length);
                  if (label.indexOf(':') == 0 || label.indexOf(' ') == 0) {
                    label = label.substr(1);
                  }
                }
                chartSettings.chartData.labels.push(label);
                chartSettings.chartData.datasets[0].backgroundColor.push('#' + legend[i].color);
                var count = 0;
                for (var j=0; j<features.length; j++) {
                  var feature = features[j];
                  var semIndex = -1;
                  for (var k=0; k<feature.properties.semantics.length; k++) {
                    if (feature.properties.semantics[k].key == options.semkey) {
                      semIndex = k;
                      break;
                    }
                  }
                  if (semIndex == -1) continue;
                  var semval = feature.properties.semantics[semIndex].value;
                  if (legend[i].type == 16) {
                    if (legend[i].text.indexOf(semval) !== -1) {
                      count++;
                    }
                  }
                  else {
                    semval = parseFloat(semval);
                    if (semval >= legend[i].from && semval <= legend[i].to) {
                      count++;
                    }
                  }
                }
                total += count;
                chartSettings.chartData.datasets[0].data.push(count);
              }
              
              if (total > 0) {
                if ($panelChart.length > 0) {
                  if ($panelChart.is(":hidden")) {
                    $panelChart.show('slow');
                  }
                }
              }
              else {
                w2alert(w2utils.lang('No objects, containing semantics') + ' "' + options.semname + '"' + '!');
              }
            }
        },

        /**
         * Создать узел Тематические слои в дереве состава карты
         *
         * @method _createTreeNodeParent
         * @returns {Boolean}, 'true` - узел создан
         */
        _createTreeNodeParent: function(){
            if (!this.map) return;
            var mapContent = this.map.mapTool('mapcontent');
            if (!mapContent) {return;}
            // if (mapContent.get(this.treeParentId) !== null){
            //     return;
            // }
            var root = null;
			if (!mapContent.getNode(this.treeParentId)) {
			  var root = mapContent.addNode(undefined, { "id": this.treeParentId, "group": true,
                                                       "text": w2utils.lang('Thematic layers'),
                                                       "expanded": true, "img": ""}, false);
			}
            return (root !== null);
        },

        /**
         * Получить параметры запроса CreateThematicMap
         *
         * @method _getThematicMapParamString
         * @returns {Object}, {"restparam": string, "legendcolors": Array},
         * restparam = "&semantickey=semkey&minsemanticarray=1,2,3&maxsemanticarray=5,6,7&colorarray=BGR1,BGR2,BGR3"
         * colorarray - код цвета в виде BGR!
         * legendcolors = массив элементов вида: {color:"RGB", text,"text"}
         */
        _getThematicMapParamString : function(project){
            if (typeof project !== 'object' ||
                typeof project.datagrid === undefined ||
                typeof project.viewgrid === undefined) {
                return false;
            }
            var records = project.viewgrid.records,
                semMin = [],
                semMax = [],
                colors = [],
                colorsForLegend = [], tmp = {},                          // цвета легенды
                param = {'semantickey': project.datagrid.semkey},
                gradCount = project.viewgrid.records.length;
            if ( !gradCount )
                gradCount = 1;

            for (var i = 0; i < gradCount; i++) {
                if (!records[i]) continue;
                semMin.push(parseFloat(records[i].val_from));
                semMax.push(parseFloat(records[i].val_to));
                var color = project.viewgrid.colors[i],
                red = color.substr(0, 2),
                green = color.substr(4, 2),
                blue = color.substr(2, 2);
                colors.push(green + blue + red);
                if ( !tmp[ color ] ) {
                    var colorForLegend = {
                      color: color,
					  from: parseFloat(records[i].val_from),
					  to: parseFloat(records[i].val_to),
					  type: parseFloat(records[i].val_type),
                      text: records[i].val_text,
                      count: 0
                    };
					
					if (records[i].val_name) {
					  colorForLegend.name = records[i].val_name;
					}
					
					colorsForLegend.push(colorForLegend);
                    tmp[color] = true;
                }
            }

            param["minsemanticarray"] = semMin.join(',');
            param["maxsemanticarray"] = semMax.join(',');
            param["colorarray"] = colors.join(',');
            var sparam = '';
            for (var key in param){
                sparam += '&' + key + '=' + param[key];
            }

            tmp = null;
            return {"restparam": sparam, "legendcolors": colorsForLegend};
        },

        /**
         * Создать вкладку настроек вида (View)
         *
         * @method createTabView
         * @param feature {Object} характеристика (семантика) для которой производим настройки.
         * JSON-объект, содержащий описание характеристики, которую выбрали на вкладке Data
         * { "recid": 1, "semname": "длина", "minvalue": "150", "maxvalue": "5000",
         * "layername": "Ногинский район", "layerid": "Noginsk","id": "Noginsk.3217" }
         */
        createTabView: function ( feature ) {

            if ( !feature ) {
                // очистить элементы управления
                $( "#view_gridGradation" ).html( '<br /><br /><div style="text-align: center;">' + w2utils.lang( 'Select data' ) + '</div>' );
                if ( w2ui[ 'view_gridGradation' ] )
                    w2ui[ 'view_gridGradation' ].destroy();
                $( '#view_Character' ).html( '' );
                $( '#view_ColorDef' ).html( '' );
                $( '#view_countGradation' ).val( '' );
                $( '#view_lbMin' ).html( '' );
                $( '#view_lbMax' ).html( '' );
                $( '#select-all-object' ).hide();
                return;
            }

            var tool = this;       // ссылка на экземпляр компонента "Создание тематических карт"
            var feature = feature; // ссылка на экземпляр выбранной записи характеристики

            // наименование характеристики
            $( '#view_Character' ).html( feature.semname );

            // Цвет для значения которое отсутствует или находится вне диапазона
            $( '#view_ColorDef' ).w2field( 'color' );

            // Число градаций
            var viewCountGradation = $( '#view_countGradation' );
            viewCountGradation.w2field( 'int', { autoFormat: false, min: 1 } );
            if ( !$.browser.msie )
                viewCountGradation.on( 'change', function ( event ) {
                    // пересоздать таблицу с новым числом градаций
                    gradationCount = $( this ).val();
                    tool.createGridGradation( feature, gradationCount );
                    // обновить таблицу
                    w2ui[ 'view_gridGradation' ].render();
                } );

            var maxVal = parseFloat( feature.maxvalue );
            var minVal = parseFloat( feature.minvalue );
            var gradationCount = Math.floor( maxVal - minVal );
            if ( gradationCount > 10 )
                gradationCount = 10;
            if ( gradationCount == 0 )
                gradationCount = 1;

            if (this.isThemeSelected()) {                                                      // 27/09/16
                if (this.themProjectRequest.viewgrid.colors && this.themProjectRequest.viewgrid.colors.length) {
                    this.colors = this.themProjectRequest.viewgrid.colors;
                    gradationCount = this.themProjectRequest.viewgrid.colors.length;
                }
            }

            if ((feature.semtype == "16")) {                                                     // тип семантики - значение из классификатора
                if (!this.isThemeSelected())
                gradationCount = this.getSemanticGradation(feature).length;                      // Тазин 15/07/2016
            }
            viewCountGradation.val( gradationCount );
            var viewBtnGradCountUpdate = $( '#view_btnGradCountUpdate' );
            viewBtnGradCountUpdate.attr( 'value', w2utils.lang( 'Update' ) );
            // Рассчитать параметры для указнного числа градаций
            viewBtnGradCountUpdate.on( 'click', function ( event ) {
                // пересоздать таблицу с новым числом градаций
                gradationCount = $('#view_countGradation').val();
                // сбросить выбранную тему проекта
                if (tool.isThemeSelected()) {
                    tool.themProjectRequest = null;
                }
                tool.createGridGradation( feature, gradationCount );
                // обновить таблицу
                w2ui[ 'view_gridGradation' ].render();
            } );


            // Минимум
            $( '#view_lbMin' ).html( w2utils.lang( 'Minimum:' ) + ' ' + feature.minvalue );
            // Максимум
            $( '#view_lbMax' ).html( w2utils.lang( 'Maximum:' ) + ' ' + feature.maxvalue );

            // Создать таблицу параметров градаций для выбранной характеристики
            this.createGridGradation( feature, gradationCount );

            return;
        },

        /**
         * Получить список значений семантик типа классификатор
         *
         * @method getSemanticGradation
         * @param feature {Object} характеристика (семантика) для которой производим настройки.
         * JSON-объект, содержащий описание характеристики, которую выбрали на вкладке Data
         * { "recid": 1, "semname": "длина", "minvalue": "150", "maxvalue": "5000",
         * "layername": "Ногинский район", "layerid": "Noginsk","id": "Noginsk.3217" }
         * @returns {Array} Возвращает массив семантик типа классификатор
         */
        getSemanticGradation: function ( feature ) {
            var semanticlist = [],lid;
            if( feature.layerid.indexOf(',') != -1 ){
                lid = feature.layerid.split(',')[0];
            }else{
                lid = feature.layerid;
            }
            var layer = this.map.tiles.getLayerByxId( lid );
            if (layer && layer.classifier) {
                var classifierlist = layer.classifier.getsemanticreference(feature.semkey);
                if (!classifierlist) {
                    console.log('Layer ' + feature.layerid + ' semantic ' + feature.semkey + ' classifier not found.');
                    return false;
                }
            }else{
                console.log('Layer with id ' + feature.layerid + 'not found.');
                return false;
            }
            feature.maxvalue = parseInt(feature.maxvalue);
            feature.minvalue = parseInt(feature.minvalue);
            for ( var i = 0; i < classifierlist.length; i++ ) {
                var value = parseInt(classifierlist[ i ].value);
                if ( feature.minvalue <= value && value <= feature.maxvalue )
                    semanticlist.push( classifierlist[ i ] );
            }
            return semanticlist;
        },

        /**
         * Создать таблицу градаций
         *
         * @method createGridGradation
         * @param feature {Object} характеристика (семантика) для которой производим настройки.
         * JSON-объект, содержащий описание характеристики, которую выбрали на вкладке Data
         * { "recid": 1, "semname": "длина", "minvalue": "150", "maxvalue": "5000",
         * "layername": "Ногинский район", "layerid": "Noginsk","id": "Noginsk.3217" }
         * @param gradationCount {Number} число градаций
         */
        createGridGradation: function ( feature, gradationCount ) {

            var tool = this;
            tool.colors = [];                           // очистить массив цветов
            gradationCount = parseInt(gradationCount);

            // проверка на наличие выбранной темы проекта
            if (this.isThemeSelected()) {
                if (tool.themProjectRequest.viewgrid.colors && tool.themProjectRequest.viewgrid.colors.length) {
                    tool.colors = tool.themProjectRequest.viewgrid.colors;
                    gradationCount = tool.themProjectRequest.viewgrid.colors.length;
                }
            }

            // проверка на существование таблицы
            if ( w2ui[ 'view_gridGradation' ] ) {
                if ( (w2ui[ 'view_gridGradation' ].header == feature.semkey) &&
                    (w2ui[ 'view_gridGradation' ].records.length == gradationCount) )
                    return;
                w2ui[ 'view_gridGradation' ].destroy();
                // w2ui[ 'view_gridGradation' ].clear();         // 02/03/20
                // w2ui[ 'view_gridGradation' ].header = "";    // 02/03/20
            }

            // создать таблицу параметров градаций для выбранной характеристики, если ее еще нет
            if ( !w2ui[ 'view_gridGradation' ] ) {

                var grid_rec = [];         // массив записей таблицы
                var recobj = {}; // запись таблицы
                if ( feature.semtype != "16" ) {                   // тип семантики, НЕ значение из классификатора
                    var minvalue = parseFloat( feature.minvalue ); // минимальное значение
                    var maxvalue = parseFloat( feature.maxvalue ); // максимальное значение
                    var gradationValues = maxvalue - minvalue;     // возможные значения
                    var gradationStep = 0;                         // шаг значений
                    if ( gradationValues != 0 )
                        gradationStep = gradationValues / gradationCount;
                    if ( gradationStep > 1 )
                        gradationStep = Math.floor( gradationStep );

                    var currVal = minvalue;                      // текущее значение
                    var nextVal = 0;                             // следующее значение

                    // заполнить массив записей для таблицы
                    for ( var ii = 1; ii <= gradationCount; ii++ ) {
                        nextVal = currVal + gradationStep;
                        if ( feature.semtype == "16" )
                            nextVal = currVal;

                        if ( ii == gradationCount )
                            nextVal = maxvalue;
                        if ( currVal > maxvalue )
                            break;
                        var text = feature.semname + ' ' + currVal + '-' + nextVal;
                        recobj = {
                            recid: ii,
                            val_color: '',
                            val_from: currVal,
                            val_to: nextVal,
                            val_text: text,
                            val_type: feature.semtype,
                            val_class: feature.rsc
                        };
                        // добавить запись с описанием объекта
                        grid_rec.push( recobj );
                        // увеличить текущее значение на шаг
                        currVal = currVal + gradationStep;
                    }
                }
                else {                                                // тип семантики, значение из классификатора (Тазин 15/07/2016)

                    var semanticList = this.getSemanticGradation( feature );

                    var a = semanticList.length % gradationCount == 0 ? 0 : 1;
                    gradationStep = Math.floor( semanticList.length / gradationCount ) + a;

                    var startVal = 0;                     //Индекс первого элемента в текущей градации
                    var endVal = startVal + gradationStep;//Индекс последнего элемента в текущей градации

                    while ( startVal < semanticList.length ) {
                        var name, text = feature.semname + ': ';
                        var fromVal = semanticList[ startVal ].value,
                            toVal = semanticList[ startVal ].value;
                        if ( endVal > semanticList.length )
                            endVal = semanticList.length;
                        for ( var i = startVal; i < endVal; i++ ) {
                            text += semanticList[ i ].name + "; ";
							name = semanticList[ i ].name;
                            if ( fromVal > semanticList[ i ].value )
                                fromVal = semanticList[ i ].value;
                            if ( toVal < semanticList[ i ].value )
                                toVal = semanticList[ i ].value;
                        }
                        recobj = {
                            recid: i,
                            val_color: '',
                            val_from: fromVal,
                            val_to: toVal,
                            val_text: text,
							val_name: name,
                            val_type: feature.semtype,
                            val_class: feature.rsc
                        };
                        grid_rec.push( recobj );
                        //Уточнение шага градации для более равномерного распределения объектов
                        gradationCount--;
                        if ( gradationCount < 1 )
                            gradationCount = 1;
                        a = (semanticList.length - endVal) % gradationCount == 0 ? 0 : 1;
                        gradationStep = Math.floor( (semanticList.length - endVal) / gradationCount ) + a;

                        //Пересчет индексов для следующей градации
                        startVal = endVal;
                        endVal = startVal + gradationStep;
                    }
                }

                // создать таблицу
                $( "#view_gridGradation" ).w2grid( {
                    name: 'view_gridGradation',
                    header: feature.semkey,
                    show: {
                        toolbar: true,
                        footer: true,
                        lineNumbers: true,
						toolbarReload: false
                    },
                    columns: [
                        {
                            field: "val_color",
                            caption: w2utils.lang( "Color" ),
                            size: '90px',
                            render: function ( record ) {
                                return '<input id="w2color' + record.recid + '" style="width:100%">';
                            }
                        },
                        {   field: "val_from",
                            caption: w2utils.lang( "From" ),
                            size: '50px',
                            editable: { type: 'float' }
                        },
                        {   field: "val_to", caption: w2utils.lang( "To" ), size: '50px', editable: { type: 'float' } },
                        {   field: "val_text",
                            caption: w2utils.lang( "Text" ),
                            size: '100%',
                            editable: { type: 'text' }
                        },
                        {   field: "val_type", caption: '', size: '2px', hidden: true, hideable: false }
                    ],
                    toolbar: {
                        items: [
                            //{ id: 'add', type: 'button', caption: w2utils.lang('Add Record'), icon: 'w2ui-icon-plus' },
							{type: 'button', id: 'save', caption: w2utils.lang('Save'), icon: 'w2ui-icon-check' },
							{type: 'button', id: 'addinproject', icon: 'w2ui-icon-plus', caption: w2utils.lang('Add this theme to projects')}
                        ],
						onClick: function (event) {
                            if ( event.target == 'save' ) {
                                // запомнить выбранные значения цветов
                                for ( var i = 0; i < this.owner.records.length; i++ ) {
                                    tool.colors[ i ] = $( '#w2color' + this.owner.records[ i ].recid ).val();
                                }
                                // сохранить внесенные в грид изменения
                                this.owner.save();
                                // перезаполнить грид
                                this.owner.render();
                            }
							else if (event.target == 'addinproject') {
								tool.addProjectTheme();
							}
                        }
                    },
                    records: grid_rec,
                    onRender: function ( event ) {
                        event.onComplete = function () {
                            var color;
                            for ( var i = 0; i < this.records.length; i++ ) {
                                // сформировать элемент управления для выбора цвета
                                if ( tool.colors.length == this.records.length )
                                    color = tool.colors[ i ];        // цвет из массива (уже настроили)
                                else
                                    color = tool.getRandomColor(); // случайный цвет
                                var w2color = $( '#w2color' + this.records[ i ].recid );
                                w2color.val( color );
                                w2color.w2field( 'color' );
                            }

                        }
                    }

                } );
            }
            $("#view_gridGradation").find("#grid_view_gridGradation_toolbar table").css("padding","0 !important");

        },

        /**
         * Получть случайный HTML-код цвета (без знака #)
         *
         * @method getRandomColor
         * @return {String} Возвращает HTML-код цвета (без знака #)
         */
        getRandomColor: function () {
            var letters = '0123456789ABCDEF'.split( '' );
            var color = '';
            for ( var i = 0; i < 6; i++ ) {
                color += letters[ Math.floor( Math.random() * 16 ) ];
                    }
            return color;
        },

        // Доступ к проекту тематических карт
        // ==============================================================

        /**
         * Создать таблицу проекта тематических карт
         *
         * @method createProjectGrid		 *
        */
        createProjectGrid: function () {
			var that = this;
			$('#tab_projects_grid').w2grid({
				name: 'tab_projects_grid',
				header: w2utils.lang('Projects'),
                            show: {
					               footer: false,
					               header: false,
                                   toolbar: true,
					               toolbarReload: false,
					               toolbarColumns: false
                            },
                            toolbar: {
                                items: [
						                { type: 'button', id: 'delete', caption: w2utils.lang('Delete'), img: 'w2ui-icon-cross' },
                                        { type: 'button', id: 'applay', caption: w2utils.lang('Apply'), img: 'w2ui-icon-check' }
                                ],
					onClick: function (event) {
						if (event.target == 'delete') {
							var rec = this.owner.getSelection(), i;
							if ( rec.length == 0 || !rec )return false;
							this.owner.remove(rec[0]);
							for (i = 0; i < that.themProject.theme.length; i++) {
							    if (that.themProject.theme[i].id != rec[0])
							        continue;
							    that.themProject.theme.splice(i, 1);
							    if (that.isThemeSelected() && rec[0] == that.themProjectRequest.id)
							        that.themProjectRequest = null;
							    break;
							}
						    //обновляем таблицу
							that.refreshProjectGrid();
							return;
						}
						if (event.target == 'applay') {
						    that.applayProjectTheme(event);
						    return;
						}
                     }
                },
				columns: [
					{field: 'semname', caption: w2utils.lang('Theme'), size: '100%'},
					{field: 'layername', caption: w2utils.lang('Layer name'), size: '100%'},
					{field: 'gradationcount', caption: w2utils.lang('Gradations'), size: '35%'}
				],
				records: []
			});
        },

		/**
		 * Открыть файл проекта тематических карт
         * Функция Считывает содержимое файла,заполняет таблицу на вкладке Проекты
         * и инициализирует объект проекта this.themProject.theme
         *
         * @method openProject
		*/
        openProject: function () {
            this.themProjectRequest = null;
			var fileData = function (text) {
				var json = JSON.parse(text);
				var records = [], i;
				this.themProject.theme = json['theme'];
                // установим id записи
				for (i = 0; i < this.themProject.theme.length; i++) {
				    this.themProject.theme[i].id = i + 1;
				}
                // заполним таблицу проекта
				for (var i = 0; i < this.themProject.theme.length; i++) {
					records.push({
					    recid: this.themProject.theme[i].id,
						semname: this.themProject.theme[i].datagrid.semname,
						layername: this.themProject.theme[i].datagrid.layername,
						gradationcount: this.themProject.theme[i].viewgrid.colors.length,
						semkey: this.themProject.theme[i].datagrid.semkey,
						rsc: this.themProject.theme[i].datagrid.rsc
					});
                }
				if (records.length > 0) {
					if (w2ui['tab_projects_grid']) {
                        if (!w2ui['tab_projects_grid'].records){
                            w2ui['tab_projects_grid'].records = [];
                        }
                        //records.forEach(function(record){w2ui['tab_projects_grid'].records.push(record)});
						w2ui['tab_projects_grid'].records = records;
						w2ui['tab_projects_grid'].refresh();
                    }
                }
			};

			GWTK.Util.openFile(fileData.bind(this));
        },

        /**
         * Сохранить текущий проект тематических карт в файл
         *
         * @method saveProject		 *
		*/
		saveProject: function () {
            if (!this.themProject || $.isEmptyObject(this.themProject) ||
                this.themProject.theme.length == 0) {
                return;
            }
		    var jsonString = JSON.stringify(this.themProject);
			var fileName = $('#thematicmap_name').val();
			if (!fileName || fileName == '') {
				fileName = 'new_theme.json';
			} else {
				fileName += '.json';
			}
			GWTK.Util.saveDataInFile(jsonString, fileName);
		},

        /**
         * Закрыть проект. Очищает объект проекта в классе и таблицу проектов
         *
         * @method closeProject		 *
		 */
        closeProject: function () {
            this.themProject.theme = [];
            if (this.isThemeSelected())
                this.themProjectRequest = null;
			//очистить грид
			if (w2ui['tab_projects_grid']) {
				w2ui['tab_projects_grid'].clear();
			}
			return;
        },

        /**
         * Добавить тему в проект
         * Добавляет описание темы в таблицу проекта по текущим параметрам темкарты
         *
         * @method addProjectTheme		 *
         * @returns {boolean}
         */
        addProjectTheme: function () {
			// выделенные записи семантики
			var recid = w2ui[this.gridDataName].getSelection(), i;
			if (!recid) {
                return false;
            }
			// запись семантики
			var records = w2ui[this.gridDataName].get(recid[0]);
			if (!records) {
                return false;
			}

			// цвета для градаций значения семантики
			var colors = [];
			for (i = 0; i < w2ui['view_gridGradation'].records.length; i++) {
				colors.push($('#w2color' + w2ui['view_gridGradation'].records[i].recid).val());
			}

			if ($('#view_ColorDef').val() != '') {
				//заполняем объект доступ к ключу семантики this.themProject.theme[i].semkey заполняем  значением по умолчанию
				this.themProject.theme.push({
					"datagrid": records,
					"viewgrid": {
						"records": w2ui['view_gridGradation'].records,
						"colors": colors,
						"outofrange": $('#view_ColorDef').val()
					}
				});
            }
            else {
				//заполняем объект доступ к ключу семантики this.themProject.theme[i].semkey
				this.themProject.theme.push({
					"datagrid": records,
					"viewgrid": {"records": w2ui['view_gridGradation'].records, "colors": colors}
				});
			}
			var recid = 0;

			for (i = 0; i < this.themProject.theme.length; i++) {
			    if (this.themProject.theme[i].id && this.themProject.theme[i].id > recid)
			        recid = this.themProject.theme[i].id;
			}
			recid++;

			i = this.themProject.theme.length - 1;
			this.themProject.theme[i].id = recid;

			this.refreshProjectGrid();

			return;
        },

        /**
         * Получить параметры темы по таблицам семантики и вида
         *
         * @method _getCurrentThemeByGrid
		 * @returns {object} JSON {"datagrid":{record}, "viewgrid":"records":[],"colors":[]}
         */
        _getCurrentThemeByGrid: function(){
            if (!w2ui[this.gridDataName] || !w2ui['view_gridGradation']){
                return false;
            }
            var recid = w2ui[this.gridDataName].getSelection();
			if (!recid || recid.length == 0) {
                return false;
            }
			// запись семантики
			var semrecord = w2ui[this.gridDataName].get(recid[0]);
			if (!semrecord) {
                return false;
			}

            var theme = $.extend({}, this.currentTheme),
            // цвета для градаций значения семантики
            colors = [], i, len;
			for (i = 0; len = w2ui['view_gridGradation'].records.length, i < len; i++) {
				colors.push($('#w2color' + w2ui['view_gridGradation'].records[i].recid).val());
			}

            // заполняем тему
            theme["datagrid"] = semrecord;
            theme["viewgrid"] = { "records": w2ui['view_gridGradation'].records, "colors": colors};
            if ($('#view_ColorDef').val() != '') {
                theme["viewgrid"]["outofrange"] = $('#view_ColorDef').val();
            }

            return theme;
        },

        /**
         * Применить тему и создать тематический слой
         *
         * @method applayProjectTheme		 *
         */
        applayProjectTheme: function (event) {

            if (this.themProject.theme.length == 0 || !w2ui['tab_projects_grid'])
                return false;
            if (!w2ui['tab_projects_grid'].records || w2ui['tab_projects_grid'].records.length == 0)
                return false;
            var recid = w2ui['tab_projects_grid'].getSelection(), i, index = -1;
            if (recid.length == 0) {
                w2alert(w2utils.lang('Select theme, please') + ' !');
                return false;
            }
            var record = w2ui['tab_projects_grid'].get(recid[0]);

            for (i = 0; i < this.themProject.theme.length; i++) {
                if (this.themProject.theme[i].id != recid[0])
                    continue;
                index = i;
                break;
            }
            if (index < 0) {
                console.log('Error. Selected theme is not found !');
                return false;
            }
            record = this.themProject.theme[index];

            // формируем массив идентификаторов слоев карты
            var layers = record.datagrid.layerid.split(','), mapid=[];
            for (i = 0; i < layers.length; i++) {
                var lay = this.map.tiles.getLayerByxId(layers[i]);
                if (!lay) continue;
                if (lay.selectObject && lay.idLayer)
                    mapid.push(lay.idLayer);
            }

            // сбросить выделение в списке слоев
            if (w2ui['tab_layers_grid']) {
                w2ui['tab_layers_grid'].selectNone();
                this.selectedLayers_Request = {};                   // 25/02/20
            }

            // запомнить текущую тему
            this.themProjectRequest = record;

            // настроить таблицы данных
            w2ui[this.tabsName].click('data');

            var options = { "url": "", "id": GWTK.Util.createGUID(), "alias": record.datagrid.semname,
                        "selectObject": "1", "selectsearch": "0", "semkey": record.datagrid.semkey };

            // создать тематическую карту по описанию темы
            this._createThematicMap(options, record);

            return;
        },

        isThemeSelected: function () {
            if (this.themProjectRequest && this.themProjectRequest.id)
                return true;
            return false;
        },

        clearThemeSelected: function() {
            this.themProject.theme = [];
            if (this.isThemeSelected()) {
                this.themProjectRequest = null;
            }
            if (w2ui['tab_projects_grid']) w2ui['tab_projects_grid'].clear();
            return;
        },

        /**
         * Обновляет таблицу проектов согласно содержанию объекта this.themProject.theme
         *
         * @returns {boolean}
         */
        refreshProjectGrid: function () {
			if (this.themProject.theme.length == 0) return false;
			var records = [];
			for (var i = 0; i < this.themProject.theme.length; i++) {
				records.push({
				    recid: this.themProject.theme[i].id,
					semname: this.themProject.theme[i].datagrid.semname,
					layername: this.themProject.theme[i].datagrid.layername,
					gradationcount: this.themProject.theme[i].viewgrid.colors.length,
					semkey: this.themProject.theme[i].datagrid.semkey,
					rsc: this.themProject.theme[i].datagrid.rsc
				});
			}
			if (records.length > 0) {
				if (w2ui['tab_projects_grid']) {
					w2ui['tab_projects_grid'].records = records;
					w2ui['tab_projects_grid'].refresh();
				}
			}
        },

        /**
         * Открыть тему проекта и создать темкарту для указанных слоев карты
         *
         * @param theme {Object}- тема проекта для семантики
         * @param layers {Array} - массив идентификаторов слоев карты, для которых выполняется картографирование
         * @param callback {function} - адрес функции обработки ошибок
         * @return {Number} - код возврата:
        */
        openThemeOfProjectForLayers: function (theme, layers, callback) {

             if ((!theme || $.isEmptyObject(theme)) ||
                 (!layers || !$.isArray(layers) || layers.length == 0)) {
                 console.log("ThematicMapControl --> opentThemeOfProject : " + w2utils.lang("Input data error"));
                 return -1;
             }

             // описание темы
             this.themProjectRequest = theme;
			 this.themProjectRequest.datagrid.layerid = layers.join(',');
			
             // объекты слоев
             this.themeProjectObject = null;

             // callback function
             this.themeProjectCallback = null;

             if (typeof (callback) == 'function') {
                 this.themeProjectCallback = callback;
			 }
    
			 var record = this.themProjectRequest.datagrid,
			 alias = record.semname,
			 id = GWTK.Util.createGUID();
             options = { "url": "", "id": id, "alias": alias, "selectObject": "1", "selectsearch": "0",
			 "semkey": record.semkey, "semname": record.semname };
 
             this._createThematicMap(options, this.themProjectRequest);
			          
             return 1;
        },
        
		/**
		 * Создать легенду тематического слоя
         *
		 * @param layerId {String} идентификатор слоя
		 * @param viewgrid {Array} - массив объектов {"color": цвет(HEX),"text":подпись легенды}
		 * @return {Array} - массив элементов легенды вида {"id":'',"img":'', "text":''} (w2ui.nodeItem)
		 */
		createLegend: function ( layerId, viewgrid ) {
			if ( !viewgrid ) return false;
			var items = [], legendClass = '';
			for ( var i = 0; i < viewgrid.length; i++ ) {
				if ( this.map.tiles.svgLegendColors && this.map.tiles.svgLegendColors[ viewgrid[ i ][ 'color' ] ] === undefined ) {
					this.map.tiles.svgLegendColors[ viewgrid[ i ][ 'color' ] ] = true;
					legendClass += '.tl' + viewgrid[ i ][ 'color' ] + ' {background-color: #' + viewgrid[ i ][ 'color' ] + '}' + '\n';
				}
				items.push( {
					id: "tl" + layerId + viewgrid[ i ][ 'color' ],
					text: viewgrid[ i ][ 'text' ],
					img: 'tl' + viewgrid[ i ][ 'color' ]
				} );
			}
			var styleBlock = $( '#them_legend_class_header' );
			if ( styleBlock.length > 0 ) {
				var innerHtml = styleBlock.html();
				styleBlock.html( innerHtml + legendClass );
				innerHtml = null;
			} else {
				if ( legendClass !== '' ) {
					$( 'head' ).append( '<style type="text/css" id="them_legend_class_header">' + legendClass + '</style>' );
				}
			}
			return items;
        }
    }
}
