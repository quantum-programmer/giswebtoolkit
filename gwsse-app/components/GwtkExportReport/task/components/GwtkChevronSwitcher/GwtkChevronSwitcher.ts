/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Виджет переключателя блока                    *
 *                        "Экспорт отчётов"                         *
 *                                                                  *
 *******************************************************************/

import {Component, Prop} from 'vue-property-decorator';
import Vue from 'vue';

@Component
export default class GwtkChevronSwitcher extends Vue {

    @Prop({default: ''})
    private readonly title!: string;

    protected modelValue: boolean = false;

    toggle(): void {
        this.modelValue = !this.modelValue;
        this.$emit('toggle', this.modelValue);
    }

}
