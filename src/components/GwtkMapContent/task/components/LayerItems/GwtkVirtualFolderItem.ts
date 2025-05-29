import GwtkMapLayerItem from './GwtkMapLayerItem';
import GwtkGroupLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkGroupLayerItem';
import GwtkMapLayerFactory from '@/components/GwtkMapContent/task/components/LayerItems/GwtkMapLayerFactory';
import { GwtkMap, Visibility } from '~/types/Types';
import { ContentTreeNode } from '~/utils/MapTreeJSON';
import VirtualFolder from '~/maplayers/VirtualFolder';


export default class GwtkVirtualFolderItem extends GwtkGroupLayerItem {

    updateProcess = false;

    constructor( map: GwtkMap, contentTreeItem: ContentTreeNode, parentItem: GwtkGroupLayerItem | null ) {
        super( map, contentTreeItem, parentItem );
        const virtualFolder = this.getVirtualFolder();
        this.updateProcess = !!(virtualFolder && virtualFolder.updateProcess);
    }

    get layerName() {
        return this._contentTreeItem.text;
    }

    private getVirtualFolder(): VirtualFolder | undefined {
        return this.map.tiles.getVirtualFolderByxId( this.layerGUID );
    }


    get childLayerItems(): GwtkMapLayerItem[] {
        let childLayerItems = [];
        if ( !this._contentTreeItem.nodes || this._contentTreeItem.nodes.length === 0 ) {
            this.getVirtualFolder()?.initialUpdate();
        } else {
            for ( let childNumber = 0; childNumber < this._contentTreeItem.nodes.length; childNumber++ ) {
                let newMapLayerItem = GwtkMapLayerFactory.createMapLayerItem( this.map, this._contentTreeItem.nodes[ childNumber ], this );
                childLayerItems.push( newMapLayerItem );
            }
        }
        return childLayerItems;
    }

    async update() {
        const virtualFolder = this.getVirtualFolder();
        if ( virtualFolder ) {
            this.updateProcess = true;
            await virtualFolder.update();
            this.updateProcess = false;
        }
    }

    get visibility(): Visibility {
        let result: Visibility = 'hidden';

        const virtualFolder = this.getVirtualFolder();
        if ( virtualFolder ) {
            result = virtualFolder.getVisibility();
        }

        return result;
    }

    set visible( value: boolean ) {
        const nodes = this._contentTreeItem.nodes;
        if ( nodes ) {
            this.getVirtualFolder()?.setVisibility( value );
            this.map._writeCookie();
            this.map.tiles.wmsUpdate();
        }

    }

    get isEditable(): boolean {
        const virtualFolder = this.getVirtualFolder();
        if ( virtualFolder ) {
            return virtualFolder.innerLayersAreEditable;
        }
        return false;
    }

    get isTooltipMap(): boolean {
        return false;
    }

    get isRemoveEnabled(): boolean {
        return false;
    }

    async removeLayer( xId: string ) {
        const virtualFolder = this.getVirtualFolder();
        if ( virtualFolder ) {
            this.updateProcess = true;
            await virtualFolder.removeLayer( xId );
            this.updateProcess = false;
        }
    }
}
