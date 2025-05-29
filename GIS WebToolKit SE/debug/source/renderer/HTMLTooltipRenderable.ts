/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Объект отрисовки HTML элемента                      *
 *                                                                  *
 *******************************************************************/

import HTMLrenderer from '~/renderer/HTMLrenderer';
import MapObject from '~/mapobject/MapObject';
import Style from '~/style/Style';
import { IRenderable } from '~/renderer/types';

/**
 * Объект отрисовки HTML элемента
 * @class HTMLTooltipRenderable
 */
export default class HTMLTooltipRenderable implements IRenderable<HTMLElement> {

    /**
     * Содержимое
     * @private
     * @readonly
     * @property {HTMLElement[]} contents
     */
    private readonly contents: HTMLElement[] = [];

    /**
     * Установить непрозрачность объектов
     * @method setOpacity
     * @param value {string} CSS значение непрозрачности
     */
    setOpacity( value: string ) {
        this.contents.forEach( item => item.style.opacity = value );
    }

    /**
     * Удаление всех данных для отрисовки
     * @method clear
     */
    clear() {
        this.contents.splice( 0 );
    }

    /**
     * Отрисовка данных в инструменте рисования
     * @method drawRenderable
     * @param renderer {HTMLrenderer} Инструмент рисования
     */
    drawRenderable( renderer: HTMLrenderer ) {
        this.contents.forEach( element => renderer.draw( element ) );
    }

    /**
     * Обновление данных для отрисовки объекта
     * @private
     * @method updateMapObjectElement
     * @param renderer {SVGrenderer} Инструмент рисования
     * @param mapObject {MapObject} Объект карты
     * @param [style] {Style} Стили рисования
     */
    async drawMapObject( renderer: HTMLrenderer, mapObject: MapObject, style?: Style ) {
        const pathElement = this.createNode( renderer, mapObject, style );
        if ( pathElement ) {
            this.contents.push( pathElement );
        }
    }

    protected createNode( renderer: HTMLrenderer, mapObject: MapObject, style?: Style ): HTMLElement | undefined {
        return undefined;
    }

    /**
     * Обновление данных для отрисовки источника
     * @deprecated
     * @method update
     * @param renderer {HTMLrenderer} Инструмент рисования
     * @param htmlElements {HTMLDivElement[]} Массив Элементов HTML
     * @return {boolean} Флаг необходимости перерисовки
     */
    update( renderer: HTMLrenderer, htmlElements?: HTMLDivElement[] ) {
        this.clear();

        if ( htmlElements && htmlElements.length > 0 ) {
            for ( let numberElement = 0; numberElement < htmlElements.length; numberElement++ ) {
                this.contents.push( htmlElements[ numberElement ] );
            }
        }
    }
}
