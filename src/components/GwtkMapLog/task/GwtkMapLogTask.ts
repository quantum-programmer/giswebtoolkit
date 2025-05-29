/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент  Журнал событий карты                 *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkMapLogWidget from '@/components/GwtkMapLog/task/GwtkMapLogWidget.vue';
import { LogEventType, LogRecord } from '~/types/CommonTypes';
import { BrowserService } from '~/services/BrowserService';

export const DOWNLOAD_LOG_FILE = 'gwtkmaplog.loadlogfile';
export const FILTER_MAP_PROTOCOL = 'gwtkMaplog.filtermapprotocol';
export const CLEAR_PROTOCOL = 'gwtlMapLog.clearprotocol';
export const UPDATE_PROTOCOL = 'gwtlMapLog.updateprotocol';

export type TypeEventMessage = { time: string, text: string; type: LogEventType; description?: string };

export type GwtkMapLogTaskState = {
    [ DOWNLOAD_LOG_FILE ]: undefined;
    [ FILTER_MAP_PROTOCOL ]: LogEventType | null;
    [ CLEAR_PROTOCOL ]: undefined;
    [ UPDATE_PROTOCOL ]:  LogEventType | null;
}

type WidgetParams = {
    setState: GwtkMapLogTask['setState'];
    mapProtocolString: TypeEventMessage[];
    countAll: number;
    countInfo: number;
    countWarning: number;
    countError: number;
    countDebug: number;
}


/**
 * Компонент "Журнал событий карты"
 * @class GwtkMapLogTask
 * @extends Task
 * @description
 */
export default class GwtkMapLogTask extends Task {
    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private readonly mapProtocol: LogRecord[] = this.map.readProtocolMessages();

    /**
     * @constructor GwtkMapLogTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        this.widgetProps = {
            taskId: this.id,
            setState: this.setState.bind( this ),
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            mapProtocolString: this.mapProtocolStringFilter( null ),
            countAll: this.mapProtocol.length,
            countInfo: this.getCount( LogEventType.Info ),
            countWarning: this.getCount( LogEventType.Warning ),
            countError: this.getCount( LogEventType.Error ),
            countDebug: this.getCount(LogEventType.Debug)
        };
    }

    /**
     * регистрация Vue компонента
     */
    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkMapLogWidget';
        const sourceWidget = GwtkMapLogWidget;
        this.mapWindow.registerComponent( nameWidget, sourceWidget );

        // Создание Vue компонента
        this.mapWindow.createWidget( nameWidget, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    /**
     *
     * @param key
     * @param value
     */
    setState<K extends keyof GwtkMapLogTaskState>( key: K, value: GwtkMapLogTaskState[ K ] ) {
        switch ( key ) {
            case DOWNLOAD_LOG_FILE:
                this.downloadLogFile();
                break;
            case FILTER_MAP_PROTOCOL:
                this.widgetProps.mapProtocolString = this.mapProtocolStringFilter( value as LogEventType );
                break;
            case CLEAR_PROTOCOL:
                this.map.clearProtocol();
                this.widgetProps.countAll = this.mapProtocol.length;
                this.widgetProps.countInfo = this.getCount( LogEventType.Info );
                this.widgetProps.countWarning = this.getCount( LogEventType.Warning );
                this.widgetProps.countError = this.getCount( LogEventType.Error );
                this.widgetProps.countDebug = this.getCount(LogEventType.Debug);
                break;
            case UPDATE_PROTOCOL:
                this.widgetProps.mapProtocolString = this.mapProtocolStringFilter(value as LogEventType);
                this.widgetProps.countAll = this.mapProtocol.length;
                this.widgetProps.countInfo = this.getCount( LogEventType.Info );
                this.widgetProps.countWarning = this.getCount( LogEventType.Warning );
                this.widgetProps.countError = this.getCount( LogEventType.Error );
                this.widgetProps.countDebug = this.getCount(LogEventType.Debug);
                break;
        }
    }

    /**
     * Отфильтрованный список журнала
     * @private
     * @method mapProtocolStringFilter
     * @param filteredType {LogEventType| null} тип фильтра
     * @return {TypeEventMessage[]} массив записей журнала
     */
    private mapProtocolStringFilter( filteredType: LogEventType | null ) {
        const protocolString: TypeEventMessage[] = [];

        for ( let numberProtocol = 0; numberProtocol < this.mapProtocol.length; numberProtocol++ ) {
            const protocolRecord = this.mapProtocol[ numberProtocol ];
            if ( filteredType ) {
                if ( protocolRecord.type !== filteredType ) {
                    continue;
                }
            }
            protocolString.push( {
                time: `${new Date( protocolRecord.time ).toLocaleDateString()} ${new Date( protocolRecord.time ).toLocaleTimeString()}`,
                text: protocolRecord.text,
                type: protocolRecord.type,
                description: protocolRecord.description || undefined
            } );
        }

        return protocolString;
    }

    /**
     * Сформировать записи журнала для загрузки
     * @private
     * @method createLoadLog
     * @return {string} текст для файла
     */
    private createLoadLog() {
        // TODO: берём все записи или отфильтрованные?
        let resultString = '';

        for (let numberRecord = 0; numberRecord < this.mapProtocol.length; numberRecord++) {
            const record = this.mapProtocol[numberRecord];
            let prependText = '    ';
            switch (record.type) {
                case LogEventType.Error:
                    prependText = '>>>>';
                    break;
                case LogEventType.Warning:
                    prependText = '--->';
                    break;
            }
            const description = record.description || ' ';
            const date = `${new Date( record.time ).toLocaleDateString()} ${new Date( record.time ).toLocaleTimeString()}`;

            let typeText = record.type.toString();

            while (typeText.length < 7) {
                typeText += ' ';
            }

            const string = `\r\n${prependText}\t${date}\t${typeText}\t${record.text||''}\t${description||''}\t${record.stack||''}`;

            resultString = resultString.concat( string );
        }
        return resultString;
    }

    /**
     * Скачать журнал ошибок в log файл
     * @private
     * @method downloadLogFile
     */
    private downloadLogFile() {
        const logFileRecords = this.createLoadLog();
        const blob = new Blob( ['\ufeff', logFileRecords], { type: 'text/plain' } );
        try {
            BrowserService.downloadContent(blob, 'serverLog.log');
        } catch (error) {
            this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
        }
    }

    /**
     * Количество записей указанного типа
     * @private
     * @param type {LogEventType}
     * @method getCount
     * @return {number}
     */
    private getCount( type: LogEventType ) {
        let count = 0;
        this.mapProtocol.forEach( protocolRecord => {
            if ( protocolRecord.type === type ) {
                count++;
            }
        } );
        return count;
    }

}
