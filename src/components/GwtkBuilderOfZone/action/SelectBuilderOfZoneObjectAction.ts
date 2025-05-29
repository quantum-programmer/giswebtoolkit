/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *     Обработчик выбора объекта для построения буферной зоны       *
 *                                                                  *
 *******************************************************************/

import GwtkBuilderOfZoneTask from '../task/GwtkBuilderOfZoneTask';
import HighlightObjectAction from '~/systemActions/HighlightObjectAction';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import { DataChangedEvent } from '~/taskmanager/TaskManager';
import { CURSOR_TYPE } from '~/types/Types';

const DELTA_PIX = 6;

/**
 * Обработчик выбора объекта для построения буферной зоны
 * @class SelectBuilderOfZoneObjectAction
 * @extends HighlightObjectAction<GwtkBuilderOfZoneTask>
 */
export default class SelectBuilderOfZoneObjectAction extends HighlightObjectAction<GwtkBuilderOfZoneTask> {

    private selectableLayersIdList: string[] = [];

    setup() {
        super.setup();
        this.updateSelectableLayersIdList();
    }

    onDataChanged(event: DataChangedEvent) {
        super.onDataChanged(event);
        this.updateSelectableLayersIdList();
    }

    private updateSelectableLayersIdList() {
        this.selectableLayersIdList.splice(0);

        for (let i = 0; i < this.map.vectorLayers.length; i++) {
            const item = this.map.vectorLayers[i];
            const layer = this.map.tiles.getLayerByxId(item.xId);

            if (layer && layer.visible && item.serviceUrl === this.map.options.url) {
                this.selectableLayersIdList.push(item.idLayer);
            }
        }
    }

    canSelectThisObject(mapObject: MapObject) {
        return ((
            mapObject.type === MapObjectType.LineString ||
            mapObject.type === MapObjectType.MultiLineString ||
            mapObject.type === MapObjectType.MultiPolygon ||
            mapObject.type === MapObjectType.Point ||
            mapObject.type === MapObjectType.Polygon
        ) && this.selectableLayersIdList.find(item => item === mapObject.vectorLayer.idLayer) !== undefined);
    }

    onMouseMove(event: MouseDeviceEvent) {

        const previousMapObject = this.mapObject;

        this.mapObject = undefined;
        this.mapWindow.setCursor(CURSOR_TYPE.default);

        const map = this.mapWindow.getMap(),
            point = event.mousePosition.clone(),
            coord = map.pixelToPlane(point);

        //смещаем точку в пикселах для вычисления допуска в метрах
        point.x += DELTA_PIX;
        point.y += DELTA_PIX;

        const coordSupport = map.pixelToPlane(point);
        if (coord) {
            const cursorMapPoint = this.mapWindow.getMap().pixelToPlane(event.mousePosition);

            //допуск попадания в точку
            const delta = Math.max(Math.abs(coordSupport.x - coord.x), Math.abs(coordSupport.y - coord.y));

            let hoverResult;

            for (let i = 0; i < this.mapObjectList.length; i++) {
                const mapObject = this.mapObjectList[i];
                hoverResult = mapObject.checkHover(cursorMapPoint, delta);
                if (hoverResult && this.canSelectThisObject(mapObject)) {
                    this.mapObject = mapObject;
                    if (!previousMapObject || !previousMapObject.hasSameOriginTo(this.mapObject)) {
                        this.isRender = true;
                    }
                    this.mapWindow.setCursor(CURSOR_TYPE.pointer);
                    break;
                }
            }
        }
    }

    canShowObjectPanel(): boolean {
        return this.parentTask.canShowObjectPanel;
    }

    destroy() {
        this.mapObject = undefined;
        this.map.requestRender();
    }

    canClose(): boolean {
        return false;
    }

}
