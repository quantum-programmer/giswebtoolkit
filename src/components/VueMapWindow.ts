/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Абстрактный класс окна приложения                 *
 *                                                                  *
 *******************************************************************/

import {ForcedParameters, GwtkOptions, ToolbarGroupsOptions} from '~/types/Options';
import {LogEventType, SimpleJson} from '~/types/CommonTypes';
import MapWindow, {
    GwtkComponentPanel,
    InfoDialogProps,
    InputTextDialogProps,
    MapOverlayProps,
    RegistrationFunction,
    SaveObjectPanelProps,
    ColorScheme
} from '~/MapWindow';
import GwtkTaskContainer from '@/components/System/AppContainers/GwtkTaskContainer/GwtkTaskContainer';
import GwtkFooterPanel from '@/components/System/AppContainers/GwtkFooterPanel/GwtkFooterPanel';
import GwtkToolbar from '@/components/System/AppContainers/GwtkToolbar/GwtkToolbar';
import GwtkLeftToolbar from '@/components/System/AppContainers/GwtkLeftToolbar/GwtkLeftToolbar';
import GwtkBottomNavigation from '@/components/System/AppContainers/GwtkBottomNavigation/GwtkBottomNavigation';
import GwtkRightBar from '@/components/System/AppContainers/GwtkRightBar/GwtkRightBar';
import GwtkInfoDialog from '@/components/System/GwtkInfoDialog/GwtkInfoDialog';
import GwtkMapOverlay from '@/components/System/GwtkMapOverlay/GwtkMapOverlay';
import GwtkMapWindowFullScreen from '@/components/System/AppContainers/GwtkMapWindowFullScreen/GwtkMapWindowFullScreen';
import GwtkWindow from '@/components/System/AppContainers/GwtkWindow/GwtkWindow';
import {GwtkComponentDescriptionPropsData, GwtkMap} from '~/types/Types';
import {componentRegFunctions} from '@/.';
import GwtkInputTextDialog from '@/components/System/GwtkInputTextDialog/GwtkInputTextDialog';
import GwtkTopPanel from '@/components/System/AppContainers/GwtkTopPanel/GwtkTopPanel';
import GwtkMapSnackBar from '@/components/System/GwtkMapSnackBar/GwtkMapSnackBar';
import {
    ExternalData,
    FontSize,
    JSONData,
    ProjectSettings,
    StorageService,
    UserStorageService,
    ViewSettings
} from '~/utils/WorkspaceManager';
import GwtkMap3dTaskContainer from '@/components/System/AppContainers/GwtkMap3dTaskContainer/GwtkMap3dTaskContainer';
import {TranslateDescription} from '~/translate/Types';
import TranslateList from '~/translate/TTranslateList';
import {loadFromUrl} from '~/api/MapApi';
import IndexedDBService from '~/utils/IndexedDBService';
import i18n from '@/plugins/i18n';
import IndexedDBUserDataService from '~/utils/IndexedDBUserDataService';
import Vue from 'vue';
import {GwtkComponentSource} from '@/Types';
import VComp from '@vue/composition-api';
import GwtkSystem from '@/components/System';
import GwtkTaskBottomContainer from '@/components/System/AppContainers/GwtkTaskBottomContainer/GwtkTaskBottomContainer';
import DrawingManager from '@/components/DrawingManager';


Vue.config.productionTip = false;


export const ComponentNames: SimpleJson = {
    content: 'GwtkMapContent',
    search: 'GwtkSearch',
    clearselect: 'GwtkClearSelect',
    mapeditor: 'GwtkMapEditor',
    routecontrol: 'GwtkMapRoute',
    maplink: 'GwtkShare',
    searchSem: 'GwtkSearchBySemantics',
    areasearch: 'GwtkSearchArea',
    searchbyname: 'GwtkSearchByName',
    selectobjects: 'GwtkManualObjectHighlight',
    selectobjectsimage: 'GwtkHighlightByObjectImage',
    mapscale: 'GwtkMapScaleViewer',
    transitiontopoint: 'GwtkMovingToPoint',
    ruler: 'GwtkMeasurements',
    polygonarea: 'GwtkMeasurements',
    anglemeter: 'GwtkMeasurements',
    builderofzone: 'GwtkBuilderOfZone',
    viewoptions: 'GwtkMapOptions',
    geolocation: 'GwtkGeolocation',
    map2img: 'GwtkPrintMap',
    legend: 'GwtkMapLegend',
    objectPanel: 'GwtkMapObject',
    selectedObjectPanel: 'GwtkSelectedObjectsViewer',
    maplog: 'GwtkMapLog',
    buildheatmap: 'GwtkHeatMap',
    profileRelief: 'GwtkReliefLineDiagram',
    matrixcontrol: 'GwtkMatrixControl',
    userthematic: 'GwtkUserThematic',
    featuresamplescontrol: 'GwtkFeatureSamples',
    rosreestr: 'GwtkNspdObject',
    shutter: 'GwtkShutter',
    mapoverview: 'GwtkMapOverview',
    //---------------------------------
    zoomin: 'GwtkZoomIn',
    zoomout: 'GwtkZoomOut',
    mapdb: 'GwtkMapdb',
    documentviewer: 'GwtkDocumentViewer',
    editmode: 'GwtkSemanticEditMode',
    mapcalculations: 'GwtkMapCalculations',
    yandexpanorama: 'GwtkYandexPanorama',
    tooltip: 'GwtkMapObjectTooltip',
    framescalingin: 'GwtkFrameScalingIn',
    framescalingout: 'GwtkFrameScalingOut',
    myMaps: 'GwtkMyMaps',
    mapMarks: 'GwtkMapMarks',
    map3d: 'GwtkMap3d',
    floodZone: 'GwtkBuildFloodZone',
    backgroundLayers: 'GwtkBackgroundLayers',
};

const TREEVIEW_NODE_HEIGHT_REDUCED = '1.5rem';
const TREEVIEW_NODE_HEIGHT_DENSE_REDUCED = '1.5rem';
const TREEVIEW_NODE_CONTENT_BTN_HEIGHT_REDUCED = '24px';
const LIST_ITEM_MIN_HEIGHT_REDUCED = '1.5rem';
const LIST_ITEM_MIN_HEIGHT_DENSE_REDUCED = '1.5rem';
const LIST_ITEM_ICON_MARGIN_REDUCED = '0';
const LIST_ITEM_ICON_DENSE_MARGIN_REDUCED = '0';
const LIST_ITEM_ACTION_MARGIN_REDUCED = '0';
const LIST_ITEM_ICON_BTN_HEIGHT_REDUCED = '1.5rem';
const LIST_ITEM_PADDING_TOP_REDUCED = '2px';
const LIST_ITEM_DENSE_PADDING_TOP_REDUCED = '2px';
const LIST_ITEM_PADDING_BOTTOM_REDUCED = '2px';
const LIST_ITEM_DENSE_PADDING_BOTTOM_REDUCED = '2px';
const EXPANSION_PANEL_HEADER_HEIGHT_REDUCED = '40px';
const TEXT_FIELD_FILLED_FULL_WIDTH_OUTLINED_SINGLE_LINE_SLOT_MIN_HEIGHT_REDUCED = '1.5rem';
const TEXT_FIELD_SOLO_DENSE_CONTROL_MIN_HEIGHT_REDUCED = '1.5rem';
const V_TEXT_FIELD_ICON_SIZE_REDUCED = '1rem';
const TEXT_FIELD_LABEL_TOP_REDUCED = '4px';
const PX_2_REDUCED = '4px';
const PY_2_REDUCED = '4px';
const V_BTN_HEIGHT_DEFAULT_REDUCED = '26px';
const V_BTN_HEIGHT_SMALL_REDUCED = '26px';
const GWTK_BTN_HEIGHT_ICON_SMALL_REDUCED = '1.25rem';
const V_TEXT_FIELD_APPEND_INNER_ICON_SIZE_REDUCED = '14px';
const V_BTN_ICON_SIZE_REDUCED = '16px';
const V_CHIP_HEIGHT_REDUCED = '24px';
const CARD_SUBTITLE_PADDING_REDUCED = '4px';
const EDITOR_ICON_WIDTH_REDUCED = '2rem';
const V_PROGRESS_CIRCULAR_SIZE_REDUCED = '14px';
const CONTAINER_PADDING_REDUCED = '4px 12px';
const CONTAINER_SEPARATOR_MARGIN_TOP_REDUCED = '4px';
const V_DATA_TABLE_TD_PADDING_REDUCED = '0 6px';
const SCALE_LINE_TOP_REDUCED = '70%';
const SCALE_LINE_MARGIN_REDUCED = '0';
const GWTK_USER_THEMATIC_IMAGE_TYPE_HEIGHT_REDUCED = '1.5em';
const BTN_TOGGLE_BTN_HEIGHT_REDUCED = '1.5em';
const V_SELECT_OUTLINED_SELECTIONS_PADDING_TOP_REDUCED = '4px 0';
const V_SELECT_OUTLINED_DENSE_SELECTIONS_PADDING_TOP_REDUCED = '0px';
const CHECKBOX_DENSE_MARGIN_TOP_REDUCED = '0px';
const ROW_DENSE_PADDING_REDUCED = '2px';
const GWTK_TASK_CARD_TITLE_HEIGHT_REDUCED = '38px';
const GWTK_PAGE_TOOLBAR_HEIGHT_REDUCED = '32px';
const SELECT_DENSE_SELECTIONS_MARGIN_REDUCED = '0 4px 0 0';
const PREVIEW_IMAGE_SIZE_REDUCED = '64px';

/**
 * Окно приложения
 * @abstract
 * @class MapWindow
 */
export default abstract class VueMapWindow extends MapWindow {

    protected map!: GwtkMap;

    protected mainContainer: Vue;

    protected readyPromise: Promise<void>;

    get ready() {
        return this.readyPromise;
    }

    get i18n() {
        return i18n;
    }

    drawingManager?: DrawingManager;
    /**
     * Список функций создания компонентов
     * @private
     * @readonly
     * @property componentFunctionList {SimpleJson<RegistrationFunction>}
     */
    protected componentFunctionList!: SimpleJson<RegistrationFunction>;

    protected constructor(htmlElementId: string, options: GwtkOptions, ...appParams: any[]) {
        super();
        Vue.use(VComp);

        //Регистрируем компоненты
        Vue.use(GwtkSystem);

        this.mainContainer = this.createMainContainer(htmlElementId, ...appParams);

        this.readyPromise = this.startApp(options, options.layerprojection);
    }

    protected abstract createMainContainer(htmlElementId: string, ...appParams: any[]): Vue;

    protected async init(options: GwtkOptions, projectionList?: SimpleJson<TranslateDescription>, storage?:{storageService?: StorageService, userStorageService?: UserStorageService}): Promise<void> {

        if (projectionList) {
            for (const projectionId in projectionList) {
                TranslateList.addTranslateDescription(projectionId, projectionList[projectionId]);
            }
        }
        const currentOptions = options;
        loadFromUrl(currentOptions);
        i18n.locale = currentOptions.locale;

        let componentData, projectSettings, viewSettings, jsonData;

        const userName = currentOptions.username || 'ANONYMOUS';
        const storageService = storage?.storageService || new IndexedDBService(userName, currentOptions.id);

        try {
            componentData = await storageService.getAllComponentsData();
        } catch (e) {
            console.log(e);
        }

        try {
            projectSettings = await storageService.getProjectSettings().catch(e => console.warn(e)) as ProjectSettings;
        } catch (e) {
            console.log(e);
        }

        try {
            viewSettings = await storageService.getViewSettings().catch(e => console.warn(e)) as ViewSettings;
        } catch (e) {
            console.log(e);
        }

        try {
            jsonData = await storageService.getJsonData().catch(e => console.warn(e)) as JSONData;
        } catch (e) {
            console.log(e);
        }

        // await storageService.close();

        const map = this.createMap(currentOptions, {
            componentData,
            projectSettings,
            viewSettings,
            jsonData,
            storageService,
            userStorageService:storage?.userStorageService
        });

        Reflect.defineProperty(this, 'map', {
            configurable: true,
            enumerable: true,
            get: function () {
                return map;
            }
        });

        this.onMapCreated(currentOptions.controls);
        this.drawingManager = new DrawingManager(this);
        this.ready.then(() => {
            if (window.location.href.length > 2048) {
                this.map.writeProtocolMessage({
                    text: i18n.tc('phrases.Error The length of the URL exceeds 2048 characters'),
                    description: i18n.tc('phrases.Error The length of the URL exceeds 2048 characters'),
                    type: LogEventType.Error,
                    display: true
                });
            } else if (currentOptions.forcedParams) {
                this.applyForcedParams(currentOptions.forcedParams);
            }
        });
    }

    protected getComponentGroups(toolbarGroups?: ToolbarGroupsOptions): string[][] {
        const componentGroups = [];

        if (toolbarGroups) {
            if (toolbarGroups.length > 0) {
                for (let i = 0; i < toolbarGroups.length; i++) {
                    const groupItems = toolbarGroups[i].items;
                    const groupComponentNames: string[] = [];
                    for (let j = 0; j < groupItems.length; j++) {
                        const functionName = ComponentNames[groupItems[j]];
                        if (functionName) {
                            const componentName = (ComponentNames[groupItems[j]] + '.main').toLowerCase();
                            if (!groupComponentNames.includes(componentName)) {
                                groupComponentNames.push(componentName);
                            }
                        }
                    }
                    componentGroups.push(groupComponentNames);
                }
            }
        }

        return componentGroups;
    }

    protected async startApp(options: GwtkOptions, projectionList?: SimpleJson<TranslateDescription>, userStorageService?: UserStorageService): Promise<void> {

        loadFromUrl(options);

        this.resetComponents();

        if (this.map) {
            this.map.destroy();
        }

        const userName = options.username || 'ANONYMOUS';
        const userSettingsDB = userStorageService || new IndexedDBUserDataService(userName);
        await userSettingsDB.setActiveProject({number: +options.id});
        await userSettingsDB.close();

        return this.init(options, projectionList);
    }

    protected createMap(options: GwtkOptions, externalData: ExternalData): GwtkMap {
        const mapDiv = this.mainContainer.$refs.mapDiv as HTMLDivElement;
        if (!mapDiv || !mapDiv.id) {
            throw Error('No Map div container!');
        }
        const mapDivId = mapDiv.id;
        return new GWTK.Map(mapDivId, options, externalData);
    }

    protected async loadPlugins() {

    }

    protected async onMapCreated(controls: GwtkOptions['controls']) {
        super.onMapCreated();


        this.initTasksFunctions();
        await this.loadPlugins();
        this.initComponents(controls);

        this.getToolbarPanel().updateGroupList(this.getComponentGroups(this.map.options.toolbarGroups));

        this.getTaskManager().restartActiveTask();
    }

    abstract getToolPanel(): GwtkTaskContainer;

    abstract getBottomPanel(): GwtkTaskBottomContainer;

    abstract getFooterPanel(): GwtkFooterPanel;

    abstract getMap3dPanel(): GwtkMap3dTaskContainer;

    abstract getToolbarPanel(): GwtkToolbar;

    abstract getLeftToolbarPanel(): GwtkLeftToolbar;

    abstract getBottomNavigationBarPanel(): GwtkBottomNavigation;

    abstract getRightBarPanel(): GwtkRightBar;

    abstract getMobileTopPanel(): GwtkTopPanel | undefined;

    abstract getSnackBarManager(): GwtkMapSnackBar;

    abstract getInfoDialog(): GwtkInfoDialog;

    abstract getInputTextDialog(): GwtkInputTextDialog;

    abstract getMapOverlay(): GwtkMapOverlay;

    abstract getMapWindowFullScreen(): GwtkMapWindowFullScreen;

    abstract getWindow(): GwtkWindow;

    /**
     * Заполнение списка задач
     * @private
     * @method initTasksFunctions
     */
    private initTasksFunctions(): void {

        if (componentRegFunctions) {
            if (!this.componentFunctionList) {
                this.componentFunctionList = {};
            }
            for (const key in componentRegFunctions) {
                const component = (componentRegFunctions as SimpleJson<RegistrationFunction>)[key];
                if (component) {
                    this.componentFunctionList[key] = component;
                }
            }
        }
    }

    hideElements() {
        this.getWindow().setVisibility(false);
        this.getToolPanel().setVisibility(false);
        this.getBottomPanel().setVisibility(false);
    }

    showElements() {
        this.getWindow().setVisibility(true);
        this.getToolPanel().setVisibility(true);
        this.getBottomPanel().setVisibility(true);
    }

    /**
     * Удалить элемент
     * @method deleteItem
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    deleteItem(propsData: GwtkComponentDescriptionPropsData) {
        super.deleteItem(propsData);

        window.setTimeout(
            () => {
                this.getMapWindowFullScreen().sidebarIsActive = this.getToolPanel().value;
            }, 300
        );
    }

    /**
     * Отобразить окно информации
     * @method showInfo
     * @param infoParams {InfoDialogProps} Параметры окна
     */
    showInfo(infoParams: InfoDialogProps) {
        this.getInfoDialog().setInfoParams(infoParams);
    }

    /**
     * Отобразить окно ввода текста
     * @method showInputText
     * @param inputTextParams {InfoDialogProps} Параметры окна
     */
    showInputText(inputTextParams: InputTextDialogProps): Promise<string> {
        return this.getInputTextDialog().setInputTextDialogParams(inputTextParams);
    }

    /**
     * Отобразить окно ожидания
     * @method showOverlay
     * @param overlayParams {MapOverlayProps} Параметры окна
     */
    showOverlay(overlayParams?: MapOverlayProps) {
        this.getMapOverlay().setOverlayParams(overlayParams);
    }

    /**
     * Отобразить панель Сохранения объекта
     * @method showSaveObjectPanel
     * @param saveObjectPanelProps {SaveObjectPanelProps} Параметры панели
     */
    showSaveObjectPanel(saveObjectPanelProps: SaveObjectPanelProps) {
        const mobileTopPanel = this.getMobileTopPanel();
        if (mobileTopPanel) {
            mobileTopPanel.setParams(saveObjectPanelProps);
        }
    }

    /**
     * Создать компонент
     * @method createComponent
     * @param destination {GwtkComponentPanel} Контейнер для компонента
     * @param name {string} Название компонента
     * @param propsData {GwtkComponentDescriptionPropsData} Параметры компонента
     */
    protected createComponent(destination: GwtkComponentPanel, name: string, propsData: GwtkComponentDescriptionPropsData) {
        // добавление в контейнер
        this.getContainer(destination).addComponent(name, propsData);

        if (destination === GwtkComponentPanel.WINDOW_PANEL) {

            this.getMapWindowFullScreen().sidebarIsActive = this.getWindow().value;

        } else {

            this.getMapWindowFullScreen().sidebarIsActive = this.getToolPanel().value;
        }
    }

    /**
     * Удалить компонент
     * @method deleteComponent
     * @param destination {GwtkComponentPanel} Контейнер для компонента
     * @param description {GwtkComponentDescriptionPropsData} Параметры компонента
     */
    protected deleteComponent(destination: GwtkComponentPanel, description: GwtkComponentDescriptionPropsData) {
        // добавление в контейнер
        this.getContainer(destination)?.removeComponent(description);
    }


    /**
     * Отобразить компонент
     * @method showComponent
     * @param destination {GwtkComponentPanel} Контейнер компонента
     * @param description {GwtkComponentDescriptionPropsData} Параметры компонента
     */
    protected showComponent(destination: GwtkComponentPanel, description: GwtkComponentDescriptionPropsData) {
        // добавление в контейнер
        this.getContainer(destination)?.showComponent(description);
    }

    /**
     * Получить контейнер
     * @method getContainer
     * @param destination {GwtkComponentPanel} Название контейнера
     * @return {GwtkCommonContainer|undefined} Контейнер
     */
    private getContainer(destination: GwtkComponentPanel) {
        let container;
        switch (destination) {
            case GwtkComponentPanel.TOOLBAR:
                container = this.getToolbarPanel();
                break;
            case GwtkComponentPanel.LEFT_TOOLBAR:
                container = this.getLeftToolbarPanel();
                break;
            case GwtkComponentPanel.MAP_WINDOW_FULL_SCREEN:
                container = this.getMapWindowFullScreen();
                break;
            case GwtkComponentPanel.BOTTOM_NAVIGATION_BAR:
                container = this.getBottomNavigationBarPanel();
                break;
            case GwtkComponentPanel.RIGHT_BAR:
                container = this.getRightBarPanel();
                break;
            case GwtkComponentPanel.FOOTER_PANEL:
                container = this.getFooterPanel();
                break;
            case GwtkComponentPanel.WINDOW_PANEL:
                container = this.getWindow();
                break;
            case GwtkComponentPanel.BOTTOM_PANEL:
                container = this.getBottomPanel();
                break;
            case GwtkComponentPanel.MAP3D_PANEL:
                container = this.getMap3dPanel();
                break;
            case GwtkComponentPanel.SIDEBAR:
            default:
                container = this.getToolPanel();
                break;
        }
        return container;
    }


    /**
     * Закрыть окно ожидания
     * @method removeOverlay
     */
    removeOverlay() {
        this.getMapOverlay().closeOverlay();
    }


    /**
     * Добавить всплывающее сообщение
     * @method addSnackBarMessage
     * @param message {string} Текст сообщения
     * @param [params] {object} Параметры сообщения
     */
    addSnackBarMessage(message: string, params?:{timeout?: number;type?:LogEventType;}) {
        this.getSnackBarManager().addMessage(message, params);
    }

    /**
     * Инициализировать компоненты
     * @protected
     * @method setComponents
     * @param controls
     */
    initComponents(controls: GwtkOptions['controls']) {
        const controlsList: string[] = [];

        if (controls[0] === '*') {
            const names = Object.values(ComponentNames);
            for (const name of names) {
                if (!controlsList.includes(name)) {
                    controlsList.push(name);
                }
            }
        } else {
            for (const key of controls) {

                switch (key) {
                    case 'scaleupdown':
                        controlsList.push('GwtkZoomIn');
                        controlsList.push('GwtkZoomOut');
                        break;
                    case 'scalebyrect':
                        controlsList.push('GwtkFrameScalingIn');
                        controlsList.push('GwtkFrameScalingOut');
                        break;
                    default:
                        if (ComponentNames[key]) {
                            const name = ComponentNames[key];
                            if (!controlsList.includes(name)) {
                                controlsList.push(name);
                            }
                        }
                }
            }
        }

        if (!controlsList.includes('GwtkMapObjectTooltip')) {
            controlsList.push('GwtkMapObjectTooltip');
        }

        if (!controlsList.includes('GwtkMapLegend')) {
            controlsList.push('GwtkMapLegend');
        }

        if (!controlsList.includes('GwtkDocumentViewer')) {
            controlsList.push('GwtkDocumentViewer');
        }

        if (!controlsList.includes('GwtkClearSelect')) {
            controlsList.push('GwtkClearSelect');
        }

        if (!controlsList.includes('GwtkMapLog')) {
            controlsList.push('GwtkMapLog');
        }

        for (let i = 0; i < controlsList.length; i++) {
            const name = controlsList[i];
            if (name in this.componentFunctionList) {
                this.componentFunctionList[name](this);
            }
        }

        this.getMap().initOldComponents();   //TODO: to be deleted
    }

    registerComponent(name: string, source: GwtkComponentSource) {
        // регистрация во Vue
        Vue.component(name, source);
    }

    /**
     * Сброс состояния компонентов
     * @method resetComponents
     */
    resetComponents() {
        this.getToolbarPanel().removeAllComponents();
        this.getLeftToolbarPanel().removeAllComponents();
        this.getBottomNavigationBarPanel().removeAllComponents();
        this.getRightBarPanel().removeAllComponents();
        this.getFooterPanel().removeAllComponents();
        this.getTaskManager()?.destroy();
    }

    applyColorScheme(colorScheme: ColorScheme) {
        const styleJson: SimpleJson = {};

        const primary = colorScheme.primary;
        const secondary = colorScheme.secondary;
        // const background = colorScheme.background;

        let r, g, b, a = 1;

        if (primary && primary.indexOf('#') === 0) {
            r = parseInt(primary.substr(1, 2), 16);
            g = parseInt(primary.substr(3, 2), 16);
            b = parseInt(primary.substr(5, 2), 16);

            // styleJson[ '--color-blue-05' ] = `rgba(${Math.round( r - r * 0.25 )},${Math.round( g - g * 0.25 )},${Math.round( b - b * 0.25 )},${a})`;
            styleJson['--v-primary-base'] = createRGBAString(r, g, b, a);
            styleJson['--v-primary-lighten1'] = createRGBAString(r + (255 - r) * 0.25, g + (255 - g) * 0.25, b + (255 - b) * 0.25, a);
            styleJson['--v-primary-lighten2'] = createRGBAString(r + (255 - r) * 0.50, g + (255 - g) * 0.50, b + (255 - b) * 0.50, a);
            styleJson['--v-primary-lighten3'] = createRGBAString(r + (255 - r) * 0.75, g + (255 - g) * 0.75, b + (255 - b) * 0.75, a);
            styleJson['--v-primary-lighten4'] = createRGBAString(r + (255 - r) * 0.85, g + (255 - g) * 0.85, b + (255 - b) * 0.85, a);
            styleJson['--v-primary-lighten5'] = createRGBAString(r + (255 - r) * 0.95, g + (255 - g) * 0.95, b + (255 - b) * 0.95, a);

            styleJson['--v-primary-darken1'] = createRGBAString(r - r * 0.21, g - g * 0.19, b - b * 0.23, a);
            styleJson['--v-primary-darken2'] = createRGBAString(r - r * 0.36, g - g * 0.38, b - b * 0.34, a);
            styleJson['--v-primary-darken3'] = createRGBAString(r - r * 0.51, g - g * 0.57, b - b * 0.45, a);
            styleJson['--v-primary-darken4'] = createRGBAString(r - r * 0.66, g - g * 0.76, b - b * 0.56, a);
        }

        if (secondary && secondary.indexOf('#') === 0) {
            r = parseInt(secondary.substr(1, 2), 16);
            g = parseInt(secondary.substr(3, 2), 16);
            b = parseInt(secondary.substr(5, 2), 16);

            styleJson['--v-secondary-base'] = createRGBAString(r, g, b, a);
            styleJson['--v-secondary-lighten1'] = createRGBAString(r + (255 - r) * 0.17, g + (255 - g) * 0.17, b + (255 - b) * 0.17, a);
            styleJson['--v-secondary-lighten2'] = createRGBAString(r + (255 - r) * 0.34, g + (255 - g) * 0.34, b + (255 - b) * 0.34, a);
            styleJson['--v-secondary-lighten3'] = createRGBAString(r + (255 - r) * 0.51, g + (255 - g) * 0.51, b + (255 - b) * 0.51, a);
            styleJson['--v-secondary-lighten4'] = createRGBAString(r + (255 - r) * 0.68, g + (255 - g) * 0.68, b + (255 - b) * 0.68, a);
            styleJson['--v-secondary-lighten5'] = createRGBAString(r + (255 - r) * 0.85, g + (255 - g) * 0.85, b + (255 - b) * 0.85, a);

            styleJson['--v-secondary-darken1'] = createRGBAString(r - r * 0.32, g - g * 0.32, b - b * 0.32, a);
            styleJson['--v-secondary-darken2'] = createRGBAString(r - r * 0.64, g - g * 0.64, b - b * 0.64, a);
            styleJson['--v-secondary-darken3'] = createRGBAString(0, 0, 0, a);
            styleJson['--v-secondary-darken4'] = createRGBAString(0, 0, 0, a);
        }

        // if ( background ) {
        //     styleJson[ '--color-white' ] = background;
        // }


        let str = '';
        for (let styleJsonKey in styleJson) {
            str += `\n\t${styleJsonKey}:${styleJson[styleJsonKey]};`;
        }

        if (str) {
            const textNode = document.createTextNode(`\n:root {${str} \n}`);

            let style = document.getElementById('gwtk-user-styles');
            if (!style) {
                style = document.createElement('style');
                style.setAttribute('id', 'gwtk-user-styles');
            } else {
                style.innerHTML = '';
            }

            style.appendChild(textNode);
            document.body.appendChild(style);
        }

        function createRGBAString(r: number, g: number, b: number, a = 1): string {
            r = Math.min(Math.max(Math.round(r), 0), 255);
            g = Math.min(Math.max(Math.round(g), 0), 255);
            b = Math.min(Math.max(Math.round(b), 0), 255);
            a = Math.min(Math.max(a, 0), 1);

            return `rgba(${r},${g},${b},${a})`;
        }
    }

    setFontSize(size: FontSize) {
        const r = document.querySelector<HTMLElement>(':root');
        if (r) {
            r.style.setProperty('--main-font-size', size);
        }
    }

    setDarkTheme(value: boolean): void {
        this.mainContainer.$vuetify.theme.dark = value;
    }

    setReduceSizeInterface(value: boolean): void {
        const r = document.querySelector<HTMLElement>(':root');
        if (r) {
            if (value) {
                // Установка новых значений
                r.style.setProperty('--treeview-node-height', TREEVIEW_NODE_HEIGHT_REDUCED);
                r.style.setProperty('--treeview-node-height-dense', TREEVIEW_NODE_HEIGHT_DENSE_REDUCED);
                r.style.setProperty('--treeview-node-content-btn-height', TREEVIEW_NODE_CONTENT_BTN_HEIGHT_REDUCED);
                r.style.setProperty('--list-item-min-height', LIST_ITEM_MIN_HEIGHT_REDUCED);
                r.style.setProperty('--list-item-min-height-dense', LIST_ITEM_MIN_HEIGHT_DENSE_REDUCED);
                r.style.setProperty('--list-item-icon-margin', LIST_ITEM_ICON_MARGIN_REDUCED);
                r.style.setProperty('--list-item-icon-dense-margin', LIST_ITEM_ICON_DENSE_MARGIN_REDUCED);
                r.style.setProperty('--list-item-dense-icon-margin', LIST_ITEM_ICON_MARGIN_REDUCED);
                r.style.setProperty('--list-item-action-margin', LIST_ITEM_ACTION_MARGIN_REDUCED);
                r.style.setProperty('--list-item-icon-btn-height', LIST_ITEM_ICON_BTN_HEIGHT_REDUCED);
                r.style.setProperty('--list-item-padding-top', LIST_ITEM_PADDING_TOP_REDUCED);
                r.style.setProperty('--list-item-dense-padding-top', LIST_ITEM_DENSE_PADDING_TOP_REDUCED);
                r.style.setProperty('--list-item-padding-bottom', LIST_ITEM_PADDING_BOTTOM_REDUCED);
                r.style.setProperty('--list-item-dense-padding-bottom', LIST_ITEM_DENSE_PADDING_BOTTOM_REDUCED);
                r.style.setProperty('--expansion-panel-header-height', EXPANSION_PANEL_HEADER_HEIGHT_REDUCED);
                r.style.setProperty('--text-field-filled-full-width-outlined-single-line-slot-min-height', TEXT_FIELD_FILLED_FULL_WIDTH_OUTLINED_SINGLE_LINE_SLOT_MIN_HEIGHT_REDUCED);
                r.style.setProperty('--text-field-solo-dense-control-min-height', TEXT_FIELD_SOLO_DENSE_CONTROL_MIN_HEIGHT_REDUCED);
                r.style.setProperty('--v-text-field-icon-size', V_TEXT_FIELD_ICON_SIZE_REDUCED);
                r.style.setProperty('--text-field-label-top', TEXT_FIELD_LABEL_TOP_REDUCED);
                r.style.setProperty('--px-2', PX_2_REDUCED);
                r.style.setProperty('--py-2', PY_2_REDUCED);
                r.style.setProperty('--v-btn-height--default', V_BTN_HEIGHT_DEFAULT_REDUCED);
                r.style.setProperty('--v-btn-height--small', V_BTN_HEIGHT_SMALL_REDUCED);
                r.style.setProperty('--gwtk-btn-height-icon-small', GWTK_BTN_HEIGHT_ICON_SMALL_REDUCED);
                r.style.setProperty('--v-text-field-append-inner-icon-size', V_TEXT_FIELD_APPEND_INNER_ICON_SIZE_REDUCED);
                r.style.setProperty('--v-btn-icon-size', V_BTN_ICON_SIZE_REDUCED);
                r.style.setProperty('--v-chip-height', V_CHIP_HEIGHT_REDUCED);
                r.style.setProperty('--card-subtitle-padding', CARD_SUBTITLE_PADDING_REDUCED);
                r.style.setProperty('--editor-icon-width', EDITOR_ICON_WIDTH_REDUCED);
                r.style.setProperty('--v-progress-circular-size', V_PROGRESS_CIRCULAR_SIZE_REDUCED);
                r.style.setProperty('--container-padding', CONTAINER_PADDING_REDUCED);
                r.style.setProperty('--container-separator-margin-top', CONTAINER_SEPARATOR_MARGIN_TOP_REDUCED);
                r.style.setProperty('--v-data-table-td-padding', V_DATA_TABLE_TD_PADDING_REDUCED);
                r.style.setProperty('--scale-line-top', SCALE_LINE_TOP_REDUCED);
                r.style.setProperty('--scale-line-margin', SCALE_LINE_MARGIN_REDUCED);
                r.style.setProperty('--gwtk-user-thematic-image-type-height', GWTK_USER_THEMATIC_IMAGE_TYPE_HEIGHT_REDUCED);
                r.style.setProperty('--btn-toggle-btn-height', BTN_TOGGLE_BTN_HEIGHT_REDUCED);
                r.style.setProperty('--v-select-outlined-selections-padding-top', V_SELECT_OUTLINED_SELECTIONS_PADDING_TOP_REDUCED);
                r.style.setProperty('--v-select-outlined-dense-selections-padding-top', V_SELECT_OUTLINED_DENSE_SELECTIONS_PADDING_TOP_REDUCED);
                r.style.setProperty('--checkbox-dense-margin-top', CHECKBOX_DENSE_MARGIN_TOP_REDUCED);
                r.style.setProperty('--row-dense-padding', ROW_DENSE_PADDING_REDUCED);
                r.style.setProperty('--gwtk-task-card-title-height', GWTK_TASK_CARD_TITLE_HEIGHT_REDUCED);
                r.style.setProperty('--gwtk-page-toolbar-height', GWTK_PAGE_TOOLBAR_HEIGHT_REDUCED);
                r.style.setProperty('--select-dense-selections-margin', SELECT_DENSE_SELECTIONS_MARGIN_REDUCED);
                r.style.setProperty('--preview-image-size', PREVIEW_IMAGE_SIZE_REDUCED);
            } else {
                // Удаление установленных значений
                r.style.removeProperty('--treeview-node-height');
                r.style.removeProperty('--treeview-node-height-dense');
                r.style.removeProperty('--treeview-node-content-btn-height');
                r.style.removeProperty('--list-item-min-height');
                r.style.removeProperty('--list-item-min-height-dense');
                r.style.removeProperty('--list-item-icon-margin');
                r.style.removeProperty('--list-item-icon-dense-margin');
                r.style.removeProperty('--list-item-action-margin');
                r.style.removeProperty('--list-item-icon-btn-height');
                r.style.removeProperty('--list-item-padding-top');
                r.style.removeProperty('--list-item-dense-padding-top');
                r.style.removeProperty('--list-item-padding-bottom');
                r.style.removeProperty('--list-item-dense-padding-bottom');
                r.style.removeProperty('--list-item-densepadding-bottom');
                r.style.removeProperty('--expansion-panel-header-height');
                r.style.removeProperty('--text-field-filled-full-width-outlined-single-line-slot-min-height');
                r.style.removeProperty('--text-field-solo-dense-control-min-height');
                r.style.removeProperty('--v-text-field-icon-size');
                r.style.removeProperty('--text-field-label-top');
                r.style.removeProperty('--px-2');
                r.style.removeProperty('--py-2');
                r.style.removeProperty('--v-btn-height--default');
                r.style.removeProperty('--v-btn-height--small');
                r.style.removeProperty('--gwtk-btn-height-icon-small');
                r.style.removeProperty('--v-text-field-append-inner-icon-size');
                r.style.removeProperty('--v-btn-icon-size');
                r.style.removeProperty('--v-chip-height');
                r.style.removeProperty('--card-subtitle-padding');
                r.style.removeProperty('--editor-icon-width');
                r.style.removeProperty('--v-progress-circular-size');
                r.style.removeProperty('--container-padding');
                r.style.removeProperty('--container-separator-margin-top');
                r.style.removeProperty('--v-data-table-td-padding');
                r.style.removeProperty('--scale-line-top');
                r.style.removeProperty('--scale-line-margin');
                r.style.removeProperty('--gwtk-user-thematic-image-type-height');
                r.style.removeProperty('--btn-toggle-btn-height');
                r.style.removeProperty('--v-select-outlined-selections-padding-top');
                r.style.removeProperty('--v-select-outlined-dense-selections-padding-top');
                r.style.removeProperty('--checkbox-dense-margin-top');
                r.style.removeProperty('--row-dense-padding');
                r.style.removeProperty('--gwtk-task-card-title-height');
                r.style.removeProperty('--gwtk-page-toolbar-height');
                r.style.removeProperty('--select-dense-selections-margin');
                r.style.removeProperty('--preview-image-size');
            }
        }
    }

    loadFromUrl(url: string) {
        const search = url.split('?')[1];
        const urlParams = ('?' + search).substring(1).split('&');
        const forcedParams: ForcedParameters = {};

        const forcedParametersKeyList: string[] = [
            'b',
            'l',
            'z',
            'layers',
            'rotate',
            'incline',
            'models3d',
            'projectid',
            'activetask',
            'idLayerObjectNumberKey',
            'objcard',
            'objcardact',
            'mapmark',
            'objectname'
        ];

        for (let i = 0; i < urlParams.length; i++) {
            const [key, value] = urlParams[i].split('=');
            if (!key || !forcedParametersKeyList.includes(key)) {
                continue;
            }
            forcedParams[key as keyof ForcedParameters] = value === undefined ? '' : value;
        }

        this.map.options.forcedParams = forcedParams;

        this.applyForcedParams(forcedParams);
    }

    protected applyForcedParams(forcedParams: ForcedParameters) {
        this.map.applyForcedParams(forcedParams);

        if (forcedParams.mapmark) {
            const coords = forcedParams.mapmark.split(',');
            if (coords?.length === 2 && coords.every(coord => !isNaN(Number(coord)))) {
                this.drawingManager?.drawPoint(coords as [string, string], true);
            }
        }
    }
}
