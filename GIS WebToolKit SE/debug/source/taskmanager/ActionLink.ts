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

import Task from '~/taskmanager/Task';
import MapObject from '~/mapobject/MapObject';
import Action from '~/taskmanager/Action';
import SVGrenderer from '~/renderer/SVGrenderer';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { KeyboardDeviceEvent } from '~/input/KeyboardDevice';
import { WorkspaceValues } from '~/utils/WorkspaceManager';
import { DataChangedEvent } from '~/taskmanager/TaskManager';


/**
 * Родительский класс обработчика
 * @abstract
 * @class ActionLink
 * @extends DeviceAndMapEventListener
 */
export default abstract class ActionLink<T extends Task> extends Action<T> {


    protected action?: Action<any>;

    get linkId() {
        return this.action && this.action.id;
    }

    /**
     * Деструктор обработчика
     * @method destroy
     */
    destroy() {
        if ( this.action ) {
            this.linkAction();
        }
    }

    /**
     * Проверка возможности остановки обработчика
     * @method canClose
     * @return {boolean}
     */
    canClose() {
        if ( this.action ) {
            return this.action.canClose();
        }
        return true;
    }

    /**
     * Проверка возможности перемещения карты
     * @method canMapMove
     * @return {boolean}
     */
    canMapMove() {
        if ( this.action ) {
            return this.action.canMapMove();
        }
        return true;
    }

    /**
     * Проверка возможности выбора объекта
     * @method canSelectObject
     * @return {boolean}
     */
    canSelectObject() {
        if ( this.action ) {
            return this.action.canSelectObject();
        }
        return true;
    }

    canSelectThisObject( mapObject: MapObject ) {
        if ( this.action ) {
            return this.action.canSelectThisObject( mapObject );
        }
        return true;
    }

    canShowObjectPanel() {
        if ( this.action ) {
            return this.action.canShowObjectPanel();
        }
        return true;
    }

    selectObject( mapObject?: MapObject ) {
        if ( this.action ) {
            return this.action.selectObject( mapObject );
        }
    }

    setLinkAction( actionId?: string ) {
        this.getAction( actionId );
    }

    protected getAction( actionId?: string ) {
        if ( !actionId ) {
            return this.linkAction();

        }

        const action = this.parentTask.getAction( actionId );
        if ( action ) {
            return this.linkAction( action );
        }

    }

    protected linkAction( action?: Action<any> ) {
        if ( this.action ) {
            this.action.destroy();
            const actionDescription = this.parentTask.getActionDescription( this.action.id );
            if ( actionDescription ) {
                actionDescription.active = false;
            }
        }
        this.action = action;

        if ( this.action ) {
            this.action.setup();
            const actionDescription = this.parentTask.getActionDescription( this.action.id );
            if ( actionDescription ) {
                actionDescription.active = true;
            }
        }

        return this.action;
    }

    closeChildAction() {
        this.linkAction();
    }


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
        if ( this.action ) {
            this.action.onAnyActionOpen( actionId );
        }
    }

    /**
     * Обработчик события деактивации
     * @method onAnyActionClose
     * @param actionId {string} Идентификатор обработчика
     */
    onAnyActionClose( actionId: string ) {
        if ( this.action ) {
            this.action.onAnyActionClose( actionId );
        }
    }

    /**
     * Обработчик изменения данных
     * @method onDataChanged
     */
    onDataChanged( event: DataChangedEvent ) {
        if ( this.action ) {
            this.action.onDataChanged( event );
        }
    }

    /**
     * Обработчик события состояния карты и пользовательских настроек
     * @method onWorkspaceChanged
     * @param type {string} Тип события
     */
    onWorkspaceChanged( type: keyof WorkspaceValues ): void {
        if ( this.action ) {
            this.action.onWorkspaceChanged( type );
        }
    }

    /**
     * Обработчик сброса состояния карты и пользовательских настроек
     * @method onWorkspaceReset
     */
    onWorkspaceReset(): void {
        if ( this.action ) {
            this.action.onWorkspaceReset();
        }
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
        if ( this.action ) {
            this.action.onPreRender( renderer );
        }
    }

    /**
     * Обработчик события после отрисовки карты
     * @method onPostRender
     */
    onPostRender( renderer: SVGrenderer ) {
        if ( this.action ) {
            this.action.onPostRender( renderer );
        }
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
        if ( this.action ) {
            this.action.onMouseDown( event );
        }
    }

    /**
     * Обработчик отпускания клавиши мыши
     * @method onMouseUp
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseUp( event: MouseDeviceEvent ) {
        if ( this.action ) {
            this.action.onMouseUp( event );
        }
    }

    /**
     * Обработчик события клика по карте
     * @method onMouseClick
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseClick( event: MouseDeviceEvent ) {
        if ( this.action ) {
            return this.action.onMouseClick( event );
        }
    }

    /**
     * Обработчик события отложенного клика по карте (если не было двойного клика)
     * @method onMouseDelayedClick
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseDelayedClick( event: MouseDeviceEvent ) {
        if ( this.action ) {
            this.action.onMouseDelayedClick( event );
        }
    }

    /**
     * Завершение работы с объектом
     * @method commit
     */
    commit() {
        if ( this.action ) {
            return this.action.commit();
        }
        return false;
    }

    /**
     * Отмена действий с объектом
     * @method revert
     */
    revert() {
        if ( this.action ) {
            this.action.revert();
        }
    }

    /**
     * Обработчик события движения курсора
     * @method onMouseMove
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseMove( event: MouseDeviceEvent ) {
        if ( this.action ) {
            this.action.onMouseMove( event );
        }
    }

    /**
     * Обработчик события вращения колесика
     * @method onMouseWheel
     * @param event {MouseDeviceEvent} Объект события
     */
    onMouseWheel( event: MouseDeviceEvent ) {
        if ( this.action ) {
            this.action.onMouseWheel( event );
        }
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
        if ( this.action ) {
            this.action.onKeyDown( e );
        }
    }

    /**
     * Обработчик отпускания клавиши клавиатуры
     * @method onKeyUp
     * @param e {KeyboardDeviceEvent} Объект события
     */
    onKeyUp( e: KeyboardDeviceEvent ) {
        if ( this.action ) {
            this.action.onKeyUp( e );
        }
    }

    /**
     * Установить состояние обработчика
     * @method setState
     * @param key {string} Ключ (идентификатор команды)
     * @param value {any} Значение
     */
    setState( key: string, value: any ) {
        if ( this.action ) {
            this.action.setState( key, value );
        }
    }

}
