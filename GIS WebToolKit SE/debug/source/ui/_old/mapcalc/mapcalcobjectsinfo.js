/********************************* Гиман Н.Л      **** 11/12/17 *****
 ********************************* Нефедьева О.А. **** 13/11/19 *****
 ********************************* Соколова Т.О.  **** 13/08/19 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019             *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Информация об объекте местности                *
 *                                                                  *
 *******************************************************************/
if(window.GWTK){
	GWTK.InformationAboutObjectAction = function(task, map, options){
		this.map = map;
		this.task = task;
		this.selectableLayersId = [];
		this.allSemanticsFromLayer = [];
		this.selectedObject = [];
		this.random = GWTK.Util.randomInt(1, 500);
		this.gridName = 'allsemantics' + this.random;
		this.allSemanticsRecords = [];
		GWTK.SelectMapObjectActionHover.call(this, this.task, {
		    fn_setselectlayers: this.getSelectableLayers
		});

		this.name = 'informationaboutproject';
	};
	GWTK.InformationAboutObjectAction.prototype = {
		/**
		 * Инициализировать компонент
		 * @method set
		 */
		set: function(){
			this.initEventListeners();
			this.createPanels();
		},
		/**
		 * Удалить назначенные обработчики
		 * @method clear
		 */
		clear: function(){
			this.$super.clear(this);
			$(this.map.eventPane).off('featurelistclick.infoaboutproject');
			if(w2ui[this.gridName]){
				w2ui[this.gridName].destroy();
			}
			$(this.allSemanticsPanel).remove();
			$(this.allSemanticsGridPanel).remove();
			this.map.statusbar.clearText();
		},
		/**
		 * Инициализация обработчиков событий
		 * @method initEventListeners
		 */
		initEventListeners: function(){
			$(this.map.eventPane).on('featurelistclick.infoaboutproject', GWTK.Util.bind(function(e){
				this.layer = this.map.tiles.getLayerByxId(e.layer);
				this.selectedObject = this.map.objectManager.selectedFeatures.findobjectsByGid(e.gid);

                if (this.layer && this.layer.classifier) {
                    this.layer.classifier.getLayerSemanticList(
                        GWTK.Util.bind(this.fillAllSemantics, this));
	                }
			}, this));
		},
		/**
		 * Создать панели для компонента
		 * @method createPanels
		 */
		createPanels: function(){
			this.allSemanticsPanel = GWTK.DomUtil.create('div', 'objects-panel all-semantics-panel map-panel-def', this.map.mapPaneOld);
			this.allSemanticsGridPanel = GWTK.DomUtil.create('div', 'all-semantics-grid', this.allSemanticsPanel);
			this.$allSemanticsPanel = $(this.allSemanticsPanel);
			this.$allSemanticsGridPanel = $(this.allSemanticsGridPanel);
			$(this.allSemanticsGridPanel).w2grid({
				name: this.gridName,
				columns: [
					{field: 'name', caption: w2utils.lang("Semantic name"), size: '50%', sortable: true },
					{field: 'value', caption: w2utils.lang("Value"), size:'50%', sortable: true}
				],
				sortData: [{field: "name", direction: "ASC"}],
				records: this.allSemanticsRecords,
				onDblClick: GWTK.Util.bind(this.searchBySelectedSemantics, this)
			});
			this.showHidePanel(false);
		},
		/**
		 * Осуществить поиск по семантике
		 * @param event{Object} - объект события двойного клика в таблице семантик
		 * @method searchBySelectedSemantics
		 * @return {boolean}
		 */
		searchBySelectedSemantics: function(event){
			var record = w2ui[this.gridName].get(event.recid);
			var hasSemantic = false, val;
			for(var i = 0; i < this.selectedObject.semantic.semantics.length; i++){
				if(this.selectedObject.semantic.semantics[i]['shortname'] === record['shortname']){
					hasSemantic = true;
					val = this.selectedObject.semantic.semantics[i]['value'];
				}
			}
			if(!hasSemantic){
				w2alert(w2utils.lang('This object does not have this semantics'));
				return false;
			}
            if (!this.layer) {
                return;
            }
            var textfilter = '((' + record['shortname'] + ')(=)(val=' + GWTK.fixedEncodeURI(val) + ')(AND))';
			var rpclayers = [];
			var rpclayer = {
				"layerid": this.layer.idLayer,
				"semanticname": 1,
				"textfilter": textfilter
			};
			
			if(this.layer){
				if(this.layer.typeNames)
					rpclayer.typenames = this.layer.typeNames;
				if(this.layer.codeList)
					rpclayer.codelist = this.layer.codeList;
			}
			rpclayers.push(rpclayer);
			
			var index = 0;
			var url = "?semantic=1&semanticname=1&OBJCENTER=2&OBJLOCAL=0,1,2,4&MapId=1&AREA=1&START_INDEX=" + index;
			
			var server = GWTK.Util.getServerUrl(this.layer.options.url),
                token = this.map.getToken();
			if (token) {
			    if (!this.layer.options.token) {
			        token = false;
			    }
			}
            var text = GWTK.Util.url2xmlRpcEx(url, "TEXTSEARCH", rpclayers);
			this.showHidePanel(false);
			this.wfs = new GWTK.WfsRestRequests(this.map);
			GWTK.Util.showWait();
			this.wfs.postRequestMulti([{
                url: server + '?&SERVICE=WFS&RESTMETHOD=TEXTSEARCH',
                text: text,
                token:token
			}], GWTK.Util.bind(function(){
				this.map.selectedObjects.drawSelectedObjects();
				this.map.statusbar.set(w2utils.lang("Select the highlighted object on the map"));
				GWTK.Util.hideWait();
			}, this));
		},
		/**
		 * Скрыть или показать панель
		 * @param ind{Boolean} -  признак видимости слоя
		 * @method showHidePanel
		 */
		showHidePanel: function(ind){
			ind ? this.$allSemanticsPanel.show() : this.$allSemanticsPanel.hide();
		},

		// /**
		//  * Отобразить все семантики которые присутствуют у объектов карты
		//  * @param error{Boolean} - признак ошибки
		//  * @param semantics{Object} - ответ сервера в формате JSON
		//  * @method fillAllSemantics
		//  * @return {boolean}
		//  */
		// fillAllSemantics: function(error, semantics){
		// 	if(error){
		// 		w2alert(w2utils.lang('Error for loading semantic'));
		// 		return false;
		// 	}
		// 	var semanticWithCodeWasAdd = {};
		// 	this.allSemanticsRecords = [];
		// 	for(var i = 0; i < semantics.features.length; i++){
		// 		if(semantics.features[i]['rscsemantic'].length > 0){
		// 			for(var j = 0; j < semantics.features[i]['rscsemantic'].length; j++){
		// 				if(!semanticWithCodeWasAdd [semantics.features[i]['rscsemantic'][j]['code']]){
		// 					this.allSemanticsFromLayer.push(semantics.features[i]['rscsemantic'][j]);
		// 					var value = '';
		// 					for(var k = 0; k < this.selectedObject.semantic.semantics.length; k++){
		// 						if(this.selectedObject.semantic.semantics[k]['shortname'] === semantics.features[i]['rscsemantic'][j]['shortname']){
		// 							value = this.selectedObject.semantic.semantics[k]['value'];
		// 							break;
		// 						}
		// 					}
		// 					this.allSemanticsRecords.push({
		// 						recid: semantics.features[i]['rscsemantic'][j]['code'],
		// 						name: semantics.features[i]['rscsemantic'][j]['name'],
		// 						value:value,
		// 						shortname: semantics.features[i]['rscsemantic'][j]['shortname']
		// 					});
		// 					semanticWithCodeWasAdd [semantics.features[i]['rscsemantic'][j]['code']] = true;
		// 				}
		// 			}
		// 		}
		// 	}
		// 	this.showWindowWithSemantics();
		// 	semanticWithCodeWasAdd = {};
		// },


        /**
         * Отобразить все семантики которые присутствуют у объектов карты
         * @param features[] - массив семантик сллоя в формате JSON
         * @param status{string} - 'success' или 'error'
		 * @method fillAllSemantics
         * @return {boolean}
         */
        fillAllSemantics: function(features, status){
            if(!features || status == 'error'){
                w2alert(w2utils.lang('Error for loading semantic'));
                return false;
            }
            var semanticWithCodeWasAdd = {};
            this.allSemanticsRecords = [];
            for(var i = 0; i < features.length; i++){
                if(features[i]['rscsemantic'].length > 0){
                    for(var j = 0; j < features[i]['rscsemantic'].length; j++){
                        if(!semanticWithCodeWasAdd [features[i]['rscsemantic'][j]['code']]){
                            this.allSemanticsFromLayer.push(features[i]['rscsemantic'][j]);
                            var value = '';
                            for(var k = 0; k < this.selectedObject.semantic.semantics.length; k++){
                                if(this.selectedObject.semantic.semantics[k]['shortname'] === features[i]['rscsemantic'][j]['shortname']){
                                    value = this.selectedObject.semantic.semantics[k]['value'];
                                    break;
                                }
                            }
                            this.allSemanticsRecords.push({
                                recid: features[i]['rscsemantic'][j]['code'],
                                name: features[i]['rscsemantic'][j]['name'],
                                value:value,
                                shortname: features[i]['rscsemantic'][j]['shortname']
                            });
                            semanticWithCodeWasAdd [features[i]['rscsemantic'][j]['code']] = true;
                        }
                    }
                }
            }
            this.showWindowWithSemantics();
            semanticWithCodeWasAdd = {};
        },


        /**
		 * Показать таблицу с семантиками
		 * @method showWindowWithSemantics
		 */
		showWindowWithSemantics: function(){
			this.showHidePanel(true);
			var grid = w2ui[this.gridName];
			if (grid){
                grid.records = this.allSemanticsRecords;
                grid.refresh();
                if (grid.sortData.length > 0) {
                    grid.sort(grid.sortData[0].field, grid.sortData[0].direction);
                }
			}
			this.map.statusbar.set(w2utils.lang("Select semantic in the table"));
		},

		/**
		 * Получить слои с выбором объектов
		 * @method getSelectableLayers
		 * @return {Array} - список слоев
		 */
		getSelectableLayers: function(){
			this.selectableLayersId = [];
			var lay_ids = this.map.tiles.getSelectableLayersEx(), i, len = lay_ids.length;
			for(i = 0; i < len; i++){
				this.selectableLayersId.push(lay_ids[i].id);
			}
			return this.selectableLayersId;
		}

	};
	GWTK.Util.inherits(GWTK.InformationAboutObjectAction, GWTK.SelectMapObjectActionHover);
}