/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Стиль отображения заливки                  *
 *                                                                  *
 *******************************************************************/

import { CommonServiceSVG, SvgFill } from '~/utils/GeoJSON';
import Utils from '~/services/Utils';


export type FillOptions = {
    color?: string;
    opacity?: number;
    rule?: 'nonzero' | 'evenodd';
}

/**
 * Стиль отображения заливки
 * @class Fill
 */
export default class Fill {

    /**
     * Цвет заливки
     * @readonly
     * @property {string} color
     */
    color?: string;

    /**
     * Прозрачность заливки
     * @readonly
     * @property {number} opacity
     */
    opacity?: number;

    /**
     * Правило заливки
     * @readonly
     * @property {string} rule
     */
    readonly rule: 'nonzero' | 'evenodd' = 'evenodd';

    get notEmpty(): boolean {
        return (this.color !== undefined) || (this.opacity !== undefined);
    }

    /**
     * @constructor Fill
     * @param options {FillOptions} Параметры заливки
     */
    constructor( options?: FillOptions ) {
        if ( options ) {
            if ( options.color ) {
                this.color = options.color;
            }
            if ( options.opacity !== undefined ) {
                this.opacity = options.opacity;
            }
            if ( options.rule ) {
                this.rule = options.rule;
            }
        }
    }

    copy() {
        return Fill.fromServiceSVG( this.toSVG() );
    }

    toServiceSVG(): CommonServiceSVG {
        return { type: 'PolygonSymbolizer', ...this.toSVG() };
    }

    toSVG(): SvgFill {
        const svgFill: SvgFill = {};

        svgFill[ 'fill' ] = this.color;
        if ( this.opacity !== undefined && this.opacity !== 1 ) {
            svgFill[ 'fill-opacity' ] = this.opacity;
        }

        return svgFill;
    }

    static fromSVG( svgFill: SvgFill ) {

        const fillOptions: FillOptions = {};

        fillOptions.color = svgFill[ 'fill' ];
        fillOptions.opacity = svgFill[ 'fill-opacity' ];

        return new Fill( fillOptions );
    }

    static fromServiceSVG( svgFill: SvgFill ) {

        const fillOptions: SvgFill = {
            'fill': svgFill[ 'fill' ],
            'fill-opacity': Utils.toNumber( svgFill[ 'fill-opacity' ] )
        };

        return Fill.fromSVG( fillOptions );
    }

}
