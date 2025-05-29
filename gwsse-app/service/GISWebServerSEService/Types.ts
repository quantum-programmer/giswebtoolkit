import {GwtkOptions} from '~/types/Options';
import {ContainsSomeOf, SimpleJson} from '~/types/CommonTypes';
import {JSONData, ProjectSettings, UserSettings, ViewSettings} from '~/utils/WorkspaceManager';
import {Vector4D} from '~/3d/engine/core/Types';
import {ExportReportFontParameters, ExportReportVersion} from '../../components/GwtkExportReport/task/Types';


export type ProjectDescriptionParams = { cmd: string; projid: string; }
export type ProjectDescriptionResponse = { options: GwtkOptions }

export type SemanticTreeNodeDataItem = {
    type: 'text';
    value: string;
} | {
    type: 'number';
    value: number;
} | {
    type: 'list';
    value: number;
    items: { value: number; text: string; }[]
}
export type SemanticTreeNode = {
    id: string;
    name: string;
    children?: SemanticTreeNode[];
    data?: SemanticTreeNodeDataItem;
}

export type SemanticTreeNodeIdentifier = {
    identification: {
        id: number;
    }
}

export type SemanticTreeFile = {
    id: number;
    code: number;
    value: string;
    description: string;
};

export type SemanticTreeNodeResponse = {
    attributes: SemanticTreeNode[];
    files?: SemanticTreeFile[];
}


export type DBServiceResponse<T> = {
    status: 200 | 500,
    data: T;
    errorCode: {
        code: 10 | 20 | 30 | 40 | 41 | 50 | 60 | 70;
        message: string;
    }
}

export type AppParamsResponse = {
    settings: {
        appTitle: string;
        appDescription: string;
        counters: string;
        sess_updatekey: string;
    };
    projectsList: {
        index: number;
        projects: {
            id: number;
            text: string;
            description: string;
            image: { name: string; content: string; type: string; size: number; };
            usercontrols: { name: string; file?: string; }[];
            userplugins: { title: string; name: string; path: string; cssPath: string; }[];
            usertriggers: { title: string; name: string; path: string; }[];
        }[];
    };
    options: GwtkOptions;
    appParams: {
        version: string;
        locale: string;
        title: string;
        logo: string;
        isAdmin: boolean;
        loggedInFlag: boolean;
        authType: number;
        allowExit: boolean;
        geoDB: { url: string; title?: string; };
        userName: string;
        enterLink?: string;
        session: { username: string; defaultUser: string; }
    }
}


export type AddFilesRequestParams = {
    table: string;
    recordId: number;
    formData: {
        descriptions: string[];
        files: Blob[];
    }
}


export type AddFilesResponse = DBServiceResponse<undefined[]>;


export type GetFilesRequestParams = {
    table: string;
    recordId: number;
}

export type GetFilesResponse = DBServiceResponse<{ files: { id: number; file_description: string; }[] }>;


export type UpdateFilesRequestParams = {
    table: string;
    recordId: number;
    formData: {
        filesId: number[];
        descriptions: string[];
        files: Blob[];
    }
}

export type UpdateFilesResponse = DBServiceResponse<undefined[]>;

export type DeleteFilesRequestParams = {
    table: string;
    recordId: number;
    formData: {
        filesId: number[];
    }
}

export type DeleteFilesResponse = DBServiceResponse<undefined[]>;


export type SortFilesRequestParams = {
    table: string;
    recordId: number;
    formData: {
        filesId: number[];
    }
}

export type SortFilesResponse = DBServiceResponse<undefined[]>;


export type GetImageRequestParams = {
    id: number;
}


export type ResponseResultItemType = {
    key: string;
    value: SimpleJson;
};

export type ResponseResultType = {
    result: ResponseResultItemType[] | ResponseResultItemType | ContainsSomeOf<ProjectSettings> | JSONData | ContainsSomeOf<UserSettings> | ContainsSomeOf<ViewSettings>;
};

export type ResponseType = {
    status: string | number;
    errorCode: {
        message: string;
        code: string | number;
    };
    data: ResponseResultType | string;
};

export type BookmarksUpdate = {
    data: BookmarkValue[],  // данные которые надо обновить
    rules: BookmarkValue[], // условия обновления
    strict: boolean      // строгий режим использовать AND | OR
}

export type BookmarkValue = {
    fieldName: string,
    fieldValue: string
}


export type BookmarkSearch = {
    searchList: BookmarkSearchItem[];
    strict: boolean;
    limit: number;
    offset: number;
    order: BookmarkSearchOrder[]
};


type BookmarkSearchItem = {
    field: string;
    condition: string;
    value: string;
};

type BookmarkSearchOrder = {
    field: string;
    type: string;
}

export type ProjectBookmarksRequest = {
    status: string | number;
    errorCode: {
        message: string;
        code: string | number;
    },
    data: ProjectBookmarksRequestResult | string;
};

export type ProjectBookmarksRequestResult = {
    result: ProjectBookmarksRequestResultItem[];
    total: number;
};

export type ProjectBookmarksRequestResultItem = {
    create_time?: string,
    guid?: string,
    id?: string,
    is_public?: string,
    last_edit?: string,
    original_project_id?: string,
    parameters?: string,
    title?: string,
    user_id?: string
};

export type ExportReportFeatureCollectionLayer = {
    layerName: string;
    headers: SimpleJson;
    items: SimpleJson[];
};

export type ExportReportFeatureCollectionMap = {
    mapName: string;
    layers: {
        [layerId: string]: ExportReportFeatureCollectionLayer;
    };
};

export type ExportReportFeatureCollectionFormatted = {
    [mapId: string]: ExportReportFeatureCollectionMap;
};

export type ExportReportFeaturesParameters = {
    fontFamily: string;
    fontSize: number;
};

export type ExportReportDefaultItem = {
    code: string;
    text: string;
}

export type ExportReportPageOrientationItem = ExportReportDefaultItem;
export type ExportReportFontItem = ExportReportDefaultItem;
export type ExportReportPageFormatItem = ExportReportDefaultItem & {
    width: number;
    height: number;
};
export type ExportReportDateFormatItem = ExportReportDefaultItem;
export type ExportReportStampItem = ExportReportDefaultItem;

export type ExportReportFormatItem = ExportReportDefaultItem & {
    mimeType: string;
    fileExtension: string;
};

export type ExportReportDpiItem = ExportReportDefaultItem & {
    disabled?: boolean;
};

export type ExportReportLogotypeItem = {
    label: string;
    path: string;
};

export type ExportReportCoordinateGridStepsMetersItem = ExportReportDefaultItem;

export type ExportReportCoordinateGridStepsDegreesItem = ExportReportDefaultItem;

export type ExportReportAttributesFetchParameters = {
    title: string;
    headers: {
        [key: string]: string;
    };
    width?: {
        [key: string]: number;
    };
};

export type ExportReportAttributes = ExportReportAttributesFetchParameters & {
    count?: number;
    items: {
        [key: string]: any;
    }[];
    fontFamily: string;
    fontSize: number;
};


export type FetchExportReportInitialsResponse = DBServiceResponse<{
    formats: ExportReportFormatItem[];
    dpi: ExportReportDpiItem[];
    pageFormats: ExportReportPageFormatItem[];
    pageOrientations: ExportReportPageOrientationItem[];
    fonts: ExportReportFontItem[];
    logotypes: ExportReportLogotypeItem[];
    coordinateGridStepsMeters: ExportReportCoordinateGridStepsMetersItem[];
    coordinateGridStepsDegrees: ExportReportCoordinateGridStepsDegreesItem[];
    dateFormats: ExportReportDateFormatItem[];
    stamps: ExportReportStampItem[];
    publicTemplates: string[];
    localTemplates: string[];
}>;

type ExportReportShowParameters = {
    logotype: boolean;
    headers: boolean;
    legend: boolean;
    northArrow: boolean;
    scale: boolean;
    scaleBar: boolean;
    coordinateSystem: boolean;
    coordinateGrid: boolean;
    features: boolean;
    pageNumeration: boolean;
    date: boolean;
    stamp: boolean;
};


export type ExportReportBBox = Vector4D;

export type ExportReportPageMargins = Vector4D;

export type ExportReportPageParameters = {
    format: ExportReportPageFormatItem['code'];
    orientation: ExportReportPageOrientationItem['code'];
    margins: {
        top: ExportReportPageMargins[0];
        right: ExportReportPageMargins[1];
        bottom: ExportReportPageMargins[2];
        left: ExportReportPageMargins[3];
    };
};

export type ExportReportLogotypeRequestParameters = {
    data: string;
    position: {
        top: number;
        left: number;
    };
};

export type ExportReportHeaderItem = {
    text: string;
    fontFamily: string;
    fontSize: number;
};

export type ExportReportLegendParameters = {
    iconSize: number;
    fontFamily: string;
    fontSize: number;
    position?: {
        bottom: number;
        right: number;
    };
    aboveMap: boolean;
};

export type ExportReportLegendKeyData = {
    url?: string;
    name: string;
};

export type ExportReportLegendFormatted = {
    [schemeName: string]: {
        [groupCode: string]: {
            name: string;
            keys: ExportReportLegendKeyData[];
        };
    };
};

export type ExportReportScaleBarCalculated = {
    width: number;
    value: number;
    unit: string;
};

export enum ExportReportCoordinateSystemType {
    Meters,
    Degrees
}

export type ExportReportCoordinateGridParameters = {
    bBox: ExportReportBBox;
    systemType: ExportReportCoordinateSystemType;
    step: number;
};

export type ExportReportPageNumerationParameters = {
    fontFamily: string;
    fontSize: number;
    bottom: number;
};

export type ExportReportStampParameters = {
    type: ExportReportStampItem['code'];
    typeDescription: string;
    fontFamily: string;
    fontSize: number;
    organizationName: string;
    organizationAddress: string;
};

export type ExportReportBodyForMakeReport = {
    format: ExportReportFormatItem['code'];
    width: number;
    height: number;
    show: ExportReportShowParameters;
    dpi: ExportReportDpiItem['code'];
    page?: ExportReportPageParameters;
    font: ExportReportFontParameters;
    logotype?: ExportReportLogotypeRequestParameters;
    headers?: ExportReportHeaderItem[];
    mapImages: string[];
    legend?: ExportReportLegendParameters;
    legendData?: ExportReportLegendFormatted;
    scale?: string;
    scaleBar?: ExportReportScaleBarCalculated;
    coordinateSystem?: string;
    coordinateGridOptions?: ExportReportCoordinateGridParameters;
    features?: ExportReportFeatureCollectionFormatted;
    featuresParameters?: ExportReportFeaturesParameters;
    pageNumeration?: ExportReportPageNumerationParameters;
    date?: string;
    stamp?: ExportReportStampParameters;
    attributes?: ExportReportAttributes;
    reportVersion: ExportReportVersion;
};

export type AddingUserMap = {
    alias: string;
    path: string;
    scheme: string;
    isPublic: boolean;
    selectObject: boolean
};

export type DeletingUserMap = {
    id: string;
};
