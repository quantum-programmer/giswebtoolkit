/*************************************** Гиман Н.Л.    02/11/17  ****
 ************************************ Соколова Т.О.    05/06/18 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2017              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Компонент Геообъект точка placemark                   *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {
    GWTK.placemark = function (latlng, title, text, imgurl, small, parentid, map) {
        this.map = map;
        this.latlong = GWTK.toLatLng(latlng);
        this.title = title;
        this.text = text;
        if (imgurl != undefined && imgurl != null)
            this.href = imgurl;
        else
            this.href = GWTK.imgMarkerBlankRed;
        this.parentid = (parentid) ? parentid : null;
        this.offset = GWTK.point(0, 0);            // сдвиг значка относительно точки позиционирования (pixel)
        this.size = GWTK.point(30, 50);            // размер значка
        this.vertex = null;                        // точка привязки (pixel) значка
        this.origin = null;                        // точка экрана (pixel) 
        this.div = "";
        this.img = "";
        this.imgSmall = GWTK.imgMarkerRedPoint;
        this.imgOrigin = "";
        this.init();
        this.create();
    };
    GWTK.placemark.prototype =
    {
        init: function (small) {
            this.latlong = GWTK.toLatLng(this.latlong);
            if (this.title == undefined || this.title == null) this.title = "";
            if (this.text == undefined || this.text == null) this.text = "";
            var loc = window.location.pathname;
            var dir = loc.substring(0, loc.lastIndexOf('/'));
            this.href = this.href;
            this.imgSmall = this.imgSmall;
            this.imgOrigin = this.href;
        },

        create: function (small) {
            var div = document.createElement('div');
            var img = document.createElement('img');
            img.src = this.href;
            div.className = 'placemark' + ((this.parentid) ? ' ' + this.parentid : '');
            div.appendChild(img);
            this.div = div;
            this.img = img;
            var that = this;
	        $( this.div ).on( "click", function ( e ) {
	            if(that.map && that.map.eventPane.id){
		            // var eventPanelId = that.map.eventPane.id;
		            $( that.map.eventPane).trigger( { type: 'placemarkclick', placemarkdata: e } );
		            e.stopPropagation();
		            e.preventDefault();
                }
	            
	        } );
	        $(this.div).on("mouseover", function (e) {
	            if (that.map && that.map.overlayPane) {
	                if (that.title) {
	                    that.appendHint(that.map.overlayPane, that.title);
	                }
	                e.stopPropagation();
	                e.preventDefault();
	            }

	        });
	        $(this.div).on("mouseout", function (e) {
	            if (that.map && that.map.overlayPane) {
	                if (that.title) {
	                    $('.' + that.cls.replace(/ /g, '.')).remove();
	                }
	                e.stopPropagation();
	                e.preventDefault();
	            }
	        });
            $( this.div ).on("mousewheel DOMMouseScroll wheel MozMousePixelScroll", function(e) {
                if (that.map)
                    that.map.trigger({ type: 'mousewheel', target: 'map', originalEvent: e });
            }); 
        },

        position: function (coord) {
            if (!coord) return coord;

            var point = null;
            if (coord instanceof GWTK.Point) {
                point = new GWTK.Point(coord.x, coord.y);
            }
            else if (GWTK.Util.isArray(coord) && coord.length > 1) {
                point = new GWTK.Point(coord[0], coord[1]);
            }
            if (!point) return coord;

            this.origin = new GWTK.Point(point.x, point.y);
            //this.origin = point;
            if (this.size != undefined && this.size != null) {
                this.offset.x = -Math.round(this.size.x / 2);
                this.offset.y = -this.size.y;
            }
            point.x += this.offset.x;
            point.y += this.offset.y;
            GWTK.DomUtil.setPosition(this.div, point);
            this.vertex = new GWTK.Point(point.x, point.y);  // точка привязки
            return this.vertex;
        },

        setSize: function (size) {
            if (!size) return;
            if (size instanceof GWTK.Point) {
                this.size = size;
            }
            else if (GWTK.Util.isArray(size)) {
                this.size = new GWTK.Point(size[0], size[1]);
            }
            return;
        },

        toPoint: function () {
            if (this.latlong === null) return null;
            return GWTK.point(this.latlong.lat, this.latlong.lng);
        },

        isgeopoint: function () {
            if (this.latlong === null) return false;
            return true;
        },

        geopoint: function () { return this.div; },

        setImage: function (position, small, size) {

            if (small === undefined || small === null) return;
            var w = 10, h = 10;
            if (small) {
                this.img.src = this.imgSmall;
                this.img.className = 'placemark-img-size-small';
                this.div.className = 'placemark' + ((this.parentid) ? ' ' + this.parentid : '');
                if (size && size.length > 1) {
                    w = size[0]; h = size[1];
                }
                else {
                    w = parseInt($(this.img).css('width'));
                    h = parseInt($(this.img).css('height'));
                }
                if (!w) w = 10; if (!h) h = 10;

                this.setSize([w, h]);
                if (this.vertex) {
                    this.position(this.origin);
                }
            }
            else {
                w = 30; h = 50;
                this.img.src = this.imgOrigin;
                $(this.img).removeClass('placemark-img-size-small');
                $(this.img).addClass('placemark-img-size');
                $(this.div).addClass('placemark-topmost');
                if (size && size.length > 1) {
                    w = size[0]; h = size[1];
                }
                else {
                    w = parseInt($(this.img).css('width'));
                    h = parseInt($(this.img).css('height'));
                }
                this.setSize([w, h]);

                if (this.vertex) {
                    this.position(this.origin);
                }
            }

            if (position != undefined && position instanceof GWTK.Point) {
                this.position(position);
            }
        },

        // Добавить подпись к маркеру
        appendHint: function (parent, hint) {
            if (!hint)
                hint = this.title;
            this.cls = 'ruler-point-hint placemark' + ((this.parentid) ? ' ' + this.parentid : '');
            if (hint && hint != '') {
                if (parent)
                    $(parent).append('<div class="' + this.cls + '" style="white-space:normal; word-wrap:break-word; width:200px; padding:5px; background-color:white;left:' + this.origin.x.toString() + 'px; top:' + (this.origin.y - 15).toString() + 'px;" >' + hint + '</div>');
            }
        }

    }
}