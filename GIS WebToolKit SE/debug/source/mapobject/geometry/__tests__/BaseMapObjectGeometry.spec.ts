/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Тестирование класса                        *
 *                      BaseMapObjectGeometry                       *
 *                                                                  *
 *******************************************************************/

import 'jest';
import TranslateList from '~/translate/TTranslateList';
import { MapPoint } from '~/geometry/MapPoint';
import BaseMapObjectGeometry, { PointInfo, PointSelector } from '~/mapobject/geometry/BaseMapObjectGeometry';
import { FeatureGeometry } from '~/utils/GeoJSON';

TranslateList.getItem('');

class GeometryClass extends BaseMapObjectGeometry {
    constructor() {
        super();
        this.object[ 0 ] = [[], []];
    }

    addPoint( mapPoint: MapPoint, selector?: PointSelector ) {
        this.object[ 0 ][ selector?.contourNumber || 0 ].push( mapPoint );
    }

    checkHover( mapPoint: MapPoint, delta: number ): PointInfo | undefined {
        return undefined;
    }

    fromJSON( json: FeatureGeometry, sourceProjectionId: string, targetProjectionId: string ): void {
    }

    toJSON( targetProjectionId: string ): FeatureGeometry | undefined {
        return undefined;
    }
}

describe( 'BaseMapObjectGeometry.ts:', () => {
    let instance: BaseMapObjectGeometry, geoPoint1: MapPoint, geoPoint2: MapPoint, geoPoint3: MapPoint;

    beforeEach( () => {
        geoPoint1 = new MapPoint( 20, 20, 10 );
        geoPoint2 = new MapPoint( 40, 50, 20 );
        geoPoint3 = new MapPoint( 30, 35, 20 );
        instance = new GeometryClass();
    } );
    describe( '#getPointList:', () => {
        test( 'returns empty list', () => {
            expect( instance.getPointList() ).toEqual( [] );
        } );
    
        test( 'returns point list', () => {
            const result = [geoPoint1, geoPoint2];
    
            instance.addPoint( geoPoint1 );
            instance.addPoint( geoPoint2 );
    
            expect( instance.getPointList() ).toEqual( result );
        } );
    } );

    describe ( '#getPointListForDrawing:', () => {
        test( 'returns point list for drawing', () => {
            const result = [
                [geoPoint1.x, geoPoint1.y, geoPoint1.h],
                [geoPoint2.y, geoPoint2.x, geoPoint2.h]
            ];
    
            instance.addPoint( geoPoint1 );
            instance.addPoint( geoPoint2 );
    
            expect( instance.getPointListForDrawing() ).toEqual( result );
        } );
    } );

    describe ( '#getPoint:', ()=> {
        test( 'adds MapPoint', () => {
            instance.addPoint( geoPoint1 );
    
            expect( instance.getPoint( {} ) ).toEqual( geoPoint1 );
        } );
    } ); 

    describe ( '#addPoint:', () => {
        beforeEach( ()=>{
            instance.addPoint( geoPoint1 );   
            instance.addPoint( geoPoint2, selector );
        } );

        const selector = {
            objectNumber: 0,
            contourNumber: 1
        };

        test( 'adds MapPoint to geometry with selector', () => {
            expect( instance.getPoint( selector ) ).toEqual( geoPoint2 );
        } );

        test( 'adds MapPoint to geometry without selector', () => {   
            expect( instance.getPoint( {} ) ).not.toEqual( geoPoint2 );
        } );
    } );

    describe( '#updatePoint:', () => {
        beforeEach( ()=>{
            instance.addPoint( new MapPoint( 0, 1, 2 ) );
            instance.addPoint( new MapPoint( 3, 4, 5 ), {
                objectNumber: 0,
                contourNumber: 1
            } );
    
            instance.updatePoint( geoPoint1, {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 0
            } );
    
            instance.updatePoint( geoPoint2, {
                objectNumber: 0,
                contourNumber: 1,
                positionNumber: 0
            } );
        } );

        test( 'updates point with selector', () => {
            expect( instance.getPoint( {
                objectNumber: 0,
                contourNumber: 1
            } ) ).toEqual( geoPoint2 );
        } );

        test( 'updates point without selector', () => {
            expect( instance.getPoint( {} ) ).toEqual( geoPoint1 );
        } );
    } );

    describe( '#removePoint:', () => {
        beforeEach (() => {
            instance.addPoint( geoPoint1 );
            instance.addPoint( geoPoint2, {
                objectNumber: 0,
                contourNumber: 1
            } );
        } );

        test( 'remove empty point', () => {
            instance.removePoint( {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 0
            } );
    
            expect( instance.getPoint( {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 0
            } ) ).toEqual( undefined );
    
            expect( !instance.getPoint( {
                objectNumber: 0,
                contourNumber: 1,
                positionNumber: 0
            } ) ).toEqual( false );
    
        } );

        test( 'remove point', () => {    
            instance.removePoint( {
                objectNumber: 0,
                contourNumber: 1,
                positionNumber: 0
            } );
    
            expect( instance.getPoint( {
                objectNumber: 0,
                contourNumber: 1
            } ) ).toEqual( undefined );
    
        } );
    } );

    describe ( '#removeLastPoint:', ()=> {
        test( 'removes last point', () => {
            instance.addPoint( geoPoint1 );
            instance.addPoint( geoPoint2, {
                objectNumber: 0,
                contourNumber: 1
            } );
    
            instance.removeLastPoint();
    
            expect( instance.getPoint( {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 0
            } ) ).toEqual( geoPoint1 );
    
            expect( instance.getPoint( {
                objectNumber: 0,
                contourNumber: 1,
                positionNumber: 0
            } ) ).toEqual( undefined );
        } );
    } );

    describe ( '#clear:', ()=> {
        test( 'clears point list', () => {
            instance.addPoint( geoPoint1 );
            instance.addPoint( geoPoint2, {
                objectNumber: 0,
                contourNumber: 1
            } );
            
            instance.clear();
    
            expect( instance.getPoint( {
                objectNumber: 0,
                contourNumber: 0,
                positionNumber: 0
            } ) ).toEqual( undefined );
    
            expect( instance.getPoint( {
                objectNumber: 0,
                contourNumber: 1
            } ) ).toEqual( undefined );
        } );
    } );

    describe ( '#closeObject:', ()=> {
        test( 'closes point list', () => {
            instance.addPoint( geoPoint1 );
            instance.addPoint( geoPoint2, {
                objectNumber: 0,
                contourNumber: 1
            } );
            instance.closeObject();
    
            expect( instance.getPoint( {
                objectNumber: 0,
                contourNumber: 1,
                positionNumber: 1
            } ) ).toEqual( geoPoint1 );
        } );
    } );

    // test( 'returns bbox', () => {
    //
    //     instance.addPoint( geoPoint1 );
    //     instance.addPoint( geoPoint2 );
    //
    //     const bbox = new BoundingBox2D();
    //     bbox.fitPoints( [
    //         [geoPoint1.x, geoPoint1.y],
    //         [geoPoint2.x, geoPoint2.y]
    //     ] );
    //
    //     expect( instance.getBbox() ).toEqual( bbox );
    // } );

    describe ( '#getCenter:', ()=> {
        test( 'returns center', () => {
            instance.addPoint( geoPoint1 );
            instance.addPoint( geoPoint2 );
            
            expect( instance.getCenter() ).toEqual( geoPoint3 );
        } );
    } );
} );
