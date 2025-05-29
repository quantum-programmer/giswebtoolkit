/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *        Выполнение запросов авторизации FormAuth                  *
 *                                                                  *
 *******************************************************************/

import { AxiosRequestConfig } from 'axios';
import RequestService, { HttpParams } from '~/services/RequestServices/common/RequestService';
import {
    ChangePasswordRequest,
    CheckRecoveryCodeRequest, FetchErrorResponse,
    FetchSuccessResponse, LoginErrorResponse, LoginRequest,
    LoginSuccessResponse, LogoutSuccessResponse,
    RecoveryCodeResponse,
    RegisterRequest, RegisterSuccessResponse, SetNewPasswordRequest, SetNewPasswordResponse
} from '~/services/RequestServices/FormAuthService/types';


/**
 * Класс выполнения запросов авторизации
 * @class FormAuthService
 */
class FormAuthService {

    private readonly defaults: HttpParams;

    /**
     * @constructor FormAuthService
     * @param [httpParams] {AxiosRequestConfig} Конфигурация запросов
     */
    constructor( httpParams: HttpParams ) {
        this.defaults = {
            timeout: 35000,
            responseType: 'json',
            withCredentials: false,
            ...httpParams,
        };
    }

    /**
     * Запрос смены пароля пользователя
     * @method changeToNewPassword
     * @param options {ChangePasswordRequest} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    changeToNewPassword( options: ChangePasswordRequest, httpParams?: AxiosRequestConfig ) {
        const data = `email=${options.email}`;

        const httpOptions = {
            ...this.defaults,
            url: this.defaults.url + '/auth/change/to/new/password',
            data,
            ...httpParams
        };

        return RequestService.postRequest<RecoveryCodeResponse>( httpOptions, {} );
    }

    /**
     * Проверка кода смены пароля пользователя
     * @method checkRecoveryCode
     * @param options {ChangePasswordRequest} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    checkRecoveryCode( options: CheckRecoveryCodeRequest, httpParams?: AxiosRequestConfig ) {
        const data = `email=${options.email}&code=${options.code}`;

        const httpOptions = {
            ...this.defaults,
            url: this.defaults.url + '/auth/check/recovery/code',
            data,
            ...httpParams
        };

        return RequestService.postRequest<RecoveryCodeResponse>( httpOptions, {} );
    }

    /**
     * Запросить параметры авторизованного пользователя
     * @method fetchAuthParams
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    fetchAuthParams( httpParams?: AxiosRequestConfig ) {

        const httpOptions = {
            ...this.defaults,
            url: this.defaults.url + '/auth/fetchAuthParams/',
            ...httpParams
        };

        return RequestService.postRequest<FetchSuccessResponse | FetchErrorResponse>( httpOptions, {} );
    }

    /**
     * Авторизация пользователя
     * @method login
     * @param options {LoginRequest} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    login( options: LoginRequest, httpParams?: AxiosRequestConfig ) {

        const data = `login=${encodeURIComponent(options.login)}&password=${encodeURIComponent(options.password)}`;

        const httpOptions = {
            ...this.defaults,
            url: this.defaults.url + '/auth/login',
            data,
            ...httpParams
        };

        return RequestService.postRequest<LoginSuccessResponse | LoginErrorResponse>( httpOptions, {} );
    }

    /**
     * Выход пользователя
     * @method logout
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    logout( httpParams?: AxiosRequestConfig ) {
        const httpOptions = {
            ...this.defaults,
            url: this.defaults.url + '/auth/logout',
            ...httpParams
        };

        return RequestService.postRequest<LogoutSuccessResponse>( httpOptions, {} );
    }

    /**
     * Регистрация нового пользователя
     * @method register
     * @param options {RegisterRequest} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    register( options: RegisterRequest, httpParams?: AxiosRequestConfig ) {
        const data = `login=${encodeURIComponent(options.login)}&password=${encodeURIComponent(options.password)}&passwordRepeat=${encodeURIComponent(options.passwordRepeat)}&email=${options.email}`;

        const httpOptions = {
            ...this.defaults,
            url: this.defaults.url + '/auth/register',
            data,
            ...httpParams
        };

        return RequestService.postRequest<RegisterSuccessResponse>( httpOptions, {} );
    }

    /**
     * Установка нового пароля пользователя
     * @method setNewPassword
     * @param options {SetNewPasswordRequest} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    setNewPassword( options: SetNewPasswordRequest, httpParams?: AxiosRequestConfig ) {
        const data = `email=${options.email}&code=${options.code}&password=${encodeURIComponent(options.password)}&passwordRepeat=${encodeURIComponent(options.passwordRepeat)}`;

        const httpOptions = {
            ...this.defaults,
            url: this.defaults.url + '/auth/set/new/password',
            data,
            ...httpParams
        };

        return RequestService.postRequest<SetNewPasswordResponse>( httpOptions, {} );
    }
}

export default FormAuthService;
