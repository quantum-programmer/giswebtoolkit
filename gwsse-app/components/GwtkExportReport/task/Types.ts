import Layer from '~/maplayers/Layer';
import Classifier from '~/classifier/Classifier';
import {
    ExportReportAttributes,
    ExportReportAttributesFetchParameters,
    ExportReportCoordinateGridStepsDegreesItem,
    ExportReportCoordinateGridStepsMetersItem,
    ExportReportCoordinateSystemType,
    ExportReportDateFormatItem,
    ExportReportDpiItem,
    ExportReportFontItem,
    ExportReportFormatItem,
    ExportReportHeaderItem,
    ExportReportLegendKeyData,
    ExportReportPageFormatItem,
    ExportReportPageMargins,
    ExportReportPageOrientationItem,
    ExportReportStampItem
} from '../../../service/GISWebServerSEService/Types';
import GwtkExportReportTask from './GwtkExportReportTask';
import {Logotype} from './classes/Logotype';


export type ExportReportPageOptions = {
    format: ExportReportPageFormatItem['code'];
    orientation: ExportReportPageOrientationItem['code'];
    margins: ExportReportPageMargins;
    maxMargin: number;
};

export type ExportReportFontOptions = {
    family: ExportReportFontItem['code'];
    size: number;
    minFontSize: number;
    maxFontSize: number;
};

export type ExportReportFontParameters = {
    family: ExportReportFontItem['code'];
    size: number;
};

export type ExportReportIconSizeItem = {
    code: number;
    text: string;
};

export type ExportReportLogotypeParameters = {
    logotype: number;
    position: {
        top: number;
        left: number;
    };
    maxPosition: number;
};


export type ExportReportHeaderOptions = {
    headers: ExportReportHeaderItem[];
    maxLength: number;
    minFontSize: number;
    maxFontSize: number;
};

export type ExportReportFeaturesOptions = {
    fontFamily: string;
    fontSize: number;
    minFontSize: number;
    maxFontSize: number;
};

export type ExportReportAttributesOptions = {
    limit: number;
    fontFamily: string;
    fontSize: number;
    minFontSize: number;
    maxFontSize: number;
};

export type ExportReportPageNumerationOptions = {
    fontFamily: string;
    fontSize: number;
    bottom: number;
    minFontSize: number;
    maxFontSize: number;
    maxBottom: number;
};

export type ExportReportLegendOptions = {
    iconSize: number;
    fontFamily: string;
    fontSize: number;
    position: {
        right: number;
        bottom: number;
    };
    aboveMap: boolean;
    minFontSize: number;
    maxFontSize: number;
    maxPosition: number;
};

export type ExportReportDateOptions = {
    format: ExportReportDateFormatItem['code'];
};

export type ExportReportStampOptions = {
    type: ExportReportStampItem['code'];
    typeDescription: string;
    fontFamily: string;
    fontSize: number;
    organizationName: string;
    organizationAddress: string;
    minFontSize: number;
    maxFontSize: number;
    maxLength: number;
};


export type ExportReportConstructorOptions = {
    templateTitle: string;
    format: ExportReportFormatItem['code'];
    dpi: ExportReportDpiItem['code'];
    pageOptions: ExportReportPageOptions;
    font: ExportReportFontOptions;
    showLogotype: boolean;
    logotypeOptions: ExportReportLogotypeParameters;
    showHeaders: boolean;
    headerOptions: ExportReportHeaderOptions;
    showLegend: boolean;
    legendOptions: ExportReportLegendOptions;
    showNorthArrow: boolean;
    showScale: boolean;
    showScaleBar: boolean;
    showCoordinateSystem: boolean;
    showCoordinateGrid: boolean;
    coordinateGridOptions: ExportReportCoordinateGridOptions;
    showFeatures: boolean;
    featuresOptions: ExportReportFeaturesOptions;
    showAttributes: boolean;
    attributesOptions: ExportReportAttributesOptions;
    showPageNumeration: boolean;
    pageNumerationOptions: ExportReportPageNumerationOptions;
    showDate: boolean;
    dateOptions: ExportReportDateOptions;
    showStamp: boolean;
    stampOptions: ExportReportStampOptions;
    reportVersion: ExportReportVersion;
};

export type ExportReportConstructorOptionsExtended = ExportReportConstructorOptions & {
    layersSelected?: string[];
    attributesFetchParameters?: ExportReportAttributesFetchParameters;
};

export type ExportReportWidgetParams = {
    setState: GwtkExportReportTask['setState'];
    layerIds: Layer['id'][];
    layersSelected: Layer[];
    isLegendAvailable: boolean;
    setLayersSelected: Layer['id'][];
    useLayersFromTemplate: boolean;
    layersSelectedFromTemplate: Layer['id'][];
    formats: ExportReportFormatItem[];
    pageFormats: ExportReportPageFormatItem[];
    pageOrientations: ExportReportPageOrientationItem[];
    fonts: ExportReportFontItem[];
    dpi: ExportReportDpiItem[];
    logotypes: Logotype[];
    featuresSelected: boolean;
    attributes: ExportReportAttributes | null;
    attributesFetchParameters: ExportReportAttributesFetchParameters | null;
    useAttributesFetchParameters: boolean;
    isAttributesFetching: boolean;
    iconSizes: ExportReportIconSizeItem[];
    coordinateGridStepsMeters: ExportReportCoordinateGridStepsMetersItem[];
    coordinateGridStepsDegrees: ExportReportCoordinateGridStepsDegreesItem[];
    dateFormats: ExportReportDateFormatItem[];
    stamps: ExportReportStampItem[];
    constructorOptions: ExportReportConstructorOptions;
    exporting: boolean;
    progress: ExportReportProgress;
    constructorTemplatesPublic: ExportReportConstructorOptionsExtended[];
    constructorTemplatesLocal: ExportReportConstructorOptionsExtended[];
    isLogged: boolean;
    isAdmin: boolean;
    userName: string;
};

export type ExportReportProgress = {
    [ExportReportProgressStage.Prepare]: number;
    [ExportReportProgressStage.Legend]: number;
    [ExportReportProgressStage.Report]: number;
};


export type ExportReportPageMarginSet = {
    index: number;
    margin: number;
};

export type ExportReportHeaderTextSet = {
    index: number;
    text: string;
};

export type ExportReportHeaderFontFamilySet = {
    index: number;
    fontFamily: string;
};

export type ExportReportHeaderFontSizeSet = {
    index: number;
    fontSize: number;
};

export type ServiceUrlAndLayers = {
    serviceUrl: string;
    layers: Layer[];
};

export type ExportReportClassifiers = {
    [schemeName: string]: Classifier;
};

export type ExportReportStatisticKeys = {
    [schemeName: string]: {
        [group: string]: {
            name: string;
            keys: string[];
        };
    };
};

export type ExportReportLegendDataIndexed = {
    [schemeName: string]: {
        [key: string]: ExportReportLegendKeyData;
    };
};


export type ExportReportCoordinateGridOptions = {
    systemType: ExportReportCoordinateSystemType;
    stepMeters: number;
    stepDegrees: number;
};

export enum ExportReportProgressStage {
    Prepare,
    Legend,
    Report
}

export enum ExportReportVersion {
    Native,
    Transneft
}

export type ExportReportImageParametersForPdf = {
    width: number,
    height: number,
    scale: number
};

export type ExportReportAddTemplateParameters = {
    templateTitle: string;
    templateType: ExportReportTemplateType;
};

export enum ExportReportTemplateType {
    Public,
    Personal
}

export type ExportReportSelectTemplateParameters = {
    templateIndex: number;
    templateType: ExportReportTemplateType;
};
