/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Задача "Растениевод"                          *
 *                                                                  *
 *******************************************************************/

import Task, { ActionDescription } from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkPlantBreederWidget from '@/components/GwtkPlantBreeder/task/GwtkPlantBreederWidget.vue';
import DeleteObjectAction from '~/systemActions/DeleteObjectAction';
import { LogEventType } from '~/types/CommonTypes';
import {
    ActionModePanel,
    MODE_PANEL_KEYS,
    PRIMARY_PANEL_ID,
    SECONDARY_PANEL_ID,
    ActionMode
} from '~/taskmanager/Action';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import ControlPlantBreederPolygonActionLink from '@/components/GwtkPlantBreeder/action/ControlPlantBreederPolygonActionLink';
import { MapObjectSemanticType } from '~/mapobject/MapObjectSemantics';
import { BrowserService } from '~/services/BrowserService';
import VectorLayer from '~/maplayers/VectorLayer';
import GISWebServiceVectorLayer from '~/maplayers/GISWebServiceVectorLayer';
import { GISWebServiceSEMode, SourceType } from '~/services/Search/SearchManager';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import SVGrenderer, { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import TextStyle from '~/style/TextStyle';
import PlantBreederEmptyAction from '@/components/GwtkPlantBreeder/action/PlantBreederEmptyAction';
import GwtkPlantBreederCommonService from '@/components/GwtkPlantBreeder/task/GwtkPlantBreederCommonService';
import { DataChangedEvent } from '~/taskmanager/TaskManager';
import Layer from '~/maplayers/Layer';
import MarkerStyle from '~/style/MarkerStyle';


export const START_MODE_ACTION = 'gwtkplantbreeder.startmodeaction';
export const EDIT_MODE_ACTION = 'gwtkplantbreeder.editmodeaction';
export const DELETE_MODE_ACTION = 'gwtkplantbreeder.deletemodeaction';
export const CONTROL_PLANT_BREEDER_POLYGON_ACTION = 'gwtkplantbreeder.controlplantbreederpolygonaction';
export const SAVE_OBJECT = 'gwtkplantbreeder.saveobject';
export const UPDATE_OBJECT_SEMANTIC = 'gwtkplantbreeder.updateobjectsemantic';
export const CANCEL_OBJECT_EDITOR = 'gwtkplantbreeder.cancelobjecteditor';
export const CREATE_NEW_RECORD = 'gwtkplantbreeder.createnewrecord';
export const DELETE_RECORD = 'gwtkplantbreeder.deleterecord';
export const UPDATE_ACTUAL_OBJECTS_LIST = 'gwtkplantbreeder.updateactualobjectslist';
export const FIND_NEXT_PLANT_BREEDER_MAP_OBJECTS = 'gwtkplantbreeder.findnextplantbreedermapobjects';
export const HIGHLIGHT_PLANT_BREEDER_SELECTED_OBJECT = 'gwtkplantbreeder.highlightplantbreederselectedobject';
export const SELECT_MAP_OBJECT_AND_OPEN_PLANT_BREEDER_EDIT_PANEL = 'gwtkplantbreeder.selectmapobjectandopenplantbreedereditpanel';


type PlantBreederRequestResultItem = PlantBreederRequestResult[];

export type PlantBreederRequest = {
    status: string,
    error: {
        message: string,
        code: number
    },
    result: PlantBreederRequestResultItem[],
    fieldInfo: PlantBreederRequestResult
};

export type PlantBreederRequestResult = {
    key: string | number;
    value: string | number;
    name?: string;
    type?: MapObjectSemanticType;
    hidden?: boolean;
    disabled?: boolean;
    index?: number;
    sectionCode?:string;
    sectionNumber?:string;
}

export type PlantBreederRequestAdditionalInformation = {
    status: string,
    error: {
        message: string,
        code: number
    },
    result: {
        sprav_hazard_classes: PlantBreederRequestResult[],
        sparv_active_substance: PlantBreederRequestResult[],
        sprav_handling_type: PlantBreederRequestResult[],
        szrNamesList: PlantBreederRequestResult[]
    }
}

export type PostDataForDB = {
    type: string;
    params: {
        key: string,
        value: string
    }[][]
}

export type GwtKPlantBreederTaskState = {
    [ START_MODE_ACTION ]: boolean;
    [ EDIT_MODE_ACTION ]: boolean;
    [ DELETE_MODE_ACTION ]: boolean;
    [ CONTROL_PLANT_BREEDER_POLYGON_ACTION ]: boolean;
    [ SAVE_OBJECT ]: boolean;
    [ UPDATE_OBJECT_SEMANTIC ]: PlantBreederRequestResult;
    [ CANCEL_OBJECT_EDITOR ]: boolean;
    [ CREATE_NEW_RECORD ]: boolean;
    [ DELETE_RECORD ]: number;
    [ UPDATE_ACTUAL_OBJECTS_LIST ]: undefined;
    [ FIND_NEXT_PLANT_BREEDER_MAP_OBJECTS ]: undefined;
    [ HIGHLIGHT_PLANT_BREEDER_SELECTED_OBJECT ]: string;
    [ SELECT_MAP_OBJECT_AND_OPEN_PLANT_BREEDER_EDIT_PANEL ]: string;
};

type WidgetParams = {
    setState: GwtkPlantBreederTask['setState'];
    localeName: string;
    linkPanel: {
        components: ActionDescription[];
        result?: string;
        activeState: string;
    },
    modePanel: {
        [PRIMARY_PANEL_ID]: ActionMode | undefined;
        [SECONDARY_PANEL_ID]: ActionMode | undefined;
    };
    currentMapObject: MapObject | null;
    currentMapObjectDataFromDB: PlantBreederRequest | null;
    additionalInformation: null | PlantBreederRequestAdditionalInformation;
    mapObjects: MapObject[];
    foundMapObjectsNumber: number;
    selectedMapObject: string[];
    showMapObjectsUpdateOverlay: boolean;
    showEditPanel: boolean;
    showEditPanelOverly: boolean;
}

/**
 * Команда создания компонента
 * @class GwtkPlantBreederTask
 * @extends Task
 */
export default class GwtkPlantBreederTask extends Task {

    /**
     * Слой для объектов
     * @readonly
     * @property vectorLayer {VectorLayer}
     */
    readonly vectorLayer: VectorLayer;

    /**
     * Выделенный объект на карте
     * @property selectedMapObjectInMap { MapObject }
     */
    selectedMapObjectInMap?: MapObject;

    /**
     * Стиль рисования объекта
     * @private
     * @readonly
     * @property selectedObjectStyle {Style}
     */
    private readonly selectedObjectStyle = new Style( {
        stroke: new Stroke( {
            color: 'green',
            width: '5px',
            dasharray: '5, 5'
        } ),
        fill: new Fill( {
            opacity: 0.1
        } ),
        marker: new MarkerStyle( { markerId: DEFAULT_SVG_MARKER_ID } ),
        text: new TextStyle( { color: 'green' } )
    } );

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
    private readonly requestService = new GwtkPlantBreederCommonService( {url: this.urlToService});


    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private readonly pointObjectTargetZoom: number;

    /**
     * @constructor GwtkPlantBreederTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow:MapWindow, id: string ) {
        super( mapWindow, id );

        //создание и регистрация обработчиков и описаний
        this.actionRegistry.push( {
            getConstructor() {
                return PlantBreederEmptyAction;
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
                return ControlPlantBreederPolygonActionLink;
            },
            id: CONTROL_PLANT_BREEDER_POLYGON_ACTION,
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
            localeName: localization,
            linkPanel: {
                components: [],
                result: 'Select the NWR field on the map to edit',
                activeState: 'edit'
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
            showMapObjectsUpdateOverlay: false,
            showEditPanel: false,
            showEditPanelOverly: false
        };

        this.pointObjectTargetZoom = Math.max(18, this.map.zoomLevel );

        if ( this.map.options.settings_mapEditor?.maplayersid &&  this.map.options.settings_mapEditor?.maplayersid[0] ) {
            const wmsLayers = this.map.tiles.getWmsLayers();
            let existLayerId = '';
            wmsLayers.forEach( layer => {
                if ( layer.alias === 'Карта Растениевода' ) {
                    existLayerId = layer.idLayer;
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

        this.getObjectPropsFromDBForPlantBreeders().then();
        this.getAdditionalInformation();

    }

    setup() {
        this.setState( CONTROL_PLANT_BREEDER_POLYGON_ACTION, true );
    }

    createTaskPanel() {

        // регистрация Vue компонента
        const nameGwtkPlantBreederWidget = 'GwtkPlantBreederWidget';
        const sourceGwtkPlantBreederWidget = GwtkPlantBreederWidget;
        this.mapWindow.registerComponent( nameGwtkPlantBreederWidget, sourceGwtkPlantBreederWidget );

        // Создание Vue компонента
        this.mapWindow.createWidget( nameGwtkPlantBreederWidget, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    setState<K extends keyof GwtKPlantBreederTaskState>( key:K, value: GwtKPlantBreederTaskState[K] ) {
        switch (key) {
            case CONTROL_PLANT_BREEDER_POLYGON_ACTION:
                this.setAction( key, value as boolean );
                if ( this._action ) {
                    this.setState( START_MODE_ACTION, true );
                }
                break;
            case SAVE_OBJECT:
                this.editObject();
                break;
            case CREATE_NEW_RECORD:
                this.createNewRecord();
                break;
            case DELETE_RECORD:
                this.deleteRecord( value as number );
                break;
            case UPDATE_OBJECT_SEMANTIC:
                this.updateObjectFiled( value as PlantBreederRequestResult);
                break;
            case CANCEL_OBJECT_EDITOR:
                this.closeChangingPanel();
                break;
            case UPDATE_ACTUAL_OBJECTS_LIST:
                this.getPlantBreederMapObjectsList( true );
                break;
            case FIND_NEXT_PLANT_BREEDER_MAP_OBJECTS:
                this.widgetProps.showMapObjectsUpdateOverlay = true;
                this.map.searchManager.findNext().then( ()=>{} ).catch( () =>{} ).finally( ()=>{
                    this.widgetProps.showMapObjectsUpdateOverlay = false;
                });
                break;
            case HIGHLIGHT_PLANT_BREEDER_SELECTED_OBJECT:
                this.highlightPlantBreederSelectedObject( value as string );
                break;
            case SELECT_MAP_OBJECT_AND_OPEN_PLANT_BREEDER_EDIT_PANEL:
                this.selectMapObjectAndOpenPlantBreederEditPanel( value as string );
                break;
            default:
                if ( this._action ) {
                    this._action.setState( key, value );
                }
                break;
        }
    }

    protected destroy() {
        super.destroy();
        this.map.searchManager.mapObjects.splice(0);
        this.widgetProps.showEditPanel = false;
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
     * @param value {string} тип включеного режима edit
     */
    setLinkPanelActiveState( value: string ) {
        this.widgetProps.linkPanel.activeState = value;
    }

    createModePanel( modePanelDescription: ActionModePanel ) {
        MODE_PANEL_KEYS.forEach( ( key ) => {
            const modePanel = modePanelDescription[ key ];
            if ( modePanel !== undefined && (key === PRIMARY_PANEL_ID || key === SECONDARY_PANEL_ID)) {
                this.widgetProps.modePanel[ key ] = modePanel;
            }
        } );
    }

    removeModePanel( modePanelId: string ) {
        if ( modePanelId !== undefined && (modePanelId === PRIMARY_PANEL_ID || modePanelId === SECONDARY_PANEL_ID)) {
            this.widgetProps.modePanel[ modePanelId ] = undefined;
        } else {
            MODE_PANEL_KEYS.forEach( ( key ) => {
                if (key === PRIMARY_PANEL_ID || key === SECONDARY_PANEL_ID) {
                    this.widgetProps.modePanel[key] = undefined;
                }
            } );
        }
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
        super.quitAction( id );
    }

    selectedActionType( id: string ) {
        this.widgetProps.showEditPanel = id == EDIT_MODE_ACTION;
    }

    getWidgetPropsCurrentMapObject() {
        return this.widgetProps.currentMapObject;
    }

    setWidgetPropsCurrentMapObject( mapObject: MapObject ) {
        this.widgetProps.currentMapObject = mapObject;
    }

    async getObjectPropsFromDBForPlantBreeders() {
        const defaultRequestResult: PlantBreederRequest = {
            status: 'success',
            error: {
                message: '',
                code: 0
            },
            result: [],
            fieldInfo: {key: '', name: '', value: '', index: undefined}
        };

        if ( this.widgetProps.currentMapObject ) {
            // По умолчанию
            this.widgetProps.currentMapObjectDataFromDB = defaultRequestResult;
            this.widgetProps.showEditPanelOverly = true;

            let linkSheet: string = '';
            let linkObject: string = '';
            if ( this.widgetProps.currentMapObject ) {
                linkSheet = this.widgetProps.currentMapObject.sheetName || '';
                linkObject = '' + (this.widgetProps.currentMapObject.objectNumber || '');
            }
            let id_Organ = this.getOrganizationId();

            const result = await this.requestService.getPlantBreederObjectData(linkSheet, linkObject, id_Organ);

            if ( result.data ) {
                if ( result.data.status && result.data.status === 'success' ) {
                    this.widgetProps.currentMapObjectDataFromDB = result.data;
                    this.widgetProps.showEditPanelOverly = false;
                } else {
                    this.widgetProps.currentMapObjectDataFromDB.status = 'success';
                    this.widgetProps.currentMapObjectDataFromDB.error = { message: '', code: 0 };
                    this.widgetProps.currentMapObjectDataFromDB.result = [];
                    this.widgetProps.currentMapObjectDataFromDB.fieldInfo = result.data.fieldInfo;
                    this.widgetProps.showEditPanelOverly = false;
                    if ( result.data.fieldInfo === undefined ) {
                        this.map.writeProtocolMessage( { text: result.data.error.message as string, type: LogEventType.Error, display: true } );
                    } else {
                        this.map.writeProtocolMessage( { text: result.data.error.message as string, type: LogEventType.Error } );
                    }
                }
            } else {
                this.widgetProps.showEditPanelOverly = false;
                this.map.writeProtocolMessage( { text: result.error as string, type: LogEventType.Error } );
            }
        } else {
            this.widgetProps.showEditPanelOverly = false;
            this.widgetProps.currentMapObjectDataFromDB = defaultRequestResult;
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
                sparv_active_substance: [],
                sprav_handling_type: [],
                sprav_hazard_classes: [],
                szrNamesList: []
            }
        };

        this.requestService.getPlantBreedersAdditionalInformation().then((result) => {
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

    onDataChanged(event:DataChangedEvent) {
        super.onDataChanged(event);
    }

    /**
     * Редактировать объект
     * @method editObject
     */
    editObject() {
        const params = this.generatePostData('edit').params;
        this.widgetProps.showEditPanelOverly = true;
        let linkSheet: string = '';
        let linkObject: string = '';
        if ( this.widgetProps.currentMapObject ) {
            linkSheet = this.widgetProps.currentMapObject.sheetName || '';
            linkObject = '' + (this.widgetProps.currentMapObject.objectNumber || '');
        }

        this.requestService.editPlantBreeder(linkSheet, linkObject, params).then((result) => {
            if ( result.data ) {
                if ( result.data.status && result.data.status === 'success' ) {
                    this.widgetProps.showEditPanelOverly = false;
                    this.closeChangingPanel();
                    this.getPlantBreederMapObjectsList( true );
                } else {
                    this.widgetProps.showEditPanelOverly = false;
                    this.map.writeProtocolMessage( { text: result.data.error.message as string, type: LogEventType.Error, display: true } );
                }
            } else {
                this.widgetProps.showEditPanelOverly = false;
                this.map.writeProtocolMessage( { text: result.error as string, type: LogEventType.Error, display: true } );
            }
        }).catch(( error ) => {
            this.widgetProps.showEditPanelOverly = false;
            this.map.writeProtocolMessage( { text: error, type: LogEventType.Error, display: true } );
        });
    }

    /**
     * Добавить новый запись для объекта
     * @method createNewRecord
     */
    createNewRecord() {
        if (!this.widgetProps.currentMapObjectDataFromDB) {
            return;
        }

        const newRecord: PlantBreederRequestResultItem = [
            {
                key:'id',
                value:'',
                name:'Идентификатор записи',
                type:MapObjectSemanticType.TNUMBER,
                hidden:true,
                disabled:true
            },
            {
                key:'id_Organ',
                value: this.widgetProps.currentMapObjectDataFromDB.fieldInfo.key,
                name:'Название организации',
                type:MapObjectSemanticType.TNUMBER,
                hidden:false,
                disabled:true
            },
            {
                key:'id_Field',
                value:this.widgetProps.currentMapObjectDataFromDB.fieldInfo.index|| -1,
                name:'Название рабочего участка',
                type:MapObjectSemanticType.TNUMBER,
                hidden:false,
                disabled:true
            },
            {
                key:'SZR_number',
                value:'',
                name:'Номер внесения по-порядку',
                type:MapObjectSemanticType.TNUMBER,
                hidden:true,
                disabled:true
            },
            {
                key:'SZR_name',
                value:'',
                name:'Средство защиты растений',
                type:MapObjectSemanticType.TCODE,
                hidden:false,
                disabled:false
            },
            {
                key:'SZR_type',
                value:'',
                name:'Тип мелиоранта',
                type:MapObjectSemanticType.TCODE,
                hidden:true,
                disabled:true
            },
            {
                key:'square',
                value:'',
                name:'Площадь',
                type:MapObjectSemanticType.TSTRING,
                hidden:true,
                disabled:true
            },
            {
                key:'volume',
                value:'',
                name:'Объём работ',
                type:MapObjectSemanticType.TSTRING,
                hidden:true,
                disabled:true
            },
            {
                key:'norm_fact_ga',
                value:'',
                name:'Норма(количество), еи/га',
                type:MapObjectSemanticType.TSTRING,
                hidden:true,
                disabled:true
            },
            {
                key:'norm_liq_ga',
                value:'',
                name:'Расход рабочей жидкости, т/га',
                type:MapObjectSemanticType.TSTRING,
                hidden:true,
                disabled:true
            },
            {
                key: 'agro_cond',
                value: '',
                name:'Агротехнические условия',
                type:MapObjectSemanticType.TSTRING,
                hidden:true,
                disabled:true
            },
            {
                key:'date_begin',
                value: new Date( Date.now() ) as unknown as string,
                name:'Дата начала',
                type:MapObjectSemanticType.TDATE,
                hidden:false,
                disabled:false
            },
            {
                key:'date_end',
                value: new Date( Date.now() ) as unknown as string,
                name:'Дата окончания',
                type:MapObjectSemanticType.TDATE,
                hidden:false,
                disabled:false
            },
            {
                key:'season',
                value:'',
                name:'Сезон',
                type:MapObjectSemanticType.TCODE,
                hidden:true,
                disabled:true
            },
            {
                key: 'plan_fact',
                value:'',
                name:'План/факт : null, false - план, true - факт',
                type:MapObjectSemanticType.TSTRING,
                hidden:true,
                disabled:true
            },
            {
                key: 'from_fact',
                value:'',
                name:'Из факта : null, false - ручной ввод, true - импортировано из фактических работ',
                type:MapObjectSemanticType.TSTRING,
                hidden:true,
                disabled:true
            },
            {
                key: 'pros_type',
                value: '',
                name: 'Вид обработки',
                type: MapObjectSemanticType.TCODE,
                hidden: false,
                disabled: false
            },
            {
                key: 'active_substance',
                value: '',
                name: 'Действующее вещество',
                type: MapObjectSemanticType.TSTRING,
                hidden: false,
                disabled: true
            },
            {
                key: 'status',
                value: '',
                name: 'Класс опасности для пчел',
                type: MapObjectSemanticType.TSTRING,
                hidden: false,
                disabled: true
            }
        ];

        this.widgetProps.currentMapObjectDataFromDB.result.push( newRecord );
    }

    /**
     * Удалить запись из списка
     * @method deleteRecord
     * @property itemId {Number}
     */
    deleteRecord(itemId: number) {
        if (this.widgetProps.currentMapObjectDataFromDB && this.widgetProps.currentMapObjectDataFromDB.result.length > itemId) {
            this.widgetProps.currentMapObjectDataFromDB.result.splice(itemId, 1);
        }
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
        this.widgetProps.showEditPanel = false;
        this.widgetProps.selectedMapObject.splice(0);
    }

    /**
     * Обновить значения полей объекта
     * @method updateObjectFiled
     * @property item {PlantBreederRequestResult}
     */
    updateObjectFiled(item: PlantBreederRequestResult) {
        let activeSubstanceValue: string = '';
        let hazardClassValue: string = '';
        if ( this.widgetProps.additionalInformation && item.key.toString().toLowerCase() === 'szr_name' ) {
            if ( this.widgetProps.additionalInformation.result.sparv_active_substance.length > 0 ) {
                this.widgetProps.additionalInformation.result.sparv_active_substance.every( (activeSubstance: PlantBreederRequestResult) => {
                    if ( activeSubstance.key === item.value ) {
                        activeSubstanceValue = activeSubstance.value as string;
                        return false;
                    }
                    return true;
                });
            }

            if ( this.widgetProps.additionalInformation.result.sprav_hazard_classes.length > 0 ) {
                this.widgetProps.additionalInformation.result.sprav_hazard_classes.every( (hazardClass: PlantBreederRequestResult) => {
                    if ( hazardClass.key === item.value ) {
                        hazardClassValue = hazardClass.value as string;
                        return false;
                    }
                    return true;
                });
            }
        }

        // Обновить данные для БД
        if ( this.widgetProps.currentMapObjectDataFromDB && this.widgetProps.currentMapObjectDataFromDB.result.length > 0 ) {
            if ( this.widgetProps.currentMapObjectDataFromDB.result[item.index as number] ) {
                this.widgetProps.currentMapObjectDataFromDB.result[item.index as number].forEach( (resultItem: PlantBreederRequestResult) => {
                    if ( resultItem.key === item.key ) {
                        resultItem.value = item.value;
                    }
                    if ( item.key.toString().toLowerCase() === 'szr_name' ) {
                        if ( resultItem.key.toString().toLowerCase() === 'active_substance' ) {
                            resultItem.value = activeSubstanceValue;
                        }
                        if ( resultItem.key.toString().toLowerCase() === 'status' ) {
                            resultItem.value = hazardClassValue;
                        }
                    }
                });
            }
        }
    }

    /**
     * Создать запрос для отправки на сервер для создание или редактирования поле в БД
     * @method generatePostData
     * @property type {String}
     */
    generatePostData( type: string ) {
        let postParams:PostDataForDB = {type: type, params: []};
        const editableFieldsList: string[] = ['id', 'id_Organ', 'id_Field', 'date_begin', 'date_end', 'SZR_name', 'pros_type'];
        let currentMapObjectDataFromDB: PlantBreederRequestResultItem[] = this.widgetProps.currentMapObjectDataFromDB?.result || [];
        let resultItemNumber: number = 0;

        currentMapObjectDataFromDB.forEach((resultItem) => {
            postParams.params[ resultItemNumber ] = [];
            resultItem.forEach( (resultRecordItem:PlantBreederRequestResult) =>{
                if ( editableFieldsList.indexOf( resultRecordItem.key as string ) > -1 ) {
                    postParams.params[ resultItemNumber ].push( {
                        key: resultRecordItem.key as string,
                        value: resultRecordItem.value as string
                    } );
                }
            });
            resultItemNumber = resultItemNumber + 1;
        });

        return postParams;
    }

    /**
     * Получить список объектов карты
     * @method getPlantBreederMapObjectsList
     * @property update {Boolean} Пренудительное обновление
     */
    getPlantBreederMapObjectsList( update:boolean ) {
        let forceUpdate: boolean = false;
        if ( update ) {
            forceUpdate = true;
        } else if ( this.widgetProps.mapObjects.length === 0 ) {
            forceUpdate = true;
        }

        if ( forceUpdate ) {
            this.widgetProps.showMapObjectsUpdateOverlay = true;
            const layers: Layer[] = this.map.tiles.getWmsLayers();
            layers.forEach( (layer: Layer) => {
                if ( layer.alias === 'Карта Растениевода' ) {
                    layer.show();
                } else {
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
     * @method highlightPlantBreederSelectedObject
     * @param mapObjectGuid {string} Идентификатор объекта карты
     */
    private highlightPlantBreederSelectedObject( mapObjectGuid: string) {
        this.setObjectToSelectedObjectList(mapObjectGuid);
        const mapObject = this.widgetProps.mapObjects.find((item: MapObject) => item.id === mapObjectGuid);
        if (this.widgetProps.selectedMapObject.length !== 0 && mapObject) {
            const mapBbox = this.map.getWindowBounds();
            if ( !mapBbox.intersects( mapObject.getBounds() ) ) {
                // переход в центр объекта
                const mapPoint = mapObject.getCenter();
                this.map.setMapCenter( mapPoint, true );
            } else {
                this.map.fitBounds( mapObject.getBounds() );
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
                        this.selectedMapObjectInMap.addStyle( this.selectedObjectStyle );
                    }
                });
            } else {
                this.selectedMapObjectInMap = mapObject;
                this.selectedMapObjectInMap.addStyle( this.selectedObjectStyle );
            }
        } else {
            this.selectedMapObjectInMap = undefined;
        }
    }

    /**
     * Выбрать объеккт на карте и открыть форму,
     * для редактирования параметров объекта в БД
     * @private
     * @method selectMapObjectAndOpenPlantBreederEditPanel
     * @param mapObjectGuid {string} Идентификатор объекта карты
     */
    private selectMapObjectAndOpenPlantBreederEditPanel( mapObjectGuid: string ) {
        this.widgetProps.selectedMapObject.splice(0);
        this.selectedMapObjectInMap = undefined;
        const selectedObject: MapObject[] = this.widgetProps.mapObjects.filter( (mapObject: MapObject) => {
            return mapObject.id === mapObjectGuid;
        });
        if ( selectedObject.length !== 0 ) {
            this.highlightPlantBreederSelectedObject( mapObjectGuid );
            selectedObject.forEach( (objectItem:MapObject)=>{
                this.map.addSelectedObject( objectItem );
            });
            this.map.setActiveObject( selectedObject[0] );
        }
    }

    /**
     * Получить идентификатор организации
     * @private
     * @method getOrganizationId
     */
    private getOrganizationId() {
        let idOrgan: string = '';
        if (Reflect.has(this.map.options, 'userData')) {
            const userData = (this.map.options as unknown as { userData: { permissions?: { organization?: { id?: string; } } } }).userData;
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

    onPreRender() {
        this.map.requestRender();
    }

    onPostRender( renderer: SVGrenderer ) {
        if ( this.selectedMapObjectInMap ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.selectedMapObjectInMap );
        }
    }

}
