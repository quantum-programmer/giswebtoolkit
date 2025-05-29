
var wmts;
var wfs;
var urls;

var settings_mapEditor = {
    "maplayersid": ["infrastruct", "noginsk","hidroline"],
    "functions": [],
         "editingdata" : [                                   // маска: редактируемые данные (объекты, семантики объектов), при отсутствии - редактируются все объекты слоя
            //{
            //    "layerid": "noginsk"                      // идентификатор редактируемого слоя
            //    , "objects": [                                // список объектов
            //        {
            //            "code": "45111000"                    // код объекта (использовать для серии объектов)
            //            , "semantics": ["SEM45", "SEM3"]           // список ключей семантик
            //        }
            //        //,{
            //        //    "code": "31120000"                    // код объекта (использовать для серии объектов)
            //        //    , "semantics": ["SEM9", "SEM5", "SEM4"]            // список ключей семантик
            //        //}
            //    ]
            //}
        ],

    //"editingdata": [],
    "selectlayersid": ["infrastruct", "noginsk", "hidroline"],
    "transaction": true
};

var settings_routeBPLA =
    {
        "routes": [
             {
                 "alias": "Пример работы с форматом kml"
               , "file": "http://62.173.139.13/files/Noginsk.kml"
               , "fn_showCenter": GWTK.maproutes.prototype.showCenter
               , "checkpoint": 1
               , "currmovi": 1
               , "videovisible": 1
               , "videospeed": 1
               , "movies": [{ "file": "http://62.173.139.13/files/BPLA.MP4", "timebegin": 109000 }]
             },
               {
                 "alias": "Пример работы с форматом csv"
               , "file": "http://62.173.139.13/files/BPLA.csv"
               , "fn_showCenter": GWTK.maproutes.prototype.showCenter
               , "fn_initpointscsv": GWTK.maproutes.prototype.initpointscsv
               , "fn_pointTooltip": GWTK.maproutes.prototype.pointTooltip
               , "checkpoint": 1
               , "currmovi": 1
               , "videovisible": 1
               , "videospeed": 1
               , "movies": [{ "file": "http://62.173.139.13/files/BPLA.MP4", "timebegin": 109000 }]
               }
        ]
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
            "nodes": [{ "id": "worldmap", "text": "Карта мира", "clickable": true, "img": "ico_panorama" },
                { "id": "osmMap", "text": "OpenStreetMap", "clickable": true, "img": "ico_osm" },
                { "id": "googleMap", "text": "Google", "clickable": true, "img": "ico_google" },
                { "id": "googleSat", "text": "Google спутник", "clickable": true, "img": "ico_google_sat" },
                { "id": "esriSat", "text": "ESRI спутник", "clickable": true, "img": "ico_esri" }]
        },
        {
            "id": "map", "text": "Карты", "img": "icon-folder", "expanded": true,
            "nodes": [{ "id": "infrastruct", "text": "Инфраструктура", "clickable": true, "img": "icon-page" },
                { "id": "noginsk", "text": "Ногинский район", "clickable": true, "img": "icon-page" },
                { "id": "noginsk3d", "text": "Ногинск", "clickable": true, "img": "icon-page" }
                //,{ "id": "vinnica", "text": "Винница", "clickable": true, "img": "icon-page" }
            ]
        }
    ];

    var options = {
        "url": "http://gisserver.info/GISWebServiceSE/service.php", "id": "55",
        "center": [55.843436, 38.436089], "tilematrix": 15, "crs": 3857,
        "tilematrixset": "GoogleMapsCompatible", "maxzoom": 22, "minzoom": 2,
        "mergewmslayers": false,
        "locale": "ru-ru", "shortlegend": 1,
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
                "url": "http://c.tile.openstreetmap.org/%z/%x/%y.png",
                "hidden": 1
            },
            {
                "id": "worldmap",
                "alias": "Карта мира",
                "selectObject": 0,
                "waterColors":[
                    "#a8c1c1",
                    "#81a1c1",
                    "#94afc8",
                    "#a6bad0",
                    "#b7c7d8",
                    "#6387ac",
                    "#6f93b8",
                    "#5b7b9b"
                ],
                "url": "SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=worldmap&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png",
            },
            {
                "id": "noginsk",
                "alias": "Ногинский район",
                "selectObject": 1,
                "url": "SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=0001&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt",
                "hidden": 0,
                "keyssearchbyname": ["ObjName"]
            },
            {
                "id": "googleSat",
                "alias": "Google спутник",
                "selectObject": 0,
                "url": "http://khm.google.com/kh/v=804&hl=ru&z=%z&x=%x&y=%y",
                "hidden": 1
            },
            {
                "id": "esriSat",
                "alias": "ESRI спутник",
                "selectObject": 0,
                "url": "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/%z/%y/%x",
                "hidden": 1
            },
            {
                "id": "noginsk3d",
                "alias": "Ногинск",
                "selectObject": 0,
                "url": "SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=noginsk3d&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt",
                "hidden": 1
            },
            {
                "id": "infrastruct",
                "alias": "Инфраструктура",
                "selectObject": 1,
                "url": "SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=guestmap&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt",
                "keyssearchbyname": ["NAME"],
                "legend": "*",
                "opacityValue": 100,
                "hidden": 0
            }

            //,{
            //    "id": "vinnica",
            //    "alias": "Винница",
            //    "selectObject": 1,
            //    "url": "http://81.30.161.169/GISWebServiceSE/service.php?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=Vinnitsa_Electrical_500&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt",
            //    "keyssearchbyname": ["NAME"],
            //    "legend": "*",
            //    "opacityValue": 100,
            //    "hidden": 0
            //}
        ],

        "controls": ['*'],

        "contenttree": maptree,

        "search_options": {
            "map": {
                "visible": 1   // 1/0
            },
            "address": {
                "visible": 1,  // 1/0
                "default": 0,  // индекс sources
                "sources": [   //  описание запросов адресного поиска
                    {
                        "alias": "Яндекс",
                        "url_addresssearch": ["https://geocode-maps.yandex.ru/1.x/?", { "result": 100 }],
                        "url_addressatcoord": ["https://geocode-maps.yandex.ru/1.x/?", { "result": 20 }]
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

        "navigatorcontrol": {
            "zoomStep": 3,
            "width": 250,
            "height": 160,
            "url": "http://gisserver.info/GISWebServiceSE/service.php?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=Worldmap&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png"
        },

        "routecontrol": { "url": "http://gisserver.info/GISWebServiceSE/service.php", "layer": "rusgraph" },

        "matrix": [
            {
                "id": "coverage1",
                "alias": "Матрица высот на мир",
                "url": "http://gisserver.info/GISWebServiceSE/service.php?LAYER=world&METHOD=GETCOVERAGETILE&tilematrixset=%tilematrixset&tilerow=%tilerow&tilecol=%tilecol&tilematrix=%scale&service=WCS&format=wcs"
            }
        ],

        "cluster":{
            json: "\\RUS-MobileSpeedcams_Garmin.json",        // "clusterifyFname": //"Chicago_crime_spots.json"	"NYPD_Motor_Vehicle_Collisions.json"	"busstops.json"
            url: "http://gisserver.info/geojson/GeoJSON.php"
        },

        //"hm_options": hm_options

        "objects3d": [
            {
                "id": "infrastruct",
                "obj": [
                    {
                        "code": "53632101",
                        "local": 2,
                        "objectkey": "bank",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612102",
                        "local": 2,
                        "objectkey": "pharmacy",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53623000",
                        "local": 2,
                        "objectkey": "shop",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "62213102",
                        "local": 2,
                        "objectkey": "bus_station",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "51133200",
                        "local": 2,
                        "objectkey": "parking",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    }
                ],
                "options":{
                    "minzoom": 15
                }

            },
            {
                "id": "noginsk3d",
                "obj": [
                    {
                        "code": "44100000",
                        "local": 1,
                        "objectkey": "garage",
                        "semlist": ["B_LEVEL"],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 3,
                            "keySem": "B_LEVEL",
                            "heightSem": 2
                        }
                    },
                    {
                        "code": "71111111",
                        "local": 1,
                        "objectkey": "forest",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44100000",
                        "local": 1,
                        "objectkey": "b_house",
                        "semlist": ["B_LEVEL"],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 6,
                            "keySem": "B_LEVEL",
                            "heightSem": 3
                        }
                    },
                    {
                        "code": "44100000",
                        "local": 1,
                        "objectkey": "b_residential",
                        "semlist": ["B_LEVEL"],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 6,
                            "keySem": "B_LEVEL",
                            "heightSem": 3
                        }
                    },

                    {
                        "code": "44100000",
                        "local": 1,
                        "objectkey": "store",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 6,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44100000",
                        "local": 1,
                        "objectkey": "detached",
                        "semlist": ["B_LEVEL"],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 6,
                            "keySem": "B_LEVEL",
                            "heightSem": 3
                        }
                    },
                    {
                        "code": "44100000",
                        "local": 1,
                        "objectkey": "S004410000019",
                        "semlist": ["B_LEVEL"],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 6,
                            "keySem": "B_LEVEL",
                            "heightSem": 3
                        }
                    },
                    {
                        "code": "44100000",
                        "local": 1,
                        "objectkey": "S004410000020",
                        "semlist": ["B_LEVEL"],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 6,
                            "keySem": "B_LEVEL",
                            "heightSem": 3
                        }
                    },
                    {
                        "code": "44100000",
                        "local": 1,
                        "objectkey": "industrial",
                        "semlist": ["B_LEVEL"],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 6,
                            "keySem": "B_LEVEL",
                            "heightSem": 3
                        }
                    },
                    {
                        "code": "44100000",
                        "local": 1,
                        "objectkey": "apartments",
                        "semlist": ["B_LEVEL"],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 6,
                            "keySem": "B_LEVEL",
                            "heightSem": 3
                        }
                    },
                    {
                        "code": "44100000",
                        "local": 1,
                        "objectkey": "yes",
                        "semlist": ["B_LEVEL"],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#CCCCCC",
                        "opacity": 0.99,
                        "height": {
                            "heightDef": 6,
                            "keySem": "B_LEVEL",
                            "heightSem": 3
                        }
                    },
                    {
                        "code": "44100000",
                        "local": 1,
                        "objectkey": "S004410000018",
                        "semlist": ["B_LEVEL"],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#CCCCCC",
                        "opacity": 0.99,
                        "height": {
                            "heightDef": 6,
                            "keySem": "B_LEVEL",
                            "heightSem": 3
                        }
                    },
                    {
                        "code": "44100000",
                        "local": 1,
                        "objectkey": "constraction",
                        "semlist": ["B_LEVEL"],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#CCCCCC",
                        "opacity": 0.99,
                        "height": {
                            "heightDef": 6,
                            "keySem": "B_LEVEL",
                            "heightSem": 3
                        }
                    },
                    {
                        "code": "44100000",
                        "local": 1,
                        "objectkey": "church",
                        "semlist": ["B_LEVEL"],
                        "viewtype": 4,
                        "cut": 0,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 12,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "41100004",
                        "local": 3,
                        "objectkey": "T0041100004",
                        "semlist": [],
                        "viewtype": 3,
                        "cut": 0,
                        "color": "#000000",
                        "opacity": 0.99,
                        "height": {
                            "heightDef": 100,
                            "keySem": "",
                            "heightSem": 1
                        }
                    }
                ],
                "options":{
                    "minzoom": 15
                }
            }
            ,
            {
                "id": "tomsk3dSQL",
                "alias": "3D тайлы для Томска",
                "url": "http://gisserver.info/GISWebServiceSE/service.php",
                "hidden": 1,
                "idLayer": "tomsk",
                "zoomLevels": {
                    0: 0,
                    1: 1,
                    2: 2,
                    3: 3,
                    4: 4,
                    5: 5,
                    6: 6,
                    7: 7,
                    8: 8,
                    9: 9,
                    10: 10,
                    11: 11,
                    12: 12,
                    13: 13,
                    14: 14,
                    15: 15,
                    16: 16,
                    17: 17,
                    18: 18,
                    19: 19,
                    20: 20,
                    21: 21,
                    22: 22,
                    23: 23
                }
            }
        ]

    };

   // loadFromUrl(options);

    var jsonObjects =
        {
         "type": "FeatureCollection",
        "bbox": [
        38.415584564202206,    55.864222564610614,
        38.44983100890435,    55.87049547186022
                ],
        "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [ 38.43266487120902,   55.86846080071999 ]
            },
            "properties": {
                "id": "4",
                "schema": null,
                "code": "Point",
                "key": "Point",
                "name": "Маркер_P00000300304",
                "objecttype": "P0000030030"
            },
            "bbox": [
                37.56877899,         55.62159907,
                37.56877899,         55.62159907
            ]
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [ [ 38.43266487120902,   55.86846080071999],
                        [38.43266487120902,   55.864222564610614],
                        [ 38.44983100890435,  55.864222564610614],
                        [ 38.44983100890435,  55.86846080071999],
                        [ 38.43266487120902, 55.86846080071999] ]  ]
            },
            "properties": {
                "id": "e9062982-c140-bdc2-3a9c-8837b8fbb06f.1536124498975",
                "schema": null,
                "code": "Polygon",
                "key": "Polygon",
                "name": "Полигон",
                "stroke-width": "2",
                "stroke-opacity": "0.75",
                "stroke": "#7F7FFF",
                "stroke-dasharray": "000",
                "fill-opacity": "0.3",
                "fill": "#7F7FFF"
            },
            "style": {
                "stroke": "#7F7FFF",
                "stroke-width": "2",
                "stroke-opacity": "0.75",
                "fill": "#7F7FFF",
                "fill-opacity": "0.3",
                "stroke-dasharray": "none"
            }
        }
        ],
        style:{
                 "P0000030030": {  // код объекта, например “P0000030030”
                     "name": "Завод переработки твердых отходов",  // наименование объекта
                     "marker": {                         // описание точечного знака
                         "width": "32px",
                         "height": "32px",
                         "image": "<svg width='50px' height='50px' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink= 'http://www.w3.org/1999/xlink'><image xlink:href='http://192.168.1.26/files/images/evn001.svg' x='0' y='0' height='50px' width='50px'/></svg>",  // Изображение точечного знака
                         "centerX": "16",
                         "centerY": "16"
                     }
                 },
                 "P0000030021": {  // код объекта, например ,  например "P0000030021"{
                     "name": " Завод переработки пищевых отходов",
                     "marker": {
                         "width": "32px",
                         "height": "32px",
                         "image": "<svg width='50px' height='50px' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink= 'http://www.w3.org/1999/xlink'><image xlink:href='http://192.168.1.26/files/images/evn002.svg' x='0' y='0' height='50px' width='50px'/></svg>",
                         "centerX": "16",
                         "centerY": "16"
                     }
                 }

            }
    };


    var layer,
        test = true;
    if (window.GWTK) {
        if (!test) {
            theMap = new GWTK.Map("dvMap", options);
        }
        else {
            try { // statements to try
                var mapparam = GWTK.MapParameters,
                    layerparam =  GWTK.LayerParameters;
                //mapparam.center = [ 55.868460800719994, 38.43266487120902];
                mapparam.center = [ 54.868460800719994, 71.00266487120902];
                mapparam.maxzoom = 20;
                layerparam.id = "googleMap";
                layerparam.alias = "Google";
                layerparam.url = "http://mt1.google.com/vt/lyrs=m@250000000&hl=ru&src=app&x=%x&y=%y&z=%z&s=Galileo";
                //mapparam.layers.push(layerparam);
                mapparam.contenttree = [
                            {"id": "fon", "text": "Фоновые слои", "img": "icon-folder", "expanded": true, "group": true},
                            {"id": "map", "text": "Карты", "img": "icon-folder", "expanded": true, "group": true},
                            {"id": "local", "text": "Локальные слои", "img": "icon-folder", "expanded": true, "group": true}
                            ];
                //mapparam.controls = ['content'];
                //mapparam.controls = [];
                mapparam.url = "http://192.168.1.26/GISWebServiceSE/service.php";
                // mapparam.navigatorcontrol = {
                //     "zoomStep": 3,
                //         "width": 250,
                //         "height": 160,
                //         "url": "http://gisserver.info/GISWebServiceSE/service.php?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=Worldmap&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png"
                // };
                mapparam.routecontrol =  { "url": "http://gisserver.info/GISWebServiceSE/service.php", "layer": "rusgraph" };
                //mapparam.extauth = true;

                mapparam.search_options = {
                    "map": {
                        "visible": 1   // 1/0
                    },
                    "address": {
                        "visible": 1,  // 1/0
                            "default": 0,  // индекс sources
                            "sources": [   //  описание запросов адресного поиска
                            {
                                "alias": "Яндекс",
                                "url_addresssearch": ["https://geocode-maps.yandex.ru/1.x/?", { "result": 100 }],
                                "url_addressatcoord": ["https://geocode-maps.yandex.ru/1.x/?", { "result": 20 }]
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
                };

                theMap = GWTK.mapCreateMap(document.getElementById("dvMap"),
                    {
                        "options": mapparam,
                        "callback": function (map) {
                            console.log(map);
                        }
                    }
                );

                // Добавим Google карту
                layer = GWTK.mapAddLayer(theMap,
                    {
                        layer: {
                            "id": "googleMap",
                            "alias": "Google",
                            "selectObject": 0,
                            "showsettings": 1,
                            "opacityValue": 100,
                            "url": "http://mt1.google.com/vt/lyrs=m@250000000&hl=ru&src=app&x=%x&y=%y&z=%z&s=Galileo"
                        }
                    }
                );

                var layers = GWTK.mapGetLayerById(theMap, "googleMap");
                console.log('GWTK.mapGetLayerById = ', layers);
                if (layers && layers.length > 0) {
                    GWTK.mapAddLayerToTree(theMap, layers[0], param = {
                        tree: {
                            "parentId": "fon", //идентификатор родительского узла дерева,
                            "node": {
                                "clickable": true,     //  признак включения видимости узла
                                "img": "ico_google", // иконка узла
                                "remove": true
                            }
                        }
                    });
                }

                // Добавим карту мира
                layer = GWTK.mapAddLayer(theMap,
                    {
                        layer: {
                                "id": "worldmap",
                                "alias": "Карта мира",
                                "selectObject": 0,
                                "showsettings": 1,
                                "opacityValue": 100,
                                "url": "http://gisserver.info/GISWebServiceSE/service.php?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=worldmap&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png"
                            }
                    }
                );
                // Добавим в дерево
                if (layer) {
                    GWTK.mapAddLayerToTree(theMap, layer, {"tree": {
                            "parentId" : "fon", //идентификатор родительского узла дерева,
                            "node": {
                                "clickable": true,     //  признак включения видимости узла
                                "img": "ico_panorama", // иконка узла
                                "remove" : true
                            }
                        }});
                }

                // // добавим Матрицу
                // layer = GWTK.mapAddLayer(theMap,
                //     {
                //         layer: {
                //             "id": "noginskMTR",
                //             "alias": "Ногинский район (матрица высот)",
                //             //"selectObject": 1,
                //             // "url": "SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=0001&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt",
                //             "url": "http://192.168.1.26/GISWebServiceSE/service.php?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=0003&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt",                            "hidden": 0,
                //             "legend":{
                //                 "legend":"*"
                //             },
                //             "keyssearchbyname": ["ObjName"],
                //             "showsettings": 1
                //             //, "opacityValue": 100,
                //             //"bbox" : [55.864222564610614, 38.105584564202206, 55.87049547186022, 38.44983100890435]
                //
                //         }
                //     }
                // );
                // // Добавим в дерево
                // if (layer) {
                //     GWTK.mapAddLayerToTree(theMap, layer, {"tree": {
                //             "parentId" : "fon", //идентификатор родительского узла дерева,
                //             "node": {
                //                 "clickable": true,     //  признак включения видимости узла
                //                 "img": "icon-page",  // иконка узла
                //                 "remove" : true
                //             }
                //         }});
                // }

                // добавим Ногинск
                layer = GWTK.mapAddLayer(theMap,
                    {
                        layer: {
                            "id": "noginsk",
                            "alias": "Ногинский район",
                            "selectObject": 1,
                            "url": "http://gisserver.info/GISWebServiceSE/service.php?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=0001&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt",                            "hidden": 0,
                            "legend":{
                                "legend":"*"
                            },
                            "keyssearchbyname": ["ObjName"],
                            "showsettings": 1
                           // ,"opacityValue": 100,
                            //"bbox" : [55.864222564610614, 38.105584564202206, 55.87049547186022, 38.44983100890435]
                            }
                    }
                    );
                // Добавим в дерево
                if (layer) {
                    GWTK.mapAddLayerToTree(theMap, layer, {"tree": {
                            "parentId" : "map", //идентификатор родительского узла дерева,
                            "node": {
                                "clickable": true,     //  признак включения видимости узла
                                "img": "icon-page" // иконка узла
                            }
                        }});
                }

                // добавим Инфраструктуру
                layer = GWTK.mapAddLayer(theMap,
                    {
                        layer:
                            {
                                "id": "infrastruct",
                                "alias": "Инфраструктура",
                                "selectObject": 1,
                                "url": "http://gisserver.info/GISWebServiceSE/service.php?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=guestmap&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt",
                                "keyssearchbyname": ["NAME"],
                                "showsettings": 1,
                               // "opacityValue": 100,
                                "hidden": 0,
                                "legend":{
                                    "legend":"*",
                                    "shortlegend": 1
                                }
                            }
                    }
                );
                // Добавим в дерево
                if (layer) {
                    GWTK.mapAddLayerToTree(theMap, layer, {"tree": {
                            "parentId" : "map", //идентификатор родительского узла дерева,
                            "node": {
                                "clickable": true, // признак включения видимости узла
                                "img": "icon-page", // иконка узла
                                "remove" : true,
                                "save": true
                            }
                        }});
                }


                // добавим Пользовательский слой
                layer = GWTK.mapAddLayer(theMap,
                    {
                        layer: {
                            "id": "vector",
                            "alias": "Вектор",
                            "selectObject": 1,
                            "url": "http://192.168.1.26/files/jsons/test.json",
                            //"url": "files/jsons/test.json",
                            "hidden": 0,
                            "showsettings": 1,
                           // "opacityValue": 100,
                            "legend":{
                                "legend":"*",
                                "shortlegend": 1
                            },
                            "type": "svg",
                            //"jsondata" : {json: jsonObjects, style:jsonObjects.style},
                            "updateparameters": {
                                // "bbox":1,
                                // "updatetime" : 3000,
                                // "fn_url": function(bbox) { return "http://192.168.1.26/files/jsons/test.json"; },
                            }
                        }
                    }
                );

                // Добавим в дерево
                if (layer) {
                    GWTK.mapAddLayerToTree(theMap, layer, {"tree": {
                            "parentId" : "local", //идентификатор родительского узла дерева,
                            "node": {
                                "clickable": true,     //  признак включения видимости узла
                                "img": "icon-page", // иконка узла
                                "remove" : true,
                                "save": true
                            }
                        }});
                }

                // добавим Пользовательский слой маркеров
                 layer = GWTK.mapAddLayer(theMap,
                        {
                        layer: {
                            "id": "military_2gis",
                            "alias": "military_2gis",
                            "selectObject": 1,
                            "url": "http://192.168.1.26/files/jsons/military_2gis.json",
                            //"url": "files/jsons/test.json",
                            "hidden": 0,
                            "showsettings": 1,
                            // "opacityValue": 100,
                            "legend":{
                                "legend":"*",
                                "shortlegend": 1
                            },
                            "type": "geomarkers",
                            //"merge": 1,
                            "cluster" : {
                                "cellsize": 40,
                                "markerevents": { "mouseenter": true, "mouseleave": true }
                                ,"markerhint": {
                                    "keys" :
                                        //{"Таблица": "Таблица", "objecttype": "Тип объекта", "Координата X": "X", "Координата Y": "Y", "id": "Идентификатор" },
                                        {"info": "" },
                                    "propertiesname": '_clusterhint'
                                }
                            }

                            //"jsondata" : {json: jsonObjects, style:jsonObjects.style},
                            // "updateparameters": {
                            //     // "bbox":1,
                            //     // "updatetime" : 3000,
                            //     // "fn_url": function(bbox) { return "http://192.168.1.26/files/jsons/v_motion_today.json"; },
                            // },
                        }
                    }
                );

                // Добавим в дерево
                if (layer) {
                    GWTK.mapAddLayerToTree(theMap, layer, {"tree": {
                            "parentId" : "local", //идентификатор родительского узла дерева,
                            "node": {
                                "clickable": true,     //  признак включения видимости узла
                                "img": "icon-page", // иконка узла
                                "remove" : true,
                                "save": true
                            }
                        }});
                }


                // // добавим Пользовательский слой маркеров
                // GWTK.mapAddLayer(theMap,
                //     {
                //         layer: {
                //             "id": "cNYPD_Motor_Vehicle_Collisions_142449",
                //             "alias": "NYPD_Motor_Vehicle_Collisions_142449",
                //             "selectObject": 1,
                //             "url": "http://192.168.1.26/files/jsons/NYPD_Motor_Vehicle_Collisions_142449.json",// pointsF.json",
                //             //"url": "files/jsons/test.json",
                //             "hidden": 0,
                //             "showsettings": 1,
                //             // "opacityValue": 100,
                //             "legend":{
                //                 "legend":"*",
                //                 "shortlegend": 1
                //             },
                //             "type": "geomarkers",
                //             //"merge": 1,
                //             "cluster" : {
                //                 "cellsize": 40,
                //                 "markerevents": { "mouseenter": true, "mouseleave": true },
                //                 // "markerhint": {
                //                 //     "keys" :
                //                 //         {"Таблица": "Таблица", "objecttype": "Тип объекта", "Координата X": "X", "Координата Y": "Y", "id": "Идентификатор" },
                //                 //     "propertiesname": '_clusterhint'
                //                 // }
                //             },
                //
                //             //"jsondata" : {json: jsonObjects, style:jsonObjects.style},
                //             "updateparameters": {
                //                 // "bbox":1,
                //                 // "updatetime" : 3000,
                //                 // "fn_url": function(bbox) { return "http://192.168.1.26/files/jsons/v_motion_today.json"; },
                //             },
                //         },
                //         "tree": {
                //             "parentId" : "local", //идентификатор родительского узла дерева,
                //             "node": {
                //                 "clickable": true,     //  признак включения видимости узла
                //                 "img": "icon-page", // иконка узла
                //                 "remove" : true,
                //                 "save": true
                //             }
                //         }
                //     }
                // );

                // // добавим Пользовательский слой маркеров
                // GWTK.mapAddLayer(theMap,
                //     {
                //         layer: {
                //             "id": "pointsF_514600",
                //             "alias": "pointsF_514600",
                //             "selectObject": 1,
                //             "url": "http://192.168.1.26/files/jsons/pointsF_514600.json",// pointsF.json",
                //             //"url": "files/jsons/test.json",
                //             "hidden": 0,
                //             "showsettings": 1,
                //             // "opacityValue": 100,
                //             "legend":{
                //                 "legend":"*",
                //                 "shortlegend": 1
                //             },
                //             "type": "geomarkers",
                //             //"merge": 1,
                //             "cluster" : {
                //                 "cellsize": 40,
                //                 "markerevents": { "mouseenter": true, "mouseleave": true },
                //                 // "markerhint": {
                //                 //     "keys" :
                //                 //         {"Таблица": "Таблица", "objecttype": "Тип объекта", "Координата X": "X", "Координата Y": "Y", "id": "Идентификатор" },
                //                 //     "propertiesname": '_clusterhint'
                //                 // }
                //             },
                //
                //             //"jsondata" : {json: jsonObjects, style:jsonObjects.style},
                //             "updateparameters": {
                //                 // "bbox":1,
                //                 // "updatetime" : 3000,
                //                 // "fn_url": function(bbox) { return "http://192.168.1.26/files/jsons/v_motion_today.json"; },
                //             },
                //         },
                //         "tree": {
                //             "parentId" : "local", //идентификатор родительского узла дерева,
                //             "node": {
                //                 "clickable": true,     //  признак включения видимости узла
                //                 "img": "icon-page", // иконка узла
                //                 "remove" : true,
                //                 "save": true
                //             }
                //         }
                //     }
                // );

                // // добавим Пользовательский слой маркеров
                // GWTK.mapAddLayer(theMap,
                //     {
                //         layer: {
                //             "id": "cluster_test_Chicago_crime_spots",
                //             "alias": "cluster_test_Chicago_crime_spots",
                //             "selectObject": 1,
                //             "url": "http://192.168.1.26/files/jsons/Chicago_crime_spots.json",// pointsF.json",
                //             //"url": "files/jsons/test.json",
                //             "hidden": 0,
                //             "showsettings": 1,
                //             // "opacityValue": 100,
                //             "legend":{
                //                 "legend":"*",
                //                 "shortlegend": 1
                //             },
                //             "type": "geomarkers",
                //             //"merge": 1,
                //             "cluster" : {
                //                 "cellsize": 40,
                //                 "markerevents": { "mouseenter": true, "mouseleave": true },
                //                 // "markerhint": {
                //                 //     "keys" :
                //                 //         {"Таблица": "Таблица", "objecttype": "Тип объекта", "Координата X": "X", "Координата Y": "Y", "id": "Идентификатор" },
                //                 //     "propertiesname": '_clusterhint'
                //                 // }
                //             },
                //
                //             //"jsondata" : {json: jsonObjects, style:jsonObjects.style},
                //             "updateparameters": {
                //                 // "bbox":1,
                //                 // "updatetime" : 3000,
                //                 // "fn_url": function(bbox) { return "http://192.168.1.26/files/jsons/v_motion_today.json"; },
                //             },
                //         },
                //         "tree": {
                //             "parentId" : "local", //идентификатор родительского узла дерева,
                //             "node": {
                //                 "clickable": true,     //  признак включения видимости узла
                //                 "img": "icon-page", // иконка узла
                //                 "remove" : true,
                //                 "save": true
                //             }
                //         }
                //     }
                // );


                // // добавим Пользовательский слой маркеров
                // GWTK.mapAddLayer(theMap,
                //     {
                //         layer: {
                //             "id": "cluster2",
                //             "alias": "Кластер2",
                //             "selectObject": 1,
                //             "url": "http://192.168.1.26/files/jsons/v_motion_today1.json",
                //             //"url": "files/jsons/test.json",
                //             "hidden": 0,
                //             "showsettings": 1,
                //             // "opacityValue": 100,
                //             "legend":{
                //                 "legend":"*",
                //                 "shortlegend": 1
                //             },
                //             "type": "geomarkers",
                //             //"merge": 1,
                //             "cluster" : {
                //                 "cellsize": 40,
                //                 "markerevents": { "mouseenter": true, "mouseleave": true },
                //                 "markerhint": {
                //                     "keys" :
                //                         {"Таблица": "Таблица", "objecttype": "Тип объекта", "Координата X": "X", "Координата Y": "Y", "id": "Идентификатор" },
                //                     "propertiesname": '_clusterhint'
                //                 }
                //             },
                //
                //             //"jsondata" : {json: jsonObjects, style:jsonObjects.style},
                //             "updateparameters": {
                //                 //"bbox":1,
                //                 // "updatetime" : 3000,
                //                 //"fn_url": function(bbox) { return "http://192.168.1.26/files/jsons/v_motion_today1.json"; },
                //             },
                //         },
                //         "tree": {
                //             "parentId" : "local", //идентификатор родительского узла дерева,
                //             "node": {
                //                 "clickable": true,     //  признак включения видимости узла
                //                 "img": "icon-page", // иконка узла
                //                 "remove" : true,
                //                 "save": true
                //             }
                //         }
                //     }
                // );


                // Запрос слоев
                var layers = GWTK.mapGetLayerById(theMap, ["googleMap", "noginsk", "vector", "infrastruct", "worldmap" ]);
                console.log('GWTK.mapGetLayerById = ', layers);

                // // Скрыть слои
                // setTimeout(function() {
                //    // GWTK.mapHideLayer(theMap, layers);
                //     GWTK.mapHideLayerById(theMap, ["googleMap", "noginsk", "vector", "infrastruct" ]);
                //     }, 3000);
                //
                // // Показать слои
                // setTimeout(function() {
                //    // GWTK.mapShowLayer(theMap, layers);
                //     GWTK.mapShowLayerById(theMap, ["googleMap", "noginsk", "vector", "infrastruct" ]);
                //     }, 7000);


                //GWTK.mapRemoveLayer(theMap, param={layers:layers});
                //GWTK.mapRemoveLayer(theMap, param={layers:layers[0]});

                // theMap.options.search_options = {
                //     "map": {
                //         "visible": 1   // 1/0
                //     },
                //     "address": {
                //         "visible": 1,  // 1/0
                //         "default": 0,  // индекс sources
                //         "sources": [   //  описание запросов адресного поиска
                //             {
                //                 "alias": "Яндекс",
                //                 "url_addresssearch": ["https://geocode-maps.yandex.ru/1.x/?", { "result": 100 }],
                //                 "url_addressatcoord": ["https://geocode-maps.yandex.ru/1.x/?", { "result": 20 }]
                //             },
                //             {
                //                 "alias": "Адресная база",
                //                 "url_addresssearch": ["http://192.168.1.210/address/ms_address.php?",
                //                     {
                //                         "result": 120,
                //                         "fn_setrequest": "GWTK.AddressGeocoding.setrequestPanorama",
                //                         "fn_getresponse": "GWTK.AddressGeocoding.getresponsePanorama"
                //                     }],
                //                 "url_addressatcoord": ["http://192.168.1.210/address/ms_reverse.php?",
                //                     {
                //                         "result": 1,
                //                         "fn_setrequest": "GWTK.AddressGeocoding.setrequestPanoramaAtCoord",
                //                         "fn_getresponse": "GWTK.AddressGeocoding.getresponsePanorama"
                //                     }]
                //             },
                //             {
                //                 "alias": "Карта OSM",
                //                 "url_addresssearch": ["https://nominatim.openstreetmap.org/search?format=json",
                //                     {
                //                         "result": 100,
                //                         "fn_setrequest": "GWTK.AddressGeocoding.setrequestOsm",
                //                         "fn_getresponse": "GWTK.AddressGeocoding.getresponseOsm"
                //                     }],
                //
                //                 "url_addressatcoord": ["https://nominatim.openstreetmap.org/search?format=json",
                //                     {
                //                         "result": 10,
                //                         "fn_setrequest": "GWTK.AddressGeocoding.setrequestOSMAtCoord",
                //                         "fn_getresponse": "GWTK.AddressGeocoding.getresponseOsm"
                //                     }]
                //             }
                //         ]
                //     },
                //     "rosreestr": {
                //         "visible": 1   // 1/0
                //     },
                //     "default": "address"
                // };



               // Обновить инструменты
                GWTK.mapSynchronizeData(theMap);

                // // Не показывать панель со списком объектов
                // GWTK.mapSetModeObjectList(theMap, 'hide');
                // var feature = GWTK.mapCreateSelectedFeatures(theMap, {});
                // if (feature){
                //     feature.addJsonObjects(jsonObjects, GWTK.mapGetLayerById(theMap, "vector"));
                //     // Не показывать панель со списком объектов
                //     //GWTK.mapSetSelectedObjects(theMap, feature);
                //     //GWTK.mapSetModeObjectList(theMap, 'show');
                // }

                //theMap._readCookie();

                // Спозиционируем
                GWTK.mapSetView(theMap, {"center": [55.843436, 38.436089], "zoom": 15});


            }
            catch
                (e) {
                    console.log(e); // pass exception object to error handler -> your own
            }
        }
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
