/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Инструмент нанесения HTML элементов                *
 *                                                                  *
 *******************************************************************/

import { GwtkMap } from '~/types/Types';
import { IRenderer } from '~/renderer/types';

/**
 * Инструмент нанесения HTML элементов
 * @class HTMLrenderer
 */
export default class HTMLrenderer implements IRenderer<HTMLElement> {

    /**
     * HTML контейнер для нанесения информации
     * @private
     * @readonly
     * @property {HTMLDivElement} container
     */
    private readonly container: HTMLDivElement;

    /**
     * @constructor HTMLrenderer
     * @param map {GwtkMap} Экземпляр карты
     */
    constructor( map: GwtkMap ) {
        this.container = map.htmlRendererPanel;
    }

    destroy() {
        this.clear();
    }

    /**
     * Отрисовка данных
     * @method draw
     * @param renderableContent {HTMLElement} HTML элемент для добавления
     */
    draw( renderableContent: HTMLElement ) {
        this.container.appendChild( renderableContent );
    }

    /**
     * Очистить холст
     * @method clear
     */
    clear() {
        this.container.textContent = '';
    }
}
