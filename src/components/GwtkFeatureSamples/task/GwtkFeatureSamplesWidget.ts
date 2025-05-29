/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Виджет компонента                             *
 *               "Просмотр списков объектов"                        *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkFeatureSamplesState,
    GwtkFeatureSamplesTaskWidgetParams
} from '../task/GwtkFeatureSamplesTask';
import MapObject from '~/mapobject/MapObject';
import Style from '~/style/Style';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import GwtkFeatureSamplesListWidget
    from '../task/components/GwtkFeatureSamplesListWidget/GwtkFeatureSamplesListWidget.vue';
import GwtkFeatureSamplesSearchWidget
    from '../task/components/GwtkFeatureSamplesSearchWidget/GwtkFeatureSamplesSearchWidget.vue';


/**
 * Виджет компонента
 * @class GwtkFeatureSamplesWidget
 * @extends BaseGwtkVueComponent
 */
@Component( { components: { GwtkFeatureSamplesListWidget, GwtkFeatureSamplesSearchWidget } } )
export default class GwtkFeatureSamplesWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkFeatureSamplesState>( key: K, value: GwtkFeatureSamplesState[K] ) => void;

    @Prop( { default: 0 } )
    private readonly selectedObjectCount!: number;

    @Prop( { default: () => ([]) } )
    private readonly groupList!: { id: number, name: string, objects: MapObject[], style: Style }[];


    @Prop( { default: () => ([]) } )
    private readonly activeListIndices!: number[];

    @Prop( { default: () => ({}) } )
    private readonly searchProps!: GwtkFeatureSamplesTaskWidgetParams['searchProps'];

    private selectedTab = 'tab_object_lists';
}
