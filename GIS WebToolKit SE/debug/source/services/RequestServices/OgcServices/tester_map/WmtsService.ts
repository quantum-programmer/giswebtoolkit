import WmtsService from '~/services/RequestServices/OgcServices/WmtsService';

import { GetFeatureInfoWmtsUser } from '~/services/RequestServices/OgcServices/Types';

// Функции для тестирования WMTS

const server = 'http://gisserver.info/GISWebServiceSE/service.php';

function onDataLoaded( response: { data?: string; error?: string; } ) {
    if ( response.error ) {
        console.warn( response.error );
    } else {
        const elem = document.createElement( 'div' );
        elem.innerText = response.data || '';
        if ( elem.innerText.length > 400 ) {
            elem.innerText = elem.innerText.slice( 0, 400 );
        }
        document.body.appendChild( elem );
    }
}


(async () => {
    const wmts = new WmtsService( { url: server } );
    let result: any = await wmts.getCapabilities();
    onDataLoaded( result );

    let querytiles: any = {
        'layer': 'noginsk_area',
        'matrix': 'GlobalCRS84Scale',
        'style': 'default',
        'format': 'image/jpg',
        'zoom': '11',
        'min': ['3390', '529']
    };

    const urls = await wmts.tileUrl( querytiles );
    let image = document.createElement( 'img' );
    image.src = urls[ 0 ];
    document.body.appendChild( image );

    querytiles = {
        'layer': 'noginsk_area',
        'matrix': 'GlobalCRS84Scale',
        'style': 'default',
        'format': 'image/jpg',
        'zoom': '11',
        'min': ['3390', '529'],
        'max': ['3390', '529']
    };

    result = await wmts.tileImage( querytiles );
    image = document.createElement( 'img' );
    image.src = URL.createObjectURL( result.data );
    document.body.appendChild( image );

    let queryfeature: GetFeatureInfoWmtsUser = {
        LAYER: 'noginsk_area',
        TILEMATRIXSET: 'GoogleMapsCompatible',
        STYLE: 'default',
        FORMAT: 'image/jpg',
        TILEMATRIX: '10',
        TILEROW: '319',
        TILECOL: '621',
        INFO_FORMAT: 'text/html',
        FEATURE_COUNT: '5',
        I: '100',
        J: '50'
    };

    result = await wmts.getFeatureInfo( queryfeature );
    onDataLoaded( result );
})();
