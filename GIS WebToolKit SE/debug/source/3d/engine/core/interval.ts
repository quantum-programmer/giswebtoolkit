/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                           Интервал значений                      *
 *                                                                  *
 *******************************************************************/

export enum IntervalEndpoint {
    Open = 'OPEN',
    Closed = 'CLOSED'
}

/**
 * Класс интервала значений
 * @class Interval
 * @param minimum {number} Минимальное значение интервала
 * @param maximum {number} Максимальное значение интервала
 * @param [minimumEndpoint] {IntervalEndpoint} Параметр вхождения минимума в интервал
 * @param [maximumEndpoint] {IntervalEndpoint} Параметр вхождения максимума в интервал
 */
export default class Interval {

    private readonly minimum: number;
    private readonly maximum: number;
    private readonly minimumEndpoint: IntervalEndpoint;
    private readonly maximumEndpoint: IntervalEndpoint;

    constructor( minimum: number, maximum: number, minimumEndpoint = IntervalEndpoint.Closed, maximumEndpoint = IntervalEndpoint.Closed ) {
        this.minimum = minimum;
        this.maximum = maximum;
        this.minimumEndpoint = minimumEndpoint;
        this.maximumEndpoint = maximumEndpoint;
    }

    /**
     * Проверка вхождения значения в интервал
     * @method contains
     * @param value{number} Значение
     * @return {boolean} Если `true`, то точка внутри интервала
     */
    contains( value: number ) {
        const satisfiesMinimum = (this.minimumEndpoint === IntervalEndpoint.Closed) ? (value >= this.minimum) : (value > this.minimum);
        const satisfiesMaximum = (this.maximumEndpoint === IntervalEndpoint.Closed) ? (value <= this.maximum) : (value < this.maximum);
        return satisfiesMinimum && satisfiesMaximum;
    }

    /**
     * Сравнение интервалов
     * @method equals
     * @param interval{Interval} Интервал
     * @return {boolean} Если `true`, то интервалы одинаковые
     */
    equals( interval: Interval ) {
        return (this.minimum === interval.minimum && this.maximum === interval.maximum && this.minimumEndpoint === interval.minimumEndpoint && this.maximumEndpoint === interval.maximumEndpoint);
    }
}
