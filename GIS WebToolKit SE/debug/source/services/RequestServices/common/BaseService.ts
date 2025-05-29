/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Базовый класс выполнения запросов                *
 *                                                                  *
 *******************************************************************/

import { HttpParams } from './RequestService';

/**
 * Базовый класс выполнения запросов
 * @class BaseService
 * @param httpParams {HttpParams} Конфигурация запросов
 */
class BaseService {
    protected defaults: HttpParams;

    constructor( httpParams: HttpParams ) {
        this.defaults = {
            timeout: 60000,
            responseType: 'text',
            ...httpParams
        };
    }

    /**
     * Базовый класс выполнения запросов
     * @method getDefaults
     */
    getDefaults() {
        return this.defaults;
    }
}

export default BaseService;
