import {GwtkLayerDescription, GwtkOptions, EditorSettings, ForcedParameters} from './Options';
import { AuthParams, SimpleJson, LogMessage, LogRecord, LOCALE, PluginDescription } from '~/types/CommonTypes';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import Layer from '~/maplayers/Layer';
import VectorLayer from '~/maplayers/VectorLayer';
import SearchManager from '~/services/Search/SearchManager';
import GeoPoint from '~/geo/GeoPoint';
import WorkspaceManager, { WorkspaceValues } from '~/utils/WorkspaceManager';
import { OUTTYPE } from '~/services/RequestServices/common/enumerables';
import TaskManager, {TaskDescription} from '~/taskmanager/TaskManager';
import BoundingBox2D from '~/3d/engine/core/boundingvolumes/bbox2d';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';
import { ContentTreeNode, ContentTreeNodeUpdate } from '~/utils/MapTreeJSON';
import { CommonServiceSVG, FeatureProperties, SvgFill, SvgHatch, SvgMarker, SvgStroke, SvgText, GeoJsonType } from '~/utils/GeoJSON';
import SVGrenderer from '~/renderer/SVGrenderer';
import { Vector2D } from '~/3d/engine/core/Types';
import Rectangle from '~/geometry/Rectangle';
import ClassifierCollection from '~/classifier/ClassifierCollection';
import { MapPoint } from '~/geometry/MapPoint';
import { TTranslate } from '~/translate/TTranslate';
import PixelPoint from '~/geometry/PixelPoint';
import { Bounds } from '~/geometry/Bounds';
import { TileMatrix } from '~/translate/matrixes/TileMatrix';
import { MatrixPixelPoint } from '~/geometry/MatrixPixelPoint';
import VirtualFolder from '~/maplayers/VirtualFolder';
import LegendClass from '~/classifier/Legend';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import WmsLayer from '~/maplayers/WmsLayer';
import { PixelBounds } from '~/geometry/PixelBounds';
import CsvEditor from '~/services/Utils/CsvEditor';
import { ImageBase64 } from '~/services/BrowserService/BrowserService';
import Style from '~/style/Style';
import MapObjectSemanticContent from '~/mapobject/utils/MapObjectSemanticContent';


export type EditorLayoutDescription = {
    objectDescription: FeatureProperties;
    icon?: string;
    imageSrc?: string;
    drawingType: LEGEND_OBJECT_DRAWING_TYPE;
    mapObjectType: MapObjectType;
    layerXid: string;
}

export enum LEGEND_OBJECT_DRAWING_TYPE {
    AnyContour = 'AnyContour',
    HorizontalRectangle = 'HorizontalRectangle',
    InclinedRectangle = 'InclinedRectangle',
    ComplexRectangle = 'ComplexRectangle',
    Circle = 'Circle',
    FromFile = 'FromFile',
    ManualInput = 'ManualInput',
    FromObject = 'FromObject'
}

export type DownloadFormat = {
    outType: OUTTYPE;
    contentType?: string;
    ext?: string;
    text?: string;
    enabled?: boolean;
};


/**
 * Тут описываем методы оригинального GWTK
 */
export type GwtkMap = {
    new(divId: string, options: any): GwtkMap;

    layers: Layer[];
    maptools: any[];
    mapcenter: MapPoint;
    options: GwtkOptions & SimpleJson<any>;
    tiles: Tiles;
    virtualfolders: any;
    vectorLayers: VectorLayer[];
    getVectorLayerByxId: (id: string) => VectorLayer | undefined;
    addGraphicLayer: (layerParam: Object, optionsEditing: Object) => Layer | undefined;
    getActiveObject: () => MapObject | undefined;
    setActiveObject: (mapObject: MapObject) => void;
    clearActiveObject: () => void;
    getSelectedObjects: () => MapObject[];
    getSelectedObjectsIterator: () => IterableIterator<MapObject>;
    getSelectedObjectsCount: () => number;
    getEditableLayersOptions: () => EditorSettings | undefined;
    addSelectedObject: (mapObject: MapObject) => void;
    addSelectedObjects: (mapObjects: MapObject[]) => void;
    getSelectedObjectById: (gmlId: string, serviceUrl: string, idLayer: string) => MapObject | undefined;
    removeSelectedObject: (mapObject: MapObject) => void;
    removeSelectedObjects: (mapObjects: MapObject[]) => void;
    clearSelectedObjects: () => void;
    getVectorLayer: (idLayer: string, serviceUrl?: string) => VectorLayer | undefined;
    getLayer: (idLayer: string, serviceUrl?: string) => Layer | undefined;
    getToken: () => string;
    mergeWmsLayers: () => boolean;
    _removeLayer: (xId: string) => number;
    objectManager: GwtkObjectManager;             // управление выбором объектов карты
    mapTool: (toolName: string, getIndex?: boolean) => any;
    searchManager: SearchManager;
    pixelToGeo: (point: PixelPoint, zoom?: number) => GeoPoint | undefined;
    geoToPixel: (geoPoint: GeoPoint, zoomScale?: number) => PixelPoint;
    getCenterPixel: (zoom?: number) => MatrixPixelPoint;
    getGeoBounds: () => Rectangle;
    workspaceManager: WorkspaceManager;
    taskManagerNew: TaskManager;
    translate: (value: string) => string;

    classifiers: ClassifierCollection;

    getBbox: () => BoundingBox2D;
    getCenter: () => MapPoint;
    getCenterGeoPoint: () => GeoPoint;
    getSize: () => PixelPoint;
    setView: (center?: MapPoint, zoom?: number) => void;
    setViewport: (center: MapPoint) => void;
    setMapCenter: (center: MapPoint, refresh?: boolean) => void;

    getWindowSize: () => Vector2D;
    setLayerVisibility: (layer: Layer, value: boolean) => void;
    downLoadLayer: (layer: Layer, outType: OUTTYPE) => Promise<undefined>;
    showMapExtent: (
        leftBottomLat: number,
        leftBottomLon: number,
        rightTopLat: number,
        rightTopLon: number,
        ifRoundUp?: boolean
    ) => 0 | 1 | -1;

    showMapExtentPlane: (
        boundsMapLeft: MapPoint,
        boundsMapRight: MapPoint
    ) => -1 | 1;

    requestRender: () => void;

    addLocalLayer: (options: GwtkLayerDescription, json?: string, params?: { isReadonly: boolean, isLocked: boolean }) => GeoJsonLayer;
    openLocalLayer: (map: GwtkMap, options: GwtkLayerDescription, json?: string, params?: { isReadonly: boolean, isLocked: boolean }) => GeoJsonLayer;
    openLayer: (options: GwtkLayerDescription, treeItem?: ContentTreeNode) => Layer;
    openVectorLayer: (options: GwtkLayerDescription) => VectorLayer;

    onLayerListChanged: (treeItem: ContentTreeNodeUpdate) => void;
    vectorRenderer: SVGrenderer;

    readProtocolMessages: () => LogRecord[];
    writeProtocolMessage: (message: LogMessage) => void;
    clearProtocol: () => void;

    pixelToPlane: (point: PixelPoint, zoom?: number) => MapPoint;
    getCrsString: () => string;
    getZoomScale: (zoom: number) => number;
    getTaskManager: () => TaskManager;
    Translate: Readonly<TTranslate>;
    tileMatrix: TileMatrix;
    planeToPixel: (planePoint: MapPoint) => PixelPoint;

    maxBounds?: Bounds;
    getWindowBounds: () => Bounds;
    ProjectionId: string;

    _getCanvas: () => HTMLCanvasElement | undefined;

    getBounds: () => Rectangle;
    getPixelMapBounds: (zoom?: number) => PixelBounds;

    trigger: (event: GwtkMapEventBody<GwtkMapEventType>) => void;
    on<T extends GwtkMapEventType>(event: { type: T; target?: 'map'; phase?: 'before'; }, handler: GwtkMapEventHandler<T>): void;
    off<T extends GwtkMapEventType>(event: { type: T; target?: 'map'; phase?: 'before'; }, handler: GwtkMapEventHandler<T>): void;
    on(event: 'mapdragend', handler: () => void): void;
    off(event: 'mapdragend', handler: () => void): void;

    writeDebugLog: (description?: string) => void;
    loadFromUrl: (forcedParams: ForcedParameters) => void;

    showObjectInfoFromGeoJSON: (json: GeoJsonType, moveMap: boolean) => void;
    setRefreshInterval: () => void;

    getShareLocation: () => string;

} & AuthParams & SimpleJson<any>;


export type GwtkMapEventType =
    'featureinforefreshed'
    | 'layercommand'
    | 'visibilitychanged'
    | 'layerlistchanged'
    | 'loadclassifier'
    | 'loadclassifierError'
    | 'logmessage'
    | 'mapdrag'
    | 'mapdragend'
    | 'prerender'
    | 'postrender'
    | 'refreshmap'
    | 'registerplugin'
    | 'searchcomplete'
    | 'searchreasultsforceupdate'
    | 'selectobject'
    | 'selectobjects'
    | 'updatecriteriaaggregator'
    | 'overlayRefresh'
    | 'postwmsdrawing'
    | 'postwmsupdate'
    | 'wmsloaded'
    | 'workspacechanged'
    | 'workspacereset'
    | 'zoomIn'
    | 'zoomOut'
    | 'callAPI';

type LayerCommand = 'opacitychanged' | 'visibilitychanged';

type GwtkMapEventBody<T extends GwtkMapEventType> = { type: T; target?: 'map'; } & (
    {
        type: 'visibilitychanged';
        maplayer: {
            id: string;
            visible: boolean;
        }
    } | {
    type: 'layercommand';
    maplayer: {
        id: string;
        act: LayerCommand;
        value: string;
        layer: Layer;
    }
} | {
    type: 'layerlistchanged',
    maplayer?: {
        id: string;
        act: 'add' | 'remove';
    }
} | {
    type: 'loadclassifier';
    legend: LegendClass;
    layer: Layer;
} | {
    type: 'logmessage';
    message: LogMessage;
} | {
    type: 'loadclassifierError';
    layer: Layer;
    error: string;
} | {
    type: 'registerplugin';
    plugin: PluginDescription;
} | {
    type: 'workspacechanged';
    item: { key: keyof WorkspaceValues; value: WorkspaceValues[keyof WorkspaceValues]; }
} | {
    type: 'updatecriteriaaggregator';
    item: CriteriaAggregator;
} | {
    type: 'featureinforefreshed';
    searchResults?: true;
} | {
    type: 'refreshmap';
    cmd: 'draw'
} | {
    type: 'overlayRefresh';
    cmd: 'resize'
} | {
    type: 'callAPI';
    cmd: string;
    data: { callback?: (data: any) => void; } & ({ [key: string]: string, layer: string; } | { visible: boolean } | {data: string} | {});
} | {
        type: 'callAPI';
        cmd: string;
        data: { callback?: (data: any) => void; } & (any);
} | {
    type: 'mapdrag' | 'mapdragend' | 'prerender' | 'postrender' | 'searchcomplete' | 'searchreasultsforceupdate' | 'selectobjects' | 'postwmsdrawing' | 'postwmsupdate' | 'wmsloaded' | 'workspacereset' | 'zoomIn' | 'zoomOut';
});


type GwtkMapEventHandler<T extends GwtkMapEventType> = (event: GwtkMapEventBody<T>) => void;


export type GwtkObjectManager = {
    selectedFeatures: GwtkSelectedFeatures;
}

export type GwtkSelectedFeatures = {
    selected: [];
    layers: [];
    getselection: () => GwtkSelectedFeatures;
    drawselobject: {
        gid: string;
        maplayerid: string;
        name: string;
    };
    addMapObject(mapObject: MapObject): void;
}

export type TileItem = {
    el: HTMLImageElement;
    coords: PixelPoint;
    current: boolean;
    src: string;
    xhr: any;
    list_index: number;
}

interface Tiles {
    authentication: { pam: { url: string; layerid?: string; }[] };
    viewOrder: string[];
    getLayerByxId: (id: string) => Layer | undefined;
    getLayerByFilter: (filer: { idLayer: string, serviceUrl: string }) => Layer | undefined;
    getVectorLayerByxId: (id: string) => VectorLayer | undefined;
    getVirtualFolderByxId: (id: string) => VirtualFolder | undefined;
    getVirtualFolderByFolderName: (folder: string, url: string) => VirtualFolder | undefined;
    getLayerByIdService: (id: string) => Layer | undefined;
    getSelectableLayersArray: () => Layer[];
    getAllSelectableLayers: () => Layer[];
    drawMapImage: (a: boolean, b: boolean, c: boolean) => void;
    getLayersPointProjected: (point: PixelPoint) => MapPoint;
    setAuthTypeServer: (layer: Layer) => void;
    setLayersInViewOrderByList: (newViewOrder: string[]) => void;
    moveLayerToTop: (xId: string) => void;
    insertByZIndex: (xId: string) => void;
    getLayerByGmlId: (gmlId: string) => Layer | undefined;
    getIdServiceByLayer: (layer: Layer) => string | '';
    getTextSearchOptions: () => SimpleJson<any>;
    getVisibleLayers: () => { xId: string; alias: string; tiles: boolean }[];
    getWmsLayers: () => Layer[];
    getWmsLayersVisible: () => WmsLayer[];
    layersOpacity: object[];
    _testPointByMaxBounds: (point: PixelPoint) => boolean;
    wmsUpdate: () => void;
    legends: Legend[];
    drawWmsLayers: () => void;
    forceUpdate: () => void;
    indexOfxIdInArray: (layers: Layer[], id: string) => number;
    getSelectableLayers: () => string;
    setRefreshInterval: (seconds: number) => void;

    setLayersInViewOrder(): void;

    wmsManager: any;

    forceupdate(): void;

    svgLegendColors: string;

    _drawFilter?: { wmts: string[]; wms: string[]; images?: any[]; wmslayers?: any[]; };
}

export enum LAYERTYPE {
    undefined = 0,
    tile = 1,
    wms = 2,
    svg = 3,
    geomarkers = 4,
    folder = 5,
    tilewms = 6
}

export enum LAYERTYPENAME {
    undefined = '',
    tile = 'tile',
    wms = 'wms',
    svg = 'svg',
    html = 'html',
    geomarkers = 'geomarkers',
    folder = 'folder',
    tilewms = 'tilewms'
}

export type GwtkComponentDescriptionPropsData = {
    taskId: string;
    actionId?: string;
    description: TaskDescription;
};

export enum CURSOR_TYPE {
    crosshair = 'crosshair',
    default = 'default',
    move = 'move',
    pointer = 'pointer',
    progress = 'progress',
    grab = 'grab'
}

export type Legend = { nodes: LegendBranchNode[]; };

export enum LEGEND_NODE_TYPE {
    Root,
    Branch,
    Leaf
}

type LegendNode = {
    key: string;
    text: string;
    type: LEGEND_NODE_TYPE;
    icon?: string;
    image?: string;
}

export type LegendRootNode = LegendNode & {
    type: LEGEND_NODE_TYPE.Root;
    nodes: LegendBranchNode[];
};

export type LegendBranchNode = LegendNode & {
    type: LEGEND_NODE_TYPE.Branch;
    nodes: LegendLeafNode[];
};

export type LegendLeafNode = LegendNode & {
    type: LEGEND_NODE_TYPE.Leaf;
    code: number;
    local: LOCALE;
};

export type RoutePoint = {
    coordinate: GeoPoint | null,
    name: string | null
}

export type UserControl = any;

export type Visibility = 'visible' | 'hidden' | 'half-visible';

export interface BuildParameterOptions {
    id: string;
    text: string;
    userThematicRangeList: UserThematicRange[];
    rangesCount?: number;
}

export type UserThematicRange = {
    range: {
        min: number,
        max: number,
    },
    styles: {
        line: CommonServiceSVG[],
        polygon: CommonServiceSVG[],
        marker: CommonServiceSVG[],
        text: CommonServiceSVG[],
    },
    icons: {
        line: string,
        polygon: string,
        marker: string
    }
}
export type BuildThematicMapParams = {
    alias: string;
    path: string;
    csvEditorFiltered: CsvEditor
}

export interface ThematicRangesData {
    ranges: UserThematicRange[],
    rangesCount: number,
    valueArray: number[],
    minValue: number,
    maxValue: number
}


export interface ThematicChartData {
    description: {
        label: string,
        title: string,
        icon: string[],
        color: string;
    },
    value: number
}

export interface ThematicChartDataArray {
    array: ThematicChartData[],
    title: string
}

export interface UserAttribute {
    min: number;
    max: number;
}

interface UserRule {
    key: string;
    description: string;
    value: UserAttribute[];
}

export interface UserThematicFilter {
    styles: {
        polygon: UserSymbolizer[];
        line: UserSymbolizer[];
        marker: UserSymbolizer[];
        text: UserSymbolizer[]
    };
    $rules: UserRule[];
}

export interface UserStyleObject {
    rule: string;
    value: string;
}

export type CommonSymbolizer = { type: 'LineSymbolizer'; style: SvgStroke; } |
    { type: 'PolygonSymbolizer'; style: SvgFill; } |
    { type: 'PointSymbolizer'; style: SvgMarker; } |
    { type: 'HatchSymbolizer'; style: SvgHatch; } |
    { type: 'TextSymbolizer'; style: SvgText; }

export interface UserSymbolizer {
    type: CommonSymbolizer['type'];
    'stroke'?: UserStyleObject[];                                                           //'#000000' цвет
    'stroke-opacity'?: UserStyleObject[];                                                   // непрозрачность
    'stroke-width'?: UserStyleObject[];                                                     // толщина
    'stroke-linejoin'?: UserStyleObject[];                             // скругление соединений
    'stroke-linecap'?: UserStyleObject[];                             // скругление углов
    'stroke-dasharray'?: UserStyleObject[];                                            // пунктир
    'stroke-dashoffset'?: UserStyleObject[];
    'stroke-step'?: UserStyleObject[];
    'fill'?: UserStyleObject[];                                                          //'#FFFFFF' цвет
    'fill-opacity'?: UserStyleObject[];

    'refX'?: UserStyleObject[];
    'refY'?: UserStyleObject[];
    'width'?: UserStyleObject[];
    'height'?: UserStyleObject[];
    'markerId'?: UserStyleObject[];
    'image'?: UserStyleObject[];
    'path'?: UserStyleObject[];

    'size'?: UserStyleObject[];
    'style'?: UserStyleObject[];
    'text-shadow'?: UserStyleObject[];
    'font-family'?: UserStyleObject[];
    'font-style'?: UserStyleObject[];
    'font-weight'?: UserStyleObject[];
    'font-size'?: UserStyleObject[];

}

export interface MarkerIcon {
    id: number,
    image: ImageBase64,
    name: string,
    categoryId: number // from 1
}

export interface MarkerImage {
    src: string,
    width: number,
    height: number,
    catalogId: number,
    id: number,
    name: string
}

export interface MapMarkerResponse {
    status: 'success' | 'error',
    data?: {
        images?: MarkerImage[],
        categories?: MarkerImageCategory[],
    },
    error?: string
}

export interface MarkerImageCategory {
    id: number;
    name: string;
}

export interface MapMarkersCommandsFlags {
    isDeleteImage: boolean,
    isGetCategory: boolean,
    isSaveImage: boolean
}

export interface MapMarkersCommands {
    deleteImage: string,
    getCategory: string,
    getImages: string,
    saveImage: string
}


export type SemanticTreeNodeDataItem = {
    type: 'text';
    text: string;
    value: string;
} | {
    type: 'number';
    text: string;
    value: number;
} | {
    type: 'list';
    value: number;
    text: string;
    items: {name: string; text: string; value: string;}[]
}
export type SemanticTreeNode = {
    id: string;
    name: string;
    children?: SemanticTreeNode[];
    data?: MapObjectSemanticContent[];
}

export type SldBuildObject = {
    line: Style[],
    polygon: Style[],
    marker: Style[],
    text: Style[]
} & { [key: string]: Style[] }


export type GwtkMapLegendItemReduced = {
    itemName: string,
    key: string,
    local: LOCALE
}
