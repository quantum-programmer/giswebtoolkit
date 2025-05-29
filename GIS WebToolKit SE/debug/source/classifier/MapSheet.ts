/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Список листов карты                      *
 *                                                                  *
 *******************************************************************/

import RequestServices, { ServiceType } from '~/services/RequestServices';
import RequestService from '~/services/RequestServices/common/RequestService';
import { GetSheetNameResponse } from '~/services/RequestServices/RestService/Types';


type MapSheetParams = {
    serviceUrl?: string;
    layerId?: string;
}

export default class MapSheet {

    private readonly mapSheetNames: string[] = [];

    private mapSheetsRequestPromise?: Promise<string[]>;

    private isReady = false;

    private abortXhr?: () => void;

    /**
     * @constructor
     * @param params{MapSheetParams} Параметры для запроса
     */
    constructor( private readonly params: MapSheetParams = {} ) {
    }

    set serviceUrl( url: string ) {
        this.params.serviceUrl = url;
    }

    get serviceUrl(): string {
        return this.params.serviceUrl || '';
    }

    /**
     * Получить листы карты
     * @method getMapSheetNames
     * @return {Promise<String[]>} Promise с листами карты
     */
    getMapSheetNames(): Promise<string[]> {
        return this.getMapSheetNamesInstance();
    }

    cancelRequest(): void {
        if ( this.abortXhr ) {
            this.abortXhr();
            this.abortXhr = undefined;
        }
    }

    clear(): void {
        this.isReady = false;
        this.mapSheetsRequestPromise = undefined;
        this.cancelRequest();
    }

    /**
     * Получить листы карты
     * @private
     * @method getMapSheetNamesInstance
     * @return {Promise<String[]>} Promise с листами карты
     */
    private getMapSheetNamesInstance(): Promise<string[]> {
        if ( this.isReady ) {
            return Promise.resolve( this.mapSheetNames );
        }

        if ( this.mapSheetsRequestPromise ) {
            return this.mapSheetsRequestPromise;
        }

        return this.mapSheetsRequestPromise = this.requestMapSheetNames();
    }

    /**
     * Запросить листы карты
     * @private
     * @async
     * @method requestMapSheetNames
     * @return {Promise<string[]>} Promise с легендой
     */
    private async requestMapSheetNames(): Promise<string[]> {
        if ( this.params.serviceUrl && this.params.layerId ) {
            const restService = RequestServices.retrieveOrCreate( { url: this.params.serviceUrl }, ServiceType.REST );

            try {
                const request = RequestService.sendCancellableRequest( restService.getSheetName.bind( restService ), {
                    LAYER: this.params.layerId
                } );

                this.abortXhr = () => request.abortXhr( 'Cancelled by User' );

                const mapSheetNamesResponse = await request.promise;

                this.onSuccess( mapSheetNamesResponse.data );

            } catch ( error ) {
                this.onError();
                throw error;
            }
        }

        return this.mapSheetNames;
    }

    private onSuccess( response?: GetSheetNameResponse ): void {

        this.isReady = true;
        this.abortXhr = undefined;
        this.mapSheetsRequestPromise = undefined;

        if ( response ) {

            let mapSheetNamesList = response.restmethod.outparams.map( sheet => sheet.value );

            this.mapSheetNames.push( ...mapSheetNamesList );
        }

    }

    private onError(): void {
        this.clear();
    }

}
