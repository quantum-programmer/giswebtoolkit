/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Задача компонента "Картограммы"                  *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import {
    GwtkComponentDescriptionPropsData,
    BuildParameterOptions,
    BuildThematicMapParams,
    ThematicChartDataArray,
    ThematicRangesData,
    UserThematicRange, ThematicChartData,
    EditorLayoutDescription
} from '~/types/Types';
import MapWindow from '~/MapWindow';
import i18n from '@/plugins/i18n';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import RequestService from '~/services/RequestServices/common/RequestService';
import { CommonServiceSVG, SvgMarker } from '~/utils/GeoJSON';
import { LOCALE, LogEventType } from '~/types/CommonTypes';
import CsvEditor, { Cell } from '~/services/Utils/CsvEditor';
import { BrowserService } from '~/services/BrowserService';
import GISWebServiceVectorLayer from '~/maplayers/GISWebServiceVectorLayer';
import { ClassifierTypeSemanticValue } from '~/classifier/Classifier';
import SelectObjectAction from '../action/SelectObjectAction';

import {
    CartogramSource,
    Delimiter,
    LayerItem,
    Semantic,
    ThematicProjectSettings,
} from '../Types';
import { TreeNodeType, USER_LAYERS_FOLDER_ID } from '~/utils/MapTreeJSON';
import { SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';
import { SemanticCriterion, SemanticOperator } from '~/services/Search/criteria/SemanticSearchCriterion';
import VectorLayer from '~/maplayers/VectorLayer';
import { GISWebServiceSEMode, SourceType } from '~/services/Search/SearchManager';
import { RscSemantic } from '~/services/RequestServices/RestService/Types';
import MapObject from '~/mapobject/MapObject';
import GwtkUserThematicWidget from '@/components/GwtkUserThematic/task/GwtkUserThematicWidget.vue';
import { KeyListSearchCriterion } from '~/services/Search/criteria/StringArraySearchCriterion';
import GwtkError from '~/utils/GwtkError';
import Utils from '~/services/Utils';
import UserThematic from '~/utils/UserThematic';
import { PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG } from '~/utils/WorkspaceManager';
import {Chart, ChartOptions, TooltipModel} from 'chart.js';

export const SET_SERVICE_CURRENT = 'gwtkuserthematic.setservicecurrent';
export const SET_LAYER_CURRENT = 'gwtkuserthematic.setlayercurrent';
export const SET_VIRTUAL_FOLDER = 'gwtkuserthematic.setvirtualfolder';
export const TOGGLE_SOURCE = 'gwtkuserthematic.togglesource';
export const SELECT_BUILD_PARAMETER = 'gwtkuserthematic.selectbuildparameter';
export const EDIT_BUILD_PARAMETER = 'gwtkuserthematic.editbuildparameter';
export const REMOVE_BUILD_PARAMETER = 'gwtkuserthematic.removebuildparameter';
export const BUILD_THEMATIC_MAP = 'gwtkuserthematic.buildthematicmap';

export const OPEN_DATA_FILE = 'gwtkuserthematic.opendatafile';
export const CHANGE_HAS_TITLE_LINE = 'gwtkuserthematic.changehastitleline';
export const SET_DELIMITER_VALUE = 'gwtkuserthematic.setdelimitervalue';
export const SET_SEMANTIC_DATA_LINK_COLUMN = 'gwtkuserthematic.setsemanticdatalinkcolumn';

export const SET_PARAMETER_NAME = 'gwtkuserthematic.setparametername';
export const SET_RANGES_COUNT = 'gwtkuserthematic.setrangescount';
export const UPDATE_USER_THEMATIC_RANGES = 'gwtkuserthematic.createuserthematicranges';
export const EXPORT_BUILD_PARAMETERS_UNIT = 'gwtkuserthematic.exportbuildparametersunit';
export const IMPORT_BUILD_PARAMETERS_UNIT = 'gwtkuserthematic.imortbuildparametersunit';
export const EDIT_RANGE_LOCALE_STYLE = 'gwtkuserthematic.editrangelocalestyle';
export const CONFIRM_BUILD_PARAMETER = 'gwtkuserthematic.confirmbuildparameter';
export const CANCEL_ADD_BUILD_PARAMETER = 'gwtkuserthematic.canceladdbuildparameter';

export const SELECT_OBJECT_ACTION = 'gwtkuserthematic.selectobjectaction';
export const ADD_SELECTED_OBJECTS_TO_PARAMETER_LIST = 'gwtkuserthematic.addselectedobjectstoparameterlist';
export const REMOVE_ADDED_SELECTED_OBJECTS = 'gwtkuserthematic.removeaddedselectedobjects';
export const CHANGE_ACTION_INDICATOR = 'gwtkuserthematic.changeactionindicator';

export const SET_PARAMETER_FOR_CHART = 'gwtkuserthematic.setparameter';
export const SHOW_DIAGRAM = 'gwtkuserthematic.showdiagram';
export const INIT_CANVAS = 'gwtkuserthematic.initcanvas';
export const TRIGGER_TOOLTIP = 'gwtkuserthematic.triggertooltip';

export const EXPORT_THEMATIC_PROJECT_LIST = 'gwtkuserthematic.exportthematicprojectlist';
export const CREATE_THEMATIC_PROJECT = 'gwtkuserthematic.createthematicproject';
export const ADD_THEMATIC_PROJECT_FROM_FILE = 'gwtkuserthematic.addthematicprojectfromfile';
export const SET_THEMATIC_PROJECT = 'gwtkuserthematic.setthematicproject';
export const EDIT_THEMATIC_PROJECT_NAME = 'gwtkuserthematic.editthematicprojectname';
export const REMOVE_THEMATIC_PROJECT_FROM_LIST = 'gwtkuserthematic.removethematicprojectfromlist';
export const CLOSE_CSV_FILE = 'gwtkuserthematic.closecsvfile';

export const GET_OBJECTS_OF_RANGE = 'gwtkuserthematic.getobjectsofrange';

export type GwtkUserThematicTaskState = {
    [OPEN_DATA_FILE]: boolean;
    [SET_LAYER_CURRENT]: string;
    [SET_SERVICE_CURRENT]: string;
    [SET_DELIMITER_VALUE]: number;
    [SET_VIRTUAL_FOLDER]: string;
    [BUILD_THEMATIC_MAP]: { alias: string, path: string };
    [UPDATE_USER_THEMATIC_RANGES]: { id: string, text: string, count: number };
    [EDIT_RANGE_LOCALE_STYLE]: { rangeIndex: number, type: LOCALE };
    [TOGGLE_SOURCE]: CartogramSource;
    [SELECT_BUILD_PARAMETER]: string;
    [EDIT_BUILD_PARAMETER]: { value: string, index: number, id: string };
    [REMOVE_BUILD_PARAMETER]: number;
    [CONFIRM_BUILD_PARAMETER]: undefined;
    [CANCEL_ADD_BUILD_PARAMETER]: undefined;
    [SET_SEMANTIC_DATA_LINK_COLUMN]: number;
    [SET_PARAMETER_FOR_CHART]: string;
    [SET_PARAMETER_NAME]: string;
    [SET_RANGES_COUNT]: number;
    [CHANGE_HAS_TITLE_LINE]: boolean;
    [EXPORT_BUILD_PARAMETERS_UNIT]: undefined;
    [IMPORT_BUILD_PARAMETERS_UNIT]: undefined;
    [SELECT_OBJECT_ACTION]: boolean;
    [EXPORT_THEMATIC_PROJECT_LIST]: { selectedList: boolean[], name: string };
    [CREATE_THEMATIC_PROJECT]: undefined;
    [ADD_THEMATIC_PROJECT_FROM_FILE]: undefined;
    [SET_THEMATIC_PROJECT]: number;
    [EDIT_THEMATIC_PROJECT_NAME]: number;
    [REMOVE_THEMATIC_PROJECT_FROM_LIST]: number;
    [CLOSE_CSV_FILE]: undefined;
    [SHOW_DIAGRAM]: boolean;
    [GET_OBJECTS_OF_RANGE]: number;
    [ADD_SELECTED_OBJECTS_TO_PARAMETER_LIST]: undefined;
    [REMOVE_ADDED_SELECTED_OBJECTS]: undefined;
    [CHANGE_ACTION_INDICATOR]: undefined;
    [INIT_CANVAS]: HTMLCanvasElement;
    [TRIGGER_TOOLTIP]: number;
}


type WidgetParams = {
    setState: GwtkUserThematicTask['setState'];
    fileName: string;
    delimiters: Delimiter[];
    minValue: number;
    maxValue: number;
    semanticValueCol: Semantic[];
    numberConnectedField: number;

    layerList: LayerItem[];
    activeLayerId: string;

    isReadyCreateThematic: boolean;
    isReadyGetFeature: boolean;

    rangeIndex: number;
    cartogramSource: CartogramSource;

    currentDelimiterId: number;

    isParameterSettingMode: boolean;

    buildParametersOptionsTemp: BuildParameterOptions & { rangesCount: number };
    buildParameterList: { id: string, text: string }[];

    thematicChartDataArray: ThematicChartDataArray;

    virtualFolderList: { alias: string; folder: string; }[];
    serviceUrlList: string[];
    activeServiceUrl: string;

    hasTitleLine: boolean;

    currentVirtualFolderIndex: number;

    bySelectedObjects: boolean;
    selectActionStatus: boolean;
    isSelectedObjectsAdded: boolean;
    selectedObjectsLength: number;

    needToOpenCsvName: string;

    projectNamesList: string[],
    projectSelectedIndex: number,

    showDiagram: boolean,
    isReducedSizeInterface: boolean,

    colorLegend: string[],
}

/**
 * Задача компонента "Картограмма"
 * @class GwtkUserThematicTask
 * @extends Task
 */
export default class GwtkUserThematicTask extends Task {

    private canvas: HTMLCanvasElement | undefined;
    private chart: Chart<'pie'>  | undefined;

    private valueThematic: number[] = [];

    private abortXhr?: () => void;

    private csvEditor: CsvEditor = new CsvEditor( '' );

    private activeVectorLayer?: GISWebServiceVectorLayer;

    private readonly RANGES_COUNT_DEFAULT = 5;

    private currentParameterIndex = 0;
    private semanticDataLinkColumn = 0;
    private parameterId = '';

    protected workspaceData: { projects: ThematicProjectSettings[], projectIndex: number } = {
        projects: [],
        projectIndex: 0
    };

    /**
     * Сохраненные критерии поиска
     * @private
     * @property originCriteriaAggregator {CriteriaAggregator}
     */
    private originCriteriaAggregator = this.map.searchManager.getSearchCriteriaAggregatorCopy();

    private vectorLayers: {
        vectorLayer: VectorLayer,
        url: string
    }[] = [];

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * @constructor GwtkUserThematicTask
     * @param mapVue {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapVue: MapWindow, id: string ) {
        super( mapVue, id );

        this.actionRegistry.push( {
            getConstructor() {
                return SelectObjectAction;
            },
            id: SELECT_OBJECT_ACTION,
            active: false,
            enabled: true
        } );

        let serviceUrlList: string[] = [];
        let activeServiceUrl = '';
        let activeLayerId = '';

        const options = this.mapWindow.getMap().options.cartogram;
        if ( options && options.source ) {
            serviceUrlList = options.source.map( source => source.url );
            activeServiceUrl = serviceUrlList[ 0 ] || '';
            const source = options.source.find( source => source.url === activeServiceUrl );
            if ( source ) {
                activeLayerId = (source.layers[ 0 ] && source.layers[ 0 ].id) || '';
            }
        }

        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            taskId: this.id,
            setState: this.setState.bind( this ),

            fileName: '',
            delimiters: [
                { id: 1, name: ',', cols: 0 },
                { id: 2, name: '/', cols: 0 },
                { id: 3, name: ';', cols: 0 },
                { id: 4, name: '\\', cols: 0 },
                { id: 5, name: '|', cols: 0 },
                { id: 6, name: '_', cols: 0 },
                { id: 7, name: i18n.t( 'userthematic.Tab' ).toString(), cols: 0 },
                { id: 0, name: i18n.t( 'userthematic.Space' ).toString(), cols: 0 }
            ],
            semanticValueCol: [],
            numberConnectedField: 1,

            layerList: [],
            minValue: 0,
            maxValue: 0,
            isReadyCreateThematic: true,
            isReadyGetFeature: true,

            rangeIndex: -1,
            cartogramSource: CartogramSource.File,

            currentDelimiterId: 0,

            isParameterSettingMode: false,

            buildParametersOptionsTemp: { id: '', text: '', userThematicRangeList: [], rangesCount: 0 },
            buildParameterList: [],

            thematicChartDataArray: { array: [], title: '' },

            virtualFolderList: [],
            serviceUrlList,
            activeServiceUrl,
            activeLayerId,

            hasTitleLine: false,

            currentVirtualFolderIndex: 0,

            bySelectedObjects: false,
            selectActionStatus: false,
            isSelectedObjectsAdded: false,
            selectedObjectsLength: 0,

            needToOpenCsvName: '',

            projectNamesList: [],
            projectSelectedIndex: 0,

            showDiagram: false,
            isReducedSizeInterface: this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG),

            colorLegend: []
        };

        this.widgetProps.virtualFolderList.push( {
            alias: `(${i18n.t( 'userthematic.Empty' ).toString().toLowerCase()})`,
            folder: ''
        } );

    }

    private validateWorkspaceData() {
        let findError = false;
        const options = this.mapWindow.getMap().options.cartogram;
        if (options && options.source && this.workspaceData && this.workspaceData.projects) {
            for (let i = 0; i < this.workspaceData.projects.length; i++) {
                const project = this.workspaceData.projects[i];
                const folder = options.source.find(layers => layers.url === project.serviceUrl);
                if (folder) {
                    if (!folder.layers.find(layer => layer.id === project.idLayer)) {
                        this.map.writeProtocolMessage({
                            text: i18n.tc('phrases.Recovery error'),
                            description: i18n.tc('phrases.Could not find layer') + ' ' + project.idLayer,
                            type: LogEventType.Error,
                            display: true
                        });
                        this.workspaceData.projects.splice(i, 1);
                        findError = true;
                    }
                    if (project.virtualFolder.folder !== '' && folder.folders && !folder.folders.find(folder => folder === project.virtualFolder)) {
                        this.map.writeProtocolMessage({
                            text: i18n.tc('phrases.Recovery error'),
                            description: i18n.tc('phrases.Сould not find folder') + ' ' + project.virtualFolder.alias,
                            type: LogEventType.Error,
                            display: true
                        });
                        this.workspaceData.projects.splice(i, 1);
                        findError = true;
                    }
                } else {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('phrases.Recovery error'),
                        description: i18n.tc('phrases.Server address error') + ' ' + project.serviceUrl,
                        type: LogEventType.Error,
                        display: true
                    });
                    this.workspaceData.projects.splice(i, 1);
                    findError = true;
                }
            }
            if (findError) {
                this.writeWorkspaceData(true);
            }
        }
    }

    async setup() {
        super.setup();
        this.validateWorkspaceData();

        if ( !this.workspaceData || (this.workspaceData && this.workspaceData.projects && !this.workspaceData.projects.length) ) {
            const projectNew: ThematicProjectSettings = {
                name: i18n.t( 'userthematic.Project' ) + ' 1',
                serviceUrl: this.widgetProps.activeServiceUrl,
                idLayer: this.widgetProps.activeLayerId,
                virtualFolder: { alias: '', folder: '' },

                cartogramSource: 0,

                bySelectedObjects: false,
                featuresSelected: [],

                delimiterId: 0,
                hasTitleLine: false,
                semanticDataLinkColumn: 0,

                buildParameterOptionsList: []
            };

            this.workspaceData = { projects: [projectNew], projectIndex: 0 };
        }

        this.workspaceData.projects.forEach( ( item ) => {
            this.widgetProps.projectNamesList.push( item.name );
        } );

        this.widgetProps.projectSelectedIndex = this.workspaceData.projectIndex;

        this.fillLayerList();

        const thematicProject = this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ];
        if ( thematicProject ) {
            await this.setCurrentProject( thematicProject ).catch((error)=>{
                this.map.writeProtocolMessage({
                    text: i18n.tc('userthematic.Cartogram') + '. ' + i18n.tc('userthematic.Project file opening error'),
                    description: error,
                    display:true,
                    type: LogEventType.Error
                });
                this.mapWindow.getTaskManager().detachTask(this.id);
            });
        }

    }

    createTaskPanel() {
        // регистрация Vue компонента
        const name = 'GwtkUserThematicWidget';
        const source = GwtkUserThematicWidget;
        this.mapWindow.registerComponent( name, source );

        // Создание Vue компонента
        this.mapWindow.createWidget( name, this.widgetProps );
        // this.mapWindow.createWindowWidget( name, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    /**
     * Подготовить данные для построения диаграммы
     * @method chartDataValue
     */
    get chartDataValue() {
        const labels: string[] = [];
        const data: number[] = [];
        const backgroundColor: string[] = [];
        this.widgetProps.thematicChartDataArray.array.forEach( ( val: ThematicChartData ) => {
            labels.push( val.description.label );
            data.push( val.value );
            backgroundColor.push( val.description.color );
        } );

        this.valueThematic.splice( 0, this.valueThematic.length, ...data );

        this.widgetProps.colorLegend.splice(0, backgroundColor.length, ...backgroundColor);

        return {
            type: 'bar',
            labels,
            datasets: [{
                data,
                fill: false,
                borderWidth: 0,
                backgroundColor,
                hoverBorderWidth: 5,
                hoverBorderColor: 'blue'
            }]
        };
    }

    /**
     * Сформировать настройки диаграммы
     * @method chartOptions
     */
    get chartOptions(): ChartOptions<'pie'> {
        return {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false,
                    text: ''
                    // text: i18n.tc( 'phrases.All objects' )
                },
                tooltip: {
                    enabled: false,
                    position: 'nearest',
                    external: ( context ) => {
                        this.externalTooltipHandler( context );
                    }
                }
            }
        };

    }

    /**
     * Переопределить всплывающую подсказку
     * @method externalTooltipHandler
     * @param context
     */
    externalTooltipHandler(context: { chart: Chart; tooltip: TooltipModel<'pie'> }) {
        const { chart, tooltip } = context;

        const tooltipEl = this.getOrCreateTooltip(chart);
        if (!tooltipEl) {
            return;
        }

        if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
        }
        if (tooltip.body) {

            const titleLabel = tooltip.dataPoints.map(dataPoint => dataPoint.label);
            const titleDescription = tooltip.dataPoints.map(dataPoint => this.widgetProps.thematicChartDataArray.array[dataPoint.dataIndex].description.label);

            const bodyLines = tooltip.dataPoints.map(dataPoint => '  ' + dataPoint.parsed + ' (' + Math.round(dataPoint.parsed * 100 / this.valueThematic.reduce((partialSum, currentValue) => partialSum + currentValue, 0)) + '%)');

            const list = tooltipEl.querySelector('div');
            if (!list) {
                return;
            }
            while (list.firstChild) {
                list.firstChild.remove();
            }

            const tr1 = document.createElement('tr');
            const tr2 = document.createElement('tr');
            const tr3 = document.createElement('tr');
            const tr4 = document.createElement('tr');

            titleLabel.forEach((title, i) => {
                const tableValue = document.createElement('table');
                tableValue.style.tableLayout = 'fixed';
                tableValue.style.width = '100%';

                const description = document.createElement('td');
                description.textContent = titleDescription[i];
                description.style.overflowWrap = 'break-word';
                description.style.fontSize = '12px';
                description.colSpan = 2;

                const text = document.createElement('td');
                text.style.fontSize = '12px';
                text.colSpan = 2;

                const tdColor = document.createElement('td');

                const colors = tooltip.labelColors[i];
                const span = document.createElement('span');
                if (typeof colors.backgroundColor === 'string') {
                    span.style.background = colors.backgroundColor;
                }
                if (typeof colors.borderColor === 'string') {
                    span.style.borderColor = colors.borderColor;
                }
                if (typeof colors.borderColor === 'string') {
                    span.style.color = colors.borderColor;
                }
                span.style.borderWidth = '2px';
                span.style.marginRight = '10px';
                span.style.height = '20px';
                span.style.width = '20px';
                span.style.display = 'inline-block';

                text.textContent = title;

                const tdImage = document.createElement('td');
                const canvas = document.createElement('canvas',);
                canvas.width = 24 * 3 + 4;
                canvas.height = 24;
                const context = canvas.getContext('2d');

                canvas.style.backgroundColor = 'var(--color-white)';

                const iconArray = this.widgetProps.thematicChartDataArray.array[tooltip.dataPoints[0].dataIndex].description.icon;

                if (iconArray) {
                    for (let numberImage = 0; numberImage < iconArray.length; numberImage++) {
                        const dx = 24 * numberImage;
                        const imageObj1 = new Image();
                        imageObj1.style.borderRadius = '2px';

                        imageObj1.src = iconArray[numberImage];
                        imageObj1.onload = () => {
                            if (context) {
                                context.drawImage(imageObj1, dx, 0, 24, 24);

                            }
                        };
                        imageObj1.onerror = () => {
                            const boxSpan = document.createElement( 'span' );
                            boxSpan.style.display = 'inline-block';
                            boxSpan.style.height = '24px';
                            boxSpan.style.marginRight = '10px';
                            boxSpan.style.width = String( 24 * numberImage );
                        };
                    }
                }

                const tdTextValue = document.createElement( 'td' );
                tdTextValue.textContent = bodyLines[ i ];
                tdTextValue.style.fontSize = '12px';
                tdTextValue.colSpan = 2;


                tdColor.appendChild( span );
                tdImage.appendChild( canvas );
                tr1.appendChild( tdColor );
                tr1.appendChild( tdImage );
                tableValue.appendChild( tr1 );

                tr2.appendChild( description );
                tableValue.appendChild(tr2);

                tr3.appendChild(text);
                tableValue.appendChild(tr3);

                tr4.appendChild(tdTextValue);
                tableValue.appendChild(tr4);

                list.appendChild(tableValue);

            });
        }
        const { offsetLeft: positionX, offsetTop: positionY, offsetWidth: width, offsetHeight: height } = chart.canvas;

        tooltipEl.style.opacity = '1';
        tooltipEl.style.left = positionX + width / 2 + 'px';
        tooltipEl.style.top = positionY + height / 4 + 'px';
        tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
    }

    /**
     * Переопределить всплывающую подсказку
     * @method getOrCreateTooltip
     * @param chart диаграмма
     */
    getOrCreateTooltip( chart: Chart ) {
        let tooltipEl;
        if ( chart && chart.canvas && chart.canvas.parentNode && chart.canvas.parentNode.querySelector ) {
            tooltipEl = chart.canvas.parentNode.querySelector( 'div' );

            if ( !tooltipEl ) {
                tooltipEl = document.createElement( 'div' );
                tooltipEl.style.width = '200px';
                tooltipEl.style.background = 'var(--v-secondary-base)';
                tooltipEl.style.borderRadius = '3px';
                tooltipEl.style.color = 'white';
                tooltipEl.style.opacity = '1';
                tooltipEl.style.pointerEvents = 'none';
                tooltipEl.style.position = 'absolute';
                tooltipEl.style.transform = 'translate(-50%, 0)';
                tooltipEl.style.transition = 'all .1s ease';

                const list = document.createElement( 'div' );

                tooltipEl.appendChild( list );

                chart.canvas.parentNode.appendChild( tooltipEl );
            }
        }
        return tooltipEl;
    }

    /**
     * Показать значения в сегменте
     * @private
     * @param index {number} Номер сегмента
     */
    private triggerTooltip( index: number ) {

        const elementDescriptions = [{ datasetIndex: 0, index }];
        if ( this.chart ) {
            const tooltip = this.chart.tooltip;
            const activeElements = this.chart.getActiveElements();
            if ( tooltip ) {
                const activeElementsToolTip = tooltip.getActiveElements();

                if (activeElements.length > 0) {
                    this.chart.setActiveElements([]);
                    tooltip.setActiveElements([], { x: 0, y: 0 });
                    if (index !== activeElementsToolTip[0].index) {
                        this.chart.setActiveElements(elementDescriptions);
                        tooltip.setActiveElements(elementDescriptions, { x: 0, y: 0 });
                    }
                } else {
                    this.chart.setActiveElements(elementDescriptions);
                    tooltip.setActiveElements(elementDescriptions, { x: 0, y: 0 });
                }
            }
            this.chart.update();
        }

    }

    async setState<K extends keyof GwtkUserThematicTaskState>( key: K, value: GwtkUserThematicTaskState[ K ] ) {
        switch ( key ) {
            case INIT_CANVAS:
                this.canvas = value as HTMLCanvasElement;

                const ctx = this.canvas.getContext('2d');
                if (ctx) {
                    this.chart = new Chart(ctx, {
                        type: 'pie',
                        data: {
                            datasets: this.chartDataValue.datasets,
                        },
                        options: this.chartOptions,
                    });

                    if (this.chart) {
                        this.chart.update();
                    }
                }
                break;

            case TRIGGER_TOOLTIP:
                this.triggerTooltip(value as number);
                break;

            case OPEN_DATA_FILE:
                this.openDataFile(value as boolean, ['.txt', '.csv']).then((result) => {

                    this.widgetProps.needToOpenCsvName = '';
                    this.readCsvFile(result as CsvEditor);

                    this.workspaceData.projects[this.widgetProps.projectSelectedIndex].fileName = (result as CsvEditor).fileName;
                    this.writeWorkspaceData(true);
                }).catch(error => {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('userthematic.Cartogram') + '. ' + i18n.tc('userthematic.Project file opening error'),
                        description: error,
                        type: LogEventType.Error
                    });
                });

                break;

            case SET_SERVICE_CURRENT:
                this.widgetProps.activeServiceUrl = value as string;
                this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].serviceUrl = this.widgetProps.activeServiceUrl;
                this.fillLayerList();

                this.widgetProps.cartogramSource = CartogramSource.File;

                this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].buildParameterOptionsList.splice( 0 );

                this.widgetProps.buildParameterList.splice( 0 );

                this.widgetProps.activeLayerId = this.activeLayerIdInit;

                this.addVectorLayer();

                this.writeWorkspaceData( true );
                break;

            case SET_LAYER_CURRENT:
                this.map.clearSelectedObjects();

                const listItem_02 = this.layerItem;
                if ( listItem_02 ) {
                    listItem_02.featuresSelected.splice( 0 );
                }
                this.writeWorkspaceData( true );

                this.widgetProps.isSelectedObjectsAdded = false;
                this.widgetProps.selectActionStatus = false;
                this.setAction( SELECT_OBJECT_ACTION, this.widgetProps.selectActionStatus );

                this.widgetProps.activeLayerId = value as string;
                this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].idLayer = this.widgetProps.activeLayerId;

                if ( this.widgetProps.cartogramSource === CartogramSource.Layer ) {
                    this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].buildParameterOptionsList.splice( 0 );
                }
                this.writeWorkspaceData( true );

                this.addVectorLayer();

                this.fillBuildParameterListFromLayer();
                break;

            case SET_DELIMITER_VALUE:
                const index = this.widgetProps.delimiters.findIndex( ( item ) => item.id === (value as number) );
                if ( this.csvEditor && index > -1 ) {
                    this.widgetProps.currentDelimiterId = index;

                    this.csvEditor.separator = +this.widgetProps.delimiters[ index ].id;
                    this.parseFirstLine();

                    const project = this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ];
                    project.delimiterId = this.csvEditor.separator;
                    project.buildParameterOptionsList.splice( 0 );

                    this.widgetProps.buildParameterList.splice( 0 );

                    this.writeWorkspaceData( true );
                }
                break;

            case SET_VIRTUAL_FOLDER:
                const folderIndex = this.widgetProps.virtualFolderList.findIndex( item => item.folder === (value as string) );
                if ( folderIndex > -1 ) {
                    this.widgetProps.currentVirtualFolderIndex = folderIndex;
                    this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].virtualFolder = this.widgetProps.virtualFolderList[ folderIndex ];
                }
                break;

            case SET_SEMANTIC_DATA_LINK_COLUMN:
                this.semanticDataLinkColumn = value as number;
                this.workspaceData.projects[this.widgetProps.projectSelectedIndex].semanticDataLinkColumn = value as number;
                this.writeWorkspaceData(true);
                break;

            case BUILD_THEMATIC_MAP:
                if ( this.abortXhr ) {
                    this.abortXhr();
                } else {
                    this.fillCsvEditorFiltered().then( csvEditorFiltered => {
                        if ( csvEditorFiltered ) {
                            const buildThematicMapParams: BuildThematicMapParams = {
                                alias: (value as { alias: string, path: string }).alias,
                                path: (value as { alias: string, path: string }).path,
                                csvEditorFiltered
                            };
                            this.sendRequest( buildThematicMapParams );
                        }
                    } );
                }
                break;

            case UPDATE_USER_THEMATIC_RANGES:
                this.updateBuildParameterMinMax();
                this.createBuildParameterOptions( value as { id: string, text: string, count: number } );
                break;

            case EDIT_RANGE_LOCALE_STYLE:
                const val = value as { rangeIndex: number, type: LOCALE };
                this.widgetProps.rangeIndex = val.rangeIndex;

                this.editRangeLocaleStyle( val.rangeIndex, val.type );
                break;

            case SHOW_DIAGRAM:
                this.widgetProps.showDiagram = value as boolean;
                if ( this.widgetProps.showDiagram ) {
                    this.currentParameterIndex = 0;
                    this.createDataDiagram( 0 );
                }
                break;

            case SET_PARAMETER_FOR_CHART:
                this.currentParameterIndex = this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].buildParameterOptionsList.findIndex( ( item ) => item.id === value );
                if ( this.currentParameterIndex > -1 ) {
                    this.createDataDiagram( this.currentParameterIndex );
                }
                break;

            case TOGGLE_SOURCE:
                const source = value as CartogramSource;
                if ( this.widgetProps.cartogramSource !== source ) {

                    this.widgetProps.needToOpenCsvName = '';

                    this.csvEditor.clear();

                    this.widgetProps.minValue = 0;
                    this.widgetProps.maxValue = 0;
                    this.widgetProps.fileName = '';
                    this.widgetProps.currentDelimiterId = 0;

                    this.widgetProps.cartogramSource = source;

                    const project = this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ];
                    if ( project ) {
                        project.cartogramSource = source;
                        project.delimiterId = 0;
                        project.buildParameterOptionsList.splice( 0 );
                        project.fileName = '';
                    }
                    this.writeWorkspaceData( true );

                    this.fillBuildParameterListFromLayer();
                }
                break;

            case SELECT_BUILD_PARAMETER:
                this.parameterId = value as string;

                if ( await this.updateBuildParameterMinMax() ) {

                    await this.createBuildParameterOptions( {
                        id: this.parameterId, // изначально id == text
                        text: this.parameterId,
                        count: this.RANGES_COUNT_DEFAULT
                    } );
                    this.currentParameterIndex = -1;

                    this.widgetProps.isParameterSettingMode = true;
                    this.widgetProps.rangeIndex = -1;
                }
                break;

            case EDIT_BUILD_PARAMETER:
                const parameter = (value as { value: string, index: number, id: string });
                this.parameterId = parameter.id;
                this.currentParameterIndex = parameter.index;

                const params = this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].buildParameterOptionsList.find( ( item ) => item.id === this.parameterId );
                if ( params ) {
                    await this.updateBuildParameterMinMax();
                    this.widgetProps.isParameterSettingMode = true;
                    this.widgetProps.rangeIndex = -1;
                    this.fillBuildParametersOptionsTemp( params );
                }
                break;

            case CONFIRM_BUILD_PARAMETER:
                const paramsCopy = JSON.parse( JSON.stringify( this.widgetProps.buildParametersOptionsTemp ) );

                if ( this.currentParameterIndex === -1 ) {
                    this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].buildParameterOptionsList.push( paramsCopy );
                    this.widgetProps.buildParameterList.push( { id: paramsCopy.id, text: paramsCopy.text } );
                } else {
                    this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].buildParameterOptionsList.splice( this.currentParameterIndex, 1, paramsCopy );
                    this.widgetProps.buildParameterList.splice( this.currentParameterIndex, 1, {
                        id: paramsCopy.id,
                        text: paramsCopy.text
                    } );
                }

                this.writeWorkspaceData( true );
                this.widgetProps.isParameterSettingMode = false;
                break;

            case CANCEL_ADD_BUILD_PARAMETER:
                this.widgetProps.isParameterSettingMode = false;
                break;

            case REMOVE_BUILD_PARAMETER:
                this.workspaceData.projects[this.widgetProps.projectSelectedIndex].buildParameterOptionsList.splice(value as number, 1);
                this.widgetProps.buildParameterList.splice(value as number, 1);
                this.writeWorkspaceData(true);
                break;

            case SET_PARAMETER_NAME:
                this.widgetProps.buildParametersOptionsTemp.text = value as string;
                break;

            case SET_RANGES_COUNT:
                this.widgetProps.buildParametersOptionsTemp.rangesCount = value as number;
                break;

            case CHANGE_HAS_TITLE_LINE:
                this.widgetProps.hasTitleLine = !this.widgetProps.hasTitleLine;

                const content = this.csvEditor.content;
                const fileName = this.csvEditor.fileName;
                const separator = this.csvEditor.separator;

                this.csvEditor = new CsvEditor(content, fileName, value as boolean);
                this.csvEditor.separator = separator;

                this.workspaceData.projects[this.widgetProps.projectSelectedIndex].buildParameterOptionsList.splice(0);
                this.workspaceData.projects[this.widgetProps.projectSelectedIndex].hasTitleLine = value as boolean;
                this.writeWorkspaceData(true);

                this.parseFirstLine();
                break;

            case SELECT_OBJECT_ACTION:

                this.widgetProps.bySelectedObjects = value as boolean;
                this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].buildParameterOptionsList.splice( 0 );
                this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].bySelectedObjects = this.widgetProps.bySelectedObjects;
                this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].featuresSelected.splice( 0 );
                const listItem = this.layerItem;
                if ( listItem ) {
                    listItem.featuresSelected.splice( 0 );
                }
                this.writeWorkspaceData( true );

                let mapObjectSelectedList: MapObject[] = [];
                if ( this.widgetProps.bySelectedObjects ) {
                    this.widgetProps.isSelectedObjectsAdded = false;
                    this.widgetProps.semanticValueCol.splice( 0 );
                    this.widgetProps.buildParameterList.splice( 0 );
                    this.onSelectObjects();
                }
                if ( this.map.getSelectedObjects().length > 0 && this.widgetProps.bySelectedObjects ) {
                    mapObjectSelectedList = this.map.getSelectedObjects();
                }
                this.setAction( key, this.widgetProps.bySelectedObjects );

                if ( mapObjectSelectedList.length > 0 ) {
                    this.map.clearSelectedObjects();
                    this.map.addSelectedObjects( mapObjectSelectedList );
                }

                if ( !this.widgetProps.bySelectedObjects ) {
                    this.fillBuildParameterListFromLayer();
                }
                break;

            case EXPORT_BUILD_PARAMETERS_UNIT:
                const record = JSON.stringify( this.widgetProps.buildParametersOptionsTemp.userThematicRangeList );
                const min = this.widgetProps.buildParametersOptionsTemp.userThematicRangeList[ 0 ].range.min + '';
                const max = this.widgetProps.buildParametersOptionsTemp.userThematicRangeList[ this.widgetProps.buildParametersOptionsTemp.userThematicRangeList.length - 1 ].range.max + '';
                const fName = this.widgetProps.buildParametersOptionsTemp.text + '_' + min + '-' + max + '_' + this.widgetProps.buildParametersOptionsTemp.userThematicRangeList.length + '.json';

                try {
                    BrowserService.downloadContent(new Blob([record], { type: 'text' }), fName);
                } catch (error) {
                    this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
                }
                break;

            case IMPORT_BUILD_PARAMETERS_UNIT:
                UserThematic.importBuildParametersFromFile( this.widgetProps.buildParametersOptionsTemp ).catch( ( e ) => {
                    this.map.writeProtocolMessage( {
                        text: i18n.tc( 'userthematic.Cartogram' ) + '. ' + i18n.tc( 'userthematic.Error importing parameters from a file' ) + '.',
                        description: e,
                        type: LogEventType.Error
                    } );
                } );
                break;

            case EXPORT_THEMATIC_PROJECT_LIST:
                const projList = value as { selectedList: boolean[], name: string };
                this.exportThematicProjectList( projList.name, projList.selectedList );

                break;

            case CREATE_THEMATIC_PROJECT:
                this.mapWindow.showInputText( {
                    title: i18n.t( 'userthematic.Project name' ) + '',
                    inputText: i18n.t( 'userthematic.Project' ) + ' ' + (this.widgetProps.projectNamesList.length + 1),
                    description: ''
                } ).then( ( name ) => {
                    this.widgetProps.projectNamesList.push( name );

                    this.workspaceData.projects.push( {
                        name,
                        serviceUrl: this.widgetProps.activeServiceUrl,
                        idLayer: this.widgetProps.activeLayerId,

                        virtualFolder: this.widgetProps.virtualFolderList[ this.widgetProps.currentVirtualFolderIndex ],

                        cartogramSource: 0,
                        bySelectedObjects: false,
                        featuresSelected: [],

                        delimiterId: 0,
                        hasTitleLine: false,
                        semanticDataLinkColumn: 0,

                        buildParameterOptionsList: []

                    } );
                    this.writeWorkspaceData( true );
                } ).catch( ( e ) => {
                    if ( e ) {
                        this.map.writeProtocolMessage( {
                            text: i18n.tc( 'userthematic.Cartogram' ) + '. ' + i18n.tc( 'phrases.Error' ) + '.',
                            description: e,
                            type: LogEventType.Error
                        } );
                    }
                } );
                break;

            case ADD_THEMATIC_PROJECT_FROM_FILE:

                this.openDataFile( false, ['json'] ).then( ( result ) => {
                    try {
                        const resultData: ThematicProjectSettings[] = JSON.parse(result as string);

                        resultData.forEach((item) => {
                            this.widgetProps.projectNamesList.push(item.name ? item.name : i18n.t('userthematic.Unknown project') + '');
                            this.workspaceData.projects.push(item);
                        });

                        this.writeWorkspaceData(true);

                    } catch (error) {
                        const gwtkError = new GwtkError(error);
                        this.map.writeProtocolMessage({
                            text: i18n.t('userthematic.Cartogram') + '. ' + i18n.t('userthematic.Project file opening error'),
                            description: gwtkError.message,
                            type: LogEventType.Error,
                            display: true
                        });
                    }
                } );
                break;

            case SET_THEMATIC_PROJECT:
                const projectIndex = value as number;
                if (projectIndex >= 0 && projectIndex < this.workspaceData.projects.length) {

                    this.widgetProps.projectSelectedIndex = projectIndex;
                    this.widgetProps.fileName = '';
                    this.widgetProps.buildParameterList.splice(0);
                    this.widgetProps.needToOpenCsvName = '';
                    this.widgetProps.isParameterSettingMode = false;
                    this.widgetProps.hasTitleLine = false;

                    const project = this.workspaceData.projects[projectIndex];
                    this.setCurrentProject(project).then(() => {
                        this.workspaceData.projectIndex = this.widgetProps.projectSelectedIndex;
                        this.writeWorkspaceData(true);

                        this.widgetProps.showDiagram = false;
                    });

                }
                break;

            case EDIT_THEMATIC_PROJECT_NAME:
                const editProjectIndex = value as number;
                if (editProjectIndex >= 0 && editProjectIndex < this.workspaceData.projects.length) {

                    const projectName = this.workspaceData.projects[editProjectIndex].name;

                    this.mapWindow.showInputText({
                        title: i18n.t('userthematic.Project name') + '',
                        inputText: projectName ? projectName : i18n.t('userthematic.Unknown project') + '',
                        description: ''
                    }).then((name) => {
                        this.workspaceData.projects[editProjectIndex].name = name;
                        this.widgetProps.projectNamesList.splice(editProjectIndex, 1, name);
                        this.writeWorkspaceData(true);
                    } ).catch( ( e ) => {
                        if ( e ) {
                            this.map.writeProtocolMessage( {
                                text: i18n.tc( 'userthematic.Cartogram' ) + '. ' + i18n.tc( 'phrases.Error' ) + '.',
                                description: e,
                                type: LogEventType.Error
                            } );
                        }
                    } );
                }
                break;

            case REMOVE_THEMATIC_PROJECT_FROM_LIST:
                const removeProjectIndex = value as number;
                this.widgetProps.projectNamesList.splice(removeProjectIndex, 1);
                this.workspaceData.projects.splice(removeProjectIndex, 1);
                this.writeWorkspaceData(true);

                if (this.widgetProps.projectSelectedIndex === removeProjectIndex) {
                    let newSelectedIndex = (removeProjectIndex === this.widgetProps.projectNamesList.length) ? (removeProjectIndex - 1) : removeProjectIndex;
                    this.setState(SET_THEMATIC_PROJECT, newSelectedIndex);
                }
                if (this.widgetProps.projectSelectedIndex > removeProjectIndex) {
                    this.widgetProps.projectSelectedIndex--;
                }
                break;

            case CLOSE_CSV_FILE:
                this.widgetProps.fileName = '';
                this.widgetProps.buildParameterList.splice( 0 );

                const currentProject = this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ];
                if ( currentProject ) {
                    currentProject.buildParameterOptionsList.splice( 0 );
                    currentProject.fileName = undefined;
                    currentProject.delimiterId = 0;
                    currentProject.semanticDataLinkColumn = 0;
                    currentProject.hasTitleLine = false;
                }
                break;

            case GET_OBJECTS_OF_RANGE:
                this.widgetProps.rangeIndex = value as number;
                this.getObjectsOfRange();
                break;

            case ADD_SELECTED_OBJECTS_TO_PARAMETER_LIST:
                this.widgetProps.isSelectedObjectsAdded = true;
                this.widgetProps.selectedObjectsLength = 0;

                this.updateMapObjectSelectedList();
                this.setAction( SELECT_OBJECT_ACTION, false );
                break;

            case REMOVE_ADDED_SELECTED_OBJECTS:

                this.widgetProps.isSelectedObjectsAdded = false;

                this.widgetProps.semanticValueCol.splice( 0 );
                this.widgetProps.buildParameterList.splice( 0 );
                this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].buildParameterOptionsList.splice( 0 );
                this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].featuresSelected.splice( 0 );
                const listItem_1 = this.layerItem;
                if ( listItem_1 ) {
                    listItem_1.featuresSelected.splice( 0 );
                }
                this.writeWorkspaceData( true );

                this.setAction( SELECT_OBJECT_ACTION, true );

                this.onSelectObjects(this.map.getSelectedObjects());
                break;

            case CHANGE_ACTION_INDICATOR:

                this.widgetProps.selectActionStatus = !this.widgetProps.selectActionStatus;
                this.setAction( SELECT_OBJECT_ACTION, this.widgetProps.selectActionStatus );
                break;
            default:
                break;
        }
    }

    setIsPanelReady( value: boolean ) {
        this.widgetProps.isReadyGetFeature = value;
    }

    private addVectorLayer() {
        const vectorLayerIndex = this.vectorLayers.findIndex( ( item ) =>
            (item.vectorLayer.idLayer === this.widgetProps.activeLayerId) && (item.url === this.widgetProps.activeServiceUrl) );
        if ( vectorLayerIndex === -1 ) {
            this.vectorLayers.push(
                {
                    vectorLayer: new GISWebServiceVectorLayer( this.map, {
                        alias: this.widgetProps.activeLayerId,
                        id: this.widgetProps.activeLayerId,
                        url: this.widgetProps.activeServiceUrl + '?layer=' + encodeURIComponent(this.widgetProps.activeLayerId)
                    } ),
                    url: this.widgetProps.activeServiceUrl
                }
            );
        }
    }

    /**
     * Получение параметров семантики для фильтра запроса объектов диапазона
     * @method getSemanticFilter
     * private
     * @async
     */
    private async getSemanticFilter(): Promise<{ key: string, min: number, max: number, type: SemanticOperator, decimal: number }> {
        let key = '';
        let min = 0;
        let max = 0;
        let type = SemanticOperator.ContainsValue;
        let decimal = 0;

        const project = this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ];
        if ( project ) {
            const parameter = project.buildParameterOptionsList[ this.currentParameterIndex ];

            const layerItem = this.layerItem;

            if ( parameter && layerItem ) {
                min = parameter.userThematicRangeList[ this.widgetProps.rangeIndex ].range.min;
                max = parameter.userThematicRangeList[ this.widgetProps.rangeIndex ].range.max;

                if ( this.widgetProps.cartogramSource === CartogramSource.Layer ) {

                    const field = this.widgetProps.bySelectedObjects ? 'featuresSelected' : 'features';

                    if ( layerItem[ field ] ) {

                        for ( let i = 0; i < layerItem[ field ].length; i++ ) {

                            const item = layerItem[ field ][ i ];

                            const semantics = item.getSemantics();

                            if ( semantics ) {
                                const index = semantics.findIndex( (( semantic ) => semantic.name === parameter.id) );

                                if ( index > -1 ) {
                                    const semantic = semantics[ index ];
                                    key = semantic.key;
                                    break;
                                }
                            }
                        }
                    }

                    if ( key ) {
                        const vectorLayerItem = this.vectorLayerItem;

                        if ( vectorLayerItem ) {
                            const layerSemanticList = await vectorLayerItem.vectorLayer.getClassifierLayerSemanticsList();

                            if ( layerSemanticList ) {
                                for ( let layerSemanticsListIndex = 0; layerSemanticsListIndex < layerSemanticList.length; layerSemanticsListIndex++ ) {
                                    const layer = layerSemanticList[ layerSemanticsListIndex ];

                                    const rscSemantic = layer.rscsemantic.find( semantic => semantic.name === parameter.id );

                                    if ( rscSemantic ) {
                                        const layerSemanticTypeValue = +rscSemantic.type;

                                        if ( layerSemanticTypeValue === 1 ) {
                                            type = SemanticOperator.InRange;
                                        } else if ( layerSemanticTypeValue === 16 ) {
                                            type = SemanticOperator.InList;
                                        }

                                        decimal = +rscSemantic.decimal;
                                        break;
                                    }
                                }
                            }
                        }
                    }

                } else if ( this.widgetProps.cartogramSource === CartogramSource.File ) {
                    key = layerItem.semlink;
                    type = SemanticOperator.InList;
                }

            }
        }

        return { key, min, max, type, decimal };
    }

    /**
     * Получение объектов диапазона диаграммы
     * @method getObjectsOfRange
     * private
     * @async
     */
    private async getObjectsOfRange() {
        this.map.clearActiveObject();
        this.map.clearSelectedObjects();

        const searchManager = this.mapWindow.getMap().searchManager;

        const vectorLayer = this.vectorLayerItem?.vectorLayer;

        searchManager.activateSource( SourceType.GISWebServiceSE, GISWebServiceSEMode.All, vectorLayer ? [vectorLayer] : undefined );
        searchManager.clearSearchCriteriaAggregator();
        const aggregator = searchManager.getSearchCriteriaAggregatorCopy();

        const semanticCriterionList = await this.getSemanticCriterionList();

        aggregator.removeCriterion( SearchCriterionName.Count );
        aggregator.removeCriterion( SearchCriterionName.StartIndex );
        if ( this.layerItem && this.layerItem.keylist ) {
            const keyListSearchCriterion: KeyListSearchCriterion = aggregator.getKeyListSearchCriterion();
            keyListSearchCriterion.addValue( this.layerItem.keylist );
            aggregator.setKeyListSearchCriterion( keyListSearchCriterion );
        } else {
            aggregator.removeCriterion( SearchCriterionName.KeyList );
        }

        const semanticSearchCriterion = aggregator.getSemanticSearchCriterion();

        semanticCriterionList.forEach( ( item ) => semanticSearchCriterion.addSemanticCriterion( item ) );

        semanticSearchCriterion.setLogicalDisjunction( semanticCriterionList.length > 1 );

        if ( this.widgetProps.bySelectedObjects ) {

            const objectNumberCriterion = aggregator.getIdListSearchCriterion();

            const layerItem = this.layerItem;
            if ( layerItem ) {

                layerItem.featuresSelected.forEach( ( mapObject ) => {

                    const mapObjectSemantics = mapObject.getSemantics();

                    const semanticSearchCriterionContent = semanticSearchCriterion.getContent();

                    const semanticCriterionList = semanticSearchCriterionContent.semanticCriterionList;

                    if ( semanticSearchCriterionContent.semanticCriterionList.length > 1 ) {

                        let found = false;

                        mapObjectSemantics.forEach( ( semanticItem ) => {

                            semanticCriterionList.forEach( ( semanticCriterion ) => {
                                if ( semanticCriterion.key === semanticItem.key
                                    && ((semanticItem.value === semanticCriterion.value)
                                        || (Array.isArray( semanticCriterion.value )
                                            && (semanticCriterion.value.length > 1 && semanticItem.value >= semanticCriterion.value[ 0 ]!
                                                && semanticItem.value <= semanticCriterion.value[ 1 ]!)
                                            || (semanticItem.value === semanticCriterion.value[ 0 ]))) ) {
                                    found = true;
                                }
                            } );

                        } );

                        if ( found ) {
                            objectNumberCriterion.addValue( mapObject.gmlId );
                        }

                    } else {
                        const index = mapObjectSemantics.findIndex( ( item ) =>
                            (semanticCriterionList[ 0 ].key === item.key)
                            && ((Array.isArray( semanticCriterionList[ 0 ].value ) && (semanticCriterionList[ 0 ].value.length > 1)
                                    && (item.value >= semanticCriterionList[ 0 ].value[ 0 ]!) && (item.value <= semanticCriterionList[ 0 ].value[ 1 ]!))
                                || (item.value === semanticCriterionList[ 0 ].value[ 0 ]) || (item.value === semanticCriterionList[ 0 ].value)) );

                        if ( index > -1 ) {
                            objectNumberCriterion.addValue( mapObject.gmlId );
                        }
                    }

                } );

            }

        }

        const srsNameSearchCriterion = aggregator.getSrsNameSearchCriterion();
        srsNameSearchCriterion.setValue( this.map.getCrsString() );

        this.mapWindow.getTaskManager().updateCriteriaAggregator( aggregator );
        searchManager.setSearchCriteriaAggregator( aggregator );

        searchManager.findNext().then( () => {

            const mapObjectsFiltered: MapObject[] = searchManager.mapObjects.filter( ( item ) => item.getSemantics().length );

            searchManager.mapObjects.splice( 0 );
            mapObjectsFiltered.forEach( mapObject => searchManager.mapObjects.push( mapObject ) );
            searchManager.responseMapObjectCount = searchManager.mapObjects.length;

            this.mapWindow.getTaskManager().showObjectPanel();
        } );
    }

    /**
     * Получение списка критериев семантик типа число и типа классификатор
     * @method getSemanticCriterionList
     * @async
     */
    private async getSemanticCriterionList(): Promise<SemanticCriterion[]> {

        const semanticFilter = await this.getSemanticFilter();

        // if ( semanticFilter.type === SemanticOperator.ContainsValue ) {//TODO сюда не должен попадать, т.к. тут семантики с типом, отличным от 1 или 16
        //     console.log( 'ContainsValue' );
        //
        //     // TODO если диапазон очень широкий, например "Ток сети" (220-86346), то такой длинный запрос не выполнится
        //     //  (для "Почтового индекса" работает)
        //     const valueMinTruncated = Math.trunc( semanticFilter.min );
        //     const valueMaxTruncated = Math.trunc( semanticFilter.max );
        //     const range = (valueMaxTruncated - valueMinTruncated) < 100 ? valueMaxTruncated - valueMinTruncated : 100;
        //
        //     const semanticValueArray: string[] = [];
        //     for ( let i = 0; i <= range; i++ ) {
        //         semanticValueArray.push( valueMinTruncated + i + '' );
        //     }
        //
        //     const semanticsList: SemanticCriterion[] = [];
        //
        //     semanticValueArray.forEach( ( value ) =>
        //         semanticsList.push( {
        //             key: semanticFilter.key,
        //             operator: SemanticOperator.ContainsValue,
        //             value
        //         } )
        //     );
        //
        //     return semanticsList;
        //
        // }

        if ( semanticFilter.type === SemanticOperator.InList ) {
            // console.log( 'InList' );

            const valuesOfRange: string[] = [];

            let valueList: ClassifierTypeSemanticValue[] = [];

            if ( this.widgetProps.cartogramSource === CartogramSource.Layer ) {

                const vectorLayer = this.vectorLayerItem?.vectorLayer;
                if ( vectorLayer ) {
                    valueList = await vectorLayer.getClassifierSemanticValuesByKey( semanticFilter.key );
                }

            } else if ( this.widgetProps.cartogramSource === CartogramSource.File ) {

                const indexValue = this.csvEditor.title.findIndex( ( item ) =>
                    item && item.value === this.widgetProps.buildParametersOptionsTemp.id );

                const indexText = this.csvEditor.title.findIndex( ( item ) =>
                    item && item.value === this.widgetProps.semanticValueCol[ this.widgetProps.numberConnectedField ].name );

                if ( indexValue > -1 && indexText > -1 ) {
                    const cellsValue = this.csvEditor.readColumn( indexValue );

                    const cellsText = this.csvEditor.readColumn( indexText );

                    for ( let rowNumber = 0; rowNumber < this.csvEditor.rowCount; rowNumber++ ) {

                        const value = cellsValue[ rowNumber ] ? cellsValue[ rowNumber ]!.value : '';

                        const text = cellsText[ rowNumber ] ? cellsText[ rowNumber ]!.value.replaceAll( '"', '' ) : '';
                        const name = text;

                        valueList.push( { value, text, name } );

                    }

                }

            }

            valueList.forEach( ( item ) => {

                const value = +item.value;

                if ( this.widgetProps.rangeIndex !== this.widgetProps.buildParametersOptionsTemp.rangesCount - 1 ) {
                    if ( value >= semanticFilter.min && value < semanticFilter.max ) {
                        valuesOfRange.push( item.text );
                    }
                } else {
                    if ( value >= semanticFilter.min && value <= semanticFilter.max ) {
                        valuesOfRange.push( item.text );
                    }
                }

            } );

            const semanticsList: SemanticCriterion[] = [];

            valuesOfRange.forEach( ( value ) =>
                semanticsList.push( {
                    key: semanticFilter.key,
                    operator: SemanticOperator.InList,
                    value: [value]
                } )
            );

            return semanticsList;

        }

        let delta = 0;
        if ( semanticFilter.decimal !== 0 ) {
            delta = 1 / (10 ** semanticFilter.decimal);
        }

        let minValue = semanticFilter.min;
        if ( this.widgetProps.rangeIndex !== 0 ) {
            minValue = semanticFilter.min + delta / 2;
        }

        let maxValue = semanticFilter.max;
        if ( this.widgetProps.rangeIndex !== this.widgetProps.buildParametersOptionsTemp.rangesCount - 1 ) {
            maxValue = semanticFilter.max - delta / 2;
        }

        // console.log( 'InRange' );
        return [{
            key: semanticFilter.key,
            operator: SemanticOperator.InRange,
            value: [minValue, maxValue]
        }];

    }

    onSelectObjects( mapObject?: MapObject[] ) {
        super.onSelectObjects( mapObject );
        this.widgetProps.selectedObjectsLength = this.map.getSelectedObjects().length;
    }

    onAnyActionClose( actionId: string ) {
        super.onAnyActionClose( actionId );

        if ( actionId === SELECT_OBJECT_ACTION ) {
            this.widgetProps.selectActionStatus = false;
        }
    }

    private setAction( id: string, status: boolean ) {
        if ( status ) {
            this.doAction( id );
        } else {
            this.quitAction( id );
        }

        this.widgetProps.selectActionStatus = status;
    }

    protected destroy() {
        super.destroy();
        this.map.clearSelectedObjects();

        this.setAction( SELECT_OBJECT_ACTION, false );

        this.writeWorkspaceData( true );
    }

    /** Экспортировать список проектов в файл json
     * @method exportThematicProjectList
     * @private
     * @param name - имя файла
     * @param selectedList - выбранные проекты из списка
     */
    private exportThematicProjectList( name: string, selectedList: boolean[] ) {

        const projectList: ThematicProjectSettings[] = [];
        this.workspaceData.projects.forEach( ( item, index ) => {
            if ( selectedList[ index ] ) {
                projectList.push( item );
            }
        } );

        const record = JSON.stringify( projectList );
        const fileName = name + '.json';
        try {
            BrowserService.downloadContent(new Blob([record], { type: 'text' }), fileName);
        } catch(error) {
            this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
        }

    }

    /**
     * Обновить список выбранных объектов
     * @method updateMapObjectSelectedList
     * @async
     */
    async updateMapObjectSelectedList(): Promise<void> {

        const layerItem = this.layerItem;
        if ( layerItem ) {

            this.map.getSelectedObjects().forEach( ( item ) => {

                if ( item.mapId === this.widgetProps.activeLayerId ) {

                    const itemCopy = item.toJSON();

                    layerItem.featuresSelected.push( item );
                    this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].featuresSelected.push( itemCopy );
                }

            } );
            this.writeWorkspaceData( true );

            await this.generateCsvInit();

            layerItem.objectSemanticList.splice( 0 );
            this.csvEditor.title.forEach( ( colTitle ) => {
                if ( colTitle ) {
                    layerItem.objectSemanticList.push( colTitle );
                }
            } );

        }
    }

    get layerItem(): LayerItem | undefined {
        return this.widgetProps.layerList.find( layerItem => layerItem.id === this.widgetProps.activeLayerId );
    }

    get vectorLayerItem(): { vectorLayer: VectorLayer, url: string } | undefined {
        return this.vectorLayers.find( ( item ) =>
            (item.vectorLayer.idLayer === this.widgetProps.activeLayerId) && (item.url === this.widgetProps.activeServiceUrl) );
    }

    /**
     * Получить идентификатор исходного слоя
     * @method activeLayerIdInit
     * @private
     */
    private get activeLayerIdInit(): string {
        let result = '';
        const options = this.mapWindow.getMap().options.cartogram;
        if ( options && options.source ) {
            const source = options.source.find( source => source.url === this.widgetProps.activeServiceUrl );
            if ( source ) {
                result = (source.layers[ 0 ] && source.layers[ 0 ].id) || '';
            }
        }
        return result;
    }

    /**
     * Заполнить список слоёв
     * @method fillLayerList
     * @private
     */
    private fillLayerList(): void {

        this.widgetProps.virtualFolderList.splice( 1 );
        this.widgetProps.layerList.splice( 0 );

        const options = this.mapWindow.getMap().options.cartogram;
        if ( options && options.source ) {
            const currentSource = options.source.find( source => source.url === this.widgetProps.activeServiceUrl );
            if ( currentSource && currentSource.folders ) {
                this.widgetProps.virtualFolderList.push( ...currentSource.folders );

                currentSource.layers.forEach( layer => {
                    if ( this.widgetProps.layerList.findIndex( item => item.id === layer.id ) === -1 ) {
                        this.widgetProps.layerList.push( {
                            ...layer,
                            features: [],
                            featuresSelected: [],
                            objectSemanticList: [],
                        } );
                    }
                } );
            }
        }
    }

    private async openDataFile( hasTitleLine?: boolean, accept?: string[] ) {
        const fileResult = await BrowserService.openFileDialog( accept );

        if ( fileResult && fileResult[ 0 ] ) {
            const file = fileResult[ 0 ];
            return this.fromFile( file, hasTitleLine );
        }

        return Promise.reject( 'Cannot open file' );
    }

    private fromFile( file: File, hasTitle?: boolean ) {
        return new Promise<string | CsvEditor>( ( resolve, reject ) => {
            const reader = new FileReader();
            reader.readAsText( file );
            reader.onload = event => {
                if ( event.target && event.target.result ) {
                    const resultData = event.target.result as string;

                    const fileName = file.name.split( '.' );
                    const extension = fileName[ fileName.length - 1 ].toLowerCase();

                    if ( extension === 'json' ) {
                        resolve( resultData );
                    } else {
                        resolve( new CsvEditor( resultData, file.name, hasTitle ) );
                    }
                }
            };
            reader.onerror = () => {
                reject( 'Cannot read file' );
            };
        } );
    }

    /** Прочитать CSV-файл
     * @method readCsvFile
     * @private
     * @param reader
     */
    private readCsvFile( reader: CsvEditor ): void {
        this.csvEditor = reader;

        this.widgetProps.fileName = this.csvEditor.fileName;

        this.widgetProps.buildParameterList.splice( 0 );

        this.widgetProps.currentDelimiterId = 0;

        const statistic = this.csvEditor.getStatistic();

        let max = 0;
        this.widgetProps.delimiters.forEach( item => {
            const separatorDescription = statistic.find( separatorDescription => separatorDescription.separator === item.id );
            if ( separatorDescription ) {
                item.cols = separatorDescription.count;
                if ( item.cols > max ) {
                    this.csvEditor.separator = item.id;
                    max = item.cols;
                }
            }
        } );

        this.widgetProps.delimiters.sort( ( a, b ) => (a.cols > b.cols ? -1 : 1) );

        const project = this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ];
        if ( project ) {
            this.widgetProps.hasTitleLine = project.hasTitleLine;

            this.widgetProps.currentDelimiterId = this.widgetProps.delimiters.findIndex( ( item ) => item.id === project.delimiterId );

            this.csvEditor.separator = project.delimiterId;

            const content = this.csvEditor.content;
            const fileName = this.csvEditor.fileName;
            const separator = this.csvEditor.separator;

            this.csvEditor = new CsvEditor( content, fileName, project.hasTitleLine );
            this.csvEditor.separator = separator;

            this.semanticDataLinkColumn = project.semanticDataLinkColumn;

            project.buildParameterOptionsList.forEach( ( item ) => {
                this.widgetProps.buildParameterList.push( { id: item.id, text: item.text } );
            } );
        }

        this.parseFirstLine();
    }

    /**
     * Установить текущий проект
     * @method setCurrentProject
     * @private
     * @async
     * @param project - параметры проекта
     */
    private async setCurrentProject( project: ThematicProjectSettings ) {

        let itemIndex = this.widgetProps.serviceUrlList.findIndex( ( item ) => item === project.serviceUrl );
        if ( itemIndex > -1 ) {
            this.widgetProps.activeServiceUrl = this.widgetProps.serviceUrlList[ itemIndex ];
        } else {
            return Promise.reject( 'Open project error: Service URL not found!' );
        }

        itemIndex = this.widgetProps.layerList.findIndex( ( item ) => item.id === project.idLayer );
        if ( itemIndex > -1 ) {
            this.widgetProps.activeLayerId = this.widgetProps.layerList[ itemIndex ].id;
            this.addVectorLayer();
        } else {
            return Promise.reject( 'Open project error: Layer not found!' );
        }

        itemIndex = this.widgetProps.virtualFolderList.findIndex( ( item ) =>
            (item.alias === project.virtualFolder.alias) && (item.folder === project.virtualFolder.folder) );
        if ( itemIndex > -1 ) {
            this.widgetProps.currentVirtualFolderIndex = itemIndex;
        } else {
            this.widgetProps.currentVirtualFolderIndex = 0;
        }

        this.widgetProps.cartogramSource = project.cartogramSource;

        if ( this.widgetProps.cartogramSource === CartogramSource.Layer ) {
            this.widgetProps.bySelectedObjects = project.bySelectedObjects;

            if ( project.bySelectedObjects ) {
                const listItem = this.layerItem;
                const vectorLayer = this.vectorLayerItem?.vectorLayer;
                if ( listItem && vectorLayer ) {
                    project.featuresSelected.forEach( jsonFeature => listItem.featuresSelected.push( MapObject.fromJSON( vectorLayer, jsonFeature ) ) );
                }
            }

            await this.fillBuildParameterListFromLayer();
        } else {
            this.widgetProps.needToOpenCsvName = project.fileName as string;

            this.widgetProps.currentDelimiterId = project.delimiterId;
            this.widgetProps.hasTitleLine = project.hasTitleLine;
            this.semanticDataLinkColumn = project.semanticDataLinkColumn;
        }

    }

    /**
     * Разобрать первую строку CSV-файла
     * @method parseFirstLine
     * @private
     * @param titleRow - строка заголовка
     */
    private parseFirstLine( titleRow?: Cell[] ): void {
        if ( this.csvEditor ) {

            if ( !this.csvEditor.hasTitleLine ) {
                let colCount = 0;
                if ( !titleRow ) {
                    titleRow = [];
                    this.csvEditor.readLine( 0 ).forEach( ( item ) => {
                        if ( item ) {
                            const cell: Cell = {
                                type: 'String',
                                value: i18n.t( 'userthematic.Column' ) + ' ' + (colCount + 1),
                                col: colCount,
                                row: 0
                            };
                            titleRow!.push( cell );
                            colCount++;
                        }
                    } );
                }
                this.csvEditor.clearTitle();
                this.csvEditor.addTitleCells( titleRow );
            }

            this.widgetProps.semanticValueCol.splice( 0 );

            this.csvEditor.title.forEach( ( cell, index ) => {
                // const type = this.widgetProps.hasTitleLine ? this.csvEditor.getColumnType( index ) : cell?.type;
                const type = this.csvEditor.getColumnType( index );
                if ( cell && type !== undefined ) {
                    this.widgetProps.semanticValueCol.push( { name: cell.value, index, type } );
                }
            } );

            const firstStringCol = this.widgetProps.semanticValueCol.findIndex( ( item ) => item.type === 'String' );

            if ( firstStringCol > -1 ) {
                this.widgetProps.numberConnectedField = firstStringCol;

                this.semanticDataLinkColumn = firstStringCol;
            }

        }
    }

    /**
     * Обновить минимальное и максимальное значения параметра построения
     * @method updateBuildParameterMinMax
     * @private
     * @async
     */
    private async updateBuildParameterMinMax(): Promise<boolean> {

        this.widgetProps.minValue = 0;
        this.widgetProps.maxValue = 0;

        if ( this.widgetProps.cartogramSource === CartogramSource.Layer ) {

            const layerItem = this.layerItem;
            const vectorLayer = this.vectorLayerItem?.vectorLayer;

            if ( layerItem && vectorLayer ) {

                const objectSemanticList = layerItem.objectSemanticList;

                if ( objectSemanticList.length ) {

                    const semanticSelected = objectSemanticList.find( ( item ) => item.value === this.parameterId );

                    if ( semanticSelected ) {

                        this.widgetProps.minValue = Number.MAX_VALUE;
                        this.widgetProps.maxValue = -Number.MAX_VALUE;

                        const key = this.widgetProps.bySelectedObjects ? 'featuresSelected' : 'features';

                        for ( const feature of layerItem[ key ] ) {

                            const semantics = feature.getSemantics();

                            if ( semantics ) {
                                for ( const semantic of semantics ) {

                                    if ( semantic.name === semanticSelected.value ) {

                                        const valueList = await vectorLayer.getClassifierSemanticValuesByKey( semantic.key );
                                        const valueObject = valueList.find( ( value ) => value.text === semantic.value );

                                        if ( valueObject ) {
                                            semantic.value = valueObject.value;
                                        }

                                        const semanticValue = parseFloat( semantic.value );

                                        if ( !isNaN( semanticValue ) ) {
                                            this.widgetProps.minValue = Math.min( this.widgetProps.minValue, semanticValue );
                                            this.widgetProps.maxValue = Math.max( this.widgetProps.maxValue, semanticValue );
                                        }
                                    }

                                }

                            }

                        }

                    } else {
                        const list = this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].buildParameterOptionsList[ this.currentParameterIndex ].userThematicRangeList;
                        this.widgetProps.minValue = list[ 0 ].range.min;
                        this.widgetProps.maxValue = list[ list.length - 1 ].range.max;
                    }

                }

            }

        }

        if ( this.widgetProps.cartogramSource === CartogramSource.File ) {
            if ( this.csvEditor ) {

                const index = this.csvEditor.title.findIndex( ( item ) => item && (item.value === this.parameterId) );

                if ( index > -1 ) {

                    this.widgetProps.minValue = Number.MAX_VALUE;
                    this.widgetProps.maxValue = -Number.MAX_VALUE;

                    const cells = this.csvEditor.readColumn( index );

                    cells.forEach( cell => {

                        if ( cell && cell.type === 'Number' ) {

                            const value = parseFloat( cell.value );

                            if ( !isNaN( value ) ) {
                                this.widgetProps.minValue = Math.min( this.widgetProps.minValue, value );
                                this.widgetProps.maxValue = Math.max( this.widgetProps.maxValue, value );
                            }

                        }
                    } );
                }
            }
        }

        let flag = true;

        if ( isNaN( this.widgetProps.minValue ) || isNaN( this.widgetProps.maxValue ) || (this.widgetProps.minValue === Number.MAX_VALUE) || (this.widgetProps.maxValue === -Number.MAX_VALUE) ) {
            flag = false;
        }

        return flag;

    }

    /**
     * Сгенерировать исходный CSV-файл
     * @method generateCsvInit
     * @private
     * @async
     */
    private async generateCsvInit(): Promise<void> {

        const layerItem = this.layerItem;
        if ( layerItem && this.activeVectorLayer ) {

            const rscSemanticList = await this.getVectorLayerSemanticList();

            if ( this.widgetProps.bySelectedObjects ) {

                for ( let i = rscSemanticList.length - 1; i >= 0; i-- ) {

                    const semantic = rscSemanticList[ i ];

                    let found = false;

                    layerItem.featuresSelected.forEach( ( mapObject ) => {

                        const mapObjectSemantics = mapObject.getSemantics();

                        mapObjectSemantics.forEach( ( item ) => {

                            if ( item.key === semantic.shortname ) {
                                found = true;
                            }

                        } );

                    } );

                    if ( !found ) {
                        rscSemanticList.splice( i, 1 );
                    }

                }

            }

            this.csvEditor = new CsvEditor();

            this.csvEditor.columnCount = rscSemanticList.length + 1;

            let colCount = 0;
            const titleRow: Cell[] = [];

            titleRow.push( {
                type: 'String',
                value: 'GML identifier',
                col: colCount,
                row: 0
            } );
            colCount++;

            rscSemanticList.forEach( ( objectSemantic ) => {
                const cell: Cell = { type: 'String', value: objectSemantic.name, col: colCount, row: 0 };
                titleRow.push( cell );
                colCount++;
            } );

            let rowNumber = 0;

            const cellsList: Cell[] = [];

            const vectorLayer = this.vectorLayerItem?.vectorLayer;

            if ( vectorLayer ) {
                const key = this.widgetProps.bySelectedObjects ? 'featuresSelected' : 'features';
                for ( const feature of layerItem[ key ] ) {
                    const semantics = feature.getSemantics();
                    if ( semantics ) {
                        const cells: Cell[] = [];
                        let columnNumber = 0;

                        cells.push( {
                            type: 'String',
                            value: '' + feature.objectNumber || '',
                            col: columnNumber,
                            row: rowNumber
                        } );

                        columnNumber++;

                        for ( const objectSemantic of rscSemanticList ) {
                            const featureSemantic = semantics.find( ( semantic ) => semantic.key === objectSemantic.shortname );
                            if ( featureSemantic ) {

                                const valueList = await vectorLayer.getClassifierSemanticValuesByKey( featureSemantic.key );
                                const valueObject = valueList.find( ( value ) => value.text === featureSemantic.value );

                                if ( valueObject ) {
                                    featureSemantic.value = valueObject.value;
                                }

                                cells.push( {
                                    type: 'Number',
                                    value: featureSemantic.value,
                                    col: columnNumber,
                                    row: rowNumber
                                } );
                            }

                            columnNumber++;
                        }

                        if ( cells.length > 0 ) {
                            cells.forEach( cell => cellsList.push( cell ) );
                            rowNumber++;
                        }
                    }
                }
            }

            this.csvEditor.addCells( cellsList );

            this.parseFirstLine( titleRow );

        }

    }

    /**
     * Отправка запроса на создание тематической карты (картограммы)
     * @method sendRequest
     * @private
     * @param params - параметры построения
     */
    private sendRequest( params: BuildThematicMapParams ): void {

        this.widgetProps.isReadyCreateThematic = false;
        const layerItem = this.layerItem;
        if (!layerItem) {
            return;
        }

        const base64data = UserThematic.b64EncodeUnicode(params.csvEditorFiltered.toString());

        const url = this.widgetProps.activeServiceUrl;
        const requestService = RequestServices.retrieveOrCreate({ url }, ServiceType.REST);
        const uploadFileData = requestService.createThematicMapByCsv.bind(requestService);

        const filter = UserThematic.getUserThematicFilter(this.workspaceData.projects[this.widgetProps.projectSelectedIndex].buildParameterOptionsList);

        let SEMANTICKEY;
        let BYOBJECTKEY: '1' | undefined;

        if (this.widgetProps.cartogramSource === CartogramSource.File) {
            SEMANTICKEY = layerItem.semlink;
        } else {
            BYOBJECTKEY = '1';
        }

        const fileUploadCancellableRequest = RequestService.sendCancellableRequest( uploadFileData, {
            LAYER: layerItem.id,
            NUMBERCONNECTFIELD: '1',
            FILEDATA: base64data,
            FILTER: filter,
            SEMANTICKEY,
            BYOBJECTKEY,
            FILEDELIMETR: ';',
            SEMNUMBERFIELDLIST: params.csvEditorFiltered.getColumnNumbersList(),
            SAVEDPATH: params.path || undefined
        } );

        this.abortXhr = fileUploadCancellableRequest.abortXhr;

        fileUploadCancellableRequest.promise.then( async ( result ) => {

            if ( result.data && result.data.restmethod && 'createlayerlist' in result.data.restmethod ) {

                const layerCreated = result.data.restmethod.createlayerlist[ 0 ];

                if ( !params.path ) {
                    this.openLayer( layerCreated.id, params.alias );
                } else {
                    const virtualFolder = this.map.tiles.getVirtualFolderByFolderName(this.widgetProps.virtualFolderList[this.widgetProps.currentVirtualFolderIndex].folder, url);
                    if ( virtualFolder ) {
                        await virtualFolder.update();

                        const layer = virtualFolder.openLayer( { idLayer: layerCreated.id } );
                        if ( layer ) {
                            this.map.setLayerVisibility( layer, true );
                            //открыть Состав карт как после публикации
                            this.mapWindow.getTaskManager().openMapContent(layer.alias);
                        }
                    } else {
                        this.openLayer( layerCreated.id, params.alias );
                    }
                }
            }

        } ).catch( ( error ) => {
            this.map.writeProtocolMessage( {
                text: i18n.tc( 'userthematic.Cartogram' ),
                description: error,
                type: LogEventType.Error,
                display: true
            } );
        } ).finally( () => {
            this.widgetProps.isReadyCreateThematic = true;
            this.abortXhr = undefined;
        } );

    }

    /**
     * Открытие созданного слоя картограммы на клиенте
     * @method openLayer
     * @private
     * @param layerCreatedId - идентификатор созданного слоя
     * @param userAlias - имя созданного слоя
     */
    private openLayer( layerCreatedId: string, userAlias: string ): void {

        const url = this.widgetProps.activeServiceUrl
            + '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png'
            + '&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&LAYERS='
            + encodeURIComponent(layerCreatedId);

        const layerOpened = this.map.openLayer({
            id: Utils.generateGUID(),
            url: url,
            alias: userAlias,
            selectObject: true,
            legend: '*',
            export: ['sxf']
            // hidden: 1 // слой добавляется выключенным в папку Пользовательские слои
        });

        if (layerOpened) {

            // при выборе объектов чтобы отображалось название карты, добавим в список слой
            if (layerOpened.selectObject) {
                this.map.openVectorLayer({
                    id: layerOpened.xId,
                    url: url,
                    alias: layerOpened.alias,
                    selectObject: layerOpened.selectObject,
                    legend: '*'
                });
            }

            this.map.onLayerListChanged({
                id: layerOpened.xId,
                text: layerOpened.alias,
                nodeType: TreeNodeType.Layer,
                parentId: USER_LAYERS_FOLDER_ID
            });

            //открыть Состав карт как после публикации
            this.mapWindow.getTaskManager().openMapContent(layerOpened.alias);

        }
    }

    /**
     * Создание исходной структуры параметра построения
     * @method createBuildParameterOptions
     * @private
     * @param range - параметры градации
     */
    private async createBuildParameterOptions( range: { id: string, text: string, count: number } ): Promise<void> {

        this.widgetProps.rangeIndex = -1;

        const valueArray: number[] = [];

        if ( this.widgetProps.cartogramSource === CartogramSource.File ) {
            if ( this.csvEditor ) {
                const index = this.csvEditor.title.findIndex( ( item ) => item && (item.value === this.parameterId) );

                if ( index > -1 ) {

                    const cols = this.csvEditor.readColumn( index );

                    cols.forEach( col => {
                        if ( col && col.type === 'Number' ) {
                            valueArray.push( parseFloat( col.value ) );
                        }
                    } );
                }
            }
        } else if ( this.widgetProps.cartogramSource === CartogramSource.Layer ) {
            // fixme: - витает в мыслях, а может создавать CSV по всем семантикам? и работать одинаково?
            const layerItem = this.layerItem;
            const vectorLayer = this.vectorLayerItem?.vectorLayer;

            if ( layerItem && vectorLayer ) {

                const semanticSelected = layerItem.objectSemanticList.find( ( item ) => item.value === this.parameterId );

                if ( semanticSelected ) {

                    const key = this.widgetProps.bySelectedObjects ? 'featuresSelected' : 'features';

                    for ( const feature of layerItem[ key ] ) {
                        const semantics = feature.getSemantics();

                        if ( semantics ) {
                            for ( const semantic of semantics ) {
                                if ( semantic.name === semanticSelected.value ) {

                                    const valueList = await vectorLayer.getClassifierSemanticValuesByKey( semantic.key );
                                    const valueObject = valueList.find( ( value ) => value.text === semantic.value );

                                    if ( valueObject ) {
                                        semantic.value = valueObject.value;
                                    }

                                    const semanticValue = parseFloat( semantic.value );

                                    if ( !isNaN( semanticValue ) ) {
                                        valueArray.push( semanticValue );
                                    }
                                }
                            }
                        }
                    }

                }

            }

        }

        if ( valueArray.length ) {
            const thematicRangesData: ThematicRangesData = {
                ranges: [],
                rangesCount: range.count,
                valueArray,
                minValue: this.widgetProps.minValue,
                maxValue: this.widgetProps.maxValue
            };

            UserThematic.fillRanges( thematicRangesData );

            const buildParameterOptions: BuildParameterOptions = {
                id: range.id,
                text: range.text,
                userThematicRangeList: thematicRangesData.ranges
            };
            this.fillBuildParametersOptionsTemp( buildParameterOptions );
        }
    }

    /**
     * Заполнение структуры текущего параметра построения
     * @method fillBuildParametersOptionsTemp
     * @private
     * @param params - параметры заполнения
     */
    private fillBuildParametersOptionsTemp( params: BuildParameterOptions ): void {
        if ( params && params.userThematicRangeList && params.userThematicRangeList.length ) {
            this.widgetProps.buildParametersOptionsTemp.id = params.id;
            this.widgetProps.buildParametersOptionsTemp.text = params.text;
            this.widgetProps.buildParametersOptionsTemp.userThematicRangeList.splice( 0, this.widgetProps.buildParametersOptionsTemp.userThematicRangeList.length, ...params.userThematicRangeList );
            this.widgetProps.buildParametersOptionsTemp.rangesCount = this.widgetProps.buildParametersOptionsTemp.userThematicRangeList.length;
        }
    }

    /**
     * Редактирование стилей локализации для градации параметра построения
     * @method editRangeLocaleStyle
     * @private
     * @async
     * @param rangeIndex - индекс градации текущего параметра построения
     * @param locale - тип локализации
     */
    private async editRangeLocaleStyle( rangeIndex: number, locale: LOCALE ): Promise<void> {

        const styles = this.widgetProps.buildParametersOptionsTemp.userThematicRangeList[ rangeIndex ].styles;
        const icons = this.widgetProps.buildParametersOptionsTemp.userThematicRangeList[ rangeIndex ].icons;

        let sld: CommonServiceSVG[] = styles.line;
        if ( locale === LOCALE.Plane ) {
            sld = styles.polygon;
        }
        if ( locale === LOCALE.Point ) {
            sld = styles.marker;
        }

        try {
            const layerItem = this.layerItem;

            if ( !layerItem ) {
                const e = 'Layer ' + this.widgetProps.activeLayerId + ' not found';
                this.map.writeProtocolMessage( { text: e, type: LogEventType.Error } );
                return;
            }

            let id = layerItem.id;
            const layerInstance = this.map.tiles.getLayerByFilter({
                idLayer: layerItem.id,
                serviceUrl: this.widgetProps.activeServiceUrl
            });
            if (layerInstance) {
                id = layerInstance.id;
            }

            const result = await this.mapWindow.getTaskManager().callLegend( id, sld, locale ) as EditorLayoutDescription;
            if ( result ) {

                let type: 'line' | 'polygon' | 'marker';

                if ( result.objectDescription.local === LOCALE.Line ) {
                    type = 'line';
                    icons[ type ] = result.imageSrc ? result.imageSrc : result.icon || '';
                }

                if ( result.objectDescription.local === LOCALE.Plane ) {
                    type = 'polygon';
                    icons[ type ] = result.imageSrc ? result.imageSrc : result.icon || '';
                }

                if ( result.objectDescription.local === LOCALE.Point ) {
                    type = 'marker';

                    if ( result.objectDescription.sld && result.objectDescription.sld[ 0 ].type === 'PointSymbolizer' ) {
                        icons[ type ] = (result.objectDescription.sld[ 0 ] as SvgMarker).image || '';
                    } else {
                        icons[ type ] = result.imageSrc ? result.imageSrc : result.icon || '';
                    }
                }

                if ( result.objectDescription.sld ) {

                    sld.splice(0);

                    result.objectDescription.sld.forEach((item: CommonServiceSVG) => {
                        sld.push(item);
                    });

                }

            }
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({ text: gwtkError.message, type: LogEventType.Error });
        }

    }

    /**
     * Удалить из списка семантики, отсутствующшие у объектов текущего слоя
     * @method filterRscSemanticList
     * @private
     * @param rscSemantics - список семантик
     */
    private filterRscSemanticList( rscSemantics: RscSemantic[] ) {
        const layerItem = this.layerItem;
        if ( layerItem ) {

            for ( let k = rscSemantics.length - 1; k >= 0; k-- ) {

                let found = false;
                const rscSemanticShortname = rscSemantics[ k ].shortname;

                for ( let i = 0; i < layerItem.features.length; i++ ) {

                    const mapObjectSemantics = layerItem.features[ i ].getSemantics();

                    for ( let j = 0; j < mapObjectSemantics.length; j++ ) {

                        const mapObjectSemanticKey = mapObjectSemantics[ j ].key;

                        if ( mapObjectSemanticKey === rscSemanticShortname ) {
                            found = true;
                            break;
                        }

                    }

                    if ( found ) {
                        break;
                    }
                }

                if ( !found ) {
                    rscSemantics.splice( k, 1 );
                }

            }

        }

    }

    /**
     * Получение списка семантик типа число и типа классификатор для текущего слоя
     * @method getVectorLayerSemanticList
     * @async
     */
    async getVectorLayerSemanticList(): Promise<RscSemantic[]> {

        let rscSemanticList: RscSemantic[] = [];

        const vectorLayer = this.vectorLayerItem?.vectorLayer;

        if ( vectorLayer ) {
            rscSemanticList = await vectorLayer.getAllSemantics();

            if ( rscSemanticList ) {

                for ( let i = rscSemanticList.length - 1; i >= 0; i-- ) {

                    if ( rscSemanticList[ i ].type !== '1' && rscSemanticList[ i ].type !== '16' ) {
                        rscSemanticList.splice( i, 1 );
                    }

                }

            }
        }

        if ( !this.widgetProps.bySelectedObjects ) {
            this.filterRscSemanticList( rscSemanticList );
        }

        return rscSemanticList;
    }

    /**
     * Получение исходного списка критериев семантик типа число и типа классификатор
     * @method getSemanticCriterionListInit
     * @async
     */
    async getSemanticCriterionListInit(): Promise<SemanticCriterion[]> {
        const semanticsList: SemanticCriterion[] = [];

        const rscSemanticList = await this.getVectorLayerSemanticList();

        const vectorLayerItem = this.vectorLayerItem;

        for ( const item of rscSemanticList ) {
            if ( item.type === '1' ) {
                semanticsList.push( {
                    key: item.shortname,
                    operator: SemanticOperator.ContainsValue,
                    value: '*'
                } );
            }

            if ( item.type === '16' && vectorLayerItem ) {
                const values = await vectorLayerItem.vectorLayer.getClassifierSemanticValuesByKey( item.shortname );

                const valuesNames: string[] = [];
                values.forEach( ( value ) => {
                    valuesNames.push( value.name );
                } );

                semanticsList.push( {
                    key: item.shortname,
                    operator: SemanticOperator.InList,
                    value: valuesNames
                } );
            }
        }

        return semanticsList;
    }

    /**
     * Заполниение список объектов текущего слоя (запрос GETFEATURE)
     * @method fillLayerItemFeatures
     * @private
     * @async
     */
    private async fillLayerItemFeatures() {

        const layerItem = this.layerItem;
        if ( layerItem ) {

            this.map.clearActiveObject();
            this.map.clearSelectedObjects();

            const searchManager = this.mapWindow.getMap().searchManager;

            const vectorLayer = this.vectorLayerItem?.vectorLayer;

            searchManager.activateSource( SourceType.GISWebServiceSE, GISWebServiceSEMode.All, vectorLayer ? [vectorLayer] : undefined );
            searchManager.clearSearchCriteriaAggregator();
            const aggregator = searchManager.getSearchCriteriaAggregatorCopy();

            const semanticCriterionList = await this.getSemanticCriterionListInit();

            aggregator.removeCriterion( SearchCriterionName.Count );
            aggregator.removeCriterion( SearchCriterionName.StartIndex );
            if ( layerItem.keylist ) {
                const keyListSearchCriterion: KeyListSearchCriterion = aggregator.getKeyListSearchCriterion();
                keyListSearchCriterion.addValue( layerItem.keylist );
                aggregator.setKeyListSearchCriterion( keyListSearchCriterion );
            } else {
                aggregator.removeCriterion( SearchCriterionName.KeyList );
            }

            const semanticSearchCriterion = aggregator.getSemanticSearchCriterion();

            semanticCriterionList.forEach( ( item ) => semanticSearchCriterion.addSemanticCriterion( item ) );

            semanticSearchCriterion.setLogicalDisjunction( semanticCriterionList.length > 1 );

            this.mapWindow.getTaskManager().updateCriteriaAggregator( aggregator );
            searchManager.setSearchCriteriaAggregator( aggregator );

            const result = await searchManager.findNext();

            if ( result && result.mapObjects ) {

                result.mapObjects.forEach( ( item ) => {
                    if ( item.getSemantics().length ) {

                        if ( layerItem.keylist ) {

                            if ( item.key && layerItem.keylist.includes( item.key ) ) {
                                layerItem.features.push( item );
                            }

                        } else {
                            layerItem.features.push( item );
                        }
                    }

                } );

                this.showObjectsDownloadedCount( layerItem.features.length );

            }

        }

    }

    showObjectsDownloadedCount( count: number ) {
        window.setTimeout( () =>
            this.mapWindow.addSnackBarMessage( i18n.t( 'userthematic.Objects downloaded' ) + ': ' + count ), 1 );
    }

    /**
     * Заполнение отфильтрованного CSV-файла
     * @method fillCsvEditorFiltered
     * @private
     * @async
     */
    private async fillCsvEditorFiltered(): Promise<CsvEditor | undefined> {

        let csvEditorFiltered: CsvEditor | undefined;

        const colIndices = [this.semanticDataLinkColumn];
        this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].buildParameterOptionsList.forEach( ( param ) => {
            const index = this.csvEditor.title.findIndex( ( col ) => col && col.value === param.id );
            if ( index !== -1 ) {
                colIndices.push( index );
            }
        } );

        if ( colIndices.length > 1 ) {
            csvEditorFiltered = new CsvEditor();

            csvEditorFiltered.columnCount = colIndices.length;
            const semValues = await this.getSemValues();//fixme: to be deleted!!!

            for ( let row = 0; row < this.csvEditor.rowCount; row++ ) {
                const newRow: Cell[] = [];
                const rowNumber = csvEditorFiltered.rowCount;
                const cells = this.csvEditor.readLine( row );
                colIndices.forEach( col => {

                    let cell = cells[ col ];
                    if ( cell ) {
                        if ( col === this.semanticDataLinkColumn ) {
                            UserThematic.replaceBySemCode( cell, semValues );//fixme: to be deleted!!!
                        }
                        cell.row = rowNumber;
                        cell.col = newRow.length;
                    } else {
                        cell = { col: newRow.length, row: rowNumber, type: 'String', value: '' };
                    }

                    newRow.push( cell );
                } );

                if ( newRow.length > 0 ) {
                    csvEditorFiltered.addCells( newRow );
                }
            }

        } else {
            this.map.writeProtocolMessage( {
                text: i18n.t( 'userthematic.Semantics for linkage not found' ) + '',
                type: LogEventType.Error
            } );
        }
        return csvEditorFiltered;
    }

    /**
     * Заполнение списка параметров при построении по слою
     * @method fillBuildParameterListFromLayer
     * @private
     * @async
     */
    private async fillBuildParameterListFromLayer(): Promise<void> {

        this.setIsPanelReady( false );

        this.semanticDataLinkColumn = 0;
        this.widgetProps.buildParameterList.splice( 0 );

        const layerItem = this.layerItem;

        if ( layerItem && this.widgetProps.cartogramSource === CartogramSource.Layer ) {
            this.activeVectorLayer = new GISWebServiceVectorLayer( this.map, {
                url: this.widgetProps.activeServiceUrl + '?layer=' + encodeURIComponent(layerItem.id),
                alias: layerItem.alias,
                id: Date.now().toString()
            } );

            try {

                if ( this.widgetProps.bySelectedObjects ) {
                    await this.updateMapObjectSelectedList();
                } else {
                    if (!layerItem.features.length) {

                        await this.fillLayerItemFeatures();
                    }
                }

                await this.generateCsvInit();

            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({
                    text: i18n.tc('userthematic.Cartogram') + '. ' + i18n.tc('Error') + '.',
                    description: gwtkError.message,
                    type: LogEventType.Error
                });
            }

            layerItem.objectSemanticList.splice( 0 );
            this.csvEditor.title.forEach( ( colTitle ) => {
                if ( colTitle ) {
                    layerItem.objectSemanticList.push( colTitle );
                }
            } );

            const project = this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ];
            if ( project ) {
                project.buildParameterOptionsList.forEach( ( item ) => {
                    this.widgetProps.buildParameterList.push( { id: item.id, text: item.text } );
                } );
            }

        }

        this.setIsPanelReady( true );

    }

    /**
     * Сгенерировать данные для диаграммы
     * @method createDataDiagram
     * @private
     * @param paramIndex - индекс параметра построения
     */
    private createDataDiagram( paramIndex: number ): void {
        if ( paramIndex > -1 ) {
            const params = this.workspaceData.projects[ this.widgetProps.projectSelectedIndex ].buildParameterOptionsList[ paramIndex ];
            this.fillBuildParametersOptionsTemp( params );
        }

        const parameterId = this.widgetProps.buildParametersOptionsTemp.id;

        const colIndex = this.csvEditor.title.findIndex( col => col?.value === parameterId );

        if ( colIndex > -1 ) {
            const col = this.csvEditor.readColumn( colIndex );

            const valueArray: number[] = [];
            col.forEach( cell => {
                if ( cell && cell.value ) {
                    valueArray.push( parseFloat( cell.value ) );
                }
            } );

            const ranges: UserThematicRange[] = this.widgetProps.buildParametersOptionsTemp.userThematicRangeList;

            let chartDataArray: ThematicChartData[] = [];
            for (let rangeNumber = 0; rangeNumber < ranges.length; rangeNumber++) {

                const rangeItem = ranges[rangeNumber];

                const value = UserThematic.countRangeValues(valueArray, rangeItem.range, rangeNumber === ranges.length - 1);

                const label = i18n.tc('userthematic.From').toLowerCase() + ' ' + rangeItem.range.min.toFixed(2) + ' ' + i18n.tc('userthematic.To').toLowerCase() + ' ' + rangeItem.range.max.toFixed(2);

                const { color, icon } = UserThematic.createRangeIcons(rangeItem);

                chartDataArray.push({
                    value,
                    description: {
                        label,
                        title: '',
                        color,
                        icon
                    }
                });
            }

            this.widgetProps.thematicChartDataArray = { array: chartDataArray, title: parameterId };

        }
    }

    /**
     * Получить список семантик типа классификатор
     * @method getSemValues
     * @private
     * @async
     * @deprecated
     */
    private async getSemValues(): Promise<ClassifierTypeSemanticValue[] | undefined> {
        if ( this.layerItem ) {
            let layer = this.map.tiles.getLayerByxId(this.layerItem.id);

            if ( !layer ) {
                layer = new GISWebServiceVectorLayer( this.map, {
                    alias: '',
                    schemename: this.layerItem.id,
                    id: this.layerItem.id,
                    url: this.widgetProps.activeServiceUrl + '?layer=' + encodeURIComponent(this.layerItem.id),
                } );
            }
            return layer.classifier ? await layer.classifier.getClassifierSemanticValuesByKey( this.layerItem.semlink ) : undefined;
        }
    }

}
