/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Геометрия мульти-линейного объекта карты             *
 *                                                                  *
 *******************************************************************/


import BaseMapObjectGeometry, {
    PointInfo,
    PointSelector,
    NearestInterpolatedPointResult
} from '~/mapobject/geometry/BaseMapObjectGeometry';
import { MapObjectType } from '~/mapobject/MapObject';
import { Vector2D, Vector2or3, Vector3D } from '~/3d/engine/core/Types';
import { ContainmentTests } from '~/core/collisiondetection/Collisiondetection';
import { vec2 } from '~/3d/engine/utils/glmatrix';
import { MapPoint } from '~/geometry/MapPoint';
import {FeatureGeometry, MultiLineGeometryType} from '~/utils/GeoJSON';


/**
 * Геометрия мульти-линейного объекта карты
 * @class MultiLineGeometry
 */
export default class MultiLineGeometry extends BaseMapObjectGeometry {

    /**
     * Массив кэшированных точек
     * @private
     * @readonly
     * @property {array} cartesianVerticesCache
     */
    private readonly cartesianVerticesCache: [Vector2D, Vector2D][][] = [];

    /**
     * Заполнить массив кэшированны точек
     * @private
     * @method fillCartesianVertices
     */
    private fillCartesianVertices(): void {
        if ( this.cartesianVerticesCache.length === 0 && this.object.length > 0 ) {
            const objectContours = this.object[ 0 ];

            for ( let contourNumber = 0; contourNumber < objectContours.length; contourNumber++ ) {

                const contourPoints = objectContours[ contourNumber ];
                const contourVertices: [Vector2D, Vector2D][] = [];

                for ( let position = 0; position < contourPoints.length - 1; position++ ) {
                    contourVertices.push( [contourPoints[ position ].toVector2D(), contourPoints[ position + 1 ].toVector2D()] );
                }
                this.cartesianVerticesCache.push( contourVertices );
            }

        }
    }

    protected clearCache(): void {
        this.cartesianVerticesCache.length = 0;
    }

    findNearestInterpolatedPoint( mapPoint: MapPoint ): NearestInterpolatedPointResult | undefined {
        this.fillCartesianVertices();

        const objectNumber = 0;
        let contourNumber = 0;
        let positionNumber = 0;

        let resultMapPoint: MapPoint | undefined = undefined;

        const projectionId = this.getProjectionId();
        if ( projectionId && this.cartesianVerticesCache.length > 0 ) {

            const vectorMapPoint = mapPoint.toMapPoint( projectionId ).toVector2D();

            const tempVector = vec2.create();
            let distance = Number.MAX_VALUE;
            this.cartesianVerticesCache.forEach( ( segmentList, segmentListIndex ) => {

                segmentList.forEach( ( segment, segmentIndex ) => {
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
                        contourNumber = segmentListIndex;
                        distance = curDistance;
                    }
                } );

            } );
        }

        if ( resultMapPoint ) {
            return {
                point: resultMapPoint,
                pointSelectorPrev: { positionNumber, contourNumber, objectNumber },
                pointSelectorNext: { positionNumber: positionNumber + 1, contourNumber: contourNumber, objectNumber }
            };
        }
    }

    addPoint( mapPoint: MapPoint, selector: PointSelector = {} ): void {
        const {
            contourNumber = 0,
            positionNumber
        } = selector;

        if ( !this.object[ 0 ] ) {
            this.object[ 0 ] = [];
        }

        const objectContours = this.object[ 0 ];

        if ( !objectContours[ contourNumber ] ) {
            objectContours[ contourNumber ] = [];
        }

        const contourPoints = objectContours[ contourNumber ];

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

            for ( let contourNumber = 0; contourNumber < this.cartesianVerticesCache.length; contourNumber++ ) {
                const segments = this.cartesianVerticesCache[ contourNumber ];
                for ( let segmentNumber = 0; segmentNumber < segments.length; segmentNumber++ ) {
                    if ( ContainmentTests.pointOnSegment2D( vectorXY, segments[ segmentNumber ], delta * 0.05 ) ) {
                        result = this.findNearestPoint( mapPoint, 0, contourNumber );
                        break;
                    }
                }
            }
        }

        return result;
    }

    toJSON( targetProjectionId: string ): MultiLineGeometryType | undefined {

        if ( this.object.length === 0 ) {
            return;
        }

        const type = MapObjectType.MultiLineString;
        const coordinates = [];
        const objectContours = this.object[ 0 ];

        for ( let contourNumber = 0; contourNumber < objectContours.length; contourNumber++ ) {

            const contourPoints = objectContours[ contourNumber ],
                contourPointsCopy: Vector3D[] = [];

            for ( let position = 0; position < contourPoints.length; position++ ) {
                const mapPoint = contourPoints[ position ];
                contourPointsCopy.push( BaseMapObjectGeometry.prepareCoordinate( mapPoint, targetProjectionId ) );
            }

            coordinates.push( contourPointsCopy );
        }


        return {
            type,
            coordinates
        };
    }

    fromJSON( json: FeatureGeometry, sourceProjectionId: string, targetProjectionId: string ): void {
        this.object.length = 0;
        const object = [];

        let multiLineCoordinates;
        switch (json.type) {
            case MapObjectType.Point:
                multiLineCoordinates = [[json.coordinates]];
                break;
            case MapObjectType.LineString:
            case MapObjectType.MultiPoint:
                multiLineCoordinates = [json.coordinates];
                break;
            case MapObjectType.MultiLineString:
            case MapObjectType.Polygon:
                multiLineCoordinates = json.coordinates;
                break;
            case MapObjectType.MultiPolygon:
                multiLineCoordinates = json.coordinates[0];
                break;
        }

        for ( let lineIndex = 0; lineIndex < multiLineCoordinates.length; lineIndex++ ) {
            const lineCoordinates = multiLineCoordinates[ lineIndex ];
            const subject = [];
            for ( let pointIndex = 0; pointIndex < lineCoordinates.length; pointIndex++ ) {
                const coordinate = lineCoordinates[ pointIndex ];
                const mapPoint = BaseMapObjectGeometry.parseCoordinate( coordinate, sourceProjectionId );
                if ( mapPoint ) {
                    subject.push( mapPoint.toMapPoint( targetProjectionId ) );
                }
            }
            object.push( subject );
        }
        this.object.push( object );
    }

    getPointListForDrawing(): Vector2or3[][] {
        const result: Vector2or3[][] = [];

        for ( let objectNumber = 0; objectNumber < this.object.length; objectNumber++ ) {
            const objectContours = this.object[ objectNumber ];

            for ( let contourNumber = 0; contourNumber < objectContours.length; contourNumber++ ) {

                const contours: Vector2or3[] = objectContours[ contourNumber ].map( mapPoint => mapPoint.toOrigin() );

                if ( contours.length > 0 ) {
                    result.push( contours );
                }
            }
        }

        return result;
    }
}
