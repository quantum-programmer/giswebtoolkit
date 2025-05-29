/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                            Очередь запросов                      *
 *                                                                  *
 *******************************************************************/
import { SimpleJson } from '~/types/CommonTypes';
import RequestService, { HttpParams, StandardRequest } from '~/services/RequestServices/common/RequestService';
import BaseQueue, { MessageObject } from '~/3d/engine/worker/queues/basequeue';

export interface RequestParams {
    serviceUrl: string;
    httpParams: HttpParams;
    options?: SimpleJson<string | undefined>;
    requestMethod: StandardRequest<SimpleJson<string | undefined> | undefined>;
}

/**
 * Класс очереди запросов
 * @class ThreadRequestQueue
 * @extends BaseQueue
 */
export default class ThreadRequestQueue extends BaseQueue<RequestParams> {
    _activeRequestCountList: SimpleJson<number> = {};
    static DEFAULT_REQUEST_COUNT = 6;

    /**
     * Обработчик массива сообщений на удаление
     * @protected
     * @method deletedMessagesHandler
     * @param messageObjects {MessageObject} Массив сообщений
     */
    protected deletedMessagesHandler( messageObjects: MessageObject<RequestParams>[] ) {
        for ( let i = 0; i < messageObjects.length; i++ ) {
            const messageObject = messageObjects[ i ];
            if ( messageObject.abortXhr ) {
                messageObject.abortXhr( 'AbortRequest' );
            }
        }
    }

    /**
     * Обработчик массива сообщений на отправку
     * @protected
     * @method processedMessagesHandler
     * @param messageObjects {MessageObject} Массив сообщений
     */
    protected processedMessagesHandler( messageObjects: MessageObject<RequestParams>[] ) {
        for ( let i = 0; i < messageObjects.length; i++ ) {
            const messageObject = messageObjects[ i ];
            const messageData = messageObject.getMessageData();
            const { requestMethod, options, httpParams } = messageData.messageParams;

            if ( this._activeRequestCountList[ httpParams.url ] === undefined ) {
                this._activeRequestCountList[ httpParams.url ] = 0;
            }
            if ( this._activeRequestCountList[ httpParams.url ] < ThreadRequestQueue.DEFAULT_REQUEST_COUNT ) {
                const cRequest = RequestService.sendCancellableRequest<typeof options>( requestMethod, options, httpParams );
                messageObject.abortXhr = cRequest.abortXhr;
                cRequest.promise.then( ( result ) => {
                    messageObject.setResponse( result as SimpleJson );
                } ).catch( ( e: Error ) => {
                    messageObject.setError( e.message );
                } ).finally( () => {
                    messageData._deathTime = -1;
                    this.responseQueue.push( messageObject );
                    this._activeRequestCountList[ httpParams.url ]--;
                } );
                this._activeRequestCountList[ httpParams.url ]++;
            }
        }
    }
}
