/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Объект отрисовки                           *
 *                                                                  *
 *******************************************************************/

import SVGrenderer, { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import Style from '~/style/Style';
import { LOCALE, SimpleJson } from '~/types/CommonTypes';
import { CommonServiceSVG, SvgMarker } from '~/utils/GeoJSON';
import Utils from '~/services/Utils';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import MarkerStyle from '~/style/MarkerStyle';
import TextStyle from '~/style/TextStyle';
import { IRenderable } from '~/renderer/types';

/**
 * Объект отрисовки
 * @class SVGrenderable
 */
export default class SVGrenderable implements IRenderable<SVGElement> {

    /**
     * Элементы группы SVG холста
     * @private
     * @readonly
     * @property {SVGGElement} contents
     */
    private readonly contents: SVGGElement;
    private readonly contentsId = Utils.generateGUID();

    constructor() {
        this.contents = document.createElementNS( SVGrenderable.SVG_NS, 'g' );
        this.contents.setAttributeNS( '', 'rid', this.contentsId );
    }

    /**
     * Установить непрозрачность объектов
     * @method setOpacity
     * @param value {string} CSS значение непрозрачности
     */
    setOpacity( value: string ) {
        this.contents.style.opacity = value;
    }


    /**
     * Отрисовка данных в инструменте рисования
     * @method drawRenderable
     * @param renderer {SVGrenderer} Инструмент рисования
     */
    drawRenderable( renderer: SVGrenderer ) {
        renderer.draw( this.contents );
    }

    /**
     * Удаление всех данных для отрисовки
     * @method clear
     */
    clear() {
        const children = this.contents.children;
        while ( children.length ) {
            this.contents.removeChild( children[ children.length - 1 ] );
        }
    }

    /**
     * Отрисовка объекта
     * @private
     * @method drawMapObject
     * @param renderer {SVGrenderer} Инструмент рисования
     * @param mapObject {MapObject} Объект карты
     * @param [style] {Style} Стили рисования
     */
    async drawMapObject( renderer: SVGrenderer, mapObject: MapObject, style?: Style ) {
        const pathElement = await SVGrenderable.createGroupNode( renderer, mapObject, style );
        if ( pathElement ) {
            this.contents.appendChild( pathElement );
        }
    }

    /**
     * Пространство имен SVG элементов
     * @private
     * @static
     * @readonly
     * @property {SVGGElement} SVG_NS
     */
    private static readonly SVG_NS = 'http://www.w3.org/2000/svg';

    /**
     * Приведение стиля к SVG атрибутам
     * @private
     * @static
     * @method toSvgStyles
     * @param style {Style} Объект стиля
     * @param local {LOCALE} Локализация объекта
     * @return {SimpleJson} JSON объект с SVG стилями
     */
    private static toSvgStyles( style: Style, local?: LOCALE ): CommonServiceSVG[] {
        let result: CommonServiceSVG[] = [], stroke, fill, marker, hatch, text;

        if ( style.stroke && style.stroke.notEmpty ) {
            stroke = style.stroke.toServiceSVG();
        }

        if ( style.fill && style.fill.notEmpty ) {
            fill = style.fill.toServiceSVG();
        }

        if ( style.marker ) {
            marker = style.marker.toServiceSVG();
        }

        if ( style.text ) {
            text = style.text.toServiceSVG();
        }
        if ( style.hatch && style.hatch.notEmpty ) {
            hatch = style.hatch.toServiceSVG();
        }

        switch ( local ) {
            case LOCALE.Line:
                if ( stroke ) {
                    result.push( stroke );
                }
                break;

            case LOCALE.Plane:

                if ( stroke ) {
                    result.push( stroke );
                }
                if ( fill ) {
                    result.push( fill );
                }
                if ( hatch ) {
                    result.push( hatch );
                }
                break;

            case LOCALE.Text:
                if ( stroke ) {
                    result.push( stroke );
                }
                if ( text ) {
                    result.push( text );
                }
                break;

            case LOCALE.Point:
                if ( marker ) {
                    result.push( marker );
                }
                break;
            default:
                if ( stroke ) {
                    result.push( stroke );
                }

                if ( fill ) {
                    result.push( fill );
                }

                if ( hatch ) {
                    result.push( hatch );
                }

                if ( text ) {
                    result.push( text );
                }

                if ( marker ) {
                    result.push( marker );
                }
        }

        return result;
    }

    /**
     * Создание группового узла SVG
     * @private
     * @static
     * @method toSvgStyles
     * @param renderer {SVGrenderer} Инструмент рисования
     * @param mapObject {MapObject} Объект карты
     * @param [style] {Style} Стили рисования
     * @return {SVGGElement|undefined} SVG элемент рисования пути
     */
    private static async createGroupNode( renderer: SVGrenderer, mapObject: MapObject, style?: Style ) {
        const points = mapObject.getPointListForDrawing();

        if ( points.length === 0 ) {
            return;
        }

        const svgGroup = document.createElementNS( SVGrenderable.SVG_NS, 'g' );
        svgGroup.style.pointerEvents = 'none';
        svgGroup.setAttributeNS( '', 'xid', mapObject.id );

        let objectStyles;

        if ( style ) {
            objectStyles = [style];
        } else if ( mapObject.styles ) {
            objectStyles = mapObject.styles;
        } else {
            objectStyles = [new Style( {
                stroke: new Stroke( { color: 'green', opacity: 0.75 } ),
                fill: new Fill( { color: 'transparent', opacity: 0 } ),
                marker: new MarkerStyle( { markerId: DEFAULT_SVG_MARKER_ID } ),
                text: new TextStyle( { color: 'black' } )
            } )];
        }
        const objectOptionsList: CommonServiceSVG[] = [];
        const local = await mapObject.getLocal();
        const type = mapObject.type;
        const pathString = renderer.pointsArray( points, type );

        objectStyles.forEach( style => objectOptionsList.push( ...SVGrenderable.toSvgStyles( style, local ) ) );

        objectOptionsList.forEach( objectOptions => {

            let strokeOptions, fill, hatch, textOptions, markerOptions;
            if ( objectOptions.type === 'LineSymbolizer' ) {
                strokeOptions = objectOptions;
            } else if ( objectOptions.type === 'PolygonSymbolizer' ) {
                fill = objectOptions;
            } else if ( objectOptions.type === 'HatchSymbolizer' ) {
                hatch = objectOptions;
            } else if ( objectOptions.type === 'TextSymbolizer' ) {
                textOptions = objectOptions;
            } else if ( objectOptions.type === 'PointSymbolizer' ) {
                markerOptions = objectOptions;
            }

            if ( strokeOptions ) {
                const path = document.createElementNS( SVGrenderable.SVG_NS, 'path' );
                svgGroup.appendChild( path );
                path.setAttributeNS( '', 'stroke', strokeOptions[ 'stroke' ] !== undefined ? strokeOptions[ 'stroke' ] : 'green' );
                path.setAttributeNS( '', 'stroke-opacity', '' + (strokeOptions[ 'stroke-opacity' ] !== undefined ? strokeOptions[ 'stroke-opacity' ] : 0.75) );
                path.setAttributeNS( '', 'stroke-width', strokeOptions[ 'stroke-width' ] !== undefined ? strokeOptions[ 'stroke-width' ] : '2px' );
                path.setAttributeNS( '', 'stroke-dasharray', strokeOptions[ 'stroke-dasharray' ] !== undefined ? strokeOptions[ 'stroke-dasharray' ] : 'none' );
                path.setAttributeNS( '', 'vector-effect', 'non-scaling-stroke' );
                path.setAttributeNS( '', 'd', pathString );
                path.setAttributeNS( '', 'background', '' );
                path.setAttributeNS( '', 'background-size', 'auto auto' );
                path.setAttributeNS( '', 'fill', 'transparent' );
                path.setAttributeNS( '', 'fill-opacity', '0' );
                path.setAttributeNS( '', 'class', 'vector-polyline' );
            }

            if ( fill ) {
                const pathFill = document.createElementNS( SVGrenderable.SVG_NS, 'path' );
                pathFill.setAttributeNS( '', 'vector-effect', 'non-scaling-stroke' );
                pathFill.setAttributeNS( '', 'd', pathString );
                pathFill.setAttributeNS( '', 'class', 'vector-polyline' );

                pathFill.setAttributeNS( '', 'fill', fill[ 'fill' ] !== undefined ? fill[ 'fill' ] : 'blue' );
                pathFill.setAttributeNS( '', 'fill-opacity', '' + (fill[ 'fill-opacity' ] !== undefined ? fill[ 'fill-opacity' ] : 0.75) );

                pathFill.setAttributeNS( '', 'fill-rule', 'evenodd' );  // Для изображения дырок
                svgGroup.appendChild( pathFill );
            }

            if ( hatch ) {
                const id = Utils.generateGUID();

                const step = hatch[ 'stroke-step' ] !== undefined ? hatch[ 'stroke-step' ] : '1';
                const opacity = hatch[ 'stroke-opacity' ] !== undefined ? hatch[ 'stroke-opacity' ] : 1;
                const width = hatch[ 'stroke-width' ] !== undefined ? hatch[ 'stroke-width' ] : '1px';
                const angle = -(hatch[ 'stroke-angle' ] !== undefined ? hatch[ 'stroke-angle' ] : 45);

                const pattern = document.createElementNS( SVGrenderable.SVG_NS, 'pattern' );
                pattern.setAttribute( 'id', id );
                pattern.setAttributeNS( '', 'width', step );
                pattern.setAttributeNS( '', 'height', step );
                pattern.setAttributeNS( '', 'patternTransform', 'rotate(' + angle + ' 0 0)' );
                pattern.setAttributeNS( '', 'patternUnits', 'userSpaceOnUse' );

                const line = document.createElementNS( SVGrenderable.SVG_NS, 'line' );
                line.setAttributeNS( '', 'x1', '0' );
                line.setAttributeNS( '', 'y1', '' + Math.ceil( parseFloat( step ) / 2 ) );
                line.setAttributeNS( '', 'x2', step );
                line.setAttributeNS( '', 'y2', '' + Math.ceil( parseFloat( step ) / 2 ) );
                line.setAttributeNS( '', 'stroke', hatch[ 'stroke' ] !== undefined ? hatch[ 'stroke' ] : 'green' );
                line.setAttributeNS( '', 'stroke-opacity', '' + opacity );
                line.setAttributeNS( '', 'stroke-width', width );

                pattern.appendChild( line );

                svgGroup.appendChild( pattern );

                const pathHatch = document.createElementNS( SVGrenderable.SVG_NS, 'path' );
                pathHatch.setAttributeNS( '', 'd', pathString );
                pathHatch.setAttributeNS( '', 'fill-rule', 'evenodd' );
                pathHatch.setAttributeNS( '', 'fill', 'url(#' + id + ')' );
                svgGroup.appendChild( pathHatch );
            }

            if ( textOptions ) {
                const textValue = Array.isArray( mapObject.title ) ? mapObject.title.join( ' ' ) : mapObject.title;
                if ( textValue ) {
                    const id = Utils.generateGUID();

                    const pathText = document.createElementNS( SVGrenderable.SVG_NS, 'path' );
                    pathText.setAttributeNS( '', 'vector-effect', 'non-scaling-stroke' );
                    pathText.setAttributeNS( '', 'd', pathString );
                    pathText.setAttributeNS( '', 'class', 'vector-polyline' );
                    pathText.setAttributeNS( '', 'fill', 'transparent' );
                    pathText.setAttributeNS( '', 'fill-opacity', '0' );
                    pathText.setAttribute( 'id', 'textPath_' + id );
                    svgGroup.appendChild( pathText );

                    //text
                    // if ( !textOptions[ 'writing-mode' ] ) {
                    if ( style ) {
                        pathText.setAttributeNS( '', 'stroke', textOptions[ 'stroke' ] !== undefined ? textOptions[ 'stroke' ] : 'black' );
                        pathText.setAttributeNS( '', 'stroke-width', textOptions[ 'stroke-width' ] !== undefined ? textOptions[ 'stroke-width' ] : '2px' );
                        pathText.setAttributeNS( '', 'vector-effect', 'non-scaling-stroke' );
                        pathText.setAttributeNS( '', 'class', 'vector-polyline' );
                    }
                    // }

                    const text = document.createElementNS( SVGrenderable.SVG_NS, 'text' );
                    if ( textOptions[ 'font-family' ] ) {
                        text.setAttributeNS( '', 'font-family', textOptions[ 'font-family' ] !== undefined ? textOptions[ 'font-family' ] : renderer.options[ 'font-family' ] );
                    }
                    if ( textOptions[ 'font-size' ] ) {
                        text.setAttributeNS( '', 'font-size', textOptions[ 'font-size' ] !== undefined ? textOptions[ 'font-size' ] : renderer.options[ 'font-size' ] );
                    }
                    // if ( textOptions[ 'letter-spacing' ] ) {
                    //     text.setAttributeNS( '', 'letter-spacing', textOptions[ 'letter-spacing' ] );
                    // }
                    text.setAttributeNS( '', 'letter-spacing', renderer.options[ 'letter-spacing' ] );
                    // if ( textOptions[ 'text-decoration' ] ) {
                    //     text.setAttributeNS( '', 'text-decoration', textOptions[ 'text-decoration' ] );
                    // }
                    text.setAttributeNS( '', 'text-decoration', renderer.options[ 'text-decoration' ] );
                    if ( textOptions[ 'font-style' ] ) {
                        text.setAttributeNS( '', 'font-style', textOptions[ 'font-style' ] !== undefined ? textOptions[ 'font-style' ] : renderer.options[ 'font-style' ] );
                    }
                    if ( textOptions[ 'font-weight' ] ) {
                        text.setAttributeNS( '', 'font-weight', textOptions[ 'font-weight' ] !== undefined ? textOptions[ 'font-weight' ] : renderer.options[ 'font-weight' ] );
                    }
                    if ( textOptions[ 'style' ] ) {
                        text.setAttribute( 'style', textOptions[ 'style' ] );
                    }
                    // if ( textOptions[ 'font-stretch' ] ) {
                    //     text.setAttributeNS( '', 'font-stretch', textOptions[ 'font-stretch' ] );
                    // }
                    text.setAttributeNS( '', 'font-stretch', renderer.options[ 'font-stretch' ] );
                    text.setAttributeNS( '', 'fill', textOptions[ 'fill' ] !== undefined ? textOptions[ 'fill' ] : 'black' );

                    if ( textOptions[ 'stroke' ] ) {
                        text.setAttributeNS( '', 'stroke', textOptions[ 'stroke' ] );
                    }

                    if ( textOptions[ 'stroke-width' ] ) {
                        text.setAttributeNS( '', 'stroke-width', textOptions[ 'stroke-width' ] + 'px' );
                    }

                    text.setAttributeNS( '', 'class', 'vector-polyline' );

                    // if ( !textOptions[ 'writing-mode' ] ) {
                    const textPath = document.createElementNS( SVGrenderable.SVG_NS, 'textPath' );
                    textPath.setAttributeNS( 'http://www.w3.org/1999/xlink', 'href', '#textPath_' + id );
                    // if ( textOptions[ 'startOffset' ] ) {
                    //     textPath.setAttributeNS( '', 'startOffset', textOptions[ 'startOffset' ] );
                    // }
                    textPath.setAttributeNS( '', 'startOffset', renderer.options[ 'startOffset' ] );

                    textPath.textContent = textValue;
                    text.appendChild( textPath );
                    // } else {
                    //     let x, y, mass = pathString.split( ' ' );
                    //     if ( mass && mass.length > 1 ) {
                    //         mass = mass[ 0 ].split( ',' );
                    //         if ( mass && mass.length > 1 ) {
                    //             x = mass[ 0 ].slice( 1 );
                    //             y = mass[ 1 ];
                    //         }
                    //     }
                    //     text.setAttributeNS( null, 'x', '' + x );
                    //     text.setAttributeNS( null, 'y', '' + y );
                    //     text.textContent = textValue;
                    //     text.innerHTML = textValue;
                    // }

                    svgGroup.appendChild( text );
                }
            }

            if ( markerOptions ) {
                // if ( type === MapObjectType.Point || type === MapObjectType.MultiPoint ) {
                // const rects = [];
                // const coords = pathString.split( /([^Mm\s]+)/ );
                // for ( let i = 0; i < coords.length; i++ ) {
                //     const rect = coords[ i ].split( ',' );
                //     if ( rect.length > 1 ) {
                //         rects.push( rect );
                //     }
                // }
                // const markerImage = markerOptions[ 'image' ];
                // if ( markerImage ) {
                //     for ( let i = 0; i < rects.length; i++ ) {
                //         var rpath = document.createElementNS( this.svgNS, 'rect' );
                //         rpath.setAttributeNS( '', 'x', parseFloat( rects[ i ][ 0 ] ) - markerImage[ 'rectX' ] * markerImage[ 'rectWidth' ] + '' );
                //         rpath.setAttributeNS( '', 'y', parseFloat( rects[ i ][ 1 ] ) - markerImage[ 'rectY' ] * markerImage[ 'rectHeight' ] + '' );
                //         rpath.setAttributeNS( '', 'rectX', parseFloat( markerImage[ 'rectX' ] ) + '' );
                //         rpath.setAttributeNS( '', 'rectY', parseFloat( markerImage[ 'rectY' ] ) + '' );
                //         rpath.setAttributeNS( '', 'pointX', rects[ i ][ 0 ] );
                //         rpath.setAttributeNS( '', 'pointY', rects[ i ][ 1 ] );
                //         rpath.setAttributeNS( '', 'width', markerImage[ 'rectWidth' ] + '' );
                //         rpath.setAttributeNS( '', 'height', markerImage[ 'rectHeight' ] + '' );
                //         rpath.setAttributeNS( '', 'class', 'vector-polyline' );
                //         rpath.setAttributeNS( '', 'style', 'fill-opacity:0;stroke-opacity:0' );
                //         rpath.setAttributeNS( '', 'id', this.prefixMarker + markerImage[ 'markerId' ] );
                //         rpath.style.pointerEvents = 'none';
                //         svgGroup.appendChild( rpath );
                //     }
                // }
                // }

                const markerId = markerOptions[ 'markerId' ];

                if ( markerOptions[ 'path' ] || markerOptions[ 'image' ] ) {

                    let defs = svgGroup.querySelector( 'defs' );
                    let appendDefsFlag = false;
                    if ( !defs ) {
                        defs = document.createElementNS( SVGrenderable.SVG_NS, 'defs' );
                        appendDefsFlag = true;
                    }

                    if ( renderer.addMarkerTemplate( markerOptions as SvgMarker, defs ) && appendDefsFlag ) {
                        svgGroup.appendChild( defs );
                    }
                }

                const pathMarker = document.createElementNS( SVGrenderable.SVG_NS, 'path' );
                pathMarker.setAttributeNS( '', 'vector-effect', 'non-scaling-stroke' );
                pathMarker.setAttributeNS( '', 'd', pathString );
                pathMarker.setAttributeNS( '', 'class', 'vector-polyline' );
                pathMarker.setAttributeNS( '', 'fill', 'transparent' );
                pathMarker.setAttributeNS( '', 'fill-opacity', '0' );

                svgGroup.appendChild( pathMarker );

                if ( type === MapObjectType.Point ) {
                    pathMarker.setAttributeNS( '', 'marker-start', 'url(#' + renderer.prefixMarker + markerId + ')' );
                    pathMarker.setAttributeNS( '', 'marker-end', 'url(#' + renderer.prefixMarker + markerId + ')' );
                } else {
                    pathMarker.setAttributeNS( '', 'marker-start', 'url(#' + renderer.prefixMarker + markerId + ')' );
                    pathMarker.setAttributeNS( '', 'marker-mid', 'url(#' + renderer.prefixMarker + markerId + ')' );
                    pathMarker.setAttributeNS( '', 'marker-end', 'url(#' + renderer.prefixMarker + markerId + ')' );
                }
            }
        } );

        return svgGroup;
    }

}
