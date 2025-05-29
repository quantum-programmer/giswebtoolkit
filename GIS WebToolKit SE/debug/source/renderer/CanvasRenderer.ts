/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Инструмент Canvas рисования                   *
 *                                                                  *
 *******************************************************************/


/**
 * Инструмент Canvas рисования
 * @class CanvasRenderer
 */
export default class CanvasRenderer {

    /**
     * Нарисовать окружность
     * @static
     * @method drawCircleToCanvas
     * @param canvas {HTMLCanvasElement} Экземпляр холста
     * @param cx {number} Х-координата центра окружности
     * @param cy {number} Y-координата центра окружности
     * @param radius {number} Радиус окружности
     * @param color {string} Цвет окружности
     */
    static drawCircleToCanvas(
        canvas: HTMLCanvasElement,
        cx: number,
        cy: number,
        radius: number,
        color: string ) {

        const context = canvas.getContext( '2d' );

        if ( context ) {
            context.fillStyle = color;
            context.arc( cx, cy, radius, 0, 2 * Math.PI );
            context.fill();
        }
    }

    /**
     * Нарисовать отрезок
     * @static
     * @method drawLineToCanvas
     * @param canvas {HTMLCanvasElement} Экземпляр холста
     * @param x0 {number} Х-координата начала отрезка
     * @param y0 {number} Y-координата начала отрезка
     * @param x1 {number} Х-координата конца отрезка
     * @param y1 {number} Y-координата конца отрезка
     * @param width {number} Толщина отрезка
     * @param color {string} Цвет отрезка
     */
    static drawLineToCanvas(
        canvas: HTMLCanvasElement,
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        width: number,
        color: string ) {

        const context = canvas.getContext( '2d' );

        if ( context ) {
            context.moveTo( x0, y0 );
            context.lineWidth = 1;
            context.strokeStyle = color;
            context.lineTo( x1, y1 );
            context.stroke();
        }
    }

    /**
     * Нарисовать прямоугольник с заливкой
     * @static
     * @method drawPolygonToCanvas
     * @param canvas {HTMLCanvasElement} Экземпляр холста
     * @param dx {number} Х-координата левого верхнего угла
     * @param dy {number} Y-координата левого верхнего угла
     * @param width {number} Ширина прямоугольника
     * @param height {number} Высота прямоугольника
     * @param color {string} Цвет заливки
     */
    static drawPolygonToCanvas(
        canvas: HTMLCanvasElement,
        dx: number,
        dy: number,
        width: number,
        height: number,
        color: string ) {

        const context = canvas.getContext( '2d' );

        if ( context ) {
            context.fillStyle = color;
            context.fillRect( dx, dy, width, height );
        }
    }
}
