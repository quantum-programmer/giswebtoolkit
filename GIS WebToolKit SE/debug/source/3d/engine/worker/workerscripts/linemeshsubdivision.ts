/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Построение меша линии по рельефу                   *
 *                                                                  *
 *******************************************************************/

import Geodetic3D from '~/3d/engine/core/geodetic3d';
import Indices, { IndicesType } from '~/3d/engine/core/geometry/indices';
import HeightTile from '~/3d/engine/scene/terrain/heightsource/heighttile';
import { Vector2D, Vector3D } from '~/3d/engine/core/Types';
import Line2DCreator from '~/3d/engine/core/lines/line2d';
import { IntersectionTests } from '~/3d/engine/core/collisiondetection/collisiondetection';
import { vec2, vec3 } from '~/3d/engine/utils/glmatrix';

/**
 * Класс построения меша линии по рельефу
 * @static
 * @class LineMeshSubdivision
 */
export default class LineMeshSubdivision {
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property mSupport
     */
    private static mSupport: [Vector2D[], number[], Vector2D, Vector2D, Vector2D, Vector2D] = [[], [], [0, 0], [0, 0], [0, 0], [0, 0]];

    /**
     * Посчитать меш с заданным шагом
     * @method computeByHeightTile
     * @param positions {Vector3D[]} Массив точек
     * @param heightTile {HeightTile} Тайл высот
     * @return {LineMeshSubdivisionResult} Меш с заданным шагом
     */
    computeByHeightTile( positions: Vector3D[], heightTile: HeightTile ) {

        if ( positions == null || heightTile == null ) {
            return null;
        }
        const support = LineMeshSubdivision.mSupport;
        const subdividedIndices = new Indices( IndicesType.uByte );

        const startGeoPoint = new Geodetic3D();
        const endGeoPoint = new Geodetic3D();
        const globeShape = heightTile.projection.getGlobeShape();

        const pointList = [];
        const curPointList = support[ 0 ];
        const curIndicesList = support[ 1 ];

        for ( let n = 0; n < positions.length; n++ ) {

            curPointList.length = 0;
            curIndicesList.length = 0;
            globeShape.toGeodetic3d( positions[ n ], startGeoPoint );
            globeShape.toGeodetic3d( positions[ n + 1 ], endGeoPoint );

            const curResult = support[ 2 ];
            let startPointXY = heightTile.getIndicesByGeoPoint( startGeoPoint );
            let endPointXY = heightTile.getIndicesByGeoPoint( endGeoPoint );

            //TODO: проверить количество точек!!!
            startPointXY[ 0 ] = Math.round( startPointXY[ 0 ] );
            startPointXY[ 1 ] = Math.round( startPointXY[ 1 ] );
            endPointXY[ 0 ] = Math.round( endPointXY[ 0 ] );
            endPointXY[ 1 ] = Math.round( endPointXY[ 1 ] );

            const direction = vec2.sub( endPointXY, startPointXY, support[ 3 ] );

            if ( startPointXY[ 0 ] > endPointXY[ 0 ] ) {
                const a = startPointXY;
                startPointXY = endPointXY;
                endPointXY = a;
            }
            curPointList.push( startPointXY );

            let minX = Math.min( Math.floor( startPointXY[ 0 ] ), Math.floor( endPointXY[ 0 ] ) );
            let minY = Math.min( Math.floor( startPointXY[ 1 ] ), Math.floor( endPointXY[ 1 ] ) );

            let maxX = Math.max( Math.ceil( startPointXY[ 0 ] ), Math.ceil( endPointXY[ 0 ] ) );
            let maxY = Math.max( Math.ceil( startPointXY[ 1 ] ), Math.ceil( endPointXY[ 1 ] ) );

            if ( maxX < minX ) {
                const a = minX;
                minX = maxX;
                maxX = a;
            }
            if ( maxY < minY ) {
                const a = minY;
                minY = maxY;
                maxY = a;
            }


            const lN = vec2.normalize( direction, support[ 4 ] );
            lN[ 0 ] = -lN[ 0 ];

            const line = Line2DCreator.createLineByNormalAndPoint( lN, startPointXY );

            const vA = 1, vB = 0;
            let vC = -minX;
            while ( -vC <= maxX ) {
                const vertLine = Line2DCreator.createLineByABC( vA, vB, vC );
                if ( IntersectionTests.tryLineLine2D( line, vertLine, curResult ) ) {
                    if (
                        curResult[ 0 ] >= startPointXY[ 0 ] && curResult[ 0 ] <= endPointXY[ 0 ] &&
                        curResult[ 1 ] >= startPointXY[ 1 ] && curResult[ 1 ] <= endPointXY[ 1 ]
                    ) {
                        const res = curResult.slice() as Vector2D;
                        curPointList.push( res );
                    }
                }
                vC--;
            }

            const hA = 0, hB = 1;
            let hC = -minY;
            while ( -hC <= maxY ) {
                const horLine = Line2DCreator.createLineByABC( hA, hB, hC );
                if ( IntersectionTests.tryLineLine2D( line, horLine, curResult ) ) {
                    if ( curResult[ 0 ] >= startPointXY[ 0 ] && curResult[ 0 ] <= endPointXY[ 0 ] &&
                        curResult[ 1 ] >= startPointXY[ 1 ] && curResult[ 1 ] <= endPointXY[ 1 ] ) {
                        const res = curResult.slice() as Vector2D;
                        curPointList.push( res );
                    }
                }
                hC--;
            }

            curPointList.push( endPointXY );

            const abV = support[ 5 ];
            curPointList.sort( function ( a: Vector2D, b: Vector2D ) {

                vec2.sub( b, a, abV );
                return -vec2.dot( abV, direction );

                //
                // vec2.sub(a, startPointXY, aV);
                // vec2.sub(b, startPointXY, bV);
                //
                // return vec2.len(aV) - vec2.len(bV);
            } );


            const startIndex = pointList.length;
            if ( startIndex > 0 ) {
                //Переход от предыдущего отрезка
                curIndicesList.push( startIndex - 1 );
                curIndicesList.push( startIndex );
            }

            for ( let i = 0; i < curPointList.length; i++ ) {
                pointList.push( curPointList[ i ] );
            }
            for ( let i = 0; i < curPointList.length - 1; i++ ) {
                curIndicesList.push( startIndex + i );
                curIndicesList.push( startIndex + i + 1 );
            }
            subdividedIndices.add( curIndicesList );

        }
        const resultList = [];
        for ( let i = 0; i < pointList.length; i++ ) {
            const point = heightTile.getGeoPointByIndices( pointList[ i ] );
            point.setHeight( 0 );
            resultList.push( vec3.normalize( globeShape.toVector3d( point ) ) );
        }

        return new LineMeshSubdivisionResult( resultList, subdividedIndices );


    }
}

/**
 * Класс результата построения меша линии по рельефу
 * @class LineMeshSubdivisionResult
 * @param positions {Vector3D[]} Массив точек
 * @param indices {Indices} Набор индексов
 */
class LineMeshSubdivisionResult {
    private readonly positions: Vector3D[];
    private readonly indices: Indices;

    constructor( positions: Vector3D[], indices: Indices ) {
        this.positions = positions;
        this.indices = indices;
    }

    /**
     * Получить массив точек
     * @method getPositions
     * @return {array} Массив точек
     */
    getPositions() {
        return this.positions;
    }

    /**
     * Получить набор индексов
     * @method getIndices
     * @return {Indices} Набор индексов
     */
    getIndices() {
        return this.indices;
    }
}
