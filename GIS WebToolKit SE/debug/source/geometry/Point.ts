/*******************************************************************
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2024              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                         Класс Точка                              *
*                            GWTK SE                               *
*                                                                  *
*******************************************************************/
export class Point {
    x: number;
    y: number;

    /*
     * Конструктор
     * @param x {number} координата x
     * @param y {number} координата y
     */
    constructor ( x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Клонировать
     * @method clone
     * @public
     * @returns {Point} точка
     */
    clone ( ) {
        return new Point( this.x, this.y);
    }

    /**
     * Сложить
     * @method add
     * @param point {Point} точка
     * @public
     * @returns {Point} новая точка
     */
    add (point: Point)  {
        return this.clone()._add(GWTK.point(point));
    }

    /**
     * Сложить
     * @method _add
     * @param point {Point} точка
     * @public
     * @returns {Point} текущая точка
     */
    _add (point: Point) {
        this.x += point.x;
        this.y += point.y;
        return this;
    }

    /**
     * Вычесть
     * @method subtract
     * @param point {Point} вычитаемое
     * @public
     * @returns {Point} новая точка
     */
    subtract (point: Point) {
        return this.clone()._subtract( new Point( point.x, point.y ) );
    }

    /**
     * Вычесть
     * @method _subtract
     * @param point {Point} вычитаемое
     * @public
     * @returns {Point} текущая точка
     */
    _subtract (point: Point) {
        this.x -= point.x;
        this.y -= point.y;
        return this;
    }

    /**
     * Разделить на
     * @method divideBy
     * @param num {number} делитель
     * @public
     * @returns {Point} новая точка
     */
    divideBy (num: number) {
        return this.clone()._divideBy(num);
    }

    /**
     * Разделить на
     * @method _divideBy
     * @param num {number} делитель
     * @public
     * @returns {Point} текущая точка
     */
    _divideBy(num: number) {
        this.x /= num;
        this.y /= num;
        return this;
    }

    /**
     * Умножить на
     * @method multiplyBy
     * @param num {number} множитель
     * @public
     * @returns {Point} новая точка
     */
    multiplyBy(num: number) {
        return this.clone()._multiplyBy(num);
    }

    /**
     * Умножить на
     * @method _multiplyBy
     * @param num {number} множитель
     * @public
     * @returns {Point} текущая точка
     */
    _multiplyBy(num: number) {
        this.x *= num;
        this.y *= num;
        return this;
    }

    /**
     * Округлить
     * @method round
     * @public
     * @returns {Point} новая точка
     */
    round () {
        return this.clone()._round();
    }

    /**
     * Округлить
     * @method _round
     * @public
     * @returns {Point} текущая точка
     */
    _round () {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }

    /**
     * Округлить до ближайшего меньшего
     * @method floor
     * @public
     * @returns {Point} новая точка
     */
    floor () {
        return this.clone()._floor();
    }

    /**
     * Округлить до ближайшего меньшего
     * @method floor
     * @public
     * @returns {Point} текущая точка
     */
    _floor () {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    }

    /**
     * Округлить до ближайшего большего
     * @method ceil
     * @public
     * @returns {Point} текущая точка
     */
    ceil () {
        return this.clone()._ceil();
    }

    /**
     * Округлить до ближайшего большего
     * @method _ceil
     * @public
     * @returns {Point} текущая точка
     */
    _ceil () {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this;
    }

    /**
     * Расстояние до точки
     * @method distanceTo
     * @param point {Point} вторая точка
     * @public
     * @returns {number} расстояние
     */
    distanceTo (point: Point) {
        const x = point.x - this.x;
        const y = point.y - this.y;
        return Math.sqrt(x * x + y * y);
    }

    /**
     * Равенство двух точек
     * @method equals
     * @param point {Point} вторая точка
     * @public
     * @returns {boolean} `true` - равны
     */
    equals (point: Point) {
        return (point.x === this.x &&  point.y === this.y);
    }

    /**
     * Умножение точек
     * @method scaleBy
     * @param point {Point} вторая точка
     * @public
     * @returns {Point} новая точка
     */
    scaleBy (point: Point) {
        return new Point(this.x * point.x, this.y * point.y);
    }

    /**
     * Деление точек
     * @method unscaleBy
     * @param point {Point} вторая точка
     * @public
     * @returns {Point} новая точка
     */
    unscaleBy (point: Point) {
        return new Point(this.x / point.x, this.y / point.y);
    }

    /**
     * Преобразовать в строку
     * @method toString
     * @public
     * @returns {string}
     */
    toString () {
        return 'Point(' +
            GWTK.Util.formatNum(this.x) + ', ' +
            GWTK.Util.formatNum(this.y) + ')';
    }

    /**
     * Преобразовать в точку
     * @method toPoint
     * @param x {number | Point | Array} координата x | точка | массив
     * @param y { number } координата y
     * @public
     * @returns {Point}
     */
    static toPoint(x: number | number[] | Point, y?: number ) {
        if (x instanceof Point) { return x; }
        if (Array.isArray(x)) {
            if ( x.length >= 2)
                return new Point(x[0], x[1]);
        } else {
            if (typeof y !== 'undefined')
                return new Point(x, y);
        }
        throw new Error('Point. Invalid input parameter.');
    }

}

/*
 * Класс Трехмерная точка
 * Наследует Point
 * Содержит координаты x, y и высоту h
 */

export class Point3D extends Point {
    h?: number;

    constructor (x: number, y: number, h?: number) {
        super(x, y);
        this.h = h;
    }

    /**
     * Клонировать
     * @method clone
     * @public
     * @returns {Point3D} точка Point3D
     */
    clone () {
        return new Point3D( this.x, this.y, this.h);
    }

}

/*
 * Класс произвольных данных
 * Наследует Point
 * Содержит координаты точки и прозвольное числовое значение z
 */
export class TileCoord extends Point {
    public z: number;

    constructor ( x: number, y: number, z: number) {
        super(x, y);
        this.z = z;
    }

}

