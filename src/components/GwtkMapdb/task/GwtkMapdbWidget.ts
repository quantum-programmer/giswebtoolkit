/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Виджет компонента                             *
 *               "Построение тепловой карты"                        *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkMapdbkState,
    ON_SELECT_LAYER,
    ON_SELECT_DATABASE,
    ON_INPUT_FAST_SEARCH,
    FAST_SEARCH,
    ON_CHECKBOX,
    ON_SELECT_OPERATION_TYPE,
    ON_INPUT_VALUE_1,
    ON_INPUT_VALUE_2,
    ON_CLICK_SEARCH_BUTTON,
    CLOSE_MAP_OBJECT,
    ON_SELECT_RECORD_ON_PAGE,
    ON_SELECT_ADVANCES_SEARCH_FIELD,
    ON_CLICK_DELETE_FIELD,
    ON_CLICK_MAP_SEARCH,
    ON_CLICK_SEARCH_MAP_OBJECTS,
    CLICK_CANCEL_OBJECT,
    CLICK_SELECT_OBJECT,
    SHOW_INFO,
    SELECT_ALL,
    ONLY_FIELD,
    OnClickDeleteField,
    LOAD_MORE,
} from '@/components/GwtkMapdb/task/GwtkMapdbTask';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import GwtkMapdbElements from '@/components/GwtkMapdb/task/components/GwtkMapdbElements/GwtkMapdbElements.vue';
import GwtkMapdbSettings from '@/components/GwtkMapdb/task/components/GwtkMapdbSettings/GwtkMapdbSettings.vue';

/**
 * Виджет компонента
 * @class GwtkMapdbWidget
 * @extends Vue
 */
@Component( { components: { GwtkMapdbElements, GwtkMapdbSettings } } )
export default class GwtkMapdbWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: '' } )
    private readonly selectedLayer!: string;

    @Prop( { default: '' } )
    private readonly selectedFastSearchFilter!: string;

    @Prop( { default: '' } )
    private readonly inputValueFastSearch!: string;

    @Prop( { default: '' } )
    private readonly selectedDatabase!: string;

    @Prop( { default: '' } )
    private readonly totalRecords!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapdbkState>( key: K, value: GwtkMapdbkState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly onSelectDatabase!: ( dbname: string ) => void;

    @Prop( { default: () => ({}) } )
    private readonly onClickArrow!: ( data: string ) => void;

    @Prop( { default: () => ([]) } )
    private readonly dataBaseIdList!: { alias: string }[];

    @Prop( { default: () => ([]) } )
    private readonly layerIdList!: { id: string; text: string }[];

    @Prop( { default: () => ([]) } )
    private readonly tableNameList!: { key: string }[];

    @Prop( { default: () => ([]) } )
    private readonly fieldsList!: { key: string }[];

    @Prop( { default: () => ([]) } )
    private readonly elementsList!: { key: string }[];

    @Prop( { default: () => ([]) } )
    private readonly objectInfo!: { key: string }[];

    @Prop( { default: () => ([]) } )
    private readonly newFieldsList!: { field: string }[];

    @Prop( { default: () => ([]) } )
    private readonly fieldListAdvancedSearch!: { field: string; operator: string; value1: string; value2: string }[];

    @Prop( { default: () => ([]) } )
    private readonly selectedOnMapObject!: { key: string }[];

    @Prop( { default: () => ([]) } )
    private readonly fieldListAdvancedSearchShow!: { key: string }[];

    @Prop( { default: () => ([]) } )
    private readonly showElements!: { key: string }[];

    @Prop( { default: () => ([]) } )
    private readonly newObjectInfo!: { field: string }[];

    @Prop( { default: [] } )
    readonly selectedItemsId!: { field: string }[];

    @Prop( { default: () => ({}) } )
    private readonly recordsOnPage!: { key: string };

    @Prop( { default: () => ({}) } )
    private readonly selectedMarkerItem!: { key: string };

    @Prop( { default: false } )
    private readonly onMapObjectSelected!: boolean;

    @Prop( { default: false } )
    private readonly onRequest!: boolean;

    @Prop( { default: false } )
    private readonly onSelectedDatabase!: boolean;

    @Prop( { default: false } )
    private readonly canSearchObject!: boolean;

    @Prop( { default: () => ([]) } )
    private readonly selectedItem!: { key: string }[];

    @Prop( { default: () => ([]) } )
    private readonly gmlIdList!: { key: string }[];

    @Prop( { default: () => ([]) } )
    private readonly canSearchObjectList!: { key: string }[];

    @Prop( { default: () => ([]) } )
    private readonly newFieldsListFast!: { key: string }[];

    @Prop( { default: () => ([]) } )
    private readonly selectedMapItemList!: { key: string }[];

    @Prop( { default: false } )
    private readonly showInfo!: boolean;

    @Prop( { default: false } )
    private readonly onlyField!: boolean;

    @Prop( { default: () => ([]) } )
    private readonly onlyFieldList!: { field: string | number }[];

    private MapdbName = '';
    private errorMessage = '';
    private showSettings = false;
    private disableSelect = true;
    private advancedSearch = false;
    private inputAdvancedSearchField = '';
    private showClearFastSearch = true;
    private selectChangeFastSearch = true;
    private selectedFastSearch = 'all';
    private selectShowInfo = this.onlyField;
    private selectedAdvancedSearchField = {};
    private canAddField = false;
    private showInfoSettings = false;
    private mapSearch = false;
    private showSearchSettings = false;

    created() {
        if ( this.dataBaseIdList.length > 0 ) {
            this.MapdbName = this.dataBaseIdList[ 0 ].alias;
        } else {
            this.errorMessage = this.$t( 'phrases.Dbm layers are not contained in the map' ).toString();
        }
        if ( this.tableNameList[ 0 ] ) {
            this.disableSelect = false;
        }
    }

    private onSelectLayerWidget( layer: string ): void {
        this.disableSelect = false;
        this.setState( ON_SELECT_LAYER, layer );
    }

    private onSelectDatabaseWidget( dbname: string ): void {
        this.setState( ON_SELECT_DATABASE, { dbname: dbname, reset: true } );
        this.selectedFastSearch = 'all';
        this.inputAdvancedSearchField = '';
        this.selectChangeFastSearch = true;
    }

    private onClickBack( data: string ): void {
        switch ( data ) {
            case 'selectedDatabase':
                this.mapSearch = false;
                this.setState( ON_CLICK_MAP_SEARCH, this.mapSearch );
                break;
            case 'showInfo':
                this.setState( SHOW_INFO, false );
                break;
            case 'showSettings':
                this.showSettings = false;
                break;
            case 'advancedSearch':
                this.advancedSearch = false;
                break;
            case 'onMapObjectSelected':
                this.setState( CLOSE_MAP_OBJECT, null );
                break;
            case 'showInfoSettings':
                this.showInfoSettings = false;
                break;
            case 'onClickShowSearchSettings':
                this.showSearchSettings = false;
                this.showInfoSettings = false;
                break;
        }
    }

    private onInputFastSearchWidget( value: string ): void {
        this.setState( ON_INPUT_FAST_SEARCH, value );
    }

    private fastSearchWidget(): void {
        this.setState( FAST_SEARCH, false );
    }

    private onAdvancedSearchWidget(): void {
        this.canAddField = false;
        this.advancedSearch = true;
    }

    private onSelectOperationTypeWidget( value: string, id: number ): void {
        this.setState( ON_SELECT_OPERATION_TYPE, { value, id } );
    }

    private onInputValue1Widget( value: string, id: string ): void {
        this.setState( ON_INPUT_VALUE_1, { value, id } );
    }

    private onInputValue2Widget( value: string, id: string ): void {
        this.setState( ON_INPUT_VALUE_2, { value, id } );
    }

    private onClickSearchButtonWidget(): void {
        this.setState( ON_CLICK_SEARCH_BUTTON, null );
        this.advancedSearch = false;
    }

    private onSelectRecordsOnPageWidget( records: string ): void {
        this.setState( ON_SELECT_RECORD_ON_PAGE, records );
    }

    private onSelectShowInfo( value: boolean ): void {
        this.selectShowInfo = value;
        this.setState( ONLY_FIELD, value );
    }

    private getShowInfo( element: string ): number | undefined {
        for ( let i = 0; i < this.newObjectInfo.length; i++ ) {
            if ( element[ 0 ] == this.newObjectInfo[ i ].field ) {
                if ( !this.selectShowInfo ) {
                    return 0;
                } else {
                    return 1;
                }
            }
        }
    }

    private selectAdvancedSearchFieldWidget( value: string ): void {
        this.canAddField = true;
        this.setState( ON_SELECT_ADVANCES_SEARCH_FIELD, value );
        this.canAddField = false;
        this.selectedAdvancedSearchField = '';
    }

    private onClickDeleteField( item: OnClickDeleteField ): void {
        this.setState( ON_CLICK_DELETE_FIELD, item );
    }

    private onClickShowInfoSettings(): void {
        this.showInfoSettings = true;
    }

    private activeSearchButton(): boolean {
        for ( let i = 0; i < this.fieldListAdvancedSearch.length; i++ ) {
            if ( this.fieldListAdvancedSearch[ i ].operator &&
                this.fieldListAdvancedSearch[ i ].value1 ) {
                if (
                    this.fieldListAdvancedSearch[ i ].operator != 'between' ||
                    (this.fieldListAdvancedSearch[ i ].value2 && this.fieldListAdvancedSearch[ i ].operator == 'between')
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    private onClickMapSearch(): void {
        this.setState( ON_CLICK_SEARCH_MAP_OBJECTS, null );
    }

    private clickCancelObject(): void {
        this.setState( CLICK_CANCEL_OBJECT, null );
    }

    private clickSelectObject(): void {
        this.setState( CLICK_SELECT_OBJECT, null );
    }

    private onClickShowSearchSettings(): void {
        this.showSearchSettings = true;
        this.showInfoSettings = true;
    }

    private onSelectFastSearch( field: { field: string } ): void {
        if ( field.field == 'All Fields' ) {
            this.setState( SELECT_ALL, 'showSettings' );
        } else {
            this.setState( ON_CHECKBOX, { field: field, name: 'showSettings' } );
        }
    }

    private clearSearchField() {
        this.setState( SELECT_ALL, 'showSettings' );
        this.setState( ON_INPUT_FAST_SEARCH, '' );
        this.setState( FAST_SEARCH, true );
    }

    private loadMoreWidget(): void {
        this.setState(LOAD_MORE, null);
    }
}
