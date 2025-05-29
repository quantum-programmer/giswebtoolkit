/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Компонент "Список объектов карты"                 *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import {
    GwtkMapMarksTaskState,
    SELECT_MAP_OBJECT,
    REMOVE_MAP_OBJECT
} from '@/components/GwtkMapMarks/task/GwtkMapMarksTask';

import MapObject from '~/mapobject/MapObject';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';
import GwtkMapObjectItem
    from '@/components/GwtkMapMarks/components/GwtkMapObjectItem/GwtkMapObjectItem.vue';

import { PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG } from '~/utils/WorkspaceManager';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';

/**
 * Компонент "Список объектов карты"
 * @class GwtkMapObjectListWidget
 * @extends BaseGwtkVueComponent
 */
@Component( { components: { GwtkMapObjectItem } } )
export default class GwtkMapMarkListWidget extends BaseGwtkVueComponent {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapMarksTaskState>( key: K, value: GwtkMapMarksTaskState[K] ) => void;

    @Prop( { default: () => ([]) } )
    private readonly mapObjects!: MapObject[];

    @Prop( { default: () => ([]) } )
    private readonly selectedMapObjects!: string[];

    get isReducedSizeInterface() {
        return this.mapVue.getMap().workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
    }

    selectedObjectsCountTitle() {
        if ( this.selectedMapObjects.length > 0 ) {
            return '(' + this.selectedMapObjects.length + ')';
        }
        return '';
    }

    /**
     * Создать экземпляр расширенного описания объекта карты
     * @private
     * @method createMapObjectContent
     * @param mapObject {MapObject} Объект карты
     * @return {MapObjectContent} Экземпляр расширенного описания объекта карты
     */
    private createMapObjectContent( mapObject: MapObject ) {
        return new MapObjectContent( mapObject );
    }

    /**
     * Выбрать объект карты
     * @private
     * @method selectMapObject
     * @param mapObjectId {string} Идентификатор объекта карты
     */
    private selectMapObject( mapObjectId: string ) {
        this.setState( SELECT_MAP_OBJECT, mapObjectId );
    }

    private isSelected( mapObject: MapObject ) {
        return this.selectedMapObjects.find( id => id === mapObject.id ) !== undefined;
    }

    /**
     * Удалить объекты карты
     * @private
     * @method removeMapObject
     */
    private removeMapObject() {
        if ( this.selectedMapObjects.length > 0 ) {
            this.setState( REMOVE_MAP_OBJECT, true );
        }
    }

}
