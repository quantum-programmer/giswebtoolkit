/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Идентификаторы для 3D тайлов                  *
 *                                                                  *
 *******************************************************************/

/**
 * Класс общего идентификатора для 3D тайлов
 * @class CommonIdentifier
 * @param [level] {number} Уровень масштаба
 * @param [id] {string} Внешний идентификатор
 */
abstract class CommonIdentifier {
    private readonly level: number;
    private readonly id: number;
    private readonly str: string;
    protected static separator = '_';

    constructor( level: number, id: number ) {
        this.level = level;
        this.id = id;
        this.str = this.prefix + CommonIdentifier.separator + this.level + CommonIdentifier.separator + this.id;
    }

    /**
     * Общий префикс
     * @static
     * @property {string} prefix
     */
    protected get prefix() {
        return 'common';
    }

    /**
     * Получить внешний идентификатор
     * @method getId
     * @return {string} Внешний идентификатор
     */
    getId() {
        return this.id;
    }

    /**
     * Получить уровень масштаба
     * @method getLevel
     * @return {number} Номер уровень масштаба
     */
    getLevel() {
        return this.level;
    }

    /**
     * Проверить равенство
     * @method equals
     * @param other {CommonIdentifier} Идентификатор
     * @return {boolean} Флаг равенства идентификаторов
     */
    equals( other: CommonIdentifier ) {
        return this.level === other.level && this.id === other.id;
    }

    /**
     * Получить объект в виде строки
     * @method toString
     * @return {string} Объект в виде строки
     */
    toString() {
        return this.str;
    }
}

/**
 * Класс идентификатора материала для 3D тайлов
 * @class MaterialIdentifier
 * @constructor MaterialIdentifier
 * @param [level] {number} Уровень масштаба
 * @param [id] {string} Внешний идентификатор
 */
export class MaterialIdentifier extends CommonIdentifier {

    protected get prefix() {
        return 'material';
    }

    /**
     * Получить параметры из строки
     * @method fromString
     * @param value {string} Объект в виде строки
     */
    static fromString( value: string ): MaterialIdentifier {
        const items = value.split( this.separator );
        const level = parseInt( items[ 1 ] );
        const id = parseInt( items[ 2 ] );
        return new this( level, id );
    }

}

/**
 * Класс идентификатора текстуры для 3D тайлов
 * @class TextureIdentifier
 * @constructor TextureIdentifier
 * @param [level] {number} Уровень масштаба
 * @param [id]{string} Внешний идентификатор
 */
export class TextureIdentifier extends CommonIdentifier {

    protected get prefix() {
        return 'texture';
    }

    /**
     * Получить параметры из строки
     * @method fromString
     * @param value {string} Объект в виде строки
     */
    static fromString( value: string ): TextureIdentifier {
        const items = value.split( this.separator );
        const level = parseInt( items[ 1 ] );
        const id = parseInt( items[ 2 ] );
        return new this( level, id );
    }
}
