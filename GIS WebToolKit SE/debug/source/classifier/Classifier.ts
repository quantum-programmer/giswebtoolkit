/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Классификатор карты                       *
 *                                                                  *
 *******************************************************************/


import Layer from '~/maplayers/Layer';
import { Legend } from '~/types/Types';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import { RscObject, RscSemantic } from '~/services/RequestServices/RestService/Types';
import { SimpleJson } from '~/types/CommonTypes';
import SemanticList, { ClassifierLayerSemantics } from '~/classifier/SemanticList';
import LegendClass from '~/classifier/Legend';
import { BYXSD_VALUE } from '~/services/RequestServices/common/enumerables';

export type ClassifierTypeSemanticValue = {
    name: string;
    text: string;
    value: string;
};

export type ClassifierTypeSemantic = {
    code: string;
    key: string;
    reference: ClassifierTypeSemanticValue[];
};

export type ClassifierJson = {
    legend?: Legend;
    semanticList?: ClassifierLayerSemantics[];
    classifierSemanticList: ClassifierTypeSemantic[];
    rscObjectList: SimpleJson<RscObject | null>;
};

/**
 * Класс классификатора карты
 * @class Classifier
 */
export default class Classifier {


    private classifierSemanticValuesRequestPromise?: Promise<ClassifierTypeSemantic[]>;
    private readonly rscObjectRequestPromiseList: SimpleJson<Promise<RscObject | null> | undefined> = {};


    private readonly legendInstance: LegendClass;
    private readonly semanticList: SemanticList;
    private classifierSemanticList?: ClassifierTypeSemantic[];                  // список значений семантик типа "классификатор"
    private rscObjectList: SimpleJson<RscObject | null> = {};          // список объектов классификатора
    private readonly layer!: Layer;

    /**
     * @constructor
     * @param layer{string} Слой с классификатором
     */
    constructor(layer: Layer) {
        //иначе WMS содержит карту и Vue ее обвязывает
        Reflect.defineProperty(this, 'layer', {
            enumerable: true,
            get: function() {
                return layer;
            }.bind(this)
        });


        if (!this.schemeName) {
            throw Error('Classifier name has not been defined');
        }
        this.semanticList = new SemanticList({ serviceUrl: this.serviceUrl, layerId: this.layerId }, this.layer.map);
        this.legendInstance = new LegendClass({
            serviceUrl: this.serviceUrl,
            layerId: this.layerId,
            filters: {
                BYXSD: BYXSD_VALUE.ByScheme,
                KEYLIST: layer.options.filter?.keylist
            }
        }, this.layer.map);
    }

    /**
     * Наименование схемы (имя файла .xsd)
     * @property {string} schemeName
     */
    get schemeName(): string {
        return this.layer.options.schemename || this.layer.xId;
    }

    /**
     * Флаг общего классификатора (схема из base/schemas)
     * @property {boolean} isCommon
     */
    get isCommon(): boolean {
        return !!this.layer.options.schemename;
    }

    private get layerId(): string {
        return this.layer.idLayer;
    }

    private get serviceUrl(): string {
        return this.layer.serviceUrl;
    }

    /**
     * Получить легенду классификатора
     * @method getLegend
     * @return {Promise<Legend>} Promise с легендой
     */
    getLegend(): Promise<Legend> {
        return this.legendInstance.getLegend();
    }


    /**
     * Получить список семантик слоя (всех слоев)
     * @method getLayerSemantics
     * @param layerId {string} Идентификатор слоя классификатора
     * @return {Promise<RscSemantic[]>} Promise со списком семантик
     */
    getLayerSemantics(layerId?: string): Promise<RscSemantic[] | undefined> {
        if (layerId === undefined) {
            return this.semanticList.getAllSemantics();
        } else {
            return this.semanticList.getLayerSemantics(layerId);
        }
    }

    /**
     * Получить список слоев с семантиками
     * @method getClassifierLayerSemanticsList
     * @return {Promise<RscSemantic[]>} Promise со списком слоев с семантиками
     */
    getClassifierLayerSemanticsList(): Promise<ClassifierLayerSemantics[]> {
        return this.semanticList.getClassifierLayerSemanticsList();
    }

    /**
     * Получить список семантик объекта классификатора
     * @async
     * @method getObjectSemantics
     * @param key {string} Ключ объекта классификатора
     * @return {Promise<RscSemantic[]>} Promise со списком семантик объекта классификатора
     */
    async getObjectSemantics(key: string): Promise<RscSemantic[]> {
        const rscObject = await this.getRscObject(key);
        if (rscObject) {
            return rscObject.rscsemantics;
        }
        return [];
    }

    /**
     * Получить описание объекта классификатора
     * @async
     * @method getObjectByKey
     * @param key {string} Ключ объекта классификатора
     * @return {Promise<RscObject | null>} Promise с объектом классификатора
     */
    async getObjectByKey(key: string): Promise<RscObject | null> {
        return await this.getRscObject(key);
    }

    /**
     * Получить список значений семантик типа "классификатор"
     * @deprecated
     * @method getClassifierSemantics
     * @return {Promise<ClassifierTypeSemantic[]>} Promise со списком значений семантик типа "классификатор"
     */
    getClassifierSemantics(): Promise<ClassifierTypeSemantic[]> {
        return this.getClassifierSemanticValues();
    }

    /**
     * Получить список значений семантик типа "классификатор" по ключу семантики
     * @async
     * @method getClassifierSemanticValuesByKey
     * @param key {string} Ключ семантики
     * @return {Promise<ClassifierTypeSemanticValue[]>} Promise со списком значений семантик типа "классификатор"
     */
    async getClassifierSemanticValuesByKey(key: string): Promise<ClassifierTypeSemanticValue[]> {
        const classifierSemanticValuesList = await this.getClassifierSemanticValues();
        if (classifierSemanticValuesList) {
            const classifierSemanticValues = classifierSemanticValuesList.find(classifierSemanticValues => classifierSemanticValues.key === key);
            if (classifierSemanticValues) {
                return classifierSemanticValues.reference;
            }
        }
        return [];
    }

    /**
     * Получить список значений семантик типа "классификатор" по коду семантики
     * @async
     * @method getClassifierSemanticValuesByCode
     * @param code {string} Код семантики
     * @return {Promise<ClassifierTypeSemanticValue[]>} Promise со списком значений семантик типа "классификатор"
     */
    async getClassifierSemanticValuesByCode(code: string): Promise<ClassifierTypeSemanticValue[]> {
        const classifierSemanticValuesList = await this.getClassifierSemanticValues();
        if (classifierSemanticValuesList) {
            const classifierSemanticValues = classifierSemanticValuesList.find(classifierSemanticValues => classifierSemanticValues.code === code);
            if (classifierSemanticValues) {
                return classifierSemanticValues.reference;
            }
        }
        return [];
    }


    /**
     * Получить список значений семантик типа "классификатор"
     * @private
     * @method getClassifierSemanticValues
     * @return {Promise<ClassifierTypeSemantic[]>} Promise со списком значений семантик типа "классификатор"
     */
    private getClassifierSemanticValues(): Promise<ClassifierTypeSemantic[]> {
        // в процессе получения
        if (this.classifierSemanticValuesRequestPromise) {
            return this.classifierSemanticValuesRequestPromise;
        }

        // еще не запрашивался никем
        if (this.classifierSemanticList === undefined) {
            return this.classifierSemanticValuesRequestPromise = this.requestClassifierSemanticValues();
        }

        //Результат запроса с сервиса
        return Promise.resolve(this.classifierSemanticList);

    }

    /**
     * Запросить список значений семантик типа "классификатор"
     * @private
     * @async
     * @method requestClassifierSemanticValues
     * @return {Promise<ClassifierTypeSemantic[]>} Promise со списком значений семантик типа "классификатор"
     */
    private async requestClassifierSemanticValues(): Promise<ClassifierTypeSemantic[]> {
        if (this.serviceUrl) {
            const httpParams = RequestServices.createHttpParams(this.layer.map, { url: this.serviceUrl });
            const restService = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);

            try {
                const semanticWithListResponse = await restService.getSemanticWithList({
                    LAYER: this.layerId
                });
                this.classifierSemanticValuesRequestPromise = undefined;
                this.classifierSemanticList = [];
                if (semanticWithListResponse.data && parseInt(semanticWithListResponse.data.restcode) === 1) {
                    this.classifierSemanticList = semanticWithListResponse.data.classifiersematiclist;
                }

                return this.classifierSemanticList;

            } catch (reason) {
                return this.classifierSemanticList = [];
            }
        } else {
            return this.classifierSemanticList = [];
        }
    }


    /**
     * Получить описание объекта классификатора
     * @private
     * @method getRscObject
     * @param key {string} Ключ объекта классификатора
     * @return {Promise<RscObject | null>} Promise с объектом классификатора
     */
    private getRscObject(key: string): Promise<RscObject | null> {
        // в процессе получения
        const rscObjectRequestPromise = this.rscObjectRequestPromiseList[key];
        if (rscObjectRequestPromise) {
            return rscObjectRequestPromise;
        }

        // еще не запрашивался никем
        if (this.rscObjectList[key] === undefined) {
            return this.rscObjectRequestPromiseList[key] = this.requestRscObject(key);
        }

        //Результат запроса с сервиса
        return Promise.resolve(this.rscObjectList[key]);
    }

    /**
     * Запросить описание объекта классификатора
     * @private
     * @async
     * @method requestRscObject
     * @param key {string} Ключ объекта классификатора
     * @return {Promise<RscObject | null>} Promise с объектом классификатора
     */
    private async requestRscObject(key: string): Promise<RscObject | null> {
        if (this.serviceUrl) {
            const httpParams = RequestServices.createHttpParams(this.layer.map, { url: this.serviceUrl });
            const restService = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);

            try {
                const semByObjKeyResponse = await restService.getSemByObjKey({
                    LAYER: this.layerId,
                    OBJECTKEY: key
                });
                delete this.rscObjectRequestPromiseList[key];

                if (semByObjKeyResponse.data && parseInt(semByObjKeyResponse.data.restcode) === 1) {
                    this.rscObjectList[key] = semByObjKeyResponse.data.rscobject;
                } else {
                    this.rscObjectList[key] = null;
                }

                return this.rscObjectList[key];
            } catch (reason) {
                return this.rscObjectList[key] = null;
            }
        }
        return this.rscObjectList[key] = null;
    }

    cancelRequests() {
        this.legendInstance.cancelRequest();
        this.semanticList.cancelRequest();
    }

    fromJson(json: ClassifierJson) {
        this.legendInstance.fromJson(json);
        this.semanticList.fromJson(json);
        this.classifierSemanticList = json.classifierSemanticList || [];
        this.rscObjectList = json.rscObjectList || {};
    }
}

