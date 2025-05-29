/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Класс обработчика сообщений потока                  *
 *                                                                  *
 *******************************************************************/

import { MessageParams } from '~/3d/engine/worker/queues/messagequeue';
import { MessageData } from '~/3d/engine/worker/queues/basequeue';
import { Canceler, AxiosRequestConfig } from 'axios';
import { ExceptionJSON } from '~/services/Utils/Utils';
import RequestService, { StandardRequest } from '~/services/RequestServices/common/RequestService';
import { SimpleJson } from '~/types/CommonTypes';

export enum MessageState {
    stopped,
    inProcess,
    received,
    done,
    sent,
    reSend
}

export enum MessageQueueCommand {
    'updateSettings' = -3,
    'reset' = -2,
    'setup' = -1,
    'received' = 0,
    'deleteFromQueue' = 1,
    'loadHeight' = 2,
    'loadImage' = 3,
    'setupParser3dTiles' = 4,
    'load3dTile' = 5,
    'load3dTileTexture' = 6,
    'load3dTileMaterial' = 7,
    'setupParser3d' = 8,
    'loadParserTextures3d' = 9,
    'loadWFS' = 10,
    'heightInPoint' = 11,
    'createServiceObject' = 12,
    'loadHeightTileHeaders' = 13,
    'createHeightTile' = 14,
    'setupParser3dByClassifier' = 15,
    'createUntiledObject' = 16, // TODO= untiled
    'getScenarioParam' = 17,
    'getTrackForScenario' = 18
}

export type AnyQueueObject = QueueObject<SimpleJson<any>, SimpleJson<any>>;

/**
 * Класс обработчика сообщения потока
 * @abstract
 * @class QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export abstract class QueueObject<T, R = null> {
    id: string;
    params: MessageParams & T;
    command: MessageQueueCommand;
    priority: number;
    _t: number;
    state: MessageState;
    responseData?: {
        id: QueueObject<T>['id'];
        command: QueueObject<T>['command'];
        params: QueueObject<T>['params'];
        data: R,
        error?: { message: string; }
    };
    responseBufferList?: ArrayBufferLike[];
    activeRequest: boolean = false;

    mRequest?: string;
    mAbortMethod?: Canceler;

    constructor( messageData: MessageData<QueueObject<T>['params']> ) {
        this.id = messageData.id;
        this.params = messageData.messageParams;
        this.command = messageData.messageParams[ 'command' ];
        this.priority = messageData[ 'priority' ];
        this._t = messageData._t;
        this.state = MessageState.stopped;
    }

    /**
     * Запустить процесс
     * @abstract
     * @method runProcess
     */
    abstract runProcess(): void;

    /**
     * Запустить обработку ответа
     * @abstract
     * @method runReceive
     * @param response {object} Ответ
     */
    abstract runReceive( response?: unknown ): void;

    /**
     * Запустить обработку повторной отправки запроса
     * @protected
     * @method runReSend
     */
    protected runReSend() {
        this.state = MessageState.reSend;
    }

    /**
     * Запустить обработку отмены запроса
     * @protected
     * @method runAbort
     */
    protected runAbort() {
        this.state = MessageState.stopped;
    }

    /**
     * Запустить обработку ошибки запроса
     * @protected
     * @method runError
     * @param e{ExceptionJSON} Описание ошибки
     * @param data {object} Данные
     */
    protected runError( e: ExceptionJSON, data: R ) {
        if ( this.state === MessageState.stopped || this.state === MessageState.reSend ) {
            return;
        }
        this.responseData = {
            data,
            error: { message: e.exceptionText },
            command: this.command,
            id: this.id,
            params: this.params
        };

        this.state = MessageState.received;
    }

    /**
     * Запуск процессса после обработки ответа
     * @method runPostReceive
     */
    runPostReceive() {
        this.state = MessageState.done;
    }

    /**
     * Создать запрос с возможностью его отмены
     * @protected
     * @method createXhr
     * @param requestMethod {StandardRequest} Метод запроса
     * @param options {object} Параметры запроса
     * @param httpParams {AxiosRequestConfig} Конфигурация запроса
     * @return {object} Объект запроса
     */
    protected createXhr<T = SimpleJson<string | undefined>>( requestMethod: StandardRequest<T>, options: T, httpParams?: AxiosRequestConfig ) {
        const cancellableRequest = RequestService.sendCancellableRequest( requestMethod, options, httpParams );
        cancellableRequest.promise.then( (response) => {
            this.runReceive(response);
        } ).catch(
            ( e: Error ) => {
                try {
                    const errorObject = JSON.parse( e.message ) as ExceptionJSON;
                    if ( errorObject.exceptionCode === 'AbortRequest' ) {
                        this.runAbort();
                    } else if ( errorObject.exceptionCode === 'InternalServerError' ) {
                        this.runReSend();
                    }
                    this.runError( errorObject, this.ErrorObject );
                } catch ( error ) {
                    this.runError( { exceptionCode: 'Undefined', exceptionText: e.message }, this.ErrorObject );
                }
            }
        );
        return cancellableRequest;
    }

    /**
     * Проверить, находится ли запрос в состоянии выполнения
     * @protected
     * @method checkInProcess
     * @return {boolean} Запрос в состоянии выполнения
     */
    protected checkInProcess = () => this.state !== MessageState.stopped && this.state !== MessageState.reSend;

    /**
     * Объект для ответа в случае ошибки
     * @property ErrorObject
     */
    protected ErrorObject: R = {} as R;

}
