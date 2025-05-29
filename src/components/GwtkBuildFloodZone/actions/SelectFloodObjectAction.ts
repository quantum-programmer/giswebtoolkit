/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *     Обработчик выбора объекта для построения зоны затопления     *
 *                                                                  *
 *******************************************************************/

import GwtkBuildFloodZoneTask, {
    HIGHLIGHT_OBJECT_ACTION
} from '../task/GwtkBuildFloodZoneTask';
import HighlightObjectAction from '~/systemActions/HighlightObjectAction';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import i18n from '@/plugins/i18n';
import { DataChangedEvent } from '~/taskmanager/TaskManager';
import { CURSOR_TYPE } from '~/types/Types';

const DELTA_PIX = 6;

/**
 * Обработчик выбора объекта для построения зоны затопления
 * @class SelectFloodObjectAction
 * @extends HighlightObjectAction<GwtkBuildFloodZoneTask>
 */
export default class SelectFloodObjectAction extends HighlightObjectAction<GwtkBuildFloodZoneTask> {

    private selectableLayersIdList: string[] = [];

    setup() {
        super.setup();

        this.updateSelectableLayersIdList();
        this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Select map object'));
    }

    onDataChanged(event: DataChangedEvent) {
        super.onDataChanged(event);
        this.updateSelectableLayersIdList();
    }

    private updateSelectableLayersIdList() {
        this.selectableLayersIdList.splice(0);
        if (this.map.options.floodZone && this.map.options.floodZone.url) {

            for (let i = 0; i < this.map.vectorLayers.length; i++) {
                const item = this.map.vectorLayers[i];
                const layer = this.map.tiles.getLayerByxId(item.xId);

                if (layer && layer.visible && item.serviceUrl === this.map.options.floodZone.url) {
                    this.selectableLayersIdList.push(item.idLayer);
                }
            }
        }
    }

    canSelectThisObject(mapObject: MapObject) {
        return ((
            mapObject.type === MapObjectType.LineString ||
            mapObject.type === MapObjectType.MultiLineString ||
            mapObject.type === MapObjectType.MultiPolygon ||
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

        if (this.mapObject && this.mapObject.objectName) {
            this.parentTask.setAdditionalMessage(this.mapObject.objectName);
        } else {
            this.parentTask.resetAdditionalMessage();
        }

    }

    onMouseClick(event: MouseDeviceEvent) {
        super.onMouseClick(event);

        if (this.mapObject && !(this.canSelectThisObject(this.mapObject))) {
            return;
        }

        if (this.mapObject) {

            this.parentTask.setTaskObject(this.mapObject);

            this.parentTask.setState(HIGHLIGHT_OBJECT_ACTION, false);
        }
    }

    canShowObjectPanel(): boolean {
        return false;
    }

    destroy() {
        this.mapObject = undefined;
        this.map.requestRender();
    }

}
