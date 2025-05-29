/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент "Настройка параметров"                 *
 *                 подраздел "Формирование легенды"                 *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import { GwtkMapOptionsTaskState, LEGEND_WITH_MAP_EXTENT, MapLegendParams } from '../../../GwtkMapOptionsTask';

@Component
export default class GwtkMapOptionsLegend extends Vue {

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>(key: K, value: GwtkMapOptionsTaskState[K]) => void;
    
    @Prop({ default: () => (false) })
    mapLegend!: MapLegendParams;

    toggleMapExtentCheckbox() {
        this.setState(LEGEND_WITH_MAP_EXTENT, undefined);
    }
}