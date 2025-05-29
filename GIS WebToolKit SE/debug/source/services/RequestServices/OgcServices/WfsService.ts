/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *        Выполнение WFS (OGC Web Feature Service)-запросов         *
 *                            GWTK SE                               *
 *******************************************************************/

import RequestService from '../common/RequestService';
import {
    GetCapabilitiesWfs,
    GetCapabilitiesWfsUser,
    DescribeFeatureTypes,
    DescribeFeatureTypesUser,
    ListStoredQueries,
    ListStoredQueriesUser,
    GetFeature,
    GetFeatureUser,
    TransactionUser,
    Transaction
} from './Types';

import { AxiosRequestConfig } from 'axios';
import { AREA, LENGTH, OBJCENTER } from '~/services/RequestServices/common/enumerables';
import BaseService from '~/services/RequestServices/common/BaseService';

/**
 * Класс выполнения OGC-WFS запросов
 * @class WfsService
 * @extends BaseService
 */
class WfsService extends BaseService {

    /**
     * Получить метаданные об имеющихся на сервере слоях(картах)
     * и доступных значениях параметров запросов
     * @method getCapabilities
     * @param [options] {GetCapabilitiesWfsUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getCapabilities( options?: GetCapabilitiesWfsUser, httpParams?: AxiosRequestConfig ) {
        const requestParams: GetCapabilitiesWfs = {
            SERVICE: 'WFS',
            REQUEST: 'GetCapabilities',
            ...options
        };
        const httpOptions = httpParams !== undefined ? { ...this.defaults, ...httpParams } : this.defaults;
        return RequestService.getRequest( httpOptions, requestParams );
    }

    /**
     * Получить информацию об источнике данных пространственных объектов
     * @method describeFeatureType
     * @param [options] {DescribeFeatureTypesUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    describeFeatureType( options?: DescribeFeatureTypesUser, httpParams?: AxiosRequestConfig ) {
        const requestParams: DescribeFeatureTypes = {
            SERVICE: 'WFS',
            REQUEST: 'DescribeFeatureType',
            ...options
        };
        const httpOptions = httpParams !== undefined ? { ...this.defaults, ...httpParams } : this.defaults;
        return RequestService.getRequest( httpOptions, requestParams );
    }

    /**
     * Получить информацию о доступных хранимых запросах сервиса
     * @method listStoredQueries
     * @param [options] {ListStoredQueriesUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    listStoredQueries( options?: ListStoredQueriesUser, httpParams?: AxiosRequestConfig ) {
        const requestParams: ListStoredQueries = {
            SERVICE: 'WFS',
            REQUEST: 'ListStoredQueries',
            ...options
        };
        const httpOptions = httpParams !== undefined ? { ...this.defaults, ...httpParams } : this.defaults;
        return RequestService.getRequest( httpOptions, requestParams );
    }

    /**
     * Получить геометрических свойства и атрибутивные характеристики
     * пространственных объектов из базы геоданных
     * @method getFeature
     * @param options {GetFeatureUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getFeature( options: GetFeatureUser, httpParams?: AxiosRequestConfig ) {
        const requestParams: GetFeature = {
            SERVICE: 'WFS',
            REQUEST: 'GETFEATURE',
            MAPID: '1',
            AREA: AREA.AddArea,
            RESULTTYPE: 'results',
            ...options
        };
        const httpOptions = httpParams !== undefined ? { ...this.defaults, ...httpParams } : this.defaults;
        return RequestService.getRequest( httpOptions, requestParams );
    }

    /**
     * Получить геометрических свойства и атрибутивные характеристики
     * пространственных объектов из базы геоданных для хранимого запроса
     * @method getFeatureById
     * @param [options] {GetFeatureUser} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getFeatureById( options?: GetFeatureUser, httpParams?: AxiosRequestConfig ) {
        const requestParams: GetFeature = {
            REQUEST: 'GETFEATURE',
            SERVICE: 'WFS',
            STOREDQUERY_ID: 'urn:ogc:def:query:OGC-WFS:GetFeatureById',
            SEMANTICNAME: '1',
            ...options
        };
        const httpOptions = httpParams !== undefined ? { ...this.defaults, ...httpParams } : this.defaults;
        return RequestService.getRequest( httpOptions, requestParams );
    }

    /**
     * Создать, изменить, заместить или удалить объекты
     * @method transaction
     * @param httpParams {AxiosRequestConfig} HTTP-параметры запроса
     * @param [options] {TransactionUser} Параметры запроса
     * @return {Promise} Объект запроса
     */
    transaction( httpParams: AxiosRequestConfig, options?: TransactionUser ) {
        const requestParams: Transaction = {
            SERVICE: 'WFS',
            REQUEST: 'Transaction',
            ...options
        };
        const httpOptions = { ...this.defaults, ...httpParams };
        return RequestService.postRequest( httpOptions, requestParams );
    }

    /**
     * Получить геометрических свойства и атрибутивные характеристики
     * пространственных объектов из базы геоданных с длиной и площадью
     * @method dimentions
     * @param options {object} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    dimentions( options: { ID: string; LAYER?: string; }, httpParams?: AxiosRequestConfig ) {
        const requestParams: GetFeatureUser = {
            STOREDQUERY_ID: 'urn:ogc:def:query:OGC-WFS::GetFeatureById',
            AREA: AREA.AddArea,
            LENGTH: LENGTH.AddLength,
            ...options
        };
        return this.getFeature( requestParams, httpParams );
    }

    /**
     * Получить геометрических свойства и атрибутивные характеристики
     * пространственных объектов из базы геоданных с метрикой и площадью
     * @method area
     * @param options {object} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    area( options: { ID: string; LAYER: string; }, httpParams?: AxiosRequestConfig ) {
        const requestParams: GetFeatureUser = {
            STOREDQUERY_ID: 'urn:ogc:def:query:OGC-WFS::GetFeatureById',
            AREA: AREA.AddArea,
            METRIC: '1' as '1',
            ...options
        };
        return this.getFeature( requestParams, httpParams );
    }

    /**
     * Получить геометрических свойства и атрибутивные характеристики
     * пространственных объектов из базы геоданных с метрикой и длиной
     * @method lengthObj
     * @param options {object} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    lengthObj( options: { ID: string; LAYER?: string; }, httpParams?: AxiosRequestConfig ) {
        const requestParams: GetFeatureUser = {
            STOREDQUERY_ID: 'urn:ogc:def:query:OGC-WFS::GetFeatureById',
            LENGTH: LENGTH.AddLength,
            METRIC: '1' as '1',
            ...options
        };
        return this.getFeature( requestParams, httpParams );
    }

    /**
     * Получить геометрических свойства и атрибутивные характеристики
     * пространственных объектов из базы геоданных с метрикой и центром объекта
     * @method mappolygoncenter
     * @param options {object} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    mappolygoncenter( options: { ID: string; LAYER: string; }, httpParams?: AxiosRequestConfig ) {
        const requestParams: GetFeatureUser = {
            STOREDQUERY_ID: 'urn:ogc:def:query:OGC-WFS::GetFeatureById',
            OBJCENTER: OBJCENTER.ObjectCenter,
            METRIC: '1' as '1',
            ...options
        };
        return this.getFeature( requestParams, httpParams );
    }
}

export default WfsService;
