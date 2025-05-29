/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Поверхность эллипсоида                     *
 *                                                                  *
 *******************************************************************/

import { IntersectionTests } from '~/3d/engine/core/collisiondetection/collisiondetection';
import Ellipsoid from '~/3d/engine/core/geometry/ellipsoid';
import { Vector2D, Vector3D } from '~/3d/engine/core/Types';
import BoundingBox3D from '~/3d/engine/core/boundingvolumes/bbox3d';
import { vec2, vec3 } from '~/3d/engine/utils/glmatrix';

/**
 * Класс поверхности эллипсоида
 * @class EllipsoidTangentPlane
 * @param ellipsoid {Ellipsoid} Эллипсоид
 * @param positions {Vector3D[]} Массив точек
 */
export default class EllipsoidTangentPlane {
    private readonly origin: Vector3D;
    private readonly normal: Vector3D;
    private readonly d: number;
    private readonly xAxis: Vector3D;
    private readonly yAxis: Vector3D;

    constructor( ellipsoid: Ellipsoid, positions: Vector3D[] ) {
        const box = new BoundingBox3D();
        box.fitPoints( positions );

        this.origin = ellipsoid.scaleToGeodeticSurface( box.getCenter() );
        this.normal = ellipsoid.geodeticSurfaceNormalInPoint( this.origin, vec3.create() );

        this.d = vec3.dot( vec3.scale( this.origin, -1, vec3.create() ), this.normal );
        this.yAxis = vec3.normalize( vec3.cross( this.origin, vec3.mostOrthogonalAxis( this.origin ), vec3.create() ) );
        this.xAxis = vec3.normalize( vec3.cross( this.yAxis, this.origin, vec3.create() ) );
    }

    /**
     * Вспомогательный массив
     * @static
     * @property {Vector3D[]} mSupport
     */
    private static mSupport = [vec3.create(), vec3.create(), vec3.create(), vec3.create()];

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
     * @return {number} Смещение плоскости поверхности
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
     * Посчитать проекции точек эллипсоида на плоскость
     * @method computePositionsOnPlane
     * @param positions {Vector3D[]} Массив точек на эллипсоиде
     * @return {Vector2D[]} Массив точек на плоскости
     */
    computePositionsOnPlane( positions: Vector3D[] ) {
        const positionsOnPlane: Vector2D[] = [];
        const mSupport = EllipsoidTangentPlane.mSupport;
        for ( let i = 0; i < positions.length; i++ ) {
            const position = positions[ i ];

            const intersectionPoint = IntersectionTests.tryRayPlane( vec3.ZERO, vec3.normalize( position, mSupport[ 1 ] ), this.normal, this.d, mSupport[ 2 ] );
            if ( intersectionPoint ) {
                const v = vec3.sub( intersectionPoint, this.origin, mSupport[ 3 ] );
                positionsOnPlane.push( vec2.setValues( vec2.create(), vec3.dot( this.xAxis, v ), vec3.dot( this.yAxis, v ) ) );
            } else {
                // Ray does not intersect plane
            }
        }

        return positionsOnPlane;
    }

    /**
     * Спроецировать точки на плоскости на эллипсоид
     * @method planePositionsOnEllipsoid
     * @param positionsOnPlane {Vector2D[]} Массив проекций точек на плоскость
     * @return {Vector3D[]} Массив точек на эллипсоиде в мировой системе координат
     */
    planePositionsOnEllipsoid( positionsOnPlane: Vector2D[] ) {

        const positions: Vector3D[] = [];
        for ( let i = 0; i < positionsOnPlane.length; i++ ) {
            const position = positionsOnPlane[ i ];

            // Положение точки на плоскости в мировой системе координат относительно центра плоскости
            const planeWorldPos = vec3.add( vec3.scale( this.xAxis, position[ 0 ], EllipsoidTangentPlane.mSupport[ 1 ] ), vec3.scale( this.yAxis, position[ 1 ], EllipsoidTangentPlane.mSupport[ 2 ] ), EllipsoidTangentPlane.mSupport[ 0 ] );

            // Положение точки в мировой системе координат
            const worldPos = vec3.add( planeWorldPos, this.origin );

            positions.push( vec3.normalize( worldPos, vec3.create() ) );
        }
        return positions;
    }
}
