/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Компонент "Поиск по имени"                    *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import { GISWebServiceSEMode, SourceType } from '~/services/Search/SearchManager';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkSearchByNameWidget from '../task/GwtkSearchByNameWidget.vue';
import i18n from '@/plugins/i18n';
import { LogEventType } from '~/types/CommonTypes';
import Layer from '~/maplayers/Layer';
import GISWebServiceVectorLayer from '~/maplayers/GISWebServiceVectorLayer';
import { RscSemantic } from '~/services/RequestServices/RestService/Types';
import { MapObjectPanelState } from '~/taskmanager/TaskManager';
import { SemanticOperator } from '~/services/Search/criteria/SemanticSearchCriterion';
import Utils from '~/services/Utils';

export const START_SEARCH = 'gwtksearchbyname.startsearch';
export const CHANGE_VISIBLE_ON_SCALE = 'gwtksearchbyname.changevisibleonscale';
export const UPDATE_SEARCH_PROGRESS_BAR = 'gwtksearchbyname.searchrogressbar';
export const UPDATE_SEARCH_TEXT = 'gwtksearchbyname.updatesearchtext';
export const ABORT_SEARCH = 'gwtksearchbyname.abortsearch';
export const SELECT_SEARCH_LAYER = 'gwtksearchbyname.selectsearchlayer';
export const SELECT_SEARCH_SEMANTIC = 'gwtksearchbyname.selectsearchsemantic';
export const SELECT_SEARCH_BY_ALL_LAYERS = 'gwtksearchbyname.selectsearchbyalllayers';
export const SET_SEARCH_EXACT = 'gwtksearchbyname.setsearchexact';
export const SET_SEARCH_FROM_HISTORTY = 'gwtksearchbyname.setsearchfromhistory';
export const OPEN_HISTORY = 'gwtksearchbyname.openhistory';
export const RESET_ALL = 'gwtksearchbyname.resetall';
export const CLEAR_SEARCH_HISTORY = 'gwtksearchbyname.clearsearchhistory';

export type GwtkSearchByNameTaskState = {
    [START_SEARCH]: undefined;
    [CHANGE_VISIBLE_ON_SCALE]: WidgetParams['visibleOnCurrentScale'];
    [UPDATE_SEARCH_PROGRESS_BAR]: boolean;
    [UPDATE_SEARCH_TEXT]: string;
    [ABORT_SEARCH]: undefined;
    [SELECT_SEARCH_LAYER]: string;
    [SELECT_SEARCH_SEMANTIC]: string;
    [SELECT_SEARCH_BY_ALL_LAYERS]: undefined;
    [SET_SEARCH_EXACT]: boolean;
    [SET_SEARCH_FROM_HISTORTY]: number;
    [OPEN_HISTORY]: undefined;
    [RESET_ALL]: undefined;
    [CLEAR_SEARCH_HISTORY]: undefined | number;
}

type WidgetParams = {
    setState: GwtkSearchByNameTask['setState'];
    visibleOnCurrentScale: boolean; // поиск только видимых объектов в текущем м-бе
    searchProgressBar: boolean;
    searchText: string;
    checkedAllLayer: boolean;
    exact: boolean;
    layers: {
        xId: string,
        text: string,
        semanticName: string
    }[];
    currentLayerXId: string;
    semantics: RscSemantic[];
    semanticShortName: string;
    searchHistory: { text: string, id: number }[];
    openHistory: boolean;
}

type WorkSpaceData = {
    layers: {
        xId: string,
        semantic: {
            semantic?: string,
            semanticName: string
        }
    }[],
    byAllMaps: boolean,
    visibleOnly: boolean,
    currentLayerXId: string,
    exact: boolean,
    text: string,
    semanticShortName: string
}[];

/**
 * Компонент "Поиск по имени"
 * @class GwtkSearchByNameTask
 * @extends Task
 * @description Поиск объекта карты.
 */
export default class GwtkSearchByNameTask extends Task {
    protected workspaceData: WorkSpaceData = [];

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;
    private readonly GUID = Utils.generateGUID();
    private searchObjects: {
        layer: Layer,
        semantic: string
    }[] = [];

    /**
     * @constructor GwtkMapContentTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);
        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            visibleOnCurrentScale: false,
            searchProgressBar: false,
            searchText: '',
            checkedAllLayer: true,
            exact: false,
            layers: [],
            currentLayerXId: '',
            semantics: [],
            semanticShortName: '',
            searchHistory: [],
            openHistory: false
        };
    }

    setup() {
        super.setup();
        this.resetAll();
    }

    async resetAll() {
        this.updateSearchHistory();
        this.searchObjects = [];
        this.widgetProps.semanticShortName = this.GUID;
        this.widgetProps.visibleOnCurrentScale = false;
        this.widgetProps.searchText = '';
        this.widgetProps.checkedAllLayer = true;
        this.widgetProps.exact = false;
        this.widgetProps.currentLayerXId = '';
        this.widgetProps.layers = [];
        this.map.vectorLayers.forEach(layer => {
            if (layer instanceof GISWebServiceVectorLayer) {
                this.widgetProps.layers.push({
                    xId: layer.xId,
                    text: layer.alias,
                    semanticName: i18n.tc('searchbyname.By all semantics')
                });
                this.searchObjects.push({
                    layer: layer,
                    semantic: this.GUID
                });
            }
        });
        this.widgetProps.layers.sort((layerA, layerB) => Utils.sortAlphaNum(layerA.text, layerB.text));
        this.widgetProps.currentLayerXId = this.widgetProps.layers[0].xId;
        const semantic = await this.getCurrentLayerSemantics(this.widgetProps.currentLayerXId);
        if (semantic !== undefined) {
            this.widgetProps.semantics.splice(0, 0, ...semantic);
        }
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkSearchByNameWidget';
        const sourceWidget = GwtkSearchByNameWidget;
        this.mapWindow.registerComponent(nameWidget, sourceWidget);

        // Создание Vue компонента
        this.mapWindow.createWidget(nameWidget, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    private updateSearchHistory() {
        this.widgetProps.searchHistory = [];

        if (!this.workspaceData) {
            this.workspaceData = [];
        }

        for (let i = 0; i < this.workspaceData.length; i++) {
            const text = this.workspaceData[i].text;
            if (text != undefined) {
                this.widgetProps.searchHistory.push({ text, id: i });
            }
        }
    }

    setState<K extends keyof GwtkSearchByNameTaskState>(key: K, value: GwtkSearchByNameTaskState[K]) {
        switch (key) {
            case START_SEARCH:
                if (!this.widgetProps.checkedAllLayer) {
                    const searchObject = this.searchObjects.find((object) => object.layer.xId == this.widgetProps.currentLayerXId);
                    if (searchObject) {
                        this.searchViaSearchManager([searchObject]);
                    }
                } else {
                    this.searchViaSearchManager(this.searchObjects);
                }
                break;
            case CHANGE_VISIBLE_ON_SCALE:
                this.widgetProps.visibleOnCurrentScale = !value as WidgetParams['visibleOnCurrentScale'];
                break;
            case UPDATE_SEARCH_PROGRESS_BAR:
                this.widgetProps.searchProgressBar = value as boolean;
                break;
            case ABORT_SEARCH:
                this.abortSearch();
                break;
            case UPDATE_SEARCH_TEXT:
                this.widgetProps.searchText = value as string;
                break;
            case SELECT_SEARCH_LAYER:
                if (value !== null) {
                    this.selectSearchLayer(value as string);
                } else {
                    this.widgetProps.currentLayerXId = '';
                    this.widgetProps.semantics.splice(0);
                }
                break;
            case SELECT_SEARCH_SEMANTIC:
                if (value !== null) {
                    this.widgetProps.semanticShortName = value as string;
                    this.selectSemantic(value as string);
                } else {
                    this.widgetProps.semanticShortName = '';
                }
                break;
            case SELECT_SEARCH_BY_ALL_LAYERS:
                this.widgetProps.checkedAllLayer = !this.widgetProps.checkedAllLayer;
                break;
            case SET_SEARCH_EXACT:
                this.widgetProps.exact = value as boolean;
                break;
            case SET_SEARCH_FROM_HISTORTY:
                const historyId = value as number;
                this.setSearchFromHistory(historyId);
                break;
            case OPEN_HISTORY:
                this.widgetProps.openHistory = !this.widgetProps.openHistory;
                break;
            case RESET_ALL:
                this.resetAll();
                break;
            case CLEAR_SEARCH_HISTORY:
                this.clearSearchHistory(value as number);
                break;
            default:
                if (this._action) {
                    this._action.setState(key, value);
                }
        }
    }

    /**
     * Прервать поиск
     * @method abortSearch
     */
    private abortSearch() {
        const searchManager = this.mapWindow.getMap().searchManager;
        searchManager.stopSearch();
    }

    private clearSearchHistory(value: number) {
        const textForAll = 'searchbyname.Search history will be cleared';
        const textForOne = 'searchbyname.The item will be removed from the search history';
        this.mapWindow.showInputText({
            description: `${value == undefined ? i18n.t(textForAll) : i18n.t(textForOne) + ': ' + this.widgetProps.searchHistory[value].text}`
        }).then(() => {
            if (value == undefined) {
                this.workspaceData = [];
            } else {
                this.workspaceData.splice(value, 1);
            }
            this.writeWorkspaceData(true);
            this.updateSearchHistory();
            if (this.widgetProps.searchHistory.length === 0) {
                this.widgetProps.openHistory = false;
            }
        })
            .catch(error => {
                this.map.writeProtocolMessage({
                    text: i18n.tc('mymaps.My maps') + '. ' + i18n.tc('mymaps.Error deleting map on server') + '.',
                    description: error,
                    type: LogEventType.Error
                });
            });
    }

    checkForShowClearWorkspaceDataButton(): boolean {
        return true;
    }

    private async setSearchFromHistory(historyId: number) {
        this.widgetProps.exact = this.workspaceData[historyId].exact;
        this.widgetProps.visibleOnCurrentScale = this.workspaceData[historyId].visibleOnly;
        this.widgetProps.searchText = this.workspaceData[historyId].text;
        this.widgetProps.checkedAllLayer = this.workspaceData[historyId].byAllMaps;
        const layers = this.workspaceData[historyId].layers;
        let findError = false;
        for (let i = 0; i < layers.length; i++) {
            if (!this.widgetProps.layers.find((elem) => elem.xId === layers[i].xId)) {
                this.map.writeProtocolMessage({
                    text: i18n.tc('phrases.Recovery error'),
                    description: i18n.tc('searchbyname.Failed to recover data'),
                    type: LogEventType.Error,
                    display: true
                });
                this.resetAll();
                this.workspaceData.splice(historyId, 1);
                findError = true;
            } else {
                const semantic = (layers[i].semantic?.semantic == undefined) ? this.GUID : layers[i].semantic?.semantic;
                if (semantic) {
                    await this.selectSemantic(semantic, layers[i].xId);
                }
            }
        }
        if (findError) {
            this.writeWorkspaceData(true);
            return;
        }
        this.widgetProps.semanticShortName = this.workspaceData[historyId].semanticShortName;
        await this.selectSearchLayer(this.workspaceData[historyId].currentLayerXId);
    }

    private async selectSearchLayer(xId: string) {
        const result = await this.getCurrentLayerSemantics(xId);
        if (result !== undefined) {
            this.widgetProps.semantics.splice(0, this.widgetProps.semantics.length, ...result);
            this.widgetProps.currentLayerXId = xId;
            this.searchObjects.find((object) => {
                if (object.layer.xId == this.widgetProps.currentLayerXId) {
                    this.widgetProps.semanticShortName = object.semantic;
                }
            });
        }
    }

    private async selectSemantic(value: string, xId: string = this.widgetProps.currentLayerXId) {
        const objectIndex = this.searchObjects.findIndex(object => object.layer.xId == xId);
        this.searchObjects[objectIndex].semantic = value;
        const layerIndex = this.widgetProps.layers.findIndex(object => object.xId == xId);
        const result = await this.getCurrentLayerSemantics(xId);
        if (result) {
            const semantic = result?.find(semantic => semantic.shortname == value);
            if (semantic) {
                this.widgetProps.layers[layerIndex].semanticName = semantic.name;
            }
        }
    }

    private async getCurrentLayerSemantics(xId: string) {
        const layer = this.searchObjects.find((object) => object.layer.xId == xId)?.layer;
        let result = undefined;
        if (layer && layer.classifier) {
            const semantics = await layer.classifier.getLayerSemantics();
            if (semantics) {
                result = [] as RscSemantic[];

                for (let i = 0; i < semantics.length; i++) {
                    if (semantics[i].type == '0') {
                        result.push(semantics[i]);
                    }
                }
                result.sort((semanticA, semanticB) => Utils.sortAlphaNum(semanticA.name, semanticB.name));
                result.unshift({
                    name: i18n.tc('searchbyname.By all semantics'),
                    shortname: this.GUID
                } as RscSemantic);
            }
        }
        return result;
    }

    private searchViaSearchManager(searchObjects: { layer: Layer, semantic: string }[]) {
        const layers: Layer[] = [];
        for (let i = 0; i < searchObjects.length; i++) {
            const searchObject = searchObjects[i];
            if (searchObject.semantic.length > 0) {
                layers.push(searchObject.layer);
            }
        }
        if (layers.length > 0) {
            this.setState(UPDATE_SEARCH_PROGRESS_BAR, true);
            let value;
            const searchText = this.widgetProps.searchText;
            const exact = this.widgetProps.exact;

            const searchManager = this.mapWindow.getMap().searchManager;
            searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.All, layers);
            let criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();
            searchManager.clearSearchCriteriaAggregator();
            const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
            srsNameSearchCriterion.setValue(this.map.getCrsString());

            if (this.widgetProps.visibleOnCurrentScale) {
                const scale = this.mapWindow.getMap().getZoomScale(this.mapWindow.getMap().getZoom());
                if (scale) {
                    const scaleCriterion = criteriaAggregatorCopy.getObjectScaleSearchCriterion();
                    scaleCriterion.setValue(scale);
                    criteriaAggregatorCopy.setObjectScaleSearchCriterion(scaleCriterion);
                }
            }
            searchManager.updateSearchCriteriaAggregator(criteriaAggregatorCopy);

            const text = searchText.split('\n');
            let criteriaCounter = 0;
            for (let j = 0; j < text.length; j++) {
                if (!text[j].length) {
                    continue;
                }
                if (!exact) {
                    value = (text[j] === '*') ? '*' : '*' + text[j] + '*';
                } else {
                    value = text[j];
                }
                for (let i = 0; i < layers.length; i++) {
                    const searchObject = this.searchObjects.find((object) => object.layer == layers[i]);
                    if (searchObject) {
                        const xId = searchObject.layer.xId;
                        const layerAgregator = searchManager.getLayerCriteriaAggregatorCopy(xId);
                        if (layerAgregator) {
                            const criteriaAggregator = layerAgregator.copy();
                            const key = searchObject.semantic;

                            if (key == this.GUID) {
                                const semCriterion = criteriaAggregator.getSemListSearchCriterion();
                                semCriterion.addValue(value);
                                criteriaAggregator.removeCriterion('Text');
                                criteriaAggregator.setSemListSearchCriterion(semCriterion);
                            } else {
                                if (key) {
                                    const semanticCriterion = criteriaAggregator.getSemanticSearchCriterion();
                                    semanticCriterion.addSemanticCriterion({ key: key, operator: SemanticOperator.ContainsValue, value: value });
                                    semanticCriterion.setLogicalDisjunction(true);
                                    criteriaAggregator.removeCriterion('Text');
                                    criteriaAggregator.setSemanticSearchCriterion(semanticCriterion);
                                }
                            }
                            searchManager.setLayerCriteriaAggregator(criteriaAggregator);
                        }
                    }
                }
                criteriaCounter++;
            }       
            if (criteriaCounter === 0) {
                this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
                return;
            }

            let dataLayers = [];
            for (let i = 0; i < searchObjects.length; i++) {
                const layerIndex = this.widgetProps.layers.findIndex(layer => layer.xId == searchObjects[i].layer.xId);
                const semanticName = this.widgetProps.layers[layerIndex].semanticName;
                if (searchObjects[i].semantic == this.GUID) {
                    dataLayers.push({
                        xId: searchObjects[i].layer.xId,
                        semantic: {
                            semanticName: semanticName
                        }
                    });
                } else {
                    dataLayers.push({
                        xId: searchObjects[i].layer.xId,
                        semantic: {
                            semanticName: semanticName,
                            semantic: searchObjects[i].semantic
                        }
                    });
                }
            }

            if (!this.workspaceData) {
                this.workspaceData = [];
            }

            this.workspaceData.push({
                layers: dataLayers,
                byAllMaps: this.widgetProps.checkedAllLayer,
                visibleOnly: this.widgetProps.visibleOnCurrentScale,
                exact: this.widgetProps.exact,
                text: this.widgetProps.searchText,
                currentLayerXId: this.widgetProps.currentLayerXId,
                semanticShortName: this.widgetProps.semanticShortName
            });
            this.writeWorkspaceData(true);
            this.updateSearchHistory();

            searchManager.findNext().catch((error) => {
                this.map.writeProtocolMessage({
                    text: i18n.t('phrases.Search') + '. ' + i18n.t('phrases.Error'),
                    description: error,
                    type: LogEventType.Error
                });
            }).finally(() => {
                this.mapWindow.getTaskManager().showObjectPanel(MapObjectPanelState.showObjects);
                this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
            });
        }
    }
}
