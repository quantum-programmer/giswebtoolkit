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
import { GwtkMapMarksTaskState, MarkerTemplate, MARK_IMAGE_ID } from '@/components/GwtkMapMarks/task/GwtkMapMarksTask';

@Component
export default class GwtkIconsGallery extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapMarksTaskState>( key: K, value: GwtkMapMarksTaskState[K] ) => void;

    @Prop( { default: () => ([]) } )
    private readonly markerList!: MarkerTemplate[];

    @Prop( { default: '' } )
    private readonly selectedMarkerId!: string;

    @Prop( { default: '' } )
    private readonly markerColor!: string;

    get color() {
        return this.markerColor;
    }

    private getItemFlag( index: number ) {
        return this.markerList.findIndex( item => item.id === this.selectedMarkerId ) === index;
    }

    private getItemSrc( index: number ): string {
        return this.markerList[ index ].sld[ 0 ].image || '';
    }

    private selectMarker( index: number ) {
        this.setState( MARK_IMAGE_ID, this.markerList[ index ].id );
    }

}
