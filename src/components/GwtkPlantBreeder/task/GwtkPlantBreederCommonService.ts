/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Выполнение запросов для работы с БД                  *
 *         используется для компонента "Растениеводы"               *
 *                                                                  *
 *******************************************************************/

import BaseService from '~/services/RequestServices/common/BaseService';
import { AxiosRequestConfig } from 'axios';
import RequestService, { HttpParams } from '~/services/RequestServices/common/RequestService';
import { BrowserService } from '~/services/BrowserService';
import {
    PlantBreederRequest,
    PlantBreederRequestAdditionalInformation
} from '@/components/GwtkPlantBreeder/task/GwtkPlantBreederTask';


export type GetPlantBreederObjectDataFromDB = {
    cmd: string,
    table?: string,
    linkObject?: string,
    linkSheet?: string,
    fieldId?: string,
    params?: { key: string; value: string; }[][] | { key: string; value: string; }[]
}

/**
 * Класс выполнения запросов к БД
 * @class GwtkPlantBreederCommonService
 * @extends BaseService
 */
export default class GwtkPlantBreederCommonService extends BaseService {

    /**
     * Ссылка на выполняющий файл
     * @private
     * @property url {String}
     */
    private url = BrowserService.getAppURL() + 'apiaries.php';
    //private url = 'http://192.168.0.22/gwsse_rzd/apiaries.php';


    /**
     *  Получить информацию об объекте из БД, для пчеловодов
     *  @private
     *  @method getPlantBreederDataFromDB
     * @param options {GetPlantBreederObjectDataFromDB} Параметры запроса
     * @param httpParams {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    private getPlantBreederDataFromDb<T extends (PlantBreederRequest | PlantBreederRequestAdditionalInformation)>( options: GetPlantBreederObjectDataFromDB, httpParams?: AxiosRequestConfig) {
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'json', ...httpParams, data:JSON.stringify(options) };
        return RequestService.postRequest<T>( httpLocalParams, {} );
    }

    /**
     * Получить справочник
     * @method getPlantBreedersAdditionalInformation
     */
    getPlantBreedersAdditionalInformation() {
        const requestQuery: GetPlantBreederObjectDataFromDB = {
            cmd: 'getsprav_plantbreeders'
        };

        return this.getPlantBreederDataFromDb<PlantBreederRequestAdditionalInformation>(requestQuery);
    }

    /**
     * Получить информацию об объекте
     * @method getPlantBreederObjectData
     * @param linkSheet {String} Имя слоя
     * @param linkObject {String} Номер объекта
     * @param idOrgan {String} Идентификатор организации
     */
    getPlantBreederObjectData(linkSheet: string, linkObject: string, idOrgan: string) {
        const requestQuery: GetPlantBreederObjectDataFromDB = {
            cmd: 'get',
            table: 'plantbreders',
            linkSheet: linkSheet,
            linkObject: linkObject,
            params: [
                {key: 'id_Organ', value: idOrgan}
            ]
        };

        return this.getPlantBreederDataFromDb<PlantBreederRequest>(requestQuery);
    }

    /**
     * Редактировать объект (Семантику в БД для Растениеводов)
     * @method editPlantBreeder
     * @param linkSheet {String} Имя слоя
     * @param linkObject {String} Номер объекта
     * @param params {Array} Параметры пасеки
     */
    editPlantBreeder(linkSheet: string, linkObject: string, params: { key: string; value: string; }[][]) {
        const requestQuery: GetPlantBreederObjectDataFromDB = {
            cmd: 'edit',
            table: 'plantbreders',
            linkSheet: linkSheet,
            linkObject: linkObject,
            params: params
        };

        return this.getPlantBreederDataFromDb(requestQuery);
    }
}
