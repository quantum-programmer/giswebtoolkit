/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Направленный отрезок                          *
 *                                                                  *
 *******************************************************************/

/**
 * Класс направленного отрезка
 * @class Edge
 * @param index0 {number} Индекс начальной точки
 * @param index1 {number} Индекс конечной точки
 */
export default class Edge {
    private readonly index0: number;
    private readonly index1: number;

    constructor( index0: number, index1: number ) {
        this.index0 = index0;
        this.index1 = index1;
    }

    /**
     * Получить индекс начальной точки
     * @method getIndex0
     * @return {number} Индекс начальной точки
     */
    getIndex0() {
        return this.index0;
    }

    /**
     * Получить индекс конечной точки
     * @method getIndex1
     * @return {number} Индекс конечной точки
     */
    getIndex1() {
        return this.index1;
    }

    /**
     * Сравнение отрезков
     * @method equals
     * @param e {Edge} Отрезок
     * @return {boolean} Если `true`, то отрезки одинаковые
     */
    equals( e: Edge ) {
        return (this.index0 === e.getIndex0()) && (this.index1 === e.getIndex1());
    }
}

/**
 * Класс контейнера отрезков
 * @class EdgeList
 */
export class EdgeList {
    private collection: { [ key: number ]: Edge } = {};

    /**
     * Добавить отрезок в контейнер
     * @method add
     * @param edge {Edge} Добавляемый отрезок
     * @param i {number} Индекс отрезка
     */
    add( edge: Edge, i: number ) {
        this.collection[ i ] = edge;
    }

    /**
     * Проверка существования отрезка
     * @method tryGetValue
     * @param e {Edge} Искомый отрезок
     * @return {number|undefined} Индекс отрезка
     */
    tryGetValue( e: Edge ) {
        let i;
        for ( const k in this.collection ) {
            if ( this.collection[ k ] !== undefined && this.collection[ k ].equals( e ) ) {
                i = parseInt( k );
                break;
            }
        }
        return i;
    }
}
