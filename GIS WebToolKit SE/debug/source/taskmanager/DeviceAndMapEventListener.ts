/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Абстрактный класс слушателя событий                  *
 *                                                                  *
 *******************************************************************/

import SVGrenderer from '~/renderer/SVGrenderer';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { KeyboardDeviceEvent } from '~/input/KeyboardDevice';
import { WorkspaceValues } from '~/utils/WorkspaceManager';
import MapObject from '~/mapobject/MapObject';
import { DataChangedEvent } from '~/taskmanager/TaskManager';

/**
 * Абстрактный класс слушателя событий
 * @abstract
 * @class DeviceAndMapEventListener
 */
export default abstract class DeviceAndMapEventListener {

    /*************************************************************
     *                                                           *
     *                Обработчики событий окна                   *
     *                                                           *
     ************************************************************/

    /**
     * Обработчик события активации
     * @method onAnyActionOpen
     * @param actionId {string} Идентификатор обработчика
     */
    onAnyActionOpen( actionId: string ) {
    }

    /**
     * Обработчик события деактивации
     * @method onAnyActionClose
     * @param actionId {string} Идентификатор обработчика
     */
    onAnyActionClose( actionId: string ) {
    }

    /**
     * Обработчик изменения данных
     * @method onDataChanged
     * @param event {DataChangedEvent} Объект события
     */
    onDataChanged(event:DataChangedEvent) {
    }

    /**
     * Обработчик события выделения объектов
     * @method onSelectObjects
     * @param [mapObject] {MapObject} Объект карты
     */
    onSelectObjects( mapObject?: MapObject[] ) {
    }


    /**
     * Обработчик завершения поиска
     * @method onSearchResultChanged
     */
    onSearchResultChanged() {
    }

    /**
     * Обработчик события состояния карты и пользовательских настроек
     * @method onWorkspaceChanged
     * @param type {string} тип события
     */
    onWorkspaceChanged( type: keyof WorkspaceValues ): void {
    }

    /**
     * Обработчик сброса состояния карты и пользовательских настроек
     * @method onWorkspaceReset
     */
    onWorkspaceReset(): void {
    }

    /*************************************************************
     *                                                           *
     *            Обработчики событий цикла отрисовки            *
     *                                                           *
     ************************************************************/

    /**
     * Обработчик события перед рисованием карты
     * @method onPreRender
     */
    onPreRender( renderer: SVGrenderer ) {
    }

    /**
     * Обработчик события после отрисовки карты
     * @method onPostRender
     */
    onPostRender( renderer: SVGrenderer ) {
    }


    /*************************************************************
     *                                                           *
     *              Обработчики событий мыши                     *
     *                                                           *
     ************************************************************/

    /**
     * Обработчик нажатия клавиши мыши
     * @method onMouseDown
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseDown( event: MouseDeviceEvent ) {
    }

    /**
     * Обработчик отпускания клавиши мыши
     * @method onMouseUp
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseUp( event: MouseDeviceEvent ) {
    }

    /**
     * Обработчик события клика по карте
     * @method onMouseClick
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseClick( event: MouseDeviceEvent ): void | true {
    }

    /**
     * Обработчик события отложенного клика по карте (если не было двойного клика)
     * @method onMouseDelayedClick
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseDelayedClick( event: MouseDeviceEvent ) {
    }

    /**
     * Обработчик события движения курсора
     * @method onMouseMove
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseMove( event: MouseDeviceEvent ) {
    }

    /**
     * Обработчик события вращения колесика
     * @method onMouseWheel
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseWheel( event: MouseDeviceEvent ) {
    }


    /*************************************************************
     *                                                           *
     *               Обработчики событий клавиатуры              *
     *                                                           *
     ************************************************************/

    /**
     * Обработчик нажатия клавиши клавиатуры
     * @method onKeyDown
     * @param e {KeyboardDeviceEvent} Объект события
     */
    onKeyDown( e: KeyboardDeviceEvent ) {
    }

    /**
     * Обработчик отпускания клавиши клавиатуры
     * @method onKeyUp
     * @param e {KeyboardDeviceEvent} Объект события
     */
    onKeyUp( e: KeyboardDeviceEvent ) {
    }
}
