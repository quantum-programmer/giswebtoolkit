/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Хранилище сервисов                          *
 *                                                                  *
 *******************************************************************/

import { HttpParams } from './common/RequestService';
import WcsService from '~/services/RequestServices/OgcServices/WcsService';
import WfsService from '~/services/RequestServices/OgcServices/WfsService';
import WmsService from '~/services/RequestServices/OgcServices/WmsService';
import WmtsService from '~/services/RequestServices/OgcServices/WmtsService';
import RestService from '~/services/RequestServices/RestService/RestService';
import Utils from '~/services/Utils';
import CommonService from '~/services/RequestServices/common/CommonService';
import { AuthParams, SimpleJson } from '~/types/CommonTypes';
import FormAuthService from '~/services/RequestServices/FormAuthService';


type AllServiceTypes = WcsService | WfsService | WmsService | WmtsService | RestService | CommonService | FormAuthService;
type ExtractService<A> = A extends AllServiceTypes ? A : never;
type ServiceList = {
    WCS: WcsService;
    WFS: WfsService;
    WMS: WmsService;
    WMTS: WmtsService;
    REST: RestService;
    AUTH: FormAuthService;
    COMMON: CommonService;
};

export enum ServiceType {
    WCS = 'WCS',
    WFS = 'WFS',
    WMS = 'WMS',
    WMTS = 'WMTS',
    REST = 'REST',
    AUTH = 'AUTH',
    COMMON = 'COMMON'
}

/**
 * Класс выполнения запросов
 * @static
 * @class RequestServices
 */
class RequestServices {
    /**
     * Список зарегистрированных сервисов
     * @private
     * @static
     * @property serviceList
     */
    private static serviceList: SimpleJson<SimpleJson<ServiceList[ServiceType]>> = {
        WCS: {} as SimpleJson<ServiceList['WCS']>,
        WFS: {} as SimpleJson<ServiceList['WFS']>,
        WMS: {} as SimpleJson<ServiceList['WMS']>,
        WMTS: {} as SimpleJson<ServiceList['WMTS']>,
        REST: {} as SimpleJson<ServiceList['REST']>,
        COMMON: {} as SimpleJson<ServiceList['COMMON']>,
        AUTH: {} as SimpleJson<ServiceList['AUTH']>
    };

    /**
     * Получить экземпляр сервиса или создать новый
     * @static
     * @method retrieveOrCreate
     * @param httpParams {HttpParams} HTTP-параметры запроса
     * @param serviceType {ServiceType} Тип сервиса
     * @return {AllServiceTypes} Экземпляр сервиса
     */
    static retrieveOrCreate<T extends ServiceType>( httpParams: HttpParams, serviceType: T ) {
        let result = RequestServices.getService( httpParams.url, serviceType );
        if ( !result ) {
            result = RequestServices.createNew( httpParams, serviceType, true );
        }
        return result;
    }

    /**
     * Получить экземпляр сервиса
     * @static
     * @method getService
     * @param url {string} URL-адрес сервиса
     * @param serviceType {ServiceType} Тип сервиса
     * @return {AllServiceTypes} Экземпляр сервиса
     */
    static getService<T extends ServiceType>( url: string, serviceType: T ) {
        return RequestServices.serviceList[ serviceType ][ url ] as ExtractService<ServiceList[T]>;
    }

    /**
     * Создать новый экземпляр сервиса
     * @static
     * @method createNew
     * @param httpParams {HttpParams} HTTP-параметры запроса
     * @param serviceType {ServiceType} Тип сервиса
     * @param [pushToServiceList] {boolean} Положить в хранилище сервисов (заменить на новый)
     * @return {AllServiceTypes} Экземпляр сервиса
     */
    static createNew<T extends ServiceType>( httpParams: HttpParams, serviceType: T, pushToServiceList?: boolean ) {
        let result;
        switch ( serviceType ) {
            case ServiceType.WCS:
                result = new WcsService( httpParams );
                break;
            case ServiceType.WFS:
                result = new WfsService( httpParams );
                break;
            case ServiceType.WMS:
                result = new WmsService( httpParams );
                break;
            case ServiceType.WMTS:
                result = new WmtsService( httpParams );
                break;
            case ServiceType.REST:
                result = new RestService( httpParams );
                break;
            case ServiceType.AUTH:
                result = new FormAuthService( httpParams );
                break;
            case ServiceType.COMMON:
                result = new CommonService( httpParams );
                break;
        }

        if ( pushToServiceList && result ) {
            RequestServices.serviceList[ serviceType ][ httpParams.url ] = result;
        }

        return result as ExtractService<ServiceList[T]>;
    }

    /**
     * Сформировать объект http-параметров запроса по
     * информации из карты
     * @param mapOptions {AuthParams} Информация из карты карты
     * @param [options] {HttpParams} Http-параметры запроса
     * @returns {HttpParams|undefined} Объект http-параметров запроса
     */
    static createHttpParams( mapOptions: AuthParams, options?: HttpParams ) {
        return Utils.createHttpParams( mapOptions, options );
    }
}

export default RequestServices;
