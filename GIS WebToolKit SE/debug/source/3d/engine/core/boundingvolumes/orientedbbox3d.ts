/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Ограничивающий ориентированный параллелепипед           *
 *                                                                  *
 *******************************************************************/

import { Matrix4x4, Vector3D } from '../Types';
import { FrustumVolume } from '~/3d/refactoringQueue';
import { mat4, vec3, vec4 } from '~/3d/engine/utils/glmatrix';
import { AdditionalOrientedVolumeSerializedProperties, BoundingVolume3DSerialized } from '~/3d/engine/core/boundingvolumes/Types';

/**
 * Ограничивающий ориентированный параллелепипед
 * @class OrientedBoundingBox3D
 * @constructor OrientedBoundingBox3D
 * @param [axis] {AdditionalOrientedVolumeSerializedProperties} Направления осей объема
 */
export default class OrientedBoundingBox3D {

    private readonly xAxis = vec3.create( vec3.UNITX );
    private readonly zAxis = vec3.create( vec3.UNITZ );
    private readonly yAxis = vec3.create( vec3.UNITY );
    private centerPoint = vec3.create();
    private points = [vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create()];
    private radius = 0;
    private json: BoundingVolume3DSerialized = {
        points: this.points,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        zAxis: this.zAxis
    };
    private readonly modelMatrix = mat4.create( mat4.IDENTITY );

    constructor( axis?: AdditionalOrientedVolumeSerializedProperties ) {
        if ( axis ) {
            const { xAxis, yAxis, zAxis } = axis;
            if ( xAxis ) {
                vec3.set( xAxis, this.xAxis );
                vec3.normalize( this.xAxis );
            }
            if ( zAxis ) {
                vec3.set( zAxis, this.zAxis );
                vec3.normalize( this.zAxis );
            }
            if ( yAxis ) {
                vec3.set( yAxis, this.yAxis );
            } else {
                vec3.cross( this.zAxis, this.xAxis, this.yAxis );
            }
            vec3.normalize( this.yAxis );
        }
    }

    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mCurPoint
     */
    private static mCurPoint = vec3.create();

    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mCurPoint1
     */
    private static mCurPoint1 = vec3.create();

    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mCurPoint2
     */
    private static mCurPoint2 = vec3.create();

    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mCurPoint3
     */
    private static mCurPoint3 = vec3.create();

    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mCurPoint4
     */
    private static mCurPoint4 = vec3.create();
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mCurPoint5
     */
    private static mCurPoint5 = vec3.create();
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mCurPoint6
     */
    private static mCurPoint6 = vec3.create();

    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector4D[]} mClipSpacePoints
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
     * Получить точки
     * @method getPositions
     * @return {Vector3D[]} Массив точек
     */
    getPositions() {
        return this.points;
    }

    /**
     * Описать параллелепипед вокруг точек
     * @method fitPoints
     * @param points {Vector3D[]} Массив точек
     */
    fitPoints( points: Vector3D[] ) {
        if ( points.length < 1 ) {
            console.warn( 'Invalid input data' );
            return;
        }

        const point = points[ 0 ];

        let minimumX = vec3.dot( point, this.xAxis );
        let minimumY = vec3.dot( point, this.yAxis );
        let minimumZ = vec3.dot( point, this.zAxis );

        let maximumX = minimumX;
        let maximumY = minimumY;
        let maximumZ = minimumZ;

        for ( let i = 1; i < points.length; i++ ) {
            const point = points[ i ];

            const curX = vec3.dot( point, this.xAxis );
            const curY = vec3.dot( point, this.yAxis );
            const curZ = vec3.dot( point, this.zAxis );

            if ( curX < minimumX ) {
                minimumX = curX;
            }

            if ( curX > maximumX ) {
                maximumX = curX;
            }

            if ( curY < minimumY ) {
                minimumY = curY;
            }

            if ( curY > maximumY ) {
                maximumY = curY;
            }

            if ( curZ < minimumZ ) {
                minimumZ = curZ;
            }

            if ( curZ > maximumZ ) {
                maximumZ = curZ;
            }
        }

        const minimum = OrientedBoundingBox3D.mCurPoint5;
        vec3.setValues( minimum, minimumX, minimumY, minimumZ );

        const maximum = OrientedBoundingBox3D.mCurPoint6;
        vec3.setValues( maximum, maximumX, maximumY, maximumZ );


        // Точки ориентированного объема
        /*      7-----6           Z  Y
              / |   / |           | /
            4-----5   |           |/
            |   3-|---2           0--->X
            | /   | /
            0-----1

            0 - minimum XYZ
            6 - maximum XYZ
         */

        const mCurPoint = OrientedBoundingBox3D.mCurPoint;
        // в геоцентрических координатах
        vec3.setValues( mCurPoint, minimum[ 0 ], minimum[ 1 ], minimum[ 2 ] );
        vec3.add( vec3.add( vec3.scale( this.xAxis, mCurPoint[ 0 ], OrientedBoundingBox3D.mCurPoint2 ), vec3.scale( this.yAxis, mCurPoint[ 1 ], OrientedBoundingBox3D.mCurPoint3 ), OrientedBoundingBox3D.mCurPoint1 ), vec3.scale( this.zAxis, mCurPoint[ 2 ], OrientedBoundingBox3D.mCurPoint4 ), this.points[ 0 ] );

        vec3.setValues( mCurPoint, maximum[ 0 ], minimum[ 1 ], minimum[ 2 ] );
        vec3.add( vec3.add( vec3.scale( this.xAxis, mCurPoint[ 0 ], OrientedBoundingBox3D.mCurPoint2 ), vec3.scale( this.yAxis, mCurPoint[ 1 ], OrientedBoundingBox3D.mCurPoint3 ), OrientedBoundingBox3D.mCurPoint1 ), vec3.scale( this.zAxis, mCurPoint[ 2 ], OrientedBoundingBox3D.mCurPoint4 ), this.points[ 1 ] );

        vec3.setValues( mCurPoint, maximum[ 0 ], maximum[ 1 ], minimum[ 2 ] );
        vec3.add( vec3.add( vec3.scale( this.xAxis, mCurPoint[ 0 ], OrientedBoundingBox3D.mCurPoint2 ), vec3.scale( this.yAxis, mCurPoint[ 1 ], OrientedBoundingBox3D.mCurPoint3 ), OrientedBoundingBox3D.mCurPoint1 ), vec3.scale( this.zAxis, mCurPoint[ 2 ], OrientedBoundingBox3D.mCurPoint4 ), this.points[ 2 ] );

        vec3.setValues( mCurPoint, minimum[ 0 ], maximum[ 1 ], minimum[ 2 ] );
        vec3.add( vec3.add( vec3.scale( this.xAxis, mCurPoint[ 0 ], OrientedBoundingBox3D.mCurPoint2 ), vec3.scale( this.yAxis, mCurPoint[ 1 ], OrientedBoundingBox3D.mCurPoint3 ), OrientedBoundingBox3D.mCurPoint1 ), vec3.scale( this.zAxis, mCurPoint[ 2 ], OrientedBoundingBox3D.mCurPoint4 ), this.points[ 3 ] );

        vec3.setValues( mCurPoint, minimum[ 0 ], minimum[ 1 ], maximum[ 2 ] );
        vec3.add( vec3.add( vec3.scale( this.xAxis, mCurPoint[ 0 ], OrientedBoundingBox3D.mCurPoint2 ), vec3.scale( this.yAxis, mCurPoint[ 1 ], OrientedBoundingBox3D.mCurPoint3 ), OrientedBoundingBox3D.mCurPoint1 ), vec3.scale( this.zAxis, mCurPoint[ 2 ], OrientedBoundingBox3D.mCurPoint4 ), this.points[ 4 ] );

        vec3.setValues( mCurPoint, maximum[ 0 ], minimum[ 1 ], maximum[ 2 ] );
        vec3.add( vec3.add( vec3.scale( this.xAxis, mCurPoint[ 0 ], OrientedBoundingBox3D.mCurPoint2 ), vec3.scale( this.yAxis, mCurPoint[ 1 ], OrientedBoundingBox3D.mCurPoint3 ), OrientedBoundingBox3D.mCurPoint1 ), vec3.scale( this.zAxis, mCurPoint[ 2 ], OrientedBoundingBox3D.mCurPoint4 ), this.points[ 5 ] );

        vec3.setValues( mCurPoint, maximum[ 0 ], maximum[ 1 ], maximum[ 2 ] );
        vec3.add( vec3.add( vec3.scale( this.xAxis, mCurPoint[ 0 ], OrientedBoundingBox3D.mCurPoint2 ), vec3.scale( this.yAxis, mCurPoint[ 1 ], OrientedBoundingBox3D.mCurPoint3 ), OrientedBoundingBox3D.mCurPoint1 ), vec3.scale( this.zAxis, mCurPoint[ 2 ], OrientedBoundingBox3D.mCurPoint4 ), this.points[ 6 ] );

        vec3.setValues( mCurPoint, minimum[ 0 ], maximum[ 1 ], maximum[ 2 ] );
        vec3.add( vec3.add( vec3.scale( this.xAxis, mCurPoint[ 0 ], OrientedBoundingBox3D.mCurPoint2 ), vec3.scale( this.yAxis, mCurPoint[ 1 ], OrientedBoundingBox3D.mCurPoint3 ), OrientedBoundingBox3D.mCurPoint1 ), vec3.scale( this.zAxis, mCurPoint[ 2 ], OrientedBoundingBox3D.mCurPoint4 ), this.points[ 7 ] );

        vec3.scale( vec3.add( minimum, maximum, mCurPoint ), 0.5 );

        vec3.add( vec3.add( vec3.scale( this.xAxis, mCurPoint[ 0 ], OrientedBoundingBox3D.mCurPoint2 ), vec3.scale( this.yAxis, mCurPoint[ 1 ], OrientedBoundingBox3D.mCurPoint3 ), OrientedBoundingBox3D.mCurPoint1 ), vec3.scale( this.zAxis, mCurPoint[ 2 ], OrientedBoundingBox3D.mCurPoint4 ), this.centerPoint );
        mat4.translate( mat4.IDENTITY, this.centerPoint, this.modelMatrix );

        this.radius = vec3.len( vec3.sub( minimum, maximum, mCurPoint ) ) * 0.5;
    }

    /**
     * Функция проверки положения двух объектов
     * @method testFrustum
     * @param frustumVolume {FrustumVolume} Геометрия области видимости
     * @param modelViewProjectionMatrix {Matrix4x4} Перспективная видовая матрица модели сцены
     * @return {number}  0 - объекты не пересекаются,
     >0 - расстояние от передней плоскости до объекта (по направлению взгляда)
     */
    testFrustum( frustumVolume: FrustumVolume, modelViewProjectionMatrix: Matrix4x4 ) {
        const to_clip_space_mat = modelViewProjectionMatrix;
        const obb_points = OrientedBoundingBox3D.mClipSpacePoints;
        for ( let i = 0; i < this.points.length; i++ ) {
            const point = this.points[ i ];
            vec4.setValues( obb_points[ i ], point[ 0 ], point[ 1 ], point[ 2 ], 1 );
            obb_points[ i ] = vec4.transformMat4( obb_points[ i ], to_clip_space_mat );
        }
        let outside = false, outside_positive_plane = false, outside_negative_plane = false;
        //we have 6 frustum planes, which in clip space is unit cube (for GL) with -1..1 range
        for ( let i = 0; !outside && i < 3; i++ ) { //3 because we test positive & negative plane at once

            //if all 8 points outside one of the plane
            //actually it is vertex normalization xyz / w, then compare if all 8points coordinates <      -1 or > 1
            outside_positive_plane =
                obb_points[ 0 ][ i ] > obb_points[ 0 ][ 3 ] &&
                obb_points[ 1 ][ i ] > obb_points[ 1 ][ 3 ] &&
                obb_points[ 2 ][ i ] > obb_points[ 2 ][ 3 ] &&
                obb_points[ 3 ][ i ] > obb_points[ 3 ][ 3 ] &&
                obb_points[ 4 ][ i ] > obb_points[ 4 ][ 3 ] &&
                obb_points[ 5 ][ i ] > obb_points[ 5 ][ 3 ] &&
                obb_points[ 6 ][ i ] > obb_points[ 6 ][ 3 ] &&
                obb_points[ 7 ][ i ] > obb_points[ 7 ][ 3 ];
            outside_negative_plane =
                obb_points[ 0 ][ i ] < -obb_points[ 0 ][ 3 ] &&
                obb_points[ 1 ][ i ] < -obb_points[ 1 ][ 3 ] &&
                obb_points[ 2 ][ i ] < -obb_points[ 2 ][ 3 ] &&
                obb_points[ 3 ][ i ] < -obb_points[ 3 ][ 3 ] &&
                obb_points[ 4 ][ i ] < -obb_points[ 4 ][ 3 ] &&
                obb_points[ 5 ][ i ] < -obb_points[ 5 ][ 3 ] &&
                obb_points[ 6 ][ i ] < -obb_points[ 6 ][ 3 ] &&
                obb_points[ 7 ][ i ] < -obb_points[ 7 ][ 3 ];

            outside = outside || outside_positive_plane || outside_negative_plane;
            //if (outside_positive_plane || outside_negative_plane)
            //return false;
        }
        let distance = 0;
        if ( !outside ) {
            const s = frustumVolume[ frustumVolume.length - 1 ];
            // const distance = vec3.dot(this.centerPoint, s.n) + s.d + this.radius || 1;
            distance = Number.MAX_VALUE;
            for ( let i = 0; i < this.points.length; i++ ) {
                const point = this.points[ i ];
                distance = Math.min( distance, -(vec3.dot( point, s.n ) + s.d) );
            }
        }

        return distance;
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
     * @return {BoundingVolume3DSerialized} сериализуемый JSON объект
     */
    toJSON() {
        return this.json;
    }

    /**
     * Забрать данные из JSON объекта
     * @method fromJSON
     * @param json {object} JSON объект
     */
    fromJSON( json: BoundingVolume3DSerialized ) {
        if ( json.xAxis ) {
            vec3.set( json.xAxis, this.xAxis );
        }
        if ( json.yAxis ) {
            vec3.set( json.yAxis, this.yAxis );
        }
        if ( json.zAxis ) {
            vec3.set( json.zAxis, this.zAxis );
        }

        this.fitPoints( json.points );
    }
}
