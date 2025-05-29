/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Класс наблюдаемого объекта                      *
 *                                                                  *
 *******************************************************************/


interface Subscriber {
    update( ver: number ): void;
}

/**
 * Класс наблюдаемого объекта
 * @class Observable
 */
export default class Observable {

    /**
     * Версия параметров
     * @private
     * @property version {number}
     */
    protected version = 0;

    /**
     * Список подписчиков
     * @private
     * @readonly
     * @property subscribers {Subscriber[]}
     */
    private readonly subscribers: Subscriber[] = [];

    /**
     * Уведомить подписчиков об изменениях
     * @protected
     * @method notify
     */
    protected notify() {
        for ( let i = 0; i < this.subscribers.length; i++ ) {
            this.subscribers[ i ].update( this.version );
        }
    }

    /**
     * Подписать объект на уведомления об изменениях
     * @method subscribe
     * @param sub {Subscriber} Подписчик
     */
    subscribe( sub: Subscriber ) {
        this.subscribers.push( sub );
    }

    /**
     * Отписать объект от уведомлений об изменениях
     * @method unsubscribe
     * @param sub {Subscriber} Подписчик
     */
    unsubscribe( sub: Subscriber ) {
        this.subscribers.splice( this.subscribers.indexOf( sub ), 1 );
    }
}
