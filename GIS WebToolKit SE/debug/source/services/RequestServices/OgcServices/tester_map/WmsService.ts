// Функции для тестирования WMS

import WmsService from '~/services/RequestServices/OgcServices/WmsService';

import { GetFeatureInfoWmsUser, GetMapUser } from '~/services/RequestServices/OgcServices/Types';
import { ServiceResponse } from '~/services/Utils/Types';

const server = 'http://gisserver.info/GISWebServiceSE/service.php';

function onDataLoaded( response: ServiceResponse<string> ) {
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
    const wms = new WmsService( { url: server } );
    let result = await wms.getCapabilities( );
    onDataLoaded( result );
    const queryfeature: GetFeatureInfoWmsUser = {
        LAYERS: 'noginsk_area',
        CRS: 'EPSG:3395',
        STYLES: 'default',
        FORMAT: 'image/jpg',
        BBOX: '4209698.567,7437247.162,4330266.341,7563757.536',
        WIDTH: '256',
        HEIGHT: '256',
        QUERY_LAYERS: 'noginsk_area',
        I: '100',
        J: '150',
        INFO_FORMAT: 'text/xml'
    };
    result = await wms.getFeatureInfo( queryfeature );
    onDataLoaded( result );

    const param: GetMapUser = {
        LAYERS: 'noginsk_area',
        CRS: 'EPSG:3395',
        STYLES: 'default',
        FORMAT: 'image/jpg',
        BBOX: '4209698.567,7437247.162,4330266.341,7563757.536',
        WIDTH: '256',
        HEIGHT: '256'
    };

    const mapurl = wms.createGetMapUrl( param );
    const image = document.createElement( 'img' );
    image.src = mapurl;
    document.body.appendChild( image );
})();
