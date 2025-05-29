/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Выполнение запросов для работы с БД                  *
 *                 используется для компонента                      *
 *             "Пчеловод для работника Минсельхоза"                 *
 *                                                                  *
 *******************************************************************/

import BaseService from '~/services/RequestServices/common/BaseService';
import { AxiosRequestConfig } from 'axios';
import RequestService, { HttpParams } from '~/services/RequestServices/common/RequestService';
import { BrowserService } from '~/services/BrowserService';
import { GetBeekeeperObjectDataFromDB } from '@/components/GwtkBeekeeper/task/GwtkBeekeeperCommonService';
import { StaticBeekeepersRequest } from './GwtkBeekeeperStaticTask';


/**
 * Класс выполнения запросов к БД
 * @class GwtkBeekeeperStaticCommonService
 * @extends BaseService
 */
export default class GwtkBeekeeperStaticCommonService extends BaseService {

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
     *  @method getBeeKeeperDataFromDBForStatic
     * @param options {GetBeekeeperObjectDataFromDB} Параметры запроса
     * @param httpParams {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    private getBeeKeeperDataFromDBForStatic<T extends StaticBeekeepersRequest>(options: GetBeekeeperObjectDataFromDB, httpParams?: AxiosRequestConfig) {
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'json', ...httpParams, data: JSON.stringify(options) };
        return RequestService.postRequest<T>(httpLocalParams, {});
    }

    /**
     * Получить список постоянных пасек для работника минсельхоза
     * @method getPermanentApiariesList
     */
    getPermanentApiariesList() {
        const requestQuery: GetBeekeeperObjectDataFromDB = {
            cmd: 'getpermanentapiaries'
        };

        return this.getBeeKeeperDataFromDBForStatic<StaticBeekeepersRequest>(requestQuery);
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

        return this.getBeeKeeperDataFromDBForStatic(requestQuery);
    }

}
