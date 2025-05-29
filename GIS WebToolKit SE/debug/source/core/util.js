/********************************* Нефедьева О.А. **** 26/03/21 ****
********************************** Полищук Г.В.   **** 15/12/20 ****
********************************** Соколова Т.О.  **** 05/12/20 ****
********************************** Патейчук В.К.  **** 20/05/20 ****
********************************** Помозов Е.В.   **** 12/03/21 ****
*                                                                  *
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2022              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                       Служебные функции                          *
*                                                                  *
*******************************************************************/
/**
  * Список инструментов карты
*/
GWTK.mapControls = [
                    "mapscale",                                                            // отображение масштаба карты
                    "mapcoordinates", "scaleupdown", "scalebyrect", "scalerulercontrol",   // координаты курсора, кнопки масштабирования, масштабирование рамкой, линейка масштаба
                    "search", "searchSem", "areasearch",                                   // поиск, поиск по семантике, поиск по области
                    "selectobjects", "clearselect",                                        // произвольный выбор объектов, сброс выделения
                    "objectslayer", "content",                                             // объекты слоя, состав слоев карты
                    "builderofzone", "buildheatmap",                                       // построение зоны, построение тепловой карты
                    "ruler", "polygonarea", "anglemeter", "mapcalculations",               // измерение расстояние, площади, углов, расчеты по карте
                    "transitiontopoint", "shutter", "maplink",                             // переход в точку, шторка слоев, поделиться,
                    "viewoptions",                                                         // параметры карты
                    "featuresamplescontrol",                                               // списки объектов
                    "rosreestr",                                                           // данные Росреестра
                    "localmapcontrol", "clusterizator",                                    // локальные слои, кластеризатор
                    "addressatcoord", "geolocation",                                       // адрес по координатам точки, геолокация
                    "map3d", "routecontrol", "matrixcontrol",                              // 3Dкарта, маршруты проезда, значения матрицы в точке
                    "thematicmapcontrol", "thematicmap",                                   // создание темкарт, просмотр темкарт из GEOJSON
                    "objectPanel",                                                         // Отображение информации об объектах карты
                    "mapeditor",                                                           // редактор карты
                    "map2img",                                                             // печать карты
                    "progresscontrol",                                                     // индикатор процесса
                    "navigatorcontrol"                                                     // навигатор карты
];

GWTK.Util = {

    /**
	 * Преобразовать hex значение цвета для css
     * @method hexToRgb
	 * @param hex {String} значение цвета
	 * @return {String} 'rgb(red, green, blue)'
	 */
    // ===============================================================
	hexToRgb: function ( hex ) {
		function hexToR( h ) {
			return parseInt( (cutHex( h )).substring( 0, 2 ), 16 );
		}

		function hexToG( h ) {
			return parseInt( (cutHex( h )).substring( 2, 4 ), 16 );
		}

		function hexToB( h ) {
			return parseInt( (cutHex( h )).substring( 4, 6 ), 16 );
		}

		function cutHex( h ) {
			return (h.charAt( 0 ) == "#") ? h.substring( 1, 7 ) : h;
		}

		return 'rgb(' + hexToR( hex ) + ', '+ hexToG( hex ) + ', ' + hexToB( hex ) + ')';
	},

	/**
	 * Запросить имя узла дерева
     * @method getTreeTitle
	 * @param el {Object} элемент дерева
	 * @param id  {String} id элемента
	 * @param treeName {String} имя (name) дерева (w2ui.sidebar)
	 */
    // ===============================================================
	getTreeTitle: function( el, id, treeName ){
		try {
			if (!id) {
				id = el.id;
			}

			if (!id || id.length == 0) { return; }

			if (!treeName || !treeName.length) {
			    return;
			}
			var node = w2ui[treeName].get(id), nodeParent, str = '', arr = [], tabs;
			if (!node) {
				console.log('Can not find node with id = ' + id + 'in w2ui[' + treeName + ']');
				return false;
			} else {
				nodeParent = node;
				if (nodeParent && nodeParent.hint) {
					arr.push(nodeParent.hint);
				}
				while (nodeParent != w2ui[treeName]) {
					nodeParent = nodeParent.parent;
					if (nodeParent && nodeParent.hint) {
						arr.push(nodeParent.hint);
					}
				}
				arr.reverse();
				for (var i = 0; i < arr.length; i++) {
					tabs = new Array(i + 1).join('\u0020\u0020\u0020\u0020');
					str += arr[i] + '\n\u0020\u0020\u0020' + tabs;

				}
				$(el)[0].title = str;
			}
		} catch ( e ){
			console.log(e);
		}
	},

	/**
	 * Открыть файл
     * @method openFile
	 * @param callBack {Function} функция обратного вызова
     * функция читает содержимое файла и возвращает его в callBack
	 */
    // ===============================================================
	openFile: function (callback) {
	    var input = $('<input type="file" name="mapFileName">');
	    $(input).on("change", (function () {
	        (function openFile(file) {
	            var fileName = file[0];
	            var reader = new FileReader();
	            reader.onload = function (e) {
	                try {
	                    callback(e.target.result);
	                } catch (err) {
	                    console.log(err);
	                    $("input[name=mapFileName]").val("");
	                    w2alert(w2utils.lang("The file is not valid"));
	                }
	            };
	            var name = /(.+)\./.exec(fileName.name)[1];
	            reader.readAsText(fileName);
	        })(this.files);
	    }));
	    input.trigger('click'); // opening dialog

	},

    /**
	 * Сохранить данные в файл
     * @method saveDataInFile
	 * @param str {String}  данные
	 * @param fullfilename {String} имя файла с расширением
	 */
    // ===============================================================
	saveDataInFile: function (str, fullfilename) {
	    if (!fullfilename) {
	        console.log('Can not save file without extension');
	        return false;
	    }
	    var saveData = (function () {
	        var a = document.createElement("a");
	        document.body.appendChild(a);
	        a.style = "display: none";
	        return function (data, fileName) {
	            var json = data,
					blob = new Blob([json], { type: "octet/stream" }),
					url = window.URL.createObjectURL(blob);
	            var ua = navigator.userAgent;
	            if (ua.search(/Trident/) != -1) {
	                //IE
	                window.navigator.msSaveBlob(blob, fileName);
	                return true;
	            }
	            a.href = url;
	            a.download = fileName;
	            a.click();
	            window.URL.revokeObjectURL(url);
	        };
	    }());
	    saveData(str, fullfilename);
	},

	/**
     * Создать заголовок панели компонента
     * @method createHeaderForComponent
     * @param options {Object} - JSON-параметры:
     *		  		name - текст заголовка,
     *				callback - функция обратного вызова при закрытии окна
     *      		map - ссылка на карту,
     *      		parent - родительский элемент,
     *      		context - контекст вызова для слушателей событий,
     *      		minimizePanel - панель, которую сворачивать при нажатии на иконку сворачивания (DOM|Jquery-элемент),
	 *      	    minimizeIconClass - класс иконки, обозначающей свёрнутую панель
     * @return {Element} - div, контейнер заголовка
	 */
	createHeaderForComponent: function (options) {
		var div = document.createElement( 'div' );
		div.className = 'panel-info-header';
		var span = document.createElement('span');
		if (options && options.name) {
		    span.innerHTML = w2utils.lang(options.name);
		}
		div.appendChild( span );

		var img = GWTK.DomUtil.create('div', 'panel-info-close');
		img.title = w2utils.lang('Close');
		$(img).html('<span><svg class="info-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 10.586L8.707 7.293a1 1 0 0 0-1.414 1.414L10.586 12l-3.293 3.293a1 1 0 0 0 1.414 1.414L12 13.414l3.293 3.293a1 1 0 0 0 1.414-1.414L13.414 12l3.293-3.293a1 1 0 1 0-1.414-1.414L12 10.586z"></path></svg></span>');
		$(img).on('click', function (event) {
		    if (options && options.map && options.context) {
		        $(options.map.eventPane).trigger({ type: 'closecomponent', context: options.context } );
            }
		    if (options && $.isFunction(options.callback)) options.callback();
            // options.map && options.map.getTaskManager().checkOldTaskCreation('gwtk-old-undefined');
		});

		div.appendChild(img);

		if (options && options.parent) {
		    options.parent.appendChild(div);
		}

        // Иконка "Сворачивание окна"
        if (options && options.minimizePanel && options.map) {
            var mapTaskBar = options.map.mapTool('maptaskbar');
            if (mapTaskBar) {
			// Добавление иконки выполнить с задержкой, чтобы панель заголовка успела внедриться в DOM
			setTimeout(function () {
				mapTaskBar.onPanelClose($(options.minimizePanel));  // защита при повторном открытии окна
				mapTaskBar.addToPanel($(options.minimizePanel), options.context, options.minimizeIconClass);
			});
            }
        }

		return div;
	},

	/**
	 * Запросить w2ui overlay для отображения измерений объекта
	 * @method getMeasurementOverlay
	 * @param e {Object} объект события
	 * @param map - объект класса карты
	 */
    // ===============================================================
	getMeasurementOverlay: function ( e, map ) {
		var html = '';
		var areaSum     = 0;
		var perimetrSum = 0;

	    var mapobjects = map.selectedObjects.mapobjects;

		$(function(){
			$(document).mouseup(function ( event ) {
				if(!$(event.target).hasClass('apdiv') && event.target.id != event.target.id){
					$('#w2ui-overlay-Measurement').remove();
				}
				event.stopPropagation();
			});
            $(map.overlayPane).on('mapclick', function () {
                $('#w2ui-overlay-Measurement').remove();
            });
		});

		for(var i = 0; i < mapobjects.length; i++ ){
			if( mapobjects[ i ] && mapobjects[ i ][ 'arealoaded' ] ){
				areaSum += mapobjects[ i ][ 'arealoaded' ];
			}
			if( mapobjects[ i ] && mapobjects[ i ][ 'perimeterloaded' ] ) {
				perimetrSum += mapobjects[ i ][ 'perimeterloaded' ];
			}
		}

		if( areaSum > 0 ){
			areaSum = map.squareMetersToUnits( areaSum );
			html += '<tr><td class="area-perimeter-div apdiv" ><span class="apdiv">' + w2utils.lang( "The total area of ​​the selected objects" ) + ' : </span></td><td><input readonly class="apdiv" value="' +  areaSum.area.toFixed(3) + ' ' + w2utils.lang( areaSum.unit ) + '" /></td></tr>';
		}
		if (perimetrSum > 0) {
		    perimetrSum = map.linearMetersToUnits(perimetrSum);
		    if (perimetrSum.unit == 'ft' || perimetrSum.unit == 'Nm')
		        perimetrSum.unit += ' ';
		    html += '<tr><td class="area-perimeter-div apdiv" ><span class="apdiv">' + w2utils.lang("The total perimeter of the selected objects") + ' : </span></td><td><input readonly class="apdiv" value="' + perimetrSum.perimeter.toFixed(3) + ' ' + w2utils.lang(perimetrSum.unit) + '" />.</td></tr>';
		}
		if (typeof perimetrSum == 'object' || typeof areaSum == 'object') {
			if( perimetrSum.perimeter > 0 || areaSum.area > 0 ){
				$( e.target ).w2overlay( '<table>' + html + '</table>', { name: 'Measurement' });
			}
		}
		else {
			if( perimetrSum > 0 || areaSum > 0 ){
				$( e.target ).w2overlay( '<table>' + html + '</table>', { name: 'Measurement' });
			}
		}

	},


	extend: function (dest) { // (Object[, Object, ...]) ->
		var sources = Array.prototype.slice.call(arguments, 1),
		    i, j, len, src;

		for (j = 0, len = sources.length; j < len; j++) {
			src = sources[j] || {};
			for (i in src) {
				if (src.hasOwnProperty(i)) {
					dest[i] = src[i];
				}
			}
		}
		return dest;
	},

	formatNum: function (num, digits) {
		var pow = Math.pow(10, digits || 5);
		return Math.round(num * pow) / pow;
	},

	trim: function (str) {
		return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
	},

	splitWords: function (str) {
	    return GWTK.Util.trim(str).split(/\s+/);
	},

	setOptions: function (obj, options) {
	    obj.options = GWTK.extend({}, obj.options, options);
		return obj.options;
	},

	getParamString: function (obj, existingUrl, uppercase) {
		var params = [];
		for (var i in obj) {
			params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
		}
		return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
	},

	template: function (str, data) {
		return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
			var value = data[key];
			if (value === undefined) {
				throw new Error('No value provided for variable ' + str);
			} else if (typeof value === 'function') {
				value = value(data);
			}
			return value;
		});
	},

    /**
	 * Связать функцию c контекстом вызова
     * @method  bind
	 * @param func {Function} функция
     * @param context {Object} контекст вызова
     * @return {Function}
     */
    // ===============================================================
	bind: function (func, context) {
	    return function () { return func.apply(context, arguments); };
	},

     /**
	 * Проверить является ли массивом
     * method isArray
     * @param obj {Object} проверяемый объект
     * @return {Boolean} true/false (да/нет)
     */
    // ===============================================================
	isArray: Array.isArray || function (obj) {
		return (Object.prototype.toString.call(obj) === '[object Array]');
	},

    /**
    * Преобразовать в Boolean
    * method parseBoolean
    * @param string {String} строка "true"/"false"
    * @return {Boolean}
    */
    // ===============================================================
	parseBoolean: function (string) {
	    if (typeof string == "boolean") return string;
	    if (typeof string !== "string") return undefined;

	    var bool = undefined,
            test = string.toLowerCase();
	    if (test === 'true')
	        bool = true;
	    else if (test === 'false')
	        bool = false;

	    return bool;
	},

    /**
    * Индекс элемента в массиве
    * method indexOf
    * @param obj {Array} массив
    * @param item {Object} элемент массива
    * @return {Number} индекс элемента в массиве или -1 при отсутствии
    */
    // ===============================================================
	indexOf: function (obj, item, fromIndex) {
	    if (!this.isArray(obj) || !item) return -2;
	    if (Array.prototype.indexOf != undefined) {
	        return obj.indexOf(item, fromIndex);
	    }
   	    Array.prototype.indexOf = function (item, fromIndex) {
	        if (!fromIndex) {
	            fromIndex = 0;
	        } else if (fromIndex < 0) {
	            fromIndex = Math.max(0, this.length + fromIndex);
	        }
	        for (var i = fromIndex, j = this.length; i < j; i++) {
	            if (this[i] === item)
	                return i;
	        }
	        return -1;
   	    };
  	    return obj.indexOf(item, fromIndex);
	},

    /**
     * Запросить список уникальных значений элементов массива
     * method getUniqueArrayList
     * @param array {Array} массив
     * @return {String} список уникальных значений элементов массива
    */
    // ===============================================================
 	getUniqueArrayList: function (array) {
	    if (!array || !this.isArray(array)) return "";
	    var tempObj = {}, len = array.length;
	    if (!len) return "";

	    for (var i = 0; i < len; i++) {
	        tempObj[array[i]] = 1;
	    }
	    return Object.keys(tempObj).toString();
	},

    /**
     * Запросить параметры из URL
     * method getParamsFromURL
     * @param url {String} строка запроса (url)
     * @return {Object} параметры url в виде пар ключ:значение
    */
    // ===============================================================
	getParamsFromURL: function (url) {
	    //url = url.replace(/\% ?/g, "");                                              // 22/10/18

        var parms = {}, pieces, parts, i;
        if (url) {
            var hash = url.lastIndexOf("#");
            if (hash !== -1) {
                // isolate just the hash value
                url = url.slice(hash + 1);
            }
            var question = url.indexOf("?");
            if (question !== -1) {
                url = url.slice(question + 1);
                pieces = url.split("&");
                for (i = 0; i < pieces.length; i++) {
                    parts = pieces[i].split("=");
                    if (parts.length < 2) {
                        parts.push("");
                    }
                    else if (parts.length > 2){
                        var p1 = parts[0];
                        parts.splice(0, 1);
                        var p2 = parts.join('=');
                        parts = [p1, p2];
                    }
                    //parms[decodeURIComponent(parts[0]).toLowerCase()] = decodeURIComponent(parts[1]); // 22/10/18
                    parms[parts[0].toLowerCase()] = parts[1];
                }
            }
        }
        return parms;
	},

    /**
     * Преобразовать параметры url в xmlRpc
     * method url2xmlRpc
     * @param url {String} строка запроса (url)
     * @param method {String} имя Rest-метода
     * @return {String} xml строка в xmlRpc
    */
    // ===============================================================
	url2xmlRpc: function (url, method) {
	    if (!url) return "";
	    var param = this.getParamsFromURL(url);
        if ($.isEmptyObject(param))
	        return "";

	    var xcall = "<?xml version='1.0' encoding='utf-8'?><methodCall><methodName>" + method + "</methodName>";
	    var rpc = "<params><param><value><struct>";
	    var end = "</struct></value></param></params>";

	    for (var key in param) {
	        var val = param[key];
	        if (window.XDomainRequest) val = encodeURIComponent(val);
	        var member = "<member><name>" + key + "</name><value>";
	        if (key.toLowerCase() == 'filedata') {
	            member += "<base64>" + val + "</base64></value></member>";
	        }
	        else {
	            member += "<string>" + val + "</string></value></member>";
	        }
	        rpc += member;
	    }
	    xcall = xcall + rpc + end + "</methodCall>";
	    return xcall;
	},

    /**
     * Преобразовать параметры url в xmlRpc с фильтром слоев
     * method url2xmlRpcEx
     * @param url {String} строка запроса (url)
     * @param method {String} имя Rest-метода
     * @param layers {Array} массив объектов-описаний слоев карты [{layerid:idLayer, typenames:typeNames, codelist:codeList)], фильтр
     * @param xdata {Array} xml-данные в кодировке base64 (область, метрика,...) фильтр отбора объектов
     * @return {String} xml строка в xmlRpc
    */
    // ===============================================================
	url2xmlRpcEx: function (url, method, layers, xdata) {  //  layers = {"layerid":id, "textfilter":filter, "typenames":types, "codelist":codelist, "idlist":idlist}

	    if (!url || !layers || !Array.isArray(layers)) {
	        console.log("ERROR: GWTK.Util.url2xmlRpcEx input parameters error. url: " + url + ' method: ' + method, layers);
	        return "";
	    }
	    var param = this.getParamsFromURL(url), i, len;

        var rpc = "<params><param><value>",
        xcall = "<?xml version='1.0' encoding='utf-8'?><methodCall><methodName>" + method + "</methodName>" + rpc,
        arraydata = "<array><data>", arraydataEnd = "</struct></data></array>",
        layfilter = '', member = '';
	    if (xdata) {                          // xml-данные в кодировке base64 (область, метрика,...)
	        if (!Array.isArray(xdata)) {
	            console.log("ERROR: GWTK.Util.url2xmlRpcEx input parameters error.");
	            return '';
	        }
	        len = xdata.length;
	        for (i = 0; i < len; i++) {
	            xcall += "<base64>" + xdata[i] + "</base64>";
	        }
	    }

	    len = layers.length;
	    for (i = 0; i < len; i++) {                                                        // фильтры слоев
	        var _layerId = GWTK.Util.getIdLayerXml(layers[i].layerid);
	        var layfilter = arraydata + "<value><string>" + _layerId + "</string></value><struct>";    // начало параметров слоя
            if (Array.isArray(url))
                param = this.getParamsFromURL(url[i]);
	        if (!$.isEmptyObject(param)) {
	            for (var key in param) {
	                var val = param[key];
                        if (key.toLowerCase() == 'layers'){
                           val = _layerId;
                        }
                        if (key.toLowerCase() == 'crs') {
                            val =  decodeURIComponent(val);
                        }
	                if (window.XDomainRequest) val = encodeURIComponent(val);
	                var member = "<member><name>" + key + "</name><value>";
	                if (key.toLowerCase() == 'filedata') {
	                    member += "<i4>" + val + "</i4></value></member>";
	                }
	                else {
	                    member += "<string>" + val + "</string></value></member>";
	                }
	                layfilter += member;
	            }
	        }
            for (var key in layers[i]) {
                if (key == 'layerid' || layers[i][key] == undefined) { continue; }
                layfilter += "<member><name>" + key + "</name><value><string>" + layers[i][key] + "</string></value></member>";
            }

	        layfilter += arraydataEnd;                                                        // конец параметров слоя
	        xcall += layfilter;
	    }
	    xcall += "</value></param></params></methodCall>";

	    return xcall;
	},

   /**
      * Клонировать карту
      * method cloneMap
      * @param map {Object} карта GWTK.Map
    */
    // ===============================================================

	cloneMap: function (map) {
	    if (!map) {
	        return false;
	    }

	    var map = map, $div_clone = map.mapClone !== null ? map.mapClone : undefined;

	    if (!$div_clone) {
	        map.mapClone = $(map.tilePane).clone(true);
	        $div_clone = map.mapClone;
	        $div_clone.find('.gwtk-tiles').remove();
	        $div_clone[0].id = map.tilePane.id + "_temp";
	        $div_clone.find('.wms-panel').remove();
	        var $cc = $(map.mapPane).find('.map-canvas-main').clone();
	        $cc.addClass('temp_canvas').removeClass('map-canvas-main');
	        $cc.appendTo($div_clone);

	        $div_clone.insertAfter(map.tilePane);
	    }

	    return $div_clone;
	},

    /**
     * Преобразовать строку в кодировке utf8 в Base64
     * method utf8ToBase64
     * @param str {String} строка utf8
     * @returns {String} строка Base64
     */
    // ===============================================================
	utf8ToBase64: function (str) {
	    if (!window.btoa) return "";
	    return window.btoa(unescape(encodeURIComponent(str)));
	},

    /**
     * Преобразовать строку в кодировке base64 в utf8
     * method base64ToUtf8
     * @param str {String} строка base64
     * @returns {String} строка utf8
     */
    // ===============================================================
    base64ToUtf8:function(str) {
        if (!window.atob) return "";
        return decodeURIComponent(escape(window.atob(str)));
    },

    /**
     * Преобразовать url слоев к полному формату URL
     * method formatLayersUrl
     * @param options {Object} параметры карты
     */
    // ===============================================================
	formatLayersUrl: function (options) {
	    if (!options || !options.layers || options.layers.length == 0 || !options.url)
	        return;
	    var i, len = options.layers.length;
	    for (i = 0; i < len; i++) {
            this.formatUrl(options.url, options.layers[i]);
	    }
	    return;
	},

    /**
     * Преобразовать параметр url слоя к полному формату URL
     * method formatUrl
     * @param url {string} url сервиса
     * @param options {Object} параметры слоя
     */
    // ===============================================================
    formatUrl: function (url, options) {
        if (!options ) return;
        if (options.url.indexOf('://') == -1) {    // options.url содержит относительный адрес
            if (!url){
                return false;
            }
            options.url = url + "?" + options.url;
        }
        return true;
    },

    /**
     * Преобразовать JSON параметры запроса в строку
     * method urlParamString
     * @param options {Object} параметры запроса в виде пар ключ:значение
     * @return {String} URL-запрос
    */
    // ===============================================================
	urlParamString: function (options) {
	    if (!options || $.isEmptyObject(options))
	        return "";
	    var param = "";
	    for (var key in options) {
	        var val = options[key];
	        if (window.XDomainRequest) val = encodeURIComponent(val);
	        if (typeof (val) != undefined)
	            param += "&" + key + "=" + val;
	    }
	    return param;
	},

    /**
     * URL парсер
     * method parseUrl
     * @param url {String} строка запроса
     * @return {Object} объект вида : {"protocol": "", "host": "", "port": "",	"path": "", "search": "", "hash": ""}
     */
    // ===============================================================
	parseUrl: function (url) {
	    var anchor = document.createElement('a');
	    anchor.href = url;
	    var result = { "protocol": "", "host": "", "port": "", "path": "", "search": "", "hash": "" };
	    /*
        anchor.href           //http://site.com:8081/path/page?a=1&b=2#hash (the full URL)
        anchor.protocol       // http:
        anchor.hostname       // site.com
        anchor.port           // 8081
        anchor.pathname       // /path/page
        anchor.search         // ?a=1&b=2
        anchor.hash           // #hash
        */
	    //console.log(this.fixParseUrl(url), $(anchor));

	    if (GWTK.getBrowser().msie) {
	        return this.fixParseUrl(url);                     // fix Microsoft !
	    }

        try {
            result["protocol"] = anchor.protocol;
            result["host"] = anchor.host;
            result["port"] = anchor.port;
            result["path"] = anchor.pathname;
            if (result.path.length > 0 && result.path[0] != '/') {
                result.path = '/' + result.path;
            }
            result["search"] = anchor.search;
            result["hash"] = anchor.hash;
            if (result["port"].length > 0) {
                if (result.host.indexOf(':' + result.port) > -1) {
                    result["port"] = '';
                }
            }
            return result;
        }
	    catch (e) {
            console.log("GWTK.Util.parseUrl: parsing error " + url);
            return result;
        }
    },

    /**
     * Простой URL-парсер для браузеров MS
     * method fixParseUrl
     * @param url {String} строка запроса
     * @return {Object} объект вида : {"protocol": "", "host": "", "port": "",	"path": "", "search": "", "hash": ""}
     */
	fixParseUrl: function (url) {
	    var result = { "protocol": "", "host": "", "port": "", "path": "", "search": "", "hash": "" },
            url = url,
	        pos = -1;
	    if ($.isEmptyObject(url)) { return result; }

	    // hash
	    pos = url.indexOf('#');
	    if (pos > -1) {
	        result.hash = url.substring(pos);
	        url = url.substring(0, pos);
	    }
	    // protocol
	    pos = url.indexOf('://');
	    if (pos > -1){
	        result.protocol = url.substring(0, pos + 1);
	        pos += 3;
	    }
	    else pos = 0;
        // host
	    var pos2 = url.indexOf('/', pos);
	    if (pos2 > -1) {
	        var host = url.substring(pos, pos2);
	        if (url.indexOf('.', pos) < pos2 || host.length) {
	            var pp = host.split(':');
	            if (pp[1] !== undefined) {
	                result.host = pp[0];
	                result.port = pp[1];
	            }
	            else {
	                result.host = host;
	            }
	            pos = pos2;
	        }
	    }
	    // path, search
	    pos2 = url.indexOf('?');
	    if (pos2 == -1) {
	        result.path = url.substring(pos);
	    }
	    else {
	        result.path = url.substring(pos, pos2);
	        result.search = url.substring(pos2 + 1);
	    }

	    return result;
	},

    /**
      * Добавить стиль в заголовок документа
      * method createCss
      * @param cssname {String} имя стиля
      * @param text {String} css стиля
    */
    // ===============================================================
	createCss: function (cssname, text) {
	    if (!cssname || !text) return false;

	    var ehead = document.getElementsByTagName('head');
	    if (ehead.length == 0) return false;
	    ehead = ehead[0];

	    var $style = $("<style type='text/css'> ."+ cssname + text + "</style>");

	    ehead.appendChild($style[0]);

	    return true;
	},

    /**
      * Загрузка легенды карты
      * method onLegendDataLoaded
      * @param response {String} xml-ответ запроса createLegend
      * @param context {Object} контекст запроса
      * @param map {GWTK.Map} карта
    */
    // ===============================================================
	onLegendDataLoaded: function (response, context, map) {

	    var layerId, mtrlegend = false, classifier = false;
	    if (context && context instanceof GWTK.classifier) {
            layerId = context.layerid;
            context.isQueryInitLegend = false;
            classifier = context;
        }
	    else
	        layerId = context;

        if (!layerId) return;

	    var ehead = document.getElementsByTagName('head');
	    if (ehead.length == 0) return;
	    ehead = ehead[0];
	    if (classifier) {
	        if ($(ehead).find("#legendclassif_" + layerId).length > 0)
	            return;
	    }
	    else {
	        if ($(ehead).find("#legend_" + layerId).length > 0)             // легенда слоя уже загружена
	            return;
	    }

	    var xmlDoc = $.parseXML(response), mtrlegend = false,
	       xml = $(xmlDoc);
	    var node = xml.context.documentElement.nodeName.toLowerCase();
	    if (node != "maplegend") {
	        if (classifier) {
	            classifier.onError();
	            return;
	        }
	        if (node != "matrixlegend" && node != "mtrlegend")
	            return;
            mtrlegend = true;
	    }
	    var imgpath = $(xml.context.documentElement).attr('ImgPath');
	    if (!imgpath || imgpath.length == 0)
	        return;
	    imgpath = encodeURIComponent(imgpath);

	    var map = map;
	    if (typeof map == 'undefined') {
	        console.log("GWTK.Util.onLegendDataLoaded. " + w2utils.lang("Not defined a required parameter") + " Map.");
	        return;
	    }
	    var layerscontrol = map.tiles,
	        index = -1, layer,
	        i, len = map.options.layers.length;
	    for (i = 0; i < len; i++) {
	        if (!classifier){
                if (!map.options.layers[i].legend) continue;
            }
	        if (map.options.layers[i].id == layerId) {
	            index = i; break;
	        }
	    }
	    if (index == -1) return;
	    layer = map.options.layers[index];

        // Отображение короткой легенды
        //TODO: var shortlegend = (layer.shortlegend || map.options.shortlegend) && !mtrlegend,
        var shortlegend = false,
  	        legend = {"id": layerId, "items": [], "typenames":[]},
        	uri = GWTK.Util.parseUrl(layer.url);

        // url рисунков
	    var params = GWTK.Util.getParamsFromURL(layer.url), keyslist = false,
            type = 'tile', codeArray = false, wmtsId, typeNamesArray = false;
	    if ('layer' in params) wmtsId = params.layer;
	    else if ('layers' in params) {
            wmtsId = params.layers;
            type = 'wms';
            var maplayer = map.tiles.getLayerByxId(layerId);
            if (maplayer != null && maplayer._filter && $.isArray(maplayer._filter.keysArray)){
                keyslist = maplayer._filter.keysArray;
                if (keyslist.length == 0) keyslist = false;
            }
        }
        if ('codelist' in params){
           codeArray = params['codelist'].split(',');
        }
        if (!classifier){
            if (layer.legend !== '*'){
                typeNamesArray = layer.legend.split(',');
            }
        }

	    var _search = '?service=wfs&method=getlegend&layer=' + wmtsId + '&filepath=' + imgpath;
        legend.url = GWTK.Util.getServerUrl(layer.url) + _search;  // адрес рисунков легенды
        legend.imgpath = imgpath;

        var allowed = false,
            res = GWTK.Util.compareVersion('13.3.0', layer.version);
        res == 1 ? allowed = false : allowed = true;

	    var ftypes = xml.context.documentElement.childNodes;
	    var len = xml.context.documentElement.childNodes.length,
	        style, csstext="", total = "", code;
        // формируем items легенды
	    for (i = 0; i < len; i++) {
	        var node = {};                                         // узел типа (слоя карты из xsd-схемы)
	        if (mtrlegend) {
	            if (ftypes[i].nodeName != 'Item') continue;
	            node.id = layerId + "_" + $(ftypes[i]).attr('Number');
	            node.text = $(ftypes[i]).attr('Description');
	            node.img = $(ftypes[i]).attr('Image');
	            node.nodes = [];
	            style = 'img_' + layerId + '_' + node.id;           // имя стиля
                uri = legend.url + node.img;
                // csstext = "{background-image: url('" + legend.url + node.img + "'); }";
                csstext = "{background-image: url('" + uri + "'); }";

                node.img = style + ' legend_img';
	            total += " ." + style + csstext + "\r\n";

                legend.items.push(node);
	            continue;
            }
            if (typeNamesArray && $.inArray(ftypes[i].nodeName, typeNamesArray) == -1){
                continue;
            }
            code = ftypes[i].nodeName;
            node.id = layerId + "_" + code;
            node.code = code;
	        node.text = $(ftypes[i]).attr('Description');
	        node.expanded = false;
	        node.img = "icon-folder";
            node.typename = ftypes[i].nodeName;
            node.nodes = [];
            if (type === 'wms'){
                node.xid = layerId;
            }
            // объекты в узле
            var unchecked = 0;
	        $(ftypes[i]).find("Item").each(function () {
	            var item = {};
	            item.id = $(this).attr('Key') + '_' + layerId;
	            item.text = $(this).attr('Description');
	            item.img = $(this).attr('Image');
	            item.code = $(this).attr('Code');
                item.local = $(this).attr('Local');
                item.expanded = false;
                item.key = $(this).attr('Key');
                if (type === 'wms' && allowed){
                    item.gClickable = true;
                    item.panischecked = true;
                    item.xid = layerId;
                    item.xsdtype = node.typename;
                    if (keyslist && $.inArray(item.key, keyslist) == -1){
                        item.panischecked = false;
                        unchecked++;
                    }
                }

				// Удвляем пробелы из стиля, иначе не будет отображаться картинка
				var style_nospace = layerId.replace(/ /g, '') + '_' + item.id.replace(/ /g, '');
				style = 'img_' + style_nospace;              // имя стиля (обязательно с буквы, иначе неверный стиль) 'img_' +
				uri = legend.url + item.img;
				csstext = "{background-image: url('" + legend.url + item.img + "'); }";
				if (classifier) {
					style = 'imgclassif_' + style_nospace;   // имя стиля (обязательно с буквы, иначе неверный стиль) 'img_' +
					item.img = style;
				}
				else {
					item.img = style + ' legend_img';
				}
                item.url = uri;
	            total += " ." + style + csstext + "\r\n";
	            node.nodes.push(item);
	        });

            if (type === 'wms' && allowed){
                node.gClickable = true;
                node.panischecked = true;
                node.xid = layerId;
                if (node.nodes.length > 0 && node.nodes.length == unchecked){
                    node.panischecked = false;
                }
            }
            if (node.nodes.length != 0){
                legend.items.push(node);
                legend.typenames.push(node.typename);
            }
	    }

        if (legend.items.length == 0) return;

	    // добавить стили в head
	    ehead = document.getElementsByTagName('head');
	    if (ehead.length == 0) return;
	    ehead = ehead[0];
	    var legendstyleid = 'legend_' + layerId;
	    if (classifier) {
	        legendstyleid = 'legendclassif_' + layerId;
	    }
	    var $style = $("<style type='text/css' id='" + legendstyleid + "' >" + total + "</style>");
        ehead.appendChild($style[0]);

        if (classifier) {
            classifier.loadObjects(legend);
            return;
        }
        var compareString = function(a,b){
            var x = a.text.toLowerCase();
            var y = b.text.toLowerCase();
            if (x < y) {return -1;}
            if (x > y) {return 1;}
            return 0;
        };
        // сохранить легенду в карте
        var maplegend = legend;
        if (shortlegend) {
            maplegend = GWTK.Util.shortcutLegend(legend);
            maplegend.items.sort(compareString);
        }
        else{
            maplegend.items.forEach(function(typename){
                typename.nodes.sort(compareString);
            })
        }

        layerscontrol.legends.push(maplegend);

        // отобразить легенду в дереве данных
        var mapcontent = map.mapTool('mapcontent');
        if (mapcontent){
            mapcontent._setLayerLegendItems(maplegend, {'codelist': codeArray});
        }
        //$(map.eventPane).trigger({'type':'drawfilter', 'layer':layerId});

        return;
    },

    /**
      * Удалить легенду слоя
      * method removeLegend
      * @param layerId {String} id слоя карты
      * @param map {Object} карта GWTK.Map
      * функция удаляет стили легенды слоя в заголовке, объект легенды из списка в карте
    */
    // ===============================================================
	removeLegend: function (layerId, map) {
	    if (!layerId || !map) {
	        console.log("GWTK.Util.removeLegend. " + w2utils.lang("Not defined a required parameter") + " Map.");
	        return;
	    }
	    var map = map, ehead, index = {};
	    var ehead = document.getElementsByTagName('head');

	    if (ehead.length == 0) return;
	    ehead = ehead[0];

	    // Удалить стили классификатора
	    var estyle = $(ehead).find("#legendclassif_" + layerId);
	    if (estyle.length > 0) {
	        estyle.remove();
	    }

	    // Удалить стили легенды
	    var legend = map.tiles.getLayerLegendByxId(layerId, index);
	    if (!legend || legend.items.length == 0)
	        return;

	    estyle = $(ehead).find("#legend_" + layerId);
	    if (estyle.length > 0) {
	        estyle.remove();
	    }

	    // удалить объект легенды из списка
	    if (index.index != undefined && index.index > -1)
	        map.tiles.legends.splice(index.index, 1);

	    // удалить признак загрузки легенды в локальном хранилище
	    GWTK.Util.removeLocalKey('legend_' + layerId);

	    return;
	},

    /**
      * Укоротить легенду
      * method shortcutLegend
      * @param legend {Object} полная легенда классификатора в JSON
      * @return {Object} сокращенная легенда в JSON
      * функция создает одноуровневую легенду по полной (без узлов слоев классификатора карты)
    */
    // ===============================================================
	shortcutLegend: function (legend) {

	    if (!legend || !legend.items || legend.items.length == 0) return null;

	    var shortlegend = {};
	    shortlegend.id = legend.id;
	    shortlegend.items = [];
	    shortlegend.url = legend.url;
	    shortlegend.imgpath = legend.imgpath;
            shortlegend.typenames = [];

	    var len = legend.items.length, i, j, count;
	    for (i = 0; i < len; i++) {
	        count = legend.items[i].nodes.length;
	        for (j = 0; j < count; j++) {
	            shortlegend.items.push(legend.items[i].nodes[j]);
	        }
                shortlegend.typenames.push(legend.items[i].typename);
	    }
	    return shortlegend;
	},

    /**
      * Парсер идентификатора объекта карты gmlid
      * method parseGmlId
      * @param gmlid {String} идентификатора объекта карты gmlid
      * @param delim {String} разделитель составных частей идентификатора gmlid
      * @return {Object} { 'sheet': sheetname, 'objid': номер объекта };
    */
    // ===============================================================
	parseGmlId: function (gmlid, delim) {
	    if (!gmlid) return {};
	    var sep = delim ? delim : '.';
	    var pos = gmlid.lastIndexOf(sep);
	    if (pos == -1) return {};
	    return { 'sheet': gmlid.slice(0, pos), 'objid': gmlid.slice(pos+1) };
	},

    /**
      * Запросить список имен листов слоя карты
      * method getSheetNameForLayer
      * @param mapserver_url {String} URL сервера карт
      * @param layer_id {String} идентификатор карты на сервере (сервисе)
      * @param map {Object} GWTK.Map
      * функция выполняет запрос getsheetname и заполняет список имен листов в слое карты
    */
    // ===============================================================
    getSheetNameForLayer: function (layer) {
        if (arguments.length == 3){
            return GWTK.Util.getSheetNameForLayer_(arguments[0], arguments[1], arguments[2]);
        }
        if (typeof layer === "undefined" || !$.isFunction(layer.getType)){
            console.log("GWTK.Util.getSheetNameForLayer. " + w2utils.lang("Not defined a required parameter") + " layer.");
        }
        var map = layer.map;
        if (map.tiles.sheetNamesList){                        // проверить наличие листов для layer_id
            var elem = map.tiles.sheetNamesList.get(layer);
            if (elem && $.isArray(elem.sheets)){
                layer.mapSheets.sheets = [].concat(elem.sheets);
                return;
            }
        }

        GWTK.Util.getSheetNameForLayer_(layer.options.url, layer.idLayer, layer.map);
        return;
    },

    /**
     * Запросить список имен листов слоя карты
     * method getSheetNameForLayer_
     * @param server {String} URL сервера карт
     * @param layer_id {String} идентификатор карты на сервере (сервисе)
     * @param map {Object} GWTK.Map
     * @param callback {function} функция обратного вызова
     * функция выполняет запрос getsheetname и заполняет список имен листов в слое карты.
     * Если указана callback, этой функции передается ответ запроса,
     * список имен листов в слое карты не заполняется.
    */
    // ===============================================================

	getSheetNameForLayer_: function (server, layer_id, map, callback) {
	    if (!map) {
	        console.log("GWTK.Util.getSheetNameForLayer. " + w2utils.lang("Not defined a required parameter") + " Map.");
	        return;
	    }
        var idlayer = layer_id,
            callback = callback,
            map = map;

	    var url = server;
	    if (!url) url = map.options.url;             // ??!!!
	    var token = this.accessToken(map, idlayer),
            url2 = this.getServerUrl(url) + "?SERVICE=WFS&RESTMETHOD=getsheetname&LAYER_ID=" + layer_id;
        var withCredentials = map.authTypeServer(url) || map.authTypeExternal(url);

	    $.ajax({
	        url: url2,
	        type: 'get',
	        crossDomain: 'true',
            dataType: "html",
            xhrFields: withCredentials ? {withCredentials: true} : undefined,
	        beforeSend: token ? function(xhr){xhr.setRequestHeader(GWTK.AUTH_TOKEN, token)} : undefined,
	        error: function () {
                if ($.isFunction(callback)){
                    callback('error', map, this.url);
                    return;
                }
                GWTK.Util.setSheetNameForLayer('error'); return; },
	        success: function (data) {
                var result = GWTK.Util.setSheetNameForLayer(data, map, url);
                if ($.isFunction(callback)){
                    if (!result) { result = "error"};
                    callback(result, map, url);
                }
                else {
                    if (result){
                       var layers = map.tiles.getLayersWithIdService(result.layerId);
                       if (layers.length == 0){
                           console.log('RESTMETHOD GetSheetName. Layer ' + result.layerId + " is not found into the Map!");
                       }
                       for (i = 0; i < layers.length; i++){
                           if (layers[i].options.url !== result.server) { continue; }
                           if (layers[i].mapSheets.sheets.length == 0){
                               layers[i].mapSheets.sheets = [].concat(result.sheets);
                               map.tiles.sheetNamesList.add(layers[i]);
                           }
                        }
                        layers.splice(0, layers.length);
                    }
                }
                return;
	        }
	    });
	    return;
	},

    /**
     * Заполнить список имен листов слоя карты
     * method setSheetNameForLayer
     * @param xdata {String} xml-ответ запроса getsheetname
     * @param url {String} url запроса
     * @param map {Object} GWTK.Map
     * @returns {Object} список имен листов слоя {"server":url, "layerId":"id слоя", "sheets":["a","b"]}
     * при ошибке возвращает undefined
    */
    // ===============================================================
	setSheetNameForLayer: function (xdata, map, url) {
	    if (xdata == "error") {
	        console.log('RESTMETHOD GetSheetName ' + w2utils.lang("Failed to get data") + " " + url);
	        return;
        }

	    var $doc = $.parseXML(xdata);
	    var $xml = $($doc);
        var map = map, i,
            elem = {"server":url, "layerId":"", "sheets":[]},
            result = {};

        $xml.find('member').each(function () {
	        var xname = $(this).find('name');
	        var idlayer = $(xname).text();
	        if (idlayer && idlayer.length > 0) {
                if (idlayer.indexOf("#") > -1) {
                    idlayer = encodeURIComponent(idlayer);
                }
	            var xstr = $(this).find('string');
	            var sheet = xstr.text();
	            if (sheet && sheet.length > 0) {
                    if ($.isEmptyObject(result)){
                        result = $.extend({}, elem);
                        result.layerId = idlayer;
                        result.sheets = [];
                    }
                    if (idlayer === result.layerId){
                        result.sheets.push(sheet);
                    }
                }
            }
            return;
        });

        if ($.isEmptyObject(result) || result.sheets.length == 0) {
            console.log('RESTMETHOD GetSheetName response. Layer no data');
            return;
        }

        return result;
	},

    /**
     * Запросить адрес сервера из URL
     * method getServerUrl
     * @param url
     * @returns {string}
     */
    getServerUrl: function(url){
        if (!url) { return; }

        var uri = GWTK.Util.parseUrl(url);

        if (uri.protocol && uri.host) {
            if (uri.port) {
                uri.host = uri.host + ':' + uri.port;
            }
            if (uri.path[0] != "/") {
                uri.path = "/" + uri.path;
            }
            return uri.protocol + '//' + uri.host + uri.path;
        }

        return;
    },

    /**
     * Получить идентификатор слоя для xml
     * method getIdLayerXml
     * @param _layerid {String} идентификатор слоя сервиса
     * @return {String} идентификатор слоя
     */
	getIdLayerXml: function (_idlayer) {
	    return GWTK.Util.decodeIdLayer(_idlayer);
	},

    /**
     * Декодировать идентификатор слоя
     * method decodeIdLayer
     * @param _idlayer {String} идентификатор слоя сервиса
     * @return {String} идентификатор слоя
     */
	decodeIdLayer: function (_idlayer) {
	    if (typeof _idlayer !== "string") {
	        return _idlayer;
	    }
	    if (_idlayer.indexOf('%23') == -1) {
	        return _idlayer;
	    }
	    return decodeURIComponent(_idlayer);
	},

    /**
     * Кодировать идентификатор слоя в url
     * method encodeIdLayerUrl
     * @param url {String} url слоя
     * @return {String} url слоя
     */
	encodeIdLayerUrl: function (url) {
	    if (typeof url !== "string") {
	        return url;
	    }
	    var _url = url.toLowerCase(),
            begin = _url.indexOf("userfolder#");
	    if (begin < 0) {
	        begin = _url.indexOf("host#");
        }
        if (begin < 0) {
            begin = _url.indexOf("folder#");
        }
	    if (begin < 0) {
	        return url;
	    }
	    _url = url;
	    var end = _url.indexOf("&", begin);
        if (end < 0) {
            end = _url.length;
        }
	    var layerid = _url.slice(begin, end),
	        idNew = encodeURIComponent(layerid);
	    var encoded = _url.slice(0, begin) + idNew;
	    if (end > -1 && end < _url.length) {
	        encoded += _url.slice(end);
	    }
	    return encoded;
	},

    /**
      * Получить размер элемента по имени CSS
      * method getDivSize
      * @param cssname {String} имя стиля css
      * @return {Array} [ширина, высота], числа
    */
    // ===============================================================
	getDivSize: function (cssname) {
	    // оптимизация для IE ! (размер из css берем только 1 раз и используем для всех)
	    var div = document.createElement('div');
	    div.className = cssname;
	    var mark_size = [parseInt($(div).css('width')), parseInt($(div).css('height'))];
	    if (mark_size[0] == undefined || mark_size[1] == undefined) {
	        mark_size[0] = 10; mark_size[1] = 10;
	    }
	    return mark_size;
	},

    /* Получить адрес функции по имени
     * (поиск функции начинается с window)
     * method getFunction
     * @param fn_name {string} строка, имя функции
     * @return {Function} ссылка на функцию
    */
    // ===============================================================
	getFunction: function (fn_name) {
	    if (typeof fn_name != 'string' || fn_name.length == 0) {
	        return;
	    }
	    var scope = window, i,
        scope_arr = fn_name.split('.'),
        len = scope_arr.length - 1;
	    try{
        for (i = 0; i < len; i++) {
            scope = scope[scope_arr[i]];
        }
	    }
	    catch (err) {
	        console.log('getFunction error ' + err);
	        return;
	    }
        return scope[scope_arr[len]];
	},

    /* Создать GUID
     * @return {string} guid
     */
	createGUID: function () {
	    function s4() {
	        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	    }

	    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },
    /**
     * Сравнить версии
     * @param dest {string} оригинал в формате 'число.число.число'
     * @param test {string} тестируемый в формате 'число.число.число'
     * @returns {Number} `0` - равны,`1` - первый больше, `-1` - парвый меньше
     */
    compareVersion: function(dest, test){
        if (typeof dest !== 'string' || typeof test !== 'string'){
            return 1;
        }
        var dest_arr = dest.split('.'),
        test_arr = test.split('.'), result=[0, 0, 0];
        if (!$.isArray(dest_arr)) {dest_arr = [dest];}
        if (!$.isArray(test_arr)) {test_arr = [test];}

        dest_arr.forEach(function(digit, index){
            var noop;
            if (typeof test_arr[index] != 'undefined'){
                parseInt(digit) > parseInt(test_arr[index]) ? result[index] = 1 : noop = 0;
                parseInt(digit) < parseInt(test_arr[index]) ? result[index] = -1 : noop = 0;
            }
            else{
                result[index] = 1;
            }
        });
        if (result[0] != 0) return result[0];
        if (result[1] != 0) return result[1];
        return result[2];
    },

   /* Получить значение ключа из объекта localStorage
    * method getlocalStorageParameter
    * @param key {string} имя ключа (параметра) в localStorage
    * @return {string} значение ключа (параметра)
    */
	getStoredParameter: function (key) {
	    if (typeof key !== 'string' || !window.localStorage) {
	        return undefined;
	    }

	    var lstorage = window.localStorage.getItem(key);
	    if (typeof lstorage === 'undefined') {
	        return undefined;
	    }
	    return lstorage;
	},

	error_report: function (message, map) {
	    if (map) {
	        map.placemarkRemoveAll();
	    }
	},

    // Сбросить выделение в карте
	clearselectedFeatures: function (map) {
	    if (!map) {
	        console.log("GWTK.Util.clearselectedFeatures. " + w2utils.lang("Not defined a required parameter") + " Map.");
	        return map;
	    }
	    map.selectedObjects.clear();

	    // Сбросить марки, оставшиеся от адресного поиска
	    map.placemarkRemove("addressgeocoding");
	    // Сбросить марки, оставшиеся от обратного геокодирования
	    map.placemarkRemove("reversegeocoding");

	    return map.selectedObjects;
    },

    /**
     * Получить токен авторизованного доступа по id слоя
     * @method accessToken
     * @param map {GWTK.Map} карта
     * @param layerid {String} идентификатор слоя на сервисе
     * @return {String/Boolean} токен / `false` - токен отсутствует
     */
    // ===============================================================
	accessToken: function (map, layerid) {
	    if (typeof map === "undefined") {
	        return false;
	    }
	    var map = map, lay = map.tiles.getLayerByIdService(layerid);
	    if (lay === '' || !lay.options.token) {
	        return false;
	    }
	    return map.getToken();
	},

    /* Выполнить promise-запросы
      * method doPromise
      * @param urls {Array} массив строк url
      * @param callback {Function} функция анализа ответа, arg1 {Array} массив успешных ответов,
      * arg2 {Array} массив ошибочных ответов.
      * @param tokens {Array} массив токенов для urls, позиционно
     */
    // ===============================================================
	doPromise: function (urls, callback, tokens, map) {

	    var responseData = [],                // массив ответов
            responseError = null,             // массив url, где возникли ошибки
            total_count = urls.length,        // число запросов общее
            error_count = 0,                  // число запросов ошибочных
            tokens = tokens,
            map = map;

        // отправляем запросы
	    $.map(urls, function (url) {
	        var setting = { "dataType": "text" };

            if ($.isArray(tokens)) {
	            var pos = $.inArray(url, urls),
                    token = typeof tokens[pos] !== "undefined" ? tokens[pos] : false;
	            if (token && typeof token === 'string') {
	                setting.beforeSend = function (xhr) {
	                    xhr.setRequestHeader(GWTK.AUTH_TOKEN, token);
	                }
	            }
            }

            if (typeof map !== 'undefined'){
                if (map.authTypeServer(url) || map.authTypeExternal(url)){
                    setting.xhrFields = { withCredentials: true };
                }
            }

	        var promise = $.ajax(url, setting);
	        return promise.then(
             function (result) {                            // Ok, пришел ответ
	             try {
                       var _result = JSON.parse(result);
                       _result.data_url = this.url;
                       responseData.push(_result);                 // сохраняем ответ
                       responseEnd();
	             }
                 catch (e) {
                    if (result.indexOf("ExceptionReport") != -1) {
                         error_count++;
                         exit({ "text": result, "data": this.url });
                         return;
                    }
                    if (result.indexOf('{') === 0) {
                        error_count++;
                        exit({ "text": result, "data": this.url });
                        return;
                    }
                    if (result.indexOf('<RestMethod>') !== -1) {
                        responseData.push({"text": result, "data_url": this.url});    // сохраняем xml ответ
                        responseEnd();
                        return;
                    }
                    var isFile = $(result).find('string').text();
                    if (isFile.length > 0) {
                        setting = $.extend(setting, {
                            url: GWTK.Util.getServerUrl(this.url) + "?Method=GetFile&FilePath=" + isFile,
                            type: 'POST',
                            success: function (e) {
                                var res = JSON.parse(e);
                                res.data_url = this.url;
                                responseData.push(res);             // сохраняем ответ
                                responseEnd();
                            },
                            error: function (e) {
                                error_count++;
                                var msg = w2utils.lang('Failed to get data');
                                console.log(msg + '  ' + this.url);
                                console.log(error);
                                exit({ "text": msg, "data": this.url });
                                return;
                            }
                        });

                        $.ajax(setting);
                    }
                    else {
                        error_count++;
                        exit({ "text": result, "data": this.url });
                        return;
                     }
	             }

	            return 1;
	        },
            function (error) {                             // failed, ошибка
                error_count++;
                var msg = w2utils.lang('Failed to get data');
                console.log(msg + '  ' + this.url);
                console.log(error);
                exit({ "text": msg, "data": this.url });
                return;
            });
	    });

	    function exit(err) {
	        if (!err) return;
	        if (responseError == null) {
	            responseError = [];
	        }
	        responseError.push(err);
	        responseEnd();
        };

        function responseEnd(){
            if (total_count <= (responseData.length + error_count)) {
                callback(responseData, responseError);
            }
        }
	},

	randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    },

        // Удалить узел дерева по id
	removeTreeNode: function(sidebar, id){
	    if (!sidebar){
	        console.log('GWTK.Util.removeTreeNode. ' + w2utils.lang("Not defined a required parameter") + " sidebars name.");
	        return;
	    }
	    if (!w2ui[sidebar].get(id)) return;
	    var parent = w2ui[sidebar].get(id).parent;
	    w2ui[sidebar].remove(id);
	    if (parent && parent.nodes.length == 0)
	        w2ui[sidebar].remove(parent.id);
	    return;
	},

	ie_Old: function(){
	    var msie = $.browser.msie;

	    if (msie && $.browser.version <= 9)
	        return true;
	    return false;
	},

    // определить версию браузера Internet Explorer (если не IE возвращает "-1", иначе - номер версии IE)
	ie_Version:function ()
    {
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

    // запросить ключ приложения для локального хранилища
	appkey: function () {
	    if (!window.localStorage) return;
	    var key = localStorage[window.location];
	    if (!key) {
	        key = "app_" + GWTK.Util.randomInt(10, 500000);
	        localStorage.setItem(window.location, key);
	    }
	    return key;
	},

    // удалить item из локального хранилища
	removeLocalKey: function (key) {
	    var appkey = GWTK.Util.appkey();
	    if (appkey) {
	        if (localStorage[appkey + key]) {
	            localStorage.removeItem(appkey + key);
	        }
	    }
	    return;
	},

    // наследование прототипов классов
	inherits: function (Child, Parent) {
	    if (!Child || !Parent) return;
	    var F = function () { };
	    F.prototype = Parent.prototype;
	    var f = new F();
	    for (var prop in Child.prototype) f[prop] = Child.prototype[prop];
	    Child.prototype = f;
	    Child.prototype.$super = Parent.prototype;
        return;
	},

    // форматирование числа
	formatting:	function (number_val, unit)
    {
       Result = '';
       var number = new String(number_val);
       var Unit = new String(unit);
       var i = 0;
       var len = 0;
       var index = -1;
       var fpoint;
       while(number.charAt(i) != "")
       {
           if (number.charAt(i) == '.')
           index = i;
           len++; i++;
       }
       if (len == 0) return Result;
       fpoint = index;
       if (index == -1) index = len;
       var remainder = parseInt(index % 3, 10);
       var count = parseInt(index / 3, 10);
       var start = remainder;
       Result = number.substring(0, remainder);
       for (k = 0; k < count; k++)
       {
          Result += ' ' + number.substr(start, 3);
          start += 3;
       }
       if (fpoint >= 0)   // дробная часть
          Result += number.substr(fpoint, 3);
       return Result + ' ' + Unit;
	},

    drawLineWithIdToDiv:function (point1, point2, id, div, canvas, classname)
   {
        if (div == null) return false;
        if (id == null || id.length == 0) return false;
        if (point1 === undefined || point2 === undefined) return false;
        if (point1 instanceof GWTK.Point === false ||
            point2 instanceof GWTK.Point === false) return false;

        var x1 = point1.x, y1 = point1.y, x2 = point2.x, y2 = point2.y;

        var lw = 2;
        var msie = $.browser.msie;
        var version = msie ? $.browser.version : 9;

       //if (msie && version < 9)
        if (!canvas)
        {
           x1 = parseInt(x1, 10); y1 = parseInt(y1, 10);
           x2 = parseInt(x2, 10); y2 = parseInt(y2, 10);

            var line=document.createElement('hr');
            line.className = 'ruler-line-msie';
            if (classname)
                line.className = classname;
            line.id = id;
            line.setAttribute('unselectable', 'on');

            var fx = true, fy = true, t; lw = 3;

            if (x1>x2) {fx=false; t=x1; x1=x2; x2=t;}
            if (y1>y2) {fy=false; t=y1; y1=y2; y2=t;}
            var dx = 0, dy = 0;
            x1+=dx; y1+=dy; x2+=dx; y2+=dy;

            var w=x2-x1; var h=y2-y1;
            var c=Math.sqrt((w*w)+(h*h));

            GWTK.DomUtil.setPosition(line, GWTK.point(x1 + dx, y1 + dy));
            line.style.width = c;

            var cs=(fx ? w:-w)/c;
            var sn=(fy ? h:-h)/c;

            var filter ="progid:DXImageTransform.Microsoft.Alpha(opacity=80) ";

            filter+="progid:DXImageTransform.Microsoft.Matrix(SizingMethod='auto expand'," +
                    "FilterType='bilinear'"+",M11="+(cs)+",M12="+(-sn)+",M21="+(sn)+",M22="+(cs)+")";

            line.style.filter=filter;
            div.appendChild(line);
            return;
        }
        else if (canvas && canvas.getContext != undefined)
        {
            var dx = 0; var dy = 0;
            var x1 = parseInt(x1, 10) + dx, y1 = parseInt(y1, 10) + dy;
            var x2 = parseInt(x2, 10) + dx, y2 = parseInt(y2, 10) + dy;
            var ctx = canvas.getContext('2d');
            ctx.lineWidth = lw;
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';   //'#FF0000';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        else
        {
            return;
        }
   },

    // Декодировать строку из UTF8
    utf8Decode:function (utftext)
   {
      var string = "";
      var i = 0;
      var c = c1 = c2 = 0;

    while ( i < utftext.length )
     {
        c = utftext.charCodeAt(i);

        if (c < 128) {
            string += String.fromCharCode(c);
            i++;
        }
        else if((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i+1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else {
            c2 = utftext.charCodeAt(i+1);
            c3 = utftext.charCodeAt(i+2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }
    }

    return string;
    },

    // --------------------------------------------------------------
    // Функции для Touchscreen
    // --------------------------------------------------------------
    // Получить расстояние между двумя точками
   getLengthEx: function (x0, y0, x1, y1) {
       return Math.floor(Math.sqrt(Math.pow((x1 - x0), 2) + Math.pow((y1 - y0),2)));
   },

    // Найти положение объекта относительно начала окна документа
    // Вход: obj - объект. Выход: массив координат [x,y].
   uiFindPos: function (obj) {
       if (obj == null) return;

       var curleft = 0; var curtop = 0;
       if (obj.offsetParent) {
           curleft = obj.offsetLeft;
           curtop = obj.offsetTop;
           while (obj = obj.offsetParent) {
               curleft += obj.offsetLeft;
               curtop += obj.offsetTop;
           }
       }
       return [curleft, curtop];
   },

    // Смасштабировать HTML-объект в scale раз с центром масштабирования в точке x,y
   setObjectScale: function (object, x, y, scale) {
       if (object == null) return;
       if (scale == 0) { // восстановить исходные размеры
           object.style.transform = 'inherit'; object.style.transformOrigin = 'inherit';
           object.style.webkitTransform = 'inherit'; object.style.webkitTransformOrigin = 'inherit';
	       $(object).find('canvas').css({
		       transform: '',
		       transformOrigin: ''
	       });
           return;
       }
       if (isNaN(x) || isNaN(y) || isNaN(scale)) return;

       var transform = 'scale(' + scale + ') translate(' + x + 'px, ' + y + 'px' + ')';
       var transformOrigin = x + 'px ' + y + 'px';

       object.style.webkitTransform = transform;
       object.style.MozTransform = transform;
       object.style.msTransform = transform;
       object.style.OTransform = transform;
       object.style.transform = transform;

       object.style.webkitTransformOrigin = transformOrigin;
       object.style.MozTransformOrigin = transformOrigin;
       object.style.msTransformOrigin = transformOrigin;
       object.style.OTransformOrigin = transformOrigin;
       object.style.transformOrigin = transformOrigin;

	   if(scale < 1){
		   transform = 'scale(1) translate(0px, 0px)';
		   transformOrigin = (x) + 'px ' + (y) + 'px';
		   $(object).find('canvas').css({
			   transform: transform,
			   transformOrigin: transformOrigin
		   })
	   }
   },

    // Смасштабировать панель с картой в scale раз с центром масштабирования в точке x,y
   setMapPanelScale: function (x, y, scale) {
       if (isNaN(x) || isNaN(y) || isNaN(scale))
           return;

	   var temp = document.getElementsByClassName('temp-touch-scale');
	   if(temp && temp.length >0){
	     temp = temp[0];
	   }
	   if(temp) this.setObjectScale(temp, x, y, scale);
   },
    // --------------------------------------------------------------

    // Удалить все дочерние элементы  в указанном элементе node
    removeChildren: function (node) {
		var children = node.childNodes
		while(children.length) {
			node.removeChild(children[0])
		}
	},

    /**
     * Показать сообщение
     * @method showMessage
     * @param options {Object} параметры окна сообщения, JSON
     * {
     *      text            : '',      // текст
     *      icon            :'',       // имя изображения в окне, "error"/"warning" или ничего
     *      height          :number,   // высота окна, пикселы
     *      width:          :number,   // ширина окна, пикселы
     *      top             :number,   // положение окна сверху, пикселы
     *      left            :number,   // положение окна слева, пикселы
     *      classname       :'',       // имя класса окна
     *      duration        :number    // время отображения окна, миллисекунд
     * }
    */
    showMessage: function (options) {
        var defaults = {
            text:'',
            icon:'',
            height:200,
            width:400,
            top:undefined,
            left:undefined,
            classname:"w2ui-centered",
            duration:2000
        },
        _img = '';
        if (typeof options === "undefined"){
            var options = $.extend({}, defaults);
        }
        else{
            var options = $.extend({}, defaults, options);
        }

        if (options.icon === 'error'){
            _img = '<div class="icon-mappopup' + ' ' + 'icon-message-error' + '"></div>';
        }
        else if (options.icon === 'warning'){
            _img = '<div class="icon-mappopup' + ' ' + 'icon-message-warning' + '"></div>';
        }

        var _body = '<div class="' + options.classname + '">' + _img + options.text + '</div>';

       w2popup.open({
           body:_body,
           height:parseInt(options.height),
           width:parseInt(options.width),
           opacity:0,
           modal:false,
           onOpen:function(event){
            event.onComplete = function(){
                $('#w2ui-lock').css('z-index', '-1');
            }
            }
       });
       if (options.top){
        $("#w2ui-popup").css("top", parseInt(options.top) + "px");
       }
       if (options.left){
        $("#w2ui-popup").css("left", parseInt(options.left) + "px");
       }

       if ($.isNumeric(options.duration)){
           setTimeout(function(){w2popup.close();}, options.duration);
       }
   },

    // Преобразовать json-объект в XmlRpc
    getRequestXmlRpc : function(jsObj) {
//		Пример объекта jsObj
//			{"methodName":"GetFeature",
//				"members":{
//					"IdList":["item1","item2"],
//					"Layer":["item1","item2"],
//					"OutType":"json"
//					}
//				}
			if (!jsObj||!jsObj["methodName"] || !jsObj["members"])
				return null;
			var arrayToRpcString = function(items) {
				var result = '';
				if (!GWTK.Util.isArray(items))
					result += items;
				 else
					result += items.join(",")
				return result;
			}
			var membersStrings = {};
			for ( var key in jsObj["members"]) {
				membersStrings[key] = arrayToRpcString(jsObj["members"][key])
			}
			var request = "<?xml version='1.0' encoding='utf-8'?><methodCall><methodName>"
					+ jsObj["methodName"]
					+ "</methodName><params><param><value><struct>";
			for ( var key in membersStrings) {
				request += "<member><name>" + key + "</name>"
						+ "<value><string>" + membersStrings[key]
						+ "</string></value></member>";
			}
			request += "</struct></value></param></params></methodCall>";
			return request;
    },

    /**
     * Показать индикатор процесса
     */
    showWait: function () {
    },

    /**
     * Скрыть индикатор процесса
     */
    hideWait: function () {
    },

    /**
     * Запросить значение длины в морских милях
     * @param meters {Float} значение длины в метрах
     * @method m2Nmile
     * @return {Float} значение длины в морских милях, при ошибке возвращает `null`
     */
    // ===============================================================
    m2Nmile: function (meters) {
        if (meters == null || meters == undefined)
            return null;
        return (parseFloat(meters) * 0.00053995680345572);
    },
	/**
     * Запросить значение длины в метрах
     * @param nmile {Float} значение длины в морских милях
     * @method nmile2m
     * @return {Float} значение длины в морских милях, при ошибке возвращает `null`
     */
    // ===============================================================
	nmile2m: function (nmile) {
        if (nmile == null || nmile == undefined)
            return null;
        return (parseFloat(nmile) / 0.00053995680345572);
    },

    /**
     * Запросить значение длины в футах
     * @param meters {Float} значение длины в метрах
     * @method m2feet
     * @return {Float} значение длины в футах, при ошибке возвращает `null`
     */
    // ===============================================================
    m2feet: function (meters) {
        if (meters == null || meters == undefined)
            return null;
        return (parseFloat(meters) / 0.3048);
    },
    /**
     * Запросить значение длины в метрах
     * @param feet {Float} значение длины в метрах
     * @method feet2m
     * @return {Float} значение длины в метрах, при ошибке возвращает `null`
     */
    // ===============================================================
    feet2m: function (feet) {
        if (feet == null || feet == undefined)
            return null;
        return (parseFloat(feet) * 0.3048);
    },


    /**
     * Проверка на наличие запрещенных к поиску тегов HTML
     * @method forbiddenTagsHTML
     * @param string {String} строка для проверки
     * @returns {Bool} - true - наличие заперещенных тегов
    */
    // ===============================================================
    forbiddenTagsHTML: function (string) {
        return (/<img.*|<script.*|<style.*|<embeded.*/ig).test(string);
    },

    /**
     * notfoundPanoranaUrl - информация об отсутствии url(map.options.url)
     * @returns {string}
     * @private
     */
    notfoundPanoranaUrl: function() {
        return w2utils.lang("Failed to get data") + "!url (map.options.url) " + w2utils.lang("not found!");
    },

    /**
     * Нормализовать число
	 * @method wrapNum(num: Number, range: Number[], includeMax?: Boolean): Number
	 * @param x {Number} число
	 * @param range {Array} диапазон значений, `range[0]`,`range[1]` - min,max значения
	 * @return {Number} число в пределах `range`, не превосходит max. При includeMax = `true` возвращаемое значение будет включать max
     */
    wrapNum: function (x, range, includeMax) {
        var max = range[1],
            min = range[0],
            d = max - min;
        return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
    },

    falseFunction: function() { return false; },

    /**
     * Проверить на пустое значение
     * @method isEmpty
     * @param obj {object} переменная для проверки
     * @returns {boolean} `true` - пустое значение, `false` - не пустое
     */
    isEmpty :function(obj) {
        switch (obj) {
            case "":
            case 0:
            case "0":
            case null:
            case false:
            case typeof this === "undefined":
               return true;
            default:
               return false;
        }
    },

    /**
     * Подключить скрипт
     * @method appendScript
     * @param url {String} ссылка на файл скрипта
     */
    appendScript :function (url) {
      var script = document.createElement('script');
      script.src = url;
      document.getElementsByTagName('head')[0].appendChild(script);
    },

    /**
     * Выполнить функцию только по истечении времени задержки
     * (каждый вызов заново сбрасывает счетчик)
     * @method debounce
     * @params func {Function} Функция
     * @params delay {Number} задержка в мс
     * @params immediate {Boolean} Флаг срабатывания вначале временного отрезка
    */
    debounce: function (func, delay, immediate) {
        var inDebounce = undefined;
        return function () {
            var context = this,
                args = arguments;
            clearTimeout(inDebounce);
            inDebounce = setTimeout(function () {
                inDebounce = null;
                if (!immediate)
                    func.apply(context, args);
            }, delay);
            if (immediate && !inDebounce) func.apply(context, args);
        }
    },

    /**
     * Выполнить функцию с заданной частотой
     * @method throttle
     * @params func {Function} Функция
     * @params limit {Number} частота выполнения в мс
     */
    throttle: function (func, limit) {
        var inThrottle,
            lastFunc,
            lastRan;
        return function () {
            var context = this,
                args = arguments;
            if (!inThrottle) {
                func.apply(context, args);
                lastRan = Date.now();
                inThrottle = true;
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function () {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now()
                    }
                }, limit - (Date.now() - lastRan))
            }
        };
    },

    /**
     * Преобразование стилей, используемых для отображения точечных знакоа в GWTK.graphicLayer в стили отображения классом GWTK.mapclusterizator
     * @method parseGraphicLayerStylesForCLuster
     * @param style - стили (узел style в GeoJSON, например:
	 *  "style": {
            "P0000030030": {
                "name": "Завод переработки твердых отходов",
                "marker": {
                    "width": "32px",
                    "height": "32px",
                    "image": "<svg width='50px' height='50px' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink= 'http://www.w3.org/1999/xlink'><image xlink:href='http://192.168.1.26/files/images/evn001.svg' x='0' y='0' height='50px' width='50px'/></svg>",
                    "centerX": "16",
                    "centerY": "16"
                }
            },
            "P0000030021": {
                "name": " Завод переработки пищевых отходов",
                "marker": {
                    "width": "32px",
                    "height": "32px",
                    "image": "<svg width='50px' height='50px' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink= 'http://www.w3.org/1999/xlink'><image xlink:href='http://192.168.1.26/files/images/evn002.svg' x='0' y='0' height='50px' width='50px'/></svg>",
                    "centerX": "16",
                    "centerY": "16"
                }
            })
     * @return {*}
     */
    parseGraphicLayerStylesForCLuster: function ( style ) {
        var href, clone = JSON.parse( JSON.stringify( style ) );
        for ( var i in clone ) {
            if ( clone.hasOwnProperty( i ) ) {
                var parser = new DOMParser();
                if (clone[ i ][ 'marker' ] && clone[ i ][ 'marker' ][ 'image' ]) {
                    var doc = parser.parseFromString(clone[i]['marker']['image'], "image/svg+xml");
                    href =  $(doc).find('image').attr('xlink:href');
                    if (!href) {
                    	try {
                            $.parseXML(clone[i]['marker']['image']);
                        }
                        catch(e) { // Пришла строка
                            href = clone[i]['marker']['image'];
						}
                    }

                    if (href) {
                        clone[i]['marker']['image'] = href;
                    }
                }
            }
        }
        return clone;
    },


    /**
     * Получить размер экрана устройства
     * Всего 4 размера, взято из Bootstrap Media Queries
     * method getDeviceScreenSize
     * @return {string} - размер
     *                  = xs - очень маленький (768 пикселей и меньше)
     *                  = sm - маленький (от 768 до 991 пикселей)
     *                  = md - средний (от 992 до 1199 пикселей)
     *                  = lg - большой (1200 пикселей и выше)
     */
    getDeviceScreenSize: function () {
        //var w = window.innerWidth; // ширина окна браузера
        var w = window.screen.availWidth; // ширина окна устройства
        //var h = window.screen.availHeight; // высота окна устройства

        if (w < 768) {
            return "xs"; // очень маленький (768 пикселей и меньше)
        } else if (w < 991) {
            return "sm"; // маленький (от 768 до 991 пикселей)
        } else if (w < 1199) {
            return "md"; // средний (от 992 до 1199 пикселей)
        } else {
            return "lg"; // большой (1200 пикселей и выше)
        }
    },

    /**
    * Получить текущее время (кроссбраузерно)
    * Альтернатива функции performance.now()
    * @return {number} - время в мс
    */
    performanceNow: function () {
        window.performance = window.performance || {};
        window.performance.now = window.performance.now || (function () { return 1000 * Date.now(); })();
        return window.performance.now();
    },

    /**
     * Сохранить состояние в localStorage
     * @method stateSaveStorage
     * @params key {string} ключ
     * @params data {any} значение ключа
     * Ключ key сохраняется в объект localStorage.gwtk.states
     */
    stateSaveStorage: function(key/*string*/, data/*any*/) {
        if (!localStorage || !key) { return; }
        var gwtk = JSON.parse(localStorage.gwtk || '{}');
        if (!gwtk.states) {
            gwtk.states = {};
        }
        if (gwtk.states[key]) {
            delete gwtk.states[key];
        }
        if (typeof data == 'undefined') { return; }
        gwtk.states[key] = data;
        localStorage.gwtk = JSON.stringify(gwtk);
    },

    /**
     * Восстановить состояние из localStorage
     * @method stateRestoreStorage
     * @params key {string} ключ
     * @returns {any} значение ключа или undefined
     */
    stateRestoreStorage: function(key/*string*/) {
        if (!localStorage || !key) { return undefined; }
        var tmp = JSON.parse(localStorage.gwtk || '{}'),
        _data = undefined;
        if (tmp && tmp.states){
            _data = tmp.states[key];
        }
        return _data;
    },

    /**
     * Исправления бага для плагина Jquery Resizable в Firefox ниже указанной версии
     * @method fixJqueryResizablePluginFF
	 * @params size {object} объект с шириной и высотой компонента до изменения размера и после
	 * @params step {number} коэффициент, определяющий срабатывание события mouseup
	 * @params version {number} номер версии
     */
    fixJqueryResizablePluginFF: function(size, step, version) {
	    step = step || 0.1;
		version = version || 60;
		var browser = GWTK.getBrowser();
		if (browser.mozilla && browser.name.toLowerCase() == 'firefox' && browser.version < version) {
			var deltaH = Math.round(window.innerHeight*step), deltaW = Math.round(window.innerWidth*step),
			    difH, difW;

			if (size.after.height > size.before.height) {
			  difH = size.after.height - size.before.height;
			}
			else {
			  difH = size.before.height - size.after.height;
			}

			if (size.after.width > size.before.width) {
			  difW = size.after.width - size.before.width;
			}
			else {
			  difW = size.before.width - size.after.width;
			}

			if (difH  > deltaH || difW  > deltaW) {
			  $(document).trigger('mouseup.resizable');
			}
		}
	}

};

// shortcut of function GWTK.Util.bind
GWTK.bind = GWTK.Util.bind;

// **************************************************************
// Cookie API
// **************************************************************
GWTK.Cookies = function () {
    this.defaults = {};
    this.pluses = /\+/g;
    this.raw = true;
};

GWTK.Cookies.prototype = {

	getKey: function(){
		return hex_md5(window.location.href);
	},

	stringifyCookieValue: function (value) {
		return this.encode(String(value));
    },

    encode:function(s){
		return this.raw ? s : encodeURIComponent(s);
    },

    decode:function (s) {
        return this.raw ? s : decodeURIComponent(s);
    },

    parseCookieValue:function (s) {
		if (s.indexOf('"') === 0) {
		    // This is a quoted cookie as according to RFC2068, unescape...
		    s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}
        try {
            // Replace server-side written pluses with spaces.
            // If we can't decode the cookie, ignore it, it's unusable.
            // If we can't parse the cookie, ignore it, it's unusable.
            s = decodeURIComponent(s.replace(this.pluses, ' '));
            return s;
        }
        catch(e) {}
    },

    read:function (s, converter) {
		var value = this.raw ? s : this.parseCookieValue(s);
        return $.isFunction(converter) ? converter(value) : value;
    },

    cookies:function (key, value, options) {
        if (value !== undefined && !$.isFunction(value)) {

            if (key === '') key = GWTK.cookies.getKey();

            options = $.extend({}, this.defaults, options);                           // Write
            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setTime(+t + days * 864e+5);
            }
            var resp = [
				GWTK.cookies.encode(key), '=', GWTK.cookies.stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '',
				options.path ? '; path=' + options.path : '',
				options.domain ? '; domain=' + options.domain : '',
				options.secure ? '; secure' : ''
            ];
            document.cookie = resp.join('');
            return;
        }

        var result = key ? undefined : {};                                            // Read
        var records = document.cookie ? document.cookie.split('; ') : [];
        var i,l;
        for (i = 0, l = records.length; i < l; i++) {
            var parts = records[i].split('=');
            var name = GWTK.cookies.decode(parts.shift());
            var cookie = parts.join('=');

            if (key && key === name) {
                // If second argument (value) is a function, it's a converter...
                result = GWTK.cookies.read(cookie, value);
                break;
            }
         }

        return result;
    },

    // default cookies converter for parameters
    converter: function (value, delim) {
        var sep = delim ? delim : '&';
        var parts = value.split(sep);
        var result = [];
        for (var i = 0, l = parts.length; i < l; i++) {
            if (!parts[i] || parts[i] == null) continue;
            var keys = parts[i].split('=');
            var key_name = GWTK.cookies.decode(keys.shift());
            var key_value = keys.length > 0 ? GWTK.cookies.decode(keys.shift()) : key_name;
            result.push([key_name, key_value]);
        }
        return result;
    }

};

//Kozhanov + 12.11.2015
GWTK.Observable = function(){
    this._init();
};

GWTK.Observable.prototype = {

    _init: function(){
        this.listeners = {};
    },

    addListener: function(object, event, callback){
        if (!this.listeners.hasOwnProperty(event)){
            this.listeners[event] = [];
        }
        this.listeners[event].push({object: object, callback: callback}); //add reference to callback
    },

    removeListener: function(object, event, callback){
        if (this.listeners.hasOwnProperty(event)){
            var i;
            var length = this.listeners[event].length;
            var item;
            for (var i = 0; i < length; i++){
                item = this.listeners[event][i];
                if (item.object === object && item.callback == callback){
                    this.listeners[event].splice(i, 1);
                }
            }
        }
    },

    invoke: function(event, args){
        if (this.listeners.hasOwnProperty(event)){
            var i;
            var length = this.listeners[event].length;
            var item;
            for (var i = 0; i < length; i++){
                item = this.listeners[event][i];
                item.object[item.callback](args); //invoke callback
            }
        }
    }
};

// GWTK.convert = function () {
//     return new GWTK.projections();
// };
// GWTK.projection = GWTK.convert();

// GWTK.spinner; // индикатор процесса выполнения

// shortcuts for most used utility functions
GWTK.extend = GWTK.Util.extend;
GWTK.cookies = new GWTK.Cookies();
GWTK.cookie = GWTK.cookies.cookies;

// cookie remover
GWTK.removeCookie = function (key) {
    if (GWTK.cookie === undefined) {
        GWTK.cookies = new GWTK.Cookies();
        GWTK.cookie = GWTK.cookies.cookies;
    }
    if (GWTK.cookie(key) === undefined) { return false; }
    GWTK.cookie(key, '', { expires: -1, path: '/' })
    return true;
};

// Перевести строку из кириллицы в транслит
// Вход: text - сторка кирилицы
// Выход: строка в транслите
GWTK.cyrill_to_latin = function (text) {
    var arrru = new Array('Я', 'я', 'Ю', 'ю', 'Ч', 'ч', 'Ш', 'ш', 'Щ', 'щ', 'Ж', 'ж', 'А', 'а', 'Б', 'б', 'В', 'в', 'Г', 'г', 'Д', 'д', 'Е', 'е', 'Ё', 'ё', 'З', 'з', 'И', 'и', 'Й', 'й', 'К', 'к', 'Л', 'л', 'М', 'м', 'Н', 'н', 'О', 'о', 'П', 'п', 'Р', 'р', 'С', 'с', 'Т', 'т', 'У', 'у', 'Ф', 'ф', 'Х', 'х', 'Ц', 'ц', 'Ы', 'ы', 'Ь', 'ь', 'Ъ', 'ъ', 'Э', 'э', ' ', '\\.', '\\*', '\\?', '\\+', '\\$', '\\^');
    var arren = new Array('Ya', 'ya', 'Yu', 'yu', 'Ch', 'ch', 'Sh', 'sh', 'Sh', 'sh', 'Zh', 'zh', 'A', 'a', 'B', 'b', 'V', 'v', 'G', 'g', 'D', 'd', 'E', 'e', 'E', 'e', 'Z', 'z', 'I', 'i', 'J', 'j', 'K', 'k', 'L', 'l', 'M', 'm', 'N', 'n', 'O', 'o', 'P', 'p', 'R', 'r', 'S', 's', 'T', 't', 'U', 'u', 'F', 'f', 'H', 'h', 'C', 'c', 'Y', 'y', '`', '`', '\'', '\'', 'E', 'e', '_', '_', '_', '_', '_', '_', '_');

    for (var i = 0; i < arrru.length; i++) {
        var reg = new RegExp(arrru[i], "g");
        text = text.replace(reg, arren[i]);
    }
    return text;
}

// **************************************************************
// Сообщения
// **************************************************************
GWTK.errorTitle = 'Сообщение';
GWTK.errorBrowserVersion = 'Ваш браузер не поддерживает HTML5. Требуется обновить браузер.';
GWTK.errorBrowserSvg = 'Ваш браузер не поддерживает SVG графику. Требуется обновить браузер.';

// **************************************************************
// Картинки инструментария
// **************************************************************
GWTK.imgClose = 'data:image/gif;base64,R0lGODlhEAAQAMQfAPf39+fn5+Pj4/7+/v39/dvb2/X19eDg4N7e3vPz8/b29uXl5d3d3fT09Orq6uHh4enp6evr6/n5+dnZ2eLi4ujo6Obm5tra2vj4+NfX19jY2H9/f5+fn9bW1v///////yH5BAEAAB8ALAAAAAAQABAAAAWN4Cd+SsB0HROM7LegMLy0QqdVmOdhldZRI0unkNMZMYWOhdTJFI3HTAdQ6VR0G46Os9FVKwgNYJvlaj0ADSJzGRi5WePgomG7yXEd4TI5aAxkHGY6BhoHEB0BWGdcOgEdEB9NY1BGAFIYH0IXCZUeCRdKIzVKDQQEDUIdAi0RUjFNES0jDg8aGg8OEiwhADs=';
GWTK.imgEmpty = 'data:image/gif;base64,R0lGODlhAAEAAYAAAGZmZv///yH5BAEAAAEALAAAAAAAAQABAAL/jI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuC8fyTNf2jef6zvf+DwwKh8Si8YhMKpfMpvMJjUqn1Kr1is1qt9yu9wsOi8fksvmMTqvX7Lb7DY/L5/S6/Y7P6/f8vv8PGCg4SFhoeIiYqLjI2Oj4CBkpOUlZaXmJmam5ydnp+QkaKjpKWmp6ipqqusra6voKGys7S1tre4ubq7vL2+v7CxwsPExcbHyMnKy8zNzs/AwdLT1NXW19jZ2tvc3d7f0NHi4+Tl5ufo6err7O3u7+Dh8vP09fb3+Pn6+/z9/v/w8woMCBBAsaPIgwocKFDBs6fAgxosSJFCtavIgxo8aNXxw7evwIMqTIkSRLmjyJMqXKlSxbunwJM6bMmTRr2ryJM6fOnTx7+vwJNKjQoUSLGj2KNKnSpUybOn0KNarUqVSrWr2KNavWrVy7ev0KNqzYsWTLmj2LNq3atWzbHisAADs=';
GWTK.imgCollapsed = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAeUlEQVR42mNkoBAw0syAsrKS/11dPQQtwKkgLy/nPwcHB8O9ew+U1qxZc59sA0AAaIgw0JB3ZBsANYQLaMh3sg2AGmIDNOQo2QaAAHrAkuoCHqALvpIbBlJAzc/JCgNcmokyAJ9mvAaEhIQ8AlLm+DTjNYBYMPAGAADJOU0RGOUM5wAAAABJRU5ErkJggg==';
GWTK.imgRedPoint = 'data:image/gif;base64,R0lGODlhCgAKANUgAGpPTxYQEGxRUZx1dSEHBDAkJDImJqsiF+0vIJwfFRsFBBMODucuH/AwIAoHB/YxIRUEAx0HBqgiFiAIBtssHfkyIaIgFhcGBd4sHrEjGLclGAwJCeovHz4vL5pzc/8zIsyZmQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAACAALAAAAAAKAAoAAAZBQBDI0wkEOh4hCEDIIDgHhWBIaHyuH05kUNBgsRLDpvK9cjabR/nDcBQO64TBM0F8GZfBUmHBUBIQU0JECwtIQkEAOw==';
GWTK.imgMarkerRedPoint = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkNCQTFEOTg0QjhGRDExRTQ5NTQxRTlCRTNCQTgyQUI0IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkNCQTFEOTg1QjhGRDExRTQ5NTQxRTlCRTNCQTgyQUI0Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6Q0JBMUQ5ODJCOEZEMTFFNDk1NDFFOUJFM0JBODJBQjQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6Q0JBMUQ5ODNCOEZEMTFFNDk1NDFFOUJFM0JBODJBQjQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz72ooumAAAA0klEQVR42mI8Y8wAA7pA3A7ENlD+ESCuBOLLIA4jVGEmEE8AYjYGVPALiAuAeDpIoQGQcRKkiENenUEkKA2s4s3GuQw/7l2DKTZnACrcCMT/r4Rq/f/749t/GPj36+f/q+G6/0FyIDVMQNUgExlE/JMZmNg54XYysrIxiIZkwrgGTAxEAiaYr0Bu+v/7F1wCxH69ZjqMexnkGZC/j4E8w6miC7cOpOj7ncswz1jBgicHGjzMaDb+BeJiIJ4Ic+MUkC4g3grEH6F4K1RsIkgBQIABAP4OTTX4eGPCAAAAAElFTkSuQmCC';
GWTK.imgMarkerBlankRed = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAzCAYAAACAArhKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkIyQ0ZGMEUyMTg4NTExRTQ4RTY2QkE2M0FCRkQ3MjE3IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkIyQ0ZGMEUzMTg4NTExRTQ4RTY2QkE2M0FCRkQ3MjE3Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QjJDRkYwRTAxODg1MTFFNDhFNjZCQTYzQUJGRDcyMTciIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QjJDRkYwRTExODg1MTFFNDhFNjZCQTYzQUJGRDcyMTciLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6OCreuAAALiUlEQVR42qRYeYxdVRn/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';
GWTK.imgsearch = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAxUlEQVR42mNkoDJgHDUQDnp7e/mAlC6Ue7m4uPgT2QYCDWsGUjVowi1AQ2tJNhDJsAtA3AwVBhlkQIyhjGiGgbz5EWqYEVDzf6g4SN05qKH8+LyPbqA1kDoCxMFATevQ5IKA1FogtgHKHR0wA6nrZXyRws7ObsDFxfWHkZExOzExcRbRBqIZCgeCgoIgw1ig3HRchhKdsIWEhCKA9EwkJVgNJSnrzZ8/P42QoSTnZTRDvwEN5KbIQCRD+4G4kGIXEgKD30AAwVleFXC4rEIAAAAASUVORK5CYII=';
GWTK.imgPrick = 'data:image/png;base64,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';
GWTK.imgPrickEmpty = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAyCAYAAAAus5mQAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAABDSURBVHja7M4BDQAACAMgtX/nW8NNSEAnqcumjhMUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/BlcAAAA//8DADtCA2EJ02I8AAAAAElFTkSuQmCC';
GWTK.imgPrickBig = 'data:image/png;base64,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';
GWTK.imgPrickBig_select = 'data:image/png;base64,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';

GWTK.imgNext = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABaklEQVR42u2Vz0qEUBTG7zUJkhoLeoBZ9gjtc9vWSJiBGe8qaBf0BK1a1iJQmRQxEHqKCIZWtYkeoGhTLaIGU+L2WSCCf+7IIAR1V+fK+b7fOedelZKWF/0HtAKglEqmaS7btv3SCkDX9fmOqo4J55oIMgvgA+F1Esea67rPbQGICNIYMBgM1iRJWqeSNMo9roRMBTAMY1VRlF1OaR+CbkVaKaQWgNtCh4ztIOkAW3WKWgqQSkA65yVVPUXCdsMp+rZl9WoBaeUmY2cItxpZc36TJMmGsAPG2B4oh7OalwJwS7pzsnyLcCHTEpKKLinnd5zzezQYo4ATkXkpANU7EA9/fMk5xEeO41zAmOfPJ3sPYD6ZTLQgCJ5Kx53fQKhC+Ijw4ZOQ3siyxmWiDCAwLwDwATPRfj+Kok3f91+rRN+ATudKZF4AYDz7cRwfe573XicCAMckr4jMy0a0GIbhm0jUZP3OH87fAnwByL+0GYihiIYAAAAASUVORK5CYII=';
GWTK.imgPrev = 'data:image/png;base64,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';

//GWTK.imgPrint = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAABLklEQVR42mNkoDNgHNkWZmdm/ifH0KnTp+M0l6CFjk5OJFm2f98+yi0MCQ0lKujXrF79f9TCEWgh0BIpINUP1BROSbYA6l0CZHYB2ZdwWghUpAykNgOxJlQTJRaC9F4DYj8g/y4uCycCqTw0TZRYCAKTgPx8rBZWVVT8//jxIzZNZFvIz8/P0NbRAbcHp4VAIA7U+IocC4GWiQGpl6RaSBVAcwunTJsGpnOysuhn4cuXLxmaGxvpYyFJQYqcLagIcGcLoIUKQGotEBvBxOzs7RnCIyKIKtpWrljx/9DBg8hCF4A4EGjhA6wWQi0VAFKgCHADYg17BweGsPBwoixctXLl/4MHDoCYV4EYZPNUoGXXkNUQLLzJsZCi2gJkISmAYgtJsg0KyLaQFmD4WwgAoWTgHckpKsYAAAAASUVORK5CYII=';
GWTK.imgRemoveNode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAXklEQVR42mP8//8/Q3Zm5v+p06czMmABMDnGrIyM/zBBdMUgRTA2I8xEdMXoYmCFyBIfP3++BqL5eXm1kDXCFYJATEzMVZgCkIYlS5Zoo1hNkkKirCbKMyQHD6EABwDzo2RlIVI8qgAAAABJRU5ErkJggg==';
//GWTK.imgScreen = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAADJSURBVHjadM8xSwJxGIDx570rDPrjfYRb/AB+gqjhOHBr72jxhhuEcHPuIySclG5KQ1skdh114OzgB3AJHCUQ/iU03OuiQ0XP+NseUX4mm5ta3XcAKN/ni5aUYd68FQA0HgSZaFpEwREA9m10moha83HlHgLfftuzRhQ+G52q4rwue4AorKOHCvD81N3DxdADHl/+h+j+GBhP9mDPux4wnqWAqDWry4oLfNWuq9aIpkV0YkrgYD0dniVShnnzbjcW94Ps79zv/e0AiCdQ7xVHlhIAAAAASUVORK5CYII=";

// Стрелки расширения окна для редактора
GWTK.imgArrowUp = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAkklEQVR42mNkIBMwDh6NRUWFKUDqV19f/yKiNQI1RQGpxUD8D4gjgZrXENQI1BQApFYDMQtU6BcQBwE1b8WpEajJHUhtBGJ2NPN+ALEvUPMeDI1ATfZAahsQc+Hw9lcg9gBqPgLXCNRkDqR2AzEvgcD8BMQuQM2nGYGa9IGc/UAsSGRMvANiR5BGItUTER2DUyMADo4n5wxG8uUAAAAASUVORK5CYII=";
GWTK.imgArrowDown = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAmElEQVR42mNkIBMw0l9jUVEh2Rr1gfR+IBYkUs87IHYEOxWo2RxI7QZiXgKaPgGxS19f/2m4H4Ga7YHUNiDmwqHpKxB7ADUdwQgcoGZ3ILURiNnRNP0AYl+gpj04QxWoOQBIrQZiFqjQLyAOAmraihI42NwE1BwFpBYD8T8gjgRqWoMRqrhCAag5BWQbUNMirNFBZBQMAo0AkVkn59dWEU4AAAAASUVORK5CYII=";
GWTK.imgArrowLeft = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAACySURBVHjalNKxagJBEADQxyIIgRT+iJaWaQKxEcTO1P7A7Yfc/UNSJk0KbRRs/B4LQQgpsjYn6MXL3Q1ss7NvhllGSsnl1EWM2ej6XUpJ0BAxZmPsqvehAT1hg0FrGGP2gjUe7+VDDZrhCw91hcMd9IoP9P8bI1TQEu/oNX1ateMPfrWIG5jnxRsWZYFOHeV58Yk5vjvBEq8wxakTLPEWExw7wRLv8YzDn2TLJR9Wl/w8AKzITz7YbZw9AAAAAElFTkSuQmCC";
GWTK.imgArrowRight = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAACoSURBVHjalJKhCgJREEUPIgiCwR/RaDQqWDZYNPsDcz9k3j9oNBm0KFhs/otBEGSDz7osb1ffgUlzD8wMQ4yRakk2poFqrpPoXyWb8IOUOATOkk1zRYABcJJslisC9IGDZEWuCNAD9pKtc0WALrCTbJMrAnyAMlcsgZV72NbHaOMNLN3DMTV/Ey+gcA+XpsVTPIGFe7i1XazOA5i7h3vrEoknH/2T/Q4AtBpPca6tKhMAAAAASUVORK5CYII=";
GWTK.imgArrowPrev = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAgUlEQVR42mNkoBAwEqUICJJSUi4w/v//as6cOa4kGQDSnJycfAnI0Pr////NuXPmaBFtAIpmBoZbc2fP1iTaC8RoxmkAsZqxGoCsmeH//1vAQMOpGasByampZ4GCBsRopo0BSF7QBvr/Jj7/0yYQSTWEdgkJqyGkJmVkQ8jOTIQAAM3NXRFROi/wAAAAAElFTkSuQmCC';
GWTK.imgArrowNext = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAfUlEQVR42mNkoBAwogukpKTs/s/IKDZvzhyD/0BAsgHJKSnXGBkZ1Rn+/782d+5cPUKGMGITTE5NvQ6UUCPGEEZcEsQagtMAYg3BawA0UK8zMDLiNISgAciGAHVemDt7tjF9DYCGAyhar5LsBYoCkaJopCghUZyUKc5MpAIAo16MEejM72AAAAAASUVORK5CYII=';


/**
* Проверка версии браузера
* @metod getBrowser
* @returns {object} {mozilla, webkit, opera, safari, chrome, msie, zarya, ua, name, fullVersion, majorVersion, version, android, blackberry, ios, operaMobile, windowsMobile, kindle, mobile}
*/
// ===============================================================
GWTK.getBrowser = function () {
    var ua = navigator.userAgent;
    browser = {};
    browser.mozilla = false;
    browser.webkit = false;
    browser.opera = false;
    browser.safari = false;
    browser.chrome = false;
    browser.msie = false;
	browser.zarya = false;
    browser.ua = ua;
    browser.name = navigator.appName;
    browser.fullVersion = '' + parseFloat(navigator.appVersion);
    browser.majorVersion = parseInt(navigator.appVersion, 10);
    var nameOffset, verOffset, ix, edge;

	// In Opera, the true version is after "Opera" or after "Version"
    if ((verOffset = ua.indexOf("Opera")) != -1) {
        browser.opera = true;
        browser.name = "Opera";
        browser.fullVersion = ua.substring(verOffset + 6);
        if ((verOffset = ua.indexOf("Version")) != -1)
            browser.fullVersion = ua.substring(verOffset + 8);
    }
    // In Opera > 20 the true version is after "OPR"
    else if ((verOffset = ua.indexOf("OPR")) != -1) {
        browser.opera = true;
        browser.name = "Opera";
        browser.fullVersion = ua.substring(verOffset + 4);
    }
    // In MSIE < 11, the true version is after "MSIE" in userAgent
    else if ((verOffset = ua.indexOf("MSIE")) != -1) {
        browser.msie = true;
        browser.name = "Microsoft Internet Explorer";
        browser.fullVersion = ua.substring(verOffset + 5);
    }
    // In TRIDENT (IE11) => 11, the true version is after "rv:" in userAgent
    else if (ua.indexOf("Trident") != -1) {
        browser.msie = true;
        browser.name = "Microsoft Internet Explorer";
        var start = ua.indexOf("rv:") + 3;
        var end = start + 4;
        browser.fullVersion = ua.substring(start, end);
    }
	// Microsoft Edge
    else if (ua.indexOf("Edge") != -1) {
        browser.msie = true;
        browser.name = "Microsoft Edge Browser";
        browser.fullVersion = ua.substring(ua.indexOf("Edge"));
    }
	// In Zarya, the true version is after "Zarya"
    else if ((verOffset = ua.indexOf("Zarya")) != -1) {
        browser.webkit = true;
        browser.zarya = true;
        browser.name = "Zarya";
        browser.fullVersion = ua.substring(verOffset + 7);
    }
    // In Chrome, the true version is after "Chrome"
    else if ((verOffset = ua.indexOf("Chrome")) != -1) {
        browser.webkit = true;
        browser.chrome = true;
        browser.name = "Chrome";
        browser.fullVersion = ua.substring(verOffset + 7);
    }
    // In Safari, the true version is after "Safari" or after "Version"
    else if ((verOffset = ua.indexOf("Safari")) != -1) {
        browser.webkit = true;
        browser.safari = true;
        browser.name = "Safari";
        browser.fullVersion = ua.substring(verOffset + 7);
        if ((verOffset = ua.indexOf("Version")) != -1)
            browser.fullVersion = ua.substring(verOffset + 8);
    }
    // In Safari, the true version is after "Safari" or after "Version"
    else if ((verOffset = ua.indexOf("AppleWebkit")) != -1) {
        browser.webkit = true;
        browser.name = "Safari";
        browser.fullVersion = ua.substring(verOffset + 7);
        if ((verOffset = ua.indexOf("Version")) != -1)
            browser.fullVersion = ua.substring(verOffset + 8);
    }
    // In Firefox, the true version is after "Firefox"
    else if ((verOffset = ua.indexOf("Firefox")) != -1) {
        browser.mozilla = true;
        browser.gecko = true;
        browser.name = "Firefox";
        browser.fullVersion = ua.substring(verOffset + 8);
    }
    // In most other browsers, "name/version" is at the end of userAgent
    else if ((nameOffset = ua.lastIndexOf(' ') + 1) < (verOffset = ua.lastIndexOf('/'))) {
        browser.name = ua.substring(nameOffset, verOffset);
        browser.fullVersion = ua.substring(verOffset + 1);
        if (browser.name.toLowerCase() == browser.name.toUpperCase()) {
            browser.name = navigator.appName;
        }
    } else if ( edge = ua.indexOf( 'Edge/' ) > 0 ) {
	    browser.msie = true;
	    browser.name = "Microsoft Edge";
	    browser.fullVersion = parseInt( ua.substring( edge + 5, ua.indexOf( '.', edge ) ), 10 );
    }

    // trim the fullVersion string at semicolon/space if present
    if ((ix = browser.fullVersion.indexOf(";")) != -1)
        browser.fullVersion = browser.fullVersion.substring(0, ix);
    if ((ix = browser.fullVersion.indexOf(" ")) != -1)
        browser.fullVersion = browser.fullVersion.substring(0, ix);

    browser.majorVersion = parseInt('' + browser.fullVersion, 10);
    if (isNaN(browser.majorVersion)) {
        browser.fullVersion = '' + parseFloat(navigator.appVersion);
        browser.majorVersion = parseInt(navigator.appVersion, 10);
    }
    browser.version = browser.majorVersion;

    /*Check all mobile environments*/
    browser.android = (/Android/i).test(ua);
    browser.blackberry = /BlackBerry|BB|PlayBook/i.test(ua);
    browser.ios = /iPhone|iPad|iPod|webOS/i.test(ua);
    browser.operaMobile = (/Opera Mini/i).test(ua);
    browser.windowsMobile = /IEMobile|Windows Phone/i.test(ua);
    browser.kindle = /Kindle|Silk/i.test(ua);
    browser.mobile = browser.android || browser.blackberry || browser.ios || browser.windowsMobile || browser.operaMobile || browser.kindle;

	return browser;
};



/**
* Устаревшая функция! Необходимо использовать GWTK.getBrowser()
* Проверка версии браузера
* @returns {$.browser}
*/
(function ($) {
    //$.browserTest = function (a, z) { var u = 'unknown', x = 'X', m = function (r, h) { for (var i = 0; i < h.length; i = i + 1) { r = r.replace(h[i][0], h[i][1]); } return r; }, c = function (i, a, b, c) { var r = { name: m((a.exec(i) || [u, u])[1], b) }; r[r.name] = true; r.version = (c.exec(i) || [x, x, x, x])[3]; if (r.name.match(/safari/) && r.version > 400) { r.version = '2.0'; } if (r.name === 'presto') { r.version = ($.browser.version > 9.27) ? 'futhark' : 'linear_b'; } r.versionNumber = parseFloat(r.version, 10) || 0; r.versionX = (r.version !== x) ? (r.version + '').substr(0, 1) : x; r.className = r.name + r.versionX; return r; }; a = (a.match(/Opera|Navigator|Minefield|KHTML|Chrome/) ? m(a, [[/(Firefox|MSIE|KHTML,\slike\sGecko|Konqueror)/, ''], ['Chrome Safari', 'Chrome'], ['KHTML', 'Konqueror'], ['Minefield', 'Firefox'], ['Navigator', 'Netscape']]) : a).toLowerCase(); $.browser = $.extend((!z) ? $.browser : {}, c(a, /(camino|chrome|firefox|netscape|konqueror|lynx|msie|opera|safari)/, [], /(camino|chrome|firefox|netscape|netscape6|opera|version|konqueror|lynx|msie|safari)(\/|\s)([a-z0-9\.\+]*?)(\;|dev|rel|\s|$)/)); $.layout = c(a, /(gecko|konqueror|msie|opera|webkit)/, [['konqueror', 'khtml'], ['msie', 'trident'], ['opera', 'presto']], /(applewebkit|rv|konqueror|msie)(\:|\/|\s)([a-z0-9\.]*?)(\;|\)|\s)/); $.os = { name: (/(win|mac|linux|sunos|solaris|iphone)/.exec(navigator.platform.toLowerCase()) || [u])[0].replace('sunos', 'solaris') }; if (!z) { $('html').addClass([$.os.name, $.browser.name, $.browser.className, $.layout.name, $.layout.className].join(' ')); } }; $.browserTest(navigator.userAgent);
    var ua = navigator.userAgent;
    if (!$.browser) {
        $.browser = {};
        $.browser.mozilla = false;
        $.browser.webkit = false;
        $.browser.opera = false;
        $.browser.safari = false;
        $.browser.chrome = false;
        $.browser.msie = false;
        $.browser.ua = ua;
        $.browser.name = navigator.appName;
        $.browser.fullVersion = '' + parseFloat(navigator.appVersion);
        $.browser.majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;
        // In Opera, the true version is after "Opera" or after "Version"
        if ((verOffset = ua.indexOf("Opera")) != -1) {
            $.browser.opera = true;
            $.browser.name = "Opera";
            $.browser.fullVersion = ua.substring(verOffset + 6);
            if ((verOffset = ua.indexOf("Version")) != -1)
                $.browser.fullVersion = ua.substring(verOffset + 8);
        }

            // In Opera > 20 the true version is after "OPR"
        else if ((verOffset = ua.indexOf("OPR")) != -1) {
            $.browser.opera = true;
            $.browser.name = "Opera";
            $.browser.fullVersion = ua.substring(verOffset + 4);
        }

            // In MSIE < 11, the true version is after "MSIE" in userAgent
        else if ((verOffset = ua.indexOf("MSIE")) != -1) {
            $.browser.msie = true;
            $.browser.name = "Microsoft Internet Explorer";
            $.browser.fullVersion = ua.substring(verOffset + 5);
        }

            // In TRIDENT (IE11) => 11, the true version is after "rv:" in userAgent
        else if (ua.indexOf("Trident") != -1) {
            $.browser.msie = true;
            $.browser.name = "Microsoft Internet Explorer";
            var start = ua.indexOf("rv:") + 3;
            var end = start + 4;
            $.browser.fullVersion = ua.substring(start, end);
        }

            // In Chrome, the true version is after "Chrome"
        else if ((verOffset = ua.indexOf("Chrome")) != -1) {
            $.browser.webkit = true;
            $.browser.chrome = true;
            $.browser.name = "Chrome";
            $.browser.fullVersion = ua.substring(verOffset + 7);
        }
            // In Safari, the true version is after "Safari" or after "Version"
        else if ((verOffset = ua.indexOf("Safari")) != -1) {
            $.browser.webkit = true;
            $.browser.safari = true;
            $.browser.name = "Safari";
            $.browser.fullVersion = ua.substring(verOffset + 7);
            if ((verOffset = ua.indexOf("Version")) != -1)
                $.browser.fullVersion = ua.substring(verOffset + 8);
        }
            // In Safari, the true version is after "Safari" or after "Version"
        else if ((verOffset = ua.indexOf("AppleWebkit")) != -1) {
            $.browser.webkit = true;
            $.browser.name = "Safari";
            $.browser.fullVersion = ua.substring(verOffset + 7);
            if ((verOffset = ua.indexOf("Version")) != -1)
                $.browser.fullVersion = ua.substring(verOffset + 8);
        }
            // In Firefox, the true version is after "Firefox"
        else if ((verOffset = ua.indexOf("Firefox")) != -1) {
            $.browser.mozilla = true;
            $.browser.gecko = true;
            $.browser.name = "Firefox";
            $.browser.fullVersion = ua.substring(verOffset + 8);
        }
            // In most other browsers, "name/version" is at the end of userAgent
        else if ((nameOffset = ua.lastIndexOf(' ') + 1) < (verOffset = ua.lastIndexOf('/'))) {
            $.browser.name = ua.substring(nameOffset, verOffset);
            $.browser.fullVersion = ua.substring(verOffset + 1);
            if ($.browser.name.toLowerCase() == $.browser.name.toUpperCase()) {
                $.browser.name = navigator.appName;
            }
        }

        // trim the fullVersion string at semicolon/space if present
        if ((ix = $.browser.fullVersion.indexOf(";")) != -1)
            $.browser.fullVersion = $.browser.fullVersion.substring(0, ix);
        if ((ix = $.browser.fullVersion.indexOf(" ")) != -1)
            $.browser.fullVersion = $.browser.fullVersion.substring(0, ix);

        $.browser.majorVersion = parseInt('' + $.browser.fullVersion, 10);
        if (isNaN($.browser.majorVersion)) {
            $.browser.fullVersion = '' + parseFloat(navigator.appVersion);
            $.browser.majorVersion = parseInt(navigator.appVersion, 10);
        }
        $.browser.version = $.browser.majorVersion;
    }
    /*Check all mobile environments*/
    $.browser.android = (/Android/i).test(ua);
    $.browser.blackberry = /BlackBerry|BB|PlayBook/i.test(ua);
    $.browser.ios = /iPhone|iPad|iPod|webOS/i.test(ua);
    $.browser.operaMobile = (/Opera Mini/i).test(ua);
    $.browser.windowsMobile = /IEMobile|Windows Phone/i.test(ua);
    $.browser.kindle = /Kindle|Silk/i.test(ua);
    $.browser.mobile = $.browser.android || $.browser.blackberry || $.browser.ios || $.browser.windowsMobile || $.browser.operaMobile || $.browser.kindle;
})(jQuery);

// ===============================================================
// Функция для изменения стандартного поведения компонента list (w2ui) (при раскрытии списка выделяется не первый элемент, а элеиент выбранный пользователем)
// Возвращает индекс выбранного пользователем элемента, параметры: elem - объект jquery, items - элементы списка
// Использование: при создании компонента list нужно определить обработчик renderDrop = function()
// $('#list').w2field('list', { items: [ ... ],
//	renderDrop: function(item, options)
//  {
//     options.index = dropListSelected($('#list'), this.items);
//     return '<span class="fa-star" style="' + 'padding-right: 3px; color: #828AA7; text-shadow: 1px 1px 3px white;' + '"></span>' + item.text;
//  }
// }); 24.12.15 Помозов
// ===============================================================
GWTK.dropListSelected = function(elem, items)
{
   var selected = {};
   if (typeof elem.data('selected') !== 'undefined')
      selected = elem.data('selected');
   var i=0;
   if (!$.isEmptyObject(selected))
   {
	  for (var j=0; j<items.length; j++)
      {
        if (items[j].id == selected.id)
        {
          i = j;
          break;
        }
      }
   }
   return i;
};

/**
 * Перекодировать строку в url-кодировку с экранированием символов '(',')'
 * @metod fixedEncodeURI
 * @returns {String} - строка в url-кодировке
*/
// ===============================================================
GWTK.fixedEncodeURI = function (str) {
    return encodeURI(str).replace(/[(]/g, '%28').replace(/[)]/g, '%29');
};

/**
* Попадает ли число в диапазон
* @method between
* @param a - первое число диапазона
* @param b - второе число диапазона
* @returns {boolean}
*/
// ===============================================================
Number.prototype.between = function (a, b) {
    var min = Math.min(a, b),
        max = Math.max(a, b);

    return this >= min && this <= max;
};

/**
* Является ли число дробным
* @method isFloat
* @param num - проверяемое число
* @returns {boolean}
*/
// ===============================================================
Number.prototype.isFloat = function (num) {
    return parseInt(num) !== parseFloat(num)
};


/**
* Тип устройства, ориентации, системы
* @method GWTK.device
* @returns
* @Main functions
* GWTK.device.ios()
* GWTK.device.iphone()
* GWTK.device.ipod()
* GWTK.device.ipad()
* GWTK.device.android()
* GWTK.device.androidPhone()
* GWTK.device.androidTablet()
* GWTK.device.blackberry()
* GWTK.device.blackberryPhone()
* GWTK.device.blackberryTablet()
* GWTK.device.windows()
* GWTK.device.windowsPhone()
* GWTK.device.windowsTablet()
* GWTK.device.fxos()
* GWTK.device.fxosPhone()
* GWTK.device.fxosTablet()
* GWTK.device.meego()
* GWTK.device.cordova()
* GWTK.device.nodeWebkit()
* GWTK.device.mobile()
* GWTK.device.tablet()
* GWTK.device.desktop()
* GWTK.device.television()
*/
// ===============================================================
(function () {

    var device,
      previousDevice,
      addClass,
      documentElement,
      find,
      handleOrientation,
      hasClass,
      orientationEvent,
      removeClass,
      userAgent;

    // Save the previous value of the device variable.
    previousDevice = window.device;

    device = {};

    // Add device as a global object.
    GWTK.device = device;

    // The <html> element.
    documentElement = window.document.documentElement;

    // The client user agent string.
    // Lowercase, so we can use the more efficient indexOf(), instead of Regex
    userAgent = window.navigator.userAgent.toLowerCase();

    // Main functions
    // --------------

    device.ios = function () {
        return device.iphone() || device.ipod() || device.ipad();
    };

    device.iphone = function () {
        return !device.windows() && find('iphone');
    };

    device.ipod = function () {
        return find('ipod');
    };

    device.ipad = function () {
        return find('ipad');
    };

    device.android = function () {
        return !device.windows() && find('android');
    };

    device.androidPhone = function () {
        return device.android() && find('mobile');
    };

    device.androidTablet = function () {
        return device.android() && !find('mobile');
    };

    device.blackberry = function () {
        return find('blackberry') || find('bb10') || find('rim');
    };

    device.blackberryPhone = function () {
        return device.blackberry() && !find('tablet');
    };

    device.blackberryTablet = function () {
        return device.blackberry() && find('tablet');
    };

    device.windows = function () {
        return find('windows');
    };

    device.windowsPhone = function () {
        return device.windows() && find('phone');
    };

    device.windowsTablet = function () {
        return device.windows() && (find('touch') && !device.windowsPhone());
    };

    device.fxos = function () {
        return (find('(mobile;') || find('(tablet;')) && find('; rv:');
    };

    device.fxosPhone = function () {
        return device.fxos() && find('mobile');
    };

    device.fxosTablet = function () {
        return device.fxos() && find('tablet');
    };

    device.meego = function () {
        return find('meego');
    };

    device.cordova = function () {
        return window.cordova && location.protocol === 'file:';
    };

    device.nodeWebkit = function () {
        return typeof window.process === 'object';
    };

    device.mobile = function () {
        return device.androidPhone() || device.iphone() || device.ipod() || device.windowsPhone() || device.blackberryPhone() || device.fxosPhone() || device.meego();
    };

    device.tablet = function () {
        return device.ipad() || device.androidTablet() || device.blackberryTablet() || device.windowsTablet() || device.fxosTablet();
    };

    device.desktop = function () {
        return !device.tablet() && !device.mobile();
    };

    device.television = function () {
        var i, tvString;

        television = [
          "googletv",
          "viera",
          "smarttv",
          "internet.tv",
          "netcast",
          "nettv",
          "appletv",
          "boxee",
          "kylo",
          "roku",
          "dlnadoc",
          "roku",
          "pov_tv",
          "hbbtv",
          "ce-html"
        ];

        i = 0;
        while (i < television.length) {
            if (find(television[i])) {
                return true;
            }
            i++;
        }
        return false;
    };

    device.portrait = function () {
        return (window.innerHeight / window.innerWidth) > 1;
    };

    device.landscape = function () {
        return (window.innerHeight / window.innerWidth) < 1;
    };

    // Public Utility Functions
    // ------------------------

    // Run device.js in noConflict mode,
    // returning the device variable to its previous owner.
    device.noConflict = function () {
        window.device = previousDevice;
        return this;
    };

    // Private Utility Functions
    // -------------------------

    // Simple UA string search
    find = function (needle) {
        return userAgent.indexOf(needle) !== -1;
    };

    // Check if documentElement already has a given class.
    hasClass = function (className) {
        var regex;
        regex = new RegExp(className, 'i');
        return documentElement.className.match(regex);
    };

    // Add one or more CSS classes to the <html> element.
    addClass = function (className) {
        var currentClassNames = null;
        if (!hasClass(className)) {
            currentClassNames = documentElement.className.replace(/^\s+|\s+$/g, '');
            documentElement.className = currentClassNames + " " + className;
        }
    };

    // Remove single CSS class from the <html> element.
    removeClass = function (className) {
        if (hasClass(className)) {
            documentElement.className = documentElement.className.replace(" " + className, "");
        }
    };

    // HTML Element Handling
    // ---------------------

    // Insert the appropriate CSS class based on the _user_agent.

    if (device.ios()) {
        if (device.ipad()) {
            addClass("ios ipad tablet");
        } else if (device.iphone()) {
            addClass("ios iphone mobile");
        } else if (device.ipod()) {
            addClass("ios ipod mobile");
        }
    } else if (device.android()) {
        if (device.androidTablet()) {
            addClass("android tablet");
        } else {
            addClass("android mobile");
        }
    } else if (device.blackberry()) {
        if (device.blackberryTablet()) {
            addClass("blackberry tablet");
        } else {
            addClass("blackberry mobile");
        }
    } else if (device.windows()) {
        if (device.windowsTablet()) {
            addClass("windows tablet");
        } else if (device.windowsPhone()) {
            addClass("windows mobile");
        } else {
            addClass("desktop");
        }
    } else if (device.fxos()) {
        if (device.fxosTablet()) {
            addClass("fxos tablet");
        } else {
            addClass("fxos mobile");
        }
    } else if (device.meego()) {
        addClass("meego mobile");
    } else if (device.nodeWebkit()) {
        addClass("node-webkit");
    } else if (device.television()) {
        addClass("television");
    } else if (device.desktop()) {
        addClass("desktop");
    }

    if (device.cordova()) {
        addClass("cordova");
    }

    // Orientation Handling
    // --------------------

    // Handle device orientation changes.
    handleOrientation = function () {
        if (device.landscape()) {
            removeClass("portrait");
            addClass("landscape");
        } else {
            removeClass("landscape");
            addClass("portrait");
        }
        return;
    };

    // Detect whether device supports orientationchange event,
    // otherwise fall back to the resize event.
    if (Object.prototype.hasOwnProperty.call(window, "onorientationchange")) {
        orientationEvent = "orientationchange";
    } else {
        orientationEvent = "resize";
    }

    // Listen for changes in orientation.
    if (window.addEventListener) {
        window.addEventListener(orientationEvent, handleOrientation, false);
    } else if (window.attachEvent) {
        window.attachEvent(orientationEvent, handleOrientation);
    } else {
        window[orientationEvent] = handleOrientation;
    }

    handleOrientation();

    if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
        define(function () {
            return device;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = device;
    } else {
        window.device = device;
    }

}).call(this);



/**
 * Добавление к панели поведений JQuery UI:
 * перемещение (draggable)
 * изменение размеров (resizable)
 * @method panelUI
 * @param options {object} - настройки
 *        options.$element {object} - JQuery-элемент, на который накладываются эффекты, обязательный параметр
 *        options.draggable {boolean} - требуется ли эффект перемещения, по умолчанию включено
 *        options.cancelOnDragHTML - HTML-элементы, на которых не должен срабатывать $.draggable (при необходимости); например: 'button'
 *        options.resizable {boolean} - требуется ли эффект изменения размеров, по умолчанию включено
 *        options.resizable [resizeMinWidth, resizeMinHeight, resizeHandles] - настройки JQuery.resizable
 *        options.resizable [startResizeCallback, resizeCallback, stopResizeCallback] - функции обратного вызова от JQuery.resizable
 */
GWTK.panelUI = function (options) {

    // Настройки по умолчанию
    var opt = {
        // Обязательные параметры
        $element: null,
        // Накладываемые эффекты
        draggable: true,
        resizable: true,
        // Настройки JQuery UI draggable
        cancelOnDragHTML: undefined,

        // Настройки JQuery UI resizable
        resizeMinWidth: null,
        resizeMinHeight: null,
        resizeHandles: 'n,ne,e,se,s,sw,w,nw',
        startResizeCallback: null,
        resizeCallback: null,
        stopResizeCallback: null
    };
    $.extend(opt, options);

    if (!opt.$element) {
        // Обязательный параметр
        throw 'GWTK panelUI: type of $element is not an object.';
    }

    // JQuery UI draggable
    if (opt.draggable) {
        opt.$element.draggable({
            containment: 'parent',
			cancel: opt.cancelOnDragHTML,
            distance: 2,
            stop: function (event, ui) {
                var mapOffset = $('.map-pane-main').offset();
                opt.$element.css({
                    'position': 'absolute',
                    'top': ui.offset.top - mapOffset.top,
                    'left': ui.offset.left - mapOffset.left
                });
            }
        });
    }

    // JQuery UI resizable
    if (opt.resizable) {
        opt.$element.resizable({

            minWidth: opt.resizeMinWidth,
            minHeight: opt.resizeMinHeight,
            handles: opt.resizeHandles,

            start: GWTK.Util.bind(function(event, ui) {
                // Получение внешних отступов
                this.panelMarginRight = parseInt($(event.target).css("margin-right"));
                this.panelMarginTop = parseInt($(event.target).css("margin-top"));
                // Если в параметрах есть функция обратного вызова, исполнение функции
                if (opt.startResizeCallback) {
                    opt.startResizeCallback();
                }
            }, this),

            resize: GWTK.Util.bind(function(event, ui) {
                // Изменение левого края
                if (ui.position.left !== ui.originalPosition.left) {
                    ui.position.left = ui.originalPosition.left;
                } else {
                    // Правый край имитируется через внешний отступ
                    $(event.target).css({ marginRight: this.panelMarginRight + ui.originalSize.width - ui.size.width });
                }
                // Изменение верхнего края
                if (ui.position.top !== ui.originalPosition.top) {
                    ui.position.top = ui.originalPosition.top;
                    // Верхний край имитируется через внешний отступ
                    $(event.target).css({ marginTop: this.panelMarginTop + ui.originalSize.height - ui.size.height });
                }
                // Если в параметрах есть функция обратного вызова, исполнение функции
                if (opt.resizeCallback) {
                    opt.resizeCallback();
                }
				// Fix bug for Firefox < 60
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

            }, this),

            stop: GWTK.Util.bind(function(event, ui) {
				// Переброс внешних отступов в смещение
                // Восстановление прежних внешних отступов
                var left = parseInt($(event.target).css("margin-right")) - this.panelMarginRight;
                var top = parseInt($(event.target).css("margin-top")) - this.panelMarginTop;
                left = (left < 0) ? ('+=' + (-left)) : ('-=' + left);
                top = (top < 0) ? ('-=' + (-top)) : ('+=' + top);
                $(event.target).css({
                    marginRight: this.panelMarginRight,
                    marginTop: this.panelMarginTop
                });
                // Если в параметрах есть функция обратного вызова, исполнение функции
                if (opt.stopResizeCallback) {
                    opt.stopResizeCallback();
                }
            }, this)

        });
    }

};
