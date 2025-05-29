import { GwtkMap } from '~/types/Types';
import { mapViewEntireLayer } from '~/api/MapApi';
import { OUTTYPE } from '~/services/RequestServices/common/enumerables';
import { ContentTreeNode } from '~/utils/MapTreeJSON';
import GwtkMapLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkMapLayerItem';
import GwtkVirtualFolderItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkVirtualFolderItem';
import GwtkGroupLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkGroupLayerItem';
import Layer from '~/maplayers/Layer';
import { PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_LIST } from '~/utils/WorkspaceManager';
import WmsLayer from '~/maplayers/WmsLayer';


export default class GwtkSingleLayerItem extends GwtkMapLayerItem {

    private readonly layerId: string;

    private layerCache?: Layer | null;

    //Значение непрозрачности не реактивно, поэтому ввели внутреннюю переменную
    private opacityValue = 100;

    constructor(map: GwtkMap, contentTreeItem: ContentTreeNode, parentItem: GwtkGroupLayerItem | null) {
        super(map, contentTreeItem, parentItem);

        this.layerId = this._contentTreeItem.id;

        if (this.layer && this.layer.options.opacityValue != null) {
            this.opacityValue = this.layer.options.opacityValue;
        }
    }

    get layer() {
        if (this.layerCache === undefined) {
            this.layerCache = this.map.tiles.getLayerByxId(this.layerId) || this.map.getVectorLayerByxId(this.layerId) || null;
            if (this.getVirtualFolderItem(this) && this.layerCache === null) {
                this.layerCache = undefined;
            }
        }
        return this.layerCache;
    }

    get tags() {
        if (this.layer) {
            return this.layer.options.tags;
        }
        return [];
    }

    get disabled() {
        let result = this.disabledFlag;
        if (!result && this.parentItem) {
            result = this.parentItem.disabled;
        }

        if (!result) {
            const scale = this.map.getZoom();
            const layer = this.map.layers.find((layerFind) => layerFind.id === this.layerId);
            if (layer) {
                result = !layer.checkViewZoom(scale);
            }
        }

        return result;
    }

    get visible(): boolean {
        let isVisible = false;
        if (this.layer) {
            isVisible = this.layer.visibleFlag;
        }

        return isVisible;
    }

    set visible(value) {
        if (this.layer) {
            this.map.setLayerVisibility(this.layer, !this.layer.visibleFlag);
        } else {
            const virtualFolderItem = this.getVirtualFolderItem(this);

            if (virtualFolderItem) {
                const virtualFolder = this.map.tiles.getVirtualFolderByxId(virtualFolderItem.layerGUID);
                if (virtualFolder) {
                    const layer = virtualFolder.openLayer({ id: this.layerGUID });
                    if (layer) {
                        this.map.setLayerVisibility(layer, value);
                    }
                }
            }
        }
    }


    get opacity(): number {
        return this.opacityValue;
    }

    get exportTypes(): string[] {
        if (this.layer && this.layer.options.export) {
            return this.layer.options.export;
        }

        return [];
    }

    get isEditable() {
        if (this.layer) {
            const maplayer = this.map.getVectorLayerByxId(this.layerId);
            if (maplayer) {
                return maplayer.isEditable;
            }
        }
        return false;
    }

    /**
     * Показать весь слой в окне
     */
    viewEntireLayer() {
        if (this.layer) {
            mapViewEntireLayer(this.map, this.layer);
        }
    }

    setOpacityLayer(opacity: number) {
        if (this.layer) {
            this.map.handlers.changeLayerOpacity(this.layer, opacity);
            this.opacityValue = opacity;
        }
    }

    download(type: OUTTYPE) {
        const layer = this.map.getVectorLayerByxId(this.layerId) || this.map.tiles.getLayerByxId(this.layerId);
        if (layer) {
            return this.map.downLoadLayer(layer, type);
        }
    }

    close() {
        this.map.closeLayer(this.layerGUID);
    }

    async remove() {
        const virtualFolderItem = this.getVirtualFolderItem(this);
        if (virtualFolderItem) {
            await virtualFolderItem.removeLayer(this.layerGUID);
        }

    }

    private getVirtualFolderItem(layerTreeItem: GwtkMapLayerItem): GwtkVirtualFolderItem | undefined {
        const parent = layerTreeItem.parentItem;
        if (parent) {
            if (parent.isVirtualFolder) {
                return parent as GwtkVirtualFolderItem;
            } else {
                return this.getVirtualFolderItem(parent);
            }
        }
    }

    get isObjectListEnabled() {
        return !!this.layer && this.layer.options.selectObject && this.layer.getType() !== 'geomarkers';
    }

    get isLegendViewEnabled(): boolean {
        return !!this.layer?.hasLegend();
    }

    async getObjectList() {
        if (this.layer) {
            this.map.getTaskManager().showOverlayPanel();
            return this.map.searchManager.findAllObjects([this.layer], false, {withoutMetric: true}).finally(() => {
                this.map.getTaskManager().removeOverlayPanel();
            });
        }
    }

    get isRemoveEnabled(): boolean {
        const virtualFolder = this.getVirtualFolderItem(this);
        return !!virtualFolder && virtualFolder.isRemoveEnabled;
    }

    get isTooltipMap(): boolean {
        if (this.layer && this.layer.options.tooltip) {
            const tooltip = this.layer.options.tooltip;
            const tooltipLayerName = tooltip.layerName || false;
            const tooltipObjectName = tooltip.objectName || false;
            const tooltipImage = tooltip.image || false;
            const tooltipSemanticKeys = tooltip.semanticKeys ? tooltip.semanticKeys.length > 0 : false;
            return (tooltipLayerName || tooltipObjectName || tooltipImage || tooltipSemanticKeys);
        }

        return false;
    }
    get isAdditionalSld(): boolean {
        if (this.layer && this.layer.options.legend ) {
            const selectedLegendObjectLists = this.map.workspaceManager.getValue(PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_LIST);
            const objectsWithSld = selectedLegendObjectLists.find(selectedLegendObjectList => this.layer?.id === selectedLegendObjectList.id)?.selectedLegendObjectList;
            if (objectsWithSld && objectsWithSld?.length) {
                return true;
            }
        }
        return false;
    }

    get isFilteredByUser(): boolean {
        return (this.layer instanceof WmsLayer && this.layer.hasUserFilter);

    }
}
