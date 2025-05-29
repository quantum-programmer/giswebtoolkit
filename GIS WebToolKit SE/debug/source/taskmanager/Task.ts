/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Родительский класс задачи                        *
 *                                                                  *
 *******************************************************************/

import MapWindow, { ButtonDescription } from '~/MapWindow';
import { GwtkComponentDescriptionPropsData, GwtkMap } from '~/types/Types';
import DeviceAndMapEventListener from '~/taskmanager/DeviceAndMapEventListener';
import Action, { ActionModePanel } from '~/taskmanager/Action';
import { SimpleJson } from '~/types/CommonTypes';


export interface MessageParameter {
    text: string;
    value?: string;
    isSnackbar?: true;
}

export type ActionDescription = {
    getConstructor: () => (new( task: any, id: string ) => Action<Task>);
} & ButtonDescription;

/**
 * Родительский класс обработчика
 * @abstract
 * @class Task
 * @extends DeviceAndMapEventListener
 */
export default abstract class Task<T extends MapWindow = MapWindow> extends DeviceAndMapEventListener {

    /**
     * Экземпляр окна карты
     * @protected
     * @readonly
     * @property mapWindow {MapWindow}
     */
    readonly mapWindow: T;


    /**
     * Идентификатор задачи
     * @readonly
     * @property id {string}
     */
    readonly id: string;

    /**
     * Экземпляр карты
     * @protected
     * @readonly
     * @property map {GwtkMap}
     */
    protected readonly map: GwtkMap;


    /**
     * Список описаний графических компонентов
     * @protected
     * @readonly
     * @property componentDescriptions {GwtkComponentDescriptionPropsData[]}
     */
    protected readonly componentDescriptions: GwtkComponentDescriptionPropsData[] = [];

    /**
     * Реестр блокирующих обработчиков
     * @private
     * @readonly
     * @property actionRegistry {ActionDescription[]}
     */
    readonly actionRegistry: ActionDescription[] = [];

    /**
     * Активный обработчик
     * @protected
     * @property _action {Action}
     */
    protected _action?: Action<Task<T>>;

    protected workspaceData?: SimpleJson<any>;

    /**
     * Сеттер для активного обработчика
     * @property _action {Action}
     */
    set action( action: Action<Task<T>> | undefined ) {
        if ( action ) {
            const actionDescription = this.getActionDescription( action.id );
            if ( actionDescription ) {
                actionDescription.active = true;
                this._action = action;
            }
        } else if ( this._action ) {
            const actionDescription = this.getActionDescription( this._action.id );
            if ( actionDescription ) {
                actionDescription.active = false;
                this._action = undefined;
            }
        }
    }

    /**
     * @getConstructor() Task
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    protected constructor( mapWindow: T, id: string ) {
        super();

        this.mapWindow = mapWindow;
        this.id = id;
        this.map = this.mapWindow.getMap();
        this.map.writeDebugLog();
    }

    /**
     * Проверка возможности отображения всплывающей информации объекта
     * @method canShowTooltip
     * @return {boolean}
     */
    canShowTooltip() {
        return true;
    }

    async clearTaskWorkspaceData() {
        this.map.writeDebugLog();
        this.map.workspaceManager.clearComponentData(this.id);
        await this.map.workspaceManager.writeComponentData(this.id);
        this.map.getTaskManager().detachTask(this.id);
        this.map.getTaskManager().createTask(this.id);
    }

    protected readWorkspaceData() {
        this.map.writeDebugLog();
        this.workspaceData = this.map.workspaceManager.getComponentData( this.id );
    }

    protected writeWorkspaceData( forceDBUpdateFlag?: boolean ) {
        this.map.writeDebugLog();
        if ( this.workspaceData ) {
            this.map.workspaceManager.setComponentData( this.id, this.workspaceData );
        } else {
            this.map.workspaceManager.clearComponentData( this.id );
        }
    }

    /**
     * Деструктор
     * @protected
     * @method destroy
     */
    protected destroy() {
        this.map.writeDebugLog();
        if ( this._action ) {
            this.mapWindow.getTaskManager()?.destroyBlockingAction( this._action.id );
        }
        while ( this.componentDescriptions.length > 0 ) {
            const componentProps = this.componentDescriptions.pop()!;
            this.mapWindow.deleteItem( componentProps );
        }
    }

    /**
     * Отобразить компонент
     * @method showComponent
     */
    showComponent() {
        this.map.writeDebugLog();
        this.componentDescriptions.forEach( componentProps => this.mapWindow.showItem( componentProps ) );
    }

    setup() {
        this.readWorkspaceData();
    }

    /**
     * Регистрация задачи и обработчиков в Help
     * @method registerHelp
     */
    registerHelp() {
    }

    /**
     * Остановка задачи
     * @method quit
     */
    quit() {
        this.map.writeDebugLog();
        this.destroy();
    }

    /**
     * Получить экземпляр обработчика
     * @method getAction
     * @return {Action | undefined} Экземпляр обработчика
     */
    getAction( actionId: string ) {
        this.map.writeDebugLog();
        const actionDescription = this.getActionDescription( actionId );
        if ( actionDescription ) {
            return (new (actionDescription.getConstructor())( this, actionId ));
        }
    }

    /**
     * Запуск обработчика
     * @protected
     * @method close
     */
    doAction( id: string ) {
        this.map.writeDebugLog();
        this.mapWindow.getTaskManager().doBlockingAction( id, this.id );
    }

    /**
     * Остановка обработчика
     * @protected
     * @method close
     */
    closeAction( id: string ) {
        this.map.writeDebugLog();
        if ( this._action && this._action.id === id ) {
            this.mapWindow.getTaskManager().cancelBlockingAction( id );
        }
    }

    /**
     * Остановка обработчика
     * @protected
     * @method close
     */
    quitAction( id: string ) {
        this.map.writeDebugLog();
        if ( this._action && this._action.id === id ) {
            this.mapWindow.getTaskManager().destroyBlockingAction( id );
        }
    }

    /**
     * Получить описание обработчика
     * @method getActionDescription
     * @return {ActionDescription | undefined} Экземпляр обработчика
     */
    getActionDescription( actionId: string ): ActionDescription | undefined {
        for ( let i = 0; i < this.actionRegistry.length; i++ ) {
            const actionDescription = this.actionRegistry[ i ];
            if ( actionDescription.id === actionId ) {
                return actionDescription;
            }
        }
    }

    /**
     * Обработчик события проверки доступности обработчиков
     * @method onCommandEnable
     */
    onCommandEnable() {
    }

    /**
     * Обработчик события изменения журнала транзакций
     * @method onTransactionLogChanged
     */
    onTransactionLogChanged() {
    }

    /**
     * Установить состояние задачи
     * @method setState
     * @param key {string} Ключ (идентификатор команды)
     * @param value {any} Значение
     */
    setState( key: string, value: any ) {
        this.map.writeDebugLog();
    }

    /**
     * Добавление описания графического компонента в список удаляемых после остановки обработчика
     * @protected
     * @method addToPostDeactivationList
     * @param propsData {GwtkComponentDescriptionPropsData} Описание компонента
     */
    protected addToPostDeactivationList( propsData: GwtkComponentDescriptionPropsData ) {
        this.componentDescriptions.push( propsData );
    }

    /**
     * Создание стандартной панели с кнопками зарегистрированных обработчиков
     * @protected
     * @method createTaskPanel
     */
    createTaskPanel() {
    }

    /**
     * Добавить кнопки виджета (для обработчика)
     * @method createModePanel
     * @param modePanelDescription {ActionModePanel} Массив описаний кнопок
     */
    createModePanel( modePanelDescription: ActionModePanel ) {
    }

    /**
     * Очистить кнопки виджета
     * @method removeModePanel
     */
    removeModePanel( modePanelId?: string ) {
    }

    setMessage( message: string ) {
        //todo: временно, пока нет статус бара
        this.mapWindow.addSnackBarMessage( message );
    }

    setPanelMessage( message?: MessageParameter ) {

    }

    resetMessage() {

    }

    async getPrintHtmlContent(): Promise<HTMLDivElement> {
        return new Promise<HTMLDivElement>( () => {
        } );
    }

    getPrintTextContent() {
        return '';
    }

    /**
    * Обработчик события `onDragOver`
    * @method onDragOver
    * @param event {DragEvent} Событие drag and drop
    */
    onDragOver(event: DragEvent) {
    }

    /**
    * Обработчик события `onDragLeave`
    * @method onDragLeave
    */
    onDragLeave(event: DragEvent) {
    }

    /**
     * Получить данные компонента для формирования ссылки
     * @method getComponentDataForLink
     * @returns { object } - подсвеченный объект или список выделенных объектов
     */
    getComponentDataForLink(): any {
    }
}
