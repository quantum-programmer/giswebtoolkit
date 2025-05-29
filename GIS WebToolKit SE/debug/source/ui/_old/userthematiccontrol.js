/*************************************** Помозов Е.В.   13/05/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Компонент "Картограмма"                       *
 *                                                                  *
 *******************************************************************/

/**
 * Компонент создания картограммы
 *
 */
GWTK.protoUserThematic = {
    title: w2utils.lang('Cartogram'),

    button_options: {
        "class": 'control-button control-button-userthematic clickable'
    },

    panel_options: {
        'class': 'map-panel-def userthematic-panel',
        'class-controlspanel': 'map-panel-def-flex userthematic-panel-flex',
        'display': 'none',
        'hidable': true,
        'header': true,
        'draggable': true,
        'resizable': false
    },

    /**
     * Инициализация компонента
     */
    init: function () {
        this.title = w2utils.lang('Cartogram');
		// родительский контейнер в дереве слоев
		this.treeParentId = "userlayers";
		this.treeParentCaption = w2utils.lang('Thematic layers');
		// цвета
		this.colors = [];
        // разделитель строк в файле
        this.sep = "\n";
		
        this.createButton();

        this.createPanel();

        // создать панель вкладок
        this.createTabs();
		
		// создать командную панель
        this.createCommandPane();

        this.initEvents();
        
    },

    /**
     * Инициализация событий
     *
     * @method initEventsExportLayer
     */
    initEvents: function () {
        // обработка клика на кнопке в тулбаре
        this.$button.on('click', function () {
            if (GWTK.DomUtil.isActiveElement(this.$button)) {
                this.$button.removeClass('control-button-active');
                this.$panel.hide();
            } else {
                this.$button.addClass('control-button-active');
                this.$panel.show();
                // развернуть общую панель для компонентов (если используется)
                this.map.showControlsPanel();				
            }            
			this._notifyClick();
        }.bind(this));
		
		// обработка изменений размера панели
        this.$panel.on('resize', function (event) {			
			this.$tabsContent.style.height = (this.panel.clientHeight - 113) + 'px';
			if (this.viewgridgrad) {			  
			  this.$viewgrid.style.height = (this.panel.clientHeight - 207) + 'px';
			  this.viewgridgrad.resize();			  
			}
        }.bind(this));

        // обработка изменений размера панели контролов
		$(this.map.eventPane).on('resizecontrolspanel.' + this.toolname, function (event) {			
			// изменить размеры своей панели			
			this.resize();
		}.bind(this));
		
		var tool = this;
		$( this.map.eventPane ).on( 'layerlistchanged.userthematic', function ( e ) {
            tool.onLayersWasChanged(e);
        } );
			 
        $( this.map.eventPane ).on( 'visibilitychanged.userthematic', function ( e ) {
            tool.onLayersWasChanged(e);
        } )
		
    },
	
	/**
     * Изменение состава слоев
	 *
	 * @param e {Object} объект события
	 * @method onLayerListChanged
     */
	onLayersWasChanged: function(e) {
		var layer;
		var items = this.$elemLayers.querySelectorAll('option');
		
		if ( e.type == 'visibilitychanged' ) {
			if ( e.maplayer.visible ) {
				layer = this.map.tiles.getLayerByxId( e.maplayer.id );
                if ( layer && layer.selectObject ) {
					if (this.getItemIndexById(items, 'id', layer.xId) == -1) {
						var option = document.createElement('option');
						option.id = layer.xId;
						option.value = layer.xId;
						option.innerHTML = layer.alias;
						option.setAttribute('serviceUrl', layer.server);
						this.$elemLayers.appendChild(option);
						if (items.length == 0) {
						  this.onChangeLayer();
						}
					}					
				}
			}
			else {
                var selId = this.$elemLayers.querySelectorAll('option')[this.$elemLayers.selectedIndex].id;
                if ( selId == e.maplayer.id ) {
					var index = this.getItemIndexById(items, 'id', selId);
					if (index !== -1) {
						items[index].remove();						
						this.onChangeLayer();
					}
				}
				else {					
                    for ( var i = 0; i < items.length; i++ ) {
                      if ( items[ i ].id == e.maplayer.id ) {
                        items[i].remove();
						break;
                      }
                    }                    
				}				
			}				
		}
		if ( e.type == 'layerlistchanged' ) {
            if ( e.maplayer.act == 'add' ) {
				layer = this.map.tiles.getLayerByxId( e.maplayer.id );
                if ( layer && layer.selectObject ) {
					if (this.getItemIndexById(items, 'id', layer.xId) == -1) {
						var option = document.createElement('option');
						option.id = layer.xId;
						option.value = layer.xId;
						option.innerHTML = layer.alias;
						option.setAttribute('serviceUrl', layer.server);
						this.$elemLayers.appendChild(option);
						if (items.length == 0) {
						  this.onChangeSemantics();
						}
					}					
				}	
			}
			if ( e.maplayer.act == 'remove' ) {
				var selId = this.$elemLayers.querySelectorAll('option')[this.$elemLayers.selectedIndex].id;
                if ( selId == e.maplayer.id ) {
					var index = this.getItemIndexById(items, 'id', selId);
					if (index !== -1) {
						items[index].remove();	
                        this.onChangeLayer();			
					}
				}
				else {					
                    for ( var i = 0; i < items.length; i++ ) {
                      if ( items[ i ].id == e.maplayer.id ) {
                        items[i].remove();
						break;
                      }
                    }                    
				}
			}
		}
	},
		
    /**
     * Изменить размер дочерних элементов по размеру панели
	 *
	 * @method resize
     */
    resize: function () {		
       if (this.viewgridgrad) {
		 var width = this.$panel.width();
		 $(this.viewgridgrad.box).width(width - 40);
		 this.viewgridgrad.resize();
	   }
    },
		
	/**
     * Создать компонент Вкладки для данных и вида
	 *
	 * @method createTabs 
     */	
	createTabs: function() {
		if ( !this.map )
                return;                 
	
	    var tabsName = this.toolname + "_tabs_" + this.map.divID;
		var tabsContent = this.toolname + "_tabscontent_" + this.map.divID;		
		var tabData = this.toolname + "_tabdata_" + this.map.divID;
		var tabView = this.toolname + "_tabview_" + this.map.divID;
		
		this.$panel.append('<div id="' + tabsName + '" class="w2ui-reset w2ui-tabs">' + '</div>' +
		                   '<div id="' + tabsContent + '" style="height:260px; width: 100%; border: 1px solid silver; border-top: 0;">' +
							   '<div id="' + tabData + '" style="height:100%;display:none;">' + '</div>' +							   
							   '<div id="' + tabView + '" style="height:100%;display:none;">' + '</div>' +
						   '</div>');
		var tool = this;

        tool.$tabsContent = document.querySelector('#' + tabsContent);
        tool.$tabData = document.querySelector('#' + tabData);
		tool.$tabView = document.querySelector('#' + tabView);
		
		$('#' + tabsName).w2tabs({
           name: tabsName,
           tabs: [
		      { id: 'data',
                caption: w2utils.lang( 'Data' ) 
			  },
			  { id: 'view',
                caption: w2utils.lang( 'View' )
			  }		   
		   ],
           onClick: function (e) {		      
			  switch (e.target) {
				  case 'data': 
				    tool.$tabView.style.display = 'none';
					tool.$tabData.style.display = 'block';
                    if (!this.active) {
					  tool.getTabData(tool.$tabData);	
					}					
				  break;
				  case 'view':
				    tool.$tabData.style.display = 'none';
					tool.$tabView.style.display = 'block';	
					tool.getTabView(tool.$tabView);
										  
				  break;
			  }
		   }
		   
		});
		
		w2ui[tabsName].click(w2ui[tabsName].tabs[0].id);
		
	},
	
	/**
      * Заполнить вкладку Данные
      * @param el {Object} контейнер владки (DOM элемент)
      * @method getTabData
    */
	getTabData: function(el) {
        if (!el) {
			return;
		}
		
		$(el).append('<table class="cartogramdata">' +		              
					  '<tr>' +
					     '<td class="delimlabel">' +
						    w2utils.lang('Delimiter') + ':' +
						 '</td>' +
						 '<td colspan="2">' +
						    '<select id="delimfile" class="list">' + 
							   '<option id="space" value="space" delim=" ">' + w2utils.lang('Space') + '</option>' +
							   '<option id="comma" value="comma" delim=",">' + ',' + '</option>' +
							   '<option id="slash" value="slash" delim="/">' + '/' + '</option>' +
							   '<option id="semicolon" value="semicolon" delim=";">' + ';' + '</option>' +
							   '<option id="backslash" value="backslash" delim="\\">' + '\\' + '</option>' +
							   '<option id="vertline" value="vertline" delim="|">' + '|' + '</option>' +
							   '<option id="underline" value="underline" delim="_">' + '_' + '</option>' +
							   '<option id="tab" value="tab" delim="\t">' + w2utils.lang('Tab') + '</option>' +
							'</select>' + 
							'<div class="w2ui-field-helper" style="color: rgb(0, 0, 0); font-family: MS Shell Dlg \32 ; font-size: 13.3333px; padding: 4px 4px 4px 3px; margin-top: 2px; margin-bottom: 1px; margin-left: -17px; opacity: 1;"><div class="arrow-down" style="margin-top: 5px;"></div></div>' +						    
						 '</td>' +						 
						 '<td class="namefields">' +
						    '<input id="namefields" type="checkbox" checked="checked">' + '&nbsp;&nbsp;' + w2utils.lang('Field names') +
						 '</td>' +
				      '</tr>' +				  					
                      '<tr>' +
			             '<td class="fileopenlabel">' +
						    w2utils.lang('File') + ':' +
						 '</td>' +
						 '<td style="width:80px;">' +
						    '<button id="openfile" class="btn" style="margin:auto;text-transform:none !important;font-size:12px !important;height:26px !important;">' + w2utils.lang('Open') + '</button>' +
						 '</td>' +
						 '<td colspan="2">' +
						    '<input id="selectfile" type="file" class="hidden">' +
							'<input id="filename" type="text" disabled="disabled" class="cartogramfilename">' +
						 '</td>' +
			          '</tr>' +
			          '<tr>' +
			             '<td class="cartogramlayerlabel">' +
			                w2utils.lang('Layer') + ':' +
						 '</td>' +
						 '<td colspan="3">' +
						    '<select id="layer" class="list">' + '</select>' +
							'<div class="w2ui-field-helper" style="color: rgb(0, 0, 0); font-family: MS Shell Dlg \32 ; font-size: 13.3333px; padding: 4px 4px 4px 3px; margin-top: 2px; margin-bottom: 1px; margin-left: -17px; opacity: 1;"><div class="arrow-down" style="margin-top: 5px;"></div></div>' +
						 '</td>' +
			          '</tr>' +
					  '<tr>' +
					     '<td colspan="4" class="center">' + '<- ' + w2utils.lang('Relationship') + ' ->' + '</td>' + 
				      '</tr>' +
					  '<tr>' +
					     '<td colspan="2" style="text-align:center;">' + w2utils.lang('Table field') + '</td>' + 
						 '<td colspan="2" style="text-align:center;">' + w2utils.lang('Semantic name') + '</td>' +						 
					  '</tr>' +
					  '<tr>' +
					     '<td colspan="2" style="width:50%">' +
						    '<select id="tablefields" class="list">' + '</select>' +
						    '<div class="w2ui-field-helper" style="color: rgb(0, 0, 0); font-family: MS Shell Dlg \32 ; font-size: 13.3333px; padding: 4px 4px 4px 3px; margin-top: 2px; margin-bottom: 1px; margin-left: -17px; opacity: 1;"><div class="arrow-down" style="margin-top: 5px;"></div></div>' +
						 '</td>' +
						 '<td colspan="2" style="width:50%">' +
						    '<select id="semantics" class="list">' + '</select>' +
						    '<div class="w2ui-field-helper" style="color: rgb(0, 0, 0); font-family: MS Shell Dlg \32 ; font-size: 13.3333px; padding: 4px 4px 4px 3px; margin-top: 2px; margin-bottom: 1px; margin-left: -17px; opacity: 1;"><div class="arrow-down" style="margin-top: 5px;"></div></div>' +						    
						 '</td>' + 
					  '</tr>' +
					  '<tr>' +
					     '<td colspan="2" class="center">' + w2utils.lang('Values field') + '</td>' + 
						 '<td colspan="2">' + '</td>' +
					  '</tr>' +
					  '<tr>' +
					     '<td colspan="2">' + 
						    '<select id="valuesfield" class="list" style="width:100%;">' + '</select>' +
							'<div class="w2ui-field-helper" style="color: rgb(0, 0, 0); font-family: MS Shell Dlg \32 ; font-size: 13.3333px; padding: 4px 4px 4px 3px; margin-top: 2px; margin-bottom: 1px; margin-left: -17px; opacity: 1;"><div class="arrow-down" style="margin-top: 5px;"></div></div>' +						    
						 '</td>' +
                         '<td style="text-align:right;">' +
						    w2utils.lang('Minimum') + ':' +
						 '</td>' +
						 '<td>' + 
							'<input id="minvalue" type="text" disabled="disabled" style="width:100%;height:26px;">' +
						 '</td>' +
					  '</tr>' +
					  '<tr>' +
					     '<td colspan="2" style="text-align:center;">' +                             
						 '</td>' +
                         '<td style="text-align:right;">' +
						    w2utils.lang('Maximum') + ':' +
						 '</td>' +
						 '<td>' +
							'<input id="maxvalue" type="text" disabled="disabled" style="width:100%;height:26px;">' +
						 '</td>' +
					  '</tr>' +
                  '</table>');
		
		this.$delimfile = el.querySelector('#delimfile');
		this.$file = el.querySelector('#selectfile');		
		
		var nameFields = el.querySelector('#namefields');		
		this.$namefields = nameFields;
		
		el.querySelector('#openfile').addEventListener('click', function(e){
			el.querySelector('#selectfile').click();
		});
				
		var elemLayers = el.querySelector('#layer');
		this.$elemLayers = elemLayers;
		var selectableLayers = this.map.tiles.getSelectableLayers().split( ',' );				
		for ( var i = 0; i < selectableLayers.length; i++ ) {
		  layer = this.map.tiles.getLayerByIdService(selectableLayers[i]);
		  if (layer) {
			var option = document.createElement('option');
			option.id = layer.xId;
			option.value = layer.xId;
			option.setAttribute('serviceUrl', GWTK.Util.getServerUrl(layer.options.url));
			option.innerHTML = layer.alias;			
			elemLayers.appendChild(option);
		  }
		}		
		elemLayers.addEventListener('change', this.onChangeLayer.bind(this));		
					
		var elemFields = el.querySelector('#tablefields');
		this.$elemFields = elemFields;
				
		elemFields.addEventListener('change', this.onChangeTableField.bind(this));
		var elemSemantics = el.querySelector('#semantics');
		
		this.$elemSemantics = elemSemantics;
		
		elemSemantics.addEventListener('change', this.onChangeSemantics.bind(this));
		
		var elemValues = el.querySelector('#valuesfield');
		this.$elemValues = elemValues;
		elemValues.addEventListener('change', this.onChangeFieldValues.bind(this));		
				
		var elemMinValue = el.querySelector('#minvalue');		
		this.$elemMinValue = elemMinValue;
				
		var elemMaxValue = el.querySelector('#maxvalue');		
		this.$elemMaxValue = elemMaxValue;
		
		var tool = this;
		el.querySelector('#selectfile').addEventListener('change', function(e){
			var file = this.files[0];
			el.querySelector('#filename').value = file.name;
			tool.onSelectFile(file);
		});
				  
	},
	
	/**
      *  Обработчик изменения поля таблицы
      *
      * @method onChangeTableField
    */
	onChangeTableField: function() {		
		var tool = this;
		var options = tool.$elemFields.querySelectorAll('option');
		var selectedIndex = tool.$elemFields.selectedIndex;
		var type = options[selectedIndex].getAttribute('type'); 
		var items = tool.getLayerSemanticList(type);
		while (this.$elemSemantics.firstChild) {
          this.$elemSemantics.removeChild(this.$elemSemantics.firstChild);
        }
		
		if (items.length > 0) {
		  for (var i=0; i<items.length; i++) {
			var option = document.createElement('option');
			option.id = items[i].id;
			option.innerHTML = items[i].text;
			option.setAttribute('type', items[i].type);
			tool.$elemSemantics.appendChild(option);
		  }
		  tool.$elemSemantics.selectedIndex = 0;	
		}		
	},
	
	/**
      * Обработчик изменения поля семантики
      *
      * @method onChangeSemantics
    */
	onChangeSemantics: function() {
        	
	},
	
	/**
      * Обработчик изменения поля значение
      *
      * @method onChangeFieldValues
    */
	onChangeFieldValues: function() {
		var field = this.$elemValues.value,
		  dataFile = this.dataFile,
		  minVal, maxVal,
	      options = this.$delimfile.querySelectorAll('option'),
		  selectedIndex = this.$delimfile.selectedIndex,	  
	      delim = options[selectedIndex].getAttribute('delim'),
		  index = dataFile[0].split(delim).indexOf(field);
		  
		this.$elemMinValue.value = '';
		this.$elemMaxValue.value = '';
		  
		if (index !== -1) {
			for (var i=1; i<dataFile.length; i++) {
			  if (dataFile[i] == '') continue;
			  var fields = dataFile[i].split(delim);
			  var value = parseFloat(fields[index]);
			  if (typeof minVal == 'undefined') {
				  minVal = value;
			  }
			  if (typeof maxVal == 'undefined') {
				  maxVal = value;
			  }
			  
			  if (minVal > value) {
				  minVal = value;
			  }
			  if (maxVal < value) {
				  maxVal = value;
			  }
		    }
			this.$elemMinValue.value = minVal;
			this.$elemMaxValue.value = maxVal;
			if (this.$view_lbMin && this.$view_lbMin.length > 0) {
				this.$view_lbMin.text(w2utils.lang('Minimum') + ': ' + minVal);
			}
			if (this.$view_lbMax && this.$view_lbMax.length > 0) {
				this.$view_lbMax.text(w2utils.lang('Maximum') + ': ' + maxVal);
			}
		}
	},
	
	/**
      * Получить список семантик слоя указанного типа
      *	@param {Number} тип семантики 
      * @method getLayerSemanticList
    */
	getLayerSemanticList: function(type) {
	    var id = this.$elemLayers.value;
		var layer = this.map.tiles.getLayerByxId(id);
		if (!layer) return false;
		var items = [];		
        if (layer.classifier) {
		  for (var i=0; i<layer.classifier.layerSemanticList.length; i++) {
			var semantic = layer.classifier.layerSemanticList[i].rscsemantic;			
			for (var j=0; j<semantic.length; j++) {			  
			  if (semantic[j].type == type) {
                if (this.getItemIndexById(items, 'id', semantic[j].shortname) == -1) {
                  items.push({
			        id: semantic[j].shortname,
					text: semantic[j].name,
					type: semantic[j].type					
				  });					  
				}
			  }				  
			}
		  }
		}		
		return items;
	},

    /**
      * Обработчик выбора слоя
      *	  
      * @method onChangeLayer
    */
    onChangeLayer: function() {
		if (this.$elemFields.selectedIndex !== -1) {

			var options = this.$elemFields.querySelectorAll('option');
			var selectedIndex = this.$elemFields.selectedIndex;
			var type = options[selectedIndex].getAttribute('type');
			var items = this.getLayerSemanticList(type);			

			while (this.$elemSemantics.firstChild) {
              this.$elemSemantics.removeChild(this.$elemSemantics.firstChild);
            }			
			if (items.length > 0) {
			  for (var i=0; i<items.length; i++) {
			    var option = document.createElement('option');			  
			    option.id = items[i].id;
			    option.innerHTML = items[i].text;
			    option.setAttribute('type', items[i].type);			  
			    this.$elemSemantics.appendChild(option);
			  }	
			  this.$elemSemantics.selectedIndex = 0;				
			}
		}
	},	
	
	/**
      * Обработчик выбора файла данных и формирование параметров
      *
	  * @param file {Object} объект File
      * @method onSelectFile
    */
	onSelectFile: function(file) {		
        var reader = new FileReader();
        reader.readAsText(file);
        var tool = this;
		reader.onload = function() {              
		  tool.sep = "\n";			  
		  var pos = reader.result.indexOf("\n");
		  if (pos !== -1) {
			  if (reader.result[pos-1] == "\r") {
				  tool.sep = "\r\n";
			  }
		  }			  
		  var dataFile = reader.result.split(tool.sep);		  		  
		  tool.dataFile = dataFile;		  
		  var delim = tool.$delimfile.querySelectorAll('option')[tool.$delimfile.selectedIndex].getAttribute('delim');		  
		  var param = tool.getSettings('delim');
		  if (param) {
			  var items = [];
			  var options = tool.$delimfile.querySelectorAll('option');
			  for (var i=0; i<options.length; i++) {
			    items.push({
					id: options[i].id,
					text: options[i].innerHTML,
					delim: options[i].getAttribute('delim')
				});
			  }
			  
			  var delimIndex = tool.getItemIndexById(items, 'id', param);
			  if (delimIndex !== -1) {				
				tool.$delimfile.selectedIndex = delimIndex;				
				delim = tool.$delimfile.querySelectorAll('option')[tool.$delimfile.selectedIndex].getAttribute('delim');;				
			  }
		  }
		  
		  var param = tool.getSettings('fieldnames');		  
          if (param === false) {				
			tool.$namefields.checked = false;
		  }	  		  
		  var fields = dataFile[0].split(delim);
		  
		  if (fields.length == 1) {
			  tool.dataFile = null;
			  var msg = w2utils.lang('Unable to parse data file') + ' "' + file.name + '"!';			  			  
			  console.log(msg);			  
			  return;
		  }
		  var nameFields = tool.$namefields.checked;
		  
		  var layerId = tool.getSettings('layer');
		  if (layerId) {			
			var options = tool.$elemLayers.querySelectorAll('option'), items = [];			
			for (var i=0; i<options.length; i++) {
				items.push({
					id: options[i].id,
					text: options[i].innerHTML
				});
			}			
			var layerIndex = tool.getItemIndexById(items, 'id', layerId);
			if (layerIndex !== -1) {
			   tool.$elemLayers.selectedIndex = layerIndex;
			}
			else {			
			  var layer = tool.map.tiles.getLayerByxId(layerId);			  			  
			  var msg;
			  if (layer) {
				msg = 'GWTK.UserThematicControl. ' + w2utils.lang('Layer') + ' "' + layer.alias + '" ' + w2utils.lang('is disabled!');  
			  }
			  else {
				msg = 'GWTK.UserThematicControl. ' + w2utils.lang('Layer with ID=') + ' "' + layerId + '" ' + w2utils.lang('is not found!');  
			  }			  
			  console.log(msg);			  
			}
		  }

          while (tool.$elemFields.firstChild) {
             tool.$elemFields.removeChild(tool.$elemFields.firstChild);
          }
          while (tool.$elemValues.firstChild) {
             tool.$elemValues.removeChild(tool.$elemValues.firstChild);
          }
		  var items = [], values = [];
		  for (var i=0; i<fields.length; i++) {			
			var type = 0;
			if (/\d+[\.,]?[\s]?[\+-]?\d*/.test(fields[i])) {
				type = 1;
			}
			var item = {
				id: i + 1,
				value: fields[i],
				text: (nameFields?fields[i]:w2utils.lang('Field') + ' ' + (i+1) + ' (' + (type==0?'S':'N') + ') - ' + fields[i]),
				type: type
			};
			items.push(item);
            var option = document.createElement('option');
            option.id = item.id;
			option.innerHTML = item.text;
			option.value = item.value;
			option.setAttribute('type', item.type);
            
			tool.$elemFields.appendChild(option);			
			if (type == 1) {
			  var option = document.createElement('option');
			  var value = {
				  id: i + 1,
				  value: fields[i],
				  text: (nameFields?fields[i]:w2utils.lang('Field') + ' ' + (i+1) + ' (' + (type==0?'S':'N') + ') - ' + fields[i]),
				  type: type
			  }
			  values.push(value);
			  option.id = value.id;
			  option.innerHTML = value.text;
			  option.value = value.value;
			  option.setAttribute('type', value.type);
			  tool.$elemValues.appendChild(option);			  
			}
		  }                   		  
		  
		  var field = tool.getSettings('field');
		  var index = 0;		  	  
		  if (field) {
			 index = tool.getItemIndexById(items, 'id', field);
		  }		  
		  tool.$elemFields.selectedIndex = index;
		  
		  var value = tool.getSettings('value');
		  var index = 0;
		  		  
		  if (value) {
			  index = tool.getItemIndexById(values, 'id', value);
		  }
		  tool.$elemValues.selectedIndex = index;
		  
		  tool.onChangeLayer();		  
		  tool.onChangeFieldValues();
		  
        };
        reader.onerror = function() {
          console.log(reader.error);
        };
	},
	
	/**
      * Проверить существование в массиве объектв с указанным значением поля
      * @param items {Array} массив объектов
	  * @param field {string} имя поля
	  * @param value {string|number} значение поля
      * @method getItemIndexById
    */
	getItemIndexById: function(items, field, value) {
		var index = -1;
		for (var i=0; i<items.length; i++) {
			if (items[i][field] == value) {
				index = i;
				break;
			}
		}
		return index;
	},
	
	/**
      * Заполнить вкладку Вид
      * @param el {Object} контейнер владки
      * @method getTabView
    */
	getTabView: function(el) {
		if (!el) {
			return;
		}
		
		if (!el.querySelector('table')) {
		  $(el).append('<table style="width:100%;height:100%;margin-top:5px;font-size:12px;">' +		
		              '<tr style="height:18px;">' +
					     '<td colspan="2">' +
							   '<label id="viewparamnamelbl">' + w2utils.lang('Parameter name') + ': ' + '</label>' +
							   '<input id="viewparamname" value="' + w2utils.lang('Value') + '" style="width:200px;">' +
						 '</td>' +						 
				      '</tr>' +
					  '<tr style="height:38px;">' +
					     '<td colspan="2">' +
							'<label id="gradationslabel" class="gradationslabel">' + w2utils.lang( 'Gradations' ) + ':' + '</label>' +
							'<input id="gradationscount" type="text" class="gradationscount">' +
							'<button id="updategridgradations" class="btn control-button-theme-project" style="text-transform:none !important;font-size:12px !important;height:26px !important;">' + w2utils.lang('Update') + '</button>' +							
						 '</td>' +						 
				      '</tr>' + 
					  					  
					  '<tr style="height:18px;">' +
					     '<td colspan="2">' + 						    
						    '<label id="view_lbMin"></label> &nbsp;<label id="view_lbMax"></label>' +
						 '</td>' +
				      '</tr>' +
					  					  
					  '<tr>' +					  
					     '<td colspan="2" style="width:100%;height:100%;">' + 
						    '<div id="viewgridgrad" style="text-align:center;width:100%;height:100%;"></div>' +
						 '</td>' +						 
				      '</tr>' +					  
					  '</table>'
		  );
		  this.$viewparamnamelbl = el.querySelector('#viewparamnamelbl');
		  this.$viewparamname = el.querySelector('#viewparamname');
		  this.$view_lbMin = el.querySelector('#view_lbMin');
		  this.$view_lbMax = el.querySelector('#view_lbMax');
		  this.$viewgrid = el.querySelector('#viewgridgrad');
		  this.$gradationCount = el.querySelector('#gradationscount');
		  
		  $(this.$gradationCount).w2field('int', {
			min: 0,
			groupSymbol: ''
		  });
		  		  
		  el.querySelector('#updategridgradations').addEventListener('click', this.updateGridGradations.bind(this));		  
		}		
		this.$viewgrid.style.height = this.$viewgrid.parentElement.clientHeight + 'px';		
		      
        var semantics = this.$elemSemantics.value;
        if (semantics) {
			this.$viewgrid.innerHTML = '';		    
			var elemMinValue = this.$elemMinValue.value;
		    if (elemMinValue) {
		      this.$view_lbMin.innerHTML = w2utils.lang('Minimum') + ': ' + elemMinValue;
		    }		
		    var elemMaxValue = this.$elemMaxValue.value;		
		    if (elemMaxValue) {
		      this.$view_lbMax.innerHTML = w2utils.lang('Maximum') + ': ' + elemMaxValue;
		    }
			var gradcount = this.getSettings('gradcount');
			if (gradcount) {
			  this.$gradationCount.value = gradcount;
			}
			else {
			  if (!this.$gradationCount.value) {
				this.$gradationCount.value = this.getGradationCount();  
			  }
			}
			this.$viewgrid.style.textAlign = '';
			this.createGridGradation(this.$viewgrid);
		}
		else {			
		  this.$viewgrid.style.textAlign = 'center';
		  this.$viewgrid.className = '';		  
		  this.$viewgrid.innerHTML = w2utils.lang('Select data');
		}
		
	},
	
	/**
      * Обновить таблицу градаций
      * 
      * @method updateGridGradations
	  * 
    */
	updateGridGradations: function() {		
		this.createGridGradation(this.$viewgrid, true);
	},
	
	/**
      * Получить количество градаций семантки
      * 
      * @method getGradationCount
	  * 
    */
	getGradationCount: function() {
		var minVal = this.$elemMinValue.value;
		var maxVal = this.$elemMaxValue.value;				
		var gradationCount = Math.floor( maxVal - minVal );        
        if ( gradationCount == 0 ) {
            gradationCount = 1;
		}
		if ( gradationCount > 10 ) {
            gradationCount = 10;
		}
		return gradationCount;		
	},	
	
	/**
      * Создать или обновить таблицу градаций семантики
      * @param el {Object} контейнер владки
	  * @param update {Boolean} обновление цветов
      * @method createGridGradation
	  * 
    */
	createGridGradation: function(el, update) {				
		el = el || this.$viewgrid;
		update = update || false;
		
		var gradationCount = this.$gradationCount.value;
		if (!gradationCount) return;
		
        var minVal = parseFloat(this.$elemMinValue.value);
		var maxVal = parseFloat(this.$elemMaxValue.value);
		var gradationValues = maxVal - minVal;
		
		if (gradationCount > gradationValues) {
			gradationCount = parseInt(gradationValues);
			this.$gradationCount.val(gradationCount);
		}
			
		var gradationStep = 0;
        if ( gradationValues > 0 ) {
		  gradationStep = gradationValues / gradationCount;
		}

        gradationStep = Math.floor( gradationStep );
		var currVal = minVal;
		var nextVal = 0;
		
		var records = [];		
		for (var i=1; i<=gradationCount; i++) {
		  nextVal = currVal + gradationStep;
		  if ( i == gradationCount ) {
            nextVal = maxVal;
		  }
          if ( currVal > maxvalue ) {
			break;
		  }
		  		  		  
          var text = this.$viewparamname.value + ' ' + currVal + '-' + nextVal;			  
		  recobj = {
            recid: i,
            val_color: '',
            val_from: currVal,
            val_to: nextVal,
            val_text: text                
		  };
          records.push( recobj );                        
          currVal = currVal + gradationStep;
		}		
		
		if (!this.viewgridgrad) {									
			var tool = this;
			$().w2grid( {
                    name: 'viewgridgrad',   
                    update: update,					
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
                                return '<input id="gradcolor_' + record.recid + '" recid="' + record.recid + '" style="width:100%">';
                            }
                        },
                        {   field: "val_from",
                            caption: w2utils.lang( "From" ),
                            size: '50px',
                            editable: { type: 'float' }
                        },
                        {   field: "val_to", caption: w2utils.lang( "To" ), size: '50px', editable: { type: 'float' } },
                        {   field: "val_text",
                            caption: w2utils.lang( "Parameter" ),
                            size: '100%',
                            editable: { type: 'text' }
                        }
                    ],                    
                    records: records,
					onRender: function ( event ) {
                        event.onComplete = function () {
                            var color, table = this;
                            for ( var i = 0; i < this.records.length; i++ ) {                                
								if (this.update) {
								  color = tool.getRandomColor();
								  tool.colors[i] = color;
								}
								else {
								  var colors = tool.getSettings('colors');
								  if (colors && colors[i]) {
									color = colors[i];
								  }
								  else {
									if (tool.colors[i]) {
                                      color = tool.colors[i]; 
									}
                                    else {
                                      color = tool.getRandomColor(); 
									  tool.colors[i] = color;
									}
								  }
								}                                
								var gradcolor = document.querySelector('#gradcolor_' + this.records[ i ].recid);
                                gradcolor.value = color;
                                $(gradcolor).w2field( 'color' );
								$(gradcolor).on('change', function(e) {
									var recid = this.getAttribute('recid');
									var index = tool.getItemIndexById(table.records, 'recid', recid);									
									if (index !== -1) {
										table.records[index].val_color = this.value;
									}
								});
                            }							
                        }
                    }					
                } );
			    this.viewgridgrad = w2ui['viewgridgrad'];
		}
						
		this.viewgridgrad.records = records;		
		this.viewgridgrad.update = update;
		$(el).w2render('viewgridgrad');		
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
	
	/**
      * Создать панель командных кнопок (создать, сохранить)
      *
      * @method createCommandPane
    */
    createCommandPane: function () {
		var elem = document.createElement('div');						
            $(elem).html('<div class="thematic-control-inputs-container">' +			               
                           '<input type="text" id="userthematic_name" name="userthematic_name" class="control-button-userthematic-name" title="' + w2utils.lang("Name of cartogram") + '" value="' + w2utils.lang("Cartogram") + ' ' + this.getThematicLayerNumber() + '"/>&nbsp;' +
                           '<button id="userthematic_build" class="btn control-button-userthematic-build" style="font-size: 12px !important;height: 26px !important;text-transform: none !important;" title="' + w2utils.lang( 'Build' ) + '">'+ w2utils.lang('Build') +' </button>' +						   
                         '</div>');
	    this.$panel.append(elem);
		
		this.$userthematic_name = $(elem).find('#userthematic_name');		
		$(elem).find('#userthematic_build').on('click', this.buildUserThematic.bind(this));
	},
	
	/**
      * Получить имя файла из пути      
      * @method getFileName
    */
	getFileName: function() {
       var filename = this.$file.value;
	   if (filename.indexOf('\\') !== -1) {			
		 filename = filename.split('\\');			
		 filename = filename[filename.length-1];
	   }
	   if (filename.indexOf('/') !== -1) {
		 filename = filename.split('/');
		 filename = filename[filename.length-1];
	   }	   
	   return filename;
	},
		
	/**
      * Считать параметр картограммы из хранилища
      * @param {string} param - имя параметра
      * @method getSettings
    */	
	getSettings: function(param) {
		var key = GWTK.Util.appkey() + '_' + 'cartograms';
				
		var cartograms = JSON.parse(localStorage.getItem(key));
        if (!cartograms) return null;
				
		var filename = this.getFileName();
		if (!filename) return null;
		var index = this.getItemIndexById(cartograms, 'filename', filename);		
		if (index !== -1) {
			var cartogram = cartograms[index];
		    if (!param)	{
				return cartogram;
			}
			else {
				return cartogram[param];
			}
		}
		else {
		  return null;
		}		
	},
		
	/**
      * Сохранить параметры картограммы в хранилище
      *
      * @method saveSettings
    */	
	saveSettings: function() {		
		var key = GWTK.Util.appkey() + '_' + 'cartograms';
		
		var cartograms = JSON.parse(localStorage.getItem(key));
		var filename = this.getFileName();
		if (!filename) return false;
				
		var params = {
			filename: filename,
			delim: this.$delimfile.value,
			fieldnames: (this.$namefields.getAttribute('checked')?true:false),
			layer: this.$elemLayers.value,
			field: this.$elemFields.querySelectorAll('option')[this.$elemFields.selectedIndex].id,
			semantic: this.$elemSemantics.value,
			value: this.$elemValues.querySelectorAll('option')[this.$elemValues.selectedIndex].id,
			gradcount: this.$gradationCount.value,
			colors: []
		};
		
		if (this.viewgridgrad) {
			var records = this.viewgridgrad.records;			
			for (var i=0; i<records.length; i++) {
			  params.colors.push(records[i].val_color);
			}
		}
		
		if (!cartograms) {
			cartograms = [ params ];
		}
		else {		  
		  var index = this.getItemIndexById(cartograms, 'filename', filename);
		  if (index !== -1) {
			cartograms[index] = params;
		  }
		  else {
			cartograms.push(params);
		  }
		}				
		localStorage.setItem(key, JSON.stringify(cartograms));
	},
	
	/**
      * Построить тематическую карту
      *
      * @method buildUserThematic
    */
	buildUserThematic: function() {
				
		if (!this.dataFile) {
			w2alert(w2utils.lang('File is not loaded!'));
			return;
		}
		
		if (this.$elemFields.selectedIndex == -1) {
			w2alert(w2utils.lang('Table field is not selected!'));
			return;
		}
				
		if (this.$elemValues.selectedIndex == -1) {
			w2alert(w2utils.lang('Value field is not selected!'));
			return;
		}
				
		if (this.$elemSemantics.selectedIndex == -1) {
			w2alert(w2utils.lang('Semantic is not selected!'));
			return;
		}
				
		if (this.$elemLayers.selectedIndex == -1) {
		  w2alert(w2utils.lang('Layer is not selected!'));
		  return;
		}		
		var options = this.$elemLayers.querySelectorAll('option');
		var selectedIndex = this.$elemLayers.selectedIndex;				
		var layerId = options[selectedIndex].id;  			
		var layer = this.map.tiles.getLayerByxId(layerId);		
		var serverUrl = GWTK.Util.getServerUrl(layer.options.url);
		
		var delimIndex = this.getItemIndexById(this.$delimfile.querySelectorAll('option'), 'id', this.$delimfile.value);
		var fieldIndex = this.getItemIndexById(this.$elemFields.querySelectorAll('option'), 'id', this.$elemFields.querySelectorAll('option')[this.$elemFields.selectedIndex].getAttribute('id'));
		var valueIndex = this.getItemIndexById(this.$elemFields.querySelectorAll('option'), 'id', this.$elemValues.querySelectorAll('option')[this.$elemValues.selectedIndex].getAttribute('id'));
		var semKey = this.$elemSemantics.querySelectorAll('option')[this.$elemSemantics.selectedIndex].getAttribute('id');
		
		if (!this.viewgridgrad) {
			w2alert( w2utils.lang( 'Cartogram view is not defined') + '!' );
			return;
		}
		
		// Сохранить параметры карты
		this.saveSettings();
		
		var records = this.viewgridgrad.records,		
		    MINSEMANTICARRAY = [],
		    MAXSEMANTICARRAY = [],
			COLORARRAY = [];
		        		
		for (var i=0; i<records.length; i++) {			
			MINSEMANTICARRAY.push(records[i].val_from);			
			MAXSEMANTICARRAY.push(records[i].val_to);			
			var red = records[i].val_color.substr(0, 2),
		    green = records[i].val_color.substr(2, 2),
		    blue = records[i].val_color.substr(4, 2);
			COLORARRAY.push((blue + green + red));
		}
						
		var url =  serverUrl + '?RESTMETHOD=CreateThematicMapByFile';
		
		var rpclayer = {
		  "layerid": layer._idLayerXml(),		  
		  MINSEMANTICARRAY: MINSEMANTICARRAY,
		  MAXSEMANTICARRAY: MAXSEMANTICARRAY,
		  COLORARRAY: COLORARRAY,
		  NumberConnectField: fieldIndex,
		  NumberValueField: valueIndex,
		  FileDelimetr: delimIndex,
		  FileCodeType: 2, // UTF-8
		  SemanticKey: semKey,
		  FileData: 'CDATA' // служебный		  
		};
				
		var rpclayers = [rpclayer];
		var xtext = GWTK.Util.url2xmlRpcEx( url, "CREATETHEMATICMAPBYFILE", rpclayers );
		// добавить содержимое файла в параметр FileData
		var pos = xtext.indexOf('FileData');
		xtext = xtext.substr(0, pos + 22) + '<bit><![CDATA[' + this.dataFile.join(this.sep) + ']]></bit>' + xtext.substr(pos + 44);
						
		var _token = false;		
		if (layer.token) {
		  _token = this.map.getToken();
		}
		
        GWTK.Util.showWait();
		
		var setting = {
			crossDomain: true,
			processData: false, 
			type: "POST",
			data: '', 
			response: 'text/xml', dataType: 'xml'
		}

        setting.data = xtext;
        setting.url = url;
        if (_token) {
            setting.beforeSend = function(xhr) {
                xhr.setRequestHeader(GWTK.AUTH_TOKEN, _token);
            }
        }
        else{            
            if (this.map.authTypeExternal(serverUrl) || this.map.authTypeServer(serverUrl)){
                setting.xhrFields = { withCredentials: true };
            }
        }

        setting.success = this.parseResponse.bind(this);
		setting.error = this.parseError.bind(this);		
		
        $.ajax(setting);
				
	},
	
	/**
      * Разобрать ответ запроса создания картограммы
      * @param {Object} response ответ сервера
      * @method parseResponse
    */
	parseResponse: function (response) {	 
	   GWTK.Util.hideWait();  
	   var $tmlay = $(response.documentElement).find('NewLayer');
       if ($tmlay.length > 0) {
         var layerId = $tmlay.attr('ID');
         this.openThematicLayer(layerId);
		 this.getThematicLayerNumber();
		 this.$userthematic_name.val(w2utils.lang("Cartogram") + ' ' + this.number);		 
	   }
       else {
         var msg = 'GWTK.UserThematicControl. ' + w2utils.lang('Cartogram creation error');
         w2alert(msg);
		 console.log(msg);
	   }
	},

    /**
      * Обработка ошибки при выполнении запроса
      * @param {Object} response ответ сервера
      * @method parseResponse
    */
    parseError: function (response) {		
		GWTK.Util.hideWait();
		var msg = 'GWTK.UserThematicControl. ' + w2utils.lang('Cartogram creation error');
		w2alert(msg);
		console.log(msg);
	},

	
	/**
      * Получить порядковый номер нового слоя
      *	  
      * @method getMapNumber
    */
	getThematicLayerNumber: function() {
		if (!this.number) {
		  this.number = 1;	
		} else {
          this.number++;
		}			
		
		var node = this.map.getContentTreeNode( this.treeParentId );
			if (node) {
				this.number = node.nodes.length + 1;
			}

		return this.number;
	},
	
	/**
      * Открыть тематический слой и добавить в дерево
      *
	  * @param id {String} id слоя на сервисе
      * @method openThematicLayer
    */	
	openThematicLayer: function(id) {
			
		var serviceUrl = this.$elemLayers.querySelectorAll('option')[this.$elemLayers.selectedIndex].getAttribute('serviceUrl');		
		 url = serviceUrl +
               "?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png" + 
               "&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&LAYERS=" + encodeURIComponent(id);
		// открыть слой карты
		var lay = this.map.openLayer( {
            'id': GWTK.Util.createGUID(), 
            'url': url, 
				'alias': this.$userthematic_name.val(),
            'selectObject': 1
           } );
		   
		 if (lay) {
			// описать легенду слоя
			this.colorsForLegend = [];
			var records = this.viewgridgrad.records;
			for ( var i = 0; i < records.length; i++ ) {
			    this.colorsForLegend.push( {
                color: records[i].val_color,
				from: parseFloat(records[i].val_from),
				to: parseFloat(records[i].val_to),				  
                text: records[i].val_text                
                } );								
			}
            var legenditems = this.createLegend( lay.xId, this.colorsForLegend );
			// установить легенду слоя
			this.map.setUserLegend( lay, legenditems );
            
			// добавить в дерево состава данных
			//this.createTreeNodeParent();
			this.map.onLayerListChanged( {
				id: lay.xId,
				clickable: true,
				text: lay.alias,
				parentId: this.treeParentId
			} );
		 }
	},
	
	/**
      * Создать узел Тематические слои в дереве состава карты
      *
      * @method createTreeNodeParent
      * @returns {Boolean}, 'true` - узел создан
      */
    createTreeNodeParent: function() {
      if (!this.map) return;
		var root = this.map.getContentTreeNode( this.treeParentId );
		if ( !root ) {
			this.map.onLayerListChanged( {
				id: this.treeParentId,
				group: true,
				expanded: true,
				text: this.treeParentCaption,    
				nodes: []
			} );
		}
        return (root !== null);
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
    },
	          
    /**
     * Деструктор.
     * Освободить ресурсы, отключить обработчики событий.
     *
     * @method destroy
     */
    destroy: function () {
        $(this.map.eventPane).off('layerlistchanged.' + this.toolname);        
        this.$button.remove();
        this.$panel.remove();
    }

};
