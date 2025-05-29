/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Векторный слой локальный (GeoJSON)                  *
 *                                                                  *
 *******************************************************************/

import { LAYERTYPENAME, GwtkMap } from '~/types/Types';
import VectorLayer from '~/maplayers/VectorLayer';
import SVGrenderable from '~/renderer/SVGrenderable';
import VectorSource from '~/sources/VectorSource';
import { IRenderable, IRenderer } from '~/renderer/types';
import MapObject from '~/mapobject/MapObject';
import {
    WorkspaceValues,
    VIEW_SETTINGS_ZOOM_LEVEL,
    VIEW_SETTINGS_MAPCENTER
} from '~/utils/WorkspaceManager';
import { GwtkLayerDescription } from '~/types/Options';


/**
 * Векторный слой локальный (GeoJSON)
 * @class RenderableLayer
 */
export default abstract class RenderableLayer extends VectorLayer {

    protected readonly mapObjectsViewer: IRenderable<SVGElement | HTMLElement> = new SVGrenderable();

    protected source = new VectorSource();

    protected isDirty = true;

    protected constructor( map: GwtkMap, options: GwtkLayerDescription ) {
        super( map, options );

        this.onWorkspaceChanged = this.onWorkspaceChanged.bind( this );
        this.onWorkspaceReset = this.onWorkspaceReset.bind( this );

        this.map.on( {
            type: 'workspacechanged',
            target: 'map'
        }, this.onWorkspaceChanged );

        this.map.on( { type: 'workspacereset', target: 'map' }, this.onWorkspaceReset );
    }

    destroy() {
        super.destroy();
        this.map.off( {
            type: 'workspacechanged',
            target: 'map'
        }, this.onWorkspaceChanged );
        this.map.off( { type: 'workspacereset', target: 'map' }, this.onWorkspaceReset );
        this.map.requestRender();
    }

    onWorkspaceChanged( event: any ) {
        const type: keyof WorkspaceValues = event.item.key;
        if ( type === VIEW_SETTINGS_ZOOM_LEVEL || type === VIEW_SETTINGS_MAPCENTER ) {
            this.isDirty = true;
            this.map.requestRender();
        }
    }

    onWorkspaceReset() {
        this.isDirty = true;
        this.map.requestRender();
    }

    format = 'svg';

    get isEditable() {
        return false;
    }

    /**
     * Получение списка семантик
     * @method getSemanticWithList
     * @public
     * @return {Array} Массив объектов списка семантик в формате JSON
     */
    getSemanticWithList() {
        return [];
    }

    get typeName() {
        return LAYERTYPENAME.svg;
    }

    /**
     * Получение всех объектов
     * @method getAllMapObjects
     * @return {MapObject[]} Объекты карты
     */
    getMapObjectsIterator() {
        return this.source.mapObjectsIterator;
    }

    /**
     * Отрисовать объекты слоя
     * @method drawLayer
     * @param renderer {SVGrenderer} Отрисовщик
     */
    drawLayer( renderer: IRenderer<SVGElement | HTMLElement> ) {
        if ( this.visible && this.isDirty ) {
            this.isDirty = false;
            this.updateRenderables( renderer );
        }

        this.mapObjectsViewer.setOpacity( this.getOpacityCss() );
        this.mapObjectsViewer.drawRenderable( renderer );

    }

    /**
     * Обновить состав отрисовки
     * @private
     * @method updateRenderables
     * @param renderer {HTMLrenderer} Отрисовщик HTML
     */
    protected updateRenderables( renderer: IRenderer<SVGElement | HTMLElement> ): void {
        const windowBbox = this.map.getWindowBounds();
        this.mapObjectsViewer.clear();
        const mapObjectList = this.getMapObjectsIterator();
        for ( const mapObject of mapObjectList ) {
            if ( windowBbox.intersects( mapObject.getBounds() ) ) {
                this.mapObjectsViewer.drawMapObject( renderer, mapObject );
            }
        }
    }

    show() {
        if ( !this.visible ) {
            super.show();
            this.isDirty = true;
            this.map.requestRender();
        }
    }

    hide() {
        if ( this.visible ) {
            super.hide();
            this.mapObjectsViewer.clear();
            this.isDirty = true;
            this.map.requestRender();
        }
    }


    async commitMapObject( mapObject: MapObject ) {
        const result = await super.commitMapObject( mapObject );
        if ( result && (result.deleted.length || result.inserted.length || result.replaced.length) ) {
            this.isDirty = true;
            this.map.requestRender();
        }
        return result;
    }
}
