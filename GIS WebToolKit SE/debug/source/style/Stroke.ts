/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Стиль отображения линии                    *
 *                                                                  *
 *******************************************************************/

import { CommonServiceSVG, SvgStroke } from '~/utils/GeoJSON';
import Utils from '~/services/Utils';


export type StrokeOptions = {
    color?: string;
    opacity?: number;
    width?: string;
    dasharray?: string;
    linejoin?: 'mitre' | 'round' | 'bevel';
}

/**
 * Стиль отображения линии
 * @class Stroke
 */
export default class Stroke {

    /**
     * Цвет линии
     * @readonly
     * @property {string} color
     */
    color?: string;

    /**
     * Непрозрачность линии
     * @readonly
     * @property {number} opacity
     */
    opacity?: number;

    /**
     * Ширина линии
     * @readonly
     * @property {string} width
     */
    width?: string;

    /**
     * Параметр пунктира линии
     * @readonly
     * @property {string} dasharray
     */
    dasharray?: string;

    /**
     * Вид концов отрезков линии
     * @readonly
     * @property {string} linejoin
     */
    readonly linejoin: 'mitre' | 'round' | 'bevel' = 'round';

    get notEmpty(): boolean {
        return (this.color !== undefined) || (this.opacity !== undefined) || (this.width !== undefined) || (this.dasharray !== undefined);
    }

    /**
     * @constructor Stroke
     * @param options {StrokeOptions} Параметры линии
     */
    constructor( options?: StrokeOptions ) {
        if ( options ) {
            if ( options.color ) {
                this.color = options.color;
            }
            if ( options.opacity !== undefined ) {
                this.opacity = options.opacity;
            }
            if ( options.width ) {
                this.width = options.width;
            }
            if ( options.dasharray ) {
                this.dasharray = options.dasharray;
            }
            if ( options.linejoin ) {
                this.linejoin = options.linejoin;
            }
        }

    }

    copy() {
        return Stroke.fromServiceSVG( this.toSVG() );
    }

    toServiceSVG(): CommonServiceSVG {
        return { type: 'LineSymbolizer', ...this.toSVG() };
    }

    toSVG(): SvgStroke {
        const svgStroke: SvgStroke = {};

        svgStroke[ 'stroke' ] = this.color;
        if ( this.opacity !== undefined && this.opacity !== 1 ) {
            svgStroke[ 'stroke-opacity' ] = this.opacity;
        }
        svgStroke[ 'stroke-width' ] = this.width;
        if ( this.dasharray ) {
            const valueArray = this.dasharray.split( ' ' );
            if ( valueArray.length === 1 ) {
                valueArray.push( valueArray[ 0 ] );
            }

            svgStroke[ 'stroke-dasharray' ] = valueArray.join( ' ' );
        }
        svgStroke[ 'stroke-linejoin' ] = this.linejoin;

        return svgStroke;
    }

    static fromSVG( sldStroke: SvgStroke ) {

        const strokeOptions: StrokeOptions = {};

        strokeOptions.color = sldStroke[ 'stroke' ];
        strokeOptions.opacity = sldStroke[ 'stroke-opacity' ];
        strokeOptions.width = sldStroke[ 'stroke-width' ];
        strokeOptions.dasharray = sldStroke[ 'stroke-dasharray' ];
        strokeOptions.linejoin = sldStroke[ 'stroke-linejoin' ];

        return new Stroke( strokeOptions );
    }

    static fromServiceSVG( sldStroke: SvgStroke ) {
        const strokeOptions: SvgStroke = {
            'stroke': sldStroke[ 'stroke' ],
            'stroke-opacity': Utils.toNumber( sldStroke[ 'stroke-opacity' ] ),
            'stroke-width': sldStroke[ 'stroke-width' ],
            'stroke-dasharray': sldStroke[ 'stroke-dasharray' ]
        };

        return Stroke.fromSVG( strokeOptions );
    }
}
