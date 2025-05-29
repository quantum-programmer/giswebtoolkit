/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Виджет компонента "Легенда карты"                     *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkMapLegendTaskState,
    LegendMenu,
    SET_SHOW_LEGENDS_TYPE,
    TOGGLE_MENU_EXPAND,
    TOGGLE_MENU_VISIBILITY,
    LegendViewMode
} from '../../GwtkMapLegendTask';


@Component
export default class GwtkMapLegendToolbar extends Vue {

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapLegendTaskState>(key: K, value: GwtkMapLegendTaskState[K]) => void;

    @Prop({ default: '' })
    private readonly selectedShowLegendsType!: LegendViewMode;

    @Prop({ default: false })
    private readonly isVisibilityAvailable!: boolean;

    /**
     * Получить тип показа списка ленгенд
     * @get
     * @method showLegendsType
     */
    get showLegendsType() {
        return this.selectedShowLegendsType;
    }

    /**
     * Установить тип показа списка ленгенд
     * @set
     * @method showLegendsType
     */
    set showLegendsType(value: LegendViewMode) {
        this.setState(SET_SHOW_LEGENDS_TYPE, value);
    }

    get menuItems() {
        const result: { text: string, value: LegendMenu }[] = [];

        if (this.isVisibilityAvailable) {
            result.push({ text: this.$t('legend.Show all') + '', value: LegendMenu.SHOW_ALL },
                { text: this.$t('legend.Hide all') + '', value: LegendMenu.HIDE_ALL });
        }

        if (this.showLegendsType === LegendViewMode.Tree) {
            result.push({ text: this.$t('phrases.Expand all') + '', value: LegendMenu.EXPAND_ALL },
                { text: this.$t('phrases.Collapse all') + '', value: LegendMenu.COLLAPSE_ALL });
        }

        return result;
    }

    get isTreeMode() {
        return this.showLegendsType === LegendViewMode.Tree;
    }

    get isGroupMode() {
        return this.showLegendsType === LegendViewMode.Group;
    }

    get isListMode() {
        return this.showLegendsType === LegendViewMode.List;
    }

    setTreeMode() {
        this.showLegendsType = LegendViewMode.Tree;
    }

    setGroupMode() {
        this.showLegendsType = LegendViewMode.Group;
    }

    setListMode() {
        this.showLegendsType = LegendViewMode.List;
    }

    toggleMenuItem(value: LegendMenu) {
        switch (value) {
            case LegendMenu.SHOW_ALL:
                this.setState(TOGGLE_MENU_VISIBILITY, true);
                break;
            case LegendMenu.HIDE_ALL:
                this.setState(TOGGLE_MENU_VISIBILITY, false);
                break;
            case LegendMenu.EXPAND_ALL:
                this.setState(TOGGLE_MENU_EXPAND, true);
                break;
            case LegendMenu.COLLAPSE_ALL:
                this.setState(TOGGLE_MENU_EXPAND, false);
                break;
        }
    }

}
