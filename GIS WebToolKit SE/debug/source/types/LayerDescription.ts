import Utils from '~/services/Utils';
import { GwtkLayerDescription, GwtkOptions } from '~/types/Options';
import { ServiceLink } from '~/services/Utils/Types';
import ColorMethods from '~/3d/engine/utils/colormethods';
import { Vector3D } from '~/3d/engine/core/Types';
import { vec3, vec4 } from '~/3d/engine/utils/glmatrix';


/**
 * Класс описания слоя
 * @param options{Object} Параметры слоя
 * @param defaults{Object} Параметры карты по умолчанию
 */
export default class LayerDescription {
    alias: string;
    hidden: boolean = false;
    duty: boolean = false;
    selectObject: boolean = false;
    waterColors?: Vector3D[];

    bbox = [-90, -180, 90, 180];

    origin: GwtkLayerDescription;
    tilematrixset: string;
    linkedUrls: ServiceLink[] = [];
    zIndex: number = 0;
    id: string;
    waterColorList?: (string | number)[];
    service: 'WMS' | 'WMTS' | 'FOLDER';
    isTiled: boolean;

    maxzoom: number;
    minzoom: number;

    keyssearchbyname: string[] = [];

    server: string;
    idLayer?: string;

    export: string[] = [];

    constructor( options: GwtkLayerDescription, defaults: GwtkOptions ) {
        this.tilematrixset = options[ 'tilematrixset' ] != null ? options[ 'tilematrixset' ] : defaults[ 'tilematrixset' ];

        this.origin = options;
        this.id = options[ 'id' ];
        this.waterColorList = options[ 'waterColors' ];

        this.alias = options[ 'alias' ] || 'Unknown';
        if ( options[ 'url' ].indexOf( 'S' ) === 0 ) {
            options[ 'url' ] = '?' + options[ 'url' ];
        }
        const link = Utils.parseUrl( options.url || '' );
        this.linkedUrls.push( link );
        if ( Array.isArray( options.linkedUrls ) ) {
            for ( let i = 0; i < options.linkedUrls.length; i++ ) {
                this.linkedUrls.push( Utils.parseUrl( options.linkedUrls[ i ] ) );
            }
        }

        this.service = 'WMS';
        const url = options.url.toLowerCase();
        if ( url.indexOf( '%z' ) >= 0 && url.indexOf( '%x' ) >= 0 && url.indexOf( '%y' ) >= 0 ) {
            this.service = 'WMTS';
        }
        if ( options.folder && options.folder.length > 0 ) {
            this.service = 'FOLDER';
        }

        this.isTiled = (this.service === 'WMTS') || options[ 'pkkmap' ] || options[ 'tilewms' ];

        // TODO: безобразие 2
        this.maxzoom = (options[ 'maxzoomview' ] != null && options[ 'maxzoomview' ] < 23) ? options[ 'maxzoomview' ] : defaults[ 'maxzoom' ];
        this.minzoom = (options[ 'minzoomview' ] != null && options[ 'minzoomview' ] > -1) ? options[ 'minzoomview' ] : defaults[ 'minzoom' ];

        //TODO: безобразие
        if ( this.minzoom === 2 && options[ 'minzoomview' ] == null ) {
            this.minzoom = 0;
        }
        if ( Array.isArray( options[ 'bbox' ] ) ) {
            this.bbox = options[ 'bbox' ];
        }
        if ( options[ 'selectObject' ] ) {
            this.selectObject = !!options[ 'selectObject' ];
        }


        if ( Array.isArray( options[ 'keyssearchbyname' ] ) ) {
            this.keyssearchbyname = options[ 'keyssearchbyname' ];
        }
        if ( Array.isArray( options[ 'export' ] ) ) {
            this.export = options[ 'export' ];
        }
        if ( options[ 'hidden' ] ) {
            this.hidden = !!options[ 'hidden' ];
        }

        this.server = link.origin + '/' + link.pathname;

        const params = Utils.getParamsFromURL( link.href );
        if ( params[ 'layer' ] ) {
            this.idLayer = params[ 'layer' ];
        } else if ( params[ 'layers' ] ) {
            this.idLayer = params[ 'layers' ];
        }
    }

    /**
     * Получить значение непрозрачности слоя
     * @method getOpacityValue
     * @public
     * @return {Number} Значение непрозрачности слоя (от 0 до 1.0)
     */
    getOpacityValue() {
        const opacityValue = this.origin.opacityValue || 100;
        return opacityValue / 100;
    }

    /**
     * Получить тип пирамиды тайлов
     * @method getTilematrixset
     * @public
     * @return {string} Тип пирамиды тайлов
     */
    getTilematrixset() {
        return this.tilematrixset;
    }

    /**
     * Загрузить цвета водной поверхности
     * @method _loadWaterColorTexture
     * @private
     */
    _loadWaterColorTexture() {
        if ( Array.isArray( this.waterColorList ) ) {
            this.waterColors = [];
            const waterColors = this.waterColors;
            const curColor4 = vec4.create();
            for ( let i = 0; i < this.waterColorList.length; i++ ) {
                const watercolor = this.waterColorList[ i ];
                if ( typeof watercolor === 'string' ) {
                    ColorMethods.RGBA( watercolor, 1.0, undefined, curColor4 );
                    waterColors.push( vec3.fromVector4( curColor4 ) );
                } else if ( this.linkedUrls[ 0 ] ) {
                    let src = this.linkedUrls[ 0 ].href;
                    const tilematrixset = this.tilematrixset;
                    src = src.replace( /%z/g, '10' );
                    src = src.replace( /%tilematrixset/g, tilematrixset );
                    if ( tilematrixset === 'EPSG:3857' ) {
                        src = src.replace( /%x/g, '182' );
                        src = src.replace( /%y/g, '25' );
                    } else {
                        src = src.replace( /%x/g, '730' );
                        src = src.replace( /%y/g, '100' );
                    }

                    const image = new Image();
                    image.crossOrigin = 'anonymus';
                    image.onload = function () {
                        const canvasWidth = 1;
                        const canvasHeight = 1;
                        // Создание изображения с текстом
                        const c = document.createElement( 'canvas' );
                        c.setAttribute( 'width', canvasWidth.toString() );
                        c.setAttribute( 'height', canvasHeight.toString() );
                        const ctx = c.getContext( '2d' );
                        if ( ctx ) {
                            ctx.drawImage( this as CanvasImageSource, 0, 0 );
                            const canvasData = ctx.getImageData( 0, 0, canvasWidth, canvasHeight );
                            const color = vec3.create();
                            vec3.setValues( color, canvasData.data[ 0 ] / 255, canvasData.data[ 1 ] / 255, canvasData.data[ 2 ] / 255 );
                            waterColors.push( color );
                        }
                    };
                    image.src = src;
                }
            }
        }
    }

    /**
     * Получить цвета водной поверхности
     * @return {array} Массив цветов водной поверхности
     */
    getWaterColors() {
        if ( this.waterColors === undefined ) {
            this._loadWaterColorTexture();
        }
        return this.waterColors;
    }
}