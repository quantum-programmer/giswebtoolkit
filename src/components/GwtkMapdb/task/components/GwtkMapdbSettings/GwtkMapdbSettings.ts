/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Компонент "Настройки"                      *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkMapdbkState,
    ON_CHECKBOX,
    SELECT_ALL,
} from '@/components/GwtkMapdb/task/GwtkMapdbTask';
import Utils from '~/services/Utils';

/**
 * Компонент "Описание объекта карты"
 * @class GwtkMapdbSettings
 * @extends Vue
 */
@Component
export default class GwtkMapdbSettings extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapdbkState>( key: K, value: GwtkMapdbkState[K] ) => void;

    @Prop( { default: () => ({}) } )
    readonly fieldsList!: { field: string[] }[];

    @Prop( { default: () => ([]) } )
    private readonly selectedFastSearchFilter!: { field: string[] }[];

    @Prop( { default: () => ({}) } )
    private onClickBack!: ( data: string ) => void;

    @Prop( { default: '' } )
    private readonly name!: string;


    private getChecked( element: { field: string[] } ): boolean {
        let result = false;
        if ( this.name === 'showSettings' || this.name === 'showInfoSettings' ) {
            result = this.selectedFastSearchFilter.indexOf( element ) !== -1;
        }
        return result;
    }

    private getCheckedAll(): boolean {
        return this.selectedFastSearchFilter.length === this.fieldsList.length;
    }

    private onCheckboxWidget( field: { field: string[] } ): void {
        this.setState( ON_CHECKBOX, { field: field, name: this.name } );
    }

    private onSelectAll(): void {
        this.setState( SELECT_ALL, this.name );
    }
}
