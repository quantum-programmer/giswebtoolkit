/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *        Выполнение WCS (OGC Web Coverage Service)-запросов        *
 *                            GWTK SE                               *
 *******************************************************************/
import RequestService from '../common/RequestService';
import { AxiosRequestConfig } from 'axios';
import {
    DescribeCoverage,
    DescribeCoverageUser,
    GetCapabilitiesWcs,
    GetCapabilitiesWcsUser,
    GetCoverage,
    GetCoverageUser
} from './Types';
import BaseService from '~/services/RequestServices/common/BaseService';

/**
 * Класс выполнения OGC-WCS запросов
 * @class WcsService
 * @extends BaseService
 */
class WcsService extends BaseService {

    /**
     * Получить метаданные об имеющихся на сервере слоях(картах)
     * и доступных значениях параметров запросов
     * @method getCapabilities
     * @param [options] {GetCapabilitiesWcsUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getCapabilities( options?: GetCapabilitiesWcsUser, httpParams?: AxiosRequestConfig ) {
        const requestParams: GetCapabilitiesWcs = {
            SERVICE: 'WCS',
            REQUEST: 'GetCapabilities',
            ...options
        };
        const httpOptions = httpParams !== undefined ? { ...this.defaults, ...httpParams } : this.defaults;
        return RequestService.getRequest( httpOptions, requestParams );
    }

    /**
     * Получить метаданные полного описания по одной или нескольким
     * моделям местности
     * @method describeCoverage
     * @param options {DescribeCoverageUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    describeCoverage( options: DescribeCoverageUser, httpParams?: AxiosRequestConfig ) {
        const requestParams: DescribeCoverage = {
            SERVICE: 'WCS',
            REQUEST: 'DescribeCoverage',
            ...options
        };
        const httpOptions = httpParams !== undefined ? { ...this.defaults, ...httpParams } : this.defaults;
        return RequestService.getRequest( httpOptions, requestParams );
    }

    /**
     * Получить информацию о рельефе местности
     * @method getCoverage
     * @param options {GetCoverageUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getCoverage( options: GetCoverageUser, httpParams?: AxiosRequestConfig ) {
        const userParams: GetCoverageUser & { DIMENSIONSUBSET?: string; dimensionsubset?: string; } = { ...options };

        //в стандарте допустимо наличие нескольких парамтеров DIMENSIONSUBSET=value,
        // поэтому меняем регистр (у нас только 2 значения - для X и Y)
        let dvalue = false;
        for ( const key in userParams ) {
            const val = userParams[ key as keyof typeof userParams ];
            if ( key === 'DIMENSIONSUBSETX' || key === 'DIMENSIONSUBSETY' ) {
                if ( !dvalue ) {
                    userParams[ 'DIMENSIONSUBSET' ] = val;
                    dvalue = true;
                } else {
                    userParams[ 'dimensionsubset' ] = val;
                }
                delete userParams[ key ];
            }
        }

        const requestParams: GetCoverage = {
            SERVICE: 'WCS',
            REQUEST: 'GetCoverage',
            ...userParams
        };

        const httpOptions = httpParams !== undefined ? { ...this.defaults, ...httpParams } : this.defaults;
        return RequestService.getRequest( httpOptions, requestParams );
    }
}

export default WcsService;
