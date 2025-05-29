/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент Расчеты по карте                      *
 *                                                                  *
 *******************************************************************/

import Task, { ActionDescription } from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import { CURSOR_TYPE, GwtkComponentDescriptionPropsData } from '~/types/Types';
import GwtkMapCalculationsWidget from './GwtkMapCalculationsWidget.vue';
import MapCalculationsDirectAction from '@/components/GwtkMapCalculations/actions/MapCalculationsDirectAction';
import MapCalculationsInverseAction from '@/components/GwtkMapCalculations/actions/MapCalculationsInverseAction';
import {
    AngleUnit,
    CursorCoordinateUnit,
    PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE,
    WorkspaceValues
} from '~/utils/WorkspaceManager';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import Utils from '~/services/Utils';
import GeoPoint from '~/geo/GeoPoint';
import Style from '~/style/Style';
import MarkerStyle from '~/style/MarkerStyle';
import SVGrenderer, { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import i18n from '@/plugins/i18n';
import { LogEventType } from '~/types/CommonTypes';
import { CalculateLengthResponse } from '~/services/RequestServices/RestService/Types';
import { MapPoint } from '~/geometry/MapPoint';
import Trigonometry from '~/geo/Trigonometry';
import GeoPointRad from '~/geo/GeoPointRad';


export const MAPCALCULATIONS_DIRECT_ACTION = 'gwtkmapcalculations.direct';
export const MAPCALCULATIONS_INVERSE_ACTION = 'gwtkmapcalculations.inverse';
export const MAPCALCULATIONS_ACTION_ID = 'gwtkmapcalculations.actionId';
export const MAPCALCULATIONS_AZIMUTH = 'gwtkmapcalculations.azimuth';
export const MAPCALCULATIONS_DISTANCE = 'gwtkmapcalculations.distance';
export const MAPCALCULATIONS_FIRST_POINT = 'gwtkmapcalculations.first_point';
export const MAPCALCULATIONS_FIRST_POINT_LATITUDE = 'gwtkmapcalculations.first_point_lat';
export const MAPCALCULATIONS_FIRST_POINT_LONGITUDE = 'gwtkmapcalculations.first_point_lng';
export const MAPCALCULATIONS_SECOND_POINT_LATITUDE = 'gwtkmapcalculations.second_point_lat';
export const MAPCALCULATIONS_SECOND_POINT_LONGITUDE = 'gwtkmapcalculations.second_point_lng';
export const MAPCALCULATIONS_SECOND_POINT = 'gwtkmapcalculations.second_point';
export const MAPCALCULATIONS_SET_POINTS = 'gwtkmapcalculations.set_points';

export type GwtkMapCalculationsTaskState = {
    [MAPCALCULATIONS_ACTION_ID]: string;
    [MAPCALCULATIONS_AZIMUTH]: string;
    [MAPCALCULATIONS_FIRST_POINT]: boolean;
    [MAPCALCULATIONS_FIRST_POINT_LATITUDE]: number;
    [MAPCALCULATIONS_FIRST_POINT_LONGITUDE]: number;
    [MAPCALCULATIONS_SECOND_POINT]: GeoPoint;
    [MAPCALCULATIONS_DISTANCE]: string;
    [MAPCALCULATIONS_INVERSE_ACTION]: GeoPoint;
    [MAPCALCULATIONS_SET_POINTS]: PointParam;
};

export type PointParam = {
    value: string;
    degreesType: 'latitude' | 'longitude';
    pointName: 'first' | 'second';
};

type WidgetParams = {
    actionId: string;
    azimuth: string;
    distance: string;
    first_point: boolean;
    first_point_latitude: number;
    first_point_longitude: number;
    second_point_latitude: number;
    second_point_longitude: number;
    regimes: (ActionDescription | undefined)[];
    angularCoordinateFormat: AngleUnit;
    coordinateDisplayFormat: CursorCoordinateUnit;
    updateCoordinateFormat: string;
    minValueForX: number;
    maxValueForX: number;
    minValueForY: number;
    maxValueForY: number;
    setState: GwtkMapCalculationsTask['setState'];
}

/**
 * Компонент "Расчеты по карте"
 * @class GwtkMapCalculationsTask
 * @extends Task
 * @description
 */
export default class GwtkMapCalculationsTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * Объект карты для линий
     * @protected
     * @property mapObject { MapObject | undefined }
     */
    private mapObject!: MapObject;

    /**
     * Объект карты для точек
     * @protected
     * @property pointObject { MapObject | undefined }
     */
    private pointObject!: MapObject;

    private pointId: string;

    private readonly pointOne = { objectNumber: 0, contourNumber: 0 };

    private readonly pointOneSubjectOne = { objectNumber: 0, contourNumber: 1 };

    /**
     * Векторный слой отображения объектов построений
     * @private
     * @readonly
     * @property vectorLayer {VectorLayer}
     */
    private readonly vectorLayer: VectorLayer;

    private cursor: CURSOR_TYPE;

    /**
     * @constructor GwtkMapCalculationsTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        this.actionRegistry.push(
            {
                getConstructor() {
                    return MapCalculationsDirectAction;
                },
                id: MAPCALCULATIONS_DIRECT_ACTION,
                active: false,
                enabled: true,
                options: {
                    title: 'phrases.Seek point by point, azimuth, distance',
                    icon: 'mdi-map-marker-distance'
                }
            },
            {
                getConstructor() {
                    return MapCalculationsInverseAction;
                },
                id: MAPCALCULATIONS_INVERSE_ACTION,
                active: false,
                enabled: true,
                options: {
                    title: 'phrases.Seek azimuth by points',
                    icon: 'mdi-android-studio'
                }
            }
        );

        this.widgetProps = {
            taskId: this.id,
            regimes: [
                this.getActionDescription(MAPCALCULATIONS_DIRECT_ACTION),
                this.getActionDescription(MAPCALCULATIONS_INVERSE_ACTION)
            ],
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            azimuth: '0',
            distance: '0',
            first_point: false,
            first_point_latitude: 0,
            first_point_longitude: 0,
            second_point_latitude: 0,
            second_point_longitude: 0,
            angularCoordinateFormat: this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE), //AngleUnit.DegreesMinutesSeconds,
            coordinateDisplayFormat: this.cursorCoordinatesSystem(),
            updateCoordinateFormat: '',
            minValueForX: 0,
            maxValueForX: 0,
            minValueForY: 0,
            maxValueForY: 0,
            actionId: ''
        };

        // слой для построений
        this.vectorLayer = new VectorLayer(this.map, {
            alias: '',
            id: Utils.generateGUID(),
            url: ''
        });

        this.mapObject = new MapObject(this.vectorLayer, MapObjectType.LineString);

        this.pointObject = new MapObject(this.vectorLayer, MapObjectType.MultiPoint);

        this.pointId = this.pointObject.id;

        this.pointObject.addStyle(new Style({
            marker: new MarkerStyle({
                markerId: DEFAULT_SVG_MARKER_ID
            })
        }));

        this.pointObject.isDirty = false;

        this.cursor = CURSOR_TYPE.default;

        this.widgetProps.minValueForX = this.minValueForX;
        this.widgetProps.maxValueForX = this.maxValueForX;
        this.widgetProps.minValueForY = this.minValueForY;
        this.widgetProps.maxValueForY = this.maxValueForY;
    }


    /**
     * Создать панель задачи
     * регистрация Vue компонента
     * @method createTaskPanel
     */
    createTaskPanel() {
        // регистрация компонента
        const name = 'GwtkMapCalculationsWidget';
        const source = GwtkMapCalculationsWidget;
        this.mapWindow.registerComponent(name, source);

        // Создание компонента
        this.mapWindow.createWidget(name, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    /**
     * Деструктор
     * @method destroy
     */
    protected destroy() {
        this.setAction(this.widgetProps.actionId, false);
        this.clearObject();
        this.vectorLayer.destroy();
        super.destroy();
        this.map.requestRender();
    }

    /**
     * Установить текущие параметры
     * @method setState
     */
    setState<K extends keyof GwtkMapCalculationsTaskState>(key: K, value: GwtkMapCalculationsTaskState[K]) {

        switch (key) {
            case MAPCALCULATIONS_ACTION_ID:
                const id = value as string;
                const actionActive = id === '' ? false : !(this._action?.id === id);
                this.setAction(id, actionActive);
                break;

            case MAPCALCULATIONS_FIRST_POINT:
                if (this._action?.id == MAPCALCULATIONS_DIRECT_ACTION) {
                    this.updateWidgetViaDirectAction();
                    if (this.widgetProps.azimuth == '0' || this.widgetProps.distance == '0') {
                        this.mapWindow.addSnackBarMessage(i18n.tc('phrases.' + 'Set distance and azimuth'));
                    }
                } else if (this._action?.id == MAPCALCULATIONS_INVERSE_ACTION) {
                    this.updateWidgetViaInverseAction();
                }
                break;

            case MAPCALCULATIONS_AZIMUTH:
                this.widgetProps.azimuth = (value as string);
                this.calculateDirectGeodetic();
                break;

            case MAPCALCULATIONS_DISTANCE:
                this.widgetProps.distance = (value as string);
                this.calculateDirectGeodetic();
                break;

            case MAPCALCULATIONS_INVERSE_ACTION:
                const secondPoint = value as GeoPoint;
                const firstPoint = this.mapObject.getPoint(this.pointOne);
                if (firstPoint) {
                    this.widgetProps.second_point_latitude = this.isMeter() ? secondPoint.toMapPoint()?.x as number : this.isRadian() ? Trigonometry.toRadians(secondPoint.getLatitude()) : secondPoint.getLatitude();
                    this.widgetProps.second_point_longitude = this.isMeter() ? secondPoint.toMapPoint()?.y as number : this.isRadian() ? Trigonometry.toRadians(secondPoint.getLongitude()) : secondPoint.getLongitude();
                }
                break;
            case MAPCALCULATIONS_SET_POINTS:
                const pointParam = value as PointParam;
                if (pointParam.degreesType === 'latitude') {
                    if (pointParam.pointName == 'first') {
                        this.widgetProps.first_point_latitude = parseFloat(pointParam.value);
                    } else {
                        this.widgetProps.second_point_latitude = parseFloat(pointParam.value);
                    }
                } else {
                    if (pointParam.pointName == 'first') {
                        this.widgetProps.first_point_longitude = parseFloat(pointParam.value);
                    } else {
                        this.widgetProps.second_point_longitude = parseFloat(pointParam.value);
                    }
                }
                if (this._action?.id === MAPCALCULATIONS_DIRECT_ACTION) {
                    if (this.mapObject.getPointList().length >= 1) {
                        this.mapObject.removeAllPoints();
                        this.pointObject.removeAllPoints();
                    }
                    let firstPoint = new GeoPoint(this.widgetProps.first_point_longitude, this.widgetProps.first_point_latitude);
                    if (this.isMeter()) {
                        firstPoint = new MapPoint(this.widgetProps.first_point_latitude, this.widgetProps.first_point_longitude).toGeoPoint() as GeoPoint;
                    } else if (this.isRadian()) {
                        firstPoint = new GeoPoint(Trigonometry.toDegrees(this.widgetProps.first_point_longitude), Trigonometry.toDegrees(this.widgetProps.first_point_latitude));
                    }
                    this.mapObject.addGeoPoint(firstPoint);
                    this.pointObject.addGeoPoint(firstPoint);

                    this.mapObject.addGeoPoint(firstPoint);
                    this.pointObject.addGeoPoint(firstPoint);

                    this.map.setActiveObject(this.mapObject);
                    this.updateWidgetViaDirectAction();

                } else if (this._action?.id === MAPCALCULATIONS_INVERSE_ACTION) {
                    this.pointObject.removeAllPoints();
                    if (this.mapObject.getPointList().length >= 2) {
                        this.mapObject.removeAllPoints();
                    }
                    let firstPoint = new GeoPoint(this.widgetProps.first_point_longitude, this.widgetProps.first_point_latitude);
                    let secondPoint = new GeoPoint(this.widgetProps.second_point_longitude, this.widgetProps.second_point_latitude);
                    if (this.isMeter()) {
                        firstPoint = new MapPoint(this.widgetProps.first_point_latitude, this.widgetProps.first_point_longitude).toGeoPoint() as GeoPoint;
                        secondPoint = new MapPoint(this.widgetProps.second_point_latitude, this.widgetProps.second_point_longitude).toGeoPoint() as GeoPoint;
                    } else if (this.isRadian()) {
                        firstPoint = new GeoPoint(Trigonometry.toDegrees(this.widgetProps.first_point_longitude), Trigonometry.toDegrees(this.widgetProps.first_point_latitude));
                        secondPoint = new GeoPoint(Trigonometry.toDegrees(this.widgetProps.second_point_longitude), Trigonometry.toDegrees(this.widgetProps.second_point_latitude));
                    }

                    this.mapObject.addGeoPoint(firstPoint);
                    this.mapObject.addGeoPoint(secondPoint);

                    this.pointObject.addGeoPoint(firstPoint);
                    this.pointObject.addGeoPoint(secondPoint);

                    this.map.setActiveObject(this.mapObject);
                    this.updateWidgetViaInverseAction();
                }
                break;
            default:
                if (this._action) {
                    this._action.setState(key, value);
                }
        }
    }

    /**
     * Обновить параметры виджета
     * @method updateWidgetProps
     * @param key {string} имя параметра
     * @private
     */
    private updateWidgetProps(key: string) {
        switch (key) {
            case MAPCALCULATIONS_FIRST_POINT:
                const mapPoint = this.mapObject.getPoint(this.pointOne);
                if (mapPoint) {
                    const geo = mapPoint.toGeoPoint();
                    if (geo) {
                        this.widgetProps.first_point_latitude = this.isMeter() ? mapPoint.x : this.isRadian() ? Trigonometry.toRadians(geo.getLatitude()) : geo.getLatitude();
                        this.widgetProps.first_point_longitude = this.isMeter() ? mapPoint.y : this.isRadian() ? Trigonometry.toRadians(geo.getLongitude()) : geo.getLongitude();
                    }
                }
                break;
            case MAPCALCULATIONS_SECOND_POINT:
                const points = this.mapObject.getPointList();
                if (points.length > 1) {
                    const geo = points[1].toGeoPoint();
                    if (geo) {
                        this.widgetProps.second_point_latitude = this.isMeter() ? points[1].x : this.isRadian() ? Trigonometry.toRadians(geo.getLatitude()) : geo.getLatitude();
                        this.widgetProps.second_point_longitude = this.isMeter() ? points[1].y : this.isRadian() ? Trigonometry.toRadians(geo.getLongitude()) : geo.getLongitude();
                    }
                }
                break;
            default:
                break;
        }
    }

    /**
     * Обновить параметр второй точки
     * @method updateWidgetSecondPoint
     * @param geo {GeoPoint} координаты точки
     * @private
     */
    private updateWidgetSecondPoint(geo: GeoPoint) {
        this.widgetProps.second_point_latitude = geo.getLatitude();
        this.widgetProps.second_point_longitude = geo.getLongitude();
    }

    /**
     * Вычислить для прямой геодезической задачи
     * @method calculateDirectGeodetic
     * @private
     */
    private calculateDirectGeodetic() {
        if (this.directGeodeticEnabled) {
            const distance = +this.widgetProps.distance * 1000;
            let azimuth = +this.widgetProps.azimuth;
            if (azimuth < 0) {
                azimuth += 360;
            }
            let latitudeValue = this.widgetProps.first_point_latitude;
            let longitudeValue = this.widgetProps.first_point_longitude;
            if (this.isMeter()) {
                let newMapPoint = new MapPoint(this.widgetProps.first_point_latitude, this.widgetProps.first_point_longitude).toGeoPoint();
                if (newMapPoint) {
                    latitudeValue = newMapPoint.getLatitude();
                    longitudeValue = newMapPoint.getLongitude();
                }
            } else if (this.isRadian()) {
                latitudeValue = Trigonometry.toDegrees(this.widgetProps.first_point_latitude);
                longitudeValue = Trigonometry.toDegrees(this.widgetProps.first_point_longitude);

            }
            const result = this.map.Translate.directGeodetic(
                latitudeValue,
                longitudeValue,
                azimuth,
                distance);

            if (result) {
                const point = new GeoPoint(result.l, result.b);
                this.mapObject.removeLastPoint();
                this.mapObject.addGeoPoint(point);
                const geo = this.pointObject.getPoint(this.pointOne);
                this.pointObject.removeAllPoints();
                this.pointObject.addPoint(geo!);
                this.pointObject.addGeoPoint(point, this.pointOneSubjectOne);
                this.updateWidgetProps(MAPCALCULATIONS_SECOND_POINT);
            }
        }
    }

    /**
     * Вычислить для обратной геодезической задачи
     * @method calculateInverseGeodetic
     * @private
     */
    private calculateInverseGeodetic() {
        const points = this.mapObject.getPointList();
        if (points.length != 2) {
            return;
        }

        const geoPoint1 = points[0].toGeoPoint();
        const geoPoint2 = points[1].toGeoPoint();

        if (geoPoint1 && geoPoint2) {
            const data = this.map.Translate.inverseGeodetic(
                geoPoint1.getLatitude(),
                geoPoint1.getLongitude(),
                geoPoint2.getLatitude(),
                geoPoint2.getLongitude());

            this.widgetProps.azimuth = data.azimuth.toFixed(6);

            this.mapObject.calcLength().then((result?: CalculateLengthResponse) => {
                if (result && result.perimeter > 0) {
                    let dist = result.perimeter / 1000;
                    //this.map.linearMetersToUnits( result ).text;    !TODO
                    this.widgetProps.distance = dist.toFixed(6);

                } else {
                    this.widgetProps.distance = '-1';
                }
            }).catch(error => {
                this.map.writeProtocolMessage({
                    text: i18n.tc('phrases.Map calculation') + '. ' + i18n.tc('phrases.Failed to get data') + '!',
                    description: error,
                    type: LogEventType.Error,
                    display: true
                });
            });
        }
    }

    /**
     * Обновить виджет для режима обратной геодезической задачи
     * @method updateWidgetViaInverseAction
     * @private
     */
    private updateWidgetViaInverseAction() {
        if (this.mapObject.getPointList().length < 2) {
            this.clearWidgetProps();
        }
        this.updateWidgetProps(MAPCALCULATIONS_FIRST_POINT);
        if (this.mapObject.getPointList().length == 2) {
            this.calculateInverseGeodetic();
            this.updateWidgetProps(MAPCALCULATIONS_SECOND_POINT);
        }
    }

    /**
     * Обновить виджет для режима прямой геодезической задачи
     * @method updateWidgetViaDirectAction
     * @private
     */
    private updateWidgetViaDirectAction() {
        this.updateWidgetProps(MAPCALCULATIONS_FIRST_POINT);
        if (!this.directGeodeticEnabled) {
            const mapPoint = this.mapObject.getPoint(this.pointOne);
            if (mapPoint) {
                const geo = mapPoint.toGeoPoint();
                if (geo) {
                    this.updateWidgetSecondPoint(geo);
                }
            }
        } else {
            this.calculateDirectGeodetic();
        }
    }

    /**
     * Доступность режима прямой геодезической задачи
     * @method directGeodeticEnabled
     * @returns {boolean} признак готовности
     */
    get directGeodeticEnabled() {
        if (this._action?.id == MAPCALCULATIONS_DIRECT_ACTION) {
            if (this.widgetProps.first_point_latitude &&
                this.widgetProps.first_point_longitude &&
                +this.widgetProps.distance >= 0 &&
                !isNaN(+this.widgetProps.azimuth)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Установить обработчик
     * @method setAction
     * @param id {string} идентификатор обработчика
     * @param active {boolean} признак активности
     */
    private setAction(id: string, active: boolean) {
        if (active) {
            if (id == MAPCALCULATIONS_DIRECT_ACTION ||
                id == MAPCALCULATIONS_INVERSE_ACTION) {
                this.clearWidgetProps();
                this.createObject();
                this.map.setActiveObject(this.mapObject);
                this.mapWindow.addSnackBarMessage(i18n.tc('phrases.' + 'Pick a point on the map'));
            }
            this.widgetProps.actionId = id;
            this.doAction(id);
        } else {
            this.quitAction(id);
            this.clearObject();
        }
    }

    /**
     * Очистить параметры виджета
     * @method clearWidgetProps
     */
    clearWidgetProps() {
        this.widgetProps.azimuth = '0';
        this.widgetProps.distance = '0';
        this.widgetProps.first_point_latitude = 0;
        this.widgetProps.first_point_longitude = 0;
        this.widgetProps.second_point_latitude = 0;
        this.widgetProps.second_point_longitude = 0;
    }

    /**
     * Очистить параметр обработчика в виджете
     * @method cancelWidgetAction
     * @param id {string} идентификатор обработчика задачи
     */
    cancelWidgetAction(id: string) {
        if (this.widgetProps.actionId === id) {
            this.widgetProps.actionId = '';
            this.clearObject();
        }
    }

    onPreRender() {
        if (this.pointObject.isDirty) {
            this.pointObject.isDirty = false;
            this.map.requestRender();
        }
    }

    onPostRender(renderer: SVGrenderer) {
        if (this.pointObject.getPointList().length > 0) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.pointObject);
        }
    }

    onWorkspaceChanged(type: keyof WorkspaceValues) {
        if (type === PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE) {
            this.widgetProps.angularCoordinateFormat = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE);
        }
        if (type === PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM) {
            this.widgetProps.coordinateDisplayFormat = this.map.workspaceManager.getValue(PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM);
            this.updatePointsValues();
        }
    }

    onWorkspaceReset() {
        this.widgetProps.angularCoordinateFormat = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE);
        this.widgetProps.coordinateDisplayFormat = this.map.workspaceManager.getValue(PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM);

        this.updatePointsValues();
    }

    /**
     * Создать линейный объект построений
     * @method createObject
     */
    createObject() {
        this.clearObject();
        this.mapObject = this.vectorLayer.createMapObject(MapObjectType.LineString);
        return this.mapObject;
    }

    /**
     * Создать точечный объект построений
     * @method createPointObject
     */
    createPointObject() {
        this.pointObject.removeAllPoints();
        this.pointObject = this.vectorLayer.createMapObject(MapObjectType.MultiPoint);
        this.pointId = this.pointObject.id;
        return this.pointObject;
    }

    /**
     * Получить объект построений
     * @method getObject
     */
    getObject() {
        return this.mapObject;
    }

    /**
     * Получить точечный объект построений
     * @method getPointObject
     */
    getPointObject() {
        return this.pointObject;
    }

    /**
     * Очистить объекты
     * @private
     * @method clearObject
     */
    private clearObject() {
        if (this.mapObject) {
            this.mapObject.removeAllPoints();
        }
        if (this.pointObject) {
            this.pointObject.removeAllPoints();
        }
    }

    /**
     * Проверить систему координат
     * @private
     * @method isMeter
     */
    private isMeter() {
        return this.widgetProps.coordinateDisplayFormat === CursorCoordinateUnit.Meter;
    }

    /**
     * Проверить систему координат
     * @private
     * @method isRadian
     */
    private isRadian() {
        return this.widgetProps.coordinateDisplayFormat === CursorCoordinateUnit.Radians;
    }

    /**
     * Получить минимальное значение по оси X
     * @private
     * @method minValueForX
     */
    private get minValueForX() {
        return this.isMeter() ? this.map.Translate.getTileMatix().Ogc.NormalFrame.min.x : this.isRadian() ? -Trigonometry.PiOverTwo : -90;
    }

    /**
     * Получить максимальное значение по оси X
     * @private
     * @method maxValueForX
     */
    private get maxValueForX() {
        return this.isMeter() ? this.map.Translate.getTileMatix().Ogc.NormalFrame.max.x : this.isRadian() ? Trigonometry.PiOverTwo : 90;
    }

    /**
     * Получить минимальное значение по оси Y
     * @private
     * @method maxValueForX
     */
    private get minValueForY() {
        return this.isMeter() ? this.map.Translate.getTileMatix().Ogc.NormalFrame.min.y : this.isRadian() ? -Trigonometry.TwoPi : -180;
    }

    /**
     * Получить максимальное значение по оси Y
     * @private
     * @method maxValueForX
     */
    private get maxValueForY() {
        return this.isMeter() ? this.map.Translate.getTileMatix().Ogc.NormalFrame.max.y : this.isRadian() ? Trigonometry.TwoPi : 180;
    }

    /**
     * Система координат курсора
     * @method cursorCoordinatesSystem
     * @returns {CursorCoordinateUnit} метры / градусы /...
     */
    cursorCoordinatesSystem() {
        let coordinatesUnit = this.map.Translate.IsGeoSupported > 0 ?
            CursorCoordinateUnit.Degrees :
            CursorCoordinateUnit.Meter;
        const restored = this.map.workspaceManager.getValue(PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM);
        if (restored) {
            coordinatesUnit = restored;
        } else {
            this.map.workspaceManager.setValue(PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM, coordinatesUnit);
        }
        return coordinatesUnit;
    }

    /**
     * Обновить значение полей широты и долготы точек
     * при смене системы кординат
     * @private
     * @method updatePointsValues
     */
    private updatePointsValues() {
        const lastCoordinateFormat = this.widgetProps.updateCoordinateFormat;
        if (this.isMeter()) {
            if (this.widgetProps.updateCoordinateFormat === 'meter') {
                return;
            }
            this.widgetProps.updateCoordinateFormat = 'meter';
            let firstPointLongitude = (lastCoordinateFormat == 'radian') ? Trigonometry.toDegrees(this.widgetProps.first_point_longitude) : this.widgetProps.first_point_longitude;
            let firstPointLatitude = (lastCoordinateFormat == 'radian') ? Trigonometry.toDegrees(this.widgetProps.first_point_latitude) : this.widgetProps.first_point_latitude;
            let secondPointLongitude = (lastCoordinateFormat == 'radian') ? Trigonometry.toDegrees(this.widgetProps.second_point_longitude) : this.widgetProps.second_point_longitude;
            let secondPointLatitude = (lastCoordinateFormat == 'radian') ? Trigonometry.toDegrees(this.widgetProps.second_point_latitude) : this.widgetProps.second_point_latitude;
            let firstMapPoint = new GeoPoint(firstPointLongitude, firstPointLatitude).toMapPoint() as MapPoint;
            let secondMapPoint = new GeoPoint(secondPointLongitude, secondPointLatitude).toMapPoint() as MapPoint;
            this.widgetProps.first_point_longitude = Number(firstMapPoint.y.toFixed(2));
            this.widgetProps.first_point_latitude = Number(firstMapPoint.x.toFixed(2));
            this.widgetProps.second_point_longitude = Number(secondMapPoint.y.toFixed(2));
            this.widgetProps.second_point_latitude = Number(secondMapPoint.x.toFixed(2));
        } else if (this.isRadian()) {
            if (this.widgetProps.updateCoordinateFormat === 'radian') {
                return;
            }
            this.widgetProps.updateCoordinateFormat = 'radian';
            let firstGeoPoint = new MapPoint(this.widgetProps.first_point_latitude, this.widgetProps.first_point_longitude).toGeoPointRad() as GeoPointRad;
            let secondGeoPoint = new MapPoint(this.widgetProps.second_point_latitude, this.widgetProps.second_point_longitude).toGeoPointRad() as GeoPointRad;
            if (lastCoordinateFormat == 'degree') {
                firstGeoPoint = new GeoPointRad(Trigonometry.toRadians(this.widgetProps.first_point_longitude), Trigonometry.toRadians(this.widgetProps.first_point_latitude));
                secondGeoPoint = new GeoPointRad(Trigonometry.toRadians(this.widgetProps.second_point_longitude), Trigonometry.toRadians(this.widgetProps.second_point_latitude));
            }
            this.widgetProps.first_point_longitude = Number(firstGeoPoint.getLongitude().toFixed(6));
            this.widgetProps.first_point_latitude = Number(firstGeoPoint.getLatitude().toFixed(6));
            this.widgetProps.second_point_longitude = Number(secondGeoPoint.getLongitude().toFixed(6));
            this.widgetProps.second_point_latitude = Number(secondGeoPoint.getLatitude().toFixed(6));
        } else {
            if (this.widgetProps.updateCoordinateFormat === 'degree') {
                return;
            }
            this.widgetProps.updateCoordinateFormat = 'degree';
            let firstGeoPoint = new MapPoint(this.widgetProps.first_point_latitude, this.widgetProps.first_point_longitude).toGeoPoint() as GeoPoint;
            let secondGeoPoint = new MapPoint(this.widgetProps.second_point_latitude, this.widgetProps.second_point_longitude).toGeoPoint() as GeoPoint;
            if (lastCoordinateFormat == 'radian') {
                firstGeoPoint = new GeoPoint(Trigonometry.toDegrees(this.widgetProps.first_point_longitude), Trigonometry.toDegrees(this.widgetProps.first_point_latitude));
                secondGeoPoint = new GeoPoint(Trigonometry.toDegrees(this.widgetProps.second_point_longitude), Trigonometry.toDegrees(this.widgetProps.second_point_latitude));
            }
            this.widgetProps.first_point_longitude = Number(firstGeoPoint.getLongitude().toFixed(6));
            this.widgetProps.first_point_latitude = Number(firstGeoPoint.getLatitude().toFixed(6));
            this.widgetProps.second_point_longitude = Number(secondGeoPoint.getLongitude().toFixed(6));
            this.widgetProps.second_point_latitude = Number(secondGeoPoint.getLatitude().toFixed(6));
        }

        this.widgetProps.minValueForX = this.minValueForX;
        this.widgetProps.maxValueForX = this.maxValueForX;
        this.widgetProps.minValueForY = this.minValueForY;
        this.widgetProps.maxValueForY = this.maxValueForY;
    }
}
