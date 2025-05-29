/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Виджет компонента объект Росреестра              *
 *                                                                  *
 *******************************************************************/


import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    ABORT_SEARCH,
    ACTIVE_BY_COORDINATION_IN_MAP,
    CHANGE_TAB,
    CLICK_SEARCH_BUTTON,
    GET_SEMANTIC_LIST,
    CHANGE_ROSREESTR_OBJECT,
    GwtkRosreestrObjectTaskState,
    GwtkSemanticListForComparison,
    REMOVE_POINT_MAP,
    SELECT_POINT_ACTION,
    SHOW_OBJECT_IN_MAP,
    START_SEARCH,
    UPDATE_SEARCH_PROGRESS_BAR,
    UPDATE_SEARCH_TEXT
} from '@/components/GwtkRosreestrObject/task/GwtkRosreestrObjectTask';
import MapObject from '~/mapobject/MapObject';

/**
 * Виджет компонента
 * @class GwtkPrintMapWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkRosreestrObjectWidget extends BaseGwtkVueComponent {

    @Prop({ default: '' })
    private readonly taskId!: string;

    @Prop({ default: () => ({}) })
    private readonly description!: TaskDescription;

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkRosreestrObjectTaskState>(key: K, value: GwtkRosreestrObjectTaskState[K]) => void;

    @Prop({ default: true })
    private readonly showDialog!: boolean;

    @Prop({ default: [] })
    private readonly mapObjectSemantics!: GwtkSemanticListForComparison[];

    @Prop({ default: 0 })
    private readonly typeObject!: number;

    @Prop({ default: '' }) searchText!: string;

    @Prop({ default: () => false }) showInMap!: boolean;

    @Prop({ default: '' })
    private readonly cadNumberText!: string;

    @Prop({ default: true }) searchProgressBar!: boolean;

    @Prop({ default: false })
    private readonly byGetCoordinationInMap!: boolean;

    @Prop({ default: -1 })
    readonly objectIndex!: number;

    @Prop({ default: () => ([]) })
    private readonly mapObjects!: MapObject[];


    get mapClickFlag(): boolean {
        return this.byGetCoordinationInMap;
    }

    set mapClickFlag(value: boolean) {
        this.setState(ACTIVE_BY_COORDINATION_IN_MAP, value);
    }

    get activeTabWidget(): number {
        return this.typeObject;
    }

    set activeTabWidget(value: number) {
        this.setState(CHANGE_TAB, value);
        this.setState(START_SEARCH, undefined);
    }

    /**
     * Текущий номер объекта
     */
    get objectCurrent(): number {
        return this.objectIndex;
    }

    set objectCurrent(value: number) {
        this.setState(CHANGE_ROSREESTR_OBJECT, value);
    }

    /*
     * Признак наличия следующего объекта
     */
    get hasNextObject(): boolean {
        return (this.mapObjects.length > 0 && this.objectCurrent < this.mapObjects.length - 1);
    }

    /*
     * Признак наличия предыдущего объекта
     */
    get hasPreviousObject(): boolean {
        return (this.mapObjects.length > 1 && this.objectCurrent >= 1);
    }

    /**
     * Проверить найден ли объект
     * @method showObject
     */
    get showObject() {
        return this.mapObjectSemantics.length > 0;
    }

    created() {
        this.setState(SELECT_POINT_ACTION, true);
    }

    /**
     * Обработчик изменений в поле ввода
     * @method onInput
     * @param value {string} Текущее значение в поле ввода
     */
    onInput(value: string) {
        this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
        this.setState(UPDATE_SEARCH_TEXT, value);
    }

    /**
     * Выполнить поиск
     * @method search
     */
    search() {
        this.setState(CLICK_SEARCH_BUTTON, 0);
        this.setState(START_SEARCH, undefined);
    }

    /**
     * Очистить поиск
     * @method clearSearchText
     */
    clearSearchText() {
        this.setState(REMOVE_POINT_MAP, undefined);
        this.mapClickFlag = true;
    }


    /**
     * Отобразить объект на карте
     */
    showObjectInMap() {
        this.setState(SHOW_OBJECT_IN_MAP, undefined);
    }

    /**
     * Закрыли оверлей
     */
    closeOverlay() {
        this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
        this.setState(ABORT_SEARCH, undefined);
    }

    /**
     * Информация о следующем объекте
     */
    nextObjectInfo() {
        if (this.hasNextObject) {
            this.objectCurrent = this.objectCurrent + 1;
            this.objectInfo();
        }
    }


    /**
     * Информация о предыдущем объекте
     */
    prevObjectInfo() {
        if (this.hasPreviousObject) {
            this.objectCurrent = this.objectCurrent - 1;
            this.objectInfo();
        }
    }

    /**
     * Информация об объекте
     */
    private objectInfo() {
        if (this.objectCurrent >= 0 && this.objectCurrent < this.mapObjects.length) {
            this.setState(GET_SEMANTIC_LIST, true);
        }
    }
}
