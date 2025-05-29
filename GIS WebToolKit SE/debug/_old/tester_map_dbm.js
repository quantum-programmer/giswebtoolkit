
var wmts;
var wfs;
var urls;

var settings_mapEditor = {
    "maplayersid": [],
    "functions": [],
    "editingdata": [],
    "selectlayersid": [],
    "transaction": false,
    "oldversion": 0,  // 1 - старая версия редактора, 0 или отсутствие - новая версия
};


function onDataLoaded(response) {

    alert("OnDataLoaded !  --> " + response);

    var elem = $get("dvMap");
    if (elem != null) elem.innerText = response;
}

function initMap() {

    var maptree = [
        {
            "id": "fon", "text": "Фоновые слои", "img": "icon-folder", "expanded": true,
            "nodes": [{ "id": "osmMap", "text": "OpenStreetMap", "clickable": true, "img": "ico_osm" },
                      { "id": "googleMap", "text": "Google", "clickable": true, "img": "ico_google" }
                    ]
        },
        {
            "id": "map", "text": "Карты", "img": "icon-folder", "expanded": true,
            "nodes": [{ "id": "dbmangola", "text": "Ангола (dbm)", "clickable": true, "img": "icon-page" }]
        }
    ];

    var options = {
        "url": "http://gisserver.info/GISWebServiceSE/service.php", "id": "1",
        "center": [-12.3598, 16.93318], 
        "tilematrix": 17, 
        "crs": 3857,
        "tilematrixset": "GoogleMapsCompatible", "maxzoom": 22, "minzoom": 2,
        "mergewmslayers": true,
        "locale": "ru-ru", "shortlegend":0,
        "layers": [
                    {
                        "id": "googleMap",
                        "alias": "Google",
                        "selectObject": 0,
                        "url": "http://mt1.google.com/vt/lyrs=m@250000000&hl=ru&src=app&x=%x&y=%y&z=%z&s=Galileo",
                        "hidden": 1
                    },
                    {
                        "id": "osmMap",
                        "alias": "OpenStreetMap",
                        "selectObject": 0,
                        "url": "http://b.tile.openstreetmap.org/%z/%x/%y.png",
                        //"linkedUrls" :["http://c.tile.openstreetmap.org/%z/%x/%y.png"],
                        "hidden": 1
                    },
                    {
                        "id": "dbmangola", 
                        "alias": "Ангола (dbm)",
                        "selectObject": 1, 
                        //"export": ['json'], //http://localhost/giswebservicese/service.php?
                        "url": "http://localhost/giswebservicese/service.php?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=angoladbm&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs",
                        "version":"13.5.1",
                    }
                ],
        "controls": ["objectPanel", "mapscale", "mapcoordinates", "scaleupdown", "search", "searchSem", 
        "areasearch", "selectobjects", "clearselect", "localmapcontrol","map2img","exportLayer",
        "viewentirelayer", "content", "transitiontopoint", "ruler","viewoptions","mapdbm"],
        
        "controlspanel": "",        //"flex-left",
        "measurementunit": {"perimeter":'m', 'area':'sq m'},    
        "highlightmode": "fill",    //"marker"
        "objectinfo": {'number': false, 'area': true, 'semantic': true},

        "contenttree": maptree,

        "search_options": {
            "map": {
                "visible": 1   // 1/0
            },
            "address": {
                "visible": 1,  // 1/0
                "default": 2,  // индекс sources
                "sources": [   //  описание запросов адресного поиска
                    {
                        "alias": "Яндекс",
                        "access": {"name": "apikey", "value":""},
                        "url_addresssearch": ["https://geocode-maps.yandex.ru/1.x/?", { "result": 100 }],
                        "url_addressatcoord": ["https://geocode-maps.yandex.ru/1.x/?", { "result": 20 }],
                        "access":{"name":"apikey","value":"b1586351-de06-4f3d-a210-1b6968ed3cf4"}
                    },
                    {
                        "alias": "Адресная база",
                        "url_addresssearch": ["http://192.168.1.210/address/ms_address.php?",
                           {
                               "result": 120,
                               "fn_setrequest": "GWTK.AddressGeocoding.setrequestPanorama",
                               "fn_getresponse": "GWTK.AddressGeocoding.getresponsePanorama"
                           }],
                        "url_addressatcoord": ["http://192.168.1.210/address/ms_reverse.php?",
                           {
                               "result": 1,
                               "fn_setrequest": "GWTK.AddressGeocoding.setrequestPanoramaAtCoord",
                               "fn_getresponse": "GWTK.AddressGeocoding.getresponsePanorama"
                           }]
                    },
                    {
                        "alias": "Карта OSM",
                        "url_addresssearch": ["https://nominatim.openstreetmap.org/search?format=json",
                            {
                                "result": 100,
                                "fn_setrequest": "GWTK.AddressGeocoding.setrequestOsm",
                                "fn_getresponse": "GWTK.AddressGeocoding.getresponseOsm"
                            }],

                        "url_addressatcoord": ["https://nominatim.openstreetmap.org/search?format=json",
                         {
                             "result": 10,
                             "fn_setrequest": "GWTK.AddressGeocoding.setrequestOSMAtCoord",
                             "fn_getresponse": "GWTK.AddressGeocoding.getresponseOsm"
                         }]
                    }
                ]
            },
            "rosreestr": {
                "visible": 1   // 1/0
            },
            "default": "address"
        },

        "matrix": [
                   {
                       "id": "coverage1",
                       "alias": "Матрица высот на Ногинск",
                       "url": "http://gisserver.info/GISWebServiceSE/service.php?LAYER=noginskMatrix&METHOD=GETCOVERAGETILE&tilematrixset=%tilematrixset&tilerow=%tilerow&tilecol=%tilecol&tilematrix=%scale&service=WCS&format=wcs"
                   }
        ]
    };

    loadFromUrl(options);


    if (window.GWTK) {
        theMap = new GWTK.Map("dvMap", options);
    }

}

// Получить коллекцию строк запросов рисунков тайлов
function wmtsTileUrl() {

    if (wmts == null) return;

    var querytiles = '{ "layer": "0003", "matrix": "GlobalCRS84Scale", "style": "default", "format": "image/jpg", "zoom": "11", "min": [1240, 638], "max": [1243, 640] }'
    var querytiles1 = '{ "layer": "0003", "matrix": "GlobalCRS84Scale", "style": "default", "format": "image/jpg", "zoom": "11", "min": [1240, 638] }'

    urls = wmts.tileurl(querytiles1);
    if (urls != null && urls.length > 0) {

        alert(urls.join('  \n'));
    }
}

function wmtsTileImage() {
    var querytiles = '{"layer": "0004", "matrix": "urn:ogc:def:wkss:OGC:1.0:GlobalCRS84Scale", "style": "default", "format": "image/jpg", "zoom": "11", "min": [3390, 529], "max": [3390, 529]}';
    wmts.tileimage(querytiles);
}

// Получить информацию об объектах карты в заданной точке
function wmtsFeatureInfo() {

    if (wmts == null) return;
    var queryfeature = '{"layer": "0002", "tilematrixset": "GoogleMapsCompatible", "style": "default", "format": "image/jpg", "tilematrix": "10", "tilerow":319, "tilecol": 621,' +
                       ' "info_format":"text/html", "feature_count":5, "i":100,"j":50}';

    var info = wmts.featureinfo(queryfeature);
    if (typeof (info) !== "undefined")
        alert(info);
}

function wfsFeature() {
    if (wfs == null) return;
    var queryfeature = '{ "TypeNames": "bsd:Settlements", "count": 500, "startindex": "0" }';
    wfs.feature(queryfeature);
}

function wfsFeatureById() {
    if (wfs == null) return;

    wfs.featurebyid("Ногинский район:209263");
}

function wfsTransaction() {
    var xInsert = '<?xml version="1.0" encoding="utf-8" ?><wfs:Transaction version="2.0.0" service="WFS" handle="Transaction 1" >' +







        '<wfs:Insert handle="Ins4"><bsd:Vegetation gml:id="Ногинский район">' +
                    '<bsd:VegetationCode>71132100</bsd:VegetationCode>' +
                    '<gml:name>ДЕРЕВЬЯ (не имеющие значения ориентиров)</gml:name>' +
                    '<gml:Point srsName="urn:ogc:def:crs:EPSG:4326">' +
                    '<gml:pos srsDimension="3">55.7531215306  38.3349540667 -111111.0</gml:pos>' +
                    '</gml:Point>' +
                    '</bsd:Vegetation>' +
         '</wfs:Insert></wfs:Transaction>';

    var xInsert3 = '<?xml version="1.0" encoding="utf-8" ?><wfs:Transaction version="2.0.0" service="WFS" handle="Transaction 5" >' +







        '<wfs:Insert handle="Ins5">' +
'<bsd:Settlements gml:id="Ногинский район"><bsd:SettlementsCode>42100000</bsd:SettlementsCode>' +
'<gml:name>ПОСЕЛКИ СЕЛЬСКОГО ТИПА</gml:name><bsd:ObjName>Новое Воскресенское</bsd:ObjName>' +
'<bsd:ResidentOnScale>от 100 до 500</bsd:ResidentOnScale>' +
'<gml:Polygon srsName="urn:ogc:def:crs:EPSG:4326">' +
'<gml:exterior>' +
'<gml:LineString>' +
'<gml:posList srsDimension="2" count="40">' +
'55.9250805319 38.2798229202 55.9249018523 38.2799862044 55.9227494558 38.2805064719 55.9228468203 38.2817843559 55.9249992224 38.2812641577 55.9252855894 38.2841381788 55.9244792694 38.2844731386 55.9247684251 38.2878269996 55.9255756798 38.2876520620 55.9256738939 38.2890900131 55.9250462524 38.2892616329 55.9253351903 38.2926155811 55.9259629243 38.2924440125 55.9260648372 38.2945218187 55.9252565686 38.2945366633 55.9253676595 38.2982139827 55.9261758410 38.2981992161 55.9263893922 38.3041142879 55.9256710176 38.3041273216 55.9259022538 38.3132414967 55.9266207175 38.3132286299 55.9269799488 38.3132221182 55.9273337372 38.3122559841 55.9282318166 38.3122399160 55.9280975476 38.3044033176 55.9271994697 38.3044195669 55.9270987173 38.3025016332 55.9279069870 38.3024869533 55.9278950160 38.3004074080 55.9270868343 38.3004221296 55.9268850885 38.2965864629 55.9276025480 38.2964133252 55.9274016837 38.2927375908 55.9266841409 38.2929106408 55.9264914728 38.2906746437 55.9272090115 38.2905013971 55.9269180758 38.2868273835 55.9262005424 38.2870006966 55.9255305044 38.2799745447 55.9250805319 38.2798229202</gml:posList>' +
'</gml:LineString></gml:exterior></gml:Polygon></bsd:Settlements>' +
'</wfs:Insert></wfs:Transaction>';

    var xDelete = '<?xml version="1.0" encoding="utf-8" ?><wfs:Transaction version="2.0.0" service="WFS" handle="Transaction 3" >' +







    '<wfs:delete handle="delete4" typeName="bsd:Settlements">' +
    '<fes:Filter><fes:ResourceId rid="Ногинский район:8742"/></fes:Filter>' +
    '</wfs:delete>' +
    '</wfs:Transaction>';

    var xReplace = '<?xml version="1.0" encoding="utf-8" ?><wfs:Transaction version="2.0.0" service="WFS" handle="Transaction 2" >' +







    '<wfs:Replace handle="replace 01"><fes:Filter><fes:ResourceId rid="Ногинский район:209263" /></fes:Filter>' +
    '<bsd:Vegetation gml:id="id209263">' +
    '<bsd:VegetationCode>71100000</bsd:VegetationCode>' +
    '<gml:name>ДРЕВЕСНАЯ  РАСТИТЕЛЬНОСТЬ</gml:name>' +
    '<gml:Polygon srsName="urn:ogc:def:crs:EPSG:4326">' +
    '<gml:exterior><gml:LineString>' +
    '<gml:posList srsDimension="2" count="9">55.7509419844 38.1351148613 55.7494491867 38.1402435206 55.7491871219 38.1413639697 55.7509036941 38.1429183731 55.7512649677 38.1432288919 55.7522287416 38.1395449989 55.7524041563 38.1389041549 55.7524728304 38.1357177285 55.7509419844 38.1351148613</gml:posList>' +
    '</gml:LineString></gml:exterior></gml:Polygon></bsd:Vegetation>' +
    '</wfs:Replace></wfs:Transaction>';

    wfs.transaction(xDelete);
}

function loadFromUrl(options) {
    var __GET = window.location.search.substring(1).split("&");
    var get_params;
    for (var i = 0; i < __GET.length; i++) {
        var getVar = __GET[i].split("=");
        if (!get_params) {
            get_params = {};
        }
        get_params[getVar[0]] = typeof(getVar[1]) == "undefined" ? "" : getVar[1];
    }
    if (get_params) {
        var toDelete = [];
        if ('b' in get_params && 'l' in get_params) {
            // широта, долгота
            options.center[0] = get_params['b'];
            options.center[1] = get_params['l'];
            toDelete.push('center');
        }
        if ('z' in get_params) {
            // zoom
            options.tilematrix = get_params['z'];
            toDelete.push('z');
        }
        if ('layers' in get_params) {
            // отображение слоев
            var layers = get_params['layers'].split(',');
            for (i = 0; i < options.layers.length; i++) {
                if (layers.indexOf(options.layers[i]['id']) == -1) {
                    options.layers[i]['hidden'] = 1;
                }
                else {
                    options.layers[i]['hidden'] = 0;
                }
            }
            toDelete.push('layers');
        }
        if ('objid' in get_params) {
            var gmlid = decodeURIComponent(get_params['objid']),
                layerId = decodeURIComponent(get_params['ol']);
            if (gmlid.length > 0 && layerId && layerId.length > 0) {
                options.mapobject = { 'id': gmlid, layer_id: layerId };
            }
        }
        if ('rotate' in get_params) {
            // zoom
            options.rotate = parseFloat(get_params['rotate']);
            toDelete.push('rotate');
        }
        if ('incline' in get_params) {
            // zoom
            options.incline = parseFloat(get_params['incline']);
            toDelete.push('incline');
        }
        if ('models3d' in get_params) {
            // zoom
            if (options.objects3d) {
                var ids =  get_params['models3d'].split(",");
                var models3d = options.objects3d;
                for (j = 0; j < models3d.length; j++) {
                    var model3d = models3d[j];
                    if (ids.indexOf(model3d.id) !== -1) {
                        model3d.hidden = 0;
                    } else {
                        model3d.hidden = 1;
                    }
                }
            }
            toDelete.push('models3d');
        }
        if (toDelete.length > 0) {
            var cookieList = document.cookie.split("; ");
            for (var j = 0; j < cookieList.length; j++) {
                var cookies = cookieList[j].split("&");
                var key = cookies.shift();
                if (key == hex_md5(window.location.href) + "=id=" + options.id) {
                    for (i = 0; i < cookies.length; i++) {
                        var cookie = cookies[i].split("=");
                        if (toDelete.indexOf(cookie[0]) !== -1) {
                            cookies.splice(i, 1);
                            i--;
                        }
                    }
                    GWTK.Cookies.prototype.cookies('', cookies.join("&"), {expires: 5, path: '/'});
                }
            }
        }
    }
}
