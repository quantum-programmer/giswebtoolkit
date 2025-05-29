/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Виджет компонента                         *
 *                        "Яндекс.Панорамы"                         *
 *                                                                  *
 *******************************************************************/


import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    CREATE_YANDEX_PANORAMA,
    GwtkYandexPanoramaTaskState,
    UPDATE_KEY_API_YANDEX
} from '@/components/GwtkYandexPanorama/task/GwtkYandexPanoramaTask';


/**
 * Виджет компонента
 * @class GwtkYandexPanoramaWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkYandexPanoramaWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkYandexPanoramaTaskState>( key: K, value: GwtkYandexPanoramaTaskState[K] ) => void;

    @Prop( { default: () => '' } )
    private readonly idYandexPanoramaPlayer!: string;

    @Prop( { default: () => false } )
    private readonly apiYandexConnect!: boolean;

    @Prop( { default: () => false } )
    private readonly panoramaFound!: boolean;

    @Prop( { default: () => false } )
    private readonly loadingPanorama!: boolean;

    @Prop( { default: '' } )
    private keyApiYandex!: string;

    private key: string = '';

    /**
     * Создание виджета
     */
    created() {
        this.setState( CREATE_YANDEX_PANORAMA, true );
    }

    private sendKey() {
        this.setState( UPDATE_KEY_API_YANDEX, this.key );
    }

    private get keyApiYandexValue() {
        return this.keyApiYandex;
    }

    private set keyApiYandexValue( value: string ) {
        this.key = value;
    }
}
