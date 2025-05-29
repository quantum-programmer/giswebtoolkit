/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Класс описания маршрута                        *
 *                                                                  *
 *******************************************************************/

import {GwtkOptions, SourceRoutes} from '~/types/Options';
import GeoPoint from '~/geo/GeoPoint';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import { RoutePoint } from '~/types/Types';

type RouteDetails = {
    detail: {
        code: number;
        name: string;
        point: number[];
        length: number;
        time: number;
    }[];
    length: number;
    time: number;
}[] | undefined

export type RouteFeatureJson = {
    activeRouteDetailIndex: { index1: number, index2: number };
    activeRoutePoint: number;
    cannotGetRoute: boolean;
    isReady: boolean;
    pickPointEnabled: boolean;
    routeControl: { url: string, layer?: string; type: SourceRoutes; alias: string; }[] | undefined;
    routeDetails: RouteDetails;
    routePoints: RouteFeaturePointsJson[];
}

type RouteFeaturePointsJson = {
    coordinate: {
        latitude?: number,
        longitude?: number,
        height?: number,
        ProjectionId?: string
    } | null,
    name: string | null
}
/**
 * Класс описания маршрута
 * @class RouteDescription
 */
export default class RouteDescription {

    private readonly routePoints: RoutePoint[] = [
        {
            coordinate: null,
            name: null
        },
        {
            coordinate: null,
            name: null
        }
    ];

    private routeDetails?: RouteDetails = undefined;

    private isReady = true;

    private pickPointEnabled = false;

    private activeRoutePoint = 0;

    private activeRouteDetailIndex: { index1: number, index2: number } = { index1: -1, index2: -1 };

    private cannotGetRoute = false;

    constructor(private readonly routeControl: GwtkOptions['routecontrol']) {

    }

    /**
     * Получить пункты маршрута
     * @return {RoutePoint[]} Массив пунктов маршрута
     */
    getRoutePoints() {
        return this.routePoints;
    }

    /**
     * Проверить наличие пустых пунктов маршрута
     * @return {boolean}
     */
    get hasEmptyPoint() {
        this.getRoutePoints().forEach((point: RoutePoint, index: number) => {
            if (!point) {
                this.removeRotePoint(index);
            }
        });

        const points = this.getRoutePoints();
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            if (!point.coordinate) {
                return true;
            }
        }

        return false;
    }

    /**
     * Получить пункт маршрута по номеру
     * @param index {number} Номер пункта
     * @return {RoutePoint}
     */
    getRoutePointByIndex(index: number) {
        return this.routePoints[index];
    }

    /**
     * Получить начальный пункт маршрута
     * @return {RoutePoint}
     */
    getRoutePointStart() {
        return this.getRoutePointByIndex(0);
    }

    /**
     * Получить конечный пункт маршрута
     * @return {RoutePoint}
     */
    getRoutePointEnd() {
        return this.getRoutePointByIndex(this.getRoutePointsCount() - 1);
    }

    /**
     * Обновить детали маршрута
     * @param routeDetails {RouteDetails} Детали маршрута
     */
    updateRouteDetails(routeDetails: RouteDetails) {
        this.routeDetails = routeDetails;
    }

    /**
     * Получить LAYER параметр запроса
     * @return {string} Параметр запроса
     */
    get layer() {
        return this.routeControl![0].layer;
    }

    /**
     * Получить POINTLIST параметр запроса
     * @return {string} Параметр запроса
     */
    get pointList() {
        const routePoints = this.getRoutePoints();

        let coordinateCount = 0;
        let routePointsString = '';
        routePoints.forEach(routePoint => {
            if (routePoint && routePoint.coordinate) {
                routePointsString += routePoint.coordinate!.getLatitude().toFixed(6) + ',' +
                    routePoint.coordinate!.getLongitude().toFixed(6) + ',';

                coordinateCount++;
            }
        });

        if (coordinateCount > 1) {
            return routePointsString.substring(0, routePointsString.length - 1);
        } else {
            return '';
        }

    }

    /**
     * Получить сервис для запроса
     * @return {CommonService}
     */
    getService() {
        return RequestServices.retrieveOrCreate({
            url: this.routeControl![0].url
        }, ServiceType.COMMON);
    }

    /**
     * Установить статус выполнения запроса на построение маршрута
     * @param status {boolean} Статус выполнения запроса
     */
    setIsReady(status: boolean) {
        this.isReady = status;
    }

    /**
     * Получить статус выполнения запроса на построение маршрута
     * @return {boolean} Статус выполнения запроса
     */
    getIsReady() {
        return this.isReady;
    }

    /**
     * Получить детализацию маршрута
     * @return {RouteDetails} Детализация маршрута
     */
    get _routeDetails() {
        return this.routeDetails;
    }

    /**
     * Установить пункт маршрута по номеру
     * @param point {RoutePoint} Пункт маршрута
     * @param index {number} Номер пункта маршрута
     */
    setRoutePointByIndex(point: RoutePoint, index: number) {
        this.routePoints.splice(index, 1, point);
    }

    /**
     * Поучить количество пунктов маршрута
     * @return {number}
     */
    getRoutePointsCount() {
        return this.routePoints.length;
    }

    /**
     * Установить номер активного пункта маршрута
     * @param index {number}
     */
    setActiveRoutePoint(index: number) {
        this.activeRoutePoint = index;
    }

    /**
     * Получить номер активного пункта маршрута
     * @return {number}
     */
    getActiveRoutePoint() {
        return this.activeRoutePoint;
    }

    setActiveRouteDetailIndex({ index1, index2 }: { index1: number, index2: number }) {
        this.activeRouteDetailIndex = { index1, index2 };
    }

    resetActiveRouteDetailIndex() {
        this.activeRouteDetailIndex = { index1: -1, index2: -1 };
    }

    get _activeRouteDetailIndex() {
        return this.activeRouteDetailIndex;
    }

    /**
     * Добавить пункт маршрута
     * @param coordinate {GeoPoint} Координаты пункта маршрута
     * @param name {string} Наименование пункта маршрута
     */
    addRoutePoint(coordinate: GeoPoint, name: string | null) {
        const routePoint = {
            coordinate: coordinate,
            name: name
        };

        if (this.routePoints[0].coordinate === null) {
            this.routePoints.splice(0, 1, routePoint);
        } else if (this.routePoints[1].coordinate === null) {
            this.routePoints.splice(1, 1, routePoint);
        } else {
            this.routePoints.splice(this.routePoints.length - 1, 1, routePoint);
        }

    }

    /**
     * Обновить пункт маршрута
     * @param coordinate {GeoPoint} Координаты пункта маршрута
     * @param name {string} Наименование пункта маршрута
     * @param index {number} Номер пункта маршрута от 0
     */
    updateRoutePoint(coordinate: GeoPoint, name: string | null, index: number) {
        if (index < this.routePoints.length) {
            const routePoint = {
                coordinate: coordinate,
                name: name
            };
            this.routePoints.splice(index, 1, routePoint);
        }
    }

    /**
     * Добавить новый пункт маршрута (пустой)
     */
    addNewRoutePoint() {
        this.routePoints.push({ coordinate: null, name: null });
    }

    /**
     * Удалить пункт маршрута по номеру
     * @param index {number} номер пункта маршрута
     */
    removeRotePoint(index: number) {
        this.routePoints.splice(index, 1);
    }

    /** Проверка определения достаточного количества пунктов маршрута
     * @return {boolean}
     */
    isEnoughRoutePoints() {
        let definedPointsCount = 0;

        this.routePoints.forEach(routePoint => {
            if (routePoint && routePoint.coordinate) {
                definedPointsCount++;
            }
        });

        return (definedPointsCount > 1);
    }

    /**
     * Удалить пустые пункты маршрута
     */
    removeEmptyPoints() {
        for (let i = this.routePoints.length - 1; i > 0; i--) {
            if (this.routePoints.length === 2) {
                break;
            }

            const point = this.routePoints[i];
            if (point && !point.coordinate) {
                this.routePoints.splice(i, 1);
            }
        }

    }

    /**
     * Сбросить детализацию маршрута
     */
    resetRouteDetails() {
        this.routeDetails = undefined;
    }

    /**
     * Обновить массив пунктов маршрута
     * @param newRoutePoints {RoutePoint[]} Новый массив пунктов маршрута
     */
    updateRoutePoints(newRoutePoints: RoutePoint[]) {
        this.routePoints.length = 0;
        newRoutePoints.forEach(newRoutePoint => this.routePoints.push(newRoutePoint));
    }

    /**
     * Установить статус режима выбора точки на карте
     * @param status {boolean}
     */
    setPickPointEnabled(status: boolean) {
        this.pickPointEnabled = status;
    }

    /**
     * Получить статус режима выбора точки на карте
     * @return {boolean}
     */
    getPickPointEnabled() {
        return this.pickPointEnabled;
    }

    /**
     * Очистить массив пунктов маршрута
     */
    clear() {
        this.routePoints.splice(0);

        this.routePoints.push({ coordinate: null, name: null });
        this.routePoints.push({ coordinate: null, name: null });

        this.routeDetails = undefined;

        this.isReady = true;

        this.pickPointEnabled = true;

        this.activeRoutePoint = 0;

        this.resetActiveRouteDetailIndex();
    }

    setCannotGetRouteMessage() {
        this.cannotGetRoute = true;
    }

    resetCannotGetRouteMessage() {
        this.cannotGetRoute = false;
    }

    getCannotGetRoute() {
        return this.cannotGetRoute;
    }

    /**
     * Восстановить класс из JSON
     * @static
     * @method fromJSON
     * @param jsonFeature
     * @return RouteDescription
     */
    static fromJSON(jsonFeature: RouteFeatureJson): RouteDescription {
        let routeDescription: RouteDescription = new RouteDescription(jsonFeature.routeControl);
        routeDescription.updateRouteDetails(jsonFeature.routeDetails);
        routeDescription.setActiveRouteDetailIndex(jsonFeature.activeRouteDetailIndex);
        routeDescription.setActiveRoutePoint(jsonFeature.activeRoutePoint);
        jsonFeature.cannotGetRoute ? routeDescription.setCannotGetRouteMessage() : routeDescription.resetCannotGetRouteMessage();
        routeDescription.setIsReady(jsonFeature.isReady);
        routeDescription.setPickPointEnabled(jsonFeature.pickPointEnabled);
        routeDescription.routePoints.splice(0);
        jsonFeature.routePoints.forEach((point) => {
            routeDescription.routePoints.push({
                coordinate: new GeoPoint(
                    point.coordinate?.longitude,
                    point.coordinate?.latitude,
                    point.coordinate?.height,
                    point.coordinate?.ProjectionId
                ),
                name: point.name
            });
        });

        return routeDescription;
    }

    /**
     * Данные из класса перевести в JSON
     * @static
     * @method toJSON
     * @return RouteFeatureJson
     */
    toJSON(): RouteFeatureJson {
        let routePoints: RouteFeaturePointsJson[] = [];
        this.getRoutePoints().forEach((point: RoutePoint) => {
            routePoints.push({
                name: point.name,
                coordinate: {
                    latitude: point.coordinate?.getLatitude(),
                    longitude: point.coordinate?.getLongitude(),
                    height: point.coordinate?.getHeight(),
                    ProjectionId: point.coordinate?.getProjectionId()
                }
            });
        });
        return {
            activeRoutePoint: this.activeRoutePoint,
            activeRouteDetailIndex: this._activeRouteDetailIndex,
            cannotGetRoute: this.getCannotGetRoute(),
            isReady: this.getIsReady(),
            routePoints: routePoints,
            routeDetails: this._routeDetails,
            routeControl: this.routeControl,
            pickPointEnabled: this.getPickPointEnabled()
        };
    }

}
