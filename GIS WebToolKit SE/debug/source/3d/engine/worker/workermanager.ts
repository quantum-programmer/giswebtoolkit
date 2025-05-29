/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Класс менеджера управления потоками                  *
 *                                                                  *
 *******************************************************************/
import ThreadRequestQueue from '~/3d/engine/worker/queues/threadrequestqueue';
import MessageQueue from '~/3d/engine/worker/queues/messagequeue';
import Mediator from '~/3d/engine/utils/Mediator';

/**
 * Класс менеджера управления потоками
 * @static
 * @class WorkerManager
 */

export default class WorkerManager {
    private static lastUpdateTime = 0;
    private static freeWorkerList: MessageQueue[] = [];
    private static threadRequestQueue: ThreadRequestQueue | null = null;
    private static active = false;

    /**
     * Запустить очереди потоков
     * @private
     * @static
     * @method run
     * @param now {number} Метка времени
     */
    private static run( now: number ) {
        requestAnimationFrame( WorkerManager.run );

        WorkerManager.threadRequestQueue?.run();
        if ( now - WorkerManager.lastUpdateTime < 33 ) {
            return;
        }

        WorkerManager.lastUpdateTime = now;
        let i = 0, worker;
        for ( ; (worker = WorkerManager.freeWorkerList[ i ]); i++ ) {
            worker.run();
        }
    }

    /**
     * Создать очередь сообщений потока
     * @private
     * @static
     * @method createWorker
     */
    private static createWorker() {
        // workerScript = workerScript || Worker;

        const worker = new MessageQueue();
        worker.start();
        this.freeWorkerList.push( worker );
    }

    /**
     * Активировать работу менеджера управления потоками
     * @static
     * @method activate
     */
    static activate() {
        this.active = true;
        this.run( 0 );
    }

    /**
     * Деактивировать работу менеджера управления потоками
     * @static
     * @method deactivate
     */
    static deactivate() {
        Mediator.unsubscribe( 'updateScene', this.run );
        for ( let i = 0; i < this.freeWorkerList.length; i++ ) {
            this.freeWorkerList[ i ].reset();
        }

        this.threadRequestQueue?.reset();

        this.active = false;
    }

    /**
     * Получить очередь сообщений потока
     * @static
     * @method getWorker
     * @return {MessageQueue} Очередь сообщений потока
     */
    static getWorker() {
        if ( !this.active ) {
            this.activate();
        }
        if ( this.freeWorkerList.length === 0 ) {
            this.createWorker();
        }
        return this.freeWorkerList[ 0 ];//TODO: пока работа только с одним потоком
    }


    /**
     * Получить очередь запросов
     * @static
     * @method getRequestQueue
     * @return {ThreadRequestQueue} Очередь запросов
     */
    static getThreadRequestQueue() {
        if ( !this.active ) {
            this.activate();
        }
        if ( this.threadRequestQueue === null ) {
            this.threadRequestQueue = new ThreadRequestQueue();
        }
        return this.threadRequestQueue;
    }
}
