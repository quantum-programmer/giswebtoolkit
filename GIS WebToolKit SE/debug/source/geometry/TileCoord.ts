/*
 * Класс произвольных данных
 * Содержит координаты точки и произвольное числовое значение z
 */
import PixelPoint from '~/geometry/PixelPoint';

export default class TileCoord extends PixelPoint {
    public z: number;

    constructor( x: number, y: number, z: number ) {
        super( x, y );
        this.z = z;
    }
}