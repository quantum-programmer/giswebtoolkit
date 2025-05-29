import GwtkMapLegendItem from '../LegendItems/GwtkMapLegendItem';
import { GwtkMap, LegendLeafNode } from '~/types/Types';
import { LEGEND_ITEM_TYPE } from '../LegendItems/Types';
import Layer from '~/maplayers/Layer';

export default class ClassifierObject extends GwtkMapLegendItem {

    private readonly map: GwtkMap;
    private readonly mapLegendItem: LegendLeafNode;
    readonly _parentItem: GwtkMapLegendItem | null;
    private readonly layer: Layer;

    constructor(map: GwtkMap, mapLegendItem: LegendLeafNode, parentItem: GwtkMapLegendItem | null, layer: Layer) {
        super();

        this.map = map;
        this.mapLegendItem = mapLegendItem;
        this._parentItem = parentItem;

        this.layer = layer;
    }

    get key() {
        return this.mapLegendItem.key;
    }

    get id() {
        return this.mapLegendItem.key;
    }

    get text() {
        return this.mapLegendItem.text;
    }

    get code() {
        return this.mapLegendItem.code;
    }

    get local() {
        return this.mapLegendItem.local;
    }

    get mapLayerId(): string {
        return this.layer.xId;
    }

    get itemType(): LEGEND_ITEM_TYPE {
        return LEGEND_ITEM_TYPE.ClassifierObject;
    }

    get itemName(): string {
        return this.mapLegendItem.text;
    }

    get isRootElement(): boolean {
        return this._parentItem === null;
    }

    get parentItem(): GwtkMapLegendItem | null {
        return this._parentItem;
    }

    get itemIcon() {
        return this.mapLegendItem.image || '';
    }

    get visible(): boolean {

        if (this.key === undefined) {
            return true;
        }

        let isVisible;
        let filter = this.layer.getKeysArray();
        if (!filter) {
            isVisible = true;
        } else {
            isVisible = filter.includes(this.key);
        }

        return isVisible;
    }

    set visible(value) {

        if (this.key === undefined) {
            return;
        }

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

    get isToggleVisibilityEnabled() {
        return this.key !== undefined;
    }

}
