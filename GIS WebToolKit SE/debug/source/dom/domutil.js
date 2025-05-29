/*
 * L.DomUtil contains various utility functions for working with DOM.
 */

GWTK.DomUtil = {

	get: function (id) {
		return (typeof id === 'string' ? document.getElementById(id) : null);
	},

	getStyle: function (el, style) {

		var value = el.style[style];

		if (!value && el.currentStyle) {
			value = el.currentStyle[style];
		}

		if ((!value || value === 'auto') && document.defaultView) {
			var css = document.defaultView.getComputedStyle(el, null);
			value = css ? css[style] : null;
		}

		return value === 'auto' ? null : value;
	},

	getViewportOffset: function (element) {

		var top = 0,
		    left = 0,
		    el = element,
		    docBody = document.body,
		    docEl = document.documentElement,
		    pos;

		do {
			top  += el.offsetTop  || 0;
			left += el.offsetLeft || 0;

			//add borders
			top += parseInt(GWTK.DomUtil.getStyle(el, 'borderTopWidth'), 10) || 0;
			left += parseInt(GWTK.DomUtil.getStyle(el, 'borderLeftWidth'), 10) || 0;

			pos = GWTK.DomUtil.getStyle(el, 'position');

			if (el.offsetParent === docBody && pos === 'absolute') { break; }

			if (pos === 'fixed') {
				top  += docBody.scrollTop  || docEl.scrollTop  || 0;
				left += docBody.scrollLeft || docEl.scrollLeft || 0;
				break;
			}

			if (pos === 'relative' && !el.offsetLeft) {
			    var width = GWTK.DomUtil.getStyle(el, 'width'),
				    maxWidth = GWTK.DomUtil.getStyle(el, 'max-width'),
				    r = el.getBoundingClientRect();

				if (width !== 'none' || maxWidth !== 'none') {
					left += r.left + el.clientLeft;
				}

				//calculate full y offset since we're breaking out of the loop
				top += r.top + (docBody.scrollTop  || docEl.scrollTop  || 0);

				break;
			}

			el = el.offsetParent;

		} while (el);

		el = element;

		do {
			if (el === docBody) { break; }

			top  -= el.scrollTop  || 0;
			left -= el.scrollLeft || 0;

			el = el.parentNode;
		} while (el);

		return new GWTK.Point(left, top);
	},

	documentIsLtr: function () {
	    if (!GWTK.DomUtil._docIsLtrCached) {
	        GWTK.DomUtil._docIsLtrCached = true;
	        GWTK.DomUtil._docIsLtr = GWTK.DomUtil.getStyle(document.body, 'direction') === 'ltr';
		}
	    return GWTK.DomUtil._docIsLtr;
	},

	create: function (tagName, className, container) {

	    var el = document.createElement(tagName);

	    if (className && className.length > 0)
		    el.className = className;

		if (container) {
			container.appendChild(el);
		}

		return el;
	},

	hasClass: function (el, name) {
		if (el.classList !== undefined) {
			return el.classList.contains(name);
		}
		var className = GWTK.DomUtil._getClass(el);
		return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
	},

	addClass: function (el, name) {
		if (el.classList !== undefined) {
		    var classes = GWTK.Util.splitWords(name);
			for (var i = 0, len = classes.length; i < len; i++) {
				el.classList.add(classes[i]);
			}
		} else if (!GWTK.DomUtil.hasClass(el, name)) {
		    var className = GWTK.DomUtil._getClass(el);
		    GWTK.DomUtil._setClass(el, (className ? className + ' ' : '') + name);
		}
	},

	removeClass: function (el, name) {
		if (el.classList !== undefined) {
			el.classList.remove(name);
		} else {
		    GWTK.DomUtil._setClass(el, GWTK.Util.trim((' ' + GWTK.DomUtil._getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
		}
	},

	_setClass: function (el, name) {
		if (el.className.baseVal === undefined) {
			el.className = name;
		} else {
			// in case of SVG element
			el.className.baseVal = name;
		}
	},

	_getClass: function (el) {
		return el.className.baseVal === undefined ? el.className : el.className.baseVal;
	},

	setOpacity: function (el, value) {

		if ('opacity' in el.style) {
			el.style.opacity = value;

		} else if ('filter' in el.style) {

			var filter = false,
			    filterName = 'DXImageTransform.Microsoft.Alpha';

			// filters collection throws an error if we try to retrieve a filter that doesn't exist
			try {
				filter = el.filters.item(filterName);
			} catch (e) {
				// don't set opacity to 1 if we haven't already set an opacity,
				// it isn't needed and breaks transparent pngs.
				if (value === 1) { return; }
			}

			value = Math.round(value * 100);

			if (filter) {
				filter.Enabled = (value !== 100);
				filter.Opacity = value;
			} else {
				el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
			}
		}
	},

	testProp: function (props) {

		var style = document.documentElement.style;

		for (var i = 0; i < props.length; i++) {
			if (props[i] in style) {
				return props[i];
			}
		}
		return false;
	},

	getTranslateString: function (point) {
		// on WebKit browsers (Chrome/Safari/iOS Safari/Android) using translate3d instead of translate
		// makes animation smoother as it ensures HW accel is used. Firefox 13 doesn't care
		// (same speed either way), Opera 12 doesn't support translate3d

		var is3d = L.Browser.webkit3d,
		    open = 'translate' + (is3d ? '3d' : '') + '(',
		    close = (is3d ? ',0' : '') + ')';

		return open + point.x + 'px,' + point.y + 'px' + close;
	},

	getScaleString: function (scale, origin) {

	    var preTranslateStr = GWTK.DomUtil.getTranslateString(origin.add(origin.multiplyBy(-1 * scale))),
		    scaleStr = ' scale(' + scale + ') ';

		return preTranslateStr + scaleStr;
	},

	setPosition: function (el, point) { // (HTMLElement, Point)
	    if (point == null || point == undefined) return;
	    if (isNaN(point.x) || isNaN(point.y)) return;
		el._pos = point;
		el.style.left = point.x + 'px';
		el.style.top = point.y + 'px';
	},

	getPosition: function (el) {
		// this method is only used for elements previously positioned using setPosition,
		// so it's safe to cache the position for performance
		return el._pos;
	},

	setPositionAttr: function (el, left, top) {
	    if (!el || isNaN(left) || isNaN(top)) return;
	    el.style.left = left + 'px';
	    el.style.top = top + 'px';
	    $(el).attr('_id', left + " " + top);
	},

	getPositionAttr: function (el) {
	    if (!el) return;
	    return $(el).attr('_id');
	},

	setActiveElement: function (selector) {
	    $(selector).addClass('control-button-active');
        return;
	},

	removeActiveElement: function (selector) {
	    if (!selector) return;
	    var $sel = $(selector);
	    $sel.removeClass('control-button-active');
	    return $sel;
	},

	isActiveElement: function (selector) {
	    return $(selector).hasClass('control-button-active');
	}

 
};

