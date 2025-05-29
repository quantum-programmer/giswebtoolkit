/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Панель ввода координат с клавиатуры                *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    CREATE_OBJECT_MANUAL_INPUT_COORDS_ADD_POINT,
    CREATE_OBJECT_MANUAL_INPUT_COORDS_BUTTON_CANCEL,
    CREATE_OBJECT_MANUAL_INPUT_COORDS_BUTTON_OK,
    CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_POINT_HEIGHT,
    CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_X,
    CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_Y,
    CREATE_OBJECT_MANUAL_INPUT_COORDS_IMPORT_FROM_JSON_FILE,
    CREATE_OBJECT_MANUAL_INPUT_COORDS_REMOVE_POINT,
    CREATE_OBJECT_MANUAL_INPUT_COORDS_REVERSE_DIRECTION,
    GwtkMapEditorTaskState,
    PublishObject,
    SET_PUBLISH_OBJECT_CRS,
} from '../../../task/GwtkMapEditorTask';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG } from '~/utils/WorkspaceManager';
import { MapObjectType } from '~/mapobject/MapObject';


/**
 * Виджет компонента
 * @class GwtkMapEditorManualInputCoords
 * @extends BaseGwtkVueComponent
*/
@Component
export default class GwtkMapEditorManualInputCoords extends BaseGwtkVueComponent {
    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkMapEditorTaskState>(key: K, value: GwtkMapEditorTaskState[K]) => void;

    @Prop({ default: () => ({}) })
    readonly publishObject!: PublishObject;

    get isMeters() {
        return true;
    }

    get latitudeTitle(): string {
        return 'X';
    }

    get longitudeTitle(): string {
        return 'Y';
    }

    get unitTitle() {
        return ':';
    }

    get isAddNewPointReady() {
        if (this.publishObject.mapObjectType === MapObjectType.Point && this.publishObject.coordinatesList.length > 0) {
            return false;
        }
        return true;
    }
    get isReady() {
        if (this.publishObject.mapObjectType === MapObjectType.Polygon && this.publishObject.coordinatesList.length < 4) {
            return false;
        } else if (this.publishObject.mapObjectType === MapObjectType.LineString && this.publishObject.coordinatesList.length < 2) {
            return false;
        } else if (this.publishObject.mapObjectType === MapObjectType.Point && this.publishObject.coordinatesList.length < 1) {
            return false;
        }
        return true;
    }
    /**
     * Изменить значения поле "Долгота"
     * @method changeX
     * @param positionNumber{number} Индекс точки в контуре
     * @param value{number}
     */
    changeX(positionNumber: number, value: string) {
        if (!isNaN(+value)) {
            this.setState(CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_X, { positionNumber, value });
        }
    }
    /**
     * Изменить значения поле "Широта"
     * @method changeY
     * @param positionNumber{number} Индекс точки в контуре
     * @param value{number}
     */
    changeY(positionNumber: number, value: string) {
        if (!isNaN(+value)) {
            this.setState(CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_Y, { positionNumber, value });
        }
    }
    /**
     * Изменить значения поле "Высота"
     * @method changePointHeight
     * @param positionNumber{number} Индекс точки в контуре
     * @param value{number}
     */
    changePointHeight(positionNumber: number, value: string) {
        if (!isNaN(+value)) {
            this.setState(CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_POINT_HEIGHT, { positionNumber, value });
        }
    }
    /**
     * Добавить новую точку
     * @method addNewPoint
     */
    addNewPoint() {
        this.setState(CREATE_OBJECT_MANUAL_INPUT_COORDS_ADD_POINT, undefined);
    }
    /**
    * Удалить точку
    * @method removePoint
    * @param pointNumber {Number} Номер точки
    */
    removePoint(pointNumber: number) {
        this.setState(CREATE_OBJECT_MANUAL_INPUT_COORDS_REMOVE_POINT, pointNumber);
    }
    /**
     * Выбор системы координат
     * @method changePublishObjectCrs
     * @param value { string} строка со значением EPSG
     */
    changePublishObjectCrs(value: string) {
        this.setState(SET_PUBLISH_OBJECT_CRS, value);
    }

    /**
     * Применить параметры создания объекта
     * @method apply
     */
    apply() {
        this.setState(CREATE_OBJECT_MANUAL_INPUT_COORDS_BUTTON_OK, undefined);
    }
    /**
     * Отменить создание объекта
     * @method cancel
     */
    cancel() {
        this.setState(CREATE_OBJECT_MANUAL_INPUT_COORDS_BUTTON_CANCEL, undefined);
    }
    /**
    * Получить иконку для функций меню
    * @method getListItemIcon
    * @param value {string} Строковое описание функции
    */
    getListItemIcon(value: string) {
        if (value === CREATE_OBJECT_MANUAL_INPUT_COORDS_REVERSE_DIRECTION) {
            return 'mdi-swap-vertical';
        } else if (value === CREATE_OBJECT_MANUAL_INPUT_COORDS_IMPORT_FROM_JSON_FILE) {
            return 'mdi-file-plus';
        } else return 'mdi-file-upload';
    }

    /** 
    * Запустить функцию из выпадающего меню
    * @method processItem
    * @param action {K} Название действия
    * @param value {GwtkMapEditorTaskState[K]} Значение
    */
    processItem<K extends keyof GwtkMapEditorTaskState>(action: K, value: GwtkMapEditorTaskState[K]) {
        this.setState(action, value);
    }

    get isReducedSizeInterface() {
        return this.mapVue.getMap().workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
    }
    isLastPolygonPoint(positionNumber: number) {
        return (positionNumber === this.publishObject.coordinatesList.length - 1) && (this.publishObject.mapObjectType === MapObjectType.Polygon);
    }

    get crsItems() {
        return this.publishObject.crsList.list.map(item => ({
            ...item,
            title: `${item.name} (${item.epsg})`,
        }));
    }
}