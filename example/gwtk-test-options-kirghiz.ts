import { GwtkOptions, SearchType } from '~/types/Options';


const gwtkOptionsKirghiz: GwtkOptions = {
    'helpUrl': '',
    'useform': false,
    'id': '9',
    'url': 'https://gisserver.info/GISWebServiceSE/service.php',
    'servicepam': false,
    'center': [
        42.575474,
        76.753464
    ],
    'tilematrix': 17,
    // 'crs': 3857,
    'tilematrixset': 'GoogleMapsCompatible',
    'username': 'ANONYMOUS',
    'loggedbefore': false,
    'controlspanel': false,
    'usetoken': false,
    'extauth': false,
    'authheader': '',
    'pamauth': false,
    'maxzoom': 20,
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
            'id': 'F3033AAE-1B09-438B-A403-C9063D745E36',
            'alias': 'OpenStreetMap',
            'selectObject': false,
            'url': 'https://b.tile.openstreetmap.org/%z/%x/%y.png',
            'hidden': 1,
            'opacityValue': 100,
            'waterColors': [
                '#aad3df',
                0
            ],
            'linkedUrls': [],
            'after': '.*'
        },
        {
            'id': 'F5A5E3F3-1FFF-45AE-96A9-0910F4093144',
            'alias': 'Снимки',
            'selectObject': false,
            'url': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/%z/%y/%x',
            'opacityValue': 100,
            'linkedUrls': [],
            'after': 'F3033AAE-1B09-438B-A403-C9063D745E36'
        }
    ],
    'matrix': [
        {
            'id': '205F8DEC-0C3F-4968-99C6-1F3114860FB5',
            'alias': 'Матрица высот на мир',
            'url': 'https://gisserver.info/GISWebServiceSE/service.php?LAYER=kyrgyzstanMatrix&METHOD=GETCOVERAGETILE&tilematrixset=%tilematrixset&tilerow=%tilerow&tilecol=%tilecol&tilematrix=%scale&service=WCS&format=wcs',
            'authtype': ''
        }
    ],
    'params3d': {
        'quality': 100,
        'active': true,
        'rotate': 0.4426050000000034,
        'incline': 0.17453300000000357
    },
    'objects3d': [
        {
            'id': '258F8277-DAFE-4EB4-87E4-859499A64FFF',
            'alias': 'Чок-Тал',
            'url': 'https://gisserver.info/GISWebServiceSE/service.php',
            'authtype': '',
            'hidden': 0,
            'idLayer': 'kyrgyzstan',
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
        },
        {
            'id': '30461781-98F4-4EE7-9D3B-8A06323C3E00',
            'alias': 'Каньон Сказка',
            'url': 'https://gisserver.info/GISWebServiceSE/service.php',
            'authtype': '',
            'hidden': 0,
            'idLayer': 'kyrgyzstan2',
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
        'clearselect',
        'content',
        'maplink',
        'viewoptions',
        'map3d',
        'objectPanel'
    ],
    'search_options': {
        'map': {
            'visible': 0
        },
        'address': {
            'visible': 0,
            'default': 0,
            'sources': []
        },
        'rosreestr': {
            'visible': 0
        },
        'default': SearchType.Address
    },
    'contenttree': [
        {
            'id': 'E61E2BB6-5B0A-4762-B67A-12A9E3A750C9',
            'text': 'Фоновые карты',
            'expanded': true,
            'img': 'icon-folder',
            'nodes': [
                {
                    'id': 'F3033AAE-1B09-438B-A403-C9063D745E36',
                    'text': 'OpenStreetMap',
                    'img': 'ico_osm',
                    'clickable': true
                },
                {
                    'id': 'F5A5E3F3-1FFF-45AE-96A9-0910F4093144',
                    'text': 'Снимки',
                    'img': 'ico_esri',
                    'clickable': true
                }
            ]
        }
    ]
};

export default gwtkOptionsKirghiz;