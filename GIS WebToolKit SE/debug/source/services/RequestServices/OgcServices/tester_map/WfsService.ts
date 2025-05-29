import WfsService from '~/services/RequestServices/OgcServices/WfsService';
import { GetFeatureUser } from '~/services/RequestServices/OgcServices/Types';

// Функции для тестирования WFS

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
    const wfs = new WfsService( { url: server } );
    let result: any = await wfs.describeFeatureType();
    onDataLoaded( result );
    result = await wfs.listStoredQueries();
    onDataLoaded( result );

    let queryfeature: GetFeatureUser = {
        TYPENAMES: 'bsd:Settlements',
        COUNT: '500',
        STARTINDEX: '0'
    };
    result = await wfs.getFeature( queryfeature );
    onDataLoaded( result );

    queryfeature = {
        ID: 'Ногинский район:209263'
    };
    result = await wfs.getFeatureById( queryfeature );
    onDataLoaded( result );

    result = await wfs.dimentions( { ID: 'Ногинский район:209263' } );
    onDataLoaded( result );

    const xInsert = '<?xml version="1.0" encoding="utf-8" ?><wfs:Transaction version="2.0.0" service="WFS" handle="Transaction 1" >' +
        '<wfs:Insert handle="Ins4"><bsd:Vegetation gml:id="Ногинский район">' +
        '<bsd:VegetationCode>71132100</bsd:VegetationCode>' +
        '<gml:name>ДЕРЕВЬЯ (не имеющие значения ориентиров)</gml:name>' +
        '<gml:Point srsName="urn:ogc:def:crs:EPSG:4326">' +
        '<gml:pos srsDimension="3">55.7531215306  38.3349540667 -111111.0</gml:pos>' +
        '</gml:Point>' +
        '</bsd:Vegetation>' +
        '</wfs:Insert></wfs:Transaction>';

    result = await wfs.transaction( { data: xInsert } );
    onDataLoaded( result );


    const xReplace = '<?xml version="1.0" encoding="utf-8" ?><wfs:Transaction version="2.0.0" service="WFS" handle="Transaction 2" >' +
        '<wfs:Replace handle="replace 01"><fes:Filter><fes:ResourceId rid="Ногинский район:209263" /></fes:Filter>' +
        '<bsd:Vegetation gml:id="id209263">' +
        '<bsd:VegetationCode>71100000</bsd:VegetationCode>' +
        '<gml:name>ДРЕВЕСНАЯ  РАСТИТЕЛЬНОСТЬ</gml:name>' +
        '<gml:Polygon srsName="urn:ogc:def:crs:EPSG:4326">' +
        '<gml:exterior><gml:LineString>' +
        '<gml:posList srsDimension="2" count="9">55.7509419844 38.1351148613 55.7494491867 38.1402435206 55.7491871219 38.1413639697 55.7509036941 38.1429183731 55.7512649677 38.1432288919 55.7522287416 38.1395449989 55.7524041563 38.1389041549 55.7524728304 38.1357177285 55.7509419844 38.1351148613</gml:posList>' +
        '</gml:LineString></gml:exterior></gml:Polygon></bsd:Vegetation>' +
        '</wfs:Replace></wfs:Transaction>';

    result = await wfs.transaction( { data: xReplace } );
    onDataLoaded( result );


    const xDelete = '<?xml version="1.0" encoding="utf-8" ?><wfs:Transaction version="2.0.0" service="WFS" handle="Transaction 3" >' +
        '<wfs:delete handle="delete4" typeName="bsd:Settlements">' +
        '<fes:Filter><fes:ResourceId rid="Ногинский район:8742"/></fes:Filter>' +
        '</wfs:delete>' +
        '</wfs:Transaction>';
    result = await wfs.transaction( { data: xDelete } );
    onDataLoaded( result );
})();
