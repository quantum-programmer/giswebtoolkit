/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Построение меша с заданным шагом                   *
 *                                                                  *
 *******************************************************************/
import Edge, { EdgeList } from '~/3d/engine/core/geometry/edge';
import { Vector3D } from '../../core/Types';
import { vec3 } from '~/3d/engine/utils/glmatrix';

/**
 * Класс построения меша с заданным шагом
 * @static
 * @class TriangleMeshSubdivision
 */
export default class TriangleMeshSubdivision {
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property mSupport
     */
    private static mSupport: [Vector3D[], Vector3D[]] = [[], []];

    /**
     * Посчитать меш с заданным шагом
     * @static
     * @method compute
     * @param positions {array} Массив точек
     * @param indicesValues {array} Массив индексов
     * @param granularity {number} Шаг в радианах
     * @return {TriangleMeshSubdivisionResult|undefined} Результат построения меша с заданным шагом
     */
    static compute( positions: Vector3D[], indicesValues: number[], granularity: number ) {

        if ( indicesValues.length < 3 || indicesValues.length % 3 !== 0 || granularity <= 0 ) {
            return;
        }

        //
        // Use two queues:  one for triangles that need (or might need) to be
        // subdivided and other for triangles that are fully subdivided.
        //
        const triangles = this.mSupport[ 0 ];
        triangles.length = 0;
        const done = this.mSupport[ 1 ];
        done.length = 0;

        for ( let i = 0; i < indicesValues.length; i += 3 ) {
            const triangle = vec3.create();
            vec3.setValues( triangle, indicesValues[ i ], indicesValues[ i + 1 ], indicesValues[ i + 2 ] );
            triangles.push( triangle );
        }

        //
        // New positions due to edge splits are appended to the positions list.
        //
        const subdividedPositions = positions.slice();

        //
        // Used to make sure shared edges are not split more than once.
        //
        const edges = new EdgeList();

        //
        // Subdivide triangles until we run out
        //
        while ( triangles.length !== 0 ) {
            const triangle = triangles.shift()!;

            const v0 = subdividedPositions[ triangle[ 0 ] ];
            const v1 = subdividedPositions[ triangle[ 1 ] ];
            const v2 = subdividedPositions[ triangle[ 2 ] ];

            const g0 = vec3.angleBetween( v0, v1 );
            const g1 = vec3.angleBetween( v1, v2 );
            const g2 = vec3.angleBetween( v2, v0 );

            const max = Math.max( g0, g1, g2 );

            if ( max > granularity ) {
                if ( g0 === max ) {
                    const edge = new Edge( Math.min( triangle[ 0 ], triangle[ 1 ] ), Math.max( triangle[ 0 ], triangle[ 1 ] ) );
                    let i = edges.tryGetValue( edge );
                    if ( i === undefined ) {
                        const position = vec3.create( v0 );
                        vec3.add( position, v1 );
                        vec3.scale( position, 0.5 );
                        subdividedPositions.push( position );
                        // subdividedPositions.push([(v0[0]+v1[0])*0.5,(v0[1]+v1[1])*0.5]);
                        i = subdividedPositions.length - 1;
                        edges.add( edge, i );
                    }

                    triangles.push( [triangle[ 0 ], i, triangle[ 2 ]] );
                    triangles.push( [i, triangle[ 1 ], triangle[ 2 ]] );
                } else if ( g1 === max ) {
                    const edge = new Edge( Math.min( triangle[ 1 ], triangle[ 2 ] ), Math.max( triangle[ 1 ], triangle[ 2 ] ) );
                    let i = edges.tryGetValue( edge );
                    if ( i === undefined ) {
                        const position = vec3.create( v1 );
                        vec3.add( position, v2 );
                        vec3.scale( position, 0.5 );
                        subdividedPositions.push( position );
                        // subdividedPositions.push([(v1[0]+v2[0])*0.5,(v1[1]+v2[1])*0.5]);
                        i = subdividedPositions.length - 1;
                        edges.add( edge, i );
                    }

                    triangles.push( [triangle[ 1 ], i, triangle[ 0 ]] );
                    triangles.push( [i, triangle[ 2 ], triangle[ 0 ]] );
                } else if ( g2 === max ) {
                    const edge = new Edge( Math.min( triangle[ 2 ], triangle[ 0 ] ), Math.max( triangle[ 2 ], triangle[ 0 ] ) );
                    let i = edges.tryGetValue( edge );
                    if ( i === undefined ) {
                        const position = vec3.create( v2 );
                        vec3.add( position, v0 );
                        vec3.scale( position, 0.5 );
                        subdividedPositions.push( position );
                        // subdividedPositions.push([(v2[0]+v0[0])*0.5,(v2[1]+v0[1])*0.5]);
                        i = subdividedPositions.length - 1;
                        edges.add( edge, i );
                    }

                    triangles.push( [triangle[ 2 ], i, triangle[ 1 ]] );
                    triangles.push( [i, triangle[ 0 ], triangle[ 1 ]] );
                }
            } else {
                done.push( triangle );
            }
        }


        const subdividedIndices = [];
        for ( let t = 0; t < done.length; t++ ) {
            subdividedIndices.push( done[ t ][ 0 ] );
            subdividedIndices.push( done[ t ][ 1 ] );
            subdividedIndices.push( done[ t ][ 2 ] );
        }

        return new TriangleMeshSubdivisionResult( subdividedPositions, subdividedIndices );
    }
}

/**
 * Класс результата построения меша с заданным шагом
 * @class TriangleMeshSubdivisionResult
 * @param positions {array} Массив точек
 * @param indices {array} Массив индексов
 */
class TriangleMeshSubdivisionResult {
    private readonly positions: Vector3D[] = [];
    private readonly indices: number[] = [];

    constructor( positions: Vector3D[], indices: number[] ) {
        this.positions = positions;
        this.indices = indices;
    }

    /**
     * Получить массив точек
     * @method getPositions
     * @return {Vector3D[]} Массив точек
     */
    getPositions() {
        return this.positions;
    }

    /**
     * Получить набор индексов
     * @method getIndices
     * @return {array} Набор индексов
     */
    getIndices() {
        return this.indices;
    }
}
