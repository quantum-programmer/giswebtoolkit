/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                            Набор индексов                        *
 *                                                                  *
 *******************************************************************/

export enum IndicesType {
    uByte = 'UNSIGNED_BYTE',
    uShort = 'UNSIGNED_SHORT',
    uInt = 'UNSIGNED_INT'
}

export type IndicesSerialized = {
    type: IndicesType;
}

/**
 * Класс набора индексов
 * @class Indices
 * @param type {IndicesType} Тип значений индексов
 */
export default class Indices {
    private type: IndicesType;
    private values: number[] = [];

    constructor( type: IndicesType ) {
        this.type = type;
    }

    private static readonly uByte = Math.pow( 2, 8 );
    private static readonly uShort = Math.pow( 2, 16 );
    private static readonly uInt = Math.pow( 2, 32 );

    /**
     * Добавить индекс
     * @method addSimpleIndex
     * @private
     * @param value{number} Индекс
     */
    private addSimpleIndex( value: number ) {
        if ( this.values && value >= 0 ) {
            this.values.push( value );
        }
    }

    /**
     * Задать массив индексов
     * @method setValues
     * @param values {array} Массив индексов
     */
    setValues( values: number[] ) {
        this.values = values;
    }

    /**
     * Добавить индексы
     * @method add
     * @param value{number|array} Индекс или массив индексов
     */
    add( value: number | number[] ) {
        if ( Array.isArray( value ) ) {
            for ( let i = 0; i < value.length; i++ ) {
                this.addSimpleIndex( value[ i ] );
            }
        } else {
            this.addSimpleIndex( value );
        }
    }


    /**
     * Получить тип значений индексов
     * @method getType
     * @return {IndicesType} Тип значений индексов
     */
    getType() {
        return this.type;
    }

    /**
     * Получить массив индексов
     * @method getValues
     * @return {array} Массив индексов
     */
    getValues() {
        return this.values;
    }

    /**
     * Валидация/изменение типа значения индекса
     * @method getValues
     * @param [maxValue] {number} Максимальное значение
     */
    validateType( maxValue?: number ) {
        let type;
        if ( maxValue === undefined ) {
            maxValue = 0;
            for ( let i = 0; i < this.values.length; i++ ) {
                const curValue = this.values[ i ];
                if ( curValue > maxValue ) {
                    maxValue = curValue;
                }
            }
        }

        if ( maxValue < Indices.uByte ) {
            type = IndicesType.uShort;
        } else if ( maxValue < Indices.uShort ) {
            type = IndicesType.uShort;
        } else if ( maxValue < Indices.uInt ) {
            type = IndicesType.uInt;
        } else {
            console.warn( 'Indices value out of range!' );
        }

        if ( type ) {
            this.type = type;
        }
    }

    /**
     * Получить копию объекта
     * @method toJSON
     * @return {IndicesSerialized} сериализуемый JSON объект
     */
    copy() {
        const result = new Indices( this.type );
        result.add( this.values );
        return result;
    }

    /**
     * Получить сериализуемый JSON объект
     * @method toJSON
     * @return {IndicesSerialized} сериализуемый JSON объект
     */
    toJSON(): IndicesSerialized {
        return {
            type: this.type
        };
    }

    /**
     * Создать новый объект из JSON объекта
     * @method fromJSON
     * @param json {IndicesSerialized} JSON объект
     */
    static fromJSON( json: IndicesSerialized ) {
        return new Indices( json.type );
    }
}
