/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Стиль отображения маркера                  *
 *                                                                  *
 *******************************************************************/


import Utils from '~/services/Utils';
import { CommonServiceSVG, SvgMarker } from '~/utils/GeoJSON';
import SVGrenderer, { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';


export type MarkerOptions = {
    markerId?: string;
    markerDescription?: {
        image?: string;
        path?: string;
        refX?: number;
        refY?: number;
        width?: number;
        height?: number;
        size?: '1'
    }
}

/**
 * Стиль отображения маркера
 * @class MarkerStyle
 */
export default class MarkerStyle {

    markerId = Utils.generateGUID();

    readonly markerDescription: {
        image?: string;
        path?: string;
        refX?: number;
        refY?: number;
        width?: number;
        height?: number;
    } | undefined;

    /**
     * @constructor MarkerStyle
     * @param options {MarkerOptions} Параметры маркера
     */
    constructor( options?: MarkerOptions ) {
        if ( !options ) {
            options = { markerId: DEFAULT_SVG_MARKER_ID };
        }

        if ( options.markerId ) {
            this.markerId = options.markerId;
        }

        const markerDescription = options.markerDescription || SVGrenderer.MARKER_DESCRIPTIONS.find( description => description.markerId === this.markerId );

        if ( markerDescription ) {
            let image = markerDescription.image || undefined;

            if ( image && image[ 0 ] === '<' ) {
                image = 'data:image/svg+xml;base64,' + window.btoa( image );
            }

            const path = markerDescription.path || undefined;
            const refX = markerDescription.refX;
            const refY = markerDescription.refY;
            const width = markerDescription.width;
            const height = markerDescription.height;
            if ( image !== undefined || path !== undefined || refX !== undefined || refY !== undefined || width !== undefined || height !== undefined ) {
                this.markerDescription = { image, path, refX, refY, width, height };
            }
        }
    }

    copy() {
        return MarkerStyle.fromServiceSVG( this.toSVG() );
    }

    toServiceSVG(): CommonServiceSVG {
        return { type: 'PointSymbolizer', ...this.toSVG() };
    }

    toSVG(): SvgMarker {
        const svgMarker: SvgMarker = {};

        let extension;

        if ( this.markerDescription ) {
            if ( this.markerDescription.image !== undefined ) {

                svgMarker[ 'image' ] = this.markerDescription.image;

                const regex = /^data:image\/([\w+]+);base64,/;
                let m = regex.exec( svgMarker[ 'image' ] );
                if ( m !== null ) {
                    extension = m[ 1 ];
                    if ( extension === 'svg+xml' ) {
                        extension = 'svg';
                    }
                    svgMarker[ 'image' ] = svgMarker[ 'image' ].replace( m[ 0 ], '' );
                }

            }

            if ( this.markerDescription.path !== undefined ) {
                svgMarker[ 'path' ] = this.markerDescription.path;
            }
            if ( this.markerDescription.refX !== undefined ) {
                svgMarker[ 'refX' ] = this.markerDescription.refX;
            }
            if ( this.markerDescription.refY !== undefined ) {
                svgMarker[ 'refY' ] = this.markerDescription.refY;
            }
            if ( this.markerDescription.width !== undefined ) {
                svgMarker[ 'width' ] = this.markerDescription.width;
            }
            if ( this.markerDescription.height !== undefined ) {
                svgMarker[ 'height' ] = this.markerDescription.height;
            }
        }

        if ( this.markerId ) {
            svgMarker[ 'markerId' ] = this.markerId;

            if ( extension ) {
                const m = /\.(\w+)$/.exec( svgMarker[ 'markerId' ] );
                if ( m === null || !m[ 1 ] ) {
                    svgMarker[ 'markerId' ] += '.' + extension;
                }
            }
        }

        return svgMarker;
    }

    static fromSVG( svgMarker: SvgMarker ) {

        let markerId = svgMarker.markerId || Utils.generateGUID();

        let image, path, refX, refY, width, height, size;

        if ( svgMarker[ 'image' ] ) {

            image = svgMarker[ 'image' ];

            //совместимость со старыми версиями, где были лишние заголовки
            let extension = 'png';
            const regex = /^data:image\/([\w+]+);base64,/;
            const m = /\.(\w+)$/.exec( markerId );
            if ( m !== null && m[ 1 ] ) {
                extension = m[ 1 ];
                if ( extension === 'svg' ) {
                    extension = 'svg+xml';
                }
            } else {
                const m = regex.exec( image );
                if ( m !== null ) {
                    extension = m[ 1 ];
                    markerId += '.' + extension;
                }
            }


            image = image.replace( regex, '' );

            if ( image[ 0 ] === '<' ) {
                image = 'data:image/svg+xml;base64,' + window.btoa( image );
            } else if ( image ) {
                image = `data:image/${extension};base64,` + image;
            }
        }

        if ( svgMarker[ 'path' ] ) {
            path = svgMarker[ 'path' ];
        }

        if ( svgMarker[ 'refX' ] !== undefined ) {
            refX = svgMarker[ 'refX' ];
        }

        if ( svgMarker[ 'refY' ] !== undefined ) {
            refY = svgMarker[ 'refY' ];
        }

        if ( svgMarker[ 'width' ] !== undefined ) {
            width = svgMarker[ 'width' ];
        }

        if ( svgMarker[ 'height' ] !== undefined ) {
            height = svgMarker[ 'height' ];
        }

        if ( svgMarker[ 'size' ] !== undefined ) {
            size = svgMarker[ 'size' ];
        }
        let markerDescription;
        if ( image !== undefined || path !== undefined || refX !== undefined || refY !== undefined || width !== undefined || height !== undefined || size !== undefined ) {
            markerDescription = { image, path, refX, refY, width, height, size };
        }

        const markerOptions: MarkerOptions = { markerId, markerDescription };


        return new MarkerStyle( markerOptions );
    }

    static fromServiceSVG( markerItems: SvgMarker ) {

        const markerOptions: SvgMarker = {
            markerId: markerItems.markerId,
            image: markerItems.image,
            path: markerItems.path,
            size: markerItems.size,
            refX: Utils.toNumber( markerItems.refX ),
            refY: Utils.toNumber( markerItems.refY ),
            width: Utils.toNumber( markerItems.width ),
            height: Utils.toNumber( markerItems.height ),
        };

        return MarkerStyle.fromSVG( markerOptions );
    }
}
