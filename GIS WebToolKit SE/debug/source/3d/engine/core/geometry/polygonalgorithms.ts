/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Алгоритмы полигона                       *
 *                                                                  *
 *******************************************************************/

import { WindingOrder } from '~/3d/engine/core/geometry/mesh';
import { AnyVector, Vector2or3 } from '../Types';

/**
 * Класс алгоритмов полигона
 * @class PolygonAlgorithms
 * @static
 */
export default class PolygonAlgorithms {
    /**
     * Удаление повторяющихся вершин
     * @static
     * @method cleanup
     * @param positionsList {AnyVector[]} Исходный массив вершин
     * @param [outputArray] {AnyVector[]} Результирующий массив вершин
     * @return {AnyVector[]} Результирующий массив вершин
     */
    static cleanup<T extends AnyVector>( positionsList: T[], outputArray: T[] = [] ) {
        const cleanedPositions = outputArray;
        for ( let i0 = positionsList.length - 1, i1 = 0; i1 < positionsList.length; i0 = i1++ ) {

            const v0 = positionsList[ i0 ];
            const v1 = positionsList[ i1 ];

            if ( !this.checkEqual( v0, v1 ) ) {
                cleanedPositions.push( v1 );
            }
        }
        return cleanedPositions;
    }

    /**
     * Проверка равенства вершин
     * @static
     * @method checkEqual
     * @param a {AnyVector} Первая вершина
     * @param b {AnyVector} Вторая вершина
     * @return {boolean} Равенство
     */
    static checkEqual( a: AnyVector, b: AnyVector ) {
        let result = true;

        if ( a.length !== b.length ) {
            result = false;
        } else {
            for ( let i = 0; i < a.length; i++ ) {
                if ( a[ i ] !== b[ i ] ) {
                    result = false;
                    break;
                }
            }
        }
        return result;
    }

    /**
     * Посчитать площадь полигона
     * @static
     * @method computeArea
     * @param positionsList {Vector2or3[]} Массив вершин
     * @return {number} Площадь полигона
     */
    static computeArea( positionsList: Vector2or3[] ) {
        let area = 0.0;
        for ( let i0 = positionsList.length - 1, i1 = 0; i1 < positionsList.length; i0 = i1++ ) {
            const v0 = positionsList[ i0 ];
            const v1 = positionsList[ i1 ];
            area += (v0[ 0 ] * v1[ 1 ]) - (v1[ 0 ] * v0[ 1 ]);
        }

        return area * 0.5;
    }

    /**
     * Определить направление следования точек
     * @static
     * @method computeWindingOrder
     * @param positionsList {Vector2or3[]} Массив вершин
     * @return {WindingOrder} Направление обхода
     */
    static computeWindingOrder( positionsList: Vector2or3[] ) {
        return (this.computeArea( positionsList ) >= 0.0) ? WindingOrder.Counterclockwise : WindingOrder.Clockwise;
    }

    /**
     * Определить вхождение точки в полигон
     * @static
     * @method computeWindingOrder
     * @param coords {Vector2or3[]} Массив точек полигона
     * @param point {Vector2or3} Координаты точки [x,y,h?]
     * @return {boolean} Флаг вхождения точки в полигон
     */
    static inPoly( coords: Vector2or3[], point: Vector2or3 ) {
        const count = coords.length;
        let j = count - 1;
        let c = false;
        const x = point[ 0 ];
        const y = point[ 1 ];
        for ( let i = 0; i < count; i++ ) {
            const curPoint = coords[ i ];
            const prevPoint = coords[ j ];
            if ( (((curPoint[ 1 ] <= y) && (y < prevPoint[ 1 ])) || ((prevPoint[ 1 ] <= y) && (y < curPoint[ 1 ]))) &&
                (x > (prevPoint[ 0 ] - curPoint[ 0 ]) * (y - curPoint[ 1 ]) / (prevPoint[ 1 ] - curPoint[ 1 ]) + curPoint[ 0 ]) ) {
                c = !c;
            }
            j = i;
        }
        return c;
    }

    /**
     * Определение ориентации трех точек
     * @static
     * @method orientation2D
     * @param p {Vector2or3} Начальная точка отрезка
     * @param q {Vector2or3} Проверяемая точка
     * @param r {Vector2or3} Конечная точка отрезка
     * @return {WindingOrder} Ориентация точек
     */
    static orientation2D( p: Vector2or3, q: Vector2or3, r: Vector2or3 ) {
        // See https://www.geeksforgeeks.org/orientation-3-ordered-points/
        const val = (q[ 1 ] - p[ 1 ]) * (r[ 0 ] - q[ 0 ]) -
            (q[ 0 ] - p[ 0 ]) * (r[ 1 ] - q[ 1 ]);

        if ( val === 0 ) return WindingOrder.Collinear;

        return (val > 0) ? WindingOrder.Clockwise : WindingOrder.Counterclockwise;
    }
}

