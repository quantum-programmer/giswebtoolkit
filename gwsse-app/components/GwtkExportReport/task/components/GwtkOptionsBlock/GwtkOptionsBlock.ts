/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Виджет блока настроек                       *
 *                        "Экспорт отчётов"                         *
 *                                                                  *
 *******************************************************************/

import {Component, Prop} from 'vue-property-decorator';
import Vue from 'vue';
import GwtkChevronSwitcher from '../GwtkChevronSwitcher/GwtkChevronSwitcher.vue';

@Component({
    components: {
        GwtkChevronSwitcher
    }
})
export default class GwtkOptionsBlock extends Vue {

    @Prop({default: false})
    private readonly show!: boolean;

    @Prop({default: ''})
    private readonly label!: string;

    @Prop({default: () => ([])})
    private readonly rules!: ((v: string) => boolean | string)[];

    @Prop({default: false})
    private readonly disabled!: boolean;

    @Prop({default: false})
    private readonly loading!: boolean;

    @Prop({default: ''})
    private readonly errorMessage!: string;

    protected chevronValue: boolean = false;

    protected setShow(value: boolean): void {
        this.$emit('setShow', value);
    }

}
