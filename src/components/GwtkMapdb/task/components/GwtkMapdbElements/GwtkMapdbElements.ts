/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент "Список элементов"                   *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    CLICK_ON_MARKER,
    CLICK_ON_OBJECT,
    CREATE_ONLY_FIELD_LIST,
    GwtkMapdbkState,
    ON_CLICK_SHOW_INFO,
    SHOW_INFO,
    LOAD_MORE
} from '@/components/GwtkMapdb/task/GwtkMapdbTask';
import { SimpleJson } from '~/types/CommonTypes';
import Utils from '~/services/Utils';

/**
 * Компонент "Список элементов"
 * @class GwtkMapdbElements
 * @extends Vue
 */
@Component
export default class GwtkMapdbElements extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapdbkState>( key: K, value: GwtkMapdbkState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly fieldsList!: { key: string };

    @Prop( { default: () => ({}) } )
    private readonly selectedMarkerItem!: { key: string };

    @Prop( { default: () => ([]) } )
    private readonly showElements!: SimpleJson[];

    @Prop( { default: () => ([]) } )
    private readonly totalRecords!: { key: string }[];

    @Prop( { default: () => ([]) } )
    private readonly selectedItem!: { key: string }[];

    @Prop( { default: () => ([]) } )
    private readonly onlyFieldList!: { field: string | number }[];

    @Prop( { default: () => ([]) } )
    private readonly selectedItemsId!: number[];

    @Prop( { default: false } )
    private readonly showInfo!: boolean;

    @Prop( { default: () => ([]) } )
    private readonly objectInfo!: { field: string | number }[];

    @Prop( { default: false } )
    private readonly fields!: boolean;

    private resizeObserver: ResizeObserver | null = null;

    private height: number = 0;

    mounted() {
        const table = (this.$refs.table as HTMLDivElement);

        // без throttle ошибка при быстром изменении размера окна
        const heightUpdate5 = Utils.throttle(() => {
            this.height = this.heightUpdate();
        }, 5);

        this.resizeObserver = new ResizeObserver(heightUpdate5);
        this.resizeObserver.observe(table);
    }

    beforeDestroy() {
        this.resizeObserver?.disconnect();
    }

    private addClass( element: { id: number } ): boolean {
        return this.selectedItemsId.indexOf( element.id - 1 ) !== -1;
    }

    private outlinedMarker( element: object ): boolean {
        return element == this.selectedMarkerItem;
    }

    private onClickShowInfoWidget( elementId: number ): void {
        this.setState( ON_CLICK_SHOW_INFO, elementId );
        this.setState( SHOW_INFO, true );
    }

    private clickOnObjectWidget( elementId: number ): void {
        this.setState( CLICK_ON_OBJECT, elementId );
    }

    private clickOnMarkerWidget( elementId: { key: string; } ): void {
        this.setState( CLICK_ON_MARKER, { marker: true, elementId: [elementId] } );
    }

    private onlyField( value: { field: string | number }, field: string ): boolean {
        let result = true;

        if ( this.fields ) {
            result = this.onlyFieldList.findIndex( item => item.field === field ) !== -1;
            if ( !result && value ) {
                result = true;
                this.setState( CREATE_ONLY_FIELD_LIST, field );
            }
        }
        return result;
    }

    private checkBox(value: string) {
        let result = false;
        const check = this.objectInfo.findIndex( item => item.field === value ) !== -1;
        if (check) {
            result = true;
        }

        return result;
    }

    private loadMoreWidget(): void {
        this.setState( LOAD_MORE, null );
    }

    private heightUpdate () {
        let result = 230;
        if ( this.$refs.table ) {
            const clientHeight = (this.$refs.table as HTMLDivElement).getBoundingClientRect().height;
            result = clientHeight;
        }
        return result;
    }
}
