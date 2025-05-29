/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *     Обработчик выбора объекта для построения профиля рельефа     *
 *                                                                  *
 *******************************************************************/


import GwtkReliefLineDiagramTask, {ReliefProfileMessages} from '../task/GwtkReliefLineDiagramTask';
import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import SVGrenderer, {DEFAULT_SVG_MARKER_ID, RED_CIRCLE_SVG_MARKER_ID} from '~/renderer/SVGrenderer';
import MarkerStyle from '~/style/MarkerStyle';
import {MouseDeviceEvent} from '~/input/MouseDevice';
import {CURSOR_TYPE} from '~/types/Types';
import PixelPoint from '~/geometry/PixelPoint';
import {NearestInterpolatedPointResult} from '~/mapobject/geometry/BaseMapObjectGeometry';
import PointEditAction from '~/systemActions/PointEditAction';
import {MapPoint} from '~/geometry/MapPoint';
import {WorkspaceValues} from '~/utils/WorkspaceManager';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';


/**
 * Обработчик выбора объекта для построения профиля рельефа
 * @class SelectObjectForReliefLine
 * @extends Action<GwtkReliefLineDiagramTask>
 */
export default class SelectObjectForReliefLine extends PointEditAction<GwtkReliefLineDiagramTask> {

    /**
     * Текущее значение области захвата точек привязки
     * @private
     * @property deltaPix {number}
     */
    private deltaPix = 5;

    private deltaM = 0.001;

    private perimeterCurrent = 0;

    private readonly selectedObject: MapObject;
    private readonly selectedObjectStyle = new Style({
        stroke: new Stroke({
            color: '#0ed966',
            width: '4px',
            linejoin: 'round'
        }),
    });

    private readonly edgePoints: MapObject[] = [];

    protected readonly startPointMapObjectStyle = new Style({
        marker: new MarkerStyle({
            markerId: DEFAULT_SVG_MARKER_ID
        })
    });

    protected readonly endPointMapObjectStyle = new Style({
        marker: new MarkerStyle({
            markerId: RED_CIRCLE_SVG_MARKER_ID
        })
    });

    private splitStartPointResult?: NearestInterpolatedPointResult;
    private splitEndPointResult?: NearestInterpolatedPointResult;


    private isStartPointMouseDown: boolean = false;
    private isStartPointHovered: boolean = false;

    private isEndPointMouseDown: boolean = false;
    private isEndPointHovered: boolean = false;

    private startPointPrev?: MapPoint;

    private canMapMoveFlag: boolean = true;

    private canCloseFlag = false;

    constructor(task: GwtkReliefLineDiagramTask, id: string) {
        super(task, id);

        //создаем слой для построения
        const tempVectorLayer = GeoJsonLayer.getEmptyInstance(this.map);

        this.selectedObject = new MapObject(tempVectorLayer, MapObjectType.LineString);
        this.selectedObject.addStyle(this.selectedObjectStyle);

        const mapObjectEdgePoint = new MapObject(tempVectorLayer, MapObjectType.Point);
        mapObjectEdgePoint.addStyle(this.startPointMapObjectStyle);

        this.edgePoints.push(mapObjectEdgePoint);

        const mapObjectEdgePoint1 = new MapObject(tempVectorLayer, MapObjectType.Point);
        mapObjectEdgePoint1.addStyle(this.endPointMapObjectStyle);

        this.edgePoints.push(mapObjectEdgePoint1);

        if (this.parentTask.selectedObjectInit) {
            this.updateSelectedContour();
        }
    }

    onWorkspaceChanged(type: keyof WorkspaceValues) {
    }

    canSelectObject(): boolean {
        return true;
    }

    canClose(): boolean {
        return this.canCloseFlag;
    }

    canMapMove(): boolean {
        return this.canMapMoveFlag;
    }

    canSelectThisObject(mapObject: MapObject): boolean {
        if (mapObject.type === MapObjectType.Point || mapObject.type === MapObjectType.MultiPoint) {
            this.parentTask.showMessage(ReliefProfileMessages.selectNotPointObject, mapObject.type);
            return false;
        }
        return true;
    }

    selectObject(mapObject?: MapObject) {
        super.selectObject(mapObject);

        if (mapObject && !this.parentTask.selectedObjectInit) {

            this.parentTask.objectContourCount = mapObject.getObjectContoursCount(0);

            const contourNumber = this.parentTask.objectContourSelected;

            this.parentTask.selectedObjectInit = new MapObject(mapObject.vectorLayer, mapObject.type);

            this.parentTask.selectedObjectInit.updateFrom(mapObject);

            mapObject.loadGeometry().then(() => {

                const mapObjectPointList = mapObject.getContourPoints(0, contourNumber);

                for (let i = 0; i < mapObjectPointList.length; i++) {
                    const point = mapObjectPointList[i];

                    if (i === 0) {
                        this.edgePoints[0].addPoint(point);

                        this.splitStartPointResult = {
                            point: point,
                            pointSelectorPrev: {positionNumber: i, contourNumber, objectNumber: 0},
                            pointSelectorNext: {positionNumber: i, contourNumber, objectNumber: 0}
                        };
                    }

                    if (i === mapObjectPointList.length - 1) {

                        if (mapObject.type !== MapObjectType.MultiLineString || MapObjectType.MultiLineString) {
                            point.x += 0.1;
                        }

                        this.edgePoints[1].addPoint(point);

                        this.splitEndPointResult = {
                            point: point,
                            pointSelectorPrev: {positionNumber: i, contourNumber, objectNumber: 0},
                            pointSelectorNext: {positionNumber: i, contourNumber, objectNumber: 0}
                        };

                    }

                    this.selectedObject.addPoint(point);
                }

                if (this.selectedObject.getPointList().length) {
                    this.map.fitBounds(this.selectedObject.getBounds());

                    this.updatePerimeter();
                }


            });
        }

    }

    updateSelectedContour() {
        if (!this.parentTask.selectedObjectInit) {
            return;
        }

        const contourNumber = this.parentTask.objectContourSelected;

        const mapObjectPointList = this.parentTask.selectedObjectInit.getContourPoints(0, contourNumber);

        for (let i = 0; i < mapObjectPointList.length; i++) {
            const point = mapObjectPointList[i];

            if (i === 0) {
                this.edgePoints[0].addPoint(point);

                this.splitStartPointResult = {
                    point: point,
                    pointSelectorPrev: {positionNumber: i, contourNumber, objectNumber: 0},
                    pointSelectorNext: {positionNumber: i, contourNumber, objectNumber: 0}
                };
            }

            if (i === mapObjectPointList.length - 1) {

                point.x += 0.1;

                this.edgePoints[1].addPoint(point);

                this.splitEndPointResult = {
                    point: point,
                    pointSelectorPrev: {positionNumber: i, contourNumber, objectNumber: 0},
                    pointSelectorNext: {positionNumber: i, contourNumber, objectNumber: 0}
                };
            }

            this.selectedObject.addPoint(point);

        }

        if (this.selectedObject.getPointList().length) {
            this.map.fitBounds(this.selectedObject.getBounds());

            this.updatePerimeter();
            this.isEndPointMouseDown = true;
            this.onMouseUp();
        }
    }


    destroy() {
        super.destroy();

        this.selectedObject.removeAllPoints();

        this.edgePoints.forEach(item => item.removeAllPoints());

        this.map.requestRender();
    }

    onPreRender() {
        if (this.selectedObject.isDirty || this.edgePoints[0].isDirty || this.edgePoints[1].isDirty) {
            this.selectedObject.isDirty = false;
            this.edgePoints[0].isDirty = false;
            this.edgePoints[1].isDirty = false;
            this.map.requestRender();
        }
    }

    onPostRender(renderer: SVGrenderer) {
        if (this.selectedObject) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.selectedObject);
        }

        if (this.startPointMapObjectStyle) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.edgePoints[1]);
        }

        if (this.endPointMapObjectStyle) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.edgePoints[0]);
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
        if (!this.parentTask.selectedObjectInit) {
            return;
        }

        const delta = this.getDelta(event.mousePosition);
        const cursorMapPoint = this.map.pixelToPlane(event.mousePosition);

        const contourNumber = this.parentTask.objectContourSelected;

        if (this.edgePoints[0].checkPointHover(cursorMapPoint, delta)) {
            this.mapWindow.setCursor(CURSOR_TYPE.pointer);
            this.isStartPointHovered = true;
            this.isEndPointHovered = false;
        } else if (this.edgePoints[1].checkPointHover(cursorMapPoint, delta)) {
            this.mapWindow.setCursor(CURSOR_TYPE.pointer);
            this.isStartPointHovered = false;
            this.isEndPointHovered = true;
        }

        if (!this.isStartPointHovered && !this.isEndPointHovered) {
            this.mapWindow.setCursor(CURSOR_TYPE.default);
        }

        // startPoint
        if (this.isStartPointMouseDown) {

            this.canMapMoveFlag = false;

            const map = this.map;

            const cursorMapPoint = map.pixelToPlane(event.mousePosition);

            //сначала проверка на попадание в точку объекта

            const point = event.mousePosition.clone();

            //смещаем точку в пикселах для вычисления допуска в метрах
            point.x += this.deltaPix;
            point.y += this.deltaPix;

            const pointXYSupport = map.pixelToPlane(point);

            //допуск попадания в точку
            const delta = Math.max(Math.abs(pointXYSupport.x - cursorMapPoint.x), Math.abs(pointXYSupport.y - cursorMapPoint.y));

            const result = this.parentTask.selectedObjectInit.checkPointHover(cursorMapPoint, delta);
            if (result) {

                const objectPoint = this.parentTask.selectedObjectInit.getPoint(result);
                if (!objectPoint) {
                    return;
                }

                const {objectNumber, contourNumber, positionNumber} = result;

                let positionNumberPrev = positionNumber;
                let positionNumberNext = positionNumber + 1;

                const maxPositionNumber = this.parentTask.selectedObjectInit.getContourPointsCount(objectNumber, contourNumber) - 1;

                if (positionNumberNext > maxPositionNumber) {
                    positionNumberNext = maxPositionNumber;
                    positionNumberPrev = Math.max(0, positionNumberNext - 1);
                }

                this.splitStartPointResult = {
                    point: objectPoint,
                    pointSelectorPrev: {positionNumber: positionNumberPrev, contourNumber, objectNumber},
                    pointSelectorNext: {positionNumber: positionNumberNext, contourNumber, objectNumber}
                };


                if (this.splitEndPointResult
                    && this.splitStartPointResult.pointSelectorPrev.contourNumber === this.splitEndPointResult.pointSelectorPrev.contourNumber
                    && this.splitStartPointResult.pointSelectorPrev.positionNumber < this.splitEndPointResult.pointSelectorPrev.positionNumber) {
                    this.edgePoints[0].addPoint(objectPoint);
                }

            } else {

                this.splitStartPointResult = this.parentTask.selectedObjectInit.findNearestInterpPoint(cursorMapPoint);

                if (this.splitStartPointResult) {

                    if (this.splitEndPointResult
                        && this.splitStartPointResult.pointSelectorPrev.contourNumber === this.splitEndPointResult.pointSelectorPrev.contourNumber
                        && this.splitStartPointResult.pointSelectorPrev.positionNumber === this.splitEndPointResult.pointSelectorPrev.positionNumber) {

                        const startPoint = this.splitStartPointResult.point;
                        const endPoint = this.edgePoints[1].getPointList()[0];

                        const nearPrevPoint = this.parentTask.selectedObjectInit.getPoint({
                            objectNumber: 0,
                            contourNumber,
                            positionNumber: this.splitStartPointResult.pointSelectorPrev.positionNumber
                        });

                        if (nearPrevPoint) {
                            const ax = startPoint.x - nearPrevPoint.x;
                            const bx = endPoint.x - startPoint.x;

                            if (Math.abs(bx) > this.deltaM && ax / bx <= 0) {

                                this.isStartPointMouseDown = false;
                                this.isStartPointHovered = false;

                                this.isEndPointMouseDown = false;
                                this.isEndPointHovered = false;

                                this.canMapMoveFlag = false;

                                return;
                            }

                        }

                    }

                    if (this.splitEndPointResult
                        && this.splitStartPointResult.pointSelectorPrev.contourNumber === this.splitEndPointResult.pointSelectorPrev.contourNumber
                        && this.splitStartPointResult.pointSelectorPrev.positionNumber <= this.splitEndPointResult.pointSelectorPrev.positionNumber) {
                        this.edgePoints[0].addPoint(this.splitStartPointResult.point);
                    }

                } else {
                    this.edgePoints[0].removeAllPoints();
                }
            }

            this.mapWindow.setCursor(CURSOR_TYPE.grab);

            if (this.splitStartPointResult) {

                this.selectedObject.removeAllPoints();

                this.selectedObject.addPoint(this.edgePoints[0].getPointList()[0]);

                if (this.splitEndPointResult
                    && this.splitStartPointResult.pointSelectorPrev.contourNumber === this.splitEndPointResult.pointSelectorPrev.contourNumber
                    && this.splitStartPointResult.pointSelectorPrev.positionNumber < this.splitEndPointResult.pointSelectorPrev.positionNumber) {

                    const contourPoints = this.parentTask.selectedObjectInit.getContourPoints(0, contourNumber);

                    const position = this.parentTask.selectedObjectInit.findNearestInterpPoint(this.edgePoints[0].getPointList()[0])?.pointSelectorNext;

                    const startPosition = position ? position.positionNumber : 0;

                    for (let positionNumber = startPosition; positionNumber < contourPoints.length; positionNumber++) {

                        if (this.splitEndPointResult?.pointSelectorPrev.positionNumber === this.splitStartPointResult.pointSelectorPrev.positionNumber) {
                            break;
                        }

                        const point = contourPoints[positionNumber];

                        this.selectedObject.addPoint(point);

                        if (this.splitEndPointResult && positionNumber >= this.splitEndPointResult.pointSelectorPrev.positionNumber) {
                            break;
                        }
                    }

                }

                this.selectedObject.addPoint(this.edgePoints[1].getPointList()[0]);

            }

            if (Math.abs(this.edgePoints[0].getPointList()[0].x - this.edgePoints[1].getPointList()[0].x) > 1
                && Math.abs(this.edgePoints[0].getPointList()[0].y - this.edgePoints[1].getPointList()[0].y) > 1) {
                this.startPointPrev = this.edgePoints[0].getPointList()[0];
            }

            this.updatePerimeter();
        }

        // endPoint
        if (this.isEndPointMouseDown) {

            this.canMapMoveFlag = false;

            const map = this.map;

            const cursorMapPoint = map.pixelToPlane(event.mousePosition);

            //сначала проверка на попадание в точку объекта

            const point = event.mousePosition.clone();

            //смещаем точку в пикселах для вычисления допуска в метрах
            point.x += this.deltaPix;
            point.y += this.deltaPix;

            const pointXYSupport = map.pixelToPlane(point);

            //допуск попадания в точку
            const delta = Math.max(Math.abs(pointXYSupport.x - cursorMapPoint.x), Math.abs(pointXYSupport.y - cursorMapPoint.y));

            const result = this.parentTask.selectedObjectInit.checkPointHover(cursorMapPoint, delta);
            if (result) {

                const objectPoint = this.parentTask.selectedObjectInit.getPoint(result);
                if (!objectPoint) {
                    return;
                }

                const {objectNumber, contourNumber, positionNumber} = result;

                let positionNumberPrev = positionNumber;
                let positionNumberNext = positionNumber + 1;

                const maxPositionNumber = this.parentTask.selectedObjectInit.getContourPointsCount(objectNumber, contourNumber) - 1;

                if (positionNumberNext > maxPositionNumber) {
                    positionNumberNext = maxPositionNumber;
                    positionNumberPrev = Math.max(0, positionNumberNext - 1);
                }

                this.splitEndPointResult = {
                    point: objectPoint,
                    pointSelectorPrev: {positionNumber: positionNumberPrev, contourNumber, objectNumber},
                    pointSelectorNext: {positionNumber: positionNumberNext, contourNumber, objectNumber}
                };


                if (this.splitStartPointResult
                    && (this.splitStartPointResult.pointSelectorPrev.positionNumber <= this.splitEndPointResult.pointSelectorPrev.positionNumber)) {
                    this.edgePoints[1].addPoint(objectPoint);
                }

            } else {

                this.splitEndPointResult = this.parentTask.selectedObjectInit.findNearestInterpPoint(cursorMapPoint);

                if (this.splitEndPointResult) {

                    if (this.splitStartPointResult
                        && this.splitStartPointResult.pointSelectorPrev.contourNumber === this.splitEndPointResult.pointSelectorPrev.contourNumber
                        && (this.splitStartPointResult.pointSelectorPrev.positionNumber === this.splitEndPointResult.pointSelectorPrev.positionNumber)) {

                        const startPoint = this.edgePoints[0].getPointList()[0];
                        const endPoint = this.splitEndPointResult.point;

                        const nearPrevPoint = this.parentTask.selectedObjectInit.getPoint({
                            objectNumber: 0,
                            contourNumber,
                            positionNumber: this.splitEndPointResult.pointSelectorPrev.positionNumber
                        });

                        if (nearPrevPoint) {
                            const ax = startPoint.x - nearPrevPoint.x;
                            const bx = endPoint.x - startPoint.x;

                            if (Math.abs(bx) > this.deltaM && ax / bx < 0) {

                                this.isStartPointMouseDown = false;
                                this.isStartPointHovered = false;

                                this.isEndPointMouseDown = false;
                                this.isEndPointHovered = false;

                                this.canMapMoveFlag = false;

                                return;
                            }

                        }

                    }

                    if (this.splitStartPointResult
                        && this.splitStartPointResult.pointSelectorPrev.contourNumber === this.splitEndPointResult.pointSelectorPrev.contourNumber
                        && this.splitStartPointResult.pointSelectorPrev.positionNumber <= this.splitEndPointResult.pointSelectorPrev.positionNumber) {
                        this.edgePoints[1].addPoint(this.splitEndPointResult.point);
                    }

                } else {
                    this.edgePoints[1].removeAllPoints();
                }
            }

            this.mapWindow.setCursor(CURSOR_TYPE.grab);


            if (this.splitEndPointResult) {

                this.selectedObject.removeAllPoints();

                this.selectedObject.addPoint(this.edgePoints[0].getPointList()[0]);

                if (this.splitStartPointResult
                    && this.splitStartPointResult.pointSelectorPrev.contourNumber === this.splitEndPointResult.pointSelectorPrev.contourNumber
                    && this.splitStartPointResult.pointSelectorPrev.positionNumber <= this.splitEndPointResult.pointSelectorPrev.positionNumber) {

                    const contourPoints = this.parentTask.selectedObjectInit.getContourPoints(0, contourNumber);

                    const position = this.parentTask.selectedObjectInit.findNearestInterpPoint(this.edgePoints[0].getPointList()[0])?.pointSelectorNext;

                    const startPosition = position ? position.positionNumber : 0;

                    for (let positionNumber = startPosition; positionNumber < contourPoints.length; positionNumber++) {

                        if (this.splitEndPointResult.pointSelectorPrev.positionNumber === this.splitStartPointResult?.pointSelectorPrev.positionNumber) {
                            break;
                        }

                        const currentPoint = contourPoints[positionNumber];
                        this.selectedObject.addPoint(currentPoint);

                        if (positionNumber >= this.splitEndPointResult.pointSelectorPrev.positionNumber) {
                            break;
                        }
                    }

                }

                this.selectedObject.addPoint(this.edgePoints[1].getPointList()[0]);

            }

            this.updatePerimeter();

        }

        if (!this.isEndPointMouseDown && !this.isStartPointMouseDown) {
            this.canMapMoveFlag = true;
        }

        if (this.perimeterCurrent < 1 && this.startPointPrev) {
            this.edgePoints[0].removeAllPoints();
            this.edgePoints[0].addPoint(this.startPointPrev);
        }

    }

    updatePerimeter() {
        const points = this.selectedObject.getPointList();

        if (points.length) {
            const perimeter = this.selectedObject.getDistanceFromStartToPoint(points[points.length - 1]);
            if (perimeter !== undefined) {
                this.parentTask.showMessage(ReliefProfileMessages.objectPerimeter, perimeter.toFixed(2));
                this.perimeterCurrent = perimeter;
            }
        }
    }

    onMouseDown(event: MouseDeviceEvent) {
        if (this.isStartPointHovered) {
            this.isStartPointMouseDown = true;
        }
        if (this.isEndPointHovered) {
            this.isEndPointMouseDown = true;
        }
    }

    onMouseUp() {
        if (this.isStartPointMouseDown || this.isEndPointMouseDown) {

            if (this.perimeterCurrent > 0) {
                this.currentObject = new MapObject(this.selectedObject.vectorLayer, MapObjectType.LineString);
                this.currentObject.updateFrom(this.selectedObject);

                this.parentTask.isBuildEnabled = true;

            } else {

                this.parentTask.showMessage(ReliefProfileMessages.selectPartOfObject);
                this.currentObject?.removeAllPoints();
                this.currentObject = undefined;

                this.parentTask.isBuildEnabled = false;
            }

        }

        this.isStartPointMouseDown = false;
        this.isStartPointHovered = false;

        this.isEndPointMouseDown = false;
        this.isEndPointHovered = false;
    }

}
