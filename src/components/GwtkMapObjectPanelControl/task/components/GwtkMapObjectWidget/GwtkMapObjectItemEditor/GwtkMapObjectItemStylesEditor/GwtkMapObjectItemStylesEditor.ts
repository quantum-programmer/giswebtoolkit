/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *   Компонент "Редактирование стилей графического объекта карты"   *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import {
    EDIT_MAP_OBJECT_STYLE,
    GwtkMapObjectTaskState,
    REMOVE_MAP_OBJECT_STYLE
} from '@/components/GwtkMapObjectPanelControl/task/GwtkMapObjectTask';
import MapObject from '~/mapobject/MapObject';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import i18n from '@/plugins/i18n';
import { LogEventType } from '~/types/CommonTypes';


/**
 * Компонент "Редактирование стилей графического объекта карты"
 * @class GwtkMapObjectItemStylesEditor
 * @extends Vue
 */
@Component
export default class GwtkMapObjectItemStylesEditor extends BaseGwtkVueComponent {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapObjectTaskState>( key: K, value: GwtkMapObjectTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly mapObject!: MapObject;

    @Prop( { default: '' } )
    private readonly previewImageSrc!: string;

    private get hasSld() {
        return !!this.mapObject?.styles?.length;
    }

    private openEditGraphicObjectPanel() {
        this.setState( EDIT_MAP_OBJECT_STYLE, undefined );
    }

    private removeMapObjectStyle() {
        this.setState( REMOVE_MAP_OBJECT_STYLE, undefined );
    }

    private showCreateMapObjectStyleDialog() {
        this.mapVue.showInputText( {
            description: this.$t( 'mapobjectpanel.Adding a custom style will change the object type to graphic (it will be assigned a code of 0)' ) as string
        } ).then(
            () => this.openEditGraphicObjectPanel()
        ).catch( e => {
            this.mapVue.getMap().writeProtocolMessage( {
                text: i18n.tc( 'phrases.Map objects' ) + '. ' + i18n.tc( 'mapobjectpanel.Editing Styles for a Map Graphic Object' ) + '.',
                description: e,
                type: LogEventType.Error
            } );
        } );
    }
}
