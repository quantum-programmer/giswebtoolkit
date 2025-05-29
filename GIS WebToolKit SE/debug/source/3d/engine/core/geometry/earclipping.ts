/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Методы триангуляции на плоскости                  *
 *                                                                  *
 *******************************************************************/

import LinkedList from '~/3d/engine/utils/linkedlist';
import { Vector2or3, Vector2D, Vector3D } from '../Types';
import { ContainmentTests } from '~/3d/engine/core/collisiondetection/collisiondetection';
import { vec2, vec3 } from '~/3d/engine/utils/glmatrix';

/**
 * Класс методов триангуляции на плоскости
 * @static
 * @class EarClipping
 */
export default class EarClipping {
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {[Vector2D, Vector2D, Vector2D, Vector3D, Vector3D]} mSupport
     */
    private static mSupport: [Vector2D, Vector2D, Vector2D, Vector3D, Vector3D] = [vec2.create(), vec2.create(), vec2.create(), vec3.create(), vec3.create()];

    /**
     * Соответствие условиям выпуклого многоугольника
     * @method isTipConvex
     * @param p0 {Vector2or3} Вершина треугольника 0
     * @param p1 {Vector2or3} Вершина треугольника 1
     * @param p2 {Vector2or3} Вершина треугольника 2
     * @return {boolean} Треугольник соответствует условиям
     */
    static isTipConvex( p0: Vector2or3, p1: Vector2or3, p2: Vector2or3 ) {
        const support = EarClipping.mSupport;

        const v0 = vec2.fromPoint( p0, support[ 0 ] );
        const v1 = vec2.fromPoint( p1, support[ 1 ] );
        const v2 = vec2.fromPoint( p2, support[ 2 ] );

        const u = vec2.sub( v1, v0, support[ 0 ] );
        const v = vec2.sub( v2, v1, support[ 1 ] );
        //
        // Use the sign of the z component of the cross product
        //
        const a = vec3.fromVector2( u, support[ 3 ] );
        const b = vec3.fromVector2( v, support[ 4 ] );

        return vec3.cross( a, b )[ 2 ] >= 0.0;
    }

    /**
     * Триангуляция полигона
     * @method triangulate
     * @param positionsList {Vector2D} Массив вершин
     * @return {number[]} Массив индексов треугольников
     */
    static triangulate( positionsList: Vector2D[] ) {
        //
        // Doubly linked list.  This would be a tad cleaner if it were also circular.
        //
        const remainingPositions = new LinkedList<Vector2D>();

        for ( let i = 0; i < positionsList.length; i++ ) {
            remainingPositions.add( positionsList[ i ], i );
        }

        const indices: number[] = [];

        if ( remainingPositions.length > 3 ) {
            let previousNode = remainingPositions.getHead()!,
                node = previousNode.next!,
                nextNode = node.next!;

            let bailCount = remainingPositions.length * remainingPositions.length;

            while ( remainingPositions.length > 3 && bailCount !== 0 ) {
                const headNode = remainingPositions.getHead()!;

                const p0 = previousNode.value;
                const p1 = node.value;
                const p2 = nextNode.value;
                let isEar = false, curNode;
                if ( EarClipping.isTipConvex( p0, p1, p2 ) ) {
                    isEar = true;
                    curNode = nextNode.next || headNode;
                    // Проверка остальных точек на вхождение
                    while ( isEar && curNode !== previousNode ) {
                        if ( ContainmentTests.pointInsideTriangle2D( curNode.value, p0, p1, p2 ) ) {
                            isEar = false;
                        }
                        curNode = curNode.next || headNode;
                    }
                }

                if ( isEar ) {
                    indices.push( previousNode.index, node.index, nextNode.index );
                    remainingPositions.removeNode( node );

                    node = nextNode;
                    nextNode = nextNode.next || remainingPositions.getHead()!;
                } else {
                    previousNode = previousNode.next || headNode;
                    node = previousNode.next || headNode;
                    nextNode = node.next || headNode;

                    bailCount--;
                }
            }
        }
        const n0 = remainingPositions.getHead()!;
        const n1 = n0.next;
        if ( n1 ) {
            const n2 = n1.next;
            if ( n2 ) {
                indices.push( n0.index, n1.index, n2.index );
            }
        }
        return indices;

    }
}
