/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Источник векторных данных                      *
 *                                                                  *
 *******************************************************************/

import MapObject from '~/mapobject/MapObject';
import ObjectStorage from '~/mapobject/ObjectStorage';
import { TransactionResponse } from '~/services/RequestServices/RestService/Types';
import {GeoJsonType} from '~/utils/GeoJSON';


export type CommitTransactionAnswer = {
    outparams: TransactionResponse['restmethod']['outparams'];
    inserted: string[];
    replaced: string[];
    deleted: string[];
}

export const EMPTY_RESULT: CommitTransactionAnswer = Object.freeze( {
    inserted: [],
    replaced: [],
    deleted: [],
    outparams: [
        {
            name: 'TotalInserted',
            value: '0',
            type: 'string'
        },
        {
            name: 'TotalReplaced',
            value: '0',
            type: 'string'
        },
        {
            name: 'TotalUpdated',
            value: '0',
            type: 'string'
        },
        {
            name: 'TotalDeleted',
            value: '0',
            type: 'string'
        },
        {
            name: 'TransactionNumber',
            value: '-1',
            type: 'string'
        },
        {
            name: 'IdList',
            value: '',
            type: 'string'
        }
    ]
} );

/**
 * Источник векторных данных
 * @class AbstractVectorSource
 */
export default abstract class AbstractVectorSource {

    protected readonly transactionStorage = new ObjectStorage();

    protected isTransactionActive = false;

    /**
     * Деструктор
     * @method destroy
     */
    destroy() {
    }

    /**
     * Сохранить объект в источнике
     * @async
     * @method commit
     * @param mapObject {MapObject} Объект карты
     */
    commit( mapObject: MapObject ): Promise<CommitTransactionAnswer | undefined> {
        if ( this.isTransactionActive ) {
            this.transactionStorage.addObject( mapObject );
            return Promise.resolve( undefined );
        } else {
            return this.commitFunction( mapObject );
        }
    }

    /**
     * Обновить объект из источника
     * @async
     * @method commit
     * @param mapObject {MapObject} Объект карты
     */
    async reload( mapObject: MapObject, params: { geometry: boolean; properties: boolean; } ): Promise<boolean> {

        if ( this.isTransactionActive ) {
            this.transactionStorage.addObject( mapObject );
            return false;
        }

        await this.reloadFunction( mapObject, params );


        return true;
    }

    abstract requestGeometry(mapbject:MapObject): Promise<GeoJsonType|undefined>;

    startTransaction(): void {
        if ( this.isTransactionActive ) {
            throw Error( 'Layer already has an opened transaction' );
        }
        this.transactionStorage.clear();
        this.isTransactionActive = true;
    }

    async commitTransaction(): Promise<CommitTransactionAnswer> {
        if (this.isTransactionActive) {
            this.isTransactionActive = false;
            const result = await this.commitTransactionFunction();
            this.transactionStorage.clear();
            return result;
        } else {
            throw Error('Transaction is not active');
        }
    }

    async reloadTransaction(params: { geometry: boolean; properties: boolean; }): Promise<void> {
        let result;
        if (this.isTransactionActive) {
            this.isTransactionActive = false;
            result = await this.reloadTransactionFunction(params);
            this.transactionStorage.clear();
        }
        return result;
    }

    cancelTransaction(): void {
        this.isTransactionActive = false;
        this.transactionStorage.clear();
    }

    protected abstract commitTransactionFunction(): Promise<CommitTransactionAnswer>;

    protected abstract reloadTransactionFunction(params: { geometry: boolean; properties: boolean; }): Promise<void>;

    protected abstract reloadFunction( mapObject: MapObject, params: { geometry: boolean; properties: boolean; } ): Promise<void>;

    protected abstract commitFunction( mapObject: MapObject ): Promise<CommitTransactionAnswer>;

    get blob(): Blob | undefined {
        return undefined;
    }

}
