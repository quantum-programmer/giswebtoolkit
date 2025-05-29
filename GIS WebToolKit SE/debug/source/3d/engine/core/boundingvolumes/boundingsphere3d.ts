/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Ограничивающая сфера                        *
 *                                                                  *
 *******************************************************************/

import { Matrix4x4, Vector3D, Vector4D } from '../Types';
import { FrustumVolume } from '~/3d/refactoringQueue';
import { mat4, vec3, vec4 } from '~/3d/engine/utils/glmatrix';
import { CommonBoundingVolume3DSerialized } from '~/3d/engine/core/boundingvolumes/Types';


/**
 * Ограничивающая сфера
 * @class BoundingSphere3D
 */
export default class BoundingSphere3D {

    private centerPoint = vec3.create();
    private radius = 0;
    private readonly modelMatrix = mat4.create( mat4.IDENTITY );
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
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mClipSpacePoints
     */
    private static mClipSpacePoints = [
        vec4.create(),
        vec4.create(),
        vec4.create(),
        vec4.create(),
        vec4.create(),
        vec4.create(),
        vec4.create(),
        vec4.create()
    ];

    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mCenterPoint
     */
    private static mCenterPoint = vec3.create();

    /**
     * Функция проверки нахождения точки вне объема
     * @method testFrustumPoint
     * @param obb_point {Vector4D} Координаты точки [x,y,z,w]
     * @return {boolean} Точка вне объема
     */
    private static testFrustumPoint( obb_point: Vector4D ) {
        let outside = false, outside_positive_plane = false, outside_negative_plane = false;
        //we have 6 frustum planes, which in clip space is unit cube (for GL) with -1..1 range
        for ( let i = 0; !outside && i < 3; i++ ) {
            //3 because we test positive & negative plane at once
            //if all point outside one of the plane
            //actually it is vertex normalization xyz / w, then compare if all 8points coordinates < -1 or > 1
            outside_positive_plane = obb_point[ i ] > obb_point[ 3 ];
            outside_negative_plane = obb_point[ i ] < -obb_point[ 3 ];

            outside = outside || outside_positive_plane || outside_negative_plane;
            //if (outside_positive_plane || outside_negative_plane)
            //return false;
        }
        return outside;
    }

    /**
     * Получить значение центра
     * @method getCenter
     * @return {Vector3D} Координаты центра
     */
    getCenter() {
        return this.centerPoint;
    }

    /**
     * Получить матрицу трансформирования
     * @method getModelMatrix
     * @return {Matrix4x4} Матрица трансформирования
     */
    getModelMatrix() {
        return this.modelMatrix;
    }

    /**
     * Установить матрицу трансформирования
     * @method setModelMatrix
     * @param matrix {Matrix4x4} Матрица трансформирования
     */
    setModelMatrix( matrix: Matrix4x4 ) {
        mat4.set( matrix, this.modelMatrix );
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
     * @param points {array} Массив точек
     */
    fitPoints( points: Vector3D[] ) {
        if ( points.length < 1 ) {
            console.warn( 'Invalid input data' );
            return;
        }
        const minPoint = vec3.set( points[ 0 ], this.points[ 0 ] );
        const maxPoint = vec3.set( points[ 0 ], this.points[ 1 ] );

        for ( let i = 1; i < points.length; i++ ) {
            const point = points[ i ];
            for ( let j = 0; j < 3; j++ ) {
                minPoint[ j ] = Math.min( point[ j ], minPoint[ j ] );
                maxPoint[ j ] = Math.max( point[ j ], maxPoint[ j ] );
            }
        }

        vec3.scale( vec3.add( minPoint, maxPoint, this.centerPoint ), 0.5 );
        // this.setCenter( centerPoint );
        mat4.translate( mat4.IDENTITY, this.centerPoint, this.modelMatrix );

        this.radius = vec3.len( vec3.sub( minPoint, maxPoint, BoundingSphere3D.mRadiusVec ) ) * 0.5;
    }

    /**
     * Функция проверки положения двух объектов
     * @method testFrustum
     * @param frustumVolume {object} Геометрия области видимости
     * @param modelViewProjectionMatrix {array} Перспективная видовая матрица модели сцены
     * @return {number}  0 - объекты не пересекаются,
     >0 - расстояние от передней плоскости до объекта (по направлению взгляда)
     */
    testFrustum( frustumVolume: FrustumVolume, modelViewProjectionMatrix: Matrix4x4 ) {

        const to_clip_space_mat = modelViewProjectionMatrix;
        const obb_point = BoundingSphere3D.mClipSpacePoints[ 0 ];
        const mCenterPoint = BoundingSphere3D.mCenterPoint;
        vec4.setValues( obb_point, this.centerPoint[ 0 ], this.centerPoint[ 1 ], this.centerPoint[ 2 ], 1 );
        vec4.transformMat4( obb_point, to_clip_space_mat );

        let outside = BoundingSphere3D.testFrustumPoint( obb_point );
        if ( outside ) {
            for ( let i = 0; i < frustumVolume.length; i++ ) {
                const s = frustumVolume[ i ];
                const distance = -vec3.dot( this.centerPoint, s.n ) - s.d - this.radius;
                if ( distance >= 0 ) {
                    const point = vec3.add( this.centerPoint, vec3.scale( s.n, -distance, mCenterPoint ), mCenterPoint );
                    vec4.setValues( obb_point, point[ 0 ], point[ 1 ], point[ 2 ], 1 );
                    vec4.transformMat4( obb_point, to_clip_space_mat );
                    outside = BoundingSphere3D.testFrustumPoint( obb_point );
                    if ( !outside ) {
                        break;
                    }
                }
            }
        }

        if ( outside ) {
            return 0;
        }

        const s = frustumVolume[ frustumVolume.length - 1 ];

        return -vec3.dot( this.centerPoint, s.n ) - s.d - this.radius;
    }

    /**
     * Функция проверки вхождения точки
     * @method testPoint
     * @param point {Vector3D} Геометрия области видимости
     * @return {boolean}  Признак вхождения точки
     */
    testPoint( point: Vector3D ) {
        return vec3.len( vec3.sub( point, this.centerPoint, vec3.create() ) ) <= this.radius;
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
