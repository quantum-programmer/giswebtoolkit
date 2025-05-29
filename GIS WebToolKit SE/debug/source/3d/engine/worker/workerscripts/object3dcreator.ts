/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Создание объектов 3d карты                    *
 *                                                                  *
 *******************************************************************/
import Parser3d, {
    OBJECT3D,
    HeadWEB3D,
    TEXTURE,
    PAINT_FLAG,
    ELEMENT3DTYPE, TEXTUREMEASURE, FUNCTION3D_TYPE, VECTOR_ORIENTATION3D, VISIBLE_PART, SURFACE_TYPE, LOCALE
} from '~/3d/engine/worker/workerscripts/parse3dobject';
import { MessageData } from '~/3d/engine/worker/queues/basequeue';
import { MessageParams } from '~/3d/engine/worker/queues/messagequeue';
import { SimpleJson } from '~/types/CommonTypes';
import DoubleLinkedList from '~/3d/engine/utils/doublelinkedlist';
import Object3dTemplate, { FeatureMesh, TemplateOptions, VIEWTYPE } from '~/3d/engine/worker/workerscripts/object3dtemplate';
import { AnyQueueObject, MessageState, QueueObject } from '~/3d/engine/worker/workerscripts/queue';
import { Feature } from '~/utils/GeoJSON';
import ColorMethods from '~/3d/engine/utils/colormethods';
import HeightTile from '~/3d/engine/scene/terrain/heightsource/heighttile';
import Utils from '~/services/Utils';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import {
    Get3dObjectsByClassifierParams,
    Get3dObjectsParams,
    GetLayerSemanticListResponse
} from '~/services/RequestServices/RestService/Types';
import { Vector4D } from '~/3d/engine/core/Types';

type SemanticList = { [ key: string ]: string; };

export interface Objects3dDescription {
    code: string | number,
    local: string | number,
    objectkey: string,
    semlist: string[],
    viewtype: string | number,
    cut: 0 | 1,
    color?: string,
    opacity?: string | number,
    colorValue?: Vector4D,
    height?: {
        heightDef: string | number,
        keySem: string,
        heightSem?: string | number,
        heightConstSem?: string | number
    }
}

export type Object3dCreatorSetupParams = { serviceUrl: string; jsRpc: Get3dObjectsParams; descList: Objects3dDescription[] };
export type Object3dCreatorSetupByClassifierParams = { serviceUrl: string; jsRpc: Get3dObjectsByClassifierParams; descList: Objects3dDescription[] };

/**
 * Класс создателя 3d объектов
 * @static
 * @class Object3dCreator
 */
export default class Object3dCreator {

    static readonly defaultLayerId: string = 'default_' + Math.random();
    private static descList: SimpleJson<Objects3dDescription[]> = {};
    static semanticDictionary: SimpleJson<SemanticList | undefined> = {};
    private static textureRequests: SimpleJson<true> = {};
    private static objectSamples: SimpleJson<Object3dTemplate[]> = {};
    static textureArrays: SimpleJson<TEXTURE[]> = {};
    static textureBufferArrays: SimpleJson<ArrayBufferLike[]> = {};
    static isIE: number;

    /**
     * Инициализация компонента
     * @static
     * @method init
     */
    static init() {
        Object3dCreator.isIE = Utils.isIE( self );
        Object3dCreator.createObjectTemplates( defaultTemplates3d, Object3dCreator.defaultLayerId );
    }

    /**
     * Начальная настройка компонента
     * @static
     * @method setup
     * @param message {object} Сообщение
     * @param mQueue {DoubleLinkedList} Очередь сообщений потока
     */
    static setup( message: MessageData<MessageParams & Object3dCreatorSetupParams>, mQueue: DoubleLinkedList<AnyQueueObject> ) {
        const jsObj3D = message.messageParams.jsRpc;
        const url = message.messageParams.serviceUrl;
        if ( this.descList[ url + jsObj3D.LAYER ] === undefined ) {
            for ( let i = 0; i < message.messageParams.descList.length; i++ ) {
                const desc = message.messageParams.descList[ i ];
                if ( desc.color !== undefined ) {
                    const opacity = desc.opacity ? +desc.opacity : 1;
                    desc.colorValue = ColorMethods.RGBA( desc.color, opacity );
                }
            }
            this.descList[ url + jsObj3D.LAYER ] = message.messageParams.descList;
        }

        if ( !this.semanticDictionary[ url + jsObj3D.LAYER ] ) {
            // this.semanticDictionary[ url + jsObj3D.LAYER ] = null;

            const layerId = jsObj3D.LAYER;

            const messageData = {
                id: message.id,
                messageParams: {
                    command: message.messageParams.command,
                    layerId: layerId,
                    serviceUrl: url,
                    mQueue
                },
                priority: message.priority,
                _t: message._t,
                _deathTime: message._deathTime
            };

            const handler = ( data?: GetLayerSemanticListResponse ) => {
                Object3dCreator.semanticDictionary[ url + layerId ] = Object3dCreator.createSemList( data );

                const loader = new TemplateLoader( messageData as MessageData<MessageParams & TemplateLoaderData> );

                if ( jsObj3D.KEYLIST.length > 0 ) {
                    const httpParams = { url };
                    const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );

                    service.get3dObjects( jsObj3D ).then( ( res ) => {
                        Object3dCreator.deleteNode( mQueue, messageData );
                        mQueue.push( loader );
                        loader.runReceive( res.data ).then();
                    } );

                } else {
                    Object3dCreator.deleteNode( mQueue, messageData );
                    mQueue.push( loader );
                    loader.runReceive().then();
                }

            };

            const httpParams = { url };
            const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );

            service.getLayerSemanticList( jsObj3D ).then( ( res ) => {
                handler( res.data || undefined );
            } );

            const loader = new TemplateBase( messageData as MessageData<MessageParams & TemplateLoaderData> );
            mQueue.push( loader );
        }
    }

    /**
     * Начальная настройка компонента
     * @static
     * @method setup3dByClassifier
     * @param message {object} Сообщение
     * @param mQueue {DoubleLinkedList} Очередь сообщений потока
     * @result {array} Матрица трансформирования
     */
    static setup3dByClassifier( message: MessageData<MessageParams & Object3dCreatorSetupByClassifierParams>, mQueue: DoubleLinkedList<AnyQueueObject> ) {
        const jsObj3D = message.messageParams.jsRpc;
        const url = message.messageParams.serviceUrl;

        if ( !this.semanticDictionary[ url + jsObj3D.CLASSIFIERNAME ] ) {
            const handler = (function ( jsObj3D, url ) {
                const layerId = jsObj3D.CLASSIFIERNAME;
                return function ( data?: GetLayerSemanticListResponse ) {
                    Object3dCreator.semanticDictionary[ url + layerId ] = Object3dCreator.createSemList( data );

                    const messageData = {
                        id: message.id,
                        messageParams: {
                            command: message.messageParams.command,
                            layerId: jsObj3D.CLASSIFIERNAME,
                            serviceUrl: url,
                            mQueue
                        },
                        priority: message.priority,
                        _t: message._t,
                        _deathTime: message._deathTime
                    };

                    const loader = new TemplateLoaderByClassifier( messageData as MessageData<MessageParams & TemplateLoaderData> );

                    if ( jsObj3D.KEYLIST.length > 0 ) {
                        const httpParams = { url };
                        const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );

                        service.get3dObjectsByClassifier( jsObj3D ).then( ( res ) => {
                            loader.runReceive( res.data );
                        } );
                    } else {
                        loader.runReceive();
                    }
                };
            })( jsObj3D, url );

            const httpParams = { url };
            const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );

            service.getLayerSemanticList( { LAYER: jsObj3D.CLASSIFIERNAME } ).then( ( res ) => {
                handler( res.data || undefined );
            } ).catch( () => {
                handler();
            } );
        }
    }

    /**
     * Загрузка текстур шаблонов
     * @static
     * @method loadTextures
     * @param message {MessageData} Сообщение
     * @param mQueue {DoubleLinkedList} Очередь сообщений потока
     */
    static loadTextures( message: MessageData<MessageParams & Object3dCreatorSetupParams>, mQueue: DoubleLinkedList<AnyQueueObject> ) {
        const jsObj3D = message.messageParams.jsRpc;
        const url = message.messageParams.serviceUrl;

        if ( this.textureRequests[ url + jsObj3D.LAYER ] === undefined ) {
            const messageData = {
                id: message.id,
                messageParams: {
                    command: message.messageParams.command,
                    layerId: jsObj3D.LAYER,
                    serviceUrl: url,
                    mQueue
                },
                priority: message.priority,
                _t: message._t,
                _deathTime: message._deathTime
            };

            const loader = new TextureLoader( messageData as MessageData<MessageParams & TemplateLoaderData> );


            if ( jsObj3D.KEYLIST.length > 0 ) {

                const httpParams = { url };
                const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );

                service.get3dObjects( jsObj3D ).then( ( res ) => {
                    loader.runReceive( res.data ).then();
                } );

            }
            this.textureRequests[ url + jsObj3D.LAYER ] = true;
            mQueue.push( loader );
        }

    }

    /**
     * Создание таблицы соответствий кода семетики и ключа
     * @private
     * @static
     * @method createSemList
     * @param [data] {GetLayerSemanticListResponse} JSON объект
     * @return { SemanticList| undefined} Таблица соответствий кода семетики и ключа
     */
    private static createSemList( data?: GetLayerSemanticListResponse ) {
        if ( !data ) {
            return;
        }
        const json = data, features = json.features, answer: SemanticList = {};
        for ( let j = 0; j < features.length; j++ ) {
            const rscSemantics = features[ j ].rscsemantic;
            for ( let i = 0; i < rscSemantics.length; i++ ) {
                const rscSemantic = rscSemantics[ i ];
                const code = rscSemantic.code;
                if ( !answer[ code ] ) {
                    answer[ code ] = rscSemantic.shortname;
                }
            }
        }
        return answer;
    }

    /**
     * Добавление шаблонов
     * @static
     * @method addTemplates
     * @param arrayBuffer {ArrayBuffer} Поток данных
     * @param layerId {string} Идентификатор слоя
     * @param serviceUrl {string} Url- адрес сервиса
     * @return {boolean} Результат
     */
    static addTemplates( arrayBuffer: ArrayBuffer, layerId: string, serviceUrl: string ) {
        let result = false;
        // Добавляем объект класса обработки трёхмерных объектов
        const json = Parser3d.readObject3D( arrayBuffer, this.semanticDictionary[ serviceUrl + layerId ] );
        if ( json !== null ) {
            // Обработа загрузки кодов объектов
            this.createObjectTemplates( json, serviceUrl + layerId );
            result = true;
        }
        return result;
    }

    /** Функция создания меша объекта карты
     * @static
     * @method createMesh
     * @param feature {Feature} Объект карты в формате GeoJSON
     * @param options {TemplateOptions} Настройки администратора
     * @param heightTile {HeightTile} Тайл высот
     * @param [layerId] {string} Идентификатор слоя
     * @param [untiled] {boolean} Признак объекта вне тайлов
     * @result {Object3dMeshCollection|undefined} Массив мешей объекта карты
     */
    static createMesh( feature: Feature, options: TemplateOptions, heightTile: HeightTile, layerId: string = Object3dCreator.defaultLayerId, untiled?: boolean ) { // TODO: untiled
        let code = +feature.properties.code!;
        let key = feature.properties.key + '';
        let viewtype = +options.viewtype;

        switch ( viewtype ) {
            case VIEWTYPE.LineString:
                code = -102;
                key = 'Line';
                layerId = Object3dCreator.defaultLayerId;
                break;
            case VIEWTYPE.Polygon:
                code = -101;
                key = 'Polygon';
                layerId = Object3dCreator.defaultLayerId;
                break;
            case VIEWTYPE.Point:
                code = -103;
                key = 'Point';
                layerId = Object3dCreator.defaultLayerId;
                break;
            case VIEWTYPE.Title:
                code = -104;
                key = 'Text';
                layerId = Object3dCreator.defaultLayerId;
                break;
        }

        feature.properties.viewtype = viewtype;
        feature.properties.localization = options.local;

        const template = this.getTemplate( layerId, code, key );
        if ( template ) {
            return new Object3dMeshCollection( template.createMeshList( feature, heightTile, options, untiled ) ); // TODO: untiled
        }
    }

    /** Получить шаблон
     * @private
     * @static
     * @method getTemplate
     * @param combinedLayerId {string} Комбинированный идентификатор слоя
     * @param code {number} Код шаблона
     * @param key {string} Ключ шаблона
     * @result {Object3dTemplate|undefined} Шаблон
     */
    private static getTemplate( combinedLayerId: string, code: number, key: string ) {
        let template;
        const templateList = this.objectSamples[ combinedLayerId ];
        if ( templateList !== undefined ) {
            for ( let i = 0; i < templateList.length; i++ ) {
                const curTemplate = templateList[ i ];
                if ( curTemplate.code === code && curTemplate.key === key ) {
                    template = curTemplate;
                    break;
                }

            }
        }
        return template;
    }

    /**
     * Создание шаблонов 3D объектов
     * @private
     * @static
     * @method createObjectTemplates
     * @private
     * @param json {object} Описание из классификатора в формате JSON
     * @param combinedLayerId {string} Адрес сервиса + идентификатор слоя
     */
    private static createObjectTemplates( json: { HeadWEB3D: HeadWEB3D, ObjectArray: OBJECT3D[], TextureArray: TEXTURE[] }, combinedLayerId: string ) {
        const textureArray = json.TextureArray;
        const objectArray = json.ObjectArray;
        for ( let i = 0; i < objectArray.length; i++ ) {
            const currentObject = objectArray[ i ];
            if ( !Array.isArray( this.objectSamples[ combinedLayerId ] ) ) {
                this.objectSamples[ combinedLayerId ] = [];
            }
            const code = currentObject.Code;
            const key = currentObject.Key;
            let template = this.getTemplate( combinedLayerId, code, key );
            if ( !template ) {
                template = new Object3dTemplate( combinedLayerId, code, key );
                this.objectSamples[ combinedLayerId ].push( template );
            }
            template.addTemplate( currentObject.Level, currentObject.F3DTREE, currentObject.Distance );
        }

        if ( !Array.isArray( this.textureArrays[ combinedLayerId ] ) ) {
            this.textureArrays[ combinedLayerId ] = [];
        }

        if ( json.HeadWEB3D.Version === 0 && !Array.isArray( this.textureBufferArrays[ combinedLayerId ] ) ) {
            this.textureBufferArrays[ combinedLayerId ] = [];
        }

        for ( let i = 0; i < textureArray.length; i++ ) {
            const textureParams = textureArray[ i ];

            if ( json.HeadWEB3D.Version === 0 && textureParams.Texture ) {
                const uint8Array = textureParams.Texture.Image;

                if ( this.isIE === -1 ) {
                    textureParams.Texture.Image = (uint8Array as Uint8Array).buffer;
                    this.textureBufferArrays[ combinedLayerId ].push( textureParams.Texture.Image );
                } else {
                    textureParams.Texture.Image = Array.prototype.slice.call( uint8Array ) as unknown as Uint8Array;
                }
            }
            textureParams.Code = combinedLayerId + '_' + textureParams.Key + '_' + textureParams.Level;
            this.textureArrays[ combinedLayerId ].push( textureParams );
        }
    }

    /** Получить описание
     * @static
     * @method getDescription
     * @param layerId {string} Идентификатор слоя
     * @param code {number} Код шаблона
     * @param key {string} Ключ шаблона
     * @param flagCut {number} Параметр нарезки по тайлам
     * @result { Objects3dDescription|undefined} Описание
     */
    static getDescription( layerId: string, code: number, key: string, flagCut: 0 | 1 ) {
        let desc;
        const descList = this.descList[ layerId ];
        if ( descList !== undefined ) {
            for ( let i = 0; i < descList.length; i++ ) {
                const curDesc = descList[ i ];
                if ( +curDesc.code === code && curDesc.objectkey === key && curDesc.cut === flagCut ) {
                    desc = curDesc;
                    break;
                }
            }
        }
        return desc;
    }

    /** Очистить компонент
     * @static
     * @method clear
     */
    static clear() {
        this.descList = {};
        this.semanticDictionary = {};
        this.textureRequests = {};
        for ( const id in this.objectSamples ) {
            if ( id !== this.defaultLayerId ) {
                delete this.objectSamples[ id ];
            }
        }
        for ( const id in this.textureArrays ) {
            if ( id !== this.defaultLayerId ) {
                delete this.textureArrays[ id ];
                delete this.textureBufferArrays[ id ];
            }
        }
    }

    static deleteNode( mQueue: DoubleLinkedList<AnyQueueObject>, messageData: MessageData<any> ) {
        let curNode = mQueue.getHead();
        while ( curNode ) {
            const messageObject = curNode.getData();
            if ( messageObject.id === messageData.id ) {
                mQueue.deleteNode( curNode );
                break;
            }
            curNode = curNode.getNext();
        }
    }
}

/**
 * Класс коллекции мешей по уровням
 * @class Object3dMeshCollection
 * @param meshListArray {array} Описание мешей по удаленности
 */
class Object3dMeshCollection {
    meshList: { [ key: number ]: FeatureMesh[] } = {};
    minDistanceList: number[] = [];

    constructor( meshListArray: { meshList: FeatureMesh[]; minDistance: number; }[] ) {
        for ( let i = 0; i < meshListArray.length; i++ ) {
            const meshListObject = meshListArray[ i ];
            this.meshList[ meshListObject.minDistance ] = meshListObject.meshList;
            this.minDistanceList.push( meshListObject.minDistance );
        }
        this.minDistanceList.sort();
    }
}

setTimeout( Object3dCreator.init, 3 );


type TemplateLoaderData = {
    layerId: string;
    serviceUrl: string;
    mQueue?: DoubleLinkedList<AnyQueueObject>
};
type TemplateLoaderResponseData = {
    success: boolean;
    errorText?: string;
    textureArray: TEXTURE[];
};

/**
 * Базовый класс загрузки шаблонов
 * @class TemplateBase
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
class TemplateBase extends QueueObject<TemplateLoaderData, TemplateLoaderResponseData> {

    /**
     * Запустить обработку ответа
     * @async
     * @method runReceive
     * @param [arrayBuffer] {ArrayBuffer} Ответ
     */
    async runReceive( arrayBuffer?: ArrayBuffer ) {
        const layerId = this.params.layerId;
        const serviceUrl = this.params.serviceUrl;

        let success = false;
        let errorText = 'Template request error';

        this.responseData = {
            command: this.command,
            id: this.id,
            params: {
                layerId,
                serviceUrl,
                command: this.command
            },
            data: {
                success,
                errorText,
                textureArray: []
            }
        };
        this.responseBufferList = [];
        this.state = MessageState.received;
    }

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
    }
}

/**
 * Класс загрузки изображений
 * @class TemplateLoader
 * @extends TemplateBase
 * @param messageData {MessageData} Сообщение потока
 */
class TemplateLoader extends TemplateBase {

    /**
     * Запустить обработку ответа
     * @async
     * @method runReceive
     * @param [arrayBuffer] {ArrayBuffer} Ответ
     */
    async runReceive( arrayBuffer?: ArrayBuffer ) {
        const layerId = this.params.layerId;
        const serviceUrl = this.params.serviceUrl;

        let success = true;
        let errorText: string | undefined = undefined;
        if ( arrayBuffer ) {
            success = Object3dCreator.addTemplates( arrayBuffer, layerId, serviceUrl );
            if ( !success ) {
                errorText = await Utils.readBlobAsText( new Blob( [new Uint8Array( arrayBuffer )] ) );// TODO: проверить ошибку
            }
        }

        this.responseData = {
            command: this.command,
            id: this.id,
            params: {
                layerId,
                serviceUrl,
                command: this.command
            },
            data: {
                success,
                errorText,
                textureArray: Object3dCreator.textureArrays[ serviceUrl + layerId ] || []
            }
        };
        this.responseBufferList = Object3dCreator.textureBufferArrays[ serviceUrl + layerId ] || [];
        this.state = MessageState.received;
    }

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
    }
}

/**
 * Класс загрузки изображений
 * @class TemplateLoaderByClassifier
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
class TemplateLoaderByClassifier extends TemplateBase {

    /**
     * Запустить обработку ответа
     * @method runReceive
     * @param [arrayBuffer] {ArrayBuffer} Ответ
     */
    async runReceive( arrayBuffer?: ArrayBuffer ) {

        const layerId = this.params.layerId;
        const serviceUrl = this.params.serviceUrl;
        const mQueue = this.params.mQueue!;

        const success = true;
        if ( arrayBuffer ) {
            Object3dCreator.addTemplates( arrayBuffer, layerId, serviceUrl );
        }

        this.responseData = {
            command: this.command,
            id: this.id,
            params: {
                layerId,
                serviceUrl,
                command: this.command
            },
            data: {
                success,
                textureArray: Object3dCreator.textureArrays[ serviceUrl + layerId ] || []
            }
        };
        this.responseBufferList = Object3dCreator.textureBufferArrays[ serviceUrl + layerId ] || [];
        this.state = MessageState.received;
        Object3dCreator.semanticDictionary[ serviceUrl + layerId ] = undefined;
        mQueue.push( this );
    }

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
    }
}

/**
 * Класс загрузки изображений
 * @class TextureLoader
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
class TextureLoader extends TemplateBase {
    /**
     * Запустить обработку ответа
     * @async
     * @method runReceive
     * @param [arrayBuffer] {ArrayBuffer} Ответ
     */
    async runReceive( arrayBuffer?: ArrayBuffer ) {

        const layerId = this.params.layerId;
        const serviceUrl = this.params.serviceUrl;

        const combinedLayerId = serviceUrl + layerId;
        if ( !Array.isArray( Object3dCreator.textureArrays[ combinedLayerId ] ) ) {
            Object3dCreator.textureArrays[ combinedLayerId ] = [];
        } else {
            Object3dCreator.textureArrays[ combinedLayerId ].length = 0;
        }
        let success = false;
        let errorText: string | undefined = undefined;
        if ( arrayBuffer ) {
            const json = Parser3d.readObject3D( arrayBuffer );
            if ( json !== null ) {
                // Обработа загрузки кодов объектов
                const textureArray = json.TextureArray;

                if ( !Array.isArray( Object3dCreator.textureBufferArrays[ combinedLayerId ] ) ) {
                    Object3dCreator.textureBufferArrays[ combinedLayerId ] = [];
                }

                for ( let i = 0; i < textureArray.length; i++ ) {
                    const textureParams = textureArray[ i ];
                    if ( textureParams.Texture ) {
                        const uint8Array = textureParams.Texture.Image;

                        if ( Object3dCreator.isIE === -1 ) {
                            textureParams.Texture.Image = (uint8Array as Uint8Array).buffer;
                            Object3dCreator.textureBufferArrays[ combinedLayerId ].push( textureParams.Texture.Image );
                        } else {
                            textureParams.Texture.Image = Array.prototype.slice.call( uint8Array ) as unknown as Uint8Array;
                        }
                    }

                    // textureParams.Key = combinedLayerId + "_" + textureParams.Key+"_"+textureParams.Level;
                    Object3dCreator.textureArrays[ combinedLayerId ].push( textureParams );
                }
                success = true;
            } else {
                errorText = await Utils.readBlobAsText( new Blob( [new Uint8Array( arrayBuffer )] ) );// TODO: проверить ошибку
            }
        }

        this.responseData = {
            command: this.command,
            id: this.id,
            params: {
                layerId,
                serviceUrl,
                command: this.command
            },
            data: {
                success,
                errorText,
                textureArray: Object3dCreator.textureArrays[ combinedLayerId ]
            }
        };
        this.responseBufferList = Object3dCreator.textureBufferArrays[ combinedLayerId ] || [];
        this.state = MessageState.received;
        Object3dCreator.semanticDictionary[ combinedLayerId ] = undefined;
    }

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
    }
}


const defaultTemplates3d: { HeadWEB3D: HeadWEB3D, ObjectArray: OBJECT3D[], TextureArray: TEXTURE[] } = {
    HeadWEB3D: {
        Ident: 0x3D,
        TreeCount: 0,
        TextureCount: 0,
        Version: 0,
        Tree: 0,
        Texture: 0
    },
    ObjectArray: [
        {
            'Key': 'GeoPlacemark',
            'Level': 0,
            'Distance': 0,
            'Code': -1,
            'Local': LOCALE.Point,
            'LayerId': Object3dCreator.defaultLayerId,
            'ClassifierName': 'GeoPlacemark',
            'F3DTREE': {
                'Ident': 1943892957,
                'MaxIdent': 1,
                'Count': 1,
                'FUNCTIONLIST': [
                    {
                        'Number': FUNCTION3D_TYPE.F3D_MARK,
                        'Ident': 1,
                        'FUNCTIONPARAMS': {
                            'Mark': {
                                'FUNCTIONPARAMS': {
                                    'Height': {
                                        'Type': 0,
                                        'Value': 0,
                                        'Factor': 1,
                                        'Offset': 0
                                    },
                                    'RelativeHeight': {
                                        'Type': 0,
                                        'Value': 0,
                                        'Factor': 1,
                                        'Offset': 0
                                    },
                                    'SizeX': {
                                        'Type': 0,
                                        'Value': 40,
                                        'Factor': 1,
                                        'Offset': 0
                                    },
                                    'SizeZ': {
                                        'Type': 0,
                                        'Value': 40,
                                        'Factor': 1,
                                        'Offset': 0
                                    },
                                    'Scale': [
                                        0,
                                        0,
                                        0
                                    ],
                                    'Vector': VECTOR_ORIENTATION3D.VM_ANYTURN | VECTOR_ORIENTATION3D.VM_ANYPOS | VECTOR_ORIENTATION3D.VM_VERTICAL,
                                    'FlagVRML': 0,
                                    'TransformFlag': 0,
                                    'SizeScaleFactor': 0,
                                    'Point': [
                                        {
                                            'X': 0,
                                            'Y': 0,
                                            'Z': 0
                                        },
                                        {
                                            'X': -20,
                                            'Y': 0,
                                            'Z': -20
                                        }
                                    ],
                                    'MarkIncode': 0,
                                    'Count': 2,
                                    'NODELIST': [
                                        {
                                            'TransformFlag': 0,
                                            'Size': [
                                                {
                                                    'Type': 0,
                                                    'Value': 6,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                },
                                                {
                                                    'Type': 0,
                                                    'Value': 100,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                },
                                                {
                                                    'Type': 0,
                                                    'Value': 6,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'Count': 1,
                                            'DESCRIPTIONLIST': [{
                                                'ColorFlag': 1,
                                                'MaterialFlag': 0,
                                                'TextureFlag': 0,
                                                'SemColorFlag': 0,
                                                'Color': {
                                                    'R': 0.501960813999176,
                                                    'G': 0.501960813999176,
                                                    'B': 0.501960813999176,
                                                    'A': 1
                                                },
                                                'Material': {
                                                    'AmbientColor': {
                                                        'R': 0,
                                                        'G': 0,
                                                        'B': 0,
                                                        'A': 1
                                                    },
                                                    'DiffuseColor': {
                                                        'R': 0,
                                                        'G': 0,
                                                        'B': 0,
                                                        'A': 1
                                                    },
                                                    'SpecularColor': {
                                                        'R': 0,
                                                        'G': 0,
                                                        'B': 0,
                                                        'A': 1
                                                    },
                                                    'EmissiveColor': {
                                                        'R': 0,
                                                        'G': 0,
                                                        'B': 0,
                                                        'A': 1
                                                    },
                                                    'Shininess': 0
                                                },
                                                'Transparent': 0,
                                                'Smooth': 0,
                                                'Texture': {
                                                    'Level': 0,
                                                    'Type': 0,
                                                    'Code': '0',
                                                    'Key': 0
                                                },
                                                'FlagMeasure': 10,
                                                'TransparentTex': 0,
                                                'SmoothTex': 0,
                                                'WrapTex': 0,
                                                'PaintFlag': 0,
                                                'WrapValue': [
                                                    {
                                                        'Type': 0,
                                                        'Value': 1,
                                                        'Factor': 0,
                                                        'Offset': 0
                                                    },
                                                    {
                                                        'Type': 0,
                                                        'Value': 1,
                                                        'Factor': 0,
                                                        'Offset': 0
                                                    }
                                                ],
                                                'TransformFlag': 0,
                                                'Count': 1,
                                                'ELEMENTLIST': [
                                                    {
                                                        'Type': ELEMENT3DTYPE.IMG3D_CYLINDER,
                                                        'GEOMETRY': {
                                                            'Point': {
                                                                'X': 0,
                                                                'Y': 0,
                                                                'Z': 0
                                                            },
                                                            'Rotate': {
                                                                'X': 0,
                                                                'Y': 0,
                                                                'Z': 0,
                                                                'Angle': 0
                                                            },
                                                            'Part': VISIBLE_PART.IMG3D_SIDES | VISIBLE_PART.IMG3D_BOTTOM | VISIBLE_PART.IMG3D_TOP,
                                                            'Radius': 3,
                                                            'RadiusH': 3,
                                                            'Height': 100
                                                        }
                                                    }
                                                ]
                                            }
                                            ]
                                        },
                                        {
                                            'TransformFlag': 0,
                                            'Size': [
                                                {
                                                    'Type': 0,
                                                    'Value': 40,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                },
                                                {
                                                    'Type': 0,
                                                    'Value': 40,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                },
                                                {
                                                    'Type': 0,
                                                    'Value': 40,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'Count': 1,
                                            'DESCRIPTIONLIST': [
                                                {
                                                    'ColorFlag': 0,
                                                    'MaterialFlag': 1,
                                                    'TextureFlag': 1,
                                                    'SemColorFlag': 0,
                                                    'Color': {
                                                        'R': 1,
                                                        'G': 0,
                                                        'B': 0,
                                                        'A': 1
                                                    },
                                                    'Material': {
                                                        'AmbientColor': {
                                                            'R': 218 / 255,
                                                            'G': 68 / 255,
                                                            'B': 71 / 255,
                                                            'A': 1
                                                        },
                                                        'DiffuseColor': {
                                                            'R': 218 / 255,
                                                            'G': 68 / 255,
                                                            'B': 71 / 255,
                                                            'A': 1
                                                        },
                                                        'SpecularColor': {
                                                            'R': 1,
                                                            'G': 1,
                                                            'B': 1,
                                                            'A': 1
                                                        },
                                                        'EmissiveColor': {
                                                            'R': 0,
                                                            'G': 0,
                                                            'B': 0,
                                                            'A': 1
                                                        },
                                                        'Shininess': 10
                                                    },
                                                    'Transparent': 0,
                                                    'Smooth': 0,
                                                    'PaintFlag': 1,

                                                    'Texture': {
                                                        'Type': 0,
                                                        'Code': '0',
                                                        'Key': -1,
                                                        'Level': 0
                                                    },
                                                    'FlagMeasure': TEXTUREMEASURE.texGUnit | TEXTUREMEASURE.texVUnit,
                                                    'TransparentTex': 0,
                                                    'SmoothTex': 0,
                                                    'WrapTex': 0,
                                                    'WrapValue': [
                                                        {
                                                            'Type': 0,
                                                            'Value': 4,
                                                            'Factor': 0,
                                                            'Offset': 0
                                                        },
                                                        {
                                                            'Type': 0,
                                                            'Value': 4,
                                                            'Factor': 0,
                                                            'Offset': 0
                                                        }
                                                    ],
                                                    'TransformFlag': 0,
                                                    'Count': 1,
                                                    'ELEMENTLIST': [
                                                        {
                                                            'Type': ELEMENT3DTYPE.IMG3D_SPHERE,
                                                            'GEOMETRY': {
                                                                'Point': {
                                                                    'X': 0,
                                                                    'Y': 120,
                                                                    'Z': 0
                                                                },
                                                                'Rotate': {
                                                                    'X': 0,
                                                                    'Y': 0,
                                                                    'Z': 0,
                                                                    'Angle': 0
                                                                },
                                                                'Radius': 20
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            'Key': 'GeoPoint',
            'Code': -1031,
            'Level': 0,
            'Distance': 0,
            'Local': LOCALE.Point,
            'LayerId': Object3dCreator.defaultLayerId,
            'ClassifierName': 'GeoPoint',
            'F3DTREE': {
                'Ident': 1943892957,
                'MaxIdent': 1,
                'Count': 1,
                'FUNCTIONLIST': [
                    {
                        'Number': FUNCTION3D_TYPE.F3D_MARK,
                        'Ident': 1,
                        'FUNCTIONPARAMS': {
                            'Mark': {
                                'FUNCTIONPARAMS': {
                                    'Height': {
                                        'Type': 0,
                                        'Value': 0,
                                        'Factor': 1,
                                        'Offset': 0
                                    },
                                    'RelativeHeight': {
                                        'Type': 0,
                                        'Value': 0,
                                        'Factor': 1,
                                        'Offset': 0
                                    },
                                    'SizeX': {
                                        'Type': 0,
                                        'Value': 40,
                                        'Factor': 1,
                                        'Offset': 0
                                    },
                                    'SizeZ': {
                                        'Type': 0,
                                        'Value': 40,
                                        'Factor': 1,
                                        'Offset': 0
                                    },
                                    'Scale': [
                                        0,
                                        0,
                                        0
                                    ],
                                    'Vector': VECTOR_ORIENTATION3D.VM_VERTICAL | VECTOR_ORIENTATION3D.VM_NOSCALE,
                                    'FlagVRML': 0,
                                    'TransformFlag': 0,
                                    'SizeScaleFactor': 0,
                                    'Point': [
                                        {
                                            'X': 0,
                                            'Y': 0,
                                            'Z': 0
                                        },
                                        {
                                            'X': -20,
                                            'Y': 0,
                                            'Z': -20
                                        }
                                    ],
                                    'MarkIncode': 0,
                                    'Count': 1,
                                    'NODELIST': [
                                        {
                                            'TransformFlag': 0,
                                            'Size': [
                                                {
                                                    'Type': 0,
                                                    'Value': 40,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                },
                                                {
                                                    'Type': 0,
                                                    'Value': 40,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                },
                                                {
                                                    'Type': 0,
                                                    'Value': 40,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'Count': 1,
                                            'DESCRIPTIONLIST': [
                                                {
                                                    'ColorFlag': 0,
                                                    'MaterialFlag': 1,
                                                    'TextureFlag': 1,
                                                    'SemColorFlag': 0,
                                                    'Color': {
                                                        'R': 1,
                                                        'G': 0,
                                                        'B': 0,
                                                        'A': 1
                                                    },
                                                    'Material': {
                                                        'AmbientColor': {
                                                            'R': 218 / 255,
                                                            'G': 68 / 255,
                                                            'B': 71 / 255,
                                                            'A': 1
                                                        },
                                                        'DiffuseColor': {
                                                            'R': 218 / 255,
                                                            'G': 68 / 255,
                                                            'B': 71 / 255,
                                                            'A': 1
                                                        },
                                                        'SpecularColor': {
                                                            'R': 1,
                                                            'G': 1,
                                                            'B': 1,
                                                            'A': 1
                                                        },
                                                        'EmissiveColor': {
                                                            'R': 0,
                                                            'G': 0,
                                                            'B': 0,
                                                            'A': 1
                                                        },
                                                        'Shininess': 10
                                                    },
                                                    'Transparent': 0,
                                                    'Smooth': 0,
                                                    'PaintFlag': 1,
                                                    'Texture': {
                                                        'Type': 0,
                                                        'Code': '0',
                                                        'Key': -1,
                                                        'Level': 0
                                                    },
                                                    'FlagMeasure': TEXTUREMEASURE.texGUnit | TEXTUREMEASURE.texVUnit,
                                                    'TransparentTex': 0,
                                                    'SmoothTex': 0,
                                                    'WrapTex': 0,
                                                    'WrapValue': [
                                                        {
                                                            'Type': 0,
                                                            'Value': 4,
                                                            'Factor': 0,
                                                            'Offset': 0
                                                        },
                                                        {
                                                            'Type': 0,
                                                            'Value': 4,
                                                            'Factor': 0,
                                                            'Offset': 0
                                                        }
                                                    ],
                                                    'TransformFlag': 0,
                                                    'Count': 1,
                                                    'ELEMENTLIST': [
                                                        {
                                                            'Type': ELEMENT3DTYPE.IMG3D_SPHERE,
                                                            'GEOMETRY': {
                                                                'Point': {
                                                                    'X': 0,
                                                                    'Y': 0,
                                                                    'Z': 0
                                                                },
                                                                'Rotate': {
                                                                    'X': 0,
                                                                    'Y': 0,
                                                                    'Z': 0,
                                                                    'Angle': 0
                                                                },
                                                                'Radius': 2
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            'Key': 'Polygon',
            'Level': 0,
            'Distance': 0,
            'Code': -101,
            'Local': LOCALE.Plane,
            'LayerId': Object3dCreator.defaultLayerId,
            'ClassifierName': 'Polygon',
            'F3DTREE': {
                'Ident': 1943892958,
                'MaxIdent': 3,
                'Count': 2,
                'FUNCTIONLIST': [
                    {
                        'Number': FUNCTION3D_TYPE.F3D_VERTBYLINE, //по номеру берется название функции (F3DVERTBYLINE)
                        'Ident': 1,
                        'FUNCTIONPARAMS': {
                            'Height': {  // Высота плоскости(вверх)
                                'Type': 0,  // 0 - брать значение                         // 02/03/12
                                // > 0 брать номер семантики
                                // < 0  - брать по ссылке на функцию IMG3DRELATE
                                'Value': 35, // Значение
                                'Factor': 1, // Коэффициент для значения( кроме Type == 0)
                                'Offset': 0 // Сдвиг значения( кроме Type == 0) постоянная часть
                            },
                            'RelativeHeight': {// Высота расположения плоскости относительно
                                // метрики объекта:
                                //       положительная - вверх,
                                //       отрицательная - вниз
                                'Type': 0,
                                'Value': 0,
                                'Factor': 1,
                                'Offset': 0
                            },
                            'Removal': {    // Смещение плоскости по поверхности,
                                // относительно метрики объекта(пока нет)
                                'Type': 0,
                                'Value': 0,
                                'Factor': 0,
                                'Offset': 0
                            },

                            'SurfaceFlag': SURFACE_TYPE.TOPFREE, // Флаг расположения плоскости относительно поверхности: ALLBYRELIEF, ALLFREE, TOPFREE (см. выше)
                            'Count': 1,
                            'NODELIST': [   //массив узлов IMG3DNODE
                                {
                                    'TransformFlag': 0, // Флаг наличия описания положения системы координат рисования узла
                                    // 0 - структуры описания нет                   // 07/06/10
                                    // 1 - после IMG3DNODE идет структура описания положения IMG3DTRANSFORM (размер структуры входит в длину описания узла)
                                    // 2 - после IMG3DNODE идет структура описания положения IMG3DTMATRIX (размер структуры входит в длину описания узла)

                                    'Size': [   // Размеры узла (ширина(по X), высота(по Y), длина(по Z))
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        },
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        },
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }
                                    ],
                                    'Count': 1,
                                    'DESCRIPTIONLIST': [
                                        {
                                            'ColorFlag': 1, // 1 - наличие цвета,0 - отсутствие
                                            'MaterialFlag': 0, // 1 - наличие материала,0 - отсутствие
                                            'TextureFlag': 0, // 1 - наличие текстуры,0 - отсутствие
                                            'SemColorFlag': 0, //             =    IMG3DVALUE RGBA  value COLORREF
                                            // Если цвет берется из семантики SemColorFlag = 1 умалчиваемый цвет лежит:
                                            //      как COLORREF в ((IMG3DVALUE*)&(Desc->Color))->Value
                                            //      A - компонент в ((IMG3DVALUE*)&(Desc->Color))->Factor
                                            //      Прозрачность для цвета по семантике берется из умалчиваемого цвета
                                            // номер семантики со значением цвета в COLORREF лежит в
                                            // ((IMG3DVALUE*)&(Desc->Color))->Type

                                            'Color': { // Цвет (RGBA)
                                                'R': 0.572549045085907,
                                                'G': 0.5137255191802979,
                                                'B': 0.45490196347236633,
                                                'A': 1.0
                                            },
                                            'Material': { // Материал
                                                'AmbientColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'DiffuseColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'SpecularColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'EmissiveColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'Shininess': 0
                                            },
                                            'Transparent': 1, // Прозрачность (0-нет, 1-прозрачна)
                                            'Smooth': 0, // Размытость цветов(0-нет, 1-размыта)
                                            'Texture': { // Информация о текстуре
                                                'Type': 0, // 0 или номер семантики
                                                'Code': '0', // Номер текстуры  = 0
                                                'Key': 0,  // Ключ текстуры - уникален в пределах файла
                                                'Level': 0
                                            },
                                            'FlagMeasure': 9,  // Тип размера текстуры TEXTUREMEASURE
                                            'TransparentTex': 0, // Прозрачность текстуры (0,1)
                                            'SmoothTex': 0,  // Размытость текстуры (0,1)
                                            'WrapTex': 1, // Повторяемость текстуры
                                            'PaintFlag': PAINT_FLAG.FRONTFACE, // 0 - рисовать с двух сторон поверхности, 1 - с одной стороны поверхности (текстуру, цвет и т.д.)
                                            'WrapValue': [ // Значения повторяемости текстуры по двум текстурным координатам(или 0 при произвольной повторяемости)
                                                {
                                                    'Type': 0,
                                                    'Value': 80,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                },
                                                {
                                                    'Type': 0,
                                                    'Value': 1,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'TransformFlag': 0, // Флаг наличия описаний положения системы координат рисования элементов
                                            // 0 - структур описаний нет                   // 07/06/10
                                            // 1 - перед IMG3DELEMENT идет структура описания положения элемента IMG3DTRANSFORM (размер структуры в длину описания элемента не входит)
                                            // 2 - перед IMG3DELEMENT идет структура описания положения IMG3DTMATRIX (размер структуры в длину описания элемента не входит)
                                            'Count': 0,
                                            'ELEMENTLIST': [] as []
                                        }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        'Number': FUNCTION3D_TYPE.F3D_HORIZONT,
                        'Ident': 2,
                        'FUNCTIONPARAMS': {
                            'Height': {
                                'Type': 0,
                                'Value': 0,
                                'Factor': 1,
                                'Offset': 0
                            },
                            'RelativeHeight': {
                                'Type': -1,
                                'Value': 1,
                                'Factor': 1,
                                'Offset': 0
                            },
                            'Count': 1,
                            'NODELIST': [
                                {
                                    'TransformFlag': 0,
                                    'Size': [
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        },
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        },
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }
                                    ],
                                    'Count': 1,
                                    'DESCRIPTIONLIST': [
                                        {
                                            'ColorFlag': 1,
                                            'MaterialFlag': 0,
                                            'TextureFlag': 0,
                                            'SemColorFlag': 0,
                                            'Color': {
                                                'R': 0.572549045085907,
                                                'G': 0.5137255191802979,
                                                'B': 0.45490196347236633,
                                                'A': 0.800000011920929
                                            },
                                            'Material': {
                                                'AmbientColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'DiffuseColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'SpecularColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'EmissiveColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'Shininess': 0
                                            },
                                            'Transparent': 1,
                                            'Smooth': 0,
                                            'Texture': {
                                                'Type': 0,
                                                'Code': '0',
                                                'Key': 0,
                                                'Level': 0
                                            },
                                            'FlagMeasure': 10,
                                            'TransparentTex': 0,
                                            'SmoothTex': 0,
                                            'WrapTex': 0,
                                            'PaintFlag': PAINT_FLAG.FRONTFACE,
                                            'WrapValue': [
                                                {
                                                    'Type': 0,
                                                    'Value': 1,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                },
                                                {
                                                    'Type': 0,
                                                    'Value': 1,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'Count': 0,
                                            'TransformFlag': 0,
                                            'ELEMENTLIST': [] as []
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            'Key': 'ShadowPolygon',
            'Level': 0,
            'Distance': 0,
            'Code': -1001,
            'Local': LOCALE.Plane,
            'LayerId': Object3dCreator.defaultLayerId,
            'ClassifierName': 'Polygon',
            'F3DTREE': {
                'Ident': 1943892951,
                'MaxIdent': 1,
                'Count': 1,
                'FUNCTIONLIST': [
                    {
                        'Number': FUNCTION3D_TYPE.F3D_SURFACE,
                        'Ident': 1,
                        'FUNCTIONPARAMS': {
                            'Height': {
                                'Type': 0,
                                'Value': 0,
                                'Factor': 1,
                                'Offset': 0
                            },
                            'RelativeHeight': {
                                'Type': -1,
                                'Value': 1,
                                'Factor': 1,
                                'Offset': 0
                            },
                            'Count': 1,
                            'NODELIST': [
                                {
                                    'TransformFlag': 0,
                                    'Size': [
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        },
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        },
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }
                                    ],
                                    'Count': 1,
                                    'DESCRIPTIONLIST': [
                                        {
                                            'ColorFlag': 1,
                                            'MaterialFlag': 0,
                                            'TextureFlag': 0,
                                            'SemColorFlag': 0,
                                            'Color': {
                                                'R': 0.572549045085907,
                                                'G': 0.5137255191802979,
                                                'B': 0.45490196347236633,
                                                'A': 0.800000011920929
                                            },
                                            'Material': {
                                                'AmbientColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'DiffuseColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'SpecularColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'EmissiveColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'Shininess': 0
                                            },
                                            'Transparent': 1,
                                            'Smooth': 0,
                                            'Texture': {
                                                'Type': 0,
                                                'Code': '0',
                                                'Key': 0,
                                                'Level': 0
                                            },
                                            'FlagMeasure': 10,
                                            'TransparentTex': 0,
                                            'SmoothTex': 0,
                                            'WrapTex': 0,
                                            'PaintFlag': PAINT_FLAG.FRONTFACE,
                                            'WrapValue': [
                                                {
                                                    'Type': 0,
                                                    'Value': 1,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                },
                                                {
                                                    'Type': 0,
                                                    'Value': 1,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'TransformFlag': 0,
                                            'Count': 0,
                                            'ELEMENTLIST': [] as []
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            'Key': 'ShadowPolygon',
            'Level': 1,
            'Distance': 100000,
            'Code': -1001,
            'Local': LOCALE.Plane,
            'LayerId': Object3dCreator.defaultLayerId,
            'ClassifierName': 'Polygon',
            'F3DTREE': {
                'Ident': 1943892958,
                'MaxIdent': 1,
                'Count': 1,
                'FUNCTIONLIST': [
                    {
                        'Number': FUNCTION3D_TYPE.F3D_HORIZONT,
                        'Ident': 1,
                        'FUNCTIONPARAMS': {
                            'Height': {
                                'Type': 0, // <0 только для RelativeHeight
                                'Value': 0,
                                'Factor': 1,//(для type!=0) коэффициент смещения (умножается на Value)
                                'Offset': 0 //(для type!=0) смещение (постоянная часть)
                            },
                            'RelativeHeight': {
                                'Type': 0,
                                'Value': 0,
                                'Factor': 1,
                                'Offset': 0
                            },
                            'Count': 1,
                            'NODELIST': [
                                {
                                    'TransformFlag': 0,
                                    'Size': [
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        },
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        },
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }
                                    ],
                                    'Count': 1,
                                    'DESCRIPTIONLIST': [
                                        {
                                            'ColorFlag': 1,
                                            'MaterialFlag': 0,
                                            'TextureFlag': 0,
                                            'SemColorFlag': 0,
                                            'Color': {
                                                'R': 0.572549045085907,
                                                'G': 0.5137255191802979,
                                                'B': 0.45490196347236633,
                                                'A': 0.800000011920929
                                            },
                                            'Material': {
                                                'AmbientColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'DiffuseColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'SpecularColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'EmissiveColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'Shininess': 0
                                            },
                                            'Transparent': 1,
                                            'Smooth': 0,
                                            'Texture': {
                                                'Type': 0,
                                                'Code': '0',
                                                'Key': 0,
                                                'Level': 0
                                            },
                                            'FlagMeasure': 10,
                                            'TransparentTex': 0,
                                            'SmoothTex': 0,
                                            'WrapTex': 0,
                                            'PaintFlag': PAINT_FLAG.BOTH,
                                            'WrapValue': [
                                                {
                                                    'Type': 0,
                                                    'Value': 1,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                },
                                                {
                                                    'Type': 0,
                                                    'Value': 1,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'TransformFlag': 0,
                                            'Count': 0,
                                            'ELEMENTLIST': [] as []
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        },


        {
            'Key': 'Line',
            'Level': 0,
            'Distance': 0,
            'Code': -102,
            'Local': LOCALE.Line,
            'LayerId': Object3dCreator.defaultLayerId,
            'ClassifierName': 'Line',
            'F3DTREE': {
                'Ident': 1943892957,
                'MaxIdent': 1,
                'Count': 1,
                'FUNCTIONLIST': [
                    {
                        'Number': FUNCTION3D_TYPE.F3D_VERTBYLINE,
                        'Ident': 1,
                        'FUNCTIONPARAMS': {
                            'Height': {
                                'Type': 0, // <0 только для RelativeHeight
                                'Value': 3,
                                'Factor': 1,//(для type!=0) коэффициент смещения (умножается на Value)
                                'Offset': 0 //(для type!=0) смещение (постоянная часть)
                            },
                            'RelativeHeight': {
                                'Type': 0,
                                'Value': 0,
                                'Factor': 1,
                                'Offset': 0
                            },
                            'Removal': {
                                'Type': 0,
                                'Value': 0,
                                'Factor': 0,
                                'Offset': 0
                            },
                            'SurfaceFlag': SURFACE_TYPE.TOPFREE,
                            'Count': 1,
                            'NODELIST': [
                                {
                                    'TransformFlag': 0,
                                    'Size': [
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }, {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }, {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }
                                    ],
                                    'Count': 1,
                                    'DESCRIPTIONLIST': [
                                        {
                                            'ColorFlag': 1,
                                            'MaterialFlag': 0,
                                            'TextureFlag': 0,
                                            'SemColorFlag': 0,
                                            'Color': {
                                                'R': 0.501960813999176,
                                                'G': 0.501960813999176,
                                                'B': 0.501960813999176,
                                                'A': 1
                                            },
                                            'Material': {
                                                'AmbientColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'DiffuseColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'SpecularColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'EmissiveColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'Shininess': 0
                                            },
                                            'Transparent': 0,
                                            'Smooth': 0,
                                            'Texture': {
                                                'Type': 0,
                                                'Code': '0',
                                                'Key': 0,
                                                'Level': 0
                                            },
                                            'FlagMeasure': 10,
                                            'TransparentTex': 0,
                                            'SmoothTex': 0,
                                            'WrapTex': 0,
                                            'PaintFlag': PAINT_FLAG.BOTH,
                                            'WrapValue': [
                                                {
                                                    'Type': 0,
                                                    'Value': 10,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }, {
                                                    'Type': 0,
                                                    'Value': 10,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'TransformFlag': 0,
                                            'Count': 0,
                                            'ELEMENTLIST': []
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            'Key': 'Point',
            'Level': 0,
            'Distance': 0,
            'Code': -103,
            'Local': LOCALE.Point,
            'LayerId': Object3dCreator.defaultLayerId,
            'ClassifierName': 'Point',
            'F3DTREE': {
                'Ident': 1943892957,
                'MaxIdent': 1,
                'Count': 1,
                'FUNCTIONLIST': [
                    {
                        'Number': FUNCTION3D_TYPE.F3D_MARK,
                        'Ident': 1,
                        'FUNCTIONPARAMS': {
                            'Mark': {
                                'FUNCTIONPARAMS': {
                                    'Height': {
                                        'Type': 0,
                                        'Value': 12,
                                        'Factor': 1,
                                        'Offset': 0
                                    },
                                    'RelativeHeight': {
                                        'Type': 0,
                                        'Value': 0,
                                        'Factor': 1,
                                        'Offset': 0
                                    },

                                    'SizeX': {
                                        'Type': 0,
                                        'Value': 3,
                                        'Factor': 1,
                                        'Offset': 0
                                    },
                                    'SizeZ': {
                                        'Type': 0,
                                        'Value': 3,
                                        'Factor': 1,
                                        'Offset': 0
                                    },
                                    'Scale': [0, 0, 0],
                                    'Vector': VECTOR_ORIENTATION3D.VM_ANYTURN | VECTOR_ORIENTATION3D.VM_ANYPOS | VECTOR_ORIENTATION3D.VM_VERTICAL,
                                    'FlagVRML': 0,
                                    'TransformFlag': 1,
                                    'SizeScaleFactor': 0,
                                    'Point': [
                                        {
                                            'X': 0,
                                            'Y': 0,
                                            'Z': 0
                                        }, {
                                            'X': 0,
                                            'Y': 0,
                                            'Z': 0
                                        }
                                    ],
                                    'MarkIncode': 0,
                                    'SurfaceFlag': SURFACE_TYPE.ALLBYRELIEF,
                                    'IMG3DTRANSFORM': {
                                        'Center': {
                                            'X': 0,
                                            'Y': 0,
                                            'Z': 0
                                        },
                                        'Translation': {
                                            'X': 0,
                                            'Y': 0,
                                            'Z': 0
                                        },
                                        'Removal': {
                                            'X': 0,
                                            'Y': 1,
                                            'Z': 0,
                                            'Angle': 90
                                        },
                                        'Scale': {
                                            'X': 1,
                                            'Y': 1,
                                            'Z': 1
                                        },
                                        'ScaleOrientation': {
                                            'X': 0,
                                            'Y': 0,
                                            'Z': 0,
                                            'Angle': 0
                                        },
                                        'Level': 0
                                    },
                                    'Count': 2,
                                    'NODELIST': [
                                        {
                                            'TransformFlag': 0,
                                            'Size': [
                                                {
                                                    'Type': 0,
                                                    'Value': 2,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }, {
                                                    'Type': 0,
                                                    'Value': 50,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }, {
                                                    'Type': 0,
                                                    'Value': 38,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'Count': 1,
                                            'DESCRIPTIONLIST': [
                                                {
                                                    'ColorFlag': 1,
                                                    'MaterialFlag': 0,
                                                    'TextureFlag': 0,
                                                    'SemColorFlag': 0,
                                                    'Color': {
                                                        'R': 0.7529411911964417,
                                                        'G': 0.7529411911964417,
                                                        'B': 0.7529411911964417,
                                                        'A': 1
                                                    },
                                                    'Material': {
                                                        'AmbientColor': {
                                                            'R': 0,
                                                            'G': 0,
                                                            'B': 0,
                                                            'A': 1
                                                        },
                                                        'DiffuseColor': {
                                                            'R': 0,
                                                            'G': 0,
                                                            'B': 0,
                                                            'A': 1
                                                        },
                                                        'SpecularColor': {
                                                            'R': 0,
                                                            'G': 0,
                                                            'B': 0,
                                                            'A': 1
                                                        },
                                                        'EmissiveColor': {
                                                            'R': 0,
                                                            'G': 0,
                                                            'B': 0,
                                                            'A': 1
                                                        },
                                                        'Shininess': 0
                                                    },
                                                    'Transparent': 0,
                                                    'Smooth': 0,
                                                    'PaintFlag': 0,

                                                    'Texture': {
                                                        'Type': 0,
                                                        'Code': '0',
                                                        'Key': 0,
                                                        'Level': 0
                                                    },
                                                    'FlagMeasure': TEXTUREMEASURE.texGUnit | TEXTUREMEASURE.texVUnit,
                                                    'TransparentTex': 0,
                                                    'SmoothTex': 0,
                                                    'WrapTex': 0,
                                                    'WrapValue': [
                                                        {
                                                            'Type': 0,
                                                            'Value': 1,
                                                            'Factor': 0,
                                                            'Offset': 0
                                                        },
                                                        {
                                                            'Type': 0,
                                                            'Value': 4,
                                                            'Factor': 0,
                                                            'Offset': 0
                                                        }
                                                    ],
                                                    'TransformFlag': 0,
                                                    'Count': 4,
                                                    'ELEMENTLIST': [
                                                        {
                                                            'Type': ELEMENT3DTYPE.IMG3D_QUAD,
                                                            'GEOMETRY': {
                                                                'Vertex': [
                                                                    {
                                                                        'X': 0,
                                                                        'Y': 0,
                                                                        'Z': 0
                                                                    }, {
                                                                        'X': 0,
                                                                        'Y': 0,
                                                                        'Z': 0
                                                                    }, {
                                                                        'X': -1,
                                                                        'Y': 50,
                                                                        'Z': 19
                                                                    }, {
                                                                        'X': -1,
                                                                        'Y': 50,
                                                                        'Z': -19
                                                                    }
                                                                ]
                                                            }
                                                        },
                                                        {
                                                            'Type': ELEMENT3DTYPE.IMG3D_QUAD,
                                                            'GEOMETRY': {
                                                                'Vertex': [
                                                                    {
                                                                        'X': 0,
                                                                        'Y': 0,
                                                                        'Z': 0
                                                                    }, {
                                                                        'X': 0,
                                                                        'Y': 0,
                                                                        'Z': 0
                                                                    }, {
                                                                        'X': 1,
                                                                        'Y': 50,
                                                                        'Z': 19
                                                                    }, {
                                                                        'X': -1,
                                                                        'Y': 50,
                                                                        'Z': 19
                                                                    }
                                                                ]
                                                            }
                                                        },
                                                        {
                                                            'Type': ELEMENT3DTYPE.IMG3D_QUAD,
                                                            'GEOMETRY': {
                                                                'Vertex': [
                                                                    {
                                                                        'X': 0,
                                                                        'Y': 0,
                                                                        'Z': 0
                                                                    }, {
                                                                        'X': 0,
                                                                        'Y': 0,
                                                                        'Z': 0
                                                                    }, {
                                                                        'X': 1,
                                                                        'Y': 50,
                                                                        'Z': -19
                                                                    }, {
                                                                        'X': 1,
                                                                        'Y': 50,
                                                                        'Z': 19
                                                                    }
                                                                ]
                                                            }
                                                        },
                                                        {
                                                            'Type': ELEMENT3DTYPE.IMG3D_QUAD,
                                                            'GEOMETRY': {
                                                                'Vertex': [
                                                                    {
                                                                        'X': 0,
                                                                        'Y': 0,
                                                                        'Z': 0
                                                                    }, {
                                                                        'X': 0,
                                                                        'Y': 0,
                                                                        'Z': 0
                                                                    }, {
                                                                        'X': -1,
                                                                        'Y': 50,
                                                                        'Z': -19
                                                                    }, {
                                                                        'X': 1,
                                                                        'Y': 50,
                                                                        'Z': -19
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }]
                                        },
                                        {
                                            'TransformFlag': 0,
                                            'Size': [
                                                {
                                                    'Type': 0,
                                                    'Value': 4,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }, {
                                                    'Type': 0,
                                                    'Value': 40,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }, {
                                                    'Type': 0,
                                                    'Value': 40,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'Count': 1,
                                            'DESCRIPTIONLIST': [
                                                {
                                                    'ColorFlag': 1,
                                                    'MaterialFlag': 0,
                                                    'TextureFlag': 0,
                                                    'SemColorFlag': 0,
                                                    'Color': {
                                                        'R': 1,
                                                        'G': 0,
                                                        'B': 0,
                                                        'A': 1
                                                    },
                                                    'Material': {
                                                        'AmbientColor': {
                                                            'R': 0,
                                                            'G': 0,
                                                            'B': 0,
                                                            'A': 1
                                                        },
                                                        'DiffuseColor': {
                                                            'R': 0,
                                                            'G': 0,
                                                            'B': 0,
                                                            'A': 1
                                                        },
                                                        'SpecularColor': {
                                                            'R': 0,
                                                            'G': 0,
                                                            'B': 0,
                                                            'A': 1
                                                        },
                                                        'EmissiveColor': {
                                                            'R': 0,
                                                            'G': 0,
                                                            'B': 0,
                                                            'A': 1
                                                        },
                                                        'Shininess': 0
                                                    },
                                                    'Transparent': 0,
                                                    'Smooth': 0,
                                                    'PaintFlag': 1,

                                                    'Texture': {
                                                        'Type': 0,
                                                        'Code': '0',
                                                        'Key': 0,
                                                        'Level': 0
                                                    },
                                                    'FlagMeasure': TEXTUREMEASURE.texGUnit | TEXTUREMEASURE.texVUnit,
                                                    'TransparentTex': 0,
                                                    'SmoothTex': 0,
                                                    'WrapTex': 0,
                                                    'WrapValue': [
                                                        {
                                                            'Type': 0,
                                                            'Value': 1,
                                                            'Factor': 0,
                                                            'Offset': 0
                                                        },
                                                        {
                                                            'Type': 0,
                                                            'Value': 1,
                                                            'Factor': 0,
                                                            'Offset': 0
                                                        }
                                                    ],
                                                    'TransformFlag': 0,
                                                    'Count': 1,
                                                    'ELEMENTLIST': [
                                                        {
                                                            'Type': ELEMENT3DTYPE.IMG3D_CYLINDER,
                                                            'GEOMETRY': {
                                                                'Point': {
                                                                    'X': 3,
                                                                    'Y': 50,
                                                                    'Z': 0
                                                                },
                                                                'Rotate': {
                                                                    'X': 0,
                                                                    'Y': 0,
                                                                    'Z': 1,
                                                                    'Angle': 90
                                                                },
                                                                'Part': VISIBLE_PART.IMG3D_SIDES | VISIBLE_PART.IMG3D_BOTTOM | VISIBLE_PART.IMG3D_TOP,
                                                                'Radius': 20,
                                                                'RadiusH': 20,
                                                                'Height': 6
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            'Key': 'Text',
            'Level': 0,
            'Distance': 0,
            'Code': -104,
            'Local': LOCALE.Text,
            'LayerId': Object3dCreator.defaultLayerId,
            'ClassifierName': 'Text',
            'F3DTREE': {
                'Ident': 1943892958,
                'MaxIdent': 2,
                'Count': 2,
                'FUNCTIONLIST': [
                    {
                        'Number': FUNCTION3D_TYPE.F3D_TEXT,
                        'Ident': 1,
                        'FUNCTIONPARAMS': {
                            'Height': {
                                'Type': 0,
                                'Value': 6,
                                'Factor': 0,
                                'Offset': 0
                            },
                            'RelativeHeight': {
                                'Type': 0,
                                'Value': 40,
                                'Factor': 0,
                                'Offset': 0
                            },
                            'Removal': {
                                'Type': 0,
                                'Value': 0,
                                'Factor': 0,
                                'Offset': 0
                            },
                            'SurfaceFlag': SURFACE_TYPE.ALLFREE,
                            'Vector': VECTOR_ORIENTATION3D.VM_BYOBSER | VECTOR_ORIENTATION3D.VM_NOSCALE,
                            'Count': 1,
                            'TextParam': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 232],
                            'NODELIST': [
                                {
                                    'TransformFlag': 0,
                                    'Size': [
                                        {
                                            'Type': 0,
                                            'Value': 4,
                                            'Factor': 0,
                                            'Offset': 0
                                        }, {
                                            'Type': 0,
                                            'Value': 40,
                                            'Factor': 0,
                                            'Offset': 0
                                        }, {
                                            'Type': 0,
                                            'Value': 40,
                                            'Factor': 0,
                                            'Offset': 0
                                        }
                                    ],
                                    'Count': 1,
                                    'DESCRIPTIONLIST': [
                                        {
                                            'ColorFlag': 1,
                                            'SemColorFlag': 0,
                                            'Color': {
                                                'R': 0,
                                                'G': 0,
                                                'B': 0,
                                                'A': 1
                                            },
                                            'MaterialFlag': 1,
                                            'Material': {
                                                'AmbientColor': {
                                                    'R': 1,
                                                    'G': 1,
                                                    'B': 1,
                                                    'A': 1
                                                },
                                                'DiffuseColor': {
                                                    'R': 1,
                                                    'G': 1,
                                                    'B': 1,
                                                    'A': 1
                                                },
                                                'SpecularColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'EmissiveColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'Shininess': 0
                                            },
                                            'Transparent': 0,
                                            'Smooth': 1,
                                            'TextureFlag': 0,
                                            'Texture': {
                                                'Type': 0,
                                                'Code': '0',
                                                'Key': -1,
                                                'Level': 0
                                            },
                                            'FlagMeasure': TEXTUREMEASURE.texGUnit | TEXTUREMEASURE.texVUnit,
                                            'TransparentTex': 0,
                                            'SmoothTex': 0,
                                            'WrapTex': 0,
                                            'WrapValue': [
                                                {
                                                    'Type': 0,
                                                    'Value': 1,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                },
                                                {
                                                    'Type': 0,
                                                    'Value': 1,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'PaintFlag': PAINT_FLAG.BOTH,
                                            'TransformFlag': 0,
                                            'Count': 0,
                                            'ELEMENTLIST': []
                                        }
                                    ]
                                }
                            ]
                        }
                    },
                    Parser3d.createTextPointerLineset( 1, 40 )
                ]
            }
        },
        {
            'Key': 'LineByRelief',
            'Level': 0,
            'Distance': 0,
            'Code': -107,
            'Local': LOCALE.Line,
            'LayerId': Object3dCreator.defaultLayerId,
            'ClassifierName': 'Line',
            'F3DTREE': {
                'Ident': 1943892957,
                'MaxIdent': 1,
                'Count': 1,
                'FUNCTIONLIST': [
                    {
                        'Number': FUNCTION3D_TYPE.F3D_VERTBYLINE,
                        'Ident': 1,
                        'FUNCTIONPARAMS': {
                            'Height': {
                                'Type': 0, // <0 только для RelativeHeight
                                'Value': 3,
                                'Factor': 1,//(для type!=0) коэффициент смещения (умножается на Value)
                                'Offset': 0 //(для type!=0) смещение (постоянная часть)
                            },
                            'RelativeHeight': {
                                'Type': 0,
                                'Value': 0,
                                'Factor': 1,
                                'Offset': 0
                            },
                            'Removal': {
                                'Type': 0,
                                'Value': 0,
                                'Factor': 0,
                                'Offset': 0
                            },
                            'SurfaceFlag': SURFACE_TYPE.ALLBYRELIEF,
                            'Count': 1,
                            'NODELIST': [
                                {
                                    'TransformFlag': 0,
                                    'Size': [
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }, {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }, {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }
                                    ],
                                    'Count': 1,
                                    'DESCRIPTIONLIST': [
                                        {
                                            'ColorFlag': 1,
                                            'MaterialFlag': 0,
                                            'TextureFlag': 0,
                                            'SemColorFlag': 0,
                                            'Color': {
                                                'R': 0.501960813999176,
                                                'G': 0.501960813999176,
                                                'B': 0.501960813999176,
                                                'A': 1
                                            },
                                            'Material': {
                                                'AmbientColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'DiffuseColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'SpecularColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'EmissiveColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'Shininess': 0
                                            },
                                            'Transparent': 0,
                                            'Smooth': 0,
                                            'Texture': {
                                                'Type': 0,
                                                'Code': '0',
                                                'Key': 0,
                                                'Level': 0
                                            },
                                            'FlagMeasure': 10,
                                            'TransparentTex': 0,
                                            'SmoothTex': 0,
                                            'WrapTex': 0,
                                            'PaintFlag': PAINT_FLAG.BOTH,
                                            'WrapValue': [
                                                {
                                                    'Type': 0,
                                                    'Value': 10,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }, {
                                                    'Type': 0,
                                                    'Value': 10,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'TransformFlag': 0,
                                            'Count': 0,
                                            'ELEMENTLIST': []
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            'Key': 'LineByReliefHorizont',
            'Level': 0,
            'Distance': 0,
            'Code': -10000003,
            'Local': LOCALE.Line,
            'LayerId': Object3dCreator.defaultLayerId,
            'ClassifierName': 'F3DHORIZONTBYLINE',
            'F3DTREE': {
                'Ident': 1943892957,
                'MaxIdent': 1,
                'Count': 1,
                'FUNCTIONLIST': [
                    {
                        'Number': FUNCTION3D_TYPE.F3D_HORIZONTBYLINE,
                        'Ident': 1,
                        'FUNCTIONPARAMS': {
                            'Height': {
                                'Type': 0, // <0 только для RelativeHeight
                                'Value': 0,
                                'Factor': 1,//(для type!=0) коэффициент смещения (умножается на Value)
                                'Offset': 0 //(для type!=0) смещение (постоянная часть)
                            },
                            'WidthPlane': {
                                'Type': 0, // <0 только для RelativeHeight
                                'Value': 2,
                                'Factor': 1,//(для type!=0) коэффициент смещения (умножается на Value)
                                'Offset': 0 //(для type!=0) смещение (постоянная часть)
                            },
                            'RelativeHeight': {
                                'Type': 0,
                                'Value': 2,
                                'Factor': 1,
                                'Offset': 0
                            },
                            'Removal': {
                                'Type': 0,
                                'Value': 0,
                                'Factor': 0,
                                'Offset': 0
                            },
                            'SurfaceFlag': SURFACE_TYPE.ALLBYRELIEF,
                            'Count': 1,
                            'NODELIST': [
                                {
                                    'TransformFlag': 0,
                                    'Size': [
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }, {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }, {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }
                                    ],
                                    'Count': 1,
                                    'DESCRIPTIONLIST': [
                                        {
                                            'ColorFlag': 1,
                                            'MaterialFlag': 0,
                                            'TextureFlag': 0,
                                            'SemColorFlag': 0,
                                            'Color': {
                                                'R': 0,
                                                'G': 0.501960813999176,
                                                'B': 0.501960813999176,
                                                'A': 1
                                            },
                                            'Material': {
                                                'AmbientColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'DiffuseColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'SpecularColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'EmissiveColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'Shininess': 0
                                            },
                                            'Transparent': 0,
                                            'Smooth': 0,
                                            'Texture': {
                                                'Type': 0,
                                                'Code': '0',
                                                'Key': 0,
                                                'Level': 0
                                            },
                                            'FlagMeasure': 10,
                                            'TransparentTex': 0,
                                            'SmoothTex': 0,
                                            'WrapTex': 0,
                                            'PaintFlag': PAINT_FLAG.FRONTFACE,
                                            'WrapValue': [
                                                {
                                                    'Type': 0,
                                                    'Value': 10,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }, {
                                                    'Type': 0,
                                                    'Value': 10,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'TransformFlag': 0,
                                            'Count': 0,
                                            'ELEMENTLIST': []
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        },

        {
            'Key': 'true',
            'Level': 0,
            'Distance': 0,
            'Code': -10000003,
            'Local': LOCALE.Line,
            'LayerId': Object3dCreator.defaultLayerId,
            'ClassifierName': 'F3DHORIZONTBYLINE',
            'F3DTREE': {
                'Ident': 1943892957,
                'MaxIdent': 1,
                'Count': 1,
                'FUNCTIONLIST': [
                    {
                        'Number': FUNCTION3D_TYPE.F3D_HORIZONTBYLINE,
                        'Ident': 1,
                        'FUNCTIONPARAMS': {
                            'Height': {
                                'Type': 0, // <0 только для RelativeHeight
                                'Value': 0,
                                'Factor': 1,//(для type!=0) коэффициент смещения (умножается на Value)
                                'Offset': 0 //(для type!=0) смещение (постоянная часть)
                            },
                            'WidthPlane': {
                                'Type': 0, // <0 только для RelativeHeight
                                'Value': 2,
                                'Factor': 1,//(для type!=0) коэффициент смещения (умножается на Value)
                                'Offset': 0 //(для type!=0) смещение (постоянная часть)
                            },
                            'RelativeHeight': {
                                'Type': 0,
                                'Value': 2,
                                'Factor': 1,
                                'Offset': 0
                            },
                            'Removal': {
                                'Type': 0,
                                'Value': 0,
                                'Factor': 0,
                                'Offset': 0
                            },
                            'SurfaceFlag': SURFACE_TYPE.ALLBYRELIEF,
                            'Count': 1,
                            'NODELIST': [
                                {
                                    'TransformFlag': 0,
                                    'Size': [
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }, {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }, {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }
                                    ],
                                    'Count': 1,
                                    'DESCRIPTIONLIST': [
                                        {
                                            'ColorFlag': 1,
                                            'MaterialFlag': 0,
                                            'TextureFlag': 0,
                                            'SemColorFlag': 0,
                                            'Color': {
                                                'R': 0,
                                                'G': 0.501960813999176,
                                                'B': 0.501960813999176,
                                                'A': 1
                                            },
                                            'Material': {
                                                'AmbientColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'DiffuseColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'SpecularColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'EmissiveColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'Shininess': 0
                                            },
                                            'Transparent': 0,
                                            'Smooth': 0,
                                            'Texture': {
                                                'Type': 0,
                                                'Code': '0',
                                                'Key': 0,
                                                'Level': 0
                                            },
                                            'FlagMeasure': 10,
                                            'TransparentTex': 0,
                                            'SmoothTex': 0,
                                            'WrapTex': 0,
                                            'PaintFlag': PAINT_FLAG.FRONTFACE,
                                            'WrapValue': [
                                                {
                                                    'Type': 0,
                                                    'Value': 10,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }, {
                                                    'Type': 0,
                                                    'Value': 10,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'TransformFlag': 0,
                                            'Count': 0,
                                            'ELEMENTLIST': [] as []
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            'Key': 'FlatLine',
            'Level': 0,
            'Distance': 0,
            'Code': -10000002,
            'Local': LOCALE.Line,
            'LayerId': Object3dCreator.defaultLayerId,
            'ClassifierName': 'FlatLine',
            'F3DTREE': {
                'Ident': 1943892957,
                'MaxIdent': 1,
                'Count': 1,
                'FUNCTIONLIST': [
                    {
                        'Number': FUNCTION3D_TYPE.F3D_FLATLINE,
                        'Ident': 1,
                        'FUNCTIONPARAMS': {
                            'Height': {
                                'Type': 0, // <0 только для RelativeHeight
                                'Value': 0,
                                'Factor': 1,//(для type!=0) коэффициент смещения (умножается на Value)
                                'Offset': 0 //(для type!=0) смещение (постоянная часть)
                            },
                            'RelativeHeight': {
                                'Type': 0,
                                'Value': 0,
                                'Factor': 1,
                                'Offset': 0
                            },
                            'Removal': {
                                'Type': 0,
                                'Value': 0,
                                'Factor': 0,
                                'Offset': 0
                            },
                            'SurfaceFlag': SURFACE_TYPE.ALLBYRELIEF,
                            'Count': 1,
                            'NODELIST': [
                                {
                                    'TransformFlag': 0,
                                    'Size': [
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }, {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }, {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }
                                    ],
                                    'Count': 1,
                                    'DESCRIPTIONLIST': [
                                        {
                                            'ColorFlag': 1,
                                            'MaterialFlag': 0,
                                            'TextureFlag': 0,
                                            'SemColorFlag': 0,
                                            'Color': {
                                                'R': 0.501960813999176,
                                                'G': 0.501960813999176,
                                                'B': 0.501960813999176,
                                                'A': 1
                                            },
                                            'Material': {
                                                'AmbientColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'DiffuseColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'SpecularColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'EmissiveColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 1
                                                },
                                                'Shininess': 0
                                            },
                                            'Transparent': 0,
                                            'Smooth': 0,
                                            'Texture': {
                                                'Type': 0,
                                                'Code': '0',
                                                'Key': 0,
                                                'Level': 0
                                            },
                                            'FlagMeasure': 10,
                                            'TransparentTex': 0,
                                            'SmoothTex': 0,
                                            'WrapTex': 0,
                                            'PaintFlag': PAINT_FLAG.BOTH,
                                            'WrapValue': [
                                                {
                                                    'Type': 0,
                                                    'Value': 10,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }, {
                                                    'Type': 0,
                                                    'Value': 10,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'TransformFlag': 0,
                                            'Count': 0,
                                            'ELEMENTLIST': []
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            'Key': 'PolygonFree',
            'Level': 0,
            'Distance': 0,
            'Code': -100000021,
            'Local': LOCALE.Plane,
            'LayerId': Object3dCreator.defaultLayerId,
            'ClassifierName': 'PolygonFree',
            'F3DTREE': {
                'Ident': 1943892958,
                'MaxIdent': 1,
                'Count': 1,
                'FUNCTIONLIST': [
                    {
                        'Number': FUNCTION3D_TYPE.F3D_HORIZONT,
                        'Ident': 1,
                        'FUNCTIONPARAMS': {
                            'Height': {
                                'Type': 0, // <0 только для RelativeHeight
                                'Value': 0,
                                'Factor': 1,//(для type!=0) коэффициент смещения (умножается на Value)
                                'Offset': 0 //(для type!=0) смещение (постоянная часть)
                            },
                            'RelativeHeight': {
                                'Type': 0,
                                'Value': 0,
                                'Factor': 1,
                                'Offset': 0
                            },
                            'Count': 1,
                            'NODELIST': [
                                {
                                    'TransformFlag': 0,
                                    'Size': [
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        },
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        },
                                        {
                                            'Type': 0,
                                            'Value': 0,
                                            'Factor': 0,
                                            'Offset': 0
                                        }
                                    ],
                                    'Count': 1,
                                    'DESCRIPTIONLIST': [
                                        {
                                            'ColorFlag': 1,
                                            'MaterialFlag': 0,
                                            'TextureFlag': 0,
                                            'SemColorFlag': 0,
                                            'Color': {
                                                'R': 0.572549045085907,
                                                'G': 0.5137255191802979,
                                                'B': 0.45490196347236633,
                                                'A': 0.800000011920929
                                            },
                                            'Material': {
                                                'AmbientColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'DiffuseColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'SpecularColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'EmissiveColor': {
                                                    'R': 0,
                                                    'G': 0,
                                                    'B': 0,
                                                    'A': 0.800000011920929
                                                },
                                                'Shininess': 0
                                            },
                                            'Transparent': 1,
                                            'Smooth': 0,
                                            'Texture': {
                                                'Type': 0,
                                                'Code': '0',
                                                'Key': 0,
                                                'Level': 0
                                            },
                                            'FlagMeasure': 10,
                                            'TransparentTex': 0,
                                            'SmoothTex': 0,
                                            'WrapTex': 0,
                                            'PaintFlag': PAINT_FLAG.BOTH,
                                            'WrapValue': [
                                                {
                                                    'Type': 0,
                                                    'Value': 1,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                },
                                                {
                                                    'Type': 0,
                                                    'Value': 1,
                                                    'Factor': 0,
                                                    'Offset': 0
                                                }
                                            ],
                                            'TransformFlag': 0,
                                            'Count': 0,
                                            'ELEMENTLIST': [] as []
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ],
    TextureArray: []
};
