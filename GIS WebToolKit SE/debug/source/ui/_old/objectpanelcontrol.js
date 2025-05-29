/********************************** Нефедьева О.А. **** 04/03/21 ****
 ********************************** Соколова Т.О.  **** 10/08/20 ****
 ********************************** Помозов Е.В.   **** 28/05/21 ****
 ********************************** Патейчук В.К.  **** 20/05/20 ****
 ********************************** Полищук Г.В.   **** 18/12/19 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент "Объекты карты" (панель)               *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {
    /**
	 * @constructor
	 * @param map {Object} - объект класса карты
	 * @param options {Object} - объект параметров,предоставляет возможность переопределения методов
     *                {subGridHeight: number, refreshTime: number_millisecond }
	 */
	GWTK.ObjectPanelControl = function ( map, options ) {
		this.map = map;
		this.options = options || {};
		this.toolname = 'objectPanel';
		this.panel = null;
		this.panelHeight = { size: 370,	unit: 'px' };
		if($('.objects-panel-flex').length > 0) {
			this.panelHeight.size = $('.objects-panel-flex').height();
		}

		this.panelDelta = 47;
		this.gridName = 'objectPanelGrid' + GWTK.Util.randomInt( 30000, 60000 );
		this.gridDiv = null;
		this.$gridDiv = null;

		//options
		this.subGridHeight = this.options.subGridHeight || 50 + 'px';
		this.refreshTime = this.options.refreshTime || 20000;
        this.selectedObjects = (this.options.selectedObjects && this.options.selectedObjects instanceof GWTK.selectedFeatures) ? this.options.selectedObjects : this.map.selectedObjects;
        this.mode = this.options.mode || 'show';

        this.startTime = (new Date()).getTime();

		this.sendScrollEvent = true;                   // индикатор события скролл
		this.sendScrollEventPane = this.map.eventPane; // панель получатель события

		//запрошенные семантики в текущей сессии чтобы не отправлять повторно запрос на сервер
		this.sessionSemanticResponse = {};

		this.map.maptools.push( this );

		this.subGridStorage = {};

		this._objectInfoFilter = this.map.options.objectinfo || false;

	    // установить параметры
		for ( var k in this.options ) {
			if ( this.options.hasOwnProperty( k ) ) {
				if ( typeof  this.options[ k ] === 'function' ) {
					this[ k ] = GWTK.Util.bind( this.options[ k ], this );
				} else {
					this[ k ] = this.options[ k ];
				}
			}
		}

		this.init();
	};
	GWTK.ObjectPanelControl.prototype = {
		/**
		 * Инициализация
		 */
		init: function () {
			this.createPane();
			this.createGrid();
			this.initEvents();
			this.setResizable();
			// если указана панель для компонентов, то перетаскивание недоступно
			if(!this.map.options.controlspanel) {
				this.setDraggable();
			}
			this.$panel.hide();
		},

		isVisible: function () {
			return $( this.panel ).is( ':visible' );
		},

		/**
		 * Назначить обработчики событий
		 */
		initEvents: function () {

		    // Событие обновления списка отобранных объектов карты
		    $(this.map.eventPane).on("featureinforefreshed.featureinfo", GWTK.Util.bind(this.onFeatureInfoRefreshed, this));

			// Вывести информацию об объекте в гриде по идентификатору объекта
			$( this.map.eventPane ).on( 'showfeatureinfo.featureinfo', GWTK.Util.bind( function ( event ) {

			    if (this.mode && this.mode !== 'hide') {
					this.map.getMapTaskBar().onPanelClose(this.$panel);
					this.$panel.show();
					// развернуть общую панель для компонентов (если используется)
					this.map.showControlsPanel();
			    }

			    if (event.centering && event.centering == 1) {
			        this.centering = true;
			    }
			    this.selectRecordByGid( event.mapobject );
			}, this ) );

			// Отменить выбранные объекты
			$( this.map.eventPane ).on( 'featurelistcanceled.featureinfo', GWTK.Util.bind( function () {
			    this.map.getMapTaskBar().onPanelClose(this.$panel);
			    this.$panel.hide();
			    this.clearGrid();
			}, this));

			// обработка изменений размера панели контролов
			$(this.map.eventPane).on('resizecontrolspanel.mapcontent', function (event) {
				// изменить размеры своей панели
				this.resize();
			}.bind(this));

		},

		/**
		 * Изменить размер дочерних элементов по размеру панели
		 */
		resize: function () {
			// согласовать размеры грида
			w2ui[ this.gridName ].resize();
			this.resizeSubGrids();
		},

		/**
		 * Показать информацию о площади и длине объекта
		 * @method _showObjectArea
		 * @returns {Boolean} 'true' - показать
		 */
		_showObjectArea: function(){
			if (this._objectInfoFilter){
				if ('area' in this._objectInfoFilter)
				   return this._objectInfoFilter.area;
			}
			return true;
		},

		/**
		 * Показать информацию о номере объекта
		 * @method _showObjectNumber
		 * @returns {Boolean} 'true' - показать
		 */
		_showObjectNumber: function(){
			if (this._objectInfoFilter){
				if ('number' in this._objectInfoFilter)
				   return this._objectInfoFilter.number;
			}
			return true;
		},

		/**
		 * Показать информацию о семантике объекта
		 * @method _showObjectSemantic
		 * @returns {Boolean} 'true' - показать
		 */
		_showObjectSemantic: function(){
			if (this._objectInfoFilter){
				if ('semantic' in this._objectInfoFilter)
				   return this._objectInfoFilter.semantic;
			}
			return true;
		},

	    /**
		 * Обработчик события обновления списка отобранных объектов карты
		 * @param e {Object} объект события "featureinforefreshed"
		 */
		onFeatureInfoRefreshed: function (e) {
		    this.lastExpanded = undefined;
		    if (!this.map.canShowFeatureInfo()) {
		        this.$panel.hide();
		        return;
		    }
            if (e && !e.layers) {
		        this.$panel.fadeOut("slow");
		        this.clearGrid();
		        return;
		    }
            if (!this.selectedObjects.mapobjects || this.selectedObjects.mapobjects.length === 0) {
		        this.$panel.hide();
		        return false;
		    }

		    this.centering = true;                     // признак центрирования карты по объекту
            if (e && typeof e.centering != 'undefined') {
		        if (e.centering == 0)
		           this.centering = false;
		    }
		    this.lastExpanded = undefined;

			/*this.showinfo = undefined;
            if (e && typeof e.act != 'undefined' && e.act === "showinfo") {
                this.showinfo = true;
            }*/

		    var coll = w2ui[this.gridName].getColumn('layername'),
            	rest_context = (e && e.rest_context) ? e.rest_context : null;

			w2ui[this.gridName].stateRestore();
			if (!rest_context){coll._rest_context = false;}

		    if (coll !== null) {
		        if (coll._rest_context || (rest_context && !coll.hidden)) {
		            w2ui[this.gridName].hideColumn('layername');
					coll._rest_context = true;           // признак переключения колонки для rest-поиска
		        }
		        else {
		            if (coll.hidden)
		                w2ui[this.gridName].showColumn('layername');
		            coll._rest_context = false;
		        }
		    }

			this.map.getMapTaskBar().onPanelClose(this.$panel);
			this.$panel.show();
			// развернуть общую панель для компонентов (если используется)
			this.map.showControlsPanel();

		    this.addRecordsToMainGrid(this.getValidRecordsFromMapObject(rest_context));

		    if (rest_context) {
		        w2ui[this.gridName].sort('objectname', 'asc', true);
		    }

		    // Выделяем запись первого объекта
		    if (this.selectedObjects.mapobjects[0].geometry.count() == 0) {
		        $(this.map.eventPane).one('mapobjectloadWfs', GWTK.Util.bind(function (e) {
		            this.selectRecordByGid(e.gid);
		        }, this));
		    }
		    else {
				if (!e.gid) {
					this.selectRecordByGid(this.selectedObjects.mapobjects[0].gid);
				}
				else {
					this.selectRecordByGid(e.gid);
				}
			}

		    var grid = w2ui[this.gridName], _that = this, disabled = true, gid;
		    if (!grid) return;
		    if ( this.map.options.measurement.show ) {
		        grid.toolbar.show('measurementshow');
		    }
		    else {
		        grid.toolbar.hide('measurementshow');
		        grid.toolbar.refresh();
		    }

		    // Кнопка редактирования семантики объекта
		    grid.toolbar.remove('editingdata');

		    if (grid.getSelection().length > 0) {
		        gid = grid.records[grid.getSelection()[0]].gid;
		        var mapObject = this.selectedObjects.findobjectsByGid(gid);
				if (this.map.mapeditor) {
				  // проверить разрешение на редактирование
				  var edtOptions = this.map.options.settings_mapEditor;
				  if (edtOptions) {
					var editFunc = edtOptions.functions;
				    if (editFunc.length == 0 || editFunc.indexOf('*') !== -1 || editFunc.indexOf('edit') !== -1) {
					  if (this.map.mapeditor.maplayersid.length > 0) {
				        this.map.mapeditor.setlayers();
					  }
					  if (this.map.mapeditor.iseditingobject(mapObject)) {
					    disabled = false;
					  }
				    }
				  }
				}
		    }

		    w2ui[this.gridName].toolbar.insert('xlsexport',
                {
                    type: 'button',
                    id: 'editingdata',
                    caption: '',
                    hint: w2utils.lang("Edit"),
                    img: 'w2ui-icon-pencil',
                    hidden: disabled,
                    onClick: function (event) {
                        event.onComplete = function (event) {
                            _that.editingData();
                        }
                    }
                }
		    );

			// если указана панель для компонентов, то перетаскивание недоступно
			if(!this.map.options.controlspanel) {
				this.$panel.draggable( "option", "cancel", '.ui-resizable-handle, #grid_' + this.gridName + '_toolbar, ' + '#grid_' + this.gridName + '_body, ' + '#grid_' + this.gridName + '_footer ' );
			}

            if (this.mode == 'hide'){
                this.$panel.hide();
            }
		},
		/**
		 * Установить панель для тригера
		 * @param panel {HTML Object}
		 */
		setTriggerPanel: function ( panel ) {
			if ( !panel )return false;
			this.sendScrollEventPane = panel;
		},
		/**
		 * Добавить слушателя прокрутки
		 * @param triggerPanel
		 */
		addScrollEvent: function ( triggerPanel ) {
			this.removeScrollEvent();
			var $recordsDivNew = $( '#grid_' + this.gridName + '_records' );
			var that = this;
			$recordsDivNew.on( 'scroll.objectPanel', function () {
				var h = $( this ).height();
				var st = $( this ).scrollTop();
				var sh = $( this )[ 0 ].scrollHeight;
				if ( h + st == sh ) {
					$( triggerPanel ).trigger( {
						type: 'scrollend',
						eventData: { records: w2ui[ that.gridName ].records.length }
					} )
				}
			} );
		},
		/**
		 * Удаляем старые обработчики
		 */
		removeScrollEvent: function () {
			var $recordsDivOld = $( '#grid_' + this.gridName + '_records' );
			$recordsDivOld.off( 'scroll.objectPanel' );
		},
		/**
		 * Получить запись в таблице по gid возвращает ссылку на объект
		 * @param gid - gmlid бъекта
		 * @returns {boolean}
		 */
		getRecordByGid: function ( gid ) {
			if ( !gid || !this.gridName || !w2ui[ this.gridName ] ) {
				console.log( 'this is not ObjectPanelControl class' );
				return false;
			}
			for ( var i = 0; i < w2ui[ this.gridName ].records.length; i++ ) {
				if ( w2ui[ this.gridName ].records[ i ].gid === gid ) {
					return w2ui[ this.gridName ].records[ i ];
				}
			}
			return false;
		},

		/**
		 * Сделать панель перемещаемой
		 */
		setDraggable: function () {
			if (!this.map)
				return;
			GWTK.panelUI({ draggable: true, $element: this.$panel, resizable: false });
		},

		/**
		 * Выбрать запись по идентификатору объекта
		 * @param gid - идентификатор объекта
		 * @returns {boolean}
		 */
		selectRecordByGid: function ( gid ) {
		    if (!gid || !w2ui[this.gridName]) return false;
		    var i, len, expand =true,
				grid = w2ui[this.gridName];
			if (this._objectInfoFilter){
				var mapObject = this.selectedObjects.findobjectsByGid(gid);
				if (mapObject.semantic.semantics.length == 0){
					expand = false;
				}
			}
		    for (i = 0; len = grid.records.length, i < len; i++) {
		        if (grid.records[i].gid !== gid) { continue; }
		        grid.select(grid.records[i].recid);
				var old = this.lastExpanded, ind = i, recid;
				if (expand){
					recid = grid.records[i].recid;
					setTimeout(function () { if(!grid.get(recid)){return;};grid.expand(recid); grid.collapse(old); grid.scrollIntoView(ind); }, 150);
				}
		        this.lastExpanded = grid.records[i].recid;
		        return;
		    }
		    return;
		},

		/**
		 * Показать всплывающее окно
		 * @param e
		 */
		getMeasurementOverlay: function ( e ) {
			var html = '';
			//console.log($(e.target).offset(), $(this.panel).offset());
			var measurement = this.selectedObjects.getMeasurement();
			var options = {
				"text": '',
				"display": true,
				"height": 70,
				"width": 400,
				"top": $(e.target).offset().top + 20,
				"left":$(this.panel).offset().left,
				"duration":7000
			};

			if ( measurement.areaSum > 0 ) {
				measurement.areaSum = this.map.squareMetersToUnits( measurement.areaSum );
				html += '<tr><td><span class="measurement-total">' + w2utils.lang('The total area of ​​the selected objects') + ' : </span></td><td><span class="measurement-total">' + measurement.areaSum.area.toFixed(3) + ' ' + w2utils.lang(measurement.areaSum.unit) + '</span></td></tr>';
			}
			if ( measurement.perimeterSum > 0 ) {
				measurement.perimeterSum = this.map.linearMetersToUnits( measurement.perimeterSum );
				if ( measurement.perimeterSum.unit == 'ft' || measurement.perimeterSum.unit == 'Nm' )
					measurement.perimeterSum.unit += ' ';
				html += '<tr><td><span class="measurement-total">' + w2utils.lang('The total perimeter of the selected objects') + ': </span></td><td><span class="measurement-total">' + measurement.perimeterSum.perimeter.toFixed( 3 ) + ' ' + w2utils.lang( measurement.perimeterSum.unit ) + '</span></td></tr>';
			}
			if (html.length > 0){
				options.text = '<table>' + html + '</table>';
			}
			if ( typeof measurement.perimeterSum == 'object' || typeof measurement.areaSum == 'object' ) {
				if ( measurement.perimeterSum.perimeter > 0 || measurement.areaSum.area > 0 ) {
					GWTK.mapWriteProtocolMessage(this.map, options);
				}
			}
			else {
				if ( measurement.perimeterSum > 0 || measurement.areaSum > 0 ) {
					GWTK.mapWriteProtocolMessage(this.map, options);
				}
			}
		},

		/**
		 * Сделать панель растягиваемой
		 */
		setResizable: function () {
			var that = this;
			this.$panel.resizable( {
				handles: 's,w,sw',
				resize: function ( event, ui ) {
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
				stop: function ( event, ui ) {
					that.$gridDiv.height( $( this ).height() - 30 );
					if ( w2ui[ that.gridName ] ) w2ui[ that.gridName ].resize();
					that.resizeSubGrids();
				},
				create: function () {
					$( this ).parent().on( 'resize', function ( e ) {
						e.stopPropagation();
					} );
				},
				minHeight: 340,
				minWidth: 400
			} );
		},

		/**
		 * Создать панель
		 */
		createPane: function () {
			this.panel = this.options.panel || GWTK.DomUtil.create( 'div', 'map-panel-def objects-panel', this.map.mapPane );
			this.panel.style.height = this.panelHeight.size;
			this.$panel = $( this.panel );

			this.panel.appendChild( GWTK.Util.createHeaderForComponent( {
                context: this,
			    name: 'Map objects',
                map:this.map,
			    callback: GWTK.Util.bind(function () {
			        var map = this.map;
			        this.$panel.hide('slow', function () { map.handlers.objectsPane_close_click(); });
			    }, this),
			    minimizePanel: this.$panel,
				minimizeIconClass: 'features-panel-icon'
			} ) );

			this.gridDiv = document.createElement( 'div' );
			this.gridDiv.style.height = (this.panelHeight.size - this.panelDelta) + this.panelHeight.unit;
			this.$gridDiv = $( this.gridDiv );
			this.panel.appendChild( this.gridDiv );

			this.footer = document.createElement( 'div' );
			this.$footer = $( this.footer );
			this.panel.appendChild( this.footer );

			this.$panel.hide();
		},

		/**
		 * Создать таблицу
		 */
		createGrid: function () {
			var that = this;
			this.$gridDiv.w2grid( {
				header: w2utils.lang( 'Objects' ),
				name: that.gridName,
				show: {
					header: false,
					columnHeaders: true,
					footer: true,
					toolbar: true,
					toolbarReload: false,
					toolbarColumns: true
				},
				multiSearch: false,
				multiSelect: false,
				columns: [
					{ field: 'findobject', hideable: false, caption: '', size: '20px' },                           // Столбец для маркера
					{ field: 'objectname', caption: w2utils.lang('Object name'), size: '50%', sortable: true },    // Столбец для имени объекта
					{ field: 'layername', caption: w2utils.lang('Layer name'), size: '50%', sortable: true },      // Столбец для названия слоя
					{ field: 'additionalinfo', hideable: false, caption: '', size: '30px' }                        // Дополнительная информация
				],
				searches: [
					{ type: 'text', field: 'objectname', caption: w2utils.lang( 'Object name' ) },
					{ type: 'text', field: 'layername', caption: w2utils.lang( 'Layer name' ) }
				],
				records: [],
				onExpand: function (event) { that.onExpand(event); },
				onCollapse: function (event) {
				    event.stopPropagation();
				    var sgs = that.subGridStorage['subgrid-' + event.recid];
				    event.onComplete = function (event) {
				        if ( sgs ) { sgs = null; }
				    }
				},
				onSelect: GWTK.Util.bind( this.onSelectObject, this ),
				additionalInfo: GWTK.Util.bind( function ( event, htmlElement, layerId, gid, recid ) {
					var expandedDiv = document.getElementById( 'grid_' + this.gridName + '_rec_' + recid + '_expanded_row' );
					var divId = 'additionalInfoDiv' + layerId + '_' + recid;
					var additionalDiv = document.getElementById( divId );
					var layer = this.map.tiles.getLayerByxId( layerId );
					if ( $( htmlElement ).hasClass( 'collapse-more-info' ) ) {
						$( htmlElement ).removeClass( 'collapse-more-info' );
						if ( layer && (typeof layer.options.additionalInfo === 'function') ) {
							layer.options.additionalInfo( {
								gid: gid,
								layerid: layerId,
								containerid: divId,
								active: false
							} );
							if ( w2ui[ this.gridName ] ) {
								w2ui[ this.gridName ].resize();
							}
						}
					} else {
						if ( !additionalDiv ) {
							if ( !expandedDiv ) {
								$( "<tr><td colspan='5'><div id='" + divId + "'></div></td></tr>" ).insertAfter( '#grid_' + this.gridName + '_rec_' + recid );
							} else {
								$( "<tr><td colspan='5'><div id='" + divId + "'></div></td></tr>" ).insertAfter( expandedDiv );
							}
						}
						if ( layer && (typeof layer.options.additionalInfo === 'function') ) {
							layer.options.additionalInfo( {
								gid: gid,
								layerid: layerId,
								containerid: divId,
								active: true
							} );
							if ( w2ui[ this.gridName ] ) {
								w2ui[ this.gridName ].resize();
							}
						}
						$( htmlElement ).addClass( 'collapse-more-info' );
					}
					$( '#grid_' + this.gridName + '_records' ).css( { overflowY: 'auto' } );
					event.stopPropagation();
					event.preventDefault();
				}, this )
			});

			w2ui[this.gridName].toolbar.add({ type: 'break', id: 'tb_break' });

			w2ui[this.gridName].toolbar.add([
                {
                    type: 'button',
                    id: 'xlsexport',
                    caption: '',
                    hint: w2utils.lang("Export a list of objects to Excel"),
                    icon: 'gwtk-icon-file-excel',
                    onClick: function (event) {
                        event.onComplete = function (event) {
                            that.exportToExcel();
                        }
                    }
                },
                {
                    type: 'button',
                    id: 'measurementshow',
                    caption: '',
                    hint: w2utils.lang( "Statistics" ),
                    icon: 'gwtk-toolbar-list-ico',
                    hidden: false,
                    onClick: function (event) {
						event.onComplete = function (event) {
						    that.getMeasurementOverlay(event.originalEvent);
						}
						return false;
                    }
                    },
                    {
                        type: 'button',
                        id: 'selectall',
                        caption: '',
                        hint: w2utils.lang('Select all'),
                        icon: 'gwtk-icon-select-all',
                        onClick: GWTK.Util.bind(function (event) {
                            event.onComplete = GWTK.Util.bind(function () {
                                this.selectedObjects.drawSelectedObjects();
                            }, this)
                        }, this)
                }
             ]
			);

	        // обработчик клика на значке
			w2ui[ this.gridName ].on('click', function (event) {
			    var grid = this;
			    event.onComplete = function (event) {
			        var sel = grid.getSelection();
			        if (sel.length == 0) {
			            that.selectedObjects.clearDrawAll();
			        }
			    };
			});

			w2ui[this.gridName].stateSave(true);
		},

		/**
		 * Рисование объекта при клике по маркеру
         * @method onSelectObject
         * @param event {Object} объект события
		 */
		onSelectObject: function ( event ) {
		    event.onComplete = GWTK.Util.bind(this.onCompleteSelectObject, this);
		},

	    /**
		 * Выделение объекта в рисунке карты по gmlid
         * @method onCompleteSelectObject
         * @param event {Object} объект события
		 */
		onCompleteSelectObject: function (event) {
		    var gid;
		    if (!event) {
		        console.log('Event object is undefined!');
		        return false;
		    }
		    if (event && event.gid) {
		        gid = event.gid;
		    }
		    else if (event.recid !== undefined || event.recid !== null || event.recid !== false) {
		        if (this.gridName && w2ui[this.gridName]) {
		            var rec = w2ui[this.gridName].get(event.recid);
		            if (!rec) {
		                console.log('Records with recid ' + event.recid + 'not found');
		                return false;
		            } else {
		                gid = rec.gid;
		            }
		        }
			}

		    var mapObject = this.selectedObjects.findobjectsByGid(gid);
		    if (!mapObject) {
		        return;
			}

		    if (this.centering && mapObject.objectcenter) {
		        this.selectedObjects.viewSelectedObject(mapObject);
		    }

		    var setpos = !this.centering;
		    this.selectedObjects.drawSelectedObjects(true, mapObject, setpos);

		    $(this.map.eventPane).trigger({ type: 'featurelistclick', layer: mapObject.maplayerid, gid: gid, act: 'selfeature' });
		    //if (typeof this.showinfo !== 'boolean' || this.showinfo === false) {      20/11/19 !?
		    //}

		    this.centering = true;                  // 12/04/19
		    // Установка флага редактирования, если выделенная запись на редактируемом слое и объект подлежит редактированию
		    var grid = w2ui[this.gridName], item;
		    if (grid && grid.toolbar) {
		        item = grid.toolbar.items.find(
                    function (element, index, array) {
                        if (element.id == 'editingdata') {
                            return element;
                        }
                    });
		    }
		    if (item) {
		        item.hidden = true;
		        if (this.map.mapeditor && this.map.mapeditor.iseditingobject(mapObject)) {
		            item.hidden = false;
		        }
		        grid.toolbar.refresh();
		    }
		    return;
		},

		/**
		 * Вставить запись "номер объекта" в начало массива
		 * @param array{Array} - ссылка массив куда положить
		 * @param mapObject {mapObject} объект карты
		 */
		pushObjectNumber: function ( array, mapObject ) {
		    var gmldata = GWTK.Util.parseGmlId(mapObject.gid);
		    if (!gmldata || !gmldata.objid)
				return;
			if (!this._showObjectNumber()){
				return;
			}
		    array.unshift( {
				recid: (new Date()).getTime(),
				name: w2utils.lang( 'Object number' ),
				value: gmldata.objid,
                objectkey:1
			});
		},

		getSemanticDocumentEvent: function () {
			var that = this;
			$( '.object-panel-sem-doc' ).off().on( 'click', function () {
				that.map.handlers.getFileDocument( $( this ).attr( 'layerid' ), $( this ).attr( 'semvalue' ) );
			} );
		},

		/**
		 * Расшифровка семантики
		 * @param mapObject {Object} - объект карты
		*/
		getObjectSemanticRecords:  function (mapObject) {
		    if (!mapObject) return false;
		    var tmp = [];
		    var value = null;
		    this.pushObjectNumber(tmp, mapObject);


			var layer = this.map.tiles.getLayerByxId(mapObject.maplayerid);
			var semanticfilter = layer.options.semanticfilter;

			if (this._showObjectSemantic()) {
			  for (var i = 0; i < mapObject.semantic.semantics.length; i++) {

				if (semanticfilter && semanticfilter.indexOf(mapObject.semantic.semantics[i].shortname) == -1) {
				  continue;
				}

				if (mapObject.semantic.semantics[i].shortname) {
		            if (mapObject.semantic.semantics[i]['textvalue'] && typeof (mapObject.semantic.semantics[i]['textvalue']) === "string") {
		                value = null;
		                if (mapObject.semantic.semantics[i]['textvalue'].indexOf('doc#') !== -1 || mapObject.semantic.semantics[i]['textvalue'].indexOf('HOST#') !== -1) {
		                    var pos = mapObject.semantic.semantics[i]['textvalue'].lastIndexOf('#') + 1;
		                    var filename = mapObject.semantic.semantics[i]['textvalue'].substring(pos);
		                    value = '<span layerid="' + mapObject.wmtsId + '" semvalue="' + mapObject.semantic.semantics[i]['textvalue'] + '"  class="object-panel-sem-doc panel-info-text-semdocument" >' + filename + '</span>';
		                } else if (mapObject.semantic.semantics[i]['textvalue'].indexOf('@') !== -1) {
		                    value = '<a href="mailto:' + mapObject.semantic.semantics[i]['textvalue'] + '" target="_blank" >' + mapObject.semantic.semantics[i]['textvalue'] + '</a>';
		                } else if (mapObject.semantic.semantics[i]['textvalue'].indexOf('://') !== -1) {
		                    var sem_url = GWTK.Util.parseUrl(mapObject.semantic.semantics[i]['textvalue']);
		                    if (sem_url.protocol.length > 0) {
		                        var prot = sem_url.protocol.toLowerCase();
		                        if (prot.indexOf('http') != -1 || prot.indexOf('ftp') != -1) {
		                    value = '<a href="' + mapObject.semantic.semantics[i]['textvalue'] + '" target="_blank" >' + mapObject.semantic.semantics[i]['textvalue'] + '</a>';
		                        }
		                    }
		                } else {
		                    value = mapObject.semantic.semantics[i].textvalue;
		                }
		                tmp.push({
		                    recid: i,
		                    name: mapObject.semantic.semantics[i].name ? mapObject.semantic.semantics[i].name : mapObject.semantic.semantics[i].shortname,
		                    value: value,
		                    shortname: mapObject.semantic.semantics[i].shortname
		                });
		            }
		        }
		      }
			}

		    if (mapObject && mapObject.arealoaded && this._showObjectArea()) {
		        var area = this.map.squareMetersToUnits(mapObject.arealoaded);
		        if (area.unit == 'sq km' && area.area < 1.0) {
		            area.text = Number(area.area).toFixed(8) + ' ' + w2utils.lang(area.unit);
		        }
		        else {
		            area.text = Number(area.area).toFixed(3) + ' ' + w2utils.lang(area.unit);
		        }
		        tmp.push({
		            recid: tmp.length + 1,
		            name: w2utils.lang('Area'),
		            value: area.text
		        });
		    }
		    if (mapObject && mapObject.perimeterloaded && this._showObjectArea()) {
		        var perimeter = this.map.linearMetersToUnits(mapObject.perimeterloaded);
		        tmp.push({
		            recid: tmp.length + 1,
		            name: w2utils.lang('Perimeter'),
		            value: Number(perimeter.perimeter).toFixed(3) + ' ' + w2utils.lang(perimeter.unit)
		        });
		    }

		    return tmp;
		},

		/**
		 * Обновить подтаблицы
		 */
		resizeSubGrids: function () {
			for ( var k in this.subGridStorage ) {
				if ( this.subGridStorage.hasOwnProperty( k ) ) {
					if ( w2ui[ k ] ) {
						w2ui[ k ].resize();
					}
				}
			}
		},
		/**
		 * Свернуть подтаблицу
		 * @param recid
		 */
		collapse: function ( recid ) {
		    w2ui[this.gridName].collapse(recid);
		},
		/**
		 * Обработчик события onExpand w2ui grid
		 * @param event {Object} - объект события
		 * @returns {boolean}
		 */
		onExpand: function (event) {

		    event.stopPropagation();
			var that = this;
			var semantics;
			var subRecords;
			var rec = w2ui[event.target].get(event.recid);
			var gmldata = GWTK.Util.parseGmlId(rec.gid);
			if (!gmldata || !gmldata.objid || this.mode === 'hide')                        // 05/02/19
			    return false;
            var mapObject = this.selectedObjects.findobjectsByGid(rec.gid);
			if ( !mapObject ) {
				this.collapse( event.recid );
				console.log( "Can not find object " + event.recid );
				return false;
			}
			var layer = this.map.tiles.getLayerByxId( mapObject.maplayerid );
			if ( !layer ) {
				this.collapse( event.recid );
				return false;
			}

			if ( !this.sessionSemanticResponse[ event.recid ]) {
			    semantics = mapObject.semantic.semantics;
			    if (semantics) {
			        subRecords = this.getObjectSemanticRecords(mapObject);
			        if ( subRecords ) {
			            this.sessionSemanticResponse[ event.recid ] = subRecords;
			        }
			    }
			    else {
			        subRecords = [];
			        this.pushObjectNumber( subRecords, mapObject );
			    }
			}
			else {
				subRecords = this.sessionSemanticResponse[ event.recid ];
			}

			var $box = $('#' + event.box_id.replace('.', '\\.'));
			var len = 1;
			if ( subRecords && subRecords.length > 0 ) {
				len = subRecords.length;
			}
			else {
				len = 0;
			}
			len = (len + 1) * 25;

			var subGridId = event.recid;
			if ( w2ui[ 'subgrid-' + subGridId ] ) {
			    w2ui['subgrid-' + subGridId].destroy();
			    w2ui['subgrid-' + subGridId] = undefined;
				if ( this.subGridStorage[ 'subgrid-' + subGridId ] ) {
					delete this.subGridStorage[ 'subgrid-' + subGridId ];
				}
			}

			$box.css({
			    margin: '0px',
			    padding: '0px',
			    width: '100%'
			}).stop().animate({ height: subRecords.length >= 1 ? this.subGridHeight : len + 'px' }, 10);

            if (subRecords.length == 0){
	            return;
			}

			setTimeout( function () {
				that.subGridStorage[ 'subgrid-' + subGridId ] = true;
				$box.w2grid( {
					name: 'subgrid-' + subGridId,
					show: { columnHeaders: false },
					fixedBody: false,
					columns: [
						{ field: 'name', caption: w2utils.lang( 'Name' ), size: '50%' },
						{ field: 'value', caption: w2utils.lang( 'Value' ), size: '50%' }
					],
					records: subRecords,
                    onResize: function(e){
                        e.onComplete = function(){
                            setTimeout(function(){
                                w2ui[that.gridName].resize();
                            },500);
                        }
                    }
				});

				that.getSemanticDocumentEvent();
			}, 100 );
		},

		/**
         * Получить значение семантики поиска для фильтра семантики
         * @param layer {Object} слой карты
         * @param mapobject {Object} объект карты
         * @param sem_filter {String} фильтр семантики (что ищем в семантике)
         * @returns {String} значение семантики или пустая строка
        */
		_getSemanticValueByKey: function (layer, mapobject, sem_filter) {
		    if (!layer || !mapobject || !sem_filter || sem_filter.length == 0) {
		        return "";
		    }
		    if (!layer.keysTextSearch || layer.keysTextSearch.length == 0) {
		        return "";
		    }
		    var sem_keys = layer.keysTextSearch, i, len;
		    for (i = 0; len = sem_keys.length, i < len; i++){
		        var sem = mapobject.semantic.value(sem_keys[i]);
                if (sem) {
                    var semval = sem.textvalue.toLowerCase();
                    if (semval.indexOf(sem_filter) > -1) {
                        return sem.textvalue;
                    }
                }
		    }
		    return "";
		},

        /**
         * Получить записи таблицы для отобранных объектов карты
         * @param context {Object} контекст поиска по названию в карте (по семантике),
         * JSON-объект, context.sem_text - значение семантики для поиска объектов; необязательный параметр.
         * При наличии контекста к имена объекта добавляется значение семантики, по которой найден объект.
         * @returns {Object}, {{records: Array, reset: boolean}}
        */
		getValidRecordsFromMapObject: function (context) {
            var tmp = [], len = this.selectedObjects.mapobjects.length, i, gid, expandImage = '',
		        expandGrid = true;

		    if (context && context.sem_text) {
		        context.sem_text = context.sem_text.toLowerCase();
		    }
			for (i = 0; i < len; i++) {
                var layer = this.map.tiles.getLayerByxId(this.selectedObjects.mapobjects[i].maplayerid),
			        xId = "", alias = "",
                    objname = this.selectedObjects.mapobjects[i].name;
                gid = this.selectedObjects.mapobjects[i].gid;
				if (layer) {
				    xId = layer.xId;
				    alias = layer.alias || "";

				    if (typeof layer.options.additionalInfo === 'function') {
				        expandImage = '<img onclick="w2ui[\'' + this.gridName + '\'].additionalInfo(event, this, \'' + xId + '\',\'' + gid + '\',\'' + i + '\');" class="expand-more-info">'
				    }
				    else {                                            // 03/05/18
				        expandImage = '';
				    }
				    if (context && context.sem_text) {
                        var sem_value = this._getSemanticValueByKey(layer, this.selectedObjects.mapobjects[i], context.sem_text);
				        if (sem_value.length > 0)
				            objname = sem_value + " / " + objname + " / " + alias;
				    }
				} else {
				    expandGrid = false;
				}

                if ( this.selectedObjects.mapobjects[ i ].maplayername && !alias ) {
                    alias = this.selectedObjects.mapobjects[i].maplayername;
			    }
				tmp.push( {
					recid: i,
					findobject: '<img class="panel-info-img-search" src="' + GWTK.imgMarkerBlankRed + '" />',
					objectname: objname,
					layername: alias,
					additionalinfo: expandImage,
					gwtksemantics: {},
                    gid: this.selectedObjects.mapobjects[ i ].gid
				} )
			}

		    // Если объект из адресного поиска, то expand на grid не нужен
			if ( w2ui[ this.gridName ] ) {
			    w2ui[this.gridName].show.expandColumn = expandGrid;
			}

			return { records: tmp, reset: true };
		},

		/**
		 * Добавить запись в главную таблицу
		 * @param object {Object} {reset: true || false|| undefined, records: {} || []}
		 */
		addRecordsToMainGrid: function (object) {
			this.sessionSemanticResponse = {}; //обнуляем хранилище семантики
			if ( object.hasOwnProperty( 'reset' ) && object.reset === true ) {
				w2ui[ this.gridName ].clear();
			}
			w2ui[this.gridName].add(object.records);
			this.addScrollEvent( this.sendScrollEventPane );
		},

		/**
		 * Очистить таблицу
		 */
		clearGrid: function () {
			w2ui[ this.gridName ].clear();
            w2ui[ this.gridName ].refresh();
		},

	    //****************************************************************
	    // Методы выгрузки таблицы объектов в Excel                      *
        //****************************************************************
	    /**
		  * Экспортировать в Excel
          * @method exportToExcel
		 */
		exportToExcel: function () {

		    var grid = w2ui[this.gridName], tool = this;
		    var colls = grid.columns, j, collcount = 3,
		        rows = grid.records, i, rowscount = grid.records.length,
		        table = document.createElement('table');

		    var _id = GWTK.Util.randomInt(1000, 50000), td;
		    // заголовок таблицы
		    var header = this.getTableHead();

		    if (!header) {
		        console.log(w2utils.lang("Export to Excel") + '. ' + w2utils.lang("Runtime error"));
		        return;
		    }

		    var order = header.order;                          // id колонок таблицы
		    table.appendChild(header.head);

		    var maxRow = 1000;                            // максимальное число строк в таблице для выгрузки
		    var tblCount = Math.ceil(rowscount / maxRow); // число таблиц для выгрузки
		    var tblIndex = 0;                             // текущий индекс таблицы для выгрузки
		    var rowIndex = 0;                             // текущий индекс строки в таблице для выгрузки
		    this.idExportToExcel = 'pnExportToExcel_' + _id;
		    // окно со ссылками на xls-файлы
		    if (tblCount > 1) {
		        w2popup.open({
		            title: w2utils.lang('Export to Excel'),
		            body: '<div class="w2ui-centered">' +
                            '<div style="margin-bottom:20px;">' + w2utils.lang('List of objects is divided into files of') + ' ' + maxRow + ' ' + w2utils.lang('entries') + ':</div>' +
                            '<div id="' + tool.idExportToExcel + '"></div>' +
                          '</div>'
		        });
		    }

		    // строки таблицы
		    for (i = 0; i < rowscount; i++) {
		        var tr = this.getObjectRow(header, rows[i]);
		        if (tr) {
		            table.appendChild(tr);
		        }

		        rowIndex += 1;
		        // сохранить таблицу по частям
		        if ((tblCount > 1) && (rowIndex == maxRow)) {
		            rowIndex = 0;
		            tblIndex += 1;
		            // Создать ссылку на таблицу Excel
		            tool.createLinkXLS(table, 'objlist_' + tblIndex + '.xls');

		            // создать шапку для новой таблицы
		            table = document.createElement('table');
		            var head_ = $(header.head).clone();
		            table.appendChild(head_[0]);
		        }
		    }

		    if (tblCount > 1) {                                                                   // список объектов разбит на несколько файлов, допишем последнюю часть
		        tblIndex += 1;
		        tool.createLinkXLS(table, 'objlist_' + tblIndex + '.xls');
		    }
		    else {                                                                                // весь список объектов в одном файле
		        var a = document.createElement('a');
		        a.download = 'objlist.xls';
		        a.href = 'data:application/vnd.ms-excel;charset=utf-8,<html><head><meta%20charset="utf-8"></head><body><table>' +
				    $(table).html() + '</table></body></html>';
		        document.body.appendChild(a);     // для FireFox
		        a.setAttribute("type", "hidden"); // для FireFox
		        a.click();
		    }

		    GWTK.Util.hideWait();
		},

	    /**
		  * Создать ссылку на файл в панели
          * @method createLinkXLS
          * @param table {HTML Table} элемент таблица
          * @param name {String} имя файла
		 */
		createLinkXLS: function (table, name) {
		    if (!table || !this.idExportToExcel)
		        return;

		    // ссылка на файл
		    var $pane = $('#' + this.idExportToExcel),
		        a = document.createElement('a');
		    a.download = name;
		    a.href = 'data:application/vnd.ms-excel;charset=utf-8,<html><head><meta%20charset="utf-8"></head><body><table>' +
			        $(table).html() + '</table></body></html>';
		    $(a).text(name);
		    $(a).attr('class', 'linkXLS');
		    $pane.append(a);
		    // разделитель
		    var span = document.createElement('span');
		    $(span).text(' ');
		    $pane.append(span);

		    GWTK.Util.hideWait();
		},

	    /**
		  * Получить заголовок таблицы
          * @method getTableHead
          * @return {Object} JSON, {head: tr (заголовки ячеек таблицы), order: [массив имен ячеек]}
		 */
		getTableHead: function () {

		    var grid = w2ui[this.gridName], tool = this;
		    var colls = grid.columns, j, collcount = 3,
		        rows = grid.records, i, rowcount = grid.records.length,
		        head = document.createElement('tr'), j;
		    head.id = 'head_', $head = $(head),
            order = ['objectname', 'layername', 'gid', 'perimeter', 'area'];

		    for (j = 1; j < collcount; j++) {              // имя, слой
		        var td = document.createElement('td');
		        $(td).html(encodeURIComponent(colls[j].caption));
		        head.appendChild(td);
		    }
		    var td = document.createElement('td');            // номер
		    $(td).html(encodeURIComponent(w2utils.lang("Object number")));
		    head.appendChild(td);
		    var td = document.createElement('td');            // длина
		    $(td).html(encodeURIComponent(w2utils.lang("Perimeter")));
		    head.appendChild(td);
		    var td = document.createElement('td');            // периметр
		    $(td).html(encodeURIComponent(w2utils.lang("Area")));
		    head.appendChild(td);

		    for (i = 0; i < rowcount; i++) {                  // семантики
                var mapobject = this.selectedObjects.findobjectsByGid(rows[i].gid);
		        if (!mapobject) { continue; }
		        var objsem = mapobject.semantic.semantics;
		        if (!objsem || objsem.length == 0) { continue; }

		        for (j = 0; j < objsem.length; j++) {
		            if (!objsem[j].shortname) { continue; }
		            var pos = $.inArray(objsem[j].shortname, order);    // ???
		            if (pos == -1) {
		                var td = document.createElement('td');
		                $(td).html(encodeURIComponent(objsem[j].name));
		                head.appendChild(td);
		                order.push(objsem[j].shortname);
		            }
		        }
		    }
		    return { head: head, order: order };
		},

	    /**
		  * Получить пустую запись таблицы
          * @method getEmptyObjectRow
          * @param head {HTML tr} заголовок таблицы
          * @return {Element} tr, строка таблицы
		 */
		getEmptyObjectRow: function (head) {
		    if (!head) { return null; }
		    var $td = $(head).find('td');
		    if (!$td.length) { return null; }

		    var tr = document.createElement('tr'), i, len;
		    for (i = 0; len = $td.length, i < len; i++) {
		        tr.appendChild(document.createElement('td'));
		    }
		    return tr;
		},

	    /**
		  * Получить запись таблицы
          * @method getObjectRow
          * @param header {Object} JSON, {head: tr (заголовки ячеек таблицы), order: [массив имен ячеек]}
          * @param row {Object} запись таблицы w2grid
          * @return {Element} tr, строка таблицы
		 */
		getObjectRow: function (header, row) {
		    if (!row || !header) { return null; }
		    var fields = ['objectname', 'layername', 'gid'], j,
		        head = header.head,
                order = header.order;

		    var tr = this.getEmptyObjectRow(head);

		    var td_all = $(tr).find('td');
		    if (td_all.length == 0) { return null; }

		    for (j = 0; j < fields.length; j++) {
		        var index = $.inArray(fields[j], order);
		        if (typeof row[fields[j]] !== 'undefined' && index > -1) {
		            $(td_all[index]).html(encodeURIComponent(row[fields[j]]));
		        }
		    }
            var mapobject = this.selectedObjects.findobjectsByGid(row.gid);
		    if (!mapobject) {
		        console.log("Can not find object " + row.gid);
		        return tr;
		    }
		    var sem_records = this.getObjectSemanticRecords(mapobject);
		    if (!sem_records) {
		        return tr;
		    }
		    // выводим семантику, периметр, площадь
		    for (j = 0; j < sem_records.length; j++) {
		        if (sem_records[j].objectkey) { continue; }
		        if (typeof (sem_records[j]['shortname']) == 'undefined') {               // периметр, площадь
		            if (sem_records[j].name === w2utils.lang('Perimeter')) {
		                var index = $.inArray('perimeter', order);
		                if (index > -1 && sem_records[j].value != undefined)
                            $(td_all[index]).html(encodeURIComponent(sem_records[j].value));

		            }
		            else if (sem_records[j].name === w2utils.lang('Area')) {
		                var index = $.inArray('area', order);
		                if (index > -1 && sem_records[j].value != undefined)
		                    $(td_all[index]).html(encodeURIComponent(sem_records[j].value));
		            }
		        }
		        else {                                                                  // семантики
		            var index = $.inArray(sem_records[j]['shortname'], order);
		            if (index > -1 && sem_records[j].value != undefined)
		                $(td_all[index]).html(encodeURIComponent(sem_records[j].value));
		        }
		    }

            return tr;
		},

		/**
		 * Возвращает структуру данных для данного компонента включая аргументы функции
		 * @returns {{}}
		 */
		getHelpers: function () {
			return {
				recordsFormat: {
					text: 'Records for this grid should have next format',
					value: [ {
						recid: 'uniqueid',
						findobject: '<img src="icon" />',
						objectname: 'Object Name',
						layername: 'Layer Name',
						gwtksemantics: {}
					} ]
				},
				functions: {
					addRecordsToMainGrid: {
						text: "Function args",
						value: { reset: "true || false || undefined", records: "{} || []" }
					}
				}
			}
		},
		/**
		 * Вызвать метод w2ui таблицы
		 * @param methodName - название метода
		 * @param args - аргументы для вызываемой функции
		 * @returns {boolean}
		 */
		callGridMethod: function ( methodName, args ) {
			if ( !methodName || !this.gridName || !w2ui[ this.gridName ] ) return false;
			if ( typeof w2ui[ this.gridName ][ methodName ] == 'function' ) {
				return w2ui[ this.gridName ][ methodName ]( args );
			}
		},

	    // Редактирование семантики объекта
		editingData: function () {
		    var selected, grid = w2ui[this.gridName];
		    if (!grid || (selected = grid.getSelection()).length == 0)
		        return;
            var mapobject = this.selectedObjects.findobjectsByGid(grid.get(selected[0]).gid);  // ссылка
		    if (!mapobject) return;

            var layer = this.map.tiles.getLayerByxId(mapobject.maplayerid);
		    if (!layer) return;
		    var semanticoptions = {
		        "graphic": false,
		        "autonomic": true
		    },
                semanticoptions_graphic = {
                    "graphic": true,
                    "autonomic": true
                };

		    semanticoptions.buttons = {
		        "restore": true,
		        "delete": true,
		        "repeat": true,
		        "save": true,
		        "allsemantics": true,
		        "hidden": true
		    };

		    semanticoptions_graphic.buttons = {
		        "restore": true,
		        "delete": true,
		        "save": true
		    };

		    var id = this.gridName + '_semantic', _that = this,  editsemantic;
		    var gmldata = GWTK.Util.parseGmlId(mapobject.gid);

		    // Запросим семантику объекта
			mapobject.getsemanticsobject(gmldata.objid, GWTK.Util.bind(
				function(rscobject){
					if (rscobject) {
						editsemantic = mapobject.semantic;
					}
				}, this
			));


            // var rscobjectnumber = layer.classifier.getsemanticsobject(gmldata.objid);
            // if (!rscobjectnumber || !rscobjectnumber.rscsemantics || rscobjectnumber.rscsemantics.length == 0){
            //     mapobject.setSemanticsForGraphic(function(semantic){
            //         editsemantic = semantic;
			// 	});
            // }
			// else {
			// 	editsemantic = new GWTK.mapsemantic(mapobject, rscobjectnumber.rscsemantics);
			// 	if (!editsemantic) return;
		    // }

		    setTimeout(GWTK.Util.bind(function(){

		    	if (!editsemantic) {
		    		return;
				}
				var semantics = this.map.mapeditor.getsemanticmask(editsemantic, mapobject);
				if (!semantics || semantics.length == 0) {
					w2utils.lang("No editing semantics");
					return;
				}

				this.onUpdateMapObject = GWTK.Util.bind(this.onUpdateMapObject, this);

				$().w2popup('open', {
					title: mapobject.name + ' ' + mapobject.gid,
					body: '<div class="w2ui-centered" id = "' + id + '" style="width: 100%; height: 100%;"></div>',
					style: 'padding: 10px 10px 10px 10px; background: #ffffff;',
					width: 700,
					height: 700,
					overflow: 'hidden',
					speed: '0.3',
					showClose: true,
					showMax: true,
					onMax: function (event) {
						event.onComplete = function () {
							$('#' + id).height(event.options.height);
							_that.rscsemantics.resize(event.options.height);
						}
					},
					onMin: function (event) {
						event.onComplete = function () {
							$('#' + id).height(event.options.height);
							_that.rscsemantics.resize(event.options.height);
						}
					},
					onToggle: function (event) {
						$(w2ui[_that.rscsemantics._id].box).hide();
						event.onComplete = function () {
							$(w2ui[_that.rscsemantics._id].box).show();
							_that.rscsemantics.resize();
						}
					},
					onOpen: function (event) {
						event.onComplete = function () {
							$( '.w2ui-msg-title' ).css( {
								'background': '#ffffff',
								'border': 'none',
								'padding-left': '20px',
								'text-align': 'left'
							} );
							if (!_that.rscsemantics) {
								if (layer instanceof GWTK.graphicLayer)
									_that.rscsemantics = new GWTK.SemanticEditor(_that.map, layer.classifier, id, semantics, semanticoptions_graphic);
								else
									_that.rscsemantics = new GWTK.SemanticEditor(_that.map, layer.classifier, id, semantics, semanticoptions);
							}
							_that.rscsemantics.resize();
						}
					},
					onClose: function (event) {
						// Если не было сохранения, то восстановить, что было испорченно
						if (_that.rscsemantics.issave) {
							$(_that.map.eventPane).on('updatemapobject', _that.onUpdateMapObject);
							mapobject.semantic.updatesemantics(_that.rscsemantics._object);
							mapobject.save('replace');
						}
						_that.rscsemantics.destroy();
						_that.rscsemantics = null;
					}

				});

            }, this), 400);
		},

	    /**
         * Событие при обновлении объекта на сервере
         * @method  onUpdateMapObject
         * @param event {Object} Событие
         */
	    // ===============================================================
		onUpdateMapObject: function (event) {
		    $(this.map.eventPane).off('updatemapobject', this.onUpdateMapObject);

		    if (event.error) {
		        w2alert(w2utils.lang("Failed to save the object."));
		        return;
		    }

		    var grid = w2ui[this.gridName];
		    if (!grid) return;
            var selection = grid.getSelection(), recid, expanded;
		    if (selection && selection.length > 0) {
		        recid = selection[0];
				expanded = grid.get(recid).expanded;
		    }
		    grid.refresh();
		    if (recid >= 0)
		        this.sessionSemanticResponse[recid] = null;
		    if (expanded) {
		        setTimeout(function () {
		            grid.expand(recid);
		        }, 100);
		    }
		},

	    /**
		 * Деструктор
		 * @method destroy
		 */
		destroy: function () {

		    $(this.map.eventPane).off('updatemapobject', this.onUpdateMapObject);

		    $('.object-panel-sem-doc').off();
		    $(this.map.eventPane).off("featureinforefreshed.featureinfo");
		    $(this.map.eventPane).off('showfeatureinfo.featureinfo');
		    $(this.map.eventPane).off('featurelistcanceled.featureinfo');

		    if (w2ui[this.gridName]) {
		        w2ui[this.gridName].destroy();
		    }
		    if (this.$gridDiv) {
		        this.$gridDiv.remove();
		    }

		    this.$panel.resizable('destroy');

		    this.$panel.empty();

		    if (!this.options.panel) {
		        this.$panel.remove();
		    }
		},

        /**
         * Установка режима отображения панели
         * setModeObjectList
         * @param mode {String} режим отображения панели ("show"/"hide")
         */
		setModeObjectList: function(mode){
            if (this.mode != mode) {
                this.mode = mode;
                if (this.mode === 'hide') {
                    this.$panel.hide();
                    this.map.setTotalShowFeatureInfoFlag(false);
                }
                else {
                    this.map.setTotalShowFeatureInfoFlag(true);
                    this.onFeatureInfoRefreshed();
                }
            }
            return;
        },

        /**
         * Установка класса отобранных объектов для панели
         * setSelectedObjects
         * @param selectedObjects - класс отобранных объектов  GWTK.selectedFeatures
         */
		setSelectedObjects: function (selectedObjects) {
            if (selectedObjects && selectedObjects instanceof GWTK.selectedFeatures) {
                this.selectedObjects = selectedObjects;
                this.onFeatureInfoRefreshed();
            }
        }


    }
}
