/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Задача "Поиск по области"                     *
 *                                                                  *
 *******************************************************************/

import Task, { ActionDescription } from '~/taskmanager/Task';
import GwtkSearchAreaWidget from './GwtkSearchAreaWidget.vue';
import MapWindow, { SaveObjectPanelProps } from '~/MapWindow';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import SelectMapCircleAction, { SELECT_CIRCLE } from '@/components/GwtkSearchArea/actions/SelectMapCircleAction';
import SelectMapObjectAreaAction from '@/components/GwtkSearchArea/actions/SelectMapObjectAreaAction';
import SelectMapPolygonAction, { SELECT_POLYGON } from '@/components/GwtkSearchArea/actions/SelectMapPolygonAction';
import VectorLayer from '~/maplayers/VectorLayer';
import Utils from '~/services/Utils';
import { CURSOR_TYPE, GwtkComponentDescriptionPropsData } from '~/types/Types';
import { GISWebServiceSEMode, SourceType } from '~/services/Search/SearchManager';
import { ActionModePanel, MODE_PANEL_KEYS, SAVE_PANEL_ID, ACTION_COMMIT, ACTION_CANCEL } from '~/taskmanager/Action';
import { DataChangedEvent } from '~/taskmanager/TaskManager';
import i18n from '@/plugins/i18n';
import { CRS, GeoJsonType } from '~/utils/GeoJSON';
import SelectMapObjectAction, { SELECT_OBJECT } from '../actions/SelectMapObjectAction';
import RequestService from '~/services/RequestServices/common/RequestService';
import { CheckCrossByLayersIncludePointsParams, CheckDistanceByLayers, CheckDistanceByLayersIncludePointsResponse, CrossResultOperators, GetLoadDataResponse, GetRequestDataResponse, GetStatusDataResponse, LoadData, ObjectListNumber, UploadFileResponse } from '~/services/RequestServices/RestService/Types';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import { LogEventType } from '~/types/CommonTypes';
import FileUploader from '~/utils/FileUploader';
import { ServiceResponse } from '~/services/Utils/Types';
import { CROSSTYPE } from '~/services/RequestServices/common/enumerables';
import SelectMapLineAction from '../actions/SelectMapLineAction';


export const SELECT_MAPOBJECT_ACTION = 'gwtksearcharea.selectmapobjectaction';
export const SELECT_POLYGON_ACTION = 'gwtksearcharea.selectpolygonaction';
export const SELECT_OBJECT_ACTION = 'gwtksearcharea.selectobjectaction';
export const SELECT_LINE_ACTION = 'gwtksearcharea.selectlineaction';
export const SELECT_CIRCLE_ACTION = 'gwtksearcharea.selectcircleaction';
export const AREA_SELECTED_LAYERS = 'gwtksearcharea.selectedlayers';
export const AREA_ACTION_ID = 'gwtksearcharea.actionId';
export const AREA_VISIBLE_BY_SCALE = 'gwtksearcharea.visiblebyscale';
export const AREA_SEARCH = 'gwtksearcharea.search';
export const AREA_SET_MAPOBJECT = 'gwtksearcharea.setareaobject';
export const UPDATE_SEARCH_PROGRESS_BAR = 'gwtksearcharea.searchrogressbar';
export const ABORT_SEARCH = 'gwtksearcharea.abortsearch';
export const SHOW_SELECT_OBJECT_MESSAGE = 'gwtksearchearea.showselectobjectmessage';
export const SET_SEARCH_TYPE = 'gwtksearcharea.setsearchtype';
export const SET_SELECTED_SEARCH_CROSS_OPERATORS = 'gwtksearcharea.setselectedsearchcrossoperators';
export const START_ADVANCED_SEARCH = 'gwtksearcharea.startadvancedsearch';
export const SET_SELECTED_UNIT_TYPE = 'gwtksearcharea.setselectedunittype';
export const SET_DISTANCE_SEARCH = 'gwtksearcharea.setdistancesearch';
export const CANCEL_SELECT_OBJECT = 'gwtksearcharea.cancelselectobject';
export const ON_SELECT_ADVANCED_SEARCH = 'gwtksearcharea.onselectadvancedsearch';
export const ON_SELECT_OBJECT_TYPE = 'gwtksearcharea.onselectobjecttype';
export const SHOW_ACTIVE_OBJECT = 'gwtksearcharea.showactiveobject';


export type GwtkSearchAreaTaskState = {
    [ AREA_SELECTED_LAYERS ]: LayerIdents[];
    [ AREA_VISIBLE_BY_SCALE ]: boolean;
    [ AREA_ACTION_ID ]: string;
    [ AREA_SEARCH ]: boolean;
    [ AREA_SET_MAPOBJECT ]: MapObject;
    [ SELECT_POLYGON ]: MapObject;
    [ SELECT_OBJECT ]: MapObject;
    [ SELECT_CIRCLE ]: MapObject;
    [ UPDATE_SEARCH_PROGRESS_BAR ]: boolean;
    [ ABORT_SEARCH ]: undefined;
    [ ACTION_CANCEL ]: undefined;
    [ ACTION_COMMIT ]: undefined;
    [ SHOW_SELECT_OBJECT_MESSAGE ]: undefined;
    [ SET_SEARCH_TYPE ]: TypeOfSearch;
    [ SET_SELECTED_SEARCH_CROSS_OPERATORS ]: number[];
    [START_ADVANCED_SEARCH]: undefined;
    [SET_SELECTED_UNIT_TYPE]: UnitType;
    [SET_DISTANCE_SEARCH]: number;
    [CANCEL_SELECT_OBJECT]: undefined;
    [ON_SELECT_ADVANCED_SEARCH]: undefined;
    [ON_SELECT_OBJECT_TYPE]: SelectObjectType;
    [SHOW_ACTIVE_OBJECT]: undefined;
};

export type LayerListItem = {
    id: string,
    alias: string
};

export type LayerIdents = {
    id: string;
};

export enum TypeOfSearch {
    Cross,
    Distance,
}

export enum UnitType {
    meter,
    kilometer
}

type WidgetParams = {
    selectedLayers: LayerIdents[];
    visibleByScale: boolean;
    layers: LayerListItem[];
    setState: GwtkSearchAreaTask['setState'];
    searchProgressBar: boolean;
    modePanel: ActionModePanel;
    regimes: ActionDescription[];
    mapObjectSelected: boolean;
    selectSearchType: TypeOfSearch;
    searchCrossOperators: {value: number, text: string}[];
    selectedSearchCrossOperators: number[];
    selectedUnitType: UnitType;
    distanceSearch: number;
    selectObjectType: SelectObjectType;
    isAdvancedSearch: boolean;
}

const PUBLISH_MAP_SCALE = 1000000;

export enum SelectObjectType {
    point,
    area,
    line,
    object,
    unselect
}

/**
 * Задача "Поиск по области"
 * @class GwtkMapRouteTask
 * @extends Task
 */
export default class GwtkSearchAreaTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * Векторный слой отображения области поиска
     * @private
     * @readonly
     * @property vectorLayer {VectorLayer}
     */
    private readonly vectorLayer: VectorLayer;

    /**
     * Объект области поиска
     * @protected
     * @property mapObject {MapObject|undefined}
     */
    private mapObject!: MapObject;

    /**
     * Свойство активности
     * @private
     * @property activeRequest { Boolean }
     */
    private activeRequest = false;

    private cursor: CURSOR_TYPE;

    private readonly crossMethod = {
        crossline: 'AREASEEKCROSSLINE',
        crosssquare: 'AREASEEKCROSSSQUARE'
    };

    /**
     * @constructor GwtkSearchAreaTask
     * @param mapVue {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapVue: MapWindow, id: string ) {
        super( mapVue, id );
        this.actionRegistry.push(
            {
                getConstructor() {
                    return SelectMapCircleAction;
                },
                id: SELECT_CIRCLE_ACTION,
                active: false,
                enabled: true,
                options: {
                    title: 'phrases.Point,radius',
                    icon: 'mdi-selection-ellipse-arrow-inside'           // icon-areacircle
                }
            },
            {
                getConstructor() {
                    return SelectMapPolygonAction;
                },
                id: SELECT_POLYGON_ACTION,
                active: false,
                enabled: true,
                options: {
                    title: 'phrases.Area of map',
                    icon: 'mdi-selection-search'                        // icon-areapolygon
                }
            },
            {
                getConstructor() {
                    return SelectMapObjectAreaAction;
                },
                id: SELECT_MAPOBJECT_ACTION,
                active: false,
                enabled: true,
                options: {
                    title: 'phrases.Object of map',
                    icon: 'mdi-map-search-outline'
                }
            },
            {
                getConstructor() {
                    return SelectMapObjectAction;
                },
                id: SELECT_OBJECT_ACTION,
                active: false,
                enabled: true,
                options: {
                    title: 'phrases.Object of map',
                    icon: 'mdi-map-search-outline'
                }
            },
            {
                getConstructor() {
                    return SelectMapLineAction;
                },
                id: SELECT_LINE_ACTION,
                active: false,
                enabled: true,
                options: {
                    title: 'phrases.Object of map',
                    icon: 'mdi-map-search-outline'
                }
            }
        );

        //создаем слой для построения
        this.vectorLayer = new VectorLayer( this.map, {
            alias: '',
            id: Utils.generateGUID(),
            url: ''
        } );

        this.mapObject = new MapObject( this.vectorLayer, MapObjectType.Polygon );

        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            taskId: this.id,
            regimes: [],
            selectedLayers: [],
            actionId: '',
            visibleByScale: true,
            layers: [],
            setState: this.setState.bind( this ),
            searchProgressBar: false,
            modePanel: {
                [ SAVE_PANEL_ID ]: undefined
            },
            mapObjectSelected: false,
            selectSearchType: TypeOfSearch.Cross,
            searchCrossOperators: [],
            selectedSearchCrossOperators: [],
            selectedUnitType: UnitType.meter,
            distanceSearch: 0,
            selectObjectType: SelectObjectType.unselect,
            isAdvancedSearch: false
        };

        const circleAction = this.getActionDescription( SELECT_CIRCLE_ACTION );
        if ( circleAction ) {
            this.widgetProps.regimes.push( circleAction );
        }

        const polygonAction = this.getActionDescription( SELECT_POLYGON_ACTION );
        if ( polygonAction ) {
            this.widgetProps.regimes.push( polygonAction );
        }

        const mapObjectAction = this.getActionDescription( SELECT_MAPOBJECT_ACTION );
        if ( mapObjectAction ) {
            this.widgetProps.regimes.push( mapObjectAction );
        }

        const mapObjectSelectAction = this.getActionDescription(SELECT_OBJECT_ACTION);
        if (mapObjectSelectAction) {
            this.widgetProps.regimes.push(mapObjectSelectAction);
        }

        const lineSelectAction = this.getActionDescription(SELECT_LINE_ACTION);
        if (lineSelectAction) {
            this.widgetProps.regimes.push(lineSelectAction);
        }


        this.initSelectedLayers();

        this.updateLayerList();

        this.cursor = CURSOR_TYPE.default;
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const name = 'GwtkSearchAreaWidget';
        const source = GwtkSearchAreaWidget;

        this.mapWindow.registerComponent( name, source );

        // Создание Vue компонента
        this.mapWindow.createWidget( name, this.widgetProps );

        // Добавить в список для удаления при деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    setup() {
        super.setup();

        if (this.widgetProps.layers.length === 0) {
            this.mapWindow.getTaskManager().detachTask(this.id);
            this.mapWindow.addSnackBarMessage(i18n.tc('phrases.There are no available map layers to perform the operation'));
        }


        this.widgetProps.searchCrossOperators.push({
            value: CROSSTYPE.MainInside,
            text: i18n.tc('searcharea.Outside'),
        });

        this.widgetProps.searchCrossOperators.push({
            value: CROSSTYPE.Inside,
            text: i18n.tc('searcharea.Inside'),
        });

        this.widgetProps.searchCrossOperators.push({
            value: CROSSTYPE.Cross,
            text: i18n.tc('searcharea.Cross'),
        });

        this.widgetProps.searchCrossOperators.push({
            value: CROSSTYPE.NotCross,
            text: i18n.tc('searcharea.Not cross'),
        });

        this.widgetProps.searchCrossOperators.push({
            value: CROSSTYPE.CrossInsideList,
            text: i18n.tc('searcharea.Cross and inside'),
        });

        this.widgetProps.searchCrossOperators.push({
            value: CROSSTYPE.CrossOutSideList,
            text: i18n.tc('searcharea.Cross and outside'),
        });

    }


    /**
     * Обновить строки таблицы слоев
     * @private
     * @method updateLayerList
     * @return {Array}
     */
    private updateLayerList(): void {
        this.widgetProps.layers.splice( 0 );

        for ( let i = 0; i < this.map.layers.length; i++ ) {
            const layer = this.map.layers[ i ];
            if ( layer.options.duty || !layer.selectObject || !layer.idLayer ) {
                continue;
            }

            if ( !this.widgetProps.visibleByScale || layer.visible ) {
                this.widgetProps.layers.push( { id: layer.xId, alias: layer.alias } );
            }
        }

        for ( let i = this.widgetProps.selectedLayers.length - 1; i >= 0; i-- ) {
            const layerItem = this.widgetProps.selectedLayers[ i ];
            if ( !this.widgetProps.layers.find( item => layerItem.id === item.id ) ) {
                this.widgetProps.selectedLayers.splice( i, 1 );
            }
        }
        const allLayers = this.map.tiles.getSelectableLayersArray();
        const idents = this.getLayerId();
        for ( let i = 0; i < allLayers.length; i++ ) {
            allLayers[ i ].areaSeek = idents.includes( allLayers[ i ].xId );
        }

        this.setActionsEnabled( this.widgetProps.selectedLayers.length !== 0 );


    }

    onDataChanged(event: DataChangedEvent) {
        if (event.type === 'content' || event.type === 'layercommand') {
            this.updateLayerList();
        }

        if (this.widgetProps.layers.length === 0) {
            this.mapWindow.addSnackBarMessage(i18n.tc('phrases.There are no available map layers to perform the operation'));
        }
    }

    /**
     * Установить текущие параметры
     * @method setState
     */
    setState<K extends keyof GwtkSearchAreaTaskState>( key: K, value: GwtkSearchAreaTaskState[K] ) {

        switch ( key ) {
            case SELECT_OBJECT:
            case SELECT_CIRCLE:
            case SELECT_POLYGON:
                this.mapObject.updateFrom( value as MapObject );
                if (this.widgetProps.isAdvancedSearch) {
                    this.widgetProps.mapObjectSelected = true;
                    setTimeout(() => {
                        this.closeAllActions();
                    }, 3);
                } else {
                    this.run();
                }
                break;
            case SET_SEARCH_TYPE:
                this.widgetProps.selectSearchType = value as TypeOfSearch;
                break;
            case SET_SELECTED_SEARCH_CROSS_OPERATORS:
                this.widgetProps.selectedSearchCrossOperators = value as number[];
                break;
            case START_ADVANCED_SEARCH:
                this.startAdvancedSearch();
                break;
            case SET_SELECTED_UNIT_TYPE:
                this.widgetProps.selectedUnitType = value as UnitType;
                break;
            case SET_DISTANCE_SEARCH:
                this.widgetProps.distanceSearch = value as number;
                break;
            case CANCEL_SELECT_OBJECT:
                this.widgetProps.selectObjectType = SelectObjectType.unselect;
                this.widgetProps.distanceSearch = 0;
                this.widgetProps.selectedUnitType = UnitType.meter;
                this.widgetProps.selectSearchType = TypeOfSearch.Cross;
                this.widgetProps.selectedSearchCrossOperators.splice(0);
                this.map.clearSelectedObjects();
                this.map.clearActiveObject();
                this.widgetProps.mapObjectSelected = false;
                break;
            case ON_SELECT_ADVANCED_SEARCH:
                this.closeAllActions();
                this.setState(ON_SELECT_OBJECT_TYPE, SelectObjectType.unselect);
                this.widgetProps.isAdvancedSearch = !this.widgetProps.isAdvancedSearch;
                break;
            case ON_SELECT_OBJECT_TYPE:
                this.widgetProps.selectObjectType = value as SelectObjectType;
                if (value === SelectObjectType.line) {
                    this.mapObject = new MapObject(this.vectorLayer, MapObjectType.LineString);
                } else {
                    this.mapObject = new MapObject(this.vectorLayer, MapObjectType.Polygon);
                }
                switch (value) {
                    case SelectObjectType.point:
                        this.setAction(SELECT_CIRCLE_ACTION, true);
                        break;
                    case SelectObjectType.area:
                        this.setAction(SELECT_POLYGON_ACTION, true);
                        break;
                    case SelectObjectType.line:
                        this.setAction(SELECT_LINE_ACTION, true);
                        break;
                    case SelectObjectType.object:
                        this.setAction(SELECT_OBJECT_ACTION, true);
                        break;
                }
                break;
            case SHOW_ACTIVE_OBJECT:
                this.map.setActiveObject(this.mapObject);
                break;
            case AREA_SELECTED_LAYERS:
                this.setSelectedLayers( value as LayerIdents[] );
                break;
            case AREA_ACTION_ID:
                this.map.clearActiveObject();
                const id = value as string;
                const newActionState = this._action && this._action.id === id;
                this.setAction(id, !newActionState);
                this.widgetProps.isAdvancedSearch = false;
                this.widgetProps.mapObjectSelected = false;
                break;
            case AREA_VISIBLE_BY_SCALE:
                this.setVisibleByScale( value as boolean );
                break;
            case AREA_SEARCH:
                this.run();
                break;
            case AREA_SET_MAPOBJECT:
                this.setAreaObject( value as MapObject );
                break;
            case UPDATE_SEARCH_PROGRESS_BAR:
                this.widgetProps.searchProgressBar = value as boolean;
                break;
            case ABORT_SEARCH:
                this.abortSearch();
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
            case SHOW_SELECT_OBJECT_MESSAGE:
                this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Select map object'));
                break;
            default:
                if ( this._action ) {
                    this._action.setState( key, value );
                }
        }
    }


    private closeAllActions() {
        for (let i = 0; i < this.widgetProps.regimes.length; i++) {
            const id = this.widgetProps.regimes[i].id;
            const newActionState = this._action && this._action.id === id;
            if (newActionState) {
                this.setAction(id, !newActionState);
            }
            
        }
    }

    private startAdvancedSearch() {
        this.setState(UPDATE_SEARCH_PROGRESS_BAR, true);
        const crs: CRS = {
            type: 'name',
            properties: {
                name: this.map.getCrsString(),
            }
        };
        const json: GeoJsonType = {
            type: 'FeatureCollection',
            crs: crs,
            features: [this.mapObject.toJSON()],
        };

        this.uploadJSON(json);
        this.closeAllActions();
    }


    /**
    * Загружает файл карты на сервер
    * @private
    * @method uploadJSON
    * @param geoJSONData {GeoJsonType} Класс коллекции объектов GeoJSON
    * @param fileName {string} имя файла
    */
    private uploadJSON(geoJSONData: GeoJsonType, fileName: string = 'Temporary') {

        const crsName = geoJSONData.crs ? (geoJSONData.crs.type === 'name' ? geoJSONData.crs.properties.name : '') : '';

        const blob = new Blob([JSON.stringify(geoJSONData)], { type: 'application/json' });

        const file = new File([blob], fileName + '.json', { type: 'application/json' });

        const uploader = new FileUploader(file, { url: this.map.options.url });
        uploader.upload();
        uploader.onSuccess((res: UploadFileResponse['restmethod']) => {
            this.loadData(res.file.path, crsName);
        });
        uploader.onError(() => {
            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
            this.map.writeProtocolMessage({
                text: i18n.tc('searcharea.Error uploading a file to the server') + '!',
                type: LogEventType.Error,
                display: true
            });
        });
    }

    /**
     * Создание пользовательского слоя по файлу JSON
     * @private
     * @method loadData
     */
    private loadData(uploadLink: string, crsName?: string) {
        const serviceUrl = this.map.options.url;
        const httpParams = RequestServices.createHttpParams(this.map, { url: serviceUrl });
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);

        let request, cancellableRequest;

        const options: LoadData = {
            XSDNAME: 'service',
            LAYERNAME: 'TempLayer',
            CRS: crsName || this.map.getCrsString(),
            CREATEMAPSCALE: '' + PUBLISH_MAP_SCALE,
            FILENAME: uploadLink
        };

        request = service.loadData.bind(service);
        cancellableRequest = RequestService.sendCancellableRequest(request, options, httpParams);

        cancellableRequest.promise.then(response => {
            if (response.data) {
                const status = response.data.restmethod.outparams.status;
                if (status === 'Accepted') {
                    const jobId = response.data.restmethod.outparams.jobId;
                    let canRequest = true;
                    const interval = setInterval(() => {
                        if (canRequest) {
                            canRequest = false;
                            (service.getAsyncStatusData({ PROCESSNUMBER: jobId }) as Promise<ServiceResponse<GetStatusDataResponse>>).then((result) => {
                                if (result.data) {
                                    if (result.data.restmethod?.outparams?.status) {
                                        if (result.data.restmethod.outparams.status === 'Succeeded') {
                                            clearInterval(interval);
                                            (service.getAsyncResultData({ PROCESSNUMBER: jobId }) as Promise<ServiceResponse<GetLoadDataResponse>>).then((result) => {
                                                if (result.data) {
                                                    const idLayer = result.data.restmethod.createlayerlist[0].id;
                                                    this.advancedSearch(idLayer);
                                                }
                                            });
                                        } else if (result.data.restmethod.outparams.status === 'Failed') {
                                            canRequest = true;
                                            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
                                            clearInterval(interval);
                                            this.mapWindow.addSnackBarMessage(i18n.tc('phrases.No items found'));
                                        } else if (result.data.restmethod.outparams.status === 'Accepted' || result.data.restmethod.outparams.status === 'Running') {
                                            canRequest = true;
                                        } else {
                                            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
                                            clearInterval(interval);
                                        }
                                    }
                                } else {
                                    this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
                                    clearInterval(interval);
                                    this.mapWindow.addSnackBarMessage(i18n.tc('phrases.No items found'));
                                }
                            });
                        }
                        
                        
                    }, 1000);
                }
            }
        }).catch((error) => {
            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
            this.map.writeProtocolMessage({
                text: i18n.tc('searcharea.Error executing query'),
                display: true,
                description: error,
                type: LogEventType.Error
            });
        });
    }


    private advancedSearch(idLayer: string) {
        const service = RequestServices.getService(this.map.options.url, ServiceType.REST);
        const httpParams = RequestServices.createHttpParams(this.map, { url: this.map.options.url });

        if (this.widgetProps.selectSearchType === TypeOfSearch.Cross) {
            const filterList: number[] = [0, 1, 2, 3, 4, 5];
            for (let i = 0; i < this.widgetProps.selectedSearchCrossOperators.length; i++) {
                const operator = Number(this.widgetProps.selectedSearchCrossOperators[i]);
                const index = filterList.findIndex((item) => item == operator);
                if (index !== -1) {
                    filterList.splice(index, 1);
                    i--;
                }
            }
            const requestData: CheckCrossByLayersIncludePointsParams[] = [
                {
                    LAYER: idLayer,
                    IDINOBJECTLIST: '',
                    IDLIST: '',
                },
                {
                    LAYER: '',
                    CROSSFILTERLIST: filterList.join(',') as CrossResultOperators
                }
            ];
            const serviceUrl = this.map.options.url;
            for (let i = 0; i < this.widgetProps.selectedLayers.length; i++) {
                const layer = this.map.getVectorLayerByxId(this.widgetProps.selectedLayers[i].id);
                
                if (layer) {
                    const layerServiceUrl = layer.serviceUrl;
                    if (serviceUrl === layerServiceUrl) {
                        requestData.push({
                            LAYER: layer.idLayer,
                            IDINOBJECTLIST: '',
                            IDLIST: '',
                        });
                    }
                }
            }
            service.checkCrossByLayersIncludePoints(requestData, httpParams).then((e) => {
                if (e.data?.restmethod.outparams.jobId) {
                    const jobId = e.data.restmethod.outparams.jobId;
                    let canRequest = true;
                    const interval = setInterval(() => {
                        if (canRequest) {
                            canRequest = false;
                            (service.getAsyncStatusData({ PROCESSNUMBER: jobId }) as Promise<ServiceResponse<GetStatusDataResponse>>).then((result) => {
                                if (result.data) {
                                    if (result.data.restmethod?.outparams?.status) {
                                        if (result.data.restmethod.outparams.status === 'Succeeded') {
                                            clearInterval(interval);
                                            (service.getAsyncResultData({ PROCESSNUMBER: jobId }) as Promise<ServiceResponse<GetLoadDataResponse>>).then((result) => {
                                                if (result.data) {
                                                    this.searchCrossResult(result.data.restmethod.outparams);
                                                }
                                            });
                                        } else if (result.data.restmethod.outparams.status === 'Failed') {
                                            canRequest = true;
                                            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
                                            clearInterval(interval);
                                            this.mapWindow.addSnackBarMessage(i18n.tc('phrases.No items found'));
                                        } else if (result.data.restmethod.outparams.status === 'Accepted' || result.data.restmethod.outparams.status === 'Running') {
                                            canRequest = true;
                                        } else {
                                            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
                                            clearInterval(interval);
                                        }
                                    }
                                }
                            }).catch((e) => {
                                this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
                                clearInterval(interval);
                                this.mapWindow.addSnackBarMessage(i18n.tc('phrases.No items found'));
                            });
                        }
                    }, 1000);
                }
            });

        } else if (this.widgetProps.selectSearchType === TypeOfSearch.Distance) {
            const distance = this.widgetProps.selectedUnitType === UnitType.meter ? this.widgetProps.distanceSearch : (this.widgetProps.distanceSearch * 1000);
            const requestData1: CheckDistanceByLayers[] = [
                {
                    LAYER: '',
                    DISTANCE: distance + '',
                    CONDITION: ObjectListNumber.First
                }

            ];
            for (let i = 0; i < this.widgetProps.selectedLayers.length; i++) {
                const layer = this.map.getVectorLayerByxId(this.widgetProps.selectedLayers[i].id);
                if (layer) {
                    requestData1.push({
                        LAYER: layer.idLayer,
                        IDINOBJECTLIST: ObjectListNumber.Second,
                        IDLIST: '',
                    });
                }
            }
            requestData1.push({
                LAYER: idLayer,
                IDINOBJECTLIST: ObjectListNumber.First,
                IDLIST: '',
            });
            service.checkDistanceByLayers(requestData1, httpParams).then((e) => {
                if (e.data?.restmethod.outparams.jobId) {
                    const jobId = e.data.restmethod.outparams.jobId;
                    let canRequest = true;
                    const interval = setInterval(() => {
                        if (canRequest) {
                            canRequest = false;
                            (service.getAsyncStatusData({ PROCESSNUMBER: jobId }) as Promise<ServiceResponse<GetStatusDataResponse>>).then((result) => {
                                if (result.data) {
                                    if (result.data.restmethod?.outparams?.status) {
                                        if (result.data.restmethod.outparams.status === 'Succeeded') {
                                            clearInterval(interval);
                                            (service.getAsyncResultData({ PROCESSNUMBER: jobId }) as Promise<ServiceResponse<CheckDistanceByLayersIncludePointsResponse>>).then((result) => {
                                                if (result.data) {
                                                    this.searchDistanceResult(result.data.features);
                                                }
                                            });
                                        } else if (result.data.restmethod.outparams.status === 'Failed') {
                                            canRequest = true;
                                            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
                                            clearInterval(interval);
                                            this.mapWindow.addSnackBarMessage(i18n.tc('phrases.No items found'));
                                        } else if (result.data.restmethod.outparams.status === 'Accepted' || result.data.restmethod.outparams.status === 'Running') {
                                            canRequest = true;
                                        } else {
                                            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
                                            clearInterval(interval);
                                        }
                                    }
                                }
                            }).catch((e) => {
                                this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
                                clearInterval(interval);
                                this.mapWindow.addSnackBarMessage(i18n.tc('phrases.No items found'));
                            });
                        }
                        
                    }, 1000);
                }
            });
        }
    }

    searchCrossResult(data: any) {
        const idList = [];
        for (const a in data) {
            const filters = data[a];
            for (const b in filters) {
                for (let i = 0; i < filters[b].length; i++) {
                    for (let j = 0; j < filters[b][i].idList.length; j++) {
                        idList.push(filters[b][i].idList[j]);
                    }
                }
            }
        }
        if (!idList.length) {
            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
            this.mapWindow.addSnackBarMessage(i18n.tc('phrases.No items found'));
            return;
        }
        this.searchManagerSearch(idList);
    }

    searchDistanceResult(features: CheckDistanceByLayersIncludePointsResponse['features']) {
        const idList: string[] = [];
        for (let i = 0; i < features.length; i++) {
            if (features[i] && features[i].properties && features[i].properties.id) {
                idList.push(features[i].properties.id);
            }
        }
        if (!idList.length) {
            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
            this.mapWindow.addSnackBarMessage(i18n.tc('phrases.No items found'));
            return;
        }
        this.searchManagerSearch(idList);
    }

    searchManagerSearch(idList: string[]) {
        const searchManager = this.mapWindow.getMap().searchManager;

        const layerList = [];
        const serviceUrl = this.map.options.url;
        for (let i = 0; i < this.widgetProps.selectedLayers.length; i++) {
            const layer = this.map.getVectorLayerByxId(this.widgetProps.selectedLayers[i].id);
            if (layer) {
                const layerServiceUrl = layer.serviceUrl;
                if (serviceUrl === layerServiceUrl) {
                    layerList.push(layer);
                }
            }
        }
        searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.AreaSearch, layerList.length ? layerList : undefined);
        searchManager.clearSearchCriteriaAggregator();
        const aggregator = searchManager.getSearchCriteriaAggregatorCopy();
        const srsNameSearchCriterion = aggregator.getSrsNameSearchCriterion();
        srsNameSearchCriterion.setValue(this.map.getCrsString());

        const idListCriterion = aggregator.getIdListSearchCriterion();
        for (let i = 0; i < idList.length; i++) {
            idListCriterion.addValue(idList[i]);
        }

        this.mapWindow.getTaskManager().updateCriteriaAggregator(aggregator);
        searchManager.setSearchCriteriaAggregator(aggregator);

        searchManager.findNext().then(() => {
            this.map.clearActiveObject();
            this.mapWindow.setCursor(this.cursor);
            this.mapWindow.getTaskManager().showObjectPanel();
        }, () => {
            this.mapWindow.setCursor(this.cursor);
        })
            .finally(() => {
                if (searchManager.responseMapObjectCount != 0) {
                    this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Found objects:') + ' ' + searchManager.responseMapObjectCount);
                } else {
                    this.mapWindow.addSnackBarMessage(i18n.tc('phrases.No items found'));
                }
                this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
            });
    }

    /**
     * Прервать поиск
     * @method abortSearch
     */
    private abortSearch() {
        this.mapWindow.getMap().searchManager.stopSearch();
    }

    /**
     * Установить признак поиска с учетом видимости объектов
     * @method setVisibleByScale
     * @param visibleflag {boolean} признак поиска с учетом видимости
     */
    private setVisibleByScale( visibleflag: boolean ) {
        this.widgetProps.visibleByScale = visibleflag;
        this.updateLayerList();
    }

    /**
     * Установить обработчик
     * @method setAction
     * @param id {string} идентификатор обработчика
     * @param active {boolean} признак активности
     */
    setAction( id: string, active: boolean) {
        if ( active ) {
            this.mapObject.removeAllPoints();
            this.widgetProps.actionId = id;
            this.doAction( id );
        } else {
            this.quitAction( id );
            this.widgetProps.actionId = '';
        }
    }

    /**
     * Инициализировать список слоев для поиска по области
     * @private
     * @method initSelectedLayers
     * @return {Array} массив идентификаторов
     * (Fix! возвращаются id только для основного сервиса)
     */
    private initSelectedLayers() {

        this.widgetProps.selectedLayers = [];
        const allLayers = this.map.tiles.getSelectableLayersArray();

        allLayers.forEach( layer => {
            if ( layer.areaSeek ) {
                this.widgetProps.selectedLayers.push( { id: layer.xId } );
            }
        } );

        this.setActionsEnabled( this.widgetProps.selectedLayers.length !== 0 );
    }

    /**
     * Установить список выбранных слоев
     * @private
     * @method setSelectedLayers
     * @param idlist {LayerIdents[]} идентификаторы слоев
     */
    private setSelectedLayers( idlist: LayerIdents[] ) {
        this.widgetProps.selectedLayers = idlist;
        const allLayers = this.map.tiles.getSelectableLayersArray();
        const idents = this.getLayerId();
        for ( let i = 0; i < allLayers.length; i++ ) {
            allLayers[ i ].areaSeek = idents.includes( allLayers[ i ].xId );
        }

        this.setActionsEnabled( this.widgetProps.selectedLayers.length !== 0 );
    }

    /**
     * Установить доступность режимов
     * Если нет доступных слоев для поиска по области, обработчики (режимы) выбора области не выполняются
     * @private
     * @method setActionsEnabled
     * @param flag {boolean} Доступность режимов
     */
    private setActionsEnabled( flag: boolean ) {

        for ( let i = 0; i < this.widgetProps.regimes.length; i++ ) {
            this.widgetProps.regimes[ i ].enabled = flag;
        }
    }

    /**
     * Получить идентификаторы выбранных слоев
     * @private
     * @method getLayerId
     * @return {string[]} идентификаторы слоев
     */
    private getLayerId() {
        let ids = [];
        for ( let i = 0; i < this.widgetProps.selectedLayers.length; i++ ) {
            ids.push( this.widgetProps.selectedLayers[ i ][ 'id' ] );
        }
        return ids;
    }

    /**
     * Выполнить запрос операции поиска по области
     * @method postRequest
     */
    private postRequest( crossmethod: string = this.crossMethod.crosssquare ) {

        this.activeRequest = true;

        this.cursor = this.mapWindow.setCursor( CURSOR_TYPE.progress );

        const searchManager = this.mapWindow.getMap().searchManager;

        searchManager.activateSource( SourceType.GISWebServiceSE, GISWebServiceSEMode.AreaSearch );
        searchManager.clearSearchCriteriaAggregator();
        const aggregator = searchManager.getSearchCriteriaAggregatorCopy();

        const srsNameSearchCriterion = aggregator.getSrsNameSearchCriterion();
        srsNameSearchCriterion.setValue( this.map.getCrsString() );

        const areaCrossMethod = aggregator.getCrossMethodSearchCriterion();
        areaCrossMethod.setValue( crossmethod );
        aggregator.setCrossMethodSearchCriterion( areaCrossMethod );

        if ( this.widgetProps.visibleByScale ) {
            const scale = this.mapWindow.getMap().getZoomScale( this.mapWindow.getMap().getZoom() );
            if ( scale ) {
                const scaleCriterion = aggregator.getObjectScaleSearchCriterion();
                scaleCriterion.setValue( scale );
                aggregator.setObjectScaleSearchCriterion( scaleCriterion );
            }
        }

        const feature = this.mapObject.toJSON();
        // fixme: ошибка на сервисе при наличии sld !!!
        feature.properties.sld = undefined;
        const geojson: GeoJsonType = {
            type: 'FeatureCollection',
            crs: { type: 'name', properties: { name: this.map.getCrsString() } },
            features: [feature]
        };
        const searchAreaDataCriterion = aggregator.getFileDataCriterion();
        searchAreaDataCriterion.setValue( geojson );
        aggregator.setFileDataCriterion( searchAreaDataCriterion );

        this.mapWindow.getTaskManager().updateCriteriaAggregator( aggregator );
        searchManager.setSearchCriteriaAggregator( aggregator );

        searchManager.findNext().then( () => {
            this.map.clearActiveObject();
            this.mapWindow.setCursor( this.cursor );
            this.mapWindow.getTaskManager().showObjectPanel();
        }, () => {
            this.mapWindow.setCursor( this.cursor );
        } )
            .finally( () => {
                if (searchManager.responseMapObjectCount != 0) {
                    this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Found objects:') + ' ' + searchManager.responseMapObjectCount);
                } else {
                    this.mapWindow.addSnackBarMessage(i18n.tc('phrases.No items found'));
                }
                this.setState( UPDATE_SEARCH_PROGRESS_BAR, false );
            } );

    }

    /**
     * Выполнить операцию
     * @method run
     */
    private run() {
        let actionid = this.widgetProps.actionId ? this.widgetProps.actionId : '';
        this.setState( UPDATE_SEARCH_PROGRESS_BAR, true );

        let crossmethod = this.crossMethod.crosssquare;
        if ( actionid == SELECT_MAPOBJECT_ACTION ) {
            const type = this.mapObject.type;
            if ( type == MapObjectType.LineString || type == MapObjectType.MultiLineString ) {
                crossmethod = this.crossMethod.crossline;
            }
        }
        this.postRequest( crossmethod );

        setTimeout(() => {
            this.setAction(actionid, false);
        }, 3);
    }

    /**
     * Создать объект области поиска
     * @method createAreaObject
     */
    createAreaObject() {
        this.clearAreaObject();
        this.mapObject = this.vectorLayer.createMapObject( MapObjectType.Polygon );
        return this.mapObject;
    }

    /**
     * получить объект области поиска
     * @method getAreaObject
     */
    getAreaObject() {
        return this.mapObject;
    }

    /**
     * Установить объект области поиска
     * @private
     * @method setAreaObject
     */
    private setAreaObject( source: MapObject ) {
        this.mapObject = source.copy();
    }

    /**
     * Очистить объект области поиска
     * @private
     * @method setAreaObject
     */
    private clearAreaObject() {
        if ( this.mapObject ) {
            this.mapObject.removeAllPoints();
        }
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
    removeModePanel( modePanelId?: keyof ActionModePanel ) {
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

}
