/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Компонент Пространственной базы данных               *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkMapdbWidget from '@/components/GwtkMapdb/task/GwtkMapdbWidget.vue';
import { SimpleJson, LogEventType } from '~/types/CommonTypes';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import MapdbmFilter from './MapdbmFilter';
import MapObject from '~/mapobject/MapObject';
import { MapPoint } from '~/geometry/MapPoint';
import GeoJSON from '~/utils/GeoJSON';
import { OUTTYPE } from '~/services/RequestServices/common/enumerables';
import SVGrenderer, { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import MarkerStyle from '~/style/MarkerStyle';
import TextStyle from '~/style/TextStyle';
import RequestService from '~/services/RequestServices/common/RequestService';
import Layer from '~/maplayers/Layer';
import i18n from '@/plugins/i18n';

export const ON_SELECT_LAYER = 'gwtkMapdb.onselectlayer';
export const ON_SELECT_DATABASE = 'gwtkMapdb.onselectdatabase';
export const ON_CLICK_SHOW_INFO = 'gwtkMapdb.onclickshowinfo';
export const CLICK_ON_MARKER = 'gwtkMapdb.clickonmarker';
export const CLICK_ON_OBJECT = 'gwtkMapdb.clickonobject';
export const SELECT_FAST_SEARCH_FILTER = 'gwtkMapdb.selectfastsearchfilter';
export const ON_INPUT_FAST_SEARCH = 'gwktMapdb.oninputfastsearch';
export const FAST_SEARCH = 'gwtkMapdb.fastsearch';
export const ON_CHECKBOX = 'gwtkMapdb.oncheckbox';
export const ON_ADVANCED_SEARCH = 'gwtkMapdb.onadvancedsearch';
export const ON_SELECT_OPERATION_TYPE = 'gwtkMapdb.onselectoperationtype';
export const ON_INPUT_VALUE_1 = 'gwtkMapdb.oninputvalue1';
export const ON_INPUT_VALUE_2 = 'gwtkMapdb.oninputvalue2';
export const ON_CLICK_SEARCH_BUTTON = 'gwtkMapdb.onclicksearchbutton';
export const CLOSE_MAP_OBJECT = 'gwtkMapdb.closemapobject';
export const SEARCH_MAP_OBJECT = 'gwtkMapdb.searchmapobject';
export const ON_CLICK_ARROW = 'gwtkMapdb.onclickarrow';
export const ON_SELECT_RECORD_ON_PAGE = 'gwtkMapdb.onselectrecordonpage';
export const ON_CHANGE_CHECKBOX_FAST_SEARCH = 'gwtkMapdb.onchangecheckboxfastsearch';
export const ON_SELECT_ADVANCES_SEARCH_FIELD = 'gwtkMapdb.onselectadvsncedsearchfield';
export const ON_CLICK_DELETE_FIELD = 'gwtkMapdb.onclickdeletefield';
export const UPDATE_SETTINGS_FIELD_LIST = 'gwtkMapdb.updatesettingsfieldlist';
export const SELECT_ALL = 'gwtkMapdb.selectall';
export const ON_CLICK_MAP_SEARCH = 'gwtkMapdb.onclickmapsearch';
export const ON_CLICK_SEARCH_MAP_OBJECTS = 'gwtkMapdb.onclicksearchmapobjects';
export const LOAD_MORE = 'gwtkMapdb.loadmore';
export const CLICK_CANCEL_OBJECT = 'gwtkMapdb.clickcancelobject';
export const CLICK_SELECT_OBJECT = 'gwtkMapdb.clickselectobjext';
export const SHOW_INFO = 'gwtkMapdb.showinfo';
export const DATA_CHANGE = 'gwtkMapdb.datachange';
export const CREATE_ONLY_FIELD_LIST = 'gwtkMapdb.createonlyfieldlist';
export const ONLY_FIELD = 'gwtkMapdb.onlyfield';
export type GwtkMapdbkState = {
    [ ON_SELECT_LAYER ]: string;
    [ ON_SELECT_DATABASE ]: { dbname?: string, reset?: boolean };
    [ ON_CLICK_SHOW_INFO ]: number;
    [ CLICK_ON_MARKER ]: { marker: boolean, elementId: { key: string }[] };
    [ CLICK_ON_OBJECT ]: number;
    [ SELECT_FAST_SEARCH_FILTER ]: FieldColumn;
    [ ON_INPUT_FAST_SEARCH ]: string;
    [ FAST_SEARCH ]: boolean;
    [ ON_CHECKBOX ]: { field: object, name: string };
    [ ON_ADVANCED_SEARCH ]: null;
    [ ON_SELECT_OPERATION_TYPE ]: ValueId;
    [ ON_INPUT_VALUE_1 ]: { value: string, id: string };
    [ ON_INPUT_VALUE_2 ]: { value: string, id: string };
    [ ON_CLICK_SEARCH_BUTTON ]: null;
    [ CLOSE_MAP_OBJECT ]: null;
    [ SEARCH_MAP_OBJECT ]: SearchMapObject;
    [ ON_CLICK_ARROW ]: string;
    [ ON_SELECT_RECORD_ON_PAGE ]: string;
    [ ON_CHANGE_CHECKBOX_FAST_SEARCH ]: string;
    [ ON_SELECT_ADVANCES_SEARCH_FIELD ]: string;
    [ ON_CLICK_DELETE_FIELD ]: OnClickDeleteField;
    [ UPDATE_SETTINGS_FIELD_LIST ]: string;
    [ SELECT_ALL ]: string;
    [ ON_CLICK_MAP_SEARCH ]: boolean;
    [ ON_CLICK_SEARCH_MAP_OBJECTS ]: null;
    [ LOAD_MORE ]: null;
    [ CLICK_CANCEL_OBJECT ]: null;
    [ CLICK_SELECT_OBJECT ]: null;
    [ SHOW_INFO ]: boolean;
    [ DATA_CHANGE ]: boolean;
    [ CREATE_ONLY_FIELD_LIST ]: string;
    [ ONLY_FIELD ]: boolean;
}

type WidgetParams = {
    setState: GwtkMapdbTask['setState'];
    layerIdList: { value: string; text: string; }[];
    selectedLayer: string;
    tableNameList: { tableName: string, name: string }[];
    elementsList: {
        [ x: string ]: string; key: string
    }[][];
    fieldsList: FieldColumn[];
    selectedDatabase: string;
    objectInfo: [string | number | undefined, string | number | undefined][];
    newObjectInfo: { field: string | number }[];
    selectedFastSearchFilter: FieldColumn[];
    inputValueFastSearch: string;
    newFieldsList: { field: string; }[];
    newFieldsListFast: { field: string; }[];
    fieldListAdvancedSearch: OnClickDeleteField[];
    fieldListAdvancedSearchShow: OnClickDeleteField[];
    totalRecords: number;
    txtObjectName: string;
    activeObject: MapObject[];
    selectedOnMapObject: MapObject[];
    onMapObjectSelected: boolean;
    selectObject: boolean;
    recordsOnPage: RecordsOnPage;
    showElements: { id?: number; key: string; }[];
    onRequest: boolean;
    onSelectedDatabase: boolean;
    selectedItem: { key: string; }[];
    selectedMarkerItem: null | object;
    lastSearchObjectList: MapObject[];
    canSearchObjectList: MapObject[];
    canSearchObject: boolean;
    showInfo: boolean;
    selectedItemsId: number[];
    selectedMapItemList: MapObject[];
    onlyFieldList: { field: string | number }[];
    onlyField: boolean;
}

export type OnClickDeleteField = {
    field: string;
    column_type: string;
    operator: string;
    value1: string;
    value2: string;
    operations: { name: string; }[];
}

type FieldColumn = {
    field: string;
    column_type: string
}

type ValueId = {
    value: string,
    id: number
}

type SearchMapObject = {
    layer_id: string | undefined,
    filepath: string | undefined,
    id: number
}

type RecordsOnPage = {
    recordsSelect: number[],
    records: number,
    page: number,
    offset: number,
    recordsLength: number
}

type Response = {
    records: {
        [ x: string ]: string;
        key: string;
    }[];
    columns: FieldColumn[];
    total: string;
}

/**
 * Компонент "Построение тепловой карты"
 * @class GwtkMapdbTask
 * @extends Task
 * @description
 */
export default class GwtkMapdbTask extends Task {
    protected workspaceData?: { selectedLayer: string, selectedDatabase: string, recordsOnPage: number, onlyField: boolean, fieldList: { field: string | number; }[] };

    private fieldList: boolean = false;

    private mapObjectsList: MapObject[] = [];

    private readonly selectedObjectStyle = new Style( {
        stroke: new Stroke( {
            color: 'red',
            width: '3px',
            dasharray: '5, 0'
        } ),
        fill: new Fill( {
            opacity: 0.1
        } ),
        marker: new MarkerStyle( { markerId: DEFAULT_SVG_MARKER_ID } ),
        text: new TextStyle( { color: 'red' } )
    } );
    private selectedObject: MapObject | null = null;

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * @constructor GwtkMapdbTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {

        super( mapWindow, id );

        const layerIdList: WidgetParams['layerIdList'] = [];
        const selectedLayer = '';
        const tableNameList: { tableName: string, name: string }[] = [];
        const elementsList: { key: string, id?: string }[][] = [];
        const fieldsList: FieldColumn[] = [];
        const selectedDatabase: string = '';
        const objectInfo: [string, string | number][] = [];
        const selectedFastSearchFilter: FieldColumn[] = [];
        const inputValueFastSearch: string = '';
        const newFieldsList: { field: string; }[] = [];
        const newFieldsListFast: { field: string; }[] = [];
        const fieldListAdvancedSearch: OnClickDeleteField[] = [];
        const fieldListAdvancedSearchShow: OnClickDeleteField[] = [];
        const totalRecords: number = 0;
        const txtObjectName: string = '';
        const selectedOnMapObject: MapObject[] = [];
        const onMapObjectSelected = false;
        const selectObject = false;
        const recordsOnPage: RecordsOnPage = {
            recordsSelect: [5, 10, 20, 30],
            records: 10,
            page: 1,
            offset: 0,
            recordsLength: 0
        };
        const showElements: { key: string }[] = [];
        const onRequest = false;
        const newObjectInfo: { field: string }[] = [];
        const onSelectedDatabase = false;
        const selectedItem: { key: string; }[] = [];
        const selectedMarkerItem = null;
        const lastSearchObjectList: MapObject[] = [];
        const canSearchObjectList: MapObject[] = [];
        const canSearchObject = false;
        const showInfo = false;
        const selectedItemsId: number[] = [];
        const selectedMapItemList: MapObject[] = [];

        const activeObject = this.map.getActiveObject();

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            layerIdList,                        // Список слоев
            selectedLayer,                      // Выбранный слой
            tableNameList,                      // Массив значений имя, id для баз данных
            elementsList,                       // Список элементов базы данных
            fieldsList,                         // Список полей элемента (фильтры)
            selectedDatabase,                   // Выбранная база данных
            objectInfo,                         // Информация об объекте из списка
            selectedFastSearchFilter,           // Фильтр быстрого поиска
            inputValueFastSearch,               // Введнное значение в поле быстрого поиска
            newFieldsList,                      // Список полей отмеченные чекбоксом
            newFieldsListFast,
            fieldListAdvancedSearch,            // Список полей для рашриренного поиска
            fieldListAdvancedSearchShow,        // Отображаемый список полей для рашриренного поиска
            totalRecords,                       // Всего записей
            txtObjectName,
            activeObject: activeObject ? [activeObject] : [],
            selectedOnMapObject,
            onMapObjectSelected,
            selectObject,
            recordsOnPage,
            showElements,
            onRequest,
            newObjectInfo,
            onSelectedDatabase,
            selectedItem,
            selectedMarkerItem,
            lastSearchObjectList,
            canSearchObjectList,
            canSearchObject,
            showInfo,
            selectedItemsId,
            selectedMapItemList,
            onlyFieldList: [],
            onlyField: false,
        };
    }

    protected destroy() {
        super.destroy();
        this.map.requestRender();
    }

    onSelectObjects(): void {
        this.widgetProps.selectedMapItemList = this.map.getSelectedObjects();
        if ( this.widgetProps.canSearchObjectList.length === 0 ) {
            this.widgetProps.canSearchObject = false;
        }
        if ( this.widgetProps.selectedMapItemList.length === 0 ) {
            this.widgetProps.canSearchObject = false;
            return;
        }

        this.widgetProps.canSearchObjectList = this.widgetProps.selectedMapItemList.filter( element => element.sheetName === this.checkDatabaseName() );

        if ( this.widgetProps.canSearchObjectList.length != this.widgetProps.lastSearchObjectList.length ) {
            this.widgetProps.canSearchObject = true;
        } else {
            this.widgetProps.canSearchObject = false;
            for ( let i = 0; i < this.widgetProps.canSearchObjectList.length; i++ ) {
                const foundObject = this.widgetProps.lastSearchObjectList.find( ( el ) => el.gmlId == this.widgetProps.canSearchObjectList[ i ].gmlId );
                if ( !foundObject ) {
                    this.widgetProps.canSearchObject = true;
                    break;
                }
            }
        }
    }

    /**
     * регистрация Vue компонента
     */
    createTaskPanel() {
        // регистрация Vue компонента настройки
        this.widgetProps.newFieldsList = [];
        this.widgetProps.canSearchObjectList = [];
        this.widgetProps.elementsList.splice( 0 );

        const nameWidget = 'GwtkMapdbWidget';
        const sourceWidget = GwtkMapdbWidget;
        this.mapWindow.registerComponent( nameWidget, sourceWidget );

        // Создание Vue компонента
        this.mapWindow.createBottomWidget( nameWidget, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );

        // Получение списка слоёв
        this.widgetProps.layerIdList.length = 0;
        for ( let i = 0; i < this.map.options.layers.length; i++ ) {
            const layerOptions = this.map.options.layers[ i ];
            if ( layerOptions.mapdb ) {
                this.widgetProps.layerIdList.push( { value: layerOptions.id, text: layerOptions.alias } );
            }
        }

    }

    setup() {
        super.setup();
        this.validateWorkspaceData();
    }

    private getCurrentLayer(): Layer | undefined {
        return this.map.tiles.getLayerByxId( this.widgetProps.selectedLayer );
    }

    get currentIdLayer(): string {
        let result = '';

        const layer = this.getCurrentLayer();
        if ( layer ) {
            result = layer.idLayer;
        }

        return result;
    }

    private async validateWorkspaceData() {
        if (this.widgetProps.layerIdList.length > 0) {
            if (this.workspaceData?.recordsOnPage) {
                this.widgetProps.recordsOnPage.records = this.workspaceData?.recordsOnPage;
            }
            if (this.workspaceData?.onlyField) {
                this.widgetProps.onlyField = this.workspaceData.onlyField;
            }
            if (this.workspaceData?.fieldList) {
                if (this.workspaceData?.fieldList.length > 0) {
                    this.fieldList = true;
                }
            }
            if (this.workspaceData?.selectedLayer && this.workspaceData?.selectedDatabase) {
                const selectedLayer = this.workspaceData?.selectedLayer;
                const selectedDatabase = this.workspaceData?.selectedDatabase;
                if (!this.widgetProps.layerIdList.find((layer) => layer.value === selectedLayer)) {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('phrases.Recovery error'),
                        description: i18n.tc('phrases.Could not find layer') + ': ' + selectedLayer,
                        type: LogEventType.Error,
                        display: true
                    });
                    this.workspaceData.selectedLayer = '';
                    this.workspaceData.selectedDatabase = '';
                    this.writeWorkspaceData(true);
                    await this.setState(ON_SELECT_LAYER, this.widgetProps.layerIdList[0].value);
                    return;
                }
                this.widgetProps.selectedDatabase = selectedDatabase;
                this.widgetProps.selectedLayer = selectedLayer;
                await this.setState(ON_SELECT_LAYER, selectedLayer);
                if (!this.widgetProps.tableNameList.find((table) => table.tableName === selectedDatabase)) {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('phrases.Recovery error'),
                        description: i18n.tc('phrases.Could not find table') + ': ' + selectedDatabase,
                        type: LogEventType.Error,
                        display: true
                    });
                    this.workspaceData.selectedLayer = '';
                    this.workspaceData.selectedDatabase = '';
                    this.writeWorkspaceData(true);
                    this.widgetProps.selectedDatabase = '';
                    this.widgetProps.selectedLayer = '';
                    await this.setState(ON_SELECT_LAYER, this.widgetProps.layerIdList[0].value);
                    return;
                }
                await this.setState(ON_SELECT_DATABASE, { dbname: selectedDatabase, reset: true });
            } else {
                this.workspaceData = {
                    selectedLayer: '',
                    selectedDatabase: '',
                    recordsOnPage: 10,
                    onlyField: false,
                    fieldList: []
                };
                await this.setState(ON_SELECT_LAYER, this.widgetProps.layerIdList[0].value);
            }
        } else {
            this.map.writeProtocolMessage(
                {
                    text: i18n.tc('phrases.Failed to get data'),
                    type: LogEventType.Error
                }
            );
            this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Dbm layers are not contained in the map'));
            this.map.getTaskManager().detachTask(this.id);
        }
    }

    /**
     * отправить запрос
     *
     * @param requestData
     * @param [requestBody]
     */
    sendRequest( requestData: SimpleJson, requestBody?: string ) {
        this.widgetProps.onRequest = true;

        const layer = this.getCurrentLayer();
        if ( layer ) {
            const url = layer.serviceUrl.replace( 'service.php', 'mapdb/mapdb.php' );

            const httpParams = RequestServices.createHttpParams( this.map, {
                url,
                data: requestBody,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            } );

            RequestService.postRequest<Response>( httpParams, requestData ).then( ( req ) => {
                if ( req.data ) {
                    if ( !req.data.records ) {
                        this.widgetProps.showElements.splice( 0 );
                        this.mapObjectsList.splice( 0 );
                    }
                    this.widgetProps.onRequest = false;
                    if ( requestData.cmd === 'getfields' ) {
                        this.widgetProps.fieldsList = req.data.columns;
                        this.widgetProps.fieldsList?.sort( function ( a, b ) {
                            if ( a.field > b.field ) {
                                return 1;
                            }
                            if ( a.field < b.field ) {
                                return -1;
                            }
                            return 0;
                        } );
                        if ( !this.fieldList ) {
                            this.widgetProps.newObjectInfo = [];
                        }
                        this.widgetProps.newFieldsList = [];
                        this.widgetProps.newFieldsListFast = [];
                        this.widgetProps.onlyFieldList = [];
                        for ( let i = 0; i < req.data.columns?.length; i++ ) {
                            if ( req.data.columns[ i ] != null && req.data.columns[ i ] != undefined ) {
                                this.widgetProps.newFieldsList.push( req.data.columns[ i ] );
                                this.widgetProps.newFieldsListFast.push( req.data.columns[ i ] );
                                if ( !this.fieldList ) {
                                    this.widgetProps.newObjectInfo.push( req.data.columns[ i ] );
                                } else {
                                    if ( this.workspaceData?.fieldList ) {
                                        for ( let f = 0; f < this.workspaceData?.fieldList.length; f++ ) {
                                            if ( req.data.columns[ i ].field == this.workspaceData?.fieldList[ f ].field ) {
                                                this.widgetProps.newObjectInfo.push( req.data.columns[ i ] );
                                            }
                                        }
                                    }

                                }
                            }
                        }
                        this.workspaceData!.fieldList = this.widgetProps.newObjectInfo;
                        this.writeWorkspaceData( true );
                        this.fieldList = false;
                        this.widgetProps.newFieldsListFast.sort( function ( a, b ) {
                            if ( a.field > b.field ) {
                                return 1;
                            }
                            if ( a.field < b.field ) {
                                return -1;
                            }
                            return 0;
                        } );
                        this.widgetProps.newFieldsListFast.unshift( { field: 'All Fields' } );
                        this.sortFields();
                        this.setState( ON_ADVANCED_SEARCH, null );
                        this.setState( ON_CHANGE_CHECKBOX_FAST_SEARCH, 'all' );
                    } else {
                        if ( req.data.records ) {
                            const ids: string[] = [];
                            this.widgetProps.totalRecords = Number( req.data.total );
                            this.widgetProps.recordsOnPage.recordsLength = req.data.records.length;
                            const totalRecords = this.widgetProps.totalRecords;
                            if ( req.data.records.length < totalRecords ) {
                                this.widgetProps.elementsList.push( req.data.records );
                                for ( let i = 0; i < this.widgetProps.elementsList[ this.widgetProps.recordsOnPage.page - 1 ].length; i++ ) {
                                    this.widgetProps.showElements.push( this.widgetProps.elementsList[ this.widgetProps.recordsOnPage.page - 1 ][ i ] );
                                    ids.push( this.widgetProps.elementsList[ this.widgetProps.recordsOnPage.page - 1 ][ i ].id );
                                }
                                this.createMapObject( ids );
                            } else {
                                const totalRecords = this.widgetProps.totalRecords;
                                const recordsPerPage = this.widgetProps.recordsOnPage.records;
                                const length = Math.ceil( totalRecords / recordsPerPage );
                                for ( let i = 0; i < length; i++ ) {
                                    this.widgetProps.elementsList[ i ] = [];
                                    for ( let j = 0; j < recordsPerPage; j++ ) {
                                        const index = j + (recordsPerPage * i);
                                        if ( req.data.records[ index ] ) {
                                            this.widgetProps.elementsList[ i ].push( req.data.records[ index ] );
                                            ids.push( req.data.records[ index ].id );

                                        }
                                    }
                                }
                                this.createMapObject( ids );
                                this.widgetProps.showElements.splice( 0, this.widgetProps.showElements.length, ...this.widgetProps.elementsList[ 0 ] );
                            }
                        } else {
                            this.widgetProps.totalRecords = 0;
                        }
                    }
                }
            } );
        }
        this.widgetProps.canSearchObjectList = [];
        this.widgetProps.canSearchObject = false;
    }

    private async createMapObject( elements: string[] ) {
        const mapIdToIndex = new Map();
        const idsArray = elements.map(value => {
            const id = this.checkDatabaseName() + '.' + Number(value);
            mapIdToIndex.set(id, Number(value) - 1);
            return id;
        });
        const ids = idsArray.join(',');
        const layer = this.getCurrentLayer();
        if ( !layer ) {
            return;
        }
        const url = layer.serviceUrl;
        const httpParams = RequestServices.createHttpParams( this.map, { url } );
        const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );
        const queryfeature = {
            IDLIST: ids,
            LAYER: layer.idLayer,
            OUTTYPE: OUTTYPE.JSON,
            CRS: this.map.getCrsString(),
            LAYAERID: this.checkDatabaseName(),
        };
        const result = await service.getFeatureById( queryfeature ).catch( ( err ) => {
            this.map.writeProtocolMessage( { text: err, type: LogEventType.Error } );
        } );

        if ( result ) {
            const geoJSON = new GeoJSON( result.data );

            for ( let i = 0, feature; (feature = geoJSON.featureCollection.getFeature( i )); i++ ) {
                const geometry = feature.getGeometry();
                const vectorLayer = this.map.getVectorLayerByxId( layer.xId );
                const projectionId = vectorLayer!.map.ProjectionId;
                const mapObject = new MapObject( vectorLayer!, geometry.type, feature.properties );
                if ( feature.properties.semantics ) {
                    mapObject.addSemanticList( feature.properties.semantics );
                }
                const objects = geometry.getMultiPolygonCoordinates();
                objects.forEach( ( contours, objectNumber ) => {
                    contours.forEach( ( coordinates, contourNumber ) => {
                        coordinates.forEach( coord => {
                            const mapPoint = MapPoint.fromOriginArray( coord, projectionId );
                            mapObject.addPoint( mapPoint, { objectNumber, contourNumber } );
                        } );
                    } );
                } );
                const idx = mapIdToIndex.get( mapObject.gmlId );
                this.mapObjectsList[ idx ] = mapObject;
            }
        }

    }

    private setSelectedObject( mapObject: MapObject | null ) {
        if ( mapObject ) {
            const mapBbox = this.map.getWindowBounds();
            if ( !mapBbox.intersects( mapObject.getBounds() ) ) {
                // переход в центр объекта
                const mapPoint = mapObject.getCenter();
                this.map.setMapCenter( mapPoint, true );
                this.map.overlayRefresh();
            } else {
                this.map.fitBounds( mapObject.getBounds() );
            }
        }
        if ( this.selectedObject !== mapObject ) {
            this.selectedObject = mapObject;
            this.map.requestRender();
        }
    }

    checkDatabaseName() {
        // fixme: везде удалить 'layers/' ?
        return this.widgetProps.selectedDatabase.slice( 0, -4 ).slice( 7 ); // layers/settlements.dbm -> settlements
    }


    private sortFields() {
        this.widgetProps.newFieldsList.sort( function ( a, b ) {
            if ( a.field > b.field ) {
                return 1;
            }
            if ( a.field < b.field ) {
                return -1;
            }
            return 0;
        } );
        this.widgetProps.newFieldsList.unshift( { field: 'All Fields' } );
    }

    private sortOnlyFields() {
        this.widgetProps.onlyFieldList.sort( function ( a, b ) {
            if ( a.field > b.field ) {
                return 1;
            }
            if ( a.field < b.field ) {
                return -1;
            }
            return 0;
        } );
    }

    private sortObjInfo() {
        this.widgetProps.objectInfo.sort( ( a, b ) => {
            if ( a[ 0 ] && b[ 0 ] && a[ 0 ] > b[ 0 ] ) {
                return 1;
            }
            if ( a[ 0 ] && b[ 0 ] && a[ 0 ] < b[ 0 ] ) {
                return -1;
            }
            return 0;
        } );
        this.widgetProps.newObjectInfo.sort( function ( a, b ) {
            if ( a.field > b.field ) {
                return 1;
            }
            if ( a.field < b.field ) {
                return -1;
            }
            return 0;
        } );
        this.workspaceData!.fieldList = this.widgetProps.newObjectInfo;
        this.writeWorkspaceData( true );
    }

    private async sendTablesNameRequest() {
        const layer = this.getCurrentLayer();
        if ( layer ) {
            this.widgetProps.onRequest = true;
            const restService = RequestServices.retrieveOrCreate( { url: layer.serviceUrl }, ServiceType.REST );
            return await restService.getSheetName( { LAYER: layer.idLayer }, {
                url: layer.serviceUrl
            } );
        }
    }

    private async getTablesName() {
        this.widgetProps.tableNameList.splice( 0 );
        const tableList = (await this.sendTablesNameRequest())?.data?.restmethod.outparams;
        if ( tableList ) {
            for ( let i = 0; i < tableList.length; i++ ) {
                this.widgetProps.tableNameList.push( {
                    tableName: GwtkMapdbTask.addLayersString( tableList[ i ].value ),
                    name: tableList[ i ].value + '_dbm'
                } );
            }
        }
        this.widgetProps.onRequest = false;
        if ( this.widgetProps.selectedDatabase == '' ) {
            await this.setState( ON_SELECT_DATABASE, { dbname: this.widgetProps.tableNameList[ 0 ].tableName, reset: true } );
        }
    }

    private onSelectDatabase( currentValue: { dbname?: string, reset?: boolean } ) {
        if ( this.widgetProps.canSearchObjectList.length > 0 ) {
            this.widgetProps.canSearchObject = true;
            this.widgetProps.lastSearchObjectList = [];
        }
        this.widgetProps.selectedMarkerItem = {};
        this.setSelectedObject( null! );
        this.widgetProps.onSelectedDatabase = true;
        this.widgetProps.elementsList = [];
        this.widgetProps.selectedItem = [];
        if ( currentValue.reset ) {
            this.widgetProps.recordsOnPage.page = 1;
            this.widgetProps.recordsOnPage.offset = 0;
        }
        this.widgetProps.selectedFastSearchFilter = [];
        this.widgetProps.inputValueFastSearch = '';
        if ( typeof currentValue.dbname === 'string' ) {
            this.widgetProps.selectedDatabase = currentValue.dbname;
        }
        const data = {
            layer_id: this.currentIdLayer,
            filepath: this.widgetProps.selectedDatabase,
            limit: '' + this.widgetProps.recordsOnPage.records,
            offset: '' + this.widgetProps.recordsOnPage.offset
        };
        const requestData = MapdbmFilter.createRequestData( data );
        this.sendRequest( {
            cmd: 'getfields',
            layer_id: this.currentIdLayer,
            filepath: this.widgetProps.selectedDatabase
        } );
        this.sendRequest( requestData );
        this.widgetProps.selectedItemsId.splice( 0 );
    }

    private async clickOnMarker( currentValueCom: { marker: boolean, elementId: { [ x: string ]: string; key: string }[]; } ) {

        const layer = this.getCurrentLayer();
        if ( !layer ) {
            return;
        }

        if ( currentValueCom.marker && this.widgetProps.selectedMarkerItem === currentValueCom.elementId[ 0 ] ) {
            this.widgetProps.selectedMarkerItem = {};
            this.setSelectedObject( null! );
            return;
        }
        if ( currentValueCom.marker ) {
            this.widgetProps.selectedMarkerItem = currentValueCom.elementId[ 0 ];
        }
        if ( currentValueCom.elementId.length == 0 ) {
            this.widgetProps.canSearchObjectList = [];
            this.widgetProps.canSearchObject = false;
            this.map.clearSelectedObjects();
        }

        for ( let i = 0; i < currentValueCom.elementId.length; i++ ) {
            const idx = Number( currentValueCom.elementId[ i ].id ) - 1;
            if ( currentValueCom.marker ) {
                this.widgetProps.selectObject = true;
                this.setSelectedObject( this.mapObjectsList[ idx ] );
            } else {
                const mapObject = this.mapObjectsList[ idx ];
                const result = this.map.getSelectedObjectById( mapObject.gmlId, mapObject.vectorLayer.serviceUrl, mapObject.vectorLayer.idLayer );
                if ( result ) {
                    this.map.removeSelectedObject( result );
                } else {
                    this.map.addSelectedObject( this.mapObjectsList[ idx ] );
                    if ( this.map.getSelectedObjects().length > 0 ) {
                        const bounds = this.map.getSelectedObjects()[ 0 ].getBounds().clone();
                        this.map.getSelectedObjects().forEach( ( mapObject ) => {
                            const currentBounds = mapObject.getBounds();
                            bounds.extend( currentBounds.min );
                            bounds.extend( currentBounds.max );
                        } );
                        this.map.fitBounds( bounds );
                    }
                }
            }
            this.widgetProps.onRequest = false;
        }
    }

    private onSelectAdvancedSearchField( currentValueOsasf: { column_type: string; field: string } ) {
        let operations;
        if ( currentValueOsasf.column_type != 'varchar' ) {
            operations = [
                { name: 'is' },
                { name: 'in' },
                { name: 'not in' },
                { name: 'between' }
            ];
        } else {
            operations = [
                { name: 'is' },
                { name: 'begins' },
                { name: 'contains' },
                { name: 'ends' }
            ];
        }

        this.widgetProps.fieldListAdvancedSearch.push( {
            field: currentValueOsasf.field,
            column_type: currentValueOsasf.column_type,
            operator: '',
            operations,
            value1: '',
            value2: '',
        } );
        const indexFieldList = this.widgetProps.newFieldsList.indexOf( currentValueOsasf );
        if ( indexFieldList !== -1 ) {
            this.widgetProps.newFieldsList.splice( indexFieldList, 1 );
            this.sortFields();
        }
    }

    private onClickSearchButton() {
        this.widgetProps.inputValueFastSearch = '';
        this.widgetProps.recordsOnPage.page = 1;
        this.widgetProps.elementsList.splice( 0 );
        let dataRequest = [];
        for ( let i = 0; i < this.widgetProps.fieldListAdvancedSearch.length; i++ ) {
            if ( this.widgetProps.fieldListAdvancedSearch[ i ].operator &&
                this.widgetProps.fieldListAdvancedSearch[ i ].value1 ) {
                if ( this.widgetProps.fieldListAdvancedSearch[ i ].operator != 'between' ) {
                    dataRequest.push( {
                        field: this.widgetProps.fieldListAdvancedSearch[ i ].field,
                        column_type: this.widgetProps.fieldListAdvancedSearch[ i ].column_type,
                        operator: this.widgetProps.fieldListAdvancedSearch[ i ].operator,
                        value1: this.widgetProps.fieldListAdvancedSearch[ i ].value1,
                    } );
                } else if ( this.widgetProps.fieldListAdvancedSearch[ i ].value2 &&
                    this.widgetProps.fieldListAdvancedSearch[ i ].operator === 'between' ) {
                    dataRequest.push( {
                        field: this.widgetProps.fieldListAdvancedSearch[ i ].field,
                        column_type: this.widgetProps.fieldListAdvancedSearch[ i ].column_type,
                        operator: this.widgetProps.fieldListAdvancedSearch[ i ].operator,
                        value1: this.widgetProps.fieldListAdvancedSearch[ i ].value1,
                        value2: this.widgetProps.fieldListAdvancedSearch[ i ].value2,
                    } );
                }
            }
        }
        const reqData = MapdbmFilter.createAdvancedSearchRequest( dataRequest, this.currentIdLayer, this.widgetProps.selectedDatabase );
        this.sendRequest( reqData );
        this.widgetProps.fieldListAdvancedSearchShow = this.widgetProps.fieldListAdvancedSearch;
    }

    private selectAll( value: string ) {
        if ( value === 'showSettings' ) {
            this.widgetProps.selectedFastSearchFilter = [];
            for ( let i = 0; i < this.widgetProps.fieldsList.length; i++ ) {
                this.widgetProps.selectedFastSearchFilter.push( this.widgetProps.fieldsList[ i ] );
            }
        } else if ( value === 'showInfoSettings' ) {
            if ( this.widgetProps.newObjectInfo.length > 0 ) {
                this.widgetProps.newObjectInfo = [];
            } else {
                this.widgetProps.newObjectInfo = [];
                for ( let i = 0; i < this.widgetProps.fieldsList.length; i++ ) {
                    this.widgetProps.newObjectInfo.push( this.widgetProps.fieldsList[ i ] );
                }
            }
            this.sortObjInfo();
        }
    }

    async setState<K extends keyof GwtkMapdbkState>( key: K, value: GwtkMapdbkState[K] ) {
        switch ( key ) {

            case ON_SELECT_LAYER:
                if ( value ) {
                    this.widgetProps.selectedLayer = value as string;
                    if (this.widgetProps.selectedLayer !== value) {
                        this.widgetProps.selectedDatabase = '';
                    }
                    this.workspaceData!.selectedLayer = value as string;
                    this.writeWorkspaceData( true );
                }
                await this.getTablesName();
                break;

            case ON_SELECT_DATABASE:
                const currentValue = value as { dbname?: string, reset?: boolean };
                if ( typeof currentValue?.dbname == 'string' ) {
                    this.workspaceData!.selectedDatabase = currentValue.dbname as string;
                    this.writeWorkspaceData( true );
                }
                this.onSelectDatabase( currentValue );
                this.onSelectObjects();
                break;

            case ON_CLICK_SHOW_INFO:

                if ( typeof (value as number) === 'number' ) {
                    const entries: [string | number | undefined, string | number | undefined][] = Object.entries( this.widgetProps.showElements[ value as number ] );
                    this.widgetProps.objectInfo = [];
                    for ( let i = 0; i < entries.length; i++ ) {
                        this.widgetProps.objectInfo[ i ] = entries[ i ];
                    }
                    this.sortObjInfo();
                }
                break;

            case CLICK_ON_OBJECT:
                const itemId = value as number - 1;
                const index = this.widgetProps.selectedItemsId.indexOf( itemId );
                if ( index !== -1 ) {
                    this.widgetProps.selectedItemsId.splice( index, 1 );
                } else {
                    this.widgetProps.selectedItemsId.push( itemId );
                }
                if ( this.widgetProps.selectedItemsId.length > 0 ) {
                    this.widgetProps.onRequest = true;
                }

                this.map.clearSelectedObjects();
                this.widgetProps.selectedItem.splice( 0 );
                for ( let i = 0; i < this.widgetProps.selectedItemsId.length; i++ ) {
                    const data = this.widgetProps.showElements.find( ( el ) => el.id == this.widgetProps.selectedItemsId[ i ] + 1 );
                    if ( data ) {
                        this.widgetProps.selectedItem.push( data );
                    }
                }
                this.setState( CLICK_ON_MARKER, { marker: false, elementId: this.widgetProps.selectedItem } );
                break;

            case CLICK_CANCEL_OBJECT:
                this.widgetProps.selectedItem.splice( 0 );
                this.widgetProps.selectedItemsId.splice( 0 );
                this.map.clearSelectedObjects();
                this.widgetProps.canSearchObjectList = [];
                this.widgetProps.canSearchObject = false;
                break;

            case CLICK_SELECT_OBJECT:
                this.widgetProps.selectedItemsId.splice( 0 );
                for ( let i = 0; i < this.widgetProps.showElements.length; i++ ) {
                    this.widgetProps.selectedItemsId.push( i );
                }
                this.map.clearSelectedObjects();
                this.widgetProps.selectedItem.splice( 0 );
                for ( let i = 0; i < this.widgetProps.selectedItemsId.length; i++ ) {
                    const data = this.widgetProps.showElements.find( ( el ) => el.id == this.widgetProps.selectedItemsId[ i ] + 1 );
                    if ( data ) {
                        this.widgetProps.selectedItem.push( data );
                    }
                }

                this.setState( CLICK_ON_MARKER, { marker: false, elementId: this.widgetProps.selectedItem } );
                break;

            case CLICK_ON_MARKER:
                const currentValueCom = value as { marker: boolean, elementId: { [ x: string ]: string; key: string }[]; };
                this.clickOnMarker( currentValueCom );
                break;

            case SELECT_FAST_SEARCH_FILTER:
                this.widgetProps.selectedFastSearchFilter.splice( 0 );
                if ( value ) {
                    this.widgetProps.selectedFastSearchFilter.push( value as FieldColumn );
                }
                break;

            case ON_INPUT_FAST_SEARCH:
                this.widgetProps.inputValueFastSearch = value as string;
                break;

            case FAST_SEARCH:
                this.widgetProps.recordsOnPage.page = 1;
                this.widgetProps.elementsList.splice( 0 );

                if ( this.widgetProps.inputValueFastSearch != null || value == true ) {
                    if ( this.widgetProps.inputValueFastSearch.length > 0 && this.widgetProps.selectedFastSearchFilter[ 0 ] || value == true ) {
                        const reqData = MapdbmFilter.createFastSearchData(
                            this.widgetProps.inputValueFastSearch,
                            this.widgetProps.selectedFastSearchFilter,
                            this.currentIdLayer,
                            this.widgetProps.selectedDatabase );
                        if ( reqData ) {
                            this.sendRequest( reqData.url, reqData.body );
                        }
                    }
                }
                break;

            case ON_CHECKBOX:
                const currentValueOc = value as { field: { field: string; column_type: string; }; name: string; };
                if ( currentValueOc.name === 'showSettings' ) {
                    this.widgetProps.selectedFastSearchFilter = [currentValueOc.field];
                } else if ( currentValueOc.name === 'showInfoSettings' ) {
                    const index = this.widgetProps.newObjectInfo.indexOf( currentValueOc.field );
                    if ( index !== -1 ) {
                        this.widgetProps.newObjectInfo.splice( index, 1 );
                    } else {
                        this.widgetProps.newObjectInfo.push( currentValueOc.field );
                    }
                    this.sortObjInfo();
                }
                break;

            case ON_ADVANCED_SEARCH:
                this.widgetProps.fieldListAdvancedSearch = [];
                break;

            case ON_SELECT_OPERATION_TYPE:
                const currentValueOsot = value as ValueId;
                if ( value ) {
                    this.widgetProps.fieldListAdvancedSearch[ currentValueOsot.id ].operator = currentValueOsot.value;
                }
                break;

            case ON_INPUT_VALUE_1:
                const currentValueOiv1 = value as ValueId;
                if ( value ) {
                    this.widgetProps.fieldListAdvancedSearch[ currentValueOiv1.id ].value1 = currentValueOiv1.value;
                }
                break;

            case ON_INPUT_VALUE_2:
                const currentValueOiv2 = value as ValueId;
                if ( value ) {
                    this.widgetProps.fieldListAdvancedSearch[ currentValueOiv2.id ].value2 = currentValueOiv2.value;
                }
                break;

            case ON_CLICK_SEARCH_BUTTON:
                this.onClickSearchButton();
                break;

            case CLOSE_MAP_OBJECT:
                this.map.clearSelectedObjects();
                this.widgetProps.onMapObjectSelected = false;
                break;

            case SEARCH_MAP_OBJECT:
                const currentValueSmo = value as SearchMapObject;
                this.widgetProps.onSelectedDatabase = true;
                this.setState( CLOSE_MAP_OBJECT, null );
                if ( currentValueSmo.filepath ) {
                    this.widgetProps.selectedDatabase = GwtkMapdbTask.addLayersString( currentValueSmo.filepath );
                }
                break;

            case ON_CLICK_ARROW:
                switch ( value ) {
                    case 'next':
                        if ( this.widgetProps.totalRecords / this.widgetProps.recordsOnPage.records > this.widgetProps.recordsOnPage.page ) {
                            this.widgetProps.recordsOnPage.page++;

                        }
                        break;
                    case 'previous':
                        if ( this.widgetProps.recordsOnPage.page > 1 ) {
                            this.widgetProps.recordsOnPage.page--;
                        }
                        break;
                }
                this.widgetProps.recordsOnPage.offset = this.widgetProps.recordsOnPage.records * (this.widgetProps.recordsOnPage.page - 1);
                const data1 = {
                    layer_id: this.currentIdLayer,
                    filepath: this.widgetProps.selectedDatabase,
                    limit: '' + this.widgetProps.recordsOnPage.records,
                    offset: '' + this.widgetProps.recordsOnPage.offset
                };
                const requestData1 = MapdbmFilter.createRequestData( data1 );
                if ( this.widgetProps.recordsOnPage.recordsLength === this.widgetProps.recordsOnPage.records ) {
                    this.sendRequest( requestData1 );
                } else {
                    for ( let i = 0; i < this.widgetProps.elementsList[ this.widgetProps.recordsOnPage.page - 1 ].length; i++ ) {
                        this.widgetProps.showElements.push( this.widgetProps.elementsList[ this.widgetProps.recordsOnPage.page - 1 ][ i ] );
                    }
                }
                break;

            case ON_SELECT_RECORD_ON_PAGE:
                this.widgetProps.recordsOnPage.records = value as number;
                this.workspaceData!.recordsOnPage = value as number;
                this.writeWorkspaceData(true);
                this.widgetProps.recordsOnPage.page = 1;
                this.widgetProps.recordsOnPage.offset = 0;
                this.setState( ON_SELECT_DATABASE, { dbname: this.widgetProps.selectedDatabase, reset: false } );
                break;

            case ON_CHANGE_CHECKBOX_FAST_SEARCH:
                this.widgetProps.selectedFastSearchFilter = [];
                if ( value === 'all' ) {
                    for ( let i = 0; i < this.widgetProps.fieldsList?.length; i++ ) {
                        this.widgetProps.selectedFastSearchFilter.push( this.widgetProps.fieldsList[ i ] );
                    }
                }
                break;

            case ON_SELECT_ADVANCES_SEARCH_FIELD:
                const currentValueOsasf = value as { column_type: string; field: string };
                this.onSelectAdvancedSearchField( currentValueOsasf );
                break;

            case ON_CLICK_DELETE_FIELD:
                if ( value ) {
                    const currentValueOcdf = value as OnClickDeleteField;
                    const indexField = this.widgetProps.fieldListAdvancedSearch.indexOf( currentValueOcdf );
                    if ( indexField !== -1 ) {
                        this.widgetProps.newFieldsList.push( currentValueOcdf );
                        this.widgetProps.fieldListAdvancedSearch.splice( indexField, 1 );
                        this.sortFields();
                    }
                }

                break;

            case SELECT_ALL:
                const currentValueSa = value as string;
                this.selectAll( currentValueSa );
                break;

            case ON_CLICK_MAP_SEARCH:
                this.widgetProps.onSelectedDatabase = false;
                break;

            case ON_CLICK_SEARCH_MAP_OBJECTS:
                const reqData2 = MapdbmFilter.createMapSearchData( this.widgetProps.canSearchObjectList, this.widgetProps.selectedDatabase, this.currentIdLayer );
                this.setState( CLICK_CANCEL_OBJECT, null );
                this.sendRequest( reqData2 );
                this.widgetProps.lastSearchObjectList = this.widgetProps.canSearchObjectList;
                this.widgetProps.canSearchObject = false;
                break;

            case LOAD_MORE:
                this.setState( ON_CLICK_ARROW, 'next' );
                break;

            case SHOW_INFO:
                this.widgetProps.showInfo = value as boolean;
                break;

            case DATA_CHANGE:
                this.onSelectObjects();
                break;
            case CREATE_ONLY_FIELD_LIST:
                const valueOFV = value as string;
                this.widgetProps.onlyFieldList.push( { field: valueOFV } );
                this.sortOnlyFields();
                break;

            case ONLY_FIELD:
                this.widgetProps.onlyField = value as boolean;
                if (this.workspaceData) {
                    this.workspaceData.onlyField = value as boolean;
                }
                this.writeWorkspaceData(true);
                break;

            default:
                if ( this._action ) {
                    this._action.setState( key, value );
                }
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        if ( this.selectedObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.selectedObject, this.selectedObjectStyle );
        }
    }

    private static addLayersString( value: string ) {
        return 'layers/' + value + '.dbm';
    }
}
