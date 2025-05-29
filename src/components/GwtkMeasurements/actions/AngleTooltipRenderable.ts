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
import HTMLTooltipRenderable from '~/renderer/HTMLTooltipRenderable';
import PixelPoint from '~/geometry/PixelPoint';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';


const Z_INDEX_FOR_TEXT_PANEL = '704';

/**
 * Объект отрисовки HTML элемента
 * @class HTMLTooltipRenderable
 */
export default class AngleTooltipRenderable extends HTMLTooltipRenderable {

    protected createNode( renderer: HTMLrenderer, mapObject: MapObject, style?: Style ): HTMLElement | undefined {

        const angleValue = mapObject.getSemantic( 'angle_value' )?.value;

        const textOffsetXSemantic = mapObject.getSemantic( 'text_offset_x' );
        const textOffsetX = textOffsetXSemantic ? +textOffsetXSemantic.value : 0;

        const textOffsetYSemantic = mapObject.getSemantic( 'text_offset_y' );
        const textOffsetY = textOffsetYSemantic ? +textOffsetYSemantic.value : 0;
        return AngleTooltipRenderable.createTooltipHtmlElement( renderer, textOffsetX, textOffsetY, mapObject, angleValue );
    }


    /**
     * Создание всплывающего элемента
     * @private
     * @static
     * @method createTooltipHtmlElement
     * @param renderer {HTMLrenderer} Инструмент рисования
     * @param textOffsetX {number} Смещение точки по X
     * @param textOffsetY {number} Смещение точки по Y
     * @param mapObject {MapObject} Объект карты
     * @param value {string} Значение измерения
     * @return {SVGGElement|undefined} SVG элемент рисования пути
     */
    private static createTooltipHtmlElement( renderer: HTMLrenderer, textOffsetX: number, textOffsetY: number, mapObject: MapObject, value?: string ): HTMLDivElement | undefined {
        if ( !value ) {
            return;
        }

        const pointCenterGeo = mapObject.getPoint( {} );
        if ( pointCenterGeo ) {
            const pointCenter = mapObject.vectorLayer.map.planeToPixel( pointCenterGeo );

            const point = new PixelPoint( pointCenter.x + textOffsetX, pointCenter.y + textOffsetY );

            if ( point ) {

                const element = document.createElement( 'div' );

                element.classList.add( 'pa-1' );

                element.style.display = 'flex';
                element.style.position = 'absolute';
                element.style.zIndex = Z_INDEX_FOR_TEXT_PANEL;

                element.style.backgroundColor = '#E0E0E0';
                element.style.borderRadius = '3px';
                element.style.border = '1px solid grey';
                element.style.cursor = 'default';

                const label = document.createElement( 'div' );
                label.style.color = 'red';
                label.style.fontSize = '12px';
                label.style.whiteSpace = 'nowrap';
                label.innerHTML = value;

                element.appendChild( label );

                const layerXId = mapObject.getSemantic( 'layer_xid' )?.value;
                const objectGmlIds = mapObject.getSemantic( 'object_gmlids' )?.value;
                if ( layerXId && objectGmlIds ) {

                    const button = document.createElement( 'button' );
                    button.title = 'X';

                    button.classList.add( 'button' );
                    button.classList.add( 'v-btn' );
                    button.classList.add( 'v-btn--plain' );
                    button.classList.add( 'v-btn--text' );
                    button.classList.add( 'v-size--x-small' );
                    button.classList.add( 'button_theme_secondary' );
                    button.classList.add( 'button_align_center' );
                    button.classList.add( 'pa-0' );

                    button.style.minWidth = 'unset';

                    button.onclick = () => {
                        const map = mapObject.vectorLayer.map;

                        map.closeLayer( mapObject.vectorLayer.xId );

                        const layer = map.getVectorLayerByxId( layerXId );
                        if ( layer instanceof GeoJsonLayer ) {
                            const objectGmlIdList = objectGmlIds.split( ',' );

                            objectGmlIdList.forEach( async ( gmlId ) => {
                                const mapObjectsIterator = layer.getMapObjectsIterator();
                                for ( const layerMapObject of mapObjectsIterator ) {
                                    if ( layerMapObject.gmlId === gmlId ) {
                                        await layerMapObject.delete();
                                        break;
                                    }
                                }
                            } );
                        }
                    };

                    const buttonSpan = document.createElement( 'span' );
                    buttonSpan.classList.add( 'v-btn__content' );

                    const buttonSpanIcon = document.createElement( 'i' );
                    buttonSpanIcon.classList.add( 'v-icon' );
                    buttonSpanIcon.classList.add( 'notranslate' );
                    buttonSpanIcon.classList.add( 'icon' );
                    buttonSpanIcon.classList.add( 'button__content' );
                    buttonSpanIcon.classList.add( 'button__content_icon' );
                    buttonSpanIcon.classList.add( 'mdi' );
                    buttonSpanIcon.classList.add( 'mdi-close' );

                    buttonSpan.appendChild( buttonSpanIcon );

                    button.appendChild( buttonSpan );

                    element.appendChild( button );
                }

                //Положение на экране
                const resultPoint = point;
                const windowHeight = mapObject.vectorLayer.map.getWindowSize()[ 1 ];

                element.style.left = resultPoint.x + 10 + 'px';
                element.style.bottom = windowHeight - resultPoint.y + 'px';

                return element;
            }
        }
    }

}
