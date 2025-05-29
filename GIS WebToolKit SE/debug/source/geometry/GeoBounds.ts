/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Класс Габариты                           *
 *                            GWTK SE                               *
 *                                                                  *
 *******************************************************************/

/*
 * Класс Bounds представляет описание прямоугольной области в пикселах
 */

import { GeoBoundsRad } from '~/geometry/GeoBoundsRad';
import GeoPoint from '~/geo/GeoPoint';

export class GeoBounds extends GeoBoundsRad {
    readonly min!: GeoPoint;
    readonly max!: GeoPoint;

    /*
     * Конструктор
     * @param a {Point} первая точка или массив точек
     * @param b {Point} вторая точка
     */
    constructor( a = new GeoPoint(), b?: GeoPoint ) {
        super( a, b );
    }

    /*
     * Получить центральную точку
     * @method getCenter
     * @param round {boolean} округлить значения
     * @returns {GeoPoint} центр
     */
    getCenter( round?: boolean ): GeoPoint {
        let center = new GeoPoint( (this.min.getLongitude() + this.max.getLongitude()) / 2,
            (this.min.getLatitude() + this.max.getLatitude()) / 2, (this.min.getHeight() + this.max.getHeight()) / 2, this.projectionId );
        if ( round ) {
            center.setLongitude( +center.getLongitude().toPrecision( 6 ) );
            center.setLatitude( +center.getLatitude().toPrecision( 6 ) );
            center.setHeight( +center.getHeight().toPrecision( 6 ) );
        }
        return center;
    }

    /*
     * Проверить на вхождение
     * @method contains
     * @returns {boolean} `true`- прямоугольник содержит указанные координаты
     */
    contains( obj: GeoBounds | GeoPoint ) {
        const _bounds = GeoBounds.toBounds( obj );

        const min = _bounds.min;
        const max = _bounds.max;

        return (min.getLongitude() >= this.min.getLongitude()) &&
            (max.getLongitude() <= this.max.getLongitude()) &&
            (min.getLatitude() >= this.min.getLatitude()) &&
            (max.getLatitude() <= this.max.getLatitude());
    }

    /*
     * Проверить пересечение
     * @method intersects
     * @returns {boolean} `true`- пересечение имеется
     */
    intersects( bounds: GeoBounds | GeoPoint ) {
        const _bounds = GeoBounds.toBounds( bounds );

        const min = this.min,
            max = this.max,
            min2 = _bounds.min,
            max2 = _bounds.max,
            xIntersects = (max2.getLongitude() >= min.getLongitude()) && (min2.getLongitude() <= max.getLongitude()),
            yIntersects = (max2.getLatitude() >= min.getLatitude()) && (min2.getLatitude() <= max.getLatitude());

        return xIntersects && yIntersects;
    }

    toBBox( places?: number ) {
        let precision = places;
        if ( precision === undefined ) {
            precision = 8;
        }

        return [
            this.min.getLatitude().toFixed( precision ),
            this.min.getLongitude().toFixed( precision ),
            this.max.getLatitude().toFixed( precision ),
            this.max.getLongitude().toFixed( precision )
        ];
    }

    /*
     * Преобразовать к Bounds
     * @method toBounds
     * @returns {Bounds}
     */
    static toBounds( a: GeoBounds | GeoPoint, b?: GeoPoint ) {
        if ( a instanceof GeoBounds ) {
            return a;
        }
        return new GeoBounds( a, b );
    }

}



