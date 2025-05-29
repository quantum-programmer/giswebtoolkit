import { GwtkMap } from '~/types/Types';
import { ContentTreeNode, TreeNodeType } from '~/utils/MapTreeJSON';
import GwtkSingleLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkSingleLayerItem';
import GwtkGroupLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkGroupLayerItem';
import GwtkVirtualFolderItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkVirtualFolderItem';
import LegendObject from '@/components/GwtkMapContent/task/components/LayerItems/LegendObject';


export default class GwtkMapLayerFactory {

    static createMapLayerItem(map: GwtkMap, contentTreeItem: ContentTreeNode, parentItem: GwtkGroupLayerItem | null): GwtkVirtualFolderItem | GwtkGroupLayerItem | GwtkSingleLayerItem {
        switch (contentTreeItem.nodeType) {
            case TreeNodeType.VirtualFolder:
                return new GwtkVirtualFolderItem(map, contentTreeItem, parentItem);
            case TreeNodeType.Group:
                return new GwtkGroupLayerItem(map, contentTreeItem, parentItem);
            default:
                return new GwtkSingleLayerItem(map, contentTreeItem, parentItem);
        }
    }

    static createMapLegendItem(map: GwtkMap, contentTreeItem: ContentTreeNode, parentItem: GwtkSingleLayerItem): LegendObject {
        return new LegendObject(map, contentTreeItem, parentItem);
    }
}
