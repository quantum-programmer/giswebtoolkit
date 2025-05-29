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
    CANCEL_REQUEST,
    BUILD_HEAT_MAP,
    UPDATE_SELECTED_LAYER,
    GwtkHeatMapkState
} from '@/components/GwtkHeatMap/task/GwtkHeatMapTask';
import { HeatMapOptions } from '~/types/Options';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';


/**
 * Виджет компонента
 * @class GwtkHeatMapWidget
 * @extends Vue
 */
@Component
export default class GwtkHeatMapWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkHeatMapkState>( key: K, value: GwtkHeatMapkState[K] ) => void;

    @Prop( { default: () => ([]) } )
    private readonly mapLayersWithLegendDescriptions!: HeatMapOptions[];

    @Prop( { default: '' } )
    private readonly selectedMapLayerId!: string;

    @Prop( { default: true } )
    private readonly buildMapProgressBar!: boolean;

    private heatMapName = '';

    private errorMessage = '';

    created() {
        if ( this.mapLayersWithLegendDescriptions.length > 0 ) {
            this.heatMapName = this.mapLayersWithLegendDescriptions[ 0 ].alias;
        } else {
            this.errorMessage = this.$t( 'heatmap.Component settings not set' ).toString();
        }
    }

    private onLayerChange( LayerName: string ) {
        const description = this.mapLayersWithLegendDescriptions.find( element => element.LayerName == LayerName );
        if ( description ) {
            this.heatMapName = description.alias;
            this.setState( UPDATE_SELECTED_LAYER, LayerName );
        }
    }

    private buildMap() {
        this.setState( BUILD_HEAT_MAP, this.heatMapName );
    }

    private cancelRequest() {
        this.setState( CANCEL_REQUEST, undefined );
    }

}
