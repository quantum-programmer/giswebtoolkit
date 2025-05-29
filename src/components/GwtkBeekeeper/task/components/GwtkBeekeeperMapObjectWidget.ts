/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *    Компонент "Список объектов карты для компонента Пчеловоды"    *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import MapObject from '~/mapobject/MapObject';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';
import {
    FIND_NEXT_BEEKEEPER_MAP_OBJECTS,
    GwtkBeekeeperTaskState,
    HIGHLIGHT_BEEKEEPER_SELECTED_OBJECT, SELECT_MAP_OBJECT_AND_OPEN_BEEKEEPER_EDIT_PANEL
} from '@/components/GwtkBeekeeper/task/GwtkBeekeeperTask';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import GwtkBeekeeperMapObjectItem
    from '@/components/GwtkBeekeeper/task/components/GwtkBeekeeperMapObjectItem/GwtkBeekeeperMapObjectItem.vue';


/**
 * Компонент "Список объектов карты для компонента Пчеловоды"
 * @class GwtkBeekeepersMapObjectWidget
 * @extends BaseGwtkVueComponent
 */
@Component( {
    components: {
        GwtkBeekeeperMapObjectItem
    }
} )
export default class GwtkBeekeeperMapObjectWidget extends BaseGwtkVueComponent {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkBeekeeperTaskState>( key: K, value:GwtkBeekeeperTaskState[K] ) => void;

    @Prop( { default: () => ([]) } )
    mapObjects!: MapObject[];

    @Prop( { default: 0 } )
    foundMapObjectsNumber!: number;

    @Prop( { default: () => ([]) } )
    selectedMapObject!: string[];

    @Prop( { default: false } )
    showMapObjectsUpdateOverlay!: boolean;

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
     * Запросить следующую порцию объектов
     * @private
     * @method findNext
     */
    private findNext() {
        this.setState( FIND_NEXT_BEEKEEPER_MAP_OBJECTS, undefined );
    }

    /**
     * Сделать выборку объекта из списка и выделить на карте
     * @private
     * @method selectAndDrawBeekeeperObject
     * @param mapObjectId {string} Идентификатор объекта карты
     */
    private selectAndDrawBeekeeperObject( mapObjectId: string ) {
        this.setState( HIGHLIGHT_BEEKEEPER_SELECTED_OBJECT, mapObjectId );
    }

    /**
     * Открыть панель для редактирования
     * @private
     * @method openBeekeeperEditPanel
     * @param mapObjectId {string} Идентификатор объекта карты
     */
    private openBeekeeperEditPanel( mapObjectId: string ) {
        this.setState( SELECT_MAP_OBJECT_AND_OPEN_BEEKEEPER_EDIT_PANEL, mapObjectId );
    }
}
