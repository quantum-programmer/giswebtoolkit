/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Класс фильтра по локализациям                  *
 *                                                                  *
 *******************************************************************/

import { LOCALE } from '~/types/CommonTypes';

/**
 * Класс фильтра по локализациям
 * @class LocalizationFilterItem
 */
export default class LocalizationFilterItem {

    /**
     * Название локализации
     * @property name {string}
     */
    get name() {
        let result: string;
        switch ( this.nameCount ) {
            case 'SquareCount':
                result = 'Areal';
                break;
            case 'PointCount':
                result = 'Points';
                break;
            case 'TextCount':
                result = 'Signatures';
                break;
            case 'VectorCount':
                result = 'Vector';
                break;
            default:
                result = 'Linear';
                break;
        }

        return result;
    }

    /**
     * Цифровое значения локализации
     * @property localizationDigitalValue {LOCALE}
     */
    get localizationDigitalValue() {
        switch ( this.nameCount ) {
            case 'SquareCount':
                return LOCALE.Plane;
            case 'PointCount':
                return LOCALE.Point;
            case 'TextCount':
                return LOCALE.Text;
            case 'VectorCount':
                return LOCALE.Vector;
            default:
                return LOCALE.Line;
        }
    }

    /**
     * Список идентификаторов карт в виде строки
     * @property layerNames {string}
     */
    layerIds = '';

    /**
     * Список названий карт в виде строки
     * @property layerNames {string}
     */
    layerNames = '';

    /**
     * @constructor LocalizationFilterItem
     * @param nameCount {number} Название из статистики
     * @param objectsNumber {string} Количество объектов с данной локализацией из статистики
     * @param [selected] {boolean} Флаг выбора
     */
    constructor(
        public readonly nameCount: string,
        public readonly objectsNumber: number,
        public selected: boolean = false
    ) {

    }

    /**
     * Переключить состояние выбора
     * @method toggleSelected
     * @param value {boolean} Флаг состояния
     */
    toggleSelected( value: boolean ) {
        this.selected = value;
    }
}
