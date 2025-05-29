/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Точка в разных системах координат                    *
 *                                                                  *
 *******************************************************************/

import Geodetic3D from '~/3d/engine/core/geodetic3d';
import Ellipsoid from './geometry/ellipsoid';
import { Vector3D } from './Types';
import { vec3 } from '../utils/glmatrix';

/**
 * Класс точки в разных системах координат
 * @class ComboPoint3D
 * @param ellipsoid {Ellipsoid} Эллипсоид
 * @param [geo] {Geodetic3D} Геодезические координаты точки
 * @param [cartesian] {Vector3D} Вектор координат точки
 */
export default class ComboPoint3D {

    private readonly ellipsoid: Ellipsoid;
    private readonly geo: Geodetic3D;
    private readonly cartesian: Vector3D;

    constructor( ellipsoid: Ellipsoid, geo = new Geodetic3D( 0, 0, 0 ), cartesian?: Vector3D ) {
        this.ellipsoid = ellipsoid;
        this.geo = geo;
        this.cartesian = cartesian || ellipsoid.toVector3d( this.geo );
    }

    /**
     * Обновление геодезических координат точки
     * @method setGeo
     * @param geo {Geodetic3D} Геодезические координаты точки
     * @return {boolean} Флаг обновления модели
     */
    setGeo( geo: Geodetic3D ) {
        if ( this.geo.equals( geo ) ) {
            return false;
        }

        this.geo.setLongitude( geo.getLongitude() );
        this.geo.setLatitude( geo.getLatitude() );
        this.geo.setHeight( geo.getHeight() );
        this.ellipsoid.toVector3d( this.geo, this.cartesian );

        return true;
    }

    /**
     * Получить геодезические координаты точки
     * @method getGeo
     * @return {Geodetic3D} Геодезические координаты точки
     */
    getGeo() {
        return this.geo;
    }

    /**
     * Обновление вектора координат точки
     * @method setCartesian
     * @param cartesian {Vector3D} Вектор координат точки
     * @return {boolean} Флаг обновления модели
     */
    setCartesian( cartesian: Vector3D ) {
        if ( vec3.equals( cartesian, this.cartesian ) ) {
            return false;
        }
        vec3.set( cartesian, this.cartesian );
        this.ellipsoid.toGeodetic3d( this.cartesian, this.geo );
        return true;
    }

    /**
     * Получить вектор координат точки
     * @method getCartesian
     * @return {Vector3D} Вектора координат точки
     */
    getCartesian() {
        return this.cartesian;
    }

    /**
     * Сравнение точек
     * @method equals
     * @param other {ComboPoint3D} Точка в разных системах координат
     * @return {boolean} Если `true`, то точки одинаковые
     */
    equals( other: ComboPoint3D ) {
        return vec3.equals( this.cartesian, other.getCartesian() ) && this.geo.equals( other.getGeo() );
    }
}
