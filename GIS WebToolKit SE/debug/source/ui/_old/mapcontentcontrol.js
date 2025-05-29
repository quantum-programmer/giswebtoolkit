/*************************************** Нефедьева О.   07/12/20 ***
**************************************** Патейчук В.К.  20/05/20 ***
**************************************** Полищук Г.В.   14/01/19 ***
**************************************** Соколова Т.О.  29/01/19 ***
**************************************** Гиман Н.       14/03/18 ***
**************************************** Помозов Е.В.   02/03/21 ***
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                  Компонент "Слои" (состав карты)                 *
*                                                                  *
*******************************************************************/

if ( window.GWTK ) {

    GWTK.ItemData = function () {
        this.img = null;
        this.alias = null;
        this.itemid = null;
        this.group = false;
        this.checked = false;
        this.expanded = true;
        this.clickable = true;
    };

    GWTK.MapContentControl = function (map, parent) {

        this.toolname = 'mapcontent';
        this.map = map;
        if (!this.map) {
            console.log("MapContentControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.button = null;
        this.parent = parent;
		this.showsettings = false;
		this.id = this.map.divID + '_mapcontent';
		this.name = this.id;
		this.toolBarName = this.map.divID + '_mapcontent_toolbar';

		this.init();
    };

    GWTK.MapContentControl.prototype = {

		/**
		 * Инициализация
		 * @method init
		 */
		init: function () {

			if ( !this.map ) {
			    console.log("MapContentControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
                return;
            }

			// создать панель управления
			this.createPanel();

			// создать кнопку управления
			this.createButton();

			this.map.maptools.push(this);

            // создать тулбар
			this.createToolbar(this.parent);

		    // создать дерево
			this.createTree();

			// прочитать параметры дерева слоев
			this.loadTree(this.prepareItemText());

			this.setResizable();

			// если указана панель для компонентов, то перетаскивание недоступно
			if(!this.map.options.controlspanel) {
				this.setDraggable();
			}

            $(this.map.eventPane).trigger({ type: 'mapcontentloaded' });

            // настроить узлы виртуальных папок в дереве
            var i, len = this.map.virtualfolders.length;
			for ( i = 0; i < len; i++ ) {
				this.setFolderTreeItem(this.map.virtualfolders[ i ].xId);
            }

			this.setLayersVisibility();

            // согласовать размеры
			this.resize();

			this.initEvents();

			return true;
		},

		/**
		 * Создать панель управления
		 * @method createPanel
		 * @return {Object} HTMLElement, панель управления
		 */
		createPanel: function(){

			var class_pane = 'map-panel-def map-contents-panel',
			    parent = this.map.panes.mapPane;
            // если указана панель для компонентов, то создаем в ней
			if (this.map.options.controlspanel) {
				class_pane = 'map-panel-def-flex map-contents-panel-flex';
				parent = this.map.mapControls;
			}

			this.mapContentPane = this.map.createPane(class_pane, parent);

			this.mapContentPane.id = this.map.divID + '_mapcontentPane';
			this.$mapContentPane = $(this.mapContentPane);
			this.mapContentPane.style.display = 'none';

			if (!this.parent) {
			    this.parent = this.mapContentPane;
			}

			this.createPanelHeader();

		},

		/**
		 * Создать кнопку управления
		 * @method createButton
		 * @return {Object} HTMLElement кнопки управления.
		 */
		createButton: function () {

			this.button = GWTK.DomUtil.create('div', 'control-button control-button-content clickable', this.map.panes.toolbarPane);
			this.button.title = w2utils.lang("Layers");
			this.$button = $(this.button);

			this.$button.on('click', function () {
			    if (this.$button.hasClass('control-button-active')) {
			        this.$button.removeClass('control-button-active');
			        this.$mapContentPane.hide('slow');
				}
				else {
					this.$button.addClass('control-button-active');
					if (this.map.options.controlspanel) {
						this.$mapContentPane.show(50);
						this.map.showControlsPanel();
					}
					else
					    this.$mapContentPane.show(300);
			    }
				//this.map._writeCookiePanels();
			}.bind(this) );

			return this.button;
		},

		/**
		 * Получить имя дерева
		 * @method getName
		 * @returns {string}
		 * @public
		 */
		getName: function () {
            return this.name;
		},

		/**
		 * Изменить размер дочерних элементов по размеру панели
		 * @method resize
		 */
		resize: function () {
			// согласовать размеры дерева
			if (!w2ui[this.getName()]) { return; }
			$(w2ui[this.getName()].box).css({
				width: this.$mapContentPane.width(),
				height: this.$mapContentPane.height() - 70
			});
			// обновить дерево
			if (w2ui[this.getName()])
				w2ui[this.getName()].resize();
	    },

        /**
         * Назначить обработчики событий
         * @method initEvents
         * @private
         */
		initEvents: function () {
		    var that = this;
		    $(this.map.eventPane).on('layerlistchanged.mapcontent', function (event) {
		        if (!event || !event.maplayer) return;
		        if (event.maplayer.act && event.maplayer.act == "remove") {
		            GWTK.Util.removeTreeNode(that.getName(), event.maplayer.id);
		        }
		        return;
		    });

		    this.onLayerCommand = GWTK.bind(this.onLayerCommand, this);
			$(this.map.eventPane).on('layercommand.mapcontent', this.onLayerCommand);

			// обработка изменений размера панели контролов
			$(this.map.eventPane).on('resizecontrolspanel.' + this.toolname, function (event) {
				this.resize();     // изменить размеры своей панели
			}.bind(this));

			// обработка события настройки (активации) фильтра легенды слоя
			$(this.map.eventPane).on('filteractive.mapcontent', function(e){
				if (!e || !e.layer || !e.layer.xId || e.layer.getType() !== 'wms'){
					return;
				}
				if (e.layer.hasLegend()){
					var siblings = w2ui[this.name].find(e.layer.xId, { gClickable: true, xid: e.layer.xId });
					var sidebar = w2ui[this.name];
					if (e.active){
						siblings.forEach(function(node){sidebar.enable(node.id)});}
					else { siblings.forEach(function(node){sidebar.disable(node.id)}); }
				}
			}.bind(this));

			// обработка событий sidebar
			w2ui[this.getName()].on('click', function(event){
				that._renderOpacityOverlay(event);
			});

			w2ui[this.getName()].on('collapse', function (event) {
				this.map.setLayerLegendById(event.target);
			}.bind(this) );

			w2ui[this.getName()].on('expand', function ( event ) {
				this.map.setLayerLegendById(event.target);
			}.bind(this));

			this.dragAndDropPanels = [this.map.eventPane, this.$mapContentPane];

			this._listenDragAndDrop(this.dragAndDropPanels);

		},

        /**
         * Обработчик события 'layercommand'
         * @method onLayerCommand
         * @param event {Object} объект события {maplayer: {act:'', id:''}}
         * @private
         */
		onLayerCommand: function(event){
		    if (!event || !event.maplayer || !event.maplayer.act || !event.maplayer.id)
		        return;
		    var layer = this.map.tiles.getLayerByxId(event.maplayer.id), id = '', tree;
		    if (layer == null) {
		        return;
		    }
		    id = event.maplayer.id, tree = w2ui[this.getName()];
		    if (event.maplayer.act == 'remove') {

				layer.hide();
				
		        tree.remove('legendholder_' + id);

		        GWTK.Util.removeTreeNode(this.getName(), id);     // удалить узел слоя

				this.map.closeLayer(id);                          // удалить слой и параметры слоя

		        event.stopPropagation();
		    }

		    return;
		},

		/**
         * Настроить узел виртуальной папки в дереве данных
         * метод добавдяет кнопку Обновить в узел дерева для получения
         * слоев папки
         * @method setFolderTreeItem
		 * @param id {string} идентификатор узла дерева
        */
		setFolderTreeItem: function (id) {

			var item = w2ui[this.getName()].get(id);
			if ( !item ) return;
            var item_alias = item.text;
			var $button = $( item ).find( '#' + 'btupdate_' + id );
			if ( $button.length > 0 )
			    return;

			if (item.clickable) {
			    item.isMapFolder = true;
			}

			var utrigger = "$('#" + this.map.eventPane.id + "').trigger({ type: 'layercommand', maplayer: { id:'" + id + "', act: 'update' } });";

			if (item.text) {
			    if (item.text.indexOf(utrigger) != -1) {
			        return;
			    }
			}

			item.text = '<div><button class="sidebar-node-button sidebar-node-refresh-button" id="btupdate_' + id + '" ' +
				' title="' + w2utils.lang( "Update" ) + '" onclick="' + utrigger + '" ></button> ' + item_alias + '</div>';

            w2ui[this.getName()].refresh(id);

            return;
		},

        /**
         * Вывести элементы управления прозрачностью слоя
         * @method _renderOpacityOverlay
         * @param event {Object} объект события `click`
        */
		_renderOpacityOverlay: function (event) {

		    if (typeof event == 'undefined' || typeof event.originalEvent == 'undefined') {
		        return;
		    }
		    var sender = event.originalEvent.srcElement || event.originalEvent.target;
		    if (!$(sender).hasClass('sidebar-node-opacity-button')) {
		        return;
		    }

		    var id, layer, that = this;
		    //идентификатор слоя
		    if(event.target){
		        id = event.target;
		    }
		    else {
		        id = event.target.id.replace('gcheck_node_opacity_', '');
		    }
		    //слой
		    layer = this.map.tiles.getLayerByxId(id);
		    if(!layer) return;

		    $('#w2ui-overlay').remove();

		    //значение прозрачности
		    var opValue = layer.options.opacityValue === undefined ? 100 : layer.options.opacityValue;
		    //идентификатор
		    var iId = "opacity_tool_" + id;
		    //формируем ползунок
		    var input = '<tr style="height: 20px;">' +
                '<td style="text-align: left; height: 15px; ">' +
                '<span>' + w2utils.lang("Opacity") + '</span></td>' +
                '<td style="text-align: right;">' +
                '<span id="opacity-value-' + id + '" >' + opValue + '%</span></td>' +
                '</tr><tr>' +
                '<td colspan="2" style="text-align:center;">' +
                '<input type="range" id="' + iId + '" value="' + opValue + '" style="width: 100%; height: 23px; display: block;"></td></tr>';

			$('#gcheck_node_opacity_' + id).w2overlay({'html': '<table style="margin: 10px; width: 360px;">' + input + '</table>',
		                                               'align': 'right'});

		    var $Range = $('#' + iId);

		    $(document).on('click.mapoptions', function(event){
		        if($(event.target).closest('#w2ui-overlay').length) return;
		        $('#w2ui-overlay').remove();
		        $Range.off('change.mapoptions');
		        $Range.off('mousemove.mapoptions');
		        $(document).off('click.mapoptions');
		        event.stopPropagation();
		    });

		    $Range.on('mousemove.mapoptions', function () {
		        that.map.handlers.changeLayerOpacity(layer, $Range[0].value);
		        var percent = document.getElementById('opacity-value-' + id);
		        percent.innerHTML = $Range[0].value + '%';
		    });

		    event.stopPropagation();
		    return;
		},

        /**
		 * Скрыть панель
		 * @method hidePanel
		 */
	    hidePanel: function () {
		    $( this.mapContentPane ).hide();
	    },

        /**
		 * Скрыть кнопку управления
		 * @method hideButton
		 */
		hideButton: function () {
		    $( this.button ).hide();
		},

		/**
		 * Скрыть компонент
		 * @method hideComponent
		 */
        hideComponent: function () {
		    this.hidePanel();
		    this.hideButton();
	    },

		/**
		 * Создать тулбар
		 * @method createToolbar
		 * @param {*} parent родительский элемент
		 */
		createToolbar: function (parent) {
			if ( (!parent))
			    return;

	    	var toolbar = document.createElement( 'div' ),
                map = this.map,
                that = this;
			toolbar.setAttribute('name', this.toolBarName);
			$(toolbar).addClass('panel-toolbar');

			var items = [];

			// if ($.inArray("localmapcontrol", this.map.options.controls) != -1) {
			//     items.push({
            //                     // кнопка локальные слои
            //                     type: 'drop',
            //                     id: 'droplocalLayers',
            //                     text: w2utils.lang('Local layers'),
            //                     hint: w2utils.lang('Local layers'),
			// 					icon: 'gwtk-icon-file-image',
            //                     gwtkmap: map,
            //                     onClick: function (e) {
            //                         $('#w2ui-overlay').hide();
            //                     },
            //                     overlay: {
			// 						'align': 'none',
            //                         'selectable': true,
            //                         'onShow': function (e) {
            //                             // открыть
            //                             var elem = $(".local-open").find('.local-open-icon');
            //                             var tool = that;
            //                             elem.off().on('click', function (e) { $('#files_').click(); e.stopPropagation(); });
            //                             $('#files_').on("change", function (e) {
            //                                 tool.onLocalLayerOpen(e);
            //                             }).on("click", function (e) { e.stopPropagation(); });
            //                             $('.editing-check').on('click', function (e) { e.stopPropagation(); });
            //                             $('.local-open-edit').on('click', function (e) { $('.editing-check').click(); e.stopPropagation(); });
            //
            //                             // создать
            //                             $('.local-newname').off().on("click", function (e) { e.stopPropagation(); });
            //                             $('.local-newname').on('keyup', function (e) {
            //                                 var txt = $(this).val();
            //                                 if (e.key == 'Enter' && txt.length > 0) {
            //                                     tool.onLocalLayerCreate(e);
            //                                 }
            //                                 e.stopPropagation();
            //                             });
            //                             elem = $('.local-create').find('span');
            //                             elem.off().on('click', function (e) {
            //                                 var txt = $('.local-newname').val();
            //                                 e.stopPropagation();
            //                                 if (typeof txt != 'undefined' && txt.length > 0) {
            //                                     tool.onLocalLayerCreate(e);
            //                                 }
            //                                 return;
            //                             });
            //
            //                             return;
            //                         },
            //                         'onHide': function (e) {
            //                             var elem = $(".local-open").off().find('span');
            //                             elem.off();
            //                             $('.local-newname .editing-check').off();
            //                             $('.gwtk-menu-icon').off();
            //                         },
            //                         'contextMenu': true
            //                     },
            //                     html: '<div class="local-layers-dropmenu">' +
            //                         '<div class="local-create" onmouseover="$(\'.local-create\').addClass(\'gwtk-item-selected\');"' +
            //                         ' onmouseout="$(\'.local-create\').removeClass(\'gwtk-item-selected\')">' +
            //                         '<span class="gwtk-icon-file  gwtk-menu-icon" style="padding: 0px 8px;" ></span>' +
            //                         '<span class="menu-text local-create-text" style="padding-right: 10px;">' + w2utils.lang('Create') + '</span>' +
            //                         '<input size="20" style="border-radius: 2px; border: 1px solid silver; height:20px;" class="w2ui-input local-newname" ' +
            //                         ' required />' +
            //                         '</div>' + '<div style="height:5px;"></div>' +
            //                         '<div class="local-open" style="marging-top: 10px; height:20px; width=100%" onmouseover="$(\'.local-open\').addClass(\'gwtk-item-selected\')"' +
            //                         ' onmouseout="$(\'.local-open\').removeClass(\'gwtk-item-selected\')">' +
            //                         '<span class="gwtk-icon-file-image gwtk-menu-icon local-open-icon" style="padding: 0px 8px;"></span>' +
            //                         '<span class="menu-text local-open-icon" style="padding: 0px 10px 0px 0px; text-align:left;">' + w2utils.lang('Open') + '</span>&nbsp;' +
            //                         '<input type="checkbox" class="editing-check" style="padding-left:30px; vertical-align:middle;" checked />' +
            //                         '<span class="menu-text local-open-edit" style="padding-right: 10px;padding-left: 10px;">' + w2utils.lang('Editing') + '</span>' +
            //
            //                         '<input id="files_" type="file" class="gwtk-hide">' +
            //                         '</div>' +
			// 						'</div>'
            //            }
            //         );
			// }

			if ($.inArray("objectslayer", this.map.options.controls) != -1) {
			    items.push(
                    {  // кнопка Объекты слоя
                        type: 'button',
                        id: 'objectsLayer',
                        caption: w2utils.lang('Objects on a layer'),
                        hint: w2utils.lang('Display objects layer'),
                        icon: 'gwtk-icon-list',
                        onClick: function (event) {
                            // отобразить список объектов для выбранного слоя
                            var selid = w2ui[that.getName()].selected;
                            if (!selid) {
                                w2alert(w2utils.lang('Not selected layer!'));
                                return;
                            }
                            map.mapTool('objectlist').addListObjects({ name: '', xId: selid });
                        }
                    }
			    );
			}

			if ($.inArray("viewentirelayer", this.map.options.controls) != -1) {
			    items.push({
			        type: 'button',
			        id: 'viewentirelayer',
			        caption: w2utils.lang('View layer'),
			        hint: w2utils.lang('View entire layer'),
			        icon: 'gwtk-icon-view-layer',
			        style: 'border: none !important;',
			        onClick: function (event) {
			            var selid = w2ui[that.getName()].selected;
			            if (!selid) {
			                w2alert(w2utils.lang('Not selected layer!'));
			                return;
			            }
			            var maplay = map.tiles.getLayerByxId(selid);
			            if (maplay && maplay.idLayer) {
			                if (!maplay.visible) {
								maplay.show();
								w2ui[that.getName()].setCheckedMode(maplay.options.id, 'n', true, event);
							}
			                $(map.eventPane).trigger({ type: 'showlayerextent', idlayer: maplay.idLayer });
			            }
			            return;
			        }
			    });
			}

			if (items.length == 0) {
			    return;
			}

			$(toolbar).w2toolbar({
			    name: that.toolBarName,
                items: items
			});

			parent.appendChild(toolbar);
		},

		/**
		 * Обработчик меню Локальные слои / Создать
		 * @method onLocalLayerCreate
		 * @param {*} event
		 */
		onLocalLayerCreate: function (event) {
		    var txt = $('.local-newname').val();
		    $('.local-newname').val("");
		    $(this.map.eventPane).trigger({ type: 'locallayer', maplayer: { 'alias': txt, 'act': 'create' } });
		    return;
		},

		/**
		 * Обработчик меню Локальные слои / Открыть
		 * @method onLocalLayerOpen
		 * @param {Object} event событие
		 */
		onLocalLayerOpen: function (event) {
		    var ifile = event.currentTarget;
		    if (!ifile.files || ifile.files.length == 0) { return; }
		    var filename = ifile.files[0].name, fedit = true,
		    elcheck = $('.local-open').find('.editing-check');
		    if (elcheck.length > 0) {
		        fedit = elcheck[0].checked;
		    }

		    $(this.map.eventPane).trigger({ type: 'locallayer', maplayer: { 'alias': filename, 'file': ifile.files[0], 'act': 'open', 'edit': fedit } });

		    return;
		},

		/**
		 * Создать заголовок панели
		 * @method createPanelHeader
		 */
		createPanelHeader: function () {
		    if (!this.parent) return;

		    this.parent.appendChild(
                GWTK.Util.createHeaderForComponent({
                    callback: GWTK.Util.bind(function (e) { $(this.button).click(); }, this),
                    name: w2utils.lang("Layers"),
                    map: this.map,
                    context: this.toolname
                }
            ));

			return;
        },

		/**
		 * Сделать панель перемещаемой
		 * @method setDraggable
		 */
        setDraggable: function () {
			if (!this.map)
				return;
			GWTK.panelUI({ draggable: true, $element: $(this.parent), resizable: false });
        },

		/**
		 * Сделать панель растягиваемой
		 * @method setResizable
		 */
        setResizable: function () {
			var tool = this;

			var minW = parseInt( $( '.map-contents-panel' ).css( 'min-width' ) );
			var minH = parseInt( $( '.map-contents-panel' ).css( 'min-height' ) );
			if ( !minW ) minW = 400;
			if ( !minH ) minH = 250;

			$(this.mapContentPane).resizable({
				handles: 's,w,sw',
				resize: function (event, ui) {
					ui.position.left = ui.originalPosition.left;
					tool.resize();
					
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
				},
				minWidth: minW,
				minHeight: minH
			});
		},

		/**
		 * Cоздать дерево
		 * @method createTree
		 * @returns {Object} html элемент, где создается sidebar
		 */
        createTree: function () {

			this.setLayerVisible = GWTK.bind(this.setLayerVisible, this);

			// this.map.options.showsettings ?
			//     this.showsettings = this.map.options.showsettings : this.showsettings = false;
            
            this.showsettings = true;
            var el = document.createElement('div');
            el.setAttribute('name', this.name);
            el.setAttribute('id', this.name);
            this.parent.appendChild(el);
            var that = this;

            $('#' + this.name).w2sidebarGWTK({
                name: that.name,
                hideChecked: true,
                returnElement: this.setLayerVisible,
				returnCondition: function ( node ) {
					if ( node.gClickable || node.isLayer) {
                        return true;
                    }
                },
				menu: [],
				onContextMenu: function ( event ) {
                    var node = event.object;
					w2ui[ that.getName() ].menu = [];
					if ( node.nodes.length > 0 ) {
						w2ui[ that.getName() ].menu.push(
							{ id: 'onAll', text: w2utils.lang( 'Select all' ) },
							{ id: 'offAll', text: w2utils.lang( 'Reset all' ) }
                        );
                    }
                },
				onMenuClick: function ( event ) {
                    var id = event.menuItem.id;
					if ( id == 'onAll' ) {
						w2ui[ that.getName() ].setCheckedMode( event.target, 's', false, event );
                    }
					if ( id == 'offAll' ) {
						w2ui[ that.getName() ].setCheckedMode( event.target, 'offs', false, event );
					}
					w2ui[that.getName()].onMenuClickLegend(event.target);
				},
				onMenuClickLegend: function(id){
					if (!id) return;
					var node = this.get(id);
					if (node == null) return;
					if (node.typename){
						this.onLegendItemClick(node);
					}
					else if (node.isLayer){
						var nodes = this.find(id, { xid: id });
						this.onLegendItemClick(nodes[0]);
					}
					return;
				},
				onLegendItemClick: function(node){
					if (!node || !node.xid){
                        return;
					}
					if (!node.key && !node.typename){ return;}

					var layer = that.map.tiles.getLayerByxId(node.xid);
			        if (layer !== null && layer.getType() == 'wms' && layer.hasFilter()){
						var siblings = w2ui[this.name].find(node.xid, { gClickable: true, xid: node.xid });
						var sidebar = w2ui[this.name];
						if (layer._filter.filterInactive){
							siblings.forEach(function(node){sidebar.disable(node.id)});
							return;
						}
						var filter = that.getLayerFilter(node.xid);
			       	    if (filter){
							if (filter.length == 0){
								layer.setKeysFilter([',']);
							}
							else layer.setKeysFilter(filter);
	                        that.map.tiles.wmsUpdate();
			 	        }
			        }
				}.bind(this)
            });

            return el;
		},

		/**
		 * Перестроить дерево
		 * @method reset
		 */
		reset: function () {
		    var json = this.prepareItemText();
		    if (json == undefined) {
		        return;
		    }
		    this.loadTree(json);
		    // настроить узлы виртуальных папок в дереве
		    var i, len = this.map.virtualfolders.length;
		    for (i = 0; i < len; i++) {
		        this.setFolderTreeItem(this.map.virtualfolders[i].xId);
		    }
		    this.setLayersVisibility();

		    $(this.map.eventPane).trigger({ type: 'mapcontentloaded' });

		    return;
		},

		/**
		 * Перестроить легенду слоя
		 * @method resetLegend
		 * @param xid {string} идентификатор слоя в карте
		 */
		resetLegend: function (xid) {
		    var layer = this.map.tiles.getLayerByxId(xid);
		    if (layer == null) {
		        return false;
			}
			var xid = xid,
			    tree = w2ui[this.getName()],
			    node = tree.get(xid),
		        legend = this.map.tiles.getLayerLegendByxId(xid);
		    if (legend == null) { return false; }
		    if (node.legend && node.nodes.length > 0) { return true; }

		    tree.remove('legendholder_' + xid);
	        // легенда есть у слоя, заполним в дереве
	        if (layer.getType() !== 'wms'){
                var leg = tree.find(xid, { "id": legend.items[0].id });
	            if (leg.length == 0) {
		           tree.add(xid, legend.items);
	            }
	        }
          	else{
				var filter = {'codelist':[]}, leg=[], code;
				if ($.isArray(layer.codeArray) && layer.codeArray.length > 0){
					filter.codelist = layer.codeArray;
					code = layer.codeArray[0];
				}
				if (typeof code == 'undefined'){
					leg = tree.find(xid, {"id": legend.items[0].id});
				}
				else{
					leg = tree.find(xid, {"code": code});
				}
				if (leg.length == 0)
				    this._setLayerLegendItems(legend, filter);
			}
		    return true;
		},

		/**
		 * Перестроить дерево по параметрам
		 * @method resetTreeByParam
		 */
		resetTreeByParam: function (options, node) {

		    if (!options || !$.isArray(options.layers)) {
		        return;
		    }
		    if (options.layers.length == 0) {
		        return;
		    }

		    var parent = false, i,
                treenode = node,
                tree = w2ui[this.name],
                tree_item,
		        count = options.layers ? options.layers.length : 0;

		    if (!treenode) treenode = {};
		    if (!treenode.alias) treenode.alias = "";

		    if (treenode.id) {
		        parent = tree.get(treenode.id);
		        if (!parent) {
		            tree_item = { "id": treenode.id, "text": treenode.alias, "group": false, "expanded": false, "img": "" };
		            tree.add(tree_item);
		            parent = tree.get(treenode.id);
		        }
		        tree.expand(treenode.id);
		        tree.scrollIntoView(treenode.id);
		    }

		    for (i = 0; i < count; i++) {
		        // добавить node слоя в указанный узел
		        if (options.layers[i].duty && options.layers[i].hidden) {
		            continue;
		        }
		        var data = { "id": options.layers[i].id, "group": false, "expanded": false };
		        data.eventPanelId = this.map.eventPane.id;
		        data.remove = false;
		        data.gClickable = true;
		        data.panischecked = true;
		        if (options.layers[i].duty && !options.layers[i].hidden) {
		            data.gClickable = false;
		            data.clickable = false;
		            data.panischecked = false;
		        }
		        data.text = options.layers[i].alias;
		        data.showsettings = this.map.options.showsettings;
		        if (options.layers[i].folder && options.layers[i].folder.length > 0) {
		            data.panischecked = false;
		            data.clickable = true;
		            data.img = 'icon-folder';
		            data.nodes = [];
		        }
		        if (parent) {
		            tree.add(treenode.id, data);
		        }
		        else {
		            tree.add(data);
		        }
		        if (options.layers[i].folder && options.layers[i].folder.length > 0) {
		            this.setFolderTreeItem(options.layers[i].id);
		        }
		    }
		    return;
		},

		/*
		 * Удалить вспомогательный элемент
		 * @method _removeLegendHolder
		 */
		_removeLegendHolder: function(xid){
			if (typeof xid !== 'string') return;
			w2ui[this.name].remove('legendholder_' + xid);
		},

		/*
		 * Установить элементы легенды слоя
		 * @method _setLayerLegendItems
		 * @param legend {Object} легенда слоя
		 * @param filter {Object} фильтр {'codelist': string} список кодов объектов
		 */
		_setLayerLegendItems: function(legend, filter){
			if (typeof legend == 'undefined'){ return; }
			if (!legend.hasOwnProperty('id') || !legend.hasOwnProperty('items')){
				return;
			}
			if (legend.items.length == 0 || !w2ui[this.name]) {
				return;
			}
			var items = [], len, i,
			    tree = w2ui[this.name],
				_hastypes = (legend.items[0].typename && legend.items[0].typename.length > 0);
			if (typeof filter == 'undefined'
				 || !filter.codelist
				 || filter.codelist.length == 0){
				tree.add(legend.id, legend.items);
				this._removeLegendHolder(legend.id);
				return;
			}
	        len = legend.items.length;
			if (!_hastypes){                            // легенда по объектам rsc
				for (i = 0; i < len; i++) {
					if ($.inArray(legend.items[i].code, filter.codelist) > -1){
						items.push(legend.items[i]);    // фильтруем по кодам объектов
					}
				}
				if (items.length > 0){
					this._removeLegendHolder(legend.id);
					var node = tree.get(legend.id);
					tree.add(legend.id, items);
					node.legend = true;
				}
			    return;
			}
			                                                      // легенда по слоям rsc
			var tlegend = $.extend(true, {}, legend);
			    tlegend['filtered'] = [];
            for (i = 0; len = legend.items.length, i < len; i++) {
                if (!$.isArray(legend.items[i].nodes) || legend.items[i].nodes.length == 0){
					tlegend.filtered.push(legend.items[i]);
					continue;
				}
				items = [];
				items = items.concat(legend.items[i].nodes);
				var j, len2 = items.length;
                for (j = 0; j < len2; j++){
                    if ($.inArray(legend.items[i].nodes[j].code, filter.codelist) == -1){
                        items.splice(j, 1);
                    }
                }
                if (items.length > 0){
					var t_item = $.extend(true, {}, legend.items[i]);
					t_item.nodes = items;
					tlegend.filtered.push(t_item);
                }
            }
            if (tlegend.filtered.length > 0){
				tree.add(tlegend.id, tlegend.filtered);
				var node = tree.get(legend.id);
				if (node !== null) node['legend'] = 1;
			}
			return;
		},

		/**
		 * Установить видимость
		 * @method setLayerVisible
		 */
		setLayerVisible: function (status, nodes) {
			var len = nodes.length, i, layer, node_create = [];

			for ( i = 0; i < len; i++ ) {
				layer = this.map.tiles.getLayerByxId(nodes[ i ].id);
				if (layer !== null) {
				    var fn_refresh = layer.refresh ? layer.refresh : layer.update;
				    var _visibility = layer.visible;
				    if (status) {
				        layer.show();
					}

				    else {
				        layer.hide();
				    }

				    if ($.isFunction(fn_refresh) && (_visibility !== layer.visible))
				        fn_refresh.call(layer);

				    $(this.map.eventPane).trigger({
				        type: 'visibilitychanged',
				        maplayer: { 'id': nodes[i].id, 'visible': status, 'layer':layer }
				    });
				}
				else
				{
					if(nodes[i].isMapFolder && nodes[i].nodes.length === 0){
						$(this.map.eventPane).trigger({ type: 'layercommand', maplayer: {id: nodes[i].id, act: 'update'} }); // дерево папки
					}
					else if (nodes[i].isPrimitive) {                                  // узел связан с произвольными данными
						$(this.map.eventPane).trigger({
						    type: 'primitivevisibilitychanged', maplayer: { 'id': nodes[i].id, 'visible': status }
						});
					}
					if (nodes[i].isfolder) {
					    node_create.push(nodes[i]);
					}

				}
			}

			if (node_create.length > 0) {
			    $(this.map.eventPane).trigger({ 'type': 'createlayer', 'layers': node_create, 'visible': status });      // слои вирт. папки
			}

			this.map._writeCookie();
			return;
		},

		/**
		 * Получить фильтр объектов слоя
		 * @method getLayerFilter
		 * @param id {string} идентификатор узла
		 */
		getLayerFilter:function(id){
			if (typeof id === "undefined") return false;
			var layerNode = w2ui[this.name].get(id);
			if (layerNode === null || !layerNode.panischecked) return false;

			var selected = w2ui[this.name].find(id, { gClickable: true, panischecked: true, xid: id, typename:undefined }),
				i, len, keys = [];
			for (i = 0; len = selected.length, i < len; i++){
				if (typeof selected[i].code === "undefined") continue;
				keys.push(selected[i].key);
			}
            return keys;
		},

		/**
		 * Добавить элемент слоя
		 * @param parentId {String} идентификатор родительского узла
		 * @param itemdata {Object} элемент дерева для слоя, json
		 * @returns {String} идентификатор добавленного узла
		 */
		addItems: function ( parentId, itemdata ) {
			if ( !itemdata || !itemdata.id )
                return null;
            // проверим, что такой слой есть и им можно управлять
			if (this.map.tiles.getLayerByxId(itemdata.id) == null)
                return null;
			if (parentId) {
				w2ui[this.getName()].add(parentId, itemdata );
            }
            else {
				w2ui[this.getName()].add(itemdata);
            }
            return itemdata.id;
        },

		/**
		 * Удалить элемент
		 * @method delItems
		 * @param id {string} идентификатор узла
		 */
		delItems: function (id) {
			w2ui[this.getName()].remove(id);
		},

		/**
		 * Очистить все элементы дерева
		 * @method clearAllItems
		 */
        clearAllItems: function () {
			w2ui[ this.getName() ].nodes = [];
			w2ui[ this.getName() ].refresh();
        },

		/**
		 * Добавить узел в дерево
		 * @method addNode
		 * @param parent{String or Object} id или объект родительского узла
		 * @param {Object} параметры узла, JSON
		 * @param viewnode {Boolean} `true` показать узел в дереве
		 * @returns {Object} добавленный в дерево узел
		 */
        addNode: function (parent, node, viewnode) {
            if (!node || !node.hasOwnProperty('id')) {
                return null;
            }
            var root = null,
                tree = w2ui[this.getName()], newnode;

            if (parent) {
                if ((typeof parent).toLowerCase() === 'string') {
                    root = tree.get(parent);
                }
                else {
                    if (parent.hasOwnProperty('id')) {
                        root = tree.get(parent.id);
                    }
                }
            }
            if (root != null) {
                newnode = tree.add(root, node);
            }
            else {
                newnode = tree.add(node);
            }

            if (typeof(viewnode) == typeof (true)) {
                tree.scrollIntoView(node.id);
            }

            return newnode;
        },

		/**
		 * Получить узел дерева
		 * @method getNode
		 * @param id {String} id узла
		 * @return {Object} узел дерева
		 */
        getNode: function (id) {
            if (!id) { return null; }
            return w2ui[this.getName()].get(id);
        },

		/**
		 * Удалить узел дерева
		 * @method removeNode
		 * @param id {String} идентификатор узла
		 */
        removeNode: function (id) {
            this.delItems(id);
        },

        /**
		 * Разрушить дерево
		 * @method destroyTree
		 */
		destroyTree: function () {
            this.clearAllItems();

            if (w2ui[this.toolBarName]) {
                w2ui[this.toolBarName].destroy();
            }
            if (w2ui[this.getName()]) {
                w2ui[this.getName()].destroy();
            }
            $(this.parent).remove("#" + this.getName());

            try {
                $(this.parent).resizable("destroy");
            } catch (e) {
            }

            $(this.parent).empty();
        },

		/**
		 * Деструктор
		 * @method destroy
		 */
		destroy: function () {
			$.each(this.dragAndDropPanels, function () {
				$(this).off('.GWTKDrop');
		    });
            this.$button.off();
            this.$button.remove();
            $(this.map.eventPane).off('layerlistchanged.mapcontent');
            $(this.map.eventPane).off('layercommand.mapcontent');
            this.destroyTree();
            $(this.parent).remove();
        },

		/**
		 * Включить кнопку
		 * @method setChecked
		 * @param id {String} идентификатор узла
		 */
  		setChecked: function (id) {
			if (!id) return false;
			var node = w2ui[this.getName()].get(id);
			if (node) {
                node.panischecked = true;
				w2ui[this.getName()].refresh(id);
				return node;
            }
            return false;
        },

		/**
		 * Выключить кнопку
		 * @method setUnChecked
		 * @param id {String} идентификатор узла
		 */
		setUnChecked: function (id) {
			if (!id) return;
			var node = w2ui[this.getName()].get(id);
			if (!node) { return false; }
			node.panischecked = false;
			w2ui[this.getName()].refresh(id);
			return node;        },

		/**
		 * Заменить контент узла
		 * @method ReplaceItemText
		 * @param id {String} идентификатор узла
		 */
 		ReplaceItemText: function (id) {
			if (!id) return;
			var nodes = w2ui[ this.getName() ].find( { 'id': id } );
			if ( nodes.length != 0 ) {
				var itext = nodes[ 0 ].text;
				var ipos = itext.indexOf( 'chbx_' + id );
				if ( ipos == -1 ) return;

				if ( (itext != undefined) && (itext != '') ) {
					if ( document.getElementById( 'chbx_' + id ).checked == true ) {
						var pos = itext.indexOf( '<input id' );
						if ( pos != -1 ) {
							itext = itext.replace( '<input id', '<input checked id' );
						}
                    } else {
						var pos = itext.indexOf( '<input checked id' );
						if ( pos != -1 ) {
							itext = itext.replace( '<input checked id', '<input id' );
						}
                    }
					nodes[ 0 ].text = itext;
                }

            }
        },

		/**
		 * Скрыть узел
		 * @method ItemHide
		 * @param id {String} идентификатор узла
		 */
        ItemHide: function ( id ) {
			w2ui[ this.getName() ].hide( id );
        },

		/**
		 * Отобразить узел
		 * @method ItemShow
		 * @param id {String} идентификатор узла
		 */
        ItemShow: function (id) {
			var node = w2ui[this.getName()].get(id), parent, tmpId;
			if (node) {
                parent = node;
			} else {
                parent = false;
            }
			while (parent != w2ui[this.getName()]) {
                parent.hidden = false;
                tmpId = parent.id;
                parent = parent.parent;
            }
			w2ui[this.getName()].refresh(tmpId);
        },

		/**
		 * Загрузить дерево
		 * @param json_tree {Object} JSON дерева слоев
		 * @protected
		 */
		loadTree: function (json_tree) {
			if (typeof json_tree !== 'object'){
				return;
			}
            this.clearAllItems();
			w2ui[this.name].add(json_tree);
        },

		/**
		 * Подготовить описание дерева к загрузке
		 * @method prepareItemText
		 * @protected
		 */
        prepareItemText: function () {

            // Если файла дерева нет, то формируем дерево по списку слоёв карты
			if ((!this.map.options.contenttree == undefined) || $.isEmptyObject(this.map.options.contenttree)) {
                if (!this._initDefaultTree()){
					console.log("MapContentControl. " + w2utils.lang("Not defined a required parameter") + " Map.options.contenttree");
					return;
				}
			}

            var that = this;

			function goAroundNodes( nodeItem ) {
				if ( !nodeItem ) return;

				var old_text = nodeItem.text, maplay = null, i;

				if ( (old_text == "") || (old_text == undefined) ) {
					var len = that.map.layers.length;

					for (i = 0; i < len; i++) {

						if ( that.map.layers[ i ].xId == nodeItem.id ) {

							old_text = that.map.layers[ i ].alias;
							maplay = that.map.layers[ i ];

							break;
                        }
                    }
                }
				if(!maplay){
					maplay = that.map.tiles.getLayerByxId( nodeItem.id );
				}
				if ( nodeItem.clickable ) {     //признак отображения checkbox'a, устанавливаем ниже gClickable

					nodeItem.isLayer = true;    // признак слоя
					nodeItem.gClickable = true; //отображение checkbox'a
					if (maplay) {
                        nodeItem.hint = maplay.alias;
                        nodeItem.showsettings = that.showsettings;
						if (!maplay.getVisibility()) {
                            nodeItem.panischecked = false;
						}
                    }
                }
				if ( !nodeItem.group ) {
					nodeItem.text = '<div>' + old_text + '</div>';
                }
				if ( nodeItem.nodes != undefined ) {

					for ( var ii = nodeItem.nodes.length - 1; ii >= 0; ii-- ) {
						var sub_node = nodeItem.nodes[ii];
 						goAroundNodes( sub_node );
                    }
                }
            };

			var mytree = JSON.parse(JSON.stringify(this.map.options.contenttree));

			for (var ii = mytree.length - 1; ii >= 0; ii-- ) {
				var jitem = mytree[ ii ];
				goAroundNodes( jitem );
            }

            return mytree;

		},

		/**
		 * Инициализировать описание дерева по списку слоев
		 * @method _initDefaultTree
		 * @returns {Object} описание дерева, json
		 * При ошибке возвращает `false`
		 * @protected
		 */
		_initDefaultTree: function(){
			if (typeof this.map == 'undefined' || !$.isArray(this.map.layers)){
				return false;
			}
			var i, len = this.map.layers.length,
			tree = [
				{
					"id": "map",
					"img": "icon-folder",
					"expanded": true,
					"text": w2utils.lang("Maps"),
					"nodes": []
				}
			];
			for (i = 0; i < len; i++ ) {
				var node = {
					'id': this.map.layers[i].xId,
					'text': this.map.layers[i].alias,
					'clickable': true,
					'img': 'icon-page'
				};
				tree[0].nodes.push(node);
			}
			this.map.options.contenttree = tree;

			return this.map.options.contenttree;
		},

		/**
		 * Установить флажки видимости слоев в дереве
		 * @method setLayersVisibility
		 */
        setLayersVisibility: function () {
			if ( !this.map ) return;
            var i, len = this.map.layers.length;
			for ( i = 0; i < len; i++ ) {
				if ( this.map.layers[ i ].visible ) {
					w2ui[this.getName()].setCheckedMode(this.map.layers[ i ].options.id, 'n', true);
                }
            }
		},

		/**
		 * Установить прослушивание события drag and drop.
		 * @method _listenDragAndDrop
		 * @param panels {object} список панелей
		 * @private
		 */
		_listenDragAndDrop: function (panels) {

			var proceed;

			proceed = function (index, element) {
				$(element).on({
					'dragover.GWTKDrop': function (event) {
						event.preventDefault();
						event.stopPropagation();
					},
					'dragleave.GWTKDrop': function (event) {
						event.preventDefault();
						event.stopPropagation();
					},
					'drop.GWTKDrop': GWTK.Util.bind(function (event) {
						event.preventDefault();
						event.stopPropagation();
						return this._processDroppedFiles(event.originalEvent.dataTransfer.files);
					}, this)
				});
			};

			$.each(panels, GWTK.Util.bind(proceed, this));

		},

		/**
		 * Обработать брошенные файлы
		 * @method _processDroppedFiles
		 * @param files {object} список файлов класса window.File
		 * @private
		 */
		_processDroppedFiles: function (files) {

			var localMapControl, errorMessages, i, file, result;

			localMapControl = this.map.mapTool('localMapControl');
			if ($.isEmptyObject(localMapControl)) {
				return true;
			}

			errorMessages = [];
			for (i in files) {
				if (files.hasOwnProperty(i)) {
					file = files[i];
					result = localMapControl.openLocalLayer(file, true);
					if (result && typeof result === 'string') {
						errorMessages.push(result);
					}
				}
			}
			if (errorMessages.length) {
				w2alert(errorMessages.join('<hr/>'));
			}

		}

    }
}
