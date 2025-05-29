/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Методы триангуляции на эллипсоиде                 *
 *                                                                  *
 *******************************************************************/

import LinkedList from '~/3d/engine/utils/linkedlist';
import { Vector3D } from '~/3d/engine/core/Types';
import { ContainmentTests } from '~/3d/engine/core/collisiondetection/collisiondetection';
import { vec3 } from '~/3d/engine/utils/glmatrix';

/**
 * Класс методов триангуляции на эллипсоиде
 * @static
 * @class EarClipping3d
 */
export default class EarClipping3d {
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property mSupport
     */
    private static mSupport = [vec3.create(), vec3.create(), vec3.create()];

    /**
     * Соответствие условиям выпуклого многоугольника
     * @method isTipConvex
     * @param p0 {Vector3D} Вершина треугольника 0
     * @param p1 {Vector3D} Вершина треугольника 1
     * @param p2 {Vector3D} Вершина треугольника 2
     * @return {boolean} Треугольник соответствует условиям
     */
    static isTipConvex( p0: Vector3D, p1: Vector3D, p2: Vector3D ) {
        const support = EarClipping3d.mSupport;
        const u = vec3.sub( p1, p0, support[ 0 ] );
        const v = vec3.sub( p2, p1, support[ 1 ] );
        return vec3.dot( vec3.cross( u, v, support[ 2 ] ), p1 ) >= 0.0;
    }

    /**
     * Триангуляция полигона
     * @method triangulate
     * @param positionsList {Vector3D[]} Массив вершин
     * @return {number[]} Массив индексов треугольников
     */
    static triangulate( positionsList: Vector3D[] ) {
        //
        // Doubly linked list.  This would be a tad cleaner if it were also circular.
        //
        const remainingPositions = new LinkedList<Vector3D>();

        for ( let i = 0; i < positionsList.length; i++ ) {
            remainingPositions.add( positionsList[ i ], i );
        }

        const indices = [];
        let previousNode, node, nextNode;
        ///////////////////////////////////////////////////////////////////

        previousNode = remainingPositions.get( 0 );
        if ( previousNode ) {
            node = previousNode.next;
            if ( node ) {
                nextNode = node.next;
            }
        }

        let bailCount = remainingPositions.length * remainingPositions.length;

        while ( remainingPositions.length > 3 && previousNode && node && nextNode ) {
            const p0 = previousNode.value;
            const p1 = node.value;
            const p2 = nextNode.value;

            if ( EarClipping3d.isTipConvex( p0, p1, p2 ) ) {
                let isEar = true;
                // Проверка остальных точек на вхождение
                for ( let n = (nextNode.next || remainingPositions.getHead()); n !== previousNode; n = n ? n.next : remainingPositions.getHead() ) {
                    if ( n && ContainmentTests.pointInsideThreeSidedInfinitePyramid( n.value, [0, 0, 1], p0, p1, p2 ) ) {
                        isEar = false;
                        break;
                    }
                }

                // const nNext = n.next || remainingPositions.getHead();
                // if (isEar && previousNode !== nNext) {
                //     const a = n.value;
                //     const b = nNext.value;
                //     if (
                //         a[0] !== p0[0] && a[1] !== p0[1] && a[2] !== p0[2] &&
                //
                //         a[0] !== p1[0] && a[1] !== p1[1] && a[2] !== p1[2] &&
                //
                //         a[0] !== p2[0] && a[1] !== p2[1] && a[2] !== p2[2] &&
                //
                //         b[0] !== p0[0] && b[1] !== p0[1] && b[2] !== p0[2] &&
                //
                //         b[0] !== p1[0] && b[1] !== p1[1] && b[2] !== p1[2] &&
                //
                //         b[0] !== p2[0] && b[1] !== p2[1] && b[2] !== p2[2] &&
                //
                //         (IntersectionTests.trySegmentSegment2D(a, b, p0, p1) ||
                //             IntersectionTests.trySegmentSegment2D(a, b, p0, p2) ||
                //             IntersectionTests.trySegmentSegment2D(a, b, p1, p2))
                //     ) {
                //         isEar = false;
                //         break;
                //     }
                // }

                if ( isEar ) {
                    indices.push( previousNode.index, node.index, nextNode.index );
                    remainingPositions.removeNode( node );

                    node = nextNode;
                    nextNode = nextNode.next || remainingPositions.getHead();
                    continue;
                }
            }

            previousNode = previousNode.next || remainingPositions.getHead();
            node = node.next || remainingPositions.getHead();
            nextNode = nextNode.next || remainingPositions.getHead();

            if ( --bailCount === 0 ) {
                break;
            }
        }

        const n0 = remainingPositions.get( 0 );
        if ( n0 ) {
            const n1 = n0.next;
            if ( n1 ) {
                const n2 = n1.next;
                if ( n2 ) {
                    indices.push( n0.index, n1.index, n2.index );
                }
            }
        }
        return bailCount !== 0 ? indices : undefined;

    }
}
