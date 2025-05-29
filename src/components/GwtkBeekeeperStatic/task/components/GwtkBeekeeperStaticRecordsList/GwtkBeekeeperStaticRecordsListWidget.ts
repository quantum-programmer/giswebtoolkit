/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Компонент "Список записов постоянных пасек"           *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {
    GwtkBeekeeperStaticTaskState,
    SELECT_DB_RECORD, SELECT_DB_RECORD_AND_OPEN_EDIT_PANEL
} from '@/components/GwtkBeekeeperStatic/task/GwtkBeekeeperStaticTask';
import { BeekeepersRequestResult } from '@/components/GwtkBeekeeper/task/GwtkBeekeeperTask';
import GwtkBeekeeperStaticRecordItem
    from '@/components/GwtkBeekeeperStatic/task/components/GwtkBeekeeperStaticRecordsList/GwtkBeekeeperStaticRecordItem/GwtkBeekeeperStaticRecordItem.vue';


/**
 * Компонент "Список записов постоянных пасек"
 * @class GwtkBeekeeperStaticRecordsListWidget
 * @extends BaseGwtkVueComponent
 */
@Component( {
    components: {
        GwtkBeekeeperStaticRecordItem
    }
} )
export default class GwtkBeekeeperStaticRecordsListWidget extends BaseGwtkVueComponent {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkBeekeeperStaticTaskState>( key: K, value: GwtkBeekeeperStaticTaskState[K]) => void;

    @Prop( { default: () => ([]) } )
    private readonly recordsList!: BeekeepersRequestResult[][];

    @Prop( { default: () => ([]) } )
    private readonly selectedObjectFromDb!: string[];

    @Prop( { default: false } )
    private readonly updateOverlay!: boolean;


    /**
     * Выбран ли запись
     * @method isSelected
     * @param record {BeekeepersRequestResult[]} - Запись из БД
     */
    isSelected( record: BeekeepersRequestResult[] ) {
        let recordId: string | undefined = this.getRecordId(record);

        if ( recordId && recordId !== '' ) {
            const index = this.selectedObjectFromDb.indexOf( recordId );
            if ( index !== -1 ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Получить идентификатор записии
     * @method getRecordId
     * @param record record {BeekeepersRequestResult[]} - Запись из БД
     */
    getRecordId( record: BeekeepersRequestResult[] ) {
        let recordId: string | undefined = undefined;

        record.forEach( (item: BeekeepersRequestResult) => {
            if ( item.key === 'id_apiary' ) {
                recordId = item.value as string;
            }
        });

        return recordId;
    }

    /**
     * Выбрать запись и показать на каарте
     * @method selectRecordAndShowInMap
     * @param record record {BeekeepersRequestResult[]} - Запись из БД
     */
    selectRecordAndShowInMap( record: BeekeepersRequestResult[] ) {
        this.setState( SELECT_DB_RECORD, record );
    }

    /**
     * Открыть форму для редактирования выбраного записа
     * @method openEditForm
     * @param record record {BeekeepersRequestResult[]} - Запись из БД
     */
    openEditForm( record: BeekeepersRequestResult[] ) {
        this.setState( SELECT_DB_RECORD_AND_OPEN_EDIT_PANEL, record );
    }
}
