/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Класс Прямоугольник                         *
 *                                                                  *
 *******************************************************************/

export default class Rectangle {

    constructor( public left: number, public bottom: number, public right: number, public top: number ) {
    }

    get height() {
        return Math.abs( this.top - this.bottom );
    }

    get width() {
        return Math.abs( this.right - this.left );
    }

    get boundingBox() {
        return [this.left, this.bottom, this.right, this.top];
    }

    equals( rect: Rectangle ) {
        return this.left === rect.left && this.bottom === rect.bottom && this.right === rect.right && this.top === rect.top;
    }

    copy() {
        return new Rectangle( this.left, this.bottom, this.right, this.top );
    }

    contains( x: number, y: number ) {
        return x >= this.left && x <= this.right && y >= this.top && y <= this.bottom;
    }
}
