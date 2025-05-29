/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Стиль отображения                        *
 *                                                                  *
 *******************************************************************/

import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import { CommonServiceSVG } from '~/utils/GeoJSON';
import TextStyle from '~/style/TextStyle';
import MarkerStyle from '~/style/MarkerStyle';
import Hatch from '~/style/Hatch';


type StyleOptions = {
    stroke?: Stroke | null;
    fill?: Fill | null;
    hatch?: Hatch | null;
    text?: TextStyle | null;
    marker?: MarkerStyle | null;
}

/**
 * Стиль отображения
 * @class Style
 */
export default class Style {

    /**
     * Стиль отображения линии
     * @readonly
     * @property {Stroke} stroke
     */
    stroke: Stroke | null = null;


    /**
     * Стиль заливки
     * @readonly
     * @property {Fill} fill
     */
    fill: Fill | null = null;

    /**
     * Стиль штриховки
     * @readonly
     * @property {Hatch} hatch
     */
    hatch: Hatch | null = null;

    /**
     * Стиль текста
     * @readonly
     * @property {TextStyle} text
     */
    text: TextStyle | null = null;

    /**
     * Стиль маркера
     * @readonly
     * @property marker {MarkerStyle}
     */
    marker: MarkerStyle | null = null;


    /**
     * @constructor Style
     * @param options {StyleOptions} Параметры стиля
     */
    constructor( options?: StyleOptions ) {

        if ( options ) {
            if ( options.stroke ) {
                this.stroke = options.stroke;
            }

            if ( options.fill ) {
                this.fill = options.fill;
            }

            if ( options.hatch ) {
                this.hatch = options.hatch;
            }

            if ( options.text ) {
                this.text = options.text;
            }

            if ( options.marker ) {
                this.marker = options.marker;
            }
        }
    }

    /**
     * Получить копию объекта
     * @method copy
     * @return {Style} Копия объекта
     */
    copy() {
        const options: StyleOptions = {};
        if ( this.stroke ) {
            options.stroke = this.stroke.copy();
        }

        if ( this.fill ) {
            options.fill = this.fill.copy();
        }

        if ( this.hatch ) {
            options.hatch = this.hatch.copy();
        }

        if ( this.text ) {
            // options.text = this.text;
            options.text = this.text.copy();
        }

        if ( this.marker ) {
            // options.marker = this.marker;
            options.marker = this.marker.copy();
        }

        return new Style( options );
    }

    toServiceSVG(): CommonServiceSVG[] {

        const result = [];

        if ( this.stroke ) {
            result.push( this.stroke.toServiceSVG() );
        }

        if ( this.fill ) {
            result.push( this.fill.toServiceSVG() );
        }

        if ( this.hatch ) {
            result.push( this.hatch.toServiceSVG() );
        }

        if ( this.text ) {
            result.push( this.text.toServiceSVG() );
        }

        if ( this.marker ) {
            result.push( this.marker.toServiceSVG() );
        }

        return result;
    }

    static fromServiceSVG( svgStyle: CommonServiceSVG ) {
        const styleOptions: StyleOptions = {};

        switch ( svgStyle.type ) {
            case 'LineSymbolizer':
                styleOptions.stroke = Stroke.fromServiceSVG( svgStyle );
                break;
            case 'PolygonSymbolizer':
                styleOptions.fill = Fill.fromServiceSVG( svgStyle );
                break;
            case 'HatchSymbolizer':
                styleOptions.hatch = Hatch.fromServiceSVG( svgStyle );
                break;
            case 'TextSymbolizer':
                styleOptions.text = TextStyle.fromServiceSVG( svgStyle );
                break;
            case 'PointSymbolizer':
                styleOptions.marker = MarkerStyle.fromServiceSVG( svgStyle );
        }

        return new Style( styleOptions );
    }

    clear() {
        this.hatch = null;
        this.fill = null;
        this.stroke = null;
        this.text = null;
        this.marker = null;
    }
}
