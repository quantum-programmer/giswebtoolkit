/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Задача "Динамический сценарий"               *
 *                                                                  *
 *                                                                  *
 *******************************************************************/


import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import GwtkMotionScenarioWidget from './GwtkMotionScenarioWidget.vue';
import { MessageQueueCommand } from '~/3d/engine/worker/workerscripts/queue';
import WorkerManager from '~/3d/engine/worker/workermanager';
import { ScenarioData, ScenarioParams } from '~/services/RequestServices/RestService/Types';
import Mediator from '~/3d/engine/utils/Mediator';

export const ON_INPUT_SEARCH = 'gwtkmotionscenario.oninputsearch';
export const TOGGLE_SCENARIO_ITEM = 'gwtkmotionscenario.togglescenarioitem';
export const TOGGLE_EXECUTE = 'gwtkmotionscenario.toggleexecute';
export const TOGGLE_CANCEL = 'gwtkmotionscenario.togglecancel';
export const TOGGLE_FINISH = 'gwtkmotionscenario.togglefinish';
export const TOGGLE_PAUSE = 'gwtkmotionscenario.togglepause';
export const UPDATE_SCENARIO_SPEED = 'gwtkmotionscenario.updatescenariospeedd';

export type GwtkMotionScenarioTaskState = {
    [ TOGGLE_SCENARIO_ITEM ]: string;
    [ TOGGLE_EXECUTE ]: undefined;
    [ TOGGLE_FINISH ]: undefined;
    [ TOGGLE_PAUSE ]: undefined;
    [ TOGGLE_CANCEL ]: undefined;
    [ ON_INPUT_SEARCH ]: string;
    [ UPDATE_SCENARIO_SPEED ]: number;
};

export enum ScenarioMode {
    ACTIVE,
    PAUSED,
    TURNED_ON,
    TURNED_OFF
}

type WidgetParams = {
    setState: GwtkMotionScenarioTask['setState'];

    scenarioList: ScenarioParams[];
    activeItemId: string | undefined;
    isScenarioStarted: boolean;
    isScenarioPaused: boolean;
    tickList: number[];
}

/**
 * Задача "Динамический сценарий"
 * @class GwtkMotionScenarioTask
 * @extends Task
 */
export default class GwtkMotionScenarioTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & SimpleJson<any>}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private readonly map3d = this.map.mapTool( '3dMap' );

    private defCoords = [];
    private _scenarioCollection: ScenarioData[] = [];

    private scenarioDataLayer: any = null;
    private scenarioParams = {};

    private _messageQueue = WorkerManager.getWorker();

    private speedMult: number | null = 0;

    private _activeScenario: number | null = null;
    private _mode: ScenarioMode = ScenarioMode.TURNED_OFF;
    private timer: number | null = null;

    private defaultRoutes: ScenarioParams[] = [];

    /**
     * @constructor GwtkMotionScenarioTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        // Создание Vue компонента
        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            taskId: this.id,
            setState: this.setState.bind( this ),

            scenarioList: [],
            activeItemId: undefined,
            isScenarioStarted: false,
            isScenarioPaused: false,
            tickList: [
                0.25,
                0.5,
                1,
                3,
                5,
                7,
                10
            ]
        };

    }

    private get map3dData() {
        const map3d = this.map3d;
        if ( map3d.initialized ) {
            return map3d.map3dData;
        }
        return undefined;
    }

    setup() {
        super.setup();

        const scenarioList = this.map3dData.getScenarioList();
        for ( let i = 0; i < scenarioList.length; i++ ) {
            this._uploadScenario( scenarioList[ i ] );
        }

        this.defaultRoutes.push( ...scenarioList );

        this.fillRouteList();

        Mediator.publish( 'tool3dMenuToggle', { id: this.id, isActive: true } );

        this.speedMult = this.widgetProps.tickList[ 0 ];
    }

    private fillRouteList( searchValue?: string ) {
        this.widgetProps.scenarioList.splice( 0 );
        if ( searchValue ) {
            for ( let i = 0; i < this.defaultRoutes.length; i++ ) {

                const item = this.defaultRoutes[ i ];

                if ( item.alias.toLowerCase().includes( searchValue.toLowerCase() ) ) {
                    this.widgetProps.scenarioList.push( item );
                }

            }
        } else {
            this.widgetProps.scenarioList.push( ...this.defaultRoutes );
        }
    }

    createTaskPanel() {
        const nameWidget = 'GwtkMotionScenarioWidget';
        const sourceWidget = GwtkMotionScenarioWidget;
        this.mapWindow.registerComponent( nameWidget, sourceWidget );

        this.mapWindow.createWindowWidget( nameWidget, this.widgetProps );

        this.addToPostDeactivationList( this.widgetProps );
    }

    /**
     * Завершить работу компонента
     * @method destroy
     * @public
     */
    destroy() {
        super.destroy();

        this._setMode( ScenarioMode.TURNED_OFF );

        this.defCoords = [];
        this._scenarioCollection = [];

        Mediator.publish( 'tool3dMenuToggle', { id: this.id, isActive: false } );
    }

    setState<K extends keyof GwtkMotionScenarioTaskState>( key: K, value: GwtkMotionScenarioTaskState[K] ) {
        switch ( key ) {
            case ON_INPUT_SEARCH:
                this.fillRouteList( value as string );
                break;

            case TOGGLE_SCENARIO_ITEM:
                if ( this.widgetProps.activeItemId === value as string ) {
                    this.widgetProps.activeItemId = undefined;
                } else {
                    this.widgetProps.activeItemId = value as string;
                }
                break;

            case TOGGLE_EXECUTE:
                this._setMode( ScenarioMode.ACTIVE );
                const recId = this.widgetProps.scenarioList.findIndex( item => item.id === this.widgetProps.activeItemId );
                if ( this.widgetProps.activeItemId && this.setUpScenario( recId ) ) {
                    this.widgetProps.isScenarioStarted = true;
                }
                break;

            case TOGGLE_CANCEL:
                this.map.getTaskManager().detachTask( this.widgetProps.taskId );
                break;

            case TOGGLE_FINISH:
                this.widgetProps.isScenarioStarted = false;
                this.widgetProps.isScenarioPaused = false;
                this._setMode( ScenarioMode.TURNED_OFF );
                break;

            case TOGGLE_PAUSE:
                this.widgetProps.isScenarioPaused = !this.widgetProps.isScenarioPaused;
                this._toggleMode();
                break;

            case UPDATE_SCENARIO_SPEED:
                const tickIndex = value as number;
                if ( tickIndex >= 0 && this.widgetProps.tickList[ tickIndex ] ) {
                    this._setSpeedValue( this.widgetProps.tickList[ tickIndex ] );
                }
                break;
        }
    }

    /**
     * Смена состояния (движения/паузы)
     * @method _toggleMode
     * @private
     */
    private _toggleMode() {
        if ( this._mode === ScenarioMode.ACTIVE ) {
            this._setMode( ScenarioMode.PAUSED );
        } else if ( this._mode === ScenarioMode.PAUSED ) {
            this._setMode( ScenarioMode.ACTIVE );
        }
    }

    /**
     * Установить режим работы
     * @method _setMode
     * @private
     * @param mode {ScenarioMode} Режим
     */
    private _setMode( mode: ScenarioMode ) {
        if ( mode != null ) {
            this._mode = mode;
            switch ( mode ) {
                case ScenarioMode.TURNED_ON:
                    this._turnOn();
                    break;
                case ScenarioMode.TURNED_OFF:
                    this._turnOff();
                    break;
                case ScenarioMode.ACTIVE:
                    this._resumeScenario();
                    break;
                case ScenarioMode.PAUSED:
                    this._pauseScenario();
                    break;
            }
        }
    }

    /**
     * Включить режим
     * @method _turnOn
     * @private
     */
    private _turnOn() {
        debugger;
        if ( this.speedMult ) {
            this._setSpeedValue( this.speedMult );
        }
    }

    /**
     * Выключить режим
     * @method _turnOff
     * @private
     */
    private _turnOff() {

        if ( this.scenarioDataLayer !== null && Object.keys( this.scenarioDataLayer ).length ) {
            this.scenarioDataLayer.destroy();
        }
        this._activeScenario = null;

        Mediator.publish( 'deactivateToolbar3dComponent', { id: this.id } );
    }

    /**
     * Продолжить выполнение сценария
     * @method _resumeScenario
     * @private
     */
    private _resumeScenario() {
        if ( this.scenarioDataLayer ) {
            this.scenarioDataLayer.activate( true );
        }
    }

    /**
     * Приостановить выполнение сценария
     * @method _pauseScenario
     * @private
     */
    private _pauseScenario() {
        if ( this.scenarioDataLayer ) {
            this.scenarioDataLayer.deactivate();
        }
    }

    /**
     * Установить сценарий
     * @method setUpScenario
     * @private
     * @param recId
     */
    private setUpScenario( recId: number ): boolean {

        if ( this._activeScenario !== recId ) {
            this.defCoords.length = 0;

            if ( this._scenarioCollection[ recId ] && this._scenarioCollection[ recId ].scenarioParams ) {
                const scenarioJson = this._scenarioCollection[ recId ].scenarioParams;
                if ( scenarioJson != null ) {
                    this._activeScenario = recId;

                    this.scenarioDataLayer = new GWTK.gEngine.Scene.ScenarioDataLayer(
                        this.map3dData,
                        this._scenarioCollection[ recId ].scenarioParams,
                        this._scenarioCollection[ recId ].dataScenario,
                        this.speedMult
                    );

                    this._startScenario();
                    return true;
                }

            }

        }
        return false;
    }

    /**
     * Запустить исполенеие сценария
     * @method _startScenario
     * @private
     */
    private _startScenario() {
        this.scenarioDataLayer.turnedOn( ScenarioMode.TURNED_ON );
        this.timer = window.setInterval( () => this.timerFunc(), 1200 );
    }

    private timerFunc() {
        if ( Object.keys( this.scenarioDataLayer ).length && this.scenarioDataLayer.getData ) {
            window.clearInterval( this.timer! );
            this._setMode( ScenarioMode.ACTIVE );
        } else {
            this._setMode( ScenarioMode.TURNED_OFF );
        }
    }

    /**
     * Установить значение скорости
     * @method _setSpeedValue
     * @private
     * @param value{number} Новое значение скокрости
     */
    private _setSpeedValue( value: number ) {
        if ( value !== this.speedMult ) {
            this.speedMult = value;
            if ( this.scenarioDataLayer ) {
                this.scenarioDataLayer.setAnimationSpeedValue( this.speedMult );
            }
        }
    }

    /**
     * Загрузить сценарий
     * @param scenarioParams
     * @private
     */
    private _uploadScenario( scenarioParams: ScenarioParams ) {
        let url;
        if ( scenarioParams.url !== null && scenarioParams.url !== '' ) {
            url = scenarioParams.url;
        } else {
            url = this.map3dData.getMapState().getMapServiceURL();
        }


        const jsObj3D = {
            LAYER: scenarioParams.id
            //,
            // startScenario: 0
        };

        const command = MessageQueueCommand.getScenarioParam;
        const data = {
            jsRpc: jsObj3D,
            serviceUrl: url,
            scenarioParams: scenarioParams,
            command
        };
        this._messageQueue.post(
            this._messageQueue.createMessageData(
                scenarioParams.id, data, 0, 100000 ),
            { onLoad: this._onGetScenario.bind( this ) } as any );//TODO ???
    }

    /**
     * Обработка загрузки сценария
     * @method _onGetScenario
     * @param responseData
     * @param message
     * @private
     */
    private _onGetScenario( responseData: { jsonfile: ScenarioData['dataScenario'] }, message: any ) {
        if ( responseData === null ) {
            return;
        }
        if ( this._mode === null ) {
            return;
        }
        const dataScenario = responseData.jsonfile;
        const scenarioParams = message.messageParams.scenarioParams;

        if ( dataScenario == null || !Reflect.has( dataScenario, 'FileScenario' ) ) {
            Mediator.publish( 'writeProtocol', {
                text: 'The file is not in the format ScenarioJson: ' + scenarioParams.alias,
                displayFlag: true
            } );
        } else {
            this.scenarioParams = scenarioParams;
            this._scenarioCollection.push(
                {
                    dataScenario: dataScenario as ScenarioData['dataScenario'],
                    scenarioParams: scenarioParams
                } );

        }
    }


}


