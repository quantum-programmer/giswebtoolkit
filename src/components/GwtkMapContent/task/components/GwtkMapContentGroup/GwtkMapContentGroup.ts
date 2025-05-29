/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                              Меню слоя                           *
 *                                                                  *
 *******************************************************************/

import {Component, Prop, Watch} from 'vue-property-decorator';
import Draggable from 'vuedraggable';
import GwtkMapContentToolbar from '@/components/GwtkMapContent/task/components/Toolbar/GwtkMapContentToolbar.vue';
import GwtkMapContentItemMenuWidget
    from '@/components/GwtkMapContent/task/components/ItemMenu/GwtkMapContentItemMenuWidget.vue';
import GwtkGroupItemMenuWidget from '@/components/GwtkMapContent/task/components/ItemMenu/GwtkGroupItemMenuWidget.vue';
import {
    RESET_SEARCH,
    SET_CURRENT_MAP_LAYER_ITEM,
    TOGGLE_CURRENT_MAP_LAYER_ITEM
} from '@/components/GwtkMapContent/task/GwtkMapContentTask';
import GwtkMapLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkMapLayerItem';
import BaseMapContentView from '@/components/GwtkMapContent/task/components/BaseMapContentView';


@Component({
    components: {
        Draggable,
        GwtkMapContentItemMenuWidget,
        GwtkGroupItemMenuWidget,
        GwtkMapContentToolbar
    }
})
export default class GwtkMapContentGroup extends BaseMapContentView {

    @Prop({ default: () => ([]) })
    dynamicLabelData!: {
        id: string;
        dynamicLabel: boolean;
    }[];

    @Prop({ default: () => ([]) })
    readonly menuListItems!: any[];

    @Prop({default: 0})
    readonly ver!: number;

    @Watch('ver')
    onVerUpdate() {
        this.$forceUpdate();
    }

    onBackButtonClicked() {
        if (this.currentMapLayerItem && this.currentMapLayerItem.parentId) {
            const node = this.mapVue.getMap().contentTreeManager.getNode(this.currentMapLayerItem.parentId);
            this.setState(SET_CURRENT_MAP_LAYER_ITEM, node);
        }
    }

    onMapLayerItemClicked(mapLayerItem: GwtkMapLayerItem, e: { target: { nodeName: string } }): void {
        if (e.target.nodeName !== 'DIV') {
            return;
        }

        if (mapLayerItem.isGroupItem) {
            this.setState(SET_CURRENT_MAP_LAYER_ITEM, mapLayerItem.contentTreeItem);
        }
        this.setState(RESET_SEARCH, null);
    }

    getItemVisibilityCheckedIcon(mapLayerItem: GwtkMapLayerItem): string {
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

    getDisabled(mapLayerItem: GwtkMapLayerItem): string {
        switch (mapLayerItem.disabledFlag) {
            case true:
                return 'mdi-checkbox-blank-outline';
            default:
                return 'mdi-checkbox-outline';
        }
    }

    toggleItem(mapLayerItem: GwtkMapLayerItem) {

        if (mapLayerItem.isGroupItem) {
            this.setState(TOGGLE_CURRENT_MAP_LAYER_ITEM, mapLayerItem.contentTreeItem);
            this.$forceUpdate();
        } else {
            mapLayerItem.visible = mapLayerItem.visibility === 'hidden';
            this.onVerUpdate();
        }

    }
}
