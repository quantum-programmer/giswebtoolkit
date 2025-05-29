/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Коллекция классификаторов                    *
 *                                                                  *
 *******************************************************************/


import Layer from '~/maplayers/Layer';
import Classifier from '~/classifier/Classifier';
import { SimpleJson } from '~/types/CommonTypes';


type ClassifierCollectionItem = {
    commonClassifiers: Classifier[];
    layerClassifiers:
        SimpleJson<Classifier>;
};

/**
 * Коллекция классификаторов карты
 * @class ClassifierCollection
 */
export default class ClassifierCollection {

    private readonly collectionList: SimpleJson<ClassifierCollectionItem> = {};

    /**
     * Создать классификатор по слою
     * @method createByLayer
     * @param layer {Layer} Слой с классификатором
     */
    createByLayer( layer: Layer ): Classifier {
        let classifier = this.getByLayer( layer );
        if ( !classifier ) {
            const collection = this.retrieveOrCreateCollection( layer.serviceUrl );
            classifier = new Classifier( layer );
            if ( classifier.isCommon ) {
                collection.commonClassifiers.push( classifier );
            } else {
                collection.layerClassifiers[ layer.xId ] = classifier;
            }
        }
        return classifier;
    }

    /**
     * Получить классификатор по слою
     * @method getByLayer
     * @param layer {Layer} Слой с классификатором
     * @return {Classifier | undefined} Классификатор
     */
    getByLayer( layer: Layer ): Classifier | undefined {

        const commonFlag = !!layer.options.schemename;

        let classifier;
        const collection = this.retrieveOrCreateCollection( layer.serviceUrl );
        if ( commonFlag ) {
            const classifierName = layer.options.schemename;
            if ( classifierName ) {
                classifier = collection.commonClassifiers.find( classifier => classifier.schemeName === classifierName );
            }
        } else {
            if ( collection.layerClassifiers[ layer.xId ] ) {
                classifier = collection.layerClassifiers[ layer.xId ];
            }
        }
        return classifier;
    }

    /**
     * Удалить классификатор по слою
     * @method remove
     * @param layer {Layer} Слой с классификатором
     */
    removeByLayer( layer: Layer ): void {

        const commonFlag = !!layer.options.schemename;

        const collection = this.retrieveOrCreateCollection( layer.serviceUrl );
        if ( commonFlag ) {
            const classifierName = layer.options.schemename;
            if ( !classifierName ) {
                return;
            }
            const classifierIndex = collection.commonClassifiers.findIndex( classifier => classifier.schemeName === classifierName );
            if ( classifierIndex !== -1 ) {
                collection.commonClassifiers.splice( classifierIndex, 1 );
            }
        } else {
            if ( collection.layerClassifiers[ layer.xId ] ) {
                delete collection.layerClassifiers[ layer.xId ];
            }
        }
    }

    /**
     * Деструктор
     * @method destroy
     */
    destroy(): void {
        for ( const url in this.collectionList ) {
            delete this.collectionList[ url ];
        }
    }

    /**
     * Получить или создать коллекцию классификаторов
     * @private
     * @method retrieveOrCreateCollection
     * @param url {string} Url-адрес сервиса
     * @return {ClassifierCollectionItem} Коллекция классификаторов
     */
    private retrieveOrCreateCollection( url: string ): ClassifierCollectionItem {
        let collection = this.collectionList[ url ];
        if ( !collection ) {
            collection = {
                commonClassifiers: [],
                layerClassifiers: {}
            };
            this.collectionList[ url ] = collection;
        }

        return collection;
    }
}
