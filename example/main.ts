import gwtkOptions from './gwtk-test-options';
import MapVue from './MapVue';
import {SimpleJson} from '~/types/CommonTypes';
import {TranslateDescription} from '~/translate/Types';
// import gwtkTestOptionsHeatMap from './gwtk-test-options-heat-map';
// import gwtkTestOptionsNew from './gwtk-test-options.new';
// import gwtkTestOptionsUtm from './gwtk-test-options.utm';
// import gwtkRgisroOptions from './gwtk-rgisro-options';
// import gwtkTestOptionsMoscow from './gwtk-test-options-moscow';
// import gwtkTestOptionsTomsk from './gwtk-test-options-tomsk';
// import gwtkOptionsKirghiz from './gwtk-test-options-kirghiz';
// import gwtkTestOptionsNoginskTemplates from './gwtk-test-options--noginsk-templates';

const projectionDescription: SimpleJson<TranslateDescription> = {
    'Id=Photo_test_utmUrl=https://gwserver.gisserver.info/GISWebServiceSE/service.phpTileSize=256': [
        {
            'name': 'Name',
            'value': 'test_utm',
            'type': 'string'
        },
        {
            'name': 'Scale',
            'value': 200000,
            'type': 'number'
        },
        {
            'name': 'EPSGCode',
            'value': 32637,
            'type': 'number'
        },
        {
            'name': 'EllipsoideKind',
            'value': 9,
            'type': 'number'
        },
        {
            'name': 'HeightSystem',
            'value': 27,
            'type': 'number'
        },
        {
            'name': 'MaterialProjection',
            'value': 17,
            'type': 'number'
        },
        {
            'name': 'CoordinateSystem',
            'value': 2,
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
            'value': 2,
            'type': 'number'
        },
        {
            'name': 'MapType',
            'value': 11,
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
            'value': 2,
            'type': 'number'
        },
        {
            'name': 'ZoneNumber',
            'value': 7,
            'type': 'number'
        },
        {
            'name': 'FirstMainParallel',
            'value': 0.00000000,
            'type': 'number'
        },
        {
            'name': 'SecondMainParallel',
            'value': 0.00000000,
            'type': 'number'
        },
        {
            'name': 'AxisMeridian',
            'value': 0.68067841,
            'type': 'number'
        },
        {
            'name': 'MainPointParallel',
            'value': 0.00000000,
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
            'value': 500000.00000000,
            'type': 'number'
        },
        {
            'name': 'ScaleFactor',
            'value': 0.99960000,
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
            'value': 1,
            'type': 'number'
        },
        {
            'name': 'MinX',
            'value': 6164550.00000000,
            'type': 'number'
        },
        {
            'name': 'MinY',
            'value': 436850.00000000,
            'type': 'number'
        },
        {
            'name': 'MaxX',
            'value': 6220050.00000000,
            'type': 'number'
        },
        {
            'name': 'MaxY',
            'value': 483800.00000000,
            'type': 'number'
        },
        {
            'name': 'BaseScale',
            'value': 200000,
            'type': 'number'
        }]
};

gwtkOptions.layerprojection = projectionDescription;

const mapVue = new MapVue('dvMap', gwtkOptions);

mapVue.ready.finally(() => {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        document.body.removeChild(loadingScreen);
    }
});

(window as any).theMapVue = mapVue;
