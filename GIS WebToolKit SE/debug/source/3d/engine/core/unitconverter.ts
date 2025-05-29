/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *     Функции перевода между разными единицами измерения           *
 *                                                                  *
 *******************************************************************/

export enum Unit {
    Meters = 'MTR',
    SquareMeters = 'SMTR',
    Kilometers = 'KMT',
    SquareKilometers = 'SKMT',
    Miles = 'SMI',
    NauticalMiles = 'NMI',
    Foots = 'FOT',
    Hectares = 'HA'
}

export enum AngleUnit {
    Degrees = 'DEG',
    Radians = 'RAD',
    DegreesMinutesSeconds = 'DegMinSec'
}

export enum UnitText {
    MTR = 'm',
    KMT = 'km',
    SMI = 'ml',
    NMI = 'Nm',
    FOT = 'ft',
    SMTR = 'm²',
    SKMT = 'km²',
    HA = 'ha'

}


/**
 *  Функции перевода между между разными единицами измерения
 * @static
 * @class LengthUnitConverter
 */
export class LengthUnitConverter {
    private static readonly OneMeter = 1;
    private static readonly OneMile = 1609.344;
    private static readonly OneMileInv = 1 / 1609.344;
    private static readonly OneNauticalMile = 1852;
    private static readonly OneNauticalMileInv = 1 / 1852;
    private static readonly OneFoot = 1 / 3.2808398950131;
    private static readonly OneFootInv = 3.2808398950131;
    private static readonly OneKilometer = 1000;
    private static readonly OneKilometerInv = 1 / 1000;

    /**
     * Преобразование из указанной системы измерений в метры
     * @method fromUnits
     * @param value {number|array} Значение в единицах измерения
     * @param unit { Unit} Единицы измерения
     * @return {number|array} Значение в метрах
     */
    static fromUnits( value: number, unit: Unit ): number;
    static fromUnits( value: number[], unit: Unit ): number[];
    static fromUnits( value: number | number[], unit: Unit ) {
        if ( typeof value === 'number' ) {
            return this._fromUnits( value, unit );
        } else if ( Array.isArray( value ) ) {
            const copy = value.slice();
            for ( let i = 0; i < copy.length; i++ ) {
                copy[ i ] = this._fromUnits( copy[ i ], unit );
            }
            return copy;
        }
    }

    /**
     * Преобразование из исходной системы в указанные единицы измерений
     * @method toRadians
     * @param value {number|array} Значение в метрах (или исходных единицах)
     * @param unit { Unit} Единицы измерения
     * @param [sourceUnit] { Unit} Исходные единицы измерения
     * @return {number|array} Значение в единицах измерения
     */
    static toUnits( value: number, unit: Unit, sourceUnit?: Unit ): number;
    static toUnits( value: number[], unit: Unit, sourceUnit?: Unit ): number[];
    static toUnits( value: number | number[], unit: Unit, sourceUnit = Unit.Meters ) {
        if ( typeof value === 'number' ) {
            const unitValue = this._fromUnits( value, sourceUnit );
            return this._toUnits( unitValue, unit );
        } else if ( Array.isArray( value ) ) {
            const copy = value.slice();
            for ( let i = 0; i < copy.length; i++ ) {
                const curValue = this._fromUnits( copy[ i ], sourceUnit );
                copy[ i ] = this._toUnits( curValue, unit );
            }
            return copy;
        }
    }

    /**
     * Преобразование из указанной системы измерений в метры
     * @method _fromUnits
     * @private
     * @param value {number} Значение в единицах измерения
     * @param unit { Unit} Единицы измерения
     * @return {number|undefined} Значение в метрах
     */
    private static _fromUnits( value: number, unit: Unit ) {
        let result;
        switch ( unit ) {
            case Unit.Kilometers:
                result = value * this.OneKilometer;
                break;
            case Unit.Miles:
                result = value * this.OneMile;
                break;
            case Unit.NauticalMiles:
                result = value * this.OneNauticalMile;
                break;
            case Unit.Foots:
                result = value * this.OneFoot;
                break;
            case Unit.Meters:
            default:
                result = value * this.OneMeter;
        }
        return result;
    }

    /**
     * Преобразование из метров в указанные единицы измерений
     * @method _toUnits
     * @private
     * @param value {number} Значение в метрах
     * @param unit { Unit} Единицы измерения
     * @return {number|undefined} Значение в единицах измерения
     */
    private static _toUnits( value: number, unit: Unit ) {
        let result;
        switch ( unit ) {
            case Unit.Kilometers:
                result = value * this.OneKilometerInv;
                break;
            case Unit.Miles:
                result = value * this.OneMileInv;
                break;
            case Unit.NauticalMiles:
                result = value * this.OneNauticalMileInv;
                break;
            case Unit.Foots:
                result = value * this.OneFootInv;
                break;
            case Unit.Meters:
            default:
                result = value * this.OneMeter;
        }
        return result;
    }
}

/**
 *  Функции перевода между между разными единицами измерения площади
 * @static
 * @class AreaUnitConverter
 */
export class AreaUnitConverter {
    private static readonly OneSquareMeter = 1;
    private static readonly OneSquareKilometer = 1000000;
    private static readonly OneSquareKilometerInv = 1 / 1000000;
    private static readonly OneHectare = 100000;
    private static readonly OneHectareInv = 1 / 100000;

    /**
     * Преобразование из указанной системы измерений в квадратные метры
     * @method fromUnits
     * @param value {number|array} Значение в единицах измерения
     * @param unit { Unit} Единицы измерения
     * @return {number|array} Значение в квадратных метрах
     */
    static fromUnits( value: number, unit: Unit ): number;
    static fromUnits( value: number[], unit: Unit ): number[];
    static fromUnits( value: number | number[], unit: Unit ) {
        if ( typeof value === 'number' ) {
            return this._fromUnits( value, unit );
        } else if ( Array.isArray( value ) ) {
            const copy = value.slice();
            for ( let i = 0; i < copy.length; i++ ) {
                copy[ i ] = this._fromUnits( copy[ i ], unit );
            }
            return copy;
        }
    }

    /**
     * Преобразование из исходной системы в указанные единицы измерений
     * @method toRadians
     * @param value {number|array} Значение в метрах (или исходных единицах)
     * @param unit { Unit} Единицы измерения
     * @param [sourceUnit] { Unit} Исходные единицы измерения
     * @return {number|array} Значение в единицах измерения
     */
    static toUnits( value: number, unit: Unit, sourceUnit?: Unit ): number;
    static toUnits( value: number[], unit: Unit, sourceUnit?: Unit ): number[];
    static toUnits( value: number | number[], unit: Unit, sourceUnit = Unit.SquareMeters ) {
        if ( typeof value === 'number' ) {
            const unitValue = this._fromUnits( value, sourceUnit );
            return this._toUnits( unitValue, unit );
        } else if ( Array.isArray( value ) ) {
            const copy = value.slice();
            for ( let i = 0; i < copy.length; i++ ) {
                const curValue = this._fromUnits( copy[ i ], sourceUnit );
                copy[ i ] = this._toUnits( curValue, unit );
            }
            return copy;
        }
    }

    /**
     * Преобразование из указанной системы измерений в квадратные метры
     * @method _fromUnits
     * @private
     * @param value {number} Значение в единицах измерения
     * @param unit { Unit} Единицы измерения
     * @return {number|undefined} Значение в квадратных метрах
     */
    private static _fromUnits( value: number, unit: Unit ) {
        let result;
        switch ( unit ) {
            case Unit.SquareKilometers:
                result = value * this.OneSquareKilometer;
                break;
            case Unit.Hectares:
                result = value * this.OneHectare;
                break;
            case Unit.SquareMeters:
            default:
                result = value * this.OneSquareMeter;
        }
        return result;
    }

    /**
     * Преобразование из метров в указанные единицы измерений
     * @method _toUnits
     * @private
     * @param value {number} Значение в метрах
     * @param unit { Unit} Единицы измерения
     * @return {number|undefined} Значение в единицах измерения
     */
    private static _toUnits( value: number, unit: Unit ) {
        let result;
        switch ( unit ) {
            case Unit.SquareKilometers:
                result = value * this.OneSquareKilometerInv;
                break;
            case Unit.Hectares:
                result = value * this.OneHectareInv;
                break;
            case Unit.SquareMeters:
            default:
                result = value * this.OneSquareMeter;
        }
        return result;
    }
}

