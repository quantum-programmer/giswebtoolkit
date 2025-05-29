/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Компонент "Описание объекта метки"                *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';
import { CREATE_SHARE_URL, GwtkMapMarksTaskState } from '../../task/GwtkMapMarksTask';
import { PointSelector } from '~/mapobject/geometry/BaseMapObjectGeometry';


/**
 * Компонент "Описание объекта карты"
 * @class GwtkMapObjectItem
 * @extends Vue
 */
@Component
export default class GwtkMapObjectItem extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapMarksTaskState>( key: K, value: GwtkMapMarksTaskState[K] ) => void;
    
    @Prop( { default: () => ({}) } ) mapObjectContent!: MapObjectContent;

    @Prop( { default: false } ) selected!: boolean;

    get dataSrc() {
        let semValue = this.mapObjectContent.getSemanticValue( 'dataimage' );
        if ( !semValue ) {
            semValue = '';
        }
        return semValue;
    }

    get objectName() {
        return this.mapObjectContent.objectName;
    }

    get creationTime() {
        return this.mapObjectContent.getSemanticValue( 'creationTime' );
    }

    get creationTimeName() {
        const semantic = this.mapObjectContent.getSemantic( 'creationTime' );
        let name = 'Время создания';
        if ( semantic ) {
            name = semantic.name;
        }
        return name;
    }
    get mapPoint() {
        return this.mapObjectContent.getPoint(0 as PointSelector);
    }
    /**
    * Поделится меткой
    * @method shareMapmark
    */
    shareMapmark() {
        if (this.mapPoint) {
            this.setState(CREATE_SHARE_URL, {objectName: this.objectName || '', point: this.mapPoint });
        }
    }

    get shareTooltip() {
        return this.$t('phrases.Link');
    }
}
