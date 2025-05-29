/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Виджет компонента                             *
 *                    "Журнал событий карты"                        *
 *                                                                  *
 *******************************************************************/

import {Component, Prop} from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {TaskDescription} from '~/taskmanager/TaskManager';
import {LogEventType} from '~/types/CommonTypes';
import i18n from '@/plugins/i18n';
import {
    CLEAR_PROTOCOL,
    FILTER_MAP_PROTOCOL,
    GwtkMapLogTaskState,
    DOWNLOAD_LOG_FILE,
    TypeEventMessage,
    UPDATE_PROTOCOL
} from '@/components/GwtkMapLog/task/GwtkMapLogTask';

/**
 * Виджет компонента
 * @class GwtkMapLogWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkMapLogWidget extends BaseGwtkVueComponent {
    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapLogTaskState>( key: K, value: GwtkMapLogTaskState[K] ) => void;

    @Prop( { default: 0 } )
    private readonly countAll!: number;

    @Prop( { default: 0 } )
    private readonly countInfo!: number;

    @Prop( { default: 0 } )
    private readonly countWarning!: number;

    @Prop( { default: 0 } )
    private readonly countError!: number;

    @Prop({ default: 0 })
    private readonly countDebug!: number;

    @Prop( { default: () => ([]) } )
    private readonly mapProtocolString!: TypeEventMessage[];

    private filteredType: LogEventType | null = null;

    private badgeOffsetY = -18;

    private get showInfo() {
        return this.filteredType === LogEventType.Info;
    }

    private get showError() {
        return this.filteredType === LogEventType.Error;
    }

    private get showWarning() {
        return this.filteredType === LogEventType.Warning;
    }

    get showDebug() {
        return this.filteredType === LogEventType.Debug;
    }

    private get showAll() {
        return this.filteredType === null;
    }


    private setInfoType() {
        this.filteredType = LogEventType.Info;
        this.setState( FILTER_MAP_PROTOCOL, this.filteredType );

    }

    private setErrorType() {
        this.filteredType = LogEventType.Error;
        this.setState( FILTER_MAP_PROTOCOL, this.filteredType );
    }

    private setWarningType() {
        this.filteredType = LogEventType.Warning;
        this.setState( FILTER_MAP_PROTOCOL, this.filteredType );
    }

    setDebugType() {
        this.filteredType = LogEventType.Debug;
        this.setState(FILTER_MAP_PROTOCOL, this.filteredType);
    }

    private resetTypeFilter() {
        this.filteredType = null;
        this.setState( FILTER_MAP_PROTOCOL, this.filteredType );
    }

    /**
     * Подсказка для кнопки Очистить
     * @property {string}
     */
    private get clearName() {
        return this.$t( 'phrases.Clear' );
    }

    /**
     * Иконка для строки
     * @param type {LogEventType} Тип сообщения
     * @return {string} Иконка
     */
    private imageListItem( type: LogEventType ) {
        let image = '';
        switch ( type ) {
            case LogEventType.Error:
                image = 'mdi-close-circle';
                break;
            case LogEventType.Info:
                image = 'mdi-information';
                break;
            case LogEventType.Warning:
                image = 'mdi-alert';
                break;
            case LogEventType.Debug:
                image = 'mdi-bug-outline';
                break;
        }
        return image;
    }

    /**
     * Очистить журнал
     * @method clearLog
     */
    private clearLog() {
        this.setState( CLEAR_PROTOCOL, undefined );
        this.resetTypeFilter();
    }

    /**
     * Загрузить файл ошибок
     */
    private get loadLogName() {
        return i18n.t( 'phrases.Download error file' );
    }

    /**
     * Скачать журнал
     * @method loadLog
     */
    private loadLog() {
        this.setState( DOWNLOAD_LOG_FILE, undefined );
    }

    created() {
        this.setState(UPDATE_PROTOCOL, this.filteredType);
    }
}
