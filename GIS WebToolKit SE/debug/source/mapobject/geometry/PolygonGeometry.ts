/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Геометрия полигонального объекта карты               *
 *                                                                  *
 *******************************************************************/

import BaseMapObjectGeometry, {
    PointInfo,
    PointSelector,
    NearestInterpolatedPointResult
} from '~/mapobject/geometry/BaseMapObjectGeometry';
import { MapObjectType } from '~/mapobject/MapObject';
import { ContainmentTests } from '~/core/collisiondetection/Collisiondetection';
import { Vector2D, Vector2or3, Vector3D } from '~/3d/engine/core/Types';
import { vec2 } from '~/3d/engine/utils/glmatrix';
import XMLElement from '~/services/Utils/XMLElement';
import MultiLineGeometry from '~/mapobject/geometry/MultiLineGeometry';
import { MapPoint } from '~/geometry/MapPoint';
import {FeatureGeometry, PolygonGeometryType} from '~/utils/GeoJSON';


/**
 * Геометрия полигонального объекта карты
 * @class PolygonGeometry
 */
export default class PolygonGeometry extends BaseMapObjectGeometry {


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

        if ( contourPoints.length > 1 && contourPoints[ 0 ].equals( contourPoints[ contourPoints.length - 1 ] ) ) {
            contourPoints.pop();
        }

        if ( positionNumber === undefined || positionNumber >= contourPoints.length ) {
            contourPoints.push( mapPoint.clone() );
        } else {
            contourPoints.splice( positionNumber, 0, mapPoint.clone() );
        }
        this.checkLastPoint( selector );

    }

    private checkLastPoint( selector: PointSelector ): void {
        const points = this.object[ 0 ][ selector.contourNumber || 0 ];
        if ( !points[ 0 ].equals( points[ points.length - 1 ] ) ) {
            points.push( points[ 0 ].clone() );
        }
    }

    checkHover( mapPoint: MapPoint, delta: number ): PointInfo | undefined {


        let result: PointInfo | undefined;

        if ( this.object.length > 0 ) {
            const objectContours = this.object[ 0 ];
            const projectionId = this.getProjectionId();
            if ( projectionId && objectContours.length > 0 ) {

                const currentMapPoint = mapPoint.toMapPoint( projectionId );

                const mainContour = objectContours[ 0 ];
                let collision = ContainmentTests.pointInsideObjectContour2D( currentMapPoint, mainContour );

                if ( collision ) {
                    for ( let i = 1; i < objectContours.length; i++ ) {
                        if ( ContainmentTests.pointInsideObjectContour2D( currentMapPoint, objectContours[ i ] ) ) {
                            collision = false;
                            break;
                        }
                    }
                }
                if ( collision ) {
                    result = this.findNearestPoint( currentMapPoint, 0 );
                    // if ( result ) {
                    //     const point = this.getPoint( result );
                    //     if ( point && Cartesian2D.distance( point, currentMapPoint ) > delta ) {
                    //         result = undefined;
                    //     }
                    // }
                }
            }
        }

        return result;
    }

    findNearestInterpolatedPoint( mapPoint: MapPoint ): NearestInterpolatedPointResult | undefined {

        const objectNumber = 0;
        let contourNumber = 0;
        let positionNumber = 0;

        let resultMapPoint: MapPoint | undefined = undefined;

        const projectionId = this.getProjectionId();
        if ( projectionId && this.object.length > 0 ) {

            const vectorMapPoint = mapPoint.toMapPoint( projectionId ).toVector2D();

            const tempVector = vec2.create();
            let distance = Number.MAX_VALUE;
            this.object[ 0 ].forEach( ( contourPoints, currentContourNumber ) => {

                for ( let currentPointNumber = 0; currentPointNumber < contourPoints.length - 1; currentPointNumber++ ) {

                    const currentVectorPoint = contourPoints[ currentPointNumber ].toVector2D();
                    const nextVectorPoint = contourPoints[ currentPointNumber + 1 ].toVector2D();
                    const segment: [Vector2D, Vector2D] = [currentVectorPoint, nextVectorPoint];

                    const resultPointVector = ContainmentTests.findNearestPointToSegment( vectorMapPoint, segment );
                    const curDistance = vec2.len( vec2.sub( vectorMapPoint, resultPointVector, tempVector ) );
                    if ( curDistance < distance ) {
                        if ( !resultMapPoint ) {
                            resultMapPoint = new MapPoint( resultPointVector[ 0 ], resultPointVector[ 1 ], 0, projectionId );
                        } else {
                            resultMapPoint.x = resultPointVector[ 0 ];
                            resultMapPoint.y = resultPointVector[ 1 ];
                        }
                        positionNumber = currentPointNumber;
                        contourNumber = currentContourNumber;
                        distance = curDistance;
                    }
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

    toJSON( targetProjectionId: string ): PolygonGeometryType | undefined {

        if ( this.object.length === 0 ) {
            return;
        }

        const type = MapObjectType.Polygon;
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

        let polygonCoordinates;
        switch (json.type) {
            case MapObjectType.Point:
                polygonCoordinates = [[json.coordinates]];
                break;
            case MapObjectType.LineString:
            case MapObjectType.MultiPoint:
                polygonCoordinates = [json.coordinates];
                break;
            case MapObjectType.MultiLineString:
            case MapObjectType.Polygon:
                polygonCoordinates = json.coordinates;
                break;
            case MapObjectType.MultiPolygon:
                polygonCoordinates = json.coordinates[0];
                break;
        }

        for ( let lineIndex = 0; lineIndex < polygonCoordinates.length; lineIndex++ ) {
            const lineCoordinates = polygonCoordinates[ lineIndex ];
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

    /**
     * Получить GML точек метрики объекта
     * @deprecated
     * @method getGmlPosList
     * @return {XMLElement|undefined} GML точек метрики объекта
     */
    getGmlPosList(): XMLElement | undefined {
        const gmlPosList = super.getGmlPosList();
        if ( !gmlPosList ) {
            return;
        }
        const gmlExterior = new XMLElement( 'gml:exterior' );
        const gmlLineString = new XMLElement( 'gml:LineString' );

        gmlLineString.addChild( gmlPosList );

        gmlExterior.addChild( gmlLineString );

        return gmlExterior;
    }


    getPointListForDrawing(): Vector2or3[][] {
        return MultiLineGeometry.prototype.getPointListForDrawing.call( this );
    }

    /**
     * Обновление точки
     * @method updatePoint
     * @param mapPoint {MapPoint} Точка в метрах
     * @param selector {PointSelector} Селектор точки
     */
    updatePoint( mapPoint: MapPoint, selector: PointSelector ): void {
        const {
            objectNumber = 0,
            contourNumber = 0,
            positionNumber = 0
        } = selector;

        const endPointNumber = this.getContourPoints( objectNumber, contourNumber ).length - 1;
        if ( positionNumber === endPointNumber && endPointNumber > 1 ) {
            selector.positionNumber = 0;
            this.updatePoint( mapPoint, selector );
            return;
        }

        super.updatePoint( mapPoint, selector );

        if ( positionNumber === 0 ) {
            if ( endPointNumber >= 2 ) { // если есть 3+ точек, то крайняя должна быть равна первой
                super.updatePoint( mapPoint, {
                    objectNumber,
                    contourNumber,
                    positionNumber: endPointNumber
                } );
            }
        }
    }

    /**
     * Повернуть объект
     * @method rotate
     * @param angleValue {number} Угол поворота
     * @param [center] {MapPoint} Центр поворота
     */
    rotate( angleValue: number, center = this.getCenter() ): void {
        if ( !center ) {
            return;
        }

        const currentVector = vec2.create();

        for ( let objectNumber = 0; objectNumber < this.object.length; objectNumber++ ) {

            const objectContours = this.object[ objectNumber ];

            for ( let contourNumber = 0; contourNumber < objectContours.length; contourNumber++ ) {

                const contourPoints = objectContours[ contourNumber ];
                // исключена последняя точка контура, совпадающая с первой
                for ( let positionNumber = 0; positionNumber < contourPoints.length - 1; positionNumber++ ) {

                    const point = contourPoints[ positionNumber ];

                    vec2.setValues( currentVector, point.x - center.x, point.y - center.y );
                    vec2.rotate( currentVector, angleValue );

                    const newPoint = point.clone();
                    newPoint.x = currentVector[ 0 ] + center.x;
                    newPoint.y = currentVector[ 1 ] + center.y;

                    this.updatePoint( newPoint, { objectNumber, contourNumber, positionNumber } );
                }
            }
        }
    }

    /**
     * Масштабирование объекта
     * @method rotate
     * @param scale {Vector2D} Коэффициенты масштабирования по осям
     * @param [center] {MapPoint} Центр масштабирования
     */
    scale( scale: Vector2D, center = this.getCenter() ): void {
        if ( !center ) {
            return;
        }
        const currentVector = vec2.create();

        for ( let objectNumber = 0; objectNumber < this.object.length; objectNumber++ ) {

            const objectContours = this.object[ objectNumber ];

            for ( let contourNumber = 0; contourNumber < objectContours.length; contourNumber++ ) {

                const contourPoints = objectContours[ contourNumber ];
                // исключена последняя точка контура, совпадающая с первой
                for ( let positionNumber = 0; positionNumber < contourPoints.length - 1; positionNumber++ ) {

                    const point = contourPoints[ positionNumber ];

                    vec2.setValues( currentVector, point.x - center.x, point.y - center.y );
                    vec2.multiply( currentVector, scale );

                    const newPoint = point.clone();
                    newPoint.x = currentVector[ 0 ] + center.x;
                    newPoint.y = currentVector[ 1 ] + center.y;

                    this.updatePoint( newPoint, { objectNumber, contourNumber, positionNumber } );
                }
            }
        }
    }

    /**
     * Масштабирование объекта по осям
     * @method rotate
     * @param scale {Vector2D} Коэффициенты масштабирования по осям
     * @param [center] {MapPoint} Центр масштабирования
     * @param [axis] {{x: Vector2D; y: Vector2D;}} Оси масштабирования
     */
    scaleByAxis( scale: Vector2D, center = this.getCenter(), axis = { x: vec2.UNITY, y: vec2.UNITX } ): void {
        if ( !center ) {
            return;
        }
        const currentVector = vec2.create();

        for ( let objectNumber = 0; objectNumber < this.object.length; objectNumber++ ) {

            const objectContours = this.object[ objectNumber ];

            for ( let contourNumber = 0; contourNumber < objectContours.length; contourNumber++ ) {

                const contourPoints = objectContours[ contourNumber ];
                // исключена последняя точка контура, совпадающая с первой
                for ( let positionNumber = 0; positionNumber < contourPoints.length - 1; positionNumber++ ) {

                    const point = contourPoints[ positionNumber ];

                    vec2.setValues( currentVector, point.x - center.x, point.y - center.y );

                    const xProjected = vec2.dot( currentVector, axis.x );
                    const yProjected = vec2.dot( currentVector, axis.y );

                    vec2.setValues( currentVector, xProjected, yProjected );
                    vec2.multiply( currentVector, scale );

                    const [scaleX, scaleY] = currentVector;

                    vec2.scale( axis.x, scaleX, currentVector );
                    vec2.scaleAndAdd( currentVector, axis.y, scaleY, currentVector );

                    const newPoint = point.clone();
                    newPoint.x = currentVector[ 0 ] + center.x;
                    newPoint.y = currentVector[ 1 ] + center.y;

                    this.updatePoint( newPoint, { objectNumber, contourNumber, positionNumber } );
                }
            }
        }
    }

    /**
     * Переместить объект
     * @method move
     * @param move {object} Метры перемещения по осям
     */
    move( move: { deltaX: number; deltaY: number } ): void {

        for ( let objectNumber = 0; objectNumber < this.object.length; objectNumber++ ) {

            const objectContours = this.object[ objectNumber ];

            for ( let contourNumber = 0; contourNumber < objectContours.length; contourNumber++ ) {

                const contourPoints = objectContours[ contourNumber ];
                // исключена последняя точка контура, совпадающая с первой
                for ( let positionNumber = 0; positionNumber < contourPoints.length - 1; positionNumber++ ) {

                    const newPoint = contourPoints[ positionNumber ].clone();
                    newPoint.x += move.deltaX;
                    newPoint.y += move.deltaY;

                    this.updatePoint( newPoint, { objectNumber, contourNumber, positionNumber } );
                }
            }
        }
    }

}
