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
    CREATE_STYLE,
    GwtkMyMapsTaskState,
    SELECT_TAB,
    SET_LINE_ID,
    SET_MARKER_ID,
    SET_POLYGON_ID,
    SldTemplate,
    TemplateTab
} from '@/components/GwtkMyMaps/task/GwtkMyMapsTask';
import { LOCALE } from '~/types/CommonTypes';

@Component
export default class GwtkTemplatesGallery extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMyMapsTaskState>( key: K, value: GwtkMyMapsTaskState[K] ) => void;

    @Prop( { default: () => ([]) } )
    private readonly markerList!: SldTemplate[];

    @Prop( { default: () => ([]) } )
    private readonly lineList!: SldTemplate[];

    @Prop( { default: () => ([]) } )
    private readonly polygonList!: SldTemplate[];

    @Prop( { default: '' } )
    private readonly selectedMarkerId!: string;

    @Prop( { default: '' } )
    private readonly selectedLineId!: string;

    @Prop( { default: '' } )
    private readonly selectedPolygonId!: string;

    @Prop( { default: 0 } )
    private readonly selectedPointObjectsCount!: number;

    @Prop( { default: 0 } )
    private readonly selectedLineObjectsCount!: number;

    @Prop( { default: 0 } )
    private readonly selectedPolygonObjectsCount!: number;

    @Prop( { default: 'point' } )
    private readonly selectedTab!: TemplateTab;

    private readonly pointButton = TemplateTab.Point;
    private readonly lineButton = TemplateTab.Line;
    private readonly polygonButton = TemplateTab.Polygon;

    private selectTab( value: TemplateTab ) {
        this.setState( SELECT_TAB, value );
    }

    private getTemplatesList(): SldTemplate[] {
        switch ( this.selectedTab ) {
            case TemplateTab.Point:
                return this.markerList;
            case TemplateTab.Line:
                return this.lineList;
            case TemplateTab.Polygon:
                return this.polygonList;
        }
        return [];
    }

    private getItemFlags( index: number ) {
        let selectedFlag = false;
        let disabledFlag = false;

        switch ( this.selectedTab ) {
            case TemplateTab.Point:
                selectedFlag = this.markerList.findIndex( marker => marker.id === this.selectedMarkerId ) === index;
                disabledFlag = this.selectedPointObjectsCount === 0;
                break;
            case TemplateTab.Line:
                selectedFlag = this.lineList.findIndex( line => line.id === this.selectedLineId ) === index;
                disabledFlag = this.selectedLineObjectsCount === 0;
                break;
            case TemplateTab.Polygon:
                selectedFlag = this.polygonList.findIndex( polygon => polygon.id === this.selectedPolygonId ) === index;
                disabledFlag = this.selectedPolygonObjectsCount === 0;
                break;
        }
        return [selectedFlag, disabledFlag];
    }

    private selectTemplate( index: number ) {
        switch ( this.selectedTab ) {
            case TemplateTab.Point:
                this.setState( SET_MARKER_ID, this.markerList[ index ].id );
                break;
            case TemplateTab.Line:
                this.setState( SET_LINE_ID, this.lineList[ index ].id );
                break;
            case TemplateTab.Polygon:
                this.setState( SET_POLYGON_ID, this.polygonList[ index ].id );
        }
    }

    private addStyle() {
        let locale: LOCALE | undefined = undefined;
        switch ( this.selectedTab ) {
            case TemplateTab.Point:
                locale = LOCALE.Point;
                break;
            case TemplateTab.Line:
                locale = LOCALE.Line;
                break;
            case TemplateTab.Polygon:
                locale = LOCALE.Plane;

        }
        if ( locale !== undefined ) {
            this.setState( CREATE_STYLE, locale );
        }
    }

}
