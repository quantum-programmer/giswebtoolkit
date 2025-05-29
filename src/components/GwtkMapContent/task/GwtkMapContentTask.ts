/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент "Состав карты"                         *
 *                                                                  *
 *******************************************************************/

import { LayerTreeItem, LayerTreeListItems, ProgressParameters } from '@/components/GwtkMapContent/Types';
import Task from '~/taskmanager/Task';
import {
    BuildParameterOptions,
    BuildThematicMapParams,
    CURSOR_TYPE,
    GwtkComponentDescriptionPropsData,
    GwtkMapLegendItemReduced,
    Legend,
    LegendLeafNode,
    MapMarkerResponse,
    MapMarkersCommands,
    MapMarkersCommandsFlags,
    MarkerIcon,
    MarkerImageCategory,
    SldBuildObject,
    ThematicRangesData,
    UserThematicRange,
    Visibility
} from '~/types/Types';
import { LOCALE, LogEventType } from '~/types/CommonTypes';
import MapWindow from '~/MapWindow';
import GwtkMapContentWidget from '@/components/GwtkMapContent/task/GwtkMapContentWidget.vue';
import { BrowserService } from '~/services/BrowserService';
import { GwtkLayerDescription } from '~/types/Options';
import Utils from '~/services/Utils';
import { ContentTreeNode, TreeNodeType, USER_LAYERS_FOLDER_ID } from '~/utils/MapTreeJSON';
import i18n from '@/plugins/i18n';
import GwtkMapLayerFactory from '@/components/GwtkMapContent/task/components/LayerItems/GwtkMapLayerFactory';
import { DataChangedEvent } from '~/taskmanager/TaskManager';
import GwtkVirtualFolderItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkVirtualFolderItem';
import GwtkSingleLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkSingleLayerItem';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import { ServiceResponse } from '~/services/Utils/Types';
import RequestService, { HttpParams } from '~/services/RequestServices/common/RequestService';
import RestService from '~/services/RequestServices/RestService/RestService';
import GwtkGroupLayerItem from './components/LayerItems/GwtkGroupLayerItem';
import {
    DismissParams,
    GetLoadDataResponse,
    GetStatusDataResponse,
    LoadData,
    UploadFileResponse
} from '~/services/RequestServices/RestService/Types';
import GwtkError from '~/utils/GwtkError';
import FileUploader from '~/utils/FileUploader';
import {
    LAYER_PUBLISH,
    LAYER_PUBLISH_DND,
    LAYER_STYLES_SETTINGS,
    LAYERS_BY_GROUPS,
    LAYERS_BY_ORDER,
    LAYERS_BY_TREE
} from './GwtkMapContentWidget';
import VirtualFolder from '~/maplayers/VirtualFolder';
import JSZip from 'jszip';
import Style from '~/style/Style';
import { CommonServiceSVG } from '~/utils/GeoJSON';
import CsvEditor, { Cell } from '~/services/Utils/CsvEditor';
import MarkerStyle, { MarkerOptions } from '~/style/MarkerStyle';
import Stroke from '~/style/Stroke';
import TextStyle, { TextOptions } from '~/style/TextStyle';
import Fill from '~/style/Fill';
import { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import {
    PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL,
    PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_LIST,
    PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_STYLE_OPTION,
    WorkspaceValues
} from '~/utils/WorkspaceManager';
import UserThematic from '~/utils/UserThematic';
import { ParseTextToXml } from '~/services/Utils/XMLDoc';
import XMLElement from '~/services/Utils/XMLElement';
import WmsLayer from '~/maplayers/WmsLayer';
import Layer from '~/maplayers/Layer';
import { LEGEND_SHOW_MODE } from '@/components/GwtkMapLegend/task/components/LegendItems/Types';
import GwtkMapLayerItem from './components/LayerItems/GwtkMapLayerItem';


export const ABORT_FILE_UPLOAD = 'gwtkmapcontent.abortfileupload';
export const UPDATE_LAYERS_ORDER = 'gwtkmapcontent.updatelayersorder';
export const CREATE_LOCAL_LAYER = 'gwtkmapcontent.createlocallayer';
export const OPEN_LOCAL_LAYER = 'gwtkmapcontent.openlocallayer';
export const ADD_PUBLISHING_FILES = 'gwtkmapcontent.addPublishingFiles';
export const OPEN_PUBLISH_MAP_DIALOG = 'gwtkmapcontent.openpublishmapdialog';
export const SET_CURRENT_MAP_LAYER_ITEM = 'gwtkmapcontent.setcurrentmaplayeritem';
export const TOGGLE_CURRENT_MAP_LAYER_ITEM = 'gwtkmapcontent.togglecurrentmaplayeritem';
export const SEARCH_SET_CURRENT_MAP_LAYER_ITEM = 'gwtkmapcontent.searchsetcurrentmaplayeritem';
export const ON_INPUT_SEARCH = 'gwtkmapcontent.oninputsearch';
export const ON_TAG_SEARCH = 'gwtkmapcontent.onTagSearch';
export const RESET_SEARCH = 'gwtkmapcontent.resetsearch';
export const UPDATE_TREE = 'gwtkmapcontent.updatetree';
export const SHOW_TREE_ITEM = 'gwtkmapcontent.showtreeitem';
export const UPDATE_VIRTUAL_FOLDER = 'gwtkmapcontent.updatevirtualfolder';
export const INPUT_LOAD_SETTINGS_XSD = 'gwtkmapcontent.inputloadsettingsxsd';
export const SELECT_VIRTUAL_FOLDER = 'gwtkmapcomponent.selectvirtualfolder';
export const UPDATE_OPEN_TREE_ELEMENT = 'gwtkmapcontent.updateopentreeelement';
export const SCROLL_TO_FILTERED_ITEM = 'gwtkmapcontent.updateopentreeelementbyfilter';
export const SAVE_VIEW_MODE = 'gwtkmapcontent.saveviewmode';
export const SET_PUBLISH_MAP_NAME = 'gwtkmapcontenttoolbar.setpublishmapname';
export const SET_PUBLISH_MAP_SCALE = 'gwtkmapcontenttoolbar.setpublishmapscale';
export const SET_PUBLISH_MAP_CRS = 'gwtkmapcontenttoolbar.setpublishmapcrs';
export const CLICK_PUBLISH_MAP_BUTTON_OK = 'gwtkmapcontenttoolbar.clickpublishmapbuttonok';
export const CLICK_PUBLISH_MAP_BUTTON_CANCEL = 'gwtkmapcontenttoolbar.clickpublishmapbuttoncancel';
export const OPEN_SLD_EDITOR = 'gwtkmapcontent.opensldeditor';
export const CHANGE_VIEW_MODE = 'gwtkmapcontenttoolbar.changeviewmode';
export const SET_SLD_OBJECT_TYPE = 'gwtkmapcontent.setsldobjecttype';
export const SET_SELECTED_SLD_ITEM = 'gwtkmapcontent.setselectedslditem';
export const SET_MARKER_ICON = 'gwtkmapcontent.setmarkericon';
export const UPLOAD_MARKER_ICON = 'gwtkmapcontent.uploadmarkericon';
export const REMOVE_MARKER_ICON = 'gwtkmapcontent.removemarkericon';
export const UPDATE_PREVIEW_IMAGE = 'gwtkmapcontent.updatepreviewimage';
export const UPDATE_STYLES_ORDER = 'gwtkmapcontent.updatestylesorder';
export const SAVE_SLD_TEMPLATE = 'gwtkmapcontent.savesldtemplate';
export const RESET_SLD_TEMPLATE = 'gwtkmapcontent.resetsldtemplate';
export const OPEN_LAYER_STYLES_SETTINGS = 'gwtkmapcontent.openlayerstylessettings';
export const RELOAD_NODE_LEGEND = 'gwtkmapcontent.reloadnodelegend';
export const SET_ALL_LAYER_ENABLE = 'gwtkmapcontent.setalllayerenable';
export const SET_TREE_NODE_LAYER_ENABLE = 'gwtkmapcontent.settreenodelayerenable';
export const SET_ROOT_ITEMS_ENABLE = 'gwtkmapcontent.setrootitemsenable';
export const RESTORE_INITIAL_LAYERS = 'gwtkmapcontent.restoreinitiallayers';
export const SET_DYNAMIC_LABEL_LAYER = 'gwtkmapcontent.setdynamiclabellayer';
export const CALL_MAP_LEGEND_COMPONENT = 'gwtkmapcontent.callmaplegendcomponent';
export const CLICK_LAYER_STYLES_SETTINGS_OK = 'gwtkmapcontent.clicklayerstylessettingsok';
export const CLICK_LAYER_STYLES_SETTINGS_RETURN = 'gwtkmapcontent.clicklayerstylessettingsreturn';
export const CLICK_LAYER_STYLES_SETTINGS_CANCEL = 'gwtkmapcontent.clicklayerstylessettingscancel';
export const TOGGLE_MAP_LEGEND_ITEM_ADDITIONAL_STYLE = 'gwtkmapcontent.togglecurrentmaplayerstylesettingsitem';
export const SET_SELECTED_LEGEND_ITEM_ADDITIONAL_STYLE = 'gwtkmapcontent.setselectedlegenditemadditionalstyle';
export const BLOCK = 'gwtkmapcontent.block';
export const UNLOCK = 'gwtkmapcontent.unlock';


//Знаменатель масштаба карты
const PUBLISHMAPSCALE = 1000000;
const CLASS_TREE_SCROLL_ELEMENT = 'v-treeview-node__label';
const CLASS_ORDER_SCROLL_ELEMENT = 'v-list-item__title gwtk-list-item-main-slot-content-title';

//Метаданные набора данных для TXF, SXF файлов
//Условное название карты
const CARDNAMEPARAMETER = 'P010';
//Число объектов карты
const NUMBEROBJECTSPARAMETER = '.DAT';
//Код EPSG системы координат
const CRSPARAMETER = 'P004';
//Знаменатель масштаба карты
const MAPSCALEPARAMETER = '207';
//Имя файла RSC исходной карты
const CLASSIFIERPARAMETER = 'P003';
//Обобщенный тип карты
const MAPTYPEPARAMETER = 'P002';

//Предельный размер в МБ для небольшого файла
const MAX_SIZE_FOR_SINGLE_FILE_UPLOAD = 200;

//Предельный суммарный размер в МБ для публикуемых файлов
const LIMIT_PUBLISH_SIZE = 1024;

//Количество столбцов при составлении CSV файла
const CSV_COLUMN_COUNT = 2;
//Количество градаций при построении тематической карты
const RANGES_COUNT_DEFAULT = 1;

export type GwtkMapContentTaskState = {
    [ABORT_FILE_UPLOAD]: undefined;
    [UPDATE_LAYERS_ORDER]: { viewOrder: string[], xIdMoved: string };
    [CREATE_LOCAL_LAYER]: string;
    [OPEN_LOCAL_LAYER]: undefined;
    [ADD_PUBLISHING_FILES]: undefined;
    [OPEN_PUBLISH_MAP_DIALOG]: FileList;
    [SET_CURRENT_MAP_LAYER_ITEM]: ContentTreeNode | null;
    [TOGGLE_CURRENT_MAP_LAYER_ITEM]: ContentTreeNode;
    [SEARCH_SET_CURRENT_MAP_LAYER_ITEM]: ContentTreeNode | null;
    // [ CHANGE_SEARCH_SWITCHER ]: null;
    [ON_INPUT_SEARCH]: string;
    [ON_TAG_SEARCH]: string[];
    [RESET_SEARCH]: null;
    [UPDATE_TREE]: string;
    [SHOW_TREE_ITEM]: MapContentTreeViewNode;
    [UPDATE_VIRTUAL_FOLDER]: MapContentTreeViewNode;
    [INPUT_LOAD_SETTINGS_XSD]: string;
    [SELECT_VIRTUAL_FOLDER]: VirtualFolder;
    [UPDATE_OPEN_TREE_ELEMENT]: string[];
    [SCROLL_TO_FILTERED_ITEM]: string;
    [SAVE_VIEW_MODE]: string;
    [SET_PUBLISH_MAP_NAME]: string;
    [SET_PUBLISH_MAP_SCALE]: number;
    [SET_PUBLISH_MAP_CRS]: string;
    [CLICK_PUBLISH_MAP_BUTTON_OK]: undefined;
    [CLICK_PUBLISH_MAP_BUTTON_CANCEL]: undefined;
    [CHANGE_VIEW_MODE]: string;
    [OPEN_SLD_EDITOR]: undefined;
    [SET_SLD_OBJECT_TYPE]: LOCALE;
    [SET_SELECTED_SLD_ITEM]: boolean;
    [SET_MARKER_ICON]: MarkerOptions;
    [UPLOAD_MARKER_ICON]: MarkerIcon;
    [REMOVE_MARKER_ICON]: string;
    [UPDATE_PREVIEW_IMAGE]: undefined;
    [UPDATE_STYLES_ORDER]: Style[];
    [SAVE_SLD_TEMPLATE]: undefined;
    [RESET_SLD_TEMPLATE]: undefined;
    [OPEN_LAYER_STYLES_SETTINGS]: string;
    [RELOAD_NODE_LEGEND]: string;
    [SET_ALL_LAYER_ENABLE]: boolean;
    [SET_TREE_NODE_LAYER_ENABLE]: { enable: boolean, tree: GwtkMapLayerItem };
    [SET_ROOT_ITEMS_ENABLE]: boolean;
    [RESTORE_INITIAL_LAYERS]: undefined;
    [SET_DYNAMIC_LABEL_LAYER]: string;
    [CALL_MAP_LEGEND_COMPONENT]: string;
    [CLICK_LAYER_STYLES_SETTINGS_OK]: undefined;
    [CLICK_LAYER_STYLES_SETTINGS_RETURN]: undefined;
    [CLICK_LAYER_STYLES_SETTINGS_CANCEL]: undefined;
    [SET_SELECTED_LEGEND_ITEM_ADDITIONAL_STYLE]: GwtkMapLegendItemReduced[];
    [TOGGLE_MAP_LEGEND_ITEM_ADDITIONAL_STYLE]: GwtkMapLegendItemReduced;
    [BLOCK]: (() => void) | undefined;
    [UNLOCK]: undefined;
};

export type MapContentTreeViewNode = {
    id: string;
    name: string;
    children: MapContentTreeViewNodes;
    item: ContentTreeNode;
    icon: string;
    imgurl: string | undefined;
    isEditable: boolean;
    isTooltipMap: boolean;
    isVirtualFolder: boolean;
    isVirtualFolderChild: boolean;
    isLegendViewEnabled: boolean;
    isGroupItem: boolean;
    visibility: Visibility;
    visible?: boolean; //не понятно, где это свойство используется
    parentId: string;
    disabled: boolean;
    hasLegend: boolean;
    isLegendItem?: boolean;
    legendError: boolean;
    isAdditionalSld?: boolean;
    isFilteredByUser?: boolean;
    idLayer?: string;
};
export type PublishMapObject = {
    createZipProgress: number;
    isPublished: boolean;
    percentCompleted: number; //процент выполнения публикации
    publishedFolder: string;
    publishMapClassifier: string;
    publishMapCrs: string;
    publishMapFileSize: number;
    publishMapExtension: string;
    publishMapName: string;
    publishMapObjectsNumber: string;
    publishMapScale: number;
    publishMapType: string;
    uploadProgress: number; //когда не удалось опубликовать карту, значение  -1
    virtualFolderList: VirtualFolder[];
    xsdList: { list: string[], select: string };
    crsList: { list: CrsItem[], select: string };
    isReadyCreateThematic: boolean;
};

export type SldWidgetObject = {
    sldObjectType: LOCALE;
    previewImageSrc: string;
    styleOptions: SldBuildObject;
}

export type CrsItem = {
    epsg: string;
    name: string;
    comment: string;
}

export type MapContentTreeViewNodes = MapContentTreeViewNode[];


type WidgetParams = {
    setState: GwtkMapContentTask['setState'];
    activeRequestCancelHandler?: () => void;
    listItems: LayerTreeListItems;
    ver: number;
    currentMapLayerItem: ContentTreeNode | null;
    itemTree: ContentTreeNode[] | undefined;
    rootMapLayerItem: ContentTreeNode | null;
    rootItemTree: { item: ContentTreeNode | undefined, path: string }[] | undefined;
    searchValue: string;
    showSearch: boolean;
    searchListItems: { item: ContentTreeNode, path: string }[];
    treeViewItem: MapContentTreeViewNodes;
    treeItemStatistics: { show: number, layer: number, editable: number, tooltip: number };
    allTags: string[];
    selectedTags: string[];
    openTreeElement: string[];
    openGroupElement: string;
    viewMode: string;
    localLayerName: string;
    uploadLink: string;
    publishMapObject: PublishMapObject,
    showOpenLocalLayerSettings: boolean;
    sldObject: SldWidgetObject;
    buildParametersOptionsTemp: BuildParameterOptions[];
    markerImageList: MarkerIcon[];
    mapMarkersCommands: MapMarkersCommandsFlags;
    markerCategoryList: MarkerImageCategory[];
    minValue: number;
    maxValue: number;
    dynamicLabelData: {
        id: string;
        dynamicLabel: boolean;
    }[];
    selectedLegendObjectList: GwtkMapLegendItemReduced[];
    layerNodeId: string;
    nodesWithLegendIdList: string[];
    isBlocked: boolean;
    progress: ProgressParameters;
    menuListItems: any;
}

/**
 * "Тип карты" (условное обобщенное обозначение системы координат и назначения)
 */
const MAP_TYPE: { [index: string]: string } = {
    0: 'mapcontent.Error',
    1: 'mapcontent.Topographic 42 years (SC42)',
    2: 'mapcontent.Overview-geographical',
    3: 'mapcontent.Space navigation',
    4: 'mapcontent.Topographic plan of the city',
    5: 'mapcontent.Large-scale terrain plan',
    6: 'mapcontent.Aeronautical',
    7: 'mapcontent.Cylindrical Mercator',
    8: 'mapcontent.Aviation',
    9: 'mapcontent.Blank',
    10: 'mapcontent.Universal topographic Mercator North American Datum 1927 (UTM NAD 27)',
    11: 'mapcontent.Universal topographic Mercator (UTM) in on the ellipsoid WGS 84',
    12: 'mapcontent.Universal topographic Mercator (UTM) in on its ellipsoid"',
    13: 'mapcontent.Coordinate system 63 years',
    14: 'mapcontent.The system of coordinates of 95',
    15: 'mapcontent.Topographic with a nominal main point',
    16: 'mapcontent."Survey geographical map/Longitude on the globe',
    17: 'mapcontent.World Map (Millers Illyrian)',
    18: 'mapcontent.Local coording system based on SC-63',
    19: 'mapcontent.Cylindrical Mercator map of the world (EPSG:3857:EPSG:3395)',
    20: 'mapcontent.Marine Navigation System (Mercator_2SP)',
    21: 'mapcontent.GSC-2011 coordinate system',
    22: 'mapcontent.Coordinate VN-2000 system',
    23: 'mapcontent.Coordinate VN-2000/TM-3 system',
    24: 'mapcontent.Coordinate system based on PZ-90.11'
};

//разрешенные для загрузки файлы
const allowedFilesExtensions = ['.txf', '.sxf', '.mif', '.mid', '.kml', '.kmz', '.zip', 'geojson', '.json',
    '.shp', '.shx', '.prj', '.shi', '.dbf', '.cpg', '.gml', '.rsc', '.rscz', '.csv', '.dxf'];
//разрешенные для загрузки файлы с выбором XSD схемы при публикации
const allowedSingleFilesExtensions = ['.txf', '.sxf', '.kml', '.kmz', '.json', 'geojson', '.gml', '.zip', '.csv', '.dxf'];
//разрешенные расширения файлов классификатора
const classifierExtensions = ['.rsc', '.rscz'];
//расширения для формата MapInfo
const mapInfoExtensions = ['.mif', '.mid'];
//расширения для формата SHP
const shpExtensions = ['.shp', '.shx', '.prj', '.shi', '.dbf', '.cpg'];
//расширения для файлов текстового формата
const textFileExtensions = ['.mif', '.mid', '.kml', '.gml', '.json', '.geojson', '.csv',];
//расширения для файлов бинарного формата
const binaryFileExtensions = ['.sxf', '.shp', '.shx', '.kmz', '.rsc', '.rscz', '.zip', '.dxf'];

//HEX дескрипторы заголовков разрешённых файлов
const allowedFileHeaders: { [index: string]: string[] } = {
    '.sxf': ['53 58 46 00'],
    '.shp': ['00 00 27 0A'],
    '.shx': ['00 00 27 0A'],
    '.kmz': ['50 4B 03 04'],
    '.rsc': ['52 53 43 00'],
    '.rscz': ['50 4B 03 04'],
    '.zip': ['50 4B 03 04'],
    '.dxf': ['20 20 30 0D', '20 20 30 0A'],
};
//HEX дескрипторы заголовков DBF-файлов (проверка только нулевого байта)
const dbfHeaders = ['02', '03', '04', '30', '31',
    '43', '63', '83', '8B', '8C',
    'CB', 'E5', 'EB', 'F5', 'FB'];

//HEX дескрипторы заголовков TXF-файлов
const txfHeaders = ['2E 53 49 54', '2E 53 58 46'];


/**
 * Компонент Состав карты
 * @class GwtkMapContentTask
 * @extends Task
 */
export default class GwtkMapContentTask extends Task {

    protected workspaceData?: {
        mode: string; openTreeElement: string[];
        openGroupElement: string;
        styleOptions: SldBuildObject
    };

    private childLegendCollection: { [key: string]: MapContentTreeViewNode[] } = {};
    private readonly singleChildLegendNodesCache: { [key: string]: MapContentTreeViewNode } = {};

    private uploader?: FileUploader;

    private files: File[] = [];

    protected jobId: string | undefined;

    private legendEmptyChild = 'legendEmptyChild';

    private csvEditor: CsvEditor = new CsvEditor('');

    private mapMarkersCommands: MapMarkersCommands = { saveImage: '', deleteImage: '', getImages: '', getCategory: '' };

    private readonly defaultFillOptions = {
        color: BrowserService.getCssVariableColor('--color-purple-03').color,
        opacity: 1
    };

    private readonly defaultStrokeOptions = {
        color: BrowserService.getCssVariableColor('--v-secondary-base').color,
        opacity: 1
    };

    private readonly defaultTextOptions: TextOptions = {
        color: BrowserService.getCssVariableColor('--color-purple-03').color,
        font: { family: 'Verdana', size: '16px', weight: 'normal' },
        contour: {},
        shadow: {}
    };

    private readonly defaultMarkerId = DEFAULT_SVG_MARKER_ID;

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & SimpleJson<any>}
     */
    protected readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;
    private readonly iconServiceUrl = window.location.href.replace('index.php', '') + 'admin/query.php';

    private abortFunction?: () => void;

    private loadGmlData: {
        service: RestService | null;
        layer: string;
        httpParams: HttpParams | null;
        filename: string;
        fileSize: number;
        alias: string;
    } = { service: null, layer: '', httpParams: null, filename: '', fileSize: 0, alias: '' };

    protected selectedVirtualFolder?: VirtualFolder;



    /**
     * @constructor GwtkMapContentTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        // Создание Vue компонента
        this.widgetProps = {
            showOpenLocalLayerSettings: false,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            taskId: this.id,
            setState: this.setState.bind(this),
            activeRequestCancelHandler: undefined,
            ver: 0,
            rootMapLayerItem: null,
            rootItemTree: [],
            searchValue: '',
            showSearch: true,
            itemTree: [],
            searchListItems: [],//Elements by search filter
            listItems: [],//Items for order view
            currentMapLayerItem: null,//Items for groups
            treeViewItem: [],//Items for tree view
            treeItemStatistics: { show: 0, layer: 0, editable: 0, tooltip: 0 },
            allTags: [],
            selectedTags: [],
            openTreeElement: [],
            openGroupElement: '',
            viewMode: '',
            localLayerName: '',
            publishMapObject: {
                createZipProgress: 0,
                isPublished: false,
                percentCompleted: 0,
                publishedFolder: '',  //отобразится в виджете
                publishMapClassifier: '',
                publishMapCrs: '',
                publishMapExtension: '',
                publishMapFileSize: 0,
                publishMapName: '',
                publishMapObjectsNumber: '',
                publishMapScale: PUBLISHMAPSCALE,
                publishMapType: '',
                uploadProgress: 0,
                virtualFolderList: [],
                xsdList: { list: [], select: '' },
                crsList: { list: [], select: '' },
                isReadyCreateThematic: true
            },
            uploadLink: '',
            sldObject: {
                sldObjectType: LOCALE.Line,
                previewImageSrc: '',
                styleOptions: {
                    line: [],
                    polygon: [],
                    marker: [],
                    text: []
                },
            },
            buildParametersOptionsTemp: [{ id: '', text: '', userThematicRangeList: [], rangesCount: 1 }],
            markerImageList: [],
            mapMarkersCommands: { isDeleteImage: false, isSaveImage: false, isGetCategory: false },
            markerCategoryList: [],
            minValue: 1,
            maxValue: 1,
            dynamicLabelData: this.map.workspaceManager.getValue(PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL),
            selectedLegendObjectList: [],
            layerNodeId: '',
            nodesWithLegendIdList: [],
            isBlocked: false,
            progress: {
                visible: false
            },
            menuListItems: []
        };

        this.onDataChanged({ type: 'content' });
    }

    onWorkspaceChanged(type: keyof WorkspaceValues): void {
        if (type === 'workspace.viewSettings.zoomlevel') {
            this.updateItemDisabledTree(this.widgetProps.treeViewItem);
        }
    }

    setup() {
        super.setup();
        const rootContentTreeItem: ContentTreeNode = this.map.contentTreeManager.contentTree;

        this.widgetProps.currentMapLayerItem = rootContentTreeItem;
        this.widgetProps.rootMapLayerItem = this.widgetProps.currentMapLayerItem;

        this.createRootItemTree(this.widgetProps.currentMapLayerItem);

        let defaultViewType: string = LAYERS_BY_TREE;
        if (this.map.options.contenttreeviewtype === 'bygroups') {
            defaultViewType = LAYERS_BY_GROUPS;
        } else if (this.map.options.contenttreeviewtype === 'byorder') {
            defaultViewType = LAYERS_BY_ORDER;
        }

        if (!this.workspaceData) {
            this.workspaceData = {
                mode: defaultViewType,
                openTreeElement: [],
                openGroupElement: '',
                styleOptions: { line: [], polygon: [], marker: [], text: [] }
            };
        } else {
            if (this.workspaceData.mode === undefined) {
                this.workspaceData.mode = defaultViewType;
            }
            if (this.workspaceData.openTreeElement === undefined) {
                this.workspaceData.openTreeElement = [];
            }
            if (this.workspaceData.openGroupElement === undefined) {
                this.workspaceData.openGroupElement = '';
            }
            if (this.workspaceData.styleOptions === undefined) {
                this.workspaceData.styleOptions = { line: [], polygon: [], marker: [], text: [] };
            }
        }
        this.writeWorkspaceData(true);

        if (this.workspaceData.mode) {
            this.setState(UPDATE_TREE, '');
            this.widgetProps.viewMode = this.workspaceData.mode;
        }

        let layerFromUrl: Layer | undefined;
        let layerFromUrlParentItem: ContentTreeNode | undefined;
        const idLayerObjectNumberKey = this.map.options?.forcedParams?.idLayerObjectNumberKey;
        if (idLayerObjectNumberKey) {
            const idLayer = Utils.parseIdLayerObjectNumberKey(idLayerObjectNumberKey).idLayer;
            layerFromUrl = this.map.tiles.getLayerByIdService(idLayer);

            if (layerFromUrl) {
                layerFromUrlParentItem = this.getParentItem(layerFromUrl.id);
            }

            if (layerFromUrlParentItem && this.workspaceData.mode === LAYERS_BY_TREE) {
                this.workspaceData.openTreeElement.splice(0);
                this.workspaceData.openTreeElement.push(layerFromUrlParentItem.parentId);
            }
        }

        if (this.workspaceData.openTreeElement.length > 0) {
            this.setState(UPDATE_OPEN_TREE_ELEMENT, this.workspaceData.openTreeElement);
        }
        if (this.workspaceData.openGroupElement || layerFromUrlParentItem?.parentId) {
            const currentNode = this.getParentItem(layerFromUrlParentItem?.parentId || this.workspaceData.openGroupElement);
            if (currentNode) {
                this.widgetProps.currentMapLayerItem = currentNode;
                if (layerFromUrlParentItem?.parentId && this.widgetProps.currentMapLayerItem.disabled) {
                    this.setState(TOGGLE_CURRENT_MAP_LAYER_ITEM, this.widgetProps.currentMapLayerItem);
                }
            }
        }
        if (layerFromUrlParentItem && layerFromUrlParentItem.text) {
            this.scrollToPublishMap(layerFromUrlParentItem.text);
        }

        this.fillMenuListItems();

    }

    // get isEditorAvailable() {
    //     let result = false;
    //     const functions = this.map.options.settings_mapEditor?.functions;
    //     if (functions) {
    //         result = functions.includes('*') || functions.includes('create') || functions.includes('edit') || functions.includes('delete');
    //     }
    //     return this.map.taskManagerNew.isEditorAvailable && result;
    // }

    protected fillMenuListItems() {

    }

    private createRootItemTree(parentItem: ContentTreeNode, name?: string): void {
        const rootItemTree = this.widgetProps.rootItemTree;
        if (parentItem && parentItem.nodes && rootItemTree) {
            for (let i = 0; i < parentItem.nodes.length; i++) {

                if ( parentItem.nodes && parentItem.nodes.length === 1 && parentItem.nodes[0].text === parentItem.text) {
                    parentItem.nodes[0].parentId = parentItem.parentId;
                    if (parentItem.nodes[0].nodes) {
                        this.createRootItemTree(parentItem.nodes[0], name);
                    } else {
                        rootItemTree.push({ item: parentItem.nodes[0], path: name || '' });
                    }
                    break;
                }
                const path = name ? (name + ' > ' + parentItem.nodes[i].text) : parentItem.nodes[i].text;
                rootItemTree.push({ item: parentItem.nodes[i], path });

                if (parentItem.nodes[i].nodes) {
                    this.createRootItemTree(parentItem.nodes[i], path);
                }
            }
        }
    }

    private hasLegend(xId: string): boolean {
        const layer = this.map.tiles.getLayerByxId(xId);
        if (layer) {
            return layer.hasLegend();
        }
        return false;
    }

    private createTreeViewItems(contentTreeNodes: ContentTreeNode[] | undefined): void {
        this.widgetProps.treeViewItem.splice(0);

        if (contentTreeNodes) {
            for (let i = 0; i < contentTreeNodes.length; i++) {
                const contentTreeNode = contentTreeNodes[i];
                const parentNode = this.getParentItem(contentTreeNode.parentId);
                let parent = null;
                if (parentNode) {
                    parent = GwtkMapLayerFactory.createMapLayerItem(this.map, parentNode, this.getParentNode(parentNode.parentId)) as GwtkGroupLayerItem;
                }
                const item = GwtkMapLayerFactory.createMapLayerItem(this.map, contentTreeNode, parent);
                if (contentTreeNode.nodes && contentTreeNode.nodes.length === 1 && contentTreeNode.text === contentTreeNode.nodes[0].text) {
                    const item = this.createTreeChildren(contentTreeNode.nodes)[0];
                    item.parentId = contentTreeNode.parentId;
                    this.widgetProps.treeViewItem.push(item);
                } else {

                    let imgUrl = item.getItemImgUrl;
                    let itemName = contentTreeNode.text;
                    if (this.singleChildLegendNodesCache[item.layerGUID]) {
                        imgUrl = this.singleChildLegendNodesCache[item.layerGUID].imgurl;
                        itemName = this.singleChildLegendNodesCache[item.layerGUID].name;
                    }

                    this.widgetProps.treeViewItem.push({
                        id: contentTreeNode.id,
                        name: itemName,
                        children: contentTreeNode.nodes ? this.createTreeChildren(contentTreeNode.nodes) : [],
                        item: contentTreeNode,
                        icon: item.getItemIconName,
                        imgurl: imgUrl,
                        isEditable: item.isEditable,
                        isTooltipMap: item.isTooltipMap,
                        isVirtualFolder: item.isVirtualFolder,
                        isLegendViewEnabled: item.isLegendViewEnabled,
                        isVirtualFolderChild: (item as GwtkVirtualFolderItem).isVirtualFolderChild,
                        isGroupItem: item.isGroupItem,
                        visibility: item.visibility,
                        parentId: contentTreeNode.parentId,
                        disabled: item.isGroupItem ? item.disabledFlag : item.disabled,
                        hasLegend: this.hasLegend(contentTreeNode.id),
                        isAdditionalSld: item.isAdditionalSld,
                        isFilteredByUser: item.isFilteredByUser,
                        legendError: false
                    });
                }
            }
        }

        this.updateStatistic();
    }

    private updateItemDisabledTree(tree: MapContentTreeViewNode[]): void {
        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];
            if (node.children && node.children.length > 0) {
                this.updateItemDisabledTree(node.children);
            }

            const nodeItem = this.getParentItem(node.id);
            if (nodeItem) {
                const parentNode = this.getParentItem(node.parentId);
                let parent = null;
                if (parentNode) {
                    parent = GwtkMapLayerFactory.createMapLayerItem(this.map, parentNode, this.getParentNode(parentNode.parentId)) as GwtkGroupLayerItem;
                }

                const item = GwtkMapLayerFactory.createMapLayerItem(this.map, nodeItem, parent);

                node.disabled = item.isGroupItem ? item.disabledFlag : item.disabled;
            }
        }
    }

    private getChildren(item: ContentTreeNode): MapContentTreeViewNodes {
        if (item.nodes) {
            return this.createTreeChildren(item.nodes);
        }

        if (this.childLegendCollection[item.id]) {
            return this.childLegendCollection[item.id];
        }

        if (this.hasLegend(item.id)) {
            return [{
                id: this.legendEmptyChild,
                name: '',
                children: [],
                item: { id: '', nodeType: TreeNodeType.LocalLayer, text: '', parentId: '' },
                icon: 'mdi-timer-sand',
                imgurl: undefined,
                isEditable: false,
                isTooltipMap: false,
                isVirtualFolder: false,
                isVirtualFolderChild: false,
                isLegendViewEnabled: false,
                isGroupItem: false,
                disabled: false,
                visibility: 'hidden',
                parentId: 'legendEmptyChildParent',
                hasLegend: false,
                isAdditionalSld: false,
                isFilteredByUser: false,
                legendError: false
            }];
        }

        return [];
    }

    private updateStatistic() {
        this.widgetProps.treeItemStatistics.layer = 0;
        this.widgetProps.treeItemStatistics.show = 0;
        this.widgetProps.treeItemStatistics.editable = 0;
        this.widgetProps.treeItemStatistics.tooltip = 0;

        this.fillStatisticFromNodes(this.widgetProps.treeViewItem);

    }

    private fillStatisticFromNodes(items: MapContentTreeViewNodes) {
        for (let i = 0; i < items.length; i++) {
            const currentItem = items[i];
            const parentNode = this.getParentItem(currentItem.parentId);
            let parent = null;
            if (parentNode) {
                parent = GwtkMapLayerFactory.createMapLayerItem(this.map, parentNode, this.getParentNode(parentNode.parentId)) as GwtkGroupLayerItem;
            }
            const item = GwtkMapLayerFactory.createMapLayerItem(this.map, currentItem.item, parent);
            if (!item.isGroupItem && (!item.parentItem || item.parentItem.isGroupItem) && currentItem.id !== 'legendEmptyChild') {
                this.widgetProps.treeItemStatistics.layer++;
                const layer = (item as GwtkSingleLayerItem).layer;
                if (layer && layer.server && layer instanceof WmsLayer) {
                    this.map.dynamicLabelList.getDynamicLabelData(layer).then((data: string) => {
                        if (data) {
                            const index = this.widgetProps.dynamicLabelData.findIndex((item) => item.id === layer.id);
                            if (index === -1) {
                                this.widgetProps.dynamicLabelData.push({ id: layer.id, dynamicLabel: false });
                            }
                        }
                    });
                }

            }
            if (item.visible && !item.isGroupItem && !item.disabled) {
                this.widgetProps.treeItemStatistics.show++;
            }
            if (item.isEditable && !item.isGroupItem) {
                this.widgetProps.treeItemStatistics.editable++;
            }
            if (item.isTooltipMap && !item.isGroupItem) {
                this.widgetProps.treeItemStatistics.tooltip++;
            }
            this.fillStatisticFromNodes(currentItem.children);
        }
    }

    private createTreeChildren(items: ContentTreeNode[] | undefined) {
        let result: MapContentTreeViewNodes = [];
        if (items) {
            for (let i = 0; i < items.length; i++) {
                const currentItem = items[i];
                const parentNode = this.getParentItem(currentItem.parentId);
                let parent = null;
                if (parentNode) {
                    parent = GwtkMapLayerFactory.createMapLayerItem(this.map, parentNode, this.getParentNode(parentNode.parentId)) as GwtkGroupLayerItem;
                }
                const item = GwtkMapLayerFactory.createMapLayerItem(this.map, currentItem, parent);

                if (currentItem.nodes && currentItem.nodes.length === 1 && currentItem.text === currentItem.nodes[0].text) {
                    const item = this.createTreeChildren(currentItem.nodes)[0];
                    item.parentId = currentItem.parentId;
                    result.push(item);
                } else {

                    let imgUrl = item.getItemImgUrl;
                    let itemName = currentItem.text;
                    if (this.singleChildLegendNodesCache[item.layerGUID]) {
                        imgUrl = this.singleChildLegendNodesCache[item.layerGUID].imgurl;
                        itemName = this.singleChildLegendNodesCache[item.layerGUID].name;
                    }

                    result.push({
                        id: currentItem.id,
                        name: itemName,
                        children: this.getChildren(currentItem),
                        item: currentItem,
                        icon: item.getItemIconName,
                        imgurl: imgUrl,
                        isEditable: item.isEditable,
                        isTooltipMap: item.isTooltipMap,
                        isVirtualFolder: item.isVirtualFolder,
                        isLegendViewEnabled: item.isLegendViewEnabled,
                        isVirtualFolderChild: (item as GwtkVirtualFolderItem).isVirtualFolderChild,
                        isGroupItem: item.isGroupItem,
                        visible: item.visible,
                        visibility: item.visibility,
                        parentId: currentItem.parentId,
                        disabled: item.isGroupItem ? item.disabledFlag : item.disabled,
                        hasLegend: this.hasLegend(currentItem.id),
                        legendError: false,
                        isAdditionalSld: item.isAdditionalSld,
                        isFilteredByUser: item.isFilteredByUser
                    });
                }

            }
        }
        return result;
    }

    createTaskPanel() {
        const nameWidget = 'GwtkMapContentWidget';
        const sourceWidget = GwtkMapContentWidget;
        this.mapWindow.registerComponent(nameWidget, sourceWidget);

        this.mapWindow.createWidget(nameWidget, this.widgetProps);

        this.addToPostDeactivationList(this.widgetProps);
    }

    onDataChanged(event: DataChangedEvent) {
        if (event.type === 'content' || event.type === 'resetlayersvisibility') {
            this.widgetProps.allTags.splice(0);
            const tags: Set<string> = new Set<string>();
            for (let layer of this.map.layers) {
                if (layer.options.tags) {
                    layer.options.tags.forEach(tag => tags.add(tag));
                }
            }
            this.widgetProps.allTags.push(...tags.values());

            const treeItems = this.map.contentTreeManager.contentTree.nodes;
            if (treeItems) {
                const items: ContentTreeNode[] = [];
                for (let treeItemNumber = 0; treeItemNumber < treeItems.length; treeItemNumber++) {
                    this.fillItemsArray(treeItems[treeItemNumber], items); // заполнить список слоёв
                }

                this.widgetProps.listItems.splice(0);
                const viewOrder = this.map.tiles.viewOrder;
                for (let viewOrderNumber = viewOrder.length - 1; viewOrderNumber >= 0; viewOrderNumber--) {
                    const id = viewOrder[viewOrderNumber];
                    const layerItem = items.find(value => value.id === id);
                    if (layerItem) {
                        this.widgetProps.listItems.push(layerItem);
                    }
                }
            }

            this.setState(UPDATE_TREE, '');

            this.widgetProps.ver++;
        }
    }

    canShowTooltip(): boolean {
        return true;
    }

    private getParentItem(id: string) {
        let result;

        const nodes = this.widgetProps.rootMapLayerItem?.nodes;
        if (nodes) {
            result = this.findNode(nodes, id);
        }
        return result;
    }

    private findNode(nodes: ContentTreeNode[], id: string): ContentTreeNode | undefined {
        let result: ContentTreeNode | undefined;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.id === id) {
                result = node;
            } else if (node.nodes) {
                result = this.findNode(node.nodes, id);
            }
            if (result) {
                break;
            }
        }
        return result;
    }

    private getParentNode(id: string): GwtkGroupLayerItem | null {
        let result = null;

        const node = this.getParentItem(id);

        if (node && node.parentId !== null) {
            result = GwtkMapLayerFactory.createMapLayerItem(this.map, node, this.getParentNode(node.parentId)) as GwtkGroupLayerItem;
        }

        return result;
    }

    setState<K extends keyof GwtkMapContentTaskState>(key: K, value: GwtkMapContentTaskState[K]) {
        switch (key) {
            case ABORT_FILE_UPLOAD:
                this.abortFileUpload();
                break;
            //FIXME sorting does not working
            case UPDATE_LAYERS_ORDER:
                const updateData: { viewOrder: string[], xIdMoved: string } = value as { viewOrder: string[], xIdMoved: string };
                this.map.tiles.setLayersInViewOrderByList(updateData.viewOrder);
                this.map.onRefreshMap();
                break;
            case CREATE_LOCAL_LAYER:
                this.createLocalLayer(value as string);
                break;
            case OPEN_LOCAL_LAYER:
                this.openLocalLayer();
                break;
            case ADD_PUBLISHING_FILES:
                this.addPublishingFiles();
                break;
            case OPEN_PUBLISH_MAP_DIALOG:
                this.addPublishingFilesFromDnd(value as FileList);
                break;
            case SET_CURRENT_MAP_LAYER_ITEM:
                this.widgetProps.currentMapLayerItem = value as ContentTreeNode | null;
                this.workspaceData!.openGroupElement = this.widgetProps.currentMapLayerItem?.id || '';
                this.writeWorkspaceData(true);
                break;
            case TOGGLE_CURRENT_MAP_LAYER_ITEM:
                const mapLayerItem = value as ContentTreeNode;
                mapLayerItem.disabled = !mapLayerItem.disabled;
                this.updateItemDisabledTree(this.widgetProps.treeViewItem);
                this.map.tiles.wmsManager.clearUpdate();
                this.map.refresh();
                this.map.trigger({ type: 'mapdragend' });
                break;
            case SET_SELECTED_LEGEND_ITEM_ADDITIONAL_STYLE:
                this.widgetProps.selectedLegendObjectList.splice(0);
                this.widgetProps.selectedLegendObjectList.push(...value as GwtkMapLegendItemReduced[]);
                break;
            case TOGGLE_MAP_LEGEND_ITEM_ADDITIONAL_STYLE:
                {
                    const legendObject = value as GwtkMapLegendItemReduced;
                    const index = this.widgetProps.selectedLegendObjectList.findIndex(selectedLegendObjectListItem => selectedLegendObjectListItem.key === legendObject.key);
                    this.widgetProps.selectedLegendObjectList.splice(index, 1);
                    this.widgetProps.selectedLegendObjectList.sort((a, b) => Utils.sortAlphaNum(a.itemName, b.itemName));
                }
                break;
            case SEARCH_SET_CURRENT_MAP_LAYER_ITEM:
                this.widgetProps.currentMapLayerItem = value as ContentTreeNode;
                break;
            case ON_INPUT_SEARCH:
                const thisValue = value as string;
                if (value) {
                    this.widgetProps.searchValue = thisValue;
                    this.filterTreeItems();
                } else {
                    this.widgetProps.searchValue = '';
                }
                break;
            case ON_TAG_SEARCH:
                this.widgetProps.selectedTags.splice(0);
                this.widgetProps.selectedTags.push(...value as string[]);
                this.filterTreeItems();
                break;
            case RESET_SEARCH:
                this.widgetProps.searchValue = '';
                this.widgetProps.selectedTags.splice(0);
                this.widgetProps.searchListItems.splice(0);
                break;
            case UPDATE_TREE:
                this.createTreeViewItems(this.widgetProps.rootMapLayerItem?.nodes);
                break;
            case SHOW_TREE_ITEM:
                const getItem = value as MapContentTreeViewNode;

                const parentNode = this.getParentItem(getItem.parentId);
                let parent = null;
                if (parentNode) {
                    parent = GwtkMapLayerFactory.createMapLayerItem(this.map, parentNode, this.getParentNode(parentNode.parentId)) as GwtkGroupLayerItem;
                }

                let item;
                if (parent instanceof GwtkSingleLayerItem) {
                    item = GwtkMapLayerFactory.createMapLegendItem(this.map, getItem.item, parent);
                } else {
                    item = GwtkMapLayerFactory.createMapLayerItem(this.map, getItem.item, parent);
                }

                if (item instanceof GwtkGroupLayerItem) {
                    this.setState(TOGGLE_CURRENT_MAP_LAYER_ITEM, item.contentTreeItem);
                } else if (item instanceof GwtkSingleLayerItem) {

                    item.visible = !item.visible;
                    const node = this.findTreeViewNode(getItem.id, this.widgetProps.treeViewItem);
                    if (node) {
                        node.visible = item.visible;
                        node.visibility = item.visibility;

                        let parentId = getItem.parentId;
                        while (parentId) {
                            const parentTreeNode = this.findTreeViewNode(parentId, this.widgetProps.treeViewItem);
                            const parentNode = this.getParentItem(parentId);
                            if (parentTreeNode && parentNode) {
                                const item = GwtkMapLayerFactory.createMapLayerItem(this.map, parentNode, this.getParentNode(parentNode.parentId));
                                parentTreeNode.visibility = item.visibility;
                                parentId = parentNode.parentId;
                                if (parentTreeNode.disabled && node.visible) {
                                    item.contentTreeItem.disabled = false;
                                }
                            } else {
                                break;
                            }
                        }

                        this.map.tiles.wmsManager.clearUpdate();
                        this.map.refresh();
                        this.map.trigger({ type: 'layerlistchanged' });
                    }
                    this.updateStatistic();
                }
                setTimeout(() => {
                    this.fillNodesWithLegend();
                }, 15);
                break;
            case UPDATE_VIRTUAL_FOLDER:
                this.updateVirtualFolder(value as MapContentTreeViewNode);
                break;
            case SCROLL_TO_FILTERED_ITEM:
                const treeNodeInfo = this.getTreeNodeInfo(value as string);
                if (this.widgetProps.viewMode === LAYERS_BY_TREE) {
                    this.setState(UPDATE_OPEN_TREE_ELEMENT, treeNodeInfo.parentsIdList);
                }
                this.scrollToPublishMap(treeNodeInfo.name);
                break;
            case UPDATE_OPEN_TREE_ELEMENT:
                const openTreeElement = value as string[];
                this.widgetProps.openTreeElement = openTreeElement;

                this.widgetProps.nodesWithLegendIdList.splice(0);
                this.widgetProps.openTreeElement.forEach(item => {
                    this.getChildrenWithLegendIdList(item).forEach(id => {
                        if (!this.widgetProps.nodesWithLegendIdList.includes(id)) {
                            this.widgetProps.nodesWithLegendIdList.push(id);
                        }
                    });
                });

                this.getChildrenWithLegendIdList(null).forEach(id => {
                    if (!this.widgetProps.nodesWithLegendIdList.includes(id)) {
                        this.widgetProps.nodesWithLegendIdList.push(id);
                    }
                });

                this.fillNodesWithLegend();

                this.workspaceData!.openTreeElement = this.widgetProps.openTreeElement.slice();
                this.writeWorkspaceData(true);
                break;
            case RELOAD_NODE_LEGEND:
                this.reloadNodeLegend(value as string);
                break;
            case SAVE_VIEW_MODE:
                this.widgetProps.viewMode = value as string;
                this.workspaceData!.mode = value as string;
                this.writeWorkspaceData(true);
                break;
            case INPUT_LOAD_SETTINGS_XSD:
                this.widgetProps.publishMapObject.xsdList.select = value as string;
                break;
            case SELECT_VIRTUAL_FOLDER:
                this.selectedVirtualFolder = value as VirtualFolder;
                break;
            case SET_PUBLISH_MAP_NAME:
                this.widgetProps.publishMapObject.publishMapName = value as string;
                break;
            case SET_PUBLISH_MAP_SCALE:
                this.widgetProps.publishMapObject.publishMapScale = value as number;
                break;
            case SET_PUBLISH_MAP_CRS:
                this.widgetProps.publishMapObject.crsList.select = value as string;
                break;
            case CLICK_PUBLISH_MAP_BUTTON_OK:
                //при выборе нескольких файлов сперва их заархивируем
                if (this.files.length > 1) {
                    this.createZipArchive().then(() => {
                        this.uploadFiles();
                    }).catch((error) => {
                        this.widgetProps.publishMapObject.createZipProgress = 0;
                        this.map.writeProtocolMessage({
                            text: i18n.tc('mapcontent.Error creating ZIP archieve'),
                            display: true,
                            description: error.message,
                            type: LogEventType.Error
                        });
                    });
                } else {
                    this.uploadFiles();
                }
                break;
            case CLICK_PUBLISH_MAP_BUTTON_CANCEL:
                this.abortAsyncProcess();
                this.abortFileUpload();
                this.resetFileData();
                if (this.workspaceData?.mode) {
                    this.setState(CHANGE_VIEW_MODE, this.workspaceData.mode);
                } else {
                    this.setState(CHANGE_VIEW_MODE, LAYERS_BY_GROUPS);
                }
                break;
            case CHANGE_VIEW_MODE:
                this.widgetProps.viewMode = value as string;
                if (this.widgetProps.viewMode === LAYER_PUBLISH) {
                    const styleOptions = this.workspaceData?.styleOptions;
                    if (styleOptions) {
                        this.fillStyleOptions(styleOptions);
                    }
                } else if (this.widgetProps.viewMode === LAYER_STYLES_SETTINGS) {
                    this.openLayerStylesSettings();
                }
                break;

            case SET_MARKER_ICON:
                const markerOptions = value as MarkerOptions;
                const index = this.widgetProps.sldObject.styleOptions.marker.findIndex(style => style.marker?.markerId === markerOptions.markerId);
                if (index !== -1) {
                    const style = {
                        ...this.widgetProps.sldObject.styleOptions.marker[index],
                        marker: new MarkerStyle(markerOptions)
                    };
                    this.widgetProps.sldObject.styleOptions.marker.splice(index, 1, new Style(style));
                }
                this.widgetProps.sldObject.styleOptions.marker.forEach((style) => {
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
            case UPLOAD_MARKER_ICON:
                this.sendImageToServer(value as MarkerIcon).then((response) => {
                    let errorMessage = '';
                    if (response) {
                        if (response.status === 'success') {
                            this.fillMarkerImageList();
                        } else if (response.error) {
                            errorMessage = response.error;
                        }
                    } else {
                        errorMessage = 'no answer!';
                    }
                    if (errorMessage) {
                        this.map.writeProtocolMessage({
                            text: i18n.tc('mapcontent.Map content') + '. ' + errorMessage,
                            type: LogEventType.Error
                        });
                    }
                });
                break;
            case CALL_MAP_LEGEND_COMPONENT:
                this.callMapLegendComponent(value as string);
                break;
            case REMOVE_MARKER_ICON:
                if (!this.widgetProps.activeRequestCancelHandler) {
                    this.widgetProps.activeRequestCancelHandler = () => {
                    };
                }
                const itemIndex = this.widgetProps.markerImageList.findIndex((item) => (item.id === value));
                if (itemIndex > -1) {
                    this.removeImageFromServer([value as string]).then((response) => {
                        if (response && response.status === 'success') {
                            this.widgetProps.markerImageList.splice(itemIndex, 1);
                            this.writeWorkspaceData(true);
                        }
                    }).finally(() => {
                        this.widgetProps.activeRequestCancelHandler = undefined;
                    });
                }
                break;
            case SET_SLD_OBJECT_TYPE:
                let sldObject: SldWidgetObject;
                sldObject = this.widgetProps.sldObject;
                sldObject.sldObjectType = value as LOCALE;
                BrowserService.svgToBase64(BrowserService.stylesToSvgElement(sldObject.styleOptions[this.getObjectTypeString()], value as LOCALE))
                    .then(result => sldObject.previewImageSrc = result);
                break;
            case UPDATE_PREVIEW_IMAGE:
                BrowserService.svgToBase64(BrowserService.stylesToSvgElement(this.widgetProps.sldObject.styleOptions[this.getObjectTypeString()], this.widgetProps.sldObject.sldObjectType))
                    .then(result => this.widgetProps.sldObject.previewImageSrc = result);
                break;
            case UPDATE_STYLES_ORDER:
                this.widgetProps.sldObject.styleOptions[this.getObjectTypeString()].splice(0, this.widgetProps.sldObject.styleOptions[this.getObjectTypeString()].length, ...value as Style[]);
                this.setState(UPDATE_PREVIEW_IMAGE, undefined);
                break;
            case OPEN_SLD_EDITOR:
                this.generateMapMarkers();
                break;
            case SAVE_SLD_TEMPLATE:
                ['line', 'polygon', 'marker', 'text'].forEach(styleType => {
                    if (this.workspaceData?.styleOptions && this.workspaceData.styleOptions[styleType]) {
                        this.workspaceData.styleOptions[styleType].splice(0);
                        this.workspaceData.styleOptions[styleType].push(...this.widgetProps.sldObject.styleOptions[styleType]);
                    }
                });
                this.writeWorkspaceData(true);
                if (this.widgetProps.viewMode === LAYER_STYLES_SETTINGS) {
                    this.map.workspaceManager.setValue(PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_STYLE_OPTION, [{ id: this.widgetProps.layerNodeId, selectedLegendObjectStyleOptions: this.widgetProps.sldObject.styleOptions }]);
                }
                break;
            case RESET_SLD_TEMPLATE:
                this.createDefaultSldTemplate();
                break;
            case SET_ALL_LAYER_ENABLE:
                this.setAllLayerEnable(this.widgetProps.treeViewItem, value as boolean);
                this.setState(UPDATE_TREE, '');
                this.map.trigger({ type: 'mapdragend' });
                break;
            case SET_TREE_NODE_LAYER_ENABLE:
                const enable = (value as { enable: boolean, tree: MapContentTreeViewNodes }).enable;
                const tree = (value as { enable: boolean, tree: GwtkMapLayerItem }).tree;
                const node = this.findMapContentTreeViewNode(tree.layerGUID, this.widgetProps.treeViewItem);
                if (node) {
                    tree.visible = enable;
                    this.setEnableForAllLayers([node], enable);
                    this.setState(UPDATE_TREE, '');
                    this.updateStatistic();
                }
                break;
            case SET_ROOT_ITEMS_ENABLE:
                for (let i = 0; i < this.widgetProps.treeViewItem.length; i++) {
                    const node = this.widgetProps.treeViewItem[i];
                    if (node.isGroupItem) {
                        if (node.disabled === value as boolean) {
                            this.setState(SHOW_TREE_ITEM, node);
                        }
                    }
                }
                this.setState(UPDATE_TREE, '');
                this.updateStatistic();
                break;
            case RESTORE_INITIAL_LAYERS:
                this.map.restoreMapContent();
                break;
            case SET_DYNAMIC_LABEL_LAYER:
                const workspaceDynamicLabelData = this.map.workspaceManager.getValue(PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL);
                const dynamicLabelData = workspaceDynamicLabelData.length ? workspaceDynamicLabelData : this.widgetProps.dynamicLabelData;
                const indexDynamicLayer = dynamicLabelData.findIndex((data) => data.id === value as string);
                if (indexDynamicLayer === -1) {
                    dynamicLabelData.push({
                        id: value as string,
                        dynamicLabel: true
                    });

                } else {
                    dynamicLabelData[indexDynamicLayer].dynamicLabel = !dynamicLabelData[indexDynamicLayer].dynamicLabel;
                }
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL, dynamicLabelData);
                this.widgetProps.dynamicLabelData = dynamicLabelData;
                this.map.workspaceManager.writeProjectSettings();
                this.map.requestRender();
                this.map.tiles.wmsManager.onMapDragEnd();
                break;
            case OPEN_LAYER_STYLES_SETTINGS:
                const layerNodeId = value as string;
                if (this.widgetProps.layerNodeId !== layerNodeId) {
                    this.widgetProps.selectedLegendObjectList.splice(0);
                    this.widgetProps.layerNodeId = layerNodeId;
                }
                this.setState(CHANGE_VIEW_MODE, LAYER_STYLES_SETTINGS);
                break;
            case CLICK_LAYER_STYLES_SETTINGS_OK:
                this.setState(CHANGE_VIEW_MODE, this.workspaceData?.mode || LAYERS_BY_GROUPS);
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_LIST, [{ id: this.widgetProps.layerNodeId, selectedLegendObjectList: this.widgetProps.selectedLegendObjectList }]);
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_STYLE_OPTION, [{ id: this.widgetProps.layerNodeId, selectedLegendObjectStyleOptions: this.widgetProps.sldObject.styleOptions }]);
                this.map.workspaceManager.writeProjectSettings();
                this.setWmsStyleFilter();
                this.setState(UPDATE_TREE, '');
                break;
            case CLICK_LAYER_STYLES_SETTINGS_RETURN:
                this.setState(CHANGE_VIEW_MODE, this.workspaceData?.mode || LAYERS_BY_TREE);
                break;
            case CLICK_LAYER_STYLES_SETTINGS_CANCEL:
                if (this.widgetProps.selectedLegendObjectList.length) {
                    this.widgetProps.selectedLegendObjectList.splice(0);
                }
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_LIST, [{ id: this.widgetProps.layerNodeId, selectedLegendObjectList: this.widgetProps.selectedLegendObjectList }]);
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_STYLE_OPTION, [{ id: this.widgetProps.layerNodeId, selectedLegendObjectStyleOptions: { line: [], polygon: [], marker: [], text: [] } }]);
                this.setState(CHANGE_VIEW_MODE, this.workspaceData?.mode || LAYERS_BY_TREE);
                this.setWmsStyleFilter();
                this.widgetProps.layerNodeId = '';
                this.setState(UPDATE_TREE, '');
                break;
            case BLOCK:
                this.widgetProps.isBlocked = true;
                this.abortFunction = value as (() => void) | undefined;
                break;
            case UNLOCK:
                if (this.abortFunction) {
                    this.abortFunction();
                    this.abortFunction = undefined;
                }
                this.widgetProps.isBlocked = false;
                break;
        }
    }

    private fillNodesWithLegend() {
        const layerLegends: { layerId: string, legend: Legend }[] = [];
        const promiseList = [];
        for (let i = 0; i < this.widgetProps.nodesWithLegendIdList.length; i++) {
            const layerId = this.widgetProps.nodesWithLegendIdList[i];

            const mapLayer = this.map.tiles.getLayerByxId(layerId);
            if (mapLayer) {
                try {
                    const promise = mapLayer.getLegend().then(legend => {
                        if (legend) {
                            layerLegends.push({layerId, legend});
                        }
                    });
                    promiseList.push(promise);
                } catch (e) {
                    const treeItem = this.findTreeViewNode(layerId, this.widgetProps.treeViewItem);
                    if (treeItem) {
                        treeItem.legendError = true;
                    }
                }
            }
        }

        Promise.all(promiseList).finally(() => {
            for (let i = 0; i < layerLegends.length; i++) {
                const item = layerLegends[i];
                this.fillLegendItems(item.layerId, item.legend);
            }
        });
    }
    private findMapContentTreeViewNode(id: string, tree: MapContentTreeViewNodes) {
        let result: MapContentTreeViewNode | undefined;
        for (let i = 0; i < tree.length; i++) {
            if (tree[i].id === id) {
                result = tree[i];
                break;
            } else if (tree[i].children.length > 0) {
                const searchResult = this.findMapContentTreeViewNode(id, tree[i].children);
                if (searchResult) {
                    result = searchResult;
                }
            }
        }
        return result;
    }

    private setAllLayerEnable(treeViewItem: MapContentTreeViewNodes, enable: boolean) {
        for (let i = 0; i < treeViewItem.length; i++) {
            if (treeViewItem[i].isGroupItem && treeViewItem[i].children.length) {
                const item = GwtkMapLayerFactory.createMapLayerItem(this.map, treeViewItem[i].item, this.getParentNode(treeViewItem[i].parentId));

                if (!item.parentItem?.isVirtualFolderChild && !item.parentItem?.isVirtualFolder && !item.isVirtualFolder) {
                    item.contentTreeItem.disabled = !enable;
                    this.setAllLayerEnable(treeViewItem[i].children, enable);
                }

            } else {
                if (treeViewItem[i].visible !== enable) {
                    const item = GwtkMapLayerFactory.createMapLayerItem(this.map, treeViewItem[i].item, this.getParentNode(treeViewItem[i].parentId));
                    if (item.visible !== enable && !item.parentItem?.isVirtualFolderChild && !item.parentItem?.isVirtualFolder && !item.isVirtualFolder) {
                        item.visible = enable;
                    }
                }
            }
        }
        this.widgetProps.ver++;
    }

    /**
     * Открытие компонента Легенда карты для добавления стилей в WMS слое
     * @private
     * @method callMapLegendComponent
     * @param layerId {string} Идентификатор слоя
     */
    private async callMapLegendComponent(layerId: string) {
        try {
            const result = await this.mapWindow.getTaskManager().callLegend(layerId, undefined, undefined, LEGEND_SHOW_MODE.LayerStyleSettingsMode, this.widgetProps.selectedLegendObjectList) as GwtkMapLegendItemReduced[];
            if (result) {
                this.setState(SET_SELECTED_LEGEND_ITEM_ADDITIONAL_STYLE, result);
            }
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: gwtkError.message,
                type: LogEventType.Error
            });
        }
    }


    private setEnableForAllLayers(nodes: MapContentTreeViewNodes, enable: boolean) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.isGroupItem || node.isVirtualFolder) {
                this.setEnableForAllLayers(node.children, enable);
                if (node.disabled === enable) {
                    this.setState(SHOW_TREE_ITEM, node);
                }
            }
        }
        this.widgetProps.ver++;
    }

    private setVisibleForAllLayers(node: ContentTreeNode, visible: boolean) {
        if (node.nodes && node.nodes?.length > 0) {
            for (let i = 0; i < node.nodes.length; i++) {
                const newNode = node.nodes[i];
                this.setVisibleForAllLayers(newNode, visible);
            }
        } else {
            const item = GwtkMapLayerFactory.createMapLayerItem(this.map, node, null);
            if (item.visible !== visible) {
                item.visible = visible;
            }
        }
    }

    /**
     * Открытие меню настройки стиля слоя
     * @private
     * @method openLayerStylesSettings
     */
    private openLayerStylesSettings() {
        const styleOptions = this.map.workspaceManager.getValue(PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_STYLE_OPTION).find(styleOptions => styleOptions.id === this.widgetProps.layerNodeId);
        if (styleOptions && styleOptions.selectedLegendObjectStyleOptions) {
            this.fillStyleOptions(styleOptions.selectedLegendObjectStyleOptions);
        } else {
            this.createDefaultSldTemplate();
        }
        //если повторно открываем настройки стиля для одной и той же карты, то выборку изменять не будем
        if (this.widgetProps.selectedLegendObjectList.length) {
            return;
        } else {
            const selectedLegendObjectList = this.map.workspaceManager.getValue(PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_LIST)
                .find(objectList => objectList.id === this.widgetProps.layerNodeId)?.selectedLegendObjectList;
            if (selectedLegendObjectList?.length) {
                this.widgetProps.selectedLegendObjectList.splice(0);
                this.widgetProps.selectedLegendObjectList.push(...selectedLegendObjectList);
            }
        }
    }
    /**
     * Заполнение объекта SLD стилями
     * @private
     * @method fillStyleOptions
     * @param styleOptions {SldBuildObject}
     */
    private fillStyleOptions(styleOptions: SldBuildObject) {
        ['line', 'polygon', 'text', 'marker'].forEach(styleType => {
            if (styleOptions[styleType] && styleOptions[styleType].length) {
                this.widgetProps.sldObject.styleOptions[styleType].splice(0);
                this.widgetProps.sldObject.styleOptions[styleType].push(...styleOptions[styleType]);
            }
        });
        if (!styleOptions?.line.length
            && !styleOptions?.marker.length
            && !styleOptions?.polygon.length
            && !styleOptions?.text.length) {
            this.createDefaultSldTemplate();
        }
    }

    /**
     * Установить для WMS слоя c дополнительные стили
     * @private
     * @method setWmsStyleFilter
     */
    private setWmsStyleFilter() {
        this.map.setWmsStyleFilter(this.widgetProps.layerNodeId, this.widgetProps.selectedLegendObjectList, this.widgetProps.sldObject.styleOptions);
    }

    private getChildrenWithLegendIdList(nodeId: string | null) {
        const result: string[] = [];
        if (nodeId === null) {
            this.widgetProps.treeViewItem.forEach(item => {
                if (!item.isGroupItem) {
                    if (item.hasLegend) {
                        result.push(item.id);
                    }
                }
            });
        } else {
            const node = this.findTreeViewNode(nodeId, this.widgetProps.treeViewItem);
            if (node) {
                node.children.forEach((item) => {
                    if (item.hasLegend) {
                        result.push(item.id);
                    }
                });
            }
        }
        return result;
    }

    private findTreeViewNode(id: string, nodes: MapContentTreeViewNodes): MapContentTreeViewNode | undefined {
        let result: MapContentTreeViewNode | undefined;

        for (let i = 0; i < nodes.length; i++) {
            const currentNode = nodes[i];

            if (currentNode.id === id) {
                result = currentNode;
                break;
            }
            const currentResult = this.findTreeViewNode(id, currentNode.children);
            if (currentResult) {
                result = currentResult;
                break;
            }
        }
        return result;
    }

    private reloadNodeLegend(layerNodeId: string) {
        const treeItem = this.findTreeViewNode(layerNodeId, this.widgetProps.treeViewItem);

        if (treeItem) {

            if (treeItem.children && treeItem.children[0] && treeItem.children[0].id === this.legendEmptyChild) {
                treeItem.children.splice(0, 1);
            }

            const mapLayer = this.map.tiles.getLayerByxId(treeItem.id);

            if (mapLayer) {
                mapLayer.clearLegend();

                this.setState(UPDATE_OPEN_TREE_ELEMENT, this.widgetProps.openTreeElement);
            }
        }
    }

    private fillLegendItems(layerNodeId: string, legend:Legend, filter?: string[]) {

        const legendItems: LegendLeafNode[] = [];

        const mapLayer = this.map.tiles.getLayerByxId(layerNodeId);

        let layer: Layer | undefined;
        let fillLayerLegend = !filter;

        if (mapLayer) {

            layer = this.map.getLayer(mapLayer.idLayer);
            if (layer) {
                filter = layer.getKeysArray();
                if (!filter) {
                    fillLayerLegend = true;
                }
            }

            const treeItem = this.findTreeViewNode(layerNodeId, this.widgetProps.treeViewItem);

            if (treeItem) {

                if (treeItem.children && treeItem.children[0] && treeItem.children[0].id === this.legendEmptyChild) {
                    treeItem.children.splice(0, 1);
                }

                legend.nodes.forEach((item) => {
                    legendItems.push(...item.nodes);
                });

                legendItems.sort((a, b) => Utils.sortAlphaNum(a.text, b.text));

                legendItems.forEach((item) => {

                    if (layer && fillLayerLegend) {
                        if (!filter) {
                            filter = [];
                        }
                        filter.push(item.key);
                    }

                    let isVisible = false;
                    if (mapLayer) {
                        let filter = mapLayer.getKeysArray();
                        if (!filter) {
                            isVisible = true;
                        } else {
                            isVisible = filter.includes(item.key);
                        }
                    }

                    const node: MapContentTreeViewNode = {
                        id: item.key,
                        name: item.text,
                        children: [],
                        item: {
                            id: item.key,
                            text: item.text,
                            nodeType: TreeNodeType.Layer,
                            parentId: layerNodeId
                        },
                        icon: '',
                        imgurl: item.image ? item.image : '',
                        isEditable: false,
                        isTooltipMap: false,
                        isVirtualFolder: false,
                        isVirtualFolderChild: false,
                        isLegendViewEnabled: false,
                        isGroupItem: false,
                        visibility: isVisible ? 'visible' : 'hidden',
                        parentId: layerNodeId,
                        hasLegend: false,
                        disabled: false,
                        isLegendItem: true,
                        legendError: false,
                        isAdditionalSld: false,
                        isFilteredByUser: false,
                        idLayer: mapLayer?.idLayer
                    };

                    const index = treeItem.children.findIndex((child) => child.id === item.key);
                    if (index === -1) {
                        treeItem.children.push(node);
                    }
                });
                if (layer && fillLayerLegend && filter) {
                    layer.setKeysFilter(filter);
                }
                if (treeItem.children.length === 1) {
                    const imgurl = treeItem.children[0]?.imgurl;
                    const addName = treeItem.children[0]?.name;

                    if (imgurl && treeItem.imgurl !== imgurl) {
                        treeItem.imgurl = imgurl;
                    }
                    if (addName && !treeItem.name.includes(addName)) {
                        treeItem.name += ' (' + addName + ')';
                    }
                    treeItem.children.splice(0);
                    this.singleChildLegendNodesCache[layerNodeId] = treeItem;
                }

                this.childLegendCollection[layerNodeId] = treeItem.children.slice();
            }
        }
    }


    onDragOver() {
        this.setState(CHANGE_VIEW_MODE, LAYER_PUBLISH_DND);
    }

    onDragLeave() {
        this.setState(CHANGE_VIEW_MODE, this.workspaceData?.mode || LAYERS_BY_TREE);
    }

    /**
     * Создать SLD шаблон с базовыми настройками
     * @private
     * @method createDefaultSldTemplate
     */
    private async createDefaultSldTemplate() {
        if (this.workspaceData && this.workspaceData.styleOptions) {
            const defaultMarkerStyle = new MarkerStyle({ markerId: this.defaultMarkerId });

            //для сервиса подходит только растр (даже в base64), поэтому перегоняем сначала в Image
            if (defaultMarkerStyle.markerDescription && defaultMarkerStyle.markerDescription.width && defaultMarkerStyle.markerDescription.height) {
                const svgImage = await BrowserService.svgToImage(BrowserService.stylesToSvgElement([new Style({ marker: defaultMarkerStyle })], LOCALE.Point));
                const canvas = document.createElement('canvas');
                canvas.width = defaultMarkerStyle.markerDescription.width;
                canvas.height = defaultMarkerStyle.markerDescription.height;

                const sx = (svgImage.width - canvas.width) * 0.5;
                const sy = (svgImage.height - canvas.height) * 0.5;

                const context = canvas.getContext('2d');
                if (context) {
                    context.drawImage(svgImage, sx, sy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
                }
                defaultMarkerStyle.markerDescription.image = canvas.toDataURL();
            }

            this.workspaceData.styleOptions.line.splice(0);
            this.workspaceData.styleOptions.line.push(new Style({ stroke: new Stroke(this.defaultStrokeOptions) }));

            this.workspaceData.styleOptions.polygon.splice(0);
            this.workspaceData.styleOptions.polygon.push(new Style({ fill: new Fill(this.defaultFillOptions) }));
            this.workspaceData.styleOptions.polygon.push(new Style({ stroke: new Stroke(this.defaultStrokeOptions) }));

            this.workspaceData.styleOptions.marker.splice(0);
            this.workspaceData.styleOptions.marker.push(new Style({ marker: defaultMarkerStyle }));

            this.workspaceData.styleOptions.text.splice(0);
            this.workspaceData.styleOptions.text.push(new Style({ text: new TextStyle(this.defaultTextOptions) }));

            this.writeWorkspaceData(true);

            this.widgetProps.sldObject.styleOptions.line.splice(0);
            this.widgetProps.sldObject.styleOptions.line.push(new Style({ stroke: new Stroke(this.defaultStrokeOptions) }));

            this.widgetProps.sldObject.styleOptions.polygon.splice(0);
            this.widgetProps.sldObject.styleOptions.polygon.push(new Style({ fill: new Fill(this.defaultFillOptions) }));
            this.widgetProps.sldObject.styleOptions.polygon.push(new Style({ stroke: new Stroke(this.defaultStrokeOptions) }));

            this.widgetProps.sldObject.styleOptions.marker.splice(0);
            this.widgetProps.sldObject.styleOptions.marker.push(new Style({ marker: defaultMarkerStyle }));

            this.widgetProps.sldObject.styleOptions.text.splice(0);
            this.widgetProps.sldObject.styleOptions.text.push(new Style({ text: new TextStyle(this.defaultTextOptions) }));
        }
    }

    /**
     * Сбросить все настройки компонента публикация
     * карт
     * @private
     * @method resetFileData
     */
    protected resetFileData() {
        this.files.splice(0);
        this.jobId = '';

        this.widgetProps.uploadLink = '';

        const styleOptions = this.widgetProps.sldObject.styleOptions;
        styleOptions.line.splice(0);
        styleOptions.marker.splice(0);
        styleOptions.polygon.splice(0);
        styleOptions.text.splice(0);

        const publishMapObject = this.widgetProps.publishMapObject;
        publishMapObject.isPublished = false;
        publishMapObject.percentCompleted = 0;
        publishMapObject.publishedFolder = '';
        publishMapObject.publishMapClassifier = '';
        publishMapObject.publishMapCrs = '';
        publishMapObject.publishMapFileSize = 0;
        publishMapObject.publishMapExtension = '';
        publishMapObject.publishMapName = '';
        publishMapObject.publishMapObjectsNumber = '';
        publishMapObject.publishMapScale = PUBLISHMAPSCALE;
        publishMapObject.publishMapType = '';
        publishMapObject.uploadProgress = 0;
        publishMapObject.xsdList.select = '';
        publishMapObject.isReadyCreateThematic = true;
    }

    /**
     * Получить строку с выбранным типом объекта шаблона SLD
     * @private
     * @method getObjectTypeString
     * @return {string} text | line | polygon | marker
     */
    private getObjectTypeString() {
        let type = 'text';
        let sldObjectType: LOCALE;
        sldObjectType = this.widgetProps.sldObject.sldObjectType;
        if (sldObjectType === LOCALE.Line) {
            type = 'line';
        } else if (sldObjectType === LOCALE.Plane) {
            type = 'polygon';
        } else if (sldObjectType === LOCALE.Point) {
            type = 'marker';
        }
        return type;
    }

    /**
     * Получить список маркеров
     * @private
     * @async
     * @method generateMapMarkers
     * @return {Promise}
     */
    private async generateMapMarkers() {
        if (this.map.options.mapmarkers) {
            if (this.map.options.mapmarkers.getcategory) {
                this.mapMarkersCommands.getCategory = this.map.options.mapmarkers.getcategory;
                this.widgetProps.mapMarkersCommands.isGetCategory = true;
                const response = await this.getImageCategoriesFromServer();
                if (response && response.status === 'success' && response.data && response.data.categories) {
                    response.data.categories.forEach((item) =>
                        this.widgetProps.markerCategoryList.push({ name: item.name, id: +item.id })
                    );
                }
            }
            if (this.map.options.mapmarkers.getimages) {
                this.mapMarkersCommands.getImages = this.map.options.mapmarkers.getimages;
                await this.fillMarkerImageList();
            }
            if (this.map.options.mapmarkers.deleteimage) {
                this.mapMarkersCommands.deleteImage = this.map.options.mapmarkers.deleteimage;
                this.widgetProps.mapMarkersCommands.isDeleteImage = true;
            }
            if (this.map.options.mapmarkers.saveimage) {
                this.mapMarkersCommands.saveImage = this.map.options.mapmarkers.saveimage;
                this.widgetProps.mapMarkersCommands.isSaveImage = true;
            }
            if (!this.widgetProps.markerImageList.length && this.map.options.mapmarkers.images) {
                for (let i = 0; i < this.map.options.mapmarkers.images.length; i++) {
                    const src = this.map.options.mapmarkers.images[i];

                    const markerIcon: MarkerIcon = {
                        id: i + 1,
                        name: i + 1 + '',
                        categoryId: 1,
                        image: {
                            src,
                            height: 64,
                            width: 64,
                            fileSize: 0
                        }
                    };
                    this.widgetProps.markerImageList.push(markerIcon);
                }
            }
        }
    }

    /**
     * Запросить список категорий изображений для маркера с сервера
     * @private
     * @async
     * @method getImageCategoriesFromServer
     * @return {Promise}
     */
    private async getImageCategoriesFromServer(): Promise<MapMarkerResponse | undefined> {
        const url = this.iconServiceUrl;
        const httpParams = { url };
        const options = {
            cmd: this.mapMarkersCommands.getCategory
        };
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.COMMON);
        try {
            const response = await service.commonGet<MapMarkerResponse>(options, httpParams);
            return response.data;
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Map content') + '. ' + i18n.tc('mapcontent.Error') + '. ',
                description: gwtkError.message,
                type: LogEventType.Error
            });
        }
    }

    /**
     * Заполнить массив изображений для маркера
     * @private
     * @async
     * @method fillMarkerImageList
     */
    private async fillMarkerImageList() {
        const response = await this.getImagesFromServer();
        if (response && response.status === 'success' && response.data && response.data.images) {

            this.widgetProps.markerImageList.splice(0);

            response.data.images.forEach((item) => {
                const markerIcon: MarkerIcon = {
                    id: item.id,
                    name: item.name,
                    categoryId: +item.catalogId,
                    image: {
                        src: item.src,
                        height: +item.height,
                        width: +item.width,
                        fileSize: 0
                    }
                };
                this.widgetProps.markerImageList.push(markerIcon);
            });

        }
    }

    /**
     * Запросить изображения для маркера с сервера
     * @method getImagesFromServer
     * @private
     * @async
     */
    private async getImagesFromServer(): Promise<MapMarkerResponse | undefined> {
        const url = this.iconServiceUrl;
        const httpParams = { url };
        const options = {
            cmd: this.mapMarkersCommands.getImages
        };
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.COMMON);
        try {
            const response = await service.commonGet<MapMarkerResponse>(options, httpParams);
            return response.data;
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Map content') + '. ' + i18n.tc('mapcontent.Error') + '. ' + i18n.tc('legend.Image uploading'),
                description: gwtkError.message,
                type: LogEventType.Error
            });
        }
    }

    /**
     * Отправить изображение для маркера на сервер
     * @method sendImageToServer
     * @param markerIcon - изображение
     * @private
     * @async
     */
    private async sendImageToServer(markerIcon: MarkerIcon): Promise<MapMarkerResponse | undefined> {
        const url = this.iconServiceUrl;
        const httpParams = {
            url,
            data: {
                name: markerIcon.name,
                width: markerIcon.image.width,
                height: markerIcon.image.height,
                fileSize: markerIcon.image.fileSize,
                src: markerIcon.image.src
            }
        };
        const options = {
            cmd: this.mapMarkersCommands.saveImage
        };
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.COMMON);
        try {
            const response = await service.commonPost<MapMarkerResponse | undefined>(options, httpParams);
            return response.data;
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Map content') + '. ' + i18n.tc('mapcontent.Error') + '. ',
                description: gwtkError.message,
                type: LogEventType.Error
            });
        }
    }

    /**
     * Удалить изображения для маркера с сервера
     * @method removeImageFromServer
     * @param idList - список id изображений для удаления
     * @private
     * @async
     */
    private async removeImageFromServer(idList: string[]): Promise<MapMarkerResponse | undefined> {
        const url = this.iconServiceUrl;
        let ids = '';
        idList.forEach((item) => ids = ids + item + ',');
        ids = ids.substring(0, ids.length - 1);

        const httpParams = {
            url,
            data: {
                ids
            }
        };
        const options = {
            cmd: this.mapMarkersCommands.deleteImage
        };
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.COMMON);
        try {
            const response = await service.commonPost<MapMarkerResponse | undefined>(options, httpParams);
            return response.data;
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Map content') + '. ' + i18n.tc('mapcontent.Error') + '. ' + i18n.tc('mapcontent.Remove'),
                description: gwtkError.message,
                type: LogEventType.Error
            });
        }
    }

    private getTreeNodeInfo(layerId: string): { name: string, parentsIdList: string[] } {
        let result: { name: string, parentsIdList: string[] } = { name: '', parentsIdList: [] };

        let treeItem = this.findTreeViewNode(layerId, this.widgetProps.treeViewItem);

        if (treeItem) {
            result.name = treeItem.name;
        }

        while (treeItem) {
            result.parentsIdList.push(treeItem.parentId);
            treeItem = this.findTreeViewNode(treeItem.parentId, this.widgetProps.treeViewItem);
        }

        return result;
    }

    /**
     * Заполнить список с элементами легенды при поиске по названию элемента легенды
     * @method filterLegendObjectList
     * @private
     */
    // private filterLegendObjectList() {
    //     this.widgetProps.searchResultLegendObjectList.splice(0);
    //     this.widgetProps.legendObjectList.forEach(legendObject => {
    //         if (legendObject.text.toLocaleLowerCase().includes(this.widgetProps.searchValue.toLowerCase())) {
    //             this.widgetProps.searchResultLegendObjectList.push(legendObject);
    //         }
    //     });
    // }

    private filterTreeItems() {
        this.widgetProps.searchListItems.splice(0);
        if (this.widgetProps.rootItemTree) {
            for (const { item, path } of this.widgetProps.rootItemTree) {
                if (item) {
                    if (this.widgetProps.searchValue && !item.text.toLocaleLowerCase().includes(this.widgetProps.searchValue.toLowerCase())) {
                        continue;
                    }
                    if (item.nodes && item.nodes.length === 1 && item.nodes[0].text === item.text) {
                        continue;
                    }
                    if (this.widgetProps.selectedTags.length > 0) {
                        if (item.nodeType === TreeNodeType.Layer) {
                            const tags = this.map.tiles.getLayerByxId(item.id)?.options.tags;
                            let canAddItem = false;
                            if (tags) {
                                for (let tag of tags) {
                                    if (this.widgetProps.selectedTags.includes(tag)) {
                                        canAddItem = true;
                                        break;
                                    }
                                }
                            }
                            if (!canAddItem) {
                                continue;
                            }
                        } else {
                            continue;
                        }
                    }
                    this.widgetProps.searchListItems.push({ item, path });
                }
            }
        }
    }

    private updateVirtualFolder(value: MapContentTreeViewNode) {
        const virtualFolderItem = new GwtkVirtualFolderItem(this.map, value.item, null);
        virtualFolderItem.update().then(() => this.createTreeViewItems(this.widgetProps.rootMapLayerItem?.nodes));
    }

    private createLocalLayer(alias: string): void {
        const description: GwtkLayerDescription = {
            id: Utils.generateGUID(),
            url: 'localhost',
            alias: alias,
            export: ['json', 'gml', 'sxf', 'txf']
        };

        this.map.addLocalLayer(description, '', { isReadonly: false, isLocked: false });

        // добавить слой в дерево
        const treeNode: ContentTreeNode = {
            id: description.id,
            nodeType: TreeNodeType.LocalLayer,
            text: alias,
            parentId: USER_LAYERS_FOLDER_ID
        };

        this.map.onLayerListChanged(treeNode);

    }

    /**
     * Сформировать архив из файлов
     * @private
     * @method createZipArchive
     */
    private async createZipArchive() {
        const zip = new JSZip();
        this.files.forEach((file) => {
            zip.file(file.name, file);
        });
        try {
            const content = await zip.generateAsync({
                type: 'blob', compression: 'DEFLATE',
                compressionOptions: {
                    level: 7
                }
            }, (metadata) => {
                const percent = metadata.percent.toFixed(2);
                this.widgetProps.publishMapObject.createZipProgress = +percent;
            });
            //преобразуем Blob в объект типа File
            this.files.splice(0);
            this.files.push(new File([content], this.widgetProps.publishMapObject.publishMapName + '.zip', { type: 'application/zip' }));
            this.widgetProps.publishMapObject.publishMapFileSize = Math.ceil(this.files[0].size / 1024);
        } catch (error) {
            throw new GwtkError(error);
        }
    }

    /**
     * Создание пользовательского слоя по файлу SXF, TXF, MIF, SHP, KML, ZIP
     * @private
     * @method loadData
     */
    protected loadData() {
        const serviceUrl = GWTK.Util.getServerUrl(this.map.options.url);
        const httpParams = RequestServices.createHttpParams(this.map, { url: serviceUrl });
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);

        let request, cancellableRequest;

        const options: LoadData = {
            XSDNAME: this.widgetProps.publishMapObject.publishMapExtension === '.zip' ? '' : this.widgetProps.publishMapObject.xsdList.select,
            LAYERNAME: this.widgetProps.publishMapObject.publishMapName,
            CRS: (this.getCrsName() != '') ? this.getCrsName() : this.map.getCrsString(),
            CREATEMAPSCALE: this.widgetProps.publishMapObject.publishMapScale + '',
            EXTENSION: this.widgetProps.publishMapObject.publishMapExtension,
            SAVEDPATH: this.selectedVirtualFolder && this.selectedVirtualFolder.folder !== ''
                ? `${this.selectedVirtualFolder.folder}/${this.widgetProps.publishMapObject.publishMapName}` : '',
            FILENAME: this.widgetProps.uploadLink
        };

        if (this.selectedVirtualFolder && this.selectedVirtualFolder.folder === '') {
            delete options.SAVEDPATH;
        }
        if ((this.widgetProps.publishMapObject.xsdList.select === i18n.tc('mapcontent.By template'))) {
            options.XSDNAME = 'service';
        }
        if (this.widgetProps.publishMapObject.publishMapExtension === '.csv') {
            options.DELIMITERSYMBOL = ';';
        }
        request = service.loadData.bind(service);
        cancellableRequest = RequestService.sendCancellableRequest(request, options, httpParams);
        cancellableRequest.promise.then(response => {
            this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Publishing a map'));
            if (response.data) {
                const status = response.data.restmethod.outparams.status;
                if (status === 'Accepted') {
                    this.jobId = response.data.restmethod.outparams.jobId;
                }
            }
            if (this.jobId !== undefined) {
                this.getStatusResponse(this.jobId, serviceUrl);

            }
        }).catch((error) => {
            this.widgetProps.publishMapObject.uploadProgress = -1;
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Error executing query'),
                display: true,
                description: error,
                type: LogEventType.Error
            });
        });
    }

    /**
     *
     * Прервать асинхронный процесс
     * @private
     * @method abortAsyncProcess
     */
    private abortAsyncProcess() {
        if (this.jobId) {
            const serviceUrl = GWTK.Util.getServerUrl(this.map.options.url);
            const httpParams = RequestServices.createHttpParams(this.map, { url: serviceUrl });
            const service = RequestServices.getService(serviceUrl, ServiceType.REST);
            const options: DismissParams = {
                jobId: this.jobId,
            };
            service.dismiss(options, httpParams);
            this.jobId = '';
        }
    }

    /**
     * Получить информацию о статусе асинхронного процесса
     * @private
     * @method getStatusResponse
     * @param processId {string} Идентификатор процесса
     * @param serviceUrl {string} URL адрес запроса
     */
    protected getStatusResponse(processId: string, serviceUrl: string) {
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);
        window.setTimeout(async () => {
            const request = service.getAsyncStatusData.bind(service) as () => Promise<ServiceResponse<GetStatusDataResponse>>;
            const cancellableRequest = RequestService.sendCancellableRequest(request, { PROCESSNUMBER: processId });
            try {
                const response = await cancellableRequest.promise;
                if (response.data) {
                    const statusMessage = response.data.restmethod.outparams.status;
                    if (statusMessage === 'Accepted' || statusMessage === 'Running') {
                        if (this.widgetProps.publishMapObject.isReadyCreateThematic) {
                            this.widgetProps.publishMapObject.percentCompleted = response.data.restmethod.outparams.percentCompleted;
                        }
                        return this.getStatusResponse(processId, serviceUrl);
                    } else if (statusMessage === 'Succeeded') {
                        if (this.widgetProps.publishMapObject.isReadyCreateThematic) {
                            this.widgetProps.publishMapObject.percentCompleted = response.data.restmethod.outparams.percentCompleted;
                        }
                        processId = response.data.restmethod.outparams.jobId;
                    } else if (statusMessage === 'Failed') {
                        if (this.widgetProps.publishMapObject.isReadyCreateThematic) {
                            this.widgetProps.publishMapObject.uploadProgress = -1;
                        }
                        return;
                    }
                }
                if (processId !== undefined && response.data) {
                    const statusMessage = response.data.restmethod.outparams.status;

                    if (!this.widgetProps.publishMapObject.isReadyCreateThematic) {
                        this.processResponseThematic(processId, serviceUrl, statusMessage);
                    } else {
                        this.processResponse(processId, serviceUrl, statusMessage);
                    }
                }
            } catch (error) {
                this.widgetProps.publishMapObject.uploadProgress = -1;
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({
                    text: i18n.tc('mapcontent.Error executing query'),
                    display: true,
                    description: gwtkError.message,
                    type: LogEventType.Error
                });
            }
        }, 1000);
    }

    /**
     * Обработать ответ при завершении асинхронного процесса
     * при публикации карты
     * @private
     * @method processResponse
     * @param processId {string} Идентификатор процесса
     * @param serviceUrl {string} URL адрес запроса
     * @param statusMessage {string} Сообщение от сервера
     */
    protected processResponse(processId: string, serviceUrl: string, statusMessage: string): void {
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);
        const request = service.getAsyncResultData.bind(service) as () => Promise<ServiceResponse<GetLoadDataResponse>>;
        const cancellableRequest = RequestService.sendCancellableRequest(request, { PROCESSNUMBER: processId });
        cancellableRequest.promise.then(result => {
            if (statusMessage === 'Failed') {
                this.widgetProps.publishMapObject.uploadProgress = -1;
                if (result.error && typeof result.error !== 'string'
                ) {
                    this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Could not publish map'));
                    this.map.writeProtocolMessage({
                        text: result.error.ExceptionReport.text,
                        display: false,
                        type: LogEventType.Error
                    });
                }
            } else if (result.data) {
                this.widgetProps.publishMapObject.publishedFolder = result.data.restmethod.createlayerlist[0].id;
                this.widgetProps.publishMapObject.isPublished = true;
                if (this.widgetProps.publishMapObject.xsdList.select === i18n.tc('mapcontent.By template')) {
                    this.createThematicMapFromPublishedMap(this.widgetProps.publishMapObject.publishedFolder);
                } else {
                    this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.The map has been published'));
                    if (this.selectedVirtualFolder && this.selectedVirtualFolder.folder === '') {
                        this.openPublishMapInUsersLayersFolder(this.widgetProps.publishMapObject.publishedFolder);
                    } else {
                        this.openPublishMap(this.widgetProps.publishMapObject.publishedFolder);
                    }
                    this.map.writeProtocolMessage({
                        text: i18n.tc('mapcontent.The map has been published'),
                        display: false,
                        type: LogEventType.Info
                    });
                }
            }
        }).catch((error) => {
            this.widgetProps.publishMapObject.uploadProgress = -1;
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Could not publish map'),
                display: true,
                description: error,
                type: LogEventType.Error
            });
        });
    }

    /**
     * Обработать ответ при завершении асинхронного процесса для
     * публикации карт с шаблоном SLD
     * @private
     * @method processResponseThematic
     * @param processId {string} Идентификатор процесса
     * @param serviceUrl {string} URL адрес запроса
     * @param statusMessage {string} Сообщение от сервера
     */
    private processResponseThematic(processId: string, serviceUrl: string, statusMessage: string): void {
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);
        const request = service.getAsyncResultData.bind(service) as () => Promise<ServiceResponse<GetLoadDataResponse>>;
        const cancellableRequest = RequestService.sendCancellableRequest(request, { PROCESSNUMBER: processId });
        let idLayer = '';
        cancellableRequest.promise.then(result => {
            if (statusMessage === 'Failed' && result.error && typeof result.error !== 'string') {
                this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.The template could not be applied to the map'));
                this.map.writeProtocolMessage({
                    text: result.error.ExceptionReport.text,
                    display: false,
                    type: LogEventType.Error
                });
            } else if (result.data && result.data.restmethod && result.data.restmethod.createlayerlist) {
                idLayer = result.data.restmethod.createlayerlist[0].id;
            }
        }).catch((error) => {
            this.widgetProps.publishMapObject.uploadProgress = -1;
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.The template could not be applied to the map'),
                display: true,
                description: error,
                type: LogEventType.Error
            });
        }).finally(() => {
            this.widgetProps.publishMapObject.isReadyCreateThematic = true;
            if (this.selectedVirtualFolder && this.selectedVirtualFolder.folder === '') {
                this.openPublishMapInUsersLayersFolder(idLayer || this.widgetProps.publishMapObject.publishedFolder);
            } else {
                this.openPublishMap(idLayer || this.widgetProps.publishMapObject.publishedFolder);
            }
        });
    }

    /**
     * Создание тематической карты на основе опубликованной с применением SLD
     * шаблона
     * @private
     * @async
     * @method createThematicMapFromPublishedMap
     * @param publishedFolderId {string} Путь до опубликованной карты
     */
    protected async createThematicMapFromPublishedMap(publishedFolderId: string) {
        this.widgetProps.publishMapObject.isReadyCreateThematic = false;
        const numberOfObjects = await this.getObjectsIdFromPublishedMap(publishedFolderId);
        if (numberOfObjects) {
            this.generateCsvInit(numberOfObjects);
            this.createBuildParameterOptions({
                id: this.widgetProps.publishMapObject.publishedFolder,
                text: this.widgetProps.publishMapObject.publishedFolder,
                count: RANGES_COUNT_DEFAULT
            }, numberOfObjects);

            const buildThematicMapParams: BuildThematicMapParams = {
                alias: this.widgetProps.publishMapObject.publishMapName,
                path: this.selectedVirtualFolder ? this.selectedVirtualFolder.folder : '',
                csvEditorFiltered: this.csvEditor
            };
            this.sendRequest(buildThematicMapParams, publishedFolderId);
            return;
        } else if (this.selectedVirtualFolder && this.selectedVirtualFolder.folder === '') {
            this.openPublishMapInUsersLayersFolder(publishedFolderId);
        } else {
            this.openPublishMap(publishedFolderId);
        }
        this.widgetProps.publishMapObject.isReadyCreateThematic = true;
        this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.The template could not be applied to the map'));
    }

    /**
     * Получение числа объектов на опубликованной карте
     * @private
     * @async
     * @method getObjectsIdFromPublishedMap
     * @param publishedLayerId {string} Идентификатор слоя
     * @return {Promise<number | undefined>}
     */
    private async getObjectsIdFromPublishedMap(publishedLayerId: string) {
        const requestService = RequestServices.retrieveOrCreate({
            url: this.map.options.url
        }, ServiceType.REST);
        const features = await requestService.getFeatureCount({ LAYER: publishedLayerId });
        if (features && features.data?.restmethod.outparams.NumberMatched) {
            return features.data?.restmethod.outparams.NumberMatched;
        }
    }

    /**
     * Сгенерировать исходный CSV-файл
     * @method generateCsvInit
     * @private
     * @async
     */
    private generateCsvInit(numberOfOjects: number) {
        const newRow: Cell[] = [];
        this.csvEditor = new CsvEditor();
        this.csvEditor.columnCount = CSV_COLUMN_COUNT;
        for (let numberOfOject = 1; numberOfOject <= numberOfOjects; numberOfOject++) {
            const column_0: Cell = { type: 'String', value: numberOfOject + '', col: 0, row: numberOfOject };
            const column_1: Cell = { type: 'String', value: '1', col: 1, row: numberOfOject };
            newRow.push(column_0, column_1);
        }
        this.csvEditor.addCells(newRow);
    }


    /**
     * Создание исходной структуры параметра построения
     * @private
     * @async
     * @method createBuildParameterOptions
     * @param range {object} Параметры градации
     * @param numberOfObjects {number} Количество объектов
     */
    private createBuildParameterOptions(range: { id: string, text: string, count: number }, numberOfObjects: number) {
        const valueArray: number[] = new Array(numberOfObjects).fill(1, 0);

        const thematicRangesData: ThematicRangesData = {
            ranges: [],
            rangesCount: range.count,
            valueArray,
            minValue: this.widgetProps.minValue,
            maxValue: this.widgetProps.maxValue
        };

        const userThematicRange: UserThematicRange = {
            range: { min: this.widgetProps.minValue, max: this.widgetProps.maxValue },
            styles: {
                line: GwtkMapContentTask.fillUserThematicRange(this.widgetProps.sldObject.styleOptions.line),
                polygon: GwtkMapContentTask.fillUserThematicRange(this.widgetProps.sldObject.styleOptions.polygon),
                marker: GwtkMapContentTask.fillUserThematicRange(this.widgetProps.sldObject.styleOptions.marker),
                text: GwtkMapContentTask.fillUserThematicRange(this.widgetProps.sldObject.styleOptions.text)
            },

            icons: {
                line: '',
                polygon: '',
                marker: ''
            }
        };

        thematicRangesData.ranges.push(userThematicRange);
        const buildParameterOptions: BuildParameterOptions = {
            id: range.id,
            text: range.text,
            userThematicRangeList: thematicRangesData.ranges
        };
        this.fillBuildParametersOptionsTemp(buildParameterOptions);
    }


    /**
     * Заполнение структуры текущего параметра построения
     * @method fillBuildParametersOptionsTemp
     * @private
     * @param params {BuildParameterOptions} - параметры заполнения
     */
    private fillBuildParametersOptionsTemp(params: BuildParameterOptions): void {
        if (params && params.userThematicRangeList && params.userThematicRangeList.length) {
            this.widgetProps.buildParametersOptionsTemp[0].id = params.id;
            this.widgetProps.buildParametersOptionsTemp[0].text = params.text;
            this.widgetProps.buildParametersOptionsTemp[0].userThematicRangeList.splice(0, this.widgetProps.buildParametersOptionsTemp[0].userThematicRangeList.length, ...params.userThematicRangeList);
            this.widgetProps.buildParametersOptionsTemp[0].rangesCount = this.widgetProps.buildParametersOptionsTemp[0].userThematicRangeList.length;
        }
    }


    /**
     * Отправка запроса на создание тематической карты (картограммы)
     * @method sendRequest
     * @private
     * @param params {BuildThematicMapParams} - параметры построения
     * @param publishedFolderId {string} - папка с опубликованной картой
     *
     */
    private sendRequest(params: BuildThematicMapParams, publishedFolderId: string): void {
        const serviceUrl = GWTK.Util.getServerUrl(this.map.options.url);
        const base64data = UserThematic.b64EncodeUnicode(params.csvEditorFiltered.toString());
        const url = this.map.options.url;
        const requestService = RequestServices.retrieveOrCreate({ url }, ServiceType.REST);
        const uploadFileData = requestService.createThematicMapByCsvAsync.bind(requestService);
        const filter = UserThematic.getUserThematicFilter(this.widgetProps.buildParametersOptionsTemp);
        const fileUploadCancellableRequest = RequestService.sendCancellableRequest(uploadFileData, {
            LAYER: publishedFolderId,
            NUMBERCONNECTFIELD: '1',
            FILEDATA: base64data,
            FILTER: filter,
            BYOBJECTKEY: '1',
            SEMNUMBERFIELDLIST: params.csvEditorFiltered.getColumnNumbersList(),
            SAVEDPATH: params.path || undefined
        });
        fileUploadCancellableRequest.promise.then((response) => {
            if (response.data && 'outparams' in response.data.restmethod) {
                const status = response.data.restmethod.outparams.status;
                if (status === 'Accepted') {
                    this.jobId = response.data.restmethod.outparams.jobId;
                }
            }
            if (this.jobId !== undefined) {
                this.getStatusResponse(this.jobId, serviceUrl);
            }
        }).catch((error) => {
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.The template could not be applied to the map'),
                description: error,
                type: LogEventType.Error,
                display: true
            });
        });
    }

    /**
     * Открытие опубликованной карты в пользовательской директории
     * @private
     * @async
     * @method openPublishMapInUsersLayersFolder
     * @param idLayer {string} - папка с опубликованной картой
     */
    protected async openPublishMapInUsersLayersFolder(idLayer: string) {
        const parentId = Utils.generateGUID();
        const url = this.map.options.url + '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png' +
            '&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&LAYERS=' + encodeURIComponent(idLayer);

        //создадим подпапку
        const treeNode: ContentTreeNode = {
            id: parentId,
            nodeType: TreeNodeType.Group,
            text: this.widgetProps.publishMapObject.publishMapName,
            parentId: USER_LAYERS_FOLDER_ID
        };
        this.map.onLayerListChanged(treeNode);
        const id = Utils.generateGUID();
        //добавим карту в подпапку
        this.map.openLayer(
            {
                id,
                alias: this.widgetProps.publishMapObject.publishMapName,
                url: url
            },
            {
                id,
                nodeType: TreeNodeType.Layer,
                text: this.widgetProps.publishMapObject.publishMapName,
                parentId
            });
        let node, layer;
        //Сброс папок в начальное состояние
        const rootContentTreeItem = this.map.contentTreeManager.contentTree;
        let currentMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(this.map, rootContentTreeItem, null);
        if (currentMapLayerItem
            && currentMapLayerItem.contentTreeItem.nodes) {
            node = currentMapLayerItem.contentTreeItem.nodes.find(node => node.id === USER_LAYERS_FOLDER_ID);
            if (this.workspaceData?.openTreeElement) {
                this.workspaceData.openTreeElement.splice(0);
                this.workspaceData.openTreeElement.push(USER_LAYERS_FOLDER_ID);
            }
            if (node && node.nodes) {
                node = node.nodes.find(node => node.text === this.widgetProps.publishMapObject.publishMapName);
                if (this.workspaceData?.openTreeElement && node) {
                    this.workspaceData.openTreeElement.push(node.id);
                }
                if (node) {
                    currentMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(this.map, node, null);
                }
            }
        }
        if (this.workspaceData?.openTreeElement) {
            this.setState(UPDATE_OPEN_TREE_ELEMENT, this.workspaceData.openTreeElement);
        }
        if (this.workspaceData?.mode) {
            this.setState(CHANGE_VIEW_MODE, this.workspaceData.mode);
        }
        this.setState(SET_CURRENT_MAP_LAYER_ITEM, currentMapLayerItem.contentTreeItem);
        //Включим просмотр опубликованной карты
        if (this.widgetProps.currentMapLayerItem && this.widgetProps.currentMapLayerItem.nodes) {
            node = this.widgetProps.currentMapLayerItem.nodes.find(node => node.text.toLowerCase() === this.widgetProps.publishMapObject.publishMapName.toLowerCase());
            if (node) {
                layer = GwtkMapLayerFactory.createMapLayerItem(this.map, node, null);
            }
            if (layer) {
                layer.viewEntireLayer();
            }
        }
        this.scrollToPublishMap(this.widgetProps.publishMapObject.publishMapName);
    }

    /**
     * Открытие опубликованной карты
     * @private
     * @async
     * @method openPublishMap
     * @param idLayer {string} - папка с опубликованной картой
     */
    protected async openPublishMap(idLayer: string) {
        let node;
        let nodes;
        const publishMapNameArr: string[] = [];
        publishMapNameArr.push(...idLayer.split('/'));
        const publishMapName = publishMapNameArr[publishMapNameArr.length - 1];
        const virtualFolder = this.map.tiles.getVirtualFolderByFolderName(this.selectedVirtualFolder
            ? this.selectedVirtualFolder.folder : '', this.map.options.url);
        if (virtualFolder) {
            await virtualFolder.update();
            virtualFolder.setVisibility(false);
            const layer = virtualFolder.openLayer({ idLayer: idLayer });
            if (layer) {
                this.map.setLayerVisibility(layer, true);
            }
        }
        //для открытия публикуемой карты в режиме дерева
        if (this.workspaceData?.openTreeElement && virtualFolder && virtualFolder.id) {
            this.workspaceData.openTreeElement.splice(0);
            this.workspaceData.openTreeElement.push(virtualFolder.id);
        }
        if (virtualFolder && virtualFolder.nodes) {
            nodes = virtualFolder.nodes;
        }

        for (let i = 1; i < publishMapNameArr.length - 1; i++) {
            if (nodes) {
                node = nodes.find(node => node.text.toLowerCase() === publishMapNameArr[i].toLowerCase());
                nodes = node && node.nodes;

                if (this.workspaceData?.openTreeElement && node && node.id) {
                    this.workspaceData.openTreeElement.push(node.id);
                }
            } else {
                break;
            }
        }

        //cброс папок в начальное состояние
        const rootContentTreeItem = this.map.contentTreeManager.contentTree;
        let currentMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(this.map, rootContentTreeItem, null);
        await this.searchParentDirectory(currentMapLayerItem, virtualFolder);

        if (node) {
            currentMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(this.map, node, null);
        }

        if (this.workspaceData?.openTreeElement) {
            this.setState(UPDATE_OPEN_TREE_ELEMENT, this.workspaceData.openTreeElement);
        }
        if (this.workspaceData?.mode) {
            this.setState(CHANGE_VIEW_MODE, this.workspaceData.mode);
        }
        this.setState(SET_CURRENT_MAP_LAYER_ITEM, currentMapLayerItem.contentTreeItem);
        this.scrollToPublishMap(publishMapName);

    }

    /**
     * Поиск родительской директории для виртуальной папки
     * @private
     * @async
     * @method searchParentDirectory
     * @param currentMapLayerItem {GwtkGroupLayerItem | GwtkVirtualFolderItem | GwtkSingleLayerItem | ContentTreeNode} Текущий слой карты
     * @param virtualFolder: {VirtualFolder | undefined} Виртуальная папка
     */
    private async searchParentDirectory(currentMapLayerItem: GwtkGroupLayerItem | GwtkVirtualFolderItem | GwtkSingleLayerItem | ContentTreeNode, virtualFolder: VirtualFolder | undefined): Promise<void> {
        if (!currentMapLayerItem.nodes || !virtualFolder || !virtualFolder.id) {
            return;
        }
        const virtualFolderNode = currentMapLayerItem.nodes.find(node => node.id === virtualFolder.id);
        //если виртуальная папка лежит в корне, значит ее id уже лежит в массиве this.workspaceData.openTreeElement
        if (virtualFolderNode?.parentId === 'root') {
            return;
        }
        if (virtualFolderNode && this.workspaceData?.openTreeElement) {
            this.workspaceData.openTreeElement.unshift(virtualFolderNode.parentId);
            return;
        }
        await Promise.all(currentMapLayerItem.nodes.map(node => this.searchParentDirectory(node, virtualFolder)));
    }

    /**
     * Cкролл до загруженной карты после публикации
     * @private
     * @method scrollToPublishMap
     * @param publishMapName {string} Имя карты
     */
    private scrollToPublishMap(publishMapName: string) {
        if (this.workspaceData?.mode === LAYERS_BY_TREE) {
            this.setState(UPDATE_TREE, '');
            window.setTimeout(() => {
                const elements = document.getElementsByClassName(CLASS_TREE_SCROLL_ELEMENT);
                for (let i = 0; i < elements.length; i++) {
                    if (elements[i].textContent?.includes(publishMapName)) {
                        elements[i].scrollIntoView();
                        break;
                    }
                }
            }, 10);
        } else if (this.workspaceData?.mode === LAYERS_BY_ORDER || this.workspaceData?.mode === LAYERS_BY_GROUPS) {
            window.setTimeout(() => {
                const elements = document.getElementsByClassName(CLASS_ORDER_SCROLL_ELEMENT);
                for (let i = 0; i < elements.length; i++) {
                    if (elements[i].textContent?.includes(publishMapName)) {
                        elements[i].scrollIntoView();
                        break;
                    }
                }
            }, 10);
        }
    }

    /**
     * Чтение файлов карт с нетекстовым содержимым
     * @private
     * @method readDataFile
     */
    private readDataFile() {
        const fileName = Utils.parseFileName(this.files[0].name).fileName;
        this.widgetProps.publishMapObject.publishMapName = fileName || 'New map';
        this.getXsdList();
        this.getCrsList();
        this.getVirtualFolder();
    }

    /**
     * Получить список XSD схем
     * @private
     * @method getXsdList
     */
    private getXsdList() {
        this.widgetProps.publishMapObject.xsdList.list.splice(0);
        const httpParamsWfs = RequestServices.createHttpParams(this.map);
        const wfs = RequestServices.retrieveOrCreate(httpParamsWfs, ServiceType.REST);

        wfs.getXsdList().then((resultXsd: ServiceResponse) => {
            const resultString = resultXsd.data?.slice(resultXsd.data?.indexOf('string') + 7,
                resultXsd.data?.indexOf('<', resultXsd.data?.indexOf('string')));
            const list = resultString?.split(',');
            this.widgetProps.publishMapObject.xsdList.list.push(i18n.tc('mapcontent.By template'));
            if (list) {
                this.widgetProps.publishMapObject.xsdList.list.push(...list);
                this.widgetProps.publishMapObject.xsdList.select = this.widgetProps.publishMapObject.xsdList.list[0];
            }
        });
    }
    /**
     * Получить список референсных систем координат CRS
     * @private
     * @method getCrsList
     */
    private getCrsList() {
        const httpParams = RequestServices.createHttpParams(this.map);
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
        service.getCrsList().then((result: ServiceResponse) => {
            if (result.data) {
                const xml = ParseTextToXml(result.data);
                const crsValues = this.collectCrsValues(xml);
                if (crsValues) {
                    this.widgetProps.publishMapObject.crsList.list.push(...crsValues);
                    this.widgetProps.publishMapObject.crsList.select = this.widgetProps.publishMapObject.crsList.list[0].epsg;
                }
            }
        }).catch((error) => {
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Error getting CRS list'),
                display: true,
                description: error.message,
                type: LogEventType.Error
            });
        });
    }

    /**
     * Получить список значений CRS
     * @private
     * @param element {XMLElement}
     * @method collectCrsValues
     * @return {CrsItem[]}
     */
    private collectCrsValues(element: XMLElement): CrsItem[] {
        const crsList: CrsItem[] = [];
        const crsElement = element.findByTag('ProjectList');
        if (crsElement && crsElement.children.length) {
            const validCrsChildren = crsElement.children.filter(child => child.attributes.EPSG && child.attributes.EPSG !== '');
            validCrsChildren.forEach(xmlElement => crsList.push({
                epsg: xmlElement.attributes.EPSG.trim(),
                name: xmlElement.attributes.Name ? xmlElement.attributes.Name.trim() : '',
                comment: xmlElement.attributes.Comment ? xmlElement.attributes.Comment.trim() : ''
            }));
        }
        return crsList;
    }

    /**
     * Получить имя выбраного CRS регистра
     * @method getCrsName
     */
    getCrsName() {
        return 'EPSG:' + this.widgetProps.publishMapObject.crsList.select;
    }

    /**
     * Получить список виртуальных папок
     * @private
     * @method getVirtualFolder
     */
    protected getVirtualFolder() {
        this.widgetProps.publishMapObject.virtualFolderList.splice(0);
        this.widgetProps.publishMapObject.virtualFolderList.push({
            alias: `(${i18n.tc('mapcontent.Empty').toLowerCase()})`,
            folder: ''
        } as VirtualFolder);
        const virtualFolders = this.map.options.layers.filter(layer => Object.prototype.hasOwnProperty.call(layer, 'folder'))
            .map(layer => this.map.tiles.getVirtualFolderByxId(layer.id)) as VirtualFolder[];
        if (virtualFolders) {
            this.widgetProps.publishMapObject.virtualFolderList.push(...virtualFolders);
            this.selectedVirtualFolder = this.widgetProps.publishMapObject.virtualFolderList[0];
        }
    }

    private static getPublishMapName(data: string) {
        const start = data.indexOf(CARDNAMEPARAMETER);
        if (start === -1) {
            return '';
        }
        const end = data.indexOf('\r', start);
        return data.substring(start, end).split('   ')[1];
    }

    private static getPublishMapObjectsNumber(data: string) {
        const start = data.indexOf(NUMBEROBJECTSPARAMETER);
        if (start === -1) {
            return '';
        }
        const end = data.indexOf('\r', start);
        return data.substring(start, end).split('   ')[1];
    }

    private static getPublishMapCRS(data: string) {
        const start = data.indexOf(CRSPARAMETER);
        if (start === -1) {
            return '';
        }
        const end = data.indexOf('\r', start);
        return data.substring(start, end).split('   ')[1];
    }

    private static getPublishMapScale(data: string) {
        const start = data.indexOf(MAPSCALEPARAMETER);
        if (start === -1) {
            return PUBLISHMAPSCALE;
        }
        const end = data.indexOf('\r', start);
        return +data.substring(start, end).split('   ')[1];
    }

    private static getPublishMapClassifier(data: string): string {
        const start = data.indexOf(CLASSIFIERPARAMETER);
        if (start === -1) {
            return '';
        }
        const end = data.indexOf('\r', start);

        return Utils.parseFileName(data.substring(start, end).split('   ')[1]).fileName;
    }

    private static getPublishMapType(data: string) {
        const start = data.indexOf(MAPTYPEPARAMETER);
        if (start === -1) {
            return '';
        }
        const end = data.indexOf('\r', start);
        return i18n.tc(MAP_TYPE[data.substring(start, end).split('   ')[1]]);
    }

    /**
     * Чтение файлов карт с текстовым содержимым
     * @private
     * @method readTxfFile
     * @param e {ProgressEvent<FileReader> | string} Событие объекта FileReader или строка
     */
    private readTxfFile(e: ProgressEvent<FileReader> | string) {
        let result: string;
        if (typeof e === 'string') {
            result = e;
        } else if (e.target) {
            result = e.target.result as string;
        } else {
            this.map.writeProtocolMessage(
                {
                    text: i18n.tc('mapcontent.Reading file error'),
                    type: LogEventType.Error,
                    display: true
                }
            );
            return;
        }
        if (result) {
            this.widgetProps.publishMapObject.publishMapName = GwtkMapContentTask.getPublishMapName(result);
            this.widgetProps.publishMapObject.publishMapObjectsNumber = GwtkMapContentTask.getPublishMapObjectsNumber(result);
            this.widgetProps.publishMapObject.publishMapCrs = GwtkMapContentTask.getPublishMapCRS(result);
            this.widgetProps.publishMapObject.publishMapScale = GwtkMapContentTask.getPublishMapScale(result);
            this.widgetProps.publishMapObject.publishMapClassifier = GwtkMapContentTask.getPublishMapClassifier(result);
            this.widgetProps.publishMapObject.publishMapType = GwtkMapContentTask.getPublishMapType(result);

        }
        this.getXsdList();
        this.getCrsList();
        this.getVirtualFolder();
    }


    /**
     * Загружает файл карты на сервер
     * @private
     * @method uploadFiles
     */
    private uploadFiles() {
        if (this.files.length > 0) {
            this.widgetProps.publishMapObject.uploadProgress = 0;
            this.uploader = new FileUploader(this.files[0], { url: this.map.options.url });
            this.uploader.upload();
            this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Uploading a file to the server'));
            this.uploader.onProgressChanged((res: number) => {
                this.widgetProps.publishMapObject.uploadProgress = res;
            });
            this.uploader.onSuccess((res: UploadFileResponse['restmethod']) => {
                this.widgetProps.publishMapObject.uploadProgress = 100;
                this.widgetProps.uploadLink = res.file.path;
                this.loadData();
            });
            this.uploader.onError(() => {
                this.map.writeProtocolMessage(
                    {
                        text: i18n.tc('mapcontent.Error uploading a file to the server') + '!',
                        type: LogEventType.Error
                    }
                );
                this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Error uploading a file to the server'));
            });
        }
    }


    private openGml(e: ProgressEvent<FileReader>, fileName: File, alias: string) {
        if (e.target) {
            const serviceUrl = GWTK.Util.getServerUrl(this.map.options.url);
            const httpParams = RequestServices.createHttpParams(this.map, { url: serviceUrl });
            httpParams.data = e.target.result;
            this.loadGmlData.httpParams = httpParams;
            this.loadGmlData.service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
            const name = fileName.name.split('.');
            this.loadGmlData.filename = fileName.name;
            this.widgetProps.localLayerName = name[0];
            let layer = name[0];
            if (layer[0] >= '0' && layer[0] <= '9') {
                layer = 'gml' + layer;
            }
            layer = encodeURIComponent(layer);
            this.loadGmlData!.layer = layer;
            this.loadGmlData.fileSize = Math.ceil(e.total);
            this.loadGmlData.alias = alias;

            this.getVirtualFolder();
        }
    }

    private openLocalLayer(): void {
        BrowserService.openFileDialog(['.json', 'application/json', '.gml']).then((fileResult) => {
            if (fileResult && fileResult[0]) {
                const file = fileResult[0];
                const fileName = file, that = this;

                let alias = Utils.parseFileName(fileName.name).fileName;
                const reader = new FileReader();

                if (!alias) {
                    alias = i18n.t('phrases.New layer') as string;
                }

                reader.onload = function (e) {

                    if (e.target && typeof e.target.result === 'string') {

                        //TODO:открыть для GML

                        if (e.target.result.indexOf('<?xml') !== -1 && e.target.result.indexOf('<gml:FeatureCollection') !== -1) {

                            that.openGml(e, fileName, alias);


                        } else {
                            const id = Utils.generateGUID();
                            that.map.openLocalLayer(that.map, {
                                id,
                                alias,
                                url: 'localhost'
                            }, e.target.result, { isReadonly: false, isLocked: false });

                            // добавить слой в дерево
                            const treeNode: ContentTreeNode = {
                                id,
                                nodeType: TreeNodeType.LocalLayer,
                                text: alias,
                                parentId: USER_LAYERS_FOLDER_ID
                            };

                            that.map.onLayerListChanged(treeNode);

                            that.map.requestRender();
                            that.map.setCursor(CURSOR_TYPE.default);
                        }

                    } else {
                        that.map.writeProtocolMessage(
                            {
                                text: i18n.tc('mapcontent.Reading file error') + '!',
                                type: LogEventType.Error
                            }
                        );
                    }
                };

                that.map.setCursor(CURSOR_TYPE.progress);
                reader.readAsText(fileName);
            }
        });
    }

    /**
     * Проверка расширений добавляемых файлов
     * когда пользователь выбрал показать все файлы
     * @private
     * @method checkFileExtensions
     * @param files {FileList} Объект с файлами
     */
    protected checkFilesExtensions(files: FileList): boolean {
        let hasAllValidExtension = true;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExtension = Utils.parseFileName(file.name).extension;
            if (!fileExtension || !allowedFilesExtensions.includes(fileExtension.toLowerCase())) {
                this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Please select the supported file formats'));
                hasAllValidExtension = false;
                break;
            }
        }
        return hasAllValidExtension;
    }

    /**
     * Проверка наличия классификатора среди выбранных файлов
     * @private
     * @method checkClassifierInclude
     * @param files {FileList | File[]} Объект с файлами или массив с файлами
     */
    protected checkClassifierInclude(files: FileList | File[]): boolean {
        let hasClassifier = false;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExtension = Utils.parseFileName(file.name).extension;
            if (fileExtension) {
                const extension = fileExtension.toLowerCase();
                if (allowedSingleFilesExtensions.includes(extension)) {
                    //если выбран один файл, к которому можно указать XSD схему
                    hasClassifier = true;
                    break;
                } else if (classifierExtensions.includes(extension) && files.length > 1) {
                    hasClassifier = true;
                    break;
                } else if (classifierExtensions.includes(extension) && files.length === 1) {
                    //если выбран один файл классификатора без карты
                    this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Please add a map corresponding to the selected classifier'));
                    return false;
                }
            }
        }
        if (!hasClassifier) {
            this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Please add classifier'));
        }
        return hasClassifier;
    }

    /**
     * Проверка в выбранных файлах файлов типа .mif или .mid
     * @private
     * @method checkMidMifFileIncludes
     * @param files {FileList | File[]} Объект с файлами или массив с файлами
     */
    protected checkMidMifFileIncludes(files: FileList | File[]): boolean {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExtension = Utils.parseFileName(file.name).extension;
            if (fileExtension && mapInfoExtensions.includes(fileExtension.toLowerCase())) {
                return this.checkPairOfMidMifFiles(files);
            }
        }
        return true;
    }

    /**
     * Проверка наличия файлов типа *.mid при выборе файлов типа *.mif и наоборот
     * @private
     * @method checkPairOfMidMifFiles
     * @param files {FileList | File[]} Объект с файлами или массив с файлами
     */
    private checkPairOfMidMifFiles(files: FileList | File[]): boolean {
        let hasMif = false;
        let hasMid = false;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExtension = Utils.parseFileName(file.name).extension;
            if (fileExtension) {
                const extension = fileExtension.toLowerCase();
                if (extension === '.mif') {
                    hasMif = true;
                }
                if (extension === '.mid') {
                    hasMid = true;
                }
            }
        }
        if (hasMif && hasMid) {
            return true;

        } else {
            this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Please select the files mid and mif together'));
            return false;
        }
    }

    /**
     * Проверка расширения файла на принадлежность к текстовому типу
     * @private
     * @static
     * @method isTextFile
     * @param fileExtension {string} Расширение файла
     * @return {boolean}
     */
    private static isTextFile(fileExtension: string): boolean {
        return textFileExtensions.includes(fileExtension);
    }

    /**
     * Проверка расширения файла на принадлежность к бинарному типу
     * @private
     * @static
     * @method isBinaryFile
     * @param fileExtension {string} Расширение файла
     * @return {boolean}
     */
    private static isBinaryFile(fileExtension: string): boolean {
        return binaryFileExtensions.includes(fileExtension);
    }

    /**
     * Проверка суммарного размера загружаемых файлов
     * @private
     * @method checkFilesSize
     * @param fileList {FileList} Объект с файлами
     */
    protected checkFilesSize(fileList: FileList) {
        let totalSize = 0;
        for (let i = 0; i < fileList.length; i++) {
            totalSize += fileList[i].size;
        }
        const totalSizeInMB = Math.ceil(totalSize / (1024 * 1024));
        if (totalSizeInMB < LIMIT_PUBLISH_SIZE) {
            return true;
        }
        this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.The maximum size of published files exceeds') + ' ' + LIMIT_PUBLISH_SIZE + ' Мб');
        return false;
    }


    /**
     * Проверка заголовков выбранных файлов
     * @private
     * @method checkFileHeaders
     * @param fileList {FileList} Объект с файлами
     */
    private checkFileHeaders(fileList: FileList) {
        return Promise.all(Array.from(fileList).map(file => this.checkFileHeader(file)));
    }

    /**
     * Проверка заголовка файла
     * @private
     * @method checkFileHeader
     * @param file {File} Объект с файла
     */
    private checkFileHeader(file: File) {
        const fileExtension = Utils.parseFileName(file.name).extension.toLowerCase();
        return new Promise((resolve) => {
            const that = this;
            if (fileExtension) {
                if (GwtkMapContentTask.isTextFile(fileExtension)) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        if (e.target && e.target.result) {
                            const decoder = new TextDecoder('utf-8');
                            const text = decoder.decode(e.target.result as ArrayBuffer);
                            if (  //проверка .mif
                                text.startsWith('Version')
                                //проверка .mid
                                || text.startsWith('"')
                                //проверка .kml
                                || text.indexOf('<kml ') !== -1
                                //проверка .gml
                                || text.indexOf('<gml:FeatureCollection') !== -1
                                //проверка JSON
                                || text.startsWith('{')
                                //проверка CSV
                                || fileExtension === '.csv'
                            ) {
                                resolve(true);
                                return;
                            }
                        }
                        resolve(false);
                        that.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Invalid file') + ' ' + file.name);
                        return;
                    };
                    //считаем первые 200 байт файла
                    const blob = file.slice(0, 200);
                    reader.readAsArrayBuffer(blob);
                } else if (GwtkMapContentTask.isBinaryFile(fileExtension)
                ) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        if (e.target && e.target.result) {
                            const uint = new Uint8Array(e.target.result as ArrayBuffer);
                            const header = uint.reduce((str, byte) => str + byte.toString(16).padStart(2, '0').toUpperCase() + ' ', '').trim();

                            if (allowedFileHeaders[fileExtension].find(item => item === header)) {
                                resolve(true);
                                return;
                            }
                            resolve(false);
                            that.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Invalid file') + ' ' + file.name);
                            return;
                        }
                    };
                    //считаем первые 4 байта файла
                    const blob = file.slice(0, 4);
                    reader.readAsArrayBuffer(blob);
                } else if (fileExtension && fileExtension === '.prj' || fileExtension === '.cpg') {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        if (e.target && e.target.result && typeof e.target.result === 'string') {
                            resolve(true);
                            return;
                        }
                        resolve(false);
                        that.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Invalid file') + ' ' + file.name);
                        return;
                    };
                    reader.readAsText(file);
                } else if (fileExtension === '.dbf') {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        if (e.target && e.target.result) {
                            const uint = new Uint8Array(e.target.result as ArrayBuffer);
                            const header = uint.reduce((str, byte) => str + byte.toString(16).padStart(2, '0').toUpperCase() + ' ', '').trim();
                            if (dbfHeaders.includes(header)) {
                                resolve(true);
                                return;
                            }
                            resolve(false);
                            that.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Invalid file') + ' ' + file.name);
                            return;
                        }
                    };
                    //считаем только нулевой байт файла
                    const blob = file.slice(0, 1);
                    reader.readAsArrayBuffer(blob);
                } else if (fileExtension === '.txf') {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        if (e.target && e.target.result) {
                            const uint = new Uint8Array(e.target.result as ArrayBuffer);
                            const header = uint.reduce((str, byte) => str + byte.toString(16).padStart(2, '0').toUpperCase() + ' ', '').trim();
                            if (txfHeaders.includes(header)) {
                                resolve(true);
                                return;
                            }
                            resolve(false);
                            that.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Invalid file') + ' ' + file.name);
                            return;
                        }
                    };
                    //считаем первые 4 байта файла
                    const blob = file.slice(0, 4);
                    reader.readAsArrayBuffer(blob);
                }
            }
        });
    }


    /**
     * Оставить только один файл из набора допустимых для одиночной загрузки
     * @private
     * @method filterFileList
     * @param fileList {File[]} Массив с файлами
     */
    private filterFileList(fileList: File[]) {
        if (fileList.length > 1) {
            const filteredFileList: File[] = [];
            const filteredFileListExtension: string[] = [];
            fileList.forEach((file) => {
                let currentFileExtension = Utils.parseFileName(file.name.toLowerCase()).extension;
                if (!filteredFileListExtension.includes(currentFileExtension)
                    || shpExtensions.includes(currentFileExtension)
                    || mapInfoExtensions.includes(currentFileExtension)) {
                    filteredFileListExtension.push(currentFileExtension);
                    filteredFileList.push(file);
                }
            });
            if (fileList.length !== filteredFileList.length) {
                this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Uploaded files have been filtered'));
            }
            if (!(filteredFileListExtension.some(item => shpExtensions.includes(item))
                || filteredFileListExtension.some(item => mapInfoExtensions.includes(item)))) {
                let filteredFilesNamesString: string = filteredFileList.map(file => file.name).join(', ');
                this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Files will be uploaded') + ': ' + filteredFilesNamesString + '.', { timeout: 5000 });
            }
            return filteredFileList;
        }
        return fileList;
    }

    /**
     * Добавление файлов карт для дальнейшей публикации,
     * пришедших через drag and drop
     * @private
     * @method addPublishingFilesFromDnd
     * @param fileResult {FileList} Объект с файлами
     */
    protected async addPublishingFilesFromDnd(fileResult: FileList): Promise<void> {
        this.resetFileData();
        if (this.checkFilesSize(fileResult)
            && this.checkFilesExtensions(fileResult)
            && this.checkClassifierInclude(fileResult)
            && this.checkMidMifFileIncludes(fileResult)
        ) {
            this.openCheckedFiles(fileResult);
        } else {
            this.setState(CHANGE_VIEW_MODE, this.workspaceData?.mode || LAYERS_BY_TREE);
        }
    }

    /**
     * Открытие файлов карт для дальнейшей публикации
     * @private
     * @method addPublishingFiles
     */
    protected addPublishingFiles(): void {
        this.resetFileData();
        BrowserService.openFileDialog(allowedFilesExtensions, true).then(
            (fileResult) => {
                if (fileResult
                    && this.checkFilesSize(fileResult)
                    && this.checkFilesExtensions(fileResult)
                    && this.checkClassifierInclude(fileResult)
                    && this.checkMidMifFileIncludes(fileResult)
                ) {
                    this.openCheckedFiles(fileResult);
                }
            });
    }

    /**
     * Открытие проверенных файлов
     * @private
     * @method openCheckedFiles
     * @param fileResult {FileList} Объект с файлами
     */
    protected async openCheckedFiles(fileResult: FileList) {
        const results = await this.checkFileHeaders(fileResult);
        const filteredValidFiles = this.filterFileList(Array.from(fileResult).filter((item, index) => results[index]));
        if (filteredValidFiles.length === 0) {
            this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Valid files are missing'));
            this.setState(CHANGE_VIEW_MODE, this.workspaceData?.mode || LAYERS_BY_TREE);
            return;
        } else if (filteredValidFiles.length === 1
            && this.checkClassifierInclude(filteredValidFiles)
            && this.checkMidMifFileIncludes(filteredValidFiles)
        ) {
            this.openSingleFile(filteredValidFiles);
            this.setState(CHANGE_VIEW_MODE, LAYER_PUBLISH);
        } else if (filteredValidFiles.length > 1
            && this.checkClassifierInclude(filteredValidFiles)
            && this.checkMidMifFileIncludes(filteredValidFiles)
        ) {
            this.openMultipleFiles(filteredValidFiles);
            this.setState(CHANGE_VIEW_MODE, LAYER_PUBLISH);
        } else if (this.widgetProps.viewMode === LAYER_PUBLISH_DND) {
            this.setState(CHANGE_VIEW_MODE, this.workspaceData?.mode || LAYERS_BY_TREE);
        }
    }

    /**
     * Открытие одиночного файла карты
     * @private
     * @param file {File []} Массив с объектом типа файл
     * @method openSingleFile
     */
    private openSingleFile(file: File[]) {
        const singleFile = file[0];
        this.files.push(singleFile);
        const fileExtension = Utils.parseFileName(singleFile.name).extension;
        this.widgetProps.publishMapObject.publishMapFileSize = Math.ceil(singleFile.size / 1024);
        this.widgetProps.publishMapObject.publishMapExtension = fileExtension ? fileExtension.toLowerCase() : '';
        if (Math.ceil(singleFile.size / (1024 * 1024)) < MAX_SIZE_FOR_SINGLE_FILE_UPLOAD) {
            this.openSmallSingleFile(singleFile);
        } else {
            this.openLargeSingleFile(singleFile);
        }
    }

    /**
     * Открытие одиночного файла карты размером до MAXSIZEFORSINGLEFILEUPLOAD
     * @private
     * @param file {File} Объект файла
     * @method openSmallSingleFile
     */
    private openSmallSingleFile(file: File) {
        const that = this;
        const reader = new FileReader();
        reader.onload = function (e) {
            if (e.target && typeof e.target.result === 'string') {
                if (that.widgetProps.publishMapObject.publishMapExtension === '.txf'
                    || e.target.result.indexOf('.SIT') !== -1
                    || e.target.result.indexOf('.SXF') !== -1) {
                    that.readTxfFile(e);
                } else {
                    that.readDataFile();
                }
                that.setState(CHANGE_VIEW_MODE, LAYER_PUBLISH);
            } else {
                that.map.writeProtocolMessage(
                    {
                        text: i18n.tc('mapcontent.Reading file error') + ' ' + file.name,
                        type: LogEventType.Error,
                        display: true
                    }
                );
            }
        };
        reader.readAsText(file);
    }

    /**
     * Открытие одиночного файла карты размером свыше MAXSIZEFORSINGLEFILEUPLOAD
     * @private
     * @param file {File} Объект с файла
     * @method openLargeSingleFile
     */
    private openLargeSingleFile(file: File) {
        const that = this;
        const reader = new FileReader();
        reader.onload = function (e) {
            if (e.target && e.target.result) {
                const decoder = new TextDecoder('utf-8');
                const text = decoder.decode(e.target.result as ArrayBuffer);
                if (that.widgetProps.publishMapObject.publishMapExtension === '.txf'
                    || text.indexOf('.SIT') !== -1
                    || text.indexOf('.SXF') !== -1) {
                    that.readTxfFile(text);
                } else {
                    that.readDataFile();
                }
                that.setState(CHANGE_VIEW_MODE, LAYER_PUBLISH);
            } else {
                that.map.writeProtocolMessage(
                    {
                        text: i18n.tc('mapcontent.Reading file error') + ' ' + file.name,
                        type: LogEventType.Error,
                        display: true
                    }
                );
            }
        };
        //считаем первые 1500 байт файла
        const blob = file.slice(0, 1500);
        reader.readAsArrayBuffer(blob);
    }

    /**
     * Открытие нескольких файлов карты
     * @private
     * @param files {File[]} Массив с файлами
     * @method openMultipleFiles
     */
    private openMultipleFiles(files: File[]) {
        this.widgetProps.publishMapObject.publishMapExtension = '*';
        this.widgetProps.publishMapObject.publishMapName = i18n.tc('mapcontent.New map');
        files.forEach(file => this.files.push(file));
        //рассчитать занимаемое место для выбранных файлов
        for (const file of files) {
            this.widgetProps.publishMapObject.publishMapFileSize += Math.ceil(+file.size / 1024);
        }
        this.getCrsList();
        this.getVirtualFolder();
    }

    /**
     * Отменить загрузку файла до публикации
     * @private
     * @method abortFileUpload
     */
    private abortFileUpload() {
        if (this.uploader) {
            this.uploader.cancel();
        }
    }

    private fillItemsArray(treeItem: LayerTreeItem, listItems: ContentTreeNode[]) {
        if (!treeItem.nodes || (treeItem.nodeType !== TreeNodeType.Group && treeItem.nodeType !== TreeNodeType.VirtualFolder)) {
            listItems.push(treeItem);
        } else {
            for (let nodeItemNumber = 0; nodeItemNumber < treeItem.nodes.length; nodeItemNumber++) {
                const nodeItem = treeItem.nodes[nodeItemNumber];
                this.fillItemsArray(nodeItem, listItems);
            }
        }
    }


    /**
     * Заполнение объекта стиля на основе пользовательских настроек
     * @private
     * @static
     * @method fillUserThematicRange
     * @param styles {Style[]} - массив стилей
     * @return {CommonServiceSVG[]}
     */
    private static fillUserThematicRange(styles: Style[]): CommonServiceSVG[] {
        return styles.map(style => {
            if (style.fill) {
                return {
                    type: 'PolygonSymbolizer',
                    'fill': style.fill.color,
                    'fill-opacity': style.fill.opacity
                };
            } else if (style.stroke) {
                return {
                    'type': 'LineSymbolizer',
                    'stroke': style.stroke.color,
                    'stroke-opacity': style.stroke.opacity,
                    'stroke-width': style.stroke.width,
                    'stroke-dasharray': style.stroke.dasharray
                };
            } else if (style.hatch) {
                return {
                    'type': 'HatchSymbolizer',
                    'stroke': style.hatch.color,
                    'stroke-opacity': style.hatch.opacity,
                    'stroke-width': style.hatch.width,
                    'stroke-angle': style.hatch.angle,
                    'stroke-step': style.hatch.step
                };
            } else if (style.text) {
                return {
                    type: 'TextSymbolizer',
                    'fill': style.text.color,
                    'stroke': style.text.contour.color,
                    'stroke-width': style.text.contour.width,
                    'style': style.text.contour.color,
                    'text-shadow': style.text.shadow.color,
                    'font-family': style.text.font?.family,
                    'font-style': style.text.font?.style,
                    'font-weight': style.text.font?.weight,
                    'font-size': style.text.font?.size,
                };
            } else if (style.marker) {
                return {
                    type: 'PointSymbolizer',
                    'refX': style.marker.markerDescription?.refX,
                    'refY': style.marker.markerDescription?.refY,
                    'width': style.marker.markerDescription?.width,
                    'height': style.marker.markerDescription?.height,
                    'markerId': style.marker.markerId,
                    'image': style.marker.markerDescription?.image,
                    'path': style.marker.markerDescription?.path,
                };
            }
        }) as CommonServiceSVG[];
    }


}
