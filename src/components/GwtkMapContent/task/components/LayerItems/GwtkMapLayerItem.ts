import { GwtkMap, Visibility } from '~/types/Types';
import { OUTTYPE } from '~/services/RequestServices/common/enumerables';
import { ContentTreeNode, TreeNodeType, USER_LAYERS_FOLDER_ID } from '~/utils/MapTreeJSON';
import GwtkGroupLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkGroupLayerItem';


const ICON_DICTIONARY = {
    'ico_esri': 'geoportals/esri',
    'ico_google': 'geoportals/google',
    'ico_google_hybr': 'geoportals/google_hybr',
    'ico_google_land': 'geoportals/google_land',
    'ico_google_map': 'geoportals/google_map',
    'ico_google_sat': 'geoportals/google_sat',
    'ico_google_traff': 'geoportals/google_traff',
    'ico_map_template': 'geoportals/map_template',
    'ico_osm': 'geoportals/osm',
    'ico_panorama': 'geoportals/panorama',
    'ico_roscosmos': 'geoportals/roscosmos',
    'ico_rosreestr': 'geoportals/rosreestr-colored',
    'ico_yandex': 'geoportals/yandex',
    'ico_yandex_hybr': 'geoportals/yandex_hybr',
    'ico_yandex_map': 'geoportals/yandex_map',
    'ico_yandex_sat': 'geoportals/yandex_sat',
    'icon-page': 'mdi-map'
};


export default class GwtkMapLayerItem {

    protected readonly map!: GwtkMap;

    protected readonly _contentTreeItem: ContentTreeNode;

    protected readonly _parentItem: GwtkGroupLayerItem | null;

    constructor(map: GwtkMap, contentTreeItem: ContentTreeNode, parentItem: GwtkGroupLayerItem | null) {
        Reflect.defineProperty(this, 'map', {
            enumerable: true,
            get: function() {
                return map;
            }.bind(this)
        });
        this._contentTreeItem = contentTreeItem;
        this._parentItem = parentItem;

        this.viewEntireLayer = this.viewEntireLayer.bind(this);
        this.setOpacityLayer = this.setOpacityLayer.bind(this);
    }

    get skipEmptyNodes(): boolean {
        return !this.map.options.holdFolderTreeNodes && this.parentItem && (this.parentItem.skipEmptyNodes || this.parentItem.isVirtualFolder) || false;
    }

    get layerName(): string {
        return this._contentTreeItem.text;
    }

    get layerGUID(): string {
        return this._contentTreeItem.id;
    }

    get isRootElement(): boolean {
        return this._contentTreeItem.id === 'root';
    }

    get visible() {
        return true;
    }

    set visible(value) {

    }

    get visibility(): Visibility {
        return this.visible ? 'visible' : 'hidden';
    }

    set disabledFlag(value: boolean) {

        if (this.map.contentTreeManager) {
            this.map.contentTreeManager.updateTreeNodeList({ ...this.contentTreeItem, disabled: value });
        }

        this.contentTreeItem.disabled = value;

        this.map.trigger({ type: 'visibilitychanged', target: 'map', maplayer: { id: this._contentTreeItem.id, visible: value } });
    }

    get disabledFlag(): boolean {
        return this.contentTreeItem.disabled || false;
    }

    get disabled(): boolean {
        let disabled = this.disabledFlag;
        if (!disabled && this.parentItem) {
            disabled = this.parentItem.disabled;
        }
        return disabled;
    }

    get isGroupItem(): boolean {
        return (this._contentTreeItem.nodeType === TreeNodeType.Group || this.isVirtualFolder);
    }

    get getItemIconName(): string {
        const imageName = this._contentTreeItem.img as keyof typeof ICON_DICTIONARY | undefined;
        if (imageName && imageName in ICON_DICTIONARY) {
            return ICON_DICTIONARY[imageName];
        } else {
            if (this.isGroupItem) {
                return 'mdi-folder-outline';
            } else {
                return ICON_DICTIONARY['icon-page'];
            }
        }
    }

    /**
     * Получить url изображения
     */
    get getItemImgUrl(): string | undefined {
        return this._contentTreeItem.imgurl;
    }

    get opacity(): number {
        return 100;
    }

    get exportTypes(): string[] {
        return [];
    }

    get parentItem(): GwtkGroupLayerItem | null {
        return this._parentItem;
    }

    viewEntireLayer() {
    }

    setOpacityLayer(opacity: number) {
    }

    download(type: OUTTYPE) {
    }

    async getObjectList(): Promise<unknown> {
        return;
    }

    close() {
    }

    remove() {
    }

    update() {
    }

    get isHeatLayer() {
        return this._contentTreeItem.nodeType === TreeNodeType.HeatLayer;
    }

    get isThematicLayer() {
        return this._contentTreeItem.nodeType === TreeNodeType.ThematicLayer;
    }

    get isLocalLayer() {
        return this._contentTreeItem.nodeType === TreeNodeType.LocalLayer;
    }

    get isVirtualFolder() {
        return this._contentTreeItem.nodeType === TreeNodeType.VirtualFolder;
    }

    get contentTreeItem() {
        return this._contentTreeItem;
    }

    get nodes() {
        return this._contentTreeItem.nodes;
    }

    get isObjectListEnabled() {
        return false;
    }

    get isLegendViewEnabled() {
        return false;
    }

    get isCloseEnabled(): boolean {
        // return !!(this.layerTreeItem.isLocalLayer ||
        //     this.layerTreeItem.isHeatLayer ||
        //     this.layerTreeItem.isThematicLayer);
        return (this.parentItem && this.parentItem.contentTreeItem.id === USER_LAYERS_FOLDER_ID)
            || (this.contentTreeItem && this.contentTreeItem.parentId === USER_LAYERS_FOLDER_ID);

    }

    get isRemoveEnabled(): boolean {
        return false;
    }

    get isTooltipMap(): boolean {
        return false;
    }

    get isEditable(): boolean {
        return false;
    }

    get isAdditionalSld(): boolean {
        return false;
    }

    /**
     * Флаг наличия пользовательского фильтра
     * @readonly
     * @property isFilteredByUser {boolean}
     */
    get isFilteredByUser(): boolean {
        return false;
    }
}
