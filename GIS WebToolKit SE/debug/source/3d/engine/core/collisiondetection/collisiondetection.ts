/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *       Методы по определению пересечения объектов                 *
 *                                                                  *
 *******************************************************************/

import { WindingOrder } from '~/3d/engine/core/geometry/mesh';
import { Matrix2x2, Vector2or3, Vector2D, Vector3D } from '../Types';
import { Line2D } from '~/3d/engine/core/lines/line2d';
import PolygonAlgorithms from '~/3d/engine/core/geometry/polygonalgorithms';
import BoundingBox2D from '~/3d/engine/core/boundingvolumes/bbox2d';
import { mat2, vec2, vec3 } from '~/3d/engine/utils/glmatrix';

/**
 * Определение вхождения точки
 * @static
 * @class ContainmentTests
 */
export class ContainmentTests {
    /**
     * Вспомогательный массив
     * @static
     * @property {Vector3D[]} mSupport
     */
    private static mSupport = [vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create()];

    /**
     * Определение вхождения точки в плоский треугольник
     * @method pointInsideTriangle2D
     * @static
     * @param point {Vector2or3} Точка в пространстве
     * @param p0 {Vector2or3} Вершина треугольника 0
     * @param p1 {Vector2or3} Вершина треугольника 1
     * @param p2 {Vector2or3} Вершина треугольника 2
     * @return {boolean} Точка внутри треугольника
     */
    static pointInsideTriangle2D( point: Vector2or3, p0: Vector2or3, p1: Vector2or3, p2: Vector2or3 ) {
        const dX = point[ 0 ] - p2[ 0 ];
        const dY = point[ 1 ] - p2[ 1 ];
        const dX21 = p2[ 0 ] - p1[ 0 ];
        const dY12 = p1[ 1 ] - p2[ 1 ];
        const D = dY12 * (p0[ 0 ] - p2[ 0 ]) + dX21 * (p0[ 1 ] - p2[ 1 ]);
        const s = dY12 * dX + dX21 * dY;
        const t = (p2[ 1 ] - p0[ 1 ]) * dX + (p0[ 0 ] - p2[ 0 ]) * dY;
        if ( D < 0 ) return s <= 0 && t <= 0 && s + t >= D;
        return s >= 0 && t >= 0 && s + t <= D;
    }

    /**
     * Определение вхождения точки в треугольник
     * @method pointInsideTriangle
     * @static
     * @param point {Vector3D} Точка в пространстве
     * @param p0 {Vector3D} Вершина треугольника 0
     * @param p1 {Vector3D} Вершина треугольника 1
     * @param p2 {Vector3D} Вершина треугольника 2
     * @return {boolean} Точка внутри треугольника
     */
    static pointInsideTriangle( point: Vector3D, p0: Vector3D, p1: Vector3D, p2: Vector3D ) {
        //
        // Implementation based on http://www.blackpawn.com/texts/pointinpoly/default.html.
        //

        const support = ContainmentTests.mSupport;
        const v0 = vec3.sub( p1, p0, support[ 0 ] );
        const v1 = vec3.sub( p2, p0, support[ 1 ] );
        const v2 = vec3.sub( point, p0, support[ 2 ] );

        const dot00 = vec3.dot( v0, v0 );
        const dot01 = vec3.dot( v0, v1 );
        const dot02 = vec3.dot( v0, v2 );
        const dot11 = vec3.dot( v1, v1 );
        const dot12 = vec3.dot( v1, v2 );

        const invDenominator = 1.0 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDenominator;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenominator;

        return (u > 0) && (v > 0) && (u + v < 1);
    }

    /**
     * Определение вхождения точки в бесконечную пирамиду
     * @method pointInsideThreeSidedInfinitePyramid
     * @static
     * @param point {Vector3D} Точка в пространстве
     * @param pyramidApex {Vector3D} Вершина пирамиды
     * @param pyramidBase0 {Vector3D} Ребро пирамиды 0
     * @param pyramidBase1 {Vector3D} Ребро пирамиды 1
     * @param pyramidBase2 {Vector3D} Ребро пирамиды 2
     * @return {boolean} Точка внутри пирамиды
     */
    static pointInsideThreeSidedInfinitePyramid( point: Vector3D, pyramidApex: Vector3D, pyramidBase0: Vector3D, pyramidBase1: Vector3D, pyramidBase2: Vector3D ) {
        const support = ContainmentTests.mSupport;
        const v0 = vec3.sub( pyramidBase0, pyramidApex, support[ 0 ] );
        const v1 = vec3.sub( pyramidBase1, pyramidApex, support[ 1 ] );
        const v2 = vec3.sub( pyramidBase2, pyramidApex, support[ 2 ] );

        //
        // Face normals
        //
        const n0 = vec3.cross( v1, v0, support[ 3 ] );
        const n1 = vec3.cross( v2, v1, support[ 4 ] );
        const n2 = vec3.cross( v0, v2, support[ 5 ] );

        const planeToPoint = vec3.sub( point, pyramidApex, support[ 6 ] );

        return ((vec3.dot( planeToPoint, n0 ) < 0) && (vec3.dot( planeToPoint, n1 ) < 0) && (vec3.dot( planeToPoint, n2 ) < 0));
    }

    /**
     * Определение вхождения точки в отрезок
     * @method onSegment2D
     * @static
     * @param p {Vector2D} Начальная точка отрезка
     * @param q {Vector2D} Проверяемая точка
     * @param r {Vector2D} Конечная точка отрезка
     * @return {boolean} Точка внутри отрезка
     */
    static onSegment2D( p: Vector2D, q: Vector2D, r: Vector2D ) {
        return q[ 0 ] <= Math.max( p[ 0 ], r[ 0 ] ) && q[ 0 ] >= Math.min( p[ 0 ], r[ 0 ] ) &&
            q[ 1 ] <= Math.max( p[ 1 ], r[ 1 ] ) && q[ 1 ] >= Math.min( p[ 1 ], r[ 1 ] );
    }

    /**
     * Определение положение точки относительно отрезка
     * @method positionToSegment2D
     * @static
     * @param a {Vector2D} Начальная точка отрезка
     * @param b {Vector2D} Конечная точка отрезка
     * @param d {Vector2D} Проверяемая точка
     * @return {number} Точка слева (1), справа (-1), или на отрезке (0)
     */
    static positionToSegment2D( a: Vector2D, b: Vector2D, d: Vector2D ) {
        const r = 1e6 * (d[ 0 ] - a[ 0 ]) * (b[ 1 ] - a[ 1 ]) - 1e6 * (d[ 1 ] - a[ 1 ]) * (b[ 0 ] - a[ 0 ]);
        if ( Math.abs( r ) < 1e-8 ) {
            return 0;
        } else if ( r < 0 ) {
            return -1;
        } else {
            return 1;
        }
    }
}

/**
 * Определение пересечения
 * @static
 * @class IntersectionTests
 */
export class IntersectionTests {
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {[Vector3D, Vector3D, Matrix2x2, Vector2D]} mSupport
     */
    private static mSupport: [Vector3D, Vector3D, Matrix2x2, Vector2D] = [vec3.create(), vec3.create(), mat2.create(), vec2.create()];

    /**
     * Определение пересечения луча и плоскости
     * @method tryRayPlane
     * @static
     * @param rayOrigin {Vector3D} Положение луча
     * @param rayDirection {Vector3D} Направление луча
     * @param planeNormal {Vector3D} Нормаль к плоскости
     * @param planeD {Vector3D} Смещение плоскости
     * @param [out] {Vector3D} Результат
     * @return {Vector3D|undefined} Точка пересечения луча и плоскости
     */
    static tryRayPlane( rayOrigin: Vector3D, rayDirection: Vector3D, planeNormal: Vector3D, planeD: number, out = vec3.create() ) {
        let intersectionPoint: Vector3D | undefined = undefined;

        const denominator = vec3.dot( planeNormal, rayDirection );
        // check Ray is not  parallel to plane.  The ray may be in the polygon's plane.
        if ( Math.abs( denominator ) >= 0.00000000000000000001 ) {
            const t = (-planeD - vec3.dot( planeNormal, rayOrigin )) / denominator;
            if ( t > 0 ) {
                intersectionPoint = vec3.add( rayOrigin, vec3.scale( rayDirection, t, IntersectionTests.mSupport[ 0 ] ), out );
            }
        }
        return intersectionPoint;
    }

    /**
     * Определение пересечения двух прямых на плоскости
     * @method tryLineLine2D
     * @static
     * @param line1 {Line2D} Первая линия на плоскости
     * @param line2 {Line2D} Вторая линия на плоскости
     * @param [dest] {Vector2D} Результат
     * @return {Vector2D|undefined}  двух прямых на плоскости
     */
    static tryLineLine2D( line1: Line2D, line2: Line2D, dest = vec2.create() ) {
        let result;
        const currMatrix = IntersectionTests.mSupport[ 2 ];
        mat2.setValues( currMatrix, line1.a, line1.b, line2.a, line2.b );
        const zn = mat2.det( currMatrix );
        if ( Math.abs( zn ) >= 1e-9 ) {
            result = dest;
            mat2.setValues( currMatrix, line1.c, line1.b, line2.c, line2.b );
            result[ 0 ] = -mat2.det( currMatrix ) / zn;
            mat2.setValues( currMatrix, line1.a, line1.c, line2.a, line2.c );
            result[ 1 ] = -mat2.det( currMatrix ) / zn;
        }
        return result;
        // TODO: проверить использование на undefined
    }


    /**
     * Определение пересечения луча и сферы
     * @method tryRaySphere
     * @static
     * @param rayOrigin {Vector3D} Положение луча
     * @param rayDirection {Vector3D} Направление луча
     * @param sphereOrigin {Vector3D} Положение центра сферы
     * @param sphereRadius {number} Радиус сферы
     * @return {Vector3D|undefined} Точка пересечения луча и плоскости
     */
    static tryRaySphere( rayOrigin: Vector3D, rayDirection: Vector3D, sphereOrigin: Vector3D, sphereRadius: number ) {
        let t;
        const k = vec3.sub( rayOrigin, sphereOrigin, IntersectionTests.mSupport[ 0 ] );
        const b = vec3.dot( k, rayDirection );
        const c = vec3.dot( k, k ) - sphereRadius * sphereRadius;
        const d = b * b - c;

        if ( d >= 0 ) {
            const sqrtD = Math.sqrt( d );
            const t1 = -b + sqrtD;
            const t2 = -b - sqrtD;

            const min_t = Math.min( t1, t2 );
            const max_t = Math.max( t1, t2 );

            t = (min_t >= 0) ? min_t : (max_t >= 0) ? max_t : undefined;
            if ( t !== undefined ) {
                t = vec3.scale( rayDirection, t, IntersectionTests.mSupport[ 1 ] );
                vec3.add( t, rayOrigin );
            }
        }
        return t;
    }

    /**
     * Определение пересечения двух ограничивающих прямоугольников
     * @method tryBoundingBoxes2D
     * @static
     * @param bboxA {BoundingBox2D } Ограничивающий прямоугольник A
     * @param bboxB {BoundingBox2D } Ограничивающий прямоугольник B
     * @param [roughFlag] {boolean} Флаг для грубой оценки
     * @return {boolean} Ограничивающие прямоугольники прересекаются
     */
    static tryBoundingBoxes2D( bboxA: BoundingBox2D, bboxB: BoundingBox2D, roughFlag?: true ) {
        let result = false;
        if ( bboxA.getRadius() !== 0 && bboxB.getRadius() !== 0 ) {
            const subVector = vec2.sub( bboxA.getCenter(), bboxB.getCenter(), IntersectionTests.mSupport[ 3 ] );
            if ( vec2.len( subVector ) <= (bboxA.getRadius() + bboxB.getRadius()) ) {
                if ( !roughFlag ) {
                    const aMinimumX = bboxA.getMinimum()[ 0 ];
                    const aMinimumY = bboxA.getMinimum()[ 1 ];
                    const bMinimumX = bboxB.getMinimum()[ 0 ];
                    const bMinimumY = bboxB.getMinimum()[ 1 ];

                    const aMaximumX = bboxA.getMaximum()[ 0 ];
                    const aMaximumY = bboxA.getMaximum()[ 1 ];
                    const bMaximumX = bboxB.getMaximum()[ 0 ];
                    const bMaximumY = bboxB.getMaximum()[ 1 ];

                    result = (
                        bMinimumX >= aMinimumX && bMinimumX <= aMaximumX &&
                        bMinimumY >= aMinimumY && bMinimumY <= aMaximumY ||

                        bMinimumX >= aMinimumX && bMinimumX <= aMaximumX &&
                        bMaximumY >= aMinimumY && bMaximumY <= aMaximumY ||

                        bMaximumX >= aMinimumX && bMaximumX <= aMaximumX &&
                        bMinimumY >= aMinimumY && bMinimumY <= aMaximumY ||

                        bMaximumX >= aMinimumX && bMaximumX <= aMaximumX &&
                        bMaximumY >= aMinimumY && bMaximumY <= aMaximumY ||

                        aMinimumX >= bMinimumX && aMinimumX <= bMaximumX &&
                        aMinimumY >= bMinimumY && aMinimumY <= bMaximumY
                    );

                } else {
                    result = true;
                }
            }
        }
        return result;
    }

    /**
     * Определение пересечения луча и ограничивающего прямоугольника
     * @method tryBoundingBoxes2D
     * @static
     * @param rayOrigin {Vector2D} Положение луча
     * @param rayDirection {Vector2D} Направление луча
     * @param bbox {BoundingBox2D } Ограничивающий прямоугольник
     * @return {boolean} Луч пересекает ограничивающий прямоугольник
     */
    static tryRayBbox2D( rayOrigin: Vector2D, rayDirection: Vector2D, bbox: BoundingBox2D ) {
        if ( rayOrigin[ 0 ] >= bbox.getMinimum()[ 0 ] && rayOrigin[ 0 ] <= bbox.getMaximum()[ 0 ] &&
            rayOrigin[ 1 ] >= bbox.getMinimum()[ 1 ] && rayOrigin[ 1 ] <= bbox.getMaximum()[ 1 ] ) {
            return true;
        }

        // ray parameter
        let t_near = Number.MIN_VALUE,
            t_far = Number.MAX_VALUE,
            t1, t2;

        // directions loop
        for ( let i = 0; i < 2; i++ ) {
            if ( Math.abs( rayDirection[ i ] ) > 0 ) {
                t1 = (bbox.getMinimum()[ i ] - rayOrigin[ i ]) / rayDirection[ i ];
                t2 = (bbox.getMaximum()[ i ] - rayOrigin[ i ]) / rayDirection[ i ];

                if ( t1 > t2 ) {
                    const d = t2;
                    t2 = t1;
                    t1 = d;
                }

                if ( t1 > t_near ) {
                    t_near = t1;
                }
                if ( t2 < t_far ) {
                    t_far = t2;
                }

                if ( t_near > t_far ) {
                    return false;
                }
                if ( t_far < 0 ) {
                    return false;
                }
            } else {
                if ( rayOrigin[ i ] < bbox.getMinimum()[ i ] || rayOrigin[ i ] > bbox.getMaximum()[ i ] )
                    return false;
            }
        }

        return (t_near <= t_far && t_far >= 0);
    }

    /**
     * Определение пересечения двух отрезков на плоскости
     * @method trySegmentSegment2D
     * @static
     * @param p1 {Vector2D} Начальная точка первого отрезка
     * @param q1 {Vector2D} Конечная точка первого отрезка
     * @param p2 {Vector2D} Начальная точка второго отрезка
     * @param q2 {Vector2D} Конечная точка второго отрезка
     * @return {boolean}  Флаг пересечения отрезков
     */
    static trySegmentSegment2D( p1: Vector2D, q1: Vector2D, p2: Vector2D, q2: Vector2D ) {
        // Find the four orientations needed for general and
        // special cases
        const o1 = PolygonAlgorithms.orientation2D( p1, q1, p2 );
        const o2 = PolygonAlgorithms.orientation2D( p1, q1, q2 );
        const o3 = PolygonAlgorithms.orientation2D( p2, q2, p1 );
        const o4 = PolygonAlgorithms.orientation2D( p2, q2, q1 );

        // General case
        if ( o1 !== o2 && o3 !== o4 )
            return true;

        // Special Cases
        // p1, q1 and p2 are collinear and p2 lies on segment p1q1
        if ( o1 === WindingOrder.Collinear && ContainmentTests.onSegment2D( p1, p2, q1 ) ) return true;

        // p1, q1 and q2 are collinear and q2 lies on segment p1q1
        if ( o2 === WindingOrder.Collinear && ContainmentTests.onSegment2D( p1, q2, q1 ) ) return true;

        // p2, q2 and p1 are collinear and p1 lies on segment p2q2
        if ( o3 === WindingOrder.Collinear && ContainmentTests.onSegment2D( p2, p1, q2 ) ) return true;

        // p2, q2 and q1 are collinear and q1 lies on segment p2q2
        return o4 === WindingOrder.Collinear && ContainmentTests.onSegment2D( p2, q1, q2 );

    }

    /**
     * Определение пересечения отрезка и треугольника на плоскости
     * @method trySegmentSegment2D
     * @static
     * @param p {Vector2D} Начальная точка отрезка
     * @param q {Vector2D} Конечная точка отрезка
     * @param a {Vector2D} Вершина треугольника 0
     * @param b {Vector2D} Вершина треугольника 1
     * @param c {Vector2D} Вершина треугольника 2
     * @return {boolean}  Флаг пересечения отрезка и треугольника
     */
    static trySegmentTriangle2D( p: Vector2D, q: Vector2D, a: Vector2D, b: Vector2D, c: Vector2D ) {

        const g = ContainmentTests.positionToSegment2D;
        // возвращает 1/0, если отрезок [p,q] пересекает/не пересекает треугольник abc

        // r1 == 3 -> треугольник по одну сторону от отрезка
        const r1 = (3 !== Math.abs( g( p, q, a ) + g( p, q, b ) + g( p, q, c ) ));
        // r2 == 2 -> точки p,q по одну сторону от стороны ab
        const r2 = (2 !== Math.abs( g( a, b, p ) + g( a, b, q ) ));
        // r3 == 2 -> точки p,q по одну сторону от стороны bc
        const r3 = (2 !== Math.abs( g( b, c, p ) + g( b, c, q ) ));
        // r4 == 2 -> точки p,q по одну сторону от стороны ca
        const r4 = (2 !== Math.abs( g( c, a, p ) + g( c, a, q ) ));
        // r2 == r3 == r4 == 2 -> точки p,q по одну сторону от треугольника abс
        return (r1 && (r2 || r3 || r4));

    }
}
