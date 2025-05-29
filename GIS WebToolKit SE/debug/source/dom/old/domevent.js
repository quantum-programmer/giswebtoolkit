/***************************************** Нефедьева О. 29/04/21 ****
 ***************************************** Гиман Н.     16/11/17 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                             DomEvent                             *
 *                                                                  *
 *******************************************************************/
if (window.GWTK)
{
    GWTK.DomEvent = {

        getMousePosition: function (event, container)
        {
            var cX = event.clientX!=null ? event.clientX : event.originalEvent.clientX;
            var cY = event.clientY!=null ? event.clientY : event.originalEvent.clientY;
            if (!container)
            {
                return new GWTK.Point(cX, cY);
            }
            var rect = container.getBoundingClientRect();
            return new GWTK.Point(
                Math.floor(cX - rect.left - container.clientLeft),
                Math.floor(cY - rect.top - container.clientTop));
        },

        getWheelDelta: function (e)
        {
            var delta = 0;

            // if (e.originalEvent.wheelDelta) delta = e.originalEvent.wheelDelta / 120; DEPRECATED!
			if (e.originalEvent.detail) delta = -e.originalEvent.detail / 3;
				else if (e.originalEvent.deltaY) delta = -e.originalEvent.deltaY / 100; // для FireFox
			
            if (delta != Math.round(delta)) delta > 0 ? delta = 1 : delta = -1;// для IE 11
            
            return delta;
        },

        getMouseGeoCoordinates: function (event) {
            if (!event) return;

            var point = GWTK.DomEvent.getMousePosition(event, event.map.panes.eventPane);
            var coord = event.map.tiles.getLayersPointProjected(point);
            if (coord == null) return;
            var geo = GWTK.projection.xy2geo(event.map.options.crs, coord.y, coord.x);
            if (geo[1] > 180) {
                geo[1] = geo[1] - 360.0;
            }
            if (geo[1] < -180) {
                geo[1] = geo[1] + 360.0;
            }
            var sgrad = GWTK.toLatLng(geo);
            sgrad = sgrad.toDegreesMinutesSecondsString();
            $(event.map.panes.coordPane).html(sgrad);
            return;
        }
    };
	if(window.GWTK){
		(function ( gwtk ) {
			/**
			 * Сопоставление обработчиков мыши с обработчиками pointer
			 * @type {{mouseup: string, mouseout: string, mousedown: string, mousemove: string, mouseover: string, mouseenter: string, mouseleave: string, pointercancel: string, gotpointercapture: string, lostpointercapture: string}}
			 */
			var mouseEvent2pointerEvent = {
				'mouseup': 'pointerup',
				'mouseout': 'pointerout',
				'mousedown': 'pointerdown',
				'mousemove': 'pointermove',
				'mouseover': 'pointerover',
				'mouseenter': 'pointerenter',
				'mouseleave': 'pointerleave',
				'pointercancel': 'pointercancel',
				'gotpointercapture': 'gotpointercapture',
				'lostpointercapture': 'lostpointercapture'
			};
			/**
			 * Сопоставление обработчиков мыши с обработчиками touch
			 * @type {{mouseup: string, mousedown: string, mousemove: string}}
			 */
			var mouseEvent2touchEvent = {
				'mouseup': 'touchend',
				'mousedown': 'touchstart',
				'mousemove': 'touchmove'
			};

			var uai = {
				/**
				 * Определение версии IE
				 * @return {*}
				 */
				isIE: function () {
					var rv = -1;
					var ua = window.navigator.userAgent;
					var msie = ua.indexOf( 'MSIE ' );
					if ( msie > 0 ) {
						// IE 10 or older => return version number
						return parseInt( ua.substring( msie + 5, ua.indexOf( '.', msie ) ), 10 );
					}
					var trident = ua.indexOf( 'Trident/' );
					if ( trident > 0 ) {
						// IE 11 => return version number
						rv = ua.indexOf( 'rv:' );
						return parseInt( ua.substring( rv + 3, ua.indexOf( '.', rv ) ), 10 );
					}
					var edge = ua.indexOf( 'Edge/' );
					if ( edge > 0 ) {
						// Edge (IE 12+) => return version number
						return parseInt( ua.substring( edge + 5, ua.indexOf( '.', edge ) ), 10 );
					}
					return rv;
				},
				/**
				 * Поддержка Touch событий
				 * @return {boolean}
				 */
				isTouch: function () {
					return !!('ontouchstart' in window);
				},
				/**
				 * Поддержка Touch и Pointer событий
				 * @return {*|boolean}
				 */
				isTouchPointer: function () {
					return this.isPointer() || 'ontouchstart' in window;
				},
				/**
				 * Поддержка MSPointerEvent
				 * @return {boolean|*}
				 */
				isMsPointer: function () {
					return !window.PointerEvent && window.MSPointerEvent;
				},
				/**
				 * Поддержка Pointer событий
				 * @return {boolean}
				 */
				isPointer: function () {
					return !!(window.PointerEvent || this.isMsPointer());
				},
				/**
				 * Поддержка MultiTouch
				 * @return {boolean}
				 */
				isMultiTouch: function () {
					return window.navigator.maxTouchPoints > 1;
				},
				/**
				 * Найти сопоставление названию события мыши
				 * @param eventtype
				 * @return {*}
				 */
				getEvent: function ( eventtype ) {
					eventtype = eventtype.toLowerCase();
					if ( this.isPointer && !this.isTouch ) {
						if( this.mouseEvent2pointerEvent[ eventtype ] ){
							return this.mouseEvent2pointerEvent[ eventtype ];
						}else{
							return eventtype;
						}
					} else {
						return eventtype;
					}
				}
			};
			gwtk[ 'uainfo' ] = {
				mouseEvent2touchEvent: mouseEvent2touchEvent,
				mouseEvent2pointerEvent: mouseEvent2pointerEvent,
				isIE: uai.isIE(),
				isTouch: uai.isTouch(),
				isPointer: uai.isPointer(),
				isTouchPointer: uai.isTouchPointer(),
				isMultiTouch: uai.isMultiTouch(),
				getEvent: uai.getEvent
			};
		})( GWTK );
        GWTK.mouseup = GWTK.uainfo.getEvent('mouseup');
		GWTK.mouseout = GWTK.uainfo.getEvent('mouseout');
		GWTK.mousedown = GWTK.uainfo.getEvent('mousedown');
		GWTK.mousemove = GWTK.uainfo.getEvent('mousemove');
		GWTK.mouseover = GWTK.uainfo.getEvent('mouseover');
		GWTK.mouseenter = GWTK.uainfo.getEvent('mouseenter');
		GWTK.mouseleave = GWTK.uainfo.getEvent('mouseleave');
		GWTK.keydown = GWTK.uainfo.getEvent('keydown');
		GWTK.click = GWTK.uainfo.getEvent('click');
		GWTK.dblclick = GWTK.uainfo.getEvent('dblclick');
	}
}