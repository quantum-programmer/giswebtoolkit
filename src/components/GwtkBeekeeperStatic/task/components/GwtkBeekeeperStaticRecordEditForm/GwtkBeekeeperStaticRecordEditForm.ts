/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *         Компонент "Форма редактирования постоянных пасек"        *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {
    CLOSE_EDIT_RECORD_FORM, EDIT_RECORD,
    GwtkBeekeeperStaticTaskState,
    UPDATE_SELECTED_RECORD_FIELD_VALUE
} from '@/components/GwtkBeekeeperStatic/task/GwtkBeekeeperStaticTask';
import { BeekeepersRequestResult } from '@/components/GwtkBeekeeper/task/GwtkBeekeeperTask';


/**
 * Компонент "Форма редактирования постоянных пасек"
 * @class GwtkBeekeeperStaticRecordEditForm
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkBeekeeperStaticRecordEditForm extends BaseGwtkVueComponent {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkBeekeeperStaticTaskState>( key: K, value: GwtkBeekeeperStaticTaskState[K]) => void;

    @Prop( { default: () => ([]) } )
    private readonly record!: BeekeepersRequestResult[] | null;

    @Prop( { default: false } )
    private readonly showSaveOverlay!: boolean;


    getRecordFieldValue( fieldName: string ) {
        let value: string = '';

        if ( this.record && this.record.length > 0 ) {
            this.record.forEach( (recordItem: BeekeepersRequestResult) => {
                if ( recordItem.key === fieldName ) {
                    value = recordItem.value as string;
                }
            });
        }

        return value;
    }

    setValue( fieldName: string, fieldValue: string) {
        this.setState( UPDATE_SELECTED_RECORD_FIELD_VALUE, { key: fieldName, value: fieldValue } );
    }

    save() {
        this.setState( EDIT_RECORD, true );
    }

    close() {
        this.setState( CLOSE_EDIT_RECORD_FORM, true );
    }

}
