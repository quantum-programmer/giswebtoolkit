/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                           Код потока                             *
 *                                                                  *
 *******************************************************************/
import { AnyQueueObject, MessageQueueCommand, MessageState } from '~/3d/engine/worker/workerscripts/queue';
import { MessageData } from '~/3d/engine/worker/queues/basequeue';
import { MessageParams } from '~/3d/engine/worker/queues/messagequeue';
import { SimpleJson } from '~/types/CommonTypes';
import DoubleLinkedList from '../../utils/doublelinkedlist';
import {
    HeightsCreator,
    HeightsCreatorParams,
    HeightsLoader,
    HeightsLoaderParams,
    HeightsPreLoader,
    HeightsPreLoaderParams,
    ImageLoader,
    Scenario3DRequest,
    Scenario3DRequestParams,
    ServiceObjectsCreator,
    ServiceObjectsCreatorParams,
    Tiles3dLoader,
    Tiles3dLoaderParams,
    Tiles3dMaterialsLoader,
    Tiles3dMaterialsLoaderParams,
    Tiles3dMetadata,
    Tiles3dTexturesLoader,
    Tiles3dTexturesLoaderParams,
    TrackScenario3DRequest,
    TrackScenario3DRequestParams,
    UntiledObjectsCreator,
    UntiledObjectsCreatorParams,
    WFSLoader,
    WFSLoaderParams
} from '~/3d/engine/worker/workerscripts/commandExecutors';
import Object3dCreator, {
    Object3dCreatorSetupByClassifierParams,
    Object3dCreatorSetupParams
} from '~/3d/engine/worker/workerscripts/object3dcreator';
import RequestServices, { ServiceType } from '~/services/RequestServices';

/**
 * Класс потока
 * @class WorkerMethods
 * @param ctx {DedicatedWorkerGlobalScope} Контекст потока
 */
class WorkerMethods {

    ctx: DedicatedWorkerGlobalScope;
    mQueue: DoubleLinkedList<AnyQueueObject>;
    requestQueue: SimpleJson<SimpleJson<AnyQueueObject[]>> = {};
    mFrameRequests: AnyQueueObject[] = [];
    mResponseList: AnyQueueObject['responseData'][] = [];
    mResponseBuffersList: ArrayBufferLike[] = [];
    activeRequestCountList: SimpleJson<number> = {};

    MAX_STEPS_BY_FRAME = 10;

    constructor( ctx: DedicatedWorkerGlobalScope ) {
        this.ctx = ctx;
        this.ctx.onmessage = ( ev: MessageEvent ) => this.onmessage( ev );
        this.mQueue = new DoubleLinkedList<AnyQueueObject>();
    }

    /**
     * Инициализация потока
     * @method init
     * @param messageData {object} Данные сообщения
     */
    init( messageData: MessageData<MessageParams> ) {
        this.ctx.setInterval( this.updateQueue.bind( this ), 3 );
    }

    /**
     * Очистить очереди потока
     * @method resetWorker
     */
    resetWorker() {
        Object3dCreator.clear();
        this.mQueue.clear();
        this.requestQueue = {};
        this.mFrameRequests.length = 0;
        this.mResponseList.length = 0;
        this.mResponseBuffersList.length = 0;
        this.activeRequestCountList = {};
    }

    /**
     * Сформировать очередь запросов
     * @method formRequestQueue
     * @param mQueue {DoubleLinkedList<AnyQueueObject>} Очередь сообщений
     */
    formRequestQueue( mQueue: DoubleLinkedList<AnyQueueObject> ) {

        let curNode = mQueue.getHead();

        while ( curNode ) {
            const messageObject = curNode.getData();
            if ( messageObject.state === MessageState.stopped ) {

                const serviceUrl = messageObject.params.serviceUrl || 'default';

                if ( !this.requestQueue[ serviceUrl ] ) {
                    this.requestQueue[ serviceUrl ] = {};
                    this.activeRequestCountList[ serviceUrl ] = 0;
                }
                const serverQueue = this.requestQueue[ serviceUrl ];

                const priority = messageObject.priority;
                let priorityQueue = serverQueue[ priority ];
                if ( priorityQueue === undefined ) {
                    priorityQueue = serverQueue[ priority ] = [];
                }
                priorityQueue.push( messageObject );
            }
            curNode = curNode.getNext();
        }

        for ( const server in this.requestQueue ) {
            const serverQueue = this.requestQueue[ server ];
            let counter = this.MAX_STEPS_BY_FRAME - this.activeRequestCountList[ server ];
            for ( const level in serverQueue ) {
                const levelQueue = serverQueue[ level ];
                if ( levelQueue.length > 0 ) {
                    while ( levelQueue.length > 0 && counter > 0 ) {
                        const queueObject = levelQueue.pop()!;
                        this.mFrameRequests.push( queueObject );
                        counter--;
                    }
                    levelQueue.length = 0;
                }
            }
        }
    }

    /**
     * Обновить настройки
     * @method updateSettings
     * @param messageData {object} Данные сообщения
     */
    updateSettings( messageData: MessageData<MessageParams> ) {
        RequestServices.createNew( messageData.messageParams.httpParams!, ServiceType.REST, true );

    }

    /**
     * Обновить состояние очередей потока
     * @method updateQueue
     */
    updateQueue() {
        let curNode = this.mQueue.getHead();

        while ( curNode ) {
            const messageObject = curNode.getData();
            if ( messageObject.state === MessageState.done ) {
                this.mResponseList.push( messageObject.responseData );

                if ( Array.isArray( messageObject.responseBufferList ) ) {
                    for ( let i = 0; i < messageObject.responseBufferList.length; i++ ) {
                        this.mResponseBuffersList.push( messageObject.responseBufferList[ i ] );
                    }
                }
                messageObject.state = MessageState.sent;

            } else if ( messageObject.state === MessageState.reSend ) {
                messageObject.state = MessageState.stopped;
            } else if ( messageObject.state === MessageState.received ) {
                messageObject.runPostReceive();
                if ( messageObject.activeRequest ) {
                    const server = messageObject.params.serviceUrl || 'default';
                    this.activeRequestCountList[ server ]--;
                    messageObject.activeRequest = false;
                }
            }
            curNode = curNode.getNext();
        }

        if ( this.mResponseList.length > 0 ) {
            this.ctx.postMessage( this.mResponseList, this.mResponseBuffersList );
            // postMessage(mResponseList);
            // for ( let i = 0; i < this.mResponseList.length; i++ ) {
            //     const responseData=this.mResponseList[ i ];
            //     if(responseData&&responseData.objectMeshList) {
            //         responseData.objectMeshList = [];
            //     }
            // }
            this.mResponseList.length = 0;
            if ( this.mResponseBuffersList.length > 0 ) {
                this.mResponseBuffersList.length = 0;
            }
        }


        this.formRequestQueue( this.mQueue );
        if ( this.mFrameRequests.length > 0 ) {
            for ( let i = 0; i < this.mFrameRequests.length; i++ ) {
                const request = this.mFrameRequests[ i ];
                request.runProcess();
                if ( request.state === MessageState.inProcess ) {
                    request.activeRequest = true;
                    const server = request.params.serviceUrl || 'default';
                    this.activeRequestCountList[ server ]++;
                }
            }
            this.mFrameRequests.length = 0;
        }
    }

    /**
     * Удалить сообщение из очереди
     * @method deleteFromQueue
     * @param messageData {object} Данные сообщения
     */
    deleteFromQueue( messageData: MessageData<MessageParams> ) {
        const toBeDeleted = messageData;
        let curNode = this.mQueue.getHead();
        while ( curNode ) {
            const messageObject = curNode.getData();
            if ( messageObject.id === toBeDeleted.id ) {
                if ( messageObject.mAbortMethod ) {
                    messageObject.mAbortMethod( 'AbortRequest' );
                }
                if ( messageObject.activeRequest ) {
                    const server = messageObject.params.serviceUrl || 'default';
                    this.activeRequestCountList[ server ]--;
                    messageObject.activeRequest = false;
                }
                this.mQueue.deleteNode( curNode );
                break;
            }
            curNode = curNode.getNext();
        }
    }

    /**
     * Обновить актуальность сообщения в очереди потока
     * @method checkExistence
     * @param messageData {object} Данные сообщения
     */
    checkExistence( messageData: MessageData<MessageParams> ) {
        let result = false;
        let curNode = this.mQueue.getHead();
        while ( !result && curNode !== null ) {
            const curData = curNode.getData();

            if ( curData.id === messageData.id && curData.command === messageData.messageParams.command ) {
                result = true;
            }
            curNode = curNode.getNext();
        }
        return result;
    }

    /**
     * Обработчик приема сообщений основного потока
     * @method onmessage
     * @param ev {MessageEvent} Событие
     */
    onmessage( ev: MessageEvent ) {

        const messages = ev.data as MessageData<MessageParams>[];
        for ( let j = 0; j < messages.length; j++ ) {
            const messageData = messages[ j ];
            if ( messageData.messageParams.command === MessageQueueCommand.setup ) {
                this.init( messageData );
                continue;
            }
            if ( messageData.messageParams.command === MessageQueueCommand.reset ) {
                this.resetWorker();
                break;
            }

            if ( this.checkExistence( messageData ) ) {
                continue;
            }

            switch ( messageData.messageParams.command ) {

                case MessageQueueCommand.received:
                    this.deleteFromQueue( messageData );
                    break;
                case MessageQueueCommand.deleteFromQueue:
                    this.deleteFromQueue( messageData );
                    break;
                case MessageQueueCommand.loadImage:
                    this.mQueue.push( new ImageLoader( messageData as MessageData<MessageParams & { serviceUrl: string; url: string; }> ) );
                    break;
                case MessageQueueCommand.loadHeight:
                    // if ( messageData.messageParams.serviceUrl !== undefined && messageData.messageParams.options !== undefined ) {
                    this.mQueue.push( new HeightsLoader( messageData as MessageData<MessageParams & HeightsLoaderParams> ) );
                    // }
                    break;
                case MessageQueueCommand.setupParser3dTiles:
                    this.mQueue.push( new Tiles3dMetadata( messageData as MessageData<MessageParams & { src: string; layerId: string; }> ) );
                    break;
                case MessageQueueCommand.load3dTile:
                    this.mQueue.push( new Tiles3dLoader( messageData as MessageData<MessageParams & Tiles3dLoaderParams> ) );
                    break;
                case MessageQueueCommand.load3dTileTexture:
                    this.mQueue.push( new Tiles3dTexturesLoader( messageData as MessageData<MessageParams & Tiles3dTexturesLoaderParams> ) );
                    break;
                case MessageQueueCommand.load3dTileMaterial:
                    this.mQueue.push( new Tiles3dMaterialsLoader( messageData as MessageData<MessageParams & Tiles3dMaterialsLoaderParams> ) );
                    break;
                case MessageQueueCommand.loadWFS:
                    this.mQueue.push( new WFSLoader( messageData as MessageData<MessageParams & WFSLoaderParams> ) );
                    break;
                case MessageQueueCommand.setupParser3d:
                    Object3dCreator.setup( messageData as MessageData<MessageParams & Object3dCreatorSetupParams>, this.mQueue );
                    break;
                case MessageQueueCommand.loadParserTextures3d:
                    Object3dCreator.loadTextures( messageData as MessageData<MessageParams & Object3dCreatorSetupParams>, this.mQueue );
                    break;
                case MessageQueueCommand.setupParser3dByClassifier:
                    Object3dCreator.setup3dByClassifier( messageData as MessageData<MessageParams & Object3dCreatorSetupByClassifierParams>, this.mQueue );
                    break;
                case MessageQueueCommand.createServiceObject:
                    this.mQueue.push( new ServiceObjectsCreator( messageData as MessageData<MessageParams & ServiceObjectsCreatorParams> ) );
                    break;
                case MessageQueueCommand.loadHeightTileHeaders:
                    this.mQueue.push( new HeightsPreLoader( messageData as MessageData<MessageParams & HeightsPreLoaderParams> ) );
                    break;
                case MessageQueueCommand.createHeightTile:
                    this.mQueue.push( new HeightsCreator( messageData as MessageData<MessageParams & HeightsCreatorParams> ) );
                    break;
                case MessageQueueCommand.updateSettings:
                    this.updateSettings( messageData );
                    break;
                case MessageQueueCommand.createUntiledObject: // TODO: untiled
                    this.mQueue.push( new UntiledObjectsCreator( messageData as MessageData<MessageParams & UntiledObjectsCreatorParams> ) );
                    break;
                case MessageQueueCommand.getScenarioParam:
                    this.mQueue.push( new Scenario3DRequest( messageData as MessageData<MessageParams & Scenario3DRequestParams> ) );
                    break;
                case MessageQueueCommand.getTrackForScenario:
                    this.mQueue.push( new TrackScenario3DRequest( messageData as MessageData<MessageParams & TrackScenario3DRequestParams> ) );
                    break;
            }
        }
    }
}

export default WorkerMethods;
