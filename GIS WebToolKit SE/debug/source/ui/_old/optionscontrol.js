 /************************************** Полищук Г.В.   03/12/20 ****
 *************************************** Нефедьева О.   11/12/20 ****
 *************************************** Гиман Н.       08/10/19 ****
 *************************************** Соколова Т.О.  23/01/19 ****
 *************************************** Патейчук В.К.  20/05/20 ****
 *************************************** Тазин В.О.     24/11/20 ****
 *************************************** Помозов Е.В.   02/03/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Компонент "Параметры"                      *
 *                                                                  *
 *******************************************************************/
if ( window.GWTK ) {
    GWTK.OptionsControl = function ( map ) {
        this.map = map;
        if (!this.map) {
            console.log("GWTK.OptionsControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.toolname = 'optionscontrols';
        this.opacityValue = [];
        this.newViewOrderForWMS = [];
        this.newViewOrderForWMTS = [];
        this.menuwidthratio = 1;

        /*массив для элементов дерева*/
        this.resizeElements = '';
        this.resizeElementsTabs = '';
        this.resizeElementsTabsSearch = '';

        this.map.maptools.push(this);

        this.init();

    };

    GWTK.OptionsControl.prototype = {
        /**
         * Инициализация прозрачности, установка прозрачности согласно локальному хранилищу или параметрам
         */
        initOpacity: function (map) {
            map = this.map || map;
            if (!map) return;

            //получаем объект из localStorage
            var localST = null;
            if(localStorage){
                localST = JSON.parse( localStorage.getItem( "opacitySettings" ) );
            }
            //Установка значений при инициализации приложения для всех слоев, если задан параметр >opacityValue<
            var i, len = map.layers.length;
            for (i = 0; i < len; i++) {
                this.initLayerOpacity(map.layers[i], map, localST);
            }
        },

        /**
         * Инициализация прозрачности одного слоя, установка прозрачности согласно локальному хранилищу или параметрам
         */
        initLayerOpacity: function (layer, map, localST) {
            if (!layer || layer.options.duty ) {
                return;
            }
            map = this.map || map;
            if (!map) return;
            localST = localST || ((localStorage) ? JSON.parse( localStorage.getItem( "opacitySettings" )) : null) ;

            var id = layer.xId,
                layerContainer = $(layer.layerContainer),
                layerTmpContainer = undefined;  //(layer && layer.wms) ? $(map.tiles.wmsManager.layerTmpContainer[layer.xId]) : null;
            //если была задана прозрачность
            if (layer.options.opacityValue !== undefined) {
                if (localST && localST[id]) {
                    layerContainer.css('opacity', parseFloat(localST[id]['value'] / 101));
                    layer.options.opacityValue = localST[id]['value'];
                    if (layerTmpContainer) {
                        layerTmpContainer.css('opacity', parseFloat(localST[id]['value'] / 101));
                    }

                } else {
                    layerContainer.css('opacity', parseFloat(layer.options.opacityValue / 101));
                    if (layerTmpContainer) {
                        layerTmpContainer.css('opacity', parseFloat(layer.options.opacityValue / 101));
                    }
                }
            } else {
                if (localST && localST[id]) {
                    layerContainer.css('opacity', localST && localST[id] ? parseFloat(localST[id]['value'] / 101) : 1);
                    layer.options.opacityValue = localST[id]['value'];
                    if (layerTmpContainer) {
                        layerTmpContainer.css('opacity', parseFloat(localST[id]['value'] / 101));
                    }
                } else {
                    layer.options.opacityValue = 100;
                    if (layerTmpContainer) {
                        if (map.tiles.wmsManager.layerTmpContainer.hasOwnProperty(layer.xId)) {
                            layerTmpContainer.css('opacity', 100);
                        }
                    }
                }
            }
        },

        /**
         * Инициализация компонента
         */
        init: function () {
            var that = this;
            this.initOpacity();
            $( this.map.eventPane ).on( 'layerlistchanged.mapoptions', function ( event ) {
                that.dinamicLayerEventListener( event );
                that.initTitleEvent();
                that.initEvents();         // инициализация событий после добавления/удаления слоя
                that.initOpacity();
                that.reset();
            } );
            $(this.map.eventPane).on('visibilitychanged.mapoptions', function (e) {
                that.setUnsetCheckedInviewOptions( e )
            } );
            this.createToolbarButton();
            this.createPaneForTabs();
            this.createTabs();
            this.getLayers();
            this.addSearchLayer();
            this.setResizable();
            // если указана панель для компонентов, то перетаскивание недоступно
			if(!this.map.options.controlspanel) {
                this.setDraggable();
            }
            w2ui[ 'opttabs' ].click( 'tabcontent' );
            this.initTitleEvent();
            this.initEvents();
        },

        /**
		 * Изменить размер дочерних элементов по размеру панели
		 */
		resize: function () {
            var panelW = $(this.paneTabs).width();
            this.panelContSearch.css( { width: panelW } );
            this.resizeElements.children().css( { width: panelW } );
            this.resizeElements.css( { width: panelW } );
            this.resizeElementsTabs.css( { width: panelW });
            this.resizeElementsTabsSearch.css( { width: panelW } );
            this.additionalTabs.css( { width: panelW } );
        },

        /**
         * Инициализация событий компонента
         */
        initEvents: function () {
            var that = this;

	        $(this.map.eventPane).on('layercommand.optionscontrol', GWTK.Util.bind(function(e){
	            if(e.maplayer.act === 'opacitychanged'){
		            var input = document.getElementById('opacity-setting-img-range-'+e.maplayer.id);
		            if(input){
		                input.value = e.maplayer.value;
                    }
                }
            },this));


            var $rangeOpacity = $( '.range-opacity' );
            $( '#gsort' ).off().on( 'click', function ( e ) {
                that.sortLi( e );
            } );
            $( '#gsearch' ).off().on( 'click', function ( e ) {
                that.checkAll( e );
            } );
            $( '#gstopsearch' ).off().on( 'click', function ( e ) {
                that.uncheckAll( e );
            } );
            $( 'img.settingopacyti' ).off().on( 'click', function ( e ) {
                that.showHideSettings( e.currentTarget );
            } );
	        $rangeOpacity.on('mousemove', function(e){
	            var layerId = e.target.id.replace('opacity-setting-img-range-', '');
	            that.map.handlers.changeLayerOpacity(layerId, e.target.value);
	            that.map.tiles.setLayersInViewOrder();
	        });
            $( 'input.synchro-with-mapcontent' ).off().on( 'click', function ( e ) {
                that.synchronWithMapContent( e, e.currentTarget );
            } );
            $( '#panel-contents-search').find('input.searchcheck-order-checkbox' ).off().on( 'change', function ( e ) {
                that.setSelecttableLayers( e, e.currentTarget );
            } );
            $( "#lang-option-mer" ).off().on('change', function (  ) {
                that.map.options.measurement.selected.perimeter = $(this).data('selected').id;
                var appkey = GWTK.Util.appkey();
                localStorage[appkey + 'meaunits'] = JSON.stringify(that.map.options.measurement);
                $(that.map.eventPane).trigger({type:'measurement_change'});
            });
            $( "#area-option-mer" ).off().on('change', function (  ) {
                that.map.options.measurement.selected.area = $(this).data('selected').id;
                var appkey = GWTK.Util.appkey();
                localStorage[appkey + 'meaunits'] = JSON.stringify(that.map.options.measurement);
	            $(that.map.eventPane).trigger({type:'measurement_change'});
            });
            $("#angle-option-mer").off().on('change', function () {
                that.map.options.measurement.selected.angle = $(this).data('selected').id;
                var appkey = GWTK.Util.appkey();
                localStorage[appkey + 'meaunits'] = JSON.stringify(that.map.options.measurement);
	            $(that.map.eventPane).trigger({type:'measurement_change'});
            });
            $('#measur-show-checkbox').off().on('change', function (e) {
                that.map.options.measurement.show = e.target.checked;
                var appkey = GWTK.Util.appkey();
                localStorage[appkey + 'meaunits'] = JSON.stringify(that.map.options.measurement);
            });

			$('.filltype-options-input' ).off().on('change', function () {
				var objectSelectionData = $( '#filltype-show-list' ).data();
				if ( objectSelectionData && objectSelectionData.selected && objectSelectionData.selected.id == 'marker' ) {
						$( '#filltype-show-list-fill-type, #filltype-show-list-color-stroke, #filltype-show-list-color, #filltype-show-list-range, #filltype-show-list-stroke-width' ).prop( 'disabled', true );
                        that.map.setSelectedMarkingOfObjects( objectSelectionData.selected.id );
						return true;
                }
                else {
					$( '#filltype-show-list-fill-type, #filltype-show-list-color-stroke, #filltype-show-list-color, #filltype-show-list-range, #filltype-show-list-stroke-width' ).prop( 'disabled', false );
					that.map.setSelectedMarkingOfObjects( objectSelectionData.selected.id );
					var filltype = $( '#filltype-show-list-fill-type' ).data();
					var color = $( '#filltype-show-list-color' ).val();
					var stroke = $( '#filltype-show-list-color-stroke' ).val();
					var opacity = $( '#filltype-show-list-range' ).val();
					var thickness = $( '#filltype-show-list-stroke-width' ).data();
                    that.map.setSettingsDrawingLayer( filltype.selected.id, color, stroke, opacity / 100, thickness.selected.id );
                    $(that.map.eventPane).trigger("markingcolorchanged");
				}
            });

            $('.measurementstyle-options-input').off().on('change', function () {
                var options = {
                    fillcolor: $('#measurementstyle-show-list-color').val(),
                    linecolor: $('#measurementstyle-show-list-color-stroke').val(),
                    opacity: $('#measurementstyle-show-list-range').val() / 100
                };
                if (that.map.setMeasurementDrawingStyle(options)) {
                    $(that.map.eventPane).trigger("measurementstylechanged");
                }
            });

            // обработка изменений размера панели контролов
			$(this.map.eventPane).on('resizecontrolspanel.optionscontrols', function (event) {
				// изменить размеры своей панели
				this.resize();
			}.bind(this));

        },

        /**
         * Инициализация показа структуры вложенности элементов в составе карты
         */
        initTitleEvent: function () {
            var that = this;
            $( '.draglistwmsvieworder' ).hover(
                function ( e ) {
                    var tree = that.map.mapTool('mapcontent');
                    if (tree){
                        GWTK.Util.getTreeTitle( e.target, e.target.id, tree.name );
                    }
                },
                function ( e ) {
                }
            );
        },

        /**
         * Создать кнопку в панели инструментов
         */
        createToolbarButton: function () {
            this.bt = GWTK.DomUtil.create( 'div', 'control-button clickable control-button-options', this.map.panes.toolbarPane );
            this.bt.id = 'panel_button_options';
            this.bt.title = w2utils.lang( "Options" );
            $(this.bt).on('click', this.toolbarButtonClick.bind(this));
        },

        /**
         * Установить возможность перемещения окна компонента
         */
        setDraggable: function () {
            if (!this.map)
                return;
            GWTK.panelUI({ draggable: true, $element: $(this.paneTabs), resizable: false });
        },

        /**
         * Изменение класса кнопки компонента
         */
        toolbarButtonClick: function () {
            var $optionscontrolButton = $( '#panel_button_options' );
            var $panelTabs = $('#' + this.map.divID + '_optionsPane');
            if ( $optionscontrolButton.hasClass( 'control-button-active' ) ) {
                $optionscontrolButton.removeClass( 'control-button-active' );
                this.map.getMapTaskBar().onPanelClose($panelTabs);
                $panelTabs.hide('slow');
            } else {
                $optionscontrolButton.addClass( 'control-button-active' );
                this.map.getMapTaskBar().onPanelClose($panelTabs);
                $panelTabs.show();
                // развернуть общую панель для компонентов (если используется)
                this.map.showControlsPanel();
            }
        },

        /**
         * Создать панели для вкладок
         */
        createPaneForTabs: function () {

            // если указана панель для компонентов, то создаем в ней
			if (this.map.options.controlspanel) {
                this.paneTabs = GWTK.DomUtil.create( 'div', 'map-panel-def-flex options-panel-flex', this.map.mapControls );
            }
            else {
                this.paneTabs = GWTK.DomUtil.create( 'div', 'map-panel-def options-panel', this.map.mapPaneOld );
            }

            this.paneTabs.setAttribute( 'id', this.map.divID + '_optionsPane' );
            var div = document.createElement('div');

	        div.appendChild( GWTK.Util.createHeaderForComponent( {
	            name: w2utils.lang("Options"),
	            map: this.map,
                context: this.toolname,
		        callback: GWTK.Util.bind( function (  ) {
                    $( '#panel_button_options' ).removeClass( 'control-button-active' );
                    $( '#' + this.map.divID + '_optionsPane' ).hide('slow');
		        }, this ),
                minimizePanel: this.paneTabs,
                minimizeIconClass: 'control-button-options'
	        } ) );

	        this.paneTabs.appendChild(div);

            this.paneTabs.style.display = 'none';
        },

        /**
         * Слушатель события layerlistchanged
         * @param event объект события layerlistchanged
         */
        dinamicLayerEventListener: function ( event ) {
            if (!event || !event.maplayer || !event.maplayer.id || !event.maplayer.act) {
                return;
            }
            if ( event.maplayer.act === 'remove' ) {
                this.removeNodeInViewOrder( event.maplayer );
                return;
            }
            if ( event.maplayer.act !== 'add' ) { return; }
            var lay = this.map.tiles.getLayerByxId( event.maplayer.id );
            if (!lay) { return; }
            this.addNodeInViewOrder( lay );
            if ( lay.wms == true ) {
                var lisWms = document.getElementById( 'panel-contents-wms' );
                var liWms = lisWms.getElementsByClassName( 'draglistwmsvieworder' );
                lay.layerContainer.style.zIndex = liWms.length + 1;
            }
            else if ( lay.url.length > 0 ) {                            // 27/06/16
                var lisWmts = document.getElementById( 'panel-contents-wmts' );
                var liWmts = lisWmts.getElementsByClassName( 'draglistwmtsvieworder' );
                if ( lay.layerContainer && lay.layerContainer.style )
                    lay.layerContainer.style.zIndex = liWmts.length + 1;
            }
        },

        /**
         * Показать слои во вкладке порядок отображения
         * @param obj - идентификатор
         */
        showLayerInVo: function ( obj ) {
            $( "#" + obj ).removeClass( 'hidendraglist' );
        },

        /**
         * Скрыть слой во вкладке порядок отображения
         * @param obj - идентификатор слоя
         */
        hideLayerInVo: function ( obj ) {
            $( "#" + obj ).addClass( 'hidendraglist' );
        },

        /**
         * Показать скрыть ползунок настройки прозрачности обработчик события click
         * @param object - html объект по которому произошел клик
         */
        showHideSettings: function ( object ) {

            var $obj = document.getElementById( 'opacity-' + object.id );
            $obj = $( $obj );
            if ( $obj ) {
                if ( $obj.is( ':visible' ) ) {
                    $obj.hide();
                    $( '#set-node-' + object.id ).hide();
                    $( object ).removeClass( 'settingopacyti-active' );
                } else if ( $obj.is( ':hidden' ) ) {
                    $obj.show();
                    $( '#set-node-' + object.id ).show();
                    $( object ).addClass( 'settingopacyti-active' );
                }
            } else {
                console.log("showHideSettings. Element with id '" + object.id + "' not found");
            }
        },

        /**
         * Слушатель события включения/выключения слоев в панели компонента
         * @param event -  объект события click
         * @param obj - html объект чекбокса
         */
        synchronWithMapContent: function ( event, obj ) {
            var mapContent = this.map.mapTool( 'mapcontent' );
            if ( obj.checked == true ) {
                mapContent.setChecked( obj.value );
	            mapContent.setLayerVisible( true, [ w2ui[ mapContent.name ].get( obj.value ) ] );
            }
            if ( obj.checked == false ) {
                mapContent.setUnChecked( obj.value );
	            mapContent.setLayerVisible( false, [ w2ui[ mapContent.name ].get( obj.value ) ] );
            }
        },

        /**
         * Слушатель события visibilitychanged для установки/снятия галочек в окне компонента
         * @param event - объект события visibilitychanged
         */
        setUnsetCheckedInviewOptions: function ( event ) {
            if ( event.maplayer ) {
                var checked = event.maplayer.visible;
                var checkbox = document.getElementById( "goptions_layer_" + event.maplayer.id );
                if ( checkbox ) {
                    checkbox.checked = checked;
                }
            }
        },

        /**
         *Получить слои для порядка отображения
         */
        getLayers: function () {

            this.visibleWmsLayer = [];
            this.visibleWmtsLayer = [];
            this.tempArrAlias = [];
            this.layerArrMap = [];

	        for(var k = 0; k < this.map.tiles.viewOrder.length; k++){
	            var layer = this.map.tiles.getLayerByxId(this.map.tiles.viewOrder[k]);
	            if(layer && !layer.options.duty){                                        // 07/12/18
	                this.tempArrAlias.push(layer);
	            }
	        }
            if ( this.tempArrAlias ) {
                for ( var i = 0; i < this.tempArrAlias.length; i++ ) {
                    var viz;
                    var layerOpacityValue = this.tempArrAlias[ i ].options.opacityValue !== undefined ? this.tempArrAlias[ i ].options.opacityValue : 100;
                    if ( this.tempArrAlias[ i ].visible === true ) {
                        var check = "checked";
                        viz = "visibleidraglist";
                    } else {
                        viz = "visibleidraglist";
                        check = '';
                    }
                    if ( this.tempArrAlias[ i ].wms === true ) {
                        //если WMS слои оптимизированы, то они не попадают в инструмент
                        if ( !this.map.options.mergewmslayers ) {
                            this.visibleWmsLayer.push( '<div  ' + 'title="' + this.tempArrAlias[ i ].alias + '"  class = "draglistwmsvieworder draglist' + ' ' + viz + '"' + ' id ="' + this.tempArrAlias[ i ].xId + '"' + '>' +
                                '<input style = "float: left"' + ' ' + check + ' ' + 'id="goptions_layer_' + this.tempArrAlias[ i ].xId + '"' + ' ' + ' class="synchro-with-mapcontent order-checkbox" type="checkbox"' + ' value="' + this.tempArrAlias[ i ].xId + '"' + '>' + '<div class="div-p">' + this.tempArrAlias[ i ].alias + '</div>' +
                                '<div class="imgh">' +
                                '<img  title="' + w2utils.lang( "Opacity" ) + '" id="setting-img-range-' + this.tempArrAlias[ i ].xId + '"' + ' class="settingopacyti"  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABaUlEQVR42mNkQAOzZs22Y2VlbQNiXSYmJh6Q2L9//778/v37MhBXpaWlHkJWzwhjTJs2nRMI9rCxsWn//fu3FGjA0sjIiG8gueXLV3ABNUczMzN3//r16+r3799dsrIyv8MNAGnm5ua+xcjIuDMuLjaFAQ9YtGjxnP///7t//fpVDWQI2ID58xccAZp+g5BmZEOArtRITEywYQT5GWj7xujoKEFiNMPA0qXL3gNd4c8ItX0h0PbZpBgAdEUq0BXxjEuWLP0INEASFGBVVVVyIDkBAQF7bJo+fPhwEEiFtLW1vQEFLNCA54zLli3/GxUVyQxTBDREFUjtBRoii6b5MZByBmq+DRMD6cUwAGqIDRcX9z42NlZWEP/Xr9+/v3376gTUfARZHdgAZC+gGRIHdMVCqO3xQM2LkOXhXsAXiCBDQDS6ZpRAxBeNwAQGTifABPMfZzSCOBQlJKhNlCVlmCFkZyZkQGp2BgDONwMaNDjYKgAAAABJRU5ErkJggg==">' +
                                '</div>' +
                                '<br />' + '<p class="setting-opacity-node" id="set-node-setting-img-range-' + this.tempArrAlias[ i ].xId + '">' + w2utils.lang( "Opacity" ) + '</p>' + '<input value="' + layerOpacityValue + '"  id="opacity-setting-img-range-' + this.tempArrAlias[ i ].xId + '" class="range-opacity" type="range" min="0" max="100" step="1">' +
                                '</div>' );
                        }
                    }
                    else {
                        this.visibleWmtsLayer.push( '<div   title="' + this.tempArrAlias[ i ].alias + '"  class = "draglistwmtsvieworder draglist' + ' ' + viz + '"' + ' id ="' + this.tempArrAlias[ i ].xId + '"' + '>' +
                            '<input style = "float: left"' + ' ' + check + ' ' + 'id="goptions_layer_' + this.tempArrAlias[ i ].xId + '"' + ' ' + ' class="synchro-with-mapcontent order-checkbox" type="checkbox"' + ' value="' + this.tempArrAlias[ i ].xId + '"' + '>' + '<div class="div-p">' + this.tempArrAlias[ i ].alias + '</div>' +
                            '<img  title="' + w2utils.lang( "Opacity" ) + '"  id="setting-img-range-' + this.tempArrAlias[ i ].xId + '"' + ' class="settingopacyti" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABaUlEQVR42mNkQAOzZs22Y2VlbQNiXSYmJh6Q2L9//778/v37MhBXpaWlHkJWzwhjTJs2nRMI9rCxsWn//fu3FGjA0sjIiG8gueXLV3ABNUczMzN3//r16+r3799dsrIyv8MNAGnm5ua+xcjIuDMuLjaFAQ9YtGjxnP///7t//fpVDWQI2ID58xccAZp+g5BmZEOArtRITEywYQT5GWj7xujoKEFiNMPA0qXL3gNd4c8ItX0h0PbZpBgAdEUq0BXxjEuWLP0INEASFGBVVVVyIDkBAQF7bJo+fPhwEEiFtLW1vQEFLNCA54zLli3/GxUVyQxTBDREFUjtBRoii6b5MZByBmq+DRMD6cUwAGqIDRcX9z42NlZWEP/Xr9+/v3376gTUfARZHdgAZC+gGRIHdMVCqO3xQM2LkOXhXsAXiCBDQDS6ZpRAxBeNwAQGTifABPMfZzSCOBQlJKhNlCVlmCFkZyZkQGp2BgDONwMaNDjYKgAAAABJRU5ErkJggg==">' +
                            '<br />' +
                            '<p class="setting-opacity-node" id="set-node-setting-img-range-' + this.tempArrAlias[ i ].xId + '">' + w2utils.lang( "Opacity" ) + '</p>' +
                            '<input value="' + layerOpacityValue + '"  id="opacity-setting-img-range-' + this.tempArrAlias[ i ].xId + '" class="range-opacity" type="range" min="0" max="100" step="1">' +
                            '</div>' );
                    }
                }
            }
            $( '#wrapper' ).hide();
            $( '#wrappersearch' ).hide();
            $( '#panel-contents-wms' ).hide().html( this.visibleWmsLayer );
            $( '#panel-contents-wmts' ).hide().html( this.visibleWmtsLayer );
        },

        /**
         * Слушатель события change для ограничения поиска по области и выбора объектов
         * @param event - объект события change
         * @param object - объект элемента по которому произошел клик
         */
        setSelecttableLayers: function ( event, object ) {
            var selected, xidLayer = object.value;
            var checked = object.checked;
            if ( checked == true ) {
                selected = 1;
            } else {
                selected = 0;
            }
            for ( var i = 0; i < this.areaSeekayer.length; i++ ) {
                if ( xidLayer == this.areaSeekayer[ i ].xId ) {
                    this.areaSeekayer[ i ].selectObject = selected;
                    this.areaSeekayer[ i ].areaSeek = selected;
                }
            }
        },

        /**
         * Создание списка слоев для вкладки поиск
         */
        addSearchLayer: function () {
            this.areaSeekayer = [];
            this.searchLayer = [];
            this.searchLayerArrMap = this.map.layers;
            for (var ji = 0; ji < this.searchLayerArrMap.length; ji++) {
                if (this.searchLayerArrMap[ji].options.duty) { continue; }                               // 07/12/18
                if ( this.searchLayerArrMap[ ji ].selectObject == 1 ) {
                    /*массив для ограничения поиска используется в  setSelecttableLayers*/
                    this.areaSeekayer.push( this.searchLayerArrMap[ ji ] );
                    var check = 'checked';
                    this.searchLayer.push(
                        '<div title="' + this.searchLayerArrMap[ ji ].alias + '" id="search-record-' + this.searchLayerArrMap[ ji ].xId + '" class="draglist gsearchsortlist" >' +
                        '<input style = "float: left" name="searchcheck" ' + ' ' + check + ' ' +
                        'id="search-input' + this.searchLayerArrMap[ ji ].xId + '"' + ' ' + 'class="searchcheck-order-checkbox order-checkbox" type="checkbox" ' +
                        'value="' + this.searchLayerArrMap[ ji ].xId + '"' + '>' +
                        '<div class="div-p-search">' + this.searchLayerArrMap[ ji ].alias + '</div>' +
                        '</div>'
                    );
                }
            }
            $( '#panel-contents-search' ).html( this.searchLayer );
        },

        /**
         * Обработчик выбора всех слое для поиска
         * @param buttonValue - идентификатор кнопки по которому произошел клик
         */
        setSearchAll: function ( buttonValue ) {
            var valueSearch;
            if ( buttonValue === "gsearch" ) {
                valueSearch = 1;
            }
            if ( buttonValue === "gstopsearch" ) {
                valueSearch = 0;
            }
            for ( var i = 0; i < this.areaSeekayer.length; i++ ) {
                this.areaSeekayer[ i ].selectObject = valueSearch;
                this.areaSeekayer[ i ].areaSeek = valueSearch;
            }
        },

        /**
         * Обработчик события выбрать все  на вкладке поиск
         * @param event - объект события клика
         */
        checkAll: function ( event ) {
            var target = event.currentTarget;
            if ( !target ) {
                if ( event.srcElement ) {
                    target = event.srcElement;
                }
            }
            var arr = document.getElementsByName( 'searchcheck' );
            for ( var i = 0; i < arr.length; i++ ) {
                arr[ i ].checked = true;
            }
            this.setSearchAll( target.id );
        },

        /**
         * Обработчик события сбросить все  на вкладке поиск
         * @param event - объект события клика
         */
        uncheckAll: function ( event ) {
            var target = event.currentTarget;
            if ( !target ) {
                if ( event.srcElement ) {
                    target = event.srcElement;
                }
            }
            var arr = document.getElementsByName( 'searchcheck' );
            for ( var i = 0; i < arr.length; i++ ) {
                arr[ i ].checked = false;
            }
            this.setSearchAll( target.id );
        },

        /**
         * Отсортировать список на вкладке поиск
         */
        sortLi: function () {
            var parent = document.getElementById( 'panel-contents-search' );
            var li = parent.getElementsByClassName( 'gsearchsortlist' );

            var value = [];
            for ( var i = 0; i < li.length; i++ ) {
                value.push( li[ i ] );
            }
            var rez = value.sort( function ( a, b ) {
                var ii = a.textContent /*innerText*/.toLowerCase().replace( /\s+/g, '' ), iii = b.textContent /*innerText*/.toLowerCase().replace( /\s+/g, '' );
                return ii < iii ? -1 : ii > iii ? 1 : 0;
            } );
            for ( var j = 0; j < rez.length; j++ ) {
                parent.appendChild( rez[ j ] );
            }
        },

        /**
         * Установить возможность изменения размеров окна компонента
         */
        setResizable: function () {
            var that = this;
            this.resizeElements = $( '#panel-contents' );
            this.resizeElementsTabs = $( '#wrapper,#wrappersearch' );
            this.resizeElementsTabsSearch = $( '#panel-contents-wmts,#panel-contents-wms' );
            this.panelContSearch = $( '#panel-contents-search' );
            this.additionalTabs = $( '#additionalTabs-option' );
            $( this.paneTabs ).resizable( {
                handles: 's,w,sw',
                resize: function ( event, ui ) {
                    ui.position.left = ui.originalPosition.left;
                    that.panelContSearch.css( { width: ui.size.width, height: ui.size.height - 78 } );
                    //noinspection JSValidateTypes
                    that.resizeElements.children().css( { width: ui.size.width, height: ui.size.height - 39 } );
                    that.resizeElements.css( { width: ui.size.width, height: ui.size.height - 39 } );
                    that.resizeElementsTabs.css( { width: ui.size.width, height: ui.size.height - 45 } );
                    that.resizeElementsTabsSearch.css( { width: ui.size.width, height: ui.size.height - 80 } );
                    that.additionalTabs.css( { width: ui.size.width, height: ui.size.height - 45 } );
					
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
                minHeight: 250,
                minWidth: 410
            } );
        },

        /**
         * Добавить слой в порядок отображения
         * @param layer - слой
         */
        addNodeInViewOrder: function ( layer ) {
            if ( layer && layer.options.opacityValue === undefined) {
                layer.options.opacityValue = 100;
            }
            var layerWms = [];
            var layerWmts = [];
            var layersForSearch = [];
            var viz = "visibleidraglist";
            var check = "checked";
            if (layer.options.opacityValue !== undefined) {
                this.initLayerOpacity(layer, this.map);
            }
	        var opVal = layer.options.opacityValue !== undefined ? layer.options.opacityValue : 100;
            if ( layer ) {
                if (layer.wms) {
                    if ( layer.selectObject === 1 ) {
                        this.areaSeekayer.push( layer );
                        layersForSearch.push(
                            '<div title="' + layer.alias + '" id="search-record-' + layer.xId + '" class="draglist gsearchsortlist">' +
                            '<input style = "float: left" name="searchcheck" ' + ' ' + check + ' ' +
                            'id="search-input' + layer.xId + '"' + ' ' + 'class="searchcheck-order-checkbox order-checkbox" type="checkbox" ' +
                            'value="' + layer.xId + '"' + '>' +
                            '<div class="div-p-search">' + layer.alias + '</div>' +
                            '</div>'
                        );
                        $( '#panel-contents-search' ).append( layersForSearch );
                    }

                    layerWms.push(
                        '<div  ' + 'title="' + layer.alias + '"   class = "draglistwmsvieworder draglist' + ' ' + viz + '"' + ' id ="' + layer.xId + '"' + '>' +
                        '<input style = "float: left"' + ' ' + (layer.visible ? check : '') + ' ' + 'id="goptions_layer_' + layer.xId + '"' + ' ' + ' class="synchro-with-mapcontent order-checkbox" type="checkbox"' + ' value="' + layer.xId + '"' + '>' + '<div class="div-p">' + layer.alias + '</div>' +
                        '<div class="imgh">' +
                        '<img  title="' + w2utils.lang( "Opacity" ) + '"  id="setting-img-range-' + layer.xId + '"' + ' class="settingopacyti"  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABaUlEQVR42mNkQAOzZs22Y2VlbQNiXSYmJh6Q2L9//778/v37MhBXpaWlHkJWzwhjTJs2nRMI9rCxsWn//fu3FGjA0sjIiG8gueXLV3ABNUczMzN3//r16+r3799dsrIyv8MNAGnm5ua+xcjIuDMuLjaFAQ9YtGjxnP///7t//fpVDWQI2ID58xccAZp+g5BmZEOArtRITEywYQT5GWj7xujoKEFiNMPA0qXL3gNd4c8ItX0h0PbZpBgAdEUq0BXxjEuWLP0INEASFGBVVVVyIDkBAQF7bJo+fPhwEEiFtLW1vQEFLNCA54zLli3/GxUVyQxTBDREFUjtBRoii6b5MZByBmq+DRMD6cUwAGqIDRcX9z42NlZWEP/Xr9+/v3376gTUfARZHdgAZC+gGRIHdMVCqO3xQM2LkOXhXsAXiCBDQDS6ZpRAxBeNwAQGTifABPMfZzSCOBQlJKhNlCVlmCFkZyZkQGp2BgDONwMaNDjYKgAAAABJRU5ErkJggg==">' +
                        '</div>' +
                        '<br />' + '<p class="setting-opacity-node" id="set-node-setting-img-range-' + layer.xId + '">' + w2utils.lang( "Opacity" ) + '</p>' + '<input value="' + opVal + '"  id="opacity-setting-img-range-' + layer.xId + '" class="range-opacity" type="range" min="0" max="100" step="1">' +
                        '</div>' );
                    $( '#panel-contents-wms' ).append( layerWms );
                }
                if (!layer.wms) {
                    layerWmts.push(
                        '<div  ' + 'title="' + layer.alias + '"   class = "draglistwmtsvieworder draglist' + ' ' + viz + '"' + ' id ="' + layer.xId + '"' + '>' +
                        '<input style = "float: left"' + ' ' + (layer.visible ? check : '') + ' ' + 'id="goptions_layer_' + layer.xId + '"' + ' ' + ' class="synchro-with-mapcontent order-checkbox" type="checkbox"' + ' value="' + layer.xId + '"' + '>' + '<div class="div-p">' + layer.alias + '</div>' +
                        '<div class="imgh">' +
                        '<img  title="' + w2utils.lang( "Opacity" ) + '"  id="setting-img-range-' + layer.xId + '"' + ' class="settingopacyti"  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABaUlEQVR42mNkQAOzZs22Y2VlbQNiXSYmJh6Q2L9//778/v37MhBXpaWlHkJWzwhjTJs2nRMI9rCxsWn//fu3FGjA0sjIiG8gueXLV3ABNUczMzN3//r16+r3799dsrIyv8MNAGnm5ua+xcjIuDMuLjaFAQ9YtGjxnP///7t//fpVDWQI2ID58xccAZp+g5BmZEOArtRITEywYQT5GWj7xujoKEFiNMPA0qXL3gNd4c8ItX0h0PbZpBgAdEUq0BXxjEuWLP0INEASFGBVVVVyIDkBAQF7bJo+fPhwEEiFtLW1vQEFLNCA54zLli3/GxUVyQxTBDREFUjtBRoii6b5MZByBmq+DRMD6cUwAGqIDRcX9z42NlZWEP/Xr9+/v3376gTUfARZHdgAZC+gGRIHdMVCqO3xQM2LkOXhXsAXiCBDQDS6ZpRAxBeNwAQGTifABPMfZzSCOBQlJKhNlCVlmCFkZyZkQGp2BgDONwMaNDjYKgAAAABJRU5ErkJggg==">' +
                        '</div>' +
                        '<br />' + '<p class="setting-opacity-node" id="set-node-setting-img-range-' + layer.xId + '">' + w2utils.lang( "Opacity" ) + '</p>' + '<input value="' + opVal + '"  id="opacity-setting-img-range-' + layer.xId + '" class="range-opacity" type="range" min="0" max="100" step="1">' +
                        '</div>' );
                    $( '#panel-contents-wmts' ).append( layerWmts );
                }
            }
        },

        /**
         * Удалить слой из порядка отображения
         * @param layerid - идентификатор слоя
         */
        removeNodeInViewOrder: function ( layerid ) {
            /*Удаляем элемент массива*/
            for ( var i = 0; i < this.areaSeekayer.length; i++ ) {
                if ( this.areaSeekayer[ i ].xId == layerid.id ) {
                    this.areaSeekayer.splice( [ i ], 1 );
                }
            }
            var $obj = document.getElementById( layerid.id );
            $( $obj ).remove();
            var $objsearch = document.getElementById( 'search-record-' + layerid.id );
            if ( $objsearch ) {
                $( $objsearch ).remove();
            }
        },

        /**
         * Установить единицы измерения
         */
        setMeasurementList: function () {
            var /*that = this,*/key,/* key1,*/ perimeter = [], area = [], angle = [], selectedPerimeter = { id: null, text: null }, selectedArea = { id: null, text: null }, selectedAngle = { id: null, text: null };
            for ( key in this.map.options.measurement.perimeter ) {
                if ( this.map.options.measurement.perimeter.hasOwnProperty( key ) ) {
                    perimeter.push( { id: key, text: w2utils.lang( key ) } );
                }
            }
            for ( key in this.map.options.measurement.area ) {
                if ( this.map.options.measurement.area.hasOwnProperty( key ) ) {
                    area.push( { id: key, text: w2utils.lang( key ) } );
                }
            }
            for (key in this.map.options.measurement.angle) {
                if (this.map.options.measurement.angle.hasOwnProperty(key)) {
                    angle.push({ id: key, text: w2utils.lang(key) });
                }
            }

            selectedPerimeter.id = this.map.options.measurement.selected.perimeter;
            selectedPerimeter.text = w2utils.lang( this.map.options.measurement.selected.perimeter );

            selectedArea.id = this.map.options.measurement.selected.area;
            selectedArea.text = w2utils.lang(this.map.options.measurement.selected.area);

            selectedAngle.id = this.map.options.measurement.selected.angle;
            selectedAngle.text = w2utils.lang(this.map.options.measurement.selected.angle);

            var $langOptionsMer = $( "#lang-option-mer" );
            $langOptionsMer.w2field( 'list', {
                items: perimeter, selected: selectedPerimeter,
                renderDrop: function ( item, options ) {
                    options.index = GWTK.dropListSelected( $langOptionsMer, this.items );
                    return '<span title="' + item.text + '" style="display:block;width:' + ($langOptionsMer.width() - 10) + 'px;overflow:hidden;">' + item.text + '</span>';
                }
            } );
            var $areaOtionsMer = $( "#area-option-mer" );
            $areaOtionsMer.w2field( 'list', {
                items: area, selected: selectedArea,
                // placeholder: w2utils.lang( 'Select layer' ),
                renderDrop: function ( item, options ) {
                    options.index = GWTK.dropListSelected($areaOtionsMer, this.items);
                    return '<span title="' + item.text + '" style="display:block;width:' + ($areaOtionsMer.width() - 10) + 'px;overflow:hidden;">' + item.text + '</span>';
                }
            } );
            var $angleOtionsMer = $("#angle-option-mer");
            $angleOtionsMer.w2field('list', {
                items: angle, selected: selectedAngle,
                renderDrop: function (item, options) {
                    options.index = GWTK.dropListSelected($angleOtionsMer, this.items);
                    return '<span title="' + item.text + '" style="display:block;width:' + ($angleOtionsMer.width() - 10) + 'px;overflow:hidden;">' + item.text + '</span>';
                }
            });

            if (this.map.options.measurement.show) {
                $('#measur-show-checkbox').prop("checked", true);
            }else{
                $('#measur-show-checkbox').prop("checked", false);
            }
        },

        /**
         * Получить значение чекбокса
         * @returns {*} - строка "checked" если разрешен показ кнопки статистики
         */
        setStatusMeasurement: function () {
            if ( this.map.options.measurement.show ) {
                return 'checked ';
            } else {
                return ' ';
            }
        },

		/**
		 * Инициализация раздела выделение объектов
		 */
		setMarkingOfObjects: function () {
			var selected = this.map.getSelectedMarking();
			var items = this.map.getMarkingList();
			var colorInput = $( '#filltype-show-list-color' );
			var colorStroke = $( '#filltype-show-list-color-stroke' );
			var fillType = $( '#filltype-show-list-fill-type' );
			var lineWidth = $( '#filltype-show-list-stroke-width' );
			var objectSelection = $( '#filltype-show-list' );

			objectSelection.w2field( 'list', {
				items: items, selected: selected,
				renderDrop: function ( item, options ) {
				    options.index = GWTK.dropListSelected(objectSelection, this.items);
					return '<span title="' + item.text + '" style="display:block; width:' + (objectSelection.width() - 10) + 'px; overflow:hidden;">' + item.text + '</span>';
				}
			} );
			colorInput.val( this.getDefColor() );
			colorInput.w2field( 'color' );

			colorStroke.val( this.getDefColorLine() );
			colorStroke.w2field( 'color' );

			fillType.w2field( 'list', {
				items: this.map.getFillTypeList(), selected: this.map.getSelectedFillType(),
				renderDrop: function ( item, options ) {
				    options.index = GWTK.dropListSelected(fillType, this.items);
					return '<span title="' + item.text + '" style="display:block; width:' + (fillType.width() - 10) + 'px; overflow:hidden;">' + item.text + '</span>';
				}
			} );
			lineWidth.w2field( 'list', {
				items: this.map.options.markingofobjects.fill.style.linewidth,
				selected: this.map.getSelectedStrokeWidth(),
				renderDrop: function ( item, options ) {
				    options.index = GWTK.dropListSelected(lineWidth, this.items);
					return '<span title="' + item.text + '" style="display:block; width:' + (lineWidth.width() - 10) + 'px; overflow:hidden;">' + item.text + '</span>';
				}
			} );
			if ( selected.id == 'marker' ) {
				$( '#filltype-show-list-fill-type, #filltype-show-list-color-stroke, #filltype-show-list-color, #filltype-show-list-range, #filltype-show-list-stroke-width' ).prop( 'disabled', true );
            }
            else {
				$( '#filltype-show-list-fill-type, #filltype-show-list-color-stroke, #filltype-show-list-color, #filltype-show-list-range, #filltype-show-list-stroke-width' ).prop( 'disabled', false );
			}
        },

		/**
		 * Получить цвет по умолчанию
		 * @returns {*}
		 */
		getDefColor: function () {
			if ( !this.map || !this.map.options.markingofobjects ) return 'CCCCCC';
			return this.map.options.markingofobjects.fill.style.color;
        },

		/**
		 * Получить цвет линии для выделяемых объектов
		 * @returns {*}
		 */
		getDefColorLine: function () {
			if ( !this.map || !this.map.options.markingofobjects ) return 'CCCCCC';
			return this.map.options.markingofobjects.fill.style.linecolor;
		}
		,
		/**
		 * Получить прозрачность для ползунка
		 * @returns {number}
		 */
		getMarkOpacity: function () {
			return this.map.options.markingofobjects.fill.style.opacity * 100;
		},

        /**
         * Инициализация раздела стилий измерения
         * @method setMeasurementStyle
         */
        setMeasurementStyle: function () {
            var colorFill = $('#measurementstyle-show-list-color');
            var colorStroke = $('#measurementstyle-show-list-color-stroke');
            var colorOpacity = $('#measurementstyle-show-list-range');

            colorFill.val(this.getDefMeasurementFillColor());
            colorFill.w2field('color');

            colorStroke.val(this.getDefMeasurementLineColor());
            colorStroke.w2field('color');

            colorOpacity.val(this.getMeasurementOpacity());
        },
        /**
         * Получить цвет заливки для измерений (по умолчанию)
         * @method getDefMeasurementFillColor
         * @returns {string} Цвет
         */
        getDefMeasurementFillColor: function () {
            var result = 'fffd59';
            if (this.map && this.map.options && this.map.options.measurementstyle) {
                result = this.map.options.measurementstyle.fillcolor;
            }
            return result;
        },
        /**
         * Получить цвет линии для измерений (по умолчанию)
         * @method getDefMeasurementLineColor
         * @returns {string} Цвет
         */
        getDefMeasurementLineColor: function () {
            var result = 'da4447';
            if (this.map && this.map.options && this.map.options.measurementstyle) {
                result = this.map.options.measurementstyle.linecolor;
            }
            return result;
        },
        /**
         * Получить непрозрачность для измерений (по умолчанию)
         * @method getMeasurementOpacity
         * @returns {number} Значение непрозрачности
         */
        getMeasurementOpacity: function () {
            var result = 70;
            if (this.map && this.map.options && this.map.options.measurementstyle) {
                result = this.map.options.measurementstyle.opacity * 100;
            }
            return result;
        },

        /**
          * Изменить период обновления слоев карты
          * @method changeRefreshInterval
          * @param seconds {Number} интервал обновления, секунды
         */
		changeRefreshInterval: function (seconds) {
            GWTK.mapSetMapRefreshPeriod(this.map, seconds);
		},

        /**
          * Настроить элементы управления "Период обновления слоев"
          * @method setRefreshInterval
         */
		setRefreshInterval: function () {
		    var $interval = $(this.paneTabs).find('.refresh-interval');
		    if ($interval.length == 0) {
		        return;
		    }

		    this.map._readCookie('refresh');
		    if (typeof this.map.options.refresh != 'undefined') {
		        $interval.val(parseInt(this.map.options.refresh) / 1000);
		        this.changeRefreshInterval($interval.val());
		    }
		    var tool = this;
		    $interval.w2field('float', { 'min': 0, step: 1 });
		    $interval.off();
		    $interval.on('change', function (e) { tool.changeRefreshInterval($(this).val()); });
        },

        /**
         * Создать и установить вкладки для компонента
         */
        createTabs: function () {
            var that = this;
            /*При переключении проверить существует ли элемент вкладки*/
            $().w2destroy( "opttabs" );
            $().w2destroy( "wmswmts" );
            /*Добавить дивы содержимого */
            $( '#' + this.map.divID + '_optionsPane' ).append( '<div id="optiontabs" style="width: 100%;"></div> ' +
                '<div id="wrapper" style="border: 1px solid silver; border-top: 0; width: 100%;">' +
                '<div id="tabs-wms-wmts">' + '</div>' +
                '<div id="panel-contents-wms" >' + '</div>' +
                '<div id="panel-contents-wmts">' + '</div>' +
                '</div>' +
                '<div id="wrappersearch" style="border: 1px solid silver; border-top: 0; width: 100%;">' +
                '<div id="tabs-search">' +
                '<div style="float: left; padding-top:12px; padding-left: 10px;">' + w2utils.lang( "Layers for search by area" ) + '</div>' +
                '<div title="' + w2utils.lang( "Sorting" ) + '" class="img-btn-search" id="gsort" >' + '</div>' +
                '<div title="' + w2utils.lang( "Reset all" ) + '" class="img-btn-search" id="gstopsearch" >' + '</div>' +
                '<div title="' + w2utils.lang( "Select all" ) + '" class="img-btn-search" id="gsearch" >' + '</div>' +
                '</div>' +
                '<form action="" id="panel-contents-search">' +
                /*CONTENT*/
                '</form>' +
                '</div>' +
                '<div id="additionalTabs-option" style="width: 100%; height: 220px; border: 1px solid silver; border-top: 0; display: none;">' +
				'<div id="additionalUnits" class="options-control-additional-units">' +
                '<table id="table-measurement-id-options" >' +
                '<tr>' +
				'<th colspan="2" class="table-measur-td-header" >' + w2utils.lang("Layers refresh interval") + '</th>' +
				'</tr>' +
                '<tr>' +
                '<td class="table-measur-td" >' + w2utils.lang("Refresh interval (seconds)") + '</td><td class="table-measur-td" ><input class="measur-input refresh-interval" value="0"/></td>' +
                '</tr>' +
                '<tr>' +
				'<th colspan="2" class="table-measur-td-header" >' + w2utils.lang( "Units" ) + '</th>' +
				'</tr>' +
				'<tr>' +
                '<td class="table-measur-td" >' + w2utils.lang( "Unit of length" ) + '</td><td class="table-measur-td" ><input class="measur-input" id="lang-option-mer" type="list"></td>' +
                '</tr>' +
                '<tr>' +
                '<td class="table-measur-td" >' + w2utils.lang( "Unit of area" ) + '</td><td class="table-measur-td" ><input class="measur-input" id="area-option-mer" type="list"></td>' +
                '</tr>' +
                '<tr>' +
                '<td class="table-measur-td" >' + w2utils.lang("Units of measurement of angles") + '</td><td class="table-measur-td" ><input class="measur-input" id="angle-option-mer" type="list"></td>' +
                '</tr>' +
                '<tr>' +
				'<td class="table-measur-td"  >' + w2utils.lang( "The total areas/lengths calculation" ) + '</td><td class="table-measur-td" ><input id="measur-show-checkbox" type="checkbox" ' + this.setStatusMeasurement() + ' ></td>' +
                '</tr>' +

				'<tr>' +
				'<th colspan="2" class="table-measur-td-header" >' + w2utils.lang( "Selecting objects" ) + '</th>' +
				'</tr>' +

				'<tr>' +
				'<td class="table-measur-td"  >' + w2utils.lang( "Object selection" ) + '</td><td class="table-measur-td" ><input class="filltype-options-input" id="filltype-show-list" type="list" ></td>' +
				'</tr>' +
				/*fill type*/
				'<tr>' +
				'<td class="table-measur-td"  >' + w2utils.lang( "Fill type" ) + '</td><td class="table-measur-td" ><input class="filltype-options-input" id="filltype-show-list-fill-type" type="list" ></td>' +
				'</tr>' +
				/*Color*/
				'<tr>' +
				'<td class="table-measur-td"  >' + w2utils.lang( "Fill color" ) + '</td><td class="table-measur-td" ><input class="filltype-options-input" id="filltype-show-list-color"  style="width: 100%;" ></td>' +
				'</tr>' +
				/*Color*/
				'<tr>' +
				'<td class="table-measur-td"  >' + w2utils.lang( "Stroke color" ) + '</td><td class="table-measur-td" ><input class="filltype-options-input" id="filltype-show-list-color-stroke"  style="width: 100%;" ></td>' +
				'</tr>' +
				/*Opacity*/
				'<tr>' +
				'<td class="table-measur-td"  >' + w2utils.lang("Opacity") + '</td><td class="table-measur-td" ><input style="width:80%" class="filltype-options-input" id="filltype-show-list-range" value="' + this.getMarkOpacity() + '" type="range" ></td>' +
				'</tr>' +
				/*linewidth*/
				'<tr>' +
				'<td class="table-measur-td"  >' + w2utils.lang( "Width" ) + '</td><td class="table-measur-td" ><input class="filltype-options-input" id="filltype-show-list-stroke-width" type="list" ></td>' +
				'</tr>' +

                '<tr>' +
                '<th colspan="2" class="table-measur-td-header" >' + w2utils.lang("Measurements") + '</th>' +
                '</tr>' +

                /*Color*/
                '<tr>' +
                '<td class="table-measur-td"  >' + w2utils.lang("Fill color") + '</td><td class="table-measur-td" ><input class="measurementstyle-options-input" id="measurementstyle-show-list-color"  style="width: 100%;" ></td>' +
                '</tr>' +
                /*Color*/
                '<tr>' +
                '<td class="table-measur-td"  >' + w2utils.lang("Stroke color") + '</td><td class="table-measur-td" ><input class="measurementstyle-options-input" id="measurementstyle-show-list-color-stroke"  style="width: 100%;" ></td>' +
                '</tr>' +
                /*Opacity*/
                '<tr>' +
                '<td class="table-measur-td"  >' + w2utils.lang("Opacity") + '</td><td class="table-measur-td" ><input style="width:80%" class="measurementstyle-options-input" id="measurementstyle-show-list-range" type="range" ></td>' +
                '</tr>' +

                '</table>' +
                '</div>' +
                '</div>'
            );

            /*Добавить дивы для содержимого */
            $( '#optiontabs' ).w2tabs( {
                name: 'opttabs',
                active: 'tabcontent',
                tabs: [
                    { id: 'tabcontent', caption: w2utils.lang( "View order" ) },
                    { id: 'tabareasearch', caption: w2utils.lang( "Search" ) },
                    { id: 'tabadditionalinfo', caption: w2utils.lang("Advanced") }
                ],
                onClick: function ( event ) {
                    this.tabsContent = $( '#panel-contents' );
                    this.tabsContentWms = $( '#panel-contents-wms' );
                    this.tabsContentWtms = $( '#panel-contents-wmts' );
                    this.wrapper = $( '#wrapper' );
                    this.wrappersearch = $( '#wrappersearch' );
                    this.additionalTabs = $( '#additionalTabs-option' );
                    switch ( event.target ) {
                        case 'tabareasearch':
                            $().w2destroy( "seacrtabs" );
                            this.tabsContentWms.hide();
                            this.wrapper.hide();
                            this.tabsContent.hide();
                            this.additionalTabs.hide();
                            this.wrappersearch.show();
                            break;
                        case 'tabadditionalinfo':
                            this.additionalTabs.show();
                            this.wrappersearch.hide();
                            this.wrapper.hide();
                            that.setMeasurementList();
                            that.setMarkingOfObjects();
                            that.setMeasurementStyle();
                            that.setRefreshInterval();
                            break;
                        case 'tabcontent':
                            $().w2destroy( "wmswmts" );
                            this.tabsContent.hide();
                            this.wrappersearch.hide();
                            this.tabsContentWtms.hide();
                            this.additionalTabs.hide();
                            this.wrapper.show();
                            this.tabsContentWms.show();
                            $( '#tabs-wms-wmts' ).w2tabs( {
                                name: 'wmswmts',
                                active: 'wmstabs',
                                tabs: [
                                    { id: 'wmstabs', caption: w2utils.lang( "Maps" ) },
                                    { id: 'wmtstabs', caption: w2utils.lang( "Tiles" ) }
                                ],
                                onClick: function ( event ) {
	                                var $panelContentsWmts = $( '#panel-contents-wmts' );
	                                var $panelContentsWms = $( '#panel-contents-wms' );
                                    switch ( event.target ) {
                                        case 'wmstabs':
	                                        $panelContentsWmts.hide();
	                                        $panelContentsWms.show().sortable( {
                                                containment: "#panel-contents-wms",
                                                axis: "y",
                                                start: function () {
                                                    that.newViewOrderForWMTS = [];
                                                    var lisWmts = document.getElementById( 'panel-contents-wmts' );
                                                    var liWmts = lisWmts.getElementsByClassName( 'draglistwmtsvieworder' );
                                                    for ( var j = 0; j < liWmts.length; j++ ) {
                                                        if ( liWmts[ j ].id != "" ) {
                                                            that.newViewOrderForWMTS.push( liWmts[ j ].id );
                                                        }
                                                    }
                                                },
                                                stop: function () {
                                                    var order = $panelContentsWms.sortable( "toArray" );
                                                    /*Совмещаем массивы WMS WMTS, WMS всегда выше для нормального
                                                     отображения при перемещении карты после смены порядка отображения*/
                                                    that.map.tiles.viewOrder = that.newViewOrderForWMTS.concat( order );
                                                    that.map.tiles.setLayersInViewOrder();
                                                    $(that.map.eventPane).trigger({ 'type': 'refreshmap', 'cmd': 'draw' });
                                                }
                                            } );
                                            break;
                                        case 'wmtstabs':

	                                        $panelContentsWms.hide();
	                                        $panelContentsWmts.show().sortable( {
                                                containment: "#panel-contents-wmts",
                                                axis: "y",
                                                start: function () {
                                                    /*WMS слоям необходимо иметь zIndex больше чем у WMTS слоев*/
                                                    that.newViewOrderForWMS = [];
                                                    var lisWms = document.getElementById( 'panel-contents-wms' );
                                                    var liWms = lisWms.getElementsByClassName( 'draglistwmsvieworder' );
                                                    for ( var j = 0; j < liWms.length; j++ ) {
                                                        if ( liWms[ j ].id != "" ) {
                                                            that.newViewOrderForWMS.push( liWms[ j ].id );
                                                        }
                                                    }
                                                },
                                                stop: function () {
                                                    var order = $panelContentsWmts.sortable( "toArray" );
                                                    /*Совмещаем массивы WMS WMTS, WMS всегда выше для нормального
                                                     отображения при перемещении карты после смены порядка отображения*/
                                                    that.map.tiles.viewOrder = order.concat( that.newViewOrderForWMS );
                                                    that.map.tiles.setLayersInViewOrder();
                                                    $(that.map.eventPane).trigger({ 'type': 'refreshmap', 'cmd': 'draw' });
                                                }
                                            } );
                                            break;
                                    }
                                }
                            } );
                            /*в зависимости от оптимизации активная вкладка меняется*/
                            if ( !that.map.options.mergewmslayers ) {
                                w2ui[ 'wmswmts' ].click( 'wmstabs' );
                            }
                            else {
                                w2ui[ 'wmswmts' ].click( 'wmtstabs' );
                            }
                            break;
                    }
                }
            } );
        },

        /**
         * Выполнить действия при сбросе карты.
         * При открытой вкладке "Дополнительно", она выбирается повторно, при этом инициализируя поля w2feild.
         * @method reset
         */
        reset: function () {
            /*var tabs = w2ui['opttabs'];
            if (tabs.active === 'tabadditionalinfo') {
                tabs.click('tabadditionalinfo');
            }*/
            var tabs = w2ui['opttabs'];
            if (tabs && tabs.active){
                tabs.click(tabs.active);
            }
        },

        /**
          * Деструктор
          * @method destroy
         */
        destroy: function () {

            $(this.map.eventPane).off( 'layerlistchanged.mapoptions');
            $(this.map.eventPane).off('visibilitychanged.mapoptions');
            $(this.map.eventPane).off('layercommand.mapoptions');
            $(this.bt).off();
            if ($(this.paneTabs).is('.ui-draggable'))
                $(this.paneTabs).draggable('destroy');
            $(this.paneTabs).resizable('destroy');
	        $(document).off('click.mapoptions');

            $('#gsort').off();
            $('#gsearch').off();
            $('#gstopsearch').off();
	        $( '.range-opacity' ).off();
            $('img.settingopacyti').off();
            $('input.synchro-with-mapcontent').off();
            $('#panel-contents-search').find('input.searchcheck-order-checkbox').off();
            $("#lang-option-mer").off();
            $("#area-option-mer").off();
            $("#angle-option-mer").off();
            $('#measur-show-checkbox').off();
            $('.filltype-options-input').off();
            $('.measurementstyle-options-input').off();
            $('.refresh-interval').off();
            this.map.tiles.stopRefreshInterval();
            // if (typeof this.timerId != undefined) {
            //     clearInterval(this.timerId);
            // }

            w2ui['opttabs'].destroy();
            // удалить содержимое каждой вкладки !!!
            if (w2ui['wmswmts']) {
                w2ui['wmswmts'].destroy();
                $('#tabs-wms-wmts').remove();
            }
            localStorage.removeItem('opacitySettings');
            $(this.paneTabs).remove();
	        $(this.bt).remove();
        }
    };
}
