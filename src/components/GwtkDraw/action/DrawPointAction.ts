/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Нанесение точки на карту                       *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import AppendPointAction from '~/systemActions/AppendPointAction';
import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import {CURSOR_TYPE} from '~/types/Types';
import {LOCALE} from '~/types/CommonTypes';
import VectorLayer from '~/maplayers/VectorLayer';
import {MouseDeviceEvent} from '~/input/MouseDevice';
import SVGrenderer, {RED_CIRCLE_SVG_MARKER_ID} from '~/renderer/SVGrenderer';
import Style from '~/style/Style';
import MarkerStyle from '~/style/MarkerStyle';
import {WorkspaceValues} from '~/utils/WorkspaceManager';
import GwtkDrawTask, {COMMIT_OBJECT} from '../task/GwtkDrawTask';


/**
 * Обработчик нанесения точки
 * @class DrawPointAction
 * @extends AppendPointAction<GwtkDrawTask>
 */
export default class DrawPointAction extends AppendPointAction<GwtkDrawTask> {

    /**
     *
     * @param task
     * @param id
     */
    constructor(task: Task, id: string) {
        super(task as GwtkDrawTask, id);
        const tempVectorLayer = VectorLayer.getEmptyInstance(this.map);
        this.currentObject = new MapObject(tempVectorLayer, MapObjectType.Point, {
            local: LOCALE.Point,
            id: 'newobject.1'
        });
        this.mapWindow.setCursor(CURSOR_TYPE.crosshair);
    }

    /**
     * @method destroy
     */
    destroy() {
        this.mapWindow.setCursor(CURSOR_TYPE.default);
    }

    /**
     * Запретить перемещение карты
     * @method canMapMove
     */
    canMapMove(): boolean {
        return false;

    }

    /**
     * Применить данные
     * @method commit
     */
    commit() {
        if (this.currentObject) {
            this.parentTask.setState(COMMIT_OBJECT, this.currentObject);
            this.map.clearActiveObject();
        }
    }

    /**
     * @method onMouseDown
     * @param event
     */
    onMouseDown(event: MouseDeviceEvent) {
        if (this.currentObject) {
            this.currentObject.removeAllPoints();

            const map = this.mapWindow.getMap();
            const pointXY = map.pixelToPlane(event.mousePosition.clone());

            if (pointXY) {
                this.currentObject.addPoint(pointXY);
            }
        }
    }

    onMouseMove(event: MouseDeviceEvent) {
        this.mapWindow.setCursor(CURSOR_TYPE.crosshair);
    }

    /**
     * Обработчик события перед рисованием карты
     * @method onPreRender
     */
    onPreRender() {
        if (this.currentObject && this.currentObject.isDirty) {
            this.currentObject.isDirty = false;
            this.map.requestRender();
        }
    }

    /**
     * Обработчик события после отрисовки карты
     * @method onPostRender
     */
    onPostRender(renderer: SVGrenderer) {


        if (this.currentObject) {
            let style = new Style({marker: new MarkerStyle({markerId: RED_CIRCLE_SVG_MARKER_ID})});
            this.map.mapObjectsViewer.drawMapObject(renderer, this.currentObject, style);
        }
    }

    onWorkspaceChanged(type: keyof WorkspaceValues) {
    }

}
