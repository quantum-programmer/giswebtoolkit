/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Компонент "Фильтры по слоям классификатора"           *
 *                                                                  *
 *******************************************************************/
import { Component, Prop, Vue } from 'vue-property-decorator';
import TypeFilterItem from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/TypeFilterItem';
import FilterItemManager from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/FilterItemManager';

/**
 * Компонент "Фильтры по слоям классификатора"
 * @class GwtkMapObjectFiltersTypes
 * @extends Vue
 */
@Component
export default class GwtkMapObjectFiltersTypes extends Vue {

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
    private get filtersTypesExtraHeadData() {
        const selectedItemsAmount = this.filterManager.typeFilters.filter( typeFilterItem => typeFilterItem.selected ).length;

        return selectedItemsAmount ? `Выбрано: ${selectedItemsAmount}` : '';
    }

    /**
     * Обработчик переключения состояния фильтра
     * @private
     * @method onCheckboxChanged
     * @param item {TypeFilterItem} Фильтр по слоям классификатора
     * @param flag {boolean} Флаг выбора фильтра
     */
    private onCheckboxChanged( item: TypeFilterItem, flag: boolean ) {
        item.selected = flag;
        this.filterManager.refreshVisibleObjectFilterItems();
    }
}
