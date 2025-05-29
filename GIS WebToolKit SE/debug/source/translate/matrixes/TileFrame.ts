import { Bounds } from '~/geometry/Bounds';

/**
 * Параметры тайлов
 */
export class TileFrame {

    readonly GeoFrame = new Bounds();
    readonly MetrFrame = new Bounds();
    readonly PixelFrame = new Bounds();
    readonly TileFrame = new Bounds();
    Width = 0;
    Height = 0;
    TileCountWidth = 0;
    TileCountHeight = 0;

    /**
     * Очистить параметры
     */
    clear() {
        this.GeoFrame.clear();
        this.MetrFrame.clear();
        this.PixelFrame.clear();
        this.TileFrame.clear();
        this.Width = 0;
        this.Height = 0;
        this.TileCountWidth = 0;
        this.TileCountHeight = 0;
    }
}