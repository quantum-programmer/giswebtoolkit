/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Список семантик слоев классификатора              *
 *                                                                  *
 *******************************************************************/


import { GetLayerSemanticListResponse, RscSemantic } from '~/services/RequestServices/RestService/Types';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import RequestService from '~/services/RequestServices/common/RequestService';
import { AuthParams } from '~/types/CommonTypes';

type Params = {
    serviceUrl?: string;
    layerId?: string;
    filters?: Filters;
}

type Filters = {
    INMAP?: '1';
    CODELIST?: string;
    TYPENAMES?: string;

}

export type ClassifierLayerSemantics = {
    name: string;
    alias: string;
    rscsemantic: RscSemantic[];
};

/**
 * Класс списка семантик слоев классификатора
 * @class SemanticList
 */
export default class SemanticList {

    private readonly semanticList: ClassifierLayerSemantics[] = [];                          // список семантик слоев классификатора

    private isReady = false;

    private semanticListRequestPromise?: Promise<ClassifierLayerSemantics[]>;
    private abortXhr?: () => void;

    private readonly authParams!: AuthParams;

    /**
     * @constructor
     * @param params{Params} Параметры для запроса
     * @param authParams{AuthParams} Http-параметры для запроса
     */
    constructor( private readonly params: Params = {}, authParams: AuthParams ) {
        Reflect.defineProperty(this, 'authParams', {
            enumerable: true,
            get: function () {
                return authParams;
            }.bind(this)
        });
    }

    /**
     * Получить список семантик всех слоев
     * @async
     * @method getAllSemantics
     * @return {Promise<RscSemantic[]>} Promise со списком семантик
     */
    async getAllSemantics(): Promise<RscSemantic[]> {
        const semanticList = await this.getLayerSemanticList();
        let classifierLayerSemantics: RscSemantic[] = [];
        semanticList.map( ( value ) => {
            value.rscsemantic.map( ( value ) => {
                const semanticValue = classifierLayerSemantics.find( element => element.shortname === value.shortname );
                if ( !semanticValue ) {
                    classifierLayerSemantics.push( value );
                }
            } );
        } );

        return classifierLayerSemantics;
    }

    /**
     * Получить список семантик слоя
     * @async
     * @method getLayerSemantics
     * @param layerId {string} Идентификатор слоя классификатора
     * @return {Promise<RscSemantic[]>} Promise со списком семантик
     */
    async getLayerSemantics( layerId: string ): Promise<RscSemantic[] | undefined> {
        const semanticList = await this.getLayerSemanticList();
        const classifierLayerSemantics = semanticList.find( classifierLayerSemantics => classifierLayerSemantics.name === layerId );
        if ( classifierLayerSemantics ) {
            return classifierLayerSemantics.rscsemantic;
        }
    }

    /**
     * Получить список слоев с семантиками
     * @method getClassifierLayerSemanticsList
     * @return {Promise<RscSemantic[]>} Promise со списком слоев с семантиками
     */
    getClassifierLayerSemanticsList(): Promise<ClassifierLayerSemantics[]> {
        return this.getLayerSemanticList();
    }

    /**
     * Получить список семантик по слоям классификатора
     * @private
     * @method getLayerSemanticList
     * @return {Promise<ClassifierLayerSemantics[]>} Promise со списком семантик по слоям классификатора
     */
    private getLayerSemanticList(): Promise<ClassifierLayerSemantics[]> {

        if ( this.isReady ) {
            return Promise.resolve( this.semanticList );
        }

        if ( this.semanticListRequestPromise ) {
            return this.semanticListRequestPromise;
        }

        return this.semanticListRequestPromise = this.requestSemantics();
    }

    /**
     * Запросить список семантик по слоям классификатора
     * @private
     * @async
     * @method requestSemantics
     * @return {Promise<ClassifierLayerSemantics[]>} Promise со списком семантик по слоям классификатора
     */
    private async requestSemantics(): Promise<ClassifierLayerSemantics[]> {
        if ( this.params.serviceUrl && this.params.layerId ) {
            const httpParams = RequestServices.createHttpParams(this.authParams, { url: this.params.serviceUrl });
            const restService = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );

            try {
                const { INMAP, CODELIST, TYPENAMES } = this.params.filters || {};
                const request = RequestService.sendCancellableRequest( restService.getLayerSemanticList.bind( restService ), {
                    LAYER: this.params.layerId,
                    INMAP,
                    CODELIST,
                    TYPENAMES
                } );

                this.abortXhr = () => request.abortXhr( 'Cancelled by User' );

                const semanticListResponse = await request.promise;

                this.onSuccess( semanticListResponse.data );
            } catch ( error ) {
                this.onError();
                throw error;
            }
        }
        return this.semanticList;
    }

    private onSuccess( response?: GetLayerSemanticListResponse ) {
        this.isReady = true;
        this.abortXhr = undefined;
        this.semanticListRequestPromise = undefined;

        if ( response && parseInt( response.restcode ) === 1 ) {
            this.semanticList.push( ...response.features );
        }
    }

    private onError() {
        this.isReady = false;
        this.semanticListRequestPromise = undefined;
        this.abortXhr = undefined;
    }

    cancelRequest() {
        if ( this.abortXhr ) {
            this.abortXhr();
        }
    }

    fromJson( json: { semanticList?: ClassifierLayerSemantics[] } ) {
        this.isReady = true;
        if ( json.semanticList ) {
            this.semanticList.splice( 0, this.semanticList.length, ...json.semanticList );
        }
    }

}
