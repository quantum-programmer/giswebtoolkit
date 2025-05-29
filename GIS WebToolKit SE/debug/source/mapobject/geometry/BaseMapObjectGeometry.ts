/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Базовый класс геометрии объекта карты                *
 *                                                                  *
 *******************************************************************/


import {vec2} from '~/3d/engine/utils/glmatrix';
import {Vector2D, Vector2or3, Vector3D, Vector4D} from '~/3d/engine/core/Types';
import {MapPoint} from '~/geometry/MapPoint';
import {Bounds} from '~/geometry/Bounds';
import {Cartesian2D} from '~/geometry/Cartesian2D';
import XMLElement from '~/services/Utils/XMLElement';
import {FeatureGeometry} from '~/utils/GeoJSON';
import GeoPoint from '~/geo/GeoPoint';


export type ObjectSelector = { objectNumber?: number; }
export type ContourSelector = ObjectSelector & { contourNumber?: number; }
export type PointSelector = ContourSelector & { positionNumber?: number; }
export type PointInfo = {
    objectNumber: number;
    contourNumber: number;
    positionNumber: number;
}

export type NearestInterpolatedPointResult = {
    point: MapPoint;
    pointSelectorPrev: PointInfo;
    pointSelectorNext: PointInfo;
};

/**
 * Геометрия объекта карты
 * @abstract
 * @class BaseMapObjectGeometry
 */
export default abstract class BaseMapObjectGeometry {

    /**
     * Массив координат (полигон-контур-точка)
     * @protected
     * @readonly
     * @property {array} object
     */
    protected readonly object: MapPoint[][][] = [];

    /**
     * Добавление точки
     * @method addPoint
     * @param mapPoint {MapPoint} Точка в метрах
     * @param selector {PointSelector} Селектор точки
     */
    abstract addPoint(mapPoint: MapPoint, selector?: PointSelector): void;

    abstract toJSON(targetProjectionId: string): FeatureGeometry | undefined;

    abstract fromJSON(json: FeatureGeometry, sourceProjectionId: string, targetProjectionId: string): void;

    /**
     * Проверка нахождения точки внутри геометрии
     * @method checkHover
     * @param mapPoint {MapPoint} Точка в метрах
     * @param delta {number} Область захвата в метрах
     * @return {boolean} Флаг попадания в геометрию
     */
    abstract checkHover(mapPoint: MapPoint, delta: number): PointInfo | undefined;

    /**
     * Проверка нахождения точки в области узла геометрии
     * @method checkPointHover
     * @param mapPoint {MapPoint} Точка в метрах
     * @param delta {number} Область захвата в метрах
     * @return {PointInfo}  Описание точки
     */
    checkPointHover(mapPoint: MapPoint, delta: number): PointInfo | undefined {
        let result;

        if (this.object.length > 0) {

            for (let objectNumber = 0; objectNumber < this.object.length; objectNumber++) {

                const objectContours = this.object[objectNumber];

                for (let contourNumber = 0; contourNumber < objectContours.length; contourNumber++) {
                    const contourPoints = objectContours[contourNumber];
                    for (let position = 0; position < contourPoints.length; position++) {
                        const currentMapPoint = contourPoints[position];
                        if (Cartesian2D.distance(mapPoint, currentMapPoint) < delta) {
                            result = this.findNearestPoint(mapPoint, objectNumber, contourNumber);
                            break;
                        }
                    }
                }
            }
        }

        return result;
    }

    /**
     * Проверка нахождения точки в области контура геометрии
     * @method checkBorderHover
     * @param mapPoint {MapPoint} Точка в метрах
     * @param delta {number} Область захвата в метрах
     * @param [selector] {PointInfo} Селектор
     * @return {MapPoint|undefined} Ближайшая точка на контуре
     */
    checkBorderHover(mapPoint: MapPoint, delta: number, selector?: ObjectSelector): MapPoint | undefined {
        if (this.checkHover(mapPoint, delta)) {
            let result = this.findNearestInterpolatedPoint(mapPoint, selector?.objectNumber || 0);
            if (result) {
                if (Cartesian2D.distance(result.point, mapPoint) < delta) {
                    return result.point;
                }
            }
        }
    }

    /**
     * Найти ближайшую точку к указанной
     * @protected
     * @method findNearestPoint
     * @param mapPoint {MapPoint} Точка поиска
     * @param objectNumber {number} Номер полигона для поиска
     * @param [contourNumber] {number} Номер контура для поиска
     * @return {PointInfo}  Описание точки
     */
    protected findNearestPoint(mapPoint: MapPoint, objectNumber: number, contourNumber?: number): PointInfo | undefined {
        let result;

        const objectContours = this.object[objectNumber];

        if (objectContours) {

            if (contourNumber !== undefined && contourNumber >= 0) {
                result = this.findNearestContourPoint(objectNumber, contourNumber, mapPoint).pointInfo;
            } else {
                let deltaXY = Number.MAX_VALUE;
                for (let contourNumber = 0; contourNumber < objectContours.length; contourNumber++) {
                    const {delta, pointInfo} = this.findNearestContourPoint(objectNumber, contourNumber, mapPoint);
                    if (delta < deltaXY) {
                        deltaXY = delta;
                        result = pointInfo;
                    }
                }
            }
        }

        return result;
    }

    private findNearestContourPoint(objectNumber: number, contourNumber: number, mapPoint: MapPoint): { pointInfo: PointInfo; delta: number; } {
        const objectContours = this.object[objectNumber];

        let deltaXY = Number.MAX_VALUE;

        let nearestPoint = {positionNumber: 0, contourNumber, objectNumber};

        const contourPoints = objectContours[contourNumber];

        for (let positionNumber = 0; positionNumber < contourPoints.length; positionNumber++) {

            const currentMapPoint = contourPoints[positionNumber];

            const currentDelta = Cartesian2D.distance(currentMapPoint, mapPoint);

            if (currentDelta < deltaXY) {
                deltaXY = currentDelta;
                nearestPoint.positionNumber = positionNumber;
            }
        }

        return {pointInfo: nearestPoint, delta: deltaXY};
    }

    /**
     * Поиск точки в пределах области захвата от указанной
     * @method findNearestPointWithinRange
     * @param mapPoint {MapPoint} Точка в градусах
     * @param delta {number} Область захвата в метрах
     * @return {PointInfo|undefined} Номер найденной точки
     */
    findNearestPointWithinRange(mapPoint: MapPoint, delta: number): PointInfo | undefined {
        let result;
        const projectionId = this.getProjectionId();
        if (projectionId) {
            const transformedMapPoint = mapPoint.toMapPoint(projectionId);
            for (let objectNumber = 0; objectNumber < this.object.length; objectNumber++) {
                const objectContours = this.object[objectNumber];
                for (let contourNumber = 0; contourNumber < objectContours.length; contourNumber++) {
                    const contourPoints = objectContours[contourNumber];
                    for (let positionNumber = 0; positionNumber < contourPoints.length; positionNumber++) {
                        const currentMapPoint = contourPoints[positionNumber];
                        const currentDelta = Cartesian2D.distance(currentMapPoint, transformedMapPoint);
                        if (currentDelta < delta) {
                            result = {positionNumber, contourNumber, objectNumber};
                            break;
                        }
                    }
                    if (result) {
                        break;
                    }
                }
                if (result) {
                    break;
                }
            }
        }

        return result;
    }

    /**
     * Почистить кэш (если есть)
     * @protected
     * @method clearCache
     */
    protected clearCache(): void {
    }

    /**
     * Получение точки
     * @method getPoint
     * @param pointSelector {PointSelector} Описание точки
     * @return {MapPoint} Точка в метрах (по умолчанию - первая точка первого контура первого полигона)
     */
    getPoint(pointSelector: PointSelector = {}): MapPoint | undefined {
        const {
            objectNumber = 0,
            contourNumber = 0,
            positionNumber = 0
        } = pointSelector;
        const objectContours = this.object[objectNumber];
        if (objectContours) {
            const contourPoints = objectContours[contourNumber];
            if (contourPoints) {
                return contourPoints[positionNumber];
            }
        }
    }

    /**
     * Обновление точки
     * @method updatePoint
     * @param mapPoint {MapPoint} Точка в метрах
     * @param selector {PointSelector} Селектор точки
     */
    updatePoint(mapPoint: MapPoint, selector: PointSelector): void {
        const point = this.getPoint(selector);
        if (point) {
            const newPoint = mapPoint.toMapPoint(point.getProjectionId());
            point.x = newPoint.x;
            point.y = newPoint.y;
            point.h = newPoint.h;
            this.clearCache();
        }
    }

    /**
     * Удаление точки
     * @method removePoint
     * @param pointSelector {PointSelector} Описание точки
     */
    removePoint(pointSelector: PointSelector): void {
        const {
            objectNumber = 0,
            contourNumber = 0,
            positionNumber = 0
        } = pointSelector;
        const objectContours = this.object[objectNumber];
        if (objectContours) {
            const contourPoints = objectContours[contourNumber];
            if (contourPoints) {
                const point = contourPoints[positionNumber];
                if (point) {
                    contourPoints.splice(positionNumber, 1);
                    this.clearCache();
                }
            }
        }
    }

    removeLastPoint(): void {
        if (this.object.length > 0) {
            const objectContours = this.object[this.object.length - 1];
            if (objectContours.length > 0) {
                const contourPoints = objectContours[objectContours.length - 1];
                contourPoints.pop();
                if (contourPoints.length === 0) {
                    objectContours.pop();
                }
                if (objectContours.length === 0) {
                    this.object.pop();
                }
            }
        }
    }

    /**
     * Удаление всех точек подобъекта
     * @method removeAllContourPoints
     * @param contourSelector {ContourSelector} Номер подобъекта
     */
    removeContour(contourSelector: ContourSelector): void {
        const {
            objectNumber = 0,
            contourNumber = 0
        } = contourSelector;
        const objectContours = this.object[objectNumber];
        if (objectContours) {
            const contourPoints = objectContours[contourNumber];
            if (contourPoints) {
                objectContours.splice(contourNumber, 1);
                this.clearCache();
            }
        }
    }

    /**
     * Удаление всех точек подобъекта
     * @method removeAllContourPoints
     * @param objectSelector {ObjectSelector} Номер подобъекта
     */
    removeObject(objectSelector: ObjectSelector): void {
        const {
            objectNumber = 0
        } = objectSelector;
        const objectContours = this.object[objectNumber];
        if (objectContours) {
            this.object.splice(objectNumber, 1);
            this.clearCache();
        }
    }

    /**
     * Изменение порядка точек контура (обратное направление)
     * @method reverseContour
     * @param contourSelector {ContourSelector} Селектор контура
     */
    reverseContour(contourSelector: ContourSelector): void {
        const {
            objectNumber = 0,
            contourNumber = 0
        } = contourSelector;
        const objectContours = this.object[objectNumber];
        if (objectContours) {
            const contourPoints = objectContours[contourNumber];
            if (contourPoints) {
                contourPoints.reverse();
                this.clearCache();
            }
        }
    }

    /**
     * Удаление всех точек
     * @method removeAllPoints
     */
    clear(): void {
        this.object.length = 0;
        this.clearCache();
    }

    /**
     * Удаление крайней точки подобъекта
     * @method removeLastContourPoint
     * @param contourSelector {ContourSelector} Описание точки
     */
    removeLastContourPoint(contourSelector: ContourSelector = {}): void {
        const {
            objectNumber = 0,
            contourNumber = 0
        } = contourSelector;
        const objectContours = this.object[objectNumber];
        if (objectContours) {
            const contourPoints = objectContours[contourNumber];
            if (contourPoints) {
                contourPoints.pop();
                this.clearCache();
            }
        }
    }

    /**
     * Получение всех точек в одномерном массиве
     * @method getPointList
     * @return {MapPoint[]} Массив точек в градусах
     */
    getPointList(): MapPoint[] {
        const result = [];

        for (let objectNumber = 0; objectNumber < this.object.length; objectNumber++) {

            const objectContours = this.object[objectNumber];

            for (let contourNumber = 0; contourNumber < objectContours.length; contourNumber++) {

                const contourPoints = objectContours[contourNumber];

                for (let position = 0; position < contourPoints.length; position++) {

                    result.push(contourPoints[position].clone());

                }
            }
        }

        return result;
    }

    hasPoints(): boolean {
        return this.object.length > 0 && this.object[0].length > 0 && this.object[0][0].length > 0;
    }

    /**
     * Получение точек для рисования
     * @method getPointListForDrawing
     * @return {MapPoint[][]|MapPoint[][][]} Массив точек
     */
    getPointListForDrawing(): Vector2or3[] | Vector2or3[][] {
        const points = this.getPointList();

        const pointArray: Vector2or3[] = [];
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            pointArray.push(point.toOrigin());
        }

        return pointArray;
    }

    /**
     * Сравнение геометрий
     * @method equals
     * @param other {BaseMapObjectGeometry} Объект геометрии
     * @return {boolean} Если `true`, то геометрии одинаковые
     */
    equals(other: BaseMapObjectGeometry): boolean {
        if (this.object.length !== other.object.length) {
            return false;
        }

        for (let objectNumber = 0; objectNumber < this.object.length; objectNumber++) {

            const objectContours = this.object[objectNumber],
                otherObjectContours = other.object[objectNumber];

            if (objectContours.length !== otherObjectContours.length) {
                return false;
            }

            for (let contourNumber = 0; contourNumber < objectContours.length; contourNumber++) {

                const contourPoints = objectContours[contourNumber],
                    otherContourPoints = otherObjectContours[contourNumber];

                if (contourPoints.length !== otherContourPoints.length) {
                    return false;
                }

                for (let position = 0; position < contourPoints.length; position++) {

                    const mapPoint = contourPoints[position],
                        otherMapPoint = otherContourPoints[position];

                    if (!mapPoint.equals(otherMapPoint)) {
                        return false;
                    }

                }
            }
        }

        return true;
    }

    /**
     * Обновление данных из другой геометрий
     * @method updateFrom
     * @param other {BaseMapObjectGeometry} Объект геометрии
     */
    updateFrom(other: BaseMapObjectGeometry): void {
        this.clear();
        for (let objectNumber = 0; objectNumber < other.object.length; objectNumber++) {

            const objectContours = other.object[objectNumber];

            for (let contourNumber = 0; contourNumber < objectContours.length; contourNumber++) {

                const contourPoints = objectContours[contourNumber];

                for (let positionNumber = 0; positionNumber < contourPoints.length; positionNumber++) {

                    this.addPoint(contourPoints[positionNumber], {
                        positionNumber,
                        contourNumber,
                        objectNumber: objectNumber
                    });

                }
            }
        }

    }

    /**
     * Найти ближайшую точку к указанной
     * @method findNearestInterpolatedPoint
     * @param mapPoint {MapPoint} Точка поиска
     * @param [objectNumber] {number} Номер полигона для поиска
     * @return {MapPoint|undefined} Точка
     */
    findNearestInterpolatedPoint(mapPoint: MapPoint, objectNumber = 0): NearestInterpolatedPointResult | undefined {
        const pointInfo = this.findNearestPoint(mapPoint, objectNumber);
        if (pointInfo) {
            const point = this.getPoint(pointInfo);
            if (point) {
                const maxPosition = this.getContourPoints(pointInfo.objectNumber, pointInfo.contourNumber).length - 1;
                return {
                    point,
                    pointSelectorPrev: pointInfo,
                    pointSelectorNext: {
                        objectNumber: pointInfo.objectNumber,
                        contourNumber: pointInfo.contourNumber,
                        positionNumber: Math.min(pointInfo.positionNumber + 1, maxPosition)
                    }
                };
            }
        }
    }

    /**
     * Найти расстояние от начала объекта до точки
     * @method getDistanceFromStartToPoint
     * @param mapPoint {MapPoint} Точка
     * @param [delta] {number} Область захвата в метрах
     * @return {number|undefined} Расстояние
     */
    getDistanceFromStartToPoint(mapPoint: MapPoint, delta: number): number | undefined {
        let dist: number | undefined;
        if (Array.isArray(this.object[0])) {
            const contour = this.object[0];
            if (Array.isArray(contour)) {
                if (this.checkBorderHover(mapPoint, delta, {objectNumber: 0})) {
                    const result = this.findNearestInterpolatedPoint(mapPoint, 0);
                    if (result) {
                        dist = 0;
                        const {pointSelectorPrev, pointSelectorNext} = result;
                        if (pointSelectorPrev.contourNumber === 0 && pointSelectorNext.contourNumber === 0) {
                            const curPointSelector: PointInfo = {
                                objectNumber: 0,
                                contourNumber: 0,
                                positionNumber: 0
                            };

                            while (curPointSelector.positionNumber < pointSelectorPrev.positionNumber) {
                                const firstPoint = this.getPoint(curPointSelector);
                                curPointSelector.positionNumber++;
                                const secondPoint = this.getPoint(curPointSelector);
                                if (firstPoint && secondPoint) {
                                    dist += firstPoint.realDistanceTo(secondPoint, true);
                                }
                            }

                            const currentPoint = this.getPoint(pointSelectorPrev);
                            if (currentPoint) {
                                dist += currentPoint.realDistanceTo(mapPoint);
                            }

                        }
                    }
                }
            }
        }

        return dist;
    }

    /**
     * Найти точку по расстоянию от начала объекта
     * @method getPointFromStartByDistance
     * @param dist {number} Расстояние
     * @return {MapPoint|undefined} Точка
     */
    getPointFromStartByDistance(dist: number): MapPoint | undefined {
        let mapPoint: MapPoint | undefined;
        if (Array.isArray(this.object[0])) {
            const contour = this.object[0];

            if (Array.isArray(contour)) {

                const points = contour[0];

                if (Array.isArray(points)) {

                    let prevDist = 0;
                    let currentDist = 0;
                    let pointNumber;
                    for (pointNumber = 1; pointNumber < points.length; pointNumber++) {

                        const point = points[pointNumber];

                        currentDist = point.realDistanceTo(points[pointNumber - 1]);

                        if (dist - (prevDist + currentDist) < 0) {
                            break;
                        }

                        prevDist += currentDist;

                    }

                    const delta = dist - prevDist;
                    const point1 = points[pointNumber - 1];
                    const point2 = points[pointNumber];

                    if (point1 && point2) {
                        const x = delta * (point2.x - point1.x) / currentDist + point1.x;
                        const y = delta * (point2.y - point1.y) / currentDist + point1.y;

                        mapPoint = new MapPoint(x, y);
                    }
                }

            }
        }

        return mapPoint;
    }

    /**
     * Повернуть объект
     * @method rotate
     * @param angleValue {number} Угол поворота
     * @param [center] {MapPoint} Центр поворота
     */
    rotate(angleValue: number, center = this.getCenter()): void {
        if (!center) {
            return;
        }

        const currentVector = vec2.create();

        for (let objectNumber = 0; objectNumber < this.object.length; objectNumber++) {

            const objectContours = this.object[objectNumber];

            for (let contourNumber = 0; contourNumber < objectContours.length; contourNumber++) {

                const contourPoints = objectContours[contourNumber];

                for (let positionNumber = 0; positionNumber < contourPoints.length; positionNumber++) {

                    const point = contourPoints[positionNumber];

                    vec2.setValues(currentVector, point.x - center.x, point.y - center.y);
                    vec2.rotate(currentVector, angleValue);

                    const newPoint = point.clone();
                    newPoint.x = currentVector[0] + center.x;
                    newPoint.y = currentVector[1] + center.y;

                    this.updatePoint(newPoint, {objectNumber, contourNumber, positionNumber});
                }
            }
        }
    }

    /**
     * Масштабирование объекта
     * @method scale
     * @param scale {Vector2D} Коэффициенты масштабирования по осям
     * @param [center] {MapPoint} Центр масштабирования
     */
    scale(scale: Vector2D, center = this.getCenter()): void {
        if (!center) {
            return;
        }
        const currentVector = vec2.create();

        for (let objectNumber = 0; objectNumber < this.object.length; objectNumber++) {

            const objectContours = this.object[objectNumber];

            for (let contourNumber = 0; contourNumber < objectContours.length; contourNumber++) {

                const contourPoints = objectContours[contourNumber];

                for (let positionNumber = 0; positionNumber < contourPoints.length; positionNumber++) {

                    const point = contourPoints[positionNumber];

                    vec2.setValues(currentVector, point.x - center.x, point.y - center.y);
                    vec2.multiply(currentVector, scale);

                    const newPoint = point.clone();
                    newPoint.x = currentVector[0] + center.x;
                    newPoint.y = currentVector[1] + center.y;

                    this.updatePoint(newPoint, {objectNumber, contourNumber, positionNumber});
                }
            }
        }
    }

    /**
     * Масштабирование объекта по осям
     * @method scaleByAxis
     * @param scale {Vector2D} Коэффициенты масштабирования по осям
     * @param [center] {MapPoint} Центр масштабирования
     * @param [axis] {{x: Vector2D; y: Vector2D;}} Оси масштабирования
     */
    scaleByAxis(scale: Vector2D, center = this.getCenter(), axis = {x: vec2.UNITY, y: vec2.UNITX}): void {
        if (!center) {
            return;
        }
        const currentVector = vec2.create();

        for (let objectNumber = 0; objectNumber < this.object.length; objectNumber++) {
            const objectContours = this.object[objectNumber];

            for (let contourNumber = 0; contourNumber < objectContours.length; contourNumber++) {
                const contourPoints = objectContours[contourNumber];

                for (let positionNumber = 0; positionNumber < contourPoints.length; positionNumber++) {
                    const point = contourPoints[positionNumber];

                    vec2.setValues(currentVector, point.x - center.x, point.y - center.y);

                    const xProjected = vec2.dot(currentVector, axis.x);
                    const yProjected = vec2.dot(currentVector, axis.y);

                    vec2.setValues(currentVector, xProjected, yProjected);
                    vec2.multiply(currentVector, scale);

                    const [scaleX, scaleY] = currentVector;

                    vec2.scale(axis.x, scaleX, currentVector);
                    vec2.scaleAndAdd(currentVector, axis.y, scaleY, currentVector);

                    const newPoint = point.clone();
                    newPoint.x = currentVector[0] + center.x;
                    newPoint.y = currentVector[1] + center.y;

                    this.updatePoint(newPoint, {objectNumber, contourNumber, positionNumber});
                }
            }
        }
    }

    /**
     * Переместить объект
     * @method move
     * @param move {object} Метры перемещения по осям
     */
    move(move: { deltaX: number; deltaY: number }): void {

        for (let objectNumber = 0; objectNumber < this.object.length; objectNumber++) {

            const objectContours = this.object[objectNumber];

            for (let contourNumber = 0; contourNumber < objectContours.length; contourNumber++) {

                const contourPoints = objectContours[contourNumber];

                for (let positionNumber = 0; positionNumber < contourPoints.length; positionNumber++) {

                    const newPoint = contourPoints[positionNumber].clone();
                    newPoint.x += move.deltaX;
                    newPoint.y += move.deltaY;

                    this.updatePoint(newPoint, {objectNumber, contourNumber, positionNumber});
                }
            }
        }
    }

    /**
     * Получить габариты объекта
     * @method getBounds
     * @return {Bounds} Габариты объекта
     */
    getBounds(): Bounds {
        const bbox = new Bounds(this.getPoint() || new MapPoint());

        this.getPointList().forEach(mapPoint => bbox.extend(mapPoint));

        return bbox;
    }

    /**
     * Получить габариты объекта
     * @method getOriginBounds
     * @return {Vector4D} Габариты объекта
     */
    getOriginBounds(targetProjectionId: string, bounds?: Bounds): Vector4D {
        if (!bounds) {
            bounds = this.getBounds();
        }

        const minPoint = BaseMapObjectGeometry.prepareCoordinate(bounds.min, targetProjectionId);
        const maxPoint = BaseMapObjectGeometry.prepareCoordinate(bounds.max, targetProjectionId);

        return [minPoint[0], minPoint[1], maxPoint[0], maxPoint[1]];
    }

    /**
     * Получить центр объекта
     * @method getCenter
     * @return {MapPoint} Центр объекта
     */
    getCenter(): MapPoint {
        return this.getBounds().getCenter();
    }

    protected getProjectionId(): string | undefined {
        for (let objectNumber = 0; objectNumber < this.object.length; objectNumber++) {
            const objectContours = this.object[objectNumber];
            for (let contourNumber = 0; contourNumber < objectContours.length; contourNumber++) {
                const contourPoints = objectContours[contourNumber];
                for (let position = 0; position < contourPoints.length; position++) {
                    const point = contourPoints[position];
                    if (point) {
                        return contourPoints[position].getProjectionId();
                    }
                }
            }
        }
    }

    /**
     * Замкнуть метрику объекта
     * @method closeObject
     * @return {boolean} Флаг изменения метрики
     */
    closeObject(): boolean {
        if (this.getPointList().length > 1) {

            const firstPoint = this.object[0][0][0];
            const lastObject = this.object.length - 1;
            const lastContour = this.object[lastObject].length - 1;
            const lastPosition = this.object[lastObject][lastContour].length - 1;
            const lastPoint = this.object[lastObject][lastContour][lastPosition];

            if (!firstPoint.equals(lastPoint)) {
                this.addPoint(firstPoint.copy(), {objectNumber: lastObject, contourNumber: lastContour});
                return true;
            }
        }
        return false;
    }

    /**
     * Получить количество подобъектов
     * @method getObjectSubObjectsCount
     */
    getObjectSubObjectsCount(): number {
        return this.object.length;
    }

    /**
     * Получить контуры полигона
     * @method getObjectContours
     * @param objectNumber {number} Номер полигона
     */
    getObjectContours(objectNumber: number): MapPoint[][] | undefined {
        return this.object[objectNumber];
    }

    /**
     * Получить координаты контура полигона
     * @method getContourPoints
     * @param objectNumber {number} Номер полигона
     * @param contourNumber {number} Номер контура в полигоне
     */
    getContourPoints(objectNumber: number, contourNumber: number): MapPoint[] {
        const contours = this.getObjectContours(objectNumber);
        if (contours) {
            return contours[contourNumber];
        }
        return [];
    }

    /**
     * Получить количество контуров в полигоне
     * @method getObjectContoursCount
     * @param objectNumber {number} Номер полигона
     */
    getObjectContoursCount(objectNumber: number): number {
        const contours = this.getObjectContours(objectNumber);
        if (contours) {
            return contours.length;
        }
        return 0;
    }

    /**
     * Добавить новый подобъект в объект
     * @method addEmptySubObject
     */
    addEmptySubObject(): ObjectSelector {
        return {objectNumber: this.object.length - 1};
    }

    /**
     * Добавить пустой контур в полигон
     * @method addEmptyContour
     * @param objectNumber {number} Номер полигона
     */
    addEmptyContour(objectNumber: number): ContourSelector | undefined {
        const contours = this.getObjectContours(objectNumber);
        if (contours) {
            contours.push([]);
            return {objectNumber, contourNumber: contours.length - 1};
        }
    }

    /**
     * Разобрать координаты GeoJSON
     * @protected
     * @method parseCoordinate
     * @param coordinate {Vector2or3} Координаты точки
     * @param [sourceProjection] {string} Проекция координат GeoJSON
     * @return {MapPoint | undefined} Точка в порекции координат GeoJSON
     */
    static parseCoordinate(coordinate: Vector2or3, sourceProjection: string = 'GoogleCRS84Quad'): MapPoint | undefined {
        let mapPoint: MapPoint | undefined;
        if (sourceProjection === 'GoogleCRS84Quad' || sourceProjection === 'OGC:CRS84') {
            const geoPoint = new GeoPoint(coordinate[0], coordinate[1], coordinate[2] || 0, 'GoogleCRS84Quad');
            mapPoint = geoPoint.toMapPoint('GoogleCRS84Quad');
        } else if (sourceProjection === 'EPSG:4326' || sourceProjection === 'urn:ogc:def:crs:EPSG:4326' || sourceProjection === 'urn:ogc:def:crs:EPSG::4326') {
            const geoPoint = new GeoPoint(coordinate[1], coordinate[0], coordinate[2] || 0, 'GoogleCRS84Quad');
            mapPoint = geoPoint.toMapPoint('GoogleCRS84Quad');
        } else {
            mapPoint = MapPoint.fromOriginArray(coordinate, sourceProjection);
        }
        return mapPoint;
    }

    /**
     * Сформировать координаты GeoJSON
     * @method prepareCoordinate
     * @param mapPoint {MapPoint} Точка геометрии
     * @param targetProjectionId {string}  Проекция вывода координат
     * @return {Vector2or3 | undefined} Координаты GeoJSON
     */
    protected static prepareCoordinate(mapPoint: MapPoint, targetProjectionId: string): Vector3D {
        let coordinate: Vector3D = [0, 0, 0];

        if (targetProjectionId === 'GoogleCRS84Quad' || targetProjectionId === 'OGC:CRS84') {
            const geoPoint = mapPoint.toGeoPoint();
            if (geoPoint) {
                coordinate = [geoPoint.getLongitude(), geoPoint.getLatitude(), geoPoint.getHeight()];
            }
        } else if (targetProjectionId === 'EPSG:4326' || targetProjectionId === 'urn:ogc:def:crs:EPSG:4326' || targetProjectionId === 'urn:ogc:def:crs:EPSG::4326') {
            const geoPoint = mapPoint.toGeoPoint();
            if (geoPoint) {
                coordinate = [geoPoint.getLatitude(), geoPoint.getLongitude(), geoPoint.getHeight()];
            }
        } else {
            const currentPoint = mapPoint.toMapPoint(targetProjectionId);
            coordinate = currentPoint.toOrigin();
        }
        return coordinate;
    }

    /**
     * Получить GML точек метрики объекта
     * @deprecated
     * @method getGmlPosList
     * @return {XMLElement|undefined} GML точек метрики объекта
     */
    getGmlPosList(): XMLElement | undefined {
        if (this.getPointList().length == 0) {
            return;
        }
        const dimension = '2';

        const pointList = this.getPointList();
        let str = '';
        for (let i = 0; i < pointList.length; i++) {
            str += pointList[i].toOrigin().slice(0, 2).join(' ');
            str += (i !== pointList.length - 1) ? ' ' : '';
        }

        return new XMLElement('gml:posList', str, {srsDimension: dimension, count: '' + pointList.length});
    }

    /**
     * Получить количество точек геометрии
     * @method getPointCount
     * @return {number} Количество точек
     */
    getPointCount() {
        let pointsCount = 0;

        this.object.forEach(contours => contours.forEach(contour => pointsCount += contour.length));

        return pointsCount;
    }

    // /**
    //  * Найти ближайшую концевую точку к указанной
    //  * @method findNearestEndPoint
    //  * @param mapPoint {MapPoint} Точка поиска
    //  * @return {MapPoint|undefined} Точка
    //  */
    // findNearestEndPoint( mapPoint: MapPoint ): PointInfo {
    //
    //     let result = {
    //         positionNumber: 0, contourNumber: 0, objectNumber: 0
    //     };
    //
    //     const pointList = this.getPointList();
    //
    //     const deltaXY = Cartesian2D.distance( pointList[ 0 ], mapPoint );
    //     const currentDelta = Cartesian2D.distance( pointList[ pointList.length - 1 ], mapPoint );
    //
    //     if ( currentDelta < deltaXY ) {
    //         const objectNumber = this.object.length - 1;
    //         const contourNumber = this.object[ objectNumber ].length - 1;
    //         const positionNumber = this.object[ objectNumber ][ contourNumber ].length - 1;
    //         result = {
    //             positionNumber,
    //             contourNumber,
    //             objectNumber
    //         };
    //     }
    //
    //     return result;
    // }

}
