/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Компонент "Описание объекта карты"                *
 *                                                                  *
 *******************************************************************/

import {Component, Prop, Vue} from 'vue-property-decorator';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';
import MapObject from '~/mapobject/MapObject';
import {MapObjectPanelState} from '~/taskmanager/TaskManager';

/**
 * Компонент "Описание объекта карты"
 * @class GwtkMapObjectItem
 * @extends Vue
 */
@Component
export default class GwtkMapObjectItem extends Vue {

    @Prop({default: () => ({})})
    readonly mapObjectContent!: MapObjectContent;

    @Prop({default: () => false})
    readonly showInMap!: boolean;

    @Prop({default: () => false})
    readonly selected!: boolean;

    @Prop({default: () => ([])})
    readonly reallySelectedObjects!: MapObject[];

    @Prop({default: 0})
    readonly clusteredObjectsCount!: number;

    @Prop({default: false})
    readonly editingMode!: boolean;

    @Prop({default: () => MapObjectPanelState.showObjects})
    readonly mapObjectsState!: MapObjectPanelState;

    @Prop( { default: false } )
    readonly isReducedSizeInterface!: boolean;

    get isReallySelected() {
        return this.reallySelectedObjects.find(mapObject =>
            (mapObject.vectorLayer.idLayer === this.mapObjectContent.mapObject.vectorLayer.idLayer)
            && (mapObject.vectorLayer.serviceUrl === this.mapObjectContent.mapObject.vectorLayer.serviceUrl)
            && (mapObject.gmlId === this.mapObjectContent.mapObject.gmlId)) !== undefined;
    }

    isShowSelectedObjects() {
        return this.mapObjectsState === MapObjectPanelState.showSelectedObjects;
    }

}
