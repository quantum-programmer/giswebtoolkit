/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент 'Настройка параметров'                 *
 *                 подраздел 'Журнал событий карты'                 *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import { GwtkMapOptionsTaskState, MAP_LOG_DEBUG_MODE } from '../../../GwtkMapOptionsTask';

/**
* Компонент 'Настройка параметров', подраздел 'Журнал событий карты'
* @class GwtkMapOptionsMapLog
* @extends Vue
*/
@Component
export default class GwtkMapOptionsMapLog extends Vue {

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>(key: K, value: GwtkMapOptionsTaskState[K]) => void;

    @Prop({ default: () => ({}) })
    mapLog!: { debugMode: boolean };

    toggleDebugMode() {
        this.setState(MAP_LOG_DEBUG_MODE, undefined);
    }
}