/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент "Настройка параметров"                 *
 *                       подраздел "Измерения"                      *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkMapOptionsTaskState,
    UPDATE_MEASUREMENTS_FILL_COLOR,
    UPDATE_MEASUREMENTS_LINE_COLOR,
    UPDATE_MEASUREMENTS_OPACITY
} from '@/components/GwtkMapOptions/task/GwtkMapOptionsTask';
import MapOptionsUtils from '@/components/GwtkMapOptions/task/components/GwtkMapOptionsParameters/utils/MapOptionsUtils';
import { MeasurementsStyle } from '~/utils/WorkspaceManager';

/**
 * Компонент "Настройка параметров", подраздел "Измерения"
 * @class GwtkMapOptionsParametersMeasurements
 * @extends Vue
 */
@Component
export default class GwtkMapOptionsParametersMeasurements extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>( key: K, value: GwtkMapOptionsTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly measurements!: MeasurementsStyle;

    /**
     * Обработчик для изменения цвет заливки в разеделе "Измерения"
     * @private
     * @method changeFillColor
     * @property value {String} значение поля
     */
    private changeFillColor( value: string ) {
        this.setState( UPDATE_MEASUREMENTS_FILL_COLOR, value );
    }

    /**
     * Обработчик для изменения цвет линии
     * @private
     * @method changeLineColor
     * @property value {String} значение поля
     */
    private changeLineColor( value: string ) {
        this.setState( UPDATE_MEASUREMENTS_LINE_COLOR, value );
    }

    /**
     * Обработчик для изменения значения непрозрачности в разеделе "Измерения"
     * @private
     * @method changeOpacity
     * @property value {Number} значение поля
     */
    private changeOpacity( value: number ) {
        this.setState( UPDATE_MEASUREMENTS_OPACITY, MapOptionsUtils.convertValueToFloat( value ) );
    }

    /**
     * Сгенерировать стили для поля "Цвет заливки"
     * @private
     * @method fillColorStyle
     */
    private get fillColorStyle() {
        return MapOptionsUtils.createStyleForColorBox( this.measurements.fillColor );
    }

    /**
     * Сгенерировать стили для поля "Цвет линии"
     * @private
     * @method lineColorStyle
     */
    private get lineColorStyle() {
        return MapOptionsUtils.createStyleForColorBox( this.measurements.lineColor );
    }

    /**
     * Перевести значения непрозрачности к целому числу
     * @private
     * @method opacityValue
     */
    private get opacityValue() {
        return MapOptionsUtils.convertValueToInteger( this.measurements.opacity );
    }

}
