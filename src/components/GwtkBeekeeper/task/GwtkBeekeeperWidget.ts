/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Компонент "Пчеловод"                      *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    ADD_OBJECT,
    BeekeepersRequest,
    BeekeepersRequestAdditionalInformation,
    BeekeepersRequestResult,
    CLOSE_OBJECT_CHANGING_PANEL,
    CREATE_MODE_BY_GEOLOCATION_ACTION,
    DELETE_MODE_ACTION,
    EDIT_APIARY_POSITION_BY_GEOLOCATION_ACTION,
    EDIT_OBJECT,
    GwtkBeekeeperTaskState,
    SET_BEEKEEPER_INSTALLATION_DATE,
    UPDATE_ACTUAL_OBJECTS_LIST,
    UPDATE_OBJECT_SEMANTIC
} from '@/components/GwtkBeekeeper/task/GwtkBeekeeperTask';
import MapObject from '~/mapobject/MapObject';
import { BrowserService } from '~/services/BrowserService';
import GwtkBeekeeperMapObjectWidget from '@/components/GwtkBeekeeper/task/components/GwtkBeekeeperMapObjectWidget.vue';


/**
 * Компонент "Пчеловод"
 * @class GwtkBeekeeperWidget
 * @extends BaseGwtkVueComponent
 */
@Component( {
    components: {
        GwtkBeekeeperMapObjectWidget
    }
} )
export default class GwtkBeekeeperWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkBeekeeperTaskState>( key: K, value:GwtkBeekeeperTaskState[K] ) => void;

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
    currentMapObjectDataFromDB!: BeekeepersRequest | null;

    @Prop( { default: () => ({}) } )
    additionalInformation!: BeekeepersRequestAdditionalInformation | null;

    @Prop( { default: '' } )
    private readonly beekeeperInstallationValue!: string;

    @Prop( { default: '' } )
    private readonly localeName!: string;

    @Prop( { default: false } )
    private readonly showPanelStyle!: boolean;

    datePickerOpen: boolean = false;
    defaultDateValue: string = this.createMyDateFormat( new Date( Date.now() ) );

    datePickerProps = {
        'no-title': true,
        scrollable: true,
        locale: this.localeName
    };

    timePickerProps = {
        useSeconds: true,
        format: '24hr'
    };

    get dateValue() {
        if ( this.beekeeperInstallationValue !== '') {
            return this.beekeeperInstallationValue;
        } else {
            return this.defaultDateValue;
        }
    }

    set dateValue(value: string) {
        this.setState(SET_BEEKEEPER_INSTALLATION_DATE, value);
    }

    setDateValue(itemName: string, itemValue: string) {
        this.setState(UPDATE_OBJECT_SEMANTIC, { key: itemName, value: this.createMyDateFormat(new Date(itemValue)) });
    }

    setValue(itemName: string, itemValue: string) {
        this.setState(UPDATE_OBJECT_SEMANTIC, { key: itemName, value: itemValue });
    }

    createMyDateFormat(date: Date) {
        return date.getFullYear() + '-' +
            (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
            date.getDate().toString().padStart(2, '0') + ' ' +
            date.getHours().toString().padStart(2, '0') + ':' +
            date.getMinutes().toString().padStart(2, '0') + ':' +
            date.getSeconds().toString().padStart(2, '0');
    }

    deleteSelectedObject() {
        this.setState( DELETE_MODE_ACTION, true );
    }

    get result() {
        if ( this.linkPanel && this.linkPanel.result ) {
            return this.$t('beekeeper.' + this.linkPanel.result );
        }
        return '';
    }

    get linkPanelActiveState() {
        if ( this.linkPanel && this.linkPanel.activeState ) {
            return this.linkPanel.activeState;
        }
        return 'add';
    }

    getButtonDescription(buttonId: string) {
        if ( buttonId === 'gwtkbeekeeper.createmodeaction' ) {
            return 'beekeeper.Add an apiary';
        } else if ( buttonId === 'gwtkbeekeeper.editmodeaction' ) {
            return 'beekeeper.Edit the apiary';
        } else if ( buttonId === 'gwtkbeekeeper.deletemodeaction' ) {
            return 'beekeeper.Delete an apiary';
        }
    }

    getButtonIcon(buttonId: string) {
        if ( buttonId === 'gwtkbeekeeper.createmodeaction' ) {
            return 'plus';
        } else if ( buttonId === 'gwtkbeekeeper.editmodeaction' ) {
            return 'pencil';
        } else if ( buttonId === 'gwtkbeekeeper.deletemodeaction' ) {
            return 'trash-can';
        }
    }

    save() {
        if ( this.currentMapObject ) {
            this.setState( EDIT_OBJECT, true );
        } else {
            this.setState( ADD_OBJECT, true );
        }
    }

    close() {
        this.setState( CLOSE_OBJECT_CHANGING_PANEL, true );
    }

    updateActualObjectsList() {
        this.setState( UPDATE_ACTUAL_OBJECTS_LIST, undefined );
    }

    get mapObjectAddress() {
        if ( this.currentMapObject ) {
            const address = this.currentMapObject.getSemanticValue('Address') as string;
            if ( address !== '' && address !== '0' ) {
                return address;
            }
            return '';
        }
        return '';
    }

    get userFullName() {
        let fullName: string = '';
        if ( this.currentMapObject ) {
            if ( this.currentMapObject.getSemanticValue('OwnerApiary') ) {
                const ownerApiary = this.currentMapObject.getSemanticValue('OwnerApiary') as string;
                if ( ownerApiary !== '' && ownerApiary !== '0' ) {
                    fullName = ownerApiary;
                }
            }
        }
        if ( fullName === '' ) {
            if ( this.mapVue.getMap().options ) {
                const options = this.mapVue.getMap().options as unknown as { userData?: { permissions?: { FIO?: string; } } };
                if ( options.userData ) {
                    const userData = options.userData;
                    if ( userData.permissions ) {
                        if ( userData.permissions.FIO ) {
                            fullName = userData.permissions.FIO;
                        }
                    }
                }
            }
        }

        return fullName;
    }

    get beekeeperStatus() {
        let status: string = '';
        if ( this.currentMapObject ) {
            if ( this.currentMapObject.getSemanticValue('BeeKeeperStatus') ) {
                const beekeeperStatus = this.currentMapObject.getSemanticValue('BeeKeeperStatus') as string;
                if ( beekeeperStatus !== '' && beekeeperStatus !== '0' ) {
                    status = beekeeperStatus;
                }
            }
        }
        if ( status === '' ) {
            if ( this.mapVue.getMap().options ) {
                const options = this.mapVue.getMap().options;
                if (Reflect.has(options, 'userData')) {
                    const userData = (options as unknown as { userData: { permissions?: { organization?: { typeOrgan?: string; } } } }).userData;
                    if (userData.permissions) {
                        const permissions = userData.permissions;
                        if (permissions.organization) {
                            if (permissions.organization.typeOrgan) {
                                status = permissions.organization.typeOrgan;
                            }
                        }
                    }
                }
            }
        }

        return status;
    }

    get apiaryType() {
        let type: string = '0';
        if ( this.currentMapObjectDataFromDB ) {
            if ( this.currentMapObjectDataFromDB.result ) {
                const result = this.currentMapObjectDataFromDB.result;
                result.forEach( ( resultItem:BeekeepersRequestResult ) => {
                    if ( resultItem.key === 'a_type' ) {
                        type = resultItem.value as string;
                    }
                });
            }
        }

        return type;
    }

    get apiaryTypeString() {
        let apiaryTypeInString: string = this.$t('beekeeper.temporary') as string;
        let apiaryType: string = this.apiaryType;

        if ( apiaryType === '1' ) {
            apiaryTypeInString = this.$t('beekeeper.permanent') as string;
        }

        return apiaryTypeInString;
    }

    /**
     * Получить информацию о доступности геолокации
     * @private
     * @method isGeolocationEnabled
     */
    private get isGeolocationEnabled() {
        return !BrowserService.checkGeolocation();
    }

    /**
     * Создать пасеку по местонахождению
     * @private
     * @method createApiaryByLocation
     */
    private createApiaryByLocation() {
        this.setState( CREATE_MODE_BY_GEOLOCATION_ACTION, true );
    }

    /**
     * Перенести пасеку в соответствии с текущим местоположением
     * @private
     * @method editApiaryPositionByLocation
     */
    private editApiaryPositionByLocation() {
        this.setState( EDIT_APIARY_POSITION_BY_GEOLOCATION_ACTION, true );
    }

}
