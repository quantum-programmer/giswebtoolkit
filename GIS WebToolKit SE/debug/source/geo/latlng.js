/*************************************** Нефедьева О. 10/01/18 ******
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2018              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Точка с геокоординатами (широта, долгота)         *
 *                                                                  *
 *******************************************************************/
/*
 * GWTK.LatLng represents a geographical point with latitude and longitude coordinates.
 */
if (window.GWTK)
GWTK.LatLng = function (lat, lng, alt) { // (Number, Number, Number)
    
    lat = parseFloat(lat);
	lng = parseFloat(lng);

	if (isNaN(lat) || isNaN(lng)) {
	    throw new Error('Invalid LatLng object: (' + NaN + ', ' + NaN + ')');
	}

	this.lat = lat;                         // -90, 90
	this.lng = lng;                         // -180, 180

	if (alt !== undefined) {
		this.alt = parseFloat(alt);
	}

	this.DEG_TO_RAD = Math.PI / 180;
	this.RAD_TO_DEG = 180 / Math.PI;
	this.MAX_MARGIN = 1.0E-9;
};

GWTK.LatLng.prototype = {

    equals: function (obj) {           // (LatLng) -> Boolean
		if (!obj) { return false; }

		obj = GWTK.toLatLng(obj);

		var margin = Math.max(
		        Math.abs(this.lat - obj.lat),
		        Math.abs(this.lng - obj.lng));

		return margin <= this.MAX_MARGIN;
	},

	toString: function (precision) {   // (Number) -> String
		return  GWTK.Util.formatNum(this.lat, precision) + ',' + 
		        GWTK.Util.formatNum(this.lng, precision);
	},

	// Haversine distance formula, see http://en.wikipedia.org/wiki/Haversine_formula
	// 
	distanceTo: function (other) { // (LatLng) -> Number
	    other = GWTK.toLatLng(other);

		var R = 6378137,                       // earth radius in meters
		    d2r = this.DEG_TO_RAD,
		    dLat = (other.lat - this.lat) * d2r,
		    dLon = (other.lng - this.lng) * d2r,
		    lat1 = this.lat * d2r,
		    lat2 = other.lat * d2r,
		    sin1 = Math.sin(dLat / 2),
		    sin2 = Math.sin(dLon / 2);

		var a = sin1 * sin1 + sin2 * sin2 * Math.cos(lat1) * Math.cos(lat2);

		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	},

	wrap: function (a, b) {             // (Number, Number) -> LatLng
		var lng = this.lng;

		a = a || -180;
		b = b ||  180;

		lng = (lng + b) % (b - a) + (lng < a || lng === b ? b : a);

		return new GWTK.LatLng(this.lat, lng);
	},

	toRadians: function () {
	    var lng = this.lng * this.DEG_TO_RAD;
	    var lat = this.lat * this.DEG_TO_RAD;
	    return GWTK.toLatLng(lat, lng);
	},

	toDegreesMinutesSecondsString: function(){
	    var str = w2utils.lang("Latitude") + " = " + this.Degrees2DegreesMinutesSeconds(this.lat) + "   " + w2utils.lang("Longitude") + " = " + this.Degrees2DegreesMinutesSeconds(this.lng) + " ";
	    return str;
	},

	Degrees2DegreesMinutesSeconds: function (degrees) {
	    var Result = "";
	    var iDegrees = parseInt(degrees, 10);
	    var minutes = (degrees - parseFloat(iDegrees)) * 60.0;
	    var iMinutes = parseInt(minutes, 10);
	    var seconds = (minutes - parseFloat(iMinutes)) * 60.0;
	    if ((seconds + 0.001) > 60.0) {
	        seconds = 0;
	        iMinutes += 1;
	    }
	    var seconds1 = parseInt(seconds, 10);
	    if (iMinutes >= 60) {
	        iMinutes = 0;
	        iDegrees += 1;
	    }

	    iDegrees = iDegrees % 360;
	    if (iDegrees < 0) {
	        Result = "-";
	        iDegrees = Math.abs(iDegrees);
	    }
	    else Result = "";

	    if (iDegrees < 10)
	        Result = Result + "00";
	    else if (iDegrees < 100)
	        Result = Result + "0";

	    Result = Result + iDegrees.toString(10) + "° ";

	    iMinutes = Math.abs(iMinutes);
	    //if (iMinutes < 10) iMinutes = "0" + iMinutes;
	    //Result += iMinutes + "' ";
	    iMinutes < 10 ? Result += "0" + iMinutes + "' " : Result += iMinutes + "' ";
	    
	    seconds = Math.abs(seconds);
	    if (seconds < 10)
	        Result = Result + "0";

	    return (Result + parseInt(seconds, 10) + "''");
	},

	DegreesMinutesSeconds2Degrees: function (degrees, minutes, seconds) {
	    var deg = 0, min = 0, sec = 0;
	    if (degrees) deg = parseFloat(degrees);
	    if (minutes) min = parseFloat(minutes);
	    if (seconds) sec = parseFloat(seconds);
	    if (deg < 0.0) {
	        deg += (min + sec / 60.0) / -60.0;
	    }
	    else {
	        deg += (min + sec / 60.0) / 60.0;
	    }
	    return deg;
	}
};

GWTK.toLatLng = function (a, b) {       // (LatLng) or ([Number, Number]) or (Number, Number)
    if (a instanceof GWTK.LatLng) {
		return a;
	}
    if (a === undefined || a === null) {
        return null;
    }
    
    if (GWTK.Util.isArray(a)) {
		if (typeof a[0] === 'number' || typeof a[0] === 'string') {
		    return new GWTK.LatLng(a[0], a[1], a[2]);
		} else {
			return null;
		}
    }

    if (b === undefined) return null;
	
	if (typeof a === 'object' && 'lat' in a) {
	    return new GWTK.LatLng(a.lat, 'lng' in a ? a.lng : a.lon);
	}
	return new GWTK.LatLng(a, b);
};

