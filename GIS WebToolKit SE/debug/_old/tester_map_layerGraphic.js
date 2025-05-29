
var wmts;
var wfs;
var urls;

var settings_mapEditor = {
    "maplayersid": ["infrastruct", "noginsk"],
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
    "selectlayersid": ["infrastruct", "noginsk"],
    "transaction": true,
    "oldversion": 0,  // 1 - старая версия редактора, 0 или отсутствие - новая версия
    // "graphic": 0   // 1 - работать с графическими объектами карты, 0 - только объеты из классификатора
     "modelite" : 0   // 1 - облегченная версия
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
                //      { "id": "karelia", "text": "Карелия", "clickable": true, "img": "icon-page" },
                      { "id": "noginsk3d", "text": "Ногинск (3D)", "clickable": true, "img": "icon-page" }
                // ,{ "id": "vita", "text": "План Зонирования", "clickable": true, "img": "icon-page" }
            ]
        }
    ];

    var options = {
        "url": "http://gisserver.info/GISWebServiceSE/service.php", "id": "1",
        //"center": [55.843436, 38.436089],
        "center": [55.75, 38.30],
        "tilematrix": 12,
        "crs": 3857,
        "tilematrixset": "GoogleMapsCompatible", "maxzoom": 22, "minzoom": 2,
        "mergewmslayers": false,
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
                        //"tilematrixset":"EPSG:3857",
                        //"linkedUrls" :["http://gisserver.info/GISWebServiceSE/service.php?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=worldmap&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png&ss="],
                        "url": "SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=worldmap&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png",
                        "hidden": 0
                    },
                    {
                        "id": "noginsk", "areapixel": 20,
                        "alias": "Богородский городской округ",
                        "selectObject": 1, //"authtype":"pam",
                        "export": ['json'], //http://localhost/giswebservicese/service.php?
                        "url": "SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=noginsk_area&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs",
                        "version":"13.3.0",
                        "legend":"*", 
                        "bbox": [55.55155345,37.82867432,56.27,39.00009],
                        "keyssearchbyname": ["Name"]
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
                        "id": "noginsk3d",
                        "alias": "noginsk3d",
                        "selectObject": 0, "version":"13.3.0",
                        "export": ['sxf'],
                        "url": "SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=noginsk_area_3d&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt",
                        "hidden": 1
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
                        "opacityValue": 100, "schemename":"guestmap.xsd",
                        "semanticfilter": ["NAME", "ObjState", "SEM71"],
                        "hidden": 0
                    }
                    /*,{
                        "id": "karelia",
                        "alias": "Карелия",
                        "selectObject": 1, "version":"13.6.0",
                        "mapdb": true,
                        "url": "http://192.168.0.24/GISWebServiceSE/service.php?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=kareliadbm&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt",
                        "hidden": 0
                    }*/
                    // ,{
                    //     "id": "vita",
                    //     "alias": "План Зонирования", "areapixel": 20,
                    //     "selectObject": 1,
                    //     "export": ['gml','json'],
                    //     "url": "http://192.168.1.63/GISWebServiceSE/service.php?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=FOLDER#AppDataMaps\\VITA\\PLAN_ZONUVANYA.sitx&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs",
                    //     "version":"13.3.0",
                    //     "keyssearchbyname": ["NAME"],
                    //     "legend":"*", //"authtype":"pam",
                    //     "legend1": 'poi',
                    //     "opacityValue": 100,
                    //     "hidden": 0
                    // }
                    //,{ 
                    //     "id":"noginsk3d","alias":"test1",
                    //     "selectObject":0,
                    //     "url":"http://192.168.0.251/GISWebServiceSE/service.php", "gis":1, 
                    //     "opacityValue":100,
                    //     "service":"wms",
                    //     "datatype":"sit,sitx,mpt",
                    //     "folder":"HOST#192.168.0.251#2047#ALIAS#Минприроды"
                    // }
        ],

        "controls": ["objectPanel", "mapscale", "mapcoordinates", "scaleupdown", "search", "searchSem", 
        "areasearch", "selectobjects", "clearselect", "map3d", "mapeditor", "localmapcontrol","map2img",
        "thematicmapcontrol", "viewentirelayer", "objectslayer", "content", "transitiontopoint", "ruler","viewoptions","exportLayer"],
        
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
                    },
                    {
                        "code": "88800170",
                        "local": 2,
                        "objectkey": "492-100-T",
                        "semlist": [],
                        "viewtype": 3,
                        "cut": 0,
                        "color": "#000000",
                        "opacity": 1.0,
                        "height": {
                            "heightDef": 5,
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
                "idLayer": "noginsk_area_3d",
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
        ,
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

        // Примеры работы с графическими слоями
        // ++++++++++++++++++++++++++++++++++++

        // Открытие графического слоя из карты
        // graphicLayer_openFromMap(theMap);

        // Создание компонента  графического слоя и добавление его в карту
        // graphicLayer_createAndOpen(theMap);

        // Создание графического слоя методом загрузки данных из GeoJson
        // graphicLayer_loadFromGeoJson(theMap);

        // Создание компонента  графического слоя и его отображение путем загрузки данных непосредственно из объекта geojson
        //graphicLayer_loadFromGeoJsonObject(theMap);

        // Открытие графического слоя c отдельным описанием стилей объектов из карты (загрузка с url)
        //graphicLayer_ClassifierStyle_openFromMap(theMap);

        // Открытие графического слоя c отдельным описанием стилей объектов из карты (загрузка из объекта)
        //graphicLayer_ClassifierStyle_loadFromGeoJsonObject(theMap);

        // Создание компонента графического слоя c отдельной загрузкой классификатора стилей обьектов
        //graphicLayer_ClassifierStyle_loadFromGeoJson(theMap);

        // Открытие  графического слоя типа geomarker (кластер)
        //graphicLayer_openCluster(theMap);
    }

}

// Примеры работы с графическими слоями

// Открытие графического слоя из карты
function graphicLayer_openFromMap(map) {
    if (map) {
        map.openLayer({
            "id": 'svgobjectslayer',
            "alias": 'Тест',
            "selectObject": "1",
            "type": 'svg',
            "url": "http://localhost/GISWebToolKitSE/tester_data/test.json"
        });
    }
}

// Создание компонента графического слоя и добавление его в карту
function graphicLayer_createAndOpen(map) {
    if (map) {
        var layer = new GWTK.graphicLayer(map, {
            "id": "svgobjectslayer",
            "alias": "Тест",
            "selectObject": "1",
            "url": "http://localhost/GISWebToolKitSE/tester_data/test.json"
        });
    }
}

// Создание графического слоя методом загрузки данных из GeoJson
function graphicLayer_loadFromGeoJson(map) {
    if (map) {
        // Создаем экземпляр слоя
        var layer = new GWTK.graphicLayer(map, {
            "id": 'svgobjectslayer',
            "alias": 'Тест',
            "selectObject": "1"
        });
        // Получаем список объектов
        var e1 = JSON.parse($.ajax({
            type: "GET",
            url: "http://localhost/GISWebToolKitSE/tester_data/test.json",
            async: false,
        }).responseText);

        // Загружаем объекты на слой
        layer.loadFromGeoJson(e1, null, true);
    }
}

// Создание компонента  графического слоя и его отображение путем загрузки данных непосредственно из объекта geojson
function graphicLayer_loadFromGeoJsonObject(map) {
    var geojsonData = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [
                            38.06724397519608,
                            55.801960212817626
                        ],
                        [
                            38.06724397519608,
                            55.73093023634216
                        ],
                        [
                            38.27908321310426,
                            55.73093023634216
                        ],
                        [
                            38.27908321310426,
                            55.801960212817626
                        ],
                        [
                            38.06724397519608,
                            55.801960212817626
                        ]
                    ]
                },
                "properties": {
                    "id": "b017d75d-c6b9-23dd-b51d-be96bf60aaa3",
                    "schema": null,
                    "code": "LineString",
                    "key": "line",
                    "name": "line",
                    "semantics": []
                },
                "style": {
                    "stroke": "#FF55FF",
                    "stroke-width": "3.00",
                    "stroke-dasharray": "",
                    "stroke-opacity": 1,
                    "stroke-dashoffset": 0,
                    "stroke-linecap": ""
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        38.224151572479265,
                        55.75218944507889
                    ]
                },
                "properties": {
                    "id": "6372cde9-8c5d-8ede-8510-5e1c6400272d",
                    "schema": null,
                    "code": "Point",
                    "key": "Point",
                    "name": "Точка",
                    "semantics": []
                },
                "style": {
                    "stroke": "#0424F3",
                    "stroke-width": 1,
                    "stroke-dasharray": "",
                    "stroke-opacity": 1,
                    "stroke-dashoffset": 0,
                    "stroke-linecap": "",
                    "fill": "#CC0814",
                    "fill-opacity": 1,
                    "marker": "M 2 16 a 7 7 0 0 0 28 0M 2 16 a 7 7 0 0 1 28 0"
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "title",
                    "coordinates": [
                        [
                            38.21919322013177,
                            55.74039974636062
                        ],
                        [
                            38.261765241616146,
                            55.7382737043141
                        ]
                    ]
                },
                "properties": {
                    "id": "a55a3ea3-42f1-f95f-99c3-58b06f6497fe",
                    "schema": null,
                    "code": "title",
                    "key": "Title",
                    "name": "Подпись",
                    "semantics": [
                        {
                            "value": "Текст",
                            "textvalue": "Текст"
                        },
                        {
                            "name": "Текст",
                            "value": "Текст",
                            "textvalue": "Текст"
                        }
                    ],
                    "title": "Текст",
                    "text": "Текст"
                },
                "style": {
                    "stroke": "#CC0814",
                    "stroke-width": 1,
                    "stroke-opacity": 1,
                    "font-family": "Verdana",
                    "font-style": "normal",
                    "font-weight": "bold",
                    "font-size": "30",
                    "font-stretch": "expanded",
                    "text-decoration": "none",
                    "letter-spacing": 0,
                    "text-shadow": "",
                    "writing-mode": "",
                    "fill": "#3D85C6",
                    "fill-opacity": 1
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [
                                38.25744478086013,
                                55.80707348354588
                            ],
                            [
                                38.25744478086013,
                                55.71443544339887
                            ],
                            [
                                38.42190547872925,
                                55.71443544339887
                            ],
                            [
                                38.42190547872925,
                                55.80707348354588
                            ],
                            [
                                38.25744478086013,
                                55.80707348354588
                            ]
                        ]
                    ]
                },
                "properties": {
                    "id": "65e9c0b4-057c-fdb5-03b4-6bf6086d1b15",
                    "schema": null,
                    "code": "Polygon",
                    "key": "Polygon",
                    "name": "Полигон",
                    "semantics": [],
                    // "stroke": "yellow",
                    // "stroke-width": 5,
                    // "stroke-dasharray": "5 5",
                    // "stroke-opacity": 1,
                    // "stroke-dashoffset": 0,
                    // "stroke-linecap": "",
                    // "fill": "green",
                    // "fill-opacity": "0.8"
                },
                "style": {   // Преобладают
                    "stroke": "#FF55FF",
                    "stroke-width": 1,
                    "stroke-dasharray": "",
                    "stroke-opacity": 1,
                    "stroke-dashoffset": 0,
                    "stroke-linecap": "",
                    "fill": "#45818E",
                    "fill-opacity": "0.50"
                }
            }
        ]
    };
    if (map) {
        var layer = new GWTK.graphicLayer(map, {
            "id": 'svgobjectslayer',
            "alias": 'Тест',
            "selectObject": "1",
            "jsondata": {
                'type': 'geojson',                  // тип данных
                'json': geojsonData                 // geojson коллекция объектов
            }
        });
    }
}

// Открытие графического слоя c отдельным описанием стилей объектов из карты (загрузка с url)
function graphicLayer_ClassifierStyle_openFromMap(map) {
    if (map) {
        map.openLayer({
            "id": 'svgobjectslayer',
            "alias": 'Тест',
            "selectObject": "1",
            "type": 'svg',
            "url": "http://localhost/GISWebToolKitSE/tester_data/test_classifier.json"
        });
    }
}

// Открытие графического слоя c отдельным описанием классификатора стилей объектов из карты (загрузка из объекта)
function graphicLayer_ClassifierStyle_loadFromGeoJsonObject(map) {
    var geojsonData_classifier =
        {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [38.42190547872925, 55.71443544339887]
                },
                "properties": {
                    "id": "4",
                    "schema": null,
                    "code": "Point",
                    "key": "Point",
                    "name": "Маркер_P00000300304",
                    "objecttype": "P0000030030"
                }
            },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [38.25744478086013,	55.71443544339887]
                    },
                    "properties": {
                        "id": "4",
                        "schema": null,
                        "code": "Point",
                        "key": "Point",
                        "name": "Маркер_P0000030021",
                        "objecttype": "P0000030021"
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [
                                    38.25744478086013,
                                    55.80707348354588
                                ],
                                [
                                    38.25744478086013,
                                    55.71443544339887
                                ],
                                [
                                    38.42190547872925,
                                    55.71443544339887
                                ],
                                [
                                    38.42190547872925,
                                    55.80707348354588
                                ],
                                [
                                    38.25744478086013,
                                    55.80707348354588
                                ]
                            ]
                        ]
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
                        "stroke-dasharray": "5 5"
                    }
                }
            ],
            "typeField": "objecttype",
            "style": {
                "P0000030030": {
                    "name": "Завод переработки твердых отходов",
                    "marker": {
                        "width": "32px",
                        "height": "32px",
                        "image": "<svg width='50px' height='50px' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink= 'http://www.w3.org/1999/xlink'><image xlink:href='http://192.168.1.63/files/images/evn001.svg' x='0' y='0' height='50px' width='50px'/></svg>",
                        "centerX": "16",
                        "centerY": "16"
                    }
                },
                "P0000030021": {
                    "name": " Завод переработки пищевых отходов",
                    "marker": {
                        "width": "32px",
                        "height": "32px",
                        "image": "<svg width='50px' height='50px' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink= 'http://www.w3.org/1999/xlink'><image xlink:href='http://192.168.1.63/files/images/evn002.svg' x='0' y='0' height='50px' width='50px'/></svg>",
                        "centerX": "16",
                        "centerY": "16"
                    }
                }
            }
        };
    if (map) {
        var layer = new GWTK.graphicLayer(theMap, {
            "id": 'svgobjectslayer',
            "alias": 'Тест',
            "selectObject": "1",
            "jsondata": {
                'type': 'geojson',                   // тип данных
                'json': geojsonData_classifier,      // geojson коллекция объектов
                'style': {                           // структура описания стилей для отображения geojson
                    'typeField': 'objecttype',       // имя ключа в GWTK.jsonSource.json.features[i].properties, по которому будет идентифицироваться ключ стиля объекта GWTK.jsonSource.style
                    'style': geojsonData_classifier.style   // объект кодов(ключей), содержащих стили изображений объектов (классификатор объектов слоя)
                }
            }
        });
    }
}

// Создание компонента графического слоя c отдельной загрузкой классификатора стилей обьектов
function graphicLayer_ClassifierStyle_loadFromGeoJson(map) {
    // Получаем список объектов
    var e1 = JSON.parse($.ajax({
        type: "GET",
        url: "tester_data/data.json",
        async: false,
    }).responseText);

    // Получаем стили
    var es1 = JSON.parse($.ajax({
        type: "GET",
        url: "tester_data/classifier.json",
        async: false,
    }).responseText);

    // Разместим знаки на одном уровне
    if (e1 && e1.features && e1.features.length > 0 && es1) {
        //var b = 55.5; l = 38.50;
        var b = 55.71; l = 38.42;
       // 38.42190547872925, 55.71443544339887
        for (var i = 0; i < e1.features.length; i++) {
            if (e1.features[i].geometry && e1.features[i].geometry.type == "Point") {
                e1.features[i].properties.id = e1.features[i].properties.objecttype;
                e1.features[i].properties.name = es1[e1.features[i].properties.objecttype].name;
                e1.features[i].geometry.coordinates[0] = l;
                e1.features[i].geometry.coordinates[1] = b;
                e1.features[i].bbox = [l, b, l, b];
                l += 0.05;
            }
        }
    }
     // Создаем экземпляр слоя
    if (map) {
        var layer = new GWTK.graphicLayer(theMap, {
            "id": 'svgobjectslayer',
            "alias": 'Тест МЧС',
            "selectObject": "1",
            "eventSets": ['click']
        });

        // Устанавливаем стили для слоя
        layer.setStyle({
            typeField: 'objecttype',
            style: es1,
            defaultStyle: null
        });

        // Загружаем объекты на слой
        layer.loadFromGeoJson(e1, null, true);
    }
}

// Открытие  графического слоя типа geomarker (кластер)
function graphicLayer_openCluster(map) {
    if (map) {
        var layer = map.openLayer({
            "id": 'cluster',
            "alias": 'Кластер',
            "selectObject": "1",
            "url": "http://localhost/GISWebToolKitSE/tester_data/v_motion_today1.json",
            "hidden": 0,
            "showsettings": 1,
            "legend": {
                "legend": "*",
                "shortlegend": 1
            },
            "type": "geomarkers",
            "cluster": {
                "cellsize": 40,
                "markerevents": {"mouseenter": true, "mouseleave": true},
                "markerhint": {
                    "keys":
                        {
                            "Таблица": "Таблица",
                            "objecttype": "Тип объекта",
                            "Координата X": "X",
                            "Координата Y": "Y",
                            "id": "Идентификатор"
                        },
                    "propertiesname": '_clusterhint'
                }
            }
        });
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
    if (!options.params3d) {
        options.params3d = {};
    }
    options.params3d.active = true;
    options.params3d.rotate = parseFloat(get_params['rotate']);
    toDelete.push('rotate');
}
if ('incline' in get_params) {
    // zoom
    if (!options.params3d) {
        options.params3d = {};
    }
    options.params3d.active = true;
    options.params3d.incline = parseFloat(get_params['incline']);
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
