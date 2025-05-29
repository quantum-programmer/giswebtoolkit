/***************************************** Гиман Н.Л.   30/11/17 ****
 ***************************************** Нефедьева О. 27/11/17 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2017              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент  Управление клатеризацией             *
 *                                                                  *
 *                          GWTK SE                                 *
 *******************************************************************/
/**
 * Класс управления кластеризацией
 * @param map - ссылка на карту
 * @param options - параметры инициализации. Пример параметров {
	 *			icon: "http://localhost/images/image.svg", - путь к изображению
	 *			json: CLUSTERTESTJSON, - json с объектами для кластеризации
	 *			styleSettings: {
	 *				typeField: 'objecttype',
	 *				style: CLUSTERSTYLE,
	 *				defaultStyle: null
	 *			}, - параметры стилей для кластеризации
	 *			markerSize: { x: 32, y: 32 },
	 * 			markerevents: {"mouseenter": false, "mouseleave": false} - обработчики наведения мыши
  	 * 			markerhint:  - пользовательская информация о маркере при всплывающем балуне ( при отстуствии выводиться ВСЯ информация об объекте из элемента 'properties')
 	 * 			{
 	 *     			propertiesname: '_clusterhint' - наименование ключа, в котором хранится hint
 	 * 			},
 	 * 			cellsize: - размер ячейки класстеризации (по умолчанию 80 (пиксел))
 	 * 			customimageclasters:  -  ссылки на пользовательские изображения для отображения кластеров
 	 * 			{
 	 * 				 small: "http://...",		размер 40х40
 	 * 			     medium: "http://...",		размер 40х40
 	 * 			     large: "http://...",		размер 40х40
 	 * 			     verylarge: "http://...",  	размер 46х46
 	 * 			     huge: "http://..."		 	размер 52х52
 	 * 			}
 *	}
 * @param startCallBack - функция для обратного вызова при старте кластеризации
 * @param stopCallBack - функция для обратного вызова при окончании кластеризации
 * @constructor GWTK.ClusterControl
 */
GWTK.ClusterControl = function ( map, options, startCallBack, stopCallBack ) {
	this.map = map;
	if (!this.map || !options) {                                                         // карта
	    console.log("GWTK.ClusterControl. " + w2utils.lang("Not defined a required parameter") + " Map or options.");
	    return;
	}
	this.options = options;
	this.startCallBack = startCallBack || GWTK.Util.bind( this._onclusterify_begin, this );
	this.stopCallBack = stopCallBack || GWTK.Util.bind( this._onclusterify_end, this );
	this.button = null;
	this.toolname = 'clusterizator';
	this.map.maptools.push( this );
	if(options.toolbarButton){
		this.createToolbarButton();
	}
};
GWTK.ClusterControl.prototype = {
	/**
	 * Функция инициализации компонента
	 * @method init
	 * @param options - параметры инициализации
	 */
	init: function ( options ) {
		if(!options )return false;
		this.setSettings( options );
		if ( !this.clasterizator ) {
			this.clasterizator = new GWTK.mapclusterizator( this.map, this.defaultSettings );
		}
		if ( options.toolbarButton && !this.button ) {
			this.createToolbarButton();
		}
		if ( options.run ) {
			this.clusterify();
		}
	},
	/**
	 * Установить параметры кластеризации
	 * @method setSettings
	 * @param options - Пример параметров {
		 *  	icon: "http://localhost/images/image.svg", - путь к изхображению
		 *  	json: CLUSTERTESTJSON, - json с объектами для кластеризации
		 *  	styleSettings: {
		 *  		typeField: 'objecttype',
		 *  		style: CLUSTERSTYLE,
		 *  		defaultStyle: null
		 *  	}, - параметры стилей для кластеризации
		 *  	markerSize: { x: 32, y: 32 },
		 *  	markerevents: { "mouseenter": false, "mouseleave": false } - обработчики наведения мыши
		 *  }
	 */
	setSettings: function ( options ) {
		if ( this.clasterizator ) {
			for ( var i in options ) {
				if ( options.hasOwnProperty( i ) ) {
					this.clasterizator._options[ i ] = options[ i ];
				}
			}
		} else {
			this.defaultSettings = {
				useAnimation: false, //TODO: отключил до переписывания компонента
				smallClusterLimit: 10,
				mediumClusterLimit: 1000,
				largeClusterLimit: 10000,
				veryLargeClusterLimit: 100000
			};
			for ( var k in options ) {
				if ( options.hasOwnProperty( k ) && k !== 'json' ) {
					if ( k === "markerSize" ) {
						this.defaultSettings[ k ] = new GWTK.point( options[ k ][ 'x' ], options[ k ][ 'x' ] );
					} else {
						this.defaultSettings[ k ] = options[ k ];
					}
				}
			}
		}
		this.geoJSON = options.json || '';
	},
	/**
	 * Запустить кластеризацию
	 */
	clusterify: function () {
        const geoMapCenter = this.map.getCenterGeoPoint();
        this.mapCenter = new GWTK.LatLng(geoMapCenter.getLatitude(), geoMapCenter.getLongitude());
		this.zoom = this.map.options.tilematrix;
		this.clasterizator.clusterifyFrom( this.geoJSON, false, this.mapCenter, this.zoom, this.startCallBack, this.stopCallBack );
	},
	/**
	 * Удалить клатеризованные объекты
	 */
	clear: function () {
		if(!this.clasterizator)return false;
		this.clasterizator.clear();
		$(this.clasterizator._panes.overlayPane).off();
		$(this.clasterizator._panes.overlayPane).remove();
		$( window ).off("resize.clusterization");
		this.map.removeListener(this.clasterizator, 'zoomchanged', 'zoomchanged');
		this.map.removeListener(this.clasterizator, 'moveend', 'moveend');
		this.clasterizator = null;
	},
	/**
	 * Создать кнопку в панели управления
	 */
	createToolbarButton: function () {
		this.button = GWTK.DomUtil.create( 'div', 'control-button control-button-clusterizator control-button-radio clickable', this.map.panes.toolbarPane );
		this.button.id = 'panel_button-clusterizator';
		this.button.title = w2utils.lang( "Clustered data" );
		this.$button = $( this.button );
		var that = this;
		if ( this.options && this.options.run ) {
			this.$button.addClass( 'control-button-active' );
		}
		this.$button.on( 'click', function () {
			if ( $( this ).hasClass( "inprogress" ) ) {
				return false;
			}
			if ( $( this ).hasClass( 'control-button-active' ) ) {
				$( this ).removeClass( 'control-button-active' );
				that.clear();
			} else {
				$( this ).addClass( 'control-button-active' );
				that.init(that.options);
				that.clusterify();
			}
		} );
	},
	/**
	 * Обработчик начала клакстеризации
	 * @private
	 */
	_onclusterify_begin: function () {
		if ( !this.$button )return false;
		this.$button.addClass( "inprogress" );
		$( "<div id=\"pulse-button-div\"></div>" ).appendTo( this.$button ).addClass( "pulse-button" );
	},
	/**
	 * Обработчик окончания кластеризации
	 * @private
	 */
	_onclusterify_end: function () {
		if ( !this.$button )return false;
		$( "#pulse-button-div" ).remove();
		this.$button.removeClass( "inprogress" );
	},

    /**
	 * Деструктор
	 */
	destroy: function () {
	    this.clear();
	    this.$button.off();
	    this.$button.remove();
	    this.button = null;
	    this.$button = null;
	}
};