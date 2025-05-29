/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Виджет элемента заголовков                     *
 *                        "Экспорт отчётов"                         *
 *                                                                  *
 *******************************************************************/

import {Component, Prop} from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {ExportReportHeaderOptions, ExportReportWidgetParams} from '../../Types';
import {ExportReportHeaderItem} from '../../../../../service/GISWebServerSEService/Types';

@Component
export default class GwtkHeaderItem extends BaseGwtkVueComponent {

    @Prop({default: () => ({})})
    private readonly header!: ExportReportHeaderItem;

    @Prop({default: () => ([])})
    private readonly fonts!: ExportReportWidgetParams['fonts'];

    @Prop({default: false})
    private readonly showHeaders!: boolean;

    @Prop({default: () => ({})})
    private readonly options!: ExportReportHeaderOptions;

    @Prop({default: 0})
    private readonly index!: number;

    get textRules(): ((v: string) => boolean | string)[] {
        if (!this.showHeaders) {
            return [];
        }
        return [
            v => v.length <= this.options.maxLength || this.$t('exportReport.Max text length is') as string + ' ' + this.options.maxLength
        ];
    }

    get fontSizeRules(): ((v: string) => boolean | string)[] {
        if (!this.showHeaders) {
            return [];
        }
        return [
            v => v !== '' || this.$t('exportReport.Number value required') as string,
            v => parseInt(v) >= this.options.minFontSize || this.$t('exportReport.Number must be greater than or equal') as string + ' ' + this.options.minFontSize,
            v => parseInt(v) <= this.options.maxFontSize || this.$t('exportReport.Number must be less than or equal') as string + ' ' + this.options.maxFontSize
        ];
    }

    protected setText(value: string): void {
        this.$emit('setText', value);
    }

    protected setFontFamily(value: string): void {
        this.$emit('setFontFamily', value);
    }

    protected setFontSize(value: string): void {
        this.$emit('setFontSize', value);
    }

}
