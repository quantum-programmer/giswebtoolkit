/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Компонент "Фильтры по семантикам объектов"             *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import FilterItemManager from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/FilterItemManager';
import SemanticFilterItem from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/SemanticFilterItem';

/**
 * Компонент "Фильтры по семантикам объектов"
 * @class GwtkMapObjectFiltersSemantics
 * @extends Vue
 */
@Component
export default class GwtkMapObjectFiltersSemantics extends Vue {

    @Prop( {
        default: () => ({})
    } )
    private readonly filterManager!: FilterItemManager;

    /**
     * Текст в поле поиска
     * @property textSearch {string}
     */
    textSearch = '';

    onlyFilled = false;

    /**
     * Заголовок количества выбранных фильтров
     * @property filtersLocalizationExtraHeadData {string}
     */
    private get filtersSemanticsExtraHeadData() {
        const selectedItemsAmount = this.filterManager.selectedSemanticFilterItems.length;

        return selectedItemsAmount ? `${this.$t( 'phrases.Selected' )}: ${selectedItemsAmount}` : '';
    }


    /**
     * Обработчик переключения состояния типа классификатор
     * @private
     * @method onCheckboxChanged
     * @param item {LocalizationFilterItem} Фильтр по локализации
     * @param recordIndex {number} Индекс записи
     * @param flag {boolean} Флаг выбора записи
     */
    private onCheckboxChanged( item: SemanticFilterItem, recordIndex: number, flag: boolean ) {
        const index = item.semanticSearchValue.indexOf( recordIndex );

        if ( !flag ) {
            item.semanticSearchValue.splice( index, 1 );
        } else {
            if ( index === -1 ) {
                item.semanticSearchValue.push( recordIndex );
            }
        }
    }

    private checkShowOnlyFilled(value: SemanticFilterItem) {
        let result = true;
        if (this.onlyFilled && !value.checkFilled) {
            result = false;
        }
        return result;
    }
}
