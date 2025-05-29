/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Построение отрезков с заданным шагом                   *
 *                                                                  *
 *******************************************************************/

import { vec3 } from '../glmatrix';
import { Vector3D } from '../../core/Types';

/**
 * Класс построения отрезков с заданным шагом
 * @static
 * @class LineSubdivision
 */
export default class LineSubdivision {
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property mSupport
     */
    private static readonly mSupport: [Vector3D, Vector3D] = [vec3.create(), vec3.create()];

    /**
     * Посчитать отрезок с заданным шагом
     * @static
     * @method compute
     * @param startPosition {Vector3D} Начало отрезка
     * @param endPosition {Vector3D} Конец отрезка
     * @param granularity {number} Шаг в радианах
     * @param [exclude] {boolean} Флаг невключения в результат крайних точек
     * @return {Vector3D[]} Результат построения отрезка с заданным шагом
     */
    static compute( startPosition: Vector3D, endPosition: Vector3D, granularity: number, exclude?: true ) {
        const subdividedPositions: Vector3D[] = [];

        if ( granularity <= 0 ) {
            return subdividedPositions;
        }

        const support = this.mSupport;
        let angle = vec3.angleBetween( startPosition, endPosition ),
            sectionsCount = 1;

        while ( angle > granularity ) {
            angle *= 0.5;
            sectionsCount *= 2;
        }

        const totalVector = vec3.sub( endPosition, startPosition, support[ 0 ] );
        const totalLength = vec3.len( totalVector );

        const unitVector = vec3.normalize( totalVector );
        vec3.scale( unitVector, totalLength / sectionsCount );


        if ( !exclude ) {
            subdividedPositions.push( startPosition );
        }

        const curVector = vec3.set( unitVector, support[ 1 ] );
        for ( let i = 0; i < sectionsCount - 1; i++ ) {
            subdividedPositions.push( vec3.add( startPosition, curVector, vec3.create() ) );
            vec3.add( curVector, unitVector );
        }
        if ( !exclude ) {
            subdividedPositions.push( endPosition );
        }

        return subdividedPositions;
    }
}
