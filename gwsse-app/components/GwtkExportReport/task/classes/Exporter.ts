import {GwtkComponentDescriptionPropsData, GwtkMap} from '~/types/Types';
import {
    ExportReportClassifiers,
    ExportReportStatisticKeys,
    ExportReportWidgetParams,
    ExportReportProgressStage,
    ServiceUrlAndLayers
} from '../Types';
import {Builder} from './Builder';
import i18n from '@/plugins/i18n';
import {LogEventType} from '~/types/CommonTypes';
import {FeaturesFormatter} from './FeaturesFormatter';
import {LegendFormatter} from './LegendFormatter';
import {GetMapImageParams} from '~/services/RequestServices/RestService/Types';
import {StatisticList} from '~/services/Search/mappers/GISWebServiceSEMapper';
import Layer from '~/maplayers/Layer';
import GISWebServerSEService from '../../../../../gwsse-app/service/GISWebServerSEService';
import WmsLayer from '~/maplayers/WmsLayer';
import {
    ExportReportAttributes,
    ExportReportBodyForMakeReport,
    ExportReportFeatureCollectionFormatted,
    ExportReportFeaturesParameters
} from '../../../../service/GISWebServerSEService/Types';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import {BYXSD_VALUE} from '~/services/RequestServices/common/enumerables';
import {ParseTextToXml} from '~/services/Utils/XMLDoc';
import XMLElement from '~/services/Utils/XMLElement';
import {TileLayer} from '~/maplayers/TileLayer';
import {isLayerServiceSupported} from '../helpers/LayerHelper';
import {Logotype} from './Logotype';

export class Exporter {

    private readonly map: GwtkMap;
    private readonly featuresFormatter: FeaturesFormatter;
    private readonly legendFormatter: LegendFormatter;

    protected builder!: Builder;

    protected coordinateSystemDescription: string = '';
    protected featuresFormatted: ExportReportFeatureCollectionFormatted = {};
    protected featuresParameters: ExportReportFeaturesParameters = {
        fontFamily: '',
        fontSize: 0
    };
    protected iconSize: ExportReportWidgetParams['constructorOptions']['legendOptions']['iconSize'] = 48;
    protected attributes?: ExportReportAttributes = undefined;

    protected resolve: (value: (void)) => void = () => {
    };
    protected reject: () => void = () => {
    };
    protected count: {
        sent: number;
        received: number;
        success: number;
    } = {
        sent: 0,
        received: 0,
        success: 0
    };
    protected classifiers: ExportReportClassifiers = {};
    protected mapImagesBase64: string[] = [];
    protected logotypeData: string = '';
    protected statisticKeys: ExportReportStatisticKeys = {};
    protected progressCallback?: (stage: ExportReportProgressStage, value: number) => void;

    constructor(map: GwtkMap) {
        this.map = map;
        this.featuresFormatter = new FeaturesFormatter(map);
        this.legendFormatter = new LegendFormatter(map);
    }

    get progress(): number {
        let progress = 0;
        if (this.count.sent) {
            progress = this.count.success / this.count.sent;
        }
        return progress;
    }

    async send(widgetProps: GwtkComponentDescriptionPropsData & ExportReportWidgetParams, progressCallback: ((stage: ExportReportProgressStage, value: number) => void)): Promise<unknown> {
        this.progressCallback = progressCallback;
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.resetBeforeGetData();
            this.builder = new Builder(this.map, widgetProps);

            const layers: ServiceUrlAndLayers[] = this.builder.layersSortedAndGroupedByServices;
            let counter = 0;
            layers.forEach((serviceUrlAndLayers) => {
                const firstLayer = serviceUrlAndLayers.layers[0];
                if (firstLayer && isLayerServiceSupported(firstLayer)) {
                    this.sendRequestForGetImage(serviceUrlAndLayers, counter++);
                } else {
                    serviceUrlAndLayers.layers.forEach((layer: Layer) => {
                        if (layer instanceof TileLayer) {
                            this.fetchTileLayerDataUrl(layer, counter++);
                        } else {
                            console.warn('Layer service is not supported while fetching image.', firstLayer.serviceUrl);
                        }
                    });
                }
            });

            if (widgetProps.constructorOptions.showLogotype) {
                const logotype = widgetProps.logotypes[widgetProps.constructorOptions.logotypeOptions.logotype];
                this.fetchLogotypeData(logotype);
            }

            if (widgetProps.constructorOptions.showCoordinateSystem) {
                this.fetchCoordinateSystem();
            }

            if (widgetProps.constructorOptions.format === 'pdf' && widgetProps.constructorOptions.showFeatures) {
                this.featuresFormatted = this.featuresFormatter.formatFeatures(this.map.getSelectedObjects());
                this.featuresParameters = {
                    fontFamily: widgetProps.constructorOptions.featuresOptions.fontFamily,
                    fontSize: widgetProps.constructorOptions.featuresOptions.fontSize
                };
            }

            if (widgetProps.constructorOptions.format === 'pdf' && widgetProps.constructorOptions.showAttributes && widgetProps.attributes) {
                this.attributes = widgetProps.attributes;
            }

            if (widgetProps.constructorOptions.showLegend) {
                this.iconSize = widgetProps.constructorOptions.legendOptions.iconSize;
                for (const serviceUrl of this.builder.serviceUrls) {
                    const layersBySchemes: {[schemeName: string]: Layer[]} = this.getLayersBySchemes(serviceUrl);
                    for (let schemeName in layersBySchemes) {
                        this.sendRequestForGetLegendKeys(serviceUrl, schemeName, layersBySchemes[schemeName]);
                        this.sendRequestForCreateLegends(serviceUrl, layersBySchemes[schemeName]);
                    }
                }
            }

            this.addCounterAwait();
        });
    }

    unwatchProgress(): void {
        this.progressCallback = undefined;
    }

    protected resetBeforeGetData(): void {
        this.count = {
            sent: 0,
            received: 0,
            success: 0
        };
        this.classifiers = {};
        this.mapImagesBase64 = [];
        this.statisticKeys = {};
    }

    protected sendRequestForGetImage(serviceUrlAndLayers: ServiceUrlAndLayers, index: number): void {

        const httpParamsWms = RequestServices.createHttpParams(this.map, {url: serviceUrlAndLayers.serviceUrl});
        const service = RequestServices.retrieveOrCreate(httpParamsWms, ServiceType.REST);
        const options: GetMapImageParams[] = this.builder.getMergedImagesParameters(serviceUrlAndLayers.layers);
        if (options.length < 2) {
            return;
        }

        this.count.sent++;
        service.getWmsImage(options).then(response => {
            let image = new Image();
            image.onload = () => {
                let canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                canvas.getContext('2d')?.drawImage(image, 0, 0);
                canvas.toBlob((blob: Blob | null) => {
                    this.extractReceivedImage(blob, index).then();
                });
            };
            image.onerror = () => {
                this.count.received++;
                this.writeErrorToProtocol();
                this.checkAllRequestsDone();
            };
            image.src = URL.createObjectURL(response.data!);
        }).catch(() => {
            this.count.received++;
            this.writeErrorToProtocol();
            this.checkAllRequestsDone();
        });
    }

    protected async extractReceivedImage(blob: Blob | null, index: number): Promise<void> {
        if (blob) {
            this.mapImagesBase64[index] = await this.blobToData(blob) as string;
            this.count.success++;
        }

        this.count.received++;
        this.checkAllRequestsDone();
    }

    protected blobToData(blob: Blob): Promise<unknown> {
        return new Promise((resolve, _) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    protected writeErrorToProtocol(): void {
        this.map.writeProtocolMessage({
            text: i18n.tc('exportReport.Failed to get report data') + '',
            type: LogEventType.Info,
            display: true
        });
    }

    protected fetchTileLayerDataUrl(layer: TileLayer, index: number): void {
        this.count.sent++;
        layer.getLayerDataUrl().then(dataUrl => {
            this.mapImagesBase64[index] = dataUrl;
            this.count.received++;
            this.count.success++;
        });
    }

    protected async fetchLogotypeData(logotype: Logotype): Promise<void> {
        this.count.sent++;
        const result = await logotype.fetchData().catch(() => {
            this.writeErrorToProtocol();
        });
        this.count.received++;
        if (result) {
            this.logotypeData = result;
            this.count.success++;
        }
        this.checkAllRequestsDone();
    }

    protected async fetchCoordinateSystem(): Promise<void> {
        this.coordinateSystemDescription = i18n.t('exportReport.Coordinate system') + ' EPSG:' + this.getEpsgCode();

        this.count.sent++;
        const httpParamsWms = RequestServices.createHttpParams(this.map);
        const service = RequestServices.retrieveOrCreate(httpParamsWms, ServiceType.REST);
        const result = await service.getCrsList().catch(() => {
            this.writeErrorToProtocol();
        });
        this.count.received++;
        if (result && result.data) {
            this.count.success++;
            const xml = ParseTextToXml(result.data);
            this.setCoordinateSystemFromXml(xml);
        }
        this.checkAllRequestsDone();
    }

    protected getEpsgCode(): number {
        if (this.map.options.tilematrixset === 'GoogleMapsCompatible') {
            return 3857;
        }
        return parseInt(this.map.options.tilematrixset.replace(/\D/g, ''));
    }

    protected setCoordinateSystemFromXml(xml: XMLElement): void {
        const epsgCode = this.getEpsgCode();
        const coordinateSystemName = (xml.findByTag('ProjectList'))?.children.find(element => +element.attributes.EPSG === epsgCode)?.attributes.Name;
        if (coordinateSystemName) {
            this.coordinateSystemDescription = i18n.t('exportReport.Coordinate system') + ' ' + coordinateSystemName;
        }
    }

    protected getLayersBySchemes(serviceUrl: string): {[schemeName: string]: Layer[]} {
        const layersBySchemes: {[schemeName: string]: Layer[]} = {};
        for (const layer of this.builder.layersByServices[serviceUrl]) {
            if (layer.hasLegend() && layer.classifier) {
                const schemeName = layer.classifier.schemeName;
                this.classifiers[schemeName] = layer.classifier;
                if (!layersBySchemes[schemeName]) {
                    layersBySchemes[schemeName] = [];
                }
                layersBySchemes[schemeName].push(layer);
            }
        }
        return layersBySchemes;
    }

    protected sendRequestForGetLegendKeys(serviceUrl: string, schemeName: string, layers: Layer[]): void {
        const wmsLayerIds = this.fetchWmsLayerIds(layers);
        if (wmsLayerIds.length) {
            const getLegendParameters = this.builder.getStatisticsParameters();
            this.requestGetLegendKeys(serviceUrl, schemeName, wmsLayerIds, getLegendParameters);
        }
    }

    protected fetchWmsLayerIds(layers: Layer[]): string[] {
        return layers.filter(layer => layer instanceof WmsLayer && layer.checkViewState()).map(layer => layer.idLayer);
    }

    protected requestGetLegendKeys(serviceUrl: string, schemeName: string, layerIds: string[], getLegendParameters: { BBOX: string; SRSNAME: string; OBJECTVIEWSCALE: string; }): void {
        this.count.sent++;

        const httpParamsWms = RequestServices.createHttpParams(this.map, {url: serviceUrl});
        const service = RequestServices.retrieveOrCreate(httpParamsWms, ServiceType.REST);
        service.getFeatureStatistics(layerIds, getLegendParameters).then(response => {
            if (response.data) {
                this.extractReceivedStatistics(schemeName, response.data.statistic);
            }
        }).catch(() => {
        }).finally(() => {
            this.count.success++;
            this.count.received++;
            this.checkAllRequestsDone();
        });
    }

    protected extractReceivedStatistics(schemeName: string, statistic: StatisticList): void {
        const groupNames = Object.fromEntries(statistic.typenames.map(typeName => [typeName.value, typeName.name]));
        if (!this.statisticKeys[schemeName]) {
            this.statisticKeys[schemeName] = {};
        }
        const groups = this.statisticKeys[schemeName];
        statistic.keys.forEach(keyData => {
            if (!groups[keyData.typename]) {
                groups[keyData.typename] = {
                    name: groupNames[keyData.typename],
                    keys: []
                };
            }
            groups[keyData.typename].keys.push(keyData.value);
        });
    }

    protected sendRequestForCreateLegends(serviceUrl: string, layers: Layer[]): void {
        const wmsLayerIds = this.fetchWmsLayerIds(layers);
        wmsLayerIds.forEach(layerId => {
            this.requestCreateLegend(serviceUrl, layerId);
        });
    }

    protected requestCreateLegend(serviceUrl: string, layerId: string): void {
        this.count.sent++;

        const httpParamsWms = RequestServices.createHttpParams(this.map, {url: serviceUrl});
        const service = RequestServices.retrieveOrCreate(httpParamsWms, ServiceType.REST);
        service.createLegend({
            LAYER: encodeURIComponent(layerId),
            WIDTH: this.iconSize.toString() as '48',
            BYXSD: BYXSD_VALUE.ByScheme,
            OBJLOCAL: '0,1,2,4,5'
        }).catch(() => {
        }).finally(() => {
            this.count.success++;
            this.count.received++;
            this.checkAllRequestsDone();
        });
    }

    protected addCounterAwait(): void {
        this.count.sent++;
        setTimeout(() => {
            this.count.success++;
            this.count.received++;
            this.checkAllRequestsDone();
        });
    }

    protected checkAllRequestsDone(): void {
        this.progressCallback && this.progressCallback(ExportReportProgressStage.Prepare, this.progress);

        if (this.count.sent === this.count.received) {
            if (this.count.sent === this.count.success) {
                this.makeReport().then();
            } else {
                this.reject();
            }
        }
    }

    protected async makeReport(): Promise<void> {
        this.legendFormatter.setIconSize(this.iconSize);
        const legendData = await this.legendFormatter.formatLegend(this.statisticKeys, this.classifiers, this.progressCallback);
        const requestBody = this.builder.getBodyForMakeReport(this.mapImagesBase64, this.logotypeData, legendData, this.coordinateSystemDescription, this.featuresFormatted, this.featuresParameters, this.attributes);
        this.sendRequestForMakeReport(requestBody);
    }

    protected sendRequestForMakeReport(requestBody: ExportReportBodyForMakeReport): void {
        this.progressCallback && this.progressCallback(ExportReportProgressStage.Report, 0.5);

        const requestService = new GISWebServerSEService();
        requestService.makeReport(requestBody).then(result => {
            if (result && result.data) {
                this.progressCallback && this.progressCallback(ExportReportProgressStage.Report, 1);
                this.downloadReport(result.data);
            }
        }).catch(() => {
            this.writeErrorToProtocol();
            this.reject();
        });
    }

    protected downloadReport(result: Blob): void {
        const objectUrl = window['URL'].createObjectURL(result);

        const a = document.createElement('a');
        a.style.display = 'none';
        document.body.appendChild(a);
        a.href = objectUrl;
        a.download = this.getDownloadFileName();
        a.click();

        setTimeout(() => {
            window['URL'].revokeObjectURL(objectUrl);
            a.parentNode?.removeChild(a);
            this.resolve();
        });
    }

    protected getDownloadFileName(): string {
        const date = this.getDateLocalized();
        return i18n.tc('exportReport.Report') + ' ' + date + '.' + this.builder.fileExtension;
    }

    protected getDateLocalized(): string {
        const dateLocalized = (new Date).toLocaleString('ru', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        return dateLocalized.replace(/[.:]/g, '_').replace(',', '');
    }

}
