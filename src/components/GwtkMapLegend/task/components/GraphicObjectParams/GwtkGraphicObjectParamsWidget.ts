/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Виджет компонента "Легенда карты"                     *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {
    GwtkMapLegendTaskState,
    SET_CREATING_OBJECT_TYPE,
    UPDATE_PREVIEW_IMAGE,
    UPDATE_TEXT_TITLE,
    UPDATE_STYLES_ORDER,
} from '../../GwtkMapLegendTask';
import Layer from '~/maplayers/Layer';
import { LOCALE } from '~/types/CommonTypes';
import { BrowserService } from '~/services/BrowserService';
import Style from '~/style/Style';
import Fill, { FillOptions } from '~/style/Fill';
import Stroke, { StrokeOptions } from '~/style/Stroke';
import Hatch, { HatchOptions } from '~/style/Hatch';
import TextStyle, { TextOptions } from '~/style/TextStyle';
import Utils from '~/services/Utils';
import { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import MarkerStyle from '~/style/MarkerStyle';
import Draggable from 'vuedraggable';
import GwtkMarkerEditor from './MarkerIconsGallery/GwtkMarkerEditor.vue';
import { MapMarkersCommandsFlags, MarkerIcon, MarkerImageCategory } from '~/types/Types';

type STYLE = 'Stroke' | 'Fill' | 'Hatch';


@Component( { components: { Draggable, GwtkMarkerEditor } } )
export default class GwtkGraphicObjectParamsWidget extends BaseGwtkVueComponent {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapLegendTaskState>( key: K, value: GwtkMapLegendTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly mapLayer!: Layer;

    @Prop( { default: () => 0 } )
    private readonly creatingObjectType!: LOCALE;

    @Prop( { default: () => ([]) } )
    private readonly styleOptions!: Style[];

    @Prop( { default: false } )
    private readonly disabledTab!: boolean;

    @Prop( { default: () => ([]) } )
    private readonly markerImageList!: MarkerIcon[];

    @Prop( { default: () => ([]) } )
    private readonly markerCategoryList!: MarkerImageCategory[];

    @Prop( { default: () => ({}) } )
    private readonly mapMarkersCommands!: MapMarkersCommandsFlags;

    readonly legendLayers = ['Системный', 'Границы и ограждения', 'Водные объекты', 'слой 1', 'слой 2', 'слой 3', 'слой 4', 'слой 5', 'слой 6', 'слой 7', 'слой 8'];

    private readonly markerLocalGUID = 'm' + Utils.generateGUID();

    private get availableStyles() {

        switch ( this.creatingObjectType ) {
            case LOCALE.Plane:
                return [
                    { text: this.$t( 'phrases.Filling' ), value: 'Fill' },
                    { text: this.$t( 'phrases.Hatching' ), value: 'Hatch' },
                    { text: this.$t( 'phrases.Line' ), value: 'Stroke' }];
            case LOCALE.Line:
                return [{ text: this.$t( 'phrases.Line' ), value: 'Stroke' }];
            case LOCALE.Point:
            case LOCALE.Text:
            default:
                return [];
        }
    }

    private readonly openedPanels: number[] = [];

    private readonly defaultFillOptions = {
        color: BrowserService.getCssVariableColor( '--color-purple-03' ).color,
        opacity: 1
    };
    private readonly defaultStrokeOptions = {
        color: BrowserService.getCssVariableColor( '--v-secondary-base' ).color,
        opacity: 1
    };

    private readonly defaultTextOptions: TextOptions = {
        color: BrowserService.getCssVariableColor( '--color-purple-03' ).color,
        font: { family: 'Verdana', size: '16px', weight: 'normal' },
        contour: {},
        shadow: {}
    };

    private readonly defaultHatchOptions: HatchOptions = {
        color: BrowserService.getCssVariableColor( '--v-secondary-base' ).color,
        opacity: 1,
        angle: 45,
        step: '7px',
        width: '1px'
    };

    private readonly defaultTextTitle = 'text text text text';

    private readonly defaultMarkerId = DEFAULT_SVG_MARKER_ID;

    private textTitle = this.defaultTextTitle;

    private get lineTabDisabled(): boolean {
        return (this.creatingObjectType !== LOCALE.Line && this.disabledTab);
    }

    private get polygonTabDisabled(): boolean {
        return (this.creatingObjectType !== LOCALE.Plane && this.disabledTab);
    }

    private get pointTabDisabled(): boolean {
        return (this.creatingObjectType !== LOCALE.Point && this.disabledTab);
    }

    private get textTabDisabled(): boolean {
        return (this.creatingObjectType !== LOCALE.Text && this.disabledTab);
    }

    @Prop( { default: '' } )
    private readonly previewImageSrc!: string;

    private ver = 1;

    created() {
        // если нет стилей, то нечего редактировать - режим создания
        if ( !this.styleOptions.length ) {
            this.setGraphicObjectTypeLine();
        }
    }

    mounted() {
        const marker = this.styleOptions[ 0 ] && this.styleOptions[ 0 ].marker;
        if ( marker ) {
            this.changeMarkerType( 0 );
        }
    }

    get activeTab() {
        let value: number;
        switch ( this.creatingObjectType ) {
            case LOCALE.Line:
            case LOCALE.Plane:
            case LOCALE.Point:
            case LOCALE.Text:
                value = this.creatingObjectType;
                break;
            default:
                value = LOCALE.Line;
        }
        return value;
    }

    get isClassifierObject() {
        return this.creatingObjectType === LOCALE.Template;
    }

    get isTypeLine() {
        return this.creatingObjectType === LOCALE.Line;
    }

    get isTypePolygon() {
        return this.creatingObjectType === LOCALE.Plane;
    }

    get isTypePoint() {
        return this.creatingObjectType === LOCALE.Point;
    }

    get isTypeText() {
        return this.creatingObjectType === LOCALE.Text;
    }

    private setGraphicObjectTypeLine() {
        this.styleOptions.splice( 0 );
        this.styleOptions.push( new Style( { stroke: new Stroke( this.defaultStrokeOptions ) } ) );
        window.setTimeout( () => this.openedPanels.splice( 0, this.openedPanels.length, 0 ), 0 );//TODO: только так???

        this.setState( SET_CREATING_OBJECT_TYPE, LOCALE.Line );
    }

    private setGraphicObjectTypePolygon() {
        this.styleOptions.splice( 0 );
        this.styleOptions.push( new Style( { fill: new Fill( this.defaultFillOptions ) } ) );
        this.styleOptions.push( new Style( { stroke: new Stroke( this.defaultStrokeOptions ) } ) );
        window.setTimeout( () => this.openedPanels.splice( 0, this.openedPanels.length, 0 ), 0 );

        this.setState( SET_CREATING_OBJECT_TYPE, LOCALE.Plane );
    }

    private setGraphicObjectTypePoint() {
        this.styleOptions.splice( 0 );
        this.styleOptions.push( new Style( {
            marker: new MarkerStyle( {
                markerId: this.defaultMarkerId
            } )
        } ) );
        window.setTimeout( () => this.openedPanels.splice( 0, this.openedPanels.length, 0 ), 0 );
        this.changeMarkerType( 0 );

        this.setState( SET_CREATING_OBJECT_TYPE, LOCALE.Point );
    }

    private setGraphicObjectTypeText() {
        this.styleOptions.splice( 0 );
        this.styleOptions.push( new Style( { text: new TextStyle( this.defaultTextOptions ) } ) );
        this.textTitle = this.defaultTextTitle;

        this.setState( SET_CREATING_OBJECT_TYPE, LOCALE.Text );
        this.setState( UPDATE_TEXT_TITLE, this.textTitle );
    }


    private addStyle( style: STYLE ) {

        if ( style === 'Fill' ) {
            this.styleOptions.push( new Style( { fill: new Fill( this.defaultFillOptions ) } ) );
        }

        if ( style === 'Stroke' ) {
            this.styleOptions.push( new Style( { stroke: new Stroke( this.defaultStrokeOptions ) } ) );
        }

        if ( style === 'Hatch' ) {
            this.styleOptions.push( new Style( { hatch: new Hatch( this.defaultHatchOptions ) } ) );
        }

        this.setState( UPDATE_PREVIEW_IMAGE, undefined );
    }

    private setOpenedPanels( index: number ) {
        const itemIndex = this.openedPanels.findIndex( item => item === index );
        if ( itemIndex !== -1 ) {
            this.openedPanels.splice( itemIndex, 1 );

            this.openedPanels.forEach( ( value, itemIndex ) => {
                if ( value > index ) {
                    this.openedPanels[ itemIndex ] = value - 1;
                }
            } );
        }
    }

    private updateStroke( value: StrokeOptions, index: number ) {
        const style = { ...this.styleOptions[ index ], stroke: new Stroke( value ) };
        this.styleOptions.splice( index, 1, new Style( style ) );
        this.setState( UPDATE_PREVIEW_IMAGE, undefined );
    }

    private updateFill( value: FillOptions, index: number ) {
        const style = { ...this.styleOptions[ index ], fill: new Fill( value ) };
        this.styleOptions.splice( index, 1, new Style( style ) );
        this.setState( UPDATE_PREVIEW_IMAGE, undefined );
    }

    private updateHatch( value: HatchOptions, index: number ) {
        const style = { ...this.styleOptions[ index ], hatch: new Hatch( value ) };
        this.styleOptions.splice( index, 1, new Style( style ) );
        this.setState( UPDATE_PREVIEW_IMAGE, undefined );
    }

    private updateText( value: TextOptions, index: number ) {
        const style = { ...this.styleOptions[ index ], text: new TextStyle( value ) };
        this.styleOptions.splice( index, 1, new Style( style ) );
        this.setState( UPDATE_PREVIEW_IMAGE, undefined );
    }

    private removeStyle( index: number ) {
        this.setOpenedPanels( index );
        this.styleOptions.splice( index, 1 );
        this.setState( UPDATE_PREVIEW_IMAGE, undefined );
    }

    private getTitle( index: number ) {

        const style = this.styleOptions[ index ];
        let postfix = '';
        if ( style.fill ) {
            postfix = this.$t( 'phrases.Filling' ) as string;
        } else if ( style.stroke ) {
            postfix = this.$t( 'phrases.Line' ) as string;
        } else if ( style.hatch ) {
            postfix = this.$t( 'phrases.Hatching' ) as string;
        }

        return this.$t( 'phrases.Style' ) + ' ' + (index + 1) + (postfix ? ` (${postfix})` : '');
    }

    private updateOrder( { oldIndex, newIndex }: { oldIndex: number; newIndex: number; } ) {
        const listCopy = this.styleOptions.slice();
        const oldIndexItem = listCopy.splice( oldIndex, 1 )[ 0 ];
        listCopy.splice( newIndex, 0, oldIndexItem );

        this.setState( UPDATE_STYLES_ORDER, listCopy );
        this.ver++;
    }

    private changeMarkerType( index: number ) {

        const marker = this.styleOptions[ index ].marker;
        if ( marker ) {
            const defs = this.$refs[ 'graphicTemplatesDefs' ] as SVGDefsElement;
            if ( defs ) {
                const markerAttribute = defs.querySelector( '#' + this.markerLocalGUID );
                if ( markerAttribute && marker.markerDescription ) {
                    const image = marker.markerDescription.image;

                    if ( image ) {
                        if ( image[ 0 ] !== '<' ) {
                            let imageAttribute = markerAttribute.querySelector( 'image' );
                            if ( !imageAttribute ) {
                                imageAttribute = document.createElementNS( 'http://www.w3.org/2000/svg', 'image' );
                                markerAttribute.appendChild( imageAttribute );
                            }
                            imageAttribute.setAttribute( 'href', image );
                        } else {
                            const template = document.createElement( 'template' );
                            template.innerHTML = image.trim();

                            const svgImage = template.content.firstChild as SVGImageElement;
                            if ( svgImage ) {
                                markerAttribute.appendChild( svgImage );
                            }
                        }

                        const { width, height, refX, refY } = marker.markerDescription;

                        if ( width !== undefined && height !== undefined && refX !== undefined && refY !== undefined ) {
                            markerAttribute.setAttribute( 'viewBox', '0 0 ' + width + ' ' + height );
                            markerAttribute.setAttribute( 'refX', refX + '' );
                            markerAttribute.setAttribute( 'refY', refY + '' );
                            markerAttribute.setAttribute( 'markerWidth', width + '' );
                            markerAttribute.setAttribute( 'markerHeight', height + '' );
                        }

                        const svg = markerAttribute.querySelector( 'svg' );
                        if ( svg ) {
                            svg.remove();
                        }
                    }
                }
            }
        }


    }


}
