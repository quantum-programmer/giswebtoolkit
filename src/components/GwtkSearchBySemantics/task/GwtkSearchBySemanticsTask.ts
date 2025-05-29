/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Компонент "Поиск по семантике"                    *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import {GwtkComponentDescriptionPropsData} from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkSearchBySemanticsWidget from '@/components/GwtkSearchBySemantics/task/GwtkSearchBySemanticsWidget.vue';
import SemanticItem from '@/components/GwtkSearchBySemantics/task/utils/SemanticItem';
import SearchManager, {GISWebServiceSEMode, SourceType} from '~/services/Search/SearchManager';
import {ContainsSomeOf, LogEventType} from '~/types/CommonTypes';
import i18n from '@/plugins/i18n';
import GwtkError from '~/utils/GwtkError';
import {
    LogicOperation,
    MeasureCriterion,
    MeasureCriterionType,
    MeasureName,
    MeasureOperator
} from '~/services/Search/criteria/MeasureSearchCriterion';
import {DataChangedEvent} from '~/taskmanager/TaskManager';
import {Unit} from '~/utils/WorkspaceManager';
import Utils from '~/services/Utils';
import Layer from '~/maplayers/Layer';
import {SearchCriterionName} from '~/services/Search/criteria/BaseSearchCriterion';
import {SemanticOperator} from '~/services/Search/criteria/SemanticSearchCriterion';

export const SELECTED_LAYER_ID = 'gwtksearchbysemantics.selectedlayerid';
export const CHANGE_VISIBLE_ON_CURRENT_SCALE = 'gwtksearchbysemantics.changevisibleoncurrentscale';
export const PERFORM_SEARCH = 'gwtksearchbysemantics.performsearch';
export const RESET_ALL = 'gwtksearchbysemantics.resetall';
export const SELECTED_SEARCH_TAB = 'gwtksearchbysemantics.selectedsearchtab';

export const SET_SEMANTIC_SEARCH_PARAMS = 'gwtksearchbysemantics.setsemanticsearchparams';

export const SET_OBJECT_NUMBER_SEARCH_PARAMS = 'gwtksearchbysemantics.setobjectnumbersearchparams';
export const SET_OBJECT_NUMBER_SEARCH_INPUT_FROM_HISTORY = 'gwtksearchbysemantics.setobjectnumbersearchinputfromhistory';
export const CLEAR_OBJECT_NUMBER_SEARCH_HISTORY = 'gwtksearchbysemantics.clearobjectnumbersearchhistory';
export const ADD_SELECTED_SEARCH_MEASUREMENT = 'gwtksearchbysemantic.addselectedsearchmeasurement';
export const SET_MEASUREMENT_SEARCH_PARAMS = 'gwtksearchbysemantics.setmeasurementsearchparams';
export const DELETE_SELECTED_SEARCH_MEASUREMENT = 'gwtksearchbysemantic.deleteselectedsearchmeasurement';

export enum SearchTab {
    ByNumber,
    BySemantic,
    ByMeasurement
}

export type ObjectNumberSearchParams = {
    inputValue: string;
    byAllLayersFlag: boolean;
    searchHistory: { id: string; text: string; }[];
}

export type SemanticSearchParams = {
    objectsList: SelectableItems[];
    selectedObject: string;
    searchCondition: string;
    semanticsList: SemanticItem[];
    onlyFilled: boolean;
}

export type SetStateSemanticSearchParams = {
    onlyFilled?: boolean;
    searchCondition?: string;
    selectedObject?: string;
}

export type MeasurementSearchItemType = { id: MeasureName; text: string; };
export type MeasurementSearchParams = {
    selectedSearchMeasurementList: SearchMeasurement[];
    byAllLayersFlag: boolean;
    searchCondition: string;
    measurementItemTypes: MeasurementSearchItemType[];
}

export type SetStateMeasurementSearchParams = {
    byAllLayersFlag?: boolean;
    searchCondition?: string;
    measurementsItem?: SearchMeasurement;
}

export type GwtkSearchBySemanticsTaskState = {
    [SELECTED_LAYER_ID]: string;
    [CHANGE_VISIBLE_ON_CURRENT_SCALE]: boolean;
    [SET_OBJECT_NUMBER_SEARCH_PARAMS]: ContainsSomeOf<ObjectNumberSearchParams>;
    [SET_OBJECT_NUMBER_SEARCH_INPUT_FROM_HISTORY]: string;
    [CLEAR_OBJECT_NUMBER_SEARCH_HISTORY]: string | undefined;
    [SET_MEASUREMENT_SEARCH_PARAMS]: SetStateMeasurementSearchParams;
    [PERFORM_SEARCH]: undefined;
    [RESET_ALL]: undefined;
    [SELECTED_SEARCH_TAB]: number;

    [SET_SEMANTIC_SEARCH_PARAMS]: SetStateSemanticSearchParams;


    [ADD_SELECTED_SEARCH_MEASUREMENT]: MeasurementSearchItemType;
    [DELETE_SELECTED_SEARCH_MEASUREMENT]: SearchMeasurement;
}

type WidgetParams = {
    setState: GwtkSearchBySemanticsTask['setState'];
    visibleOnCurrentScale: boolean; // поиск только видимых объектов в текущем м-бе
    layersList: SelectableItems[];
    selectedLayerId: string;
    searchTab: SearchTab;
    activeRequestCancelHandler?: () => void;
    objectNumberSearchParams: ObjectNumberSearchParams;
    semanticSearchParams: SemanticSearchParams;
    measurementSearchParams: MeasurementSearchParams;
}



export type SearchMeasurement = {
    value: MeasureName;
    text: string;
    selected: boolean;
    searchUnitsList: {
        unitsList: Unit[],
        selected: Unit
    },
    searchOperatorsList: {
        operatorsList: MeasureOperator[],
        selected: MeasureOperator,
        isRange: boolean
    },
    searchValue: string[];
}

export type SelectableItems = {
    text: string;
    value: string;
}

export const ALL_SEMANTICS_ID = 'all_semantics' + Date.now();


type WorkSpaceData = {
    objectNumberSearch: {
        searchHistory: { id: string; value: string; layerXid?: string; }[];
    },
};


/**
 * Компонент "Поиск по семантике"
 * @class GwtkSearchBySemanticsTask
 * @extends Task
 */
export default class GwtkSearchBySemanticsTask extends Task {

    protected workspaceData?: WorkSpaceData;

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * Сохраненные критерии поиска
     * @private
     * @property originCriteriaAggregator {CriteriaAggregator}
     */
    private originCriteriaAggregator = this.map.searchManager.getSearchCriteriaAggregatorCopy();

    /**
     * Список единиц измерения для длины
     * @private
     * @property lengthUnitList {Unit[]}
     */
    private lengthUnitList: Unit[] = [
        Unit.Meters,
        Unit.Kilometers,
        Unit.Foots,
        Unit.NauticalMiles
    ];

    /**
     * Список единиц измерения для площади
     * @private
     * @property areaUnitList {Unit[]}
     */
    private areaUnitList = [
        Unit.SquareMeters,
        Unit.SquareKilometers,
        Unit.Hectares
    ];

    /**
     * Список индексов операторов
     * @private
     * @property measureOperatorsList {MeasureOperator[]}
     */
    private measureOperatorsList: MeasureOperator[] = [
        MeasureOperator.Equals,
        MeasureOperator.NotEquals,
        MeasureOperator.More,
        MeasureOperator.NotLess,
        MeasureOperator.Less,
        MeasureOperator.NotMore
    ];

    /**
     * @constructor GwtkSearchBySemanticTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            visibleOnCurrentScale: false,
            layersList: this.layersListWhitSemanticSearchable,
            selectedLayerId: '',
            activeRequestCancelHandler: undefined,
            searchTab: SearchTab.ByNumber,
            semanticSearchParams: {
                objectsList: [],
                selectedObject: '',
                searchCondition: 'OR',
                semanticsList: [],
                onlyFilled: false,
            },
            objectNumberSearchParams: { inputValue: '', byAllLayersFlag: false, searchHistory: [] },
            measurementSearchParams: {
                searchCondition: 'OR',
                selectedSearchMeasurementList: [],
                measurementItemTypes: [
                    { id: MeasureName.Length, text: i18n.tc('phrases.Length') },
                    { id: MeasureName.Perimeter, text: i18n.tc('phrases.Perimeter') },
                    { id: MeasureName.Square, text: i18n.tc('searchbysemantic.Square') },
                    { id: MeasureName.Height, text: i18n.tc('searchbysemantic.Height (m)') }
                ],
                byAllLayersFlag: false
            }
        };
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkSearchBySemanticsWidget';
        const sourceWidget = GwtkSearchBySemanticsWidget;
        this.mapWindow.registerComponent( nameWidget, sourceWidget );

        // Создание Vue компонента
        this.mapWindow.createWidget( nameWidget, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    setup() {
        super.setup();

        if (!this.workspaceData) {
            this.workspaceData = { objectNumberSearch: { searchHistory: [] } };
        }
        this.updateWorkspaceData();

        if (this.widgetProps.layersList.length === 0) {
            this.mapWindow.getTaskManager().detachTask(this.id);
            this.map.writeProtocolMessage({
                text: i18n.tc('phrases.There are no available map layers to perform the operation'),
                description: 'GwtkSearchBySemantics: setup - ' + i18n.tc('phrases.There are no available map layers to perform the operation'),
                type: LogEventType.Error,
                display: true
            });
        }
    }

    onDataChanged(event: DataChangedEvent) {
        super.onDataChanged(event);

        this.widgetProps.layersList = this.layersListWhitSemanticSearchable;
        if (this.widgetProps.layersList.length === 0) {
            this.map.writeProtocolMessage({
                text: i18n.tc('phrases.There are no available map layers to perform the operation'),
                description: 'GwtkSearchBySemantics: setup - ' + i18n.tc('phrases.There are no available map layers to perform the operation'),
                type: LogEventType.Error,
                display: true
            });
        }
    }

    setState<K extends keyof GwtkSearchBySemanticsTaskState>( key: K, value: GwtkSearchBySemanticsTaskState[ K ] ) {
        switch ( key ) {
            case SELECTED_LAYER_ID:
                this.widgetProps.selectedLayerId = value as string;
                this.getObjectTypesBySelectedLayer( value as string );
                break;
            case CHANGE_VISIBLE_ON_CURRENT_SCALE:
                this.widgetProps.visibleOnCurrentScale = value as boolean;
                break;
            case PERFORM_SEARCH:
                this.runSearch();
                break;
            case RESET_ALL:
                const layer = this.map.getVectorLayerByxId(this.widgetProps.selectedLayerId);
                if (layer) {
                    this.widgetProps.activeRequestCancelHandler = () => layer.cancelRequests();
                }
                this.widgetProps.semanticSearchParams.selectedObject = ALL_SEMANTICS_ID;
                this.widgetProps.semanticSearchParams.searchCondition = 'OR';
                this.widgetProps.objectNumberSearchParams.inputValue = '';
                this.widgetProps.objectNumberSearchParams.byAllLayersFlag = false;
                this.widgetProps.visibleOnCurrentScale = false;
                this.requestSemanticsListBySelectedObjectType(this.widgetProps.semanticSearchParams.selectedObject).then(() => {
                }).finally(() => {
                    this.widgetProps.activeRequestCancelHandler = undefined;
                });

                const removed = this.widgetProps.measurementSearchParams.selectedSearchMeasurementList.splice(0);
                removed.forEach(measurement => {
                    measurement.selected = false;
                    measurement.searchValue.splice(0);
                });
                break;
            case SELECTED_SEARCH_TAB:
                this.widgetProps.searchTab = value as SearchTab;
                break;
            case SET_SEMANTIC_SEARCH_PARAMS:
                const semanticSearchParams = value as SetStateSemanticSearchParams;
                if (semanticSearchParams.onlyFilled !== undefined) {
                    this.widgetProps.semanticSearchParams.onlyFilled = semanticSearchParams.onlyFilled;
                }
                if (semanticSearchParams.searchCondition !== undefined) {
                    this.widgetProps.semanticSearchParams.searchCondition = semanticSearchParams.searchCondition;
                }

                if (semanticSearchParams.selectedObject !== undefined) {
                    this.widgetProps.semanticSearchParams.selectedObject = semanticSearchParams.selectedObject;
                    this.requestSemanticsListBySelectedObjectType(semanticSearchParams.selectedObject);
                }
                break;
            case SET_OBJECT_NUMBER_SEARCH_PARAMS:
                const objectNumberSearchParams = value as ContainsSomeOf<ObjectNumberSearchParams>;
                if (objectNumberSearchParams.inputValue !== undefined) {
                    this.widgetProps.objectNumberSearchParams.inputValue = objectNumberSearchParams.inputValue;
                }

                if (objectNumberSearchParams.byAllLayersFlag !== undefined) {
                    this.widgetProps.objectNumberSearchParams.byAllLayersFlag = objectNumberSearchParams.byAllLayersFlag;
                }

                break;
            case SET_OBJECT_NUMBER_SEARCH_INPUT_FROM_HISTORY:
                const historyItem = this.workspaceData?.objectNumberSearch.searchHistory.find(item => item.id === value as string);
                if (historyItem) {
                    this.widgetProps.objectNumberSearchParams.inputValue = historyItem.value;
                    this.widgetProps.objectNumberSearchParams.byAllLayersFlag = !historyItem.layerXid;
                }
                break;
            case CLEAR_OBJECT_NUMBER_SEARCH_HISTORY:
                const historyItemId = value as string | undefined;
                if (this.workspaceData) {
                    if (!historyItemId) {
                        this.workspaceData.objectNumberSearch.searchHistory.splice(0);
                    } else {
                        const index = this.workspaceData.objectNumberSearch.searchHistory.findIndex(item => item.id === historyItemId);
                        if (index !== -1) {
                            this.workspaceData.objectNumberSearch.searchHistory.splice(index, 1);
                        }
                    }
                    this.updateWorkspaceData();
                }
                break;
            case ADD_SELECTED_SEARCH_MEASUREMENT:
                const emptyMeasurementsSearchItem = this.createMeasurementSearchItem(value as MeasurementSearchItemType);
                this.widgetProps.measurementSearchParams.selectedSearchMeasurementList.push(emptyMeasurementsSearchItem);
                break;
            case SET_MEASUREMENT_SEARCH_PARAMS:
                const measurementSearchParams = value as SetStateMeasurementSearchParams;

                if (measurementSearchParams.byAllLayersFlag !== undefined) {
                    this.widgetProps.measurementSearchParams.byAllLayersFlag = measurementSearchParams.byAllLayersFlag;
                }

                if (measurementSearchParams.searchCondition !== undefined) {
                    this.widgetProps.measurementSearchParams.searchCondition = measurementSearchParams.searchCondition;
                }

                const measurementsSearchItem = measurementSearchParams.measurementsItem;

                if (measurementsSearchItem !== undefined) {
                    const originMeasurementsSearchItem = this.widgetProps.measurementSearchParams.selectedSearchMeasurementList.find(measurement => measurement.value === measurementsSearchItem.value);
                    if (originMeasurementsSearchItem) {
                        originMeasurementsSearchItem.searchUnitsList.selected = measurementsSearchItem.searchUnitsList.selected;
                        originMeasurementsSearchItem.searchOperatorsList.selected = measurementsSearchItem.searchOperatorsList.selected;
                        originMeasurementsSearchItem.searchOperatorsList.isRange = measurementsSearchItem.searchOperatorsList.isRange;
                        originMeasurementsSearchItem.searchValue.splice(0, originMeasurementsSearchItem.searchValue.length, ...measurementsSearchItem.searchValue);
                    }
                }
                break;
            case DELETE_SELECTED_SEARCH_MEASUREMENT:
                const deleteMeasurementSearchItem = value as SearchMeasurement;

                const originMeasurementsSearchItemIndex = this.widgetProps.measurementSearchParams.selectedSearchMeasurementList.findIndex(measurement => measurement.value === deleteMeasurementSearchItem.value);

                if (originMeasurementsSearchItemIndex !== -1) {
                    this.widgetProps.measurementSearchParams.selectedSearchMeasurementList.splice(originMeasurementsSearchItemIndex, 1);
                }
                break;
        }
    }

    private createMeasurementSearchItem({ id, text }: MeasurementSearchItemType): SearchMeasurement {

        const result = {
            value: id,
            text,
            selected: false,
            searchUnitsList: {
                unitsList: this.lengthUnitList,
                selected: this.lengthUnitList[0]
            },
            searchOperatorsList: {
                operatorsList: this.measureOperatorsList,
                selected: this.measureOperatorsList[0],
                isRange: false
            },
            searchValue: []
        };

        result.value = id;
        result.text = text;

        if (id === MeasureName.Square) {
            result.searchUnitsList = {
                unitsList: this.areaUnitList,
                selected: this.areaUnitList[0]
            };
        }
        return result;
    }


    /**
     * Получить список слоев в которых можно выполнять поиск по семантике
     * @private
     * @method layersListWhitSemanticSearchable
     */
    private get layersListWhitSemanticSearchable() {
        const result: SelectableItems[] = [];
        const selectableLayers = this.map.tiles.getSelectableLayersArray();

        const layers = this.map.vectorLayers.filter( layer => selectableLayers.find( selectableLayer => selectableLayer.idLayer === layer.idLayer ) );

        layers.forEach( ( layer ) => {
            result.push( { text: layer.alias, value: layer.xId } );
        } );

        return result;
    }

    /**
     * Получить список типов объектов по выбранному слою
     * @private
     * @method getObjectTypesBySelectedLayer
     * @param layerId {string}
     */
    private async getObjectTypesBySelectedLayer( layerId: string ) {
        this.widgetProps.semanticSearchParams.objectsList.splice(0);
        const allLayers = this.map.tiles.getSelectableLayersArray();
        const layer = this.map.getVectorLayerByxId( layerId );
        if ( layer ) {

            allLayers.forEach( ( layerItem ) => {
                layerItem.areaSeek = layerItem.xId === layer.xId;
            } );

            this.widgetProps.activeRequestCancelHandler = () => layer.cancelRequests();

            try {

                // первая запись - для полного списка семантик
                this.widgetProps.semanticSearchParams.objectsList.push({
                    text: i18n.t('searchbysemantic.All types') as string,
                    value: ALL_SEMANTICS_ID
                });

                const layerObjectTypesList = await layer.getClassifierLayerSemanticsList();

                layerObjectTypesList.forEach(objectType => {
                    this.widgetProps.semanticSearchParams.objectsList.push({ text: objectType.alias, value: objectType.name });
                });
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({ text: gwtkError.message, type: LogEventType.Error });
                this.setState(SELECTED_LAYER_ID, '');
            }

            this.widgetProps.activeRequestCancelHandler = undefined;

            this.setState(SET_SEMANTIC_SEARCH_PARAMS, { selectedObject: ALL_SEMANTICS_ID });
        }
    }

    /**
     * Получить список всех семантик для слоя
     * @private
     * @method getAllSemanticList
     */
    private async getAllSemanticList() {
        const layer = this.map.getVectorLayerByxId( this.widgetProps.selectedLayerId );
        this.widgetProps.semanticSearchParams.semanticsList.splice(0);
        if ( layer ) {
            this.widgetProps.activeRequestCancelHandler = () => layer.cancelRequests();

            const rscSemantic = await layer.getAllSemantics();

            if ( rscSemantic && rscSemantic.length > 0 ) {

                rscSemantic.forEach(async (rscSemanticItem) => {
                    const classifierSemanticList = await layer.getClassifierSemanticValuesByKey(rscSemanticItem.shortname);
                    const selectedSemantic = this.selectedSemanticItems.find(semantic => semantic.semanticName === rscSemanticItem.name);
                    this.widgetProps.semanticSearchParams.semanticsList.push(new SemanticItem(rscSemanticItem, classifierSemanticList, selectedSemantic && selectedSemantic.semanticSearchValue));
                });
            }
            this.widgetProps.activeRequestCancelHandler = undefined;
        }
        // Сортировать список семантик
        this.widgetProps.semanticSearchParams.semanticsList.sort((a, b) => (a.semanticName < b.semanticName ? -1 : 1));
    }

    /**
     * Получить список семантик по выбранному типу объекта
     * @private
     * @method requestSemanticsListBySelectedObjectType
     * @param objectTypeName {string}
     */
    private async requestSemanticsListBySelectedObjectType(objectTypeName: string) {
        if (objectTypeName === ALL_SEMANTICS_ID) {
            this.getAllSemanticList();
        } else {
            const layer = this.map.getVectorLayerByxId(this.widgetProps.selectedLayerId);
            this.widgetProps.semanticSearchParams.semanticsList.splice(0);
            if (layer) {
                this.widgetProps.activeRequestCancelHandler = () => layer.cancelRequests();
                const rscSemantics = await layer.getLayerSemantics(objectTypeName);
                if (rscSemantics) {
                    for (let i = 0; i < rscSemantics.length; i++) {
                        const rscSemanticItem = rscSemantics[i];
                        const classifierSemanticList = await layer.getClassifierSemanticValuesByKey(rscSemanticItem.shortname);
                        const selectedSemantic = this.selectedSemanticItems.find(semantic => semantic.semanticName === rscSemanticItem.name);
                        this.widgetProps.semanticSearchParams.semanticsList.push(new SemanticItem(rscSemanticItem, classifierSemanticList, selectedSemantic && selectedSemantic.semanticSearchValue));

                    }
                }
                this.widgetProps.activeRequestCancelHandler = undefined;
            }

            // Сортировать список семантик
            this.widgetProps.semanticSearchParams.semanticsList.sort((a, b) => (a.semanticName < b.semanticName ? -1 : 1));
        }
    }

    /**
     * Список выбранных семантик
     * @property selectedSemanticItems {SemanticItem[]}
     */
    get selectedSemanticItems() {
        return this.widgetProps.semanticSearchParams.semanticsList.filter(semanticItem => semanticItem.selected);
    }

    /**
     * Выполнить поиск
     * @method runSearch
     */
    private async runSearch() {
        const layers: Layer[] = [];

        if (this.widgetProps.searchTab === SearchTab.ByNumber) {
            if (this.widgetProps.objectNumberSearchParams.byAllLayersFlag) {
                for (let i = 0; i < this.map.vectorLayers.length; i++) {
                    const searchObject = this.map.vectorLayers[i];
                    layers.push(searchObject);
                }
            }
        } else if (this.widgetProps.searchTab === SearchTab.ByMeasurement) {
            if (this.widgetProps.measurementSearchParams.byAllLayersFlag) {
                for (let i = 0; i < this.map.vectorLayers.length; i++) {
                    const searchObject = this.map.vectorLayers[i];
                    layers.push(searchObject);
                }
            }
        }

        if (layers.length === 0 && this.widgetProps.selectedLayerId) {
            const layer = this.map.tiles.getLayerByxId(this.widgetProps.selectedLayerId);
            if (layer) {
                layers.push(layer);
            }
        }


        if (layers.length > 0) {
            this.widgetProps.activeRequestCancelHandler = () => layers.forEach(layer => layer.cancelRequests());
        } else {
            return;
        }

        this.map.clearActiveObject();

        const searchManager = this.mapWindow.getMap().searchManager as SearchManager;
        searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.All, layers);
        searchManager.clearSearchCriteriaAggregator();

        // Создать копию критериев
        const criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();

        const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
        srsNameSearchCriterion.setValue(this.map.getCrsString());

        // Обновить список критериев для типов
        const typeNamesCriterion = criteriaAggregatorCopy.getTypeNamesSearchCriterion();
        if (this.widgetProps.semanticSearchParams.selectedObject !== '' && this.widgetProps.semanticSearchParams.selectedObject !== ALL_SEMANTICS_ID) {
            typeNamesCriterion.addValue(this.widgetProps.semanticSearchParams.selectedObject);
        } else {
            criteriaAggregatorCopy.removeCriterion(typeNamesCriterion.name);
        }

        // Обновить список критериев для видимого масштаба
        if (this.widgetProps.visibleOnCurrentScale) {
            const scale = this.mapWindow.getMap().getZoomScale(this.mapWindow.getMap().getZoom());
            if (scale) {
                const scaleCriterion = criteriaAggregatorCopy.getObjectScaleSearchCriterion();
                scaleCriterion.setValue(scale);
                criteriaAggregatorCopy.setObjectScaleSearchCriterion(scaleCriterion);
            }
        }

        // Обновить список критериев для номера объекта
        if (this.widgetProps.searchTab === SearchTab.ByNumber && this.widgetProps.objectNumberSearchParams.inputValue !== '') {

            if (layers.length > 0) {
                const layerXid = (layers.length === 1 ? layers[0].xId : undefined);
                if (this.workspaceData) {
                    const historyItemIndex = this.workspaceData.objectNumberSearch.searchHistory.findIndex(historyItem => historyItem.value === this.widgetProps.objectNumberSearchParams.inputValue && historyItem.layerXid === layerXid);
                    if (historyItemIndex !== -1) {
                        const result = this.workspaceData.objectNumberSearch.searchHistory.splice(historyItemIndex, 1);
                        this.workspaceData.objectNumberSearch.searchHistory.splice(0, 0, ...result);
                    } else {

                        const id = Utils.generateGUID();

                        this.workspaceData.objectNumberSearch.searchHistory.unshift({
                            id,
                            value: this.widgetProps.objectNumberSearchParams.inputValue,
                            layerXid
                        });


                    }
                    this.updateWorkspaceData();

                }

                for (let i = 0; i < layers.length; i++) {

                    const xId = layers[i].xId;
                    const layerAgregator = searchManager.getLayerCriteriaAggregatorCopy(xId);
                    if (layerAgregator) {
                        const criteriaAggregator = layerAgregator.copy();
                        // Обновить список критериев для номера объекта
                        const objectNumberCriterion = criteriaAggregator.getIdListSearchCriterion();
                        try {
                            const sheets = await layers[i].getSheetNameList();
                            sheets.forEach((sheet) => {
                                objectNumberCriterion.addValue(sheet + '.' + this.widgetProps.objectNumberSearchParams.inputValue);
                            });
                        } catch (error) {
                            const gwtkError = new GwtkError(error);
                            this.map.writeProtocolMessage({
                                text: i18n.t('phrases.Search') + '. ' + i18n.t('searchbyobjectnumber.Failed to get name of the sheets for layer') + ' : ' + layers[i].alias,
                                description: gwtkError.message,
                                type: LogEventType.Error
                            });
                        }
                        // Отправить запрос для получения отфильтрованного ответа
                        searchManager.setLayerCriteriaAggregator(criteriaAggregator);
                    }
                }
            }
        } else {
            criteriaAggregatorCopy.removeCriterion(SearchCriterionName.IdList);

            for (let i = 0; i < this.map.vectorLayers.length; i++) {

                const xId = this.map.vectorLayers[i].xId;
                const layerAgregator = searchManager.getLayerCriteriaAggregatorCopy(xId);
                if (layerAgregator) {
                    layerAgregator.removeCriterion(SearchCriterionName.IdList);
                    // Отправить запрос для получения отфильтрованного ответа
                    searchManager.setLayerCriteriaAggregator(layerAgregator);
                }
            }
        }

        // Получить список заполненных семантик
        const semanticsList = this.selectedSemanticItems.map(semanticItem => semanticItem.semanticCriterion);

        if (this.widgetProps.searchTab === SearchTab.BySemantic && semanticsList.length > 0) {
            // Проверка отметки "Только заполненные"
            const complateMatch = false;
            if (!complateMatch) {
                for (let i = 0; i < semanticsList.length; i++) {
                    semanticsList[i].value = semanticsList[i].operator === SemanticOperator.ContainsValue ? '*' + semanticsList[i].value + '*' : semanticsList[i].value;
                }
            }

            // Обновить список критериев для семантик
            const semanticsCriterion = criteriaAggregatorCopy.getSemanticSearchCriterion();
            const layerAgregator = searchManager.getLayerCriteriaAggregatorCopy(this.widgetProps.selectedLayerId);

            if ( semanticsList.length > 0 ) {
                semanticsList.forEach((semantic) => {
                    semanticsCriterion.addSemanticCriterion(semantic);
                });
                semanticsCriterion.setLogicalDisjunction(this.widgetProps.semanticSearchParams.searchCondition === 'OR');
            } else {
                for ( let semanticsCriterionNumber = 0; semanticsCriterionNumber < semanticsCriterion.criteriaCount; semanticsCriterionNumber++ ) {
                    semanticsCriterion.removeSemanticCriterion( semanticsCriterionNumber );
                }
            }

            if (layerAgregator) {
                const criteriaAggregator = layerAgregator.copy();
                criteriaAggregator.removeCriterion('Text');
                criteriaAggregator.setSemanticSearchCriterion(semanticsCriterion);
                searchManager.setLayerCriteriaAggregator(criteriaAggregator);
            }
        }

        // Обновить список критериев для измерений
        if (this.widgetProps.searchTab === SearchTab.ByMeasurement && GwtkSearchBySemanticsTask.checkMeasurementFilled(this.widgetProps.measurementSearchParams.selectedSearchMeasurementList)) {

            const measurementCriterion = criteriaAggregatorCopy.getMeasureSearchCriterion();

            const logicOperation = this.widgetProps.measurementSearchParams.searchCondition === 'OR' ? LogicOperation.Or : LogicOperation.And;
            measurementCriterion.setLogicOperation(logicOperation);

            this.widgetProps.measurementSearchParams.selectedSearchMeasurementList.forEach(searchMeasurement => {

                const { searchValue, value, searchOperatorsList, searchUnitsList } = searchMeasurement;

                const searchValueLength = searchValue.length;

                if (searchValueLength > 0) {
                    if (searchValueLength === 1) {
                        const measurementCriteria: MeasureCriterion = {
                            name: value,
                            type: MeasureCriterionType.Simple,
                            operator: searchOperatorsList.selected,
                            value: value !== MeasureName.Square ? Utils.unitsToLinearMeter(
                                parseFloat(searchValue[0]),
                                searchUnitsList.selected
                            ) : Utils.unitsToSquareMeters(
                                parseFloat(searchValue[0]),
                                searchUnitsList.selected
                            )
                        };

                        measurementCriterion.addCriterion(measurementCriteria);
                    } else if (searchValueLength === 2) {
                        if (searchValue[0] !== '' && searchValue[1] !== '') {
                            let searchValues: number[] = searchValue.map(value => parseFloat(value));
                            const reversedOperator = this.reverseMeasurementOperator(searchOperatorsList.selected);
                            const measurementCriteria: MeasureCriterion = {
                                name: value,
                                type: MeasureCriterionType.Range,
                                operator: [searchOperatorsList.selected, reversedOperator],
                                value: [
                                    value !== MeasureName.Square ? Utils.unitsToLinearMeter(
                                        searchValues[0],
                                        searchUnitsList.selected
                                    ) : Utils.unitsToSquareMeters(
                                        searchValues[0],
                                        searchUnitsList.selected
                                    ),
                                    value !== MeasureName.Square ? Utils.unitsToLinearMeter(
                                        searchValues[1],
                                        searchUnitsList.selected
                                    ) : Utils.unitsToSquareMeters(
                                        searchValues[1],
                                        searchUnitsList.selected
                                    )
                                ]
                            };

                            measurementCriterion.addCriterion( measurementCriteria );
                        } else {
                            let searchValue: string = '';
                            if (searchValue[0] !== '') {
                                searchValue = searchValue[0];
                            } else if (searchValue[1] !== '') {
                                searchValue = searchValue[1];
                            }
                            if (searchValue !== '') {
                                const measurementCriteria: MeasureCriterion = {
                                    name: value,
                                    type: MeasureCriterionType.Simple,
                                    operator: searchOperatorsList.selected,
                                    value: value !== MeasureName.Square ? Utils.unitsToLinearMeter(
                                        parseFloat(searchValue),
                                        searchUnitsList.selected
                                    ) : Utils.unitsToSquareMeters(
                                        parseFloat(searchValue),
                                        searchUnitsList.selected
                                    )
                                };

                                measurementCriterion.addCriterion( measurementCriteria );
                            }
                        }
                    }
                }
            });
        } else {
            criteriaAggregatorCopy.removeCriterion(SearchCriterionName.MeasureFilter);
        }

        // Отправить запрос для получения отфильтрованного ответа
        this.map.searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

        try {
            await this.map.searchManager.findNext();
        } finally {
            this.widgetProps.activeRequestCancelHandler = undefined;
            this.mapWindow.getTaskManager().showObjectPanel();
        }
    }

    private updateWorkspaceData() {
        if (this.workspaceData) {
            if (this.workspaceData.objectNumberSearch.searchHistory.length > 12) {
                this.workspaceData.objectNumberSearch.searchHistory.splice(12);
            }
            this.widgetProps.objectNumberSearchParams.searchHistory.splice(0);
            this.workspaceData.objectNumberSearch.searchHistory.forEach(historyItem => {
                let layerAlias = i18n.tc('phrases.Search across all maps');
                if (historyItem.layerXid) {
                    const layer = this.map.getVectorLayerByxId(historyItem.layerXid);
                    if (layer) {
                        layerAlias = layer.alias;
                    } else {
                        historyItem.layerXid = undefined;
                    }
                }

                this.widgetProps.objectNumberSearchParams.searchHistory.push({
                    id: historyItem.id,
                    text: historyItem.value + '(' + layerAlias + ')',
                });
            });

            this.writeWorkspaceData(true);
        }
    }

    /**
     * Проверить если заполнено измерений
     * @method checkMeasurementFilled
     * @return boolean
     */
    static checkMeasurementFilled(selectedSearchMeasurementList: SearchMeasurement[]) {
        const result = selectedSearchMeasurementList.find(
            measurement => measurement.searchValue.length === 0 || measurement.searchValue.find(value => !value) !== undefined
        );
        return selectedSearchMeasurementList.length !== 0 && result === undefined;
    }

    /**
     * Развернуть оператор сравнения
     * @method reverseMeasurementOperator
     * @param operator {MeasureOperator}
     */
    reverseMeasurementOperator(operator: MeasureOperator) {
        let reverse = operator;

        switch (operator) {
            case MeasureOperator.More:
                reverse = MeasureOperator.Less;
                break;
            case MeasureOperator.Less:
                reverse = MeasureOperator.More;
                break;
            case MeasureOperator.NotMore:
                reverse = MeasureOperator.NotLess;
                break;
            case MeasureOperator.NotLess:
                reverse = MeasureOperator.NotMore;
                break;
        }

        return reverse;
    }
}
