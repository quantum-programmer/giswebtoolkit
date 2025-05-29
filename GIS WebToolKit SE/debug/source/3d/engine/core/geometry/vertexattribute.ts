/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Вершинный атрибут                            *
 *                                                                  *
 *******************************************************************/

import { AnyVector } from '~/3d/engine/core/Types';

export enum VertexAttributeType {
    Float = 'FLOAT',
    Byte = 'BYTE',
    Short = 'SHORT',
    uByte = 'UNSIGNED_BYTE',
    uShort = 'UNSIGNED_SHORT',
    uInt = 'UNSIGNED_INT'
}

export type AnyAttributeValue = number | AnyVector;

export type VertexAttributeSerialized = {
    name: string;
    type: VertexAttributeType;
    numberOfComponents: number;
}

/**
 * Класс вершинного атрибута
 * @class VertexAttribute
 * @param name {string} Название атрибута
 * @param type {VertexAttributeType} Тип атрибута
 * @param numberOfComponents {number} Тип атрибута
 */
export default class VertexAttribute {
    private readonly name: string;
    private readonly type: VertexAttributeType;
    private readonly numberOfComponents: number;
    private _values: AnyAttributeValue[] = [];

    constructor( name: string, type: VertexAttributeType, numberOfComponents: number ) {
        this.name = name;
        this.type = type;
        this.numberOfComponents = numberOfComponents;
    }

    /**
     * Получить массив вершин
     * @method getValues
     * @return {AnyAttributeValue[]} массив вершин
     */
    getValues() {
        return this._values;
    }

    /**
     * Задать массив вершин
     * @method setValues
     * @param values {AnyAttributeValue[]} массив вершин
     */
    setValues( values: AnyAttributeValue[] ) {
        this._values = values;
    }

    /**
     * Получить название атрибута
     * @method getName
     * @return {string} название атрибута
     */
    getName() {
        return this.name;
    }

    /**
     * Получить тип атрибута
     * @method getType
     * @return {VertexAttributeType} тип атрибута
     */
    getType() {
        return this.type;
    }

    /**
     * Получть количество составляющих атрибута вершин
     * @method getNumberOfComponents
     * @return {number} количество составляющих атрибута вершин
     */
    getNumberOfComponents() {
        return this.numberOfComponents;
    }

    /**
     * Получить копию объекта
     * @method copy
     * @public
     * @return {VertexAttribute} Копия объекта
     */
    copy() {
        const result = new VertexAttribute( this.name, this.type, this.numberOfComponents );
        result.setValues( this._values );
        return result;
    }

    /**
     * Получить сериализуемый JSON объект
     * @method toJSON
     * @return {VertexAttributeSerialized} сериализуемый JSON объект
     */
    toJSON(): VertexAttributeSerialized {
        return {
            name: this.name,
            type: this.type,
            numberOfComponents: this.numberOfComponents
        };
    }

    /**
     * Создать новый объект из JSON объекта
     * @method fromJSON
     * @param json {VertexAttributeSerialized} JSON объект
     */
    static fromJSON( json: VertexAttributeSerialized ) {
        return new VertexAttribute( json.name, json.type, json.numberOfComponents );
    }
}
