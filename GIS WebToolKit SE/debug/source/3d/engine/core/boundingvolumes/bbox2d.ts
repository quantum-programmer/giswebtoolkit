/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Ограничивающий прямоугольник                     *
 *                                                                  *
 *******************************************************************/

import { Vector2or3, Vector2D } from '../Types';
import { vec2 } from '~/3d/engine/utils/glmatrix';

/**
 * Ограничивающий прямоугольник
 * @class BoundingBox2D
 */
export default class BoundingBox2D {

    private xAxis: Vector2D = vec2.create( vec2.UNITX );
    private yAxis: Vector2D = vec2.create( vec2.UNITY );

    private minimum: Vector2D = vec2.create();
    private maximum: Vector2D = vec2.create();
    private centerPoint: Vector2D = vec2.create();
    private radius = 0;

    /**
     * Вспомогательный массив
     * @static
     * @property {Vector2D} mRadiusVec
     */
    private mRadiusVec: Vector2D = vec2.create();

    /**
     * Получить значение центра
     * @method getCenter
     * @return {Vector2D} Координаты центра
     */
    getCenter() {
        return this.centerPoint;
    }

    /**
     * Получить минимальные значения координат
     * @method getMinimum
     * @return {Vector2D} Минимальные значения координат
     */
    getMinimum() {
        return this.minimum;
    }

    /**
     * Получить максимальные значения координат
     * @method getMaximum
     * @return {Vector2D} Максимальные значения координат
     */
    getMaximum() {
        return this.maximum;
    }

    /**
     * Получить значение радиуса описанной окружности
     * @method getRadius
     * @return {number} Значение радиуса описанной окружности
     */
    getRadius() {
        return this.radius;
    }

    /**
     * Описать прямоугольник вокруг точек
     * @method fitPoints
     * @param positions {Vector2or3[]} Массив точек
     */
    fitPoints( positions: Vector2or3[] ) {
        if ( positions.length < 1 ) {
            console.warn( 'Invalid input data' );
            return;
        }

        const position = vec2.fromPoint( positions[ 0 ] );

        let minimumX = vec2.dot( position, this.xAxis );
        let minimumY = vec2.dot( position, this.yAxis );

        let maximumX = minimumX;
        let maximumY = minimumY;

        for ( let i = 1; i < positions.length; i++ ) {

            vec2.fromPoint( positions[ i ], position );

            const curX = vec2.dot( position, this.xAxis );
            const curY = vec2.dot( position, this.yAxis );

            if ( curX < minimumX ) {
                minimumX = curX;
            }

            if ( curX > maximumX ) {
                maximumX = curX;
            }

            if ( curY < minimumY ) {
                minimumY = curY;
            }

            if ( curY > maximumY ) {
                maximumY = curY;
            }
        }

        this.minimum = [minimumX, minimumY];
        this.maximum = [maximumX, maximumY];

        this.centerPoint = [(this.minimum[ 0 ] + this.maximum[ 0 ]) * 0.5,
            (this.minimum[ 1 ] + this.maximum[ 1 ]) * 0.5
        ];

        this.radius = vec2.len( vec2.sub( this.maximum, this.minimum, this.mRadiusVec ) ) * 0.5;
    }
}

