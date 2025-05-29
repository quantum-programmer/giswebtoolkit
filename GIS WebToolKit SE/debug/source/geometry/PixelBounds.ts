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
 * Класс PixelBounds представляет описание прямоугольной области в пикселах
 */


import PixelPoint from '~/geometry/PixelPoint';

export class PixelBounds {
    readonly min: PixelPoint;
    readonly max: PixelPoint;

    /*
     * Конструктор
     * @param a {Point} первая точка или массив точек
     * @param b {Point} вторая точка
     */
    constructor( a = new PixelPoint(), b?: PixelPoint ) {
        const points: PixelPoint[] = [a];

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

    /*
     * Расширить габариты по точке
     * @method extend
     * @param point {Point} точка
     * @returns {PixelBounds}
     */
    extend( point: PixelPoint ) {
        this.min.x = Math.min( point.x, this.min.x );
        this.max.x = Math.max( point.x, this.max.x );
        this.min.y = Math.min( point.y, this.min.y );
        this.max.y = Math.max( point.y, this.max.y );
        return this;
    }

    /*
     * Получить центральную точку
     * @method getCenter
     * @param round {boolean} округлить значения
     * @returns {PixelPoint} центр
     */
    getCenter( round?: boolean ): PixelPoint {
        let center = new PixelPoint( (this.min.x + this.max.x) / 2,
            (this.min.y + this.max.y) / 2 );
        if ( round ) {
            center.round( center );
        }
        return center;
    }

    getBottomRight() {
        return new PixelPoint( this.max.x, this.max.y );
    }
    /*
     * Получить нижнюю левую точку
     * @method getBottomLeft
     * @returns {Point} нижняя левая точка
     */
    getBottomLeft() {
        return new PixelPoint( this.min.x, this.max.y );
    }

    /*
     * Получить верхнюю правую точку
     * @method getTopRight
     * @returns {Point} верхняя правая точка
     */
    getTopRight() {
        return new PixelPoint( this.max.x, this.min.y );
    }

    /*
     * Получить верхнюю левую точку
     * @method getTopLeft
     * @returns {Point} верхняя левая точка
     */
    getTopLeft() {
        return new PixelPoint( this.min.x, this.min.y );
    }

    /*
     * Получить размер
     * @method getSize
     * @returns {Point} размер
     */
    getSize() {
        return this.max.subtract( this.min );
    }

    getRadius() {
        const size = this.getSize();
        return Math.sqrt( size.x * size.x + size.y * size.y );
    }

    /*
     * Проверить на вхождение
     * @method contains
     * @returns {boolean} `true`- прямоугольник содержит указанные координаты
     */
    contains( obj: PixelBounds | PixelPoint ) {
        const _bounds = PixelBounds.toBounds( obj );

        const min = _bounds.min;
        const max = _bounds.max;

        return (min.x >= this.min.x) &&
            (max.x <= this.max.x) &&
            (min.y >= this.min.y) &&
            (max.y <= this.max.y);
    }

    /*
     * Проверить пересечение
     * @method intersects
     * @returns {boolean} `true`- пересечение имеется
     */
    intersects( bounds: PixelBounds | PixelPoint ) {
        const _bounds = PixelBounds.toBounds( bounds );

        const min = this.min,
            max = this.max,
            min2 = _bounds.min,
            max2 = _bounds.max,
            xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
            yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

        return xIntersects && yIntersects;
    }

    /*
     * Проверить
     * @method isValid
     * @returns {boolean} `true`- успешно
     */
    isValid() {
        return !!(this.min && this.max);
    }

    /**
     * Скопировать значение
     * @param inbound входные параметры
     */
    fromBounds( inbound: PixelBounds ) {
        this.min.x = inbound.min.x;
        this.min.y = inbound.min.y;
        this.max.x = inbound.max.x;
        this.max.y = inbound.max.y;
    }


    /**
     * Создать копию
     */
    clone() {
        return new PixelBounds( this.getTopLeft(), this.getBottomRight() );
    }


    /*
     * Преобразовать к PixelBounds
     * @method toBounds
     * @returns {PixelBounds}
     */
    static toBounds( a: PixelBounds | PixelPoint, b?: PixelPoint ) {
        if ( a instanceof PixelBounds ) {
            return a;
        }
        return new PixelBounds( a, b );
    }

}



