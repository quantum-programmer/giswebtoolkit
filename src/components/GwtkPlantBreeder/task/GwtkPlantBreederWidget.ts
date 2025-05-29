/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Компонент "Растениевод"                     *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    UPDATE_OBJECT_SEMANTIC,
    GwtKPlantBreederTaskState,
    PlantBreederRequest,
    PlantBreederRequestAdditionalInformation,
    SAVE_OBJECT,
    CANCEL_OBJECT_EDITOR, CREATE_NEW_RECORD, DELETE_RECORD, UPDATE_ACTUAL_OBJECTS_LIST
} from '@/components/GwtkPlantBreeder/task/GwtkPlantBreederTask';
import MapObject from '~/mapobject/MapObject';
import GwtkPlantBreederMapObjectWidget from '@/components/GwtkPlantBreeder/task/components/GwtkPlantBreederMapObjectWidget.vue';

/**
 * Компонент "Растениевод"
 * @class GwtkPlantBreederWidget
 * @extends BaseGwtkVueComponent
 */
@Component( {
    components: {
        GwtkPlantBreederMapObjectWidget
    }
})
export default class GwtkPlantBreederWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtKPlantBreederTaskState>( key: K, balue: GwtKPlantBreederTaskState[K] ) => void;

    @Prop( { default: () => ({ components: [] }) } )
    private readonly linkPanel!: {
        components: TaskDescription[];
        result?: string;
        activeState?: string;
    };

    @Prop( { default: () => ([]) } )
    mapObjects!: MapObject[];

    @Prop( { default: 0 } )
    foundMapObjectsNumber!: number;

    @Prop( { default: () => ([]) } )
    selectedMapObject!: string[];

    @Prop( { default: false } )
    showMapObjectsUpdateOverlay!: boolean;

    @Prop( { default: () => ({}) } )
    currentMapObject!: MapObject | null;

    @Prop( { default: () => ({}) } )
    currentMapObjectDataFromDB!: PlantBreederRequest | null;

    @Prop( { default: () => ({}) } )
    additionalInformation!: PlantBreederRequestAdditionalInformation | null;

    @Prop( { default: false } )
    private readonly showEditPanel!: boolean;

    @Prop( { default: false } )
    private readonly showEditPanelOverly!: boolean;

    @Prop( { default: '' } )
    private readonly localeName!: string;

    datePickerProps: object = {
        'no-title': true,
        scrollable: true,
        locale: this.localeName
    };

    timePickerProps: object = {
        useSeconds: true,
        format: '24hr'
    };

    selectedDataInDB: number | null = null;

    updated() {
        if ( this.selectedDataInDB == null ) {
            this.selectedDataInDB = (this.currentMapObjectDataFromDB && this.currentMapObjectDataFromDB.result.length > 0) ? this.currentMapObjectDataFromDB.result.length - 1 : null;
        }
    }

    get selectedDataInDBItem() {
        return this.selectedDataInDB;
    }

    set selectedDataInDBItem( value ) {
        if ( this.selectedDataInDB === null ) {
            this.selectedDataInDB = (this.currentMapObjectDataFromDB && this.currentMapObjectDataFromDB.result.length > 0) ? this.currentMapObjectDataFromDB.result.length - 1 : null;
        } else {
            this.selectedDataInDB = value;
        }
    }

    setDateValue( itemName: string, itemValue: string, itemIndex: number ) {
        this.setState( UPDATE_OBJECT_SEMANTIC, { key: itemName, value: this.createMyDateFormat( new Date( itemValue ) ), index: itemIndex } );
    }

    setValue( itemName: string, itemValue: string, itemIndex: number ) {
        this.setState( UPDATE_OBJECT_SEMANTIC, { key: itemName, value: itemValue, index: itemIndex } );
    }

    createMyDateFormat( date: Date ) {
        return date.getFullYear() + '-' +
            (date.getMonth() + 1).toString().padStart( 2, '0' ) + '-' +
            date.getDate().toString().padStart( 2, '0' ) + ' ' +
            date.getHours().toString().padStart( 2, '0' ) + ':' +
            date.getMinutes().toString().padStart( 2, '0' ) + ':' +
            date.getSeconds().toString().padStart( 2, '0' );
    }

    get result() {
        if ( this.linkPanel && this.linkPanel.result ) {
            return this.$t( 'plantbreeder.' + this.linkPanel.result );
        }
        return '';
    }

    get linkPanelActiveState() {
        if ( this.linkPanel && this.linkPanel.activeState ) {
            return this.linkPanel.activeState;
        }
        return 'edit';
    }

    get fieldInfo() {
        if ( this.currentMapObjectDataFromDB && this.currentMapObjectDataFromDB.fieldInfo ) {
            return this.currentMapObjectDataFromDB.fieldInfo;
        }
        return undefined;
    }

    get organizationName() {
        let organizationData = { name: 'Название организации', value: '' };
        if ( this.currentMapObjectDataFromDB && this.currentMapObjectDataFromDB.fieldInfo) {
            if ( this.currentMapObjectDataFromDB.fieldInfo.name ) {
                organizationData.value = this.currentMapObjectDataFromDB.fieldInfo.name;
            }
        }
        return organizationData;
    }

    get fieldAreaName() {
        let areaData = { name: 'Название рабочего участка', value: '' };
        if ( this.currentMapObjectDataFromDB && this.currentMapObjectDataFromDB.fieldInfo ) {
            if ( this.currentMapObjectDataFromDB.fieldInfo.value ) {
                areaData.value = this.currentMapObjectDataFromDB.fieldInfo.value as string;
            }
        }
        return areaData;
    }

    get mapFieldNumber() {
        let fieldNumberData = { name: this.$t('plantbreeder.Field number'), value: ''};
        if ( this.currentMapObjectDataFromDB && this.currentMapObjectDataFromDB.fieldInfo ) {
            if ( this.currentMapObjectDataFromDB.fieldInfo.sectionNumber ) {
                fieldNumberData.value = this.currentMapObjectDataFromDB.fieldInfo.sectionNumber;
            }
        }
        return fieldNumberData;
    }

    get mapFieldSectionNumber() {
        let sectionNumberData = { name: this.$t('plantbreeder.Plot number'), value : ''};
        if ( this.currentMapObjectDataFromDB && this.currentMapObjectDataFromDB.fieldInfo ) {
            if ( this.currentMapObjectDataFromDB.fieldInfo.sectionCode ) {
                sectionNumberData.value = this.currentMapObjectDataFromDB.fieldInfo.sectionCode;
            }
        }
        return sectionNumberData;
    }

    getAdditionalInformation( name: string ) {
        if ( this.additionalInformation ) {
            if ( this.additionalInformation.result ) {
                if ( name === 'active_substance' ) {
                    return this.additionalInformation.result.sparv_active_substance;
                }
                if ( name === 'status' ) {
                    return this.additionalInformation.result.sprav_hazard_classes;
                }
                if ( name === 'pros_type' ) {
                    return this.additionalInformation.result.sprav_handling_type;
                }
                if ( name === 'SZR_name' ) {
                    return this.additionalInformation.result.szrNamesList;
                }
            }
        }
        return [];
    }

    createRecord() {
        this.selectedDataInDB = null;
        this.setState( CREATE_NEW_RECORD, true );
    }

    deleteObjetRecord(itemNumber: number) {
        this.selectedDataInDB = null;
        this.setState( DELETE_RECORD, itemNumber );
    }

    save() {
        if ( this.currentMapObject ) {
            this.setState( SAVE_OBJECT, true );
        }
    }

    cancel() {
        this.setState( CANCEL_OBJECT_EDITOR, true );
    }

    updateActualObjectsList() {
        this.setState( UPDATE_ACTUAL_OBJECTS_LIST, undefined );
    }

}
