/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент "Настройка параметров"                 *
 *                  подраздел "Единицы измерения"                   *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkMapOptionsTaskState,
    UPDATE_ANGLE_UNIT,
    UPDATE_AREA_UNIT,
    UPDATE_LENGTH_UNIT
} from '@/components/GwtkMapOptions/task/GwtkMapOptionsTask';
import { AngleUnit, MeasurementUnits, Unit, UnitText } from '~/utils/WorkspaceManager';

/**
 * Компонент "Настройка параметров", подраздел "Единицы измерения"
 * @class GwtkMapOptionsParametersUnits
 * @extends Vue
 */
@Component
export default class GwtkMapOptionsParametersUnits extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>( key: K, value: GwtkMapOptionsTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly units!: MeasurementUnits;

    /**
     * Индексы толщины выделение объектов
     * @private
     * @property strokeWidthList {Array}
     */
    private lengthUnitList = [
        Unit.Meters,
        Unit.Kilometers,
        Unit.Foots,
        Unit.NauticalMiles
    ];

    private areaUnitList = [
        Unit.SquareMeters,
        Unit.SquareKilometers,
        Unit.Hectares
    ];

    private angleUnitList = [
        AngleUnit.Degrees,
        AngleUnit.DegreesMinutesSeconds,
        AngleUnit.Radians
    ];

    getUnitText( unit: Unit ) {
        return this.$t( 'phrases.' + UnitText[ unit ] );
    }


    getAngleText( unit: AngleUnit ) {
        let text;
        switch ( unit ) {
            case AngleUnit.Degrees:
                text = 'grad';
                break;
            case AngleUnit.Radians:
                text = 'rad';
                break;
            case AngleUnit.DegreesMinutesSeconds:
                text = 'grad min sec';
                break;
        }
        return this.$t( 'phrases.' + text );
    }

    /**
     * Обработчик для изменения значения единицы длины
     * @private
     * @method changeLengthUnit
     * @property value {String} значение поля
     */
    private changeLengthUnit( value: string ) {
        this.setState( UPDATE_LENGTH_UNIT, value as Unit );
    }

    /**
     * Обработчик для изменения значения единицы площади
     * @private
     * @method changeAreaUnit
     * @property value {String} значение поля
     */
    private changeAreaUnit( value: string ) {
        this.setState( UPDATE_AREA_UNIT, value as Unit );
    }

    /**
     * Обработчик для изменения значения единицы измерения углов
     * @private
     * @method changeAngleUnit
     * @property value {String} значение поля
     */
    private changeAngleUnit( value: string ) {
        this.setState( UPDATE_ANGLE_UNIT, value as AngleUnit );
    }

}
