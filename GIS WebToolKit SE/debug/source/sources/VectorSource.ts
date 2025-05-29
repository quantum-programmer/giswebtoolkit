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
import AbstractVectorSource, {CommitTransactionAnswer} from '~/sources/AbstractVectorSource';
import GeoJSON, {GeoJsonType} from '~/utils/GeoJSON';


/**
 * Источник векторных данных
 * @class VectorSource
 */
export default class VectorSource extends AbstractVectorSource {

    protected readonly objectStorage = new ObjectStorage();

    constructor() {
        super();
    }

    /**
     * Деструктор
     * @method destroy
     */
    destroy() {
        this.objectStorage.clear();
    }

    private get maxObjectNumber(): number {
        let result = 0;
        for (const mapObject of this.objectStorage.iterator) {
            result = Math.max(result, mapObject.objectNumber);
        }
        return result;
    }

    protected async commitTransactionFunction() {
        const result: CommitTransactionAnswer = {
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
        };

        let inserted = 0;
        let replaced = 0;
        let deleted = 0;

        for (const mapObject of this.transactionStorage.iterator) {
            if (mapObject.removeFlag) {
                result.deleted.push(mapObject.gmlId);
                deleted++;
                this.objectStorage.removeObject(mapObject.storageKey);
            } else if (mapObject.newFlag) {
                this.objectStorage.addObject(mapObject);
                inserted++;
            } else {
                this.objectStorage.replaceObject(mapObject);
                replaced++;
            }
        }

        result.outparams[0].value = inserted + '';
        result.outparams[1].value = replaced + '';
        result.outparams[2].value = deleted + '';
        result.outparams[3].value = '0';

        return result;
    }

    async reload(mapObject: MapObject, params: { geometry: boolean; properties: boolean; }): Promise<boolean> {
        return Promise.resolve(true);
    }

    protected async reloadTransactionFunction(params: { geometry: boolean; properties: boolean; }): Promise<void> {
        for (const mapObject of this.transactionStorage.iterator) {
            const originObject = this.objectStorage.getObject(mapObject.storageKey);
            if (originObject) {
                mapObject.updateFrom(originObject);
            }
        }
    }

    protected async reloadFunction(mapObject: MapObject): Promise<void> {
        const originObject = this.objectStorage.getObject(mapObject.storageKey);
        if (originObject) {
            mapObject.updateFrom(originObject);
        }
    }

    protected async commitFunction(mapObject: MapObject) {
        const result: CommitTransactionAnswer = {
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
        };

        let inserted = 0;
        let replaced = 0;
        let deleted = 0;

        if (mapObject.removeFlag) {
            this.objectStorage.removeObject(mapObject.storageKey);
            result.deleted.push(mapObject.gmlId);
            deleted++;
        } else if (mapObject.newFlag) {
            mapObject.objectNumber = this.maxObjectNumber + 1;
            result.inserted.push(mapObject.gmlId);
            inserted++;
            this.objectStorage.addObject(mapObject);
        } else {
            this.objectStorage.replaceObject(mapObject);
            result.replaced.push(mapObject.gmlId);
            replaced++;
        }

        result.outparams[0].value = inserted + '';
        result.outparams[1].value = replaced + '';
        result.outparams[2].value = deleted + '';
        result.outparams[3].value = '0';

        return result;
    }

    /**
     * Массив объектов карты
     * @readonly
     * @property {MapObject[]} mapObjectList
     */
    get mapObjectsIterator(): IterableIterator<MapObject> {
        return this.objectStorage.iterator;
    }

    /**
     * Скачать слой в формате GeoJSON
     * @method download
     */
    get blob() {
        const geoJson = new GeoJSON();
        if (this.objectStorage.count > 0) {
            const mapObject = this.objectStorage.iterator.next().value as MapObject;
            geoJson.getOrigin().crs = {type: 'name', properties: {name: mapObject.vectorLayer.projectionId}};
        }
        for (const mapObject of this.objectStorage.iterator) {
            geoJson.addFeature(mapObject.toJSON(true));
        }

        const json = geoJson.toString();
        return new Blob([json], {type: 'application/octet-stream'});
    }


    /**
     * Количество объектов карты
     * @property {number} mapObjectList
     */
    get mapObjectsCount(): number {
        return this.objectStorage.count;
    }

    /**
     * Удаление всех объектов
     * @method removeAllMapObjects
     */
    removeAllMapObjects() {
        this.objectStorage.clear();
    }

    /**
     * Массив объектов карты
     * @deprecated
     * @property {MapObject[]} mapObjectList
     */
    get mapObjectList(): Readonly<MapObject[]> {
        return Object.freeze(this.objectStorage.array);
    }

    requestGeometry(mapbject: MapObject): Promise<GeoJsonType | undefined> {
        return Promise.resolve(undefined);
    }
}
