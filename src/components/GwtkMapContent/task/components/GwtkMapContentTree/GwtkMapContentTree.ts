/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Состав карт в виде дерева                   *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import {
    MapContentTreeViewNode,
    MapContentTreeViewNodes,
    SHOW_TREE_ITEM,
    UPDATE_OPEN_TREE_ELEMENT,
    UPDATE_VIRTUAL_FOLDER,
    UPDATE_TREE,
    RELOAD_NODE_LEGEND
} from '../../../task/GwtkMapContentTask';
import BaseMapContentView from '../../../task/components/BaseMapContentView';
import GwtkGroupItemMenuWidget from '../../../task/components/ItemMenu/GwtkGroupItemMenuWidget.vue';
import GwtkMapContentItemMenuWidget
    from '../../../task/components/ItemMenu/GwtkMapContentItemMenuWidget.vue';
import {ContentTreeNode} from '~/utils/MapTreeJSON';


@Component({
    components: {
        GwtkGroupItemMenuWidget,
        GwtkMapContentItemMenuWidget
    }
})
export default class GwtkMapContentTree extends BaseMapContentView {

    @Prop({ default: () => ({}) })
    readonly treeItemStatistics!: { show: number, layer: number, editable: number, tooltip: number };

    @Prop({ default: () => null })
    readonly treeViewItem!: MapContentTreeViewNodes;

    @Prop({ default: () => ([]) })
    readonly openTreeElement!: string[];

    @Prop({ default: () => ([]) })
    readonly menuListItems!: any[];

    @Prop({ default: () => ([]) })
    dynamicLabelData!: {
        id: string;
        dynamicLabel: boolean;
    }[];

    /**
     * Items for groups
     */
    @Prop({ default: null })
    readonly currentMapLayerItem!: ContentTreeNode | null;

    private updateVirtualFolder(item: MapContentTreeViewNode): void {
        this.setState(UPDATE_VIRTUAL_FOLDER, item);
    }

    showTreeItem(item: MapContentTreeViewNode) {
        this.setState(SHOW_TREE_ITEM, item);
        this.updateTree();
    }

    enableCheckbox(item: MapContentTreeViewNode): boolean {
        let result = true;
        if (this.currentMapLayerItem) {
            const parrent = this.findMapContentTreeViewNode(item.parentId, this.treeViewItem);
            if (parrent && parrent.disabled) {
                result = false;
            } else if (parrent?.parentId) {
                result = this.enableCheckbox(parrent);
            }
        }
        return result;
    }

    inputTree(value: string[]) {
        this.setState(UPDATE_OPEN_TREE_ELEMENT, value);
    }

    updateTree() {
        this.setState(UPDATE_TREE, '');
    }

    getItemVisibilityCheckedIcon(mapLayerItem: MapContentTreeViewNode): string {
        switch (mapLayerItem.visibility) {
            case 'visible':
                return 'mdi-checkbox-outline';
            case 'half-visible':
                return 'mdi-minus-box-outline';
            case 'hidden':
            default:
                return 'mdi-checkbox-blank-outline';
        }
    }

    getDisabled(mapLayerItem: MapContentTreeViewNode): string {
        switch (mapLayerItem.disabled) {
            case true:
                return 'mdi-checkbox-blank-outline';
            default:
                return 'mdi-checkbox-outline';
        }
    }

    toggleLegendError(nodeId: string) {
        this.setState(RELOAD_NODE_LEGEND, nodeId);
    }

    checkDynamicLayer(id: string) {
        return this.dynamicLabelData.find((item) => item.id === id);
    }

    private findMapContentTreeViewNode(id: string, tree: MapContentTreeViewNodes) {
        let result: MapContentTreeViewNode | undefined;
        for (let i = 0; i < tree.length; i++) {
            if (tree[i].id === id) {
                result = tree[i];
                break;
            } else if (tree[i].children.length > 0) {
                const searchResult = this.findMapContentTreeViewNode(id, tree[i].children);
                if (searchResult) {
                    result = searchResult;
                }
            }
        }
        return result;
    }

    getItemVisibilityIconLegend(treeItem: MapContentTreeViewNode) {
        let result = false;
        if (treeItem.idLayer) {
            const layer = this.mapVue.getMap().getLayer(treeItem.idLayer);
            if (layer) {
                const legendList = layer.getKeysArray();
                if (treeItem && legendList?.includes(treeItem.id)) {
                    result = true;
                }
            }
        } 
        return result;
    }

    setLegendVisible(treeItem: MapContentTreeViewNode) {
        if (treeItem.idLayer) {
            const layer = this.mapVue.getMap().getLayer(treeItem.idLayer);
            if (layer) {
                const legendList = layer.getKeysArray();
                if (treeItem && legendList) {
                    const index = legendList.findIndex((item) => item === treeItem.id);
                    if (index !== undefined) {
                        if (index === -1) {
                            treeItem.visibility = 'visible';
                            legendList.push(treeItem.id);
                        } else {
                            treeItem.visibility = 'hidden';
                            legendList.splice(index, 1);
                        }
                        layer.setKeysFilter(legendList);
                        this.mapVue.getMap().tiles.wmsUpdate();
                    }
                }
            }
        }
    }
}