/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Родительский класс логики компонента                   *
 *                                                                  *
 *******************************************************************/

import { GwtkMap } from '~/types/Types';
import CommonState from '~/utils/CommonState';
import { ContainsSomeOf } from '~/types/CommonTypes';
import MapWindow from '~/MapWindow';

/**
 * Родительский класс логики компонента
 * @abstract
 * @class ComponentImpl
 */
export default abstract class ComponentImpl<T extends object = object> {

    /**
     * Экземпляр карты
     * @protected
     * @readonly
     * @property map {GwtkMap}
     */
    protected readonly map: GwtkMap;

    /**
     * Экземпляр окна приложения
     * @protected
     * @readonly
     * @property mapVue {MapWindow}
     */
    protected readonly mapVue: MapWindow;

    /**
     * Состояние компонента
     * @protected
     * @readonly
     * @property _state {SimpleJson}
     */
    protected _state: CommonState<T>;

    /**
     * @constructor ComponentImpl
     * @param mapVue {MapWindow} Экземпляр окна приложения
     * @param state {CommonState} Экземпляр состояния
     */
    constructor( mapVue: MapWindow, state: CommonState<T> ) {
        this.mapVue = mapVue;
        this.map = mapVue.getMap();
        this._state = state;
    }

    /**
     * Cостояние компонента
     * @property state {CommonState}
     */
    get state() {
        return this._state;
    }

    /**
     * Установить состояние компонента
     * @method setState
     * @param value {object} Объект с параметрами
     */
    setState( value: ContainsSomeOf<T> ) {
        this._state.setProperties( value );
    }
}
