/************************************************************************
 *                                                                       *
 *                   Copyright (c) PANORAMA Group 1991-2024              *
 *                            All Rights Reserved                        *
 *                                                                       *
 *************************************************************************
 *                                                                       *
 *                     Класс работы с матрицами тайлов                   *
 *                                                                       *
 ************************************************************************/

import TranslateList from '~/translate/TTranslateList';
import { MapPoint } from '~/geometry/MapPoint';
import { MatrixPixelPoint } from '~/geometry/MatrixPixelPoint';
import { Bounds } from '~/geometry/Bounds';
import OgcMatrix from '~/translate/matrixes/OgcMatrix';
import PixelPoint from '~/geometry/PixelPoint';
import { TileNumber } from '~/types/CommonTypes';
import { GeoBounds } from '~/geometry/GeoBounds';
import GeoPointRad from '~/geo/GeoPointRad';
import { GeoBoundsRad } from '~/geometry/GeoBoundsRad';
import Trigonometry from '~/geo/Trigonometry';
import { TileFrame } from '~/translate/matrixes/TileFrame';
import { Cartesian2D } from '~/geometry/Cartesian2D';


/**
 * Класс доступа к матрицам тайлов
 */
export class TileMatrix {
    /**
     * Параметры пересчета
     */

    /**
     * Параметры матрицы
     */
    private readonly StandardPixelSize = 0.00028;
    private readonly MetersPerUnitGrad = 111319.49079327358;
    private readonly OgcEpsilon = 0.0000001;
    private readonly ScreenScale = 120;
    private readonly ScreenPrecision = 4000;

    constructor( private readonly ProjectionId: string, readonly isGeoSys: boolean, readonly Ogc: OgcMatrix ) {
    }

    /**
     * Проверить координаты точки
     * @param point точка
     * @returns
     */
    fitPointToMatrixSystem( point: MapPoint ): void {
        if ( point.x < this.Ogc.NormalFrame.min.x )
            point.x = this.Ogc.NormalFrame.min.x;
        if ( point.x > this.Ogc.NormalFrame.max.x )
            point.x = this.Ogc.NormalFrame.max.x;

        //бесконечная прокрутка вдоль экватора
        if ( point.y < this.Ogc.NormalFrame.min.y ) {
            point.y += (this.Ogc.NormalFrame.max.y - this.Ogc.NormalFrame.min.y);
        }
        if ( point.y > this.Ogc.NormalFrame.max.y ) {
            point.y -= (this.Ogc.NormalFrame.max.y - this.Ogc.NormalFrame.min.y);
        }
    }

    /**
     * Запросить центр матрицы
     * @returns {MapPoint}
     */
    getCenterPoint(): MapPoint {
        const point = new MapPoint( 0, 0, 0, this.ProjectionId );
        point.x = this.Ogc.NormalFrame.min.x + (this.Ogc.NormalFrame.max.x - this.Ogc.NormalFrame.min.x) / 2.;
        point.y = this.Ogc.NormalFrame.min.y + (this.Ogc.NormalFrame.max.y - this.Ogc.NormalFrame.min.y) / 2.;
        return point;
    }

    /**
     * Запросить габариты в градусах по 8 точкам метрах
     * возвращает сконвертированные габариты
     * @param planeFrame метры
     * @returns {Bounds}
     */
    getGeoDegreeFrameFromPlaneFrame( planeFrame: Bounds ): GeoBounds | undefined {
        const radFrame: GeoBoundsRad | undefined = this.getGeoFrameFromPlaneFrame( planeFrame );
        if ( !radFrame ) return undefined;

        return Trigonometry.toDegrees( radFrame );
    }

    /**
     * Запросить габариты в радианах по 8 точкам в метрах
     * возвращает сконвертированные габариты
     * @param planeFrame метры
     * @returns {GeoBounds} радианы
     */
    getGeoFrameFromPlaneFrame( planeFrame: Bounds ): GeoBoundsRad | undefined {

        // Определить геодезические координаты 4-х точек
        const point1: MapPoint = new MapPoint( planeFrame.min.x, planeFrame.min.y, 0, this.ProjectionId );       // Ю-З
        const point2: MapPoint = new MapPoint( planeFrame.max.x, planeFrame.min.y, 0, this.ProjectionId );       // С-З
        const point3: MapPoint = new MapPoint( planeFrame.max.x, planeFrame.max.y, 0, this.ProjectionId );       // С-В
        const point4: MapPoint = new MapPoint( planeFrame.min.x, planeFrame.max.y, 0, this.ProjectionId );       // Ю-В

        // Определить прямоугольные координаты в метрах
        let pointRad1 = point1.toGeoPointRad();
        let pointRad2 = point2.toGeoPointRad();
        let pointRad3 = point3.toGeoPointRad();
        let pointRad4 = point4.toGeoPointRad();

        if ( !pointRad1 || !pointRad2 || !pointRad3 || !pointRad4 ) return undefined;

        // Найти минимум и максимум габаритов (в разных проекциях - разные габариты)
        const pMin = { x: 0, y: 0, h: 0 };
        const pMax = { x: 0, y: 0, h: 0 };
        pMin.x = pointRad1.getLatitude();
        if ( pMin.x > pointRad2.getLatitude() )
            pMin.x = pointRad2.getLatitude();
        if ( pMin.x > pointRad3.getLatitude() )
            pMin.x = pointRad3.getLatitude();
        if ( pMin.x > pointRad4.getLatitude() )
            pMin.x = pointRad4.getLatitude();

        pMin.y = pointRad1.getLongitude();
        if ( pMin.y > pointRad2.getLongitude() )
            pMin.y = pointRad2.getLongitude();
        if ( pMin.y > pointRad3.getLongitude() )
            pMin.y = pointRad3.getLongitude();
        if ( pMin.y > pointRad4.getLongitude() )
            pMin.y = pointRad4.getLongitude();

        pMax.x = pointRad1.getLatitude();
        if ( pMax.x < pointRad2.getLatitude() )
            pMax.x = pointRad2.getLatitude();
        if ( pMax.x < pointRad3.getLatitude() )
            pMax.x = pointRad3.getLatitude();
        if ( pMax.x < pointRad4.getLatitude() )
            pMax.x = pointRad4.getLatitude();

        pMax.y = pointRad1.getLongitude();
        if ( pMax.y < pointRad2.getLongitude() )
            pMax.y = pointRad2.getLongitude();
        if ( pMax.y < pointRad3.getLongitude() )
            pMax.y = pointRad3.getLongitude();
        if ( pMax.y < pointRad4.getLongitude() )
            pMax.y = pointRad4.getLongitude();

        // Взять габариты по 8 точкам
        point1.x = (planeFrame.min.x + planeFrame.max.x) / 2.;
        point1.y = planeFrame.min.y;
        point2.x = planeFrame.max.x;
        point2.y = (planeFrame.min.y + planeFrame.max.y) / 2.;
        point3.x = (planeFrame.min.x + planeFrame.max.x) / 2.;
        point3.y = planeFrame.max.y;
        point4.x = planeFrame.min.x;
        point4.y = (planeFrame.min.y + planeFrame.max.y) / 2.;

        // Определить прямоугольные координаты в метрах
        pointRad1 = point1.toGeoPointRad();
        pointRad2 = point2.toGeoPointRad();
        pointRad3 = point3.toGeoPointRad();
        pointRad4 = point4.toGeoPointRad();

        if ( !pointRad1 || !pointRad2 || !pointRad3 || !pointRad4 ) return undefined;

        if ( pMin.x > pointRad1.getLatitude() )
            pMin.x = pointRad1.getLatitude();
        if ( pMin.x > pointRad2.getLatitude() )
            pMin.x = pointRad2.getLatitude();
        if ( pMin.x > pointRad3.getLatitude() )
            pMin.x = pointRad3.getLatitude();
        if ( pMin.x > pointRad4.getLatitude() )
            pMin.x = pointRad4.getLatitude();

        if ( pMin.y > pointRad1.getLongitude() )
            pMin.y = pointRad1.getLongitude();
        if ( pMin.y > pointRad2.getLongitude() )
            pMin.y = pointRad2.getLongitude();
        if ( pMin.y > pointRad3.getLongitude() )
            pMin.y = pointRad3.getLongitude();
        if ( pMin.y > pointRad4.getLongitude() )
            pMin.y = pointRad4.getLongitude();

        if ( pMax.x < pointRad1.getLatitude() )
            pMax.x = pointRad1.getLatitude();
        if ( pMax.x < pointRad2.getLatitude() )
            pMax.x = pointRad2.getLatitude();
        if ( pMax.x < pointRad3.getLatitude() )
            pMax.x = pointRad3.getLatitude();
        if ( pMax.x < pointRad4.getLatitude() )
            pMax.x = pointRad4.getLatitude();

        if ( pMax.y < pointRad1.getLongitude() )
            pMax.y = pointRad1.getLongitude();
        if ( pMax.y < pointRad2.getLongitude() )
            pMax.y = pointRad2.getLongitude();
        if ( pMax.y < pointRad3.getLongitude() )
            pMax.y = pointRad3.getLongitude();
        if ( pMax.y < pointRad4.getLongitude() )
            pMax.y = pointRad4.getLongitude();

        return new GeoBoundsRad( new GeoPointRad( pMin.y, pMin.x, pMin.h, this.ProjectionId ), new GeoPointRad( pMax.y, pMax.x, pMax.h, this.ProjectionId ) );
    }

    /**
     * Запросить номер пикселя в общей системе матрицы
     * @param zoom номер приближения
     * @param point точка в системе матрицы
     * @returns
     */
    getPixelInMatrixByPoint( zoom: number, point: MapPoint ): MatrixPixelPoint {
        const pixelSpan: number = this.getPixelSpan( zoom );

        let valueA, valueB;


        const geoPoint = point.toGeoPoint();
        if ( !this.isGeoSys || !geoPoint ) {
            valueA = point.x;
            valueB = point.y;
        } else {
            valueA = geoPoint.getLatitude();
            valueB = geoPoint.getLongitude();
        }

        const newPoint = new MatrixPixelPoint( valueA, valueB, zoom, point.getProjectionId() );

        if ( pixelSpan !== 0 ) {
            newPoint.x = Math.floor( ((newPoint.x - this.Ogc.getPointX()) / pixelSpan) + this.OgcEpsilon * this.Ogc.getPointMarkX() ) * this.Ogc.getPointMarkX();
            newPoint.y = Math.floor( ((newPoint.y - this.Ogc.getPointY()) / pixelSpan) + this.OgcEpsilon * this.Ogc.getPointMarkY() ) * this.Ogc.getPointMarkY();

            newPoint.x = Math.max( newPoint.x, 0 );
            newPoint.y = Math.max( newPoint.y, 0 );
        }

        return newPoint;
    }

    /**
     * Запросить разрешение элемента
     * при ошибке возвращает 0
     * @param zoom приближение
     * @returns
     */
    getPixelSpan( zoom: number ): number {
        let pixelSpan = this.Ogc.ScaleDenominator[ zoom ] * this.StandardPixelSize;

        if ( this.Ogc.isGeoSys() )
            pixelSpan = pixelSpan / this.MetersPerUnitGrad;

        return pixelSpan;
    }

    /**
     * Запросить координаты точки по номеру пикселя в глобальной матрице
     * @param pixel
     * @param zoom
     * @returns MapPoint координаты точки в системе матрицы
     */
    getPointByPixel( pixel: PixelPoint, zoom: number ): MapPoint {
        // координаты переворачиваем
        const turnPoint = Cartesian2D.swapAxis( pixel, new PixelPoint() );
        const point = new MapPoint( 0, 0, 0, this.ProjectionId );

        const pixelSpan = this.getPixelSpan( zoom );
        if ( pixelSpan !== 0 ) {
            // Область отображения
            point.x = Math.floor( turnPoint.x ) * pixelSpan * this.Ogc.getPointMarkX() + this.Ogc.getPointX();
            point.y = Math.floor( turnPoint.y ) * pixelSpan * this.Ogc.getPointMarkY() + this.Ogc.getPointY();
            this.fitPointToMatrixSystem( point );
        }

        return point;
    }

    /**
     * Запросить ближайший реальный масштаб геопортала
     * @param scale масштаб
     * @returns
     */
    getScale( scale: number ): number {
        if ( scale == 0 )
            return 0;

        const zoom: number = this.getZoom( scale );
        if ( zoom == -1 )
            return 0;

        return this.getScaleByZoom( zoom );
    }

    /**
     * Запросить реальный масштаб геопортала
     * @param zoom приближение
     * @returns
     */
    getScaleByZoom( zoom: number ): number {
        const standardPixSizePanorama = (1000 * 100) / (this.ScreenPrecision * 100);
        return (this.Ogc.ScaleDenominator[ zoom ] * 0.28 / standardPixSizePanorama);
    }

    /**
     * Запросить масштабный коэффициент по размеру пикселя
     * @param pix_size - разрешение пикселя
     * @param isGeo - вывод в градусах
     * @returns
     */
    getScaleDenominatorByPixelSize( pix_size: number, isGeo: number ): number {
        let scaleDenominator = pix_size / this.StandardPixelSize;
        if ( isGeo )
            scaleDenominator *= this.MetersPerUnitGrad;
        return scaleDenominator;
    }

    /**
     * Получить текущий размер матрицы тайлов в карте
     * @method getTileMatrixSize
     * @param zoom масштаб
     * @return
     */
    getTileMatrixSize( zoom: number ): PixelPoint {
        const pixelFrame: Bounds = new Bounds();
        this.getTilePixelByFrame( this.Ogc.NormalFrame, zoom, pixelFrame );
        return new PixelPoint( Math.floor( (pixelFrame.max.x - pixelFrame.min.x) * this.Ogc.getPointMarkX() + 1 ),
            Math.floor( (pixelFrame.max.y - pixelFrame.min.y) * this.Ogc.getPointMarkY() + 1 ) );
    }

    /**
     * Запросить номера пикселей по габаритам
     * @param frame габариты области в метрах или градусах в зависимости от EPSG
     * @param zoom масштаб приближения
     * @param outPixelFrame выходные габариты в пикселях
     * @returns
     */
    getTilePixelByFrame( frame: Bounds, zoom: number, outPixelFrame: Bounds ): void {
        const pixelSpan = this.getPixelSpan( zoom );

        outPixelFrame.min.y = Math.floor( ((frame.min.y - this.Ogc.getPointY()) / pixelSpan) + this.OgcEpsilon * this.Ogc.getPointMarkY() ) * this.Ogc.getPointMarkY();
        outPixelFrame.max.y = Math.floor( ((frame.max.y - this.Ogc.getPointY()) / pixelSpan) + this.OgcEpsilon * this.Ogc.getPointMarkY() ) * this.Ogc.getPointMarkY();
        outPixelFrame.max.x = Math.floor( ((frame.max.x - this.Ogc.getPointX()) / pixelSpan) + this.OgcEpsilon * this.Ogc.getPointMarkX() ) * this.Ogc.getPointMarkX();
        outPixelFrame.min.x = Math.floor( ((frame.min.x - this.Ogc.getPointX()) / pixelSpan) + this.OgcEpsilon * this.Ogc.getPointMarkX() ) * this.Ogc.getPointMarkX();

        if ( outPixelFrame.min.x < 0 )
            outPixelFrame.min.x = 0;
        if ( outPixelFrame.max.x < 0 )
            outPixelFrame.max.x = 0;
        if ( outPixelFrame.min.y < 0 )
            outPixelFrame.min.y = 0;
        if ( outPixelFrame.max.y < 0 )
            outPixelFrame.max.y = 0;
    }

    /**
     * Запросить размер тайла
     * @returns
     */
    getTileSize(): number {
        return this.Ogc.TileSize;
    }

    /**
     * Запросить приближение геопортала
     * @param scale масштаб
     * @returns
     */
    getZoom( scale: number ): number {
        if ( scale == 0 )
            return -1;

        const panoramaScaleDenominator = this.getPanoramaScaleDenominator( scale );

        // определение ближайшего масштабного коэффициента OGC
        let currentMatrixScaleNumber = 0;
        let minDeltaDen = 0;

        let deltaFlag = 0;
        for ( let ii = 0; ii < this.Ogc.ScaleDenominator.length; ii++ ) {
            let deltaDen = this.Ogc.ScaleDenominator[ ii ] - panoramaScaleDenominator;
            if ( deltaDen < 0 ) {
                deltaFlag++;
                deltaDen = deltaDen * -1;
            }
            if ( ii == 0 )
                minDeltaDen = deltaDen;
            if ( deltaFlag > 1 )
                break;
            if ( minDeltaDen >= deltaDen ) {
                minDeltaDen = deltaDen;
                currentMatrixScaleNumber = ii;
            }
        }
        return currentMatrixScaleNumber;
    }

    /**
     * Запросить приближение геопортала
     * @param pixelSpan разрешение в пикселях
     * @returns
     */
    getZoomByPixelSpan( pixelSpan: number ): number {
        // определение ближайшего масштабного коэффициента OGC
        let currentMatrixScaleNumber = 0;
        let minDeltaDen = 0;

        let deltaFlag = 0;
        for ( let ii = 0; ii < this.Ogc.ScaleDenominator.length; ii++ ) {
            let deltaDen = this.getPixelSpan( ii ) - pixelSpan;
            if ( deltaDen < 0 ) {
                deltaFlag++;
                deltaDen = deltaDen * -1;
            }
            if ( ii == 0 )
                minDeltaDen = deltaDen;
            if ( deltaFlag > 1 )
                break;
            if ( minDeltaDen >= deltaDen ) {
                minDeltaDen = deltaDen;
                currentMatrixScaleNumber = ii;
            }
        }

        return currentMatrixScaleNumber;
    }

    /**
     * Посчитать количество тайлов в матрице для определенного приближения
     * @param zoom номер приближения
     * @returns
     */
    globalTileMatrixCount( zoom: number ): PixelPoint {
        const outTileFrame: Bounds = new Bounds();
        this.getTilePixelByFrame( this.Ogc.NormalFrame, zoom, outTileFrame );

        //кол-во тайлов
        return new PixelPoint( Math.floor( (outTileFrame.max.y - outTileFrame.min.y) * this.Ogc.getPointMarkY() / this.getTileSize() ),
            Math.floor( (outTileFrame.max.x - outTileFrame.min.x) * this.Ogc.getPointMarkX() / this.getTileSize() ) );
    }

    /**
     * Запросить размер матрицы тайлов по номеру матрицы (масштабному уровню)
     * @method globalTileMatrixSizePixel
     * @param zoom {Number} номер матрицы тайлов
     * @return {Bounds} размер матрицы тайлов, пикселы
     */
    globalTileMatrixSizePixel( zoom: number ): Bounds | undefined {
        const outTileFrame: Bounds = new Bounds();
        if ( !this.getTileNumberByFrame( this.Ogc.NormalFrame, zoom, outTileFrame ) )
            return undefined;

        return outTileFrame;
    }

    /**
     * Вычислить область пересечения рамок
     * Если рамки не пересекаются, то возвращает 0
     * @param first входные рамки
     * @param second входные рамки
     * @param intersection рамка пересечения
     * @returns
     */
    private static intersectionFrames( first: Bounds, second: Bounds, intersection: Bounds ): number {
        if ( (first.min.x > second.max.x) || (first.min.y > second.max.y) ||
            (first.max.x < second.min.x) || (first.max.y < second.min.y) )
            return 0;

        intersection.min.x = Math.max( first.min.x, second.min.x );
        intersection.max.x = Math.min( first.max.x, second.max.x );
        intersection.min.y = Math.max( first.min.y, second.min.y );
        intersection.max.y = Math.min( first.max.y, second.max.y );
        return 1;
    }

    /**
     * Получить габариты в тайлах по фрейму
     * @param geoFrame габариты в градусах
     * @param scale масштаб
     * @param tileFrame габариты тайлов
     * @param calculateQuad учитывать поправки для GoogleCRS84Quad (влияет на номера тайлов)
     * @param shiftX смещение по х в метрах
     * @param shiftY смещение по y в метрах
     * @returns
     */
    private getRectByFrameAndScale( geoFrame: Bounds, scale: number, tileFrame: TileFrame, calculateQuad: number = 0, shiftX: number = 0, shiftY: number = 0 ): number {
        return this.getRectByFrame( geoFrame, this.getZoom( scale ), tileFrame, calculateQuad, shiftX, shiftY );
    }

    /**
     * Получить габариты в тайлах по фрейму
     * @param geoFrame габариты в градусах
     * @param zoom уровень
     * @param tileFrame габариты тайлов
     * @param calculateQuad учитывать поправки для GoogleCRS84Quad (влияет на номера тайлов)
     * @param shiftX смещение по х в метрах
     * @param shiftY смещение по y в метрах
     * @returns
     */
    private getRectByFrame( geoFrame: Bounds, zoom: number, tileFrame: TileFrame, calculateQuad: number = 0, shiftX: number = 0, shiftY: number = 0 ): number {

        const updateFrame = geoFrame.clone();
        updateFrame.min.x = updateFrame.min.x + shiftX / this.MetersPerUnitGrad;
        updateFrame.min.y = updateFrame.min.y + shiftY / this.MetersPerUnitGrad;
        updateFrame.max.x = updateFrame.max.x + shiftX / this.MetersPerUnitGrad;
        updateFrame.max.y = updateFrame.max.y + shiftY / this.MetersPerUnitGrad;

        tileFrame.GeoFrame.fromBounds( updateFrame );

        if ( this.checkFrameByMatrix( updateFrame ) == 0 )
            return 0;

        if ( !this.Ogc.isGeoSys() ) {
            tileFrame.MetrFrame.fromBounds( updateFrame );
        }

        const earthFrame: Bounds = new Bounds();
        this.getTilePixelByFrame( updateFrame, zoom, earthFrame );

        if ( this.getTileBoundPixelByFrame( earthFrame, tileFrame.PixelFrame ) == 0 )
            return 0;

        if ( this.getTileNumberByFrame( updateFrame, zoom, tileFrame.TileFrame ) == 0 )
            return 0;

        if ( (zoom >= 2) && (calculateQuad != 0) && (this.Ogc.Name == 'GoogleCRS84Quad') ) {
            tileFrame.TileFrame.min.x += Math.floor( Math.pow( 2., zoom - 2 ) );
            tileFrame.TileFrame.max.x += Math.floor( Math.pow( 2., zoom - 2 ) );
        }

        //кол-во тайлов
        tileFrame.TileCountWidth = Math.floor( (tileFrame.TileFrame.max.y - tileFrame.TileFrame.min.y) * this.Ogc.getPointMarkY() ) + 1;
        tileFrame.TileCountHeight = Math.floor( (tileFrame.TileFrame.max.x - tileFrame.TileFrame.min.x) * this.Ogc.getPointMarkX() ) + 1;

        //Размер загружаемого изображения для текущего коэффициента
        tileFrame.Width = Math.floor( (earthFrame.max.y - earthFrame.min.y) * this.Ogc.getPointMarkY() ) + 1;
        tileFrame.Height = Math.floor( (earthFrame.max.x - earthFrame.min.x) * this.Ogc.getPointMarkX() ) + 1;

        return 1;
    }


    /**
     * Запросить номера тайлов по габаритам
     * при ошибке возвращает 0
     * @param frame габариты области в метрах или градусах в зависимости от EPSG в ogc
     * @param zoom масштаб приближения
     * @param outTileFrame выходные габариты в номерах тайлов
     * @returns
     */
    private getTileNumberByFrame( frame: Bounds, zoom: number, outTileFrame: Bounds ): number {
        const pixelFrame: Bounds = new Bounds();
        this.getTilePixelByFrame( frame, zoom, pixelFrame );

        outTileFrame.min.y = Math.floor( pixelFrame.min.y / this.Ogc.TileSize + this.OgcEpsilon );
        outTileFrame.max.x = Math.floor( pixelFrame.max.x / this.Ogc.TileSize + this.OgcEpsilon );
        outTileFrame.max.y = Math.floor( pixelFrame.max.y / this.Ogc.TileSize + this.OgcEpsilon );
        outTileFrame.min.x = Math.floor( pixelFrame.min.x / this.Ogc.TileSize + this.OgcEpsilon );
        return 1;
    }

    /**
     * Получить номера пикселей граничных тайлов, с которых нужно загружать изображение
     * @param pixelFrame номера пикселей в глобальной системе матрицы
     * @param outPixelFrame номера пикселей в размерах тайла
     * @returns
     */
    private getTileBoundPixelByFrame( pixelFrame: Bounds, outPixelFrame: Bounds ): number {

        // номер пикселя с которого надо загружать изображение
        outPixelFrame.min.y = pixelFrame.min.y % this.Ogc.TileSize;
        outPixelFrame.max.y = pixelFrame.max.y % this.Ogc.TileSize;

        outPixelFrame.min.x = pixelFrame.min.x % this.Ogc.TileSize;
        outPixelFrame.max.x = pixelFrame.max.x % this.Ogc.TileSize;

        if ( this.Ogc.getPointMarkX() > 0 ) {
            outPixelFrame.max.x = this.Ogc.TileSize - outPixelFrame.max.x;
            outPixelFrame.min.x = this.Ogc.TileSize - outPixelFrame.min.x;
        }

        if ( this.Ogc.getPointMarkY() < 0 ) {
            outPixelFrame.max.y = this.Ogc.TileSize - outPixelFrame.max.y;
            outPixelFrame.min.y = this.Ogc.TileSize - outPixelFrame.min.y;
        }

        if ( outPixelFrame.min.y < 0 )
            outPixelFrame.min.y = 0;
        if ( outPixelFrame.max.y < 0 )
            outPixelFrame.max.y = 0;
        if ( outPixelFrame.max.y > this.Ogc.TileSize )
            outPixelFrame.max.y = this.Ogc.TileSize;

        if ( outPixelFrame.max.x < 0 )
            outPixelFrame.max.x = 0;
        if ( outPixelFrame.min.x < 0 )
            outPixelFrame.min.x = 0;
        if ( outPixelFrame.min.x > this.Ogc.TileSize )
            outPixelFrame.min.x = this.Ogc.TileSize;
        return 1;
    }


    /**
     * Запросить размер пикселя Панорамы
     * @param scale масштаб
     * @returns
     */
    private getPanoramaScaleDenominator( scale: number ): number {
        // разрешение пикселя в метрах на местности
        const mapPrecisionPix: number = (scale) / (this.ScreenPrecision);
        // стандартный размер пикселя в панораме на экране
        const standardPixSizePanorama: number = (1000 * 100) / (this.ScreenPrecision * 100);
        // Масштабный коэффициент
        const actScaleDenominator: number = mapPrecisionPix / (standardPixSizePanorama / 1000);
        // Множитель стандартизации
        const denMultiplier: number = this.StandardPixelSize / standardPixSizePanorama * 1000;

        // Стандартный Масштабный коэффициент
        return actScaleDenominator / denMultiplier;
    }


    /**
     * Проверить, что габариты не выходят за пределы матрицы
     * возвращает сконвертированные габариты в зависимости от проекции
     * @param geoFrame габариты в градусах
     * @returns
     */
    private checkFrameByMatrix( geoFrame: Bounds ): number {

        const convertFrame: Bounds = new Bounds();

        if ( !this.isGeoSys ) {
            const radFrame = geoFrame.clone();
            radFrame.toRadian();

            const translate = TranslateList.getItem( this.ProjectionId );
            const planeFrameFromGeoFrame = translate && OgcMatrix.getPlaneFrameFromGeoFrame( radFrame, translate );
            if ( !planeFrameFromGeoFrame ) return 0;

            convertFrame.fromBounds( planeFrameFromGeoFrame );
        } else {
            convertFrame.fromBounds( geoFrame );
        }

        this.checkFrameInMatrixSystem( convertFrame );
        geoFrame.fromBounds( convertFrame );
        return 1;
    }

    /**
     * Проверить, что габариты не выходят за пределы матрицы
     * возвращает сконвертированные габариты в зависимости от проекции
     * @param frame габариты в градусах или метрах в зависимости от проекции
     * @returns
     */
    private checkFrameInMatrixSystem( frame: Bounds ) {
        const intersect: Bounds = new Bounds();
        if ( TileMatrix.intersectionFrames( frame, this.Ogc.NormalFrame, intersect ) )
            frame.fromBounds( intersect );
        else
            frame.clear();
    }

    // /**
    //  * Проверить, что габариты не выходят за пределы матрицы
    //  * возвращает сконвертированные габариты градусы или метры
    //  * @param planeFrame габариты в метрах
    //  * @param outFrame сконвертированные габариты
    //  * @param isGeo вывод в градусах
    //  * @returns
    //  */
    // private checkPlaneFrameByMatrix( planeFrame: Bounds, outFrame: Bounds, isGeo: number ): number {
    //
    //     outFrame.fromBounds( planeFrame );
    //     if ( this.isGeoSys ) {
    //         const newFrame = this.getGeoDegreeFrameFromPlaneFrame( outFrame );
    //         if ( !newFrame ) return 0;
    //         outFrame.fromBounds( newFrame );
    //     }
    //
    //     this.checkFrameInMatrixSystem( outFrame );
    //     if ( isGeo == 0 ) {
    //         if ( this.isGeoSys ) {
    //             const newFrame = this.Ogc.getPlaneFrameFromGeoFrame( outFrame, this.ProjectionId );
    //             if ( !newFrame ) return 0;
    //             outFrame.fromBounds( newFrame );
    //             outFrame.toDegree();
    //         }
    //     } else {
    //         if ( !this.isGeoSys ) {
    //             const newFrame = this.getGeoDegreeFrameFromPlaneFrame( outFrame );
    //             if ( !newFrame ) return 0;
    //             outFrame.fromBounds( newFrame );
    //         }
    //     }
    //
    //     return 1;
    // }


    /**
     * Запросить габариты области по тайлам
     * при ошибке возвращает 0
     * @param tileFrame область тайлов
     * @param zoom приближение
     * @param outFrame габариты области
     * @param isVector 1 - расчет до соседнего тайла, 0 - до последнего пикселя
     * @returns
     */
    private getFrameByTileFrame( tileFrame: Bounds, zoom: number, outFrame: Bounds, isVector: number ): number {
        const pixelSpan: number = this.getPixelSpan( zoom );
        if ( pixelSpan == 0 )
            return 0;

        const tileSpanX: number = pixelSpan * this.Ogc.TileSize;
        const tileSpanY: number = pixelSpan * this.Ogc.TileSize;

        let delta = 0.999999;
        if ( isVector )
            delta = 1.0;

        // Область отображения
        outFrame.min.y = (Math.floor( tileFrame.min.y ) * tileSpanY + this.Ogc.getPointY()) * this.Ogc.getPointMarkY();
        outFrame.max.y = ((Math.floor( tileFrame.max.y ) + delta) * tileSpanY + this.Ogc.getPointY()) * this.Ogc.getPointMarkY();
        outFrame.min.x = ((Math.floor( tileFrame.min.x ) + delta) * tileSpanX - this.Ogc.getPointX()) * this.Ogc.getPointMarkX();
        outFrame.max.x = (Math.floor( tileFrame.max.x ) * tileSpanX - this.Ogc.getPointX()) * this.Ogc.getPointMarkX();

        return 1;
    }

    /**
     * Запросить габариты области по номеру тайла
     * @param zoom приближение
     * @param row строка
     * @param col столбец
     * @param frame габариты области
     * @returns {number} `0` - Ошибка
     */
    getFrameByTileNumber( zoom: number, row: number, col: number, frame: Bounds ): number {
        const tileFrame: Bounds = new Bounds();
        tileFrame.min.x = row;
        tileFrame.max.x = row;

        tileFrame.min.y = col;
        tileFrame.max.y = col;

        return this.getFrameByTileFrame( tileFrame, zoom, frame, 1 );
    }

    /**
     * Запросить номер тайла по точке
     * @param zoom приближение
     * @param point точка
     * @returns {TileNumber | undefined}
     */
    getTileNumberByPoint( zoom: number, point: MapPoint ): TileNumber | undefined {
        const tileFrame = new Bounds();
        const frame = new Bounds( point, point );

        if ( this.getTileNumberByFrame( frame, zoom, tileFrame ) === 0 )
            return;

        return { col: tileFrame.min.y, row: tileFrame.min.x, zoom };
    }

    /**
     * Запросить габариты матрицы
     * @param frame габариты области в градусах
     * @returns
     */
    private getWGS84FrameByMatrix( frame: GeoBounds ): number {
        const matrixFrame: Bounds = this.Ogc.NormalFrame.clone();

        if ( !this.Ogc.isGeoSys() ) {
            const newFrame = this.getGeoFrameFromPlaneFrame( matrixFrame );
            if ( !newFrame ) return 0;

            frame.fromBounds( Trigonometry.toDegrees( newFrame ) );
        }

        return 1;
    }

}
