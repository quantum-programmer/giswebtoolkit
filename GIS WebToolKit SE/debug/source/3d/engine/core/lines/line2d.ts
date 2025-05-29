/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Линия на плоскости                        *
 *                                                                  *
 *******************************************************************/

import { Vector2or3, Vector2D } from '~/3d/engine/core/Types';
import { vec2, vec3 } from '~/3d/engine/utils/glmatrix';

/**
 * Объект для создания прямых на плоскости
 * @static
 */
export default class Line2DCreator {
    /**
     * Создать линию по коэффициентам уравнения прямой
     * @method createLineByABC
     * @static
     * @param a {number} Коэффициент A уровнения прямой
     * @param b {number} Коэффициент B уровнения прямой
     * @param c {number} Коэффициент C уровнения прямой
     * @return {Line2D} Экземпляр прямой
     */
    static createLineByABC( a: number, b: number, c: number ) {
        return new Line2D( a, b, c );
    }

    /**
     * Создать линию по нормали и точке
     * @method createLineByNormalAndPoint
     * @static
     * @param n {Vector2or3} Нормаль прямой
     * @param point {Vector2or3} Точка на прямой
     * @return {Line2D} Экземпляр прямой
     */
    static createLineByNormalAndPoint(n: Vector2or3, point: Vector2or3 ) {
        const lA = n[ 0 ];
        const lB = n[ 1 ];
        const lC = -lA * point[ 0 ] - lB * point[ 1 ];
        return new Line2D( lA, lB, lC );
    }

    /**
     * Создать прямую по двум точкам
     * @method createLineByPoints
     * @static
     * @param point1 {Vector2or3} Первая точка на прямой
     * @param point2 {Vector2or3} Вторая точка на прямой
     * @return {Line2D} Экземпляр прямой
     */
    static createLineByPoints(point1: Vector2or3, point2: Vector2or3 ) {
        const lA = point2[ 1 ] - point1[ 1 ];
        const lB = point1[ 0 ] - point2[ 0 ];
        const lC = -lB * point1[ 1 ] - point1[ 0 ] * lA;
        return new Line2D( lA, lB, lC );
    }
}

/**
 * Класс линии на плоскости
 * @class Line2D
 * @param a {number} Коэффициент A уровнения прямой
 * @param b {number} Коэффициент B уровнения прямой
 * @param c {number} Коэффициент C уровнения прямой
 */
export class Line2D {
    private readonly nAB = vec2.create();
    readonly a: number;
    readonly b: number;
    c: number;

    private readonly p = vec2.create();
    private readonly n = vec2.create();

    constructor( a: number, b: number, c: number ) {
        this.a = a;
        this.b = b;
        this.c = c;

        vec3.setValues( Line2D.mVec3, a, b, 0 );

        vec3.cross( Line2D.mVec3, vec3.UNITZ );
        vec2.fromVector3( Line2D.mVec3, this.p );
        vec2.normalize( this.p );

        vec2.setValues( this.nAB, a, b );
        vec2.normalize( this.nAB, this.n );
    }

    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {Vector3D} mVec3
     */
    private static mVec3 = vec3.create();

    /**
     * Переместить линию на вектор
     * @method translateByVector
     * @param vector {Vector2D} Вектор перемещения
     */
    translateByVector( vector: Vector2D ) {
        this.c = this.c - vec2.dot( this.nAB, vector );
    }

    /**
     * Получить нормаль к прямой
     * @method getNormal
     * @return {Vector2D} Вектор нормали к прямой
     */
    getNormal() {
        return this.n;
    }

    /**
     * Получить направление
     * @method getDirection
     * @return {Vector2D} Вектор направления
     */
    getDirection() {
        return this.p;
    }

    /**
     * Получить копию объекта
     * @method copy
     * @return {Line2D} Копия объекта
     */
    copy() {
        return new Line2D( this.a, this.b, this.c );
    }
}
