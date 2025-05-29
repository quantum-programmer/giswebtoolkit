/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент "Настройка параметров"                 *
 *                  подраздел "Выделение объектов"                  *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkMapOptionsTaskState,
    UPDATE_OBJECT_SELECTION_LINE_COLOR,
    UPDATE_OBJECT_SELECTION_SIGNATURES_SELECTION
} from '@/components/GwtkMapOptions/task/GwtkMapOptionsTask';
import MapOptionsUtils from '@/components/GwtkMapOptions/task/components/GwtkMapOptionsParameters/utils/MapOptionsUtils';
import { ObjectSelectionStyle, SignaturesSelection, SelectObjectDrawingType } from '~/utils/WorkspaceManager';

/**
 * Компонент "Настройка параметров", подраздел "Выделение объектов"
 * @class GwtkMapOptionsParametersObjectSelection
 * @extends Vue
 */
@Component
export default class GwtkMapOptionsParametersObjectSelection extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>( key: K, value: GwtkMapOptionsTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly objectSelection!: ObjectSelectionStyle;

    /**
     * Индексы выбора подписей
     * @private
     * @property selectingSignaturesList
     */
    private selectingSignaturesList = [SignaturesSelection.Always, SignaturesSelection.WhileEditorIsActive, SignaturesSelection.Never];

    /**
     * Обработчик для изменения значения цвет текста
     * @private
     * @method changeTextColor
     * @property value {String} значение поля
     */
    private changeTextColor( { hex }: { hex: string; } ) {
        this.setState( UPDATE_OBJECT_SELECTION_LINE_COLOR, hex );
    }

    /**
     * Обработчик для изменения значения выбора подписей
     * @private
     * @method changeSelectingSignatures
     * @property value {String} значение поля
     */
    private changeSelectingSignatures( value: string ) {
        this.setState( UPDATE_OBJECT_SELECTION_SIGNATURES_SELECTION, value as SignaturesSelection );
    }

    /**
     * Сгенерировать стили для поля "Цвет линии"
     * @private
     * @method lineColorStyle
     */
    private get lineColorStyle() {
        return MapOptionsUtils.createStyleForColorBox( this.objectSelection.lineColor );
    }

}
