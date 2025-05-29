/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Класс управления пользовательскими настройками и        *
 *                      текущим состоянием карты                    *
 *                                                                  *
 *******************************************************************/

import {EditorLayoutDescription, GwtkMap, SldBuildObject, GwtkMapLegendItemReduced} from '~/types/Types';
import {Models3dSettings} from '~/types/Options';
import {ContainsSomeOf, LogRecord, SimpleJson} from '~/types/CommonTypes';
import GeoPoint from '~/geo/GeoPoint';
import {MapPoint} from '~/geometry/MapPoint';
import IndexedDBService from '~/utils/IndexedDBService';
import IndexedDBUserDataService from '~/utils/IndexedDBUserDataService';
import LocalStorageService from '~/utils/LocalStorageService';
import {GeoJsonType} from '~/utils/GeoJSON';
import hash from 'object-hash';
import Utils from '~/services/Utils';


export const PROJECT_SETTINGS_HIDDEN_LAYERS = 'workspace.projectSettings.hiddenlayers';
export const PROJECT_SETTINGS_ID = 'workspace.projectSettings.id';
export const PROJECT_SETTINGS_LAYER_PARAMETERS_ARRAY = 'workspace.projectSettings.layerparametersarray';
export const PROJECT_SETTINGS_CONTENT_TREE_DISABLED_ARRAY = 'workspace.projectSettings.contenttreedisabledarray';
export const PROJECT_SETTINGS_LAYERS_OPACITY = 'workspace.projectSettings.layersopacity';
export const PROJECT_SETTINGS_LAYERS_BACKGROUND_ACTIVE = 'workspace.projectSettings.layersbackgroundactive';
export const PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_STYLE_OPTION = 'workspace.projectSettings.selectedlegendobjectstyleoption';
export const PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_LIST = 'workspace.projectSettings.selectedlegendobjectlist';
export const PROJECT_SETTINGS_LAYERS_VIEW_ORDER = 'workspace.projectSettings.layersvieworder';
export const PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL = 'workspace.projectSettings.dynamiclabel';
export const PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR = 'workspace.projectUserSettings.measurementsStyle.fillColor';
export const PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR = 'workspace.projectUserSettings.measurementsStyle.lineColor';
export const PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY = 'workspace.projectUserSettings.measurementsStyle.opacity';
export const PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE = 'workspace.projectUserSettings.measurementUnits.angle';
export const PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA = 'workspace.projectUserSettings.measurementUnits.area';
export const PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER = 'workspace.projectUserSettings.measurementUnits.perimeter';
export const PROJECT_SETTINGS_OBJECT_SELECTION_SIGNATURES_SELECTION = 'workspace.projectSettings.signaturesselection';
export const PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_DRAWING_TYPE = 'workspace.projectUserSettings.objectSelectionStyle.drawingType';
export const PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_LINE_COLOR = 'workspace.projectUserSettings.objectSelectionStyle.lineColor';
export const PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS = 'workspace.projectUserSettings.objectsearch.pixelradius';
export const PROJECT_SETTINGS_PROTOCOL_MAP_EVENT = 'workspace.projectSettings.protocolmapevent';
export const PROJECT_SETTINGS_REFRESH_INTERVAL = 'workspace.projectUserSettings.refreshInterval';
export const PROJECT_SETTINGS_SEARCH_FILTER_TYPE = 'workspace.projectUserSettings.searchfiltertype';
export const PROJECT_SETTINGS_SEARCH_FILTER_DIRECTION = 'workspace.projectUserSettings.searchfilterdirection';
export const PROJECT_SETTINGS_SEARCH_FILTER_SEMANTIC = 'workspace.projectUserSettings.searchfiltersemantic';
export const PROJECT_SETTINGS_SERVICE_URL = 'workspace.projectSettings.serviceurl';
export const PROJECT_SETTINGS_TILEMATRIXSET = 'workspace.projectSettings.tilematrixset';
export const PROJECT_SETTINGS_VISIBLE_MODELS = 'workspace.projectSettings.visiblemodels';
export const PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM = 'workspace.projectUserSettings.cursorcoordinatesystem';
export const PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG = 'workspace.projectSettings.userinterfacedarkthemeflag';
export const PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG = 'workspace.projectSettings.userinterfacereducesizeflag';
export const PROJECT_SETTINGS_USER_INTERFACE_PRIMARY_COLOR = 'workspace.projectSettings.userinterfaceprimarycolor';
export const PROJECT_SETTINGS_USER_INTERFACE_SECONDARY_COLOR = 'workspace.projectSettings.userinterfacesecondarycolor';
export const PROJECT_SETTINGS_USER_INTERFACE_FONT_SIZE = 'workspace.projectSettings.userinterfacefontsize';
export const PROJECT_SETTINGS_MAP_LEGEND = 'workspace.projectSettings.maplegend';
export const PROJECT_SETTINGS_INITIAL_EXTENT_RESTORE_MAP_CONTENT = 'workspace.projectSettings.initialextentrestoremapcontent';
export const PROJECT_SETTINGS_MAP_LOG_DEBUG_MODE = 'workspace.projectSettings.maplogdebugmode';

export const INITIAL_EXTENT_SETTINGS = 'workspace.projectSettings.initialextentsettings';
export const PROJECT_SETTINGS_ACTIVE_TASK_LIST = 'workspace.projectSettings.activetasklist';

export const VIEW_SETTINGS_PARAMS3D = 'workspace.viewSettings.params3d';
export const VIEW_SETTINGS_MAPCENTER = 'workspace.viewSettings.mapcenter';
export const VIEW_SETTINGS_ZOOM_LEVEL = 'workspace.viewSettings.zoomlevel';
export const GEOJSON_DATA = 'workspace.geojsondata';

export enum CursorCoordinateUnit {
    Degrees = 'DEG',
    Radians = 'RAD',
    DegreesMinutesSeconds = 'DEGMINSEC',
    Meter = 'METER',
    MeterSk42 = 'METERSK42'
}

export enum AngleUnit {
    Degrees = 'DEG',
    Radians = 'RAD',
    DegreesMinutesSeconds = 'DegMinSec'
}

export enum SelectObjectDrawingType {
    Paint = 'Paint',
}

export enum SignaturesSelection {
    Always = 'Always',
    WhileEditorIsActive = 'While editor is active',
    Never = 'Never'
}

export enum Unit {
    Meters = 'MTR',
    SquareMeters = 'SMTR',
    Kilometers = 'KMT',
    SquareKilometers = 'SKMT',
    NauticalMiles = 'NMI',
    Miles = 'SMI',
    Foots = 'FOT',
    Hectares = 'HA'
}

export enum UnitText {
    MTR = 'm',
    KMT = 'km',
    NMI = 'Nm',
    SMI = 'ml',
    FOT = 'ft',
    SMTR = 'm²',
    SKMT = 'km²',
    HA = 'ha',
    RAD = 'rad',
    DEG = '°',
    DegMinSec = '°'
}

export enum FontSize {
    SmallFontSize = '14px',
    MediumFontSize = '16px',
    HighFontSize = '18px',
    LargeFontSize = '20px'
}

export type UIParams = {
    reduceSizeInterfaceFlag: boolean;
    darkThemeFlag: boolean;
    primaryColor: string;
    secondaryColor: string;
    fontSize: FontSize;
};

export type SearchResultSort = {
    type: string;
    direction: string;
    semantic: string;
};

export type WorkspaceValues = {
    [PROJECT_SETTINGS_REFRESH_INTERVAL]: number;
    [PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER]: Unit;
    [PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA]: Unit;
    [PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE]: AngleUnit;
    [PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_DRAWING_TYPE]: SelectObjectDrawingType;
    [PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_LINE_COLOR]: string;
    [PROJECT_SETTINGS_OBJECT_SELECTION_SIGNATURES_SELECTION]: SignaturesSelection;
    [PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR]: string;
    [PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR]: string;
    [PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY]: number;
    [PROJECT_SETTINGS_LAYERS_VIEW_ORDER]: string[];
    [PROJECT_SETTINGS_HIDDEN_LAYERS]: string[];
    [PROJECT_SETTINGS_ID]: string;
    [PROJECT_SETTINGS_LAYERS_OPACITY]: { id: string; opacity: number; }[];
    [PROJECT_SETTINGS_LAYERS_BACKGROUND_ACTIVE]: string;
    [PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL]: { id: string, dynamicLabel: boolean}[];
    [PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_LIST]: { id: string; selectedLegendObjectList: GwtkMapLegendItemReduced[] }[];
    [PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_STYLE_OPTION]: { id: string; selectedLegendObjectStyleOptions: SldBuildObject}[];
    [PROJECT_SETTINGS_LAYER_PARAMETERS_ARRAY]: LayerData[];
    [PROJECT_SETTINGS_CONTENT_TREE_DISABLED_ARRAY]: string[];
    [PROJECT_SETTINGS_VISIBLE_MODELS]: string[];
    [VIEW_SETTINGS_MAPCENTER]: MapPoint;
    [VIEW_SETTINGS_ZOOM_LEVEL]: number;
    [PROJECT_SETTINGS_TILEMATRIXSET]: string;
    [VIEW_SETTINGS_PARAMS3D]: Params3d;
    [PROJECT_SETTINGS_SERVICE_URL]: string;
    [PROJECT_SETTINGS_PROTOCOL_MAP_EVENT]: LogRecord[];
    [INITIAL_EXTENT_SETTINGS]: InitialExtent;
    [PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM]: CursorCoordinateUnit;
    [PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG]: boolean;
    [PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG]: boolean;
    [PROJECT_SETTINGS_USER_INTERFACE_PRIMARY_COLOR]: string;
    [PROJECT_SETTINGS_USER_INTERFACE_SECONDARY_COLOR]: string;
    [PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS]: number;
    [PROJECT_SETTINGS_USER_INTERFACE_FONT_SIZE]: FontSize;
    [GEOJSON_DATA]: JSONData;
    [PROJECT_SETTINGS_ACTIVE_TASK_LIST]: string;
    [PROJECT_SETTINGS_SEARCH_FILTER_TYPE]: string;
    [PROJECT_SETTINGS_SEARCH_FILTER_DIRECTION]: string;
    [PROJECT_SETTINGS_SEARCH_FILTER_SEMANTIC]: string;
    [PROJECT_SETTINGS_MAP_LEGEND]: boolean;
    [PROJECT_SETTINGS_INITIAL_EXTENT_RESTORE_MAP_CONTENT]: boolean;
    [PROJECT_SETTINGS_MAP_LOG_DEBUG_MODE]: boolean;
}

export type ComponentData = {
    [componentName: string]: SimpleJson<any>;
}

export type ProjectSettings = {
    id: string;
    layers: LayerData[];
    disabledNodes: string[];
    protocolMapEvent: LogRecord[];
    serviceUrl: string;
    tilematrixSet: string;
    version: string;
    visibleModels: string[];
    initialExtent: InitialExtent;
    activeTask: string;
    searchResultSort: SearchResultSort;
}

export type ProjectSettingsMapLegend = {
    withMapExtent: boolean
}

export type UserSettings = {
    id: string;
    cursorCoordinateSystem: CursorCoordinateUnit;
    measurementUnits: MeasurementUnits;
    measurementsStyle: MeasurementsStyle;
    objectSearch: ObjectSearch;
    objectSelectionStyle: ObjectSelectionStyle;
    refreshInterval: number;
    ui: UIParams;
    mapLegend: ProjectSettingsMapLegend;
    initialExtentParam: InitialExtentSettings;
    mapLogParam: MapLogParams;
}

export type InitialExtentSettings = {
    resetMapContent: boolean | undefined;
}

export type MapLogParams = {
    debugMode: boolean | undefined;
}


export type JSONData = {
    [key: string]: {
        locked: boolean;
        data: GeoJsonType;
    };
}

export enum ViewMode {
    Full,
    Skeleton
}

export enum LightSource {
    Projector,
    Sun
}

export type Params3d = {
    active: boolean;
    incline: number;
    rotate: number;
    lightSource: LightSource;
    viewMode: ViewMode
};

export type ViewSettings = {
    mapCenter: { x: number; y: number; h: number; };
    params3d: Params3d;
    zoomLevel: number;
}

export type MeasurementUnits = {
    perimeter: Unit;
    area: Unit;
    angle: AngleUnit;
    // totalFlag: boolean;
}

export type ObjectSelectionStyle = {
    drawingType: SelectObjectDrawingType;
    lineColor: string;
    signaturesSelection: SignaturesSelection;
}

export type ObjectSearch = {
    pixelRadius: number;
}

export type MeasurementsStyle = {
    fillColor: string;
    lineColor: string;
    opacity: number;
}

export type InitialExtent = {
    mapCenter: { x: number; y: number; h: number; };
    zoomLevel: number;
}

export interface LayerData {
    id: string;
    hidden?: true;
    opacity?: number;
    zIndex?: number;
    backgroundactive?: 1;
    dynamicLabel?: boolean;
    selectedLegendObjectList?: GwtkMapLegendItemReduced[];
    selectedLegendObjectStyleOptions?: SldBuildObject;

}

export interface StorageService {

    setUser(user: string, projectId: string): void;

    getViewSettings(): Promise<ContainsSomeOf<ViewSettings> | undefined>;

    getProjectSettings(): Promise<ContainsSomeOf<ProjectSettings> | undefined>;

    getUserSettings(): Promise<ContainsSomeOf<UserSettings> | undefined>;

    getJsonData(): Promise<JSONData | undefined>;

    getAllComponentsData(): Promise<ComponentData | undefined>;

    getComponentData(taskId: string): Promise<SimpleJson<any> | undefined>;

    setViewSettings(data: ViewSettings): Promise<void>;

    setProjectSettings(data: ProjectSettings): Promise<void>;

    setUserSettings(data: UserSettings): Promise<void>;

    setJsonData(data: JSONData): Promise<void>;

    setComponentData(taskId: string, data?: SimpleJson<any>): Promise<void>;

    clearViewSettings(): Promise<void>;

    clearProjectSettings(): Promise<void>;

    clearUserSettings(): Promise<void>;

    clearJsonData(): Promise<void>;

    close(): Promise<void>;
}


export interface UserStorageService {

    setUser(user: string): void;

    getActiveProject(): Promise<{ number: number; } | undefined>;

    setActiveProject(data: { number: number; }): Promise<string | undefined>;

    clearActiveProject(): Promise<void>;

    getUserSettings(): Promise<ContainsSomeOf<UserSettings> | undefined>;

    setUserSettings(data: UserSettings): Promise<void>;

    close(): Promise<void>;
}

export type ExternalData = {
    componentData?: ComponentData;
    projectSettings?: ProjectSettings;
    viewSettings?: ViewSettings;
    jsonData?: JSONData;
    storageService?: StorageService;
    userStorageService?: UserStorageService;
};

const THROTTLE_INTERVAL = 500;  // 0.5 секунды

/**
 * Класс управления пользовательскими настройками и текущим состоянием карты
 * @class WorkspaceManager
 */
export default class WorkspaceManager {

    private readonly storageService?: StorageService;

    private readonly userStorageService?: UserStorageService;

    private readonly componentData: ComponentData = {};

    private readonly jsonData: JSONData = {};

    private readonly projectSettings: ProjectSettings = {
        id: '',
        layers: [],
        disabledNodes: [],
        protocolMapEvent: [],
        serviceUrl: '',
        tilematrixSet: '',
        version: '',
        visibleModels: [],
        initialExtent: {
            mapCenter: {x: 0, y: 0, h: 0},
            zoomLevel: 0
        },
        activeTask: '',
        searchResultSort: {
            semantic: '',
            direction: '',
            type: ''
        }
    };

    private readonly defaultUserSettings: UserSettings = WorkspaceManager.createProjectSettings();

    private projectUserSettings?: UserSettings;

    private readonly viewSettings: ViewSettings = {
        mapCenter: {x: 0, y: 0, h: 0},
        zoomLevel: 0,
        params3d: {active: false, incline: 0, rotate: 0, lightSource: 0, viewMode: 0}
    };

    private readonly componentsDataDirtyFlags: { [taskId: string]: boolean } = {};

    private projectSettingsDirtyFlag = false;

    private viewSettingsDirtyFlag = false;

    private jsonDataDirtyFlag = false;


    /**
     * @constructor WorkspaceManager
     * @param map {GwtkMap} Экземпляр карты
     * @param externalData {ExternalData} Внешние данные из базы
     */
    constructor(private readonly map: GwtkMap, externalData?: ExternalData,) {

        const userName = this.map.options.username || 'ANONYMOUS';

        if (!this.map.options.noStorage) {
            this.storageService = externalData?.storageService || new IndexedDBService(userName, this.map.options.id);
            this.userStorageService = externalData?.userStorageService || new IndexedDBUserDataService(userName);
        } else {
            this.storageService = undefined;
            this.userStorageService = undefined;
        }

        this.defaultUserSettings.measurementUnits = this.parseMeasurementUnitsSettings();

        for (let i = 0; i < this.map.options.layers.length; i++) {
            const layer = this.map.options.layers[i];

            let layerSettings = this.projectSettings.layers.find(currentLayer => currentLayer.id === layer.id);
            if (!layerSettings) {
                layerSettings = { id: layer.id };
                this.projectSettings.layers.push(layerSettings);
            }

            if (layer.hidden) {
                layerSettings.hidden = true;
            }

            let opacity = 1;
            if (layer.opacityValue !== undefined) {
                opacity = layer.opacityValue / 100;
            }

            layerSettings.opacity = opacity;
            //для первоначальной загрузки анонимного пользователя
            if ( !externalData?.projectSettings && Object.prototype.hasOwnProperty.call(layer, 'legend')) {
                layerSettings.selectedLegendObjectList = layer.selectedLegendObjectList || [];
                layerSettings.selectedLegendObjectStyleOptions = layer.selectedLegendObjectStyleOptions || { line: [], polygon: [], text: [], marker: [] };
            }
        }


        this.projectSettings.id = this.map.options.id;
        this.projectSettings.id = this.map.options.id;

        this.projectSettings.tilematrixSet = this.map.options.tilematrixset;

        this.defaultUserSettings.cursorCoordinateSystem = CursorCoordinateUnit.Degrees;
        if (!this.map.Translate.IsGeoSupported) {
            this.defaultUserSettings.cursorCoordinateSystem = CursorCoordinateUnit.Meter;
        }

        let mapCenter;

        const center = this.map.options.center;
        if (this.map.options.isgeocenter === undefined || this.map.options.isgeocenter) {
            const point = new GeoPoint(center[1], center[0], 0, this.projectSettings.tilematrixSet);
            mapCenter = point.toMapPoint() || new MapPoint(0, 0, 0, this.projectSettings.tilematrixSet);
        } else {
            mapCenter = new MapPoint(center[0], center[1], 0, this.projectSettings.tilematrixSet);
        }

        this.viewSettings.mapCenter.x = mapCenter.x;
        this.viewSettings.mapCenter.y = mapCenter.y;
        this.viewSettings.mapCenter.h = mapCenter.h;

        this.viewSettings.zoomLevel = this.map.options.tilematrix;

        this.projectSettings.initialExtent.mapCenter.x = mapCenter.x;
        this.projectSettings.initialExtent.mapCenter.y = mapCenter.y;
        this.projectSettings.initialExtent.mapCenter.h = mapCenter.h;
        this.projectSettings.initialExtent.zoomLevel = this.map.options.tilematrix;

        if (this.map.options.params3d) {
            this.viewSettings.params3d.active = this.map.options.params3d.active;

            if (this.map.options.params3d.incline !== undefined) {
                this.viewSettings.params3d.incline = this.map.options.params3d.incline;
            }

            if (this.map.options.params3d.rotate !== undefined) {
                this.viewSettings.params3d.rotate = this.map.options.params3d.rotate;
            }
        }

        this.projectSettings.serviceUrl = this.map.options.url;

        if (this.map.options.objects3d) {
            for (let i = 0; i < this.map.options.objects3d.length; i++) {
                const model3d = this.map.options.objects3d[i];
                if (Reflect.has(model3d, 'idLayer') && !(model3d as Models3dSettings).hidden) {
                    this.projectSettings.visibleModels.push(model3d.id);
                }
            }
        }

        //TODO: иначе при повторном входе меняется param_version
        const loggedbefore = this.map.options.loggedbefore;
        this.map.options.loggedbefore = false;

        this.projectSettings.version = hash(this.map.options);

        this.map.options.loggedbefore = loggedbefore;

        this.oldVersionStorageCheck();

        if (externalData) {
            this.fromJSON(externalData);
        }

        for (const jsonDataKey in this.jsonData) {
            if (!this.jsonData[jsonDataKey].locked) {
                this.removeJSON(jsonDataKey);
            }
        }

        this.writeViewSettings();
        this.writeProjectSettings();
        this.writeJsonData();
        for (const componentId in this.componentsDataDirtyFlags) {
            this.writeComponentData(componentId);
        }

        this.readDefaultUserSettings().finally(() => {
            this.readProjectUserSettings().finally(() => {
                if (!this.hasProjectUserSettings() && this.map.options.themeSettings) {
                    this.updateProjectUserSettings({
                        ...this.defaultUserSettings,
                        ui: this.map.options.themeSettings ? {...this.map.options.themeSettings} : undefined
                    });
                    this.map.trigger({type: 'workspacereset', target: 'map'});
                }
            });
        });

        // TODO: Почему-то не чистится сразу
        window.setTimeout(() => {
            for (const jsonDataKey in this.jsonData) {
                if (!this.jsonData[jsonDataKey].locked) {
                    this.removeJSON(jsonDataKey);
                }
            }
        }, 1000);


        this.syncData = Utils.throttle(this.syncData.bind(this), THROTTLE_INTERVAL);

    }

    private get userSettings() {
        return this.projectUserSettings || this.defaultUserSettings;
    }

    initProjectUserSettings() {
        if (!this.projectUserSettings) {
            this.projectUserSettings = {...this.defaultUserSettings};
            this.projectUserSettings.id = this.projectSettings.id;
        }
    }

    hasProjectUserSettings() {
        return this.projectUserSettings !== undefined;
    }

    private fromJSON(data: ExternalData) {
        if (data.projectSettings?.searchResultSort) {
            this.projectSettings.searchResultSort = data.projectSettings?.searchResultSort;
        }

        if (data.componentData) {
            for (const dataKey in data.componentData) {
                this.componentData[dataKey] = data.componentData[dataKey];
                this.componentsDataDirtyFlags[dataKey] = false;
            }
        }


        if (data.projectSettings) {
            const forcedParamsFlag = this.map.options.forcedParams && Reflect.ownKeys(this.map.options.forcedParams).find(param => param.toString().toLowerCase() !== 'projectid') !== undefined;
            if (data.projectSettings.version !== this.projectSettings.version && !forcedParamsFlag) {
                this.clear();
                return;
            }
            this.updateProjectSettings(data.projectSettings);
            this.projectSettingsDirtyFlag = true;
        }

        if (data.jsonData) {
            for (const jsonDataKey in this.jsonData) {
                this.removeJSON(jsonDataKey);
            }

            for (const dataKey in data.jsonData) {
                this.jsonData[dataKey] = data.jsonData[dataKey];
            }
            this.jsonDataDirtyFlag = true;
        }

        if (data.viewSettings) {
            this.updateViewSettings(data.viewSettings);
            this.viewSettingsDirtyFlag = true;
        }
    }


    async destroy() {
        await this.clear();
    }

    async closeConnection(): Promise<void> {
        if (this.userStorageService) {
            await this.userStorageService.close();
        }
        if (this.storageService) {
            return await this.storageService.close();
        }
    }


    /**
     * Загрузить сохраненные параметры
     * @async
     * @method forceReload
     */
    async forceReload(): Promise<void> {

        if (this.storageService) {

            if (!await this.checkVersion()) {
                await this.clear();
            }

            const componentData = await this.storageService.getAllComponentsData();
            const projectSettings = await this.storageService.getProjectSettings() as ProjectSettings;
            const viewSettings = await this.storageService.getViewSettings() as ViewSettings;
            const jsonData = await this.storageService.getJsonData() as JSONData;
            this.fromJSON({componentData, projectSettings, viewSettings, jsonData: jsonData});
        }

    }

    async setValue<K extends keyof WorkspaceValues>(key: K, value: WorkspaceValues[K]): Promise<void> {

        switch (key) {
            case PROJECT_SETTINGS_SEARCH_FILTER_TYPE:
                this.projectSettings.searchResultSort.type = value as WorkspaceValues[typeof PROJECT_SETTINGS_SEARCH_FILTER_TYPE];
                break;
            case PROJECT_SETTINGS_SEARCH_FILTER_DIRECTION:
                this.projectSettings.searchResultSort.direction = value as WorkspaceValues[typeof PROJECT_SETTINGS_SEARCH_FILTER_DIRECTION];
                break;
            case PROJECT_SETTINGS_SEARCH_FILTER_SEMANTIC:
                this.projectSettings.searchResultSort.semantic = value as WorkspaceValues[typeof PROJECT_SETTINGS_SEARCH_FILTER_SEMANTIC];
                break;
            case PROJECT_SETTINGS_REFRESH_INTERVAL:
                this.userSettings.refreshInterval = value as WorkspaceValues[typeof PROJECT_SETTINGS_REFRESH_INTERVAL];
                break;
            case PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER:
                this.userSettings.measurementUnits.perimeter = value as WorkspaceValues[typeof PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER];
                break;
            case PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA:
                this.userSettings.measurementUnits.area = value as WorkspaceValues[typeof PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA];
                break;
            case PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE:
                this.userSettings.measurementUnits.angle = value as WorkspaceValues[typeof PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE];
                break;
            case PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_DRAWING_TYPE:
                this.userSettings.objectSelectionStyle.drawingType = value as WorkspaceValues[typeof PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_DRAWING_TYPE];
                break;
            case PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_LINE_COLOR:
                this.userSettings.objectSelectionStyle.lineColor = value as WorkspaceValues[typeof PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_LINE_COLOR];
                break;
            case PROJECT_SETTINGS_OBJECT_SELECTION_SIGNATURES_SELECTION:
                this.userSettings.objectSelectionStyle.signaturesSelection = value as WorkspaceValues[typeof PROJECT_SETTINGS_OBJECT_SELECTION_SIGNATURES_SELECTION];
                break;
            case PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR:
                this.userSettings.measurementsStyle.fillColor = value as WorkspaceValues[typeof PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR];
                break;
            case PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR:
                this.userSettings.measurementsStyle.lineColor = value as WorkspaceValues[typeof PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR];
                break;
            case PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY:
                this.userSettings.measurementsStyle.opacity = value as WorkspaceValues[typeof PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY];
                break;
            case PROJECT_SETTINGS_INITIAL_EXTENT_RESTORE_MAP_CONTENT:
                this.userSettings.initialExtentParam.resetMapContent = value as WorkspaceValues[typeof PROJECT_SETTINGS_INITIAL_EXTENT_RESTORE_MAP_CONTENT];
                break;
            case PROJECT_SETTINGS_MAP_LOG_DEBUG_MODE:
                this.userSettings.mapLogParam.debugMode = value as WorkspaceValues[typeof PROJECT_SETTINGS_MAP_LOG_DEBUG_MODE];
                break;
            case PROJECT_SETTINGS_LAYERS_VIEW_ORDER:
                const layersViewOrder = value as WorkspaceValues[typeof PROJECT_SETTINGS_LAYERS_VIEW_ORDER];

                layersViewOrder.forEach(id => {
                    const layer = this.map.tiles.getLayerByxId(id);
                    if (layer) {
                        let layerSettings = this.projectSettings.layers.find(currentLayer => currentLayer.id === id);
                        if (!layerSettings) {
                            layerSettings = {id};
                            this.projectSettings.layers.push(layerSettings);
                        }
                        layerSettings.zIndex = layer.zIndex;
                    }
                });
                break;
            case PROJECT_SETTINGS_ID:
                this.projectSettings.id = value as WorkspaceValues[typeof PROJECT_SETTINGS_ID];
                break;
            case PROJECT_SETTINGS_HIDDEN_LAYERS:
                const hiddenLayers = value as WorkspaceValues[typeof PROJECT_SETTINGS_HIDDEN_LAYERS];

                this.projectSettings.layers.forEach(layer => delete layer.hidden);

                hiddenLayers.forEach(id => {
                    let layerSettings = this.projectSettings.layers.find(currentLayer => currentLayer.id === id);
                    if (!layerSettings) {
                        layerSettings = {id};
                        this.projectSettings.layers.push(layerSettings);
                    }
                    layerSettings.hidden = true;
                });
                break;
            case PROJECT_SETTINGS_LAYERS_OPACITY:
                const layersOpacityArray = value as WorkspaceValues[typeof PROJECT_SETTINGS_LAYERS_OPACITY];

                this.projectSettings.layers.forEach(layer => layer.opacity = 1);
                layersOpacityArray.forEach(layerOpacity => {
                    let layerSettings = this.projectSettings.layers.find(currentLayer => currentLayer.id === layerOpacity.id);
                    if (!layerSettings) {
                        layerSettings = { id: layerOpacity.id };
                        this.projectSettings.layers.push(layerSettings);
                    }
                    layerSettings.opacity = layerOpacity.opacity;
                });
                break;
            case PROJECT_SETTINGS_LAYERS_BACKGROUND_ACTIVE:

                const backgroundLayerActiveIndex = this.projectSettings.layers.findIndex(item => item.id === value);
                if (backgroundLayerActiveIndex > -1) {

                    this.projectSettings.layers.forEach(item => {
                        if (item.backgroundactive !== undefined) {
                            item.backgroundactive = undefined;
                        }
                    });

                    let activeLayer = this.projectSettings.layers[backgroundLayerActiveIndex];
                    activeLayer.backgroundactive = 1;

                    this.projectSettings.layers.splice(backgroundLayerActiveIndex, 1, activeLayer);
                }
                break;
            case PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_LIST:
                const layerSelectedLegendObjects = value as WorkspaceValues[typeof PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_LIST];
                layerSelectedLegendObjects.forEach(layerSelectedLegendObject => {
                    let layerSettings = this.projectSettings.layers.find(currentLayer => currentLayer.id === layerSelectedLegendObject.id);
                    if (!layerSettings) {
                        layerSettings = { id: layerSelectedLegendObject.id, selectedLegendObjectList: layerSelectedLegendObject.selectedLegendObjectList };
                        this.projectSettings.layers.push(layerSettings);
                    }
                    layerSettings.selectedLegendObjectList?.splice(0);
                    layerSettings.selectedLegendObjectList?.push(...layerSelectedLegendObject.selectedLegendObjectList);
                });
                break;
            case PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_STYLE_OPTION:
                const layerSelectedLegendObjectsStyleOption = value as WorkspaceValues[typeof PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_STYLE_OPTION]; layerSelectedLegendObjectsStyleOption.forEach(layerSelectedLegendObjectStyleOption => {
                    let layerSettings = this.projectSettings.layers.find(currentLayer => currentLayer.id === layerSelectedLegendObjectStyleOption.id);
                    if (!layerSettings) {
                        layerSettings = { id: layerSelectedLegendObjectStyleOption.id, selectedLegendObjectStyleOptions: layerSelectedLegendObjectStyleOption.selectedLegendObjectStyleOptions };

                        this.projectSettings.layers.push(layerSettings);
                    }
                    ['line', 'polygon', 'marker', 'text'].forEach(styleType => {
                        if (layerSettings?.selectedLegendObjectStyleOptions?.[styleType]) {
                            layerSettings.selectedLegendObjectStyleOptions[styleType].splice(0);
                            layerSettings.selectedLegendObjectStyleOptions[styleType].push(...layerSelectedLegendObjectStyleOption.selectedLegendObjectStyleOptions[styleType]);
                        }
                    });
                });
                break;

            case PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL:
                const layerDynamicLabel = value as WorkspaceValues[typeof PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL];

                layerDynamicLabel.forEach(dynamicLabel => {
                    let layerSettings = this.projectSettings.layers.find(currentLayer => currentLayer.id === dynamicLabel.id);
                    if (!layerSettings) {
                        layerSettings = { id: dynamicLabel.id };
                        this.projectSettings.layers.push(layerSettings);
                    }
                    layerSettings.dynamicLabel = dynamicLabel.dynamicLabel;
                });
                break;
            case PROJECT_SETTINGS_LAYER_PARAMETERS_ARRAY:
                const layerParametersArray = value as WorkspaceValues[typeof PROJECT_SETTINGS_LAYER_PARAMETERS_ARRAY];
                this.projectSettings.layers.splice(0, this.projectSettings.layers.length, ...layerParametersArray);
                break;
            case PROJECT_SETTINGS_CONTENT_TREE_DISABLED_ARRAY:
                const disabledNodeIds = value as WorkspaceValues[typeof PROJECT_SETTINGS_CONTENT_TREE_DISABLED_ARRAY];
                this.projectSettings.disabledNodes.splice(0, this.projectSettings.disabledNodes.length, ...disabledNodeIds);
                break;
            case PROJECT_SETTINGS_VISIBLE_MODELS:
                this.projectSettings.visibleModels = value as WorkspaceValues[typeof PROJECT_SETTINGS_VISIBLE_MODELS];
                break;
            case PROJECT_SETTINGS_TILEMATRIXSET:
                this.projectSettings.tilematrixSet = value as WorkspaceValues[typeof PROJECT_SETTINGS_TILEMATRIXSET];
                break;
            case PROJECT_SETTINGS_SERVICE_URL:
                this.projectSettings.serviceUrl = value as WorkspaceValues[typeof PROJECT_SETTINGS_SERVICE_URL];
                break;
            case PROJECT_SETTINGS_PROTOCOL_MAP_EVENT:
                this.projectSettings.protocolMapEvent = value as WorkspaceValues[typeof PROJECT_SETTINGS_PROTOCOL_MAP_EVENT];
                break;
            case INITIAL_EXTENT_SETTINGS:
                this.projectSettings.initialExtent = value as WorkspaceValues[typeof INITIAL_EXTENT_SETTINGS];
                break;
            case PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM:
                this.userSettings.cursorCoordinateSystem = value as WorkspaceValues[typeof PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM];
                break;
            case PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG:
                this.userSettings.ui.darkThemeFlag = value as WorkspaceValues[typeof PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG];
                break;
            case PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG:
                this.userSettings.ui.reduceSizeInterfaceFlag = value as WorkspaceValues[typeof PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG];
                break;
            case PROJECT_SETTINGS_USER_INTERFACE_PRIMARY_COLOR:
                this.userSettings.ui.primaryColor = value as WorkspaceValues[typeof PROJECT_SETTINGS_USER_INTERFACE_PRIMARY_COLOR];
                break;
            case PROJECT_SETTINGS_USER_INTERFACE_SECONDARY_COLOR:
                this.userSettings.ui.secondaryColor = value as WorkspaceValues[typeof PROJECT_SETTINGS_USER_INTERFACE_SECONDARY_COLOR];
                break;
            case PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS:
                this.userSettings.objectSearch.pixelRadius = value as WorkspaceValues[typeof PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS];
                break;
            case PROJECT_SETTINGS_USER_INTERFACE_FONT_SIZE:
                this.userSettings.ui.fontSize = value as WorkspaceValues[typeof PROJECT_SETTINGS_USER_INTERFACE_FONT_SIZE];
                break;
            case PROJECT_SETTINGS_ACTIVE_TASK_LIST:
                this.projectSettings.activeTask = value as string;
                break;
            case PROJECT_SETTINGS_MAP_LEGEND:
                this.userSettings.mapLegend.withMapExtent = value as boolean;
                break;
            default:
                this.viewSettingsDirtyFlag = true;
        }

        switch (key) {
            case VIEW_SETTINGS_MAPCENTER:
                const mapPoint = value as WorkspaceValues[typeof VIEW_SETTINGS_MAPCENTER];

                this.viewSettings.mapCenter.x = mapPoint.x;
                this.viewSettings.mapCenter.y = mapPoint.y;
                this.viewSettings.mapCenter.h = mapPoint.h;
                break;
            case VIEW_SETTINGS_ZOOM_LEVEL:
                this.viewSettings.zoomLevel = value as WorkspaceValues[typeof VIEW_SETTINGS_ZOOM_LEVEL];
                break;
            case VIEW_SETTINGS_PARAMS3D:
                this.viewSettings.params3d = value as WorkspaceValues[typeof VIEW_SETTINGS_PARAMS3D];
                break;
            default:
                this.projectSettingsDirtyFlag = true;
        }

        if (this.projectSettingsDirtyFlag || this.viewSettingsDirtyFlag) {
            this.syncData();
        }

        this.map.trigger({type: 'workspacechanged', target: 'map', item: {key, value}});
    }

    getValue<K extends keyof WorkspaceValues>(key: K): WorkspaceValues[typeof key] {
        let result;
        switch (key) {
            case PROJECT_SETTINGS_SEARCH_FILTER_TYPE:
                result = this.projectSettings.searchResultSort.type;
                break;
            case PROJECT_SETTINGS_SEARCH_FILTER_DIRECTION:
                result = this.projectSettings.searchResultSort.direction;
                break;
            case PROJECT_SETTINGS_SEARCH_FILTER_SEMANTIC:
                result = this.projectSettings.searchResultSort.semantic;
                break;
            case PROJECT_SETTINGS_REFRESH_INTERVAL:
                result = this.userSettings.refreshInterval;
                break;
            case PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER:
                result = this.userSettings.measurementUnits.perimeter;
                break;
            case PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA:
                result = this.userSettings.measurementUnits.area;
                break;
            case PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE:
                result = this.userSettings.measurementUnits!.angle || AngleUnit.Degrees;
                break;
            case PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM:
                result = this.userSettings.cursorCoordinateSystem;
                break;
            case PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG:
                result = this.userSettings.ui.darkThemeFlag;
                break;
            case PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG:
                result = this.userSettings.ui.reduceSizeInterfaceFlag;
                break;
            case PROJECT_SETTINGS_USER_INTERFACE_PRIMARY_COLOR:
                result = this.userSettings.ui.primaryColor;
                break;
            case PROJECT_SETTINGS_USER_INTERFACE_SECONDARY_COLOR:
                result = this.userSettings.ui.secondaryColor;
                break;
            case PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS:
                result = this.userSettings.objectSearch.pixelRadius;
                break;
            case PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_DRAWING_TYPE:
                result = this.userSettings.objectSelectionStyle.drawingType;
                break;
            case PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_LINE_COLOR:
                result = this.userSettings.objectSelectionStyle.lineColor;
                break;
            case PROJECT_SETTINGS_OBJECT_SELECTION_SIGNATURES_SELECTION:
                result = this.userSettings.objectSelectionStyle.signaturesSelection;
                break;
            case PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR:
                result = this.userSettings.measurementsStyle.fillColor;
                break;
            case PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR:
                result = this.userSettings.measurementsStyle.lineColor;
                break;
            case PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY:
                result = this.userSettings.measurementsStyle.opacity;
                break;
            case PROJECT_SETTINGS_INITIAL_EXTENT_RESTORE_MAP_CONTENT:
                result = this.userSettings.initialExtentParam.resetMapContent;
                break;
            case PROJECT_SETTINGS_MAP_LOG_DEBUG_MODE:
                result = this.userSettings.mapLogParam.debugMode;
                break;
            case PROJECT_SETTINGS_LAYERS_VIEW_ORDER:
                result = this.projectSettings.layers
                    .sort((layerA, layerB) => (layerA.zIndex || 0) - (layerB.zIndex || 0))
                    .map(layer => layer.id);
                break;
            case PROJECT_SETTINGS_ID:
                result = this.projectSettings.id;
                break;
            case PROJECT_SETTINGS_HIDDEN_LAYERS:
                result = this.projectSettings.layers.filter(layer => layer.hidden).map(layer => layer.id);
                break;
            case PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_LIST:
                result = this.projectSettings.layers.map(({ id, selectedLegendObjectList }) => ({ id, selectedLegendObjectList }));
                break;
            case PROJECT_SETTINGS_SELECTED_LEGEND_OBJECT_STYLE_OPTION:
                result = this.projectSettings.layers.map(({ id, selectedLegendObjectStyleOptions }) => ({ id, selectedLegendObjectStyleOptions}));
                break;
            case PROJECT_SETTINGS_LAYERS_OPACITY:
                result = this.projectSettings.layers.filter(layer => layer.opacity !== undefined)
                    .map(({id, opacity}) => ({id, opacity}));
                break;
            case PROJECT_SETTINGS_LAYERS_BACKGROUND_ACTIVE:
                result = this.projectSettings.layers.find(layer => layer.backgroundactive) as LayerData;
                break;
            case PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL:
                result = this.projectSettings.layers.filter(layer => layer.dynamicLabel !== undefined)
                    .map(({ id, dynamicLabel }) => ({ id, dynamicLabel }));
                break;
            case PROJECT_SETTINGS_LAYER_PARAMETERS_ARRAY:
                result = this.projectSettings.layers;
                break;
            case PROJECT_SETTINGS_CONTENT_TREE_DISABLED_ARRAY:
                result = this.projectSettings.disabledNodes;
                break;
            case PROJECT_SETTINGS_VISIBLE_MODELS:
                result = this.projectSettings.visibleModels;
                break;
            case VIEW_SETTINGS_MAPCENTER:
                result = new MapPoint(this.viewSettings.mapCenter.x, this.viewSettings.mapCenter.y, this.viewSettings.mapCenter.h, this.projectSettings.tilematrixSet);
                break;
            case VIEW_SETTINGS_ZOOM_LEVEL:
                result = this.viewSettings.zoomLevel;
                break;
            case PROJECT_SETTINGS_TILEMATRIXSET:
                result = this.projectSettings.tilematrixSet;
                break;
            case VIEW_SETTINGS_PARAMS3D:
                result = this.viewSettings.params3d;
                break;
            case PROJECT_SETTINGS_SERVICE_URL:
                result = this.projectSettings.serviceUrl;
                break;
            case PROJECT_SETTINGS_PROTOCOL_MAP_EVENT:
                result = this.projectSettings.protocolMapEvent;
                break;
            case INITIAL_EXTENT_SETTINGS:
                result = {
                    mapCenter: new MapPoint(
                        this.projectSettings.initialExtent.mapCenter.x,
                        this.projectSettings.initialExtent.mapCenter.y,
                        this.projectSettings.initialExtent.mapCenter.h,
                        this.projectSettings.tilematrixSet
                    ),
                    zoomLevel: this.projectSettings.initialExtent.zoomLevel
                };
                break;
            case PROJECT_SETTINGS_USER_INTERFACE_FONT_SIZE:
                result = this.userSettings.ui.fontSize;
                break;
            case PROJECT_SETTINGS_ACTIVE_TASK_LIST:
                result = this.projectSettings.activeTask;
                break;
            case PROJECT_SETTINGS_MAP_LEGEND:
                result = this.userSettings.mapLegend.withMapExtent;
                break;
        }

        return result as WorkspaceValues[typeof key];
    }

    setComponentData(taskId: string, data: SimpleJson<any>): void {
        this.componentData[taskId] = data;
        this.componentsDataDirtyFlags[taskId] = true;
        this.syncData();
    }

    getComponentData(taskId: string): SimpleJson<any> | undefined {
        return this.componentData[taskId];
    }

    clearComponentData(taskId: string): void {
        delete this.componentData[taskId];
        this.componentsDataDirtyFlags[taskId] = true;
        this.syncData();
    }


    setJSON(id: string, data: GeoJsonType, locked = false): void {
        this.jsonData[id] = {data, locked};
        this.jsonDataDirtyFlag = true;
        this.syncData();
    }

    getJSON(id: string): GeoJsonType | undefined {
        const json = this.jsonData[id];
        if (json) {
            return json.data;
        }
    }

    removeJSON(id: string): void {
        delete this.jsonData[id];
        this.jsonDataDirtyFlag = true;
        this.syncData();
    }

    /**
     * Записать параметры обзора в хранилище
     * @async
     * @method writeViewSettings
     */
    async writeViewSettings() {
        this.viewSettingsDirtyFlag = false;
        await this.storageService?.setViewSettings(this.viewSettings).catch(e => console.log(this.map.translate('Error writing data to storage')));
    }

    /**
     * Записать параметры проекта в хранилище
     * @async
     * @method writeProjectSettings
     */
    async writeProjectSettings() {
        this.projectSettingsDirtyFlag = false;
        await this.storageService?.setProjectSettings(this.projectSettings).catch(e => console.log(this.map.translate('Error writing data to storage')));
    }

    /**
     * Записать параметры проекта в хранилище
     * @async
     * @method writeDefaultUserSettings
     */
    async writeDefaultUserSettings(): Promise<void> {
        if (this.defaultUserSettings) {
            await this.userStorageService?.setUserSettings(this.defaultUserSettings).catch(e => console.log(this.map.translate('Error writing data to storage')));
        }
        this.projectSettingsDirtyFlag = false;
    }

    /**
     * Записать параметры проекта в хранилище
     * @async
     * @method writeProjectUserSettings
     */
    async writeProjectUserSettings(): Promise<void> {
        await this.storageService?.setUserSettings(this.projectUserSettings as UserSettings).catch(e => console.log(this.map.translate('Error writing data to storage')));
        this.projectSettingsDirtyFlag = false;
    }

    /**
     * Записать данные компонентов в хранилище
     * @async
     * @method writeComponentData
     */
    async writeComponentData(taskId: string) {
        this.componentsDataDirtyFlags[taskId] = false;
        await this.storageService?.setComponentData(taskId, this.componentData[taskId]).catch(e => console.log(this.map.translate('Error writing data to storage')));
    }

    /**
     * Записать данные в хранилище
     * @async
     * @method writeJsonData
     */
    async writeJsonData() {
        this.jsonDataDirtyFlag = false;
        this.map.trigger({
            type: 'workspacechanged',
            target: 'map',
            item: {key: GEOJSON_DATA, value: this.jsonData}
        });
        await this.storageService?.setJsonData(this.jsonData).catch(e => console.log(this.map.translate('Error writing data to storage')));
    }

    async syncData() {
        if (this.viewSettingsDirtyFlag) {
            await this.writeViewSettings();
        }

        if (this.projectSettingsDirtyFlag) {
            await this.writeProjectSettings();
        }

        if (this.jsonDataDirtyFlag) {
            await this.writeJsonData();
        }

        for (const componentId in this.componentsDataDirtyFlags) {
            if (this.componentsDataDirtyFlags[componentId]) {
                await this.writeComponentData(componentId);
            }
        }
    }

    /**
     * Обновить параметры и настройки проекта
     * @async
     * @method resetWorkspaceSettings
     */
    async resetWorkspaceSettings(): Promise<void> {
        await this.readViewSettings();
        await this.readProjectSettings();
        await this.readDefaultUserSettings();
        await this.readProjectUserSettings();
        this.map.trigger({type: 'workspacereset', target: 'map'});
    }

    /**
     * Очистить
     * @private
     * @async
     * @method clear
     */
    private async clear(): Promise<void> {
        await this.storageService?.clearViewSettings();
        await this.storageService?.clearProjectSettings();
    }

    /**
     * Очистить пользовательские параметры проекта
     * @private
     * @async
     * @method clearProjectUserSettings
     */
    async clearProjectUserSettings(): Promise<void> {
        await this.storageService?.clearUserSettings();
    }

    /**
     * Прочитать параметры обзора из хранилища
     * @private
     * @method readViewSettings
     */
    private async readViewSettings(): Promise<void> {
        const currentSettings = await this.storageService?.getViewSettings();
        if (currentSettings) {
            this.updateViewSettings(currentSettings);
        }
    }

    private updateViewSettings(currentSettings: ContainsSomeOf<ViewSettings>): boolean {

        let updateFlag = false;

        if (currentSettings.mapCenter) {
            if (
                this.viewSettings.mapCenter.x !== currentSettings.mapCenter.x ||
                this.viewSettings.mapCenter.y !== currentSettings.mapCenter.y ||
                this.viewSettings.mapCenter.h !== currentSettings.mapCenter.h
            ) {
                updateFlag = true;
                this.viewSettings.mapCenter = currentSettings.mapCenter;
            }
        }

        if (currentSettings.zoomLevel) {
            if (this.viewSettings.zoomLevel !== currentSettings.zoomLevel) {
                updateFlag = true;
                this.viewSettings.zoomLevel = currentSettings.zoomLevel;
            }
        }

        if (currentSettings.params3d) {
            if (this.viewSettings.params3d.active !== currentSettings.params3d.active ||
                this.viewSettings.params3d.incline !== currentSettings.params3d.incline ||
                this.viewSettings.params3d.rotate !== currentSettings.params3d.rotate ||
                this.viewSettings.params3d.lightSource !== currentSettings.params3d.lightSource ||
                this.viewSettings.params3d.viewMode !== currentSettings.params3d.viewMode) {
                updateFlag = true;
                this.viewSettings.params3d = currentSettings.params3d;
            }
        }

        return updateFlag;
    }


    /**
     * Прочитать настройки проекта из хранилища
     * @async
     * @method readProjectSettings
     */
    async readProjectSettings(): Promise<void | string> {
        const currentSettings = await this.storageService?.getProjectSettings();
        if (currentSettings) {
            try {
                this.updateProjectSettings(currentSettings);
            } catch (error) {
                return currentSettings.id;
            }
        }
    }

    private updateProjectSettings(currentSettings: ContainsSomeOf<ProjectSettings> & {
        hiddenLayers?: string[];
        layersOpacity?: { id: string; opacity: number; }[];
        layersViewOrder?: string[];
        layoutsList?: { id: string; layouts: { id: string; description: EditorLayoutDescription | null; }[] }[];
        layersSelected?: { idLayer: string, selected: boolean }[];
    }): boolean {
        if (currentSettings.id !== undefined && currentSettings.id !== this.projectSettings.id) {
            throw new Error('Incorrect project');
        }

        if (currentSettings.tilematrixSet) {
            this.projectSettings.tilematrixSet = currentSettings.tilematrixSet;
        }

        if (currentSettings.serviceUrl) {
            this.projectSettings.serviceUrl = currentSettings.serviceUrl;
        }
        if (currentSettings.protocolMapEvent) {
            this.projectSettings.protocolMapEvent = currentSettings.protocolMapEvent;
        }
        if (currentSettings.layoutsList) {
            if (!this.componentData['gwtkmapeditor.main']) {
                this.componentData['gwtkmapeditor.main'] = {layoutsList: currentSettings.layoutsList};
            }
        }

        if (currentSettings.layersSelected) {
            if (!this.componentData['gwtkhome.main']) {
                this.componentData['gwtkhome.main'] = {subCategorySelected: currentSettings.layersSelected};
            }
        }

        if (currentSettings.layers) {
            this.projectSettings.layers = currentSettings.layers;
            for (let i = 0; i < currentSettings.layers.length; i++) {
                const layer = this.projectSettings.layers[i];
                const layerSettings = this.map.options.layers.find(mapOptionsLayer => mapOptionsLayer.id === layer.id);
                if (layerSettings && Object.prototype.hasOwnProperty.call(layerSettings, 'legend')) {
                    layer.selectedLegendObjectList = layer.selectedLegendObjectList || [];
                    layer.selectedLegendObjectStyleOptions = layer.selectedLegendObjectStyleOptions || { line: [], polygon: [], text: [], marker: [] };
                }
            }
        } else {
            if (currentSettings.layersOpacity) {
                this.projectSettings.layers.forEach(layer => layer.opacity = 1);

                currentSettings.layersOpacity.forEach(layerOpacity => {
                    let layerSettings = this.projectSettings.layers.find(currentLayer => currentLayer.id === layerOpacity.id);
                    if (!layerSettings) {
                        layerSettings = {id: layerOpacity.id};
                        this.projectSettings.layers.push(layerSettings);
                    }
                    layerSettings.opacity = layerOpacity.opacity;
                });
            }

            if (currentSettings.layersViewOrder) {
                this.projectSettings.layers.forEach(layer => layer.zIndex = 0);

                currentSettings.layersViewOrder.forEach((id, index) => {
                    let layerSettings = this.projectSettings.layers.find(currentLayer => currentLayer.id === id);
                    if (!layerSettings) {
                        layerSettings = {id};
                        this.projectSettings.layers.push(layerSettings);
                    }
                    layerSettings.zIndex = index;
                });
            }

            if (currentSettings.hiddenLayers) {
                this.projectSettings.layers.forEach(layer => delete layer.hidden);

                currentSettings.hiddenLayers.forEach(id => {
                    let layerSettings = this.projectSettings.layers.find(currentLayer => currentLayer.id === id);
                    if (!layerSettings) {
                        layerSettings = {id};
                        this.projectSettings.layers.push(layerSettings);
                    }
                    layerSettings.hidden = true;
                });
            }
        }

        if (currentSettings.disabledNodes) {
            this.projectSettings.disabledNodes = currentSettings.disabledNodes;
        }

        if (currentSettings.visibleModels) {
            this.projectSettings.visibleModels = currentSettings.visibleModels;
        }

        if (currentSettings.activeTask) {
            this.projectSettings.activeTask = currentSettings.activeTask;
        }
        //считаем, что всегда обновляется
        return true;
    }

    /**
     * Прочитать пользовательские настройки из хранилища
     * @async
     * @method readDefaultUserSettings
     */
    async readDefaultUserSettings(): Promise<void | string> {
        const currentSettings = await this.userStorageService?.getUserSettings();
        if (currentSettings) {
            try {
                this.updateDefaultUserSettings(currentSettings);
            } catch (error) {
                return currentSettings.id;
            }
            this.map.trigger({type: 'workspacereset', target: 'map'});
        }
    }

    /**
     * Прочитать настройки проекта из хранилища
     * @async
     * @method readProjectUserSettings
     */
    async readProjectUserSettings(): Promise<void | string> {
        const currentSettings = await this.storageService?.getUserSettings();
        if (currentSettings) {
            try {
                this.updateProjectUserSettings(currentSettings);
            } catch (error) {
                return currentSettings.id;
            }
        }
        this.map.trigger({type: 'workspacereset', target: 'map'});

    }

    private updateProjectUserSettings(currentSettings: ContainsSomeOf<UserSettings>): boolean {

        this.projectUserSettings = WorkspaceManager.createProjectSettings();
        this.projectUserSettings.id = this.projectSettings.id;

        if (currentSettings.refreshInterval) {
            this.projectUserSettings.refreshInterval = currentSettings.refreshInterval;
        }

        if (currentSettings.measurementUnits) {
            let currentMeasurementUnitsKey: keyof MeasurementUnits;
            for (currentMeasurementUnitsKey in currentSettings.measurementUnits) {
                (this.projectUserSettings.measurementUnits[currentMeasurementUnitsKey] as MeasurementUnits[typeof currentMeasurementUnitsKey]) = currentSettings.measurementUnits[currentMeasurementUnitsKey];
            }
        }

        if (currentSettings.cursorCoordinateSystem) {
            this.projectUserSettings.cursorCoordinateSystem = currentSettings.cursorCoordinateSystem;
        }
        const ui = currentSettings.ui;
        if (ui) {
            if (ui.darkThemeFlag !== undefined) {
                this.projectUserSettings.ui.darkThemeFlag = ui.darkThemeFlag;
            }
            if (ui.reduceSizeInterfaceFlag !== undefined) {
                this.projectUserSettings.ui.reduceSizeInterfaceFlag = ui.reduceSizeInterfaceFlag;
            }

            if (ui.primaryColor) {
                this.projectUserSettings.ui.primaryColor = ui.primaryColor;
            }
            if (ui.secondaryColor) {
                this.projectUserSettings.ui.secondaryColor = ui.secondaryColor;
            }
            if (ui.fontSize) {
                this.projectUserSettings.ui.fontSize = ui.fontSize;
            }
        }

        const mapLegend = currentSettings.mapLegend;
        if (mapLegend) {
            if (mapLegend.withMapExtent !== undefined) {
                this.projectUserSettings.mapLegend.withMapExtent = mapLegend.withMapExtent;
            }
        }

        const initialExtentParam = currentSettings.initialExtentParam;
        if (initialExtentParam && initialExtentParam.resetMapContent !== undefined) {
            this.projectUserSettings.initialExtentParam.resetMapContent = initialExtentParam.resetMapContent;
        } else {
            if (this.map.defaultMapOptions.initialextent !== undefined) {
                this.projectUserSettings.initialExtentParam.resetMapContent = this.map.defaultMapOptions.initialextent.resetmapcontent;
            }
        }

        const mapLogParam = currentSettings.mapLogParam;
        if (mapLogParam && mapLogParam.debugMode !== undefined) {
            this.projectUserSettings.mapLogParam.debugMode = mapLogParam.debugMode;
        } else {
            if (this.map.defaultMapOptions.initialextent !== undefined) {
                this.projectUserSettings.mapLogParam.debugMode = false;
            }
        }



        if (currentSettings.objectSearch) {
            let currentObjectSelectionStyleKey: keyof ObjectSearch;
            for (currentObjectSelectionStyleKey in currentSettings.objectSearch) {
                (this.projectUserSettings.objectSearch[currentObjectSelectionStyleKey] as ObjectSearch[typeof currentObjectSelectionStyleKey]) = currentSettings.objectSearch[currentObjectSelectionStyleKey];
            }
        }

        if (currentSettings.objectSelectionStyle) {
            let currentObjectSelectionStyleKey: keyof ObjectSelectionStyle;
            for (currentObjectSelectionStyleKey in currentSettings.objectSelectionStyle) {
                (this.projectUserSettings.objectSelectionStyle[currentObjectSelectionStyleKey] as ObjectSelectionStyle[typeof currentObjectSelectionStyleKey]) = currentSettings.objectSelectionStyle[currentObjectSelectionStyleKey];
            }
        }

        if (currentSettings.measurementsStyle) {
            let currentMeasurementsStyleKey: keyof MeasurementsStyle;
            for (currentMeasurementsStyleKey in currentSettings.measurementsStyle) {
                (this.projectUserSettings.measurementsStyle[currentMeasurementsStyleKey] as MeasurementsStyle[typeof currentMeasurementsStyleKey]) = currentSettings.measurementsStyle[currentMeasurementsStyleKey];
            }
        }

        //считаем, что всегда обновляется
        return true;

        //}
    }

    private updateDefaultUserSettings(currentSettings: ContainsSomeOf<UserSettings>): boolean {

        if (currentSettings.refreshInterval) {
            this.defaultUserSettings.refreshInterval = currentSettings.refreshInterval;
        }

        if (currentSettings.measurementUnits) {
            let currentMeasurementUnitsKey: keyof MeasurementUnits;
            for (currentMeasurementUnitsKey in currentSettings.measurementUnits) {
                (this.defaultUserSettings.measurementUnits[currentMeasurementUnitsKey] as MeasurementUnits[typeof currentMeasurementUnitsKey]) = currentSettings.measurementUnits[currentMeasurementUnitsKey];
            }
        }

        if (currentSettings.cursorCoordinateSystem) {
            this.defaultUserSettings.cursorCoordinateSystem = currentSettings.cursorCoordinateSystem;
        }
        const ui = currentSettings.ui;
        if (ui) {
            if (ui.darkThemeFlag !== undefined) {
                this.defaultUserSettings.ui.darkThemeFlag = ui.darkThemeFlag;
            }
            if (ui.reduceSizeInterfaceFlag !== undefined) {
                this.defaultUserSettings.ui.reduceSizeInterfaceFlag = ui.reduceSizeInterfaceFlag;
            }

            if (ui.primaryColor) {
                this.defaultUserSettings.ui.primaryColor = ui.primaryColor;
            }
            if (ui.secondaryColor) {
                this.defaultUserSettings.ui.secondaryColor = ui.secondaryColor;
            }
            if (ui.fontSize) {
                this.defaultUserSettings.ui.fontSize = ui.fontSize;
            }
        }
        if (currentSettings.objectSearch) {
            let currentObjectSelectionStyleKey: keyof ObjectSearch;
            for (currentObjectSelectionStyleKey in currentSettings.objectSearch) {
                (this.defaultUserSettings.objectSearch[currentObjectSelectionStyleKey] as ObjectSearch[typeof currentObjectSelectionStyleKey]) = currentSettings.objectSearch[currentObjectSelectionStyleKey];
            }
        }
        if (currentSettings.objectSelectionStyle) {
            let currentObjectSelectionStyleKey: keyof ObjectSelectionStyle;
            for (currentObjectSelectionStyleKey in currentSettings.objectSelectionStyle) {
                (this.defaultUserSettings.objectSelectionStyle[currentObjectSelectionStyleKey] as ObjectSelectionStyle[typeof currentObjectSelectionStyleKey]) = currentSettings.objectSelectionStyle[currentObjectSelectionStyleKey];
            }
        }

        if (currentSettings.measurementsStyle) {
            let currentMeasurementsStyleKey: keyof MeasurementsStyle;
            for (currentMeasurementsStyleKey in currentSettings.measurementsStyle) {
                (this.defaultUserSettings.measurementsStyle[currentMeasurementsStyleKey] as MeasurementsStyle[typeof currentMeasurementsStyleKey]) = currentSettings.measurementsStyle[currentMeasurementsStyleKey];
            }
        }

        //считаем, что всегда обновляется
        return true;
    }


    /**
     * Проверить устаревшее хранилище в LocalStorage
     * @private
     * @method oldVersionStorageCheck
     */
    private oldVersionStorageCheck(): void {
        if (this.map.options.noStorage) {
            return;
        }
        const localStorageService = new LocalStorageService();
        let location = window.location.href;

        location = location.slice(0, location.lastIndexOf('/') + 1);

        const appSettings = localStorageService.getAppSettings(location, this.map.options.username);
        if (appSettings) {
            const userId = appSettings.id;
            const version = appSettings.options[this.map.options.id] || '';

            if (version === this.projectSettings.version) {
                const currentSettings = localStorageService.getSettings(userId, this.map.options.id);
                const currentProjectSettings = localStorageService.getProjectSettings(userId, this.map.options.id);

                if (currentSettings) {
                    this.updateProjectSettings(currentSettings);
                }

                if (currentProjectSettings) {
                    currentProjectSettings.params3d.lightSource = LightSource.Projector;
                    currentProjectSettings.params3d.viewMode = ViewMode.Full;
                    this.updateProjectSettings(currentProjectSettings);
                    this.updateViewSettings(currentProjectSettings);
                }
            }
        }

    }

    /**
     * Проверить, что версия параметров хранилища совпадает с текущей
     * @private
     * @async
     * @method checkVersion
     */
    private async checkVersion(): Promise<boolean> {
        const currentSettings = await this.storageService?.getProjectSettings();
        return currentSettings ? currentSettings.version === this.projectSettings.version : false;
    }

    private parseMeasurementUnitsSettings(): MeasurementUnits {
        const measurement = {
            perimeter: Unit.Kilometers,
            area: Unit.SquareKilometers,
            angle: AngleUnit.Degrees
        };

        const selectedUnits = this.map.options.measurementunit;

        if (selectedUnits) {
            measurement.perimeter = WorkspaceManager.gwtkUnitConverter(selectedUnits.perimeter) as Unit || measurement.perimeter;
            measurement.area = WorkspaceManager.gwtkUnitConverter(selectedUnits.area) as Unit || measurement.area;
            // measurement.angle = WorkspaceManager.gwtkUnitConverter( selectedUnits.angle ) as AngleUnit || measurement.angle;
        }
        return measurement;
    }

    private static gwtkUnitConverter(gwtkUnit: string): AngleUnit | Unit | undefined {
        switch (gwtkUnit) {
            case 'ha':
                return Unit.Hectares;
            case 'sq km':
                return Unit.SquareKilometers;
            case 'sq m':
                return Unit.SquareMeters;
            case 'Nm':
                return Unit.NauticalMiles;
            case 'ft':
                return Unit.Foots;
            case 'km':
                return Unit.Kilometers;
            case 'm':
                return Unit.Meters;
            case 'grad':
                return AngleUnit.Degrees;
            case 'grad min sec':
                return AngleUnit.DegreesMinutesSeconds;
            case 'rad':
                return AngleUnit.Radians;
        }
    }

    async close(): Promise<void> {
        if (this.userStorageService) {
            await this.userStorageService.close();
        }
        return this.storageService?.close();
    }


    static createProjectSettings(): UserSettings {
        return {
            id: '-1',
            cursorCoordinateSystem: CursorCoordinateUnit.Meter,
            measurementUnits: {
                perimeter: Unit.Kilometers,
                area: Unit.SquareKilometers,
                angle: AngleUnit.Degrees,
                // totalFlag: false
            },
            measurementsStyle: {
                fillColor: '#FFFD59',
                lineColor: '#DA4447',
                opacity: 0.7
            },
            objectSearch: {
                pixelRadius: 6
            },
            objectSelectionStyle: {
                drawingType: SelectObjectDrawingType.Paint,
                lineColor: '#0000FF',
                signaturesSelection: SignaturesSelection.WhileEditorIsActive
            },
            refreshInterval: 0,
            ui: {
                reduceSizeInterfaceFlag: false,
                darkThemeFlag: false,
                primaryColor: '#1672ec',
                secondaryColor: '#424242',
                fontSize: FontSize.MediumFontSize
            },
            mapLegend: {
                withMapExtent: false
            },
            initialExtentParam: {
                resetMapContent: undefined
            },
            mapLogParam: {
                debugMode: false
            }
        };
    }
}

