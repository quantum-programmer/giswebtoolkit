/******************************** Гиман Н.Л ************ 09/09/17 ***
 *                                                                  *
 *         Copyright (c) PANORAMA Group 1991-2017                   *
 *                  All Rights Reserved                             *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *     Базовый класс перевода координат для различных проекций      *
 *                                                                  *
 *******************************************************************/
if ( window.GWTK ) {
	GWTK.Translate = function ( map ) {
		this.spheroidList = {
			"3857": {
				name: "WGS84",
				bigAxis: 6378137.0,
				inverseFlattening: 1. / 298.257223563
			}
		};
		/**
		 * Количество градусов в одном радиане
		 */
		this.RAD = 57.29577951308232;
		this.DEGREEINRAD = 57.29577951308232;
		this.DOUBLENULL = 1e-6;
		this.M_PI_2 = 1.57079632679489661923;
		this.M_PI_4 = 0.785398163397448309616;
		
		this.setSpheroid( this.map.options.crs );
		this.setProto();
	};
	GWTK.Translate.prototype = {
		/**
		 * Установить параметры для переданного CRS
		 * @param crs
		 */
		setSpheroid: function ( crs ) {
			if ( !crs ) {
				return false;
			}
			crs = crs.toString();
			if ( this.spheroidList[ crs ] ) {
				this.spheroidList[ crs ][ 'AlfaTo1' ] = 1.0 - this.spheroidList[ crs ][ 'inverseFlattening' ];
				this.spheroidList[ crs ][ 'E2' ] = 2.0 * this.spheroidList[ crs ][ 'inverseFlattening' ] -
					this.spheroidList[ crs ][ 'inverseFlattening' ] * this.spheroidList[ crs ][ 'inverseFlattening' ];
				this.spheroidList[ crs ][ 'E2_2' ] = this.spheroidList[ crs ][ 'E2' ] / (1.0 - this.spheroidList[ crs ][ 'E2' ]);
			}
			this.spheroid = this.spheroidList[ crs ] || false;
		},
		/**
		 * Устанавливаем методы для пересчета в прототип Number
		 */
		setProto: function () {
			if ( Number.prototype.toRadians === undefined ) {
				Number.prototype.toRadians = function () {
					return this * Math.PI / 180;
				};
			}
			
			if ( Number.prototype.toDegrees === undefined ) {
				Number.prototype.toDegrees = function () {
					return this * 180 / Math.PI;
				};
			}
		}
	};
}