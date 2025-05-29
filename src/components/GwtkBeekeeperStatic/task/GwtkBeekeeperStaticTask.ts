/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *        Задача "Пчеловод для работника Минсельхоза"               *
 *                                                                  *
 *******************************************************************/
import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import { LogEventType } from '~/types/CommonTypes';
import MapWindow from '~/MapWindow';
import VectorLayer from '~/maplayers/VectorLayer';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import GwtkBeekeeperStaticWidget
    from '@/components/GwtkBeekeeperStatic/task/GwtkBeekeeperStaticWidget.vue';
import GwtkBeekeeperStaticCommonService
    from '@/components/GwtkBeekeeperStatic/task/GwtkBeekeeperStaticCommonService';
import { BeekeepersRequestResult } from '@/components/GwtkBeekeeper/task/GwtkBeekeeperTask';
import SVGrenderer from '~/renderer/SVGrenderer';
import Layer from '~/maplayers/Layer';
import GISWebServiceVectorLayer from '~/maplayers/GISWebServiceVectorLayer';
import SearchManager, { GISWebServiceSEMode, SourceType } from '~/services/Search/SearchManager';
import i18n from '@/plugins/i18n';
import AppendPointAction from '~/systemActions/AppendPointAction';
import QuickEditAction from '~/systemActions/QuickEditAction';
import DeleteObjectAction from '~/systemActions/DeleteObjectAction';
import ControlBeekeeperStaticPointActionLink from '@/components/GwtkBeekeeperStatic/actions/ControlBeekeeperStaticPointActionLink';
import { BrowserService } from '~/services/BrowserService';

export const CREATE_MODE_ACTION = 'gwtkbeekeeperstatic.createmodeaction';
export const EDIT_MODE_ACTION = 'gwtkbeekeeperstatic.editmodeaction';
export const DELETE_MODE_ACTION = 'gwtkbeekeeperstatic.deletemodeaction';
export const CONTROL_BEEKEEPER_STATIC_POINT_ACTION_LINK = 'gwtkbeekeeperstatic.controlbeekeeperstaticpointactionlink';
export const SELECT_DB_RECORD = 'gwtkbeekeeperstatic.selectdbrecord';
export const SELECT_DB_RECORD_AND_OPEN_EDIT_PANEL = 'gwtkbeekeeperstatic.selectdbrecordandopeneditpanel';
export const UPDATE_SELECTED_RECORD_FIELD_VALUE = 'gwtkbeekeeperstatic.updateselectedrecordfieldvalue';
export const CLOSE_EDIT_RECORD_FORM = 'gwtkbeekeeperstatic.closeeditrecordform';
export const EDIT_RECORD = 'gwtkbeekeeperstatic.editrecord';

export type StaticBeekeepersRequest = {
    status: string,
    error: {
        message: string,
        code: number
    },
    result: BeekeepersRequestResult[][]
}

type PostDataForDB = {
    type: string;
    params: {
        key: string,
        value: string
    }[]
}

export type GwtkBeekeeperStaticTaskState = {
    [CREATE_MODE_ACTION]: boolean,
    [EDIT_MODE_ACTION]: boolean,
    [DELETE_MODE_ACTION]: boolean,
    [CONTROL_BEEKEEPER_STATIC_POINT_ACTION_LINK]: boolean,
    [SELECT_DB_RECORD]: BeekeepersRequestResult[],
    [SELECT_DB_RECORD_AND_OPEN_EDIT_PANEL]: BeekeepersRequestResult[],
    [UPDATE_SELECTED_RECORD_FIELD_VALUE]: BeekeepersRequestResult,
    [CLOSE_EDIT_RECORD_FORM]: boolean,
    [EDIT_RECORD]: boolean
}

type WidgetParams = {
    setState: GwtkBeekeeperStaticTask['setState'];
    localName: string;
    currentMapObject: null;
    currentMapObjectDataFromDB: null | BeekeepersRequestResult[];
    mapObjectsListFromDB: null | StaticBeekeepersRequest;
    selectedObjectFromDB: string[];
    showMapObjectsUpdateOverlay: boolean;
    showPanelStyle: boolean;
    showSaveOverlay: boolean;
}

/**
 * Команда создания компонента
 * @class GwtkBeekeeperStaticTask
 * @extends Task
 */
export default class GwtkBeekeeperStaticTask extends Task {

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
    private readonly requestService = new GwtkBeekeeperStaticCommonService( {url: this.urlToService} );

    /**
     * Слой для объектов
     * @private
     * @property vectorLayer {VectorLayer}
     */
    private vectorLayer?: VectorLayer;

    /**
     * Выделенный объект на карте
     * @property selectedMapObjectInMap { MapObject }
     */
    selectedMapObjectInMap?: MapObject;

    /**
     * Выделенный объект на карте для редактирования
     * @property editableSelectedMapObjectInMap { MapObject }
     */
    editableSelectedMapObjectInMap?: MapObject;

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private readonly pointObjectTargetZoom: number;

    /**
     * @constructor GwtkBeekeeperStaticTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super(mapWindow, id);

        //создание и регистрация обработчиков и описаний
        this.actionRegistry.push({
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
        });
        this.actionRegistry.push({
            getConstructor() {
                return QuickEditAction;
            },
            id: EDIT_MODE_ACTION,
            active: false,
            enabled: true,
            options: {
                icon: 'quick-edit',
                title: 'phrases.Edit'
            }
        });
        this.actionRegistry.push({
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
        });
        this.actionRegistry.push({
            getConstructor() {
                return ControlBeekeeperStaticPointActionLink;
            },
            id: CONTROL_BEEKEEPER_STATIC_POINT_ACTION_LINK,
            active: false,
            enabled: true,
            options: {
                icon: '',
                title: ''
            }
        });

        let localization = 'ru-ru';
        if ( this.map.options.locale )
            localization = this.map.options.locale;

        // Параметры виджета
        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            setState: this.setState.bind( this ),
            localName: localization,
            currentMapObject: null,
            currentMapObjectDataFromDB: null,
            mapObjectsListFromDB: null,
            selectedObjectFromDB: [],
            showMapObjectsUpdateOverlay: false,
            showPanelStyle: false,
            showSaveOverlay: false
        };

        this.pointObjectTargetZoom = Math.max(18, this.map.zoomLevel );

        this.getMapObjectsListFromDB().then();

        this.toggleGwtkMapObjectPanel(false);
    }

    createTaskPanel() {

        // регистрация Vue компонента
        const nameGwtkBeekeeperStaticWidget = 'GwtkBeekeeperStaticWidget';
        const sourceGwtkBeekeeperStaticWidget = GwtkBeekeeperStaticWidget;
        this.mapWindow.registerComponent( nameGwtkBeekeeperStaticWidget, sourceGwtkBeekeeperStaticWidget );

        // Создание Vue компонента
        this.mapWindow.createWidget( nameGwtkBeekeeperStaticWidget, this.widgetProps );

        //Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );

    }

    protected destroy() {
        super.destroy();
        this.map.searchManager.mapObjects.splice(0);
        this.toggleGwtkMapObjectPanel(true);
    }

    setState<K extends keyof GwtkBeekeeperStaticTaskState>( key:K, value: GwtkBeekeeperStaticTaskState[K] ) {
        switch ( key ) {
            case CONTROL_BEEKEEPER_STATIC_POINT_ACTION_LINK:
                this.setAction( key, value as boolean);
                break;
            case SELECT_DB_RECORD:
                this.selectDBRecord( value as BeekeepersRequestResult[] );
                break;
            case SELECT_DB_RECORD_AND_OPEN_EDIT_PANEL:
                this.selectDBRecordAndOpenEditForm( value as BeekeepersRequestResult[] );
                break;
            case UPDATE_SELECTED_RECORD_FIELD_VALUE:
                this.updateRecordFieldValue( value as BeekeepersRequestResult );
                break;
            case CLOSE_EDIT_RECORD_FORM:
                this.closeRecordEditingPanel();
                break;
            case EDIT_RECORD:
                this.editDbRecord();
                break;
            default:
                if( this._action ) {
                    this._action.setState( key, value );
                }
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
        if ( id == CREATE_MODE_ACTION ) {
            if ( this._action ) {
                this._action.commit();
            }
        }
        super.quitAction( id );
    }

    onPreRender() {
        if ( this.selectedMapObjectInMap ) {
            this.map.requestRender();
        }
    }

    onPostRender( renderer:SVGrenderer ) {
        if ( this.selectedMapObjectInMap ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.selectedMapObjectInMap );
        }
    }

    /**
     * Получить логин пользователя
     * @private
     * @method getUserLogin
     */
    private getUserLogin() {
        let userLogin: string = '';

        if ( this.map.options ) {
            if (Reflect.has(this.map.options, 'userData')) {
                const userData = (this.map.options as unknown as { userData: { login?: string; } }).userData;
                if (userData.login && userData.login !== '') {
                    userLogin = userData.login;
                }
            }
        }

        return userLogin;
    }

    /**
     * Получить список записов и БД
     * @async
     * @method getMapObjectsListFromDB
     */
    async getMapObjectsListFromDB() {
        this.widgetProps.showMapObjectsUpdateOverlay = true;
        this.widgetProps.mapObjectsListFromDB = null;

        const defaultRequest: StaticBeekeepersRequest = {
            status: 'success',
            error: {
                message: '',
                code: 0
            },
            result: []
        };

        const result = await this.requestService.getPermanentApiariesList();

        if ( result.data ) {
            if ( result.data.status && result.data.status === 'success' ) {
                this.widgetProps.mapObjectsListFromDB = result.data;

                let recordsList = this.widgetProps.mapObjectsListFromDB?.result;
                let enteredLayersList: string[] = [];
                let enteredLayersIdsList: string[] = [];
                if (!recordsList) {
                    this.widgetProps.mapObjectsListFromDB = defaultRequest;
                    this.map.writeProtocolMessage({ text: result.error as string, type: LogEventType.Error });
                    return;
                }

                recordsList.forEach((record: BeekeepersRequestResult[]) => {
                    const layerIdFromDB = this.getDBRecordFieldValue(record, 'apiaries');
                    if (enteredLayersList.indexOf(layerIdFromDB) === -1) {
                        enteredLayersList.push(layerIdFromDB);
                    }
                });

                enteredLayersList.forEach((layerPath: string) => {
                    enteredLayersIdsList.push(hex_md5(layerPath + '_' + this.getUserLogin()));
                });
                const layers = this.map.tiles.getWmsLayers();
                layers.forEach(layer => {
                    if (enteredLayersIdsList.indexOf(layer.xId) !== -1) {
                        layer.show();
                    } else if (layer.alias === 'Карта опасности') {
                        layer.show();
                    } else {
                        layer.hide();
                    }
                });

                this.map.tiles.wmsUpdate();
                this.map.redraw();

            } else {
                this.widgetProps.mapObjectsListFromDB = defaultRequest;
                this.map.writeProtocolMessage( { text: result.data.error.message as string, type: LogEventType.Error } );
            }
        } else {
            this.widgetProps.mapObjectsListFromDB = defaultRequest;
            this.map.writeProtocolMessage( { text: result.error as string, type: LogEventType.Error } );
        }

        this.widgetProps.showMapObjectsUpdateOverlay = false;
    }

    /**
     * Выбраный запись из БД выделить в списке записов
     * И при наличие linkSheet и linkObject выделить на карте
     * @private
     * @method selectDBRecord
     * @param record {BeekeepersRequestResult[]} - запись БД
     */
    private selectDBRecord( record: BeekeepersRequestResult[] ) {
        this.widgetProps.currentMapObjectDataFromDB = null;
        const recordId = this.getDBRecordFieldValue( record, 'id_apiary');
        if ( recordId != '' ) {
            this.updateSelectedDBRecordsList(recordId);
            if ( this.widgetProps.selectedObjectFromDB.length !== 0 ) {
                const linkSheet = this.getDBRecordFieldValue( record, 'linksheet');
                const linkObject = this.getDBRecordFieldValue( record, 'linkobject');
                const layerIdFromDB = this.getDBRecordFieldValue( record, 'apiaries');

                this.getUserMapObjectByDBData(layerIdFromDB, linkSheet, linkObject);

                if ( this.selectedMapObjectInMap ) {
                    this.widgetProps.currentMapObjectDataFromDB = record;
                }
            } else {
                this.selectedMapObjectInMap = undefined;
                this.map.requestRender();
            }
        }
    }

    /**
     * Выбраный запись из БД выделить в списке записов
     * И при наличие linkSheet и linkObject выделить на карте
     * И открыть форму для редактирования записи БД
     * @private
     * @method selectDBRecordAndOpenEditForm
     * @param record {BeekeepersRequestResult[]} - запись БД
     */
    private selectDBRecordAndOpenEditForm( record: BeekeepersRequestResult[] ) {
        this.widgetProps.currentMapObjectDataFromDB = null;
        this.vectorLayer = undefined;
        this.editableSelectedMapObjectInMap = undefined;

        const recordId = this.getDBRecordFieldValue( record, 'id_apiary');

        if ( recordId !== '' ) {
            const layerIdFromDB = this.getDBRecordFieldValue( record, 'apiaries');
            const linkSheet = this.getDBRecordFieldValue( record, 'linksheet');
            const linkObject = this.getDBRecordFieldValue( record, 'linkobject');

            if ( layerIdFromDB !== '' ) {
                const layerId = hex_md5(layerIdFromDB + '_' + this.getUserLogin());
                const wmsLayers: Layer[] = this.map.tiles.getWmsLayers();
                let selectedLayer: Layer | undefined = undefined;
                wmsLayers.forEach((layer: Layer) => {
                    if (layer.xId === layerId) {
                        this.vectorLayer = this.map.getVectorLayerByxId(layer.xId) as GISWebServiceVectorLayer;
                        selectedLayer = layer;
                    }
                });

                if (selectedLayer && linkSheet !== '' && linkObject !== '') {
                    const objectNumber = linkSheet + '.' + linkObject;
                    const searchableLayer: VectorLayer[] = [selectedLayer];
                    const searchManager = this.mapWindow.getMap().searchManager as SearchManager;
                    searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.All, searchableLayer);
                    searchManager.clearSearchCriteriaAggregator();
                    // Создать копию критериев
                    const criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();
                    // Обновить список критериев для номера объекта
                    const objectNumberCriterion = criteriaAggregatorCopy.getIdListSearchCriterion();
                    objectNumberCriterion.addValue(objectNumber);
                    // Получить и обновить проекцию
                    const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
                    srsNameSearchCriterion.setValue( this.map.getCrsString() );
                    // Отправить запрос для получения отфильтрованного ответа
                    this.mapWindow.getTaskManager().updateCriteriaAggregator( criteriaAggregatorCopy );
                    this.map.searchManager.setSearchCriteriaAggregator( criteriaAggregatorCopy );
                    this.map.searchManager.findNext().finally( () =>{
                        if ( this.map.searchManager.mapObjects.length > 0 ) {
                            const object = this.map.searchManager.mapObjects[0];
                            this.widgetProps.selectedObjectFromDB.splice(0);
                            this.selectedMapObjectInMap = undefined;
                            this.widgetProps.currentMapObjectDataFromDB = record;
                            this.widgetProps.showPanelStyle = true;

                            const mapBbox = this.map.getWindowBounds();
                            if ( !mapBbox.intersects( object.getBounds() ) ) {
                                // переход в центр объекта
                                const mapPoint = object.getCenter();
                                this.map.setMapCenter( mapPoint, true );
                            } else {
                                this.map.fitBounds( object.getBounds() );
                            }

                            // масштабируем для точечного объекта,
                            // иначе точка будет вписываться в окно на максимально доступном масштабе,
                            // либо переход к объекту вне экрана будет без масштабирования и его можем не увидеть
                            if ( object.type === MapObjectType.Point ) {
                                this.map.setZoom( this.pointObjectTargetZoom );
                            }

                            if ( !object.hasGeometry() ) {
                                object.loadGeometry().then( () => {
                                    if ( object.hasGeometry() ) {
                                        this.editableSelectedMapObjectInMap = object;
                                    }
                                });
                            } else {
                                this.editableSelectedMapObjectInMap = object;
                            }

                            this.setState( CONTROL_BEEKEEPER_STATIC_POINT_ACTION_LINK, true );
                            this.setState( EDIT_MODE_ACTION, true );
                        } else {
                            this.widgetProps.showPanelStyle = false;
                            this.map.writeProtocolMessage( {text: <string>i18n.t('phrases.No items found'), type: LogEventType.Error, display: true} );
                        }
                    });
                } else {
                    if ( this.vectorLayer ) {
                        this.editableSelectedMapObjectInMap = new MapObject(
                            this.vectorLayer as VectorLayer,
                            MapObjectType.Point,
                            {
                                key: 'P0790005000',
                                layerid: 'BeeKeeping',
                                code: 790005000,
                                name: 'Пасека',
                                layer: 'ПЧЕЛОВОДСТВО',
                                schema: 'agro10t'
                            }
                        );
                        this.widgetProps.selectedObjectFromDB.splice(0);
                        this.selectedMapObjectInMap = undefined;
                        this.widgetProps.currentMapObjectDataFromDB = record;
                        this.widgetProps.showPanelStyle = true;
                        this.setState( CONTROL_BEEKEEPER_STATIC_POINT_ACTION_LINK, true );
                        this.setState( CREATE_MODE_ACTION, true);
                    } else {
                        this.widgetProps.showPanelStyle = false;
                        this.map.writeProtocolMessage( {text: <string>i18n.t('phrases.No layer found for object'), type: LogEventType.Error, display: true} );
                    }
                }
            } else {
                this.widgetProps.showPanelStyle = false;
                this.map.writeProtocolMessage( {text: <string>i18n.t('phrases.No layer found for object'), type: LogEventType.Error, display: true} );
            }
        } else {
            this.map.writeProtocolMessage( {text: <string>i18n.t('beekeeper.No record found!'), type: LogEventType.Error, display: true} );
        }
    }

    /**
     * Обновить список выброного записа, идентификатор записа
     * @private
     * @method updateSelectedDBRecordsList
     * @param recordId {String} - идентификатор записа
     */
    private updateSelectedDBRecordsList(recordId: string) {
        if ( this.widgetProps.selectedObjectFromDB.length === 0 ) {
            this.widgetProps.selectedObjectFromDB.push( recordId );
        } else {
            const index = this.widgetProps.selectedObjectFromDB.indexOf( recordId );
            if ( index !== -1 ) {
                this.widgetProps.selectedObjectFromDB.splice(0);
            } else {
                this.widgetProps.selectedObjectFromDB.splice(0);
                this.widgetProps.selectedObjectFromDB.push( recordId );
            }
        }
    }

    /**
     * Получить значения поля из записи БД
     * @private
     * @method getDBRecordFieldValue
     * @param record {BeekeepersRequestResult[]} - запись БД
     * @param fieldName {String} - Имя столбца таблицы БД
     */
    private getDBRecordFieldValue( record: BeekeepersRequestResult[], fieldName: string ) {
        let value: string = '';

        record.forEach( (item: BeekeepersRequestResult) => {
            if ( item.key === fieldName ) {
                value = item.value as string;
            }
        });

        return value;
    }

    /**
     * Получить объект из карты пользователя
     * @private
     * @method getUserMapObjectByDBData
     * @param layerId {String} - Идентификатор слоя из БД
     * @param linkSheet {String} - Имя слоя из БД
     * @param linkObject {String} - Номер объекта из БД
     */
    private getUserMapObjectByDBData( layerId: string, linkSheet: string, linkObject: string ) {
        this.vectorLayer = undefined;
        this.selectedMapObjectInMap = undefined;
        if ( layerId !== '' ) {
            const selectedLayerId = hex_md5(layerId + '_' + this.getUserLogin());
            const wmsLayers: Layer[] = this.map.tiles.getWmsLayers();
            let selectedLayer: Layer | undefined = undefined;
            let issetLayer: boolean = false;
            let issetLayerId: string = '';
            wmsLayers.forEach((layer: Layer) => {
                if (layer.xId === selectedLayerId) {
                    issetLayer = true;
                    issetLayerId = layer.xId;
                    selectedLayer = layer;
                }
            });
            if (issetLayer && issetLayerId !== '') {
                this.vectorLayer = this.map.getVectorLayerByxId(issetLayerId) as GISWebServiceVectorLayer;
            }
            if (selectedLayer && linkSheet !== '' && linkObject !== '') {
                const objectNumber = linkSheet + '.' + linkObject;
                const searchableLayer: VectorLayer[] = [selectedLayer];
                const searchManager = this.mapWindow.getMap().searchManager as SearchManager;
                searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.All, searchableLayer);
                searchManager.clearSearchCriteriaAggregator();
                // Создать копию критериев
                const criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();
                // Обновить список критериев для номера объекта
                const objectNumberCriterion = criteriaAggregatorCopy.getIdListSearchCriterion();
                objectNumberCriterion.addValue(objectNumber);
                // Получить и обновить проекцию
                const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
                srsNameSearchCriterion.setValue( this.map.getCrsString() );
                // Отправить запрос для получения отфильтрованного ответа
                this.mapWindow.getTaskManager().updateCriteriaAggregator( criteriaAggregatorCopy );
                this.map.searchManager.setSearchCriteriaAggregator( criteriaAggregatorCopy );
                this.map.searchManager.findNext().finally( () => {
                    if ( this.map.searchManager.mapObjects.length > 0 ) {
                        const object = this.map.searchManager.mapObjects[0];
                        const mapBbox = this.map.getWindowBounds();
                        if ( !mapBbox.intersects( object.getBounds() ) ) {
                            // переход в центр объекта
                            const mapPoint = object.getCenter();
                            this.map.setMapCenter( mapPoint, true );
                        } else {
                            this.map.fitBounds( object.getBounds() );
                        }

                        // масштабируем для точечного объекта,
                        // иначе точка будет вписываться в окно на максимально доступном масштабе,
                        // либо переход к объекту вне экрана будет без масштабирования и его можем не увидеть
                        if ( object.type === MapObjectType.Point ) {
                            this.map.setZoom( this.pointObjectTargetZoom );
                        }

                        if ( !object.hasGeometry() ) {
                            object.loadGeometry().then( () => {
                                if ( object.hasGeometry() ) {
                                    this.selectedMapObjectInMap = object;
                                }
                            });
                        } else {
                            this.selectedMapObjectInMap = object;
                        }
                    }
                });
            } else {
                if ( this.vectorLayer ) {
                    this.selectedMapObjectInMap = new MapObject(
                        this.vectorLayer as VectorLayer,
                        MapObjectType.Point,
                        {
                            key: 'P0790005000',
                            layerid: 'BeeKeeping',
                            code: 790005000,
                            name: 'Пасека',
                            layer: 'ПЧЕЛОВОДСТВО',
                            schema: 'agro10t'
                        }
                    );
                }
            }
        }
    }

    /**
     * Обновить значение поля записи БД
     * @private
     * @method updateRecordFieldValue
     * @param fieldItem {BeekeepersRequestResult} - Имя поля и значения поля
     */
    private updateRecordFieldValue( fieldItem: BeekeepersRequestResult ) {
        if ( this.widgetProps.currentMapObjectDataFromDB ) {
            this.widgetProps.currentMapObjectDataFromDB.forEach( (field: BeekeepersRequestResult) => {
                if ( field.key === fieldItem.key ) {
                    field.value = fieldItem.value;
                }
            });
        }
    }

    /**
     * Закрыть панель редактирования записи БД
     * @private
     * @method closeRecordEditingPanel
     */
    private closeRecordEditingPanel() {
        this.editableSelectedMapObjectInMap = undefined;
        this.widgetProps.currentMapObjectDataFromDB = null;
        this.widgetProps.showPanelStyle = false;
        this.getMapObjectsListFromDB().then();
        if ( this._action ) {
            this._action.setState( DELETE_MODE_ACTION, true );
        }
    }

    /**
     * Редактировать запись в БД
     * @private
     * @method editDbRecord
     */
    private editDbRecord() {
        if ( this.editableSelectedMapObjectInMap ) {
            this.widgetProps.showSaveOverlay = true;
            this.requestService.editApiary( this.generatePostData().params ).then( (result) =>{
                if ( result.data ) {
                    if ( result.data.status && result.data.status === 'success' ) {
                        this.widgetProps.showSaveOverlay = false;
                        this.closeRecordEditingPanel();
                        this.map.writeProtocolMessage( {
                            text: i18n.t('beekeeper.Apiary successfully saved') as string,
                            type: LogEventType.Info,
                            display: true
                        } );
                    } else {
                        this.map.writeProtocolMessage( { text: result.data.error.message as string, type: LogEventType.Error, display: true } );
                        this.widgetProps.showSaveOverlay = false;
                    }
                } else {
                    this.map.writeProtocolMessage( { text: result.error as string, type: LogEventType.Error, display: true } );
                    this.widgetProps.showSaveOverlay = false;
                }
            }).catch( ( error ) => {
                this.map.writeProtocolMessage( { text: error, type: LogEventType.Error, display: true } );
                this.widgetProps.showSaveOverlay = false;
            });
        }
    }

    /**
     * Создать запрос для отправки на сервер для редактирования записи в БД
     * @private
     * @method generatePostData
     */
    private generatePostData() {
        let postParams: PostDataForDB = {
            type: 'edit',
            params: []
        };

        if ( this.widgetProps.currentMapObjectDataFromDB ) {
            this.widgetProps.currentMapObjectDataFromDB.forEach( (dbField: BeekeepersRequestResult) => {
                if ( dbField.key === 'id_organ' ) {
                    postParams.params.push({
                        key: 'id_Organ',
                        value: dbField.value as string
                    });
                }
                if ( dbField.key === 'id_apiary' ) {
                    postParams.params.push({
                        key: 'id',
                        value: dbField.value as string
                    });
                }
                if ( dbField.key === 'passport' ) {
                    postParams.params.push({
                        key: 'passport',
                        value: dbField.value as string
                    });
                }
                if ( dbField.key === 'family_count' ) {
                    postParams.params.push({
                        key: 'family_count',
                        value: dbField.value as string
                    });
                }
            });

            if ( this.editableSelectedMapObjectInMap ) {
                const pointGeoPointList = this.editableSelectedMapObjectInMap.getPointList()[0].toGeoPoint();
                const sheetName: string = this.editableSelectedMapObjectInMap.sheetName as string;
                const objectNumber: string = this.editableSelectedMapObjectInMap.objectNumber as unknown as string;
                if ( pointGeoPointList ) {
                    postParams.params.push( {key: 'latitude', value: pointGeoPointList.getLatitude() as unknown as string} );
                    postParams.params.push( {key: 'longitude', value: pointGeoPointList.getLongitude() as unknown as string} );
                }
                if ( sheetName && sheetName !== '' ) {
                    postParams.params.push( {key: 'linksheet', value: sheetName} );
                    postParams.params.push( {key: 'linkobject', value: objectNumber} );
                }
            }
        }

        return postParams;
    }

    /**
     * Включить или выключить отображения панеля объекты карты
     * @private
     * @method toggleGwtkMapObjectPanel
     * @param toggle {Boolean}
     */
    private toggleGwtkMapObjectPanel(toggle: boolean) {
        const taskDescription= this.mapWindow.getTaskManager().getTaskDescription('gwtkmapobject.main');
        if ( taskDescription ) {
            taskDescription.enabled = toggle;
        }
    }
}
