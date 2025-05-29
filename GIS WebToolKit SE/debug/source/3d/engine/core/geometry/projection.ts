/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Преобразования координат точки                   *
 *                                                                  *
 *******************************************************************/

import { Vector2D, Vector3D, Vector4D } from '~/3d/engine/core/Types';
import Ellipsoid, { EllipsoidCollection } from '~/3d/engine/core/geometry/ellipsoid';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import Trigonometry from '~/3d/engine/core/trigonometry';
import TileIdentifier from '~/3d/engine/scene/terrain/tileidentifier';
import { SimpleJson } from '~/types/CommonTypes';
import { vec3 } from '~/3d/engine/utils/glmatrix';
import GeoPointRad from '~/geo/GeoPointRad';

type Description = {
    tilematrixset: string;
    crs: number;
    scales: number[];
    max_latitude?: number;
    topleft: Point2D;
    tileWidth?: number;
    tileHeight?: number;
}

export type Point2D = {
    x: number;
    y: number;
}
// type Point3D = {
//     x: number;
//     y: number;
//     h: number;
// }

type TileOffsetParams = {
    absDeltaY: number;
    absDeltaX: number;
    row: number;
    col: number;
    relativeDeltaY: number;
    relativeDeltaX: number;
}


export enum CrsType {
    EPSG_3857 = 3857,
    EPSG_3395 = 3395,
    EPSG_54003 = 54003,
    EPSG_4326 = 4326,
    // LOCAL = -1,
    GEOCENTRIC = 99999999
}

export const SCREEN_PIXEL_SIZE = 0.00028;
// 0.0254 / 96 = 0.000264583 - в 1 дюйме 96 css пикселей
// 0.00028     - в 2D standardPixelSize

/**
 * Класс проекции
 * @class Projection
 * @constructor Projection
 * @param description Параметры проекции
 * @param ellipsoid Эллипсоид
 */
export abstract class Projection {
    mMemory: {
        colCount: { [ key: number ]: number };
        rowCount: { [ key: number ]: number };
    } = { colCount: {}, rowCount: {} };

    protected readonly globeShape: Ellipsoid;
    protected readonly tilematrixset: string;
    protected readonly crs: number;
    protected readonly scales: number[];
    protected readonly max_latitude: number;
    protected readonly topleft: Point2D;
    protected readonly tileWidth: number;
    protected readonly tileHeight: number;
    protected readonly colK: number;
    protected readonly rowK: number;
    protected readonly minTileLevel: number;


    constructor( description: Description, ellipsoid: Ellipsoid ) {
        this.globeShape = ellipsoid;

        this.tilematrixset = description.tilematrixset;
        this.crs = description.crs;
        this.scales = description.scales;
        this.max_latitude = Trigonometry.toRadians( description.max_latitude || 90 );
        this.topleft = description.topleft;
        this.tileWidth = description.tileWidth || 256;
        this.tileHeight = description.tileHeight || 256;

        this.colK = Math.log( this.tileWidth / 256 ) / Math.LN2;
        this.rowK = Math.log( this.tileHeight / 256 ) / Math.LN2;
        this.minTileLevel = Math.max( this.colK, this.rowK );
    }

    /**
     * Получить количество точек на сторону высотного тайла
     * @method getPointsBySide
     * @public
     * @param level {number} Уровень масштаба
     * @return {number} Количество точек на сторону высотного тайла
     */
    getPointsBySide( level: number ) {
        if ( level < 0 )
            return;
        let pointsBySide;
        if ( level === 0 ) {
            pointsBySide = 64 * Math.pow( 2, this.colK );
        } else if ( level === 1 ) {
            pointsBySide = 32 * Math.pow( 2, this.colK );
        } else {
            pointsBySide = 16 * Math.pow( 2, this.colK );
        }
        if ( pointsBySide % 2 === 0 ) {
            pointsBySide += 1;
        }
        return pointsBySide;
    }

    // /**
    //  * Получить коэффициент высоты тайлы
    //  * @method getTileHeightRatio
    //  * @public
    //  * @return {number} Значение коэффициента высоты тайлы
    //  */
    // getTileHeightRatio() {
    //     return this.rowK;//TODO: не используется, сделать для неквадратных тайлов
    // }
    // /**
    //  * Получить коэффициент ширины тайлы
    //  * @method getTileWidthRatio
    //  * @public
    //  * @return {number} Значение коэффициента ширины тайлы
    //  */
    // getTileWidthRatio() {
    //     return this.colK;//TODO: не используется, сделать для неквадратных тайлов
    // }


    /**
     * Получить минимальный уровень тайловой пирамиды
     * @method getMinimumTileLevel
     * @public
     * @return {number} Минимальный уровень тайловой пирамиды
     */
    getMinimumTileLevel() {
        return this.minTileLevel;
    }

    /**
     * Получить масштаб по уровню пирамиды
     * @method getScaleByLevel
     * @public
     * @param level {number} Уровень пирамиды тайлов
     * @return {number} Масштабов для уровня пирамиды тайлов
     */
    getScaleByLevel( level: number ): number | undefined {
        return this.scales[ level ];
    }

    /**
     * Получить название проекции
     * @method getTilematrixset
     * @public
     * @return {string} Название проекции
     */
    getTilematrixset() {
        return this.tilematrixset;
    }

    /**
     * Получить код CRS
     * @method getCRS
     * @public
     * @return {number} Код CRS
     */
    getCRS() {
        return this.crs;
    }

    /**
     * Получить максимальное значение широты
     * @method getMaxLatitude
     * @public
     * @return {number} Максимальное значение широты
     */
    getMaxLatitude() {
        return this.max_latitude;
    }

    /**
     * Получить координаты крайней верхней левой точки проекции
     * @method getTopLeft
     * @public
     * @return {object} Координаты крайней верхней левой точки проекции {y,x}
     */
    getTopLeft() {
        return this.topleft;
    }

    /**
     * Получить эллипсоид
     * @method getGlobeShape
     * @public
     * @return Эллипсоид
     */
    getGlobeShape() {
        return this.globeShape;
    }

    /**
     * Получить ширину тайла в пикселах
     * @method getTileWidth
     * @public
     * @return {number} Ширина тайла в пикселах
     */
    getTileWidth() {
        return this.tileWidth;
    }

    /**
     * Получить высоту тайла в пикселах
     * @method getTileHeight
     * @public
     * @return {number} Высота тайла в пикселах
     */
    getTileHeight() {
        return this.tileHeight;
    }

    /**
     * Получить ширину тайла в метрах
     * @method getTileWidthMtr
     * @public
     * @param level {number} Уровень пирамиды тайлов
     * @return {number} Ширина тайла в метрах для уровня пирамиды тайлов
     */
    getTileWidthMtr( level: number ) {
        const borderWidth = 2 * Math.abs( this.topleft.x );
        const colCount = this.getColCount( level );
        if ( colCount === 0 ) {
            return 0;
        }
        return borderWidth / this.getColCount( level );
    }

    /**
     * Получить уровень пирамиды по расстоянию между двумя точками в метрах
     * @method getLevelByDeltaMtr
     * @public
     * @param deltaMtr {number} Расстояние между двумя точками в метрах
     * @return {number} Уровень пирамиды для ширины тайла в метрах
     */
    getLevelByDeltaMtr( deltaMtr: number ) {
        if ( deltaMtr <= 0 )
            return;

        const borderWidth = 2 * Math.abs( this.topleft.x );
        const colCount = borderWidth / (deltaMtr * this.getPointsBySide( 15 )!);
        return Math.floor( Math.log( colCount ) / Math.LN2 + this.colK );

    }

    /**
     * Получить высоту тайла в метрах
     * @method getTileHeightMtr
     * @public
     * @param level {number} Уровень пирамиды тайлов
     * @return {number} Высота тайла в метрах для уровня пирамиды тайлов
     */
    getTileHeightMtr( level: number ) {
        const borderHeight = 2 * Math.abs( this.topleft.y );
        const rowCount = this.getRowCount( level );
        if ( rowCount === 0 ) {
            return 0;
        }
        return borderHeight / this.getRowCount( level );
    }

    /**
     * Получить количество столбцов
     * @method getColCount
     * @public
     * @param level {number} Уровень пирамиды тайлов
     * @return {number} Количество столбцов для уровня пирамиды тайлов
     */
    getColCount( level: number ) {
        if ( level < 0 )
            return 0;
        let colCount = this.mMemory.colCount[ level ];
        if ( colCount === undefined ) {
            colCount = this.mMemory.colCount[ level ] = Math.pow( 2, level - this.colK );
        }
        return colCount;
    }

    /**
     * Получить количество строк
     * @method getRowCount
     * @public
     * @param level {number} Уровень пирамиды тайлов
     * @return {number} Количество строк для уровня пирамиды тайлов
     */
    getRowCount( level: number ) {
        if ( level < 0 )
            return 0;
        let rowCount = this.mMemory.rowCount[ level ];
        if ( rowCount === undefined ) {
            rowCount = this.mMemory.rowCount[ level ] = Math.pow( 2, level - this.rowK );
        }
        return rowCount;
    }

    /**
     * Преобразовать геодезические координаты точки в прямоугольные
     * @method geo2xy
     * @param point {Geodetic3D} Геодезические координаты точки
     * @return {array} Прямоугольные координаты точки
     */
    abstract geo2xy( point: GeoPointRad | Geodetic3D ): Vector3D;

    /**
     * Получить прямоугольные координаты центра тайла по его идентификатору
     * @method getCenterByIdentifier
     * @param identifier {TileIdentifier} Идентификатор тайла
     * @param [out] {array} Результат
     * @return {array} Прямоугольные координаты центра тайла
     */
    getCenterByIdentifier( identifier: TileIdentifier, out: Vector2D = [0, 0] ) {
        const col = identifier.getX();
        const row = identifier.getY();
        const level = identifier.getLevel();

        const centerYX: Vector2D = out;

        const tileWidthMtr = this.getTileWidthMtr( level );
        const tileHeightMtr = this.getTileHeightMtr( level );

        centerYX[ 0 ] = this.topleft.x - row * tileHeightMtr - 0.5 * tileHeightMtr;
        centerYX[ 1 ] = col * tileWidthMtr + this.topleft.y + 0.5 * tileWidthMtr;

        return centerYX;
    }

    /**
     * Получить идентификатор тайла по его идентификатору дочернего тайла
     * @method getParentByIdentifier
     * @param identifier {TileIdentifier} Идентификатор дочернего тайла
     * @return {TileIdentifier} Идентификатор тайла
     */
    getParentByIdentifier( identifier: TileIdentifier ) {
        const col = identifier.getX();
        const row = identifier.getY();
        const level = identifier.getLevel();

        if ( level <= 0 || col < 0 || row < 0 )
            return;
        const x = Math.floor( col / 2 );
        const y = Math.floor( row / 2 );

        return new TileIdentifier( level - 1, x, y );
    }

    /**
     * Получить идентификаторы дочерних тайлов по его идентификатору
     * @method getChildrenByIdentifier
     * @param identifier {TileIdentifier} Идентификатор тайла
     * @return {array} Массив идентификаторов дочерних тайлов
     */
    getChildrenByIdentifier( identifier: TileIdentifier ) {
        const col = identifier.getX();
        const row = identifier.getY();
        const level = identifier.getLevel();

        if ( level < 0 || col < 0 || row < 0 )
            return [];

        const nextLevel = level + 1;
        const minCol = 2 * col;
        const minRow = 2 * row;

        return [
            new TileIdentifier( nextLevel, minCol, minRow ),
            new TileIdentifier( nextLevel, minCol + 1, minRow ),
            new TileIdentifier( nextLevel, minCol, minRow + 1 ),
            new TileIdentifier( nextLevel, minCol + 1, minRow + 1 )
        ];
    }

    /**
     * Получить границы тайла в метрах на плоскости
     * @method getTileBbox
     * @param identifier {TileIdentifier} Идентификатор тайла
     * @param [out] {array} Результат
     * @return {array} Границы тайла в метрах на плоскости
     */
    getTileBbox( identifier: TileIdentifier, out?: Vector4D ) {
        const col = identifier.getX();
        const row = identifier.getY();
        const level = identifier.getLevel();

        if ( level < 0 || col < 0 || row < 0 )
            return;

        const bbox = out || [];
        const tileWidthMtr = this.getTileWidthMtr( level )!;
        const tileHeightMtr = this.getTileHeightMtr( level )!;

        bbox[ 0 ] = col * tileWidthMtr + this.topleft.y;
        bbox[ 1 ] = this.topleft.x - (row + 1) * tileHeightMtr;
        bbox[ 2 ] = (col + 1) * tileWidthMtr + this.topleft.y;
        bbox[ 3 ] = this.topleft.x - row * tileHeightMtr;


        bbox[ 0 ] = Math.max( this.topleft.y, bbox[ 0 ] );
        bbox[ 1 ] = Math.max( -this.topleft.x, bbox[ 1 ] );

        bbox[ 2 ] = Math.min( -this.topleft.y, bbox[ 2 ] );
        bbox[ 3 ] = Math.min( this.topleft.x, bbox[ 3 ] );


        return bbox;
    }

    /**
     * Преобразовать прямоугольные координаты точки в геодезические
     * @method xy2geo
     * @param y {Number} значение координаты y
     * @param x {Number} значение координаты x
     * @param [h] {Number} значение высоты
     * @return {Geodetic3D} Геодезические координаты точки
     */
    abstract xy2geo( y: number, x: number, h?: number ): Geodetic3D;

    /**
     * Преобразовать прямоугольные координаты точки в номер тайла
     * @method xy2tile
     * @param y {Number} значение координаты y
     * @param x {Number} значение координаты x
     * @param level {number} Уровень пирамиды тайлов
     * @return {TileIdentifier} Идентификатор тайла
     */
    xy2tile( y: number, x: number, level: number ) {

        if ( level < 0 )
            return;

        const tileWidthMtr = this.getTileWidthMtr( level )!;
        const tileHeightMtr = this.getTileHeightMtr( level )!;

        const col = (x - this.topleft.y) / tileWidthMtr;
        const row = (this.topleft.x - y) / tileHeightMtr;

        return new TileIdentifier( level, Math.floor( col ), Math.floor( row ) );
    }

    // /**
    //  *Преобразовать границы объекта в идентификатор тайла в который полностью входит объект
    //  * @param bbox {array} Границы объекта
    //  * @return {TileIdentifier} Идентификатор тайла
    //  */
    // bbox2tile(bbox) {
    //     const maxLevel = this.scales.length - 1;
    //     const result = new TileIdentifier(0, 0, 0);
    //     for (const tileNum = maxLevel; tileNum >= 0; tileNum--) {
    //         const identTile = this.projection.xy2tile(bbox[1], bbox[0], tileNum);
    //         const bboxTile = this.projection.getTileBbox(identTile);
    //
    //         if (bbox[2] <= bboxTile[2] && bbox[3] <= bboxTile[3]) {
    //             result = identTile;
    //             break;
    //         }
    //     }
    //     return result;
    // },


    /**
     * Преобразовать прямоугольные координаты точки в тайловые пиксели
     * @method xy2pixels
     * @param y {Number} значение координаты y
     * @param x {Number} значение координаты x
     * @return {array} Массив тайловых пикселей
     */
    xy2pixels( y: number, x: number ) {
        const result: TileOffsetParams[] = [];
        const dY = 0.5 * (this.topleft.x - y) / Math.abs( this.topleft.x );
        const dX = 0.5 * (x - this.topleft.y) / Math.abs( this.topleft.y );

        let levelWidth = this.tileWidth / 2;
        let levelHeight = this.tileHeight / 2;
        for ( let i = 0; i <= 22; i++ ) {
            levelWidth = levelWidth * 2;
            levelHeight = levelHeight * 2;

            const pixY = Math.round( levelHeight * dY );
            const pixX = Math.round( levelWidth * dX );

            const row = Math.floor( pixY / this.tileHeight );
            const col = Math.floor( pixX / this.tileWidth );

            const dPixY = pixY - this.tileHeight * row;
            const dPixX = pixX - this.tileWidth * col;


            result[ i ] = {
                absDeltaY: pixY,
                absDeltaX: pixX,
                row: row,
                col: col,
                relativeDeltaY: dPixY,
                relativeDeltaX: dPixX
            };
        }

        return result;
    }
}

class Projection3857 extends Projection {
    private readonly MAX_LATITUDE = 89.5 * Math.PI / 180;

    geo2xy( point: Geodetic3D ) {

        let lat = point.getLatitude();
        if ( lat > this.MAX_LATITUDE ) {
            lat = this.MAX_LATITUDE;
        } else if ( lat < -this.MAX_LATITUDE ) {
            lat = -this.MAX_LATITUDE;
        }
        const lng = point.getLongitude();
        const radii = this.globeShape.getRadius();
        const bigAxis = radii[ 0 ];
        const y = bigAxis * lng;
        let x = bigAxis * Math.log( Math.tan( Math.PI / 4 + lat / 2 ) );

        if ( x > this.topleft.x ) {
            x = this.topleft.x;
        } else if ( x < -this.topleft.x ) {
            x = -this.topleft.x;
        }

        return vec3.setValues( vec3.create(), x, y, point.getHeight() );
    }

    xy2geo( y: number, x: number, h: number = 0 ) {
        const radii = this.globeShape.getRadius();
        const bigAxis = radii[ 0 ];
        const temp = -y / bigAxis;
        const lat = Math.PI / 2.0 - 2.0 * Math.atan( Math.exp( temp ) );
        const lng = x / bigAxis;
        return new Geodetic3D( lng, lat, h );
    }
}

class Projection3395 extends Projection {
    private readonly MAX_LATITUDE = 89.3 * Math.PI / 180;
    private readonly _epsilon = 1e-10;
    private readonly va: number;
    private readonly vb: number;
    private readonly vc: number;
    private readonly vd: number;

    constructor( description: Description, ellipsoid: Ellipsoid ) {
        super( description, ellipsoid );

        const Alfa = this.globeShape.getFlattening();

        const E2 = 2.0 * Alfa - Alfa * Alfa;
        const E4 = E2 * E2;
        const E6 = E4 * E2;
        const E8 = E6 * E2;
        this.va = E2 / 2.0 + E4 * 5.0 / 24.0 + E8 * 13.0 / 360.0;
        this.vb = E4 * 7.0 / 48.0 + E6 * 290.0 / 240.0 + E8 * 811.0 / 11520.0;
        this.vc = E6 * 7.0 / 120.0 + E8 * 81.0 / 1120.0;
        this.vd = E8 * 4279.0 / 161280.0;
    }

    geo2xy( point: Geodetic3D ) {

        let lat = point.getLatitude();
        if ( lat > this.MAX_LATITUDE ) {
            lat = this.MAX_LATITUDE;
        } else if ( lat < -this.MAX_LATITUDE ) {
            lat = -this.MAX_LATITUDE;
        }
        const lng = point.getLongitude();
        const radii = this.globeShape.getRadius();
        const bigAxis = radii[ 0 ];
        const y = bigAxis * lng;

        const sinPhi = Math.sin( lat );
        const eccentricity = this.globeShape.getEccentricity();
        const con = Math.pow( Math.tan( Math.PI / 4 + Math.asin( eccentricity * sinPhi ) / 2 ), eccentricity );

        const v = Math.tan( 0.5 * (Math.PI * 0.5 + lat) ) || this._epsilon;
        const ts = v / con;

        const x = bigAxis * Math.log( ts );
        return vec3.setValues( vec3.create(), x, y, point.getHeight() );
    }

    xy2geo( y: number, x: number, h: number = 0 ) {
        const radii = this.globeShape.getRadius();
        const bigAxis = radii[ 0 ];

        const ksi = Math.PI / 2.0 - 2 * Math.atan( Math.exp( -y / bigAxis ) );
        const lat = ksi + this.va * Math.sin( 2.0 * ksi ) + this.vb * Math.sin( 4.0 * ksi ) + this.vc * Math.sin( 6.0 * ksi ) + this.vd * Math.sin( 8.0 * ksi );
        const lng = x / bigAxis;
        return new Geodetic3D( lng, lat, h );
    }
}

class Projection4326 extends Projection {
    geo2xy( point: Geodetic3D ) {

        const lat = point.getLatitude();
        const lng = point.getLongitude();
        const radii = this.globeShape.getRadius();
        const y = radii[ 0 ] * lng;
        const x = radii[ 0 ] * lat;

        return vec3.setValues( vec3.create(), x, y, point.getHeight() );
    }

    xy2geo( y: number, x: number, h: number = 0 ) {
        const radii = this.globeShape.getRadius();
        const lat = y / radii[ 1 ];
        const lng = x / radii[ 0 ];
        return new Geodetic3D( lng, lat, h );
    }

}

class Projection54003 extends Projection {
    private readonly MAX_LATITUDE = Math.PI / 2;

    geo2xy( point: Geodetic3D ) {

        let lat = point.getLatitude();
        if ( lat > this.MAX_LATITUDE ) {
            lat = this.MAX_LATITUDE;
        } else if ( lat < -this.MAX_LATITUDE ) {
            lat = -this.MAX_LATITUDE;
        }
        const lng = point.getLongitude();
        const radii = this.globeShape.getRadius();
        const bigAxisMiddle = (radii[ 0 ] + radii[ 2 ]) * 0.5;
        const y = bigAxisMiddle * lng;
        let temp = Math.tan( Math.PI / 4.0 + 0.4 * lat );
        if ( temp < 0.000001 )
            temp = 0.000001;
        const x = 1.25 * bigAxisMiddle * Math.log( temp );

        return vec3.setValues( vec3.create(), x, y, point.getHeight() );
    }

    xy2geo( y: number, x: number, h: number = 0 ) {
        const radii = this.globeShape.getRadius();
        const bigAxisMiddle = (radii[ 0 ] + radii[ 2 ]) * 0.5;
        const lng = x / bigAxisMiddle;
        let lat = Math.exp( 0.8 * y / bigAxisMiddle );
        lat = 2.5 * Math.atan( lat ) - 0.625 * Math.PI;
        return new Geodetic3D( lng, lat, h );
    }
}

export const ProjectionCollection: SimpleJson<Projection> = Object.freeze( {
    'GoogleMapsCompatible': new Projection3857( {
        'tilematrixset': 'GoogleMapsCompatible',
        'crs': CrsType.EPSG_3857,
        'max_latitude': 85.0511287798,
        'topleft': { 'y': -20037508.34279000, 'x': 20037508.34279000 },
        'scales': [559082264.0287178, 279541132.0143589, 139770566.0071794, 69885283.00358972, 34942641.50179486,
            17471320.75089743, 8735660.375448715, 4367830.187724357, 2183915.093862179, 1091957.546931089,
            545978.7734655447, 272989.3867327723, 136494.6933663862, 68247.34668319309, 34123.67334159654,
            17061.83667079827, 8530.918335399136, 4265.459167699568, 2132.729583849784, 1066.364791924891,
            533.1823959624459, 266.5911979812229, 133.29559899061147]
    }, EllipsoidCollection.WGS84_SPHERICAL ),
    'EPSG:3857': new Projection3857( {
        'tilematrixset': 'EPSG:3857',
        'crs': CrsType.EPSG_3857,
        'max_latitude': 85.0511287798,
        'topleft': { 'y': -20037508.34279000, 'x': 20037508.34279000 },
        'tileWidth': 1024,
        'tileHeight': 1024,
        'scales': [559082264.0287178, 279541132.0143589, 139770566.0071794, 69885283.00358972, 34942641.50179486,
            17471320.75089743, 8735660.375448715, 4367830.187724357, 2183915.093862179, 1091957.546931089,
            545978.7734655447, 272989.3867327723, 136494.6933663862, 68247.34668319309, 34123.67334159654,
            17061.83667079827, 8530.918335399136, 4265.459167699568, 2132.729583849784, 1066.364791924891,
            533.1823959624459, 266.5911979812229, 133.29559899061147]
    }, EllipsoidCollection.WGS84_SPHERICAL ),

    'EPSG:3395': new Projection3395( {
        'tilematrixset': 'EPSG:3395',
        'crs': CrsType.EPSG_3395,
        'max_latitude': 85.0840591556,
        'topleft': { 'y': -20037508.34279000, 'x': 20037508.34279000 },
        'scales': [559082264.0287178, 279541132.0143589, 139770566.0071794, 69885283.00358972, 34942641.50179486,
            17471320.75089743, 8735660.375448715, 4367830.187724357, 2183915.093862179, 1091957.546931089,
            545978.7734655447, 272989.3867327723, 136494.6933663862, 68247.34668319309, 34123.67334159654,
            17061.83667079827, 8530.918335399136, 4265.459167699568, 2132.729583849784, 1066.364791924891,
            533.1823959624459, 266.5911979812229, 133.29559899061147]
    }, EllipsoidCollection.WGS84 ),
    MILLER: new Projection54003( {
        'tilematrixset': 'MILLER',
        'crs': CrsType.EPSG_54003,
        'max_latitude': 90,
        'topleft': { 'y': -20003917.3569559, 'x': 14666851.8924712 },
        'scales': [559082264.0287178, 279541132.0143589, 139770566.0071794, 69885283.00358972, 34942641.50179486,
            17471320.75089743, 8735660.375448715, 4367830.187724357, 2183915.093862179, 1091957.546931089,
            545978.7734655447, 272989.3867327723, 136494.6933663862, 68247.34668319309, 34123.67334159654,
            17061.83667079827, 8530.918335399136, 4265.459167699568, 2132.729583849784, 1066.364791924891,
            533.1823959624459, 266.5911979812229, 133.29559899061147]
    }, EllipsoidCollection.WGS84 ),
    GlobalCRS84Scale: new Projection4326( {
        'tilematrixset': 'GoogleMapsCompatible',
        'crs': CrsType.EPSG_4326,
        'max_latitude': 90,
        'topleft': { 'y': -180, 'x': 90 },
        'scales': [500000000, 250000000, 100000000, 50000000, 25000000, 10000000, 5000000, 2500000, 1000000, 500000,
            250000, 100000, 50000, 25000, 10000, 5000, 2500, 1000, 500]
    }, EllipsoidCollection.WGS84 )
} );
