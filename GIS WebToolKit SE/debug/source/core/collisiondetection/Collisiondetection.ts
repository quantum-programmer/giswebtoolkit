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

import { Vector2D } from '~/3d/engine/core/Types';
import { vec2 } from '~/3d/engine/utils/glmatrix';
import { Cartesian2D } from '~/geometry/Cartesian2D';

/**
 * Определение вхождения точки
 * @static
 * @class ContainmentTests
 */
export class ContainmentTests {
    /**
     * Определение вхождения точки в контур плоского полигона
     * @method pointInsideObjectContour2D
     * @static
     * @param point {Cartesian2D} Точка в прямоугольных координатах
     * @param vertices {Cartesian2D[]} Вершины контура полигона в прямоугольных координатах
     * @return {boolean} Точка внутри полигона
     */
    static pointInsideObjectContour2D( point: Cartesian2D, vertices: Cartesian2D[] ) {
        //https://www.crhallberg.com/CollisionDetection/Website/poly-point.html
        let collision = false;

        const px = point.x, py = point.y;

        // go through each of the vertices, plus
        // the next vertex in the list
        let next = 0;
        for ( let current = 0; current < vertices.length; current++ ) {
            // get next vertex in list
            // if we’ve hit the end, wrap around to 0
            next = current + 1;
            if ( next == vertices.length ) next = 0;

            // get the PVectors at our current position
            // this makes our if statement a little cleaner
            const vc = vertices[ current ]; // c for “current”
            const vn = vertices[ next ]; // n for “next”

            // compare position, flip ‘collision’ variable
            // back and forth
            if (
                ((vc.y > py && vn.y < py) || (vc.y < py && vn.y > py)) &&
                px < (vn.x - vc.x) * (py - vc.y) / (vn.y - vc.y) + vc.x
            ) {
                collision = !collision;
            }
        }
        return collision;
    }

    /**
     * Определение попадания точки на линию
     * @method pointOnSegment2D
     * @static
     * @param point {Vector2D} Точка в прямоугольных координатах
     * @param vertices {[Vector2D, Vector2D]} Точки отрезка
     * @param [buffer] {number} Область поиска (точность снижается с увеличением области)
     * @return {boolean} Точка на линии
     */
    static pointOnSegment2D( point: Vector2D, vertices: [Vector2D, Vector2D], buffer = 0.1 ) {
        //https://www.crhallberg.com/CollisionDetection/Website/line-point.html
        // get distance from the point to the two ends of the line
        const curVec = vec2.create();
        const d1 = vec2.len( vec2.sub( point, vertices[ 0 ], curVec ) );
        const d2 = vec2.len( vec2.sub( point, vertices[ 1 ], curVec ) );

        // get the length of the line
        const lineLen = vec2.len( vec2.sub( vertices[ 0 ], vertices[ 1 ], curVec ) );

        // since floats are so minutely accurate, add
        // a little buffer zone that will give collision

        // if the two distances are equal to the line’s
        // length, the point is on the line!
        // note we use the buffer here to give a range,
        // rather than one #
        if ( d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer ) {
            return true;
        }
        return false;
    }

    /**
     * Определение ближайшей точки к отрезку
     * @method findNearestPointToSegment
     * @static
     * @param point {Vector2D} Точка в прямоугольных координатах
     * @param vertices {[Vector2D, Vector2D]} Точки отрезка
     * @return {boolean} Точка на отрезке
     */
    static findNearestPointToSegment( point: Vector2D, vertices: [Vector2D, Vector2D] ) {

        const pnt = point;
        const [start, end] = vertices;

        const line = vec2.sub( end, start, vec2.create() );
        const len = vec2.len( line );
        vec2.normalize( line );

        const v = vec2.sub( pnt, start, vec2.create() );
        let d = vec2.dot( v, line );
        d = Math.min( Math.max( d, 0 ), len );
        return vec2.scaleAndAdd( start, line, d, vec2.create() );
    }

}
