/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Задача измерений по карте                        *
 *                                                                  *
 *******************************************************************/

import './GwtkMeasurementsTask.css';
import MapWindow, { SaveObjectPanelProps } from '~/MapWindow';
import Task, { ActionDescription } from '~/taskmanager/Task';
import GwtkMeasurementsWidget from './GwtkMeasurementsWidget.vue';
import { AppendPointActionState } from '~/systemActions/AppendPointAction';
import ControlRulerActionLink from '@/components/GwtkMeasurements/actions/ControlRulerActionLink';
import ControlAreaActionLink from '@/components/GwtkMeasurements/actions/ControlAreaActionLink';
import ControlAngleActionLink from '@/components/GwtkMeasurements/actions/ControlAngleActionLink';
import DeleteObjectAction from '~/systemActions/DeleteObjectAction';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';
import Utils from '~/services/Utils';
import {
    ActionModePanel,
    MODE_PANEL_KEYS,
    PRIMARY_PANEL_ID,
    SAVE_PANEL_ID,
    SECONDARY_PANEL_ID,
    ACTION_COMMIT,
    ACTION_CANCEL,
    ActionMode
} from '~/taskmanager/Action';
import {
    PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE, PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER,
    WorkspaceValues
} from '~/utils/WorkspaceManager';
import AppendPointActionMeasurement from '@/components/GwtkMeasurements/actions/AppendPointActionMeasurement';
import QuickEditActionMeasurement from '@/components/GwtkMeasurements/actions/QuickEditActionMeasurement';

export const CREATE_MODE_ACTION = 'gwtkmeasurements.createmode';
export const EDIT_MODE_ACTION = 'gwtkmeasurements.editmode';
export const DELETE_MODE_ACTION = 'gwtkmeasurements.deletemode';
export const CONTROL_RULER_ACTION = 'gwtkmeasurements.controlruler';
export const CONTROL_AREA_ACTION = 'gwtkmeasurements.controlarea';
export const CONTROL_ANGLE_ACTION = 'gwtkmeasurements.controlangle';
export const UPDATE_RESULT_TYPE = 'gwtkmeasurement.updateresulttype';


type PanelIds = typeof PRIMARY_PANEL_ID | typeof SECONDARY_PANEL_ID | typeof SAVE_PANEL_ID;

export type GwtkMeasurementTaskState = {
    [ CREATE_MODE_ACTION ]: boolean;
    [ EDIT_MODE_ACTION ]: boolean;
    [ DELETE_MODE_ACTION ]: boolean;
    [ CONTROL_RULER_ACTION ]: boolean;
    [ CONTROL_AREA_ACTION ]: boolean;
    [ CONTROL_ANGLE_ACTION ]: boolean;
    [ UPDATE_RESULT_TYPE ]: boolean;
    [ ACTION_CANCEL ]: undefined;
    [ ACTION_COMMIT ]: undefined;
} & AppendPointActionState;


type WidgetParams = {
    buttons: (ActionDescription | undefined)[];
    linkPanel: {
        components: ActionDescription[];
        result?: string;
    };
    modePanel: {
        [PRIMARY_PANEL_ID]: ActionMode | undefined;
        [SECONDARY_PANEL_ID]: ActionMode | undefined;
        [SAVE_PANEL_ID]: ActionMode | undefined;
    };
    setState: GwtkMeasurementsTask['setState'];
};

/**
 * Задача измерений по карте
 * @class GwtkMeasurementsTask
 * @extends Task
 */
export default class GwtkMeasurementsTask extends Task {


    private geoJsonLayer!: GeoJsonLayer;

    /**
     * Слой для объектов
     * @private
     * @readonly
     * @property vectorLayer {GeoJsonLayer}
     */
    get vectorLayer() {
        return this.geoJsonLayer;
    }

    /**
     * Идентификатор объекта карты
     * @private
     * @property mapObjectId {string}
     */
    private mapObjectId = '';

    protected workspaceData?: { layerXId: string; };

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * @constructor GwtkMeasurementsTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        //создание и регистрация обработчиков и описаний
        this.actionRegistry.push( {
            getConstructor() {
                return AppendPointActionMeasurement;
            },
            id: CREATE_MODE_ACTION,
            active: false,
            enabled: true,
            options: {
                icon: 'object-creation',
                title: 'phrases.Create'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return QuickEditActionMeasurement;
            },
            id: EDIT_MODE_ACTION,
            active: false,
            enabled: true,
            options: {
                icon: 'quick-edit',
                title: 'phrases.Edit'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return DeleteObjectAction;
            },
            id: DELETE_MODE_ACTION,
            active: false,
            enabled: true,
            options: {
                icon: 'delete-object',
                title: 'phrases.Delete'
            }
        } );

        this.actionRegistry.push( {
            getConstructor() {
                return ControlRulerActionLink;
            },
            id: CONTROL_RULER_ACTION,
            active: false,
            enabled: true,
            options: {
                icon: 'ruler',
                title: 'phrases.Measure distance'
            }
        } );

        this.actionRegistry.push( {
            getConstructor() {
                return ControlAreaActionLink;
            },
            id: CONTROL_AREA_ACTION,
            active: false,
            enabled: true,
            options: {
                icon: 'measurements-square',
                title: 'phrases.Area of polygon'
            }
        } );

        this.actionRegistry.push( {
            getConstructor() {
                return ControlAngleActionLink;
            },
            id: CONTROL_ANGLE_ACTION,
            active: false,
            enabled: true,
            options: {
                icon: 'measurements-angle',
                title: 'phrases.Measure angles'
            }
        } );

        this.widgetProps = {
            buttons: [
                this.getActionDescription( CONTROL_RULER_ACTION ),
                this.getActionDescription( CONTROL_AREA_ACTION ),
                this.getActionDescription( CONTROL_ANGLE_ACTION )
            ],
            linkPanel: {
                components: [],
                result: ''
            },
            modePanel: {
                [ PRIMARY_PANEL_ID ]: undefined,
                [ SECONDARY_PANEL_ID ]: undefined,
                [ SAVE_PANEL_ID ]: undefined

            },
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            taskId: this.id,
            setState: this.setState.bind( this )
        };
    }

    setup() {
        super.setup();

        if ( !this.workspaceData ) {
            this.workspaceData = { layerXId: Utils.generateGUID() };
        }

        const vectorLayer = this.map.getVectorLayerByxId( this.workspaceData.layerXId );

        if ( vectorLayer ) {
            this.geoJsonLayer = vectorLayer as GeoJsonLayer;
        } else {
            this.geoJsonLayer = new GeoJsonLayer( this.map, {
                alias: this.map.translate( 'Measurements' ),
                id: Utils.generateGUID(),
                url: '',
                objnamesemantic: ['ObjName']
            }, {
                type: 'FeatureCollection',
                crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG:3857' } },
                features: []
            }, { isReadonly: true, isLocked: false } );
            this.map.vectorLayers.push( this.geoJsonLayer );
            this.geoJsonLayer.onAdd();

            this.workspaceData.layerXId = this.geoJsonLayer.xId;
            this.writeWorkspaceData( true );
        }
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const name = 'GwtkMeasurementsWidget';
        const source = GwtkMeasurementsWidget;
        this.mapWindow.registerComponent( name, source );

        // создание экземпляра Vue компонента
        this.mapWindow.createWidget( name, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    /**
     * Добавить панель сохранения для планшета
     * @param modePanelDescription
     */
    createModePanel( modePanelDescription: ActionModePanel ) {
        MODE_PANEL_KEYS.forEach( ( key ) => {
            const modePanel = modePanelDescription[ key ];
            if ( modePanel !== undefined && key in this.widgetProps.modePanel ) {
                this.widgetProps.modePanel[ key ] = modePanel;
            }
        } );

        const saveObjectPanelProps: SaveObjectPanelProps = {
            saveActive: false,
            visiblePanel: true,
            modePanel: modePanelDescription
        };
        this.mapWindow.showSaveObjectPanel( saveObjectPanelProps );
    }


    /**
     * Удалить панели
     * @param modePanelId
     */
    removeModePanel(modePanelId?: PanelIds) {
        if ( modePanelId !== undefined ) {
            this.widgetProps.modePanel[ modePanelId ] = undefined;
        } else {
            MODE_PANEL_KEYS.forEach( ( key ) => {
                if ( key in this.widgetProps.modePanel ) {
                    this.widgetProps.modePanel[ key ] = undefined;
                }
            } );
            const saveObjectPanelProps: SaveObjectPanelProps = {
                saveActive: false,
                visiblePanel: false,
                modePanel: {}
            };
            this.mapWindow.showSaveObjectPanel( saveObjectPanelProps );
        }
    }

    setState<K extends keyof GwtkMeasurementTaskState>( key: K, value: GwtkMeasurementTaskState[K] ) {
        switch ( key ) {
            case CONTROL_RULER_ACTION:
            case CONTROL_AREA_ACTION:
            case CONTROL_ANGLE_ACTION:
                this.setAction( key, value as boolean );
                break;
            case ACTION_COMMIT:
                if ( this._action ) {
                    this._action.commit();
                }
                break;
            case ACTION_CANCEL:
                if ( this._action ) {
                    this._action.revert();
                }
                break;
            default:
                if ( this._action ) {
                    this._action.setState( key, value );
                }
        }
    }

    /**
     * Создать кнопки линкования обработчиков
     * @method createLinkPanel
     * @param actionModeIds {string[]} Массив идентификаторов обработчиков (кнопок)
     */
    createLinkPanel( actionModeIds: string[] ) {
        const actionModeDescriptions: ActionDescription[] = [];
        actionModeIds.forEach( ( value ) => {
            const actionModeDescription = this.getActionDescription( value );
            if ( actionModeDescription ) {
                actionModeDescriptions.push( actionModeDescription );
            }
        } );

        this.widgetProps.linkPanel.components = actionModeDescriptions;
    }

    /**
     * Удалить кнопки линкования обработчиков
     * @method removeLinkPanel
     */
    removeLinkPanel() {
        this.widgetProps.linkPanel.components = [];
        this.setResult( '' );
    }

    /**
     * Установить состояние обработчика
     * @private
     * @method setAction
     * @param id {string} Идентификатор обработчика
     * @param active {boolean} Флаг - включить(true)/выключить(false)
     */
    private setAction( id: string, active: boolean ) {
        this.widgetProps.linkPanel.components = [];
        if ( active ) {
            if ( this._action ) {
                this.quitAction( this._action.id );
            }
            this.doAction( id );
        } else {
            this.quitAction( id );
            this.map.clearActiveObject();
        }
    }

    quitAction( id: string ) {
        if ( id == CREATE_MODE_ACTION ) {
            if ( this._action ) {
                this._action.commit();
            }
        }
        super.quitAction( id );
    }

    /**
     * Установить отображаемый результат
     * @method setResult
     * @param [value] {string} Результат вычислений
     */
    setResult( value?: string ) {
        this.widgetProps.linkPanel.result = value;
    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( [PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER, PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE, PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA].indexOf( type ) !== -1 ) {
            this._action?.setState( UPDATE_RESULT_TYPE, true );
        }
    }

    onWorkspaceReset() {
        this._action?.setState( UPDATE_RESULT_TYPE, true );
    }
}
