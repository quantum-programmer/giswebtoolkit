
function initMap() {

    var maptree = [
        {
            "id": "folder_fon", "text": "Фоновые слои", "img": "icon-folder", "expanded": true,
            "nodes": [{ "id": "worldmap", "text": "Карта мира", "clickable": true, "img": "ico_panorama" },
                      { "id": "osmMap", "text": "OpenStreetMap", "clickable": true, "img": "ico_osm" },
                      { "id": "googleMap", "text": "Google", "clickable": true, "img": "ico_google" },
                      { "id": "googleSat", "text": "GСпутник", "clickable": true, "img": "ico_google_sat" },
                      { "id": "esriSat", "text": "Cпутник", "clickable": true, "img": "ico_esri" }]
        },
        {
            "id": "folder_map", "text": "Карты", "img": "icon-folder", "expanded": true,
            "nodes": [{ "id": "noginsk", "text": "Богородский городской округ", "clickable": true, "img": "icon-page" },
                      { "id": "infrastruct", "text": "Карта гостя <a href ='http://3d.gisserver.ru' target='_blank'>Просмотр 3D</a>", "clickable": true, "img": "icon-page" }
            ]
        }
    ];

    var options = {
        "id": "55",
        "url": "http://gisserver.info/GISWebServiceSE/service.php",
        "center": [55.843436, 38.436089],
        "tilematrix": 15,
        "crs": 3857,
        "tilematrixset": "GoogleMapsCompatible",
        "maxzoom": 22,
        "minzoom": 2,
        "mergewmslayers": false,
        "locale": "ru-ru",
        "shortlegend": 0,
        "showsettings": true,
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
                        //"linkedUrls" :["http://b.tile.openstreetmap.org/%z/%x/%y.png"],
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
                        "url": "SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=worldmap&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png"

                    },
                    {
                        "id": "googleSat",
                        "alias": "GСпутник",
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
                        "id": "noginsk",
                        "alias": "Богородский городской округ",
                        "selectObject": 1,
                        "export": 1,
                        "url": "SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=noginsk_area&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt",
                        "hidden": 1,
                        "legend":"*",
                        "bbox": [55.55155345,37.82867432,56.27,39.00009],
                        "keyssearchbyname": ["ObjName"]
                    },
                    {
                        "id": "infrastruct",
                        "alias": "Карта гостя",
                        "selectObject": 1,
                        "export": ['gml','json'],
                        "url": "SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=guestmap&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt",
                        "keyssearchbyname": ["NAME"],
                        "legend":"*",
                        "legend1": 'poi',
                        "opacityValue": 100,
                        "hidden": 0
                    }
        ],

        "controls": ["mapscale","mapcoordinates","scaleupdown","scalebyrect","search","selectobjects","clearselect","content","transitiontopoint","localmapcontrol","objectPanel","map2img","viewentirelayer", "viewoptions"/*,"thematicmap"*/],
        "controlspanel": "flex-left",

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

        //"sectionsURL": "http://192.168.0.21/fondgkh/geojson/GeoJSON.php",
        //"sectionsFname": "Sections.json",

    };

    // создать экземпляр карты
    if (window.GWTK) {
        theMap = new GWTK.Map("dvMap", options);
    }

}
