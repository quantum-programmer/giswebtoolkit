/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент "Примененный фильтр"                 *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import LocalizationFilterItem from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/LocalizationFilterItem';
import { SelectedFilterItem } from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/FilterItemManager';

/**
 * Компонент "Примененный фильтр"
 * @class GwtkMapObjectFilters
 * @extends Vue
 */
@Component
export default class GwtkMapObjectFilters extends Vue {

    @Prop( { default: () => ([]) } ) selectedFiltersTypes!: SelectedFilterItem[];

    /**
     * Получить отображаемое название из названия
     * @private
     * @method formTextValue
     * @param item {SelectedFilterItem} Фильтр
     * @return {string} Отображаемое название
     */
    formTextValue( item: SelectedFilterItem ) {
        //todo: сервис должен прислать значение
        if ( item instanceof LocalizationFilterItem ) {
            return this.$t( 'phrases.' + item.name );
        }
        return item.name;
    }
}
