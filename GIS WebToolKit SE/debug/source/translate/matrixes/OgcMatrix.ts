import { Bounds } from '~/geometry/Bounds';
import { MapPoint } from '~/geometry/MapPoint';
import { MatrixDescription } from '~/translate/Types';
import { TTranslate } from '~/translate/TTranslate';
import TranslateFactory from '~/translate/TranslateFactory';

/**
 * Параметры матрицы
 */
export default class OgcMatrix {

    protected Epsg = 0;                          // Код системы
    Name = '';                                   // Тип матрицы
    protected readonly Frame = new Bounds();     // Габариты матрицы в файле
    readonly NormalFrame = new Bounds();         // Нормализованные габариты
    readonly ScaleDenominator: number[] = [];    // Масштабный коэффициент
    TileSize = 256;                              // Размер тайла
    protected MinZoom = 0;                       // Минимальный масштаб
    protected MaxZoom = 0;                       // Максимальный масштаб
    protected Type = 0;                          // Тип системы 2 -геодезия 1 - метры

    constructor( description: MatrixDescription ) {
        this.Name = description.Name;
        this.Epsg = description.Epsg;
        this.Type = description.Type;
        this.Frame.min.x = description.Frame.min.x;
        this.Frame.min.y = description.Frame.min.y;
        this.Frame.max.x = description.Frame.max.x;
        this.Frame.max.y = description.Frame.max.y;
        this.ScaleDenominator.splice( 0, 0, ...description.ScaleDenominator );
        this.TileSize = description.TileSize;
        this.MinZoom = description.MinZoom;
        this.MaxZoom = description.MaxZoom;
        this.setNormalFrame();
    }

    /**
     * Проверить является ли система координат геодезической
     * @returns
     */
    isGeoSys(): boolean {
        return this.Type === 2;
    }

    /**
     * Получить точку привязки по оси X
     * @returns
     */
    getPointX(): number {
        return this.Frame.min.x;
    }

    // Получить точку привязки по оси Y
    getPointY(): number {
        return this.Frame.min.y;
    }

    /**
     * Запросить знак для расчета тайлов по оси X
     * */
    getPointMarkX(): number {
        // Отсчет сверху
        if ( this.Frame.min.x > this.Frame.max.x ) {
            return -1;
        } else {
            return 1;
        }
    }

    /**
     * Запросить знак для расчета тайлов по оси Y
     */
    getPointMarkY(): number {
        // Отсчет справа
        if ( this.Frame.min.y > this.Frame.max.y ) {
            return -1;
        } else {
            return 1;
        }
    }

    /**
     * Установить корректную рамку с точкой отсчета в левом нижнем углу
     */
    setNormalFrame(): void {
        this.NormalFrame.fromBounds( this.Frame );
        if ( this.Frame.min.x > this.Frame.max.x ) {
            const val: number = this.NormalFrame.min.x;
            this.NormalFrame.min.x = this.NormalFrame.max.x;
            this.NormalFrame.max.x = val;
        }

        if ( this.Frame.min.y > this.Frame.max.y ) {
            const val = this.NormalFrame.min.y;
            this.NormalFrame.min.y = this.NormalFrame.max.y;
            this.NormalFrame.max.y = val;
        }
    }

    /**
     * Запросить габариты в метрах по 8 точкам радиан
     * возвращает сконвертированные габариты
     * @param geoFrame радианы
     * @param translate
     * @returns
     */
    static getPlaneFrameFromGeoFrame( geoFrame: Bounds, translate: Readonly<TTranslate> ): Bounds | undefined {

        // Определить геодезические координаты 4-х точек

        const b = TranslateFactory.createTDouble( 0 );
        const l = TranslateFactory.createTDouble( 0 );

        // Определить прямоугольные координаты в метрах

        b.Value = geoFrame.min.x;
        l.Value = geoFrame.min.y;
        translate.bl2xy_one( b, l );
        let point1 = new MapPoint( b.Value, l.Value, 0, translate.ProjectionId ); // Ю-З

        b.Value = geoFrame.max.x;
        l.Value = geoFrame.min.y;
        translate.bl2xy_one( b, l );
        let point2 = new MapPoint( b.Value, l.Value, 0, translate.ProjectionId ); // С-З

        b.Value = geoFrame.max.x;
        l.Value = geoFrame.max.y;
        translate.bl2xy_one( b, l );
        let point3 = new MapPoint( b.Value, l.Value, 0, translate.ProjectionId ); // С-В

        b.Value = geoFrame.min.x;
        l.Value = geoFrame.max.y;
        translate.bl2xy_one( b, l );
        let point4 = new MapPoint( b.Value, l.Value, 0, translate.ProjectionId );  // Ю-В

        if ( !point1 || !point2 || !point3 || !point4 ) {
            return;
        }

        // Найти минимум и максимум габаритов (в разных проекциях - разные габариты)
        const pmin = new MapPoint( 0, 0, 0, translate.ProjectionId );
        const pmax = new MapPoint( 0, 0, 0, translate.ProjectionId );
        pmin.x = point1.x;
        if ( pmin.x > point2.x )
            pmin.x = point2.x;
        if ( pmin.x > point3.x )
            pmin.x = point3.x;
        if ( pmin.x > point4.x )
            pmin.x = point4.x;

        pmin.y = point1.y;
        if ( pmin.y > point2.y )
            pmin.y = point2.y;
        if ( pmin.y > point3.y )
            pmin.y = point3.y;
        if ( pmin.y > point4.y )
            pmin.y = point4.y;

        pmax.x = point1.x;
        if ( pmax.x < point2.x )
            pmax.x = point2.x;
        if ( pmax.x < point3.x )
            pmax.x = point3.x;
        if ( pmax.x < point4.x )
            pmax.x = point4.x;

        pmax.y = point1.y;
        if ( pmax.y < point2.y )
            pmax.y = point2.y;
        if ( pmax.y < point3.y )
            pmax.y = point3.y;
        if ( pmax.y < point4.y )
            pmax.y = point4.y;

        // Взять габариты по 8 точкам

        // Определить прямоугольные координаты в метрах
        b.Value = (geoFrame.min.x + geoFrame.max.x) / 2.;
        l.Value = geoFrame.min.y;
        translate.bl2xy_one( b, l );
        point1 = new MapPoint( b.Value, l.Value, 0, translate.ProjectionId );

        b.Value = geoFrame.max.x;
        l.Value = (geoFrame.min.y + geoFrame.max.y) / 2.;
        translate.bl2xy_one( b, l );
        point2 = new MapPoint( b.Value, l.Value, 0, translate.ProjectionId );

        b.Value = (geoFrame.min.x + geoFrame.max.x) / 2.;
        l.Value = geoFrame.max.y;
        translate.bl2xy_one( b, l );
        point3 = new MapPoint( b.Value, l.Value, 0, translate.ProjectionId );

        b.Value = geoFrame.min.x;
        l.Value = (geoFrame.min.y + geoFrame.max.y) / 2.;
        translate.bl2xy_one( b, l );
        point4 = new MapPoint( b.Value, l.Value, 0, translate.ProjectionId );

        if ( !point1 || !point2 || !point3 || !point4 ) {
            return;
        }

        if ( pmin.x > point1.x )
            pmin.x = point1.x;
        if ( pmin.x > point2.x )
            pmin.x = point2.x;
        if ( pmin.x > point3.x )
            pmin.x = point3.x;
        if ( pmin.x > point4.x )
            pmin.x = point4.x;

        if ( pmin.y > point1.y )
            pmin.y = point1.y;
        if ( pmin.y > point2.y )
            pmin.y = point2.y;
        if ( pmin.y > point3.y )
            pmin.y = point3.y;
        if ( pmin.y > point4.y )
            pmin.y = point4.y;

        if ( pmax.x < point1.x )
            pmax.x = point1.x;
        if ( pmax.x < point2.x )
            pmax.x = point2.x;
        if ( pmax.x < point3.x )
            pmax.x = point3.x;
        if ( pmax.x < point4.x )
            pmax.x = point4.x;

        if ( pmax.y < point1.y )
            pmax.y = point1.y;
        if ( pmax.y < point2.y )
            pmax.y = point2.y;
        if ( pmax.y < point3.y )
            pmax.y = point3.y;
        if ( pmax.y < point4.y )
            pmax.y = point4.y;

        return new Bounds( pmin, pmax );
    }

}
