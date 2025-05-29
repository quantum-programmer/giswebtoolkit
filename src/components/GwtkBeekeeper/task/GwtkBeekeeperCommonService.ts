/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Выполнение запросов для работы с БД                  *
 *           используется для компонента "Пчеловоды"                *
 *                                                                  *
 *******************************************************************/


import BaseService from '~/services/RequestServices/common/BaseService';
import { AxiosRequestConfig } from 'axios';
import RequestService, { HttpParams } from '~/services/RequestServices/common/RequestService';
import { BrowserService } from '~/services/BrowserService';
import { BeekeepersRequest, BeekeepersRequestAdditionalInformation } from './GwtkBeekeeperTask';


export type GetBeekeeperObjectDataFromDB = {
    cmd: string,
    table?: string,
    linkObject?: string,
    linkSheet?: string,
    fieldId?: string,
    params?: { key: string; value: string; }[] | { key: string; value: string; }[][]
}


/**
 * Класс выполнения запросов к БД
 * @class GwtkBeekeepersCommonService
 * @extends BaseService
 */
export default class GwtkBeekeeperCommonService extends BaseService {

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
     *  @method getBeeKeeperDataFromDB
     * @param options {GetBeekeeperObjectDataFromDB} Параметры запроса
     * @param httpParams {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    private getBeeKeeperDataFromDB<T extends BeekeepersRequest | BeekeepersRequestAdditionalInformation>(options: GetBeekeeperObjectDataFromDB, httpParams?: AxiosRequestConfig) {
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'json', ...httpParams, data: JSON.stringify(options) };
        return RequestService.postRequest<T>(httpLocalParams, {});
    }

    /**
     * Получить справочник
     * @method getBeekeepersAdditionalInformation
     */
    getBeekeepersAdditionalInformation() {
        const requestQuery: GetBeekeeperObjectDataFromDB = {
            cmd: 'getsprav_beekeepers'
        };

        return this.getBeeKeeperDataFromDB<BeekeepersRequestAdditionalInformation>(requestQuery);
    }

    /**
     * Получить информацию об объекте
     * @method getBeekeepersObjectData
     * @param linkSheet {String} Имя слоя
     * @param linkObject {String} Номер объекта
     * @param idOrgan {String} Идентификатор организации
     */
    getBeekeepersObjectData(linkSheet: string, linkObject: string, idOrgan: string) {
        const requestQuery: GetBeekeeperObjectDataFromDB = {
            cmd: 'get',
            table: 'beekeepers',
            linkSheet: linkSheet,
            linkObject: linkObject,
            params: [
                { key: 'id_Organ', value: idOrgan }
            ]
        };

        return this.getBeeKeeperDataFromDB<BeekeepersRequest>(requestQuery);
    }

    /**
     * Добавить новый объект (Пасеку)
     * @method addApiary
     * @param params {Array} Параметры пасеки
     */
    addApiary(params: { key: string; value: string; }[]) {
        const requestQuery: GetBeekeeperObjectDataFromDB = {
            cmd: 'add',
            table: 'beekeepers',
            params: params
        };

        return this.getBeeKeeperDataFromDB(requestQuery);
    }

    /**
     * Редактировать объект (Пасеку)
     * @method editApiary
     * @param params {Array} Параметры пасеки
     */
    editApiary(params: { key: string; value: string; }[]) {
        const requestQuery: GetBeekeeperObjectDataFromDB = {
            cmd: 'edit',
            table: 'beekeepers',
            params: params
        };

        return this.getBeeKeeperDataFromDB(requestQuery);
    }

    /**
     * Удалить объект (Пасеку)
     * @method deleteApiary
     * @param params {Array} Параметры пасеки
     */
    deleteApiary(params: { key: string; value: string; }[]) {
        const requestQuery: GetBeekeeperObjectDataFromDB = {
            cmd: 'delete',
            table: 'beekeepers',
            params: params
        };

        return this.getBeeKeeperDataFromDB(requestQuery);
    }
}
