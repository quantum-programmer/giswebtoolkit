/*************************************** Нефедьева О.А. 14/01/21 ****
 *************************************** Помозов Е.В    02/03/21 ****
 *************************************** Патейчук В.К.  20/05/20 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Компонент "Поиск по семантике"                *
 *                                                                  *
 *******************************************************************/

import MapObject from '~/mapobject/MapObject';

if ( window.GWTK ) {
    /**
     * Конструктор GWTK.searchSemControl
     * @param map - объект карты
     */
    GWTK.searchSemControl = function ( map ) {

        this.map = map;
        if (!this.map) {
            console.log("searchSemControl." + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.toolname = 'searchSem';
        this.pane = null;
        this.button = null;

        this.active = false;

        this.$pane = null;
        this.$closeImg = null;
        this.$button = null;

        this.gridDiv = null;
        this.gridName = 'gridSem' + GWTK.Util.randomInt( 30000, 60000 );
        this.$gridDiv = null;

        this.searchLayersDiv = null;
        this.$searchLayersDiv = null;

        this.searchTypeDiv = null;
        this.$searchTypeDiv = null;

        this.selectableLayers = []; //слои с выбором объектов

        this.sl = null; //выбранный слой
        this.st = null; //выбранный тип

        this.semantics = {};
        this.searchData = {};
        this.map.maptools.push( this );
        this.conditions = {
            is: '=',
            gt: '>=',
            lt: '<=',
            all: '*',
            less: '<',
            notis: '!=',
            great: '>'
        };

        this.init();
    };

    GWTK.searchSemControl.prototype = {
        /**
         * Инициализация компонента
         */
        init: function () {
            this.createButton();
            this.createPane();
            this.setResizable();
            this.setDraggable();
            this.createGrid();
            this.initEvents();
        },

        /**
         * Создание кнопки в панели инструметов
         */
        createButton: function () {
            /* создали и добавили кнопку в панель инструментов */
            this.button = GWTK.DomUtil.create( 'div', 'control-button control-button-searchSem clickable', this.map.panes.toolbarPane );
            this.button.id = 'panel_button_searchSem';
            this.button.title = w2utils.lang( 'Search by semantics' );
            this.$button = $(this.button);
        },

        /**
         * Создание панели компонента
         */
        createPane: function () {

            this.headerTable = document.createElement( 'table' );
            this.headerTable.id = 'sem-header-table-id';
            this.headerTable.className += 'sem-header-table-class';

            this.htTrLayer = document.createElement( 'tr' );
            this.htTrLayerTd1 = document.createElement( 'td' );
            this.htTrLayerTd2 = document.createElement( 'td' );
            this.htTrLayer.appendChild( this.htTrLayerTd1 );
            this.htTrLayer.appendChild( this.htTrLayerTd2 );

            this.htTrType = document.createElement( 'tr' );
            this.htTrTypeTd1 = document.createElement( 'td' );
            this.htTrTypeTd2 = document.createElement( 'td' );
            this.htTrType.appendChild( this.htTrTypeTd1 );
            this.htTrType.appendChild( this.htTrTypeTd2 );

			// сделали строку и добавили две колонки
			this.htTrLogic = document.createElement( 'tr' );
			this.htTrLogicTd1 = document.createElement( 'td' );
			this.htTrLogicTd2 = document.createElement( 'td' );
			this.htTrLogic.appendChild( this.htTrLogicTd1 );
			this.htTrLogic.appendChild( this.htTrLogicTd2 );

            this.headerTable.appendChild( this.htTrLayer );
            this.headerTable.appendChild( this.htTrType );
			this.headerTable.appendChild( this.htTrLogic );

            // если указана панель для компонентов, то создаем в ней
			if (this.map.options.controlspanel) {
                this.pane = GWTK.DomUtil.create( 'div', 'map-panel-def-flex map-searchsem-panel-flex', this.map.mapControls );
            }
            else {
                this.pane = GWTK.DomUtil.create( 'div', 'map-panel-def map-searchsem-panel', this.map.mapPaneOld );
            }
            this.pane.id = this.map.divID + '_searchSemPane';
            this.$pane = $(this.pane);

            // создать заголовок панели
            GWTK.Util.createHeaderForComponent({
                map: this.map,
                parent: this.pane,
                name: w2utils.lang("Search objects by semantics"),
                context:this.toolname,
                callback: function () { $('#panel_button_searchSem').click(); return; }
            });

            this.pane.appendChild( this.headerTable );

            /* Список слоев доступных для поиска */
            this.searchLayerCont = document.createElement( 'div' );
            this.searchLayerCont.className = 'search-sem-header';

            this.searchLayersDiv = document.createElement( 'input' );
            this.searchLayersDiv.id = 'search-layer-input';
            this.searchLayersDiv.type = 'text';
            this.$searchLayersDiv = $( this.searchLayersDiv );
            /* label layer */
            this.searchLayersDivLabel = document.createElement( 'label' );
            this.searchLayersDivLabel.innerHTML = w2utils.lang( 'Layer' );

            this.searchLayerCont.appendChild( this.searchLayersDiv );
            this.htTrLayerTd1.appendChild( this.searchLayersDivLabel );
            this.htTrLayerTd2.appendChild( this.searchLayerCont );

            /* Типы объектов */
            this.searchTypeCont = document.createElement( 'div' );
            this.searchTypeCont.className = 'search-sem-header';

            this.searchTypeDiv = document.createElement( 'input' );
            this.searchTypeDiv.id = 'search-type-input';
            this.searchTypeDiv.type = 'text';
            this.$searchTypeDiv = $( this.searchTypeDiv );
            this.searchTypeDivLabel = document.createElement( 'label' );
            this.searchTypeDivLabel.innerHTML = w2utils.lang( 'Objects type' );
            this.htTrTypeTd1.appendChild( this.searchTypeDivLabel );
            this.htTrTypeTd2.appendChild( this.searchTypeDiv );

			//Логический оператор
			this.logicalOperations = document.createElement( 'input' );
			this.logicalOperations.type = 'text';
			this.logicalOperations.id = 'search-logical-input';
			this.logicalOperationsLabel = document.createElement( 'label' );
			this.logicalOperationsLabel.innerHTML = w2utils.lang( 'Search conditions' );
			this.$logicalOperations = $(this.logicalOperations);

			this.htTrLogicTd1.appendChild(this.logicalOperationsLabel);
			this.htTrLogicTd2.appendChild(this.logicalOperations);

            /* Контейнер для таблицы */
            this.gridDiv = document.createElement( 'div' );
            this.gridDiv.id = 'gridSem';
            this.gridDiv.className = 'sem-search-grid-container';
            this.$gridDiv = $( this.gridDiv );
            this.pane.appendChild( this.gridDiv );

            /* Поле ввода gmlid объекта */
            var inputGmlId = document.createElement('input'),
                labelGmlId = document.createElement('label');

            $(labelGmlId).css({'float':'left','white-space':'nowrap'});
            labelGmlId.innerHTML = w2utils.lang('Object number');
            inputGmlId.type = 'text';
            this.$gmlIdButton = $(inputGmlId);
			this.$gmlIdButton.css({'width':'147px'});

            var gmltable = document.createElement('table');
            gmltable.id = 'table-objnumber';
            gmltable.className = 'search-sem-table-objnumber sem-gml-table-class';

            var gmlTr = document.createElement('tr'),
                gmlTd1 = document.createElement('td'),
                gmlTd2 = document.createElement('td'),
                gmlTd3 = document.createElement('td');
            gmlTd1.appendChild(labelGmlId);
            gmlTd2.appendChild(inputGmlId);
            $(gmlTd3).width('28%');
            $(gmlTd3).append('<label style="float:right;">'+w2utils.lang('Visible')+'</label>'+
                             '<input type="checkbox" style="float:right" title="'+w2utils.lang('Find visible only')+
                             '" name="onlyvisible"></input>');
            gmlTr.appendChild(gmlTd1);
            gmlTr.appendChild(gmlTd2);
            gmlTr.appendChild(gmlTd3);

            gmltable.appendChild(gmlTr);
            this.pane.appendChild(gmltable);

            /* контейнер кнопок Найти и Сбросить*/
            this.footerDiv = GWTK.DomUtil.create('div', 'footer-sem-search-class', this.pane);
            this.footerDiv.id = 'footerSemDiv';

            /* Кнопка сбросить */
            var buttonCancel = GWTK.DomUtil.create('button', 'btn', this.footerDiv);
            buttonCancel.innerHTML = w2utils.lang( 'Reset all' );
            this.$cancelButton = $(buttonCancel);

            /* Кнопка найти */
            var buttonSearch = GWTK.DomUtil.create('button', 'btn', this.footerDiv);
            buttonSearch.innerHTML = w2utils.lang( 'Find' );
            this.$searcButton = $(buttonSearch);

            this.pane.appendChild(this.footerDiv);
            this.$pane.hide();
        },

        /**
         * Инициализация обработчиков событий
         */
        initEvents: function () {
            var that = this;

            $(this.map.eventPane).on("featureinforefreshed.searchsem", function () {
				that.unlock();
			} );

			this.$searcButton.on( 'click.searchsem', function (  ) {
                that.sendSearchData( that.getSearchDataFromGrid() );
            } );
            this.$cancelButton.on( 'click.searchsem', function ( e ) {
                that.resetAll();
            } );
            this.$button.on( 'click.searchsem', function () {
                $(this).toggleClass( 'control-button-active' );
                that.setSelectableLayers();
                w2ui[that.gridName].refresh();
                that.active = !that.active;
                if ( !that.active ) {
                    $( that.map.eventPane ).off( 'dataloadstatus.searchsem' );
                    $( that.map.eventPane ).off( 'layerlistchanged.searchsem' );
                    $(that.map.eventPane).off('visibilitychanged.searchsem');
                    that.$pane.hide('slow');
                }
                else {
                    that.$pane.show();
                    // развернуть общую панель для компонентов (если используется)
					that.map.showControlsPanel();
                    $( that.map.eventPane ).on( 'dataloadstatus.searchsem', function ( e ) {
                        that.unlock();
                    } );
                    $( that.map.eventPane ).on( 'layerlistchanged.searchsem', function ( e ) {
                        that.layersWasChanged( e );
                    } );
                    $( that.map.eventPane ).on( 'visibilitychanged.searchsem', function ( e ) {
                        that.layersWasChanged( e );
                    } );
                    setTimeout(function(){
                        $('#sem-header-table-id').find('.arrow-down').css('margin-top','3px');
                    }, 50);
                }
            } );
            this.$searchTypeDiv.on( 'change.searchsem', function ( e ) {
                that.typeWasChanged( e );
            } );
            this.$searchLayersDiv.on( 'change.searchsem', function ( e ) {
                that.layerWasChanged( e );
            } );

            this.parseResponse = GWTK.Util.bind(this.parseResponse, this);
            /*$( this.map.eventPane ).on( 'dataloadstatus.searchsem', function ( e ) {
             that.unlock();
             } );
             $( this.map.eventPane ).on( 'layerlistchanged.searchsem', function ( e ) {

             } );
             $( this.map.eventPane ).on( 'visibilitychanged.searchsem', function ( e ) {
             that.layersWasChanged( e );
             } )*/

            // обработка изменений размера панели контролов
			$(this.map.eventPane).on('resizecontrolspanel.' + this.toolname, function (event) {
				// изменить размеры своей панели
				this.resize();
			}.bind(this));

        },

        /**
         * Обработчик событий visibilitychanged и layerlistchanged
         *
         * @param e объект события visibilitychanged или layerlistchanged
         */
        layersWasChanged: function ( e ) {

            if ( e.type == 'visibilitychanged' ) {
                if ( e.maplayer.visible ) {
                    //если включили слой добавляем его в список доступных к выбору
                    var layer = this.map.tiles.getLayerByxId( e.maplayer.id );
                    if ( layer ) {
                        this.$searchLayersDiv.data( 'w2field' ).options.items.push( {
                            id: layer.xId,
                            text: layer.alias
                        } );
                    }
                } else {
                    //если выключили удаляем из списка доступных для выыбора
                    var selLayer = this.$searchLayersDiv.data( 'selected' );
                    if ( selLayer.id == e.maplayer.id ) {
                        this.resetAll();
                    } else {
                        var items = this.$searchLayersDiv.data( 'w2field' ).options.items;
                        for ( var i = 0; i < items.length; i++ ) {
                            if ( items[ i ].id == e.maplayer.id ) {
                                this.$searchLayersDiv.data( 'w2field' ).options.items.splice( i, 1 );
                            }
                        }
                    }
                }
            }
            if ( e.type == 'layerlistchanged' ) {
                if ( e.maplayer.act == 'add' ) {
					layer = this.map.tiles.getLayerByxId( e.maplayer.id );
                    if ( layer ) {
                        this.$searchLayersDiv.data( 'w2field' ).options.items.push( {
                            id: layer.xId,
                            text: layer.alias
                        } );
                    }
                }
                if ( e.maplayer.act == 'remove' ) {
					selLayer = this.$searchLayersDiv.data( 'selected' );
                    if ( selLayer.id == e.maplayer.id ) {
                        this.resetAll();
                    } else {
                        var items = this.$searchLayersDiv.data( 'w2field' ).options.items;
                        for ( var i = 0; i < items.length; i++ ) {
                            if ( items[ i ].id == e.maplayer.id ) {
                                this.$searchLayersDiv.data( 'w2field' ).options.items.splice( i, 1 );
                            }
                        }
                    }
                }
            }
        },

        /**
         * Сбросить все настройки компонента
         */
        resetAll: function () {
            this.sl = null;
            this.st = null;
            w2ui[ this.gridName ].clear();
            this.setSelectableLayers(true);
        },

        /**
         * Разблокировать UI компонента
         */
        unlock: function () {
            this.$gmlIdButton.attr( 'disabled', false );
            this.$searchTypeDiv.attr( 'disabled', false );
            this.$searchLayersDiv.attr( 'disabled', false );
            this.$cancelButton.attr( 'disabled', false );
            this.$searcButton.attr( 'disabled', false );
            w2ui[ this.gridName ].unlock();
        },

        /**
         * Заблокировать UI компонента
         */
        lock: function () {
            this.$gmlIdButton.attr( 'disabled', true );
            this.$searchTypeDiv.attr( 'disabled', true );
            this.$searchLayersDiv.attr( 'disabled', true );
            this.$cancelButton.attr( 'disabled', true );
            this.$searcButton.attr( 'disabled', true );
            w2ui[ this.gridName ].lock('',true);
        },

        /**
         * Получить данные для поиска
         *
         * @returns {*}
         */
        getSearchDataFromGrid: function () {

            var number = this.$gmlIdButton.val();
            if (number && number.length > 0) {
                return '';
            }

            if (w2ui[this.gridName].records.length == 0) {
                w2alert(w2utils.lang('Table semantics is empty!') + '<br>' + w2utils.lang('First select layer and objects type!'));
                return false;
            }
            var hasData = false;
            this.searchData = {};
            this.searchData[ this.sl.id ] = {};
            this.searchData[ this.sl.id ][ this.st.id ] = {};

            for (var i = 0; i < w2ui[this.gridName].records.length; i++) {
                if ($('#sem_val_' + i + ':focus').length == 1) {
                    $('#sem_val_' + i).blur();
                }
                if (w2ui[this.gridName].records[i]['gwtk']['cond']['id'] && w2ui[this.gridName].records[i]['gwtk']['cond']['id'] !== 'all' && !w2ui[this.gridName].records[i]['gwtk']['val']['id']) {
                    w2ui[this.gridName].select(i);
                    w2ui[this.gridName].scrollIntoView(i + 3);
                    w2alert(w2utils.lang('Select value'));
                    this.searchData = false;
                    break;
                }
                if (!w2ui[this.gridName].records[i]['gwtk']['cond']['id'] && w2ui[this.gridName].records[i]['gwtk']['val']['id']) {
                    w2ui[this.gridName].select(i);
                    w2ui[this.gridName].scrollIntoView(i + 3);
                    w2alert(w2utils.lang('Select condition'));
                    this.searchData = false;
                    break;
                }
                if ( (w2ui[ this.gridName ].records[ i ][ 'gwtk' ][ 'cond' ][ 'id' ] && w2ui[ this.gridName ].records[ i ][ 'gwtk' ][ 'val' ][ 'id' ]) || w2ui[ this.gridName ].records[ i ][ 'gwtk' ][ 'cond' ][ 'id' ] == 'all' ) {
                    hasData = true;
                    this.searchData[ this.sl.id ][ this.st.id ][ this.semantics[ this.sl.id ][ 'types' ][ this.st.id ][ 'rscsemantic' ][ i ][ 'shortname' ] ] = {};
                    this.searchData[ this.sl.id ][ this.st.id ][ this.semantics[ this.sl.id ][ 'types' ][ this.st.id ][ 'rscsemantic' ][ i ][ 'shortname' ] ][ 'type' ] = {};
                    this.searchData[ this.sl.id ][ this.st.id ][ this.semantics[ this.sl.id ][ 'types' ][ this.st.id ][ 'rscsemantic' ][ i ][ 'shortname' ] ][ 'value' ] = {};
                    //this.searchData[this.sl.id][this.st.id][this.semantics[this.sl.id]['types'][this.st.id]['rscsemantic'][i]['shortname']]['value'] = w2ui[this.gridName].records[i]['gwtk']['val'];
                    var rec_value = $.extend({}, w2ui[this.gridName].records[i]['gwtk']['val']);
                    rec_value.text = GWTK.fixedEncodeURI(rec_value.text);
                    this.searchData[this.sl.id][this.st.id][this.semantics[this.sl.id]['types'][this.st.id]['rscsemantic'][i]['shortname']]['value'] = rec_value;
                    this.searchData[ this.sl.id ][ this.st.id ][ this.semantics[ this.sl.id ][ 'types' ][ this.st.id ][ 'rscsemantic' ][ i ][ 'shortname' ] ][ 'type' ] = w2ui[ this.gridName ].records[ i ][ 'gwtk' ][ 'cond' ];

                }
            }

            return hasData ? this.searchData : hasData;
        },

        /**
         * Отправить запрос для поиска
         *
         * @param data - результать работы функции getSearchDataFromGrid()
         * @returns {boolean}
         */
        sendSearchData: function ( data ) {

	        var gmlid = this.$gmlIdButton.val();

			var layer;
			if ( !this.wfs ) {
				this.wfs = new GWTK.WfsRestRequests( this.map );
			}

	        if ( gmlid.replace( /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '' ) != '' ) {
		        if ( this.sl && this.sl.id ) {
			        var layer = this.map.tiles.getLayerByxId( this.sl.id );
			        var layerSheets = layer ? layer.mapSheets.sheets : [];
			        var sheets = [];
			        for ( var i = 0; i < layerSheets.length; i++ ) {
				        sheets[ i ] = layerSheets[ i ] + '.' + gmlid;
			        }
					var xmlByNumber = this.prepareDataForSearchByNumber( layer.idLayer, sheets );
					this.map.handlers.clearselect_button_click();
                    this.map.searchManager.responseMapObjectCount = 0;
                    this.map.searchManager.mapObjects.splice(0);
					this.wfs.restMethod( xmlByNumber.text.restmethod, xmlByNumber.url, '', this.parseResponse );                   // 16/02/17
		        }
		        else {
			        w2alert( w2utils.lang( "Select layer" ) );
		        }
		        return;
	        }
	        //else {
            if ( !data || !this.sl.id || !this.st.id ) {
              if ($('#w2ui-popup').length == 0)
                w2alert( w2utils.lang( "Select data" ) );
              this.unlock();
              return false;
            }

            var layer = this.map.tiles.getLayerByxId(this.sl.id),
                url = GWTK.Util.getServerUrl(layer.options.url);
            if (!url) { return;}
            var viewfilter = this.getSearchForVisible();
            this.lock();

            if (this.wfs && gmlid == '') {
               for ( var key in data ) {
				 if ( data.hasOwnProperty( key ) ) {
				     var rpclayers = [],
                         obj_types = Object.keys(data[this.sl.id]),
                     semantics = [],
                     operations = [],
                     values = [],
                     operand = 'or';
                    for ( var i = 0; i < obj_types.length; i++ ) {
                       for ( var k in data[ this.sl.id ][ this.st.id ] ) {
                         if ( data[ this.sl.id ][ this.st.id ].hasOwnProperty( k ) ) {
                             if (data[ this.sl.id ][ this.st.id ][ k ][ 'value' ][ 'text' ] == '') {
 				                w2alert(w2utils.lang('Error in search value format!'));
				                this.unlock();
				                return false;
				             }
                             if ( data[ this.sl.id ][ this.st.id ][ k ][ 'type' ][ 'id' ] == 'all' ) {
                                 data[ this.sl.id ][ this.st.id ][ k ][ 'value' ][ 'id' ] = '';
                                 data[ this.sl.id ][ this.st.id ][ k ][ 'value' ][ 'text' ] = '';
                             }
                             semantics.push( k );
                             operations.push( data[ this.sl.id ][ this.st.id ][ k ][ 'type' ][ 'text' ] );
                             values.push( 'val=' + data[ this.sl.id ][ this.st.id ][ k ][ 'value' ][ 'text' ] );
                         }
                       }
					}
					for (var kk = 0; kk < values.length; kk++) {
						values[kk] = values[kk].replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
					}
					var inputLogic = this.$logicalOperations.data();
					var operLogic = inputLogic.selected.id ? inputLogic.selected.id : 'OR';
					values = values.join( '' );

					for (var i=0; i<operations.length; i++) {
						switch (operations[i]) {
                        case '<':
							operations[i] = 'CMLESS';
						break;
						case '<=':
							operations[i] = 'CMLESSEQ';
						break;
						case '>':
							operations[i] = 'CMMORE';
						break;
						case '>=':
							operations[i] = 'CMMOREEQ';
						break;
						}
					}

					var textfilter = '(' + '(' + semantics.join( ',' ) + ')' + '(' + operations.join( ',' ) + ')' + '(' + values + ')' + '(' + operLogic.toUpperCase() + ')';

                    if ( obj_types.length > 1 ) {
                        textfilter += '(' + operand + ')';
                    }
                    textfilter += ')';
					var rpclayer = {
						"layerid": layer._idLayerXml(),                // 10/07/19
						"semanticname": 1,
                        "outtype": 'json',
						"textfilter": textfilter
					};

                    if (layer.typeNames)
                        rpclayer.typenames = layer.typeNames;
                    if (layer.codeList)
                        rpclayer.codelist = layer.codeList;
                    if (viewfilter && layer.getKeyListParamString){
                        // фильтр объектов
                        var objkeys = layer.getKeyListParamString();
                        if (objkeys.hasOwnProperty('keylist') && objkeys['keylist'])
                            rpclayer["keylist"] = objkeys['keylist'];
                        var scale = this.map.getZoomScale(this.map.getZoom());
                        if (scale) {
                            rpclayer.objectviewscale = scale.toFixed(0);
                        }
                    }
                    rpclayers.push( rpclayer );
                    }
				}
               var xml = this.prepareDataForTextSearch(rpclayers),
                   _token = false;
				this.map.handlers.clearselect_button_click();
				if (layer.token) {
				    _token = this.map.getToken();
				}
				this.map.searchManager.responseMapObjectCount = 0;
                this.map.searchManager.mapObjects.splice(0);

                this.wfs.postRequestMulti( [{
				    url: url + '?&SERVICE=WFS&RESTMETHOD=TEXTSEARCH',
                    token:_token,
					text: xml.text}],
                    this.parseResponse );

            }
        },

        /**
          * Анализ ответа операции поиска (callback-функция)
          *
          * @param response {Array} данные ответов серверов слоев карты
          * @param context {Object} контекст запроса
         */
        parseResponse: function (response, context) {

            this.map.searchManager.responseMapObjectCount = 0;
            this.map.searchManager.mapObjects.splice(0);
            this.map.clearActiveObject();
            this.map.clearSelectedObjects();
            this.unlock();

            if (!response || response.length == 0) {
                return;
            }
            var result = {}, data = '';
            try {
                Array.isArray(response) ? data = response[ 0 ] : data = response;
                result = JSON.parse( data );
            } catch (e) {
                w2alert(w2utils.lang("Nothing found. Refine your search."), w2utils.lang("Search by semantics"));
                return;
            }

            if (!result.type || result.type !== 'FeatureCollection' || !result.features) {
                console.log( w2utils.lang('Search objects by semantics'), w2utils.lang("Failed to get data") );
                return;
            }
            var features = result.features;
            var mapObject;
            for (var i = 0; i < features.length; i++) {
                var layerId = features[i].properties.mapid;
                var layer = this.map.tiles.getLayerByIdService( layerId );
                if (layer) {
                    var mapobject = new MapObject( layer, features[i].geometry.type );
                    mapobject.fromJSON( features[i] );
                    this.map.searchManager.mapObjects.push( mapobject );
                    if (!mapObject) {
                        mapObject = mapobject;
                    }
                }
            }
            if ( mapObject ) {
                this.map.setActiveObject( mapObject );
                this.map.searchManager.responseMapObjectCount = this.map.searchManager.mapObjects.length;
                this.map.getTaskManager().showObjectPanel();
            } else {
                w2alert(w2utils.lang("Nothing found. Refine your search."), w2utils.lang("Search by semantics"));
            }
        },

 		/**
 		 * @param  {} idLayer
 		 * @param  {} ids
 		 */
 		prepareDataForSearchByNumber: function ( idLayer, ids ) {
			var idfeature = [];
			var idLayers = [];
			if ( !ids || !idLayer ) return false;
			if ( GWTK.Util.isArray( ids ) )
				idfeature = ids.toString();
			else idfeature = ids;
			if ( GWTK.Util.isArray( idLayer ) ) {
				idLayers = idLayer.toString();
			} else {
				idLayers = idLayer;
			}

			var param = { "startindex": 0, "idlist": "", "layer_id": "" };
			param.layer_id = idLayers;
			param.idlist = idfeature;
			param.mapid = idLayers;
			param.ObjCenter = 2;
			for ( var key in param ) {
				if ( key.toLowerCase() == "result" ) {
					param.RESULTTYPE = param[ key ];
					param[ key ] = null;
					if ( param.RESULTTYPE == 0 ) param.RESULTTYPE = "hits";
					else param.RESULTTYPE = "results";
				}
			}

			param.SERVICE = 'WFS';
			param.restmethod = 'GetFeature';
			param.MapID = 1;

			param.SEMANTIC = 1;
			param.SEMANTICNAME = 1;
            param.OUTTYPE = 'JSON';

			if ( this.map.options.measurement.show ) {
				param.AREA = 1;
			}
			return { text: param, url: "?" + GWTK.Util.urlParamString( param ) };
        },

		/**
		 * Подготовка данных для запроса TEXTSEARCH
		 * @param rpclayers {Object} - объект
		 * @returns {*}
		 */
		prepareDataForTextSearch: function ( rpclayers ) {
			if ( !rpclayers || !$.isArray( rpclayers ) ) {
				console.log( "ERROR:   WfsQueries.textsearchex input parameters error." );
				return false;
			}
			var index = 0;
			var url = "?OBJCENTER=2&OBJLOCAL=0,1,2,4&MapId=1&semantic=1&semanticname=1&getframe=1&START_INDEX=" + index;
			if ( this.map.options.measurement.show ) {
				url += '&AREA=1'
			}
			var xtext = GWTK.Util.url2xmlRpcEx( url, "TEXTSEARCH", rpclayers );
			return { text: xtext, url: url };
		},

        /**
         * Обработчик изменения условий поиска
         * @param e - объект события
         * @param input - текстовое значение. если есть и равно "input" - то изменения были внесены в текстовое поле
         */
        onChangeFunction: function ( e, input ) {
            var idArr = e.id.split( '_' );                                          // [ 0 ] - prefix | [ 1 ] - column | [ 2 ] - id record in grid

            var gridRec = w2ui[ this.gridName ].get( idArr[ 2 ] );                  // getting record from grid
            //убрать селект так как this это либо инпут либо список селект главный
            var select = document.getElementById( e.id );                           // getting html select with option child
            var copyValue = e.value;
            if ( input && input == 'input' ) {
                if ( copyValue.replace(/[ ]+/ig, '') == '' ) {
                    gridRec[ 'gwtk' ][ idArr[ 1 ] ][ 'id' ] = null;
                    gridRec[ 'gwtk' ][ idArr[ 1 ] ][ 'text' ] = null;
                } else {
                      var value = e.value;
					var datatype = $(e).attr('datatype');
					if (datatype == 'date') {
                      if (!/(0[1-9]|[12][0-9]|3[01])[/]?(0[1-9]|1[012])[/]?(19|20)\d\d/.test(value)) {
						// ошибка
						value = '';
						$(e).addClass('w2ui-error');
					  }
					  else {
						$(e).removeClass('w2ui-error');
						// сформировать корректную дату
						var parts = $(e).val().split('/')
						if (parts.length == 1) {
						  // без разделителей
						  value = $(e).val().substr(4) + $(e).val().substr(2, 2) + $(e).val().substr(0, 2);
						  $(e).val($(e).val().substr(0, 2) + '/' + $(e).val().substr(2, 2) + '/' + $(e).val().substr(4));
						}
						else {
						  value = parts[2] + parts[1] + parts[0];
						}
					  }
					}
                    gridRec[ 'gwtk' ][ idArr[ 1 ] ][ 'id' ] = idArr[ 2 ];
                    gridRec[ 'gwtk' ][ idArr[ 1 ] ][ 'text' ] = value;
                }

            } else {
                if ( e.value == 'default' ) {
                    gridRec[ 'gwtk' ][ idArr[ 1 ] ][ 'id' ] = null;
                    gridRec[ 'gwtk' ][ idArr[ 1 ] ][ 'text' ] = null;
                } else {
                    for ( var i = 0; i < select.length; i++ ) {
                        if ( select[ i ].value == e.value ) {                               // setting selected attribute
                            gridRec[ 'gwtk' ][ idArr[ 1 ] ][ 'id' ] = e.value;
                            if ( idArr[ 1 ] == 'cond' ) {
                                gridRec[ 'gwtk' ][ idArr[ 1 ] ][ 'text' ] = this.conditions[ e.value ];
                            } else {
                                gridRec[ 'gwtk' ][ idArr[ 1 ] ][ 'text' ] = select[ i ].innerHTML;
                            }
                            select[ i ].selected = true;
                            select[ i ].setAttribute( 'selected', '' );
                        } else {                                                            // remove selected attribute from another option
                            select[ i ].selected = false;
                            select[ i ].removeAttribute( 'selected' );
                        }
                    }
                }
            }

            // idArr[ 1 ] == 'val' && !input ? gridRec[ 'sval' ] = select.outerHTML : gridRec[ 'scond' ] = select.outerHTML;                                  // update text in w2ui record

            if ( idArr[ 1 ] == 'val' && !input ) {
                gridRec[ 'sval' ] = select.outerHTML;
            }
            if ( idArr[ 1 ] == 'val' && input == 'input' && e.value != '' ) {
                var att = document.createAttribute( "value" );       // Create a "class" attribute
                att.value = e.value;
                select.setAttributeNode( att );
                gridRec[ 'sval' ] = select.outerHTML
            }
            if ( idArr[ 1 ] == 'codnd' ) {
                if ( e.value == 'default' ) {
                    for ( var k = 0; k < select.length; k++ ) {
                        if ( select[ k ].value == e.value ) {
                            gridRec[ 'gwtk' ][ idArr[ 1 ] ][ 'id' ] = null;
                            gridRec[ 'gwtk' ][ idArr[ 1 ] ][ 'text' ] = null;

                            select[ k ].selected = true;
                            select[ k ].setAttribute( 'selected', '' );
                        } else {
                            select[ k ].selected = false;
                            select[ k ].removeAttribute( 'selected' );
                        }
                    }
                    gridRec[ 'scond' ] = select.outerHTML;
                } else {
                    gridRec[ 'scond' ] = select.outerHTML;
                }
            }

            // w2ui[ this.gridName ].refreshRow( idArr[ 2 ] );                         // refresh only row
        },
        /**
         * Сформировать html строку для вставки в таблицу
         * @param id - идентификатор
         * @param array - массив объектов { value:value, text: text }
         * @returns {{html: string}}
         */
        getHtmlValue: function ( id, array ) {
            if ( array && array.length > 0 ) {
			    var defVal = { value: 'default', text: w2utils.lang( 'Value' ), name: w2utils.lang( 'Value' ) };
				if (array.indexOf(defVal) == -1)
                    array.unshift(defVal);
                return {
                    html: '<select onchange="w2ui[\'' + this.gridName + '\'].map.mapTool(\'searchSem\').onChangeFunction( this );" class="search-sem-select" id="sem_val_' + id + '">' + '<option ' + array.map( function ( element ) {
						var sel = element.value === true ? ' selected ' : '';
                        return sel + 'id="option_' + element.value + '" value="' + element.value + '">' + element.name;
                    } ).join( '</option><option ' ) + '</select>'
                }
            } else {
                return { html: '' }
            }

        },
        /**
         * Сформировать html с возможными условиями
         * @param id - идентификатор
         * @returns {{html: string}}
         */
        getHtmlCondition: function ( id ) {
            return {
                html: '<select onchange="w2ui[\'' + this.gridName + '\'].map.mapTool(\'searchSem\').onChangeFunction( this );" class="search-sem-select" id="sem_cond_' + id + '" >' +
                '    <option selected value="default">' + w2utils.lang( 'Condition' ) + '</option>' +
                '    <option value="is" >' + '=' + '</option>' +
                '    <option value="notis" >' + '!=' + '</option>' +
                '    <option value="less" >' + '<' + '</option>' +
                '    <option value="lt" >' + '<=' + '</option>' +
                '    <option value="great" >' + '>' + '</option>' +
                '    <option value="gt" >' + '>=' + '</option>' +
                '    <option value="all" >' + '*' + '</option>' +
                '</select>'
            }
        },
        /**
         * Сформировать список слоев
         */
        setSelectableLayers: function (reset) {
            var option = [], layer, that = this;
            this.selectableLayers = this.map.tiles.getSelectableLayers().split( ',' ); //getting selectable layers
            for ( var i = 0; i < this.selectableLayers.length; i++ ) {
                layer = this.map.tiles.getLayerByIdService(this.selectableLayers[i]);
                if ( layer ) {
                    option.push( { id: layer.xId, text: layer.alias } ); //pushing list items object
                }
            }

            // var selectedLayer = this.$searchLayersDiv.data( 'selected' );
	        var inputData = this.$searchLayersDiv.data();
	        if( !inputData.selected || !inputData.selected.id || reset){
            this.$searchLayersDiv.w2field( 'list', {
                items: option, /*selected: selectedLayer,*/
                placeholder: w2utils.lang( 'Select layer' ),
                renderDrop: function ( item, options ) {
                    options.index = GWTK.dropListSelected(that.$searchLayersDiv, this.items);
                    return '<span title="' + item.text + '" style="display:block;width:' + (that.$searchLayersDiv.width() - 10) + 'px;overflow:hidden;">' + item.text + '</span>';
                }
            } );
	        }
	        var inputDataType = this.$searchLayersDiv.data();
	        if( !inputDataType.selected || !inputDataType.selected.id || reset) {
            this.searchTypeDiv.disabled = true;
            this.$searchTypeDiv.w2field( 'list', {
                items: [], /*selected: selectedType,*/
                placeholder: w2utils.lang( 'Select type' ),
                renderDrop: function ( item, options ) {
                    options.index = GWTK.dropListSelected(that.$searchTypeDiv, this.items);
                    return '<span title="' + item.text + '" style="display:block;width:' + (that.$searchTypeDiv.width() - 10) + 'px;overflow:hidden;">' + item.text + '</span>';
                }
            } );
	        }
			var inputLogic = this.$logicalOperations.data();
			if ( !inputLogic.selected || !inputLogic.selected.id || reset ) {
				this.$logicalOperations.w2field( 'list', {
					selected: { id: 'or', text: w2utils.lang( 'At least one' ) },
					items: [ { id: 'or', text: w2utils.lang( 'At least one' ) }, {
						id: 'and',
						text: w2utils.lang( 'All' )
					} ],
					placeholder: w2utils.lang( 'Search conditions' ),
					renderDrop: function ( item, options ) {
					    options.index = GWTK.dropListSelected(that.$logicalOperations, this.items);
						return '<span title="' + item.text + '" style="display: block; width:' + (that.$logicalOperations.width() - 10) + 'px;overflow:hidden;">' + item.text + '</span>';
					}
				} );
			}
        },

        /**
         * Заполнить таблицу компонента
         */
        fillSemanticGrid: function () {
            w2ui[this.gridName].clear();

            for ( var i = 0; i < this.semantics[ this.sl.id ][ 'types' ][ this.st.id ][ 'rscsemantic' ].length; i++ ) {
                var type = this.semantics[ this.sl.id ][ 'types' ][ this.st.id ][ 'rscsemantic' ][ i ][ 'type' ];
				if (type == 16) {
					// список
                    var test = this.semantics_ref[ this.sl.id ][ this.semantics[ this.sl.id ][ 'types' ][ this.st.id ][ 'rscsemantic' ][ i ][ 'shortname' ] ];
                    w2ui[ this.gridName ].records.push( {
                        recid: i,
                        sname: this.semantics[ this.sl.id ][ 'types' ][ this.st.id ][ 'rscsemantic' ][ i ][ 'name' ],
                        scond: this.getHtmlCondition( i ).html,
                        sval: this.getHtmlValue( i, test ).html,
                        gwtk: { cond: { id: null, text: null }, val: { id: null, text: null } }
                    } );
                } else {
                    /* текстовое поле для ввода */
                    var datatype = 'text';
                    if (type == 17) {
			datatype = 'date';
                    }
                    var sval = '<input onkeydown="event.stopPropagation();w2ui[\'' + this.gridName + '\'].map.mapTool(\'searchSem\').onEnter( this, event );" onchange="w2ui[\'' + this.gridName + '\'].map.mapTool(\'searchSem\').onChangeFunction( this, \'input\' );"  class="search-sem-select" type="text" id="sem_val_' + i + '" datatype="' + datatype + '"' + (datatype=='date'?' title="' + w2utils.lang('Date format: dd/mm/yyyy') + '"':'') + '>';
                    w2ui[ this.gridName ].records.push( {
                        recid: i,
                        sname: this.semantics[ this.sl.id ][ 'types' ][ this.st.id ][ 'rscsemantic' ][ i ][ 'name' ],
                        scond: this.getHtmlCondition( i ).html,
                        sval: sval,
                        gwtk: { cond: { id: null, text: null }, val: { id: null, text: null } }
                    } );
                }
            }
			w2ui[ this.gridName ].refresh();
        },

        /**
         * Обработчик нажатия клавиши ентер
         *
	     * @param obj - поле ввода
         * @param e - код клавиши
         */
        onEnter: function ( obj, e ) {
			var datatype = $(obj).attr('datatype');
			if (datatype == 'date') {
			  if (e.keyCode == 8) return;
              if ([35, 36, 37, 38, 39, 40, 46].indexOf(e.keyCode) !== -1) return;
			  var maxLen = 8;
			  var first = $(obj).val().indexOf('/');
			  var last = $(obj).val().lastIndexOf('/');
			  if (first !== -1 && first !== last) {
				maxLen = 10;
			  }
			  if ($(obj).val().length == maxLen) e.preventDefault();
			  var valid;
			  if ($(obj).val() == '') {
				valid=/['0-9']/; if(!valid.test(e.key)) e.preventDefault();
			  }
			  else {
				valid=/['0-9','\/']/; if(!valid.test(e.key)) e.preventDefault();
			  }
			  if (!($(obj).val().length == 2 || $(obj).val().length == 5) && e.key == '/') e.preventDefault();
			}
			if ( e.keyCode == 13 ) {
                this.$searcButton.click();
            }
        },

        /* изменили тип */
        /**
         * Обработчик изменения типа объектов
         * @param e - объект события onchange
         */
        typeWasChanged: function (e) {

            // console.time('typeWasChanged');
            this.st = this.$searchTypeDiv.data( 'selected' );
            var types = this.semantics[this.sl.id]['types'][this.st.id];
            this.semantics_ref = {};
            this.semantics_ref[ this.sl.id ] = {};
            var layer = this.map.tiles.getLayerByxId(this.sl.id);
            if (layer && layer.classifier){
				layer.classifier.getclassifiersematiclist(
                    GWTK.Util.bind(function(classifiersematiclist, status ){
                        if (status == 'success'){
                            for (var i = 0; i < classifiersematiclist.length; i++) {
                                this.semantics_ref[this.sl.id][classifiersematiclist[i]['key']] = classifiersematiclist[i]['reference'];
                            }
                            this.fillSemanticGrid();
                        }
                        else {
                            console.log(w2utils.lang('Error when executing query') + ': GetSemanticWithList!');
                        }
                    }, this));
            }
        },

        /**
         * Обработчик изменения слоя
         * @param e - объект события onchange
         */
        layerWasChanged: function ( e ) {
            // console.time('GetLayerSemanticList');
            this.sl = this.$searchLayersDiv.data( 'selected' );
            w2ui[ this.gridName ].clear();
			if (this.semantics[this.sl.id]) {
			  this.updateTypeList();
              return;
			}
            var layer = this.map.tiles.getLayerByxId( this.sl.id );
			if (!layer) return;

			var server = GWTK.Util.getServerUrl(layer.options.url);
			this.queryEdit = new EditQueries(server, this.map);
            this.queryEdit.onDataLoad = GWTK.Util.bind(function(response, context, textStatus){
                if (!response) return;
                response = response.replace(/\r|\n/g, '');
                var rest = (this.queryEdit && this.queryEdit.options && this.queryEdit.options.RESTMETHOD) ? this.queryEdit.options.RESTMETHOD : null;
                if (response.indexOf('ExceptionReport') != -1) {
                  console.log(response);
				  this.$searchTypeDiv.w2field('list', {placeholder: w2utils.lang('error...')});
                  return;
                }
                try {
                  var obj = JSON.parse(response),  restcode = obj.restcode,
                      message = "Ошибка чтения данных, метод " + rest + ": " + obj.message;

                  if (restcode != 1) {
                    console.log(message);
					this.$searchTypeDiv.w2field('list', {placeholder: w2utils.lang('error...')});
					return;
                  }
				  this.parseSemanticList(obj.features);
				}
                catch (e)
                {
				  console.log(this.toolname + ': ' + e.name + ': ' + e.message);
                  this.$searchTypeDiv.w2field('list', {placeholder: w2utils.lang('error...')});
                }
                finally {
				  this.queryEdit = null;
				}
            }, this);

            var options = { "RESTMETHOD": "GetLayerSemanticList", "LAYER": layer.idLayer, "INMAP": 1 };
            if ( layer.wms ) {
                if ( layer.codeList !== false ) {
                    options.codelist = layer.codeList;
                }
                if ( layer.typeNames !== false ) {
                    options.typeNames = layer.typeNames;
                }
            }
            this.queryEdit.sendRequest(options, false);
        },

        /* получили сематики слоя */
        /**
         * Разобрать полученные данные от сервера
         * @param features - список семантик слоя
         */
        parseSemanticList: function ( features ) {
            //this.semantics[ this.sl.id ] = data;
            this.semantics[ this.sl.id ] = {};
            this.semantics[ this.sl.id ][ 'types' ] = {};
            var semanticsFound = false;
            for ( var i = 0; i < features.length; i++ ) {
                if ( features[ i ][ 'rscsemantic' ].length > 0 ) {
                    this.semantics[ this.sl.id ][ 'types' ][ features[ i ][ 'name' ] ] = features[ i ];
                    semanticsFound = true;
                }
            }
            if (!semanticsFound) {
                console.log('Error! Layer: ' + this.sl.text + ' ' + 'semantics not found!');
            }
            this.updateTypeList();
        },

        /**
         * Обновить список типов объектов
         */
        updateTypeList: function () {
            var that = this, items = [];
            this.searchTypeDiv.disabled = false;
            for ( var key in this.semantics[ this.sl.id ][ 'types' ] ) {
                if ( this.semantics[ this.sl.id ][ 'types' ].hasOwnProperty( key ) ) {
                    items.push( { id: key, text: this.semantics[ this.sl.id ][ 'types' ][ key ][ 'alias' ] } );
                }
            }
            this.$searchTypeDiv.w2field( 'list', {
                items: items,
                placeholder: w2utils.lang( 'Select type' ),
                renderDrop: function ( item, options ) {
                    options.index = GWTK.dropListSelected(that.$searchTypeDiv, this.items);
                    return '<span title="' + item.text + '" style="display:block;width:' + (that.$searchTypeDiv.width() - 10) + 'px;overflow:hidden;">' + item.text + '</span>';
                }
            } );
        },

        /**
         * Установить возможность перемещения панели
         */
        setDraggable: function () {
            if (!this.map || this.map.options.controlspanel)
                return;
            GWTK.panelUI({ draggable: true, $element: this.$pane, resizable: false });
        },

        /**
         * Установить возможность изменения размеров окна компонента
         */
        setResizable: function () {
            var that = this;
            this.$pane.resizable( {
                handles: 's,w,sw',
                resize: function (event, ui) {
                    ui.position.left = ui.originalPosition.left;
                    that.$gridDiv.height(that.$pane.height() - 210); // изменить высоту грида

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
                stop: function () {
                    w2utils.lock(that.pane, { spinner: true, opacity: 0.3 });
                    w2ui[that.gridName].refresh();
                },
                minHeight: 350
            } );
        },

        /**
         * Создать таблицу
         */
        createGrid: function () {
            var that = this;
            this.$gridDiv.w2grid( {
                //map: that.map,
                name: that.gridName,
                show: {
                    header: true,
                    footer: false
                },
                header: w2utils.lang( "Semantics" ),
                columns: [
                    { field: 'sname', caption: w2utils.lang( 'Name' ), size: '30%' },
                    { field: 'scond', caption: w2utils.lang( 'Condition' ), size: '30%' },
                    { field: 'sval', caption: w2utils.lang( 'Value' ), size: '40%' }
                ],
                records: [],
                onRefresh: function ( e ) {
                    e.onComplete = function () {
                        w2utils.unlock( that.pane );
                    };
                }
            } );

			if (w2ui[this.gridName ] ) {
				w2ui[this.gridName ].map = this.map;
			}
        },

        /**
         * Деструктор
         * @method destroy
        */
        destroy: function () {
            this.$pane.resizable('destroy');
            if (this.$pane.is('.ui-draggable'))
                this.$pane.draggable('destroy');

            if (this.$closeImg)
            this.$closeImg.off();
            $(this.map.eventPane).off("featureinforefreshed.searchsem");
            this.$searcButton.off('click.searchsem');
            this.$cancelButton.off('click.searchsem');
            this.$button.off();
            $(this.map.eventPane).off('dataloadstatus.searchsem');
            $(this.map.eventPane).off('layerlistchanged.searchsem');
            $(this.map.eventPane).off('visibilitychanged.searchsem');
            this.$searchTypeDiv.off('change.searchsem');
            this.$searchLayersDiv.off('change.searchsem');

            if (this.$searchLayersDiv.data('w2field')) {
                this.$searchLayersDiv.data('w2field').clear();
            }
            if (this.$searchTypeDiv.data('w2field'))
                this.$searchTypeDiv.data('w2field').clear();
            if (this.$logicalOperations.data('w2field'))
                this.$logicalOperations.data('w2field').clear();

            w2ui[this.gridName].destroy();

            this.$pane.empty().remove();
            this.$button.remove();

        },

        /**
		 * Изменить размер дочерних элементов по размеру панели
		 */
		resize: function () {
            var panelW = this.$pane.width();
            this.$gridDiv.css({width: panelW}); // изменить ширину грида
            w2ui[ this.gridName ].refresh();
        },

        /**
         * Получить значение флага Только видимые
         * @method getSearchForVisible
         * @returns {Boolean} `true` - включен
        */
        getSearchForVisible: function(){
            var checkbox = $(this.pane).find("input[name='onlyvisible']");
            if (checkbox.length > 0) {
                return checkbox[0].checked;
            }
            return false;
        }
    };

}
