/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Выполнение запросов                          *
 *                                                                  *
 *******************************************************************/

import axios, { AxiosRequestConfig } from 'axios';
import { ServiceResponse, XMLRpcData } from '~/services/Utils/Types';
import Utils from '~/services/Utils';
import { SimpleJson } from '~/types/CommonTypes';
import { ErrorResponse, JsonRpcRequest } from '~/services/RequestServices/RestService/Types';

export type HttpParams = { url: string } & AxiosRequestConfig;

export type StandardRequest<Options = any, Result = any> = (options: Options, httpParams?: AxiosRequestConfig) => Promise<ServiceResponse<Result>>;

/**
 * Класс выполнения запросов
 * @static
 * @class RequestService
 */
export default class RequestService {

    /**
     * Экземпляр axios
     * @private
     * @static
     * @property localAxios {AxiosInstance}
     */
    private static localAxios = axios.create();

    /**
     * Получить токен отмены запроса
     * @private
     * @static
     * @method getCancelToken {CancelTokenSource}
     */
    private static getCancelToken() {
        // TODO: игнорирование предупреждения от eslint
        // eslint-disable-next-line
        return axios.CancelToken.source();
    }

    /**
     * Отправить запрос с возможностью отмены
     * @static
     * @method sendCancellableRequest
     * @param requestMethod {StandardRequest} Ссылка на функцию запроса
     * @param [options] {object} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {object} Объект запроса с возможностью отмены
     */
    static sendCancellableRequest<Options = SimpleJson<string | undefined>, Return = any>(requestMethod: StandardRequest<Options, Return>, options: Options, httpParams?: AxiosRequestConfig) {
        const source = this.getCancelToken();
        const localHttpParams = {
            ...httpParams,
            cancelToken: source.token
        };
        const promise = requestMethod(options, localHttpParams);
        return { abortXhr: source.cancel.bind(source), promise };
    }

    /**
     * Выполнить GET-запрос
     * @static
     * @method getRequest
     * @param httpParams {HttpParams} HTTP-параметры запроса
     * @param requestParams {SimpleJson<string | undefined>} Параметры запроса
     * @return {Promise} Объект запроса
     */
    static getRequest<T = string>(httpParams: HttpParams, requestParams: SimpleJson<string | undefined>) {
        const httpLocalParams: AxiosRequestConfig = {
            method: 'GET',
            responseType: 'text',
            ...httpParams,
            ...{ params: requestParams }
        };

        return RequestService.sendRequest<T>(httpLocalParams);
    }

    /**
     * Выполнить POST-запрос с данными
     * @static
     * @method postDataRequest
     * @param httpParams {HttpParams} HTTP-параметры запроса
     * @param requestParams {SimpleJson<string | undefined>} Параметры запроса
     * @param [headers] {SimpleJson<string>} Заголовки
     * @return {Promise} Объект запроса
     */
    static postRequest<T = string>(httpParams: HttpParams, requestParams: SimpleJson<string | undefined>, headers?: SimpleJson<string>) {
        const httpLocalParams: AxiosRequestConfig = {
            method: 'POST',
            ...headers,
            ...httpParams,
            ...{ params: requestParams }
        };
        return RequestService.sendRequest<T>(httpLocalParams);
    }

    /**
     * Выполнить XML-RPC POST-запрос
     * @static
     * @deprecated
     * @method postXmlRpc
     * @param httpParams {HttpParams} HTTP-параметры запроса
     * @param urlRequestParams {SimpleJson<string | undefined>} Параметры запроса для адресной строки
     * @param jsonRPC {XMLRpcData[]} XML-RPC параметры запроса
     * @return {Promise} Объект запроса
     */
    static postXmlRpc<T = Blob>(httpParams: HttpParams, urlRequestParams: SimpleJson<string | undefined>, jsonRPC: XMLRpcData[]) {
        return RequestService.postRequest<T>({
            responseType: 'blob',
            data: Utils.createXmlRpcString(jsonRPC),
            ...httpParams
        }, urlRequestParams, {
            'Content-Type': 'text/xml'
        });
    }


    /**
     * Выполнить Json RPC POST-запрос
     * @static
     * @method postJson
     * @param httpParams {HttpParams} HTTP-параметры запроса
     * @param urlRequestParams {SimpleJson<string | undefined>} Параметры запроса для адресной строки
     * @param jsonRPC {XMLRpcData[]} Параметры запроса
     * @return {Promise} Объект запроса
     */
    static postJson<T = Blob>(httpParams: HttpParams, urlRequestParams: SimpleJson<string | undefined>, jsonRPC: XMLRpcData[]) {
        return RequestService.postRequest<T>({
            responseType: 'blob',
            data: Utils.createJsonRpcString(jsonRPC), ...httpParams
        }, urlRequestParams, {
            'Content-Type': 'text/xml'
        });
    }

    /**
     * Выполнить Json RPC POST-запрос
     * @static
     * @method postJsonRpc
     * @param httpParams {HttpParams} HTTP-параметры запроса
     * @param urlRequestParams {SimpleJson<string | undefined>} Параметры запроса для адресной строки
     * @param jsonRPC {JsonRpcRequest} Параметры запроса
     * @return {Promise} Объект запроса
     */
    static postJsonRpc<T>(httpParams: HttpParams, urlRequestParams: SimpleJson<string | undefined>, jsonRPC: JsonRpcRequest<any>) {
        return RequestService.postRequest<T>({
            data: jsonRPC, ...httpParams
        }, urlRequestParams);
    }

    /**
     * Отправить запрос
     * @private
     * @static
     * @async
     * @method sendRequest
     * @param httpParams {AxiosRequestConfig} HTTP-параметры запроса
     * @return {ServiceResponse} Ответ сервера
     */
    private static async sendRequest<Type>(httpParams: AxiosRequestConfig): Promise<ServiceResponse<Type>> {
        const response: ServiceResponse<Type> = await this.localAxios.request<Type>(httpParams).catch((e) => {

            let exceptionXmlString: string = Utils.createXmlExceptionString('Internal Server error', 'InternalServerError');
            if (e.message === 'AbortRequest') {
                exceptionXmlString = Utils.createXmlExceptionString('Request was cancelled', e.message);
            } else if (e.request && e.request.status === 500) {
                exceptionXmlString = Utils.createXmlExceptionString('Internal Server error', 'InternalServerError');
            } else if (e.request && e.request.status === 400) {
                if (e.response && e.response.data) {
                    exceptionXmlString = e.response.data;
                }
            } else {
                exceptionXmlString = Utils.createXmlExceptionString(e.message, e.request && e.request.status.toString());
            }

            return {
                data: undefined,
                error: exceptionXmlString
            };
        });
        await this.checkException<Type>(response.data || response.error || '');
        return response;
    }

    /**
     * Проверка ответа на ошибку
     * @private
     * @static
     * @async
     * @method checkException
     * @param data {object|string} Данные ответа запроса
     */
    private static async checkException<T>(data: T | ErrorResponse | string) {
        if (typeof data === 'string') {
            Utils.checkXMLException(data);
        } else if (data instanceof Blob && data.type === 'text/xml') {
            const textResponse = await Utils.readBlobAsText(data);
            Utils.checkXMLException(textResponse);
        }
    }
}
