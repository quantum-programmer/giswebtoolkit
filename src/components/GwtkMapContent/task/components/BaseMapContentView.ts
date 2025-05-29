import { Component, Prop, Watch } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {
    GwtkMapContentTaskState,
    SET_CURRENT_MAP_LAYER_ITEM
} from '@/components/GwtkMapContent/task/GwtkMapContentTask';
import GwtkMapLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkMapLayerItem';
import GwtkMapLayerFactory from '@/components/GwtkMapContent/task/components/LayerItems/GwtkMapLayerFactory';
import {ContentTreeNode} from '~/utils/MapTreeJSON';
import GwtkGroupLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkGroupLayerItem';

@Component
export default class BaseMapContentView extends BaseGwtkVueComponent {

    //TODO set active mode for tree and save state for recovering
    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkMapContentTaskState>(key: K, value: GwtkMapContentTaskState[K]) => void;

    @Prop({ default: 0 })
    ver!: number;

    @Prop({ default: null })
    readonly currentMapLayerItem!: ContentTreeNode | null;

    @Prop({ default: false })
    private readonly isUserLogged!: boolean;

    @Prop({ default: undefined })
    private readonly userLogin!: string | undefined;

    get currentLayerItem() {
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
        return targetMapLayerItem;
    }

    @Watch('ver')
    onVerUpdate() {
        const map = this.mapVue.getMap();
        let targetMapLayerItem = this.currentLayerItem;

        while (targetMapLayerItem) {
            const rootContentTreeItem = map.contentTreeManager.getNode(targetMapLayerItem.contentTreeItem.id);

            if (rootContentTreeItem) {
                targetMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(map, rootContentTreeItem, targetMapLayerItem.parentItem);
                break;
            }
            targetMapLayerItem = targetMapLayerItem.parentItem;
        }

        if (!targetMapLayerItem) {
            const rootContentTreeItem = map.contentTreeManager.contentTree;
            targetMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(map, rootContentTreeItem, null);
        }

        this.setState(SET_CURRENT_MAP_LAYER_ITEM, targetMapLayerItem.contentTreeItem);
    }

    getItemVisibilityIcon(mapLayerItem: GwtkMapLayerItem): string {
        switch (mapLayerItem.visibility) {
            case 'visible':
                return 'visibility-on';
            case 'half-visible':
                return 'half-visibility';
            case 'hidden':
            default:
                return 'visibility-off';
        }
    }

    /**
     * Получить подпись к всплывающей подсказке
     * @method getTooltipText
     * @static
     * @property mapLayerItem {GwtkMapLayerItem} Элемент слоя карты
     */

    getTooltipText(mapLayerItem: GwtkMapLayerItem) {
        const iconName = this.getItemVisibilityIcon(mapLayerItem);
        switch (iconName) {
            case 'visibility-on':
                return mapLayerItem.isGroupItem ? this.$t('mapcontent.All layers are visible') : this.$t('mapcontent.Visible');
            case 'half-visibility':
                return this.$t('mapcontent.Contains visible layers');
            case 'visibility-off':
                return mapLayerItem.isGroupItem ? this.$t('mapcontent.Contains no visible layers') : this.$t('mapcontent.Invisible');
        }
    }
}
