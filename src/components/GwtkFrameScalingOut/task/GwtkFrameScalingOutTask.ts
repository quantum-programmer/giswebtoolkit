/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент "Масштабирование по рамке                 *
 *                    Уменьшить изображение"                        *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import { Bounds } from '~/geometry/Bounds';
import { MapPoint } from '~/geometry/MapPoint';
import i18n from '@/plugins/i18n';
import { ACTION_CANCEL, ACTION_COMMIT } from '~/taskmanager/Action';
import SelectScalingFrameAction from '~/systemActions/SelectScalingFrameAction';

export const SELECT_POLYGON_ACTION = 'gwtkframescalingout.selectpolygonaction';

export type GwtkFrameScalingOutTaskState = {
    [ ACTION_COMMIT ]: Bounds;
    [ ACTION_CANCEL ]: undefined;
}

/**
 * Компонент "Масштабирование по рамке уменьшить изображение"
 * @class GwtkFrameScalingOutTask
 * @extends Task
 */

export default class GwtkFrameScalingOutTask extends Task {

    /**
     * @constructor GwtkFrameScalingOutTask
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
    setState<K extends keyof GwtkFrameScalingOutTaskState>( key: K, value: GwtkFrameScalingOutTaskState[K] ) {

        switch ( key ) {
            case ACTION_COMMIT:
                this.onMapFrame( value as Bounds );
                this.endTask();
                break;
            case ACTION_CANCEL:
                this.endTask();
        }
    }

    private endTask() {
        window.setTimeout( () => this.mapWindow.getTaskManager().detachTask( this.id ), 30 );
    }

    /**
     * Вписать карту в рамку
     * @method onMapFrame
     */
    private onMapFrame( bounds: Bounds ) {
        if ( !this.map && !bounds ) {
            return;
        }

        let frame: {
            width: number
            height: number,
            left: number,
            top: number,
        } = {
            height: 0,
            left: 0,
            top: 0,
            width: 0
        };
        frame.width = Math.abs( this.mapWindow.getMap().planeToPixel( bounds.max ).x - this.mapWindow.getMap().planeToPixel( bounds.min ).x );
        frame.height = Math.abs( this.mapWindow.getMap().planeToPixel( bounds.max ).y - this.mapWindow.getMap().planeToPixel( bounds.min ).y );

        const winSize = this.map.getWindowSize();

        const s1 = frame.width * frame.height;
        const s2 = winSize[ 0 ] * winSize[ 1 ];
        const scaleFrame = s1 / s2;
        const scaleCurrent = Math.ceil( this.mapWindow.getMap().getZoomScale( this.mapWindow.getMap().getZoom() ) );

        const scaleNew = this.map.zoomLimit( this.map.getScaleZoom( (scaleCurrent / scaleFrame) * 1.5 ) );

        const coordinateCenter = new MapPoint( (bounds.max.x - bounds.min.x) / 2 + bounds.min.x, (bounds.max.y - bounds.min.y) / 2 + bounds.min.y );

        this.map.setView( coordinateCenter, scaleNew );

        this.map.overlayRefresh();
    }
}
