/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Виджет поиска по номеру объекта                 *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkSearchBySemanticsTaskState,
    SET_OBJECT_NUMBER_SEARCH_PARAMS,
    ObjectNumberSearchParams, SET_OBJECT_NUMBER_SEARCH_INPUT_FROM_HISTORY, CLEAR_OBJECT_NUMBER_SEARCH_HISTORY
} from '@/components/GwtkSearchBySemantics/task/GwtkSearchBySemanticsTask';


/**
 * Виджет компонента
 * @class GwtkSearchByObjectNumber
 * @extends Vue
 */
@Component
export default class GwtkSearchByObjectNumber extends Vue {

    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkSearchBySemanticsTaskState>(key: K, value: GwtkSearchBySemanticsTaskState[K]) => void;

    @Prop({ default: '' })
    readonly selectedLayerId!: string;

    @Prop({ default: () => ({}) })
    readonly objectNumberSearchParams!: ObjectNumberSearchParams;

    get disabled() {
        return !this.selectedLayerId && !this.objectNumberSearchParams.byAllLayersFlag;
    }

    showHistory = false;

    /**
     * Получить значения "Номер объекта"
     * @private
     * @method changeObjectNumber
     * @param value {string}
     */
    changeObjectNumber(value: string) {
        this.setState(SET_OBJECT_NUMBER_SEARCH_PARAMS, { inputValue: parseInt(value) >= 0 ? value : '' });
    }

    /**
     * Обработчик для изменения флага поиска по всем картам
     * @private
     * @method selectSearchByAll
     * @param value {boolean}
     */
    selectSearchByAll(value: boolean) {
        this.setState(SET_OBJECT_NUMBER_SEARCH_PARAMS, { byAllLayersFlag: value });
    }

    toggleHistory() {
        this.showHistory = !this.showHistory;
    }

    selectHistory(value: string) {
        this.setState(SET_OBJECT_NUMBER_SEARCH_INPUT_FROM_HISTORY, value);
        this.showHistory = false;
    }

    clearSearchHistory(value?:string) {
        this.setState(CLEAR_OBJECT_NUMBER_SEARCH_HISTORY, value);
        this.showHistory = false;
    }
}
