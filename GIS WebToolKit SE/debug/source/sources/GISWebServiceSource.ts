/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Источник векторных данных                       *
 *                                                                  *
 *******************************************************************/

import MapObject, { TransactionFeature, TransactionType } from '~/mapobject/MapObject';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import { OUTTYPE } from '~/services/RequestServices/common/enumerables';
import GeoJSON, { GeoJsonType } from '~/utils/GeoJSON';
import ObjectStorage from '~/mapobject/ObjectStorage';
import { HttpParams } from '~/services/RequestServices/common/RequestService';
import AbstractVectorSource, { CommitTransactionAnswer, EMPTY_RESULT } from '~/sources/AbstractVectorSource';
import {GetFeatureParams} from '~/services/RequestServices/RestService/Types';


/**
 * Источник векторных данных
 * @class GISWebServiceSource
 */
export default class GISWebServiceSource extends AbstractVectorSource {

    constructor( protected readonly httpParams: HttpParams, protected readonly idLayer: string, protected readonly projectionId: string ) {
        super();
    }

    commitFunction( mapObject: MapObject ): Promise<CommitTransactionAnswer> {
        this.transactionStorage.clear();
        this.transactionStorage.addObject( mapObject );
        return this.commitTransactionFunction();
    }

    commitTransactionFunction(): Promise<CommitTransactionAnswer> {
        if ( this.transactionStorage.count > 0 ) {
            return this.transactionRequest( this.transactionStorage.iterator );
        } else {
            return Promise.resolve( EMPTY_RESULT );
        }
    }

    reloadFunction( mapObject: MapObject, params: { geometry: boolean; properties: boolean; } ): Promise<void> {
        this.transactionStorage.clear();
        this.transactionStorage.addObject( mapObject );
        return this.reloadTransactionFunction(params);
    }

    async requestGeometry(mapObject: MapObject) {
        const requestService = RequestServices.retrieveOrCreate(this.httpParams, ServiceType.REST);
        const response= await requestService.getFeatureMetric([{
            LAYER: this.idLayer,
            IDLIST: mapObject.gmlId,
            OUTTYPE: OUTTYPE.JSON,
            OUTCRS: mapObject.vectorLayer.map.getCrsString()
        }]);
        return response.data;
    }

    async reloadTransactionFunction( params: { geometry: boolean; properties: boolean; } ): Promise<void> {
        if ( this.transactionStorage.count > 0 ) {
            await this.getFeatureRequest( this.transactionStorage.iterator, params );
        }
    }

    protected async getFeatureRequest( mapObjects: Iterable<MapObject>, params: { geometry: boolean; properties: boolean; } ): Promise<void> {

        const requestService = RequestServices.retrieveOrCreate( this.httpParams, ServiceType.REST );

        const idList: string[] = [];
        let isGraphicObj:boolean = false;

        for ( const mapObject of mapObjects ) {
            idList.push( mapObject.gmlId );
            if (!mapObject.key) {
                isGraphicObj = true;
            }
        }

        const requestParams:GetFeatureParams[] = [{
            LAYER: this.idLayer,
            IDLIST: idList.join( ',' ),
            OUTTYPE: OUTTYPE.JSON,
            OUTCRS: this.projectionId,
            GETSLD: isGraphicObj? '1':'0',
        }];

        let response;
        if (params.geometry && !params.properties) {
            response = await requestService.getFeatureMetric<GeoJsonType>(requestParams);
        } else {
            response = await requestService.getFeature<GeoJsonType>(requestParams);
        }

        if ( response ) {
            const geoJSON = new GeoJSON( response.data );
            const featureCount = geoJSON.featureCollection.getFeatureCount();

            for ( let i = 0; i < featureCount; i++ ) {
                const feature = geoJSON.featureCollection.getFeature( i )?.toJSON();
                if ( feature && feature.properties.id && feature.properties.mapid ) {
                    const storageKey = ObjectStorage.generateStorageKey( {
                        gmlId: feature.properties.id,
                        serviceUrl: this.httpParams.url,
                        idLayer: feature.properties.mapid
                    } );
                    let mapObject = this.transactionStorage.getObject( storageKey );
                    if ( mapObject ) {

                        if ( params.geometry&&!params.properties ) {
                            mapObject.updateGeometryFromJSON( feature );
                        } else {
                            mapObject.fromJSON( feature );
                        }
                    }
                }
            }
        }
    }

    protected async transactionRequest( mapObjects: Iterable<MapObject> ): Promise<CommitTransactionAnswer> {

        let response = EMPTY_RESULT;

        const restService = RequestServices.retrieveOrCreate( this.httpParams, ServiceType.REST );

        const objectInsert: string[] = [];
        const objectDelete: string[] = [];
        const objectReplace: string[] = [];

        const transactionFeatures: TransactionFeature[] = [];

        for ( const mapObject of mapObjects ) {

            let transaction: TransactionType;
            if ( mapObject.removeFlag ) {
                transaction = 'delete';
                objectDelete.push( mapObject.gmlId );
            } else if ( mapObject.newFlag ) {
                transaction = 'insert';
            } else {
                transaction = 'replace';
                objectReplace.push( mapObject.gmlId );
            }

            const transactionFeature = mapObject.getTransactionJson( transaction );
            transactionFeatures.push( transactionFeature );
        }

        const transactionBody = {
            type: 'FeatureCollection',
            crs: { type: 'name', properties: { name: this.projectionId } },
            features: transactionFeatures
        };

        const result = await restService.transaction( { data: transactionBody }, { LAYER_ID: this.idLayer } );

        if ( result && result.data ) {

            const transactionNumber = result.data.restmethod.outparams.find( item => item.name === 'TransactionNumber' );
            if ( !transactionNumber || +transactionNumber.value === -1 ) {
                throw Error( JSON.stringify( { exceptionText: 'Transaction was rejected by service' } ) );
            }

            const idList = result.data.restmethod.outparams.find( item => item.name === 'IdList' );
            if ( idList ) {
                const insertedMapObjects: MapObject[] = [];
                for ( const mapObject of this.transactionStorage.iterator ) {
                    if ( mapObject.newFlag ) {
                        insertedMapObjects.push( mapObject );
                    }
                }

                const mapObjectIds = idList.value.split( ',' );
                if ( mapObjectIds.length === insertedMapObjects.length ) {
                    for ( let i = 0; i < mapObjectIds.length; i++ ) {
                        const mapObjectGmlId = mapObjectIds[ i ];
                        insertedMapObjects[ i ].gmlId = mapObjectGmlId;
                        objectInsert.push( mapObjectGmlId );
                    }
                }
            }

            response = {
                inserted: objectInsert,
                replaced: objectReplace,
                deleted: objectDelete,
                outparams: result.data.restmethod.outparams
            };
        } else if ( result && result.error ) {
            throw Error( JSON.stringify( { exceptionText: result.error } ) );
        } else {
            throw Error( JSON.stringify( { exceptionText: 'Transaction response error' } ) );
        }

        return response;
    }
}
