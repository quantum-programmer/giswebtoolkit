import { ClassifierLayer, GwtkMapLegendItem } from '../LegendItems';
import { GwtkMap, Legend, LEGEND_NODE_TYPE, LegendBranchNode, LegendRootNode } from '~/types/Types';
import { LEGEND_ITEM_TYPE, LEGEND_SHOW_MODE } from '../LegendItems/Types';
import Layer from '~/maplayers/Layer';

/**
 * Элемент легенды типа ClassifierLayer или типа ClassifierObjectGroup
 * @class ClassifierLayerOrObjectGroup
 * @extends GwtkMapLegendItem
 * @description static createFromLayer() используется для получения списка элементов
 * разных типов
 */
export default class ClassifierLayerOrObjectGroup extends GwtkMapLegendItem {

    private readonly _childLegendItems: GwtkMapLegendItem[];
    private readonly legendItemNodeKeys: string[];

    private readonly rootName: string = '';
    private readonly rootKey: string = '';
    private readonly isRoot: boolean = false;

    readonly _parentItem: GwtkMapLegendItem | null = null;

    _itemSelectionMode = false;

    constructor(root?: LegendRootNode, parentItem?: GwtkMapLegendItem | null) {
        super();

        this._childLegendItems = [];
        this.legendItemNodeKeys = [];

        if (root) {
            this.rootName = root.text;
            this.rootKey = root.key;
            this.isRoot = true;
        }

        if (parentItem) {
            this._parentItem = parentItem;
        }
    }

    get itemSelectionMode() {
        return this._itemSelectionMode;
    }

    get itemName() {
        if (this.isRoot) {
            return this.rootName;
        }
        return '';
    }

    get itemType(): LEGEND_ITEM_TYPE {
        return LEGEND_ITEM_TYPE.ClassifierLayerOrObjectGroup;
    }

    clearChildLegendItems() {
        this._childLegendItems.splice(0);
    }

    removeByKey(key: string) {
        const rootIndex = this._childLegendItems.findIndex((item) => (item as ClassifierLayerOrObjectGroup).rootKey === key);
        if (rootIndex > -1) {
            this._childLegendItems.splice(rootIndex, 1);
        }
    }

    appendChildLegendItem(mapLegendItem: GwtkMapLegendItem) {
        const index = this._childLegendItems.findIndex((item) => item.key === mapLegendItem.key);
        if (index === -1) {
            this._childLegendItems.push(mapLegendItem);
        }
    }

    appendLegendItemNodeKey(key: string) {
        this.legendItemNodeKeys.push(key);
    }

    getLegendItemNodeKeys() {
        return this.legendItemNodeKeys;
    }

    static async createFromRoot(map: GwtkMap, mapLayer: Layer, legend: Legend, legendShowMode: LEGEND_SHOW_MODE, parentItem: GwtkMapLegendItem) {

        const rootItem: LegendRootNode = {
            key: mapLayer.xId,
            nodes: [],
            text: mapLayer.alias,
            type: LEGEND_NODE_TYPE.Root
        };

        let classifierLayerOrObjectGroup = new ClassifierLayerOrObjectGroup(rootItem, parentItem);

        const items = await ClassifierLayerOrObjectGroup.createFromLayer(map, mapLayer, legend, legendShowMode, rootItem, classifierLayerOrObjectGroup);

        classifierLayerOrObjectGroup.appendChildLegendItem(items);

        return items;

    }

    static async createFromLayer(map: GwtkMap, mapLayer: Layer, legend: Legend, legendShowMode: LEGEND_SHOW_MODE, rootItem: LegendRootNode, parentItem: GwtkMapLegendItem) {

        if (legendShowMode === LEGEND_SHOW_MODE.ItemSelectionMode) {
            const classifiersForLayerId = mapLayer.classifier;
            if (classifiersForLayerId) {
                legend = await classifiersForLayerId.getLegend() || legend;
            }
        }

        let classifierLayerOrObjectGroup = new ClassifierLayerOrObjectGroup(rootItem, parentItem);


        if (legend) {
            const legendItems: LegendBranchNode[] = legend.nodes;
            legendItems.forEach(legendItem => {
                classifierLayerOrObjectGroup.appendChildLegendItem(new ClassifierLayer(map, legendItem, classifierLayerOrObjectGroup, mapLayer));

                // сортировка узлов по идентификатору (коду классификатора)
                legendItem.nodes?.sort((a, b) => (a.code < b.code ? -1 : 1));

                legendItem.nodes?.forEach(legendItemNode => {
                    if (legendItemNode.key !== undefined) {
                        classifierLayerOrObjectGroup.appendLegendItemNodeKey(legendItemNode.key);
                    }
                });
            });
        }


        // установить ключи объектов слоя легенды в карту
        if (mapLayer && mapLayer!.getKeysArray() === undefined) {
            mapLayer!.setKeysFilter(classifierLayerOrObjectGroup.getLegendItemNodeKeys());
        }


        return classifierLayerOrObjectGroup;
    }

    get childLegendItems(): GwtkMapLegendItem[] {
        return this._childLegendItems;
    }

    get parentItem(): GwtkMapLegendItem | null {
        return this._parentItem;
    }

    get isRootElement(): boolean {
        return true;
    }

    get key() {
        return this.rootKey;
    }

}
