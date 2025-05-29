import { LOCALE } from '~/types/CommonTypes';
import { LEGEND_ITEM_TYPE } from '../LegendItems/Types';

export default class GwtkMapLegendItem {
    private _local: LOCALE = LOCALE.Line;
    public get local(): LOCALE {
        return this._local;
    }
    public set local(value: LOCALE) {
        this._local = value;
    }
    constructor() {
    }

    get itemType(): LEGEND_ITEM_TYPE {
        return LEGEND_ITEM_TYPE.ClassifierObject;
    }

    get itemName(): string {
        return '';
    }

    get isRootElement(): boolean {
        return true;
    }

    get parentItem(): GwtkMapLegendItem | null {
        return null;
    }

    get childLegendItems(): GwtkMapLegendItem[] {
        return [];
    }

    get visible() {
        return true;
    }

    set visible(value) {

    }

    get halfVisible(): boolean {
        return false;
    }

    static getLegendItemType() {
        return LEGEND_ITEM_TYPE.ClassifierLayer;
    }

    get itemIcon() {
        return '';
    }

    get isToggleVisibilityEnabled(): boolean {
        return true;
    }

    get key() {
        return '';
    }

    get itemSelectionMode() {
        return false;
    }

}
