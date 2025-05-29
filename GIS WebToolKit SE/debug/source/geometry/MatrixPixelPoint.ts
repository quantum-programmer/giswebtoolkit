import TranslateList from '~/translate/TTranslateList';
import PixelPoint from '~/geometry/PixelPoint';

// класс точки в матрице ось х вниз, y вправо
export class MatrixPixelPoint extends PixelPoint {

    /**
     * Номер приближения
     */
    Zoom: number;

    /**
     * Параметры пересчета
     */
    get Translate() {
        return TranslateList.getItem( this.ProjectionId );
    }

    ProjectionId: string;

    constructor( x: number = 0, y: number = 0, zoom: number = 0, projectionId: string = 'GoogleMapsCompatible' ) {
        super( x, y );
        this.Zoom = zoom;
        this.ProjectionId = projectionId;
    }
}