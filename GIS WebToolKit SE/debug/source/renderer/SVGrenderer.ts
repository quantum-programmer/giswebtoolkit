/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Инструмент SVG рисования                   *
 *                                                                  *
 *******************************************************************/

import { GwtkMap } from '~/types/Types';
import SVGdrawing from '~/renderer/SVGdrawing';
import { FeatureGeometry, SvgMarker } from '~/utils/GeoJSON';
import { SimpleJson } from '~/types/CommonTypes';
import { IRenderer } from '~/renderer/types';

export const DEFAULT_SVG_MARKER_ID = 'svgrenderable_id_';
export const DEFAULT_SMALL_SVG_MARKER_ID = 'svgrenderable_small_id_';
export const RED_CIRCLE_SVG_MARKER_ID = 'svgrenderable_red_circle_id_';
export const RED_CIRCLE_SMALL_SVG_MARKER_ID = 'svgrenderable_red_circle_small_id_';
export const GREEN_CIRCLE_SMALL_SVG_MARKER_ID = 'svgrenderable_green_circle_small_id_';
export const PURPLE_CIRCLE_SMALL_SVG_MARKER_ID = 'svgrenderable_purple_circle_small_id_';
export const BLUE_WHITE_CIRCLE_SVG_MARKER_ID = 'svgrenderable_blue_white_circle_id_';
export const GEOLOCATION_SVG_MARKER_ID = 'svgrenderable_geolocation_id_';
export const MAP_ROUTE_START_POINT_SVG_MARKER_ID = 'svgrenderable_maproutestartpoint_id_';
export const MAP_ROUTE_END_POINT_SVG_MARKER_ID = 'svgrenderable_maprouteendpoint_id_';
export const MAP_ROUTE_POINT_SVG_MARKER_ID = 'svgrenderable_maproutepoint_id_';
export const MAP_YANDEX_PANORAMA_MARKER_ID = 'svgrenderable_yandexpanorama_id_';
export const ROTATION_CENTER_SVG_MARKER_ID = 'svgrenderable_rotationcenter_id_';
export const LANDMARK_SVG_MARKER_ID = 'svgrenderable_landmark_id_';

/**
 * Инструмент SVG рисования
 * @class SVGrenderer
 */
export default class SVGrenderer implements IRenderer<SVGElement> {

    /**
     * SVG рендерер
     * @private
     * @readonly
     * @property {object} svgDrawing
     */
    private readonly svgDrawing: SVGdrawing;

    // параметры рисования по умолчанию
    readonly options: SimpleJson;


    static readonly MARKER_DESCRIPTIONS: SvgMarker[] = [
        {
            'markerId': DEFAULT_SVG_MARKER_ID,
            'refX': 19,
            'refY': 19,
            'width': 38,
            'height': 38,
            'image': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 13 38 38" width="38" height="38"><path stroke="#1672EC" stroke-width="6px" stroke-dasharray="none" stroke-opacity="0.85" fill="white" fill-opacity="0.8" pointer-events="none" d="M 3 32 a 1 1 0 0 0 32 0M 3 32 a 1 1 0 0 1 32 0"></path></svg>'
        },

        {
            'markerId': DEFAULT_SMALL_SVG_MARKER_ID,
            'refX': 12,
            'refY': 12,
            'width': 24,
            'height': 24,
            'image': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 13 38 38" width="24" height="24"><path stroke="#1672EC" stroke-width="6px" stroke-dasharray="none" stroke-opacity="0.85" fill="white" fill-opacity="0.8" pointer-events="none" d="M 3 32 a 1 1 0 0 0 32 0M 3 32 a 1 1 0 0 1 32 0"></path></svg>'
        },

        {
            'refX': 19,
            'refY': 19,
            'width': 38,
            'height': 38,
            'markerId': MAP_YANDEX_PANORAMA_MARKER_ID,
            'image': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 13 38 38" width="38" height="38"><path stroke="#1672EC" stroke-width="6px" stroke-dasharray="none" stroke-opacity="0.85" fill="white" fill-opacity="0.8" pointer-events="none" d="M 3 32 a 1 1 0 0 0 32 0M 3 32 a 1 1 0 0 1 32 0"></path></svg>'
            // 'image': '<img src="data:image/png;base64, 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"/>'
        },
        {
            'refX': 19,
            'refY': 19,
            'width': 38,
            'height': 38,
            'markerId': RED_CIRCLE_SVG_MARKER_ID,
            'image': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 13 38 38" width="38" height="38"><path stroke="red" stroke-width="6px" stroke-dasharray="none" stroke-opacity="0.85" fill="white" fill-opacity="0.8" pointer-events="none" d="M 3 32 a 1 1 0 0 0 32 0M 3 32 a 1 1 0 0 1 32 0"></path></svg>'
        },
        {
            'refX': 12,
            'refY': 12,
            'width': 24,
            'height': 24,
            'markerId': RED_CIRCLE_SMALL_SVG_MARKER_ID,
            'image': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 13 38 38" width="24" height="24"><path stroke="red" stroke-width="6px" stroke-dasharray="none" stroke-opacity="0.85" fill="white" fill-opacity="0.8" pointer-events="none" d="M 3 32 a 1 1 0 0 0 32 0M 3 32 a 1 1 0 0 1 32 0"></path></svg>'
        },
        {
            'refX': 12,
            'refY': 12,
            'width': 24,
            'height': 24,
            'markerId': GREEN_CIRCLE_SMALL_SVG_MARKER_ID,
            'image': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 13 38 38" width="24" height="24"><path stroke="green" stroke-width="6px" stroke-dasharray="none" stroke-opacity="0.85" fill="white" fill-opacity="0.8" pointer-events="none" d="M 3 32 a 1 1 0 0 0 32 0M 3 32 a 1 1 0 0 1 32 0"></path></svg>'
        },
        {
            'refX': 12,
            'refY': 12,
            'width': 24,
            'height': 24,
            'markerId': PURPLE_CIRCLE_SMALL_SVG_MARKER_ID,
            'image': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 13 38 38" width="24" height="24"><path stroke="#C200F2" stroke-width="6px" stroke-dasharray="none" stroke-opacity="1" fill="white" fill-opacity="1" pointer-events="none" d="M 3 32 a 1 1 0 0 0 32 0M 3 32 a 1 1 0 0 1 32 0"></path></svg>'
        },
        {
            'refX': 19,
            'refY': 19,
            'width': 38,
            'height': 38,
            'markerId': BLUE_WHITE_CIRCLE_SVG_MARKER_ID,
            'image': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 13 38 38" width="38" height="38"><path stroke="white" stroke-width="6px" stroke-dasharray="none" stroke-opacity="1" fill="#009BF2" fill-opacity="1" pointer-events="none" d="M 3 32 a 1 1 0 0 0 32 0M 3 32 a 1 1 0 0 1 32 0"></path></svg>'
        },
        {
            'refX': 28,
            'refY': 54,
            'width': 56,
            'height': 88,
            'markerId': GEOLOCATION_SVG_MARKER_ID,
            'image': '<svg xmlns="http://www.w3.org/2000/svg"><path stroke="#1672EC" stroke-width="6" stroke-dasharray="none" stroke-opacity="1.0" fill="white" fill-opacity="1.0" pointer-events="none" d="M32 10C40 10 46 18 46 24C46 32 40 38 32 38C24 38 18 32 18 24C18 18 24 10 32 10ZM32,38 L32,54"></path></svg>'
        },
        {
            'refX': 20,
            'refY': 22,
            'width': 32,
            'height': 32,
            'markerId': MAP_ROUTE_START_POINT_SVG_MARKER_ID,
            'image': '<svg xmlns="http://www.w3.org/2000/svg"><path stroke="null" id="svg_1" fill="#000000" d="m15.80941,29.8594c7.62663,0 13.80927,-6.2386 13.80927,-13.93426c0,-7.6958 -6.18264,-13.93442 -13.80927,-13.93442c-7.62677,0 -13.80941,6.23862 -13.80941,13.93442c0,7.69566 6.18264,13.93426 13.80941,13.93426zm0.0004,-7.05283c3.76622,0 6.8195,-3.08072 6.8195,-6.88102c0,-3.80031 -3.05328,-6.88106 -6.8195,-6.88106c-3.76622,0 -6.81934,3.08076 -6.81934,6.88106c0,3.80031 3.05312,6.88102 6.81934,6.88102z" clip-rule="evenodd" fill-rule="evenodd"></path><ellipse ry="8" rx="8" id="svg_2" cy="16" cx="15.8125" stroke="null" fill="#ffffff"></ellipse></svg>'
        },
        {
            'refX': 20,
            'refY': 22,
            'width': 32,
            'height': 32,
            'markerId': MAP_ROUTE_POINT_SVG_MARKER_ID,
            'image': '<svg xmlns="http://www.w3.org/2000/svg"><path stroke="#1672EC" stroke-width="4px" stroke-dasharray="none" stroke-opacity="1.0" fill="black" fill-opacity="1.0" pointer-events="none" d="M20.0004 35.9994C28.8367 35.9994 35.9999 28.8362 35.9999 20C35.9999 11.1637 28.8367 4.00049 20.0004 4.00049C11.1642 4.00049 4.00098 11.1637 4.00098 20C4.00098 28.8362 11.1642 35.9994 20.0004 35.9994ZM20.001 27.9015C24.3646 27.9015 27.902 24.3641 27.902 20.0006C27.902 15.637 24.3646 12.0996 20.001 12.0996C15.6375 12.0996 12.1001 15.637 12.1001 20.0006C12.1001 24.3641 15.6375 27.9015 20.001 27.9015Z"></path></svg>'
        },
        {
            'path': '',
            'refX': 24,
            'refY': 46,
            'width': 32,
            'height': 40,
            'markerId': MAP_ROUTE_END_POINT_SVG_MARKER_ID,
            'image': '<svg xmlns="http://www.w3.org/2000/svg"><path d="m19.66664,20.52497a5.23809,4.87499 0 0 1 -5.23809,-4.87499a5.23809,4.87499 0 0 1 5.23809,-4.87499a5.23809,4.87499 0 0 1 5.23809,4.87499a5.23809,4.87499 0 0 1 -5.23809,4.87499m0,-18.52497a14.66664,13.64998 0 0 0 -14.66664,13.64998c0,10.23748 14.66664,25.34996 14.66664,25.34996c0,0 13.83331,-14.94581 14.66664,-25.34996a14.66664,13.64998 0 0 0 -14.66664,-13.64998z" id="svg_1" stroke="null" fill="#bf0000"></path><path fill="#ffffff" opacity="undefined" d="m19.63219,20.66665c-2.99262,0 -5.41665,-2.20027 -5.41665,-4.91665c0,-2.71638 2.42402,-4.91665 5.41665,-4.91665c2.99262,0 5.41665,2.20027 5.41665,4.91665c0,2.71638 -2.42402,4.91665 -5.41665,4.91665z" id="svg_6" stroke="null"></path></svg>'
        },
        {
            'refX': 16,
            'refY': 16,
            'width': 32,
            'height': 32,
            'markerId': ROTATION_CENTER_SVG_MARKER_ID,
            'image': '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.9824 10.0571H14.6544V13.7291H10.9824V10.0571ZM11.9824 11.0571V12.7291H13.6544V11.0571H11.9824Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M13.6548 6.18193C16.2093 6.55187 18.2221 8.59491 18.5461 11.164H22.8177V12.8359H18.5152C18.1098 15.3043 16.1383 17.2453 13.6548 17.605V21.9983H11.9829V17.6045C9.50083 17.2437 7.53079 15.3033 7.12553 12.8359H2.82227V11.164H7.09462C7.41852 8.59593 9.42984 6.55349 11.9829 6.18237V2.00195H13.6548V6.18193ZM12.8204 15.9929C15.0844 15.9929 16.9198 14.1575 16.9198 11.8935C16.9198 9.62938 15.0844 7.79399 12.8204 7.79399C10.5563 7.79399 8.72091 9.62938 8.72091 11.8935C8.72091 14.1575 10.5563 15.9929 12.8204 15.9929Z" fill="#1672EC"/><path fill-rule="evenodd" clip-rule="evenodd" d="M22.8177 11.164V12.8359H18.5152C18.1098 15.3043 16.1383 17.2453 13.6548 17.605V21.9983H11.9829V17.6045C9.50083 17.2437 7.53079 15.3033 7.12553 12.8359H2.82227V11.164H7.09462C7.41852 8.59593 9.42984 6.55349 11.9829 6.18237V2.00195H13.6548V6.18193C16.2093 6.55187 18.2221 8.59491 18.5461 11.164H22.8177ZM19.3687 10.164H23.8177V13.8359H19.3088C18.6469 16.05 16.8843 17.7872 14.6548 18.4132V22.9983H10.9829V18.4124C8.75486 17.7856 6.99352 16.049 6.33193 13.8359H1.82227L1.82227 10.164H6.27202C6.88165 7.84969 8.684 6.02127 10.9829 5.37455V1.00195H14.6548V5.37369C16.9551 6.01965 18.7588 7.84867 19.3687 10.164ZM12.8204 14.9929C14.5322 14.9929 15.9198 13.6052 15.9198 11.8935C15.9198 10.1817 14.5322 8.79399 12.8204 8.79399C11.1086 8.79399 9.72091 10.1817 9.72091 11.8935C9.72091 13.6052 11.1086 14.9929 12.8204 14.9929ZM16.9198 11.8935C16.9198 14.1575 15.0844 15.9929 12.8204 15.9929C10.5563 15.9929 8.72091 14.1575 8.72091 11.8935C8.72091 9.62938 10.5563 7.79399 12.8204 7.79399C15.0844 7.79399 16.9198 9.62938 16.9198 11.8935Z" fill="white"/></svg>'
        },
        {
            'markerId': LANDMARK_SVG_MARKER_ID,
            'refX': 19,
            'refY': 19,
            'width': 38,
            'height': 38,
            'image': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 13 38 38" width="38" height="38"><path stroke="#F006D8" stroke-width="5px" stroke-dasharray="none" stroke-opacity="0.95" fill="white" fill-opacity="0.5" pointer-events="none" d="M 3 32 a 1 1 0 0 0 32 0M 3 32 a 1 1 0 0 1 32 0"></path></svg>'
        }
    ];

    /**
     * @constructor SVGrenderer
     * @param map {GwtkMap} Экземпляр карты
     */
    constructor( map: GwtkMap ) {

        this.svgDrawing = new SVGdrawing( map, map.vectorPane );

        SVGrenderer.MARKER_DESCRIPTIONS.forEach( description => this.svgDrawing.addMarkerTemplate( description ) );

        // параметры рисования по умолчанию
        this.options = {
            'font-family': 'Verdana',
            'font-size': '12px',
            'letter-spacing': '1',
            'startOffset': '0', //'2%',
            'stroke-dasharray': 'none',
            //		'text' : 'Текст по умолчанию'
            'text': '',
            'writing-mode': '',
            'text-shadow': '',
            'text-decoration': 'none',
            'font-style': GWTK.GRAPHIC.fontStyleDefault,     // стиль шрифта: normal | italic | oblique
            'font-weight': GWTK.GRAPHIC.fontWeightDefault,   // насыщенность(толщина?) шрифта bold(полужирное)|bolder|lighter|normal(нормальное)|100|200|300|400|500|600|700|800|900
            'font-stretch': GWTK.GRAPHIC.fontStretchDefault // начертание (condensed(узкоеЮ)|normal(нормальное)|expanded(широкое)

        };
    }

    destroy() {
        this.clear();
    }

    get prefixMarker() {
        return this.svgDrawing.prefixMarker;
    }

    get defsElements() {
        return this.svgDrawing.defsElements;
    }


    /**
     * Отрисовка данных
     * @method draw
     * @param renderableContent {SVGGElement} Элементы группы SVG холста
     */
    draw( renderableContent: SVGGElement ) {
        this.svgDrawing.addDrawingGroup( renderableContent );
    }

    /**
     * Очистить холст
     * @method clear
     */
    clear() {
        this.svgDrawing.reset();
    }

    pointsArray( coordinates: any & FeatureGeometry['coordinates'], svgType: string ) {
        return this.svgDrawing.pointsArray( coordinates, svgType );
    }

    /**
     * Добавление шаблонов маркеров в SVG
     * @method addMarkerTemplate
     * @public
     * @param markerOptions {SvgMarker} Параметры шаблона
     * @param [defs] {SVGDefsElement} Контейнер для шаблона
     */
    addMarkerTemplate( markerOptions: SvgMarker, defs?: SVGDefsElement ) {
        return this.svgDrawing.addMarkerTemplate( markerOptions, defs );
    }
}
