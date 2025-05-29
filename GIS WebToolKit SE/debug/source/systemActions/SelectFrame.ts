/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Обработчик выбора прямоугольного фрагмента карты        *
 *                                                                  *
 *******************************************************************/

import Action from '~/taskmanager/Action';
import {CURSOR_TYPE} from '~/types/Types';
import {MouseDeviceEvent} from '~/input/MouseDevice';
import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import VectorLayer from '~/maplayers/VectorLayer';
import Fill from '~/style/Fill';
import Rectangle from '~/geometry/Rectangle';
import SVGrenderer from '~/renderer/SVGrenderer';
import Task from '~/taskmanager/Task';
import PixelPoint from '~/geometry/PixelPoint';
import {MapPoint} from '~/geometry/MapPoint';


/**
 * Обработчик выбора прямоугольного фрагмента карты
 * @class SelectFrame
 * @extends Action<Task>
 */
export default class SelectFrame<T extends Task> extends Action<T> {

    /**
     * Объект карты (штриховая линия к курсору)
     * @private
     * @readonly
     * @property dashedObject {MapObject}
     */
    private dashedObject?: MapObject;

    /**
     * Стиль объекта штриховой линии к курсору
     * @private
     * @readonly
     * @property dashedObjectStyle {Style}
     */
    private readonly dashedObjectStyle = new Style({
        stroke: new Stroke({
            color: 'red',
            width: '1px',
            dasharray: '5, 5'
        }), fill: new Fill({
            color: 'red',
            opacity: 0.15
        })
    });

    protected startPixelPoint?: PixelPoint;
    protected endPixelPoint?: PixelPoint;

    protected frame?: Rectangle;

    private currentPoint?: MapPoint;
    private startPoint?: MapPoint;

    /**
     * Вид курсора
     * @private
     * @readonly
     * @property cursor {CURSOR_TYPE}
     */
    private readonly cursor: CURSOR_TYPE;


    constructor(task: T, id: string) {
        super(task, id);

        this.cursor = this.mapWindow.setCursor(CURSOR_TYPE.crosshair);
    }

    destroy() {
        this.mapWindow.setCursor(this.cursor);
        this.clear();
    }

    canSelectObject() {
        return false;
    }

    onPreRender(renderer: SVGrenderer) {
        if (this.dashedObject && this.dashedObject.isDirty) {
            this.dashedObject.isDirty = false;
            this.map.requestRender();
        }
    }

    onPostRender(renderer: SVGrenderer) {
        if (this.dashedObject) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.dashedObject, this.dashedObjectStyle);
        }
    }

    /**
     * Обработчик события mousedown
     * @method onMouseDown
     * @param event {MouseDeviceEvent} объект события
     */
    onMouseDown(event: MouseDeviceEvent) {
        this.currentPoint = this.mapWindow.getMap().pixelToPlane(event.mousePosition);
        if (!this.startPixelPoint) {
            this.startPoint = this.currentPoint;
            this.startPixelPoint = event.mousePosition.clone();
            this.endPixelPoint = this.startPixelPoint.clone();

            const tempVectorLayer = VectorLayer.getEmptyInstance(this.map);

            //объект с пунктирной линией
            this.dashedObject = new MapObject(tempVectorLayer, MapObjectType.Polygon);

            const startMapPoint = this.map.pixelToPlane(this.startPixelPoint);

            const endPixelPoint = this.endPixelPoint.clone();// иначе Polygon отметает одинаковые точки
            endPixelPoint.x += 1;
            endPixelPoint.y -= 1;
            const endMapPoint = this.map.pixelToPlane(endPixelPoint);

            this.dashedObject.addPoint(startMapPoint);
            this.dashedObject.addPoint(new MapPoint(startMapPoint.x, endMapPoint.y, 0, this.map.ProjectionId));
            this.dashedObject.addPoint(endMapPoint);
            this.dashedObject.addPoint(new MapPoint(endMapPoint.x, startMapPoint.y, 0, this.map.ProjectionId));

        }
    }

    /**
     * Обработчик события mousemove
     * @method onMousemove
     * @param event {MouseDeviceEvent} объект события
     */
    onMouseMove(event: MouseDeviceEvent) {
        if (this.startPixelPoint) {
            this.endPixelPoint = event.mousePosition.clone();

            this.currentPoint = this.mapWindow.getMap().pixelToPlane(event.mousePosition);

            if (this.dashedObject && this.startPoint && this.currentPoint) {

                this.dashedObject.updatePoint(new MapPoint(this.startPoint.x, this.currentPoint.y, 0, this.map.ProjectionId), {
                    objectNumber: 0,
                    contourNumber: 0,
                    positionNumber: 1
                });

                this.dashedObject.updatePoint(this.currentPoint, {
                    objectNumber: 0,
                    contourNumber: 0,
                    positionNumber: 2
                });

                this.dashedObject.updatePoint(new MapPoint(this.currentPoint.x, this.startPoint.y, 0, this.map.ProjectionId), {
                    objectNumber: 0,
                    contourNumber: 0,
                    positionNumber: 3
                });
            }
        }
    }

    /**
     * Обработчик события mouseup
     * @method onMouseUp
     * @param event {MouseDeviceEvent} объект события
     */
    onMouseUp(event: MouseDeviceEvent) {
        if (this.startPixelPoint && this.endPixelPoint && !this.startPixelPoint.equals(this.endPixelPoint)) {
            this.frame = new Rectangle(
                Math.min(this.startPixelPoint.x, this.endPixelPoint.x),
                Math.max(this.startPixelPoint.y, this.endPixelPoint.y),
                Math.max(this.startPixelPoint.x, this.endPixelPoint.x),
                Math.min(this.startPixelPoint.y, this.endPixelPoint.y),
            );
            this.run();
        }
    }

    onMouseClick(event: MouseDeviceEvent) {
        this.mapWindow.setCursor(CURSOR_TYPE.crosshair);
    }

    revert() {
        this.parentTask.quitAction(this.id);

    }

    private clear() {
        this.startPixelPoint = undefined;
        this.endPixelPoint = undefined;
        this.dashedObject = undefined;
        this.map.requestRender();
    }
}
