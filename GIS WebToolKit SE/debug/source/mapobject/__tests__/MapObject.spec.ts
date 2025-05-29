/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Тестирование класса                        *
 *                            MapObject                             *
 *                                                                  *
 *******************************************************************/

import 'jest';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import { LOCALE } from '~/types/CommonTypes';
import Style from '~/style/Style';
import Fill from '~/style/Fill';
import { FeatureProperties } from '~/utils/GeoJSON';
import GeoPoint from '~/geo/GeoPoint';
import PixelPoint from '~/geometry/PixelPoint';

/**
 * Объект карты
 * @class MapObject
 */

jest.mock( '~/maplayers/VectorLayer', () => {
    return {
        __esModule: true,
        default: () => ({
            options: { tilematrixset: 'GoogleMapsCompatible' },
            map: { pixelToGeo: ( point: PixelPoint ) => new GeoPoint( point.x, point.y ) },
            getLegendImage: () => null,
            getObjectImages: () => [],
        })
    };
} );


describe( 'MapObject:', () => {
    let instance: MapObject, vectorLayer: VectorLayer, properties: FeatureProperties;

    beforeEach( () => {
        vectorLayer = new VectorLayer( {} as any, {} as any );
        properties = {
            id: 'Nog:34',
            key: 'fooKey',
            layer: 'fooLayer',
            layerid: 'fooLayerId',
            mapid: 'fooMapId',
            name: 'fooName',
            objectfirstpointx: 1,
            objectfirstpointy: 2,
            schema: 'foo.xsd',
            semantics: [{
                key: 'address',
                name: 'barName',
                code: 'barCode',
                value: 'barValue'
            }, {
                key: 'name',
                name: 'bazName',
                code: 'bazCode',
                value: 'bazValue'
            }],

            code: 123,
            // SEM3DVIEWFILE?: string;
            // height?: {
            //     heightDef: number;
            //     heightSem?: number;
            //     heightConstSem?: number;
            //     keySem?: string;
            // };
            // viewtype?: number;
            local: LOCALE.Plane,
            // localization?: LOCALE;// пока для 3D
            // colorValue?: Vector4D;

            // __service?: { simplePolygon?: true; };
            title: 'fooTitle',
            // fontSize?: number;

            // topscale?: number;
            // bottomscale?: number;

            area: 234,
            perimeter: 345,

            sld: [
                {
                    type: 'LineSymbolizer',
                    'stroke': '#121212',
                    'stroke-opacity': 0.5,
                    'stroke-width': '3px',
                    'stroke-linejoin': 'mitre',
                    'stroke-linecap': 'butt',
                    'stroke-dasharray': '5 4 5',
                    'stroke-dashoffset': 2
                },
                {
                    type: 'PolygonSymbolizer',
                    'fill': '#A1A1A1',
                    'fill-opacity': 0.6
                },
                {
                    'type': 'HatchSymbolizer',
                    'stroke': '#BABABA',
                    'stroke-opacity': 0.123,
                    'stroke-width': '2px',
                    'stroke-angle': 10,
                    'stroke-step': '5'
                }
            ]
        };

        instance = new MapObject( vectorLayer, MapObjectType.Polygon, properties );
        instance.isDirty = false;

    } );

    describe ( 'create instance:', () => {
        test( 'clear instance was created', () => {
            const instance = new MapObject( vectorLayer );
            expect( instance ).toBeInstanceOf( MapObject );

            expect( instance.vectorLayer ).toEqual( vectorLayer );
            //expect( instance.type ).toEqual( MapObjectType.LineString );

            expect( instance.objectImages ).toEqual( [] );
            expect( instance.id.indexOf( 'object_' ) ).toEqual( 0 );
            expect( instance.newFlag ).toEqual( true );
            expect( instance.address ).toBeFalsy();
            expect( instance.objectNameBySemantic ).toBeFalsy();
            expect( instance.objectArea ).toBeFalsy();
            expect( instance.objectPerimeter ).toBeFalsy();
            expect( instance.objectNumber ).toEqual( 0 );
            expect( instance.code ).toBeFalsy();
            expect( instance.key ).toBeFalsy();
            expect( instance.layerId ).toBeFalsy();
            expect( instance.layerName ).toBeFalsy();
            expect( instance.mapId ).toBeFalsy();
            expect( instance.objectName ).toBeFalsy();
            expect( instance.schema ).toBeFalsy();
            expect( instance.sheetName ).toBeFalsy();
            expect( instance.title ).toBeFalsy();

            expect( instance.mapObjectPictureUrl ).toBeFalsy();
            expect( instance.mapObjectIconUrl ).toBeFalsy();
            expect( instance.isDirty ).toEqual( true );
            //expect( instance.local ).toEqual( LOCALE.Template );
            expect( instance.gmlId ).toBeFalsy();
            expect( instance.styles ).toBeFalsy();
        } );

        test( 'instance was created with properties', () => {

            expect( instance ).toBeInstanceOf( MapObject );

            expect( instance.vectorLayer ).toEqual( vectorLayer );
            //expect( instance.type ).toEqual( MapObjectType.Polygon );

            expect( instance.objectImages ).toEqual( [] );
            expect( instance.id.indexOf( 'object_' ) ).toEqual( 0 );
            expect( instance.address ).toEqual( properties.semantics![ 0 ].value );
            expect( instance.newFlag ).toEqual( false );
            //expect( instance.objectNameBySemantic ).toEqual( properties.semantics![ 1 ].value );
            expect( instance.objectArea ).toEqual( properties.area );
            expect( instance.objectPerimeter ).toEqual( properties.perimeter );
            expect( instance.objectNumber ).toEqual( parseInt( properties.id?.split( ':' )[ 1 ]! ) );
            expect( instance.code ).toEqual( properties.code );
            expect( instance.key ).toEqual( properties.key );
            expect( instance.layerId ).toEqual( properties.layerid );
            expect( instance.layerName ).toEqual( properties.layer );
            expect( instance.mapId ).toEqual( properties.mapid );
            expect( instance.objectName ).toEqual( properties.name );
            expect( instance.schema ).toEqual( properties.schema );
            expect( instance.sheetName ).toEqual( properties.id?.split( ':' )[ 0 ] );
            expect( instance.title ).toEqual( properties.title );

            expect( instance.mapObjectPictureUrl ).toEqual( undefined );
            //expect( instance.mapObjectIconUrl ).toEqual( '' );
            expect( instance.isDirty ).toEqual( false );
            //expect( instance.local ).toEqual( properties.local );
            //expect( instance.gmlId ).toEqual( properties.id!.replace( ':', '.' ) );
            expect( instance.gmlId ).toEqual( properties.id! );

            //expect( instance.styles ).toEqual( [Style.fromServiceSVG( properties.sld![ 0 ] )] );
        } );
    } );

    // test( 'sets local value', () => {
    //     instance.local = LOCALE.Plane;
    //     expect( instance.local ).toEqual( LOCALE.Plane );
    // } );

    describe ( 'sets gmlId, sheetName and objectNumber values:', () => {
        const sheetName = 'AnyValue';
        const objectNumber = 37;
        let gmlId = sheetName + '.' + objectNumber;

        beforeEach (() => {
            instance.gmlId = gmlId;
        } );

        test( 'set gmlId', () => {
            expect( instance.gmlId ).toEqual( gmlId );
        } );

        test( 'set sheetName', () => {
            expect( instance.sheetName ).toEqual( sheetName );
        } );

        test( 'set objectNumber', () => {
            expect( instance.objectNumber ).toEqual( objectNumber );
        } );
    } );

    describe ( '#addStyle:', () => {
        const style = new Style( { fill: new Fill({'color': '#A1A1A1', 'opacity': 0.6}) } );

        test( 'added style', () => {
            instance.local = LOCALE.Plane;
            instance.addStyle( style );
            expect( instance.styles![ 1 ] ).toEqual( style );
        } );
    } );

    // test( 'returns vector point', () => {
    //     instance.addGeoPoint( new GeoPoint( 15, 10, 12 ) );
    //     instance.addGeoPoint( new GeoPoint( 30, 50, 25 ) );
    //
    //     expect( instance.getVectorPoint( {} ) ).toEqual( [6067222.161509595, 1625707.2784767065, 1107553.950738154] );
    //     expect( instance.getVectorPoint( { positionNumber: 1 } ) ).toEqual( [3550533.986870778, 2049901.7530867578, 4885955.557412626] );
    // } );

    describe ( '#addGeoPoint:', () => {
        test( 'added geometry GeoPoint', () => {
            instance.addGeoPoint( new GeoPoint() );
            expect( instance.isDirty ).toEqual( true );
        } );
    } );

    // test( 'adds pixel Point to geometry', () => {
    //     const pixelPoint = new Point( 1, 2 );
    //     instance.addPixelPoint( pixelPoint );
    //     expect( instance.getPoint( {} ) ).toEqual( new GeoPoint( pixelPoint.x, pixelPoint.y ) );
    // } );
    //
    // test( 'adds GeoPoint to geometry with selector', () => {
    //
    //     instance.addPixelPoint( new Point( 2, 2 ) );
    //
    //     const selector = {
    //         objectNumber: 0,
    //         contourNumber: 1
    //     };
    //
    //     const pixelPoint = new Point( 7, 7 );
    //     instance.addPixelPoint( pixelPoint, selector );
    //
    //     expect( instance.getPoint( selector ) ).toEqual( new GeoPoint( pixelPoint.x, pixelPoint.y ) );
    //     expect( instance.getPoint( {} ) ).not.toEqual( new GeoPoint( pixelPoint.x, pixelPoint.y ) );
    // } );

    describe ('#updatePoint:', () => {
        const geoPoint1 = new GeoPoint( 0, 10, 20 ).toMapPoint()!;

        test( 'updates point in geometry', () => {
            instance.updatePoint( geoPoint1, {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 0
            } );
            expect( instance.isDirty ).toEqual( true );
        } );
    } );

    describe ( '#removePoint:', () => {
        test( 'removes point from geometry', () => {
            instance.removePoint( {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 0
            } );
            expect( instance.isDirty ).toEqual( true );
        } );
    } );

    describe ( '#removeLastPoint:', () => {
        test( 'removes last point from geometry', () => {
            instance.removeLastPoint();
            expect( instance.isDirty ).toEqual( true );
        } );
    });

    describe ( '#removeAllPoints:', () => {
        test( 'removes all points from geometry', () => {
            instance.removeAllPoints();
            expect( instance.isDirty ).toEqual( false );
        } );
    } );

    describe ( '#closeObject:', () => {
        const geoPoint1 = new GeoPoint( 0, 10, 20 );
        const geoPoint2 = new GeoPoint( 12, 1, 1 );

        test( 'closes geometry', () => {
            instance.closeObject();
            expect( instance.isDirty ).toEqual( false );

            instance.addGeoPoint( geoPoint1 );
            instance.addGeoPoint( geoPoint2, {
                objectNumber: 0,
                contourNumber: 1
            } );

            instance.isDirty = false;
            instance.closeObject();
            expect( instance.isDirty ).toEqual( true );
        } );
    });
} );
