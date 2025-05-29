import TranslateList from '~/translate/TTranslateList';
import GeoPointRad from '~/geo/GeoPointRad';
import {MatrixPixelPoint} from '~/geometry/MatrixPixelPoint';
import GeoPoint from '~/geo/GeoPoint';
import TranslateFactory from '~/translate/TranslateFactory';
import {Cartesian2D} from '~/geometry/Cartesian2D';
import {Vector2D, Vector2or3, Vector3D} from '~/3d/engine/core/Types';
import Trigonometry from '~/geo/Trigonometry';
import {TTranslate} from '~/translate/TTranslate';
import {TranslateDescription} from '~/translate/Types';
import MapCalculations from '~/geo/MapCalculations';
import {MAPPROJECTION} from '~/translate/Enumrables';


// Класс хранения точек для пересчетов
export class MapPoint extends Cartesian2D {

    h: number;

    /**
     * Параметры пересчета
     */
    get Translate() {
        return TranslateList.getItem(this.projectionId);
    }

    /**
     * Конструктор
     * @param [x] {number} Координата 1 (ось вверх)
     * @param [y] {number} Координата 2 (ость вправо)
     * @param [h] {number} Координата 3 (высота)
     * @param [projectionId] {string} идентификатор проекции
     */
    constructor(x = 0, y = 0, h = 0, private readonly projectionId: string = 'GoogleMapsCompatible') {
        super(x, y);
        this.h = h;
    }

    /**
     * Запросить идентификатор проекции
     * @returns {string} Идентификатор проекции
     */
    getProjectionId(): string {
        return this.projectionId;
    }

    /**
     * Получить координаты точки в пикселях в матрице тайлов
     * @param zoom
     * @returns {MatrixPixelPoint}
     */
    toPixelPoint(zoom: number): MatrixPixelPoint {
        const zeroPoint = new MatrixPixelPoint();
        if (!this.Translate)
            return zeroPoint;
        const tileMatrix = this.Translate.getTileMatix();
        if (!tileMatrix) {
            return zeroPoint;
        }

        // if ( tileMatrix.Ogc.isGeoSys() && !this.toGeoPoint() ) {
        //     return undefined;
        // }
        const pixelPoint = tileMatrix.getPixelInMatrixByPoint(zoom, this);
        Cartesian2D.swapAxis(pixelPoint, pixelPoint);

        return pixelPoint;
    }

    /**
     * Преобразовать из метров проекции в метры проекции projectionId
     * @param projectionId идентификатор проекции пересчета
     * @returns
     */
    toMapPoint(projectionId: string): MapPoint {

        if (projectionId === this.getProjectionId()) {
            return this;
        }

        let translate = TranslateList.getItem(projectionId);
        if (!this.Translate || !translate) {
            throw Error('Projection description not found');
        }
        let b = TranslateFactory.createTDouble(this.x);
        let l = TranslateFactory.createTDouble(this.y);
        let h = TranslateFactory.createTDouble(this.h);

        if (this.Translate.IsGeoSupported && translate.IsGeoSupported) {
            this.Translate.xy2bl_one(b, l);
            this.Translate.geoToGeo3dWGS84(b, l, h);
            translate.geoWGS84ToGeo(b, l);
            if (
                translate.getProjectionType() === MAPPROJECTION.GAUSSCONFORMAL ||
                translate.getProjectionType() === MAPPROJECTION.UTM ||
                translate.getProjectionType() === MAPPROJECTION.GAUSSCONFORMAL_SYSTEM_63
            ) {
                translate.SetAxisMeridian(l.Value);
            }
            translate.bl2xy_one(b, l);
        }

        return new MapPoint(b.Value, l.Value, h.Value, projectionId);
    }

    /**
     * Преобразовать из метров проекции в радианы
     * @param projectionId идентификатор проекции пересчета
     * @returns
     */
    toGeoPointRad(projectionId?: string): GeoPointRad | undefined {
        if (!this.Translate || !this.Translate.IsGeoSupported) {
            return undefined;
        }

        let b = TranslateFactory.createTDouble();
        let l = TranslateFactory.createTDouble();
        let h = TranslateFactory.createTDouble();
        this.Translate.xy2bl(this.x, this.y, b, l);

        if (projectionId) {
            let translate = TranslateList.getItem(projectionId);
            if (!translate || !translate.IsGeoSupported) {
                return undefined;
            }

            this.Translate.geoToGeo3dWGS84(b, l, h);
            translate.geoWGS84ToGeo(b, l);
            return new GeoPointRad(l.Value, b.Value, this.h, projectionId);
        }
        return new GeoPointRad(l.Value, b.Value, this.h, this.projectionId);
    }

    /**
     * Преобразовать из метров проекции в градусы
     * @param projectionId идентификатор проекции пересчета
     * @returns
     */
    toGeoPoint(projectionId?: string): GeoPoint | undefined {
        const point = this.toGeoPointRad(projectionId);
        if (!point) return undefined;
        return Trigonometry.toDegrees(point);
    }

    /**
     * Проинициализировать из массива с учетом системы координат
     * @param inValue массив значений
     * @param projectionId {string} идентификатор проекции
     * @returns
     */
    static fromOriginArray(inValue: Vector2or3, projectionId: string): MapPoint {

        const Translate = TranslateList.getItem(projectionId);
        if (!Translate) {
            throw Error('Projection description not found');
        }

        const mapOrder = inValue.slice();
        if (Translate.needTurnCoordinate()) {
            mapOrder[0] = inValue[1];
            mapOrder[1] = inValue[0];
        }

        return new MapPoint(mapOrder[0], mapOrder[1], mapOrder[2], projectionId);
    }

    /**
     * Получить массив значений с учетом системы координат
     * @method getOrigin
     * @returns {number[]} массив значений
     */
    toOrigin(): Vector3D {
        if (!this.Translate || !this.Translate.needTurnCoordinate()) {
            return [this.x, this.y, this.h || 0];
        } else {
            return [this.y, this.x, this.h || 0];
        }
    }


    /**
     * Получить массив значений
     * @method toVector2D
     * @returns {[number,number]} массив значений
     */
    toVector2D(): Vector2D {
        return [this.x, this.y];
    }


    add(point: MapPoint, result = new MapPoint(0, 0, 0, this.projectionId)): MapPoint {
        if (this.projectionId !== result.projectionId) {
            throw Error('Projection mismatch');
        }
        if (this.projectionId !== point.projectionId) {
            point = point.toMapPoint(this.projectionId);
        }
        Cartesian2D.add(this, point, result);
        result.h = this.h + point.h;
        return result;
    }

    subtract(point: MapPoint, result = new MapPoint(0, 0, 0, this.projectionId)): MapPoint {
        if (this.projectionId !== result.projectionId) {
            throw Error('Projection mismatch');
        }
        if (this.projectionId !== point.projectionId) {
            point = point.toMapPoint(this.projectionId);
        }
        Cartesian2D.subtract(this, point, result);
        result.h = this.h - point.h;
        return result;
    }

    /**
     * Расстояние до точки
     * @method distanceTo
     * @param point {MapPoint} Точка для вычисления расстояния от текущей
     * @returns {number} Расстояние до точки
     */
    distanceTo(point: MapPoint): number {
        const sizePoint = this.subtract(point);

        return Math.sqrt(sizePoint.x * sizePoint.x + sizePoint.y * sizePoint.y + sizePoint.h * sizePoint.h);
    }

    /**
     * Расстояние до точки на местности
     * @method realDistanceTo
     * @param otherPoint {MapPoint} Точка для вычисления расстояния от текущей
     * @param [useHeight] {boolean} Фдаг использования высотной координаты
     * @returns {number|undefined} Расстояние до точки
     */
    realDistanceTo(otherPoint: MapPoint, useHeight = false): number {
        otherPoint = otherPoint.toMapPoint(this.projectionId);

        if (this.Translate && this.Translate.IsGeoSupported) {
            const currentGeoPoint = this.toGeoPoint();
            const otherGeoPoint = otherPoint.toGeoPoint();

            if (!currentGeoPoint || !otherGeoPoint) {
                throw Error(this.projectionId + ': toGeoPoint() error');
            }

            const b1 = Trigonometry.toRadians(currentGeoPoint.getLatitude());
            let l1 = Trigonometry.toRadians(currentGeoPoint.getLongitude());
            const b2 = Trigonometry.toRadians(otherGeoPoint.getLatitude());
            let l2 = Trigonometry.toRadians(otherGeoPoint.getLongitude());

            if (l1 < 0) {  // Требует проверки для отрицательных L
                if (l2 < 0 || (l2 - l1) < Math.PI) {
                    l1 += 2 * Math.PI;
                    l2 += 2 * Math.PI;
                } else {
                    l1 += 2 * Math.PI;
                }
            } else if (l2 < 0) {
                if ((l1 - l2) < Math.PI) {
                    l1 += 2.0 * Math.PI;
                    l2 += 2.0 * Math.PI;
                } else {
                    l2 += 2.0 * Math.PI;
                }
            }

            let delta = l2 - l1;
            if (delta < 0)
                delta = -delta;
            if (delta > Trigonometry.toRadians(5)) {
                // Больше 5 градусов по долготе - построить локсодромию на отрезок и вернуть ее длину
                return this.Translate.calcPathLength(MapCalculations.buildOrthodromeRadians(b1, l1, b2, l2));
            }

            const translate = new TTranslate('', {} as TranslateDescription);
            translate.setTopoTranslate((l1 + l2) / 2);

            const b1TDouble = TranslateFactory.createTDouble(b1);
            const l1TDouble = TranslateFactory.createTDouble(l1);
            const b2TDouble = TranslateFactory.createTDouble(b2);
            const l2TDouble = TranslateFactory.createTDouble(l2);

            translate.bl2xy_one(b1TDouble, l1TDouble);
            translate.bl2xy_one(b2TDouble, l2TDouble);
            const dx = b1TDouble.Value - b2TDouble.Value;
            const dy = l1TDouble.Value - l2TDouble.Value;

            if (useHeight) {
                const dh = currentGeoPoint.getHeight() - otherGeoPoint.getHeight();
                return Math.sqrt(dx * dx + dy * dy + dh * dh);
            }
            return Math.sqrt( dx * dx + dy * dy );
        } else {
            return this.distanceTo(otherPoint);
        }
    }


    /**
     * Равенство двух точек
     * @method equals
     * @param point {MapPoint} Точка для сравнения
     * @returns {boolean} `true` - равны
     */
    equals(point: MapPoint): boolean {
        return Cartesian2D.equals(this, point) && this.h === point.h && this.projectionId === point.projectionId;
    }

    /**
     * Преобразовать в строку
     * @method toString
     * @returns {string}
     */
    toString(): string {
        return `(${Cartesian2D.formatNum(this.x)}, ${Cartesian2D.formatNum(this.y)}, ${Cartesian2D.formatNum(this.h)})`;
    }

    /**
     * Создать копию точки
     * @method copy
     * @param [result] {Cartesian2D} Объект для записи результата
     * @return {Cartesian2D} Объект с записанным результатом (или новая точка)
     */
    clone(result = new MapPoint(0, 0, 0, this.projectionId)): MapPoint {
        if (this.projectionId !== result.projectionId) {
            throw Error('Projection mismatch');
        }
        Cartesian2D.clone(this, result);
        result.h = this.h;
        return result;
    }

    copy() {
        return this.clone();
    }

}