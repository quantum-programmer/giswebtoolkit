/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Обработчик выбора точек объекта                 *
 *                                                                  *
 *******************************************************************/

import Action from '~/taskmanager/Action';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import Style from '~/style/Style';
import SVGrenderer, {
    DEFAULT_SVG_MARKER_ID,
    RED_CIRCLE_SVG_MARKER_ID
} from '~/renderer/SVGrenderer';
import VectorLayer from '~/maplayers/VectorLayer';
import { CURSOR_TYPE } from '~/types/Types';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { PointInfo } from '~/mapobject/geometry/BaseMapObjectGeometry';
import MarkerStyle from '~/style/MarkerStyle';
import { LOCALE } from '~/types/CommonTypes';
import { Cartesian2D } from '~/geometry/Cartesian2D';
import PixelPoint from '~/geometry/PixelPoint';
import GwtkBuildFloodZoneTask, {
    SelectedPointData,
    OBJECT_POINTS_ARRAY,
    RESET_SELECTION
} from '../task/GwtkBuildFloodZoneTask';
import i18n from '@/plugins/i18n';

/**
 * Обработчик выбора точек объекта
 * @class SelectPointsAction
 * @extends Action
 */
export default class SelectPointsAction<T extends GwtkBuildFloodZoneTask> extends Action<T> {

    /**
     * Текущий объект
     * @private
     * @readonly
     * @property [currentObject] {MapObject}
     */
    protected currentObject?: MapObject;

    /**
     * Объект выделения точки
     * @private
     * @readonly
     * @property highLightedPointObject {MapObject}
     */
    private readonly highLightedPointObject: MapObject;

    /**
     * Объект выбранной точки объекта
     * @private
     * @readonly
     * @property currentPointObject {MapObject}
     */
    private readonly currentPointObject: MapObject;

    /**
     * Объект выбранных точек объекта
     * @private
     * @readonly
     * @property selectedPointsObject {MapObject}
     */
    private readonly selectedPointsObject: MapObject;

    /**
     * Стиль рисования точки
     * @private
     * @readonly
     * @property pointObjectStyle {Style}
     */
    private readonly pointObjectStyle = new Style({
        marker: new MarkerStyle({ markerId: DEFAULT_SVG_MARKER_ID })
    });

    /**
     * Стиль рисования выбранной точки
     * @private
     * @readonly
     * @property selectedPointStyle {Style}
     */
    private readonly selectedPointStyle = new Style({
        marker: new MarkerStyle({ markerId: RED_CIRCLE_SVG_MARKER_ID })
    });

    /**
     * Текущее значение области захвата точек привязки
     * @private
     * @property deltaPix {number}
     */
    private deltaPix = 15;

    /**
     * Селектор редактируемой точки
     * @private
     * @property [selector] {PointInfo}
     */
    private selector?: PointInfo;

    /**
     * Селектор точки под курсором
     * @private
     * @property [selectorCandidate] {PointInfo}
     */
    private selectorCandidate?: PointInfo;

    /**
     * Вид курсора
     * @private
     * @readonly
     * @property cursor {CURSOR_TYPE}
     */
    private readonly cursor: CURSOR_TYPE;

    private maxPointsCount = 2;

    private contourNumberSelected: number | undefined = undefined;
    private objectNumberSelected: number | undefined = undefined;

    /**
     * @constructor SelectPointsAction
     * @param task {GwtkBuildFloodZoneTask} Экземпляр родительской задачи
     * @param id {string} Идентификатор обработчика
     */
    constructor(task: T, id: string) {
        super(task, id);
        this.cursor = this.mapWindow.setCursor(CURSOR_TYPE.default);

        const tempVectorLayer = VectorLayer.getEmptyInstance(this.map);

        this.highLightedPointObject = new MapObject(tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point });

        this.highLightedPointObject.addStyle(this.pointObjectStyle);

        this.currentPointObject = new MapObject(tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point });

        this.currentPointObject.addStyle(this.pointObjectStyle);

        this.selectedPointsObject = new MapObject(tempVectorLayer, MapObjectType.MultiPoint, { local: LOCALE.Point });

        this.selectedPointsObject.addStyle(this.selectedPointStyle);
    }

    setup() {
        const taskObject = this.parentTask.getTaskObject();
        if (taskObject) {
            this.currentObject = taskObject;
            this.maxPointsCount = this.parentTask.maxPointsCount;

            const message = i18n.tc('floodzone.Select') + ' ' + this.maxPointsCount + ' ' + i18n.tc('floodzone.object points');
            this.mapWindow.addSnackBarMessage(message);
        }
    }

    destroy() {
        this.mapWindow.setCursor(CURSOR_TYPE.default);
        this.map.requestRender();
    }

    setState<K extends keyof GwtkBuildFloodZoneTask['setState']>(key: K, value: GwtkBuildFloodZoneTask['setState'][K]) {
        super.setState(key, value);

        switch (key) {
            case RESET_SELECTION:
                this.resetSelectedPoints();
                break;
        }

    }

    canSelectObject() {
        return false;
    }

    canClose() {
        return true;
    }

    canMapMove() {
        return !this.selector;
    }

    canShowObjectPanel(): boolean {
        return false;
    }

    onPreRender(renderer: SVGrenderer) {
        let flag = false;

        if (this.highLightedPointObject.isDirty) {
            this.highLightedPointObject.isDirty = false;
            flag = true;
        }

        if (this.currentPointObject.isDirty) {
            this.currentPointObject.isDirty = false;
            flag = true;
        }

        if (this.selectedPointsObject.hasPoints()) {
            flag = true;
        }

        if (flag) {
            this.map.requestRender();
        }
    }

    onPostRender(renderer: SVGrenderer) {
        this.map.mapObjectsViewer.drawMapObject(renderer, this.highLightedPointObject);
        this.map.mapObjectsViewer.drawMapObject(renderer, this.currentPointObject);
        this.map.mapObjectsViewer.drawMapObject(renderer, this.selectedPointsObject);
    }

    onMouseUp(event: MouseDeviceEvent) {
        this.selector = undefined;
        this.mapWindow.setCursor(CURSOR_TYPE.default);
    }

    onMouseDown(event: MouseDeviceEvent) {
        if (this.currentObject && !this.selectorCandidate) {
            this.onMouseMove(event);
        }

        this.selector = this.selectorCandidate;
        this.currentPointObject.removeAllPoints();

        if (this.selectorCandidate && this.currentObject) {

            if (this.objectNumberSelected !== undefined && this.objectNumberSelected !== this.selectorCandidate.objectNumber) {
                return;
            }

            if (this.contourNumberSelected !== undefined && this.contourNumberSelected !== this.selectorCandidate.contourNumber) {
                return;
            }

            const candidate = this.currentObject.getPoint(this.selectorCandidate);
            let index = -1;
            if (candidate) {
                this.currentPointObject.addPoint(candidate);
                const points = this.selectedPointsObject.getPointList();
                index = points.findIndex((point) => Cartesian2D.equals(point, candidate));
            }
            let lastPointSelector = undefined;
            if (index > -1) {
                this.selectedPointsObject.removePoint({ positionNumber: index, contourNumber: 0, objectNumber: 0 });
                this.selectorCandidate = undefined;
            } else {
                this.selectedPointsObject.addPoint(this.currentObject.getPoint(this.selectorCandidate)!);
                lastPointSelector = this.selectorCandidate;
            }
            const pointsData: SelectedPointData = {
                selectedPoints: this.selectedPointsObject,
                mapObject: this.currentObject,
                lastPointSelector
            };
            if (this.selectorCandidate) {
                this.objectNumberSelected = this.selectorCandidate.objectNumber;
            } else if (this.selectedPointsObject.getPointList().length === 0) {
                this.objectNumberSelected = undefined;
                this.contourNumberSelected = undefined;
            }

            this.parentTask.setState(OBJECT_POINTS_ARRAY, pointsData);

            this.selectorCandidate = undefined;

            this.currentPointObject.removeAllPoints();
        }

    }

    onMouseClick(event: MouseDeviceEvent): void | true {
        super.onMouseClick(event);
        if (this.selectedPointsObject.getPointList().length === this.maxPointsCount) {
            window.setTimeout(() => this.quit(), 3);
        }
    }

    /**
     * Получить допуск попадания в точку (в метрах)
     * @private
     * @param point {PixelPoint} Исходная точка в пикселах
     * @return {number} Допуск попадания в точку (в метрах)
     */
    private getDelta(point: PixelPoint): number {
        const map = this.mapWindow.getMap();

        const pointXY = map.pixelToPlane(point);

        const pointSupport = point.clone();
        //смещаем точку в пикселах для вычисления допуска в метрах
        pointSupport.x += this.deltaPix;
        pointSupport.y += this.deltaPix;

        const pointXYSupport = map.pixelToPlane(pointSupport);

        return Math.max(Math.abs(pointXYSupport.x - pointXY.x), Math.abs(pointXYSupport.y - pointXY.y));
    }

    onMouseMove(event: MouseDeviceEvent) {

        this.mapWindow.setCursor(CURSOR_TYPE.default);

        this.highLightedPointObject.removeAllPoints();

        this.selectorCandidate = undefined;

        if (this.currentObject) {

            const delta = this.getDelta(event.mousePosition);

            const cursorMapPoint = this.map.pixelToPlane(event.mousePosition);

            if (!this.selector) {
                const result = this.currentObject.checkPointHover(cursorMapPoint, delta);
                if (result) {
                    this.highLightedPointObject.addPoint(this.currentObject.getPoint(result)!);
                    this.selectorCandidate = result;
                    this.mapWindow.setCursor(CURSOR_TYPE.pointer);
                }
            }
        }

    }

    commit() {
    }

    revert() {
        this.quit();
    }

    private resetSelectedPoints() {
        this.selectedPointsObject.removeAllPoints();

        this.objectNumberSelected = undefined;
        this.contourNumberSelected = undefined;
        this.map.requestRender();
    }

}
