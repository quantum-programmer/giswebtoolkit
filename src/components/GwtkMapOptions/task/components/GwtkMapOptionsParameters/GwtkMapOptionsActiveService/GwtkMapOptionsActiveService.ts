/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент "Настройка параметров"                 *
 *             подраздел "Активный сервис для поиска"               *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    ActiveServiceUrl,
    GwtkMapOptionsTaskState,
    UPDATE_ACTIVE_SERVICE_URL
} from '@/components/GwtkMapOptions/task/GwtkMapOptionsTask';

/**
 * Компонент "Настройка параметров", подраздел "Активный сервис для поиска"
 * @class GwtkMapOptionsParametersActiveService
 * @extends Vue
 */
@Component
export default class GwtkMapOptionsActiveService extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>( key: K, value: GwtkMapOptionsTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly activeServicesUrls!: ActiveServiceUrl;


    /**
     * Обработчик для изменения значения активного сервиса для поиска
     * @private
     * @method changeActiveServiceUrl
     * @property value {String} значение поля
     */
    private changeActiveServiceUrl( value:string ) {
        this.setState( UPDATE_ACTIVE_SERVICE_URL, value );
    }

}
