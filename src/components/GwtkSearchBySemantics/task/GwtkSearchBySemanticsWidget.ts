/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Виджет компонента "Поиск по семантике"               *
 *                                                                  *
 *******************************************************************/


import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import GwtkSearchBySemanticsTask, {
    ALL_SEMANTICS_ID,
    CHANGE_VISIBLE_ON_CURRENT_SCALE,
    GwtkSearchBySemanticsTaskState,
    PERFORM_SEARCH,
    RESET_ALL,
    SelectableItems,
    SELECTED_LAYER_ID,
    SELECTED_SEARCH_TAB,
    SearchTab, ObjectNumberSearchParams, MeasurementSearchParams, SemanticSearchParams
} from '@/components/GwtkSearchBySemantics/task/GwtkSearchBySemanticsTask';
import GwtkSearchByObjectNumber from '@/components/GwtkSearchBySemantics/task/components/GwtkSearchByObjectNumber.vue';
import GwtkSearchByMeasurements from '@/components/GwtkSearchBySemantics/task/components/GwtkSearchByMeasurements.vue';
import GwtkSearchBySemantics from '@/components/GwtkSearchBySemantics/task/components/GwtkSearchBySemantics.vue';

/**
 * Виджет компонента
 * @class GwtkSearchBySemanticsWidget
 * @extends BaseGwtkVueComponent
 */
@Component({ components: { GwtkSearchByObjectNumber, GwtkSearchByMeasurements, GwtkSearchBySemantics } })
export default class GwtkSearchBySemanticsWidget extends BaseGwtkVueComponent {

    @Prop({ default: '' })
    readonly taskId!: string;

    @Prop({ default: () => ({}) })
    readonly description!: TaskDescription;

    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkSearchBySemanticsTaskState>(key: K, value: GwtkSearchBySemanticsTaskState[K]) => void;

    @Prop({ default: false })
    readonly visibleOnCurrentScale!: boolean;

    @Prop({ default: () => ([]) })
    readonly layersList!: SelectableItems[];

    @Prop({ default: () => ('') })
    readonly selectedLayerId!: string;

    @Prop({ default: undefined })
    readonly activeRequestCancelHandler!: () => void;

    @Prop({ default: -1 })
    readonly searchTab!: SearchTab;

    @Prop({ default: () => ({}) })
    readonly semanticSearchParams!: SemanticSearchParams;

    @Prop({ default: () => ({}) })
    readonly objectNumberSearchParams!: ObjectNumberSearchParams;

    @Prop({ default: () => ({}) })
    readonly measurementSearchParams!: MeasurementSearchParams;


    /**
     * Активность кнопок управления
     * @property isDisabled
     */
    get isDisabled() {
        const measurementFilled = GwtkSearchBySemanticsTask.checkMeasurementFilled(this.measurementSearchParams.selectedSearchMeasurementList);
        const semanticFilled = this.semanticSearchParams.semanticsList.find(semanticItem => semanticItem.selected && semanticItem.semanticCriterion) !== undefined;

        return !((this.searchTab === SearchTab.ByNumber && this.objectNumberSearchParams.inputValue && (this.objectNumberSearchParams.byAllLayersFlag || this.selectedLayerId))
            || (this.searchTab === SearchTab.ByMeasurement && measurementFilled && (this.measurementSearchParams.byAllLayersFlag || this.selectedLayerId))
            || (this.searchTab === SearchTab.BySemantic && this.selectedLayerId && (semanticFilled || this.semanticSearchParams.selectedObject !== ALL_SEMANTICS_ID)));
    }

    /**
     * Получить список типов объектов по выбранному слою
     * @method selectLayer
     * @param value {string} Идентификатор выбранного слоя
     */
    selectLayer(value: string) {
        this.setState(SELECTED_LAYER_ID, value);
    }

    /**
     * Обработчик для изменения значения поля "Видимые"
     * @method checkVisibleOnCurrentScale
     * @param value {boolean}
     */
    checkVisibleOnCurrentScale(value: boolean) {
        this.setState(CHANGE_VISIBLE_ON_CURRENT_SCALE, value);
    }

    /**
     * Выполнить поиск
     * @method performSearch
     */
    performSearch() {
        this.setState(PERFORM_SEARCH, undefined);
    }

    /**
     * Очистить все
     * @method resetAll
     */
    resetAll() {
        this.setState(RESET_ALL, undefined);
    }

    /**
     * Выбрана вкладка
     * @method selectSearchTab
     * @param  {number} index
     */
    selectSearchTab(index: number) {
        this.setState(SELECTED_SEARCH_TAB, index);
    }

}
