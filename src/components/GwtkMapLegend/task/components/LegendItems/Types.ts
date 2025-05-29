import { CommonServiceSVG } from '~/utils/GeoJSON';
import { LOCALE } from '~/types/CommonTypes';
import GwtkMapLegendItem from './GwtkMapLegendItem';

export enum LEGEND_ITEM_TYPE {
    ClassifierLayer = 'ClassifierLayer',
    ClassifierObject = 'ClassifierObject',
    ClassifierLayerOrObjectGroup = 'ClassifierLayerOrObjectGroup'
}

export enum LEGEND_SHOW_MODE {
    ReadOnlyMode = 'ReadOnlyMode',
    VisibilityControlMode = 'VisibilityControlMode',
    ItemSelectionMode = 'ItemSelectionMode',
    LayerStyleSettingsMode = 'LayerStyleSettingsMode',
}

export type LayerIdLegendMode = {
    layerId: string,
    mode: LEGEND_SHOW_MODE,
    sld?: CommonServiceSVG[],
    type?: LOCALE,
    selectedLegendObjectList?: GwtkMapLegendItem[] | TreeItem[]
}

export type TreeItem = {
    key: string;
    name: string;
    children: TreeItem[];
    icon?: string;
    isToggleVisibilityEnabled: boolean;
    visible: boolean;
    itemType: LEGEND_ITEM_TYPE;
    type?: LOCALE;
    local?: LOCALE
}

export const LEGEND_KEY_DELIMITER = ',';