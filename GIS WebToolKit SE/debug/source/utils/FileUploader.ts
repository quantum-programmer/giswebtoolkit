/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Класс загрузки файла на сервер (порциями)             *
 *                                                                  *
 ********************************************************************/

import objectHash from 'object-hash';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import RequestService, { HttpParams } from '~/services/RequestServices/common/RequestService';
import RestService from '~/services/RequestServices/RestService/RestService';
import Utils from '~/services/Utils';
import { UploadAction } from '~/services/RequestServices/common/enumerables';
import { UploadFileResponse } from '~/services/RequestServices/RestService/Types';


enum ChunkState {
    Created,
    Error,
    Uploading,
    Uploaded
}

type ChunkItem = {
    position: number;
    state: ChunkState;
    abortXhr?: () => void;
}

/**
 * Класс загрузки файла на сервер (порциями)
 */
export default class FileUploader {

    private isAborted = false;

    private readonly uploadId = objectHash.MD5(Utils.generateGUID()); // Идентификатор загрузки
    private readonly restService: RestService;

    private readonly chunks: ChunkItem[] = [];
    private readonly uploadSuccess: ChunkItem[] = [];

    private uploadingChunk?: ChunkItem;
    private uploadErrorChunk?: ChunkItem;


    private readonly listeners: {
        onSuccess: ((value: UploadFileResponse['restmethod']) => void)[];
        progressChanged: ((value: number) => void)[];
        onAbort: (() => void)[];
        onError: (() => void)[];
    } = {
        onSuccess: [],
        progressChanged: [],
        onAbort: [],
        onError: []
    };

    private response?: UploadFileResponse;

    /**
     * Состояние загрузки (от 0 до 100)
     * @property progress {number}
     */
    get progress() {
        return 100 * this.uploadSuccess.length / (this.uploadSuccess.length + (this.uploadingChunk !== undefined ? 1 : 0) + this.chunks.length);
    }

    /**
     * @constructor
     * @param file {File} Файл для загрузки
     * @param httpParams {HttpParams} Параметры запроса
     * @param [chunkSize] {number} Размер порции загрузки
     */
    constructor(private readonly file: File, private readonly httpParams: HttpParams, private readonly chunkSize = 5 * 1024 * 1024) {

        if (this.chunkSize <= 0) {
            this.chunkSize = file.size;
        }

        this.httpParams.headers = {
            'Content-Type': 'application/x-binary; charset=x-user-defined',
            'Content-Disposition': `attachment; filename=${encodeURIComponent(file.name)}`
        };

        this.restService = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);

        let position = 0;
        while (position < file.size) {
            this.chunks.push({ position, state: ChunkState.Created });
            position += this.chunkSize;
        }

    }

    /**
     * Начать загрузку файла
     * @method upload
     */
    upload(): void {
        this.updateState();
    }

    /**
     * Прервать загрузку
     * @method cancel
     */
    cancel(): void {
        this.onAbortHandler();
    }

    /**
     * Подписаться на событие успешной загрузки
     * @method onSuccess
     * @param handler {Function} Функция-обработчик
     */
    onSuccess(handler: (value: UploadFileResponse['restmethod']) => void): void {
        this.listeners.onSuccess.push(handler);
    }

    /**
     * Подписаться на событие прерывания загрузки
     * @method onAbort
     * @param handler {Function} Функция-обработчик
     */
    onAbort(handler: () => void): void {
        this.listeners.onAbort.push(handler);
    }

    /**
     * Подписаться на событие ошибки загрузки
     * @method onAbort
     * @param handler {Function} Функция-обработчик
     */
    onError(handler: () => void): void {
        this.listeners.onError.push(handler);
    }

    /**
     * Подписаться на событие обновления состояния загрузки
     * @method onProgressChanged
     * @param handler {Function} Функция-обработчик
     */
    onProgressChanged(handler: (value: number) => void): void {
        this.listeners.progressChanged.push(handler);
    }

    /**
     * Загрузка порции файла на сервер
     * @private
     * @async
     * @method chunkUpload
     * @param  {ChunkItem} chunkItem Порция файла
     */
    private async chunkUpload(chunkItem: ChunkItem): Promise<void> {
        const startByte = chunkItem.position;
        const endByte = Math.min(startByte + this.chunkSize - 1, this.file.size - 1);
        const blob = this.file.slice(startByte, endByte + 1);
        this.httpParams.headers!['Content-Range'] = `bytes ${startByte}-${endByte}/${this.file.size}`;

        const cancellableRequest = RequestService.sendCancellableRequest(this.restService.uploadFile.bind(this), { file: blob, uploadId: this.uploadId, action: UploadAction.Upload }, this.httpParams);

        chunkItem.abortXhr = cancellableRequest.abortXhr;

        try {
            chunkItem.state = ChunkState.Uploading;
            this.response = (await cancellableRequest.promise).data;
            chunkItem.state = ChunkState.Uploaded;
        } catch (e) {
            chunkItem.state = ChunkState.Error;
        } finally {
            chunkItem.abortXhr = undefined;
            this.updateState();
        }
    }

    /**
     * Обновить состояние загрузки
     * @private
     * @method updateState
     */
    private updateState(): void {

        if (this.isAborted) {
            return;
        }

        if (this.uploadingChunk !== undefined) {
            if (this.uploadingChunk.state === ChunkState.Uploaded) {
                this.uploadSuccess.push(this.uploadingChunk);

                this.onProgressChangedHandler();

                if (this.uploadErrorChunk === this.uploadingChunk) {
                    this.uploadErrorChunk = undefined;
                }

                this.uploadingChunk = undefined;
            } else if (this.uploadingChunk.state === ChunkState.Error) {
                if (this.uploadErrorChunk === this.uploadingChunk) {
                    this.onErrorHandler();
                    return;
                }

                //Повторная загрузка
                this.chunks.unshift(this.uploadingChunk);
                this.uploadingChunk.state = ChunkState.Created;

                this.uploadErrorChunk = this.uploadingChunk;
                this.uploadingChunk = undefined;
            }
        }

        if (this.uploadingChunk === undefined) {
            const fileItem = this.chunks.shift();
            if (fileItem) {
                this.uploadingChunk = fileItem;
                this.chunkUpload(fileItem).catch(e => console.log(e));
            } else {
                if (this.response && this.response.restmethod.file.isComplete) {
                    this.onSuccessHandler(this.response);
                } else {
                    this.onErrorHandler();
                }
            }
        }
    }

    /**
     * Обработчик прерывания загрузки
     * @private
     * @method onAbortHandler
     */
    private onAbortHandler(): void {
        this.isAborted = true;

        if (this.uploadingChunk && this.uploadingChunk.abortXhr) {
            this.uploadingChunk.abortXhr();
        }

        this.listeners.onAbort.forEach(handler => handler());

        if (this.uploadErrorChunk !== undefined) {
            this.listeners.onError.forEach(handler => handler());
        }

        this.restService.uploadFile({ uploadId: this.uploadId, action: UploadAction.Delete }, this.httpParams).catch(e => console.error(e));
    }

    /**
     * Обработчик ошибки загрузки
     * @private
     * @method onErrorHandler
     */
    private onErrorHandler(): void {
        this.listeners.onError.forEach(handler => handler());
        this.onAbortHandler();
    }

    /**
     * Обработчик успешной загрузки
     * @private
     * @method onSuccessHandler
     */
    private onSuccessHandler(response: UploadFileResponse): void {
        this.listeners.onSuccess.forEach(handler => handler(response.restmethod));
    }

    /**
     * Обработчик обновления состояния загрузки
     * @private
     * @method onSuccessHandler
     */
    private onProgressChangedHandler(): void {
        const progress = this.progress;
        this.listeners.progressChanged.forEach(handler => handler(progress));
    }

}
