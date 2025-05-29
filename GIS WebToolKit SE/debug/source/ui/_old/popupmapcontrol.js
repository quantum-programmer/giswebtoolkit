/**************************************** Гиман Н.Л.    05/06/17 ****
 **************************************** Соколова Т.О. 11/01/19 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Измерение площади по карте                   *
 *                                                                  *
 *******************************************************************/



if (window.GWTK) {
    /**
	 * Класс для работы с картографической подложкой
	 * @param map - ссылка на экземпляр карты
	 * @constructor GWTK.PopupMapControl
	 */
    GWTK.PopupMapControl = function ( map ) {
        this.map = map;
        this.toolname = "popupmapcontrol";
        this.map.maptools.push( this );
        this.fonMaps = map.options.fonmaps || [];
    };
    GWTK.PopupMapControl.prototype = {
        /**
		 * Установить активную карту
		 * @param id - идентификатор карты
		 */
        setActiveMap: function ( id ) {
            if (!this.map.options.url)
                return;

            for ( var k = 0; k < this.map.options.fonmaps.length; k++ ) {
                if ( this.map.options.fonmaps[ k ][ 'id' ] === id ) {
                    var layer = this.map.tiles.getLayerByxId( 'fonmap' );
					
                    var url = this.map.options.fonmaps[ k ][ 'url' ];
                    if ( url.indexOf( '?' ) === -1 && url.indexOf( this.map.options.url ) !== -1 ) {
                        url = this.map.options.url + '?' + url;
                    }
					
                    layer.serverUrl = url;
                    layer.options.url = url;
                    for ( var j = 0; j < layer.map.options.layers.length; j++ ) {
                        if ( layer.map.options.layers[ j ][ 'id' ] === 'fonmap' ) {
                            layer.map.options.layers[ j ][ 'url' ] = url;
                        }
                    }
                    layer.refresh();
                }
            }
        },
        /**
		 * Получить активную карту
		 * @returns {*} возвращает объект фоновой карты из мас
		 */
        getActiveMap: function () {
            var layer = this.map.tiles.getLayerByxId( 'fonmap' );
            for ( var i = 0; i < this.map.options.fonmaps.length; i++ ) {
                if ( layer.serverUrl === this.map.options.fonmaps[ i ][ 'url' ] ) {
                    return this.map.options.fonmaps[ i ];
                }
            }
            return false;
        },
        /**
		 * Получить список фоновых карт
		 * @returns {Array|*}
		 */
        getFonMapsList: function () {
            return this.fonMaps;
        },
        /**
		 * Базовая карта компонент
		 */
        baseMapControl: function () {
            if (!this.map.options.url)
                return;

            var htmlStr = '';
            for ( var i = 0; i < this.map.options.fonmaps.length; i++ ) {
                var layer = this.map.tiles.getLayerByxId( 'fonmap' );
				
                if ( layer ) {
                    var url = this.map.options.fonmaps[ i ][ 'url' ];
                    if ( url.indexOf( '?' ) === -1 && url.indexOf( this.map.options.url ) !== -1 ) {
                        url = this.map.options.url + '?' + url;
                    }
					
                    htmlStr += '<label style="cursor: pointer;"><p><input name="basemap" ' + (layer.serverUrl === url ? 'checked' : '') + ' id="basemap-' + this.map.options.fonmaps[ i ][ 'id' ] + '" type="radio" value="nedzen">' + this.map.options.fonmaps[ i ].alias + '</p></label>';
                }
            }
            var id = (new Date()).getTime() + '_basemap', that = this;
            w2popup.open( {
                title: 'Выбор фоновой карты',
                body: '<div id="' + id + '">' + htmlStr + '</div>',
                width: 300,
                onOpen: function ( e ) {
                    e.onComplete = function () {
                        $( '#' + id ).find( 'input[name="basemap"]' ).on( 'click', GWTK.Util.bind( function ( e ) {
                            var id = e.target.id.replace( 'basemap-', '' );
                            this.setActiveMap( id );
                        }, that ) );
                    }
                }
            } );
        },
        /**
		 * Создать легенду для графических слоев
		 * @method mapCreateLegend
		 * @param params{Object} - объект с полем map и ссылкой на экземпляр карты
		 * @returns {*} объект с методами управления окном
		 */
        mapCreateLegend: function ( params ) {
            if ( !params || !params.map ) {
                return false;
            }
            if ( !params.size ) {
                params.size = '20px'
            }
			
            function getNodeObjects() {
                return [
					{ id: 'events', text: 'События', expanded: true, nodes: [] },
					{ id: 'objects', text: 'Объекты', expanded: true, nodes: [] },
					{ id: 'incidents', text: 'Происшествия', expanded: true, nodes: [] }
                ];
            }
			
            function getLegendObject() {
                return {};
            }
			
            var $svg = null,
				legendObject = getLegendObject(),
				tmp = false,
				nodeObjects = getNodeObjects();
			
            function createNode( feature, xid, typeField ) {
                var $svg = feature[ 'style' ][ 'marker' ][ 'image' ];
                if ( !$svg )return false;
                $svg = $svg.replace( /\bheight=['/"](\d+)px['/"]/g, function ( str ) {
                    return str.replace( /(\d+)/, 20 );
                } );
                $svg = $svg.replace( /\bwidth=['/"](\d+)px['/"]/g, function ( str ) {
                    return str.replace( /(\d+)/, 20 );
                } );
                return {
                    id: xid + '_' + typeField,
                    text: $svg + " " + "<span style='margin-left: 5px;'>" + (feature[ 'style' ][ 'name' ] ? feature[ 'style' ][ 'name' ] : ' ') + "</span>",
                    nodes: []
                };
            }
	
            function createReadyNodes( params, nodeObjects, legendObject ) {
                for ( var i = 0; i < params.map.layers.length; i++ ) {
                    if ( (params.map.layers[ i ] instanceof GWTK.graphicLayer) ) {
                        var typeField = params.map.layers[ i ][ 'typeField' ]
                        if ( params.map.layers[ i ][ 'GeoJSON' ] && params.map.layers[ i ][ 'GeoJSON' ][ 'features' ].length > 0 ) {
                            var features = params.map.layers[ i ][ 'GeoJSON' ][ 'features' ];
                            for ( var k = 0; k < features.length; k++ ) {
                                var typeFieldValue = features[ k ][ 'properties' ][ typeField ];
                                typeFieldValue = typeFieldValue.toLowerCase();
                                if ( !legendObject[ typeFieldValue ] ) {
                                    if ( typeFieldValue.indexOf( 'env' ) === 0 ) {
                                        tmp = createNode( features[ k ], params.map.layers[ i ][ 'xId' ], typeFieldValue );
                                        if ( tmp !== false ) {
                                            nodeObjects[ 0 ][ 'nodes' ].push( tmp );
                                        }
                                    }
                                    if ( typeFieldValue.indexOf( 'obj' ) === 0 ) {
                                        tmp = createNode( features[ k ], params.map.layers[ i ][ 'xId' ], typeFieldValue );
                                        if ( tmp !== false ) {
                                            nodeObjects[ 1 ][ 'nodes' ].push( tmp );
                                        }
                                    }
                                    if ( typeFieldValue.indexOf( 'sos' ) === 0 ) {
                                        tmp = createNode( features[ k ], params.map.layers[ i ][ 'xId' ], typeFieldValue );
                                        if ( tmp !== false ) {
                                            nodeObjects[ 2 ][ 'nodes' ].push( tmp );
                                        }
                                    }
                                    legendObject[ typeFieldValue ] = true;
                                }
                            }
                        }
                    }
                }
                return nodeObjects;
            }
			
            nodeObjects = createReadyNodes( params, nodeObjects, legendObject );
            var divParent = document.createElement( 'div' );
            divParent.className = 'legent-window';
            var divChild = document.createElement( 'div' );
            divChild.className = 'legent-window-child';
            var w2uiName = (new Date()).getTime() + 'legent';
            var groupId = (new Date()).getTime() + '_group';
            var $divChild = $( divChild );
            var $divParent = $( divParent );
            // var headerForComponent = GWTK.Util.createHeaderForComponent( {
            // 	name: '',
            // 	callback: function ( e ) {
            // 		$divParent.hide();
            // 	}
            // } );
            //
            // divParent.appendChild( headerForComponent );
            divParent.appendChild( divChild );
            params.map.mapPane.appendChild( divParent );
            $divChild.w2sidebar( {
                name: w2uiName,
                nodes: {
                    id: groupId,
                    text: 'Легенда',
                    group: true,
                    expanded: true,
                    nodes: nodeObjects
                }
            } );
            $divParent.resizable( {
                handles: 's,w,sw',
                resize: function ( event, ui ) {
                    ui.position.left = ui.originalPosition.left;
                    $divChild.height( $divParent.height() - 1 );
                },
                stop: function () {
					
                    w2ui[ w2uiName ].resize();
                },
                create: function () {
                    $( this ).parent().on( 'resize', function ( e ) {
                        e.stopPropagation();
                    } );
                    var $handl = $divChild.find( '.ui-resizable-handle' );
                    $handl.css( 'position', 'absolute', 'important' );
                    $handl.css( 'width', '7px', 'important' );
                },
                minWidth: 420,
                minHeight: 250
            } );
            return {
                panel: $divParent,
                getTree: function () {
                    return w2ui[ w2uiName ] ? w2ui[ w2uiName ] : false;
                },
                hide: function () {
                    $divParent.hide();
                },
                show: function () {
                    $divParent.show();
                },
                refresh: function () {
                    var nodeObjects = getNodeObjects();
                    legendObject = getLegendObject();
                    nodeObjects = createReadyNodes( params, nodeObjects, legendObject );
                    w2ui[ w2uiName ][ 'nodes' ][ 0 ][ 'nodes' ] = [];
                    w2ui[ w2uiName ].refresh();
                    w2ui[ w2uiName ][ 'nodes' ][ 0 ][ 'nodes' ] = nodeObjects;
                    w2ui[ w2uiName ].refresh();
                }
            };
        },
        /**
		 * Создать окно карты во всплывающем окне с возможностью поиска объекта по адресу или по координате
		 * @method mapSearchDataByIdList
		 * @param options {Object} - объект с параметрами след вида
		 * {
     *     address - адрес объекта,
     *     callBack - функция обратного вызова,
     *     coord - координаты объекта,
     *     title - аголовок окна,
     *     objectName - название объекта
     * }
		 * @param optionsMap - параметры карты
		 * @returns {boolean}
		 */
        mapShowMapInPopup: function ( options, optionsMap ) {
            if ( !options ) {
                console.log( options );
                return false;
            }
            if ( !options.address ) {
                options.address = '';
            }
            if ( !options.coord ) {
                options.coord = '';
            }
            var dataForCallBack = {
                address: options.address || '',
                coord: options.coord || ''
            };
            var Map = null, Address = null, ReverseGeocoding = null, graphicLayer = null;
            //Определяем параметры поиска адреса
            var queryParamsAddress = {
                'totalCount': 0,
                'startIndex': 0,
                'maxCount': 0,
                'defaultCount': 100,
                'numberReturned': 0,
                'status': '',
                'errormessage': '',
                'mode': 'address'
            };
            var inputAddress = '<tr><td><div style="width: 100px; float: left;"> Адрес </div></td><td><input name="objectaddress" type="text" placeholder="Введите адрес" value="' + options.address + '" style="height: 20px; width: 250px; float: left;"></td><td><img name="search-by-address" style="width: 14px; cursor: pointer;" src="' + GWTK.imgMarkerBlankRed + '"></td></tr>';
            var inputCoord = '<tr><td><div style="width: 100px; float: left;"> Координаты </div></td><td><input  name="objectcoord" type="text" placeholder="Выберите точку на карте" value="' + options.coord + '" style="height: 20px;  width: 250px; float: left;"></td><td><img name="search-by-coord" style="width: 14px; cursor: pointer;" src="' + GWTK.imgMarkerBlankRed + '"></td></tr>';
            var inputObjectName = '<tr><td><div style="width: 100px; float: left;"> Имя объекта </div></td><td>' + (options.objectName ? options.objectName : ' ') + '</td></tr>';
            var buttonApply = options.callBack ? '<div name="submit-popup" style="border-radius: 4px; cursor:pointer; border: 1px solid grey; position: absolute; right: 5px; bottom: 5px; z-index: 999; padding: 5px 10px; background-color: #ffffff;"> Применить </div>' : '';
			
            function unlockInput( container ) {
                var $coord = $( container ).find( 'input[name="objectcoord"]' );
                $coord.attr( 'disabled', false );
                var $address = $( container ).find( 'input[name="objectaddress"]' );
                $address.attr( 'disabled', false );
            }
			
            function searchAnswerByAddress( e ) {
                w2popup.unlock();
                if ( !e || e.length === 0 ) {
                    unlockInput( this.container.parentNode.parentNode );
                    w2alert( 'Объект не найден' );
                    return false;
                }
                this.overlayClear();
                this.placemarks = [];
                //Разбираем точку
                var bl = e[0]['BL'].split(' ');
                if (!bl || bl.length < 2) {
                    //w2alert('Объект не найден');
                    $(this.container.parentNode.parentNode).find('input[name="objectaddress"]').val(e[0]['text']);
                    $(this.container.parentNode.parentNode).find('input[name="objectcoord"]').val('');
                    return false;
                }
                bl = bl.reverse();
                //Преобразовываем точку в LatLng
                var point = GWTK.toLatLng( bl[ 0 ], bl[ 1 ] );
                //Позиционируем карту в точке
                if ( options && options.callBackView && typeof options.callBackView === 'function' ) {
                    options.callBackView( { point: point, map: this } );
                } else {
                    this.setView( null, point, 17 );
                }
                drawObjectInLayer( bl.reverse() );
                dataForCallBack.coord = e[ 0 ][ 'BL' ];
                $( this.container.parentNode.parentNode ).find( 'input[name="objectcoord"]' ).val( bl.reverse().toString() );
                Map.overlayRefresh();
            }
			
            function searchAnswerByCoord( e ) {
                w2popup.unlock();
                if ( !e || e.length === 0 ) {
                    unlockInput( this.container.parentNode.parentNode );
                    w2alert( 'Объект не найден' );
                    return false;
                }
                this.overlayClear();
                this.placemarks = [];
                //Разбираем точку
                var bl = e[0]['BL'].split(' ');
                if (!bl || bl.length < 2) {
                    //w2alert('Объект не найден');
                    return false;
                }
                bl = bl.reverse();
                //Преобразовываем точку в LatLng
                var point = GWTK.toLatLng( bl[ 0 ], bl[ 1 ] );
                //Позиционируем карту в точке
                if ( options && options.callBackView && typeof options.callBackView === 'function' ) {
                    options.callBackView( { point: point, map: this } );
                } else {
                    this.setView( null, point, 17 );
                }
                drawObjectInLayer( bl.reverse() );
                dataForCallBack.address = e[ 0 ][ 'text' ];
                $( this.container.parentNode.parentNode ).find( 'input[name="objectaddress"]' ).val( e[ 0 ][ 'text' ] );
                Map.overlayRefresh();
            }
			
            function setObjectPoint( e, map ) {
                drawObjectInLayer( e.geo.reverse() );
                $( map.container.parentNode.parentNode ).find( 'input[name="objectcoord"]' ).val( e.geo.reverse().toString() );
            }
			
            function drawObjectInLayer( coord ) {
                graphicLayer.GeoJSON.features[ 0 ][ 'geometry' ][ 'coordinates' ] = coord;
                graphicLayer.drawMap(true);
                graphicLayer.update();
            }
			
            var title = options.title && options.title !== '' ? options.title : ' ';
			
            w2popup.open( {
                //Заголовок окна
                title: title,
                //признак модальности
                modal: true,
                showClose: true,
                //ширина
                width: $( window ).width() - 10,
                //высота
                height: $( window ).height() - 10,
                //тело окна
                body: '<table id="popup-table">' + inputObjectName + inputAddress + inputCoord + '</table>' +
				'<div  style="position: absolute; top: 90px; bottom: 0; left: 0; right: 0;"><div id="poUpMap" style="width: 100%; height: 100%;"></div></div>' +
				'<div style="border-radius: 4px; width: 30px; height: 60px; position: absolute; z-index: 999; bottom: 5px; left: 5px; background-color: #ffffff; border: 1px solid grey;">' +
				'<div name="popup-plus" style="cursor:pointer; width: 30px; height: 30px; border-bottom: 1px solid grey;" class="control-button-plus"></div>' +
				'<div name="popup-minus" style="cursor:pointer; width: 30px; height: 30px;" class="control-button-minus"></div>' +
				'</div>' + buttonApply,
                //обработчик открытия окна
                onOpen: function ( event ) {
                    event.onComplete = function ( e ) {
                        //Создаем экземпляр карты
                        Map = new GWTK.Map( "poUpMap", optionsMap );
                        //переопределяем метод для выбора
                        var objectPanel = Map.mapTool( 'objectPanel' );
                        w2ui[ objectPanel.gridName ].onSelect = function ( event ) {
                            event.onComplete = GWTK.Util.bind( function ( event ) {
                                var gid = null;
                                if ( event && event.gid ) {
                                    gid = event.gid;
                                }
                                if ( event.recid !== undefined || event.recid !== null || event.recid !== false ) {
                                    if ( this.gridName && w2ui[ this.gridName ] ) {
                                        var rec = w2ui[ this.gridName ].get( event.recid );
                                        if ( !rec ) {
                                            console.log( 'Records with recid ' + event.recid + 'not found' );
                                            return false;
                                        } else {
                                            gid = rec.gid;
                                        }
                                    }
                                }
                                var mapObject = this.map.selectedObjects.findobjectsByGid( gid );
                                var point = GWTK.toLatLng( mapObject.objectcenter.lat, mapObject.objectcenter.lng );
                                //Позиционируем карту в точке
                                this.map.setViewport( point );
                                drawObjectInLayer( [ mapObject.objectcenter.lng, mapObject.objectcenter.lat ] );
								
                                $( Map.container.parentNode.parentNode ).find( 'input[name="objectcoord"]' ).val( mapObject.objectcenter.lat + ',' + mapObject.objectcenter.lng );
                                $( Map.container.parentNode.parentNode ).find( 'input[name="objectaddress"]' ).val( rec.objectname );
								
                            }, objectPanel );
                        };
                        //удалили масштабеную линейку
                        $( Map.container ).find( '.scale-pane-table' ).remove();
                        //удалили плюсы минусы
                        $( Map.container ).find( '.panel-scaler' ).remove();
                        //создали экземпляры для поиска
                        Address = new GWTK.AddressGeocoding(Map, optionsMap.search_options.address.sources[0]);
                        ReverseGeocoding = new GWTK.ReverseGeocoding(Map, optionsMap.search_options.address.sources[0]);
                        $( Map.container ).find( '.toolbar-panel' ).empty();
                        graphicLayer = new GWTK.graphicLayer( Map, {
                            "id": 'svglayer-popup',
                            "alias": '',
                            "selectObject": "0",
                            "url": ""
                        } );
						
                        var geoJson = {
                            "type": "FeatureCollection",
                            "bbox": [
								38.44485282897271,
								55.84187988886492,
								38.448629379265675,
								55.844964061026932
                            ],
                            "features": [
								{
								    "type": "Feature",
								    "geometry": {
								        "type": "Point",
								        "coordinates": []
								    },
								    "properties": {
								        "id": "123",
								        "schema": null,
								        "code": "Point",
								        "key": "Point",
								        "name": "Маркер11",
								        "objecttype": "placemark"
								    },
								    "bbox": [
										38.44485282897271,
										55.84496406102693,
										38.44485282897271,
										55.84496406102693
								    ]
								}
                            ]
                        };
                        var style = {
                            "placemark": {
                                "name": "",
                                "marker": {
                                    "width": "30px",
                                    "height": "51px",
                                    "image": "<svg width='30px' height='51px' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink= 'http://www.w3.org/1999/xlink'><image xlink:href='" + GWTK.imgMarkerBlankRed + "' x='0' y='0' height='51px' width='30px'/></svg>",
                                    "centerX": "15",
                                    "centerY": "51"
                                }
                            }
                        };
                        graphicLayer.setStyle( {
                            typeField: 'objecttype',
                            style: style,
                            defaultStyle: null
                        } );
                        graphicLayer.loadFromGeoJson( geoJson );
						
                        var $table = $( '#popup-table' );
						
                        $( Map.container ).find('.objects-panel').css({boxSizing:'content-box'});
						
                        $( Map.container.parentNode.parentNode ).find( 'input[name="objectaddress"]' ).keyup( function ( e ) {
                            if ( e.keyCode === 13 ) {
                                $table.find( 'img[name="search-by-address"]' ).click();
                            }
                        } );
                        $( Map.container.parentNode.parentNode ).find( 'input[name="objectcoord"]' ).keyup( function ( e ) {
                            if ( e.keyCode === 13 ) {
                                $table.find( 'img[name="search-by-coord"]' ).click();
                            }
                        } );
						
                        $table.find( 'img[name="search-by-address"]' ).on( 'click', function () {
                            var address = $( Map.container.parentNode.parentNode ).find( 'input[name="objectaddress"]' ).val();
                            var tmpAddress = GWTK.Util.trim( address );
                            if ( !address || tmpAddress === '' ) {
                                w2alert( 'Введите адрес' );
                                return false;
                            }
                            Map.handlers.clearselect_button_click();
                            Address.search( address, queryParamsAddress, GWTK.Util.bind( searchAnswerByAddress, Map ) );
                            w2utils.lock($('.w2ui-msg-body'), { spinner: true, opacity : 0.5 });
                        } );
                        $table.find( 'img[name="search-by-coord"]' ).on( 'click', function () {
                            var coord = $( Map.container.parentNode.parentNode ).find( 'input[name="objectcoord"]' ).val().split( ',' ).reverse().toString();
                            var tmpCoord = GWTK.Util.trim( coord.toString() );
                            if ( !coord || tmpCoord === '' ) {
                                w2alert( 'Введите Координаты' );
                                return false;
                            }
                            Map.handlers.clearselect_button_click();
                            ReverseGeocoding.search( coord, queryParamsAddress, GWTK.Util.bind( searchAnswerByCoord, Map ) );
                            w2utils.lock($('.w2ui-msg-body'), { spinner: true, opacity : 0.5 });
                        } );
						
                        var $divPlus = $( Map.container.parentNode.parentNode ).find( 'div[name="popup-plus"]' );
                        if ( $divPlus && $divPlus.length > 0 ) {
                            $divPlus.on( 'click', function ( e ) {
                                Map.trigger( { phase: 'before', type: 'zoomIn', target: 'map', originalEvent: e } );
                            } );
                        }
                        var $divMinus = $( Map.container.parentNode.parentNode ).find( 'div[name="popup-minus"]' );
                        if ( $divMinus && $divMinus.length > 0 ) {
                            $divMinus.on( 'click', function ( e ) {
                                Map.trigger( { phase: 'before', type: 'zoomOut', target: 'map', originalEvent: e } );
                            } );
                        }
                        var $divSubmit = $( Map.container.parentNode.parentNode ).find( 'div[name="submit-popup"]' );
                        if ( $divSubmit && $divSubmit.length > 0 ) {
                            $divSubmit.on( 'click', function () {
                                var $coord = $( Map.container.parentNode.parentNode ).find( 'input[name="objectcoord"]' );
                                $coord.attr( 'disabled', false );
                                var $address = $( Map.container.parentNode.parentNode ).find( 'input[name="objectaddress"]' );
                                $address.attr( 'disabled', false );
                                if ( !$coord.val() ) {
                                    w2alert( "Уточните данные" );
                                    return false;
                                }
                                dataForCallBack.address = $address.val() || false;
                                dataForCallBack.coord = $coord.val().split( ',' );
                                options.callBack( dataForCallBack );
                                w2popup.close();
                            } );
                        }
                        //обновляем карту
                        Map.tiles.forceupdate();
                        if ( options.address && !options.coord ) {
                            w2popup.lock( '', true );
                            Address.search( options.address, queryParamsAddress, GWTK.Util.bind( searchAnswerByAddress, Map ) );
                        }
                        //поиск по адресу
                        if ( options.address && options.coord ) {
                            var point = GWTK.toLatLng( options.coord[ 0 ], options.coord[ 1 ] );
                            //Позиционируем карту в точке
                            Map.setViewport( point );
                            drawObjectInLayer( options.coord.reverse() );
                        }
                        //поиск по координатам
                        if ( options.coord && !options.address ) {
                            var point = GWTK.toLatLng( options.coord[ 0 ], options.coord[ 1 ] );
                            //Позиционируем карту в точке
                            Map.setViewport( point );
                            drawObjectInLayer( options.coord.reverse() );
                        }
                        $( Map.overlayPane ).on( 'mapclick', function ( e ) {
                            setObjectPoint( e, Map );
                        } );
                    };
                }
            } );
        }
    };
    /**
	 * Класс для управления картами СиС в приложении
	 * @param options {Object}
	 *{
	 *       map: this.map,
	 *       buttonTitle: 'Карты Сил и средств',
	 *       mapIcon: 'icon-page',
	 *       groupIcon: 'icon-folder',
	 *       expanded: true,
	 *       header: 'Слои',
	 *       legend: true,
	 *       options: this.map.options.mapforce
	 *}
	 * @constructor
	 */
    GWTK.SidebarMapControl = function ( options ) {
        this.map = options.map;
        this.options = options.options;

        if (!this.options.url ) {
            if (this.map.options.url) {
                if (this.map.options.url.indexOf('?') === -1) {
                    this.options.url = this.map.options.url + '?';
                } else {
                    this.options.url = this.map.options.url + '?';
                }
            }
        }
        if (!this.options.url)
            return;

        this.toolname = "sidebarmapcontrol";
        this.map.maptools.push( this );
        this.gridName = (new Date()).getTime() + '_map_power';
        this.groupId = (new Date()).getTime() + '_group_map_power';
        this.groupIdNodes = (new Date()).getTime() + '_group_map_power_nodes';
        this.virtualLayerrs = new GWTK.VirtualLayer( this.map, this.options, GWTK.Util.bind( this.parseResponse, this ) );
        // this.virtualLayerrs.layerRequest( { maplayer: { id: this.options.id, act: 'update' } } );
		
        this.mapContent = this.map.mapTool( 'mapcontent' );
		
        this.button = null;
        this.$button = null;
        this.buttonTitle = options.buttonTitle || 'Карты Сил и Средств';
		
        this.panel = null;
        this.$panel = null;
		
        this.mapIcon = options.mapIcon || '';
        this.groupIcon = options.groupIcon || '';
        this.header = options.header || '';
        this.expanded = options.expanded;
        this.legend = options.legend;
		
        this.init();
    };
    GWTK.SidebarMapControl.prototype = {
        /**
		 * Инициализация
		 */
        init: function () {
            this.createMapPowerGroup();
            this.mapContent.$mapContentPane.find( '.panel-info-header' ).find( 'span' ).html( this.header );
            if ( this.legend ) {
                $( this.map.eventPane ).on( 'loadclassifier', GWTK.Util.bind( function ( e ) {
                    var node = w2ui[ this.mapContent.name ].get( e.legend.id );
                    if ( node ) {
                        var sl = GWTK.Util.shortcutLegend( e.legend );
                        w2ui[ this.mapContent.name ].add( node, sl.items );
                    }
                }, this ) );
            }
        },
        /**
		 * Создать группу в составе карты
		 */
        createMapPowerGroup: function () {
            var text = 'Карты Сил и Средств <button onclick="w2ui[\'' + this.mapContent.name + '\'].refreshMapPowerList()" class="sidebar-node-button sidebar-node-refresh-button" style="margin-right: 5px;"></button>';
            w2ui[ this.mapContent.name ].refreshMapPowerList = GWTK.Util.bind( this.refreshMapPowerList, this );
            w2ui[ this.mapContent.name ].add( {
                id: this.groupId,
                text: 'Карты Сил и Средств',
                group: true,
                expanded: true,
                nodes: [
                {
                    id: this.groupIdNodes,
                    gClickable: true,
                    text: text,
                    img: this.groupIcon,
                    expanded: this.expanded
                }
                ]
            } );
        },
		
        refreshMapPowerList: function () {
            this.virtualLayerrs.layerRequest( { maplayer: { id: this.options.id, act: 'update' } } );
        },
		
        /**
		 * Обработчик ответа компонента GWTK.VirtualLayer после запроса
		 * @param e - ответ сервера
		 * @returns {boolean}
		 */
        parseResponse: function ( e ) {
            if ( !e || !e.maplayer ) {
                return false;
            }
            var layer = this.map.tiles.getLayerByxId( e.maplayer.id );
            if ( this.legend && layer && layer.classifier ) {
                layer.classifier.getlegend( {
                    size: '16',
                    BYXSD: '0'
                } );
            }
            this.getSheetName( layer );
        },
        /**
		 * Запрос имени слоя у сервиса
		 * @param layer - объект слоя полученный функцией this.map.tiles.getLayerByxId( id );
		 */
        getSheetName: function ( layer ) {
            var parser = GWTK.Util.parseUrl( this.options.url );
            var url = parser.protocol + "//" + parser.host;
            if ( parser.port.length > 0 ) {
                url += ":" + parser.port;
            }
            url += parser.path;
            url = url + "?SERVICE=WFS&RESTMETHOD=getsheetname&LAYER_ID=" + layer.idLayer;
            var that = this;
            $.ajax( {
                url: url,
                type: 'get',
                crossDomain: 'true',
                dataType: "html",
                error: function () {
                    console.log( 'error' );
                },
                success: function ( data ) {
                    var $doc = $.parseXML( data );
                    var $xml = $( $doc );
                    $xml.find( 'member' ).each( function () {
                        var xname = $( this ).find( 'name' );
                        var idlayer = $( xname ).text();
                        if ( idlayer && idlayer.length > 0 ) {
                            var xstr = $( this ).find( 'string' );
                            var sheet = xstr.text();
                            if ( sheet && sheet.length > 0 ) {
                                if ( !layer ) {
                                    console.log( 'RESTMETHOD GetSheetName response ---> layer ' + idlayer + " is not contained in the Map!" );
                                } else {
                                    layer.selectObject = 1;
                                    layer.alias = sheet;
                                    layer.areaSeek = 1;
                                    layer.mapSheets.sheets.push( sheet );
                                    that.addNodeFromLayer( layer );
                                }
                                return false;
                            }
                        }
                    } );
                }
            } );
        },
        /**
		 * Добавить узел в список
		 * @param layer - объект слоя полученный функцией this.map.tiles.getLayerByxId( id );
		 * @returns {boolean}
		 */
        addNodeFromLayer: function ( layer ) {
            if ( !layer ) {
                return false;
            }
            var node = this.createNodeFromLayer( layer );
            if ( node ) {
                w2ui[ this.mapContent.name ].add( this.groupIdNodes, node );
            }
        },
        /**
		 * Создать объект для вставки в дерево
		 * @param layer - объект слоя полученный функцией this.map.tiles.getLayerByxId( id );
		 * @returns {*} - возвращает объект для вставки в состав карты
		 */
        createNodeFromLayer: function ( layer ) {
            if ( !layer || !layer.alias ) {
                return false;
            }
            return {
                id: layer.xId,
                img: this.mapIcon,
                text: layer.alias,
                gClickable: true
            };
        },
        /**
		 * Показать панель
		 */
        show: function () {
            this.mapContent.$button.addClass( 'control-button-active' );
            this.mapContent.$mapContentPane.show();
            if ( w2ui[ this.mapContent.name ] ) {
                w2ui[ this.mapContent.name ].resize();
            }
        },
        /**
		 * Скрыть панель
		 */
        hide: function () {
            this.mapContent.$button.removeClass( 'control-button-active' );
            this.mapContent.$mapContentPane.hide();
        },
        toggle: function () {
            this.mapContent.$button.click();
        },
        /**
		 * Получить объект дерева
		 * @returns {boolean}
		 */
        getTree: function () {
            return w2ui[ this.mapContent.name ] || false;
        },
        /**
		 * Добавить легенду
		 * @param legend
		 * @returns {boolean}
		 */
        addLegend: function ( legend ) {
            if ( !legend ) {
                return false;
            }
            var node = w2ui[ this.mapContent.name ].get( legend.id );
            if ( node ) {
                w2ui[ this.mapContent.name ].add( node, legend.items );
            }
        }
    };
    /**
	 * Класс нанесения локальных объектов на карту для фильтрации событий и происшествий
	 * @param map
	 * @param params
	 * @returns {{}}
	 * @constructor
	 */
    GWTK.DrawingEditor = function ( map, selectorParentId ) {
        if ( !map ) {
            return {};
        }
        this.map = map;
        this.selectorParentId = selectorParentId;
        /**
		 * Переменные для слоя на котороый наносятся объекты для фильтрации событий
		 */
        this.drawingEditorButton = null;
        this.editorDrawingLayerId = "eventfilter" + (new Date()).getTime();
        this.editorDrawingLayer = null;
        /**
		 * Переменные для слоя который отображает зону
		 */
        this.viewDrawingLayerId = "eventfilterview" + (new Date()).getTime();
        this.viewDrawingLayer = null;
        /**
		 * Переменная для слоя на котором визуализируется зона
		 */
        this.viewDrawingLayerBufferId = "eventfilterviewbuffer" + (new Date()).getTime();
        this.viewDrawingLayerBuffer = null;
		
        this.init();
    };
    GWTK.DrawingEditor.prototype = {
        /**
		 * Функция инициализации
		 */
        init: function () {
            this.createViewDrawingLayerBuffer();
            this.createEditorDrawingLayer();
            this.createViewDrawingLayer();
			
            $( this.map.eventPane ).trigger( {
            	type: 'layerlistchanged',
            	maplayer: {
            		'id': this.editorDrawingLayer.xId,
            		'act': 'add',
            		'editingParam': this.editorDrawingLayer.editingParam
            	}
            } );
			
            $(this.map.eventPane).on('updatemapobject', GWTK.Util.bind(function (e) {

                // если пользовательский интерфейс
                var editor = this.map.mapeditor;
                if (editor.mapeditorTask.userinterface && editor.mapeditorTask.userinterface.onUpdateMapObject) {
                    editor.mapeditorTask.userinterface.onUpdateMapObject(e);
                }

                this.drawObjectsWithZoneInEditor( {
                    json: e.mapobject.oJSON,
                    operation: e.regime
                } );
            }, this));

        },

        destroy: function () {
            this.viewDrawingLayerBuffer.remove();
            this.viewDrawingLayerBuffer = null;
            this.viewDrawingLayer.remove();
            this.viewDrawingLayer = null;
            this.editorDrawingLayer.remove();
            this.editorDrawingLayer = null;
        },

        // открыть панель редактора
        openEditorPanel: function (json, areaname) {

            // стереть изображения всех слоев
            this.clearLayers();

            // создание слоя для редактирования
            this.createEditorDrawingLayer(json);

            var editor = this.map.mapeditor;
            editor.param.userinterface = "GWTK.mapeditorUserInterfaceTask";

            // переопределение функций mapeditor
            editor.setTask = GWTK.Util.bind(this.setMapEditor, editor);
            if (!editor.mapeditorTask) {
                editor.mapeditorTask = new GWTK.mapeditorTask(editor.id, editor.map, editor.param);
                if (editor.mapeditorTask.error) {
                    editor.mapeditorTask = null;
                    return;
                }

                // переопределение функций mapeditorTask
                editor.mapeditorTask.selectorParentId = this.selectorParentId;
                editor.mapeditorTask.createPane = GWTK.Util.bind(this.createPane, editor.mapeditorTask);
                editor.mapeditorTask.onDocumentReady = GWTK.Util.bind(this.onDocumentReady, editor.mapeditorTask);
                // старт mapeditorTask
                if (!editor.setTask(editor.mapeditorTask)) {
                    editor.mapeditorTask = null;
                    return;
                }

            }

            if (editor.mapeditorTask.userinterface && editor.mapeditorTask.userinterface.createPaneInfoObject) {
                editor.mapeditorTask.userinterface.createPaneInfoObject("create", { 'geojson': json, 'areaname': areaname });
            }

        },

        // закрыть панель редактора
        closeEditorPanel: function (fn_callback) {
            var editor = this.map.mapeditor;
            if (editor.mapeditorTask && editor.mapeditorTask.userinterface && editor.mapeditorTask.userinterface.closeMapeditorTask) {
                editor.mapeditorTask.userinterface.closeMapeditorTask('cancel', fn_callback);
            }

            // стереть изображения всех слоев
            this.clearLayers();
        },

        /**
		 * Отрисоввать объекты слушатель события нанесения объектов
		 * @param obj объект с полем json - json объект с объектами карты, operation - перация
		 * {
		 *
		 * }
		 * @return {boolean}
		 */
        drawObjectsInView: function ( obj ) {
            if ( !obj || !obj.json )return false;
            var featureCollection = this.clone( obj.json );
            this.clearIdForExportObjects( featureCollection );
            var bufferFeatures = [];
            if ( obj.operation === 'create' || obj.operation === 'replace' ) {
                for ( var i = 0; i < featureCollection.features.length; i++ ) {
                    if ( this.isZoneObject( featureCollection.features[ i ] ) ) {
                        var bufferFeature = this.clone( featureCollection.features[ i ] );
                        this.setBufferParams( bufferFeature );
                        bufferFeatures.push( bufferFeature );
                    }
                }
                featureCollection.features = featureCollection.features.concat( bufferFeatures );
               // this.viewDrawingLayer.updateFromGeoJson(featureCollection);
                this.viewDrawingLayer.loadFromGeoJson(featureCollection, null, true);

            }
            if ( obj.operation === 'delete' ) {
                this.viewDrawingLayer.deleteObject( featureCollection );
            }
        },
        /**
		 * Отрисовать объекты только для отображения
		 * @param featureCollection
		 */
        drawObjectsForView: function ( featureCollection ) {
            this.viewDrawingLayer.clearLayer();
			
            var viewfeatureCollection = this.clone(featureCollection);
            var bufferFeatures = [];
            for ( var i = 0; i < featureCollection.features.length; i++ ) {
                if ( this.isZoneObject( featureCollection.features[ i ] ) ) {
                    var bufferFeature = this.clone( featureCollection.features[ i ] );
                    this.setBufferParams( bufferFeature );
                    bufferFeatures.push( bufferFeature );
                }
            }
            /**
			 * unshift нужен для правильного выбора объектов локального слоя с буферной зоной
			 */
            for ( var k = 0; k < bufferFeatures.length; k++ ) {
                //featureCollection.features.unshift( bufferFeatures[ k ] );
                viewfeatureCollection.features.unshift(bufferFeatures[k]);
            }
			
            //this.viewDrawingLayer.updateFromGeoJson( viewfeatureCollection );
            this.viewDrawingLayer.loadFromGeoJson(viewfeatureCollection, null, true);

        },

        drawObjectsWithZoneInEditor: function (obj) {
            if (!obj || !obj.json) return false;
            var featureCollection = this.clone(obj.json);
            featureCollection = this.clearViewJson(featureCollection);
            var bufferFeatures = [];
            if (obj.operation === 'create' || obj.operation === 'replace') {
                for (var i = 0; i < featureCollection.features.length; i++) {
                    if (this.isZoneObject(featureCollection.features[i])) {
                        var bufferFeature = this.clone(featureCollection.features[i]);
                        this.setBufferParams(bufferFeature);
                        bufferFeatures.push(bufferFeature);
                    }
                }
                featureCollection.features = bufferFeatures;

                // альтенатива для updateFromGeoJson (в IE при большом округлении не отрисовывает svg, поскольку габариты 180) 
                this.viewDrawingLayerBuffer.addFeature(featureCollection.features[0]);
                this.viewDrawingLayerBuffer.drawMap(true);


                ////this.viewDrawingLayerBuffer.updateFromGeoJson(featureCollection);
                //this.viewDrawingLayerBuffer.loadFromGeoJson(featureCollection, null, true);

            }
            if (obj.operation === 'delete') {
                for (i = 0; i < featureCollection.features.length; i++) {
                    if (this.isZoneObject(featureCollection.features[i])) {
                        bufferFeature = this.clone(featureCollection.features[i]);
                        this.setBufferParams(bufferFeature);
                        this.viewDrawingLayerBuffer.deleteObjectById(bufferFeature['properties']['id']);
                    }
                }
                this.viewDrawingLayerBuffer.drawMap(true);
            }
        },

        // Отрисовка слоя буферных зон
        drawAllObjectsWithZoneInEditor: function (json) {
            if ( !json ) return false;
            var featureCollection = this.clone( json );
            var bufferFeatures = [];
            for ( var i = 0; i < featureCollection.features.length; i++ ) {
                if ( this.isZoneObject( featureCollection.features[ i ] ) ) {
                    var bufferFeature = this.clone( featureCollection.features[ i ] );
                    this.setBufferParams( bufferFeature );
                    bufferFeatures.push( bufferFeature );
                }
            }
            featureCollection.features = bufferFeatures;
            //this.viewDrawingLayerBuffer.updateFromGeoJson( featureCollection );
            this.viewDrawingLayerBuffer.loadFromGeoJson(featureCollection, null, true);
        },
		

 		/**
		 * Установить объекты в состояние редактрования
		 */
        setObjectsToEdit: function (json, areaname) {
            this.openEditorPanel(null, json, areaname);
		},
		/**
		 *
		 */
		clearDrawingLayer: function () {
			this.editorDrawingLayer.clearLayer();
		},
		clearDrawingLayerBuffer: function () {
			this.viewDrawingLayerBuffer.clearLayer();
		},
		clearViewDrawingLayer: function () {
			this.viewDrawingLayer.clearLayer();
		},

		clearLayers: function () {
		    if (this.editorDrawingLayer)
		        this.editorDrawingLayer.clearLayer();
		    if (this.viewDrawingLayerBuffer)
		        this.viewDrawingLayerBuffer.clearLayer();
		    if (this.viewDrawingLayer)
		        this.viewDrawingLayer.clearLayer();
		},

		/**
		 * Клонировать объект удалив ссылку
		 * @param obj
		 * @returns {boolean}
		 */
		clone: function ( obj ) {
			if ( !obj )return false;
			return JSON.parse( JSON.stringify( obj ) );
		},
		/**
		 * Создать идентификатор для буферной зоны
		 * @param feature
		 */
		createBufferZoneId: function ( feature ) {
			if ( !feature )return false;
			return feature[ 'properties' ][ 'id' ] + 'buffer';
		},
		/**
		 * Установить параметры объекту карты для визуализации буферной зоны
		 * @param feature
		 * @returns {boolean}
		 */
		setBufferParams: function ( feature ) {
			if ( !feature )return false;
			feature[ 'properties' ][ 'vector-effect' ] = 'none';
			feature[ 'properties' ][ 'stroke' ] = 'red';
			feature[ 'properties' ][ 'stroke-opacity-buffer' ] = '0.50';
			feature[ 'properties' ][ 'id' ] = this.createBufferZoneId( feature );
			feature[ 'properties' ][ 'renderzone' ] = true;
			delete feature[ "style" ];
		},
		/**
		 * Проверить возможность визуализации буферной зоны
		 * @param feature
		 * @returns {*}
		 */
		isZoneObject: function ( feature ) {
			if ( !feature )return false;
			return feature[ 'properties' ][ 'zonewidth' ] && feature[ 'properties' ][ 'zonewidth' ] !== undefined;
		},
		/**
		 * Инициализировать события
		 */
		initEvents: function () {
		
		},
		/**
		 * Создать слой для нанаесения объектов
		 */
		createEditorDrawingLayer: function (geojson) {
            // если существует, то очистить, иначе создать
		    if (this.editorDrawingLayer) {
		        if (geojson) {
		            this.editorDrawingLayer.loadFromGeoJson(geojson, null, true);
		            // Отрисовать буферные зоны
		            this.drawAllObjectsWithZoneInEditor(geojson);
		        }
		        else
		            this.editorDrawingLayer.clearLayer();
		        return;
		    }
            
			var options = {
				"id": this.editorDrawingLayerId,
				"selectObject": "0"
			};
			var editingParams = {
				"editing": true
			};
			this.editorDrawingLayer = new GWTK.graphicLayer( this.map, options, editingParams );
			this.editorDrawingLayer.layerContainer.drawingMethod.addClassFields( {
				roundout: {
					rounder: new GWTK.SvgPathRound( this.map )
							}
			});

            //// Переопределение функций
			//this.editorDrawingLayer.layerContainer.drawingMethod.drawObject =
            //GWTK.Util.bind(this.drawObject, this.editorDrawingLayer.layerContainer.drawingMethod);

			if (geojson) {
			    this.editorDrawingLayer.loadFromGeoJson(geojson, null, true);
			    // Отрисовать буферные зоны
			    this.drawAllObjectsWithZoneInEditor(geojson);
            }

		},

		/**
		 * Создать слой для визуализации буферной зоны
		 */
		createViewDrawingLayer: function () {
			var options = {
				"id": this.viewDrawingLayerId,
				"alias": '',
				"selectObject": "0"
				};
			var editingParams = {
				"editing": true
			};
			this.viewDrawingLayer = new GWTK.graphicLayer( this.map, options, editingParams );
			this.viewDrawingLayer.layerContainer.drawingMethod.addClassFields( {
				roundout: {
					rounder: new GWTK.SvgPathRound( this.map )
				}
			});

			//this.viewDrawingLayer.layerContainer.drawingMethod.drawObject =
            //GWTK.Util.bind(this.drawObject, this.viewDrawingLayer.layerContainer.drawingMethod);
		},
		/**
		 * Создать слой для визуализации буферных зон при нанесении объектов на карту
		 * (до того как пользователь закрыл окно визуализация происходит на этом слое)
		 */
		createViewDrawingLayerBuffer: function () {
			var options = {
				"id": this.viewDrawingLayerBufferId,
				"alias": '',
				"selectObject": "0"
			};
			var editingParams = {
				"editing": false
			};
			this.viewDrawingLayerBuffer = new GWTK.graphicLayer( this.map, options, editingParams );
			this.viewDrawingLayerBuffer.layerContainer.drawingMethod.addClassFields( {
				roundout: {
					rounder: new GWTK.SvgPathRound( this.map )
				}
			});

			//this.viewDrawingLayerBuffer.layerContainer.drawingMethod.drawObject =
            //GWTK.Util.bind(this.drawObject, this.viewDrawingLayerBuffer.layerContainer.drawingMethod);
		},

		/**
		 * Получить JSON нанесенных объектов
		 * @returns {*}
		 */
		getGeoJson: function () {
		    if (!this.editorDrawingLayer || !this.editorDrawingLayer.GeoJSON) {
		        return {
		            "type": "FeatureCollection",
		            "features": []
		        };
				//return false;
			}
			var json = this.clone( this.editorDrawingLayer.GeoJSON );
			json = this.clearViewJson( json );json = this.clearIdForExportObjects(json);
			return json;
			//return json && json.features && json.features.length > 0 ? json : false;
		},
		/**
		 * Очистить и получить json с идентификаторами объектов (без слоя)
		 * @param json
		 * @return {boolean}
		 */
		clearIdForExportObjects: function ( json ) {
			if ( !json ) return false;
			for ( var i = 0; i < json.features.length; i++ ) {
				if ( json.features[ i ][ 'properties' ][ 'id' ] ) {
					var id = json.features[ i ][ 'properties' ][ 'id' ].split( '.' );
					if ( id.length > 1 ) {
						json.features[ i ][ 'properties' ][ 'id' ] = id[ 1 ];
					}
				}
			}
			return json;
		},
		/**
		 * Очистить и получить "чистый" json без объекта для отрисовки зоны
		 * @param json - FeatureCollection
		 * @return {*}
		 */
		clearViewJson: function ( json ) {
			if ( !json )return false;
			json = this.clone( json );
			var tmpArr = [];
			for ( var i = 0; i < json.features.length; i++ ) {
				if ( json.features[ i ][ 'properties' ][ 'renderzone' ] === undefined ) {
					tmpArr.push( json.features[ i ] )
				}
			}
			json.features = tmpArr;
			return json;
		}

	};
	/**
	 * Класс визуализации буферной зоны
	 * @param map - экземпляр карты
	 * @constructor
	 */
	GWTK.SvgPathRound = function ( map ) {
		this.map = map;
	};
	GWTK.SvgPathRound.prototype = {
		/**
		 * Преобразовать координаты точки (pixel to Geo)
		 * @method toGeo
		 * @param point {GWTK.point}, pixels
		 */
		toGeo: function ( point ) {
			if ( !point ) return null;
			point = GWTK.point( point );
			var coord = this.map.tiles.getLayersPointProjected( point );
			var geo = GWTK.projection.xy2geo( this.map.options.crs, coord.y, coord.x );
			geo = GWTK.toLatLng( geo );
			return geo;
		},
		/**
		 * Получить значение в пикселях
		 * @param distance - дистанция в метрах
		 * @param zoom
		 * @returns {number} возвращает пиксели
		 */
		getWidthInPxFromMeters: function ( distance, zoom ) {
			var scale = this.map.getZoomScale( this.map.options.tilematrix );
			var pixelSpan = GWTK.tileView.getpixelSpan( scale, false );
			var pp = GWTK.point( 200, 200 ),
				pp2 = GWTK.point( 250, 250 ),
				pp_meter = this.map.tiles.getLayersPointProjected( pp ),
				pp2_meter = this.map.tiles.getLayersPointProjected( pp2 ),
				pp_geo = this.toGeo( pp );
			var d_meter = pp_meter.distanceTo( pp2_meter ),
				d_geo = pp_geo.distanceTo( this.toGeo( pp2 ) ),
				geo_ratio = d_meter / d_geo;
			return (distance / pixelSpan) * geo_ratio;
		}

	};



/********************************** Соколова Т. В. **** 15/01/18 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2017              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*  Класс реализации пользовательского интерфейса редактора карты   *
*                                                                  *
*******************************************************************/
	if (window.GWTK) {
	    /**
        * Пользовательский интерфейс редактора карты   
        * @class GWTK.mapeditorUserInterfaceTask
        * @constructor GWTK.mapeditorUserInterfaceTask
        * @param mapeditorTask {Object}  - Задача редактор карты  GWTK.mapeditorTask
        * @param options {Object} Параметры 
        * {"areaname": ""            // названиие области
        *   , "geojson": "" }        // Список набора объектов в формате geojson
        * при открытии и закрытии редактора карты инициируется триггер GWTK.mapeditorTask {
        *{ 
        *operation, //  тип операции ('closeTask' / 'openTask')
        *params: 
        *     {
        *    type: action, //  'save'/'cancel' 
        *    area: {
        *        mapobjects: json, // объект geojson набора объектов
        *        name: areaname // имя обрасти (набора)
        *            }
        *     }
        *}
        **/
	    // ===============================================================


	    GWTK.mapeditorUserInterfaceTask = function (mapeditorTask, options) {
	        this.error = true;

	        if (!mapeditorTask || !(mapeditorTask instanceof GWTK.mapeditorTask))
	            return;
	        this.error = false;
	        this.mapeditorTask = mapeditorTask;
	        this.map = mapeditorTask.map;
	        this.areaname = '';
	        if (options && options.areaname)
	            this.areaname = options.areaname;

	        // инициализация geojson
	        if (options && options.geojson) 
	            this.initgeojson(options.geojson);

	        // идентификатор для диалога списка объектов
	        this.objectslistId = 'objectslist' + GWTK.Util.randomInt(150, 200);

	        // Класс выделения объектов для отрисовки, чтоб не нагружать стандартный
	        this.selectFeatures = new GWTK.selectedFeatures(this.map, null,
                 {
                     "stroke": "#00BA00",
                     "stroke-width": "3px",
                     "stroke-opacity": "0.85",
                     "vector-effect": "non-scaling-stroke",
                     "fill": "gray",
                     "background": "",
                     "background-size": "auto auto",
                     "fill-opacity": "0.3",
                     "font-family": "Verdana",
                     "font-size": "12px",
                     "letter-spacing": "1",
                     "startOffset": "2%",
                     "text": ""
                 }
                );
	        this.selectFeatures.init();

	        // Массивы для получения номеров
	        this.countObject = 1000000;
	        this.nameRoute = 'Маршрут';
	        this.nameSquare = 'Площадь';
	        // Ширина зоны по умолчанию
	        this.zonedefault = 10;
	        // Изменения в нсборе
	        this._ischange = false;

            // Переопределяемые функции
            // закрытие окна по кресту
	        this.mapeditorTask.updatetitle = GWTK.Util.bind(this.updatetitle, this.mapeditorTask);
	        this.mapeditorTask.setResizablePane = GWTK.Util.bind(this.setResizablePane, this.mapeditorTask);

            // bind
	        this.onMapeditorTask = GWTK.Util.bind(this.onMapeditorTask, this);

	        // Инициализация класса GWTK.MapeditorCreatingTask
	        GWTK.MapeditorCreatingTask.prototype.init = function () {
	            var mapeditorTask = this.mapeditorTask;
	            if (!mapeditorTask) return;

	            if (!this.subjectnumber) {
	                // Очистим историю
	                mapeditorTask.history.clear();
	                mapeditorTask.ischange(false);

	                // Сброс выделения
	                if (!this.selectobject)
	                    this.map.handlers.clearselect_button_click();

	                // пользовательский интерфейс
	                if (mapeditorTask.userinterface) {
	                    return true;
	                }
	            }
	            else {
	                // Продолжение создания
	                this.startCreation(this.subjectnumber);
	            }

	            return true;
	        }

	        /**
            * Установка объекта для редактирования для класса GWTK.mapeditorEditingTask
            * @method setobject
            * @param selectobject {Object} GWTK.mapobject 
            */
	        // ===============================================================
	        GWTK.mapeditorEditingTask.prototype.setobject = function (selectobject) {
	            if (!selectobject) return;

	            var mapeditorTask = this.mapeditorTask;
	            if (!mapeditorTask) return;

	            if (!selectobject.geometry || selectobject.geometry.count() <= 0) {
	                // Попробуем найти
	                var sobject = this.map.objectManager.selectedFeatures.findobjectsById(selectobject.maplayerid, selectobject.gid);
	                if (!sobject || !sobject.geometry || sobject.geometry.count() <= 0) {
	                    w2alert(w2utils.lang('An object is no metric information'));
	                    return;
	                }
	                var find = mapeditorTask.drawSelectFeatures.mapobjects.find(
                        function (element, index, array) {
                            if (element.gid == sobject.gid) {
                                mapeditorTask.drawSelectFeatures.mapobjects.splice(index, 1, sobject.clone());
                                return selectobject = mapeditorTask.drawSelectFeatures.mapobjects[index];
                            }
                        });

	                if (!find) {
	                    w2alert(w2utils.lang('An object is no metric information'));
	                    return;
	                }
	            }

	            // Клон объекта на редактирование
	            mapeditorTask.editobjects[0] = selectobject.clone();

	            // Создадим панель для отрисовки объекта
	            if (!mapeditorTask.createdrawpanel())
	                return;

	            mapeditorTask.ischange(false);

	            // Если есть пользовательский интерфейс не выводить информацию по объекту
	            if (!mapeditorTask.userinterface) {
	                // Откроем информационное окно
	                mapeditorTask.createPaneInfoObject('edit');
	            }

	            // запустим процесс редактирования
	            this.processEdition();

	            // Запросим объекты окружения, предварительно сделав недоступным окно информации
	            mapeditorTask.paneInfoObjectDisabled(true);
	            if (selectobject.gid)
	                mapeditorTask.topology.searchObjectsByAreaFrame(null, [selectobject.gid], 'edit', mapeditorTask.selectlayersid, true,
                        w2utils.lang("Edit the chosen object, moving contour points") + '. ' + w2utils.lang("Save") + " (Сtrl+S)");
	            return true;
	        }


            // Переопределение всплывающенго меню
	        GWTK.MapeditorEditingAction.prototype.popupmenu = this.popupmenuEditingAction;

	    };

	    GWTK.mapeditorUserInterfaceTask.prototype = {

	        // инициализация geojson
	        initgeojson: function (geojson) {
	            if (geojson) {
	                this.geojson = GWTK.DrawingEditor.prototype.clone(geojson);
	                this.geojsonInit = GWTK.DrawingEditor.prototype.clone(geojson);
	            }
	            else  {
	                this.geojson =  {
	                    "type": "FeatureCollection",
	                    "features": []
	                };
	                this.geojsonInit =  {
	                    "type": "FeatureCollection",
	                    "features": []
	                };
                }
	        },

            // разрушение компонента
	        destroy: function () {
	            this.destroyPane();
	            this.selectFeatures.destroy();

	        },

	        destroyPane: function () {

	            if (w2ui['width_' + this.objectslistId])
	                w2ui['width_' + this.objectslistId].destroy(); // зона

	            if (w2ui['grid_' + this.objectslistId])
	                w2ui['grid_' + this.objectslistId].destroy();  // грид

	            if (w2ui[this.formId]) {
	                w2ui[this.formId].destroy();           // форма
	            }

	            $('#' + this.mapeditorTask.selectgraphobjectsId).remove();

	            // очистим список
	            this.selectFeatures.clear();

	            // Массивы для получения номеров
	            this.numberRoute = [];
	            this.numberSquare = [];

	            this._ischange = false;

	            // отменить изменение видимости слоя видимости слоев
	            $(this.map.eventPane).on('visibilitychanged', this.mapeditorTask.onVisibilityChanged);


	            //$(this.map.mapPane).css("button.btn", this.cssOld);

	        },


	        // инициализация данных панели 
	        initPane: function (regime, options) {
	            // отменить изменение видимости слоя видимости слоев
	            $(this.map.eventPane).off('visibilitychanged', this.mapeditorTask.onVisibilityChanged);

	            // Массивы для получения номеров
	            for (var i = 0; i < this.countObject; i++) {
	                this.numberRoute.push(false);
	                this.numberSquare.push(false);
	            }
	            this.regime = regime;

                // Название области
	            this.areaname = (options.areaname) ? options.areaname : '';
	            // инициализировать geojson
	            this.initgeojson(options.geojson);

	            // Если есть, определим слой
	            var layer = this.getlayer();

	            // Добавить объекты в набор
	            this.selectFeatures.addJsonObjects(this.geojson, layer);

	            // Инициировать массив номеров
	            for (var i = 0; i < this.selectFeatures.mapobjects.length; i++) {
	                var el = this.identifyname(this.selectFeatures.mapobjects[i].name);
	                if (el && el.index >= 0) {
	                    el.numbers[el.index] = true;
	                }
	            }
	        },

	        // Функция для создания пользовательского интерфейса для Редактора карты
	        createPaneInfoObject: function (regime, options) {

	            // Удалим существущую панель
	            this.destroyPane();
	            if (!this.mapeditorTask.panel)
	                return;

	            // Добавим панель пользователя
	            $(this.mapeditorTask.panel).append(
                    '<div class = "edContainerInfo" id="' + this.mapeditorTask.selectgraphobjectsId + '">' +
                    '<table align="left" width="100%" cellpadding="5px">' +
                        '<tr align="left">' +
                            '<td width="50%"> ' +
                                '<table align="left" width="100%" id="createmode_' + this.objectslistId + '">' +
                                    '<tr align="center">' +
                                        '<td colspan = "5"> ' +
                                            '<div style="padding-left:0px; color:#868b92;">' + w2utils.lang("Way of drawing") + '</div>' +
                                        '</td> ' +
                                    '</tr>' +
                                    '<tr align="left">' +
                                        '<td width="50px"> ' +
                                        '</td> ' +
                                        '<td> ' +
                                            '<div class="control-button-edit-method control-button-edit edcrmethod_free_line clickable create" Title="' + w2utils.lang("Any contour") + '"> </div> ' +  // произвольный контур
                                        '</td> ' +
                                        '<td> ' +
                                            '<div class="control-button-edit-method control-button-edit edcrmethod_inclined_rectangle clickable create" Title="' + w2utils.lang("Inclined rectangle") + '"> </div> ' +  // произвольный контур
                                        '</td> ' +
                                        '<td> ' +
                                            '<div class="control-button-edit-method control-button-edit edcrmethod_circle clickable create" Title="' + w2utils.lang("Circle") + '"> </div> ' +  // круг
                                        '</td> ' +
                                        '<td width="50px"> ' +
                                        '</td> ' +
                                    '</tr>' +
                                '</table>' +
                            '</td> ' +
                            '<td width="50%"> ' +
                                '<table align="center" width="100%" id="editmode_' + this.objectslistId + '">' +
                                    '<tr align="center">' +
                                        '<td colspan = "3"> ' +
                                            '<div style="text-align:center; padding-left:0px; color:#868b92;">' + w2utils.lang("Editing mode") + '</div>' +
                                        '</td> ' +
                                    '</tr>' +
                                    '<tr align="center">' +
                                        '<td> ' +
                                            '<div class="control-button-edit-method control-button-edit ededmethod_moveobject clickable editor" Title="' + w2utils.lang("Move object") + '"> </div> ' +  // перемещение объекта
                                        '</td> ' +
                                    '</tr>' +
                                '</table>' +
                            '</td> ' +
                          '</tr>' +
                          // ширина зоны
                          '<tr align="center" id="zone_' + this.objectslistId + '">' +
                            '<td width="100%" colspan=2> ' +
                            '<div class="w2ui-field">' +
                                '<label style= "text-align:left; width:200px;">Ширина зоны (в м):</label>' +
                                '<div style="text-align:right;"><input id="width_' + this.objectslistId + '"></div>' +
                            '</div>' +
                            '</td> ' +
                          '</tr>' +
                          // Список объектов
                          '<tr align="center">' +
                            '<td colspan="2">' +
                               //'<div id="' + this.objectslistId + '" style="height: 225px;"> </div> ' +
                               '<div id="' + this.objectslistId + '"> </div> ' +
                            '</td> ' +
                          '</tr>' +
                        '</table>' +
                    '</div');

	            // Ширина зоны
	            $('#width_' + this.objectslistId).w2field('int', { autoFormat: false });
	            this.zonewidth(this.zonedefault);

	            var _that = this, oldvalue;
                // Ввод ширины зоны
	            $('#width_' + this.objectslistId).keydown(function (e)
	            {
	                oldvalue = $(this).val();
	            }).keyup(function (event) {
	                var keyCode = event.keyCode;
	                if (keyCode == 189/*-*/) {
	                    $(this).val(oldvalue);
	                }
	                if ((keyCode >= 48 && keyCode <= 57/*цифры*/ && keyCode != 189/*-*/) || keyCode == 46 || keyCode == 8 || keyCode == 13) {// цифры, Delete Key Pressed, backspace, enter
	                    if (_that.mapeditorTask.editobjects && _that.mapeditorTask.editobjects.length > 0 && _that.mapeditorTask.editobjects[0].geometry.count() > 1) {
	                        var data = new Array();
	                        data.push({
	                            id: 1, 
	                            oldvalue: oldvalue,
	                            newvalue:  $(this).val(),
	                            code: '7', 
	                            type: 'update'
	                        });

	                        _that.mapeditorTask.ischange(true);
	                        _that.mapeditorTask.history.addsem('update', data);
	                        _that.mapeditorTask.addmenu();
	                    }
	                  }
	                });

	            $('#zone_' + this.objectslistId).hide();

	            $('.create').click(function (event) {
	                _that.mapeditorTask.ischange(false);
	                _that.mapeditorTask.history.clear();
	                if ($(event.currentTarget).hasClass('control-button-active')) {
	                    // Если задача создания
	                    if (_that.mapeditorTask.mapeditorCreatingTask) {
	                        _that.mapeditorTask.mapeditorCreatingTask.clickMethod(event.target);
	                    }
	                }
	                else {
	                    GWTK.DomUtil.removeActiveElement('.control-button-edit-method');
	                    $(event.currentTarget).addClass('control-button-active');
	                    _that.start(event.target);
	                }
	            });

	            $('.editor').click(function (event) {
	                if ($(event.currentTarget).hasClass('control-button-active')) {
	                    $(event.currentTarget).removeClass('control-button-active');
	                }
	                else {
	                    $(event.currentTarget).addClass('control-button-active');
	                    var action = _that.map.taskManager._action;
	                    if (action && _that.mapeditorTask.isOurAction(action)) {
	                        if (action instanceof GWTK.MapeditorEditingAction) {
	                            action.processMoving();
	                        }
	                    }
	                }
	            });

	            // инициализация данных панели 
	            this.initPane(regime, options);
	            // Установим активную задачу
	            this.setActiveTask(this.regime);
                // список объектов
	            this.createFormObjectsList();

	        },

	        // Создать форму со списком объектов
	        createFormObjectsList: function () {

	            this.formId = 'FormObjectsList_' + this.objectslistId;
	            var _that = this,
                    html = '<div id="' + this.formId + '" class="w2ui-page page-0 semanticeditor" style="margin:0px;padding:0px; height: 165px;"></div>',
                htmlbuttons =
                '<button class="w2ui-btn" name="save" id= "' + this.formId + 'save" >' + 'Сохранить область' + '</button>' +
                '<button class="w2ui-btn" name="cancel" id= "' + this.formId + 'cancel" >' + 'Отмена' + '</button>';
	            html += '<div class="w2ui-buttons" style="margin-top:10px; border-top:none; background-color:transparent;">' + htmlbuttons + '</div>'; // class="w2ui-buttons"

                $('#' + this.objectslistId).append(html);
	            $('#' + this.formId + 'save').on('click', function () {
	                _that.saveControl();
	            });
	            $('#' + this.formId + 'cancel').on('click', function () {
	                _that.cancelControl();
	            });


	            // Cформировать массив записей
	            var records = this.setrecords();

	            var _that = this;
	            $('#' + this.formId).w2grid({
	                name: 'grid_' + this.objectslistId,
	                header: w2utils.lang('Objects'),
	                multiSelect: false,
	                show: {
	                    toolbar: false
                        , columnHeaders: false
                        , header: true
                        , footer: false
                        , toolbarReload: false
                        , lineNumbers: true
                        , toolbarSearch: false
                        , toolbarColumns: false
                        , fixedBody: true

	                },
	                limit: 1000,
	                columns: [
                        {
                            field: 'edit', size: '24px',
                            render: function (record, index, col_index) {
                                var recid = record.recid;
                                return '<button id = "w2ui-edit" class="w2ui-icon-pencil" onclick = "var obj = w2ui[\'' + this.name + '\']; var id = ' + recid + ';'
                                    + ' obj.select(id); obj.columnClick(\'edit\')" Title=""Редактировать объект"></button>';
                            }
                        },
                        {
                            //field: 'name', size: '298px'
                            field: 'name', size: '282px'
	                    },
                        {
                            field: 'delete', size: '24px',
                            render: function (record, index, col_index) {
                                var recid = record.recid;
                                return '<button id = "w2ui-delete" class="w2ui-icon-cross" onclick = "var obj = w2ui[\'' + this.name + '\']; var id = ' + recid + ';'
                                    + ' obj.select(id); obj.columnClick(\'delete\')" Title="Удалить объект"></button>';
                            }

                        }
	                ],

	                // Записи
	                records: records

                    // Выделение объекта
	                , onSelect: function (event) {
	                    event.onComplete = function (event) {
	                        var selection = this.getSelection(true);
	                        if (selection.length > 0) {
	                            var mapobject = _that.selectFeatures.mapobjects[selection[0]];
	                            if (mapobject) {
	                                // Спозиционировать картуна текущий объект и выделить его
	                                if (!mapobject.objectcenter)
	                                    mapobject.objectcenter = GWTK.toLatLng(mapobject.bbox[1] + (mapobject.bbox[3] - mapobject.bbox[1]) / 2, mapobject.bbox[0] + (mapobject.bbox[2] - mapobject.bbox[0]) / 2);
	                                _that.selectFeatures.drawobject(mapobject.gid, true, true, true);

	                                //_that.map.setView(_that.map.options.crs, [mapobject.bbox[1] + (mapobject.bbox[3] - mapobject.bbox[1]) / 2, mapobject.bbox[0] + (mapobject.bbox[2] - mapobject.bbox[0]) / 2], _that.map.options.zoom);
	                                ////_that.map.setViewport(mapobject.objectcenter);
	                            }
	                        }
	                    }
	                }        

                    , onColumnClick: function (event) {
                        // отменить выделение на карте 
                        //_that.selectFeatures.cleardrawobject();
                        // разобраться с выделенной колонкой
                        var selection = this.getSelection(true);
                        if (selection.length > 0) {
                            var mapobject = _that.selectFeatures.mapobjects[selection[0]];
                            if (!mapobject) return;
                            if (event.field == 'delete') {
                                w2confirm(w2utils.lang("Object") + ' ' + mapobject.name + " будет безвозвратно удален?", w2utils.lang("Map editor"), function (answer) {
                                    if (answer == 'Yes') {
                                        mapobject.save('delete');
                                    }
                                    _that.setActiveTask('create');
                                });
                            }
                            else {
                                if (event.field == 'edit') {
                                    _that.setActiveTask('edit', mapobject);
                                    $(_that.map.eventPane).one('w2confirm_close', function (event) {
                                        _that.setActiveTask('create');
                                    });
                                }
                            }
                        }
                    }
	            });


	        },

            
	        // сформируем массив записей
	        setrecords: function () {
	            var records = [], record;
	            for (var i = 0; i < this.selectFeatures.mapobjects.length; i++) {
	                record = {
	                    "recid": i,
	                    "name": this.selectFeatures.mapobjects[i].name
	                };
	                records.push(record);
	            }
	            return records;
	        },

	        // перерисуем грид
	        refreshgrid: function () {
	            var records = this.setrecords(),
                    grid = w2ui['grid_' + this.objectslistId];
	            if (grid) {
	                grid.records = records;
	                grid.refresh();
	            }
	        },

	        /**
           * Инициировать данные для задачи
           * @method initdata
           * @param task  - задача
           * @param node  - объект
           * @param buttonmethod  - метод создания
           */
	        // ===============================================================
	        initdata: function (task, node, buttonmethod) {
	            if (!task || !node)
	                return;
	            this.mapeditorTask.editobjects[0] = new GWTK.mapobject(this.map, "0", this.mapeditorTask.maplayerid.layerid);
	            if (this.mapeditorTask.editobjects[0].error) {
	                this.mapeditorTask.editobjects[0] = null;
	                return;
	            }
	            task.editobject = this.mapeditorTask.editobjects[0];
	            task.editobject.gid = task.editobject.maplayername + '.' + '0';
	            task.editobject.id = "0";
	            task.editobject.code = task.editobject.key = node.code;
	            task.editobject.spatialposition = task.editobject.geometry.spatialposition = GWTK.classifier.prototype.getlocal(node.local);
	            task.editobject.maplayername = this.mapeditorTask.layer.id;
	            task.editobject.gid = task.editobject.maplayername + '.' + '0';
	            var sem = this.mapeditorTask.layer.classifier.getsemantics(task.editobject.key);
	            if (sem) {
	                task.editobject.semantic.setsemantics(sem);
	            }

	            this.mapeditorTask.createdrawpanel();
	            this.mapeditorTask.drawpanel.style.cursor = 'pointer';
	            task.drawpanel = this.mapeditorTask.drawpanel;

	            if (task instanceof GWTK.MapeditorCreatingTask) {
	                task.buttonmethod_create = buttonmethod;
	            }

	        },

	        /**
             * Старт аction
             * @method  start
             */
	        // ===============================================================
	        start: function (target) {
	            this.buttonmethod = GWTK.MapeditorCreatingTask.prototype.getclassmethod(target);
	            if (!this.buttonmethod)
	                this.buttonmethod = GWTK.MapeditorEditingAction.prototype.getclassmethod(target);

	            $('#zone_' + this.objectslistId).hide();

	            var node, create;
	            switch (this.buttonmethod) {
	                case '.edcrmethod_free_line':
	                    $('#zone_' + this.objectslistId).show();
	                    node = {
	                        'code': 'Line',
	                        'local': '0'
	                    };
	                    create = true;
	                    break;
	                case '.edcrmethod_inclined_rectangle':
	                    node = {
	                        'code': 'Polygon',
	                        'local': '1'
	                    };
	                    create = true;
	                    break;
	                case '.edcrmethod_circle':
	                    node = {
	                        'code': 'Polygon',
	                        'local': '1'
	                    };
	                    create = true;
	                    break;
	            }

	            // если создание
	            if (this.buttonmethod) {
	                if (create) {
	                    if (this.mapeditorTask.mapeditorCreatingTask) {
	                        this.initdata(this.mapeditorTask.mapeditorCreatingTask, node, this.buttonmethod);
	                        this.mapeditorTask.addmenu();
	                        this.mapeditorTask.mapeditorCreatingTask.processCreation();
	                    }
	                }
	            }

	        },

	        /**
             * Событие при обновлении объекта
             * @method  onUpdateMapObject
             * @param event {Object} Событие
             */
	        // ===============================================================
	        onUpdateMapObject: function (event) {
	            var mapobject = event.mapobject;

	            if (event.error) return;

	            this.mapeditorTask._ischange = false;
	            this.mapeditorTask.addmenu();

	            this._ischange = true;
	            switch (event.regime) {
	                case 'create':
	                    // Добавим объект в список
	                    mapobject.name = this.getname(this.buttonmethod);
	                    mapobject.gid = mapobject.gid_svg;
	                    if (this.buttonmethod == '.edcrmethod_free_line') {
	                        var el = mapobject.semantic.value("zonewidth");
	                        el.value = el.textvalue = this.zonewidth();
	                        mapobject.semantic.value("zonewidth", el);
	                    }
	                    mapobject.saveJSON();

	                    this.selectFeatures.add(mapobject);
	                    this.refreshgrid();
	                    break;

	                case 'replace':
	                    // Обновим семантику ширины зоны
	                    if (mapobject.code.toLowerCase().indexOf("line") >= 0) {
	                        var el = mapobject.semantic.value("zonewidth");
	                        if (el) {
	                            el.value = el.textvalue = this.zonewidth();
	                            mapobject.semantic.value("zonewidth", el);
	                            mapobject.saveJSON();
	                        }
	                    }

	                    this.selectFeatures.add(mapobject);
	                    if (mapobject.code.toLowerCase().indexOf("line") >= 0) {
	                        var layer = this.getlayer();
	                        if (layer)
	                            layer.drawMap(true);
	                    }

	                    this.refreshgrid();
	                    this.setActiveTask('create');
	                    break;

	                case 'delete':
	                    var el = this.identifyname(mapobject.name);
	                    if (el && el.index >= 0) {
	                        el.numbers[el.index] = false;
	                        this.selectFeatures.remove(mapobject);
	                        this.refreshgrid();
	                    }
	                    if (this.mapeditorTask.currentTask != 'create')
	                        this.setActiveTask('create');
	                    break;
	            }
	        },

	        // запросить слой
	        getlayer: function () {
	            if (this.geojson.features[0] && this.geojson.features[0].properties && this.geojson.features[0].properties.id) {
	                var gmldata = GWTK.Util.parseGmlId(this.geojson.features[0].properties.id);
	                return this.map.tiles.getLayerByxId(gmldata.sheet);
	            }
	        },

            // ширина зоны
	        zonewidth: function (val) {
	            if (val === undefined)
	                return $('#width_' + this.objectslistId).val().replace(/\s+/g, '');
                else
	                $('#width_' + this.objectslistId).val(val.toString().replace(/\s+/g, ''));
	        },

	        // Запросить новое название
	        getname: function (buttonmethod) {
	            var name = '', number;
	            if (buttonmethod == '.edcrmethod_free_line') {
	                name = this.nameRoute;
	                number = this.getfreenumber(this.numberRoute);
	            }
	            else {
	                name = this.nameSquare;
	                number = this.getfreenumber(this.numberSquare);
	            }
	            if (number)
	                return name += ' ' + number;
	        },

	        // запросить свободный номер
	        getfreenumber: function (numbers) {
	            if (!numbers) return;
	            var number;
	            for (var i = 0; i < this.countObject; i++) {
	                if (!numbers[i]) {
	                    number = i + 1;
	                    numbers[i] = true;
	                    break;
	                }
	            }
	            return number;
	        },

	        // запросить индекс в массиве номеров для номера
	        getindexForNumber: function (numbers, number) {
	            if (!numbers || !number) return;
	            for (var i = 0; i < this.countObject; i++) {
	                if (i + 1 == number)
	                    return i;
	            }
	        },

	        // определить номер
	        identifyname: function (name) {
	            if (!name) return;
	            var index, mass = name.split(' '), numbers;
	            if (mass.length < 2)
	                return;
	            if (mass[0] == this.nameRoute) {
	                numbers = this.numberRoute;
	            }
	            else {
	                numbers = this.numberSquare;
	            }

	            index = this.getindexForNumber(numbers, parseInt(mass[1]));
	            return { "numbers": numbers, "index": index };

	        },

	        setActiveTask: function (regime, selectobject) {
	            if (this.mapeditorTask.mapeditorCreatingTask) {
	                this.mapeditorTask.closeTask(this.mapeditorCreatingTask);
	                this.mapeditorTask.mapeditorCreatingTask = null;
	            }
	            else {
	                if (this.mapeditorTask.mapeditorEditingTask) {
	                    this.mapeditorTask.closeTask(this.mapeditorEditingTask);
	                    this.mapeditorTask.mapeditorEditingTask = null;
	                }
	            }

	            this.regime = regime;
	            $('#zone_' + this.objectslistId).hide();

	            $(this.map.eventPane).off('GWTK.mapeditorTask', this.onMapeditorTask);
	            if (regime == 'create' || regime == 'edit') {
	                $(this.map.eventPane).on('GWTK.mapeditorTask', this.onMapeditorTask);
	                //$(this.map.eventPane).on('GWTK.mapeditorTask', GWTK.Util.bind(this.onMapeditorTask, this));
                }

	            if (regime == 'create') {
	                this.mapeditorTask.currentTask = this.mapeditorTask.setActiveTask(regime);
	                $('#createmode_' + this.objectslistId).removeClass('disabledbutton');
	                $('#editmode_' + this.objectslistId).addClass('disabledbutton');
	            }
	            else {
	                if (regime == 'edit') {
	                    this.mapeditorTask.currentTask = this.mapeditorTask.setActiveTask(regime, selectobject);
	                    if (selectobject.code.toLowerCase().indexOf("line") >= 0) {
	                        $('#zone_' + this.objectslistId).show();
	                        var el = selectobject.semantic.value("zonewidth");
	                        if (el) {
	                            this.zonewidth(el.value);
	                        }
	                        else
	                            this.zonewidth(this.zonedefault);
                        }

	                    // переопределим функции
	                    this.mapeditorTask.mapeditorEditingTask.clickEditing = function () { };

	                    $('#createmode_' + this.objectslistId).addClass('disabledbutton');
	                    $('#editmode_' + this.objectslistId).removeClass('disabledbutton');
	                }
	            }

	        },

            // Сообщение от панели задачи редактра карты
	        onMapeditorTask: function (event) {
	            if (!event) return;
	            var params = event.params, editobject;
	            switch (event.operation) {
	                case 'restorehistory':  // Восстановление из истории
	                    var history = params.history, newvalue, oldvalue, el;
	                    if (history.data == 's') {
	                        if (params.phase == 'before') {
	                            if (this.mapeditorTask.editobjects && this.mapeditorTask.editobjects.length && this.mapeditorTask.editobjects[0]) {
	                                editobject = this.mapeditorTask.editobjects[0];
	                                //editobject.semantic.clear();
                                    
	                                for (var i = 0; i < history.semantics.length; i++)
	                                    if (history.semantics[i].code == '7') {
	                                        newvalue = history.semantics[i].newvalue;
	                                        oldvalue = history.semantics[i].oldvalue;
	                                        break;
	                                    }

	                                el = editobject.semantic.value("zonewidth");
	                                if (params.direct == 'prev') 
	                                    el.value = el.textvalue = oldvalue;
                                    else 
	                                    el.value = el.textvalue = newvalue;
                                    editobject.semantic.value("zonewidth", el);
                                    this.zonewidth(el.value);
                                }
	                        }
	                    }
	                    break;
	            }
	        },

	        closeMapeditorTask: function (action, fn_callback) { //, geojson) {
	            var retjson = GWTK.DrawingEditor.prototype.clone(this.geojsonInit);
	            if (action == 'save') {
	                retjson = GWTK.DrawingEditor.prototype.clone(this.geojson = this.selectFeatures.mapobjectsToGeoGSON(true));
	            }
	            else {
	                if (this._ischange) {
	                    this.cancelControl(fn_callback);
	                    return;
	                }
	            }

                // Уберем имя листа из id объекта
	            retjson = GWTK.DrawingEditor.prototype.clearIdForExportObjects(retjson);

	            this.destroy();
	            this.map.mapeditor.closetask();
	            if (action) {
	                GWTK.DrawingEditor.prototype.clearIdForExportObjects()
	                $(this.map.eventPane).trigger({
	                    type: 'GWTK.mapeditorTask',
	                    operation: 'closeTask',
	                    params: { phase: 'after', 'type': action, area: { 'mapobjects': retjson, 'name': this.areaname } }
	                });
	            }
	        },

	        cancelControl: function (fn_callback) {
	            var _that = this;
	            if (!this._ischange) {
	                $('#' + this.mapeditorTask.button_ids.save).hide();
	                this.mapeditorTask._ischange = false;
	                this.closeMapeditorTask('cancel');
	            }
	            else {
	                 w2confirm("Все несохраненные объекты будут утеряны. Продолжить?", w2utils.lang("Map editor"), function (answer) {
	                     if (answer == 'Yes') {
	                         _that._ischange = false;
	                         _that.closeMapeditorTask('cancel');
	                         if (fn_callback)
	                             fn_callback('CloseMapeditorTask');
	                     }
	                     else {
	                         if (fn_callback)
	                             fn_callback('noCloseMapeditorTask');
	                     }
	                });
	            }
	        },


	        saveControl: function () {
	            if (this.mapeditorTask._ischange) {
	                this.mapeditorTask.setCloneForSave();
	                this.mapeditorTask.save(this.regime);
	            }

	            if (this.selectFeatures.mapobjects.length == 0) {
	                w2alert('В области нет ни одного объекта.');
	                return;
	            }

	            this.popupId = 'popup_' + this.objectslistId;
	            var _that = this,
                    html = '<div id="' + this.popupId + '" class="w2ui-page page-0 semanticeditor" style="margin:0px;padding:20px; height: 50px;">' +
                               '<div >' +
                                '<div><input id="areaname_' + this.objectslistId + '"  style="width:100%;" value = "' + this.areaname + '"></div>' +
                            '</div>' +
                 '</div>',
                htmlbuttons =
                '<button class="w2ui-btn" id="saveConfirm">' + 'Сохранить' + '</button>' +
                '<button class="w2ui-btn" id="cancelConfirm">' + 'Отмена' + '</button>';

	            function popup() {
	                w2popup.open({
	                    title: 'Сохранение области',
	                    body: html,
	                    buttons: htmlbuttons,
	                    height: 150 
	                });
	            }
	            popup();

	            $('#saveConfirm').on('click', function (event) {
	                var areaname = $('#areaname_' + _that.objectslistId).val();
	                if (!areaname || areaname.replace(/\s{2,}/g, ' ') == '')
	                    return;
	                _that.areaname = areaname;
	                // список объектов в geojson
	                _that.closeMapeditorTask('save');//, _that.selectFeatures.mapobjectsToGeoGSON(true));
                    // закрыть окно
	                w2popup.close();
	            });
	            $('#cancelConfirm').on('click', function (event) {
	                // закрыть окно
	                w2popup.close();
	            });

	        },


	        //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	        // ПЕЕОПРЕДЕЛЯЕМЫЕ ФУНКЦИИ GWTK.mapeditorTask
	        //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	        /**
            * Обновление заголовка в панели информации
            * @method updatetitle
            * @param text {String} Текст заголовка
            */
	        // ===============================================================
	        updatetitle: function (text) {
	            if (text && $('.edContainer .routeFilesName')[0]) {
	                $('.edContainer .routeFilesName')[0].innerText = text;
	            }

	            var bt = $('#edHeaderList_' + this.id), _that = this;
	            if (!bt || bt.length == 0) {
	                $('.edContainer .routeFilesName').append(
                   '<img id="edHeaderList_' + this.id + '" class="panel-info-close" title="' + w2utils.lang("Close") + '" src="' + GWTK.imgClose + '">');
	                $('#edHeaderList_' + this.id).click(function (event) {
	                    if (_that.userinterface && _that.userinterface.cancelControl) {
	                        _that.userinterface.cancelControl();
	                    }
	                });
	            }

	            this.resize();
	        },

	        /**
             * Установить изменение размеров окна
             */
	        setResizablePane: function () {
	        },

	        /**
             * Контекстное меню для точки объекта 
             * @method popupmenu
             * @param div {Element} - Родительский элемент
             * @param x {Int} - Координата экрана x
             * @param y {Int} - Координата экрана y
             */
	        // ===============================================================
	        popupmenuEditingAction: function (div, x, y) {
	            this.topology.map_events('off');

	            // удалить меню 
	            $('#' + this.mapeditorTask.popupId).remove();
	            var editobject = this.editobject;

	            if (!div || !div.id || !editobject || !editobject.geometry ||
                    div.id.indexOf('center') >= 0) return;  // если это средняя точка 

	            var left = '0px', top = '0px', spatialposition = editobject.spatialposition.toLowerCase();
	            if (!isNaN(x)) left = parseInt(x - 5, 10) + 'px';
	            if (!isNaN(y)) top = parseInt(y - 5, 10) + 'px';

	            var subjectnumber = this.drawobject.getsubjectnumber(div.id),
                  pcount = editobject.geometry.count(subjectnumber),
                  styleDiv = ' style="left:' + left + ';top:' + top + '; cursor: pointer;opacity: 0.9"',
                  deletepoint = '<tr><td width="16px" class="ededmethod_delpoint" style="background-repeat:no-repeat;"/>  <td id="' + this.mapeditorTask.popupId + '_deletepoint" style="padding-left:5px;">' + w2utils.lang("Remove point") + '</td></tr>';
	            if (!editobject.geometry.isdeletingpoint(subjectnumber))
	                deletepoint = '';

	            // Заглушка, пока нет других операций над точками
	            if (deletepoint == '' && pcount <= 1 || !spatialposition)
	                return;

	            // Определим номер точки
	            var closeobject = '', changedirection = '',
                    number = this.drawobject.getnumber(div.id),
                    isclosing = false,
                    pointfirst = editobject.geometry.getpoint(1, subjectnumber), pointlast = editobject.geometry.getpoint(pcount, subjectnumber),
                    line = spatialposition.indexOf('linestring'), polygon = spatialposition.indexOf('polygon');
	            if (!pointfirst || !pointlast) return;

	            if ((line >= 0 || polygon >= 0) && pcount >= 3 && (pointfirst.x != pointlast.x && pointfirst.y != pointlast.y))
	                isclosing = true;  // теоретически можно замыкать (не замкнут)

	            if (isclosing && (number == pcount - 1 || number == 0)) { // последняя точка
	                closeobject = '<tr><td width="16px" class="ededmethod_closeobject" style="background-repeat:no-repeat;"/>  <td id="' + this.mapeditorTask.popupId + '_closeobject" style="padding-left:5px;">' + w2utils.lang("Close object") + '</td></tr>';
	            }

	            // сменить направление
	            if ((spatialposition != 'point' && spatialposition != 'multipoint') && pcount > 1)
	                changedirection = '<tr><td width="16px" class="ededmethod_changedir" style="background-repeat:no-repeat;"/> <td id="' + this.mapeditorTask.popupId + '_changedirection" style="padding-left:5px;">' + w2utils.lang("Change direction") + '</td></tr>';

	            var text =
                '<div id="' + this.mapeditorTask.popupId + '" class=" map-panel-def editTable" ' + styleDiv + ' >' +
                '<div align="left"  class="menupoint" style="margin-left:5px; margin-top:5px;">' + //actionname +
                    '<div><img id="' + this.mapeditorTask.popupId + '_close" class="panel-info-close" title="' + w2utils.lang("Close") + '" src="' + GWTK.imgClose + '"> </div>' +
                '</div>' +
                '<div>' +
                '<table cellspacing="2px;" cellpadding="2px" style="width:140px;">' +
                     deletepoint +
                     closeobject + // замкнуть
                     changedirection + // сменить направление 
                '</table>' +
                '</div></div>';

	            $(this.drawpanel).append(text);

	            var $popup = $('#' + this.mapeditorTask.popupId),
                    $popupclose = $('#' + this.mapeditorTask.popupId + '_close'),
                    _that = this;
	            $popupclose.click(function (event) {
	                $popup.remove();
	                _that.topology.map_events('on');
	                return false;
	            });

	            $('#' + this.mapeditorTask.popupId + '_deletepoint').click(function (event) {
	                $popupclose.click();
	                //$popup.remove();
	                if (!div) {
	                    w2alert(w2utils.lang("There is no point to remove"));
	                    return false;
	                }

	                // удалить точку
	                _that.mapeditorTask.deletepoint(_that.drawobject.getnumber(div.id) + 1, _that.drawobject.getsubjectnumber(div.id), 'edit');
	                _that.updatedrawcontur('edit');
	                return false;
	            });

	            // Замкнуть
	            $('#' + this.mapeditorTask.popupId + '_closeobject').click(function (event) {
	                _that.mapeditorTask.closeobject(false, subjectnumber);
	                _that.updatedrawcontur(_that.name);
	                //_that.complete();
	                //$popup.remove();
	                $popupclose.click();
	                return false;
	            });

	            // Изменить направление
	            $('#' + this.mapeditorTask.popupId + '_changedirection').click(function (event) {
	                _that.mapeditorTask.changedirection(subjectnumber, 'edit');
	                //$popup.remove();
	                $popupclose.click();
	                return false;
	            });

	        }

	    };

	    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	    // ПЕЕОПРЕДЕЛЯЕМЫЕ ФУНКЦИИ GWTK.mapeditor и GWTK.mapeditorTask, используемые 
	    // в GWTK.DrawingEditor
	    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

	    // Создать задачу  GWTK.mapeditor
	    GWTK.DrawingEditor.prototype.setMapEditor =  function (task) {
	        if (!task || task.error) return;
	        if (this.map.setTask(task)) {
	            if (task.bt_selector)
	                GWTK.DomUtil.setActiveElement(task.bt_selector);
	            task.set(this.param);

	            // Инициализация пользовательского инерфейса
	            if (task.param.userinterface) {
	                task.userinterface = eval('new ' + task.param.userinterface + '(this.mapeditorTask)');//    new GWTK.mapeditorUserInterfaceTask(this);
	            }

	            task.createPane(this.panelId);

	            return true;
	        }
	    };

	    /**
        * Создание основной панели редактора карты
        * @method createPane
        */
	    // ===============================================================
	    GWTK.DrawingEditor.prototype.createPane = function (panelId) {

	        if (!this.param) return;

	        // Панель расположена после панели выбора объектов
	        this.panel = this.map.createPane('map-panel-def ' + this.toolname + '-panel', (this.selectorParentId) ? $(this.selectorParentId)[0] : this.map.mapPane);
	        this.panel.id = this.panelId = panelId;

	        var htmlcreate = '', htmledit = '', htmlmove = '', htmldelete = '', htmlsetting = '', htmlhistory = '';
	        var strpanel =
            '<div class="edContainer">' +
                '<div class="routeFilesName">' + w2utils.lang("Map editor") +
                '</div>' +
                '<div> <table width="100%" cellspacing=3 cellpadding=0> ' +
                     '<tr align="left"> ' +
                     '<td width = "50px" align="left"> ' +
                     htmlcreate +
                     '</td> ' +
                     '<td width = "50px" align="left"> ' +
                     htmledit +
                     '</td> ' +
                     '<td width = "50px" align="left"> ' +
                     htmlmove +
                    '</td> ' +
                    '<td width = "50px" align="left"> ' +
                     htmldelete +
                     '</td> ' +
                    '<td width = "50px" align="left"> ' +
                     htmlsetting +
                     '</td> ' +
                    '<td >' +
                    '<div id="' + this.button_ids.process + '" name="process"> </div> ' +
                    '</td>' +
                // кнопки отката
                    htmlhistory +
                    '</tr> </table> </div>' +
                    '<div id ="' + this.objectlistId + '" ></div>' +
                    '</div>';

	        $('#' + this.panelId).append(strpanel);

	        // Заголовок
	        this.updatetitle(w2utils.lang("Map editor"));

	        this.$panel = $(this.panel);
	        var _that = this;
	        this.$panel.draggable({
	            containment: "parent", distance: 2, stop: function () {
	                _that.$panel.css("height", "auto");
	                _that._writeedCookie();
	            }
	        });

	        $(document).ready(this.onDocumentReady);

	        $(this.map.eventPane).trigger({
	            type: 'GWTK.mapeditorTask',
	            operation: 'openTask',
	            params: { phase: 'after', area: { 'mapobjects': this.geojsonInit, 'name': this.areaname } }
	        });

	    };

	    /**
         * Документ загружен
         * @method  onDocumentReady
         * @param e {Object} Событие
         */
	    // ===============================================================
	    GWTK.DrawingEditor.prototype.onDocumentReady = function (e) {

	        // Размеры панели
	        this.cssExtMax = { 'width': this.getmaxWidth(), 'height': this.getmaxHeight() };

	        // Установим растягиваемую панель
	        this.setResizablePane();

	        // Прочитаем куки
	        this._readedCookie();

	        var width = $("#images img").attr("width");
	        var height = $("#images img").attr("height");

	    };



	}

	
}
