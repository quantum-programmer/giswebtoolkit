/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Геометрия линейного объекта карты                    *
 *                                                                  *
 *******************************************************************/

import BaseMapObjectGeometry, {
    PointInfo,
    PointSelector,
    NearestInterpolatedPointResult
} from '~/mapobject/geometry/BaseMapObjectGeometry';
import { MapObjectType } from '~/mapobject/MapObject';
import { Vector2D } from '~/3d/engine/core/Types';
import { ContainmentTests } from '~/core/collisiondetection/Collisiondetection';
import { vec2 } from '~/3d/engine/utils/glmatrix';
import { MapPoint } from '~/geometry/MapPoint';
import {FeatureGeometry, LineGeometryType} from '~/utils/GeoJSON';

/**
 * Геометрия линейного объекта карты
 * @class LineGeometry
 */
export default class LineGeometry extends BaseMapObjectGeometry {

    /**
     * Массив кэшированных точек
     * @private
     * @readonly
     * @property {array} cartesianVerticesCache
     */
    private readonly cartesianVerticesCache: [Vector2D, Vector2D][] = [];

    /**
     * Заполнить массив кэшированных точек
     * @private
     * @method fillCartesianVertices
     */
    private fillCartesianVertices(): void {

        if ( this.cartesianVerticesCache.length === 0 && this.object.length > 0 ) {
            const objectContours = this.object[ 0 ];

            const contourPoints = objectContours[ 0 ];

            for ( let position = 0; position < contourPoints.length - 1; position++ ) {
                this.cartesianVerticesCache.push( [contourPoints[ position ].toVector2D(), contourPoints[ position + 1 ].toVector2D()] );
            }
        }
    }

    protected clearCache(): void {
        this.cartesianVerticesCache.length = 0;
    }

    findNearestInterpolatedPoint( mapPoint: MapPoint ): NearestInterpolatedPointResult | undefined {
        this.fillCartesianVertices();

        const objectNumber = 0;
        const contourNumber = 0;
        let positionNumber = 0;

        let resultMapPoint: MapPoint | undefined = undefined;

        const projectionId = this.getProjectionId();
        if ( projectionId && this.cartesianVerticesCache.length > 0 ) {

            const vectorMapPoint = mapPoint.toMapPoint( projectionId ).toVector2D();

            const tempVector = vec2.create();
            let distance = Number.MAX_VALUE;
            this.cartesianVerticesCache.forEach( ( segment, segmentIndex ) => {
                const resultPointVector = ContainmentTests.findNearestPointToSegment( vectorMapPoint, segment );
                const curDistance = vec2.len( vec2.sub( vectorMapPoint, resultPointVector, tempVector ) );
                if ( curDistance < distance ) {
                    if ( !resultMapPoint ) {
                        resultMapPoint = new MapPoint( resultPointVector[ 0 ], resultPointVector[ 1 ], 0, projectionId );
                    } else {
                        resultMapPoint.x = resultPointVector[ 0 ];
                        resultMapPoint.y = resultPointVector[ 1 ];
                    }
                    positionNumber = segmentIndex;
                    distance = curDistance;
                }
            } );
        }

        if ( resultMapPoint ) {
            return {
                point: resultMapPoint,
                pointSelectorPrev: { positionNumber, contourNumber, objectNumber },
                pointSelectorNext: { positionNumber: positionNumber + 1, contourNumber, objectNumber }
            };
        }
    }

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
            contourPoints.push( mapPoint.copy() );
        } else {
            contourPoints.splice( positionNumber, 0, mapPoint.copy() );
        }
        this.clearCache();
    }

    checkHover( mapPoint: MapPoint, delta: number ): PointInfo | undefined {
        this.fillCartesianVertices();

        let result;

        if ( this.cartesianVerticesCache.length > 0 ) {
            const vectorXY = mapPoint.toVector2D();

            for ( let segmentNumber = 0; segmentNumber < this.cartesianVerticesCache.length; segmentNumber++ ) {
                if ( ContainmentTests.pointOnSegment2D( [vectorXY[ 0 ], vectorXY[ 1 ]], this.cartesianVerticesCache[ segmentNumber ], delta * 0.05 ) ) {
                    result = this.findNearestPoint( mapPoint, 0, 0 );
                    break;
                }
            }
        }

        return result;
    }

    toJSON( targetProjectionId: string ): LineGeometryType | undefined {

        if ( this.object.length === 0 ) {
            return;
        }

        const type = MapObjectType.LineString;

        const objectContours = this.object[ 0 ];

        const contourPoints = objectContours[ 0 ];

        const coordinates = contourPoints.map( mapPoint => BaseMapObjectGeometry.prepareCoordinate( mapPoint, targetProjectionId ) );

        return {
            type,
            coordinates
        };
    }

    fromJSON( json: FeatureGeometry, sourceProjectionId: string, targetProjectionId: string ): void {
        this.object.length = 0;
        const object = [];
        const subject = [];

        let lineCoordinates;
        switch (json.type) {
            case MapObjectType.Point:
                lineCoordinates = [json.coordinates];
                break;
            case MapObjectType.LineString:
            case MapObjectType.MultiPoint:
                lineCoordinates = json.coordinates;
                break;
            case MapObjectType.MultiLineString:
            case MapObjectType.Polygon:
                lineCoordinates = json.coordinates[0];
                break;
            case MapObjectType.MultiPolygon:
                lineCoordinates = json.coordinates[0][0];
                break;
        }

        for ( let pointIndex = 0; pointIndex < lineCoordinates.length; pointIndex++ ) {
            const coordinate = lineCoordinates[ pointIndex ];
            const mapPoint = BaseMapObjectGeometry.parseCoordinate( coordinate, sourceProjectionId );
            if ( mapPoint ) {
                subject.push( mapPoint.toMapPoint( targetProjectionId ) );
            }
        }

        object.push( subject );
        this.object.push( object );
    }
}
