import {GwtkComponentDescriptionPropsData, GwtkMap} from '~/types/Types';
import {
    ExportReportConstructorOptions,
    ExportReportImageParametersForPdf,
    ExportReportWidgetParams,
    ServiceUrlAndLayers
} from '../Types';
import Layer from '~/maplayers/Layer';
import {GetMapImageParams} from '~/services/RequestServices/RestService/Types';
import {EXPORT_REPORT_DEFAULT_DPI} from '../GwtkExportReportTask';
import {getDateWithFormat} from '../helpers/DateHelper';
import Trigonometry from '~/geo/Trigonometry';
import i18n from '@/plugins/i18n';
import {MapPoint} from '~/geometry/MapPoint';
import GeoPoint from '~/geo/GeoPoint';
import WmsLayer from '~/maplayers/WmsLayer';
import {
    ExportReportAttributes,
    ExportReportBBox,
    ExportReportBodyForMakeReport,
    ExportReportCoordinateGridParameters,
    ExportReportCoordinateSystemType,
    ExportReportFeatureCollectionFormatted,
    ExportReportFeaturesParameters,
    ExportReportFormatItem,
    ExportReportHeaderItem,
    ExportReportLegendFormatted,
    ExportReportLegendParameters,
    ExportReportLogotypeRequestParameters,
    ExportReportPageNumerationParameters,
    ExportReportPageParameters,
    ExportReportScaleBarCalculated,
    ExportReportStampParameters
} from '../../../../service/GISWebServerSEService/Types';
import {SimpleJson} from '~/types/CommonTypes';

export class Builder {

    private readonly map: GwtkMap;
    private readonly bBoxMeters: ExportReportBBox;
    private readonly bBoxDegrees: ExportReportBBox;
    private readonly widgetProps: GwtkComponentDescriptionPropsData & ExportReportWidgetParams;
    private readonly options: ExportReportConstructorOptions;
    private readonly isPdf: boolean;
    private readonly width: number;
    private readonly height: number;
    private readonly scale: number;

    constructor(map: GwtkMap, widgetProps: GwtkComponentDescriptionPropsData & ExportReportWidgetParams) {
        this.map = map;
        const bBox = map.getBbox();
        this.bBoxMeters = [bBox.getMinimum()[0], bBox.getMinimum()[1], bBox.getMaximum()[0], bBox.getMaximum()[1]];
        const point1 = (new MapPoint(this.bBoxMeters[1], this.bBoxMeters[0], 0, this.map.ProjectionId)).toGeoPoint() as GeoPoint;
        const point2 = (new MapPoint(this.bBoxMeters[3], this.bBoxMeters[2], 0, this.map.ProjectionId)).toGeoPoint() as GeoPoint;
        this.bBoxDegrees = [point1.getLongitude(), point1.getLatitude(), point2.getLongitude(), point2.getLatitude()];
        this.widgetProps = widgetProps;
        this.options = this.widgetProps.constructorOptions;
        this.isPdf = this.widgetProps.constructorOptions.format === 'pdf';
        this.width = this.map.getWindowSize()[0];
        this.height = this.map.getWindowSize()[1];
        this.scale = 1;
        if (this.isPdf) {
            const parameters = this.getMapImageParametersForPdf();
            this.width = parameters.width;
            this.height = parameters.height;
            this.scale = parameters.scale;
        }
    }

    get layersByServices(): { [serviceUrl: string]: Layer[] } {
        const layersByServices: { [serviceUrl: string]: Layer[] } = {};
        this.widgetProps.layersSelected.forEach((layer) => {
            const serviceUrl = layer.serviceUrl || this.map.options.url;
            if (!layersByServices[serviceUrl]) {
                layersByServices[serviceUrl] = [];
            }
            layersByServices[serviceUrl].push(layer);
        });
        return layersByServices;
    }

    get serviceUrls(): string[] {
        return Object.keys(this.layersByServices);
    }

    get layersSortedByViewOrder(): Layer[] {
        return this.widgetProps.layersSelected.sort((a, b) => {
            let aOrder = this.map.tiles.viewOrder.indexOf(a.id);
            if (aOrder === -1) {
                aOrder = this.widgetProps.layersSelected.indexOf(a) + this.widgetProps.layersSelected.length;
            }
            let bOrder = this.map.tiles.viewOrder.indexOf(b.id);
            if (bOrder === -1) {
                bOrder = this.widgetProps.layersSelected.indexOf(b) + this.widgetProps.layersSelected.length;
            }
            if (aOrder > bOrder) {
                return 1;
            }
            if (aOrder < bOrder) {
                return -1;
            }
            return 0;
        });
    }

    get layersSortedAndGroupedByServices(): ServiceUrlAndLayers[] {
        const serviceUrlsAndLayers: ServiceUrlAndLayers[] = [];
        let lastService = '';
        let layersGroup: Layer[] = [];
        this.layersSortedByViewOrder.forEach((layer) => {
            const serviceUrl = layer.serviceUrl || this.map.options.url;
            if (serviceUrl !== lastService) {
                if (layersGroup.length) {
                    serviceUrlsAndLayers.push({
                        serviceUrl: lastService,
                        layers: layersGroup
                    });
                }
                lastService = serviceUrl;
                layersGroup = [];
            }
            layersGroup.push(layer);
        });
        if (layersGroup.length) {
            serviceUrlsAndLayers.push({
                serviceUrl: lastService,
                layers: layersGroup
            });
        }
        return serviceUrlsAndLayers;
    }

    get fileExtension(): ExportReportFormatItem['fileExtension'] {
        return this.widgetProps.formats.find(format => format.code === this.options.format)?.fileExtension || '';
    }

    get show(): ExportReportBodyForMakeReport['show'] {
        return {
            logotype: this.options.showLogotype,
            headers: this.options.showHeaders && this.isPdf,
            legend: this.options.showLegend,
            northArrow: this.options.showNorthArrow,
            scale: this.options.showScale,
            scaleBar: this.options.showScaleBar,
            coordinateSystem: this.options.showCoordinateSystem,
            coordinateGrid: this.options.showCoordinateGrid,
            features: this.options.showFeatures && this.isPdf,
            pageNumeration: this.options.showPageNumeration && this.isPdf,
            date: this.options.showDate && this.isPdf,
            stamp: this.options.showStamp && this.isPdf
        };
    }

    get font(): ExportReportBodyForMakeReport['font'] {
        return {
            family: this.options.font.family,
            size: this.options.font.size
        };
    }

    protected getMapImageParametersForPdf(): ExportReportImageParametersForPdf {
        const parameters: ExportReportImageParametersForPdf = {
            width: this.width,
            height: this.height,
            scale: 1
        };

        const pageFormat = this.widgetProps.pageFormats.find(pageFormat => pageFormat.code === this.options.pageOptions.format);
        const pageOrientation = this.widgetProps.pageOrientations.find(pageOrientation => pageOrientation.code === this.options.pageOptions.orientation);
        if (!pageFormat || !pageOrientation) {
            return parameters;
        }

        const pageWidth = (pageOrientation.code === 'portrait') ? pageFormat.width : pageFormat.height;
        const pageHeight = (pageOrientation.code === 'portrait') ? pageFormat.height : pageFormat.width;

        const frameDesignHeight = 40;
        const frameDesignMarginY = (this.options.showLogotype || this.options.showHeaders || this.options.showStamp) ? frameDesignHeight : 0;
        const availableWidth = this.mm2pixel(pageWidth - this.options.pageOptions.margins[1] - this.options.pageOptions.margins[3]);
        const availableHeight = this.mm2pixel(pageHeight - this.options.pageOptions.margins[0] - this.options.pageOptions.margins[2] - frameDesignMarginY);
        if (availableWidth === 0 || availableHeight === 0) {
            return parameters;
        }

        const kWidth = parameters.width / availableWidth;
        const kHeight = parameters.height / availableHeight;
        parameters.scale = Math.max(kWidth, kHeight);
        if (parameters.scale === 0) {
            return parameters;
        }

        parameters.width /= parameters.scale;
        parameters.height /= parameters.scale;
        return parameters;
    }

    protected mm2pixel(mm: number, dpi: number = 96): number {
        return mm * dpi / 25.4;
    }

    public getMergedImagesParameters(layers: Layer[]): GetMapImageParams[] {
        const kDpi = this.getKDpi();
        const options: GetMapImageParams[] = [{
            LAYER: '',
            CRS: this.map.ProjectionId,
            BBOX: this.bBoxMeters.join(','),
            OBJECTVIEWSCALE: Math.round(this.map.getZoomScale(this.map.options.tilematrix) * kDpi * this.scale).toString(),
            WIDTH: Math.floor(this.width * kDpi).toString(),
            HEIGHT: Math.floor(this.height * kDpi).toString(),
            DPI: this.options.dpi,
            FORMAT: 'image/png',
            NOPAINTERROR: '1',
        }];

        layers.forEach((layer: Layer) => {
            if (layer instanceof WmsLayer && !layer.checkViewState()) {
                return;
            }
            let parameters: {[key: string]: string | SimpleJson<any>} = {
                LAYER: layer.idLayer
            };
            if (layer instanceof WmsLayer) {
                const filter = layer.getFilter();
                filter?.forEach(item => {
                    parameters[item.name] = item.value;
                });
            }
            options.push(parameters as GetMapImageParams);
        });

        return options;
    }

    protected getKDpi(): number {
        return parseInt(this.options.dpi) / parseInt(EXPORT_REPORT_DEFAULT_DPI);
    }

    public getStatisticsParameters(): { BBOX: string; SRSNAME: string; OBJECTVIEWSCALE: string; } {
        return {
            BBOX: this.bBoxMeters.join(','),
            SRSNAME: this.map.ProjectionId,
            OBJECTVIEWSCALE: parseInt(String(this.map.getZoomScale(this.map.options.tilematrix))).toString()
        };
    }

    public getBodyForMakeReport(mapImages: string[], logotypeData: string, legendData: ExportReportLegendFormatted, coordinateSystemDescription: string, features: ExportReportFeatureCollectionFormatted, featuresParameters: ExportReportFeaturesParameters, attributes?: ExportReportAttributes): ExportReportBodyForMakeReport {
        const kDpi = this.getKDpi();
        const requestBody: ExportReportBodyForMakeReport = {
            format: this.options.format,
            width: Math.floor(this.width * kDpi),
            height: Math.floor(this.height * kDpi),
            show: this.show,
            dpi: this.options.dpi,
            mapImages,
            font: this.font,
            reportVersion: this.options.reportVersion
        };

        if (this.isPdf) {
            requestBody.page = this.getPageParameters();
        }
        if (requestBody.show.logotype && this.isLogotypeSelected() && logotypeData) {
            requestBody.logotype = this.getLogotype(logotypeData);
        }
        if (this.isPdf && requestBody.show.headers) {
            requestBody.headers = this.getHeaders();
        }
        if (requestBody.show.legend) {
            requestBody.legend = this.getLegend();
            requestBody.legendData = legendData;
        }
        if (requestBody.show.scale) {
            requestBody.scale = this.getScale();
        }
        if (requestBody.show.scaleBar) {
            requestBody.scaleBar = this.getScaleBar();
        }
        if (requestBody.show.coordinateSystem) {
            requestBody.coordinateSystem = coordinateSystemDescription;
        }
        if (requestBody.show.coordinateGrid) {
            requestBody.coordinateGridOptions = this.getCoordinateGridOptions();
        }
        if (requestBody.show.features) {
            requestBody.features = features;
            requestBody.featuresParameters = featuresParameters;
        }
        if (this.isPdf && requestBody.show.pageNumeration) {
            requestBody.pageNumeration = this.getPageNumeration();
        }
        if (requestBody.show.date) {
            requestBody.date = this.getDate();
        }
        if (requestBody.show.stamp) {
            requestBody.stamp = this.getStamp();
        }

        if (attributes) {
            requestBody.attributes = attributes;
        }

        return requestBody;
    }

    protected getPageParameters(): ExportReportPageParameters {
        return {
            format: this.options.pageOptions.format,
            orientation: this.options.pageOptions.orientation,
            margins: {
                top: this.options.pageOptions.margins[0],
                right: this.options.pageOptions.margins[1],
                bottom: this.options.pageOptions.margins[2],
                left: this.options.pageOptions.margins[3]
            }
        };
    }

    protected isLogotypeSelected(): boolean {
        return this.options.logotypeOptions.logotype >= 0;
    }

    protected getLogotype(logotypeData: string): ExportReportLogotypeRequestParameters {
        return {
            data: logotypeData,
            position: {
                top: this.options.logotypeOptions.position.top,
                left: this.options.logotypeOptions.position.left
            }
        };
    }

    protected getHeaders(): ExportReportHeaderItem[] {
        return this.options.headerOptions.headers.filter(header => header.text.trim());
    }

    protected getLegend(): ExportReportLegendParameters {
        const legend: ExportReportLegendParameters = {
            iconSize: this.options.legendOptions.iconSize,
            fontFamily: this.options.legendOptions.fontFamily,
            fontSize: this.options.legendOptions.fontSize,
            aboveMap: true
        };
        if (this.isPdf) {
            legend.aboveMap = this.options.legendOptions.aboveMap;
        }
        if (legend.aboveMap) {
            legend.position = {
                right: this.options.legendOptions.position.right,
                bottom: this.options.legendOptions.position.bottom
            };
        }
        return legend;
    }

    protected getScale(): string {
        return i18n.t('phrases.Map scale') as string + ' 1 : ' + Math.round(this.map.getZoomScale(this.map.options.tilematrix) * this.scale);
    }

    protected getScaleBar(): ExportReportScaleBarCalculated {
        const sizeX = this.map.getWindowSize()[0];
        const geoPoint = this.map.getCenterGeoPoint();
        const maxWidth = 100;
        const scale = this.map.getZoomScale(this.map.options.tilematrix);
        const latitudeRad = Trigonometry.toRadians(geoPoint.getLatitude());
        const widthMeters = scale * sizeX * 0.00027 * Math.cos(latitudeRad);
        const rulerMeters = widthMeters * maxWidth / sizeX * this.scale;
        const rulesMetersStrLen = Math.floor(rulerMeters).toString().length;
        const pow10 = Math.pow(10, rulesMetersStrLen);
        const k = [1, 0.5, 0.3, 0.2].find(one => rulerMeters / pow10 >= one) || 0.1;
        const meters = pow10 * k;
        const width = Math.round(maxWidth * meters / rulerMeters);
        const value = meters >= 1000 ? meters / 1000 : meters;
        const unit = meters >= 1000 ? i18n.t( 'phrases.kilometers' ) as string : i18n.t( 'phrases.meters' ) as string;
        return {
            width: width,
            value: value,
            unit: unit
        };
    }

    protected getCoordinateGridOptions(): ExportReportCoordinateGridParameters {
        if ((this.options.coordinateGridOptions.systemType === ExportReportCoordinateSystemType.Meters)) {
            return {
                bBox: this.reducePrecision(this.bBoxMeters),
                systemType: this.options.coordinateGridOptions.systemType,
                step: this.options.coordinateGridOptions.stepMeters
            };
        } else {
            return {
                bBox: this.reducePrecision(this.bBoxDegrees),
                systemType: this.options.coordinateGridOptions.systemType,
                step: this.options.coordinateGridOptions.stepDegrees
            };
        }
    }

    protected reducePrecision(bBox: ExportReportBBox): ExportReportBBox {
        return bBox.map((value: number) => {
            return parseFloat(value.toFixed(6));
        }) as ExportReportBBox;
    }

    protected getPageNumeration(): ExportReportPageNumerationParameters {
        return {
            fontFamily: this.options.pageNumerationOptions.fontFamily,
            fontSize: this.options.pageNumerationOptions.fontSize,
            bottom: this.options.pageNumerationOptions.bottom
        };
    }

    protected getDate(): string {
        return i18n.t('exportReport.Print date') + ' ' + getDateWithFormat(this.options.dateOptions.format);
    }

    protected getStamp(): ExportReportStampParameters {
        return {
            type: this.options.stampOptions.type,
            typeDescription: this.options.stampOptions.typeDescription,
            fontFamily: this.options.stampOptions.fontFamily,
            fontSize: this.options.stampOptions.fontSize,
            organizationName: this.options.stampOptions.organizationName,
            organizationAddress: this.options.stampOptions.organizationAddress
        };
    }

}
