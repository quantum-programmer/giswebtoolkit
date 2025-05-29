/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент отображения масштаба карты            *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkMapScaleViewerWidget from '@/components/GwtkMapScaleViewer/task/GwtkMapScaleViewerWidget.vue';
import i18n from '@/plugins/i18n';
import Trigonometry from '~/geo/Trigonometry';
import { VIEW_SETTINGS_ZOOM_LEVEL, WorkspaceValues } from '~/utils/WorkspaceManager';


export const CHANGE_MODE = 'gwtkmapscaleviewer.changemode';
export type GwtkMapScaleViewerTaskState = {
    [ CHANGE_MODE ]: undefined;
}

type WidgetParams = {
    setState: GwtkMapScaleViewerTask['setState'];
    scale: number;
    ruleroptions: {                    // параметры линейки
        maxWidth: 100;
        reductionCoefficient: 0.00027;
        metric: true;
        width: string;
        text: string;
    };
    rulermode: boolean;
}


/**
 * Компонент отображения масштаба карты
 * @class GwtkMapScaleViewerTask
 * @extends Task
 * @description
 */
export default class GwtkMapScaleViewerTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    protected workspaceData?: { rulerModeFlag: boolean; };

    /**
     * @constructor GwtkMapScaleViewerTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            setState: this.setState.bind( this ),
            scale: 0,
            ruleroptions: {                    // параметры линейки
                maxWidth: 100,
                reductionCoefficient: 0.00027,
                metric: true,
                width: '0px',
                text: ''
            },
            rulermode: false
        };

        this.updateScale();
        this.updateRulerValue();
    }

    setup() {
        super.setup();
        if ( !this.workspaceData ) {
            this.workspaceData = { rulerModeFlag: false };
            this.writeWorkspaceData();
        }
        this.widgetProps.rulermode = this.workspaceData.rulerModeFlag;
    }

    /**
     * регистрация Vue компонента
     */
    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkMapScaleViewerWidget';
        const sourceWidget = GwtkMapScaleViewerWidget;
        this.mapWindow.registerComponent( nameWidget, sourceWidget );

        // Создание Vue компонента
        this.mapWindow.createFooterWidget( nameWidget, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    setState<K extends keyof GwtkMapScaleViewerTaskState>( key: K, value: GwtkMapScaleViewerTaskState[ K ] ) {
        switch ( key ) {
            case CHANGE_MODE:
                this.widgetProps.rulermode = !this.widgetProps.rulermode;
                if ( !this.workspaceData ) {
                    this.workspaceData = { rulerModeFlag: this.widgetProps.rulermode };
                } else {
                    this.workspaceData.rulerModeFlag = this.widgetProps.rulermode;
                }
                this.writeWorkspaceData( true );
                break;
        }
    }

    canShowTooltip(): boolean {
        return true;
    }

    /**
     * Установить масштаб
     */
    updateScale() {
        this.widgetProps.scale = this.map.getZoomScale( this.map.options.tilematrix );
    }


    updateRulerValue() {
        const map = this.map;
        const sizeX = map.getWindowSize()[ 0 ];
        if ( this.widgetProps.ruleroptions.metric && sizeX > 0 ) {
            const scale = this.widgetProps.scale;
            const geoPoint = map.getCenterGeoPoint();
            if ( geoPoint ) {
                const widthMeters = scale * sizeX * this.widgetProps.ruleroptions.reductionCoefficient * Math.cos( Trigonometry.toRadians( geoPoint.getLatitude() ) );
                const rulerMeters = widthMeters * (this.widgetProps.ruleroptions.maxWidth / sizeX);
                const rulesMetersStrLen = (Math.floor( rulerMeters ) + '').length;
                const pow10 = Math.pow( 10, rulesMetersStrLen - 1 );
                const number = rulerMeters / pow10;
                let numberRounded = 1;
                if ( number >= 10 ) {
                    numberRounded = 10;
                } else if ( number >= 5 ) {
                    numberRounded = 5;
                } else if ( number >= 3 ) {
                    numberRounded = 3;
                } else if ( number >= 2 ) {
                    numberRounded = 2;
                }
                const meters = pow10 * numberRounded;

                this.widgetProps.ruleroptions.width = Math.round( this.widgetProps.ruleroptions.maxWidth * meters / rulerMeters ) + 'px';
                if ( meters < 1000 ) {
                    this.widgetProps.ruleroptions.text = meters + ' ' + i18n.t( 'phrases.m' );
                } else {
                    this.widgetProps.ruleroptions.text = meters / 1000 + ' ' + i18n.t( 'phrases.km' );
                }
            }
        }
    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( type === VIEW_SETTINGS_ZOOM_LEVEL ) {
            this.updateScale();
            this.updateRulerValue();
        }
    }

}
