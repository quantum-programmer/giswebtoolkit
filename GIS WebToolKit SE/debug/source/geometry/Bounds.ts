/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Класс Габариты                           *
 *                            GWTK SE                               *
 *                                                                  *
 *******************************************************************/

/*
 * Класс Bounds представляет описание прямоугольной области в пикселах
 */


import { MapPoint } from '~/geometry/MapPoint';
import { Bbox } from '~/utils/GeoJSON';
import BaseMapObjectGeometry from '~/mapobject/geometry/BaseMapObjectGeometry';
import { Vector3D } from '~/3d/engine/core/Types';

export class Bounds {
    readonly min: MapPoint;
    readonly max: MapPoint;

    readonly projectionId: string;

    /*
     * Конструктор
     * @param a {Point} первая точка или массив точек
     * @param b {Point} вторая точка
     */
    constructor( a = new MapPoint(), b?: MapPoint ) {

        this.projectionId = a.getProjectionId();

        const points: MapPoint[] = [a];

        if ( b !== undefined ) {
            points.push( b );
        } else {
            points.push( a );
        }

        this.min = points[ 0 ].clone();
        this.max = points[ 1 ].clone();

        for ( let i = 0, len = points.length; i < len; i++ ) {
            this.extend( points[ i ] );
        }

    }

    /**
     * Очистить параметры
     * @deprecated
     */
    clear() {
        this.min.x = 0;
        this.max.x = 0;
        this.min.y = 0;
        this.max.y = 0;

        this.min.h = 0;
        this.max.h = 0;
    }

    /*
     * Расширить габариты по точке
     * @method extend
     * @param point {Point} точка
     * @returns {Bounds}
     */
    extend( point: MapPoint ) {
        this.min.x = Math.min( point.x, this.min.x );
        this.max.x = Math.max( point.x, this.max.x );
        this.min.y = Math.min( point.y, this.min.y );
        this.max.y = Math.max( point.y, this.max.y );

        this.min.h = Math.max( point.h, this.max.h );
        this.max.h = Math.max( point.h, this.max.h );
    }

    /*
     * Получить центральную точку
     * @method getCenter
     * @param round {boolean} округлить значения
     * @returns {MapPoint} центр
     */
    getCenter( round?: boolean ): MapPoint {
        let center = new MapPoint( (this.min.x + this.max.x) / 2,
            (this.min.y + this.max.y) / 2, (this.min.h + this.max.h) / 2, this.projectionId );
        if ( round ) {
            center.x = +center.x.toPrecision( 6 );
            center.y = +center.y.toPrecision( 6 );
            center.h = +center.h.toPrecision( 6 );
        }
        return center;
    }

    /*
     * Получить размер
     * @method getSize
     * @returns {Point} размер
     */
    getSize() {
        const point = this.max.subtract( this.min );
        point.h = this.max.h - this.min.h;
        return point;
    }

    getRadius() {
        const size = this.getSize();
        return Math.sqrt( size.x * size.x + size.y * size.y + size.h * size.h );
    }

    /*
     * Проверить на вхождение
     * @method contains
     * @returns {boolean} `true`- прямоугольник содержит указанные координаты
     */
    contains( obj: Bounds | MapPoint ) {
        const _bounds = Bounds.toBounds( obj );

        const min = _bounds.min;
        const max = _bounds.max;

        return (min.x >= this.min.x) &&
            (max.x <= this.max.x) &&
            (min.y >= this.min.y) &&
            (max.y <= this.max.y);
    }

    /*
   * Вписать точку в границы (запись в результат или исходную точку)
   * @method fitPoint
   * @param currentPoint {MapPoint} Исходная точка
   * @param [output] {MapPoint} Результат
   */
    fitPoint( currentPoint: MapPoint, output?: MapPoint ): void {

        const mapPoint = output || currentPoint;

        mapPoint.x = Math.max( this.min.x, currentPoint.x );
        mapPoint.y = Math.max( this.min.y, currentPoint.y );
        mapPoint.x = Math.min( this.max.x, currentPoint.x );
        mapPoint.y = Math.min( this.max.y, currentPoint.y );
    }

    /*
     * Проверить пересечение
     * @method intersects
     * @returns {boolean} `true`- пересечение имеется
     */
    intersects( bounds: Bounds | MapPoint ) {
        const _bounds = Bounds.toBounds( bounds );

        const min = this.min,
            max = this.max,
            min2 = _bounds.min,
            max2 = _bounds.max,
            xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
            yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

        return xIntersects && yIntersects;
    }

    /**
     * Скопировать значение
     * @param inbound входные параметры
     */
    fromBounds( inbound: Bounds ) {
        this.min.x = inbound.min.x;
        this.min.y = inbound.min.y;
        this.max.x = inbound.max.x;
        this.max.y = inbound.max.y;
    }

    /**
     * Создать копию
     */
    clone(): Bounds {
        return new Bounds( this.min, this.max );
    }


    /**
     * Преобразовать точку к градусам
     * @deprecated
     */
    toDegree() {
        this.min.x = this.min.x * 180 / Math.PI;
        this.min.y = this.min.y * 180 / Math.PI;
        this.max.x = this.max.x * 180 / Math.PI;
        this.max.y = this.max.y * 180 / Math.PI;
    }

    /**
     * Преобразовать точку к радианам
     * @deprecated
     */
    toRadian() {
        this.min.x = this.min.x * Math.PI / 180;
        this.min.y = this.min.y * Math.PI / 180;
        this.max.x = this.max.x * Math.PI / 180;
        this.max.y = this.max.y * Math.PI / 180;
    }

    /*
     * Преобразовать к Bounds
     * @method toBounds
     * @returns {Bounds}
     */
    static toBounds( a: Bounds | MapPoint, b?: MapPoint ) {
        if ( a instanceof Bounds ) {
            return a;
        }
        return new Bounds( a, b );
    }

    /**
     * Заполнить из BBox
     * @method fromBbox
     */
    fromBBox( value: Bbox, sourceProjectionId: string, targetProjectionId: string ): void {

        const minPointCoordinates: Vector3D = [0, 0, 0];
        const maxPointCoordinates: Vector3D = [0, 0, 0];

        if ( value.length === 4 ) {
            minPointCoordinates[ 0 ] = value[ 0 ];
            minPointCoordinates[ 1 ] = value[ 1 ];

            maxPointCoordinates[ 0 ] = value[ 2 ];
            maxPointCoordinates[ 1 ] = value[ 3 ];

        } else if ( value.length === 6 ) {
            minPointCoordinates[ 0 ] = value[ 0 ];
            minPointCoordinates[ 1 ] = value[ 1 ];
            minPointCoordinates[ 2 ] = value[ 2 ];

            maxPointCoordinates[ 0 ] = value[ 3 ];
            maxPointCoordinates[ 1 ] = value[ 4 ];
            maxPointCoordinates[ 2 ] = value[ 5 ];
        }

        if (
            minPointCoordinates[ 0 ] === 0 &&
            minPointCoordinates[ 1 ] === 0 &&
            minPointCoordinates[ 2 ] === 0 &&
            maxPointCoordinates[ 0 ] === 0 &&
            maxPointCoordinates[ 1 ] === 0 &&
            maxPointCoordinates[ 2 ] === 0
        ) {
            return;
        }

        const minPoint = Bounds.getBBoxPoint( minPointCoordinates, sourceProjectionId, targetProjectionId );
        if ( minPoint ) {
            this.min.x = minPoint.x;
            this.min.y = minPoint.y;
            this.min.h = minPoint.h;
        }

        const maxPoint = Bounds.getBBoxPoint( maxPointCoordinates, sourceProjectionId, targetProjectionId );
        if ( maxPoint ) {
            this.max.x = maxPoint.x;
            this.max.y = maxPoint.y;
            this.max.h = maxPoint.h;
        }
    }

    private static getBBoxPoint( coordinate: Vector3D, sourceProjectionId: string, targetProjectionId: string ) {
        const mapPoint = BaseMapObjectGeometry.parseCoordinate( coordinate, sourceProjectionId );
        if ( mapPoint ) {
            return mapPoint.toMapPoint( targetProjectionId );
        }
    }

    /**
     * Преобразовать в BBox параметр
     * @method toBboxParameter
     * @returns {string} BBox в виде строки
     */
    toString(): string {
        if ( !this.min.Translate ) {
            return '';
        }
        const matrix = this.min.Translate.getTileMatix();
        if ( matrix.isGeoSys ) {
            const geobounds = matrix.getGeoDegreeFrameFromPlaneFrame( this );
            if ( geobounds ) {
                const geobbox = geobounds.toBBox();
                return geobbox.join( ',' );
            }
            return '';
        }
        const bboxPlane = [];
        bboxPlane.push( ...this.min.toOrigin().slice( 0, 2 ) );
        bboxPlane.push( ...this.max.toOrigin().slice( 0, 2 ) );
        return bboxPlane.join( ',' );
    }

}



