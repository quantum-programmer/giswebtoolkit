/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент "Настройка параметров"                 *
 *               подраздел "Период обновления слоев"                *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import { GwtkMapOptionsTaskState, UPDATE_REFRESH_INTERVAL } from '@/components/GwtkMapOptions/task/GwtkMapOptionsTask';

/**
 * Компонент "Настройка параметров", подраздел "Период обновления слоев"
 * @class GwtkMapOptionsParametersRefreshInterval
 * @extends Vue
 */
@Component
export default class GwtkMapOptionsParametersRefreshInterval extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>( key: K, value: GwtkMapOptionsTaskState[K] ) => void;

    @Prop ( { default: 0} )
    private readonly refreshInterval!: number;

    /**
     * Обработчик для изменения значения периода обновления
     * @method changeRefreshInterval
     * @property value {string} значение поля
     */
    changeRefreshInterval(value: string) {
        let parseValue = parseInt(value);
        parseValue = Math.abs(parseValue || 0);
        this.setState(UPDATE_REFRESH_INTERVAL, parseValue);
    }
}
