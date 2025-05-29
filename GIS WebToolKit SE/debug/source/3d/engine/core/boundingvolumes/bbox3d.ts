/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *         Ограничивающий неориентированный параллелепипед          *
 *                                                                  *
 *******************************************************************/

import { Vector3D } from '~/3d/engine/core/Types';
import { vec3 } from '~/3d/engine/utils/glmatrix';
import { CommonBoundingVolume3DSerialized } from '~/3d/engine/core/boundingvolumes/Types';

/**
 * Ограничивающий неориентированный параллелепипед
 * @class BoundingBox3D
 */
export default class BoundingBox3D {

    private centerPoint = vec3.create();
    private radius = 0;
    private points = [vec3.create(), vec3.create()];
    private json: CommonBoundingVolume3DSerialized = {
        points: this.points
    };

    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mRadiusVec
     */
    private static mRadiusVec = vec3.create();

    /**
     * Получить значение центра
     * @method getCenter
     * @return {Vector3D} Координаты центра
     */
    getCenter() {
        return this.centerPoint;
    }

    /**
     * Получить значение радиуса описанной сферы
     * @method getRadius
     * @return {number} Значение радиуса описанной сферы
     */
    getRadius() {
        return this.radius;
    }

    /**
     * Описать параллелепипед вокруг точек
     * @method fitPoints
     * @param points {Vector3D[]} Массив точек
     */
    fitPoints( points: Vector3D[] ) {
        if ( points.length === 0 ) {
            console.warn( 'Invalid input data' );
        }

        const point = points[ 0 ];

        let minimumX = point[ 0 ];
        let minimumY = point[ 1 ];
        let minimumZ = point[ 2 ];

        let maximumX = point[ 0 ];
        let maximumY = point[ 1 ];
        let maximumZ = point[ 2 ];

        for ( let i = 1; i < points.length; i++ ) {
            const point = points[ i ];
            if ( point[ 0 ] < minimumX ) {
                minimumX = point[ 0 ];
            }

            if ( point[ 0 ] > maximumX ) {
                maximumX = point[ 0 ];
            }

            if ( point[ 1 ] < minimumY ) {
                minimumY = point[ 1 ];
            }

            if ( point[ 1 ] > maximumY ) {
                maximumY = point[ 1 ];
            }

            if ( point[ 2 ] < minimumZ ) {
                minimumZ = point[ 2 ];
            }

            if ( point[ 2 ] > maximumZ ) {
                maximumZ = point[ 2 ];
            }
        }

        const minimum = this.points[ 0 ];
        vec3.setValues( minimum, minimumX, minimumY, minimumZ );

        const maximum = this.points[ 1 ];
        vec3.setValues( maximum, maximumX, maximumY, maximumZ );


        vec3.scale( vec3.add( minimum, maximum, this.centerPoint ), 0.5 );

        this.radius = vec3.len( vec3.sub( maximum, this.centerPoint, BoundingBox3D.mRadiusVec ) );
        this.radius = Math.max( this.radius, vec3.len( vec3.sub( minimum, this.centerPoint, BoundingBox3D.mRadiusVec ) ) );
    }

    /**
     * Получить сериализуемый JSON объект
     * @method toJSON
     * @return {CommonBoundingVolume3DSerialized} сериализуемый JSON объект
     */
    toJSON() {
        return this.json;
    }

    /**
     * Забрать данные из JSON объекта
     * @method fromJSON
     * @param json {CommonBoundingVolume3DSerialized} JSON объект
     */
    fromJSON( json: CommonBoundingVolume3DSerialized ) {
        this.fitPoints( json.points );
    }
}
