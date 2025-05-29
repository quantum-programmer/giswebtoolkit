/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Виджет выбора логотипа                      *
 *                        "Экспорт отчётов"                         *
 *                                                                  *
 *******************************************************************/

import {Component, Prop} from 'vue-property-decorator';
import Vue from 'vue';
import {Logotype} from '../../classes/Logotype';


@Component
export default class GwtkSelectLogotype extends Vue {

    @Prop({default: []})
    private readonly logotypes!: Logotype[];

    @Prop({default: -1})
    private readonly logotype!: number;

    @Prop({default: false})
    private readonly disabled!: boolean;

    protected previewingLogotype: Logotype | false = false;

    protected setLogotype(value?: number): void {
        if (value === undefined) {
            value = -1;
        }
        this.$emit('setLogotype', value);
    }

    protected previewLogotype(logotypeIndex: number): void {
        this.previewingLogotype = this.logotypes[logotypeIndex];
        this.$nextTick(() => {
            this.blurListItem(logotypeIndex);
        });
    }

    protected blurListItem(logotypeIndex: number): void {
        const itemElement = document.body.querySelector('.export-report__logotype-' + logotypeIndex) as HTMLDivElement;
        itemElement?.blur();
    }

    protected closePreview(): void {
        this.previewingLogotype = false;
    }

}
