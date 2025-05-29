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

import GeoPointRad from '~/geo/GeoPointRad';

export class GeoBoundsRad {
    readonly min: GeoPointRad;
    readonly max: GeoPointRad;

    readonly projectionId: string;

    /*
     * Конструктор
     * @param a {Point} первая точка или массив точек
     * @param b {Point} вторая точка
     */
    constructor( a = new GeoPointRad(), b?: GeoPointRad ) {

        this.projectionId = a.getProjectionId();

        const points: GeoPointRad[] = [a];

        if ( b !== undefined ) {
            points.push( b );
        } else {
            points.push( a );
        }

        this.min = points[ 0 ].clone();
        this.max = points[ 1 ].clone();

        for ( let i = 0, len = points.length; i < len; i++ ) {
            this.extend( points[ i ] );
        }

    }

    /**
     * Очистить параметры
     * @deprecated
     */
    clear() {
        this.min.setLongitude( 0 );
        this.max.setLongitude( 0 );
        this.min.setLatitude( 0 );
        this.max.setLatitude( 0 );
        this.min.setHeight( 0 );
        this.max.setHeight( 0 );
    }

    /*
     * Расширить габариты по точке
     * @method extend
     * @param point {Point} точка
     * @returns {Bounds}
     */
    extend( point: GeoPointRad ) {
        this.min.setLongitude( Math.min( point.getLongitude(), this.min.getLongitude() ) );
        this.max.setLongitude( Math.max( point.getLongitude(), this.max.getLongitude() ) );
        this.min.setLatitude( Math.min( point.getLatitude(), this.min.getLatitude() ) );
        this.max.setLatitude( Math.max( point.getLatitude(), this.max.getLatitude() ) );

        this.min.setHeight( Math.max( point.getHeight(), this.max.getHeight() ) );
        this.max.setHeight( Math.max( point.getHeight(), this.max.getHeight() ) );
    }

    /*
     * Получить центральную точку
     * @method getCenter
     * @param round {boolean} округлить значения
     * @returns {GeoPointRad} центр
     */
    getCenter( round?: boolean ): GeoPointRad {
        let center = new GeoPointRad( (this.min.getLongitude() + this.max.getLongitude()) / 2,
            (this.min.getLatitude() + this.max.getLatitude()) / 2, (this.min.getHeight() + this.max.getHeight()) / 2, this.projectionId );
        if ( round ) {
            center.setLongitude( +center.getLongitude().toPrecision( 6 ) );
            center.setLatitude( +center.getLatitude().toPrecision( 6 ) );
            center.setHeight( +center.getHeight().toPrecision( 6 ) );
        }
        return center;
    }

    /*
     * Получить размер
     * @method getSize
     * @returns {object} размер
     */
    getSize() {
        return {
            latitude: this.max.getLatitude() - this.min.getLatitude(),
            longitude: this.max.getLongitude() - this.min.getLongitude(),
            height: this.max.getHeight() - this.min.getHeight(),
        };
    }

    /*
     * Проверить на вхождение
     * @method contains
     * @returns {boolean} `true`- прямоугольник содержит указанные координаты
     */
    contains( obj: GeoBoundsRad | GeoPointRad ) {
        const _bounds = GeoBoundsRad.toBounds( obj );

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
    intersects( bounds: GeoBoundsRad | GeoPointRad ) {
        const _bounds = GeoBoundsRad.toBounds( bounds );

        const min = this.min,
            max = this.max,
            min2 = _bounds.min,
            max2 = _bounds.max,
            xIntersects = (max2.getLongitude() >= min.getLongitude()) && (min2.getLongitude() <= max.getLongitude()),
            yIntersects = (max2.getLatitude() >= min.getLatitude()) && (min2.getLatitude() <= max.getLatitude());

        return xIntersects && yIntersects;
    }

    /**
     * Скопировать значение
     * @param inbound входные параметры
     */
    fromBounds( inbound: GeoBoundsRad ) {
        this.min.setLongitude( inbound.min.getLongitude() );
        this.min.setLatitude( inbound.min.getLatitude() );
        this.min.setHeight( inbound.min.getHeight() );

        this.max.setLongitude( inbound.max.getLongitude() );
        this.max.setLatitude( inbound.max.getLatitude() );
        this.max.setHeight( inbound.max.getHeight() );
    }

    /*
     * Преобразовать к Bounds
     * @method toBounds
     * @returns {Bounds}
     */
    static toBounds( a: GeoBoundsRad | GeoPointRad, b?: GeoPointRad ) {
        if ( a instanceof GeoBoundsRad ) {
            return a;
        }
        return new GeoBoundsRad( a, b );
    }

}



