/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Стиль отображения штриховки                *
 *                                                                  *
 *******************************************************************/

import { CommonServiceSVG, SvgHatch } from '~/utils/GeoJSON';
import Utils from '~/services/Utils';


export type HatchOptions = {
    color?: string;
    opacity?: number;
    width?: string;
    angle?: number;
    step?: string;
}

/**
 * Стиль отображения штриховки
 * @class Hatch
 */
export default class Hatch {

    /**
     * Цвет штриховки
     * @readonly
     * @property {string} color
     */
    color?: string;

    /**
     * Прозрачность штриховки
     * @readonly
     * @property {number} opacity
     */
    opacity?: number;

    /**
     * Ширина штриховки
     * @readonly
     * @property {string} width
     */
    width?: string;

    /**
     * Угол наклона штриховки в градусах
     * @readonly
     * @property {number} angle
     */
    angle?: number;


    /**
     * Шаг штриховки
     * @readonly
     * @property {string} step
     */
    step?: string;

    get notEmpty(): boolean {
        return (this.color !== undefined) || (this.opacity !== undefined) || (this.width !== undefined) || (this.angle !== undefined) || (this.step !== undefined);
    }

    /**
     * @constructor Hatch
     * @param options {HatchOptions} Параметры штриховки
     */
    constructor( options?: HatchOptions ) {
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
            if ( options.angle !== undefined ) {
                this.angle = options.angle;
            }
            if ( options.step ) {
                this.step = options.step;
            }
        }
    }

    copy() {
        return Hatch.fromServiceSVG( this.toSVG() );
    }

    toServiceSVG(): CommonServiceSVG {
        return { type: 'HatchSymbolizer', ...this.toSVG() };
    }

    toSVG(): SvgHatch {
        const svgHatch: SvgHatch = {};

        svgHatch[ 'stroke' ] = this.color;
        if ( this.opacity !== undefined && this.opacity !== 1 ) {
            svgHatch[ 'stroke-opacity' ] = this.opacity;
        }
        svgHatch[ 'stroke-width' ] = this.width;
        svgHatch[ 'stroke-angle' ] = this.angle;
        svgHatch[ 'stroke-step' ] = this.step;

        return svgHatch;
    }

    static fromSVG( svgHatch: SvgHatch ) {

        const hatchOptions: HatchOptions = {};

        hatchOptions.color = svgHatch[ 'stroke' ];
        hatchOptions.opacity = svgHatch[ 'stroke-opacity' ];
        hatchOptions.width = svgHatch[ 'stroke-width' ];
        hatchOptions.angle = svgHatch[ 'stroke-angle' ];
        hatchOptions.step = svgHatch[ 'stroke-step' ];

        return new Hatch( hatchOptions );
    }

    static fromServiceSVG( svgHatch: SvgHatch ) {

        const hatchOptions: SvgHatch = {
            'stroke': svgHatch[ 'stroke' ],
            'stroke-opacity': Utils.toNumber( svgHatch[ 'stroke-opacity' ] ),
            'stroke-width': svgHatch[ 'stroke-width' ],
            'stroke-angle': Utils.toNumber( svgHatch[ 'stroke-angle' ] ),
            'stroke-step': svgHatch[ 'stroke-step' ]
        };

        return Hatch.fromSVG( hatchOptions );
    }
}
