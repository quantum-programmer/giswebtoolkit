import GwtkMapLayerItem from './GwtkMapLayerItem';
import { GwtkMap } from '~/types/Types';
import { ContentTreeNode } from '~/utils/MapTreeJSON';
import GwtkSingleLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkSingleLayerItem';

export default class LegendObject extends GwtkMapLayerItem {

    constructor(map: GwtkMap, contentTreeItem: ContentTreeNode, private layerItem: GwtkSingleLayerItem) {
        super(map, contentTreeItem, null);
    }

    get layer() {
        return this.layerItem.layer;
    }

    get key() {
        return this.contentTreeItem.id;
    }

    get visible(): boolean {

        let isVisible = false;
        if (this.layer) {
            let filter = this.layer.getKeysArray();
            if (!filter) {
                isVisible = true;
            } else {
                isVisible = filter.includes(this.key);
            }
        }

        return isVisible;
    }

    set visible(value) {

        if (this.layer) {

            const filter = this.layer.getKeysArray()?.slice() || [];
            if (value) {
                if (!filter.includes(this.key)) {
                    filter.push(this.key);
                }
            } else {
                const index = filter.indexOf(this.key);
                if (index !== -1) {
                    filter.splice(index, 1);
                }
            }

            this.layer.setKeysFilter(filter);
            this.map.tiles.wmsUpdate();
        }
    }

}
