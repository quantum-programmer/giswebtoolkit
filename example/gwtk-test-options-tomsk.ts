import { GwtkOptions, SearchType } from '~/types/Options';


const gwtkOptionsTomsk: GwtkOptions = {
    'helpUrl': '',
    'useform': false,
    'id': '7',
    'url': 'https://gisserver.info/GISWebServiceSE/service.php',
    'servicepam': false,
    'center': [
        56.476037,
        84.95178
    ],
    'tilematrix': 19,
    // 'crs': 3857,
    'tilematrixset': 'GoogleMapsCompatible',
    'username': 'ANONYMOUS',
    'loggedbefore': false,
    'controlspanel': false,
    'usetoken': false,
    'extauth': false,
    'authheader': '',
    'pamauth': false,
    'maxzoom': 22,
    'minzoom': 2,
    'mergewmslayers': false,
    'showsettings': false,
    'locale': 'ru-ru',
    'shortlegend': 0,
    'measurementunit': {
        'perimeter': 'km',
        'area': 'sq km'
    },
    'highlightmode': 'paint',
    'objectinfo': {
        'number': true,
        'area': true,
        'semantic': true
    },
    'layers': [
        {
            'id': 'worldmap',
            'alias': 'Карта мира',
            'selectObject': false,
            'url': 'SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=worldmap&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png',
            'version': '13.8.0',
            'gis': true,
            'hidden': 1,
            'opacityValue': 100,
            'schemename': '200t05g.xsd',
            'waterColors': [
                '#b7c7d8',
                '#a6bad0',
                '#87aacd',
                '#6f99c4',
                '#5788b9',
                '#4677a8',
                '#3c6691',
                '#375e84',
                1
            ],
            'linkedUrls': [],
            'after': '.*'
        },
        {
            'id': 'esriSat',
            'alias': 'Снимки',
            'selectObject': false,
            'url': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/%z/%y/%x',
            'opacityValue': 100,
            'linkedUrls': [],
            'after': 'worldmap'
        },
        {
            'id': '13B76BFE-BC61-4A9B-AB57-6D2CD60BB455',
            'alias': 'Названия городов',
            'selectObject': false,
            'url': 'https://gisserver.info/GISWebServiceSE/service.php?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=world_cities&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'version': '13.8.0',
            'gis': true,
            'hidden': 1,
            'opacityValue': 100,
            'lcs': {
                'hor': 0,
                'ver': 0
            },
            'export': [],
            'schemename': 'world_1M.xsd',
            'bbox': [
                -87.72585765,
                -180,
                87.72585765,
                180
            ],
            'after': 'esriSat'
        }
    ],
    'matrix': [
        {
            'id': '46F5990C-C3DC-41F7-9A4F-3B1B39BF4698',
            'alias': 'Матрица высот на мир',
            'url': 'https://gisserver.info/GISWebServiceSE/service.php?LAYER=worldMatrix&METHOD=GETCOVERAGETILE&tilematrixset=%tilematrixset&tilerow=%tilerow&tilecol=%tilecol&tilematrix=%scale&service=WCS&format=wcs',
            'authtype': ''
        }
    ],
    'params3d': {
        'quality': 100,
        'active': true,
        'rotate': 0.5595960000000032,
        'incline': 0.5503679999999984
    },
    'objects3d': [
        {
            'id': '13B76BFE-BC61-4A9B-AB57-6D2CD60BB455',
            'obj': [
                {
                    'code': '91190000',
                    'local': 3,
                    'objectkey': 'T00911900002',
                    'semlist': [],
                    'viewtype': 3,
                    'cut': 0,
                    'color': '#444444',
                    'opacity': '1',
                    'height': {
                        'heightDef': 3,
                        'keySem': '',
                        'heightSem': 1
                    }
                }
            ],
            'options': {
                'minzoom': 0
            }
        },
        {
            'id': '1D1747D9-5AF2-4043-9B0D-4F52C69BAECF',
            'alias': '3D тайлы для Томска',
            'url': 'https://gisserver.info/GISWebServiceSE/service.php',
            'authtype': '',
            'hidden': 0,
            'idLayer': 'tomsk',
            'zoomLevels': [
                '0',
                '1',
                '2',
                '3',
                '4',
                '5',
                '6',
                '7',
                '8',
                '9',
                '10',
                '11',
                '12',
                '13',
                '14',
                '15',
                '16',
                '17',
                '18',
                '19',
                '20',
                '21',
                '22',
                '23'
            ]
        }
    ],
    'controls': [
        'mapscale',
        'mapcoordinates',
        'scaleupdown',
        'search',
        'areasearch',
        'selectobjects',
        'clearselect',
        'content',
        'polygonarea',
        'maplink',
        'viewoptions',
        'localmapcontrol',
        'map3d',
        'objectPanel',
        'mapeditor',
        'map2img'
    ],

    'contenttree': [
        {
            'id': 'fon',
            'text': 'Фоновые слои',
            'expanded': true,
            'img': 'icon-folder',
            'nodes': [
                {
                    'id': 'worldmap',
                    'text': 'Карта мира',
                    'img': 'ico_panorama',
                    'clickable': true
                },
                {
                    'id': 'esriSat',
                    'text': 'Снимки',
                    'img': 'ico_esri',
                    'clickable': true
                }
            ]
        },
        {
            'id': '56067B79-CFE8-4ABB-9C64-D7CE4B57F972',
            'text': 'Карты',
            'expanded': true,
            'img': 'icon-folder',
            'nodes': [
                {
                    'id': '13B76BFE-BC61-4A9B-AB57-6D2CD60BB455',
                    'text': 'Названия городов',
                    'img': 'ico_panorama',
                    'clickable': true
                }
            ]
        }
    ],
    'settings_mapEditor': {
        'maplayersid': [],
        'functions': [
            '*'
        ],
        'editingdata': [],
        'selectlayersid': ['8DDF8461-A115-431D-8F66-5E527D0A924C1'],
        'transaction': true
    }
};

export default gwtkOptionsTomsk;
