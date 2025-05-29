/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                            Очередь                               *
 *                                                                  *
 *******************************************************************/
import { SimpleJson } from '~/types/CommonTypes';
import { ServiceResponse } from '~/services/Utils/Types';
import DoubleLinkedList, { NodeDLL } from '~/3d/engine/utils/doublelinkedlist';

interface CallbackList<T> {
    onLoad: ( result: ServiceResponse<SimpleJson>, messageData?: MessageData<T> ) => void;
    onError?: ( result: string, messageData?: MessageData<T> ) => void;
}

/**
 * Класс очереди запросов
 * @abstract
 * @class BaseQueue
 */
export default abstract class BaseQueue<T> {
    protected requestQueue = new DoubleLinkedList<MessageObject<T>>();
    protected responseQueue = new DoubleLinkedList<MessageObject<T>>();
    protected mCurrentNodeQueue: NodeDLL<MessageObject<T>>[] = [];
    protected deletedMessageObjects: MessageObject<T>[] = [];
    protected receivedMessageObjects: MessageObject<T>[] = [];
    protected processedMessageObjects: MessageObject<T>[] = [];
    protected gTime = Date.now();

    protected running = false;

    static DEFAULT_LIVE_TIME = 67;


    /**
     * Запустить очередь
     * @method start
     */
    start() {
        this.running = true;
    }

    /**
     * Остановить второй поток и очистить очередь сообщений
     * @method stop
     */
    stop() {
        this.running = false;
        this.reset();
    }

    /**
     * Остановить и очистить очередь запросов
     * @method destroy
     */
    destroy() {
        this.reset();
        this.mCurrentNodeQueue.length = 0;
    }

    /**
     * Очистить очередь запросов
     * @method reset
     */
    reset() {
        this.cleanQueue( true );
        this.requestQueue.clear();
        this.responseQueue.clear();
    }

    /**
     * Отправить запрос
     * @method post
     * @param messageData {MessageData} Данные запроса
     * @param callbacks {CallbackList} Обработчик ответа
     */
    post( messageData: MessageData<T>, callbacks: CallbackList<T> ) {

        //check in responseQueue
        let isAlreadyDone = false;
        let curNode = this.responseQueue.getHead();
        while ( curNode ) {
            const messageObject = curNode.getData();
            const currRequestData = messageObject.getMessageData();
            if ( currRequestData.id === messageData.id ) {
                isAlreadyDone = true;
                break;
            }
            curNode = curNode.getNext();
        }
        if ( !isAlreadyDone ) {
            let newNode = true;
            curNode = this.requestQueue.getHead();
            while ( curNode ) {
                const messageObject = curNode.getData();
                const currRequestData = messageObject.getMessageData();
                if ( currRequestData.id === messageData.id ) {
                    currRequestData._t = messageData._t;
                    currRequestData._deathTime = messageData._deathTime;

                    newNode = false;
                    break;
                }
                curNode = curNode.getNext();
            }
            if ( newNode ) {
                const requestInfo = new MessageObject<T>( messageData, callbacks );
                this.requestQueue.push( requestInfo );
            }
        }
    }

    /**
     * Обработать очередь на отправку/прием
     * @method run
     */
    run() {
        this.cleanQueue();
        this.checkResponse();
        this.processQueue();
        this.gTime = Date.now();
        this.deletedMessagesHandler( this.deletedMessageObjects );
        this.receivedMessagesHandler( this.receivedMessageObjects );
        this.processedMessagesHandler( this.processedMessageObjects );
    }

    /**
     * Создать данные запроса
     * @method createMessageData
     * @param id {string} Идентификатор запроса
     * @param messageParams {object} Параметры для запроса
     * @param priority {number} Приоритет запроса
     * @param [liveTime] {number} Время жизни запроса
     * @return {MessageData} Данные запроса
     */
    createMessageData( id: string, messageParams: T, priority: number, liveTime = BaseQueue.DEFAULT_LIVE_TIME ) {
        return new MessageData<T>( id, messageParams, priority, liveTime );
    }

    /**
     * Очистить очередь от неактуальных запросов
     * @protected
     * @method cleanQueue
     * @param [forceClean] {boolean} Флаг принудительного очищения
     */
    protected cleanQueue( forceClean?: true ) {
        let curNode = this.requestQueue.getHead();
        this.deletedMessageObjects.length = 0;
        while ( curNode ) {
            const messageObject = curNode.getData();
            if ( forceClean || this.gTime > messageObject.getMessageData()._deathTime ) {
                const next = curNode.getNext();
                const prev = curNode.getPrev();
                this.requestQueue.deleteNode( curNode );
                if ( messageObject.getMessageData()._deathTime !== -1 ) {
                    this.deletedMessageObjects.push( messageObject );
                }
                if ( prev ) {
                    curNode = prev.getNext();
                } else if ( next ) {
                    curNode = next;
                } else {
                    break;
                }
            } else {
                curNode = curNode.getNext();
            }
        }
    }

    /**
     * Проверить наличие ответа на запрос
     * @protected
     * @method checkResponse
     */
    protected checkResponse() {

        let curNode = this.responseQueue.getHead();
        while ( curNode ) {
            this.mCurrentNodeQueue.push( curNode );
            curNode = curNode.getNext();
        }
        this.mCurrentNodeQueue.sort( function ( a, b ) {
            return a.getData().getMessageData().priority - b.getData().getMessageData().priority;
        } );

        const count = Math.min( 1, this.mCurrentNodeQueue.length );
        this.receivedMessageObjects.length = 0;
        for ( let i = 0; i < count; i++ ) {
            const curNode = this.mCurrentNodeQueue[ i ];
            const messageObject = curNode.getData();
            this.responseQueue.deleteNode( curNode );
            this.receivedMessageObjects.push( messageObject );
        }
        this.mCurrentNodeQueue.length = 0;
    }

    /**
     * Продвинуть очередь
     * @protected
     * @method processQueue
     */
    protected processQueue() {

        let curNode = this.requestQueue.getHead();
        while ( curNode ) {
            const messageObject = curNode.getData();
            if ( messageObject.abortXhr === undefined && !messageObject.isDone() ) {
                this.mCurrentNodeQueue.push( curNode );
            }
            curNode = curNode.getNext();
        }
        this.mCurrentNodeQueue.sort( function ( a, b ) {
            return a.getData().getMessageData().priority - b.getData().getMessageData().priority;
        } );

        const count = this.mCurrentNodeQueue.length;
        this.processedMessageObjects.length = 0;
        for ( let i = 0; i < count; i++ ) {
            const curNode = this.mCurrentNodeQueue[ i ];
            const messageObject = curNode.getData();
            this.processedMessageObjects.push( messageObject );
        }

        this.mCurrentNodeQueue.length = 0;
    }

    /**
     * Обработчик массива сообщений на удаление
     * @protected
     * @abstract
     * @method deletedMessagesHandler
     * @param messageObjects {MessageObject} Массив сообщений
     */
    protected abstract deletedMessagesHandler( messageObjects: MessageObject<T>[] ): void;

    /**
     * Обработчик массива сообщений на отправку
     * @protected
     * @abstract
     * @method processedMessagesHandler
     * @param messageObjects {MessageObject} Массив сообщений
     */
    protected abstract processedMessagesHandler( messageObjects: MessageObject<T>[] ): void;

    /**
     * Обработчик массива полученных сообщений из второго потока
     * @protected
     * @method receivedMessagesHandler
     * @param messageObjects {MessageObject} Массив сообщений
     */
    protected receivedMessagesHandler( messageObjects: MessageObject<T>[] ) {
        for ( let i = 0; i < messageObjects.length; i++ ) {
            const messageObject = messageObjects[ i ];
            messageObject.runCallback();
        }
    }

}

/**
 * Класс информации о запросе
 * @class MessageObject
 * @param message {MessageData} Данные запроса
 * @param callback {CallbackList} Обработчик ответа
 */
export class MessageObject<T> {
    state = false;
    private responseData?: SimpleJson;
    private errorData?: string;
    abortXhr?: ( message?: string ) => void;
    callbacks: CallbackList<T>;
    messageData: MessageData<T>;

    constructor( message: MessageData<T>, callbacks: CallbackList<T> ) {
        this.messageData = message;
        this.callbacks = callbacks;
    }

    /**
     * Получить данные запроса
     * @method getMessageData
     * @return {MessageData} Данные запроса
     */
    getMessageData() {
        return this.messageData;
    }

    /**
     * Установить данные ошибки
     * @method setError
     * @param value {string} Данные ошибки
     */
    setError( value: string ) {
        this.errorData = value;
    }

    /**
     * Установить данные ответа
     * @method setResponse
     * @param value {SimpleJson} Данные ответа
     */
    setResponse( value: SimpleJson ) {
        this.responseData = value;
    }

    /**
     * Получить информацию о выполнении запроса
     * @method isDone
     * @return {boolean} Флаг выполненного запроса
     */
    isDone() {
        return !!(this.responseData || this.errorData);
    }

    /**
     * Запустить обработчик ответа
     * @method runCallback
     */
    runCallback() {
        if ( this.responseData && this.callbacks.onLoad ) {
            this.callbacks.onLoad( this.responseData, this.messageData );
        } else if ( this.errorData && this.callbacks.onError ) {
            this.callbacks.onError( this.errorData, this.messageData );
        }
    }
}

/**
 * Класс данных для запроса
 * @class MessageData
 * @param id {string} Идентификатор запроса
 * @param messageParams {object} Данные
 * @param priority {number} Приоритет запроса
 * @param liveTime {number} Время жизни запроса
 */
export class MessageData<T> {
    id: string;
    messageParams: T;
    priority: number;
    _t: number;
    _deathTime: number;

    constructor( id: string, messageParams: T, priority: number, liveTime: number ) {
        this.id = id;
        this.messageParams = messageParams;
        this.priority = priority;
        this._t = Date.now();
        this._deathTime = this._t + liveTime;
    }
}
