/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Задача "Объекты карты"                         *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import { EditorLayoutDescription, GwtkComponentDescriptionPropsData, GwtkMap, RoutePoint } from '~/types/Types';
import MapWindow from '~/MapWindow';

import GwtkMapObjectMain from '@/components/GwtkMapObjectPanelControl/task/GwtkMapObjectMain.vue';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import FilterItemManager, {
    SelectedFilterItem
} from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/FilterItemManager';
import VectorLayer from '~/maplayers/VectorLayer';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import Utils from '~/services/Utils';
import SVGrenderer, { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import GeoPoint from '~/geo/GeoPoint';
import { BrowserService } from '~/services/BrowserService';
import i18n from '@/plugins/i18n';
import RequestService from '~/services/RequestServices/common/RequestService';
import MapObjectSemanticContent from '~/mapobject/utils/MapObjectSemanticContent';
import MarkerStyle from '~/style/MarkerStyle';
import TextStyle from '~/style/TextStyle';
import { LOCALE, LogEventType, SimpleJson } from '~/types/CommonTypes';
import {
    AngleUnit,
    CursorCoordinateUnit,
    WorkspaceValues,
    PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE,
    PROJECT_SETTINGS_SEARCH_FILTER_TYPE,
    PROJECT_SETTINGS_SEARCH_FILTER_DIRECTION,
    PROJECT_SETTINGS_SEARCH_FILTER_SEMANTIC,
    PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG
} from '~/utils/WorkspaceManager';
import { SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';
import { MapPoint } from '~/geometry/MapPoint';
import EditObjectItemEditor from '@/components/GwtkMapObjectPanelControl/action/EditObjectItemEditor';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';
import GeoJSON, { CommonServiceSVG, CRS, FeatureCollection, GeoJsonType } from '~/utils/GeoJSON';
import { MAP_ROUTE_COMPONENT, MapObjectPanelState, ViewDocumentMode } from '~/taskmanager/TaskManager';
import SemanticFilterItem from '@/components/GwtkMapObjectPanelControl/task/utils/FilterItemManager/SemanticFilterItem';
import GwtkError from '~/utils/GwtkError';
import { ExportToCsvHeader } from '~/services/Utils/Utils';
import { FINDDIRECTION, SORTTYPE } from '~/services/RequestServices/common/enumerables';
import { ServiceResponse } from '~/services/Utils/Types';
import { AppendFileToObjectResponse } from '~/services/RequestServices/RestService/Types';
import { VIDEO_EXTENSIONS, IMAGE_EXTENSIONS } from '~/services/BrowserService/BrowserService';


export const UPDATE_OBJECTS_PROGRESS_BAR = 'gwtkmapobject.objectsprogressbar';
export const UPDATE_FILTERS_PROGRESS_BAR = 'gwtkmapobject.filtersprogressbar';
export const UPDATE_MAP_OBJECTS_COUNT = 'gwtkmapobject.mapobjectscount';
export const FIND_NEXT = 'gwtkmapobject.findnext';
export const HIGHLIGHT_OBJECT = 'gwtkmapobject.highlightobject';
export const CLEAR_HIGHLIGHTED_OBJECT = 'gwtkmapobject.clearhighlightedobject';
export const FIT_OBJECT = 'gwtkmapobject.fitobject';
export const APPLY_FILTERS = 'gwtkmapobject.applyfilters';
export const RESET_ALL_FILTERS = 'gwtkmapobject.resetallfilters';
export const DELETE_FILTER = 'gwtkmapobject.deletefilter';
export const SET_ACTIVE_OR_SELECTED_OBJECTS = 'gwtkmapobject.setactiveobject';
export const TOGGLE_SELECTED_OBJECT = 'gwtkmapobject.setselectedobjectlist';
export const TOGGLE_REALLY_SELECT_OBJECT = 'gwtkmapobject.togglereallyselectobject';
export const SELECT_MODE = 'gwtkmapobject.selectmode';
export const EXIT_MODE = 'gwtkmapobject.exitmode';
export const SELECT_CURRENT_MAPOBJECT_CONTENT = 'gwtkmapobject.selectcurrentobjectcontent';
export const SINGLE_MODE_FLAG = 'gwtkmapobject.singlemodeflag';
export const GET_ROUTE = 'gwtkmapobject.getroute';
export const UPLOAD_IMAGE = 'gwtkmapobject.uploadimage';
export const SHOW_GALLERY = 'gwtkmapobject.showgallery';
export const REMOVE_OBJECT_DOCUMENT = 'gwtkmapobject.removeobjectdocument';
export const DOWNLOAD_OBJECT_IMAGE = 'gwtkmapobject.downloadobjectimage';
export const UPLOAD_FILE = 'gwtkmapobject.uploadfile';
export const UPLOAD_BIM_FILE = 'gwtkmapobject.uploadbimfile';
export const ABORT_UPLOAD_FILE = 'gwtkmapobject.abortuploadfile';
export const SHOW_SELECTED_OBJECT_POINT_IN_MAP = 'gwtkmapobject.showselectedobjectpointinmap';
export const SHOW_EDIT_PANEL = 'gwtkmapobject.showeditpanel';
export const FIT_MAP_TO_CLUSTER = 'gwtkmapobject.fitmaptocluster';
export const VIEW_CLUSTER_LIST = 'gwtkmapobject.viewclusterlist';
export const SET_CLUSTER_MAP_OBJECTS_LIST = 'gwtkmapobject.setclustermapobjectslist';
export const EDIT_MAP_OBJECT_STYLE = 'gwtkmapobject.editmapobjectstyle';
export const REMOVE_MAP_OBJECT_STYLE = 'gwtkmapobject.removemapobjectstyle';
export const SET_EDITOR_TAB_OPTIONS = 'gwtkmapobject.seteditortaboptions';
export const PAINT_SELECTED_MAP_OBJECTS = 'gwtkmapobject.paintselectedmapobjects';
export const SET_SEMANTIC_VIEW_FLAGS = 'gwtkmapobject.setsemanticviewflags';
export const SET_SEARCH_VALUE = 'gwtkmapobject.setsearchvalue';
export const FIND_OBJECTS_BY_SEARCH_VALUE = 'gwtkmapobject.findobjectsbysearchvalue';
export const SET_SHOW_NOT_EMPTY_TABLE_FIELDS = 'gwtkmapobject.setshownotemptytablefields';
export const SET_SELECT_RECORDS_COUNT_IN_TABLE = 'gwtkmapobject.setselectrecordscountintable';
export const SET_SELECT_RECORDS_PAGE = 'gwtkmapobject.setselectrecordspage';
export const SET_SELECT_RECORD_OFFSET = 'gwtkmapobject.setselectrecordsoffset';
export const SET_SHOW_SELECTING_TABLE_FIELDS = 'gwtkmapobject.setshowselectingtablefields';
export const SET_SHOW_MAP_OBJECTS_LIST_TYPE = 'gwtkmapobject.setshowmapobjectslisttype';
export const EXPORT_TO_CLIPBOARD = 'gwtkmapobject.exporttoclipboard';
export const EXPORT_TO_XLSX = 'gwtkmapobject.exporttoxlsx';
export const EXPORT_TO_GEOJSON = 'gwtkmapobject.exporttogeojson';
export const SELECT_SEARCH_FILTER = 'gwtkmapobject.selectsearchfilter';
export const SELECT_SORT_SEMANTIC = 'gwtkmapobject.selectsortsemantic';
export const EXPORT_TO_CSV = 'gwtkmapobject.exporttocsv';
export const FIND_BY_START_INDEX = 'gwtkmapobject.findbystartindex';
export const UPDATE_OBJECT_DOCUMENT = 'gwtkmapobject.updateobjectdocument';
export const FILL_OBJECT_IMAGES = 'getkmapobject.fillobjectimages';
export const PREVIEW_FILE = 'gwtkmapobject.previewfile';
export const ON_CLICK_NEXT = 'gwtkmapobject.onclicknext';
export const ON_CLICK_PREVIOUS = 'gwtkmapobject.onclickprevious';
export const EXPORT_LOADED_OBJECTS = 'gwtkmapobject.exportloadedobjects';
export const EXPORT_SELECTED_OBJECTS = 'gwtkmapobject.exportselectedobjects';
export const EXPORT_ALL_OBJECTS = 'gwtkmapobject.exportallobjects';

type ExportFormat = typeof EXPORT_TO_CSV | typeof EXPORT_TO_XLSX | typeof EXPORT_TO_CLIPBOARD | typeof EXPORT_TO_GEOJSON;

export type MapObjectsViewMode = ShowObjectsListType.list | ShowObjectsListType.table;

export type SemanticViewFlags = {
    showAllSemantics: boolean;
    commonForAllObjects: boolean;
};

export type GallerySemanticItem = { key: string; value: string; preview?: string; };

export type GwtkMapObjectTaskState = {
    [UPDATE_OBJECTS_PROGRESS_BAR]: boolean;
    [UPDATE_FILTERS_PROGRESS_BAR]: boolean;
    [UPDATE_MAP_OBJECTS_COUNT]: number;
    [HIGHLIGHT_OBJECT]: MapObject;
    [FIT_OBJECT]: MapObject;
    [CLEAR_HIGHLIGHTED_OBJECT]: undefined;
    [APPLY_FILTERS]: undefined;
    [RESET_ALL_FILTERS]: undefined;
    [FIND_NEXT]: undefined;
    [DELETE_FILTER]: SelectedFilterItem;
    [SET_ACTIVE_OR_SELECTED_OBJECTS]: undefined | boolean;
    [TOGGLE_SELECTED_OBJECT]: string;
    [TOGGLE_REALLY_SELECT_OBJECT]: MapObject;
    [SELECT_MODE]: MapObjectPanelState;
    [EXIT_MODE]: undefined;
    [SELECT_CURRENT_MAPOBJECT_CONTENT]: MapObject;
    [SINGLE_MODE_FLAG]: boolean;
    [GET_ROUTE]: undefined;
    [UPLOAD_IMAGE]: MapObjectContent;
    [SHOW_GALLERY]: undefined;
    [REMOVE_OBJECT_DOCUMENT]: { path: string, key: string };
    [DOWNLOAD_OBJECT_IMAGE]: string;
    [UPLOAD_FILE]: { semantic: MapObjectSemanticContent; mapObjectContent: MapObjectContent };
    [UPLOAD_BIM_FILE]: { semantic: MapObjectSemanticContent; mapObjectContent: MapObjectContent; file: File };
    [PREVIEW_FILE]: { semantic: GallerySemanticItem; mapObjectContent: MapObjectContent; type?: ViewDocumentMode; };
    [ABORT_UPLOAD_FILE]: undefined;
    [SHOW_SELECTED_OBJECT_POINT_IN_MAP]: MapPoint | null;
    [SHOW_EDIT_PANEL]: boolean;
    [FIT_MAP_TO_CLUSTER]: MapObject;
    [VIEW_CLUSTER_LIST]: MapObject;
    [SET_CLUSTER_MAP_OBJECTS_LIST]: MapObject[];
    [EDIT_MAP_OBJECT_STYLE]: undefined;
    [REMOVE_MAP_OBJECT_STYLE]: undefined;
    [SET_EDITOR_TAB_OPTIONS]: string;
    [PAINT_SELECTED_MAP_OBJECTS]: undefined;
    [SET_SEMANTIC_VIEW_FLAGS]: SemanticViewFlags;
    [SET_SEARCH_VALUE]: string;
    [FIND_OBJECTS_BY_SEARCH_VALUE]: undefined;
    [SET_SHOW_NOT_EMPTY_TABLE_FIELDS]: boolean;
    [SET_SELECT_RECORDS_COUNT_IN_TABLE]: string;
    [SET_SELECT_RECORDS_PAGE]: string;
    [SET_SELECT_RECORD_OFFSET]: string;
    [SET_SHOW_SELECTING_TABLE_FIELDS]: string[];
    [SET_SHOW_MAP_OBJECTS_LIST_TYPE]: MapObjectsViewMode;
    [SELECT_SEARCH_FILTER]: { type: SORTTYPE, value: FINDDIRECTION };
    [SELECT_SORT_SEMANTIC]: string;
    [UPDATE_OBJECT_DOCUMENT]: { imagePath: string, key: string };
    [FILL_OBJECT_IMAGES]: MapObjectContent;
    [EXPORT_LOADED_OBJECTS]: ExportFormat;
    [EXPORT_SELECTED_OBJECTS]: ExportFormat;
    [EXPORT_ALL_OBJECTS]: ExportFormat;
    [FIND_BY_START_INDEX]: number[];
    [ON_CLICK_NEXT]: null;
    [ON_CLICK_PREVIOUS]: null;
};

export enum ShowObjectsListType {
    list = 'list',
    table = 'table'
}

export type RequestItem = {
    cancellableRequest: {
        abortXhr: () => void;
        promise: Promise<ServiceResponse<AppendFileToObjectResponse>>
    },
    fileName: string;
    progress: number;
    src: string;
};

export type TableHeader = {
    text: string;
    value: string;
    align?: 'start' | 'center' | 'end';
    sortable?: boolean;
    filterable?: boolean;
    width?: string | number;
    visibility?: boolean;
    empty?: boolean;
};

export type RecordsOnPage = {
    recordsSelect: number[],
    records: number,
    page: number,
    offset: number,
    recordsLength: number,
    recordsLoadedLength: number,
    tableLoading: boolean
}

export type TableParams = {
    tableAllHeaders: TableHeader[];
    tableHeaders: TableHeader[];
    tableBody: SimpleJson[];
    searchValue: string;
    showNotEmptyFields: boolean;
    recordsOnPage: RecordsOnPage;
    mapMetadataLength: number;
}

type WorkSpaceData = {
    showNotEmptyFields: boolean;
    recordsOnPageLength: number;
    showMapObjectsListType: MapObjectsViewMode;
};

export type ExportButtonList = {
    title: string;
    value: string;
    enabled: boolean;
    subItems: {
        text: string;
        value: ExportFormat;
        isWaitingExport: boolean;
    }[]
}[];

export type SortType = { text: string; value: { type: SORTTYPE, value: FINDDIRECTION } };

type WidgetParams = {
    setState: GwtkMapObjectTask['setState'];
    mapObjects: MapObject[];
    mapObjectsSelected: MapObject[];
    foundObjectsNumber: number | null;
    stateSearchObject: boolean;
    filtersProgressBar: boolean;
    filterManager: FilterItemManager;
    selectedObjects: string[];
    reallySelectedObjects: MapObject[];
    mapObjectsState: MapObjectPanelState;
    currentMapObject: MapObject | null;
    drawnObjectId: string;
    requestQueue: { id: string; requestItems: RequestItem[]; }[];
    showGallery: boolean;
    showSemanticFileUploadOverlay: boolean;
    coordinateDisplayFormatValue: AngleUnit;
    showSelectedObjectsPage: boolean;
    editorTabOptions: string;
    previewImageSrc: string;
    isGetRouteEnabled: boolean;
    semanticViewFlags: SemanticViewFlags;
    coordinateDisplayFormat: CursorCoordinateUnit;
    tableParams: TableParams;
    tableMapObjects: MapObject[];
    showMapObjectsListType: MapObjectsViewMode;
    buttonsExportActions: ExportButtonList;
    showProgressBar: boolean;
    semantics: { name: string, value: string }[];
    selectSortType: SortType['value'] | undefined;
    selectedSortSemantic: string;
    sortTypes: SortType[];
    externalFunctions: { id: string; text: string; contents: string | null; }[];
    objectAllDocuments: { key: string, name: string, itemList: GallerySemanticItem[] }[];
    currentObjectIndex: number;
    isReducedSizeInterface: boolean;
    onlyFilled: boolean;//отображать только заполненные семантики в карточке объекта
}

/**
 * Команда создания компонента
 * @class GwtkMapObjectTask
 * @extends Task
 */
export default class GwtkMapObjectTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & SimpleJson<any>}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * Сохраненные критерии поиска
     * @private
     * @property originCriteriaAggregator {CriteriaAggregator}
     */
    private originCriteriaAggregator = this.map.searchManager.getSearchCriteriaAggregatorCopy();

    private highlightedObject?: MapObject;

    private renderFlag = false;

    private singleModeFlag = false;

    private readonly selectedObjectsManager = new SelectedObjectManager(this.map);

    private searchManager = this.map.searchManager;
    private agregator = this.searchManager.getSearchCriteriaAggregatorCopy();

    /**
     * Стиль рисования объекта
     * @private
     * @readonly
     * @property selectedObjectStyle {Style}
     */
    private readonly selectedObjectStyle = new Style({
        stroke: new Stroke({
            color: 'green',
            width: '5px',
            dasharray: '5, 5'
        }),
        fill: new Fill({
            opacity: 0.1
        }),
        marker: new MarkerStyle({ markerId: DEFAULT_SVG_MARKER_ID }),
        text: new TextStyle({ color: 'green' })
    });

    /**
     * Остановить загрузку файла на сервер
     * @method abortUploadFile
     */
    private abortUploadFile?: () => void;

    private readonly pointObject: MapObject;

    private selectedObjectsMode = false;

    private get pointObjectTargetZoom() {
        return Math.max(18, this.map.options.tilematrix);
    }

    protected workspaceData: SemanticViewFlags & WorkSpaceData = {
        showAllSemantics: false,
        commonForAllObjects: false,
        showNotEmptyFields: false,
        recordsOnPageLength: 10,
        showMapObjectsListType: ShowObjectsListType.list
    };

    /**
     * Список заголовков таблицы по умолчанию
     * @private
     * @readonly
     * @property defaultTableHeader {TableHeader[]}
     */
    private readonly defaultTableHeader: TableHeader[] = [
        {
            text: '',
            value: 'showMapObjectInMap',
            align: 'start',
            sortable: false,
            filterable: false,
            width: '25px',
            visibility: true,
            empty: false
        },
        {
            text: '',
            value: 'showMapObjectInfo',
            align: 'start',
            sortable: false,
            filterable: false,
            width: '25px',
            visibility: true,
            empty: false
        },
        {
            text: i18n.tc('phrases.Object name') + '',
            value: 'mapObjectName',
            align: 'center',
            sortable: true,
            filterable: true,
            visibility: true,
            empty: false
        },
        {
            text: i18n.tc('phrases.Sheet name') + '',
            value: 'mapObjectSheetName',
            align: 'center',
            sortable: true,
            filterable: true,
            visibility: true,
            empty: false
        },
        {
            text: i18n.tc('phrases.Object number') + '',
            value: 'mapObjectNumber',
            align: 'center',
            sortable: true,
            filterable: true,
            visibility: true,
            empty: false
        },
        {
            text: i18n.tc('phrases.Layer name') + '',
            value: 'mapObjectLayerName',
            align: 'center',
            sortable: true,
            filterable: true,
            visibility: true,
            empty: false
        }
    ];

    /**
     * Минимальный размер экрана для отображения таблицы
     * @private
     * @readonly
     * @property displayLG {Number}
     */
    private readonly displayLG: number = 1280;

    private mapObjectsSelectedCopy: MapObject[] = [];
    //выделенные объекты компонента Объекты карты
    private readonly mapObjectsSelectedFromComponent: MapObject[] = [];
    /**
     * @constructor GwtkMapObjectTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        const routeTaskDescription = this.mapWindow.getTaskManager().getTaskDescription(MAP_ROUTE_COMPONENT);
        const isGetRouteEnabled = routeTaskDescription && routeTaskDescription.enabled;

        // Создание Vue компонента
        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            mapObjects: this.map.searchManager.mapObjects,
            mapObjectsSelected: [],
            foundObjectsNumber: null,
            stateSearchObject: false,
            filtersProgressBar: true,
            filterManager: new FilterItemManager(),
            selectedObjects: [],
            reallySelectedObjects: [],
            mapObjectsState: MapObjectPanelState.showObjects,
            currentMapObject: null,
            requestQueue: [],
            showGallery: false,
            drawnObjectId: '',
            showSemanticFileUploadOverlay: false,
            showSelectedObjectsPage: this.map.serviceObjectsSelection(),
            coordinateDisplayFormatValue: this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE),
            editorTabOptions: 'tab_edit_semantic',
            previewImageSrc: '',
            isGetRouteEnabled,
            semanticViewFlags: {
                showAllSemantics: true,
                commonForAllObjects: false
            },
            coordinateDisplayFormat: this.map.workspaceManager.getValue(PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM),
            tableParams: {
                tableAllHeaders: [],
                tableHeaders: [],
                tableBody: [],
                searchValue: '',
                showNotEmptyFields: false,
                recordsOnPage: {
                    recordsSelect: [5, 10, 20, 30, 40],
                    records: 10,
                    page: 1,
                    offset: 0,
                    recordsLength: 0,
                    recordsLoadedLength: 0,
                    tableLoading: false
                },
                mapMetadataLength: 4
            },
            tableMapObjects: [],
            showMapObjectsListType: ShowObjectsListType.list,
            semantics: [],
            selectSortType: undefined,
            buttonsExportActions: [],
            showProgressBar: false,
            selectedSortSemantic: '',
            sortTypes: [],
            externalFunctions: [],
            objectAllDocuments: [],
            currentObjectIndex: 0,
            isReducedSizeInterface: this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG),
            onlyFilled: true
        };

        const tempVectorLayer = VectorLayer.getEmptyInstance(this.map);

        this.pointObject = new MapObject(tempVectorLayer, MapObjectType.MultiPoint, { local: LOCALE.Point });

        this.actionRegistry.push({
            getConstructor() {
                return EditObjectItemEditor;
            },
            id: SHOW_EDIT_PANEL,
            active: false,
            enabled: false
        });

    }

    setup() {
        super.setup();
        this.updateMapObjectCount(this.map.searchManager.responseMapObjectCount);

        if (!this.workspaceData) {
            this.workspaceData = {
                showAllSemantics: this.widgetProps.semanticViewFlags.showAllSemantics,
                commonForAllObjects: this.widgetProps.semanticViewFlags.commonForAllObjects,
                showNotEmptyFields: this.widgetProps.tableParams.showNotEmptyFields,
                recordsOnPageLength: this.widgetProps.tableParams.recordsOnPage.records,
                showMapObjectsListType: this.widgetProps.showMapObjectsListType,
            };
        } else {
            this.widgetProps.semanticViewFlags.showAllSemantics = this.workspaceData.showAllSemantics;
            this.widgetProps.semanticViewFlags.commonForAllObjects = this.workspaceData.commonForAllObjects;
            this.widgetProps.tableParams.showNotEmptyFields = this.workspaceData.showNotEmptyFields;
            this.widgetProps.tableParams.recordsOnPage.records = this.workspaceData.recordsOnPageLength;
            this.widgetProps.showMapObjectsListType = this.workspaceData.showMapObjectsListType;
        }

        if (this.map.getWindowRect().width <= this.displayLG && this.workspaceData.showMapObjectsListType !== 'list') {
            this.widgetProps.showMapObjectsListType = ShowObjectsListType.list;
            this.workspaceData.showMapObjectsListType = ShowObjectsListType.list;
            this.writeWorkspaceData(true);
        }

        this.widgetProps.tableParams.recordsOnPage.offset = this.mapObjectsLength();
        this.widgetProps.tableParams.recordsOnPage.recordsLoadedLength = this.mapObjectsLength();

        if (this.map.options.objectinfo) {
            if (this.map.options.objectinfo.area) {
                this.defaultTableHeader.push({
                    text: i18n.tc('phrases.Perimeter') + '',
                    value: 'mapObjectPerimeter',
                    align: 'center',
                    sortable: true,
                    filterable: true,
                    visibility: true,
                    empty: false
                });

                this.defaultTableHeader.push({
                    text: i18n.tc('phrases.Area') + '',
                    value: 'mapObjectArea',
                    align: 'center',
                    sortable: true,
                    filterable: true,
                    visibility: true,
                    empty: false
                });

                this.widgetProps.tableParams.mapMetadataLength = 6;
            }

            if (!this.map.options.objectinfo.number) {
                const index = this.defaultTableHeader.findIndex(header => header.value === 'mapObjectNumber');
                if (index !== -1) {
                    this.defaultTableHeader.splice(index, 1);
                }
            }
        }

        this.getTableData();

        const type = this.map.workspaceManager.getValue(PROJECT_SETTINGS_SEARCH_FILTER_TYPE);
        const semantic = this.map.workspaceManager.getValue(PROJECT_SETTINGS_SEARCH_FILTER_SEMANTIC);
        const direction = this.map.workspaceManager.getValue(PROJECT_SETTINGS_SEARCH_FILTER_DIRECTION);
        if (type && direction) {
            this.widgetProps.selectSortType = { type: type as SORTTYPE, value: direction as FINDDIRECTION };
        }
        if (semantic) {
            this.widgetProps.selectedSortSemantic = semantic;
        }
        this.fillSortTypes();

        this.onSelectObjects();
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const nameMainWidget = 'GwtkMapObjectMain';
        const sourceMainWidget = GwtkMapObjectMain;
        this.mapWindow.registerComponent(nameMainWidget, sourceMainWidget);

        // Создание Vue компонента
        if (this.map.getWindowRect().width > this.displayLG) {
            this.mapWindow.createWindowWidget(nameMainWidget, this.widgetProps);
        } else {
            this.mapWindow.createWidget(nameMainWidget, this.widgetProps);
        }

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    private fillSortTypes() {
        this.widgetProps.sortTypes.push({
            text: i18n.t('mapobjectpanel.Find direction') + ' - ' + i18n.t('mapobjectpanel.Ascending'),
            value: { type: SORTTYPE.FindDirection, value: FINDDIRECTION.FirstObjectFirst }
        });
        this.widgetProps.sortTypes.push({
            text: i18n.t('mapobjectpanel.Find direction') + ' - ' + i18n.t('mapobjectpanel.Descending'),
            value: { type: SORTTYPE.FindDirection, value: FINDDIRECTION.FirstObjectLast }
        });
        this.widgetProps.sortTypes.push({
            text: i18n.t('mapobjectpanel.Sort by layer name') + ' - ' + i18n.t('mapobjectpanel.Ascending'),
            value: { type: SORTTYPE.SortByLayerName, value: FINDDIRECTION.FirstObjectFirst }
        });
        this.widgetProps.sortTypes.push({
            text: i18n.t('mapobjectpanel.Sort by layer name') + ' - ' + i18n.t('mapobjectpanel.Descending'),
            value: { type: SORTTYPE.SortByLayerName, value: FINDDIRECTION.FirstObjectLast }
        });
        this.widgetProps.sortTypes.push({
            text: i18n.t('mapobjectpanel.Sort by object name') + ' - ' + i18n.t('mapobjectpanel.Ascending'),
            value: { type: SORTTYPE.SortByObjectName, value: FINDDIRECTION.FirstObjectFirst }
        });
        this.widgetProps.sortTypes.push({
            text: i18n.t('mapobjectpanel.Sort by object name') + ' - ' + i18n.t('mapobjectpanel.Descending'),
            value: { type: SORTTYPE.SortByObjectName, value: FINDDIRECTION.FirstObjectLast }
        });
        this.widgetProps.sortTypes.push({
            text: i18n.t('mapobjectpanel.Sort by semantic value') + ' - ' + i18n.t('mapobjectpanel.Ascending'),
            value: { type: SORTTYPE.SortBysemanticValue, value: FINDDIRECTION.FirstObjectFirst }
        });
        this.widgetProps.sortTypes.push({
            text: i18n.t('mapobjectpanel.Sort by semantic value') + ' - ' + i18n.t('mapobjectpanel.Descending'),
            value: { type: SORTTYPE.SortBysemanticValue, value: FINDDIRECTION.FirstObjectLast }
        });
    }

    async getFileUrl(layerId: string, value: string, url: string) {
        let result = '';
        const getFileDocumentParam = {
            LAYER: layerId,
            ALIAS: value
        };
        const requestService = RequestServices.retrieveOrCreate({ url }, ServiceType.REST);
        await requestService.getFileByLink(getFileDocumentParam).then((data) => {
            if (data.data) {
                const type = BrowserService.getMimeType(value);
                const file = new File([data.data], '', { type });
                const blob = new Blob([file], { type });
                result = URL.createObjectURL(blob);
            }
        });
        return result;
    }

    private async fillObjectImages(mapObject: MapObject) {
        if (mapObject) {
            await mapObject.reload();

            const mapObjectContent = new MapObjectContent(mapObject);

            await mapObject.vectorLayer.classifier.getObjectSemantics(mapObject.key || '');

            this.widgetProps.objectAllDocuments.splice(0);

            // const semanticKeyList = [];
            const layerId = mapObjectContent.mapId;
            if (layerId) {
                const objectSemantics = mapObjectContent.documentSemantics;
                for (let i = 0; i < objectSemantics.length; i++) {
                    const semanticStore = objectSemantics[i];
                    if (semanticStore.items.length > 0) {
                        const name = semanticStore.items[0].name;

                        const itemList: GallerySemanticItem[] = [];

                        for (let j = 0; j < semanticStore.items.length; j++) {
                            const item = semanticStore.items[j];
                            let preview: string | undefined = '';
                            if (item.isImageSemantic) {
                                preview = item.value;

                                const imageItem = mapObjectContent.imageCache.find(imageItem => imageItem.path === item.value);
                                if (imageItem && imageItem.src) {
                                    preview = imageItem.src;
                                } else {
                                    if (!Utils.isValidUrl(preview)) {
                                        try {
                                            preview = await this.getFileUrl(layerId, item.value, mapObjectContent.vectorLayer.serviceUrl);
                                        } catch (e) {
                                            this.map.writeProtocolMessage({
                                                type: LogEventType.Error,
                                                text: i18n.tc('phrases.Failed to get data'),
                                                description: `${layerId}: ${mapObjectContent.vectorLayer.serviceUrl}:${item.value}`
                                            });
                                        }
                                    }
                                    if (preview) {
                                        mapObjectContent.imageCache.push({ src: preview, path: item.value });
                                    }
                                }
                            }

                            const extension = item.value.slice(item.value.lastIndexOf('.') + 1);

                            if (!VIDEO_EXTENSIONS.includes(extension) && !IMAGE_EXTENSIONS.includes(extension) && extension !== 'pdf' && extension !== 'ifc') {
                                preview = undefined;
                            }


                            itemList.push({
                                key: item.key,
                                value: item.value,
                                preview
                            });
                        }

                        this.widgetProps.objectAllDocuments.push({ key: semanticStore.key, name, itemList });
                    }
                }
            }
        }
    }

    async setState<K extends keyof GwtkMapObjectTaskState>(key: K, value: GwtkMapObjectTaskState[K]) {
        switch (key) {
            case UPDATE_FILTERS_PROGRESS_BAR:
                this.widgetProps.filtersProgressBar = value as boolean;
                break;
            case UPDATE_MAP_OBJECTS_COUNT:
                this.updateMapObjectCount(value as number | null);
                break;

            case HIGHLIGHT_OBJECT:
                {
                    const mapObject = value as MapObject;
                    this.highlightedObject = await this.map.highLightObject(mapObject);
                    this.widgetProps.drawnObjectId = mapObject.id;
                    this.renderFlag = true;

                }
                break;
            case FIT_OBJECT:
                this.fitObject(value as MapObject);
                break;
            case CLEAR_HIGHLIGHTED_OBJECT:
                this.clearHighlightedObject();
                break;
            case APPLY_FILTERS:
                this.widgetProps.showProgressBar = true;
                this.onFilterApply().then(() => {
                }).finally(() => {
                    this.widgetProps.showProgressBar = false;
                });
                break;
            case RESET_ALL_FILTERS:
                this.onClearSelectedFiltersTypes();
                break;
            case DELETE_FILTER:
                this.onDeleteSelectedFiltersTypes(value as SelectedFilterItem);
                break;
            case FIND_NEXT:
                this.widgetProps.semantics.splice(0);
                if (!this.selectedObjectsMode) {
                    this.widgetProps.showProgressBar = true;
                    this.map.searchManager.findNext().then(() => {
                    }).finally(() => {
                        this.createOrUpdateTableRowsList();
                        this.widgetProps.showProgressBar = false;
                        this.map.searchManager.setStartIndex(this.widgetProps.mapObjects.length);
                        if (this.widgetProps.mapObjectsState === MapObjectPanelState.showInfo) {
                            this.setState(ON_CLICK_NEXT, null);
                        }
                    });
                }
                break;
            case SELECT_SEARCH_FILTER:
                const newValue = value as { type: SORTTYPE, value: FINDDIRECTION };
                this.widgetProps.selectSortType = newValue;
                this.agregator.getSemSortKey().setValue(undefined);
                this.agregator.getSortKey().setValue(newValue);
                this.searchManager.setSearchCriteriaAggregator(this.agregator);
                if (newValue.type === SORTTYPE.SortBysemanticValue) {
                    if (this.widgetProps.selectedSortSemantic.length > 0) {
                        this.setState(SELECT_SORT_SEMANTIC, this.widgetProps.selectedSortSemantic);
                    } else {
                        this.setState(SELECT_SORT_SEMANTIC, this.widgetProps.semantics[0].value);
                    }
                } else {
                    this.widgetProps.mapObjects.splice(0);
                    this.searchManager.setStartIndex(0);
                    this.widgetProps.tableMapObjects.splice(0);
                    this.setState(FIND_NEXT, undefined);
                }
                if (this.widgetProps.selectSortType) {
                    this.map.workspaceManager.setValue(PROJECT_SETTINGS_SEARCH_FILTER_TYPE, this.widgetProps.selectSortType.type);
                    this.map.workspaceManager.setValue(PROJECT_SETTINGS_SEARCH_FILTER_DIRECTION, this.widgetProps.selectSortType.value);
                }
                break;
            case SELECT_SORT_SEMANTIC:
                this.widgetProps.selectedSortSemantic = value as string;
                if (this.widgetProps.selectedSortSemantic) {
                    this.widgetProps.mapObjects.splice(0);
                    this.searchManager.setStartIndex(0);
                    this.agregator.getSemSortKey().setValue(this.widgetProps.selectedSortSemantic);
                    this.searchManager.setSearchCriteriaAggregator(this.agregator);
                    this.map.workspaceManager.setValue(PROJECT_SETTINGS_SEARCH_FILTER_SEMANTIC, this.widgetProps.selectedSortSemantic);
                    this.widgetProps.tableMapObjects.splice(0);
                    this.setState(FIND_NEXT, undefined);
                }
                break;
            case SET_ACTIVE_OR_SELECTED_OBJECTS:
                if (value === undefined) {
                    if (this.widgetProps.selectedObjects.length !== 0) {
                        this.setActiveOrSelectedObjects();
                    }
                    this.mapWindow.getTaskManager().detachTask(this.id);
                } else {
                    this.setActiveOrSelectedObjects();
                }
                break;
            case TOGGLE_SELECTED_OBJECT:
                this.setSelectedMapObjectsList(value as string);
                break;
            case TOGGLE_REALLY_SELECT_OBJECT:
                const mapObject = value as MapObject;
                const mapObjectSelected = this.map.getSelectedObjectById(mapObject.gmlId, mapObject.vectorLayer.serviceUrl, mapObject.vectorLayer.idLayer);
                if (mapObjectSelected) {
                    const index = this.mapObjectsSelectedFromComponent.findIndex(mapObjectComponent => mapObjectComponent.gmlId === mapObject.gmlId);
                    if (index !== -1) {
                        this.mapObjectsSelectedFromComponent.splice(index, 1);
                    }
                    this.map.removeSelectedObject(mapObjectSelected);
                } else {
                    this.mapObjectsSelectedFromComponent.push(mapObject);
                    this.map.addSelectedObject(mapObject);
                }
                break;
            case SELECT_CURRENT_MAPOBJECT_CONTENT:
                this.widgetProps.currentMapObject = value as MapObject;
                this.widgetProps.showGallery = false;
                this.updateExternalFunctionsProp();
                const currentObjectIndex = this.widgetProps.mapObjects.findIndex((object) => object.id === this.widgetProps.currentMapObject!.id);
                if (currentObjectIndex !== -1) {
                    this.widgetProps.currentObjectIndex = currentObjectIndex;
                }
                break;
            case SELECT_MODE:
                let targetMode = value as MapObjectPanelState;
                if (targetMode === MapObjectPanelState.showInfo&&this.map.strictEditorMode) {
                    targetMode = MapObjectPanelState.showEditor;
                }

                this.widgetProps.mapObjectsState = targetMode;
                if (this.widgetProps.mapObjectsState === MapObjectPanelState.showSelectedObjects) {
                    this.selectedObjectsMode = true;
                } else if (this.widgetProps.mapObjectsState === MapObjectPanelState.showObjects) {
                    this.selectedObjectsMode = false;
                    this.widgetProps.showSelectedObjectsPage = this.isSelectedObjectsPagination;
                } else if (this.widgetProps.mapObjectsState === MapObjectPanelState.showEditor) {
                    this.updatePreviewImage();
                }
                if (this.selectedObjectsMode) {
                    this.widgetProps.mapObjectsSelected.splice(0);
                    this.mapObjectsSelectedCopy.splice(0);
                    this.selectedObjectsManager.mapObjects.forEach(mapObject => {
                        this.widgetProps.mapObjectsSelected.push(mapObject);
                        this.mapObjectsSelectedCopy.push(mapObject);
                    });
                    this.updateMapObjectCount(this.selectedObjectsManager.responseMapObjectCount);
                } else if (this.widgetProps.mapObjectsState === MapObjectPanelState.showObjects) {
                    this.widgetProps.mapObjects = this.map.searchManager.mapObjects;
                    this.updateMapObjectCount(this.map.searchManager.responseMapObjectCount);
                }
                this.widgetProps.selectedObjects.splice(0);
                this.widgetProps.buttonsExportActions.splice(0);
                this.widgetProps.buttonsExportActions = GwtkMapObjectTask.getButtonsExportActions(this.selectedObjectsMode,
                    this.widgetProps.mapObjectsSelected.length,
                    this.widgetProps.mapObjects.length,
                    this.widgetProps.selectedObjects.length,
                    this.widgetProps.foundObjectsNumber);

                if(this.widgetProps.mapObjectsState===MapObjectPanelState.showInfo&&this.widgetProps.currentMapObject) {
                    this.fillObjectImages(this.widgetProps.currentMapObject);
                }
                break;
            case EXIT_MODE:
                this.showGeometricObjectPointInMap(null);
                this.exitMode();
                break;
            case SINGLE_MODE_FLAG:
                this.singleModeFlag = value as boolean;
                break;
            case GET_ROUTE:
                this.getRoute();
                break;
            case UPLOAD_IMAGE:
                const currentMapObject = value as MapObjectContent;
                if (currentMapObject) {
                    BrowserService.openFileDialog(['image/bmp', 'image/png', 'image/jpeg'], true).then(res => {
                        if (res) {
                            this.uploadImage(currentMapObject, res);
                        }
                    });
                }
                break;
            case SHOW_GALLERY:
                if (this.widgetProps.currentMapObject) {
                    this.fillObjectImages(this.widgetProps.currentMapObject).finally(() => this.widgetProps.showGallery = true);
                }
                break;
            case REMOVE_OBJECT_DOCUMENT:
                const { path, key } = value as { path: string, key: string };
                this.removeDocument(path, key);
                break;
            case DOWNLOAD_OBJECT_IMAGE:
                this.downloadImage(value as string);
                break;
            case UPLOAD_FILE:
                const { semantic, mapObjectContent } = value as { semantic: MapObjectSemanticContent; mapObjectContent: MapObjectContent };
                if (semantic && mapObjectContent) {
                    BrowserService.openFileDialog().then(res => {
                        if (res) {
                            const file = res[0];
                            this.uploadFile(semantic, mapObjectContent, [file]);
                        }
                    });
                }
                break;
            case UPLOAD_BIM_FILE:
                if (value) {
                    const { semantic, mapObjectContent, file } = value as { semantic: MapObjectSemanticContent; mapObjectContent: MapObjectContent; file: File };
                    this.widgetProps.showSemanticFileUploadOverlay = true;
                    this.map.getTaskManager().uploadBimFile(file as File, true).then((resolve) => {
                        this.widgetProps.showSemanticFileUploadOverlay = false;
                        if (resolve) {
                            this.uploadFile(semantic, mapObjectContent, [file]);
                        }
                    });
                }
                break;

            case PREVIEW_FILE:
                if (value) {
                    const { semantic, mapObjectContent, type } = value as { semantic: GallerySemanticItem; mapObjectContent: MapObjectContent; type: ViewDocumentMode; };
                    const fileName = GwtkMapObjectTask.getDownloadFileName(semantic.value);
                    const fileType = type || GwtkMapObjectTask.getFileType(fileName);
                    switch (fileType) {
                        case ViewDocumentMode.bim:
                            this.previewBIM(semantic, mapObjectContent);
                            break;
                        case ViewDocumentMode.video:
                        case ViewDocumentMode.image:
                            this.previewMedia(semantic, mapObjectContent, fileType);
                            break;
                        case ViewDocumentMode.file:
                        default:
                            this.previewAnyFile(semantic, mapObjectContent);
                            break;
                    }
                }
                break;
            case FILL_OBJECT_IMAGES:
                if (value) {
                    const mapObjectContent = value as MapObjectContent;
                    this.fillObjectImages(mapObjectContent.mapObject);
                }
                break;
            case UPDATE_OBJECT_DOCUMENT:
                if (value) {
                    const { imagePath, key } = value as { imagePath: string, key: string };

                    const mapObject = this.widgetProps.currentMapObject;
                    if (mapObject) {
                        BrowserService.openFileDialog().then(res => {
                            if (res) {
                                this.updateDocument(imagePath, key, res);
                            }
                        });
                    }
                }
                break;
            case ABORT_UPLOAD_FILE:
                if (this.abortUploadFile) {
                    this.abortUploadFile();
                }
                break;
            case SHOW_SELECTED_OBJECT_POINT_IN_MAP:
                this.showGeometricObjectPointInMap(value as MapPoint | null);
                break;
            case SHOW_EDIT_PANEL:
                if (value) {
                    this.doAction(SHOW_EDIT_PANEL);
                } else {
                    this.quitAction(SHOW_EDIT_PANEL);
                }
                break;
            case VIEW_CLUSTER_LIST:
                this.viewClusterObjectList(value as MapObject);
                window.setTimeout(() => {
                    this.createOrUpdateTableRowsList(this.widgetProps.mapObjects);
                }, 3);
                break;
            case FIT_MAP_TO_CLUSTER:
                this.fitMapToCluster(value as MapObject).then(() => {
                    this.createOrUpdateTableRowsList(this.widgetProps.mapObjects);
                });
                break;
            case SET_CLUSTER_MAP_OBJECTS_LIST:
                this.setClusterMapObjectsList(value as MapObject[]);
                break;
            case EDIT_MAP_OBJECT_STYLE:
                this.editMapObjectStyles();
                break;
            case REMOVE_MAP_OBJECT_STYLE:
                this.removeMapObjectStyles();
                break;
            case SET_EDITOR_TAB_OPTIONS:
                this.widgetProps.editorTabOptions = value as string;
                break;
            case PAINT_SELECTED_MAP_OBJECTS:
                this.paintAllSelectedMapObjects();
                break;
            case SET_SEMANTIC_VIEW_FLAGS:
                const semanticViewFlags = value as SemanticViewFlags;
                const showAllSemantics = semanticViewFlags.showAllSemantics;
                const commonForAllObjects = semanticViewFlags.showAllSemantics && semanticViewFlags.commonForAllObjects;

                this.widgetProps.semanticViewFlags.showAllSemantics = showAllSemantics;
                this.widgetProps.semanticViewFlags.commonForAllObjects = commonForAllObjects;

                this.workspaceData.showAllSemantics = showAllSemantics;
                this.workspaceData.commonForAllObjects = commonForAllObjects;
                this.writeWorkspaceData(true);
                break;
            case SET_SEARCH_VALUE:
                this.widgetProps.tableParams.searchValue = value as string;
                break;
            case FIND_OBJECTS_BY_SEARCH_VALUE:
                if (this.widgetProps.mapObjectsState === MapObjectPanelState.showSelectedObjects) {

                    if (this.widgetProps.tableParams.searchValue !== '') {
                        const mapObjects: MapObject[] = [];

                        this.widgetProps.mapObjectsSelected.splice(0);
                        this.widgetProps.mapObjectsSelected.push(...this.mapObjectsSelectedCopy);

                        this.widgetProps.mapObjectsSelected.forEach(mapObject => {


                            if (mapObject.objectName?.includes(this.widgetProps.tableParams.searchValue) ||
                                (mapObject.objectNumber + '').includes(this.widgetProps.tableParams.searchValue)) {
                                mapObjects.push(mapObject);
                            }
                        });
                        this.widgetProps.mapObjectsSelected = mapObjects;

                    } else {
                        this.widgetProps.mapObjectsSelected.splice(0);
                        this.widgetProps.mapObjectsSelected.push(...this.mapObjectsSelectedCopy);
                    }
                    this.createOrUpdateTableRowsList(this.widgetProps.mapObjectsSelected);
                } else {
                    this.findObjectsByTableSearchValue(this.widgetProps.tableParams.searchValue);
                }
                break;
            case SET_SHOW_NOT_EMPTY_TABLE_FIELDS:
                this.widgetProps.tableParams.showNotEmptyFields = value as boolean;
                this.toggleTableEmptyFields();
                this.createOrUpdateTableRowsList();

                this.workspaceData.showNotEmptyFields = value as boolean;
                this.writeWorkspaceData(true);

                break;
            case SET_SELECT_RECORDS_COUNT_IN_TABLE:
                this.widgetProps.tableParams.recordsOnPage.records = parseInt(value as string, 10);

                this.workspaceData.recordsOnPageLength = parseInt(value as string, 10);
                this.writeWorkspaceData(true);
                break;
            case SET_SELECT_RECORDS_PAGE:
                this.widgetProps.tableParams.recordsOnPage.page = parseInt(value as string, 10);
                break;
            case SET_SELECT_RECORD_OFFSET:
                this.widgetProps.tableParams.recordsOnPage.offset = parseInt(value as string, 10);
                break;
            case SET_SHOW_SELECTING_TABLE_FIELDS:
                this.onSelectTableFields(value as string[]);
                break;
            case SET_SHOW_MAP_OBJECTS_LIST_TYPE:
                this.widgetProps.showMapObjectsListType = value as MapObjectsViewMode;
                this.workspaceData.showMapObjectsListType = value as MapObjectsViewMode;
                this.writeWorkspaceData(true);
                break;
            case EXPORT_ALL_OBJECTS:
                this.updateIsWaitingExport(EXPORT_ALL_OBJECTS, value as ExportFormat, true);
                this.exportObjects(value as ExportFormat, true).then(() => {
                }).catch(() => {
                }).finally(() => {
                    this.updateIsWaitingExport(EXPORT_ALL_OBJECTS, value as ExportFormat, false);
                });
                break;
            case EXPORT_SELECTED_OBJECTS:
                this.updateIsWaitingExport(EXPORT_SELECTED_OBJECTS, value as ExportFormat, true);
                this.exportObjects(value as ExportFormat, false, this.selectedObjectsList).then(() => {
                }).catch(() => {
                }).finally(() => {
                    this.updateIsWaitingExport(EXPORT_SELECTED_OBJECTS, value as ExportFormat, false);
                });
                break;
            case EXPORT_LOADED_OBJECTS:
                this.updateIsWaitingExport(EXPORT_LOADED_OBJECTS, value as ExportFormat, true);
                this.exportObjects(value as ExportFormat, false).then(() => {
                }).catch(() => {
                }).finally(() => {
                    this.updateIsWaitingExport(EXPORT_LOADED_OBJECTS, value as ExportFormat, false);
                });
                break;
            case FIND_BY_START_INDEX:
                const indexes = value as number[];
                this.findByStartIndex(indexes[0], indexes[1]);
                break;
            case ON_CLICK_NEXT:
                if (this.widgetProps.currentMapObject !== null) {
                    const currentObjectIndex = this.widgetProps.mapObjects.findIndex((object) => object.gmlId === this.widgetProps.currentMapObject!.gmlId);
                    if (currentObjectIndex !== -1) {
                        if (this.widgetProps.mapObjects[currentObjectIndex + 1]) {
                            const mapObject = this.widgetProps.mapObjects[currentObjectIndex + 1];
                            if (mapObject) {
                                this.setCurrentObject(mapObject);
                            }
                            this.widgetProps.currentObjectIndex = currentObjectIndex + 1;
                        } else if (this.widgetProps.foundObjectsNumber && (this.widgetProps.mapObjects.length < this.widgetProps.foundObjectsNumber)) {
                            this.setState(FIND_NEXT, undefined);
                        }
                    }
                }
                break;
            case ON_CLICK_PREVIOUS:
                if (this.widgetProps.currentMapObject !== null) {
                    const currentObjectIndex = this.widgetProps.mapObjects.findIndex((object) => object.gmlId === this.widgetProps.currentMapObject!.gmlId);
                    if (currentObjectIndex !== -1) {
                        const mapObject = this.widgetProps.mapObjects[currentObjectIndex - 1];
                        if (mapObject) {
                            this.setCurrentObject(mapObject);
                        }
                        this.widgetProps.currentObjectIndex = currentObjectIndex - 1;
                    }
                }
                break;
        }
    }

    private previewAnyFile(semantic: GallerySemanticItem, mapObjectContent: MapObjectContent) {
        const layerId = mapObjectContent.mapId;
        if (layerId) {
            const getFileDocumentParam = {
                LAYER: layerId,
                ALIAS: semantic.value
            };
            const url = mapObjectContent.vectorLayer.serviceUrl;
            const requestService = RequestServices.retrieveOrCreate({ url }, ServiceType.REST);
            requestService.getFileByLink(getFileDocumentParam).then((data) => {
                if (data.data) {
                    const downloadFileName = GwtkMapObjectTask.getDownloadFileName(semantic.value);
                    const file = new File([data.data], downloadFileName);
                    const type = BrowserService.getMimeType(semantic.value);
                    const blob = new Blob([file], { type });
                    // BrowserService.downloadContent(blob, semantic.downloadFileName);
                    window.open(URL.createObjectURL(blob), '_blank');
                }
            });
        }
    }

    private previewBIM(semantic: GallerySemanticItem, mapObjectContent: MapObjectContent) {
        const layerId = mapObjectContent.mapId;
        if (layerId) {
            const getFileDocumentParam = {
                LAYER: layerId,
                ALIAS: semantic.value
            };
            const url = mapObjectContent.vectorLayer.serviceUrl;
            const requestService = RequestServices.retrieveOrCreate({ url }, ServiceType.REST);
            requestService.getFileByLink(getFileDocumentParam).then((data) => {
                if (data.data) {
                    const downloadFileName = GwtkMapObjectTask.getDownloadFileName(semantic.value);
                    const file = new File([data.data], downloadFileName);
                    // this.map.getTaskManager().showDocumentViewer(file as File);
                    this.map.getTaskManager().openDocumentViewer(ViewDocumentMode.bim, file as File, downloadFileName);
                }
            });
        }
    }

    private previewMedia(semantic: GallerySemanticItem, mapObjectContent: MapObjectContent, type: ViewDocumentMode) {
        const layerId = mapObjectContent.mapId;
        if (layerId) {
            const getFileDocumentParam = {
                LAYER: layerId,
                ALIAS: semantic.value
            };
            const url = mapObjectContent.vectorLayer.serviceUrl;
            const requestService = RequestServices.retrieveOrCreate({ url }, ServiceType.REST);
            requestService.getFileByLink(getFileDocumentParam).then((data) => {
                if (data.data) {
                    const downloadFileName = GwtkMapObjectTask.getDownloadFileName(semantic.value);

                    const mimeType = BrowserService.getMimeType(semantic.value);
                    const file = new File([data.data], downloadFileName, { type: mimeType });
                    if (type === ViewDocumentMode.image) {
                        this.map.getTaskManager().openDocumentViewer(ViewDocumentMode.image, file as File, downloadFileName);
                    } else if (type === ViewDocumentMode.video) {
                        this.map.getTaskManager().openDocumentViewer(ViewDocumentMode.video, file as File, downloadFileName);
                    }

                }
            });
        }
    }



    private setCurrentObject(mapObject: MapObject) {
        this.setState(EXIT_MODE, undefined);
        this.widgetProps.showProgressBar = true;
        window.setTimeout(() => {
            this.setState(HIGHLIGHT_OBJECT, mapObject);
            this.setState(SELECT_CURRENT_MAPOBJECT_CONTENT, mapObject);
            this.setState(SELECT_MODE, MapObjectPanelState.showInfo);
            this.widgetProps.showProgressBar = false;
        }, 0);
    }


    private updateExternalFunctionsProp() {
        this.widgetProps.externalFunctions.splice(0);
        this.widgetProps.currentMapObject?.vectorLayer.externalFunctions.forEach(functionDescription => {
            this.widgetProps.externalFunctions.push({
                id: functionDescription.name,
                contents: null,
                text: functionDescription.description
            });
        });
    }

    private updateIsWaitingExport(itemValue: string, subItemValue: string, status: boolean) {
        const item = this.widgetProps.buttonsExportActions.find(item => item.value === itemValue);
        if (item) {
            const subItem = item.subItems.find(subItem => subItem.value === subItemValue);
            if (subItem) {
                subItem.isWaitingExport = status;
            }
        }
    }

    private exportObjects(format: ExportFormat, flag: boolean, objects?: MapObject[]) {
        if (this.selectedObjectsMode) {
            flag = false;
        }
        switch (format) {
            case EXPORT_TO_CSV:
                return this.exportToCSV(flag, objects);
            case EXPORT_TO_XLSX:
                return this.exportToXLSX(flag, objects);
            case EXPORT_TO_CLIPBOARD:
                return this.copyToClipBoardObjectList(flag, objects);
            case EXPORT_TO_GEOJSON:
                return this.exportToGeoJson(flag, objects);
        }
    }

    private exitMode() {
        if (this.singleModeFlag || this.widgetProps.mapObjectsState === MapObjectPanelState.showObjects) {
            this.mapWindow.getTaskManager().detachTask(this.id);
        } else if (this.widgetProps.mapObjectsState === MapObjectPanelState.showInfo) {
            this.widgetProps.mapObjectsState = this.selectedObjectsMode ? MapObjectPanelState.showSelectedObjects : MapObjectPanelState.showObjects;
            this.widgetProps.currentMapObject = null;
            this.clearHighlightedObject();
        } else if (this.widgetProps.mapObjectsState === MapObjectPanelState.showEditor) {
            this.widgetProps.mapObjectsState = MapObjectPanelState.showInfo;
            if (this.map.strictEditorMode) {
                this.exitMode();
            }
        }
    }

    onSearchResultChanged() {
        if (!this.selectedObjectsMode) {
            this.updateMapObjectCount(this.map.searchManager.responseMapObjectCount);
            const activeObject = this.map.getActiveObject();
            if (activeObject) {
                this.setState(SELECT_CURRENT_MAPOBJECT_CONTENT, activeObject);
            }
        }
    }

    onSelectObjects() {
        this.widgetProps.reallySelectedObjects.splice(0);
        this.map.getSelectedObjects().forEach(item => this.widgetProps.reallySelectedObjects.push(item));

        if (!this.selectedObjectsMode) {
            return;
        }

        this.widgetProps.mapObjectsSelected.splice(0);
        this.selectedObjectsManager.mapObjects.forEach(mapObject => this.widgetProps.mapObjectsSelected.push(mapObject));

        this.createOrUpdateTableHeadersList();
        this.createOrUpdateTableRowsList();
        this.toggleTableEmptyFields();
        this.updateMapObjectCount(this.widgetProps.mapObjectsSelected.length);

    }

    onPreRender() {
        if (this.pointObject.isDirty || this.renderFlag) {
            this.renderFlag = false;
            this.pointObject.isDirty = false;
            this.map.requestRender();
        }
    }

    onPostRender(renderer: SVGrenderer) {

        let mapObject = this.highlightedObject;

        if (this.widgetProps.currentMapObject && this.widgetProps.currentMapObject.hasGeometry()) {
            mapObject = this.widgetProps.currentMapObject;
        }

        if (mapObject) {
            this.map.mapObjectsViewer.drawMapObject(renderer, mapObject, this.selectedObjectStyle);
        }

        if (this.pointObject.getPointList().length > 0) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.pointObject);
        }
    }

    protected destroy() {
        super.destroy();
        this.clearHighlightedObject();
        this.mapObjectsSelectedFromComponent.splice(0);
        if (this.widgetProps.mapObjectsState === MapObjectPanelState.showSelectedObjects || this.widgetProps.mapObjectsState === MapObjectPanelState.showInfo) {
            window.setTimeout(() => this.mapWindow.getTaskManager().closeSelectedObjectViewer(), 5);
        }
        this.map.requestRender();
    }

    onWorkspaceChanged(type: keyof WorkspaceValues) {
        if (type === PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM) {
            this.widgetProps.coordinateDisplayFormat = this.map.workspaceManager.getValue(PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM);
        }
    }

    onWorkspaceReset() {
        this.widgetProps.coordinateDisplayFormat = this.map.workspaceManager.getValue(PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM);
    }

    /**
     * Обновить список объектов
     * @private
     * @method updateMapObjectCount
     * @param value {number} Количество найденных объектов
     */
    private updateMapObjectCount(value: number | null) {
        this.widgetProps.foundObjectsNumber = value || 0;

        this.widgetProps.tableParams.recordsOnPage.recordsLength = value || 0;

        this.widgetProps.tableParams.recordsOnPage.offset = this.mapObjectsLength();
        this.widgetProps.tableParams.recordsOnPage.recordsLoadedLength = this.mapObjectsLength();
        this.updateTableMapObjectsList(value);
        this.getTableData();
        if (!this.selectedObjectsMode) {
            this.clearHighlightedObject();
            this.originCriteriaAggregator = this.map.searchManager.getSearchCriteriaAggregatorCopy();
            if (this.map.searchManager.responseStatistic) {
                const statisticSemantics = this.map.searchManager.responseStatistic.semantics;
                if (statisticSemantics) {
                    this.widgetProps.semantics.splice(0, this.widgetProps.semantics.length, ...statisticSemantics);
                    this.widgetProps.semantics.sort((semanticA, semanticB) => Utils.sortAlphaNum(semanticA.name, semanticB.name));
                }
                this.widgetProps.filterManager.fromStatistics(this.map.searchManager.responseStatistic, this.map.tiles.getSelectableLayersArray());
            } else {
                this.widgetProps.filterManager.clear();
            }
            //обновить список примененных фильтров
            this.widgetProps.filterManager.refreshAppliedFilterItems();
        }
    }

    /**
     * Вписать объект в карту
     * @private
     * @method fitObject
     * @param mapObject {string}
     */
    private fitObject(mapObject: MapObject) {
        this.map.fitMapObject(mapObject, true);
    }

    /**
     * Удалить выделенный объект на карте
     * @method clearHighlightedObject
     */
    private clearHighlightedObject() {
        if (this.highlightedObject) {
            this.highlightedObject = undefined;
            this.map.clearHighLightObject();
            this.renderFlag = true;
        }
        this.widgetProps.drawnObjectId = '';
    }

    /**
     * Выделенный объект на карте
     * @method getSelectedObject
     */
    getSelectedObject() {
        return this.highlightedObject;
    }


    /**
     * Получить данные компонента для формирования ссылки
     * @method getComponentDataForLink
     * @returns { object } - подсвеченный объект или список выделенных объектов
     */
    getComponentDataForLink() {
        const mapObjectsForLink = [];
        mapObjectsForLink.push(...this.mapObjectsSelectedFromComponent);
        if (this.widgetProps.selectedObjects.length) {
            this.widgetProps.selectedObjects.forEach((selectedObjectId) => {
                const index = this.mapObjectsSelectedFromComponent.findIndex(mapObjectSelectedFromComponent => mapObjectSelectedFromComponent.id === selectedObjectId);
                if (index === -1) {
                    const mapObject = this.widgetProps.mapObjects.find(mapObject => mapObject.id === selectedObjectId);
                    if (mapObject) {
                        mapObjectsForLink.push(mapObject);
                    }
                } 
            });
        }
        return this.getSelectedObject() ? { highlighted: this.getSelectedObject() } : { selected: mapObjectsForLink };
    }

    /**
     * Выделить выбранные объекты на карте( множественный выбор )
     * @private
     * @method setSelectedMapObjectsList
     * @param mapObjectId {string}  Идентификатор объекта карты
     */
    private setSelectedMapObjectsList(mapObjectId: string) {
        const index = this.widgetProps.selectedObjects.indexOf(mapObjectId);
        if (index !== -1) {
            this.widgetProps.selectedObjects.splice(index, 1);
        } else {
            this.widgetProps.selectedObjects.push(mapObjectId);
        }
        this.widgetProps.buttonsExportActions.splice(0);
        this.widgetProps.buttonsExportActions = GwtkMapObjectTask.getButtonsExportActions(this.selectedObjectsMode,
            this.widgetProps.mapObjectsSelected.length,
            this.widgetProps.mapObjects.length,
            this.widgetProps.selectedObjects.length,
            this.widgetProps.foundObjectsNumber);

    }

    /**
     * Рисовать на карте выбранные объекты( множественный выбор )
     * @private
     * @method setActiveOrSelectedObjects
     */
    private setActiveOrSelectedObjects() {
        const selectedObjectsList: MapObject[] = [];
        let mapObjects: (MapObject | null)[] = this.selectedObjectsMode ? this.widgetProps.mapObjectsSelected : this.widgetProps.mapObjects;
        if (!this.selectedObjectsMode && this.widgetProps.showMapObjectsListType === 'table') {
            mapObjects = this.widgetProps.tableMapObjects;
        }

        mapObjects.forEach(mapObject => {
            if (mapObject !== null && this.widgetProps.selectedObjects.includes(mapObject.id)) {
                if (mapObject.isEmptyClusterObject) {
                    const clusterObjectList = GwtkMapObjectTask.filterByClusterObject(mapObjects, mapObject);
                    clusterObjectList.forEach(currentObject => {
                        currentObject.resetClusterRef();
                        selectedObjectsList.push(currentObject);
                    });
                } else if (!mapObject.isClusterObject) {
                    selectedObjectsList.push(mapObject);
                }
            }
        });

        if (selectedObjectsList.length !== 0) {
            this.map.setServiceObjectsSelection();

            this.map.addSelectedObjects(selectedObjectsList);

            if (!selectedObjectsList[0].hasGeometry()) {
                selectedObjectsList[0].loadGeometry().then(() => {
                    if (selectedObjectsList[0].hasGeometry()) {
                        this.map.setActiveObject(selectedObjectsList[0]);
                    }
                });
            } else {
                this.map.setActiveObject(selectedObjectsList[0]);
            }
            const bounds = selectedObjectsList[0].getBounds().clone();
            for (let i = 1; i < selectedObjectsList.length; i++) {
                const currentBounds = selectedObjectsList[i].getBounds();
                bounds.extend(currentBounds.min);
                bounds.extend(currentBounds.max);
            }

            const mapBbox = this.map.getWindowBounds();
            if (!mapBbox.intersects(bounds)) {
                // переход в центр объекта
                const mapPoint = bounds.getCenter();
                this.map.setMapCenter(mapPoint, true);
                this.map.overlayRefresh();
            }

            if (selectedObjectsList.length === 1 && selectedObjectsList[0].type === MapObjectType.Point) {
                this.map.setZoom(this.pointObjectTargetZoom);
            }
        }
    }

    /**
     * Применить выбранные фильтры
     * @method onFilterApply
     */
    async onFilterApply() {
        if (!this.selectedObjectsMode) {
            // Создать копию критериев
            const criteriaAggregatorCopy = this.originCriteriaAggregator.copy();
            const typeFilter = this.widgetProps.filterManager;

            // Получить список выбранных типов
            const typesList = typeFilter.selectedTypeFilterItems.map(typeFilterItem => typeFilterItem.typeValue);
            // Обновить список критериев для типов
            criteriaAggregatorCopy.removeCriterion(SearchCriterionName.TypeNames);
            if (typesList.length > 0) {
                const typeNamesCriterion = criteriaAggregatorCopy.getTypeNamesSearchCriterion();
                typeNamesCriterion.addValue(typesList.join(','));
            }

            // Получить список выбранных объектов
            const objectsList = typeFilter.selectedObjectFilterItems.map(objectFilter => objectFilter.objectKey);
            // Обновить список критериев для объектов
            criteriaAggregatorCopy.removeCriterion(SearchCriterionName.KeyList);
            if (objectsList.length > 0) {
                const objectsCriterion = criteriaAggregatorCopy.getKeyListSearchCriterion();
                objectsCriterion.addValue(objectsList.join(','));
            }

            // Получить список выбранных локализации
            const localizationsList = typeFilter.selectedLocalizationFilterItems.map(localizationFilter => localizationFilter.localizationDigitalValue);
            // Обновить список критериев для локализации
            criteriaAggregatorCopy.removeCriterion(SearchCriterionName.ObjectLocal);
            if (localizationsList.length > 0) {
                const localizationsCriterion = criteriaAggregatorCopy.getObjectLocalSearchCriterion();
                localizationsCriterion.addValue(localizationsList.join(','));
            }

            // Получить список заполненных семантик
            const semanticsList = typeFilter.selectedSemanticFilterItems.map(semanticFilter => semanticFilter.semanticCriterion);
            // Обновить список критериев для семантик
            criteriaAggregatorCopy.removeCriterion(SearchCriterionName.Semantic);
            if (semanticsList.length > 0) {
                const semanticsCriterion = criteriaAggregatorCopy.getSemanticSearchCriterion();
                for (let i = 0; i < semanticsList.length; i++) {
                    semanticsCriterion.addSemanticCriterion(semanticsList[i]);
                }
                semanticsCriterion.setLogicalDisjunction(semanticsList.length > 1);
            }

            // Отправить запрос для получения отфильтрованного ответа
            this.map.searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

            try {
                const result = await this.map.searchManager.findNext();
                if (result) {
                    this.widgetProps.selectedObjects.splice(0);
                }
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({
                    text: i18n.t('phrases.Map objects') + '',
                    description: gwtkError.message,
                    type: LogEventType.Error
                });
            }
            this.mapWindow.getTaskManager().showObjectPanel();
        }
    }

    /**
     * Удалить примененный фильтр
     * @method onDeleteSelectedFiltersTypes
     * @param selectedFilter {SelectedFilterItem} Фильтр
     */
    onDeleteSelectedFiltersTypes(selectedFilter: SelectedFilterItem) {
        selectedFilter.selected = false;
        this.widgetProps.showProgressBar = true;
        this.onFilterApply().then(() => {
        }).finally(() => {
            this.widgetProps.showProgressBar = false;
        });
    }

    /**
     * Удалить все примененные фильтры
     * @method onClearSelectedFiltersTypes
     */
    onClearSelectedFiltersTypes() {
        this.widgetProps.filterManager.resetSelectedFilters();
        this.widgetProps.showProgressBar = true;
        this.onFilterApply().then(() => {
        }).finally(() => {
            this.widgetProps.showProgressBar = false;
        });
    }

    /**
     * Загрузить все объекты разом
     * Используется для выгрузки данных в CSV
     * @method loadAllObjects
     */
    async loadAllObjects() {
        // Получить критерии
        const criteriaAggregatorCopy = this.map.searchManager.getSearchCriteriaAggregatorCopy();
        // Получить StartIndex и Count из критериев
        const startIndex = criteriaAggregatorCopy.getStartIndexSearchCriterion();
        startIndex.setValue(0);
        const count = criteriaAggregatorCopy.getCountSearchCriterion();
        count.setValue(this.widgetProps.foundObjectsNumber || 0);

        const mapObjects = this.map.searchManager.mapObjects.slice();
        this.map.searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);
        mapObjects.forEach(mapObject => this.map.searchManager.mapObjects.push(mapObject));

        const activeFinder = this.map.searchManager.getFinderCopy();

        try {
            const result = await activeFinder.searchNext();
            if (result) {
                this.widgetProps.stateSearchObject = false;
                return result.mapObjects;
            }
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: i18n.t('phrases.Failed to get data') + '',
                description: gwtkError.message,
                type: LogEventType.Error
            });

            this.widgetProps.stateSearchObject = false;
            return undefined;
        } finally {
            this.map.searchManager.mapObjects.splice(0);
            mapObjects.forEach(mapObject => this.map.searchManager.mapObjects.push(mapObject));
        }
    }

    private getRoute() {
        let routePoints: RoutePoint[] = [];

        let watchUserNumber = BrowserService.watchUserPosition((result) => {
            routePoints.push({
                coordinate: new GeoPoint(result.coords.longitude, result.coords.latitude),
                name: i18n.tc('phrases.My location')
            });

            this.completeRoutePointsAndShowMapRoutePanel(routePoints);

            if (watchUserNumber !== undefined) {
                BrowserService.stopWatchUserPosition(watchUserNumber);
            }
        }, (reason: GeolocationPositionError) => {
            this.map.writeProtocolMessage({ text: reason.message, type: LogEventType.Error });
            const geoPoint = this.map.getCenterGeoPoint();
            routePoints.push({
                coordinate: geoPoint,
                name: i18n.tc('phrases.Map center')
            });

            this.completeRoutePointsAndShowMapRoutePanel(routePoints);

            if (watchUserNumber !== undefined) {
                BrowserService.stopWatchUserPosition(watchUserNumber);
            }
        });
    }

    private completeRoutePointsAndShowMapRoutePanel(routePoints: RoutePoint[]) {
        const currentMapObject = this.widgetProps.currentMapObject;
        if (!currentMapObject) {
            return;
        }

        const objectCenter = currentMapObject.getCenter();
        let name: string | undefined;
        const semanticObjName = currentMapObject.getSemantic('ObjName');
        if (semanticObjName) {
            name = semanticObjName.value as string;
        }
        if (name === undefined) {
            name = i18n.tc('phrases.Map point');
            const objectName = currentMapObject.objectName;
            const layerName = currentMapObject.layerName;
            if (objectName) {
                name = objectName;
            } else if (layerName) {
                name = layerName;
            }
        }

        routePoints.push({
            coordinate: objectCenter.toGeoPoint()!, name: name
        });

        this.mapWindow.getTaskManager().showMapRoutePanel(routePoints);
    }

    private removeDocument(path: string, key: string) {
        const mapObject = this.widgetProps.currentMapObject;
        if (mapObject) {
            mapObject.removeDocument(path, key).catch(e => {
                this.map.writeProtocolMessage({
                    type: LogEventType.Error,
                    description: e,
                    text: i18n.t('phrases.Image deletion error').toString()
                });
            }).finally(() => {
                mapObject.objectImages.splice(0);
                this.fillObjectImages(mapObject);
            });
        }
    }

    private downloadImage(imagePath: string) {
        const mapObject = this.widgetProps.currentMapObject;
        if (mapObject) {
            const image = mapObject.objectImages.find(item => item.path === imagePath);
            if (image) {
                try {
                    BrowserService.downloadLink(image.src, imagePath);
                } catch(error) {
                    this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
                }
            }
        }
    }

    /**
     * Загрузить изображение на сервер
     * @private
     * @method uploadFile
     * @property semantic {MapObjectSemanticContent}
     * @property mapObject {MapObject}
     * @property file {File}
     */
    private uploadImage(mapObject: MapObjectContent, fileList: Iterable<File>) {

        const layerId = mapObject.mapId;
        if (layerId) {
            const id = mapObject.gmlId;
            const url = mapObject.vectorLayer.serviceUrl;

            for (const file of fileList) {
                const fileName = file.name;

                const requestService = RequestServices.retrieveOrCreate({ url }, ServiceType.REST);
                const uploadObjectImage = requestService.appendFileToObject.bind(requestService);

                const cancellableRequest = RequestService.sendCancellableRequest(uploadObjectImage, {
                    LAYER: layerId,
                    ID: id,
                    FILEPATH: fileName,
                    OUTTYPE: 'JSON',
                    file
                }, {
                    onUploadProgress: (progressEvent) => {
                        const objectRequestQueue = this.widgetProps.requestQueue.find(requestQueueItem => requestQueueItem.id === id);
                        if (objectRequestQueue) {
                            const item = objectRequestQueue.requestItems.find(item => item.fileName === fileName);
                            if (item && progressEvent.total) {
                                item.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            }
                        }
                    }
                });

                let objectRequestQueue = this.widgetProps.requestQueue.find(requestQueueItem => requestQueueItem.id === id);
                if (!objectRequestQueue) {
                    objectRequestQueue = { id, requestItems: [] };
                    this.widgetProps.requestQueue.push(objectRequestQueue);
                }

                const requestItem = {
                    cancellableRequest,
                    fileName,
                    src: '',
                    progress: 0
                };
                objectRequestQueue.requestItems.push(requestItem);

                const reader = new FileReader();
                reader.onload = (e) => {
                    requestItem.src = e.target?.result as string;
                };
                reader.readAsDataURL(file);


                cancellableRequest.promise.finally(() => {
                    const objectRequestQueue = this.widgetProps.requestQueue.find(requestQueueItem => requestQueueItem.id === id);
                    if (objectRequestQueue) {
                        const itemIndex = objectRequestQueue.requestItems.findIndex(item => item.fileName === fileName);
                        if (itemIndex !== -1) {
                            objectRequestQueue.requestItems.splice(itemIndex, 1);
                        }
                        if (objectRequestQueue.requestItems.length === 0) {
                            mapObject.reload().then(() => mapObject.reloadImages());
                        }
                    }
                });
            }
        }
    }


    private updateDocument(imagePath: string, key: string, fileList: Iterable<File>) {
        const mapObject = this.widgetProps.currentMapObject;
        if (mapObject) {

            const layerId = mapObject.mapId;
            if (layerId) {
                this.widgetProps.showGallery = true;
                const id = mapObject.gmlId;
                for (const file of fileList) {
                    const fileName = file.name;
                    let cancellableRequest;
                    const url = mapObject.vectorLayer.serviceUrl;
                    const requestService = RequestServices.retrieveOrCreate({ url }, ServiceType.REST);
                    const uploadObjectImage = requestService.appendFileToObject.bind(requestService);
                    cancellableRequest = RequestService.sendCancellableRequest(uploadObjectImage, {
                        LAYER: layerId,
                        ID: id,
                        FILEPATH: fileName,
                        OUTTYPE: 'JSON',
                        NOTSAVEFILETOSEMANTIC: '1',
                        file
                    }, {
                        onUploadProgress: (progressEvent) => {
                            const objectRequestQueue = this.widgetProps.requestQueue.find(requestQueueItem => requestQueueItem.id === id);
                            if (objectRequestQueue) {
                                const item = objectRequestQueue.requestItems.find(item => item.fileName === fileName);
                                if (item && progressEvent.total) {
                                    item.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                                }
                            }
                        }
                    });

                    let objectRequestQueue = this.widgetProps.requestQueue.find(requestQueueItem => requestQueueItem.id === id);
                    if (!objectRequestQueue) {
                        objectRequestQueue = { id, requestItems: [] };
                        this.widgetProps.requestQueue.push(objectRequestQueue);
                    }

                    const requestItem = {
                        cancellableRequest,
                        fileName,
                        src: '',
                        progress: 0
                    };
                    objectRequestQueue.requestItems.push(requestItem);

                    cancellableRequest.promise.then(async (result) => {
                        if (result.data) {
                            const responseData = result.data;
                            if (responseData.restmethod) {
                                const params = responseData.restmethod;
                                if (params.outparams && params.outparams.length > 0) {
                                    const outParam = params.outparams[0];
                                    if (outParam.value) {
                                        const filePath = outParam.value;
                                        // Обновить значения семантики
                                        const result = mapObject.getRepeatableSemantics(key).find(item => item.value === imagePath);
                                        if (result) {
                                            const existSemanticIndex = mapObject.getRepeatableSemantics(result.key).findIndex(sem => sem.value === imagePath);
                                            if (existSemanticIndex !== -1) {
                                                const cacheIndex = mapObject.objectImages.findIndex(item => item.path === filePath);
                                                if (cacheIndex !== -1) {
                                                    mapObject.objectImages.splice(cacheIndex, 1);
                                                }
                                                mapObject.updateRepeatableSemantic(result.key, existSemanticIndex, filePath);
                                            }
                                        }
                                        await mapObject.commit();

                                        this.fillObjectImages(mapObject);
                                    }
                                }
                            }
                        }
                    });

                    cancellableRequest.promise.finally(() => {
                        const objectRequestQueue = this.widgetProps.requestQueue.find(requestQueueItem => requestQueueItem.id === id);
                        if (objectRequestQueue) {
                            const itemIndex = objectRequestQueue.requestItems.findIndex(item => item.fileName === fileName);
                            if (itemIndex !== -1) {
                                objectRequestQueue.requestItems.splice(itemIndex, 1);
                            }
                        }
                    });
                }
            }
        }
    }

    /**
     * Загрузить файл на сервер
     * @private
     * @method uploadFile
     * @property semantic {MapObjectSemanticContent}
     * @property mapObjectContent {MapObjectContent}
     * @property file {File}
     */
    private uploadFile(semantic: MapObjectSemanticContent, mapObjectContent: MapObjectContent, fileList: Iterable<File>) {

        const layerId = mapObjectContent.mapId;
        if (layerId) {
            const id = mapObjectContent.gmlId;
            const url = mapObjectContent.vectorLayer.serviceUrl;

            for (const file of fileList) {
                const fileName = file.name;

                const requestService = RequestServices.retrieveOrCreate({ url }, ServiceType.REST);
                const uploadSemanticFile = requestService.appendFileToObject.bind(requestService);

                const cancellableRequest = RequestService.sendCancellableRequest(uploadSemanticFile, {
                    LAYER: layerId,
                    ID: id,
                    FILEPATH: fileName,
                    NOTSAVEFILETOSEMANTIC: '1',
                    OUTTYPE: 'JSON',
                    file
                });

                cancellableRequest.promise.then((result) => {
                    if (result.data) {
                        const responseData = result.data;
                        if (responseData.restmethod) {
                            const params = responseData.restmethod;
                            if (params.outparams && params.outparams.length > 0) {
                                const outParam = params.outparams[0];
                                if (outParam.value) {
                                    const filePath = outParam.value;
                                    // Обновить значения семантики
                                    const { key, name } = semantic;
                                    const code = isNaN(semantic.code) ? undefined : semantic.code + '';
                                    const existSemanticIndex = mapObjectContent.getRepeatableSemantics(key).findIndex(sem => sem.key === key && sem.name === name && sem.code === code);
                                    if (existSemanticIndex !== -1) {
                                        const path = mapObjectContent.getRepeatableSemantics(key)[existSemanticIndex].value;
                                        const cacheIndex = mapObjectContent.imageCache.findIndex(item => item.path === path);
                                        if (cacheIndex !== -1) {
                                            mapObjectContent.imageCache.splice(cacheIndex, 1);
                                        }
                                        mapObjectContent.updateRepeatableSemantic(key, existSemanticIndex, filePath);
                                    } else {
                                        mapObjectContent.addRepeatableSemantic({ key, name, code, value: filePath });
                                    }
                                    mapObjectContent.fillObjectAllSemanticList();
                                }
                            }
                        }
                    }
                }).catch((error) => {
                    this.map.writeProtocolMessage({
                        text: i18n.t('phrases.Map objects') + '',
                        description: error,
                        type: LogEventType.Error
                    });
                }).finally(() => {
                    this.widgetProps.showSemanticFileUploadOverlay = false;
                    this.abortUploadFile = undefined;
                });
                this.widgetProps.showSemanticFileUploadOverlay = true;
                this.abortUploadFile = () => {
                    cancellableRequest.abortXhr();
                    this.widgetProps.showSemanticFileUploadOverlay = false;
                    this.abortUploadFile = undefined;
                };
            }
        }
    }

    /**
     * Показать точку геометрии объекта на карте
     * @method showGeometricObjectPointInMap
     * @param point {MapPoint | null} координаты точки
     */
    private showGeometricObjectPointInMap(point: MapPoint | null) {
        if (this.pointObject.getPointList().length > 0) {
            this.pointObject.removeAllPoints();
        }

        if (point !== null) {
            this.pointObject.addPoint(point);
            this.pointObject.addStyle(new Style({
                marker: new MarkerStyle({
                    markerId: DEFAULT_SVG_MARKER_ID
                })
            }));

            const mapBbox = this.map.getWindowBounds();
            if (!mapBbox.contains(point)) {
                // переход в точку
                this.map.setMapCenter(point, true);
                this.map.overlayRefresh();
            }
        }
    }

    /**
     * Список выбранных объектов
     * @property
     * @returns { MapObject[] } - список выбранных объектов
     */
    private get selectedObjectsList() {

        const mapObjects = this.selectedObjectsMode ? this.widgetProps.mapObjectsSelected : this.widgetProps.mapObjects;

        const objectsList: MapObject[] = mapObjects.filter((mapObject: MapObject) => {
            return this.widgetProps.selectedObjects.indexOf(mapObject.id) !== -1;
        });
        if (objectsList.length === 0) {
            const text: string = i18n.t('phrases.No object has been selected') + '!';
            this.mapWindow.addSnackBarMessage(text);
        }
        return objectsList;
    }


    /**
     * Экспортировать данные в CSV
     * @param flagAllObject - true - выгрузить все объекты, false - только загруженные
     * @param objectList: MapObject[] - выгрузить список объектов
     */
    async exportToCSV(flagAllObject: boolean, objectList?: MapObject[]) {
        let resulMapObjectList: readonly MapObject[] | undefined;
        if (objectList) {
            if (objectList.length > 0) {
                resulMapObjectList = objectList;
            }
        } else {
            const mapObjects = this.selectedObjectsMode ? this.widgetProps.mapObjectsSelected : this.widgetProps.mapObjects;
            if (flagAllObject && this.widgetProps.foundObjectsNumber && (this.widgetProps.foundObjectsNumber > mapObjects.length)) {
                resulMapObjectList = await this.loadAllObjects();
            } else {
                resulMapObjectList = mapObjects;
            }
        }
        if (resulMapObjectList) {
            const headersList = this.getHeadersList(resulMapObjectList);
            // Сформировать csv файл
            const blob = Utils.mapObjectsToCsv(resulMapObjectList, headersList);
            try {
                BrowserService.downloadContent(blob, 'objectsList.csv');
            } catch (error) {
                this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
            }
        }
    }

    async getPrintHtmlContent(): Promise<HTMLDivElement> {
        const mainDiv = document.createElement('div');
        mainDiv.classList.add('container');
        let mapObjectList;
        if (!this.highlightedObject) {
            mapObjectList = this.selectedObjectsMode ? this.widgetProps.mapObjectsSelected : this.widgetProps.mapObjects;
        } else {
            mapObjectList = [this.highlightedObject];
        }
        if (mapObjectList.length === 0) {
            return mainDiv;
        }
        const shortInfo: boolean = mapObjectList.length > 1;
        for (const mapObject of mapObjectList) {
            const mapObjectContent = new MapObjectContent(mapObject);
            const htmlContent = await mapObjectContent.toHtmlTable(shortInfo);
            if (htmlContent) {
                mainDiv.appendChild(htmlContent);
                let hr = document.createElement('hr');
                hr.classList.add('mt-4');
                hr.classList.add('mb-2');
                hr.classList.add('v-divider');
                mainDiv.appendChild(hr);
            }
        }
        return mainDiv;
    }

    getPrintTextContent() {
        let filedata = '';
        let mapObjectList;
        if (!this.highlightedObject) {
            mapObjectList = this.selectedObjectsMode ? this.widgetProps.mapObjectsSelected : this.widgetProps.mapObjects;
        } else {
            mapObjectList = [this.highlightedObject];
        }
        if (mapObjectList.length === 0) {
            return filedata;
        }
        for (const mapObject of mapObjectList) {
            const mapObjectContent = new MapObjectContent(mapObject);
            const mapObjectText = mapObjectContent.toTextString();
            if (mapObjectText.length > 0) {
                filedata += mapObjectText;
            }
        }
        return filedata;
    }

    get isSelectedObjectsPagination(): boolean {
        if (this.widgetProps.mapObjectsState === MapObjectPanelState.showObjects && this.map.getSelectedObjects().length > 0) {
            const searchObjects = this.map.searchManager.mapObjects;
            let pageFlag = true;
            for (let numberObject = 0; numberObject < searchObjects.length; numberObject++) {
                const currentObject = searchObjects[numberObject];
                pageFlag = !!this.map.getSelectedObjectById(currentObject.gmlId, currentObject.vectorLayer.serviceUrl, currentObject.vectorLayer.idLayer);
                if (!pageFlag) {
                    break;
                }
            }
            return this.map.serviceObjectsSelection() && pageFlag;
        }
        return false;
    }

    /**
     * Вписать карту в габариты кластера с повторным запросом объектов
     * @private
     * @async
     * @method fitMapToCluster
     * @param emptyClusterObject {MapObject} - обобщающий объект кластера, содержащий идентификатор кластера
     */
    private async fitMapToCluster(emptyClusterObject: MapObject): Promise<void> {
        if (emptyClusterObject.isEmptyClusterObject) {
            this.map.fitBounds(emptyClusterObject.getBounds());
            // Создать копию критериев
            const criteriaAggregatorCopy = this.originCriteriaAggregator.copy();

            // Обновить список критериев для масштаба
            const scale = this.map.getZoomScale(this.map.getZoom());
            if (scale) {
                const scaleCriterion = criteriaAggregatorCopy.getObjectScaleSearchCriterion();
                scaleCriterion.setValue(scale);
                criteriaAggregatorCopy.setObjectScaleSearchCriterion(scaleCriterion);
            }

            // Обновить список критериев для BBOX
            const bboxCriterion = criteriaAggregatorCopy.getBboxSearchCriterion();
            bboxCriterion.setValue(emptyClusterObject.getBounds());
            criteriaAggregatorCopy.setBboxSearchCriterion(bboxCriterion);


            // Удалить список критериев для Идентификаторов объектов
            criteriaAggregatorCopy.removeCriterion(SearchCriterionName.IdList);

            // Удалить список критериев для поиска в точке
            criteriaAggregatorCopy.removeCriterion(SearchCriterionName.FindInPoint);

            this.map.searchManager.stopSearch();
            // Отправить запрос для получения отфильтрованного ответа
            this.map.searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

            try {
                await this.map.searchManager.findNext();
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({
                    description: gwtkError.message,
                    type: LogEventType.Error,
                    text: i18n.t('phrases.Objects request error') + ''
                });
            }
        }
    }

    /**
     * Отобразить объекты из кластера
     * @private
     * @async
     * @method viewClusterObjectList
     * @param emptyClusterObject {MapObject} - обобщающий объект кластера, содержащий идентификатор кластера
     */
    private viewClusterObjectList(emptyClusterObject: MapObject): void {
        if (emptyClusterObject.isEmptyClusterObject) {
            const clusterObjects: MapObject[] = [];

            const mapObjects = this.selectedObjectsMode ? this.widgetProps.mapObjectsSelected : this.widgetProps.mapObjects;
            const clusterObjectList = GwtkMapObjectTask.filterByClusterObject(mapObjects, emptyClusterObject);
            clusterObjectList.forEach(currentObject => {
                currentObject.resetClusterRef();
                clusterObjects.push(currentObject);
            });

            if (clusterObjects.length > 0) {
                mapObjects.splice(0);

                window.setTimeout(() => {
                    clusterObjects.forEach(mapObject => mapObjects.push(mapObject));
                    this.updateMapObjectCount(clusterObjects.length);
                }, 3);
            }
        }
    }

    /**
     * Заполнить список объектов кластера
     * @private
     * @method setClusterMapObjectsList
     * @param mapObjects {MapObject[]} - объекты кластера, обобщающий объект кластера - с индексом 0,
     */
    private setClusterMapObjectsList(mapObjects: MapObject[]): void {
        if (mapObjects.length < 2 || !mapObjects[0].isEmptyClusterObject) {
            return;
        }

        const currentMapObjects = GwtkMapObjectTask.filterByClusterObject(mapObjects, mapObjects[0]);

        const mapObjectList = this.selectedObjectsMode ? this.widgetProps.mapObjectsSelected : this.widgetProps.mapObjects;

        mapObjectList.splice(0);
        currentMapObjects.forEach(mapObject => mapObjectList.push(mapObject));
    }

    /**
     * Редактирования стилей графического объекта слоя
     * @private
     * @async
     * @method editMapObjectStyles
     */
    private async editMapObjectStyles(): Promise<void> {
        try {
            const currentMapObject = this.widgetProps.currentMapObject;
            if (currentMapObject) {
                const objectLocale = await currentMapObject.getLocal();
                const sld: CommonServiceSVG[] = [];
                const currentStyles = currentMapObject.styles;
                if (currentStyles) {
                    currentStyles.forEach(style => sld.push(...style.toServiceSVG()));
                } else {
                    let type: CommonServiceSVG['type'] = 'LineSymbolizer';
                    switch (objectLocale) {
                        case LOCALE.Line:
                            type = 'LineSymbolizer';
                            break;
                        case LOCALE.Plane:
                            type = 'PolygonSymbolizer';
                            break;
                        case LOCALE.Point:
                            type = 'PointSymbolizer';
                            break;
                        case LOCALE.Text:
                            type = 'TextSymbolizer';
                            break;
                    }
                    sld.push({ type });
                }

                const id = currentMapObject.vectorLayer.id;
                const result = await this.mapWindow.getTaskManager().callLegend(id, sld, objectLocale)  as EditorLayoutDescription;

                if (result) {
                    if (result.objectDescription.sld) {
                        currentMapObject.clearStyles();
                        result.objectDescription.sld.forEach(svgItem => {
                            currentMapObject.addStyle(Style.fromServiceSVG(svgItem));
                        });
                        await this.updatePreviewImage();
                    }
                }
            }
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                description: gwtkError.message,
                type: LogEventType.Error,
                text: i18n.t('phrases.Map objects') + ''
            });
        } finally {
            this.setState(SET_EDITOR_TAB_OPTIONS, 'tab_edit_sld');
        }
    }

    private async updatePreviewImage(): Promise<void> {
        const currentMapObject = this.widgetProps.currentMapObject;
        if (currentMapObject) {
            const objectLocale = await currentMapObject.getLocal();
            const styles = currentMapObject.styles;
            if (styles) {
                this.widgetProps.previewImageSrc = await BrowserService.svgToBase64(BrowserService.stylesToSvgElement(styles, objectLocale));
            } else {
                this.widgetProps.previewImageSrc = '';
            }
        }
    }

    /**
     * Удаление стилей графического объекта слоя
     * @private
     * @async
     * @method removeMapObjectStyles
     */
    private removeMapObjectStyles(): void {
        const currentMapObject = this.widgetProps.currentMapObject;
        if (currentMapObject) {
            currentMapObject.clearStyles();
            this.widgetProps.previewImageSrc = '';
        }
    }

    /**
     * Выделить все объекты в рисунке карты
     * @private
     * @async
     * @method paintAllSelectedMapObjects
     */
    private paintAllSelectedMapObjects(): void {
        this.mapWindow.getTaskManager().showOverlayPanel();
        this.loadAllObjects().then(result => {
            if (result) {

                const selectedObjectsList: MapObject[] = [];
                result.forEach(mapObject => {
                    if (!mapObject.isEmptyClusterObject) {
                        mapObject.resetClusterRef();
                        selectedObjectsList.push(mapObject);
                    }
                });

                this.map.addSelectedObjects(selectedObjectsList);
                this.map.searchManager.mapObjects.splice(0);
                this.mapWindow.getTaskManager().removeOverlayPanel();
                this.mapWindow.addSnackBarMessage(i18n.t('phrases.Highlighted objects') + ': ' + this.map.getSelectedObjectsCount());
                // this.mapWindow.getTaskManager().onObjectSelectionChanged();
            }
        });
        this.mapWindow.getTaskManager().detachTask(this.id);
    }

    /**
     * Обновить количество объектов для таблицы
     * @private
     * @method updateTableMapObjectsList
     * @param value {number} Количество найденных объектов
     */
    private updateTableMapObjectsList(value: number | null) {
        if (value === null) {
            this.widgetProps.tableMapObjects.splice(0);
        } else {
            if (this.widgetProps.tableMapObjects.length !== value) {
                this.widgetProps.tableMapObjects.splice(0);
                this.widgetProps.tableMapObjects = Array(value).fill(null);
            }
            const mapObjects = this.selectedObjectsMode ? this.widgetProps.mapObjectsSelected : this.widgetProps.mapObjects;
            mapObjects.forEach((mapObject, index) => {
                if (this.widgetProps.tableMapObjects[index] === null) {
                    this.widgetProps.tableMapObjects[index] = mapObject;
                }
            });
        }
    }


    /**
     * Получить содержимое таблицы
     * @private
     * @method getTableData
     */
    private getTableData() {
        this.widgetProps.tableParams.recordsOnPage.page = 1;
        this.widgetProps.tableParams.tableAllHeaders.splice(0);
        if (this.map.searchManager.responseStatistic) {
            this.widgetProps.filterManager.fromStatistics(this.map.searchManager.responseStatistic, this.map.tiles.getSelectableLayersArray());
        } else {
            this.widgetProps.filterManager.clear();
        }
        this.widgetProps.filterManager.refreshAppliedFilterItems();
        this.widgetProps.tableParams.tableAllHeaders.push(...this.defaultTableHeader);
        this.widgetProps.filterManager.semanticFilters.forEach((semantic: SemanticFilterItem) => {
            this.widgetProps.tableParams.tableAllHeaders.push({
                text: semantic.semanticName,
                value: semantic.semanticValue,
                align: 'center',
                sortable: true,
                filterable: true,
                visibility: true,
                empty: false
            });
        });

        this.createOrUpdateTableHeadersList();
        this.createOrUpdateTableRowsList();
        this.toggleTableEmptyFields();
    }

    /**
     * Создание и обновление видимых столбцов таблицы
     * @private
     * @method createOrUpdateTableHeadersList
     */
    private createOrUpdateTableHeadersList() {
        this.widgetProps.tableParams.tableHeaders.splice(0);
        this.widgetProps.tableParams.tableAllHeaders.forEach((headerItem: TableHeader) => {
            if (headerItem.visibility) {
                this.widgetProps.tableParams.tableHeaders.push(headerItem);
            }
        });
    }

    /**
     * Создание и обновление строк таблицы
     * @private
     * @method createOrUpdateTableRowsList
     */
    private createOrUpdateTableRowsList(mapObjectsFiltered?: MapObject[]) {
        this.widgetProps.tableParams.tableBody.splice(0);
        let tableHeadersKeys: string[] = [];
        this.widgetProps.tableParams.tableHeaders.forEach((header: TableHeader) => {
            tableHeadersKeys.push(header.value);
        });

        const mapObjects = mapObjectsFiltered ? mapObjectsFiltered : this.widgetProps.tableMapObjects;

        mapObjects.forEach((mapObject, index) => {
            if (mapObject !== null && !mapObject.isClusterObject) {
                let tableBodyItem: SimpleJson = {};
                let mapObjectContent = new MapObjectContent(mapObject);
                tableHeadersKeys.forEach((headerKey: string) => {
                    switch (headerKey) {
                        case 'showMapObjectInMap':
                            tableBodyItem['showMapObjectInMap'] = mapObject.id;
                            break;
                        case 'showMapObjectInfo':
                            tableBodyItem['showMapObjectInfo'] = '-';
                            break;
                        case 'mapObjectName':
                            tableBodyItem['mapObjectName'] = mapObjectContent.objectName || '-';
                            break;
                        case 'mapObjectSheetName':
                            tableBodyItem['mapObjectSheetName'] = mapObjectContent.sheetName || '-';
                            break;
                        case 'mapObjectNumber':
                            let objectNumberString;
                            if (mapObjectContent.showObjectNumber) {
                                objectNumberString = mapObjectContent.objectNumber.toString(10);
                                if (mapObjectContent.isEmptyClusterObject) {
                                    const objectCount = GwtkMapObjectTask.filterByClusterObject(mapObjects, mapObject).length;
                                    objectNumberString = `${i18n.t('phrases.Cluster number')} ${objectNumberString} (${objectCount})`;
                                }
                            } else {
                                objectNumberString = '-';
                            }
                            tableBodyItem['mapObjectNumber'] = objectNumberString;
                            break;
                        case 'mapObjectLayerName':
                            tableBodyItem['mapObjectLayerName'] = mapObjectContent.layerName ? mapObjectContent.layerName : '-';
                            break;
                        case 'mapObjectPerimeter':
                            tableBodyItem['mapObjectPerimeter'] = mapObjectContent.showObjectPerimeter ? mapObjectContent.objectPerimeterString : '-';
                            break;
                        case 'mapObjectArea':
                            tableBodyItem['mapObjectArea'] = mapObjectContent.showObjectArea ? mapObjectContent.objectAreaString : '-';
                            break;
                        default:
                            let semanticValue = mapObjectContent.getSemanticValue(headerKey);
                            if (semanticValue) {
                                tableBodyItem[headerKey] = semanticValue;
                            } else {
                                tableBodyItem[headerKey] = '-';
                            }
                            break;
                    }
                });
                this.widgetProps.tableParams.tableBody.push(tableBodyItem);
            } else {
                if (mapObject === null) {
                    let tableBodyItem: SimpleJson = {};
                    tableHeadersKeys.forEach(headerKey => {
                        switch (headerKey) {
                            case 'showMapObjectInMap':
                                tableBodyItem[headerKey] = 'nullId_' + index;
                                break;
                            default:
                                tableBodyItem[headerKey] = '-';
                                break;
                        }
                    });
                    this.widgetProps.tableParams.tableBody.push(tableBodyItem);
                }
            }
        });
    }

    /**
     * Скрыть или показать столбцы таблицы которые пустые
     * @private
     * @method toggleTableEmptyFields
     */
    private toggleTableEmptyFields() {
        if (this.widgetProps.tableParams.showNotEmptyFields) {
            this.widgetProps.tableParams.tableAllHeaders.forEach((tableHeader: TableHeader, index: number) => {
                if (index > 4) {
                    let isEmpty = this.widgetProps.tableParams.tableBody.find((bodyItem) => {
                        return bodyItem[tableHeader.value] != '-';
                    });
                    tableHeader.visibility = typeof isEmpty !== 'undefined';
                    tableHeader.empty = !(typeof isEmpty !== 'undefined');
                }
            });
        } else {
            this.widgetProps.tableParams.tableAllHeaders.forEach((tableHeader: TableHeader) => {
                tableHeader.visibility = true;
                tableHeader.empty = false;
            });
        }
        this.createOrUpdateTableHeadersList();
    }

    /**
     * Скрыть или показать столбцы таблицы по выбору пользователя
     * @private
     * @method onSelectTableFields
     * @param fieldsList {String[]} - Список отображаемых столбцов
     */
    private onSelectTableFields(fieldsList: string[]) {
        this.widgetProps.tableParams.tableAllHeaders.forEach((header: TableHeader) => {
            if (header.empty === false && (header.value !== 'showMapObjectInMap' && header.value !== 'showMapObjectInfo')) {
                let index = fieldsList.indexOf(header.value);

                header.visibility = index !== -1;
            }
        });

        this.createOrUpdateTableHeadersList();
    }

    /**
     * Получить количество объектов без учета кластера
     * @private
     * @method mapObjectsLength
     */
    private mapObjectsLength(): number {
        let length = 0;
        const mapObjects = this.selectedObjectsMode ? this.widgetProps.mapObjectsSelected : this.widgetProps.mapObjects;
        if (mapObjects.length > 0) {
            mapObjects.forEach(object => {
                if (!object.isEmptyClusterObject) {
                    length += 1;
                }
            });
        }

        if (!this.selectedObjectsMode && this.widgetProps.foundObjectsNumber) {
            if (length > this.widgetProps.foundObjectsNumber) {
                length = this.widgetProps.foundObjectsNumber;
            }
        }
        return length;
    }


    private static filterByClusterObject(mapObjects: (MapObject | null)[], clusterObject: MapObject): MapObject[] {
        const result: MapObject[] = [];
        if (clusterObject.isEmptyClusterObject) {
            const { mapId, clusterId } = clusterObject;

            mapObjects.forEach(currentObject => {
                if (currentObject !== null &&
                    currentObject.isClusterObject
                    && currentObject.clusterIdRef === clusterId
                    && currentObject.mapId === mapId
                ) {
                    result.push(currentObject);
                }
            });
        }
        return result;
    }

    /**
     * Формирует список объектов карты
     * @private
     * @param flagAllObject - true - выгрузить все объекты, false - только загруженные
     * @param objectList: MapObject[] - список объектов карты
     */
    private async getResulMapObjectList(flagAllObject: boolean, objectList?: MapObject[]) {
        if (objectList && objectList.length === 0) {
            return;
        } else if (objectList && objectList.length > 0) {
            return objectList;
        } else if (flagAllObject && this.widgetProps.foundObjectsNumber && (this.widgetProps.foundObjectsNumber > this.widgetProps.mapObjects.length)) {
            return await this.loadAllObjects();
        } else {
            return this.selectedObjectsMode ? this.widgetProps.mapObjectsSelected : this.widgetProps.mapObjects;
        }
    }

    /**
     * Формирует заголовки для таблицы экспортируемых объектов
     * @private
     * @method getHeadersList
     * @param objectList: MapObject[] - список объектов карты
     * @return {ExportToCsvHeader}
     */
    private getHeadersList(objectList: readonly MapObject[]) {
        //Все поля объекта со всеми семантиками
        const headersList: ExportToCsvHeader = this.map.generateHeadersListForCsv(objectList);
        // Массив отображаемых полей
        const headersListSorted: ExportToCsvHeader = [];
        //Если в настройке отображаемых полей сделаны изменения
        headersList.forEach(header => {
            if (this.widgetProps.tableParams.tableHeaders.find(tableHeader => tableHeader.text === header.value)) {
                headersListSorted.push(header);
            }
        });
        GwtkMapObjectTask.addUnitHeaders(headersListSorted);
        return headersListSorted;
    }

    /**
     * Копирует в буфер обмена список объектов в виде таблицы
     * @async
     * @method copyToClipBoardObjectList
     * @param flagAllObject {true} - выгрузить все объекты, false - только загруженные
     * @param objectList {MapObject[]} - список объектов
     */
    async copyToClipBoardObjectList(flagAllObject: boolean, objectList?: MapObject[]) {
        const resulMapObjectList = await this.getResulMapObjectList(flagAllObject, objectList);
        if (resulMapObjectList) {
            const headersList = this.getHeadersList(resulMapObjectList);
            const dataRowsList = Utils.mapObjectsToCellRows(resulMapObjectList, headersList);
            const table = Utils.createHtmlTable(dataRowsList);
            BrowserService.copyTableToClipBoard(table).then(() => {
                this.mapWindow.addSnackBarMessage(i18n.tc('exportdata.The table has been copied'));
            }).catch(() => {
                this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Copy failed'));
            });
        }
    }

    /**
     * Сохраняет в файл Excel таблицу выделенных объектов
     * @async
     * @method exportToXLSX
     * @param flagAllObject - true - выгрузить все объекты, false - только загруженные
     * @param objectList: MapObject[] - список объектов
     */
    async exportToXLSX(flagAllObject: boolean, objectList?: MapObject[]) {
        const resulMapObjectList = await this.getResulMapObjectList(flagAllObject, objectList);
        if (resulMapObjectList) {
            const headersList = this.getHeadersList(resulMapObjectList);
            const dataRowsList = Utils.mapObjectsToCellRows(resulMapObjectList, headersList);
            const table = Utils.createHtmlTable(dataRowsList);
            BrowserService.saveTableToXLSX(table);
        }
    }
    /**
     * Сохраняет в файл GeoJson выделенные объекты
     * @async
     * @method exportToGeoJson
     * @param flagAllObject - true - выгрузить все объекты, false - только загруженные
     * @param objectList: MapObject[] - список объектовblob
     */
    async exportToGeoJson(flagAllObject: boolean, objectList?: MapObject[]) {
        const resulMapObjectList = await this.getResulMapObjectList(flagAllObject, objectList);
        if (resulMapObjectList) {

            const crs: CRS = {
                type: 'name',
                properties: {
                    name: this.map.getCrsString(),
                }
            };
            const json: GeoJsonType = {
                type: 'FeatureCollection',
                bbox: [...this.map.getBbox().getMinimum(),...this.map.getBbox().getMinimum() ],
                crs: crs,
                features: [],
            };
            const exportJson = new GeoJSON(json);

            const addFeaturePromises = resulMapObjectList.map(async (resulMapObjectItem) => {
                await resulMapObjectItem.loadGeometry();
                exportJson.addFeature(resulMapObjectItem.toJSON());
            });
            await Promise.all(addFeaturePromises);
            const blob = new Blob( [exportJson.toString()], { type: 'application/json' } );
            try {
                BrowserService.downloadContent(blob, 'objectsList.json');
            } catch (error) {
                this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
            }
        }
    }

    /**
     * Функция для поиска объектов карты по старт индексу
     * @private
     * @method findByStartIndex
     * @param startIndex {number}
     * @param count {number}
     */
    private async findByStartIndex(startIndex: number, count: number) {
        this.widgetProps.tableParams.recordsOnPage.tableLoading = true;
        const activeFinder = this.map.searchManager.getFinderCopy();
        if (activeFinder) {
            activeFinder.setCount(count);
            activeFinder.setStartIndex(startIndex);

            const result = await activeFinder.searchNext();
            if (result) {
                if (result.mapObjects.length > 0) {
                    let mapObjectIndex = startIndex;
                    result.mapObjects.forEach(mapObject => {
                        this.widgetProps.tableMapObjects[mapObjectIndex] = mapObject;
                        mapObjectIndex = mapObjectIndex + 1;
                    });
                    if (result.foundObjectCount) {
                        this.createOrUpdateTableRowsList();
                    }
                }
            }
        }
        this.widgetProps.tableParams.recordsOnPage.tableLoading = false;
    }

    /**
     * Поиск объектов карты по всем параметры которых попадают в текстовый поиск таблицы
     * @private
     * @method findObjectsByTableSearchValue
     * @param value {string}
     */
    private findObjectsByTableSearchValue(value: string) {
        // Создать копию критериев
        const criteriaAggregatorCopy = this.originCriteriaAggregator.copy();
        const stringForSearchInResultCriterion = criteriaAggregatorCopy.getStringForSearchInResultCriterion();

        if (value !== '') {
            stringForSearchInResultCriterion.setValue(value);
            criteriaAggregatorCopy.setStringForSearchInResultCriterion(stringForSearchInResultCriterion);
        } else {
            criteriaAggregatorCopy.removeCriterion(SearchCriterionName.StringForSearchInResult);
        }

        // Отправить запрос для получения отфильтрованного ответа
        this.map.searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

        this.map.searchManager.findNext().then(result => {
            if (result) {
                this.widgetProps.selectedObjects.splice(0);
            }
        }).catch(error => {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: i18n.t('phrases.Map objects') + '',
                description: gwtkError.message,
                type: LogEventType.Error
            });
        }).finally(() => {
            this.mapWindow.getTaskManager().showObjectPanel();
        });
    }

    private static getButtonsExportActions(selectedObjectsMode: boolean,
        mapObjectsSelectedLength: number,
        mapObjectsLength: number,
        selectedObjectsLength: number,
        foundObjectsNumber: number | null) {
        const subItems: { text: string, value: ExportFormat; isWaitingExport: boolean}[] = [];

        subItems.push({
            text: i18n.tc('exportdata.CSV'),
            value: EXPORT_TO_CSV,
            isWaitingExport: false,
        });

        if (BrowserService.isSecureContext) {
            subItems.push({
                text: i18n.tc('exportdata.Table to clipboard'),
                value: EXPORT_TO_CLIPBOARD,
                isWaitingExport: false,
            });
        }

        subItems.push({
            text: i18n.tc('exportdata.XLSX'),
            value: EXPORT_TO_XLSX,
            isWaitingExport: false,
        });
        // subItems.push({
        //     text: i18n.tc('exportdata.GeoJSON'),
        //     value: EXPORT_TO_GEOJSON,
        //     isWaitingExport: false,
        // });
        const buttonsExportAction = [];
        if (!selectedObjectsMode) {
            buttonsExportAction.push({
                title: i18n.tc('exportdata.Export loaded objects') + ` (${mapObjectsLength})`,
                value: EXPORT_LOADED_OBJECTS,
                enabled: true,
                subItems
            });
        }
        buttonsExportAction.push(
            {
                title: i18n.tc('exportdata.Export specified objects') + (selectedObjectsLength > 0 ? ` (${selectedObjectsLength})` : ''),
                value: EXPORT_SELECTED_OBJECTS,
                enabled: false,
                subItems
            },
            {
                title: i18n.tc('exportdata.Export all objects') + (selectedObjectsMode ? ` (${mapObjectsSelectedLength})` : ` (${foundObjectsNumber})`),
                value: EXPORT_ALL_OBJECTS,
                enabled: true,
                subItems
            }
        );
        return buttonsExportAction;
    }

    /**
     * Добавляет заголовок единиц измерения для таблицы экспортируемых объектов
     * @private
     * @static
     * @method addUnitHeaders
     * @param headersList: {ExportToCsvHeader} - список объектов карты
     * @return {ExportToCsvHeader}
     */

    private static addUnitHeaders(headersList: ExportToCsvHeader) {
        const areaIndex = headersList.findIndex(header => header.key === '__objectArea');
        const perimeterIndex = headersList.findIndex(header => header.key === '__objectPerimeter');
        if (areaIndex !== -1) {
            headersList.splice(areaIndex + 1, 0, {
                key: '__measureUnitArea',
                value: i18n.t('mapobjectpanel.Unit') + ''
            });
        }
        if (perimeterIndex !== -1) {
            headersList.splice(perimeterIndex + 1, 0, {
                key: '__measureUnitPerimeter',
                value: i18n.t('mapobjectpanel.Unit') + ''
            });
        }
        return headersList;
    }

    private static getDownloadFileName(value: string) {
        let fileNamePosition = 0;
        if (value.lastIndexOf('#') > -1)
            fileNamePosition = value.lastIndexOf('#') + 1;
        if (value.lastIndexOf('/') > -1)
            fileNamePosition = value.lastIndexOf('/') + 1;

        return value.substring(fileNamePosition);
    }

    private static getFileType(value: string): ViewDocumentMode {
        const extension = value.slice(value.lastIndexOf('.') + 1);
        let result = ViewDocumentMode.file;
        if (IMAGE_EXTENSIONS.includes(extension)) {
            result = ViewDocumentMode.image;
        } else if (extension === 'ifc') {
            result = ViewDocumentMode.bim;
        } else if (VIDEO_EXTENSIONS.includes(extension)) {
            result = ViewDocumentMode.video;
        }
        return result;

    }
}


class SelectedObjectManager {
    constructor(private readonly map: GwtkMap) {
    }

    get mapObjects() {
        return Object.freeze(this.map.getSelectedObjects());
    }

    get responseMapObjectCount() {
        return this.mapObjects.length;
    }
}
