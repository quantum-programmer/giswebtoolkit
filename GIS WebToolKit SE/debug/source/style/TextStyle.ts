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
import { CommonServiceSVG, SvgText } from '~/utils/GeoJSON';

export type Contour = {
    color?: string;
    width?: string;
};

export type FontOptions = {
    family?: string;                                                  // имя шрифта
    style?: 'normal' | 'italic' | 'oblique';                          // стиль шрифта
    weight?: 'bold' | 'normal';                                       // насыщенность(толщина?) шрифта bold(полужирное)|normal(нормальное)
    size?: string;
}

export type Shadow = {
    color?: string;
    offset?: {
        x?: number;
        y?: number;
    }
};

export type TextOptions = {
    color?: string;
    contour?: Contour | null;
    font?: FontOptions | null;
    shadow?: Shadow | null;
} | null

/**
 * Стиль отображения текста
 * @class TextStyle
 */
export default class TextStyle {

    /**
     * Цвет текста
     * @readonly
     * @property {string} color
     */
    color: string = '#E756FF';

    /**
     * Стиль обводки текста
     * @readonly
     * @property {Contour} contour
     */
    contour: Contour = {};

    /**
     * Стиль шрифта
     * @readonly
     * @property {FontOptions} font
     */
    font: FontOptions | null = null;

    /**
     * Стиль тени
     * @readonly
     * @property {Shadow} shadow
     */
    shadow: Shadow = {};

    /**
     * @constructor TextStyle
     * @param options {StrokeOptions} Параметры текста
     */
    constructor( options?: TextOptions ) {
        if ( options ) {
            this.color = options.color || 'black';

            if ( options.contour ) {
                this.contour = { ...options.contour };
            }

            if ( options.font ) {
                this.font = { ...options.font };
            }

            if ( options.shadow ) {
                this.shadow = { ...options.shadow };
            }
        }
    }

    copy() {
        return TextStyle.fromServiceSVG( this.toSVG() );
    }

    toServiceSVG(): CommonServiceSVG {
        return { type: 'TextSymbolizer', ...this.toSVG() };
    }

    toSVG(): SvgText {
        const svgText: SvgText = {};
        if ( this.font ) {
            svgText[ 'font-family' ] = this.font.family;
            svgText[ 'font-style' ] = this.font.style;
            svgText[ 'font-weight' ] = this.font.weight;
            svgText[ 'font-size' ] = this.font.size;
        }
        svgText[ 'fill' ] = this.color;
        if ( this.contour ) {
            svgText[ 'stroke' ] = this.contour.color;
            svgText[ 'stroke-width' ] = this.contour.width;
        }

        if ( this.shadow ) {
            let offsetX = 0, offsetY = 0;
            if ( this.shadow.offset ) {
                if ( this.shadow.offset.x !== undefined ) {
                    offsetX = this.shadow.offset.x;
                }
                if ( this.shadow.offset.y !== undefined ) {
                    offsetY = this.shadow.offset.y;
                }
            }

            svgText[ 'style' ] = 'text-shadow: ' + offsetX + 'px ' + offsetY + 'px ' + this.shadow.color;
        }
        return svgText;
    }

    static fromSVG( svgText: SvgText ) {

        const textOptions: TextOptions = {
            shadow: {
                color: '#414141',
                offset: {
                    x: 0,
                    y: 0
                }
            }
        };

        if ( svgText[ 'fill' ] ) {
            textOptions.color = svgText[ 'fill' ];
        }

        if ( svgText[ 'stroke' ] && svgText[ 'stroke-width' ] ) {
            textOptions.contour = {
                color: svgText[ 'stroke' ],
                width: svgText[ 'stroke-width' ]
            };
        }

        if ( svgText[ 'style' ] ) {

            const array = svgText[ 'style' ]?.split( ' ' );

            if ( array && array.length === 4 ) {
                textOptions.shadow = {
                    color: array[ 3 ],
                    offset: {
                        x: parseInt( array[ 1 ], 10 ),
                        y: parseInt( array[ 2 ], 10 )
                    }
                };
            }
        }

        if ( svgText[ 'font-family' ] || svgText[ 'font-style' ] || svgText[ 'font-weight' ] || svgText[ 'font-size' ] ) {
            textOptions.font = {};
            if ( svgText[ 'font-family' ] ) {
                textOptions.font.family = svgText[ 'font-family' ];
            }

            if ( svgText[ 'font-style' ] ) {
                textOptions.font.style = svgText[ 'font-style' ];
            }

            if ( svgText[ 'font-weight' ] ) {
                textOptions.font.weight = svgText[ 'font-weight' ];
            }

            if ( svgText[ 'font-size' ] ) {
                textOptions.font.size = svgText[ 'font-size' ];
            }
        }

        return new TextStyle( textOptions );
    }

    static fromServiceSVG( textItems: SvgText ) {

        const textOptions: SvgText = {
            'font-family': textItems[ 'font-family' ],
            'font-style': textItems[ 'font-style' ],
            'font-weight': textItems[ 'font-weight' ],
            'font-size': textItems[ 'font-size' ],
            'fill': textItems[ 'stroke' ],
            'stroke': textItems[ 'text-shadow' ],
            'stroke-width': textItems[ 'stroke-width' ]
        };

        return TextStyle.fromSVG( textOptions );
    }
}
