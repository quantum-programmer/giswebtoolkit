/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент "Настройка проектов"                  *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    CHANGE_PROJECT_MAP_LAYER_STATE,
    GwtkMapOptionsTaskState,
    ProjectMapLayers
} from '@/components/GwtkMapOptions/task/GwtkMapOptionsTask';
import GwtkGroupLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkGroupLayerItem';

/**
 * Компонент "Настройка проектов"
 * @class GwtkMapOptionsProjects
 * @extends Vue
 */
@Component
export default class GwtkMapOptionsProjects extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>( key: K, value: GwtkMapOptionsTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly currentMapLayerItem!: GwtkGroupLayerItem;

    @Prop( { default: () => ([]) } )
    private readonly projectMapLayers!: ProjectMapLayers[];


    /**
     * Проверить наличие слоя
     * @private
     * @method checkThePresenceOfLayer
     * @param layerId {string} идентификатор слоя
     */
    private checkThePresenceOfLayer( layerId: string ) {
        const layer = this.projectMapLayers.find( layerItem => layerItem.id === layerId );

        return layer ? layer.active : true;
    }

    /**
     * Поменять состояние слоя
     * @private
     * @method onChangeLayerState
     * @param layerId {string} идентификатор слоя
     * @param layerName {string} имя слоя
     * @param layerActive {boolean} состояние слоя
     */
    private onChangeLayerState( layerId: string, layerName: string, layerActive: boolean ) {
        const layerItem: ProjectMapLayers = { id: layerId, name: layerName, active: layerActive };
        this.setState( CHANGE_PROJECT_MAP_LAYER_STATE, layerItem );
    }

}
