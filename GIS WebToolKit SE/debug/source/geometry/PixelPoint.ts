import { Cartesian2D } from '~/geometry/Cartesian2D';

export default class PixelPoint extends Cartesian2D {
    constructor( x = 0, y = 0 ) {
        super( x, y );
    }

    add( point: PixelPoint, result = new PixelPoint() ): PixelPoint {
        return Cartesian2D.add( this, point, result );
    }

    subtract( point: PixelPoint, result = new PixelPoint() ): PixelPoint {
        return Cartesian2D.subtract( this, point, result );
    }

    clone( result = new PixelPoint() ): PixelPoint {
        return Cartesian2D.clone( this, result );
    }

    /**
     * Произведение по координатам (масштабирование по осям)
     * @method multiply
     * @param point {Cartesian2D} Точка для перемножения координат
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    multiply( point: PixelPoint, result = new PixelPoint() ): PixelPoint {
        return Cartesian2D.multiply( this, point, result );
    }

    /**
     * Умножить на коэффициент
     * @method multiplyBy
     * @param scalar {number} Коэффициент для умножения
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    multiplyBy( scalar: number, result = new PixelPoint() ): PixelPoint {
        return Cartesian2D.multiplyBy( this, scalar, result );
    }

    /**
     * Операция деления по координатам (обратное масштабирование по осям)
     * @method divide
     * @param point {Cartesian2D} Точка для деления координат
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    divide( point: PixelPoint, result = new PixelPoint() ): PixelPoint {
        return Cartesian2D.divide( this, point, result );
    }

    /**
     * Разделить на коэффициент
     * @method divideBy
     * @param scalar {number} Коэффициент для деления
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    divideBy( scalar: number, result = new PixelPoint() ): PixelPoint {
        return Cartesian2D.divideBy( this, scalar, result );
    }

    /**
     * Округлить значения координат
     * @method round
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    round( result = new PixelPoint() ): PixelPoint {
        return Cartesian2D.round( this, result );
    }

    /**
     * Округлить значения координат до ближайшего меньшего
     * @method floor
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    floor( result = new PixelPoint() ): PixelPoint {
        return Cartesian2D.floor( this, result );
    }

    /**
     * Округлить значения координат до ближайшего большего
     * @method ceil
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    ceil( result = new PixelPoint() ): PixelPoint {
        return Cartesian2D.ceil( this, result );
    }
}