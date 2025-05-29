/********************************************************************
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Класс журнала событий                        *
 *                                                                  *
 *******************************************************************/

import WorkspaceManager, { PROJECT_SETTINGS_PROTOCOL_MAP_EVENT } from '~/utils/WorkspaceManager';
import { LogEventType, LogMessage, LogRecord } from '~/types/CommonTypes';


export type MapEventLogParameters = {
    size?: number;
}

const MAX_SIZE = 100;

/**
 * Класс журнала событий
 * @class MapEventLog
 */
export default class MapEventLog {

    private readonly protocol: LogRecord[] = [];                 // массив записей

    private readonly maxProtocolSize;                                   // максимальный размер массива

    /**
     * @constructor MapEventLog
     * @param workspaceManager {WorkspaceManager} Экземпляр класса управления пользовательскими
     * настройками и текущим состоянием карты
     * @param [options] {MapEventLogParameters} Параметры журнала событий
     */
    constructor( private readonly workspaceManager: WorkspaceManager, options?: MapEventLogParameters ) {

        this.maxProtocolSize = MAX_SIZE;

        if ( options ) {
            if ( options.size !== undefined ) {
                this.maxProtocolSize = options.size;
            }
        }

        const protocolMessages = this.workspaceManager.getValue( PROJECT_SETTINGS_PROTOCOL_MAP_EVENT );
        for ( let messageIndex = 0; messageIndex < protocolMessages.length; messageIndex++ ) {
            this.protocol.push( protocolMessages[ messageIndex ] );
        }
    }

    /**
     * Добавить запись события
     * @method addMessage
     * @param param {LogMessage} параметры сообщения, JSON
     */
    addMessage( param: LogMessage ) {
        if ( param.text !== undefined ) {

            if ( this.protocol.length >= this.maxProtocolSize ) {
                this.protocol.pop();
            }

            const currDate = new Date();

            let typeEvent = LogEventType.Info;
            if ( param.type !== undefined ) {
                typeEvent = param.type;
            } else { //legacy
                if ( param.icon ) {
                    switch ( param.icon ) {
                        case 'debug':
                            typeEvent = LogEventType.Debug;
                            break;
                        case 'error':
                            typeEvent = LogEventType.Error;
                            break;
                        case 'warning':
                            typeEvent = LogEventType.Warning;
                            break;
                        default:
                            typeEvent = LogEventType.Info;
                    }
                }
            }

            const protocolItem = {
                time: currDate.valueOf(),
                text: param.text,
                type: typeEvent,
                description: param.description,
                stack: param.stack
            };

            this.protocol.unshift( protocolItem );
        }
        this.saveProtocol();
    }

    /**
     * Получить сообщения журнала
     * @method getMessages
     * @return {LogRecord[]} Массив сообщений
     */
    getMessages() {
        return this.protocol;
    }

    /**
     * Удалить все сообщения
     * @method clear
     */
    clear() {
        this.protocol.splice( 0 );
        this.saveProtocol();
    }

    /**
     * Сохранить протокол
     * @private
     * @method saveProtocol
     */
    private saveProtocol() {
        this.workspaceManager.setValue( PROJECT_SETTINGS_PROTOCOL_MAP_EVENT, this.protocol );
    }
}
