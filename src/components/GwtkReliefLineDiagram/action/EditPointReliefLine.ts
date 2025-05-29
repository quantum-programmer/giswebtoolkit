/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Обработчик добавления точек объекта               *
 *                                                                  *
 *******************************************************************/

import GwtkReliefLineDiagramTask, {
    CLEAR_SELECTED_POINTS,
    CREATE_PANEL_RELIEF_CHART,
} from '@/components/GwtkReliefLineDiagram/task/GwtkReliefLineDiagramTask';
import SVGrenderer from '~/renderer/SVGrenderer';
import {MouseDeviceEvent} from '~/input/MouseDevice';
import PointEditAction from '~/systemActions/PointEditAction';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import i18n from '@/plugins/i18n';
import {LogEventType} from '~/types/CommonTypes';

/**
 * Обработчик добавления точек объекта
 * @class EditPointReliefLine
 * @extends AppendPointAction
 */
export default class EditPointReliefLine extends PointEditAction<GwtkReliefLineDiagramTask> {

    /**
     * Текущее значение области захвата точек привязки
     * @private
     * @readonly
     * @property deltaPix {number}
     */
    private readonly deltaPix = 15;

    private readonly reliefLineObjectStyle = new Style({
        stroke: new Stroke({
            color: '#C200F2',
            width: '4px',
            linejoin: 'round'
        }),
    });

    setup() {
        super.setup();
        if (this.currentObject) {

            if (this.currentObject.type !== MapObjectType.LineString) {

                const contourNumber = this.parentTask.objectContourSelected;
                const contourPointList = this.currentObject.getContourPoints(0, contourNumber);
                this.currentObject = new MapObject(this.currentObject.vectorLayer, MapObjectType.LineString);

                for (let i = 0; i < contourPointList.length; i++) {
                    const point = contourPointList[i];
                    if (i === contourPointList.length - 1 && this.currentObject.type !== MapObjectType.MultiLineString) {
                        point.x += 0.1;
                    }
                    this.currentObject.addPoint(point);
                }

            }

            if (this.currentObject.getContourPointsCount(0, 0) > 0) {
                this.currentObject.addStyle(this.reliefLineObjectStyle);

                this.map.setActiveObject(this.currentObject);
                this.parentTask.setState(CREATE_PANEL_RELIEF_CHART, this.currentObject);
                this.map.fitMapObject(this.currentObject);

                this.map.fitMapObject(this.currentObject);
            } else {
                this.map.writeProtocolMessage({
                    text: i18n.tc('relieflinediagram.Relief profile') + '. ' + i18n.tc('relieflinediagram.Failed to get data') + '!',
                    description: i18n.tc('relieflinediagram.Geometry error'),
                    display: true,
                    type: LogEventType.Error
                });
                this.quit();
            }

        }

    }


    destroy() {
        this.currentObject?.removeAllPoints();
        this.mapWindow.setCursor(this.cursor);
        this.map.requestRender();
        this.parentTask.resetMessage();
    }


    canSelectObject(): boolean {
        return false;
    }

    canEditLine(): boolean {
        return !this.currentMultiPointObject.getPointList().length;
    }

    onMouseDelayedClick(event: MouseDeviceEvent) {
    }

    onMouseMove(event: MouseDeviceEvent) {
        super.onMouseMove(event);
        this.parentTask.setEditPointObject(this.editPointObject);
    }

    async commit(): Promise<void> {
        if (this.currentObject && this.currentObject.isDirty) {

            this.parentTask.setState(CLEAR_SELECTED_POINTS, undefined);

            this.parentTask.setState(CREATE_PANEL_RELIEF_CHART, this.currentObject);
        }
    }

    onPreRender() {
        if (this.currentMultiPointObject.isDirty) {
            this.currentMultiPointObject.isDirty = false;
            this.map.requestRender();
        }
    }

    onPostRender(renderer: SVGrenderer) {

        if (this.currentObject) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.currentMultiPointObject);

            this.map.mapObjectsViewer.drawMapObject(renderer, this.currentObject);

            if (this.hoverObject) {
                this.map.mapObjectsViewer.drawMapObject(renderer, this.hoverObject, this.hoverObjectStyle);
            }

            this.map.mapObjectsViewer.drawMapObject(renderer, this.editPointObject);
        }

    }

    canClose(): boolean {
        return false;
    }
}
