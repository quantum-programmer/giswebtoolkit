/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Выполнение WMS (OGC Web Map Service)-запросов          *
 *                            GWTK SE                               *
 *******************************************************************/
import RequestService from '../common/RequestService';
import {
    GetCapabilitiesWmsUser,
    GetCapabilitiesWms,
    GetMap,
    GetMapUser,
    GetFeatureInfoWms,
    GetFeatureInfoWmsUser
} from './Types';
import { AxiosRequestConfig } from 'axios';
import BaseService from '~/services/RequestServices/common/BaseService';

/**
 * Класс выполнения OGC-WMS запросов
 * @class WmsService
 * @extends BaseService
 */
class WmsService extends BaseService {

    /**
     * Получить метаданные об имеющихся на сервере слоях(картах)
     * и доступных значениях параметров запросов
     * @method getCapabilities
     * @param [options] {GetCapabilitiesWmsUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getCapabilities( options?: GetCapabilitiesWmsUser, httpParams?: AxiosRequestConfig ) {
        const requestParams: GetCapabilitiesWms = {
            SERVICE: 'WMS',
            REQUEST: 'GetCapabilities',
            ...options
        };
        const httpOptions = httpParams !== undefined ? { ...this.defaults, ...httpParams } : this.defaults;
        return RequestService.getRequest( httpOptions, requestParams );
    }

    /**
     * Получить рисунок карты
     * @method getMap
     * @param options {GetMapUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getMap( options: GetMapUser, httpParams?: AxiosRequestConfig ) {
        const requestParams: GetMap = {
            SERVICE: 'WMS',
            REQUEST: 'GetMap',
            VERSION: '1.3.0',
            ...options
        };
        const localOptions: AxiosRequestConfig = { responseType: 'blob' };
        const httpOptions = httpParams !== undefined ? { ...this.defaults, ...localOptions, ...httpParams } : this.defaults;
        return RequestService.getRequest( httpOptions, requestParams );
    }

    /**
     * Составить Url-адрес получения рисунка карты
     * @method createGetMapUrl
     * @param options {GetMapUser} Параметры запроса
     * @param [serviceUrl] {string} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    createGetMapUrl( options: GetMapUser, serviceUrl?: string ) {
        const requestParams: GetMap = {
            SERVICE: 'WMS',
            REQUEST: 'GetMap',
            VERSION: '1.3.0',
            ...options
        };
        const params: string[] = [];
        for ( const key in requestParams ) {
            params.push( `${key}=${(requestParams as any)[ key ]}` );
        }
        return (serviceUrl || this.defaults.url) + '?' + params.join( '&' );
    }

    /**
     * Получить информацию о семантических характеристиках объектов
     * карты в заданной точке
     * @method getFeatureInfo
     * @param options {GetFeatureInfoWmsUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getFeatureInfo( options: GetFeatureInfoWmsUser, httpParams?: AxiosRequestConfig ) {
        const requestParams: GetFeatureInfoWms = {
            SERVICE: 'WMS',
            REQUEST: 'GetFeatureInfo',
            VERSION: '1.3.0',
            ...options
        };
        const httpOptions = httpParams !== undefined ? { ...this.defaults, ...httpParams } : this.defaults;
        return RequestService.getRequest( httpOptions, requestParams );
    }
}

export default WmsService;
