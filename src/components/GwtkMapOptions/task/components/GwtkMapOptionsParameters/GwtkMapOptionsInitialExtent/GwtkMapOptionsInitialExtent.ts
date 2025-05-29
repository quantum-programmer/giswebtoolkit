/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент 'Настройка параметров'                 *
 *               подраздел 'Показать начальный экстент'             *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import { GwtkMapOptionsTaskState, INITIAL_EXTENT_RESET_MAP_CONTENT } from '../../../GwtkMapOptionsTask';

/**
* Компонент 'Настройка параметров', подраздел 'Показать начальный экстент'
* @class GwtkMapOptionsInitialExtent
* @extends Vue
*/
@Component
export default class GwtkMapOptionsInitialExtent extends Vue {

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>(key: K, value: GwtkMapOptionsTaskState[K]) => void;

    @Prop({ default: () => ({}) })
    initialExtent!: { resetMapContent: boolean };

    toggleResetMapContent() {
        this.setState(INITIAL_EXTENT_RESET_MAP_CONTENT, undefined);
    }
}