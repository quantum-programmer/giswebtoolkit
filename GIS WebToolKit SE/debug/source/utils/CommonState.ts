/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Класс состояния                             *
 *                                                                  *
 *******************************************************************/

import { ContainsSomeOf } from '~/types/CommonTypes';
import Observable from '~/utils/Observable';

/**
 * Родительский класс состояния
 * @class CommonState
 */
export default class CommonState<T extends object> extends Observable {

    /**
     * Хранилище состояния
     * @protected
     * @readonly
     * @property _state {object}
     */
    protected readonly _state: T;

    /**
     * @constructor CommonState
     * @param state {object} Объект с параметрами
     */
    constructor( state: T ) {
        super();
        this._state = state;
    }

    /**
     * Получить значение свойства
     * @method setProperty
     * @param key {string} Название свойства
     * @return {object} Значение свойства
     */
    getProperty<K extends keyof T>( key: K ): T[K] {
        return this._state[ key ];
    }

    /**
     * Задать значение свойства
     * @method setProperty
     * @param key {string} Название свойства
     * @param value {object} Значение свойства
     * @param [lock] {boolean} Блокирование уведомления об изменениях
     */
    setProperty<K extends keyof T>( key: K, value: T[K], lock?: true ) {
        //todo: пока для сложных объектов всегда уведомление
        if ( this._state[ key ] !== value || typeof this._state === 'object' ) {
            this._state[ key ] = value;
            this.version++;
            if ( !lock ) {
                this.notify();
            }
        }
    }

    /**
     * Задать набор свойств
     * @method setProperties
     * @param state {object} Объект с параметрами
     * @param [lock] {boolean} Блокирование уведомления об изменениях
     */
    setProperties( state: ContainsSomeOf<T>, lock?: true ) {
        let key: keyof T;
        for ( key in state ) {
            if ( Reflect.has(this._state, key) ) {
                const value = state[key] as T[keyof T];
                if (value !== undefined) {
                    this.setProperty(key, value, true);
                    if ( !lock ) {
                        this.notify();
                    }
                }
            }
        }
    }
}

