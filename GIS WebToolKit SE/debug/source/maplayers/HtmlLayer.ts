/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Векторный слой локальный (HTML)                   *
 *                                                                  *
 *******************************************************************/

import { GwtkMap, LAYERTYPENAME } from '~/types/Types';
import { GwtkLayerDescription } from '~/types/Options';
import HTMLTooltipRenderable from '~/renderer/HTMLTooltipRenderable';
import RenderableLayer from '~/maplayers/RenderableLayer';


/**
 * Векторный слой локальный (HTML)
 * @class HtmlLayer
 * @extends RenderableLayer
 */
export default class HtmlLayer extends RenderableLayer {

    protected readonly mapObjectsViewer: HTMLTooltipRenderable;

    /**
     * @constructor HtmlLayer
     * @param map {GwtkMap} Экземпляр карты
     * @param options {Options} Параметры слоя
     * @param mapObjectsViewer {HTMLTooltipRenderable} Отрисовщик объекта карты
     */
    constructor( map: GwtkMap, options: GwtkLayerDescription, mapObjectsViewer?: HTMLTooltipRenderable ) {
        super( map, options );

        this.mapObjectsViewer = mapObjectsViewer || new HTMLTooltipRenderable();

        this.format = 'html';
    }


    get typeName() {
        return LAYERTYPENAME.html;
    }

    /**
     * Получение количества объектов
     * @method getMapObjectsCount
     * @return {number} Количество объектов карты
     */
    getMapObjectsCount(): number {
        return this.source.mapObjectsCount;
    }

    clear(): void {
        this.source.removeAllMapObjects();
        this.map.requestRender();
    }
}
