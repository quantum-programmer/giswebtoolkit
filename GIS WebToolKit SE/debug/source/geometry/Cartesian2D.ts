interface PointXY {
    x: number;
    y: number;
}

export abstract class Cartesian2D implements PointXY {
    /*
     * @constructor
     * @param [x] {number} Координата по оси X (0)
     * @param [y] {number} Координата по оси Y (0)
     */
    protected constructor( public x = 0, public y = 0 ) {
    }


    /**
     * Расстояние до точки
     * @method distanceTo
     * @param point {Cartesian2D} Точка для вычисления расстояния от текущей
     * @returns {number} Расстояние до точки
     */
    distanceTo( point: PointXY ): number {
        return Cartesian2D.distance( this, point );
    }

    /**
     * Равенство двух точек
     * @method equals
     * @param point {Cartesian2D} Точка для сравнения
     * @returns {boolean} `true` - равны
     */
    equals( point: PointXY ): boolean {
        return Cartesian2D.equals( this, point );
    }

    /**
     * Преобразовать в строку
     * @method toString
     * @returns {string}
     */
    toString(): string {
        return `(${Cartesian2D.formatNum( this.x )}, ${Cartesian2D.formatNum( this.y )})`;
    }

    /**
     * Сумма по координатам (перемещение по осям)
     * @method add
     * @param point {Cartesian2D} Точка для сложения с текущей
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    abstract add( point: Cartesian2D, result?: Cartesian2D ): Cartesian2D;

    /**
     * Разность (вычитание векторов)
     * @method subtract
     * @param point {Cartesian2D} Точка для вычитания из текущей
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     *
     */
    abstract subtract( point: Cartesian2D, result?: Cartesian2D ): Cartesian2D;


    /**
     * Создать копию точки
     * @method copy
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    abstract clone( result?: Cartesian2D ): Cartesian2D;


    /**
     * Сумма по координатам (перемещение по осям)
     * @method add
     * @param firstPoint {Cartesian2D} Первая точка
     * @param secondPoint {Cartesian2D} Вторая точка
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    static add<T extends PointXY>( firstPoint: T, secondPoint: T, result: T ): T {
        result.x = firstPoint.x + secondPoint.x;
        result.y = firstPoint.y + secondPoint.y;

        return result;
    }

    /**
     * Создание копии
     * @param point {Cartesian2D} Исходная точка
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    static clone<T extends PointXY>( point: T, result: T ): T {
        result.x = point.x;
        result.y = point.y;

        return result;
    }


    /**
     * Округлить значения координат
     * @method round
     * @param point {Cartesian2D} Исходная точка
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    static round<T extends PointXY>( point: T, result: T ): T {
        result.x = Math.round( point.x );
        result.y = Math.round( point.y );
        return result;
    }

    /**
     * Округлить значения координат до ближайшего меньшего
     * @method floor
     * @param point {Cartesian2D} Исходная точка
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    static floor<T extends PointXY>( point: T, result: T ): T {
        result.x = Math.floor( point.x );
        result.y = Math.floor( point.y );
        return result;
    }

    /**
     * Округлить значения координат до ближайшего большего
     * @method ceil
     * @param point {Cartesian2D} Исходная точка
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    static ceil<T extends PointXY>( point: T, result: T ): T {
        result.x = Math.ceil( point.x );
        result.y = Math.ceil( point.y );
        return result;
    }

    protected static tempPoint: PointXY = {
        x: 0, y: 0
    };

    /**
     * Расстояние между точками
     * @method distance
     * @param firstPoint {Cartesian2D} Первая точка
     * @param secondPoint {Cartesian2D} Вторая точка
     * @returns {number} Расстояние между точками
     */
    static distance( firstPoint: PointXY, secondPoint: PointXY ): number {
        Cartesian2D.subtract( firstPoint, secondPoint, Cartesian2D.tempPoint );

        return Cartesian2D.magnitude( Cartesian2D.tempPoint );
    }

    /**
     * Равенство двух точек
     * @method equals
     * @param firstPoint {Cartesian2D} Первая точка
     * @param secondPoint {Cartesian2D} Вторая точка
     * @returns {boolean} `true` - равны
     */
    static equals( firstPoint: PointXY, secondPoint: PointXY ): boolean {
        return Math.abs( firstPoint.x - secondPoint.x ) < Number.EPSILON && Math.abs( firstPoint.y - secondPoint.y ) < Number.EPSILON;
    }

    static formatNum( value: number, digits = 5 ) {
        const pow = Math.pow( 10, digits );
        return Math.round( value * pow ) / pow;
    }

    /**
     * Длина вектора
     * @method magnitude
     * @param point {PointXY} Исходная точка
     * @return {number} Длина вектора
     */
    static magnitude( point: PointXY ): number {
        return Math.sqrt( Cartesian2D.magnitudeSquared( point ) );
    }

    /**
     * Квадрат длины вектора
     * @method magnitudeSquared
     * @param point {Cartesian2D} Исходная точка
     * @return {number} Квадрат длины вектора
     */
    static magnitudeSquared( point: PointXY ): number {
        return point.x * point.x + point.y * point.y;
    }

    /**
     * Произведение по координатам (масштабирование по осям)
     * @method multiply
     * @param firstPoint {Cartesian2D} Первая точка
     * @param secondPoint {Cartesian2D} Вторая точка
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    static multiply<T extends PointXY>( firstPoint: T, secondPoint: T, result: T ): T {
        result.x = firstPoint.x * secondPoint.x;
        result.y = firstPoint.y * secondPoint.y;

        return result;
    }

    /**
     * Умножить на коэффициент
     * @method multiplyBy
     * @param firstPoint {Cartesian2D} Первая точка
     * @param scalar {number} Коэффициент для умножения
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    static multiplyBy<T extends PointXY>( firstPoint: T, scalar: number, result: T ): T {
        result.x = firstPoint.x * scalar;
        result.y = firstPoint.y * scalar;

        return result;
    }


    /**
     * Операция деления по координатам (обратное масштабирование по осям)
     * @method divide
     * @param firstPoint {Cartesian2D} Первая точка
     * @param secondPoint {Cartesian2D} Вторая точка
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    static divide<T extends PointXY>( firstPoint: T, secondPoint: T, result: T ): T {
        result.x = firstPoint.x / secondPoint.x;
        result.y = firstPoint.y / secondPoint.y;

        return result;
    }

    /**
     * Разделить на коэффициент
     * @method divideBy
     * @param firstPoint {Cartesian2D} Первая точка
     * @param scalar {number} Коэффициент для деления
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    static divideBy<T extends PointXY>( firstPoint: T, scalar: number, result: T ): T {
        result.x = firstPoint.x / scalar;
        result.y = firstPoint.y / scalar;

        return result;
    }


    /**
     * Разность (вычитание векторов)
     * @method subtract
     * @param firstPoint {Cartesian2D} Первая точка
     * @param secondPoint {Cartesian2D} Вторая точка
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    static subtract<T extends PointXY>( firstPoint: T, secondPoint: T, result: T ): T {
        result.x = firstPoint.x - secondPoint.x;
        result.y = firstPoint.y - secondPoint.y;

        return result;
    }

    /**
     * Поменять оси местами
     * @param point {Cartesian2D} Исходная точка
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    static swapAxis<T extends PointXY>( point: T, result: T ): T {
        const { x: newY, y: newX } = point;

        result.x = newX;
        result.y = newY;

        return result;
    }
}