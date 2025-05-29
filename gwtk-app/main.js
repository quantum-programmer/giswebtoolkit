const imageSemantics = ['DOCHOLDER', 'TxtFile', 'ObjName'];

const contenttree = [
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
                'id': 'map1',
                'text': 'Карты gisserver.info',
                'expanded': true,
                'img': 'icon-folder',
                'nodes': [
                    {
                        'id': 'noginsk_topo',
                        'text': 'Топографическая карта Ногинска',
                        'img': 'icon-page',
                        'clickable': true
                    }
                ]
            },
            // {
            //     'id': 'noginsk',
            //     'text': 'Богородский городской округ',
            //     'img': 'icon-page',
            //     'clickable': true
            // },
            // {
            //     'id': 'noginsk_veget',
            //     'text': 'Богородский ГО растительность',
            //     'img': 'icon-page',
            //     'clickable': true
            // },
            {
                'id': 'infrastructure3d',
                'text': 'Инфраструктура',
                'img': 'icon-page',
                'clickable': true
            },
            {
                'id': '8DDF8461-A115-431D-8F66-5E527D0A924C1',
                'text': 'Карта Ногинска',
                'img': 'icon-page',
                'clickable': true
            },
            // {
            //     'id': '8DDF8461-A115-431D-8F66-5E527D0A924C12',
            //     'text': 'Ногинск(ruin WGS84)',
            //     'img': 'icon-page',
            //     'clickable': true
            // },
            // {
            //     'id': '8DDF8461-A115-431D-8F66-5E527D0A924C1123',
            //     'text': 'Производство земляных работ',
            //     'img': 'icon-page',
            //     'clickable': true
            // },
            {
                'id': 'A397E116-F726-4541-AA2D-F183E180747Q',
                'text': 'FOLDER 1',
                'img': 'icon-folder',
                'clickable': true
            },
            // {
            //     'id': 'A397E116-F726-4541-AA2D-F183E180747R',
            //     'text': 'FOLDER GIS Server',
            //     'img': 'icon-folder',
            //     'clickable': true
            // },
            // {
            //     'id': 'A397E116-F726-4541-AA2D-F183E180747C',
            //     'text': 'МЧС',
            //     'img': 'icon-folder',
            //     'clickable': true
            // },
            // {
            //     'id': 'region',
            //     'text': 'Карта регионов',
            //     'img': 'icon-page',
            //     'clickable': true
            // },
            {
                'id': 'rosreestr',
                'text': 'Росреестр',
                'img': 'ico_rosreestr',
                'clickable': true
            },
            // {
            //     'id': 'kaliningrad',
            //     'text': 'Калининград',
            //     'img': 'icon-page',
            //     'clickable': true
            // },
            {
                'id': '42A0002F-FFDC-40A8-9786-988BDCA0620B',
                'text': 'Карелия',
                'img': 'icon-page',
                'clickable': true
            }
            // {
            //     'id': '42A0002F-FFDC-40A8-9786-988BDCA0620B1',
            //     'text': 'Карелия (почвы)',
            //     'img': 'icon-page',
            //     'clickable': true
            // }
        ]
    },
    // {
    //     'id': 'mapRyazan',
    //     'text': 'Карты РО',
    //     'expanded': true,
    //     'img': 'icon-folder',
    //     'nodes': [
    //         {
    //             'id': '99999999999',
    //             'text': 'Кластеры городская среда',
    //             'clickable': true,
    //             'img': 'icon-page',
    //         },
    //         {
    //             'id': '8888888888888',
    //             'text': 'Кластеры Здравоохранение',
    //             'clickable': true,
    //             'img': 'icon-page',
    //         },
    //     ]
    // },
    {
        'id': 'matr',
        'text': 'Матрицы высот',
        'expanded': true,
        'img': 'icon-folder',
        'nodes': [
            {
                'id': '8DDF8461-A115-431D-8F66-5E527D0A924D',
                'text': 'Московская область',
                'img': 'icon-page',
                'clickable': true
            },
            {
                'id': '8DDF8461-A115-431D-8F66-5E527D0A924E',
                'text': 'Матричная карта Ногинского района',
                'img': 'icon-page',
                'clickable': true
            }
        ]
    }
];

const settings_mapEditor = {
    'maplayersid': ['579B3E68-E717-42AC-86C5-5F7B7B5DC863','infrastructure3d', '8DDF8461-A115-431D-8F66-5E527D0A924C1', 'A397E116-F726-4541-AA2D-F183E180747Ritem0',],
    'functions': ['*'],
    'editingdata': [
        // {
        //     layerid: 'noginsk_ruin',
        //     objects: [
        //         {
        //             code: '31120000',
        //             semantics: ['ObjName']
        //         }
        //     ]
        // }
    ],
    'selectlayersid': ['infrastructure3d','8DDF8461-A115-431D-8F66-5E527D0A924C1'],
    'transaction': true,
    virtualfolders: [
        {
            id: 'A397E116-F726-4541-AA2D-F183E180747Q',
            paths: ['UserData/ca39995i', 'UserData/Geomon', 'UserData/podolsk'],
        }//,
        // {
        //     id: 'A397E116-F726-4541-AA2D-F183E180747R',
        //     paths: ['Noginsk_TEST/ca39995i', 'Noginsk_TEST/Geomon', 'Noginsk_TEST/Podolsk'],
        // }
    ]
};

const search_options = {
    'map': { 'id': 'GISWebServiceSE', 'visible': 1 },
    'address': {
        'visible': 1,
        'default': 0,
        'sources': [
            { 'type': 'PanoramaAddressBase', 'alias': 'Адресная база', 'url': 'https://address.gisserver.info/address/fias/address_fias.php', 'result': 100 },
            { 'type': 'Osm', 'alias': 'Osm', 'url': 'https://nominatim.openstreetmap.org/search', 'result': 50 },
            { 'type': 'Yandex', 'alias': 'Yandex', 'url': 'https://geocode-maps.yandex.ru/1.x/', 'result': 50 }
        ]
    },
    'rosreestr': { 'id': 'Rosreestr', 'visible': 1 },
    'default': 'address'
};

const cartogram = {
    source: [{
        url: 'https://gwserver.gisserver.info/GISWebServiceSE/service.php',
        layers: [
            // {
            //     id: 'region',
            //     alias: 'Регионы',
            //     keylist: '',
            //     semlink: 'SEM99',
            //     semlinkname: 'Субъект РФ'
            // },
            {
                id: 'noginsk_ruin_2d',
                alias: 'Карта Ногинска',
                // keylist: 'S0031132000,S0031120000',
                // keylist: 'S0031120000',
                semlink: 'ObjName',
                semlinkname: 'Собственное название'
            },
            {
                id: 'noginsk_area_3d',
                alias: 'Богородский городской округ',
                keylist: '',
                semlink: 'ObjName',
                semlinkname: 'Собственное название'
            },
            {
                id: 'infrastructure3d',
                alias: 'Инфраструктура',
                // keylist: '074-000-P',
                keylist: 'a_garage_b',
                semlink: 'ObjName',
                semlinkname: 'Собственное название'
            }//,
            // {
            //     id: 'kaliningrad',
            //     alias: 'kaliningrad',
            //     keylist: '',
            //     semlink: 'ObjName',
            //     semlinkname: 'Собственное название'
            // }
        ],
        folders: [
            { folder: 'USERFOLDER#UserData', alias: 'Folder 1' },
            { folder: 'HOST#192.168.1.40#2055#ALIAS#Noginsk_TEST', alias: 'Папка ГИС Сервера' }
        ]
    }],
    data: [{ url: 'адрес слоя', alias: 'название' }]
};

const copyright = {
    name: 'Panorama',
    startYear: '1991',
    privacyPolicy: {
        alias: 'Политика конфиденциальности',
        url: 'https://gisinfo.ru/privacy-policy.htm'
    }
};

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
        LayerName: '8DDF8461-A115-431D-8F66-5E527D0A924C1',
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

const mapmarkers = {
    // getimages: 'get-marker-images',
    // saveimage: 'save-marker-image',
    // deleteimage: 'delete-marker-images',
    // getcategory: 'get-image-categories',
    images: [
        'data:image/png;base64,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',
        'data:image/png;base64,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',
        'data:image/png;base64,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',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAKN2lDQ1BzUkdCIElFQzYxOTY2LTIuMQAAeJydlndUU9kWh8+9N71QkhCKlNBraFICSA29SJEuKjEJEErAkAAiNkRUcERRkaYIMijggKNDkbEiioUBUbHrBBlE1HFwFBuWSWStGd+8ee/Nm98f935rn73P3Wfvfda6AJD8gwXCTFgJgAyhWBTh58WIjYtnYAcBDPAAA2wA4HCzs0IW+EYCmQJ82IxsmRP4F726DiD5+yrTP4zBAP+flLlZIjEAUJiM5/L42VwZF8k4PVecJbdPyZi2NE3OMErOIlmCMlaTc/IsW3z2mWUPOfMyhDwZy3PO4mXw5Nwn4405Er6MkWAZF+cI+LkyviZjg3RJhkDGb+SxGXxONgAoktwu5nNTZGwtY5IoMoIt43kA4EjJX/DSL1jMzxPLD8XOzFouEiSniBkmXFOGjZMTi+HPz03ni8XMMA43jSPiMdiZGVkc4XIAZs/8WRR5bRmyIjvYODk4MG0tbb4o1H9d/JuS93aWXoR/7hlEH/jD9ld+mQ0AsKZltdn6h21pFQBd6wFQu/2HzWAvAIqyvnUOfXEeunxeUsTiLGcrq9zcXEsBn2spL+jv+p8Of0NffM9Svt3v5WF485M4knQxQ143bmZ6pkTEyM7icPkM5p+H+B8H/nUeFhH8JL6IL5RFRMumTCBMlrVbyBOIBZlChkD4n5r4D8P+pNm5lona+BHQllgCpSEaQH4eACgqESAJe2Qr0O99C8ZHA/nNi9GZmJ37z4L+fVe4TP7IFiR/jmNHRDK4ElHO7Jr8WgI0IABFQAPqQBvoAxPABLbAEbgAD+ADAkEoiARxYDHgghSQAUQgFxSAtaAYlIKtYCeoBnWgETSDNnAYdIFj4DQ4By6By2AE3AFSMA6egCnwCsxAEISFyBAVUod0IEPIHLKFWJAb5AMFQxFQHJQIJUNCSAIVQOugUqgcqobqoWboW+godBq6AA1Dt6BRaBL6FXoHIzAJpsFasBFsBbNgTzgIjoQXwcnwMjgfLoK3wJVwA3wQ7oRPw5fgEVgKP4GnEYAQETqiizARFsJGQpF4JAkRIauQEqQCaUDakB6kH7mKSJGnyFsUBkVFMVBMlAvKHxWF4qKWoVahNqOqUQdQnag+1FXUKGoK9RFNRmuizdHO6AB0LDoZnYsuRlegm9Ad6LPoEfQ4+hUGg6FjjDGOGH9MHCYVswKzGbMb0445hRnGjGGmsVisOtYc64oNxXKwYmwxtgp7EHsSewU7jn2DI+J0cLY4X1w8TogrxFXgWnAncFdwE7gZvBLeEO+MD8Xz8MvxZfhGfA9+CD+OnyEoE4wJroRIQiphLaGS0EY4S7hLeEEkEvWITsRwooC4hlhJPEQ8TxwlviVRSGYkNimBJCFtIe0nnSLdIr0gk8lGZA9yPFlM3kJuJp8h3ye/UaAqWCoEKPAUVivUKHQqXFF4pohXNFT0VFysmK9YoXhEcUjxqRJeyUiJrcRRWqVUo3RU6YbStDJV2UY5VDlDebNyi/IF5UcULMWI4kPhUYoo+yhnKGNUhKpPZVO51HXURupZ6jgNQzOmBdBSaaW0b2iDtCkVioqdSrRKnkqNynEVKR2hG9ED6On0Mvph+nX6O1UtVU9Vvuom1TbVK6qv1eaoeajx1UrU2tVG1N6pM9R91NPUt6l3qd/TQGmYaYRr5Grs0Tir8XQObY7LHO6ckjmH59zWhDXNNCM0V2ju0xzQnNbS1vLTytKq0jqj9VSbru2hnaq9Q/uE9qQOVcdNR6CzQ+ekzmOGCsOTkc6oZPQxpnQ1df11Jbr1uoO6M3rGelF6hXrtevf0Cfos/ST9Hfq9+lMGOgYhBgUGrQa3DfGGLMMUw12G/YavjYyNYow2GHUZPTJWMw4wzjduNb5rQjZxN1lm0mByzRRjyjJNM91tetkMNrM3SzGrMRsyh80dzAXmu82HLdAWThZCiwaLG0wS05OZw2xljlrSLYMtCy27LJ9ZGVjFW22z6rf6aG1vnW7daH3HhmITaFNo02Pzq62ZLde2xvbaXPJc37mr53bPfW5nbse322N3055qH2K/wb7X/oODo4PIoc1h0tHAMdGx1vEGi8YKY21mnXdCO3k5rXY65vTW2cFZ7HzY+RcXpkuaS4vLo3nG8/jzGueNueq5clzrXaVuDLdEt71uUnddd457g/sDD30PnkeTx4SnqWeq50HPZ17WXiKvDq/XbGf2SvYpb8Tbz7vEe9CH4hPlU+1z31fPN9m31XfKz95vhd8pf7R/kP82/xsBWgHcgOaAqUDHwJWBfUGkoAVB1UEPgs2CRcE9IXBIYMj2kLvzDecL53eFgtCA0O2h98KMw5aFfR+OCQ8Lrwl/GGETURDRv4C6YMmClgWvIr0iyyLvRJlESaJ6oxWjE6Kbo1/HeMeUx0hjrWJXxl6K04gTxHXHY+Oj45vipxf6LNy5cDzBPqE44foi40V5iy4s1licvvj4EsUlnCVHEtGJMYktie85oZwGzvTSgKW1S6e4bO4u7hOeB28Hb5Lvyi/nTyS5JpUnPUp2Td6ePJninlKR8lTAFlQLnqf6p9alvk4LTduf9ik9Jr09A5eRmHFUSBGmCfsytTPzMoezzLOKs6TLnJftXDYlChI1ZUPZi7K7xTTZz9SAxESyXjKa45ZTk/MmNzr3SJ5ynjBvYLnZ8k3LJ/J9879egVrBXdFboFuwtmB0pefK+lXQqqWrelfrry5aPb7Gb82BtYS1aWt/KLQuLC98uS5mXU+RVtGaorH1futbixWKRcU3NrhsqNuI2ijYOLhp7qaqTR9LeCUXS61LK0rfb+ZuvviVzVeVX33akrRlsMyhbM9WzFbh1uvb3LcdKFcuzy8f2x6yvXMHY0fJjpc7l+y8UGFXUbeLsEuyS1oZXNldZVC1tep9dUr1SI1XTXutZu2m2te7ebuv7PHY01anVVda926vYO/Ner/6zgajhop9mH05+x42Rjf2f836urlJo6m06cN+4X7pgYgDfc2Ozc0tmi1lrXCrpHXyYMLBy994f9Pdxmyrb6e3lx4ChySHHn+b+O31w0GHe4+wjrR9Z/hdbQe1o6QT6lzeOdWV0iXtjusePhp4tLfHpafje8vv9x/TPVZzXOV42QnCiaITn07mn5w+lXXq6enk02O9S3rvnIk9c60vvG/wbNDZ8+d8z53p9+w/ed71/LELzheOXmRd7LrkcKlzwH6g4wf7HzoGHQY7hxyHui87Xe4Znjd84or7ldNXva+euxZw7dLI/JHh61HXb95IuCG9ybv56Fb6ree3c27P3FlzF3235J7SvYr7mvcbfjT9sV3qID0+6j068GDBgztj3LEnP2X/9H686CH5YcWEzkTzI9tHxyZ9Jy8/Xvh4/EnWk5mnxT8r/1z7zOTZd794/DIwFTs1/lz0/NOvm1+ov9j/0u5l73TY9P1XGa9mXpe8UX9z4C3rbf+7mHcTM7nvse8rP5h+6PkY9PHup4xPn34D94Tz+49wZioAAAAJcEhZcwAALiMAAC4jAXilP3YAAASfSURBVHic7ZpdaBxVFMfPmZ3GrDG7plFbpSq2CiIimgiifZCCrfpQjBKqFFaDqBitYv3YXbeta1CT7QbrR2kr2JeYBzUUKy1NEfsifoBQKr6IPvlgKhRiQ7LaFbuZ4382m3RtZ2ZnMrN7Nzh/mMy9M2fO/M9vZ+7OTq4uIvR/lq7agGqFAFQbUK0QgKoTn0pyW7STEsTExUn6aEVe/lLhQwmAQp43XtxJu1H8tWYf7RS2PdeelMON9tJQAFODfLUeofdReA+Wc5oDcaiwkz8vzdLzHRn5rVGeGgLgqwHWu6L0gq5TFt1LbAMBBjHrcTW8fqJI796dlVK9vdUdAIq5q6uV9qF5i8tD2rAM45gEju3HbfFdHe3VD8DMAC/nVhrCp/oEFs1zAi4D+xq3xX75m16NZeV08C7rAEDTmKdzlOAoDaN7hd90APEUcvXganglnqZRwwj22T1QAH/k+EYUvxfNdUHmpTmQI8jdh3M805mWn4NKHAiAiZc4Gl9BmRaNkui2BJHTRutwjh9xNeSnT9Hgqrel6DehbwAzO3kDit+D5vV+c7mUCXg7zrkZILZgkDzqJ9miAUwO8ZUXRWgXMz3ix4APrcYyDghjZ0v04vKMnFxMEs8ADjzMkQ1d1I/i30Q3vpiTBqxNy3S6r5DjHV/8QHt6P5VZLwd7AoDLvfvebvoAzds9Way/Yvi+eA/eHp0Z5KdjGTnu9kBXAE4PcExvpTdwuT+LbmTRNuuvbtbpezw77J1l2n5pUqZrHVATwEyeNy2L0jtoXhWIxfrLfHbYgk+pF963xpLyiVOwLYCfBrhlVZTG8JvlgeA9NkQr4f1jQNg8UaTem7Lyj1WQLQAU37OEi18Qatho1oLmmNV+WwA40PdDRrOIDTpjt88WwK4iHdnaSsMY+B6icwPfZeT0c7Y59CeWyUr7LAkdiGfoiJG2DrYFkM2KgVWyspSF0fVg+WVGM0voWHtKHqzeZKTsw8OXoh7jJ2uHKJcnj54A4Id4EgPKN/im7Uf3DouQg4bQ+HxHY1qDldXdN424l6s3IHYHVtdYxO5D7In5DsaktRig+yy8/QJvQ8J0yGU5ZXkCEEvJFFYjGAvWYyy4AABMHI+nZP98H8/ndwKWFYAz1XHl2DybUC8AYBh0LJ6Wz6pyziJn3/lxgPJ7e1pGvNRjKhwDVBtQrRCAagOqFQJQbUC1QgCqDahWCEC1AdUKAag2oFohANUGVCsEoNqAaoUA3AQVcpwgjRJElcltGt1MFhNVNKbHC3lemB3CGsVt5rN0Iu7L87bdYBWoRShbeVtU2WD7L7pbq3IKGTTanpZRm9gFubsCNHqNqidA2FQlUn4HuKZGmClzksM9rs4trmeXdfwnp0bX4W9AAJbmreLK81IsLFA5ApjK8Vpdo200N3lxqakNY8J4yaC3OtLyrV2QIwAUvxur2wK31hhdjuV+1LAS6y67oFq3QDPMAfIrxxrCMUC1AdVyBiB0Eo8+qxvkpV6acNrpCMAo0WOaTk/igSYarKfGyJzlgho+dIpxBBDfJr9ilQnUVZMpHANUG1CtEIBqA6oVAlBtQLX+BaGKGIzuc9q7AAAAAElFTkSuQmCC',
        'data:image/png;base64,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',
        'data:image/png;base64,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'
    ]
};

const mymaps = [
    {
        url: 'https://gwserver.gisserver.info/GISWebServiceSE/service.php',
        virtualFolderList: ['USERFOLDER#UserData']
    }
];

const toolbarGroups = [
    {
        id: '9b4535f9-d433-362f-2123-a4585a038ab6',
        items:
            [
                'content',
                'legend',
                'maplog',
                'clearselect',
                'mapMarks'
            ]
    },
    {
        id: 'd39f0104-c59d-536e-aa9f-c59266fa1770',
        items:
            [
                'selectobjects',
                'selectobjectsimage',
                'selectedObjectPanel'
            ]
    },
    {
        id: 'f8818971-6ba4-1408-e3b0-9c9412539060',
        items:
            [
                'ruler',
                'polygonarea',
                'anglemeter',
                'mapcalculations',
                'builderofzone'
            ]
    },
    {
        id: 'd39f0104-c59d-536e-aa9f-c59266fa1771',
        items:
            [
                'search',
                'searchSem',
                'areasearch'
            ]
    }
];

const mapmarks = {
    url: 'https://gwserver.gisserver.info/GISWebServiceSE/service.php',
    url2: 'http://192.168.0.24/GISWebServiceSE/service.php',
    zoom: 12,
    layerid: 'worldmap'
};

const floodZone = {
    url: 'https://gwserver.gisserver.info/GISWebServiceSE/service.php',
    matrixList: [{ 'id': '0003', 'name': 'Матрица Ногинский ГО' }],
    virtualFolderList: [{ 'id': 'USERFOLDER#UserData', 'name': 'Зоны затопления' }]
};

const externalFunctions = [{ description: 'Запросить информацию из БД', name: 'userFunction_1' }, { description: 'Открыть пользовательский компонент', name: 'userFunction_2' }];

const gwtkOptions = {
    'id': '1',
    'url': 'https://gwserver.gisserver.info/GISWebServiceSE/service.php',
    'servicepam': false,
    'center': [55.855708, 38.441333],

    // 'maxbounds': [50, 30, 60, 40],
    'isgeocenter': true,
    'tilematrix': 16,
    'tilematrixset': 'GoogleMapsCompatible',
    'username': 'ANONYMOUS',
    'loggedbefore': true,
    'controlspanel': false,
    'helpUrl': '',
    'usetoken': false,
    'extauth': true,
    'authheader': '',
    //'authheader': 'Basic YWRtaW46YWRtaW4=',
    'pamauth': false,
    'useform': false,
    'maxzoom': 22,
    'minzoom': 2,
    'mergewmslayers': false,
    'showsettings': false,
    'locale': 'ru-ru',
    'shortlegend': 0,
    'measurementunit': { 'perimeter': 'km', 'area': 'sq km' },
    'highlightmode': 'paint',
    'holdFolderTreeNodes': false,
    'objectinfo': { 'number': true, 'area': true, 'semantic': true },
    'tempVirtualFolders': {
        'folders': [
            {
                'alias': 'Folder 1',
                'folder': 'USERFOLDER#UserData'
            },
            {
                'alias': 'Папка ГИС Сервера',
                'folder': 'HOST#192.168.1.40#2055#ALIAS#Noginsk_TEST'
            }
        ],
        'url': 'https://gwserver.gisserver.info/GISWebServiceSE/service.php'
    },
    'layers': [
        {
            'id': 'osmMap',
            'alias': 'OpenStreetMap',
            'selectObject': false,
            'url': 'https://b.tile.openstreetmap.org/%z/%x/%y.png',
            'opacityValue': 100,
            'hidden': 0,
            'linkedUrls': [],
            tags: ['osm', '1', '2', 'zxc', 'test1', 'test2', 'test3', 'test4', 'test51', 'test52', 'test53', 'test45', 'test55', 'test56']
        },
        {
            'id': 'worldmap',
            'alias': 'Карта мира',
            'selectObject': false,
            'url': 'https://gisserver.info/GISWebServiceSE/service.php?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=worldmap&STYLE=default&TILEMATRIXSET=%tilematrixset&TILEMATRIX=%z&TILEROW=%y&TILECOL=%x&FORMAT=image/png',
            'version': '13.8.0',
            'gis': true,
            'hidden': 1,
            'opacityValue': 100,
            'linkedUrls': [],
            tags: ['osm', '1', '2wwww'],
            'legend': '*'
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
        // {
        //     'id': 'noginsk',
        //     'alias': 'Богородский городской округ',
        //     'selectObject': true,
        //     'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=noginsk_area_3d&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
        //     'version': '13.8.0',
        //     'areapixel': 20,
        //     'gis': true,
        //     'legend': '*',
        //     'opacityValue': 100,
        //     'keyssearchbyname': ['ObjName'],
        //     'export': [],
        //     'semanticfilter': ['ObjName', 'building', 'amenity', 'material10'],
        //     'schemename': 'map5000m.xsd',
        //     'objnamesemantic': ['ObjName'],
        //     'tooltip': { objectName: true, layerName: true, semanticKeys: ['amenity', 'ObjName'], image: true },
        //     'filter0': {
        //         'textfilter': {
        //             'Filter': {
        //                 'AND': [
        //                     {
        //                         'OR': [
        //                             {
        //                                 'PropertyIsEqualTo': [
        //                                     {
        //                                         'PropertyName': 'osm_id',
        //                                         'Literal': '*7567560*'
        //                                     }
        //                                 ]
        //                             },
        //                             {
        //                                 'PropertyIsEqualTo': [
        //                                     {
        //                                         'PropertyName': 'ObjName',
        //                                         'Literal': '*Богородский торговый ряд*'
        //                                     }
        //                                 ]
        //                             }
        //                         ]
        //                     },
        //                     // {
        //                     //     'AND': [
        //                     //         {
        //                     //             'PropertyIsEqualTo': [
        //                     //                 {
        //                     //                     'PropertyName': 'osm_id',
        //                     //                     'Literal': '0'
        //                     //                 }
        //                     //             ]
        //                     //         },
        //                     //         {
        //                     //             'PropertyIsEqualTo': [
        //                     //                 {
        //                     //                     'PropertyName': 'ObjName',
        //                     //                     'Literal': 'Богородский торговый ряд'
        //                     //                 }
        //                     //             ]
        //                     //         }
        //                     //     ]
        //                     // }
        //                 ]
        //             }
        //         }
        //     },
        //     'filter1': { 'keylist': '241-000-V,307-000-P,328-000-P,248-000-L,237-000-L,286-100-L,253-000-L,237-000-S,253-000-S,308-020-S,286-100-S,294-000-P,294-000-S,T045-000-S,248-400-L_I,288-000-P,248-400-L,311-000-V,a_var_water,023-000-S,023-000-P,013-001-S,p_entrance,013-002-P,058-001-P,061-200-S,a_house_b,a_garage_b,a_school_b,a_detached_b,a_roof_b,a_warehouse_b,a_church_b,a_residential_b,a_train-station_b,a_constraction_b,a_kindergarten_b,a_apartments_b,a_commercial_b,a_hangar_b,a_industrial_b,a_public_b,a_yes_b,a_cathedral_b,a_dormitory_b,a_greenhouse_b,a_hospital_b,a_hotel_b,a_retail_b,a_shed_b,a_stable_b,a_supermarket_b,a_transportation_b,a_university_b,a_service_b,a_garages_b' },
        //     externalFunctions
        // },
        // {
        //     'id': 'noginsk_veget',
        //     'alias': 'Богородский городской округ растительность',
        //     'selectObject': true,
        //     'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=noginsk_area_3d&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
        //     'version': '15.1.1',
        //     'gis': true,
        //     'hidden': 1,
        //     'legend': '*',
        //     'opacityValue': 100,
        //     'keyssearchbyname': ['ObjName'],
        //     'semanticfilter': ['ObjName', 'building', 'amenity', 'material10'],
        //     'schemename': 'map5000m.xsd',
        //     'objnamesemantic': ['ObjName'],
        //     'tooltip': { objectName: true, layerName: true, semanticKeys: ['amenity', 'ObjName'], image: true },
        //     'filter': { 'keylist': '389-000-P,368-000-S,373-001-S,410-000-S,384-000-S,401-000-S,395-200-S,372-100-S,386-200-L,376-000-L' }
        // },
        // {
        //     'id': '99999999999',
        //     'alias': 'Кластеры городская среда',
        //     'selectObject': true,
        //     'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=городская среда&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
        //     'version': '15.1.1',
        //     'hidden': 1,
        //     'legend': '*',
        //     'objnamesemantic': ['type_object'],
        //     'opacityValue': 100,
        //     'schemename': 'nproject_1.xsd'
        // },
        // {
        //     'id': '8888888888888',
        //     'alias': 'Кластеры Здравоохранение',
        //     'selectObject': true,
        //     'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=Здравоохранение&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
        //     'version': '15.1.1',
        //     'hidden': 1,
        //     'legend': '*',
        //     'objnamesemantic': ['name_project'],
        //     'opacityValue': 100,
        //     'schemename': 'nproject_1.xsd'
        // },
        {
            'id': 'infrastructure3d',
            'alias': 'Инфраструктура',
            'selectObject': true,
            'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=infrastructure3d&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'version': '13.8.0',
            'gis': true,
            'hidden': 1,
            'opacityValue': 100,
            'keyssearchbyname': ['ObjName'],
            'export': [],
            'schemename': 'map5000m.xsd',
            'objnamesemantic': ['operator', 'ObjName'],
            'legend': '*'
        },
        {
            'id': 'noginsk_topo',
            'alias': 'Топографическая карта Ногинска',
            'selectObject': true,
            'url': 'https://gisserver.info/GISWebServiceSE/service.php?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=0001&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'version': '13.8.0',
            'gis': true,
            'legend': '*',
            'opacityValue': 100,
            'keyssearchbyname': ['ObjName'],
            'export': [],
            'semanticfilter': ['ObjName', 'building', 'amenity', 'material10'],
            'schemename': '200t05g.xsd',
            'hidden': 1
        },
        {
            'id': '8DDF8461-A115-431D-8F66-5E527D0A924C1',
            'alias': 'Карта Ногинска',
            'selectObject': true,
            'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=Photo_Noginsk_ruin_2d&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'version': '13.8.0',
            'gis': true,
            'opacityValue': 100,
            'keyssearchbyname': ['ObjName'],
            'export': ['gml', 'json', 'sxf', 'txf', 'csv'],
            'schemename': '200t051gm',
            // 'tooltip': { objectName: true, layerName: true, semanticKeys: [], image: true },
            'filter1': {
                'textfilter': {
                    'Filter': {
                        'AND': [
                            {
                                'OR': [
                                    {
                                        'PropertyIsEqualTo': [
                                            {
                                                'PropertyName': 'ObjName',
                                                'Literal': '000'
                                            }
                                        ]
                                    },
                                    {
                                        'PropertyIsEqualTo': [
                                            {
                                                'PropertyName': 'ObjName',
                                                'Literal': '111111'
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                'AND': [
                                    {
                                        'PropertyIsEqualTo': [
                                            {
                                                'PropertyName': 'ObjNumber',
                                                'Literal': '1'
                                            }
                                        ]
                                    },
                                    {
                                        'PropertyIsEqualTo': [
                                            {
                                                'PropertyName': 'LayerName',
                                                'Literal': '1'
                                            }
                                        ]
                                    }
                                ]
                            },
                        ]
                    }
                }
            },
            imageSemantics,
            externalFunctions
        },
        // {
        //     'id': '8DDF8461-A115-431D-8F66-5E527D0A924C12',
        //     'alias': 'Ногинск(WGS84)',
        //     'selectObject': true,
        //     'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=noginsk_ruin&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
        //     'version': '13.8.0',
        //     'gis': true,
        //     'hidden':1,
        //     'opacityValue': 100,
        //     'keyssearchbyname': ['ObjName'],
        //     'export': ['gml', 'json', 'sxf', 'txf', 'csv'],
        //     'schemename': '200t05gm',
        //     'tooltip': { objectName: true, layerName: true, semanticKeys: [], image: true },
        //     'filter1': {
        //         'textfilter': {
        //             'Filter': {
        //                 'AND': [
        //                     {
        //                         'OR': [
        //                             {
        //                                 'PropertyIsEqualTo': [
        //                                     {
        //                                         'PropertyName': 'ObjName',
        //                                         'Literal': '000'
        //                                     }
        //                                 ]
        //                             },
        //                             {
        //                                 'PropertyIsEqualTo': [
        //                                     {
        //                                         'PropertyName': 'ObjName',
        //                                         'Literal': '111111'
        //                                     }
        //                                 ]
        //                             }
        //                         ]
        //                     },
        //                     {
        //                         'AND': [
        //                             {
        //                                 'PropertyIsEqualTo': [
        //                                     {
        //                                         'PropertyName': 'ObjNumber',
        //                                         'Literal': '1'
        //                                     }
        //                                 ]
        //                             },
        //                             {
        //                                 'PropertyIsEqualTo': [
        //                                     {
        //                                         'PropertyName': 'LayerName',
        //                                         'Literal': '1'
        //                                     }
        //                                 ]
        //                             }
        //                         ]
        //                     },
        //                 ]
        //             }
        //         }
        //     },
        //     imageSemantics,
        //     externalFunctions
        // },
        {
            'id': 'rosreestr',
            'alias': 'Земельные участки росреестр',
            'selectObject': false,
            'url': 'https://pkk.rosreestr.ru/arcgis/rest/services/PKK6/CadastreObjects/MapServer/export?dpi=96&transparent=true&format=png32&bboxSR=102100&imageSR=102100&f=image&size=1024%2C1024&bbox=%bbox&_ts=false',
            'pkkmap': 1,
            'hidden': 1
        },
        {
            'id': '8DDF8461-A115-431D-8F66-5E527D0A924D',
            'alias': 'Московская область',
            'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/jpg&LAYERS=mosobl&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt\'',
            'gis': true,
            'hidden': 1,
            'legend': '*',
            'opacityValue': 85,
            'export': []
        },
        {
            'id': '8DDF8461-A115-431D-8F66-5E527D0A924E',
            'alias': 'Матричная карта Ногинского района',
            'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/jpg&LAYERS=0003&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt\'',
            'gis': true,
            'hidden': 1,
            'opacityValue': 85,
            'export': []
        },
        {
            'id': 'A397E116-F726-4541-AA2D-F183E180747Q',
            'alias': 'Folder 1',
            'selectObject': true,
            'url': 'https://gwserver.gisserver.info/GISWebServiceSE/service.php',
            'gis': true,
            'opacityValue': 100,
            'service': 'wms',
            'legend': '*',
            'datatype': ['SITX'],
            'folder': 'USERFOLDER#UserData',
            'layer_alias': 'USERFOLDER#'
        },
        // {
        //     'id': 'A397E116-F726-4541-AA2D-F183E180747R',
        //     'alias': 'Folder GIS SERVER',
        //     'selectObject': true,
        //     'url': 'https://gwserver.gisserver.info/GISWebServiceSE/service.php',
        //     'gis': true,
        //     'opacityValue': 100,
        //     'service': 'wms',
        //     'legend': '*',
        //     'datatype': ['SITX'],
        //     'folder': 'HOST#192.168.1.40#2055#ALIAS#Noginsk_TEST'
        // },
        // {
        //     'id': 'A397E116-F726-4541-AA2D-F183E180747C',
        //     'alias': 'Виртуальная папка МЧС',
        //     'selectObject': false,
        //     'url': 'https://gisserver.info/GISWebServiceSE/service.php',
        //     'gis': 1,
        //     'opacityValue': 100,
        //     'service': 'wmts',
        //     'datatype': ['MTW'],
        //     'folder': 'USERFOLDER#mchs',
        //     'layer_alias': 'USERFOLDER#'
        // },
        // {
        //     'id': 'kaliningrad',
        //     'alias': 'kaliningrad',
        //     'hidden': 1,
        //     'selectObject': true,
        //     'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=kaliningrad&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
        //     'version': '13.8.0',
        //     'gis': true,
        //     'legend': '*',
        //     'opacityValue': 100,
        //     'export': [],
        //     'schemename': 'mapreport.xsd'
        // },
        {
            'id': '42A0002F-FFDC-40A8-9786-988BDCA0620B',
            'alias': 'Карелия',
            'selectObject': true,
            'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=karelia&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
            'version': '14.4.2',
            'gis': true,
            'legend': '*',
            'opacityValue': 100,
            'export': [],
            'schemename': 'map5000m.xsd',
            'mapdb': true,
            'dbmfields': [],
            'zIndex': 3,
            'minzoomview': 2,
            'maxzoomview': 23,
            'norpc': 0,
            'hidden': 1,
            'dbnames': ['layers/settlements.dbm', 'layers/territories.dbm', 'layers/vegetation.dbm', 'layers/hydrogr.dbm', 'layers/soil.dbm', 'layers/indust.dbm', 'layers/social.dbm', 'layers/build.dbm', 'layers/road.dbm', 'layers/electr.dbm', 'layers/publicfacil.dbm', 'layers/boundss.dbm', 'layers/fonts.dbm', 'layers/settlements_and social_whit_query.dbm']
        },
        // {
        //     'id': '42A0002F-FFDC-40A8-9786-988BDCA0620B1',
        //     'alias': 'Карелия (почвы)',
        //     'selectObject': true,
        //     'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=agrolands&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
        //     'version': '14.4.2',
        //     'gis': true,
        //     'legend': '*',
        //     'opacityValue': 100,
        //     'export': [],
        //     'schemename': 'agro10t.xsd',
        //     'mapdb': true,
        //     'zIndex': 3,
        //     'minzoomview': 2,
        //     'maxzoomview': 23,
        //     'norpc': 0,
        //     'hidden': 1
        // },
        // {
        //     'id': '42A0002F-FFDC-40A8-9786-988BDCA0620A',
        //     'alias': 'uik',
        //     'selectObject': true,
        //     'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=uik&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
        //     'version': '14.4.2',
        //     'gis': true,
        //     'legend': '*',
        //     'opacityValue': 100,
        //     'export': [],
        //     'schemename': 'map5000m.xsd',
        //     'mapdb': true,
        //     'dbmfields': [],
        //     'zIndex': 3,
        //     'minzoomview': 2,
        //     'maxzoomview': 23,
        //     'norpc': 0,
        //     'hidden': 1,
        //     'dbnames': ['layers/uik']
        // },
        // {
        //     'id': 'region',
        //     'alias': 'регион',
        //     'selectObject': true,
        //     'url': 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=region01&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&dt=%dt',
        //     'gis': true,
        //     'legend': '*',
        //     'opacityValue': 50,
        //     'keyssearchbyname': ['ObjName'],
        //     'export': ['gml', 'json', 'sxf', 'txf'],
        //     'schemename': 'map5000m.xsd',
        //     'hidden': 1
        // }

    ],

    hm_options,

    mapmarkers,

    mymaps,

    toolbarGroups,

    mapmarks,

    floodZone,

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
    'cartogram': cartogram,
    'objects3d': [
        // {
        //     'id': 'noginsk',
        //     'obj': [{
        //         'code': '71111110',
        //         'local': 1,
        //         'objectkey': '368-000-S',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 1,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '71123000',
        //         'local': 1,
        //         'objectkey': '409-000-S',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 1,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '71126000',
        //         'local': 2,
        //         'objectkey': 'p_park',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 1,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '71325000',
        //         'local': 1,
        //         'objectkey': '416-000-S',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 1,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_house_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '51133100',
        //         'local': 1,
        //         'objectkey': '061-000-S',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_school_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_detached_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_warehouse_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_church_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_residential_b',
        //         'semlist': ['building_e_levels'],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 3, 'keySem': 'building_e_levels', 'heightSem': 3 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_train-station_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '46620000',
        //         'local': 1,
        //         'objectkey': '048-000-S',
        //         'semlist': ['building_e_levels'],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 5, 'keySem': 'building_e_levels', 'heightSem': 5 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_constraction_b',
        //         'semlist': ['building_e_levels'],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 3, 'keySem': 'building_e_levels', 'heightSem': 3 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_kindergarten_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_apartments_b',
        //         'semlist': ['building_e_levels'],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 3, 'keySem': 'building_e_levels', 'heightSem': 3 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_commercial_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_hangar_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_industrial_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_public_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_office_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200001',
        //         'local': 1,
        //         'objectkey': '013-001-S',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_yes_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_barracks_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_cathedral_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_civic_b',
        //         'semlist': ['building_e_levels'],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 3, 'keySem': 'building_e_levels', 'heightSem': 3 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_dormitory_b',
        //         'semlist': ['building_e_levels'],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 9, 'keySem': 'building_e_levels', 'heightSem': 3 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_hospital_b',
        //         'semlist': ['building_e_levels'],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 3, 'keySem': 'building_e_levels', 'heightSem': 3 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_hotel_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_hut_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_retail_b',
        //         'semlist': ['building_e_levels'],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 5, 'keySem': 'building_e_levels', 'heightSem': 5 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_shed_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_supermarket_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_terrace_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_transportation_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_university_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_heat_station_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_service_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_barrack_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '44200000',
        //         'local': 1,
        //         'objectkey': 'a_garages_b',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '45500000',
        //         'local': 1,
        //         'objectkey': '144-200-S',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '51231200',
        //         'local': 1,
        //         'objectkey': '097-100-S',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '51320000',
        //         'local': 0,
        //         'objectkey': 'l_line',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 1,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }, {
        //         'code': '71132000',
        //         'local': 2,
        //         'objectkey': '389-000-P',
        //         'semlist': [],
        //         'viewtype': 4,
        //         'cut': 0,
        //         'color': '#808080',
        //         'opacity': '0.75',
        //         'height': { 'heightDef': 15, 'keySem': '', 'heightSem': 1 }
        //     }],
        //     'options': { 'minzoom': 16, 'maxzoom': 16 }
        // },
        {
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
        },
        {
            'id': '0D3A1B7E-5BC3-4F6A-B449-1B49A1BBADF1',
            'alias': 'Крымский мост',
            'url': 'https://gisserver.info/GISWebServiceSE/service.php',
            'authtype': '',
            'hidden': 0,
            'idLayer': 'RuSouth',
            'zoomLevels': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']
        }
    ],
    'cluster': {
        'json': '\\RUS-MobileSpeedcams_Garmin.json',        // 'clusterifyFname': //'Chicago_crime_spots.json'	'NYPD_Motor_Vehicle_Collisions.json'	'busstops.json'
        'url': 'http://gisserver.info/geojson/GeoJSON.php'
    },
    'scenario3d': [
        {
            'id': 'scenarioRuSouth',
            'alias': 'Движение кораблей',
            'url': 'https://gwserver.gisserver.info/GISWebServiceSE/service.php',
            'description': 'Сценарий Ногинск'
        }
    ],
    'routecontrol': [
        {url: 'https://gisserver.info/GISWebServiceSE/service.php', layer: 'rusgraph', type: 'Panorama', alias: 'Маршруты', authtype: ''},
        {url: 'https://api-maps.yandex.ru/2.1/?lang=ru_RU', layer: '', type: 'Yandex', alias: 'Яндекс.Маршруты', authtype: ''}
    ],
    'controls': ['*'],
    search_options,
    contenttree,
    contenttreeviewtype:'bygroups',
    settings_mapEditor,
    copyright,
    mapoverview: {
        zoomStep: 4,
        // active: true,
        // url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/%z/%y/%x',
        url: 'https://b.tile.openstreetmap.org/%z/%x/%y.png',
    },
    remoteServices:[
        {type:'Yandex', apikey: 'b1586351-de06-4f3d-a210-1b6968ed3cf4', url:''},
        {type:'Rosreestr', apikey: '', url:'https://pkk.rosreestr.ru/api/features'}
    ]

};

if (window.GWTK) {
    loadFromUrl(gwtkOptions);
    theMapVue = new MapVue('dvMap', gwtkOptions);
}

function loadFromUrl(options) {
    const urlParams = window.location.search.substring(1).split('&');
    if (urlParams.length !== 0) {
        const forcedParams = {};
        for (let i = 0; i < urlParams.length; i++) {
            const getVar = urlParams[i].split('=');
            forcedParams[getVar[0]] = getVar[1] === undefined ? '' : getVar[1];
        }
        options.forcedParams = forcedParams;
    }
}

//для тестирования внешних функций
window.userFunction_1 = (mapObject) => {

    return new Promise(resolve => {
        window.setTimeout(() => resolve(`
        <table id="Table" style="border-collapse: collapse;">
        <tr>
            <td style="border: 1px solid black; padding: 2px; text-align: left;">Название объекта</td>
            <td style="border: 1px solid black; padding: 2px; text-align: left;">Имя слоя</td>
            <td style="border: 1px solid black; padding: 2px; text-align: left;">Номер объекта</td>
            <td style="border: 1px solid black; padding: 2px; text-align: left;">Название объекта (семантика)</td>
            <td style="border: 1px solid black; padding: 2px; text-align: left;">Дата</td>
        </tr>
        <tr>
            <td style="border: 1px solid black; padding: 2px; text-align: left;">${mapObject.objectName}</td>
            <td style="border: 1px solid black; padding: 2px; text-align: left;">${mapObject.layerName}</td>
            <td style="border: 1px solid black; padding: 2px; text-align: left;">${mapObject.objectNumber}</td>
            <td style="border: 1px solid black; padding: 2px; text-align: left;">${mapObject.objectNameBySemantic}</td>
            <td style="border: 1px solid black; padding: 2px; text-align: left;">${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}</td>
        </tr>
    </table>
    `), 1500);
    });


};

window.userFunction_2 = (mapObject) => {
    console.log(mapObject.gmlId);
};
