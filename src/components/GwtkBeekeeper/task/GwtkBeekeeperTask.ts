/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Задача "Пчеловод"                            *
 *                                                                  *
 *******************************************************************/


import Task, { ActionDescription } from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkBeekeeperWidget from '@/components/GwtkBeekeeper/task/GwtkBeekeeperWidget.vue';
import AppendPointAction from '~/systemActions/AppendPointAction';
import DeleteObjectAction from '~/systemActions/DeleteObjectAction';
import ControlBeekeepersPointActionLink from '@/components/GwtkBeekeeper/actions/ControlBeekeepersPointActionLink';
import {
    ActionModePanel,
    MODE_PANEL_KEYS,
    PRIMARY_PANEL_ID,
    SECONDARY_PANEL_ID,
    ActionMode
} from '~/taskmanager/Action';
import { LogEventType } from '~/types/CommonTypes';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import { MapObjectSemanticType } from '~/mapobject/MapObjectSemantics';
import VectorLayer from '~/maplayers/VectorLayer';
import { FeatureSemanticItem } from '~/utils/GeoJSON';
import GISWebServiceVectorLayer from '~/maplayers/GISWebServiceVectorLayer';
import { GISWebServiceSEMode, SourceType } from '~/services/Search/SearchManager';
import SVGrenderer from '~/renderer/SVGrenderer';
import GwtkBeekeeperCommonService from '@/components/GwtkBeekeeper/task/GwtkBeekeeperCommonService';
import { BrowserService } from '~/services/BrowserService';
import { DataChangedEvent } from '~/taskmanager/TaskManager';
import ControlBeekeepersPointEditAction from '@/components/GwtkBeekeeper/actions/ControlBeekeepersPointEditAction';

export const CREATE_MODE_ACTION = 'gwtkbeekeeper.createmodeaction';
export const CREATE_MODE_BY_GEOLOCATION_ACTION = 'gwtkbeekeeper.createmodebygeolocationaction';
export const EDIT_MODE_ACTION = 'gwtkbeekeeper.editmodeaction';
export const EDIT_APIARY_POSITION_BY_GEOLOCATION_ACTION = 'gwtkbeekeeper.editapiarypositionbygeolocationaction';
export const DELETE_MODE_ACTION = 'gwtkbeekeeper.deletemodeaction';
export const ADD_OBJECT = 'gwtkbeekeeper.addobject';
export const EDIT_OBJECT = 'gwtkbeekeeper.editobject';
export const CLOSE_OBJECT_CHANGING_PANEL = 'gwtkbeekeeper.closeobjectchangingpanel';
export const UPDATE_OBJECT_SEMANTIC = 'gwtkbeekeeper.updateobjectsemantic';
export const CONTROL_BEEKEEPER_POINT_ACTION = 'gwtkbeekeeper.controlbeekeeperpointaction';
export const SET_BEEKEEPER_INSTALLATION_DATE = 'gwtkbeekeeper.setbeekeeperinstallationdate';
export const GET_BEEKEEPER_MAP_OBJECTS = 'gwtkbeekeeper.getbeekeepermapobjects';
export const FIND_NEXT_BEEKEEPER_MAP_OBJECTS = 'gwtkbeekeeper.findnextbeekeepermapobjects';
export const HIGHLIGHT_BEEKEEPER_SELECTED_OBJECT = 'gwtkbeekeeper.highlightbeekeeperselectedobject';
export const SELECT_MAP_OBJECT_AND_OPEN_BEEKEEPER_EDIT_PANEL = 'gwtkbeekeeper.selectmapobjectandopenbeekeepereditform';
export const UPDATE_ACTUAL_OBJECTS_LIST = 'gwtkbeekeeper.updateactualobjectslist';


export type BeekeepersRequest = {
    status: string,
    error: {
        message: string,
        code: number
    },
    result: BeekeepersRequestResult[]
};

export type BeekeepersRequestResult = {
    key: string | number,
    value: string | number,
    name?: string,
    type?: MapObjectSemanticType,
    hidden?: boolean,
    disabled?: boolean
}

export type BeekeepersRequestAdditionalInformation = {
    status: string,
    error: {
        message: string,
        code: number
    },
    result: {
        sprav_hazard_classes: BeekeepersRequestResult[]
    }
}

export type PostDataForDB = {
    type: string;
    params: {
        key: string,
        value: string
    }[]
}

export type GwtkBeekeeperTaskState = {
    [CREATE_MODE_ACTION]: boolean;
    [CREATE_MODE_BY_GEOLOCATION_ACTION]: boolean;
    [EDIT_MODE_ACTION]: boolean;
    [EDIT_APIARY_POSITION_BY_GEOLOCATION_ACTION]: boolean;
    [DELETE_MODE_ACTION]: boolean;
    [CONTROL_BEEKEEPER_POINT_ACTION]: boolean;
    [SET_BEEKEEPER_INSTALLATION_DATE]: string;
    [ADD_OBJECT]: boolean;
    [EDIT_OBJECT]: boolean;
    [CLOSE_OBJECT_CHANGING_PANEL]: boolean;
    [UPDATE_OBJECT_SEMANTIC]: BeekeepersRequestResult;
    [GET_BEEKEEPER_MAP_OBJECTS]: undefined;
    [FIND_NEXT_BEEKEEPER_MAP_OBJECTS]: undefined;
    [HIGHLIGHT_BEEKEEPER_SELECTED_OBJECT]: string;
    [SELECT_MAP_OBJECT_AND_OPEN_BEEKEEPER_EDIT_PANEL]: string;
    [UPDATE_ACTUAL_OBJECTS_LIST]: undefined;
};

type WidgetParams = {
    setState: GwtkBeekeeperTask['setState'];
    beekeeperInstallationValue: string;
    showPanelStyle: boolean;
    localeName: string;
    linkPanel: {
        components: ActionDescription[];
        result?: string;
        activeState: string;
    },
    modePanel: {
        [PRIMARY_PANEL_ID]: ActionMode | undefined;
        [SECONDARY_PANEL_ID]: ActionMode | undefined;
    },
    currentMapObject: MapObject | null;
    currentMapObjectDataFromDB: BeekeepersRequest | null;
    additionalInformation: BeekeepersRequestAdditionalInformation | null;
    mapObjects: MapObject[];
    foundMapObjectsNumber: number;
    selectedMapObject: string[];
    showMapObjectsUpdateOverlay: boolean;
}

/**
 * Команда создания компонента
 * @class GwtkBeekeeperTask
 * @extends Task
 */
export default class GwtkBeekeeperTask extends Task {

    /**
     * Слой для объектов
     * @readonly
     * @property vectorLayer {VectorLayer}
     */
    readonly vectorLayer: VectorLayer;

    /**
     * Новый объект
     * @property newMapObject { MapObject }
     */
    newMapObject: MapObject | null;

    /**
     * Выделенный объект на карте
     * @property selectedMapObjectInMap { MapObject }
     */
    selectedMapObjectInMap?: MapObject;

    /**
     * Идентификатор карты
     * @private
     * @readonly
     * @property layerId {string}
     */
    private readonly layerId: string = '';

    /**
     * Ссылка на выполняющий файл
     * @private
     * @readonly
     * @property urlToService {String}
     */
    private readonly urlToService = BrowserService.getAppURL() + 'apiaries.php';
    //private readonly urlToService = 'http://192.168.0.22/gwsse_rzd/apiaries.php';


    /**
     * Класс выполнения запросов к БД
     * @private
     * @readonly
     */
    private readonly requestService = new GwtkBeekeeperCommonService({url: this.urlToService});

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private readonly pointObjectTargetZoom: number;

    /**
     * @constructor GwtkBeekeeperTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        //создание и регистрация обработчиков и описаний
        this.actionRegistry.push( {
            getConstructor() {
                return AppendPointAction;
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
                return ControlBeekeepersPointEditAction;
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
            enabled: false,
            options: {
                icon: 'delete-object',
                title: 'phrases.Delete'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return ControlBeekeepersPointActionLink;
            },
            id: CONTROL_BEEKEEPER_POINT_ACTION,
            active: false,
            enabled: true,
            options: {
                icon: '',
                title: ''
            }
        } );

        let localization = 'ru-ru';
        if ( this.map.options.locale )
            localization = this.map.options.locale;

        // Параметры виджета
        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            setState: this.setState.bind( this ),
            beekeeperInstallationValue: '',
            showPanelStyle: false,
            localeName: localization,
            linkPanel: {
                components: [],
                result: 'To add an apiary, select its location on the map',
                activeState: 'add'
            },
            modePanel: {
                [ PRIMARY_PANEL_ID ]: undefined,
                [ SECONDARY_PANEL_ID ]: undefined
            },
            currentMapObject: null,
            currentMapObjectDataFromDB: null,
            additionalInformation: null,
            mapObjects: this.map.searchManager.mapObjects,
            foundMapObjectsNumber: this.map.searchManager.responseMapObjectCount,
            selectedMapObject: [],
            showMapObjectsUpdateOverlay: false
        };

        this.pointObjectTargetZoom = Math.max(18, this.map.zoomLevel );

        if ( this.map.options.settings_mapEditor?.maplayersid &&  this.map.options.settings_mapEditor?.maplayersid[0] ) {
            const wmsLayers = this.map.tiles.getWmsLayers();
            let existLayerId = '';
            wmsLayers.forEach( layer => {
                if ( layer.alias === 'Карта Пасек' ) {
                    existLayerId = layer.xId;
                }
            });
            const index = this.map.options.settings_mapEditor.maplayersid.indexOf(existLayerId);
            if ( index !== -1 && existLayerId !== '' ) {
                this.layerId = existLayerId;
            } else {
                this.layerId = this.map.options.settings_mapEditor.maplayersid[0];
            }
        }

        this.vectorLayer =  this.map.getVectorLayerByxId(this.layerId) as GISWebServiceVectorLayer;
        this.newMapObject = null;

        this.getObjectPropsFromDB().then();
        this.getAdditionalInformation();

    }

    setup() {
        this.setState( CONTROL_BEEKEEPER_POINT_ACTION, true );
    }

    createTaskPanel() {

        // регистрация Vue компонента
        const nameGwtkBeekeeperWidget = 'GwtkBeekeeperWidget';
        const sourceGwtkBeekeeperWidget = GwtkBeekeeperWidget;
        this.mapWindow.registerComponent( nameGwtkBeekeeperWidget, sourceGwtkBeekeeperWidget );

        // Создание Vue компонента
        this.mapWindow.createWidget( nameGwtkBeekeeperWidget, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    protected destroy() {
        super.destroy();
        this.map.searchManager.mapObjects.splice(0);
    }

    createModePanel( modePanelDescription: ActionModePanel ) {
        MODE_PANEL_KEYS.forEach( ( key ) => {
            const modePanel = modePanelDescription[key];
            if (modePanel !== undefined && (key === PRIMARY_PANEL_ID || key === SECONDARY_PANEL_ID)) {
                this.widgetProps.modePanel[key] = modePanel;
            }
        } );
    }

    removeModePanel( modePanelId: string ) {
        if (modePanelId === PRIMARY_PANEL_ID || modePanelId === SECONDARY_PANEL_ID) {
            this.widgetProps.modePanel[modePanelId] = undefined;
        } else {
            MODE_PANEL_KEYS.forEach((key) => {
                if (key === PRIMARY_PANEL_ID || key === SECONDARY_PANEL_ID) {
                    this.widgetProps.modePanel[key] = undefined;
                }
            });
        }
    }

    setState<K extends keyof GwtkBeekeeperTaskState>( key: K, value: GwtkBeekeeperTaskState[K] ) {
        switch ( key ) {
            case SET_BEEKEEPER_INSTALLATION_DATE:
                this.widgetProps.beekeeperInstallationValue = value as string;
                break;
            case CONTROL_BEEKEEPER_POINT_ACTION:
                this.setAction( key, value as boolean );
                if ( this._action ) {
                    this._action.setState( EDIT_MODE_ACTION, true );
                }
                break;
            case ADD_OBJECT:
                this.addNewObject();
                break;
            case EDIT_OBJECT:
                this.editObject();
                break;
            case CLOSE_OBJECT_CHANGING_PANEL:
                this.closeChangingPanel();
                break;
            case DELETE_MODE_ACTION:
                this.deleteObject();
                break;
            case UPDATE_OBJECT_SEMANTIC:
                this.updateObjectFiledAndSemantic( value as BeekeepersRequestResult );
                break;
            case GET_BEEKEEPER_MAP_OBJECTS:
                this.getBeeKeeperMapObjectsList(false);
                break;
            case FIND_NEXT_BEEKEEPER_MAP_OBJECTS:
                this.widgetProps.showMapObjectsUpdateOverlay = true;
                this.map.searchManager.findNext().then( ()=>{} ).catch( () =>{} ).finally( ()=>{
                    this.widgetProps.showMapObjectsUpdateOverlay = false;
                });
                break;
            case HIGHLIGHT_BEEKEEPER_SELECTED_OBJECT:
                this.highlightBeekeeperSelectedObject( value as string ).then();
                break;
            case SELECT_MAP_OBJECT_AND_OPEN_BEEKEEPER_EDIT_PANEL:
                this.selectMapObjectAndOpenBeekeeperEditPanel( value as string );
                break;
            case UPDATE_ACTUAL_OBJECTS_LIST:
                this.getBeeKeeperMapObjectsList(true);
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
    createLinkPanel(actionModeIds: string[]) {
        const actionModeDescriptions: ActionDescription[] = [];
        actionModeIds.forEach( ( value ) => {
            const actionModeDescription = this.getActionDescription( value );
            if ( actionModeDescription && actionModeDescription.enabled ) {
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
        this.widgetProps.linkPanel.result = '';
        this.widgetProps.linkPanel.activeState = '';
    }

    /**
     * Установить отображаемый результат
     * @method setResult
     * @param [value] {string} Результат вычислений
     */
    setResult( value?: string ) {
        this.widgetProps.linkPanel.result = value;
    }

    /**
     * Установить тип активного действы
     * @method setLinkPanelActiveState
     * @param value {string} тип включеного режима add | edit
     */
    setLinkPanelActiveState( value: string ) {
        this.widgetProps.linkPanel.activeState = value;
    }

    /**
     * Установить состояние обработчика
     * @private
     * @method setAction
     * @param id {string} Идентификатор обработчика
     * @param active {boolean} Флаг - включить(true)/выключить(false)
     */
    private setAction( id: string, active: boolean ) {
        if ( active ) {
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

    selectedActionType( id: string ) {
        this.widgetProps.showPanelStyle = id == EDIT_MODE_ACTION;
    }

    getWidgetPropsCurrentMapObject() {
        return this.widgetProps.currentMapObject;
    }

    setWidgetPropsCurrentMapObject( mapObject: MapObject ) {
        this.widgetProps.currentMapObject = mapObject;
    }

    async getObjectPropsFromDB() {
        const defaultRequestResult: BeekeepersRequest = {
            status: 'success',
            error: {
                message: '',
                code: 0
            },
            result: [
                {
                    key: 'id',
                    value: '',
                    name: 'Идентификатор записи',
                    type: MapObjectSemanticType.TNUMBER,
                    hidden: true,
                    disabled: true
                },
                {
                    key: 'id_Organ',
                    value: '',
                    name: 'Идентификатор организации',
                    type: MapObjectSemanticType.TNUMBER,
                    hidden: true,
                    disabled: true
                },
                {
                    key: 'name',
                    value: 'Новая пасека',
                    name: 'Наименование пасеки',
                    type: MapObjectSemanticType.TSTRING,
                    hidden: false,
                    disabled: false
                },
                {
                    key: 'passport',
                    value: '',
                    name: 'Номер ветеринарного паспорта на пасеку',
                    type: MapObjectSemanticType.TSTRING,
                    hidden: false,
                    disabled: false
                },
                {
                    key: 'address',
                    value: '',
                    name: 'Адрес',
                    type: MapObjectSemanticType.TSTRING,
                    hidden: false,
                    disabled: true
                },
                {
                    key: 'date_begin',
                    value: this.widgetProps.currentMapObject ? '' : new Date( Date.now() ) as unknown as string,
                    name: 'Дата установки',
                    type: MapObjectSemanticType.TDATE,
                    hidden: false,
                    disabled: false
                },
                {
                    key: 'family_count',
                    value: '',
                    name: 'Количество пчелосемей',
                    type: MapObjectSemanticType.TNUMBER,
                    hidden: false,
                    disabled: false
                },
                {
                    key: 'status',
                    value: '',
                    name: 'Статус опасности',
                    type: MapObjectSemanticType.TSTRING,
                    hidden: true,
                    disabled: true
                },
                {
                    key: 'radius',
                    value: '',
                    name: 'Радиус разлёта пчёл, м',
                    type: MapObjectSemanticType.TNUMBER,
                    hidden: true,
                    disabled: true
                },
                {
                    key: 'message',
                    value: '',
                    name: 'Сообщение об опасности',
                    type: MapObjectSemanticType.TSTRING,
                    hidden: false,
                    disabled: true
                },
                {
                    key: 'linksheet',
                    value: '',
                    name: 'Имя карты',
                    type: MapObjectSemanticType.TSTRING,
                    hidden: true,
                    disabled: true
                },
                {
                    key: 'linkobject',
                    value: '',
                    name: 'Имя объекта',
                    type: MapObjectSemanticType.TNUMBER,
                    hidden: true,
                    disabled: true
                },
                {
                    key: 'message_id',
                    value: '',
                    name: 'Идентификатор push-уведомления',
                    type: MapObjectSemanticType.TSTRING,
                    hidden: true,
                    disabled: true
                },
                {
                    key: 'message_status',
                    value: '',
                    name: 'Состояние отправки push-уведомлений',
                    type: MapObjectSemanticType.TSTRING,
                    hidden: true,
                    disabled: true
                },
                {
                    key: 'a_type',
                    value: '',
                    name: 'Тип пасеки',
                    type: MapObjectSemanticType.TNUMBER,
                    hidden: true,
                    disabled: true
                }
            ]
        };

        if ( this.widgetProps.currentMapObject ) {
            // По умолчанию
            this.widgetProps.currentMapObjectDataFromDB = null;
            const linkSheet = this.widgetProps.currentMapObject.sheetName || '';
            const linkObject = '' + (this.widgetProps.currentMapObject.objectNumber || '');
            let id_Organ = this.getOrganizationId();

            const result = await this.requestService.getBeekeepersObjectData(linkSheet, linkObject, id_Organ);

            if (result.data) {
                if (result.data.status && result.data.status === 'success') {
                    this.widgetProps.currentMapObjectDataFromDB = result.data;
                } else {
                    this.map.writeProtocolMessage({ text: result.data.error.message as string, type: LogEventType.Error });
                }
            } else {
                this.map.writeProtocolMessage({ text: result.error as string, type: LogEventType.Error });
            }
        } else {
            this.widgetProps.currentMapObjectDataFromDB = defaultRequestResult;
        }

        if (this.widgetProps.currentMapObjectDataFromDB && this.widgetProps.currentMapObjectDataFromDB.result) {
            this.widgetProps.currentMapObjectDataFromDB.result.forEach((item: BeekeepersRequestResult) => {
                this.updateObjectFiledAndSemantic(item, false);
            });
        }
    }

    /**
     * Получить справочник из БД
     * @method getAdditionalInformation
     */
    getAdditionalInformation() {
        this.widgetProps.additionalInformation = {
            status: 'success',
            error: {
                message: '',
                code: 0
            },
            result: {
                sprav_hazard_classes: []
            }
        };

        this.requestService.getBeekeepersAdditionalInformation().then((result) => {
            if ( result.data ) {
                if ( result.data.status && result.data.status === 'success' ) {
                    this.widgetProps.additionalInformation = result.data;
                } else {
                    this.map.writeProtocolMessage( { text: result.data.error.message as string, type: LogEventType.Error } );
                }
            } else {
                this.map.writeProtocolMessage( { text: result.error as string, type: LogEventType.Error } );
            }
        }).catch( ( error ) => {
            this.map.writeProtocolMessage( { text: error, type: LogEventType.Error } );
        });
    }

    /**
     * Добавить новый объект
     * @method addNewObject
     */
    addNewObject() {
        if ( this.newMapObject ) {
            this.widgetProps.showMapObjectsUpdateOverlay = true;
            this.requestService.addApiary( this.generatePostData('add').params ).then((result) => {
                if ( result.data ) {
                    if ( result.data.status && result.data.status === 'success' ) {
                        this.widgetProps.currentMapObject = this.newMapObject;
                        this.newMapObject = null;
                        this.map.requestRender();
                        this.sendRequestLoadLegend( this.vectorLayer.xId ).then(() =>{
                            this.closeChangingPanel();
                            this.getBeeKeeperMapObjectsList( true );
                        });
                    } else {
                        this.map.writeProtocolMessage( { text: result.data.error.message as string, type: LogEventType.Error, display: true } );
                        this.widgetProps.showMapObjectsUpdateOverlay = false;
                    }
                } else {
                    this.map.writeProtocolMessage( { text: result.error as string, type: LogEventType.Error, display: true } );
                    this.widgetProps.showMapObjectsUpdateOverlay = false;
                }
            }).catch( ( error ) => {
                this.map.writeProtocolMessage( { text: error, type: LogEventType.Error, display: true } );
                this.widgetProps.showMapObjectsUpdateOverlay = false;
            });
        }
    }

    onDataChanged(event:DataChangedEvent) {
        super.onDataChanged(event);
    }

    /**
     * Редактировать объект
     * @method editObject
     */
    editObject() {
        this.widgetProps.showMapObjectsUpdateOverlay = true;
        this.requestService.editApiary( this.generatePostData('edit').params ).then((result) => {
            if ( result.data ) {
                if ( result.data.status && result.data.status === 'success' ) {
                    this.closeChangingPanel();
                    this.getBeeKeeperMapObjectsList( true );
                } else {
                    this.map.writeProtocolMessage( { text: result.data.error.message as string, type: LogEventType.Error, display: true } );
                    this.widgetProps.showMapObjectsUpdateOverlay = false;
                }
            } else {
                this.map.writeProtocolMessage( { text: result.error as string, type: LogEventType.Error, display: true } );
                this.widgetProps.showMapObjectsUpdateOverlay = false;
            }
        }).catch( ( error ) => {
            this.map.writeProtocolMessage( { text: error, type: LogEventType.Error, display: true } );
            this.widgetProps.showMapObjectsUpdateOverlay = false;
        });
    }

    /**
     * Закрыть окно изменения объекта
     * @method closeChangingPanel
     */
    closeChangingPanel() {
        if ( this.widgetProps.currentMapObject ) {
            this.widgetProps.currentMapObject = null;
        }
        if ( this._action ) {
            this._action.setState( DELETE_MODE_ACTION, true );
        }
    }

    /**
     * Удалить объект
     * @method deleteObject
     */
    deleteObject() {
        if ( this.widgetProps.currentMapObject ) {
            this.widgetProps.currentMapObject.delete();
            this.requestService.deleteApiary( this.generatePostData('delete').params ).then((result) => {
                if ( result.data ) {
                    if ( result.data.status && result.data.status === 'success' ) {
                        if ( this._action ) {
                            this._action.setState( DELETE_MODE_ACTION, true );
                        }
                        this.getBeeKeeperMapObjectsList( true );
                    } else {
                        this.map.writeProtocolMessage( { text: result.data.error.message as string, type: LogEventType.Error, display: true } );
                        this.widgetProps.showMapObjectsUpdateOverlay = false;
                    }
                } else {
                    this.map.writeProtocolMessage( { text: result.error as string, type: LogEventType.Error, display: true } );
                    this.widgetProps.showMapObjectsUpdateOverlay = false;
                }
            }).catch( ( error ) => {
                this.map.writeProtocolMessage( { text: error, type: LogEventType.Error, display: true } );
                this.widgetProps.showMapObjectsUpdateOverlay = false;
            });
        } else {
            if ( this._action ) {
                this._action.setState( DELETE_MODE_ACTION, true );
            }
        }
    }

    /**
     * Обновить значения полей объекта и семантику объекта
     * @method updateObjectFiledAndSemantic
     * @property item {BeekeepersRequestResult}
     */
    updateObjectFiledAndSemantic(item: BeekeepersRequestResult, updateDB: boolean = true) {

        const objectEditableSemanticsList = [
            { keyInDB: 'name', semanticKey: 'NameApiary', semanticName: 'Наименование пасеки'},
            { keyInDB: 'passport', semanticKey: 'NumberPassportApiary', semanticName: 'Номер ветеринарного паспорта на пасеку'},
            { keyInDB: 'date_begin', semanticKey: 'DateApriary', semanticName: 'Дата установки пасеки'},
            { keyInDB: 'family_count', semanticKey: 'NumberBeeColonies', semanticName: 'Количество пчелосемей'}
        ];

        // Обновить данные для БД
        if (updateDB) {
            if (this.widgetProps.currentMapObjectDataFromDB && this.widgetProps.currentMapObjectDataFromDB.result.length > 0) {
                this.widgetProps.currentMapObjectDataFromDB.result.forEach((resultItem: BeekeepersRequestResult) => {
                    if (resultItem.key === item.key) {
                        resultItem.value = item.value;
                    }
                });
            }
        }

        // Обновить сематику объекта
        objectEditableSemanticsList.forEach( (editableSemantic) => {
            if ( editableSemantic.keyInDB === item.key ) {
                let value = item.value;
                if ( editableSemantic.keyInDB === 'date_begin' ) {
                    const date = new Date( item.value );
                    value = date.getFullYear() + '-' +
                        (date.getMonth() + 1).toString().padStart( 2, '0' ) + '-' +
                        date.getDate().toString().padStart( 2, '0' );
                }
                const featureSemantic: FeatureSemanticItem = {
                    key: editableSemantic.semanticKey,
                    value: value as string,
                    name: editableSemantic.semanticName
                };
                if ( this.newMapObject ) {
                    const semantic = this.newMapObject?.getSemantic(editableSemantic.semanticKey);
                    if ( semantic ) {
                        this.newMapObject?.updateSemantic(featureSemantic);
                    } else {
                        this.newMapObject?.addSemantic(featureSemantic);
                    }
                } else if ( this.widgetProps.currentMapObject ) {
                    const semantic = this.widgetProps.currentMapObject?.getSemantic(editableSemantic.semanticKey);
                    if ( semantic ) {
                        this.widgetProps.currentMapObject?.updateSemantic(featureSemantic);
                    } else {
                        this.widgetProps.currentMapObject?.addSemantic(featureSemantic);
                    }
                }
            }
        } );
    }

    /**
     * Создать запрос для отправки на сервер для создание или редактирования поле в БД
     * @method generatePostData
     * @property type {String}
     */
    generatePostData( type: string ) {
        let postParams:PostDataForDB = {type: type, params: []};
        const editableFieldsList: string[] = ['name', 'passport', 'date_begin', 'family_count'];
        let idOrganFromDb: string = '';
        let fieldIdFromDb: string = '';

        let currentMapObjectDataFromDB: BeekeepersRequestResult[] = this.widgetProps.currentMapObjectDataFromDB?.result || [];
        currentMapObjectDataFromDB.forEach((resultItem) => {
            if ( resultItem.key === 'id' ) {
                fieldIdFromDb = resultItem.value as string;
            }
            if ( resultItem.key === 'id_Organ' ) {
                idOrganFromDb = resultItem.value as string;
            }
            if ( editableFieldsList.indexOf(resultItem.key as string) > -1) {
                postParams.params.push( {
                    key: resultItem.key as string,
                    value: resultItem.value as string
                } );
            }
        });

        if ( type == 'add' ) {
            if ( this.newMapObject ) {
                const sheetName = this.newMapObject.sheetName as string;
                const objectNumber = this.newMapObject.objectNumber as unknown as string;

                if ( sheetName && sheetName !== '' ) {
                    postParams.params.push( {key: 'linksheet', value: sheetName} );
                    postParams.params.push( {key: 'linkobject', value: objectNumber} );
                }

                let id_Organ = this.getOrganizationId();
                postParams.params.push( {key: 'id_Organ', value: id_Organ} );

                const pointGeoPointList = this.newMapObject.getPointList()[0].toGeoPoint();
                if ( pointGeoPointList ) {
                    // В выходе получается точечный объект, по этому получаем данные с первого элемента из массива
                    postParams.params.push( {key: 'latitude', value: pointGeoPointList.getLatitude() as unknown as string} );
                    postParams.params.push( {key: 'longitude', value: pointGeoPointList.getLongitude() as unknown as string} );
                }
            }
        } else if ( type === 'edit' ) {
            if ( this.widgetProps.currentMapObject ) {
                const mapObject = this.widgetProps.currentMapObject;
                const sheetName = mapObject.sheetName as string;
                const objectNumber = mapObject.objectNumber as unknown as string;

                if ( sheetName && sheetName !== '' ) {
                    postParams.params.push( {key: 'linksheet', value: sheetName} );
                    postParams.params.push( {key: 'linkobject', value: objectNumber} );
                }

                if ( fieldIdFromDb && fieldIdFromDb !== '' ) {
                    postParams.params.push( {key: 'id', value: fieldIdFromDb} );
                }

                if ( idOrganFromDb && idOrganFromDb !== '' ) {
                    postParams.params.push( {key: 'id_Organ', value: idOrganFromDb} );
                } else {
                    let id_Organ = this.getOrganizationId();
                    postParams.params.push( {key: 'id_Organ', value: id_Organ} );
                }

                const pointGeoPointList = mapObject.getPointList()[0].toGeoPoint();
                if ( pointGeoPointList ) {
                    // В выходе получается точечный объект, по этому получаем данные с первого элемента из массива
                    postParams.params.push( {key: 'latitude', value: pointGeoPointList.getLatitude() as unknown as string} );
                    postParams.params.push( {key: 'longitude', value: pointGeoPointList.getLongitude() as unknown as string} );
                }
            }
        } else if ( type === 'delete' ) {
            if ( this.widgetProps.currentMapObject ) {
                const mapObject = this.widgetProps.currentMapObject;
                const sheetName = mapObject.sheetName as string;
                const objectNumber = mapObject.objectNumber as unknown as string;

                if ( sheetName && sheetName !== '' ) {
                    postParams.params.push( {key: 'linksheet', value: sheetName} );
                    postParams.params.push( {key: 'linkobject', value: objectNumber} );
                }

                if ( fieldIdFromDb && fieldIdFromDb !== '' ) {
                    postParams.params.push( {key: 'id', value: fieldIdFromDb} );
                }

                if ( idOrganFromDb && idOrganFromDb !== '' ) {
                    postParams.params.push( {key: 'id_Organ', value: idOrganFromDb} );
                } else {
                    let id_Organ = this.getOrganizationId();
                    postParams.params.push( {key: 'id_Organ', value: id_Organ} );
                }

            }
        }else {
            if ( this.widgetProps.currentMapObject ) {
                postParams.params.push( {key: 'linksheet', value: this.widgetProps.currentMapObject.sheetName as string} );
                postParams.params.push( {key: 'linkobject', value: this.widgetProps.currentMapObject.objectNumber as unknown as string} );
            }
        }

        return postParams;
    }

    /**
     * Получить идентификатор организации
     * @private
     * @method getOrganizationId
     */
    private getOrganizationId() {
        let idOrgan: string = '';
        if (Reflect.has(this.map.options, 'userData')) {
            const userData = (this.map.options as unknown as { userData: { permissions?: { organization?: { id: string; } } } }).userData;
            if (userData.permissions) {
                if (userData.permissions.organization) {
                    const organization = userData.permissions.organization;
                    if (organization.id) {
                        idOrgan = organization.id;
                    }
                }
            }
        }

        return idOrgan;
    }

    /**
     * Получить список объектов карты
     * @method getBeeKeeperMapObjectsList
     * @property update {Boolean} Пренудительное обновление
     */
    getBeeKeeperMapObjectsList( update: boolean ) {
        let forceUpdate: boolean = false;
        if ( update ) {
            forceUpdate = true;
        } else if ( this.widgetProps.mapObjects.length === 0 ) {
            forceUpdate = true;
        }

        if ( forceUpdate ) {
            this.widgetProps.showMapObjectsUpdateOverlay = true;
            const layers = this.map.tiles.getWmsLayers();
            layers.forEach( layer => {
                if ( layer.alias === 'Карта Пасек' ) {
                    layer.show();
                } else if ( layer.alias === 'Карта опасности' ) {
                    layer.show();
                }else {
                    layer.hide();
                }
            });

            this.selectedMapObjectInMap = undefined;
            this.map.searchManager.activateSource( SourceType.GISWebServiceSE, GISWebServiceSEMode.StrictSearch );
            this.map.searchManager.clearSearchCriteriaAggregator();
            const aggregator = this.map.searchManager.getSearchCriteriaAggregatorCopy();
            const srsNameSearchCriterion = aggregator.getSrsNameSearchCriterion();
            srsNameSearchCriterion.setValue( this.map.getCrsString() );
            this.mapWindow.getTaskManager().updateCriteriaAggregator( aggregator );
            this.map.searchManager.setSearchCriteriaAggregator( aggregator );
            this.map.searchManager.findNext().then( (result) =>{
                if ( result ) {
                    if ( result.mapObjects.length > 0 ) {
                        const bounds = result.mapObjects[ 0 ].getBounds().clone();
                        result.mapObjects.forEach( (mapObject: MapObject) => {
                            const currentBounds = mapObject.getBounds();
                            bounds.extend( currentBounds.min );
                            bounds.extend( currentBounds.max );
                        });
                        this.map.fitBounds( bounds );
                    }
                }
                this.widgetProps.foundMapObjectsNumber = this.map.searchManager.responseMapObjectCount;
                this.widgetProps.showMapObjectsUpdateOverlay = false;
            });
        }
    }

    /**
     * Выбранный объект добавить в список
     * @private
     * @method setObjectToSelectedObjectList
     * @param mapObjectGuid {string} Идентификатор объекта карты
     */
    private setObjectToSelectedObjectList( mapObjectGuid: string ) {
        if ( this.widgetProps.selectedMapObject.length === 0 ) {
            this.widgetProps.selectedMapObject.push( mapObjectGuid );
        } else {
            const index = this.widgetProps.selectedMapObject.indexOf( mapObjectGuid );
            if ( index !== -1 ) {
                this.widgetProps.selectedMapObject.splice(0);
            } else {
                this.widgetProps.selectedMapObject.splice(0);
                this.widgetProps.selectedMapObject.push( mapObjectGuid );
            }
        }
    }

    /**
     * Выделить выбранный объект на карте
     * @private
     * @async
     * @method highlightBeekeeperSelectedObject
     * @param mapObjectGuid {string} Идентификатор объекта карты
     */
    private async highlightBeekeeperSelectedObject( mapObjectGuid: string ) {
        this.setObjectToSelectedObjectList(mapObjectGuid);
        const mapObject = this.widgetProps.mapObjects.find((item: MapObject) => item.id === mapObjectGuid);
        if (this.widgetProps.selectedMapObject.length !== 0 && mapObject) {

            const mapBbox = this.map.getWindowBounds();
            if (!mapBbox.intersects(mapObject.getBounds())) {
                // переход в центр объекта
                const mapPoint = mapObject.getCenter();
                this.map.setMapCenter(mapPoint, true);
            } else {
                this.map.fitBounds(mapObject.getBounds());
            }

            // масштабируем для точечного объекта,
            // иначе точка будет вписываться в окно на максимально доступном масштабе,
            // либо переход к объекту вне экрана будет без масштабирования и его можем не увидеть
            if ( mapObject.type === MapObjectType.Point ) {
                this.map.setZoom( this.pointObjectTargetZoom );
            }

            if ( !mapObject.hasGeometry() ) {
                mapObject.loadGeometry().then( () => {
                    if ( mapObject.hasGeometry() ) {
                        this.selectedMapObjectInMap = mapObject;
                    }
                });
            } else {
                this.selectedMapObjectInMap = mapObject;
            }
        } else {
            this.selectedMapObjectInMap = undefined;
        }
    }

    /**
     * Выбрать объеккт на карте и открыть форму,
     * для редактирования параметров объекта в БД
     * @private
     * @method selectMapObjectAndOpenBeekeeperEditPanel
     * @param mapObjectGuid {string} Идентификатор объекта карты
     */
    private selectMapObjectAndOpenBeekeeperEditPanel( mapObjectGuid: string ) {
        this.widgetProps.selectedMapObject.splice(0);
        this.selectedMapObjectInMap = undefined;
        const selectedObject: MapObject[] = this.widgetProps.mapObjects.filter( (mapObject: MapObject) => {
            return mapObject.id === mapObjectGuid;
        });
        if ( selectedObject.length !== 0 ) {
            this.highlightBeekeeperSelectedObject( mapObjectGuid ).then( ()=>{
                selectedObject.forEach( (objectItem:MapObject)=>{
                    this.map.addSelectedObject( objectItem );
                });
                if ( !selectedObject[0].hasGeometry() ) {
                    selectedObject[0].loadGeometry().then( () => {
                        if ( selectedObject[0].hasGeometry() ) {
                            this.map.setActiveObject( selectedObject[0] );
                        }
                    });
                } else {
                    this.map.setActiveObject( selectedObject[0] );
                }
            });
        }
    }

    onPreRender() {
        if ( this.selectedMapObjectInMap ) {
            this.map.requestRender();
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        if ( this.selectedMapObjectInMap ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.selectedMapObjectInMap );
        }
    }

    /**
     * Загрузить легенду
     * @private
     * @async
     * @method sendRequestLoadLegend
     * @param layerId {string} Идентификатор карты
     */
    private async sendRequestLoadLegend( layerId: string ) {

        const mapLayer = this.map.getVectorLayerByxId(this.layerId) as GISWebServiceVectorLayer;

        mapLayer.clearLegend();
    }
}
