/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Родительский класс обработчика                   *
 *                                                                  *
 *******************************************************************/

import DeviceAndMapEventListener from '~/taskmanager/DeviceAndMapEventListener';
import Task from '~/taskmanager/Task';
import MapWindow, { ButtonDescription } from '~/MapWindow';
import { GwtkMap } from '~/types/Types';
import MapObject from '~/mapobject/MapObject';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';


export const PRIMARY_PANEL_ID = 'gwtk.action.primarypanelid';
export const SECONDARY_PANEL_ID = 'gwtk.action.secondarypanelid';
export const SAVE_PANEL_ID = 'gwtk.action.savepanelid';

export const MODE_PANEL_KEYS: (keyof ActionModePanel)[] = [PRIMARY_PANEL_ID, SECONDARY_PANEL_ID, SAVE_PANEL_ID];

export type ActionMode = {
    enabled: boolean;
    title?: string;
    visible: boolean;
    buttons: ButtonDescription[];
};

export type ActionModePanel = {
    [ PRIMARY_PANEL_ID ]?: ActionMode;
    [ SECONDARY_PANEL_ID ]?: ActionMode;
    [ SAVE_PANEL_ID ]?: ActionMode;
}

export const ACTION_COMMIT = 'gwtk.action.actioncommit';
export const ACTION_CANCEL = 'gwtk.action.actioncancel';

/**
 * Родительский класс обработчика
 * @abstract
 * @class Action
 * @extends DeviceAndMapEventListener
 */
export default abstract class Action<T extends Task> extends DeviceAndMapEventListener {

    /**
     * Экземпляр родительской задачи
     * @protected
     * @readonly
     * @property parentTask {Task}
     */
    protected readonly parentTask: T;

    /**
     * Идентификатор обработчика
     * @readonly
     * @property id {string}
     */
    readonly id: string;

    /**
     * Экземпляр окна карты
     * @protected
     * @readonly
     * @property mapWindow {MapWindow}
     */
    protected readonly mapWindow: MapWindow;

    /**
     * Экземпляр карты
     * @protected
     * @readonly
     * @property map {GwtkMap}
     */
    protected readonly map: GwtkMap;

    /**
     * @constructor Action
     * @param task {Task} Экземпляр родительской задачи
     * @param id {string} Идентификатор обработчика
     */
    constructor( task: T, id: string ) {
        super();

        this.parentTask = task;
        this.id = id;

        this.mapWindow = task.mapWindow;
        this.map = this.mapWindow.getMap();
        this.map.writeDebugLog();
    }

    /**
     * Деструктор обработчика
     * @method destroy
     */
    destroy() {
        this.map.writeDebugLog();
    }

    /**
     * Установить в родительской задаче себя в качестве активного обработчика
     * @method setTaskAction
     */
    setTaskAction() {
        this.parentTask.action = this;
    }

    /**
     * Удалить в родительской задаче активный обработчик
     * @method clearTaskActon
     */
    clearTaskActon() {
        this.parentTask.action = undefined;
    }

    /**
     * Запуск обработчика
     * @method setup
     */
    setup() {
        this.map.writeDebugLog();
    }

    /**
     * Завершение работы с объектом
     * @method commit
     */
    commit() {
        this.map.writeDebugLog();
    }


    /**
     * Отмена действий с объектом
     * @method revert
     */
    revert() {
        this.map.writeDebugLog();
    }

    /**
     * Выполнить действие
     * @method run
     */
    run() {
        this.map.writeDebugLog();
    }

    /**
     * Остановка обработчика
     * @protected
     * @method close
     */
    protected close() {
        this.map.writeDebugLog();
        this.parentTask.closeAction( this.id );
    }

    /**
     * Принудительная остановка обработчика
     * @protected
     * @method quit
     */
    protected quit() {
        this.map.writeDebugLog();
        this.parentTask.quitAction( this.id );
    }

    /**
     * Обработчик события выбора объекта
     * @method selectObject
     * @param [mapObject] {MapObject} Объект карты
     */
    selectObject( mapObject?: MapObject ) {
        this.map.writeDebugLog();
    }

    /**
     * Проверка возможности остановки обработчика
     * @method canClose
     * @return {boolean}
     */
    canClose() {
        return true;
    }

    /**
     * Проверка возможности отображения всплывающей информации объекта
     * @method canShowTooltip
     * @return {boolean}
     */
    canShowTooltip() {
        return false;
    }

    /**
     * Проверка возможности перемещения карты
     * @method canMapMove
     * @return {boolean}
     */
    canMapMove() {
        return false;
    }

    /**
     * Проверка возможности выбора объекта
     * @method canSelectObject
     * @return {boolean}
     */
    canSelectObject() {
        return false;
    }

    /**
     * Проверка возможности выбора данного объекта
     * @method canSelectThisObject
     * @param mapObject {MapObject} Объект карты
     * @return {boolean}
     */
    canSelectThisObject( mapObject: MapObject ) {
        return true;
    }

    /**
     * Проверка возможности отображения панели объектов
     * @method canShowObjectPanel
     * @return {boolean}
     */
    canShowObjectPanel() {
        return true;
    }

    /**
     * Установить состояние обработчика
     * @method setState
     * @param key {string} Ключ (идентификатор команды)
     * @param value {any} Значение
     */
    setState( key: string, value: any ) {
        this.map.writeDebugLog();
    }

    /**
     * Обновить критерии поиска
     * @method updateCriteriaAggregator
     * @param criteriaAggregator {CriteriaAggregator} Копия агрегатора критериев для правки
     */
    updateCriteriaAggregator( criteriaAggregator: CriteriaAggregator ) {
    }

    protected async loadMapObjects(): Promise<MapObject[] | undefined> {
        const result = await this.map.searchManager.findWithinBounds( this.map.getWindowBounds() );
        if ( result && result.mapObjects ) {
            return MapObject.sortMapObjectsByType( result.mapObjects );
        }
    }
}
