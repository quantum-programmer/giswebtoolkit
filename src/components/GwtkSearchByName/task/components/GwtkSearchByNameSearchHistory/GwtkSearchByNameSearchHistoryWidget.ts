/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Виджет компонента "Поиск"                     *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {
    CLEAR_SEARCH_HISTORY,
    GwtkSearchByNameTaskState,
    OPEN_HISTORY,
    SET_SEARCH_FROM_HISTORTY,
} from '../../GwtkSearchByNameTask';
import Vue from 'vue';

/**
 * Виджет компонента
 * @class GwtkSearchByNameSearchHistoryWiget
 * @extends Vue
 */
@Component
export default class GwtkSearchByNameSearchHistory extends Vue {

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkSearchByNameTaskState>(key: K, value: GwtkSearchByNameTaskState[K]) => void;

    @Prop({ default: [''] })
    private readonly searchHistory!: string[];

    onOpenHistory() {
        this.setState(OPEN_HISTORY, undefined);
    }

    clearSearchHistory(value: number | null) {
        if (value != null) {
            this.setState(CLEAR_SEARCH_HISTORY, value);
        } else {
            this.setState(CLEAR_SEARCH_HISTORY, undefined);
        }
    }

    selectHistory(value: number) {
        this.setState(SET_SEARCH_FROM_HISTORTY, value);
    }
}
