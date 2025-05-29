import { GwtkOptions, SearchType } from '~/types/Options';


const gwtkTestOptionsNoginskTemplates: GwtkOptions = {
    'helpUrl': '',
    'useform': false,
    'id': '8',
    'url': 'https://gisserver.info/GISWebServiceSE/service.php',
    'servicepam': false,
    'center': [
        55.856859,
        38.441861
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
    'maxzoom': 19,
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
            'id': 'infrastr',
            'alias': 'Инфраструктура',
            'selectObject': false,
            'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=infrastructure3d&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'version': '13.8.0',
            'gis': true,
            'hidden': 1,
            'opacityValue': 100,
            'keyssearchbyname': [
                'NAME'
            ],
            'export': [],
            'schemename': '200t05g.xsd',
            'bbox': [
                55.60506548,
                37.96430858,
                56.14955817,
                38.76064263
            ],
            'after': 'worldmap'
        },
        {
            'id': '4741B0D6-C9D1-480B-9F8F-8996209412DC',
            'alias': 'Богородский городской округ',
            'selectObject': true,
            'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png8&LAYERS=noginsk_area_3d&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'version': '13.8.0',
            'gis': true,
            'opacityValue': 100,
            'export': [],
            'schemename': '200t05g.xsd',
            'bbox': [
                55.65378737,
                38.01509753,
                56.15889117,
                38.71283462
            ],
            'after': 'infrastr'
        }
    ],
    'matrix': [
        {
            'id': 'coverage1',
            'alias': 'Матрица высот на мир',
            'url': 'https://gisserver.info/GISWebServiceSE/service.php?LAYER=worldMatrix&METHOD=GETCOVERAGETILE&tilematrixset=%tilematrixset&tilerow=%tilerow&tilecol=%tilecol&tilematrix=%scale&service=WCS&format=wcs',
            'authtype': ''
        }
    ],
    'params3d': {
        'quality': 100,
        'active': true,
        'rotate': -0.2208929999999949,
        'incline': 0.36716199999999416
    },
    'objects3d': [
        {
            'id': '4741B0D6-C9D1-480B-9F8F-8996209412DC',
            'obj': [
                {
                    'code': '71111110',
                    'local': 1,
                    'objectkey': '368-000-S',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 1,
                    'color': '#aed1a0',
                    'opacity': '0.75',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '71123000',
                    'local': 1,
                    'objectkey': '409-000-S',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 1,
                    'color': '#CECECE',
                    'opacity': '0.75',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '71126000',
                    'local': 2,
                    'objectkey': 'p_park',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 1,
                    'color': '#CECECE',
                    'opacity': '0.75',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '71325000',
                    'local': 1,
                    'objectkey': '416-000-S',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 1,
                    'color': '#CECECE',
                    'opacity': '0.75',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_house_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '51133100',
                    'local': 1,
                    'objectkey': '061-000-S',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_school_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_detached_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_warehouse_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_church_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_residential_b',
                    'semlist': [
                        'building_e_levels'
                    ],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 3,
                        'keySem': 'building_e_levels',
                        'heightSem': 3
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_train-station_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '46620000',
                    'local': 1,
                    'objectkey': '048-000-S',
                    'semlist': [
                        'building_e_levels'
                    ],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 5,
                        'keySem': 'building_e_levels',
                        'heightSem': 5
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_constraction_b',
                    'semlist': [
                        'building_e_levels'
                    ],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 3,
                        'keySem': 'building_e_levels',
                        'heightSem': 3
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_kindergarten_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_apartments_b',
                    'semlist': [
                        'building_e_levels'
                    ],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 3,
                        'keySem': 'building_e_levels',
                        'heightSem': 3
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_commercial_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_hangar_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_industrial_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_public_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_office_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200001',
                    'local': 1,
                    'objectkey': '013-001-S',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_yes_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_barracks_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_cathedral_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_civic_b',
                    'semlist': [
                        'building_e_levels'
                    ],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 3,
                        'keySem': 'building_e_levels',
                        'heightSem': 3
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_dormitory_b',
                    'semlist': [
                        'building_e_levels'
                    ],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 9,
                        'keySem': 'building_e_levels',
                        'heightSem': 3
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_hospital_b',
                    'semlist': [
                        'building_e_levels'
                    ],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 3,
                        'keySem': 'building_e_levels',
                        'heightSem': 3
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_hotel_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_hut_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_retail_b',
                    'semlist': [
                        'building_e_levels'
                    ],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 5,
                        'keySem': 'building_e_levels',
                        'heightSem': 5
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_shed_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_supermarket_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_terrace_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_transportation_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_university_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_heat_station_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_service_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_barrack_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '44200000',
                    'local': 1,
                    'objectkey': 'a_garages_b',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '45500000',
                    'local': 1,
                    'objectkey': '144-200-S',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '51231200',
                    'local': 1,
                    'objectkey': '097-100-S',
                    'semlist': [],
                    'viewtype': 1,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '88800160',
                    'local': 3,
                    'objectkey': '492-210-T',
                    'semlist': [],
                    'viewtype': 3,
                    'cut': 0,
                    'color': '#000000',
                    'opacity': '1',
                    'height': {
                        'heightDef': 3,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '71132000',
                    'local': 2,
                    'objectkey': '389-000-P',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 0,
                    'color': '#CECECE',
                    'opacity': '1',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '31650000',
                    'local': 2,
                    'objectkey': '307-000-P',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#CECECE',
                    'opacity': '0.75',
                    'height': {
                        'heightDef': 40,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '51320000',
                    'local': 0,
                    'objectkey': 'l_line',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#CECECE',
                    'opacity': '0.75',
                    'height': {
                        'heightDef': 40,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '71132110',
                    'local': 2,
                    'objectkey': '389-200-P',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#CECECE',
                    'opacity': '0.75',
                    'height': {
                        'heightDef': 40,
                        'keySem': '',
                        'heightSem': 1
                    }
                }
            ],
            'options': {
                'minzoom': 15,
                'maxzoom': 17
            }
        },
        {
            'id': 'infrastr',
            'obj': [
                {
                    'code': '10715',
                    'local': 2,
                    'objectkey': 'p_car_wash',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '2000727',
                    'local': 2,
                    'objectkey': 'p_taxi',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612102',
                    'local': 2,
                    'objectkey': 'p_pharmacy',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612103',
                    'local': 2,
                    'objectkey': 'p_clinic',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612104',
                    'local': 2,
                    'objectkey': 'p_dentist',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612105',
                    'local': 2,
                    'objectkey': 'p_doctors',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612107',
                    'local': 2,
                    'objectkey': 'p_veterinary',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612201',
                    'local': 2,
                    'objectkey': 'p_school',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612202',
                    'local': 2,
                    'objectkey': 'p_kindergarten',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612203',
                    'local': 2,
                    'objectkey': 'p_college',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612204',
                    'local': 2,
                    'objectkey': 'p_university',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612205',
                    'local': 2,
                    'objectkey': 'p_driving_school',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612301',
                    'local': 2,
                    'objectkey': 'p_theatre',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612302',
                    'local': 2,
                    'objectkey': 'p_library',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612303',
                    'local': 2,
                    'objectkey': 'p_museum',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612304',
                    'local': 2,
                    'objectkey': 'p_arts_centre',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612401',
                    'local': 2,
                    'objectkey': 'p_police',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612402',
                    'local': 2,
                    'objectkey': 'p_fire_station',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53613000',
                    'local': 2,
                    'objectkey': 'p_tourism',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53623000',
                    'local': 2,
                    'objectkey': 'p_shop',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53623200',
                    'local': 2,
                    'objectkey': 'p_ice_cream',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53624001',
                    'local': 2,
                    'objectkey': 'p_restaurant',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53624002',
                    'local': 2,
                    'objectkey': 'p_cafe',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53624003',
                    'local': 2,
                    'objectkey': 'p_fast_food',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53624004',
                    'local': 2,
                    'objectkey': 'p_pub',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53624005',
                    'local': 2,
                    'objectkey': 'p_bar',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53624007',
                    'local': 2,
                    'objectkey': 'p_nightclub',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53632101',
                    'local': 2,
                    'objectkey': 'p_bank',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53632102',
                    'local': 2,
                    'objectkey': 'p_post_office',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53632105',
                    'local': 2,
                    'objectkey': 'p_courthouse',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53632106',
                    'local': 2,
                    'objectkey': 'p_townhall',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53641000',
                    'local': 2,
                    'objectkey': 'p_cinema',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53650001',
                    'local': 2,
                    'objectkey': 'p_hotel',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53650003',
                    'local': 2,
                    'objectkey': 'p_viewpoint',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53650012',
                    'local': 2,
                    'objectkey': 'p_attraction',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53650019',
                    'local': 2,
                    'objectkey': 'p_vending_machine',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53661002',
                    'local': 2,
                    'objectkey': 'p_bench',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53661003',
                    'local': 2,
                    'objectkey': 'p_toilets',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53661004',
                    'local': 2,
                    'objectkey': 'p_atm',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53661005',
                    'local': 2,
                    'objectkey': 'p_bicycle_parking',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53661010',
                    'local': 2,
                    'objectkey': 'p_drinking_water',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53662001',
                    'local': 2,
                    'objectkey': 'p_recycling',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53662002',
                    'local': 2,
                    'objectkey': 'p_waste_disposal',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53662003',
                    'local': 2,
                    'objectkey': 'p_waste_basket',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53662004',
                    'local': 2,
                    'objectkey': 'p_bicycle_rental',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53673300',
                    'local': 2,
                    'objectkey': 'p_car_rental',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53720220',
                    'local': 2,
                    'objectkey': 'p_marina',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '51220000',
                    'local': 2,
                    'objectkey': '096-000-P',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '51420000',
                    'local': 2,
                    'objectkey': '074-000-P',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                },
                {
                    'code': '53612000',
                    'local': 2,
                    'objectkey': 'D-53612000-P',
                    'semlist': [],
                    'viewtype': 4,
                    'cut': 1,
                    'color': '#808080',
                    'opacity': '1.0',
                    'height': {
                        'heightDef': 15,
                        'keySem': '',
                        'heightSem': 1
                    }
                }
            ],
            'options': {
                'minzoom': 16,
                'maxzoom': 16
            }
        },
        {
            'id': '54C566C0-1463-41EB-8276-FBE7B49CDF5B',
            'alias': 'Модели Ногинска',
            'url': 'https://gisserver.info/GISWebServiceSE/service.php',
            'authtype': '',
            'hidden': 0,
            'idLayer': 'noginsk_area_3d',
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
        'transitiontopoint',
        'maplink',
        'viewoptions',
        'geolocation',
        'map3d',
        'objectPanel'
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
                    'id': '4741B0D6-C9D1-480B-9F8F-8996209412DC',
                    'text': 'Богородский городской округ',
                    'img': 'ico_panorama',
                    'clickable': true
                },
                {
                    'id': 'infrastr',
                    'text': 'Инфраструктура',
                    'img': 'ico_panorama',
                    'clickable': true
                }
            ]
        }
    ]
};

export default gwtkTestOptionsNoginskTemplates;
