/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Виджет компонента "Галерея изображений маркера"         *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkMapLegendTaskState,
    SET_MARKER_ICON,
    REMOVE_MARKER_ICON,
    UPLOAD_MARKER_ICON,
} from '../../../GwtkMapLegendTask';
import { MapMarkersCommandsFlags, MarkerImageCategory, MarkerIcon } from '~/types/Types';
import MarkerStyle from '~/style/MarkerStyle';
import GwtkMarkerIconsGallery from './GwtkMarkerIconsGallery.vue';
import Utils from '~/services/Utils';


@Component( { components: { GwtkMarkerIconsGallery } } )
export default class GwtkMarkerEditor extends Vue {
    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapLegendTaskState>( key: K, value: GwtkMapLegendTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly item!: MarkerStyle;

    @Prop( { default: () => ([]) } )
    private readonly markerImageList!: MarkerIcon[];

    @Prop( { default: () => ([]) } )
    private readonly markerCategoryList!: MarkerImageCategory[];

    @Prop( { default: () => ({}) } )
    private readonly mapMarkersCommands!: MapMarkersCommandsFlags;

    private onRefXUpdate( value: string ) {
        this.updateValue( { refX: +value } );
    }

    private onRefYUpdate( value: string ) {
        this.updateValue( { refY: +value } );
    }

    private onImageUpdate( value: MarkerStyle['markerDescription'] ) {

        // новый идентификатор, иначе сервис не обновит изображение
        const dotIndex = this.item.markerId.lastIndexOf( '.' );
        this.item.markerId = Utils.generateGUID() + (dotIndex !== -1 ? this.item.markerId.substring( dotIndex ) : '');

        this.updateValue( value );
    }

    private onImageRemove( value: string ) {
        this.setState( REMOVE_MARKER_ICON, value );
    }

    private onImageUpload( value: MarkerIcon ) {
        this.setState( UPLOAD_MARKER_ICON, value );
    }

    private updateValue( markerDescription: MarkerStyle['markerDescription'] ) {
        const value = {
            markerId: this.item.markerId,
            markerDescription: {
                ...this.item.markerDescription,
                ...markerDescription
            }
        };

        this.setState( SET_MARKER_ICON, value );
    }
}
