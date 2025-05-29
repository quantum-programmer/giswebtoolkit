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
                'id': 'noginsk',
                'text': 'Богородский городской округ',
                'img': 'icon-page',
                'clickable': true
            },
            {
                'id': 'semimages',
                'text': 'SemImages',
                'img': 'icon-page',
                'clickable': true
            }
        ]
    }
];

const settings_mapEditor: EditorSettings = {
    'maplayersid': ['noginsk_ruin', 'noginsk', 'kaliningrad', 'semimages'],
    'functions': ['*'],
    'editingdata': [],
    'selectlayersid': ['noginsk_ruin', 'noginsk', 'kaliningrad', 'semimages'],
    'transaction': true
};

const imageSemantics: string[] = ['DOCHOLDER', 'TxtFile'];

const gwtkOptions: GwtkOptions = {
    'id': '2',
    'url': 'https://gwserver.gisserver.info/GISWebServiceSE/service.php',
    'servicepam': false,
    // 'center': [55.855708, 38.441333],
    'center': [5157, -4145],
    'maxbounds': [
        4979.5,
        -5020.5,
        6020.5,
        -3989.5
    ],
    'isgeocenter': false,
    'tilematrix': 16,
    // 'tilematrixset': 'Id=0001Url=https://gwserver.gisserver.info/GISWebServiceSE/service.phpTileSize=256',
    'tilematrixset': 'Id=FOLDER#Data3d\\Maps\\cadastre\\88-2.mapUrl=https://gwserver.gisserver.info/GISWebServiceSE/service.phpTileSize=256',
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
            'version': '13.8.0',
            'gis': true,
            'hidden': 0,
            'opacityValue': 100,
            'linkedUrls': []
        },
        {
            'id': 'noginsk',
            'alias': 'Богородский городской округ',
            'selectObject': true,
            // 'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=0001&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=FOLDER#Data3d/Maps/cadastre/88-2.map&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'version': '13.8.0',
            'gis': true,
            'legend': '*',
            'opacityValue': 100,
            'keyssearchbyname': ['name'],
            'export': [],
            'schemename': 'map5000m.xsd'
        },
        {
            'id': 'semimages',
            'alias': 'SemImages',
            'selectObject': true,
            // 'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=0001&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=semimages&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'version': '15.2.3',
            'gis': true,
            'legend': '*',
            'opacityValue': 100,
            'keyssearchbyname': ['name'],
            'export': [],
            'schemename': 'survey',
            imageSemantics
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
    'objects3d': [
        {
            'id': 'noginsk',
            'obj': [{
                'code': '71111110',
                'local': 1,
                'objectkey': '368-000-S',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '71123000',
                'local': 1,
                'objectkey': '409-000-S',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '71126000',
                'local': 2,
                'objectkey': 'p_park',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '71325000',
                'local': 1,
                'objectkey': '416-000-S',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_house_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '51133100',
                'local': 1,
                'objectkey': '061-000-S',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_school_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_detached_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_warehouse_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_church_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_residential_b',
                'semlist': ['building_e_levels'],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 3, 'keySem': 'building_e_levels', 'heightSem': 3 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_train-station_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '46620000',
                'local': 1,
                'objectkey': '048-000-S',
                'semlist': ['building_e_levels'],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 5, 'keySem': 'building_e_levels', 'heightSem': 5 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_constraction_b',
                'semlist': ['building_e_levels'],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 3, 'keySem': 'building_e_levels', 'heightSem': 3 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_kindergarten_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_apartments_b',
                'semlist': ['building_e_levels'],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 3, 'keySem': 'building_e_levels', 'heightSem': 3 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_commercial_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_hangar_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_industrial_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_public_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_office_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200001',
                'local': 1,
                'objectkey': '013-001-S',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_yes_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_barracks_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_cathedral_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_civic_b',
                'semlist': ['building_e_levels'],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 3, 'keySem': 'building_e_levels', 'heightSem': 3 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_dormitory_b',
                'semlist': ['building_e_levels'],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 9, 'keySem': 'building_e_levels', 'heightSem': 3 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_hospital_b',
                'semlist': ['building_e_levels'],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 3, 'keySem': 'building_e_levels', 'heightSem': 3 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_hotel_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_hut_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_retail_b',
                'semlist': ['building_e_levels'],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 5, 'keySem': 'building_e_levels', 'heightSem': 5 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_shed_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_supermarket_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_terrace_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_transportation_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_university_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_heat_station_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_service_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_barrack_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '44200000',
                'local': 1,
                'objectkey': 'a_garages_b',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '45500000',
                'local': 1,
                'objectkey': '144-200-S',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '51231200',
                'local': 1,
                'objectkey': '097-100-S',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '51320000',
                'local': 0,
                'objectkey': 'l_line',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '71132000',
                'local': 2,
                'objectkey': '389-000-P',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }],
            'options': { 'minzoom': 16, 'maxzoom': 16 }
        }, {
            'id': 'infrastructure3d',
            'obj': [{
                'code': '10715',
                'local': 2,
                'objectkey': 'p_car_wash',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '2000727',
                'local': 2,
                'objectkey': 'p_taxi',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612102',
                'local': 2,
                'objectkey': 'p_pharmacy',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612103',
                'local': 2,
                'objectkey': 'p_clinic',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612104',
                'local': 2,
                'objectkey': 'p_dentist',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612105',
                'local': 2,
                'objectkey': 'p_doctors',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612107',
                'local': 2,
                'objectkey': 'p_veterinary',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612201',
                'local': 2,
                'objectkey': 'p_school',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612202',
                'local': 2,
                'objectkey': 'p_kindergarten',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612203',
                'local': 2,
                'objectkey': 'p_college',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612204',
                'local': 2,
                'objectkey': 'p_university',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612205',
                'local': 2,
                'objectkey': 'p_driving_school',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612301',
                'local': 2,
                'objectkey': 'p_theatre',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612302',
                'local': 2,
                'objectkey': 'p_library',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612303',
                'local': 2,
                'objectkey': 'p_museum',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612304',
                'local': 2,
                'objectkey': 'p_arts_centre',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612401',
                'local': 2,
                'objectkey': 'p_police',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612402',
                'local': 2,
                'objectkey': 'p_fire_station',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53613000',
                'local': 2,
                'objectkey': 'p_tourism',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53623000',
                'local': 2,
                'objectkey': 'p_shop',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53623200',
                'local': 2,
                'objectkey': 'p_ice_cream',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53624001',
                'local': 2,
                'objectkey': 'p_restaurant',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53624002',
                'local': 2,
                'objectkey': 'p_cafe',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53624003',
                'local': 2,
                'objectkey': 'p_fast_food',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53624004',
                'local': 2,
                'objectkey': 'p_pub',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53624005',
                'local': 2,
                'objectkey': 'p_bar',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53624007',
                'local': 2,
                'objectkey': 'p_nightclub',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53632101',
                'local': 2,
                'objectkey': 'p_bank',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53632102',
                'local': 2,
                'objectkey': 'p_post_office',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53632105',
                'local': 2,
                'objectkey': 'p_courthouse',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53632106',
                'local': 2,
                'objectkey': 'p_townhall',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53641000',
                'local': 2,
                'objectkey': 'p_cinema',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53650001',
                'local': 2,
                'objectkey': 'p_hotel',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53650003',
                'local': 2,
                'objectkey': 'p_viewpoint',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53650012',
                'local': 2,
                'objectkey': 'p_attraction',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53650019',
                'local': 2,
                'objectkey': 'p_vending_machine',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53661002',
                'local': 2,
                'objectkey': 'p_bench',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53661003',
                'local': 2,
                'objectkey': 'p_toilets',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53661004',
                'local': 2,
                'objectkey': 'p_atm',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53661005',
                'local': 2,
                'objectkey': 'p_bicycle_parking',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53661010',
                'local': 2,
                'objectkey': 'p_drinking_water',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53662001',
                'local': 2,
                'objectkey': 'p_recycling',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53662002',
                'local': 2,
                'objectkey': 'p_waste_disposal',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53662003',
                'local': 2,
                'objectkey': 'p_waste_basket',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53662004',
                'local': 2,
                'objectkey': 'p_bicycle_rental',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53673300',
                'local': 2,
                'objectkey': 'p_car_rental',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53720220',
                'local': 2,
                'objectkey': 'p_marina',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '51220000',
                'local': 2,
                'objectkey': '096-000-P',
                'semlist': [],
                'viewtype': 4,
                'cut': 0,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '51420000',
                'local': 2,
                'objectkey': '074-000-P',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }, {
                'code': '53612000',
                'local': 2,
                'objectkey': 'D-53612000-P',
                'semlist': [],
                'viewtype': 4,
                'cut': 1,
                'color': '#808080',
                'opacity': '0.75',
                'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
            }],
            'options': { 'minzoom': 16, 'maxzoom': 16 }
        }, {
            'id': '0D3A1B7E-5BC3-4F6A-B449-1B49A1BBADF1',
            'alias': 'Модели Ногинска',
            'url': 'https://gisserver.info/GISWebServiceSE/service.php',
            'authtype': '',
            'hidden': 0,
            'idLayer': 'noginsk_area',
            'zoomLevels': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']
        }
    ],
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
    settings_mapEditor,
    layerprojection:{
        'Id=FOLDER#Data3d\\Maps\\cadastre\\88-2.mapUrl=https://gwserver.gisserver.info/GISWebServiceSE/service.phpTileSize=256': [
            {
                'name': 'Name',
                'value': '88-2',
                'type': 'string'
            },
            {
                'name': 'Scale',
                'value': 2000,
                'type': 'number'
            },
            {
                'name': 'EPSGCode',
                'value': 0,
                'type': 'number'
            },
            {
                'name': 'EllipsoideKind',
                'value': -1,
                'type': 'number'
            },
            {
                'name': 'HeightSystem',
                'value': 1,
                'type': 'number'
            },
            {
                'name': 'MaterialProjection',
                'value': -1,
                'type': 'number'
            },
            {
                'name': 'CoordinateSystem',
                'value': 4,
                'type': 'number'
            },
            {
                'name': 'PlaneUnit',
                'value': 0,
                'type': 'number'
            },
            {
                'name': 'HeightUnit',
                'value': 0,
                'type': 'number'
            },
            {
                'name': 'FrameKind',
                'value': 3,
                'type': 'number'
            },
            {
                'name': 'MapType',
                'value': 5,
                'type': 'number'
            },
            {
                'name': 'DeviceCapability',
                'value': -1,
                'type': 'number'
            },
            {
                'name': 'DataProjection',
                'value': 1,
                'type': 'number'
            },
            {
                'name': 'ZoneIdent',
                'value': 0,
                'type': 'number'
            },
            {
                'name': 'FlagRealPlace',
                'value': 0,
                'type': 'number'
            },
            {
                'name': 'ZoneNumber',
                'value': 0,
                'type': 'number'
            },
            {
                'name': 'FirstMainParallel',
                'value': -0.00000001,
                'type': 'number'
            },
            {
                'name': 'SecondMainParallel',
                'value': -0.00000001,
                'type': 'number'
            },
            {
                'name': 'AxisMeridian',
                'value': -0.00000001,
                'type': 'number'
            },
            {
                'name': 'MainPointParallel',
                'value': -0.00000001,
                'type': 'number'
            },
            {
                'name': 'PoleLatitude',
                'value': 0.00000000,
                'type': 'number'
            },
            {
                'name': 'PoleLongitude',
                'value': 0.00000000,
                'type': 'number'
            },
            {
                'name': 'FalseEasting',
                'value': 0.00000000,
                'type': 'number'
            },
            {
                'name': 'ScaleFactor',
                'value': 1.00000000,
                'type': 'number'
            },
            {
                'name': 'TurnAngle',
                'value': 0.00000000,
                'type': 'number'
            },
            {
                'name': 'DX',
                'value': 0.00000000,
                'type': 'number'
            },
            {
                'name': 'DY',
                'value': 0.00000000,
                'type': 'number'
            },
            {
                'name': 'DZ',
                'value': 0.00000000,
                'type': 'number'
            },
            {
                'name': 'RX',
                'value': 0.00000000,
                'type': 'number'
            },
            {
                'name': 'RY',
                'value': 0.00000000,
                'type': 'number'
            },
            {
                'name': 'RZ',
                'value': 0.00000000,
                'type': 'number'
            },
            {
                'name': 'M',
                'value': 0.00000000,
                'type': 'number'
            },
            {
                'name': 'Count',
                'value': 0,
                'type': 'number'
            },
            {
                'name': 'SemiMajorAxis',
                'value': 6378137.00000000,
                'type': 'number'
            },
            {
                'name': 'InverseFlattening',
                'value': 0.00335281,
                'type': 'number'
            },
            {
                'name': 'SystemType',
                'value': 1,
                'type': 'number'
            },
            {
                'name': 'IsGeoSupported',
                'value': 0,
                'type': 'number'
            },
            {
                'name': 'MinX',
                'value': 4979.50000000,
                'type': 'number'
            },
            {
                'name': 'MinY',
                'value': -5020.50000000,
                'type': 'number'
            },
            {
                'name': 'MaxX',
                'value': 6020.50000000,
                'type': 'number'
            },
            {
                'name': 'MaxY',
                'value': -3989.50000000,
                'type': 'number'
            },
            {
                'name': 'BaseScale',
                'value': 2000,
                'type': 'number'
            }]
    }
};

export default gwtkOptions;
