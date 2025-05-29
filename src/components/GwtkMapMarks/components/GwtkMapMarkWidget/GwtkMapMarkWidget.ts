/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Виджет Метка карты                           *
 *                                                                  *
 *******************************************************************/
import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkMapMarksTaskState,
    MarkerTemplate,
    MARK_SAVE,
    MARK_NAME,
    MARK_COLOR,
    COMMENTS
} from '@/components/GwtkMapMarks/task/GwtkMapMarksTask';
import GwtkIconsGallery from '@/components/GwtkMapMarks/components/GwtkIconsGallery.vue';


@Component( { components: { GwtkIconsGallery } } )
export default class GwtkMapMarkWidget extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapMarksTaskState>( key: K, value: GwtkMapMarksTaskState[K] ) => void;

    @Prop( { default: '' } )
    private readonly markCoordinates!: string;

    @Prop( { default: '' } )
    private readonly markName!: string;

    @Prop( { default: '' } )
    private readonly markerColor!: string;

    @Prop( { default: {} } )
    private readonly markerList!: MarkerTemplate[];

    @Prop( { default: '' } )
    private readonly selectedMarkerId!: string;

    @Prop( { default: '' } )
    private readonly commentary!: string;

    get currentMarkName() {
        return this.markName;
    }

    set currentMarkName( value: string ) {
        this.setState( MARK_NAME, value );
    }

    namesRule = [
        ( v: string ) => { if ( !v ) return false; return v.length > 0;}
    ];

    saveMark() {
        this.setState( MARK_SAVE, true );
    }

    markReady() {
        return ( this.markName && this.markName.length > 0 && this.markCoordinates && this.markCoordinates.length > 0 );
    }

    changeMarkerColor( mode: { hex: string; }) {
        this.setState( MARK_COLOR, mode.hex );
    }

    changeComments( text: string) {
        this.setState( COMMENTS, text );
    }
}
