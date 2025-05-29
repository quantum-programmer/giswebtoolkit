/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент "Масштабирование по рамке                 *
 *                    Увеличить изображение"                        *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import { Bounds } from '~/geometry/Bounds';
import i18n from '@/plugins/i18n';
import { ACTION_CANCEL, ACTION_COMMIT } from '~/taskmanager/Action';
import SelectScalingFrameAction from '~/systemActions/SelectScalingFrameAction';

export const SELECT_POLYGON_ACTION = 'gwtkframescalingin.selectpolygonaction';

export type GwtkFrameScalingInTaskState = {
    [ ACTION_COMMIT ]: Bounds;
    [ ACTION_CANCEL ]: undefined;
}

/**
 * Компонент "Масштабирование по рамке увеличить изображение"
 * @class GwtkFrameScalingInTask
 * @extends Task
 */

export default class GwtkFrameScalingInTask extends Task {

    /**
     * @constructor GwtkFrameScalingInTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );
        this.actionRegistry.push(
            {
                getConstructor() {
                    return SelectScalingFrameAction;
                },
                id: SELECT_POLYGON_ACTION,
                active: true,
                enabled: true
            } );
    }

    setup() {
        this.doAction( SELECT_POLYGON_ACTION );
        if ( this._action?.id !== SELECT_POLYGON_ACTION ) {
            this.endTask();
            this.mapWindow.addSnackBarMessage( i18n.tc( 'phrases.The scaling box component could not be started' ) + '. ' + i18n.tc( 'phrases.(Unable to stop active task)' ) );
        }
    }

    onAnyActionClose(id: string) {
        if (SELECT_POLYGON_ACTION === id) {
            this.mapWindow.getTaskManager().detachTask(this.id);
        }
    }

    /**
     * Установить текущие параметры
     * @method setState
     */
    setState<K extends keyof GwtkFrameScalingInTaskState>( key: K, value: GwtkFrameScalingInTaskState[K] ) {

        switch ( key ) {
            case ACTION_COMMIT:
                const bounds = value as Bounds;
                this.map.showMapExtentPlane( bounds.min, bounds.max );
                this.endTask();
                break;
            case ACTION_CANCEL:
                this.endTask();
        }
    }

    private endTask() {
        //чтобы заблокировать поиск в точке при втором клике
        window.setTimeout( () => this.mapWindow.getTaskManager().detachTask( this.id ), 30 );
    }
}

