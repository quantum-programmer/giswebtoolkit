/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Геометрия мульти-точечного объекта карты               *
 *                                                                  *
 *******************************************************************/

import BaseMapObjectGeometry, { PointInfo, PointSelector } from '~/mapobject/geometry/BaseMapObjectGeometry';
import { MapObjectType } from '~/mapobject/MapObject';
import { Vector3D } from '~/3d/engine/core/Types';
import { MapPoint } from '~/geometry/MapPoint';
import { Cartesian2D } from '~/geometry/Cartesian2D';
import {FeatureGeometry, MultiPointGeometryType} from '~/utils/GeoJSON';


/**
 * Геометрия мульти-точечного объекта карты
 * @class MultiPointGeometry
 */
export default class MultiPointGeometry extends BaseMapObjectGeometry {

    addPoint( mapPoint: MapPoint, selector: PointSelector = {} ): void {
        const {
            positionNumber
        } = selector;

        if ( !this.object[ 0 ] ) {
            this.object[ 0 ] = [];
        }

        const objectContours = this.object[ 0 ];

        if ( !objectContours[ 0 ] ) {
            objectContours[ 0 ] = [];
        }

        const contourPoints = objectContours[ 0 ];

        if ( positionNumber === undefined || positionNumber >= contourPoints.length ) {
            contourPoints.push( mapPoint.clone() );
        } else {
            contourPoints.splice( positionNumber, 0, mapPoint.clone() );
        }
        this.clearCache();
    }

    checkHover( mapPoint: MapPoint, delta: number ): PointInfo | undefined {
        let result;

        const projectionId = this.getProjectionId();
        if ( projectionId && this.object.length > 0 ) {

            const objectContours = this.object[ 0 ];

            const contourPoints = objectContours[ 0 ];

            const currentMapPoint = mapPoint.toMapPoint( projectionId );

            for ( let position = 0; position < contourPoints.length; position++ ) {

                if ( Cartesian2D.distance( currentMapPoint, contourPoints[ position ] ) < delta ) {
                    result = this.findNearestPoint( currentMapPoint, 0, 0 );
                    break;
                }
            }

        }

        return result;
    }

    toJSON( targetProjectionId: string ): MultiPointGeometryType | undefined {

        if ( this.object.length === 0 ) {
            return;
        }

        const type = MapObjectType.MultiPoint;
        const coordinates: Vector3D[] = [];
        const objectContours = this.object[ 0 ];

        const contourPoints = objectContours[ 0 ];

        for ( let position = 0; position < contourPoints.length; position++ ) {
            const mapPoint = contourPoints[ position ];
            coordinates.push( BaseMapObjectGeometry.prepareCoordinate( mapPoint, targetProjectionId ) );
        }

        return {
            type,
            coordinates
        };
    }

    fromJSON( json: FeatureGeometry, sourceProjectionId: string, targetProjectionId: string ): void {
        this.object.length = 0;
        const object = [];
        const subject = [];

        let multiPointCoordinates;
        switch (json.type) {
            case MapObjectType.Point:
                multiPointCoordinates = [json.coordinates];
                break;
            case MapObjectType.LineString:
            case MapObjectType.MultiPoint:
                multiPointCoordinates = json.coordinates;
                break;
            case MapObjectType.MultiLineString:
            case MapObjectType.Polygon:
                multiPointCoordinates = json.coordinates[0];
                break;
            case MapObjectType.MultiPolygon:
                multiPointCoordinates = json.coordinates[0][0];
                break;
        }

        for ( let pointIndex = 0; pointIndex < multiPointCoordinates.length; pointIndex++ ) {
            const coordinate = multiPointCoordinates[ pointIndex ];
            const mapPoint = BaseMapObjectGeometry.parseCoordinate( coordinate, sourceProjectionId );
            if ( mapPoint ) {
                subject.push( mapPoint.toMapPoint( targetProjectionId ) );
            }
        }
        object.push( subject );
        this.object.push( object );
    }
}
