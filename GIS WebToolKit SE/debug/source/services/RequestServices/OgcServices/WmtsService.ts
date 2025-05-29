/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *       Выполнение WMTS (OGC Web Map Tile Service)-запросов        *
 *                            GWTK SE                               *
 *******************************************************************/
import RequestService, { HttpParams } from '../common/RequestService';
import {
    GetCapabilitiesWmtsUser,
    GetCapabilitiesWmts,
    GetTileUser,
    GetTile,
    GetFeatureInfoWmts,
    GetFeatureInfoWmtsUser
} from './Types';
import { AxiosRequestConfig } from 'axios';
import BaseService from '~/services/RequestServices/common/BaseService';

/**
 * Класс выполнения OGC-WMTS запросов
 * @class WmtsService
 * @extends BaseService
 */
class WmtsService extends BaseService {

    /**
     * Получить метаданные об имеющихся на сервере слоях(картах)
     * и доступных значениях параметров запросов
     * @method getCapabilities
     * @param [options] {GetCapabilitiesWmtsUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getCapabilities( options?: GetCapabilitiesWmtsUser, httpParams?: AxiosRequestConfig ) {
        const requestParams: GetCapabilitiesWmts = {
            SERVICE: 'WMTS',
            REQUEST: 'GetCapabilities',
            ...options
        };
        const httpOptions = httpParams !== undefined ? { ...this.defaults, ...httpParams } : this.defaults;
        return RequestService.getRequest( httpOptions, requestParams );
    }

    /**
     * Получить рисунок тайла
     * @method getTile
     * @param options {GetTileUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getTile( options: GetTileUser, httpParams?: AxiosRequestConfig ) {
        const requestParams: GetTile = {
            SERVICE: 'WMTS',
            REQUEST: 'GetTile',
            VERSION: '1.0.0',
            ...options
        };
        const localOptions: HttpParams = { ...this.defaults, responseType: 'blob' };
        const httpOptions = httpParams !== undefined ? { ...localOptions, ...httpParams } : localOptions;
        return RequestService.getRequest( httpOptions, requestParams );
    }

    /**
     * Получить информацию о семантических характеристиках объектов
     * карты в заданной точке
     * @method getFeatureInfo
     * @param options {GetFeatureInfoWmtsUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getFeatureInfo( options: GetFeatureInfoWmtsUser, httpParams?: AxiosRequestConfig ) {
        if ( options.TILEMATRIXSET && options.TILEMATRIXSET.indexOf( 'urn:ogc:def:wkss:OGC:1.0:' ) === -1 && options.TILEMATRIXSET.indexOf( ':3395' ) === -1 ) {
            options.TILEMATRIXSET = 'urn:ogc:def:wkss:OGC:1.0:' + options.TILEMATRIXSET;
        }
        const requestParams: GetFeatureInfoWmts = {
            SERVICE: 'WMTS',
            REQUEST: 'GetFeatureInfo',
            VERSION: '1.0.0',
            ...options
        };
        const httpOptions = httpParams !== undefined ? { ...this.defaults, ...httpParams } : this.defaults;
        return RequestService.getRequest( httpOptions, requestParams );
    }

    /**
     * Получить информацию о семантических характеристиках объектов
     * карты в заданной точке в виде xml
     * @method dimentionfeatures
     * @param options {GetFeatureInfoWmtsUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    dimentionfeatures( options: GetFeatureInfoWmtsUser, httpParams?: AxiosRequestConfig ) {
        // список объектов в точке с измерениями и id по WMTS
        if ( !options.FORMAT ) {
            options.FORMAT = '';
        }
        const requestParams: GetFeatureInfoWmtsUser = {
            STYLE: 'default',
            INFO_FORMAT: 'text/xml',
            ...options
        };
        return this.getFeatureInfo( requestParams, httpParams );
    }

    /**
     * Получить рисунок тайла
     * @method tileImage
     * @param options {object} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    tileImage( options: { style: string; min: string[]; max?: string[]; layer: string; matrix: string; zoom: string; format: string; }, httpParams?: AxiosRequestConfig ) {
        if ( options.min == null || options.min.length != 2 ) return;
        const tilereq: GetTileUser = {
            LAYER: options.layer,
            STYLE: options.style || 'default',
            TILEMATRIXSET: options.matrix,
            TILEMATRIX: options.zoom,
            TILEROW: options.min[ 1 ],
            TILECOL: options.min[ 0 ],
            FORMAT: options.format || ''
        };
        return this.getTile( tilereq, httpParams );
    }

    /**
     * Получить коллекцию строк запросов рисунков тайлов
     * @method tileUrl
     * @param options {object} Параметры запроса
     * @return {Promise} Объект запроса
     */
    tileUrl( options: { url?: string; style: string; min: string[]; max?: string[]; layer: string; matrix: string; zoom: string; format: string; } ) {
        const arUrl: string[] = [];
        if ( !options ||
            !Array.isArray( options.min ) || options.min.length != 2 ||
            (Array.isArray( options.max ) && options.max.length === 2 && ((options.min[ 0 ] > options.max[ 0 ]) || (options.min[ 1 ] > options.max[ 1 ]))) ) {
            return arUrl;
        }

        const url = options.url || this.defaults.url;

        const minCol = +options.min[ 0 ];
        const minRow = +options.min[ 1 ];
        let maxCol = minCol;
        let maxRow = minRow;
        if ( (Array.isArray( options.max ) && options.max.length === 2) ) {
            maxCol = +options.max[ 0 ];
            maxRow = +options.max[ 1 ];
        }

        const requestParams: GetTile = {
            SERVICE: 'WMTS',
            REQUEST: 'GetTile',
            VERSION: '1.0.0',
            LAYER: encodeURIComponent( options.layer ),
            STYLE: options.style || 'default',
            FORMAT: options.format || '',
            TILEMATRIXSET: encodeURIComponent( options.matrix ),
            TILEMATRIX: options.zoom,
            TILECOL: options.min[ 0 ],
            TILEROW: options.min[ 1 ]

        };

        const params: string[] = [];

        for ( let row = minRow; row <= maxRow; row++ ) {
            for ( let col = minCol; col <= maxCol; col++ ) {
                requestParams.TILEROW = row.toString();
                requestParams.TILECOL = col.toString();

                for ( const key in requestParams ) {
                    params.push( `${key}=${(requestParams as any)[ key ]}` );
                }
                arUrl.push( url + '?' + params.join( '&' ) );
                params.length = 0;
            }
        }

        return arUrl;
    }
}

export default WmtsService;
