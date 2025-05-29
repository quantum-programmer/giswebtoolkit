/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Класс фильтра по слоям классификатора             *
 *                                                                  *
 *******************************************************************/

import { StatisticType } from '~/services/Search/mappers/GISWebServiceSEMapper';

/**
 * Класс фильтра по слоям классификатора
 * @class TypeFilterItem
 */
export default class TypeFilterItem {

    /**
     * Название слоя классификатора
     * @property name {string}
     */
    get name() {
        return this.type.name;
    }

    /**
     * Значение слоя классификатора
     * @property typeValue {string}
     */
    get typeValue() {
        return this.type.value;
    }

    /**
     * Количество объектов карты с данного слоя классификатора
     * @property objectsNumber {string}
     */
    get objectsNumber() {
        return this.type.count;
    }

    /**
     * @constructor TypeFilterItem
     * @param type {StatisticType} Описание из статистики
     * @param layerIds {string} Список идентификаторов карт в виде строки
     * @param layerNames {string} Список названий карт в виде строки
     * @param [selected] {boolean} Флаг выбора
     */
    constructor(
        private readonly type: StatisticType,
        public readonly layerIds: string,
        public readonly layerNames: string,
        public selected: boolean = false
    ) {

    }

    /**
     * Проверить попадание в контекстный поиск
     * @method checkContextSearch
     * @param searchValue {string}
     * @return {boolean} Флаг попадания в контекстный поиск
     */
    checkContextSearch( searchValue: string ) {
        return !searchValue || this.name.toLowerCase().includes( searchValue.toLowerCase() );
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
