/****************************************** Тазин В.О. 23/06/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Геометрия плоскости                        *
 *                                                                  *
 *******************************************************************/

'use strict';
import { IntersectionTests } from '~/3d/engine/core/collisiondetection/collisiondetection';
import { vec2, vec3 } from '~/3d/engine/utils/glmatrix';
import { Vector2D, Vector3D } from '~/3d/engine/core/Types';


/**
 * Класс плоской поверхности
 * @class TangentPlane
 * @param origin {Vector3D} Центр плоскости в геоцентрической системе
 * @param normal {Vector3D} Нормаль плоскости
 */
export default class TangentPlane {

    private readonly origin = vec3.create();
    private readonly normal = vec3.create();

    private readonly d: number;
    private readonly rayOrigin = vec3.create();
    private readonly xAxis = vec3.create();
    private readonly yAxis = vec3.create();

    constructor( origin: Vector3D, normal: Vector3D ) {
        vec3.set( origin, this.origin );
        vec3.set( normal, this.normal );

        this.d = vec3.dot( vec3.scale( this.origin, -1, TangentPlane.mSupport[ 0 ] ), this.normal );
        vec3.sub( this.origin, vec3.scale( this.normal, -this.d, this.rayOrigin ), this.rayOrigin );

        vec3.normalize( vec3.cross( this.normal, vec3.mostOrthogonalAxis( this.normal ), this.yAxis ) );
        vec3.normalize( vec3.cross( this.yAxis, this.normal, this.xAxis ) );
    }

    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {[Vector3D, Vector3D, Vector3D]} mSupport
     */
    private static mSupport: [Vector3D, Vector3D, Vector3D] = [vec3.create(), vec3.create(), vec3.create()];

    /**
     * Получить точку на поверхности эллипсоида в центре участка
     * @method getOrigin
     * @return {Vector3D} Точка на поверхности эллипсоида в центре участка
     */
    getOrigin() {
        return this.origin;
    }

    /**
     * Получить нормализованный вектор геодезической нормали
     * @method getNormal
     * @return {Vector3D} Нормализованный вектор геодезической нормали
     */
    getNormal() {
        return this.normal;
    }

    /**
     * Получить смещение плоскости поверхности
     * @method getD
     * @return {number} смещение плоскости поверхности
     */
    getD() {
        return this.d;
    }

    /**
     * Получить вектор оси X
     * @method getXaxis
     * @return {Vector3D} Вектор оси X
     */
    getXaxis() {
        return this.xAxis;
    }

    /**
     * Получить вектор оси Y
     * @method getYaxis
     * @return {Vector3D} Вектор оси Y
     */
    getYaxis() {
        return this.yAxis;
    }

    /**
     * Посчитать проекции точек на плоскость
     * @method computePositionsOnPlane
     * @param positions {Vector3D[]} Массив точек в геоцентрической системе
     * @return {Vector2D[]} Массив точек на плоскости
     */
    computePositionsOnPlane( positions: Vector3D[] ) {
        const positionsOnPlane: Vector2D[] = [];
        const intersectionPoint = vec3.create();
        for ( let i = 0; i < positions.length; i++ ) {
            const position = positions[ i ];
            const rayDirection = TangentPlane.mSupport[ 0 ];
            vec3.normalize( vec3.sub( position, this.rayOrigin, rayDirection ) );

            IntersectionTests.tryRayPlane( this.rayOrigin, rayDirection, this.normal, this.d, intersectionPoint );

            if ( intersectionPoint !== undefined ) {
                const v = vec3.sub( intersectionPoint, this.rayOrigin, TangentPlane.mSupport[ 1 ] );
                // память
                const x = vec3.dot( this.xAxis, v );
                const y = vec3.dot( this.yAxis, v );

                positionsOnPlane.push( vec2.setValues( vec2.create(), x, y ) );
            } else {
                // Ray does not intersect plane
            }
        }

        return positionsOnPlane;
    }

    /**
     * Посчитать точки эна плоскости в геоцентрической системе
     * @method planePositionsToGeocentic
     * @param positionsOnPlane {Vector2D} Массив проекций точек на плоскости
     * @param [dest] {Vector3D[]} Результат
     * @return {Vector3D[]} Результат/Массив точек в геоцентрической системе
     */
    planePositionsToGeocentic( positionsOnPlane: Vector2D[], dest: Vector3D[] = [] ) {
        for ( let i = 0; i < positionsOnPlane.length; i++ ) {
            const position = positionsOnPlane[ i ];

            // Положение точки на плоскости в мировой системе координат относительно центра плоскости
            const planeWorldPos = vec3.add( vec3.scale( this.xAxis, position[ 0 ], TangentPlane.mSupport[ 1 ] ), vec3.scale( this.yAxis, position[ 1 ], TangentPlane.mSupport[ 2 ] ), TangentPlane.mSupport[ 0 ] );

            // Положение точки в мировой системе координат
            const worldPos = vec3.add( planeWorldPos, this.origin, vec3.create() );

            dest.push( worldPos );
        }
        return dest;
    }
}

