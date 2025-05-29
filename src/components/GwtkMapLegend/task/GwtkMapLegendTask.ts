/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент "Легенду карты"                      *
 *                                                                  *
 *******************************************************************/

import MapWindow, {ButtonDescription} from '~/MapWindow';
import Task from '~/taskmanager/Task';
import {
    EditorLayoutDescription,
    GwtkComponentDescriptionPropsData,
    GwtkMapLegendItemReduced,
    LEGEND_NODE_TYPE,
    LEGEND_OBJECT_DRAWING_TYPE,
    MapMarkersCommands,
    MapMarkersCommandsFlags,
    MarkerIcon,
    MarkerImageCategory
} from '~/types/Types';
import GwtkMapLegendWidget from './GwtkMapLegendWidget.vue';
import {
    ClassifierLayer,
    ClassifierLayerOrObjectGroup,
    ClassifierObject,
    GwtkMapLegendItem
} from './components/LegendItems';
import {LayerIdLegendMode, LEGEND_SHOW_MODE, TreeItem} from './components/LegendItems/Types';
import {MapObjectType} from '~/mapobject/MapObject';
import {LOCALE, LogEventType} from '~/types/CommonTypes';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import i18n from '@/plugins/i18n';
import TextStyle from '~/style/TextStyle';
import Hatch from '~/style/Hatch';
import MarkerStyle, {MarkerOptions} from '~/style/MarkerStyle';
import {CommonServiceSVG, SvgFill, SvgMarker, SvgStroke} from '~/utils/GeoJSON';
import {DEFAULT_SVG_MARKER_ID} from '~/renderer/SVGrenderer';
import Layer from '~/maplayers/Layer';
import {BrowserService} from '~/services/BrowserService';
import Utils from '~/services/Utils';
import {DataChangedEvent} from '~/taskmanager/TaskManager';
import GwtkError from '~/utils/GwtkError';
import { PROJECT_SETTINGS_MAP_LEGEND, VIEW_SETTINGS_MAPCENTER, WorkspaceValues } from '~/utils/WorkspaceManager';


export const CHANGE_CURRENT_MAP_LAYER_ID = 'gwtkmaplegend.changecurrentmaplayerid';
export const TOGGLE_CURRENT_MAP_LEGEND_ITEM = 'gwtkmaplegend.togglecurrentmaplegenditem';
export const SET_CURRENT_MAP_LEGEND_ITEM = 'gwtkmaplegend.setcurrentmaplegenditem';
export const SET_LEGEND_ITEM_SELECTION_MODE = 'gwtkmaplegend.setlegenditemselectionmode';
export const SET_LEGEND_VISIBILITY_CONTROL_MODE = 'gwtkmaplegend.setlegendvisibilitycontrolmode';
export const FINISH_SELECT_LEGEND_ITEM = 'gwtkmaplegend.finishselectlegenditem';
export const SET_SELECTED_LEGEND_ITEM = 'gwtkmaplegend.setselectedlegenditem';
export const SET_SELECTED_LEGEND_ITEM_ADDITIONAL_STYLE = 'gwtkmaplegend.setselectedlegenditemadditionalstyle';
export const ACTIVATE_DRAWING_TYPE_BUTTON = 'gwtkmaplegend.toggledrawingtypebutton';
export const SET_CREATING_OBJECT_TYPE = 'gwtkmaplegend.setcreatingobjecttype';
export const UPDATE_TEXT_TITLE = 'gwtkmaplegend.updatetexttitle';
export const UPDATE_ICON = 'gwtkmaplegend.updateicon';
export const UPLOAD_MARKER_ICON = 'gwtkmaplegend.uploadmarkericon';
export const REMOVE_MARKER_ICON = 'gwtkmaplegend.removemarkericon';
export const SET_MARKER_ICON = 'gwtkmaplegend.setmarkericon';
export const UPDATE_PREVIEW_IMAGE = 'gwtkmaplegend.updatepreviewimage';
export const UPDATE_STYLES_ORDER = 'gwtkmaplegend.updatestylesorder';
export const LOCK_LAYER = 'gwtkmaplegend.locklayer';
export const SHOW_SEARCH = 'gwtkmaplegend.showsearch';
export const SET_SHOW_LEGENDS_TYPE = 'gwtkmaplegend.setshowlegendstype';
export const ON_INPUT_SEARCH = 'gwtkmaplegend.oninputsearch';
export const ON_SEARCH_LEGEND_CLICKED = 'gwtkmaplegend.onsearchlegendclicked';
export const ACROSS_ALL_ACTIVE_LAYERS = 'gwtkmaplegend.acrossallselectedlayers';
export const TOGGLE_MENU_ITEM = 'gwtkmaplegend.togglemenuitem';
export const TOGGLE_MENU_VISIBILITY = 'gwtkmaplegend.togglemenuvisibility';
export const TOGGLE_MENU_EXPAND = 'gwtkmaplegend.togglemenuexpand';
export const UPDATE_ALL_NODE_KEYS = 'gwtkmaplegend.updateallnodekeys';
export const UPDATE_OPEN_TREE_ELEMENT = 'gwtkmaplegend.updateopentreeelement';
export const TOGGLE_READ_ONLY_MODE = 'gwtkmaplegend.togglereadonlymode';
export const TOGGLE_MAP_LEGEND_ITEM_ADDITIONAL_STYLE = 'gwtkmaplegend.togglemaplegenditemadditionalstyle';


export type GwtkMapLegendTaskState = {
    [CHANGE_CURRENT_MAP_LAYER_ID]: LayerIdLegendMode;
    [TOGGLE_CURRENT_MAP_LEGEND_ITEM]: ClassifierObject | null;
    [SET_CURRENT_MAP_LEGEND_ITEM]: ClassifierObject | null;
    [SET_LEGEND_ITEM_SELECTION_MODE]: { resolve: (value: EditorLayoutDescription) => void; reject: () => void; };
    [SET_LEGEND_VISIBILITY_CONTROL_MODE]: boolean;
    [FINISH_SELECT_LEGEND_ITEM]: boolean;
    [SET_SELECTED_LEGEND_ITEM]: boolean;
    [SET_SELECTED_LEGEND_ITEM_ADDITIONAL_STYLE]: boolean;
    [ACTIVATE_DRAWING_TYPE_BUTTON]: LEGEND_OBJECT_DRAWING_TYPE;
    [SET_CREATING_OBJECT_TYPE]: LOCALE;
    [LOCK_LAYER]: boolean;

    [UPDATE_TEXT_TITLE]: string;
    [UPDATE_ICON]: string;
    [UPLOAD_MARKER_ICON]: MarkerIcon;
    [REMOVE_MARKER_ICON]: string;
    [SET_MARKER_ICON]: MarkerOptions;
    [UPDATE_PREVIEW_IMAGE]: undefined;
    [UPDATE_STYLES_ORDER]: Style[];
    [SHOW_SEARCH]: undefined;
    [SET_SHOW_LEGENDS_TYPE]: LegendViewMode;
    [ON_INPUT_SEARCH]: string;
    [ON_SEARCH_LEGEND_CLICKED]: GwtkMapLegendItem;
    [ACROSS_ALL_ACTIVE_LAYERS]: undefined;
    [TOGGLE_MENU_ITEM]: LegendMenu;
    [TOGGLE_MENU_VISIBILITY]: boolean;
    [TOGGLE_MENU_EXPAND]: boolean;
    [UPDATE_ALL_NODE_KEYS]: string[];
    [UPDATE_OPEN_TREE_ELEMENT]: string[];
    [TOGGLE_READ_ONLY_MODE]: undefined;
    [TOGGLE_MAP_LEGEND_ITEM_ADDITIONAL_STYLE]: GwtkMapLegendItemReduced;
}

export type GwtkMapLegendItemWrapper = {
    layerId: string;
    mapLegendItem: GwtkMapLegendItem | null;
};

export type MapLayerWithLegendDescription = {
    layerId: string;
    layerName: string;
};

type WorkspaceData = {
    markerImageList: MarkerIcon[];
    selectedShowLegendType: LegendViewMode;
    selectedMapLayerId: string;
    allActiveLayers: boolean;
}

export enum LegendViewMode {
    Group = 'group',
    List = 'list',
    Tree = 'tree'
}

export enum LegendMenu {
    SHOW_ALL,
    HIDE_ALL,
    EXPAND_ALL,
    COLLAPSE_ALL,
}

type WidgetParams = {
    setState: GwtkMapLegendTask['setState'];
    buttons: ButtonDescription[];
    currentMapLegendItemWrapper: GwtkMapLegendItemWrapper;
    legendItemWrapperList: GwtkMapLegendItemWrapper[];
    mapLayersWithLegendDescriptions: { layerId: string; layerName: string; }[];
    mapLegendItemSelected: ClassifierObject | null;
    mapLegendItemsSelectedList: GwtkMapLegendItemReduced[];
    legendShowMode: LEGEND_SHOW_MODE;
    layerIsLocked: boolean;
    selectedMapLayerId: string;
    creatingObjectType: LOCALE;
    previewImageSrc: string;

    styleOptions: Style[];
    activeRequestCancelHandler?: () => void;

    disabledTab: boolean;

    markerImageList: MarkerIcon[];
    mapMarkersCommands: MapMarkersCommandsFlags;
    markerCategoryList: MarkerImageCategory[];
    showSearch: boolean;
    selectedShowLegendsType: LegendViewMode;
    searchValue: string;
    searchResult: GwtkMapLegendItem[];

    openTreeElement: string[];
    isVisibilityAvailable: boolean;
    allActiveLayers: boolean;
}

/**
 * Команда создания компонента
 * @class GwtkMapLegendTask
 * @extends Action
 */
export default class GwtkMapLegendTask extends Task {

    private treeNodeKeys: string[] = [];

    private allVisibilityOn: boolean | undefined = undefined;

    private rootMapLegendItem = new ClassifierLayerOrObjectGroup({
        key: 'superRoot',
        text: 'superRoot',
        type: LEGEND_NODE_TYPE.Root,
        nodes: []
    });

    private textTitle = '';

    protected workspaceData: WorkspaceData = {
        markerImageList: [],
        selectedShowLegendType: LegendViewMode.Tree,
        selectedMapLayerId: '',
        allActiveLayers: false
    };

    protected mapMarkersCommands: MapMarkersCommands = {saveImage: '', deleteImage: '', getImages: '', getCategory: ''};

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    protected readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private mapLegendItemSelectedLocal?: string;

    private checkActiveObjectInterval: number | undefined;

    resolveFunction?: (result: EditorLayoutDescription | GwtkMapLegendItemReduced[] ) => void;
    rejectFunction?: () => void;

    constructor(mapWindow: MapWindow, taskId: string) {
        super(mapWindow, taskId);


        // Создание Vue компонента
        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            buttons: [
                {
                    id: LEGEND_OBJECT_DRAWING_TYPE.AnyContour,
                    active: false,
                    enabled: false,
                    options: {
                        icon: 'mdi-chart-line-variant',
                        title: 'legend.Any contour'
                    }
                },
                {
                    id: LEGEND_OBJECT_DRAWING_TYPE.HorizontalRectangle,
                    active: false,
                    enabled: false,
                    options: {
                        icon: 'mdi-rectangle-outline',
                        title: 'legend.Horizontal rectangle'
                    }
                },
                {
                    id: LEGEND_OBJECT_DRAWING_TYPE.InclinedRectangle,
                    active: false,
                    enabled: false,
                    options: {
                        icon: 'mdi-rhombus-outline',
                        title: 'legend.Inclined rectangle'
                    }
                },
                //TODO: слишком неудобно и неявно для мобильной версии
                // {
                //     id: LEGEND_OBJECT_DRAWING_TYPE.ComplexRectangle,
                //     active: false,
                //     enabled: false,
                //     options: {
                //         icon: 'mdi-vector-combine',
                //         title: 'legend.Difficult rectangle'
                //     }
                // },
                {
                    id: LEGEND_OBJECT_DRAWING_TYPE.Circle,
                    active: false,
                    enabled: false,
                    options: {
                        icon: 'mdi-radius-outline',
                        title: 'legend.Circle'
                    }
                },
                {
                    id: LEGEND_OBJECT_DRAWING_TYPE.FromFile,
                    active: false,
                    enabled: false,
                    options: {
                        icon: 'create-object-by-file',
                        title: 'legend.Creation using coordinates loaded from a file'
                    }
                },
                {
                    id: LEGEND_OBJECT_DRAWING_TYPE.ManualInput,
                    active: false,
                    enabled: false,
                    options: {
                        icon: 'mdi-keyboard-outline',
                        title: 'legend.Entering coordinates from keyboard'
                    }
                },
                {
                    id: LEGEND_OBJECT_DRAWING_TYPE.FromObject,
                    active: false,
                    enabled: false,
                    options: {
                        icon: 'mdi-vector-square',
                        title: 'legend.Creation from active object'
                    }
                }
            ],
            currentMapLegendItemWrapper: {
                layerId: '',
                mapLegendItem: null
            },
            legendItemWrapperList: [],
            mapLayersWithLegendDescriptions: [],
            mapLegendItemSelected: null,
            mapLegendItemsSelectedList: [],
            legendShowMode: LEGEND_SHOW_MODE.ReadOnlyMode,
            layerIsLocked: false,
            selectedMapLayerId: '',
            creatingObjectType: LOCALE.Template,
            previewImageSrc: '',
            styleOptions: [],
            activeRequestCancelHandler: undefined,

            disabledTab: false,

            markerImageList: [],
            mapMarkersCommands: {isDeleteImage: false, isSaveImage: false, isGetCategory: false},
            markerCategoryList: [],
            showSearch: false,
            selectedShowLegendsType: LegendViewMode.Tree,
            searchValue: '',
            searchResult: [],

            openTreeElement: [],
            isVisibilityAvailable: false,
            allActiveLayers: false,
        };

        this.fillSearchResult = Utils.debounce(this.fillSearchResult.bind(this), 200);
        this.legendForceUpdate = Utils.debounce(this.legendForceUpdate.bind(this), 500);
    }

    async setup() {
        super.setup();

        this.fillMapLayersWithLegendDescriptions();

        if (!this.workspaceData) {
            this.workspaceData = {
                markerImageList: [],
                selectedShowLegendType: LegendViewMode.Group,
                selectedMapLayerId: '',
                allActiveLayers: false
            };
        }
        this.widgetProps.selectedShowLegendsType = this.workspaceData.selectedShowLegendType;

        if (this.workspaceData.allActiveLayers && this.widgetProps.mapLayersWithLegendDescriptions.length) {
            await this.setState(ACROSS_ALL_ACTIVE_LAYERS, undefined);
        } else {
            const layer = this.widgetProps.mapLayersWithLegendDescriptions.find(item => item.layerId === this.workspaceData.selectedMapLayerId);
            if (layer) {
                await this.setState(CHANGE_CURRENT_MAP_LAYER_ID, {
                    layerId: layer.layerId,
                    mode: LEGEND_SHOW_MODE.ReadOnlyMode
                });
            }
        }

        // if ( this.widgetProps.mapLayersWithLegendDescriptions[ 0 ] ) {
        //     this.widgetProps.selectedMapLayerId = this.widgetProps.mapLayersWithLegendDescriptions[ 0 ].layerId;
        // }


        this.widgetProps.isVisibilityAvailable = this.isVisibilityAvailable;

        this.checkActiveObjectInterval = window.setInterval(() => {
            const legend = this.widgetProps.mapLegendItemSelected;
            if (legend) {
                this.activateButtons( legend.local);
            } else if (this.widgetProps.creatingObjectType !== LOCALE.Template) {
                this.activateButtons(this.widgetProps.creatingObjectType);
            }
        }, 50);

    }

    createTaskPanel() {
        // регистрация Vue компонентов
        const name = 'GwtkMapLegendWidget';
        const source = GwtkMapLegendWidget;
        this.mapWindow.registerComponent(name, source);

        // Создание Vue компонента
        this.mapWindow.createWidget(name, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    onDataChanged(event: DataChangedEvent) {
        if (event.type === 'layercommand' && event.command === 'visibilitychanged' || event.type === 'legend') {
            this.legendForceUpdate();
        }
    }

    legendForceUpdate() {
        this.fillMapLayersWithLegendDescriptions();
        this.updateLegend().then(() => this.widgetProps.activeRequestCancelHandler = undefined);
    }

    onWorkspaceChanged(type: keyof WorkspaceValues): void {
        if (type === VIEW_SETTINGS_MAPCENTER && this.map.workspaceManager.getValue(PROJECT_SETTINGS_MAP_LEGEND)) {
            this.legendForceUpdate();
        }
    }

    get isVisibilityAvailable() {
        return this.widgetProps.legendShowMode === LEGEND_SHOW_MODE.VisibilityControlMode;
    }

    private fillMapLayersWithLegendDescriptions() {
        this.widgetProps.mapLayersWithLegendDescriptions.splice(0);
        if (this.widgetProps.legendShowMode === LEGEND_SHOW_MODE.VisibilityControlMode
            || this.widgetProps.legendShowMode === LEGEND_SHOW_MODE.ReadOnlyMode) {
            const layers = this.map.tiles.getWmsLayers();
            layers.forEach(layer => {
                if (layer.visible && layer.hasLegend()) {
                    this.widgetProps.mapLayersWithLegendDescriptions.push({
                        layerId: layer.xId,
                        layerName: layer.alias
                    });
                }
            });
        } else {
            const layers = this.map.vectorLayers;
            layers.forEach(layer => {
                this.widgetProps.mapLayersWithLegendDescriptions.push({
                    layerId: layer.xId,
                    layerName: layer.alias
                });
            });
        }
    }

    private async updateLegend() {

        if (this.widgetProps.activeRequestCancelHandler) {
            this.widgetProps.activeRequestCancelHandler();
        }

        this.rootMapLegendItem.clearChildLegendItems();

        this.widgetProps.legendItemWrapperList.splice(0);
        // const legendItemSelectedKeys:string[] = [];
        // this.widgetProps.mapLegendItemsSelectedList.forEach(mapLegendItem => legendItemSelectedKeys.push(mapLegendItem.key));

        for (let layerIndex = 0; layerIndex < this.widgetProps.mapLayersWithLegendDescriptions.length; layerIndex++) {

            const currentMapLayerId = this.widgetProps.mapLayersWithLegendDescriptions[layerIndex].layerId;

            if (!this.widgetProps.allActiveLayers && currentMapLayerId !== this.widgetProps.selectedMapLayerId) {
                continue;
            }

            let mapLayer: Layer | undefined = this.map.vectorLayers.find(layer => layer.id === currentMapLayerId);
            if (!mapLayer || this.widgetProps.legendShowMode === LEGEND_SHOW_MODE.VisibilityControlMode
                || this.widgetProps.legendShowMode === LEGEND_SHOW_MODE.ReadOnlyMode) {
                mapLayer = this.map.tiles.getLayerByxId(currentMapLayerId);
            }
            if (mapLayer) {

                let legendPromise;
                if (this.widgetProps.legendShowMode === LEGEND_SHOW_MODE.VisibilityControlMode
                    || this.widgetProps.legendShowMode === LEGEND_SHOW_MODE.ReadOnlyMode
                    || this.widgetProps.legendShowMode === LEGEND_SHOW_MODE.LayerStyleSettingsMode) {
                    this.widgetProps.activeRequestCancelHandler = mapLayer.cancelRequests.bind(mapLayer);
                    legendPromise = mapLayer.getLegend();
                } else {
                    const classifier = this.map.classifiers.getByLayer(mapLayer);
                    if (classifier) {
                        this.widgetProps.activeRequestCancelHandler = classifier.cancelRequests.bind(classifier);
                        legendPromise = classifier.getLegend();
                    }
                }
                try {
                    const legend = await legendPromise;

                    if (legend) {
                        const legendLayerItem = await ClassifierLayerOrObjectGroup.createFromRoot(
                            this.map, mapLayer, legend, this.widgetProps.legendShowMode, this.rootMapLegendItem);
                        if (this.widgetProps.legendShowMode === LEGEND_SHOW_MODE.ItemSelectionMode) {
                            legendLayerItem._itemSelectionMode = true;
                            const classifierLayerItems = legendLayerItem.childLegendItems;
                            for (let i = 0; i < classifierLayerItems.length; i++) {
                                const legendClassifierLayerItem = legendLayerItem.childLegendItems[i];
                                if (legendClassifierLayerItem instanceof ClassifierLayer) {
                                    const filter = legendClassifierLayerItem.layerKeysFilter;
                                    if (Array.isArray(filter) && filter.length > 0 && (filter.findIndex(item=>item.toLowerCase().includes(legendClassifierLayerItem.legendLayerId.toLowerCase()))===-1)) {
                                        classifierLayerItems.splice(i, 1);
                                        i--;
                                    }
                                }
                            }
                        }
                        this.rootMapLegendItem.appendChildLegendItem(legendLayerItem);
                    }
                    
                } catch (error) {
                    const gwtkError = new GwtkError(error);
                    this.map.writeProtocolMessage({
                        text: i18n.tc('legend.Map legend') + '. ' + i18n.tc('phrases.Error'),
                        description: gwtkError.message,
                        type: LogEventType.Error
                    });
                    if (this.widgetProps.legendShowMode === LEGEND_SHOW_MODE.VisibilityControlMode
                        || this.widgetProps.legendShowMode === LEGEND_SHOW_MODE.ReadOnlyMode) {
                        this.widgetProps.selectedMapLayerId = '';
                        this.widgetProps.currentMapLegendItemWrapper.mapLegendItem = null;
                    }
                }
            }

        }
        for (let i = this.rootMapLegendItem.childLegendItems.length; i >= 0; i--) {

            const item = this.rootMapLegendItem.childLegendItems[i];
            if (item && item.key) {
                if (!this.widgetProps.allActiveLayers && item.key !== this.widgetProps.selectedMapLayerId) {
                    this.rootMapLegendItem.removeByKey(item.key);
                    continue;
                }

                if (this.allVisibilityOn !== undefined) {
                    item.childLegendItems.forEach((child) => child.visible = this.allVisibilityOn!);
                }

                const index = this.widgetProps.legendItemWrapperList.findIndex((itemWrapper) => itemWrapper.layerId === item.key);
                if (index === -1) {
                    this.widgetProps.legendItemWrapperList.push({ layerId: item.key, mapLegendItem: item });
                }
            }
        }
        
        this.widgetProps.currentMapLegendItemWrapper.mapLegendItem = this.rootMapLegendItem;

    }

    async setState<K extends keyof GwtkMapLegendTaskState>(key: K, value: GwtkMapLegendTaskState[ K ]) {
        switch (key) {
            case TOGGLE_READ_ONLY_MODE:
                this.widgetProps.isVisibilityAvailable = !this.widgetProps.isVisibilityAvailable;

                if (!this.widgetProps.isVisibilityAvailable) {
                    this.widgetProps.legendShowMode = LEGEND_SHOW_MODE.ReadOnlyMode;
                } else {
                    this.widgetProps.legendShowMode = LEGEND_SHOW_MODE.VisibilityControlMode;
                }
                break;
            case UPDATE_OPEN_TREE_ELEMENT:
                this.widgetProps.openTreeElement = value as string[];
                break;
            case UPDATE_ALL_NODE_KEYS:
                this.treeNodeKeys = value as string[];
                break;
            case TOGGLE_MENU_VISIBILITY:
                this.allVisibilityOn = value as boolean;
                this.updateLegend().then(() => {
                    this.widgetProps.activeRequestCancelHandler = undefined;
                    this.allVisibilityOn = undefined;
                });
                break;
            case TOGGLE_MENU_EXPAND:
                const isExpanded = value as boolean;
                if (isExpanded) {
                    this.widgetProps.openTreeElement = this.treeNodeKeys;
                } else {
                    this.widgetProps.openTreeElement = [];
                }
                break;
            case ACROSS_ALL_ACTIVE_LAYERS:
                this.widgetProps.allActiveLayers = true;
                this.workspaceData.allActiveLayers = true;
                this.writeWorkspaceData(true);
                this.updateLegend().then(() => this.widgetProps.activeRequestCancelHandler = undefined);
                break;
            case CHANGE_CURRENT_MAP_LAYER_ID:
                this.widgetProps.allActiveLayers = false;
                this.workspaceData.allActiveLayers = false;

                const legend = value as LayerIdLegendMode;

                if (legend.selectedLegendObjectList?.length) {
                    this.widgetProps.mapLegendItemsSelectedList.splice(0);
                    this.widgetProps.mapLegendItemsSelectedList.push(...legend.selectedLegendObjectList as GwtkMapLegendItem[] & TreeItem []);
                }
                this.widgetProps.selectedMapLayerId = legend.layerId;
                this.workspaceData.selectedMapLayerId = legend.layerId;
                this.writeWorkspaceData(true);

                if (legend.type !== undefined) {
                    this.widgetProps.creatingObjectType = legend.type;
                    this.widgetProps.disabledTab = true;

                } else {
                    this.widgetProps.disabledTab = false;

                    if (this.widgetProps.creatingObjectType === LOCALE.Template) {
                        const layer = this.map.tiles.getLayerByxId(this.widgetProps.selectedMapLayerId);
                        if (!layer) {
                            this.widgetProps.creatingObjectType = LOCALE.Line;
                        }
                    }
                }

                if (legend.sld && legend.sld.length) {

                    legend.sld.forEach(item => {
                        if (item.type === 'PolygonSymbolizer') {
                            this.widgetProps.styleOptions.push(new Style({fill: Fill.fromServiceSVG({fill: '#E756FF', ...item} as SvgFill)}));
                        }

                        if (item.type === 'LineSymbolizer') {
                            this.widgetProps.styleOptions.push(new Style({stroke: Stroke.fromServiceSVG({stroke: '#414141', ...item} as SvgStroke)}));
                        }

                        if (item.type === 'PointSymbolizer') {
                            this.widgetProps.styleOptions.push(new Style({marker: MarkerStyle.fromServiceSVG({markerId: DEFAULT_SVG_MARKER_ID, ...item} as SvgMarker)}));
                        }

                        if (item.type === 'HatchSymbolizer') {
                            this.widgetProps.styleOptions.push(new Style({hatch: Hatch.fromServiceSVG(item)}));
                        }

                        if (item.type === 'TextSymbolizer') {
                            this.widgetProps.styleOptions.push(new Style({text: TextStyle.fromServiceSVG(item)}));
                        }

                    });

                } else {
                    if (legend.type !== undefined) {
                        this.widgetProps.styleOptions.push(new Style());
                    }
                }

                BrowserService.svgToBase64(BrowserService.stylesToSvgElement(this.widgetProps.styleOptions, this.widgetProps.creatingObjectType))
                    .then(result => this.widgetProps.previewImageSrc = result);

                this.widgetProps.legendShowMode = legend.mode;

                this.widgetProps.isVisibilityAvailable = this.isVisibilityAvailable;

                this.fillMapLayersWithLegendDescriptions();

                this.updateLegend().then(() => this.widgetProps.activeRequestCancelHandler = undefined);
                break;
            case ACTIVATE_DRAWING_TYPE_BUTTON:
                this.setDrawingType(value as LEGEND_OBJECT_DRAWING_TYPE);
                break;
            case TOGGLE_MAP_LEGEND_ITEM_ADDITIONAL_STYLE:
                const legendItemSelectedKeys: string[] = [];
                this.widgetProps.mapLegendItemsSelectedList.forEach(mapLegendItem => legendItemSelectedKeys.push(mapLegendItem.key));
                const legendItem = value as GwtkMapLegendItemReduced;
                if (!legendItemSelectedKeys.includes(legendItem.key)) {
                    this.widgetProps.mapLegendItemsSelectedList.push(legendItem);
                } else {
                    const index = this.widgetProps.mapLegendItemsSelectedList.findIndex(mapLegendItem => mapLegendItem.key === legendItem.key);
                    if (index !== -1) {
                        this.widgetProps.mapLegendItemsSelectedList.splice(index, 1);
                    }
                }
                break;
            case TOGGLE_CURRENT_MAP_LEGEND_ITEM:
                let local = LOCALE.Undefined;
                if (this.widgetProps.mapLegendItemSelected && this.widgetProps.mapLegendItemSelected?.key === (value as ClassifierObject)?.key) {
                    this.widgetProps.mapLegendItemSelected = null;
                    this.mapLegendItemSelectedLocal = undefined;
                } else {
                    this.widgetProps.mapLegendItemSelected = (value as ClassifierObject | null);
                    if (this.widgetProps.mapLegendItemSelected) {
                        this.mapLegendItemSelectedLocal = this.widgetProps.mapLegendItemSelected.local + '';
                        local = this.widgetProps.mapLegendItemSelected.local;
                    } else {
                        this.mapLegendItemSelectedLocal = undefined;
                    }
                }
                this.activateButtons(local);
                break;
            case SET_LEGEND_ITEM_SELECTION_MODE:
                this.widgetProps.legendShowMode = LEGEND_SHOW_MODE.ItemSelectionMode;
                this.widgetProps.isVisibilityAvailable = this.isVisibilityAvailable;
                const callback = value as { resolve: (value: EditorLayoutDescription | GwtkMapLegendItemReduced[]) => void; reject: () => void; };
                this.resolveFunction = callback.resolve;
                this.rejectFunction = callback.reject;
                break;
            case SET_SELECTED_LEGEND_ITEM_ADDITIONAL_STYLE:
                if (this.resolveFunction) {
                    this.resolveFunction(this.widgetProps.mapLegendItemsSelectedList);
                    this.rejectFunction = undefined;
                    this.resolveFunction = undefined;
                }
                this.mapWindow.getTaskManager().detachTask(this.id);
                break;
            case SET_SELECTED_LEGEND_ITEM:
                let layoutDescription: EditorLayoutDescription | undefined;

                if (this.widgetProps.creatingObjectType !== LOCALE.Template) {

                    const id = 'id' + ':' + 0;
                    const mapid = '';
                    const schema = '';
                    const local = this.widgetProps.creatingObjectType;

                    let mapObjectType = MapObjectType.LineString;
                    let title: string;
                    const sld: CommonServiceSVG[] = [];
                    let semantics;

                    this.widgetProps.styleOptions.forEach(style => {
                        switch (local) {
                            case LOCALE.Text:
                                let textOptions = style.text;
                                if (textOptions) {
                                    sld.push(...new Style({text: new TextStyle(textOptions)}).toServiceSVG());
                                }
                                title = this.textTitle;

                                mapObjectType = MapObjectType.LineString;
                                break;
                            case LOCALE.Point:
                                const markerStyle = style.marker;
                                sld.push(...new Style({marker: markerStyle}).toServiceSVG());

                                mapObjectType = MapObjectType.Point;
                                break;
                            case LOCALE.Plane:
                                const polygonFill = style.fill;
                                if (polygonFill) {
                                    sld.push(...new Style({fill: new Fill(polygonFill)}).toServiceSVG());
                                }

                                const polygonStroke = style.stroke;
                                if (polygonStroke) {
                                    sld.push(...new Style({stroke: new Stroke(polygonStroke)}).toServiceSVG());
                                }

                                const polygonHatch = style.hatch;
                                if (polygonHatch) {
                                    sld.push(...new Style({hatch: new Hatch(polygonHatch)}).toServiceSVG());
                                }

                                mapObjectType = MapObjectType.Polygon;
                                break;
                            case LOCALE.Line:
                            default:
                                const lineStroke = style.stroke;
                                if (lineStroke) {
                                    sld.push(...new Style({stroke: new Stroke(lineStroke)}).toServiceSVG());
                                }
                                break;
                        }

                        if (title) {
                            semantics = [{
                                key: 'ObjName',
                                name: this.map.translate('Object name'),
                                code: '9',
                                value: title
                            }];
                        }
                    });

                    const layerid = 'system';
                    const layer = 'System';

                    const mapObjectDescription = {
                        id,
                        layer,
                        layerid,
                        local,
                        mapid,
                        key: '',
                        name: i18n.t('legend.Graphic object') as string,
                        schema,
                        semantics,
                        sld
                    };

                    layoutDescription = {
                        objectDescription: mapObjectDescription,
                        icon: '',
                        imageSrc: this.widgetProps.previewImageSrc,
                        drawingType: this.getDrawingType(),
                        mapObjectType,
                        layerXid: this.widgetProps.selectedMapLayerId
                    };

                } else if (this.widgetProps.mapLegendItemSelected) {
                    let legendLayer = '';
                    let legendLayerId = '';
                    let currentItem = this.widgetProps.mapLegendItemSelected as GwtkMapLegendItem;

                    while (legendLayer === '' && legendLayerId === '' && currentItem.parentItem) {
                        currentItem = this.widgetProps.mapLegendItemSelected.parentItem!;
                        if ((currentItem as ClassifierLayer).legendLayer) {
                            legendLayer = (currentItem as ClassifierLayer).legendLayer;
                            legendLayerId = (currentItem as ClassifierLayer).legendLayerId;
                        }
                    }

                    const mapLayer = this.map.tiles.getLayerByxId(this.widgetProps.selectedMapLayerId);

                    if (mapLayer) {
                        const sheetNameList = await mapLayer.getSheetNameList();

                        const id = sheetNameList[0] + '.' + 0;
                        const mapid = mapLayer.idLayer;
                        const schema = mapLayer.options.schemename;

                        const code = this.widgetProps.mapLegendItemSelected.code;
                        const key = this.widgetProps.mapLegendItemSelected.key;

                        const local = this.widgetProps.mapLegendItemSelected.local;

                        let mapObjectType;
                        switch (+local) {
                            case LOCALE.Point:
                                mapObjectType = MapObjectType.Point;
                                break;
                            case LOCALE.Plane:
                                mapObjectType = MapObjectType.Polygon;
                                break;
                            case LOCALE.Line:
                            default:
                                mapObjectType = MapObjectType.LineString;
                                break;
                        }

                        const mapObjectDescription = {
                            id,
                            code,
                            key,
                            layer: legendLayer,
                            layerid: legendLayerId,
                            mapid,
                            name: this.widgetProps.mapLegendItemSelected.text,
                            // objectfirstpointx: number;
                            // objectfirstpointy: number;
                            schema,

                            title: this.textTitle
                        };

                        layoutDescription = {
                            objectDescription: mapObjectDescription,
                            //icon: this.widgetProps.mapLegendItemSelected.itemIcon,
                            imageSrc: this.widgetProps.mapLegendItemSelected.itemIcon,
                            drawingType: this.getDrawingType(),
                            mapObjectType,
                            layerXid: this.widgetProps.selectedMapLayerId
                        };
                    }

                }

                this.widgetProps.mapLegendItemSelected = null;
                this.widgetProps.legendShowMode = LEGEND_SHOW_MODE.ReadOnlyMode;
                this.widgetProps.isVisibilityAvailable = this.isVisibilityAvailable;

                if (this.resolveFunction && layoutDescription) {
                    this.resolveFunction(layoutDescription);
                    this.rejectFunction = undefined;
                    this.resolveFunction = undefined;
                }
                this.mapWindow.getTaskManager().detachTask(this.id, true);

                break;
            case FINISH_SELECT_LEGEND_ITEM:
                this.widgetProps.legendShowMode = LEGEND_SHOW_MODE.ReadOnlyMode;
                this.widgetProps.isVisibilityAvailable = this.isVisibilityAvailable;
                if (this.rejectFunction) {
                    this.rejectFunction();
                    this.rejectFunction = undefined;
                    this.resolveFunction = undefined;
                }
                this.mapWindow.getTaskManager().detachTask(this.id);
                break;

            case SET_CREATING_OBJECT_TYPE:
                this.widgetProps.creatingObjectType = value as LOCALE;
                if (this.widgetProps.mapLegendItemSelected) {
                    this.setState(TOGGLE_CURRENT_MAP_LEGEND_ITEM, null);
                }

                if (this.widgetProps.creatingObjectType === LOCALE.Template) {
                    const layer = this.map.tiles.getLayerByxId(this.widgetProps.selectedMapLayerId);
                    if (!layer) {
                        this.widgetProps.creatingObjectType = LOCALE.Line;
                    }
                }

                if (this.widgetProps.creatingObjectType !== LOCALE.Template) {
                    this.activateButtons(this.widgetProps.creatingObjectType);
                }

                this.widgetProps.previewImageSrc = await BrowserService.svgToBase64(BrowserService.stylesToSvgElement(this.widgetProps.styleOptions, value as LOCALE));
                break;

            case LOCK_LAYER:
                this.widgetProps.layerIsLocked = value as boolean;
                break;

            case UPDATE_TEXT_TITLE :
                this.textTitle = value as string;
                break;

            case UPLOAD_MARKER_ICON:
                //TODO для сохранения в IndexedDB
                // this.widgetProps.markerImageList.push( value as MarkerIcon );
                // this.writeWorkspaceData( true );

                this.uploadMarker(value as MarkerIcon);
                break;

            case REMOVE_MARKER_ICON:
                this.removeMarker(value as string);
                break;

            case SET_MARKER_ICON:

                const markerOptions = value as MarkerOptions;

                const index = this.widgetProps.styleOptions.findIndex(style => style.marker?.markerId === markerOptions.markerId);
                if (index !== -1) {
                    const style = {
                        ...this.widgetProps.styleOptions[index],
                        marker: new MarkerStyle(markerOptions)
                    };
                    this.widgetProps.styleOptions.splice(index, 1, new Style(style));
                }

                this.widgetProps.styleOptions.forEach((style) => {
                    if (style.marker && style.marker.markerDescription && markerOptions.markerDescription) {

                        style.marker.markerDescription.image = markerOptions.markerDescription.image;

                        style.marker.markerDescription.width = markerOptions.markerDescription.width || 0;
                        style.marker.markerDescription.height = markerOptions.markerDescription.height || 0;

                        style.marker.markerDescription.refX = markerOptions.markerDescription.refX !== undefined ? markerOptions.markerDescription.refX : style.marker.markerDescription.width / 2;
                        style.marker.markerDescription.refY = markerOptions.markerDescription.refY !== undefined ? markerOptions.markerDescription.refY : style.marker.markerDescription.height / 2;
                    }
                });

                this.setState(UPDATE_PREVIEW_IMAGE, undefined);
                break;
            case UPDATE_PREVIEW_IMAGE:
                this.widgetProps.previewImageSrc = await BrowserService.svgToBase64(BrowserService.stylesToSvgElement(this.widgetProps.styleOptions, this.widgetProps.creatingObjectType));
                break;

            case UPDATE_STYLES_ORDER:
                this.widgetProps.styleOptions.splice(0, this.widgetProps.styleOptions.length, ...value as Style[]);
                this.setState(UPDATE_PREVIEW_IMAGE, undefined);
                break;

            case SHOW_SEARCH:
                this.widgetProps.showSearch = !this.widgetProps.showSearch;
                break;

            case ON_INPUT_SEARCH:
                this.widgetProps.searchValue = value as string;
                this.fillSearchResult(this.widgetProps.searchValue);
                break;
            case ON_SEARCH_LEGEND_CLICKED:
                this.widgetProps.showSearch = false;
                this.widgetProps.currentMapLegendItemWrapper.mapLegendItem = value as GwtkMapLegendItem;
                this.widgetProps.searchValue = '';
                this.widgetProps.searchResult.splice(0);
                break;
            case SET_SHOW_LEGENDS_TYPE:
                this.widgetProps.selectedShowLegendsType = value as WorkspaceData['selectedShowLegendType'];

                // Изменить значение тип показа легенды в workspaceData
                this.workspaceData.selectedShowLegendType = value as WorkspaceData['selectedShowLegendType'];
                this.writeWorkspaceData(true);
                break;
            default:
                break;
        }
    }

    protected uploadMarker(value: MarkerIcon) {
        this.widgetProps.markerImageList.push(value);
    }

    protected removeMarker(value: string) {
        const itemIndex = this.widgetProps.markerImageList.findIndex(item => (item.id + '') == value);
        if (itemIndex > -1) {
            this.widgetProps.markerImageList.splice(itemIndex, 1);
        }
    }

    private activateButtons(locale: LOCALE) {
        let anyActiveButton = false;

        this.widgetProps.buttons.forEach(button => {
            if (locale !== LOCALE.Undefined) {
                if (button.active) {
                    anyActiveButton = true;
                }
                switch (button.id) {
                    case LEGEND_OBJECT_DRAWING_TYPE.FromObject:
                        const activeObject = this.map.getActiveObject();
                        if (activeObject) {
                            const type = activeObject.type;
                            if ((locale === LOCALE.Line && (type === MapObjectType.LineString || type === MapObjectType.MultiLineString)) ||
                            (locale === LOCALE.Point && (type === MapObjectType.Point || type === MapObjectType.MultiPoint)) ||
                            (locale === LOCALE.Plane && (type === MapObjectType.Polygon || type === MapObjectType.MultiPolygon))
                            ) {
                                button.enabled = true;
                            } else {
                                button.enabled = false;
                            }

                        } else {
                            button.enabled = false;
                        }
                        break;
                    case LEGEND_OBJECT_DRAWING_TYPE.AnyContour:
                        button.enabled = true;
                        break;
                    case LEGEND_OBJECT_DRAWING_TYPE.ComplexRectangle:
                        button.enabled = false; //TODO: добавить режимы
                        break;
                    case LEGEND_OBJECT_DRAWING_TYPE.FromFile:
                    case LEGEND_OBJECT_DRAWING_TYPE.ManualInput:
                        button.enabled = true;
                        break;
                    case LEGEND_OBJECT_DRAWING_TYPE.Circle:
                    case LEGEND_OBJECT_DRAWING_TYPE.HorizontalRectangle:
                    case LEGEND_OBJECT_DRAWING_TYPE.InclinedRectangle:
                        button.enabled = locale === LOCALE.Line || locale === LOCALE.Plane;
                        if (!button.enabled && button.active) {
                            this.widgetProps.buttons[0].active = true;
                            button.active = false;
                        }
                        break;
                }
            } else {
                button.enabled = false;
                button.active = false;
            }
        });

        if (!anyActiveButton) {
            this.widgetProps.buttons[0].active = true;
        }
    }

    private fillSearchResult(value: string) {
        this.widgetProps.searchResult.splice(0);
        if (value) {
            const searchValue = value.toLowerCase();
            const childLegendItems = this.widgetProps.currentMapLegendItemWrapper.mapLegendItem?.childLegendItems;
            if (childLegendItems) {
                childLegendItems.forEach(classifierLayerItem => {
                    if (classifierLayerItem.itemName.toLowerCase().includes(searchValue)) {
                        this.widgetProps.searchResult.push(classifierLayerItem);
                    }

                    classifierLayerItem.childLegendItems.forEach(classifierObjectItem => {
                        if (classifierObjectItem.itemName.toLowerCase().includes(searchValue)) {
                            this.widgetProps.searchResult.push(classifierObjectItem);
                        }
                    });
                });
            }

        }
    }

    private setDrawingType(id: LEGEND_OBJECT_DRAWING_TYPE) {
        this.widgetProps.buttons.forEach(button => {
            button.active = button.id === id;
        });
    }

    private getDrawingType() {
        let result = LEGEND_OBJECT_DRAWING_TYPE.AnyContour;
        const button = this.widgetProps.buttons.find((button) => button.active);
        if (button) {
            result = button.id as LEGEND_OBJECT_DRAWING_TYPE;
        }
        return result;
    }


    protected destroy() {
        super.destroy();
        if (this.rejectFunction) {
            this.rejectFunction();
        }
        this.rejectFunction = undefined;
        this.resolveFunction = undefined;
        window.clearInterval(this.checkActiveObjectInterval);
    }

}
