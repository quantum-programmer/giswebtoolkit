import GISWebServerSEService from '../../../../service/GISWebServerSEService';
import {ExportReportLogotypeItem} from '../../../../service/GISWebServerSEService/Types';

export class Logotype {

    private static readonly gwsseUrl = new GISWebServerSEService().getDefaults().url;

    private readonly isPathAbsolute: boolean;

    public readonly url: string;

    public readonly label: string;

    constructor(logotypeParameters: ExportReportLogotypeItem) {
        this.isPathAbsolute = new RegExp('^(ftp|http|https)+://', 'i').test(logotypeParameters.path);
        this.url = this.isPathAbsolute ? logotypeParameters.path : Logotype.gwsseUrl + 'query.php?cmd=getLogotype&file=' + logotypeParameters.path;
        this.label = logotypeParameters.label;
    }

    fetchData(): Promise<string> {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = () => {
                resolve(reader.result as string);
            };
            reader.onerror = () => {
                reject(new Error('Can not parse logotype file.'));
            };
            if (this.isPathAbsolute) {
                fetch(this.url)
                    .then(response => {
                        if (response.ok) {
                            return response.blob();
                        }
                        throw new Error('Can not fetch logotype file.');
                    })
                    .then(blob => reader.readAsDataURL(blob))
                    .catch(reject.bind(reject));
            } else {
                new GISWebServerSEService().fetchExportReportLogotype(this.url)
                    .then(result => {
                        reader.readAsDataURL(result.data as Blob);
                    }).catch(() => {
                        reject(new Error('Can not fetch logotype file.'));
                    });
            }
        });
    }

}
