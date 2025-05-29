/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Виджет задачи редактора                      *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkMyMapsTaskState,
    SET_LAYER,
    SET_SERVICE_URL,
    SET_VIRTUAL_FOLDER,
    UNDO_TRANSACTION,
    CREATE_LAYER,
    REMOVE_LAYER,
    SldTemplate,
    TemplateTab,
    SET_LAYER_VISIBILITY,
    RENAME_LAYER
} from '@/components/GwtkMyMaps/task/GwtkMyMapsTask';
import GwtkTemplatesGallery from '@/components/GwtkMyMaps/components/GwtkTemplatesGallery.vue';


/**
 * Виджет компонента
 * @class GwtkMyMapsWidget
 * @extends BaseGwtkVueComponent
 */
@Component( { components: { GwtkTemplatesGallery } } )
export default class GwtkMyMapsWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMyMapsTaskState>( key: K, value: GwtkMyMapsTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly buttons!: TaskDescription[];

    @Prop( { default: () => ([]) } )
    private readonly serviceList!: string[];

    @Prop( { default: '' } )
    private readonly selectedService!: string;

    @Prop( { default: () => ([]) } )
    private readonly virtualFolderList!: { id: string; text: string; }[];

    @Prop( { default: '' } )
    private readonly selectedVirtualFolderId!: string;

    @Prop( { default: () => ([]) } )
    private readonly layerList!: { id: string; text: string; }[];

    @Prop( { default: '' } )
    private readonly selectedLayerId!: string;

    @Prop( { default: true } )
    private readonly selectedLayerVisibility!: boolean;

    @Prop( { default: () => ([]) } )
    private readonly markerList!: SldTemplate[];

    @Prop( { default: '' } )
    private readonly selectedMarkerId!: string;

    @Prop( { default: '' } )
    private readonly selectedLineId!: string;

    @Prop( { default: '' } )
    private readonly selectedPolygonId!: string;

    @Prop( { default: () => ([]) } )
    private readonly lineList!: SldTemplate[];

    @Prop( { default: () => ([]) } )
    private readonly polygonList!: SldTemplate[];

    @Prop( { default: 0 } )
    private readonly selectedPointObjectsCount!: number;

    @Prop( { default: 0 } )
    private readonly selectedLineObjectsCount!: number;

    @Prop( { default: 0 } )
    private readonly selectedPolygonObjectsCount!: number;

    @Prop( { default: 'point' } )
    private readonly selectedTab!: TemplateTab;

    private get selectedLayerName(): string {
        let layerName = '';

        const layerItem = this.layerList.find( item => item.id === this.selectedLayerId );

        if ( layerItem ) {
            layerName = layerItem.text;
        }

        return layerName;
    }

    private get undoButton() {
        return this.buttons.find( button => button.id === UNDO_TRANSACTION );
    }

    private changeLayer( value: string ) {
        this.setState( SET_LAYER, value );
    }

    private changeLayerVisibility() {
        this.setState( SET_LAYER_VISIBILITY, !this.selectedLayerVisibility );
    }

    private changeLayerName( e: Event ) {
        e.stopPropagation();
        this.setState( RENAME_LAYER, undefined );
    }

    private createLayer() {
        this.setState( CREATE_LAYER, undefined );
    }

    private removeLayer() {
        this.setState( REMOVE_LAYER, this.selectedLayerName );
    }

    private changeServiceUrl( value: string ) {
        this.setState( SET_SERVICE_URL, value );
    }

    private changeVirtualFolder( value: string ) {
        this.setState( SET_VIRTUAL_FOLDER, value );
    }
}
