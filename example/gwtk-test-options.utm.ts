import { ContentTree, EditorSettings, GwtkOptions } from '~/types/Options';


const contenttree: ContentTree[] = [
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
            }
        ]
    },
    {
        'id': 'map',
        'text': 'Карты',
        'expanded': true,
        'img': 'icon-folder',
        'nodes': [
            {
                'id': '8DDF8461-A115-431D-8F66-5E527D0A924C1',
                'text': 'Ногинск (UTM)',
                'img': 'icon-page',
                'clickable': true
            }
        ]
    }
];

const settings_mapEditor: EditorSettings = {
    'maplayersid': ['8DDF8461-A115-431D-8F66-5E527D0A924C1'],
    'functions': ['*'],
    'editingdata': [],
    'selectlayersid': ['8DDF8461-A115-431D-8F66-5E527D0A924C1'],
    'transaction': true
};

const gwtkOptions: GwtkOptions = {
    'id': '2',
    'url': 'https://gwserver.gisserver.info/GISWebServiceSE/service.php',
    'servicepam': false,
    // 'center': [55.855708, 38.441333],
    'center': [55.855708, 38.441333],
    'isgeocenter': true,
    'tilematrix': 16,
    // 'tilematrixset': 'Id=0001Url=https://gwserver.gisserver.info/GISWebServiceSE/service.phpTileSize=256',
    'tilematrixset': 'Id=Photo_test_utmUrl=https://gwserver.gisserver.info/GISWebServiceSE/service.phpTileSize=256',
    // 'tilematrixset': 'GoogleMapsCompatible',
    'username': 'admin',
    'loggedbefore': true,
    'controlspanel': false,
    'helpUrl': '',
    'usetoken': false,
    'extauth': false,
    'authheader': '',
    'pamauth': false,
    'useform': false,
    'maxzoom': 19,
    'minzoom': 2,
    'mergewmslayers': false,
    'showsettings': false,
    'locale': 'ru-ru',
    'shortlegend': 0,
    'measurementunit': { 'perimeter': 'km', 'area': 'sq km' },
    'highlightmode': 'paint',
    'objectinfo': { 'number': true, 'area': true, 'semantic': true },
    'layers': [
        {
            'id': 'worldmap',
            'alias': 'Карта мира',
            'selectObject': false,
            // 'url': 'https://gwserver.gisserver.info/GISWebServiceSE/service.php?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=0003&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png',
            'url': 'SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=FOLDER#Data3d/Maps/cadastre/88-2.map&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png',
            'version': '15.2.3',
            'gis': true,
            'hidden': 0,
            'opacityValue': 100,
            'linkedUrls': []
        },
        {
            'id': '8DDF8461-A115-431D-8F66-5E527D0A924C1',
            'alias': 'Ногинск (UTM)',
            'selectObject': true,
            // 'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=0001&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=Photo_test_utm&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'version': '15.2.3',
            'gis': true,
            'legend': '*',
            'opacityValue': 100,
            'keyssearchbyname': ['name'],
            'export': [],
            'schemename': '200t05gm'
        }
    ],
    'matrix': [
        {
            'id': 'coverage1',
            'alias': 'Матрица высот на мир',
            'url': 'https://gisserver.info/GISWebServiceSE/service.php?LAYER=noginskMatrix&METHOD=GETCOVERAGETILE&tilematrixset=%tilematrixset&tilerow=%tilerow&tilecol=%tilecol&tilematrix=%scale&service=WCS&format=wcs',
            'authtype': ''
        }
    ],
    'params3d': { 'quality': 100, 'active': false, 'rotate': 0.5235987755983, 'incline': 0.26179938779915 },
    'reliefprofiles': [
        {
            'alias': 'Профиль 1',
            'authtype': '',
            'id': '5222',
            'layerid': 'mosobl',
            'url': 'https://gwserver.gisserver.info/GISWebServiceSE/service.php'
        }
    ],
    'objects3d': [],
    'cluster': {
        'json': '\\RUS-MobileSpeedcams_Garmin.json',        // "clusterifyFname": //"Chicago_crime_spots.json"	"NYPD_Motor_Vehicle_Collisions.json"	"busstops.json"
        'url': 'https://gisserver.info/geojson/GeoJSON.php'
    },
    'scenario3d': [
        {
            'id': 'scenario_noginsk',
            'alias': 'Сценарий Ногинск',
            'url': 'https://gisserver.info/GISWebServiceSE/service.php',
            'description': 'Сценарий Ногинск'
        }
    ],
    'controls': ['*'],
    contenttree,
    settings_mapEditor
};

export default gwtkOptions;
