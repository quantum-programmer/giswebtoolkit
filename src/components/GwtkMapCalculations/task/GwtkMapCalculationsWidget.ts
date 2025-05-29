/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Виджет компонента                          *
 *                       "Расчеты по карте"                         *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkMapCalculationsTaskState,
    MAPCALCULATIONS_ACTION_ID,
    MAPCALCULATIONS_AZIMUTH,
    MAPCALCULATIONS_DIRECT_ACTION,
    MAPCALCULATIONS_DISTANCE,
    MAPCALCULATIONS_FIRST_POINT_LATITUDE,
    MAPCALCULATIONS_FIRST_POINT_LONGITUDE,
    MAPCALCULATIONS_INVERSE_ACTION,
    MAPCALCULATIONS_SECOND_POINT_LATITUDE,
    MAPCALCULATIONS_SECOND_POINT_LONGITUDE,
    MAPCALCULATIONS_SET_POINTS
} from '@/components/GwtkMapCalculations/task/GwtkMapCalculationsTask';
import { AngleUnit, CursorCoordinateUnit, UnitText } from '~/utils/WorkspaceManager';
import i18n from '@/plugins/i18n';

type DegreesMinutesSecondsData = {
    id: string,
    type: string,
    value: string
};

/**
 * Виджет компонента Расчеты по карте
 * @class GwtkMapCalculationsWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkMapCalculationsWidget extends BaseGwtkVueComponent {
    @Prop({ default: '' })
    readonly taskId!: string;

    @Prop({ default: () => ({}) })
    readonly description!: TaskDescription;

    @Prop({
        default: []
    })
    readonly regimes!: TaskDescription[];

    @Prop({
        default: ''
    })
    readonly actionId!: string;

    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkMapCalculationsTaskState>(key: K, value: GwtkMapCalculationsTaskState[K]) => void;

    @Prop({ default: 0 })
    readonly first_point_latitude!: number;

    @Prop({ default: 0 })
    readonly first_point_longitude!: number;

    @Prop({ default: 0 })
    readonly second_point_latitude!: number;

    @Prop({ default: 0 })
    readonly second_point_longitude!: number;

    @Prop({ default: '0' })
    readonly distance!: string;

    @Prop({ default: '0' })
    readonly azimuth!: string;

    @Prop({ default: false })
    readonly angularCoordinateFormat!: AngleUnit;

    @Prop({ default: false })
    readonly coordinateDisplayFormat!: CursorCoordinateUnit;

    @Prop({ default: 0 })
    readonly minValueForX!: number;

    @Prop({ default: 0 })
    readonly maxValueForX!: number;

    @Prop({ default: 0 })
    readonly minValueForY!: number;

    @Prop({ default: 0 })
    readonly maxValueForY!: number;

    get firstPointLatitudeId() {
        return MAPCALCULATIONS_FIRST_POINT_LATITUDE;
    }

    get firstPointLongitudeId() {
        return MAPCALCULATIONS_FIRST_POINT_LONGITUDE;
    }

    get secondPointLatitudeId() {
        return MAPCALCULATIONS_SECOND_POINT_LATITUDE;
    }

    get secondPointLongitudeId() {
        return MAPCALCULATIONS_SECOND_POINT_LONGITUDE;
    }

    get azimuthId() {
        return MAPCALCULATIONS_AZIMUTH;
    }

    /**
     * Градусы азимута
     * @property azimuthValue {string}
     */
    get azimuthValue() {
        return this.azimuth;
    }

    /**
     * Градусы азимута
     * @property azimuthValue {string}
     */
    set azimuthValue(value: string) {
        const d = parseFloat(value);
        if (isNaN(d) || (d < -360 || d > 360) || value.length > 11) {
            return;
        }
        this.inputDegreesValue({ id: this.azimuthId, value: value, type: 'angle' });
    }

    /**
     * Признак readonly поля Азимут
     * @property azimuthReadOnly {boolean}
     */
    get azimuthReadOnly() {
        return (this.actionId === MAPCALCULATIONS_INVERSE_ACTION);
    }

    /**
     * Валидатор азимута
     * @property azimuthRule {boolean}
     */
    get azimuthRule() {
        return [(v: string) => {
            const d = +v;
            return !isNaN(d) && (d >= -360 && d <= 360);
        }];
    }

    /**
     * Переключение обработчиков карты
     * @method toggleRegime
     */
    toggleRegime(id: string) {
        this.setState(MAPCALCULATIONS_ACTION_ID, id);
    }

    /**
     * Видимость формы обработчиков
     * @property geodeticFormVisible {boolean}
     */
    private get geodeticFormVisible() {
        return (
            this.actionId == MAPCALCULATIONS_DIRECT_ACTION ||
            this.actionId == MAPCALCULATIONS_INVERSE_ACTION
        );
    }

    readonly firstPointTitle = this.$t('phrases.First point coordinates');

    readonly secondPointTitle = this.$t('phrases.Second point coordinates');

    readonly azimuthTitle = this.$t('phrases.Azimuth');

    readonly distanceTitle = this.$t('phrases.Distance');

    readonly distanceUnitsTitle = this.$t('phrases.km');

    /**
     * Стиль текста вычисленных значений для MAPCALCULATIONS_DIRECT_ACTION
     * @property textBlueDirect {string}
     */
    get textBlueDirect() {
        return this.actionId === MAPCALCULATIONS_DIRECT_ACTION;
    }

    /**
     * Стиль текста вычисленных значений для MAPCALCULATIONS_INVERSE_ACTION
     * @property textBlueInverse {string}
     */
    get textBlueInverse() {
        return this.actionId === MAPCALCULATIONS_INVERSE_ACTION;
    }

    /**
     * Значение расстояния
     * @property distanceValue {string}
     */
    get distanceValue() {
        return this.distance;
    }

    /**
     * Значение расстояния
     * @property distanceValue {string}
     * @param value {string}, расстояние,km
     */
    set distanceValue(value: string) {
        if (!isNaN(+value)) {
            this.setState(MAPCALCULATIONS_DISTANCE, value);
        }
    }

    /**
     * Валидатор расстояния
     * @property distanceRule {boolean}
     */
    get distanceRule() {
        return [(v: number) => Number(v) >= 0 || this.$t('phrases.Enter the distance')];
    }

    /**
     * Ввод значений градусов
     * @property inputDegreesValue {DegreesMinutesSecondsData}
     */
    inputDegreesValue(value: DegreesMinutesSecondsData) {
        if (this.actionId === MAPCALCULATIONS_DIRECT_ACTION) {
            if (value.id == this.azimuthId) {
                this.setState(MAPCALCULATIONS_AZIMUTH, value.value);
            }
            if (value.id === this.firstPointLatitudeId) {
                this.setState(MAPCALCULATIONS_SET_POINTS, { value: value.value, degreesType: 'latitude', pointName: 'first' });
            }
            if (value.id === this.firstPointLongitudeId) {
                this.setState(MAPCALCULATIONS_SET_POINTS, { value: value.value, degreesType: 'longitude', pointName: 'first' });
            }
        }

        if (this.actionId === MAPCALCULATIONS_INVERSE_ACTION) {
            if (value.id === this.firstPointLatitudeId) {
                this.setState(MAPCALCULATIONS_SET_POINTS, { value: value.value, degreesType: 'latitude', pointName: 'first' });
            }
            if (value.id === this.firstPointLongitudeId) {
                this.setState(MAPCALCULATIONS_SET_POINTS, { value: value.value, degreesType: 'longitude', pointName: 'first' });
            }
            if (value.id === this.secondPointLatitudeId) {
                this.setState(MAPCALCULATIONS_SET_POINTS, { value: value.value, degreesType: 'latitude', pointName: 'second' });
            }
            if (value.id === this.secondPointLongitudeId) {
                this.setState(MAPCALCULATIONS_SET_POINTS, { value: value.value, degreesType: 'longitude', pointName: 'second' });
            }
        }
    }

    /**
     * Проверить значение числовых полей
     * @property onlyNumeric {number}
     * @param event {any}
     */
    onlyNumeric(event: any) {
        if (event.target) {
            if (event.target._value) {
                const regular = /^[-+]?[0-9]*\.?[0-9]*$/;
                const newValue = event.target._value.toString() + event.key.toString();
                if (!regular.test(newValue)) {
                    event.preventDefault();
                }
            }
        }
    }

    /**
     * Проверить систему координат
     * @property isMeter
     */
    get isMeter() {
        return this.coordinateDisplayFormat === CursorCoordinateUnit.Meter;

    }

    get isDegMinSec() {
        return this.coordinateDisplayFormat === CursorCoordinateUnit.DegreesMinutesSeconds;
    }


    get isDegrees() {
        return this.coordinateDisplayFormat === CursorCoordinateUnit.Degrees;
    }

    get isRadians() {
        return this.coordinateDisplayFormat === CursorCoordinateUnit.Radians;
    }

    get isDegMinSecAngle() {
        return this.angularCoordinateFormat === AngleUnit.DegreesMinutesSeconds;
    }

    get isDegreesAngle() {
        return this.angularCoordinateFormat === AngleUnit.Degrees;
    }

    /**
     * Валидатор для широты
     * @property latitudeRule {boolean}
     */
    get latitudeRule() {
        return [(v: string) => {
            const d = +v;
            return !isNaN(d) && (d >= this.minValueForX && d <= this.maxValueForX);
        }];
    }

    /**
     * Валидатор для долготы
     * @private
     * @property longitudeRule {boolean}
     */
    get longitudeRule() {
        return [(v: string) => {
            const d = +v;
            return !isNaN(d) && (d >= this.minValueForY && d <= this.maxValueForY);
        }];
    }

    /**
     * Получить широту первой точки
     * @property firstPointLatitudeValue {number}
     */
    get firstPointLatitudeValue() {
        return this.isMeter ? this.first_point_latitude.toFixed(2) : this.first_point_latitude.toFixed(6);
    }

    /**
     * Установить широту первой точки
     * @property firstPointLatitudeValue {string}
     * @param value {string}
     */
    set firstPointLatitudeValue(value: string) {
        const d = parseFloat(value);
        if (isNaN(d) || (d < this.minValueForX || d > this.maxValueForX) || value.length > this.maxLength) {
            return;
        }

        this.setState(MAPCALCULATIONS_SET_POINTS, { value: value, degreesType: 'latitude', pointName: 'first' });
    }

    /**
     * Получить долготу первой точки
     * @property firstPointLongitudeValue {number}
     */
    get firstPointLongitudeValue() {
        return this.isMeter ? this.first_point_longitude.toFixed(2) : this.first_point_longitude.toFixed(6);
    }

    /**
     * Установить долготу первой точки
     * @property firstPointLongitudeValue {string}
     * @param value {string}
     */
    set firstPointLongitudeValue(value: string) {
        const d = parseFloat(value);
        if (isNaN(d) || (d < this.minValueForY || d > this.maxValueForY) || value.length > this.maxLength) {
            return;
        }

        this.setState(MAPCALCULATIONS_SET_POINTS, { value: value, degreesType: 'longitude', pointName: 'first' });
    }

    /**
     * Получить широту второй точки
     * @property secondPointLatitudeValue {number}
     */
    get secondPointLatitudeValue() {
        return this.isMeter ? this.second_point_latitude.toFixed(2) : this.second_point_latitude.toFixed(6);
    }

    /**
     * Установить широту второй точки
     * @property secondPointLatitudeValue {string}
     * @param value {string}
     */
    set secondPointLatitudeValue(value: string) {
        const d = parseFloat(value);
        if (isNaN(d) || (d < this.minValueForX || d > this.maxValueForX) || value.length > this.maxLength) {
            return;
        }

        this.setState(MAPCALCULATIONS_SET_POINTS, { value: value, degreesType: 'latitude', pointName: 'second' });
    }

    /**
     * Получить долготу второй точки
     * @property secondPointLongitudeValue {number}
     */
    get secondPointLongitudeValue() {
        return this.isMeter ? this.second_point_longitude.toFixed(2) : this.second_point_longitude.toFixed(6);
    }

    /**
     * Установить долготу второй точки
     * @property secondPointLongitudeValue {string}
     * @param value {string}
     */
    set secondPointLongitudeValue(value: string) {
        const d = parseFloat(value);
        if (isNaN(d) || (d < this.minValueForY || d > this.maxValueForY) || value.length > this.maxLength) {
            return;
        }

        this.setState(MAPCALCULATIONS_SET_POINTS, { value: value, degreesType: 'longitude', pointName: 'second' });
    }

    /**
     * Признак readonly полей второй точки
     * @property secondPointReadOnly {boolean}
     */
    get secondPointReadOnly() {
        return this.actionId === MAPCALCULATIONS_DIRECT_ACTION;
    }

    /**
     * Суффикс для полей координат точек
     * @property pointsSuffix
     */
    get pointsSuffix() {
        return this.isMeter ? i18n.t('phrases.' + UnitText.MTR) : this.isDegrees ? '°' : '';
    }

    /**
     * Префикс для полей координат точек по оси X
     * @property pointXPrefix
     */
    get pointXPrefix() {
        return this.isMeter ? 'X: ' : 'L';
    }

    /**
     * Префикс для полей координат точек по оси Y
     * @property pointYPrefix
     */
    get pointYPrefix() {
        return this.isMeter ? 'Y: ' : 'B';
    }

    /**
     * Максимальная длина полей координат
     * @property maxLength
     */
    get maxLength() {
        return this.isMeter ? 14 : this.isRadians ? 8 : 11;
    }

    get angleSuffix() {
        return this.isDegreesAngle ? '°' : '';
    }

}
