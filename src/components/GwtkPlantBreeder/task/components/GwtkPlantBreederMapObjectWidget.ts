/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *  Компонент "Список объектов карты для компонента Растениеводы"   *
 *                                                                  *
 *******************************************************************/


import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {
    GwtKPlantBreederTaskState,
    FIND_NEXT_PLANT_BREEDER_MAP_OBJECTS,
    HIGHLIGHT_PLANT_BREEDER_SELECTED_OBJECT,
    SELECT_MAP_OBJECT_AND_OPEN_PLANT_BREEDER_EDIT_PANEL
} from '@/components/GwtkPlantBreeder/task/GwtkPlantBreederTask';
import MapObject from '~/mapobject/MapObject';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';
import GwtkPlantBreederMapObjectItem
    from '@/components/GwtkPlantBreeder/task/components/GwtkPlantBreederMapObjectItem/GwtkPlantBreederMapObjectItem.vue';

/**
 * Компонент "Список объектов карты для компонента Растениеводы"
 * @class GwtkPlantBreederMapObjectWidget
 * @extends BaseGwtkVueComponent
 */
@Component( {
    components: {
        GwtkPlantBreederMapObjectItem
    }
})
export default class GwtkPlantBreederMapObjectWidget extends BaseGwtkVueComponent {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtKPlantBreederTaskState>( key: K, balue: GwtKPlantBreederTaskState[K] ) => void;

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
        this.setState( FIND_NEXT_PLANT_BREEDER_MAP_OBJECTS, undefined );
    }

    /**
     * Сделать выборку объекта из списка и выделить на карте
     * @private
     * @method selectAndDrawPlantBreederObject
     * @param mapObjectId {string} Идентификатор объекта карты
     */
    private selectAndDrawPlantBreederObject( mapObjectId: string ) {
        this.setState( HIGHLIGHT_PLANT_BREEDER_SELECTED_OBJECT, mapObjectId );
    }

    /**
     * Открыть панель для редактирования
     * @private
     * @method openPlantBreederEditPanel
     * @param mapObjectId {string} Идентификатор объекта карты
     */
    private openPlantBreederEditPanel( mapObjectId: string ) {
        this.setState( SELECT_MAP_OBJECT_AND_OPEN_PLANT_BREEDER_EDIT_PANEL, mapObjectId );
    }
}
