/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Задача компонента 'Маршруты'                    *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import GwtkMapRouteWidget from './GwtkMapRouteWidget.vue';
import MapWindow from '~/MapWindow';
import GeoPoint from '~/geo/GeoPoint';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import { AppendPointActionState } from '~/systemActions/AppendPointAction';
import VectorLayer from '~/maplayers/VectorLayer';
import Utils from '~/services/Utils';
import SVGrenderer, {
    DEFAULT_SVG_MARKER_ID,
    MAP_ROUTE_END_POINT_SVG_MARKER_ID,
    MAP_ROUTE_START_POINT_SVG_MARKER_ID
} from '~/renderer/SVGrenderer';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import { CURSOR_TYPE, GwtkComponentDescriptionPropsData, RoutePoint } from '~/types/Types';
import RouteDescription, { RouteFeatureJson } from '@/components/GwtkMapRoute/task/RouteDescription';
import PickPointAction from '@/components/GwtkMapRoute/actions/PickPointAction';
import { PointSelector } from '~/mapobject/geometry/BaseMapObjectGeometry';
import MarkerStyle from '~/style/MarkerStyle';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import { Vector2D, Vector2or3 } from '~/3d/engine/core/Types';
import { LogEventType } from '~/types/CommonTypes';
import GwtkError from '~/utils/GwtkError';
import i18n from '@/plugins/i18n';
import { BrowserService } from '~/services/BrowserService';
import PixelPoint from '~/geometry/PixelPoint';
import { LineGeometryType } from '~/utils/GeoJSON';
import RequestService, { HttpParams } from '~/services/RequestServices/common/RequestService';
import { Bounds } from '~/geometry/Bounds';
import { MapPoint } from '~/geometry/MapPoint';
import { CreateRouteByPointsResponse, CreateRouteByPointsParams, ErrorResponse } from '~/services/RequestServices/RestService/Types';
import { SourceRoutes } from '~/types/Options';


export const PICK_POINT_ACTION = 'gwtkmaproute.pickpointaction';
export const REMOVE_ROUTE_POINT = 'gwtkkmaproute.removeroutepoint';
export const RESET_ENTIRE_ROUTE = 'qwtkmaprroute.resetentireroute';
export const SET_ACTIVE_ROUTE_POINT = 'qwtkmaproute.activeroutepoint';
export const SET_ACTIVE_DETAIL_ITEM = 'qwtkmaproute.setactivedetailitem';
export const ADD_ANOTHER_ROUTE_POINT = 'gwtkmaproute.addanotherroutepoint';
export const UPDATE_POINTS_ORDER = 'gwtkmaproute.updatepointsorder';
export const ADD_ROUTE_POINTS = 'gwtkmaproute.addroutepoints';
export const SHOW_ROUTE_HISTORY_LIST = 'gwtkmaproute.showroutehistorylist';
export const SHOW_ROUTE_PAGE = 'gwtkmaproute.showroutepage';
export const GO_TO_ROUTE = 'gwtkmaproute.gotoroute';
export const DELETE_ROUTE_FROM_HISTORY = 'gwtkmaproute.deleteroutefromhistory';
export const SET_FOCUSED_ROUTE = 'gwtkmaproute.setfocusedroute';
export const SET_PROMP_VALUE = 'gwtkmaproute.setprompvalue';
export const SET_SOURCE_ROUTE = 'gwtkmaproute.setsourceroute';
export const UPDATE_KEY_API_YANDEX = 'gwtkmaproute.updatekeyapiyandex';
export const SHOW_ROUTE_DETAIL_LIST = 'gwtkmaproute.showroutedetaillist';
export const BUILDING_ROUTE = 'gwtkmaproute.buildingroute';
export const SET_COORDINATE_VALID_FLAG = 'gwtkmaproute.setcoordinatevalidflag';
export const TOGGLE_TYPE_OF_ROUTE_MEASURE= 'gwtkmaproute.toggletypeofroutemeasure';


//направление поворота маршрута в конце сегмента
//для Яндекс.Карт
export enum Action {
    Straight = 'straight',
    Slight_right = 'slight right',
    Right = 'right',
    Hard_right = 'hard right',
    Back = 'back',
    Hard_left = 'hard left',
    Left = 'left',
    Slight_left = 'slight left',
    Enter_roundabout = 'enter roundabout',
    Leave_roundabout = 'leave roundabout',
    Merge = 'merge',
    Board_ferry = 'board ferry',
    Exit_left = 'exit left',
    Exit_right = 'exit right',
}

export enum ActionCode {
    Straight,
    Slight_right,
    Right,
    Hard_right,
    Back,
    Hard_left,
    Left,
    Slight_left,
    Enter_roundabout,
    Leave_roundabout,
    Merge,
    Board_ferry,
    Exit_right,
    Exit_left,
}

//центр для API Яндекс.Карт
const YMAPS_CENTER_POINT = [55.873, 38.436];
const YMAPS_GEOCODE_TEST_POINT = 'Ногинск';

export type GwtkMapRouteTaskState = {
    [PICK_POINT_ACTION]: boolean;
    [REMOVE_ROUTE_POINT]: number;
    [RESET_ENTIRE_ROUTE]: undefined;
    [SET_ACTIVE_ROUTE_POINT]: number;
    [SET_ACTIVE_DETAIL_ITEM]: Vector2D;
    [ADD_ANOTHER_ROUTE_POINT]: undefined;
    [UPDATE_POINTS_ORDER]: Vector2D;
    [ADD_ROUTE_POINTS]: RoutePoint[];
    [SHOW_ROUTE_HISTORY_LIST]: undefined;
    [SHOW_ROUTE_PAGE]: undefined;
    [GO_TO_ROUTE]: HistoryListItem;
    [DELETE_ROUTE_FROM_HISTORY]: number;
    [SET_FOCUSED_ROUTE]: number;
    [SET_PROMP_VALUE]: number;
    [SET_SOURCE_ROUTE]: SourceRoutes;
    [UPDATE_KEY_API_YANDEX]: string;
    [SHOW_ROUTE_DETAIL_LIST]: undefined;
    [BUILDING_ROUTE]: undefined;
    [SET_COORDINATE_VALID_FLAG]: { index: number, value: boolean };
    [TOGGLE_TYPE_OF_ROUTE_MEASURE]: RouteMeasure;
} & AppendPointActionState;

export type HistoryListItem = {
    routeDescription: RouteFeatureJson,
    resultData: CreateRouteByPointsResponse,
    sourceRoute: SourceRoutes,
    typeOfRouteMeasure: RouteMeasure
}

export enum RouteMeasure {
    Time = 'time',
    Length = 'length',
}

type WidgetParams = {
    setState: GwtkMapRouteTask['setState'];
    routeDescription: RouteDescription;
    showHistoryPanel: boolean;
    historyList: HistoryListItem[];
    focusedRoute: number;
    historyPrompList: RoutePoint[];
    sourceRoutesList: { text: string; value: SourceRoutes; }[]
    sourceRoute: SourceRoutes;
    keyApiYandex: string,
    keyApiYandexRouter: string,
    loadingYmapsScript: boolean,
    apiYandexConnect: boolean,
    apiYandexRouterConnect: boolean,
    showDetailPanel: boolean,
    coordinateValidFlag: boolean[],
    startFindInPointAndSetRoutePoint: boolean,
    typeOfRouteMeasurePanorama: { list: { text: string; value: RouteMeasure }[], select: RouteMeasure };
    typeOfRouteMeasureYandex: { list: { text: string; value: RouteMeasure }[], select: RouteMeasure };
}

type WorkSpaceData = {
    historyList: HistoryListItem[]
}


type YandexRouterResponse = {
    traffic: string
    route: Route
}

type Route = {
    legs: Leg[];
    flags: Flags
}

type Leg = {
    status: string;
    steps: Step[]
}

type Step = {
    duration: number;
    length: number;
    polyline: Polyline;
    mode: string;
    waiting_duration: number;
}

type Polyline = {
    points: number[][];
}

type Flags = {
    hasTolls: boolean;
    hasNonTransactionalTolls: boolean;
}


/**
 * Задача компонента 'Маршруты'
 * @class GwtkMapRouteTask
 * @extends Task
 */
export default class GwtkMapRouteTask extends Task {
    protected workspaceData: WorkSpaceData = {
        historyList: []
    };

    /**
     * Векторный слой отображения измерений
     * @private
     * @readonly
     * @property vectorLayer {VectorLayer}
     */
    protected readonly vectorLayer: VectorLayer;

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    protected mapObjectStartPoint;
    protected mapObjectEndPoint;
    protected mapObjectRouteGeometry;
    protected mapObjectActiveDetailItem;
    protected mapObjectTransitPoints;
    protected mapObjectFinishLines;

    routeDescription: RouteDescription;

    private resultData?: CreateRouteByPointsResponse;
    private ymap!: ymaps.Map;
    private readonly ymapApiKeyinOptions?: string;
    private readonly yRouterApiKeyinOptions?: string;

    private abortXhr?: () => void;

    /**
     * @constructor GwtkMapRouteTask
     * @param mapVue {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor(mapVue: MapWindow, id: string) {
        super(mapVue, id);

        this.actionRegistry.push({
            getConstructor() {
                return PickPointAction;
            },
            id: PICK_POINT_ACTION,
            active: false,
            enabled: true,
        });

        this.routeDescription = new RouteDescription(this.map.options.routecontrol);
        //создаем слой для построения
        this.vectorLayer = new VectorLayer(this.map, {
            alias: '',
            id: Utils.generateGUID(),
            url: ''
        });

        this.mapObjectStartPoint = new MapObject(this.vectorLayer, MapObjectType.Point);
        this.mapObjectEndPoint = new MapObject(this.vectorLayer, MapObjectType.Point);

        this.mapObjectRouteGeometry = new MapObject(this.vectorLayer, MapObjectType.LineString);
        this.mapObjectRouteGeometry.addStyle(new Style({
            stroke: new Stroke({
                color: 'var(--color-purple-01)',
                width: '6px',
                linejoin: 'round'
            })
        }));

        this.mapObjectActiveDetailItem = new MapObject(this.vectorLayer, MapObjectType.Point);
        this.mapObjectTransitPoints = new MapObject(this.vectorLayer, MapObjectType.MultiPoint);

        this.mapObjectFinishLines = new MapObject(this.vectorLayer, MapObjectType.MultiLineString);
        this.mapObjectFinishLines.addStyle(new Style({
            stroke: new Stroke({
                color: 'var(--color-purple-02)',
                width: '6px',
                linejoin: 'round',
                dasharray: '5 5'
            })
        }));

        const yandexParams = this.map.options.remoteServices?.find(item => item.type === SourceRoutes.Yandex);
        if (yandexParams) {
            this.yRouterApiKeyinOptions = this.ymapApiKeyinOptions = yandexParams.apikey;
        }
        const yandexRouterParams = this.map.options.remoteServices?.find(item => item.type === SourceRoutes.YandexRouter);
        if (yandexRouterParams) {
            this.yRouterApiKeyinOptions = yandexRouterParams.apikey;
        }

        const sourceRoutesList: WidgetParams['sourceRoutesList'] = [];
        this.map.options.routecontrol?.forEach(routeParams => {
            sourceRoutesList.push({text: routeParams.alias, value: routeParams.type});
        });
        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            taskId: this.id,
            setState: this.setState.bind(this),

            routeDescription: this.routeDescription,
            showHistoryPanel: false,
            historyList: [],
            focusedRoute: 0,
            historyPrompList: [],
            sourceRoutesList,
            keyApiYandex: '',
            keyApiYandexRouter: '',
            apiYandexConnect: false,
            apiYandexRouterConnect: !!this.yRouterApiKeyinOptions,
            loadingYmapsScript: false,
            sourceRoute: SourceRoutes.Panorama,
            showDetailPanel: false,
            coordinateValidFlag: [],
            startFindInPointAndSetRoutePoint: false,
            typeOfRouteMeasurePanorama: {
                list: [{ text: i18n.tc('route.Calculation of the minimum time'), value: RouteMeasure.Time },
                    { text: i18n.tc('route.Calculation of the minimum distance'), value: RouteMeasure.Length },], select: RouteMeasure.Time
            },
            typeOfRouteMeasureYandex: {
                list: [{ text: i18n.tc('route.Calculation without traffic jams'), value: RouteMeasure.Length },
                    { text: i18n.tc('route.Calculation with traffic jams'), value: RouteMeasure.Time }], select: RouteMeasure.Length
            }
        };
    }

    setup() {
        super.setup();

        if (!this.map.options.routecontrol?.length) {
            this.map.writeProtocolMessage({
                text: i18n.tc('route.Route component parameters are missing'),
                description: 'GwtkMapRoute: setup - ' + i18n.tc('route.Route component parameters are missing'),
                type: LogEventType.Error,
                display: true
            });
            this.mapWindow.getTaskManager().detachTask(this.id);
        } else {
            if (!this.map.options.routecontrol[0].url) {
                this.map.writeProtocolMessage({
                    text: i18n.tc('route.Route component parameters are missing'),
                    description: 'GwtkMapRoute: setup - ' + i18n.tc('route.Route component parameters are missing'),
                    type: LogEventType.Error,
                    display: true
                });
                this.mapWindow.getTaskManager().detachTask(this.id);
            } else {

                if (!this.workspaceData) {
                    this.workspaceData = {
                        historyList: []
                    };
                } else {
                    this.widgetProps.historyList.splice(0);
                    this.workspaceData.historyList.forEach((historyItem: HistoryListItem) => {
                        this.widgetProps.historyList.push(historyItem as HistoryListItem);
                    });
                }
                this.widgetProps.historyPrompList = this.getHistoryPrompList();

                this.setAction(PICK_POINT_ACTION, true);
            }
        }
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const name = 'GwtkMapRouteWidget';
        const source = GwtkMapRouteWidget;
        this.mapWindow.registerComponent(name, source);

        // Создание Vue компонента
        this.mapWindow.createWidget(name, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    private updateRoutePoint(coordinate: GeoPoint, name: string | null, index: number) {
        this.routeDescription.updateRoutePoint(coordinate, name, index);

        this.updateEdgePoint(coordinate, index);

        if (this.routeDescription.isEnoughRoutePoints()) {

            this.routeDescription.removeEmptyPoints();

            this.mapObjectStartPoint.removeAllPoints();
            this.mapObjectTransitPoints.removeAllPoints();
            this.mapObjectEndPoint.removeAllPoints();

            this.fillRouteMapObjects(this.routeDescription.getRoutePoints());
        }
    }

    private fillRouteMapObjects(routePoints: RoutePoint[]) {
        for (let i = 0; i < routePoints.length; i++) {
            const point = routePoints[i];
            if (point.coordinate) {

                if (i === 0) {
                    this.mapObjectStartPoint.addGeoPoint(point.coordinate);
                } else if (i === routePoints.length - 1) {
                    this.mapObjectEndPoint.addGeoPoint(point.coordinate);
                } else {
                    this.mapObjectTransitPoints.addGeoPoint(point.coordinate);
                }
            }
        }
    }
    /**
     * Обработка ошибки при загрузке API Яндекс.Карт
     * @private
     * @method onErrorLoad
     * @returns {void}
     */
    private onErrorLoad() {
        this.widgetProps.loadingYmapsScript = false;
        this.widgetProps.apiYandexConnect = false;
        this.mapWindow.addSnackBarMessage(i18n.tc('route.Error loading the YandexMaps API'));
        GwtkMapRouteTask.deleteScript();
    }

    /**
     * Подключить скрипт API Яндекс.Карт
     * @private
     * @method appendScriptYandex
     * @returns {void}
     */
    private appendScriptYandex() {
        this.widgetProps.loadingYmapsScript = true;
        const script = document.createElement('script');
        const ymapsUrl = this.map.options.routecontrol?.find(routeOptions => routeOptions.type === SourceRoutes.Yandex)?.url || '';
        script.src = `${ymapsUrl}&apikey=${this.ymapApiKeyinOptions ? this.ymapApiKeyinOptions : this.widgetProps.keyApiYandex}`;
        script.id = 'apiYandexMaps';

        script.onerror = () => {
            this.widgetProps.apiYandexConnect = false;
            this.onErrorLoad();
        };
        script.onload = () => {
            if (ymaps) {
                ymaps.ready().then(() => {
                    this.widgetProps.loadingYmapsScript = false;
                    this.startYandexMapApi(YMAPS_CENTER_POINT);
                }).catch(() => {
                    this.onErrorLoad();
                });
            }
        };
        script.addEventListener('error', function (e) {
            e.stopPropagation();
        });
        try {
            document.head.append(script);
        } catch (error) {
            GwtkMapRouteTask.deleteScript();
            delete (window as any).ymaps;
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({ text: gwtkError.message, type: LogEventType.Error });
            this.mapWindow.addSnackBarMessage(i18n.tc('route.Error loading the YandexMaps API'));
        }
    }

    /**
     * Запустить API Яндекс.Карт
     * @private
     * @method startYandexMapApi
     * @param centerPoint {number[]} центр карты
     * @returns {void}
     */
    private startYandexMapApi(centerPoint: number[]) {
        const mapDiv = document.createElement('div');
        this.ymap = new ymaps.Map(mapDiv, { center: centerPoint, zoom: 16 });
        //проверка действительности API ключа используя функцию геокодирования
        ymaps.geocode(YMAPS_GEOCODE_TEST_POINT, { results: 1 }).then(() => {
            this.widgetProps.apiYandexConnect = true;
            this.mapWindow.addSnackBarMessage(i18n.tc('route.The YandexMaps API is enabled'));
        }).catch(() => this.onErrorCheckApiKey());
    }

    /**
    * Обработка ошибки при проверке ключа API Яндекс.Карт
    * @private
    * @method onErrorCheckApiKey
    * @returns {void}
    */
    private onErrorCheckApiKey() {
        this.widgetProps.loadingYmapsScript = false;
        this.widgetProps.apiYandexConnect = false;
        this.mapWindow.addSnackBarMessage(i18n.tc('route.Error checking the YandexMaps key'));
        GwtkMapRouteTask.deleteScript();
        delete (window as any).ymaps;
    }
    /**
     * Удалить скрипт подключения Яндекс.Карт
     * @method deleteScript
     * @private
     */
    private static deleteScript() {
        const script = document.getElementById('apiYandexMaps');
        if (script) {
            script.remove();
        }
    }
    /**
     * Получение маршрута от API Яндекс Детали Маршрута
     * @private
     * @method getRouteFromYandexRouter
     * @returns {void}
     */
    private getRouteFromYandexRouter(): Promise<void> {
        return new Promise((resolve, reject) => {
            const startPoint = this.parsePointList(this.routeDescription.pointList)[0];
            const bound = new Bounds(new MapPoint(startPoint[0], startPoint[1], 0, this.vectorLayer.map.ProjectionId));
            const waypoints = this.transformCoordinatesForYandexRouter(this.routeDescription.pointList);
            const traffic = this.widgetProps.typeOfRouteMeasureYandex.select === RouteMeasure.Length?'disabled':'';
            const yRouterUrl = this.map.options.routecontrol?.find(routeOptions => routeOptions.type === SourceRoutes.YandexRouter)?.url || '';
            const url = `${yRouterUrl}?waypoints=${waypoints}&apikey=${this.yRouterApiKeyinOptions || this.widgetProps.keyApiYandexRouter}${traffic ? `&traffic=${traffic}` : ''}`;
            const httpParams = { url: url, responseType: 'json' } as HttpParams;
            const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.COMMON);
            service.commonGet<YandexRouterResponse>(undefined, httpParams).then((result) => {
                if (result.data && result.data.route.legs.length) {
                    this.widgetProps.apiYandexRouterConnect = true;
                    this.resultData = GwtkMapRouteTask.createResultData();
                    this.resultData.routeinfo.splice(0);
                    const segmentStartEndCoordinates: number[][] = [];
                    //Количество отрезков маршрута (путей) между точками, указанный в параметре waypoints
                    const legs = result.data.route.legs.length;
                    //Шаги, выполнение которых требуется для прохождения отрезка маршрута
                    let steps: Step[];
                    //Ломаная линия, составляющая маршрут
                    let polyline: Polyline;
                    for (let i = 0; i < legs; i++) {
                        this.resultData.routeinfo.push({
                            length: 0,
                            time: 0,
                            detail: [],
                        });
                        steps = result.data.route.legs[i].steps;
                        for (let j = 0; j < steps.length; j++) {
                            polyline = result.data.route.legs[i].steps[j].polyline;

                            const coords = polyline.points;
                            coords.forEach(coord => bound.extend(new MapPoint(coord[0], coord[1], 0, this.vectorLayer.map.ProjectionId)));
                            //если добавлено 3 и более точек, то путей становится более 1
                            if (i > 0) {
                                this.resultData.features.push({
                                    type: 'Feature',
                                    geometry: {
                                        type: MapObjectType.LineString,
                                        coordinates: []
                                    },
                                    properties: {
                                        id: '',
                                        perimeter: 1,
                                        code: 1,
                                        layer: '',
                                        layerid: '',
                                        schema: '',
                                        name: ''
                                    }
                                });
                            }

                            (this.resultData.features[i].geometry as LineGeometryType).coordinates
                                .push(...this.swapCoordinates(polyline.points) as Vector2or3[]);
                            this.resultData.routeinfo[i].detail.push({
                                point: polyline.points[0] as Vector2D,
                                name: '',
                                length: steps[j].length,
                                time: steps[j].duration,
                                code: 0, //код действия - влево, вправо для роутера отсутствует
                            });
                        }
                        this.resultData.routeinfo[i].length = this.resultData.routeinfo[i].detail.reduce((totalLength, route) => totalLength + route.length, 0);
                        this.resultData.routeinfo[i].time = this.resultData.routeinfo[i].detail.reduce((totalTime, route) => totalTime + route.time, 0);
                    }
                    if (this.resultData.bbox) {
                        this.resultData.bbox.splice(0);
                        this.resultData.bbox.push(bound.min.y);
                        this.resultData.bbox.push(bound.min.x);
                        this.resultData.bbox.push(bound.max.y);
                        this.resultData.bbox.push(bound.max.x);
                    }
                    segmentStartEndCoordinates.splice(0);
                    this.saveRouteToHistory(this.resultData);
                    resolve();
                }

            }).catch((error: any) => {
                this.map.writeProtocolMessage({
                    text: i18n.tc('route.Error executing a Yandex API request'),
                    display: true,
                    description: error.message,
                    type: LogEventType.Error
                });
                reject(error);
            });

        });
    }
    /**
     * Преобразование строки с координатами под
     * формат Yandex router <lat1,lon1|lat2,lon2|...>
     * @private
     * @method transformCoordinatesForYandexRouter
     * @returns {string}
     */
    private transformCoordinatesForYandexRouter(pointList: string) {
        const elements = pointList.split(',');
        const transformed = [];
        if (elements.length % 2 === 0) {
            for (let i = 0; i < elements.length; i += 2) {
                transformed.push(`${elements[i]},${elements[i + 1]}`);
            }
            return transformed.join('|');
        } else {
            this.mapWindow.addSnackBarMessage(i18n.tc('route.Error coordinate format'));
        }
    }

    /**
     * Получение маршрута от API Яндекс.Карт
     * @private
     * @method getYmapsRoute
     * @returns {void}
     */
    private getYmapsRoute(): Promise<void> {
        const avoidTrafficJams = this.widgetProps.typeOfRouteMeasureYandex.select === RouteMeasure.Length ? false : true;
        return new Promise((resolve, reject) => {
            if (this.parsePointList(this.routeDescription.pointList).length) {
                const startPoint = this.parsePointList(this.routeDescription.pointList)[0];
                //зададим pathBound для дальнейшего заполнения bbox маршрута
                const pathBound = new Bounds(new MapPoint(startPoint[0], startPoint[1], 0, this.vectorLayer.map.ProjectionId));
                ymaps.route(
                    this.parsePointList(this.routeDescription.pointList),
                    {
                        avoidTrafficJams: avoidTrafficJams,
                    }
                ).then((route: ymaps.Route) => {
                    this.ymap.geoObjects.add(route);
                    this.resultData = GwtkMapRouteTask.createResultData();
                    let path: ymaps.Path;
                    let segments: ymaps.Segment[];
                    this.resultData.routeinfo.splice(0);
                    //Возвращает количество геообъектов в коллекции
                    const countGeoObjects = route.getPaths().getLength();
                    for (let i = 0; i < countGeoObjects; i++) {
                        path = route.getPaths().get(i) as ymaps.Path;

                        this.resultData.routeinfo.push({
                            length: path.getLength(),
                            time: path.getTime(),
                            detail: [],
                        });
                        segments = path.getSegments();
                        for (let j = 0; j < segments.length; j++) {

                            if (segments[j].getTime() === 0 || segments[j].getLength() === 0) {
                                //при добавлении новой точки маршрута от Яндекс Карт может прийти 0, эту точку не добавляем
                                continue;
                            }
                            const coords = segments[j].getCoordinates();
                            coords.forEach(coord => pathBound.extend(new MapPoint(coord[0], coord[1], 0, this.vectorLayer.map.ProjectionId)));
                            //если добавлено 3 и более точек, то путей становится более 1
                            if (i > 0) {
                                this.resultData.features.push({
                                    type: 'Feature',
                                    geometry: {
                                        type: MapObjectType.LineString,
                                        coordinates: []
                                    },
                                    properties: {
                                        id: '',
                                        perimeter: 1,
                                        code: 1,
                                        layer: '',
                                        layerid: '',
                                        schema: '',
                                        name: ''
                                    }
                                });
                            }
                            (this.resultData.features[i].geometry as LineGeometryType).coordinates
                                .push(...this.swapCoordinates(segments[j].getCoordinates()) as Vector2or3[]);

                            this.resultData.routeinfo[i].detail.push({
                                point: segments[j].getCoordinates()[0] as Vector2D,
                                name: segments[j].getStreet() ? segments[j].getStreet() : '',
                                length: segments[j].getLength(),
                                time: segments[j].getTime(),
                                code: this.convertAction(segments[j].getAction()), //код действия - влево, вправо ...
                            });
                        }
                    }
                    if (this.resultData.bbox) {
                        this.resultData.bbox.splice(0);
                        this.resultData.bbox.push(pathBound.min.y);
                        this.resultData.bbox.push(pathBound.min.x);
                        this.resultData.bbox.push(pathBound.max.y);
                        this.resultData.bbox.push(pathBound.max.x);
                    }
                    this.saveRouteToHistory(this.resultData);
                    resolve();
                }).catch((error: any) => {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('route.Error executing a Yandex API request'),
                        display: true,
                        description: error.message,
                        type: LogEventType.Error
                    });
                    reject(error);
                });
            } else {
                this.mapWindow.addSnackBarMessage(i18n.tc('route.Error coordinate format'));
                reject();
            }
        });
    }

    /**
     * Поменять местами широту и долготу в паре координат
     * @private
     * @method swapCoordinates
     * @param coordinatePairs {number[][]} массив массивов точек широта - долгота
     * @returns {number[]}
     */
    private swapCoordinates(coordinatePairs: number[][]) {
        return coordinatePairs.map(coordinatePair => [coordinatePair[1], coordinatePair[0]]);
    }

    /**
     * Преобразует строку со значением направление поворота маршрута в конце сегмента
     * в числовое значение.
     * @private
     * @param key {string} строка координат
     * @method convertAction
     */
    private convertAction(key: string) {
        //в случае, если от ЯндексКарт прийдет номер съезда при круговом движении,
        //например, LEAVE_ROUNDABOUT 2
        if (key.includes(Action.Leave_roundabout) && key.length > Action.Leave_roundabout.length) {
            key = key.split(' ').slice(0, 2).join(' ');
        }
        switch (key) {
            case Action.Straight:
                return ActionCode.Straight;
            case Action.Slight_right:
                return ActionCode.Slight_right;
            case Action.Right:
                return ActionCode.Right;
            case Action.Hard_right:
                return ActionCode.Hard_right;
            case Action.Back:
                return ActionCode.Back;
            case Action.Hard_left:
                return ActionCode.Hard_left;
            case Action.Left:
                return ActionCode.Left;
            case Action.Slight_left:
                return ActionCode.Slight_left;
            case Action.Enter_roundabout:
                return ActionCode.Enter_roundabout;
            case Action.Leave_roundabout:
                return ActionCode.Leave_roundabout;
            case Action.Merge:
                return ActionCode.Merge;
            case Action.Board_ferry:
                return ActionCode.Board_ferry;
            case Action.Exit_right:
                return ActionCode.Exit_right;
            case Action.Exit_left:
                return ActionCode.Exit_left;
            default:
                return ActionCode.Straight;
        }
    }

    /**
     * Формирует пустой объект результата маршрутизации
     * @static
     * @method createResultData
     */

    static createResultData(): CreateRouteByPointsResponse {
        return {
            type: 'FeatureCollection',
            bbox: [0, 0, 0, 0],
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: MapObjectType.LineString,
                        coordinates: []
                    },
                    properties: {
                        id: '',
                        perimeter: 1,
                        code: 1,
                        layer: '',
                        layerid: '',
                        schema: '',
                        name: ''
                    }
                }
            ],
            properties: {
                numberMatched: 1,
                numberReturned: 1
            },
            routeinfo: [
                {
                    length: 1,
                    time: 1,
                    detail: [
                        {
                            point: [1, 1],
                            name: '',
                            length: 1,
                            time: 1,
                            code: 1
                        }

                    ]
                }
            ]

        };
    }

    /**
     * Преобразует строку с координатами в массив
     * @private
     * @param pointList {string} строка координат
     * @method parsePointList
     * @return {number[][]} массив массивов точек широта - долгота
     */
    private parsePointList(pointList: string): number[][] {
        const coords = pointList.split(',');
        if (coords.length % 2 === 0) {
            const coordPairs = [];
            for (let i = 0; i < coords.length; i += 2) {
                const latitude = parseFloat(coords[i]);
                const longtitude = parseFloat(coords[i + 1]);
                coordPairs.push([latitude, longtitude]);
            }
            return coordPairs;
        } else {
            this.map.writeProtocolMessage({
                text: i18n.tc('route.Coordinate conversion error'),
                description: i18n.tc('route.Coordinate conversion error'),
                type: LogEventType.Error,
                display: true
            });
            return [];
        }
    }

    private updateEdgePoint(coordinate: GeoPoint, index: number) {
        this.routeDescription.setActiveRoutePoint(-1);
        this.widgetProps.focusedRoute = -1;

        if (index === 0) {
            this.mapObjectStartPoint.removeAllPoints();
            this.mapObjectStartPoint.addGeoPoint(coordinate);

            if (this.routeDescription.hasEmptyPoint) {
                this.routeDescription.setActiveRoutePoint(1);
                this.widgetProps.focusedRoute = 1;
            }
        } else if (index === this.routeDescription.getRoutePointsCount() - 1) {
            this.mapObjectEndPoint.removeAllPoints();
            this.mapObjectEndPoint.addGeoPoint(coordinate);

            if (this.routeDescription.hasEmptyPoint) {
                this.routeDescription.setActiveRoutePoint(0);
                this.widgetProps.focusedRoute = 0;
            }
        }
    }

    private addNewRoutePoint() {
        this.routeDescription.addNewRoutePoint();
    }

    private updatePointsOrder(value: Vector2D) {
        const list = this.routeDescription.getRoutePoints().slice();
        const oldIndex = value[0];
        const newIndex = value[1];

        const oldIndexItem = list[oldIndex];
        list.splice(oldIndex, 1);
        list.splice(newIndex, 0, oldIndexItem);

        this.clearMapObjects();
        this.routeDescription.resetRouteDetails();
        this.routeDescription.updateRoutePoints(list);

        let emptyPoint = false;
        if (this.routeDescription.getRoutePointStart().coordinate) {
            this.mapObjectStartPoint.addGeoPoint(this.routeDescription.getRoutePointStart().coordinate!);
        } else {
            emptyPoint = true;
        }

        if (this.routeDescription.getRoutePointEnd().coordinate) {
            this.mapObjectEndPoint.addGeoPoint(this.routeDescription.getRoutePointEnd().coordinate!);
        } else {
            emptyPoint = true;
        }

        for (let pointIndex = 1; pointIndex < this.routeDescription.getRoutePointsCount() - 1; pointIndex++) {
            const point = this.routeDescription.getRoutePointByIndex(pointIndex);
            if (point.coordinate) {
                this.mapObjectTransitPoints.addGeoPoint(point.coordinate!);
            } else {
                emptyPoint = true;
            }
        }
    }

    async sendRequest() {
        this.routeDescription.setIsReady(false);
        if (this.widgetProps.sourceRoute === SourceRoutes.Panorama) {

            const requestParams: CreateRouteByPointsParams = {
                LAYER: this.routeDescription.layer || '',
                POINTLIST: this.routeDescription.pointList,
                MEASURE: this.widgetProps.typeOfRouteMeasurePanorama.select
            };

            const url = this.map.options.routecontrol?.find(routeOptions => routeOptions.type === SourceRoutes.Panorama)?.url || this.map.options.url;

            const httpParams = { url, requestParams };
            const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
            
            try {
                const request = RequestService.sendCancellableRequest(service.createRouteByPoints.bind(service), requestParams);

                this.abortXhr = () => request.abortXhr('Cancelled by User');

                const result = await request.promise;

                if (result.data) {
                    this.resultData = result.data;
                    this.saveRouteToHistory(this.resultData);
                } else if (result.error) {
                    this.mapWindow.addSnackBarMessage(i18n.tc('route.The route was not found'));
                    const error = result.error as ErrorResponse;

                    this.map.writeProtocolMessage({
                        text: i18n.tc('route.No data to build a route') + '(' + error.ExceptionReport.text + ')',
                        description: error.ExceptionReport.description,
                        type: LogEventType.Error,
                        display: false
                    });
                }

                this.routeDescription.setIsReady(true);

            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({ text: gwtkError.message, type: LogEventType.Error });
                this.routeDescription.setIsReady(true);
            } finally {
                this.setAction(PICK_POINT_ACTION, false);
            }
        } else if (this.widgetProps.sourceRoute === SourceRoutes.Yandex) {
            try {
                await this.getYmapsRoute();
                this.routeDescription.setIsReady(true);
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({ text: gwtkError.message, type: LogEventType.Error });
                this.routeDescription.setIsReady(true);
            } finally {
                this.setAction(PICK_POINT_ACTION, false);
            }
        } else {
            try {
                await this.getRouteFromYandexRouter();
                this.routeDescription.setIsReady(true);
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({ text: gwtkError.message, type: LogEventType.Error });
                this.routeDescription.setIsReady(true);
            } finally {
                this.setAction(PICK_POINT_ACTION, false);
            }
        }

    }

    /**
     * Сохранить маршрут в историю
     * @private
     * @method saveRouteToHistory
     * @param data {CreateRouteByPointsResponse}
     **/
    private saveRouteToHistory(data: CreateRouteByPointsResponse) {
        this.workspaceData.historyList.unshift({
            routeDescription: this.routeDescription.toJSON(),
            resultData: data,
            sourceRoute: this.widgetProps.sourceRoute,
            typeOfRouteMeasure: this.widgetProps.sourceRoute === SourceRoutes.Panorama?this.widgetProps.typeOfRouteMeasurePanorama.select:this.widgetProps.typeOfRouteMeasureYandex.select
        });
        this.writeWorkspaceData(true);

        this.widgetProps.historyList.splice(0);
        this.workspaceData.historyList.forEach((historyItem: HistoryListItem) => {
            this.widgetProps.historyList.push(historyItem);
        });
        this.widgetProps.historyPrompList.splice(0);
        this.widgetProps.historyPrompList = this.getHistoryPrompList();
    }


    private fillRouteGeometry() {
        if (this.resultData && this.resultData.routeinfo && this.resultData.features) {
            this.routeDescription.updateRouteDetails(this.resultData.routeinfo);
            // заполнение геометрии маршрута
            this.mapObjectRouteGeometry.removeAllPoints();
            this.mapObjectFinishLines.removeAllPoints();
            this.mapObjectActiveDetailItem.removeAllPoints();
            this.routeDescription.resetActiveRouteDetailIndex();
            for (let featureNumber = 0; featureNumber < this.resultData.features.length; featureNumber++) {
                const coordinatesCount = this.resultData.features[featureNumber].geometry.coordinates.length;

                const coordinates = this.resultData.features[featureNumber].geometry.coordinates as Vector2D[];
                if (coordinatesCount && coordinates) {

                    let geometryStartPoint;
                    let geometryEndPoint;
                    for (let coordinateNumber = 0; coordinateNumber < coordinatesCount; coordinateNumber++) {
                        const coordinate: Vector2D = coordinates[coordinateNumber];
                        const geoPoint = new GeoPoint(coordinate[0], coordinate[1]);
                        this.mapObjectRouteGeometry.addGeoPoint(geoPoint);

                        if (coordinateNumber === 0) {
                            geometryStartPoint = geoPoint;
                        }

                        if (coordinateNumber === coordinatesCount - 1) {
                            geometryEndPoint = geoPoint;
                        }
                    }

                    let pointSelector: PointSelector = { contourNumber: featureNumber };

                    if (featureNumber === 0 && geometryStartPoint) {
                        this.mapObjectFinishLines.addGeoPoint(geometryStartPoint, pointSelector);
                        this.mapObjectFinishLines.addGeoPoint(this.routeDescription.getRoutePointStart().coordinate!, pointSelector);
                    }

                    if (geometryEndPoint) {
                        pointSelector.contourNumber = featureNumber + 1;
                        this.mapObjectFinishLines.addGeoPoint(geometryEndPoint, pointSelector);
                        this.mapObjectFinishLines.addGeoPoint(this.routeDescription.getRoutePointByIndex(featureNumber + 1).coordinate!, pointSelector);
                    }

                }
            }

            const routeBbox = this.resultData.bbox;
            if (routeBbox) {
                const bounds = new Bounds(new GeoPoint(routeBbox[0], routeBbox[1], 0, this.vectorLayer.map.ProjectionId).toMapPoint(), new GeoPoint(routeBbox[2], routeBbox[3], 0, this.vectorLayer.map.ProjectionId).toMapPoint());
                this.map.fitBounds(bounds);
            }
        } else {
            this.routeDescription.setCannotGetRouteMessage();
        }
    }

    /**
     * Перейти к выбраному маршруту из истории
     * @private
     * @method goToRouteFromHistory
     * @param routeFromHistory {HistoryListItem}
     **/
    private goToRouteFromHistory(routeFromHistory: HistoryListItem) {
        this.routeDescription = RouteDescription.fromJSON(routeFromHistory.routeDescription);
        this.routeDescription.setIsReady(true);

        this.widgetProps.routeDescription = this.routeDescription;

        this.resultData = routeFromHistory.resultData;
        this.widgetProps.sourceRoute = routeFromHistory.sourceRoute;
        if (this.widgetProps.sourceRoute === SourceRoutes.Panorama) {
            this.widgetProps.typeOfRouteMeasurePanorama.select = routeFromHistory.typeOfRouteMeasure;
        } else {
            this.widgetProps.typeOfRouteMeasureYandex.select = routeFromHistory.typeOfRouteMeasure;
        }

        this.setAction(PICK_POINT_ACTION, false);

        this.mapObjectStartPoint.removeAllPoints();
        this.mapObjectTransitPoints.removeAllPoints();
        this.mapObjectEndPoint.removeAllPoints();

        this.fillRouteMapObjects(this.routeDescription.getRoutePoints());

        this.fillRouteGeometry();
        this.widgetProps.showHistoryPanel = false;
        //заполним массив coordinateValidFlag значениями true
        //для всех точек. Cчитаем, что из истории загружаются только точки с валидными координатами
        const { length } = routeFromHistory.routeDescription.routePoints;
        this.widgetProps.coordinateValidFlag.splice(0);
        this.widgetProps.coordinateValidFlag.length = length;
        this.widgetProps.coordinateValidFlag.fill(true);
    }

    /**
     * Удалить маршрут из списка истории
     * @private
     * @method deleteRouteFromHistory
     * @param routeIndex{Number}
     */
    private deleteRouteFromHistory(routeIndex: number) {
        this.workspaceData.historyList.splice(routeIndex, 1);
        this.writeWorkspaceData(true);

        this.widgetProps.historyList.splice(0);
        this.workspaceData.historyList.forEach((historyItem: HistoryListItem) => {
            this.widgetProps.historyList.push(historyItem);
        });
    }

    /**
     * Получить список для подсказок
     * @private
     * @method getHistoryPrompList
     */
    private getHistoryPrompList() {
        let prompList: RoutePoint[] = [];

        const enteredRoutePoints = this.routeDescription.getRoutePoints();
        const geoLocationIsIndex = enteredRoutePoints.map((route: RoutePoint) => route.name).indexOf(i18n.tc('phrases.My location'));

        if (BrowserService.checkGeolocation() && geoLocationIsIndex === -1) {
            prompList.push(
                {
                    coordinate: null,
                    name: i18n.tc('phrases.My location')
                }
            );
        }

        const historyListLength = this.widgetProps.historyList.length;

        for (let historyIndex = historyListLength - 1; historyIndex >= 0; historyIndex--) {
            const history = this.widgetProps.historyList[historyIndex];
            const historyRouteDescription = RouteDescription.fromJSON(history.routeDescription);
            const historyRoutePoints = historyRouteDescription.getRoutePoints();

            if (historyRoutePoints[0].coordinate !== null && historyRoutePoints[0].name !== null) {
                const prompListIndex = prompList.map((promp: RoutePoint) => promp.name).indexOf(historyRoutePoints[0].name);
                const historyRouteIsEntered = enteredRoutePoints.map((routeItem: RoutePoint) => routeItem.name).indexOf(historyRoutePoints[0].name);
                if (prompListIndex === -1 && historyRouteIsEntered === -1) {
                    prompList.push(historyRoutePoints[0]);
                }
            }

            if (prompList.length >= 5) {
                break;
            }
        }

        return prompList;
    }

    /**
     * Получить координаты по геолокации,
     * сделать запрос для получения названия и
     * формировать точку для маршрута
     * @private
     * @method getGeolocationInGeoPoint
     */
    private getGeolocationInGeoPoint() {
        // Запросить координаты
        const watchUserNumber = BrowserService.watchUserPosition(result => {
            const coords = result.coords;
            const cursorGeoPoint = new GeoPoint(coords.longitude, coords.latitude, coords.altitude || 0, this.map.ProjectionId);
            const cursorPixelPoint = this.map.geoToPixel(cursorGeoPoint);

            this.findInPointAndSetRoutePoint(cursorPixelPoint, cursorGeoPoint, i18n.tc('phrases.My location'));

            if (watchUserNumber !== undefined) {
                BrowserService.stopWatchUserPosition(watchUserNumber);
            }
        }, reason => {
            if (reason.code === reason.PERMISSION_DENIED) {
                this.map.writeProtocolMessage({
                    text: i18n.t('geolocation.Permission for geolocation denied') as string,
                    display: true
                });
            } else if (reason.code === reason.POSITION_UNAVAILABLE) {
                this.map.writeProtocolMessage({
                    text: i18n.t('geolocation.Position unavailable') as string,
                    display: true
                });
            } else if (reason.code === reason.TIMEOUT) {
                this.map.writeProtocolMessage({
                    text: i18n.t('geolocation.Geolocation activation time exceeded') as string,
                    display: true
                });
            }
            if (watchUserNumber !== undefined) {
                BrowserService.stopWatchUserPosition(watchUserNumber);
            }
        });
    }


    /**
     * Выполнить поиск по точке в карте для получения и установки точки маршрута
     * @method findInPointAndSetRoutePoint
     * @param cursorPixelPoint {PixelPoint}
     * @param cursorGeoPoint {GeoPoint}
     * @param geoPointName{ String | undefined}
     */
    findInPointAndSetRoutePoint(cursorPixelPoint: PixelPoint, cursorGeoPoint: GeoPoint, geoPointName?: string) {
        this.widgetProps.startFindInPointAndSetRoutePoint = true;
        this.map.searchManager.findInPoint(cursorPixelPoint).then(result => {
            let name: string | null = null;
            if (geoPointName === undefined) {
                if (result && result.mapObjects) {
                    for (let objectNumber = 0; objectNumber < result.mapObjects.length; objectNumber++) {
                        const mapObject = result.mapObjects[objectNumber];
                        const semanticObjName = mapObject.getSemantic('ObjName');

                        if (semanticObjName) {
                            name = semanticObjName.value as string;
                        }
                        if (name !== undefined) {
                            break;
                        }
                    }
                    if (name === undefined && result.mapObjects[0]) {
                        const objectName = result.mapObjects[0].objectName;
                        const layerName = result.mapObjects[0].layerName;
                        if (objectName) {
                            name = objectName;
                        } else if (layerName) {
                            name = layerName;
                        }
                    }
                    if (name === undefined) {
                        name = i18n.tc('phrases.Map point');
                    }
                }
            } else {
                name = geoPointName;
            }

            const routePoints: RoutePoint[] = [];
            routePoints.push({ coordinate: cursorGeoPoint, name: name });
            this.setState(ADD_ROUTE_POINTS, routePoints);
        }).finally(() => {
            this.widgetProps.startFindInPointAndSetRoutePoint = false;
            if (typeof geoPointName !== 'undefined') {
                this.widgetProps.historyPrompList.splice(0);
                this.widgetProps.historyPrompList = this.getHistoryPrompList();
            }

            this.mapWindow.setCursor(CURSOR_TYPE.crosshair);
        });
    }

    onPreRender(renderer: SVGrenderer) {
        if (
            this.mapObjectTransitPoints.isDirty ||
            this.mapObjectStartPoint.isDirty ||
            this.mapObjectEndPoint.isDirty ||
            this.mapObjectRouteGeometry.isDirty ||
            this.mapObjectFinishLines.isDirty ||
            this.mapObjectActiveDetailItem.isDirty
        ) {
            this.mapObjectTransitPoints.isDirty = false;
            this.mapObjectStartPoint.isDirty = false;
            this.mapObjectEndPoint.isDirty = false;
            this.mapObjectRouteGeometry.isDirty = false;
            this.mapObjectFinishLines.isDirty = false;
            this.mapObjectActiveDetailItem.isDirty = false;
            this.map.requestRender();
        }

    }

    onPostRender(renderer: SVGrenderer) {
        if (this.map) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.mapObjectTransitPoints, new Style({ marker: new MarkerStyle({ markerId: MAP_ROUTE_START_POINT_SVG_MARKER_ID }) }));
            this.map.mapObjectsViewer.drawMapObject(renderer, this.mapObjectStartPoint, new Style({ marker: new MarkerStyle({ markerId: MAP_ROUTE_START_POINT_SVG_MARKER_ID }) }));
            this.map.mapObjectsViewer.drawMapObject(renderer, this.mapObjectEndPoint, new Style({ marker: new MarkerStyle({ markerId: MAP_ROUTE_END_POINT_SVG_MARKER_ID }) }));

            this.map.mapObjectsViewer.drawMapObject(renderer, this.mapObjectRouteGeometry);
            this.map.mapObjectsViewer.drawMapObject(renderer, this.mapObjectFinishLines);
            this.map.mapObjectsViewer.drawMapObject(renderer, this.mapObjectActiveDetailItem, new Style({ marker: new MarkerStyle({ markerId: DEFAULT_SVG_MARKER_ID }) }));
        }
    }

    setState<K extends keyof GwtkMapRouteTaskState>(key: K, value: GwtkMapRouteTaskState[ K ]) {
        switch (key) {
            case PICK_POINT_ACTION:
                this.setAction(key, true);
                break;

            case SET_ACTIVE_ROUTE_POINT:

                const indexActive = value as number;

                if (!this.routeDescription.hasEmptyPoint) {
                    this.setAction(PICK_POINT_ACTION, false);
                }

                if (indexActive !== this.routeDescription.getActiveRoutePoint()) {
                    if (indexActive < this.routeDescription.getRoutePointsCount()) {
                        this.routeDescription.setActiveRoutePoint(indexActive);
                        this.widgetProps.focusedRoute = indexActive;
                        this.setAction(PICK_POINT_ACTION, true);
                    }
                } else {
                    this.routeDescription.setActiveRoutePoint(indexActive);
                    this.widgetProps.focusedRoute = indexActive;
                    this.setAction(PICK_POINT_ACTION, true);
                }

                break;

            case REMOVE_ROUTE_POINT:
                this.clearMapObjects();
                this.routeDescription.resetRouteDetails();
                this.routeDescription.resetCannotGetRouteMessage();

                this.routeDescription.setActiveRoutePoint(-1);
                this.widgetProps.focusedRoute = -1;
                this.widgetProps.coordinateValidFlag.splice(value as number, 1);
                this.routeDescription.resetActiveRouteDetailIndex();

                this.routeDescription.removeRotePoint(value as number);
                this.routeDescription.removeEmptyPoints();

                this.fillRouteMapObjects(this.routeDescription.getRoutePoints());

                if (!this.routeDescription.isEnoughRoutePoints()) {
                    this.routeDescription.setActiveRoutePoint(1);
                    this.widgetProps.focusedRoute = 1;
                }
                break;

            case RESET_ENTIRE_ROUTE:
                this.clearMapObjects();
                this.routeDescription.clear();
                this.routeDescription.resetCannotGetRouteMessage();
                this.widgetProps.focusedRoute = -1;
                this.widgetProps.coordinateValidFlag.splice(0);

                this.widgetProps.historyPrompList.splice(0);
                this.widgetProps.historyPrompList = this.getHistoryPrompList();

                this.setAction(PICK_POINT_ACTION, true);
                break;

            case SET_ACTIVE_DETAIL_ITEM:
                this.setActiveDetailItem(value as Vector2D);
                break;

            case UPDATE_POINTS_ORDER:
                this.updatePointsOrder(value as Vector2D);
                this.routeDescription.setActiveRoutePoint(-1);
                this.widgetProps.focusedRoute = -1;
                this.routeDescription.resetActiveRouteDetailIndex();
                break;

            case ADD_ANOTHER_ROUTE_POINT:
                this.addNewRoutePoint();

                this.routeDescription.setActiveRoutePoint(this.routeDescription.getRoutePointsCount() - 1);
                this.widgetProps.focusedRoute = this.routeDescription.getRoutePointsCount() - 1;
                this.setAction(PICK_POINT_ACTION, true);
                break;

            case ADD_ROUTE_POINTS:
                const routePoints = value as RoutePoint[];
                this.setState(SET_COORDINATE_VALID_FLAG, { index: this.routeDescription.getActiveRoutePoint(), value: true });
                if (routePoints.length === 1 && routePoints[0].coordinate) {
                    const coordinateCopy = routePoints[0].coordinate.copy();
                    this.updateRoutePoint(coordinateCopy, routePoints[0].name, this.routeDescription.getActiveRoutePoint());
                } else {
                    routePoints.forEach(routePoint => {
                        if (routePoint.coordinate) {
                            const coordinateCopy = routePoint.coordinate.copy();
                            this.routeDescription.addRoutePoint(coordinateCopy, routePoint.name);
                        }
                    });

                    this.fillRouteMapObjects(this.routeDescription.getRoutePoints());
                }
                break;

            case SHOW_ROUTE_HISTORY_LIST:
                this.widgetProps.showHistoryPanel = true;
                break;

            case SHOW_ROUTE_PAGE:
                this.widgetProps.showHistoryPanel = false;
                this.widgetProps.showDetailPanel = false;
                break;

            case GO_TO_ROUTE:
                this.goToRouteFromHistory(value as HistoryListItem);
                break;

            case DELETE_ROUTE_FROM_HISTORY:
                this.deleteRouteFromHistory(value as number);
                break;

            case SET_FOCUSED_ROUTE:
                this.widgetProps.focusedRoute = value as number;
                break;

            case SET_PROMP_VALUE:
                const prompIndex = value as number;
                const prompName = this.widgetProps.historyPrompList[prompIndex].name;
                if (prompName !== i18n.tc('phrases.My location')) {
                    const routePoints: RoutePoint[] = [];
                    routePoints.push(this.widgetProps.historyPrompList[prompIndex]);
                    this.setState(ADD_ROUTE_POINTS, routePoints);

                    this.widgetProps.historyPrompList.splice(0);
                    this.widgetProps.historyPrompList = this.getHistoryPrompList();

                } else {
                    this.getGeolocationInGeoPoint();
                }
                break;
            case SET_SOURCE_ROUTE:
                this.widgetProps.sourceRoute = value as SourceRoutes;
                if (this.widgetProps.sourceRoute === SourceRoutes.Yandex && this.ymapApiKeyinOptions && !this.widgetProps.apiYandexConnect) {
                    this.appendScriptYandex();
                }
                break;
            case UPDATE_KEY_API_YANDEX:
                if (this.widgetProps.sourceRoute === SourceRoutes.Yandex) {
                    this.widgetProps.keyApiYandex = value as string;
                    this.appendScriptYandex();
                } else if (this.widgetProps.sourceRoute === SourceRoutes.YandexRouter) {
                    this.widgetProps.keyApiYandexRouter = value as string;
                }
                break;
            case SHOW_ROUTE_DETAIL_LIST:
                this.widgetProps.showDetailPanel = true;
                break;
            case BUILDING_ROUTE:
                this.sendRequest().then(() => {
                    this.fillRouteGeometry();
                });
                break;
            //для проверки правильности введенных координат
            case SET_COORDINATE_VALID_FLAG:
                const flag = value as { index: number, value: boolean };
                this.widgetProps.coordinateValidFlag.splice(flag.index, 1, flag.value);
                break;
            case TOGGLE_TYPE_OF_ROUTE_MEASURE:
                if (this.widgetProps.sourceRoute === SourceRoutes.Panorama) {
                    this.widgetProps.typeOfRouteMeasurePanorama.select = value as RouteMeasure;
                } else {
                    this.widgetProps.typeOfRouteMeasureYandex.select = value as RouteMeasure;
                }
                break;
            default:
                if (this._action) {
                    this._action.setState(key, value);
                }
        }
    }

    private setActiveDetailItem(index: Vector2D) {
        if (this.routeDescription._routeDetails) {
            this.mapObjectActiveDetailItem.removeAllPoints();
            const coordinate = this.routeDescription._routeDetails[index[0]].detail[index[1]].point;
            const geoPoint = new GeoPoint(coordinate[1], coordinate[0]);
            this.mapObjectActiveDetailItem.addGeoPoint(geoPoint);

            this.routeDescription.setActiveRouteDetailIndex({ index1: index[0], index2: index[1] });
        }
    }

    private setAction(id: string, active: boolean) {
        this.routeDescription.setPickPointEnabled(active);
        if (active) {
            this.doAction(id);
            this.mapWindow.setCursor(CURSOR_TYPE.crosshair);
        } else {
            this.quitAction(id);
            this.mapWindow.setCursor(CURSOR_TYPE.default);
        }
    }

    private clearMapObjects() {
        this.mapObjectTransitPoints.removeAllPoints();
        this.mapObjectRouteGeometry.removeAllPoints();
        this.mapObjectFinishLines.removeAllPoints();
        this.mapObjectEndPoint.removeAllPoints();
        this.mapObjectStartPoint.removeAllPoints();
        this.mapObjectActiveDetailItem.removeAllPoints();
    }

    protected destroy() {
        if (this.abortXhr) {
            this.abortXhr();
        }
        this.clearMapObjects();
        this.setAction(PICK_POINT_ACTION, false);
        super.destroy();
        this.map.requestRender();
        GwtkMapRouteTask.deleteScript();
        delete (window as any).ymaps;
    }
}
