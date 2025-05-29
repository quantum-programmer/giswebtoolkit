
var wmts;
var wfs;
var urls;

var settings_mapEditor = {
    "maplayersid": ["infrastruct", "noginsk", 'tracks'],
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
    "selectlayersid": ["infrastruct", "noginsk", 'tracks'],
    "transaction": true,
    "oldversion": 0,  // 1 - старая версия редактора, 0 или отсутствие - новая версия
    // "graphic": 0   // 1 - работать с графическими объектами карты, 0 - только объеты из классификатора
     "modelite" : 0   // 1 - облегченная версия
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
                      { "id": "googleSat", "text": "GСпутник", "clickable": true, "img": "ico_google_sat" },
                      { "id": "esriSat", "text": "Cпутник", "clickable": true, "img": "ico_esri" }]
        },
        {
            "id": "map", "text": "Карты", "img": "icon-folder", "expanded": true,
            "nodes": [{ "id": "infrastruct", "text": "Карта гостя <a href ='http://3d.gisserver.ru' target='_blank'>Просмотр 3D</a>", "clickable": true, "img": "icon-page" },
                      { "id": "noginsk", "text": "Богородский городской округ", "clickable": true, "img": "icon-page" },
                      { "id": "tracks", "text": "Треки", "clickable": true, "img": "icon-page" }
                // ,{ "id": "vita", "text": "План Зонирования", "clickable": true, "img": "icon-page" }
            ]
        }
    ];

    var options = {
        "url": "http://gisserver.info/GISWebServiceSE/service.php", "id": "1",
        "center": [55.843436, 38.436089],
        "tilematrix": 14,
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
                            "#5b7b9b",
                            1
                        ],
                        "tilematrixset":"EPSG:3857",
                        //"linkedUrls" :["http://gisserver.info/GISWebServiceSE/service.php?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=worldmap&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png&ss="],
                        "url": "SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=worldmap&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png",
                        "hidden": 1
                    },
                    {
                        "id": "googleSat",
                        "alias": "Google спутник",
                        "selectObject": 0,
                        "url": "http://khm.google.com/kh/v=865&hl=ru&z=%z&x=%x&y=%y",
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
                        "id": "noginsk", "areapixel": 20,
                        "alias": "Богородский городской округ",
                        "selectObject": 1, //"authtype":"pam",
                        "export": ['json'], //http://localhost/giswebservicese/service.php?
                        "url": "SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=noginsk_area&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs",
                        "version":"13.3.0",
                        "hidden": 1,
                        "legend":"*",
                        "bbox": [55.55155345,37.82867432,56.27,39.00009],
                        "keyssearchbyname": ["Name"]
                    },
                    {
                        "id": "tracks",
                        "alias": "Треки",
                        "selectObject": 1,
                        "export": ['sxf','gml','json'],
                        "url": "SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=HOST#gisserver.ru#2047#ALIAS#tracks&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt",
                        "version":"13.3.0",

                        "keyssearchbyname": ["NAME"],
                        "legend":"*", //"authtype":"pam",
                        "legend1": 'poi',
                        "opacityValue": 100,

                        "hidden": 0
                    },
                    {
                        "id": "infrastruct",
                        "alias": "Карта гостя",
                        "selectObject": 1,
                        "export": ['gml','json'],
                        "url": "SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=guestmap&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs",    //&codelist=53612000,53612101,53624001,53624002,53632101,62213102,53612102,53624003,53661007
                        "version":"13.3.0",
                        "keyssearchbyname": ["NAME"],
                        "legend":"*", //"authtype":"pam",
                        "legend1": 'poi',
                        "opacityValue": 100,
                        "schemename":"guestmap.xsd",
                        "semanticfilter": ["name", "ObjState", "SEM71"],
                        "hidden": 1
                    }


        ],

        "controls": ["objectPanel", "mapscale", "mapcoordinates", "scaleupdown", "search", "searchSem",
            "areasearch", "selectobjects", "clearselect", "map3d", "mapeditor", "localmapcontrol", "map2img",
            "thematicmapcontrol", "viewentirelayer", "content", "transitiontopoint", "ruler", "viewoptions", "exportLayer"
        ],

          // "controlspanel": "flex-left",
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
                       "alias": "Матрица высот на Ногинск",
                       "url": "http://gisserver.info/GISWebServiceSE/service.php?LAYER=noginskMatrix&METHOD=GETCOVERAGETILE&tilematrixset=%tilematrixset&tilerow=%tilerow&tilecol=%tilecol&tilematrix=%scale&service=WCS&format=wcs"
                   }
        ],

        // "sectionsURL": "http://gisserver.info/geojson/GeoJSON.php",
        // "sectionsFname": "Sections.json",
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

                    //растительность
                    {
                        "code": "71111110",
                        "local": 1,
                        "objectkey": "368-000-S",
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
                        "code": "71123000",
                        "local": 1,
                        "objectkey": "409-000-S",
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
                        "code": "71126000",
                        "local": 2,
                        "objectkey": "p_park",
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
                        "code": "71325000",
                        "local": 1,
                        "objectkey": "416-000-S",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    }
                    ,
                    //строения
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_house_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_garage_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_school_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_detached_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    // {
                    //     "code": "44200000",
                    //     "local": 1,
                    //     "objectkey": "a_roof_b",
                    //     "semlist": [],
                    //     "viewtype": 4,
                    //     "cut": 0,
                    //     "height": {
                    //         "heightDef": 15,
                    //         "keySem": "",
                    //         "heightSem": 1
                    //     }
                    // },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_warehouse_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_church_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_residential_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_train-station_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_shop_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_constraction_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_kindergarten_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_apartments_b",
                        "semlist": ["building_e_levels"],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 3,
                            "keySem": "building_e_levels",
                            "heightSem": 10
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_commercial_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_hangar_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_industrial_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_public_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_office_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_yes_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_barracks_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_cathedral_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_civic_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_dormitory_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_hospital_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_hotel_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_hut_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_retail_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_shed_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_supermarket_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_terrace_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_transportation_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_university_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_heat_station_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_service_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_barrack_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "a_garages_b",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "44200000",
                        "local": 1,
                        "objectkey": "013-001-S",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 0,
                        "height": {
                            "heightDef": 15,
                            "keySem": "",
                            "heightSem": 1
                        }
                    }
                    ,
                    //знаки
                    {
                        "code": "10715",
                        "local": 2,
                        "objectkey": "p_car_wash",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "2000727",
                        "local": 2,
                        "objectkey": "p_taxi",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "47140000",
                        "local": 2,
                        "objectkey": "p_information",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
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
                        "objectkey": "p_pharmacy",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612103",
                        "local": 2,
                        "objectkey": "p_clinic",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612104",
                        "local": 2,
                        "objectkey": "p_dentist",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612105",
                        "local": 2,
                        "objectkey": "p_doctors",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612107",
                        "local": 2,
                        "objectkey": "p_veterinary",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612201",
                        "local": 2,
                        "objectkey": "p_school",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612202",
                        "local": 2,
                        "objectkey": "p_kindergarten",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612203",
                        "local": 2,
                        "objectkey": "p_college",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612204",
                        "local": 2,
                        "objectkey": "p_university",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612205",
                        "local": 2,
                        "objectkey": "p_driving_school",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612301",
                        "local": 2,
                        "objectkey": "p_theatre",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612302",
                        "local": 2,
                        "objectkey": "p_library",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612303",
                        "local": 2,
                        "objectkey": "p_museum",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612304",
                        "local": 2,
                        "objectkey": "p_arts_centre",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612401",
                        "local": 2,
                        "objectkey": "p_police",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53612402",
                        "local": 2,
                        "objectkey": "p_fire_station",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53613000",
                        "local": 2,
                        "objectkey": "p_tourism",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
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
                        "objectkey": "p_shop",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53623200",
                        "local": 2,
                        "objectkey": "p_ice_cream",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53624001",
                        "local": 2,
                        "objectkey": "p_restaurant",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53624002",
                        "local": 2,
                        "objectkey": "p_cafe",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53624003",
                        "local": 2,
                        "objectkey": "p_fast_food",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53624004",
                        "local": 2,
                        "objectkey": "p_pub",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53624005",
                        "local": 2,
                        "objectkey": "p_bar",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53624007",
                        "local": 2,
                        "objectkey": "p_nightclub",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53632101",
                        "local": 2,
                        "objectkey": "p_bank",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53632102",
                        "local": 2,
                        "objectkey": "p_post_office",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53632105",
                        "local": 2,
                        "objectkey": "p_courthouse",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53632106",
                        "local": 2,
                        "objectkey": "p_townhall",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53633001",
                        "local": 2,
                        "objectkey": "p_embassy",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53641000",
                        "local": 2,
                        "objectkey": "p_cinema",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53646011",
                        "local": 2,
                        "objectkey": "p_casino",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53650001",
                        "local": 2,
                        "objectkey": "p_hotel",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53650003",
                        "local": 2,
                        "objectkey": "p_viewpoint",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53650004",
                        "local": 2,
                        "objectkey": "p_hostel",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53650006",
                        "local": 2,
                        "objectkey": "p_picnic_site",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53650012",
                        "local": 2,
                        "objectkey": "p_attraction",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53650019",
                        "local": 2,
                        "objectkey": "p_vending_machine",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53650038",
                        "local": 2,
                        "objectkey": "p_coworking_space",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53661002",
                        "local": 2,
                        "objectkey": "p_bench",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53661003",
                        "local": 2,
                        "objectkey": "p_toilets",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53661004",
                        "local": 2,
                        "objectkey": "p_atm",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53661005",
                        "local": 2,
                        "objectkey": "p_bicycle_parking",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53661010",
                        "local": 2,
                        "objectkey": "p_drinking_water",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53662001",
                        "local": 2,
                        "objectkey": "p_recycling",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53662002",
                        "local": 2,
                        "objectkey": "p_waste_disposal",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53662003",
                        "local": 2,
                        "objectkey": "p_waste_basket",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53662004",
                        "local": 2,
                        "objectkey": "p_bicycle_rental",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53673300",
                        "local": 2,
                        "objectkey": "p_car_rental",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53720220",
                        "local": 2,
                        "objectkey": "p_marina",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53890000",
                        "local": 2,
                        "objectkey": "p_zoo",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
                        "color": "#808080",
                        "opacity": 0.75,
                        "height": {
                            "heightDef": 40,
                            "keySem": "",
                            "heightSem": 1
                        }
                    },
                    {
                        "code": "53890001",
                        "local": 2,
                        "objectkey": "p_theme_park",
                        "semlist": [],
                        "viewtype": 4,
                        "cut": 1,
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
                "id": "tomsk3dSQL",
                "alias": "Модели Ногинска",
                "url": "http://gisserver.info/GISWebServiceSE/service.php",
                "hidden": 1,
                "idLayer": "noginsk3d",
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
        ],
        scenario3d:
        [
            {
                "id": "scenario_noginsk",
                "alias": "Сценарий Ногинска",
                "url": "http://gisserver.info/GISWebServiceSE/service.php",
                "description": "движение транспорта"
            }
        ]
    };

    loadFromUrl(options);


    if (window.GWTK) {
        theMap = new GWTK.Map("dvMap", options);
    }

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
