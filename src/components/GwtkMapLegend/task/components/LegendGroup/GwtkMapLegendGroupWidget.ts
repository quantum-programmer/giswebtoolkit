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
import { LEGEND_ICON_TYPE } from '../../../Types';
import {
    FINISH_SELECT_LEGEND_ITEM,
    GwtkMapLegendItemWrapper,
    GwtkMapLegendTaskState,
    LegendMenu,
    ON_SEARCH_LEGEND_CLICKED,
    SET_SELECTED_LEGEND_ITEM_ADDITIONAL_STYLE,
    TOGGLE_MAP_LEGEND_ITEM_ADDITIONAL_STYLE
} from '../../GwtkMapLegendTask';
import {
    ClassifierObject,
    GwtkMapLegendItem
} from '../LegendItems';
import { LEGEND_ITEM_TYPE, LEGEND_SHOW_MODE } from '../LegendItems/Types';
import Utils from '~/services/Utils';
import GwtkMapLegendUtils from '../GwtkMapLegendUtils';
import { GwtkMapLegendItemReduced } from '~/types/Types';

@Component
export default class GwtkMapLegendGroupWidget extends Vue {
    @Prop({ default: () => '' })
    private readonly layerId!: string;

    @Prop({ default: () => ({}) })
    private readonly legendIconType!: LEGEND_ICON_TYPE;

    @Prop({ default: () => '' })
    private readonly searchObject!: string;

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapLegendTaskState>(key: K, value: GwtkMapLegendTaskState[K]) => void;

    @Prop({ default: () => ({}) })
    private readonly currentMapLegendItemWrapper!: GwtkMapLegendItemWrapper;

    @Prop({ default: () => ({}) })
    private readonly legendShowMode!: LEGEND_SHOW_MODE;

    @Prop({ default: () => ({}) })
    private readonly mapLegendItemSelected?: GwtkMapLegendItem;

    @Prop({ default: () => ({}) })
    private readonly mapLegendItemsSelectedList!: GwtkMapLegendItem[];

    @Prop({ default: false })
    private readonly showSearch!: boolean;

    @Prop({ default: () => [] })
    private readonly searchResult!: GwtkMapLegendItem[];

    @Prop({ default: false })
    private readonly isVisibilityAvailable!: boolean;

    @Prop({ default: false })
    private readonly allActiveLayers!: boolean;

    get creatingObjectMode() {
        return (this.legendShowMode === LEGEND_SHOW_MODE.ItemSelectionMode);
    }

    get buttonMode() {
        return this.legendShowMode === LEGEND_SHOW_MODE.ItemSelectionMode;
    }

    get currentMapLegendItem(): GwtkMapLegendItem | null {
        return this.currentMapLegendItemWrapper.mapLegendItem;
    }

    set currentMapLegendItem(mapLegendItem: GwtkMapLegendItem | null) {
        this.currentMapLegendItemWrapper.mapLegendItem = mapLegendItem;
        
        if (mapLegendItem?.itemType === LEGEND_ITEM_TYPE.ClassifierLayer) {
            this.$emit('changeCurrentMapLegendLayer', mapLegendItem);
        }
    }

    mounted() {
        if (this.creatingObjectMode) {
            // пропускаем. если всего один элемент в узле
            this.$nextTick(() => {
                while (this.currentMapLegendItem?.isRootElement && this.sortCurrentMapLegendItem?.length === 1) {
                    if (this.currentMapLegendItem && this.currentMapLegendItem.childLegendItems[0]) {
                        this.onMapLegendItemClicked(this.currentMapLegendItem.childLegendItems[0]);
                    }
                }
                if (this.sortCurrentMapLegendItem?.length === 1 && this.currentMapLegendItem!.childLegendItems[0] instanceof ClassifierObject) {
                    if (this.currentMapLegendItem && this.currentMapLegendItem.childLegendItems[0]) {
                        this.onMapLegendItemClicked(this.currentMapLegendItem.childLegendItems[0]);
                    }
                }
            });
        }
    }

    get sortCurrentMapLegendItem() {
        if (this.legendShowMode === LEGEND_SHOW_MODE.LayerStyleSettingsMode 
            && this.mapLegendItemsSelectedList.length ) {

            const result: GwtkMapLegendItem[] = [];
            const legendItemSelectedKeys: string[] = [];
            this.mapLegendItemsSelectedList.forEach(mapLegendItem => legendItemSelectedKeys.push(mapLegendItem.key));
            this.currentMapLegendItem?.childLegendItems.forEach((legendItem) => {
                result.push(legendItem);
            });
            return result.sort((a, b) => Utils.sortAlphaNum(a.itemName, b.itemName));
        }
        return this.currentMapLegendItem?.childLegendItems.sort((a, b) => Utils.sortAlphaNum(a.itemName, b.itemName));
    }

    get currentMapLegendItemIcon() {
        return this.currentMapLegendItem?.itemIcon;
    }

    getActiveChildClass(childItem: GwtkMapLegendItem): string {

        if (this.mapLegendItemSelected && childItem.itemType === LEGEND_ITEM_TYPE.ClassifierObject && childItem
            && this.mapLegendItemSelected.itemType === LEGEND_ITEM_TYPE.ClassifierObject
            && (childItem as ClassifierObject).key === (this.mapLegendItemSelected as ClassifierObject).key) {
            return 'v-item--active v-list-item--active';
        }
        return '';
    }

    onBackButtonClicked() {
        if (this.currentMapLegendItem) {

            if (this.currentMapLegendItem.isRootElement && this.currentMapLegendItem.parentItem) {
                this.currentMapLegendItem = this.currentMapLegendItem.parentItem.parentItem;
            } else {
                this.currentMapLegendItem = this.currentMapLegendItem.parentItem;
            }
        }
    }

    onMapLegendItemClicked(mapLegendItem: GwtkMapLegendItem) {
        if (mapLegendItem.itemType !== LEGEND_ITEM_TYPE.ClassifierObject) {
            this.currentMapLegendItem = mapLegendItem;
        } else if (this.creatingObjectMode) {
            this.$emit('changeCurrentMapLegendItem', mapLegendItem);
        }
    }

    onSearchMapLegendItemClicked(value: GwtkMapLegendItem) {
        if (value.parentItem) {
            this.setState(ON_SEARCH_LEGEND_CLICKED, value.parentItem);
        }
        this.onMapLegendItemClicked(value);
    }

    getItemSelected(item: GwtkMapLegendItem) {
        return item.childLegendItems.length === 0;
    }

    getItemVisibilityIcon(treeItem: GwtkMapLegendItem): string {
        return GwtkMapLegendUtils.getItemVisibilityIcon(treeItem);
    }

    toggleVisibility(childLegendItem: GwtkMapLegendItem) {
        childLegendItem.visible = !childLegendItem.visible;
    }

    enableClick(item: GwtkMapLegendItem) {
        return item.itemType === LEGEND_ITEM_TYPE.ClassifierObject;
    }

    getMenuItems(item: GwtkMapLegendItem) {
        const result: { text: string, value: LegendMenu }[] = [];

        if (item.childLegendItems.length) {
            result.push({ text: this.$t('legend.Show all') + '', value: LegendMenu.SHOW_ALL },
                { text: this.$t('legend.Hide all') + '', value: LegendMenu.HIDE_ALL });
        }

        return result;
    }

    toggleMenuItem(legendItem: GwtkMapLegendItem, menuItem: LegendMenu) {

        const allLeaves = GwtkMapLegendUtils.getTreeItemChildren(legendItem);

        allLeaves.forEach((leaf) => {
            if (menuItem === LegendMenu.HIDE_ALL) {
                leaf.visible = false;
            }
            if (menuItem === LegendMenu.SHOW_ALL) {
                leaf.visible = true;
            }
        });
    }

    get readOnlyMode() {
        return this.legendShowMode === LEGEND_SHOW_MODE.ReadOnlyMode;
    }

    private get layerStyleSettingsMode() {
        return this.legendShowMode === LEGEND_SHOW_MODE.LayerStyleSettingsMode;
    }

    isAvailable(item: GwtkMapLegendItem): boolean {
        if (this.readOnlyMode) {
            const icon = this.getItemVisibilityIcon(item);
            return icon === 'visibility-on' || icon === 'half-visibility';
        }
        return true;
    }

    isWithoutHeader(item: GwtkMapLegendItem | null) {
        return item && item.parentItem === null;
    }

    isNoItems() {
        return !this.sortCurrentMapLegendItem
            || this.sortCurrentMapLegendItem && this.sortCurrentMapLegendItem.length === 0
            || this.readOnlyMode && this.sortCurrentMapLegendItem.every(item => !item.visible)
            || this.readOnlyMode && this.sortCurrentMapLegendItem.every(item => item.childLegendItems.length && item.childLegendItems.every(child => !child.visible));
    }

    get legendItemSelectedKeys() {
        const keyList: string[] = [];
        this.mapLegendItemsSelectedList.forEach(mapLegendItem => keyList.push(mapLegendItem.key));
        return keyList;
    }
    getDisabled(legendItem: GwtkMapLegendItem): string {
        return this.legendItemSelectedKeys.includes(legendItem.key) ? 'mdi-checkbox-outline' : 'mdi-checkbox-blank-outline';
    }
    toggleItem(legendItem: GwtkMapLegendItem) {
        const selectedLegendObject: GwtkMapLegendItemReduced = { itemName: legendItem.itemName, key: legendItem.key, local: legendItem.local };
        this.setState(TOGGLE_MAP_LEGEND_ITEM_ADDITIONAL_STYLE, selectedLegendObject);
    }

    toggleSelect() {
        this.setState(SET_SELECTED_LEGEND_ITEM_ADDITIONAL_STYLE, true);
    }

    toggleCancel() {
        this.setState(FINISH_SELECT_LEGEND_ITEM, true);
    }

}
