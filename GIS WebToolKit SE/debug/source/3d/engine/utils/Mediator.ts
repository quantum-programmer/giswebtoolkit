/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Компонент медиатор                            *
 *                                                                  *
 *******************************************************************/


type SubscribeFunction = ( ...args: any ) => void;

interface Subscriber {
    update: SubscribeFunction;
}

type Channels = {
    [ key: string ]: (Subscriber | SubscribeFunction)[];
}

/**
 * Медиатор
 * @class Mediator
 */
class Mediator {

    private readonly channels: Channels = {};


    /**
     * Вызвать обработчики подписчиков канала
     * @method publish
     * @param channel {string} Идентификатор канала
     * @param args {...array} Дополнительные параметры
     */
    publish( channel: string, ...args: any[] ) {
        const channelList = this.channels[ channel ];
        if ( !channelList ) {
            return false;
        }

        const count = channelList.length;
        for ( let i = 0; i < count; i++ ) {
            const subscription = channelList[ i ];
            if ( subscription !== undefined ) {
                if ( subscription instanceof Function ) {
                    subscription( ...args );
                } else if ( subscription.update instanceof Function ) {
                    subscription.update( ...args );
                }
            }
        }
    }

    /**
     * Подписаться на канал
     * @method subscribe
     * @param channel {string} Идентификатор канала
     * @param mObserver {Subscriber | SubscribeFunction} Функция-обработчик, либо объект с методом `update()`
     */
    subscribe( channel: string, mObserver: Subscriber | SubscribeFunction ) {
        if ( !((mObserver instanceof Function || mObserver.update instanceof Function)) ) {
            console.error( 'Cannot subscribe to observer' );
        } else {
            if ( !(this.channels[ channel ]) ) {
                this.channels[ channel ] = [];
            }
            const subscribers = this.channels[ channel ];
            const ind = subscribers.indexOf( mObserver );
            if ( ind === -1 ) {
                this.channels[ channel ].push( mObserver );
            }
        }
    }

    /**
     * Отписаться от канала
     * @method unsubscribe
     * @param channel {string} Идентификатор канала
     * @param mObserver {Subscriber | SubscribeFunction} Функция-обработчик, либо объект с методом `update()`
     */
    unsubscribe( channel: string, mObserver: Subscriber | SubscribeFunction ) {
        const subscribers = this.channels[ channel ];
        if ( subscribers ) {
            const ind = subscribers.indexOf( mObserver );
            if ( ind !== -1 ) {
                if ( subscribers.length === 1 ) {
                    subscribers.length = 0;
                } else {
                    subscribers.splice( ind, 1 );
                }
            }
        }
    }

    /**
     * Очистить все каналы
     * @method clear
     */
    clear() {
        for ( const channelsKey in this.channels ) {
            delete this.channels[ channelsKey ];
        }
    }
}

export default new Mediator();


