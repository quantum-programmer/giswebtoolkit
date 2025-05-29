/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Менеджер задач и обработчиков                    *
 *                                                                  *
 *******************************************************************/

import MapWindow, {ColorScheme, GwtkComponentPanel} from '~/MapWindow';
import Action, {ACTION_CANCEL, ACTION_COMMIT} from '~/taskmanager/Action';
import Task from '~/taskmanager/Task';
import KeyboardDevice, {KeyboardCode, KeyboardDeviceEvent, KeyboardEventType} from '~/input/KeyboardDevice';
import {MouseDeviceEvent, MouseEventType} from '~/input/MouseDevice';
import {EditorLayoutDescription, GwtkMap, GwtkMapLegendItemReduced, RoutePoint} from '~/types/Types';
import {LOCALE, LogEventType, LogMessage, PluginDescription, SimpleJson} from '~/types/CommonTypes';
import SVGrenderer from '~/renderer/SVGrenderer';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import MapObject from '~/mapobject/MapObject';
import {CommonServiceSVG} from '~/utils/GeoJSON';
import {
    FontSize,
    PROJECT_SETTINGS_ACTIVE_TASK_LIST,
    PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG,
    PROJECT_SETTINGS_USER_INTERFACE_FONT_SIZE,
    PROJECT_SETTINGS_USER_INTERFACE_PRIMARY_COLOR,
    PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG,
    PROJECT_SETTINGS_USER_INTERFACE_SECONDARY_COLOR,
    VIEW_SETTINGS_PARAMS3D,
    WorkspaceValues
} from '~/utils/WorkspaceManager';
import {BrowserService} from '~/services/BrowserService';
import Layer from '~/maplayers/Layer';
import TransactionLog, {TransactionData} from '~/utils/TransactionLog';
import Utils from '~/services/Utils';
import RestService from '~/services/RequestServices/RestService/RestService';
import Mediator from '~/3d/engine/utils/Mediator';
import Trigger from '~/taskmanager/Trigger';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';


export enum ViewDocumentMode {
    bim = 'bim',
    image = 'image',
    video = 'video',
    file = 'file',
    empty = 'empty'
}

enum LEGEND_SHOW_MODE {
    VisibilityControlMode = 'VisibilityControlMode',
    ItemSelectionMode = 'ItemSelectionMode',
    ReadOnlyMode = 'ReadOnlyMode',
    LayerStyleSettingsMode = 'LayerStyleSettingsMode'
}

type LayerCommand = 'opacitychanged' | 'visibilitychanged';

export type DataChangedEvent =
    { type: 'refreshmap' }
    | { type: 'content' }
    | { type: 'layercommand'; layer?: Layer; command: LayerCommand; }
    | { type: 'legend' }
    | { type: 'resetlayersvisibility' }


type LayerIdLegendMode = { layerId: string, mode: LEGEND_SHOW_MODE, sld?: CommonServiceSVG[], type?: LOCALE, selectedLegendObjectList?: GwtkMapLegendItemReduced[] }

const SELECT_MODE = 'gwtkmapobject.selectmode';
const SELECT_CURRENT_MAPOBJECT_CONTENT = 'gwtkmapobject.selectcurrentobjectcontent';
const HIGHLIGHT_OBJECT = 'gwtkmapobject.highlightobject';
const SINGLE_MODE_FLAG = 'gwtkmapobject.singlemodeflag';
const UPDATE_MAP_OBJECTS_COUNT = 'gwtkmapobject.mapobjectscount';
const FIT_MAP_TO_CLUSTER = 'gwtkmapobject.fitmaptocluster';
const SET_CLUSTER_MAP_OBJECTS_LIST = 'gwtkmapobject.setclustermapobjectslist';
const CHANGE_CURRENT_MAP_LAYER_ID = 'gwtkmaplegend.changecurrentmaplayerid';
const LEGEND_COMPONENT = 'gwtkmaplegend.main';
const MAP_LOG_COMPONENT = 'gwtkmaplog.main';
const SET_LEGEND_ITEM_SELECTION_MODE = 'gwtkmaplegend.setlegenditemselectionmode';
const LOCK_LAYER = 'gwtkmaplegend.locklayer';

const ON_LOAD_BIM = 'GwtkDocumentViewer.onloadbim';
const ON_LOAD_IMAGE = 'GwtkDocumentViewer.onloadimage';
const ON_LOAD_VIDEO = 'GwtkDocumentViewer.onloadvideo';
const OPEN_FILE_DIALOG = 'GwtkDocumentViewer.openfiledialog';

const MAP_EDITOR_COMPONENT = 'gwtkmapeditor.main';
export const MAP_OBJECT_PANEL_COMPONENT = 'gwtkmapobject.main';

const MAP_CONTENT_COMPONENT = 'gwtkmapcontent.main';
const ON_INPUT_SEARCH = 'gwtkmapcontent.oninputsearch';

export const START_ON_PREVIEW_MODE = 'GwtkDocumentViewer.startonpreviewmode';
export const START_ON_SEMANTIC_MODE = 'GwtkDocumentViewer.startonsemanticMode';

export const DOCUMENT_VIEWER = 'gwtkdocumentviewer.main';
export const SELECT_OBJECTS_VIEWER = 'gwtkselectedobjectsviewer.main';
const DRAWING_TASK = 'gwtkdraw.main';

const ADD_ROUTE_POINTS = 'gwtkmaproute.addroutepoints';
export const MAP_ROUTE_COMPONENT = 'gwtkmaproute.main';

export const MAP_3D_MODE = 'gwtkmap3d.main';

const CLEAR_SELECT_COMPONENT = 'gwtkclearselect.main';

const SELECT_LAYOUT_LAYER = 'gwtkmapeditor.selectlayoutlayer';

export enum MapObjectPanelState {
    showObjects,
    showInfo,
    showEditor,
    showSelectedObjects
}

export interface TaskConstructor<T extends MapWindow = MapWindow> {
    new(mapWindow: T, id: string): Task;
}

export type TaskDescription = {
    active: boolean;
    enabled: boolean;
    getConstructor(): Promise<TaskConstructor>;
    id: string;
    minServiceVersion?: string;
    options: {
        storedData?: boolean;
        className?: string;
        icon?: string;
        title?: string;
        pureTask?: boolean;
        specifiedToolbar?: GwtkComponentPanel;
        helpPage?: string;
    };
    restartable?: boolean;
};


type WorkspaceData = {
    transactionLogData: {
        undoList: TransactionData[];
        redoList: TransactionData[];
    }
};

const TASK_MANAGER_ID = 'gwtktaskmanager.main';


/**
 * Менеджер задач и обработчиков
 * @class TaskManager
 */
export default class TaskManager {

    /**
     * Экземпляр карты
     * @private
     * @readonly
     * @property map {GwtkMap}
     */
    private readonly map: GwtkMap;

    /**
     * Активный блокирующий обработчик
     * @private
     * @property activeBlockingAction {Action}
     */
    private activeBlockingAction?: Action<any>;

    /**
     * Флаг запуска события onDrag во внутреннем компоненте
     * @private
     * @property internalDragStartFlag {boolean}
     */
    private internalDragStartFlag: boolean = false;

    /**
     * Реестр задач
     * @private
     * @readonly
     * @property taskRegistry {SimpleJson<TaskDescription>}
     */
    private readonly taskRegistry: SimpleJson<TaskDescription> = {};

    private readonly taskLauncherRegistry: SimpleJson<{ taskId: string, description: TaskDescription }> = {};

    /**
     * Список активных задач
     * @private
     * @readonly
     * @property activeTaskList {Task[]}
     */
    private readonly activeTaskList: Task[] = [];

    private readonly transactionLog: TransactionLog;

    private workspaceData: WorkspaceData = {
        transactionLogData: {
            undoList: [],
            redoList: []
        }
    };

    private readonly triggerList: Map<string, Trigger> = new Map<string, Trigger>();

    addTrigger(trigger: Trigger) {
        this.triggerList.set(trigger.id, trigger);
    }

    removeTrigger(id: string) {
        this.triggerList.delete(id);
    }

    getTransactionsCount(xId?: string) {
        return this.transactionLog.getTransactionsCount(xId);
    }

    getUndoneTransactionsCount() {
        return this.transactionLog.getUndoneTransactionsCount();
    }

    getLastTransaction(xId?: string) {
        return this.transactionLog.getLastTransaction(xId);
    }

    getLastUndoneTransaction() {
        return this.transactionLog.getLastUndoneTransaction();
    }

    addTransaction(transactionData: TransactionData) {
        this.transactionLog.doTransaction(transactionData);
        this.onTransactionLogChanged();
        this.updateWorkspaceData();
    }

    addTransactionToRedoList(transactionData: TransactionData) {
        this.transactionLog.undoTransaction(transactionData);
        this.onTransactionLogChanged();
        this.updateWorkspaceData();
    }

    updateLayerTransactions(layerXId: string, transactionNumbers: string[]) {
        this.transactionLog.updateLayerTransactions(layerXId, transactionNumbers);
        this.onTransactionLogChanged();
        this.updateWorkspaceData();
    }

    updateWorkspaceData() {
        this.workspaceData.transactionLogData = this.transactionLog.toJSON();

        this.writeWorkspaceData(true);
    }

    private readWorkspaceData() {
        const workspaceData = (this.map.workspaceManager.getComponentData(TASK_MANAGER_ID) as WorkspaceData | undefined);
        if (workspaceData) {
            this.workspaceData = workspaceData;
        }
    }

    private writeWorkspaceData(forceDBUpdateFlag?: boolean) {
        this.map.workspaceManager.setComponentData(TASK_MANAGER_ID, this.workspaceData);
    }


    /**
     * Флаг активности блокирующего обработчика
     * @property isBlockingActionActive {boolean}
     */
    get isBlockingActionActive() {
        return this.activeBlockingAction !== undefined;
    }

    /**
     * @constructor TaskManager
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     */
    constructor(private readonly mapWindow: MapWindow) {
        this.map = mapWindow.getMap();

        this.readWorkspaceData();

        const layersXIdList = this.map.vectorLayers.map(item => item.xId);
        this.transactionLog = new TransactionLog(
            this.workspaceData.transactionLogData,
            layersXIdList
        );

        this.updateWorkspaceData();

        this.map.inputDevice.subscribe(MouseEventType.Click, this.onMouseClick.bind(this));
        // this.map.inputDevice.subscribe( MouseEventType.ContextMenu, this.onContextMenu.bind( this ) );
        // this.map.inputDevice.subscribe( MouseEventType.CursorMove, this.onCursorMove.bind( this ) );
        this.map.inputDevice.subscribe(MouseEventType.DelayedClick, this.onMouseDelayedClick.bind(this));
        this.map.inputDevice.subscribe(MouseEventType.DoubleClick, this.onMouseDoubleClick.bind(this));
        // this.map.inputDevice.subscribe( MouseEventType.MapDrag, this.onMapDrag.bind( this ) );
        this.map.inputDevice.subscribe(MouseEventType.MouseDown, this.onMouseDown.bind(this));
        // this.map.inputDevice.subscribe( MouseEventType.MouseLeave, this.onMouseLeave.bind( this ) );
        this.map.inputDevice.subscribe(MouseEventType.MouseMove, this.onMouseMove.bind(this));
        this.map.inputDevice.subscribe(MouseEventType.MouseUp, this.onMouseUp.bind(this));
        // this.map.inputDevice.subscribe( MouseEventType.RightClick, this.onRightClick.bind( this ) );
        this.map.inputDevice.subscribe(MouseEventType.Wheel, this.onMouseWheel.bind(this));

        KeyboardDevice.subscribe(KeyboardEventType.KeyUp, this.onKeyUp.bind(this));
        KeyboardDevice.subscribe(KeyboardEventType.KeyDown, this.onKeyDown.bind(this));

        this.map.on({type: 'layerlistchanged', target: 'map'}, () => this.onDataChanged({type: 'content'}));

        this.map.on({type: 'refreshmap', target: 'map'}, () => this.onDataChanged({type: 'refreshmap'}));

        this.map.on({type: 'prerender', target: 'map'}, () => this.onPreRender(this.map.vectorRenderer));
        this.map.on({type: 'postrender', target: 'map'}, () => this.onPostRender(this.map.vectorRenderer));

        this.map.on({
            type: 'registerplugin',
            target: 'map'
        }, (event) => this.onPluginRegistration(event.plugin));


        this.map.on({
            type: 'logmessage',
            target: 'map'
        }, (event) => {
            if (event.message.display && event.message.text) {
                this.showSnackBarMessage(event.message);
            }
        });

        this.map.on({type: 'searchcomplete', target: 'map'}, () => this.onSearchResultChanged());
        this.map.on({type: 'searchreasultsforceupdate', target: 'map'}, () => this.showObjectPanel());

        this.map.on({
            type: 'workspacechanged',
            target: 'map'
        }, (event) => this.onWorkspaceChanged(event.item.key));

        this.map.on({type: 'workspacereset', target: 'map'}, () => this.onWorkspaceReset());

        this.map.on({
            type: 'updatecriteriaaggregator',
            target: 'map'
        }, (event) => this.updateCriteriaAggregator(event.item));

        this.map.on({type: 'selectobject', target: 'map'}, () => this.onSelectObject());

        this.map.on({type: 'selectobjects', target: 'map'}, () => this.onSelectObjects());

        this.map.on({type: 'visibilitychanged', target: 'map'},
            (event) => this.onDataChanged({
                type: 'layercommand',
                layer: this.map.tiles.getLayerByxId(event.maplayer.id),
                command: 'visibilitychanged'
            }));

        this.map.on({type: 'layercommand', target: 'map'},
            (event) => this.onDataChanged({
                type: 'layercommand',
                layer: event.maplayer.layer,
                command: event.maplayer.act
            }));

        Mediator.subscribe('changeLightSource', () =>
            this.onWorkspaceChanged(VIEW_SETTINGS_PARAMS3D));

        Mediator.subscribe('changeViewMode', () =>
            this.onWorkspaceChanged(VIEW_SETTINGS_PARAMS3D));

        this.resetTheme();
        this.resetSizeInterface();
        this.resetColorTheme();
        this.resetFontSize();
        window.addEventListener('dragover', this.onDragOver.bind(this), true);
        window.addEventListener('dragleave', this.onDragLeave.bind(this), true);
        window.addEventListener('drop', this.onDrop.bind(this));

    }

    /**
     * Деструктор
     * @method destroy
     */
    destroy() {
        this.deactivateBlockingActionOld();
        this.destroyBlockingAction();

        for (const key in this.taskRegistry) {
            const task = this.taskRegistry[key];
            if (task.active) {
                this.detachTask(task.id, true);
            }

            const taskLauncherButton = this.taskLauncherRegistry[task.id];
            if (taskLauncherButton) {
                this.mapWindow?.deleteItem(taskLauncherButton);
            }
        }

    }

    /**
     * Зарегистрировать задачу
     * @method registerTask
     * @param taskDescription {TaskDescription} Описание задачи
     */
    registerTask(taskDescription: TaskDescription) {
        this.taskRegistry[taskDescription.id] = taskDescription;

        if (!taskDescription.options.pureTask) {
            // Создание пункта меню
            const propsData = {
                taskId: taskDescription.id,
                description: taskDescription
            };
            this.taskLauncherRegistry[taskDescription.id] = propsData;
            this.mapWindow.createToolbarItem(propsData, taskDescription.options.specifiedToolbar);
        }
    }

    /**
     * Запустить задачу
     * @method createTask
     * @param id {string} Идентификатор задачи
     * @return {Promise<true|undefined>} Флаг успешного запуска задачи
     */
    async createTask(id: string): Promise<true | undefined> {
        if (!this.mapWindow) {
            return;
        }

        // // Выключаем активную задачу
        // for ( const taskId in this.taskRegistry ) {
        //     if ( this.taskRegistry[ taskId ].active ) {
        //         this.detachTask( taskId );
        //     }
        // }

        const taskDescription = this.taskRegistry[id];
        if (taskDescription) {
            if (taskDescription.minServiceVersion) {
                const service = new RestService({url: this.map.options.url});
                const serviceVersion = +await service.getVersion();
                const neededVersion = +Utils.getServiceVersionValue(taskDescription.minServiceVersion);
                if (serviceVersion < neededVersion) {
                    const text = this.map.translate('The component requires a service with a version higher than')
                        + ' ' + taskDescription.minServiceVersion;
                    this.map.writeProtocolMessage({
                        text,
                        type: LogEventType.Error,
                        display: true
                    });
                    return;
                }
            }

            const activeTaskIndex = this.activeTaskList.findIndex(task => task.id === id);
            if (activeTaskIndex === -1) {
                this.mapWindow.showOverlay();
                const task = new (await taskDescription.getConstructor())(this.mapWindow, id);
                this.removeOverlayPanel();
                task.createTaskPanel();
                task.registerHelp();
                taskDescription.active = true;
                this.activeTaskList.push(task);
                task.setup();
                if (taskDescription.restartable) {
                    this.updateProjectTaskList();
                }
                return true;
            }
        }
    }

    /**
     * Остановить задачу
     * @method detachTask
     * @param id {string} Идентификатор задачи
     * @param force {boolean} Флаг принудительного завершения
     * @return {true|undefined} Флаг успешной остановки задачи
     */
    detachTask(id: string, force: boolean = false): true | undefined {
        const activeTaskIndex = this.activeTaskList.findIndex(task => task.id === id);
        if (activeTaskIndex !== -1) {
            const taskDescription = this.taskRegistry[id];
            if (activeTaskIndex === this.activeTaskList.length - 1 || force) {
                const [task] = this.activeTaskList.splice(activeTaskIndex, 1);
                if (task) {
                    task.quit();
                    if (taskDescription) {
                        taskDescription.active = false;
                        if (taskDescription.restartable) {
                            this.updateProjectTaskList();
                        }
                    }
                    return true;
                }
            } else {
                this.makeTaskActive(id);
            }
        }
    }

    /**
     * Сделать задачу активной
     * @method makeTaskActive
     * @param id {string} Идентификатор задачи
     */
    makeTaskActive(id: string) {
        const activeTaskIndex = this.activeTaskList.findIndex(task => task.id === id);
        const taskDescription = this.taskRegistry[id];
        const [activeTask] = this.activeTaskList.splice(activeTaskIndex, 1);
        activeTask.showComponent();
        this.activeTaskList.push(activeTask);
        if (taskDescription) {
            if (taskDescription.restartable) {
                this.updateProjectTaskList();
            }
        }
    }

    getDrawingTask(): Task | undefined {
        return this.activeTaskList.find(task => task.id === DRAWING_TASK);
    }

    /**
     * Запрос активной задачи
     * @method getActiveTask
     * @param id {string} Идентификатор задачи
     */
    getActiveTask(id: string): Task | undefined {
        return this.activeTaskList.find(task => task.id === id);
    }

    clearTaskWorkspaceData(id: string) {
        const task = this.activeTaskList.find(task => task.id === id);
        if (task) {
            task.clearTaskWorkspaceData();
        }
    }

    setInternalDragStartFlag(value: boolean) {
        this.internalDragStartFlag = value;
    }

    getTaskDescription(id: string) {
        return this.taskRegistry[id];
    }

    /**
     * Обновить список активных задач
     * @private
     * @method updateProjectTaskList
     */
    private updateProjectTaskList() {
        let topActiveTaskId = '';
        for (let i = this.activeTaskList.length - 1; i >= 0; i--) {
            const task = this.activeTaskList[i];
            const taskDescription = this.taskRegistry[task.id];
            if (taskDescription && taskDescription.restartable) {
                topActiveTaskId = task.id;
                break;
            }
        }

        this.map.workspaceManager.setValue(PROJECT_SETTINGS_ACTIVE_TASK_LIST, topActiveTaskId);
    }

    restartActiveTask() {
        // Если установлены параметры 3D режима, то отображаем карту в 3D
        if (this.map.options.params3d && this.map.options.params3d.active) {
            this.toggleTaskOrAction(MAP_3D_MODE);
        } else {
            const taskId = this.map.workspaceManager.getValue(PROJECT_SETTINGS_ACTIVE_TASK_LIST);
            if (taskId) {
                this.createTask(taskId);
            }
        }

    }

    /**
     * Запустить блокирующий обработчик
     * @method doBlockingAction
     * @param actionId {string} Идентификатор обработчика
     * @param taskId {string} Идентификатор задачи
     * @return {boolean} Флаг успешной операции
     */
    doBlockingAction(actionId: string, taskId: string) {
        this.deactivateBlockingActionOld();
        const task = this.activeTaskList.find(task => task.id === taskId);
        if (task) {
            const action = task.getAction(actionId);
            if (action) {
                if (this.cancelBlockingAction()) {
                    this.setupBlockingAction(action);
                    return true;
                }
            }
        } else {
            console.warn(`Can not find task by id ${taskId}`);
        }
    }

    /**
     * Выполнить инициализацию блокирующего обработчика
     * @method setupBlockingAction
     * @param action {Action} Блокирующий обработчик
     */
    private setupBlockingAction(action: Action<any>) {
        action.setTaskAction();

        this.activeBlockingAction = action;

        action.setup();

        this.onAnyActionOpen(action.id);
    }

    /**
     * Остановить блокирующий обработчик
     * @method cancelBlockingAction
     * @param [actionId] {string} Идентификатор обработчика
     * @return {boolean} Флаг успешной операции
     */
    cancelBlockingAction(actionId?: string) {
        if (!this.activeBlockingAction) {
            return true;
        }

        if (!actionId || this.activeBlockingAction.id === actionId) {
            if (this.activeBlockingAction.canClose()) {
                return this.destroyBlockingAction();
            }
        }
    }

    /**
     * Принудительно остановить блокирующий обработчик
     * @method destroyBlockingAction
     * @param [actionId] {string} Идентификатор обработчика
     * @return {boolean} Флаг успешной операции
     */
    destroyBlockingAction(actionId?: string) {
        if (!this.activeBlockingAction) {
            return true;
        }

        if (!actionId || this.activeBlockingAction.id === actionId) {
            this.activeBlockingAction.clearTaskActon();

            const id = this.activeBlockingAction.id;
            this.activeBlockingAction.destroy();
            this.activeBlockingAction = undefined;

            this.onAnyActionClose(id);
            return true;
        }
    }

    storedData(taskId: string): boolean {
        return this.taskRegistry[taskId]?.options.storedData || false;
    }

    /**
     * Проверить наличие страницы справки
     * @method checkHelpPage
     * @param taskId {string} Идентификатор задачи
     * @return {boolean} Флаг наличия страницы справки
     */
    checkHelpPage(taskId: string): boolean {
        return !!this.getHelpPage(taskId);
    }

    /**
     * Получить идентификатор страницы справки
     * @private
     * @method getHelpPage
     * @param taskId {string} Идентификатор задачи
     * @return {string | undefined} Идентификатор страницы справки
     */
    private getHelpPage(taskId: string): string | undefined {
        return this.taskRegistry[taskId]?.options.helpPage;
    }

    /**
     * Открыть страницу справки
     * @method checkHelpPage
     * @param taskId {string} Идентификатор задачи
     * @return {boolean} Флаг наличия страницы справки
     */
    callHelp(taskId: string): void {
        const pageId = this.getHelpPage(taskId);
        if (pageId) {
            try {
                BrowserService.openLink(`https://help.gisserver.ru/v15/russian/giswebserverse/${pageId}.html`);
            } catch (error) {
                this.map.writeProtocolMessage({text: error as string, type: LogEventType.Error, display: false});
            }
        }
    }

    /**
     * Получить описание обработчика
     * @method getActionDescription
     * @param actionId {string} Идентификатор обработчика
     * @param taskId {string} Идентификатор задачи
     * @return {ActionDescription|undefined} Описание обработчика
     */
    getActionDescription(actionId: string, taskId: string) {
        const task = this.activeTaskList.find(task => task.id === taskId);
        if (task) {
            return task.getActionDescription(actionId);
        }
    }


    /**
     * Переключить состояние задачи или обработчика
     * @method toggleTaskOrAction
     * @param taskId {string} Идентификатор задачи
     * @param [actionId] {string} Идентификатор обработчика
     * @return {Promise} Promise с флагом успешной операции
     */
    async toggleTaskOrAction(taskId: string, actionId?: string) {
        if (!this.checkOldTaskCreation(taskId)) {
            if (actionId) {
                if (this.activeBlockingAction && this.activeBlockingAction.id === actionId) {
                    if (this.activeBlockingAction.canClose()) {
                        return this.destroyBlockingAction();
                    }
                    return false;
                } else {
                    return this.doBlockingAction(actionId, taskId);
                }
            } else {
                if (this.activeTaskList.find(task => task.id === taskId)) {
                    return this.detachTask(taskId);
                } else {
                    return this.createTask(taskId);
                }
            }
        }
    }

    /**
     * Имитировать нажатие кнопки для копонентов на js
     * @param taskId
     */
    checkOldTaskCreation(taskId: string) {
        let preventTaskStart = false;

        const element = this.map.controlsPane.querySelector('#' + taskId);
        if (element) {
            preventTaskStart = true;
            element.click();
        }
        // обновляем состояние кнопок
        for (let i = 0; i < this.map.oldTaskButtons.length; i++) {
            const id = this.map.oldTaskButtons[i].id;
            if (this.taskRegistry[id]) {
                const element = this.map.controlsPane.querySelector('#' + id)!;
                this.taskRegistry[id].active = element && element.className && (element.className.indexOf('control-button-active') !== -1);
            }
        }

        // TODO: для плагинов
        // else if ( [''].includes( taskId ) ) {
        //     preventTaskStart = true;
        // }

        return preventTaskStart;
    }

    /**
     * Проверка возможности выбора объекта
     * @method canSelectObject
     * @return {boolean}
     */
    canSelectObject() {
        if (this.activeBlockingActionOld) {
            return false;
        }

        if (!this.activeBlockingAction) {
            return true;
        }
        return this.activeBlockingAction.canSelectObject();
    }

    /**
     * Проверка возможности отображения всплывающей информации объекта
     * @method canShowTooltip
     * @return {boolean}
     */
    canShowTooltip() {

        let result = !this.activeBlockingAction || this.activeBlockingAction.canShowTooltip();
        if (result) {
            for (const id in this.activeTaskList) {
                result = this.activeTaskList[id].canShowTooltip();
                if (!result) {
                    break;
                }
            }
        }
        return result;
    }

    /**
     * Проверка возможности выбора данного объекта
     * @method canSelectThisObject
     * @return {boolean}
     */
    canSelectThisObject(mapObject: MapObject) {
        if (!this.activeBlockingAction) {
            return true;
        }
        return this.activeBlockingAction.canSelectThisObject(mapObject);
    }

    /**
     * Проверка возможности отображения панели объектов
     * @method canShowObjectPanel
     * @return {boolean}
     */
    canShowObjectPanel() {
        if (!this.activeBlockingAction) {
            return true;
        }
        return this.activeBlockingAction.canShowObjectPanel();
    }

    /*************************************************************
     *                                                           *
     *                 События приложения                        *
     *                                                           *
     ************************************************************/

    /**
     * Обработчик события `onAnyActionOpen`
     * @method onAnyActionOpen
     * @param actionId {string} Идентификатор обработчика
     */
    onAnyActionOpen(actionId: string) {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onAnyActionOpen(actionId);
        }

        this.triggerList.forEach(trigger => trigger.onAnyActionOpen(actionId));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onAnyActionOpen(actionId);
        }
    }

    /**
     * Обработчик события `onAnyActionClose`
     * @method onAnyActionClose
     * @param actionId {string} Идентификатор обработчика
     */
    onAnyActionClose(actionId: string) {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onAnyActionClose(actionId);
        }

        this.triggerList.forEach(trigger => trigger.onAnyActionClose(actionId));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onAnyActionClose(actionId);
        }
    }

    /**
     * Обработчик события `onPreRender`
     * @method onPreRender
     * @param renderer {SVGrenderer} Инструмент рисования
     */
    onPreRender(renderer: SVGrenderer) {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onPreRender(renderer);
        }

        this.triggerList.forEach(trigger => trigger.onPreRender(renderer));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onPreRender(renderer);
        }
    }

    /**
     * Обработчик события `onPostRender`
     * @method onPostRender
     * @param renderer {SVGrenderer} Инструмент рисования
     */
    onPostRender(renderer: SVGrenderer) {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onPostRender(renderer);
        }

        this.triggerList.forEach(trigger => trigger.onPostRender(renderer));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onPostRender(renderer);
        }
    }

    /**
     * Обработчик события `onMouseDown`
     * @method onMouseDown
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseDown(event: MouseDeviceEvent) {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onMouseDown(event);
        }

        this.triggerList.forEach(trigger => trigger.onMouseDown(event));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onMouseDown(event);
        }
    }

    /**
     * Обработчик события `onMouseUp`
     * @method onMouseUp
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseUp(event: MouseDeviceEvent) {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onMouseUp(event);
        }

        this.triggerList.forEach(trigger => trigger.onMouseUp(event));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onMouseUp(event);
        }
    }

    /**
     * Обработчик события `onMouseClick`
     * @method onMouseClick
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseClick(event: MouseDeviceEvent) {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onMouseClick(event);
        }

        this.triggerList.forEach(trigger => trigger.onMouseClick(event));

        let processFlag = true;
        if (this.activeBlockingAction) {
            processFlag = !this.activeBlockingAction.onMouseClick(event);
        }

        if (processFlag && this.canSelectObject()) {
            const taskDescription = this.getTaskDescription(MAP_OBJECT_PANEL_COMPONENT);
            if (taskDescription) {
                const activeTask = this.activeTaskList.find(task => task.id === taskDescription.id);
                if (activeTask) {
                    activeTask.setState(UPDATE_MAP_OBJECTS_COUNT, null);
                }
            }
            const geoJsonLayers = this.map.vectorLayers.filter(layer => (layer instanceof GeoJsonLayer && layer.visible)) as GeoJsonLayer[];
            if (this.map.tiles.getSelectableLayersArray().length === 0 && geoJsonLayers.length === 0) {
                this.map.writeProtocolMessage({
                    text: this.map.translate('There are no available map layers to perform the operation'),
                    description: 'Search: ' + this.map.translate('There are no available map layers to perform the operation'),
                    type: LogEventType.Error,
                    display: true
                });
            } else {
                this.showOverlayPanel();
                this.map.searchManager.findInPoint(event.mousePosition).then(() => {
                }).catch(() => {
                }).finally(
                    () => {
                        this.showObjectPanel();
                        this.removeOverlayPanel();
                    }
                );
            }
        }
    }

    /**
     * Обновить критерии поиска
     * @method updateCriteriaAggregator
     * @param criteriaAggregator {CriteriaAggregator} Копия аггрегатора критериев для правки
     */
    updateCriteriaAggregator(criteriaAggregator: CriteriaAggregator) {

        this.triggerList.forEach(trigger => trigger.updateCriteriaAggregator(criteriaAggregator));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.updateCriteriaAggregator(criteriaAggregator);
        }
    }

    /**
     * Обработчик события завершения редактирования объекта
     * @method onCommit
     */
    onCommit() {

        this.triggerList.forEach(trigger => trigger.commit());

        if (this.activeBlockingAction) {
            this.activeBlockingAction.commit();
        }
    }


    /**
     * Обработчик события `onMouseDelayedClick`
     * @method onMouseDelayedClick
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseDelayedClick(event: MouseDeviceEvent) {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onMouseDelayedClick(event);
        }

        this.triggerList.forEach(trigger => trigger.onMouseDelayedClick(event));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onMouseDelayedClick(event);
        }
    }

    /**
     * Обработчик события `onMouseDoubleClick`
     * @method onMouseDoubleClick
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseDoubleClick(event: MouseDeviceEvent) {
        this.onCommit();
    }

    /**
     * Обработчик события `onMouseMove`
     * @method onMouseMove
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseMove(event: MouseDeviceEvent) {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onMouseMove(event);
        }

        this.triggerList.forEach(trigger => trigger.onMouseMove(event));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onMouseMove(event);
        }
    }

    /**
     * Обработчик события `onMouseWheel`
     * @method onMouseWheel
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseWheel(event: MouseDeviceEvent) {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onMouseWheel(event);
        }

        this.triggerList.forEach(trigger => trigger.onMouseWheel(event));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onMouseWheel(event);
        }
    }

    /**
     * Обработчик события `onKeyDown`
     * @method onKeyDown
     * @param event {KeyboardDeviceEvent} Объект события
     */
    onKeyDown(event: KeyboardDeviceEvent) {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onKeyDown(event);
        }

        this.triggerList.forEach(trigger => trigger.onKeyDown(event));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onKeyDown(event);
        }
    }

    /**
     * Обработчик события `onKeyUp`
     * @method onKeyUp
     * @param event {KeyboardDeviceEvent} Объект события
     */
    onKeyUp(event: KeyboardDeviceEvent) {

        if (event.activeKeyCode === KeyboardCode.Escape) {

            this.triggerList.forEach(trigger => trigger.revert());

            if (this.activeBlockingAction) {
                this.activeBlockingAction.revert();
                return;
            }
        }

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onKeyUp(event);
        }

        this.triggerList.forEach(trigger => trigger.onKeyUp(event));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onKeyUp(event);
        }
    }

    /**
     * Обработчик события выбора объекта
     * @method onSelectObject
     */
    onSelectObject() {

        this.triggerList.forEach(trigger => trigger.selectObject(this.map.getActiveObject()));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.selectObject(this.map.getActiveObject());
        }

        const clearSelectTask = this.taskRegistry[CLEAR_SELECT_COMPONENT];
        if (clearSelectTask) {
            clearSelectTask.enabled = this.map.hasObjectsSelection();
        }
    }

    /**
     * Обработчик события выделения объектов
     * @method onSelectObjects
     */
    onSelectObjects() {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onSelectObjects(this.map.getSelectedObjects());
        }

        this.triggerList.forEach(trigger => trigger.onSelectObjects(this.map.getSelectedObjects()));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onSelectObjects(this.map.getSelectedObjects());
        }

        const clearSelectTask = this.taskRegistry[CLEAR_SELECT_COMPONENT];
        if (clearSelectTask) {
            clearSelectTask.enabled = this.map.hasObjectsSelection();
            if (!clearSelectTask.enabled) {
                this.closeSelectedObjectViewer();
            }
        }

        const selectedObjectsViewerTask = this.taskRegistry[SELECT_OBJECTS_VIEWER];
        if (selectedObjectsViewerTask) {
            selectedObjectsViewerTask.enabled = this.map.getSelectedObjects().length !== 0;
        }
    }

    //fixme: selectObjects
    onObjectSelectionChanged() {
        const clearSelectTask = this.taskRegistry[CLEAR_SELECT_COMPONENT];
        if (clearSelectTask) {
            clearSelectTask.enabled = this.map.hasObjectsSelection();
        }
        const selectedObjectsViewerTask = this.taskRegistry[SELECT_OBJECTS_VIEWER];
        if (selectedObjectsViewerTask) {
            selectedObjectsViewerTask.enabled = this.map.getSelectedObjects().length !== 0;
        }
    }

    /**
     * Обработчик события изменения данных
     * @method onDataChanged
     */
    onDataChanged(event: DataChangedEvent) {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onDataChanged(event);
        }

        this.triggerList.forEach(trigger => trigger.onDataChanged(event));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onDataChanged(event);
        }
    }

    onTransactionLogChanged() {
        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onTransactionLogChanged();
        }
    }

    /**
     * Обработчик завершения поиска
     * @method onSearchResultChanged
     */
    onSearchResultChanged() {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onSearchResultChanged();
        }

        this.triggerList.forEach(trigger => trigger.onSearchResultChanged());

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onSearchResultChanged();
        }
    }

    /**
     * Обработчик события состояния карты и пользовательских настроек
     * @method onWorkspaceChanged
     * @param type {string} Тип события
     */
    onWorkspaceChanged(type: keyof WorkspaceValues): void {

        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onWorkspaceChanged(type);
        }

        this.triggerList.forEach(trigger => trigger.onWorkspaceChanged(type));

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onWorkspaceChanged(type);
        }
    }

    /**
     * Обработчик сброса состояния карты и пользовательских настроек
     * @method onWorkspaceReset
     */
    onWorkspaceReset(): void {

        this.map.setRefreshInterval();

        this.resetTheme();
        this.resetSizeInterface();
        this.resetColorTheme();
        this.resetFontSize();
        for (const id in this.activeTaskList) {
            this.activeTaskList[id].onWorkspaceReset();
        }

        this.triggerList.forEach(trigger => trigger.onWorkspaceReset());

        if (this.activeBlockingAction) {
            this.activeBlockingAction.onWorkspaceReset();
        }
    }

    /**
     * Зарегистрировать подключаемый плагин
     * @method onPluginRegistration
     * @public
     * @param pluginDescription {PluginDescription} Описание плагина
     */
    onPluginRegistration(pluginDescription: PluginDescription) {
        const taskDescription = {
            id: pluginDescription.id,
            getConstructor: () => Promise.resolve(Task.constructor as { new(mapWindow: MapWindow, id: string): Task }),
            active: false,
            enabled: true,
            options: {
                icon: pluginDescription.icon ? pluginDescription.icon : 'address-in-point',   // TODO:!!!
                title: pluginDescription.title,
                specifiedToolbar: pluginDescription.specifiedToolbar,
                className: 'not-bottom'
            }
        };
        this.registerTask(taskDescription);
    }

    /**
     * Запросить легенду
     * @async
     * @method callLegend
     */
    async callLegend(layerId?: string, sld?: CommonServiceSVG[], type?: LOCALE, legendShowMode?: LEGEND_SHOW_MODE, selectedLegendObjectList?: GwtkMapLegendItemReduced[]) {
        return new Promise<EditorLayoutDescription | GwtkMapLegendItemReduced[]>((resolve, reject) => {
            const activeTaskList = this.activeTaskList;

            const legendTaskDescription = this.taskRegistry[LEGEND_COMPONENT];
            if (legendTaskDescription && legendTaskDescription.active) {
                this.detachTask(LEGEND_COMPONENT);
            }

            this.createTask(LEGEND_COMPONENT).then(() => {
                const legendTask = activeTaskList.find(task => task.id === LEGEND_COMPONENT);
                if (legendTask) {
                    legendTask.setState(SET_LEGEND_ITEM_SELECTION_MODE, {resolve, reject});
                    if (layerId) {
                        const legend: LayerIdLegendMode = {
                            layerId,
                            mode: legendShowMode || LEGEND_SHOW_MODE.ItemSelectionMode,
                            sld,
                            type,
                            selectedLegendObjectList
                        };
                        legendTask.setState(CHANGE_CURRENT_MAP_LAYER_ID, legend);
                    }
                }
            });
        });
    }


    /**
     * Открыть легенду
     * @method openLegend
     * @param layerId {string} Идентификатор слоя
     * @param [legendShowMode] {LEGEND_SHOW_MODE} Режим легенды
     */
    openLegend(layerId?: string, legendShowMode?: LEGEND_SHOW_MODE) {

        const activeTaskList = this.activeTaskList;

        const legendTaskDescription = this.taskRegistry[LEGEND_COMPONENT];
        if (legendTaskDescription && legendTaskDescription.active) {
            this.detachTask(LEGEND_COMPONENT);
        }

        this.createTask(LEGEND_COMPONENT).then(() => {
            const legendTask = activeTaskList.find(task => task.id === LEGEND_COMPONENT);
            if (legendTask) {
                if (layerId) {
                    const legend: LayerIdLegendMode = {
                        layerId,
                        mode: legendShowMode || LEGEND_SHOW_MODE.VisibilityControlMode,
                        type: LOCALE.Template
                    };
                    legendTask.setState(CHANGE_CURRENT_MAP_LAYER_ID, legend);
                    legendTask.setState(LOCK_LAYER, true);
                }
            }
        });

    }

    setLegendState(state: { key: string; value: any; }) {

        const legendTask = this.activeTaskList.find(task => task.id === LEGEND_COMPONENT);
        if (legendTask) {
            legendTask.setState(state.key, state.value);
        } else {
            window.setTimeout(() => {

                const legendTask = this.activeTaskList.find(task => task.id === LEGEND_COMPONENT);
                if (legendTask) {
                    legendTask.setState(state.key, state.value);
                }


            }, 350);
        }
    }

    /**
     * Открыть компонент состав карт
     * @method openMapContent
     * @param [layerAlias] {string} Идентификатор слоя
     */
    openMapContent(layerAlias?: string) {

        const activeTaskList = this.activeTaskList;

        const mapContentTaskDescription = this.taskRegistry[MAP_CONTENT_COMPONENT];
        if (mapContentTaskDescription && mapContentTaskDescription.active) {
            this.detachTask(MAP_CONTENT_COMPONENT, true);
        }

        this.createTask(MAP_CONTENT_COMPONENT).then(() => {
            const mapContentTask = activeTaskList.find(task => task.id === MAP_CONTENT_COMPONENT);
            if (mapContentTask) {
                if (layerAlias) {
                    mapContentTask.setState(ON_INPUT_SEARCH, layerAlias);
                }
            }
        });

    }

    /**
     * Открыть компонент Журнал событий карты
     * @method openMapLog
     */
    openMapLog() {
        this.createTask(MAP_LOG_COMPONENT);
    }

    get isEditorAvailable() {
        const editorTaskDescription = this.taskRegistry[MAP_EDITOR_COMPONENT];
        return !!editorTaskDescription;
    }

    /**
     * Открыть редактор
     * @method openMapEditor
     * @param [layerId] {string} Идентификатор слоя
     */
    openMapEditor(layerId?: string, state?: { key: string; value: any; }[]) {

        const activeTaskList = this.activeTaskList;
        const editorTaskId = MAP_EDITOR_COMPONENT;

        const editorTaskDescription = this.taskRegistry[editorTaskId];
        if (editorTaskDescription && editorTaskDescription.active) {
            this.detachTask(editorTaskId);
        }

        this.createTask(editorTaskId).then(() => {
            const editorTask = activeTaskList.find(task => task.id === editorTaskId);
            if (editorTask) {
                if (layerId) {
                    editorTask.setState(SELECT_LAYOUT_LAYER, layerId);
                }
                if (state) {
                    state.forEach(({key, value}) => editorTask.setState(key, value));
                }
            }
        });

    }

    openDocumentViewer(mode: ViewDocumentMode, file?: File, fileName?: string) {
        this.createTask(DOCUMENT_VIEWER).then(() => {
            const taskDescription = this.getTaskDescription(DOCUMENT_VIEWER);
            const documentViewerTask = this.activeTaskList.find(task => task.id === taskDescription.id);
            if (documentViewerTask) {
                window.setTimeout(() => {
                    if (file) {
                        if (mode === ViewDocumentMode.bim) {
                            documentViewerTask.setState(ON_LOAD_BIM, file);
                        } else if (mode === ViewDocumentMode.image) {
                            documentViewerTask.setState(ON_LOAD_IMAGE, {
                                src: URL.createObjectURL(file),
                                name: fileName
                            });
                        } else if (mode === ViewDocumentMode.video) {
                            documentViewerTask.setState(ON_LOAD_VIDEO, {
                                src: URL.createObjectURL(file),
                                name: fileName
                            });
                        }
                    } else {
                        documentViewerTask.setState(OPEN_FILE_DIALOG, null);
                    }
                }, 100);
            }
        });
    }

    uploadBimFile(file: File, canUploadFile: boolean = false) {
        return new Promise<EditorLayoutDescription>((resolve, reject) => {
            const taskDescription = this.getTaskDescription(DOCUMENT_VIEWER);
            if (taskDescription) {
                this.createTask(DOCUMENT_VIEWER).then(() => {
                    const documentViewerTask = this.activeTaskList.find(task => task.id === taskDescription.id);
                    if (documentViewerTask) {
                        window.setTimeout(() => {

                            documentViewerTask.setState(ON_LOAD_BIM, file);
                            if (canUploadFile) {
                                documentViewerTask.setState(START_ON_SEMANTIC_MODE, {resolve, reject});
                            } else {
                                documentViewerTask.setState(START_ON_PREVIEW_MODE, null);
                            }
                        }, 100);
                    }
                });
            }
        });
    }

    /**
     * Отобразить панель с информацией об объекте
     * @method showObjectPanelInfo
     * @param mapObject {MapObject} Объект карты
     */
    showObjectPanelInfo(mapObject: MapObject): void {
        if (!this.canShowObjectPanel()) {
            return;
        }
        const taskDescription = this.getTaskDescription(MAP_OBJECT_PANEL_COMPONENT);
        // Отображать окно "Объекты слоя"
        if (taskDescription && taskDescription.enabled) {
            this.createTask(taskDescription.id).then(() => {
                const objectPanelTask = this.activeTaskList.find(task => task.id === taskDescription.id);
                if (objectPanelTask) {
                    objectPanelTask.setState(SELECT_CURRENT_MAPOBJECT_CONTENT, mapObject);
                    objectPanelTask.setState(SELECT_MODE, MapObjectPanelState.showInfo);
                    objectPanelTask.setState(SINGLE_MODE_FLAG, true);
                }
            });
        }
    }
    /**
     * Отобразить панель с информацией об объекте
     * @method showObjectPanelEdit
     * @param mapObject {MapObject} Объект карты
     */
    showObjectPanelEdit(mapObject: MapObject, state?: { key: string; value: any; }[]): void {
        if (!this.canShowObjectPanel()) {
            return;
        }
        const taskDescription = this.getTaskDescription(MAP_OBJECT_PANEL_COMPONENT);
        // Отображать окно "Объекты слоя"
        if (taskDescription && taskDescription.enabled) {
            this.createTask(taskDescription.id).then(() => {
                const objectPanelTask = this.activeTaskList.find(task => task.id === taskDescription.id);
                if (objectPanelTask) {
                    objectPanelTask.setState(SELECT_CURRENT_MAPOBJECT_CONTENT, mapObject);
                    objectPanelTask.setState(SELECT_MODE, MapObjectPanelState.showEditor);
                    objectPanelTask.setState(SINGLE_MODE_FLAG, true);
                    if (state) {
                        state.forEach(({key, value}) => objectPanelTask.setState(key, value));
                    }
                }
            });
        }
    }

    /**
     * Отобразить панель объектов
     * @method showObjectPanel
     * @param [mode] {MapObjectPanelState} Режим панели объектов
     * @param [singleMode] {boolean} Флаг выхода при переходе "Назад"
     * @param [clusterMapObjects] {MapObject[]} Список объектов кластера
     */
    showObjectPanel(mode: MapObjectPanelState = MapObjectPanelState.showObjects, singleMode?: boolean, clusterMapObjects?: MapObject[]): void {
        if (!this.canShowObjectPanel()) {
            return;
        }

        const taskDescription = this.getTaskDescription(MAP_OBJECT_PANEL_COMPONENT);
        // Отображать окно "Объекты слоя"
        if (taskDescription && taskDescription.enabled) {
            this.createTask(taskDescription.id).then(() => {
                const objectPanelTask = this.activeTaskList.find(task => task.id === taskDescription.id);
                if (objectPanelTask) {
                    const activeObject = this.map.getActiveObject();
                    if (activeObject) {
                        objectPanelTask.setState(HIGHLIGHT_OBJECT, activeObject);

                        if (clusterMapObjects && clusterMapObjects.length > 1) {
                            objectPanelTask.setState(SET_CLUSTER_MAP_OBJECTS_LIST, clusterMapObjects);
                            objectPanelTask.setState(FIT_MAP_TO_CLUSTER, activeObject);
                        } else {
                            objectPanelTask.setState(SELECT_CURRENT_MAPOBJECT_CONTENT, activeObject);
                        }
                        this.map.clearActiveObject();
                    }
                    objectPanelTask.setState(SELECT_MODE, mode);
                    objectPanelTask.setState(SINGLE_MODE_FLAG, singleMode || false);
                }
            });
        }
    }

    /**
     * Скрыть панель объектов
     * @method hideObjectPanel
     */
    hideObjectPanel() {
        const taskDescription = this.getTaskDescription(MAP_OBJECT_PANEL_COMPONENT);
        if (taskDescription && taskDescription.active) {
            this.detachTask(taskDescription.id);
        }
    }

    /**
     * Отобразить панель выделенных объектов
     * @method openSelectedObjectViewer
     */
    openSelectedObjectViewer() {
        const taskDescription = this.getTaskDescription(SELECT_OBJECTS_VIEWER);
        if (taskDescription && taskDescription.enabled) {
            this.createTask(taskDescription.id);
        }
    }

    /**
     * Закрыть режим выделенные объекты
     * @method closeSelectedObjectViewer
     */
    closeSelectedObjectViewer() {
        const taskDescription = this.getTaskDescription(SELECT_OBJECTS_VIEWER);
        if (taskDescription && taskDescription.active) {
            this.detachTask(taskDescription.id);
        }
    }

    /**
     * Активность панели объектов
     * @property objectPanelActive
     */
    get objectPanelActive() {
        const taskDescription = this.getTaskDescription(MAP_OBJECT_PANEL_COMPONENT);
        return taskDescription.active;
    }

    /**
     * Получить Html контент печати компонента
     * @method componentPrintHtmlContent
     * @taskId {string} идентификатор компонента
     */
    async componentPrintHtmlContent(taskId: string) {
        if (taskId === MAP_OBJECT_PANEL_COMPONENT && !this.canShowObjectPanel()) {
            return;
        }
        const taskDescription = this.getTaskDescription(taskId);
        const task = this.activeTaskList.find(task => task.id === taskDescription.id);
        if (task) {
            return task.getPrintHtmlContent();
        }
    }

    /**
     * Получить текстовый контент печати компонента
     * @method componentPrintHtml
     * @taskId {string} идентификатор компонента
     */
    componentPrintTextContent(taskId: string) {
        if (taskId === MAP_OBJECT_PANEL_COMPONENT) {
            if (!this.canShowObjectPanel()) {
                return '';
            }
        }
        const taskDescription = this.getTaskDescription(taskId);
        const task = this.activeTaskList.find(task => task.id === taskDescription.id);
        if (task) {
            return task.getPrintTextContent();
        }
    }

    /**
     * Отобразить окно ожидания
     * @method showOverlay
     */
    showOverlayPanel(handleClose: (null | (() => void)) = this.map.searchManager.stopSearch) {
        const mapOverlayParam = handleClose? {handleClose} : undefined;
        this.mapWindow.showOverlay(mapOverlayParam);
    }

    /**
     * Закрыть окно ожидания
     * @method removeOverlayPanel
     */
    removeOverlayPanel() {
        this.mapWindow.removeOverlay();
    }

    /**
     * Отобразить панель построения маршрутов
     * @param points {RoutePoint[]} Массив пунктов маршрута
     */
    showMapRoutePanel(points: RoutePoint[]) {

        const taskDescription = this.getTaskDescription(MAP_ROUTE_COMPONENT);

        if (taskDescription.active) {
            this.detachTask(taskDescription.id);
        }

        if (taskDescription.enabled) {
            this.createTask(taskDescription.id).then(() => {
                const mapRouteTask = this.activeTaskList.find(task => task.id === taskDescription.id);
                if (mapRouteTask) {
                    mapRouteTask.setState(ADD_ROUTE_POINTS, points);
                }
            });
        }
    }

    /*************************************************************
     *                                                           *
     *                        Deprecated                         *
     *                                                           *
     ************************************************************/
    /**
     * Проверить блокировку обработчиков события
     * @deprecated
     * @method checkBlockingAction
     * @return {boolean}
     */
    checkBlockingAction(funName: string) {

        let blocking = false;
        const action = this.activeBlockingAction;
        if (action) {
            switch (funName) {
                case 'onClick':
                    blocking = !action.canSelectObject();
                    break;
                case 'onMousemove':
                    blocking = !action.canMapMove();
                    break;
                // case 'onMouseup':
                //     name = 'onMouseUp';
                //     break;
                // case 'onMousedown':
                //     name = 'onMouseDown';
                //     break;
                // case 'onDblclick':
                //     name = 'onMouseDoubleClick';
                //     break;
                case 'onMousewheel':
                    blocking = false;
                    break;
                // case 'onKeydown':
                //     name = 'onKeyDown';
                //     break
                // case 'onKeyup':
                //     name = 'onKeyUp';
                //     break;
            }
        }

        return blocking;
    }

    /**
     * Запущенный блокирующий обработчик (временная совместимость)
     * @deprecated
     * @private
     * @property activeBlockingActionOld {object}
     */
    private activeBlockingActionOld?: { set(): void; close(): boolean; };

    /**
     * Запустить блокирующий обработчик (совместимость)
     * @deprecated
     * @async
     * @method activateBlockingActionOld
     * @param action {object} Обработчик
     * @return {Promise}
     */
    activateBlockingActionOld(action: { set(): void; close(): boolean; }) {
        if (this.activeBlockingAction) {
            return this.cancelBlockingAction();
        }
        this.activeBlockingActionOld = action;
        this.activeBlockingActionOld.set();
        return true;
    }

    /**
     * Остановить блокирующий обработчик (совместимость)
     * @deprecated
     * @method deactivateBlockingActionOld
     * @return {boolean}
     */
    deactivateBlockingActionOld() {
        if (this.activeBlockingActionOld) {
            if (this.activeBlockingActionOld.close()) {
                this.activeBlockingActionOld = undefined;
                return true;
            }
            return false;
        }
        return true;
    }

    /**
     * Показать сообщение
     * @param message {string} Текст сообщения
     * @param [timeout] {string} Время отображения сообщения
     */
    showSnackBarMessage(message: LogMessage, timeout = 2000) {
        if (this.mapWindow) {
            this.mapWindow.addSnackBarMessage(message.text, {...message, timeout});
        }
    }

    /**
     * Вызвать setState текущего Action
     * @param buttonId
     */
    actionSetStateRun(buttonId: string) {
        //TODO: надо удалить!!!
        if (this.activeBlockingAction) {
            switch (buttonId) {
                case ACTION_COMMIT:
                    this.activeBlockingAction.commit();
                    break;
                case ACTION_CANCEL:
                    this.activeBlockingAction.revert();
                    break;
            }
        }

    }

    // /**
    //  * Запущенный неблокирующий обработчик
    //  * @private
    //  * @property activeNonBlockingActionList {object}
    //  */
    // private readonly activeNonBlockingActionList: SimpleJson<Action> = {};
    // /**
    //  * Запустить неблокирующий обработчик
    //  * @method activateNonBlockingAction
    //  * @param id {string} Идентификатор обработчика
    //  * @return {Promise} Promise обработчика
    //  */
    // doNonBlockingAction( id: string ) {
    //     if ( !this.mapWindow ) {
    //         return;
    //     }
    //     if ( !this.activeNonBlockingActionList[ id ] ) {
    //         const actionConstructor = this.taskRegistry[ id ];
    //         if ( actionConstructor ) {
    //             this.activeNonBlockingActionList[ id ] = new actionConstructor.constructor( this.mapWindow );
    //             this.onAnyActionOpen( id );
    //             return true;
    //         }
    //     }
    // }
    //
    // /**
    //  * Остановить неблокирующий обработчик
    //  * @method deactivateNonBlockingAction
    //  * @param id {string} Идентификатор обработчика
    //  * @return {Promise} Promise обработчика
    //  */
    // cancelNonBlockingAction( id: string ) {
    //     this.destroyNonBlockingAction( id );
    // }
    //
    // destroyNonBlockingAction( id: string ) {
    //     const action = this.activeTaskList[ id ];
    //     if ( action ) {
    //         delete this.activeTaskList[ id ];
    //         action.destroyAction();
    //         this.onAnyActionClose( id );
    //         return true;
    //     }
    // }

    setDarkTheme(value: boolean): void {
        this.mapWindow.setDarkTheme(value);
    }

    setReduceSizeInterface(value: boolean): void {
        this.mapWindow.setReduceSizeInterface(value);
    }

    resetTheme() {
        const darkThemeFlag = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_DARK_THEME_FLAG);
        this.setDarkTheme(darkThemeFlag);
    }

    resetSizeInterface() {
        const reduceSizeInterfaceFlag = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
        this.setReduceSizeInterface(reduceSizeInterfaceFlag);
    }

    applyColorScheme(colorScheme: ColorScheme) {
        this.mapWindow.applyColorScheme(colorScheme);
    }

    resetColorTheme() {
        const primary = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_PRIMARY_COLOR);
        const secondary = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_SECONDARY_COLOR);

        this.mapWindow.applyColorScheme({primary, secondary});

    }

    setFontSize(size: FontSize) {
        this.mapWindow.setFontSize(size);
    }

    resetFontSize() {
        const value = this.map.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_FONT_SIZE);
        this.setFontSize(value);
    }

    /**
     * Обработчик события `onDragOver`
     * @private
     * @method onDragOver
     * @param event {DragEvent} Событие drag and drop
     */
    private onDragOver(event: DragEvent) {
        if (!this.internalDragStartFlag && this.activeTaskList.length) {
            this.activeTaskList.forEach(activeTask => activeTask.onDragOver(event));
            event.preventDefault();
            event.stopPropagation();
        }
    }

    /**
     * Обработчик события `onDragLeave`
     * @private
     * @method onDragLeave
     * @param event {DragEvent} Событие drag and drop
     */
    private onDragLeave(event: DragEvent) {
        if (!this.internalDragStartFlag && this.activeTaskList.length) {
            this.activeTaskList.forEach(activeTask => activeTask.onDragLeave(event));
            event.preventDefault();
            event.stopPropagation();
        }
    }


    /**
     * Обработчик события `onDrop`
     * @private
     * @method onDrop
     * @param event {DragEvent} Событие drag and drop
     */
    private onDrop(event: DragEvent) {
        if (this.activeTaskList.length) {
            this.activeTaskList.forEach(activeTask => activeTask.onDragLeave(event));
        }
    }

    /**
     * Получить данные для ссылки
     * @method getComponentsDataForLink
     * @returns  {object} Список объектов карты
     */
    getComponentsDataForLink(): SimpleJson<any> | undefined {
        const result: SimpleJson<any> = {};
        this.activeTaskList.forEach(task => {
            const data = task.getComponentDataForLink();
            if (data) {
                result[task.id] = data;
            }
        });
        if (Reflect.ownKeys(result).length > 0) {
            return result;
        }
    }
}
