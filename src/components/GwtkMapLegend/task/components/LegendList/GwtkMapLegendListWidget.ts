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

import { Component, Prop } from 'vue-property-decorator';
import {
    FINISH_SELECT_LEGEND_ITEM,
    GwtkMapLegendItemWrapper,
    GwtkMapLegendTaskState,
    LegendMenu,
    SET_SELECTED_LEGEND_ITEM_ADDITIONAL_STYLE,
    TOGGLE_MAP_LEGEND_ITEM_ADDITIONAL_STYLE
} from '../../GwtkMapLegendTask';
import { LEGEND_SHOW_MODE } from '../LegendItems/Types';
import { GwtkMapLegendItem } from '../LegendItems';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import Utils from '~/services/Utils';
import GwtkMapLegendUtils from '../GwtkMapLegendUtils';
import { PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG } from '~/utils/WorkspaceManager';
import { GwtkMapLegendItemReduced } from '~/types/Types';


@Component
export default class GwtkMapLegendListWidget extends BaseGwtkVueComponent {

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapLegendTaskState>(key: K, value: GwtkMapLegendTaskState[K]) => void;

    @Prop({ default: () => ({}) })
    private readonly legendShowMode!: LEGEND_SHOW_MODE;

    @Prop({ default: () => ({}) })
    private readonly mapLegendItemSelected?: GwtkMapLegendItem;
    
    @Prop({ default: () => ({}) })
    private readonly mapLegendItemsSelectedList!: GwtkMapLegendItem[];

    @Prop({ default: false })
    private readonly isVisibilityAvailable!: boolean;

    @Prop({ default: () => [] })
    private readonly legendItemWrapperList!: GwtkMapLegendItemWrapper[];

    @Prop({ default: false })
    private readonly allActiveLayers!: boolean;

    @Prop({ default: '' })
    private readonly selectedMapLayerId!: string;

    private get buttonMode() {
        return this.legendShowMode === LEGEND_SHOW_MODE.ItemSelectionMode;
    }

    private get layerStyleSettingsMode() {
        return this.legendShowMode === LEGEND_SHOW_MODE.LayerStyleSettingsMode;
    }

    get legendItemSelectedKeys() {
        const keyList: string[] = [];
        this.mapLegendItemsSelectedList.forEach(mapLegendItem => keyList.push(mapLegendItem.key));
        return keyList;
    }

    getObjectList(legendMap: GwtkMapLegendItemWrapper): GwtkMapLegendItem[] {
        const result: GwtkMapLegendItem[] = [];
        legendMap.mapLegendItem?.childLegendItems.forEach((layer) => {
            layer.childLegendItems.forEach((object) => {
                if (!this.readOnlyMode || this.readOnlyMode && object.visible) {
                    result.push(object);
                }
            });
        });
        return result.sort((a, b) => Utils.sortAlphaNum(a.itemName, b.itemName));
    }

    get isReducedSizeInterface() {
        return this.mapVue.getMap().workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
    }

    get legendMapList(): GwtkMapLegendItemWrapper[] {

        const result: GwtkMapLegendItemWrapper[] = [];

        this.legendItemWrapperList.forEach((item) => {

            if (item.mapLegendItem) {
                const allLeaves = GwtkMapLegendUtils.getTreeItemChildren(item.mapLegendItem);
                const hasSomeVisible = allLeaves.some((leaf) => leaf.visible);
                if (!this.readOnlyMode || this.readOnlyMode && hasSomeVisible) {
                    result.push({ layerId: item.layerId, mapLegendItem: item.mapLegendItem });
                }
            }
        });

        return result.sort((a, b) => {
            return Utils.sortAlphaNum(a.mapLegendItem!.itemName, b.mapLegendItem!.itemName);
        });
    }

    get legendMapSingleObjectList() {
        const result: GwtkMapLegendItem[] = [];
        const legendItemSelectedKeys: string[] = [];
        this.mapLegendItemsSelectedList.forEach(mapLegendItem => legendItemSelectedKeys.push(mapLegendItem.key));
        this.legendItemWrapperList.find((item) =>
            item.layerId === this.selectedMapLayerId)?.mapLegendItem?.childLegendItems.forEach((layer) => {
            layer.childLegendItems.forEach((item) => {
                if (!this.readOnlyMode || this.readOnlyMode && item.visible) {
                    result.push(item);
                }
            });
        });
        return result.sort((a, b) => Utils.sortAlphaNum(a.itemName, b.itemName));
    }

    get readOnlyMode() {
        return this.legendShowMode === LEGEND_SHOW_MODE.ReadOnlyMode;
    }

    getItemVisibilityIcon(treeItem: GwtkMapLegendItem): string {
        return GwtkMapLegendUtils.getItemVisibilityIcon(treeItem);
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
