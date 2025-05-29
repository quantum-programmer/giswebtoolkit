/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Рамка в геодезических координатах                 *
 *                                                                  *
 *******************************************************************/

import Geodetic3D from '~/3d/engine/core/geodetic3d';

/**
 * Класс рамки в геодезических координатах
 * @class GeodeticExtent
 * @param west {number|Geodetic3D} Значение долготы левой границы / Юго-западная точка
 * @param south {number|Geodetic3D} Значение широты нижней границы / Северо-восточная точка
 * @param east {number|undefined} Значение долготы правой границы
 * @param north {number|undefined} Значение широты верхней границы
 */
export default class GeodeticExtent {

    private readonly west: number;
    private readonly south: number;
    private readonly east: number;
    private readonly north: number;

    constructor( west: number | Geodetic3D, south: number | Geodetic3D, east?: number, north?: number ) {
        if ( west instanceof Geodetic3D && south instanceof Geodetic3D ) {
            this.north = south.getLatitude();
            this.east = south.getLongitude();
            this.south = west.getLatitude();
            this.west = west.getLongitude();
        } else if ( typeof west === 'number' && typeof south === 'number' &&
            east !== undefined && north !== undefined
        ) {
            this.west = west;
            this.south = south;
            this.east = east;
            this.north = north;
        } else {
            this.west = this.south = this.east = this.north = NaN;
        }
    }

    /**
     * Получить значение долготы левой границы
     * @method getWest
     * @return {number} Значение долготы левой границы
     */
    getWest() {
        return this.west;
    }

    /**
     * Получить значение широты нижней границы
     * @method getSouth
     * @return {number} Значение широты нижней границы
     */
    getSouth() {
        return this.south;
    }

    /**
     * Получить значение долготы правой границы
     * @method getEast
     * @return {number} Значение долготы правой границы
     */
    getEast() {
        return this.east;
    }

    /**
     * Получить значение широты верхней границы
     * @method getNorth
     * @return {number} Значение широты верхней границы
     */
    getNorth() {
        return this.north;
    }
}
