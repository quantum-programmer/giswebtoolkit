/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Виджет компонента "Состав карты"                 *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Watch } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { LayerTreeListItems, ProgressParameters } from '@/components/GwtkMapContent/Types';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkMapContentTaskState,
    PublishMapObject,
    MapContentTreeViewNodes,
    CREATE_LOCAL_LAYER,
    OPEN_LOCAL_LAYER,
    SET_CURRENT_MAP_LAYER_ITEM,
    OPEN_PUBLISH_MAP_DIALOG,
    UNLOCK,
    SldWidgetObject,
} from '@/components/GwtkMapContent/task/GwtkMapContentTask';
import GwtkMapLayerItem from './components/LayerItems/GwtkMapLayerItem';
import GwtkMapLayerFactory from './components/LayerItems/GwtkMapLayerFactory';
import GwtkMapContentToolbar from './components/Toolbar/GwtkMapContentToolbar.vue';
import GwtkMapContentItemMenuWidget from './components/ItemMenu/GwtkMapContentItemMenuWidget.vue';
import GwtkGroupItemMenuWidget from './components/ItemMenu/GwtkGroupItemMenuWidget.vue';
import GwtkTags from './components/GwtkTags';
import GwtkMapContentTree from './components/GwtkMapContentTree';
import GwtkMapContentGroup from './components/GwtkMapContentGroup';
import GwtkMapContentFilter from './components/GwtkMapContentFilter';
import GwtkMapContentOrder from './components/GwtkMapContentOrder';
import GwtkMapContentPublishMap from './components/GwtkMapContentPublishMap';
import GwtkMapContentLayerStylesSettings from './components/GwtkMapContentLayerStylesSettings';
import { GwtkMapLegendItemReduced, MapMarkersCommandsFlags, MarkerIcon, MarkerImageCategory } from '~/types/Types';
import GwtkMapContentVisibleControl from './components/GwtkMapContentVisibleControl';
import {ContentTreeNode} from '~/utils/MapTreeJSON';
import GwtkGroupLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkGroupLayerItem';
import GwtkProgress from './components/GwtkProgress';


export const LAYERS_BY_GROUPS = 'tab_by_groups';
export const LAYERS_BY_ORDER = 'tab_by_order';
export const LAYERS_BY_FILTER = 'tab_by_filter';
export const LAYERS_BY_TREE = 'tab_by_tree';
export const LAYER_PUBLISH = 'tab_layer_publish';
export const LAYER_PUBLISH_DND = 'tab_layer_publish_dnd';
export const LAYER_STYLES_SETTINGS = 'tab_layer_styles_settings';

/**
 * Виджет компонента
 * @class GwtkMapContentWidget
 * @extends BaseGwtkVueComponent
 */
@Component({
    components: {
        GwtkMapContentItemMenuWidget,
        GwtkGroupItemMenuWidget,
        GwtkMapContentToolbar,
        GwtkTags: GwtkTags,
        GwtkMapContentTree,
        GwtkMapContentGroup,
        GwtkMapContentFilter,
        GwtkMapContentOrder,
        GwtkMapContentPublishMap,
        GwtkMapContentVisibleControl,
        GwtkMapContentLayerStylesSettings,
        GwtkProgress
    }
})
export default class GwtkMapContentWidget extends BaseGwtkVueComponent {

    @Prop({ default: '' })
    readonly taskId!: string;

    @Prop({ default: '' })
    readonly viewMode!: string;

    @Prop({ default: () => ({}) })
    readonly description!: TaskDescription;

    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkMapContentTaskState>(key: K, value: GwtkMapContentTaskState[K]) => void;

    /**
     * Items for order view
     */
    @Prop({default:()=>[]})
    readonly listItems!: LayerTreeListItems;

    @Prop({default: 0})
    readonly ver!: number;

    /**
     * Items for groups
     */
    @Prop({default: null})
    readonly currentMapLayerItem!: ContentTreeNode | null;

    @Prop({default: null})
    readonly rootMapLayerItem!: ContentTreeNode | null;

    @Prop({default: null})
    readonly rootItemTree!: ContentTreeNode[] | undefined;

    /**
     * Items for tree view
     */
    @Prop({ default: null })
    readonly treeViewItem!: MapContentTreeViewNodes;

    @Prop({ default: null })
    readonly treeItemStatistics!: { show: number, layer: number, editable: number, tooltip: number };

    @Prop({ default: null })
    readonly openTreeElement!: string[];

    /**
     * Elements by search filter
     */
    @Prop({default: null})
    readonly searchListItems!: { item: ContentTreeNode, path: string }[];

    @Prop({ default: false })
    readonly showSearch!: boolean;

    @Prop({ default: '' })
    readonly searchValue!: string;

    @Prop({default: () => []})
    readonly allTags!: string[];

    @Prop({default: () => []})
    readonly selectedTags!: string[];

    @Prop({ default: () => ({}) })
    readonly publishMapObject!: PublishMapObject;

    @Prop({  default: () => ({})  } )
    readonly sldObject!:SldWidgetObject;

    @Prop( { default: () => ([]) } )
    private readonly markerImageList!: MarkerIcon[];

    @Prop( { default: () => ([]) } )
    private readonly markerCategoryList!: MarkerImageCategory[];

    @Prop( { default: () => ({}) } )
    private readonly mapMarkersCommands!: MapMarkersCommandsFlags;

    @Prop( { default: '' })
    readonly localLayerName!: string;

    @Prop({ default: false })
    readonly showOpenLocalLayerSettings!: boolean;

    @Prop({ default: () => ([]) })
    dynamicLabelData!: {
        id: string;
        dynamicLabel: boolean;
    }[];

    @Prop( { default: () => ([]) } )
    readonly selectedLegendObjectList!: GwtkMapLegendItemReduced[];

    @Prop({ default: () => ([]) })
    readonly menuListItems!: any[];

    @Prop( { default: '' })
    readonly layerNodeId!: string;

    @Prop({ default: false })
    private readonly isUserLogged!: boolean;

    @Prop({ default: undefined })
    private readonly userLogin!: string | undefined;

    @Prop( { default: () => ({}) } )
    private readonly progress!: ProgressParameters;

    @Prop({default: false})
    private readonly isBlocked!: boolean;

    private onDrop(e: DragEvent) {
        if (e.dataTransfer) {
            this.setState(OPEN_PUBLISH_MAP_DIALOG, e.dataTransfer.files);
        }
    }

    @Watch('ver')
    onVerUpdate() {
        //fixme для чего нужен этот вотчер
        const map = this.mapVue.getMap();

        let targetMapLayerItem: GwtkMapLayerItem | null = null;
        if (this.currentMapLayerItem) {
            let parentItem;
            if (this.currentMapLayerItem.parentId) {
                const node = map.contentTreeManager.getNode(this.currentMapLayerItem.parentId);
                parentItem = GwtkMapLayerFactory.createMapLayerItem(map, node, null) as GwtkGroupLayerItem;
            }
            targetMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(map, this.currentMapLayerItem, parentItem || null);

        }
        while (targetMapLayerItem) {
            const rootContentTreeItem = map.contentTreeManager.getNode(targetMapLayerItem.contentTreeItem.id);

            if (rootContentTreeItem) {
                targetMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(map, rootContentTreeItem, targetMapLayerItem ? targetMapLayerItem.parentItem : null);
                break;
            }
            targetMapLayerItem = targetMapLayerItem.parentItem;
        }

        if (!targetMapLayerItem) {
            const rootContentTreeItem = map.contentTreeManager.contentTree;
            targetMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(map, rootContentTreeItem, null);
        }

        this.setState(SET_CURRENT_MAP_LAYER_ITEM, targetMapLayerItem.contentTreeItem);

        this.$forceUpdate();
    }

    get currentMode() {
        if ((this.searchValue || this.selectedTags.length > 0) && this.viewMode !== LAYER_STYLES_SETTINGS) {
            return LAYERS_BY_FILTER;
        }
        return this.viewMode;
    }

    get isTabByFilter() {
        return this.currentMode === LAYERS_BY_FILTER;
    }

    get isTabByGroups() {
        return this.currentMode === LAYERS_BY_GROUPS;
    }

    get isTabByTree() {
        return this.currentMode === LAYERS_BY_TREE;
    }

    get isTabByOrder() {
        return this.currentMode === LAYERS_BY_ORDER;
    }

    get isTabPublishMap() {
        return this.currentMode === LAYER_PUBLISH;
    }

    get isTabPublishMapDnd() {
        return this.currentMode === LAYER_PUBLISH_DND;
    }

    get isTabLayerStylesSettings() {
        return this.currentMode === LAYER_STYLES_SETTINGS;
    }

    get cancelText(): string {
        return this.$t('phrases.Cancel') as string;
    }

    createLayerButtonHandler(name: string) {
        this.setState(CREATE_LOCAL_LAYER, name);
    }

    openLayerButtonHandler() {
        this.setState(OPEN_LOCAL_LAYER, undefined);
    }

    unlock() {
        this.setState(UNLOCK, undefined);
    }

}
