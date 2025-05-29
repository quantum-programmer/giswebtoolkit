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
    ABORT_SEARCH,
    CHANGE_VISIBLE_ON_SCALE,
    CLEAR_SEARCH_HISTORY,
    GwtkSearchByNameTaskState,
    OPEN_HISTORY,
    RESET_ALL,
    SELECT_SEARCH_BY_ALL_LAYERS,
    SELECT_SEARCH_LAYER,
    SELECT_SEARCH_SEMANTIC,
    SET_SEARCH_EXACT,
    START_SEARCH,
    UPDATE_SEARCH_PROGRESS_BAR, UPDATE_SEARCH_TEXT
} from '../task/GwtkSearchByNameTask';
import { TaskDescription } from '~/taskmanager/TaskManager';
import { RscSemantic } from '~/services/RequestServices/RestService/Types';
import GwtkSearchByNameSearchHistory from './components/GwtkSearchByNameSearchHistory/GwtkSearchByNameSearchHistoryWidget.vue';

/**
 * Виджет компонента
 * @class GwtkSearchByNameWidget
 * @extends BaseGwtkVueComponent
 */
@Component({ components: { GwtkSearchByNameSearchHistory } })
export default class GwtkSearchByNameWidget extends BaseGwtkVueComponent {

    @Prop({ default: '' })
    private readonly taskId!: string;

    @Prop({ default: () => ({}) })
    private readonly description!: TaskDescription;

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkSearchByNameTaskState>(key: K, value: GwtkSearchByNameTaskState[K]) => void;

    @Prop({ default: false })
    private readonly visibleOnCurrentScale!: boolean;

    @Prop({ default: () => ({}) })

    @Prop({ default: true })
    private readonly searchProgressBar!: boolean;

    @Prop({ default: true })
    private readonly checkedAllLayer!: boolean;

    @Prop({ default: '' })
    private readonly searchText!: string;

    @Prop({ default: '' })
    private readonly currentLayerXId!: string;

    @Prop({ default: '' })
    private readonly semanticShortName!: string;

    @Prop({ default: true })
    private readonly exact!: boolean;

    @Prop({ default: true })
    readonly openHistory!: boolean;

    @Prop({ default: [] })
    private readonly layers!: { xId: string, text: string, semanticName: string}[];

    @Prop({ default: [] })
    private readonly semantics!: RscSemantic[];

    @Prop({ default: [] })
    private readonly searchHistory!: string[];

    private layerInputValue = this.currentLayerXId;

    /**
     * Обработчик изменений в поле ввода
     * @method onInput
     * @param value {string} Текущее значение в поле ввода
     */
    onInput(value: string) {
        this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
        this.setState(UPDATE_SEARCH_TEXT, value);
    }

    /**
     * Обработчик изменения флага фильтра текущего масштаба
     * @method changeVisibleOnCurrentScale
     */
    changeVisibleOnCurrentScale() {
        this.setState(CHANGE_VISIBLE_ON_SCALE, this.visibleOnCurrentScale);
    }

    /**
     * Выполнить поиск
     * @method search
     */
    search() {
        this.setState(START_SEARCH, undefined);
    }

    /**
     * Закрыли оверлей
     */
    closeOverlay() {
        this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
        this.setState(ABORT_SEARCH, undefined);
    }

    setMap(value: string) {
        this.layerInputValue = value;
        if (value !== null) {
            this.setState(SELECT_SEARCH_LAYER, value);
            if (this.$refs.autocompleteMap) {
                (this.$refs.autocompleteMap as HTMLDivElement).blur();
            }
        }
    }

    updateEmptyMapSelector() {
        if (this.layerInputValue === null) {
            this.layerInputValue = this.currentLayerXId;
        }
    }

    setSearchSemantic(value: string) {
        this.setState(SELECT_SEARCH_SEMANTIC, value);
        if (value !== null) {
            if (this.$refs.autocompleteSemantic) {
                (this.$refs.autocompleteSemantic as HTMLDivElement).blur();
            }
        }
    }

    updateEmptySemanticSelector() {
        if (this.semanticShortName === '') {
            const layer = this.layers.find(layer => layer.xId === this.currentLayerXId);
            if (layer) {
                const semantic = this.semantics.find(semantic => semantic.name === layer.semanticName);
                if (semantic) {
                    this.setSearchSemantic(semantic?.shortname);
                }
            }
        }
    }

    selectSearchByAll() {
        this.setState(SELECT_SEARCH_BY_ALL_LAYERS, undefined);
    }

    selectExact(value: boolean) {
        this.setState(SET_SEARCH_EXACT, value);
    }

    resetAll() {
        this.setState(RESET_ALL, undefined);
    }

    clearSearchHistory(value: number | null) {
        if (value != null) {
            this.setState(CLEAR_SEARCH_HISTORY, value);
        } else {
            this.setState(CLEAR_SEARCH_HISTORY, undefined);
        }
    }

    onOpenHistory() {
        this.setState(OPEN_HISTORY, undefined);
    }
}
