/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                            Очередь сообщений                     *
 *                                                                  *
 *******************************************************************/
import BaseQueue, { MessageObject } from '~/3d/engine/worker/queues/basequeue';

import GWTKWorker from 'worker-loader?publicPath=./&filename=gwtkse/worker.js!../workerscripts/worker';

import { HttpParams } from '~/services/RequestServices/common/RequestService';
import { SimpleJson } from '~/types/CommonTypes';
import { MessageQueueCommand } from '~/3d/engine/worker/workerscripts/queue';

export interface MessageParams {
    serviceUrl?: string;
    httpParams?: HttpParams;
    options?: SimpleJson<string | undefined>;
    command: MessageQueueCommand;
}

/**
 * Класс очереди сообщений
 * @class MessageQueue
 * @extends BaseQueue
 */
export default class MessageQueue extends BaseQueue<MessageParams> {

    _worker?: GWTKWorker;

    /**
     * Запустить второй поток
     * @method start
     */
    start() {
        super.start();

        this._worker = new GWTKWorker();
        this._worker.onmessage = this._responseHandler.bind( this );
        this._worker.postMessage( [
            this.createMessageData( '1', { command: MessageQueueCommand.setup }, 0 )
        ] );
    }

    /**
     * Остановить второй поток и очистить очередь сообщений
     * @method stop
     */
    stop() {
        super.stop();
        this._worker?.terminate();
        this._worker = undefined;
    }

    /**
     * Очистить очередь сообщений
     * @method reset
     */
    reset() {
        super.reset();
        this._worker?.postMessage( [
            this.createMessageData( '1', { command: MessageQueueCommand.reset }, 0 )
        ] );
    }

    /**
     * Обработчик ответа из второго потока
     * @private
     * @method _responseHandler
     * @param ev {MessageEvent} Событие
     */
    private _responseHandler( ev: { data: { id: string; data?: SimpleJson; error?: string; }[] } ) {
        const responseList = ev.data;
        for ( let i = 0; i < responseList.length; i++ ) {
            const receivedMessageData = responseList[ i ];
            let curQueue = this.requestQueue.getHead();
            while ( curQueue ) {
                const messageObject = curQueue.getData();
                const messageData = messageObject.getMessageData();
                if ( receivedMessageData.id === messageData.id ) {
                    if ( receivedMessageData.data ) {
                        messageObject.setResponse( receivedMessageData.data );
                    } else if ( receivedMessageData.error ) {
                        messageObject.setError( receivedMessageData.error );
                    }
                    this.responseQueue.push( messageObject );
                    messageData._deathTime = -1;
                    break;
                }
                curQueue = curQueue.getNext();
            }
        }
    }

    /**
     * Обработчик массива сообщений на удаление
     * @protected
     * @method deletedMessagesHandler
     * @param messageObjects {MessageObject} Массив сообщений
     */
    protected deletedMessagesHandler( messageObjects: MessageObject<MessageParams>[] ) {
        if ( messageObjects.length > 0 ) {
            for ( let i = 0; i < messageObjects.length; i++ ) {
                const messageData = messageObjects[ i ].getMessageData();
                messageData.messageParams.command = MessageQueueCommand.deleteFromQueue;
            }
            this._worker?.postMessage( messageObjects.map( ( messageObject ) => messageObject.getMessageData() ) );
        }
    }

    /**
     * Обработчик массива сообщений на отправку
     * @protected
     * @method processedMessagesHandler
     * @param messageObjects {MessageObject} Массив сообщений
     */
    protected processedMessagesHandler( messageObjects: MessageObject<MessageParams>[] ) {
        if ( messageObjects.length > 0 ) {
            this._worker?.postMessage( messageObjects.map( ( messageObject ) => messageObject.getMessageData() ) );
        }
    }

    /**
     * Обработчик массива полученных сообщений из второго потока
     * @protected
     * @method receivedMessagesHandler
     * @param messageObjects {MessageObject} Массив сообщений
     */
    protected receivedMessagesHandler( messageObjects: MessageObject<MessageParams>[] ) {
        if ( messageObjects.length > 0 ) {
            for ( let i = 0; i < messageObjects.length; i++ ) {
                const messageObject = messageObjects[ i ];
                messageObject.runCallback();
            }
            const receivedObjects = messageObjects.map( ( messageObject ) => {
                const messageData = messageObject.getMessageData();
                return { id: messageData.id, messageParams: { command: MessageQueueCommand.received } };
            } );
            this._worker?.postMessage( receivedObjects );
        }
    }
}
