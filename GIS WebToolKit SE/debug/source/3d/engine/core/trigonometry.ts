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

import Geodetic3D from '~/3d/engine/core/geodetic3d';
import { Vector2or3, Vector2D, Vector3D } from '~/3d/engine/core/Types';

type DegreeValue = number | Geodetic3D | Vector2or3;

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
     * @param value {number|Geodetic3D|Vector2or3} Значение в градусах
     * @return {number|Geodetic3D|Vector2or3} Значение в радианах
     */
    static toRadians( value: number ): number;
    static toRadians( value: Geodetic3D ): Geodetic3D;
    static toRadians( value: Vector2D ): Vector2D;
    static toRadians( value: Vector3D ): Vector3D;
    static toRadians( value: DegreeValue ) {
        if ( typeof value === 'number' ) {
            return this._toRadians( value );
        } else if ( value instanceof Geodetic3D ) {
            return new Geodetic3D( this._toRadians( value.getLongitude() ), this._toRadians( value.getLatitude() ), value.getHeight() );
        } else {
            const copy = value.slice();
            copy[ 0 ] = this._toRadians( copy[ 0 ] );
            copy[ 1 ] = this._toRadians( copy[ 1 ] );
            return copy;
        }
    }

    /**
     * Преобразование из радиан в градусы
     * @static
     * @method toDegrees
     * @param value {number|Geodetic3D|Vector2or3} Значение в радианах
     * @return {number|Geodetic3D|Vector2or3} Значение в градусах
     */
    static toDegrees( value: number ): number;
    static toDegrees( value: Geodetic3D ): Geodetic3D;
    static toDegrees( value: Vector2D ): Vector2D;
    static toDegrees( value: Vector3D ): Vector3D;
    static toDegrees( value: DegreeValue ) {
        if ( typeof value === 'number' ) {
            return this._toDegrees( value );
        } else if ( value instanceof Geodetic3D ) {
            return new Geodetic3D( this._toDegrees( value.getLongitude() ), this._toDegrees( value.getLatitude() ), value.getHeight() );
        } else {
            const copy = value.slice();
            copy[ 0 ] = this._toDegrees( copy[ 0 ] );
            copy[ 1 ] = this._toDegrees( copy[ 1 ] );
            return copy;
        }
    }
}
