/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Слой WMS тайлов                          *
 *                                                                  *
 *******************************************************************/
import { TileLayer } from '~/maplayers/TileLayer';
import { LAYERTYPENAME } from '~/types/Types';
import Utils from '~/services/Utils';
import PixelPoint from '~/geometry/PixelPoint';
import TileCoord from '~/geometry/TileCoord';
import { Bounds } from '~/geometry/Bounds';

export class TileLayerWms extends TileLayer {

    /**
     * Признак слоя Wms тайлов
     * @private
     * @property tiledWms {boolean}
     */
    private tiledWms: boolean = false;

    /**
     * Список слоев
     * @private
     * @property layers {string}, параметр из url слоя
     */
    private layers = '';

    /**
     * Инициализировать
     * @method init
     * @private
     */
    init() {
        super.init();
        const type = this.options.pkkmap || this.options.tilewms;
        if ( !type ) {
            return;
        }

        let tilesize = new PixelPoint( 1024, 1024 );
        const params = Utils.getParamsFromURL( this.options.url );
        if ( params.height && params.width ) {
            tilesize.x = parseInt( params.width );
            tilesize.y = parseInt( params.height );
        }
        this.tileSize = tilesize;
        this.getTileCount();
        this.tiledWms = true;
    }

    getType() {
        return LAYERTYPENAME.tile;
    }

    /**
     * Установить параметры слоя
     * @method setOptions
     * @protected
     */
    protected setOptions() {
        super.setOptions();
        if ( !this.tiledWms ) {
            return;
        }

        if ( this.tileSize.x === 1024 && !this.options[ 'tilematrixset' ] ) {
            this.options[ 'tilematrixset' ] = 'EPSG:3857';
        }
        const param = Utils.getParamsFromURL( this.options.url );
        this.layers = param[ 'layers' ];                                // ids слоев Росреестра
        this.idLayer = '';                                              // id giswebservicese
        if ( param.srs && param.srs == 'EPSG:900913' ) {
            this.options[ 'tilematrixset' ] = 'GoogleMapsCompatible';
        }
    }

    /**
     * Получить ссылку для тайла по значению строки, столбца и масштаба
     * @method getTileUrl
     * @private
     * @param coords {TileCoord} координаты тайла, x-номер строки, y-номер столбца, z - zoom
     * @returns {string} строка запроса рисунка тайла
     */
    getTileUrl( coords: TileCoord ) {
        const bounds = this.layerBounds;
        if ( bounds.colls !== undefined ) {
            if ( coords.y < bounds.rows[ 0 ] || coords.y > bounds.rows[ 1 ] ||
                coords.x < bounds.colls[ 0 ] || coords.x > bounds.colls[ 1 ] ) {
                return this.errorImage;
            }
        } else if ( coords.y < 0 || coords.y >= this.rowsTotal ) {
            return this.errorImage;
        }

        if ( !this.visible || !this.checkViewZoom( coords.z ) ) {
            return this.errorImage;
        }

        if ( this.isTmsLayer ) {
            coords.y = this.tmsRow( { 'row': coords.y, 'z': coords.z } );
        }

        return this.serverUrl.replace( /%bbox/, this.getTileBBoxParameter( coords ) );
    }

    /**
     * Преобразовать координаты тайла в матрице в габариты
     * @method tileCoordsToSouthEastNorthWest
     * @private
     * @param coords {TileCoord} координаты, x-номер строки, y-номер столбца, z - zoom
     * @return {Bounds} Габариты тайла (se, nw), метры
     */
    private tileCoordsToSouthEastNorthWest( coords: TileCoord ): string[] {
        const neMatrixPixel = coords.multiply( this.tileSize );
        const swMatrixPixel = neMatrixPixel.add( this.tileSize );
        const matrix = this.map.Translate.getTileMatix();
        const ne = matrix.getPointByPixel( neMatrixPixel, coords.z ).toOrigin();
        const sw = matrix.getPointByPixel( swMatrixPixel, coords.z ).toOrigin();

        return [ne[ 0 ], sw[ 1 ], sw[ 0 ], ne[ 1 ]].map( item => item.toFixed( 9 ) );
    }

    /**
     * Получить параметр bbox
     * @method getTileBBoxParameter
     * @private
     * @param coords {TileCoord} координаты тайла, x-номер строки, y-номер столбца, z - zoom
     * @return {string} bbox, строка координат
     */
    private getTileBBoxParameter( coords: TileCoord ): string {
        const bounds = this.tileCoordsToSouthEastNorthWest( coords );
        return bounds.toString();
    }

}
