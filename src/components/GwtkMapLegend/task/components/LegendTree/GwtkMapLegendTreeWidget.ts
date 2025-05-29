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
    FINISH_SELECT_LEGEND_ITEM,
    GwtkMapLegendItemWrapper,
    GwtkMapLegendTaskState,
    LegendMenu,
    MapLayerWithLegendDescription,
    SET_SELECTED_LEGEND_ITEM_ADDITIONAL_STYLE,
    TOGGLE_MAP_LEGEND_ITEM_ADDITIONAL_STYLE,
    UPDATE_ALL_NODE_KEYS,
    UPDATE_OPEN_TREE_ELEMENT
} from '../../../task/GwtkMapLegendTask';
import { ClassifierLayer, GwtkMapLegendItem } from '../LegendItems';
import { LEGEND_ITEM_TYPE, LEGEND_KEY_DELIMITER, LEGEND_SHOW_MODE, TreeItem } from '../LegendItems/Types';
import Utils from '~/services/Utils';
import GwtkMapLegendUtils from '../GwtkMapLegendUtils';
import { GwtkMapLegendItemReduced } from '~/types/Types';
import { LOCALE } from '~/types/CommonTypes';


@Component
export default class GwtkMapLegendTreeWidget extends Vue {
    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapLegendTaskState>(key: K, value: GwtkMapLegendTaskState[K]) => void;

    @Prop({ default: () => [] })
    readonly openTreeElement!: string[];

    @Prop({ default: () => ({}) })
    private readonly currentMapLegendItemWrapper!: GwtkMapLegendItemWrapper;

    @Prop({ default: () => ({}) })
    private readonly legendShowMode!: LEGEND_SHOW_MODE;

    @Prop({ default: '' })
    private readonly selectedMapLayerId!: string;

    @Prop({ default: () => [] })
    private readonly mapLayersWithLegendDescriptions!: MapLayerWithLegendDescription[];

    @Prop({ default: false })
    private readonly isVisibilityAvailable!: boolean;

    @Prop({ default: false })
    private readonly allActiveLayers!: boolean;

    @Prop({ default: () => [] })
    private readonly legendItemWrapperList!: GwtkMapLegendItemWrapper[];

    @Prop({ default: () => ({}) })
    private readonly mapLegendItemsSelectedList!: GwtkMapLegendItem[];

    private treeNodeKeys: string[] = [];

    private get layerStyleSettingsMode() {
        return this.legendShowMode === LEGEND_SHOW_MODE.LayerStyleSettingsMode;
    }

    private inputTree(value: string[]) {
        this.setState(UPDATE_OPEN_TREE_ELEMENT, value);
    }

    getMenuItems(item: TreeItem) {
        const result: { text: string, value: LegendMenu }[] = [];

        if (item.children && item.children.length) {
            result.push({ text: this.$t('legend.Show all') + '', value: LegendMenu.SHOW_ALL },
                { text: this.$t('legend.Hide all') + '', value: LegendMenu.HIDE_ALL });
        }

        return result;
    }

    toggleMenuItem(treeItem: TreeItem, menuItem: LegendMenu) {
        const allLeaves = GwtkMapLegendUtils.getTreeItemChildren(treeItem);

        allLeaves.forEach(leaf => this.updateVisibility(leaf, menuItem === LegendMenu.SHOW_ALL));
    }

    getCompositeKey(parentItem: GwtkMapLegendItem | null, itemKey: string) {
        return parentItem ? parentItem.key + LEGEND_KEY_DELIMITER + itemKey : itemKey;
    }

    getChildren(items: GwtkMapLegendItem[]): TreeItem[] {

        const result: TreeItem[] = [];
        const legendItemSelectedKeys: string[] = [];
        this.mapLegendItemsSelectedList.forEach(mapLegendItem => legendItemSelectedKeys.push(mapLegendItem.key));
        items.forEach((item) => {

            if (!this.readOnlyMode || this.readOnlyMode && item.visible) {

                const key = this.getCompositeKey(item.parentItem, item.key);

                if (item.childLegendItems.length) {
                    this.treeNodeKeys.push(key);
                }
                result.push({
                    key,
                    name: item.itemName,
                    children: item.childLegendItems.length ? this.getChildren(item.childLegendItems) : [],
                    icon: item.itemIcon,
                    isToggleVisibilityEnabled: item.isToggleVisibilityEnabled,
                    visible: item.visible,
                    itemType: item.itemType,
                    local: item.local
                });

            }

        });


        return result.sort((a, b) => Utils.sortAlphaNum(a.name, b.name));
    }

    get readOnlyMode() {
        return this.legendShowMode === LEGEND_SHOW_MODE.ReadOnlyMode;
    }

    isAvailable(item: TreeItem): boolean {
        if (this.readOnlyMode) {
            return item.visible;
        }
        return true;
    }

    get items(): TreeItem[] {

        let result: TreeItem[] = [];
        this.treeNodeKeys.splice(0);
        const children: TreeItem[] = [];

        this.sortRootMapLegendItem?.forEach((item) => {

            item.childLegendItems.forEach((child) => {

                if (child.childLegendItems.length) {
                    this.treeNodeKeys.push(child.key);
                }
                children.push({
                    key: child.key,
                    name: child.itemName,
                    children: child.childLegendItems.length ? this.getChildren(child.childLegendItems) : [],
                    icon: child.itemIcon,
                    isToggleVisibilityEnabled: child.isToggleVisibilityEnabled,
                    visible: child.visible,
                    itemType: child.itemType,
                    local: child.local
                });

            });

            for (let i = children.length - 1; i >= 0; i--) {
                if (!this.isAvailable(children[i])) {
                    children.splice(i, 1);
                }
            }

            children.sort((a, b) => Utils.sortAlphaNum(a.name, b.name));


        });

        const layer = this.mapLayersWithLegendDescriptions.find(item => item.layerId === this.selectedMapLayerId);

        if (layer && children.length) {
            const rootItem: TreeItem = {
                key: layer.layerId,
                icon: '',
                children,
                visible: true,
                isToggleVisibilityEnabled: true,
                name: layer.layerName,
                itemType: LEGEND_ITEM_TYPE.ClassifierLayerOrObjectGroup
            };

            this.treeNodeKeys.push(rootItem.key);

            this.treeNodeKeys.sort((a, b) => Utils.sortAlphaNum(a, b));

            this.setState(UPDATE_ALL_NODE_KEYS, this.treeNodeKeys);

            result = [rootItem];
        }
        return result;
    }

    getSuperRoot(item: GwtkMapLegendItem): GwtkMapLegendItem {
        if (item.parentItem === null) {
            return item;
        } else {
            return this.getSuperRoot(item.parentItem);
        }
    }

    get allItems() {

        this.treeNodeKeys.splice(0);
        const roots: TreeItem[] = [];
        this.mapLayersWithLegendDescriptions.forEach(layer => {

            const children: TreeItem[] = [];

            const legendMap = this.legendItemWrapperList.find((item) => item.layerId === layer.layerId);

            if (legendMap && legendMap.mapLegendItem) {

                const superRoot = this.getSuperRoot(legendMap.mapLegendItem);

                if (superRoot) {
                    const value = superRoot.childLegendItems.find((item) => item.key === layer.layerId);

                    if (value) {
                        legendMap.mapLegendItem = value;
                    }
                }

                legendMap.mapLegendItem.childLegendItems.forEach((child) => {

                    if (child.childLegendItems.length) {

                        this.treeNodeKeys.push(child.key);

                        children.push({
                            key: child.key,
                            name: child.itemName,
                            children: child.childLegendItems.length ? this.getChildren(child.childLegendItems) : [],
                            icon: child.itemIcon,
                            isToggleVisibilityEnabled: child.isToggleVisibilityEnabled,
                            visible: child.visible,
                            itemType: child.itemType
                        });

                    }

                });
            }

            if (children.length) {

                for (let i = children.length - 1; i >= 0; i--) {
                    if (!this.isAvailable(children[i])) {
                        children.splice(i, 1);
                    }
                }

                if (children.length) {

                    children.sort((a, b) => Utils.sortAlphaNum(a.name, b.name));

                    const rootItem: TreeItem = {
                        key: layer.layerId,
                        icon: '',
                        children,
                        visible: true,
                        isToggleVisibilityEnabled: true,
                        name: layer.layerName,
                        itemType: LEGEND_ITEM_TYPE.ClassifierLayerOrObjectGroup
                    };

                    roots.push(rootItem);

                    this.treeNodeKeys.push(rootItem.key);

                }

            }

        });

        this.setState(UPDATE_ALL_NODE_KEYS, this.treeNodeKeys);

        return [...roots.sort((a, b) => Utils.sortAlphaNum(a.name, b.name))];

    }

    get currentMapLegendItem(): GwtkMapLegendItem | null {
        return this.currentMapLegendItemWrapper.mapLegendItem;
    }

    getParent(item: GwtkMapLegendItem | null): GwtkMapLegendItem | null | undefined {
        if (item === null) {
            return null;
        }
        if (item.parentItem === null) {
            return item;
        } else {
            return this.getParent(item.parentItem);
        }
    }

    get rootMapLegendItem(): GwtkMapLegendItem | null | undefined {
        return this.getParent(this.currentMapLegendItemWrapper.mapLegendItem);
    }

    get sortRootMapLegendItem() {
        return this.rootMapLegendItem?.childLegendItems.sort((a, b) => Utils.sortAlphaNum(a.itemName, b.itemName));
    }

    updateVisibility(item: TreeItem, status?: boolean) {
        const keyList: string[] = item.key.split(LEGEND_KEY_DELIMITER, 3);

        if (keyList.length !== 3) {
            return;
        }

        const legendMap = this.legendItemWrapperList.find((item) => item.layerId === keyList[0]);

        if (legendMap && legendMap.mapLegendItem) {
            const superRoot = this.getSuperRoot(legendMap.mapLegendItem);

            if (superRoot) {
                const value = superRoot.childLegendItems.find((item) => item.key === keyList[0]);

                if (value) {
                    legendMap.mapLegendItem = value;
                }
            }

            const legendLayer = legendMap.mapLegendItem?.childLegendItems.find(item => (item as ClassifierLayer).keyOriginal === keyList[1]);

            if (legendLayer) {

                const legendObject = legendLayer.childLegendItems.find(item => item.key === keyList[2]);

                if (legendObject) {

                    if (status !== undefined) {
                        legendObject.visible = status;
                    } else {
                        legendObject.visible = !legendObject.visible;
                    }
                }

            }

        }

    }

    enableClick(item: TreeItem) {
        return item.itemType === LEGEND_ITEM_TYPE.ClassifierObject;
    }

    getItemVisibilityIcon(treeItem: GwtkMapLegendItem): string {
        return GwtkMapLegendUtils.getItemVisibilityIcon(treeItem);
    }

    isNoItems() {
        return this.allActiveLayers ? this.allItems.length === 0 : this.items.length === 0;
    }

    get legendItemSelectedKeys() {
        const keyList: string[] = [];
        this.mapLegendItemsSelectedList.forEach(mapLegendItem => keyList.push(mapLegendItem.key));
        return keyList;
    }

    getDisabled(legendItem: GwtkMapLegendItem): string {
        const legendItemKey = legendItem.key.split(LEGEND_KEY_DELIMITER, 3)[2];
        return this.legendItemSelectedKeys.includes(legendItemKey) ? 'mdi-checkbox-outline' : 'mdi-checkbox-blank-outline';
    }

    toggleItem(item: TreeItem) {
        const legendItemKey = item.key.split(LEGEND_KEY_DELIMITER, 3)[2];
        const selectedLegendObject: GwtkMapLegendItemReduced = { itemName: item.name, key: legendItemKey, local: item.local || LOCALE.Line };
        this.setState(TOGGLE_MAP_LEGEND_ITEM_ADDITIONAL_STYLE, selectedLegendObject);
    }

    toggleSelect() {
        this.setState(SET_SELECTED_LEGEND_ITEM_ADDITIONAL_STYLE, true);
    }

    toggleCancel() {
        this.setState(FINISH_SELECT_LEGEND_ITEM, true);
    }
}
