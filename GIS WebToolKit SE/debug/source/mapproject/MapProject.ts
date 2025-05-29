/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                           Проект карты                           *
 *                                                                  *
 *******************************************************************/
import MapProjectTreeJSON from '~/mapproject/MapProjectTreeJSON';
import { GwtkMap } from '~/types/Types';
import { GwtkLayerDescription } from '~/types/Options';
import { ContentTreeNode } from '~/utils/MapTreeJSON';
import { PROJECT_SETTINGS_ID, PROJECT_SETTINGS_LAYERS_VIEW_ORDER }
    from '~/utils/WorkspaceManager';

export type ProjectLayerDescription = GwtkLayerDescription & { enabled: boolean; }

export type LayerParameters = ProjectLayerDescription[];

export type ProjectUpdate = {
    removed: string[];
    selected: string[];
}

/**
 * Класс MapProject
 * @class MapProject
 * @param map {GwtkMap} Экземпляр карты
 */
export default class MapProject {

    private readonly map: GwtkMap;

    private readonly mapProjectTree: MapProjectTreeJSON;

    private layers: LayerParameters;

    get projectLayers() {
        return JSON.parse( JSON.stringify( this.layers ) );
    }

    /**
     * @constructor MapProject
     * @param map {GwtkMap} Экземпляр карты
     */
    constructor( map: GwtkMap ) {
        this.map = map;
        this.mapProjectTree = new MapProjectTreeJSON( map );
        this.layers = JSON.parse( JSON.stringify( this.map.options.layers ) ) as LayerParameters;
        this.defaultEnabled();
        this.readWorkspace();
    }

    /**
     * Дерево состава слоев проекта
     * @property projectContentTree
     * @return { ContentTreeNode }
     */
    get projectContentTree() {
        return this.mapProjectTree.projectTree;
    }

    /**
     * Инициализация параметров слоев проекта
     * @method defaultEnabled
     * @private
     */
    private defaultEnabled() {
        for ( let i = 0; i < this.layers.length; i++ ) {
            this.layers[ i ].enabled = true;
        }
    }

    /**
     * Чтение и восстановление параметров прооекта
     * @method readWorkspace
     * @private
     */
    private readWorkspace() {
        const savedOrder = this.map.workspaceManager.getValue( PROJECT_SETTINGS_LAYERS_VIEW_ORDER );
        const savedProjectId = this.map.workspaceManager.getValue( PROJECT_SETTINGS_ID );
        if ( savedProjectId !== this.map.options.id ) {
            return;
        }
        this.layers.forEach( layer => {
            layer.enabled = savedOrder.includes( layer.id ) || !!layer.folder;
        } );

        this.updateMapLayersParameter();
    }


    /**
     * Обновить карту
     * @method updateMap
     * @param update { ProjectUpdate } Параметры обновления состава слоев карты
     */
    updateMap( update: ProjectUpdate ) {
        this.map.clearSelectedObjects();
        this.map.clearActiveObject();
        this.updateMapLayers( update );
    }

    /**
     * Обновить слои карты
     * @method updateMapLayers
     * @private
     * @param update { ProjectUpdate } Параметры обновления состава слоев карты
     */
    private updateMapLayers( update: ProjectUpdate ) {
        this.closeMapLayers( update );
        this.openMapLayers( update );
        this.map.trigger( { type: 'layerlistchanged', target: 'map' } );
    }

    /**
     * Закрыть слои карты
     * @method closeMapLayers
     * @private
     * @param update { ProjectUpdate } Параметры обновления состава слоев карты,
     * update.removed { Array } идентификаторы закрываемых слоев
     */
    private closeMapLayers( update: ProjectUpdate ) {
        if ( update.removed && update.removed.length > 0 ) {
            const layers = this.getLayers( update.removed );
            if ( layers.length == 0 ) {
                return;
            }
            this.map.disableMapRefresh = true;
            layers.forEach( layer => {
                layer.enabled = false;
                this.map.closeLayer( layer.id );
            } );
            this.map.disableMapRefresh = false;
        }
    }

    /**
     * Открыть слои карты
     * @method openMapLayers
     * @private
     * @param update { ProjectUpdate } Параметры обновления состава слоев карты
     * update.selected { Array } идентификаторы открываемых слоев
     */
    private openMapLayers( update: ProjectUpdate ) {
        if ( update.selected && update.selected.length > 0 ) {
            const layers = this.getLayers( update.selected );
            if ( layers.length == 0 ) {
                return;
            }
            layers.forEach( layer => {
                if ( layer.enabled ) {
                    return;
                }
                layer.enabled = true;
                const maptreenode = this.mapProjectTree.getNode( layer.id );
                this.map.openLayer( layer, maptreenode );
            } );
        }
    }

    /**
     * Получить слои проекта по списку идентификаторов
     * @method getLayers
     * @private
     * @param ids { String Array } идентификаторы слоев
     * @return { LayerParameters } слои проекта
     */
    private getLayers( ids: string[] ) {
        const layers: LayerParameters = [];
        this.layers.forEach( layer => {
            if ( ids.includes( layer.id ) ) {
                layers.push( layer );
            }
        } );
        return layers;
    }

    /**
     * Обновить параметр дерева слоев в настройках карты
     * @method updateContentTreeParameter
     * @private
     */
    private updateContentTreeParameter() {
        const projecttree = this.mapProjectTree.projectTree;

        const maptree = new MapProjectTreeJSON( this.map, projecttree.nodes );

        for ( let i = 0; i < this.layers.length; i++ ) {
            if ( !this.layers[ i ].enabled ) {
                const node = maptree.getNode( this.layers[ i ].id );
                if ( node ) {
                    maptree.removeNode( { ...node, remove: true } );
                    const parent = maptree.getNode( node.parentId );
                    if ( parent && parent.nodes && parent.nodes.length == 0 ) {
                        maptree.removeNode( parent );
                    }
                }
            }
        }
        const newTree = maptree.projectTree.nodes;
        this.map.options.contenttree = JSON.parse( JSON.stringify( newTree ) );
    }

    /**
     * Обновить параметры слоев в настройках карты
     * @method updateMapLayersParameter
     * @private
     */
    private updateMapLayersParameter() {
        let layers: LayerParameters = [];
        this.layers.forEach( layer => {
            if ( layer.enabled ) {
                layers.push( layer );
            }
        } );
        this.map.options.layers = JSON.parse( JSON.stringify( layers ) );
        this.updateContentTreeParameter();
    }

    private updateViewOrder() {
        if ( this.layers.length === this.map.options.layers.length ) {
            return;
        }
        const layers = this.map.options.layers;
        const news: string[] = [];
        let savedOrder = this.map.workspaceManager.getValue( PROJECT_SETTINGS_LAYERS_VIEW_ORDER );
        if ( savedOrder ) {
            layers.forEach( layer => {
                if ( !savedOrder.includes( layer.id ) ) {
                    news.push( layer.id );
                }
            } );
        } else savedOrder = [];
        if ( savedOrder.length == 0 ) {
            return;
        }

        const viewOrder = savedOrder.concat( news );
        let j = 0;
        const ids = [];
        while ( j < viewOrder.length ) {
            var found = -1;
            for ( let i = 0; i < layers.length; i++ ) {
                if ( layers[ i ].id === viewOrder[ j ] ) {
                    found = i;
                    break;
                }
            }
            if ( found == -1 ) {
                ids.push( viewOrder[ j ] );
            }
            j++;
        }
        ids.forEach( id => {
            const index = viewOrder.indexOf( id );
            viewOrder.splice( index, 1 );
        } );

        this.map.workspaceManager.setValue( PROJECT_SETTINGS_LAYERS_VIEW_ORDER, viewOrder );
    }

}
