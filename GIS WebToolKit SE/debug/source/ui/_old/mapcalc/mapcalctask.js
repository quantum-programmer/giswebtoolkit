/*************************************** Патейчук В.К.  15/04/20 ****
 *************************************** Нефедьева О.А. 18/10/19 ****
 *************************************** Соколова Т.О.  10/01/19 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент "Расчеты по карте"                   *
 *                                                                  *
 *******************************************************************/
if(window.GWTK){

	/**
	 * Задача Расчеты по карте
	 * @param map - ссылка на карту
	 * @class GWTK.MapCalculationsTask
	 * @constructor GWTK.MapCalculationsTask
	 */
	GWTK.MapCalculationsTask = function(map){
		this.map = map;
		this.toolname = 'mapcalculations';

		this.toolbarName = 'mapcalcToolBar' + GWTK.Util.randomInt(60000, 80000);

		this.toolBarButton = null;
		this.$toolBarButton = null;

		this.button = null;
		this.$button = null;

		this.panel = null;
		this.$pane = null;

		this.action = null;

		GWTK.MapTask.call(this, map);

		this.map.maptools.push(this);

		this.checkedMode = '';

		this.checkedItem = '';

		this.modeDistanceItems = [
			{
				id: 'mapdirectaction',
				text: w2utils.lang("Seek point by point, azimuth, distance"),
				img: 'mapcalc-direct',
				actionClass: 'MapDirectAction',
				actionClassObject: null,
				checked: false,
				isAction: true,
				group: '1',
				type: 'check',
				hint: w2utils.lang("Seek point by point, azimuth, distance")
			}
		];

        // Добавим обратную геодезическую задачу, если есть url panorama
        if (this.map.options.url) {
            this.modeDistanceItems.push(
                {
                    id: 'mapinverseaction', text: w2utils.lang("Seek azimuth by points"), img: 'mapcalc-inverse',
                    actionClass: 'MapInverseAction',
                    actionClassObject: null,
                    checked: false,
                    isAction: true,
                    type: 'check',
                    group: '1',
                    hint: w2utils.lang("Seek azimuth by points")
                }
            )}

        // Добавим Cancel
		this.modeDistanceItems.push(
            {
                id: 'exit', text: w2utils.lang("Cancel"),
                img: 'icon-page',
                //type: 'radio',
                actionClass: '', checked: false, group: '1',
                hint: w2utils.lang("Cancel")
            }
		);

        if (this.map.options.url) {
            this.modeCrossItems = [
                //{
                //	id: 'mapcrosslineaction',
                //	text: w2utils.lang("Intersection with an arbitrary line"),
                //	img: 'mapcalc-inverse',
                //	actionClass: 'MapCrossArbitraryLineAction',
                //	actionClassObject: null,
                //	isAction: true,
                //	checked: false,
                //	group: '2',
                //	type: 'check',
                //	hint: w2utils.lang("Intersection with an arbitrary line")
                //},
                {
                    id: 'mapcrosstwoobjectsaction',
                    text: w2utils.lang("Intersecting of two objects"),
                    img: 'mapcalc-cross',
                    actionClass: 'MapCrossTwoObjectsAction',
                    actionClassObject: null,
                    isAction: true,
                    checked: false,
                    group: '2',
                    type: 'check',
                    hint: w2utils.lang("Intersection of two selected objects")
                },
                {
                    id: 'exit',
                    img: 'icon-page',
                    text: w2utils.lang("Cancel"),
                    actionClass: '',
                    checked: false,
                    group: '2',
                    hint: w2utils.lang("Cancel")
                }
            ];
        }
		this.init();

	};

	GWTK.MapCalculationsTask.prototype = {
		/**
		 * Инициализация компонента
		 * @method init
		 */
		// ===============================================================
		init: function(){
			this.createToolbarsButton();
			this.initEvents();
			this.createPane();
			this.createTaskToolbar();
			// если указана панель для компонентов, то перетаскивание недоступно
			if(!this.map.options.controlspanel) {
                this.setDraggable();
            }
			return;
		},

		/**
		 * Создать кнопку задачи в тулбаре карты
		 * @method createToolbarsButton
		 */
		// ===============================================================
		createToolbarsButton: function(){
			this.toolBarButton = GWTK.DomUtil.create('div', 'control-button control-button-radio clickable control-button-mapcalculation', this.map.panes.toolbarPane);
            this.toolBarButton.id = 'panel_button-mapcalculation';
            // this.toolBarButton.style.display="none";
			this.toolBarButton.title = w2utils.lang('Map calculation');
			this.$toolBarButton = $(this.toolBarButton);
			this.toolBarButton.toolname = this.toolname;
			this.toolBarButton._pane = this.toolbarName;
		},

		/**
		 * Создать панель задачи
		 */
		// ===============================================================
		createPane: function(){
		    var header = GWTK.Util.createHeaderForComponent({
		        "map": this.map,
		        "name": w2utils.lang('Map calculation'),
                "context":this.toolname,
				"callback": GWTK.Util.bind(function(){
					this.$toolBarButton.click();
				}, this)
			});

			// если указана панель для компонентов, то создаем в ней
			if (this.map.options.controlspanel) {
				this.panel = GWTK.DomUtil.create('div', 'map-panel-def-flex mapcalculations-panel-flex', this.map.mapControls);
			}
			else {
				this.panel = GWTK.DomUtil.create('div', 'map-panel-def map-panel-def-task mapcalculations-panel', this.map.mapPaneOld);
			}
			this.panel.id = this.map.divID + '_mapcalculationsPane';
			this.$pane = $(this.panel);
			this.$pane.append(header).hide();
		},

		/**
		 * Создать тулбар задачи
		 */
		// ===============================================================
		createTaskToolbar: function(){

			if(!this.panel){
				return;
			}

			this.toolbarContainer = GWTK.DomUtil.create('div', '', this.panel);
			this.$toolbarContainer = $(this.toolbarContainer);
			var task = this;

			var menuitems = [
                {
                    type: 'menu',
                    id: 'distanceMode',
                    icon: 'button-mapcalc-distance-ico',
                    items: this.modeDistanceItems,
                    text: '',
                    'hint': w2utils.lang("Length and distance"),
                    checked: false,
                    onClick: function(ev){
                        ev.onComplete = function(event){
                            this._toggleTaskMode(event, event.item.checked);
                            event.stopPropagation();
                        }
                    }
                },
                {   type:'break'},
                {
                    type:'check',
                    id: 'objectinformation',
                    icon: 'information-about-object-ico',
                    actionClass: 'InformationAboutObjectAction',
                    actionClassObject: null,
                    isAction: true,
                    checked: false,
                    hint: w2utils.lang("Information about object"),
                    mode:'menu'
                }
			];

            if (this.modeCrossItems) {
                menuitems.push({
                    type: 'break'
                });
                menuitems.push({
                        type: 'menu',
                        id: 'crossMode',
                        hint: w2utils.lang('Intersecting objects'),
                        icon: 'button-mapcalc-cross-ico',
                        items: this.modeCrossItems,
                        text: '',
                        onClick:
                            function (event) {
                                event.onComplete = function (event) {
                                    this._toggleTaskMode(event, event.item.checked);
                                    event.stopPropagation();
                                }
                            }

                        ,
                        checked: false
                    }
                );
            }

			this.$toolbarContainer.w2toolbar({
				name: this.toolbarName,
				selected: 'distanceMode',
				items: menuitems,
				onClick: function(e){
					if(e.item.type === 'menu' && !e.subItem){
						return;
					}

					e.onComplete = function(event){
						var menu_id = event.item.id;

						if (event.item.mode && event.item.mode == 'menu' && event.item.type == 'check') {       // кнопка в toolbar - режим и обработчик
						    this._toggleTaskMode(event, event.item.checked);
						    this.refresh(event.item.id);
						    event.stopPropagation();
						    return;
						}

						if (event.subItem && event.subItem.id === 'exit') {                    // выход из режима?
						    //console.log(event.item, event);
							if(task.checkedMode.length > 0){
								if(!task.clearMode(this.get(menu_id), true)){
									return;
								}
							}
							this.uncheck(event.item.id);
							this.selected = '';
							task.checkedItem = '';
							task.action = null;
							event.item.text = "";
							if (event.subItem.actionClassObject){
							    event.subItem.actionClassObject.clear();
							    event.subItem.actionClassObject = null;
							}
							return;
						}

						if(event.item.id != task.checkedMode){              // переключить обработчик режима
							if(!task.clearMode(this.get(task.checkedMode))){
								return;
							}
							task.checkedMode = event.item.id;                // установить режим
							this.selected = '';
						}
						this.selected = event.target;                        // установить обработчик режима
						if (task.checkedItem != event.subItem.id) {
						    event.subItem.actionClassObject = null;
						    task.setAction(event.subItem);
						}
						e.item.text = event.subItem.text;

						this.refresh(task.checkedMode);
						return;
					}
				},

				_getSubItem: function(item, id, returnIndex){                               // получить дочерний пункт по id
					if(!item || typeof item.items == 'undefined'){
						return -1;
					}
					console.log('_getSubItem', this, item, id);
					var i, len;
					for(i = 0; len = item.items.length, i < len; i++){
						if(item.items[i] && item.items[i].id && item.items[i].id === id){
							if(returnIndex){
								return i;
							}
							return item.items[i];
						}
					}
					return -1;
				},

				_selectMenuItem: function(flag){                                                  // выделить пункт меню
					if(!this.selected || this.selected.indexOf(':') == -1){
						return;
					}
					var el = $('.w2ui-drop-menu');
					if(el.length == 0){
						return;
					}
					var id = this.selected.split(':'),
						item = this.get(id[0]), ind = -1;
					if(item && item.type == 'menu'){
						ind = this._getSubItem(item, id[1], true);
						var selector = "tr[index='" + ind + "']",
							it = el.find(selector);
						if(flag)
							it.addClass('w2ui-selected');
						else{
							it.removeClass('w2ui-selected');
						}
					}
					return;
				},
				_getCheckedItem: function () {
				    if (!this.items || this.items.length == 0) return false;
				    var i, len = this.items.length;
				    for (i = 0; i < len; i++) {
				        if (this.items[i].checked == undefined) continue;
				        if (this.items[i].checked) return this.items[i];
				    }
				    return false;
				},

			    // переключение кнопки в тулбаре (переключение режима в задаче)
				_toggleTaskMode: function(e, check){
					if(!e || !e.item){
						return;
					}
					var curr_mode = task.checkedMode,                                           // текущий режим задачи
						curr_mode_item = this.get(task.checkedMode);                            // item режима
					if(check){
						if(curr_mode.length > 0 && curr_mode != e.item.id){
						    if (curr_mode_item) {
						        if (curr_mode_item.isAction && curr_mode_item.type == 'check') {
						            task.clearAction();
						            curr_mode_item.actionClassObject = null;
						        }
						        curr_mode_item.text = '';
						        this.selected = '';
								this.uncheck(curr_mode);
								this.refresh(curr_mode);
							}
						}

						task.checkedMode = e.item.id;
						this.check(task.checkedMode);
						if (e.item.isAction && e.item.type == 'check') {
						    task.clearAction();
						    task.setAction(e.item);
						}
					}
					else {
					    if (e.item.isAction && e.item.type == 'check') {
					        if ($.isFunction(e.item.actionClassObject.clear))
					            e.item.actionClassObject.clear();
					        task.map.closeAction();
					        e.item.actionClassObject = null;
					    }
						task.checkedMode = '';
						this.uncheck(e.item.id);
						e.item.text = '';
						this.selected = '';
						this.refresh(e.item.id);
					}
					return;
				}
			});
		},

		/**
		 * Завершить текущий режим задачи
		 * Если имеется активный обработчик режима, он завершается
		 * @method clearMode
		 * @return {Boolean} `true`\`false`, true - режим завершен, false - нет
		 */
		// ===============================================================
		clearMode: function(item_mode, close){
			if(this.checkedMode === ''){
				return true;
			}
			if (close) {
			    if (this.action && this.map.taskManager._action === this.action) {
			        if (!this.map.closeAction()) {
			            return false;
			        }
			    }
			}

			if(item_mode){
				item_mode.text = '';
			}

			this.checkedMode = '';

			return true;
		},

		clearAction: function(){
			if(!this.action){
				return true;
			}

			var current = this.action;
			this.action = null;

			if (this.map.closeAction()) {
			    this.checkedItem = '';
			    this.action = null;
			    return true;
			}
			else {
			    this.action = current;
			}
			return;
		},

		/**
		 * Установить MapAction в задаче
		 * @param item {Object} - item обработчика (пункт меню)
		 * @return {boolean}
		 */
		// ===============================================================
		setAction: function(item){
			if(!item || !item.id || !item.actionClass)
			    return;
			var item = item;
			this.map.closeAction();

			if (this.action) {
			    if (this.action.name === item.id) {
					return true;
				}
			}

			if(!item.actionClassObject){
				item.actionClassObject = new GWTK[item.actionClass](this, this.map, item.id);
			}
			this.checkedItem = '';
			this.action = null;

			if(this.map.setAction(item.actionClassObject)){
			    this.checkedItem = item.id;
			    this.action = this.map.taskManager._action;
			}
			else{
				this.action = null;
				item.actionClassObject.clear();
			}

			return (this.action !== null);
		},

		/**
		 * Инициализация событий
		 * @method initEvents
		 */
		// ===============================================================
		initEvents: function(){
			var task = this;

			this.$toolBarButton.on('click', function(){
				if(task.getButtonState()){
					task.setButtonState(false);
					task.$pane.fadeOut();
					var item = w2ui[task.toolbarName].get(task.checkedMode);
					if(item){
						item.text = '';
						w2ui[task.toolbarName].uncheck(item.id);
						w2ui[task.toolbarName].refresh(task.checkedMode);
					}
					task.clear();
				}
				else{
					if(task.map.setTask(task)){
						task.setButtonState(true);
						task.$pane.fadeIn();
						// развернуть общую панель для компонентов (если используется)
						task.map.showControlsPanel();
					}
				}
			});

		    //выключение кнопки в w2ui toolbar при включнии другого обработчика карты
			$(this.map.eventPane).on('closeaction', GWTK.Util.bind(function(e){
			    if ((e.task instanceof GWTK.MapCalculationsTask)) {
			        if (!this.action) return;
			        this.action.clear(this);
			        var itemId = this.action.name;
			        this.action = null;
			        var item = w2ui[this.toolbarName].get(itemId);
				    if(!item){
					    for(var i = 0; i < w2ui[this.toolbarName]['items'].length; i++){
						    if(w2ui[this.toolbarName]['items'][i].type === 'menu'){
							    for(var j = 0; j < w2ui[this.toolbarName]['items'][i]['items'].length; j++){
								    if(itemId === w2ui[this.toolbarName]['items'][i]['items'][j].id){
									    item = w2ui[this.toolbarName]['items'][i];
									    break;
								    }
							    }
							    if (item) { break; }
						    }
					    }
				    }
				    if (item && item.actionClassObject) {
				        if ($.isFunction(item.actionClassObject.clear))
				           item.actionClassObject.clear();
			        	item.actionClassObject = null;
			        }
			        if (item) {
			            w2ui[this.toolbarName].uncheck(item.id);
			            this.clearMode(item);
			        }
				    w2ui[this.toolbarName].selected = '';
					this.checkedItem = '';
					w2ui[this.toolbarName].refresh();
				}
			}, this));

			return;
		},

		/**
		 * Получить состояние кнопки
		 * @method getButtonState
		 * @return {Boolean} `true` - включена, `false` - нет
		 */
		// ===============================================================
		getButtonState: function(){
			return this.$toolBarButton.hasClass('control-button-active');
		},

		/**
		 * Установить состояние кнопки
		 * @method setButtonState
		 * @param state {Boolean} (true - включить, false - выключить)
		 * @return {Boolean} `true` - включена, `false` - нет
		 */
		// ===============================================================
		setButtonState: function(state){
			return state ? this.$toolBarButton.addClass('control-button-active') : this.$toolBarButton.removeClass('control-button-active');
		},


		/**
		 * Показать панель задачи
		 */
		// ===============================================================
		showToolBarPanel: function(){
			this.$pane.fadeIn();
		},

		clear: function(){
			this.clearAction();
			this.checkedMode = '';
			this.checkedItem = '';

			if(w2ui[this.toolbarName] === undefined) return;

			var menu = w2ui[this.toolbarName].items, i, len, j, len2;
			for(i = 0; len = menu.length, i < len; i++){
				if(menu[i].items || menu[i].type === 'menu'){
					for(j = 0; len2 = menu[i].items.length, j < len2; j++){
						if(menu[i].items[j].actionClass && menu[i].items[j].actionClass.length > 0){
							menu[i].items[j].actionClassObject = null;
						}
					}
				}else{
					if(menu[i] && menu[i]['actionClassObject']){
						menu[i]['actionClassObject'] = null;
					}
				}
			}
		},

		/**
		 * Деструктор задачи
		 */
		// ===============================================================
		destroy: function(){

			// удалить toolbar
			if(w2ui[this.toolbarName]){
				w2ui[this.toolbarName].destroy();
			}

			// удалить панель
			if (this.$pane) {
			    this.$pane.remove();
			    this.$pane = null;
			    this.panel = null;
			}

		    // удалить кнопку в карте
			if (this.$toolBarButton) {
			    this.$toolBarButton.off();
			}
			//this.$toolBarButton.remove();
			this.$toolBarButton = null;
			this.toolBarButton = null;

			return;
		},

		/**
		 * Сделать панель перемещаемой
		 */
		setDraggable: function () {
			this.$pane.draggable({ containment: 'parent' });
        },

        /**
		 * Изменить размер дочерних элементов по размеру панели
		 */
		resize: function () {

        }

	};

	GWTK.Util.inherits(GWTK.MapCalculationsTask, GWTK.MapTask);
}
