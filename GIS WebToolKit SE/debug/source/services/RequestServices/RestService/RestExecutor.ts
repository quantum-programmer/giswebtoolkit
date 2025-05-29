/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Автоматизированное выполнение REST-запросов           *
 *                             GWTK SE                              *
 *                                                                  *
 ********************************************************************/

import RestService from '~/services/RequestServices/RestService/RestService';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import {
    CreateProcessResponse,
    GetStatusDataResponse,
    RestExecuteStage,
    RestExecuteStatus,
    RestExecutorOptions
} from '~/services/RequestServices/RestService/Types';
import axios, {AxiosRequestConfig, Canceler, CancelTokenSource} from 'axios';
import GwtkError from '~/utils/GwtkError';
import {ServiceResponse,} from '~/services/Utils/Types';
import {SimpleJson} from '~/types/CommonTypes';
import {HttpParams} from '~/services/RequestServices/common/RequestService';

/**
 * Класс автоматизированного выполнения REST-запросов
 * @class RestExecutor
 */
export default class RestExecutor<T = string> {

    private readonly service!: RestService;

    private cancellableRequest: {
        abortXhr: Canceler;
        promise: Promise<any>;
    } | undefined;
    private cancelTokenSource!: CancelTokenSource;

    private stage: RestExecuteStage = RestExecuteStage.None;
    private percent: number = 0;
    private result: T | undefined;
    private error: GwtkError | undefined;

    private jobId: string = '';
    private delay: number = 500;
    private delayIncrease: number = 100;

    constructor(readonly httpParams: HttpParams, readonly restMethod: string, readonly restMethodOptions: SimpleJson) {
        this.service = RequestServices.retrieveOrCreate(this.httpParams, ServiceType.REST);
    }

    get status(): RestExecuteStatus<T> {
        return {
            done: this.done,
            stage: this.stage,
            percent: this.percent,
            result: this.result as T,
            error: this.error
        };
    }

    get done(): boolean {
        return this.stage === RestExecuteStage.Complete || this.stage === RestExecuteStage.Cancelled || this.stage === RestExecuteStage.Error;
    }

    /**
     * Установить настройки.
     * @method setOptions
     * @param options {RestExecutorOptions} Настройки
     */
    setOptions(options: RestExecutorOptions): void {
        Object.assign(this, options);
    }

    /**
     * Выполнить REST-запрос.
     * Возвращает признак завершения.
     * Вызов данного метода повторять, пока не будет возвращён признак завершения выполнения REST-операции.
     * Необходимые задержки между операциями реализованы внутри методов.
     * @async
     * @method do
     * @return {boolean} Признак завершения выполнения REST-операции.
     */
    async do(): Promise<boolean> {
        try {
            if (this.stage === RestExecuteStage.None) {
                await this.execute();
            } else if (this.stage === RestExecuteStage.Run) {
                await this.run();
            } else if (this.stage === RestExecuteStage.Ready) {
                await this.ready();
            }
        } catch (exception) {
            if (this.stage !== RestExecuteStage.Cancelled) {
                this.error = new GwtkError(exception);
                this.stage = RestExecuteStage.Error;
            }
        }
        return this.done;
    }

    protected async execute(): Promise<void> {
        const serviceMethod = this.service.createProcess.bind(this.service);
        const executeResponse = await this.requestCancellable<CreateProcessResponse>(serviceMethod, {
            method: this.restMethod,
            options: this.restMethodOptions
        });
        if (executeResponse.data?.restmethod.outparams.status === 'Accepted') {
            this.jobId = executeResponse.data?.restmethod.outparams.jobId || '';
        }

        if (this.jobId) {
            this.stage = RestExecuteStage.Run;
        } else {
            throw new Error('Can not execute process.');
        }
    }

    protected async requestCancellable<T>(promise: (options: any, httpParams?: AxiosRequestConfig) => Promise<ServiceResponse<T>>, options: any): Promise<ServiceResponse<T>> {
        // eslint-disable-next-line import/no-named-as-default-member
        this.cancelTokenSource = axios.CancelToken.source();
        const httpParams = {
            ...this.httpParams,
            cancelToken: this.cancelTokenSource.token
        };
        this.cancellableRequest = {
            abortXhr: this.cancelTokenSource.cancel.bind(this.cancelTokenSource),
            promise: promise(options, httpParams)
        };
        const result = await this.cancellableRequest.promise;
        this.cancellableRequest = undefined;
        return result;
    }

    protected async run(): Promise<void> {
        await this.wait();
        if (this.stage === RestExecuteStage.Cancelled) {
            return;
        }
        const serviceMethod = this.service.getAsyncStatusData.bind(this.service) as (options: any, httpParams?: AxiosRequestConfig) => Promise<ServiceResponse<GetStatusDataResponse>>;
        const statusResponse = await this.requestCancellable<GetStatusDataResponse>(serviceMethod, {PROCESSNUMBER: this.jobId});
        if (!statusResponse.data || statusResponse.data.restmethod.outparams.status === 'Failed') {
            throw new Error('Can not execute process.');
        } else if (statusResponse.data.restmethod.outparams.status === 'Succeeded') {
            this.stage = RestExecuteStage.Ready;
        }
        this.percent = statusResponse.data?.restmethod.outparams.percentCompleted;
    }

    protected async wait(): Promise<void> {
        for (let i = 0; i < this.delay / 100; i++) {
            await new Promise(r => setTimeout(r, 100));
            if (this.stage === RestExecuteStage.Cancelled) {
                return;
            }
        }
        this.delay += this.delayIncrease;
    }

    protected async ready(): Promise<void> {
        const serviceMethod = this.service.getAsyncResultData.bind(this.service) as (options: any, httpParams?: AxiosRequestConfig) => Promise<ServiceResponse<T>>;
        const resultResponse = await this.requestCancellable<T>(serviceMethod, {PROCESSNUMBER: this.jobId});
        if (resultResponse.error || !resultResponse.data) {
            throw new Error('Can not execute process.');
        }

        this.result = resultResponse.data;
        this.stage = RestExecuteStage.Complete;
    }

    /**
     * Отменить REST-запрос.
     * Состояние выполнения установится в значение "Отменено", если в момент вызова функции выполнялось ожидание.
     * Состояние выполнения установится в значение "Ошибка", если в момент вызова функции выполнялся XHR-запрос.
     * @async
     * @method cancel
     */
    async cancel(): Promise<void> {
        if (this.cancellableRequest) {
            this.cancellableRequest.abortXhr();
        }
        this.stage = RestExecuteStage.Cancelled;
    }

}
