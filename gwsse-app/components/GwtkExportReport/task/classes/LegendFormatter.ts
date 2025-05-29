import {GwtkMap, Legend} from '~/types/Types';
import {ExportReportLegendFormatted, ExportReportLegendKeyData} from '../../../../service/GISWebServerSEService/Types';
import {
    ExportReportClassifiers,
    ExportReportLegendDataIndexed,
    ExportReportStatisticKeys,
    ExportReportProgressStage
} from '../Types';
import RequestServices, {ServiceType} from '~/services/RequestServices';


export class LegendFormatter {

    private readonly map: GwtkMap;

    protected iconSize: number = 48;

    protected legendDataIndexed: ExportReportLegendDataIndexed = {};

    protected formatted: ExportReportLegendFormatted = {};
    protected count: {
        sent: number;
        done: number;
    } = {
        sent: 0,
        done: 0
    };

    protected resolve: (value: (void)) => void = () => {
    };

    protected progressCallback?: (stage: ExportReportProgressStage, progress: number) => void;

    constructor(map: GwtkMap) {
        this.map = map;
    }

    setIconSize(iconSize: number): void {
        this.iconSize = iconSize;
    }

    async formatLegend(statisticKeys: ExportReportStatisticKeys, classifiers: ExportReportClassifiers, progressCallback?: ((stage: ExportReportProgressStage, value: number) => void)): Promise<ExportReportLegendFormatted> {
        this.progressCallback = progressCallback;
        this.formatted = {};
        await this.indexLegends(classifiers);
        this.processStatisticKeys(statisticKeys);
        await this.fetchLegendImages();
        return this.formatted;
    }

    protected async indexLegends(classifiers: ExportReportClassifiers): Promise<void> {
        for (const schemeName in classifiers) {
            const legend: Legend = await classifiers[schemeName].getLegend();
            for (const nodeBranch of legend.nodes) {
                for (const nodeLeaf of nodeBranch.nodes) {
                    if (!this.legendDataIndexed[schemeName]) {
                        this.legendDataIndexed[schemeName] = {};
                    }
                    this.legendDataIndexed[schemeName][nodeLeaf.key] = {
                        url: nodeLeaf.image,
                        name: nodeLeaf.text
                    };
                }
            }
        }
    }

    protected processStatisticKeys(statisticKeys: ExportReportStatisticKeys): void {
        for (const schemeName in statisticKeys) {
            const schemeData = statisticKeys[schemeName];
            for (const groupCode in schemeData) {
                const groupData = schemeData[groupCode];
                for (const key of groupData.keys) {
                    if (!this.legendDataIndexed[schemeName] || !this.legendDataIndexed[schemeName][key]) {
                        continue;
                    }
                    const keyData = this.legendDataIndexed[schemeName][key];
                    const realSchemeName = this.getRealSchemeName(keyData.url) || schemeName;
                    if (!this.formatted[realSchemeName]) {
                        this.formatted[realSchemeName] = {};
                    }
                    if (!this.formatted[realSchemeName][groupCode]) {
                        this.formatted[realSchemeName][groupCode] = {
                            name: groupData.name,
                            keys: []
                        };
                    }
                    this.formatted[realSchemeName][groupCode].keys.push(keyData);
                }
            }
        }
    }

    protected getRealSchemeName(url?: string): string | undefined {
        if (url) {
            const regexpResult = decodeURIComponent(url).match(/.*base\/schemas\/([^/]+)\/.*/);
            if (regexpResult) {
                return regexpResult[1];
            }
        }
    }

    protected async fetchLegendImages(): Promise<void> {
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.resetBeforeGetData();
            for (const schemeName in this.formatted) {
                const schemeData = this.formatted[schemeName];
                for (const groupCode in schemeData) {
                    const groupData = schemeData[groupCode];
                    groupData.keys.forEach(keyData => {
                        this.sendRequestForGetImage(keyData, schemeName);
                    });
                }
            }
            this.checkAllRequestsDone();
        });
    }

    protected resetBeforeGetData(): void {
        this.count = {
            sent: 0,
            done: 0
        };
    }

    protected sendRequestForGetImage(keyData: ExportReportLegendKeyData, schemeName: string): void {
        if (!keyData.url) {
            return;
        }
        const final = (url?: string) => {
            keyData.url = url;
            this.count.done++;
            this.checkAllRequestsDone();
        };
        const setError = function () {
            final();
        };

        const url = this.replaceIconSizeInUrl(keyData.url, schemeName);
        this.count.sent++;

        const httpParamsWms = RequestServices.createHttpParams(this.map);
        const service = RequestServices.retrieveOrCreate(httpParamsWms, ServiceType.REST);
        service.fetchLegendImage(url)
            .then(result => {
                const reader = new FileReader();
                reader.onload = function () {
                    final(this.result as string);
                };
                reader.onerror = setError;
                reader.readAsDataURL(result.data as Blob);
            }).catch(setError);
    }

    protected checkAllRequestsDone(): void {
        if (this.count.sent && this.progressCallback) {
            const progress = this.count.done / this.count.sent;
            this.progressCallback(ExportReportProgressStage.Legend, progress);
        }
        if (this.count.sent === this.count.done) {
            this.resolve();
        }
    }

    protected replaceIconSizeInUrl(url: string, schemeName: string): string {
        const match = url.match(/filepath=(.*)&?/i) || [];
        let filepath = match[1];
        if (filepath.slice(-1) === '&') {
            filepath = filepath.slice(0, -1);
        }
        let filepathClear = decodeURIComponent(filepath);
        const regExp = new RegExp('base/schemas/' + schemeName + '/[0-9]+/');
        const newFilepathClear = filepathClear.replace(regExp, 'base/schemas/' + schemeName + '/' + this.iconSize.toString() + '/');
        const newFilepath = encodeURIComponent(newFilepathClear);
        return url.replace(filepath, newFilepath);
    }

}
