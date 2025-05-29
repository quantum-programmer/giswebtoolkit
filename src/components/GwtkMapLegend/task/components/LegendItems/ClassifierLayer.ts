import GwtkMapLegendItem from '../LegendItems/GwtkMapLegendItem';
import { GwtkMap, LEGEND_NODE_TYPE, LegendBranchNode, LegendRootNode } from '~/types/Types';
import { LEGEND_ITEM_TYPE, LEGEND_KEY_DELIMITER } from '../LegendItems/Types';
import ClassifierObject from '../LegendItems/ClassifierObject';
import Layer from '~/maplayers/Layer';

export default class ClassifierLayer extends GwtkMapLegendItem {

    readonly map: GwtkMap;
    private readonly mapLegendLayer: LegendBranchNode | LegendRootNode;
    readonly _parentItem: GwtkMapLegendItem | null;

    private readonly layer: Layer;

    constructor(map: GwtkMap, mapLegendLayer: LegendBranchNode | LegendRootNode, parentItem: GwtkMapLegendItem | null, layer: Layer) {
        super();

        this.map = map;
        this.mapLegendLayer = mapLegendLayer;
        this._parentItem = parentItem;

        this.layer = layer;
    }

    getCompositeKey(parentItem: GwtkMapLegendItem | null, itemKey: string) {
        return parentItem ? parentItem.key + LEGEND_KEY_DELIMITER + itemKey : itemKey;
    }

    get key() {
        return this.getCompositeKey(this._parentItem, this.mapLegendLayer.key);
    }

    get keyOriginal() {
        return this.mapLegendLayer.key;
    }

    get legendLayerId() {
        return this.mapLegendLayer.key || '';
    }

    get legendLayer() {
        return this.mapLegendLayer.text;
    }

    get itemType(): LEGEND_ITEM_TYPE {
        return LEGEND_ITEM_TYPE.ClassifierLayer;
    }

    get itemName(): string {
        return this.mapLegendLayer.text || this.map.translate('Layer legend');
    }

    get isRootElement(): boolean {
        return this._parentItem === null;
    }

    get parentItem(): GwtkMapLegendItem | null {
        return this._parentItem;
    }

    get childLegendItems(): GwtkMapLegendItem[] {
        if (!this.mapLegendLayer.nodes) {
            return [];
        }

        let childLegendItems: GwtkMapLegendItem[] = [];

        if (this.mapLegendLayer.type === LEGEND_NODE_TYPE.Branch) {
            if (this.parentItem?.itemSelectionMode) {
                for (let childNumber = 0; childNumber < this.mapLegendLayer.nodes.length; childNumber++) {
                    if (this.textKeysFilter) {
                        if (this.textKeysFilter.exclude.length) {
                            let exclude = false;
                            for (let i = 0; i < this.textKeysFilter.exclude.length; i++) {
                                if (this.mapLegendLayer.nodes[childNumber].text.includes(this.textKeysFilter.exclude[i])) {
                                    exclude = true;
                                    break;
                                }
                            }
                            if (exclude) {
                                continue;
                            }
                        }

                        let include = true;
                        if (this.textKeysFilter.include.length) {
                            include = false;
                            for (let i = 0; i < this.textKeysFilter.include.length; i++) {
                                if (this.mapLegendLayer.nodes[childNumber].text.includes(this.textKeysFilter.include[i])) {
                                    include = true;
                                    break;
                                }
                            }
                        }

                        if (include) {
                            childLegendItems.push(new ClassifierObject(this.map, this.mapLegendLayer.nodes[childNumber], this, this.layer));
                        }

                    } else {
                        childLegendItems.push(new ClassifierObject(this.map, this.mapLegendLayer.nodes[childNumber], this, this.layer));
                    }
                }
            }
            if (!childLegendItems.length) {
                for (let childNumber = 0; childNumber < this.mapLegendLayer.nodes.length; childNumber++) {
                    childLegendItems.push(new ClassifierObject(this.map, this.mapLegendLayer.nodes[childNumber], this, this.layer));
                }
            }
        }

        return childLegendItems;
    }

    get visible(): boolean {
        let isVisible = false;
        const nodes = this.mapLegendLayer.nodes;

        let filter = this.layer.getKeysArray();
        if (!filter) {
            isVisible = true;
        } else if (nodes) {
            for (let mapLegendItemIndex = 0; mapLegendItemIndex < nodes.length; mapLegendItemIndex++) {
                const mapLegendItem = nodes[mapLegendItemIndex];
                if (mapLegendItem.key === undefined || filter.includes(mapLegendItem.key)) {
                    isVisible = true;
                    break;
                }
            }
        }

        return isVisible;
    }

    get halfVisible(): boolean {
        let isHalfVisible = false;
        const nodes = this.mapLegendLayer.nodes;
        let filter = this.layer.getKeysArray();
        if (filter && nodes) {
            let flag;
            for (let mapLegendItemIndex = 0; mapLegendItemIndex < nodes.length; mapLegendItemIndex++) {
                const mapLegendItem = nodes[mapLegendItemIndex];
                if (mapLegendItem.key === undefined || filter.includes(mapLegendItem.key)) {
                    if (flag === undefined) {
                        flag = true;
                    } else if (!flag) {
                        isHalfVisible = true;
                        break;
                    }
                } else {
                    if (flag === undefined) {
                        flag = false;
                    } else if (flag) {
                        isHalfVisible = true;
                        break;
                    }
                }
            }
        }

        return isHalfVisible;
    }

    set visible(value) {

        const nodes = this.mapLegendLayer.nodes;

        if (nodes) {
            let filter = this.layer.getKeysArray() || [];
            if (value) {
                nodes.forEach(mapLegendItem => {
                    if (mapLegendItem.key !== undefined && !filter.includes(mapLegendItem.key)) {
                        filter.push(mapLegendItem.key);
                    }
                });
            } else {
                nodes.forEach(mapLegendItem => {
                    if (mapLegendItem.key !== undefined) {
                        const index = filter.indexOf(mapLegendItem.key);
                        if (index !== -1) {
                            filter.splice(index, 1);
                        }
                    }
                });
            }

            this.layer.setKeysFilter(filter);
            this.map.tiles.wmsUpdate();

        }

    }

    get isToggleVisibilityEnabled() {
        let result = false;
        if (this.mapLegendLayer.nodes) {
            for (let i = 0; i < this.mapLegendLayer.nodes.length; i++) {
                if (this.mapLegendLayer.nodes[i].key !== undefined) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    }

    removeByKey(key: string) {
        const index = this.mapLegendLayer.nodes.findIndex((item) => item.key === key);

        if (index > -1) {
            this.mapLegendLayer.nodes.splice(index, 1);
        }
    }

    get layerKeysFilter() {
        return this.layer.legendLayerKeysFilter;
    }

    get textKeysFilter() {
        return this.layer.legendTextKeysFilter;
    }

}
