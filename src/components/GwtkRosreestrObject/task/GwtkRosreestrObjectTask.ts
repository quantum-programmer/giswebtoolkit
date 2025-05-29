/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 объект Росреестра                                *
 *                                                                  *
 *******************************************************************/

import MapWindow from '~/MapWindow';
import Task from '~/taskmanager/Task';
import {GwtkComponentDescriptionPropsData} from '~/types/Types';
import {AppendPointActionState} from '~/systemActions/AppendPointAction';
import GwtkRosreestrObjectWidget from './GwtkRosreestrObjectWidget.vue';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';
import SearchManager, {GISWebServiceSEMode, SourceType} from '~/services/Search/SearchManager';
import PickPointAction, {SET_COORDINATE_IN_POINT} from '~/systemActions/PickPointAction';
import PixelPoint from '~/geometry/PixelPoint';
import i18n from '@/plugins/i18n';
import {RosreestrQueryType} from '~/services/Search/mappers/RosreestrMapper/RosreestrMapper';
import Style from '~/style/Style';
import MarkerStyle from '~/style/MarkerStyle';
import SVGrenderer, {MAP_YANDEX_PANORAMA_MARKER_ID} from '~/renderer/SVGrenderer';
import GeoPoint from '~/geo/GeoPoint';
import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import {LOCALE} from '~/types/CommonTypes';
import MapObjectSemanticContent from '~/mapobject/utils/MapObjectSemanticContent';
import Layer from '~/maplayers/Layer';


export const GET_SEMANTIC_LIST = 'gwtkrosreestrobject.onselectlayer';
export const GET_TYPE_ROSREESTR_OBJECT = 'gwtkrosreestrobject.getrosreestrobject';
export const UPDATE_SEARCH_TEXT = 'gwtkrosreestrobject.updatesearchtext';
export const START_SEARCH = 'gwtkrosreestrobject.startsearch';
export const SELECT_POINT_ACTION = 'gwtkrosreestrobject.selectpointaction';
export const CHANGE_TAB = 'gwtkrosreestrobject.changetab';
export const REMOVE_POINT_MAP = 'gwtkrosreestrobject.removepointmap';
export const SHOW_OBJECT_IN_MAP = 'gwtkrosreestrobject.showinmap';
export const UPDATE_SEARCH_PROGRESS_BAR = 'gwtkrosreestrobject.searchrogressbar';
export const ABORT_SEARCH = 'gwtkrosreestrobject.abortsearch';
export const CLICK_SEARCH_BUTTON = 'gwtkrosreestrobject.clicksearchbutton';
export const ACTIVE_BY_COORDINATION_IN_MAP = 'gwtkrosreestrobject.activebycoordinationinmap';
export const CHANGE_ROSREESTR_OBJECT = 'gwtkrosreestrobject.changerosreestrobject';

export type GwtkSemanticListForComparison = {
    name: string,
    valueRosreestrObject: string
    valueMapObject: string
}
export type GwtkRosreestrObjectTaskState = {
    [UPDATE_SEARCH_TEXT]: string;
    [START_SEARCH]: undefined;
    [GET_SEMANTIC_LIST]: boolean;
    [GET_TYPE_ROSREESTR_OBJECT]: boolean;
    [SELECT_POINT_ACTION]: boolean;
    [SET_COORDINATE_IN_POINT]: PixelPoint;
    [CHANGE_TAB]: number;
    [REMOVE_POINT_MAP]: undefined;
    [SHOW_OBJECT_IN_MAP]: undefined;
    [UPDATE_SEARCH_PROGRESS_BAR]: boolean;
    [ABORT_SEARCH]: undefined;
    [CLICK_SEARCH_BUTTON]: number;
    [ACTIVE_BY_COORDINATION_IN_MAP]: boolean;
    [CHANGE_ROSREESTR_OBJECT]: number;

} & AppendPointActionState;

type WidgetParams = {
    setState: GwtkRosreestrObjectTask['setState'];
    mapObjectSemantics: GwtkSemanticListForComparison[];
    typeObject: number;
    searchText: string;
    cadNumberText: string;
    showInMap: boolean;
    searchProgressBar: boolean;
    byGetCoordinationInMap: boolean;
    mapObjects: MapObject[];
    objectIndex: number;

}

/**
 * Задача измерений по карте
 * @class  GwtkRosreestrObjectTask
 * @extends Task<GwtkRosreestrObjectTask>
 */
export default class GwtkRosreestrObjectTask extends Task {

    /**
     * Тип объекта росреестра
     */
    private typeRosreestrObject = 0;

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & SimpleJson<any>}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;


    /**
     * Объект Точка на карте
     * @private
     */
    private readonly pointObject: MapObject;

    private cadNumberCoordinate?: GeoPoint;

    private readonly rosreestrSearchManager = new SearchManager(this.map, true);


    /**
     * @constructor GwtkPrintMapTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        this.actionRegistry.push({
            getConstructor() {
                return PickPointAction;
            },
            id: SELECT_POINT_ACTION,
            active: false,
            enabled: true
        });


        // Создание Vue компонента
        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            taskId: this.id,
            setState: this.setState.bind(this),
            mapObjectSemantics: [],
            typeObject: 0,
            searchText: '',
            cadNumberText: '',
            showInMap: false,
            searchProgressBar: false,
            byGetCoordinationInMap: true,
            mapObjects: [],
            objectIndex: -1
        };

        const tempVectorLayer = VectorLayer.getEmptyInstance(this.map);

        this.pointObject = new MapObject(tempVectorLayer, MapObjectType.MultiPoint, {local: LOCALE.Point});

    }

    /**
     * @method destroy
     * @protected
     */
    protected destroy() {
        super.destroy();
        this.pointObject.removeAllPoints();
        this.map.clearHighLightObject();
        this.map.requestRender();
    }

    /**
     * регистрация Vue компонента
     * @method createTaskPanel
     */
    createTaskPanel() {
        // регистрация Vue компонента
        const name = 'GwtkRosreestrObjectWidget';
        const source = GwtkRosreestrObjectWidget;
        this.mapWindow.registerComponent(name, source);

        this.mapWindow.createWindowWidget(name, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);

    }

    /**
     * Запросить номер вкладки для объекта по типу объекта росреестра
     * @method getTabRosreestrObject
     * @param typeRosreestrObject
     */
    getTabRosreestrObject(typeRosreestrObject: number): number {
        let typeObject;
        switch (typeRosreestrObject) {
            case RosreestrQueryType.LAND_LOT:
                typeObject = 3;
                break;
            case RosreestrQueryType.LAND_QUARTER:
                typeObject = 2;
                break;
            case RosreestrQueryType.LAND_AREA:
                typeObject = 1;
                break;
            case RosreestrQueryType.CCO:
                typeObject = 4;
                break;
            case RosreestrQueryType.BOUNDARY:
                typeObject = 5;
                break;
            case RosreestrQueryType.USE_RESTRICTED_ZONE:
                typeObject = 6;
                break;
            case RosreestrQueryType.TERRITORIAL_AREA:
                typeObject = 7;
                break;
            case RosreestrQueryType.FORESTRY:
                typeObject = 8;
                break;
            case RosreestrQueryType.FREE_ECONOMIC_ZONE:
                typeObject = 10;
                break;
            case RosreestrQueryType.SPECIALLY_NATURAL_AREA:
                typeObject = 9;
                break;
            case RosreestrQueryType.LAND_DISTRICT:
            default:
                typeObject = 0;
        }
        return typeObject;
    }

    /**
     * Установить тип объекта росреестра по Номеру вкладки
     * @method setTypeRosreestrObject
     * @param tabNumber
     */
    setTypeRosreestrObject(tabNumber: number): RosreestrQueryType {
        let typeRosreestObject;
        switch (tabNumber) {
            case 0:
                typeRosreestObject = RosreestrQueryType.LAND_DISTRICT;
                break;
            case 1:
                typeRosreestObject = RosreestrQueryType.LAND_AREA;
                break;
            case 2:
                typeRosreestObject = RosreestrQueryType.LAND_QUARTER;
                break;
            case 3:
                typeRosreestObject = RosreestrQueryType.LAND_LOT;
                break;
            case 4:
                typeRosreestObject = RosreestrQueryType.CCO;
                break;
            case 5:
                typeRosreestObject = RosreestrQueryType.BOUNDARY;
                break;
            case 6:
                typeRosreestObject = RosreestrQueryType.USE_RESTRICTED_ZONE;
                break;
            case 7:
                typeRosreestObject = RosreestrQueryType.TERRITORIAL_AREA;
                break;
            case 8:
                typeRosreestObject = RosreestrQueryType.FORESTRY;
                break;
            case 9:
                typeRosreestObject = RosreestrQueryType.SPECIALLY_NATURAL_AREA;
                break;
            case 10:
                typeRosreestObject = RosreestrQueryType.FREE_ECONOMIC_ZONE;
                break;
            default:
                typeRosreestObject = RosreestrQueryType.LAND_DISTRICT;
        }
        return typeRosreestObject;
    }

    /**
     * @method setState
     * @param key
     * @param value
     */
    setState<K extends keyof GwtkRosreestrObjectTaskState>(key: K, value: GwtkRosreestrObjectTaskState[ K ]) {
        switch (key) {
            case GET_SEMANTIC_LIST:
                this.widgetProps.mapObjectSemantics = this.getSemanticList();
                break;
            case GET_TYPE_ROSREESTR_OBJECT:
                this.widgetProps.typeObject = this.getTabRosreestrObject(this.typeRosreestrObject);
                break;
            case UPDATE_SEARCH_TEXT:
                this.widgetProps.searchText = value === null ? '' : value as string;
                if (this.widgetProps.searchText === '') {
                    this.setState(REMOVE_POINT_MAP, undefined);
                    this.setState(ACTIVE_BY_COORDINATION_IN_MAP, true);
                }
                break;
            case START_SEARCH:
                this.widgetProps.objectIndex = -1;
                this.setState(UPDATE_SEARCH_PROGRESS_BAR, true);
                this.searchViaSearchManager();
                if (this.widgetProps.searchText.includes(':')) {
                    this.setState(ACTIVE_BY_COORDINATION_IN_MAP, false);
                }
                break;
            case SELECT_POINT_ACTION:
                this.widgetProps.mapObjectSemantics = [];
                if (value) {
                    this.mapWindow.addSnackBarMessage(i18n.tc('phrases.' + 'Pick a point on the map'));
                }
                if (value) {
                    this.doAction(key);
                } else {
                    this.quitAction(key);
                }
                break;
            case SET_COORDINATE_IN_POINT:
                const geo = this.map.pixelToGeo(value as PixelPoint);
                if (geo) {
                    this.typeRosreestrObject = this.setTypeRosreestrObject(this.widgetProps.typeObject);
                    this.widgetProps.searchText = `${parseFloat(geo.getLatitude().toFixed(6))},${parseFloat(geo.getLongitude().toFixed(6))}`;
                    this.setState(START_SEARCH, undefined);
                }
                break;
            case CHANGE_TAB:
                this.widgetProps.typeObject = value as number;
                this.typeRosreestrObject = this.setTypeRosreestrObject(value as number);
                break;
            case REMOVE_POINT_MAP:
                this.widgetProps.mapObjectSemantics = [];
                this.rosreestrSearchManager.clearSearchCriteriaAggregator();
                this.cadNumberCoordinate = undefined;
                this.widgetProps.cadNumberText = '';
                this.pointObject.removeAllPoints();
                this.map.clearHighLightObject();
                this.map.tiles.drawMapImage(true, true, true);
                break;
            case SHOW_OBJECT_IN_MAP:
                this.showLabel();
                break;
            case UPDATE_SEARCH_PROGRESS_BAR:
                this.widgetProps.searchProgressBar = value as boolean;
                break;
            case ABORT_SEARCH:
                this.abortSearch();
                break;
            case CLICK_SEARCH_BUTTON:
                this.typeRosreestrObject = 0;
                break;
            case ACTIVE_BY_COORDINATION_IN_MAP:
                this.widgetProps.byGetCoordinationInMap = value as boolean;
                if (value) {
                    this.mapWindow.addSnackBarMessage(i18n.tc('phrases.' + 'Pick a point on the map'));
                    this.doAction(SELECT_POINT_ACTION);

                } else {
                    setTimeout(() => this.quitAction(SELECT_POINT_ACTION), 5);
                }
                break;
            case CHANGE_ROSREESTR_OBJECT:
                this.widgetProps.objectIndex = value as number;
                break;

            default:
                if (this._action) {
                    this._action.setState(key, value);
                }
        }
    }

    /**
     * Активность панели объектов
     * @public
     * @property isObjectPanelActive
     */
    get isObjectPanelActive(): false {
        return false;
    }

    /**
     * Получить значения семантик для вывода информации об объекте росреестра
     * @method getSemanticList
     * @return {GwtkSemanticListForComparison[]}
     */
    getSemanticList(): GwtkSemanticListForComparison[] {
        const semanticList = [];
        if (this.widgetProps.objectIndex < 0) {
            this.widgetProps.objectIndex = 0;
        }
        const selectObject = this.rosreestrSearchManager.mapObjects[this.widgetProps.objectIndex] || undefined;
        if (selectObject) {
            this.map.highLightObject(selectObject);
            this.map.tiles.wmsManager.onMapDragEnd();
            const mapObjectContent = new MapObjectContent(selectObject);

            this.typeRosreestrObject = Number(mapObjectContent.layerId);

            const objectSemantic = this.objectSemantics;
            if (objectSemantic.length > 0) {
                for (let numberSemantic = 0; numberSemantic < objectSemantic.length; numberSemantic++) {
                    const currentSemantic = objectSemantic[numberSemantic];


                    let typeObject = '';
                    switch (currentSemantic.key) {
                        case 'cn':
                            switch (this.typeRosreestrObject) {
                                case RosreestrQueryType.LAND_DISTRICT:
                                    typeObject = i18n.tc('rosreestcontent.Cadastral district');
                                    break;
                                case RosreestrQueryType.LAND_AREA:
                                    typeObject = i18n.tc('rosreestcontent.Cadastral area');
                                    break;
                                case RosreestrQueryType.LAND_QUARTER:
                                    typeObject = i18n.tc('rosreestcontent.Cadastral quarter');
                                    break;
                                case RosreestrQueryType.LAND_LOT:
                                    typeObject = i18n.tc('rosreestcontent.Cadastral plot');
                                    break;
                                case RosreestrQueryType.CCO:
                                    typeObject = i18n.tc('rosreestcontent.Object KS');
                                    break;
                            }

                            this.widgetProps.cadNumberText = `${typeObject}: ${currentSemantic.value}`;
                            if ((this.typeRosreestrObject === RosreestrQueryType.LAND_LOT || this.typeRosreestrObject === RosreestrQueryType.CCO) &&
                                this.widgetProps.searchText.includes(':') &&
                                this.cadNumberCoordinate === undefined) {
                                this.cadNumberCoordinate = mapObjectContent.getCenter().toGeoPoint();
                            }
                            break;
                        case 'number_zone':
                            switch (this.typeRosreestrObject) {
                                case RosreestrQueryType.BOUNDARY:
                                    typeObject = i18n.tc('rosreestcontent.Border');
                                    break;
                                case RosreestrQueryType.USE_RESTRICTED_ZONE:           // ЗОУИТы
                                    typeObject = i18n.tc('rosreestcontent.Zone with special conditions for the use of territories');
                                    break;
                                case RosreestrQueryType.TERRITORIAL_AREA:              // Территориальные зоны
                                case RosreestrQueryType.FORESTRY:                      // Лесничества и лесопарки
                                case RosreestrQueryType.FREE_ECONOMIC_ZONE:            // Свободные экономические зоны
                                case RosreestrQueryType.SPECIALLY_NATURAL_AREA:        // Особо охраняемые природные территории
                                    typeObject = i18n.tc('rosreestcontent.Zone');
                                    break;
                            }

                            this.widgetProps.cadNumberText = `${typeObject}: ${currentSemantic.value}`;

                            break;
                    }

                    semanticList.push({
                        name: currentSemantic.name,
                        valueRosreestrObject: currentSemantic.value,
                        valueMapObject: ''
                    });
                }
            }
        }
        return semanticList;
    }

    /**
     * Запросить центр объекта росреестра в GeoPoint
     * return objectCoordinateGeo {GeoPoint}
     */
    getCenterRosreestrObject(): GeoPoint | undefined {
        let result;
        const selectObject = this.rosreestrSearchManager.mapObjects[0];
        if (selectObject) {
            const mapPoint = selectObject.getPointList()[0];
            if (mapPoint) {
                result = mapPoint.toGeoPoint();
            }
        }
        return result;
    }

    /**
     * Поиск объектов
     * @method searchViaSearchManager
     */
    private searchViaSearchManager(): void {
        let text: string = this.widgetProps.searchText;
        if (text === '') {
            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
            return;
        }

        if (text.indexOf(':') > -1) {
            const sectorCadNumber = this.widgetProps.searchText.split(':');

            text = this.widgetProps.searchText;
            switch (this.typeRosreestrObject) {
                case RosreestrQueryType.LAND_QUARTER:
                    if (sectorCadNumber.length === 4) {
                        text = text.slice(0, this.widgetProps.searchText.lastIndexOf(':'));
                    }
                    break;
                case  RosreestrQueryType.LAND_AREA:
                    if (sectorCadNumber.length > 2) {
                        text = text.slice(0, sectorCadNumber[0].length + 1 + sectorCadNumber[1].length);
                    }
                    break;
                case RosreestrQueryType.LAND_DISTRICT:
                    if (sectorCadNumber.length > 1) {
                        text = text.slice(0, this.widgetProps.searchText.indexOf(':'));
                    }
                    break;
                case  RosreestrQueryType.LAND_LOT:
                case  RosreestrQueryType.CCO:
                    if (sectorCadNumber.length === 4 && this.cadNumberCoordinate !== undefined) {
                        text = this.cadNumberCoordinate.getLongitude() + ',' + this.cadNumberCoordinate.getLatitude();
                    }
                    break;
            }
        } else {
            const regex = /(\d+\.\d*)[,\s](\d+\.\d*)/gm;
            const m = regex.exec(this.widgetProps.searchText);
            if (m && m[1] !== undefined && m[2] !== undefined) {
                text = m[2] + ',' + m[1];
            }
        }
        const searchManager = this.rosreestrSearchManager;

        searchManager.activateSource(SourceType.Rosreestr, GISWebServiceSEMode.TextSearch, undefined, undefined, undefined, true);

        searchManager.clearSearchCriteriaAggregator();

        searchManager.clearSearchCriteriaAggregator();
        const criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();

        const textSearchCriterion = criteriaAggregatorCopy.getTextSearchCriterion();
        textSearchCriterion.addTextSearchKey(['Text'], text);
        if (this.typeRosreestrObject > 0) {
            textSearchCriterion.addTextSearchKey(['typeRosreestrObject'], this.typeRosreestrObject + '');
        }
        const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
        srsNameSearchCriterion.setValue(this.map.getCrsString());

        searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

        this.map.tiles.drawMapImage(true, true, true);
        searchManager.findNext().then(() => {
        }).catch(() => {
            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
        }).finally(() => {

            if (this.rosreestrSearchManager.mapObjects.length > 0) {
                this.widgetProps.mapObjects = this.rosreestrSearchManager.mapObjects;
                this.setState(GET_SEMANTIC_LIST, true);
                this.showLabel();
                this.setState(GET_TYPE_ROSREESTR_OBJECT, true);
            } else {
                this.setState(REMOVE_POINT_MAP, undefined);
                this.widgetProps.mapObjectSemantics = [];
                this.mapWindow.addSnackBarMessage(i18n.tc('phrases.' + 'Objects with this properties not found') + '.');
            }
            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
        });
    }

    /**
     *
     */
    onPreRender() {
        if (this.pointObject.isDirty) {
            this.pointObject.isDirty = false;
            this.map.requestRender();
        }
    }

    /**
     *
     * @param renderer
     */
    onPostRender(renderer: SVGrenderer) {
        if (this.pointObject.hasPoints()) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.pointObject);
        }
    }

    /**
     * Отобразить точку на карте
     * @method showLabel
     */
    private showLabel(): void {
        const coordinateCenterRosreestrObject = this.getCenterRosreestrObject();
        if (coordinateCenterRosreestrObject) {
            this.pointObject.removeAllPoints();
            this.pointObject.addGeoPoint(coordinateCenterRosreestrObject);
            this.pointObject.addStyle(new Style({
                marker: new MarkerStyle({
                    markerId: MAP_YANDEX_PANORAMA_MARKER_ID
                })
            }));
            this.map.setMapCenter(this.pointObject.getCenter(), true);
            this.widgetProps.showInMap = true;
        }
    }

    /**
     * Прервать поиск
     * @method abortSearch
     */
    private abortSearch(): void {
        this.rosreestrSearchManager.stopSearch();
    }

    /**
     * Массив семантик объекта карты
     * @method objectSemantics {array}
     */
    get objectSemantics(): MapObjectSemanticContent[] {
        const result: MapObjectSemanticContent[] = [];

        const searchMapObject = this.rosreestrSearchManager.mapObjects[this.widgetProps.objectIndex];
        if (searchMapObject) {
            const semanticKeys = searchMapObject.getSemanticUniqKeys();

            for (const semanticKey of semanticKeys) {

                if (!this.checkSemanticFilter(semanticKey)) {
                    continue;
                }

                if (semanticKey === 'TxtFile') {
                    continue;
                }

                const semantics = searchMapObject.getRepeatableSemantics(semanticKey);

                semantics.forEach(semantic => result.push(new MapObjectSemanticContent(semantic, undefined, [])));
            }
        }

        return result;
    }

    /**
     * Экземпляр карты
     * @private
     * @property layer {Layer}
     */
    private get layer(): Layer | undefined {
        let result;

        const selectObject = this.rosreestrSearchManager.mapObjects[0];

        if (selectObject) {
            const layers = this.map.tiles.getSelectableLayersArray();

            for (const layer of layers) {
                if (layer.idLayer === selectObject.mapId) {
                    result = layer;
                    break;
                }
            }

            if (!result) {
                result = selectObject.vectorLayer;
            }
        }

        return result;
    }

    /**
     * Проверка доступности семантики для вывода пользователю
     * @method checkSemanticFilter
     * @param key {string} ключ семантики
     * @return {boolean} Флаг доступности семантики для вывода пользователю
     */
    private checkSemanticFilter(key: string): boolean {
        const semanticFilter = this.layer ? this.layer.options.semanticfilter : false;
        return !semanticFilter || semanticFilter.length === 0 || semanticFilter.indexOf(key) !== -1;
    }

}
