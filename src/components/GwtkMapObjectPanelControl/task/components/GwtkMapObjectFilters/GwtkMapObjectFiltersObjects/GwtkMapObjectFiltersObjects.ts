/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Компонент "Фильтры по объектам классификатора"         *
 *                                                                  *
 *******************************************************************/
import { Component, Prop, Vue } from 'vue-property-decorator';
import ObjectFilterItem from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/ObjectFilterItem';
import FilterItemManager from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/FilterItemManager';

/**
 * Компонент "Фильтр по объектам классификатора"
 * @class GwtkMapObjectFiltersObjects
 * @extends Vue
 */
@Component
export default class GwtkMapObjectFiltersObjects extends Vue {

    @Prop( {
        default: () => ({})
    } )
    private readonly filterManager!: FilterItemManager;

    /**
     * Текст в поле поиска
     * @property textSearch {string}
     */
    textSearch = '';

    /**
     * Заголовок количества выбранных фильтров
     * @property filtersLocalizationExtraHeadData {string}
     */
    private get filtersObjectExtraHeadData() {
        const selectedItemsAmount = this.filterManager.objectFilters.filter( objectFilterItem => objectFilterItem.selected ).length;
        return selectedItemsAmount ? `Выбрано: ${selectedItemsAmount}` : '';
    }

    /**
     * Обработчик переключения состояния фильтра
     * @private
     * @method onCheckboxChanged
     * @param item {ObjectFilterItem} Фильтр по объектам классификатора
     * @param flag {boolean} Флаг выбора фильтра
     */
    private onCheckboxChanged( item: ObjectFilterItem, flag: boolean ) {
        item.toggleSelected( flag );
        this.filterManager.refreshVisibleSemanticFilterItems();
    }
}
