/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *        Функции перевода между градусами и радианами              *
 *                                                                  *
 *******************************************************************/

import { Vector2D, Vector3D } from '~/3d/engine/core/Types';
import GeoPoint from '~/geo/GeoPoint';
import GeoPointRad from '~/geo/GeoPointRad';
import { GeoBounds } from '~/geometry/GeoBounds';
import { GeoBoundsRad } from '~/geometry/GeoBoundsRad';

type DegreeValue = number | GeoPoint | Vector2D | Vector3D | GeoBounds;
type RadianValue = number | GeoPointRad | Vector2D | Vector3D | GeoBoundsRad;

/**
 *  Функции перевода между градусами и радианами
 * @static
 * @class Trigonometry
 */
export default class Trigonometry {
    static readonly OneOverPi = 1.0 / Math.PI;
    static readonly PiOverTwo = Math.PI * 0.5;
    static readonly PiOverThree = Math.PI / 3.0;
    static readonly PiOverFour = Math.PI / 4.0;
    static readonly PiOverSix = Math.PI / 6.0;
    static readonly ThreePiOver2 = (3.0 * Math.PI) * 0.5;
    static readonly TwoPi = 2.0 * Math.PI;
    static readonly OneOverTwoPi = 1.0 / (2.0 * Math.PI);
    static readonly RadiansPerDegree = Math.PI / 180.0;
    static readonly DegreePerRadians = 180.0 / Math.PI;

    /**
     * Преобразование из градусов в радианы
     * @private
     * @static
     * @method _toRadians
     * @param degrees {number} Значение в градусах
     * @return {number} Значение в радианах
     */
    private static _toRadians( degrees: number ) {
        return degrees * this.RadiansPerDegree;
    }

    /**
     * Преобразование из радиан в градусы
     * @private
     * @static
     * @method _toDegrees
     * @param radians {number} Значение в радианах
     * @return {number} Значение в градусах
     */
    private static _toDegrees( radians: number ) {
        return radians * this.DegreePerRadians;
    }

    /**
     * Преобразование из градусов в радианы
     * @static
     * @method toRadians
     * @param value {number|GeoPoint|Vector2or3} Значение в градусах
     * @return {number|GeoPointRad|Vector2or3} Значение в радианах
     */
    static toRadians( value: number ): number;
    static toRadians( value: GeoPoint ): GeoPointRad;
    static toRadians( value: Vector2D ): Vector2D;
    static toRadians( value: Vector3D ): Vector3D;
    static toRadians( value: GeoBounds ): GeoBoundsRad;
    static toRadians( value: DegreeValue ) {
        if ( typeof value === 'number' ) {
            return this._toRadians( value );
        } else if ( Array.isArray( value ) ) {
            const copy = value.slice();
            copy[ 0 ] = this._toRadians( copy[ 0 ] );
            copy[ 1 ] = this._toRadians( copy[ 1 ] );
            return copy;
        } else if ( value instanceof GeoBounds ) {
            const minPoint = Trigonometry.toRadians( value.min );
            const maxPoint = Trigonometry.toRadians( value.max );

            return new GeoBoundsRad( minPoint, maxPoint );
        } else {
            return new GeoPointRad( this._toRadians( value.getLongitude() ), this._toRadians( value.getLatitude() ), value.getHeight(), value.getProjectionId() );
        }
    }

    /**
     * Преобразование из радиан в градусы
     * @static
     * @method toDegrees
     * @param value {number|GeoPointRad|Vector2or3} Значение в радианах
     * @return {number|GeoPoint|Vector2or3} Значение в градусах
     */
    static toDegrees( value: number ): number;
    static toDegrees( value: GeoPointRad ): GeoPoint
    static toDegrees( value: Vector2D ): Vector2D;
    static toDegrees( value: Vector3D ): Vector3D;
    static toDegrees( value: GeoBoundsRad ): GeoBounds;
    static toDegrees( value: RadianValue ) {
        if ( typeof value === 'number' ) {
            return this._toDegrees( value );
        } else if ( Array.isArray( value ) ) {
            const copy = value.slice();
            copy[ 0 ] = this._toDegrees( copy[ 0 ] );
            copy[ 1 ] = this._toDegrees( copy[ 1 ] );
            return copy;
        } else if ( value instanceof GeoBoundsRad ) {
            const minPoint = Trigonometry.toDegrees( value.min );
            const maxPoint = Trigonometry.toDegrees( value.max );

            return new GeoBounds( minPoint, maxPoint );
        } else {
            return new GeoPoint( this._toDegrees( value.getLongitude() ), this._toDegrees( value.getLatitude() ), value.getHeight(), value.getProjectionId() );
        }
    }
}
