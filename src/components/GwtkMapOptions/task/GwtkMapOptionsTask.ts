/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Задача "Параметры"                           *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkMapOptionsMain from '@/components/GwtkMapOptions/task/GwtkMapOptionsMain.vue';
import {
    AngleUnit,
    CursorCoordinateUnit,
    FontSize,
    MeasurementsStyle,
    MeasurementUnits,
    ObjectSearch,
    ObjectSelectionStyle,
    PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM,
    PROJECT_SETTINGS_MAP_LEGEND,
    PROJECT_SETTINGS_INITIAL_EXTENT_RESTORE_MAP_CONTENT,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER,
    PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS,
    PROJECT_SETTINGS_OBJECT_SELECTION_SIGNATURES_SELECTION,
    PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_DRAWING_TYPE,
    PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_LINE_COLOR,
    PROJECT_SETTINGS_REFRESH_INTERVAL,
    PROJECT_SETTINGS_SEARCH_FILTER_DIRECTION,
    PROJECT_SETTINGS_SEARCH_FILTER_SEMANTIC,
    PROJECT_SETTINGS_SEARCH_FILTER_TYPE,
    PROJECT_SETTINGS_SERVICE_URL,
    PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG,
    PROJECT_SETTINGS_USER_INTERFACE_FONT_SIZE,
    PROJECT_SETTINGS_USER_INTERFACE_PRIMARY_COLOR,
    PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG,
    PROJECT_SETTINGS_USER_INTERFACE_SECONDARY_COLOR,
    SelectObjectDrawingType,
    SignaturesSelection,
    Unit,
    PROJECT_SETTINGS_MAP_LOG_DEBUG_MODE, PROJECT_SETTINGS_ACTIVE_TASK_LIST

} from '~/utils/WorkspaceManager';
import Utils from '~/services/Utils';
import MapProject, { LayerParameters, ProjectUpdate } from '~/mapproject/MapProject';
import i18n from '@/plugins/i18n';
import { LogEventType } from '~/types/CommonTypes';
import { FINDDIRECTION, SORTTYPE } from '~/services/RequestServices/common/enumerables';

export const UPDATE_REFRESH_INTERVAL = 'gwtkmapoptions.refreshinterval';
export const UPDATE_LENGTH_UNIT = 'gwtkmapoptions.unitoflength';
export const UPDATE_AREA_UNIT = 'gwtkmapoptions.unitofarea';
export const UPDATE_ANGLE_UNIT = 'gwtkmapoptions.unitofangle';
export const UPDATE_OBJECT_SELECTION_LINE_COLOR = 'gwtkmapoptions.objectselectionlinecolor';
export const UPDATE_OBJECT_SELECTION_SIGNATURES_SELECTION = 'gwtkmapoptions.objectselectionsigmaturesselection';
export const UPDATE_OBJECT_SEARCH_POINT_PIXEL_RADIUS = 'gwtkmapoptions.objectsearchpointpixelradius';
export const UPDATE_MEASUREMENTS_FILL_COLOR = 'gwtkmapoptions.measurementsfillcolor';
export const UPDATE_MEASUREMENTS_LINE_COLOR = 'gwtkmapoptions.measurementslinecolor';
export const UPDATE_MEASUREMENTS_OPACITY = 'gwtkmapoptions.measurementsopacity';
export const UPDATE_ACTIVE_SERVICE_URL = 'gwtkmapoptions.activeserviceurl';
export const OPTIONS_APPLY = 'gwtkmapoptions.optionsapply';
export const OPTIONS_RESET = 'gwtkmapoptions.optionsreset';
export const CHANGE_PROJECT_MAP_LAYER_STATE = 'gwtkmapoptions.changeprojectmaplayerstate';
export const PROJECT_OPTIONS_APPLY = 'gwtkmapoptions.projectoptionsapply';
export const PROJECT_OPTIONS_RESET = 'gwtkmapoptions.projectoptionsreset';
export const UPDATE_CURSOR_COORDINATE_SYSTEM = 'gwtkmapoptions.cursorcoordinatesystem';
export const UPDATE_USER_INTERFACE_DARK_THEME_FLAG = 'gwtkmapoptions.userinterfacedarkthemeflag';
export const UPDATE_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG = 'gwtkmapoptions.userinterfacereducesizeinterfaceflag';
export const UPDATE_USER_INTERFACE_PRIMARY_COLOR = 'gwtkmapoptions.userinterfaceprimarycolor';
export const UPDATE_USER_INTERFACE_SECONDARY_COLOR = 'gwtkmapoptions.userinterfacesecondarycolor';
export const UPDATE_USER_INTERFACE_FONT_SIZE = 'gwtkmapoptions.updateuserinterfacefontsize';
export const CHANGE_TYPE_USER_SETTINGS = 'gwtkmapoptions.changetypeusersettings';
export const FORM_PROJECT_USER_SETTINGS = 'gwtkmapoptions.formprojectusersettings';
export const DELETE_PROJECT_PARAMETERS = 'gwtkmapoptions.deleteprojectparameters';
export const UPDATE_SEARCH_FILTER_SETTINGS = 'gwtkmapoptions.updatesearchfiltersettings';
export const UPDATE_SEARCH_DIRECTION_SETTINGS = 'gwtkmapoptions.updatesearchdirectionsettings';
export const LEGEND_WITH_MAP_EXTENT = 'gwtkmapoptions.legendwithmapextent';
export const INITIAL_EXTENT_RESET_MAP_CONTENT = 'gwtkmapoptions.initialextentresetmapcontent';
export const MAP_LOG_DEBUG_MODE = 'gwtkmapoptions.maplogdebugmode';

export type GwtkMapOptionsTaskState = {
    [UPDATE_REFRESH_INTERVAL]: number;
    [UPDATE_LENGTH_UNIT]: Unit;
    [UPDATE_AREA_UNIT]: Unit;
    [UPDATE_ANGLE_UNIT]: AngleUnit;
    [UPDATE_OBJECT_SELECTION_LINE_COLOR]: string;
    [UPDATE_OBJECT_SELECTION_SIGNATURES_SELECTION]: SignaturesSelection;
    [UPDATE_OBJECT_SEARCH_POINT_PIXEL_RADIUS]: number;
    [UPDATE_MEASUREMENTS_FILL_COLOR]: string;
    [UPDATE_MEASUREMENTS_LINE_COLOR]: string;
    [UPDATE_MEASUREMENTS_OPACITY]: number;
    [UPDATE_ACTIVE_SERVICE_URL]: string;
    [OPTIONS_APPLY]: string;
    [OPTIONS_RESET]: string | undefined;
    [CHANGE_PROJECT_MAP_LAYER_STATE]: ProjectMapLayers;
    [PROJECT_OPTIONS_APPLY]: undefined;
    [PROJECT_OPTIONS_RESET]: undefined;
    [UPDATE_CURSOR_COORDINATE_SYSTEM]: CursorCoordinateUnit;
    [UPDATE_USER_INTERFACE_DARK_THEME_FLAG]: boolean;
    [UPDATE_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG]: boolean;
    [UPDATE_USER_INTERFACE_PRIMARY_COLOR]: string;
    [UPDATE_USER_INTERFACE_SECONDARY_COLOR]: string;
    [UPDATE_USER_INTERFACE_FONT_SIZE]: FontSize;
    [CHANGE_TYPE_USER_SETTINGS]: TypeOfParameter;
    [FORM_PROJECT_USER_SETTINGS]: null;
    [DELETE_PROJECT_PARAMETERS]: undefined;
    [UPDATE_SEARCH_FILTER_SETTINGS]: string;
    [UPDATE_SEARCH_DIRECTION_SETTINGS]: string;
    [LEGEND_WITH_MAP_EXTENT]: undefined;
    [INITIAL_EXTENT_RESET_MAP_CONTENT]: undefined;
    [MAP_LOG_DEBUG_MODE]: undefined;
};

export type AppFontSizeValues = {
    selectedValue: FontSize;
    values: { size: FontSize, text: string }[];
};

export type ActiveServiceUrl = {
    active: string;
    urlsList: string[];
}

export type ProjectMapLayers = {
    id: string;
    name: string;
    active: boolean;
}

export type CursorCoordinateSystemParam = {
    isLocalSys: boolean;
    isGeoSys: boolean;
    mapProjectionName: string;
    coordinates: CursorCoordinateUnit;
}

export type UIParams = {
    darkThemeFlag: boolean;
    reduceSizeInterfaceFlag: boolean;
    primaryColor: string;
    secondaryColor: string;
    fontSizeData: AppFontSizeValues;
};

export type ProgramParameters = {
    refreshInterval: number;
    units: MeasurementUnits;
    objectSelection: ObjectSelectionStyle;
    objectSearch: ObjectSearch;
    measurements: MeasurementsStyle;
    cursorCoordinateParams: CursorCoordinateSystemParam;
    projectMapLayers: ProjectMapLayers[];
    ui: UIParams;
    mapLegend: MapLegendParams;
    searchFilterSettings: {
        type: string,
        semantic: string,
        direction: string
    },
    sortTypes: {
        type: {
            text: string,
            type: SORTTYPE
        }[],
        direction: {
            direction: FINDDIRECTION,
            text: string
        }[],
    },
    initialExtent: { resetMapContent: boolean };
    mapLog: { debugMode: boolean };
};

export type MapLegendParams = {
    withMapExtent: boolean
}

export enum TypeOfParameter {
    User = 'User',
    Project = 'Project',
}

type WidgetParams = {
    setState: GwtkMapOptionsTask['setState'];
    userParameters: {
        refreshInterval: number;
        units: MeasurementUnits;
        objectSelection: ObjectSelectionStyle;
        objectSearch: ObjectSearch;
        measurements: MeasurementsStyle;
        cursorCoordinateParams: CursorCoordinateSystemParam;
        projectMapLayers: ProjectMapLayers[];
        ui: UIParams;
    },
    projectParameters: ProgramParameters;
    typeOfParameter: TypeOfParameter;
}

/**
 * Команда переключения состояния компонента
 * @class GwtkMapOptionsTask
 * @extends Task
 */
export default class GwtkMapOptionsTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps { GwtkComponentDescriptionPropsData & WidgetParams}
     * */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * @constructor GwtkMapOptionsTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        // Создание Vue компонента
        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            userParameters: {
                refreshInterval: 3,
                units: {
                    perimeter: Unit.Kilometers,
                    area: Unit.SquareKilometers,
                    angle: AngleUnit.Degrees
                },
                objectSelection: {
                    drawingType: SelectObjectDrawingType.Paint,
                    lineColor: '',
                    signaturesSelection: this.map.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SELECTION_SIGNATURES_SELECTION)
                },
                objectSearch: {
                    pixelRadius: 0
                },
                measurements: {
                    fillColor: '',
                    lineColor: '',
                    opacity: 0
                },
                cursorCoordinateParams: this.cursorCoordinateSystemParam,
                projectMapLayers: this.projectMapLayers,
                ui: {
                    darkThemeFlag: false,
                    reduceSizeInterfaceFlag: false,
                    primaryColor: '',
                    secondaryColor: '',
                    fontSizeData: {
                        selectedValue: this.getCurrentFontSizeIndex(),
                        values: [
                            { size: FontSize.SmallFontSize, text: i18n.t('mapoptions.Small font') as string },
                            { size: FontSize.MediumFontSize, text: i18n.t('mapoptions.Medium font') as string },
                            { size: FontSize.HighFontSize, text: i18n.t('mapoptions.High font') as string },
                            { size: FontSize.LargeFontSize, text: i18n.t('mapoptions.Large font') as string },
                        ]
                    }
                },
            },
            projectParameters: {
                refreshInterval: 4,
                units: {
                    perimeter: Unit.Kilometers,
                    area: Unit.SquareKilometers,
                    angle: AngleUnit.Degrees
                },
                objectSelection: {
                    drawingType: SelectObjectDrawingType.Paint,
                    lineColor: '',
                    signaturesSelection: this.map.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SELECTION_SIGNATURES_SELECTION)
                },
                objectSearch: {
                    pixelRadius: 0
                },
                measurements: {
                    fillColor: '',
                    lineColor: '',
                    opacity: 0
                },
                mapLegend: {
                    withMapExtent: this.map.workspaceManager.getValue(PROJECT_SETTINGS_MAP_LEGEND)
                },
                cursorCoordinateParams: this.cursorCoordinateSystemParam,
                projectMapLayers: this.projectMapLayers,
                ui: {
                    darkThemeFlag: false,
                    reduceSizeInterfaceFlag: false,
                    primaryColor: '',
                    secondaryColor: '',
                    fontSizeData: {
                        selectedValue: this.getCurrentFontSizeIndex(),
                        values: [
                            { size: FontSize.SmallFontSize, text: i18n.t('mapoptions.Small font') as string },
                            { size: FontSize.MediumFontSize, text: i18n.t('mapoptions.Medium font') as string },
                            { size: FontSize.HighFontSize, text: i18n.t('mapoptions.High font') as string },
                            { size: FontSize.LargeFontSize, text: i18n.t('mapoptions.Large font') as string },
                        ]
                    }
                },
                searchFilterSettings: {
                    type: this.map.workspaceManager.getValue(PROJECT_SETTINGS_SEARCH_FILTER_TYPE),
                    semantic: this.map.workspaceManager.getValue(PROJECT_SETTINGS_SEARCH_FILTER_SEMANTIC),
                    direction: this.map.workspaceManager.getValue(PROJECT_SETTINGS_SEARCH_FILTER_DIRECTION)
                },
                sortTypes: {
                    type: [],
                    direction: [],
                },
                initialExtent: { resetMapContent: true },
                mapLog: { debugMode: this.map.workspaceManager.getValue(PROJECT_SETTINGS_MAP_LOG_DEBUG_MODE) }
            },
            typeOfParameter: TypeOfParameter.User,

        };

        this.fillSortTypes();
        this.restoreSettings();
    }

    private fillSortTypes() {
        this.widgetProps.projectParameters.sortTypes.type.push({
            text: String(i18n.t('mapobjectpanel.Find direction')),
            type: SORTTYPE.FindDirection
        });
        this.widgetProps.projectParameters.sortTypes.type.push({
            text: String(i18n.t('mapobjectpanel.Sort by layer name')),
            type: SORTTYPE.SortByLayerName
        });
        this.widgetProps.projectParameters.sortTypes.type.push({
            text: String(i18n.t('mapobjectpanel.Sort by object name')),
            type: SORTTYPE.SortByObjectName
        });
        this.widgetProps.projectParameters.sortTypes.type.push({
            text: String(i18n.t('mapobjectpanel.Sort by semantic value')),
            type: SORTTYPE.SortBysemanticValue
        });


        this.widgetProps.projectParameters.sortTypes.direction.push({
            text: String(i18n.t('mapobjectpanel.Ascending')),
            direction: FINDDIRECTION.FirstObjectFirst
        });
        this.widgetProps.projectParameters.sortTypes.direction.push({
            text: String(i18n.t('mapobjectpanel.Descending')),
            direction: FINDDIRECTION.FirstObjectLast
        });
    }

    private getCurrentFontSizeIndex() {
        const value = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_FONT_SIZE);
        if (value) {
            return value;
        }
        return FontSize.MediumFontSize;
    }


    createTaskPanel() {
        // регистрация Vue компонента
        const nameMainWidget = 'GwtkMapOptionsMain';
        const sourceMainWidget = GwtkMapOptionsMain;
        this.mapWindow.registerComponent(nameMainWidget, sourceMainWidget);

        // Создание Vue компонента
        this.mapWindow.createWidget(nameMainWidget, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    setState<K extends keyof GwtkMapOptionsTaskState>(key: K, value: GwtkMapOptionsTaskState[K]) {
        switch (key) {

            case UPDATE_SEARCH_DIRECTION_SETTINGS:
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_SEARCH_FILTER_DIRECTION, value as string);
                break;
            case UPDATE_SEARCH_FILTER_SETTINGS:
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_SEARCH_FILTER_TYPE, value as string);
                break;
            case UPDATE_REFRESH_INTERVAL:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.refreshInterval = value as number;
                }
                this.widgetProps.projectParameters.refreshInterval = value as number;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_REFRESH_INTERVAL, value as number);
                break;

            case UPDATE_LENGTH_UNIT:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.units.perimeter = value as Unit;
                }
                this.widgetProps.projectParameters.units.perimeter = value as Unit;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER, value as Unit);
                break;

            case UPDATE_AREA_UNIT:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.units.area = value as Unit;
                }
                this.widgetProps.projectParameters.units.area = value as Unit;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA, value as Unit);
                break;

            case UPDATE_ANGLE_UNIT:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.units.angle = value as AngleUnit;
                }
                this.widgetProps.projectParameters.units.angle = value as AngleUnit;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE, value as AngleUnit);
                break;

            case UPDATE_OBJECT_SELECTION_LINE_COLOR:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.objectSelection.lineColor = value as string;
                }
                this.widgetProps.projectParameters.objectSelection.lineColor = value as string;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_LINE_COLOR, value as string);
                if (this.map.getSelectedObjectsCount() > 0) {
                    this.map.refresh();
                }
                break;

            case UPDATE_OBJECT_SEARCH_POINT_PIXEL_RADIUS:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.objectSearch.pixelRadius = value as number;
                }
                this.widgetProps.projectParameters.objectSearch.pixelRadius = value as number;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS, value as number);
                break;

            case UPDATE_OBJECT_SELECTION_SIGNATURES_SELECTION:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.objectSelection.signaturesSelection = value as SignaturesSelection;
                }
                this.widgetProps.projectParameters.objectSelection.signaturesSelection = value as SignaturesSelection;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_OBJECT_SELECTION_SIGNATURES_SELECTION, value as SignaturesSelection);
                break;

            case UPDATE_MEASUREMENTS_FILL_COLOR:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.measurements.fillColor = value as string;
                }
                this.widgetProps.userParameters.measurements.fillColor = value as string;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR, value as string);
                break;

            case UPDATE_MEASUREMENTS_LINE_COLOR:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.measurements.lineColor = value as string;
                }
                this.widgetProps.projectParameters.measurements.lineColor = value as string;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR, value as string);
                break;

            case UPDATE_MEASUREMENTS_OPACITY:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.measurements.opacity = value as number;
                }
                this.widgetProps.projectParameters.measurements.opacity = value as number;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY, value as number);
                break;

            case OPTIONS_APPLY:
                if (value === 'tab_parameters') {
                    this.map.workspaceManager.writeDefaultUserSettings().then(() => {
                        let refreshInterval = this.map.workspaceManager.getValue(PROJECT_SETTINGS_REFRESH_INTERVAL);
                        this.map.tiles.setRefreshInterval(refreshInterval as number);
                    });
                } else {
                    this.map.workspaceManager.writeProjectUserSettings().then(() => {
                        let refreshInterval = this.map.workspaceManager.getValue(PROJECT_SETTINGS_REFRESH_INTERVAL);
                        this.map.tiles.setRefreshInterval(refreshInterval as number);
                    });
                }
                this.mapWindow.getTaskManager().onDataChanged({ type: 'legend' });
                break;

            case OPTIONS_RESET:
                this.map.workspaceManager.resetWorkspaceSettings().then(() => {
                    const isDarkTheme = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG);
                    this.map.workspaceManager.setValue(PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG, isDarkTheme);
                });
                break;

            case CHANGE_PROJECT_MAP_LAYER_STATE:
                this.changeLayerState(value as ProjectMapLayers);
                break;

            case PROJECT_OPTIONS_APPLY:
                // TODO В дальнейшем необходимо дописать функцию которое будет менять значения параметра enabled в слое карты
                this.updateMapProject();
                break;

            case PROJECT_OPTIONS_RESET:
                this.widgetProps.userParameters.projectMapLayers.splice(0, 0, ...this.projectMapLayers);
                break;

            case UPDATE_CURSOR_COORDINATE_SYSTEM:

                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.cursorCoordinateParams.coordinates = value as CursorCoordinateUnit;
                }
                this.widgetProps.userParameters.cursorCoordinateParams.coordinates = value as CursorCoordinateUnit;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM, value as CursorCoordinateUnit);
                break;

            case UPDATE_USER_INTERFACE_DARK_THEME_FLAG:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.ui.darkThemeFlag = value as boolean;
                }
                this.widgetProps.projectParameters.ui.darkThemeFlag = value as boolean;
                this.mapWindow.getTaskManager().setDarkTheme(this.widgetProps.projectParameters.ui.darkThemeFlag);
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG, value as boolean);
                break;
            case UPDATE_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.ui.reduceSizeInterfaceFlag = value as boolean;
                }
                this.widgetProps.projectParameters.ui.reduceSizeInterfaceFlag = value as boolean;
                this.mapWindow.getTaskManager().setReduceSizeInterface(value as boolean);
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG, value as boolean);
                break;

            case UPDATE_USER_INTERFACE_PRIMARY_COLOR: {

                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.ui.primaryColor = value as string;
                }
                this.widgetProps.projectParameters.ui.primaryColor = value as string;
                this.mapWindow.getTaskManager().applyColorScheme({
                    primary: this.widgetProps.projectParameters.ui.primaryColor,
                    secondary: this.widgetProps.projectParameters.ui.secondaryColor
                });
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_USER_INTERFACE_PRIMARY_COLOR, value as string);
                break;
            }
            case UPDATE_USER_INTERFACE_SECONDARY_COLOR:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.userParameters.ui.secondaryColor = value as string;
                }
                this.widgetProps.projectParameters.ui.secondaryColor = value as string;
                this.mapWindow.getTaskManager().applyColorScheme({
                    primary: this.widgetProps.projectParameters.ui.primaryColor,
                    secondary: this.widgetProps.projectParameters.ui.secondaryColor
                });
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_USER_INTERFACE_SECONDARY_COLOR, value as string);
                break;

            case UPDATE_USER_INTERFACE_FONT_SIZE:
                this.updateFontSize(value as FontSize);
                break;

            case CHANGE_TYPE_USER_SETTINGS:
                if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
                    this.widgetProps.typeOfParameter = TypeOfParameter.Project;
                } else {
                    this.widgetProps.typeOfParameter = TypeOfParameter.User;
                }
                break;

            case FORM_PROJECT_USER_SETTINGS:
                this.map.workspaceManager.initProjectUserSettings();
                break;

            case DELETE_PROJECT_PARAMETERS:
                this.mapWindow.showInputText({
                    description: i18n.tc('projectoptions.The project parameters will be deleted')
                }).then(() => {
                    this.map.workspaceManager.clearProjectUserSettings();
                }).then(() => {
                    this.setState(CHANGE_TYPE_USER_SETTINGS, this.widgetProps.typeOfParameter);
                }).catch(error => {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('projectoptions.Project options'),
                        description: i18n.tc('projectoptions.Project options') + '. ' + error,
                        type: LogEventType.Error
                    });
                });
                break;
            case LEGEND_WITH_MAP_EXTENT:
                this.widgetProps.projectParameters.mapLegend.withMapExtent = !this.widgetProps.projectParameters.mapLegend.withMapExtent;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_MAP_LEGEND, this.widgetProps.projectParameters.mapLegend.withMapExtent);
                break;
            case INITIAL_EXTENT_RESET_MAP_CONTENT:
                this.widgetProps.projectParameters.initialExtent.resetMapContent = !this.widgetProps.projectParameters.initialExtent.resetMapContent;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_INITIAL_EXTENT_RESTORE_MAP_CONTENT, this.widgetProps.projectParameters.initialExtent.resetMapContent);
                break;
            case MAP_LOG_DEBUG_MODE:
                this.widgetProps.projectParameters.mapLog.debugMode = !this.widgetProps.projectParameters.mapLog.debugMode;
                this.map.workspaceManager.setValue(PROJECT_SETTINGS_MAP_LOG_DEBUG_MODE, this.widgetProps.projectParameters.mapLog.debugMode);
                break;
        }
    }

    private updateFontSize(size: FontSize) {
        this.mapWindow.getTaskManager().setFontSize(size);
        if (this.widgetProps.typeOfParameter === TypeOfParameter.User) {
            this.widgetProps.userParameters.ui.fontSizeData.selectedValue = size;
        }
        this.widgetProps.projectParameters.ui.fontSizeData.selectedValue = size;
        this.map.workspaceManager.setValue(PROJECT_SETTINGS_USER_INTERFACE_FONT_SIZE, size);
    }

    protected destroy() {
        super.destroy();
        //иначе не сбрасывается активное окно настроек
        window.setTimeout(() => {
            const topActiveTaskId = this.map.workspaceManager.getValue(PROJECT_SETTINGS_ACTIVE_TASK_LIST);
            this.map.workspaceManager.resetWorkspaceSettings().then(() => {
                if (this.map.workspaceManager.getValue(PROJECT_SETTINGS_ACTIVE_TASK_LIST) === this.id) {
                    this.map.workspaceManager.setValue(PROJECT_SETTINGS_ACTIVE_TASK_LIST, topActiveTaskId);
                }
            });
        }, 3);
    }


    /**
     * Сбросить все изменения параметров
     * @private
     * @method restoreSettings
     */
    private restoreSettings() {

        this.widgetProps.userParameters.refreshInterval = this.map.workspaceManager.getValue(PROJECT_SETTINGS_REFRESH_INTERVAL);
        this.widgetProps.projectParameters.refreshInterval = this.map.workspaceManager.getValue(PROJECT_SETTINGS_REFRESH_INTERVAL);
        this.widgetProps.userParameters.cursorCoordinateParams.coordinates = this.map.workspaceManager.getValue(PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM);
        this.widgetProps.projectParameters.cursorCoordinateParams.coordinates = this.map.workspaceManager.getValue(PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM);

        this.widgetProps.userParameters.units.perimeter = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER);
        this.widgetProps.projectParameters.units.perimeter = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER);
        this.widgetProps.userParameters.units.area = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA);
        this.widgetProps.projectParameters.units.area = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA);
        this.widgetProps.userParameters.units.angle = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE);
        this.widgetProps.projectParameters.units.angle = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE);

        this.widgetProps.projectParameters.objectSelection.drawingType = this.map.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_DRAWING_TYPE);

        this.widgetProps.userParameters.objectSelection.lineColor = this.map.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_LINE_COLOR);
        this.widgetProps.projectParameters.objectSelection.lineColor = this.map.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SELECTION_STYLE_LINE_COLOR);
        this.widgetProps.userParameters.objectSelection.signaturesSelection = this.map.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SELECTION_SIGNATURES_SELECTION);
        this.widgetProps.projectParameters.objectSelection.signaturesSelection = this.map.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SELECTION_SIGNATURES_SELECTION);

        this.widgetProps.userParameters.objectSearch.pixelRadius = this.map.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS);
        this.widgetProps.projectParameters.objectSearch.pixelRadius = this.map.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS);

        this.widgetProps.userParameters.measurements.fillColor = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR);
        this.widgetProps.projectParameters.measurements.fillColor = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR);
        this.widgetProps.userParameters.measurements.lineColor = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR);
        this.widgetProps.projectParameters.measurements.lineColor = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR);
        this.widgetProps.userParameters.measurements.opacity = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY);
        this.widgetProps.projectParameters.measurements.opacity = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY);
        this.widgetProps.projectParameters.mapLegend.withMapExtent = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MAP_LEGEND);

        this.widgetProps.userParameters.ui.darkThemeFlag = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG);
        this.widgetProps.projectParameters.ui.darkThemeFlag = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG);
        this.widgetProps.userParameters.ui.reduceSizeInterfaceFlag = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
        this.widgetProps.projectParameters.ui.reduceSizeInterfaceFlag = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
        this.widgetProps.userParameters.ui.primaryColor = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_PRIMARY_COLOR);
        this.widgetProps.projectParameters.ui.primaryColor = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_PRIMARY_COLOR);
        this.widgetProps.userParameters.ui.secondaryColor = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_SECONDARY_COLOR);
        this.widgetProps.projectParameters.ui.secondaryColor = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_SECONDARY_COLOR);
        this.widgetProps.userParameters.ui.fontSizeData.selectedValue = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_FONT_SIZE);
        this.widgetProps.projectParameters.ui.fontSizeData.selectedValue = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_FONT_SIZE);
        this.widgetProps.typeOfParameter = this.map.workspaceManager.hasProjectUserSettings() ? TypeOfParameter.Project : TypeOfParameter.User;

        this.widgetProps.projectParameters.initialExtent.resetMapContent = this.map.workspaceManager.getValue(PROJECT_SETTINGS_INITIAL_EXTENT_RESTORE_MAP_CONTENT);
        this.widgetProps.projectParameters.mapLog.debugMode = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MAP_LOG_DEBUG_MODE);
    }

    /**
     * Получить параметры системы координат курсора
     * @property cursorCoordinateSystemParam
     * @returns {CursorCoordinateSystemParam}
     */
    get cursorCoordinateSystemParam(): CursorCoordinateSystemParam {
        let projectionName = this.map.Translate.projectionName;
        if (projectionName === 'Undefined') {
            projectionName = i18n.t('phrases.Undefined') as string;
        }
        return {
            isGeoSys: this.map.Translate.isGeoTransform,
            isLocalSys: this.map.Translate.isLocalCoordinateSystem,
            mapProjectionName: i18n.t('phrases.Map projection: ') + projectionName,
            coordinates: this.map.workspaceManager.getValue(PROJECT_SETTINGS_CURSOR_COORDINATE_SYSTEM)
        };
    }

    /**
     * Получить список активных сервисов для поиска
     * @method listOfActiveServicesToSearch
     */
    get listOfActiveServicesToSearch() {
        const result: ActiveServiceUrl = { active: '', urlsList: [] };

        let activeUrl = '';
        const workspaceManagerUrl = this.map.workspaceManager.getValue(PROJECT_SETTINGS_SERVICE_URL) as string;
        if (!workspaceManagerUrl) {
            if (this.map.options.url) {
                const activeUrlParse = Utils.parseUrl(this.map.options.url);
                activeUrl = activeUrlParse.origin + '/' + activeUrlParse.pathname;
            }
        } else {
            activeUrl = workspaceManagerUrl;
        }
        result.active = activeUrl;

        const layersList = this.map.layers;
        layersList.forEach((layer) => {
            const layerType = layer.getType();
            if (layerType === 'wms' || layerType === 'tile')
                if (layer.selectObject) {
                    if (layer.options.url) {
                        const layerUrlParse = Utils.parseUrl(layer.options.url);
                        const layerUrl = layerUrlParse.origin + '/' + layerUrlParse.pathname;
                        if (result.urlsList.indexOf(layerUrl) === -1)
                            result.urlsList.push(layerUrl);

                    }
                }
        });

        return result;
    }

    /**
     * Получить список слоев для раздела "Проекты"
     * @method projectMapLayers
     */
    get projectMapLayers() {
        const result: ProjectMapLayers[] = [];
        const layersList = this.map.mapProject.projectLayers as LayerParameters;
        layersList.forEach((layer) => {
            result.push({ id: layer.id, name: layer.alias, active: layer.enabled });
        });

        return result;
    }

    /**
     * Изменить состояние слоя
     * @private
     * @method changeLayerState
     * @param layerItem {ProjectMapLayers}
     */
    private changeLayerState(layerItem: ProjectMapLayers) {
        this.widgetProps.userParameters.projectMapLayers.forEach((layer) => {
            if (layer.id === layerItem.id)
                layer.active = layerItem.active;
        });
    }

    /**
     * Обновить проект карты
     * @private
     * @method updateMapProject
     */
    private updateMapProject() {
        const mapProject: MapProject = this.map.mapProject;
        const update: ProjectUpdate = { removed: [], selected: [] };
        this.widgetProps.userParameters.projectMapLayers.forEach((layer) => {
            if (!layer.active) {
                update.removed.push(layer.id);
            } else {
                update.selected.push(layer.id);
            }
        });
        mapProject.updateMap(update);
    }

    onWorkspaceReset() {
        this.restoreSettings();
        if (this.map.getSelectedObjectsCount() > 0) {
            this.map.refresh();
        }
    }

}
