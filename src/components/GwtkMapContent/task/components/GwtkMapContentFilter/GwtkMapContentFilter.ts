import {Component, Prop} from 'vue-property-decorator';
import {
    CHANGE_VIEW_MODE,
    RESET_SEARCH,
    SET_CURRENT_MAP_LAYER_ITEM,
    SCROLL_TO_FILTERED_ITEM
} from '@/components/GwtkMapContent/task/GwtkMapContentTask';
import GwtkMapLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkMapLayerItem';
import GwtkMapLayerFactory from '@/components/GwtkMapContent/task/components/LayerItems/GwtkMapLayerFactory';
import GwtkMapContentItemMenuWidget
    from '@/components/GwtkMapContent/task/components/ItemMenu/GwtkMapContentItemMenuWidget.vue';
import GwtkGroupItemMenuWidget from '@/components/GwtkMapContent/task/components/ItemMenu/GwtkGroupItemMenuWidget.vue';
import BaseMapContentView from '@/components/GwtkMapContent/task/components/BaseMapContentView';
import {ContentTreeNode} from '~/utils/MapTreeJSON';
import GwtkGroupLayerItem from '../LayerItems/GwtkGroupLayerItem';

@Component({
    components: {
        GwtkMapContentItemMenuWidget,
        GwtkGroupItemMenuWidget,
    }
})
export default class GwtkMapContentFilter extends BaseMapContentView {

    @Prop({default: () => ([])})
    readonly searchListItems!: { item: ContentTreeNode, path: string }[];

    @Prop({default: ''})
    readonly viewMode!: string;

    @Prop({ default: () => ([]) })
    private readonly dynamicLabelData!: {
        id: string;
        dynamicLabel: boolean;
    }[];

    @Prop({ default: () => ([]) })
    readonly menuListItems!: any[];

    get searchListLayerItems() {
        return this.searchListItems.map(listItem => ({
            item: GwtkMapLayerFactory.createMapLayerItem(this.mapVue.getMap(), listItem.item, null),
            path: listItem.path
        }));
    }

    onBackButtonClicked() {
        const map = this.mapVue.getMap();

        let targetMapLayerItem: GwtkMapLayerItem | null = null;
        if (this.currentMapLayerItem) {
            let parentItem;
            if (this.currentMapLayerItem.parentId) {
                const node = map.contentTreeManager.getNode(this.currentMapLayerItem.parentId);
                parentItem = GwtkMapLayerFactory.createMapLayerItem(map, node, null) as GwtkGroupLayerItem;
            }
            targetMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(map, this.currentMapLayerItem, parentItem || null);
        }

        if (targetMapLayerItem) {
            if (targetMapLayerItem.parentItem) {
                targetMapLayerItem = targetMapLayerItem.parentItem;
            } else if (targetMapLayerItem.contentTreeItem.parentId) {
                const rootContentTreeItem = map.contentTreeManager.getNode(targetMapLayerItem.contentTreeItem.parentId);
                if (rootContentTreeItem) {
                    targetMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(map, rootContentTreeItem, targetMapLayerItem ? targetMapLayerItem.parentItem : null);
                    this.setState(SET_CURRENT_MAP_LAYER_ITEM, targetMapLayerItem.contentTreeItem);
                }
            } else {
                targetMapLayerItem = null;
            }

            if (targetMapLayerItem) {
                const rootContentTreeItem = map.contentTreeManager.getNode(targetMapLayerItem.contentTreeItem.id);
                if (rootContentTreeItem) {
                    targetMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(map, rootContentTreeItem, targetMapLayerItem ? targetMapLayerItem.parentItem : null);
                    this.setState(SET_CURRENT_MAP_LAYER_ITEM, targetMapLayerItem.contentTreeItem);
                }
            } else {
                this.setState(RESET_SEARCH, null);
            }

        }
    }

    private onSearchMapLayerItemClicked(mapLayerItem: GwtkMapLayerItem): void {
        if (mapLayerItem.nodes) {
            this.setState(SET_CURRENT_MAP_LAYER_ITEM, mapLayerItem.contentTreeItem);
        } else {
            const map = this.mapVue.getMap();
            const rootContentTreeItem = map.contentTreeManager.getNode(mapLayerItem.contentTreeItem.parentId);
            if (rootContentTreeItem) {
                let parentItem;
                if (rootContentTreeItem.parentId) {
                    const node = map.contentTreeManager.getNode(rootContentTreeItem.parentId);
                    parentItem = GwtkMapLayerFactory.createMapLayerItem(map, node, null) as GwtkGroupLayerItem;
                }
                const targetMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(map, rootContentTreeItem, parentItem || null);
                this.setState(SET_CURRENT_MAP_LAYER_ITEM, targetMapLayerItem.contentTreeItem);
            }
        }
        this.setState(RESET_SEARCH, null);

        this.setState(CHANGE_VIEW_MODE, this.viewMode);

        this.setState(SCROLL_TO_FILTERED_ITEM, mapLayerItem.layerGUID);

    }
}
