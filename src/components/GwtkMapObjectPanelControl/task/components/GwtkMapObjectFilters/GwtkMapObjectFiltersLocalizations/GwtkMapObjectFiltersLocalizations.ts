/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Компонент "Фильтры по локализциям объектов"            *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import LocalizationFilterItem
    from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/LocalizationFilterItem';
import FilterItemManager from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/FilterItemManager';

/**
 * Компонент "Фильтр по локализциям объектов"
 * @class GwtkMapObjectFiltersLocalizations
 * @extends Vue
 */
@Component
export default class GwtkMapObjectFiltersLocalizations extends Vue {

    @Prop( {
        default: () => ({})
    } )
    private readonly filterManager!: FilterItemManager;

    /**
     * Заголовок количества выбранных фильтров
     * @property filtersLocalizationExtraHeadData {string}
     */
    private get filtersLocalizationExtraHeadData() {
        const selectedItemsAmount = this.filterManager.localizationFilters.filter( localizationFilterItem => localizationFilterItem.selected ).length;
        return selectedItemsAmount ? `Выбрано: ${selectedItemsAmount}` : '';
    }

    /**
     * Обработчик переключения состояния фильтра
     * @private
     * @method onCheckboxChanged
     * @param item {LocalizationFilterItem} Фильтр по локализации
     * @param flag {boolean} Флаг выбора фильтра
     */
    private onCheckboxChanged( item: LocalizationFilterItem, flag: boolean ) {
        item.selected = flag;
        this.filterManager.refreshVisibleObjectFilterItems();
    }
}
