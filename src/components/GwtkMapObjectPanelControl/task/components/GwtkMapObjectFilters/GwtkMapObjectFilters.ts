/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Компонент "Объекты карты"                    *
 *                          Главная страница                        *
 *                                                                  *
 *******************************************************************/
import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkMapObjectTaskState,
    APPLY_FILTERS,
    UPDATE_FILTERS_PROGRESS_BAR, RESET_ALL_FILTERS
} from '@/components/GwtkMapObjectPanelControl/task/GwtkMapObjectTask';
import FilterItemManager from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/FilterItemManager';
import GwtkMapObjectFiltersTypes
    from '@/components/GwtkMapObjectPanelControl/task/components/GwtkMapObjectFilters/GwtkMapObjectFiltersTypes/GwtkMapObjectFiltersTypes.vue';
import GwtkMapObjectFiltersObjects
    from '@/components/GwtkMapObjectPanelControl/task/components/GwtkMapObjectFilters/GwtkMapObjectFiltersObjects/GwtkMapObjectFiltersObjects.vue';
import GwtkMapObjectFiltersLocalizations
    from '@/components/GwtkMapObjectPanelControl/task/components/GwtkMapObjectFilters/GwtkMapObjectFiltersLocalizations/GwtkMapObjectFiltersLocalizations.vue';
import GwtkMapObjectFiltersSemantics
    from '@/components/GwtkMapObjectPanelControl/task/components/GwtkMapObjectFilters/GwtkMapObjectFiltersSemantics/GwtkMapObjectFiltersSemantics.vue';

/**
 * Компонент "Параметры слоя"
 * @class GwtkMapObjectFilters
 * @extends BaseGwtkVueComponent
 */
@Component( { components: { GwtkMapObjectFiltersTypes, GwtkMapObjectFiltersObjects, GwtkMapObjectFiltersLocalizations, GwtkMapObjectFiltersSemantics } } )
export default class GwtkMapObjectFilters extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapObjectTaskState>( key: K, value: GwtkMapObjectTaskState[K] ) => void;

    @Prop( {
        default: () => ({})
    } ) filterManager!: FilterItemManager;

    @Prop( { default: 0 } ) foundObjectsNumber!: number;
    
    @Prop( { default: false } )
    readonly isReducedSizeInterface!: boolean;

    created() {
        this.filterManager.refreshVisibleObjectFilterItems();
        this.setState( UPDATE_FILTERS_PROGRESS_BAR, false );
    }

    /**
     * Применить выбранные фильтры
     * @private
     * @method filterApply
     */
    private filterApply() {
        this.setState( APPLY_FILTERS, undefined );
        this.$emit( 'filterApply' );
    }

    /**
     * Сбросить все примененные фильтры
     * @private
     * @method clearSelectedFiltersTypes
     */
    private clearSelectedFiltersTypes() {
        this.setState( RESET_ALL_FILTERS, undefined );
        this.$emit( 'filterApply' );
    }
}
