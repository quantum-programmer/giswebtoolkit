import {SimpleJson} from '~/types/CommonTypes';
import {Objects3dDescription} from '~/3d/engine/worker/workerscripts/object3dcreator';
import {Vector4D} from '~/3d/engine/core/Types';
import {TreeNodeType} from '~/utils/MapTreeJSON';
import {LayerTextFilter} from '~/types/LayerOptions';
import {TranslateDescription} from '~/translate/Types';
import { UIParams } from '~/utils/WorkspaceManager';
import { GwtkMapLegendItemReduced, SldBuildObject } from './Types';

export enum SearchType {
    Address = 'address',
    Map = 'map',
    Rosreestr = 'rosreestr',
    Nspd = 'nspd',
}

export enum AddressServiceType {
    Osm = 'Osm',
    Yandex = 'Yandex',
    PanoramaAddressBase = 'PanoramaAddressBase',
    Unknown = 'Unknown'

}


export type HeatMapOptions = {
    LayerName: string;
    alias: string;
    elemsize: number;
    excodes: number[];
    palette: number;
    palettecount: number;
    radius: number;
    layerAlias?: string;
};

export type ToolbarGroupsOptions = {
    id: string;
    items: string[]
}[];

export type MapMarkersOptions = {
    deleteimage?: string;
    getcategory?: string;
    getimages?: string;
    images?: string[];
    saveimage?: string;
}

export type MapOverviewOptions = {
    zoomStep: number;
    width?: number;
    height?: number;
    url: string;
    active?: true;
}

export enum SourceRoutes {
    Panorama = 'Panorama',
    Yandex = 'Yandex',
    YandexRouter = 'YandexRouter',
}

export type GwtkOptions = {
    cartogram?: UserThematicOptions,
    center: [number, number];
    cluster?: {
        json: string
        url: string
    };
    contenttree: ContentTree[];
    contenttreeviewtype?: 'bygroups' | 'byorder' | 'tree';
    controls: string[];
    controlsdata?: {
        initialextent?: { resetmapcontent: boolean; };
        projects?: { hideIfSingle: boolean; };
        exportReport?: { services: string[]; };
    };
    controlspanel: boolean;
    extauth: boolean;
    authheader: string,
    forcedParams?: ForcedParameters;
    helpUrl: string;
    highlightmode: string;
    holdFolderTreeNodes?: boolean;
    hm_options?: HeatMapOptions[];
    toolbarGroups?: ToolbarGroupsOptions;
    id: string;
    isgeocenter?: boolean;
    layers: GwtkLayerDescription[];
    tempVirtualFolders?: {
        folders: {
            alias: string,
            folder: string
        }[],
        url: string
    }
    locale: string;
    loggedbefore: boolean;
    mapmarkers?: MapMarkersOptions;
    matrix?: {
        id: string;
        alias: string;
        url: string;
        authtype: string;
    }[];
    maxbounds?: Vector4D;
    maxzoom: number;
    measurementunit?: {
        perimeter: string;
        area: string;
    };
    mergewmslayers: boolean;
    minzoom: number;
    mymaps?: {
        url: string;
        virtualFolderList: string [];
    }[];
    mapoverview?: MapOverviewOptions;
    noStorage?: true;
    mapmarks?: {
        url: string;
        zoom: number;
        layerid: string;
    };
    floodZone?: {
        url: string;
        matrixList: { id: string, name: string }[],
        virtualFolderList: { id: string, name: string }[]
    };
    objectinfo: {
        number: boolean;
        area: boolean;
        semantic: boolean;
    };
    objects3d?: (Objects3dSettings | Models3dSettings)[];
    pamauth: boolean;
    params3d: {
        quality: number;
        active: boolean;
        rotate: number;
        incline: number;
    };
    reliefprofiles?: {
        alias: string;
        authtype: string;
        id: string;
        layerid: string;
        url: string;
    }[];
    remoteServices?: ({ type: 'Yandex' | 'YandexRouter' | 'Osm' | 'Rosreestr'; apikey: string; url: string; })[]
    routecontrol?: {
        url: string;
        layer?: string
        alias: string;
        type: SourceRoutes;
        authtype?: string;
    }[];
    scenario3d?: ScenarioDescription[];
    search_options?: SearchSettings;
    servicepam: boolean;
    settings_mapEditor?: EditorSettings;
    shortlegend: number;
    showsettings: boolean;
    tilematrix: number;
    tilematrixset: 'GoogleMapsCompatible' | string;
    url: string;
    useform: boolean;
    username: string;
    usetoken: boolean;
    copyright?: CopyRightSettings;
    layerprojection?: SimpleJson<TranslateDescription>;
    themeSettings?: UIParams;
    storageFolders?: {
        serviceUrl?: string;
        publicStorage: string;
        userStorage: string;
    };
} & SimpleJson<any>;

export type UserThematicOptions = {
    data?: { alias: string; url: string; }[];
    source?: {
        folders?: { alias: string; folder: string; }[];
        layers: {
            alias: string;
            id: string;
            keylist?: string; // список ключей через запятую
            semlink: string;
            semlinkname: string;
        }[];
        url: string;
    } [];
}

export type ContentTree = {
    id: string
    text: string
    img?: string
    imgurl?: string
    expanded?: boolean
    clickable?: boolean
    nodeType?: TreeNodeType;
    exportTypes?: string[];
    nodes?: ContentTree[];

    group?: true;
    parentId?: string;

    backgroundactive?: 1;
    backgroundimage?: string;

    owner?: string;
    isPublic?: 1;
}


type EditingData = {
    layerid: string;
    objects: {
        code: string;
        semantics: string[];
    }[];
}

export type EditorSettings = {
    maplayersid: string[],
    functions: ('*' | 'edit' | 'delete' | 'create')[]
    editingdata: EditingData[]
    selectlayersid?: string[],
    info?: string[],
    transaction?: boolean,
    oldversion?: number,
    virtualfolders?: {
        id: string;
        paths?: string[];
    }[],
    hideLayouts?: boolean;
}

export type LayerTooltip = {
    objectName?: boolean;
    layerName?: boolean;
    image?: boolean;
    semanticKeys?: string[];
}

type LayerDataType = 'MAP' | 'SIT' | 'SITX' | 'MPT' | 'MTW' | 'MTL' | 'MTQ' | 'RSW';

export type GwtkLayerDescription = {
        authtype?: 'pam';
        alias: string;
        export?: string[];
        folder?: string;
        hidden?: number;
        id: string;
        xId?: string;
        layerContainer?: HTMLDivElement;
        objnamesemantic?: string[];
        opacityValue?: number;                  // От 0 до 100
        options?: {
            duty?: boolean;
            opacityValue?: number;
        };
        selectObject?: boolean;
        url: string;
        filter?: {
            keylist?: string;
            textfilter?: LayerTextFilter;
            idlist?: string;
        };
        waterColors?: (string | number)[];
        getKeyListParamString?: () => { keylist: string; } | '';
        enabled?: boolean;
        service?: 'wms' | 'wmts';
        datatype?: LayerDataType[] | string;//TODO: непредсказуемый администратор
        tooltip?: LayerTooltip;
        tags?: string[];
        zIndex?: number;
        imageSemantics?: string[];
        externalFunctions?: ExternalFunctions;
        selectedLegendObjectList?: GwtkMapLegendItemReduced[];
        selectedLegendObjectStyleOptions?: SldBuildObject;
        mapdb?: boolean;
        minzoomview?: number;
        maxzoomview?: number;
        legendLayerKeys?: string[];
        ownerLogin?: string;
        isPublic?: 1;
        legendObjectTextValues?: { include: string[], exclude: string[] };
        corsNotAllowed?: boolean;
    }
    & SimpleJson<any>

export interface Models3dSettings {
    id: string;
    alias: string;
    url: string;
    hidden: 0 | 1;
    idLayer: string;
    zoomLevels?: string[];
    authtype?: string;
}

interface Objects3dSettings {
    id: string;
    obj: Objects3dDescription[];
    options: {
        minzoom?: number;
        maxzoom?: number;
    };
}

export type ScenarioDescription = {
    id: string;
    alias: string;
    url: string;
    description: string;
}

export type SearchSettings = {
    map: { // поиск объекта карты
        id?: string;
        visible: 1 | 0; // отображать или нет в панели компонента,
        text?: string;  //TODO: добавить это поле в параметры!!!
    }
    address: { // поиск адреса
        visible: 1 | 0 // отображать или нет в панели компонента
        text?: string; //TODO: добавить это поле в параметры!!!
        default: number // порядковый номер сервиса поиска адреса по умолчанию
        sources: { // массив сервисов (источников)
            type: AddressServiceType;
            alias: string; // наименование сервиса (отображается в списке)
            url: string; // URL сервера поиска
            result: number;
        }[]
    }
    rosreestr: { // поиск в Росреестре (по кадастровому номеру)
        id?: string;
        visible: 1 | 0 // отображать или нет в панели компонента
        text?: string;//TODO: добавить это поле в параметры!!!
    }
    default: SearchType // вид поиска по умолчанию ('map', 'address' или 'rosreestr')
};
export type CopyRightSettings = {
    name?: string;
    startYear?: string;
    endYear?: string;
    privacyPolicy?: PrivacyPolicySettings
};


type OptionsAngleUnit = 'grad' | 'grad min sec' | 'rad';
type OptionsSquareUnit = 'ha' | 'sq km' | 'sq m';
type OptionsUnit = 'Nm' | 'ft' | 'km' | 'm';

type MeasurementSettingsSelected = {
    perimeter: OptionsUnit;
    area: OptionsSquareUnit;
    angle: OptionsAngleUnit
}

export type MeasurementSettings = {
    selected: MeasurementSettingsSelected
    show?: '0' | '1'
}

export type PrivacyPolicySettings = {
    alias: string
    url?: string;

}

export interface ForcedParameters {
    b?: string;
    l?: string;
    z?: string;
    layers?: string;
    rotate?: string;
    incline?: string;
    models3d?: string;
    projectid?: string;
    activetask?: string;
    idLayerObjectNumberKey?: string;
    objcard?: string //'xid:attrKey:attrValue';
    objcardact?: ('opencard'| 'fitmapobject')|string;
    mapmark?: string;
    objectname?: string;
    // objid?:string;
    // ol?:string;
}

export type ExternalFunctions = { name: string; description: string }[];
