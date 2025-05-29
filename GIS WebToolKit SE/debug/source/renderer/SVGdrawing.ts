/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Компонент векторная графика                       *
 *                                                                  *
 *******************************************************************/


import { GwtkMap } from '~/types/Types';
import { FeatureGeometry, SvgMarker } from '~/utils/GeoJSON';
import { vec4 } from '~/3d/engine/utils/glmatrix';
import Utils from '~/services/Utils';
import { MapPoint } from '~/geometry/MapPoint';
import PixelPoint from '~/geometry/PixelPoint';
import { Vector2or3 } from '~/3d/engine/core/Types';
import MarkerStyle from '~/style/MarkerStyle';
import { Point } from '~/geometry/Point';


/**
 * Компонент векторная графика
 * @class SVGdrawing
 */
export default class SVGdrawing {

    private readonly svgCanvasId = 'svg_' + Utils.generateGUID();

    private readonly svgCanvas: SVGSVGElement;
    private readonly svgCanvasGroup: SVGGElement;

    private svgCanvasRightGroup?: SVGUseElement;
    private svgCanvasLeftGroup ?: SVGUseElement;
    private readonly viewBox = vec4.create();

    private readonly svgNS = 'http://www.w3.org/2000/svg';

    private params = { 'do-not-repeat': false };

    readonly prefixMarker: string;

    get defsElements() {
        return (this.svgCanvas as SVGSVGElement).querySelector( ':scope>defs' )!;
    }

    /**
     * @constructor SVGdrawing
     * @param map {GwtkMap} Экземпляр карты
     * @param drawPanel {HTMLDivElement} Контейнер для SVG
     */
    constructor( readonly map: GwtkMap, private readonly drawPanel: HTMLDivElement ) {

        this.prefixMarker = 'marker_' + this.svgCanvasId;

        this.svgCanvas = document.createElementNS( this.svgNS, 'svg' );

        this.svgCanvas.setAttribute( 'id', this.svgCanvasId );
        this.svgCanvas.style.display = 'block';
        this.svgCanvas.style.position = 'absolute';
        this.svgCanvas.style.pointerEvents = 'none';
        this.svgCanvas.setAttribute( 'shape-rendering', 'optimizeSpeed' );
        this.svgCanvas.setAttribute( 'text-rendering', 'optimizeSpeed' );

        const windowRect = this.map.getWindowRect();
        this.svgCanvas.style.width = windowRect.width + 'px';
        this.svgCanvas.style.height = windowRect.height + 'px';

        this.viewBox[ 2 ] = windowRect.width;
        this.viewBox[ 3 ] = windowRect.height;
        this.svgCanvas.setAttribute( 'viewBox', this.viewBox.join( ' ' ) );

        const mainGroupName = 'mainGroup_' + this.svgCanvasId;
        this.svgCanvasGroup = document.createElementNS( this.svgNS, 'g' );
        this.svgCanvasGroup.setAttribute( 'id', mainGroupName );

        this.svgCanvas.appendChild( this.svgCanvasGroup );

        this.drawPanel.appendChild( this.svgCanvas );

        this.setupSVG();

        this.onResize = this.onResize.bind( this );
        window.addEventListener( 'resize', this.onResize );
    }

    /**
     * Удаление компонента
     * @method destroy
     */
    destroy(): void {
        this.svgCanvas.parentElement!.removeChild( this.svgCanvas );
        window.removeEventListener( 'resize', this.onResize );
    }

    /**
     * Настроить svg-холст
     * @method setupSVG
     */
    private setupSVG(): void {

        let needUpdate = false;

        // Переход на нужную точку
        const windowRect = this.map.getWindowRect();
        const point = new Point( windowRect.width / 2, windowRect.height / 2 );

        if ( this.viewBox[ 0 ] !== -point.x ) {
            this.viewBox[ 0 ] = -point.x;
            needUpdate = true;
        }
        if ( this.viewBox[ 1 ] !== -point.y ) {
            this.viewBox[ 1 ] = -point.y;
            needUpdate = true;
        }

        if ( this.viewBox[ 2 ] !== windowRect.width ) {
            this.svgCanvas.style.width = windowRect.width + 'px';
            this.viewBox[ 2 ] = windowRect.width;
            needUpdate = true;
        }

        if ( this.viewBox[ 3 ] !== windowRect.height ) {
            this.svgCanvas.style.height = windowRect.height + 'px';
            this.viewBox[ 3 ] = windowRect.height;
            needUpdate = true;
        }

        if ( needUpdate ) {
            this.svgCanvas.setAttribute( 'viewBox', this.viewBox.join( ' ' ) );
        }

        this.updateShadowCopies();
    }

    private onResize(): void {
        window.setTimeout( () => {
            this.setupSVG();
        }, 3 );
    }

    /**
     * Конвертирование координат в координаты svg-холста
     * @method convertCoordinates
     * @private
     * @param coordinates {Array} Одномерный массив координат
     * @returns {Point}
     */
    private convertCoordinates( coordinates: Vector2or3 ): PixelPoint {
        const plane = MapPoint.fromOriginArray( coordinates, this.map.ProjectionId );
        const place = this.map.planeToPixel( plane );

        place.x = +(place.x + this.viewBox[ 0 ]);
        place.y = +(place.y + this.viewBox[ 1 ]);

        return place;
    }

    /**
     * Очищает svg-холст
     * @method clearSVG
     */
    private clearSVG(): void {
        const children = this.svgCanvasGroup.children;
        while ( children.length ) {
            this.svgCanvasGroup.removeChild( children[ children.length - 1 ] );
        }
    }

    /**
     * Отрисовка данных
     * @method addDrawingGroup
     * @param renderableContent {SVGGElement} Элементы группы SVG холста
     */
    addDrawingGroup( renderableContent: SVGGElement ): void {
        this.svgCanvasGroup.appendChild( renderableContent );
    }

    /**
     * Добавление шаблонов маркеров в SVG
     * @method addMarkerTemplate
     * @public
     * @param markerOptions {SvgMarker} Параметры шаблона
     * @param [defs] {SVGDefsElement} Контейнер для шаблона
     */
    addMarkerTemplate( markerOptions: SvgMarker, defs: SVGDefsElement | null = null ): undefined | true {

        const SIZE_X = markerOptions[ 'width' ] || 32;
        const SIZE_Y = markerOptions[ 'height' ] || 32;
        const id = markerOptions[ 'markerId' ];
        defs = defs || this.svgCanvas.querySelector( 'defs' );
        if ( !defs ) {
            defs = document.createElementNS( this.svgNS, 'defs' );
            this.svgCanvas.appendChild( defs );
        }

        if ( document.getElementById( this.prefixMarker + id ) ) {
            return;
        }

        const scaleCurr = 1;

        const mW = SIZE_X * scaleCurr;
        const mH = SIZE_Y * scaleCurr;

        const width = SIZE_X * 2;
        const height = SIZE_Y * 2;

        const refX = markerOptions[ 'refX' ] || SIZE_X / 2;
        const refY = markerOptions[ 'refY' ] || SIZE_Y / 2;

        const marker = document.createElementNS( this.svgNS, 'marker' );
        marker.setAttribute( 'viewBox', '0 0' + ' ' + width + ' ' + height );
        marker.setAttribute( 'refX', '' + refX );
        marker.setAttribute( 'refY', '' + refY );
        marker.setAttribute( 'markerUnits', 'userSpaceOnUse' );
        marker.setAttribute( 'markerWidth', '' + mW );
        marker.setAttribute( 'markerHeight', '' + mH );
        marker.setAttributeNS( '', 'markerInitWidth', '' + SIZE_X );
        marker.setAttributeNS( '', 'markerInitHeight', '' + SIZE_Y );
        marker.setAttribute( 'id', this.prefixMarker + id );

        const style = MarkerStyle.fromServiceSVG( markerOptions );
        const imageSrc = style.markerDescription?.image;
        if ( imageSrc ) {
            if ( imageSrc[ 0 ] !== '<' ) {
                const rasterImage = document.createElementNS( 'http://www.w3.org/2000/svg', 'image' );
                rasterImage.setAttribute( 'href', imageSrc );
                marker.appendChild( rasterImage );
            } else {
                const template = document.createElement( 'template' );
                template.innerHTML = imageSrc.trim();

                const svgImage = template.content.firstChild as SVGImageElement;
                if ( svgImage ) {
                    const svgViewBox = svgImage.getAttributeNS( '', 'viewBox' );
                    if ( svgViewBox ) {
                        marker.setAttribute( 'viewBox', svgViewBox );
                    }
                    const svgWidth = svgImage.getAttributeNS( '', 'width' );
                    if ( svgWidth && markerOptions[ 'width' ] === undefined ) {
                        marker.setAttribute( 'width', svgWidth );
                        if ( markerOptions[ 'refX' ] === undefined ) {
                            marker.setAttribute( 'refX', +svgWidth / 2 + '' );
                        }
                    }
                    const svgHeight = svgImage.getAttributeNS( '', 'height' );
                    if ( svgHeight && markerOptions[ 'width' ] === undefined ) {
                        marker.setAttribute( 'height', svgHeight );
                        if ( markerOptions[ 'refY' ] === undefined ) {
                            marker.setAttribute( 'refY', +svgHeight / 2 + '' );
                        }
                    }

                    marker.appendChild( svgImage );
                }
            }
        }

        defs.appendChild( marker );
        return true;
    }

    /**
     * Обновление/создание теневых копий элементов
     * @method updateShadowCopies
     * @public
     */
    updateShadowCopies(): void {
        if ( this.svgCanvas ) {
            if ( !this.params[ 'do-not-repeat' ] ) {
                const matrix = this.map.tileMatrix.getTileMatrixSize( this.map.options.tilematrix );
                const dx = matrix.x;
                if ( !this.svgCanvasRightGroup ) {
                    this.svgCanvasRightGroup = document.createElementNS( this.svgNS, 'use' );
                    this.svgCanvasRightGroup.setAttribute( 'id', 'rightGroup' );
                    this.svgCanvasRightGroup.setAttribute( 'transform', 'translate(' + dx + ')' );
                    this.svgCanvas.appendChild( this.svgCanvasRightGroup );
                } else {
                    this.svgCanvasRightGroup.setAttribute( 'transform', 'translate(' + dx + ')' );
                }
                if ( !this.svgCanvasLeftGroup ) {
                    this.svgCanvasLeftGroup = document.createElementNS( this.svgNS, 'use' );
                    this.svgCanvasLeftGroup.setAttribute( 'id', 'leftGroup' );
                    this.svgCanvasLeftGroup.setAttribute( 'transform', 'translate(' + (-dx) + ')' );
                    this.svgCanvas.appendChild( this.svgCanvasLeftGroup );
                } else {
                    this.svgCanvasLeftGroup.setAttribute( 'transform', 'translate(' + (-dx) + ')' );
                }

                const mainGroupName = 'mainGroup_' + this.svgCanvasId + Math.random();
                this.svgCanvas.querySelector( 'g' )?.setAttribute( 'id', mainGroupName );
                this.svgCanvasRightGroup.setAttributeNS( 'http://www.w3.org/1999/xlink', 'href', '#' + mainGroupName );
                this.svgCanvasLeftGroup.setAttributeNS( 'http://www.w3.org/1999/xlink', 'href', '#' + mainGroupName );
            }
        }
    }

    /**
     * Формирование строки svg-координат
     * @method pointsArray
     * @private
     * @param coordinates {Array} Массив координат объекта
     * @param svgType {String} Тип geoJSON объекта
     * @returns {String} Результирующая строка координат
     */
    pointsArray( coordinates: any & FeatureGeometry[ 'coordinates' ], svgType: string ): string {
        let coords: any = coordinates.slice(),
            polygons = [];
        let lit = ',', level = 0;

        if ( svgType == 'point' || svgType == 'multipoint' ) {
            lit = 'M';
        }
        // Уровень вложенности
        while ( typeof coords === 'object' ) {
            if ( !Array.isArray( coords ) )
                break;
            coords = coords[ 0 ];
            level++;
        }
        // Восстанавливаем массив координат до 4-го уровня вложенности
        while ( level < 4 ) {
            coordinates = [coordinates];
            level++;
        }
        for ( let i = 0, iLen = coordinates.length; i < iLen; i++ ) {
            // Уровень polygon
            coords = coordinates[ i ];
            const lines = [];
            for ( let j = 0, jLen = coords.length; j < jLen; j++ ) {
                // Уровень line
                const pointsArray = [],
                    lineCoords = coords[ j ];
                for ( let ii = 0, iiLen = lineCoords.length; ii < iiLen; ii++ ) {
                    const place = this.convertCoordinates( lineCoords[ ii ] );
                    if ( place ) {
                        pointsArray.push( place[ 'x' ] + ',' + place[ 'y' ] + ' ' );
                    }
                }
                lines.push( pointsArray.join( lit ) );
            }
            polygons.push( lines.join( 'M' ) );
        }
        const result = 'M' + polygons.join( 'M' );
        return result.length > 1 ? result : '';
    }


    /**
     * Установить прозрачность
     * @param value
     */
    setOpacity( value: number ): void {
        this.svgCanvas.style.opacity = value + '';
    }


    /**
     * Очистить холст
     * @method reset
     */
    reset(): void {
        this.clearSVG();
        this.setupSVG();
    }
}


