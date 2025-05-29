/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Виджет компонента                         *
 *                          Обзорная карта                          *
 *                                                                  *
 *******************************************************************/
import { Component, Prop, Vue } from 'vue-property-decorator';
import { GwtkMapOverviewTaskState, TOGGLE, CREATE_MAP } from '@/components/GwtkMapOverview/task/GwtkMapOverviewTask';
import Utils from '~/services/Utils';
import {TaskDescription} from '../../../../GIS WebToolKit SE/debug/source/taskmanager/TaskManager';


/**
 * Виджет компонента
 * @class GwtkMapOverviewWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkMapOverviewWidget extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapOverviewTaskState>(key: K, value: GwtkMapOverviewTaskState[K]) => void;

    @Prop({ default: 0 })
    readonly width!: number;

    @Prop({ default: 0 })
    readonly height!: number;

    @Prop({ default: false })
    readonly active!: boolean;

    @Prop({ default: false })
    readonly showMap!: boolean;

    @Prop({ default: '' })
    readonly mapContainerId!: string;

    readonly guid = Utils.generateGUID();

    mounted() {
        this.setState(CREATE_MAP, this.guid);
    }


    toggle() {
        this.setState(TOGGLE, undefined);
    }

}

