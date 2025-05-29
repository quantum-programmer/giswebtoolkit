/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Виджет поиска по семантике                     *
 *                                                                  *
 *******************************************************************/


import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkSearchBySemanticsTaskState,
    SelectableItems,
    SemanticSearchParams,
    SET_SEMANTIC_SEARCH_PARAMS
} from '@/components/GwtkSearchBySemantics/task/GwtkSearchBySemanticsTask';
import SemanticItem from '@/components/GwtkSearchBySemantics/task/utils/SemanticItem';

/**
 * Виджет компонента
 * @class GwtkSearchBySemantics
 * @extends Vue
 */
@Component
export default class GwtkSearchBySemantics extends Vue {

    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkSearchBySemanticsTaskState>(key: K, value: GwtkSearchBySemanticsTaskState[K]) => void;

    @Prop({ default: () => ({}) })
    readonly semanticSearchParams!: SemanticSearchParams;


    get filledSemanticList() {
        return this.semanticSearchParams.semanticsList.filter(item => item.checkFilled);
    }

    /**
     * Индексы для условия поиска
     */
    readonly searchConditionList: SelectableItems[] = [
        { value: 'OR', text: this.$t('phrases.At least one') as string },
        { value: 'AND', text: this.$t('phrases.All') as string }
    ];

    textSearch = '';

    /**
     * Получить список семантик слоя по выбранному типу объекта
     * @method selectObjectType
     * @param value {string} Имя выбранного типа объектов
     */
    selectObjectType(value: string) {
        this.setState(SET_SEMANTIC_SEARCH_PARAMS, { selectedObject: value });
    }

    /**
     * Получить значения "Условие поиска"
     * @method selectSearchCondition
     * @param value {string}
     */
    selectSearchCondition(value: string) {
        this.setState(SET_SEMANTIC_SEARCH_PARAMS, { searchCondition: value });
    }

    /**
     * Переключение отображения только заполненных семантик
     * @method onlyFilledToggle
     */
    onlyFilledToggle() {
        this.setState(SET_SEMANTIC_SEARCH_PARAMS, { onlyFilled: !this.semanticSearchParams.onlyFilled });
    }

    /**
     * Проверка отображения только заполненных семантик
     * @method checkShowOnlyFilled
     * @param value {SemanticItem}
     * @return {boolean}
     */
    checkShowOnlyFilled(value: SemanticItem) {
        let result = true;
        if (this.semanticSearchParams.onlyFilled && !value.checkFilled) {
            result = false;
        }
        return result;
    }
}
