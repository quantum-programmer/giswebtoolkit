/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Выполнение стандартных запросов                 *
 *                                                                  *
 *******************************************************************/

import RequestService, { HttpParams } from '../common/RequestService';
import BaseService from '~/services/RequestServices/common/BaseService';
import { AxiosRequestConfig } from 'axios';
import { SimpleJson } from '~/types/CommonTypes';

/**
 * Класс выполнения стандартных запросов
 * @class CommonService
 * @extends BaseService
 * @param httpParams {HttpParams} Конфигурация запросов
 */
export default class CommonService extends BaseService {

    /**
     * Стандартный GET запрос
     * @method commonGet
     * @param options {object} Параметры запроса
     * @param httpParams {HttpParams} HTTP-параметры запроса
     */
    commonGet<T>( options: SimpleJson<string | undefined> = {}, httpParams?: AxiosRequestConfig ) {
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<T>( httpLocalParams, options );
    }

    /**
     * Стандартный POST запрос
     * @method commonPost
     * @param options Параметры запроса
     * @param httpParams HTTP-параметры запроса
     */
    commonPost<T>( options = {}, httpParams: HttpParams ) {
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.postRequest<T>( httpLocalParams, options );
    }
}

