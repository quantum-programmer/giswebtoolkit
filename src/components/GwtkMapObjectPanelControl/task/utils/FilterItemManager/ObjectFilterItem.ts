/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Класс фильтра по объектам классификатора            *
 *                                                                  *
 *******************************************************************/

import { StatisticKey } from '~/services/Search/mappers/GISWebServiceSEMapper';

/**
 * Класс фильтра по объектам классификатора
 * @class ObjectFilterItem
 */
export default class ObjectFilterItem {

    /**
     * Видимость фильтра
     * @property visible {boolean}
     */
    visible = true;

    /**
     * Название объекта классификатора
     * @property name {string}
     */
    get name() {
        return this.object.name;
    }

    /**
     * Ключ объекта классификатора
     * @property objectKey {string}
     */
    get objectKey() {
        return this.object.value;
    }

    /**
     * Значение типа объекта классификатора
     * @property objectTypeName {string}
     */
    get objectTypeName() {
        return this.object.typename;
    }

    /**
     * Цифровое значения локализации объекта
     * @property objectLocalizationDigitalValue {number}
     */
    get objectLocalizationDigitalValue() {
        return Number( this.object.locale );
    }

    /**
     * Количество объектов карты с данным объектом классификатора
     * @property objectsNumber {string}
     */
    get objectsNumber() {
        return this.object.count;
    }

    /**
     * @constructor ObjectFilterItem
     * @param object {StatisticKey} Описание из статистики
     * @param layerIds {string} Список идентификаторов карт в виде строки
     * @param layerNames {string} Список названий карт в виде строки
     * @param [selected] {boolean} Флаг выбора
     */
    constructor(
        private readonly object: StatisticKey,
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

    /**
     * Переключить состояние видимости
     * @method toggleVisible
     * @param value {boolean} Флаг состояния
     */
    toggleVisible( value: boolean ) {
        this.visible = value;
        if ( !value ) {
            this.selected = false;
        }
    }
}
