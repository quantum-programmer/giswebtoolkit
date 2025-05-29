import MapWindow from '~/MapWindow';
import Task from '~/taskmanager/Task';
import {GwtkComponentDescriptionPropsData} from '~/types/Types';
import GwtkExportReportWidget from './GwtkExportReportWidget.vue';
import {
    ExportReportAddTemplateParameters,
    ExportReportAttributesOptions,
    ExportReportConstructorOptions,
    ExportReportConstructorOptionsExtended,
    ExportReportDateOptions,
    ExportReportFeaturesOptions,
    ExportReportFontParameters,
    ExportReportHeaderFontFamilySet,
    ExportReportHeaderFontSizeSet,
    ExportReportHeaderTextSet,
    ExportReportIconSizeItem,
    ExportReportLegendOptions,
    ExportReportLogotypeParameters,
    ExportReportPageMarginSet,
    ExportReportPageNumerationOptions,
    ExportReportProgress,
    ExportReportProgressStage,
    ExportReportSelectTemplateParameters,
    ExportReportStampOptions,
    ExportReportTemplateType,
    ExportReportVersion,
    ExportReportWidgetParams
} from './Types';
import {DataChangedEvent} from '~/taskmanager/TaskManager';
import Layer from '~/maplayers/Layer';
import i18n from '@/plugins/i18n';
import {Exporter} from './classes/Exporter';
import GISWebServerSEService from '../../../../gwsse-app/service/GISWebServerSEService';
import {LogEventType, SimpleJson} from '~/types/CommonTypes';
import {getDateWithFormat} from './helpers/DateHelper';
import {
    ExportReportAttributes,
    ExportReportCoordinateSystemType,
    ExportReportDefaultItem,
    ExportReportDpiItem,
    ExportReportFontItem,
    ExportReportHeaderItem,
    ExportReportPageOrientationItem,
    ExportReportPageParameters,
    FetchExportReportInitialsResponse
} from '../../../service/GISWebServerSEService/Types';
import MapObject from '~/mapobject/MapObject';
import {Logotype} from './classes/Logotype';
import {TileLayer} from '~/maplayers/TileLayer';
import {isLayerServiceSupported} from './helpers/LayerHelper';
import {BrowserService} from '~/services/BrowserService';
import AppWindow from '../../../AppWindow';

export const EXPORT_REPORT_DEFAULT_DPI = '96';
export const EXPORT_REPORT_DEFAULT_FONT_FAMILY = 'DejaVuSans';

const MAX_SERVICE_IMAGE_WIDTH = 16384;
const MAX_SERVICE_IMAGE_HEIGHT = 8192;

const ICON_SIZES = [16, 24, 32, 40, 48, 56, 64, 80, 96];

// fixme: Внимание! Установить правильное значение версии!
const EXPORT_REPORT_VERSION: ExportReportVersion = ExportReportVersion.Native;
// const EXPORT_REPORT_VERSION: ExportReportVersion = ExportReportVersion.Transneft;

export const EXPORT_REPORT_TOGGLE_LAYERS_SELECTED_FROM_TEMPLATE = 'exportReport.toggleLayersSelectedFromTemplate';
export const EXPORT_REPORT_SET_LAYERS_SELECTED = 'exportReport.setLayers';
export const EXPORT_REPORT_SET_FILE_FORMAT = 'exportReport.setFileFormat';
export const EXPORT_REPORT_SET_DPI = 'exportReport.setDpi';
export const EXPORT_REPORT_SET_PAGE_FORMAT = 'exportReport.setPageFormat';
export const EXPORT_REPORT_SET_PAGE_ORIENTATION = 'exportReport.setPageOrientation';
export const EXPORT_REPORT_SET_PAGE_MARGIN = 'exportReport.setPageMargin';
export const EXPORT_REPORT_SET_FONT_FAMILY = 'exportReport.setFontFamily';
export const EXPORT_REPORT_SET_FONT_SIZE = 'exportReport.setFontSize';
export const EXPORT_REPORT_SET_SHOW_LOGOTYPE = 'exportReport.setShowLogotype';
export const EXPORT_REPORT_SET_LOGOTYPE = 'exportReport.setLogotype';
export const EXPORT_REPORT_SET_LOGOTYPE_POSITION_TOP = 'exportReport.setLogotypePositionTop';
export const EXPORT_REPORT_SET_LOGOTYPE_POSITION_LEFT = 'exportReport.setLogotypePositionLeft';
export const EXPORT_REPORT_SET_SHOW_HEADERS = 'exportReport.setShowHeaders';
export const EXPORT_REPORT_SET_HEADER_TEXT = 'exportReport.setHeaderText';
export const EXPORT_REPORT_SET_HEADER_FONT_FAMILY = 'exportReport.setHeaderFontFamily';
export const EXPORT_REPORT_SET_HEADER_FONT_SIZE = 'exportReport.setHeaderFontSize';
export const EXPORT_REPORT_ADD_HEADER = 'exportReport.addHeader';
export const EXPORT_REPORT_REMOVE_HEADER = 'exportReport.removeHeader';
export const EXPORT_REPORT_SET_SHOW_LEGEND = 'exportReport.setShowLegend';
export const EXPORT_REPORT_SET_LEGEND_ICON_SIZE = 'exportReport.setLegendIconSize';
export const EXPORT_REPORT_SET_LEGEND_FONT_FAMILY = 'exportReport.setLegendFontFamily';
export const EXPORT_REPORT_SET_LEGEND_FONT_SIZE = 'exportReport.setLegendFontSize';
export const EXPORT_REPORT_SET_LEGEND_POSITION_RIGHT = 'exportReport.setLegendPositionRight';
export const EXPORT_REPORT_SET_LEGEND_POSITION_BOTTOM = 'exportReport.setLegendPositionBottom';
export const EXPORT_REPORT_SET_LEGEND_ABOVE_MAP = 'exportReport.setLegendAboveMap';
export const EXPORT_REPORT_SET_SHOW_NORTH_ARROW = 'exportReport.setShowNorthArrow';
export const EXPORT_REPORT_SET_SHOW_SCALE = 'exportReport.setShowScale';
export const EXPORT_REPORT_SET_SHOW_SCALE_BAR = 'exportReport.setShowScaleBar';
export const EXPORT_REPORT_SET_SHOW_COORDINATE_SYSTEM = 'exportReport.setShowCoordinateSystem';
export const EXPORT_REPORT_SET_SHOW_COORDINATE_GRID = 'exportReport.setShowCoordinateGrid';
export const EXPORT_REPORT_SET_COORDINATE_GRID_SYSTEM_TYPE = 'exportReport.setCoordinateGridSystemType';
export const EXPORT_REPORT_SET_COORDINATE_GRID_STEP_METERS = 'exportReport.setCoordinateGridStepMeters';
export const EXPORT_REPORT_SET_COORDINATE_GRID_STEP_DEGREES = 'exportReport.setCoordinateGridStepDegrees';
export const EXPORT_REPORT_SET_SHOW_FEATURES = 'exportReport.setShowFeatures';
export const EXPORT_REPORT_SET_FEATURES_FONT_FAMILY = 'exportReport.setFeaturesFontFamily';
export const EXPORT_REPORT_SET_FEATURES_FONT_SIZE = 'exportReport.setFeaturesFontSize';
export const EXPORT_REPORT_SET_SHOW_ATTRIBUTES = 'exportReport.setShowAttributes';
export const EXPORT_REPORT_TOGGLE_AND_UPDATE_ATTRIBUTES = 'exportReport.toggleAndUpdateAttributes';
export const EXPORT_REPORT_SET_ATTRIBUTES_FONT_FAMILY = 'exportReport.setAttributesFontFamily';
export const EXPORT_REPORT_SET_ATTRIBUTES_FONT_SIZE = 'exportReport.setAttributesFontSize';
export const EXPORT_REPORT_SET_SHOW_PAGE_NUMERATION = 'exportReport.setShowPageNumeration';
export const EXPORT_REPORT_SET_PAGE_NUMERATION_FONT_FAMILY = 'exportReport.setPageNumerationFontFamily';
export const EXPORT_REPORT_SET_PAGE_NUMERATION_FONT_SIZE = 'exportReport.setPageNumerationFontSize';
export const EXPORT_REPORT_SET_PAGE_NUMERATION_BOTTOM = 'exportReport.setPageNumerationBottom';
export const EXPORT_REPORT_SET_SHOW_DATE = 'exportReport.setShowDate';
export const EXPORT_REPORT_SET_DATE_FORMAT = 'exportReport.setDateFormat';
export const EXPORT_REPORT_SET_SHOW_STAMP = 'exportReport.setShowStamp';
export const EXPORT_REPORT_SET_STAMP_TYPE = 'exportReport.setStampType';
export const EXPORT_REPORT_SET_STAMP_FONT_FAMILY = 'exportReport.setStampFontFamily';
export const EXPORT_REPORT_SET_STAMP_FONT_SIZE = 'exportReport.setStampFontSize';
export const EXPORT_REPORT_SET_STAMP_ORGANIZATION_NAME = 'exportReport.setStampOrganizationName';
export const EXPORT_REPORT_SET_STAMP_ORGANIZATION_ADDRESS = 'exportReport.setStampOrganizationAddress';
export const EXPORT_REPORT_ADD_TEMPLATE = 'exportReport.addTemplate';
export const EXPORT_REPORT_IMPORT_TEMPLATE = 'exportReport.importTemplate';
export const EXPORT_REPORT_SELECT_TEMPLATE = 'exportReport.selectTemplate';
export const EXPORT_REPORT_EXPORT_TEMPLATE = 'exportReport.exportTemplate';
export const EXPORT_REPORT_PUBLIC_TEMPLATE = 'exportReport.publicTemplate';
export const EXPORT_REPORT_DELETE_TEMPLATE = 'exportReport.deleteTemplate';
export const EXPORT_REPORT_SUBMIT_FORM = 'exportReport.submitForm';

export type GwtkExportReportTaskState = {
    [EXPORT_REPORT_TOGGLE_LAYERS_SELECTED_FROM_TEMPLATE]: undefined;
    [EXPORT_REPORT_SET_LAYERS_SELECTED]: Layer[];
    [EXPORT_REPORT_SET_FILE_FORMAT]: ExportReportConstructorOptions['format'];
    [EXPORT_REPORT_SET_DPI]: ExportReportDpiItem['code'];
    [EXPORT_REPORT_SET_PAGE_FORMAT]: ExportReportConstructorOptions['pageOptions']['format'];
    [EXPORT_REPORT_SET_PAGE_ORIENTATION]: ExportReportPageOrientationItem['code'];
    [EXPORT_REPORT_SET_PAGE_MARGIN]: ExportReportPageMarginSet;
    [EXPORT_REPORT_SET_FONT_FAMILY]: ExportReportFontItem['code'];
    [EXPORT_REPORT_SET_FONT_SIZE]: ExportReportFontParameters['size'];
    [EXPORT_REPORT_SET_SHOW_LOGOTYPE]: ExportReportConstructorOptions['showLogotype'];
    [EXPORT_REPORT_SET_LOGOTYPE]: ExportReportLogotypeParameters['logotype'];
    [EXPORT_REPORT_SET_LOGOTYPE_POSITION_TOP]: ExportReportLogotypeParameters['position']['top'];
    [EXPORT_REPORT_SET_LOGOTYPE_POSITION_LEFT]: ExportReportLogotypeParameters['position']['left'];
    [EXPORT_REPORT_SET_SHOW_HEADERS]: ExportReportConstructorOptions['showHeaders'];
    [EXPORT_REPORT_SET_HEADER_TEXT]: ExportReportHeaderTextSet;
    [EXPORT_REPORT_SET_HEADER_FONT_FAMILY]: ExportReportHeaderFontFamilySet;
    [EXPORT_REPORT_SET_HEADER_FONT_SIZE]: ExportReportHeaderFontSizeSet;
    [EXPORT_REPORT_ADD_HEADER]: undefined;
    [EXPORT_REPORT_REMOVE_HEADER]: undefined;
    [EXPORT_REPORT_SET_SHOW_LEGEND]: ExportReportConstructorOptions['showLegend'];
    [EXPORT_REPORT_SET_LEGEND_ICON_SIZE]: ExportReportLegendOptions['iconSize'];
    [EXPORT_REPORT_SET_LEGEND_FONT_FAMILY]: ExportReportLegendOptions['fontFamily'];
    [EXPORT_REPORT_SET_LEGEND_FONT_SIZE]: ExportReportLegendOptions['fontSize'];
    [EXPORT_REPORT_SET_LEGEND_POSITION_RIGHT]: ExportReportLegendOptions['position']['right'];
    [EXPORT_REPORT_SET_LEGEND_POSITION_BOTTOM]: ExportReportLegendOptions['position']['bottom'];
    [EXPORT_REPORT_SET_LEGEND_ABOVE_MAP]: ExportReportLegendOptions['aboveMap'];
    [EXPORT_REPORT_SET_SHOW_NORTH_ARROW]: ExportReportConstructorOptions['showNorthArrow'];
    [EXPORT_REPORT_SET_SHOW_SCALE]: ExportReportConstructorOptions['showScale'];
    [EXPORT_REPORT_SET_SHOW_SCALE_BAR]: ExportReportConstructorOptions['showScaleBar'];
    [EXPORT_REPORT_SET_SHOW_COORDINATE_SYSTEM]: ExportReportConstructorOptions['showCoordinateSystem'];
    [EXPORT_REPORT_SET_SHOW_COORDINATE_GRID]: ExportReportConstructorOptions['showCoordinateGrid'];
    [EXPORT_REPORT_SET_COORDINATE_GRID_SYSTEM_TYPE]: ExportReportConstructorOptions['coordinateGridOptions']['systemType'];
    [EXPORT_REPORT_SET_COORDINATE_GRID_STEP_METERS]: ExportReportConstructorOptions['coordinateGridOptions']['stepMeters'];
    [EXPORT_REPORT_SET_COORDINATE_GRID_STEP_DEGREES]: ExportReportConstructorOptions['coordinateGridOptions']['stepDegrees'];
    [EXPORT_REPORT_SET_SHOW_FEATURES]: ExportReportConstructorOptions['showFeatures'];
    [EXPORT_REPORT_SET_FEATURES_FONT_FAMILY]: ExportReportFeaturesOptions['fontFamily'];
    [EXPORT_REPORT_SET_FEATURES_FONT_SIZE]: ExportReportFeaturesOptions['fontSize'];
    [EXPORT_REPORT_SET_SHOW_ATTRIBUTES]: ExportReportConstructorOptions['showAttributes'];
    [EXPORT_REPORT_TOGGLE_AND_UPDATE_ATTRIBUTES]: boolean;
    [EXPORT_REPORT_SET_ATTRIBUTES_FONT_FAMILY]: ExportReportAttributesOptions['fontFamily'];
    [EXPORT_REPORT_SET_ATTRIBUTES_FONT_SIZE]: ExportReportAttributesOptions['fontSize'];
    [EXPORT_REPORT_SET_SHOW_PAGE_NUMERATION]: ExportReportConstructorOptions['showPageNumeration'];
    [EXPORT_REPORT_SET_PAGE_NUMERATION_FONT_FAMILY]: ExportReportPageNumerationOptions['fontFamily'];
    [EXPORT_REPORT_SET_PAGE_NUMERATION_FONT_SIZE]: ExportReportPageNumerationOptions['fontSize'];
    [EXPORT_REPORT_SET_PAGE_NUMERATION_BOTTOM]: ExportReportPageNumerationOptions['bottom'];
    [EXPORT_REPORT_SET_SHOW_DATE]: ExportReportConstructorOptions['showDate'];
    [EXPORT_REPORT_SET_DATE_FORMAT]: ExportReportDateOptions['format'];
    [EXPORT_REPORT_SET_SHOW_STAMP]: ExportReportConstructorOptions['showStamp'];
    [EXPORT_REPORT_SET_STAMP_TYPE]: ExportReportStampOptions['type'];
    [EXPORT_REPORT_SET_STAMP_FONT_FAMILY]: ExportReportStampOptions['fontFamily'];
    [EXPORT_REPORT_SET_STAMP_FONT_SIZE]: ExportReportStampOptions['fontSize'];
    [EXPORT_REPORT_SET_STAMP_ORGANIZATION_NAME]: ExportReportStampOptions['organizationName'];
    [EXPORT_REPORT_SET_STAMP_ORGANIZATION_ADDRESS]: ExportReportStampOptions['organizationAddress'];
    [EXPORT_REPORT_ADD_TEMPLATE]: ExportReportAddTemplateParameters;
    [EXPORT_REPORT_IMPORT_TEMPLATE]: ExportReportTemplateType;
    [EXPORT_REPORT_SELECT_TEMPLATE]: ExportReportSelectTemplateParameters;
    [EXPORT_REPORT_EXPORT_TEMPLATE]: ExportReportSelectTemplateParameters;
    [EXPORT_REPORT_PUBLIC_TEMPLATE]: number;
    [EXPORT_REPORT_DELETE_TEMPLATE]: ExportReportSelectTemplateParameters;
    [EXPORT_REPORT_SUBMIT_FORM]: undefined;
};

export default class GwtkExportReportTask extends Task {

    private readonly widgetProps: GwtkComponentDescriptionPropsData & ExportReportWidgetParams;

    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            layerIds: [],
            layersSelected: [],
            isLegendAvailable: false,
            setLayersSelected: [],
            useLayersFromTemplate: false,
            layersSelectedFromTemplate: [],
            formats: [],
            dpi: [],
            pageFormats: [],
            pageOrientations: [],
            fonts: [],
            logotypes: [],
            featuresSelected: false,
            attributes: null,
            attributesFetchParameters: null,
            useAttributesFetchParameters: false,
            isAttributesFetching: false,
            iconSizes: this.getIconSizes(),
            coordinateGridStepsMeters: [],
            coordinateGridStepsDegrees: [],
            dateFormats: [],
            stamps: [],
            constructorOptions: this.getConstructorDefaults(),
            exporting: false,
            progress: this.getClearProgress(),
            constructorTemplatesPublic: [],
            constructorTemplatesLocal: [],
            isLogged: (mapWindow as AppWindow).appParams.loggedInFlag,
            isAdmin: (mapWindow as AppWindow).appParams.isAdmin,
            userName: (mapWindow as AppWindow).appParams.userName
        };
        this.updateLayerList();
        this.handleResizeWindow = this.handleResizeWindow.bind(this);
    }

    protected getIconSizes(): ExportReportIconSizeItem[] {
        return ICON_SIZES.map(size => ({code: size, text: size.toString() + ' ' + i18n.tc('exportReport.pix')}));
    }

    protected getConstructorDefaults(): ExportReportConstructorOptions {
        return {
            templateTitle: '',
            format: 'png',
            dpi: EXPORT_REPORT_DEFAULT_DPI,
            pageOptions: {
                format: this.getPageFormat(),
                orientation: this.getPageOrientationFromMapContainer(),
                margins: [20, 20, 20, 20],
                maxMargin: 200
            },
            font: {
                family: this.getDefaultFontFamily(),
                size: 11,
                minFontSize: 8,
                maxFontSize: 24
            },
            showLogotype: false,
            logotypeOptions: {
                logotype: -1,
                position: {
                    top: 30,
                    left: 30
                },
                maxPosition: 200
            },
            showHeaders: false,
            headerOptions: {
                headers: this.getHeaders(),
                maxLength: 1024,
                minFontSize: 10,
                maxFontSize: 50
            },
            showLegend: false,
            legendOptions: {
                iconSize: 32,
                fontFamily: this.getDefaultFontFamily(),
                fontSize: 11,
                position: {
                    right: 30,
                    bottom: 30
                },
                aboveMap: false,
                minFontSize: 4,
                maxFontSize: 24,
                maxPosition: 100
            },
            showNorthArrow: false,
            showScale: false,
            showScaleBar: false,
            showCoordinateSystem: false,
            showCoordinateGrid: false,
            coordinateGridOptions: {
                systemType: ExportReportCoordinateSystemType.Meters,
                stepMeters: 10000,
                stepDegrees: parseFloat((1 / 6).toFixed(8))
            },
            showFeatures: false,
            featuresOptions: {
                fontFamily: this.getDefaultFontFamily(),
                fontSize: 11,
                minFontSize: 4,
                maxFontSize: 30
            },
            showAttributes: false,
            attributesOptions: {
                limit: 5000,
                fontFamily: this.getDefaultFontFamily(),
                fontSize: 11,
                minFontSize: 4,
                maxFontSize: 30
            },
            showPageNumeration: false,
            pageNumerationOptions: {
                fontFamily: this.getDefaultFontFamily(),
                fontSize: 11,
                bottom: 10,
                minFontSize: 4,
                maxFontSize: 30,
                maxBottom: 100
            },
            showDate: false,
            dateOptions: {
                format: 'd.m.Y'
            },
            showStamp: false,
            stampOptions: {
                type: 'tradeSecret',
                typeDescription: i18n.tc('exportReport.Trade secret'),
                fontFamily: this.getDefaultFontFamily(),
                fontSize: 11,
                organizationName: i18n.tc('exportReport.Organization name'),
                organizationAddress: i18n.tc('exportReport.Organization address'),
                minFontSize: 4,
                maxFontSize: 24,
                maxLength: 1024
            },
            reportVersion: EXPORT_REPORT_VERSION
        };
    }

    protected getPageFormat(): ExportReportPageParameters['format'] {
        if (EXPORT_REPORT_VERSION === ExportReportVersion.Transneft) {
            return 'a3';
        }
        return 'a4';
    }

    protected getPageOrientationFromMapContainer(): ExportReportPageOrientationItem['code'] {
        return this.map.container.clientWidth > this.map.container.clientHeight ? 'landscape' : 'portrait';
    }

    protected getDefaultFontFamily(): ExportReportFontItem['code'] {
        if (EXPORT_REPORT_VERSION === ExportReportVersion.Transneft) {
            return 'franklin';
        }
        return EXPORT_REPORT_DEFAULT_FONT_FAMILY;
    }

    protected getHeaders(): ExportReportHeaderItem[] {
        const headerText = EXPORT_REPORT_VERSION === ExportReportVersion.Transneft ? '' : i18n.tc('exportReport.Header text');
        const headers: ExportReportHeaderItem[] = [
            {
                text: headerText,
                fontFamily: this.getDefaultFontFamily(),
                fontSize: 20
            }
        ];
        if (EXPORT_REPORT_VERSION === ExportReportVersion.Transneft) {
            headers.push(this.getSubheaderTemplate());
        }
        return headers;
    }

    protected getClearProgress(): ExportReportProgress {
        return {
            [ExportReportProgressStage.Prepare]: 0,
            [ExportReportProgressStage.Legend]: 0,
            [ExportReportProgressStage.Report]: 0
        };
    }

    protected updateLayerList(): void {
        this.widgetProps.layerIds = this.map.layers.filter(this.isLayerSupported).map(layer => layer.id);
    }

    protected isLayerSupported(layer: Layer): boolean {
        return isLayerServiceSupported(layer) || layer instanceof TileLayer;
    }

    createTaskPanel() {
        const nameWidget = 'GwtkExportReportWidget';
        const sourceWidget = GwtkExportReportWidget;
        this.mapWindow.registerComponent(nameWidget, sourceWidget);
        this.mapWindow.createWidget(nameWidget, this.widgetProps);
        this.addToPostDeactivationList(this.widgetProps);
        this.fetchInitials();
    }

    setState<K extends keyof GwtkExportReportTaskState>(key: K, value: GwtkExportReportTaskState[K]): void {
        switch (key) {
            case EXPORT_REPORT_TOGGLE_LAYERS_SELECTED_FROM_TEMPLATE:
                this.widgetProps.useLayersFromTemplate = !this.widgetProps.useLayersFromTemplate;
                this.switchLayersSelected();
                break;
            case EXPORT_REPORT_SET_LAYERS_SELECTED:
                if (Array.isArray(value)) {
                    this.widgetProps.layersSelected = value as Layer[];
                    this.setIsLegendAvailable();
                }
                break;
            case EXPORT_REPORT_SET_FILE_FORMAT:
                if (typeof value === 'string') {
                    this.widgetProps.constructorOptions.format = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_DPI:
                if (typeof value === 'string') {
                    this.widgetProps.constructorOptions.dpi = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_PAGE_FORMAT:
                if (typeof value === 'string') {
                    this.widgetProps.constructorOptions.pageOptions.format = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_PAGE_ORIENTATION:
                if (typeof value === 'string') {
                    this.widgetProps.constructorOptions.pageOptions.orientation = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_PAGE_MARGIN:
                if (value && typeof value === 'object') {
                    this.widgetProps.constructorOptions.pageOptions.margins[(value as ExportReportPageMarginSet).index] = (value as ExportReportPageMarginSet).margin;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_FONT_FAMILY:
                if (typeof value === 'string') {
                    this.widgetProps.constructorOptions.font.family = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_FONT_SIZE:
                if (typeof value === 'number') {
                    this.widgetProps.constructorOptions.font.size = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_SHOW_LOGOTYPE:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.showLogotype = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_LOGOTYPE:
                if (typeof value === 'number') {
                    this.widgetProps.constructorOptions.logotypeOptions.logotype = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_LOGOTYPE_POSITION_TOP:
                if (typeof value === 'number') {
                    this.widgetProps.constructorOptions.logotypeOptions.position.top = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_LOGOTYPE_POSITION_LEFT:
                if (typeof value === 'number') {
                    this.widgetProps.constructorOptions.logotypeOptions.position.left = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_SHOW_HEADERS:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.showHeaders = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_HEADER_TEXT:
                if (value && typeof value === 'object') {
                    this.widgetProps.constructorOptions.headerOptions.headers[(value as ExportReportHeaderTextSet).index].text = (value as ExportReportHeaderTextSet).text;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_HEADER_FONT_FAMILY:
                if (value && typeof value === 'object') {
                    this.widgetProps.constructorOptions.headerOptions.headers[(value as ExportReportHeaderFontFamilySet).index].fontFamily = (value as ExportReportHeaderFontFamilySet).fontFamily;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_HEADER_FONT_SIZE:
                if (value && typeof value === 'object' && (value as ExportReportHeaderFontSizeSet).fontSize >= this.widgetProps.constructorOptions.headerOptions.minFontSize && (value as ExportReportHeaderFontSizeSet).fontSize <= this.widgetProps.constructorOptions.headerOptions.maxFontSize) {
                    this.widgetProps.constructorOptions.headerOptions.headers[(value as ExportReportHeaderFontSizeSet).index].fontSize = (value as ExportReportHeaderFontSizeSet).fontSize;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_ADD_HEADER:
                this.widgetProps.constructorOptions.headerOptions.headers.push(this.getSubheaderTemplate());
                this.saveFormSettings();
                break;
            case EXPORT_REPORT_REMOVE_HEADER:
                this.widgetProps.constructorOptions.headerOptions.headers.splice(this.widgetProps.constructorOptions.headerOptions.headers.length - 1);
                this.saveFormSettings();
                break;
            case EXPORT_REPORT_SET_SHOW_LEGEND:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.showLegend = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_LEGEND_ICON_SIZE:
                if (typeof value === 'number') {
                    this.widgetProps.constructorOptions.legendOptions.iconSize = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_LEGEND_FONT_FAMILY:
                if (typeof value === 'string') {
                    this.widgetProps.constructorOptions.legendOptions.fontFamily = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_LEGEND_FONT_SIZE:
                if (typeof value === 'number' && value >= this.widgetProps.constructorOptions.legendOptions.minFontSize && value <= this.widgetProps.constructorOptions.legendOptions.maxFontSize) {
                    this.widgetProps.constructorOptions.legendOptions.fontSize = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_LEGEND_POSITION_RIGHT:
                if (typeof value === 'number' && value >= 0 && value <= this.widgetProps.constructorOptions.legendOptions.maxPosition) {
                    this.widgetProps.constructorOptions.legendOptions.position.right = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_LEGEND_POSITION_BOTTOM:
                if (typeof value === 'number' && value >= 0 && value <= this.widgetProps.constructorOptions.legendOptions.maxPosition) {
                    this.widgetProps.constructorOptions.legendOptions.position.bottom = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_LEGEND_ABOVE_MAP:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.legendOptions.aboveMap = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_SHOW_NORTH_ARROW:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.showNorthArrow = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_SHOW_SCALE:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.showScale = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_SHOW_SCALE_BAR:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.showScaleBar = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_SHOW_COORDINATE_SYSTEM:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.showCoordinateSystem = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_SHOW_COORDINATE_GRID:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.showCoordinateGrid = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_COORDINATE_GRID_SYSTEM_TYPE:
                if (typeof value === 'number') {
                    this.widgetProps.constructorOptions.coordinateGridOptions.systemType = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_COORDINATE_GRID_STEP_METERS:
                if (typeof value === 'number') {
                    this.widgetProps.constructorOptions.coordinateGridOptions.stepMeters = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_COORDINATE_GRID_STEP_DEGREES:
                if (typeof value === 'number') {
                    this.widgetProps.constructorOptions.coordinateGridOptions.stepDegrees = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_SHOW_FEATURES:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.showFeatures = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_FEATURES_FONT_FAMILY:
                if (typeof value === 'string') {
                    this.widgetProps.constructorOptions.featuresOptions.fontFamily = value;
                }
                break;
            case EXPORT_REPORT_SET_FEATURES_FONT_SIZE:
                if (typeof value === 'number' && value >= 0 && value <= this.widgetProps.constructorOptions.featuresOptions.maxFontSize) {
                    this.widgetProps.constructorOptions.featuresOptions.fontSize = value;
                }
                break;
            case EXPORT_REPORT_SET_SHOW_ATTRIBUTES:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.showAttributes = value;
                    this.saveFormSettings();

                    this.widgetProps.attributes = null;
                    if (value) {
                        this.fetchAttributes();
                    } else {
                        this.widgetProps.isAttributesFetching = false;
                    }
                }
                break;
            case EXPORT_REPORT_TOGGLE_AND_UPDATE_ATTRIBUTES:
                if (typeof value === 'boolean') {
                    this.widgetProps.useAttributesFetchParameters = value;
                    this.fetchAttributes();
                }
                break;
            case EXPORT_REPORT_SET_ATTRIBUTES_FONT_FAMILY:
                if (typeof value === 'string') {
                    this.widgetProps.constructorOptions.attributesOptions.fontFamily = value;
                }
                break;
            case EXPORT_REPORT_SET_ATTRIBUTES_FONT_SIZE:
                if (typeof value === 'number' && value >= 0 && value <= this.widgetProps.constructorOptions.attributesOptions.maxFontSize) {
                    this.widgetProps.constructorOptions.attributesOptions.fontSize = value;
                }
                break;
            case EXPORT_REPORT_SET_SHOW_PAGE_NUMERATION:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.showPageNumeration = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_PAGE_NUMERATION_FONT_FAMILY:
                if (typeof value === 'string') {
                    this.widgetProps.constructorOptions.pageNumerationOptions.fontFamily = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_PAGE_NUMERATION_FONT_SIZE:
                if (typeof value === 'number' && value >= 0 && value <= this.widgetProps.constructorOptions.pageNumerationOptions.maxFontSize) {
                    this.widgetProps.constructorOptions.pageNumerationOptions.fontSize = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_PAGE_NUMERATION_BOTTOM:
                if (typeof value === 'number' && value >= 0 && value <= this.widgetProps.constructorOptions.pageNumerationOptions.maxBottom) {
                    this.widgetProps.constructorOptions.pageNumerationOptions.bottom = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_SHOW_DATE:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.showDate = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_DATE_FORMAT:
                if (typeof value === 'string') {
                    this.widgetProps.constructorOptions.dateOptions.format = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_SHOW_STAMP:
                if (typeof value === 'boolean') {
                    this.widgetProps.constructorOptions.showStamp = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_STAMP_TYPE:
                if (typeof value === 'string') {
                    this.widgetProps.constructorOptions.stampOptions.type = value;
                    const description = this.widgetProps.stamps.find(stamp => stamp.code === value)?.text;
                    if (description) {
                        this.widgetProps.constructorOptions.stampOptions.typeDescription = i18n.tc(description);
                    }
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_STAMP_FONT_FAMILY:
                if (typeof value === 'string') {
                    this.widgetProps.constructorOptions.stampOptions.fontFamily = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_STAMP_FONT_SIZE:
                if (typeof value === 'number' && value >= this.widgetProps.constructorOptions.stampOptions.minFontSize && value <= this.widgetProps.constructorOptions.stampOptions.maxFontSize) {
                    this.widgetProps.constructorOptions.stampOptions.fontSize = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_STAMP_ORGANIZATION_NAME:
                if (typeof value === 'string' && (value as string).length <= this.widgetProps.constructorOptions.stampOptions.maxLength) {
                    this.widgetProps.constructorOptions.stampOptions.organizationName = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_SET_STAMP_ORGANIZATION_ADDRESS:
                if (typeof value === 'string' && (value as string).length <= this.widgetProps.constructorOptions.stampOptions.maxLength) {
                    this.widgetProps.constructorOptions.stampOptions.organizationAddress = value;
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_ADD_TEMPLATE:
                if (typeof value === 'object') {
                    this.addTemplate(value as ExportReportAddTemplateParameters);
                }
                break;
            case EXPORT_REPORT_IMPORT_TEMPLATE:
                this.importTemplate(value as ExportReportTemplateType).then();
                break;
            case EXPORT_REPORT_SELECT_TEMPLATE:
                if (typeof value === 'object') {
                    this.selectTemplate(value as ExportReportSelectTemplateParameters);
                    this.saveFormSettings();
                }
                break;
            case EXPORT_REPORT_EXPORT_TEMPLATE:
                if (typeof value === 'object') {
                    this.exportTemplate(value as ExportReportSelectTemplateParameters);
                }
                break;
            case EXPORT_REPORT_DELETE_TEMPLATE:
                if (typeof value === 'object') {
                    this.deleteTemplate(value as ExportReportSelectTemplateParameters);
                }
                break;
            case EXPORT_REPORT_PUBLIC_TEMPLATE:
                if (typeof value === 'number') {
                    this.publicTemplate(value);
                }
                break;
            case EXPORT_REPORT_SUBMIT_FORM:
                this.submitExportReport();
                this.saveFormSettings();
                break;
        }
    }

    protected getSubheaderTemplate(): ExportReportHeaderItem {
        const text = EXPORT_REPORT_VERSION === ExportReportVersion.Transneft ? '' : i18n.tc('exportReport.Subheader text');
        return {
            text,
            fontFamily: this.getDefaultFontFamily(),
            fontSize: 16
        };
    }

    protected fetchAttributes(): void {
        this.widgetProps.isAttributesFetching = true;

        try {
            if (this.widgetProps.useAttributesFetchParameters) {
                // callAPI trigger is implemented in certain version
                // @ts-ignore
                this.map.trigger({
                    type: 'callAPI',
                    cmd: 'fetchExportReportAttributesWithTemplate',
                    data: {
                        attributesFetchParameters: this.widgetProps.attributesFetchParameters,
                        callback: (attributes: ExportReportAttributes) => {
                            this.widgetProps.isAttributesFetching = false;
                            this.widgetProps.attributes = Object.assign({}, attributes);
                            this.widgetProps.attributes.items = this.widgetProps.attributes.items.slice(0, this.widgetProps.constructorOptions.attributesOptions.limit);
                        }
                    }
                });
            } else {
                // callAPI trigger is implemented in certain version
                // @ts-ignore
                this.map.trigger({
                    type: 'callAPI',
                    cmd: 'exportAttributes',
                    data: {
                        callback: (response: Promise<ExportReportAttributes>) => {
                            this.widgetProps.isAttributesFetching = false;
                            response.then(attributes => {
                                this.widgetProps.attributes = Object.assign({}, attributes);
                                this.widgetProps.attributes.items = this.widgetProps.attributes.items.slice(0, this.widgetProps.constructorOptions.attributesOptions.limit);
                            }).catch(() => {
                                this.map.writeProtocolMessage({text: i18n.tc('exportReport.failedToRetrieveAttributes'), type: LogEventType.Error, display: true});
                            });
                        }
                    }
                });
            }
        } catch (e) {
            this.widgetProps.isAttributesFetching = false;
            this.map.writeProtocolMessage({text: i18n.tc('exportReport.failedToRetrieveAttributes'), type: LogEventType.Error, display: true});
        }
    }

    protected addTemplate(addParameters: ExportReportAddTemplateParameters): void {
        this.widgetProps.constructorOptions.templateTitle = addParameters.templateTitle;
        const template: ExportReportConstructorOptionsExtended = JSON.parse(JSON.stringify(this.widgetProps.constructorOptions));
        template.layersSelected = JSON.parse(JSON.stringify(this.widgetProps.layersSelected.map(layer => layer.id)));
        if (this.widgetProps.attributes) {
            template.attributesFetchParameters = JSON.parse(JSON.stringify({
                title: this.widgetProps.attributes.title,
                headers: this.widgetProps.attributes.headers,
                width: this.widgetProps.attributes.width
            }));
        }
        this.addTemplateWithType(template as ExportReportConstructorOptions, addParameters.templateType);
    }

    protected addTemplateWithType(constructorOptions: ExportReportConstructorOptionsExtended, templateType: ExportReportTemplateType): void {
        const isPublic = (templateType === ExportReportTemplateType.Public) ? 1 : 0;
        const requestService = new GISWebServerSEService();
        requestService.addExportReportTemplate(constructorOptions, isPublic).then(response => {
            if (response.data?.data) {
                if (isPublic) {
                    this.widgetProps.constructorTemplatesPublic.push(constructorOptions);
                } else {
                    this.widgetProps.constructorTemplatesLocal.push(constructorOptions);
                }
            } else {
                this.map.writeProtocolMessage({text: i18n.tc('exportReport.Failed to save report template') + '', type: LogEventType.Error, display: true});
            }
        }).catch(() => {
            this.map.writeProtocolMessage({text: i18n.tc('exportReport.Failed to save report template') + '', type: LogEventType.Error, display: true});
        });
    }

    protected async importTemplate(templateType: ExportReportTemplateType): Promise<void> {
        const fileList = await BrowserService.openFileDialog(['.json']).catch(() => {});
        if (!(fileList instanceof FileList)) {
            return;
        }

        const file = fileList.item(0);
        if (!file) {
            return;
        }

        const jsonData = await file.text();
        const constructorOptions = JSON.parse(jsonData);
        if (constructorOptions) {
            this.addTemplateWithType(constructorOptions, templateType);
        }
    }

    protected selectTemplate(templateParameters: ExportReportSelectTemplateParameters): void {
        const source = templateParameters.templateType === ExportReportTemplateType.Public ? this.widgetProps.constructorTemplatesPublic : this.widgetProps.constructorTemplatesLocal;
        if (!source[templateParameters.templateIndex]) {
            return;
        }
        this.restoreFormSettings(source[templateParameters.templateIndex], this.widgetProps.constructorOptions);

        const layersSelected = source[templateParameters.templateIndex].layersSelected;
        if (Array.isArray(layersSelected)) {
            this.widgetProps.layersSelectedFromTemplate = layersSelected;
            this.widgetProps.useLayersFromTemplate = true;
        } else {
            this.widgetProps.layersSelectedFromTemplate = [];
            this.widgetProps.useLayersFromTemplate = false;
        }
        this.switchLayersSelected();

        this.widgetProps.attributesFetchParameters = source[templateParameters.templateIndex].attributesFetchParameters || null;
        if (this.widgetProps.attributesFetchParameters) {
            this.setState(EXPORT_REPORT_TOGGLE_AND_UPDATE_ATTRIBUTES, true);
        }
    }

    protected switchLayersSelected(): void {
        if (this.widgetProps.useLayersFromTemplate) {
            this.widgetProps.setLayersSelected = this.widgetProps.layersSelectedFromTemplate.filter(layerId => this.widgetProps.layerIds.indexOf(layerId) !== -1);
        } else {
            this.widgetProps.setLayersSelected = this.map.layers.filter(layer => this.widgetProps.layerIds.indexOf(layer.id) !== -1 && layer.visible).map(layer => layer.id);
        }
    }

    protected setIsLegendAvailable(): void {
        this.widgetProps.isLegendAvailable = !!this.widgetProps.layersSelected.find(layer => layer.hasLegend());
        if (!this.widgetProps.isLegendAvailable) {
            this.widgetProps.constructorOptions.showLegend = false;
        }
    }

    protected exportTemplate(templateParameters: ExportReportSelectTemplateParameters): void {
        const source = templateParameters.templateType === ExportReportTemplateType.Public ? this.widgetProps.constructorTemplatesPublic : this.widgetProps.constructorTemplatesLocal;
        const template = source[templateParameters.templateIndex];
        const jsonString = JSON.stringify(template);
        GWTK.Util.saveDataInFile(jsonString, template.templateTitle + '.json');
    }

    protected publicTemplate(templateIndex: number): void {
        const constructorOptions = this.widgetProps.constructorTemplatesLocal[templateIndex];
        if (!constructorOptions) {
            return;
        }

        this.addTemplateWithType(constructorOptions, ExportReportTemplateType.Public);
    }

    protected deleteTemplate(templateParameters: ExportReportSelectTemplateParameters): void {
        const isPublic = templateParameters.templateType === ExportReportTemplateType.Public ? 1 : 0;
        const source = templateParameters.templateType === ExportReportTemplateType.Public ? this.widgetProps.constructorTemplatesPublic : this.widgetProps.constructorTemplatesLocal;
        if (!source[templateParameters.templateIndex]) {
            return;
        }

        const requestService = new GISWebServerSEService();
        requestService.deleteExportReportTemplate(templateParameters.templateIndex, isPublic).then(response => {
            if (!response.data?.data) {
                return this.map.writeProtocolMessage({text: i18n.tc('exportReport.Failed to delete report template') + '', type: LogEventType.Error, display: true});
            }

            source.splice(templateParameters.templateIndex, 1);
        }).catch(() => {
            this.map.writeProtocolMessage({text: i18n.tc('exportReport.Failed to delete report template') + '', type: LogEventType.Error, display: true});
        });
    }

    protected submitExportReport(): void {
        const exporter = new Exporter(this.map);
        this.clearProgress();
        this.widgetProps.exporting = true;
        exporter.send(this.widgetProps, this.setProgress.bind(this)).then().catch(() => {
        }).finally(() => {
            exporter.unwatchProgress();
            this.widgetProps.exporting = false;
            this.clearProgress();
        });
    }

    protected clearProgress(): void {
        this.widgetProps.progress = this.getClearProgress();
    }

    protected setProgress(stage: ExportReportProgressStage, value: number): void {
        this.widgetProps.progress[stage] = value;
    }

    onDataChanged(event: DataChangedEvent) {
        super.onDataChanged(event);
        if (event.type === 'layercommand') {
            this.updateLayerList();
        }
    }

    onSelectObjects(mapObject?: MapObject[]) {
        if (mapObject && mapObject.length) {
            this.widgetProps.featuresSelected = true;
        } else {
            this.widgetProps.featuresSelected = false;
            this.widgetProps.constructorOptions.showFeatures = false;
        }
        super.onSelectObjects(mapObject);
    }

    protected fetchInitials(): void {
        const requestService = new GISWebServerSEService();
        requestService.fetchExportReportInitials().then(response => {
            if (!response.data) {
                return this.map.writeProtocolMessage({text: response.error as string, type: LogEventType.Error, display: true});
            }
            this.setListProperties(response.data.data);
            this.setPublicTemplates(response.data.data.publicTemplates);
            this.setLocalTemplates(response.data.data.localTemplates);
            this.checkListProperties();
        }).catch(error => {
            this.map.writeProtocolMessage({text: error, type: LogEventType.Error, display: true});
        });
    }

    protected setListProperties(data: FetchExportReportInitialsResponse['data']): void {
        this.widgetProps.formats = data.formats;
        this.widgetProps.dpi = data.dpi.map(dpi => ({...dpi, disabled: false}));
        this.updateDpiItemsDisabled();
        this.widgetProps.pageFormats = data.pageFormats;
        this.widgetProps.pageOrientations = data.pageOrientations.map(item => {
            item.text = i18n.tc(item.text);
            return item;
        });
        this.widgetProps.fonts = data.fonts;
        this.widgetProps.logotypes = data.logotypes.map(parameters => new Logotype(parameters));
        this.widgetProps.dateFormats = data.dateFormats.map(item => {
            item.text = i18n.tc(item.text) + ' ( ' + getDateWithFormat(item.code) + ' )';
            return item;
        });
        this.widgetProps.coordinateGridStepsMeters = data.coordinateGridStepsMeters;
        this.widgetProps.coordinateGridStepsDegrees = data.coordinateGridStepsDegrees;
        this.widgetProps.stamps = data.stamps.map(item => {
            item.text = i18n.tc(item.text);
            return item;
        });
    }

    protected setPublicTemplates(templates: string[]): void {
        this.widgetProps.constructorTemplatesPublic = [];
        templates.forEach(template => {
            const publicTemplateData = JSON.parse(template) as ExportReportConstructorOptionsExtended;
            if (publicTemplateData) {
                this.widgetProps.constructorTemplatesPublic.push(publicTemplateData);
            }
        });
    }

    protected setLocalTemplates(templates: string[]): void {
        this.widgetProps.constructorTemplatesLocal = [];
        templates.forEach(template => {
            const publicTemplateData = JSON.parse(template) as ExportReportConstructorOptionsExtended;
            if (publicTemplateData) {
                this.widgetProps.constructorTemplatesLocal.push(publicTemplateData);
            }
        });
    }

    protected checkListProperties(): void {
        this.checkListProperty(this.widgetProps.constructorOptions, 'format', this.widgetProps.formats, 'code');
        this.checkListProperty(this.widgetProps.constructorOptions, 'dpi', this.widgetProps.dpi, 'code');
        this.checkListProperty(this.widgetProps.constructorOptions.pageOptions, 'format', this.widgetProps.pageFormats, 'code');
        this.checkListProperty(this.widgetProps.constructorOptions.pageOptions, 'orientation', this.widgetProps.pageOrientations, 'code');
        this.checkListProperty(this.widgetProps.constructorOptions.font, 'family', this.widgetProps.fonts, 'code');
        this.checkListProperty(this.widgetProps.constructorOptions.dateOptions, 'format', this.widgetProps.dateFormats, 'code');
        this.checkListProperty(this.widgetProps.constructorOptions.stampOptions, 'type', this.widgetProps.stamps, 'code');
        this.checkListProperty(this.widgetProps.constructorOptions.coordinateGridOptions, 'stepMeters', this.widgetProps.coordinateGridStepsMeters, 'code');
        this.checkListProperty(this.widgetProps.constructorOptions.coordinateGridOptions, 'stepDegrees', this.widgetProps.coordinateGridStepsDegrees, 'code');
        this.checkListIndex(this.widgetProps.constructorOptions.logotypeOptions, 'logotype', this.widgetProps.logotypes);
    }

    protected checkListProperty(constructorObject: { [key: string]: any }, constructorOption: keyof typeof constructorObject, optionsList: ExportReportDefaultItem[], parameter: keyof ExportReportDefaultItem): void {
        const value = constructorObject[constructorOption];
        if (optionsList.find(item => item[parameter] === value) === undefined) {
            this.clearListProperty(constructorObject, constructorOption);
        }
    }

    protected clearListProperty(constructorObject: { [key: string]: any }, constructorOption: keyof typeof constructorObject): void {
        if (typeof constructorObject[constructorOption] === 'string') {
            constructorObject[constructorOption] = '';
        } else if (typeof constructorObject[constructorOption] === 'number') {
            constructorObject[constructorOption] = -1;
        }
    }

    protected checkListIndex(constructorObject: { [key: string]: any }, constructorOption: keyof typeof constructorObject, optionsList: { [key: string]: any }[]): void {
        if (constructorObject[constructorOption] >= 0 && optionsList[constructorObject[constructorOption]] === undefined) {
            constructorObject[constructorOption] = -1;
        }
    }

    protected updateDpiItemsDisabled(): void {
        this.widgetProps.dpi.forEach(dpiItem => {
            const k = parseInt(dpiItem.code) / parseInt(EXPORT_REPORT_DEFAULT_DPI);
            dpiItem.disabled = (this.map.container.clientWidth * k > MAX_SERVICE_IMAGE_WIDTH) || (this.map.container.clientHeight * k > MAX_SERVICE_IMAGE_HEIGHT);
            if (dpiItem.disabled && this.widgetProps.constructorOptions.dpi === dpiItem.code) {
                this.widgetProps.constructorOptions.dpi = EXPORT_REPORT_DEFAULT_DPI;
            }
        });
    }

    setup(): void {
        super.setup();
        if (!this.workspaceData || this.workspaceData && 'logotypeOptions' in this.workspaceData && this.workspaceData.logotypeOptions.logotype === -1) {
            this.setState(EXPORT_REPORT_SET_LOGOTYPE, 0);
        } else if (this.workspaceData) {
            this.restoreFormSettings(this.workspaceData, this.widgetProps.constructorOptions);
        }
        this.addListenerOnResize();
        this.onSelectObjects(this.map.getSelectedObjects());
    }

    protected restoreFormSettings(source: SimpleJson<any>, destination: { [key: string]: any }): void {
        for (let key in source) {
            if (destination[key] === undefined) {
                continue;
            }
            if (source[key] && typeof source[key] === 'object') {
                if (destination[key] && typeof destination[key] === 'object') {
                    this.restoreFormSettings(source[key], destination[key]);
                }
            } else {
                destination[key] = source[key];
            }
        }
    }

    protected addListenerOnResize(): void {
        window.addEventListener('resize', this.handleResizeWindow);
    }

    protected handleResizeWindow(): void {
        setTimeout(this.updateDpiItemsDisabled.bind(this));
    }

    quit(): void {
        this.removeListenerOnResize();
        super.quit();
    }

    protected removeListenerOnResize(): void {
        window.removeEventListener('resize', this.handleResizeWindow);
    }

    protected saveFormSettings(): void {
        const opts = this.widgetProps.constructorOptions;
        this.workspaceData = JSON.parse(JSON.stringify({
            format: opts.format,
            dpi: opts.dpi,
            pageOptions: {
                orientation: opts.pageOptions.orientation,
                format: opts.pageOptions.format,
                margins: opts.pageOptions.margins
            },
            font: {
                family: opts.font.family,
                size: opts.font.size
            },
            showLogotype: opts.showLogotype,
            logotypeOptions: {
                logotype: opts.logotypeOptions.logotype,
                position: opts.logotypeOptions.position
            },
            showHeaders: opts.showHeaders,
            headerOptions: {
                headers: opts.headerOptions.headers
            },
            showLegend: opts.showLegend,
            legendOptions: {
                iconSize: opts.legendOptions.iconSize,
                fontFamily: opts.legendOptions.fontFamily,
                fontSize: opts.legendOptions.fontSize,
                position: opts.legendOptions.position,
                aboveMap: opts.legendOptions.aboveMap
            },
            showNorthArrow: opts.showNorthArrow,
            showScale: opts.showScale,
            showScaleBar: opts.showScaleBar,
            showCoordinateSystem: opts.showCoordinateSystem,
            showCoordinateGrid: opts.showCoordinateGrid,
            coordinateGridOptions: {
                systemType: opts.coordinateGridOptions.systemType,
                stepMeters: opts.coordinateGridOptions.stepMeters,
                stepDegrees: opts.coordinateGridOptions.stepDegrees
            },
            showFeatures: opts.showFeatures,
            featuresOptions: opts.featuresOptions,
            showPageNumeration: opts.showPageNumeration,
            pageNumerationOptions: {
                fontFamily: opts.pageNumerationOptions.fontFamily,
                fontSize: opts.pageNumerationOptions.fontSize,
                bottom: opts.pageNumerationOptions.bottom
            },
            showDate: opts.showDate,
            dateOptions: {
                format: opts.dateOptions.format
            },
            showStamp: opts.showStamp,
            stampOptions: {
                type: opts.stampOptions.type,
                typeDescription: opts.stampOptions.typeDescription,
                fontFamily: opts.stampOptions.fontFamily,
                fontSize: opts.stampOptions.fontSize,
                organizationName: opts.stampOptions.organizationName,
                organizationAddress: opts.stampOptions.organizationAddress
            }
        }));
        this.writeWorkspaceData(true);
    }

}
