/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Компонент "Пчеловод для работника Минсельхоза"         *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkBeekeeperStaticTaskState,
    StaticBeekeepersRequest
} from '@/components/GwtkBeekeeperStatic/task/GwtkBeekeeperStaticTask';
import { BeekeepersRequestResult } from '@/components/GwtkBeekeeper/task/GwtkBeekeeperTask';
import GwtkBeekeeperStaticRecordsListWidget
    from '@/components/GwtkBeekeeperStatic/task/components/GwtkBeekeeperStaticRecordsList/GwtkBeekeeperStaticRecordsListWidget.vue';
import GwtkBeekeeperStaticRecordEditForm
    from '@/components/GwtkBeekeeperStatic/task/components/GwtkBeekeeperStaticRecordEditForm/GwtkBeekeeperStaticRecordEditForm.vue';


/**
 * Компонент "Пчеловод для работника Минсельхоза"
 * @class GwtkBeekeeperStaticWidget
 * @extends BaseGwtkVueComponent
 */
@Component( {
    components: {
        GwtkBeekeeperStaticRecordsListWidget,
        GwtkBeekeeperStaticRecordEditForm
    }
})
export default class GwtkBeekeeperStaticWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkBeekeeperStaticTaskState>( key: K, value: GwtkBeekeeperStaticTaskState[K]) => void;

    @Prop( { default: () => ([]) } )
    private readonly mapObjectsListFromDB!: StaticBeekeepersRequest | null;

    @Prop( { default: () => ([]) } )
    private readonly currentMapObjectDataFromDB!:BeekeepersRequestResult[] | null;

    @Prop( { default: () => ([]) } )
    private readonly selectedObjectFromDB!: string[];

    @Prop( { default: false } )
    private readonly showPanelStyle!: boolean;

    @Prop( { default: false } )
    private readonly showMapObjectsUpdateOverlay!: boolean;

    @Prop( { default: false } )
    private readonly showSaveOverlay!: boolean;

    get recordsList() {
        if ( this.mapObjectsListFromDB ) {
            if ( this.mapObjectsListFromDB.result && this.mapObjectsListFromDB.result.length !== 0 ) {
                return this.mapObjectsListFromDB.result;
            }
        }

        return [];
    }
}
