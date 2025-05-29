/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Геометрия точечного объекта карты                   *
 *                                                                  *
 *******************************************************************/

import BaseMapObjectGeometry, { PointInfo } from '~/mapobject/geometry/BaseMapObjectGeometry';
import { MapObjectType } from '~/mapobject/MapObject';
import { MapPoint } from '~/geometry/MapPoint';
import { Cartesian2D } from '~/geometry/Cartesian2D';
import {FeatureGeometry, PointGeometryType} from '~/utils/GeoJSON';
import { Bounds } from '~/geometry/Bounds';


/**
 * Геометрия точечного объекта карты
 * @class PointGeometry
 */
export default class PointGeometry extends BaseMapObjectGeometry {

    addPoint( mapPoint: MapPoint ): void {
        if ( this.object.length > 0 ) {
            this.object.pop();
        }

        this.object.push( [[mapPoint.clone()]] );
    }

    checkHover( mapPoint: MapPoint, delta: number ): PointInfo | undefined {
        if ( this.object.length > 0 ) {
            const currentPoint = this.object[ 0 ][ 0 ][ 0 ];

            const currentMapPoint = mapPoint.toMapPoint( currentPoint.getProjectionId() );

            if ( Cartesian2D.distance( currentMapPoint, currentPoint ) < delta ) {
                return { positionNumber: 0, contourNumber: 0, objectNumber: 0 };
            }
        }
    }

    toJSON( targetProjectionId: string ): PointGeometryType | undefined {

        const mapPoint = this.getPoint();
        if ( !mapPoint ) {
            return;
        }

        const type = MapObjectType.Point;
        const coordinates = BaseMapObjectGeometry.prepareCoordinate( mapPoint, targetProjectionId );

        return {
            type,
            coordinates
        };
    }

    fromJSON( json: FeatureGeometry, sourceProjectionId: string, targetProjectionId: string ): void {
        this.object.length = 0;
        const object = [];
        const subject = [];

        let coordinate;
        switch (json.type) {
            case MapObjectType.Point:
                coordinate = json.coordinates;
                break;
            case MapObjectType.LineString:
            case MapObjectType.MultiPoint:
                coordinate = json.coordinates[0];
                break;
            case MapObjectType.MultiLineString:
            case MapObjectType.Polygon:
                coordinate = json.coordinates[0][0];
                break;
            case MapObjectType.MultiPolygon:
                coordinate = json.coordinates[0][0][0];
                break;
        }

        const mapPoint = BaseMapObjectGeometry.parseCoordinate( coordinate, sourceProjectionId );
        if ( mapPoint ) {
            subject.push( mapPoint.toMapPoint( targetProjectionId ) );
        }

        object.push( subject );
        this.object.push( object );
    }

    getBounds(): Bounds {
        const mapPoint = this.getPoint();
        let mapPointNext: MapPoint | undefined;
        if ( mapPoint ) {
            mapPointNext = mapPoint.clone();
            mapPointNext.x += 0.00001;
            mapPointNext.y += 0.00001;
        }
        return new Bounds( mapPoint, mapPointNext );
    }
}
