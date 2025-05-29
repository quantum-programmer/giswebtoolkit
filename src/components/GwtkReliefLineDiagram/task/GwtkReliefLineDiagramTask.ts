/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Компонент Построение профиля рельефа               *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import {CURSOR_TYPE, GwtkComponentDescriptionPropsData} from '~/types/Types';
import MapWindow, {SaveObjectPanelProps} from '~/MapWindow';
import GwtkReliefLineDiagramWidget from './GwtkReliefLineDiagramWidget.vue';
import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import GeoPoint from '~/geo/GeoPoint';
import {LOCALE, LogEventType, SimpleJson} from '~/types/CommonTypes';
import {ReliefProfileResponse} from '~/services/RequestServices/RestService/Types';
import {Vector3D} from '~/3d/engine/core/Types';
import AppendPointReliefLine from '../action/AppendPointReliefLine';
import i18n from '@/plugins/i18n';
import {
    ACTION_CANCEL,
    ACTION_COMMIT,
    ActionMode,
    ActionModePanel,
    MODE_PANEL_KEYS,
    SAVE_PANEL_ID
} from '~/taskmanager/Action';
import {Chart, ChartEvent, PointElement} from 'chart.js';
import SVGrenderer, {BLUE_WHITE_CIRCLE_SVG_MARKER_ID, DEFAULT_SVG_MARKER_ID,} from '~/renderer/SVGrenderer';
import Style from '~/style/Style';
import MarkerStyle from '~/style/MarkerStyle';
import {PointInfo} from '~/mapobject/geometry/BaseMapObjectGeometry';
import EditPointReliefLine from '../action/EditPointReliefLine';
import {MapPoint} from '~/geometry/MapPoint';
import annotationPlugin from 'chartjs-plugin-annotation';
import {
    PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER,
    PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG,
    Unit,
    WorkspaceValues
} from '~/utils/WorkspaceManager';
import Utils from '~/services/Utils';
import {MouseDeviceEvent} from '~/input/MouseDevice';
import SelectObjectForReliefLine from '../action/SelectObjectForReliefLine';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';


Chart.register(annotationPlugin);

export const SELECT_OBJECT_FOR_RELIEF_LINE_ACTION = 'gwtkreliefprofile.selectobjectforreliefline';
export const APPEND_POINT_RELIEF_LINE_ACTION = 'gwtkreliefprofile.reliefactive';
export const CHART_IS_READY = 'gwtkreliefprofile.chartisready';
export const EDIT_POINT_RELIEF_LINE_ACTION = 'gwtkreliefprofile.appendselectedpointaction';
export const CLEAR_SELECTED_POINTS = 'gwtkreliefprofile.clearselectedpoints';
export const CREATE_PANEL_RELIEF_CHART = 'gwtkreliefprofile.createpenelreliefchart';
export const SET_POINT_NUMBER = 'gwtkreliefprofile.setpointnumber';
export const SET_SELECTED_POINT = 'gwtkreliefprofile.setselectedpoint';
export const INIT_CANVAS = 'gwtkreliefprofile.initcanvas';
export const SET_CURRENT_HOVER_POINT = 'gwtkreliefprofile.setcurrenthoverpoint';
export const UPDATE_CHART_PARAMS = 'gwtkreliefprofile.updatechartparams';
export const CHANGE_CONTOUR_SELECTED = 'gwtkreliefprofile.changeselectedcontour';

export type DataProfileRelief = {
    value: Vector3D[];
    precisionArray: number[];
};

type WorkspaceData = {
    chartParams: {
        lineColor: string;
        fillColor: string;
        showHeightIncrement: boolean;
        showStatistics: {
            distance: boolean;
            realDistance: boolean;
            minHeight: boolean;
            maxHeight: boolean;
            averageHeight: boolean;
            heightDifference: boolean;
        }
    }
}

export type ChartStatistics = {
    distance: { value: number, show: boolean, text: string, unitText: string };
    realDistance: { value: number, show: boolean, text: string, unitText: string };
    minHeight: { value: number | undefined, show: boolean, text: string, unitText: string };
    maxHeight: { value: number | undefined, show: boolean, text: string, unitText: string };
    averageHeight: { value: number | undefined, show: boolean, text: string, unitText: string };
    heightDifference: { value: number | undefined, show: boolean, text: string, unitText: string };
}

export type ChartParams = {
    lineColor: string;
    fillColor: string;
    showHeightIncrement: boolean;
    statistics: ChartStatistics
}

type ChartPoint = {
    x: number
    h: number;
}

type Annotations = SimpleJson<{
    type: string;
    xValue: number;
    yValue: number;
    xMin: number;
    xMax: number;
    xAdjust: number,
    yAdjust: number,
    radius: number;
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    content: string[];
    font: {
        size: number;
    },
    z: number;
} | {}>

type ChartPlugins = {
    options: {
        plugins: {
            annotation: {
                annotations: Annotations
            }
        }
    }
}

export type GwtkReliefLineDiagramTaskState = {
    [SELECT_OBJECT_FOR_RELIEF_LINE_ACTION]: boolean;
    [APPEND_POINT_RELIEF_LINE_ACTION]: boolean;
    [CHART_IS_READY]: undefined;
    [EDIT_POINT_RELIEF_LINE_ACTION]: boolean;
    [CLEAR_SELECTED_POINTS]: undefined;
    [CREATE_PANEL_RELIEF_CHART]: MapObject;
    [SET_POINT_NUMBER]: number;
    [SET_SELECTED_POINT]: MapPoint;
    [ACTION_CANCEL]: undefined;
    [ACTION_COMMIT]: undefined;
    [INIT_CANVAS]: HTMLCanvasElement;
    [SET_CURRENT_HOVER_POINT]: MapPoint;
    [UPDATE_CHART_PARAMS]: ChartParams;
    [CHANGE_CONTOUR_SELECTED]: number;
}

type WidgetParams = {
    setState: GwtkReliefLineDiagramTask['setState'];
    modePanel: {
        [SAVE_PANEL_ID]: ActionMode | undefined;
    };
    readyFlag: boolean;
    hasSelectedPoints: boolean;
    chartParams: ChartParams,
    isWaitingForChart: boolean,
    currentMessage: string,
    showMessage: boolean,
    isActivePartSelectionMode: boolean,
    objectContourCount: number,
    objectContourSelected: number,
    isBuildEnabled: boolean
}

export enum ReliefProfileMessages {
    pickPoints,
    selectObject,
    objectPerimeter,
    selectPartOfObject,
    selectNotPointObject,
    notLineObject
}

/**
 * Компонент "Построение профиля рельефа"
 * @class GwtkReliefLineDiagramTask
 * @extends Task
 * @description
 */
export default class GwtkReliefLineDiagramTask extends Task {

    private realDistance = 0;

    private readonly countPoint = 100;
    private readonly precisionMin = 80;

    private isEditPoint = false;

    selectedObjectInit?: MapObject;

    private currentObject?: MapObject;//редактируемая точка

    private readonly reliefLineObject: MapObject;
    private readonly currentPointObject: MapObject;//бегущая по объекту точка

    private readonly selectedPointsObject: MapObject;
    private readonly selectedPointsObjectStyle = new Style({
        marker: new MarkerStyle({
            markerId: BLUE_WHITE_CIRCLE_SVG_MARKER_ID
        })
    });

    private readonly currentPointObjectStyle = new Style({
        marker: new MarkerStyle({
            markerId: DEFAULT_SVG_MARKER_ID
        })
    });

    private mapObject?: MapObject;

    /**
     * Текущее значение области захвата точек привязки
     * @private
     * @readonly
     * @property deltaPix {number}
     */
    private readonly deltaPix = 100;

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

    private readonly options: {
        alias: string;
        authtype: string;
        id: string;
        layerid: string;
        url: string;
    };

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * Минимальный размер экрана для отображения компонента в окне
     * @private
     * @readonly
     * @property displayLG {Number}
     */
    private readonly displayLG: number = 1280;

    private selectedChartElements: ChartPoint[] = [];

    private canvas: HTMLCanvasElement | undefined;

    private chart: Chart | undefined;
    private dataProfileRelief: DataProfileRelief = {
        precisionArray: [],
        value: []
    };

    private xAxisUnitText = i18n.tc('relieflinediagram.m');
    private readonly yAxisUnitText = i18n.tc('relieflinediagram.m');
    private xAxisUnit: Unit = Unit.Meters;

    private readonly chartBackgroundColor = '#0ED96638';
    private readonly chartBorderColor = '#970F12FF';
    private readonly chartBorderWidth = 1;
    // private readonly chartTension = 0.1;
    private readonly chartPointStyle = 'circle';
    private readonly chartPointRadius = 0;
    private readonly chartPointHoverRadius = 0;
    private readonly chartCornerPointRadius = 2;

    private readonly gridColorForDarkTheme = 'rgb(240,240,240,0.22)';
    private readonly gridColorForLightTheme = 'rgb(0, 0, 0, 0.1)';
    private gridColor = this.gridColorForLightTheme;

    private readonly tooltipLineWidth = 1;
    private readonly tooltipLineSelectedColor = 'rgb(14,217,102)';
    private readonly tooltipLineCurrentColor = 'rgb(255,15,18)';
    private readonly annotationBackgroundColor = 'rgb(240,240,240)';
    private readonly annotationPointBackgroundColor = 'rgb(151,15,18, 0.42)';

    private readonly annotationSelectedAdjustX = 28;
    private readonly annotationSelectedAdjustY = 14;
    private readonly annotationCurrentAdjustLeftX = 60;
    private readonly annotationCurrentAdjustRightX = 63;
    private readonly annotationCurrentAdjustY = 28;
    private readonly annotationBorderRadius = 3;
    private readonly annotationBorderWidth = 1;
    private readonly annotationFontSize = 12;

    protected workspaceData?: WorkspaceData;

    /**
     * @constructor GwtkReliefLineDiagramTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        if (!this.map.options.reliefprofiles || this.map.options.reliefprofiles.length === 0) {
            throw Error('Invalid ReliefLineDiagram parameters');
        }

        this.options = this.map.options.reliefprofiles[0];

        //создание и регистрация обработчиков и описаний
        this.actionRegistry.push({
            getConstructor() {
                return SelectObjectForReliefLine;
            },
            id: SELECT_OBJECT_FOR_RELIEF_LINE_ACTION,
            active: false,
            enabled: true,
            options: {
                title: 'relieflinediagram.Relief profile'
            }
        }, {
            getConstructor() {
                return AppendPointReliefLine;
            },
            id: APPEND_POINT_RELIEF_LINE_ACTION,
            active: false,
            enabled: true,
            options: {
                title: 'relieflinediagram.Relief profile'
            }
        }, {
            getConstructor() {
                return EditPointReliefLine;
            },
            id: EDIT_POINT_RELIEF_LINE_ACTION,
            active: false,
            enabled: true,
            options: {
                title: 'relieflinediagram.Relief profile'
            }
        });

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            readyFlag: this.options !== undefined,
            modePanel: {
                [SAVE_PANEL_ID]: undefined
            },
            hasSelectedPoints: false,
            chartParams: {
                lineColor: this.chartBorderColor,
                fillColor: this.chartBackgroundColor,
                showHeightIncrement: true,
                statistics: {
                    distance: {
                        value: 0,
                        show: false,
                        text: i18n.tc('relieflinediagram.Distance'),
                        unitText: this.xAxisUnitText
                    },
                    realDistance: {
                        value: 0,
                        show: false,
                        text: i18n.tc('relieflinediagram.Terrain distance'),
                        unitText: this.xAxisUnitText
                    },
                    minHeight: {
                        value: 0,
                        show: false,
                        text: i18n.tc('relieflinediagram.Minimum height'),
                        unitText: this.yAxisUnitText
                    },
                    maxHeight: {
                        value: 0,
                        show: false,
                        text: i18n.tc('relieflinediagram.Maximum height'),
                        unitText: this.yAxisUnitText
                    },
                    averageHeight: {
                        value: 0,
                        show: false,
                        text: i18n.tc('relieflinediagram.Average height'),
                        unitText: this.yAxisUnitText
                    },
                    heightDifference: {
                        value: 0,
                        show: false,
                        text: i18n.tc('relieflinediagram.Height difference'),
                        unitText: this.yAxisUnitText
                    },
                }
            },
            isWaitingForChart: false,
            currentMessage: i18n.tc('relieflinediagram.Pick points on the map'),
            showMessage: true,
            isActivePartSelectionMode: false,
            objectContourCount: 1,
            objectContourSelected: 0,
            isBuildEnabled: true
        };

        const tempVectorLayer = GeoJsonLayer.getEmptyInstance(this.map);
        this.reliefLineObject = new MapObject(tempVectorLayer, MapObjectType.LineString, {local: LOCALE.Line});
        this.currentPointObject = new MapObject(tempVectorLayer, MapObjectType.Point, {local: LOCALE.Point});

        this.selectedPointsObject = new MapObject(tempVectorLayer, MapObjectType.MultiPoint, {local: LOCALE.Point});
        this.selectedPointsObject.addStyle(this.selectedPointsObjectStyle);

    }

    /**
     * Добавить панель сохранения для планшета
     * @param modePanelDescription
     */
    createModePanel(modePanelDescription: ActionModePanel) {
        MODE_PANEL_KEYS.forEach((key) => {
            const modePanel = modePanelDescription[key];
            if (modePanel !== undefined && key === SAVE_PANEL_ID) {
                this.widgetProps.modePanel[key] = modePanel;
            }
        });
        const saveObjectPanelProps: SaveObjectPanelProps = {
            saveActive: false,
            visiblePanel: true,
            modePanel: modePanelDescription
        };
        this.mapWindow.showSaveObjectPanel(saveObjectPanelProps);
    }

    /**
     * Удалить панели
     * @param modePanelId
     */
    removeModePanel(modePanelId?: typeof SAVE_PANEL_ID) {
        if (modePanelId !== undefined) {
            this.widgetProps.modePanel[modePanelId] = undefined;
        } else {
            MODE_PANEL_KEYS.forEach((key) => {
                if (key === SAVE_PANEL_ID) {
                    this.widgetProps.modePanel[key] = undefined;
                }
            });
            const saveObjectPanelProps: SaveObjectPanelProps = {
                saveActive: false,
                visiblePanel: false,
                modePanel: {}
            };
            this.mapWindow.showSaveObjectPanel(saveObjectPanelProps);
        }
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkReliefLineDiagramWidget';
        const sourceWidget = GwtkReliefLineDiagramWidget;
        this.mapWindow.registerComponent(nameWidget, sourceWidget);

        // Создание Vue компонента
        this.mapWindow.createBottomWidget(nameWidget, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    setup() {
        super.setup();
        this.currentPointObject.addStyle(this.currentPointObjectStyle);

        if (!this.workspaceData) {
            this.workspaceData = {
                chartParams: {
                    lineColor: this.chartBorderColor,
                    fillColor: this.chartBackgroundColor,
                    showHeightIncrement: true,
                    showStatistics: {
                        averageHeight: true,
                        distance: true,
                        heightDifference: true,
                        maxHeight: true,
                        minHeight: true,
                        realDistance: true
                    }
                }
            };
            this.writeWorkspaceData(true);
        }

        this.widgetProps.chartParams.lineColor = this.workspaceData.chartParams.lineColor;
        this.widgetProps.chartParams.fillColor = this.workspaceData.chartParams.fillColor;
        this.widgetProps.chartParams.showHeightIncrement = this.workspaceData.chartParams.showHeightIncrement;
        this.widgetProps.chartParams.statistics.distance.show = this.workspaceData.chartParams.showStatistics.distance;
        this.widgetProps.chartParams.statistics.realDistance.show = this.workspaceData.chartParams.showStatistics.realDistance;
        this.widgetProps.chartParams.statistics.maxHeight.show = this.workspaceData.chartParams.showStatistics.maxHeight;
        this.widgetProps.chartParams.statistics.minHeight.show = this.workspaceData.chartParams.showStatistics.minHeight;
        this.widgetProps.chartParams.statistics.averageHeight.show = this.workspaceData.chartParams.showStatistics.averageHeight;
        this.widgetProps.chartParams.statistics.heightDifference.show = this.workspaceData.chartParams.showStatistics.heightDifference;

    }

    private applyCurrentUnits(data: DataProfileRelief) {
        const units = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER);
        switch (units) {
            case Unit.Kilometers:
                this.xAxisUnit = Unit.Kilometers;
                this.xAxisUnitText = i18n.tc('relieflinediagram.km');
                break;
            case Unit.NauticalMiles:
                this.xAxisUnit = Unit.NauticalMiles;
                this.xAxisUnitText = i18n.tc('relieflinediagram.Nm');
                break;
            case Unit.Foots:
                this.xAxisUnit = Unit.Foots;
                this.xAxisUnitText = i18n.tc('relieflinediagram.ft');
                break;
            case Unit.Meters:
            default:
                this.xAxisUnit = Unit.Meters;
                this.xAxisUnitText = i18n.tc('relieflinediagram.m');
                break;
        }

        this.widgetProps.chartParams.statistics.distance.unitText = this.xAxisUnitText;
        this.widgetProps.chartParams.statistics.realDistance.unitText = this.xAxisUnitText;

        for (let i = 0; i < data.precisionArray.length; i++) {
            const x = data.precisionArray[i];
            data.precisionArray[i] = GwtkReliefLineDiagramTask.getDistanceValueFromMetersToUnits(x, this.xAxisUnit);
        }
    }

    applyCurrentTheme() {
        const isDarkThemeFlag = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG);
        if (isDarkThemeFlag) {
            this.gridColor = this.gridColorForDarkTheme;
        } else {
            this.gridColor = this.gridColorForLightTheme;
        }
    }

    static getDistanceValueFromMetersToUnits(value: number, unit: Unit): number {
        let result: { value: number, unit: Unit } = {value, unit};

        switch (unit) {
            case Unit.Foots:
                result = Utils.linearMetersToUnits(value, unit);
                break;
            case Unit.Meters:
                result = Utils.linearMetersToUnits(value, unit);
                break;
            case Unit.Kilometers:
                result = Utils.linearMetersToUnits(value, unit);
                break;
            case Unit.NauticalMiles:
                result = Utils.linearMetersToUnits(value, unit);
                break;

        }

        return result.value;
    }

    destroy() {
        this.clearObjects();
        super.destroy();
    }

    private clearObjects() {
        this.mapWindow.setCursor(CURSOR_TYPE.default);
        this.currentPointObject.removeAllPoints();

        this.selectedPointsObject.removeAllPoints();
        this.widgetProps.hasSelectedPoints = false;

        this.currentObject?.removeAllPoints();

        this.reliefLineObject.removeAllPoints();

        this.selectedObjectInit?.removeAllPoints();

        this.mapObject?.removeAllPoints();

        this.map.requestRender();
    }

    showMessage(type: ReliefProfileMessages, text?: string) {
        this.widgetProps.isActivePartSelectionMode = false;
        switch (type) {
            case ReliefProfileMessages.pickPoints:
                this.widgetProps.currentMessage = i18n.tc('relieflinediagram.Pick points on the map');
                this.mapWindow.addSnackBarMessage(this.widgetProps.currentMessage);
                break;

            case ReliefProfileMessages.selectObject:
                this.widgetProps.currentMessage = i18n.tc('relieflinediagram.Select object on the map');
                this.mapWindow.addSnackBarMessage(this.widgetProps.currentMessage);
                break;

            case ReliefProfileMessages.objectPerimeter:
                this.widgetProps.currentMessage = i18n.tc('relieflinediagram.Object length') + ': ' + text + 'м';
                this.widgetProps.isActivePartSelectionMode = true;
                break;

            case ReliefProfileMessages.selectPartOfObject:
                this.mapWindow.addSnackBarMessage(i18n.tc('relieflinediagram.Segment length must be greater than zero'));
                this.widgetProps.isActivePartSelectionMode = true;
                break;

            case ReliefProfileMessages.selectNotPointObject:
                this.widgetProps.currentMessage = i18n.tc('relieflinediagram.Object type') + ' ' + text + '. ' + i18n.tc('relieflinediagram.Select a linear or area object to build a profile');
                this.mapWindow.addSnackBarMessage(this.widgetProps.currentMessage);
                break;

            case ReliefProfileMessages.notLineObject:
                this.mapWindow.addSnackBarMessage(i18n.tc('relieflinediagram.Relief profile will be built along the main part of the object'));
                break;
        }

    }

    private resetStatisticValues() {
        this.widgetProps.chartParams.statistics.realDistance.value = 0;
        this.widgetProps.chartParams.statistics.distance.value = 0;
        this.widgetProps.chartParams.statistics.maxHeight.value = 0;
        this.widgetProps.chartParams.statistics.minHeight.value = 0;
        this.widgetProps.chartParams.statistics.averageHeight.value = 0;
        this.widgetProps.chartParams.statistics.heightDifference.value = 0;
    }

    hasSelectedMultiLineObject() {
        this.setAction(SELECT_OBJECT_FOR_RELIEF_LINE_ACTION, true);
    }

    set isBuildEnabled(value: boolean) {
        this.widgetProps.isBuildEnabled = value;
    }

    get isBuildEnabled() {
        return this.widgetProps.isBuildEnabled;
    }

    setState<K extends keyof GwtkReliefLineDiagramTaskState>(key: K, value: GwtkReliefLineDiagramTaskState[ K ]) {

        switch (key) {
            case INIT_CANVAS:
                this.canvas = value as HTMLCanvasElement;
                break;

            case SELECT_OBJECT_FOR_RELIEF_LINE_ACTION:
                this.setAction(APPEND_POINT_RELIEF_LINE_ACTION, false);
                this.setAction(EDIT_POINT_RELIEF_LINE_ACTION, false);

                this.clearObjects();
                this.map.clearActiveObject();
                this.resetStatisticValues();

                this.selectedChartElements.splice(0);

                this.dataProfileRelief = {
                    value: [],
                    precisionArray: []
                };

                if (this.chart) {
                    this.chart.destroy();

                }

                if (value as boolean) {
                    this.map.clearSelectedObjects();
                    this.showMessage(ReliefProfileMessages.selectObject);

                    if (this.selectedObjectInit) {
                        this.selectedObjectInit.removeAllPoints();
                        this.selectedObjectInit = undefined;
                    }

                    this.widgetProps.objectContourSelected = 0;
                    this.widgetProps.objectContourCount = 1;

                    this.widgetProps.showMessage = true;
                }

                this.setAction(SELECT_OBJECT_FOR_RELIEF_LINE_ACTION, value as boolean);
                break;


            case CHART_IS_READY:
                if (!this.currentObject?.hasPoints()) {
                    this.setState(APPEND_POINT_RELIEF_LINE_ACTION, true);
                } else {
                    window.setTimeout(() => {
                        this.setDataProfileRelief(this.dataProfileRelief);
                        this.updateSelectedTooltips();
                    }, 100);
                }
                break;

            case APPEND_POINT_RELIEF_LINE_ACTION:
                this.setAction(SELECT_OBJECT_FOR_RELIEF_LINE_ACTION, false);
                this.setAction(EDIT_POINT_RELIEF_LINE_ACTION, false);

                this.selectedChartElements.splice(0);

                this.clearObjects();
                this.resetStatisticValues();

                if (value as boolean) {
                    this.dataProfileRelief = {
                        value: [],
                        precisionArray: []
                    };

                    if (this.chart) {
                        this.chart.destroy();
                    }

                    this.widgetProps.showMessage = true;

                }

                this.setAction(APPEND_POINT_RELIEF_LINE_ACTION, value as boolean);
                break;

            case CREATE_PANEL_RELIEF_CHART:

                this.widgetProps.isWaitingForChart = true;

                this.resetStatisticValues();

                this.dataProfileRelief = {
                    value: [],
                    precisionArray: []
                };

                if (this.chart) {
                    this.chart.destroy();
                }

                this.currentObject = value as MapObject;

                this.currentObject.isDirty = false;

                this.map.setActiveObject(this.currentObject);

                this.startRequestGetReliefProfile(value as MapObject);
                break;

            case SET_SELECTED_POINT:
                const chartPoint = this.mapPointToChartPoint(value as MapPoint);

                if (chartPoint && !isNaN(chartPoint.h)) {
                    this.selectedChartElements.push(chartPoint);
                    this.updateSelectedTooltips();

                    this.updateSelectedPointsObject(value as MapPoint);
                }
                break;

            case ACTION_COMMIT://по кнопке Завершить
                if (this._action) {
                    this._action.commit();
                }
                break;

            case ACTION_CANCEL:
                if (this._action) {
                    this._action.revert();
                }
                break;

            case EDIT_POINT_RELIEF_LINE_ACTION:
                this.setAction(EDIT_POINT_RELIEF_LINE_ACTION, value as boolean);
                this.widgetProps.isActivePartSelectionMode = false;
                this.widgetProps.showMessage = false;
                break;

            case CLEAR_SELECTED_POINTS:
                this.selectedPointsObject.removeAllPoints();
                this.widgetProps.hasSelectedPoints = false;

                this.currentPointObject.removeAllPoints();

                this.selectedChartElements.splice(0);

                if (this.chart && this.chart.options.plugins && this.chart.options.plugins.annotation) {
                    this.chart.options.plugins.annotation.annotations = {};//так угловые точки тоже удаляются!

                    // вернуть угловые точки
                    if (this.currentObject) {
                        const mapPoints = this.currentObject.getPointList();

                        this.addMapPointsToChart(mapPoints);
                    }
                }
                break;

            case SET_CURRENT_HOVER_POINT:

                const mapPoint = value as MapPoint;

                if (mapPoint) {
                    const chartPoint1 = this.mapPointToChartPoint(mapPoint);

                    if (chartPoint1) {
                        this.updateCurrentTooltip(chartPoint1);

                        const geoPoint = (mapPoint).toGeoPoint();
                        if (geoPoint) {
                            this.currentPointObject.removeAllPoints();
                            this.currentPointObject.addGeoPoint(geoPoint);
                        }

                    }
                }
                break;

            case UPDATE_CHART_PARAMS:
                this.widgetProps.chartParams = value as ChartParams;

                this.workspaceData!.chartParams.lineColor = this.widgetProps.chartParams.lineColor;
                this.workspaceData!.chartParams.fillColor = this.widgetProps.chartParams.fillColor;
                this.workspaceData!.chartParams.showHeightIncrement = this.widgetProps.chartParams.showHeightIncrement;
                let statisticsKey: keyof ChartStatistics;
                for (statisticsKey in this.widgetProps.chartParams.statistics) {
                    const statisticsItem = this.widgetProps.chartParams.statistics[statisticsKey];
                    this.workspaceData!.chartParams.showStatistics[statisticsKey] = statisticsItem.show;
                }
                this.writeWorkspaceData(true);

                if (this.chart && this.chart.options.plugins && this.chart.options.plugins.annotation) {
                    this.chart.data.datasets[0].borderColor = this.widgetProps.chartParams.lineColor;

                    this.chart.data.datasets[0].backgroundColor = this.widgetProps.chartParams.fillColor;

                    this.chart.options.plugins.annotation.annotations = {};
                    this.updateSelectedTooltips();

                    // вернуть угловые точки
                    if (this.currentObject) {
                        const mapPoints = this.currentObject.getPointList();

                        this.addMapPointsToChart(mapPoints);
                    }

                    this.chart.update();
                }

                break;

            case CHANGE_CONTOUR_SELECTED:
                this.widgetProps.objectContourSelected = value as number;

                this.setAction(SELECT_OBJECT_FOR_RELIEF_LINE_ACTION, false);
                this.setAction(SELECT_OBJECT_FOR_RELIEF_LINE_ACTION, true);
                break;

            default:
                if (this._action) {
                    this._action.setState(key, value);
                }
        }
    }

    set objectContourCount(value: number) {
        this.widgetProps.objectContourCount = value;
    }

    get objectContourSelected() {
        return this.widgetProps.objectContourSelected;
    }

    setEditPointObject(editPointObject: MapObject) {
        this.isEditPoint = false;
        if (editPointObject.getPointList().length) {
            this.currentPointObject.removeAllPoints();
            this.currentPointObject.updateGeometryFrom(editPointObject);
            this.isEditPoint = true;
        }
    }

    onMouseMove(event: MouseDeviceEvent) {
        //@ts-ignore
        if (!this.chart || !this.chart._metasets[0]) {
            this.currentPointObject.removeAllPoints();
            return;
        }

        if (this.reliefLineObject.getPointList().length) {
            const map = this.mapWindow.getMap(),
                point = event.mousePosition.clone(),
                pointXY = map.pixelToPlane(point);

            //смещаем точку в пикселах для вычисления допуска в метрах
            point.x += this.deltaPix;
            point.y += this.deltaPix;

            const pointXYSupport = map.pixelToPlane(point);
            if (pointXY) {
                const cursorMapPoint = this.map.pixelToPlane(event.mousePosition);
                //допуск попадания в точку
                const delta = Math.max(Math.abs(pointXYSupport.x - pointXY.x), Math.abs(pointXYSupport.y - pointXY.y));
                const mapObject = this.reliefLineObject;

                let nearestPoint: MapPoint | undefined;
                const result = mapObject.checkBorderHover(cursorMapPoint, delta);
                if (result) {
                    nearestPoint = result.mapPoint;

                    if (nearestPoint) {

                        if (!this.isEditPoint) {
                            this.setState(SET_CURRENT_HOVER_POINT, nearestPoint);
                        } else {
                            this.setState(SET_CURRENT_HOVER_POINT, this.currentPointObject.getPointList()[0]);
                        }

                    }
                }

            }
        }

    }

    onMouseClick(event: MouseDeviceEvent) {
        super.onMouseClick(event);

        if (this.currentPointObject.getPointList().length) {
            const pointToAdd: MapPoint = this.currentPointObject.getPointList()[0];

            this.setState(SET_SELECTED_POINT, pointToAdd);

        }
    }

    private handleClickChart(event: ChartEvent) {
        if (!event.x || !this.chart) {
            return;
        }

        const chartPoint = this.pixToChartPoint(event.x - this.chart.chartArea.left);

        if (chartPoint && !isNaN(chartPoint.h) && this.currentObject) {
            this.selectedChartElements.push(chartPoint);

            this.updateSelectedTooltips();

            const chartPointXMeters = Utils.unitsToLinearMeter(chartPoint.x, this.xAxisUnit);
            const mapPoint = this.currentObject.getPointFromStartByDistance(chartPointXMeters);

            if (mapPoint) {
                const geoPoint = mapPoint.toGeoPoint();
                if (geoPoint) {
                    this.selectedPointsObject.addGeoPoint(geoPoint);
                    this.widgetProps.hasSelectedPoints = true;
                }
            }

        }
    }

    private handleHoverChart(event: ChartEvent) {
        if (!event.x || !this.chart) {
            return;
        }

        const chartPoint = this.pixToChartPoint(event.x - this.chart.chartArea.left);

        if (chartPoint && this.currentObject) {
            this.updateCurrentTooltip(chartPoint);

            const chartPointXMeters = Utils.unitsToLinearMeter(chartPoint.x, this.xAxisUnit);
            const mapPoint = this.currentObject.getPointFromStartByDistance(chartPointXMeters);

            if (mapPoint) {
                const geoPoint = mapPoint.toGeoPoint();
                if (geoPoint) {
                    this.currentPointObject.removeAllPoints();
                    this.currentPointObject.addGeoPoint(geoPoint);
                }
            }
        }

    }

    private pixToChartPoint(userPointX: number): ChartPoint | undefined {
        let result: ChartPoint | undefined = undefined;
        if (this.chart) {
            const dataPointsPix: ChartPoint[] = [];

            const metasets = (this.chart as Chart & { _metasets: [{ data: [] }] })._metasets;

            if (metasets && metasets[0] && metasets[0].data && metasets[0].data.length) {
                for (let i = 0; i < this.chart.data.datasets[0].data.length; i++) {

                    if (metasets[0].data[i]) {
                        const x = (metasets[0].data[i] as PointElement).x - this.chart.chartArea.left;
                        const h = (this.chart.data.datasets[0].data[i] as PointElement).y;

                        dataPointsPix.push({x, h});
                    } else {
                        return undefined;
                    }
                }

            } else {
                return undefined;
            }

            if (userPointX < dataPointsPix[0].x) {
                userPointX = dataPointsPix[0].x;
            }
            if (userPointX > dataPointsPix[dataPointsPix.length - 1].x) {
                userPointX = dataPointsPix[dataPointsPix.length - 1].x;
            }

            let indexPrev = 0;
            for (let i = 0; i < dataPointsPix.length; i++) {
                if (userPointX > dataPointsPix[i].x) {
                    indexPrev = i;
                }
            }

            let dividerX = (dataPointsPix[indexPrev + 1].x - dataPointsPix[indexPrev].x);
            if (Math.abs(dividerX) < 0.0001) {
                dividerX = 0.0001;
            }

            const h = (userPointX - dataPointsPix[indexPrev].x) * (dataPointsPix[indexPrev + 1].h - dataPointsPix[indexPrev].h) / dividerX + dataPointsPix[indexPrev].h;

            const x = userPointX * this.dataProfileRelief.precisionArray[this.dataProfileRelief.precisionArray.length - 1] / this.chart.chartArea.width;

            result = {x, h};
        }

        return result;
    }

    private mapPointToChartPoint(mapPoint: MapPoint): ChartPoint | undefined {
        let result: ChartPoint | undefined;

        const pointResult = this.reliefLineObject.findNearestInterpPoint(mapPoint);
        if (pointResult && this.chart) {

            const dataPointsMeter: ChartPoint[] = [];

            const metasets = (this.chart as Chart & { _metasets: [{ data: [] }] })._metasets;

            if (metasets && metasets[0] && metasets[0].data && metasets[0].data.length) {

                for (let i = 0; i < this.chart.data.datasets[0].data.length; i++) {

                    if (metasets[0].data[i]) {
                        const x = ((metasets[0].data[i] as PointElement).x - this.chart.chartArea.left) * this.dataProfileRelief.precisionArray[this.dataProfileRelief.precisionArray.length - 1] / this.chart.chartArea.width;
                        const h = (this.chart.data.datasets[0].data[i] as PointElement).y;

                        dataPointsMeter.push({x, h});
                    } else {
                        return undefined;
                    }

                }

            } else {
                return undefined;
            }

            const dataPointNumberPrev = pointResult.pointSelectorPrev.positionNumber;
            const distToDataPoint = this.dataProfileRelief.precisionArray[dataPointNumberPrev];

            let distFromDataPoint = this.reliefLineObject.getPointList()[dataPointNumberPrev].realDistanceTo(mapPoint);
            distFromDataPoint = GwtkReliefLineDiagramTask.getDistanceValueFromMetersToUnits(distFromDataPoint, this.xAxisUnit);

            const indexMax = this.dataProfileRelief.precisionArray.length - 1;
            const xMaxMeter = this.dataProfileRelief.precisionArray[indexMax];

            let resultX = distToDataPoint + distFromDataPoint;
            if (resultX > xMaxMeter) {
                resultX = xMaxMeter;
            }

            let segmentLength = 0;
            let segmentNumber;
            for (segmentNumber = 0; segmentNumber < dataPointsMeter.length; segmentNumber++) {

                segmentLength = dataPointsMeter[segmentNumber].x;
                if (resultX <= segmentLength) {
                    break;
                }

            }

            if (dataPointsMeter[segmentNumber] && dataPointsMeter[segmentNumber - 1]) {

                const dist = dataPointsMeter[segmentNumber].x - dataPointsMeter[segmentNumber - 1].x;

                const h1 = this.dataProfileRelief.value[pointResult.pointSelectorPrev.positionNumber][2];
                const h2 = this.dataProfileRelief.value[pointResult.pointSelectorNext.positionNumber][2];

                const resultH = distFromDataPoint * (h2 - h1) / dist + h1;

                result = {x: resultX, h: resultH};
            }

        }

        return result;
    }

    private setStatistics() {
        this.widgetProps.chartParams.statistics.distance.value = this.dataProfileRelief.precisionArray[this.dataProfileRelief.precisionArray.length - 1];

        const maxHeight = this.getMaxHeight();
        const minHeight = this.getMinHeight();
        this.widgetProps.chartParams.statistics.maxHeight.value = maxHeight;
        this.widgetProps.chartParams.statistics.minHeight.value = minHeight;
        this.widgetProps.chartParams.statistics.averageHeight.value = this.getAverageHeight();

        if (this.realDistance) {
            this.widgetProps.chartParams.statistics.realDistance.value = GwtkReliefLineDiagramTask.getDistanceValueFromMetersToUnits(this.realDistance, this.xAxisUnit);
        }

        this.widgetProps.chartParams.statistics.heightDifference.value = minHeight && maxHeight ? maxHeight - minHeight : undefined;
    }

    private addMapPointsToChart(points: MapPoint[]) {
        const pointsDegrees: (GeoPoint | undefined)[] = [];

        points.forEach((point) => {
            pointsDegrees.push(point.toGeoPoint());
        });

        pointsDegrees.forEach(cornerPoint => {

            const lat = cornerPoint!.getLatitude();
            const lon = cornerPoint!.getLongitude();

            let h: number | undefined;
            let dist: number | undefined;

            for (let i = 0; i < this.dataProfileRelief.value.length; i++) {
                const item = this.dataProfileRelief.value[i];
                if (Math.abs(item[0] - lat) < 0.00001 && Math.abs(item[1] - lon) < 0.00001) {
                    h = item[2];
                    dist = this.dataProfileRelief.precisionArray[i];
                    break;
                }
            }

            if (dist !== undefined && h !== undefined) {
                this.addPointToChart(dist, h);
            }

        });
    }

    private addPointToChart(x: number, y: number) {
        if (!this.chart) {
            return;
        }

        const point = 'point' + x;

        if (this.chart.options.plugins
            && this.chart.options.plugins.annotation
            && this.chart.options.plugins.annotation.annotations) {

            (this.chart as Chart & ChartPlugins).options.plugins.annotation.annotations[point] = {
                type: 'point',
                xValue: x,
                yValue: y,
                radius: this.chartCornerPointRadius,
                backgroundColor: this.widgetProps.chartParams.lineColor.substring(0, 7) + '42',
                borderColor: this.widgetProps.chartParams.lineColor,
            };

        }

        this.chart.update();

    }

    private updateCurrentTooltip(chartPoint: ChartPoint) {
        const xMax = this.dataProfileRelief.precisionArray[this.dataProfileRelief.precisionArray.length - 1];

        if (chartPoint.x >= 0 && chartPoint.x <= xMax && this.chart) {

            let firstDefinedHeight;
            for (let i = 0; i < this.dataProfileRelief.value.length; i++) {
                if (this.dataProfileRelief.value[i][2] !== undefined) {
                    firstDefinedHeight = this.dataProfileRelief.value[i][2];
                    break;
                }
            }

            const yValue = this.chart.scales.y.max;

            const label = 'CurrentLabel';
            const line = 'CurrentLine';

            let xAdjust = 0;
            let xPix = this.chart.chartArea.width * chartPoint.x / xMax;
            if (xPix > this.chart.chartArea.width) {
                xPix = this.chart.chartArea.width;
            } else if (xPix < 0) {
                xPix = 0;
            }

            if (xPix > this.chart.chartArea.width - this.annotationCurrentAdjustRightX) {
                xAdjust = this.chart.chartArea.width - this.annotationCurrentAdjustRightX - xPix;
            } else if (xPix < this.annotationCurrentAdjustLeftX) {
                xAdjust = this.annotationCurrentAdjustLeftX - xPix;
            }

            (this.chart as Chart & ChartPlugins).options.plugins.annotation.annotations[line] = {
                type: 'line',
                xMin: chartPoint.x,
                xMax: chartPoint.x,
                borderColor: this.tooltipLineCurrentColor,
                borderWidth: this.tooltipLineWidth,
            };

            const content: string[] = [];

            let yAdjust = this.annotationCurrentAdjustY - 7;
            content.push(i18n.tc('relieflinediagram.Distance') + ' ' + chartPoint.x.toFixed(1) + ' ' + this.xAxisUnitText);
            if (chartPoint.h) {
                content.push(i18n.tc('relieflinediagram.Height') + ' ' + chartPoint.h.toFixed(1) + ' ' + this.yAxisUnitText);

                if (this.widgetProps.chartParams.showHeightIncrement && firstDefinedHeight) {
                    content.push(i18n.tc('relieflinediagram.Excess') + ' ' + (chartPoint.h - firstDefinedHeight).toFixed(1) + ' ' + this.yAxisUnitText);
                    yAdjust = this.annotationCurrentAdjustY;
                }

            } else {
                yAdjust = this.annotationCurrentAdjustY - 14;
            }

            (this.chart as Chart & ChartPlugins).options.plugins.annotation.annotations[label] = {
                type: 'label',
                xValue: chartPoint.x,
                yValue,
                xAdjust,
                yAdjust,
                borderRadius: this.annotationBorderRadius,
                borderWidth: this.annotationBorderWidth,
                borderColor: this.tooltipLineSelectedColor,
                backgroundColor: this.annotationBackgroundColor,
                content,
                font: {
                    size: this.annotationFontSize
                },
            };

            this.chart.update();

        }

    }

    private updateSelectedTooltips() {
        if (!this.chart) {
            return;
        }

        const yValue = this.chart.scales.y.max;

        this.selectedChartElements.forEach((item) => {

            const id = item.x.toFixed(3);

            const label = 'label' + id;
            const line = 'line' + id;
            const point = 'point' + id;

            const xValue = item.x;
            const height = item.h.toFixed(1);

            let xPix = this.chart!.chartArea.width * xValue / this.dataProfileRelief.precisionArray[this.dataProfileRelief.precisionArray.length - 1];

            let xAdjust = 0;
            if (xPix > this.chart!.chartArea.width - this.annotationSelectedAdjustX) {
                xAdjust = this.chart!.chartArea.width - this.annotationSelectedAdjustX - xPix;
            } else if (xPix < this.annotationSelectedAdjustX) {
                xAdjust = this.annotationSelectedAdjustX - xPix;
            }

            if (this.chart) {
                (this.chart as Chart & ChartPlugins).options.plugins.annotation.annotations[line] = {
                    type: 'line',
                    xMin: xValue,
                    xMax: xValue,
                    borderColor: this.tooltipLineCurrentColor,
                    borderWidth: this.tooltipLineWidth,
                    z: 2
                };

                (this.chart as Chart & ChartPlugins).options.plugins.annotation.annotations[point] = {
                    type: 'point',
                    xValue,
                    yValue: item.h,
                    radius: 3,
                    backgroundColor: this.annotationPointBackgroundColor,
                    borderColor: this.tooltipLineCurrentColor,
                };

                (this.chart as Chart & ChartPlugins).options.plugins.annotation.annotations[label] = {
                    type: 'label',
                    xValue,
                    yValue,
                    xAdjust,
                    yAdjust: this.annotationSelectedAdjustY,
                    borderRadius: this.annotationBorderRadius,
                    borderWidth: this.annotationBorderWidth,
                    borderColor: this.tooltipLineSelectedColor,
                    backgroundColor: this.annotationBackgroundColor,
                    content: [height + ' ' + this.yAxisUnitText],
                    font: {
                        size: this.annotationFontSize
                    },
                    z: 2
                };
            }

        });

        this.chart.update();

    }

    private updateSelectedPointsObject(pointToAdd: MapPoint) {
        this.selectedPointsObject.addPoint(pointToAdd);
        this.widgetProps.hasSelectedPoints = true;
    }

    onPreRender() {
        if (this.currentPointObject.isDirty
            || this.selectedPointsObject.isDirty) {

            this.currentPointObject.isDirty = false;

            this.selectedPointsObject.isDirty = false;
            this.map.requestRender();
        }

    }

    onPostRender(renderer: SVGrenderer) {

        this.map.mapObjectsViewer.drawMapObject(renderer, this.currentPointObject);

        this.map.mapObjectsViewer.drawMapObject(renderer, this.selectedPointsObject);

    }

    onWorkspaceChanged(type: keyof WorkspaceValues) {
        super.onWorkspaceChanged(type);
        if (type === PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG) {

            this.applyCurrentTheme();
            this.chart?.update();
        }

        this.map.requestRender();
    }

    private setAction(id: string, active: boolean) {
        if (active) {
            this.doAction(id);
        } else {
            this.quitAction(id);
            // this.map.clearActiveObject();
        }
    }

    /**
     * Подготовить запрос GetReliefProfile
     * @private
     * @method startRequestGetReliefProfile
     * @param editObject {MapObject}
     */
    private startRequestGetReliefProfile(editObject: MapObject) {
        const geometry = editObject.getPointList().map(mapPoint => mapPoint.toGeoPoint()!);

        if (geometry.length > 1) {
            this.getAreaRequest(geometry);
        }
    }

    /**
     * Рассчитать точность
     * @private
     * @method calculatePrecision
     * @param length {number}
     * @param geometry {GeoPoint[]}
     */
    private calculatePrecision(length: number, geometry: GeoPoint[]) {

        let precision = length / this.countPoint;

        if (precision < this.precisionMin) {
            precision = this.precisionMin;
        }

        const serviceUrl = this.options.url;

        const httpParams = {
            url: serviceUrl
        };

        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST) || undefined;

        const activeObject = this.currentObject;
        if (activeObject) {

            const currentObject = new MapObject(activeObject.vectorLayer, MapObjectType.LineString);
            geometry.forEach(point => currentObject.addGeoPoint(point));
            const geoJSONFeature = currentObject.toJSON();

            const jsonFeatureCollection = {
                type: 'FeatureCollection',
                features: [geoJSONFeature],
                crs: {type: 'name', properties: {name: this.map.getCrsString()}}
            };

            const layerMatrix = this.options.layerid;

            const reliefProfileParam = {
                LAYER: layerMatrix,
                PRECISION: '' + precision
            };

            service.getReliefProfile(reliefProfileParam, {data: jsonFeatureCollection}).then(result => {
                if (result.data) {
                    this.parseReliefProfile(result.data);

                } else {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('relieflinediagram.Relief profile') + '. ' + i18n.tc('relieflinediagram.Failed to get data') + '!',
                        type: LogEventType.Error
                    });
                    return;
                }
            }).catch((e: Error) => {
                this.setAction(APPEND_POINT_RELIEF_LINE_ACTION, false);
                this.setAction(EDIT_POINT_RELIEF_LINE_ACTION, false);
                this.map.writeProtocolMessage({
                    text: i18n.tc('relieflinediagram.Relief profile') + '. ' + i18n.tc('relieflinediagram.Failed to get data') + '! ' + e.message,
                    type: LogEventType.Error,
                    display: true
                });
            });
        }
    }

    /**
     * Разобрать ответ от сервиса и построить диаграмму
     * @private
     * @method parseReliefProfile
     * @param response {ReliefProfileResponse} Ответ сервиса
     */
    private async parseReliefProfile(response: ReliefProfileResponse) {
        if (response && response.restmethod.outparams.length > 0) {

            let pointsList: Vector3D[] = [];
            const picketList: number[] = [];

            const segmentList = response.restmethod.outparams.find(item => item.name === 'Result')?.value;
            const segmentLengthsList = response.restmethod.outparams.find(item => item.name === 'prescisionList')?.value as number[];

            this.realDistance = +(response.restmethod.outparams.find(item => item.name === 'LengthByRelief')?.value as number);

            if (segmentLengthsList && Array.isArray(segmentLengthsList)) {

                if (segmentLengthsList.length === 1) { //если один сегмент

                    pointsList = response.restmethod.outparams[1].value as Vector3D[];

                    for (let pointNumber = 0; pointNumber < pointsList.length; pointNumber++) {
                        picketList.push(+(pointNumber * segmentLengthsList[0]).toFixed(3));
                    }

                } else if (segmentList && Array.isArray(segmentList)) {

                    const tempVectorLayer = GeoJsonLayer.getEmptyInstance(this.map);
                    this.mapObject = new MapObject(tempVectorLayer, MapObjectType.LineString);

                    for (let segmentNumber = 0; segmentNumber < segmentList.length; segmentNumber++) {

                        const segmentPoints = segmentList[segmentNumber] as Vector3D[];

                        const startPointNumber = (segmentNumber === 0) ? 0 : 1;

                        for (let pointNumber = startPointNumber; pointNumber < segmentPoints.length; pointNumber++) {

                            const point = segmentPoints[pointNumber];

                            pointsList.push(point);

                            const geoPoint = new GeoPoint(point[1], point[0], point[2], this.map.ProjectionId);

                            const mapPoint = geoPoint.toMapPoint();


                            if (mapPoint) {
                                this.mapObject.addPoint(mapPoint);
                            }

                        }

                    }

                    const result = await this.mapObject.calcLength({getLineLengthBetweenPoint: '1'});

                    let dist = 0;
                    for (let i = 0; i < result.linesLength.length; i++) {
                        picketList.push(dist);
                        dist += result.linesLength[i];
                    }
                    picketList.push(dist);

                }

            }

            // не отображать график для точек траектории без высот
            pointsList.forEach(item => {
                if (item[2] < -100000) {
                    //@ts-ignore
                    item[2] = undefined;
                }
            });

            const dataProfileRelief: DataProfileRelief = {
                value: pointsList,
                precisionArray: picketList
            };

            this.applyCurrentUnits(dataProfileRelief);
            this.applyCurrentTheme();

            window.setTimeout(() => {

                if (this.setDataProfileRelief(dataProfileRelief)) {

                    const tempVectorLayer = GeoJsonLayer.getEmptyInstance(this.map);

                    let newMapObject = new MapObject(tempVectorLayer, MapObjectType.LineString, {local: LOCALE.Line});

                    if (dataProfileRelief.value) {
                        for (let numberPoint = 0; numberPoint < dataProfileRelief.value.length; numberPoint++) {
                            const newPointObject = new GeoPoint(dataProfileRelief.value[numberPoint][1], dataProfileRelief.value[numberPoint][0], pointsList[numberPoint][2], this.map.ProjectionId);
                            newMapObject.addGeoPoint(newPointObject);
                        }
                        this.map.setActiveObject(newMapObject);

                        const mapActiveObject = this.map.getActiveObject();
                        if (mapActiveObject) {
                            this.reliefLineObject.updateGeometryFrom(mapActiveObject);

                            if (this.currentObject) {
                                const mapPoints = this.currentObject.getPointList();

                                this.addMapPointsToChart(mapPoints);
                            }

                            this.setStatistics();
                        }
                        this.map.clearActiveObject();

                    }

                }

            }, 100);

        }
    }

    private setDataProfileRelief(value: DataProfileRelief): boolean {
        let result = false;
        if (typeof value === 'object' && value !== null && this.canvas) {
            this.dataProfileRelief = value as DataProfileRelief;

            const maxHeight = this.getMaxHeight();
            const minHeight = this.getMinHeight();

            const ctx = this.canvas.getContext('2d');
            if (ctx) {
                this.chart = new Chart(ctx, {
                    type: 'scatter',
                    data: {
                        datasets: [],
                    },
                    options: {
                        showLine: true,
                        datasets: {
                            line: {}
                        },
                        animation: false,
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                enabled: false
                            }
                        },
                        interaction: {
                            // mode: 'index',
                            intersect: false,
                        },
                        scales: {
                            x: {
                                display: true,
                                max: this.dataProfileRelief.precisionArray[this.dataProfileRelief.precisionArray.length - 1],
                                min: 0,
                                // offset: true,//добавляются поля по бокам
                                ticks: {
                                    // stepSize: 30,
                                    display: true,
                                    // autoSkip: false,
                                    // maxTicksLimit:5,//количество столбцов решётки
                                    // source: 'data',
                                    includeBounds: false,
                                    // labelOffset: -10
                                },
                                title: {
                                    display: true,
                                    text: this.xAxisUnitText
                                },
                                grid: {
                                    color: () => this.gridColor,
                                }
                            },
                            y: {
                                min: minHeight ? minHeight : 0,
                                max: maxHeight ? maxHeight + 10 : 100,
                                display: true,
                                title: {
                                    display: true,
                                    text: this.yAxisUnitText
                                },
                                grid: {
                                    color: () => this.gridColor,
                                }
                            }
                        },
                        onHover: (event: ChartEvent) => this.handleHoverChart(event),
                        onClick: (event: ChartEvent) => this.handleClickChart(event),
                    },

                });

                const dataY: number[] = [];
                for (let i = 0; i < this.dataProfileRelief.value.length; i++) {
                    dataY.push(this.dataProfileRelief.value[i][2]);
                }

                const dataX = this.dataProfileRelief.precisionArray;

                const data: { x: number, y: number }[] = [];
                for (let i = 0; i < dataX.length; i++) {

                    data.push({
                        x: dataX[i],
                        y: dataY[i]
                    });

                }

                if (this.chart) {

                    this.chart.data.datasets[0] = {
                        data,
                        backgroundColor: this.widgetProps.chartParams.fillColor,
                        borderColor: this.widgetProps.chartParams.lineColor,
                        borderWidth: this.chartBorderWidth,
                        fill: 'start',
                        pointStyle: this.chartPointStyle,
                        pointRadius: this.chartPointRadius,
                        pointHoverRadius: this.chartPointHoverRadius,
                        // cubicInterpolationMode: 'monotone',
                        // tension: this.chartTension,
                    };

                    this.chart.update();

                    result = true;

                    this.widgetProps.isWaitingForChart = false;
                }

            }

        }

        if (!result) {
            this.mapWindow.addSnackBarMessage(i18n.t('relieflinediagram.Chart creation error') + '');
            this.map.writeProtocolMessage({
                text: i18n.t('relieflinediagram.Chart creation error') + '',
                type: LogEventType.Error
            });

            this.widgetProps.isWaitingForChart = false;
        }

        return result;
    }

    private getMinHeight() {
        let result = 8000;
        for (let i = 0; i < this.dataProfileRelief.value.length; i++) {
            const height = this.dataProfileRelief.value[i][2];
            if (!height) {
                continue;
            }
            if (height < result) {
                result = height;
            }
        }
        return Math.abs(result - 8000) < 0.1 ? undefined : result;
    }

    private getMaxHeight() {
        let result = -111112;
        for (let i = 0; i < this.dataProfileRelief.value.length; i++) {
            const height = this.dataProfileRelief.value[i][2];
            if (!height) {
                continue;
            }
            if (height > result) {
                result = height;
            }
        }
        return Math.abs(result + 111112) < 0.1 ? undefined : result;
    }

    private getAverageHeight() {
        let i;
        let result = 0;
        for (i = 0; i < this.dataProfileRelief.value.length; i++) {
            const height = this.dataProfileRelief.value[i][2];
            if (!height) {
                continue;
            }

            result += height;
        }

        return result / i;
    }

    /**
     * Составить и отправить запрос периметра объекта
     * @private
     * @method getAreaRequest
     * @return {Promise} Запрос
     */
    private getAreaRequest(pointList: GeoPoint[]) {
        const serviceUrl = this.options.url;

        const httpParams = {
            url: serviceUrl
        };
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);

        if (this.currentObject) {
            const geoJSONFeature = this.currentObject.toJSON();

            const jsonFeatureCollection = {
                type: 'FeatureCollection',
                features: [geoJSONFeature]
            };

            service.getArea({getLineLengthBetweenPoint: '1'}, {data: jsonFeatureCollection}).then(result => {
                if (result && result.data && result.data.features.length > 0) {
                    const length = result.data.features[0].properties.perimeter;
                    if (length !== undefined) {
                        this.calculatePrecision(length, pointList);
                    }
                } else {
                    this.map.writeProtocolMessage(
                        {
                            text: i18n.tc('relieflinediagram.Relief profile') + '. ' + i18n.tc('relieflinediagram.Failed to get data') + '!',
                            type: LogEventType.Error
                        }
                    );
                    return;
                }
            }).catch(error => {
                this.map.writeProtocolMessage(
                    {
                        text: i18n.tc('relieflinediagram.Relief profile') + '. ' + i18n.tc('relieflinediagram.Failed to get data') + '!',
                        description: error,
                        display: true,
                        type: LogEventType.Error
                    }
                );
                return;
            });
        }
    }
}

