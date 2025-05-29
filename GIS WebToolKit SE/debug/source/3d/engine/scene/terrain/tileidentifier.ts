/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Идентификатор тайла                         *
 *                                                                  *
 *******************************************************************/
/**
 * Класс идентификатора тайла
 * @class TileIdentifier
 * @param [level] {number} Уровень масштаба
 * @param [x]{number} Номер столбца
 * @param [y] {number} Номер строки
 */
export default class TileIdentifier {

    private readonly level: number;
    private readonly x: number;
    private readonly y: number;
    private readonly str: string;

    private static separator = '_';

    constructor( level: number, x: number, y: number ) {
        this.level = level;
        this.x = x;
        this.y = y;
        this.str = this.level + TileIdentifier.separator + this.x + TileIdentifier.separator + this.y;
    }

    /**
     * Получить номер столбца
     * @method getX
     * @return {number} Номер столбца
     */
    getX() {
        return this.x;
    }

    /**
     * Получить номер строки
     * @method getY
     * @return {number} Номер строки
     */
    getY() {
        return this.y;
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
     * @param other {TileIdentifier} Идентификатор тайла
     * @return {boolean} Флаг равенства идентификаторов
     */
    equals( other: TileIdentifier ) {
        return this.level === other.level && this.x === other.x && this.y === other.y;
    }

    /**
     * Получить объект в виде строки
     * @method toString
     * @return {string} Объект в виде строки
     */
    toString() {
        return this.str;
    }

    /**
     * Получить параметры из строки
     * @method fromString
     * @param value {string} Объект в виде строки
     */
    static fromString( value: string ) {
        const items = value.split( TileIdentifier.separator );
        if ( items.length === 3 ) {
            const level = parseInt( items[ 0 ] );
            const x = parseInt( items[ 1 ] );
            const y = parseInt( items[ 2 ] );
            return new TileIdentifier( level, x, y );
        }
    }
}
