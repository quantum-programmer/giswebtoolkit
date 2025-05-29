import { ContentTree, GwtkOptions } from '~/types/Options';

const hm_options = [
    {
        LayerName: 'noginsk_topo',
        alias: 'Тепловая карта 1',
        elemsize: 50,
        excodes: [
            1132100, 22520000, 61970000, 62131000, 62133000, 62315000, 44200000, 53420000, 53510000, 53530000
        ],
        palette: 0,
        palettecount: 0,
        radius: 3000
    },
    {
        LayerName: 'noginsk',
        alias: 'Тепловая карта 2',
        elemsize: 50,
        excodes: [
            71132000, 71111110, 71121300, 71223000, 71112300, 71314000, 71211220, 71126000, 71121511, 71610300
        ],
        palette: 0,
        palettecount: 0,
        radius: 3000
    }
];

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
            },
            {
                'id': 'osmMap',
                'text': 'OpenStreetMap',
                'img': 'ico_osm',
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
                'id': 'noginsk_topo',
                'text': 'Топографическая карта Ногинска',
                'img': 'icon-page',
                'clickable': true
            },
        ]
    }
];


const gwtkOptions: GwtkOptions = {
    'id': '3',
    'url': 'https://gisserver.info/GISWebServiceSE/service.php',
    'center': [55.855708, 38.441333],
    'tilematrix': 16,
    'isgeocenter':true,
    'tilematrixset': 'GoogleMapsCompatible',
    'helpUrl': '',
    'maxzoom': 19,
    'minzoom': 2,
    'locale': 'ru-ru',
    'layers': [
        {
            'id': 'osmMap',
            'alias': 'OpenStreetMap',
            'selectObject': false,
            'url': 'https://b.tile.openstreetmap.org/%z/%x/%y.png',
            'opacityValue': 100,
            'linkedUrls': []
        },
        {
            'id': 'worldmap',
            'alias': 'Карта мира',
            'selectObject': false,
            'url': 'SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=worldmap&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png',
            'version': '13.8.0',
            'gis': true,
            'hidden': 1,
            'opacityValue': 100,
            'linkedUrls': []
        },
        {
            'id': 'esriSat',
            'alias': 'Снимки',
            'selectObject': false,
            //'tilewms': 1,
            'url': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/%z/%y/%x',
            'url1': 'http://map.land.gov.ua/geowebcache/service/wms?REQUEST=GetMap&tiled=true&SERVICE=wms&VERSION=1.1.1&LAYERS=pcm_nsdi_gts&STYLES=default&FORMAT=image/png&HEIGHT=256&WIDTH=256&SRS=EPSG:3857&TRANSPARENT=TRUE&BGCOLOR=0xFEFEFE&BBOX=%bbox',
            'hidden': 1,
            'opacityValue': 100,
            'linkedUrls': []
        },
        {
            'id': 'noginsk',
            'alias': 'Богородский городской округ',
            'selectObject': true,
            'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=noginsk_area_3d&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'version': '13.8.0',
            'gis': true,
            'legend': '*',
            'opacityValue': 100,
            'keyssearchbyname': ['name'],
            'export': [],
            'semanticfilter': ['ObjName', 'building', 'amenity', 'material10'],
            'schemename': 'map5000m.xsd'
        },
        {
            'id': 'noginsk_topo',
            'alias': 'Топографическая карта Ногинска',
            'selectObject': true,
            'url': 'https://gisserver.info/GISWebServiceSE/service.php?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=0001&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'opacityValue': 100,
            'hidden': 1
        }
    ],

    hm_options,

    'controls': ['content', 'mapLog', 'buildheatmap', 'heatMap','search'],
    contenttree,
    controlspanel: false,
    extauth: false,
    'authheader': '',
    highlightmode: '',
    loggedbefore: false,
    measurementunit: { area: '', perimeter: '' },
    mergewmslayers: false,
    objectinfo: { area: false, number: false, semantic: false },
    pamauth: false,
    servicepam: false,
    shortlegend: 0,
    showsettings: false,
    useform: false,
    username: '',
    usetoken: false,
    params3d: { active: false, incline: 0, quality: 0, rotate: 0 },
};

export default gwtkOptions;
