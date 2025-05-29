/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Компонент "Параметры"                      *
 *                параметр "Система координат курсора"              *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkMapOptionsTaskState,
    CursorCoordinateSystemParam,
    UPDATE_CURSOR_COORDINATE_SYSTEM
} from '@/components/GwtkMapOptions/task/GwtkMapOptionsTask';
import { CursorCoordinateUnit } from '~/utils/WorkspaceManager';

/**
 * Компонент "Настройка параметров", подраздел "Единицы измерения"
 * @class GwtkMapOptionsParametersUnits
 * @extends Vue
 */
@Component
export default class GwtkMapOptionsParametersCursorUnits extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>( key: K, value: GwtkMapOptionsTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly cursorCoordinateParams!: CursorCoordinateSystemParam;

    private metersText = 'Rectangular in Meters';
    private metersLocalText = 'Rectangular in Meters (Local)';
    private degreesMinutesSecondsText = 'Geodetic degminsec';
    private degreesText = 'Geodetic degrees';
    private radiansText = 'Geodetic radians';
    private meterSk42Text = 'Meters SK 42';

    /**
     * Общий список систем список координат курсора
     * @method cursorCoordinateUnitList
     */
    private readonly cursorCoordinateUnitList = [
        CursorCoordinateUnit.Meter,
        CursorCoordinateUnit.Degrees,
        CursorCoordinateUnit.DegreesMinutesSeconds,
        CursorCoordinateUnit.Radians,
        CursorCoordinateUnit.MeterSk42
    ];

    created() {
        this.metersText = this.$t('phrases.Rectangular in Meters') as string;
        this.metersLocalText = this.$t('phrases.Rectangular in Meters (Local)') as string;
        this.degreesMinutesSecondsText = this.$t('phrases.Geodetic degminsec') as string;
        this.degreesText = this.$t('phrases.Geodetic degrees') as string;
        this.radiansText = this.$t('phrases.Geodetic radians') as string;
        this.meterSk42Text = this.$t('phrases.Meters SK 42') as string;
    }

    /**
     * Список систем координат курсора
     * @method cursorCoordinateSystemList
     * @property
     * @returns {Array}, CursorCoordinateUnit[]
     */
    get cursorCoordinateSystemList() {
        if ( this.cursorCoordinateParams.isGeoSys ) {
            return this.cursorCoordinateUnitList;
        }
        return [ CursorCoordinateUnit.Meter ];
    }

    /**
     * Название системы координат курсора
     * @method getCursorCoordinateSystemText
     * @returns {string}, название (метры, градусы,...)
     */
    getCursorCoordinateSystemText( unit: string ) {
        let text;
        switch ( unit ) {
            case CursorCoordinateUnit.Degrees:
                text = this.degreesText;
                break;
            case CursorCoordinateUnit.Radians:
                text = this.radiansText;
                break;
            case CursorCoordinateUnit.DegreesMinutesSeconds:
                text = this.degreesMinutesSecondsText;
                break;
            case CursorCoordinateUnit.Meter:
                if ( this.cursorCoordinateParams.isLocalSys ) {
                    text = this.metersLocalText;
                } else {
                    text = this.metersText;
                }
                break;
            case CursorCoordinateUnit.MeterSk42:
                text = this.meterSk42Text;
                break;
        }
        return text;
    }

    /**
     * Обработчик изменения параметра Система координат курсора
     * @private
     * @method changeCursorCoordinateSystem
     * @property value {CursorCoordinateUnit} значение поля
     */
    private changeCursorCoordinateSystem(value: CursorCoordinateUnit) {
        this.setState(UPDATE_CURSOR_COORDINATE_SYSTEM, value);
    }

}
