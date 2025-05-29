/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Геометрия эллипсоида                     *
 *                                                                  *
 *******************************************************************/

import { Vector2or3, Vector3D } from '~/3d/engine/core/Types';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { vec3 } from '~/3d/engine/utils/glmatrix';

/**
 * Класс эллипсоида
 * @class Ellipsoid
 * @param a {number} Полуось Х
 * @param b {number} Полуось Y
 * @param c {number} Полуось Z
 */
export default class Ellipsoid {

    private readonly radii = vec3.create();
    private readonly _radiiSquared = vec3.create();
    private readonly _radiiToTheFourth = vec3.create();
    private readonly _oneOverRadiiSquared = vec3.create();
    private readonly flattening: number;
    private readonly _eccentricitySquared: number;
    private readonly _oneMinusEccentricitySquared: number;
    private readonly eccentricity: number;

    constructor( a: number, b: number, c: number ) {
        vec3.setValues( this.radii, a, b, c );
        vec3.setValues( this._radiiSquared, a * a, b * b, c * c );
        vec3.setValues( this._radiiToTheFourth,
            this._radiiSquared[ 0 ] * this._radiiSquared[ 0 ],
            this._radiiSquared[ 1 ] * this._radiiSquared[ 1 ],
            this._radiiSquared[ 2 ] * this._radiiSquared[ 2 ]
        );
        vec3.setValues( this._oneOverRadiiSquared,
            1 / this._radiiSquared[ 0 ],
            1 / this._radiiSquared[ 1 ],
            1 / this._radiiSquared[ 2 ]
        );
        this.flattening = (this.radii[ 0 ] - this.radii[ 2 ]) / this.radii[ 0 ];

        this._eccentricitySquared = this.flattening * (2 - this.flattening);
        this._oneMinusEccentricitySquared = Math.pow( 1 - this.flattening, 2 );

        this.eccentricity = Math.sqrt( this._eccentricitySquared );
    }

    /**
     * Вспомогательная точка
     * @private
     * @static
     * @property {Geodetic3D} mGeoPoint
     */
    private static mGeoPoint = new Geodetic3D();
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mNormal
     */
    private static mNormal = vec3.create();
    /**
     * Вспомогательный массив
     * @static
     * @property {Vector3D} mNormalInPoint
     */
    private static mNormalInPoint = vec3.create();
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mNormalCur
     */
    private static mNormalCur = vec3.create();
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mHeightInPoint
     */
    private static mHeightInPoint = vec3.create();
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mGeodeticSurfaceNormalInGeoPoint
     */
    private static mGeodeticSurfaceNormalInGeoPoint = vec3.create();

    /**
     * Получить значение геодезической нормали в точке
     * @private
     * @method geodeticSurfaceNormalInGeoPoint
     * @param geoPoint {Geodetic3D} Геодезические координаты точки
     * @param [out] {Vector3D} Результат
     * @return {Vector3D} Нормализованный вектор геодезической нормали
     */
    private static geodeticSurfaceNormalInGeoPoint( geoPoint: Geodetic3D, out = Ellipsoid.mGeodeticSurfaceNormalInGeoPoint ) {
        const result = out;
        const longitude = geoPoint.getLongitude();
        const latitude = geoPoint.getLatitude();
        const cosF = Math.cos( latitude );
        result[ 0 ] = cosF * Math.cos( longitude );
        result[ 1 ] = cosF * Math.sin( longitude );
        result[ 2 ] = Math.sin( latitude );
        return result;
    }

    /**
     * Получить значение сплющенности
     * @method getFlattening
     * @return {number} Значение сплющенности
     */
    getFlattening() {
        return this.flattening;
    }

    /**
     * Получить значение эксцентриситета
     * @method getEccentricity
     * @return {number} Значение эксцентриситета
     */
    getEccentricity() {
        return this.eccentricity;
    }

    /**
     * Получить значения радиуса по осям
     * @method getRadius
     * @return {Vector3D} Максимальный радиус
     */
    getRadius() {
        return this.radii;
    }

    /**
     * Получить значение максимального радиуса
     * @method getMaximumRadius
     * @return {number} Максимальный радиус
     */
    getMaximumRadius() {
        return Math.max( this.radii[ 0 ], this.radii[ 1 ], this.radii[ 2 ] );
    }

    /**
     * Получить значение геодезической нормали в точке
     * @method geodeticSurfaceNormalInPoint
     * @param point {Vector2or3} Прямоугольные координаты точки
     * @param [out] {Vector3D} Результат
     * @return {Vector3D} Нормализованный вектор геодезической нормали
     */
    geodeticSurfaceNormalInPoint( point: Vector2or3, out = Ellipsoid.mNormalInPoint ) {
        const vector = vec3.fromPoint( point, out );
        return vec3.normalize( vec3.multiply( vector, this._oneOverRadiiSquared, out ) );
    }


    /**
     * Получение прямоугольных координат из геодезических
     * @method toVector3d
     * @param geoPoint {Geodetic3D} Геодезические координаты точки
     * @param [out] {Vector3D} Результат
     * @return {Vector3D} Прямоугольные координаты точки
     */
    toVector3d( geoPoint: Geodetic3D, out = vec3.create() ) {
        const n = Ellipsoid.geodeticSurfaceNormalInGeoPoint( geoPoint );
        const result = out;
        vec3.multiply( this._radiiSquared, n, result );
        const gamma = Math.sqrt( n[ 0 ] * result[ 0 ] + n[ 1 ] * result[ 1 ] + n[ 2 ] * result[ 2 ] );
        vec3.scale( result, 1 / gamma );
        vec3.scale( n, geoPoint.getHeight() );
        vec3.add( result, n );
        return result;
    }

    /**
     * Получение геодезических координат из прямоугольных
     * @method toGeodetic2d
     * @param vector {Vector3D} Прямоугольные координаты точки
     * @param [out] {Geodetic3D} Результат
     * @return {Geodetic3D} Геодезические координаты точки
     */
    toGeodetic2d( vector: Vector3D, out = new Geodetic3D() ) {
        const n = this.geodeticSurfaceNormalInPoint( vector );
        const result = out;
        result.setLongitude( Math.atan2( n[ 1 ], n[ 0 ] ) );
        result.setLatitude( Math.asin( n[ 2 ] / vec3.len( n ) ) );
        return result;
    }

    /**
     * Получение геодезических координат из прямоугольных
     * @method toGeodetic3d
     * @param vector {Vector3D} Прямоугольные координаты точки
     * @param [out] {Geodetic3D} Результат
     * @return {Geodetic3D} Геодезические координаты точки
     */
    toGeodetic3d( vector: Vector3D, out?: Geodetic3D ) {
        const n = this.scaleToGeodeticSurface( vector, Ellipsoid.mNormal );
        const h = vec3.sub( vector, n, Ellipsoid.mHeightInPoint );
        const sign = vec3.dot( h, vector ) < 0 ? -1 : (vec3.dot( h, vector ) > 0 ? 1 : 0);
        const height = sign * vec3.len( h );
        const result = this.toGeodetic2d( vector, out );
        result.setHeight( height );
        return result;
    }

    /**
     * Преобразование прямоугольных координат в вектор из центра эллипсоида
     * @method scaleToGeocentricSurface
     * @param vector {Vector3D} Прямоугольные координаты точки
     * @param [height] {number} Высота относительно поверхности эллипсоида
     * @param [out] {Vector3D} Результат
     * @return {Vector3D} Вектор из центра эллипсоида
     */
    scaleToGeocentricSurface( vector: Vector3D, height: number = 0, out = vec3.create() ) {
        const result = out;
        const beta = 1 / Math.sqrt( vector[ 0 ] * vector[ 0 ] * this._oneOverRadiiSquared[ 0 ] + vector[ 1 ] * vector[ 1 ] * this._oneOverRadiiSquared[ 1 ] + vector[ 2 ] * vector[ 2 ] * this._oneOverRadiiSquared[ 2 ] );
        const curVector = vec3.scale( vector, beta, result );
        if ( height ) {
            const geodetic = this.toGeodetic3d( curVector, Ellipsoid.mGeoPoint );
            if ( geodetic ) {
                geodetic.setHeight( height );
                this.toVector3d( geodetic, result );
            }
        }
        return result;
    }

    /**
     * Преобразование прямоугольных координат в точку на поверхности эллипсоида
     * @method scaleToGeodeticSurface
     * @param vector {Vector3D} Прямоугольные координаты точки
     * @param [out] {Vector3D} Результат
     * @return {Vector3D} Точка на поверхности эллипсоида/ вектор [0,0,0]
     */
    scaleToGeodeticSurface( vector: Vector3D, out = vec3.create() ) {

        const result = out;
        if ( vec3.len( vector ) === 0 ) {
            result[ 0 ] = 0;
            result[ 1 ] = 0;
            result[ 2 ] = 0;
        } else {
            const beta = 1 / Math.sqrt( vector[ 0 ] * vector[ 0 ] * this._oneOverRadiiSquared[ 0 ] + vector[ 1 ] * vector[ 1 ] * this._oneOverRadiiSquared[ 1 ] + vector[ 2 ] * vector[ 2 ] * this._oneOverRadiiSquared[ 2 ] );
            let n = vec3.multiply( vector, this._oneOverRadiiSquared, Ellipsoid.mNormalCur );
            n = vec3.scale( n, beta );
            const nL = vec3.len( n );
            let alpha = (1.0 - beta) * (vec3.len( vector ) / nL);

            const x2 = vector[ 0 ] * vector[ 0 ];
            const y2 = vector[ 1 ] * vector[ 1 ];
            const z2 = vector[ 2 ] * vector[ 2 ];

            let da = 1;
            let db = 1;
            let dc = 1;

            let s = 0.0;
            let dSdA = 1.0;
            let iterationNumber = 0;
            while ( (Math.abs( s ) > 1e-8 && iterationNumber < 10) || iterationNumber === 0 ) {
                alpha -= (s / dSdA);

                da = 1.0 + (alpha * this._oneOverRadiiSquared[ 0 ]);
                db = 1.0 + (alpha * this._oneOverRadiiSquared[ 1 ]);
                dc = 1.0 + (alpha * this._oneOverRadiiSquared[ 2 ]);

                const da2 = da * da;
                const db2 = db * db;
                const dc2 = dc * dc;

                const da3 = da * da2;
                const db3 = db * db2;
                const dc3 = dc * dc2;

                s = x2 / (this._radiiSquared[ 0 ] * da2) +
                    y2 / (this._radiiSquared[ 1 ] * db2) +
                    z2 / (this._radiiSquared[ 2 ] * dc2) - 1.0;

                dSdA = -2.0 * (x2 / (this._radiiToTheFourth[ 0 ] * da3) + y2 / (this._radiiToTheFourth[ 1 ] * db3) + z2 / (this._radiiToTheFourth[ 2 ] * dc3));
                iterationNumber++;
            }

            result[ 0 ] = vector[ 0 ] / da;
            result[ 1 ] = vector[ 1 ] / db;
            result[ 2 ] = vector[ 2 ] / dc;
        }
        return result;
    }

    /**
     * Создание кривой на поверхности эллипсоида
     * @method computeCurve
     * @param start {Vector3D} Прямоугольные координаты начальной точки
     * @param stop {Vector3D} Прямоугольные координаты конечной точки
     * @param granularity {number} Угол между соседними точками (в радианах)
     * @param [dest] {Vector3D[]} Результат
     * @return {array|undefined} Массив точек в прямоугольных координатах
     */
    computeCurve( start: Vector3D, stop: Vector3D, granularity: number, dest: Vector3D[] = [] ) {
        if ( granularity == null || granularity <= 0.0 || !Array.isArray( start ) || start.length < 3 || !Array.isArray( stop ) || stop.length < 3 ) {
            return;
        }


        const normal = vec3.normalize( vec3.cross( start, stop, vec3.create() ) );
        const theta = Math.acos( vec3.dot( vec3.normalize( start, vec3.create() ), vec3.normalize( stop, vec3.create() ) ) );


        const n = Math.max( Math.floor( theta / granularity ) - 1, 0 );

        const positions = dest;
        positions.push( start );
        for ( let i = 1; i <= n; i++ ) {
            const phi = (i * granularity);
            const point = this.scaleToGeocentricSurface( vec3.rotateAroundAxis( start, normal, phi, vec3.create() ) );
            if ( point ) {
                positions.push( point );
            }
        }
        positions.push( stop );
        return positions;
    }

    /**
     * Подсчет азимута
     * @method calculateAzimuth
     * @param firstGeo {Geodetic3D} Первая точка
     * @param secondGeo {Geodetic3D} Вторая точка
     * @return {number} Значение азимута в радианах (0..2*pi)
     */
    calculateAzimuth( firstGeo: Geodetic3D, secondGeo: Geodetic3D ) {
        const L = secondGeo.getLongitude() - firstGeo.getLongitude();
        const phi1 = firstGeo.getLatitude();
        const phi2 = secondGeo.getLatitude();


        const k = this._oneMinusEccentricitySquared * Math.tan( phi2 ) / Math.tan( phi1 ) +
            this._eccentricitySquared * Math.sqrt( (1 + this._oneMinusEccentricitySquared * Math.pow( Math.tan( phi2 ), 2 )) / (1 + this._oneMinusEccentricitySquared * Math.pow( Math.tan( phi1 ), 2 )) );
        let result;
        if ( phi1 !== 0 ) {
            result = Math.atan2( Math.sin( L ), ((k - Math.cos( L )) * Math.sin( phi1 )) );
        } else {
            result = Math.atan2( Math.sin( L ), (this._oneMinusEccentricitySquared * Math.tan( phi2 )) );
        }

        if ( result < 0 ) {
            result += Math.PI * 2;
        }

        return result;
    }
}

export const EllipsoidCollection = Object.freeze( {
    WGS84: new Ellipsoid( 6378137.0, 6378137.0, 6356752.314245 ),
    WGS84_SPHERICAL: new Ellipsoid( 6378137.0, 6378137.0, 6378137.0 ),
    UNIT_SPHERE: new Ellipsoid( 1, 1, 1 ),
    SCALED_WGS84: new Ellipsoid( 1.0, 1.0, 6356752.314245 / 6378137.0 )
} );
